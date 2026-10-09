"""Pack complete prefill prompts; preserve request and causal boundaries."""
from request_contract import requests_by_id


def pack(requests):
    jobs = list(requests_by_id(requests).values())
    tokens, positions, owners, offsets, last = [], [], [], [0], {}
    for job in jobs:
        tokens.extend(job.prompt)
        positions.extend(range(len(job.prompt)))
        owners.extend([job.request_id] * len(job.prompt))
        offsets.append(len(tokens))
        last[job.request_id] = len(tokens) - 1
    allowed = [[owner == key_owner and key_pos <= position
                for key_owner, key_pos in zip(owners, positions)]
               for owner, position in zip(owners, positions)]
    return {"tokens": tokens, "positions": positions, "owners": owners,
            "offsets": offsets, "last_rows": last, "allowed": allowed}


def scatter_last(packed, row_logits):
    if len(row_logits) != len(packed["tokens"]):
        raise ValueError("one logit row is required per packed input row")
    return {request_id: list(row_logits[index])
            for request_id, index in packed["last_rows"].items()}


def numpy_reference(requests):
    """Ordinary array route for the same complete-prefill construction."""
    import numpy as np
    jobs = list(requests_by_id(requests).values())
    if not jobs:
        return {"offsets": [0], "positions": [], "allowed": [], "last_rows": {}}
    lengths = np.array([len(job.prompt) for job in jobs], dtype=np.int64)
    offsets = np.concatenate(([0], lengths.cumsum()))
    positions = np.concatenate([np.arange(length) for length in lengths])
    owner = np.repeat(np.arange(len(jobs)), lengths)
    allowed = ((owner[:, None] == owner[None, :]) &
               (positions[None, :] <= positions[:, None]))
    return {"offsets": offsets.tolist(), "positions": positions.tolist(),
            "allowed": allowed.tolist(),
            "last_rows": {job.request_id: int(offsets[i + 1] - 1)
                          for i, job in enumerate(jobs)}}


if __name__ == "__main__":
    from request_contract import Request
    jobs = [Request("A", (11, 12, 13), 3), Request("B", (11, 12, 14, 15), 2)]
    result = pack(jobs)
    reference = numpy_reference(jobs)
    assert all(result[key] == value for key, value in reference.items())
    print("offsets", result["offsets"], "last rows", result["last_rows"])
    for row in result["allowed"]:
        print("".join("1" if cell else "." for cell in row))
    print("permuted last rows", pack(jobs[::-1])["last_rows"])
