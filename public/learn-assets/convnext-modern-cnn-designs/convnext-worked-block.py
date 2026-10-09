"""Run the lesson's two-channel hand calculation through the complete V1 block.

Keep this beside convnext-blocks.py. No weights, datasets or files are downloaded.
"""
import importlib.util
import math
from pathlib import Path

import torch


def main():
    source = Path(__file__).with_name("convnext-blocks.py")
    specification = importlib.util.spec_from_file_location("convnext_blocks", source)
    module = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(module)
    block = module.ConvNeXtBlock(2, version=1, drop_probability=0).double().eval()

    # A 7 by 7 kernel with only its centre set is an identity spatial filter.
    # These are constructed teaching weights, not trained or pretrained weights.
    with torch.no_grad():
        block.spatial.weight.zero_()
        block.spatial.weight[:, 0, 3, 3] = 1
        block.spatial.bias.zero_()
        block.norm.weight.fill_(1)
        block.norm.bias.zero_()
        block.expand.weight.zero_()
        block.expand.weight[:2, :2] = torch.eye(2, dtype=torch.float64)
        block.expand.bias.zero_()
        block.project.weight.zero_()
        block.project.weight[:2, :2] = torch.eye(2, dtype=torch.float64)
        block.project.bias.zero_()
        block.layer_scale.fill_(0.1)

    inputs = torch.tensor([1.0, 3.0], dtype=torch.float64).reshape(1, 2, 1, 1)
    actual = block(inputs).flatten()
    a = 1 / math.sqrt(1 + 1e-6)
    activation = lambda value: value * (1 + math.erf(value / math.sqrt(2))) / 2
    expected = torch.tensor(
        [1 + 0.1 * activation(-a), 3 + 0.1 * activation(a)], dtype=torch.float64
    )
    torch.testing.assert_close(actual, expected, rtol=0, atol=1e-12)
    print("Output:", [round(value, 12) for value in actual.tolist()])
    print("Independent normal-CDF calculation matches within 1e-12.")


if __name__ == "__main__":
    main()
