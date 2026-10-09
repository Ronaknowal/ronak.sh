"""Finite-grid first-event mass and observation loss, with an explicit tail.

Cause-major logits: K rows of B event bins, then one T > tau_B tail logit.
Bins are 1..B; censor stop b means known event-free THROUGH boundary tau_b.
No training, data access, Torch dependency or execution occurs on import.
"""

from bisect import bisect_right
from dataclasses import dataclass
from math import exp, fsum, isfinite, log
from numbers import Integral


def checked_logits(logits, n_causes, n_bins):
    """Check shapes once; all arithmetic uses finite centered differences."""
    if any(isinstance(v, bool) or not isinstance(v, Integral) or v < 1
           for v in (n_causes, n_bins)):
        raise ValueError("K and B must be positive integers.")
    values = tuple(float(value) for value in logits)
    if len(values) != n_causes * n_bins + 1 or not all(map(isfinite, values)):
        raise ValueError("Supply K*B+1 finite logits, including the tail.")
    maximum = max(values)
    centered = tuple(value - maximum for value in values)
    if not all(map(isfinite, centered)):
        raise ValueError("Centered logit differences must be representable.")
    return centered


def logsumexp(values):
    """Stable log sum, including a very unlikely selected cell or subset."""
    values = tuple(values)
    maximum = max(values)
    return maximum + log(fsum(exp(value - maximum) for value in values))


def allowed_cells(cause, stop_bin, n_causes, n_bins):
    """Event: singleton; censor: every later cause/bin plus the tail."""
    if any(isinstance(v, bool) or not isinstance(v, Integral)
           for v in (cause, stop_bin)):
        raise ValueError("Cause and boundary/bin codes must be integers.")
    if cause == 0 and 0 <= stop_bin <= n_bins:
        return tuple(k * n_bins + b for k in range(n_causes)
                     for b in range(stop_bin, n_bins)) + (n_causes * n_bins,)
    if 1 <= cause <= n_causes and 1 <= stop_bin <= n_bins:
        return ((cause - 1) * n_bins + stop_bin - 1,)
    raise ValueError("Use event cause1..K/bin1..B or censor0/boundary0..B.")


@dataclass(frozen=True)
class JointOutput:
    masses: tuple[tuple[float, ...], ...]
    tail: float
    incidence: tuple[tuple[float, ...], ...]
    survival: tuple[float, ...]


def joint_output(logits, n_causes, n_bins):
    """O(KB) time/space; return CIF and survival at all B+1 boundaries."""
    centered = checked_logits(logits, n_causes, n_bins)
    normalizer = logsumexp(centered)
    probabilities = tuple(exp(value - normalizer) for value in centered)
    masses = tuple(tuple(probabilities[k * n_bins:(k + 1) * n_bins])
                   for k in range(n_causes))
    incidence = []
    for row in masses:
        cumulative = [0.0]
        for mass in row:
            cumulative.append(fsum((cumulative[-1], mass)))
        incidence.append(tuple(cumulative))
    # Sum permitted residual mass directly: avoid 1 - nearly-one incidence.
    survival = [0.0] * (n_bins + 1)
    survival[-1] = probabilities[-1]
    for b in range(n_bins - 1, -1, -1):
        survival[b] = fsum((survival[b + 1], *(row[b] for row in masses)))
    return JointOutput(masses, probabilities[-1], tuple(incidence), tuple(survival))


@dataclass(frozen=True)
class MaskLoss:
    value: float
    gradient: tuple[float, ...]
    allowed: tuple[int, ...]


def joint_mask_loss(logits, cause, stop_bin, n_causes, n_bins):
    """Negative log probability of the observation's allowed outcomes."""
    centered = checked_logits(logits, n_causes, n_bins)
    allowed = allowed_cells(cause, stop_bin, n_causes, n_bins)
    all_log = logsumexp(centered)
    selected_log = logsumexp(centered[index] for index in allowed)
    probabilities = [exp(value - all_log) for value in centered]
    gradient = probabilities.copy()
    for index in allowed:
        gradient[index] -= exp(centered[index] - selected_log)
    return MaskLoss(all_log - selected_log, tuple(gradient), allowed)


