"""Root's complementary design review. No fitting or author receipt rewriting."""
import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods'
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
packet = TOPIC / 'design-inputs.json'
assert digest(packet) == '5546d0123e8ebb8aaec6d800f9badbe838d63637dbc882cd3746bbe754aff98a'
inputs = json.loads(packet.read_text())['files']
conditions = []
def check(test, name):
    assert test, name
    conditions.append(name)
for item in inputs:
    check(digest(ROOT / item['path']) == item['sha256'], item['path'])
# Independently vary an unobserved action's mass; the same observed square
# cannot determine it. Add a connected edge and solve both constraints.
for ratio in [1, 2, math.e, 9]:
    for mass in [.01, .3, .9, .999]:
        a, b = mass * ratio / (1 + ratio), mass / (1 + ratio)
        check(math.isclose(math.log(a/b), math.log(ratio), abs_tol=1e-12), 'unseen mass leaves observed margin')
    p = [ratio/(ratio+2), 1/(ratio+2), 1/(ratio+2)]
    check(math.isclose(sum(p), 1) and math.isclose(p[0]/p[1], ratio) and math.isclose(p[0]/p[2], ratio), 'connected zero-square solution')
# Score-coordinate gradients versus gradients at one shared weight: test away
# from theta=0 rather than merely copying the four design examples.
softplus = lambda z: max(z, 0) + math.log1p(math.exp(-abs(z)))
sigmoid = lambda z: 1/(1+math.exp(-z))
for theta in [-1.2, .3, 2.1]:
    for xa, xb in [(1, 3), (1, -1), (2, 2)]:
        for weight in [0, .1, 1]:
            f = lambda t: softplus(-t*xa) + weight*softplus(t*(xb-xa))
            exact = -xa*sigmoid(-theta*xa) + weight*(xb-xa)*sigmoid(theta*(xb-xa))
            fd = (f(theta+1e-5)-f(theta-1e-5))/2e-5
            check(math.isclose(exact, fd, abs_tol=1e-9), 'shared-weight chain rule changed state')
for q in [0, .1, .5, .7, 1]:
    for tau in [.1, .5, 2]:
        c = 1/(2*tau)
        optimum = c*(2*q-1)
        loss = q*(optimum-c)**2+(1-q)*(-optimum-c)**2
        check(math.isclose(loss, 4*c*c*q*(1-q), abs_tol=1e-12), 'irreducible noisy square')
        check(math.isclose(2*(optimum+c*(1-2*q)), 0, abs_tol=1e-12), 'noisy optimum derivative')
design = (TOPIC/'design.md').read_text(encoding='utf8')
for i in range(1,36):
    check(f'**D{i:02d} / section' in design, f'concrete representation {i}')
for item in inputs:
    check(digest(ROOT/item['path']) == item['sha256'], 'conserved '+item['path'])
result = dict(status='passed', conditions=len(conditions), fits=0, generation=0,
              checks=conditions, design_packet_sha256=digest(packet))
(TOPIC/'design-root-checks.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:v for k,v in result.items() if k!='checks'}))
