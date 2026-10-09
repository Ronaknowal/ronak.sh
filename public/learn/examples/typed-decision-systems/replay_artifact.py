"""Finite learning/parity checks and a fingerprinted local deployment replay.

python replay_artifact.py finite --output results/finite.json
python replay_artifact.py package --scratch results/scratch --native results/laya \
    --calibration results/calibration.json --routing results/routing.json \
    --checkpoint /local/laya --checkpoint-manifest model-source.json \
    --artifact-dir results/artifacts
python replay_artifact.py saved --scratch results/scratch --native results/laya \
    --calibration results/calibration.json --routing results/routing.json \
    --artifact-dir results/artifacts --shifts data/shifts.json --output results/replay.json
No new fit in saved mode. One predeclared scratch forward per valid shift;
one fixed first-test-batch replay plus equivalent SDPA/padded batches per seed.
"""
import argparse
import copy
import hashlib
import json
import os
import tempfile
from pathlib import Path

import numpy as np
import torch
from torch.nn import functional as F
from decision_math import masked_softmax
from typed_decision import (TypedDecisionModel,batch_rows,make_vocabulary,
                            fixture_data,negative_log_likelihood)
from train_decision import digest,save_json


def fingerprint(value):
    return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()


def write_artifact(destination,payload,dependencies):
    """Creation is an explicit operation, separate from replay validation."""
    payload=copy.deepcopy(payload)
    payload['dependencies']={name:{'path':os.path.relpath(Path(path).resolve(),destination.parent.resolve()),
                                    'sha256':digest(path)} for name,path in dependencies.items()}
    save_json(destination,{'payload':payload,'payload_sha256':fingerprint(payload)})


def load_artifact(source,expected_schema,expected_dependencies=None):
    """Validate before any inference or probability calculation.

    SHA256 detects accidental drift; this is not a signature/authenticity system.
    Dependency paths are relative to the artifact so a preserved folder tree can move.
    """
    envelope=json.loads(source.read_text(encoding='utf-8'))
    payload=envelope['payload']
    if fingerprint(payload)!=envelope['payload_sha256']:
        raise ValueError('Artifact payload fingerprint mismatch')
    if fingerprint(expected_schema)!=payload['schema_sha256'] or payload['schema']!=expected_schema:
        raise ValueError('Candidate schema mismatch')
    for name,item in payload['dependencies'].items():
        observed=(source.parent/item['path']).resolve()
        if digest(observed)!=item['sha256']:
            raise ValueError('Changed artifact dependency: '+name)
    for name,path in (expected_dependencies or {}).items():
        item=payload['dependencies'].get(name)
        if item is None or digest(path)!=item['sha256']:
            raise ValueError('Caller supplied a different dependency: '+name)
    return payload


def loader_checks():
    """Small files exercise the actual loader; no model is initialized."""
    conditions=[]
    with tempfile.TemporaryDirectory(prefix='typed-loader-') as temp:
        folder=Path(temp)
        files={name:folder/(name+'.txt') for name in ['weights','raw','calibration','schema-data','policy']}
        for name,path in files.items():path.write_text(name,encoding='utf-8')
        schema={'question':'where','options':[{'id':'a','description':'first'},{'id':'b','description':'second'}]}
        payload={'schema':schema,'schema_sha256':fingerprint(schema),'temperature':2.,
                 'policy':{'wrong_cost':10,'fallback_call_cost':.5,'fallback_error':.2,'tie':'fallback'}}
        artifact=folder/'artifact.json';write_artifact(artifact,payload,files)
        restored=load_artifact(artifact,schema,files)
        assert restored['temperature']==2.;conditions.append('unchanged loaded artifact')
        changed=copy.deepcopy(schema);changed['options'][0]['description']='changed'
        try:load_artifact(artifact,changed)
        except ValueError:conditions.append('changed requested schema rejected')
        else:raise AssertionError('Schema drift accepted')
        for name,path in files.items():
            prior=path.read_bytes();path.write_text('changed',encoding='utf-8')
            try:load_artifact(artifact,schema)
            except ValueError:conditions.append('changed '+name+' rejected')
            else:raise AssertionError('Dependency drift accepted')
            path.write_bytes(prior)
        prior=artifact.read_bytes();envelope=json.loads(prior);envelope['payload']['temperature']=3.
        artifact.write_text(json.dumps(envelope),encoding='utf-8')
        try:load_artifact(artifact,schema)
        except ValueError:conditions.append('changed serialized temperature rejected')
        else:raise AssertionError('Temperature drift accepted')
        artifact.write_bytes(prior)
        p=masked_softmax([2.,1.],temperature=payload['temperature'])
        assert np.array_equal(p,masked_softmax([2.,1.],temperature=load_artifact(artifact,schema)['temperature']))
        conditions.append('bitwise restored finite vector')
    return conditions


