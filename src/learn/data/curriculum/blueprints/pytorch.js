export default {
  summary: 'Inspect tensor ownership, gradients and module state; build a matched manual/PyTorch classifier and carry its computation through training, validation and reload.',
  prerequisites: ['NumPy: Arrays, Broadcasting & Vectorization', 'Backpropagation & Automatic Differentiation'],
  outcomes: ['Trace shape, stride, alias and copy behavior.', 'Separate gradient accumulation, graph lifetime and optimizer updates.', 'Compare stable vectorized manual derivatives and SGD with an ordinary framework.', 'Run a held-out Wine experiment, save preprocessing with the model and verify reload.', 'Distinguish train/eval from recording and use custom derivative checks and directional products.'],
  sequence: ['Define the array and state contracts.', 'Trace storage and a two-row update.', 'Build and inspect registered model state.', 'Compare manual and framework routes on identical state.', 'Train, validate, save and diagnose the complete computation.', 'Extend derivatives and transfer through changed practice.'],
  visual: { type: 'Storage address grids, linked residual/gradient state and dropout gates', question: 'Which state changes when a tensor, backward call or mode changes?', interaction: 'Edit ownership/value, weight/rate/reduction/accumulation and independent dropout/mode/recording controls; linked outputs remain visible without a gate.' },
  practice: { task: 'Trace aliases, distinguish overshoot from incorrect derivatives, change model width, falsify a custom derivative and specify resumable state.', success: 'Show intermediates and shapes, execute same-state comparisons and state what the checks do not establish.' },
  misconceptions: ['A transpose necessarily copies data.', 'backward replaces previous gradients.', 'eval disables autograd.', 'A detached output produces a genuine zero gradient.', 'Inference reload proves exact training resumption.'],
  sources: ['https://docs.pytorch.org/docs/2.14/notes/autograd.html', 'https://docs.pytorch.org/docs/2.14/tensor_view.html', 'https://docs.pytorch.org/tutorials/beginner/nn_tutorial.html', 'https://archive.ics.uci.edu/dataset/109/wine'],
  depth: 'core',
  reviewFocus: 'Shape conventions, storage aliases, mean reduction, graph failure states, manual/library loss-gradient-update parity, held-out selection, truthful mode/device scope and usable live controls.',
};
