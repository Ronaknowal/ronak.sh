"""Matrix-square, normalized-output and curvature operators via PyTorch2.14.

These match the three complete manual NumPy derivations in Matrix Calculus.
CPU float64. Functions are smooth on the demonstrated finite real inputs;
JVP applies one direction without storing a dense matrix-valued Jacobian.
"""
import torch
from torch.func import grad, jacrev, jvp, vjp


def matrix_square(a):
    return a @ a


def normalized_scores(s):
    return torch.softmax(s, dim=0)


def quadratic_loss(x):
    return x[0]**2 + x[0]*x[1] + 2*x[1]**2


if __name__ == '__main__':
    torch.set_num_threads(1)
    a = torch.tensor([[1., 2.], [0., 1.]], dtype=torch.float64)
    e = torch.tensor([[0., 0.], [1., 0.]], dtype=a.dtype)
    _, square_rate = jvp(matrix_square, (a,), (e,))
    torch.testing.assert_close(square_rate, a@e+e@a)
    scores = torch.tensor([0., 2., 3.], dtype=a.dtype)
    scores[1:] = torch.log(scores[1:])
    direction = torch.tensor([1., 0., -1.], dtype=a.dtype)
    p, rate = jvp(normalized_scores, (scores,), (direction,))
    manual = torch.diag(p)-torch.outer(p,p)
    torch.testing.assert_close(rate, p*(direction-p@direction))
    torch.testing.assert_close(jacrev(normalized_scores)(scores), manual)
    torch.testing.assert_close(normalized_scores(scores+100), p)
    torch.testing.assert_close(jvp(normalized_scores,(scores,),(torch.ones_like(scores),))[1],torch.zeros_like(p))
    _, pullback = vjp(normalized_scores, scores)
    torch.testing.assert_close(pullback(direction)[0], manual.T@direction)
    x = torch.tensor([1., -1.], dtype=a.dtype)
    v = torch.tensor([2., 1.], dtype=a.dtype)
    gradient, hv = jvp(grad(quadratic_loss), (x,), (v,))
    torch.testing.assert_close(gradient, torch.tensor([1., -3.],dtype=a.dtype))
    torch.testing.assert_close(hv, torch.tensor([5., 6.],dtype=a.dtype))
    print('matrix-square JVP', square_rate.tolist())
    print('softmax p', [round(float(value),6) for value in p])
    print('softmax JVP', [round(float(value),6) for value in rate])
    print('gradient', gradient.tolist(), 'Hessian-vector', hv.tolist())
    print('manual/library operator agreement', True)
