"""Bounded R1–R4 checks on finite inputs and saved model outputs only."""
from pathlib import Path
import hashlib
import json
import sys
import zipfile

b = Path('docs/teaching/llm-architecture-training/structured-output-constrained-decoding-outlines-xgrammar')
c = b/'content-correction'
sys.path.insert(0, str(b/'programs'))
from automata import compile_regular, literal
from token_index import TokenIndex
from constrained_loop import decode
from evaluate import assess, evaluate

checks = []
def check(name, condition):
    assert condition, name
    checks.append(name)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
original = json.loads((b/'content-inputs.json').read_text())['files']
preserved = json.loads((c/'predecessor.json').read_text())
for p,h in original.items():
    target = preserved[p]['saved'] if p in preserved else p
    check('original binding '+p,sha(target)==h)
index = TokenIndex(compile_regular(literal('€')), [b'\xe2',b'\x82\xac',None])
for name,opts,reason in [('cap',{'cap':1},'cap'),('cancel',{'canceled':lambda ids:len(ids)==1},'canceled')]:
    r=decode(lambda _: [0,0,0],index,greedy=True,**opts)
    check(name+' incomplete UTF8 preserves bytes and stop',r['ids']==[0] and r['raw_bytes_hex']=='e2' and r['text'] is None and r['utf8_status']=='incomplete-prefix' and r['stop_reason']==reason and not r['completed'])
r=decode(lambda _: [0,0,0],index,greedy=True,cap=3)
check('complete UTF8 and grammar before EOS',r['text']=='€' and r['utf8_status']=='complete' and r['raw_bytes_hex']=='e282ac' and r['completed'] and r['stop_reason']=='eos')
data=json.loads((b/'research/iris-data.json').read_text())
records=[json.loads(p.read_text()) for p in sorted((b/'research/iris-study').glob('row-*.json')) if '.started.' not in p.name]
result=evaluate(data,records)
check('same saved analysis as current asset',result==json.loads((c/'evaluation-exact.json').read_text()))
expected={'unconstrained':(0,0,0,0),'json_hf':(12,0,0,0),'schema_manual':(12,5,12,0),'schema_outlines':(12,12,12,0)}
check('exact and original float outcomes',all(tuple(row[k] for k in ['parse','schema','float_schema','exact'])==expected[row['arm']] for row in result['summary']))
gold=data['rows'][0]['gold']
for numeric,valid in [('5.1',True),('5.10',True),('51e-1',True),('5.0999999999999996',False),('8',True),('8.0',True),('8.01',False)]:
    r=assess('{"species":"setosa","sepal_cm":'+numeric+'}',data['schema'],gold)
    check('exact numeric spelling '+numeric,r['schema']==valid)
check('offending float boundary explicit',assess('{"species":"setosa","sepal_cm":5.0999999999999996}',data['schema'],gold)['float_schema'])
for raw,row in zip(records,result['rows']):
    check('replay identity '+str(raw['index'])+raw['arm'],row['xgrammar_schema_replay_completed']==raw.get('completed') and row['xgrammar_schema_replay_terminated']==raw.get('terminated') and row['status']==raw['status'] and 'completed' not in row and 'terminated' not in row)
check('all Outlines EOS distinct from replay',all(r['status']=='eos' and r['schema'] and not r['xgrammar_schema_replay_completed'] for r in result['rows'] if r['arm']=='schema_outlines'))
t=(b/'lesson.md').read_text(encoding='utf8')
check('setup before first full source',t.index('python token_index.py')<t.index('<!-- CODE token_index.py -->'))
with zipfile.ZipFile(b/'examples/constrained-decoding.zip') as z:
    for p in (b/'programs').glob('*.py'):
        check('exact source payload '+p.name,z.read(p.name)==p.read_bytes())
    check('original float evaluator bundled',z.read('study/evaluate-original-float.py')==Path(preserved[str(b/'programs/evaluate.py').replace('\\','/')]['saved']).read_bytes())
    check('original48 raw outputs unchanged in bundle',all(z.read('study/'+p.name)==p.read_bytes() for p in (b/'research/iris-study').glob('row-*.json') if '.started.' not in p.name))
check('frozen generator unchanged',sha(b/'programs/generate_native.py')==sha(b/'research/iris-study/generate_native.py')=='d19129de49451716987738e65a3833a705dcd8fffa701d745d1d833393723f07')
(c/'checks.json').write_text(json.dumps({'passed':True,'checks':checks,'scope':'Finite UTF8, saved-data exact-decimal evaluation, replay field identity, original guard and archive parity only. No native/model/scientific execution.'},indent=2)+'\n')
print(len(checks))
