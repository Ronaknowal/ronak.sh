# Independent review — Tensor Shapes, Autograd Graphs & Device Boundaries

Reviewer: frameworks_annotation_modalities · 28 September 2026.

Read the complete manuscript, both canonical programs, both live labs, numerical models, scoped CSS, blueprint, design record and author native evidence. The lesson develops axis meaning before shape notation, demonstrates the accidental cross-pair loss numerically, derives the reverse reductions, and connects the efficient manual affine gradients to the ordinary `nn.Linear` route. The storage/graph investigation keeps value equality, buffer aliasing and differentiability separate. The distinction between a connected zero derivative and an unused route with `None` is maintained in prose, code and live output. Existing autodiff mechanisms are linked rather than silently duplicated.

Independently executed 24 complementary dependency and invariance checks: changing one target leaves unrelated paired gradients unchanged while changing every cross-pair gradient by the expected amount; translating predictions and targets together preserves both losses; all four storage/graph routes preserve a zero residual while distinguishing connected zero gradients from disconnected `None`. All passed. Read the final formatted model and lab source and verified both canonical program SHA-256 values against the author native receipt.

The author's separate CPU campaign reports 18 shape configurations, 192 finite-difference derivatives with maximum error 8.413006402641088e-11, 30 matched manual/library SGD steps, invalid-shape rejection and the storage/graph/dtype audit. This review does not claim to have rerun that campaign. The conditional CUDA copy branch was not executed because the retained runtime has no CUDA device.

No remaining source correctness or teaching blocker found. Source identities and exact complementary scope are recorded in `independent-review.json`. Parent owns rendered desktop/mobile, control interactions, copy/download, theme and integration checks; source review is not a substitute for those checks.
