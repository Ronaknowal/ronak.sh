"""Compare saved activations with recomputation, including every gradient."""
import copy
import json

import torch
from torch.utils.checkpoint import checkpoint


def main():
    torch.set_num_threads(1)
    torch.manual_seed(17)
    block = torch.nn.Sequential(torch.nn.Linear(3, 8), torch.nn.Tanh(),
                                torch.nn.Linear(8, 2)).double()
    recomputed = copy.deepcopy(block)
    x = torch.tensor([[0.2, -0.1, 0.5], [0.4, 0.3, -0.2]], dtype=torch.float64)
    direct = block(x)
    replayed = checkpoint(recomputed, x, use_reentrant=False)
    direct.square().mean().backward()
    replayed.square().mean().backward()
    errors = []
    for original, restored in zip(block.parameters(), recomputed.parameters()):
        torch.testing.assert_close(original.grad, restored.grad, rtol=0, atol=1e-12)
        errors.append((original.grad - restored.grad).abs().max().item())
    torch.testing.assert_close(direct, replayed, rtol=0, atol=1e-12)
    print(json.dumps({"forward_max_error": (direct - replayed).abs().max().item(),
                      "gradient_max_error": max(errors)}, indent=2))


if __name__ == "__main__":
    main()
