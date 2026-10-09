"""Exact matrix geometry and the declared PyTorch2.14 Muon state rule.

The NumPy trace is float64 geometry. The matched PyTorch route uses bfloat16
NS arithmetic, EMA momentum, original rectangular scaling, and decoupled
decay. Three supplied gradients isolate optimizer state, not training quality.
The parameter is one declared hidden-layer weight matrix. Biases, embeddings
and output weights need a separately specified companion optimizer.
"""
from argparse import ArgumentParser
import json
from pathlib import Path
import numpy as np
import torch


def polynomial_trace(matrix, steps=5):
    value = np.array(matrix, dtype=float, copy=True)
    value /= max(np.linalg.norm(value), 1e-7)
    frames = [value.copy()]
    for _ in range(steps):
        gram = value@value.T
        value = 3.4445*value + (-4.775*gram+2.0315*(gram@gram))@value
        frames.append(value.copy())
    return frames


def ns_bfloat16(update, steps=5):
    value = update.to(torch.bfloat16)
    transpose = value.shape[0] > value.shape[1]
    if transpose:
        value = value.T
    value = value/value.norm().clamp(min=1e-7)
    for _ in range(steps):
        gram = value@value.T
        polynomial = torch.addmm(gram, gram, gram, beta=-4.775, alpha=2.0315)
        value = torch.addmm(value, polynomial, value, beta=3.4445)
    return value.T if transpose else value


def reference_update(parameter, buffer, gradient, nesterov=True):
    momentum, rate, decay = .9, .02, .1
    buffer = torch.lerp(buffer, gradient, 1-momentum)
    update = torch.lerp(gradient, buffer, momentum) if nesterov else buffer
    direction = ns_bfloat16(update)
    rows, columns = parameter.shape
    adjusted_rate = rate*max(1., rows/columns)**.5
    parameter = parameter*(1-rate*decay)
    parameter = torch.add(parameter, direction, alpha=-adjusted_rate)
    return parameter, buffer


def main():
    parser = ArgumentParser()
    parser.add_argument('--report')
    args = parser.parse_args()
    matrix = np.array([[2., 1.], [1., 2.]])
    u, singular, vt = np.linalg.svd(matrix, full_matrices=False)
    polar = u@vt
    sign = np.sign(matrix)
    directions = np.array([[1., 1.], [1., -1.]]).T
    frames = polynomial_trace(matrix)
    zero = polynomial_trace(np.zeros((2, 2)))[-1]
    deficient = polynomial_trace(np.diag([2., 0.]))[-1]
    assert np.allclose(polar, np.eye(2))
    assert np.array_equal(zero, np.zeros((2, 2))) and deficient[1, 1] == 0
    print('singular values:', singular)
    print('entrywise sign applied to two columns:', sign@directions)
    print('ideal polar applied to two columns:', np.round(polar@directions, 6))
    print('finite NS singular values:', np.round(np.linalg.svd(frames[-1], compute_uv=False), 6))
    print('finite NS equals ideal polar:', np.allclose(frames[-1], polar, atol=1e-6))
    print('zero singular direction remains zero:', deficient[1, 1] == 0)
    comparisons = []
    for shape in [(2, 2), (3, 2), (2, 3)]:
        for nesterov in [False, True]:
            initial = torch.arange(np.prod(shape), dtype=torch.float32).reshape(shape)/10
            actual = torch.nn.Parameter(initial.clone())
            expected, buffer = initial.clone(), torch.zeros_like(initial)
            optimizer = torch.optim.Muon([actual], lr=.02, momentum=.9,
                weight_decay=.1, nesterov=nesterov, ns_steps=5,
                ns_coefficients=(3.4445, -4.775, 2.0315), eps=1e-7,
                adjust_lr_fn='original')
            errors = []
            for step in range(3):
                gradient = torch.sin(torch.arange(np.prod(shape), dtype=torch.float32)
                                     .reshape(shape)+step+.5)
                expected, buffer = reference_update(expected, buffer, gradient, nesterov)
                actual.grad = gradient.clone()
                optimizer.step()
                error = (actual.detach()-expected).abs().max().item()
                errors.append(error)
                assert error < 1e-6
                assert torch.allclose(optimizer.state[actual]['momentum_buffer'], buffer,
                                      atol=1e-7, rtol=0)
            comparisons.append({'shape':shape,'nesterov':nesterov,'errors':errors,
                                'parameter':actual.detach().tolist(),'buffer':buffer.tolist()})
    print('matched three-step shape/momentum cases:', len(comparisons))
    print('maximum parameter error:', max(max(item['errors']) for item in comparisons))
    if args.report:
        Path(args.report).write_text(json.dumps({'matrix':matrix.tolist(),
            'frames':[v.tolist() for v in frames],
            'singularFrames':[np.linalg.svd(v,compute_uv=False).tolist() for v in frames],
            'rankDeficient':deficient.tolist(),'zero':zero.tolist(),
            'libraryComparisons':comparisons,
            'versions':{'numpy':np.__version__,'torch':torch.__version__}},indent=2)+'\n')


if __name__ == '__main__':
    main()
