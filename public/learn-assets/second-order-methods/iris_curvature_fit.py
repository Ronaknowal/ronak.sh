"""Observed Iris probabilities: analytic Newton and PyTorch L-BFGS.

Supply iris-corrected.csv (UCI Iris, Fisher1936, DOI10.24432/C56C76,
CC BY4.0). Keep the original file beside this programme. Use only versicolor
and virginica and their two measured sepal features. Original one-based IDs
divisible by5 are held out. Standardize from training rows only. The declared
ridge .1 penalizes all three coefficients, including the intercept. This
fixture compares objective agreement; it is not an optimizer benchmark.
"""
from argparse import ArgumentParser
import csv
import json
from pathlib import Path
import numpy as np
import torch


def load_data(path):
    with Path(path).open(newline='', encoding='utf8') as stream:
        rows = list(csv.DictReader(stream))
    kept = [(i, row) for i, row in enumerate(rows, 1)
            if row['species'] in ('Iris-versicolor', 'Iris-virginica')]
    ids = np.array([i for i, _ in kept])
    features = np.array([[float(r['sepal length']), float(r['sepal width'])]
                         for _, r in kept])
    labels = np.array([r['species'] == 'Iris-virginica' for _, r in kept], float)
    train = ids % 5 != 0
    mean, scale = features[train].mean(0), features[train].std(0)
    design = np.column_stack(((features-mean)/scale, np.ones(len(ids))))
    return design, labels, train, ids, features, mean, scale


def value_gradient_hessian(theta, x, y, ridge=.1):
    logits = x @ theta
    probability = np.exp(-np.logaddexp(0., -logits))
    value = np.mean(np.logaddexp(0., logits)-y*logits) + ridge*(theta@theta)/2
    gradient = x.T@(probability-y)/len(y) + ridge*theta
    fisher = x.T@((probability*(1-probability))[:, None]*x)/len(y)
    return value, gradient, fisher + ridge*np.eye(x.shape[1])


def newton_fit(x, y):
    theta = np.zeros(x.shape[1])
    trace = []
    evaluations = 0
    for iteration in range(40):
        value, gradient, hessian = value_gradient_hessian(theta, x, y)
        evaluations += 1
        trace.append({'iteration':iteration, 'theta':theta.tolist(),
                      'objective':float(value), 'gradientInf':float(abs(gradient).max())})
        if abs(gradient).max() <= 1e-10:
            return theta, trace, evaluations
        direction = np.linalg.solve(hessian, -gradient)
        for reductions in range(30):
            alpha = .5**reductions
            candidate = theta+alpha*direction
            next_value = value_gradient_hessian(candidate, x, y)[0]
            evaluations += 1
            if next_value <= value+1e-4*alpha*(gradient@direction):
                theta = candidate
                trace[-1]['acceptedAlpha'] = alpha
                break
        else:
            raise RuntimeError('No step passed the declared line-search budget')
    raise RuntimeError('Newton iteration budget exhausted')


def library_fit(x, y):
    inputs, labels = torch.tensor(x), torch.tensor(y)
    theta = torch.nn.Parameter(torch.zeros(x.shape[1], dtype=torch.float64))
    optimizer = torch.optim.LBFGS([theta], lr=1., history_size=10,
        max_iter=80, line_search_fn='strong_wolfe', tolerance_grad=1e-10,
        tolerance_change=1e-14)
    calls = 0

    def closure():
        nonlocal calls
        optimizer.zero_grad(set_to_none=True)
        logits = inputs@theta
        loss = (torch.logaddexp(torch.zeros_like(logits), logits)-labels*logits).mean()
        loss = loss + .05*theta.square().sum()
        loss.backward()
        calls += 1
        return loss

    initial = optimizer.step(closure).item()
    return theta.detach().numpy().copy(), calls, initial


def main():
    parser = ArgumentParser()
    parser.add_argument('data', nargs='?', default='iris-corrected.csv')
    parser.add_argument('--report')
    args = parser.parse_args()
    x, y, train, ids, features, mean, scale = load_data(args.data)
    scratch, trace, count = newton_fit(x[train], y[train])
    library, calls, initial = library_fit(x[train], y[train])
    assert len(y) == 100 and train.sum() == 80
    assert np.allclose(scratch, library, atol=2e-7, rtol=0)
    held_logits = x[~train]@scratch
    held_nll = np.mean(np.logaddexp(0., held_logits)-y[~train]*held_logits)
    correct = int(np.sum((held_logits >= 0) == y[~train]))
    final, gradient, hessian = value_gradient_hessian(scratch, x[train], y[train])
    print('training / held observations:', int(train.sum()), int((~train).sum()))
    print('training means:', np.round(mean, 6))
    print('training scales:', np.round(scale, 6))
    print('Newton coefficients:', np.round(scratch, 6))
    print('L-BFGS coefficients:', np.round(library, 6))
    print('initial / final regularized objective:', round(initial, 9), round(final, 9))
    print('Newton accepted updates / evaluations:', len(trace)-1, count)
    print('L-BFGS closure evaluations:', calls)
    print('final analytic gradient below 1e-9:', abs(gradient).max() < 1e-9)
    print('held negative log likelihood / correct:', round(held_nll, 9), correct)
    print('final Hessian eigenvalues:', np.round(np.linalg.eigvalsh(hessian), 6))
    if args.report:
        Path(args.report).write_text(json.dumps({'trace':trace,'newton':scratch.tolist(),
            'library':library.tolist(),'newtonEvaluations':count,'libraryClosures':calls,
            'mean':mean.tolist(),'scale':scale.tolist(),'ids':ids.tolist(),
            'train':train.tolist(),'features':features.tolist(),'labels':y.tolist(),
            'heldNll':float(held_nll),'heldCorrect':correct,
            'versions':{'numpy':np.__version__,'torch':torch.__version__}},indent=2)+'\n')


if __name__ == '__main__':
    main()
