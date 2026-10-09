"""Manual nonlinear associative-memory derivatives; NumPy primitives only."""
import numpy as np


def sigmoid(x):
    x = np.asarray(x, dtype=np.float64)
    result = np.empty_like(x)
    positive = x >= 0
    result[positive] = 1 / (1 + np.exp(-x[positive]))
    exponential = np.exp(x[~positive])
    result[~positive] = exponential / (1 + exponential)
    return result


def fixture():
    return (np.array([[1., -1.], [0., 0.], [0., 0.]]),
            np.zeros(3), np.array([[2., 0., 0.]]), np.zeros(1))


def forward(parameters, key):
    W1, b1, W2, b2 = parameters
    z = W1 @ key + b1
    sig = sigmoid(z)
    hidden = z * sig
    output = W2 @ hidden + b2
    if not np.isfinite(output).all():
        raise FloatingPointError('The first nonfinite forward result cannot be used for a write.')
    return output, (z, sig, hidden)


def loss_and_gradients(parameters, key, target):
    """One key, possibly several outputs; mean of half-squared residuals."""
    W1, b1, W2, b2 = parameters
    output, (z, sig, hidden) = forward(parameters, key)
    residual = output - np.asarray(target)
    output_credit = residual / residual.size
    hidden_credit = W2.T @ output_credit
    pre_credit = hidden_credit * sig * (1 + z * (1 - sig))
    gradients = (np.outer(pre_credit, key), pre_credit,
                 np.outer(output_credit, hidden), output_credit)
    return float(.5 * np.mean(residual**2)), gradients


def write(parameters, momentum, key, target, rate=.1, retention=0., decay=0.):
    loss, gradients = loss_and_gradients(parameters, key, target)
    next_momentum = tuple(retention*s-rate*g for s, g in zip(momentum, gradients))
    next_parameters = tuple((1-decay)*w+s for w, s in zip(parameters, next_momentum))
    if not all(np.isfinite(value).all() for value in (*next_parameters, *next_momentum)):
        raise FloatingPointError('The write produced nonfinite parameter or momentum state.')
    return next_parameters, next_momentum, loss, gradients


def linear_write(weight, momentum, key, target, rate=.5, retention=0., decay=0.):
    residual = weight @ key - target
    gradient = np.outer(np.atleast_1d(residual), key)
    next_momentum = retention*momentum-rate*gradient
    return (1-decay)*weight+next_momentum, next_momentum, gradient


if __name__ == '__main__':
    np.set_printoptions(precision=8, suppress=True)
    parameters = fixture()
    momentum = tuple(np.zeros_like(w) for w in parameters)
    key, target = np.array([1., 1.]), np.array([1.])
    updated, state, loss, gradients = write(parameters, momentum, key, target)
    print('prewrite loss:', loss)
    for name, gradient in zip(['W1', 'b1', 'W2', 'b2'], gradients):
        print(name, 'gradient:', gradient)
    print('read after write:', forward(updated, key)[0])
    query = np.array([1., -1.])
    print('other query before/after:', forward(parameters, query)[0], forward(updated, query)[0])
    changed, _, _, _ = write(parameters, momentum, key, np.array([-1.]))
    print('negative target read:', forward(changed, key)[0])
