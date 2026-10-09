"""Author checks for the Dropout beginner revision (network anatomy, thinned networks, new derivations).

Compares the browser teaching model in src/learn/data/dropout-network.js with an independent
PyTorch autograd computation, recomputes every newly quoted number, parses the changed JSX and
confirms preserved programs/data/models match the protected originals byte for byte.

Run from the repository root with the lesson environment:
    scratch/lesson-tools/Scripts/python.exe scripts/verify-dropout-beginner.py [--write]
"""
import hashlib
import itertools
import json
import math
import subprocess
import sys
from pathlib import Path

import torch

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
TOPIC = "dropout-droppath-stochastic-depth"
import os
# DROPOUT_RECEIPT keeps a later revision from overwriting an earlier revision's receipt.
RECORD = Path(os.environ["DROPOUT_RECEIPT"]) if os.environ.get("DROPOUT_RECEIPT") else ROOT / "docs/teaching/deep-learning-beginner" / TOPIC / "author-checks.json"
checks = []


def check(name, condition, detail=""):
    if not condition:
        raise AssertionError(f"{name}: {detail}")
    checks.append(name)


def close(a, b, tol=1e-9):
    return abs(a - b) <= tol


def js(expression):
    """Evaluate an expression against the lesson's ES modules with Node and return JSON."""
    script = (
        "import * as net from './src/learn/data/dropout-network.js';"
        "import * as models from './src/learn/data/dropout-models.js';"
        "import * as flow from './src/learn/data/dropout-flow.js';"
        f"console.log(JSON.stringify({expression}));"
    )
    out = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT,
                         capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


# 1. Network pass: browser model versus independent autograd over a grid of states.
states = [
    {"inputs": [x1, x2], "mask": list(mask), "probability": p, "training": training}
    for x1, x2 in [(1, 1), (-1, 2), (0.5, -1.5), (2, -2), (0, 0)]
    for mask in itertools.product([0, 1], repeat=2)
    for p in [0, 0.25, 0.5, 1]
    for training in [True, False]
]
browser = js("%s.map(s => net.networkPass(s))" % json.dumps(states))
for state, got in zip(states, browser):
    W1 = torch.tensor([[1., 0.], [1., 1.]], dtype=torch.float64, requires_grad=True)
    b1 = torch.zeros(2, dtype=torch.float64, requires_grad=True)
    w2 = torch.tensor([1., -0.5], dtype=torch.float64, requires_grad=True)
    x = torch.tensor(state["inputs"], dtype=torch.float64)
    p, training = state["probability"], state["training"]
    if not training or p == 0:
        factors = torch.ones(2, dtype=torch.float64)
    elif p == 1:
        factors = torch.zeros(2, dtype=torch.float64)
    else:
        factors = torch.tensor(state["mask"], dtype=torch.float64) / (1 - p)
    hidden = torch.relu(W1 @ x + b1)
    output = w2 @ (hidden * factors)
    loss = 0.5 * (output - 1) ** 2
    loss.backward()
    # torch.relu's derivative at 0 is 0, matching the browser convention.
    check_key = f"network {state}"
    ok = (close(got["output"], output.item()) and close(got["loss"], loss.item())
          and all(close(a, b) for a, b in zip(got["outputWeightGradient"], w2.grad.tolist()))
          and all(close(a, b) for row_a, row_b in zip(got["firstWeightGradient"], W1.grad.tolist()) for a, b in zip(row_a, row_b))
          and all(close(a, b) for a, b in zip(got["firstBiasGradient"], b1.grad.tolist())))
    if not ok:
        raise AssertionError(f"{check_key}: browser {got} torch out {output.item()} W1 {W1.grad.tolist()}")
checks.append(f"networkPass matches PyTorch autograd on {len(states)} states (forward, loss, both layers' gradients)")

# 2. The default state reproduces §1's numbers; the mask [0,1] state matches the lab screenshot text.
default = js("net.networkPass({inputs:[1,1],mask:[1,0],probability:.5,training:true})")
check("default hidden h=[1,2]", default["hidden"] == [1, 2])
check("default passed [2,0], output 2, loss .5", default["passed"] == [2, 0] and default["output"] == 2 and default["loss"] == 0.5)
check("default gradients dL/dw=[2,0], dL/dh=[2,0], kept unit incoming [2,2], dropped [0,0]",
      default["outputWeightGradient"] == [2, 0] and default["hiddenGradient"] == [2, 0]
      and default["firstWeightGradient"] == [[2, 2], [0, 0]])
