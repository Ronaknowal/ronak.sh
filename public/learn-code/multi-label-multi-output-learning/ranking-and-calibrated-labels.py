"""Rank metrics, a declared squared-hinge ranker and virtual-label voting.

NumPy owns matrix arithmetic; LinearSVC supplies an ordinary matching solver.
The global mean-pair objective here differs from original RankSVM's per-row
normalization. 'Calibrated label ranking' means a learned relevance cutoff,
not calibrated probabilities. No study data or historical program is used.
"""

from itertools import combinations

import numpy as np
from sklearn.metrics import (
    average_precision_score,
    coverage_error,
    label_ranking_average_precision_score,
    label_ranking_loss,
)
from sklearn.svm import LinearSVC


def binary_rows(y):
    y = np.asarray(y)
    if y.ndim != 2 or not y.size or not np.isin(y, (0, 1)).all():
        raise ValueError("Use nonempty complete binary output rows")
    return y.astype(int)


def ranked_rows(y, scores):
    y, scores = binary_rows(y), np.asarray(scores, dtype=float)
    if scores.shape != y.shape or not np.isfinite(scores).all():
        raise ValueError("Give every known output cell one finite score")
    return y, scores


def ranking_metrics(y, scores):
    """Current API tie conventions: ties lose a pair; ranks are maximal ranks."""
    y, scores = ranked_rows(y, scores)
    rows = []
    for truth, score in zip(y, scores):
        positive = np.flatnonzero(truth)
        negative = np.flatnonzero(1 - truth)
        pairs = len(positive) * len(negative)
        wrong = sum(score[a] <= score[b] for a in positive for b in negative)
        ranking = wrong / pairs if pairs else 0.0
        if not len(positive) or not len(negative):
            lrap = 1.0
        else:
            lrap = np.mean(
                [
                    np.sum(score[positive] >= score[a]) / np.sum(score >= score[a])
                    for a in positive
                ]
            )
        coverage = np.sum(score >= score[positive].min()) if len(positive) else 0
        rows.append(
            dict(
                ranking_loss=float(ranking),
                lrap=float(lrap),
                coverage=int(coverage),
                wrong_pairs=int(wrong),
                pairs=pairs,
            )
        )
    means = {
        name: float(np.mean([row[name] for row in rows]))
        for name in ("ranking_loss", "lrap", "coverage")
    }
    return means, rows


def step_average_precision(truth, scores):
    """One output across observations; each complete score tie enters together.

    AP = sum of recall increments times the precision at each new threshold.
    It is not trapezoidal PR area and not LRAP across labels in one row.
    A column with no positive observations has AP zero under this convention.
    """
    truth, scores = np.asarray(truth), np.asarray(scores, dtype=float)
    if (
        truth.ndim != 1
        or not len(truth)
        or truth.shape != scores.shape
        or not np.isin(truth, (0, 1)).all()
        or not np.isfinite(scores).all()
    ):
        raise ValueError("Use aligned finite observation scores and binary truth")
    support = int(truth.sum())
    if not support:
        return 0.0, []
    tp, seen, ap, trace = 0, 0, 0.0, []
    for threshold in np.unique(scores)[::-1]:
        group = scores == threshold
        new_positive = int(truth[group].sum())
        tp += new_positive
        seen += int(group.sum())
        precision, increment = tp / seen, new_positive / support
        ap += increment * precision
        trace.append(
            dict(
                threshold=float(threshold),
                true_positive=tp,
                retrieved=seen,
                precision=precision,
                recall_increment=increment,
            )
        )
    return float(ap), trace


def ap_axes(y, scores):
    y, scores = ranked_rows(y, scores)
    per_label = [
        step_average_precision(y[:, j], scores[:, j])[0] for j in range(y.shape[1])
    ]
    per_row = [
        step_average_precision(truth, score)[0] for truth, score in zip(y, scores)
    ]
    return dict(
        per_label=per_label,
        macro=float(np.mean(per_label)),
        micro=step_average_precision(y.ravel(), scores.ravel())[0],
        samples=float(np.mean(per_row)),
    )


