"""Offline real-data regression and same-split NumPy / library comparison."""
import numpy as np
from sklearn.datasets import load_diabetes
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

dataset = load_diabetes(scaled=False)
X_train, X_test, y_train, y_test = train_test_split(
    dataset.data, dataset.target, test_size=.2, random_state=31)

# Learn coordinate means from training only. Centering allows an intercept without
# making its constant column compete numerically with uncentered measurement units.
mean_X = X_train.mean(axis=0)
mean_y = y_train.mean()
weights = np.linalg.lstsq(X_train-mean_X, y_train-mean_y, rcond=None)[0]
intercept = mean_y - mean_X @ weights
scratch_predictions = X_test @ weights + intercept

library = LinearRegression().fit(X_train, y_train)
library_predictions = library.predict(X_test)
np.testing.assert_allclose(scratch_predictions, library_predictions, atol=1e-9)
baseline = DummyRegressor(strategy="mean").fit(X_train, y_train)

print("training / test rows:", len(y_train), len(y_test))
print("features:", ", ".join(dataset.feature_names))
for name, predictions in [("training-mean baseline", baseline.predict(X_test)),
                          ("linear regression", library_predictions)]:
    print(f"{name}: test RMSE={np.sqrt(mean_squared_error(y_test,predictions)):.3f}; "
          f"R2={r2_score(y_test,predictions):.3f}")
print(f"maximum scratch/library prediction difference={np.max(np.abs(scratch_predictions-library_predictions)):.3e}")
