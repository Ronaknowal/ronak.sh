export default {
  summary: "Build, compare and control subword tokenization from weighted merges to probabilistic paths and saved native artifacts.",
  outcomes: ["Train and encode BPE with explicit ties and boundaries", "Distinguish WordPiece greedy matching from merge ranks", "Compute Unigram path weights, exact EM and sampling", "Use Tokenizers and SentencePiece with matched artifacts", "Evaluate held-out text, unknowns and information preservation"],
  prerequisites: ["Python Basics: Types, Control Flow, Functions & Modules"],
  sequence: ["Unseen spelling and pipeline", "Weighted merges and overlap", "Ranks and efficient implementation", "WordPiece commitment", "Unigram paths and exact EM", "Native bridges and real text", "Costs, diagnosis and practice"],
  visual: {type: "Editable token strips, merge trace, greedy-path explorer and probabilistic lattice", question: "Which decision created these boundaries, and what changes when its input changes?", interaction: "Edit corpus, merge budget, query, WordPiece vocabulary and Unigram probabilities; inspect intermediate states and outputs immediately."},
  practice: {task: "Diagnose overlap and greedy failure, compute a changed EM update and compare saved tokenizer configurations on held-out text.", success: "Reproduces exact small cases, preserves pipeline conventions and distinguishes algorithm output from measured task quality."},
  misconceptions: ["Every token is a morpheme", "WordPiece is BPE with a different score at inference", "Viterbi winner counts are exact EM", "SentencePiece is one segmentation algorithm", "Token count directly measures quality or speed"],
  sources: ["https://aclanthology.org/P16-1162/", "https://aclanthology.org/P18-1007/", "https://github.com/google/sentencepiece", "https://github.com/google-research/bert/blob/master/tokenization.py", "https://huggingface.co/docs/tokenizers/api/models"],
  depth: "core",
  reviewFocus: "Weighted overlapping counts, rank ties, whole-word unknowns, exact marginal versus best paths, pipeline fidelity and source-bound native outputs.",
};