def normalized_ranking_counterexample():
    """Two possible four-label truths; compute each expected loss directly."""
    y = np.array([[1, 0, 1, 0], [0, 1, 0, 0]])
    masses = np.array([0.55, 0.45])
    relevant = y.sum(axis=1)
    pair_weight = 1 / (relevant * (y.shape[1] - relevant))
    raw = masses @ y
    weighted = (masses * pair_weight) @ y
    scores = {
        "raw-marginal order": np.array([4.0, 2.0, 3.0, 1.0]),
        "row-normalized order": np.array([3.0, 4.0, 2.0, 1.0]),
    }
    risks = {}
    for name, score in scores.items():
        _, rows = ranking_metrics(y, np.tile(score, (len(y), 1)))
        risks[name] = float(masses @ [row["ranking_loss"] for row in rows])
    return dict(
        truths=y.tolist(),
        masses=masses.tolist(),
        raw=raw.tolist(),
        weighted=weighted.tolist(),
        risks=risks,
    )


def pair_design(x, y, max_rows=50000, max_entries=2000000):
    """Augment 1, then put +x/-x in the two output blocks; add signed copies.

    Guard the exact transformed dimensions BEFORE allocating the dense matrix.
    Both signed copies have identical margin and hence preserve the mean loss.
    The augmented coefficient is regularized, unlike the N1 intercept.
    """
    x, y = np.asarray(x, dtype=float), binary_rows(y)
    if x.ndim != 2 or not x.size or len(x) != len(y) or not np.isfinite(x).all():
        raise ValueError("Use finite aligned feature and target rows")
    positives = y.sum(axis=1)
    originals = int(np.sum(positives * (y.shape[1] - positives)))
    rows, width = 2 * originals, (x.shape[1] + 1) * y.shape[1]
    if (
        isinstance(max_rows, bool)
        or isinstance(max_entries, bool)
        or not isinstance(max_rows, int)
        or not isinstance(max_entries, int)
        or max_rows < 1
        or max_entries < 1
    ):
        raise ValueError("Set positive integer materialization budgets")
    if rows == 0:
        raise ValueError("No relevant-irrelevant pair supports a ranker fit")
    if rows > max_rows or rows * width > max_entries:
        raise ValueError(f"Unsupported pair materialization: {rows} x {width}")
    design, signs, trace = np.zeros((rows, width)), np.zeros(rows), []
    augmented = np.column_stack((np.ones(len(x)), x))
    block_width, cursor = x.shape[1] + 1, 0
    for row in range(len(y)):
        for a in np.flatnonzero(y[row]):
            for b in np.flatnonzero(1 - y[row]):
                design[cursor, a * block_width : (a + 1) * block_width] = augmented[row]
                design[cursor, b * block_width : (b + 1) * block_width] = -augmented[
                    row
                ]
                design[cursor + 1] = -design[cursor]
                signs[cursor : cursor + 2] = [1, -1]
                trace.append(
                    dict(
                        source_row=row,
                        relevant=int(a),
                        irrelevant=int(b),
                        transformed_rows=[cursor, cursor + 1],
                    )
                )
                cursor += 2
    return design, signs, trace


def squared_hinge_objective(design, signs, coefficients, strength):
    design, signs, coefficients = [
        np.asarray(value, dtype=float) for value in (design, signs, coefficients)
    ]
    if (
        design.ndim != 2
        or not design.size
        or signs.shape != (len(design),)
        or coefficients.shape != (design.shape[1],)
        or not np.isin(signs, (-1, 1)).all()
        or not all(np.isfinite(a).all() for a in (design, signs, coefficients))
        or not np.isfinite(strength)
        or strength <= 0
    ):
        raise ValueError("Use finite pair arrays, signed classes and positive penalty")
    deficit = np.maximum(0, 1 - signs * (design @ coefficients))
    loss = float(
        np.mean(deficit**2) + strength * np.dot(coefficients, coefficients) / 2
    )
    gradient = -2 * design.T @ (signs * deficit) / len(design) + strength * coefficients
    return loss, gradient


