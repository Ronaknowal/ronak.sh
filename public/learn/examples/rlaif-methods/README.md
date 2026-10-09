# RLAIF, IPO and ORPO: complete local programs

These programs teach distinct feedback and objective mechanisms. They do not
reproduce the large published models or measure human assistant quality.
Released UltraFeedback Binarized labels are historical AI scores. A separate
small Flan judge produces conditional option scores, not calibrated human labels.

Use Python 3.12, create a local virtual environment, then install the pinned
dependencies in `requirements.txt`:

```sh
python -m venv .venv
python -m pip install -r requirements.txt
```

Activate that environment first, or call its Python executable explicitly. These
commands assume the entire directory was downloaded, including dependencies and
data. Installing packages is separate from the once-run study below.

| File | Operation |
| --- | --- |
| records_and_masks.py | Full real records, train-only vocabulary and aligned response targets |
| judge_labels.py | Pinned encoder-decoder complete-option scores, both response orders and single-answer ratings |
| feedback_learning.py | Soft-label reward head and declared 64-step gap fit |
| rlaif_loop.py | Two declared finite-action REINFORCE traces with detached baseline and fixed-reference KL |
| preference_losses.py | IPO/ORPO objective, derivative, numerical stability and shared-weight calculations |
| finite_preferences.py | Noisy-label optimum, published preference matrix and missing-support family |
| compare_training.py | Fifteen fixed small real-data fits with all three seeds and common warm states |
| trl_methods.py | Two matched native trainer/loss/gradient/one-update contracts |
| run_all.py | Prospective preparation/freeze, source-bound execution and conservative reuse |
| causal_backbone.py | Verbatim inspected TinyLM dependency |
| response_scores.py | Verbatim inspected shifted-target and mask dependency |
| records.json / selection.json | Full original selected rows and deterministic selection audit |
| provenance.json / UltraFeedback-LICENSE.txt | Exact dependency source and dataset attribution/license |
| study-protocol.md | Fixed budget, terminal rule, interpretations and limitations |

The scratch experiment uses 24 training and 12 held-out pairs, one causal block
with width 24, and lexical/punctuation tokens. Held-out unknowns remain unknown;
the vocabulary never grows from held-out text. Contexts and responses are not
truncated. The ORPO scratch arm is explicitly a **warm-started response-only
variant**. The native ORPO bridge imitates prompt plus response, matching the
pinned trainer's convention. Native and scratch architectures are different;
parity is between explicit and library computation on the same native GPT-2.

Prepare and freeze every program/data/tokenizer/schedule/environment dependency
before fitting. The first preparation may download the public pinned Flan model
to a local cache. The browser only replays saved observations.

```sh
python -B run_all.py --prepare --output-dir runs --cache model-cache
python -B run_all.py --output-dir runs --cache model-cache --stage all
```

Retained successful stages are reused only when their exact input and result
bindings remain valid. A failed stage remains a failed receipt; inspect it before
declaring and freezing a named implementation correction. Changing a source is
not permission to silently repeat fits until an attractive result appears.

Individual programs can also be run with their displayed command lines. Read
the protocol first: `feedback_learning.py`, `rlaif_loop.py`, `compare_training.py`
and `trl_methods.py` perform declared parameter updates. Other calculations are
no-fit audits. `judge_labels.py` performs pretrained inference and needs the
model cache. No program uploads a model or contacts a paid inference service.

Keep environments, model caches, generated trainer directories and weight files
outside public website assets. Scientific observations can be exported as JSON;
CPU timings, label agreement and native parity have different interpretation
from human quality. All seeds and fixed-terminal outcomes are retained.
