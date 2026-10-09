"""Sorted block sweep, exhaustive oracle and signed AdaBoost saved inference.

Run: python ensemble-stump-sweep.py
Dependencies: NumPy, SciPy, scikit-learn. The eight rows below are a new fixture.
The old NumPy/native comparison is neither imported nor executed.
"""
import hashlib
import numpy as np
from scipy.special import logsumexp
from sklearn.ensemble import AdaBoostClassifier
from sklearn.tree import DecisionTreeClassifier


def training_arrays(features, labels):
    x, y = np.asarray(features, dtype=float), np.asarray(labels, dtype=int)
    if x.ndim != 2 or not len(x) or not x.shape[1] or not np.isfinite(x).all():
        raise ValueError("features must be a nonempty finite row-by-feature matrix")
    if y.shape != (len(x),) or not np.isin(y, [-1, 1]).all():
        raise ValueError("labels must be signed -1/+1, one per row")
    return x, y


def training_identity(x, y, row_ids):
    return hashlib.sha256(x.tobytes() + y.tobytes() + repr(tuple(row_ids)).encode()).hexdigest()


def build_sorted_cache(features, labels, row_ids=None):
    x, y = training_arrays(features, labels)
    ids = tuple(range(len(x))) if row_ids is None else tuple(row_ids)
    if len(ids) != len(x) or len(set(ids)) != len(ids):
        raise ValueError("row identities must be unique and match the matrix")
    columns = []
    for column in range(x.shape[1]):
        order = np.argsort(x[:, column], kind="stable")
        values = x[order, column]
        # Boundaries only after an entire equal-value block. No tie is split.
        ends = np.r_[np.flatnonzero(values[1:] != values[:-1]) + 1, len(x)]
        unique = values[ends - 1]
        thresholds = np.r_[np.nextafter(unique[0], -np.inf), unique[:-1] / 2 + unique[1:] / 2, np.nextafter(unique[-1], np.inf)]
        if not np.isfinite(thresholds).all():
            raise ArithmeticError("exterior threshold exceeds finite numerical range")
        columns.append({"order": order, "ends": ends, "thresholds": thresholds})
    return {"identity": training_identity(x, y, ids), "row_ids": ids, "columns": columns}


def stump_predict(stump, features):
    x = np.asarray(features, dtype=float)
    if x.ndim != 2 or not np.isfinite(x).all() or x.shape[1] <= stump["feature"]:
        raise ValueError("query matrix does not match the saved stump feature")
    return np.where(x[:, stump["feature"]] >= stump["threshold"], stump["polarity"], -stump["polarity"])


def fit_sweep(features, labels, weights, cache):
    x, y = training_arrays(features, labels)
    w = np.asarray(weights, dtype=float)
    if w.shape != y.shape or not np.isfinite(w).all() or np.any(w < 0) or not np.any(w > 0):
        raise ValueError("weights must be finite/nonnegative with a positive total")
    if cache["identity"] != training_identity(x, y, cache["row_ids"]):
        raise ValueError("stale sorted cache: features, labels or row identities changed")
    w = w / w.max()
    w /= w.sum()
    best = None
    for feature, column in enumerate(cache["columns"]):
        order, ends = column["order"], column["ends"]
        positive = np.cumsum(w[order] * (y[order] == 1))
        negative = np.cumsum(w[order] * (y[order] == -1))
        left_positive = np.r_[0., positive[ends - 1]]
        left_negative = np.r_[0., negative[ends - 1]]
        right_positive = np.maximum(positive[-1] - left_positive, 0)
        right_negative = np.maximum(negative[-1] - left_negative, 0)
        for index, threshold in enumerate(column["thresholds"]):
            for polarity in [-1, 1]:
                error = float(left_positive[index] + right_negative[index]) if polarity == 1 else float(left_negative[index] + right_positive[index])
                candidate = (error, feature, float(threshold), polarity)
                if best is None or candidate < best:
                    best = candidate
    error, feature, threshold, polarity = best
    return {"error": error, "feature": feature, "threshold": threshold, "polarity": polarity}


def exhaustive_oracle(features, labels, weights, cache):
    x, y = training_arrays(features, labels)
    w = np.asarray(weights, dtype=float)
    w = w / w.sum()
    candidates = []
    for feature, column in enumerate(cache["columns"]):
        for threshold in column["thresholds"]:
            for polarity in [-1, 1]:
                stump = {"feature": feature, "threshold": float(threshold), "polarity": polarity}
                error = float(w @ (stump_predict(stump, x) != y))
                candidates.append((error, feature, float(threshold), polarity))
    error, feature, threshold, polarity = min(candidates)
    return {"error": error, "feature": feature, "threshold": threshold, "polarity": polarity}


