"""Canonical full-block identities and a collision-safe lookup index.

Run: python prefix_identity.py
Only full blocks are indexed. A digest accelerates lookup; exact namespace and
the entire causal token prefix decide equality. Explicit prefix tuples favor
inspectability: storing every tuple costs O(L^2/page_size) in the worst case.
The chained digest pass itself is O(L). Production stores can intern parents.
"""

from dataclasses import dataclass
import hashlib
import json
import struct


def token_ids(values):
    values = tuple(values)
    if any(type(x) is not int or not 0 <= x < 2**32 for x in values):
        raise ValueError("Token IDs must be uint32 integers.")
    return values


def namespace_bytes(namespace):
    if not isinstance(namespace, dict) or not all(
        isinstance(k, str) and isinstance(v, str) for k, v in namespace.items()
    ):
        raise ValueError("Use a string-to-string compatibility namespace.")
    return json.dumps(namespace, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode(
        "utf8"
    )


@dataclass(frozen=True)
class Identity:
    namespace: bytes
    prefix: tuple
    digest: bytes

    @property
    def exact(self):
        return self.namespace, self.prefix


def block_identities(
    ids, page_size, namespace, digest=lambda value: hashlib.sha256(value).digest()
):
    ids = token_ids(ids)
    if type(page_size) is not int or page_size < 1:
        raise ValueError("page_size must be positive.")
    space = namespace_bytes(namespace)
    parent = digest(struct.pack("<I", len(space)) + space)
    identities = []
    for end in range(page_size, len(ids) + 1, page_size):
        block = ids[end - page_size : end]
        raw = struct.pack("<I", len(parent)) + parent + struct.pack("<I", len(block))
        raw += struct.pack("<" + "I" * len(block), *block)
        parent = digest(raw)
        identities.append(Identity(space, ids[:end], parent))
    return identities


def eligible_rows(length, page_size, keep_final_query=True):
    if length < 0 or page_size < 1:
        raise ValueError("Nonnegative length and positive page size required.")
    available = max(0, length - int(keep_final_query))
    return page_size * (available // page_size)


class ExactIndex:
    def __init__(self):
        self.buckets = {}

    def find(self, identity):
        for exact, page in self.buckets.get(identity.digest, []):
            if exact == identity.exact:
                return page
        return None

    def add(self, identity, page):
        existing = self.find(identity)
        if existing is not None:
            return existing
        self.buckets.setdefault(identity.digest, []).append((identity.exact, page))
        return page

    def remove(self, identity, page):
        bucket = self.buckets[identity.digest]
        bucket.remove((identity.exact, page))
        if not bucket:
            del self.buckets[identity.digest]


def verify():
    namespace = {
        "model": "fixed-v1",
        "adapter": "none",
        "positions": "absolute",
        "mask": "causal",
        "trust": "demo",
    }
    collision = lambda _: b"\x00"
    a = block_identities([1, 3, 5, 7], 2, namespace, collision)
    b = block_identities([2, 4, 5, 7], 2, namespace, collision)
    index = ExactIndex()
    index.add(a[1], 4)
    assert a[1].digest == b[1].digest and index.find(b[1]) is None
    assert index.find(a[1]) == 4
    other = block_identities([1, 3, 5, 7], 2, namespace | {"trust": "other"}, collision)
    assert index.find(other[1]) is None
    index.remove(a[1], 4)
    assert index.find(a[1]) is None
    return {
        "forced_collision_refused": True,
        "namespace_refused": True,
        "page4_last_query_boundaries": {str(x): eligible_rows(x, 4) for x in [1, 4, 7, 8, 9, 10]},
    }


if __name__ == "__main__":
    print(json.dumps(verify(), indent=2))
