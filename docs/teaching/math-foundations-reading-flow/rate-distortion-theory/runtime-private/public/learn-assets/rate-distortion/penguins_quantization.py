import csv
import struct
import zlib
from decimal import Decimal
from pathlib import Path

import numpy as np

HEADER = struct.Struct(">4sBIH")  # Magic, version, retained count, step in 0.1 mm.
MAGIC = b"PQL1"
MAX_COUNT = 1_000_000


def encode(units, step):
    if not isinstance(step, int) or not 1 <= step <= 65535:
        raise ValueError("Step must be a positive uint16 integer in tenths of mm.")
    if len(units) > MAX_COUNT or any(not isinstance(u, int) or not 0 <= u <= 65535
                                    for u in units):
        raise ValueError("Expected at most one million uint16 measurements.")
    indices = [(2 * u + step) // (2 * step) for u in units]
    raw = struct.pack(">" + "H" * len(indices), *indices)
    payload = zlib.compress(raw, level=6, wbits=15)
    return HEADER.pack(MAGIC, 1, len(units), step) + payload


def decode(message):
    if len(message) < HEADER.size:
        raise ValueError("Missing quantization header.")
    magic, version, count, step = HEADER.unpack(message[:HEADER.size])
    if magic != MAGIC or version != 1 or count > MAX_COUNT or step == 0:
        raise ValueError("Unsupported or invalid quantization header.")
    decoder = zlib.decompressobj(wbits=15)
    try:
        raw = decoder.decompress(message[HEADER.size:], 2 * count + 1)
    except zlib.error as error:
        raise ValueError("Invalid compressed index stream.") from error
    if not decoder.eof or decoder.unused_data or decoder.unconsumed_tail or len(raw) != 2 * count:
        raise ValueError("Truncated, oversized or trailing index stream.")
    indices = struct.unpack(">" + "H" * count, raw)
    return [index * step for index in indices], step


def load_measurements():
    rows, units, omitted = [], [], []
    with Path(__file__).with_name("penguins.csv").open(encoding="utf-8", newline="") as file:
        records = list(csv.DictReader(file))
    for row_number, record in enumerate(records, start=1):
        value = record["bill_length_mm"]
        if value in ("", "NA"):
            omitted.append(row_number)
            continue
        scaled = Decimal(value) * 10
        if not scaled.is_finite() or scaled != scaled.to_integral_value() or scaled < 0:
            raise ValueError("Measurement is not a finite nonnegative tenth of mm.")
        rows.append(row_number)
        units.append(int(scaled))
    return len(records), rows, units, omitted


def main():
    count, rows, units, omitted = load_measurements()
    print("total / retained / omitted rows", count, len(units), omitted)
    print("zlib build / runtime", zlib.ZLIB_VERSION, zlib.ZLIB_RUNTIME_VERSION)
    print("header bytes / raw uint16 baseline", HEADER.size, 2 * len(units))
    for step in (1, 5, 10, 20):
        message = encode(units, step)
        reconstructed, decoded_step = decode(message)
        indices = (2 * np.array(units, dtype=np.int64) + step) // (2 * step)
        assert reconstructed == (indices * step).tolist() and decoded_step == step
        residuals = [u - v for u, v in zip(units, reconstructed)]
        mse = sum(d * d for d in residuals) / (100 * len(units))
        maximum = max(abs(d) for d in residuals) / 10
        print("step / MSE mm^2 / max error mm / payload bytes / total bytes / bits per value",
              step, round(mse, 9), maximum, len(message) - HEADER.size,
              len(message), round(8 * len(message) / len(units), 9))
        print("first row / original mm / decoded mm", rows[0], units[0] / 10,
              reconstructed[0] / 10)
    assert decode(encode([], 5)) == ([], 5)
    assert decode(encode([5, 15, 25], 10))[0] == [10, 20, 30]
    for malformed in (b"", message[:-1], message + b"\x00"):
        try:
            decode(malformed)
        except ValueError:
            pass
        else:
            raise AssertionError("Malformed stream accepted.")


if __name__ == "__main__":
    main()
