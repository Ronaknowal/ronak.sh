# Data Annotation & Labeling — full delivery

**Delivery complete — 28 September 2026.** Content and implementation are complete for this revision. Native checks, independent review and the final desktop/narrow/control/code-access verification are recorded below and in [the integration receipt](../integration-checks.json). Current status lives in the central ledger. No next action remains for this authorized increment; user acceptance is separate. Earlier checkpoint wording below describes the author/review sequence, not a pending queue.

Scope: one usable annotation/release workflow, not a survey of every labeling product. Stable title retained. Preflight: planned, both phases not started; no destination note. The unresolved inbox had only resolved DSA history and supplies no obligation here.

## Content checkpoint — 28 September 2026

Complete manuscript: `src/learn/data/topics/data-annotation-labeling.jsx`; complete programs/assets: `public/learn-code/data-annotation-labeling/`. Runtime investigation is specified below before its implementation. This is the actual prose/code checkpoint, not an outline. The parent integrator owns the central ledger and shared publication changes.

| Outcome/hurdle | Local teaching / visual | Implementation ownership |
| --- | --- | --- |
| Operational target versus vague label | Support-urgency rubric, positive/negative/unknown boundary examples (§1) | Local process contract; no fake requirement to write a labeling server |
| Independent judgments versus released target | Original six labels, majority tie, release lineage (§2) | Local majority and explicit approved-ID export adapter |
| Agreement versus validity; prevalence and undefined κ | Matrix, worked 4/6 and κ=1/3, all-R case (§3) | Local O(n+k) counts; sklearn independent route |
| UI names become export contracts | XML object/control names → task → checked result (§4–6) | Actual Label Studio schema; offline parser, UI server setup documented separately |
| Quality improvement versus more volume | Boundary-case review and blind audit; archive transcription application (§7) | Sampling/active-learning algorithms reused through linked owners |

## Visual specifications

**Release lineage figure (§2).** Four distinguishable stages: original message 17 → independent judgments A:U, B:R, C:U → proposal U, preserving B's original disagreement → reviewed annotation ID71. Reflowing HTML with arrows and stage labels; no new decorative color. Clearly separate an aggregation proposal from the final approved release. Phone stacks stages without hiding values. This is a constructed process example, not a claim about Label Studio's internal review model.

**Editable agreement board (§3).** Six actual constructed support messages, three per-row selects (U/R/abstain), per-row strict-majority proposal. Immediately show A/B 2×2 counts, paired n, p_o, marginal p_e, κ and missing coverage. Initial A=[U,U,R,R,U,R], B=[U,R,R,R,U,U], C=[U,U,R,R,R,R]; four agreements, p_e=.5, κ=1/3. The live board is counterfactual rater evidence, not graded learner answers. Third-rater edits change majority but not A/B κ. Null: all R → p_o=1, κ undefined; all abstain → n0 and undefined quantities. Pin the initial baseline in explanatory text; reset restores all18cells. More than two classes/weighted statistics are outside this model. Keep text labels and exact counts beside the matrix; no hue-only distinction. Per-card controls wrap at320px. Tests must compare scratchκ to sklearn and exercise entity edits/missing/all-R/reset in browser.

## Research and source decisions

All pages checked 28 September 2026; no video viewing claimed. Canonical methodological coverage assessed from Artstein/Poesio 2008 PDF's agreement, bias/prevalence and unitization discussions (`https://aclanthology.org/J08-4004.pdf`). Include the particular chance baseline and undefined case locally; alpha variants, complex unitization statistics remain an explained further-method boundary, not unsupported implementations. Label Studio setup/export/task-format docs were read for object/control naming, annotations versus predictions and cancellation; no hosted server was run. Official CVAT overview was read for a second modality's task/export workflow. sklearn Cohenκ docs checked formula/weights; native parity is separate evidence.

Relevant direct URLs: `https://labelstud.io/guide/setup`, `https://labelstud.io/guide/task_format`, `https://labelstud.io/guide/export`, `https://scikit-learn.org/stable/modules/generated/sklearn.metrics.cohen_kappa_score.html`, `https://docs.cvat.ai/docs/getting_started/overview/`.

The support and historical-archive applications are original constructed scenarios, not empirical deployments. No new topic needed. The exact annotation contracts are carried into the next two owned lessons rather than duplicated into destination TODO files.

## Review state

Content and runtime authored. Author review found the process distinction, κ/marginal buildup, the prevalence and missingness counterexamples, approved-ID export contract, quality-improvement loop and changed practice connected in reading order. The lab edits actual rater decisions, exposes missing coverage and recomputes the matrix and proposal immediately. Prompt text stays visible; hint/solution disclosures and the shared source/code UI are used. This is an author's heuristic assessment, not a learner study or independent review.

`node scripts/verify-framework-data-contracts.mjs` passed the initial, missing/all-R, third-rater and reset-value model cases. `scripts/verify-framework-data-contracts.py` executed the complete program and compared all 256 binary two-rater/four-item assignments with sklearn, preserving undefined denominators. Exact package versions and public-source hashes are retained in [the shared native evidence](../computer-vision-libraries/native-evidence.json); current topic source identities are in `author-evidence.json`. The constructed release produced task17/Urgent/approved annotation71. No Label Studio server or multi-user UI execution is claimed.

Final author refinement: both marginals and observed agreement now accumulate in one pass with O(k) additional memory; the paired-row copy is removed. The affected 256-case sklearn comparison, empty/missing cases and complete annotation program were rerun successfully; unchanged NLP/CV results were retained. Parent reported successful desktop/narrow interaction and shared code-control checks; the final integration receipt remains parent-owned.

[Independent review](independent-review.md) by frameworks_functional_tracking is complete with no open source blocker; `independent-review.json` records reviewed identities and complementary proposal/export checks. The author also inspected the parent's desktop, 320px and all-abstain captures: matrix counts, proposals, paired denominator and undefined values remain visible and consistent, with wrapping controls.
