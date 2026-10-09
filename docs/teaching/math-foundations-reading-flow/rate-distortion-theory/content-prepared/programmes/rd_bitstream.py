import struct

CODEBOOK = ("000", "111")  # Shared, fixed protocol; not transmitted per file.


def compress(source):
    if any(bit not in "01" for bit in source):
        raise ValueError("Only binary text is accepted.")
    if len(source) >= 2**32:
        raise ValueError("Length exceeds the four-byte header.")
    padded = source + "0" * ((-len(source)) % 3)
    indices = []
    for start in range(0, len(padded), 3):
        word = padded[start : start + 3]
        indices.append("1" if word.count("1") >= 2 else "0")
    payload_bits = "".join(indices)
    padded_payload = payload_bits + "0" * ((-len(payload_bits)) % 8)
    payload = bytes(
        int(padded_payload[i : i + 8], 2) for i in range(0, len(padded_payload), 8)
    )
    return struct.pack(">I", len(source)) + payload


def decompress(encoded):
    if len(encoded) < 4:
        raise ValueError("Missing length header.")
    length = struct.unpack(">I", encoded[:4])[0]
    blocks = (length + 2) // 3
    if len(encoded) != 4 + (blocks + 7) // 8:
        raise ValueError("Payload length does not match header.")
    payload = "".join(f"{byte:08b}" for byte in encoded[4:])
    if "1" in payload[blocks:]:
        raise ValueError("Nonzero padding.")
    return "".join(CODEBOOK[int(bit)] for bit in payload[:blocks])[:length]


source = "".join(f"{value:03b}" for value in range(8))
encoded = compress(source)
restored = decompress(encoded)
print("source:", source)
print("decoded:", restored)
print("wire bytes, hex:", len(encoded), encoded.hex())
print("raw packed bytes:", (len(source) + 7) // 8)
print("payload bits/source bit:", (len(source) // 3) / len(source))
print("wire bits/source bit:", len(encoded) * 8 / len(source))
print("error fraction:", sum(a != b for a, b in zip(source, restored)) / len(source))
assert len(restored) == len(source)
assert decompress(compress("")) == ""
for bad in (b"", encoded[:-1], encoded + b"\x00"):
    try:
        decompress(bad)
    except ValueError:
        pass
    else:
        raise AssertionError("Malformed payload was accepted.")
