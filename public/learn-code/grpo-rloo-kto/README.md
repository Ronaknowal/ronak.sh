# Grouped policy gradients and individual preference labels

The complete programs accompany GRPO, RLOO, KTO & Advanced Preference Methods.
The scratch route owns sampling, positional response masks, rewards, group
statistics, ratios, reductions and updates. Transformers supplies the causal
decoder and PyTorch supplies autograd. The ordinary route uses actual TRL
GRPOTrainer, RLOOTrainer and KTOTrainer with explicit configurations.

## Set up and start with finite calculations

Use Python 3.12 in a virtual environment. From this extracted directory:

```sh
python -m venv .venv
```

Activate `.venv` (`.venv\Scripts\Activate.ps1` in PowerShell or
`source .venv/bin/activate` on POSIX), then:

```sh
python -m pip install -r requirements.txt
python group_estimators.py --group-size 4 --output finite.json
python group_losses.py --output losses.json
python kto_loss.py --output utility.json
python group_checks.py --output mechanism-checks.json
python practice_answers.py --output practice-answers.json
```

The first program needs NumPy and no model. The next two use constructed score
tensors, and the last checks scalar/tensor mechanisms. None of these commands
fits a pretrained model. They print and save different evidence: exact finite
estimator distributions, explicit masked objectives, a score-coordinate KTO
step, independent correctness checks and all changed practice answers. Use distinct output names to retain
your previous comparisons.

## Real data and the recorded model lineage

The three TSVs are unchanged copies of Google Research's
[Poem Sentiment](https://github.com/google-research-datasets/poem-sentiment),
revision `612e9a1f86799126c68f0c5d9c3f1fc28f88068f`, under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Credit Emily Sheng and David Uthus, *Investigating Societal Biases in a Poetry
Composition System* (2020), [paper](https://arxiv.org/abs/2011.02686).
The two unchanged SFT helpers exclude mixed labels, yielding 843 training,
105 development and 104 test records. They preserve the literal prompt,
causal shift, true EOS and positional padding mask, and strict output parser.
The release supplies verse labels, not poem-level grouping IDs.

The recorded estimator and update study starts from the SFT lesson's selected
response-only seed-17 checkpoint, derived from
[EleutherAI/pythia-14m](https://huggingface.co/EleutherAI/pythia-14m/tree/cf967c0a9a04383db6f7b1108d86b2962634b4ac)
at revision `cf967c0a9a04383db6f7b1108d86b2962634b4ac` (Apache-2.0).
Its model.safetensors SHA256 is
`8ffe40fc676d22d608b58b35af11bf467c36981dbb3ccfe373a7d574bd8251cd`.
Adapted weights are not included in this archive. Reuse your existing SFT
`response-17/selected` directory, including its tokenizer files. The SFT
lesson's archive contains acquisition and full training instructions. A new
SFT run is a new result; hardware and versions need not reproduce these bytes.

## Run your own complete routes

These commands accept a local causal-model checkpoint with its tokenizer. They
create new two-step demonstrations; they do not reproduce the recorded result
merely because the commands have the same shape. On CPU, allow time for model
loading, generation, full-gradient comparisons and fixed evaluation. Keep the
output folders distinct; partial folders are retained rather than overwritten.

```sh
python online_preferences.py --model response-17/selected --data data --method grpo --output my-scratch-grpo
python online_preferences.py --model response-17/selected --data data --method rloo --output my-scratch-rloo
python trl_group_training.py --model response-17/selected --data data --method grpo --output my-native-grpo
python trl_group_training.py --model response-17/selected --data data --method rloo --output my-native-rloo
python trl_kto.py --model response-17/selected --data data --output my-native-kto
```

If you have no adapted checkpoint, the SFT acquisition command can download the
pinned base checkpoint into `pythia-14m`; supply that path to these individual
commands for a separate base-model experiment. That model may rarely emit a
valid task label. Do not relabel those outputs as this lesson's SFT-initialized
study or change sampling until a favourable group appears.

The grouped native program has `--preflight-only` for its constructed loss and
all-gradient checks. That mode performs model forwards, but no task generation
or training updates. It is useful for diagnosing an implementation before a new
experiment. Numerical failures must be investigated, not silently ignored.

## Guard the exact recorded protocol

The study driver deliberately requires the recorded SFT weight hash. It freezes
all program, model, tokenizer, data, trainer-source and environment identities,
plus 144 explicit candidate token spans for 16 training and 32 evaluation verses.

```sh
python group_study.py prepare --model response-17/selected --data data --protocol my-protocol.json
python group_study.py execute --protocol my-protocol.json --output my-study
```

Review the prepared file before execution. The main finite stage scores three
complete candidates once per evaluation verse and enumerates all ordered groups
of size 2 and 4 under the resulting restricted policy. Those are candidate-logit
gradients, not a distribution of full neural-weight gradients or unrestricted
generation outcomes. The two scratch and three native routes each have two
updates, fixed seeds and fixed initial weights. Every output and failed stage
is retained. Completed-stage reuse requires exact protocol and report identity;
partial directories stop. Do not remove a partial directory to bypass that guard.

The retained local study may contain a separately reviewed continuation after
an implementation check fails. Such a continuation preserves successful earlier
stages and their executed source; it is not a claim that the whole campaign was
replayed with later code. Consult the lesson's provenance records for that exact
history. Changing a program invalidates an existing protocol's source guard.

## Interpret the output

Reward groups, selected masks, log ratios, loss reductions, all-gradient parity,
parameter changes and reload results answer different questions. A zero centered
reward advantage does not imply a zero reference-penalty gradient. Small changes
in response NLL need not change a greedy label. KTO's labelled records are not
the same evidence as an online reward group. These two-step observations do not
establish convergence, a method ranking or performance on a new benchmark.

The `evidence/` directory includes all six terminal stage reports, both native
preflight failures, the constructed precision diagnosis and the accepted
continuations. The original finite and scratch stages were not replayed. Native
GRPO/RLOO constructed nonzero comparisons use float64 and restore every original
parameter to float32 exactly before training; actual training-batch comparisons
retain their float32 thresholds. KTO's actual preparation rotates the preceding
completion into each row, wrapping the final completion to the first prompt.

All five final routes retained 20/32 greedy and candidate accuracy. Native final
response NLL increased slightly; scratch final NLL decreased slightly. These
small, different-data/sampling demonstrations support inspection of behavior,
not selection of a superior algorithm. `provenance.json` maps every public
evidence file to its original source identity; only native report output-directory
strings are made machine-neutral. `FILES.sha256.json` verifies the packaged files.
