"""Explicit token clocks, client-event proxies and offered-cohort metrics.

All times in one RequestTrace are seconds on its named local clock. An adapter
must not put server timestamps beside client timestamps without synchronization.
token_times is available only when every emitted token has a corresponding
timestamp. Content events can contain zero, one or many tokens instead.
"""
from collections import Counter
from dataclasses import dataclass
import json
import math
from statistics import mean


def time_value(value, name):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f'{name} must be a finite nonnegative number')
    if not math.isfinite(value) or value < 0:
        raise ValueError(f'{name} must be a finite nonnegative number')
    return float(value)


def ordered_times(values, name, earliest):
    if not isinstance(values, tuple):
        raise ValueError(f'{name} must be an immutable tuple')
    previous = earliest
    for value in values:
        value = time_value(value, name)
        if value < previous:
            raise ValueError(f'{name} is out of order or precedes arrival/start')
        previous = value


@dataclass(frozen=True)
class RequestTrace:
    request_id: str
    clock_domain: str
    arrival: float
    admitted: float | None = None
    start: float | None = None
    content_event_times: tuple[float, ...] = ()
    token_times: tuple[float, ...] | None = None
    terminal: float | None = None
    outcome: str = 'pending'
    quality_pass: bool | None = None

    def __post_init__(self):
        for name in ('request_id', 'clock_domain'):
            value = getattr(self, name)
            if not isinstance(value, str) or not value.strip():
                raise ValueError(f'{name} must be a nonempty string')
        time_value(self.arrival, 'arrival')
        previous = self.arrival
        for name in ('admitted', 'start'):
            value = getattr(self, name)
            if value is not None:
                time_value(value, name)
                if value < previous:
                    raise ValueError(f'{name} precedes its earlier boundary')
                previous = value
        if self.start is not None and self.admitted is None:
            raise ValueError('a known start needs a known admission boundary')
        ordered_times(self.content_event_times, 'content events', previous)
        if self.token_times is not None:
            ordered_times(self.token_times, 'token clocks', previous)
        if self.outcome not in {'pending', 'completed', 'rejected', 'canceled', 'error'}:
            raise ValueError('unknown outcome')
        if self.quality_pass is not None and type(self.quality_pass) is not bool:
            raise ValueError('quality_pass is true, false or unavailable')
        if (self.terminal is None) != (self.outcome == 'pending'):
            raise ValueError('terminal time and terminal outcome must agree')
        if self.terminal is not None:
            time_value(self.terminal, 'terminal')
            last = max((previous, *self.content_event_times, *(self.token_times or ())))
            if self.terminal < last:
                raise ValueError('terminal precedes an observed event')
        if self.outcome == 'rejected' and (
            self.admitted is not None or self.content_event_times or self.token_times
        ):
            raise ValueError('rejected means never admitted or producing output')


def from_dict(row):
    """JSON boundary: preserve missing token correspondence as None."""
    if not isinstance(row, dict):
        raise ValueError('trace must be an object')
    values = dict(row)
    for name in ('content_event_times', 'token_times'):
        if name in values and values[name] is not None:
            if not isinstance(values[name], (list, tuple)):
                raise ValueError(f'{name} must be an array')
            values[name] = tuple(values[name])
    return RequestTrace(**values)


def request_metrics(trace, cutoff=None):
    """Describe events observed through cutoff; future completion is censored."""
    if not isinstance(trace, RequestTrace):
        raise TypeError('expected RequestTrace')
    if cutoff is None:
        cutoff = math.inf
    else:
        cutoff = time_value(cutoff, 'cutoff')
    if cutoff < trace.arrival:
        raise ValueError('cutoff precedes this request arrival')
    content = tuple(t for t in trace.content_event_times if t <= cutoff)
    tokens = None if trace.token_times is None else tuple(t for t in trace.token_times if t <= cutoff)
    terminal = trace.terminal if trace.terminal is not None and trace.terminal <= cutoff else None
    start = trace.start if trace.start is not None and trace.start <= cutoff else None
    admitted = trace.admitted if trace.admitted is not None and trace.admitted <= cutoff else None
    content_gaps = [b-a for a, b in zip(content, content[1:])]
    token_gaps = None if tokens is None else [b-a for a, b in zip(tokens, tokens[1:])]
    return {
        'request_id': trace.request_id,
        'clock_domain': trace.clock_domain,
        'observed_outcome': trace.outcome if terminal is not None else 'censored',
        'admitted_observed': admitted is not None,
        'queue_to_start_s': None if start is None else start-trace.arrival,
        'first_content_latency_s': None if not content else content[0]-trace.arrival,
        'last_content_latency_s': None if not content else content[-1]-trace.arrival,
        'content_events': len(content),
        'content_event_gaps_s': content_gaps,
        'mean_content_gap_proxy_s': mean(content_gaps) if content_gaps else None,
        'token_ttft_s': None if not tokens else tokens[0]-trace.arrival,
        'last_token_latency_s': None if not tokens else tokens[-1]-trace.arrival,
        'tokens_observed': None if tokens is None else len(tokens),
        'token_gaps_s': token_gaps,
        'token_tpot_s': mean(token_gaps) if token_gaps else None,
        'terminal_latency_s': None if terminal is None else terminal-trace.arrival,
        'quality_pass': trace.quality_pass if terminal is not None else None,
    }


