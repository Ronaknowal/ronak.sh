# Working files: keep useful evidence, remove finished working material

## Lean workspace decision — 10 October 2026

The user stopped further lesson implementation and explicitly requested removal
of accumulated experiments, previews and unnecessary handoffs, keeping the site,
prepared content and a small restart context. The [current handoff](../teaching/LESSON-AUTHORING-HANDOFF.md)
is the stopped-state entry point. Do not treat old rollout instructions or a
retained experiment as an instruction to resume it.

For future authorized work:

- Keep canonical website source/assets, pending manuscripts/specifications,
  explained programmes, substantive data, unresolved findings and cross-topic
  decisions. Keep teaching quality and depth unchanged.
- Use a scoped temporary preview and share public assets where possible. Do not
  copy the entire public tree into every correction build. Keep one useful current
  output while needed; retire it when the task closes or the user stops it.
- Record concise check results, source identities and actual limitations. Retain
  captures that establish distinct unresolved or accepted claims while needed;
  avoid overlapping screenshot campaigns and repeated unchanged states. Capture
  and storage volume are not measures of review quality.
- Keep a small dependency/version description and necessary scientific results.
  Installed experiment environments, package downloads, trained research weights
  and optimizer checkpoints need not remain indefinitely unless they are an
  intended deliverable or an active task requires them. Reinstalling an environment
  is separate from rerunning a successful scientific experiment.
- Do not freeze whole repository trees, installed packages, compiled builds or
  complete central-ledger copies for a bounded change. Prefer the exact affected
  original source, a small source/hash manifest and a concise result. Preserve an
  actual old source only when recovery or a stated comparison requires it.
- Keep one current handoff and existing semantic topic records. Replace stale
  next actions; do not prepend another dated history paragraph after every check.
- When the user explicitly retires old evidence, record that retirement. Remove
  only its artifact bindings from current checkpoints, preserve source hashes,
  phase states and historical qualifications, and never imply deleted attachments
  remain available or that cleanup recertifies a lesson.

The [retirement receipt](evidence/authoring-artifact-retirement-2026-10-10.json)
records this explicit cleanup. Its compressed binding tombstone is provenance,
not a backup of the removed material. Routine cleanup below remains source-safe;
it does not authorize deleting pending content or purging Git history.

The user's 11 September 2026 cleanup request applies to `scratch/` and temporary artifacts elsewhere in the workspace. Cleanup is part of finishing work, not a new recurring audit of every lesson.

The lesson-authoring skill's [handoff and cleanup lifecycle](../../skills/lesson-authoring/references/handoffs-and-cleanup.md) defines routine housekeeping at each topic/phase boundary and an explicit scoped cleanup mode. Perform the relevant housekeeping within the authorized task; a separate cleanup request is unnecessary for its own confirmed disposable work. This is not a background deletion service. Preserve content-first handoffs, unresolved topic notes, active workers' inputs and required evidence; respect explicit read-only scope. This document retains ownership of repository-specific file retention and removal checks.

## What belongs where

| Material | Location and lifetime |
| --- | --- |
| Reusable lesson teaching guidance | `skills/lesson-authoring/`; update its existing references instead of making another root manual. |
| Current authoring handoff, curriculum plans and project instructions | `docs/teaching/LESSON-AUTHORING-HANDOFF.md`, `docs/curriculum/` and `docs/teaching/projects/`, indexed by `docs/README.md`. |
| Useful completed rollout narratives | `docs/archive/lesson-rollout/`; preserve their evidence and label them as history. Remove redundant forwarding pages once active references use their destinations. |
| Lesson content, figures used by the site, models and examples | Topic-owned `src/` files and actual runtime assets under `public/`; keep them. |
| Reusable checks and example generators | Semantic files under `scripts/`; keep their documented inputs, avoid one script per tiny correction. |
| Content-first manuscript and visual/lab specifications awaiting phase two | `docs/teaching/drafts/<stable-topic-id>/`; keep while referenced by the delivery ledger. They are required handoff inputs even when another agent/session will implement them. |
| Current drafts, datasets and temporary execution outputs | One topic-owned directory under `scratch/`; keep while the active task needs them. Remove installed duplicate drafts and obsolete patch/install scripts. |
| Final numerical evidence, review summaries, source hashes and original baselines | Durable records under `docs/teaching/`; retain the necessary original inputs and linked final attachments. |
| Browser screenshots | Capture a useful default and selected changed/edge states at relevant widths. Keep images supporting the final visual review and unresolved findings. Remove unused intermediate, failed, duplicate and superseded captures after closure. Do not retain every button-click screenshot automatically. |
| Library logs, caches and build outputs | Use `scratch/<topic>/` or the tool's ignored output directory. Disable unnecessary training-file output where supported. Remove obsolete outputs when no live process or preview uses them; preserve installed dependencies and shared environments still in use. |

