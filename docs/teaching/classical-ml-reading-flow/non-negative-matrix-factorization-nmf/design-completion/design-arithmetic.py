"""New finite NMF design states only; no old programs, fits, studies or checkers."""
from fractions import Fraction as Q
import hashlib
import json
import math
from pathlib import Path

OWNER = Path(__file__).resolve().parent.parent
OUT = Path(__file__).with_suffix('.json')
if OUT.exists():
    raise RuntimeError('Preserve the once-execution receipt')


def transpose(a):
    return [list(row) for row in zip(*a)]


def product(a, b):
    return [[sum(x*y for x, y in zip(row, col)) for col in transpose(b)] for row in a]


def half_loss(x, w, h):
    y = product(w, h)
    return sum((x[i][j]-y[i][j])**2 for i in range(len(x)) for j in range(len(x[0])))/2


def coordinate_once(x, w, h):
    """One declared cyclic block on a supplied state, not a solver fit."""
    g = product(h, transpose(h))
    p = product(x, transpose(h))
    result = [row[:] for row in w]
    for c in range(len(h)):
        for i in range(len(x)):
            slope = sum(result[i][t]*g[t][c] for t in range(len(h)))-p[i][c]
            result[i][c] = max(Q(0), result[i][c]-slope/g[c][c])
    return result


def mu_block(x, w, h, first):
    if first == 'H':
        top = product(transpose(w), x)
        bottom = product(product(transpose(w), w), h)
        new = [[h[c][j]*top[c][j]/bottom[c][j] for j in range(len(h[0]))] for c in range(len(h))]
    else:
        top = product(x, transpose(h))
        bottom = product(w, product(h, transpose(h)))
        new = [[w[i][c]*top[i][c]/bottom[i][c] for c in range(len(h))] for i in range(len(w))]
    return new, top, bottom


def exact(value):
    if isinstance(value, Q):
        return {'fraction': str(value), 'decimal': float(value)}
    if isinstance(value, dict):
        return {k: exact(v) for k, v in value.items()}
    if isinstance(value, list):
        return [exact(v) for v in value]
    return value


x0 = [[Q(2), Q(1), Q(3)], [Q(1), Q(3), Q(4)], [Q(0), Q(2), Q(2)]]
h0 = [[Q(1), Q(0), Q(1)], [Q(0), Q(1), Q(1)]]
w0 = [[Q(1), Q(1)] for _ in x0]
w1 = coordinate_once(x0, w0, h0)
h1 = transpose(coordinate_once(transpose(x0), transpose(h0), transpose(w1)))
assert w1 == [[Q(2), Q(1)], [Q(2), Q(5, 2)], [Q(1, 2), Q(7, 4)]]
assert half_loss(x0, w1, h0) == Q(15, 16)
cd = {'X': x0, 'W0': w0, 'H0': h0, 'W1': w1, 'H1': h1,
      'afterWPrediction': product(w1, h0), 'afterHPrediction': product(w1, h1),
      'losses': [half_loss(x0, w0, h0), half_loss(x0, w1, h0), half_loss(x0, w1, h1)]}

h_mu, top, bottom = mu_block(x0, w0, h0, 'H')
assert top[0][2] == 9 and bottom[0][2] == 6 and h_mu[0][2] == Q(3, 2)

# These literal operands are read from preserved nmf_step.py source. We perform
# one explicitly new hand operation; never import/execute its forty-sweep main.
x_old = [[Q(2), Q(1), Q(3)], [Q(1), Q(2), Q(3)], [Q(3), Q(3), Q(6)]]
w_old = [[Q(1), Q(1, 2)], [Q(1, 2), Q(1)], [Q(1), Q(1)]]
h_old = [[Q(1), Q(1, 5), Q(4, 5)], [Q(1, 5), Q(1), Q(4, 5)]]
h_old_new, _, _ = mu_block(x_old, w_old, h_old, 'H')
w_old_new, _, _ = mu_block(x_old, w_old, h_old_new, 'W')
assert half_loss(x_old, w_old, h_old) == Q(853, 50)
assert round(float(half_loss(x_old, w_old_new, h_old_new)), 8) == .03944744

loss_values = []
for x in (1., 2.):
    for y in (1., 3.):
        loss_values.append({'x': x, 'y': y, 'FrobeniusHalfSquare': (x-y)**2/2,
                            'KL': x*math.log(x/y)-x+y, 'IS': x/y-math.log(x/y)-1})

