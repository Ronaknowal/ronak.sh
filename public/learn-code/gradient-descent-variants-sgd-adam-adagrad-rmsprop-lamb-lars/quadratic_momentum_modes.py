"""Explain heavy-ball versus explicit-lookahead stability on one quadratic mode.

Run: python quadratic_momentum_modes.py (standard library only).
For F(x)=curvature*x*x/2, curvature in [0.001,100], fixed rate in
[0.00001,10], 0<=beta<1, initial x in [-1000,1000], at most 100 updates.
The strict inequalities concern deterministic scalar modes, not nonlinear
stochastic training. Boundaries can lose decay; a stable trace can oscillate.
Lookahead uses physical velocity v and x+beta*v; it is not PyTorch's current-
coordinate Nesterov variable. Each row prints the actual gradient evaluation.
"""
import cmath
import math


def parameters(curvature, rate, beta):
    if any(isinstance(x, bool) or not isinstance(x, (int, float))
           or not math.isfinite(x) for x in [curvature, rate, beta]):
        raise ValueError("Use finite real curvature, rate and momentum.")
    if not .001 <= curvature <= 100 or not .00001 <= rate <= 10 or not 0 <= beta < 1:
        raise ValueError("Use curvature .001..100, rate .00001..10 and momentum in [0,1).")


def mode_roots(method, curvature, rate, beta):
    parameters(curvature, rate, beta)
    a=rate*curvature
    if method == "heavy_ball":
        trace, determinant=1+beta-a, beta
    elif method == "lookahead":
        trace, determinant=(1-a)*(1+beta), beta*(1-a)
    else:
        raise ValueError("Choose heavy_ball or lookahead.")
    radical=cmath.sqrt(trace*trace-4*determinant)
    return ((trace+radical)/2, (trace-radical)/2)


def trajectory(method, initial, curvature, rate, beta, steps):
    parameters(curvature,rate,beta)
    if method not in {"heavy_ball","lookahead"}:
        raise ValueError("Choose heavy_ball or lookahead.")
    if isinstance(initial,bool) or not isinstance(initial,(int,float)) or not math.isfinite(initial) or abs(initial)>1000:
        raise ValueError("Use a finite real initial state within [-1000,1000].")
    if type(steps) is not int or not 0 <= steps <= 100:
        raise ValueError("Use an integer update count 0..100.")
    x,velocity=float(initial),0.
    rows=[]
    for step in range(1,steps+1):
        before=x
        evaluation=x if method=="heavy_ball" else x+beta*velocity
        gradient=curvature*evaluation
        velocity=beta*velocity-rate*gradient
        x+=velocity
        if not all(math.isfinite(value) for value in [evaluation,gradient,velocity,x]):
            raise ArithmeticError("The requested trace exceeded finite arithmetic.")
        rows.append((step,before,evaluation,gradient,velocity,x))
    return rows


if __name__ == "__main__":
    for method in ["heavy_ball","lookahead"]:
        for rate in [.1,.15]:
            roots=mode_roots(method,12.,rate,.8)
            radius=max(abs(root) for root in roots)
            bound=2*(1+.8) if method=="heavy_ball" else 2*(1+.8)/(1+2*.8)
            print(method,"eta*lambda",round(rate*12,6),"strict upper bound",round(bound,6),"root radius",round(radius,6))
    for method in ["heavy_ball","lookahead"]:
        print(method,"step/before/evaluation/gradient/velocity/after")
        for row in trajectory(method,5.,2.,.1,.9,3):
            print(row[0],*[round(x,6) for x in row[1:]])
    B,eta,noise_variance=2,.2,5.
    steady=eta*noise_variance/(B*(2-eta))
    print("quadratic IID steady parameter variance:",round(steady,6))
