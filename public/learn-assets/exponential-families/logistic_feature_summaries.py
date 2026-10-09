import math

design = [(1, -1), (1, 0), (1, 1)]
outcomes = [0, 1, 1]
coefficients = [-0.2, 0.7]

def softplus(value):
    return max(value, 0) + math.log1p(math.exp(-abs(value)))

def sigmoid(value):
    if value >= 0:
        return 1 / (1 + math.exp(-value))
    exponential = math.exp(value)
    return exponential / (1 + exponential)

scores = [sum(feature * coefficient for feature, coefficient in zip(row, coefficients))
          for row in design]
probabilities = [sigmoid(score) for score in scores]
loss = sum(softplus(score) - outcome * score
           for score, outcome in zip(scores, outcomes))
gradient = [sum(row[column] * (probability - outcome)
                for row, probability, outcome in zip(design, probabilities, outcomes))
            for column in range(2)]
hessian = [[sum(row[first] * row[second] * p * (1 - p)
                for row, p in zip(design, probabilities))
            for second in range(2)] for first in range(2)]
statistic = [sum(row[column] * value for row, value in zip(design, outcomes))
             for column in range(2)]
print('X-transpose y:', statistic)
print('loss:', round(loss, 6))
print('gradient:', [round(value, 6) for value in gradient])
print('Hessian:', [[round(value, 6) for value in row] for row in hessian])