def package(args):
    """Create artifacts once from an intact completed study, without inference."""
    if args.artifact_dir.exists():raise ValueError('Preserve the existing artifact directory')
    read=lambda path:json.loads(path.read_text(encoding='utf-8'))
    protocol=read(args.scratch/'protocol.json');seal=read(args.scratch/'selection-seal.json')
    if seal['protocol_sha256']!=digest(args.scratch/'protocol.json'):raise ValueError('Selection protocol changed')
    for name,key in [('data.json','copied_data_sha256'),('plans.json','plans_sha256'),('vocabulary.json','vocabulary_sha256')]:
        if digest(args.scratch/name)!=protocol[key]:raise ValueError('Prepared scratch input changed: '+name)
    for name,sha in protocol['sources'].items():
        if digest(Path(__file__).parent/name)!=sha:raise ValueError('Fitting source changed: '+name)
    calibration=read(args.calibration);routing=read(args.routing)
    if calibration['input_sha256']!={'scratch':digest(args.scratch/'logits.json'),'native':digest(args.native/'logits.json')}:
        raise ValueError('Calibration is bound to different raw logits')
    if routing['calibration_sha256']!=digest(args.calibration):raise ValueError('Routing calibration changed')
    native=read(args.native/'completed.json');model_manifest=read(args.checkpoint_manifest)
    if native['checkpoint_manifest_sha256']!=digest(args.checkpoint_manifest):raise ValueError('Checkpoint manifest changed')
    if native['data_sha256']!=protocol['data_sha256']:raise ValueError('Native and scratch data differ')
    expected={row['name']:row['sha256'] for row in model_manifest['files']}
    if native['checkpoint_files']!=expected:raise ValueError('Native checkpoint file set differs')
    for name,sha in expected.items():
        if digest(args.checkpoint/name)!=sha:raise ValueError('Native checkpoint changed: '+name)
    data=read(args.scratch/'data.json')
    schema={'question':data['train'][0]['question'],'options':data['train'][0]['options']}
    policy={'wrong_cost':10,'fallback_call_cost':.5,'fallback_error':routing['fallback_error_calibration'],'tie':'fallback'}
    dependencies={'calibration':args.calibration,'policy':args.routing,'schema-data':args.scratch/'data.json',
        'scratch-raw':args.scratch/'logits.json','native-raw':args.native/'logits.json',
        'protocol':args.scratch/'protocol.json','selection-seal':args.scratch/'selection-seal.json',
        'native-completed':args.native/'completed.json','checkpoint-manifest':args.checkpoint_manifest,
        'replay-source':Path(__file__),'calibration-source':Path(__file__).parent/'calibrate_decisions.py',
        'routing-source':Path(__file__).parent/'evaluate_routing.py','native-source':Path(__file__).parent/'run_laya.py'}
    args.artifact_dir.mkdir(parents=True)
    for seed in [17,29,43]:
        key=f'seed-{seed}';completed=args.scratch/key/'completed.json';row=read(completed)
        if digest(completed)!=seal['completed'][str(seed)] or digest(args.scratch/key/'selected.pt')!=row['selected_sha256']:
            raise ValueError('Selected scratch checkpoint changed')
        payload={'kind':'scratch','schema':schema,'schema_sha256':fingerprint(schema),
            'temperature':calibration['methods'][key]['temperature'],'policy':policy,
            'shifts_sha256':native['shifts_sha256'],
            'architecture':'tiny-option-marker-transformer-v1','seed':seed}
        write_artifact(args.artifact_dir/(key+'.json'),payload,{**dependencies,
            'weights':args.scratch/key/'selected.pt','vocabulary':args.scratch/'vocabulary.json','completed':completed,
            'model-source':Path(__file__).parent/'typed_decision.py'})
    payload={'kind':'external native postprocessor, not Agent calibration','schema':schema,'schema_sha256':fingerprint(schema),
        'shifts_sha256':native['shifts_sha256'],
        'temperature':calibration['methods']['laya']['temperature'],'policy':policy,'checkpoint_revision':native['checkpoint_revision']}
    write_artifact(args.artifact_dir/'laya.json',payload,{**dependencies,
        **{'checkpoint-'+name:args.checkpoint/name for name in expected}})
    return {'status':'created four artifacts without model inference'}


