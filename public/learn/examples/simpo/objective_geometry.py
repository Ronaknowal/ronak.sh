"""Two-coordinate preference/NLL gradient geometry and unequal-length reductions.

python -B objective_geometry.py --output objective-geometry-results.json
No fitting or optimizer updates; exact local derivatives and one stipulated step.
"""
import argparse
import json
from pathlib import Path
import torch
from response_scores import pair_loss


def local_loss(coordinates, weight):
    theta, phi = coordinates.unbind()
    logits = torch.stack((theta + phi, -theta + phi, 10 * theta - 2 * phi))
    logps = logits.log_softmax(-1)
    gap = logps[0] - logps[1]
    preference = torch.nn.functional.softplus(.4 - gap)
    chosen_nll = -logps[0]
    return preference + weight * chosen_nll, preference, chosen_nll, logps.exp()


def run():
    rows = []
    for weight in (0., .1, 1.):
        coordinates = torch.zeros(2, dtype=torch.float64, requires_grad=True)
        total, preference, nll, before = local_loss(coordinates, weight)
        preference_gradient = torch.autograd.grad(preference, coordinates, retain_graph=True)[0]
        nll_gradient = torch.autograd.grad(nll, coordinates, retain_graph=True)[0]
        total_gradient = torch.autograd.grad(total, coordinates)[0]
        assert torch.allclose(total_gradient, preference_gradient + weight * nll_gradient, atol=1e-14)
        assert torch.allclose(nll_gradient, torch.tensor([7 / 3, -1.], dtype=torch.float64), atol=1e-14)
        finite = []
        for axis in range(2):
            offset = torch.zeros(2, dtype=torch.float64)
            offset[axis] = 1e-5
            finite.append(((local_loss(coordinates + offset, weight)[0] - local_loss(coordinates - offset, weight)[0]) / 2e-5).item())
        assert torch.allclose(total_gradient, torch.tensor(finite, dtype=torch.float64), atol=1e-7, rtol=0)
        after_coordinates = -.1 * total_gradient
        _, _, _, after = local_loss(after_coordinates, weight)
        rows.append({"weight": weight, "preference_gradient": preference_gradient.tolist(),
                     "chosen_nll_gradient": nll_gradient.tolist(), "total_gradient": total_gradient.tolist(),
                     "step": after_coordinates.tolist(), "before_probabilities": before.tolist(),
                     "after_probabilities": after.tolist(), "finite_difference": finite})
    sums = torch.tensor([-1., -3., -2., -5.], dtype=torch.float64, requires_grad=True)
    counts = torch.tensor([2, 6, 3, 7])
    total, gaps, _ = pair_loss(sums, counts, 2, chosen_weight=.1)
    gradient = torch.autograd.grad(total, sums)[0]
    weight = 2 * torch.sigmoid(.4 - 2 * gaps) / 2
    expected = torch.cat((-weight / counts[:2] - .1 / counts[:2].sum().to(sums.dtype), weight / counts[2:]))
    assert torch.allclose(gradient, expected, atol=1e-14, rtol=0)
    return {"kind": "constructed derivative checks; zero optimizer updates", "plane": rows,
            "unequal_counts": counts.tolist(), "sums": sums.tolist(), "total_loss": total.item(),
            "sum_coordinate_gradients": gradient.tolist(), "expected_gradients": expected.tolist()}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("objective-geometry-results.json"))
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve the prior derivative report")
    result = run()
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
