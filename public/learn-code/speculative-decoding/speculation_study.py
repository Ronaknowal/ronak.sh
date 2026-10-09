"""Prepare a source-bound protocol, then execute each declared stage once.

python speculation_study.py prepare --model model-cache --record protocol.json
python speculation_study.py run --model model-cache --record protocol.json --output run --stage finite
Stages: finite, cache, tree, heads, native, study. Inspect all source and the
prepared protocol before run. Existing stage markers/results are never replaced.
"""

import argparse
import hashlib
import importlib
import json
from pathlib import Path
import platform
import traceback

import torch
import transformers
from transformers import AutoTokenizer
from native_speculation import HERE, digest, verify_files, load_pair, generate_one, diagnostic

STAGES = ['finite','cache','tree','heads','native','study']


def write_new(path,data):
    with path.open('x',encoding='utf8') as stream:
        json.dump(data,stream,indent=2)
        stream.write('\n')


def append(path,data):
    with path.open('a',encoding='utf8') as stream:
        stream.write(json.dumps(data)+'\n')
        stream.flush()


def prepare(directory,record):
    if record.exists():
        raise FileExistsError(record)
    model = verify_files(directory)
    tokenizer = AutoTokenizer.from_pretrained(directory,local_files_only=True)
    selected = json.loads((HERE/'selected-prompts.json').read_text(encoding='utf8'))
    lines = [line for line in (HERE/'alice-heldout.txt').read_text(encoding='utf8').splitlines()
             if any(character.isalpha() for character in line)]
    if len(lines)!=4:
        raise ValueError('Expected the same four complete prose lines.')
    prompts = []
    for index,(line,old) in enumerate(zip(lines,selected['prompts'])):
        ids = tokenizer(line,add_special_tokens=False).input_ids
        if ids[:32]!=old['selected_ids'] or len(ids)!=old['source_token_count']:
            raise ValueError('Tokenizer-only extraction disagrees with reviewed IDs.')
        prompts.append({'id':f'line-{index+1}','source_text':line,
                        'source_length':len(ids),'ids':ids[:32]})
    files = sorted([*HERE.glob('*.py'),*HERE.glob('*.txt'),
                    HERE/'alice-provenance.json',HERE/'model-source-report.json',
                    HERE/'selected-prompts.json'])
    protocol = {'model':model,'files':[{'name':p.name,'sha256':digest(p)} for p in files],
                'versions':{'torch':torch.__version__,'transformers':transformers.__version__},
                'threads':2,'dtype':'float32','attention':'eager','cache':'dynamic',
                'prompts':prompts,'modes':['greedy','sample'],'arms':[0,1,3,5],
                'sample':{'temperature':.8,'top_k':0,'top_p':1.0},
                'repetition_seeds':[101,211,307],'warmup_seed':701,'cap':24,
                'assistant':{'layers':3,'schedule':'constant','confidence_threshold':0.,'ensemble':None},
                'order':'All 32 warmups in prompt/mode/arm order; then repetition/prompt/mode, arms cyclically rotated by (repetition_index+prompt_index+mode_index)%4.',
                'study_budget':{'warmup_calls':32,'measured_calls':96,'all_calls':128,'maximum_emitted_tokens':3072},
                'diagnostic':{'text':'The small red boat','lookahead':3,'cap':8,
                              'greedy_seed':401,'sample_seed':409,'calls':2,'maximum_emitted_tokens':16},
                'mechanical':{'cache_seed':173,'cache_dtype':'float64','cache_target_layers':3,'cache_draft_layers':1,
                              'tree_seed':181,'tree_dtype':'float64','heads_seed':191,
                              'heads_dtype':'float64','head_updates':{'frozen':1,'joint':1},'head_lr':.01,
                              'logit_atol':1e-12,'logit_rtol':1e-12},
                'unexecuted_variants':['prompt_lookup','early_exit','checkpoint_mtp'],
                'stages':STAGES,'failure_rule':'Exclusive markers prevent repeats. Preserve partial journal and exception, stop for review; no automatic recovery or budget extension.',
                'interpretation':'Four text prefixes on CPU. No quality claim, GPU forecast or predetermined speedup. Greedy mismatch is retained; sample strings need not match under paired seeds.'}
    write_new(record,protocol)
    return {'prepared':True,'sha256':digest(record),'model_loaded':False}


def weights_digest(model):
    result = hashlib.sha256()
    for name,tensor in sorted(model.state_dict().items()):
        result.update(name.encode())
        result.update(str(tuple(tensor.shape)).encode())
        result.update(tensor.detach().cpu().contiguous().numpy().tobytes())
    return result.hexdigest()


