# Authoring notes: K-Nearest Neighbors (KNN)

Canonical topic ID: `k-nearest-neighbors-knn`

## 2026-10-05 — Local regression as a query-dependent neighbour model

- Status: open
- Origin: `linear-logistic-regression`,
  [current reading-flow design](../classical-ml-reading-flow/linear-logistic-regression/reading-flow-revision.md),
  weighted-fitting extension in section 3.
- Destination and ownership rationale: KNN already teaches query-dependent
  neighbourhood selection, distance weighting and a local conditional-mean
  estimate. A locally weighted affine fit is a meaningful extension of that
  mechanism. The linear/logistic lesson teaches one globally fixed weighted fit;
  the key new idea here is that each query defines another fit and retains access
  to the reference data. SVM/kernel feature-space geometry is a different primary
  purpose, so it is not the best owner for this local-regression teaching bridge.
- Existing coverage: the complete current KNN manuscript teaches uniform and
  inverse-distance averaging, regression bounds, geometry and search, but does
  not develop locally weighted affine regression. This is a proposal for the
  authorized upcoming KNN revision, not a claim of a missing core KNN definition.
- Idea and learning benefit: distinguish a weighted local constant estimate from
  fitting a slope near a query. Explain why local affine estimates can extend
  beyond the selected targets' range whereas nonnegative normalized averaging
  cannot, and why small/rank-deficient neighbourhoods need a explicit policy.
- Proposed treatment: a visible deeper branch after KNN regression and distance
  weighting, linked to the actual weighted least-squares section once published.
  Retain all core KNN material; this does not by itself require a display-title or
  catalogue change. Inspect current coverage again before including it.
- Explanation/example: use a small one-dimensional reference dataset, a query q
  and a bandwidth h, define Gaussian distance weights exp(−(x−q)²/(2h²)), then
  scale both design rows and targets by square-root weights and solve the weighted
  affine fit. Draw query→weights→local line→value at q, beside the local constant
  weighted mean using the same weights. Move q/h only after their meanings are
  taught. Explicitly distinguish zero/underflowed support from a normalized mean;
  do not silently insert epsilon. Recompute a revealing curved example and a
  locally affine null case rather than promise a contrast on untested fixtures.
- Prerequisites and boundaries: weighted row transformation and rank-aware
  least-squares primitive from Linear & Logistic Regression; neighbourhood and
  metric scaling from KNN. Explain retained-reference storage and per-query solve
  costs; no universal smoother superiority or unsupported clinical application.
  Full scratch fit and an ordinary library route need their actual conventions
  examined by the destination author, not a bare package link.
- Evidence: [Stanford CS229 main notes](https://cs229.stanford.edu/main_notes.pdf),
  locally weighted regression section in the retrieved 23 August 2026 edition,
  read 5 October 2026. This is a mathematical teaching extension, not a measured
  application or current-library execution claim.
- Resolution: not yet reviewed by the destination author.
- Implementation/verification links: none yet; origin is design-stage only.