auxiliary = []
for a in (Q(1), Q(1, 2), Q(2)):
    new = 5*a/(2*a+1)
    f = (new-2)**2
    q = (a-2)**2+(2*a-4)*(new-a)+(2+1/a)*(new-a)**2/2
    assert q >= f
    assert q-f == (new-a)**2/(2*a)
    auxiliary.append({'current': a, 'boundDiagonal': 2+1/a, 'minimum': new, 'actualLossAtMinimum': f, 'boundAtMinimum': q})

# A deliberately constructed 2x2 matrix with known orthonormal singular pairs;
# only its displayed algebra is used, no SVD/optimizer invocation.
xt = [[8.2, 2.4], [2.4, 6.8]]
wp = [[.8*math.sqrt(10), 0.], [.6*math.sqrt(10), 4/math.sqrt(5)]]
hp = transpose(wp)
fills = []
for delta in (0., .1, 2.):
    w = [[delta if value == 0 else value for value in row] for row in wp]
    h = [[delta if value == 0 else value for value in row] for row in hp]
    hn, _, _ = mu_block(xt, w, h, 'H')
    wn, _, _ = mu_block(xt, w, hn, 'W')
    fills.append({'fill': delta, 'W': w, 'H': h, 'prediction': product(w, h),
                  'initialHalfLoss': half_loss(xt, w, h), 'afterH': hn, 'afterW': wn,
                  'afterOneHThenWPrediction': product(wn, hn), 'afterOneHThenWHalfLoss': half_loss(xt, wn, hn)})
assert abs(fills[0]['initialHalfLoss']-7.38) < 1e-12
assert fills[0]['afterH'][1][0] == 0 and fills[0]['afterW'][0][1] == 0

comparisons = []
for a in (Q(1, 2), Q(1), Q(2)):
    xs = [x0[1]]
    ws = [[a, Q(1)]]
    wc = coordinate_once(xs, ws, h0)
    wm, _, _ = mu_block(xs, ws, h0, 'W')
    def pg(w):
        gram = product(h0, transpose(h0))
        cross = product(xs, transpose(h0))[0]
        grad = [sum(w[t]*gram[t][c] for t in range(2))-cross[c] for c in range(2)]
        return grad, sum(g*g for g in grad)  # all output coordinates strictly positive
    comparisons.append({'initialAmount': a, 'initial': ws, 'CD': wc, 'MU': wm,
                        'CDPrediction': product(wc, h0), 'MUPrediction': product(wm, h0),
                        'CDHalfLoss': half_loss(xs, wc, h0), 'MUHalfLoss': half_loss(xs, wm, h0),
                        'CDGradientAndPGSquared': list(pg(wc[0])), 'MUGradientAndPGSquared': list(pg(wm[0]))})

penalties = [{'scale': s, 'Wmass': 3/s+6, 'Hmass': 2*s+2,
              'Wpenalty': Q(3, 10)*(3/s+6), 'Hpenalty': Q(3, 5)*(2*s+2),
              'total': Q(3, 10)*(3/s+6)+Q(3, 5)*(2*s+2)} for s in (Q(1), Q(2), Q(1, 2), Q(3))]
idf = [1+math.log(2), 1+math.log(Q(4, 3)), 1+math.log(Q(4, 3))]
tfidf = [{'orbitCount': a, 'counts': [a, 1, 0], 'idf': idf, 'unnormalized': [a*idf[0], idf[1], 0.],
          'l2Normalized': [a*idf[0]/math.hypot(a*idf[0], idf[1]), idf[1]/math.hypot(a*idf[0], idf[1]), 0.]} for a in (2, 0, 4)]

spectra = []
for gain in (Q(1, 2), Q(1), Q(2)):
    x = [[gain*v for v in (2, 1, 3)]]
    t = min(Q(1), max(Q(0), (gain+1)/2))
    spectra.append({'gain': gain, 'query': x, 'coneAmounts': [[2*gain, gain]],
                    'simplexAmounts': [[t, 1-t]], 'simplexPrediction': product([[t, 1-t]], h0),
                    'simplexHalfLoss': half_loss(x, [[t, 1-t]], h0),
                    'normalizedNNLSAmounts': [[Q(2, 3), Q(1, 3)]],
                    'normalizedNNLSHalfLoss': half_loss(x, [[Q(2, 3), Q(1, 3)]], h0)})

