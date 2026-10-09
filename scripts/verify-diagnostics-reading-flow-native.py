"""New DL42 code probes only. Preserve every historical fit/writer/receipt."""
import importlib.util
import json
import math
from pathlib import Path
import hashlib
import sys
import platform
import warnings
import numpy as np
import torch

ROOT = Path(__file__).resolve().parents[1]
OWNER = ROOT / 'docs/teaching/deep-learning-beginner/neural-training-diagnostics-reproducible-experiments'
ASSET = ROOT / 'public/learn-assets/neural-training-diagnostics-reproducible-experiments'


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


m = load('diagnostic_measurements', ASSET / 'diagnostic-measurements.py')
b = load('diagnostic_library_bridge', ASSET / 'diagnostic-library-bridge.py')
checks = []


def close(name, actual, expected, tolerance=1e-12):
    actual, expected = np.asarray(actual, dtype=np.float64), np.asarray(expected, dtype=np.float64)
    error = float(np.max(np.abs(actual - expected)))
    assert np.allclose(actual, expected, atol=tolerance, rtol=tolerance), (name, actual, expected)
    checks.append(dict(name=name, error=error, tolerance=tolerance))


def true(name, condition):
    assert condition, name
    checks.append(dict(name=name, passed=True))


# Independently expand L=(sum x²*w² - 2 sum xy*w + sum y²)/(2N).
fixtures = [([(1, 2), (2, 0), (3, 1)], 0., .1), ([(2, 1), (3, 2)], .25, .2),
            ([(1, 1), (2, 2)], 1., .1), ([(1, 2)], 0., 0.),
            ([(-1.137, 2.791), (.025, -.717), (3.331, 1.019), (-4.04, .2)], -.413, .0173),
            ([(1, 2)], 0., 1e-14)]
for index, (rows, weight, rate) in enumerate(fixtures):
    xx = math.fsum(x*x for x, y in rows)
    xy = math.fsum(x*y for x, y in rows)
    yy = math.fsum(y*y for x, y in rows)
    gradient = (weight*xx - xy) / len(rows)
    loss = (weight*weight*xx - 2*weight*xy + yy) / (2*len(rows))
    actual, library = m.scalar_measurements(rows, weight, rate), b.scalar_probe(rows, weight, rate)
    close(f'scalar {index} independent loss', actual['loss'], loss)
    close(f'scalar {index} independent gradient', actual['gradient'], gradient)
    close(f'scalar {index} Torch gradient', library['gradient'], gradient)
    close(f'scalar {index} Torch step', library['after'], weight - rate*gradient)
    close(f'scalar {index} hook', library['hook_gradient'], gradient)
    true(f'scalar {index} optimizer identity/observational hook', library['optimizer_owns_parameter'] and library['hook_calls'] == 1)
    omitted = b.scalar_probe(rows, weight, rate, False)
    close(f'scalar {index} omitted', omitted['after'], weight)
true('tiny nonzero represented step is not zero by 1e-12 threshold', m.scalar_measurements([(1, 2)], 0., 1e-14)['represented_movement'])
true('zero parameter relative movement absent', b.scalar_probe([(1, 2)], 0., .1)['relative_movement'] is None)
true('gradient None differs from zero', m.parameter_measurements([1.], [1.], None)['gradient_norm'] is None and m.parameter_measurements([1.], [1.], [0.])['gradient_norm'] == 0)

for rowset in [[1., 3.], [-2.137, 6.019], [2., 2.], [-10., 10.]]:
    for mean, variance in [(0., 1.), (1., 4.), (2., 1.00000001), (8.3, 83.2)]:
        for training in [False, True]:
            for graph in [False, True]:
                scratch = m.batchnorm_forward(rowset, mean, variance, training, graph)
                library = b.mode_probe(rowset, mean, variance, training, graph)
                key = f'BN {rowset}/{mean}/{variance}/{training}/{graph}'
                for field in ['output', 'next_mean', 'next_variance']:
                    close(key + ' ' + field, library[field], scratch[field])
                true(key + ' graph', library['graph_recorded'] == graph)
                linear = b.mode_probe(rowset, mean, variance, training, graph, 'linear')
                close(key + ' linear', linear['output'], [2*x+1 for x in rowset])
                true(key + ' linear graph/no buffers', linear['graph_recorded'] == graph and linear['next_mean'] is None)
    carried = m.batchnorm_forward(rowset, 0., 1., True, False)
    again = b.mode_probe(rowset, carried['next_mean'], carried['next_variance'], True, True)
    close(f'carried {rowset}', again['next_variance'], .9*carried['next_variance']+.1*carried['sample_variance'])

