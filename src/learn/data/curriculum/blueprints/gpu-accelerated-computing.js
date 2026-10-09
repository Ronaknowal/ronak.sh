export default {
  summary: 'Follow arrays across host/device boundaries, implement a grid-stride kernel, and measure the work that matters.',
  outcomes: ['Explain residency and asynchronous launch', 'Prove grid-stride coverage and implement a bounded float32 kernel', 'Compare array and custom-kernel routes', 'Separate fusion, transfer and launch costs', 'Design a correctness-first synchronized benchmark'],
  prerequisites: ['NumPy: Arrays, Broadcasting & Vectorization', 'PyTorch'],
  sequence: ['Array residency', 'Thread-to-element mapping', 'Scratch CUDA kernel and array reference', 'Traffic and fusion', 'Timing and tool choice', 'Diagnostics and practice'],
  visual: { type: 'Residency flow, thread ownership map and explicit traffic model', question: 'Which thread owns each result, and which boundary costs change?', interaction: 'Edit launch geometry and array size; vary residency, fusion, bandwidth and launch assumptions.' },
  practice: { task: 'Extend a finite float32 activation to a clamp and compare matched reference/native outputs.', success: 'Every element has one writer, tails are correct, and timing claims state execution evidence and boundary.' },
  misconceptions: ['A GPU guarantees speedup', 'Submitting a kernel means it completed', 'Residency and fusion remove the same traffic', 'A raw kernel understands arbitrary array strides'],
  sources: ['https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/', 'https://docs.cupy.dev/en/stable/user_guide/performance.html', 'https://developer.nvidia.com/blog/cuda-pro-tip-write-flexible-kernels-grid-stride-loops/'],
  depth: 'core', reviewFocus: 'Tail/index coverage, scalar ABI, honest CUDA limits, byte accounting and timing boundaries.',
};
