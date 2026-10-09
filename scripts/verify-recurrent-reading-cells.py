"""Current scratch supplement: native forward, every gradient, and chunk parity."""
import hashlib
import contextlib
import io
import importlib.util
import json
from pathlib import Path
import torch
from torch import nn

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/learn-assets/rnns-lstms-grus/recurrent-cells.py"
spec = importlib.util.spec_from_file_location("recurrent_cells", SOURCE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
groups = []
for kind, native_type in (("rnn", nn.RNN), ("lstm", nn.LSTM), ("gru", nn.GRU)):
    torch.manual_seed(37)
    native = native_type(2, 3, batch_first=True).double()
    scratch = module.RecurrentSequence(kind, 2, 3).double()
    scratch.load_state_dict(native.state_dict())
    x = torch.randn(2, 7, 2, dtype=torch.float64, requires_grad=True)
    xs = x.detach().clone().requires_grad_()
    h = torch.randn(1, 2, 3, dtype=torch.float64, requires_grad=True)
    hs = h.detach()[0].clone().requires_grad_()
    c = torch.randn(1, 2, 3, dtype=torch.float64, requires_grad=True)
    cs = c.detach()[0].clone().requires_grad_()
    out, final = native(x, (h, c) if kind == "lstm" else h)
    manual, state = scratch(xs, (hs, cs) if kind == "lstm" else hs)
    error = lambda a, b: float((a.detach() - b.detach()).abs().max())
    errors = {"outputs": error(out, manual)}
    finals = final if kind == "lstm" else (final,)
    states = state if kind == "lstm" else (state,)
    for i, (a, b) in enumerate(zip(finals, states)):
        errors[f"final_{i}"] = error(a[0], b)
    # Include every returned state in the objective, not only final hidden output.
    loss = out.square().sum() + sum(v.square().sum() for v in finals)
    manual_loss = manual.square().sum() + sum(v.square().sum() for v in states)
    loss.backward(); manual_loss.backward()
    errors["input_gradient"] = error(x.grad, xs.grad)
    errors["initial_hidden_gradient"] = error(h.grad[0], hs.grad)
    if kind == "lstm":
        errors["initial_cell_gradient"] = error(c.grad[0], cs.grad)
    for name, parameter in native.named_parameters():
        errors[f"gradient_{name}"] = error(parameter.grad, dict(scratch.named_parameters())[name].grad)
    initial = (hs.detach(), cs.detach()) if kind == "lstm" else hs.detach()
    chunks, carried = [], initial
    for part in xs.detach().split(3, dim=1):
        output, carried = scratch(part, carried)
        chunks.append(output)
    errors["short_tail_chunk"] = error(torch.cat(chunks, dim=1), manual)
    history, only = scratch(xs.detach(), initial, return_sequence=False)
    assert history is None
    only_states = only if kind == "lstm" else (only,)
    for i, (a, b) in enumerate(zip(only_states, states)):
        errors[f"final_only_{i}"] = error(a, b)
    assert max(errors.values()) < 2e-12, (kind, errors)
    groups.append({"kind": kind, "errors": errors, "nonzero_initial_state_and_two_biases": True,
                   "chunk_lengths": [3, 3, 1]})
stream = io.StringIO()
with contextlib.redirect_stdout(stream):
    module.main()
example_output = stream.getvalue()
assert "loss: 0.6828331183812903" in example_output
receipt = {"passed": True, "torch": torch.__version__, "executed_example_stdout": example_output, "sourceHashes": {
    str(path.relative_to(ROOT)).replace("\\", "/"): hashlib.sha256(path.read_bytes()).hexdigest()
    for path in (SOURCE, Path(__file__))}, "groups": groups,
    "limit": "Float64 small-shape correctness; no speed claim or new handwriting fit."}
target = ROOT / "docs/teaching/deep-learning-beginner/rnns-lstms-grus/reading-flow-cells-native.json"
target.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"passed": True, "groups": len(groups), "maximum_error": max(max(g["errors"].values()) for g in groups)}))
