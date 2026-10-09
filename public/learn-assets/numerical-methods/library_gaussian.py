"""Two-node moment construction and its actual polynomial boundary."""
import math
from scipy.special import roots_legendre


def mapped_rule(f, a, b, nodes, weights):
    if not (math.isfinite(a) and math.isfinite(b) and a < b):
        raise ValueError("Use finite increasing endpoints")
    center, radius = (a+b)/2, (b-a)/2
    points = [center+radius*float(node) for node in nodes]
    return radius*math.fsum(float(w)*f(x) for w, x in zip(weights, points)), points


def main():
    nodes, weights = roots_legendre(2)
    print("nodes:", [round(float(x), 12) for x in nodes])
    print("weights:", weights.tolist())
    print(f"node difference from derived positive 1/sqrt(3): {abs(float(nodes[1])-1/math.sqrt(3)):.3e}")
    for power in range(5):
        computed, _ = mapped_rule(lambda x: x**power, -1., 1., nodes, weights)
        exact = 0. if power % 2 else 2/(power+1)
        print(f"power={power}: estimate={computed:.9f} exact={exact:.9f} signed error={computed-exact:.9f}")
    for a, b in [(2., 4.), (1., 4.)]:
        computed, points = mapped_rule(lambda x: x*x, a, b, nodes, weights)
        print(f"[{a:g},{b:g}] nodes={[round(x, 9) for x in points]} radius={(b-a)/2:g}; x^2 area={computed:.9f} exact={(b**3-a**3)/3:.9f}")


if __name__ == "__main__":
    main()
