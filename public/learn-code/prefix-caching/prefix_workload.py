"""Constructed request traces with real finite-store decisions, not service data."""

from collections import Counter
import json

from prefix_store import PrefixStore


class FrequencyStore(PrefixStore):
    """Historical hit frequency, then inactive LRU. Counter survives eviction.

    This deliberately simple policy is a counterexample, not production LFU.
    It scans inactive entries and stores unbounded historical identity counts.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.frequency = Counter()

    def complete(self, request):
        super().complete(request)
        for number in self.requests[request]["table"]:
            identity = self.pages[number].identity
            if identity is not None:
                self.frequency[identity.exact] += 1

    def _victims(self, needed, protected=()):
        deficit = max(0, needed - len(self.free))
        eligible = [number for number in self.inactive if number not in protected]
        if len(eligible) < deficit:
            raise MemoryError("Insufficient unprotected pages; no mutation.")
        # Stable sort preserves inactive LRU order for equal frequencies.
        eligible.sort(key=lambda n: self.frequency[self.pages[n].identity.exact])
        return eligible[:deficit]


def run_trace(prompts, capacity=4, store_class=PrefixStore):
    store = store_class(capacity, page_size=4)
    events = [{"event": "initial", "state": store.snapshot()}]
    rows = []
    for index, ids in enumerate(prompts):
        request = f"R{index}"
        before = store.snapshot()
        decision = store.admit(request, ids)
        events.append(
            {"event": "admit", "request": request, "decision": decision, "state": store.snapshot()}
        )
        store.complete(request)
        store.invariant()
        events.append({"event": "complete", "request": request, "state": store.snapshot()})
        store.release(request)
        store.invariant()
        events.append({"event": "release", "request": request, "state": store.snapshot()})
        rows.append({"request": request, "ids": list(ids), "before": before, **decision})
    requested = sum(len(row["ids"]) for row in rows)
    reused = sum(row["reused_rows"] for row in rows)
    hits = sum(row["reused_rows"] > 0 for row in rows)
    return {
        "capacity": capacity,
        "page_size": 4,
        "rows": rows,
        "events": events,
        "request_hits": hits,
        "requests": len(rows),
        "requested_tokens": requested,
        "reused_tokens": reused,
        "new_queries": requested - reused,
        "request_hit_fraction": hits / len(rows) if rows else None,
        "token_hit_fraction": reused / requested if requested else None,
        "final": store.snapshot(),
    }


def verify():
    a = list(range(1, 11))
    b = list(range(1, 9)) + [11, 12]
    c = [1, 2, 3, 4, 20, 21, 22, 23, 24, 25]
    cases = {
        "cold": run_trace([a]),
        "warm": run_trace([a, b, a]),
        "reordered": run_trace([a, c, b]),
        "pressure": run_trace([a, c, b], capacity=3),
        "unique": run_trace([list(range(i, i + 10)) for i in (40, 60, 80)]),
        "empty": run_trace([]),
    }
    assert cases["cold"]["reused_tokens"] == 0
    assert cases["warm"]["rows"][1]["reused_rows"] == 8
    assert cases["unique"]["reused_tokens"] == 0
    assert cases["empty"]["request_hit_fraction"] is None
    hot = [1, 2, 3, 4, 99]
    new_b = [5, 6, 7, 8, 99]
    new_c = [9, 10, 11, 12, 99]
    sessions = [hot] * 5 + [new_b, new_c, new_b]
    lru = run_trace(sessions, capacity=3)
    frequency = run_trace(sessions, capacity=3, store_class=FrequencyStore)
    assert lru["rows"][-1]["reused_rows"] == 4
    assert frequency["rows"][-1]["reused_rows"] == 0
    return {
        "traces": cases,
        "ended_session": {"lru": lru, "frequency": frequency},
        "scope": "Invented sequential arrivals; release after every request.",
    }


if __name__ == "__main__":
    print(json.dumps(verify(), indent=2))
