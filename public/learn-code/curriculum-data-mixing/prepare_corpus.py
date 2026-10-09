"""Build the optional offline excerpt file; training itself needs no network.

python prepare_corpus.py --cache ./downloads --output ./literary-domains.json
Python standard library only. Downloads three public-domain Gutenberg works.
The saved text is a literary sample, not a production pretraining benchmark.
"""
import argparse
import hashlib
import json
import re
import urllib.request
from pathlib import Path

SOURCES = [
    ("alice", 11, "Alice's Adventures in Wonderland", "Lewis Carroll",
     "Alice was beginning to get very tired"),
    ("time-machine", 35, "The Time Machine", "H. G. Wells",
     "The Time Traveller (for so it will be convenient to speak of him)"),
    ("great-expectations", 1400, "Great Expectations", "Charles Dickens",
     "My father's family name being Pirrip"),
]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def build(cache):
    cache.mkdir(parents=True, exist_ok=True)
    domains = []
    for key, number, title, author, beginning in SOURCES:
        url = f"https://www.gutenberg.org/cache/epub/{number}/pg{number}.txt"
        raw_path = cache / f"pg{number}.txt"
        if not raw_path.exists():
            request = urllib.request.Request(url, headers={"User-Agent": "LessonCorpus/1.0"})
            with urllib.request.urlopen(request, timeout=60) as response:
                raw_path.write_bytes(response.read())
        raw = raw_path.read_bytes()
        text = raw.decode("utf-8-sig").replace("\r\n", "\n")
        # Gutenberg editions can use curly apostrophes. Normalize the marker only.
        normalized = text.replace("’", "'")
        start = normalized.find(beginning)
        if start < 0:
            raise ValueError(f"Opening marker missing for {key}; inspect the changed source")
        end = text.find("*** END OF THE PROJECT GUTENBERG", start)
        if end < 0:
            raise ValueError(f"Gutenberg end marker missing for {key}")
        paragraphs = [" ".join(p.split()) for p in re.split(r"\n\s*\n", text[start:end])]
        # Skip chapter labels/ornaments using a frozen, model-independent rule.
        paragraphs = [p for p in paragraphs if len(p) >= 80][:96]
        if len(paragraphs) != 96:
            raise ValueError(f"Expected 96 substantive paragraphs for {key}")
        domains.append({
            "id": key, "title": title, "author": author,
            "catalogue_url": f"https://www.gutenberg.org/ebooks/{number}",
            "text_url": url, "source_sha256": digest(raw),
            "paragraphs": [{"id": f"{key}-{i:03d}",
                            "split": "train" if i < 72 else "tune" if i < 84 else "test",
                            "text": p} for i, p in enumerate(paragraphs)],
        })
    return {
        "schema": 1, "license": "Original works are public domain in the USA.",
        "license_url": "https://www.gutenberg.org/policy/license.html",
        "selection": "Starting at the named opening sentence: unwrap whitespace, retain paragraphs >=80 Unicode characters, select first96; indices0:72 train,72:84 tune,84:96 test. No model-based selection.",
        "tokenization": "UTF-8 bytes, fixed256 vocabulary; create adjacent byte pairs inside each paragraph only.",
        "purpose": "Small real-literature allocation experiment. Book identity defines each domain; no inference to web/code/math mixtures.",
        "domains": domains,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise FileExistsError("Choose a fresh output to preserve an existing corpus")
    result = build(args.cache)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), "sha256": digest(args.output.read_bytes()),
                      "paragraphs": {d["id"]: len(d["paragraphs"]) for d in result["domains"]}}, indent=2))


if __name__ == "__main__":
    main()
