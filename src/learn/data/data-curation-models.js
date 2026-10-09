export const CURATION_COLORS = ['#e2b55a', '#60a5fa', '#c084fc', '#f472b6'];
export const comparisonKey = (text, fold = false) => {
  const key = text.normalize('NFC').trim().replace(/\s+/gu, ' ');
  // The browser demonstrates English case folding; Python handles Unicode casefold.
  return fold ? key.toLowerCase() : key;
};
export function shingles(text, width = 2) {
  if (!Number.isInteger(width) || width < 1) throw new Error('Positive whole shingle width required');
  const words = comparisonKey(text, true).match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [];
  return { words, windows: Array.from({ length: Math.max(0, words.length - width + 1) }, (_, i) => words.slice(i, i + width).join(' ')), set: new Set(Array.from({ length: Math.max(0, words.length - width + 1) }, (_, i) => words.slice(i, i + width).join(' '))) };
}
export function overlap(a, b) {
  const intersection = [...a].filter(x => b.has(x));
  const union = [...new Set([...a, ...b])];
  return { intersection, union, jaccard: union.length ? intersection.length / union.length : null,
    containmentA: a.size ? intersection.length / a.size : null, containmentB: b.size ? intersection.length / b.size : null };
}
export function permutations(items) {
  if (!items.length) return [[]];
  return items.flatMap((value, i) => permutations(items.filter((_, j) => i !== j)).map(rest => [value, ...rest]));
}
export const ORDERS = permutations(['a', 'b', 'c', 'd']);
export const SET_A = new Set(['a', 'b', 'c']);
export const SET_B = new Set(['b', 'c', 'd']);
export function minHashTrace(order, a = SET_A, b = SET_B) {
  const firstA = order.find(x => a.has(x)) ?? null;
  const firstB = order.find(x => b.has(x)) ?? null;
  return { firstA, firstB, match: firstA !== null && firstA === firstB };
}
export const signatureSE = (similarity, count) => Math.sqrt(similarity * (1 - similarity) / count);
export const candidateProbability = (s, bands, rows) => 1 - (1 - s ** rows) ** bands;
export const halfCrossing = (bands, rows) => (1 - 2 ** (-1 / bands)) ** (1 / rows);
export const BAND_A = [1, 3, 5, 2, 8, 6, 9, 4, 7, 11, 13, 12];
export const BAND_B = [1, 3, 5, 2, 8, 0, 9, 0, 7, 0, 13, 0];
export function bandMatches(rows, a = BAND_A, b = BAND_B) {
  if (a.length !== b.length || a.length % rows) throw new Error('Aligned complete bands required');
  return Array.from({ length: a.length / rows }, (_, band) => {
    const first = a.slice(band * rows, (band + 1) * rows), second = b.slice(band * rows, (band + 1) * rows);
    return { band, first, second, match: first.every((x, i) => x === second[i]) };
  });
}
export function retention(threshold = .6, policy = 'component', sets = [new Set([1,2]), new Set([1,2,3]), new Set([2,3])]) {
  const edges = [];
  for (let i=0; i<sets.length; i++) for(let j=i+1;j<sets.length;j++) {
    const score = overlap(sets[i],sets[j]).jaccard;
    edges.push({i,j,score,pass:score !== null && score >= threshold});
  }
  const parent = sets.map((_,i)=>i);
  const find = i => parent[i] === i ? i : (parent[i] = find(parent[i]));
  edges.filter(e=>e.pass).forEach(({i,j})=> {parent[find(j)] = find(i);});
  let kept;
  if(policy==='component') kept = [...new Set(sets.map((_,i)=>find(i)))];
  else { kept=[]; sets.forEach((set,i)=> {if(!kept.some(j=>overlap(set,sets[j]).jaccard >= threshold)) kept.push(i);}); }
  return {edges,kept};
}
// Exact addresses computed by bloom_filter.py: BLAKE2b, seed17, m16, k3.
export const BLOOM_ADDRESSES = { oak:[12,1,10], elm:[0,4,1], ash:[5,13,9], 'query-49':[0,5,13], 'query-0':[13,5,3] };
export function bloomTrace(inserted, query, clearOak = false) {
  const bits = Array(16).fill(false);
  for (const key of inserted) for (const index of BLOOM_ADDRESSES[key]) bits[index] = true;
  if(clearOak) for (const index of BLOOM_ADDRESSES.oak) bits[index] = false;
  const positive = BLOOM_ADDRESSES[query].every(i=>bits[i]);
  return {bits,positive,actuallyPresent:inserted.includes(query),falseNegatives:inserted.filter(k=>!BLOOM_ADDRESSES[k].every(i=>bits[i]))};
}
export const bloomRate = (bits, hashes, count) => (-Math.expm1(-hashes * count / bits)) ** hashes;
export function bloomBudget(capacity, target = .01, population = capacity) {
  const bits = Math.ceil(-capacity * Math.log(target) / Math.log(2) ** 2);
  const ideal = bits / capacity * Math.log(2);
  const choices = [...new Set([Math.max(1,Math.floor(ideal)),Math.max(1,Math.ceil(ideal))])];
  const hashes = choices.sort((a,b)=>bloomRate(bits,a,capacity)-bloomRate(bits,b,capacity)||a-b)[0];
  return {bits,hashes,bytes:Math.ceil(bits/8),rate:bloomRate(bits,hashes,population),occupancy:-Math.expm1(-hashes*population/bits)};
}
export function semanticTrace(angleC = 40, threshold = .9) {
  const angles = [0,20,angleC,110];
  const vectors = angles.map(a=>[Math.cos(a*Math.PI/180),Math.sin(a*Math.PI/180)]);
  const cosine = vectors.map(a=>vectors.map(b=>a[0]*b[0]+a[1]*b[1]));
  const kept=[]; const matches=[];
  vectors.forEach((_,i)=>{ const representative = kept.find(j=>cosine[i][j]>=threshold); if(representative===undefined) kept.push(i); else matches.push({i,representative}); });
  return {angles,vectors,cosine,kept,matches};
}
