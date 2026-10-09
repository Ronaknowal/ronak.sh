"""Scoped native verification; uses an existing CPU PyTorch/Transformers environment."""
from pathlib import Path
import codecs
import contextlib
import hashlib
import importlib.util
import io
import json
import platform
import random
import runpy
import sys

ROOT = Path(__file__).resolve().parents[1]
PROGRAMS = ROOT / "public/learn-code/byte-level-tokenization-token-free-models"
PRIOR = ROOT / "public/learn-code/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram"
sys.path[:0] = [str(PROGRAMS), str(PRIOR)]
from utf8_stream import encode_utf8, UTF8Stream, byte_alphabet, mapped_bytes, unmap_tokens


def scratch_decode(data):
    return UTF8Stream().feed(data, final=True)


def accepts(function, data):
    try:
        return True, function(data)
    except (ValueError, UnicodeError):
        return False, None


def main():
    generator = random.Random(2026)
    fixed = [0, 0x7F, 0x80, 0x7FF, 0x800, 0xD7FF, 0xE000, 0xFFFF, 0x10000, 0x10FFFF]
    scalars = fixed + [value for value in (generator.randrange(0x110000) for _ in range(400))
                       if not 0xD800 <= value <= 0xDFFF]
    scalar_checks = 0
    for value in scalars:
        text = chr(value)
        assert encode_utf8(text) == text.encode("utf-8")
        assert scratch_decode(encode_utf8(text)) == text
        scalar_checks += 1
    for invalid in ["\ud800", "\udfff"]:
        assert not accepts(encode_utf8, invalid)[0]
    # Exhaustive short strings verify invalid leads/tails against an independent codec.
    short_checks = 0
    for first in range(256):
        for data in [bytes([first]), *(bytes([first, second]) for second in range(256))]:
            assert accepts(scratch_decode, data) == accepts(lambda value: value.decode("utf-8"), data)
            short_checks += 1
    bad_long = [bytes.fromhex(value) for value in [
        "e0 80 80", "ed a0 80", "f0 80 80 80", "f4 90 80 80", "f5 80 80 80",
        "e2 82", "f0 9f 8c", "e2 41 ac", "ed bf bf"]]
    random_long = [bytes(generator.randrange(256) for _ in range(generator.choice([3, 4, 5])))
                   for _ in range(2000)]
    for data in bad_long + random_long:
        assert accepts(scratch_decode, data) == accepts(lambda value: value.decode("utf-8"), data)
    partition_checks = 0
    for text in ["", "ABC", "café 🌍", "cafe\u0301", "Å € 👩‍🔬\n", "\ufeffA", "A≢Α."]:
        data = encode_utf8(text)
        assert unmap_tokens(mapped_bytes(text)) == data
        for split in range(len(data) + 1):
            own = UTF8Stream()
            library = codecs.getincrementaldecoder("utf-8")("strict")
            pieces = []
            for chunk in [b"", data[:split], b"", data[split:]]:
                emitted = own.feed(chunk)
                assert emitted == library.decode(chunk, final=False)
                pieces.append(emitted)
            assert own.feed(b"", final=True) == library.decode(b"", final=True)
            assert "".join(pieces) == text
            partition_checks += 1
    assert len(set(byte_alphabet())) == 256
    assert byte_alphabet()[32] == "Ġ"
    assert encode_utf8("A≢Α.").hex() == "41e289a2ce912e"  # RFC3629 §7
    outputs = {}
    for filename in ["utf8_stream.py", "byte_bpe_bridge.py", "byte_model_bridge.py", "byte_patches.py"]:
        buffer = io.StringIO()
        with contextlib.redirect_stdout(buffer):
            runpy.run_path(str(PROGRAMS / filename), run_name="__main__")
        outputs[filename] = json.loads(buffer.getvalue())
    source_paths = list(PROGRAMS.glob("*.py")) + [PRIOR / "subword_tokenizers.py", Path(__file__)]
    report = {
        "python": platform.python_version(), "platform": platform.platform(),
        "checks": {"scalar_encoding_cases": scalar_checks, "exhaustive_one_two_byte_cases": short_checks,
                   "long_malformed_or_random_cases": len(bad_long + random_long),
                   "stream_partitions": partition_checks, "RFC3629_example": "passed"},
        "programs": outputs,
        "limits": "CPU mechanics and tokenizer contracts only; no pretrained weights, BLT training, hardware benchmark or held-out language-quality claim.",
        "sourceBindings": [{"path": path.relative_to(ROOT).as_posix(),
                             "sha256": hashlib.sha256(path.read_bytes()).hexdigest()} for path in source_paths],
    }
    destination = ROOT / "docs/teaching/tokenization/byte-level-tokenization-token-free-models/native-evidence.json"
    destination.write_text(json.dumps(report, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    print(json.dumps(report["checks"]))


if __name__ == "__main__":
    main()
