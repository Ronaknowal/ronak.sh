from itertools import product
import numpy as np

def noisy_saddle(initial, rate, amplitude, direction, signs):
    point = np.array(initial, dtype=float)
    direction = np.asarray(direction, dtype=float)
    history = [point.copy()]
    for sign in signs:
        gradient = np.array([2*point[0], -2*point[1]])
        point = point - rate*(gradient + sign*amplitude*direction)
        history.append(point.copy())
    return np.array(history)

rate, amplitude, steps = 0.1, 0.2, 8
for name, direction in [("x only", [1,0]), ("y only", [0,1])]:
    endpoints = np.array([
        noisy_saddle([0.6,0], rate, amplitude, direction, signs)[-1]
        for signs in product([-1,1], repeat=steps)
    ])
    second_moment = np.mean(endpoints[:,1]**2)
    predicted = (rate*amplitude*direction[1])**2 * sum(
        (1+2*rate)**(2*j) for j in range(steps))
    assert np.isclose(second_moment, predicted)
    print(f"{name}: mean y={abs(endpoints[:,1].mean()):.6f}, E[y²]={second_moment:.6f}")
print("Every one of the 256 sign sequences is weighted equally.")