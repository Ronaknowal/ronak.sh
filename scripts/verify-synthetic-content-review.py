"""Different reviewer: changed mechanisms and retained outcomes, no fits/generation."""
import hashlib
import json
import math
from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public/learn-code/synthetic-data'
DOC = ROOT / 'docs/teaching/llm-architecture-training/synthetic-data-generation-for-pre-training'
sys.path.insert(0, str(PUBLIC))
import numpy as np
import torch
from synthetic_sampling import distribution, inverse_cdf
from synthetic_verification import arithmetic, check_candidate, selection
from synthetic_corpus import read_sources, select_candidates, WindowPool
from tiny_causal_lm import TinyLM

def read(path):
    return json.loads(path.read_text(encoding='utf-8'))

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

checks = []
inputs = read(DOC / 'content-inputs.json')
for row in inputs['files']:
    assert digest(ROOT / row['path']) == row['sha256'], row['path']
with zipfile.ZipFile(PUBLIC / 'synthetic-programs-data.zip') as bundle:
    names = bundle.namelist()
    for name in names:
        assert bundle.read(name) == (PUBLIC / name).read_bytes(), name
checks.append({'name': 'source and archive guards', 'inputs': len(inputs['files']), 'members': len(names)})

sources = read_sources()
candidates = read(PUBLIC / 'candidates.json')
selected = select_candidates(candidates['records'], sources['records'])
assert selected == read(PUBLIC / 'selection.json')
protocol = read(DOC / 'prospective-protocol.json')
assert protocol['source_records'] == sources
assert len(candidates['records']) == len(protocol['prompts']) == 34
for actual, planned in zip(candidates['records'], protocol['prompts']):
    for key in ('id', 'source_id', 'style', 'seed', 'prompt', 'full_input_ids'):
        assert actual[key] == planned[key], (actual['id'], key)
    assert actual['input_ids'] == planned['retained_input_ids']
    assert not actual['input_truncated']
    assert actual['output_ids'][0] == actual['decoder_start_id']
    assert (actual['output_ids'][-1] == actual['eos_id']) == (actual['termination'] == 'EOS')
assert sum(len(row['output_ids']) - 1 for row in candidates['records']) == 1062
assert sum(row['termination'] == 'length cap' for row in candidates['records']) == 2
checks.append({'name': 'prospective prompts, selection, termination and byte units', 'candidates': 34, 'kept': len(selected['kept']), 'new_teacher_tokens': 1062})

# Changed records include a zero-window record and multibyte characters.
records = [{'id': 'empty', 'text': ''}, {'id': 'short', 'text': 'a'},
           {'id': 'unicode', 'text': 'éabcd'}, {'id': 'last', 'text': 'xyzuv'}]
pool = WindowPool(records, context=3)
independent = [(i, start, list(row['text'].encode('utf-8')[start:start + 4]))
               for i, row in enumerate(records)
               for start in range(max(0, len(row['text'].encode('utf-8')) - 3))]
for rank, (record, start, expected) in enumerate(independent):
    assert pool.locate(rank) == (record, start)
    assert pool.sample((rank + .25) / pool.total).tolist() == expected
heldout = [row for row in sources['records'] if row['split'] == 'heldout']
assert sum(len(row['text'].encode('utf-8')) - 1 for row in heldout) == 1862
checks.append({'name': 'changed zero-length and UTF-8 window boundaries', 'windows': len(independent), 'heldout_targets': 1862})

for temperature in (.2, 1., 4.):
    for top_p in (.15, .55, .91, 1.):
        for logits in ([0., 0., 0., 0.], [2.2, -1.3, .9, -.2]):
            state = distribution(logits, temperature, top_p)
            weights = [math.exp((x - max(logits)) / temperature) for x in logits]
            probabilities = [x / sum(weights) for x in weights]
            order = sorted(range(4), key=lambda i: (-probabilities[i], i))
            retained, cumulative = [], 0.
            for i in order:
                retained.append(i)
                cumulative += probabilities[i]
                if cumulative >= top_p:
                    break
            expected = [probabilities[i] / cumulative if i in retained else 0. for i in range(4)]
            np.testing.assert_allclose(state['nucleus'], expected, atol=1e-14, rtol=1e-14)
assert arithmetic('-(3+5)/6 + 2/3') == arithmetic('-2/3')
assert check_candidate('(3+4)*2', '14', ['3+4=8', '8*2=14'])['steps_valid'] == [False, False]
for invalid in ('True', '2**4', '1.5', 'name', 'x()', '[1]', '1/0'):
    assert not check_candidate(invalid, '1', [])['final_correct']
