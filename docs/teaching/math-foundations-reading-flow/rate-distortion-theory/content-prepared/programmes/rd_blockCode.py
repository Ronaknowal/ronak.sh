from itertools import product
from math import ceil, log2

codebook = ("000", "111")


def encode(word):
    return min(
        range(len(codebook)),
        key=lambda index: sum(a != b for a, b in zip(word, codebook[index])),
    )


def decode(index):
    return codebook[index]


total_errors = 0
for bits in product("01", repeat=3):
    word = "".join(bits)
    index = encode(word)
    restored = decode(index)
    errors = sum(a != b for a, b in zip(word, restored))
    total_errors += errors
    print(word, "->", index, "->", restored, "errors", errors)

print("bits per source bit:", round(ceil(log2(len(codebook))) / 3, 6))
print("expected error fraction:", total_errors / (8 * 3))
print("worst block error fraction:", round(1 / 3, 6))