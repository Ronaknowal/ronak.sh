"""Transformer Engine 2.20.2 GPU route. Requires compatible CUDA hardware and TE install."""
import argparse
import json
import torch


def run(recipe_name="current", steps=10):
    import transformer_engine.pytorch as te
    from transformer_engine.common.recipe import DelayedScaling, Float8CurrentScaling, Format
    available, reason = te.is_fp8_available(return_reason=True)
    if not available:
        raise RuntimeError(reason)
    torch.manual_seed(17)
    # Parameters and optimizer updates stay FP32; autocast supplies BF16 layer inputs/outputs.
    layer = te.Linear(128, 64, bias=True, params_dtype=torch.float32, device="cuda")
    baseline = torch.nn.Linear(128, 64, device="cuda", dtype=torch.float32)
    with torch.no_grad():
        baseline.weight.copy_(layer.weight)
        baseline.bias.copy_(layer.bias)
    recipe = (Float8CurrentScaling(fp8_format=Format.HYBRID) if recipe_name == "current" else
              DelayedScaling(fp8_format=Format.HYBRID, amax_history_len=16,
                             amax_compute_algo="max", margin=0))
    x = torch.randn(32, 128, device="cuda", dtype=torch.float32)
    target = torch.randn(32, 64, device="cuda", dtype=torch.float32)
    optimizers = [torch.optim.SGD(m.parameters(), lr=0.01) for m in (baseline, layer)]
    records = []
    for step in range(steps):
        for optimizer in optimizers:
            optimizer.zero_grad(set_to_none=True)
        with torch.autocast("cuda", dtype=torch.bfloat16):
            ref = baseline(x)
            with te.autocast(enabled=True, recipe=recipe):
                low = layer(x)
        # Loss and its reduction are explicitly computed in FP32.
        ref_loss = (ref.float() - target).square().mean()
        low_loss = (low.float() - target).square().mean()
        ref_loss.backward()
        low_loss.backward()
        records.append({"step": step, "bf16_loss": ref_loss.item(), "fp8_loss": low_loss.item(),
                        "output_relative_l2": ((low.float() - ref.float()).norm() / ref.float().norm()).item(),
                        "gradient_relative_l2": ((layer.weight.grad - baseline.weight.grad).norm()
                                                 / baseline.weight.grad.norm()).item()})
        for optimizer in optimizers:
            optimizer.step()
    return {"recipe": recipe_name, "torch": torch.__version__, "device": torch.cuda.get_device_name(),
            "seed": 17, "records": records}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--recipe", choices=("current", "delayed"), default="current")
    args = parser.parse_args()
    print(json.dumps(run(args.recipe), indent=2))
