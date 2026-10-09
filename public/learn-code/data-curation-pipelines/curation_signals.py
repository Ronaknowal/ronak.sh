"""Exact text measurements, selection, pipeline attribution and finite metrics.

Standard library. Run: python -B curation_signals.py
These transparent heuristics are policy examples, not a universal quality score.
"""
from collections import Counter
import json
import math
import unicodedata


def signals(text):
    lines = [' '.join(line.split()) for line in text.splitlines()]
    lines = [line for line in lines if line]
    counts = Counter(lines)
    duplicate_lines = sum(n - 1 for n in counts.values())
    duplicate_characters = sum((n - 1) * len(line) for line, n in counts.items())
    characters = sum(map(len, lines))
    return {'nonempty_lines': len(lines), 'line_characters': characters,
            'duplicate_lines': duplicate_lines, 'duplicate_characters': duplicate_characters,
            'duplicate_line_incidence': duplicate_lines / len(lines) if lines else None,
            'duplicate_character_share': duplicate_characters / characters if characters else None,
            'utf8_bytes': len(text.encode('utf-8')), 'whitespace_words': len(text.split()),
            'letter_characters': sum(c.isalpha() for c in text),
            'punctuation_characters': sum(unicodedata.category(c).startswith('P') for c in text)}


def select(rows, *, threshold=None, keep=None):
    if (threshold is None) == (keep is None):
        raise ValueError('Choose exactly one of threshold or exact keep count')
    if len({r['id'] for r in rows}) != len(rows) or any(not math.isfinite(r['score']) for r in rows):
        raise ValueError('Unique IDs and finite scores required')
    ranked = sorted(rows, key=lambda row: (-row['score'], row['id']))
    if keep is not None:
        if not isinstance(keep, int) or not 0 <= keep <= len(rows):
            raise ValueError('keep must be an integer within corpus size')
        return ranked[:keep]
    if not math.isfinite(threshold):
        raise ValueError('Finite threshold required')
    return [row for row in ranked if row['score'] >= threshold]


def metrics(labels, probabilities, threshold=.5, byte_counts=None):
    labels, probabilities = list(labels), list(probabilities)
    if len(labels) != len(probabilities) or any(y not in (0, 1) for y in labels):
        raise ValueError('Aligned binary labels and probabilities required')
    if any(not math.isfinite(p) or not 0 <= p <= 1 for p in probabilities):
        raise ValueError('Probabilities must be finite and in [0,1]')
    # NumPy scalar inputs are legitimate; return portable JSON-native metrics.
    labels = [int(y) for y in labels]
    probabilities = [float(p) for p in probabilities]
    byte_counts = [1] * len(labels) if byte_counts is None else list(byte_counts)
    if len(byte_counts) != len(labels) or any(n < 0 for n in byte_counts):
        raise ValueError('Aligned nonnegative byte counts required')
    decisions = [p >= threshold for p in probabilities]
    tp = sum(y == 1 and d for y, d in zip(labels, decisions))
    fp = sum(y == 0 and d for y, d in zip(labels, decisions))
    fn = sum(y == 1 and not d for y, d in zip(labels, decisions))
    tn = len(labels) - tp - fp - fn
    ratio = lambda a, b: a / b if b else None
    bins = []
    for index in range(5):
        members = [i for i, p in enumerate(probabilities) if min(int(p * 5), 4) == index]
        bins.append({'low': index / 5, 'high': (index + 1) / 5, 'count': len(members),
                     'mean_probability': sum(probabilities[i] for i in members) / len(members) if members else None,
                     'positive_fraction': sum(labels[i] for i in members) / len(members) if members else None})
    return {'tp': tp, 'fp': fp, 'fn': fn, 'tn': tn, 'count': len(labels),
            'precision': ratio(tp, tp + fp), 'recall': ratio(tp, tp + fn),
            'f1': ratio(2 * tp, 2 * tp + fp + fn),
            'brier': ratio(sum((p - y) ** 2 for p, y in zip(probabilities, labels)), len(labels)),
            'retained_records': sum(decisions), 'record_retention': ratio(sum(decisions), len(labels)),
            'retained_bytes': sum(n for n, d in zip(byte_counts, decisions) if d),
            'byte_retention': ratio(sum(n for n, d in zip(byte_counts, decisions) if d), sum(byte_counts)),
            'bins': bins}