@dataclass(frozen=True)
class SLO:
    first_output_s: float
    terminal_s: float
    first_output_clock: str = 'content_event'
    token_tpot_s: float | None = None

    def __post_init__(self):
        time_value(self.first_output_s, 'first-output SLO')
        time_value(self.terminal_s, 'terminal SLO')
        if self.first_output_clock not in {'content_event', 'token'}:
            raise ValueError('choose content_event or token for first-output SLO')
        if self.token_tpot_s is not None:
            time_value(self.token_tpot_s, 'TPOT SLO')


def cohort_metrics(traces, window_start, window_end, cutoff, slo):
    """Arrival cohort [start,end); goodput is good cohort outcomes/window.

    Completion may be observed through a later cutoff. This is arrival-cohort
    goodput, not the rate of every completion occurring in the time window.
    Missing quality/required clocks are unknown, never silently successful.
    """
    for name, value in [('window_start', window_start), ('window_end', window_end), ('cutoff', cutoff)]:
        time_value(value, name)
    if not window_start < window_end <= cutoff:
        raise ValueError('require window_start < window_end <= cutoff')
    if not isinstance(slo, SLO):
        raise TypeError('expected SLO')
    ids = set()
    domains = set()
    selected = []
    for trace in traces:
        if not isinstance(trace, RequestTrace):
            raise TypeError('expected RequestTrace')
        if trace.request_id in ids:
            raise ValueError('duplicate request ID')
        ids.add(trace.request_id)
        domains.add(trace.clock_domain)
        if window_start <= trace.arrival < window_end:
            selected.append(trace)
    if len(domains) > 1:
        raise ValueError('one cohort/window requires one shared clock domain')
    rows = []
    for trace in selected:
        row = request_metrics(trace, cutoff)
        first = row['token_ttft_s' if slo.first_output_clock == 'token' else 'first_content_latency_s']
        reasons = []
        if row['observed_outcome'] != 'completed':
            reasons.append(row['observed_outcome'])
        if row['quality_pass'] is not True:
            reasons.append('quality_unknown' if row['quality_pass'] is None else 'quality_failed')
        if first is None:
            reasons.append('first_output_unknown')
        elif first > slo.first_output_s:
            reasons.append('first_output_late')
        if row['terminal_latency_s'] is None:
            reasons.append('terminal_unknown')
        elif row['terminal_latency_s'] > slo.terminal_s:
            reasons.append('terminal_late')
        if slo.token_tpot_s is not None:
            if row['token_tpot_s'] is None:
                reasons.append('tpot_undefined_or_unknown')
            elif row['token_tpot_s'] > slo.token_tpot_s:
                reasons.append('tpot_late')
        rows.append({**row, 'good': not reasons, 'reasons': reasons})
    counts = Counter(row['observed_outcome'] for row in rows)
    good = sum(row['good'] for row in rows)
    offered = len(rows)
    completed = counts['completed']
    known_admitted = sum(r['admitted_observed'] or r['content_events'] > 0
                         or (r['tokens_observed'] or 0) > 0
                         or r['observed_outcome'] == 'completed' for r in rows)
    admission_unknown = offered-known_admitted-counts['rejected']
    return {
        'cohort': '[window_start, window_end) arrivals; terminal observed through cutoff',
        'window_start': window_start, 'window_end': window_end, 'cutoff': cutoff,
        'offered': offered, 'admitted_lower_bound': known_admitted,
        'admission_unknown': admission_unknown,
        'admitted_with_timestamp': sum(r['admitted_observed'] for r in rows),
        'completed': completed, 'good': good,
        'outcomes': {k: counts[k] for k in ['completed','rejected','canceled','error','censored']},
        'offered_success_fraction': good/offered if offered else None,
        'completed_success_fraction': good/completed if completed else None,
        'arrival_cohort_goodput_requests_per_s': good/(window_end-window_start),
        'rows': rows,
    }


def example():
    a = RequestTrace('A', 'illustrative', 0, .05, .10, (.30,.50,.70), (.30,.50,.70), .80, 'completed', True)
    b = RequestTrace('B', 'illustrative', .10, .15, .20, (.90,), None, 1.0, 'completed', True)
    c = RequestTrace('C', 'illustrative', .20, terminal=.20, outcome='rejected')
    d = RequestTrace('D', 'illustrative', .30, .31, .35, terminal=.45, outcome='canceled')
    result = cohort_metrics([a,b,c,d], 0, 2, 2, SLO(.5,1))
    # Independent worked endpoints: .30-0, (.70-.30)/2, .80-0.
    row = result['rows'][0]
    assert math.isclose(row['token_ttft_s'], .3)
    assert math.isclose(row['token_tpot_s'], .2)
    assert math.isclose(row['terminal_latency_s'], .8)
    assert (result['offered'], result['completed'], result['good']) == (4,2,1)
    assert result['offered_success_fraction'] == .25
    assert result['arrival_cohort_goodput_requests_per_s'] == .5
    assert result['rows'][1]['token_tpot_s'] is None
    return result


if __name__ == '__main__':
    print(json.dumps(example(), indent=2, allow_nan=False))
