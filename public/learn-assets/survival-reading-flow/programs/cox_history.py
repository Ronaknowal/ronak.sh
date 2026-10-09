"""First-event Cox terms for predictable, nonoverlapping (start, stop] rows.

Reuse the actual section8 positive centered-moment merge. Sorted boundary
operations update an active binary tree; never subtract large raw moments.
One dense evaluation costs O(n log(n) p² + e p²), retaining O(n p²) tree
state plus O(n p) inputs. Event trace storage costs O(g p²). No strata,
case weights, recurrent-event inference, interval censoring or import work.
"""

from dataclasses import dataclass
from math import fsum, isfinite, log
import numpy as np

from cox_risk_moments import RiskMoments, merge_moments
from cox_baseline import CoxBaseline
from cox_regression import CoxFit, CoxIteration


@dataclass(frozen=True)
class HistoryData:
    ids: tuple
    start: np.ndarray
    stop: np.ndarray
    event: np.ndarray
    features: np.ndarray
    origin: np.ndarray
    boundaries: tuple


def prepare_history(ids, start, stop, event, features):
    """Keep original row coordinates; reject overlap and any post-first-event row."""
    ids = tuple(ids)
    a, b, x = (np.array(v, dtype=float, copy=True) for v in (start, stop, features))
    d = np.array(event, copy=True)
    n = len(ids)
    if not n or a.shape != (n,) or b.shape != (n,) or d.shape != (n,) or d.dtype.kind != 'b':
        raise ValueError('Require nonempty IDs, bounds and Boolean events of equal length.')
    if x.ndim != 2 or x.shape[0] != n or not x.shape[1]:
        raise ValueError('Require one finite feature row per interval.')
    if not all(np.isfinite(v).all() for v in (a, b, x)) or (a < 0).any() or (b <= a).any():
        raise ValueError('Use finite nonnegative start < stop and finite features.')
    subject_rows = {}
    for index, subject in enumerate(ids):
        if subject is None:
            raise ValueError('Each row needs an observed subject ID.')
        subject_rows.setdefault(subject, []).append(index)
    for rows in subject_rows.values():
        ordered = sorted(rows, key=lambda i: a[i])
        for left, right in zip(ordered, ordered[1:]):
            if b[left] > a[right] or d[left]:
                raise ValueError('Subject intervals may not overlap or continue after a first event.')
    origin = x[0].copy()
    with np.errstate(over='ignore', invalid='ignore'):
        x -= origin
    if not np.isfinite(x).all():
        raise FloatingPointError('Feature differences exceed the numeric range.')
    # All boundary operations are prepared once, independently of beta.
    starts, stops = {}, {}
    for i in range(n):
        starts.setdefault(float(a[i]), []).append(i)
        stops.setdefault(float(b[i]), []).append(i)
    boundaries = tuple((t, tuple(stops.get(t, ())), tuple(starts.get(t, ())))
                       for t in sorted(set(starts) | set(stops)))
    for v in (a, b, d, x, origin):
        v.setflags(write=False)
    return HistoryData(ids, a, b, d, x, origin, boundaries)


def active_rows(data, time):
    """O(n) inspection of one pictured roster, not the objective's inner loop."""
    time = float(time)
    if not isfinite(time) or time < 0:
        raise ValueError('Use a finite nonnegative clock.')
    return np.flatnonzero((data.start < time) & (time <= data.stop))


class ActiveMoments:
    """A leaf has one active interval or no mass; parents merge positive children."""
    def __init__(self, rows):
        self.capacity = 1 << (rows - 1).bit_length()
        self.nodes = [None] * (2 * self.capacity)

    def set(self, row, moments):
        node = self.capacity + row
        self.nodes[node] = moments
        while node > 1:
            node //= 2
            self.nodes[node] = merge_moments(self.nodes[2 * node], self.nodes[2 * node + 1])

    @property
    def root(self):
        return self.nodes[1]


@dataclass(frozen=True)
class HistoryStep:
    time: float
    failures: int
    log_denominator: float
    mean: np.ndarray
    covariance: np.ndarray
    log_breslow_increment: float


@dataclass(frozen=True)
class HistoryTerms:
    log_likelihood: float
    score: np.ndarray
    information: np.ndarray
    steps: tuple


