export const BPE_END = "</w>";
export const CLASSIC_BPE_CORPUS = "low low low low low lower lower newest newest newest newest newest newest widest widest widest";

// Match Python string ordering, including supplementary Unicode code points.
export function compareCodePoints(left, right) {
  const a = Array.from(left, char => char.codePointAt(0));
  const b = Array.from(right, char => char.codePointAt(0));
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return a.length - b.length;
}

function comparePair(a, b) {
  return compareCodePoints(a[0], b[0]) || compareCodePoints(a[1], b[1]);
}

export function corpusCounts(text) {
  if (Array.from(text).length > 600) throw new Error("Use at most 600 characters.");
  if (text.includes(BPE_END)) throw new Error("The end marker is reserved; enter ordinary words.");
  const words = text.trim() ? text.trim().split(/\s+/u) : [];
  const counts = Object.create(null);
  for (const word of words) {
    if (Array.from(word).length > 32) throw new Error("Use words of at most 32 characters.");
    counts[word] = (counts[word] || 0) + 1;
  }
  if (Object.keys(counts).length > 24) throw new Error("Use at most 24 distinct words.");
  return counts;
}

export function pairCounts(words) {
  const counts = new Map();
  for (const { tokens, count } of words) {
    for (let i = 0; i + 1 < tokens.length; i += 1) {
      const pair = [tokens[i], tokens[i + 1]];
      const key = JSON.stringify(pair);
      if (!counts.has(key)) counts.set(key, { pair, count: 0 });
      counts.get(key).count += count;
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || comparePair(a.pair, b.pair));
}

function replacePair(tokens, pair) {
  const changed = [];
  for (let i = 0; i < tokens.length; i += 1) {
    if (i + 1 < tokens.length && tokens[i] === pair[0] && tokens[i + 1] === pair[1]) {
      changed.push(pair[0] + pair[1]);
      i += 1;
    } else changed.push(tokens[i]);
  }
  return changed;
}

export function trainBpe(wordCounts, numMerges) {
  if (!Number.isInteger(numMerges) || numMerges < 0 || numMerges > 64) {
    throw new Error("Merge count must be a whole number from 0 to 64.");
  }
  const entries = Object.entries(wordCounts).filter(([, count]) => count !== 0);
  if (entries.some(([word, count]) => !word || word.includes(BPE_END) || !Number.isFinite(count) || count <= 0)) {
    throw new Error("Words need positive finite weights and no reserved marker.");
  }
  let words = entries.sort(([a], [b]) => compareCodePoints(a, b))
    .map(([word, count]) => ({ word, count, tokens: [...word, BPE_END] }));
  const alphabet = [...new Set(words.flatMap(row => row.tokens))].sort(compareCodePoints);
  const merges = [];
  const states = [];
  function snapshot(merge = null, selectedCount = null) {
    states.push({ words, pairs: pairCounts(words), merge, selectedCount,
      totalSymbols: words.reduce((sum, row) => sum + row.tokens.length * row.count, 0) });
  }
  snapshot();
  for (let step = 0; step < numMerges; step += 1) {
    const best = states.at(-1).pairs[0];
    if (!best) break;
    words = words.map(row => ({ ...row, tokens: replacePair(row.tokens, best.pair) }));
    merges.push(best.pair);
    snapshot(best.pair, best.count);
  }
  return { alphabet, merges, states };
}

export function encodeBpe(word, merges) {
  let tokens = [...word, BPE_END];
  const ranks = new Map(merges.map((pair, index) => [JSON.stringify(pair), index]));
  while (true) {
    let position = -1;
    let bestRank = Infinity;
    for (let i = 0; i + 1 < tokens.length; i += 1) {
      const rank = ranks.get(JSON.stringify([tokens[i], tokens[i + 1]])) ?? Infinity;
      if (rank < bestRank) {
        bestRank = rank;
        position = i;
      }
    }
    if (position < 0) return tokens;
    tokens = [...tokens.slice(0, position), tokens[position] + tokens[position + 1], ...tokens.slice(position + 2)];
  }
}

export function wordPieceTrace(word, vocabulary) {
  const chars = Array.from(word);
  const known = new Set(vocabulary);
  const steps = [];
  const tokens = [];
  let start = 0;
  while (start < chars.length) {
    const matches = [];
    for (let end = start + 1; end <= chars.length; end += 1) {
      const candidate = (start ? "##" : "") + chars.slice(start, end).join("");
      if (known.has(candidate)) matches.push({ end, token: candidate });
    }
    const match = matches.at(-1);
    steps.push({ start, matches, selected: match?.token || null,
      remaining: chars.slice(start).join("") });
    if (!match) return { tokens: ["[UNK]"], steps, failed: true };
    tokens.push(match.token);
    start = match.end;
  }
  return { tokens, steps, failed: false };
}

export function validWordPiecePath(word, vocabulary) {
  const chars = Array.from(word);
  const known = new Set(vocabulary);
  const paths = Array(chars.length + 1).fill(null);
  paths[0] = [];
  for (let start = 0; start < chars.length; start += 1) {
    if (paths[start] === null) continue;
    for (let end = start + 1; end <= chars.length; end += 1) {
      const token = (start ? "##" : "") + chars.slice(start, end).join("");
      if (known.has(token) && paths[end] === null) paths[end] = [...paths[start], token];
    }
  }
  return paths.at(-1);
}

export function unigramPaths(wholeProbability, includeWhole = true) {
  if (!Number.isFinite(wholeProbability) || wholeProbability <= 0 || wholeProbability >= 1) {
    throw new Error("Whole-piece probability must be strictly between zero and one.");
  }
  const single = includeWhole ? (1 - wholeProbability) / 2 : 0.5;
  const whole = includeWhole ? wholeProbability : 0;
  const split = single * single;
  const mass = whole + split;
  const wholePosterior = whole / mass;
  const splitPosterior = split / mass;
  const totalExpected = wholePosterior + 2 * splitPosterior;
  return { single, whole, split, mass, wholePosterior, splitPosterior,
    best: whole >= split && includeWhole ? ["ab"] : ["a", "b"],
    updatedWhole: wholePosterior / totalExpected,
    updatedSingle: splitPosterior / totalExpected };
}
