"""One update, three execution routes. CPU, no downloads or files written."""
import copy
import json

import torch
from accelerate import Accelerator
from torch.utils.data import DataLoader, TensorDataset


def accumulated_update(model, optimizer, x, y, microbatch):
    """Mean half-squared error, including an uneven final microbatch."""
    optimizer.zero_grad(set_to_none=True)
    for start in range(0, len(x), microbatch):
        prediction = model(x[start:start + microbatch])
        residual = prediction - y[start:start + microbatch]
        (residual.square().sum() / (2 * len(x))).backward()
    optimizer.step()


def main():
    torch.set_num_threads(1)
    x = torch.tensor([[1.], [2.], [3.], [4.]], dtype=torch.float64)
    y = torch.tensor([[2.], [0.], [1.], [3.]], dtype=torch.float64)
    initial = torch.nn.Linear(1, 1, bias=False).double()
    with torch.no_grad():
        initial.weight.fill_(0.5)
    full, chunked, managed = [copy.deepcopy(initial) for _ in range(3)]
    full_optimizer = torch.optim.SGD(full.parameters(), lr=0.1)
    accumulated_update(full, full_optimizer, x, y, len(x))
    chunk_optimizer = torch.optim.SGD(chunked.parameters(), lr=0.1)
    accumulated_update(chunked, chunk_optimizer, x, y, 3)

    # This managed route intentionally uses two equal-size microbatches.
    accelerator = Accelerator(cpu=True, gradient_accumulation_steps=2)
    optimizer = torch.optim.SGD(managed.parameters(), lr=0.1)
    loader = DataLoader(TensorDataset(x, y), batch_size=2, shuffle=False)
    managed, optimizer, loader = accelerator.prepare(managed, optimizer, loader)
    optimizer.zero_grad(set_to_none=True)
    for features, targets in loader:
        with accelerator.accumulate(managed):
            loss = (managed(features) - targets).square().mean() / 2
            accelerator.backward(loss)
            optimizer.step()
            optimizer.zero_grad(set_to_none=True)
    managed_weight = accelerator.unwrap_model(managed).weight.detach()
    torch.testing.assert_close(full.weight, chunked.weight, rtol=0, atol=1e-12)
    torch.testing.assert_close(full.weight, managed_weight, rtol=0, atol=1e-12)

    # Independent analytic derivative of the same scalar problem.
    gradient = sum((0.5 * a - b) * a for a, b in zip([1, 2, 3, 4], [2, 0, 1, 3])) / 4
    assert abs(full.weight.item() - (0.5 - 0.1 * gradient)) < 1e-12
    print(json.dumps({"gradient": gradient, "full_weight": full.weight.item(),
                      "uneven_microbatch_weight": chunked.weight.item(),
                      "accelerate_weight": managed_weight.item()}, indent=2))


if __name__ == "__main__":
    main()
