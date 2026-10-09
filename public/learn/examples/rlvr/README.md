# RLVR: complete offline programs

Use Python 3.12 and install the pinned requirements in a virtual environment:

```bash
python -m venv .venv
# Activate the environment using your shell's usual activation command.
python -m pip install -r requirements.txt
```

The supplied records contain complete questions and original solutions from
GSM8K, with its full MIT notice. `provenance.json` names the exact revision and
source-order selection. There are 24 selected training records and 12 untouched
test records; their questions fit a 240-byte filter and their final answers are
integers 0–99. This restricted subset is different from the full benchmark.

Start with the three small mechanism programs. They do not fit a language model:

```bash
python -B verifier_contracts.py --output verifier.json
python -B group_gradients.py --output groups.json
python -B reward_noise.py --output noise.json
python -B math_verify_bridge.py --output math-verify.json
```

The first program distinguishes a final numeric answer, finite arithmetic tests
and a formal proof in a small declared rule system. It never executes an
arbitrary Python candidate. The fourth uses ordinary Math-Verify and TRL's actual
accuracy reward with its own settings; its accepted objects can differ from the
strict final-marker contract used for the small causal study. On Windows this
finite demonstration uses the documented no-alarm worker-thread branch of the
TRL reward; it is not an execution sandbox.

The language-model study uses the exact supplied causal classes from the earlier
Causal Language Modeling program, whose source identity appears in
`backbone-provenance.json`. The fixed vocabulary contains raw byte addresses 0–255,
then PAD 256, EOS 257, BOS 258 and SEP 259. Each prompt contains the complete question
and a final-answer instruction; it never contains its gold. Only a response
`#### gold` plus EOS is used for warm-up supervision. Generated samples come from
the full temperature 1 model distribution with no answer or grammar filter.

```bash
python -B tiny_causal_rlvr.py --output observations/tiny-study.json --workdir checkpoints
python -B evaluate_rollouts.py --study observations/tiny-study.json --output observations/metrics.json
python -B trl_bridge.py --output observations/trl.json --workdir native-work
```

`protocol.json` gives the complete fixed budgets. The custom study has three
warm starts, three copied arms per seed and 48 scheduled rollout batches per arm.
GRPO arms have two updates per rollout; verified-sample SFT skips an empty
accepted set. Every raw response, genuine EOS/cap status, answer extraction,
old/reference/current log probability and scheduled/actual update remains in the
result. The teacher-forced warm loss is pooled over response targets; the GRPO
and selected-response SFT losses give each included response equal weight.

Both training programs require a fresh output file and work directory. The work
directory contains an append-only `events.jsonl` that records raw rollouts before
updates, each completed warm/update/evaluation event and any caught failure.
`latest-state.pt` is atomically replaced only at a coherent boundary; it retains
model, optimizer, reference and random-generator states, plus the current batch
and progress where applicable. Completed warm/final checkpoint files remain
separate. These private state files are for a deliberately reviewed continuation;
the programs never resume automatically or silently replace an earlier run.
If a process is terminated without an exception handler running, the last
durable events and coherent checkpoint still remain; the log cannot promise an
event describing an abrupt operating-system termination.

The native TRL program is a separate small GPT-2 architecture. It warms once,
saves that exact local checkpoint for the native reference loader, and performs
one native update. Its captured tensors are compared with an explicit loss,
gradient and AdamW update using the same inputs. Update equality retains its
original threshold and is reported separately from analytical consistency of
each step against its own first moments. The retained teaching study's actual
native/explicit update comparison failed: near-zero gradient rounding terms
were amplified by AdamW's epsilon scale. The original failure was not replayed
or relabelled a passing comparison. A separately reviewed continuation checked
the retained own-step arithmetic and ran only the previously unreached fixture.
The complete runnable successor exposes both results rather than asserting
that numerical loss/gradient tolerance guarantees equal optimizer updates.
A second mixed-coefficient
fixture is constructed on the captured addresses and performs no further update.
It tests the loss path even if the actual sampled group's reward is homogeneous.

For the pretrained tool comparison, acquire the exact Flan-T5-small revision
after installing the requirements. From this program directory, the first
command downloads that revision into the Hugging Face cache at `model-cache`;
the second opens it offline and generates the twelve evaluation responses:

```bash
python -c "from huggingface_hub import snapshot_download; snapshot_download(repo_id='google/flan-t5-small', revision='0fc9ddf78a1e988dac52e2dac162b0ede4fd74ab', cache_dir='model-cache')"
python -B hf_eval_math.py --cache model-cache --output observations/flan.json
```

Pass the same `model-cache` root to `--cache`, not an internal snapshot folder.
`cache_dir` makes the versioned repository cache layout; `local_dir` would be
a different flat export. Acquisition is a network download, not inference or
fitting. The evaluator uses `local_files_only=True` and does not download a
replacement or fit the checkpoint. See the ordinary
[download/cache guide](https://huggingface.co/docs/huggingface_hub/guides/download)
for the cache operation. For the full driver below, use `--cache model-cache`
if you acquired the checkpoint with this command.

Its 12 greedy predictions retain the full prompt, output token IDs and strict
verifier result. The returned encoder-decoder sequence starts with a decoder
start token, which is counted separately from new generated tokens.

To run the complete workflow in stage order:

```bash
python -B run_all.py --cache MODEL_CACHE --output-dir observations --workdir work
```

The driver reuses a passed stage only when the program, transitive local source,
protocol/data, relevant installed package versions, dependency results/statuses
and output bytes still match. It records stdout, stderr and failed statuses.
If a stage failed or its inputs changed, preserve that directory and choose a new
output and work directories for a deliberately reviewed continuation. Do not rerun fits
merely to obtain a more attractive outcome.

The small model has no pretrained mathematical knowledge. Numeric-only targets
do not teach or demonstrate correct reasoning. The result can show formatting,
memorization, no held-out gain or a failed training step; interpreting it requires
the actual denominators and complete outputs. Browser drawings replay those
retained values and finite fixtures; Python runs locally in your environment.

See `FILES.md` for every supplied source, data and configuration file.
