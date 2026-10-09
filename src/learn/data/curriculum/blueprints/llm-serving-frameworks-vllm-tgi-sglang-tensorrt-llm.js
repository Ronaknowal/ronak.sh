export default {
  summary: 'Trace cache lifetime, request scheduling and transport before choosing an inference engine.',
  outcomes: ['Compare incremental cache reads with full attention and model logits', 'Account for paged memory and shared prefixes', 'Trace prefill/decode scheduling and first-token boundaries', 'Choose engine settings from workload and memory constraints', 'Preserve endpoint termination and usage contracts', 'Design latency and correctness measurements without invented benchmarks'],
  prerequisites: ['Self-Attention & Multi-Head Attention', 'LLM Fine-Tuning Platforms'],
  sequence: ['Service boundaries', 'Prefill, decode and cache parity', 'Logical and physical pages', 'Continuous admission and chunked work', 'Engine and transport contracts', 'Measured workload design', 'Practice and continuation'],
  visual: {type: 'Cache block maps and exact request timeline', question: 'Which values and request work remain resident at each boundary?', interaction: 'Change positions, page size, prefix sharing, arrival, prompt length and work budget; inspect every iteration.'},
  practice: {task: 'Count shared blocks, align an appended chunk mask and design a fair engine comparison.', success: 'Explain numerical equivalence, token-work units and workload-specific deployment limits.'},
  misconceptions: ['KV caching makes attention constant-time', 'The first generated token requires a separate decode after final prefill', 'A shared textual prefix always has interchangeable cache identity', 'A simulation establishes engine throughput'],
  sources: ['https://docs.vllm.ai/en/latest/configuration/optimization/', 'https://huggingface.co/docs/transformers/cache_explanation', 'https://arxiv.org/html/2309.06180v1'],
  depth: 'core', designRecord: 'docs/teaching/core-frameworks/llm-serving-frameworks-vllm-tgi-sglang-tensorrt-llm/design.md',
  reviewFocus: 'Final-prefill first output, cache mask alignment, full-block sharing and effective serving settings; distinguish executed CPU checks from hardware deployment.'
};