def fit_signed_boost(features, labels, rounds=5, row_ids=None):
    x, y = training_arrays(features, labels)
    if not isinstance(rounds, int) or rounds < 1:
        raise ValueError("rounds must be a positive integer")
    cache = build_sorted_cache(x, y, row_ids)
    log_weights = np.full(len(x), -np.log(len(x)))
    state = {"feature_count": x.shape[1], "stumps": [], "alphas": [], "perfect_stump": None,
             "stop": "round limit", "trace": [], "training_identity": cache["identity"]}
    log_loss = 0.
    for round_id in range(rounds):
        weights = np.exp(log_weights)
        stump = fit_sweep(x, y, weights, cache)
        oracle = exhaustive_oracle(x, y, weights, cache)
        # Floating cumulative sums can perturb an exactly tied error by ulps.
        # Confirm the selected predictor has the exhaustive minimum, not a false universal tie identity.
        actual_error = float(weights @ (stump_predict(stump, x) != y))
        if not np.isclose(actual_error, oracle["error"], atol=2e-15, rtol=0):
            raise AssertionError("sweep did not attain the exhaustive weighted minimum")
        error = actual_error
        trace = {"round": round_id + 1, "before_weights": weights.copy(), "stump": stump.copy(),
                 "oracle": oracle, "error": error, "before_sum": float(weights.sum())}
        if error == 0:
            state["perfect_stump"] = stump
            state["stop"] = "perfect stump; it dominates finite earlier votes"
            trace.update(alpha=None, normalizer=0., log_loss_after=-np.inf, after_weights=None)
            state["trace"].append(trace)
            break
        if error >= .5:
            state["stop"] = "no positive edge; no additional vote"
            trace.update(alpha=0., normalizer=1., log_loss_after=log_loss, after_weights=weights.copy())
            state["trace"].append(trace)
            break
        alpha = .5 * (np.log1p(-error) - np.log(error))
        prediction = stump_predict(stump, x)
        unnormalized = log_weights - alpha * y * prediction
        log_normalizer = float(logsumexp(unnormalized))
        log_weights = unnormalized - log_normalizer
        log_loss += log_normalizer
        state["stumps"].append(stump)
        state["alphas"].append(float(alpha))
        trace.update(alpha=float(alpha), normalizer=float(np.exp(log_normalizer)), log_loss_after=log_loss,
                     after_weights=np.exp(log_weights))
        state["trace"].append(trace)
    return state


def saved_forward(state, features):
    x = np.asarray(features, dtype=float)
    if x.ndim != 2 or x.shape[1] != state["feature_count"] or not np.isfinite(x).all():
        raise ValueError("saved feature schema does not match queries")
    if state["perfect_stump"] is not None:
        return {"score": None, "label": stump_predict(state["perfect_stump"], x), "policy": state["stop"]}
    contributions = np.array([alpha * stump_predict(stump, x) for stump, alpha in zip(state["stumps"], state["alphas"])])
    score = contributions.sum(axis=0) if len(contributions) else np.zeros(len(x))
    return {"contributions": contributions, "score": score, "label": np.where(score > 0, 1, -1), "policy": "zero vote ties choose -1"}


def main():
    np.set_printoptions(precision=9, suppress=True)
    x = np.array([-2, -1, 0, 0, 1, 2, 3, 4], dtype=float)[:, None]
    y = np.array([-1, -1, 1, -1, 1, 1, -1, 1])
    state = fit_signed_boost(x, y)
    for row in state["trace"]:
        print("round", row["round"], "error", row["error"], "stump", row["stump"])
        print("weights before", row["before_weights"], "sum", row["before_sum"])
        print("alpha/Z/log loss", row["alpha"], row["normalizer"], row["log_loss_after"])
        print("weights after", row["after_weights"])
        print("exhaustive minimum", row["oracle"])
    queries = np.array([[-1.5], [0], [2.5], [4.5]])
    print("saved query", queries.ravel(), saved_forward(state, queries))
    ordinary = AdaBoostClassifier(estimator=DecisionTreeClassifier(max_depth=1, random_state=7), n_estimators=5, random_state=7).fit(x, y)
    print("ordinary SAMME errors", ordinary.estimator_errors_[:len(ordinary.estimators_)])
    print("ordinary SAMME stored weights", ordinary.estimator_weights_[:len(ordinary.estimators_)])
    print("ordinary query labels", ordinary.predict(queries), "probabilities", ordinary.predict_proba(queries))
    print("conventions: ordinary binary SAMME weights are twice the signed alpha when errors match; tree split/leaf ties and probability link are separately defined")
    perfect = fit_signed_boost([[-1], [1]], [-1, 1])
    no_edge = fit_signed_boost([[0], [0]], [-1, 1])
    print("perfect boundary", perfect["stop"], saved_forward(perfect, [[0]]))
    print("no-edge boundary", no_edge["stop"], saved_forward(no_edge, [[0]]))


if __name__ == "__main__":
    main()
