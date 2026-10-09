# Constructed parity precision continuation

The preceding selected-cell comparison repair remains valid. Its native-GRPO
preflight then stopped in an all-parameter FP32 gradient comparison before any
generation, task evaluation or training step. The failure receipt and exact
source are retained. No tolerance was silently changed and no completed stage
was replayed.

The agreed constructed-only diagnosis ran the same six cases in FP32 and FP64,
without generation or optimizer steps. All per-parameter coordinate counts,
norms, maximum errors and loss values are saved in gradient-diagnosis/. FP32
differences reach 0.0006198883 per coordinate; the largest global relative L2
error is 0.0000484189 and worst per-parameter relative L2 is 0.000438603. FP64
reduces the maximum coordinate difference to 8.70415e-13 and global relative L2
below 9.33e-14. These observations support a numerical precision explanation
for these constructed cases rather than an objective mismatch.

The successor runs constructed parity in FP64 with stronger loss, gradient and
shadow-update tolerances. It then restores the original dtype and verifies every
model parameter against the exact pre-conversion value. Actual sampled training
and all its per-batch comparisons remain FP32 with their original tolerances.
No model setting, data, seed, learning rate, group size or two-step budget changes.
The continuation driver runs only the three still-unstarted native routes in a
fresh native-precision-continuation directory, with the same conservation and
partial-stage guards as before. Different source review precedes execution.

Active-path source correction: the frozen use_liger_kernel=False route calls
GRPOTrainer._full_logits_logps and utils.selective_log_softmax(row_mask), whose
masked_fill returns zero for ignored rows. The earlier reference to line 1482
described an equivalent representation in the inactive chunked branch; it did
not identify this execution's active path. Neither full logits nor the backbone
is padding-free here. The selected-cell comparison remains the correct contract.
