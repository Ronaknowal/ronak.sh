export default {
  summary: 'Turn a human judgment into a reproducible data contract, inspect independent disagreement and release explicitly reviewed targets.',
  outcomes: ['Write an operational rubric with boundary and abstention cases', 'Compute nominal two-rater agreement and explain its marginal baseline and undefined case', 'Separate majority proposals, adjudication and validity', 'Configure a Label Studio task and validate its exported target', 'Preserve identities, groups, versions and independent evaluation'],
  prerequisites: ['Data Processing & Loading', 'Sampling, Measurement & Experimental Design'],
  sequence: ['Target and annotation unit', 'Independent judgments and release lineage', 'Matrix, observed agreement and Cohen kappa', 'Label Studio object/control schema', 'Traceable releases and scratch/library audit', 'Review strategy, applications and transfer practice'],
  visual: { type: 'Editable annotation board and paired-rater matrix', question: 'Which disagreements change a proposed label or agreement statistic?', interaction: 'Edit U/R/abstain per message/rater; inspect proposals, paired coverage, marginals and kappa live.' },
  practice: { task: 'Deliver a rubric, independent pilot and reviewed release with an unresolved case.', success: 'Every label is reconstructable; missingness, groups and rubric versions stay explicit.' },
  misconceptions: ['Consensus establishes truth', 'An abstention is a negative label', 'An exported prediction is an approved target', 'High raw agreement implies useful discrimination'],
  sources: ['https://labelstud.io/guide/task_format', 'https://scikit-learn.org/stable/modules/generated/sklearn.metrics.cohen_kappa_score.html', 'https://aclanthology.org/J08-4004/'],
  depth: 'core', reviewFocus: 'Export schema, task identity, missing-label denominator and source-bound review status.',
};
