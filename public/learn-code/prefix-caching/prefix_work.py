"""Count query rows and causal attention pairs, without a latency model."""

import json


def work(length, reused):
    if type(length) is not int or type(reused) is not int or not 0 <= reused <= length:
        raise ValueError("Use integer 0 <= reused <= length.")
    tail = length - reused
    return {
        "length": length,
        "reused": reused,
        "new_query_rows": tail,
        "total_pairs": length * (length + 1) // 2,
        "avoided_pairs": reused * (reused + 1) // 2,
        "prefix_reads": tail * reused,
        "tail_pairs": tail * (tail + 1) // 2,
        "remaining_pairs": tail * reused + tail * (tail + 1) // 2,
    }


def verify():
    rows = [work(length, reused) for length in range(1, 17) for reused in range(length)]
    for row in rows:
        direct = sum(q + 1 for q in range(row["reused"], row["length"]))
        assert direct == row["remaining_pairs"]
        assert row["avoided_pairs"] + direct == row["total_pairs"]
    return {"cases": rows, "anchor": work(10, 8), "changed": work(12, 6)}


if __name__ == "__main__":
    print(json.dumps(verify(), indent=2))
