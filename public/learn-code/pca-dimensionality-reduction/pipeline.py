import numpy as np
from sklearn.datasets import load_wine
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score

wine = load_wine()
folds = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
for k in [None, 2, 8]:
    reduction = "passthrough" if k is None else PCA(
        n_components=k, svd_solver="full"
    )
    pipeline = make_pipeline(
        StandardScaler(), reduction, LogisticRegression(max_iter=2000)
    )
    accuracy = cross_val_score(
        pipeline, wine.data, wine.target,
        cv=folds, scoring="accuracy", n_jobs=1
    )
    print(k, np.round(accuracy, 4), round(accuracy.mean(), 4))