def finite():
    torch.manual_seed(211)
    data=fixture_data();rows=data['train'][:2]
    vocabulary=make_vocabulary(data['train'])
    original=TypedDecisionModel(len(vocabulary)).double().eval()
    batch=batch_rows(rows,vocabulary)
    manual=original(*batch)
    library=original(*batch,library_attention=True)
    torch.testing.assert_close(manual,library,atol=2e-12,rtol=2e-12)
    records=[]
    for soft in [False,True]:
        left,right=copy.deepcopy(original),copy.deepcopy(original)
        target=torch.tensor([[.2,.5,.3],[.6,.1,.3]],dtype=torch.float64) if soft else torch.tensor([0,1])
        logits_left=left(*batch);logits_right=right(*batch)
        if soft:
            loss=-(target*(logits_left-torch.logsumexp(logits_left,-1,keepdim=True))).sum(-1).mean()
        else:loss=negative_log_likelihood(logits_left,target)
        native=F.cross_entropy(logits_right,target)
        loss.backward();native.backward()
        torch.testing.assert_close(loss,native,atol=2e-12,rtol=2e-12)
        gradients={}
        for (name,p),(other_name,q) in zip(left.named_parameters(),right.named_parameters()):
            assert name==other_name
            torch.testing.assert_close(p.grad,q.grad,atol=3e-12,rtol=3e-10)
            gradients[name]=float((p.grad-q.grad).abs().max())
        before=left.scorer[-1].weight.detach().clone()
        update_gradient=left.scorer[-1].weight.grad.detach().clone()
        with torch.no_grad():
            for p,q in zip(left.parameters(),right.parameters()):
                p-=.05*p.grad;q-=.05*q.grad
        for p,q in zip(left.parameters(),right.parameters()):torch.testing.assert_close(p,q,atol=2e-12,rtol=2e-12)
        records.append({'target_kind':'soft supplied' if soft else 'observed hard','loss':float(loss.detach()),
                        'all_parameter_gradient_errors':gradients,'scorer_before':before.tolist(),
                        'scorer_gradient':update_gradient.tolist(),'scorer_after':left.scorer[-1].weight.detach().tolist(),
                        'logits_before':logits_left.detach().tolist(),'logits_after':left(*batch).detach().tolist()})
    # A random initialization's first block attention, explicitly not a trained explanation.
    with torch.no_grad():
        ids,markers,mask=batch
        h=original.token(ids)+original.position(torch.arange(ids.shape[1]))[None]
        block=original.blocks[0]
        projected=block.qkv(block.attention_norm(h)).view(2,ids.shape[1],3,4,8)
        query,key,value=projected.permute(2,0,3,1,4).unbind(0)
        weights=((query@key.transpose(-2,-1))/np.sqrt(8)).masked_fill(~(ids!=0)[:,None,None,:],-torch.inf).softmax(-1)
        candidate_position=int(markers[0,0])
        selected=weights[0,0,candidate_position]
        contribution=selected[:,None]*value[0,0]
        attention={'input_ids':ids[0].tolist(),'marker_position':candidate_position,
                   'weights':selected.tolist(),'value_vectors':value[0,0].tolist(),
                   'weighted_values':contribution.tolist(),'sum_vector':contribution.sum(0).tolist()}
    return {'scope':'constructed seed211, two one-step SGD parity cases; no banking labels',
            'updates':records,'random_attention':attention}


