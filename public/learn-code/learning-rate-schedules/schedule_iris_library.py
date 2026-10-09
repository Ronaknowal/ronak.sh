"""Compare finite policies and a changing-model range probe on observed Iris.

Python3.12, NumPy2.3.5, PyTorch2.14 CPUfloat64. Supply the canonical corrected
CSV as the first argument; the default is the repository's exact reused asset.
UCI Iris/Fisher1936, DOI10.24432/C56C76, CC BY4.0. Species is audit metadata,
not a fitting input. Regress measured petal length(cm) on two sepal features.
IDs divisible by5 form the declared30-row validation split; all120 other IDs
train. This deterministic split is not a random population sampling argument.
Fit means/scales using training rows only. Optimize half training MSE; report
full validation MSE in cm². Equal60 full-gradient updates and zero initial
coefficients compare constant, linear and warmup-cosine. No schedule is tuned
on the30 held rows; this small fixed comparison establishes no general ranking.
The range probe uses one changing model and restores all local state afterward;
separate constant-rate runs begin from the same state and are a different test.
Cost: O(T*n*d) for training, n=120,d=3; retained traces O(T*d), data O(n*d).
"""
from argparse import ArgumentParser
from copy import deepcopy
import csv
from pathlib import Path
import numpy as np
import torch


def load_observations(path):
    with Path(path).open(newline='', encoding='utf8') as stream:
        rows = list(csv.DictReader(stream))
    fields = ['sepal length', 'sepal width', 'petal length', 'petal width']
    if len(rows) != 150:
        raise ValueError('this recorded fixture requires the canonical150 rows')
    measured = np.array([[float(row[field]) for field in fields] for row in rows])
    if measured.shape != (150, 4) or not np.isfinite(measured).all():
        raise ValueError('all four measured features must be finite')
    ids = np.arange(1, 151)
    train = ids % 5 != 0
    x = measured[:, :2]
    y = measured[:, 2]
    mean, scale = x[train].mean(axis=0), x[train].std(axis=0, ddof=0)
    if np.any(scale == 0):
        raise ValueError('training feature scales must be positive')
    design = np.column_stack(((x-mean)/scale, np.ones(150)))
    target_mean = y[train].mean()
    return design, y-target_mean, train, ids, mean, scale, target_mean


def cosine_rate(update, total=60, peak=.2, minimum=.01, warmup=6):
    if update < warmup:
        return peak*(update+1)/warmup
    progress = (update-warmup+1)/(total-warmup)
    return minimum+.5*(peak-minimum)*(1+np.cos(np.pi*progress))


def train_policy(x, y, policy, total=60):
    if policy not in ('constant', 'linear', 'warmup-cosine'):
        raise ValueError('unknown finite policy')
    parameter = torch.nn.Parameter(torch.zeros(3, dtype=torch.float64))
    optimizer = torch.optim.SGD([parameter], lr=.2, momentum=0.,
                                foreach=False, fused=False)
    scheduler = None
    if policy == 'warmup-cosine':
        scheduler = torch.optim.lr_scheduler.LambdaLR(
            optimizer, lr_lambda=lambda u: cosine_rate(min(u,total-1), total)/.2)
    elif policy == 'linear':
        scheduler = torch.optim.lr_scheduler.LambdaLR(
            optimizer, lr_lambda=lambda u: (.2+(.01-.2)*min(u,total-1)/(total-1))/.2)
    trace = []
    for update in range(total):
        optimizer.zero_grad(set_to_none=True)
        rate = optimizer.param_groups[0]['lr']
        before = parameter.detach().clone()
        loss = .5*((x@parameter-y)**2).mean()
        loss.backward()
        gradient = parameter.grad.detach().clone()
        optimizer.step()
        trace.append({'update':update, 'usedRate':rate, 'halfTrainMse':loss.item(),
                      'before':before.tolist(), 'gradient':gradient.tolist(),
                      'after':parameter.detach().tolist()})
        if scheduler is not None:
            scheduler.step()
    return parameter.detach().numpy().copy(), trace


def range_probe(x, y, total=40, low=1e-4, high=4.):
    """Fixed full-gradient toy; save/restore weights, optimizer and CPU RNG."""
    parameter = torch.nn.Parameter(torch.zeros(3, dtype=torch.float64))
    optimizer = torch.optim.SGD([parameter], lr=low, momentum=.9,
                                foreach=False, fused=False)
    saved = (parameter.detach().clone(), deepcopy(optimizer.state_dict()), torch.get_rng_state().clone())
    rows = []
    for update in range(total):
        rate = low*(high/low)**(update/(total-1))
        optimizer.param_groups[0]['lr'] = rate
        optimizer.zero_grad(set_to_none=True)
        loss = .5*((x@parameter-y)**2).mean()
        loss.backward()
        optimizer.step()
        after = .5*((x@parameter-y)**2).mean().item()
        rows.append((update, rate, loss.item(), after))
        if not np.isfinite(after):
            raise ValueError('the bounded probe exceeded finite arithmetic')
    with torch.no_grad():
        parameter.copy_(saved[0])
    optimizer.load_state_dict(saved[1])
    torch.set_rng_state(saved[2])
    optimizer.zero_grad(set_to_none=True)
    assert torch.equal(parameter, saved[0])
    assert optimizer.state_dict() == saved[1]
    assert torch.equal(torch.get_rng_state(), saved[2])
    return rows


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('csv', nargs='?', default='public/learn-code/eigenvalues-eigenvectors/iris-corrected.csv')
    args = parser.parse_args()
    design, target, train, ids, mean, scale, target_mean = load_observations(args.csv)
    x = torch.tensor(design[train], dtype=torch.float64)
    y = torch.tensor(target[train], dtype=torch.float64)
    print('torch', torch.__version__)
    print('training validation counts', int(train.sum()), int((~train).sum()))
    print('validation IDs', ids[~train].tolist())
    print('train feature mean scale', mean.round(6).tolist(), scale.round(6).tolist())
    print('train target mean cm', round(target_mean, 6))
    least_squares = np.linalg.lstsq(design[train], target[train], rcond=None)[0]
    print('train-only least-squares validation MSE cm2', round(np.mean((design[~train]@least_squares-target[~train])**2), 6))
    for policy in ('constant', 'linear', 'warmup-cosine'):
        coefficients, rows = train_policy(x, y, policy)
        validation_mse = np.mean((design[~train]@coefficients-target[~train])**2)
        print(policy, 'first last used rate', round(rows[0]['usedRate'], 6), round(rows[-1]['usedRate'], 6))
        print('coefficients', coefficients.round(6).tolist(), 'validation MSE cm2', round(validation_mse, 6))
    probe = range_probe(x, y)
    print('changing-model range probe selected pre/post half-MSE')
    for i in (0, 10, 20, 30, 39):
        u, rate, before, after = probe[i]
        print(u, round(rate, 6), round(before, 6), round(after, 6))
    print('range probe restores zero weights, empty optimizer state and CPU RNG', True)


if __name__ == '__main__':
    main()
