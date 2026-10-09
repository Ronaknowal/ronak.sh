"""A complex-step derivative check for an analytic extension, not for abs.

The imaginary-part method avoids subtraction for this polynomial. It is still
floating-point arithmetic. An operation such as real abs has no holomorphic
extension by simply calling abs on complex inputs; that route is invalid.
Python3 standard library only; no autodiff engine is implemented here.
"""


def complex_step(function, point, step):
    return function(complex(point, step)).imag / step


if __name__ == '__main__':
    x = 2.
    for h in [1e-2, 1e-8, 1e-20]:
        rate = complex_step(lambda z: z*z*z, x, h)
        central = ((x+h)**3-(x-h)**3)/(2*h)
        print('h', h, 'complex', rate, 'central', central, 'exact', 3*x*x)
    print('invalid abs complex route', complex_step(abs, x, 1e-8), 'real abs slope', 1.)
