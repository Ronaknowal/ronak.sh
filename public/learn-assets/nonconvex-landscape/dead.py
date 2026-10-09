import numpy as np

def train_unit(initial, rate, steps):
    point = np.array(initial, dtype=float)  # [w,b], input x=1, target y=1
    rows = []
    for step in range(steps+1):
        preactivation = point.sum()
        prediction = max(0.0, preactivation)
        # At the kink, choose derivative 0 as an implementation convention.
        active = preactivation > 0
        gradient = np.ones(2)*(prediction-1)*active
        rows.append((step, prediction, 0.5*(prediction-1)**2,
                     float(np.linalg.norm(gradient)), int(active)))
        if step < steps:
            point -= rate*gradient
    return rows

for name, initial in [("inactive", [0,-1]), ("active", [0,0.5])]:
    for step, prediction, loss, norm, active in train_unit(initial,0.1,3):
        print(f"{name} k={step}: prediction={prediction:.3f} loss={loss:.6f} grad={norm:.6f} active={active}")