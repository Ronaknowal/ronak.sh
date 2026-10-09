"""Typed exact/right/left/interval exponential likelihood, conditional on entry.

Reuse the section6 exact/right exposure likelihood and its closed-form fit.
This owner adds finite interval masses and left truncation. Independent entry,
censoring and ignorable inspection conditional on modeled features are assumed.
No arbitrary Weibull regression, inspection model or Turnbull fitter is hidden.
One evaluation is O(n); retained input is O(n), extra evaluation state O(1).
"""

from dataclasses import dataclass
from math import exp, expm1, fsum, isfinite, log, log1p

from exponential_observations import ExposureTotals, log_rate_terms, fit_exponential


@dataclass(frozen=True)
class Observation:
    kind: str
    lower: float
    upper: float | None = None
    entry: float = 0.


@dataclass(frozen=True)
class TypedData:
    totals: ExposureTotals
    intervals: tuple
    impossible: bool


def prepare_observations(rows):
    """Exact uses lower=time; right uses lower=last running; left uses upper.

    Left support begins at lifetime zero; finite intervals mean (lower,upper].
    Intersect with T>entry BEFORE normalizing. Impossible intersection is a
    scientific likelihood status; malformed zero-width intervals are errors.
    """
    rows = tuple(rows)
    if not rows:
        raise ValueError('Supply at least one typed observation.')
    exposures, failures, intervals, impossible = [], 0, [], False
    for row in rows:
        if not isinstance(row, Observation) or row.kind not in ('exact', 'right', 'left', 'interval'):
            raise ValueError('Use explicitly typed Observation rows.')
        l, entry = float(row.lower), float(row.entry)
        if not isfinite(l) or not isfinite(entry) or min(l, entry) < 0:
            raise ValueError('Times and entry must be finite and nonnegative.')
        if row.kind in ('exact', 'right'):
            if row.upper is not None:
                raise ValueError('Exact/right observations have no finite upper bound.')
            if l < entry or (row.kind == 'exact' and l == entry):
                impossible = True
                continue
            exposures.append(l - entry)
            failures += row.kind == 'exact'
        else:
            if row.upper is None or not isfinite(float(row.upper)):
                raise ValueError('Left/interval observations need a finite upper bound.')
            r = float(row.upper)
            if row.kind == 'left' and l != 0:
                raise ValueError('Left-censor lower support must be lifetime zero.')
            if r <= l:
                raise ValueError('An interval must have strictly positive width; use exact explicitly.')
            effective_lower = max(l, entry)
            if r <= effective_lower:
                impossible = True
                continue
            intervals.append((effective_lower - entry, r - effective_lower))
    exposure = fsum(exposures)
    if not isfinite(exposure):
        raise OverflowError('Exposure sum exceeds the supported numeric range.')
    return TypedData(ExposureTotals(len(rows), int(failures), exposure), tuple(intervals), impossible)


def log_one_minus_exp_negative(z):
    """log(1-exp(-z)), z>0; expm1 near zero, log1p in the far tail."""
    if not isfinite(z) or z <= 0:
        raise ValueError('Require a positive finite integrated interval rate.')
    return log(-expm1(-z)) if z <= log(2.) else log1p(-exp(-z))


def interval_terms(rate, offset, width):
    """Return log mass, RATE score and negative rate Hessian.

    offset is lower-entry after support intersection. The small-z series
    preserves score/curvature without subtraction or exp(z) overflow.
    """
    z = rate * width
    if not isfinite(z) or z <= 0 or not isfinite(rate * offset):
        raise FloatingPointError('Positive interval rate/exposure exceeds float support.')
    likelihood = -rate * offset + log_one_minus_exp_negative(z)
    if z < 1e-4:
        ratio = 1 - z / 2 + z * z / 12 - z**4 / 720
        curvature_ratio = 1 - z * z / 12 + z**4 / 240
        score = -offset + ratio / rate
        information = (curvature_ratio / rate) / rate
    else:
        tail = exp(-z)
        lost = -expm1(-z)
        score = -offset + width * tail / lost
        # width*tail first avoids exp(z) and a separately overflowing width².
        information = ((width * tail) / lost) * (width / lost)
    if not all(isfinite(v) for v in (likelihood, score, information)):
        raise FloatingPointError('Interval derivatives exceed float support.')
    return likelihood, score, information


