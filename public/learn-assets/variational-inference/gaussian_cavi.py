import math

rho = 0.8
target_mean = [1.0, -1.0]
mean = [-2.0, 2.0]
variance = 1 - rho * rho
family_gap = -0.5 * math.log(variance)

def kl(values):
    dx, dy = [values[i] - target_mean[i] for i in range(2)]
    return family_gap + (dx*dx - 2*rho*dx*dy + dy*dy) / (2*variance)

previous = kl(mean)
for update in range(1, 25):
    coordinate = (update - 1) % 2
    other = 1 - coordinate
    mean[coordinate] = (target_mean[coordinate]
                        + rho * (mean[other] - target_mean[other]))
    current = kl(mean)
    assert current <= previous + 1e-12
    previous = current
    if update in [1, 2, 4, 24]:
        print(update, [round(value, 6) for value in mean],
              round(current, 6))
print("limit KL", round(family_gap, 6))
