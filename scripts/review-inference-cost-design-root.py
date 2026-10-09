"""Independent exact arithmetic/design guards; no native model or solver call."""
from pathlib import Path
from fractions import Fraction as F
import json, hashlib
b=Path('docs/teaching/llm-architecture-training/inference-cost-economics-compute-scaling')
d=json.loads((b/'design-inputs.json').read_text());checks=[]
def check(name,condition):
    assert condition,name
    checks.append(name)
for r in d['files']:check(r['path'],hashlib.sha256(Path(r['path']).read_bytes()).hexdigest()==r['sha256'])
check('KV main2GiB',2*32*8*128*4096*4*2==2*2**30)
check('KV practice288MiB',2*24*4*128*2048*3*2==288*2**20)
check('capacity14 exact decimalGB',int((24e9-14e9-2e9)//536870912)==14)
check('matrix count main and changed',(2*4*3*2,2*(12+6+8),8*4*3*2,2*(12+24+32))==(48,52,192,136))
check('matrix changed task',(3*5*4*2,2*(20+12+15))==(120,94))
check('lease not duplicated',720*2*F('4.29')==F('6177.60') and 80*2*F('4.29')==F('686.4'))
check('aggregate delivered tokens',720*3600*200*F('.25')==129600000)
check('cost per million independent ratio',F('6177.6')/F('129.6')==F(143,3))
bill=lambda u,w,r,o:(u*2+w*F('2.5')+r*F('.1')+o*10)/10**6
check('prefix sequence exact',bill(100,900,0,200)+2*bill(100,0,900,200)==F('.00903'))
check('prefix nohits',3*bill(100,900,0,200)==F('.01335'))
check('onehour mixedsequence',(100*2+900*4+200*10)/F(10**6)+2*bill(100,0,900,200)==F('.01038'))
check('mixedTTL publicexample',(2048*2+1800*F('.1')+148*F('2.5')+100*4+503*10)/10**6==F('.010076'))
check('fresh prefixpractice',bill(50,1200,0,100)+2*bill(50,0,1200,100)==F('.00654'))
check('conditional route successes',F(82)*F('.9')+(F(82)*F('.1')+18*F('.8'))*F('.95')==F('95.27'))
check('conditional route spending',100*F('.002')+(82*F('.1')+18*F('.8'))*F('.02')==F('.652'))
for name,cost,cap,demand,expected in [('body',(7,4),(4,2),7,(14,2,0)),('practice',(5,3),(3,2),8,(13,2,1))]:
    feasible=[(cost[0]*x+cost[1]*y,x,y) for x in range(4) for y in range(4) if x+y<=3 and cap[0]*x+cap[1]*y>=demand]
    check(name+' integerenumeration',min(feasible)==expected)
check('native prospective counts',4*3==12 and 4*2==8)
(b/'design-review-root-checks.json').write_text(json.dumps({'passed':True,'conditions':checks,'scope':'Exact finite arithmetic and22frozen source guards only; no neural/native/solver/science execution.'},indent=2)+'\n')
print(len(checks))
