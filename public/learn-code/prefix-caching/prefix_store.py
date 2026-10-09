"""Finite, single-threaded full-request page store with retained prefix reuse.

Tokens stand in for K/V payload identity; prefix_decoder.py computes real K/V.
Admission plans capacity before any mutation. ExactIndex guards collisions.
Inactive LRU operations are O(1); matching is linear in blocks plus exact-key
comparison. Explicit whole-prefix identity storage is not a production trie.
"""

from collections import OrderedDict
from dataclasses import dataclass, field
import hashlib
import json
from prefix_identity import ExactIndex, block_identities, eligible_rows, token_ids


@dataclass
class Page:
    number: int
    generation: int = 0
    tokens: tuple = ()
    owners: set = field(default_factory=set)
    identity: object = None
    reserved: bool = False


class PrefixStore:
    def __init__(self, capacity, page_size=4, namespace=None, digest=None):
        if capacity < 1 or page_size < 1:
            raise ValueError("Positive capacity and page size required.")
        self.page_size = page_size
        self.namespace = namespace or {
            "model": "fixed",
            "adapter": "none",
            "positions": "absolute",
            "mask": "causal",
            "trust": "demo",
        }
        self.digest = digest or (lambda x: hashlib.sha256(x).digest())
        self.pages = [Page(i) for i in range(capacity)]
        self.free = list(range(capacity))
        self.inactive = OrderedDict()
        self.index = ExactIndex()
        self.requests = {}
        self.evictions = 0

    def identities(self, ids):
        return block_identities(ids, self.page_size, self.namespace, self.digest)

    def match(self, ids):
        """Read-only longest eligible resident prefix; never skip a miss."""
        limit = eligible_rows(len(ids), self.page_size) // self.page_size
        matched = []
        for identity in self.identities(ids)[:limit]:
            page = self.index.find(identity)
            if page is None:
                break
            matched.append(page)
        return matched

    def _victims(self, needed, protected=()):
        deficit = max(0, needed - len(self.free))
        eligible = [p for p in self.inactive if p not in protected]
        if len(eligible) < deficit:
            raise MemoryError("Insufficient unprotected pages; admission changed nothing.")
        return eligible[:deficit]

    def _reclaim(self, number):
        page = self.pages[number]
        if page.owners:
            raise RuntimeError("Cannot reclaim an active page.")
        self.inactive.pop(number, None)
        if page.identity is not None:
            self.index.remove(page.identity, number)
            self.evictions += 1
        page.identity, page.tokens, page.reserved = None, (), False
        self.free.append(number)

    def _claim(self, number, request):
        page = self.pages[number]
        if request in page.owners:
            raise RuntimeError("Duplicate acquisition.")
        self.inactive.pop(number, None)
        page.owners.add(request)

    def _new(self, request):
        number = self.free.pop(0)
        page = self.pages[number]
        page.generation += 1
        page.tokens, page.identity, page.reserved = (), None, True
        self._claim(number, request)
        return number

    def admit(self, request, ids):
        ids = token_ids(ids)
        if request in self.requests or not ids:
            raise ValueError("Use a new request ID and nonempty prompt.")
        matched = self.match(ids)
        total = (len(ids) + self.page_size - 1) // self.page_size
        needed = total - len(matched)
        victims = self._victims(needed, matched)
        # Commit only after the complete plan succeeds. Hits cannot be victims.
        for number in matched:
            self._claim(number, request)
        for number in victims:
            self._reclaim(number)
        table = matched + [self._new(request) for _ in range(needed)]
        self.requests[request] = {"ids": ids, "table": table, "computed": False}
        return {
            "reused_rows": len(matched) * self.page_size,
            "new_query_rows": len(ids) - len(matched) * self.page_size,
            "matched": matched,
            "allocated": table[len(matched) :],
            "evicted": victims,
        }

    def complete(self, request):
        """Call after successful computation, never before payload is available."""
        row = self.requests[request]
        identities = self.identities(row["ids"])
        for slot, number in enumerate(row["table"]):
            page = self.pages[number]
            if page.identity is not None:
                continue
            start = slot * self.page_size
            page.tokens = row["ids"][start : start + self.page_size]
            page.reserved = False
            if len(page.tokens) == self.page_size:
                identity = identities[slot]
                existing = self.index.add(identity, number)
                if existing != number:
                    # Computation after a miss may rediscover a complete block.
                    self._claim(existing, request)
                    page.owners.remove(request)
                    self._reclaim(number)
                    row["table"][slot] = existing
                else:
                    page.identity = identity
        row["computed"] = True

    def release(self, request):
        if request not in self.requests:
            raise ValueError("Unknown/already released request.")
        row = self.requests.pop(request)
        for number in row["table"]:
            page = self.pages[number]
            page.owners.remove(request)
            if not page.owners:
                if page.identity is not None:
                    self.inactive[number] = None
                else:
                    self._reclaim(number)

    def fork(self, source, destination):
        row = self.requests[source]
        if destination in self.requests or not row["computed"]:
            raise ValueError("Fork a computed request into a new identity.")
        shared = [p for p in row["table"] if self.pages[p].identity is not None]
        copied = [p for p in row["table"] if self.pages[p].identity is None]
        victims = self._victims(len(copied))
        for number in victims:
            self._reclaim(number)
        table = []
        copy_pairs = []
        for number in row["table"]:
            if number in shared:
                self._claim(number, destination)
                table.append(number)
            else:
                fresh = self._new(destination)
                self.pages[fresh].tokens = tuple(self.pages[number].tokens)
                self.pages[fresh].reserved = False
                table.append(fresh)
                copy_pairs.append([number, fresh])
        self.requests[destination] = {"ids": row["ids"], "table": table, "computed": True}
        return {"shared": shared, "copies": copy_pairs}

    def append_to_partial(self, request, token):
        """Finite COW demonstration: fill the existing partial tail only."""
        token_ids([token])
        row = self.requests[request]
        page = self.pages[row["table"][-1]]
        if (
            page.identity is not None
            or page.owners != {request}
            or len(page.tokens) >= self.page_size
        ):
            raise ValueError("Append requires a private partial tail.")
        row["ids"] += (token,)
        page.tokens += (token,)
        row["computed"] = False
        self.complete(request)

    def snapshot(self):
        return {
            "free": list(self.free),
            "inactive_lru": list(self.inactive),
            "evictions": self.evictions,
            "requests": {
                r: {"ids": list(v["ids"]), "table": list(v["table"]), "computed": v["computed"]}
                for r, v in self.requests.items()
            },
            "pages": [
                {
                    "id": p.number,
                    "generation": p.generation,
                    "tokens": list(p.tokens),
                    "owners": sorted(p.owners),
                    "refs": len(p.owners),
                    "complete": p.identity is not None,
                    "reserved": p.reserved,
                    "digest": None if p.identity is None else p.identity.digest.hex(),
                }
                for p in self.pages
            ],
        }

    def invariant(self):
        free, set_inactive = set(self.free), set(self.inactive)
        assert len(free) == len(self.free) and free.isdisjoint(set_inactive)
        for page in self.pages:
            owners = {r for r, row in self.requests.items() if page.number in row["table"]}
            assert page.owners == owners
            assert sum([page.number in free, page.number in set_inactive, bool(owners)]) == 1
            if page.identity is not None:
                assert self.index.find(page.identity) == page.number
            if page.number in set_inactive:
                assert page.identity is not None
        return True


