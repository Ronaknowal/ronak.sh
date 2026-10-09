# Native selected-score comparison continuation

The initial once-only driver (session 4204, exit 1) completed finite enumeration,
scratch GRPO and scratch RLOO. All three terminal receipts and their exact full
outputs remain in scratch/grpo-research/study. Neither scratch fit is repeated.

Native GRPO stopped in the first constructed parity case, before native
generation, task evaluation or training. Its padding-free scorer zero-fills
ignored completion cells (pinned GRPO trainer line 1482); the raw backbone score
path computes finite values there but separately masks them from the objective.
The all-cell equality assertion therefore failed on 2 of 12 entries, maximum
absolute difference 4.449541091918945 at row 0, column 2. The original exact
program and observed error are preserved here. No native optimizer step occurred.

The only program change compares the selected completion cells. Both actual
losses and the all-parameter-gradient comparison remain unchanged, as does the
shadow-SGD comparison. This does not assert that unused native and scratch
storage values agree. The original protocol, versions, models, seeds, outputs
and hyperparameters stay frozen. The original driver is intentionally not
rerun: its old source guard must reject the changed comparison source.

continue_native.py first guards the complete continuation inputs, including all
original input recoveries and all completed-stage files. It runs only native
GRPO, native RLOO and native KTO into a fresh native-continuation directory.
Each still has the exact original two-update budget and constructed preflight.
Completed continuation stages are reused only with exact manifest/report
identity; partial directories stop. Exceptions create a separate failure record.
Different source review of this packet precedes that command.

The original program-protocol.md has a descriptive count typo: it says 32
source/model/data/native bindings. The authoritative prospective-protocol.json
contains 25, and its outer program-inputs.json contains 31. Their hashes and
contents are unchanged; this erratum does not alter the experiment.