def history_terms(beta, data, *, ties='efron', trace=False):
    """Observe the boundary BEFORE removals/updates; starts at that time wait."""
    if not isinstance(data, HistoryData) or ties not in ('efron', 'breslow'):
        raise ValueError('Supply prepared history and Efron/Breslow coefficient ties.')
    beta = np.asarray(beta, dtype=float)
    p = data.features.shape[1]
    if beta.shape != (p,) or not np.isfinite(beta).all():
        raise ValueError('Supply one finite coefficient per feature.')
    with np.errstate(over='ignore', invalid='ignore'):
        scores = data.features @ beta
    if not np.isfinite(scores).all():
        raise FloatingPointError('Linear scores exceed the numeric range.')
    zero = np.zeros((p, p))
    leaves = [RiskMoments(float(s), 1., row, zero) for s, row in zip(scores, data.features)]
    tree = ActiveMoments(len(scores))
    parts, steps = [], []
    score, information = np.zeros(p), np.zeros((p, p))
    for time, ending, starting in data.boundaries:
        deaths = tuple(i for i in ending if data.event[i])
        count = len(deaths)
        if count:
            full = tree.root
            if full is None:
                raise ValueError('An observed event has no active risk mass.')
            death_pool = None
            for i in deaths:
                death_pool = merge_moments(death_pool, leaves[i])
            # Remove deaths to form a POSITIVE nondeath pool, never total-minus-death.
            if ties == 'efron':
                for i in deaths:
                    tree.set(i, None)
            numerator = fsum(float(scores[i] - full.log_scale) for i in deaths)
            score += data.features[list(deaths)].sum(axis=0)
            value = numerator
            for k in range(count):
                if ties == 'breslow':
                    pool = full
                else:
                    fraction = 1. - k / count
                    remaining = RiskMoments(death_pool.log_scale, death_pool.mass * fraction,
                                            death_pool.mean, death_pool.covariance)
                    pool = merge_moments(tree.root, remaining)
                value -= (pool.log_scale - full.log_scale) + log(pool.mass)
                score -= pool.mean
                information += pool.covariance
            parts.append(value)
            if trace:
                denominator = full.log_scale + log(full.mass)
                steps.append(HistoryStep(time, count, denominator, full.mean.copy(),
                                         full.covariance.copy(), log(count) - denominator))
        # stop==time contributes to events at time, then leaves. start==time
        # becomes eligible only for a later event, including adjacent updates.
        for i in ending:
            tree.set(i, None)
        for i in starting:
            tree.set(i, leaves[i])
    value = fsum(parts)
    if not isfinite(value) or not np.isfinite(score).all() or not np.isfinite(information).all():
        raise FloatingPointError('Accumulated terms exceed the numeric range.')
    for v in (score, information):
        v.setflags(write=False)
    return HistoryTerms(value, score, information, tuple(steps))


def history_baseline(beta, data, *, feature_names, reference=None):
    """Explicit Breslow baseline; membership equals the coefficient evaluator's."""
    beta = np.array(beta, dtype=float, copy=True)
    names = tuple(feature_names)
    if len(names) != data.features.shape[1] or len(set(names)) != len(names) or any(not isinstance(v, str) or not v for v in names):
        raise ValueError('Supply unique nonempty feature names in order.')
    ref = data.origin.copy() if reference is None else np.array(reference, dtype=float, copy=True)
    if ref.shape != data.origin.shape or not np.isfinite(ref).all():
        raise ValueError('Reference must match the feature schema.')
    terms = history_terms(beta, data, trace=True)
    shift = float((ref - data.origin) @ beta)
    times = np.array([s.time for s in terms.steps])
    increments = np.array([s.log_breslow_increment + shift for s in terms.steps])
    cumulative = np.logaddexp.accumulate(increments)
    if not isfinite(shift) or not np.isfinite(increments).all():
        raise FloatingPointError('Baseline reference exceeds the numeric range.')
    for v in (times, increments, cumulative, beta, ref):
        v.setflags(write=False)
    return CoxBaseline(times, increments, cumulative, beta, ref, names, float(data.stop.max()), 'breslow')


