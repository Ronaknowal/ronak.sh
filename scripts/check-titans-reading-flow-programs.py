"""Bounded checks of the two new instructional programs. No original fitter imported."""
from pathlib import Path
import sys
import json
import hashlib
import numpy as np
import torch
from collections import OrderedDict
from torch.func import functional_call

root = Path(__file__).resolve().parents[1]
draft = root / 'docs/teaching/drafts/titans-multi-memory-architecture'
sys.path.insert(0, str(draft))
import memory_write_walkthrough as manual
import titans_learning_routes as library
torch.set_num_threads(1)
checks = []
def close(name, actual, expected, atol=1e-11):
    np.testing.assert_allclose(actual, expected, rtol=0, atol=atol)
    checks.append(name)

fixture = manual.fixture()
model = library.memory_module()
key = np.array([1., 1.])
for target, expected in [(1., .4446655100869954), (-1., -.35533448991300465), (0., 0.)]:
    arrays = tuple(w.copy() for w in fixture)
    state = tuple(np.zeros_like(w) for w in arrays)
    updated, momentum, loss, gradients = manual.write(arrays, state, key, [target])
    close(f'target{target}: exact read', manual.forward(updated, key)[0], [expected])
    supplied = library.fast_fixture()
    supplied_state = OrderedDict((name, torch.zeros_like(value)) for name, value in supplied.items())
    fast, velocity, native_loss, native_grad = library.functional_write(model, supplied, supplied_state, torch.from_numpy(key), torch.tensor([target], dtype=torch.float64))
    close(f'target{target}: library loss', float(native_loss.detach()), loss)
    for i, (name, value) in enumerate(fast.items()):
        close(f'target{target}: gradient{i}', native_grad[i].detach().numpy(), gradients[i])
        close(f'target{target}: state{i}', velocity[name].detach().numpy(), momentum[i])
        close(f'target{target}: parameter{i}', value.detach().numpy(), updated[i])
        close(f'target{target}: immutable input{i}', arrays[i], fixture[i])
    close(f'target{target}: library read', functional_call(model, fast, (torch.from_numpy(key),)).detach().numpy(), [expected])

# Nonzero hidden units and multiple outputs verify both the SiLU derivative and mean reduction.
arrays = (np.array([[.4, -.2], [.1, .3], [-.6, .5]]), np.array([.2, -.1, .05]),
          np.array([[.3, -.7, .8], [-.4, .2, .6]]), np.array([.1, -.2]))
key, target = np.array([.7, -.4]), np.array([.5, -.3])
loss, gradient = manual.loss_and_gradients(arrays, key, target)
for part, value in enumerate(arrays):
    for coordinate in np.ndindex(value.shape):
        plus, minus = tuple(w.copy() for w in arrays), tuple(w.copy() for w in arrays)
        plus[part][coordinate] += 1e-6; minus[part][coordinate] -= 1e-6
        difference = (manual.loss_and_gradients(plus, key, target)[0] - manual.loss_and_gradients(minus, key, target)[0]) / 2e-6
        close(f'nonzero two-output derivative:{part}:{coordinate}', gradient[part][coordinate], difference, 2e-11)
close('stable sigmoid extremes', manual.sigmoid(np.array([-1000., 0., 1000.])), [0., .5, 1.])
connected = library.learn_scalar_rate()
for name, expected in [('weight', .5), ('prediction', 1.5), ('loss', .125), ('derivative', -3.), ('next_rate', .28), ('next_loss', .0512)]:
    close(f'outer scalar:{name}', connected[name], expected)
assert library.learn_scalar_rate(connected=False)['derivative'] is None
checks.append('detached derivative is absent')
parameters = library.fast_fixture()
state = OrderedDict((name, torch.zeros_like(value)) for name, value in parameters.items())
fast, velocity, _, _ = library.functional_write(model, parameters, state, torch.tensor([1., 1.], dtype=torch.float64), torch.tensor([1.], dtype=torch.float64), differentiable=False)
assert all(value.is_leaf and value.requires_grad for value in fast.values())
assert all(not value.requires_grad for value in velocity.values())
checks.append('bounded inference weights are new gradient-enabled leaves; velocity detached')
record = root / 'docs/teaching/deep-learning-beginner/titans-multi-memory-architecture/reading-flow-program-checks.json'
record.write_text(json.dumps({'purpose': 'New instructional source arithmetic only; no old writers or fits', 'assertions': len(checks), 'checks': checks,
    'versions': {'python': sys.version, 'numpy': np.__version__, 'torch': torch.__version__},
    'sources': {str(path.relative_to(root)).replace('\\', '/'): hashlib.sha256(path.read_bytes()).hexdigest() for path in [draft/'memory_write_walkthrough.py', draft/'titans_learning_routes.py', Path(__file__)]}}, indent=2)+'\n', encoding='utf-8')
print(json.dumps({'assertions': len(checks), 'torch': torch.__version__, 'newProgramsOnly': True}))
