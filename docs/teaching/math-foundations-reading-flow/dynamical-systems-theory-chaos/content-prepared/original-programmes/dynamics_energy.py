import math


def integrate_oscillator(step, count, initial=(1.0, 0.0)):
    if (
        not math.isfinite(step)
        or not 0 < step <= 0.5
        or type(count) is not int
        or not 0 <= count <= 2000
    ):
        raise ValueError("Use step in (0,.5] and at most 2000 integer steps.")
    if len(initial) != 2 or not all(
        math.isfinite(value) and abs(value) <= 2 for value in initial
    ):
        raise ValueError("Use two finite initial components of magnitude at most two.")
    position, momentum = initial
    forward_position, forward_momentum = initial
    for _ in range(count):
        forward_position, forward_momentum = (
            forward_position + step * forward_momentum,
            forward_momentum - step * forward_position,
        )
        momentum -= step * position
        position += step * momentum
    forward_energy = (forward_position**2 + forward_momentum**2) / 2
    symplectic_energy = (position**2 + momentum**2) / 2
    modified_energy = (position**2 + momentum**2 - step * position * momentum) / 2
    return forward_energy, symplectic_energy, modified_energy


for step in (0.5, 0.25, 0.2, 0.1):
    count = round(20 / step)
    forward, symplectic, modified = integrate_oscillator(step, count)
    print(
        f"h={step:.2f}, t=20: Euler E={forward:.6f}, symplectic E={symplectic:.6f}, modified E={modified:.6f}"
    )
print("Exact oscillator E=0.5 for all times. Modified energy is a different function.")
