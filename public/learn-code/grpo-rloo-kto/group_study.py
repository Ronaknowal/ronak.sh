"""Freeze a concrete protocol, then run each predeclared stage at most once.

Prepare (tokenizer/data only):
python group_study.py prepare --model ./response-17/selected --data ./data --protocol ./protocol.json
Execute only after reviewing that exact protocol and source:
python group_study.py execute --protocol ./protocol.json --output ./group-study
Completed stages are conserved only when program, dependency, model, data,
protocol and recorded-output hashes all still match. Partial stages are retained.
"""
import argparse
import gc
import hashlib
import importlib.metadata
import inspect
import json
from pathlib import Path

import numpy as np
import torch
from transformers import AutoTokenizer
from trl import GRPOConfig, GRPOTrainer, KTOConfig, KTOTrainer, RLOOConfig, RLOOTrainer

from group_estimators import METHODS, enumerate_distribution, reward_budget
from online_preferences import load_policy, run as scratch_run
from sft_data import LABELS, encode_record, load_source
from sft_evaluate import constrained_classification
from trl_group_training import configuration as group_configuration, run as native_group_run
from trl_kto import configuration as kto_configuration, run as native_kto_run


HERE = Path(__file__).resolve().parent
MODEL_SHA = '8ffe40fc676d22d608b58b35af11bf467c36981dbb3ccfe373a7d574bd8251cd'


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def save_new(path,value):
    with Path(path).open('x',encoding='utf-8') as handle:
        json.dump(value,handle,indent=2,ensure_ascii=False)
        handle.write('\n')


def file_binding(path,role):
    path = Path(path).resolve()
    return {'path':str(path),'role':role,'sha256':digest(path),'bytes':path.stat().st_size}


def source_bindings(model,data):
    paths = [(path,'program') for path in sorted(HERE.glob('*.py'))]
    paths += [(Path(data)/f'{split}.tsv','data') for split in ('train','dev','test')]
    paths += [(Path(model)/name,'model or tokenizer') for name in
              ('model.safetensors','config.json','generation_config.json','tokenizer.json','tokenizer_config.json')]
    paths += [(Path(inspect.getfile(cls)),'pinned native implementation') for cls in
              (GRPOTrainer,GRPOConfig,RLOOTrainer,RLOOConfig,KTOTrainer,KTOConfig)]
    # nanstd and the native selective-score primitive are causal dependencies too.
    import trl.trainer.utils as native_utils
    paths.append((Path(inspect.getfile(native_utils)),'pinned native utilities'))
    return [file_binding(path,role) for path,role in paths]


