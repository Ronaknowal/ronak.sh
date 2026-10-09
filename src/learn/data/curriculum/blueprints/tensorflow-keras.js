export default {
  summary: 'Own the right layer of a TensorFlow/Keras training workflow and verify its derivatives, metrics and saved state.',
  outcomes: ['Distinguish tensors, tracked variables, tape and optimizer', 'Match a manual matrix gradient with tape and fit', 'Implement a custom tracked layer and custom train_step', 'Preserve example-weighted metrics and pipeline boundaries', 'Verify a model archive and its next update'],
  prerequisites: ['Backpropagation & Automatic Differentiation', 'Mini-Batches, Training Loops & Gradient Accumulation'],
  sequence: ['Backend and training ownership', 'Variables, shapes and recorded dependencies', 'Live connected/detached tape branches', 'Custom layer and complete scratch/tape/fit comparison', 'Data pipelines and live metric aggregation', 'Train/eval/optimizer state and custom fit', 'Saving, changed practice and tracking'],
  visual: { type: 'Derivative branch flow and per-example loss accounting', question: 'Why can the forward number stay the same while the derivative changes, and why can two averages disagree?', interaction: 'Edit the weight and branch connectivity; edit both batch counts and means to expose immediate derivative and aggregation effects.' },
  practice: { task: 'Diagnose a detached branch, repair unequal-batch metrics, build a two-feature model and test a momentum restart.', success: 'Reproduce the changed hand calculations and match complete state between manual and framework routes.' },
  misconceptions: ['Same forward numbers imply same gradients', 'training and trainable mean the same thing', 'An average of batch averages always equals the example mean', 'Saving weights alone proves a training restart'],
  sources: ['https://keras.io/guides/writing_a_custom_training_loop_in_tensorflow/', 'https://keras.io/guides/custom_train_step_in_tensorflow/', 'https://www.tensorflow.org/guide/autodiff', 'https://keras.io/guides/serialization_and_saving/'],
  reviewFocus: 'Exact objective/reduction/state parity, Keras3 APIs, custom code explanation, no misleading held-out label and meaningful keyboard-accessible diagrams.',
  depth: 'core', designRecord: 'docs/teaching/core-frameworks/tensorflow-keras/design.md',
};
