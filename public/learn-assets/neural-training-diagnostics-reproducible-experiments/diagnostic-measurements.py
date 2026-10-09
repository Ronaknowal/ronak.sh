"""Inspectable float64 diagnostic measurements and copy-owned continuation.

Requires NumPy. Running this file prints constructed examples only; it never
fits a model, reads Wine results, or writes an experiment record.
"""
from copy import deepcopy
from dataclasses import dataclass
from math import fsum, sqrt
import numpy as np


def scalar_measurements(rows, weight, rate):
    """Mean half-square and raw row derivatives; O(N) time/space for the trace."""
    xy = np.asarray(rows, dtype=np.float64)
    prediction = weight * xy[:, 0]
    residual = prediction - xy[:, 1]
    losses = residual * residual / 2
    contributions = residual * xy[:, 0]
    gradient = fsum(contributions) / len(xy)
    loss = fsum(losses) / len(xy)
    next_weight = float(weight - rate * gradient)
    # Compare the represented before/after values. Do not call a tiny nonzero
    # mathematical step zero merely because it is below a display threshold.
    represented_change = next_weight - weight
    return dict(prediction=prediction, residual=residual, losses=losses,
                contributions=contributions, gradient=gradient, loss=loss,
                intended_change=-rate * gradient, next_weight=next_weight,
                represented_change=represented_change,
                represented_movement=next_weight != weight)


def parameter_measurements(before, after, gradient):
    """Copied arrays distinguish gradient, movement and parameter scale."""
    old, new = np.asarray(before), np.asarray(after)
    change = new - old
    norm = float(np.linalg.norm(old))
    movement = float(np.linalg.norm(change))
    return dict(gradient_present=gradient is not None,
                gradient_norm=None if gradient is None else float(np.linalg.norm(gradient)),
                movement_norm=movement, parameter_norm=norm,
                relative_movement=None if norm == 0 else movement / norm,
                represented_movement=bool(np.any(new != old)))


def centered_difference(objective, point, displacement):
    """Two fresh fixed-state evaluations; costs two objective calls."""
    return (objective(point + displacement) - objective(point - displacement)) / (2 * displacement)


def diagnostic_vector(point):
    """f(a,b) = (a² + 3b, ab), a concrete two-input/two-output function."""
    a, b = np.asarray(point, dtype=np.float64)
    return np.array([a * a + 3 * b, a * b])


def diagnostic_jacobian(point):
    a, b = np.asarray(point, dtype=np.float64)
    return np.array([[2 * a, 3], [b, a]])


def directional_check(function, point, jacobian, input_direction, output_seed, h):
    """Compare vᵀJu with a two-evaluation contraction, not a certificate."""
    point, u, v = map(lambda x: np.asarray(x, dtype=np.float64),
                      [point, input_direction, output_seed])
    finite = v @ (function(point + h * u) - function(point - h * u)) / (2 * h)
    analytic = v @ jacobian @ u
    return dict(analytic=float(analytic), finite=float(finite),
                absolute_error=float(abs(analytic - finite)))


def cross_entropy(logits, targets):
    """Stable class-index CE and logits gradient, O(NC) work and storage."""
    logits = np.asarray(logits, dtype=np.float64)
    targets = np.asarray(targets, dtype=np.int64)
    shifted = logits - logits.max(axis=1, keepdims=True)
    exponentials = np.exp(shifted)
    probabilities = exponentials / exponentials.sum(axis=1, keepdims=True)
    row_losses = np.log(exponentials.sum(axis=1)) - shifted[np.arange(len(targets)), targets]
    gradient = probabilities.copy()
    gradient[np.arange(len(targets)), targets] -= 1
    gradient /= len(targets)
    return dict(row_losses=row_losses, loss=float(row_losses.mean()),
                probabilities=probabilities, gradient=gradient)


def batchnorm_forward(values, saved_mean, saved_variance, training, graph_enabled,
                      gamma=1., beta=0., epsilon=1e-5, momentum=.1):
    """Population forward variance and separate sample-variance buffer branch."""
    x = np.asarray(values, dtype=np.float64)
    mean = float(x.mean())
    deviations = x - mean
    population_variance = float((deviations * deviations).mean())
    sample_variance = population_variance * len(x) / (len(x) - 1)
    used_mean = mean if training else saved_mean
    used_variance = population_variance if training else saved_variance
    denominator = sqrt(used_variance + epsilon)
    output = gamma * (x - used_mean) / denominator + beta
    next_mean = (1 - momentum) * saved_mean + momentum * mean if training else saved_mean
    next_variance = ((1 - momentum) * saved_variance + momentum * sample_variance
                     if training else saved_variance)
    return dict(mean=mean, deviations=deviations, population_variance=population_variance,
                sample_variance=sample_variance, denominator=denominator,
                output=output, next_mean=next_mean, next_variance=next_variance,
                graph_recorded=graph_enabled)


