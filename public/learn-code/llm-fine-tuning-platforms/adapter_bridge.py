"""A low-rank update from primitives, matched to PEFT without downloads."""
import copy
import json
import tempfile

import torch
from peft import LoraConfig, PeftModel, get_peft_model


class Projection(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.proj = torch.nn.Linear(3, 2, bias=False)

    def forward(self, x):
        return self.proj(x)


class LowRankProjection(torch.nn.Module):
    def __init__(self, weight, a, b, alpha):
        super().__init__()
        self.register_buffer("weight", weight.clone())
        self.a = torch.nn.Parameter(a.clone())
        self.b = torch.nn.Parameter(b.clone())
        self.scale = alpha / a.shape[0]

    def forward(self, x):
        return x @ self.weight.T + self.scale * (x @ self.a.T) @ self.b.T


def main():
    torch.set_num_threads(1)
    torch.manual_seed(9)
    base = Projection().double()
    original_base = copy.deepcopy(base)
    library = get_peft_model(base, LoraConfig(r=1, lora_alpha=2,
                            target_modules=["proj"], lora_dropout=0, bias="none"))
    layer = library.base_model.model.proj
    a = torch.tensor([[1., -1., 0.5]], dtype=torch.float64)
    b = torch.tensor([[0.2], [-0.1]], dtype=torch.float64)
    with torch.no_grad():
        layer.lora_A.default.weight.copy_(a)
        layer.lora_B.default.weight.copy_(b)
    scratch = LowRankProjection(layer.base_layer.weight.detach(), a, b, alpha=2)
    x = torch.tensor([[1., 2., -1.], [0., 1., 3.]], dtype=torch.float64)
    y = torch.tensor([[0.5, -0.2], [0.1, 0.8]], dtype=torch.float64)
    before = library(x).detach().clone()
    torch.testing.assert_close(scratch(x), before, rtol=0, atol=1e-12)
    scratch_optimizer = torch.optim.SGD(scratch.parameters(), lr=.03)
    library_optimizer = torch.optim.SGD((p for p in library.parameters() if p.requires_grad), lr=.03)
    for model, optimizer in [(scratch, scratch_optimizer), (library, library_optimizer)]:
        ((model(x) - y).square().mean() / 2).backward()
        optimizer.step()
    torch.testing.assert_close(scratch.a.grad, layer.lora_A.default.weight.grad, rtol=0, atol=1e-12)
    torch.testing.assert_close(scratch.b.grad, layer.lora_B.default.weight.grad, rtol=0, atol=1e-12)
    torch.testing.assert_close(scratch(x), library(x), rtol=0, atol=1e-12)
    torch.testing.assert_close(original_base.proj.weight, layer.base_layer.weight, rtol=0, atol=0)
    library.eval()
    expected = library(x).detach()
    with tempfile.TemporaryDirectory() as directory:
        library.save_pretrained(directory)
        restored = PeftModel.from_pretrained(copy.deepcopy(original_base), directory).double().eval()
        torch.testing.assert_close(restored(x), expected, rtol=0, atol=1e-12)
    merged = library.merge_and_unload()
    torch.testing.assert_close(merged(x), expected, rtol=0, atol=1e-12)
    print(json.dumps({"trainable_adapter_parameters": a.numel() + b.numel(),
                      "max_update_parity_error": (scratch(x) - expected).abs().max().item(),
                      "output_change": (expected - before).abs().max().item(),
                      "reload_and_merge_match": True}, indent=2))


if __name__ == "__main__":
    main()