point = np.array([1., 2.])
close('derived Jacobian', m.diagnostic_jacobian(point), [[2., 3.], [2., 1.]])
u, v = np.array([1., -1.]), np.array([2., -1.])
close('forward column contraction', m.diagnostic_jacobian(point) @ u, [-1., 1.])
close('reverse row contraction', v @ m.diagnostic_jacobian(point), [2., 5.])
for h in [.01, .0001, .000001]:
    result = m.directional_check(m.diagnostic_vector, point, m.diagnostic_jacobian(point), u, v, h)
    close(f'direction {h}', result['finite'], -3., 1e-8)
wrong = m.diagnostic_jacobian(point) + np.array([[1., 1.], [0., 0.]])
close('orthogonal error missed by this direction', v @ wrong @ u, -3.)
true('full grid detects direction-missed error', not np.array_equal(wrong, m.diagnostic_jacobian(point)))
with warnings.catch_warnings():
    warnings.simplefilter('ignore')
    result = b.gradient_check_probe()
true('actual gradcheck', result['gradcheck'])
close('actual autograd Jacobian', result['jacobian'], [[2., 3.], [2., 1.]])
close('scoped anomaly smooth reverse', result['gradient'], [4., 4.])
true('first nonfinite operands', b.first_nonfinite([('x', torch.tensor(1.)), ('division', torch.tensor(float('nan')))]) == 'division')
quadratic = lambda w: ((w-1)**2 + (2*w)**2)/4
for h in [.01, .0001, .000001]:
    close(f'centered scalar {h}', m.centered_difference(quadratic, .5, h), .75, 1e-9)
close('near kink mismatch explicit', m.centered_difference(lambda w: max(w, 0.), 1e-5, .001), .505)
close('tiny displacement rounding null', m.centered_difference(quadratic, .5, 1e-20), 0.)

for logits, labels in [([[0., 0., 0.], [1., -2., .7], [1000., 999., 998.]], [0, 2, 1]),
                       ([[-5., 5.]], [0])]:
    native = m.cross_entropy(logits, labels)
    tensor = torch.tensor(logits, dtype=torch.float64, requires_grad=True)
    loss = torch.nn.functional.cross_entropy(tensor, torch.tensor(labels))
    loss.backward()
    close('CE forward', native['loss'], loss.item())
    close('CE logits gradient', native['gradient'], tensor.grad.numpy())
bridge = b.autodiff_network_probe(ROOT/'public/learn-assets/backpropagation/teaching-autodiff.py')
close('reused exact AD network loss', bridge['native_loss'], bridge['library_loss'])
close('reused exact AD network logits', bridge['logits_max_error'], 0.)
close('reused exact AD all parameter gradients', bridge['gradient_max_errors'], [0.]*4)
close('reused exact AD same-state updates', bridge['update_max_errors'], [0.]*4)

paired = m.paired_summary([(.80, .81), (.83, .80), (.79, .84)])
close('paired mean', paired['mean'], .01)
close('paired sample SD', paired['sd'], .04)
true('one pair sample SD absent', m.paired_summary([(1., 2.)])['sd'] is None)
close('same-run pair null', m.paired_summary([(1., 1.), (.7, .7)])['sd'], 0.)
close('shared variance three', m.shared_variance(.4, .6, 3), .6)
close('shared variance hundred', m.shared_variance(.4, .6, 100), .406)

