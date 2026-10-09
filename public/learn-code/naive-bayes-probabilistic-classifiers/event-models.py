import numpy as np
from sklearn.naive_bayes import BernoulliNB, CategoricalNB, MultinomialNB

X = np.array([[2, 1, 0, 0, 0], [1, 1, 1, 0, 0], [0, 0, 0, 1, 1]])
y = np.array([1, 1, 0])
queries = np.array([[1, 0, 0, 0, 0], [2, 0, 0, 0, 0], [0, 0, 0, 0, 0]])
for model in [MultinomialNB(alpha=1), BernoulliNB(alpha=1, binarize=0.0)]:
    model.fit(X, y)
    print(
        type(model).__name__,
        "P(spam):",
        model.predict_proba(queries)[:, 1].round(6).tolist(),
    )

# Status: idle=0, busy=1, offline=2, other=3 (reserved by a fixed input schema).
# Link: wired=0, radio=1. Each column has its own category universe.
status_link = np.array([[0, 0], [0, 1], [1, 0], [2, 1], [2, 0], [1, 1]])
fault = np.array([0, 0, 0, 1, 1, 1])
categorical = CategoricalNB(alpha=1, min_categories=[4, 2]).fit(status_link, fault)
print("category counts:", [row.tolist() for row in categorical.category_count_])
print(
    "offline/radio and other/wired:",
    categorical.predict_proba([[2, 1], [3, 0]]).round(6).tolist(),
)
try:
    categorical.predict_proba([[4, 0]])
except IndexError:
    print(
        "category 4: outside the declared/fitted support; reject or map by the fixed schema"
    )
