"""Author checks for the Landmark Architectures beginner revision.

Recomputes every count shown by the anatomy figures with real PyTorch modules
(and torchvision where it defines the block), independently of the JSON the
figures read. Run with the tested environment that has torchvision, e.g.
scratch/dl-library-tools/Scripts/python.exe scripts/verify-landmark-beginner.py
"""
import hashlib
import json
import math
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
import torch
from torch import nn
import torchvision.models as tvm

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "src/learn/data/landmark-anatomy-data.json").read_text(encoding="utf-8"))
MEASURED = json.loads((ROOT / "src/learn/data/landmark-architecture-measurements.json").read_text(encoding="utf-8"))
checks = []


def check(name, actual, expected):
    if actual != expected:
        raise AssertionError(f"{name}: expected {expected}, got {actual}")
    checks.append(name)


def count(module):
    return sum(p.numel() for p in module.parameters())


def conv(cin, cout, k, groups=1, bias=True, **kw):
    return nn.Conv2d(cin, cout, k, groups=groups, bias=bias, **kw)


torch.manual_seed(0)

# LeNet-5 trainable parameters, from the layer rules (C3 uses the paper's Table 1 connectivity).
c3_inputs = [3] * 6 + [4] * 6 + [4] * 3 + [6]  # maps 0-5 read 3, 6-11 read 4, 12-14 read 4 (non-contiguous), 15 reads all 6
lenet = {"C1": 6 * (25 + 1), "S2": 6 * 2, "C3": sum(n * 25 + 1 for n in c3_inputs), "S4": 16 * 2,
         "C5": 120 * (16 * 25 + 1), "F6": 84 * (120 + 1), "out": 0}
for layer in DATA["lenet"][1:]:
    check(f"LeNet {layer['id']} parameters", lenet[layer["id"]], layer["params"])

# AlexNet with the paper's two-GPU grouping and 227-pixel teaching geometry.
alex = nn.Sequential(
    conv(3, 96, 11, stride=4), nn.ReLU(), nn.LocalResponseNorm(5), nn.MaxPool2d(3, 2),
    conv(96, 256, 5, groups=2, padding=2), nn.ReLU(), nn.LocalResponseNorm(5), nn.MaxPool2d(3, 2),
    conv(256, 384, 3, padding=1), nn.ReLU(),
    conv(384, 384, 3, groups=2, padding=1), nn.ReLU(),
    conv(384, 256, 3, groups=2, padding=1), nn.ReLU(), nn.MaxPool2d(3, 2),
    nn.Flatten(), nn.Linear(9216, 4096), nn.ReLU(), nn.Linear(4096, 4096), nn.ReLU(), nn.Linear(4096, 1000))
shapes, x = [], torch.zeros(1, 3, 227, 227)
with torch.no_grad():
    for layer in alex:
        x = layer(x)
        shapes.append(" × ".join(str(d) for d in x.shape[1:]))
learned = [m for m in alex if isinstance(m, (nn.Conv2d, nn.Linear))]
shown = [l for l in DATA["alexnet"]["layers"] if "params" in l]
for module, layer in zip(learned, shown):
    check(f"AlexNet {layer['label'].split(' ·')[0]} parameters", count(module), layer["params"])
for layer in DATA["alexnet"]["layers"]:
    check(f"AlexNet shape after {layer['label'][:22]}", layer["shape"] in shapes, True)
check("AlexNet grouped total", count(alex), DATA["alexnet"]["total"])
with torch.device("meta"):
    check("torchvision AlexNet total", count(tvm.alexnet(weights=None)), DATA["alexnet"]["torchvisionTotal"])

# VGG-16 stages and head.
cin, trunk = 3, 0
for i, stage in enumerate(DATA["vgg16"]["stages"]):
    layers = []
    for j in range(stage["convs"]):
        layers.append(conv(cin if j == 0 else stage["channels"], stage["channels"], 3, padding=1))
    cin = stage["channels"]
    check(f"VGG stage {i + 1} parameters", sum(count(l) for l in layers), stage["params"])
    trunk += stage["params"]
check("VGG trunk sum", trunk, DATA["vgg16"]["trunk"])
check("VGG head", [count(nn.Linear(25088, 4096)), count(nn.Linear(4096, 4096)), count(nn.Linear(4096, 1000))], DATA["vgg16"]["head"])
with torch.device("meta"):
    check("torchvision VGG-16 total", count(tvm.vgg16(weights=None)), DATA["vgg16"]["total"])

# Inception (3a), bias-free weights as drawn, with and without reductions.
inc = DATA["inception3a"]
reduced = [[conv(192, 64, 1, bias=False)], [conv(192, 96, 1, bias=False), conv(96, 128, 3, bias=False)],
           [conv(192, 16, 1, bias=False), conv(16, 32, 5, bias=False)], [conv(192, 32, 1, bias=False)]]
naive = [[conv(192, 64, 1, bias=False)], [conv(192, 128, 3, bias=False)], [conv(192, 32, 5, bias=False)], []]
for branch, r, n in zip(inc["branches"], reduced, naive):
    check(f"Inception {branch['name']} reduced weights", [count(m) for m in r], [op["weights"] for op in branch["reduced"] if op["weights"]])
    check(f"Inception {branch['name']} naive weights", [count(m) for m in n], [op["weights"] for op in branch["naive"] if op["weights"]])
