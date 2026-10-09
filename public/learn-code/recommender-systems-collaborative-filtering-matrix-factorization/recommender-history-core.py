"""Complete canonical unique-history SVD++ scratch model and trainer.

Run this file for changed local arithmetic only. The companion library file
runs the one declared ten-epoch scratch fit and one ordinary SVD++ fit.
"""
import copy
import json
import math

import numpy as np


def event_structure(events, users, items):
    if users < 1 or items < 1:
        raise ValueError('positive user/item table sizes are required')
    histories = [set() for _ in range(users)]
    user_count, item_count = np.zeros(users, dtype=int), np.zeros(items, dtype=int)
    for user, item, rating in events:
        if not 0 <= user < users or not 0 <= item < items or not math.isfinite(rating):
            raise ValueError('event needs valid user/item IDs and finite rating')
        histories[user].add(item)
        user_count[user] += 1
        item_count[item] += 1
    histories = [sorted(row) for row in histories]
    history_incidence = np.zeros(items, dtype=int)
    for user, row in enumerate(histories):
        history_incidence[row] += user_count[user]
    return histories, user_count, item_count, history_incidence


def initialize(events, users, items, dimensions=2, seed=23, mean=3.):
    if not isinstance(dimensions, int) or dimensions < 1 or not math.isfinite(mean):
        raise ValueError('positive factor width and finite fixed mean required')
    histories, nu, ni, tj = event_structure(events, users, items)
    rng = np.random.default_rng(seed)
    p = rng.normal(0, .1, (users, dimensions))
    q = rng.normal(0, .1, (items, dimensions))
    y = rng.normal(0, .1, (items, dimensions))
    # Unused entity coordinates have only a global positive penalty. They start
    # at its zero minimizer rather than retaining random unvisited parameters.
    p[nu == 0], q[ni == 0], y[tj == 0] = 0., 0., 0.
    return {'P': p, 'Q': q, 'Y': y, 'bu': np.zeros(users), 'bi': np.zeros(items),
            'mean': float(mean), 'histories': histories, 'nu': nu, 'ni': ni, 'tj': tj,
            'initialization': {'seed': seed, 'normalMean': 0., 'normalSD': .1,
                               'drawOrder': ['P', 'Q', 'Y'], 'biases': 'zero'}}


def representation(state, user, occurrence_history=None):
    if not 0 <= user < len(state['P']):
        raise ValueError('known user ID required for a representation')
    history = state['histories'][user] if occurrence_history is None else list(occurrence_history)
    if any(not 0 <= item < len(state['Y']) for item in history):
        raise ValueError('history item ID is outside Y')
    contribution = (state['Y'][history].sum(axis=0)/math.sqrt(len(history))
                    if history else np.zeros(state['P'].shape[1]))
    return state['P'][user] + contribution, contribution


def predict(state, user=None, item=None):
    """Unknown entities follow the named biased fallback, never borrowed rows."""
    known_user = user is not None and 0 <= user < len(state['P'])
    known_item = item is not None and 0 <= item < len(state['Q'])
    result = state['mean']
    if known_user:
        result += state['bu'][user]
    if known_item:
        result += state['bi'][item]
    if known_user and known_item:
        result += state['Q'][item] @ representation(state, user)[0]
    return float(result)


def global_objective(state, events, penalty):
    if not math.isfinite(penalty) or penalty < 0:
        raise ValueError('nonnegative finite penalty required')
    error = sum((rating-predict(state, user, item))**2 for user, item, rating in events)
    norms = sum(float(np.sum(state[name]**2)) for name in ['P', 'Q', 'Y', 'bu', 'bi'])
    return .5*error + .5*penalty*norms


def event_gradient(state, user, item, rating, penalty):
    if not math.isfinite(penalty) or penalty < 0 or not math.isfinite(rating):
        raise ValueError('finite rating/nonnegative penalty required')
    if not 0 <= user < len(state['P']) or not 0 <= item < len(state['Q']):
        raise ValueError('known participating user/item IDs required')
    history = state['histories'][user]
    if state['nu'][user] == 0 or state['ni'][item] == 0 or item not in history:
        raise ValueError('updates require a record in the declared training population')
    old_p, old_q = state['P'][user].copy(), state['Q'][item].copy()
    old_y = state['Y'][history].copy()
    h, contribution = representation(state, user)
    error = rating-predict(state, user, item)
    gp = -error*old_q + penalty/state['nu'][user]*old_p
    gq = -error*h + penalty/state['ni'][item]*old_q
    gy = np.array([-error*old_q/math.sqrt(len(history)) + penalty/state['tj'][j]*old
                   for j, old in zip(history, old_y)])
    return {'history': history, 'error': float(error), 'oldP': old_p, 'oldQ': old_q,
            'oldY': old_y, 'oldH': h, 'oldHistoryContribution': contribution,
            'P': gp, 'Q': gq, 'Y': gy,
            'bu': -error+penalty/state['nu'][user]*state['bu'][user],
            'bi': -error+penalty/state['ni'][item]*state['bi'][item]}