def typed_exponential_terms(rate, data):
    """Sum already taught exact/right terms plus new typed interval terms."""
    rate = float(rate)
    if not isfinite(rate) or rate <= 0 or not isinstance(data, TypedData):
        raise ValueError('Use a positive finite rate and prepared typed observations.')
    if data.impossible:
        return {'status': 'impossible-observation', 'log_likelihood': -float('inf'),
                'score': None, 'information': None}
    # Existing owner supplies the exact/right log-rate likelihood. Convert its
    # score and information to RATE coordinates by the chain rule explicitly.
    if data.totals.exposure == 0 and data.totals.failures == 0:
        base_likelihood = base_score = base_information = 0.
    else:
        old = log_rate_terms(log(rate), data.totals)
        base_likelihood = old.log_likelihood
        base_score = old.score / rate
        # (I_eta + U_eta)/rate² = D/rate² algebraically. Use the count
        # directly so a huge exposure cannot cancel away small event curvature.
        base_information = (data.totals.failures / rate) / rate
    # Three streaming sums retain constant working state, beyond the input.
    values = (base_likelihood + fsum(interval_terms(rate, a, w)[0] for a, w in data.intervals),
              base_score + fsum(interval_terms(rate, a, w)[1] for a, w in data.intervals),
              base_information + fsum(interval_terms(rate, a, w)[2] for a, w in data.intervals))
    if not all(isfinite(v) for v in values):
        raise FloatingPointError('Typed totals exceed float support.')
    return dict(zip(('log_likelihood', 'score', 'information'), values), status='defined')


def fit_typed_exponential(data, *, tolerance=1e-10, max_iterations=200):
    """Bracket the monotone rate score, then safeguarded Newton/bisection.

    Mathematical boundary statuses precede numeric optimization. The finite
    interior result needs BOTH small relative bracket width and a small
    dimensionless score. A range/budget failure is not reported as convergence.
    """
    if not isinstance(data, TypedData) or not isfinite(tolerance) or tolerance <= 0 or isinstance(max_iterations, bool) or not isinstance(max_iterations, int) or max_iterations < 1:
        raise ValueError('Supply prepared data, positive tolerance and integer budget.')
    if data.impossible:
        return {'status': 'impossible-observation', 'rate': None}
    if not data.intervals:
        old = fit_exponential(data.totals)
        return {'status': old.status, 'rate': old.rate, 'log_likelihood': old.log_likelihood}
    try:
        decreasing_exposure = data.totals.exposure + fsum(a for a, _ in data.intervals)
    except OverflowError:
        return {'status': 'nonfinite-range', 'rate': None}
    if not isfinite(decreasing_exposure):
        return {'status': 'nonfinite-range', 'rate': None}
    if decreasing_exposure == 0 and data.totals.failures == 0:
        return {'status': 'infinite-rate-supremum', 'rate': None, 'log_likelihood_supremum': 0.}
    high = 1. / max(decreasing_exposure, max(w for _, w in data.intervals))
    if not isfinite(high) or high <= 0:
        return {'status': 'nonfinite-range', 'rate': None}
    low = 0.
    try:
        for _ in range(max_iterations):
            terms = typed_exponential_terms(high, data)
            if terms['score'] <= 0:
                break
            low, high = high, high * 2
            if not isfinite(high):
                return {'status': 'nonfinite-range', 'rate': None}
        else:
            return {'status': 'bracket-budget-exhausted', 'rate': None}
        current = (low + high) / 2
        for iteration in range(max_iterations):
            terms = typed_exponential_terms(current, data)
            score, information = terms['score'], terms['information']
            if score > 0:
                low = current
            else:
                high = current
            if high - low <= tolerance * current and abs(current * score) <= tolerance:
                return {'status': 'finite-interior', 'rate': current,
                        'log_likelihood': terms['log_likelihood'], 'iterations': iteration + 1,
                        'score': score, 'information': information, 'bracket': (low, high)}
            proposal = current + score / information if information > 0 else float('nan')
            current = proposal if isfinite(proposal) and low < proposal < high else low + (high - low) / 2
        return {'status': 'iteration-budget-exhausted', 'rate': None, 'bracket': (low, high)}
    except (FloatingPointError, OverflowError):
        return {'status': 'nonfinite-range', 'rate': None}