evaluation = js("net.networkPass({inputs:[1,1],mask:[1,0],probability:.5,training:false})")
check("evaluation: no mask, ŷ = 0, loss 0.5", evaluation["passed"] == [1, 2] and evaluation["output"] == 0 and evaluation["loss"] == 0.5)
swapped = js("net.networkPass({inputs:[1,1],mask:[0,1],probability:.5,training:true})")
check("mask [0,1]: ŷ −2, dw [0,−12], hidden grad [0,3], first rows [0,0],[3,3]",
      swapped["output"] == -2 and swapped["outputWeightGradient"] == [0, -12]
      and swapped["hiddenGradient"] == [0, 3] and swapped["firstWeightGradient"] == [[0, 0], [3, 3]])

# 3. Thinned networks equal the four-outcome table and average back to h.
thinned = js("net.thinnedNetworks({probability:.5})")
check("four thinned h̃ vectors", [row["passed"] for row in thinned] == [[0, 0], [0, 4], [2, 0], [2, 4]])
check("thinned outputs 0, −2, 2, 0", [row["output"] for row in thinned] == [0, -2, 2, 0])
check("thinned probabilities .25 each", all(close(row["probability"], .25) for row in thinned))
mean = [sum(row["probability"] * row["passed"][k] for row in thinned) for k in range(2)]
check("probability-weighted mean is [1,2]", all(close(a, b) for a, b in zip(mean, [1, 2])))
table = js("models.maskOutcomes(.5, 2).outcomes.map(r => r.values)")
check("thinned vectors match the existing four-outcome lab", table == [row["passed"] for row in thinned])

# 4. New derivations.
for p in [0.1, 0.25, 0.5, 0.8]:
    q, h = 1 - p, 2.0
    mean_sq = q * (h / q) ** 2
    check(f"variance identity p={p}", close(mean_sq - h ** 2, p / (1 - p) * h ** 2))
m_over_q = [0, 2]
var = sum((v - 1) ** 2 for v in m_over_q) / 2
check("shared-mask covariance 1·2·Var(m/q) = 2", var == 1 and 1 * 2 * var == 2)
for L, pmax in [(4, .5), (54, .5), (7, .3)]:
    rates = [pmax * l / L for l in range(1, L + 1)]
    check(f"E[A] closed form L={L}", close(sum(1 - r for r in rates), L - pmax * (L + 1) / 2))
check("four-block original schedule gives 2.75", close(sum(1 - .5 * l / 4 for l in range(1, 5)), 2.75))

# 5. Variance-shift figure and lab numbers.
X = [1, 1, 3, 3]
noisy = [0, 2, 0, 6]
check("clean mean 2, variance 1", sum(X) / 4 == 2 and sum((v - 2) ** 2 for v in X) / 4 == 1)
expected_sq = (1 ** 2 + 3 ** 2) / 2 / 0.5
check("E[X̃²]=10, Var=6", expected_sq == 10 and expected_sq - 4 == 6)
batch_var = sum((v - 2) ** 2 for v in noisy) / 4
running = sum((v - 2) ** 2 for v in noisy) / 3
check("fixture batch variance 6, stored unbiased 8", batch_var == 6 and running == 8)
bn = torch.nn.BatchNorm1d(1, momentum=1.0, affine=False, dtype=torch.float64)
bn.train()
bn(torch.tensor(noisy, dtype=torch.float64).reshape(4, 1))
bn.eval()
clean = bn(torch.tensor([1., 3.], dtype=torch.float64).reshape(2, 1)).flatten().tolist()
check("PyTorch BatchNorm maps clean [1,3] to ±0.353553", close(clean[0], -0.353553, 1e-6) and close(clean[1], 0.353553, 1e-6)
      and close(bn.running_var.item(), 8))

