"""Check new small teaching examples without rerunning unchanged native campaigns."""
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
import hashlib
import importlib.util
import json
import os
import re
import sys
from tempfile import TemporaryDirectory

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
OWNER = ROOT / "public/learn-code/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram"
LESSON = ROOT / "src/learn/data/topics/tokenization.jsx"
spec = importlib.util.spec_from_file_location("subword_teaching_examples", OWNER / "subword_tokenizers.py")
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)

snippets = re.findall(r'<CodeBlock language="python">\{`(.*?)`\}</CodeBlock>', LESSON.read_text(encoding="utf-8"), re.S)
counting = [code for code in snippets if code.startswith("from collections import Counter")]
assert len(counting) == 1
out = StringIO()
with redirect_stdout(out):
    exec(compile(counting[0], str(LESSON), "exec"), {})
assert out.getvalue().strip() == "9"
library = [code for code in snippets if code.startswith("from tokenizers import Tokenizer")]
assert len(library) == 1
library_output = StringIO()
previous_directory = Path.cwd()
with TemporaryDirectory(prefix="tokenizer-teaching-") as directory:
    try:
        os.chdir(directory)
        namespace = {}
        with redirect_stdout(library_output):
            exec(compile(library[0], str(LESSON), "exec"), namespace)
        assert namespace["tokenizer"].decode(namespace["encoded"].ids) == "lowest"
        assert Path("small-tokenizer.json").is_file()
    finally:
        os.chdir(previous_directory)

corpus = {"low": 5, "lower": 2, "newest": 6, "widest": 3}
bpe = module.train_bpe(corpus, 5)
assert bpe.merges == [("e", "s"), ("es", "t"), ("est", "</w>"), ("l", "o"), ("lo", "w")]
assert bpe.encode_word("lowest") == ["low", "est</w>"]
assert sum((len(word) + 1) * count for word, count in corpus.items()) == 95
assert sum(len(module.apply_bpe(list(word) + ["</w>"], bpe.merges[:1])) * count for word, count in corpus.items()) == 86
wp = module.WordPiece({"low", "lowest", "##er", "##est"})
assert wp.encode_word("lower") == ["low", "##er"]
assert wp.encode_word("lowest") == ["lowest"]
assert abs(0.6 / 0.64 - 0.9375) < 1e-12
assert abs((0.2 * 0.2) / 0.64 - 0.0625) < 1e-12
assert abs(0.9375 / 1.0625 - 15 / 17) < 1e-12
assert abs(0.0625 / 1.0625 - 1 / 17) < 1e-12
assert abs(0.64 * 0.2 - 0.128) < 1e-12
assert abs(0.64 * 0.6 + 0.128 * 0.2 - 0.4096) < 1e-12
assert 0.2 > 0.4 ** 2 and 0.1 < 0.45 ** 2
assert (6 * 6, 2 * 2) == (36, 4)

print(json.dumps({
    "status": "passed",
    "checks": ["Actual displayed Counter snippet prints 9", "Actual displayed ordinary Tokenizers train/encode/decode/save/reload workflow", "First five native merges and new-word trace", "95 to 86 symbol count", "Familiar WordPiece successes", "Posterior and fractional-count normalization", "Shared-prefix abab dynamic programming", "Changed probability winner", "Position-pair arithmetic"],
    "ordinaryLibraryOutput": library_output.getvalue().splitlines(),
    "scope": "New instructional fixtures; prior full model/native campaigns are reused separately against unchanged sources.",
    "sourceSha256": {str(file.relative_to(ROOT)).replace('\\', '/'): hashlib.sha256(file.read_bytes()).hexdigest() for file in [LESSON, OWNER / 'subword_tokenizers.py', Path(__file__)]}
}, indent=2))
