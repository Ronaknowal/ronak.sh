"""Explicit prompt encoder operations and complete native forward/gradient parity.

Run: python soft_encoders.py --output encoders.json
No fitting. Small double-precision fixtures expose MLP row independence and
two-layer bidirectional LSTM coupling. Autograd differentiates the explicit gates.
"""
import argparse
import copy
import json
from pathlib import Path

import torch
from torch import nn
import torch.nn.functional as F


class PromptMLP(nn.Module):
    def __init__(self, count=3, width=4, hidden=3):
        super().__init__()
        self.embedding = nn.Embedding(count, width)
        self.layers = nn.Sequential(nn.Linear(width, hidden), nn.ReLU(),
                                    nn.Linear(hidden, hidden), nn.ReLU(), nn.Linear(hidden, width))

    def forward(self):
        return self.layers(self.embedding.weight)


class PromptLSTM(nn.Module):
    def __init__(self, count=3, width=4, hidden=3):
        super().__init__()
        self.embedding = nn.Embedding(count, width)
        self.recurrent = nn.LSTM(width, hidden, num_layers=2, bidirectional=True,
                                 batch_first=True, dropout=0.0)
        self.projection = nn.Sequential(nn.Linear(2 * hidden, 2 * hidden), nn.ReLU(),
                                        nn.Linear(2 * hidden, width))

    def forward(self):
        result, _ = self.recurrent(self.embedding.weight[None])
        return self.projection(result[0])


def explicit_lstm(inputs, recurrent):
    """Run every gate in native i/f/g/o ordering, preserving backward row order."""
    batch, length, _ = inputs.shape
    hidden_width = recurrent.hidden_size
    current = inputs
    traces = []
    for layer in range(recurrent.num_layers):
        directions = []
        for reverse in (False, True):
            suffix = f"_l{layer}" + ("_reverse" if reverse else "")
            w_input = getattr(recurrent, "weight_ih" + suffix)
            w_hidden = getattr(recurrent, "weight_hh" + suffix)
            b_input = getattr(recurrent, "bias_ih" + suffix)
            b_hidden = getattr(recurrent, "bias_hh" + suffix)
            hidden = inputs.new_zeros(batch, hidden_width)
            cell = inputs.new_zeros(batch, hidden_width)
            rows = [None] * length
            order = range(length - 1, -1, -1) if reverse else range(length)
            gate_trace = []
            for position in order:
                gates = F.linear(current[:, position], w_input, b_input)
                gates = gates + F.linear(hidden, w_hidden, b_hidden)
                input_gate, forget_gate, proposal, output_gate = gates.chunk(4, dim=-1)
                input_gate, forget_gate = input_gate.sigmoid(), forget_gate.sigmoid()
                proposal, output_gate = proposal.tanh(), output_gate.sigmoid()
                cell = forget_gate * cell + input_gate * proposal
                hidden = output_gate * cell.tanh()
                rows[position] = hidden
                gate_trace.append({"position": position, "i": input_gate.detach().tolist(),
                                   "f": forget_gate.detach().tolist(), "g": proposal.detach().tolist(),
                                   "o": output_gate.detach().tolist(), "cell": cell.detach().tolist(),
                                   "hidden": hidden.detach().tolist()})
            directions.append(torch.stack(rows, dim=1))
            traces.append({"layer": layer, "direction": "backward" if reverse else "forward",
                           "steps": gate_trace})
        current = torch.cat(directions, dim=-1)
    return current, traces


def explicit_mlp(encoder):
    hidden = encoder.embedding.weight
    for layer in encoder.layers:
        hidden = F.linear(hidden, layer.weight, layer.bias) if isinstance(layer, nn.Linear) else hidden.relu()
    return hidden


def verify():
    torch.set_num_threads(2)
    torch.manual_seed(17)
    records = []
    for kind in ("MLP", "LSTM"):
        native = (PromptMLP() if kind == "MLP" else PromptLSTM()).double()
        manual = copy.deepcopy(native)
        expected = native()
        if kind == "MLP":
            actual, trace = explicit_mlp(manual), []
        else:
            hidden, trace = explicit_lstm(manual.embedding.weight[None], manual.recurrent)
            actual = manual.projection(hidden[0])
        torch.testing.assert_close(actual, expected, atol=1e-14, rtol=1e-13)
        # A distinct multiplier for every coordinate avoids testing only a row sum.
        weights = torch.arange(1, 13, dtype=torch.float64).reshape(3, 4) / 12
        (actual * weights).sum().backward()
        (expected * weights).sum().backward()
        errors = {}
        for (name, original), (other_name, explicit) in zip(native.named_parameters(), manual.named_parameters()):
            assert name == other_name and original.grad is not None and explicit.grad is not None
            torch.testing.assert_close(original.grad, explicit.grad, atol=1e-13, rtol=1e-12)
            errors[name] = float((original.grad - explicit.grad).abs().max())
        changed = copy.deepcopy(native)
        with torch.no_grad():
            changed.embedding.weight[1, 0] += 0.25
        difference = (changed() - native()).abs().sum(dim=-1)
        if kind == "MLP":
            assert difference[0] == 0 and difference[2] == 0
        else:
            assert bool((difference > 0).all())
        materialized = native().detach().clone()
        # An exported prompt is sufficient for inference, not encoder/optimizer resume.
        query = torch.tensor([[0.2, 0.1, -0.3, 0.7]], dtype=torch.float64)
        exported_output = (query @ materialized.T).softmax(-1) @ materialized
        original_output = (query @ native().T).softmax(-1) @ native()
        torch.testing.assert_close(exported_output, original_output, atol=0, rtol=0)
        records.append({"kind": kind, "training_parameters": sum(p.numel() for p in native.parameters()),
                        "materialized_parameters": materialized.numel(), "output": materialized.tolist(),
                        "changed_row_absolute_differences": difference.detach().tolist(),
                        "gradient_max_errors": errors, "gate_traces": trace,
                        "materialized_inference_exact": True})
    return {"kind": "constructed explicit encoder and native parity, no fits", "encoders": records}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    text = json.dumps(verify(), indent=2)
    if args.output:
        args.output.write_text(text + "\n", encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()
