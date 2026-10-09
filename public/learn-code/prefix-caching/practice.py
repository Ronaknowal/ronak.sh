"""Complete worked-answer computations. Read the prompts before this file."""

import json
from prefix_identity import block_identities, eligible_rows, ExactIndex
from prefix_store import PrefixStore
from prefix_work import work
from prefix_cost import decision
from prefix_routing import route
from radix_prefix import RadixPrefix


def leaked_owner():
    store = PrefixStore(1, page_size=2)
    store.admit("A", [1, 2])
    store.complete("A")
    store.fork("A", "B")
    shared = store.snapshot()
    store.release("A")
    missed_callback = store.snapshot()
    try:
        store.admit("C", [4])
    except MemoryError:
        assert store.snapshot() == missed_callback
    else:
        raise AssertionError("An owner is still active.")
    store.release("B")
    released = store.snapshot()
    try:
        store.release("B")
    except ValueError:
        duplicate_refused = True
    else:
        raise AssertionError("Double release must not create capacity.")
    return {
        "shared": shared,
        "missing_callback": missed_callback,
        "after_correct_release": released,
        "duplicate_refused": duplicate_refused,
    }


def atomic_capacity():
    store = PrefixStore(3, page_size=2)
    for request, ids in [("active", [30, 31]), ("match", [7, 8]), ("other", [9, 10])]:
        store.admit(request, ids)
        store.complete(request)
        if request != "active":
            store.release(request)
    before = store.snapshot()
    try:
        store.admit("too-large", [7, 8, 11, 12, 13])
    except MemoryError:
        assert store.snapshot() == before
    else:
        raise AssertionError("Matched page must be protected.")
    accepted = store.admit("fits", [7, 8, 11])
    store.complete("fits")
    store.invariant()
    return {
        "before": before,
        "denied_unchanged": True,
        "smaller_decision": accepted,
        "after": store.snapshot(),
    }


class PrefixOnlyPool(PrefixStore):
    """Exercise 16 only: final-query K/V is transient outside this pool.

    Parent store still manages complete page ownership. This subclass receives
    only full reusable prefix blocks, and therefore may match their final block.
    It must not be used as a full per-request inference cache.
    """

    def match(self, ids):
        matched = []
        for identity in self.identities(ids):
            page = self.index.find(identity)
            if page is None:
                break
            matched.append(page)
        return matched

    def admit_prompt(self, request, ids):
        resident_length = eligible_rows(len(ids), self.page_size)
        if resident_length == 0:
            raise ValueError("This capstone fixture requires a complete resident prefix.")
        return self.admit(request, ids[:resident_length])


def capstone(buggy=False):
    store = PrefixOnlyPool(3, page_size=2)
    rows = []
    for request, ids in [("A", [1, 2, 3, 4, 9]), ("B", [1, 2, 7, 8, 10])]:
        admission = store.admit_prompt(request, ids)
        store.complete(request)
        store.release(request)
        rows.append(
            {"request": request, "ids": ids, "admission": admission, "state": store.snapshot()}
        )
    before = store.snapshot()
    if buggy:
        # The incorrect preallocation step evicts a needed ancestor before lookup.
        ancestor = store.index.find(store.identities([1, 2])[0])
        store._reclaim(ancestor)
    c = [1, 2, 3, 4, 11]
    matched = store.match(c[:4])
    reused = 2 * len(matched)
    selected_work = work(len(c), reused)
    decision_c = store.admit_prompt("C", c)
    store.complete("C")
    store.invariant()
    return {
        "prefix_only_capacity_pages": 3,
        "transient_query_outside_budget": True,
        "arrivals": rows,
        "before_C": before,
        "buggy": buggy,
        "match_before_compute": matched,
        "decision_C": decision_c,
        "C_work": selected_work,
        "after_C": store.snapshot(),
    }