def fit_pair_ranker(
    x,
    y,
    strength=0.2,
    tolerance=1e-9,
    max_steps=30000,
    max_rows=50000,
    max_entries=2000000,
):
    design, signs, trace = pair_design(x, y, max_rows, max_entries)
    if (
        not np.isfinite(strength)
        or strength <= 0
        or not np.isfinite(tolerance)
        or tolerance <= 0
        or isinstance(max_steps, bool)
        or not isinstance(max_steps, int)
        or max_steps < 1
    ):
        raise ValueError("Use positive penalty, tolerance and iteration cap")
    # Squared hinge has Hessian <= 2 Z.T Z / m; ridge adds lambda I.
    lipschitz = 2 * np.linalg.norm(design, 2) ** 2 / len(design) + strength
    coefficients = np.zeros(design.shape[1])
    losses = []
    for step in range(max_steps):
        loss, gradient = squared_hinge_objective(design, signs, coefficients, strength)
        losses.append(loss)
        if np.max(np.abs(gradient)) <= tolerance:
            break
        coefficients -= gradient / lipschitz
    else:
        raise RuntimeError("Pair ranker reached its cap without stationarity")
    library = LinearSVC(
        loss="squared_hinge",
        dual=False,
        fit_intercept=False,
        C=1 / (len(design) * strength),
        tol=1e-12,
        max_iter=10000,
    )
    library.fit(design, signs)
    width = np.asarray(x).shape[1] + 1
    return dict(
        weights=coefficients.reshape(-1, width).T,
        library=library,
        pair_design=design,
        signs=signs,
        trace=trace,
        losses=losses,
        steps=step,
        gradient_max=float(np.max(abs(gradient))),
        strength=strength,
        C=library.C,
    )


def ranker_scores(model, x):
    x = np.asarray(x, dtype=float)
    weights = model["weights"]
    if x.ndim != 2 or x.shape[1] + 1 != len(weights) or not np.isfinite(x).all():
        raise ValueError("Match the fitted ranker feature width")
    return np.column_stack((np.ones(len(x)), x)) @ weights


def fit_binary_comparison(x, truth, strength):
    """Empty discordant support ties; one direction is an explicit constant."""
    x, truth = np.asarray(x, dtype=float), np.asarray(truth)
    if (
        x.ndim != 2
        or x.shape[1] == 0
        or truth.shape != (len(x),)
        or not np.isfinite(x).all()
        or not np.isin(truth, (0, 1)).all()
        or not np.isfinite(strength)
        or strength <= 0
    ):
        raise ValueError("Align finite comparison rows and binary directions")
    if not len(truth):
        return dict(kind="neutral", direction=0.0, support=0)
    if len(np.unique(truth)) == 1:
        return dict(
            kind="constant", direction=float(2 * truth[0] - 1), support=len(truth)
        )
    estimator = LinearSVC(
        loss="squared_hinge",
        dual=False,
        fit_intercept=False,
        C=1 / (len(truth) * strength),
        tol=1e-12,
        max_iter=10000,
    )
    estimator.fit(np.column_stack((np.ones(len(x)), x)), truth)
    if not np.array_equal(estimator.classes_, [0, 1]):
        raise ValueError("Comparison class direction is unsupported")
    return dict(kind="linear", estimator=estimator, support=len(truth))


def fit_virtual_label_ranker(x, y, names, strength=0.2, max_labels=64):
    x, y, names = np.asarray(x, dtype=float), binary_rows(y), tuple(names)
    if (
        x.ndim != 2
        or not x.size
        or len(x) != len(y)
        or not np.isfinite(x).all()
        or len(names) != y.shape[1]
        or len(set(names)) != len(names)
        or any(not isinstance(name, str) or not name for name in names)
        or not np.isfinite(strength)
        or strength <= 0
    ):
        raise ValueError(
            "Align finite rows, distinct output names and positive penalty"
        )
    if (
        isinstance(max_labels, bool)
        or not isinstance(max_labels, int)
        or max_labels < 1
        or y.shape[1] > max_labels
    ):
        raise ValueError("Comparison coverage exceeds the declared label budget")
    models = []
    for a, b in combinations(range(y.shape[1]), 2):
        rows = np.flatnonzero(y[:, a] != y[:, b])
        fitted = fit_binary_comparison(x[rows], y[rows, a], strength)
        models.append(dict(a=a, b=b, training_rows=rows.tolist(), model=fitted))
    virtual = y.shape[1]
    for a in range(y.shape[1]):
        rows = np.arange(len(y))
        fitted = fit_binary_comparison(x, y[:, a], strength)
        models.append(dict(a=a, b=virtual, training_rows=rows.tolist(), model=fitted))
    return dict(
        names=names,
        virtual=virtual,
        models=models,
        feature_width=x.shape[1],
        strength=strength,
    )


