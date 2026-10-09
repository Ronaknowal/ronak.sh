"""Differentiable recurrent attention, with explicitly implemented GRU gates.

Download recurrent-cells.py and attentive-inflection.py beside this file.
For the saved example also download additive-seed-one.json. Torch supplies
tensor operations and autodiff; this file owns encode, attend, step and forward.
"""
from pathlib import Path
import importlib.util
import json
import torch
from torch import nn

ROOT = Path(__file__).resolve().parent


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


cell_path = ROOT / "recurrent-cells.py"
if not cell_path.exists():
    cell_path = ROOT.parent.parent / "learn-assets/rnns-lstms-grus/recurrent-cells.py"
cells = load_module("attention_explicit_cells", cell_path)
protocol = load_module("attention_inflection_protocol", ROOT / "attentive-inflection.py")


class ExplicitGRUCell(cells.RecurrentSequence):
    """Adapt a one-position sequence to the ordinary GRUCell input/state axes."""

    def __init__(self, input_size, hidden_size):
        super().__init__("gru", input_size, hidden_size)

    def forward(self, inputs, state):
        _, final = super().forward(inputs[:, None, :], state, return_sequence=False)
        return final


class ExplicitAttentiveInflector(nn.Module):
    """The same two attention schedules and support as the native experiment.

    Dense explicit encoding computes padded tails, then discards them. It saves
    every REAL history row and gathers the last real row for initialization.
    Unidirectional prefix states cannot be contaminated by the later PAD work.
    Native packing avoids that extra work; neither route claims universal speed.
    """

    def __init__(self, kind="additive", input_feeding=False):
        super().__init__()
        if kind not in ("additive", "general"):
            raise ValueError("Choose additive or general.")
        if kind == "additive" and input_feeding:
            raise ValueError("Input feeding here names only the Luong extension.")
        self.kind, self.input_feeding = kind, input_feeding
        self.embedding = nn.Embedding(len(protocol.TOKENS), 24, padding_idx=protocol.PAD)
        self.encoder = cells.RecurrentSequence("gru", 24, 64)
        extra = 64 if kind == "additive" or input_feeding else 0
        self.decoder = ExplicitGRUCell(24 + extra, 64)
        self.key_projection = nn.Linear(64, 32 if kind == "additive" else 64, bias=False)
        if kind == "additive":
            self.query_projection = nn.Linear(64, 32, bias=False)
            self.score_projection = nn.Linear(32, 1, bias=False)
        self.combine = nn.Linear(128, 64)
        self.readout = nn.Linear(64, len(protocol.TOKENS))
        invalid = torch.ones(len(protocol.TOKENS), dtype=torch.bool)
        invalid[protocol.ALLOWED] = False
        self.register_buffer("invalid_output", invalid)

    def encode(self, source, lengths, initial=None):
        if source.ndim != 2 or lengths.shape != (source.shape[0],):
            raise ValueError("Require one source row and one real length per example.")
        lengths = lengths.to(source.device)
        if torch.any(lengths < 1) or torch.any(lengths > source.shape[1]):
            raise ValueError("Source lengths must select real stored positions.")
        history, _ = self.encoder(self.embedding(source), initial)
        valid = torch.arange(source.shape[1], device=source.device)[None, :] < lengths[:, None]
        memory = history.masked_fill(~valid[..., None], 0)
        rows = torch.arange(source.shape[0], device=source.device)
        state = history[rows, lengths - 1]
        return (memory, self.key_projection(memory), valid), state, torch.zeros_like(state)

    def attend(self, query, cache):
        memory, keys, valid = cache
        if not bool(valid.any(-1).all()):
            raise ValueError("Every source must have a real position.")
        if self.kind == "additive":
            scores = self.score_projection(torch.tanh(
                keys + self.query_projection(query)[:, None, :])).squeeze(-1)
        else:
            scores = torch.bmm(keys, query[..., None]).squeeze(-1)
        scores = scores.masked_fill(~valid, -torch.inf)
        weights = scores.softmax(-1)
        context = torch.bmm(weights[:, None, :], memory).squeeze(1)
        return context, weights, scores

    def step(self, previous, state, fed, cache):
        embedded = self.embedding(previous)
        if self.kind == "additive":
            context, weights, scores = self.attend(state, cache)
            state = self.decoder(torch.cat([embedded, context], -1), state)
        else:
            inputs = torch.cat([embedded, fed], -1) if self.input_feeding else embedded
            state = self.decoder(inputs, state)
            context, weights, scores = self.attend(state, cache)
        attentional = torch.tanh(self.combine(torch.cat([state, context], -1)))
        logits = self.readout(attentional).masked_fill(self.invalid_output, -torch.inf)
        return logits, state, attentional, weights, context, scores

    def forward(self, source, lengths, previous):
        cache, state, fed = self.encode(source, lengths)
        logits, reads = [], []
        for token in previous.unbind(1):
            output, state, fed, weights, _, _ = self.step(token, state, fed, cache)
            logits.append(output)
            reads.append(weights)
        return torch.stack(logits, 1), torch.stack(reads, 1)

    def load_native_state(self, weights):
        """Only decoder parameter names differ: cell names omit the _l0 suffix."""
        converted = {}
        for name, value in weights.items():
            if name.startswith("decoder."):
                name += "_l0"
            converted[name] = value
        return self.load_state_dict(converted)


def main():
    torch.set_num_threads(1)
    torch.manual_seed(7)
    rows = [{"lemma": "walk", "feature": "past", "form": "walked"},
            {"lemma": "try", "feature": "past", "form": "tried"}]
    source, lengths, previous, target = protocol.batch(rows)
    model = ExplicitAttentiveInflector().double()
    logits, shares = model(source, lengths, previous)
    loss = torch.nn.functional.cross_entropy(
        logits.flatten(0, 1), target.flatten(), ignore_index=protocol.PAD)
    loss.backward()
    print("scores / reads:", tuple(logits.shape), tuple(shares.shape))
    print("valid-token loss:", loss.item())
    print("scorer gradient norm:", model.score_projection.weight.grad.norm().item())
    payload = json.loads((ROOT / "additive-seed-one.json").read_text())
    model.load_native_state({name: torch.tensor(value, dtype=torch.float64)
                             for name, value in payload["weights"].items()})
    result = protocol.greedy(model, [{"lemma": "lactate", "feature": "past"}])[0]
    print("saved spelling:", result["prediction"], "EOS:", result["ended_with_eos"])


if __name__ == "__main__":
    main()
