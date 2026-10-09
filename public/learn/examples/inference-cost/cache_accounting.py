"""Normalize documented usage and trace a declared prefix lifetime scenario."""
from decimal import Decimal, ROUND_CEILING
import json
from pathlib import Path
from request_ledger import request_bill


def normalize_usage(usage):
    """input_tokens excludes creation/read; creation total is a parent subtotal."""
    created = usage["cache_creation_input_tokens"]
    parts = usage.get("cache_creation")
    if created and parts is None:
        raise ValueError("Creation count requires explicit 5m/1h split")
    parts = parts or {"ephemeral_5m_input_tokens": 0, "ephemeral_1h_input_tokens": 0}
    five = parts["ephemeral_5m_input_tokens"]
    hour = parts["ephemeral_1h_input_tokens"]
    if five + hour != created:
        raise ValueError("Creation subfields must sum to the parent total")
    return {"uncached_input": usage["input_tokens"], "cache_creation_5m": five,
            "cache_creation_1h": hour, "cache_read": usage["cache_read_input_tokens"],
            "output": usage["output_tokens"]}


def prefix_requests(starts, prefix_ids, prefix_tokens, suffix_tokens, output_tokens,
                    ttl_seconds, rates, available_delay=0):
    """Each miss creates a pending write; any available unexpired write permits a hit.

    TTL begins at its request start. A hit refreshes the available entry with
    the latest expiry. Overlapping misses cannot cancel an earlier completion.
    """
    if len(starts) != len(prefix_ids) or starts != sorted(starts) or available_delay < 0:
        raise ValueError("Sorted starts and one prefix identity per request are required")
    if ttl_seconds not in (300, 3600):
        raise ValueError("This scenario supports 5m or 1h TTL")
    entries = {}
    rows = []
    for index, (start, identity) in enumerate(zip(starts, prefix_ids)):
        writes = entries.setdefault(identity, [])
        available = [entry for entry in writes
                     if entry["available"] <= start < entry["expires"]]
        stored = max(available, key=lambda entry: entry["expires"]) if available else None
        hit = stored is not None
        counts = {"uncached_input": suffix_tokens, "cache_creation_5m": 0,
                  "cache_creation_1h": 0, "cache_read": 0, "output": output_tokens}
        category = "cache_read" if hit else (
            "cache_creation_5m" if ttl_seconds == 300 else "cache_creation_1h")
        counts[category] = prefix_tokens
        _, amount = request_bill(counts, rates)
        if hit:
            stored["expires"] = start + ttl_seconds
        else:
            stored = {"available": start + available_delay, "expires": start + ttl_seconds}
            writes.append(stored)
        rows.append({"request": index, "start": start, "prefix": identity,
                     "hit": hit, "counts": counts, "usd": str(amount), **stored})
    return {"requests": rows, "total_usd": str(sum((Decimal(row["usd"]) for row in rows), Decimal(0)))}


def read_hit_threshold(write_rate, read_rate, base_rate):
    """Continuous threshold for write+n*read <= (n+1)*base; equality is permitted."""
    write, read, base = map(lambda value: Decimal(str(value)), (write_rate, read_rate, base_rate))
    if write <= base:
        return Decimal(0)
    if read >= base:
        return None
    return max(Decimal(0), (write - base) / (base - read))


def minimum_hits(write_rate, read_rate, base_rate):
    """Smallest nonnegative integer read count meeting the break-even inequality."""
    threshold = read_hit_threshold(write_rate, read_rate, base_rate)
    return None if threshold is None else int(threshold.to_integral_value(rounding=ROUND_CEILING))


def main():
    folder = Path(__file__).parent
    rates = json.loads((folder / "price-snapshot.json").read_text(encoding="utf-8"))["api"]["per_million_tokens"]
    usage = json.loads((folder / "documented-usage.json").read_text(encoding="utf-8"))["usage"]
    counts = normalize_usage(usage)
    parts, amount = request_bill(counts, rates)
    print(json.dumps({"counts": counts, "usd": str(amount),
                      "contributions_usd": {key: str(value) for key, value in parts.items()}}))
    for starts, ttl in (([0, 120, 240], 300), ([0, 360, 720], 300), ([0, 360, 720], 3600)):
        print(json.dumps(prefix_requests(starts, ["A"] * 3, 900, 100, 200, ttl, rates)))
    print(json.dumps({"continuous_read_hit_threshold": str(read_hit_threshold("2.5", ".1", "2")),
                      "minimum_integer_read_hits_after_5m_write": minimum_hits("2.5", ".1", "2")}))


if __name__ == "__main__":
    main()