def prepare(model,data,destination):
    model,data = Path(model).resolve(),Path(data).resolve()
    if digest(model/'model.safetensors') != MODEL_SHA:
        raise ValueError('The recorded study uses the exact accepted SFT response-17 checkpoint.')
    tokenizer = AutoTokenizer.from_pretrained(model,local_files_only=True)
    source = load_source(data)
    train = sorted(source['train'],key=lambda row:row['id'])[:16]
    test = sorted(source['test'],key=lambda row:row['id'])[:32]
    spans = []
    for rows in (train,test):
        for row in rows:
            for candidate in LABELS:
                encoded = encode_record(row,tokenizer,candidate=candidate)
                spans.append({'split':row['split'],'id':row['id'],'candidate':candidate,
                              'gold':row['label'],'ids':encoded['ids'],
                              'prompt_ids':encoded['prompt_ids'],'boundary':encoded['boundary'],
                              'eos_id':encoded['eos_id']})
    protocol = {
        'kind':'Prospective GRPO/RLOO/KTO estimator and interface study',
        'boundary':'Prepared tokenizer/data spans only; no model scoring, generation or optimizer execution.',
        'model':str(model),'data':str(data),'model_weights_sha256':MODEL_SHA,
        'versions':{name:importlib.metadata.version(name) for name in ('trl','transformers','torch','numpy','datasets')},
        'source_counts':{name:len(rows) for name,rows in source.items()},
        'train_ids':[r['id'] for r in train],'test_ids':[r['id'] for r in test],
        'candidate_order':list(LABELS),'encoded_candidates':spans,
        'exact_study':{'group_sizes':[2,4],'methods':list(METHODS),'constant_baseline':.5,
                       'std_correction':1,'epsilon':1e-4,'budgets':[4,8,16,32],
                       'reward':'one if candidate equals gold, else zero',
                       'target':'three-candidate-logit gradient of restricted-policy expected reward',
                       'selection':'all32 fixed records, no checkpoint selection'},
        'native':{'methods':['grpo','rloo','kto'],'steps_each':2,'seed':71,'data_seed':71,
                  'optimizer':'SGD','learning_rate':1e-5,'weight_decay':0.,'scheduler':'constant',
                  'gradient_clipping':0.,'actual_batch_size':4,'gradient_accumulation':1,
                  'disable_dropout':True,'gradient_checkpointing':False,'dtype':'float32','device':'CPU'},
        'online':{'group_size':4,'max_new_tokens':8,'temperature':1.,'top_p':1.,'top_k':0,
                  'forced_eos':False,'mask_truncated_completions':False,'beta':.01,'epsilon':.2,
                  'num_iterations':1,'grpo_loss_type':'grpo','grpo_scale_rewards':'group',
                  'grpo_importance':'token','grpo_use_bias_correction_kl':False,
                  'rloo_normalize_advantages':False,'reward':'strict retained label match; validity and EOS separate'},
        'kto':{'records':48,'ordering':'source ID then fixed candidate order','beta':.1,
               'desirable_weight':2.,'undesirable_weight':1.,'sequential':True,'max_length':64,
               'precompute_ref_log_probs':False,'desirable':'candidate equals retained gold label',
               'reference':'actual native cyclic mismatch within microbatch4, detached mean clamp'},
        'scratch':{'methods':['grpo','rloo'],'steps_each':2,'seed':73,
                   'prompt_order':'torch.randperm of16 sorted records after model loading, no replacement for2steps'},
        'evaluation':{'fixed_test_records':32,'greedy_cap':8,'candidate_scoring':'sequence sum including EOS',
                       'metrics':['pooled response NLL','strict free accuracy','valid label rate','confusion','candidate accuracy'],
                       'inference_claim':'two updates are interface observations, not convergence or superiority'},
        'stages':['finite','scratch-grpo','scratch-rloo','native-grpo','native-rloo','native-kto'],
        'inputs':source_bindings(model,data),
        'resolved_native_configs':{
            'grpo':group_configuration('grpo',Path('native-grpo')/'trainer').to_dict(),
            'rloo':group_configuration('rloo',Path('native-rloo')/'trainer').to_dict(),
            'kto':kto_configuration(Path('native-kto')/'trainer').to_dict(),
        },
    }
    save_new(destination,protocol)
    return protocol


def guard(protocol_path):
    protocol = json.loads(Path(protocol_path).read_text(encoding='utf-8'))
    for item in protocol['inputs']:
        if digest(item['path']) != item['sha256']:
            raise ValueError(f"Frozen {item['role']} changed: {item['path']}")
    for name,version in protocol['versions'].items():
        if importlib.metadata.version(name) != version:
            raise ValueError(f'Pinned environment changed: {name}')
    return protocol,digest(protocol_path)


