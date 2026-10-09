"""Compose explicit GRU cells into the complete character encoder-decoder.

Save recurrent-cells.py and inflection-seq2seq.py beside this program.
For the saved inference example also save seed-one-inference.json.
Tensor autodiff supplies derivatives; the recurrence is implemented explicitly.
"""
from pathlib import Path
import importlib.util
import json
import torch

ROOT = Path(__file__).resolve().parent


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


# In the website checkout the earlier lesson has its own canonical directory.
# A learner's downloaded copy can keep all dependencies beside this file.
cell_path = ROOT / "recurrent-cells.py"
if not cell_path.exists():
    cell_path = ROOT.parent.parent / "learn-assets/rnns-lstms-grus/recurrent-cells.py"
cells = load_module("explicit_recurrent_cells", cell_path)
protocol = load_module("inflection_protocol", ROOT / "inflection-seq2seq.py")


class ExplicitGRU(cells.RecurrentSequence):
    """Native one-layer state axes around the already implemented GRU."""

    def __init__(self, input_size, hidden_size):
        super().__init__("gru", input_size, hidden_size)

    def forward(self, inputs, state=None):
        incoming = None if state is None else state[0]
        history, final = super().forward(inputs, incoming)
        return history, final.unsqueeze(0)


class ExplicitInflector(protocol.Inflector):
    """Same vocabulary, shared embedding, readout and conditional protocol.

    The source is unidirectional. Gathering the last REAL history state gives
    the same context as packing: later PAD computations cannot affect it.
    Dense history does extra PAD work; native packing avoids that work.
    """

    def __init__(self):
        # Initialize Module directly: do not allocate native GRUs just to replace them.
        torch.nn.Module.__init__(self)
        self.embedding = torch.nn.Embedding(len(protocol.TOKENS), 24, padding_idx=protocol.PAD)
        self.encoder = ExplicitGRU(24, 64)
        self.decoder = ExplicitGRU(24, 64)
        self.readout = torch.nn.Linear(64, len(protocol.TOKENS))
        invalid = torch.ones(len(protocol.TOKENS), dtype=torch.bool)
        invalid[protocol.ALLOWED] = False
        self.register_buffer("invalid_output", invalid)

    def encode(self, source, lengths):
        if source.ndim != 2 or lengths.shape != (source.shape[0],):
            raise ValueError("One source row and one length per example are required.")
        if torch.any(lengths < 1) or torch.any(lengths > source.shape[1]):
            raise ValueError("Source lengths must select real stored positions.")
        history, _ = self.encoder(self.embedding(source))
        rows = torch.arange(source.shape[0], device=source.device)
        positions = lengths.to(source.device) - 1
        return history[rows, positions].unsqueeze(0)


def main():
    torch.set_num_threads(1)
    torch.manual_seed(7)
    records = [
        {"lemma": "walk", "feature": "past", "form": "walked"},
        {"lemma": "try", "feature": "past", "form": "tried"},
    ]
    source, lengths, inputs, targets = protocol.batch(records)
    model = ExplicitInflector().double()
    scores = model(source, lengths, inputs)
    loss = torch.nn.functional.cross_entropy(
        scores.flatten(0, 1), targets.flatten(), ignore_index=protocol.PAD)
    loss.backward()
    print("teacher-forced logits shape:", tuple(scores.shape))
    print("valid-token loss:", loss.item())
    print("encoder input-weight gradient norm:", model.encoder.weight_ih_l0.grad.norm().item())
    print("shared embedding gradient norm:", model.embedding.weight.grad.norm().item())

    # Use the recorded weights to investigate inference, without refitting.
    payload = json.loads((ROOT / "seed-one-inference.json").read_text())
    model.load_state_dict({name: torch.tensor(value, dtype=torch.float64)
                           for name, value in payload["weights"].items()})
    query = [{"lemma": "lactate", "feature": "past"}]
    for cap in (3, 16):
        result = protocol.greedy(model, query, max_output=cap)[0]
        print("cap:", cap, "output:", result["prediction"], "EOS:", result["ended_with_eos"])
    result = protocol.beam(model, query[0], width=3)
    print("beam3:", result["prediction"], "log probability:", result["log_probability"])


if __name__ == "__main__":
    main()
