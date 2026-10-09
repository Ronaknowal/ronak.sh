"""Exact supplied-state NMF design arithmetic; no fitted algorithm or old source executed."""
from fractions import Fraction as Q
import json
from pathlib import Path


H = [[Q(1), Q(0), Q(1)], [Q(0), Q(1), Q(1)]]
X = [[Q(2), Q(1), Q(3)], [Q(1), Q(3), Q(4)], [Q(0), Q(2), Q(2)]]
G = [[sum(a*b for a, b in zip(left, right)) for right in H] for left in H]
rows = []
for x in X:
    p = [sum(a*b for a, b in zip(x, pattern)) for pattern in H]
    w = [Q(1), Q(1)]
    steps = []
    for c in range(2):
        slope = sum(w[t]*G[t][c] for t in range(2))-p[c]
        w[c] = max(Q(0), w[c]-slope/G[c][c])
        predicted = [sum(w[t]*H[t][j] for t in range(2)) for j in range(3)]
        loss = sum((x[j]-predicted[j])**2 for j in range(3))/2
        steps.append({'coordinate': c, 'slopeBefore': str(slope), 'amounts': list(map(str, w)), 'prediction': list(map(str, predicted)), 'halfLoss': str(loss)})
    rows.append({'observed': list(map(str, x)), 'cross': list(map(str, p)), 'steps': steps})
assert rows[0]['steps'][-1]['amounts'] == ['2', '1']
assert rows[1]['steps'][-1]['amounts'] == ['2', '5/2']
assert rows[1]['steps'][-1]['halfLoss'] == '3/4'
assert rows[2]['steps'][-1]['amounts'] == ['1/2', '7/4']
assert rows[2]['steps'][-1]['halfLoss'] == '3/16'

nonconvex = Q(1, 2)*(1-Q(3, 2)*Q(3, 4))**2
assert nonconvex == Q(1, 128)
# Explicit alternative positive dictionary, separate from H above.
shear_h = [[Q(1), Q(1), Q(1)], [Q(0), Q(1), Q(1)]]
shear_w = [Q(2), Q(1)]
t = Q(1, 2)
new_h = [[Q(1), 1-t, 1-t], shear_h[1]]
new_w = [shear_w[0], shear_w[1]+t*shear_w[0]]
before = [sum(shear_w[c]*shear_h[c][j] for c in range(2)) for j in range(3)]
after = [sum(new_w[c]*new_h[c][j] for c in range(2)) for j in range(3)]
assert before == after == [Q(2), Q(3), Q(3)]

support = [[1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 1], [1, 0, 0, 1]]
assert all(support[i][j]*support[j][i] == 0 for i in range(4) for j in range(i+1, 4))
# First three rows/columns have triangular determinant1; alternating signed row sum is0.
assert all(support[0][j]-support[1][j]+support[2][j]-support[3][j] == 0 for j in range(4))

result = {'scope': 'Exact finite supplied-state arithmetic, no numerical solver/fit/main/checker replay', 'gram': [[str(v) for v in row] for row in G], 'coordinateRows': rows, 'nonconvexMidpointHalfLoss': str(nonconvex), 'separateShearFixture': {'H': [[str(v) for v in row] for row in shear_h], 'newH': [[str(v) for v in row] for row in new_h], 'W': list(map(str, shear_w)), 'newW': list(map(str, new_w)), 'bothPrediction': list(map(str, before))}, 'supportFixture': {'matrix': support, 'ordinaryRank': 3, 'nonnegativeRank': 4, 'reason': 'Independent3x3minor; alternating dependence; each diagonal positive entry requires separate rectangle due forbidden crosszeros; four-row factorization supplies upperbound4'}, 'scientificExecutions': 0}
output = Path(__file__).with_suffix('.json')
if output.exists():
    raise RuntimeError('Preserve existing arithmetic receipt')
output.write_text(json.dumps(result, indent=2)+'\n', encoding='utf8')
print(json.dumps(result, indent=2))
