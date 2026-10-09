"""New reading-flow evidence only; imports old models without executing mains."""
from pathlib import Path
import hashlib
import importlib.util
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT / 'scratch/lesson-tools/Lib/site-packages'))
import numpy as np
import torch

torch.set_num_threads(2)
torch.use_deterministic_algorithms(True)
torch.manual_seed(193)
CODE = ROOT / 'public/learn-code/rwkv-linear-attention-models'
RECORD = ROOT / 'docs/teaching/deep-learning-beginner/rwkv-linear-attention-models'


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, CODE / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


positive = load('positive_flow', 'linear-memory-operators.py')
weighted = load('weighted_flow', 'rwkv-weighted-state.py')
delta = load('delta_flow', 'delta-memory-operators.py')
original = load('trajectory_flow_original', 'trajectory_memory_models.py')
checks = []


def close(name, actual, expected, tolerance=3e-10):
    error = float((actual.detach() - expected.detach()).abs().max())
    torch.testing.assert_close(actual, expected, atol=tolerance, rtol=tolerance)
    checks.append({'name': name, 'maxAbsoluteError': error, 'tolerance': tolerance})


def compare_gradients(name, left, right, inputs):
    # Independent linear probes credit both outputs and final state slots.
    probes = [torch.randn_like(x) for x in left]
    a = sum((x * p).sum() for x, p in zip(left, probes))
    b = sum((x * p).sum() for x, p in zip(right, probes))
    ga = torch.autograd.grad(a, inputs, retain_graph=True)
    gb = torch.autograd.grad(b, inputs, retain_graph=True)
    for i, (x, y) in enumerate(zip(ga, gb)):
        close(f'{name}: gradient operand {i}', x, y)


def leaf(shape, positive=False):
    x = torch.randn(shape, dtype=torch.float64)
    if positive:
        x = x.abs() + .3
    return x.requires_grad_()


n, t, h, m, p = 2, 7, 2, 3, 2
q, k, v, s, z = leaf((n, t, h, m), True), leaf((n, t, h, m), True), leaf((n, t, h, p)), leaf((n, h, m, p)), leaf((n, h, m), True)
valid = torch.tensor([[1, 1, 0, 1, 1, 1, 0], [1, 0, 1, 1, 1, 1, 1]], dtype=torch.bool)
reset = torch.tensor([[0, 0, 1, 0, 1, 0, 0], [0, 1, 0, 1, 0, 0, 0]], dtype=torch.bool)
oracle, final = positive.dense_oracle(q, k, v, (s, z), valid, reset)
for size in (1, 2, 3, 8):
    y, state = positive.chunked(q, k, v, size, (s, z), valid, reset)
    for i, (a, b) in enumerate(zip((y, *state), (oracle, *final))):
        close(f'positive chunk {size} output/state {i}', a, b)
    compare_gradients(f'positive chunk {size}', (y, *state), (oracle, *final), (q, k, v, s, z))
y, state = positive.recurrent(q, k, v, (s, z), valid, reset)
compare_gradients('positive recurrence', (y, *state), (oracle, *final), (q, k, v, s, z))
for operation in (positive.recurrent, lambda *args: positive.chunked(*args, size=3)):
    try:
        operation(torch.zeros(1, 1, 1, 2), torch.zeros(1, 1, 1, 2), torch.ones(1, 1, 1, 1))
    except ValueError:
        checks.append({'name': 'zero-support active read rejects', 'passed': True})
    else:
        raise AssertionError('Zero support must be undefined.')
for operation in (positive.recurrent, lambda *args: positive.chunked(*args, size=1), positive.dense_oracle):
    try:
        huge = torch.full((1, 1, 1, 1), 1e200, dtype=torch.float64)
        operation(huge, huge, torch.ones_like(huge))
    except FloatingPointError:
        checks.append({'name': 'finite-input product overflow rejects', 'passed': True})
    else:
        raise AssertionError('Finite operands must not silently create a NaN answer.')
    try:
        operation(torch.ones(1, 1, 1, 1), torch.ones(1, 1, 1, 1), torch.ones(1, 1, 1))
    except ValueError:
        checks.append({'name': 'value rank contract rejects', 'passed': True})
    else:
        raise AssertionError('Three-dimensional value input is invalid.')

