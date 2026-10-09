"""Scoped native semantic checks and evidence for three Core Frameworks lessons."""
import copy
import hashlib
import importlib.util
import json
import platform
from pathlib import Path

import numpy as np
import pandas as pd
import torch

ROOT = Path(__file__).resolve().parents[1]


def load(name, relative):
    spec = importlib.util.spec_from_file_location(name, ROOT / relative)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def reject(call):
    try:
        call()
    except (ValueError, TypeError):
        return
    raise AssertionError("invalid input accepted")


def receipt(topic, result, extra):
    folder = ROOT / "public/learn-code" / topic
    files = {str(p.relative_to(ROOT)).replace("\\", "/"): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(folder.iterdir()) if p.is_file()}
    output = ROOT / "docs/teaching/core-frameworks" / topic / "native-evidence.json"
    output.write_text(json.dumps({"date": "2026-09-28", "review": "author native execution; independent review and browser checks recorded separately", "python": platform.python_version(), "numpy": np.__version__, "torch": torch.__version__, "result": result, "complementary_author_checks": extra, "files": files}, indent=2) + "\n", encoding="utf-8")


def run():
    vector = load("vector_retrieval", "public/learn-code/vector-databases/vector_retrieval.py")
    vector_result = vector.run(ROOT / "public/learn-code/data-processing-loading/iris.csv")
    rng = np.random.default_rng(711)
    x, q = rng.normal(size=(29, 4)), rng.normal(size=4)
    comparisons = 0
    for metric in ("cosine", "dot", "l2"):
        for block_size in (1, 7, 100):
            for k in (1, 8, 40):
                for mask in (np.ones(29, dtype=bool), np.arange(29) % 3 == 0, np.zeros(29, dtype=bool)):
                    score = x @ q if metric == "dot" else -((x - q) ** 2).sum(axis=1) if metric == "l2" else (x @ q) / (np.linalg.norm(x, axis=1) * np.linalg.norm(q))
                    expected = sorted([(i, float(score[i])) for i in range(29) if mask[i]], key=lambda p: (-p[1], p[0]))[:k]
                    actual = vector.exact_topk(x, q, k, mask, metric, block_size)
                    assert [p[0] for p in expected] == [p[0] for p in actual]
                    np.testing.assert_allclose([p[1] for p in actual], [p[1] for p in expected], atol=1e-12)
                    comparisons += 1
    reject(lambda: vector.exact_topk(x, np.zeros(4), 3))
    reject(lambda: vector.exact_topk(x, q, 0))
    reject(lambda: vector.exact_topk(x, q, 2, np.ones(29)))
    assert [i for i, _ in vector.exact_topk(np.ones((4, 2)), [1, 1], 2)] == [0, 1]
    centers = np.array([[0., 0.], [4., 0.], [2., 4.]])
    points = np.array([[1.9, 0], [2.1, 0], [4.2, 0], [0, 1], [2, 3], [3, 4]])
    lists = vector.build_coarse_lists(points, centers)
    for query in rng.uniform(0, 5, size=(40, 2)):
        found, _ = vector.search_coarse_lists(points, centers, lists, query, 2, 3)
        assert found == vector.exact_topk(points, query, 2, metric="l2")
    receipt("vector-databases", vector_result, {"exact_random_metric_mask_block_k_cases": comparisons, "all_probe_queries": 40, "invalid_and_tie_checks": 4})

    annotation = load("annotation_quality", "public/learn-code/data-annotation-labeling-extended/annotation_quality.py")
    annotation_result = annotation.run(ROOT / "public/learn-code/data-annotation-labeling-extended")
    invalid = [lambda: annotation.binary_evidence(float("nan"), []), lambda: annotation.binary_evidence(.5, [(2, .8, .8)]), lambda: annotation.binary_evidence(.5, [(1, float("inf"), .8)]), lambda: annotation.stratified_error([.8, .2], [20, float("nan")], [2, 8]), lambda: annotation.stratified_error([.8, .2], [20, 2.5], [2, 1]), lambda: annotation.stratified_error([[.8, .2]], [[20, 20]], [[2, 8]])]
    for call in invalid:
        reject(call)
    assert annotation.binary_evidence(.3, [(None, .9, .9)]) == .3
    assert annotation.binary_evidence(0, [(1, 1, 1)]) is None
    assert np.isclose(annotation.stratified_error([1, 0], [20, 0], [2, 0]), .1)
    data = pd.read_csv(ROOT / "public/learn-code/data-annotation-labeling-extended/relevance_labels.csv")
    a = annotation.dawid_skene(data, iterations=2)
    b = annotation.dawid_skene(data.sample(frac=1, random_state=71), iterations=2)
    np.testing.assert_allclose(a[2], b[2], atol=1e-12)
    receipt("data-annotation-labeling-extended", annotation_result, {"invalid_input_checks": len(invalid), "missing_impossible_zero_weight_checks": 3, "row_order_invariance": True})

    resume = load("exact_resume", "public/learn-code/dataset-loaders-checkpoints-exact-resume-contracts/exact_resume.py")
    resume_result = resume.run()
    for stop in (1, 4, 7):
        baseline = resume.updates(resume.initialize(), 13)
        parts = resume.initialize()
        resume.updates(parts, stop)
        snapshot = resume.snapshot(parts, stop)
        saved = copy.deepcopy(snapshot)
        assert resume.updates(resume.restore(snapshot), 13 - stop) == baseline[stop:]
        for key, value in snapshot["optimizer"]["state"].items():
            assert torch.equal(value["momentum_buffer"], saved["optimizer"]["state"][key]["momentum_buffer"])
    batcher = resume.ResumableBatcher(8, batch_size=3)
    initial = batcher.state_dict()
    first_epoch = torch.cat([batcher.next_ids() for _ in range(3)])
    assert first_epoch.tolist() == initial["order"].tolist()
    checkpoint = batcher.state_dict()
    next_epoch = torch.cat([batcher.next_ids() for _ in range(3)])
    recovered = resume.ResumableBatcher(8, batch_size=3)
    recovered.load_state_dict(checkpoint)
    assert torch.equal(next_epoch, torch.cat([recovered.next_ids() for _ in range(3)]))
    scalar_fixtures = []
    for stop in (1, 3, 4, 7):
        for momentum in (0, .8):
            for omitted in ("none", "momentum", "cursor", "rng", "schedule"):
                scalar_fixtures.append({"interrupt": stop, "momentum": momentum, "omitted": omitted, "trace": resume.scalar_trace(stop, omitted, momentum)})
    resume_result["scalar_fixtures"] = scalar_fixtures
    receipt("dataset-loaders-checkpoints-exact-resume-contracts", resume_result, {"additional_full_resume_stops": [1, 4, 7], "optimizer_snapshot_aliasing": "independent", "short_final_batch_and_next_epoch": "passed", "browser_scalar_fixtures": len(scalar_fixtures)})
    print(json.dumps({"vector": "passed", "annotation": "passed", "resume": "passed", "receipts": "per-topic native-evidence.json"}))


if __name__ == "__main__":
    run()
