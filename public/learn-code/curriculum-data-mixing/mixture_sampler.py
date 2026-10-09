"""A checkpointable single-worker mixture of records. Python standard library.

Run: python mixture_sampler.py
Policies: first_exhausted stops when a selected domain is exhausted; wrap cycles;
once removes exhausted domains and renormalizes. Fixed external budget for wrap.
This transparent implementation does not promise Hugging Face's exact stop index.
"""
import copy
import json
import math
import random


class MixtureSampler:
    def __init__(self, domains, probabilities, seed=17, policy="wrap"):
        if policy not in {"wrap", "once", "first_exhausted"}:
            raise ValueError("Unknown policy")
        if not domains or len(domains) != len(probabilities):
            raise ValueError("One probability per nonempty domain list required")
        self.domains = copy.deepcopy(domains)
        self.probabilities = [float(x) for x in probabilities]
        if any(not math.isfinite(x) or x < 0 for x in self.probabilities) or sum(self.probabilities) <= 0:
            raise ValueError("Probabilities must have positive finite mass")
        if any(p > 0 and not d for p, d in zip(self.probabilities, domains)):
            raise ValueError("Positive probability requires data")
        self.policy = policy
        self.rng = random.Random(seed)
        self.order = [list(range(len(d))) for d in domains]
        for order in self.order:
            self.rng.shuffle(order)
        self.cursor = [0] * len(domains)
        self.epoch = [0] * len(domains)
        self.stopped = False
        self.records = [0] * len(domains)
        self.targets = [0] * len(domains)

    def __iter__(self):
        return self

    def __next__(self):
        if self.stopped:
            raise StopIteration
        weights = self.probabilities.copy()
        if self.policy == "once":
            weights = [p if c < len(o) else 0 for p, c, o in zip(weights, self.cursor, self.order)]
        if sum(weights) == 0:
            self.stopped = True
            raise StopIteration
        domain = self.rng.choices(range(len(weights)), weights=weights, k=1)[0]
        if self.cursor[domain] == len(self.order[domain]):
            if self.policy == "first_exhausted":
                self.stopped = True
                raise StopIteration
            self.rng.shuffle(self.order[domain])
            self.cursor[domain] = 0
            self.epoch[domain] += 1
        index = self.order[domain][self.cursor[domain]]
        self.cursor[domain] += 1
        record = copy.deepcopy(self.domains[domain][index])
        length = record["eligible_targets"]
        if isinstance(length, bool) or not isinstance(length, int) or length < 0:
            raise ValueError("eligible_targets must be a nonnegative integer")
        self.records[domain] += 1
        self.targets[domain] += length
        return {"domain": domain, "epoch": self.epoch[domain], **record}

    def state_dict(self):
        return copy.deepcopy({"schema": 1, "domains": self.domains,
                              "probabilities": self.probabilities, "policy": self.policy,
                              "rng": self.rng.getstate(), "order": self.order,
                              "cursor": self.cursor, "epoch": self.epoch,
                              "records": self.records, "targets": self.targets,
                              "stopped": self.stopped})

    @classmethod
    def from_state(cls, state):
        state = copy.deepcopy(state)
        if state["schema"] != 1:
            raise ValueError("Unsupported checkpoint schema")
        obj = cls(state["domains"], state["probabilities"], policy=state["policy"])
        # JSON transforms RNG tuples into lists; Python Random requires tuples.
        def tuples(value):
            return tuple(tuples(x) for x in value) if isinstance(value, list) else value
        obj.rng.setstate(tuples(state["rng"]))
        for key in ("order", "cursor", "epoch", "records", "targets", "stopped"):
            setattr(obj, key, state[key])
        return obj


def fixture():
    return [[{"id": f"A{i}", "eligible_targets": 2} for i in range(2)],
            [{"id": f"B{i}", "eligible_targets": 8} for i in range(4)]]


def main():
    stream = MixtureSampler(fixture(), [.5, .5])
    prefix = [next(stream) for _ in range(5)]
    checkpoint = json.loads(json.dumps(stream.state_dict()))
    suffix = [next(stream) for _ in range(12)]
    restored = MixtureSampler.from_state(checkpoint)
    resumed = [next(restored) for _ in range(12)]
    assert resumed == suffix
    once = list(MixtureSampler(fixture(), [.5, .5], policy="once"))
    print(json.dumps({"prefix": prefix, "resume_matches": resumed == suffix,
                      "once_ids": [r["id"] for r in once],
                      "wrap_records": stream.records, "wrap_targets": stream.targets}, indent=2))


if __name__ == "__main__":
    main()
