export default {
  summary: "Design and evaluate a multilingual vocabulary while preserving text, model compatibility and an explicit resource budget.",
  outcomes: [
    "Distinguish coverage, fertility, parallel token ratios and model quality",
    "Implement stable mixture weighting and reproducible per-language diagnostics",
    "Compare vocabulary/sequence costs with explicit dimensions and units",
    "Train and audit SentencePiece designs on held-out real multilingual text",
    "Extend a tokenizer and tied embedding table while preserving existing row identity",
  ],
  prerequisites: [
    "Byte-Pair Encoding (BPE), WordPiece, SentencePiece, Unigram",
    "Byte-Level Tokenization & Token-Free Models",
  ],
  sequence: [
    "Coverage and useful pieces", "Metric denominators", "Corpus mixture and finite vocabulary",
    "Matrix/sequence budget", "Normalization and boundaries", "Scratch measurement pipeline",
    "Held-out SentencePiece experiment", "Pretrained vocabulary migration", "Diagnosis and transfer practice",
  ],
  visual: {
    type: "Weighted BPE corpus and embedding-budget investigations",
    question: "Which texts benefit from a fixed piece budget, and what does the larger dictionary cost?",
    interaction: "Edit corpus masses and weighting, inspect merge/piece changes, then vary dimensions and measured lengths.",
  },
  practice: {
    task: "Run a changed mixture and vocabulary experiment; diagnose an incompatible row mapping.",
    success: "Report actual repeat counts, declared metric units, held-out fallback/round trips and preserved old IDs.",
  },
  misconceptions: [
    "Whitespace fertility directly measures cross-language semantic cost",
    "A larger vocabulary fixes deleted distinctions or unseen training characters",
    "A tokenizer with no unknown IDs must have useful compression",
    "Adding rows preserves all old output probabilities",
  ],
  sources: [
    "https://aclanthology.org/2021.acl-long.243/",
    "https://arxiv.org/abs/2305.15425",
    "https://github.com/google/sentencepiece",
    "https://huggingface.co/docs/transformers/main/en/main_classes/model",
  ],
  depth: "core",
  reviewFocus: "Denominators, actual multilingual data, repeat-unit accounting, preprocessing limits and ID/embedding compatibility.",
};
