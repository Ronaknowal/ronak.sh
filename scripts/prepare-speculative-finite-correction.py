"""Read finite witness operands and freeze a prospective continuation."""
import ast
from fractions import Fraction
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/speculative-decoding'
FIX = TOPIC / 'finite-witness-correction'
PUBLIC = ROOT / 'public/learn-code/speculative-decoding'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def save(path,data):
    with path.open('x',encoding='utf8') as stream:
        json.dump(data,stream,indent=2)
        stream.write('\n')

def load(path,name):
    spec = importlib.util.spec_from_file_location(name,path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

old = load(FIX/'sequence_law.py','old_witness')
new = load(PUBLIC/'sequence_law.py','corrected_witness')
reference = old.terminal_law(2)
before,after = old.wrong_keep_suffix(),new.wrong_keep_suffix()
assert before == reference and sum(before.values()) == 1
assert after != reference and sum(after.values()) == 1
assert old.policy((1,),True) == old.policy((0,))
assert new.policy((1,)) != new.policy((0,))
before_tree = ast.parse((FIX/'sequence_law.py').read_text())
after_tree = ast.parse((PUBLIC/'sequence_law.py').read_text())
for a,b in zip(before_tree.body,after_tree.body):
    if isinstance(a,ast.FunctionDef) and a.name=='wrong_keep_suffix':
        continue
    assert ast.dump(a)==ast.dump(b)
protocol = json.loads((FIX/'program-protocol.json').read_text())
for row in protocol['files']:
    if row['name']=='sequence_law.py':
        row['sha256'] = sha(PUBLIC/row['name'])
    else:
        assert row['sha256']==sha(PUBLIC/row['name'])
with (TOPIC/'program-protocol.json').open('w',encoding='utf8') as stream:
    json.dump(protocol,stream,indent=2)
    stream.write('\n')
save(FIX/'diagnosis.json',{'passed':True,'original_failure_sha256':sha(FIX/'finite.failed.json'),
    'scope':'Only exact two-output diagnostic operands; no verifier main, neural import, model or new scientific arm.',
    'old_rejected_B_q_equals_repaired_A_p':list(map(str,old.policy((1,),True))),
    'stale_target_after_B':list(map(str,new.policy((1,)))),
    'correct_target_after_A':list(map(str,new.policy((0,)))),
    'before':old.serializable(before),'reference':old.serializable(reference),'after':new.serializable(after),
    'only_wrong_function_semantics_changed':True,'protocol_sha256':sha(TOPIC/'program-protocol.json')})
old_packet = json.loads((TOPIC/'program-correction/inputs-r3.json').read_text())
paths = {ROOT/row['path'] for row in old_packet['files']}
recoveries=[]
for row in old_packet['files']:
    path=ROOT/row['path']
    if sha(path)!=row['sha256']:
        stored=FIX/path.name
        assert sha(stored)==row['sha256']
        recoveries.append({'original':row['path'],'preserved':stored.relative_to(ROOT).as_posix(),'sha256':row['sha256']})
        paths.add(stored)
paths.update(p for p in FIX.iterdir() if p.is_file())
paths.update([Path(__file__),ROOT/'scripts/continue-speculative-finite-witness.py',
              TOPIC/'program-execution-accepted-root.json',TOPIC/'program-correction/inputs-r3.json',
              TOPIC/'program-correction/independent-closure.md',TOPIC/'program-correction/independent-acceptance.json'])
paths.update((ROOT/'scratch/speculative-research/study').iterdir())
save(FIX/'inputs.json',{'topicId':'speculative-decoding','purpose':'Changed finite wrong-history witness and prospective no-replay continuation',
    'predecessor_relocations':recoveries,
    'files':[{'path':p.relative_to(ROOT).as_posix(),'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(paths) if p.is_file()]})
print(json.dumps({'bindings':len(paths),'packet_sha256':sha(FIX/'inputs.json'),'protocol_sha256':sha(TOPIC/'program-protocol.json')}))
