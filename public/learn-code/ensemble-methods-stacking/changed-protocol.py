import numpy as np
from sklearn.base import clone
from sklearn.datasets import make_circles
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import VotingClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, log_loss, brier_score_loss, confusion_matrix
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier


def experiment(seed=71, noise=0.14, omit_tree=False):
    x, y = make_circles(n_samples=360, noise=noise, factor=0.5, random_state=seed)
    indices = np.arange(len(y))
    train, rest = train_test_split(indices, test_size=0.4, stratify=y, random_state=23)
    valid, test = train_test_split(
        rest, test_size=0.5, stratify=y[rest], random_state=29
    )
    bases = [
        (
            "line",
            make_pipeline(StandardScaler(), LogisticRegression(C=1, max_iter=2000)),
        ),
        ("tree", DecisionTreeClassifier(max_depth=4, random_state=31)),
        (
            "neighbor",
            make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=9)),
        ),
    ]
    if omit_tree:
        bases = [item for item in bases if item[0] != "tree"]
    candidates = {name: clone(model) for name, model in bases}
    candidates["soft"] = VotingClassifier(estimators=bases, voting="soft", n_jobs=1)
    candidates["stack"] = StackingClassifier(
        estimators=bases,
        final_estimator=LogisticRegression(C=1, max_iter=2000),
        cv=StratifiedKFold(3, shuffle=True, random_state=37),
        n_jobs=1,
    )
    candidates["prior"] = DummyClassifier(strategy="prior")
    fitted = {name: model.fit(x[train], y[train]) for name, model in candidates.items()}
    validation = {
        name: log_loss(y[valid], model.predict_proba(x[valid]))
        for name, model in fitted.items()
    }
    selected = min(validation, key=lambda name: (validation[name], name))
    # Select action threshold using only validation; false negative costs four.
    pv = fitted[selected].predict_proba(x[valid])[:, 1]
    thresholds = np.unique(np.r_[0.0, pv, 1.0])

    def cost(threshold):
        action = pv >= threshold
        return int(
            np.sum(action & (y[valid] == 0)) + 4 * np.sum((~action) & (y[valid] == 1))
        )

    threshold = min(thresholds, key=lambda value: (cost(value), value))
    report = {}
    # Candidate set and selection are frozen before this test report is opened.
    for name, model in fitted.items():
        p = model.predict_proba(x[test])[:, 1]
        report[name] = {
            "validationLogLoss": validation[name],
            "testLogLoss": log_loss(y[test], np.c_[1 - p, p]),
            "testBrier": brier_score_loss(y[test], p),
            "testAccuracy": accuracy_score(y[test], model.predict(x[test])),
        }
    p = fitted[selected].predict_proba(x[test])[:, 1]
    action = p >= threshold
    matrix = confusion_matrix(y[test], action, labels=[0, 1])
    print("split sizes:", len(train), len(valid), len(test))
    for name, values in report.items():
        print(
            f"{name}: valLL={values['validationLogLoss']:.6f}, testLL={values['testLogLoss']:.6f}, Brier={values['testBrier']:.6f}, accuracy={values['testAccuracy']:.6f}"
        )
    print("selected on validation:", selected)
    print(f"selected validation cost threshold: {threshold:.6f}")
    print("test confusion [TN,FP;FN,TP]:", matrix.tolist())
    print("test action cost:", int(matrix[0, 1] + 4 * matrix[1, 0]))
    print(
        "Keep this finite report separate from a guarantee of calibration or superiority."
    )
    return {
        "x": x,
        "y": y,
        "train": train,
        "valid": valid,
        "test": test,
        "fitted": fitted,
        "report": report,
        "selected": selected,
        "threshold": threshold,
    }


run = experiment(seed=83, noise=0.20, omit_tree=True)
