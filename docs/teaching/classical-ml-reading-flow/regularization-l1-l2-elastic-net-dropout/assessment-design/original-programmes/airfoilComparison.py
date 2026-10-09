from pathlib import Path
import numpy as np
from sklearn.linear_model import Ridge, Lasso, ElasticNet, LinearRegression
from sklearn.model_selection import KFold, train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures, StandardScaler

def make_model(family, strength, n_fit):
    if family == "ridge":
        fit = Ridge(alpha=n_fit * strength, solver="svd")
    elif family == "lasso":
        fit = Lasso(alpha=strength, max_iter=50000, tol=1e-8)
    elif family == "elastic_net":
        fit = ElasticNet(alpha=strength, l1_ratio=.5, max_iter=50000, tol=1e-8)
    elif family == "ols":
        fit = LinearRegression()
    else:
        raise ValueError(family)
    return make_pipeline(
        PolynomialFeatures(degree=2, include_bias=False), StandardScaler(), fit,
    )

# The supplied .dat is tab separated, 1503 rows by 6 columns, which is the
# whitespace layout np.loadtxt reads by default.
data = np.loadtxt(Path(__file__).with_name("airfoil-self-noise.dat"))
development, reserved = train_test_split(
    np.arange(len(data)), train_size=1200, random_state=41,
)
X, y = data[development, :5], data[development, 5]
splits = list(KFold(n_splits=3, shuffle=True, random_state=202).split(X))
strengths = [.001, .01, .1, 1, 10, 100]
mean_errors, ols_errors = [], []
for train, valid in splits:
    mean_errors.append(np.mean((y[valid] - y[train].mean()) ** 2))
    ols = make_model("ols", 0, len(train)).fit(X[train], y[train])
    ols_errors.append(np.mean((ols.predict(X[valid]) - y[valid]) ** 2))
print("baseline mean MSE", round(float(np.mean(mean_errors)), 6))
print("OLS mean MSE", round(float(np.mean(ols_errors)), 6))

for family in ["ridge", "lasso", "elastic_net"]:
    candidates = []
    for strength in strengths:
        errors, nonzero = [], []
        for train, valid in splits:
            model = make_model(family, strength, len(train)).fit(X[train], y[train])
            errors.append(np.mean((model.predict(X[valid]) - y[valid]) ** 2))
            nonzero.append(int(np.count_nonzero(model[-1].coef_)))
        score = float(np.mean(errors))
        candidates.append((score, strength))
        print(family, strength, round(score, 6), nonzero)
    score, selected_strength = min(candidates)  # lower strength resolves an exact tie
    fitted = make_model(family, selected_strength, len(X)).fit(X, y)
    print("selected", family, selected_strength,
          "development CV MSE", round(score, 6),
          "refit nonzero", int(np.count_nonzero(fitted[-1].coef_)))