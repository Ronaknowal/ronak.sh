import math

for sigma in [.25, .5, 1., 2.]:
    variance_z = 1 + sigma * sigma
    covariance = 1.
    determinant = variance_z - covariance * covariance
    nats = .5 * (math.log(variance_z) - math.log(determinant))
    bits = nats / math.log(2)
    # Z'=10Z scales its variance by100 and its covariance with X by10.
    scaled_determinant = 100 * variance_z - (10 * covariance) ** 2
    scaled = .5 * (math.log(100 * variance_z) - math.log(scaled_determinant))
    assert abs(scaled - nats) < 1e-12
    print(sigma, 'MI bits:', f'{bits:.6f}', 'rescaling unchanged:', True)
# The infinite case is a measure-theoretic conclusion, not a finite estimate.
