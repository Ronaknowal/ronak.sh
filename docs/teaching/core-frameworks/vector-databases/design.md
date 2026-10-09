# Vector Databases — full delivery

Content checkpoint 28 September 2026. Actual manuscript: `src/learn/data/topics/vector-databases.jsx`; complete explained program: `public/learn-code/vector-databases/vector_retrieval.py`. Implementation of visual specifications follows this checkpoint; central integration belongs to parent. Preflight planned/not-started, no destination notes. Stable title retained.

## Ownership and continuity

KNN owns prediction, distances and KD-tree proofs. This lesson owns filtered bounded top-k, record/collection lifecycle, candidate-list approximation, an explicit RRF implementation and ordinary Qdrant/Faiss use. Data Processing supplies the already-provenanced Iris CSV; no duplicate data file. HNSW is explained as a design family, not promised as a full graph implementation. Scope distinguishes ANN recall from task relevance and local exact engine from a server benchmark.

## Complete visual contracts

1. Retrieval lineage figure: original versioned source → representation vector → eligibility + candidate search → ranked source records. Reflowing semantic figure; no unspecified image assets. Explain dimensions do not establish encoder compatibility.
2. Metric/filter live map: A(1,0)public B(4,1)restricted C(0,2)public D(2,2)restricted E(3,0)public F(1,3)public. q starts(1,1), cosine, public, k2. Controls qx/qy0..5 .1, metriccosine/dot/L2, accessall/public, k1..4. Show coordinates, scores, eligible winners, and global-topk-postfiltered comparison. Cosine default F,A; unrestricted D,F → onlyF afterfilter. Ties alphabetical. Zero cosine query is explicitly undefined. Amber query diamond, hollow forbidden points, winner connectors, labels and tabular equivalent. Reset restores values; no prediction gates.
3. IVF boundary live map: centroids(0,0),(4,0),(2,4), A(1.9,0), B(2.1,0), C(4.2,0), D(0,1), E(2,3), F(3,4). Assign nearest centroid with stableties. Query2.1,0, k2, probe1: B,C scanned, B,A exact, recall.5. Probe2 yields B,A recall1,4candidate points. Probes3 all6. qx/y0..5 sliders and probe1..3, exact/approx cards, list lanes, scanned counts. Fixed geometry constructed and clearly not a runtime benchmark. Charts must remain readable320px with HTML output outsideSVG.

## Research and execution boundary

Primary Qdrant search/filter/hybrid docs, Faiss IVF/metric docs, original HNSW paper; references annotated in lesson. Program initial reasoning run passed on retained Python3.12.14 CPU with qdrant-client1.19.1/Faiss1.15.1. 120index/30query Iris rows; filteredcosinemaxerror6.501637273004235e-8, IVF recalls.973333/1/1 for probes1/2/3, deletion119. These initial observations support manuscript numeric text; final semantic validation/evidence still required. No remote Qdrant/HNSW, cloud embedding, GPU or production benchmark claimed.

## Remaining at checkpoint

Implement figures/labs/pure engines/blueprint; semantic checks including zero/empty/filter/tie boundaries; independent review; parent runtime integration and actual desktop/narrow/control checks. Save source-bound evidence after corrections. Author review is not independent.


## Author implementation checkpoint — 28 September 2026

All specified figures/labs, pure engines and topic blueprint implemented. Native semantic comparisons passed; see `native-evidence.json`, source identities in `author-evidence.json`. Independent review is assigned to the training/data agent; parent owns actual browser/control/narrow/Copy/download/build integration. Do not interpret author readiness as those checks already completed. Parent feedback corrected provenance, added explicit scratch coarse indexing, clarified figure labels, guarded malformed audit inputs and kept resume branches independent.
