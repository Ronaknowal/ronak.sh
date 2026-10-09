# Lesson authoring: stopped-state handoff

Updated 10 October 2026. The user explicitly stopped further implementation and requested a lean workspace. **Do not resume a lesson, review, old rollout or preview campaign without a new request.** Cleanup does not complete unfinished phases or provide a new certification of completed lessons.

## Start here on a future request

- Reusable teaching instructions and modes: [lesson-authoring skill](../../skills/lesson-authoring/SKILL.md).
- Current phases, revision identities and topic records: [delivery ledger](lesson-delivery-progress.json), governed by [its contract](LESSON-DELIVERY-LEDGER.md).
- Scope and reading order: [curriculum plan](../curriculum/LEARNING-CURRICULUM-PLAN.md) and the live catalogue under src/learn/data/curriculum/.
- Prepared manuscripts and visual/lab specifications: docs/teaching/drafts/<topic-id>/, or the exact current content paths in the ledger.
- Unconsumed cross-topic discoveries: [topic notes](topic-notes/README.md). Preserve their reasons and reassess them for the receiving lesson.
- Runtime contracts: [learning code](../engineering/LEARNING-CODE-STANDARD.md) and [learning workspace](../engineering/LEARNING-WORKSPACE.md).
- Guided projects: [project standard](projects/PROJECT-AUTHORING-STANDARD.md).

Read the selected current packet and unresolved findings, not the entire history. Use actual catalogue sequence for “next”; publication order and old batch names are not teaching order. Content-only and implementation remain separate phases.

## Preserved unfinished work

This is a restart map, **not an active work queue**. Source and written work remain; deleted compiled previews and capture attachments are retired.

| Topic | Preserved state and remaining boundary |
| --- | --- |
| t-SNE & UMAP | Revision 5 content and corrected canonical/runtime products remain. The normal build and HTTP checks ran, but final normal Reader acceptance and phase closure were not completed. |
| Non-negative Matrix Factorization | Revision 4 complete content and corrected private runtime source remain. Separate stored-H input arrows, text enlargement, query-step/reset and caption wrapping corrections were made and sampled in the browser. Normal integration and final acceptance remain. |
| Feature Scaling, Encoding & Imputation | Revision 5 complete content, consolidated correction and private runtime source remain. The text-size preview was built and payload delivery checked. Final native and normal integration acceptance remain. |
| Cross-validation & Hyperparameter Tuning | Revision 4 full manuscript, visual/lab contracts, programmes and solved practice remain under content-authoring/. Author checks ran and independent review was in progress. Content/implementation completion was not promoted. |
| Regularization | Assessment/design work remains under its existing Classical ML owner; a complete new revision was not released. |
| Mathematics foundations | See the [compact Mathematics restart map](math-foundations-reading-flow/README.md). Entropy and Mutual Information sources are installed but normal acceptance is unfinished; Rate–Distortion/f-divergence private work, complete Dynamical Systems author content and corrected Itô design remain. Last accepted count: 45/57. |

The last scoped latest-standard count was Classical ML **17/39**. Deep Learning has **42/42 recorded completed implementations**, retaining the original review scopes; this is not a fresh exhaustive audit of every diagram, a “best possible” claim or observed beginner mastery. Older Classical implementations remain on the website even when their latest-standard revision is pending. LLM inference/serving positions 30–39 were previously completed within their own recorded scope.

## What cleanup means for future work

The [retirement record](../engineering/evidence/authoring-artifact-retirement-2026-10-10.json) identifies artifact classes and paths retired at the user's request. Compiled previews, bulk screenshots, downloaded reference copies, non-runtime model weights and experiment environments are not website content. Their historical references no longer promise accessible files. Required authoring source, prepared content, substantive data, concise findings and original phase history remain.

Only retired artifact entries are removed from current file/hash maps; retained source hashes and phase states are not refreshed or promoted. A compressed tombstone preserves those exact retired identities. Do not recreate deleted evidence merely to satisfy an obsolete campaign. On a new authorized task, run the checks warranted by its actual changed source and unresolved questions.

Use one scoped temporary preview, avoid copying the entire public tree into every experiment, and retire temporary output after its useful result is recorded. See [working-artifact retention](../engineering/WORKING-ARTIFACT-RETENTION.md). Keep lesson depth and verification quality; reduce accumulated working files instead.
