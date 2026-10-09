export default {
  summary: 'Transform one explicit numerical computation with gradients, mapped axes and compilation; control its state, randomness and timing.',
  outcomes: ['Match manual, transformed and per-example gradients', 'Implement a tree-shaped momentum update and compare Optax', 'Diagnose value versus signature changes under jit', 'Thread random keys and optimizer state explicitly', 'Request derivative products and measure synchronized work'],
  prerequisites: ['NumPy: Arrays, Broadcasting & Vectorization', 'Backpropagation & Automatic Differentiation'],
  sequence: ['One calibration function, several transformations', 'Arrays, shapes and explicit pytree state', 'Per-example gradient contributions and mapped axes', 'Tracing, cache signatures, masks and scan', 'Complete scratch/Optax parity', 'Random keys, derivative products, debugging and honest benchmarking', 'Changed practice and next framework'],
  visual: { type: 'Signed derivative-contribution bars and compilation-signature cache', question: 'Which input changes the numerical answer, and which change needs another compiled recipe?', interaction: 'Edit parameters and step size for an immediate update preview; change shapes, dtype, static reduction and values to inspect bounded cache reuse.' },
  practice: { task: 'Calculate a changed update, repair batching and dynamic selection, and extend explicit state for restart.', success: 'Match the hand calculation, preserve shared/mapped axes and replay the next update with its full state.' },
  misconceptions: ['A gradient changes parameters', 'vmap automatically distributes across devices', 'A seed alone identifies every random computation', 'Dispatch return time measures completed device work'],
  sources: ['https://docs.jax.dev/en/latest/notebooks/thinking_in_jax.html', 'https://docs.jax.dev/en/latest/jit-compilation.html', 'https://docs.jax.dev/en/latest/random-numbers.html', 'https://docs.jax.dev/en/latest/benchmarking.html'],
  reviewFocus: 'Manual/JAX/Optax parity, shape and state semantics, meaningful overshoot/null fixtures, no invented benchmark and readable live controls.',
  depth: 'core', designRecord: 'docs/teaching/core-frameworks/jax/design.md',
};
