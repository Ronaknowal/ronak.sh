"""New explicit composition parity; no training or historical receipt writes."""
from pathlib import Path
import hashlib
import importlib.util
import json
import math
import runpy
import torch
from torch.nn import functional as F
from torch.nn.utils.rnn import pad_packed_sequence, pack_padded_sequence

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public/learn-code/sequence-to-sequence-encoder-decoder"
OUT = ROOT / "docs/teaching/deep-learning-beginner/sequence-to-sequence-encoder-decoder/reading-flow-native.json"
torch.set_num_threads(1)
spec = importlib.util.spec_from_file_location("explicit_inflector", ASSETS / "explicit-inflector.py")
explicit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(explicit)
protocol = explicit.protocol
report = {"passed": False, "torch": torch.__version__, "groups": [], "max_error": 0.0}


def compare(actual, expected):
    torch.testing.assert_close(actual, expected, rtol=1e-10, atol=1e-10)
    finite = torch.isfinite(actual) & torch.isfinite(expected)
    if finite.any():
        report["max_error"] = max(report["max_error"], float((actual[finite] - expected[finite]).abs().max().detach()))


records = [
    {"lemma": "a", "feature": "past", "form": "a"},
    {"lemma": "zzzzzzzzzzzz", "feature": "third_person", "form": "ab"},
    {"lemma": "walk", "feature": "participle", "form": "walking"},
    {"lemma": "azerty", "feature": "past", "form": "azerty"},
]
source, lengths, inputs, target = protocol.batch(records)
for seed in (7, 19):
    torch.manual_seed(seed)
    native = protocol.Inflector().double()
    scratch = explicit.ExplicitInflector().double()
    scratch.load_state_dict(native.state_dict())
    # Nonzero separate biases, unsorted lengths and shared input/output embedding.
    native_scores, scratch_scores = native(source, lengths, inputs), scratch(source, lengths, inputs)
    compare(scratch_scores, native_scores)
    compare(scratch.encode(source, lengths), native.encode(source, lengths))
    packed_outputs, _ = native.encoder(pack_padded_sequence(native.embedding(source), lengths, batch_first=True, enforce_sorted=False))
    valid_history, _ = pad_packed_sequence(packed_outputs, batch_first=True)
    dense_history, _ = scratch.encoder(scratch.embedding(source))
    for row, length in enumerate(lengths):
        compare(dense_history[row, :length], valid_history[row, :length])
    native_loss = F.cross_entropy(native_scores.flatten(0, 1), target.flatten(), ignore_index=0)
    scratch_loss = F.cross_entropy(scratch_scores.flatten(0, 1), target.flatten(), ignore_index=0)
    compare(scratch_loss, native_loss)
    native_loss.backward(); scratch_loss.backward()
    for name, parameter in native.named_parameters():
        compare(dict(scratch.named_parameters())[name].grad, parameter.grad)
    assert torch.count_nonzero(scratch.embedding.weight.grad[0]) == 0
    report["groups"].append(f"seed{seed}: valid histories, contexts, logits, loss and all11 parameter gradients")

    # Ignored storage cannot affect the selected real source context.
    disturbed = source.clone()
    for row, length in enumerate(lengths):
        disturbed[row, length:] = protocol.INDEX["z"]
    compare(scratch.encode(disturbed, lengths), scratch.encode(source, lengths))
    extra_inputs = torch.cat([inputs, torch.zeros(len(records), 3, dtype=torch.long)], dim=1)
    extra_target = torch.cat([target, torch.zeros(len(records), 3, dtype=torch.long)], dim=1)
    padded_loss = F.cross_entropy(scratch(source, lengths, extra_inputs).flatten(0, 1), extra_target.flatten(), ignore_index=0)
    compare(padded_loss, scratch_loss.detach())
    state = scratch.encode(source, lengths).detach()
    scratch.zero_grad(set_to_none=True)
    history, _ = scratch.decoder(scratch.embedding(inputs), state)
    F.cross_entropy(scratch.output_logits(history).flatten(0, 1), target.flatten(), ignore_index=0).backward()
    assert all(parameter.grad is None for parameter in scratch.encoder.parameters())
    report["groups"].append(f"seed{seed}: source/target PAD nulls and detached encoder-gradient absence")

    # Nonzero decoder initial state and input-vector gradients, including a short tail.
    vectors = torch.randn(3, 7, 24, dtype=torch.float64, requires_grad=True)
    other_vectors = vectors.detach().clone().requires_grad_()
    initial = torch.randn(1, 3, 64, dtype=torch.float64, requires_grad=True)
    other_initial = initial.detach().clone().requires_grad_()
    native.zero_grad(set_to_none=True); scratch.zero_grad(set_to_none=True)
    whole, final = native.decoder(vectors, initial)
    parts, state = [], other_initial
    for chunk in other_vectors.split(3, dim=1):
        history, state = scratch.decoder(chunk, state)
        parts.append(history)
    actual = torch.cat(parts, dim=1)
    compare(actual, whole); compare(state, final)
    (whole.square().mean() + final.square().mean()).backward()
    (actual.square().mean() + state.square().mean()).backward()
    compare(other_vectors.grad, vectors.grad); compare(other_initial.grad, initial.grad)
    for name, parameter in native.decoder.named_parameters():
        compare(dict(scratch.decoder.named_parameters())[name].grad, parameter.grad)
    report["groups"].append(f"seed{seed}: nonzero initial state, both biases, chunks3/3/1, input/state/all decoder gradients")