def finite_study(protocol,output):
    output.mkdir(parents=True,exist_ok=False)
    torch.set_num_threads(2)
    model,tokenizer = load_policy(protocol['model'])
    source = load_source(protocol['data'])
    indexed = {row['id']:row for row in source['test']}
    rows = [indexed[identity] for identity in protocol['test_ids']]
    scored = constrained_classification(model,tokenizer,rows)
    results = []
    for row,measured in zip(rows,scored,strict=True):
        logps = np.asarray(measured['candidate_logp'],dtype=np.float64)
        weights = np.exp(logps-logps.max())
        probabilities = weights/weights.sum()
        rewards = np.asarray([float(label==row['label']) for label in LABELS])
        comparisons = []
        for size in protocol['exact_study']['group_sizes']:
            for method in METHODS:
                distribution = enumerate_distribution(probabilities,rewards,size,method)
                distribution['budget_results'] = [reward_budget(distribution,budget)
                    for budget in protocol['exact_study']['budgets']]
                comparisons.append(distribution)
        results.append({'id':row['id'],'verse':row['verse'],'gold':row['label'],
                        'candidate_logp':logps.tolist(),'restricted_probabilities':probabilities.tolist(),
                        'comparisons':comparisons})
    report = {'kind':'exact finite enumeration at measured three-candidate probabilities',
              'model_weights_sha256':MODEL_SHA,'rows':results,'records':len(results),
              'boundary':'Restricted candidate-logit estimators; not unconstrained generation or neural-parameter gradient distributions.'}
    save_new(output/'report.json',report)
    return report


def run_stage(name,runner,output,protocol_path):
    _,protocol_hash = guard(protocol_path)
    folder = output/name
    terminal = output/f'{name}-terminal.json'
    if terminal.exists():
        previous = json.loads(terminal.read_text(encoding='utf-8'))
        if previous['protocol_sha256'] != protocol_hash or digest(folder/'report.json') != previous['report_sha256']:
            raise ValueError(f'Completed {name} is not conserved under the current protocol/output.')
        return {'name':name,'status':'conserved','report_sha256':previous['report_sha256']}
    if folder.exists():
        raise FileExistsError(f'Partial {name} is retained. Inspect its evidence; do not automatically replay it.')
    runner(folder)
    receipt = {'name':name,'status':'executed','protocol_sha256':protocol_hash,
               'report_sha256':digest(folder/'report.json')}
    save_new(terminal,receipt)
    gc.collect()
    return receipt


def execute(protocol_path,output):
    protocol,protocol_hash = guard(protocol_path)
    output.mkdir(parents=True,exist_ok=True)
    identity = output/'protocol-identity.json'
    if identity.exists():
        if json.loads(identity.read_text(encoding='utf-8'))['sha256'] != protocol_hash:
            raise ValueError('This output directory belongs to a different prospective protocol.')
    else:
        if any(output.iterdir()):
            raise ValueError('Use a clean output directory for a new frozen protocol.')
        save_new(identity,{'sha256':protocol_hash})
    model,data = protocol['model'],protocol['data']
    runners = {
        'finite':lambda folder:finite_study(protocol,folder),
        'scratch-grpo':lambda folder:scratch_run(model,data,'grpo',folder),
        'scratch-rloo':lambda folder:scratch_run(model,data,'rloo',folder),
        'native-grpo':lambda folder:native_group_run(model,data,'grpo',folder),
        'native-rloo':lambda folder:native_group_run(model,data,'rloo',folder),
        'native-kto':lambda folder:native_kto_run(model,data,folder),
    }
    receipts = [run_stage(name,runners[name],output,protocol_path) for name in protocol['stages']]
    return {'protocol_sha256':protocol_hash,'stages':receipts}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command',required=True)
    preparation = sub.add_parser('prepare')
    preparation.add_argument('--model',type=Path,required=True)
    preparation.add_argument('--data',type=Path,required=True)
    preparation.add_argument('--protocol',type=Path,required=True)
    execution = sub.add_parser('execute')
    execution.add_argument('--protocol',type=Path,required=True)
    execution.add_argument('--output',type=Path,required=True)
    args = parser.parse_args()
    if args.command=='prepare':
        value = prepare(args.model,args.data,args.protocol)
        print(json.dumps({'protocol':str(args.protocol),'inputs':len(value['inputs']),
                          'tokenized_candidate_records':len(value['encoded_candidates'])}))
    else:
        print(json.dumps(execute(args.protocol,args.output)))


if __name__ == '__main__':
    main()