## At the end of a topic or bounded change

1. Record the requested phase's result and actual source version in the existing evidence record and central delivery ledger. Content-first completion does not finish the topic: preserve the pending manuscript/specifications and deferred-work instructions. Retire them only after integration and an updated checkpoint to retained equivalent sources or a useful archive. Keep the next action concise; completed checks are not a future task queue.
2. Decide which exact screenshots, native outputs and original inputs support that result. Prefer a small representative set with clear learning/verification purpose, without an arbitrary numerical quota. Keep additional states only when they establish a distinct claim or unresolved finding.
3. Check for active owners/processes, runtime imports, script inputs, documentation/evidence references and user-authored work before removal. An old timestamp, temporary filename, lack of Git tracking or lack of a direct reference alone does not prove a file is disposable. Dynamic paths need contextual inspection.
4. Remove confirmed disposable files. On Windows, resolve every target within the explicitly intended workspace directory, reject reparse points/path escapes, and use native literal-path file operations. Never delete a whole scratch tree or dependency environment by a broad wildcard.
5. Keep required attachments at their recorded paths. If retiring an obsolete attachment that has a historical reference, record its retirement or an exact accessible archive mapping; do not pretend a deleted attachment still exists. Do not rewrite frozen evidence to claim a new run.
6. Archive only material worth recovering; do not perpetually move all junk into a new folder. A compact recovery archive is appropriate for obsolete editing utilities when their history may matter. Generated unused screenshots usually need no archive once their final review evidence is retained.
7. Verify selected files are gone and protected files remain. Documentation/cleanup changes need these checks, not a new application build or all historical lesson tests. Remove the cleanup's own temporary inventory afterward and resume the authorized lesson task.

## Prevent obsolete instructions and mutation helpers from accumulating

Keep the active authoring handoff focused on current phase counts, the next eligible
work and links to canonical standards. Do not prepend a full completion narrative
after every batch. Record that narrative once in the topic/integration record;
distill a useful general lesson into the relevant standard or focused engineering
reference. Dated history must not require every future author to read it again.

Retire an unreferenced one-off script after its patch, source freeze or ledger update
is recorded. Especially remove helpers with fixed dates/status text or scripts that
would overwrite newer source, archives or handoffs. Reusable verifiers, required
inputs and recovery sidecars have a different lifetime: keep them while their
recorded purpose remains. A cache or duplicate working manuscript is not a pending
content packet merely because its filename says “draft”; use the ledger and retained
production owner to establish the difference before removal.

For a cleanup, record exact removed paths/reasons and any duplicate's retained
counterpart, then prove that runtime source, pending manuscript/specification packets
and ledgers were unchanged. Keep the small final record, not the temporary broad
inventory. Lack of a filename reference alone still does not authorize deletion.

## Optional inspection tool

`node scripts/audit-working-artifacts.mjs [output-json-path] [--protect scratch-folder-prefix ...]` produces a **read-only candidate report** for old scratch images, including direct references and byte-identical duplicates. Shared runtimes and dependency/cache directories are always excluded. Supply each active work prefix with `--protect`; the helper no longer assumes a historical Classical ML batch is still active. It does not approve deletion, interpret every dynamically constructed path or run any lesson checks. Use it only for an actual cleanup request or a concrete accumulation problem, not at every session start.

The teaching standard's bounded verification policy still applies: reuse passing evidence for unchanged code, rerun affected checks after relevant changes, and keep completed modules closed. Repository history and archived scripts are not authoring instructions.