weights = json.loads((ASSETS / "seed-one-inference.json").read_text())["weights"]
state_dict = {name: torch.tensor(value, dtype=torch.float64) for name, value in weights.items()}
native, scratch = protocol.Inflector().double(), explicit.ExplicitInflector().double()
native.load_state_dict(state_dict); scratch.load_state_dict(state_dict)
queries = [{"lemma": "lactate", "feature": "past"}, {"lemma": "emmove", "feature": "past"}]
for cap in (3, 16):
    expected = protocol.greedy(native, queries, max_output=cap)
    actual = protocol.greedy(scratch, queries, max_output=cap)
    for row, (left, right) in enumerate(zip(actual, expected)):
        assert left["tokens"] == right["tokens"]
        assert left["ended_with_eos"] == right["ended_with_eos"]
        assert abs(left["log_probability"] - right["log_probability"]) < 1e-10
        separate = protocol.greedy(scratch, [queries[row]], max_output=cap)[0]
        assert separate["tokens"] == left["tokens"]
        assert abs(separate["log_probability"] - left["log_probability"]) < 1e-10
for query in queries:
    for width in (1, 2, 3):
        left, right = protocol.beam(scratch, query, width=width), protocol.beam(native, query, width=width)
        assert left["tokens"] == right["tokens"]
        assert abs(left["log_probability"] - right["log_probability"]) < 1e-10
report["groups"].append("Fixed saved weights: active greedy outputs/scores, independent source ownership, cap/EOS and beam1/2/3")

base = [{"lemma": "care", "feature": "past", "form": "cared"}]
changed = [{"lemma": "care", "feature": "past", "form": "carts"}]
sx, sl, di, _ = protocol.batch(base)
_, _, edited, _ = protocol.batch(changed)
before, after = scratch(sx, sl, di), scratch(sx, sl, edited)
compare(before[:, :4], after[:, :4])
assert not torch.allclose(before[:, 4:, 2:], after[:, 4:, 2:])
report["groups"].append("Future target edit leaves current/earlier distributions fixed and changes the following input")

scores = torch.tensor([[0., 0., -torch.inf]])
label = torch.tensor([0])
plain = F.cross_entropy(scores, label).item()
naive = F.cross_entropy(scores, label, label_smoothing=.1).item()
restricted = F.cross_entropy(scores[:, :2], label, label_smoothing=.1).item()
assert abs(plain - math.log(2)) < 1e-7 and math.isinf(naive) and plain == restricted
report["support_smoothing"] = {"plain": plain, "all_classes_smoothing": "infinity", "allowed_classes_smoothing": restricted}
report["groups"].append("Output-support restricted smoothing differs from target position ignore-index")
report["sourceHashes"] = {str(file.relative_to(ROOT)).replace("\\", "/"): hashlib.sha256(file.read_bytes()).hexdigest()
    for file in [ASSETS / "explicit-inflector.py", ASSETS / "inflection-seq2seq.py", ASSETS / "seed-one-inference.json",
                 ROOT / "public/learn-assets/rnns-lstms-grus/recurrent-cells.py", Path(__file__).resolve()]}
report["passed"] = True
report["limits"] = "CPU float64 native parity, not a training rerun or GPU speed benchmark. Compare valid/active histories and emitted outputs; native historical greedy can advance already-ended hidden rows. Browser/source review separate."
OUT.write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps({"passed": True, "groups": len(report["groups"]), "max_error": report["max_error"]}))
