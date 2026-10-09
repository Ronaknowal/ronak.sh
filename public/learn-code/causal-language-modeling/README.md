# Causal language modeling programs

Keep these files together. Python 3.12, NumPy and PyTorch run the scratch routes;
Transformers is required only by `causal_library.py`.
The offline library comparison was executed with Transformers 5.17.0 and
PyTorch 2.14.0+cpu. Its internally shifted mean and explicit mean both equal
2.098965883255005 nats over five targets, retaining two EOS targets.

```sh
python -m pip install numpy torch transformers
python causal_objective.py
python tiny_causal_lm.py --steps 300 --output study-local.json
python causal_library.py
python score_windows.py
```

`causal_objective.py` computes stable log probabilities, masked mean loss and its
gradient, checks PyTorch and finite differences, and constructs a packed-document
attention matrix. `tiny_causal_lm.py` owns the complete small decoder, train-only
vocabulary, training, exact-once batched scoring, bigram baseline and generation.
`causal_library.py` tests same-length labels/internal shift and EOS/PAD positions
using a local randomly initialized GPT-2; it downloads no model.
`score_windows.py` imports the local decoder and exposes every evaluated target.

The exact Alice train/held-out files and `alice-provenance.json` are copied from
the preceding tokenization lesson. Their original public-domain source,
paragraph split, normalization and hashes are retained. No held-out text is used
to fit the vocabulary or model. The vocabulary is characters seen in training
plus `<unk>`; line breaks/whitespace count as characters. The first real character
is unscored context, with no added BOS/EOS. The held-out unknown is scored using
the unknown ID. The corpus is too small to establish broad model quality.

`study.json` is a saved actual CPU run: seed17, 300 updates, context48, width32,
2 heads, 2 layers, 30,848 parameters, batch16, lr0.003, AdamW weight_decay0.01,
clip norm1, dropout0, Torch2.14.0+cpu. Its curves evaluate every eligible target
once with up to48 preceding characters. Learned position indices restart for
each cropped context. The smoothed bigram uses alpha0.5 and the identical
held-out targets. The small transformer improves over initialization but its
held-out mean remains slightly worse than the bigram; the lesson reports that
result. Generated samples are saved literally, not curated for fluent quality.
After that run, empty/singleton score guards and single-prompt/positive-temperature
generation guards were added. These do not change the recorded experiment's
nonempty inputs or training computation; the corpus experiment was not retrained.

The programs are bounded CPU teaching implementations, with transparent explicit
attention and token-weighted evaluation. The SDPA comparison is an ordinary tool
bridge, not a universal speed claim. Keep logs, environments and downloaded caches
outside this public directory. Use `-B` when importing local programs during checks
to avoid deploying `__pycache__` files.