def pipeline(rows, predicates):
    """Pure predicates see the same immutable row, including rejected rows.

    The inclusive audit deliberately evaluates every predicate. A production
    short-circuit pass can be cheaper, but does not by itself collect that audit.
    """
    if len({row['id'] for row in rows}) != len(rows):
        raise ValueError('Unique input IDs required')
    if len({name for name, _ in predicates}) != len(predicates):
        raise ValueError('Unique predicate names required')
    results = []
    for row in rows:
        failures = [name for name, predicate in predicates if not predicate(row)]
        results.append({'id': row['id'], 'kept': not failures,
                        'first_failure': failures[0] if failures else None, 'inclusive_failures': failures})
    return results


def percentile_ranks(scores):
    """Average rank for ties; empty map stays empty, singleton gets midpoint .5."""
    if any(not math.isfinite(value) for value in scores.values()):
        raise ValueError('Finite scores required')
    ordered = sorted(scores, key=lambda identifier: (scores[identifier], identifier))
    if len(ordered) < 2:
        return {identifier: .5 for identifier in ordered}
    result, start = {}, 0
    while start < len(ordered):
        end = start + 1
        while end < len(ordered) and scores[ordered[end]] == scores[ordered[start]]:
            end += 1
        average = (start + end - 1) / (2 * (len(ordered) - 1))
        for identifier in ordered[start:end]:
            result[identifier] = average
        start = end
    return result


def combine_curators(first, second, threshold, mode='union'):
    if first.keys() != second.keys() or mode not in {'union', 'intersection'}:
        raise ValueError('Same record IDs and explicit union/intersection required')
    a, b = percentile_ranks(first), percentile_ranks(second)
    operation = max if mode == 'union' else min
    return {'first_percentiles': a, 'second_percentiles': b,
            'kept': sorted(identifier for identifier in a if operation(a[identifier], b[identifier]) >= threshold)}


def stage_work(records, costs, conditional_retention):
    """Counts can be expected values; do not round them into observed counts."""
    if records < 0 or len(costs) != len(conditional_retention):
        raise ValueError('Nonnegative count and one conditional retention per stage required')
    if any(not math.isfinite(c) or c < 0 for c in costs) or any(not 0 <= r <= 1 for r in conditional_retention):
        raise ValueError('Finite nonnegative costs and retention fractions in [0,1] required')
    stages, incoming = [], records
    for cost, fraction in zip(costs, conditional_retention):
        stages.append({'incoming': incoming, 'cost_per_record': cost, 'work': incoming * cost})
        incoming *= fraction
    return {'stages': stages, 'total_work': sum(row['work'] for row in stages), 'remaining': incoming}


if __name__ == '__main__':
    rows = [{'id': 'A', 'text': 'aaaa\nb\naaaa', 'score': .8},
            {'id': 'B', 'text': 'A short\nprecise poem', 'score': .7},
            {'id': 'C', 'text': 'home\nhome\nhome', 'score': .9}]
    def nonempty_and_not_repetitive(row):
        share = signals(row['text'])['duplicate_character_share']
        return share is not None and share <= .5
    policies = [('repetition', nonempty_and_not_repetitive),
                ('score', lambda row: row['score'] >= .75)]
    print(json.dumps({'signals': {row['id']: signals(row['text']) for row in rows},
                      'top_two': [row['id'] for row in select(rows, keep=2)],
                      'audit': pipeline(rows, policies),
                      'metrics': metrics([1, 1, 0], [.8, .7, .9], .75)}, indent=2))
