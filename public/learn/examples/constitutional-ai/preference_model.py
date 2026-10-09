"""Train a tiny scalar reward head on explicitly constructed soft labels.

Run: python -m pip install numpy==2.3.5
     python preference_model.py
The feature rows and label generator are supplied, not semantic model judgments.
This program establishes the preference-learning computation, not CAI efficacy.
"""
import json
import numpy as np


def sigmoid(logits):
    return np.exp(-np.logaddexp(0.0, -np.asarray(logits, dtype=float)))


def preference_loss(weights, feature_a, feature_b, targets, l2=0.0):
    weights = np.asarray(weights, dtype=float)
    difference = np.asarray(feature_a, dtype=float) - np.asarray(feature_b, dtype=float)
    targets = np.asarray(targets, dtype=float)
    if difference.ndim != 2 or difference.shape[1] != len(weights):
        raise ValueError("Expected [pairs, features] arrays and [features] weights.")
    if targets.shape != (len(difference),) or not len(targets):
        raise ValueError("Supply one target probability per nonempty pair.")
    if not (np.all(np.isfinite(difference)) and np.all(np.isfinite(weights))
            and np.all(np.isfinite(targets)) and np.all((0 <= targets) & (targets <= 1))):
        raise ValueError("Features/weights must be finite, targets in [0, 1].")
    if l2 < 0:
        raise ValueError("The L2 coefficient must be nonnegative.")
    logits = difference @ weights
    # softplus(logit) - q*logit is stable soft-label binary cross entropy.
    loss = np.mean(np.logaddexp(0.0, logits) - targets * logits)
    loss += 0.5 * l2 * np.dot(weights, weights)
    gradient = difference.T @ (sigmoid(logits) - targets) / len(targets) + l2 * weights
    return float(loss), gradient, sigmoid(logits)


def fit(feature_a, feature_b, targets, steps=400, rate=0.4):
    weights = np.zeros(np.asarray(feature_a).shape[1], dtype=float)
    history = []
    for step in range(steps):
        loss, gradient, _ = preference_loss(weights, feature_a, feature_b, targets)
        if step in (0, 1, steps - 1):
            history.append({"step": step, "loss_before_update": loss})
        weights -= rate * gradient
    return weights, history


def finite_difference(weights, feature_a, feature_b, targets, epsilon=1e-6):
    numerical = np.zeros_like(weights)
    for index in range(len(weights)):
        change = np.zeros_like(weights)
        change[index] = epsilon
        plus = preference_loss(weights + change, feature_a, feature_b, targets)[0]
        minus = preference_loss(weights - change, feature_a, feature_b, targets)[0]
        numerical[index] = (plus - minus) / (2 * epsilon)
    return numerical


def main():
    # Supplied attributes: privacy preserved, useful contact alternative, honest limit.
    features = np.array([[0, 1, 1], [1, 0, 1], [1, 1, 1], [1, .5, .8]], dtype=float)
    a = features[[2, 2, 1, 3]]
    b = features[[0, 1, 0, 1]]
    generator_weights = np.array([1.0, .7, .3])
    targets = sigmoid((a - b) @ generator_weights)
    weights, history = fit(a, b, targets)
    final_loss, gradient, probabilities = preference_loss(weights, a, b, targets)
    heldout_a = np.array([[.8, .8, 1]])
    heldout_b = np.array([[.3, .4, .7]])
    heldout_target = sigmoid((heldout_a - heldout_b) @ generator_weights)
    heldout_loss, _, heldout_prediction = preference_loss(weights, heldout_a, heldout_b, heldout_target)
    fixture_loss, fixture_gradient, fixture_probability = preference_loss(
        np.array([1.0]), np.array([[1.0]]), np.array([[0.0]]), np.array([.75]))
    numerical = finite_difference(weights, a, b, targets)
    result = {
        "origin": "supplied feature vectors and synthetic logistic targets",
        "feature_names": ["privacy_preserved", "useful_alternative", "honest_limit"],
        "feature_rows": features.tolist(), "pairs": 4, "responses": 4,
        "generator_weights": generator_weights.tolist(), "targets": targets.tolist(),
        "fitted_weights": weights.tolist(), "history": history,
        "final_train_loss": final_loss, "train_probabilities": probabilities.tolist(),
        "heldout_pairs": 1, "heldout_target": heldout_target.tolist(),
        "heldout_probability": heldout_prediction.tolist(), "heldout_loss": heldout_loss,
        "fixture": {"loss": fixture_loss, "gradient": fixture_gradient.tolist(),
                    "probability": fixture_probability.tolist()},
        "gradient_max_difference": float(np.max(np.abs(numerical - gradient))),
        "limit": "The heldout toy shares its known label generator; no real safety generalization is measured.",
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