online = []
for cell in (Q(1), Q(3, 2), Q(2)):
    h = [[cell, Q(0), Q(1)], h0[1]]
    x = [x0[0], x0[2]]
    saved_w = [[Q(2), Q(1)], [Q(0), Q(2)]]
    den = 2*cell**2+1
    fresh_w = [[(4*cell+2)/den, (4*cell**2-2*cell+1)/den], [Q(0), Q(2)]]
    assert all(v >= 0 for row in fresh_w for v in row)
    g = product(h, transpose(h))
    p = product(x, transpose(h))
    assert all(sum(fresh_w[0][t]*g[t][c] for t in range(2)) == p[0][c] for c in range(2))
    online.append({'cell': cell, 'H': h, 'savedW': saved_w, 'freshW': fresh_w,
                   'savedEncodingHalfLoss': half_loss(x, saved_w, h), 'freshEncodingHalfLoss': half_loss(x, fresh_w, h),
                   'savedA': product(transpose(saved_w), saved_w), 'savedB': product(transpose(saved_w), x),
                   'freshA': product(transpose(fresh_w), fresh_w), 'freshB': product(transpose(fresh_w), x)})
assert online[-1]['savedEncodingHalfLoss'] == 2 and online[-1]['freshEncodingHalfLoss'] == Q(2, 9)

# Read saved arrays as JSON only; never execute the containing JS module.
data_path = OWNER/'preserved/src/learn/data/nmf-data.js'
data_text = data_path.read_text(encoding='utf8')
decoder = json.JSONDecoder()
digits, _ = decoder.raw_decode(data_text.split('export const NMF_DIGITS = ', 1)[1])
saved = []
for source_id in (242, 256):
    at = next(i for i, row in enumerate(digits['test']) if row['sourceRow'] == source_id)
    row = digits['test'][at]
    # Keys are inspected before this source runs; raw feature values are /16.
    observed = [value/digits['scale'] for value in row['pixels']]
    h = digits['dictionary']
    w = digits['activations'][at]
    reconstruction = [sum(w[c]*h[c][j] for c in range(8)) for j in range(64)]
    contribution = [w[7]*h[7][j] for j in range(64)]
    removed = [reconstruction[j]-contribution[j] for j in range(64)]
    before = sum((observed[j]-reconstruction[j])**2 for j in range(64))/64
    after = sum((observed[j]-removed[j])**2 for j in range(64))/64
    saved.append({'sourceRow': source_id, 'component': 'C8', 'beforeMSE': before, 'afterMSE': after,
                  'contribution': contribution, 'originalMaximum': max(reconstruction),
                  'allComponentGain2Maximum': max(reconstruction[j]+w[c]*h[c][j] for c in range(8) for j in range(64))})

responsibility = [{'observedCount': c, 'prediction': 2, 'allocatedCounts': [c/2, c/2],
                    'KL': 2. if c == 0 else c*math.log(c/2)-c+2} for c in (0, 2, 4, 6)]
result = {'scope': 'Exact rational / finite closed-form / saved-array descriptive design states only. No optimizer fit or historical main/checker executed.',
          'sourceSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), 'D12': loss_values, 'D20': exact(cd),
          'D24': exact({'selected': [0, 2], 'numerator': top, 'denominator': bottom, 'newH': h_mu}),
          'D25': exact({'originalOperandsOnly': {'X': x_old, 'W': w_old, 'H': h_old}, 'newH': h_old_new, 'newW': w_old_new,
                       'initialHalfLoss': half_loss(x_old, w_old, h_old), 'newHalfLoss': half_loss(x_old, w_old_new, h_old_new),
                       'role': 'new direct one-step calculation; original forty-sweep stdout conserved separately'}),
          'D27': responsibility, 'D28': exact(auxiliary), 'D34': fills, 'D36': exact(comparisons), 'D39': exact(penalties),
          'D58': tfidf, 'D59': exact(spectra), 'D63': exact(online), 'savedDescriptive': saved,
          'savedInput': {'path': str(data_path), 'sha256': hashlib.sha256(data_path.read_bytes()).hexdigest()}, 'scientificFitsOrOriginalExecutions': 0}
OUT.write_text(json.dumps(result, indent=2)+'\n', encoding='utf8')
print(json.dumps(result, indent=2))