def saved(args):
    data=json.loads((args.scratch/'data.json').read_text())
    schema={'question':data['train'][0]['question'],'options':data['train'][0]['options']}
    # Validate every artifact and caller-supplied path before loading any weights.
    current={'schema-data':args.scratch/'data.json','calibration':args.calibration,'policy':args.routing,
             'scratch-raw':args.scratch/'logits.json','native-raw':args.native/'logits.json'}
    artifacts={}
    for key in ['seed-17','seed-29','seed-43','laya']:
        caller=dict(current)
        if key!='laya':
            caller.update(weights=args.scratch/key/'selected.pt',vocabulary=args.scratch/'vocabulary.json',
                          completed=args.scratch/key/'completed.json',protocol=args.scratch/'protocol.json',
                          **{'selection-seal':args.scratch/'selection-seal.json'})
        artifacts[key]=load_artifact(args.artifact_dir/(key+'.json'),schema,caller)
        if digest(args.shifts)!=artifacts[key]['shifts_sha256']:raise ValueError('Shift requests changed')
    vocabulary=json.loads((args.scratch/'vocabulary.json').read_text())
    cached=json.loads((args.scratch/'logits.json').read_text())
    calibration=json.loads(args.calibration.read_text())
    native=json.loads((args.native/'logits.json').read_text())
    shifts=json.loads(args.shifts.read_text(encoding='utf-8'))['rows']
    report={}
    for seed in [17,29,43]:
        key=f'seed-{seed}'
        model=TypedDecisionModel(len(vocabulary)).eval()
        model.load_state_dict(torch.load(args.scratch/key/'selected.pt',map_location='cpu',weights_only=True))
        batch=batch_rows(data['test'][:4],vocabulary)
        with torch.inference_mode():
            current=model(*batch)
            expected=torch.tensor(cached[key]['test']['logits'][:4])
            torch.testing.assert_close(current,expected,atol=3e-6,rtol=3e-5)
            torch.testing.assert_close(current,model(*batch,library_attention=True),atol=3e-6,rtol=3e-5)
            padded=(F.pad(batch[0],(0,4)),batch[1],batch[2])
            torch.testing.assert_close(current,model(*padded),atol=3e-6,rtol=3e-5)
            outputs=[]
            for row in shifts:
                try:
                    result=model(*batch_rows([row],vocabulary))[0]
                except ValueError as error:
                    outputs.append({'id':row['id'],'status':'rejected','reason':str(error)})
                    continue
                probabilities=masked_softmax(result.tolist(),temperature=artifacts[key]['temperature'])
                outputs.append({'id':row['id'],'status':'predicted','logits':result.tolist(),
                                'probabilities':probabilities.tolist(),'target':row['target']})
                if row['intervention']=='rename-ids':
                    parent=next(r for r in data['test'] if r['id']==row['parent_id'])
                    assert batch_rows([row],vocabulary)[0].equal(batch_rows([parent],vocabulary)[0])
                    # Match the same saved parent; batch shape may change rounding slightly.
                    idx=cached[key]['test']['ids'].index(parent['id'])
                    torch.testing.assert_close(result,torch.tensor(cached[key]['test']['logits'][idx]),atol=3e-6,rtol=3e-5)
        report[key]={'artifact_sha256':digest(args.artifact_dir/(key+'.json')),'shifts':outputs,
                     'replayed_batch_max_error':float((current-expected).abs().max())}
    temperature=calibration['methods']['laya']['temperature']
    payload=artifacts['laya']
    before=masked_softmax(native['test']['logits'],temperature=temperature)
    after=masked_softmax(native['test']['logits'],temperature=payload['temperature'])
    assert np.array_equal(before,after)
    report['laya_external']={'artifact':payload,'artifact_sha256':fingerprint(payload),'bitwise_cached_vector_replay':True}
    return report


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=['finite','package','saved','loader-checks'])
    for name in ['scratch','native','calibration','routing','shifts','artifact-dir','checkpoint','checkpoint-manifest']:
        parser.add_argument('--'+name,type=Path)
    parser.add_argument('--output',type=Path)
    args=parser.parse_args();torch.set_num_threads(4)
    required={'saved':['scratch','native','calibration','routing','artifact_dir','shifts','output'],
              'package':['scratch','native','calibration','routing','artifact_dir','checkpoint','checkpoint_manifest'],
              'finite':['output'],'loader-checks':['output']}[args.command]
    if any(getattr(args,name) is None for name in required):parser.error('Missing required paths: '+', '.join(required))
    if args.command=='package':print(json.dumps(package(args)))
    else:save_json(args.output,finite() if args.command=='finite' else loader_checks() if args.command=='loader-checks' else saved(args))
