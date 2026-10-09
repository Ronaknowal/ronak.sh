# Prospective native API continuation

The initial native execution failed when constructing `DPOConfig`: TRL 1.14.2
accepts `precompute_ref_log_probs`, while the initial source supplied
`precompute_ref_logps`. The original protocol freeze, exact two predecessor
programs, failure receipt and full log are retained. That attempt completed the
40-update SFT warm-start but performed zero DPO updates. Its in-memory warm-start
weights were not persisted, so the corrected native execution must repeat that
warm-start. This is an explicit failed-attempt continuation, not an assertion of
one total warm-start execution.

The native source changes the parameter spelling while preserving its `False`
value, validates configuration before fitting, and adds `--preflight-only`.
That no-fit path checks the actual current trainer's record tokenization,
chosen-first collation, masks, loss and every policy gradient. It passed on the
initial randomly initialized weights: both losses 0.6931471824645996, maximum
gradient discrepancy 1.1920928955078125e-07. All 128 training and 64 held-out pairs
remain retained. It performs no optimizer update and does not produce a training
or quality result. The actual scientific run repeats parity after the specified
warm-start, before its DPO updates.

The runner adds an explicit `--freeze-file` argument so this continuation can use
a separate prospective source freeze without replacing the initial freeze.
Its execution and conserved-output guards remain otherwise unchanged. The initial
constructed fit and three deterministic mechanism stages remain bound to their
original executed source; they are not rerun or retroactively rebound.

All data, selection, tokenizer, model architecture, initialization seeds, update
budgets, optimizer/reduction settings, frozen-reference semantics, held-out
metrics and generation rules remain those of the original `study-protocol.md`.
No output from the failed native attempt informed a hyperparameter change. Freeze
these corrected program identities before the new native scientific execution,
and retain its separate receipt, log and outputs whether it succeeds or fails.