def serve_virtual_label_ranker(model, x):
    x = np.asarray(x, dtype=float)
    if x.ndim != 2 or x.shape[1] != model["feature_width"] or not np.isfinite(x).all():
        raise ValueError("Match the finite comparison feature width")
    augmented = np.column_stack((np.ones(len(x)), x))
    votes = np.zeros((len(x), model["virtual"] + 1))
    contributions = []
    for pair in model["models"]:
        fitted = pair["model"]
        margin = (
            fitted["estimator"].decision_function(augmented)
            if fitted["kind"] == "linear"
            else np.full(len(x), fitted["direction"])
        )
        a_vote = np.where(margin > 0, 1.0, np.where(margin < 0, 0.0, 0.5))
        votes[:, pair["a"]] += a_vote
        votes[:, pair["b"]] += 1 - a_vote
        contributions.append(
            dict(
                a=pair["a"],
                b=pair["b"],
                kind=fitted["kind"],
                margin=margin.tolist(),
                a_votes=a_vote.tolist(),
            )
        )
    # A tie at V is excluded. Alphabetical names order DISPLAY ties only.
    prediction = votes[:, : model["virtual"]] > votes[:, model["virtual"], None]
    display_names = model["names"] + ("Virtual",)
    order = [
        sorted(range(len(display_names)), key=lambda j: (-row[j], display_names[j]))
        for row in votes
    ]
    return dict(
        votes=votes,
        prediction=prediction.astype(int),
        contributions=contributions,
        display_order=order,
    )


def tournament_votes(count, edges):
    """A transparent query tournament, including changed cycles and ties."""
    expected = set(combinations(range(count), 2))
    if set(edges) != expected:
        raise ValueError("Supply every unordered comparison exactly once")
    votes = np.zeros(count)
    for (a, b), direction in edges.items():
        if direction not in (-1, 0, 1):
            raise ValueError("Use -1, 0 (tie) or +1")
        a_vote = (direction + 1) / 2
        votes[a] += a_vote
        votes[b] += 1 - a_vote
    return votes