chain = js("(() => { const x=[1,1,3,3], bits=[0,1,0,1]; const xt=x.map((v,i)=>v*bits[i]/.5);"
           " const train=models.normalizationStep({values:xt,runningMean:0,runningVariance:1,batches:0,batchTraining:true});"
           " const clean=models.normalizationStep({values:x,runningMean:train.runningMean,runningVariance:train.runningVariance,batches:1,batchTraining:false});"
           " return {xt, running:[train.runningMean,train.runningVariance], clean:clean.output}; })()")
check("mode lab chain: X=[1,1,3,3], bits [0,1,0,1] → X̃=[0,2,0,6]", chain["xt"] == [0, 2, 0, 6])
check("mode lab chain: stored mean 2, variance 8", close(chain["running"][0], 2) and close(chain["running"][1], 8))
check("mode lab chain: clean evaluation ≈ ±0.353553 matching PyTorch",
      all(close(a, b, 1e-6) for a, b in zip(chain["clean"], [clean[0], clean[0], clean[1], clean[1]])))

mc_start = js("(() => { const xt=[0,2,0,6]; const t=models.normalizationStep({values:xt,runningMean:0,runningVariance:1,batches:0,batchTraining:true});"
              " return models.normalizationStep({values:xt,runningMean:t.runningMean,runningVariance:t.runningVariance,batches:t.batches,batchTraining:false}); })()")
expected_mc = [(v - 2) / math.sqrt(8 + 1e-5) for v in [0, 2, 0, 6]]
check("MC mode from reset first stores (2, 8), then reads it: output ≈ [−0.707, 0, −0.707, 1.414], buffers unchanged",
      all(close(a, b, 1e-9) for a, b in zip(mc_start["output"], expected_mc)) and close(mc_start["runningVariance"], 8) and mc_start["batches"] == 1)
# Reading-flow mode lab: four situations computed by dropout-flow.js, checked against PyTorch.
cases = js("Object.fromEntries(['train','noGrad','eval','mc'].map(n => [n, flow.modePass(n)]))")
bn_train = torch.nn.BatchNorm1d(1, momentum=1.0, affine=False, dtype=torch.float64)
bn_train.train()
with torch.no_grad():
    train_out = bn_train(torch.tensor(noisy, dtype=torch.float64).reshape(4, 1)).flatten().tolist()
check("mode lab training pass and no_grad pass: same outputs as PyTorch train-mode BatchNorm, buffers written (2, 8)",
      all(close(a, b, 1e-9) for a, b in zip(cases["train"]["output"], train_out))
      and cases["noGrad"]["output"] == cases["train"]["output"]
      and cases["train"]["written"] and cases["noGrad"]["written"]
      and close(cases["noGrad"]["after"]["runningVariance"], 8) and close(bn_train.running_var.item(), 8))
bn_train.eval()
eval_out = bn_train(torch.tensor(X, dtype=torch.float64).reshape(4, 1)).flatten().tolist()
mc_out = bn_train(torch.tensor(noisy, dtype=torch.float64).reshape(4, 1)).flatten().tolist()
check("mode lab evaluation: clean X with stored (2, 8) ≈ ±0.353553, nothing written",
      all(close(a, b, 1e-9) for a, b in zip(cases["eval"]["output"], eval_out)) and not cases["eval"]["written"])
check("mode lab MC: X̃ with stored (2, 8) ≈ [−0.707, 0, −0.707, 1.414], nothing written",
      all(close(a, b, 1e-9) for a, b in zip(cases["mc"]["output"], mc_out)) and not cases["mc"]["written"]
      and all(close(a, b, 1e-9) for a, b in zip(cases["mc"]["output"], expected_mc)))

# Reading-flow §1 gradient readout: one SGD step of 0.1 on the output weights, same mask.
for mask, w_new, out_new in [([1, 0], [0.8, -0.5], 1.6), ([0, 1], [1, 0.7], 2.8), ([1, 1], [1.2, -0.1], 2.0), ([0, 0], [1, -0.5], 0.0)]:
    r = js("net.networkPass({inputs:[1,1],mask:%s,probability:.5,training:true})" % json.dumps(mask))
    nxt = [w - 0.1 * g for w, g in zip([1, -0.5], r["outputWeightGradient"])]
    out = sum(v * w for v, w in zip(r["passed"], nxt))
    check(f"gradient readout mask {mask}: w_new {w_new}, ŷ {out_new}", all(close(a, b) for a, b in zip(nxt, w_new)) and close(out, out_new))
