export const llmScope = [
  ['dynamic-tokenization-adat-boundlessbpe-litetoken', 'dynamic-tokenization', 'manuscript.jsx', 'DynamicTokenizationFlow', 'dynamic-tokenization', 'learn/examples/dynamic-tokenization', '[data-dt-figure]', 15],
  ['causal-language-modeling-next-token-prediction', 'causal-language-modeling', 'causal-language-modeling.jsx', 'CausalLanguageModelingFlow', 'causal-language-modeling', 'learn-code/causal-language-modeling', '[data-clm-figure]', 14],
  ['masked-language-modeling-bert-style', 'masked-language-modeling', 'manuscript.jsx', 'MaskedLanguageFlow', 'masked-language', 'learn-code/masked-language-modeling', '[data-mlm-figure]', 15],
  ['data-curation-deduplication-minhash-bloom-filters', 'data-curation-deduplication', 'data-curation-deduplication.jsx', 'DataCurationFlow', 'data-curation', 'learn-code/data-curation-deduplication', '[data-curation-figure]', 14],
  ['scaling-laws-kaplan-chinchilla-beyond', 'scaling-laws', 'scaling-laws.jsx', 'ScalingLawsFlow', 'scaling-laws', 'learn-code/scaling-laws', '[data-scaling-figure]', 14],
].map(([id, published, draft, component, model, assets, figures, count]) => ({
  id, folder: `docs/teaching/llm-architecture-training/${id}`,
  manuscript: `docs/teaching/llm-architecture-training/${id}/${draft}`,
  published: `src/learn/data/topics/${published}.jsx`,
  original: `docs/teaching/llm-architecture-training/${id}/original/${published}.jsx`,
  component: `src/learn/components/lesson-labs/${component}.jsx`,
  css: `src/learn/components/lesson-labs/${model}-flow.css`,
  model: `src/learn/data/${model}-models.js`, assets, figures, count,
}));

export const llmIntegration = 'docs/teaching/llm-architecture-training/integration';
export const llmBuild = 'dist-llm-architecture-training';
