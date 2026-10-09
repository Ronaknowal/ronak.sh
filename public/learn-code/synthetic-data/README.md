# Synthetic data: complete programs and retained results

Extract `synthetic-programs-data.zip` into one directory and open a terminal
there. Python 3.12 was used. Create an environment with `python -m venv .venv`,
activate it (`.venv\Scripts\Activate.ps1` in PowerShell or
`source .venv/bin/activate` on macOS/Linux), then run
`python -m pip install -r requirements.txt`. A CPU PyTorch wheel is sufficient.
The measured environment used NumPy 2.5.3, PyTorch 2.14.0, Transformers 5.17.0,
Tokenizers 0.23.2 and SentencePiece 0.2.1. No GPU is required.

## Inspect without fitting or generating

- `source-records.json` contains the source identities, split and excluded rows.
- `candidates.json` retains all 34 actual FLAN outputs, complete prompts and
  token IDs, checkpoint revision, seeds, termination and timing.
- `selection.json` preserves 32 kept candidates and both rejected candidates.
- `audit.json` contains descriptive source/output inspection. Those notes did
  not select the corpus and are not calibrated factuality scores.
- `study.json` contains all nine student fits, evaluation histories, counts,
  parameter hashes and complete distributions for the recorded inspector.
- `program-outputs.json` contains the small sampling, verification, corpus,
  library and categorical outputs. These are mechanism examples; the
  categorical population is not a language model.
- `study-recipe.md` describes the fixed generation and student settings.

The three supplied `*-seed17.pt` files contain student parameter dictionaries.
Load only these trusted local files with `torch.load(path, weights_only=True)`
into `TinyLM(256, context=32, width=32, heads=2, layers=2)`. The complete helper
`tiny_causal_lm.py` is unchanged from Causal Language Modeling.

## Run the small mechanisms

```shell
python synthetic_sampling.py
python synthetic_verification.py
python synthetic_corpus.py
python synthetic_library.py
python synthetic_recursive.py
```

`synthetic_sampling.py` implements temperature, nucleus retention, inverse CDF
and a declared lookup generator. `synthetic_verification.py` evaluates a
restricted integer-expression grammar using exact fractions, then distinguishes
final-answer checks from equality checks. `synthetic_corpus.py` owns source
records, normalization, selection, diagnostics and efficient window indexing.
`synthetic_library.py` compares the mechanisms with native Transformers and
PyTorch operations. `synthetic_recursive.py` traces four finite population
rules and compares replacement simulations with a derived expectation.

## Execute a new real experiment

```shell
python synthetic_generate.py --cache .model-cache --output my-candidates.json
python synthetic_student.py --candidates my-candidates.json --output my-study
```

The first command may download `google/flan-t5-small` at revision
`0fc9ddf78a1e988dac52e2dac162b0ede4fd74ab`. Add `--local-only` to use an already
populated cache. The checkpoint's model card and Apache-2.0 license are at
https://huggingface.co/google/flan-t5-small. Model weights are not in this archive.
The tested native loader preserves distinct shared and output-head weights,
reporting that they cannot be tied under the saved configuration.

Generation creates a new file exclusively. Student training creates a new
directory exclusively. Pick unused output names; preserve failures and original
outputs. To study our already generated corpus with a new fit, pass
`--candidates candidates.json`; this is optional and does not inspect a frozen
result. Outputs may differ with different numerical libraries or hardware.

The source text is Lewis Carroll's *Alice's Adventures in Wonderland*.
`alice-provenance.json` records the Gutenberg source, extraction, hashes and
public-domain notice. Keep that provenance with redistributed text. The student
byte vocabulary differs from the teacher tokenizer; their token counts and
perplexities should not be interchanged. Three seeds and four related held-out
paragraphs are a teaching experiment, not a general synthetic-data benchmark.
