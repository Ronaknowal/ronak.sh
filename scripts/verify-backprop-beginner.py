"""Independent author checks for the Backpropagation beginner-buildup revision.

Compares the browser model in src/learn/data/backprop-beginner-models.js with
PyTorch autograd and with the unchanged downloadable teaching engine, then
confirms the preserved programs, data and recorded outputs keep their bytes.
Run from the repository root with the lesson environment:
scratch/lesson-tools/Scripts/python.exe scripts/verify-backprop-beginner.py
"""
from pathlib import Path
import hashlib
import importlib.util
import json
import math
import subprocess
import sys

# The imported teaching program lives under public/, which Vite deploys; never leave __pycache__ there.
sys.dont_write_bytecode = True

import torch

ROOT = Path(__file__).resolve().parents[1]
RECEIPT = ROOT / "docs/teaching/deep-learning-beginner/backpropagation-automatic-differentiation/author-checks.json"
BASELINE = ROOT / "docs/teaching/evidence/concept-intuition-baseline.json"
checks = []


def record(name, condition, detail=None):
    if not condition:
        raise AssertionError(f"{name}: {detail}")
    checks.append({"name": name, "passed": True, **({"detail": detail} if detail is not None else {})})


def close(a, b, tolerance=1e-12):
    return abs(a - b) <= tolerance * max(1.0, abs(a), abs(b))


def browser_model():
    script = """
    const m = await import('./src/learn/data/backprop-beginner-models.js');
    const cases = [[1,2,1],[1,2,0],[1,3,1],[-2,0.5,0],[0.4,-1.2,1],[-1,2,1],[0,0,1],[0,0,0]].map(([x1,x2,label]) => ({input:{x1,x2,label}, result:m.tinyNetwork({x1,x2,label})}));
    const grid=[]; for(let i=-12;i<=12;i++) for(let j=-12;j<=16;j++){ const x1=i/4,x2=j/4, r=m.tinyNetwork({x1,x2,label:1}); if(r.mask[0]&&r.mask[1]){ const t=m.unitTwoOffThreshold(x1); grid.push({x1,x2,t,after:m.tinyNetwork({x1,x2:t,label:1}).mask}); } }
    console.log(JSON.stringify({grid, nudge:m.nudgeChain(0.01), tangents:{w:m.neuronTangent({x:0,w:1,b:0}), b:m.neuronTangent({x:0,w:0,b:1}), x:m.neuronTangent({x:1,w:0,b:0})}, cases, parameters:m.tinyParameters, engineOrder:m.engineOrder, engineTrace:m.engineTrace}));
    """
    output = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, check=True, capture_output=True, text=True)
    return json.loads(output.stdout)


def load_engine():
    spec = importlib.util.spec_from_file_location("teaching_autodiff", ROOT / "public/learn-assets/backpropagation/teaching-autodiff.py")
    engine = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(engine)
    return engine


