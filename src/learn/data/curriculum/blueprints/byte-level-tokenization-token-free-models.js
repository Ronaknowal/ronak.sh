export default {
  summary: "Follow text through Unicode, UTF-8, byte groups and a model; build lossless streaming and compare token-free designs.",
  outcomes: [
    "Distinguish graphemes, Unicode scalar values, bytes and model IDs",
    "Implement strict UTF-8 streaming with matched standard-library behavior",
    "Reuse ranked BPE over a complete byte alphabet and verify a library bridge",
    "Construct causal byte inputs, targets, padding masks and stable loss",
    "Explain downsampling, entropy patches and model-specific compute tradeoffs",
    "Choose comparison units and diagnose normalization or streaming corruption",
  ],
  prerequisites: ["Byte-Pair Encoding (BPE), WordPiece, SentencePiece, Unigram"],
  sequence: ["Visible symbols and storage units", "UTF-8 mechanism", "Normalization and byte grouping", "Streaming decode", "Byte-model batch and loss", "Token-free architecture choices", "Entropy patches and resource accounting", "Independent implementation practice"],
  visual: {
    type: "Nested scalar/byte strips, a streaming buffer and editable entropy boundaries",
    question: "What does changing the representation preserve, and where does the computation move?",
    interaction: "Edit text and normalization, move the chunk boundary, and change uncertainty/patch thresholds with immediate linked results.",
  },
  practice: { task: "Repair streamed emoji, preserve exact text, and compare byte-model costs on changed inputs.", success: "Reconstructed bytes and text agree; causal masks, denominators, boundary rules and resource units are explicit." },
  misconceptions: ["A byte is a character", "Byte BPE is token-free", "A token must decode independently", "Normalization is lossless", "No subword vocabulary means no embeddings or preprocessing", "Fewer attention pairs proves a wall-clock speedup"],
  sources: ["https://www.rfc-editor.org/rfc/rfc3629", "https://unicode.org/reports/tr29/", "https://unicode.org/reports/tr15/", "https://aclanthology.org/2022.tacl-1.17/", "https://arxiv.org/abs/2412.09871"],
  depth: "core",
  reviewFocus: "Scalar validity, lossless byte joins across arbitrary token boundaries, streaming finalization, causal byte targets and truthful architecture/cost comparisons.",
};