def paired_summary(pairs):
    """Every row contributes B-A; SD uses n-1 and is absent for one pair."""
    differences = [float(b - a) for a, b in pairs]
    mean = fsum(differences) / len(differences)
    deviations = [d - mean for d in differences]
    squared_sum = fsum(d * d for d in deviations)
    sd = sqrt(squared_sum / (len(differences) - 1)) if len(differences) > 1 else None
    return dict(differences=differences, mean=mean, deviations=deviations,
                squared_sum=squared_sum, sd=sd)


def shared_variance(common, private, repeats):
    """Constructed independent U + epsilon model; no estimated uncertainty."""
    return common + private / repeats


@dataclass(frozen=True)
class MomentumState:
    weight: float
    velocity: float = 0.
    completed: int = 0


def momentum_step(state, target, rate, momentum):
    gradient = state.weight - target
    next_velocity = momentum * state.velocity + gradient
    next_weight = state.weight - rate * next_velocity
    return MomentumState(next_weight, next_velocity, state.completed + 1)


def continue_momentum(saved, target, rate, momentum, count, reset_velocity=False):
    state = MomentumState(saved.weight, 0. if reset_velocity else saved.velocity, saved.completed)
    trace = []
    for _ in range(count):
        state = momentum_step(state, target, rate, momentum)
        trace.append(state)
    return trace


def snapshot_group(rows, weight, rate, consumed):
    """A contiguous prefix; accumulator holds RAW contributions, denominator N.

    Rows are copied so later edits cannot change the saved next computation.
    O(N) snapshot space; an actual framework snapshot also owns each grad tensor.
    """
    copied = np.array(rows, dtype=np.float64, copy=True)
    prefix = copied[:consumed]
    total = fsum((weight * prefix[:, 0] - prefix[:, 1]) * prefix[:, 0])
    return dict(rows=copied, weight=float(weight), rate=float(rate),
                accumulator=total, denominator=len(copied), cursor=consumed)


def resume_group(snapshot, policy='restore'):
    """restore, lost-prefix and doubled-prefix isolate the changed state."""
    state = deepcopy(snapshot)
    rows, weight = state['rows'], state['weight']
    suffix = rows[state['cursor']:]
    remaining = fsum((weight * suffix[:, 0] - suffix[:, 1]) * suffix[:, 0])
    prefix = state['accumulator']
    accumulator = {'restore': prefix + remaining,
                   'lost-prefix': remaining,
                   'doubled-prefix': 2 * prefix + remaining}[policy]
    gradient = accumulator / state['denominator']
    return dict(accumulator=accumulator, gradient=gradient,
                next_weight=weight - state['rate'] * gradient,
                consumed=state['denominator'])


def first_discrepancy(reference, other, fields):
    """Ordered retained measurements, exact equality within one replay contract."""
    for index, (a, b) in enumerate(zip(reference, other)):
        for field in fields:
            if a[field] != b[field]:
                return dict(index=index, field=field, reference=a[field], other=b[field])
    if len(reference) != len(other):
        return dict(index=min(len(reference), len(other)), field='length',
                    reference=len(reference), other=len(other))
    return None


def main():
    scalar = scalar_measurements([(1, 2), (2, 0), (3, 1)], 0., .1)
    print('scalar', scalar['loss'], scalar['gradient'], scalar['next_weight'])
    point = np.array([1., 2.])
    print('Jacobian', diagnostic_jacobian(point).tolist())
    print('direction', directional_check(diagnostic_vector, point,
          diagnostic_jacobian(point), [1., -1.], [2., -1.], 1e-4))
    print('paired', paired_summary([(.80, .81), (.83, .80), (.79, .84)]))
    saved = momentum_step(MomentumState(1.), 3., .1, .5)
    print('restart', continue_momentum(saved, 3., .1, .5, 1)[0],
          continue_momentum(saved, 3., .1, .5, 1, True)[0])
    snapshot = snapshot_group([(1, 2), (2, 0), (3, 1)], 0., .1, 2)
    print('group', {policy: resume_group(snapshot, policy) for policy in
                    ['restore', 'lost-prefix', 'doubled-prefix']})


if __name__ == '__main__':
    main()
