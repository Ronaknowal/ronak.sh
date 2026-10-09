import math

rho = 0.8
variance = 1 - rho * rho
target = [[1.0, rho], [rho, 1.0]]
mean_field = [[variance, 0.0], [0.0, variance]]

def linear_variance(weights, covariance):
    return sum(weights[i] * covariance[i][j] * weights[j]
               for i in range(2) for j in range(2))

print("marginal variances", target[0][0], round(variance, 3))
for label, weights in [("sum", [1, 1]), ("difference", [1, -1])]:
    print(label, round(linear_variance(weights, target), 3),
          round(linear_variance(weights, mean_field), 3))
print("best mean-field KL", round(-0.5 * math.log(variance), 6))
print("radius-one mass in 2D", round(1 - math.exp(-0.5), 6))
