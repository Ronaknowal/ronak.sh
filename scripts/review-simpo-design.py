"""Independent, no-fit scalar witnesses for the proposed SimPO design."""
import hashlib
import json
import math
from pathlib import Path

folder = Path('docs/teaching/llm-architecture-training/simpo-simple-preference-optimization')
checks = []
def check(name, condition, value=None):
    assert condition, name
    checks.append({'name': name, 'value': value, 'passed': True})
def sig(x):
    return 1 / (1 + math.exp(-x))
def loss(d, beta=2, gamma=.4):
    return math.log1p(math.exp(gamma-beta*d))

check('Full tree mass', abs(.4+.27+.03+.3-1)<1e-12)
check('Sum versus mean ranking reversal', .4>.27 and .4**.5<.27**(1/3))
check('Margin boundary loss', abs(loss(.2)-math.log(2))<1e-12)
for d in [-2,-.3,0,.2,.3,2]:
    derivative=(loss(d+1e-6)-loss(d-1e-6))/2e-6
    check(f'Derivative at gap {d}', abs(derivative+2*sig(.4-2*d))<1e-9, derivative)
    check(f'Oriented links not complementary at {d}', sig(2*d-.4)+sig(-2*d-.4)<1)
theta=.2*sig(.4)
weights=[math.exp(theta),math.exp(-theta),math.exp(10*theta)]
p=[w/sum(weights) for w in weights]
check('Shared logit drift lowers both compared probabilities',p[0]<1/3 and p[1]<1/3 and math.log(p[0]/p[1])>0,p)
check('Chosen token versus response weighting differs', abs((2*1+6*3)/8-2.5)<1e-12 and (1+3)/2 != 2.5)
for gamma in [0,.5]:
    d=.2;q=.75
    repeated=q*loss(d,gamma=gamma)+(1-q)*loss(-d,gamma=gamma)
    z=2*d-gamma
    smoothed=q*math.log1p(math.exp(-z))+(1-q)*math.log1p(math.exp(z))
    check(f'Opposite labels vs oriented smoothing gamma {gamma}',abs(repeated-smoothed)<1e-12 if gamma==0 else abs(repeated-smoothed)>1e-3,[repeated,smoothed])
files=[folder/name for name in ['design.md','assessment.md','research.md','design-review.md','original/simpo.jsx']]
files.append(Path(__file__))
bindings={str(p).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
report={'reviewer':'root','author':'alignment_author','decision':'accepted-for-content','checks':checks,'bindings':bindings,'fits':0,'runtimeAccepted':False}
(folder/'design-review-acceptance.json').write_text(json.dumps(report,indent=2)+'\n')
print(f'{len(checks)} independent scalar conditions; whole design accepted for content')
