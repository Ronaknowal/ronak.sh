"""Complete fixed-state metadata, serving, two-tower and graph forwards.

Run: python recommender-forward-boundaries.py
Requires NumPy/SciPy. No learned neural/graph fit, old main or ANN service runs.
"""
import hashlib
import json
import math

import numpy as np
from scipy.linalg import solve as scipy_solve


def finite(value, name, ndim):
    array = np.asarray(value, dtype=np.float64)
    if array.ndim != ndim or not np.isfinite(array).all():
        raise ValueError(f'{name} requires a finite {ndim}-dimensional array')
    return array


def metadata_projection(features, item_factors, new_features, penalty):
    x, q = finite(features, 'X', 2), finite(item_factors, 'Q', 2)
    new = finite(new_features, 'new features', 1)
    if x.shape[0] != q.shape[0] or x.shape[1] != new.size or min(x.shape) < 1 or q.shape[1] < 1:
        raise ValueError('X/Q/new-feature entity and feature dimensions disagree')
    if penalty < 0 or not math.isfinite(penalty):
        raise ValueError('penalty must be finite and nonnegative')
    a = x.T@x + penalty*np.eye(x.shape[1])
    b = x.T@q
    if np.linalg.matrix_rank(a) < a.shape[0]:
        return {'available': False, 'reason': 'nonunique metadata ridge map', 'A': a, 'b': b}
    w = scipy_solve(a, b, assume_a='pos')
    augmented_x = np.vstack((x, math.sqrt(penalty)*np.eye(x.shape[1])))
    augmented_q = np.vstack((q, np.zeros((x.shape[1], q.shape[1]))))
    independent, _, rank, _ = np.linalg.lstsq(augmented_x, augmented_q, rcond=None)
    return {'available': True, 'A': a, 'b': b, 'W': w, 'newQ': new@w,
            'augmentedRank': int(rank),
            'solverDifferenceInfinity': float(np.max(np.abs(w-independent)))}


def state_identity(item_ids, factors, version):
    factors = finite(factors, 'item factors', 2)
    if factors.shape[0] != len(item_ids) or len(set(item_ids)) != len(item_ids) or not version:
        raise ValueError('unique item IDs and declared encoder/state version required')
    payload = {'itemIDs': list(item_ids), 'Q': factors.tolist(), 'version': str(version)}
    encoded = json.dumps(payload, sort_keys=True, separators=(',', ':'), allow_nan=False).encode('utf-8')
    return hashlib.sha256(encoded).hexdigest()


def serving_slate(catalogue, factors, user, request_time, known_events, candidate_ids,
                  slots, category_cap, state_version, required_version):
    """Eligibility precedes scores. The quota scans that same stable score order."""
    q, p = finite(factors, 'Q', 2), finite(user, 'p', 1)
    ids = [row['id'] for row in catalogue]
    if q.shape != (len(ids), len(p)) or not p.size or len(ids) != len(set(ids)):
        raise ValueError('catalogue/Q/p mapping or dimensions disagree')
    if len(candidate_ids) != len(set(candidate_ids)) or not set(candidate_ids) <= set(ids):
        raise ValueError('candidate IDs must be unique known catalogue identities')
    if slots < 1 or category_cap < 1 or not math.isfinite(request_time):
        raise ValueError('positive slot/cap counts and finite request time required')
    for row in catalogue:
        if not math.isfinite(row['release']):
            raise ValueError('every item needs its actual finite release time')
    for event in known_events:
        if event['item'] not in ids or not math.isfinite(event['time']):
            raise ValueError('each history occurrence requires known ID and finite time')
    if state_version != required_version:
        return {'available': False, 'reason': 'stale item state/encoder version', 'scores': None}
    history = [event for event in known_events if event['time'] <= request_time]
    purchased = {event['item'] for event in history}
    candidates = set(candidate_ids)
    trace = []
    eligible = []
    for position, item in enumerate(catalogue):
        reasons = []
        if item['id'] not in candidates:
            reasons.append('outside candidate subset')
        if item['release'] > request_time:
            reasons.append('not released at request')
        if item['id'] in purchased:
            reasons.append('known past purchase excluded by discovery rule')
        entry = {'id': item['id'], 'row': position, 'category': item['category'],
                 'excludedBy': reasons, 'score': float(p@q[position]) if not reasons else None}
        trace.append(entry)
        if not reasons:
            eligible.append(entry)
    order = sorted(eligible, key=lambda row: (-row['score'], row['id']))
    category_counts = {}
    issued, quota_trace = [], []
    for row in order:
        kept = len(issued) < slots and category_counts.get(row['category'], 0) < category_cap
        quota_trace.append({'id': row['id'], 'kept': kept,
                            'reason': 'selected' if kept else ('all slots filled' if len(issued) >= slots else 'category cap')})
        if kept:
            issued.append(row['id'])
            category_counts[row['category']] = category_counts.get(row['category'], 0) + 1
    return {'available': True, 'stateID': state_identity(ids, q, state_version),
            'knownHistoryOccurrences': history, 'ignoredFutureOccurrences': len(known_events)-len(history),
            'filterTrace': trace, 'scoreOrder': [row['id'] for row in order],
            'quotaTrace': quota_trace, 'issued': issued, 'fill': len(issued)/slots}


