"""Three quantized GEMMs and a matched ordinary-library bridge. CPU, NumPy+PyTorch."""
import json
import numpy as np
import torch
from fp8_formats import quantize


def numpy_quantized(x, name):
    """Match torchao0.17's scale floor and float32 arithmetic, then our codebook."""
    x = np.asarray(x, dtype=np.float32)
    maximum = 448.0 if name == "e4m3" else 57344.0
    c = np.float32(maximum / max(float(np.max(np.abs(x))), 1e-12))
    return quantize(x * c, name).astype(np.float32) / c


def linear_forward(x, w, b):
    return numpy_quantized(x, "e4m3") @ numpy_quantized(w, "e4m3").T + b


def linear_backward(x, w, g):
    xq, wq, gq = (numpy_quantized(x, "e4m3"), numpy_quantized(w, "e4m3"),
                  numpy_quantized(g, "e5m2"))
    return gq @ wq, gq.T @ xq, g.sum(axis=0)


def torch_quantized(x, dtype=torch.float8_e4m3fn):
    maximum = torch.finfo(dtype).max
    c = (maximum / x.detach().abs().amax().double().clamp_min(1e-12)).float()
    q = (x.float() * c).clamp(-maximum, maximum).to(dtype)
    return q.float() / c


class QuantizedLinear(torch.autograd.Function):
    @staticmethod
    def forward(ctx, x, w, b):
        ctx.save_for_backward(x, w)
        return torch_quantized(x) @ torch_quantized(w).T + b

    @staticmethod
    def backward(ctx, g):
        x, w = ctx.saved_tensors
        gq = torch_quantized(g, torch.float8_e5m2)
        return gq @ torch_quantized(w), gq.T @ torch_quantized(x), g.sum(0)


class EmulatedLinear(torch.nn.Linear):
    def forward(self, x):
        return QuantizedLinear.apply(x, self.weight, self.bias)


def official_config():
    from torchao.float8 import CastConfig, Float8LinearConfig
    return Float8LinearConfig(
        cast_config_input=CastConfig(target_dtype=torch.float8_e4m3fn),
        cast_config_weight=CastConfig(target_dtype=torch.float8_e4m3fn),
        cast_config_grad_output=CastConfig(target_dtype=torch.float8_e5m2),
        emulate=True,
    )


def bridge():
    from torchao.float8 import convert_to_float8_training
    torch.set_num_threads(1)
    torch.manual_seed(17)
    local = EmulatedLinear(16, 16)
    ordinary = torch.nn.Sequential(torch.nn.Linear(16, 16))
    ordinary[0].load_state_dict(local.state_dict())
    convert_to_float8_training(ordinary, config=official_config())
    x = torch.randn(16, 16, requires_grad=True)
    xo = x.detach().clone().requires_grad_()
    target = torch.randn(16, 16)
    y, yo = local(x), ordinary(xo)
    loss = (y - target).square().mean()
    loss_o = (yo - target).square().mean()
    loss.backward()
    loss_o.backward()
    xn, wn, bn = (t.detach().numpy() for t in (x, local.weight, local.bias))
    yn = linear_forward(xn, wn, bn)
    gn = np.float32(2.0 / target.numel()) * (yn - target.numpy())
    dx, dw, db = linear_backward(xn, wn, gn)
    arrays = {"forward_numpy": (yn, y.detach().numpy()),
              "dx_numpy": (dx, x.grad.numpy()), "dw_numpy": (dw, local.weight.grad.numpy()),
              "db_numpy": (db, local.bias.grad.numpy()),
              "forward_official": (y.detach().numpy(), yo.detach().numpy()),
              "dx_official": (x.grad.numpy(), xo.grad.numpy()),
              "dw_official": (local.weight.grad.numpy(), ordinary[0].weight.grad.numpy())}
    errors = {key: float(np.max(np.abs(a - b))) for key, (a, b) in arrays.items()}
    before = local.weight.detach().clone()
    torch.optim.SGD(local.parameters(), lr=0.01).step()
    torch.optim.SGD(ordinary.parameters(), lr=0.01).step()
    errors["update_official"] = float((local.weight - ordinary[0].weight).abs().max().detach())
    errors["update_numpy"] = float(np.max(np.abs((before.numpy() - np.float32(.01) * dw)
                                                          - local.weight.detach().numpy())))
    return {"loss": float(loss.detach()), "max_absolute_differences": errors,
            "torch": torch.__version__, "device": "cpu", "seed": 17,
            "mse_entries": target.numel()}


if __name__ == "__main__":
    print(json.dumps(bridge(), indent=2))