keys, values = leaf((2, 7, 3)), leaf((2, 7, 3))
decay, bonus = (-torch.rand(3, dtype=torch.float64) - .2).requires_grad_(), leaf((3,))
a, b, scale = leaf((2, 3)), leaf((2, 3), True), leaf((2, 3))
y, cache = weighted.weighted(keys, values, decay, bonus, (a, b, scale), valid, reset)
reference = weighted.direct_oracle(keys, values, decay, bonus, (a, b, scale), valid, reset)
close('WKV masked reset nonzero cache', y, reference)
compare_gradients('WKV all operands and initial cache', (y,), (reference,), (keys, values, decay, bonus, a, b, scale))
for offset in (-1000., 1000.):
    shifted, _ = weighted.weighted(keys + offset, values, decay, bonus, (a, b, scale + offset), valid, reset)
    close(f'WKV common log unit {offset}', shifted, reference)
for size in (1, 2, 3, 8):
    pieces, current = [], (a, b, scale)
    for start in range(0, 7, size):
        out, current = weighted.weighted(keys[:, start:start + size], values[:, start:start + size], decay, bonus, current, valid[:, start:start + size], reset[:, start:start + size])
        pieces.append(out)
    close(f'WKV continuation {size}', torch.cat(pieces, 1), y)
    for i, (actual, expected) in enumerate(zip(current, cache)):
        close(f'WKV saved slot {i} chunk {size}', actual, expected)
empty_y, _ = weighted.weighted(keys, values, decay, bonus, valid=valid, reset=reset)
empty_grads = torch.autograd.grad(empty_y.square().sum(), (keys, values, decay, bonus))
assert all(torch.isfinite(g).all() for g in empty_grads)
checks.append({'name': 'WKV empty sentinel gradients finite', 'passed': True})

q, k, v, initial = leaf((2, 7, 2, 3)), leaf((2, 7, 2, 3)), leaf((2, 7, 2, 2)), leaf((2, 2, 2, 3))
retention = torch.sigmoid(leaf((2, 7, 2, 3)))
removal = leaf((2, 7, 2, 3))
for rule in ('additive', 'delta', 'gated', 'goose'):
    rate = torch.sigmoid(leaf((2, 7, 2, 3 if rule == 'goose' else 1)))
    arguments = dict(rule=rule, rate=rate, retention=retention, removal=removal, state=initial, valid=valid, reset=reset)
    y, final = delta.memory(q, k, v, **arguments)
    # Independent dense affine transition. It shares no rank-one implementation.
    current, outputs = initial, []
    for i in range(7):
        active = valid[:, i, None, None, None]
        clear = (reset[:, i] & valid[:, i])[:, None, None, None]
        current = torch.where(clear, torch.zeros_like(current), current)
        identity = torch.eye(3, dtype=q.dtype).expand(2, 2, 3, 3)
        if rule == 'delta':
            transition = identity - rate[:, i, ..., None] * k[:, i, ..., :, None] * k[:, i, ..., None, :]
            write = rate[:, i, ..., None] * v[:, i, ..., :, None] * k[:, i, ..., None, :]
        elif rule == 'goose':
            transition = torch.diag_embed(retention[:, i]) - removal[:, i, ..., :, None] * (rate[:, i] * removal[:, i])[..., None, :]
            write = v[:, i, ..., :, None] * k[:, i, ..., None, :]
        else:
            transition = torch.diag_embed(retention[:, i]) if rule == 'gated' else identity
            write = v[:, i, ..., :, None] * k[:, i, ..., None, :]
        current = torch.where(active, current @ transition + write, current)
        output = (current @ q[:, i, ..., None]).squeeze(-1)
        outputs.append(torch.where(valid[:, i, None, None], output, torch.zeros_like(output)))
    expected = torch.stack(outputs, 1)
    close(f'{rule} dense output', y, expected)
    close(f'{rule} dense final cache', final, current)
    used = [q, k, v, initial]
    if rule in ('delta', 'goose'):
        used.append(rate)
    if rule in ('gated', 'goose'):
        used.append(retention)
    if rule == 'goose':
        used.append(removal)
    compare_gradients(f'{rule} all active operands/cache', (y, final), (expected, current), used)
    for size in (1, 2, 3, 8):
        pieces, saved = [], initial
        for start in range(0, 7, size):
            arguments = dict(rule=rule, rate=rate[:, start:start + size], retention=retention[:, start:start + size], removal=removal[:, start:start + size], state=saved, valid=valid[:, start:start + size], reset=reset[:, start:start + size])
            out, saved = delta.memory(q[:, start:start + size], k[:, start:start + size], v[:, start:start + size], **arguments)
            pieces.append(out)
        close(f'{rule} chunk {size}', torch.cat(pieces, 1), y)
        close(f'{rule} final chunk {size}', saved, final)

