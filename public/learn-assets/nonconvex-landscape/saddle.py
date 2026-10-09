import numpy as np

def gradient_descent(initial, rate, steps):
    point = np.array(initial, dtype=float)
    history = [point.copy()]
    for _ in range(steps):
        gradient = np.array([2*point[0], -2*point[1]])
        point = point - rate*gradient
        history.append(point.copy())
    return np.array(history)

rate, steps = 0.1, 20
for y0 in [0.0, 0.001]:
    end = gradient_descent([0.6, y0], rate, steps)[-1]
    closed_form = np.array([0.6*(1-2*rate)**steps, y0*(1+2*rate)**steps])
    assert np.allclose(end, closed_form)
    print(f"y0={y0:.3f}: x20={end[0]:.6f}, y20={end[1]:.6f}")