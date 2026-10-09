"""Deterministic scheduling units, not GPU time. Python 3.12+; no dependencies."""
from collections import deque
from dataclasses import dataclass
import json


@dataclass
class Request:
    name: str
    arrival: int
    prompt: int
    output: int


def schedule(requests, token_budget=4, slots=2, continuous=True):
    requests = list(requests)
    positive = lambda value: isinstance(value, int) and not isinstance(value, bool) and value > 0
    if not positive(token_budget) or not positive(slots):
        raise ValueError('token_budget and slots must be positive integers')
    if any(not positive(r.prompt) or not positive(r.output) or
           not isinstance(r.arrival, int) or isinstance(r.arrival, bool) or r.arrival < 0
           for r in requests) or len({r.name for r in requests}) != len(requests):
        raise ValueError('Use unique names, nonnegative integer arrivals and positive prompt/output lengths')
    pending = deque(sorted(requests, key=lambda item: (item.arrival, item.name)))
    active, events, completed = [], [], {}
    tick = 0
    while pending or active:
        if continuous or not active:
            while pending and pending[0].arrival <= tick and len(active) < slots:
                item = pending.popleft()
                active.append(dict(request=item, prefilled=0, generated=0, first=None))
        budget = token_budget
        actions = {}
        # Already-prefilled requests get one decode token before new prompt work.
        for state in active:
            item = state['request']
            if state['prefilled'] == item.prompt and budget:
                state['generated'] += 1
                budget -= 1
                actions[item.name] = 'D1'
        for state in active:
            item = state['request']
            if state['prefilled'] < item.prompt and budget:
                amount = min(item.prompt - state['prefilled'], budget)
                state['prefilled'] += amount
                budget -= amount
                actions[item.name] = f'P{amount}'
                if state['prefilled'] == item.prompt:
                    # Final prompt logits already predict the first output token.
                    state['generated'], state['first'] = 1, tick + 1
        events.append({'tick': tick, 'actions': actions, 'used': token_budget - budget})
        retained = []
        for state in active:
            item = state['request']
            if state['generated'] == item.output:
                completed[item.name] = {'first': state['first'], 'finish': tick + 1,
                                        'ttft_units': state['first'] - item.arrival}
            else:
                retained.append(state)
        active = retained
        tick += 1
    return {'events': events, 'completed': completed}


def page_plan(lengths, block_size, shared_prefix=0):
    if len(lengths) != 2 or any(type(n) is not int or n < 1 for n in [*lengths, block_size]) or type(shared_prefix) is not int or shared_prefix < 0:
        raise ValueError('Supply exactly two positive lengths, a positive block size and a nonnegative prefix')
    shared = min(shared_prefix, *lengths) // block_size
    counts = [(length + block_size - 1) // block_size for length in lengths]
    allocated = sum(counts) - shared
    useful = sum(lengths) - shared * block_size
    return {'logical_pages': counts, 'shared_pages': shared, 'physical_pages': allocated,
            'capacity': allocated * block_size, 'useful': useful,
            'slack': allocated * block_size - useful}


if __name__ == '__main__':
    requests = [Request('A', 0, 6, 3), Request('B', 1, 2, 2), Request('C', 2, 1, 2)]
    print(json.dumps({'continuous': schedule(requests), 'fixed': schedule(requests, continuous=False),
                      'pages': page_plan([5, 3], 4)}, indent=2))
