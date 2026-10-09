"""Once-only finite continuation; no neural library import or prior-main replay.

Run only after different correction review and Root release. The previous
finite stage failed after math/decode completed; retain that failed stage.
"""
import hashlib
import importlib
import json
from pathlib import Path
import sys
import traceback

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/speculative-decoding'
FIX = TOPIC / 'finite-witness-correction'
PUBLIC = ROOT / 'public/learn-code/speculative-decoding'
OUT = ROOT / 'scratch/speculative-research/study-continuation'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save(path, data):
    with path.open('x', encoding='utf8') as stream:
        json.dump(data, stream, indent=2)
        stream.write('\n')


def main():
    protocol_path = TOPIC / 'program-protocol.json'
    protocol = json.loads(protocol_path.read_text())
    original = json.loads((FIX / 'program-protocol.json').read_text())
    failure_path = ROOT / 'scratch/speculative-research/study/finite.json'
    failure = json.loads(failure_path.read_text())
    assert sha(failure_path) == sha(FIX / 'finite.failed.json')
    assert not failure['passed'] and failure['stage'] == 'finite'
    assert 'sequence_law.py' in failure['failure'] and 'wrong!=expected' in failure['failure']
    assert failure['protocol_sha256'] == sha(FIX / 'program-protocol.json')
    assert {k:v for k,v in protocol.items() if k!='files'} == {k:v for k,v in original.items() if k!='files'}
    old_sources = {row['name']:row['sha256'] for row in original['files']}
    for row in protocol['files']:
        assert sha(PUBLIC / row['name']) == row['sha256']
        if row['name'] != 'sequence_law.py':
            assert row['sha256'] == old_sources[row['name']]
    OUT.mkdir(exist_ok=True)
    destination, marker, journal = [OUT / name for name in ['finite.json','finite.started.json','finite.jsonl']]
    assert not destination.exists() and not journal.exists()
    save(marker, {'stage':'finite','protocol_sha256':sha(protocol_path),
                  'continuation_source_sha256':sha(Path(__file__)), 'predecessor_failure_sha256':sha(failure_path)})
    report = {'stage':'finite','protocol_sha256':sha(protocol_path),'passed':False,'result':{},
              'continuation':{'predecessor':failure_path.relative_to(ROOT).as_posix(),
                              'predecessor_sha256':sha(failure_path),
                              'scope':'Only corrected sequence-law verifier and previously unstarted practice. Math/decode verifier mains are not replayed.'}}
    def observe(event):
        with journal.open('a',encoding='utf8') as stream:
            stream.write(json.dumps(event)+'\n')
            stream.flush()
    with journal.open('x',encoding='utf8') as stream:
        stream.write(json.dumps({'begin':'finite-continuation'})+'\n')
    sys.path.insert(0,str(PUBLIC))
    try:
        for name in ['speculative_math','speculative_decode']:
            report['result'][name] = {'conserved_completed_call':True,
                'original_source_sha256':old_sources[name+'.py'],
                'raw_result_retained':False,
                'evidence':'Original sequential dict-comprehension returned from this verifier before entering sequence_law.verify; the later exception prevented aggregate assignment. Independent original full review also passed complementary finite conditions.'}
        for module,function in [('sequence_law','verify'),('practice_answers','answers')]:
            observe({'event':'finite-function-start','module':module,'function':function})
            result = getattr(importlib.import_module(module),function)()
            observe({'event':'finite-function-return','module':module,'result':result})
            report['result'][module] = result
        report['passed'] = True
    except Exception:
        report['failure'] = traceback.format_exc()
    finally:
        save(destination,report)
    print(json.dumps(report,indent=2))
    if not report['passed']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
