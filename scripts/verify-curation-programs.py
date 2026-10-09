"""Complementary native checks for the curation manuscript, before runtime."""
from collections import Counter
from hashlib import sha256
import json
from pathlib import Path
import sys
import numpy as np
from scipy.special import expit
from sklearn.metrics import confusion_matrix, brier_score_loss, f1_score

ROOT = Path(__file__).resolve().parents[1]
PROGRAMS = ROOT / 'public/learn-code/data-curation-pipelines'
sys.path.insert(0, str(PROGRAMS))
from linear_curator import Features, fit, objective_gradient, sigmoid
from curation_libraries import fit_library
from curation_signals import metrics, signals, select, pipeline
from reference_selection import fit_reference, score, log_ratio, weighted_without_replacement

checks = []
def record(name, detail):
    checks.append({'name': name, 'detail': detail})

for text, line_share, char_share in [('aaaa\nb\naaaa', 1/3, 4/9), ('aaaaaaaa\nb\naaaaaaaa', 1/3, 8/17), (' a  a \na a\n\n', .5, .5)]:
    result = signals(text)
    assert result['duplicate_line_incidence'] == line_share
    assert result['duplicate_character_share'] == char_share
assert signals(' \n\t')['duplicate_character_share'] is None
record('Measurement units, normalization, first occurrence and empty input', 4)

rng = np.random.default_rng(731)
maximum_error = 0.
for n, d in [(2, 1), (5, 4), (13, 7)]:
    matrix, weights = rng.normal(size=(n, d)), rng.normal(size=d)
    labels, bias = rng.integers(0, 2, size=n), .37
    value, gradient, db = objective_gradient(matrix, labels, weights, bias)
    vector = np.r_[weights, bias]
    def objective(v):
        return objective_gradient(matrix, labels, v[:-1], v[-1])[0]
    numerical = []
    for j in range(d + 1):
        step = np.eye(d + 1)[j] * 1e-5
        numerical.append((objective(vector + step) - objective(vector - step)) / 2e-5)
    error = float(np.max(np.abs(np.r_[gradient, db] - numerical)))
    maximum_error = max(maximum_error, error)
    assert error < 1e-9
np.testing.assert_allclose(sigmoid(np.array([-1000, -10, 0, 10, 1000])), expit([-1000, -10, 0, 10, 1000]))
record('Independent central differences and saturated stable sigmoid', maximum_error)

texts = ['Energy and motion energy.', 'motion is measured', 'Buy the sale!', 'Home subscribe sale']
labels = np.array([1, 1, 0, 0])
features = Features.fit(texts)
matrix = features.transform(texts)
model = fit(matrix, labels)
assert model['converged']
assert all(b['objective'] <= a['objective'] + 1e-13 for a, b in zip(model['history'], model['history'][1:]))
ordinary = fit_library(texts, labels, features)
np.testing.assert_allclose(matrix, ordinary['features'].transform(texts).toarray(), atol=1e-14)
np.testing.assert_allclose(sigmoid(matrix @ model['weights'] + model['bias']), ordinary.predict_proba(texts)[:, 1], atol=1e-7)
assert not features.transform(['completelyunseen'])[0].any()
record('Training-only features, objective parity, loss descent and frozen unknown word', len(features.vocabulary))

for n in [0, 1, 6, 37]:
    y, p = rng.integers(0, 2, n).tolist(), rng.random(n).tolist()
    for threshold in [0, .3, .6, 1]:
        actual = metrics(y, p, threshold)
        predicted = [x >= threshold for x in p]
        if n:
            tn, fp, fn, tp = confusion_matrix(y, predicted, labels=[0, 1]).ravel().tolist()
            assert [tn, fp, fn, tp] == [actual[k] for k in ['tn', 'fp', 'fn', 'tp']]
            assert abs(brier_score_loss(y, p) - actual['brier']) < 1e-14
            if 2 * tp + fp + fn:
                assert abs(f1_score(y, predicted, zero_division=0) - actual['f1']) < 1e-14
        else:
            assert actual['precision'] is actual['recall'] is actual['f1'] is actual['brier'] is None
        json.dumps(actual, allow_nan=False)