for target, weight, rate, momentum in [(3., 1., .1, .5), (4., 2., .25, .75),
                                      (-1.719, 2.337, .0173, .813), (3., 1., .1, 0.), (3., 1., 0., .5)]:
    state = m.momentum_step(m.MomentumState(weight), target, rate, momentum)
    full = m.continue_momentum(state, target, rate, momentum, 5)
    parameter = torch.nn.Parameter(torch.tensor(state.weight, dtype=torch.float64))
    optimizer = torch.optim.SGD([parameter], lr=rate, momentum=momentum)
    if momentum:
        optimizer.state[parameter]['momentum_buffer'] = torch.tensor(state.velocity, dtype=torch.float64)
    for index, expected in enumerate(full):
        optimizer.zero_grad(set_to_none=True)
        ((parameter-target).square()/2).backward()
        optimizer.step()
        close(f'momentum {target}/{weight}/{rate}/{momentum} step{index}', parameter.item(), expected.weight)

for rows, weight, rate in [(r, w, eta) for r, w, eta in fixtures if len(r) > 1]:
    for cursor in range(1, len(rows)):
        saved = m.snapshot_group(rows, weight, rate, cursor)
        scratch, library = m.resume_group(saved), b.unfinished_group_probe(rows, weight, rate, cursor)
        reference = m.scalar_measurements(rows, weight, rate)
        close(f'group {rows}/{cursor} derivative', scratch['gradient'], reference['gradient'])
        close(f'group {rows}/{cursor} Torch derivative', library['gradient'], reference['gradient'])
        close(f'group {rows}/{cursor} Torch update', library['after'], reference['next_weight'])
        true(f'group {rows}/{cursor} clone ownership', library['independent_storage'])
        saved['rows'][0, 0] += 1
        true(f'group {cursor} input is copied', saved['rows'][0, 0] != rows[0][0])
saved = m.snapshot_group([(1, 2), (2, 0), (3, 1)], 0., .1, 2)
for policy, expected in [('restore', -5/3), ('lost-prefix', -1.), ('doubled-prefix', -7/3)]:
    close('group '+policy, m.resume_group(saved, policy)['gradient'], expected)
close('unequal groups correct row mean', (1.+3.+8.)/3, 4.)
close('unequal groups equal mean defect', ((1.+3.)/2+8.)/2, 5.)
true('first retained discrepancy', m.first_discrepancy([dict(batch=[1], loss=2., rate=.1)], [dict(batch=[1], loss=3., rate=.1)], ['batch','loss','rate'])['field']=='loss')
true('first discrepancy null', m.first_discrepancy([dict(x=1)], [dict(x=1)], ['x']) is None)

baseline = json.loads((ROOT/'docs/teaching/deep-learning-beginner/original/diagnostics-before-reading-flow/sources.json').read_text())
for path, row in baseline['files'].items():
    true('protected baseline '+path, hashlib.sha256((ROOT/row['copy']).read_bytes()).hexdigest()==row['sha256'])
    # During this first code checkpoint all 58 current originals are unchanged.
    true('conserved current original '+path, hashlib.sha256((ROOT/path).read_bytes()).hexdigest()==row['sha256'])
sources = [ASSET/'diagnostic-measurements.py', ASSET/'diagnostic-library-bridge.py', Path(__file__),
           ROOT/'public/learn-assets/backpropagation/teaching-autodiff.py']
receipt = dict(topic='neural-training-diagnostics-reproducible-experiments',
               scope='First new-program native checkpoint, prior to manuscript/runtime authoring; no old fit/main/writer',
               result='PASS', count=len(checks), checks=checks,
               environment=dict(python=platform.python_version(), numpy=np.__version__, torch=torch.__version__),
               sources={str(p.relative_to(ROOT)).replace('\\','/'): hashlib.sha256(p.read_bytes()).hexdigest() for p in sources},
               fixtures=dict(network=bridge, jacobian=result))
target=OWNER/'reading-flow-native-code-checkpoint.json'
assert not target.exists(), 'Preserve earlier checkpoint; write a named successor after changes.'
target.write_text(json.dumps(receipt, indent=2)+'\n')
print(json.dumps(dict(result='PASS', count=len(checks), receipt=str(target),
                     sha256=hashlib.sha256(target.read_bytes()).hexdigest())))
