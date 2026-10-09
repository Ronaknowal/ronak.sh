"""Source-bound native lesson checks; run with numpy, scipy, sklearn, torch,
transformers available. Generates offline tone fixtures outside public/.

python scripts/verify-multimodal-tokenization.py [--pretrained]
Evidence goes to the topic-owned native-evidence directory. Existing reports
are preserved under a timestamp before a new report is written. Optional
--pretrained downloads the named checkpoint into the ordinary HF cache.
"""

import argparse
import csv
import hashlib
import importlib.metadata
import importlib.util
import json
from pathlib import Path
import platform
import subprocess
import sys
from datetime import datetime, timezone
import wave
import numpy as np
import torch
from sklearn.datasets import load_digits

ROOT = Path(__file__).resolve().parents[1]
CODE = ROOT / "public/learn-code/multimodal-tokenization"
EVIDENCE = ROOT / "docs/teaching/tokenization/multimodal-tokenization-visual-audio-video/native-evidence"


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(name):
    spec = importlib.util.spec_from_file_location(name, CODE / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run(name, arguments=()):
    command = [sys.executable, str(CODE / f"{name}.py"), *map(str, arguments)]
    result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True,
                            encoding="utf8", timeout=300)
    (EVIDENCE / f"{name}-stdout.txt").write_text(result.stdout, encoding="utf8")
    (EVIDENCE / f"{name}-stderr.txt").write_text(result.stderr, encoding="utf8")
    if result.returncode:
        raise RuntimeError(f"{name} failed:{result.stderr}")
    return {"command": command, "exit_code": result.returncode,
            "stdout_path": str((EVIDENCE / f"{name}-stdout.txt").relative_to(ROOT)),
            "stderr_path": str((EVIDENCE / f"{name}-stderr.txt").relative_to(ROOT)),
            "stdout_sha256": sha256(EVIDENCE / f"{name}-stdout.txt"),
            "stderr_sha256": sha256(EVIDENCE / f"{name}-stderr.txt"),
            "output": json.loads(result.stdout)}


def check_patch(module):
    cases = []
    for shape, size in [((4, 6, 2), 2), ((3, 6, 1), 3), ((2, 3, 4), 1)]:
        image = np.arange(np.prod(shape)).reshape(shape)
        reference = np.stack([image[row:row + size, col:col + size].reshape(-1)
                              for row in range(0, shape[0], size)
                              for col in range(0, shape[1], size)])
        patches = module.patchify(image, size)
        np.testing.assert_array_equal(patches, reference)
        np.testing.assert_array_equal(module.unpatchify(patches, shape, size), image)
        cases.append({"shape": shape, "patch_size": size})
    try:
        module.patchify(np.zeros((3, 4, 1)), 2)
    except ValueError:
        pass
    else:
        raise AssertionError("Nondivisible patch accepted")
    return {"independent_slice_cases": cases, "nondivisible_rejected": True}


def check_vq(module):
    rng = np.random.default_rng(12)
    vectors, book = rng.normal(size=(57, 5)), rng.normal(size=(13, 5))
    direct_ids = ((vectors[:, None, :] - book[None, :, :]) ** 2).sum(2).argmin(1)
    for chunk in [1, 7, 1024]:
        ids, selected = module.nearest_numpy(vectors, book, chunk)
        np.testing.assert_array_equal(ids, direct_ids)
        np.testing.assert_array_equal(selected, book[direct_ids])
    ties = np.array([[-1., 0.], [1., 0.], [1., 0.]])
    ids, _ = module.nearest_numpy([[0., 0.], [1., 0.]], ties)
    np.testing.assert_array_equal(ids, [0, 1])
    gradients = module.gradient_demo()
    np.testing.assert_allclose(gradients["reconstruction"]["encoder_gradient"], [[1, 1]])
    assert gradients["reconstruction"]["codebook_gradient"] is None
    assert gradients["codebook"]["encoder_gradient"] is None
    np.testing.assert_allclose(gradients["codebook"]["codebook_gradient"], [[0, 0], [.2, .4]])
    np.testing.assert_allclose(gradients["commitment"]["encoder_gradient"], [[-.05, -.1]])
    assert gradients["commitment"]["codebook_gradient"] is None
    scalar = module.scalar_update_demo()
    np.testing.assert_allclose([scalar["reconstruction"], scalar["codebook_loss"],
                                scalar["commitment_loss"]], [1., .04, .01])
    np.testing.assert_allclose(scalar["gradients"]["encoder"], [[1.9]])
    np.testing.assert_allclose(scalar["gradients"]["codebook"], [[.4]])
    np.testing.assert_allclose(scalar["after"]["encoder"], [[.61]])
    np.testing.assert_allclose(scalar["after"]["codebook"], [[.96]])
    dataset = load_digits()
    with (CODE / "digits_subset.csv").open(encoding="utf8") as handle:
        rows = list(csv.DictReader(handle))
    indices = [int(row["source_index"]) for row in rows]
    assert len(rows) == len(set(indices)) == 400
    for row in rows:
        index = int(row["source_index"])
        assert int(row["label"]) == dataset.target[index]
        np.testing.assert_array_equal([int(row[f"p{i}"]) for i in range(64)], dataset.data[index])
    assert sum(row["split"] == "train" for row in rows) == 320
    assert sum(row["split"] == "heldout" for row in rows) == 80
    train, heldout = module.load_digits_subset(CODE / "digits_subset.csv")
    assert train.shape == (320, 1, 8, 8) and heldout.shape == (80, 1, 8, 8)
    assert train.min() >= 0 and train.max() <= 1
    return {"random_distance_reference": [57, 13, 5], "chunk_sizes": [1, 7, 1024],
            "first_tie_ids": ids.tolist(), "analytical_gradient_checks": 6,
            "scalar_loss_gradient_and_update_checks": 5,
            "csv_rows_bound_to_sklearn": 400, "train_rows": 320, "heldout_rows": 80}


