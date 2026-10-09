import { labelOrders } from './multilabel-reading-flow-foundation-models.js';

export function chainAnatomy(order = 'ABC') {
  if (!labelOrders.includes(order)) throw new Error('Choose one of the six A/B/C label orders.');
  const stages = [...order].map((id, stage) => ({ id, stage, prefix: [...order].slice(0, stage), width: stage }));
  const restore = ['A', 'B', 'C'].map(id => ({ id, stage: order.indexOf(id) }));
  return { order, stages, restore };
}

// Literal displayed precision from the conserved chainApi.py stdout; no fit/reconstruction.
export const savedLibraryChain = Object.freeze({
  source: 'chainApi.stdout.txt',
  sha256: 'c2e1f8a464bd768203f94f2157fd202ef39c7b62228e3c5d0022b99100dde648',
  pathProbabilities: Object.freeze([.512477, .771639]), firstPredictedFeature: 1,
  marginalB: .569133, masses: Object.freeze([.313837, .173685, .117030, .395447]),
});

export const restrictedCorners = Object.freeze([[0, 0], [0, 1], [1, 0], [1, 1]]);
export function restrictedChainTrace(corner = 1, flip = 'none') {
  if (!Number.isInteger(corner) || corner < 0 || corner > 3 || !['none', 'OR', 'AND'].includes(flip)) {
    throw new Error('Choose a binary corner and none, OR or AND for the served-bit flip.');
  }
  const [a, b] = restrictedCorners[corner];
  const orScore = a + b - .5;
  const andScore = a + b - 1.5;
  const originalOR = Number(orScore >= 0);
  const originalAND = Number(andScore >= 0);
  const servedOR = flip === 'OR' ? 1 - originalOR : originalOR;
  const servedAND = flip === 'AND' ? 1 - originalAND : originalAND;
  const xorScore = servedOR - servedAND - .5;
  const prediction = Number(xorScore >= 0);
  const truth = Number(a !== b);
  return { corner, a, b, flip, orScore, andScore, originalOR, originalAND, servedOR, servedAND,
    xorScore, prediction, truth, matches: prediction === truth };
}