def history_path_survival(baseline, start, stop, features, query_times, *, feature_names):
    """Conditional survival after the first path start for ONE prescribed path.

    Baseline events at the path start are excluded. All intervals must abut:
    unknown gaps/future covariate values cannot be invented. Sorted path/event
    sweep costs O(m + a*p + q log(m)), after sorting q queries if necessary;
    output and cumulative event state cost O(m+q), path input O(a*p).
    """
    a, b, x, q = (np.asarray(v, dtype=float) for v in (start, stop, features, query_times))
    if tuple(feature_names) != baseline.feature_names or a.ndim != 1 or not len(a) or b.shape != a.shape:
        raise ValueError('Match the baseline schema and nonempty path intervals.')
    if x.shape != (len(a), len(baseline.beta)) or q.ndim != 1 or not len(q):
        raise ValueError('Supply one feature row per path interval and query times.')
    if not all(np.isfinite(v).all() for v in (a, b, x, q)) or a[0] < 0 or (b <= a).any() or (a[1:] != b[:-1]).any():
        raise ValueError('Require a contiguous finite ordered prescribed path.')
    if (q < a[0]).any() or (q > b[-1]).any() or (q > baseline.support_end).any():
        raise ValueError('Queries must stay within path and observed baseline support.')
    selected = (baseline.event_times > a[0]) & (baseline.event_times <= max(q))
    times = baseline.event_times[selected]
    log_steps = baseline.log_increments[selected].copy()
    with np.errstate(over='ignore', invalid='ignore'):
        relative_scores = (x - baseline.reference) @ baseline.beta
    if not np.isfinite(relative_scores).all():
        raise FloatingPointError('Path feature scores exceed the numeric range.')
    row = 0
    for j, time in enumerate(times):
        while time > b[row]:
            row += 1
        log_steps[j] += float(relative_scores[row])
    if not np.isfinite(log_steps).all():
        raise FloatingPointError('Path increments exceed the numeric range.')
    total = np.logaddexp.accumulate(log_steps)
    positions = np.searchsorted(times, q, side='right') - 1
    log_h = np.full(q.shape, -np.inf)
    known = positions >= 0
    log_h[known] = total[positions[known]]
    with np.errstate(over='ignore', under='ignore'):
        log_s = -np.exp(log_h)
        survival = np.exp(log_s)
    return {'log_cumulative_hazard': log_h, 'log_survival': log_s,
            'survival': survival, 'rounded_to_zero': survival == 0}


def fit_history_cox(data, *, initial=None, ties='efron', alpha=0., max_steps=100, tolerance=1e-8):
    """Dense damped Newton counterpart of section8, using active history terms.

    Reuse CoxFit/CoxIteration result types. A small gradient is a stationary
    candidate, not a finite-MLE existence certificate; no uncertainty output.
    """
    if not isfinite(alpha) or alpha < 0 or not isfinite(tolerance) or tolerance <= 0 or isinstance(max_steps, bool) or not isinstance(max_steps, int) or max_steps < 1:
        raise ValueError('Use nonnegative penalty, positive tolerance and integer budget.')
    p = data.features.shape[1]
    beta = np.zeros(p) if initial is None else np.array(initial, dtype=float, copy=True)
    if beta.shape != (p,) or not np.isfinite(beta).all():
        raise ValueError('Initial coefficients must match the features.')
    history = []

    def evaluate(at):
        terms = history_terms(at, data, ties=ties)
        value = -terms.log_likelihood + alpha * float(at @ at) / 2
        gradient = -terms.score + alpha * at
        curvature = terms.information + alpha * np.eye(p)
        if not isfinite(value) or not np.isfinite(gradient).all() or not np.isfinite(curvature).all():
            raise FloatingPointError('Penalized terms exceed the numeric range.')
        return value, gradient, curvature

    def result(status, value, gradient):
        answer = beta.copy()
        answer.setflags(write=False)
        return CoxFit(answer, status, value, float(np.linalg.norm(gradient, ord=np.inf)), tuple(history))

    for iteration in range(max_steps):
        value, gradient, curvature = evaluate(beta)
        if not data.event.any():
            return result('no_event_information', value, gradient)
        if np.linalg.norm(beta, ord=np.inf) >= 30:
            return result('coefficient_growth_not_certified', value, gradient)
        eigen = np.linalg.eigvalsh(curvature)
        if eigen[0] <= 1e-12 * max(float(eigen[-1]), 1.):
            return result('insufficient_curvature_not_certified', value, gradient)
        if np.linalg.norm(gradient, ord=np.inf) <= tolerance:
            return result('penalized_stationary' if alpha else 'unpenalized_stationary_candidate', value, gradient)
        direction = np.linalg.solve(curvature, -gradient)
        size = float(np.linalg.norm(direction, ord=np.inf))
        if size > 2:
            direction *= 2 / size
        slope = float(gradient @ direction)
        if not isfinite(slope) or slope >= 0:
            return result('invalid_descent_direction', value, gradient)
        fraction, accepted, rejected = 1., None, 0
        for _ in range(40):
            trial = beta + fraction * direction
            try:
                trial_value = evaluate(trial)[0]
            except FloatingPointError:
                trial_value = float('inf')
            if trial_value <= value + 1e-4 * fraction * slope:
                accepted = fraction
                break
            fraction /= 2
            rejected += 1
        history.append(CoxIteration(iteration, value, float(np.linalg.norm(gradient, ord=np.inf)), tuple(beta), tuple(direction), accepted, rejected))
        if accepted is None:
            return result('line_search_exhausted', value, gradient)
        beta = trial
    value, gradient, _ = evaluate(beta)
    return result('iteration_budget_exhausted', value, gradient)
