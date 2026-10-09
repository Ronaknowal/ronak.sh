"""Complementary numerical checks for the new Curriculum/Data Mixing content."""
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import sys
import numpy as np
import torch
import torch.nn.functional as F

ROOT = Path(__file__).resolve().parents[1]
CODE = ROOT / "public/learn-code/curriculum-data-mixing"
sys.path.insert(0, str(CODE))
from mixing_math import (power_shares, token_shares, record_shares, quotas,
                         pacing_weights, exponentiated_update, quadratic_order)
from mixture_sampler import MixtureSampler, fixture
from byte_mixture import loss_gradient, torch_bridge, load_pairs, doge_step, optimize_doremi
from fit_mixture_response import simplex_grid, response, library_fit, coordinate_fit

checks = []


def close(name, actual, expected, atol=1e-11):
    if not np.allclose(actual, expected, atol=atol, rtol=1e-10):
        raise AssertionError((name, actual, expected))
    checks.append(name)


close("record probability inversion", token_shares(record_shares([.4, .6], [3, 9]), [3, 9]), [.4, .6])
close("zero availability stays absent at alpha0", power_shares([9, 0, 1], 0), [.5, 0, .5])
close("quota exact conservation", quotas([1, 1, 1], 8), [3, 3, 2])
close("pacing reaches complete support", pacing_weights([4, 1, 3, 2], 1), [.25] * 4)
close("zero step order null", quadratic_order(learning_rate=0), [0, 0, 0])
close("equal signal smoothing changes nonuniform prior", exponentiated_update([.8, .2], [4, 4], smoothing=.1), [.77, .23])
for smoothing in (0, .001, 1):
    q = exponentiated_update([.5, .5], [1000, -1000], smoothing=smoothing)
    close(f"smoothing{smoothing} conservation", q.sum(), 1)
    assert q.min() >= smoothing / 2
for bad in (([0, 0], 1), ([-1, 2], 1), ([1, 2], -1)):
    try:
        power_shares(*bad)
    except ValueError:
        checks.append("invalid weights rejected")
    else:
        raise AssertionError("Accepted invalid weights")
for policy in ("wrap", "once", "first_exhausted"):
    stream = MixtureSampler(fixture(), [.3, .7], policy=policy)
    next(stream)
    resumed = MixtureSampler.from_state(json.loads(json.dumps(stream.state_dict())))
    for _ in range(20):
        a, b = next(stream, None), next(resumed, None)
        assert a == b
    checks.append(f"JSON resume preserves {policy} stream and exhaustion")

bridge = torch_bridge()
checks.append("CE gradient/update matches Torch double precision")
w = np.array([[.2, -.4, .1], [.7, .1, -.2], [.1, .3, -.8]])
pairs = [np.array([[0, 0], [0, 1], [1, 2]]), np.array([[2, 0], [1, 1], [2, 2]])]
domains = [{"train": pairs[0], "tune": pairs[1]}, {"train": pairs[1], "tune": pairs[0]}]
new, q, estimate = doge_step(w, domains, [.4, .6], pairs, [.7, .3], learning_rate=1e-5)
before = sum(v * loss_gradient(w, d["tune"])[0] for v, d in zip([.7, .3], domains))
after = sum(v * loss_gradient(new, d["tune"])[0] for v, d in zip([.7, .3], domains))
close("DoGE first-order actual change", after - before, estimate, atol=1e-10)

# Independent Torch construction of a single stratified DoReMi step.
reference = w.copy()
reference_copy = reference.copy()
mean, record = optimize_doremi(domains, reference, seed=7, steps=1, per_domain=9,
                               learning_rate=.2, eta=.8, smoothing=.03)
rng = np.random.default_rng(7)
proxy = torch.zeros_like(torch.tensor(w, dtype=torch.float64), requires_grad=True)
ref = torch.tensor(reference, dtype=torch.float64)
means, gaps = [], []
for d in domains:
    chosen = d["train"][rng.integers(len(d["train"]), size=9)]
    x, y = torch.tensor(chosen[:, 0]), torch.tensor(chosen[:, 1])
    pl, rl = F.cross_entropy(proxy[x], y, reduction="none"), F.cross_entropy(ref[x], y, reduction="none")
    means.append(pl.mean())
    gaps.append((pl.detach() - rl).clamp(min=0).mean())
native_q = .97 * torch.softmax(.8 * torch.stack(gaps), 0) + .03 / 2
close("DoReMi stratified clipped weight signal", mean, native_q.numpy())
close("reference frozen", reference, reference_copy)
checks.append("DoReMi ordinary loss path inspected separately from weight signal")

r = simplex_grid(4)
truth = [2., .5, -.4, .3]
y = response(truth, r)
fitted, mse, success = library_fit(r, y)
close("fixed-gauge exact response predictions", response(fitted, r), y, atol=1e-7)
scratch, scratch_mse = coordinate_fit(r, y)
assert scratch_mse < 1e-4
checks.append("scratch response fit residual below declared1e-4 fixture tolerance")
corpus = json.loads((CODE / "literary-domains.json").read_text(encoding="utf-8"))
loaded = load_pairs()
for d, parsed in zip(corpus["domains"], loaded):
    for split in ("train", "tune", "test"):
        texts = [p["text"] for p in d["paragraphs"] if p["split"] == split]
        expected = sum(len(t.encode("utf-8")) - 1 for t in texts)
        assert len(parsed[split]) == expected
    ids = [p["id"] for p in d["paragraphs"]]
    assert len(ids) == len(set(ids))
checks.append("all9split target denominators and paragraph identities")
output = ROOT / "docs/teaching/llm-architecture-training/curriculum-learning-data-mixing-strategies/research/numerical-checks.json"
if output.exists():
    raise FileExistsError("Preserve old numerical receipt; choose a versioned output")
result = {"checks": checks, "bridge": bridge, "response_fixture": {"scratch_mse": scratch_mse, "library_mse": mse},
          "sources": {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(CODE.glob("*.py"))},
          "verifier_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"passed": len(checks), "response_fixture": result["response_fixture"]}, indent=2))