check("Inception reduced total", sum(count(m) for b in reduced for m in b), inc["reducedWeights"])
check("Inception naive total", sum(count(m) for b in naive for m in b), inc["naiveWeights"])
check("Inception reduced output channels", sum(b["out"] for b in inc["branches"]), 256)
check("Inception naive output channels", sum(b["naiveOut"] for b in inc["branches"]), 416)
check("Inception positions", 28 * 28, inc["positions"])
check("Inception reduced MACs round to the table's 128M", round(inc["reducedWeights"] * 784 / 1e6), 128)

with torch.device("meta"):
    tv_3a = tvm.googlenet(weights=None, init_weights=False, aux_logits=False).inception3a
tv_conv = sum(m.weight.numel() for m in tv_3a.modules() if isinstance(m, nn.Conv2d))
check("torchvision inception3a convolution weights (3×3 in the '5×5' branch)", tv_conv, 155136)
check("torchvision inception3a '5×5' branch kernel", tv_3a.branch3[1].conv.kernel_size, (3, 3))

# Convolution lesson's DigitCNN, referenced from §1: 1→8 conv, 8→16 conv, 64→10 head.
check("DigitCNN parameters", count(conv(1, 8, 3)) + count(conv(8, 16, 3)) + count(nn.Linear(64, 10)), 1898)
# Depthwise figure: dense 3×3 conv 3→3 vs depthwise 3×3 on 3 channels (bias-free).
check("dense 3x3 3->3 weights", count(conv(3, 3, 3, bias=False)), 81)
check("depthwise 3x3 on 3 channels", count(conv(3, 3, 3, groups=3, bias=False)), 27)
check("AlexNet flatten size", 256 * 6 * 6, 9216)
check("VGG stage 5 parameters incl. 1,536 biases", DATA["vgg16"]["stages"][4]["params"] - 3 * 512, 7077888)

# ResNet blocks from torchvision.
with torch.device("meta"):
    r18, r50, b0 = tvm.resnet18(weights=None), tvm.resnet50(weights=None), tvm.efficientnet_b0(weights=None)
check("ResNet basic block", count(r18.layer1[0]), DATA["resnet"]["basic"]["params"])
check("ResNet projection block", count(r18.layer2[0]), DATA["resnet"]["projection"]["params"])
check("ResNet projection skip", count(r18.layer2[0].downsample), DATA["resnet"]["projection"]["skipParams"])
check("ResNet bottleneck block", count(r50.layer1[1]), DATA["resnet"]["bottleneck"]["params"])

# MBConv blocks from torchvision EfficientNet-B0.
for key, block in [("mbconv", b0.features[2][1]), ("mbconvPractice", b0.features[3][1])]:
    parts = [count(p) for p in block.block]
    spec = DATA[key]
    check(f"{key} parts", parts, [spec["parts"][k] for k in ["expand", "depthwise", "se", "project"]])
    check(f"{key} total", count(block), spec["total"])
    check(f"{key} squeeze width", block.block[2].fc1.out_channels, spec["squeeze"])
    check(f"{key} expanded width", block.block[0][0].out_channels, spec["expanded"])
    check(f"{key} kernel", block.block[1][0].kernel_size[0], spec["kernel"])

# Compound scaling numbers used in the lesson.
s = DATA["scaling"]
check("alpha·beta²·gamma²", round(s["alpha"] * s["beta"] ** 2 * s["gamma"] ** 2, 5), 1.92027)

# Small network: shared frame and body costs come from the recorded experiment.
seed1 = {f["kind"]: f for f in MEASURED["fits"] if f["seed"] == 1}
frame = {l["layer"]: l["parameters"] for l in seed1["plain"]["cost"]["layers"] if not l["layer"].startswith("body")}
check("shared frame parameters", sum(frame.values()), 2034)
bodies = {k: v["cost"]["parameters"] - 2034 for k, v in seed1.items()}
check("body parameters", bodies, {"plain": 2616, "residual": 2616, "parallel": 468, "inverted_gated": 1965})

# The lesson text quotes these values; confirm they appear.
lesson = (ROOT / "src/learn/data/topics/landmark-architectures-lenet-alexnet-vgg-resnet-efficientnet.jsx").read_text(encoding="utf-8")
for value in ["14,450,688", "576", "163,328", "387,072", "416", "8,448", "70,400", "10,710", "31,290", "60,965,224", "61,100,840", "1,898", "7,079,424 convolution parameters", "#cnn-pipeline"]:
    check(f"lesson quotes {value}", value in lesson, True)
check("no run-together digit/word pairs remain", re.findall(r"(?<![A-Za-z])(?:Table|section|on|allocating|and|by|Its|labels|returns|receives|width)(?=\d)", lesson), [])

report = {"passed": True, "checks": len(checks), "names": checks,
          "environment": {"torch": torch.__version__, "torchvision": __import__("torchvision").__version__},
          "sources": {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in [
              "src/learn/data/landmark-anatomy-data.json",
              "src/learn/data/topics/landmark-architectures-lenet-alexnet-vgg-resnet-efficientnet.jsx"]}}
print(json.dumps(report, indent=1))
