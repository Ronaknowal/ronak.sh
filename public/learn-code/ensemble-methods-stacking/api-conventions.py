import numpy as np
import sklearn
from sklearn.ensemble import AdaBoostClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import LinearSVC
from sklearn.tree import DecisionTreeClassifier

x = np.arange(6.0, dtype=float).reshape(-1, 1)
y = np.array([0, 0, 1, 1, 0, 1])
ada = AdaBoostClassifier(
    estimator=DecisionTreeClassifier(max_depth=1), n_estimators=3, random_state=7
).fit(x, y)
print("sklearn:", sklearn.__version__)
print("SAMME errors:", np.round(ada.estimator_errors_, 6).tolist())
print("SAMME weights:", np.round(ada.estimator_weights_, 6).tolist())
print("signed binary alpha:", np.round(ada.estimator_weights_ / 2, 6).tolist())

x = np.array(
    [
        [-3.0, 0.0],
        [-2.0, 1.0],
        [-1.0, 0.0],
        [0.0, 1.0],
        [1.0, 0.0],
        [2.0, 1.0],
        [3.0, 0.0],
        [4.0, 1.0],
    ]
)
y = np.array([0, 0, 1, 0, 1, 1, 0, 1])
stack = StackingClassifier(
    estimators=[
        ("bayes", GaussianNB()),
        ("margin", make_pipeline(StandardScaler(), LinearSVC(random_state=3))),
    ],
    final_estimator=LogisticRegression(),
    cv=2,
    stack_method="auto",
)
stack.fit(x, y)
transformed = stack.transform(x)
print("selected methods:", stack.stack_method_)
print("full-refit transform shape:", transformed.shape)
assert np.allclose(transformed[:, 0], stack.estimators_[0].predict_proba(x)[:, 1])
assert np.allclose(transformed[:, 1], stack.estimators_[1].decision_function(x))
print("column 0 = P(class 1); column 1 = margin: checked")
# transform(x) is the full-refit representation, not the OOF training matrix.