def check_rvq(module):
    books = [module.corners(1), module.corners(.5), module.corners(.25)]
    ids, errors = module.encode([.8, .6], books)
    np.testing.assert_array_equal(ids, [3, 0, 3])
    np.testing.assert_allclose(errors, [.2, .1, .025], atol=1e-15)
    np.testing.assert_allclose(module.decode(ids, books), [.75, .75])
    rng = np.random.default_rng(0)
    for _ in range(30):
        vector = rng.uniform(-1, 1, 2)
        indices, stage_errors = module.encode(vector, books)
        final = vector - module.decode(indices, books)
        np.testing.assert_allclose(final @ final, stage_errors[-1], atol=1e-15)
    np.testing.assert_array_equal(module.encode([0, 0], [module.corners(1)])[0], [0])
    matrix = np.array([[0, 1, 2], [3, 2, 1]])
    for order in ["time-major", "level-major"]:
        np.testing.assert_array_equal(module.deserialize(module.serialize(matrix, order), 2, 3, order), matrix)
    rate = module.payload_rate(24000, 320, 8, 1024)
    assert rate == {"frames_per_second": 75., "ids_per_second": 600.,
                    "bits_per_id": 10, "bits_per_second": 6000.}
    assert module.payload_rate(24000, 320, 1, 3)["bits_per_id"] == 2
    return {"worked_errors": errors, "random_decode_cases": 30,
            "tie_first": True, "reversible_orders": 2, "payload": rate}