def metric_scores(user, item_factors, item_bias=None):
    p, q = finite(user, 'p', 1), finite(item_factors, 'Q', 2)
    if q.shape[1] != p.size or not p.size:
        raise ValueError('factor widths disagree')
    biases = np.zeros(q.shape[0]) if item_bias is None else finite(item_bias, 'item bias', 1)
    if biases.shape != (q.shape[0],):
        raise ValueError('one bias per item required')
    norm_p, norm_q = np.linalg.norm(p), np.linalg.norm(q, axis=1)
    cosine = [float(p@row/(norm_p*norm)) if norm_p and norm else None for row, norm in zip(q, norm_q)]
    augmented = np.column_stack((q, biases)) @ np.concatenate((p, [1.]))
    return {'dot': q@p, 'cosine': cosine, 'biasedDot': q@p+biases, 'augmentedDot': augmented}


def two_tower_prefix(history, item_features, item_ids, request_time, item_weights,
                     user_weights, context, context_weights, encoder_version, cache_version):
    x, wi = finite(item_features, 'item features', 2), finite(item_weights, 'item encoder', 2)
    wu, wc = finite(user_weights, 'history encoder', 2), finite(context_weights, 'context encoder', 2)
    c = finite(context, 'current context', 1)
    if x.shape[0] != len(item_ids) or len(set(item_ids)) != len(item_ids):
        raise ValueError('unique feature-row item IDs required')
    if wi.shape[0] != x.shape[1] or wu.shape != wi.shape or wc.shape != (len(c), wi.shape[1]):
        raise ValueError('history/item/context encoder shapes disagree')
    if encoder_version != cache_version:
        return {'available': False, 'reason': 'cached item vector belongs to another encoder version'}
    mapping = {item: index for index, item in enumerate(item_ids)}
    if any(event['item'] not in mapping or not math.isfinite(event['time']) for event in history):
        raise ValueError('each occurrence needs a known item ID and finite time')
    prefix = [event for event in history if event['time'] <= request_time]
    # Occurrences are retained; this mean is a declared encoder input rule,
    # unlike the canonical unique SVD++ history or binary graph adjacency.
    pooled = np.mean([x[mapping[event['item']]] for event in prefix], axis=0) if prefix else np.zeros(x.shape[1])
    p = pooled@wu + c@wc
    cached_q = x@wi
    return {'available': True, 'prefix': prefix, 'pooledFeatures': pooled,
            'userVector': p, 'cachedItemVectors': cached_q, 'scores': cached_q@p,
            'encoderVersion': encoder_version,
            'shapes': {'X': list(x.shape), 'Wi': list(wi.shape), 'Wu': list(wu.shape), 'Wcontext': list(wc.shape)}}


