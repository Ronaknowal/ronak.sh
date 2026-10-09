def summarize(values):
    count, mean, squared_deviations = 0, 0.0, 0.0
    for value in values:
        count += 1
        delta = value - mean
        mean += delta / count
        squared_deviations += delta * (value - mean)
    return count, mean, squared_deviations

def merge(left, right):
    n_left, mean_left, m2_left = left
    n_right, mean_right, m2_right = right
    if n_left == 0:
        return right
    if n_right == 0:
        return left
    count = n_left + n_right
    difference = mean_right - mean_left
    mean = mean_left + difference * n_right / count
    m2 = m2_left + m2_right + difference ** 2 * n_left * n_right / count
    return count, mean, m2

left, right = [1, 2, 3], [5, 6]
combined = merge(summarize(left), summarize(right))
print('left:', summarize(left), '| right:', summarize(right))
print('merged:', combined)
count, mean, m2 = combined
print('Gaussian MLE mean and variance:', round(mean, 6), round(m2 / count, 6))
print('unbiased sample variance:', round(m2 / (count - 1), 6))
print('same as one pass:', all(abs(a - b) < 1e-12
                               for a, b in zip(combined, summarize(left + right))))