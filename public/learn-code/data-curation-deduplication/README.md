# Data curation and deduplication programs

Keep the eight Python files, corpus.jsonl and article.html in the same directory.
The prose explains each complete program next to its mechanism. These are CPU
teaching programs; no model or remote dataset is downloaded by them.

```sh
python -m venv .venv
# Activate this environment using your shell's normal command.
python -m pip install numpy==2.5.3 datasketch==2.0.0 pybloom-live==4.0.0 trafilatura==2.3.1 datatrove==0.10.1 tokenizers==0.23.2 orjson==3.12.0
python curation_records.py
python extraction_library.py
python lexical_dedup.py
python bloom_filter.py
python dedup_libraries.py
python audit_corpus.py --output my-audit.json
python semantic_candidates.py
python -X utf8 datatrove_pipeline.py --output ./my-new-curation-run
```

Verified with Python 3.12 on Windows. DataTrove's JSONL reader in this version uses
the process text encoding, so its command explicitly enables UTF-8 and checks
that kept plus removed IDs exactly account for the input. The output directory
must be new: no previous run is deleted or silently reused. Its declared SHA-1
hash option avoids a string-argument incompatibility between this DataTrove
snapshot and xxhash 4.0.1. The program uses the supported custom word-tokenizer
extension, five-word shingles and 14 bands of eight values. It does not run the
exact-Jaccard confirmation used in the scratch audit.

`corpus-provenance.json` attributes the original public-domain Alice paragraphs
and describes every constructed variant. `article.html` is a controlled HTML
wrapper around those same paragraphs. Quality ranks and variant family labels
are construction metadata, not model scores or human semantic-duplicate labels.
Original short source separators are intentionally retained and audited.

The saved `audit-results.json` contains the actual three-word-shingle pipeline:
115 inputs, 66 exact representatives, 27 candidates, 19 confirmed lexical pairs
and 47 retained component representatives. Candidate recall 1.0 is for this
particular corpus/threshold, not a general LSH guarantee. The ordinary datasketch
demo starts with all115 records, so its raw counts have a different denominator.
`datatrove-results.json` records55 kept and60 removed under its different policy.

Bloom's fixed1000-key/10000-query experiment observes103 false positives, versus
the approximate design rate. The cosine vectors are deliberately constructed
angles, not pretrained semantic embeddings. No output is a downstream language
quality benchmark. Scratch exhaustive comparisons are for the small audit only;
large buckets and cross-shard comparisons need explicit resource policies.
