from fft_iterative_scratch import fft


def linear_convolution(samples, kernel):
    if not samples or not kernel:
        raise ValueError('nonempty sample and kernel vectors required')
    output_count = len(samples) + len(kernel) - 1
    transform_count = 1
    while transform_count < output_count:
        transform_count *= 2
    left = fft(list(samples) + [0]*(transform_count-len(samples)))
    right = fft(list(kernel) + [0]*(transform_count-len(kernel)))
    output = fft([x*h for x, h in zip(left, right)], inverse=True)
    return output[:output_count]


if __name__ == '__main__':
    import numpy as np

    samples, kernel = [1, 2, 0, -1], [1, 1]
    output = linear_convolution(samples, kernel)
    print('linear:', [round(z.real) for z in output])
    print('NumPy same input:', np.allclose(output, np.convolve(samples, kernel), atol=1e-12, rtol=0))
    direct = [sum(samples[j]*kernel[n-j] for j in range(len(samples))
                  if 0 <= n-j < len(kernel)) for n in range(len(output))]
    print('indexed overlap:', direct)
