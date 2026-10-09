from fractions import Fraction
import numpy as np
from sklearn.tree import DecisionTreeRegressor

x = np.arange(6.0, dtype=float).reshape(-1, 1)
y = np.array([1.0, 2.0, 2.0, 6.0, 7.0, 8.0])
bags = [[0, 0, 2, 3, 3, 5], [1, 2, 2, 4, 4, 5], [0, 1, 1, 3, 4, 4]]
predictions = []
for index, draws in enumerate(bags):
    model = DecisionTreeRegressor(max_depth=1, random_state=7).fit(x[draws], y[draws])
    predictions.append(model.predict(x))
    count = np.bincount(draws, minlength=6)
    threshold = model.tree_.threshold[0]
    print(f"bag {index+1}: counts={count.tolist()}, threshold={threshold:.1f}")
    print("  predictions:", np.round(predictions[-1], 6).tolist())
eligible = [index for index, draws in enumerate(bags) if 0 not in draws]
print("A eligible bags:", [index + 1 for index in eligible])
oob = np.mean([predictions[index][0] for index in eligible]) if eligible else None
print("A OOB prediction:", round(float(oob), 6) if oob is not None else None)
print("A all-model prediction:", round(float(np.mean(predictions, axis=0)[0]), 6))
missing = Fraction(5, 6) ** 6
print("specified row absent in a random six-draw bag:", missing)
print("expected distinct rows:", 6 * (1 - missing))
print("no eligible model among three independent random bags:", (1 - missing) ** 3)