# Export existing fits without training or touching old deployed assets/receipts.
npz = np.load(CODE / 'trajectory-memory-fits.npz')
report = json.loads((CODE / 'trajectory-results.json').read_text())
raw = np.loadtxt(CODE / 'movement_libras.data', delimiter=',')
models = {}
cases = []
for kind in ('rwkv4', 'positive_kernel'):
    for seed in (17, 41):
        prefix = f'{kind}_seed{seed}::'
        parameters = {name[len(prefix):]: array.tolist() for name, array in npz.items() if name.startswith(prefix) and not name.endswith('::logits')}
        models[f'{kind}:{seed}'] = parameters
        model = original.TrajectoryMemoryClassifier(kind)
        model.load_state_dict({name: torch.tensor(value, dtype=torch.float32) for name, value in parameters.items()})
        model.eval()
        for row_id, mutation in ((7, 'original'), (20, 'original'), (7, 'reflect'), (20, 'reverse'), (20, 'point31')):
            points = raw[row_id - 1, :90].reshape(45, 2).copy()
            if mutation == 'reflect':
                points[22, 0] = 1 - points[22, 0]
            if mutation == 'reverse':
                points = points[::-1].copy()
            if mutation == 'point31':
                points[30] = [.2, .8]
            x = torch.tensor(2 * points - 1, dtype=torch.float32)[None]
            with torch.no_grad():
                features, _ = model.features(x)
                current = model.classifier(features.mean(1))
                first, saved = model.features(x[:, :22])
                second, _ = model.features(x[:, 22:], saved)
                carried = model.classifier(torch.cat([first, second], 1).mean(1))
                reset_features, _ = model.features(x[:, 22:])
                reset_logits = model.classifier(torch.cat([first, reset_features], 1).mean(1))
            close(f'{kind} seed {seed} {row_id} {mutation} carry', current, carried, 2e-5)
            cases.append({'kind': kind, 'seed': seed, 'sourceRow': row_id, 'mutation': mutation, 'points': points.tolist(),
                          'logits': current[0].tolist(), 'carried': carried[0].tolist(), 'reset': reset_logits[0].tolist(),
                          'prefixFeatures': features[0, :30].tolist()})
        validation = report['roles']['validation']
        with torch.no_grad():
            x = torch.tensor(2 * raw[np.array(validation) - 1, :90].reshape(50, 45, 2) - 1, dtype=torch.float32)
            computed = model(x)
        close(f'{kind} seed {seed} all validation vs saved NPZ', computed, torch.tensor(npz[prefix + 'logits'][np.array(validation) - 1]), 2e-5)

asset = {'schema': 1, 'models': models, 'specimens': [{'sourceRow': int(i), 'label': int(raw[i - 1, -1]), 'points': raw[i - 1, :90].reshape(45, 2).tolist()} for i in report['roles']['validation']],
         'recorded': report['models'], 'baseline': report['baseline'], 'source': 'Exact retained NPZ; no new training; same validation-only input domain.'}
asset_path = ROOT / 'public/learn-assets/rwkv-linear-attention-models/trajectory-reading-flow-models.json'
asset_path.write_text(json.dumps(asset, separators=(',', ':')) + '\n', encoding='utf-8')
programs = ['linear-memory-operators.py', 'rwkv-weighted-state.py', 'delta-memory-operators.py', 'trajectory_memory_models.py', 'trajectory-memory-fits.npz']
bindings = {str((CODE / name).relative_to(ROOT)).replace('\\', '/'): hashlib.sha256((CODE / name).read_bytes()).hexdigest() for name in programs}
bindings[str(Path(__file__).relative_to(ROOT)).replace('\\', '/')] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
bindings[str(asset_path.relative_to(ROOT)).replace('\\', '/')] = hashlib.sha256(asset_path.read_bytes()).hexdigest()
receipt = {'passed': True, 'sourceHashes': bindings, 'checks': checks, 'checkCount': len(checks), 'nativeCases': cases,
           'runtime': {'torch': torch.__version__, 'numpy': np.__version__, 'device': 'cpu'},
           'limits': 'No new fit, released checkpoint, GPU kernel or browser execution.'}
(RECORD / 'reading-flow-native.json').write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
print('PASS', len(checks), 'checks;', len(cases), 'edited native cases; all four validation fits retained')
