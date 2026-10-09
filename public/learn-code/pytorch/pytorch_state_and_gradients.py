"""Small executable PyTorch contracts; no dataset or accelerator needed."""
import json
import torch
from torch import nn


class Cubic(torch.autograd.Function):
    @staticmethod
    def forward(ctx, value):
        ctx.save_for_backward(value)
        return value ** 3

    @staticmethod
    def backward(ctx, upstream):
        (value,) = ctx.saved_tensors
        return upstream * 3 * value.square()


def main():
    torch.set_num_threads(1)
    base = torch.arange(1, 7, dtype=torch.float64).reshape(2, 3)
    view = base.T
    copied = view.contiguous()
    view[1, 0] = 9
    copied[1, 0] = -3
    layout = {"base": base.tolist(), "view": view.tolist(), "copy": copied.tolist(),
              "base_stride": base.stride(), "view_stride": view.stride(),
              "copy_stride": copied.stride()}

    x = torch.tensor([1.0, 2.0], dtype=torch.float64)
    y = torch.tensor([2.0, 4.0], dtype=torch.float64)
    weight = torch.tensor(1.0, dtype=torch.float64, requires_grad=True)
    gradients = []
    for _ in range(2):
        # A fresh forward creates a fresh graph, but .grad still accumulates.
        loss = 0.5 * (weight * x - y).square().mean()
        loss.backward()
        gradients.append(weight.grad.item())
    with torch.no_grad():
        weight -= 0.1 * weight.grad
    weight.grad = None

    dropout = nn.Dropout(0.5)
    values = torch.ones(4, dtype=torch.float64, requires_grad=True)
    dropout.eval()
    eval_tracks_gradient = dropout(values).requires_grad
    dropout.train()
    with torch.no_grad():
        training_tracks_gradient = dropout(values).requires_grad

    z = torch.tensor([0.3, -0.7], dtype=torch.float64, requires_grad=True)
    custom_correct = torch.autograd.gradcheck(Cubic.apply, (z,))
    # A scalar loss permits a gradient; a vector output needs a cotangent.
    vector = z.square()
    cotangent = torch.tensor([2.0, -1.0], dtype=torch.float64)
    vjp, = torch.autograd.grad(vector, z, grad_outputs=cotangent)
    loss_function = lambda q: q.pow(4).sum()
    gradient_function = torch.func.grad(loss_function)
    direction = torch.ones_like(z)
    gradient, hessian_vector = torch.func.jvp(gradient_function, (z,), (direction,))
    return {"layout": layout, "accumulated_gradients": gradients,
            "weight_after_accumulation": weight.item(),
            "eval_tracks_gradient": eval_tracks_gradient,
            "training_no_grad_tracks_gradient": training_tracks_gradient,
            "custom_gradcheck": custom_correct, "vjp": vjp.tolist(),
            "quartic_gradient": gradient.tolist(), "hessian_times_ones": hessian_vector.tolist()}


if __name__ == "__main__":
    print(json.dumps(main(), indent=2))