assert metrics([1], [.1], .5)['precision'] is None
assert metrics([1], [.1], .5)['f1'] == 0
record('Independent sklearn confusion/Brier/F1 and undefined metrics', 16)

rows = [{'id': 'C', 'score': .8}, {'id': 'A', 'score': .8}, {'id': 'B', 'score': .3}]
assert [r['id'] for r in select(rows, keep=1)] == ['A']
assert not select(rows, keep=0)
predicates = [('low_id', lambda r: r['id'] < 'B'), ('score', lambda r: r['score'] > .5)]
forward, backward = pipeline(rows, predicates), pipeline(rows, list(reversed(predicates)))
assert [r['id'] for r in forward if r['kept']] == [r['id'] for r in backward if r['kept']]
assert next(r for r in forward if r['id'] == 'B')['first_failure'] != next(r for r in backward if r['id'] == 'B')['first_failure']
assert metrics([1, 0, 1], [.9, .8, .7], .8)['precision'] < metrics([1, 0, 1], [.9, .8, .7], .7)['precision']
record('Stable exact-k ties, predicate intersection/attribution and nonmonotone precision', 5)

general = fit_reference(['a a b'], ['a', 'b'])
target = fit_reference(['a b b'], ['a', 'b'])
assert abs(sum(general.values()) - 1) < 1e-15
assert score('novel other', general)['words'] == ['<UNK>', '<UNK>']
for text in ['a b b', 'a', 'b b b b']:
    result = log_ratio(text, target, general)
    difference = score(text, general)['cross_entropy'] - score(text, target)['cross_entropy']
    assert abs(result['mean_log_ratio'] - difference) < 1e-14
    assert log_ratio(text, general, general)['total_log_ratio'] == 0
assert score('', general)['cross_entropy'] is None
counts = Counter(weighted_without_replacement(['A', 'B'], [0., np.log(3)], 1, seed=i)[0] for i in range(10000))
assert abs(counts['B'] / 10000 - .75) < .02
assert len(set(weighted_without_replacement(['A', 'B'], [10000., 9999.], 2))) == 2
record('Shared finite support, UNK, cross-entropy difference and independent weighted-race frequency', dict(counts))

study_root = ROOT / 'scratch/curation-study'
old_model = (study_root / 'fixed-run/model.json').read_bytes()
new_model = (study_root / 'json-corrected-run/model.json').read_bytes()
assert old_model == new_model
study = json.loads((study_root / 'json-corrected-run/study.json').read_text())
assert study['comparisons']['probability_max_error'] < 1e-7
assert sum(sum(c.values()) for c in study['class_counts'].values()) == 2000
groups = {}
for row in study['predictions']:
    assert groups.setdefault(row['group'], row['split']) == row['split']
assert study['selected']['scratch']['final']['tp'] == 16
assert study['selected']['scratch']['final']['fp'] == 55
record('Actual study integrity and exact same fitted model after JSON serialization repair', {'records': 2000, 'groups': len(groups), 'model_sha256': sha256(new_model).hexdigest()})

output = ROOT / 'docs/teaching/llm-architecture-training/data-curation-pipelines-curator-models-quality-filtering/native-program-checks.json'
output.write_text(json.dumps({'passed': True, 'checks': checks,
    'programs': {p.name: sha256(p.read_bytes()).hexdigest() for p in PROGRAMS.glob('*.py')},
    'scientific_rerun': 'First run completed fit but failed JSON serialization of NumPy metrics. Same protocol retried after native-scalar conversion; fitted model bytes identical. No performance-driven change.'}, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'passed': True, 'groups': len(checks)}))
