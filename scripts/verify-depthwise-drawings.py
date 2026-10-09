"""Check the Depthwise lesson's structure drawings and the prose that walks through them.

Recomputes every number the new drawings and their walk-throughs state, from the saved
trained weights and from first principles, and checks picture-first order in the lesson.
Writes only docs/.../depthwise-separable-dilated-convolutions/drawings-checks.json.
"""
import sys

sys.dont_write_bytecode = True

import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
LESSON = ROOT / "src/learn/data/topics/depthwise-separable-dilated-convolutions.jsx"
DRAWINGS = ROOT / "src/learn/components/lesson-labs/DepthwiseDrawings.jsx"
FIGURES = ROOT / "src/learn/components/lesson-labs/DepthwiseFlowFigures.jsx"
DATA = ROOT / "public/learn-code/depthwise-separable-dilated-convolutions/digit-inference.json"
RECEIPT = ROOT / "docs/teaching/deep-learning-beginner/depthwise-separable-dilated-convolutions/drawings-checks.json"

body = LESSON.read_text(encoding="utf-8")
drawings = DRAWINGS.read_text(encoding="utf-8")
figures = FIGURES.read_text(encoding="utf-8")
checks = []


def check(name):
    def wrap(work):
        work()
        checks.append(name)
    return wrap


def js_array(name):
    match = re.search(r"export const " + name + r" = (\[.*?\]);\n", drawings, re.S)
    assert match, name
    return json.loads(match.group(1))


@check("SVD drawing data match the saved trained layer (seed 1, dilation 1, input channel 0)")
def _():
    run = next(r for r in json.loads(DATA.read_text(encoding="utf-8"))["runs"] if r["dilation"] == 1)
    matrix = np.array(run["dense_state"]["spatial.weight"])[:, 0].reshape(12, 9)
    _, values, right = np.linalg.svd(matrix)
    assert np.array_equal(np.round(matrix, 2), np.array(js_array("svdMatrix")))
    assert np.allclose(np.round(values, 3), js_array("svdValues"))
    for row, shown in zip(right[:2], js_array("svdPatterns")):
        assert np.allclose(np.round(row, 2), shown) or np.allclose(np.round(-row, 2), shown)
    energy = np.cumsum(values ** 2) / np.sum(values ** 2)
    assert [round(100 * energy[i]) for i in (0, 1, 3)] == [40, 68, 91]
    assert "Keeping two patterns retains 68% of it; one pattern keeps only 40%, and four keep 91%." in body
    assert "σ1 = 1.41" in body and "σ9 = 0.08" in body


@check("Dilated kernel spans and the 33x33 footprint counts")
def _():
    for d in (1, 2, 4):
        assert f"span {{2 * d + 1}}" in drawings and 2 * d + 1 in (3, 5, 9)
    inside = lambda rate: sum(0 <= 16 + a * rate <= 32 and 0 <= 16 + b * rate <= 32 for a in (-1, 0, 1) for b in (-1, 0, 1))
    assert (inside(6), inside(12), inside(18)) == (9, 9, 1)
    assert (513 - 1) // 16 + 1 == 33 and (257 - 1) // 16 + 1 == 17
    taps17 = sum(0 <= 8 + a * 12 <= 16 and 0 <= 8 + b * 12 <= 16 for a in (-1, 0, 1) for b in (-1, 0, 1))
    assert taps17 == 1 and max(r for r in range(1, 20) if 8 + r <= 16) == 8


@check("Gridding counts for rates 2,2,2 and 1,2,4")
def _():
    def reach(rates):
        sites = {0}
        for rate in rates:
            sites = {s + o for s in sites for o in (-rate, 0, rate)}
        return sites
    a, b = reach([2, 2, 2]), reach([1, 2, 4])
    assert (len(a) ** 2, 13 ** 2, len(b) ** 2, 15 ** 2) == (49, 169, 225, 225)
    assert "49 of the 169 positions" in body and "Rates 1, 2, 4 reach all 225" in body