def event_step(state, event, penalty, rate):
    if not math.isfinite(rate) or rate < 0:
        raise ValueError('finite nonnegative learning rate required')
    user, item, rating = event
    gradient = event_gradient(state, user, item, rating, penalty)
    # Compute every new buffer before changing any visible state.
    after_p = state['P'][user]-rate*gradient['P']
    after_q = state['Q'][item]-rate*gradient['Q']
    after_y = state['Y'][gradient['history']]-rate*gradient['Y']
    after_bu = state['bu'][user]-rate*gradient['bu']
    after_bi = state['bi'][item]-rate*gradient['bi']
    if not all(np.isfinite(value).all() for value in [after_p, after_q, after_y, after_bu, after_bi]):
        raise FloatingPointError('local step produced an unavailable nonfinite state')
    state['P'][user], state['Q'][item], state['Y'][gradient['history']] = after_p, after_q, after_y
    state['bu'][user], state['bi'][item] = after_bu, after_bi
    return gradient


def train(events, users, items, dimensions=2, seed=23, mean=3., rate=.03, penalty=.1, epochs=10):
    """One full fit; duplicates repeat loss records but not canonical history IDs."""
    if not isinstance(epochs, int) or epochs < 0:
        raise ValueError('nonnegative integer epoch count required')
    state = initialize(events, users, items, dimensions, seed, mean)
    initial = copy.deepcopy(state)
    objectives = [global_objective(state, events, penalty)]
    orders = []
    rng = np.random.default_rng(seed)
    for _ in range(epochs):
        order = rng.permutation(len(events)).tolist()
        orders.append(order)
        for position in order:
            event_step(state, events[position], penalty, rate)
        objectives.append(global_objective(state, events, penalty))
    return {'initial': initial, 'state': state, 'globalObjectives': objectives,
            'eventOrders': orders, 'epochs': epochs, 'rate': rate, 'penalty': penalty,
            'rollingLossUsedAsObjective': False}


def serialize(value):
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    raise TypeError(type(value).__name__)


def main():
    events = [(0, 0, 5.), (0, 1, 3.)]
    state = initialize(events, 1, 2)
    state['P'][:] = 0.
    state['Q'][:] = [[1., 0.], [0., 1.]]
    state['Y'][:] = [[1., 0.], [0., 1.]]
    before = copy.deepcopy(state)
    gradient = event_step(state, events[0], 0., .1)
    error = 2-1/math.sqrt(2)
    if not np.allclose(state['P'][0], [.1*error, 0.], rtol=0, atol=1e-14):
        raise AssertionError('changed old-buffer history step disagrees')
    # Independent scalar differentiation of each history coordinate at the old
    # event state. No optimizer or repeated training run enters this check.
    numerical = np.empty_like(before['Y'])
    epsilon = 1e-6
    for item in range(2):
        for coordinate in range(2):
            plus, minus = copy.deepcopy(before), copy.deepcopy(before)
            plus['Y'][item, coordinate] += epsilon
            minus['Y'][item, coordinate] -= epsilon
            numerical[item, coordinate] = (.5*(5-predict(plus, 0, 0))**2 - .5*(5-predict(minus, 0, 0))**2)/(2*epsilon)
    difference = float(np.max(np.abs(numerical-gradient['Y'])))
    if difference > 2e-8:
        raise AssertionError('changed local history gradient exceeds declared tolerance')
    canonical, _ = representation(before, 0)
    repeated, _ = representation(before, 0, [0, 0, 1])
    report = {'scope': 'Changed local step/finite difference/forward only, no fit',
              'before': before, 'gradient': gradient, 'after': state,
              'historyFiniteDifference': numerical, 'differenceInfinity': difference, 'epsilon': epsilon,
              'canonicalUniqueRepresentation': canonical,
              'occurrenceRepeatedRepresentation': repeated,
              'distinctHistoryRules': not np.allclose(canonical, repeated, rtol=0, atol=1e-14),
              'cost': 'local O(d*historySize); epoch O(d*sum_event historySize); full objective is evaluated on one saved state'}
    print(json.dumps(report, indent=2, default=serialize, allow_nan=False))


if __name__ == '__main__':
    main()
