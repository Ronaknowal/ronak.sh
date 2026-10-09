"""Manual shape-aware affine gradients, matched PyTorch, and a repaired loop."""
import json

import numpy as np
import torch


def affine_gradients(x, weight, bias, target):
    """X[B,F], W[F,O], b[O], y[B,O]; L = mean((XW+b-y)^2)/2.

    Uses array/matrix primitives, explicitly implementing the pullbacks rather
    than rebuilding the prerequisite's automatic-differentiation engine.
    """
    if x.ndim != 2 or weight.ndim != 2 or bias.ndim != 1:
        raise ValueError("Require X[B,F], W[F,O], b[O]")
    batch, features = x.shape
    outputs = weight.shape[1]
    if batch == 0 or outputs == 0 or weight.shape[0] != features:
        raise ValueError("Nonempty batch/output and matching feature axis required")
    if bias.shape != (outputs,) or target.shape != (batch, outputs):
        raise ValueError("Bias/target axes do not match the declared contract")
    residual = x @ weight + bias - target
    loss = .5 * np.mean(residual ** 2)
    upstream = residual / residual.size
    gradients = {"x": upstream @ weight.T,
                 "weight": x.T @ upstream,
                 "bias": upstream.sum(axis=0)}
    return float(loss), gradients


def broadcast_case(predictions=(1., 3.), targets=(2., 4.)):
    p = torch.tensor(predictions, dtype=torch.float64).reshape(-1, 1).requires_grad_()
    y = torch.tensor(targets, dtype=torch.float64)
    if p.shape[0] != y.numel():
        raise ValueError("One paired target is required per prediction")
    correct_residual = p - y[:, None]
    cross_residual = p - y
    correct_loss = .5 * correct_residual.square().mean()
    cross_loss = .5 * cross_residual.square().mean()
    correct_gradient, = torch.autograd.grad(correct_loss, p)
    cross_gradient, = torch.autograd.grad(cross_loss, p)
    return {"paired_residual": correct_residual.tolist(),
            "cross_residual": cross_residual.tolist(),
            "paired_loss": correct_loss.item(), "cross_loss": cross_loss.item(),
            "paired_gradient": correct_gradient.flatten().tolist(),
            "cross_gradient": cross_gradient.flatten().tolist()}


def run():
    torch.set_num_threads(1)
    x = np.array([[1., 0.], [0., 1.], [1., 1.]])
    target = np.array([[2., -1.], [4., 1.], [6., 0.]])
    weight = np.array([[.5, -.5], [1., .25]])
    bias = np.array([.1, -.2])
    loss, gradients = affine_gradients(x, weight, bias, target)
    tensors = [torch.tensor(value, dtype=torch.float64, requires_grad=True)
               for value in (x, weight, bias)]
    library_loss = .5 * (tensors[0] @ tensors[1] + tensors[2] - torch.from_numpy(target)).square().mean()
    library_gradients = torch.autograd.grad(library_loss, tensors)
    np.testing.assert_allclose(loss, library_loss.item(), atol=1e-14)
    for name, actual in zip(('x', 'weight', 'bias'), library_gradients):
        np.testing.assert_allclose(gradients[name], actual.numpy(), atol=1e-14)

    # Ordinary nn.Linear stores W transposed relative to X @ W.
    model = torch.nn.Linear(2, 2).double()
    with torch.no_grad():
        model.weight.copy_(torch.from_numpy(weight.T))
        model.bias.copy_(torch.from_numpy(bias))
    optimizer = torch.optim.SGD(model.parameters(), lr=.2)
    x_tensor, target_tensor = torch.from_numpy(x), torch.from_numpy(target)
    history = []
    for _ in range(30):
        manual_loss, gradient = affine_gradients(x, weight, bias, target)
        optimizer.zero_grad(set_to_none=True)
        prediction = model(x_tensor)
        assert prediction.shape == target_tensor.shape
        library_loss = .5 * (prediction - target_tensor).square().mean()
        library_loss.backward()
        np.testing.assert_allclose(model.weight.grad.numpy().T, gradient['weight'], atol=1e-13)
        np.testing.assert_allclose(model.bias.grad.numpy(), gradient['bias'], atol=1e-13)
        np.testing.assert_allclose(library_loss.item(), manual_loss, atol=1e-13)
        history.append(manual_loss)
        weight = weight - .2 * gradient['weight']
        bias = bias - .2 * gradient['bias']
        optimizer.step()
    final_loss, _ = affine_gradients(x, weight, bias, target)
    np.testing.assert_allclose(model.weight.detach().numpy().T, weight, atol=1e-13)
    return {"numpy": np.__version__, "torch": torch.__version__,
            "broadcast_fixture": broadcast_case(),
            "initial_affine_loss": loss,
            "initial_manual_gradients": {key: value.tolist() for key, value in gradients.items()},
            "matched_steps": len(history), "final_training_fixture_loss": final_loss}


if __name__ == '__main__':
    print(json.dumps(run(), indent=2))
