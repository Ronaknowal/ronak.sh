import math
from scipy.integrate import quad


def signal(t):
    return 2*math.cos(2*math.pi*t) + math.cos(6*math.pi*t + math.pi/2)


for harmonic in [0, 1, 2, 3, -3]:
    real = quad(lambda t: signal(t)*math.cos(2*math.pi*harmonic*t), 0, 1)[0]
    imag = quad(lambda t: -signal(t)*math.sin(2*math.pi*harmonic*t), 0, 1)[0]
    print(f'k={harmonic:2}: {real:.6f} {imag:+.6f}j')

for harmonic in [1, 2, 3]:
    # Split at the known jump instead of assuming the integrand is smooth there.
    coefficient = 2*quad(lambda t: math.sin(2*math.pi*harmonic*t), 0, .5)[0]
    coefficient -= 2*quad(lambda t: math.sin(2*math.pi*harmonic*t), .5, 1)[0]
    print(f'square sine k={harmonic}: {coefficient:.6f}')

for epsilon in [1, .25, .0625]:
    mass = quad(lambda t: math.exp(-math.pi*t*t/epsilon)/math.sqrt(epsilon),
                -math.inf, math.inf)[0]
    nearby = quad(lambda t: math.exp(-math.pi*t*t/epsilon)/math.sqrt(epsilon), -.5, .5)[0]
    print(f'Gaussian epsilon={epsilon}: mass={mass:.9f}, mass within .5={nearby:.9f}')
