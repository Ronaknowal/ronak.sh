"""Match distribution and loss semantics, not independent RNG streams.
Run: python synthetic_library.py   NumPy, PyTorch, Transformers.
"""
import json
import numpy as np
import torch
import torch.nn.functional as F
from transformers import TemperatureLogitsWarper, TopPLogitsWarper
from synthetic_sampling import distribution, inverse_cdf


def main():
    logits = torch.tensor([[2.3, .8, -.4, -2.1]], dtype=torch.float64)
    dummy_ids = torch.zeros((1, 1), dtype=torch.long)
    tempered = TemperatureLogitsWarper(.8)(dummy_ids, logits)
    filtered = TopPLogitsWarper(.85)(dummy_ids, tempered)
    native = filtered.softmax(-1).numpy()[0]
    scratch = distribution(logits.numpy()[0], .8, .85)["nucleus"]
    generator = torch.Generator().manual_seed(17)
    draws = torch.multinomial(torch.tensor([.6, .3, .1], dtype=torch.float64),
                              100000, replacement=True, generator=generator)
    frequencies = torch.bincount(draws, minlength=3).double() / len(draws)
    target = torch.tensor([[0, 2]])
    prediction = torch.tensor([[[2., .3, -.4], [.1, -.7, 1.2]]], dtype=torch.float64)
    terms = -prediction.log_softmax(-1).gather(-1, target[..., None]).squeeze(-1)
    native_loss = F.cross_entropy(prediction.reshape(-1, 3), target.reshape(-1))
    print(json.dumps({"scratch": scratch.tolist(), "native": native.tolist(),
                      "max_distribution_error": float(abs(scratch-native).max()),
                      "inverse_cdf_draws": [inverse_cdf(scratch, u) for u in [0., .5, .99]],
                      "multinomial_frequencies": frequencies.tolist(),
                      "per_target_nll": terms.tolist(), "scratch_mean_loss": float(terms.mean()),
                      "native_mean_loss": float(native_loss)}, indent=2))


if __name__ == "__main__":
    main()
