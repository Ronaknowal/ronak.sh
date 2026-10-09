# Run the SimPO programs

Extract the complete archive into a fresh directory. Use Python 3.12 and the
exact dependency versions in requirements.txt. A CPU is enough for these small
mechanism studies. The bundled HH records keep the upstream MIT license and
exact original strings; no data or pretrained model download is required.

```sh
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements.txt
python -B simpo_algebra.py --output algebra-results.json
python -B response_scores.py --output response-scores-results.json
python -B objective_geometry.py --output objective-geometry-results.json
python -B pair_records.py
```

simpo_algebra.py builds the score/margin math, complete finite probability tree,
shared-parameter drift and conflicting-label example with no fitting.
response_scores.py computes genuine causal target sums/counts and checks masks,
padding, row order and mean-score gradients. causal_backbone.py is the complete
causal Transformer used by scratch_simpo.py. Its three model classes are copied
exactly from the prerequisite; only the self-contained download description is
adapted. pair_records.py audits the supplied released comparisons and their
prompt-family split.

objective_geometry.py supplies a separate no-fit two-coordinate gradient plane
and checks the auxiliary token-mean denominator on unequal response lengths.
It supplements the seven frozen study programs without changing their measured
fits. The complete download therefore contains eight programs.

To repeat the native preparation in a fresh file, then check the actual native
collator/loss and every parameter gradient without any optimizer step:

```sh
python -B trl_simpo.py --prepare-only --selection my-selection.json
python -B trl_simpo.py --preflight-only --selection my-selection.json --workdir my-preflight --output my-preflight.json
```

The prepared rows include native BOS/EOS, preserve prompt context and genuine
response supervision, and reject entire oversized pairs before native tokenization
can truncate them. Plain SimPO uses the experimental CPOTrainer import supplied
by TRL 1.14.2, with cpo_alpha=0, alpha=0 and label_smoothing=0. simpo_gamma is the
absolute margin, not the paper's gamma/beta ratio. No trainer subclass is needed.

To run a new study, first read study-protocol.md. The bundled observations belong
to the supplied frozen sources; keep them intact. Use fresh result directories.
For unchanged sources and the supplied freeze, the following runs each declared
stage once, saving successful outputs and failed logs alike:

```sh
python -B simpo_study.py --output-dir my-simpo-observations
```

To change the scientific design, edit its protocol and relevant programs, prepare
the new selection in a new copy of this directory, and create a separately named
prospective freeze before fitting:

```sh
python -B simpo_study.py --freeze --freeze-file my-study-freeze.json
python -B simpo_study.py --freeze-file my-study-freeze.json --output-dir my-new-observations
```

The runner verifies every transitive source/data/protocol hash and package
version before reusing an existing successful result. It refuses changed or
unbound results and refuses to overwrite failed stages. Native model weights
and scratch final/initial weights remain in the selected result directory for
further no-fit checks. Source-controlled teaching downloads need not bundle
every binary model checkpoint; the result records identify the saved weights.

The four constructed continuations share a new seed-47 SFT initializer and differ
only in their stated objective change. Their narrow exact-format/capital criterion
uses training prompts. The separate seed-53 native run uses released comparisons
and a randomly initialized tiny GPT2. Neither is a pretrained assistant benchmark
or a claim that one preference method universally outperforms another.
