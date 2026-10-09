"""A complete conditional speculative loop with explicit proposals and stops.

python speculative_decode.py
The default demonstration uses finite prefix-dependent distributions. Model
execution and real cache rollback live in speculative_cache.py, not this oracle.
"""

import json
import numpy as np
from speculative_math import categorical, distribution, residual, verify_proposal


def finite_policy(prefix, role="target"):
    """A/B/EOS IDs 0/1/2: changing the committed prefix changes the next law."""
    if role not in ("target", "draft"):
        raise ValueError("Unknown role.")
    if not prefix:
        return np.array([.5,.3,.2] if role == "target" else [.2,.6,.2])
    if prefix[-1] == 0:
        return np.array([.2,.5,.3] if role == "target" else [.6,.3,.1])
    return np.array([.4,.1,.5] if role == "target" else [.2,.5,.3])


def generate(target, draft, prompt=(), max_new_tokens=8, lookahead=3,
             eos_id=2, seed=17, greedy=False):
    """Return generated IDs and every accepted/discarded round.

    The oracle accepts a complete committed/candidate prefix and returns the
    already-processed probability law. Its call count is not a neural cost.
    Reserve one remaining output for repair/bonus. The final emitted token is
    not required to be processed into a cache merely to return it to the user.
    """
    if not isinstance(max_new_tokens,int) or max_new_tokens < 0:
        raise ValueError("Output cap must be a nonnegative integer.")
    if not isinstance(lookahead,int) or lookahead < 0:
        raise ValueError("Lookahead must be a nonnegative integer.")
    rng = np.random.default_rng(seed)
    prefix = list(prompt)
    generated, rounds = [], []
    stop = "cap"
    while len(generated) < max_new_tokens:
        committed = prefix.copy()
        remaining = max_new_tokens - len(generated)
        count = min(lookahead, remaining - 1)
        candidates, proposal_rows = [], []
        for _ in range(count):
            q = distribution(draft(committed + candidates))
            token = int(q.argmax()) if greedy else categorical(q, rng.random())
            candidates.append(token)
            proposal_rows.append(q)
            if token == eos_id:
                break
        record = {"prefix": committed, "candidates": candidates.copy(),
                  "tests": [], "accepted": [], "discarded": [], "emitted": []}
        rejected = False
        terminated = False
        for index, (token, q) in enumerate(zip(candidates, proposal_rows)):
            p = distribution(target(prefix))
            if p.shape != q.shape:
                raise ValueError("Target and draft vocabularies differ.")
            uniform = None if greedy else float(rng.random())
            accepted = token == int(p.argmax()) if greedy else verify_proposal(p,q,token,uniform)
            record["tests"].append({"index":index,"context":prefix.copy(),
                                    "p":p.tolist(),"q":q.tolist(),
                                    "uniform":uniform,"accepted":accepted})
            if accepted:
                selected = token
                record["accepted"].append(token)
            else:
                repair = residual(p,q) if not greedy else None
                if not greedy and repair is None:
                    raise ArithmeticError("Rejected an unreachable residual branch.")
                selected = int(p.argmax()) if greedy else categorical(repair,rng.random())
                record["discarded"] = candidates[index:]
                record["repair"] = selected
                rejected = True
            prefix.append(selected)
            generated.append(selected)
            record["emitted"].append(selected)
            if selected == eos_id:
                terminated = True
                stop = "eos"
            if rejected or terminated:
                break
        if not rejected and not terminated:
            p = distribution(target(prefix))
            bonus = int(p.argmax()) if greedy else categorical(p,rng.random())
            prefix.append(bonus)
            generated.append(bonus)
            record["bonus"] = bonus
            record["emitted"].append(bonus)
            if bonus == eos_id:
                terminated = True
                stop = "eos"
        record["accepted_count"] = len(record["accepted"])
        record["emitted_count"] = len(record["emitted"])
        record["stop"] = "eos" if terminated else ("cap" if len(generated)==max_new_tokens else "continue")
        rounds.append(record)
        if terminated:
            break
    return {"ids":generated,"stop":stop,"rounds":rounds,
            "scope":"Finite conditional oracle; no neural timing or cache execution."}


def verify():
    target = lambda prefix: finite_policy(prefix,"target")
    draft = lambda prefix: finite_policy(prefix,"draft")
    cases = []
    for cap in [0,1,2,7]:
        for lookahead in [0,1,3]:
            for greedy in [False,True]:
                result = generate(target,draft,max_new_tokens=cap,lookahead=lookahead,greedy=greedy)
                assert len(result["ids"]) <= cap
                if 2 in result["ids"]:
                    assert result["ids"].index(2)==len(result["ids"])-1
                assert sum(row["emitted_count"] for row in result["rounds"])==len(result["ids"])
                for row in result["rounds"]:
                    assert row["emitted"][:row["accepted_count"]]==row["accepted"]
                    assert not ("repair" in row and "bonus" in row)
                cases.append({"cap":cap,"lookahead":lookahead,"greedy":greedy,"result":result})
    # Equal distributions always accept proposals; accepted EOS has no bonus.
    eos = lambda prefix: np.array([0.,0.,1.])
    result = generate(eos,eos,max_new_tokens=5,lookahead=3)
    assert result["ids"]==[2] and "bonus" not in result["rounds"][0]
    return {"passed":True,"cases":cases,"accepted_eos":result}


if __name__ == "__main__":
    print(json.dumps(verify(),indent=2))
