import { labelOrders } from './multilabel-reading-flow-foundation-models.js';

export const powersetRows = Object.freeze(['000', '100', '011', '110']);
export function powersetVocabulary(order = 'ABC', selected = '000') {
  if (!labelOrders.includes(order) || ![...powersetRows, '101'].includes(selected)) {
    throw Error('Choose a complete A/B/C order and one of the displayed vectors.');
  }
  const project = vector => [...order].map(id => vector['ABC'.indexOf(id)]).join('');
  const vocabulary = [...new Set(powersetRows.map(project))].sort();
  const rows = powersetRows.map((original, row) => ({ row, original, stored: project(original), id: vocabulary.indexOf(project(original)) }));
  const stored = project(selected);
  return { order, selected, stored, vocabulary, rows, id: vocabulary.indexOf(stored),
    decoded: vocabulary.map(vector => [...'ABC'].map(id => vector[order.indexOf(id)]).join('')) };
}

// Table 1 in Tsoumakas et al., Random k-Labelsets for Multilabel Classification.
// A published illustrative voting table, not parameters or predictions fitted here.
export const publishedLabelsetVotes = Object.freeze([
  { name: 'ABF', columns: [0, 1, 5], bits: [1, 0, 1] },
  { name: 'BCD', columns: [1, 2, 3], bits: [1, 1, 0] },
  { name: 'CEF', columns: [2, 4, 5], bits: [0, 0, 1] },
  { name: 'BDE', columns: [1, 3, 4], bits: [0, 0, 0] },
  { name: 'ADE', columns: [0, 3, 4], bits: [1, 0, 1] },
  { name: 'ABC', columns: [0, 1, 2], bits: [1, 0, 1] },
  { name: 'ADF', columns: [0, 3, 5], bits: [0, 1, 0] },
].map(row => Object.freeze({ ...row, columns: Object.freeze(row.columns), bits: Object.freeze(row.bits) })));

export function labelsetVotes(groups, threshold = .5) {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw Error('Use a threshold from zero to one.');
  const positive = Array(6).fill(0);
  const coverage = Array(6).fill(0);
  const contributions = Array.from({ length: 6 }, () => []);
  groups.forEach((group, index) => {
    if (group.columns.length !== group.bits.length || new Set(group.columns).size !== group.columns.length ||
      group.columns.some(column => !Number.isInteger(column) || column < 0 || column > 5) || group.bits.some(bit => bit !== 0 && bit !== 1)) {
      throw Error('Use distinct named label columns and aligned binary local votes.');
    }
    if (group.included === false) return;
    group.columns.forEach((column, local) => {
      positive[column] += group.bits[local];
      coverage[column] += 1;
      contributions[column].push({ group: index, name: group.name, local, bit: group.bits[local] });
    });
  });
  const means = positive.map((count, column) => coverage[column] ? count / coverage[column] : null);
  return { positive, coverage, contributions, means,
    decisions: means.map(mean => mean === null ? null : Number(mean > threshold)) };
}

export function changedPublishedVotes(selected = 0, bits = publishedLabelsetVotes[selected]?.bits) {
  if (!Number.isInteger(selected) || selected < 0 || selected >= publishedLabelsetVotes.length || !Array.isArray(bits) || bits.length !== 3) {
    throw Error('Choose one of the seven groups and exactly three decoded bits.');
  }
  const groups = publishedLabelsetVotes.map((group, index) => ({ ...group, bits: index === selected ? [...bits] : [...group.bits] }));
  return { groups, ...labelsetVotes(groups) };
}

// This is the explicit changed-F identity witness. No fitted model is implied.
export const identityWitnessVotes = Object.freeze([
  { name: 'ABF', columns: [0, 1, 5], bits: [1, 0, 1] },
  { name: 'BCD', columns: [1, 2, 3], bits: [0, 1, 0] },
  { name: 'CEF', columns: [2, 4, 5], bits: [1, 0, 0] },
]);
export function coverageWitness(selected = 0, included = true, threshold = .5) {
  if (!Number.isInteger(selected) || selected < 0 || selected > 2 || typeof included !== 'boolean') throw Error('Choose a witness group and its inclusion state.');
  const groups = identityWitnessVotes.map((group, index) => ({ ...group, included: index !== selected || included }));
  return { groups, ...labelsetVotes(groups, threshold) };
}

export function savedLabelsetForward(member, query) {
  if (member.branch !== 'multiclass-logistic' || query.length !== 2 || query.some(value => !Number.isFinite(value))) throw Error('Use the saved multiclass state and two finite inputs.');
  const classes = member.coefficients.map((weights, id) => {
    const products = weights.map((weight, index) => weight * query[index]);
    return { id, vector: member.vocabulary[id], weights, products, bias: member.intercept[id], score: products.reduce((sum, value) => sum + value, member.intercept[id]) };
  });
  // Stable first-class argmax corresponds to the saved categorical class order.
  const winner = classes.reduce((best, candidate) => candidate.score > best.score ? candidate : best, classes[0]);
  return { classes, winner, named: member.group.map((column, local) => ({ column, bit: winner.vector[local] })) };
}
