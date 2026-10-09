export default {
  summary: 'Preserve sample meaning through splitting, transformation, sampling, collation, streaming and process workers.',
  outcomes: ['Trace row identity and targets through a complete data pipeline', 'Separate map-style access, sampler and collator responsibilities', 'Fit preprocessing only on allowed training rows', 'Implement batching, padding and bounded-memory shuffle', 'Partition stream records across rank/worker owners', 'Compare native PyTorch and Datasets routes and diagnose throughput/replay limits'],
  prerequisites: ['Iterators, Iterables & Generators', 'Neural Training Diagnostics & Reproducible Experiments'],
  sequence: ['Follow stable row identity', 'Separate access/order/collation', 'Fit training-only transforms', 'Investigate padding slots', 'Partition workers without duplicates', 'Run real-data and library bridges', 'Understand bounded shuffle and resume state', 'Measure the loader without changing data meaning'],
  visual: { type: 'Row lineage, padding tiles and worker ownership lanes', question: 'Which records and real positions does the optimizer actually receive?', interaction: 'Edit sequence lengths and grouping, source count and worker topology; compare padding and duplicate counts immediately.' },
  practice: { task: 'Partition changed row sets, compare collation to a library, diagnose leakage and verify membership with changed workers/batches.', success: 'Every expected ID appears under the declared policy; masks and counts agree; training-only state and reproducibility limits are explicit.' },
  misconceptions: ['Correct tensor shapes imply aligned records', 'More iterator workers automatically partition data', 'Padding values alone mask a loss', 'A small shuffle buffer makes a uniform permutation', 'A seed alone restores a prefetched stream'],
  sources: ['https://docs.pytorch.org/docs/stable/data.html', 'https://huggingface.co/docs/datasets/stream', 'https://huggingface.co/docs/datasets/process', 'https://archive.ics.uci.edu/dataset/53/iris'],
  depth: 'core',
  designRecord: 'docs/teaching/core-frameworks/data-processing-loading/README.md',
  reviewFocus: 'Identity conservation, exact CSV schema, train-only normalization, process-worker sharding and tails, mask semantics and truthful performance/replay boundaries.',
};
