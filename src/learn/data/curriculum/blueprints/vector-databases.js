export default {
  summary: 'Build a filtered retrieval contract, expose approximate candidate failures and operate versioned vector records.',
  outcomes: ['Choose and verify distance conventions', 'Implement bounded filtered exact top-k', 'Explain IVF and HNSW candidate tradeoffs', 'Compare real Faiss IVF recall with an exact oracle', 'Create, filter, query and delete Qdrant points', 'Separate task relevance, ANN fidelity and operational consistency'],
  prerequisites: ['K-Nearest Neighbors (KNN)', 'Data Processing & Loading'],
  sequence: ['Representations and records', 'Metric and eligibility experiment', 'Coarse candidates and index families', 'Recall versus relevance', 'Scratch/Qdrant/Faiss program', 'Hybrid rank fusion and versioned operation', 'Transfer practice'],
  visual: { type: 'Coordinate maps with ranked records and coarse-list lanes', question: 'Which record disappeared before ranking, and why?', interaction: 'Change query, geometry, access filter, k and probed lists; inspect winners, candidates and exact recall.' },
  practice: { task: 'Extend the real-data collection with source-version eligibility and validate against the exact oracle.', success: 'Scores, tie policy, zero/empty cases, deleted IDs and filtered candidates are explicit.' },
  misconceptions: ['Same vector dimension means the same representation', 'Post-filtering top-k equals filtered top-k', 'High ANN recall establishes useful relevance', 'A local exact query benchmarks a server HNSW index'],
  sources: ['https://qdrant.tech/documentation/search/search/', 'https://qdrant.tech/documentation/search/filtering/', 'https://faiss.ai/cpp_api/struct/structfaiss_1_1IndexIVFFlat.html'],
  depth: 'core', reviewFocus: 'Metric direction, normalized cosine, stable ties, eligibility before top-k and honest native experiment boundaries.',
};