def graph_forward(interactions, initial, depth):
    r, initial = finite(interactions, 'binary R', 2), finite(initial, 'E0', 2)
    if min(r.shape) < 1 or not np.isin(r, [0., 1.]).all():
        raise ValueError('binary user-by-item adjacency required')
    if initial.shape[0] != sum(r.shape) or initial.shape[1] < 1 or not isinstance(depth, int) or not 0 <= depth <= 3:
        raise ValueError('E0 node order [users,items], positive width and depth 0–3 required')
    users, items = r.shape
    adjacency = np.block([[np.zeros((users, users)), r], [r.T, np.zeros((items, items))]])
    degrees = adjacency.sum(axis=1)
    inverse_root = np.zeros_like(degrees)
    positive = degrees > 0
    inverse_root[positive] = 1/np.sqrt(degrees[positive])
    operator = inverse_root[:, None] * adjacency * inverse_root[None, :]
    edges = [(user, users+item) for user, item in zip(*np.nonzero(r))]
    layers, products = [initial.copy()], []
    for _ in range(depth):
        old = layers[-1]
        next_by_edges = np.zeros_like(old)
        row_products = []
        for user, item in edges:
            weight = 1/math.sqrt(degrees[user]*degrees[item])
            next_by_edges[user] += weight*old[item]
            next_by_edges[item] += weight*old[user]
            row_products.append({'userNode': user, 'itemNode': item, 'weight': weight,
                                 'toUser': weight*old[item], 'toItem': weight*old[user]})
        next_by_matrix = operator@old
        error = float(np.max(np.abs(next_by_matrix-next_by_edges)))
        if error > 1e-13:
            raise AssertionError('edge and block synchronous forwards disagree')
        layers.append(next_by_edges)
        products.append({'edgeProducts': row_products, 'matrixDifferenceInfinity': error})
    mixed = np.mean(layers, axis=0)
    return {'degrees': degrees, 'operator': operator, 'layers': layers,
            'products': products, 'mixture': mixed,
            'userItemScores': mixed[:users]@mixed[users:].T,
            'zeroDegreeNodes': np.flatnonzero(~positive)}


def serialize(value):
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    raise TypeError(type(value).__name__)


def main():
    catalogue = [{'id': 'I0', 'release': 0, 'category': 'A'},
                 {'id': 'I1', 'release': 10, 'category': 'A'},
                 {'id': 'I2', 'release': 30, 'category': 'B'},
                 {'id': 'I3', 'release': 0, 'category': 'A'},
                 {'id': 'I4', 'release': 0, 'category': 'B'}]
    factors = [[1., 0.], [2., 0.], [5., 0.], [1.5, 0.], [.5, 0.]]
    history = [{'item': 'I0', 'time': 5}, {'item': 'I4', 'time': 25}]
    args = (catalogue, factors, [1., 0.], 20, history, ['I0', 'I1', 'I2', 'I3', 'I4'], 2, 1)
    slate = serving_slate(*args, 'fixed-v1', 'fixed-v1')
    if slate['issued'] != ['I1', 'I4'] or slate['ignoredFutureOccurrences'] != 1:
        raise AssertionError('release/history/score/quota pipeline changed its actual selected IDs')
    features = [[1., 0.], [0., 1.], [1., 1.]]
    projection = metadata_projection(features, [[1., 0.], [0., 1.], [2., 1.]], [1., .5], .5)
    report = {
        'scope': 'Declared fixed analytical state; no neural/graph fit or approximate retrieval service',
        'metadata': projection, 'slate': slate,
        'staleState': serving_slate(*args, 'fixed-v0', 'fixed-v1'),
        'dotVersusCosine': metric_scores([1., 0.], [[2., 2.], [1.5, 0.], [0., 0.]], [.2, -.1, 0.]),
        'twoTower': two_tower_prefix(
            [{'item': 'I0', 'time': 2}, {'item': 'I0', 'time': 4}, {'item': 'I2', 'time': 21}],
            features, ['I0', 'I1', 'I2'], 20,
            [[1., .5], [0., 1.]], [[.5, 0.], [0., 1.]], [1.], [[.2, -.1]], 'encoder-v1', 'encoder-v1'),
        'graphDepths': [graph_forward([[1, 1], [0, 1]], [[2.], [0.], [1.], [3.]], depth) for depth in range(4)],
        'graphIsolated': graph_forward([[1, 0], [0, 0]], [[2.], [7.], [1.], [3.]], 2),
        'costs': 'edge kernel O(K*E*d), plus O(K*N*d) dense buffer work; this diagnostic also discovers edges from dense input O(U*I), allocates adjacency/operator O(N^2), verifies O(K*N^2*d), retains layers O((K+1)*N*d) and products O(K*E*d), and materializes scores O(U*I*d) work/O(U*I) storage; exact dot scoring O(I*d); quota scan O(I) after O(I log I) sorting; N=U+I',
    }
    print(json.dumps(report, indent=2, default=serialize, allow_nan=False))


if __name__ == '__main__':
    main()
