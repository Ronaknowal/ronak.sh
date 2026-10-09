# Experiment tracking — design, research and verification

**Delivery complete — 28 September 2026.** Content and implementation are complete for this revision. Native checks, independent review and the final desktop/narrow/control/code-access verification are recorded below and in [the integration receipt](../integration-checks.json). Current status lives in the central ledger. No next action remains for this authorized increment; user acceptance is separate. Earlier checkpoint wording below describes the author/review sequence, not a pending queue.

Full mode, new planned topic. Stable catalogue title and ID retained; Neptune SaaS has shut down, so its status is stated in section1 and the executable routes are MLflow/W&B plus a portable local implementation. Preflight28 September2026 found no destination note. No unrelated resolved inbox work is reopened.

## Content checkpoint and outcomes

Complete manuscript: `src/learn/data/topics/experiment-tracking-tools-weights-biases-mlflow-neptune.jsx`. Complete programs in its `public/learn-code/<id>/` directory: `portable_run_store.py`, `tracking_library_bridge.py`. Content covers state/provenance, metric coordinates, comparison budgets, retry/conflict identity, transaction/object-store boundaries, full local library integration, research selection, restart semantics and service-independent retention. Practice includes exact budget arithmetic, retry diagnosis, missing artifacts and a multi-seed ablation protocol, each with hints/reasoned feedback.

Reuse inspected diagnostics lesson for experiment design/checkpoint state and the preceding Keras lesson for training/metric ownership. The same constructed calibration fixture is used intentionally for a deterministic tracker contract, not to claim real-data predictive quality. Local new computational outcome is the high-quality bounded single-writer record store and tool mapping; gradient descent is a small explicit reuse of the preceding equation rather than an unexplained model dependency. Source/data bytes are hashed. Indexed event identity, finite values, terminal-run writes, content-addressed capture and verified export are executable. Large export streaming, team permissions, distributed write/durability and garbage collection are scoped advanced design boundaries.

| Concept hurdle | Local teaching support | Representation and evidence |
| --- | --- | --- |
| Score vs recoverable experiment | §§1–2 contrast .18/.21 with changed protocol | Input→run→metric/artifact lineage figure |
| Metric coordinates/units | §2 named record fields and before/after update distinction | Exact initial/step1 values reused |
| Updates vs examples/time | §3 deterministic mini-batch calculation | Live budget lab, common measured objective, switch x-axis |
| Retry vs new evidence | §4 identity/conflict policy before schema | Live event-store lab: insert/retry/conflict with retained rows |
| Hash vs saved bytes | §5 captured object, manifest, retrieval verification | Actual artifact corruption test; practice C |
| Tool mapping | §6 complete same-event SDK bridge | Local MLflow full history and W&B offline final summary |
| Controlled comparison | §7 group/split/budget, failures and selection | Practice D changed research protocol |
| Record resume vs computation restart | §8 state and checkpoint reconciliation | Store reopen test and named earlier diagnostics owner |
| Tool lifecycle | §9 Neptune/cloud vs retained local evidence | Primary service notice; export/restore acceptance criteria |

## Visual contracts

**TrackingLineageFigure:** three reflowing lanes showing source/data/config used by runID; run produces coordinate-bearing metrics and digest-bearing checkpoint; selection alias points to an immutable artifact. No invented quantitative scale. Accessible text makes used/produced explicit.

**TrackingBudgetLab:** two real local calculations of affine SGD on x=[−2,−1,1,2],y=[−3,−1,3,5], zero initial state. Deterministic cyclic slices of batch size1–4, including short tail batches, shared rate[0,.2], update count1–30; change individual batch sizes and the budget. Current trajectories are recomputed live, with full-fixture half-MSE evaluated at step0 and after every update. Choose update or processed-example x-axis; both runs share the current axis limits and y scale0–maxloss with baseline. Tables expose final state, processed count and loss. Same-batch null must coincide; different batches normally differ. No measured timing/generalization claims. Exact current points are inspectable, not a synthetic benchmark. Reset all. Keyboard/native numeric controls.

