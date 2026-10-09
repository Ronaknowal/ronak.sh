"""One fixed-noise scalar VIB objective: hand gradients and CPU float64 autograd."""
import math
import torch
from torch.nn.functional import binary_cross_entropy_with_logits

# (signal input, nuisance input, observed label, fixed comparison noise).
ROWS = [(0., 0., 0., -1.), (0., 1., 0., .5),
        (1., 0., 1., .5), (1., 1., 0., -1.)]
NAMES = ('a', 'b', 'c', 'log_sd', 'u', 'v')


def sigmoid(x):
    if x >= 0:
        return 1 / (1 + math.exp(-x))
    e = math.exp(x)
    return e / (1 + e)


def hand(parameters, rows=ROWS, weight=.2):
    a, b, c, log_sd, u, v = parameters
    sd = math.exp(log_sd)
    gradient = [0.] * 6
    ce_sum, kl_sum, trace = 0., 0., []
    for signal, nuisance, y, epsilon in rows:
        mu = a*signal + b*nuisance + c
        z = mu + sd*epsilon
        logit = u*z + v
        ce = max(logit, 0) - y*logit + math.log1p(math.exp(-abs(logit)))
        kl = .5*(mu*mu + sd*sd - 1 - 2*log_sd)
        d_logit = sigmoid(logit) - y
        d_mu = u*d_logit + weight*mu
        components = (d_mu*signal, d_mu*nuisance, d_mu,
                      u*d_logit*sd*epsilon + weight*(sd*sd-1),
                      d_logit*z, d_logit)
        gradient = [g+d/len(rows) for g, d in zip(gradient, components)]
        ce_sum += ce
        kl_sum += kl
        trace.append((mu, z, logit, ce, kl))
    ce, kl = ce_sum/len(rows), kl_sum/len(rows)
    return ce+weight*kl, gradient, ce, kl, trace


def autograd(parameters, rows=ROWS, weight=.2):
    p = torch.tensor(parameters, dtype=torch.float64, device='cpu', requires_grad=True)
    data = torch.tensor(rows, dtype=torch.float64, device='cpu')
    a, b, c, log_sd, u, v = p.unbind()
    signal, nuisance, y, epsilon = data.unbind(dim=1)
    mu = a*signal + b*nuisance + c
    sd = log_sd.exp()
    z = mu + sd*epsilon
    ce = binary_cross_entropy_with_logits(u*z+v, y, reduction='mean')
    kl = .5*(mu.square()+sd.square()-1-2*log_sd).mean()
    loss = ce + weight*kl
    gradient, = torch.autograd.grad(loss, p)
    return float(loss.detach()), gradient.detach().tolist()


def main():
    parameters = [.8, .3, -.4, math.log(.7), 1.1, -.2]
    loss, gradient, ce, kl, trace = hand(parameters)
    torch_loss, torch_gradient = autograd(parameters)
    assert abs(loss-torch_loss) < 1e-12
    assert max(abs(a-b) for a,b in zip(gradient, torch_gradient)) < 1e-12
    for i, row in enumerate(trace):
        print('row', i, 'mu z logit CE KL', *[f'{x:.9f}' for x in row])
    print('mean CE / KL / objective nats', *[f'{x:.9f}' for x in [ce, kl, loss]])
    print('parameters', *NAMES)
    print('hand gradients', *[f'{x:.9f}' for x in gradient])
    print('Torch gradients', *[f'{x:.9f}' for x in torch_gradient])
    updated = [p-.01*g for p,g in zip(parameters, gradient)]
    after = hand(updated)[0]
    assert abs(after-autograd(updated)[0]) < 1e-12
    print('updated parameters', *[f'{x:.9f}' for x in updated])
    print('updated fixed-noise objective nats', f'{after:.9f}')


if __name__ == '__main__':
    main()
