from itertools import product

x, weight, target, keep = [2.0, 1.0], [1.0, -1.0], 1.0, 0.5
expected_prediction = expected_loss = 0.0
for mask in product([0, 1], repeat=2):
    probability = 1.0
    for kept in mask:
        probability *= keep if kept else 1 - keep
    prediction = sum(a * w * m / keep for a, w, m in zip(x, weight, mask))
    loss = (target - prediction) ** 2 / 2
    expected_prediction += probability * prediction
    expected_loss += probability * loss
    print(mask, probability, prediction, loss)
print(expected_prediction, expected_loss)