"""Safeguarded dense Cox coefficient fitting; baseline/prediction are separate.

This minimizes minus the SUM partial log likelihood plus alpha*||beta||**2/2.
The penalty is on the supplied feature coordinates; there is no fitted intercept.
An unpenalized stationary candidate is NOT a proof that a finite MLE exists.
Coefficient-growth and curvature statuses expose possible separation or scaling
problems rather than relabelling them successful convergence. No data work occurs
on import. Each dense solve costs O(p**3); each trial evaluates the sorted core.
"""

from dataclasses import dataclass
from math import isfinite

import numpy as np

from cox_risk_moments import cox_terms


@dataclass(frozen=True)
class CoxIteration:
    iteration: int
    objective: float
    score_norm: float
    beta: tuple[float, ...]
    direction: tuple[float, ...]
    accepted_fraction: float | None
    rejected_trials: int


@dataclass(frozen=True)
class CoxFit:
    beta: np.ndarray
    status: str
    objective: float
    score_norm: float
    iterations: tuple[CoxIteration, ...]


def fit_cox(
    data,
    *,
    alpha=0.0,
    ties="efron",
    initial=None,
    max_steps=80,
    max_backtracks=40,
    score_tolerance=1e-9,
    direction_limit=2.0,
    coefficient_limit=25.0,
    curvature_floor=1e-12,
):
    """Return a named outcome, not a success flag inferred from tiny steps."""
    for value, name in (
        (alpha, "alpha"),
        (score_tolerance, "score_tolerance"),
        (direction_limit, "direction_limit"),
        (coefficient_limit, "coefficient_limit"),
        (curvature_floor, "curvature_floor"),
    ):
        if isinstance(value, bool) or not isfinite(value) or value < 0:
            raise ValueError(f"{name} must be finite and nonnegative.")
    if min(score_tolerance, direction_limit, coefficient_limit, curvature_floor) == 0:
        raise ValueError("Tolerances and safety limits must be positive.")
    for value in (max_steps, max_backtracks):
        if isinstance(value, bool) or not isinstance(value, int) or value < 1:
            raise ValueError("Iteration and backtracking budgets must be positive integers.")
    p = data.features.shape[1]
    beta = np.zeros(p) if initial is None else np.array(initial, dtype=float, copy=True)
    if beta.shape != (p,) or not np.isfinite(beta).all():
        raise ValueError("Require one finite initial coefficient per feature.")
    identity = np.eye(p)
    history = []

    def evaluate(at):
        terms = cox_terms(at, data, ties=ties)
        objective = -terms.log_likelihood + alpha * float(at @ at) / 2
        gradient = -terms.score + alpha * at
        curvature = terms.information + alpha * identity
        if not isfinite(objective) or not np.isfinite(gradient).all() or not np.isfinite(curvature).all():
            raise FloatingPointError("Penalized objective exceeds the numeric range.")
        return objective, gradient, curvature

    def result(status, objective, norm):
        answer = beta.copy()
        answer.setflags(write=False)
        return CoxFit(answer, status, objective, norm, tuple(history))

    if not data.events.any():
        objective, gradient, _ = evaluate(beta)
        return result("no_event_information", objective, float(np.linalg.norm(gradient, ord=np.inf)))
    for iteration in range(max_steps):
        objective, gradient, curvature = evaluate(beta)
        norm = float(np.linalg.norm(gradient, ord=np.inf))
        if np.linalg.norm(beta, ord=np.inf) >= coefficient_limit:
            return result("coefficient_growth_not_certified", objective, norm)
        eigenvalues = np.linalg.eigvalsh(curvature)
        scale = max(float(eigenvalues[-1]), 1.0)
        if eigenvalues[0] <= curvature_floor * scale:
            return result("insufficient_curvature_not_certified", objective, norm)
        if norm <= score_tolerance:
            status = "penalized_stationary" if alpha else "unpenalized_stationary_candidate"
            return result(status, objective, norm)
        try:
            direction = np.linalg.solve(curvature, -gradient)
        except np.linalg.LinAlgError:
            return result("curvature_solve_failed", objective, norm)
        size = float(np.linalg.norm(direction, ord=np.inf))
        if size > direction_limit:
            direction *= direction_limit / size
        directional_derivative = float(gradient @ direction)
        if not isfinite(directional_derivative) or directional_derivative >= 0:
            return result("invalid_descent_direction", objective, norm)
        fraction = 1.0
        accepted = None
        rejected = 0
        for _ in range(max_backtracks):
            trial = beta + fraction * direction
            try:
                trial_objective, _, _ = evaluate(trial)
            except FloatingPointError:
                trial_objective = float("inf")
            if trial_objective <= objective + 1e-4 * fraction * directional_derivative:
                accepted = fraction
                break
            fraction /= 2
            rejected += 1
        history.append(
            CoxIteration(
                iteration,
                objective,
                norm,
                tuple(map(float, beta)),
                tuple(map(float, direction)),
                accepted,
                rejected,
            )
        )
        if accepted is None:
            return result("line_search_exhausted", objective, norm)
        beta = trial
    objective, gradient, _ = evaluate(beta)
    return result("iteration_budget_exhausted", objective, float(np.linalg.norm(gradient, ord=np.inf)))
