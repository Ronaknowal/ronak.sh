"""Exact small calculus fixtures with SymPy1.14; domains stay explicit."""
from sympy import Abs, Rational, diff, exp, integrate, limit, log, oo, series
from sympy import simplify, sqrt, symbols

x, h, t = symbols("x h t", real=True)
epsilon = symbols("epsilon", positive=True)
position = t**3 - 6*t**2 + 9*t
velocity = diff(position, t)
secant = simplify((position.subs(t, 2+h) - position.subs(t, 2))/h)
assert secant == h**2 - 3
local_velocity = limit(secant, h, 0)
assert local_velocity == -3
print("motion secant:", secant)
print("velocity at 2:", local_velocity)
print("velocity polynomial:", velocity)

# Two directional quotients test existence; diff(Abs(x)) at zero alone cannot.
corner_left = limit(Abs(h)/h, h, 0, dir="-")
corner_right = limit(Abs(h)/h, h, 0, dir="+")
assert (corner_left, corner_right) == (-1, 1)
print("corner left/right slopes:", corner_left, corner_right)

# Work on the positive circle branch with -5 < x < 5.
positive_branch = sqrt(25-x**2)
circle_slope = simplify(diff(positive_branch, x).subs(x, 3))
assert circle_slope == Rational(-3, 4)
print("positive circle branch slope at 3:", circle_slope)

net = integrate(velocity, (t, 0, 4))
distance = (integrate(velocity, (t, 0, 1))
            - integrate(velocity, (t, 1, 3))
            + integrate(velocity, (t, 3, 4)))
assert net == 4 and distance == 12
assert distance == integrate(Abs(velocity), (t, 0, 4))
print("net displacement / total distance:", net, distance)

# An indefinite result is one primitive; its derivative validates it.
primitive = integrate(2*x/(1+x**2), x)
assert simplify(diff(primitive, x)-2*x/(1+x**2)) == 0
transformed_integral = integrate(2*x/(1+x**2), (x, 1, 3))
assert simplify(transformed_integral-log(5)) == 0
print("one primitive:", primitive)
print("definite transformed integral:", simplify(transformed_integral))

degree = 3
exp_series = series(exp(x), x, 0, degree+1)
polynomial = exp_series.removeO()
assert polynomial == 1+x+x**2/2+x**3/6
print("degree-three expansion with order:", exp_series)

# Separate ordinary one-sided integrals; do not sum infinities.
left = limit(integrate(1/x, (x, -1, -epsilon)), epsilon, 0, dir="+")
right = limit(integrate(1/x, (x, epsilon, 1)), epsilon, 0, dir="+")
assert left == -oo and right == oo
print("ordinary singular left/right:", left, right)
print("ordinary integral: does not converge")

mass = integrate(2+x, (x, 0, 2))
moment = integrate(x*(2+x), (x, 0, 2))
balance = moment/mass
assert (mass, moment, balance) == (6, Rational(20, 3), Rational(10, 9))
print("rod mass / first moment / balance:", mass, moment, balance)
