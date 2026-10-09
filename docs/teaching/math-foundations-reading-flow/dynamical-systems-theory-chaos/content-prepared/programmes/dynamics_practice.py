from fractions import Fraction
import math


def cooling_multiplier(decay, step):
    if not all(math.isfinite(x) and x >= 0 for x in (decay, step)):
        raise ValueError('Use finite nonnegative decay and step.')
    multiplier = 1 - decay * step
    if abs(multiplier) == 1:
        behavior = 'boundary: nondecaying'
    elif abs(multiplier) > 1:
        behavior = 'growth'
    elif multiplier == 0:
        behavior = 'zero after one update'
    elif multiplier < 0:
        behavior = 'alternating decay'
    else:
        behavior = 'same-sign decay'
    return multiplier, behavior, abs(multiplier - math.exp(-decay * step))


def positive_cubic(initial, time):
    if not all(math.isfinite(x) for x in (initial, time)) or time < 0:
        raise ValueError('Use a finite initial state and nonnegative finite time.')
    denominator = 1 - 2 * initial * initial * time
    if denominator <= 0:
        raise ValueError('The requested time reaches or exceeds the pole.')
    return initial / math.sqrt(denominator)


def transient_state(initial, time):
    q, p = initial
    decay = math.exp(-time)
    return q * decay + 6 * p * decay * (1 - decay), p * decay * decay


def upward_positive_section(samples):
    crossings = []
    for (t0, (q0, p0)), (t1, (q1, p1)) in zip(samples, samples[1:]):
        if t1 <= t0:
            raise ValueError('Sample times must increase.')
        if p0 < 0 <= p1:
            fraction = -p0 / (p1 - p0)
            q = q0 + fraction * (q1 - q0)
            if q > 0:
                crossings.append((t0 + fraction * (t1 - t0), q))
    return crossings


def cycle_residual(growth, points):
    if not points:
        raise ValueError('Supply a candidate cycle.')
    return max(abs(growth * x * (1 - x) - y)
               for x, y in zip(points, points[1:] + points[:1]))


def log_derivative_average(growth, initial, count):
    if not (0 <= growth <= 4 and 0 <= initial <= 1
            and type(count) is int and 1 <= count <= 10000):
        raise ValueError('Use a bounded logistic rule and positive bounded count.')
    value, total = initial, 0.0
    reference_fixed = growth * initial * (1 - initial) == initial
    for index in range(count):
        derivative = growth * (1 - 2 * value)
        if derivative == 0:
            return -math.inf, index, reference_fixed
        total += math.log(abs(derivative))
        value = growth * value * (1 - value)
    return total / count, None, reference_fixed


def cylinder(word):
    if not 1 <= len(word) <= 10 or any(letter not in 'LR' for letter in word):
        raise ValueError('Use one to ten L/R letters.')
    slope, intercept = Fraction(1), Fraction(0)
    # Build the outer inverse last: LR means L(R(u)).
    for letter in reversed(word):
        if letter == 'L':
            slope, intercept = slope / 2, intercept / 2
        else:
            slope, intercept = -slope / 2, 1 - intercept / 2
    return tuple(sorted((intercept, intercept + slope))), intercept / (1 - slope)


def kick_drift(state, step):
    q, p = state
    next_p = p - step * q
    return q + step * next_p, next_p


def energies(state, step):
    q, p = state
    return (q * q + p * p) / 2, (q * q + p * p - step * q * p) / 2


def multiply(left, right):
    return tuple(tuple(sum(left[i][k] * right[k][j] for k in range(2))
                       for j in range(2)) for i in range(2))


def apply(matrix, vector):
    return tuple(sum(row[j] * vector[j] for j in range(2)) for row in matrix)


if __name__ == '__main__':
    for step in (0.2, 0.5, 0.8, 2 / 3):
        multiplier, behavior, error = cooling_multiplier(3, step)
        print('cooling', round(step, 6), round(multiplier, 6), behavior,
              'one-step multiplier error', round(error, 6))
    print('positive cubic at t=1', round(positive_cubic(0.5, 1), 6))
    try:
        positive_cubic(0.5, 2)
    except ValueError as error:
        print(error)
    print('transient starts', transient_state((1, 0), math.log(2)),
          transient_state((0, 1), math.log(2)))
    fixture = [(0, (1, 0)), (0.5, (0.8, 0.3)), (1, (-1, 0.2)),
               (1.5, (-1, -0.2)), (2, (0.8, -0.3)), (2.5, (1, 0)),
               (3, (0.8, 0.3)), (3.5, (0.8, -0.3)), (4, (0.8, 0.3)),
               (5, (-1, -0.1)), (6, (-1, 0.1))]
    print('section crossings', upward_positive_section(fixture))
    root = math.sqrt((3.2 - 3) * (3.2 + 1))
    exact_pair = [(4.2 - root) / 6.4, (4.2 + root) / 6.4]
    rounded_pair = [0.513045, 0.799455]
    print('cycle residuals', f'{cycle_residual(3.2, exact_pair):.3g}',
          f'{cycle_residual(3.2, rounded_pair):.9g}')
    print('fixed reference diagnostic', log_derivative_average(4, 0.75, 20))
    print('critical reference diagnostic', log_derivative_average(4, 0.5, 20))
    for word in ('LR', 'RL'):
        interval, point = cylinder(word)
        print(word, [str(value) for value in interval], str(point))
    state = kick_drift((1, 0), 0.25)
    print('kick-drift h=.25', state, 'energies', energies(state, 0.25))
    first, second = ((0, 3), (0, 0)), ((0, 0), (0.5, 0))
    product = multiply(second, first)
    print('BA', product, 'AB', multiply(first, second))
    state = (0, 1)
    for index in range(4):
        print('changed product cycle', index, state)
        state = apply(product, state)