def make_tone():
    path = EVIDENCE / "constructed-tone-stereo-16000hz.wav"
    time = np.arange(4001) / 16000
    # Constructed PCM fixture, deliberately non-aligned after resampling.
    samples = np.stack([.2 * np.sin(2 * np.pi * 440 * time),
                        .1 * np.sin(2 * np.pi * 440 * time)], axis=1)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(2)
        handle.setsampwidth(2)
        handle.setframerate(16000)
        handle.writeframes(np.round(samples * 32767).astype("<i2").tobytes())
    return path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pretrained", action="store_true")
    args = parser.parse_args()
    sys.dont_write_bytecode = True
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    if (EVIDENCE / "report.json").exists():
        archive = EVIDENCE / f"previous-{timestamp}"
        archive.mkdir()
        for path in EVIDENCE.iterdir():
            if path.is_file():
                path.rename(archive / path.name)
    checks = {"patch": check_patch(load("patch_projection")),
              "vq": check_vq(load("vector_quantization")),
              "rvq": check_rvq(load("residual_codec"))}
    executions = {name: run(name) for name in ["patch_projection", "residual_codec"]}
    executions["vector_quantization"] = run("vector_quantization", [
        "--save-reconstructions", CODE / "digits_reconstructions.json"])
    fit = executions["vector_quantization"]["output"]["digits_vqvae"]
    real_patch = executions["patch_projection"]["output"]["real_digit"]
    assert real_patch["source_index"] == 0 and real_patch["label"] == 0
    np.testing.assert_allclose(real_patch["patch_vector"], [5/16, 13/16, 13/16, 15/16])
    np.testing.assert_allclose(real_patch["projection"], [18/16, 28/16])
    assert real_patch["unpatchify_exact"] and real_patch["conv_max_abs_difference"] < 1e-12
    assert fit["epochs"] == 30
    for partition in ["train_after", "heldout_after"]:
        measured = fit[partition]
        assert sum(measured["code_counts"]) == measured["images"] * 16
        assert np.isfinite(measured["reconstruction_mse_mean"])
    artifact = json.loads((CODE / "digits_reconstructions.json").read_text(encoding="utf8"))
    assert artifact["program_sha256"] == sha256(CODE / "vector_quantization.py")
    assert artifact["dataset_sha256"] == sha256(CODE / "digits_subset.csv")
    assert artifact["examples"] == fit["heldout_examples"]
    dataset = load_digits()
    for sample in artifact["examples"]:
        original, reconstructed = np.array(sample["original_8x8"]), np.array(sample["reconstructed_8x8"])
        np.testing.assert_array_equal(original, dataset.images[sample["source_index"]] / 16)
        assert dataset.target[sample["source_index"]] == sample["label"]
        assert original.shape == reconstructed.shape == (8, 8)
        assert np.array(sample["latent_ids_4x4"]).shape == (4, 4)
        np.testing.assert_allclose(np.mean((original - reconstructed) ** 2),
                                   sample["reconstruction_mse_mean"], rtol=1e-6)
    checks["retained_reconstructions"] = {"samples": len(artifact["examples"]),
        "source_index": [sample["source_index"] for sample in artifact["examples"]],
        "artifact_sha256": sha256(CODE / "digits_reconstructions.json")}
    tone = make_tone()
    offline_wav = EVIDENCE / "decoded-random-offline-24000hz.wav"
    executions["encodec_library"] = run("encodec_library", [tone, "--offline-shape", "--output", offline_wav])
    shape = executions["encodec_library"]["output"]
    assert shape["source_channels"] == 2 and shape["model_channels"] == 1
    assert shape["source_sample_rate"] == 16000 and shape["model_sample_rate"] == 24000
    assert shape["valid_resampled_samples"] == shape["trimmed_output_samples"] == 6002
    assert shape["audio_codes_shape"][2] == 8
    with wave.open(str(offline_wav), "rb") as handle:
        assert handle.getnframes() == 6002 and handle.getframerate() == 24000
        assert handle.getnchannels() == 1 and handle.getsampwidth() == 2
    assert shape["output_wav"]["samples"] == 6002
    if args.pretrained:
        # Preserve the random-route receipt under a separate stable name.
        for suffix in ["stdout", "stderr"]:
            path = EVIDENCE / f"encodec_library-{suffix}.txt"
            path.rename(EVIDENCE / f"encodec_library-offline-{suffix}.txt")
            executions["encodec_library"][f"{suffix}_path"] = str(
                (EVIDENCE / f"encodec_library-offline-{suffix}.txt").relative_to(ROOT))
        pretrained_wav = EVIDENCE / "decoded-pretrained-24000hz.wav"
        executions["encodec_pretrained"] = run("encodec_library", [tone, "--output", pretrained_wav])
        with wave.open(str(pretrained_wav), "rb") as handle:
            assert handle.getnframes() == 6002 and handle.getframerate() == 24000
            assert handle.getnchannels() == 1 and handle.getsampwidth() == 2
        samples = np.frombuffer(pretrained_wav.read_bytes()[44:], dtype="<i2")
        checks["decoded_wav"] = {"frames": 6002, "sample_rate": 24000, "channels": 1,
                                 "peak_pcm16": int(np.abs(samples.astype(np.int32)).max()),
                                 "sha256": sha256(pretrained_wav)}
    report = {"created_utc": timestamp, "status": "passed", "python": platform.python_version(),
              "versions": {name: importlib.metadata.version(name) for name in
                           ["numpy", "torch", "transformers", "scikit-learn", "scipy"]},
              "source_sha256": {str(path.relative_to(ROOT)).replace('\\', '/'): sha256(path)
                                for path in [*sorted(CODE.iterdir()), Path(__file__)] if path.is_file()},
              "checks": checks, "executions": executions,
              "tone_fixture_sha256": sha256(tone),
              "pretrained_executed": args.pretrained}
    (EVIDENCE / "report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    print(json.dumps({"status": "passed", "report": str(EVIDENCE / "report.json"),
                      "heldout_mse": fit["heldout_after"]["reconstruction_mse_mean"],
                      "pretrained_executed": args.pretrained}, indent=2))


if __name__ == "__main__":
    main()
