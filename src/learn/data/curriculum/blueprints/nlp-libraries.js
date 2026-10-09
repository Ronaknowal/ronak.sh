export default {
  summary: 'Preserve original text through tokenization, span labeling, rule pipelines, subword alignment and serialization.',
  outcomes: ['Distinguish code-point, token and subword coordinates', 'Implement strict BIO alignment and exact-span evaluation', 'Build and reload an offline spaCy rule pipeline', 'Map word labels to tokenizer pieces with separate attention and loss masks', 'Choose NLP tools by task and audit representation boundaries'],
  prerequisites: ['Data Annotation & Labeling', 'Hugging Face Ecosystem'],
  sequence: ['Original text and offset contract', 'Tokens versus linguistic/task annotations', 'Scratch alignment and strict failures', 'spaCy components, matching, batching and serialization', 'Exact span evaluation', 'Local WordPiece ownership and loss labels', 'Tool choice, applications and practice'],
  visual: { type: 'Character/token span inspector', question: 'Does the same source annotation still align after tokenization changes?', interaction: 'Edit source text, start/end coordinates and tokenizer policy; source slices and strict labels update immediately.' },
  practice: { task: 'Build and reload a three-place extractor with explicit test spans and unknown names.', success: 'Recover source slices exactly; distinguish boundary defects from rule coverage and loss-mask choices.' },
  misconceptions: ['Every tokenizer defines the same words', 'Blank spaCy includes trained NLP predictions', 'Token indices are source-character indices', 'Attention masking and ignored loss positions are interchangeable'],
  sources: ['https://spacy.io/usage/linguistic-features', 'https://spacy.io/api/entityruler', 'https://huggingface.co/docs/transformers/main/en/tasks/token_classification'],
  depth: 'core', reviewFocus: 'Versioned tokenizer APIs, strict boundaries, Unicode offsets, objective conventions and saved state.',
};