def measured_study(directory,protocol,journal):
    def observe(event):
        append(journal,event)
    target,draft,tokenizer = load_pair(directory)
    before = [weights_digest(target),weights_digest(draft)]
    records = []
    warms = []
    for prompt in protocol['prompts']:
        for mode in protocol['modes']:
            for arm in protocol['arms']:
                row = generate_one(target,draft,prompt['ids'],mode,arm,
                                   protocol['warmup_seed'],protocol['cap'],observer=observe)
                row.update(prompt_id=prompt['id'],phase='warmup')
                warms.append(row)
                append(journal,{'call':row})
    for repetition,seed in enumerate(protocol['repetition_seeds']):
        for prompt_index,prompt in enumerate(protocol['prompts']):
            for mode_index,mode in enumerate(protocol['modes']):
                shift = (repetition+prompt_index+mode_index)%len(protocol['arms'])
                arms = protocol['arms'][shift:]+protocol['arms'][:shift]
                for arm in arms:
                    row = generate_one(target,draft,prompt['ids'],mode,arm,seed,protocol['cap'],observer=observe)
                    row.update(prompt_id=prompt['id'],repetition=repetition,phase='measured')
                    records.append(row)
                    append(journal,{'call':row})
    if len(warms)!=32 or len(records)!=96:
        raise AssertionError('Call budget mismatch.')
    if sum(len(row['ids']) for row in warms+records)>3072:
        raise AssertionError('Emitted-token bound exceeded.')
    after = [weights_digest(target),weights_digest(draft)]
    if after!=before:
        raise AssertionError('Inference changed model weights.')
    paired = []
    for row in records:
        if row['lookahead']==0:
            continue
        baseline = next(item for item in records if item['lookahead']==0
                        and item['prompt_id']==row['prompt_id'] and item['mode']==row['mode']
                        and item['repetition']==row['repetition'])
        paired.append({'prompt_id':row['prompt_id'],'mode':row['mode'],
                       'repetition':row['repetition'],'lookahead':row['lookahead'],
                       'whole_call_speedup':baseline['elapsed_ns']/row['elapsed_ns'],
                       'ns_per_token_ratio':baseline['ns_per_emitted_token']/row['ns_per_emitted_token'],
                       'greedy_ids_equal':None if row['mode']=='sample' else baseline['ids']==row['ids'],
                       'baseline_tokens':len(baseline['ids']),'speculative_tokens':len(row['ids'])})
    return {'passed_execution':True,'hardware':platform.platform(),'weights_before':before,'weights_after':after,
            'warmups':warms,'records':records,'paired':paired,
            'greedy_all_equal':all(row['greedy_ids_equal'] is not False for row in paired),
            'interpretation':protocol['interpretation']}


def run(directory,record,output,stage):
    protocol = json.loads(record.read_text(encoding='utf8'))
    for row in protocol['files']:
        if digest(HERE/row['name'])!=row['sha256']:
            raise ValueError('Frozen program/data changed: '+row['name'])
    if protocol['versions']!={'torch':torch.__version__,'transformers':transformers.__version__}:
        raise ValueError('Prepared dependency versions changed.')
    verify_files(directory)
    output.mkdir(parents=True,exist_ok=True)
    for previous in STAGES[:STAGES.index(stage)]:
        saved = json.loads((output/(previous+'.json')).read_text(encoding='utf8'))
        if not saved['passed'] or saved['protocol_sha256']!=digest(record):
            raise ValueError('Required earlier stage is not a successful matching run.')
    destination = output/(stage+'.json')
    journal = output/(stage+'.jsonl')
    marker = output/(stage+'.started.json')
    if destination.exists() or journal.exists():
        raise FileExistsError('Existing evidence: inspect, do not replay.')
    write_new(marker,{'protocol_sha256':digest(record),'stage':stage})
    with journal.open('x',encoding='utf8') as stream:
        stream.write(json.dumps({'begin':True,'stage':stage})+'\n')
    torch.set_num_threads(protocol['threads'])
    report = {'stage':stage,'protocol_sha256':digest(record),'passed':False}
    try:
        if stage=='finite':
            report['result'] = {name:getattr(importlib.import_module(name),function)()
                                for name,function in [('speculative_math','verify'),('speculative_decode','verify'),
                                                      ('sequence_law','verify'),('practice_answers','answers')]}
        elif stage in ['cache','tree','heads']:
            module = {'cache':'speculative_cache','tree':'tree_verification','heads':'proposal_heads'}[stage]
            report['result'] = importlib.import_module(module).verify(observer=lambda event:append(journal,event))
        elif stage=='native':
            report['result'] = diagnostic(directory,output/'native-detail.json')
            if not report['result']['passed']:
                raise RuntimeError('Native diagnostics failed; retain all detail.')
        else:
            report['result'] = measured_study(directory,protocol,journal)
        report['passed'] = True
    except Exception:
        report['failure'] = traceback.format_exc()
    finally:
        write_new(destination,report)
    return report


if __name__=='__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['prepare','run'])
    parser.add_argument('--model',type=Path,required=True)
    parser.add_argument('--record',type=Path,required=True)
    parser.add_argument('--output',type=Path)
    parser.add_argument('--stage',choices=STAGES)
    args = parser.parse_args()
    if args.action=='run' and (args.output is None or args.stage is None):
        parser.error('run requires --output and --stage')
    result = prepare(args.model,args.record) if args.action=='prepare' else run(args.model,args.record,args.output,args.stage)
    print(json.dumps(result,indent=2))
    if result.get('passed') is False:
        raise SystemExit(1)
