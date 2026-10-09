"""Make the offline chapter I–III excerpt from a supplied Gutenberg #11 file.

No network access. Source is a caller-provided local UTF-8 download.
Usage: python scripts/prepare-masked-language-corpus.py path/to/pg11.txt
"""
from pathlib import Path
import hashlib
import json
import re
import sys

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]).read_text(encoding="utf-8-sig")
start = source.index("Alice was beginning")
end = source.index("\nCHAPTER IV.", start)
excerpt = source[start:end].strip() + "\n"
destination = root / "public/learn-code/masked-language-modeling/alice_excerpt.txt"
destination.write_text(excerpt, encoding="utf-8", newline="\n")
print(json.dumps({"source_sha256": hashlib.sha256(source.encode()).hexdigest(),
                  "excerpt_sha256": hashlib.sha256(destination.read_bytes()).hexdigest(),
                  "characters": len(excerpt),
                  "word_tokens": len(re.findall(r"[a-z]+", excerpt.lower()))}, indent=2))