**TrackingRetryLab:** one fixed runID, editable metric name/train or validation, step0–5, value0–10. Current proposed event and classified insert/idempotent/conflict consequence are visible immediately. Deliver advances the modeled persistence operation, not an answer gate. Initial store contains train/loss@0=5.5. Show accepted rows and latest outcome. Duplicate keeps count/bytes; conflict preserves existing value; another step/name creates distinct row. Bounded possible keys12, bounded displayed delivery history if retained. Reset all parameters/store. Semantic table, long key wrapping, dark/amber controls.

## Research and scope findings

Read primary MLflow Tracking/Quickstart/API page bodies and W&B Experiments, Artifacts and custom-axis documentation on28 September2026. Their canonical concepts are runs/config/metrics/artifacts, backend-versus-artifact storage, explicit counters, automatic/manual logging and lifecycle. Teaching approach: first write the record needed to answer a scientific question, then map it to API calls. Avoid a product feature catalog or invented adoption rankings.

Neptune official [shutdown notice](https://support.neptune.ai/en/articles/13925165-service-shutdown-overview) and [FAQ](https://support.neptune.ai/en/articles/13925412-faq) establish hosted shutdown6March2026 12:00UTC, permanent hosted data deletion, and different self-hosted context. No old Neptune SDK demo is advertised as currently runnable. A self-hosted deployment is not automatically disabled by the hosted shutdown; its continued operation depends on licensing/environment, with discontinued official support/repositories. Learner-facing wording remains specifically SaaS/hosted.

Python sqlite3/hashlib primary docs checked for transaction/file hashing. Good alternate learning routes are the official worked tracker guides; no video was assessed substantively enough to endorse, so no metadata-only video link is added.

## Stage status

Content and runtime implemented. `node scripts/verify-experiment-tracking-models.mjs` passed the computed SGD initial/update states, short-tail counts, zero-rate null and immutable retry/conflict behavior. `scratch/framework-lesson-runtime/Scripts/python.exe -B scripts/verify-functional-frameworks.py --topic experiment-tracking-tools-weights-biases-mlflow-neptune` passed on Python3.12.14/NumPy2.3.5/MLflow3.16.1/W&B0.30.0. All21 MLflow metric points match the portable record, W&B’s offline final summary matches, and retrieved MLflow artifact bytes match the captured SHA256. Independent store probes cover immutable config, identical retries, conflicts, finite values, reopen, terminal writes, original-file overwrite and corruption detection. Full outputs/source hashes are retained in `native-evidence.json`.

The first local SDK attempt exposed W&B’s default cache directory outside the chosen output. The program now sets explicit per-output data/cache/config directories before importing W&B; the subsequent isolated execution passed. All SDK work is local. No W&B online history, hosted-service permission behavior or Neptune deployment was exercised. Public interpreter caches were removed; the native verifier runs with bytecode disabled. The official Neptune notice was available as the search-indexed primary article/FAQ body while direct article fetch returned an error; the precise service/date claim is not inferred from a secondary blog.

Author teaching review checked that record fields precede API calls, the same trajectory exposes coordinate choices, persistence controls actually change the event store, and saved bytes are distinguished from hashes. Source/dataset identity and model-vs-tracker resume stay explicit. Parent’s first browser pass passed functional checks; it found missing neutral stylesheet loading, now corrected through an explicit topic lab import. Independent review and rebuilt theme verification remain separate receipts.

Independent review completed in `independent-review.md/json` with no open source blockers, including an independent check of the official indexed Neptune notice and64 recurrence fixtures. Parent reports rebuilt browser interactions passed. I inspected both labs' desktop,320px and changed screenshots: the solid amber/dashed gray histories and explicit axis labels remain identifiable, identical batch settings coincide, the event proposal distinguishes a new coordinate from the retained event store, long names wrap and neutral controls have replaced the unintended green surface. Tables use the shared narrow scroll region; exact values remain in adjacent prose/readouts. Screenshot inspection is distinct from the parent's executed interaction receipt.

Content, runtime, author/native checks, independent source review and screenshot inspection are complete. Parent owns final browser/build/load-boundary evidence binding and ledger closure. Reuse native evidence for unchanged canonical programs; no remote W&B execution is claimed.
