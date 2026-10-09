"""Pinned ordinary Transformers assisted generation and honest work recording.

python native_speculation.py --model model-cache --output native-diagnostic.json
The fixed study uses speculation_study.py. Optional larger-checkpoint functions
are defined but never invoked by this command or the prescribed Pythia study.
"""

import argparse
import copy
from contextlib import contextmanager
import hashlib
import json
from pathlib import Path
import time
import types
import traceback
from unittest.mock import patch

import torch
from torch import nn
from transformers import AutoModelForCausalLM, AutoTokenizer, GenerationConfig
from transformers.generation.utils import _speculative_sampling

HERE = Path(__file__).resolve().parent


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def verify_files(directory):
    report = json.loads((HERE/'model-source-report.json').read_text(encoding='utf8'))
    for row in report['files']:
        path = Path(directory)/row['name']
        if path.stat().st_size!=row['bytes'] or digest(path)!=row['sha256']:
            raise ValueError(f'Pinned model identity mismatch: {row["name"]}')
    return report


def load_pair(directory):
    verify_files(directory)
    tokenizer = AutoTokenizer.from_pretrained(directory,local_files_only=True)
    target = AutoModelForCausalLM.from_pretrained(directory,local_files_only=True,
                 dtype=torch.float32,attn_implementation='eager').cpu().eval()
    if len(target.gpt_neox.layers)!=6:
        raise ValueError('This protocol expects the pinned six-block Pythia target.')
    draft = copy.deepcopy(target)
    draft.gpt_neox.layers = nn.ModuleList(list(draft.gpt_neox.layers)[:3])
    draft.config.num_hidden_layers = 3
    draft.gpt_neox.config.num_hidden_layers = 3
    for index,layer in enumerate(draft.gpt_neox.layers):
        layer.attention.layer_idx = index
    draft.eval()
    return target,draft,tokenizer


def config(model,mode,cap,lookahead=3):
    if mode not in ('greedy','sample') or cap<1 or lookahead<1:
        raise ValueError('Mode greedy/sample, positive cap and positive draft cap required.')
    settings = copy.deepcopy(model.generation_config)
    settings.max_new_tokens = cap
    settings.do_sample = mode=='sample'
    settings.temperature = .8 if mode=='sample' else 1.0
    settings.top_k = 0
    settings.top_p = 1.0
    settings.use_cache = True
    # The pinned default creates DynamicCache. Explicit initialization conflicts
    # with the assistant's carried cache object on its second candidate round.
    settings.cache_implementation = None
    settings.num_beams = 1
    settings.num_return_sequences = 1
    settings.num_assistant_tokens = lookahead
    settings.num_assistant_tokens_schedule = 'constant'
    settings.assistant_confidence_threshold = 0.0
    settings.assistant_ensemble_weight = None
    settings.assistant_early_exit = None
    settings.use_mtp = False
    settings.prompt_lookup_num_tokens = None
    settings.pad_token_id = model.config.eos_token_id
    return settings


