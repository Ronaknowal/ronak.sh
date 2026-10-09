export default {
  summary: 'Connect inspectable evidence retrieval, context selection and answer contracts with scratch and native framework routes.',
  outcomes: ['Preserve source identity and permissions through chunking', 'Implement inverted-index lexical scoring and compare Haystack', 'Explain saturation, rarity and length correction', 'Pack whole passages under a declared budget', 'Compose actual LangChain Runnable stages', 'Separate retrieval, answer support and runtime evaluation'],
  prerequisites: ['LLM Serving Frameworks (vLLM, TGI, SGLang, TensorRT-LLM)', 'Data Processing & Loading'],
  sequence: ['Evidence boundaries', 'Source and chunk identity', 'Lexical scoring and postings', 'Budget admission', 'Library composition', 'Generation boundary', 'Evaluation and practice'],
  visual: {type: 'Evidence provenance pipeline, per-term score cards and bounded context allocation', question: 'Why did this passage reach the answer context?', interaction: 'Change question, scoring parameters, candidate count and reservations; inspect scores, admission and omissions.'},
  practice: {task: 'Diagnose lexical mismatch, budget loss and authorization filtering.', success: 'Trace missing evidence to the correct stage and distinguish valid citations from supported claims.'},
  misconceptions: ['RAG retrains the model', 'A similarity score is answer confidence', 'More candidates always improve context', 'A valid citation ID proves the associated claim'],
  sources: ['https://developers.llamaindex.ai/python/framework/understanding/rag/', 'https://docs.haystack.deepset.ai/docs/inmemorybm25retriever'],
  depth: 'core', designRecord: 'docs/teaching/core-frameworks/llm-application-frameworks-langchain-llamaindex-haystack/design.md',
  reviewFocus: 'Same scoring variant/analyzer, no fabricated model output, provenance/authorization boundaries, word units versus real model tokens.'
};
