import math


def add(z, w):
    return z[0]+w[0], z[1]+w[1]


def conjugate(z):
    return z[0], -z[1]


def multiply(z, w):
    return z[0]*w[0]-z[1]*w[1], z[0]*w[1]+z[1]*w[0]


def divide(z, w):
    length = math.hypot(*w)
    if length == 0:
        raise ValueError('nonzero divisor required')
    # Scale the conjugate before dividing, avoiding a needlessly squared norm.
    rotated = multiply(z, (w[0]/length, -w[1]/length))
    return rotated[0]/length, rotated[1]/length


def polar(z):
    length = math.hypot(*z)
    if length == 0:
        return 0, None
    angle = math.atan2(z[1], z[0])
    return length, math.pi if angle == -math.pi else angle


def roots(z, count):
    if type(count) is not int or not 1 <= count <= 12:
        raise ValueError('integer root count from 1 through 12 required')
    length, angle = polar(z)
    if length == 0:
        return [(0, 0)]
    radius = length**(1/count)
    return [(radius*math.cos((angle+2*math.pi*k)/count),
             radius*math.sin((angle+2*math.pi*k)/count)) for k in range(count)]


if __name__ == '__main__':
    import cmath

    z, w = (1, 2), (2, -1)
    product = multiply(z, w)
    print('sum:', add(z, w))
    print('product:', product)
    print('recover:', divide(product, w))
    print('library product:', complex(*z)*complex(*w))
    print('unit roots:', [(round(a), round(b)) for a, b in roots((1, 0), 4)])
    print('zero polar:', polar((0, 0)))
    print('principal root of -8i:', cmath.exp(cmath.log(-8j)/3))
