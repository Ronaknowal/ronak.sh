import math

def fit(counts):
    if len(counts) != 3 or any(type(value) is not int or value < 0 for value in counts):
        raise ValueError('Provide three nonnegative integer counts.')
    total = sum(counts)
    if total == 0:
        return 'no observations', None
    if min(counts) == 0:
        return 'boundary: no finite natural-parameter MLE', None
    negative, zero, positive = counts
    eta1 = 0.5 * math.log(positive / negative)
    eta2 = 0.5 * (math.log(positive) + math.log(negative) - 2 * math.log(zero))
    return 'finite', (eta1, eta2)

for counts in ([2, 5, 3], [2, 0, 3], [0, 0, 0]):
    status, parameters = fit(counts)
    print(counts, status)
    if parameters is not None:
        eta1, eta2 = parameters
        logs = [-eta1 + eta2, 0.0, eta1 + eta2]
        shift = max(logs)
        weights = [math.exp(value - shift) for value in logs]
        probabilities = [value / sum(weights) for value in weights]
        print('eta:', [round(value, 6) for value in parameters])
        print('model masses:', [round(value, 6) for value in probabilities])