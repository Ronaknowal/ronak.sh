"""History-dependent score transformations and token-spanning stop strings.

python history_and_stops.py
The default inputs are finite constructed examples, not model outputs.
"""

import json
import numpy as np
from sampling import probabilities


def repetition(scores, previous_ids, penalty=1.2):
    if not np.isfinite(penalty) or penalty <= 0:
        raise ValueError("Repetition penalty must be positive and finite")
    result = np.asarray(scores, dtype=np.float64).copy()
    seen = np.unique(previous_ids).astype(int)
    values = result[seen]
    result[seen] = np.where(values < 0, values * penalty, values / penalty)
    return result


def token_bias(scores, token_id, bias):
    result = np.asarray(scores, dtype=np.float64).copy()
    result[token_id] += bias
    probabilities(result)
    return result


def ngram_bans(history, size=2):
    if size < 1:
        raise ValueError("N-gram size must be positive")
    mapping = {}
    for start in range(len(history) - size + 1):
        prefix = tuple(history[start:start + size - 1])
        mapping.setdefault(prefix, set()).add(history[start + size - 1])
    current = tuple(history[-(size - 1):]) if size > 1 else ()
    return mapping, mapping.get(current, set())


def no_repeat(scores, history, size=2):
    _, banned = ngram_bans(history, size)
    result = np.asarray(scores, dtype=np.float64).copy()
    result[list(banned)] = -np.inf
    probabilities(result)
    return result


def stop_overlap(previous_text, current_text, stop_strings):
    """Recognize a newly completed stop; do not match only an older occurrence.

    This transparent string version illustrates the operation. A real tokenizer
    may revise trailing decoded characters; current_text is its full decode.
    Native StopStringCriteria precomputes token overlap tables instead.
    """
    if not current_text.startswith(previous_text):
        raise ValueError("This simple demonstration requires monotone decoded text")
    matches = []
    for stop in stop_strings:
        if not stop:
            raise ValueError("Empty stop string")
        start = current_text.find(stop)
        while start >= 0:
            end = start + len(stop)
            if end > len(previous_text):
                matches.append((start, end, stop))
            start = current_text.find(stop, start + 1)
    if not matches:
        return None
    start, end, stop = min(matches, key=lambda item: (item[1], item[0], item[2]))
    return {"stop": stop, "start": start, "end": end,
            "returned_text": current_text, "trimmed_text": current_text[:start],
            "overhang": current_text[end:]}


def main():
    text = ""
    trace = []
    for token in ["s", "to", "pped"]:
        updated = text + token
        trace.append({"token": token, "decoded": updated,
                      "match": stop_overlap(text, updated, ["stop"])})
        text = updated
    print(json.dumps({"penalized": repetition([2, 1, -1], [0, 0, 2]).tolist(),
                      "banned_after_New": sorted(ngram_bans([0, 1, 0], 2)[1]),
                      "stop_trace": trace}, indent=2))


if __name__ == "__main__":
    main()
