"""Ordinary functional PyTorch routes for fast writes and slow rate learning."""
from collections import OrderedDict
import numpy as np
import torch
from torch import nn
from torch.func import functional_call
from memory_write_walkthrough import fixture, forward, write


def memory_module():
    return nn.Sequential(nn.Linear(2, 3), nn.SiLU(), nn.Linear(3, 1)).double()


def fast_fixture():
    names = ['0.weight', '0.bias', '2.weight', '2.bias']
    return OrderedDict((name, torch.tensor(value, dtype=torch.float64, requires_grad=True))
                       for name, value in zip(names, fixture()))


def functional_write(model, parameters, momentum, key, target,
                     rate=.1, retention=0., decay=0., differentiable=True):
    prediction = functional_call(model, parameters, (key,))
    loss = .5 * (prediction-target).square().mean()
    gradients = torch.autograd.grad(loss, tuple(parameters.values()),
                                    create_graph=differentiable)
    next_state = OrderedDict((name, retention*momentum[name]-rate*gradient)
                             for name, gradient in zip(parameters, gradients))
    updated = OrderedDict((name, (1-decay)*value+next_state[name])
                          for name, value in parameters.items())
    if not all(torch.isfinite(value).all() for value in (*updated.values(), *next_state.values())):
        raise FloatingPointError('The write produced nonfinite fast state.')
    if not differentiable:
        updated = OrderedDict((name, value.detach().requires_grad_()) for name, value in updated.items())
        next_state = OrderedDict((name, value.detach()) for name, value in next_state.items())
    return updated, next_state, loss, gradients


def learn_scalar_rate(rate=.25, outer_rate=.01, connected=True):
    theta = torch.tensor(rate, dtype=torch.float64, requires_grad=True)
    weight = torch.zeros((), dtype=torch.float64, requires_grad=True)
    inner = .5 * (2*weight-1).square()
    gradient, = torch.autograd.grad(inner, weight, create_graph=True)
    updated = weight-theta*gradient
    if not connected:
        updated = updated.detach().requires_grad_()
    prediction = 3*updated
    outer = .5 * (prediction-2).square()
    derivative, = torch.autograd.grad(outer, theta, allow_unused=True)
    next_rate = None if derivative is None else theta-outer_rate*derivative
    return {'weight': float(updated.detach()), 'prediction': float(prediction.detach()),
            'loss': float(outer.detach()),
            'derivative': None if derivative is None else float(derivative),
            'next_rate': None if next_rate is None else float(next_rate.detach()),
            'next_loss': None if next_rate is None else float(.5*(6*next_rate.detach()-2).square())}


if __name__ == '__main__':
    model = memory_module()
    parameters = fast_fixture()
    momentum = OrderedDict((name, torch.zeros_like(value)) for name, value in parameters.items())
    key = torch.tensor([1., 1.], dtype=torch.float64)
    target = torch.tensor([1.], dtype=torch.float64)
    updated, state, loss, gradients = functional_write(model, parameters, momentum, key, target)
    manual, _, _, manual_gradients = write(fixture(), tuple(np.zeros_like(w) for w in fixture()),
                                         key.numpy(), target.numpy())
    print('manual/functional read:', forward(manual, key.numpy())[0],
          functional_call(model, updated, (key,)).detach().numpy())
    print('gradient maximum difference:', max(np.max(np.abs(a-b.detach().numpy()))
                                              for a, b in zip(manual_gradients, gradients)))
    print('connected rate:', learn_scalar_rate())
    print('detached rate:', learn_scalar_rate(connected=False))
