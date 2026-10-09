export default {
  summary: 'Preserve a defined training experiment while changing memory use, arithmetic and execution strategy.',
  outcomes: ['Identify data, compute, communication and state bottlenecks', 'Implement correctly weighted accumulation and compare Accelerate', 'Distinguish physical/effective batches and batch-dependent computation', 'Calculate explicit state/activation budgets and explain checkpointing', 'Choose precision, compilation and sharding from evidence', 'Verify forward values, gradients, updates and restart artifacts'],
  prerequisites: ['Mini-Batches, Training Loops & Gradient Accumulation', 'Neural Training Diagnostics & Reproducible Experiments'],
  sequence: ['Identify resource lifetimes', 'Trace equal and unequal microbatches', 'Run native and Accelerate routes', 'Separate distributed objective normalization', 'Explore memory partition/recomputation', 'Understand precision and compilation boundaries', 'Design a controlled measured comparison'],
  visual: { type: 'Execution lifetimes, row-weight grouping and shared-scale memory accounting', question: 'Which part of the computation changes, and which invariant must survive?', interaction: 'Change microbatch grouping, initial weight, state partition, workers and activation estimate; inspect exact outputs immediately.' },
  practice: { task: 'Repair unequal accumulation, select a memory intervention and extend the parity comparison to the existing Wine experiment.', success: 'Explain the loss denominator, update cadence, memory assumptions and limits of the hardware evidence.' },
  misconceptions: ['Accumulation automatically preserves every batch-dependent operation', 'Averaging arbitrary batch means is a per-item mean', 'Sharding removes all memory peaks', 'Compilation or small dtypes guarantee acceleration'],
  sources: ['https://huggingface.co/docs/accelerate/usage_guides/gradient_accumulation', 'https://docs.pytorch.org/tutorials/recipes/recipes/tuning_guide.html', 'https://docs.pytorch.org/docs/stable/checkpoint.html', 'https://www.deepspeed.ai/tutorials/zero/'],
  depth: 'core',
  designRecord: 'docs/teaching/core-frameworks/training-acceleration/README.md',
  reviewFocus: 'Actual global denominator, optimizer/scheduler boundary, no invented hardware benchmarks, memory categories, matched native gradients and immediately live controls.',
};
