import math

def exact_error(transitions, rho, thin=1):
    if not -1 < rho < 1 or not 1 <= thin <= transitions:
        raise ValueError("Need abs(rho)<1 and a valid thinning interval")
    n = transitions // thin
    retained_rho = rho**thin
    inflation = 1 + 2*sum((1-lag/n)*retained_rho**lag for lag in range(1, n))
    variance = .25*inflation/n
    return n, math.sqrt(variance), .25/variance

for rho in [.8, 0, -.8]:
    for thin in [1, 2, 5]:
        n, error, equivalent = exact_error(100, rho, thin)
        print(f"rho={rho:+.1f} thin={thin} retained={n} MCSE={error:.4f} equivalent_iid={equivalent:.1f}")