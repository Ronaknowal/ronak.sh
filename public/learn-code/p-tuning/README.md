# P-Tuning and soft prompts: complete programs

Use Python3.12 with NumPy2.3.5, PyTorch2.14.0, Transformers5.19.0,
PEFT0.21.2, Tokenizers0.23.2, Accelerate1.15.0 and Safetensors0.8.0.
These are the executed lesson environment versions; install compatible wheels
for your own operating system. No program requires a GPU. The measured recipe
uses FP32 CPU with two threads. The mechanism programs use small random/fixed
fixtures and explicitly distinguish those outputs from pretrained results.

```sh
python -m venv .venv
python -m pip install numpy==2.3.5 torch==2.14.0 transformers==5.19.0 peft==0.21.2 tokenizers==0.23.2 accelerate==1.15.0 safetensors==0.8.0
python acquire_model.py --output pythia-14m
python sft_data.py --data poems --model pythia-14m --download --output data-audit.json
```

Activate the virtual environment before the pip/program commands. On Windows,
the interpreter is `.venv/Scripts/python.exe`; on Unix it is `.venv/bin/python`.
The acquisition helper checks the pinned Pythia-14M revision and every file hash.
The data helper fetches exactly the pinned public Poem Sentiment TSV files,
checks their hashes and excludes the declared mixed label. Existing mismatching
source files are reported rather than silently replaced. The base is roughly
56MB of FP32 tensors; the final study writes only adapters, training state and
records, reusing that one downloaded base.

Start with the mechanisms:

```sh
python soft_attention.py --output attention.json
python soft_decoder.py --output decoder.json
python soft_encoders.py --output encoders.json
python soft_token_head.py --output token-head-check
python soft_evaluate.py --verify --output alignment.json
python soft_peft.py --model pythia-14m --data poems --output native-check
```

`soft_attention.py` implements the complete NumPy forward and manual backward
and compares every prompt/key/value derivative with finite differences and
Torch. `soft_decoder.py` uses the unchanged prerequisite TinyLM blocks/parameters
inside explicit input/infix/deep-KV attention routes. Its labels are already
next-token labels aligned to real predictor rows. Its two one-step examples
show frozen-base gradient flow, not pretrained usefulness.

`soft_encoders.py` expands every gate of a two-layer bidirectional LSTM and
compares every parameter gradient with native PyTorch; its MLP counterexample
shows why shared rowwise weights do not themselves mix token rows.
`soft_token_head.py` implements a complete bidirectional prefix encoder and
head, then uses ordinary BERT/PEFT TOKEN_CLS. Both random fixtures fit five
selected token labels for30 updates. They are separate architectures, not a
benchmark comparison or a reproduction of P-Tuning v2's quality results.

`soft_peft.py` runs five ordinary native pretrained routes, one diagnostic SGD
update each, verifies unchanged base tensors, cached generation, exact cache
length and materialized reload. It records FP32 cached/full numerical drift and
a stricter float64 comparison. The stored prompt tensor is checked exactly;
matched single-record reload is checked separately from batch-size-dependent
FP32 projection differences. A prompt artifact is an inference representation;
it does not contain the original training encoder and optimizer. Native outputs
retain observed differences rather than claiming bitwise equivalence everywhere.

The actual nine-run experiment is deliberately separate:

```sh
python soft_study.py preflight --model pythia-14m --data poems --work study-preflight
python soft_study.py freeze --model pythia-14m --data poems --work study
python soft_study.py train --model pythia-14m --data poems --work study
python soft_study.py evaluate --model pythia-14m --data poems --work study
```

The preflight performs no update or held-out quality evaluation. It verifies
exact initial flat/MLP logits for all three seeds and native response alignment.
Freeze binds every program, data/model file, dependency version, optimizer
setting and all200 batch lists. Train rejects a changed contract and preserves
completed runs. Interrupted runs resume their last50-step checkpoint with the
same optimizer and RNG state. Do not edit a frozen program to alter an outcome.
All nine terminal fits and their dev-selected checkpoints must be sealed before
evaluation reads test outcomes. Test results already written are conserved.

The three methods are flat input rows, rowwise MLP-generated rows and direct
layerwise KV. Flat and MLP start at exactly the same materialized prompt for
each seed; direct KV has different initialization, parameter count and access
to layers. This compares three recipes, not an isolated causal effect of depth.
The setup is a small teaching experiment, not recommended tuning defaults.

The exact SFT helpers `sft_data.py` and `sft_evaluate.py` are bundled unchanged.
`soft_evaluate.py` removes only actual virtual output rows before handing real
positions to that evaluator. It retains distinct conditional NLL, full-vocabulary
greedy generation and three-complete-candidate scores including EOS. It uses
emitted lengths, so an actual generated ID is never discarded as stored padding.

Poem Sentiment is CC BY4.0 (Sheng and Uthus,2020); Pythia is Apache2.0. Preserve
their source records and license attributions. `tiny_causal_lm.py` is copied
exactly from this site's inspected causal-LM lesson. No prerequisite main is
replayed merely because its implementation is imported here.
