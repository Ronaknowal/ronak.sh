"""Complementary boundary and changed-practice review; no study replay."""
import hashlib
import json
import math
from pathlib import Path
import sys
import numpy as np
sys.path.insert(0, str(Path('public/learn-code/decoding-strategies').resolve()))
from sampling import categorical, probabilities
from practice_answers import solve

base=Path('docs/teaching/llm-architecture-training/decoding-strategies-greedy-beam-top-k-top-p-temperature')
checks=[]
def check(name, value):
    checks.append({'name':name,'passed':bool(value)})
    assert value,name
p=probabilities([-1.4837713985510979,.1461555470109563,-np.inf])
check('Exact failed near-one witness selects positive ID1',categorical(p,np.nextafter(1.,0.))==1)
for p,expected in [([0,.2,0,.8,0],3),([0,0,1,0],2),([.2,0,.3,.5,0],3)]:
    check(f'Final positive interval maps to original ID{expected}',categorical(p,np.nextafter(1.,0.))==expected)
check('Exact interior boundary skips zero interval',categorical([.2,0,.3,.5,0],.2)==2)
check('Zero draw skips leading zero IDs',categorical([0,0,1,0],0)==2)
answers=solve()
p=[.5,.25,.15,.1]
H=-sum(value*math.log(value) for value in p)
order=sorted(range(4),key=lambda i:abs(-math.log(p[i])-H))
check('Fresh practice8 entropy independently summed',abs(answers['8']['entropy']-H)<1e-12)
check('Fresh practice8 mass crosses with two entries',order==[1,0,2,3] and p[order[0]]<.35<=sum(p[i] for i in order[:2]))
ids=[4,4,7,4,4,7]
check('Fresh practice17 unique adjacent pairs',len(set(zip(ids,ids[1:])))/(len(ids)-1)==3/5 and answers['17']['ids_4_4_7_4_4_7_distinct2']=='3/5')
finish=[1,1,3,4,4]
cells=[800*sum(stop>=step for stop in finish) for step in range(1,5)]
check('Fresh practice18 independent completion schedule',cells==answers['18']['cells_by_step'] and sum(cells)==10400)
files=[Path(__file__),Path('public/learn-code/decoding-strategies/sampling.py'),Path('public/learn-code/decoding-strategies/practice_answers.py')]
report={'passed':True,'checks':checks,'scienceReplayed':False,'files':{str(p).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}}
with (base/'runtime-review-root/correction-checks.json').open('x',encoding='utf-8') as stream:
    json.dump(report,stream,indent=2);stream.write('\n')
print(json.dumps({'passed':True,'checks':len(checks)}))