def main():
    np.set_printoptions(precision=6, suppress=True)
    truth = np.array([[1, 0, 1, 0]])
    scores = np.array([[0.8, 0.8, 0.3, 0.1]])
    means, rows = ranking_metrics(truth, scores)
    np.testing.assert_allclose(list(means.values()), [0.5, 7 / 12, 3])
    ordinary = [
        label_ranking_loss(truth, scores),
        label_ranking_average_precision_score(truth, scores),
        coverage_error(truth, scores),
    ]
    np.testing.assert_allclose(list(means.values()), ordinary)
    print("Tied score objects: rank loss / LRAP / coverage:", means, rows)
    for y in (np.zeros((1, 4)), np.ones((1, 4))):
        print("Empty or all-positive row:", ranking_metrics(y, scores)[0])
    observation_y = np.array([[1, 0], [0, 1], [1, 1], [0, 0]])
    observation_s = np.array([[0.8, 0.2], [0.8, 0.9], [0.3, 0.2], [0.1, 0.1]])
    axes = ap_axes(observation_y, observation_s)
    for axis in ("macro", "micro", "samples"):
        np.testing.assert_allclose(
            axes[axis],
            average_precision_score(observation_y, observation_s, average=axis),
        )
    print("AP across observation/output axes:", axes)
    print(
        "One-output tied-threshold AP trace:",
        step_average_precision(observation_y[:, 0], observation_s[:, 0]),
    )
    print(
        "Row-normalized expected ranking counterexample:",
        normalized_ranking_counterexample(),
    )

    x = np.array(
        [[-2, 0], [-1, 1], [-1, -1], [0, 0], [0, 1], [1, -1], [1, 1], [2, 0]],
        dtype=float,
    )
    y = np.array(
        [
            [1, 0, 0],
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0],
            [1, 0, 1],
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 1],
        ]
    )
    fitted = fit_pair_ranker(x, y)
    design, signs = fitted["pair_design"], fitted["signs"]
    coefficient = fitted["weights"].T.ravel()
    library = fitted["library"].coef_.ravel()
    np.testing.assert_allclose(coefficient, library, atol=2e-6)
    _, gradient = squared_hinge_objective(design, signs, coefficient, 0.2)
    changed = coefficient + 0.07
    _, analytic = squared_hinge_objective(design, signs, changed, 0.2)
    numeric = np.zeros_like(changed)
    for j in range(len(changed)):
        plus = changed.copy()
        minus = changed.copy()
        plus[j] += 1e-6
        minus[j] -= 1e-6
        numeric[j] = (
            squared_hinge_objective(design, signs, plus, 0.2)[0]
            - squared_hinge_objective(design, signs, minus, 0.2)[0]
        ) / 2e-6
    np.testing.assert_allclose(analytic, numeric, atol=1e-9)
    np.testing.assert_allclose(
        squared_hinge_objective(design, signs, changed, 0.2)[0],
        squared_hinge_objective(design[::2], signs[::2], changed, 0.2)[0],
    )
    print(
        "Signed pair design dimensions / C / steps / stationarity:",
        design.shape,
        fitted["C"],
        fitted["steps"],
        float(np.max(abs(gradient))),
    )
    print("Every pair source/blocks/signed rows:", fitted["trace"])
    print("Scratch weights:", fitted["weights"].tolist())
    print(
        "Library coefficient max difference:", float(np.max(abs(coefficient - library)))
    )
    print(
        "Changed squared-hinge gradient max error:",
        float(np.max(abs(analytic - numeric))),
    )
    print(
        "New fitted query rank scores:", ranker_scores(fitted, [[0.5, 0.25]]).tolist()
    )

    model = fit_virtual_label_ranker(x, y, ("A", "B", "C"))
    served = serve_virtual_label_ranker(model, [[0.5, 0.25], [-1.0, 0.0]])
    print(
        "CLR complete trained comparison/source rows:",
        [
            dict(a=p["a"], b=p["b"], rows=p["training_rows"], kind=p["model"]["kind"])
            for p in model["models"]
        ],
    )
    print(
        "CLR query votes / strict-above-virtual outputs:",
        served["votes"].tolist(),
        served["prediction"].tolist(),
    )
    print("CLR each query comparison:", served["contributions"])
    edges = {(0, 1): 1, (0, 2): -1, (0, 3): 1, (1, 2): -1, (1, 3): -1, (2, 3): 1}
    votes = tournament_votes(4, edges)
    np.testing.assert_array_equal(votes, [2, 0, 3, 1])
    print(
        "Reference A/B/C/V tournament / strict decisions:",
        votes.tolist(),
        (votes[:3] > votes[3]).astype(int).tolist(),
    )
    edges[(0, 1)] = -1
    changed_votes = tournament_votes(4, edges)
    print(
        "Changed A/B comparison; ties at V excluded:",
        changed_votes.tolist(),
        (changed_votes[:3] > changed_votes[3]).astype(int).tolist(),
    )
    cycle = {(0, 1): 1, (0, 2): -1, (1, 2): 1}
    print("Three-label cycle has equal votes:", tournament_votes(3, cycle).tolist())
    degenerate = fit_virtual_label_ranker(
        [[-1.0], [1.0]], [[1, 0, 0], [1, 0, 0]], ("A", "B", "C")
    )
    result = serve_virtual_label_ranker(degenerate, [[0.0]])
    assert any(pair["model"]["kind"] == "neutral" for pair in degenerate["models"])
    assert any(pair["model"]["kind"] == "constant" for pair in degenerate["models"])
    print(
        "Supported constant and absent-discordance neutral comparisons:",
        [pair["model"]["kind"] for pair in degenerate["models"]],
        result["votes"].tolist(),
        result["prediction"].tolist(),
    )


if __name__ == "__main__":
    main()
