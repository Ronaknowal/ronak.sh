"""Stable probabilities and a complete categorical decoding loop.

python sampling.py
Requires NumPy. The default output uses constructed logits, not a language model.
"""

import json
import numpy as np


def log_probabilities(logits, temperature=1.0):
    scores = np.asarray(logits, dtype=np.float64)
    if scores.ndim != 1 or not np.isfinite(temperature) or temperature <= 0:
        raise ValueError("Expected one score row and a positive finite temperature")
    if np.isnan(scores).any() or np.isposinf(scores).any() or not np.isfinite(scores).any():
        raise ValueError("Scores need at least one finite candidate and no NaN/+infinity")
    shifted = (scores - scores.max()) / temperature
    return shifted - np.log(np.exp(shifted).sum())


def probabilities(logits, temperature=1.0):
    return np.exp(log_probabilities(logits, temperature))


def entropy(probabilities_row):
    positive = np.asarray(probabilities_row, dtype=np.float64)
    positive = positive[positive > 0]
    return float(-np.sum(positive * np.log(positive)))


def categorical(probabilities_row, uniform):
    """Choose the half-open probability interval containing uniform in [0, 1)."""
    p = np.asarray(probabilities_row, dtype=np.float64)
    if not 0 <= uniform < 1 or np.any(p < 0) or not np.isclose(p.sum(), 1):
        raise ValueError("Invalid categorical distribution or uniform draw")
    # Close rounding residue on the final positive interval, never a masked ID.
    support = np.flatnonzero(p > 0)
    cumulative = np.cumsum(p[support])
    cumulative[-1] = 1.0
    return int(support[np.searchsorted(cumulative, uniform, side="right")])


def decode(logits_function, prompt_ids, transform, max_new_tokens=32,
           eos_id=None, seed=17, greedy=False, top_count=8):
    """Model -> score transform -> choice -> prefix feedback, until EOS or cap."""
    if max_new_tokens < 0:
        raise ValueError("Negative generation cap")
    prefix = list(prompt_ids)
    rng = np.random.default_rng(seed)
    generated, steps = [], []
    reason = "cap"
    for position in range(max_new_tokens):
        logits = np.asarray(logits_function(prefix), dtype=np.float64).copy()
        log_p = log_probabilities(logits)
        p = np.exp(log_p)
        processed = transform(logits.copy(), prefix)
        transformed_log_q = log_probabilities(processed)  # Validate even for greedy.
        uniform = None if greedy else float(rng.random())
        if greedy:
            token = int(np.argmax(processed))
            q = np.zeros(len(processed))
            q[token] = 1.0
            selected_log_q = 0.0
        else:
            log_q = transformed_log_q
            q = np.exp(log_q)
            token = categorical(q, uniform)
            selected_log_q = float(log_q[token])
        shown = np.argsort(-q, kind="stable")[:top_count]
        steps.append({
            "position": position,
            "prefix_ids": prefix.copy(),
            "selected_id": token,
            "uniform": uniform,
            "log_p": float(log_p[token]),
            "log_q": selected_log_q,
            "entropy_q": entropy(q),
            "support": 1 if greedy else int(np.isfinite(processed).sum()),
            "eligible_scores": int(np.isfinite(processed).sum()),
            "top": [{"id": int(i), "p": float(p[i]), "q": float(q[i])}
                    for i in shown],
        })
        generated.append(token)
        prefix.append(token)
        if token == eos_id:
            reason = "eos"
            break
    return {"ids": generated, "stop_reason": reason, "steps": steps,
            "log_p": sum(row["log_p"] for row in steps),
            "log_q": sum(row["log_q"] for row in steps)}


def main():
    p = np.array([.5, .25, .125, .0625, .0625])
    print(json.dumps({"probabilities": p.tolist(), "u": .72,
                      "selected_id": categorical(p, .72),
                      "temperature_half": probabilities(np.log(p), .5).tolist(),
                      "entropy_nats": entropy(p)}, indent=2))


if __name__ == "__main__":
    main()
