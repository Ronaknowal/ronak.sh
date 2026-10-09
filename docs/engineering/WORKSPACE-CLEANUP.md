# Workspace cleanup records

Historical entries below describe their original requests. They do not authorize
resuming lesson implementation. The current state is the [stopped-state handoff](../teaching/LESSON-AUTHORING-HANDOFF.md).

## Additional residual cleanup — 10 October 2026

After the earlier lean cleanup, removed another **15,590 files / 471.3 MiB**:

| Material | Removed | Preservation |
| --- | ---: | --- |
| Byte-identical frozen/review source snapshots | 360.3 MiB across 13,762 files | 5,093 retained counterpart files passed fresh SHA-256 checks. Unique old source, drafts and current checkpoint inputs remain. |
| Unused RLHF research dependency install | 97.9 MiB across 1,718 files | Package/version metadata is recorded; the bound TRL research source and scientific inputs remain. |
| Retired MoE prototype output and one-off helpers | 13.2 MiB across 110 files | Canonical MoE source/assets, completed topic records and unfinished information-lesson source remain. |

The final readable workspace footprint is **3.05 GiB**. This excludes 424 inaccessible paths and does not follow links, so it is a lower bound rather than a claim about total physical disk usage. Removed 3,584 empty directories and all nine temporary cleanup files. The remaining size includes about 731 MiB of Git history, 372 MiB of website source/assets, frontend tooling, and preserved authoring content/evidence.

There were no deletion failures. All **12,417 current checkpoint paths** were protected; the delivery ledger, package manifests, AGENTS and teaching skill retain their exact hashes. Source/public/scripts/skills file counts and byte totals are unchanged. Website source and public assets total **372.1 MiB**. No further implementation, build, science replay, phase promotion or Git-history purge occurred. Previously permission-blocked folders were left unchanged.

The Mathematics index is now a short [stopped-state restart map](../teaching/math-foundations-reading-flow/README.md). It replaces repeated historical progress paragraphs and obsolete agent assignments while retaining substantive per-topic records and future-topic notes. Entropy and Mutual Information are explicitly recorded as installed source with unfinished normal acceptance.

The [verification receipt](evidence/residual-cleanup-2026-10-10.json) records the actual deletion and preservation checks. Its small compressed retirement manifest maps removed duplicate paths to their byte-identical retained counterparts at cleanup time. Historical snapshot paths are retired, not silently recertified; current checkpoint maps were not changed. Temporary audit inventories and cleanup helpers are removed after verification.

## Lean workspace cleanup — 10 October 2026

The user stopped further implementation and requested removal of unnecessary
experiments and working instructions. Removed approximately **49.8 GiB** of
compiled previews, bulk captures/traces, downloadable reference copies,
scientific dependency environments, model/training outputs and accidental
outer-workspace package installs. No new lessons, scientific reruns, commits,
pushes or deployments were performed.

The remaining **measured readable footprint is approximately 3.5 GiB**, including
Git history, frontend dependencies, website source/assets, prepared content,
substantive inputs and retained records. This is a lower bound: 424 inaccessible
paths could not be measured, and symbolic links were not followed. The website's
source/assets themselves remain about 372 MiB; repository size also includes
necessary authoring material and version history. No Git history was purged.

The [retirement receipt](evidence/authoring-artifact-retirement-2026-10-10.json)
records exact removal identities, source-preservation checks and measurement
limits. Its small compressed binding tombstone preserves provenance rather than
the deleted artifacts. Phase states and history were preserved; removing old
artifact bindings does not certify lesson quality. The retained-file comparison
found zero unexpected changes. The delivery ledger check passed for 235 topics
and eight checkpoint fixtures. The repository file check was blocked by Windows
permissions in the optional FAISS package directory below. A build was not rerun
because canonical website source/assets and tooling were unchanged.

### Seven folders left at the user's request

