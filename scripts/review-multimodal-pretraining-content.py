"""Different reviewer checks: retained study values and changed mechanisms; no fits."""
import hashlib
import importlib.util
import json
from pathlib import Path
import numpy as np
import torch
import torch.nn.functional as F

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public/learn-code/multimodal-pretraining"
DOC = ROOT / "docs/teaching/llm-architecture-training/multimodal-pre-training-vision-encoders-cross-modal-alignment"
checks = []


def check(name, condition):
    if not bool(condition):
        raise AssertionError(name)
    checks.append(name)


def load_module(name):
    spec = importlib.util.spec_from_file_location(name, PUBLIC / (name + ".py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


mechanism = load_module("alignment_mechanisms")
rng = np.random.default_rng(8001)
for n in (1, 2, 4, 7):
    images, texts = rng.normal(size=(n, 3)), rng.normal(size=(n, 3))
    wi, wt = rng.normal(size=(2, 3)), rng.normal(size=(2, 3))
    a = .3
    loss, scores, gradients = mechanism.alignment_forward_backward(images, texts, wi, wt, a)
    oracle_loss, oracle = mechanism.torch_oracle(images, texts, wi, wt, a)
    check(f"N={n} loss matches Torch", np.isclose(loss, oracle_loss, atol=1e-12))
    for key in gradients:
        check(f"N={n} {key} matches Torch", np.allclose(gradients[key], oracle[key], atol=1e-11))
    epsilon = 1e-6
    altered = wi.copy()
    altered[0, 1] += epsilon
    high = mechanism.alignment_forward_backward(images, texts, altered, wt, a)[0]
    altered[0, 1] -= 2 * epsilon
    low = mechanism.alignment_forward_backward(images, texts, altered, wt, a)[0]
    check(f"N={n} image weight central difference", np.isclose((high-low)/(2*epsilon), gradients["image_weight"][0, 1], atol=1e-7))
    permutation = rng.permutation(n)
    check(f"N={n} joint permutation invariant", np.isclose(mechanism.paired_loss(scores[permutation][:, permutation])[0], loss))
    check(f"N={n} equal logits ln N", np.isclose(mechanism.paired_loss(np.zeros((n, n)))[0], np.log(n)))

hand = np.array([[2., 1.2, -2.], [0., 1.6, 0.], [-2., -1.2, 2.]])
hand_loss = mechanism.paired_loss(hand)[0]
swapped_loss = mechanism.paired_loss(hand[:, [2, 1, 0]])[0]
check("hand recorded loss", np.isclose(hand_loss, .269145492246916))
check("swapped unchanged diagonal loss", np.isclose(swapped_loss, 2.9358121589135826))
check("all positive set zero", mechanism.set_positive_loss(hand, np.ones((3,3), dtype=bool)) == 0)
check("diagonal set same objective", np.isclose(mechanism.set_positive_loss(hand, np.eye(3,dtype=bool)), hand_loss))
try:
    mechanism.normalize(np.zeros((1,2)))
except ValueError:
    check("zero norm explicit rejection", True)
else:
    check("zero norm explicit rejection", False)
extreme = np.array([[1000.,-1000.],[-1000.,1000.]])
check("extreme paired finite", np.isfinite(mechanism.paired_loss(extreme)[0]))
check("extreme sigmoid finite", np.isfinite(mechanism.sigmoid_pair_loss(extreme,np.eye(2,dtype=bool))[0]))

for name, expected in (("scratch-study.json",188), ("library-study.json",180)):
    report = json.loads((PUBLIC/name).read_text(encoding="utf-8"))
    data = report["data"]
    splits = data["splits"]
    labels = np.array(data["labels"])
    check(name+" split sizes", [len(splits[k]) for k in ("fit","development","assessment")] == [600,200,200])
    check(name+" source disjoint", len(set(sum(splits.values(),[]))) == 1000)
    check(name+" logs fixed", [row["step"] for row in report["logs"]] == [0,50,100,200,300,400])
    for split in ("development", "assessment"):
        metrics = report["final"][split]
        ids = np.array(metrics["source_ids"])
        scores = np.array(metrics["scores"])
        predictions = scores.argmax(1)
        correct = int((predictions == labels[ids]).sum())
        check(name+split+" every prediction", np.array_equal(predictions, metrics["predictions"]))
        check(name+split+" correct/denominator", correct == metrics["correct"] and metrics["count"] == len(ids))
        gallery = np.argsort(-scores,axis=0,kind="stable")
        relevance = labels[ids][gallery] == np.arange(10)[None,:]
        check(name+split+" every P@5", np.allclose(relevance[:5].mean(0), metrics["precision_at_5_by_caption"]))
        check(name+split+" every first rank", np.array_equal(relevance.argmax(0)+1,metrics["first_relevant_rank_by_caption"]))
        check(name+split+" every top5", np.array_equal(gallery[:5].T,metrics["top5_gallery_rows_by_caption"]))
    check(name+" manuscript final correct", report["final"]["assessment"]["correct"] == expected)
    ids = np.array(splits["assessment"])
    order = np.array(report["controls"]["shuffle_order"])
    check(name+" shuffle relevance12", int((labels[ids[order]]==labels[ids]).sum()) == 12)
    for control, count in (("blank",20),("shuffled",14)):
        metrics = report["controls"][control]
        scores = np.array(metrics["scores"])
        check(name+control+" predictions", np.array_equal(scores.argmax(1),metrics["predictions"]))
        check(name+control+" actual count", int((scores.argmax(1)==labels[ids]).sum()) == count == metrics["correct"])
    if name.startswith("scratch"):
        weights = {k:np.array(v) for k,v in report["weights"].items()}
        pixels = np.array(report["assessment_pixels"])/16.
        hidden = np.tanh(pixels@weights["image.0.weight"].T+weights["image.0.bias"])
        raw = hidden@weights["image.2.weight"].T+weights["image.2.bias"]
        normalized = raw/np.linalg.norm(raw,axis=1,keepdims=True)
        words = weights["words.weight"]
        text = (words[0]+words[1:])/2
        text /= np.linalg.norm(text,axis=1,keepdims=True)
        scores = np.exp(weights["logit_scale"])*normalized@text.T
        check("every saved MLP score reconstructed", np.allclose(scores,report["final"]["assessment"]["scores"],atol=8e-6))
        check("every saved caption vector reconstructed", np.allclose(text,report["caption_vectors"],atol=1e-7))
    else:
        check("library same-forward loss parity", report["loss_parity_max_abs_error"] == 0)
        check("library reload parity", report["reload_max_abs_error"] == 0)

prefix = load_module("visual_prefix")
logits = torch.randn(1, 8, 9, generator=torch.Generator().manual_seed(7))
labels = torch.tensor([[-100,-100,-100,-100,4,5,2,-100]])
check("changed prefix selected logits3/4/5", torch.equal(prefix.answer_loss(logits,labels),F.cross_entropy(logits[0,3:6],torch.tensor([4,5,2]))))
check("all ignored mean absent", prefix.answer_loss(logits,torch.full_like(labels,-100)) is None)

inputs = [DOC/"manuscript.jsx",DOC/"design.md",DOC/"content-inputs.json"] + list(PUBLIC.glob("*.py")) + list(PUBLIC.glob("*-study.json"))
result = {"reviewer":"multimodal_reviewer", "status":"passed", "checks":checks,
          "count":len(checks), "swapped_diagonal_loss":swapped_loss,
          "refits":0,"pretrained_generation":0,
          "scope":"Different arithmetic, retained full study metrics/forward pass and changed prefix; no paint or full runtime certification.",
          "inputs":[{"path":str(p.relative_to(ROOT)).replace('\\','/'),"sha256":hashlib.sha256(p.read_bytes()).hexdigest(),"bytes":p.stat().st_size} for p in inputs]}
target = DOC/"different-content-checks.json"
target.write_text(json.dumps(result,indent=2),encoding="utf-8")
print(json.dumps({"status":"passed","checks":len(checks),"swapped_diagonal_loss":swapped_loss,"receipt":str(target)},indent=2))
