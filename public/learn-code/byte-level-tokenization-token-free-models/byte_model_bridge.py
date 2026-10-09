"""Own byte batching/loss; reuse PyTorch's Transformer and test ByT5's ID contract.

Install: python -m pip install torch transformers
Run: python byte_model_bridge.py
No weights, dataset or network connection is required by this program.
"""
from __future__ import annotations

import json
import math
import torch
from torch import nn
from torch.nn import functional as F
from transformers import ByT5Tokenizer

PAD, EOS, BOS, OFFSET = 0, 1, 2, 3
VOCABULARY = OFFSET + 256


def make_batch(texts: list[str]) -> tuple[torch.Tensor, torch.Tensor]:
    """Our causal model's IDs: PAD=0, EOS=1, BOS=2; bytes are 3..258."""
    sequences = [[BOS, *(byte + OFFSET for byte in text.encode("utf-8")), EOS]
                 for text in texts]
    width = max(map(len, sequences)) - 1
    inputs = torch.full((len(texts), width), PAD, dtype=torch.long)
    targets = torch.full_like(inputs, PAD)
    for row, sequence in enumerate(sequences):
        length = len(sequence) - 1
        inputs[row, :length] = torch.tensor(sequence[:-1])
        targets[row, :length] = torch.tensor(sequence[1:])
    return inputs, targets


def masked_nll(logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
    """Stable summed negative log likelihood divided by non-padding targets."""
    log_probabilities = logits - torch.logsumexp(logits, dim=-1, keepdim=True)
    selected = log_probabilities.gather(-1, targets.unsqueeze(-1)).squeeze(-1)
    mask = targets != PAD
    return -(selected * mask).sum() / mask.sum()


class ByteLanguageModel(nn.Module):
    def __init__(self, width=32, max_length=128):
        super().__init__()
        self.embedding = nn.Embedding(VOCABULARY, width, padding_idx=PAD)
        self.position = nn.Embedding(max_length, width)
        layer = nn.TransformerEncoderLayer(width, nhead=4, dim_feedforward=64,
                                           dropout=0.0, batch_first=True)
        self.body = nn.TransformerEncoder(layer, num_layers=1,
                                           enable_nested_tensor=False)
        self.output = nn.Linear(width, VOCABULARY)

    def forward(self, inputs):
        length = inputs.shape[1]
        positions = torch.arange(length, device=inputs.device)
        hidden = self.embedding(inputs) + self.position(positions)
        future = torch.ones(length, length, dtype=torch.bool, device=inputs.device).triu(1)
        hidden = self.body(hidden, mask=future, src_key_padding_mask=inputs == PAD)
        return self.output(hidden)


def main():
    torch.manual_seed(7)
    torch.set_num_threads(1)
    texts = ["café 🌍", "café!", ""]
    inputs, targets = make_batch(texts)
    tokenizer = ByT5Tokenizer()
    for text in texts:
        # This comparison concerns ordinary text, not recognized special strings.
        expected = [byte + OFFSET for byte in text.encode("utf-8")]
        actual = tokenizer(text, add_special_tokens=False)["input_ids"]
        assert actual == expected
    model = ByteLanguageModel()
    logits = model(inputs)
    own = masked_nll(logits, targets)
    library = F.cross_entropy(logits.flatten(0, 1), targets.flatten(), ignore_index=PAD)
    torch.testing.assert_close(own, library)
    own_gradient = torch.autograd.grad(own, logits, retain_graph=True)[0]
    library_gradient = torch.autograd.grad(library, logits)[0]
    torch.testing.assert_close(own_gradient, library_gradient)
    # Alter future bytes without changing the prefix at positions 0..2.
    changed = inputs.clone()
    changed[0, 3:5] = torch.tensor([65 + OFFSET, 66 + OFFSET])
    with torch.no_grad():
        prefix_error = (model(inputs)[0, :3] - model(changed)[0, :3]).abs().max().item()
    assert prefix_error < 1e-6
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.01)
    initial = own.item()
    for _ in range(60):
        optimizer.zero_grad(set_to_none=True)
        loss = masked_nll(model(inputs), targets)
        loss.backward()
        optimizer.step()
    model.eval()
    with torch.no_grad():
        final_logits = model(inputs)
        final_loss = masked_nll(final_logits, targets)
        # Byte-only NLL excludes EOS, so the denominator is exactly raw byte count.
        logp = final_logits.log_softmax(-1).gather(-1, targets.unsqueeze(-1)).squeeze(-1)
        byte_targets = targets >= OFFSET
        bits_per_byte = -(logp * byte_targets).sum() / (byte_targets.sum() * math.log(2))
    print(json.dumps({"torch": torch.__version__, "shape": list(inputs.shape),
                      "first_input": inputs[0].tolist(), "nonpad_targets": int((targets != PAD).sum()),
                      "loss_parity_abs_error": abs(own.item() - library.item()),
                      "gradient_parity_max_error": (own_gradient-library_gradient).abs().max().item(),
                      "future_change_prefix_max_error": prefix_error,
                      "initial_training_nll": initial, "final_training_nll": final_loss.item(),
                      "training_bits_per_byte_excluding_eos": bits_per_byte.item()}, indent=2))


if __name__ == "__main__":
    main()