@contextmanager
def observe_calls(target,draft,rich=False,observer=None):
    """Counters are identical for all measured arms; rich hooks are diagnostic."""
    record = {'target_calls':0,'draft_calls':0,'target_rows':0,'draft_rows':0,
              'rounds':[],'instrumentation':'Forward hooks count calls and input rows.'}
    latest = {}
    observe = observer or (lambda event: None)
    handles = []
    for role,model in [('target',target),('draft',draft)]:
        def hook(module,args,kwargs,output,role=role):
            ids = kwargs.get('input_ids',args[0] if args else None)
            record[role+'_calls'] += 1
            record[role+'_rows'] += int(ids.shape[-1]) if ids is not None else 0
            if rich and role=='target':
                latest['cache'] = output.past_key_values
                latest['shape'] = list(output.logits.shape)
        handles.append(model.register_forward_hook(hook,with_kwargs=True))
    had_own = '_get_candidate_generator' in target.__dict__
    own = target.__dict__.get('_get_candidate_generator')
    original = target._get_candidate_generator
    if rich:
        def factory(self,*args,**kwargs):
            candidate = original(*args,**kwargs)
            get = candidate.get_candidates
            update = candidate.update_candidate_strategy
            def get_observed(input_ids,*args,**kwargs):
                observe({'event':'native-candidate-start','prefix_ids':input_ids[0].tolist()})
                ids,logits = get(input_ids,*args,**kwargs)
                prefix_length = input_ids.shape[-1]
                proposed = ids[0,prefix_length:].tolist()
                row = {'prefix_ids':input_ids[0].tolist(),'candidate_ids':proposed,
                       'proposal_score_shape':None if logits is None else list(logits.shape)}
                if logits is not None:
                    probs = logits.softmax(-1)
                    row['q_selected'] = [float(probs[0,i,token]) for i,token in enumerate(proposed)]
                record['rounds'].append(row)
                observe({'event':'native-candidates','round':row.copy()})
                return ids,logits
            def update_observed(input_ids,scores,num_matches):
                row = record['rounds'][-1]
                row['emitted_ids'] = input_ids[0,len(row['prefix_ids']):].tolist()
                row['processed_target_score_shape'] = list(scores.shape)
                row['forward_logits_shape'] = latest.get('shape')
                row['native_post_stop_n_matches'] = int(num_matches)
                row['warning'] = 'After stop cropping n_matches equals emitted_count-1, not necessarily accepted proposals.'
                row['target_cache_after_crop'] = int(latest['cache'].get_seq_length())
                probs = scores.softmax(-1)
                row['p_selected_candidates'] = [float(probs[0,i,token]) for i,token in enumerate(row['candidate_ids'])]
                observe({'event':'native-round-update','round':row.copy()})
                return update(input_ids,scores,num_matches)
            candidate.get_candidates = get_observed
            candidate.update_candidate_strategy = update_observed
            return candidate
        target._get_candidate_generator = types.MethodType(factory,target)
    try:
        yield record
    finally:
        for handle in handles:
            handle.remove()
        if rich:
            if had_own:
                target._get_candidate_generator = own
            else:
                del target._get_candidate_generator


@torch.inference_mode()
def generate_one(target,draft,prompt,mode,lookahead,seed,cap=24,rich=False,observer=None):
    observe = observer or (lambda event: None)
    if not prompt:
        raise ValueError('Nonempty token prefix required.')
    ids = torch.tensor([prompt],dtype=torch.long)
    torch.manual_seed(seed)
    settings = config(target,mode,cap,max(1,lookahead))
    draft.generation_config = config(draft,mode,cap,max(1,lookahead))
    kwargs = {} if lookahead==0 else {'assistant_model':draft}
    # Encoding, hook installation and decode text are outside measured generation.
    # Hook execution is inside and is deliberately present in every arm.
    observe({'event':'native-call-start','prompt_ids':prompt,'mode':mode,
             'lookahead':lookahead,'seed':seed,'cap':cap,'rich':rich})
    with observe_calls(target,draft,rich,observer) as work:
        begin = time.perf_counter_ns()
        try:
            output = target.generate(input_ids=ids,attention_mask=torch.ones_like(ids),
                                    generation_config=settings,**kwargs)
        except Exception:
            elapsed = time.perf_counter_ns()-begin
            observe({'event':'native-call-exception','elapsed_ns':elapsed,'work':work,
                     'failure':traceback.format_exc()})
            raise
        elapsed = time.perf_counter_ns()-begin
    emitted = output[0,len(prompt):].tolist()
    observe({'event':'native-call-return','prompt_ids':prompt,'mode':mode,
             'lookahead':lookahead,'seed':seed,'ids':emitted,'elapsed_ns':elapsed,
             'work':work,'config':settings.to_dict()})
    eos = target.config.eos_token_id
    if eos in emitted and emitted.index(eos)!=len(emitted)-1:
        raise AssertionError('Output continued after EOS.')
    if not 1<=len(emitted)<=cap:
        raise AssertionError('Invalid output count.')
    return {'prompt_ids':prompt,'mode':mode,'lookahead':lookahead,'seed':seed,
            'ids':emitted,'elapsed_ns':elapsed,'ns_per_emitted_token':elapsed/len(emitted),
            'stop':'eos' if emitted[-1]==eos else 'cap','work':work,
            'config':settings.to_dict()}


