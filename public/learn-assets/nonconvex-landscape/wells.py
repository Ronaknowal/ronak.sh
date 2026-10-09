import numpy as np

def well(x, tilt):
    return (x*x - 1)**2 / 4 + tilt*x

def stationary_points(tilt):
    roots = np.roots([1.0, 0.0, -1.0, tilt])
    return sorted(float(root.real) for root in roots if abs(root.imag) < 1e-10)

tilt = 0.15
for x in stationary_points(tilt):
    curvature = 3*x*x - 1
    kind = "minimum" if curvature > 0 else "maximum"
    print(f"x={x:.6f} cost={well(x, tilt):.6f} H={curvature:.6f} {kind}")
for initial in [-0.8, 0.8]:
    x = initial
    for _ in range(60):
        x -= 0.12 * (x**3 - x + tilt)
    print(f"start={initial:+.1f} end={x:.6f} cost={well(x, tilt):.6f}")