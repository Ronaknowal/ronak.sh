"""Independent complementary checks; avoid rerunning the author's full corpus."""
from pathlib import Path
import codecs
import hashlib
import json
import math
import sys

ROOT = Path(__file__).resolve().parents[1]
PROGRAMS = ROOT / "public/learn-code/byte-level-tokenization-token-free-models"
PRIOR = ROOT / "public/learn-code/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram"
sys.path[:0] = [str(PROGRAMS), str(PRIOR)]
import numpy as np
import torch
from tokenizers import Tokenizer, models, pre_tokenizers, decoders
from utf8_stream import UTF8Stream, byte_alphabet, mapped_bytes, unmap_tokens
from subword_tokenizers import apply_bpe
from byte_model_bridge import make_batch, masked_nll, ByteLanguageModel, PAD
from byte_patches import patch_ids, pool_patches, torch_pool


def main():
    torch.set_num_threads(1)
    torch.manual_seed(13)
    results = {}

    # A learned symbol can straddle two scalar encodings without losing bytes.
    text = "éé"
    symbols = mapped_bytes(text)
    merges = [(symbols[1], symbols[2])]
    vocab = {symbol: byte for byte, symbol in enumerate(byte_alphabet())}
    vocab["".join(merges[0])] = 256
    native = Tokenizer(models.BPE(vocab=vocab, merges=merges))
    native.pre_tokenizer = pre_tokenizers.ByteLevel(add_prefix_space=False, use_regex=False)
    native.decoder = decoders.ByteLevel()
    pieces = apply_bpe(symbols, merges)
    assert pieces == native.encode(text).tokens
    payloads = [unmap_tokens([piece]) for piece in pieces]
    assert payloads == [bytes.fromhex(value) for value in ["c3", "a9 c3", "a9"]]
    assert b"".join(payloads).decode("utf-8") == text
    assert native.decode(native.encode(text).ids) == text
    results["cross_scalar_native_bpe_payloads"] = [payload.hex(" ") for payload in payloads]

    # Multiple successive incomplete chunks retain state; EOF changes validity.
    own, standard = UTF8Stream(), codecs.getincrementaldecoder("utf-8")("strict")
    chunks = [b"\xef", b"", b"\xbb\xbf\xe2", b"\x82", b"\xac!"]
    outputs = []
    for chunk in chunks:
        emitted = own.feed(chunk)
        assert emitted == standard.decode(chunk)
        outputs.append([emitted, own.remaining])
    assert own.feed(b"", final=True) == standard.decode(b"", final=True) == ""
    assert "".join(item[0] for item in outputs) == "\ufeff€!"
    for prefix in [b"\xe2", b"\xe2\x82"]:
        decoder = UTF8Stream()
        assert decoder.feed(prefix) == ""
        try:
            decoder.feed(b"", final=True)
            raise AssertionError("Truncated final scalar was accepted")
        except ValueError:
            pass
    results["multi_chunk_bom_and_euro_trace"] = outputs
    results["incomplete_prefix_then_eof_rejections"] = 2

    # Adding padding must not add supervised decisions or alter valid loss terms.
    inputs, targets = make_batch(["A", "é"])
    assert inputs.tolist() == [[2, 68, 0], [2, 198, 172]]
    assert targets.tolist() == [[68, 1, 0], [198, 172, 1]]
    logits = torch.randn(2, 3, 259, dtype=torch.float64, requires_grad=True)
    loss = masked_nll(logits, targets)
    valid = targets != PAD
    expected = -torch.log_softmax(logits[valid], dim=-1).gather(1, targets[valid, None]).mean()
    torch.testing.assert_close(loss, expected)
    padding_logits = torch.randn(2, 2, 259, dtype=torch.float64) * 100
    padded_loss = masked_nll(torch.cat([logits, padding_logits], dim=1),
                             torch.cat([targets, torch.zeros(2, 2, dtype=torch.long)], dim=1))
    torch.testing.assert_close(loss, padded_loss)
    gradient = torch.autograd.grad(loss, logits)[0]
    assert torch.count_nonzero(gradient[~valid]) == 0
    model = ByteLanguageModel().eval()
    with torch.no_grad():
        baseline = model(inputs)
        appended = model(torch.cat([inputs, torch.zeros(2, 2, dtype=torch.long)], dim=1))
    torch.testing.assert_close(baseline, appended[:, :3], atol=1e-6, rtol=1e-6)
    results["changed_batch_inputs"] = inputs.tolist()
    results["changed_batch_targets"] = targets.tolist()
    results["valid_target_count"] = int(valid.sum())
    results["padding_loss_delta"] = abs(loss.item() - padded_loss.item())
    results["padding_target_gradient_max"] = float(gradient[~valid].abs().max())
    results["appended_padding_logit_error"] = float((baseline - appended[:, :3]).abs().max())

    # Changed data gives exact hand-derived patch means and a refinement ordering.
    entropies = [0.2, 0.7, 0.5, 0.9, 0.1]
    ids = patch_ids(entropies, 0.5)
    assert ids.tolist() == [0, 1, 1, 2, 2]
    features = np.array([[2, 4], [1, 3], [5, 7], [0, 2], [8, 10]])
    expected_means = np.array([[2, 4], [3, 5], [4, 6]])
    np.testing.assert_array_equal(pool_patches(features, ids), expected_means)
    np.testing.assert_array_equal(torch_pool(features, ids), expected_means)
    counts = [int(patch_ids(entropies, threshold)[-1]) + 1 for threshold in [0, 0.5, 0.7, 1]]
    assert counts == [5, 3, 2, 1]
    # Permuting content within a patch cannot be recovered by averaging it.
    positions = np.array([[0, 10], [1, 11]])
    content = np.array([[4, 7], [8, 3]])
    np.testing.assert_array_equal((content + positions).mean(0),
                                  (content[::-1] + positions).mean(0))
    results["changed_patch_means"] = expected_means.tolist()
    results["monotonic_patch_counts"] = counts
    results["additive_position_mean_permutation_invariant"] = True
    results["practice_bpb"] = [20 / (10 * math.log(2)), 18 / (10 * math.log(2))]

    # Reuse the author's already-passed exhaustive checks only for identical files.
    directory = ROOT / "docs/teaching/tokenization/byte-level-tokenization-token-free-models"
    reused = []
    for filename in ["native-evidence.json", "model-evidence.json"]:
        evidence = json.loads((directory / filename).read_text())
        for binding in evidence["sourceBindings"]:
            digest = hashlib.sha256((ROOT / binding["path"]).read_bytes()).hexdigest()
            assert digest == binding["sha256"], binding["path"]
        reused.append(filename)
    files = [ROOT / "src/learn/data/topics/byte-level-tokenization.jsx",
             ROOT / "src/learn/data/byte-tokenization-model.js",
             ROOT / "src/learn/components/lesson-labs/ByteTokenizationLabs.jsx",
             ROOT / "src/learn/components/lesson-labs/byte-tokenization-labs.css",
             ROOT / "src/learn/data/curriculum/blueprints/byte-level-tokenization-token-free-models.js",
             directory / "design.md", *PROGRAMS.glob("*.py"), PRIOR / "subword_tokenizers.py",
             Path(__file__), *(directory / name for name in reused)]
    report = {
        "topic": "byte-level-tokenization-token-free-models", "date": "2026-09-28",
        "reviewer": "subword-tokenization agent; not the byte-topic author", "status": "passed",
        "complementaryChecks": results, "reusedAuthorReceipts": reused,
        "learningExperience": "independent-review.md", "torch": torch.__version__,
        "sourceBindings": [{"path": file.relative_to(ROOT).as_posix(),
                            "sha256": hashlib.sha256(file.read_bytes()).hexdigest()} for file in files],
        "limits": "CPU contracts and scoped mechanisms; final browser/build closure belongs to root. No human learner study or trained BLT reproduction.",
    }
    (directory / "independent-review.json").write_text(json.dumps(report, indent=2, ensure_ascii=True) + "\n")
    print(json.dumps(results))


if __name__ == "__main__":
    main()
