"""Source identity and complementary finite algebra; no lesson main execution."""
from pathlib import Path
from fractions import Fraction as F
import hashlib
import json
import math

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
checks = []

def check(name, passed, detail=None):
    assert passed, (name, detail)
    checks.append(dict(name=name, passed=bool(passed), detail=detail))

manifest = json.loads((HERE / 'design-source-r2.json').read_text(encoding='utf-8'))
for entry in manifest['requiredFiles']:
    data = (ROOT / entry['path']).read_bytes()
    check('Source identity: ' + entry['path'], len(data) == entry['bytes'] and hashlib.sha256(data).hexdigest() == entry['sha256'])

# Complementary calculations on changed finite objects, not retained programme fixtures.
p, q = [F(1, 5), F(4, 5)], [F(3, 5), F(2, 5)]
mu = [a + b for a, b in zip(p, q)]
density_rows = [(a / m, b / m, m) for a, b, m in zip(p, q, mu)]
mass_kl = sum(float(a) * math.log(float(a / b)) for a, b in zip(p, q))
measure_kl = sum(float(m * b) * float(a / b) * math.log(float(a / b)) for a, b, m in density_rows)
check('Common-measure representation on changed two-atom laws', math.isclose(mass_kl, measure_kl, abs_tol=1e-15), [mass_kl, measure_kl])
check('Density values need not sum to one', sum(row[0] for row in density_rows) != 1 and all(a + b == 1 for a, b, _ in density_rows))
check('Centered generator affine correction cancels under probability weights', sum(b - a for a, b in zip(p, q)) == 0)

# Signed observer value and supremum must remain different fields in L2.
d = [F(1, 4), F(-1, 2), F(1, 4)]
g = [0, 1, 0]
check('Changed event can have negative signed gap despite positive class supremum', sum(a*b for a,b in zip(d,g)) == F(-1,2) and sum(x for x in d if x > 0) == F(1,2))

# Pair multiplicities distinguish within-diagonal removal from accidental cross removal.
n, m = 2, 3
check('Unequal-size U-statistic denominator counts', n*(n-1) == 2 and m*(m-1) == 6 and n*m == 6)
# Linear-kernel example: X=(0,2), Y=(1,1,1). Equal empirical means, nonzero sample variance.
bx, by, cross = F(4,4), F(9,9), F(6,6)
ux, uy = F(0,2), F(6,6)
check('Unequal-size equal-mean linear example has B=0 and U=-1', bx+by-2*cross == 0 and ux+uy-2*cross == -1)
check('RBF coordinate and bandwidth unit conversion preserves exponent', F(30**2, 2*20**2) == F(3**2, 2*2**2))

payload = dict(status='PASS', scope='Independent complementary algebra and all 38 frozen source identities; no old or new lesson main replay', checks=checks)
(HERE / 'independent-design-checks-r1.json').write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')
print(json.dumps(dict(status='PASS', checks=len(checks))))
