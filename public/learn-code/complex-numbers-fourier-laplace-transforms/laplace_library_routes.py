import sympy as sp

t = sp.symbols('t', real=True)
s = sp.symbols('s')
signals = [sp.exp(-t), t*sp.exp(-t), sp.Heaviside(t-1)*t]
for signal in signals:
    expression, boundary, conditions = sp.laplace_transform(signal, t, s)
    print('signal:', signal)
    print('transform:', expression)
    print('Re(s) >', boundary, '; additional conditions:', conditions)

# At the origin SymPy uses its generalized 0-minus convention.
impulse_transform = sp.laplace_transform(sp.DiracDelta(t), t, s)
print('origin impulse:', impulse_transform)

# The ordinary post-jump solution carries its own initial value.
y = 1 + 2*sp.exp(-2*t)
print('ordinary IVP:', sp.simplify(sp.diff(y, t) + 2*y - 2), y.subs(t, 0))