assert math.isclose(selection(.2, .9, .1, .06, 0)['precision'], 9/13)
assert selection(.2, 0, 0)['precision'] is None
zero_mass = np.r_[np.full(10, .1), 0.]
boundary = np.nextafter(1., 0.)
draw = inverse_cdf(zero_mass, boundary)
checks.append({'name': '24 changed nucleus fixtures and exact grammar', 'cdf_boundary_probe': {'vector': zero_mass.tolist(), 'sum': float(zero_mass.sum()), 'uniform': float(boundary), 'returned_id': draw, 'returned_mass': float(zero_mass[draw])}})

# Enumerate the finite next-generation distribution exactly, without drawing paths.
q = np.array([.5, .3, .2])
h = 1 - np.square(q).sum()
cases = []
for n in (2, 5, 20):
    total, replacement, accumulation = 0., 0., 0.
    for a in range(n + 1):
        for b in range(n - a + 1):
            c = n - a - b
            mass = math.factorial(n) / math.prod(math.factorial(x) for x in (a,b,c))
            mass *= math.prod(float(p)**k for p,k in zip(q, (a,b,c)))
            empirical = np.array([a,b,c]) / n
            total += mass
            replacement += mass * (1 - np.square(empirical).sum())
            accumulation += mass * (1 - np.square((q + empirical) / 2).sum())
    assert math.isclose(total, 1, abs_tol=1e-13)
    assert math.isclose(replacement, (1-1/n)*h, abs_tol=1e-13)
    assert math.isclose(accumulation, (1-1/(4*n))*h, abs_tol=1e-13)
    cases.append({'new_samples': n, 'replacement_expected_H': replacement, 'first_accumulation_expected_H': accumulation})
checks.append({'name': 'independent multinomial enumeration of changed recurrence', 'cases': cases})

study = read(PUBLIC / 'study.json')
pairs = []
for seed in (17,29,43):
    runs = {row['arm']: row for row in study['fits'] if row['seed'] == seed}
    assert runs['raw']['history'] == runs['copy']['history']
    assert runs['raw']['final_weight_sha256'] == runs['copy']['final_weight_sha256']
    assert len({run['initial_weight_sha256'] for run in runs.values()}) == 1
    for run in runs.values():
        assert run['training_targets'] == 300*16*32
        assert [row['step'] for row in run['history']] == [0,100,200,300]
        for snapshot in run['history']:
            numerator = sum(row['nll_sum'] for row in snapshot['paragraphs'])
            denominator = sum(row['targets'] for row in snapshot['paragraphs'])
            assert denominator == 1862
            assert math.isclose(snapshot['byte_nll'], numerator/denominator, abs_tol=1e-14)
    pairs.append(runs['generated']['history'][-1]['byte_nll'] - runs['raw']['history'][-1]['byte_nll'])
states = {arm: torch.load(PUBLIC / f'{arm}-seed17.pt', weights_only=True) for arm in ('raw','copy','generated')}
assert states['raw'].keys() == states['copy'].keys()
assert all(torch.equal(value, states['copy'][key]) for key,value in states['raw'].items())
torch.set_num_threads(2)
model = TinyLM(256, context=32, width=32, heads=2, layers=2).eval()
model.load_state_dict(states['generated'])
ids = torch.tensor([[17, 201, 33, 99, 5]])
changed = ids.clone(); changed[0,3:] = torch.tensor([255,1])
with torch.no_grad():
    before, after = model(ids), model(changed)
assert torch.equal(before[:,:3], after[:,:3])
assert not torch.equal(before[:,3:], after[:,3:])
normalization_errors = []
for arm in study['inspector']:
    for row in arm['rows']:
        assert len(row['probabilities']) == 256
        normalization_errors.append(abs(sum(row['probabilities']) - 1))
        assert normalization_errors[-1] < 8 * np.finfo(np.float32).eps
checks.append({'name': 'all nine saved outcomes and three actual states', 'paired_differences': pairs, 'mean': sum(pairs)/3, 'raw_copy_tensors_exact': True, 'new_saved_model_causality_forward': True, 'recorded_vectors': 48, 'max_float32_normalization_error': max(normalization_errors)})

result = {'reviewer': 'training_author', 'fits': 0, 'neural_generations': 0,
          'checker_history': 'First checker used input_ids instead of prospective retained_input_ids; KeyError before numerical probes. Second used a 2e-7 normalization tolerance for saved float32 softmax; actual maximum2.86954e-7. Exact predecessors preserved; source key mapping and tolerance8*float32.eps corrected. No study executed.',
          'input_manifest_sha256': digest(DOC / 'content-inputs.json'),
          'script_sha256': digest(Path(__file__)), 'checks': checks,
          'finding': 'R1: upper inverse-CDF rounding interval can select a trailing zero-probability token' if zero_mass[draw] == 0 else None}
with (DOC / 'content-review-checks.json').open('x', encoding='utf-8') as stream:
    json.dump(result, stream, indent=2); stream.write('\n')
print(json.dumps(result, indent=2))