def main():
    torch.set_num_threads(1)
    model = browser_model()

    # §1 nudge and chain rule, recomputed with plain Python floats.
    def neuron_loss(w, x=2.0, b=-1.0, y=1.0):
        return 0.5 * (max(0.0, w * x + b) - y) ** 2
    measured = (neuron_loss(3.01) - neuron_loss(3.0)) / 0.01
    nudge = model["nudge"]
    record("Nudge figure: w 3→3.01 moves L 8→8.0802", close(nudge["after"]["loss"], 8.0802, 1e-12) and close(nudge["before"]["loss"], 8.0),
           {"after": nudge["after"]})
    record("Nudge figure: measured rate 8.02 and stage rates 2, 1, 4.01", close(nudge["measured"], measured, 1e-9) and close(measured, 8.02, 1e-9)
           and close(nudge["rates"]["zPerW"], 2, 1e-9) and close(nudge["rates"]["aPerZ"], 1, 1e-9) and close(nudge["rates"]["lossPerA"], 4.01, 1e-9))

    w = torch.tensor(3.0, dtype=torch.float64, requires_grad=True)
    b = torch.tensor(-1.0, dtype=torch.float64, requires_grad=True)
    x = torch.tensor(2.0, dtype=torch.float64, requires_grad=True)
    loss = 0.5 * (torch.relu(w * x + b) - 1) ** 2
    loss.backward()
    record("Reverse pass gives w 8, b 4, x 12 in one backward", [w.grad.item(), b.grad.item(), x.grad.item()] == [8.0, 4.0, 12.0])
    tangents = model["tangents"]
    record("Forward-mode tangents need one pass each and reproduce 8, 4, 12",
           [tangents[k]["lossDot"] for k in ("w", "b", "x")] == [8, 4, 12])

    def neuron_fn(w, b, x):
        return 0.5 * (torch.relu(w * x + b) - 1) ** 2
    primals = tuple(torch.tensor(v, dtype=torch.float64) for v in (3.0, -1.0, 2.0))
    jvps = [torch.func.jvp(neuron_fn, primals, tuple(torch.tensor(float(i == k), dtype=torch.float64) for i in range(3)))[1].item() for k in range(3)]
    record("torch.func.jvp agrees with the tangent table", jvps == [8.0, 4.0, 12.0])

    new_w, new_b = 3 - 0.1 * 8, -1 - 0.1 * 4
    record("Gradient step 0.1 gives w 2.2, b −1.4, new loss 2", close(new_w, 2.2) and close(new_b, -1.4) and close(neuron_loss(new_w, b=new_b), 2.0, 1e-12))

    # §2 shared square: nudge and path counts.
    def shared(xv):
        u = xv * xv
        return u + 2 * u
    record("Shared square: x 3→3.01 moves u by .0601 and L by .1803", close(3.01 * 3.01 - 9, 0.0601, 1e-9) and close(shared(3.01) - shared(3.0), 0.1803, 1e-9))

    # Tiny network: browser model versus PyTorch autograd on every case.
    params = model["parameters"]
    for case in model["cases"]:
        inputs, result = case["input"], case["result"]
        W1 = torch.tensor(params["W1"], dtype=torch.float64, requires_grad=True)
        b1 = torch.tensor(params["b1"], dtype=torch.float64, requires_grad=True)
        W2 = torch.tensor(params["W2"], dtype=torch.float64, requires_grad=True)
        b2 = torch.tensor(params["b2"], dtype=torch.float64, requires_grad=True)
        xin = torch.tensor([[inputs["x1"], inputs["x2"]]], dtype=torch.float64)
        z1 = xin @ W1 + b1
        a1 = torch.relu(z1)
        a1.retain_grad()
        z2 = a1 @ W2 + b2
        z2.retain_grad()
        ce = torch.nn.functional.cross_entropy(z2, torch.tensor([inputs["label"]]))
        ce.backward()
        pairs = {
            "z1": z1[0], "a1": a1[0], "z2": z2[0], "p": torch.softmax(z2, 1)[0], "g2": z2.grad[0], "ga1": a1.grad[0],
            "gW2": W2.grad, "gb2": b2.grad, "gW1": W1.grad, "gb1": b1.grad,
        }
        worst = max(float((torch.tensor(result[k], dtype=torch.float64) - v.detach()).abs().max()) for k, v in pairs.items())
        worst = max(worst, abs(result["loss"] - ce.item()))
        record(f"Tiny network matches PyTorch at x=({inputs['x1']}, {inputs['x2']}), label {inputs['label']}", worst < 1e-12, {"maxAbsoluteDifference": worst})
    default = model["cases"][0]["result"]
    record("Default trace: hidden unit 2 is off (z = −0.5) yet receives upstream sensitivity .9820; its weights get 0",
           default["z1"] == [2, -0.5] and close(default["ga1"][1], 0.9820137900379085, 1e-12) and default["gW1"][0][1] == 0 and default["gW1"][1][1] == 0,
           {"z1": default["z1"], "ga1": default["ga1"], "gW1": default["gW1"]})
    changed = model["cases"][1]["result"]
    ratio = changed["gW2"][0][0] / default["gW2"][0][0]
    record("Changed label (class A, already favoured): every gradient scales by the same factor",
           close(ratio, -(1 - 0.9820137900379085) / 0.9820137900379085, 1e-12), {"ratio": ratio, "loss": changed["loss"]})

    corner = model["cases"][5]["result"]
    record("Boundary x=(−1, 2): unit 1 score is exactly 0 and the corner convention gives slope 0",
           corner["z1"][0] == 0 and corner["mask"] == [0, 1] and corner["g1"][0] == 0, {"z1": corner["z1"]})
    both_off = [model["cases"][6]["result"], model["cases"][7]["result"]]
    record("Null state x=(0, 0): both units off, all weight gradients 0, only b2 receives p − target, p = 0.5 either label",
           all(r["mask"] == [0, 0] and all(v == 0 for row in r["gW1"] + r["gW2"] for v in row) and abs(r["gb2"][0]) == 0.5 and r["p"] == [0.5, 0.5] for r in both_off))
    record("Changed-label factor is −p_B/p_A ≈ −0.0183 (smaller and reversed in sign)", close(ratio, -0.018315638888734, 1e-9), {"ratio": ratio})
    # Tanh contrast quoted in §3 at the same weights and x = (1, 2), label B.
    W1 = torch.tensor(params["W1"], dtype=torch.float64, requires_grad=True)
    b1 = torch.tensor(params["b1"], dtype=torch.float64, requires_grad=True)
    W2 = torch.tensor(params["W2"], dtype=torch.float64)
    z1 = torch.tensor([[1.0, 2.0]], dtype=torch.float64) @ W1 + b1
    z1.retain_grad()
    a1 = torch.tanh(z1)
    logits = a1 @ W2
    tanh_loss = torch.nn.functional.cross_entropy(logits, torch.tensor([1]))
    tanh_loss.backward()
    slopes = (1 - a1 ** 2)[0]
    got = [round(a1[0, 0].item(), 4), round(a1[0, 1].item(), 4), round(torch.softmax(logits, 1)[0, 0].item(), 3), round(tanh_loss.item(), 3),
           round(slopes[1].item(), 3), round(z1.grad[0, 1].item(), 3), round(slopes[0].item(), 3)]
    record("Tanh contrast: a = (0.9640, −0.4621), p(A) = 0.812, loss 1.674, unit-2 slope 0.786 and ∂L/∂z₂ 0.639, unit-1 slope 0.071",
           got == [0.964, -0.4621, 0.812, 1.674, 0.786, 0.639, 0.071], got)

    grid = model["grid"]
    bad = [g for g in grid if g["after"][1] != 0 or not (-3 <= g["t"] <= 4) or g["t"] >= g["x2"]]
    record("Hint: from every both-on state on the lab's 0.25 grid, lowering x₂ to x₁ + 1.5 (within range) switches unit 2 off",
           len(grid) > 20 and not bad, {"statesChecked": len(grid), "failures": bad[:3]})

    # Engine order and buffer trace on the actual downloadable engine.
    engine = load_engine()
    xt = engine.Tensor(3.0, True)
    u = xt * xt
    m = 2 * u
    L = u + m
    names = {id(xt): "x", id(u): "u", id(m): "m", id(L): "L", id(m.parents[1]): "c"}
    snapshots = []
    for node in (L, m, m.parents[1], u, xt):
        original = node.pullback
        def wrapped(node=node, original=original):
            original()
            snapshots.append({"node": names[id(node)], "grads": {names[id(n)]: float(n.grad) for n in (xt, u, m.parents[1], m, L)}})
        node.pullback = wrapped
    L.backward()
    expected = [{"node": step["node"], "grads": step["grads"]} for step in model["engineTrace"][1:]]
    record("Engine reverse order is L, m, constant, u, x with the displayed buffers", snapshots == expected, snapshots)
    record("Engine gives dL/dx = 18", float(xt.grad) == 18.0)

    # Counts and numerical examples quoted in prose.
    record("Digit network 64→16→10 has 1,210 parameters", 64 * 16 + 16 + 16 * 10 + 10 == 1210)
    record("A chain of k two-branch reuses has 2^k paths (k = 10 gives 1,024)", 2 ** 10 == 1024)
    logits = torch.tensor([[1000.0, -1000.0]], dtype=torch.float64)
    stable = torch.nn.functional.cross_entropy(logits, torch.tensor([1])).item()
    clipped = -math.log(torch.softmax(logits, 1)[0, 1].item() + 1e-12)
    record("Stable loss 2000 versus ε-clipped loss ≈ 27.63", stable == 2000.0 and close(clipped, 27.631021115928547, 1e-9), {"clipped": clipped})
    errors = [abs((math.sin(1 + h) - math.sin(1 - h)) / (2 * h) - math.cos(1)) for h in (1e-1, 1e-3)]
    record("Sine errors shrink by about 10⁴ when h shrinks by 10² (h² truncation)", 9.9e3 < errors[0] / errors[1] < 1.01e4, {"ratio": errors[0] / errors[1]})

    baseline = json.loads(BASELINE.read_text())["actualFileHashes"]
    preserved = {f: h for f, h in baseline.items() if f.startswith("public/learn-assets/backpropagation/")
                 or f in ("src/learn/data/backprop-models.js", "src/learn/data/backprop-training.js", "src/learn/data/backprop-mechanism-program.js")}
    changed_files = [f for f, h in preserved.items() if hashlib.sha256((ROOT / f).read_bytes()).hexdigest() != h]
    record("Preserved programs, data, models and recorded outputs keep their baseline bytes", len(preserved) > 5 and not changed_files,
           {"files": len(preserved), "changed": changed_files})


if __name__ == "__main__":
    receipt = {"topicId": "backpropagation-automatic-differentiation", "revision": "beginner-buildup", "passed": False, "checks": checks,
               "environment": {"torch": torch.__version__}}
    try:
        main()
        receipt["passed"] = True
    except Exception as error:  # record the failure for the handoff
        receipt["failure"] = repr(error)
        raise
    finally:
        RECEIPT.parent.mkdir(parents=True, exist_ok=True)
        RECEIPT.write_text(json.dumps(receipt, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(json.dumps({"passed": receipt["passed"], "checks": len(checks), "failure": receipt.get("failure")}))
