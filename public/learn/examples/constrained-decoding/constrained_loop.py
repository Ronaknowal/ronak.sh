"""A complete finite-grammar decode loop with model-prefix feedback.

python constrained_loop.py
Requires NumPy, adjacent automata.py/token_index.py, and the exact sampling.py
from the preceding Decoding Strategies lesson. The supplied score provider is
a deterministic teaching fixture, not a trained language model.
"""

import json
import numpy as np
from automata import decimal_dfa
from token_index import TokenIndex
from sampling import probabilities, categorical


def decode(score_provider, index, cap=8, seed=17, greedy=False, canceled=None):
    if not isinstance(cap, int) or cap < 0:
        raise ValueError("Use a nonnegative integer cap")
    state, prefix, trace = 0, [], []
    rng = np.random.default_rng(seed)
    reason = "cap"
    for position in range(cap):
        if canceled is not None and canceled(tuple(prefix)):
            reason = "canceled"
            break
        # The complete chosen prefix reaches the model, even after forced steps.
        scores = np.asarray(score_provider(tuple(prefix)), dtype=np.float64)
        if scores.shape != (len(index.vocabulary),):
            raise ValueError("One logit per vocabulary ID required")
        if np.isnan(scores).any() or np.isposinf(scores).any():
            raise ValueError("NaN or positive infinity in model logits")
        destinations = index.next_tokens(state)
        masked = np.full(scores.shape, -np.inf)
        for token in destinations:
            masked[token] = scores[token]
        if not np.isfinite(masked).any():
            reason = "empty-support"
            break
        q = probabilities(masked)
        token = (
            int(np.argmax(masked)) if greedy else categorical(q, float(rng.random()))
        )
        following = destinations[token]
        trace.append(
            {
                "position": position,
                "prefix_ids": prefix.copy(),
                "state_before": state,
                "allowed_ids": sorted(destinations),
                "probabilities_after_mask": q.tolist(),
                "selected_id": token,
                "state_after": following,
            }
        )
        prefix.append(token)
        if following == -2:
            reason = "eos"
            break
        state = following
    data = b"".join(index.vocabulary[token] or b"" for token in prefix)
    try:
        text = data.decode("utf-8")
        utf8_status = "complete"
    except UnicodeDecodeError as error:
        text = None
        utf8_status = (
            "incomplete-prefix"
            if error.reason == "unexpected end of data" and error.end == len(data)
            else "invalid"
        )
    return {
        "ids": prefix,
        "raw_bytes_hex": data.hex(),
        "text": text,
        "utf8_status": utf8_status,
        "stop_reason": reason,
        "completed": state in index.dfa.accepting,
        "trace": trace,
    }


def main():
    vocabulary = [b"abc", b"42", b"7", b"3x", None]
    index = TokenIndex(decimal_dfa(), vocabulary)

    def scores(prefix):
        return np.log(
            [0.4, 0.25, 0.2, 0.1, 0.05] if not prefix else [0.05, 0.05, 0.05, 0.05, 0.8]
        )

    result = decode(scores, index, greedy=True)
    assert result["ids"] == [1, 4] and result["stop_reason"] == "eos"
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
