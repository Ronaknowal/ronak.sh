"""Direct hand-state practice arithmetic only, no estimator/solver fits or old mains."""
from fractions import Fraction as Q
from pathlib import Path
import hashlib
import json
import math

target = Path(__file__).with_suffix('.json')
if target.exists():
    raise RuntimeError('Preserve this once-execution result')

def reconstruction(w, h):
    return [sum(w[c]*h[c][j] for c in range(len(w))) for j in range(len(h[0]))]

def loss(x, y):
    return sum((a-b)**2 for a, b in zip(x, y))/2

states = {}
h = [[Q(2), Q(0), Q(1)], [Q(0), Q(1), Q(2)]]
w = [Q(1), Q(3)]
normalized = [[v/sum(row) for v in row] for row in h]
amounts = [w[c]*sum(h[c]) for c in range(2)]
assert reconstruction(w, h) == reconstruction(amounts, normalized) == [2, 3, 7]
states['A'] = {'normalizedH': normalized, 'newW': amounts, 'x': [2, 3, 7]}
new_h = [Q(2), Q(7, 5)]
predictions = [new_h, [2*v for v in new_h]]
block_loss = loss([Q(2), Q(1)], predictions[0])+loss([Q(4), Q(3)], predictions[1])
assert block_loss == Q(1, 10)
states['B'] = {'numerator': [10, 7], 'denominator': [5, 5], 'Hnew': new_h, 'predictions': predictions, 'halfLoss': block_loss}
midpoint = [Q(5, 2), Q(5, 4)]
mid_product = midpoint[0]*midpoint[1]
assert loss([Q(2)], [mid_product]) == Q(81, 128)
states['F'] = {'midpoint': midpoint, 'product': mid_product, 'halfLoss': Q(81, 128)}
x, y, scale = 2., 1., 3.
kl = lambda a, b: a*math.log(a/b)-a+b
itakura = lambda a, b: a/b-math.log(a/b)-1
assert math.isclose(kl(scale*x, scale*y), scale*kl(x, y))
assert math.isclose(itakura(scale*x, scale*y), itakura(x, y))
states['G'] = {'FrobeniusMultiplier': scale**2, 'KLMultiplier': scale, 'ISMultiplier': 1}
states['H'] = {'gradient': [-3, 1], 'optimalH': [3, 1]}
h0 = [[Q(1), Q(0), Q(1)], [Q(0), Q(1), Q(1)]]
scaled_h = [[3*v for v in h0[0]], h0[1]]
assert reconstruction([Q(2, 3), Q(1)], scaled_h) == [2, 1, 3]
states['O'] = {'W': [Q(2, 3), Q(1)], 'H': scaled_h, 'contributionMasses': [4, 2]}
states['P'] = {'pairedProducts': [Q(9, 25), Q(16, 25)], 'selectedScaledProduct': Q(16, 5), 'tieProducts': [Q(12, 25), Q(12, 25)]}
a, z = Q(1, 2), Q(5, 4)
f = (z-2)**2
upper = (a-2)**2+(2*a-4)*(z-a)+(Q(2)+1/a)*(z-a)**2/2
assert (f, upper, upper-f) == (Q(9, 16), Q(9, 8), Q(9, 16))
states['Q'] = {'a': a, 'minimizer': z, 'f': f, 'q': upper, 'gap': upper-f}
assert Q(3, 10)*Q(15, 2)+Q(3, 5)*6 == Q(117, 20)
states['R'] = {'Wmass': Q(15, 2), 'Hmass': 6, 'penalty': Q(117, 20), 'oldPenalty': Q(51, 10)}
rows = {42: [Q(1), Q(0)], 7: [Q(0), Q(1)], 99: [Q(3, 4), Q(1, 4)], 10: [Q(0), Q(1)]}
norms = {i: sum(v*v for v in row) for i, row in rows.items()}
first = min(rows, key=lambda i: (-norms[i], -norms[i], i))
residuals = {i: [row[0], Q(0)] for i, row in rows.items()}
second = min(rows, key=lambda i: (-sum(v*v for v in residuals[i]), -norms[i], i))
assert (first, second) == (7, 42)
states['S'] = {'first': first, 'second': second, 'residuals': residuals, 'excludedZeroID': 6}
states['T'] = {'counts': [0, 1, 0], 'TFIDF': [0, 1+math.log(Q(4, 3)), 0], 'OOVCounts': [0, 0, 0]}
new_dictionary = [[Q(2), Q(0), Q(1)], h0[1]]
old_prediction = reconstruction([Q(2), Q(1)], new_dictionary)
fresh_prediction = reconstruction([Q(10, 9), Q(13, 9)], new_dictionary)
assert loss([2, 1, 3], old_prediction) == 2
assert loss([2, 1, 3], fresh_prediction) == Q(2, 9)
states['U'] = {'oldPrediction': old_prediction, 'freshPrediction': fresh_prediction, 'oldHalfLoss': 2, 'freshHalfLoss': Q(2, 9)}
states['W'] = {'KL_zeroObserved_prediction2': 2, 'positiveObserved_prediction0': 'infinite/refused', 'IS_zeroObserved': 'outside positive domain/refused'}
states['X'] = {'tensorAddress_1_0_1': 2*1*3, 'unfolded_row1_col1': 6, 'inversePositive': [Q(1, 2), Q(-1, 2)], 'inverseNegative': [Q(-1, 2), Q(1, 2)]}
states['D57Counts'] = [[0, 2, 1, 0], [0, 1, 2, 0], [2, 0, 0, 1], [1, 0, 0, 2], [1, 1, 1, 1]]
result = {'scope': 'Direct supplied hand arrays and formulas, no fits or old mains', 'sourceSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), 'states': states}
def encode(value):
    if isinstance(value, Q):
        return {'fraction': str(value), 'decimal': float(value)}
    raise TypeError(type(value).__name__)
target.write_text(json.dumps(result, indent=2, default=encode)+'\n', encoding='utf8')
print(json.dumps(result, indent=2, default=encode))