check("mask [1,0] after the step: loss 0.18", close((1.6 - 1) ** 2 / 2, 0.18))

# Reading-flow §2: ReLU fork outputs and the survivor-scaling bug.
fork = [max(0, 2 * (1 * m[0] - 1 * m[1])) for m in [(0, 0), (0, 1), (1, 0), (1, 1)]]
check("ReLU fork outputs 0, 0, 2, 0 with mean 0.5", fork == [0, 0, 2, 0] and sum(fork) / 4 == 0.5)
bug = js("models.maskOutcomes(.25, .75).mean")
check("survivors multiplied by q at p = 0.25: mean [0.5625, 1.125]", all(close(a, b) for a, b in zip(bug, [0.5625, 1.125])))
good = js("[models.maskOutcomes(.25, 4/3).mean, models.maskOutcomes(.25, 4/3).variance]")
check("inverted scaling at p = 0.25: mean [1, 2], variances [1/3, 4/3]",
      all(close(a, b) for a, b in zip(good[0], [1, 2])) and all(close(a, b) for a, b in zip(good[1], [1 / 3, 4 / 3])))

# Reading-flow §3 and §4 opening states.
geometry = js("models.geometryOutput({mode:'channel',bits:[1,0,0,1],probability:.5,training:true}).map(c => c.output)")
check("geometry opening state: example 1 channel 1 [2,4,6,8], example 2 channel 2 [26,28,30,32], others 0",
      geometry == [2, 4, 6, 8, 0, 0, 0, 0, 0, 0, 0, 0, 26, 28, 30, 32])
example_mode = js("models.geometryOutput({mode:'row',bits:[1,0],probability:.5,training:true}).map(c => c.output)")
check("geometry example mode, mask [1,0]: example 1 doubled, example 2 zero",
      example_mode == [2 * v for v in range(1, 9)] + [0] * 8)
branch = js("[0,1].map(bit => ['branch','whole'].map(placement => models.residualMask({input:[2,-1],correction:[.5,1],probability:.5,bit,placement}).output))")
check("branch lab: bit 0 → [2,−1] (branch) / [0,0] (whole); bit 1 → [3,1] / [5,0]",
      branch[0][0] == [2, -1] and branch[0][1] == [0, 0] and branch[1][0] == [3, 1] and branch[1][1] == [5, 0])
# Review closure F-B1: the sentence under the branch drawing is true for each position and bit.
sentences = js("Object.fromEntries(['branch','whole'].flatMap(p => [0,1].map(b => [p + b, flow.branchSentence(p, b)])))")
check("branch sentence, gate on F, bit 0: skip delivers x unchanged (output [2,−1] = x)",
      "skip still delivers x unchanged" in sentences["branch0"] and branch[0][0] == [2, -1])
check("branch sentence, gate on F, bit 1: correction doubled and added, skip untouched (output [3,1] = x + 2F)",
      "correction is doubled and added to x" in sentences["branch1"] and branch[1][0] == [2 + 2 * .5, -1 + 2 * 1])
check("branch sentence, after the addition, bit 0: skip removed too (output [0,0])",
      "removes the skip as well" in sentences["whole0"] and branch[0][1] == [0, 0])
check("branch sentence, after the addition, bit 1: whole sum, skip included, doubled (output [5,0] = 2(x + F))",
      "whole sum, skip included, is doubled" in sentences["whole1"] and branch[1][1] == [2 * (2 + .5), 2 * (-1 + 1)])
labs_source = (ROOT / "src/learn/components/lesson-labs/DropoutLabs.jsx").read_text(encoding="utf-8")
check("review closure F-2: §5 mode lab offers no MC dropout situation", "['mc'" not in labs_source and "'MC dropout'" not in labs_source)
lesson_source = (ROOT / "src/learn/data/topics/dropout-droppath-stochastic-depth.jsx").read_text(encoding="utf-8")
depth_lab_at = lesson_source.index("<DropoutDepthLab />")
check("review closure F-1: p_l, E[A], zero-first and the execution count are taught before the depth lab",
      all(lesson_source.index(term) < depth_lab_at for term in ["p_l", "\\\\mathbb E[A]", "zero-first", "checks the bit first"]))