def answers():
    namespace = {"model": "fixed", "trust": "N"}
    a = block_identities([2, 4, 7, 9, 11], 2, namespace)
    b = block_identities([8, 6, 7, 9, 12], 2, namespace)
    rows = {
        "1": {
            "read_positions": list(range(7)),
            "write_position": 6,
            "layer_head_pairs": 3 * 2,
            "K_rows_read": 3 * 2 * 7,
            "V_rows_read": 3 * 2 * 7,
            "reuse_previous_answer": False,
        },
        "2": {
            "unchanged_positions": [0, 1, 2],
            "recompute_positions": list(range(3, 9)),
            "complete_page_rows": (3 // 2) * 2,
        },
        "3": {
            "second_block_equal": a[1].prefix[-2:] == b[1].prefix[-2:],
            "effective_prefix_equal": a[1].exact == b[1].exact,
        },
        "4": {
            "limits": {str(n): eligible_rows(n, 3) for n in [5, 6, 10]},
            "changed_index_4_limit": (4 // 3) * 3,
        },
        "5": {"six_reused": work(12, 6), "zero_reused": work(12, 0)},
        "6": leaked_owner(),
        "7": atomic_capacity(),
    }
    tables = [[0, 2, 4], [0, 3, 4], [1, 4]]
    physical = set().union(*map(set, tables))
    rows["8"] = {
        "logical_refs": sum(map(len, tables)),
        "physical_pages": sorted(physical),
        "logical_bytes": sum(map(len, tables)) * 2048,
        "physical_bytes": len(physical) * 2048,
    }
    branch = PrefixStore(2)
    branch.admit("left", [5, 6, 7])
    branch.complete("left")
    branch.fork("left", "right")
    branch.append_to_partial("left", 8)
    branch.append_to_partial("right", 9)
    branch.invariant()
    rows["9"] = branch.snapshot()
    constant = lambda _: b"\x00"
    collision_a = block_identities([1, 3, 5, 7], 2, namespace, constant)[1]
    collision_b = block_identities([2, 4, 5, 7], 2, namespace, constant)[1]
    index = ExactIndex()
    index.add(collision_a, 0)
    rows["10"] = {
        "same_digest": collision_a.digest == collision_b.digest,
        "same_last_block": collision_a.prefix[-2:] == collision_b.prefix[-2:],
        "wrong_candidate_match": index.find(collision_b),
    }
    rows["11"] = {
        "request_hits": 2,
        "requests": 3,
        "reused_tokens": 12,
        "requested_tokens": 30,
        "token_fraction": 12 / 30,
        "new_queries": 30 - 12,
        "after_first_block_missing": 0,
    }
    rows["12"] = {
        "supports": "Declared tolerance and observed top-1 on the supplied cases only.",
        "does_not_establish": ["bitwise equality", "shared storage", "speedup"],
        "sharing_evidence_needed": ["common backing addresses", "correct ownership/lifetime"],
    }
    radix = RadixPrefix()
    radix.insert([3, 1, 4, 1])
    radix.insert([3, 1, 5])
    radix.pin("live", [3, 1, 4, 2])
    radix.invariant()
    rows["13"] = {"tree": radix.snapshot(), "one_safe_eviction": radix.evict_leaf()}
    rows["14"] = [route(wait, 5, 3, 12) for wait in [7, 10, 13]]
    rows["15"] = {
        "expiry_eligible": {str(t): t < 90 for t in [89, 90]},
        "cost": decision("4", "1", ".4", ".6", 6),
    }
    rows["16"] = {"correct": capstone(), "buggy": capstone(True)}
    assert rows["8"]["physical_bytes"] == 10240 and rows["8"]["logical_bytes"] == 16384
    assert rows["10"]["wrong_candidate_match"] is None
    assert rows["16"]["correct"]["C_work"]["remaining_pairs"] == 5
    assert rows["16"]["buggy"]["C_work"]["remaining_pairs"] == 15
    return rows


def verify():
    return answers()


if __name__ == "__main__":
    print(json.dumps(answers(), indent=2))
