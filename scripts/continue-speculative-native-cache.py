"""Reviewed continuation: one unstarted sampled diagnostic, then fixed study.

No greedy retry, no repeated finite/cache/tree/head stage. Source and previous
observations are sealed in the associated continuation plan before execution.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import traceback

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/speculative-decoding'
FIX = TOPIC / 'native-cache-correction'
PUBLIC = ROOT / 'public/learn-code/speculative-decoding'
OUT = ROOT / 'scratch/speculative-research/study-native-continuation'
MODEL = ROOT / 'scratch/sft-research/pythia-14m'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save(path, value):
    with path.open('x', encoding='utf8') as stream:
        json.dump(value, stream, indent=2)
        stream.write('\n')


def main(stage):
    plan = json.loads((FIX / 'plan.json').read_text())
    for row in plan['files']:
        assert sha(ROOT / row['path']) == row['sha256'], row['path']
    protocol_path = TOPIC / 'program-protocol.json'
    protocol = json.loads(protocol_path.read_text())
    assert sha(protocol_path) == plan['protocol_sha256']
    for row in protocol['files']:
        assert sha(PUBLIC / row['name']) == row['sha256']
    old = json.loads((FIX / 'program-protocol.json').read_text())
    assert {k:v for k,v in old.items() if k!='files'} == {k:v for k,v in protocol.items() if k!='files'}
    previous = ROOT / 'scratch/speculative-research/study-continuation'
    for name in ['finite','cache','tree','heads']:
        result = json.loads((previous / (name+'.json')).read_text())
        assert result['passed'] and result['protocol_sha256'] == sha(FIX/'program-protocol.json')
    failed = json.loads((previous/'native-detail.json').read_text())
    assert not failed['passed'] and failed['rows'] == []
    assert 'Passing both `cache_implementation`' in failed['failure']
    prior_events = [json.loads(line) for line in (previous/'native-detail.jsonl').read_text().splitlines()]
    starts = [row for row in prior_events if row.get('event')=='native-call-start']
    assert len(starts)==1 and starts[0]['mode']=='greedy'
    assert starts[0]['seed']==401 and starts[0]['cap']==8
    assert plan['remaining_diagnostic_calls']==1 and plan['remaining_study_calls']==128

    OUT.mkdir(exist_ok=True)
    name = 'native' if stage=='sample' else 'study'
    if stage=='study':
        prior = json.loads((OUT/'native.json').read_text())
        assert prior['passed'] and prior['protocol_sha256']==sha(protocol_path)
    marker,journal,destination = [OUT/(name+suffix) for suffix in ['.started.json','.jsonl','.json']]
    assert not journal.exists() and not destination.exists()
    save(marker,{'stage':name,'protocol_sha256':sha(protocol_path),'plan_sha256':sha(FIX/'plan.json')})
    with journal.open('x',encoding='utf8') as stream:
        stream.write(json.dumps({'begin':True,'stage':name})+'\n')
    def observe(event):
        with journal.open('a',encoding='utf8') as stream:
            stream.write(json.dumps(event)+'\n')
            stream.flush()

    report={'stage':name,'protocol_sha256':sha(protocol_path),'passed':False,
            'continuation_plan_sha256':sha(FIX/'plan.json')}
    try:
        sys.path.insert(0,str(PUBLIC))
        import torch
        import transformers
        from native_speculation import load_pair,generate_one,verify_files
        assert protocol['versions']=={'torch':torch.__version__,'transformers':transformers.__version__}
        torch.set_num_threads(protocol['threads'])
        verify_files(MODEL)
        if stage=='sample':
            target,draft,tokenizer=load_pair(MODEL)
            ids=tokenizer(protocol['diagnostic']['text'],add_special_tokens=False).input_ids
            row=generate_one(target,draft,ids,'sample',3,409,cap=8,rich=True,observer=observe)
            report['result']={'scope':'Native attempts accounted separately: failed greedy retained, unstarted sample completed; greedy not retried.',
                'status':'sample-completed-with-prior-greedy-failure','rows':[row],
                'failed_greedy':failed,'failed_greedy_events':prior_events,
                'helper':failed['helper'],'model':failed['model'],
                'budget':{'diagnostic_attempts_total':2,'greedy_retries':0,'new_sample_calls':1}}
        else:
            from speculation_study import measured_study
            report['result']=measured_study(MODEL,protocol,journal)
        report['passed']=True
    except Exception:
        report['failure']=traceback.format_exc()
    finally:
        save(destination,report)
    print(json.dumps(report,indent=2))
    if not report['passed']:
        raise SystemExit(1)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--stage',choices=['sample','study'],required=True)
    main(parser.parse_args().stage)
