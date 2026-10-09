export default {
  summary: 'Model imperfect annotators, distinguish aggregation from representative audit, and preserve independent evidence in assisted labeling.',
  outcomes: ['Calculate worker-conditioned posterior odds', 'Implement sparse Dawid–Skene EM and compare Crowd-Kit', 'Diagnose weak overlap and conditional dependence', 'Weight a stratified audit without disguising missing evidence', 'Operate traceable human/model/rule-assisted releases'],
  prerequisites: ['Data Annotation & Labeling', 'Gaussian Mixture Models (GMM) & EM Algorithm', 'Sampling, Measurement & Experimental Design'],
  sequence: ['Aggregation, review and quality questions', 'Sensitivity, specificity and Bayes', 'Sparse EM updates', 'Identifiability and dependence', 'Representative audit experiment', 'Real public judgments and native parity', 'Assisted workflow and transfer practice'],
  visual: { type: 'Worker error matrices, evidence masses and stratified audit cells', question: 'What does each additional judgment or audit observation actually establish?', interaction: 'Edit rater errors/votes/prior, duplicate dependent evidence, and alter population/sample composition.' },
  practice: { task: 'Compare aggregators on documented public judgments and defend an independent audit design.', success: 'Library parity, overlap, reference separation, sampling assumptions and failure cases are explicit.' },
  misconceptions: ['Confident inferred targets are verified truth', 'Copied judgments are independent evidence', 'Targeted review gives a population error rate', 'A more complicated aggregator must beat majority'],
  sources: ['https://doi.org/10.2307/2346806', 'https://crowd-kit.readthedocs.io/en/latest/classification/', 'https://arxiv.org/abs/2109.08584'],
  depth: 'core', reviewFocus: 'Observed/latent confusion orientation, log-space EM, sparse-worker limits and stratified denominators.',
};
