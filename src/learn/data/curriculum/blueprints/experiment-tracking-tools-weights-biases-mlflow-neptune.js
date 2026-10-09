export default {
  summary: 'Create recoverable experiment records, implement a portable local tracker and map the same events to MLflow and offline W&B; handle Neptune as a retired hosted service.',
  outcomes: ['Define run/config/metric/artifact identities', 'Compare explicit update and example budgets', 'Implement idempotent event writes and reject conflicting retries', 'Capture artifacts by exact byte identity and verify export', 'Run local MLflow and W&B bridges', 'Separate tracker resume, training restart and service-independent retention'],
  prerequisites: ['Neural Training Diagnostics & Reproducible Experiments', 'TensorFlow & Keras'],
  sequence: ['Score versus recoverable run and dated Neptune status', 'Meaningful metric coordinates and provenance', 'Live budget-axis comparison', 'Retry/conflict identity and local SQLite store', 'Complete MLflow/offline W&B bridge', 'Controlled comparisons, restart boundaries and portable archives', 'Changed practice and acceleration connection'],
  visual: { type: 'Provenance flow, calculated learning histories and editable event-store state', question: 'Can a later reader identify exactly what produced a result and distinguish a retry from changed evidence?', interaction: 'Change batch sizes/rate/budget and comparison axis; deliver new, identical and conflicting metric events while inspecting the retained store.' },
  practice: { task: 'Compare budgets, test duplicate/conflicting events, restore an archive and design a multi-seed ablation record.', success: 'Preserve coordinate/byte identity, retain failures and selection rules, and distinguish local recording from remote availability.' },
  misconceptions: ['A dashboard makes runs comparable', 'A hash reconstructs missing bytes', 'Resuming a log restores the training state', 'Neptune SaaS still accepts new runs'],
  sources: ['https://mlflow.org/docs/latest/ml/tracking/tracking-api/', 'https://docs.wandb.ai/models/track', 'https://docs.wandb.ai/models/artifacts', 'https://support.neptune.ai/en/articles/13925165-service-shutdown-overview'],
  reviewFocus: 'Service currency, exact SDK output scope, portable store conflict/digest invariants, correct budget axes, no cloud side effects and learning-oriented current-state labs.',
  depth: 'core', designRecord: 'docs/teaching/core-frameworks/experiment-tracking-tools-weights-biases-mlflow-neptune/design.md',
};