def verify():
    store = PrefixStore(4)
    a, b = list(range(1, 11)), list(range(1, 9)) + [11, 12]
    first = store.admit("A", a)
    store.complete("A")
    second = store.admit("B", b)
    store.complete("B")
    shared = store.snapshot()
    assert second["reused_rows"] == 8
    assert len(set(shared["requests"]["A"]["table"] + shared["requests"]["B"]["table"])) == 4
    before = store.snapshot()
    try:
        store.admit("denied", [21, 22, 23, 24, 25])
    except MemoryError:
        assert store.snapshot() == before
    else:
        raise AssertionError("All-active admission should refuse.")
    store.release("A")
    store.invariant()
    store.release("B")
    released = store.snapshot()
    assert len(store.free) == 2 and len(store.inactive) == 2
    branch = PrefixStore(3)
    branch.admit("parent", [5, 6, 7])
    branch.complete("parent")
    copies = branch.fork("parent", "child")
    branch.append_to_partial("parent", 8)
    branch.append_to_partial("child", 9)
    branch.invariant()
    assert branch.requests["parent"]["ids"] == (5, 6, 7, 8)
    assert branch.requests["child"]["ids"] == (5, 6, 7, 9)
    return {
        "first": first,
        "second": second,
        "shared": shared,
        "released": released,
        "atomic_denial": True,
        "fork": copies,
        "branches": branch.snapshot(),
    }


if __name__ == "__main__":
    print(json.dumps(verify(), indent=2))