@dataclass(frozen=True)
class RankingLoss:
    value: float
    gradient: tuple[tuple[float, ...], ...]
    pairs: tuple[tuple[int, int, int, int, float], ...]


def cause_ranking_loss(logit_rows, causes, stops, n_causes, n_bins, sigma=0.5):
    """Mean exp(-CIF gap/sigma) on exact observed-first-cause comparable pairs.

    O(NKB + N log N + P) time; O(NKB + N + P) space for P pairs.
    sigma >= .01 keeps the bounded [-1,1] gap exponent representable.
    """
    rows, causes, stops = tuple(logit_rows), tuple(causes), tuple(stops)
    if not rows or len(rows) != len(causes) or len(rows) != len(stops):
        raise ValueError("Supply equal nonempty subject sequences.")
    if not isfinite(sigma) or sigma < 0.01:
        raise ValueError("Use finite sigma >= .01.")
    for cause, stop in zip(causes, stops):
        allowed_cells(cause, stop, n_causes, n_bins)
    outputs = [joint_output(row, n_causes, n_bins) for row in rows]
    # Deposit a derivative at each prefix END; reverse-scan it to all its cells.
    ends = [[[0.0] * n_bins for _ in range(n_causes)] for _ in rows]
    order = sorted(range(len(rows)), key=lambda index: stops[index])
    sorted_stops = [stops[index] for index in order]
    pairs, penalties = [], []
    for i, (cause, stop) in enumerate(zip(causes, stops)):
        if cause == 0:
            continue
        # Skip every equal/earlier clock in one search, then visit actual pairs.
        for position in range(bisect_right(sorted_stops, stop), len(rows)):
            j = order[position]
            gap = outputs[i].incidence[cause - 1][stop] - outputs[j].incidence[cause - 1][stop]
            penalty = exp(-gap / sigma)
            pairs.append((i, j, cause, stop, gap))
            penalties.append(penalty)
            slope = -penalty / sigma
            ends[i][cause - 1][stop - 1] += slope
            ends[j][cause - 1][stop - 1] -= slope
    count = len(pairs)
    gradients = []
    for output, subject in zip(outputs, ends):
        mass_gradient = []
        for row in subject:
            running = 0.0
            derivatives = [0.0] * n_bins
            for b in range(n_bins - 1, -1, -1):
                running += row[b]
                derivatives[b] = running / count if count else 0.0
            mass_gradient.extend(derivatives)
        mass_gradient.append(0.0)  # Tail does not belong to an in-grid cause CIF.
        probabilities = [p for row in output.masses for p in row] + [output.tail]
        mean_derivative = fsum(p * d for p, d in zip(probabilities, mass_gradient))
        gradients.append(tuple(p * (d - mean_derivative)
                               for p, d in zip(probabilities, mass_gradient)))
    return RankingLoss(fsum(penalties) / count if count else 0.0,
                       tuple(gradients), tuple(pairs))


def joint_batch_loss(logit_rows, causes, stops, n_causes, n_bins,
                     ranking_weight=0.0, sigma=0.5):
    """Mean subject NLL + declared weight * mean comparable-pair ranking."""
    rows, causes, stops = tuple(logit_rows), tuple(causes), tuple(stops)
    if not rows or len(rows) != len(causes) or len(rows) != len(stops):
        raise ValueError("Supply equal nonempty subject sequences.")
    if not isfinite(ranking_weight) or ranking_weight < 0:
        raise ValueError("Ranking weight must be finite and nonnegative.")
    likelihoods = [joint_mask_loss(row, cause, stop, n_causes, n_bins)
                   for row, cause, stop in zip(rows, causes, stops)]
    gradients = [tuple(value / len(rows) for value in loss.gradient)
                 for loss in likelihoods]
    mean_nll = fsum(loss.value for loss in likelihoods) / len(rows)
    if ranking_weight == 0:
        return mean_nll, tuple(gradients)
    ranking = cause_ranking_loss(rows, causes, stops, n_causes, n_bins, sigma)
    gradients = tuple(tuple(a + ranking_weight * b for a, b in zip(left, right))
                      for left, right in zip(gradients, ranking.gradient))
    return mean_nll + ranking_weight * ranking.value, gradients