check("review closure F-1: mask_values first appears after §5", lesson_source.index("mask_values") > lesson_source.index('"5. Modes, state and a normalization trap"'))
depth = js("(() => { const r=models.depthRates(4,.5,'original'); const z=models.depthRates(4,.5,'zero-first'); const b=[1,0,1,0];"
           " return {r, e:models.expectedActive(r), z:models.expectedActive(z), eager:models.executeDepth({rates:r,bits:b,strategy:'eager'}).calls, lazy:models.executeDepth({rates:r,bits:b,strategy:'lazy'}).calls, active:models.executeDepth({rates:r,bits:b}).trace.map(t=>t.active)}; })()")
check("depth lab opening: rates [.125,.25,.375,.5], E[A] 2.75 (zero-first 3), active [1,0,1,0], calls 4 eager / 2 lazy",
      all(close(a, b) for a, b in zip(depth["r"], [.125, .25, .375, .5])) and close(depth["e"], 2.75) and close(depth["z"], 3)
      and depth["active"] == [1, 0, 1, 0] and depth["eager"] == 4 and depth["lazy"] == 2)

# 6. Monte Carlo figure.
mc = js("[net.passDisagreement([[.9,.1],[.1,.9]]), net.passDisagreement([[.5,.5],[.5,.5]])]")
H = lambda probs: -sum(v * math.log(v) for v in probs if v > 0)
check("case 1: H(mean)=ln 2", close(mc[0]["predictive"], math.log(2)))
check("case 1: mean entropy 0.325083", close(mc[0]["meanEntropy"], H([.9, .1])) and close(round(H([.9, .1]), 6), 0.325083))
check("case 1: D = 0.368064", close(round(mc[0]["disagreement"], 6), 0.368064))
check("case 2: D = 0", close(mc[1]["disagreement"], 0))

# 7. DropConnect network views agree with the effective matrices (h=[1,2], rows [1,1],[1,-1], q=.5).
h = torch.tensor([1., 2.])
W = torch.tensor([[1., 1.], [1., -1.]])
unit = (W * torch.tensor([1., 0.]) / .5) @ h
conn = (W * torch.tensor([[1., 0.], [0., 1.]]) / .5) @ h
check("unit mask output [2,2]; connection mask output [2,−4]", unit.tolist() == [2, 2] and conn.tolist() == [2, -4])

# 8. Changed JSX parses (esbuild via Vite's dependency) and preserved files are byte-identical.
for rel in ["src/learn/data/topics/dropout-droppath-stochastic-depth.jsx",
            "src/learn/components/lesson-labs/DropoutStructureFigures.jsx",
            "src/learn/components/lesson-labs/DropoutLabs.jsx",
            "src/learn/components/lesson-labs/DropoutNoiseIntuition.jsx",
            "src/learn/data/dropout-flow.js"]:
    subprocess.run(["node", "-e", f"require('esbuild').transformSync(require('fs').readFileSync({json.dumps(rel)}, 'utf8'), {{loader: 'jsx'}})"],
                   cwd=ROOT, check=True, capture_output=True)
checks.append("Changed JSX files parse")
original = json.loads((ROOT / "docs/teaching/deep-learning-beginner/original/original-sources-positions-6-10.json").read_text())["topics"][TOPIC]
for rel in ["src/learn/data/dropout-models.js", "src/learn/data/dropout-measurements.json"]:
    check(f"{rel} unchanged", hashlib.sha256((ROOT / rel).read_bytes()).hexdigest() == original[rel])
public = ROOT / "public/learn-assets" / TOPIC
head = {p.name: subprocess.run(["git", "show", f"HEAD:public/learn-assets/{TOPIC}/{p.name}"], cwd=ROOT, capture_output=True, check=True).stdout
        for p in public.iterdir()}
for p in public.iterdir():
    # Compare with line endings normalized: the checkout may convert LF to CRLF.
    check(f"public asset {p.name} unchanged", p.read_bytes().replace(b"\r\n", b"\n") == head[p.name].replace(b"\r\n", b"\n"))

result = {"topicId": TOPIC, "passed": True, "checkCount": len(checks), "checks": checks}
if "--write" in sys.argv:
    RECORD.parent.mkdir(parents=True, exist_ok=True)
    RECORD.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(json.dumps({"passed": True, "checks": len(checks)}))