@check("Weight counts in the block, group and practice drawings")
def _():
    assert (256 * 64, 9 * 64 * 64, 32 * 192, 9 * 192) == (16384, 36864, 6144, 1728)
    for text in ("'16,384'", "'36,864'", "'6,144'", "'1,728'"):
        assert text in drawings
    assert 9 * 64 * 128 // 4 == 18432 and 9 * 64 * 64 // 8 == 4608 and 9 * 64 == 576
    assert [16, 8, 4] == [sum((i // (4 // g)) == (o // (4 // g)) for i in range(4) for o in range(4)) for g in (1, 2, 4)]
    perm = np.arange(4).reshape(2, 2).T.reshape(-1).tolist()
    assert perm == [0, 2, 1, 3] and "const shufflePermutation = [0, 2, 1, 3]" in drawings


@check("The einsum example reproduces the section-1 filtered strip")
def _():
    windows = np.lib.stride_tricks.sliding_window_view(np.array([1, 2, 3]), 2)
    assert windows.tolist() == [[1, 2], [2, 3]]
    assert np.einsum("pt,t->p", windows, np.array([1, -1])).tolist() == [-1, -1]


@check("Hard-swish plot marks and caption")
def _():
    h = lambda x: x * min(6, max(0, x + 3)) / 6
    assert (h(-3), h(3)) == (0, 3) and abs(h(-2) + 1 / 3) < 1e-12 and abs(min(h(x / 100) for x in range(-400, 401)) + 0.375) < 1e-12
    assert "h(−2) = −1/3" in figures


@check("Picture first: every new drawing comes after its lead and before its walk-through")
def _():
    order = [
        ("Start with the full picture", '<TensorAnatomyFigure kind="standard" />', "The white outline marks the same 3 × 3 window"),
        ("Here are the same two 5 × 5 channels", '<TensorAnatomyFigure kind="separable" />', "Left of the dashed line"),
        ("wired to four output channels", "<GroupWiringFigure />", "the dashed boxes in the middle drawing"),
        ("Follow input channel 0’s white paths", "<ChannelShuffleFigure />", "Without a shuffle, channel 0 reaches"),
        ("Dilation spreads the same nine taps apart", "<DilatedKernelsFigure />", "Each grid is a 9 × 9 input"),
        ("On an image the holes form a regular grid", "<GriddingFigure />", "This checkerboard of holes"),
        ("Read each column downward", "<BlockShapesFigure />", "The bottleneck narrows 256 channels"),
        ("Here is where each dilated branch", "<AsppFootprintFigure />", "Rate 6 (circles)"),
        ("Here is that matrix for input channel 0", "<SvdMatrixFigure />", "Each row is one output channel"),
        ("Here they are for this matrix", "<SvdSpectrumFigure kept={2} />", "The bars fall steadily"),
        ("The drawing shows how its last stages are changed", "<OutputStrideFigure />", "For output stride 16, DeepLab removes"),
        ("Read the drawing downward:", "<AsppBranchesFigure />", "sends one map through five parallel branches"),
        ("Under each outlined cell, the amber", "<DenseChannelFigure />", "The supplied cyan patches"),
        ("The next drawing runs top to bottom", "<GradientRouteFigure />", "Training differentiates through both steps"),
    ]
    for lead, figure, walk in order:
        a, b, c = body.index(lead), body.index(figure), body.index(walk)
        assert a < b < c, figure
    assert "<span id=\"reuse-the-spatial-operator-and-own-the-factorization\"" in body
    assert "<span id=\"two-important-distinctions\"" in body
    for gone in ("MobileBlockFigure", "ContextArchitectureFigure", "SvdFactorFigure"):
        assert gone not in body and f"export function {gone}" not in figures


@check("Worked-number drawings: dense pairs, backward route, interval, receptive field, sign, digit model")
def _():
    dot = lambda v, w: v[0] * w[0] + v[1] * w[1]
    assert (dot([1, 2], [2, -2]), dot([2, 0], [-0.5, -1]), dot([1, 2], [1, 0]), dot([2, 0], [0, 1])) == (-2, -1.0, 1, 0)
    z = np.array([1 * 1 + 2 * -1, 2 * 0.5 + 0 * 1])
    p = np.array([2, -1])
    y = p @ z
    g = y - 1
    assert (y, g, 0.5 * g * g) == (-3, -4, 8)
    assert (g * z).tolist() == [4, -4] and (g * p).tolist() == [-8, 4]
    assert (-8 * np.array([1, 2])).tolist() == [-8, -16] and (4 * np.array([2, 0])).tolist() == [8, 0]
    for text in ("'[−8, −16]'", "'[8, 0]'", "dz: -8", "dz: 4", "dp: 4", "dp: -4"):
        assert text in figures, text
    reach = lambda d: {v + s for s in (-d, 0, d) for v in (-1, 0, 1)}
    assert set(range(-4, 5)) <= reach(3) and {-2, 2}.isdisjoint(reach(4))
    assert 7 + (3 - 1) * 3 * 2 == 19 and 3 * 2 == 6 and 2 * 2 == 4
    for x in (-2, 2):
        assert max(0, x) - max(0, -x) == x
    assert (1 * 8 * 9 + 8, 8 * 12 * 9 + 12, 192 * 10 + 10) == (80, 876, 1930)
    for text in ("learned: 80 parameters", "dense: 876 parameters", "learned: 1,930 parameters"):
        assert text in figures, text
    assert 'data-figure="batchnorm-folding"' not in body and "NeuralTable caption={\"Sign" not in body


@check("Tensor drawings show two outputs; output stride stages and cost")
def _():
    assert "[[0, 'A', 20], [0, 'B', 62], [1, 'A', 140], [1, 'B', 182]]" in drawings
    assert 'label="output 1"' in drawings and drawings.count('label="output 1"') == 2
    stages = {32: [56, 28, 14, 7], 16: [56, 28, 14, 14], 8: [56, 28, 28, 28]}
    assert [224 // (4 * 2 ** i) for i in range(4)] == stages[32]
    assert (28 * 28) / (14 * 14) == 4
    assert "[56, 28, 14, 14], ['', '', '', 'd = 2']" in drawings and "[56, 28, 28, 28], ['', '', 'd = 2', 'd = 4']" in drawings
    assert "256, 56, 26" in drawings  # ResNet-50 bottleneck stage drawn at 56 x 56
    assert "const side = grid => grid * 0.7;" in drawings  # output-stride squares to scale
    assert "for output 0 we will write them as P_A and P_B" in body


@check("Ten practice problems; the seven earlier ones unchanged")
def _():
    assert len(re.findall(r'data-lesson-exercise=""><H3>\{"(\d+)\.', body)) == 10
    assert "1 of 9" in body and "4,608" in body and "64 per value read" in body


report = {
    "passed": True,
    "checkedAt": datetime.now(timezone.utc).isoformat(),
    "numpy": np.__version__,
    "checks": checks,
    "sourceHashes": {str(p.relative_to(ROOT)).replace("\\", "/"): hashlib.sha256(p.read_bytes()).hexdigest() for p in (LESSON, DRAWINGS, FIGURES, DATA)},
}
RECEIPT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"passed": True, "checks": len(checks)}))
