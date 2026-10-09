"""Use the pinned local Laya English checkpoint through its ordinary Agent API.

python run_laya.py --checkpoint /local/laya --checkpoint-manifest model-source.json \
    --data data/banking.json --shifts data/shifts.json --output results/laya
No model update, network request or native calibration installation is performed.
The raw-logit hook only observes the same forwards used by predict_batch.
"""
import argparse
import hashlib
import json
import os
import platform
import time
from pathlib import Path

os.environ['HF_HUB_OFFLINE']='1'
os.environ['TRANSFORMERS_OFFLINE']='1'
os.environ['LAYA_CPU_AMP']='off'
import numpy as np
import torch

from train_decision import digest,save_json


def questions(row):
    return {'intent':{'type':'choice','instructions':row['question'],
            'criteria':{o['id']:o['description'] for o in row['options']}}}


def rss_bytes():
    import psutil
    return psutil.Process().memory_info().rss


def run(args):
    import laya
    from laya import Agent
    from laya.calibrate import records_from_labeled
    if laya.__version__!='0.4.0':
        raise ValueError('Expected the inspected laya 0.4.0 API')
    if args.output.exists():
        raise ValueError('Use a fresh output directory; preserve previous outcomes')
    source=json.loads(args.checkpoint_manifest.read_text())
    expected={r['name']:r['sha256'] for r in source['files']}
    for name,value in expected.items():
        if digest(args.checkpoint/name)!=value:raise ValueError('Checkpoint identity mismatch: '+name)
    data=json.loads(args.data.read_text(encoding='utf-8'))
    shifts=json.loads(args.shifts.read_text(encoding='utf-8'))
    args.output.mkdir(parents=True)
    torch.set_num_threads(4)
    captures=[]
    events=[]
    def hook(module,inputs,kwargs,output):
        logits=output[0].detach().float().cpu().numpy()
        # Agent._infer passes the five main tensors positionally in 0.4.0.
        widths=inputs[3].sum(-1).cpu().tolist()
        rows=[logits[i,:width].tolist() for i,width in enumerate(widths)]
        captures.extend(rows)
        events.append({'input_shape':list(inputs[0].shape),
                       'marker_shape':list(inputs[2].shape),
                       'widths':widths,'grad_enabled':torch.is_grad_enabled()})
    started=time.perf_counter()
    agent=Agent(str(args.checkpoint),device='cpu',backend='eager',expected_sha256=expected)
    load_seconds=time.perf_counter()-started
    assert all(p.dtype==torch.float32 for p in agent.model.parameters())
    assert not agent.amp_enabled
    listener=agent.model.register_forward_hook(hook,with_kwargs=True)
    def predict(rows,q=None,batch_size=4):
        captures.clear()
        before=len(events)
        result=agent.predict_batch([row['state'] for row in rows],q or questions(rows[0]),
                                   batch_size=batch_size,sort_by_length=False)
        return {'native':result,'raw_logits':list(captures),'forward_events':events[before:]}
    try:
        # First call is the first declared calibration batch, counted only once.
        started=time.perf_counter()
        first=predict(data['calibration'][:4])
        first_seconds=time.perf_counter()-started
        observations={};scores={}
        for split in ['calibration','test']:
            batches=[first] if split=='calibration' else []
            begin=4 if split=='calibration' else 0
            for offset in range(begin,len(data[split]),4):
                batches.append(predict(data[split][offset:offset+4]))
            raw=[row for batch in batches for row in batch['raw_logits']]
            if len(raw)!=120 or any(len(row)!=6 for row in raw):raise ValueError('Unexpected hook row mapping')
            observations[split]=batches
            scores[split]={'ids':[row['id'] for row in data[split]],'logits':raw,
                           'targets':[row['target'] for row in data[split]]}
        save_json(args.output/'logits.json',scores)
        save_json(args.output/'cohort-observations.json',observations)
        # One predeclared equivalence batch: repeated batch4 plus four documented
        # collector single-state calls on the same first four calibration records.
        repeated=predict(data['calibration'][:4])
        np.testing.assert_allclose(repeated['raw_logits'],first['raw_logits'],atol=2e-4,rtol=2e-5)
        with torch.inference_mode():
            collector=records_from_labeled(agent,[(r['state'],questions(r),{'intent':np.eye(6)[r['target']]})
                                                  for r in data['calibration'][:4]])
        collector_logits=[np.asarray(record[1]).tolist() for record in collector]
        np.testing.assert_allclose(collector_logits,first['raw_logits'],atol=2e-4,rtol=2e-5)
        save_json(args.output/'collector-parity.json',{'original':first['raw_logits'],
            'repeated':repeated['raw_logits'],'collector':collector_logits,
            'max_collector_absolute_difference':float(np.max(np.abs(np.asarray(collector_logits)-first['raw_logits']))),
            'atol':2e-4,'rtol':2e-5,'extra_examples':8})
        shifted=[]
        for row in shifts['rows']:
            shifted.append({'id':row['id'],'parent_id':row['parent_id'],'target':row['target'],
                            'intervention':row['intervention'],**predict([row])})
        save_json(args.output/'shift-observations.json',shifted)
        typed_questions={
            'intent':questions(data['calibration'][0])['intent'],
            'urgency':{'type':'score','instructions':'How urgent is this request?',
                       'criteria':['no deadline','soon','immediate blocking emergency']},
            'refund':{'type':'noul','instructions':'Does the customer explicitly request a refund?'},
        }
        typed_states=[{'state':'My card has not arrived. Please tell me when it will arrive.'},
                      {'state':'A payment I did not make is on my card. Please refund it immediately.'}]
        typed=predict(typed_states,typed_questions,batch_size=2)
        save_json(args.output/'typed-observations.json',{'states':typed_states,'questions':typed_questions,**typed})
        listener.remove()
        # Warm end-to-end API timings on fixed already evaluated calibration rows.
        q=questions(data['calibration'][0]);states=[r['state'] for r in data['calibration'][:4]]
        for _ in range(3):agent.predict_batch(states[:1],q,batch_size=1)
        timing={}
        for size,repetitions in [(1,20),(4,5)]:
            durations=[]
            for _ in range(repetitions):
                begin=time.perf_counter();agent.predict_batch(states[:size],q,batch_size=size)
                durations.append(time.perf_counter()-begin)
            timing[str(size)]={'seconds':durations,'n':repetitions,'median_seconds':float(np.median(durations)),
                              'p95_seconds':float(np.quantile(durations,.95)),
                              'examples_per_second':size/float(np.mean(durations))}
        save_json(args.output/'runtime.json',{'cold_load_seconds':load_seconds,'first_batch4_seconds':first_seconds,
            'warmups_batch1':3,'warm':timing,'rss_after_bytes':rss_bytes(),
            'hardware':{'platform':platform.platform(),'processor':platform.processor(),'logical_cpus':os.cpu_count()},
            'threads':4,'parameters':sum(p.numel() for p in agent.model.parameters()),
            'dtype':'float32','backend':'eager','native_temperature':agent.temperature,
            'native_temperature_by_options':agent.temperature_by_options,
            'forward_events_before_timings':events,
            'boundary':'local CPU end-to-end calls; excludes downloading; RSS is a snapshot, not peak allocation'})
        save_json(args.output/'completed.json',{'status':'completed','checkpoint_revision':source['revision'],
            'checkpoint_manifest_sha256':digest(args.checkpoint_manifest),'checkpoint_files':expected,
            'data_sha256':digest(args.data),'shifts_sha256':digest(args.shifts),'program_sha256':digest(__file__),
            'laya_version':laya.__version__,'torch_version':torch.__version__,
            'weight_updates':0,'cohort_examples':240,'shift_examples':24,'typed_question_rows':6,
            'parity_extra_examples':8,'timing_examples':43})
    except Exception as error:
        save_json(args.output/'failure.json',{'status':'failed','error':repr(error),
                  'completed_forward_events':events,'weight_updates':0})
        raise
    finally:
        listener.remove()


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ['checkpoint','checkpoint-manifest','data','shifts','output']:
        parser.add_argument('--'+name,type=Path,required=True)
    run(parser.parse_args())
