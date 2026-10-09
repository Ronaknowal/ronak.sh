# Cross-validation & Hyperparameter Tuning

Choosing a recipe is learning from data. This lesson follows each row through preparation, comparison, selection, assessment and refitting so that a score answers the question you intended. We begin with seven points whose predictions can be traced by hand, then read a complete offline Penguins experiment, derive uncertainty limits, and build small adaptive search/resource procedures.

**Before starting:** know features/targets and a held-out prediction, basic KNN distance/voting, arrays/indexing, means and variance. The preceding [Feature Scaling, Encoding & Imputation](/learn/path/full-curriculum/feature-scaling-encoding-imputation?module=classical-ml) explains fitted preparation; we reconstruct its boundary locally. The [KNN estimator section](/learn/path/full-curriculum/k-nearest-neighbors-knn?module=classical-ml#4-build-a-complete-neighbor-estimator) supplies the predictor background. The deeper branches introduce the probability conditioning and finite sums they use; no unseen Bayesian optimizer is required.

**You will be able to:** construct legal folds and trace one prediction; choose row/group/time boundaries from future use; implement training-only mixed preparation; assess a complete selector with protected outer data; reason about finite search mass and adaptive history; distinguish fitted-model/recipe error and covariance; audit resource, failures and final refit; write a reproducible report with an honest scope.

Use this single learning compass to navigate. For a working first pass, read §§1–6, §9 and the core practice/endings; return to the visible deeper branches in §§7–8 for inference and adaptive allocation. Full programs, outputs and explanations remain in reading order. [Setup and complete file index](setup-and-files.md) identifies dependencies, offline data, teaching/answer assets and the meaning of each retained stream.

1. [What exactly are we trying to estimate?](#1-what-exactly-are-we-trying-to-estimate)
2. [Build cross-validation one held-out prediction at a time](#2-build-cross-validation-one-held-out-prediction-at-a-time)
3. [Choose splits that match future use](#3-choose-splits-that-match-the-future-use)
4. [Selection can learn validation answers](#4-selection-can-learn-the-validation-answers)
5. [What does the search give a chance to win?](#5-search-the-settings-you-actually-mean-to-compare)
6. [Read a complete real experiment](#6-a-complete-nested-experiment-with-real-observations)
7. [Deeper: risk and uncertainty](#7-deeper-branch-what-cross-validation-uncertainty-does-and-does-not-mean)
8. [Deeper: adaptive search and paid resources](#8-deeper-branch-adaptive-search-and-spending-resources)
9. [Execute and report the whole procedure](#9-run-a-useful-comparison-within-an-honest-budget)
10. [Practise with changed inputs](#10-practice-identify-the-decision-before-computing-the-score)
11. [Readiness and what follows](#11-readiness-and-what-follows)
