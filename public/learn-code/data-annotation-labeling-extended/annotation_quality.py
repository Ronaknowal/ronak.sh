"""Sparse Dawid-Skene EM, Crowd-Kit comparison and a stratified audit.

Install numpy pandas crowd-kit. Keep relevance_labels.csv and relevance_gold.csv
beside this file. Gold labels are used ONLY after unsupervised fitting.
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd
from crowdkit.aggregation import DawidSkene, MajorityVote


def dawid_skene(data, iterations=30):
    """Observed annotation triples, not a dense task-by-worker matrix.

    Returns task IDs, label IDs, posterior, prior and [worker,observed,true]
    confusion matrices. Fixed iteration count supports an exact library parity
    experiment; convergence/multiple starts need separate assessment.
    """
    if data.empty or data[["task", "worker", "label"]].isna().any().any():
        raise ValueError("nonempty, nonmissing annotation triples required")
    if data.duplicated(["task", "worker"]).any():
        raise ValueError("one independent judgment per worker/task required")
    if not isinstance(iterations, int) or iterations < 1:
        raise ValueError("positive iteration count required")
    tasks = np.array(sorted(data.task.unique()))
    workers = np.array(sorted(data.worker.unique()))
    labels = np.array(sorted(data.label.unique()))
    ti = pd.Index(tasks).get_indexer(data.task)
    wi = pd.Index(workers).get_indexer(data.worker)
    yi = pd.Index(labels).get_indexer(data.label)
    n, w, k = len(tasks), len(workers), len(labels)
    posterior = np.zeros((n, k))
    np.add.at(posterior, (ti, yi), 1)
    posterior /= posterior.sum(axis=1, keepdims=True)
    observed = np.zeros((w, k), dtype=bool)
    observed[wi, yi] = True

    def m_step(probabilities):
        counts = np.zeros((w, k, k))
        np.add.at(counts, (wi, yi), probabilities[ti])
        # Match the library's floor only for observed worker/label rows.
        counts = np.where(observed[:, :, None], np.maximum(counts, 1e-10), 0)
        return counts / counts.sum(axis=1, keepdims=True)

    prior = posterior.mean(axis=0)
    confusion = m_step(posterior)
    for _ in range(iterations):
        log_joint = np.tile(np.log(np.maximum(prior, 1e-10)), (n, 1))
        np.add.at(log_joint, ti, np.log(confusion[wi, yi]))
        # Subtracting a per-task constant preserves its normalized probabilities.
        unnormalized = np.exp(log_joint - log_joint.max(axis=1, keepdims=True))
        posterior = unnormalized / unnormalized.sum(axis=1, keepdims=True)
        prior = posterior.mean(axis=0)
        confusion = m_step(posterior)
    return tasks, labels, posterior, prior, confusion


def binary_evidence(prior, observations):
    """Each tuple is (observed label, sensitivity, specificity).

    This assumes judgments are independent conditional on the latent label.
    The function cannot determine whether that assumption is justified.
    """
    if not np.isfinite(prior) or not 0 <= prior <= 1:
        raise ValueError("prior must be a finite probability")
    masses = [1 - prior, prior]
    for vote, sensitivity, specificity in observations:
        if vote not in (None, 0, 1) or not all(np.isfinite(p) and 0 <= p <= 1 for p in (sensitivity, specificity)):
            raise ValueError("valid binary/abstain judgment and finite probabilities required")
        if vote is None:
            continue  # missing evidence, not a negative judgment
        masses[0] *= (1 - specificity) if vote == 1 else specificity
        masses[1] *= sensitivity if vote == 1 else (1 - sensitivity)
    denominator = sum(masses)
    return None if denominator == 0 else masses[1] / denominator


def stratified_error(population_weights, audited, errors):
    weights, counts, mistakes = map(lambda v: np.asarray(v, dtype=float), (population_weights, audited, errors))
    if not (weights.ndim == counts.ndim == mistakes.ndim == 1) or not (weights.shape == counts.shape == mistakes.shape):
        raise ValueError("aligned one-dimensional inputs required")
    if not all(np.isfinite(values).all() for values in (weights, counts, mistakes)):
        raise ValueError("finite weights and counts required")
    if np.any(weights < 0) or not np.isclose(weights.sum(), 1):
        raise ValueError("aligned nonnegative weights summing to one required")
    if np.any(counts != np.floor(counts)) or np.any(mistakes != np.floor(mistakes)):
        raise ValueError("whole-number audit counts required")
    if np.any(counts < 0) or np.any(mistakes < 0) or np.any(mistakes > counts):
        raise ValueError("audit counts must satisfy 0 <= errors <= audited")
    if np.any((weights > 0) & (counts == 0)):
        return None  # population mass with no measured error rate
    rates = np.divide(mistakes, counts, out=np.zeros_like(counts), where=counts > 0)
    return float(weights @ rates)


def run(folder):
    data = pd.read_csv(folder / "relevance_labels.csv")
    gold = pd.read_csv(folder / "relevance_gold.csv").set_index("task").label
    tasks, labels, posterior, prior, confusion = dawid_skene(data)
    # Force the same 30 updates. Negative infinity disables library early stop.
    library = DawidSkene(n_iter=30, tol=-np.inf).fit(data)
    expected = library.probas_.loc[tasks, labels].to_numpy()
    error = float(np.max(np.abs(posterior - expected)))
    np.testing.assert_allclose(posterior, expected, atol=1e-9)
    np.testing.assert_allclose(confusion.sum(axis=1), 1)
    np.testing.assert_allclose(posterior.sum(axis=1), 1)
    majority = MajorityVote().fit_predict(data).loc[tasks].to_numpy()
    inferred = labels[posterior.argmax(axis=1)]
    target = gold.loc[tasks].to_numpy()
    per_worker = data.groupby("worker").size()
    assert np.isclose(binary_evidence(.5, [(1, .9, .9), (0, .6, .6)]), 6 / 7)
    assert np.isclose(binary_evidence(.5, [(1, .9, .9), (0, .6, .6), (0, .6, .6)]), .8)
    assert np.isclose(stratified_error([.8, .2], [20, 20], [2, 8]), .16)
    assert stratified_error([.8, .2], [20, 0], [2, 0]) is None
    for bad in (pd.concat([data, data.iloc[:1]]), data.iloc[:0]):
        try:
            dawid_skene(bad)
        except ValueError:
            pass
        else:
            raise AssertionError("invalid annotation evidence accepted")
    return {
        "tasks": len(tasks), "judgments": len(data), "workers": len(per_worker),
        "workers_with_one_judgment": int((per_worker == 1).sum()),
        "iterations": 30, "max_posterior_error_vs_crowdkit": error,
        "majority_accuracy_against_held_aside_gold": float(np.mean(majority == target)),
        "ds_accuracy_against_held_aside_gold": float(np.mean(inferred == target)),
        "ds_mean_max_posterior": float(posterior.max(axis=1).mean()),
        "stratified_audit_error": .16, "pooled_audit_error": .25,
        "scope": "Deterministic 500-task subset; not a population benchmark; gold excluded from fitting",
    }


if __name__ == "__main__":
    print(json.dumps(run(Path(__file__).parent), indent=2))
