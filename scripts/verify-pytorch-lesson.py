"""Native evidence for the PyTorch lesson, including independently derived cases."""
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import sys

sys.dont_write_bytecode = True  # Verification must not deploy imported-code caches.

import numpy as np
import torch

ROOT = Path(__file__).resolve().parents[1]


def load(name):
    path = ROOT / 'public/learn-code/pytorch' / f'{name}.py'
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


workflow = load('pytorch_workflow')
diagnostics = load('pytorch_state_and_gradients')
with tempfile.TemporaryDirectory(prefix='pytorch-lesson-') as directory:
    result = workflow.run(ROOT / 'public/learn-assets/neural-training-diagnostics-reproducible-experiments/wine.csv', Path(directory) / 'model.pt')
assert result['first_batch_max_gradient_error'] < 1e-12
assert result['first_batch_max_update_error'] < 1e-12
assert result['reload_max_logit_error'] == 0
assert result['split_rows'] == {'train': 105, 'validation': 36, 'test': 37}
states = diagnostics.main()
assert states['layout']['base'][0][1] == 9
assert states['layout']['copy'][1][0] == -3
assert states['accumulated_gradients'] == [-2.5, -5.0]
assert states['eval_tracks_gradient'] and not states['training_no_grad_tracks_gradient']
assert states['custom_gradcheck']
np.testing.assert_allclose(states['vjp'], [1.2, 1.4])
np.testing.assert_allclose(states['hessian_times_ones'], [1.08, 5.88])

# Central differences independently test a changed smooth network state.
rng = np.random.default_rng(81)
x = rng.normal(size=(5, 3)); labels = np.array([0, 1, 1, 0, 1])
parameters = workflow.initialize(3, 4, 2)
loss, gradients, _ = workflow.manual_loss_and_gradients(x, labels, parameters)
finite_difference_errors = []
for name, index in [('w1', (1, 2)), ('b1', (0,)), ('w2', (2, 1)), ('b2', (1,))]:
    old = parameters[name][index]
    parameters[name][index] = old + 1e-6
    plus = workflow.manual_loss_and_gradients(x, labels, parameters)[0]
    parameters[name][index] = old - 1e-6
    minus = workflow.manual_loss_and_gradients(x, labels, parameters)[0]
    parameters[name][index] = old
    finite_difference_errors.append(abs((plus - minus) / 2e-6 - gradients[name][index]))
assert max(finite_difference_errors) < 1e-8

# Extreme logits retain finite stable loss and derivatives.
extreme = workflow.initialize(3, 4, 2)
extreme['b2'][:] = [1000, -1000]
large_loss, large_gradients, _ = workflow.manual_loss_and_gradients(x, labels, extreme)
assert np.isfinite(large_loss) and all(np.isfinite(g).all() for g in large_gradients.values())

# Browser fixture reference values computed by real autograd.
fixtures = []
for weight, rate, passes, reduction in [(1, .1, 1, 'mean'), (1, .1, 2, 'mean'), (2, .5, 3, 'sum'), (0, 1, 1, 'mean'), (-1, .2, 3, 'sum')]:
    w = torch.tensor(float(weight), dtype=torch.float64, requires_grad=True)
    inputs = torch.tensor([1., 2.], dtype=torch.float64)
    for _ in range(passes):
        errors = .5 * (w * inputs - 2 * inputs).square()
        current_loss = errors.mean() if reduction == 'mean' else errors.sum()
        current_loss.backward()
    next_w = w.item() - rate * w.grad.item()
    after = .5 * (next_w * inputs - 2 * inputs).square()
    fixtures.append({'weight': weight, 'rate': rate, 'passes': passes, 'reduction': reduction,
                     'loss': current_loss.item(), 'accumulated': w.grad.item(), 'nextWeight': next_w,
                     'nextLoss': (after.mean() if reduction == 'mean' else after.sum()).item()})
try:
    ((w * inputs).detach() - 2 * inputs).square().mean().backward()
    raise AssertionError('Detached-only loss unexpectedly backpropagated')
except RuntimeError:
    pass
values = torch.arange(1., 1001., requires_grad=True)
dropout = torch.nn.Dropout(.5)
with torch.no_grad():
    dropped = dropout(values)
assert not dropped.requires_grad
assert ((dropped == 0) | (dropped == 2 * values)).all()
dropout.eval()
assert torch.equal(dropout(values), values)

del result['history']
paths = ['public/learn-code/pytorch/pytorch_workflow.py', 'public/learn-code/pytorch/pytorch_state_and_gradients.py',
         'public/learn-assets/neural-training-diagnostics-reproducible-experiments/wine.csv', 'scripts/verify-pytorch-lesson.py']
evidence = {'checkedOn': '2026-09-28', 'execution': 'CPU only; no GPU performance or hosted services tested',
            'workflow': result, 'diagnostics': states, 'finite_difference_max_error': max(finite_difference_errors),
            'extreme_logit_loss': large_loss, 'gradient_fixtures': fixtures,
            'sourceHashes': {path: hashlib.sha256((ROOT / path).read_bytes()).hexdigest() for path in paths}}
destination = ROOT / 'docs/teaching/core-frameworks/pytorch/native-evidence.json'
destination.write_text(json.dumps(evidence, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'passed': True, 'evidence': str(destination), 'workflow': result}, indent=2))
