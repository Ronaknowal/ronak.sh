# Observation archive guide

All clocks are simulated seconds. Arrival and service NPZ arrays are the realized
inputs, not new production observations. All raw per-request outcome arrays are
retained losslessly. NumPy loads them without additional dependencies:

```python
import numpy as np
with np.load("original/seed-17-constant-rho-0.8.inputs.npz") as arrays:
    arrivals = arrays["arrival"]
    service = arrays["service"]
    print(len(arrivals), arrivals[:3], service[:3])
```

`original/` contains nine complete original program outputs/statuses, fifteen FCFS
input/outcome/summary groups, all remaining input arrays and the original failure
record. The historical processor-sharing small main used the preserved old source;
it is not attributed to the later corrected source. Exponential FCFS rho.8 outcomes
are reused in M/G/1 comparison rows instead of simulating identical cases twice.

`continuation/` contains nine completed PS cases from those same saved inputs, the
two original unreached trace stretches, 33 boundary checks and their terminal report.
They use the corrected relative-event-work implementation. The original failed
seed17 PS attempt has no completed outcome and remains a failure in `original/`.
The continuation neither resampled inputs nor replayed completed stages.

`implementation/` supplies original and current PS source, the stopped diagnostic,
supplied-state repair checks, prospective continuation protocol and acceptance.
Original/current campaign drivers are retained for source attribution. These
repository-bound guarded drivers are evidence of the exact execution protocol;
ordinary standalone reproduction of mechanisms uses the program archive/README.

Stationary cases have N30,000 and first5,000 arrival warmup exclusion, seeds17/29/43,
mean isolated service1 second. This warmup is a heuristic; empirical tails can differ
from a stationary reference. Summaries distinguish the drained arrival cohort from
an independently clipped time window; no equality is forced between unlike samples.
The real512-row replays use fictional alpha.0002/beta.003 seconds per token. They do
not measure Azure service, TTFT or GPU speed. Raw source timestamps/fields and
CC-BY4.0 attribution are supplied separately in the program archive.

Original failure and corrected outcomes must remain distinct when reporting these
results. The compact `observations-summary.json` removes only detailed time-segment
lists and unfinished ID lists from replay measurements; this archive conserves them.
