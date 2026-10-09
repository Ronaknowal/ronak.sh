"""An owned request lifecycle with conservative logical-page reservations.

The runner is a declared token table, not a language model or speed benchmark.
One tick is one logical iteration; a prefill tick consumes the entire prompt.
"""
from collections import deque
from dataclasses import dataclass, field
from request_contract import Request, requests_by_id, integer, clock
from capacity_accounting import reservation


TERMINAL = {"eos", "limit", "canceled", "deadline", "error", "rejected"}


@dataclass
class State:
    request: Request
    phase: str = "future"
    outputs: list[int] = field(default_factory=list)
    pages: int = 0
    cache_rows: int = 0


class ScriptedRunner:
    """Each request owns an explicit next-ID sequence; exhaustion means EOS."""
    def __init__(self, scripts, fail_on=None):
        self.scripts = {key: tuple(value) for key, value in scripts.items()}
        for sequence in self.scripts.values():
            for token in sequence:
                integer(token, "scripted token")
        self.fail_on = fail_on

    def next_id(self, state, input_ids):
        if self.fail_on == (state.request.request_id, len(state.outputs)):
            raise RuntimeError("explicit supplied runner failure")
        expected = state.request.prompt if not state.outputs else (state.outputs[-1],)
        if tuple(input_ids) != expected:
            raise ValueError("runner received the wrong forward input")
        sequence = self.scripts.get(state.request.request_id, ())
        return sequence[len(state.outputs)] if len(state.outputs) < len(sequence) else 0


class Engine:
    def __init__(self, requests, runner, pool_pages=6, page_size=2, queue_limit=16):
        self.states = {key: State(job) for key, job in requests_by_id(requests).items()}
        self.future = deque(sorted(self.states, key=lambda key: self.states[key].request.arrival))
        self.waiting = deque()
        self.active = {}
        self.runner = runner
        self.pool_pages = integer(pool_pages, "pool pages", 1)
        self.page_size = integer(page_size, "page size", 1)
        self.queue_limit = integer(queue_limit, "waiting queue limit", 1)
        self.free_pages = self.pool_pages
        self.time = 0.0
        self.events = []

    def record(self, state, event, **detail):
        self.events.append({"time": self.time, "request": state.request.request_id,
                            "event": event, **detail})

    def finish(self, state, reason):
        if reason not in TERMINAL:
            raise ValueError("unknown terminal reason")
        if state.phase in TERMINAL:
            return False
        self.record(state, "terminal", reason=reason, outputs=state.outputs.copy(),
                    cached_rows_at_finish=state.cache_rows, released_pages=state.pages)
        self.free_pages += state.pages
        state.pages = state.cache_rows = 0
        state.phase = reason
        self.active.pop(state.request.request_id, None)
        return True

    def invariant(self):
        reserved = sum(state.pages for state in self.states.values())
        assert self.free_pages + reserved == self.pool_pages
        assert 0 <= self.free_pages <= self.pool_pages
        for state in self.states.values():
            assert len(state.outputs) <= state.request.cap
            assert state.cache_rows <= state.pages * self.page_size
            if state.phase in TERMINAL:
                assert state.pages == state.cache_rows == 0

    def step(self, cancel_at=None):
        cancel_at = {} if cancel_at is None else cancel_at
        # Arrival order is stable for simultaneous requests.
        while self.future and self.states[self.future[0]].request.arrival <= self.time:
            state = self.states[self.future.popleft()]
            demand = reservation(len(state.request.prompt), state.request.cap, self.page_size)["pages"]
            self.record(state, "arrive", reservation_pages=demand)
            if demand > self.pool_pages:
                self.finish(state, "rejected")
            elif len(self.waiting) >= self.queue_limit:
                self.finish(state, "rejected")
            else:
                state.phase = "queued"
                self.waiting.append(state.request.request_id)
                self.record(state, "queued")

        # Safe point: only this owner transitions and releases a request.
        for state in self.states.values():
            if state.phase in TERMINAL or state.phase == "future":
                continue
            deadline = state.request.deadline
            if deadline is not None and deadline <= self.time:
                self.finish(state, "deadline")
            elif cancel_at.get(state.request.request_id, float("inf")) <= self.time:
                self.finish(state, "canceled")

        # A bounded scan lets a feasible small request bypass a waiting larger one.
        for _ in range(len(self.waiting)):
            state = self.states[self.waiting.popleft()]
            if state.phase in TERMINAL:
                continue
            demand = reservation(len(state.request.prompt), state.request.cap, self.page_size)["pages"]
            if demand > self.free_pages:
                self.waiting.append(state.request.request_id)
                continue
            self.free_pages -= demand
            state.pages = demand
            state.phase = "prefill"
            self.active[state.request.request_id] = state
            self.record(state, "admit", pages=demand)

        for state in list(self.active.values()):
            input_ids = state.request.prompt if state.phase == "prefill" else (state.outputs[-1],)
            self.record(state, "forward", phase=state.phase, input_ids=list(input_ids))
            try:
                token = integer(self.runner.next_id(state, input_ids), "runner output")
            except Exception as error:
                self.record(state, "runner_error", type=type(error).__name__, message=str(error))
                self.finish(state, "error")
                continue
            state.cache_rows += len(input_ids)
            state.outputs.append(token)
            self.record(state, "emit", token=token, index=len(state.outputs) - 1,
                        cached_rows=state.cache_rows)
            if token == 0:
                self.finish(state, "eos")
            elif len(state.outputs) == state.request.cap:
                self.finish(state, "limit")
            else:
                state.phase = "decode"
        self.invariant()
        self.time += 1.0

    def run(self, cancel_at=None, max_iterations=1000):
        integer(max_iterations, "iteration bound", 1)
        cancel_at = {} if cancel_at is None else dict(cancel_at)
        for key, value in cancel_at.items():
            if key not in self.states:
                raise ValueError("cancellation names an unknown request")
            clock(value, "cancellation time")
        for _ in range(max_iterations):
            if not (self.future or self.waiting or self.active):
                return self.events
            if not (self.waiting or self.active) and self.future:
                self.time = max(self.time, self.states[self.future[0]].request.arrival)
            self.step(cancel_at)
        raise RuntimeError("explicit logical-iteration bound reached; inspect retained events")


if __name__ == "__main__":
    jobs = [Request("A", (11, 12, 13), 3), Request("B", (11, 12, 14, 15), 2, arrival=1)]
    for pages in [5, 6]:
        engine = Engine(jobs, ScriptedRunner({"A": [21, 22, 0], "B": [31, 0]}), pages)
        print("pool", pages)
        for event in engine.run():
            print(event)
