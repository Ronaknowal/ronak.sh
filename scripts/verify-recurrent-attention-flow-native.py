"""Fresh differentiable-composition checks; never rewrites historical receipts."""
from pathlib import Path
import importlib.util
import hashlib
import json
import runpy
import torch
from torch.nn.utils.rnn import pack_padded_sequence, pad_packed_sequence

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public/learn-code/attention-mechanism-bahdanau-luong"
RECEIPT = ROOT / "docs/teaching/deep-learning-beginner/attention-mechanism-bahdanau-luong/reading-flow-native.json"


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


explicit = module("explicit_attention_check", ASSETS / "explicit-attentive-inflection.py")
native = explicit.protocol
checks = []


def close(label, actual, expected, tolerance=3e-11):
    if actual.dtype == torch.bool:
        error = float(not torch.equal(actual, expected))
    else:
        assert torch.equal(torch.isneginf(actual), torch.isneginf(expected)), label
        finite = torch.isfinite(actual) & torch.isfinite(expected)
        error = float((actual[finite] - expected[finite]).detach().abs().max()) if finite.any() else 0.
    assert error <= tolerance, (label, error)
    checks.append({"name": label, "max_error": error, "tolerance": tolerance})


torch.set_num_threads(1)
rows = [{"lemma": "try", "feature": "past", "form": "tried"},
        {"lemma": "lactate", "feature": "past", "form": "lactated"},
        {"lemma": "walk", "feature": "participle", "form": "walking"}]
source, lengths, previous, targets = native.batch(rows)
for kind, feeding in [("additive", False), ("general", False), ("general", True)]:
    tag = f"{kind}/feeding={feeding}"
    torch.manual_seed(19)
    reference = native.AttentiveInflector(kind, feeding).double()
    candidate = explicit.ExplicitAttentiveInflector(kind, feeding).double()
    candidate.load_native_state(reference.state_dict())
    a_logits, a_reads = candidate(source, lengths, previous)
    b_logits, b_reads = reference(source, lengths, previous)
    close(tag + "/logits", a_logits, b_logits)
    close(tag + "/reads", a_reads, b_reads)
    loss_a = torch.nn.functional.cross_entropy(a_logits.flatten(0, 1), targets.flatten(), ignore_index=0)
    loss_b = torch.nn.functional.cross_entropy(b_logits.flatten(0, 1), targets.flatten(), ignore_index=0)
    loss_a.backward(); loss_b.backward()
    for name, parameter in candidate.named_parameters():
        other_name = name[:-3] if name.startswith("decoder.") and name.endswith("_l0") else name
        close(tag + "/gradient/" + name, parameter.grad, dict(reference.named_parameters())[other_name].grad)

    # All input/state derivatives, both biases and masked rows are exercised.
    candidate.zero_grad(set_to_none=True); reference.zero_grad(set_to_none=True)
    initial_a = torch.randn(3, 64, dtype=torch.float64, requires_grad=True)
    initial_b = initial_a.detach().clone().requires_grad_()
    embedded_b = reference.embedding(source)
    packed = pack_padded_sequence(embedded_b, lengths, batch_first=True, enforce_sorted=False)
    packed_history, final_b = reference.encoder(packed, initial_b.unsqueeze(0))
    memory_b, _ = pad_packed_sequence(packed_history, batch_first=True, total_length=source.shape[1])
    valid = torch.arange(source.shape[1])[None, :] < lengths[:, None]
    cache_b = (memory_b, reference.key_projection(memory_b), valid)
    cache_a, state_a, fed_a = candidate.encode(source, lengths, initial_a)
    close(tag + "/nonzero/memory", cache_a[0], memory_b)
    close(tag + "/nonzero/final", state_a, final_b[0])
    step_a = candidate.step(torch.ones(3, dtype=torch.long), state_a, fed_a, cache_a)
    step_b = reference.step(torch.ones(3, dtype=torch.long), final_b[0], torch.zeros_like(final_b[0]), cache_b)
    for index, (a, b) in enumerate(zip(step_a, step_b)):
        close(tag + f"/nonzero/step{index}", a, b)
    (step_a[0][:, native.ALLOWED].square().sum() + step_a[3].square().sum()).backward()
    (step_b[0][:, native.ALLOWED].square().sum() + step_b[3].square().sum()).backward()
    close(tag + "/nonzero/state-gradient", initial_a.grad, initial_b.grad)
    for name, parameter in candidate.named_parameters():
        other_name = name[:-3] if name.startswith("decoder.") and name.endswith("_l0") else name
        close(tag + "/nonzero/gradient/" + name, parameter.grad, dict(reference.named_parameters())[other_name].grad, 8e-11)
    changed = cache_a[0].detach().clone()
    changed[~valid] = 1e6
    changed_keys = candidate.key_projection(changed)
    query = state_a.detach()
    for index, (a, b) in enumerate(zip(candidate.attend(query, (changed, changed_keys, valid)), candidate.attend(query, cache_a))):
        close(tag + f"/masked-extreme/{index}", a, b)
    # Explicit gate owner: full dense call versus an uneven 4+4+1 split.
    inputs_a = torch.randn(3, 9, 24, dtype=torch.float64, requires_grad=True)
    inputs_b = inputs_a.detach().clone().requires_grad_()
    state = initial_a.detach()
    whole, final = candidate.encoder(inputs_a, state)
    chunks = []; carried = state
    for chunk in inputs_b.split(4, 1):
        history, carried = candidate.encoder(chunk, carried)
        chunks.append(history)
    close(tag + "/short-tail/history", torch.cat(chunks, 1), whole)
    close(tag + "/short-tail/final", carried, final)
    whole.square().sum().backward(); torch.cat(chunks, 1).square().sum().backward()
    close(tag + "/short-tail/input-gradient", inputs_a.grad, inputs_b.grad)

# Saved parameters are conserved; compare only emitted active traces/EOS semantics.
for kind in ("additive", "general"):
    payload = json.loads((ASSETS / f"{kind}-seed-one.json").read_text())
    weights = {name: torch.tensor(value, dtype=torch.float64) for name, value in payload["weights"].items()}
    reference = native.AttentiveInflector(kind).double(); reference.load_state_dict(weights)
    candidate = explicit.ExplicitAttentiveInflector(kind).double(); candidate.load_native_state(weights)
    for cap in (3, 16):
        expected = native.greedy(reference, rows, cap)
        actual = native.greedy(candidate, rows, cap)
        assert [item["tokens"] for item in actual] == [item["tokens"] for item in expected]
        checks.append({"name": f"{kind}/saved-active-generation/cap{cap}", "passed": True})

runpy.run_path(str(ASSETS / "explicit-attentive-inflection.py"), run_name="__main__")
sources = [ASSETS / "explicit-attentive-inflection.py", ASSETS / "attentive-inflection.py",
           ROOT / "public/learn-assets/rnns-lstms-grus/recurrent-cells.py", Path(__file__).resolve()]
report = {"passed": True, "torch": torch.__version__, "checks": checks,
          "sources": {str(path.relative_to(ROOT)).replace("\\", "/"): hashlib.sha256(path.read_bytes()).hexdigest() for path in sources}}
RECEIPT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"passed": True, "checks": len(checks), "receipt": str(RECEIPT)}))
