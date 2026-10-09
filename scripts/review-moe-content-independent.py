"""Different reviewer: read-only changed-state probes, no scientific fitting.

Run with PYTHONDONTWRITEBYTECODE=1 using the existing lesson-tools Python.
The canonical author receipts and saved fits are never overwritten.
"""
import hashlib
import json
from pathlib import Path
import re
import sys

import numpy as np
import torch


ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / "docs/teaching/llm-architecture-training/moe-training-expert-load-balancing"
CODE = ROOT / "public/learn-code/moe-training"
sys.path.insert(0, str(CODE))
from moe_mechanisms import (
    assignment_groups, backward, balance, forward, gate_backward,
    initial_parameters, routes, sigmoid, topk, z_loss,
)
from moe_language_study import PROTOCOL, examples, predict
from moe_systems import accounts, dispatch


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    torch.set_num_threads(1)
    checks = []

    def equal(name, actual, expected, tolerance=1e-11):
        np.testing.assert_allclose(actual, expected, atol=tolerance, rtol=tolerance)
        checks.append({"name": name, "max_error": float(np.max(np.abs(np.asarray(actual) - expected)))})

    def condition(name, actual):
        assert actual, name
        checks.append({"name": name, "passed": True})

    ready_path = PACKET / "content-author-ready-successor.json"
    ready = json.loads(ready_path.read_text(encoding="utf8"))
    predecessor = json.loads((PACKET / "content-author-ready.json").read_text(encoding="utf8"))
    old_rows = {row["path"]: row for row in predecessor["files"]}
    changed = [row["path"] for row in ready["files"] if row["sha256"] != old_rows[row["path"]]["sha256"]]
    condition("only announced manuscript successor", changed == [str((PACKET / "lesson.md").relative_to(ROOT)).replace("\\", "/")])
    for row in ready["files"]:
        path = ROOT / row["path"]
        condition("bound source " + row["path"], digest(path) == row["sha256"] and path.stat().st_size == row["bytes"])

    # Selection ties have a defined scratch identity; torch.topk tie parity is
    # deliberately not assumed. Capacity priority is token then requested slot.
    equal("lower-ID all-tie top2", topk(np.zeros((1, 4)), 2), [[0, 1]])
    equal("lower-ID kth-boundary tie", topk(np.array([[.2, .9, .9, .9]]), 2), [[1, 2]])
    requests = np.array([[0, 1], [0, 2], [1, 2]])
    _, accepted = assignment_groups(requests, capacity=1)
    equal("first capacity priority", accepted, [[1, 1], [0, 1], [0, 0]])
    _, swapped = assignment_groups(requests[[2, 1, 0]], capacity=1)
    equal("changed capacity priority", swapped, [[1, 1], [1, 0], [0, 0]])

    logits = np.log([[.65, .25, .10]])
    for kind in ["softmax", "full"]:
        scores, ids, gates = routes(logits, 2, kind)
        state = {"scores": scores, "ids": ids, "gates": gates, "kind": kind}
        gradient = gate_backward(state, np.array([[2., -1.]]))
        if kind == "full":
            condition("unselected full-softmax denominator credit", abs(gradient[0, 2]) > .01)
        else:
            equal("unselected selected-normalized credit", gradient[0, 2], 0)
        equal(kind + " common-shift task derivative sum", gradient.sum(), 0)
        shifted_scores, shifted_ids, shifted_gates = routes(logits + 300, 2, kind)
        equal(kind + " common-shift gates", shifted_gates, gates)
        equal(kind + " common-shift identities", shifted_ids, ids)
    for kind in ["softmax", "sigmoid"]:
        scores, ids, gates = routes(logits, 1, kind)
        equal(kind + " normalized top1 task null", gate_backward(
            {"scores": scores, "ids": ids, "gates": gates, "kind": kind}, np.array([[7.]])
        ), np.zeros_like(logits))

    # Independently differentiate original sigmoid affinity weights while a
    # selection-only correction changes the selected set.
    logits = np.array([[1.2, .8, -.4]])
    bias = np.array([-.6, 0., .7])
    scores, ids, gates = routes(logits, 2, "sigmoid", bias)
    condition("bias actually replaces identity", 2 in ids[0] and 0 not in ids[0])
    equal("bias does not enter weights", gates, np.take_along_axis(scores, ids, axis=1) / np.take_along_axis(scores, ids, axis=1).sum(1, keepdims=True))
    direction = np.array([[2.1, -.9]])
    actual = gate_backward({"scores": scores, "ids": ids, "gates": gates, "kind": "sigmoid"}, direction)
    numerical = np.zeros_like(logits)
    for j in range(3):
        delta = np.zeros_like(logits)
        delta[0, j] = 1e-6
        plus = routes(logits + delta, 2, "sigmoid", bias)
        minus = routes(logits - delta, 2, "sigmoid", bias)
        condition("strict biased selection for finite difference " + str(j), np.array_equal(plus[1], ids) and np.array_equal(minus[1], ids))
        numerical[0, j] = ((plus[2] - minus[2]) * direction).sum() / 2e-6
    equal("biased sigmoid finite-difference gate credit", actual, numerical, 2e-9)

    rng = np.random.default_rng(991)
    parameters = initial_parameters(rng, experts=4, width=3, hidden=2)
    x = rng.normal(size=(7, 3))
    upstream = rng.normal(size=x.shape)
    valid = np.array([True, False, True, True, False, True, True])
    for kind in ["softmax", "full", "sigmoid"]:
        _, cache = forward(x, parameters, 2, kind, capacity=2, valid=valid)
        dx, gradients, terms = backward(upstream, parameters, cache, .08, .006)
        equal(kind + " invalid rows input credit", dx[~valid], np.zeros_like(dx[~valid]))
        equal(kind + " invalid rows balance credit", terms["balance_logits"][~valid], np.zeros_like(terms["balance_logits"][~valid]))
        _, empty = forward(x, parameters, 2, kind, valid=np.zeros(7, dtype=bool))
        empty_dx, empty_gradients, empty_terms = backward(upstream, parameters, empty, .08, .006)
        equal(kind + " no-valid-row input null", empty_dx, np.zeros_like(x))
        for name, value in empty_gradients.items():
            equal(kind + " no-valid-row " + name + " null", value, np.zeros_like(value))
        condition(kind + " no-valid-row mean is unknown", empty_terms["stats"]["mean"] is None)

    # Matrix-valued shared router, unequal replicas and masked populations.
    # Counts are held fixed and gathered globally. Autograd compares the direct
    # pooled expression against replica losses averaged with W*T_r/T scaling.
    x = rng.normal(size=(7, 3))
    w0 = rng.normal(size=(4, 3))
    groups = [slice(0, 2), slice(2, 7)]
    for kind in ["softmax", "sigmoid"]:
        def values(w, inputs):
            z = inputs @ w.T
            raw = z.sigmoid() if kind == "sigmoid" else z.softmax(-1)
            return raw, raw / raw.sum(-1, keepdim=True)

        w = torch.tensor(w0, dtype=torch.float64, requires_grad=True)
        tx = torch.tensor(x, dtype=torch.float64)
        raw, p = values(w, tx)
        ids = raw.detach().topk(2, dim=-1).indices
        f = torch.bincount(ids.flatten(), minlength=4).double() / 14
        direct = 4 * (f * p.mean(0)).sum()
        direct.backward()
        global_gradient = w.grad.numpy().copy()
        replica_gradients, local_values = [], []
        for group in groups:
            local_w = torch.tensor(w0, dtype=torch.float64, requires_grad=True)
            local_raw, local_p = values(local_w, tx[group])
            local_loss = 4 * (f * local_p.mean(0)).sum()
            (2 * len(tx[group]) / len(tx) * local_loss).backward()
            replica_gradients.append(local_w.grad.numpy())
            local_ids = local_raw.detach().topk(2, dim=-1).indices
            local_f = torch.bincount(local_ids.flatten(), minlength=4).double() / (2 * len(tx[group]))
            local_values.append(len(tx[group]) / len(tx) * float((4 * local_f * local_p.mean(0)).sum().detach()))
        equal(kind + " unequal-replica full matrix gradient", np.mean(replica_gradients, axis=0), global_gradient)
        condition(kind + " local product not pooled", abs(sum(local_values) - float(direct.detach())) > 1e-4)

    zero_z, _ = z_loss(np.log([[.99, .01]]))
    shifted_z, _ = z_loss(np.log([[.99, .01]]) + 3)
    equal("concentrated zero-z case", zero_z, 0)
    equal("unchanged routing nonzero z scale", shifted_z, 9)
    equal("supplementary actual seed23 noise", np.argmax(np.array([1., .99, 0.]) + np.random.default_rng(23).normal(0, .05, size=(4, 3)), axis=1), [0, 1, 0, 0])
    equal("supplementary zero-noise null", np.argmax(np.tile([1., .99, 0.], (4, 1)), axis=1), [0, 0, 0, 0])

    study = json.loads((PACKET / "research/study/study.json").read_text(encoding="utf8"))
    condition("fixed protocol unchanged", study["protocol"] == PROTOCOL)
    condition("all twelve runs retained", len(study["runs"]) == 12)
    for name, expected in study["sources"].items():
        condition("fit source provenance " + name, digest(CODE / name) == expected)
    train_x, train_y, train_locations = examples(CODE / "alice-train.txt")
    contexts, targets, locations = examples(CODE / "alice-heldout.txt")
    equal("real training byte targets", len(train_y), 8679)
    equal("real held-out byte targets", len(targets), 1949)
    condition("each held-out location unique", len(set(map(tuple, locations))) == 1949)
    for row, (paragraph, position) in enumerate(locations):
        if position == 0:
            equal("held-out paragraph sentinel " + str(paragraph), contexts[row], [256] * 4)
    manuscript = (PACKET / "lesson.md").read_text(encoding="utf8")
    displayed = re.findall(r"\| (17|29|43) \| (None|Auxiliary|Bias|Dense) \| ([0-9.]+) \| ([0-9.]+) \| ([0-9.]+) \|", manuscript)
    condition("all twelve final manuscript rows", len(displayed) == 12)
    schedules = {}
    by_identity = {(run["seed"], run["policy"]): run for run in study["runs"]}
    for seed, policy, nll, load, auxiliary in displayed:
        key = (int(seed), "auxiliary" if policy == "Auxiliary" else policy.lower())
        run = by_identity[key]
        schedules.setdefault(key[0], set()).add(run["schedule_sha256"])
        condition("fixed evaluation checkpoints " + str(key), [item["step"] for item in run["history"]] == [0, 100, 200, 300, 400])
        condition("same actual sampling schedule " + str(key), hashlib.sha256(np.random.default_rng(key[0] + 1000).integers(0, len(train_y), (400, 64)).astype("<i8").tobytes()).hexdigest() == run["schedule_sha256"])
        final = run["history"][-1]["heldout"]
        for name, supplied in [("nll", nll), ("max_over_mean", load), ("balance", auxiliary)]:
            equal("displayed " + str(key) + " " + name, float(supplied), final[name], 5.01e-7)
        condition("matching learned parameter budget " + str(key), run["learned_parameters"] == (13576 if key[1] == "dense" else 16776))
    condition("all four conditions paired by seed", all(len(value) == 1 for value in schedules.values()))

    saved = json.loads((PACKET / "research/study/model.json").read_text(encoding="utf8"))
    model = {key: np.array(value) for key, value in saved["parameters"].items()}
    bias = np.array(saved["bias"])
    condition("predetermined saved inspector", saved["seed"] == 17 and saved["policy"] == "auxiliary" and saved["step"] == 400)
    equal("saved contexts match real bytes", saved["heldout_contexts"], contexts)
    equal("saved targets match real bytes", saved["heldout_targets"], targets)
    baseline, _, cache, _ = predict(model, contexts[:1], bias)
    selected = set(cache["ids"][0].tolist())
    unused = next(e for e in range(4) if e not in selected)
    changed = {key: value.copy() for key, value in model.items()}
    changed["moe_down"][unused] = 0
    equal("unused expert actual saved-context null", predict(changed, contexts[:1], bias)[0], baseline)
    chosen = next(iter(selected))
    changed["moe_down"][chosen] = 0
    condition("selected expert changes saved-context logits", np.max(np.abs(predict(changed, contexts[:1], bias)[0] - baseline)) > 1e-3)
    changed_context = contexts[:1].copy()
    changed_context[0, -1] = 65
    condition("context edit changes real saved logits", np.max(np.abs(predict(model, changed_context, bias)[0] - baseline)) > 1e-3)

    # Restore addresses independently from returned ledger; changing placement
    # changes transfers, while actual weighted expert returns remain invariant.
    sx = np.array([[1., 2.], [3., 4.], [5., 6.], [7., 8.]])
    selected = np.array([[0, 1], [0, 2], [1, 3], [0, 3]])
    gates = np.array([[.75, .25], [.6, .4], [.2, .8], [.5, .5]])
    matrices = np.array([np.eye(2) * i for i in [1, 2, 3, 4]])
    expected = sx * (gates * (selected + 1)).sum(1)[:, None]
    for name, placement, remote in [("split", [0, 0, 1, 1], 3), ("moved", [1, 0, 1, 1], 4)]:
        y, count, expert_count, ledger = dispatch(sx, selected, gates, np.array([0, 0, 1, 1]), np.array(placement), matrices)
        equal(name + " address-restored result", y, expected)
        condition(name + " exactly one return per request", set((r["token"], r["slot"]) for r in ledger) == set(np.ndindex(selected.shape)) and len(ledger) == 8)
        account = accounts(expert_count, count, 2, 4, 4)
        equal(name + " remote assignment count", account["remote_assignments"], remote)
        equal(name + " forward vector bytes", account["forward_request_return_bytes"], 16 * remote)
    equal("zero-count expert allocates no block", accounts(np.array([0, 3, 0, 1]), np.zeros((2, 2), dtype=int), 2, 4, 4)["block_allocated_rows"], [0, 4, 0, 4])

    previous = json.loads((PACKET / "content-verification.json").read_text(encoding="utf8"))
    parity = json.loads((PACKET / "research/torch-parity.json").read_text(encoding="utf8"))
    condition("retained 179 author conditions", previous["check_count"] == 179 and len(previous["checks"]) == 179)
    condition("retained 54 native parity cases", len(parity["cases"]) == 54 and max(case["max_error"] for case in parity["cases"]) < 1e-11)
    condition("honest predecessor-manuscript receipt", previous["manuscript_sha256"] != digest(PACKET / "lesson.md"))
    report = {
        "reviewer": "multimodal_reviewer (different content reviewer)",
        "mode": "read-only complementary changed-state probes; no fitting, no repeated 54-case parity or library update",
        "python": sys.version,
        "numpy": np.__version__,
        "torch": torch.__version__,
        "accepted_packet_sha256": digest(ready_path),
        "sources": ready["files"],
        "script_sha256": digest(Path(__file__)),
        "checks": checks,
        "check_count": len(checks),
        "passed": True,
        "conserved": "12 real fits, 54 native parity cases and native Mixtral/system receipts read and source-bound; not rerun",
    }
    destination = PACKET / "content-independent-probes.json"
    if destination.exists():
        raise FileExistsError("Preserve the prior different-review receipt")
    destination.write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    print(json.dumps({"passed": True, "checks": len(checks), "receipt": str(destination), "sha256": digest(destination)}))


if __name__ == "__main__":
    main()
