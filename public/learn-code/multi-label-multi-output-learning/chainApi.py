from itertools import product
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.multioutput import ClassifierChain

rng = np.random.default_rng(9)
X = rng.normal(size=(240, 2))
first = rng.binomial(1, 1 / (1 + np.exp(-X[:, 0])))
second = rng.binomial(1, 1 / (1 + np.exp(-(2 * first - 0.4 + 0.5 * X[:, 1]))))
Y = np.c_[first, second]
chain = ClassifierChain(
    LogisticRegression(C=1, max_iter=500), order=[0, 1], cv=None, chain_method="predict"
).fit(X, Y)
row = np.array([[0.2, -0.3]])
api = chain.predict_proba(row)[0]
first_hard = chain.estimators_[0].predict(row)[0]
path_second = chain.estimators_[1].predict_proba(np.c_[row, [first_hard]])[0, 1]
leaf_mass = {}
for a, b in product([0, 1], repeat=2):
    p_a = chain.estimators_[0].predict_proba(row)[0, a]
    p_b_given_a = chain.estimators_[1].predict_proba(np.c_[row, [a]])[0, b]
    leaf_mass[a, b] = p_a * p_b_given_a
marginal_second = sum(p for (_, b), p in leaf_mass.items() if b)
assert np.isclose(api[1], path_second)
assert np.isclose(sum(leaf_mass.values()), 1)
print("API path probabilities:", np.round(api, 6).tolist())
print("First predicted feature:", int(first_hard))
print("Second marginal from all leaves:", round(marginal_second, 6))
print(
    "Fitted joint mass:",
    [(key, round(float(value), 6)) for key, value in leaf_mass.items()],
)