def finite_helper_probe():
    """No neural forward: expose the pinned <= finite-endpoint distinction."""
    candidates = torch.tensor([[0]])
    q_logits = torch.tensor([[[0.,-torch.inf]]],dtype=torch.float64)
    p_logits = torch.tensor([[[-torch.inf,0.],[-torch.inf,0.]]],dtype=torch.float64)
    with patch('torch.rand_like',side_effect=lambda value:torch.zeros_like(value)):
        output,matches = _speculative_sampling(candidates,q_logits,1,p_logits,
                                              assistant_ensemble_weight=None)
    assert output.tolist()==[[0,1]] and int(matches)==1
    return {'uniform':0,'p_proposal':0,'q_proposal':1,'native_output':output.tolist(),
            'native_matches':int(matches),'strict_reference_accepts':False,
            'scope':'Constructed finite-RNG endpoint; not a typical sampled run or ideal-law counterexample.'}


def prompt_lookup(model,input_ids,cap=20):
    """Ordinary optional no-draft-model route; not executed in our workload."""
    return model.generate(input_ids=input_ids,prompt_lookup_num_tokens=2,
                          do_sample=False,max_new_tokens=cap)


def early_exit(model,input_ids,exit_layer=4,cap=20,trained_checkpoint=False):
    """Caller supplies a checkpoint actually trained for early-exit logits.

    Example family: facebook/layerskip-llama3.2-1B. A config depth alone cannot
    certify that training condition. No acquisition occurs inside this helper.
    """
    if not trained_checkpoint or not 0<exit_layer<model.config.num_hidden_layers:
        raise ValueError('Confirm trained early-exit checkpoint and interior layer.')
    return model.generate(input_ids=input_ids,assistant_early_exit=exit_layer,
                          do_sample=False,max_new_tokens=cap)


def checkpoint_mtp(model,input_ids,cap=20):
    """Requires supported checkpoint MTP weights, not fresh Medusa-like heads.

    Examples: supported DeepSeek-V3 or GLM-4.5 checkpoints. The installed loader
    checks known weight patterns; the configuration test is necessary only.
    """
    if not getattr(model.config.get_text_config(),'num_mtp_layers',0):
        raise ValueError('No configured checkpoint-trained MTP modules.')
    return model.generate(input_ids=input_ids,use_mtp=True,do_sample=False,
                          max_new_tokens=cap)


def diagnostic(directory,output):
    if output.exists():
        raise FileExistsError('Diagnostic exists; preserve it instead of replaying.')
    # The protocol runner establishes an exclusive marker before this function.
    torch.set_num_threads(2)
    report = {'scope':'Two separate native diagnostic calls, maximum16 emitted tokens.',
              'model':verify_files(directory),'prompt_text':'The small red boat',
              'rows':[],'passed':False}
    journal = output.with_suffix('.jsonl')
    with journal.open('x',encoding='utf8') as stream:
        stream.write(json.dumps({'begin':True,'source_sha256':digest(__file__)})+'\n')
    def observe(event):
        with journal.open('a',encoding='utf8') as stream:
            stream.write(json.dumps(event)+'\n')
            stream.flush()
    try:
        target,draft,tokenizer = load_pair(directory)
        prompt = tokenizer(report['prompt_text'],add_special_tokens=False).input_ids
        report['helper'] = finite_helper_probe()
        for mode,seed in [('greedy',401),('sample',409)]:
            row = generate_one(target,draft,prompt,mode,3,seed,cap=8,rich=True,observer=observe)
            report['rows'].append(row)
            with journal.open('a',encoding='utf8') as stream:
                stream.write(json.dumps(row)+'\n')
        report['passed'] = True
    except Exception:
        report['failure'] = traceback.format_exc()
    finally:
        with output.open('x',encoding='utf8') as stream:
            json.dump(report,stream,indent=2)
    return report


if __name__=='__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args = parser.parse_args()
    marker = args.output.with_suffix('.started.json')
    with marker.open('x',encoding='utf8') as stream:
        json.dump({'program_sha256':digest(__file__),'diagnostic_output':str(args.output)},stream)
    report = diagnostic(args.model,args.output)
    print(json.dumps(report,indent=2))
    if not report['passed']:
        raise SystemExit(1)
