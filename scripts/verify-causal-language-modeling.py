"""Independent bounded references for the causal lesson; no training or network."""
import copy
import hashlib
import json
import math
from pathlib import Path
import sys
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public/learn-code/causal-language-modeling"
sys.path.insert(0, str(PUBLIC))
import torch
from tiny_causal_lm import TinyLM, CausalAttention, score, bigram_score, generate
from score_windows import score_each_target

torch.set_num_threads(2)
torch.manual_seed(41)
model = TinyLM(8, context=4, width=8, heads=2, layers=1).eval()
for length in (0, 1):
    ids = torch.ones(length, dtype=torch.long)
    for result in (score(model, ids), bigram_score(torch.tensor([1, 2]), ids, 8)):
        assert result == {"nll_sum": 0.0, "targets": 0, "mean_nats": None, "perplexity": None}
    assert score_each_target(model, ids) == {"records": [], "sum": 0, "count": 0, "perplexity": None}

for length in (2, 4, 5, 6, 11):
    ids = torch.arange(length) % 8
    serial, batched = score_each_target(model, ids), score(model, ids, batch_size=2)
    assert [r["target_position"] for r in serial["records"]] == list(range(1, length))
    assert batched["targets"] == length - 1
    assert math.isclose(serial["sum"], batched["nll_sum"], rel_tol=1e-6)

original, perturbed = torch.tensor([[1, 2, 3, 4]]), torch.tensor([[1, 2, 7, 6]])
torch.testing.assert_close(model(original)[:, :2], model(perturbed)[:, :2])
attention = CausalAttention(8, 2).double()
fused = copy.deepcopy(attention)
x = torch.randn(2, 4, 8, dtype=torch.float64, requires_grad=True)
y = x.detach().clone().requires_grad_(True)
a, b = attention(x), fused(y, fused=True)
torch.testing.assert_close(a, b)
a.square().sum().backward()
b.square().sum().backward()
torch.testing.assert_close(x.grad, y.grad)
for p, q in zip(attention.parameters(), fused.parameters()):
    torch.testing.assert_close(p.grad, q.grad)

for prompt, temperature in ((torch.ones(2, 2, dtype=torch.long), 1),
                            (torch.ones(1, 0, dtype=torch.long), 1),
                            (torch.ones(1, 2, dtype=torch.long), 0),
                            (torch.ones(1, 2, dtype=torch.long), -1)):
    try:
        generate(model, prompt, 2, temperature=temperature)
    except ValueError:
        pass
    else:
        raise AssertionError("Invalid generation input accepted")

class AlwaysEOS:
    context = 4
    def eval(self):
        return self
    def __call__(self, ids):
        logits = torch.zeros((*ids.shape, 8))
        logits[..., 7] = 10
        return logits

assert generate(AlwaysEOS(), torch.tensor([[1, 2]]), 10, greedy=True, eos=7).tolist() == [[1, 2, 7]]
train_text = (PUBLIC / "alice-train.txt").read_text(encoding="utf-8")
heldout_text = (PUBLIC / "alice-heldout.txt").read_text(encoding="utf-8")
lookup = {c: i + 1 for i, c in enumerate(sorted(set(train_text)))}
train = [lookup.get(c, 0) for c in train_text]
heldout = [lookup.get(c, 0) for c in heldout_text]
pairs, contexts = Counter(zip(train, train[1:])), Counter(train[:-1])
vocab = len(lookup) + 1
reference = -sum(math.log((pairs[a, b] + .5) / (contexts[a] + .5 * vocab)) for a, b in zip(heldout, heldout[1:]))
study = json.loads((PUBLIC / "study.json").read_text(encoding="utf-8"))
assert math.isclose(reference, study["bigram"]["nll_sum"], rel_tol=1e-12)
for point in study["history"]:
    for split in ("train", "heldout"):
        stats = point[split]
        assert math.isclose(stats["nll_sum"] / stats["targets"], stats["mean_nats"])
        assert math.isclose(math.exp(stats["mean_nats"]), stats["perplexity"])
for name in ("alice-train.txt", "alice-heldout.txt", "alice-provenance.json"):
    assert (PUBLIC / name).read_bytes() == (ROOT / "public/learn-code/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram" / name).read_bytes()

print(json.dumps({"passed": True, "checks": ["empty and singleton targets", "exact-once scoring varied lengths",
    "future perturbation invariance", "explicit attention versus SDPA outputs and gradients", "generation input boundaries and EOS",
    "independent bigram count reference", "saved study arithmetic", "unchanged source corpus"],
    "torch": torch.__version__, "program_sha256": {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
    for p in sorted(PUBLIC.glob("*.py"))}}, indent=2))
