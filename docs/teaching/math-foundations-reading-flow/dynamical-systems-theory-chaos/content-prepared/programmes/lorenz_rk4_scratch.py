import math


def lorenz(time, state):
    q, p, z = state
    return (10 * (p - q), q * (28 - z) - p, q * p - (8 / 3) * z)


def rk4_step(field, time, state, step):
    def trial(slope, fraction):
        return tuple(y + fraction * step * k for y, k in zip(state, slope))

    k1 = field(time, state)
    k2 = field(time + step / 2, trial(k1, 1 / 2))
    k3 = field(time + step / 2, trial(k2, 1 / 2))
    k4 = field(time + step, trial(k3, 1))
    return tuple(y + step * (a + 2 * b + 2 * c + d) / 6
                 for y, a, b, c, d in zip(state, k1, k2, k3, k4))


def fixed_grid(field, initial, horizon, step):
    if not (math.isfinite(horizon) and math.isfinite(step)
            and horizon > 0 and step > 0):
        raise ValueError('Use a positive finite horizon and step.')
    count = round(horizon / step)
    if not 1 <= count <= 10000 or not math.isclose(count * step, horizon):
        raise ValueError('The step must divide the horizon into 1 to 10000 steps.')
    state = tuple(float(value) for value in initial)
    if not state or not all(math.isfinite(value) for value in state):
        raise ValueError('Use a nonempty finite state.')
    rows = [(0.0, state)]
    for index in range(count):
        state = rk4_step(field, index * step, state, step)
        if not all(math.isfinite(value) for value in state):
            raise ArithmeticError('A computed state is not finite.')
        rows.append(((index + 1) * step, state))
    return rows


if __name__ == '__main__':
    # These six-decimal reference states are retained DOP853 outputs.
    reference = {0.5: (1.198273, -8.867198, 32.454740),
                 1.0: (-9.378570, -8.357034, 29.362325)}
    for step in (0.005, 0.0025):
        rows = fixed_grid(lorenz, (1, 1, 1), 1, step)
        for time, target in reference.items():
            state = rows[round(time / step)][1]
            difference = max(abs(a - b) for a, b in zip(state, target))
            print(f'h={step:.4f}, t={time:.1f}:',
                  [round(value, 9) for value in state],
                  f'max difference to rounded reference={difference:.9g}')
        print('steps', len(rows) - 1, 'finite states',
              all(math.isfinite(value) for _, state in rows for value in state))
