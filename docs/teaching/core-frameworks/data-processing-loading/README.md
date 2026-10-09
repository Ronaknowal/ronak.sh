# Data Processing & Loading — authoring and review

**Delivery complete — 28 September 2026.** Content and implementation are complete for this revision. Native checks, independent review and the final desktop/narrow/control/code-access verification are recorded below and in [the integration receipt](../integration-checks.json). Current status lives in the central ledger. No next action remains for this authorized increment; user acceptance is separate. Earlier checkpoint wording below describes the author/review sequence, not a pending queue.

Full mode, revision 1, 28 September 2026. Author: frameworks_training_data. The original entry had no implemented source, individual brief or destination note. Retain title: the lesson teaches data semantics and deliberate library control, not a list of dataframe packages.

## Content checkpoint

Complete manuscript: `src/learn/data/topics/data-processing-loading.jsx`. Programs/data: `public/learn-code/data-processing-loading/{data_pipeline.py,dataset_transform.py,iris.csv,data-provenance.md}`. Iris is reused byte-identically from the earlier mini-batches data owner; no classifier-quality claim. Intro prerequisite sources inspected and linked. Content was completed before runtime components and native verification; parent owns phase ledger/publication.

| Hurdle | Location / explanation | Implementation / assessment |
| --- | --- | --- |
| Shape cannot certify identity | §1 row lineage and Iris provenance | Stable IDs retained through every operation |
| Access/order/collation are separate | §2 index groups and final tail | Custom batching versus identical DataLoader sampler |
| Learned versus pure/random transform | §3 fixed split and train-only scaling | Train mean and leakage counterexample |
| Padding is work with semantics | §4 exact lengths and masks | Primitive collator versus pad_sequence; padding investigation |
| Workers may replicate source | §5 modulo ownership and rank/worker product | IterableDataset exact membership, 0 and 2 process workers |
| Streaming shuffle is bounded mixing | §7 replace/emit/drain algorithm | Buffer1 null, fixed-seed permutation, O(B) memory |
| Throughput versus replay state | §8 queues, persistent workers, measured boundaries | Engineering diagnosis; no fabricated performance result |

## Visual/lab contracts

- **Row lineage (§1):** always-visible reflowing pipeline with one stable ID through split → fitted transform → sampled ID → collated features/target/ID. Distinguish value change from identity preservation, no timing encoding.
- **Padding investigation (§4):** four editable sequence lengths in 1–12, initial [2,9,3,8]. Select adjacent or length-grouped pairs; show all four rows as token/pad tiles grouped by batch, labels ID/true length/batch width, exact valid/allocated/padded counts and adjacent baseline. Actual cell widths equal so padding is visible, locally scroll only if needed. All equal lengths null; initial fixture 34 versus24 allocated. No prediction gating. Reset restores lengths and ordering.
- **Ownership investigation (§5):** edit row count 1–16, ranks1–3/workers1–3 and toggle deliberate replication bug. Show separate wrapping owner lanes and actual row-ID chips. Immediate total yielded/unique/duplicates, highlight repeated IDs with text rather than hue only. Correct modulo ownership always union 0..N−1, pairwise disjoint; no-empty-lane misrepresentation. World1 workers1 null; default13 rows/2×2 owners exposes tails and replica bug. Counts analytic, not worker-performance simulation.

## Research

Official PyTorch data API/tutorial and multiprocessing/IterableDataset behavior, HF Datasets streaming/process docs/course, UCI Iris and scikit-learn corrected-copy documentation consulted 28 September2026. The plan covers identity/split, access styles, ordering/tails, collation/padding, multiprocessing/sharding, bounded shuffle, state/replay, cache/schema and measured bottlenecks. CUDA transfer optimization is scoped conceptual guidance; CPU examples do not certify GPU throughput. Storage formats, distributed collectives and full ingestion services have other teaching owners.

## Continuation

The content checkpoint, both runtime investigations, native programs and independent source review are complete. Parent owns final browser/build evidence binding and ledger closure.

### Author verification — 28 September 2026

- `node scripts/verify-data-processing.mjs`: 443 assertions passed, covering complete supported row/rank/worker topology, replication counts, padding boundaries and byte-identical Iris reuse.
- `data_pipeline.py --workers 0` and `--workers 2` both passed in Windows/Python3.12.14/torch2.14.0+cpu. Both produced 120train/30validation; seven17+one1 ordered batches; first IDs [19,114,1,74,134,66,67,61,146,138,148,53,116,42,36,126,83]; training means within7.6e−16 ofzero; 13 unique streamed IDs; padding matches pad_sequence. Bounded shuffle deterministic with membership preserved.
- `dataset_transform.py` with Datasets5.0.1 produced 120train/30validation, first rowID1, rectangle proxy17.849999999999998 cm². The canonical CSV schema was inspected before execution and code corrected to its actual feature/target columns. Source-bound evidence in `author-evidence.json`.
- Author learning review: stable-ID running example returns in every stage; split/transform/sampler/collator get separate causal explanations; padding and ownership use real cells/IDs rather than preset-only traces; streaming variant names its randomness/memory boundary; code remains visible; practice tests changed inputs, leakage and invariants. Intro and closing use shared structure. Browser geometry, keyboard and independent review remain parent integration responsibilities, not claimed by the author.
- No public caches were produced; Datasets cache is in the isolated ignored runtime. Iris copy is a required downloadable dataset with retained attribution, not cleanup debris.

Independent source review is complete in `independent-review.md`. Next action: parent final browser/build evidence binding and ledger closure.

### Rendered reading pass

Author inspected both labs' final desktop, 320px and changed-state screenshots supplied by the parent. The padding view keeps original IDs, visible real/pad cells and exact counts together: the default22/34/12 result and changed equal-length8/8/0 result agree with the controls. The ownership lanes show correct modulo IDs, and the changed two-record/four-owner state explicitly leaves two lanes empty instead of inventing records. Token chips and ownership lanes wrap legibly; neutral/amber controls and outputs match the theme. No concrete visual correction was needed. These are screenshot observations, separate from the parent's executed controls/reset/keyboard/code-copy/download checks. No native rerun was needed.
