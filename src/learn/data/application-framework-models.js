export const evidenceDocuments = [{
  id: 'with',
  text: 'A with statement closes a file when its block finishes even if an exception occurs. Open text files with an explicit encoding.',
  url: 'https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files'
}, {
  id: 'close',
  text: 'Calling close releases a file resource. Reading or writing after the file is closed fails. Use a context manager to manage its lifetime.',
  url: 'https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files'
}, {
  id: 'finally',
  text: 'A finally clause runs during normal exit and exception propagation. It is useful for cleanup. Returning inside finally can override an earlier return.',
  url: 'https://docs.python.org/3/tutorial/errors.html#defining-clean-up-actions'
}, {
  id: 'dictionary',
  text: 'A dictionary maps unique keys to values. Assigning a value for an existing key replaces the old value. Membership checks whether a key exists.',
  url: 'https://docs.python.org/3/tutorial/datastructures.html#dictionaries'
}];
export const lexicalWords = text => text.toLowerCase().match(/[a-z0-9_]+/g) || [];
const corpus = evidenceDocuments.map(doc => ({
  ...doc,
  words: lexicalWords(doc.text)
}));
export function retrieveEvidence(query, k1 = 1.5, b = .75) {
  const terms = [...new Set(lexicalWords(query))].sort(),
    average = corpus.reduce((s, d) => s + d.words.length, 0) / corpus.length;
  return corpus.map(doc => {
    const contributions = terms.map(term => {
      const frequency = doc.words.filter(word => word === term).length,
        df = corpus.filter(d => d.words.includes(term)).length;
      const idf = df ? Math.log((corpus.length + 1) / (df + .5)) : 0;
      const score = frequency ? idf * frequency * (k1 + 1) / (frequency + k1 * (1 - b + b * doc.words.length / average)) : 0;
      return {
        term,
        frequency,
        df,
        idf,
        score
      };
    });
    return {
      ...doc,
      contributions,
      score: contributions.reduce((s, c) => s + c.score, 0)
    };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
export function packEvidence(query, total = 60, instructions = 10, reserve = 20, topK = 3) {
  const budget = Math.max(0, total - instructions - reserve),
    feasible = total >= instructions + reserve;
  let used = 0;
  const candidates = retrieveEvidence(query).filter(d => d.score > 0).slice(0, topK).map(d => {
    const admitted = feasible && used + d.words.length <= budget;
    if (admitted) used += d.words.length;
    return {
      ...d,
      admitted,
      reason: admitted ? 'Admitted in full' : !feasible ? 'Reservations exceed capacity' : 'Whole passage does not fit remaining budget'
    };
  });
  return {
    budget,
    feasible,
    used,
    candidates,
    unused: Math.max(0, budget - used)
  };
}
