import cmath
import math


def fft(values, inverse=False):
    """Radix-2 transform: O(N log N) arithmetic and O(N) working storage."""
    data = [complex(value) for value in values]
    count = len(data)
    if not count or count & (count - 1):
        raise ValueError('positive power-of-two length required')
    if any(not math.isfinite(z.real) or not math.isfinite(z.imag) for z in data):
        raise ValueError('finite complex samples required')

    # Reverse index bits so the bottom-up pairs begin with the recursive leaves.
    reversed_index = 0
    for index in range(1, count):
        bit = count >> 1
        while reversed_index & bit:
            reversed_index ^= bit
            bit >>= 1
        reversed_index ^= bit
        if index < reversed_index:
            data[index], data[reversed_index] = data[reversed_index], data[index]

    direction = 1 if inverse else -1
    width = 2
    while width <= count:
        half = width // 2
        twiddles = [cmath.exp(direction * 2j * math.pi * offset / width)
                    for offset in range(half)]
        for start in range(0, count, width):
            for offset in range(half):
                even = data[start + offset]
                rotated_odd = twiddles[offset] * data[start + offset + half]
                data[start + offset] = even + rotated_odd
                data[start + offset + half] = even - rotated_odd
        width *= 2
    return [z / count for z in data] if inverse else data


if __name__ == '__main__':
    import numpy as np

    samples = [1, 2, 0, -1]
    spectrum = fft(samples)
    print('spectrum:', [(round(z.real), round(z.imag)) for z in spectrum])
    print('inverse:', [round(z.real) for z in fft(spectrum, inverse=True)])
    print('NumPy same input:', np.allclose(spectrum, np.fft.fft(samples), atol=1e-12, rtol=0))
    print('energy:', round(sum(abs(z)**2 for z in spectrum) / len(samples), 6))
