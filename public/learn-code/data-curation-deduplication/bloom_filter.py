"""A bit-packed membership sketch with an explicit configuration contract."""
from hashlib import blake2b
import json
import math


def false_positive_rate(bits, hashes, unique_items):
    if bits < 1 or hashes < 1 or unique_items < 0:
        raise ValueError('Positive bit/hash counts and nonnegative item count required')
    return (-math.expm1(-hashes * unique_items / bits)) ** hashes


def size_filter(capacity, target_rate):
    if not isinstance(capacity, int) or capacity < 1 or not 0 < target_rate < 1:
        raise ValueError('Positive integer capacity and rate strictly between zero and one required')
    bits = math.ceil(-capacity * math.log(target_rate) / math.log(2) ** 2)
    ideal = bits / capacity * math.log(2)
    choices = {max(1, math.floor(ideal)), max(1, math.ceil(ideal))}
    hashes = min(choices, key=lambda k: (false_positive_rate(bits, k, capacity), k))
    return bits, hashes


class BloomFilter:
    def __init__(self, bits, hashes, seed=17):
        if not isinstance(bits, int) or bits < 1 or not isinstance(hashes, int) or hashes < 1 or seed < 0:
            raise ValueError('Positive integer bit/hash counts and nonnegative seed required')
        self.m, self.k, self.seed = bits, hashes, seed
        self.bits = bytearray((bits + 7) // 8)

    def indices(self, item):
        payload = item.encode('utf-8')
        return [int.from_bytes(blake2b(payload, key=f'{self.seed}:{i}'.encode('ascii'), digest_size=8).digest(), 'big') % self.m
                for i in range(self.k)]

    def add(self, item):
        for index in self.indices(item):
            self.bits[index // 8] |= 1 << (index % 8)

    def __contains__(self, item):
        return all(self.bits[index // 8] & (1 << (index % 8)) for index in self.indices(item))

    def merge(self, other):
        if (self.m, self.k, self.seed) != (other.m, other.k, other.seed):
            raise ValueError('Union requires identical bit/hash/seed configuration')
        self.bits[:] = bytes(a | b for a, b in zip(self.bits, other.bits))

    def occupied(self):
        return sum(byte.bit_count() for byte in self.bits)


def confirmed_seen(item, bloom, exact_store):
    """A positive means consult the authority; a negative avoids that lookup."""
    return item in bloom and item in exact_store


if __name__ == '__main__':
    m, k = size_filter(1000, .01)
    bloom = BloomFilter(m, k)
    keys = {f'document-{i}' for i in range(1000)}
    for item in sorted(keys):
        bloom.add(item)
    queries = [f'unseen-{i}' for i in range(10000)]
    positives = [item for item in queries if item in bloom]
    tiny = BloomFilter(16, 3)
    inserted = ['oak', 'elm', 'ash']
    for item in inserted:
        tiny.add(item)
    false_key = next(item for item in (f'query-{i}' for i in range(1000)) if item in tiny and item not in inserted)
    print(json.dumps({'bits': m, 'hashes': k, 'bytes': len(bloom.bits),
                      'occupied': bloom.occupied(), 'false_negatives': sum(x not in bloom for x in keys),
                      'heldout_queries': len(queries), 'observed_false_positives': len(positives),
                      'formula_rate': false_positive_rate(m, k, len(keys)),
                      'tiny_inserted': {x: tiny.indices(x) for x in inserted},
                      'tiny_false_positive': {'key': false_key, 'indices': tiny.indices(false_key),
                                             'confirmed_seen': confirmed_seen(false_key, tiny, set(inserted))}}, indent=2))