All paths below are relative to
`C:\Personal Projects and files\Portfolio\Portfolio\`.
Deletion was attempted but Windows ownership/permissions prevented it. The user
declined an administrator prompt and asked to leave these folders.

1. `scratch\rlvr\packages`
2. `scratch\math-library-runtime`
3. `scratch\llm-workflows-runtime`
4. `scratch\core-frameworks-retrieval-runtime`
5. `scratch\causal-reading-research\xls-reader`
6. `scratch\core-frameworks-modalities\packages`
7. `docs\teaching\classical-ml-reading-flow\k-means-hierarchical-clustering\content-preparation\optional-faiss-packages`

The final inventory also encountered older unreadable entries under
`scratch\next-three-review`, `scratch\hopfield-check-7vurl561`,
`scratch\tokenization-runtime\packages`, and
`scratch\training-frameworks-runtime`. These were not recursively deleted or
claimed removed; their exact inaccessible paths remain in the receipt. Inspect
their contents before deciding to remove them.

### Optional future manual removal

For one of the seven confirmed disposable folders, use Windows Terminal opened
**as Administrator**. Set `$folder` to that folder's exact absolute path, confirm
it points to the intended temporary folder, and do not substitute the repository
root. If its contents have changed since this cleanup, inspect them first.

```powershell
$folder = 'C:\Personal Projects and files\Portfolio\Portfolio\scratch\rlvr\packages'
Get-Item -LiteralPath $folder -Force
takeown.exe /F $folder /R /D Y /SKIPSL
icacls.exe $folder /grant '*S-1-5-32-544:(OI)(CI)F' /T /C /L
```

These commands repair ownership/access only for the chosen folder. Check that
both finish successfully and that the tree contains no junctions or symbolic
links before recursive removal. Then:

```powershell
Remove-Item -LiteralPath $folder -Recurse -Force
```

Repeat individually for other confirmed disposable folders if wanted. No
administrator action was launched during this cleanup.

## Earlier cleanup — 11 September 2026

The user requested removal of obsolete working material and instructions that caused unnecessary repeated checking before continuing the first ten Classical ML topics.

## Completed cleanup

- Removed **113 loose scratch files**: 112 unreferenced one-off editing utilities and the Decision Trees lesson draft, proven byte-identical to its installed production source. Their 277,911 bytes are recoverable from one 136,369-byte ZIP in [the historical archive](../archive/workspace-cleanup/README.md).
- Preserved active work, the shared Python environment, original-source archives, verification outputs, referenced screenshots, nonidentical drafts and required datasets. The full scratch inventory contained 597 top-level entries and about 2.72 GB; the Python runtime alone accounted for about 1.55 GB. This cleanup reduces obsolete working instructions, rather than claiming most of that necessary storage was reclaimed.
- Shortened the active handoff to current scope, teaching contracts, relevant links and a concrete resume checkpoint. Detailed historical results remain in their existing records.
- Added explicit bounded verification and scratch-retention rules. Passing checks on unchanged source are reused. Repairs trigger affected checks; completed modules and old integration runs stay closed unless a relevant change or concrete concern justifies reopening them.
- Updated the ten-topic ledger with the already recorded author-review states and the outstanding regression model amendment. No lesson was marked independently reviewed or integrated by cleanup.

## Verification and recovery

The exact [cleanup manifest](../teaching/evidence/workspace-cleanup-2026-09-11.json) records removed file hashes, archive hash, duplicate-source proof and retained active paths. All **1,930 existing source, tooling and configuration files** matched their pre-cleanup fingerprints. No application source, topic, publication mapping or curriculum order changed during cleanup. No lesson tests or application build were rerun for these documentation/file-retention changes.

Automatic approval review rejected the initial broader deletion because it included drafts and verification material that might still be needed. That broader deletion did not run. The completed alternative was narrowed to editing utilities and the proven duplicate, with a byte-verified recovery archive created before removal. Verification artifacts and other uncertain files remain in place.

Continue from [the current implementation checkpoint](../archive/lesson-rollout/CLASSICAL-ML-SUPERVISED-IMPLEMENTATION.md#resume-checkpoint--after-workspace-cleanup-11-september-2026), not from archived utilities or scratch folder names. This record is a completed cleanup report, not a recurring task.

## Additional image and workspace cleanup

The user's follow-up explicitly requested removal of unnecessary images and temporary material outside scratch, followed by resuming implementation. The [additional manifest](../teaching/evidence/working-artifact-cleanup-2026-09-11.json) records **2,222 removed obsolete screenshots (187,565,742 bytes)** and **35 removed temporary files outside scratch**. All 5,327 images matched to evidence/source references were retained, along with active Classical ML material. Additional uncertain/unreferenced images were not automatically deleted merely for lacking a direct reference.

Outside cleanup covered the old `tmp_moe` working scripts/data, empty `tmp_vit`, `tmp_*.py`, `scratch_neural_ode.py`, the zero-byte `npm` redirect artifact, CatBoost training logs and the outer `_curation_scratch` / `_synth_scratch` working files. Their exact small contents are recoverable from `docs/archive/workspace-cleanup/2026-09-11-legacy-topic-working-files.zip` (57,667 bytes). Shared Python/Node dependencies, source, actual runtime images, build configuration and active review data were preserved.

The new [working-artifact retention policy](WORKING-ARTIFACT-RETENTION.md) makes cleanup part of topic completion: keep selected final evidence and remove superseded captures, installed duplicate drafts and temporary tool outputs. The optional image audit only identifies candidates; it is not a periodic task or authorization to delete every unreferenced file.


## Storage cleanup and cause report — 9 October 2026

The user requested removal of unnecessary Portfolio files, an explanation of the
agent-generated storage growth, and explicit preservation of future lesson
instructions. This was a cleanup only: no lesson rewrite, scientific rerun,
completion promotion, commit, push or deployment.

### Result

Removed **29.86 GiB (32,059,360,140 logical bytes)** across
**390,554 files**, with **zero deletion failures**. The measured outer Portfolio
workspace decreased from **82.59 GiB to 52.74 GiB**
before the small final report/helper cleanup. Windows labels these binary units
as GB. This is logical file size; NTFS allocation and drive-wide free-space changes
can differ. Inaccessible dependency paths were preserved, and links were not followed.

| Removed material | Amount | Why it was disposable |
| --- | ---: | --- |
| 152 superseded compiled previews | 28.56 GiB | Later completed previews, canonical content, frozen authoring sources and review records remain. Four old build directories contain only five deliberately preserved Markdown notes. |
| Three superseded Monte Carlo screenshot campaigns (14,056 PNGs) | 1.16 GiB | Complete accepted revision-3 captures, personally reviewed final images and final review records replace these revision-2 campaigns. |
| npm package download cache | 137.9 MiB | Re-downloadable cache; installed `_npx` tools and scientific environments remain. |

The [exact removal and preservation record](evidence/storage-cleanup-2026-10-09.json)
lists each retired directory, reason, retained successor and original build identity.
Historical receipts are not rewritten: their old compiled-output or predecessor-image
paths may now be explicitly retired. Consult this retirement record before attempting
to reopen an old preview; rebuilding from retained source is separate work.

### What made the project grow

The website content did **not** account for the 82.6 GiB footprint. Before cleanup,
`src/` occupied about **69.5 MiB** and `public/` about **300.2 MiB** combined — roughly
**370 MiB**. These include actual lesson implementations and public data/code assets.
The root frontend `node_modules/` was only about **52 MiB**.

1. **Repeated whole-site preview builds:** the audit found **238 Vite builds totaling
   39.72 GiB**, before also considering gallery builds without a root `index.html`.
   Agents created separate per-topic and per-correction output directories. Many
   copied the entire public asset tree and compiled the full site even when changing
   one lesson. The learning-rate normal workspace alone retained four roughly
   343 MiB builds. These were useful during review but obsolete predecessors were
   not consistently retired after successful successors.
2. **Excessive screenshot retention:** teaching records contained **13.19 GiB of PNGs**.
   Long tables and diagrams were photographed in overlapping viewport bands at
   multiple widths and changed states, then also assembled into overview sheets.
   One Concentration campaign recorded 4,748 default plus 1,516 changed-state images;
   the accepted Monte Carlo campaign recorded 14,297 images. Earlier attempts and
   superseded full campaigns accumulated alongside final evidence. Capture count
   also exceeded the images actually personally inspected, as the original reviews
   explicitly qualify. This cleanup removed only a clearly replaced old campaign
   set; required final and unresolved-finding evidence remains.
3. **Repeated review/state snapshots:** teaching JSON records occupied about
   **5.25 GiB**. Source-bound reviews retain frozen inputs, exact predecessors and
   phase receipts. The current central lesson ledger is about 15.2 MiB, and complete
   copies were saved for some bounded phase transitions. This helps recovery but
   multiplies storage when used repeatedly instead of a smaller scoped record.
4. **Scientific authoring environments:** **11 identifiable Python environments
   occupied about 6.73 GiB**, separate from the frontend dependencies. TensorFlow's
   main DLL alone was about 0.98 GiB; other environments contain PyTorch, scientific
   libraries and compiled runtimes. These support lesson experiments and may be
   reused, so they were preserved.
5. **Research models and training checkpoints:** several research workspaces retain
   trained weights, optimizer state and resume files. For example, SFT had six
   roughly 161 MiB resume checkpoints, and the typed-decision research model was
   about 804 MiB. These are research artifacts, not browser content. They were not
   deleted without confirming their reuse/evidence dependencies.

These cause categories overlap (for example, a compiled build can contain copied
PNG/JSON assets), so they must not be added together. The original top-level split
was **53.78 GiB scratch**, **23.62 GiB docs**, plus standalone builds, Git and the
small application sources/assets. Parallel topic work multiplied the number of
independent build/capture directories; insufficient completion cleanup allowed
them to accumulate. The excess was an artifact-retention problem, not a requirement
for the website itself.

### What was preserved and checked

- **15,194 protected original files passed SHA-256 comparisons unchanged** before
  this additive report: application source, public assets, scripts, skills, authoring
  Markdown and selected central ledgers/configuration.
- **1,211 deleted build-generated Markdown copies have byte-identical retained
  originals**, with exact mappings in the receipt. Five notes that differed from
  available copies were kept at their original paths.
- Future topic instructions, curriculum plans, topic notes, current handoffs,
  pending manuscripts/specifications and accepted-but-unimplemented packets remain.
- Queueing, Causal Inference, Numerical Methods, Nonconvex and Constrained work
  remains resumable. Pending Classical/other streams were not pruned.
- Canonical source/data, original scientific outputs, final review receipts and
  required final screenshots remain. The later full previews and the Abstract
  Algebra normal build referenced by the open browser were retained.
- Git history and installed environments were not purged. No broad scratch wipe,
  model-training rerun, application build or historical verification replay occurred.

The remaining roughly **52.7 GiB** still includes substantial
final review evidence, source snapshots, research checkpoints and reusable tools.
It is the authoring workspace footprint, not the size of the deployed website.
Uncertain/shared artifacts were retained rather than risking future lesson work.

### Practices needed to prevent recurrence

- Use topic-scoped previews for topic corrections; reuse one current integrated
  preview rather than copying all public assets for every small change.
- Retire confirmed superseded build outputs after the successor is accepted,
  preserving source, final results and necessary recovery inputs.
- Keep useful final and failure screenshots. Avoid a second full campaign of
  unchanged table rows or reset states; reuse source-bound evidence where valid.
- Prefer scoped phase records to repeated full-ledger copies when the same recovery
  and provenance guarantees can be retained.
- Reuse compatible scientific environments, avoid unnecessary training checkpoints,
  and check disk capacity before concurrent large builds/capture runs.
- Preserve future lesson instructions regardless of whether their topic is active.

This is a completed cleanup report, not a new lesson queue or a certification of
the unfinished lessons.
