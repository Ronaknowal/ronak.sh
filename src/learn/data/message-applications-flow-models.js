import { sampleTree, batchGraphs } from './message-passing-models.js';
import { stableSoftplus } from './message-aggregation-flow-models.js';
export const cyclicOccurrences = (fanouts, replacement) => sampleTree(fanouts, replacement);
const sum = values => values.reduce((s, v) => s + v, 0),
  mean = values => values.length ? sum(values) / values.length : 0;
// CPython's integer-seeded MT19937 and Random.sample/choices conventions, so the
// named seed7 scratch realization equals the accepted native example exactly.
export class IncomingRandom {
  constructor(seed = 0) {
    this.mt = Array(624);
    this.mt[0] = 19650218;
    for (let i = 1; i < 624; i++) this.mt[i] = Math.imul(this.mt[i - 1] ^ this.mt[i - 1] >>> 30, 1812433253) + i >>> 0;
    const key = [Math.abs(seed) >>> 0];
    let i = 1,
      j = 0;
    for (let k = 624; k; k--) {
      this.mt[i] = (this.mt[i] ^ Math.imul(this.mt[i - 1] ^ this.mt[i - 1] >>> 30, 1664525)) + key[j] + j >>> 0;
      i++;
      j++;
      if (i >= 624) {
        this.mt[0] = this.mt[623];
        i = 1;
      }
      if (j >= key.length) j = 0;
    }
    for (let k = 623; k; k--) {
      this.mt[i] = (this.mt[i] ^ Math.imul(this.mt[i - 1] ^ this.mt[i - 1] >>> 30, 1566083941)) - i >>> 0;
      i++;
      if (i >= 624) {
        this.mt[0] = this.mt[623];
        i = 1;
      }
    }
    this.mt[0] = 0x80000000;
    this.index = 624;
  }
  uint() {
    if (this.index >= 624) {
      for (let i = 0; i < 624; i++) {
        const y = this.mt[i] & 0x80000000 | this.mt[(i + 1) % 624] & 0x7fffffff;
        this.mt[i] = (this.mt[(i + 397) % 624] ^ y >>> 1 ^ (y & 1 ? 0x9908b0df : 0)) >>> 0;
      }
      this.index = 0;
    }
    let y = this.mt[this.index++];
    y ^= y >>> 11;
    y ^= y << 7 & 0x9d2c5680;
    y ^= y << 15 & 0xefc60000;
    y ^= y >>> 18;
    return y >>> 0;
  }
  random() {
    return ((this.uint() >>> 5) * 67108864 + (this.uint() >>> 6)) / 9007199254740992;
  }
  below(n) {
    const bits = 32 - Math.clz32(n);
    let r;
    do {
      r = this.uint() >>> 32 - bits;
    } while (r >= n);
    return r;
  }
  sample(values, count, replacement = false) {
    if (replacement) return Array.from({
      length: count
    }, () => values[Math.floor(this.random() * values.length)]);
    const k = Math.min(count, values.length),
      result = [];
    let setSize = 21;
    if (k > 5) setSize += 4 ** Math.ceil(Math.log(k * 3) / Math.log(4));
    if (values.length <= setSize) {
      const pool = [...values];
      for (let i = 0; i < k; i++) {
        const j = this.below(values.length - i);
        result.push(pool[j]);
        pool[j] = pool[values.length - i - 1];
      }
    } else {
      const used = new Set();
      for (let i = 0; i < k; i++) {
        let j;
        do {
          j = this.below(values.length);
        } while (used.has(j));
        used.add(j);
        result.push(values[j]);
      }
    }
    return result;
  }
}
export const samplingFeatures = () => [1, 3, 5, 9],
  samplingEdges = () => [[0, 1], [1, 2], [2, 1], [3, 2], [1, 0], [2, 3]];
export function incomingLists(edges, n) {
  const incoming = Array.from({
    length: n
  }, () => []);
  for (const [s, t] of edges) incoming[t].push(s);
  return incoming;
}
export function sampleIncomingBlocks(incoming, seeds, fanouts, seed = 7, replacement = false) {
  const rng = new IncomingRandom(seed),
    backwards = [];
  let targets = [...seeds];
  for (const fanout of [...fanouts].reverse()) {
    const sources = [...targets],
      position = new Map(sources.map((id, i) => [id, i])),
      edges = [],
      occurrences = [];
    targets.forEach((receiver, t) => {
      const candidates = incoming[receiver],
        chosen = fanout === -1 ? [...candidates] : candidates.length ? rng.sample(candidates, fanout, replacement) : [];
      chosen.forEach((donor, slot) => {
        if (!position.has(donor)) {
          position.set(donor, sources.length);
          sources.push(donor);
        }
        edges.push([position.get(donor), t]);
        occurrences.push({
          donor,
          receiver,
          slot,
          sourceRow: position.get(donor),
          targetRow: t
        });
      });
    });
    backwards.push({
      sources,
      targets: [...targets],
      edges,
      occurrences
    });
    targets = sources;
  }
  return backwards.reverse();
}
export function sampledSageTrace(fanouts = [2, 1], seed = 7) {
  const features = samplingFeatures(),
    edges = samplingEdges(),
    incoming = incomingLists(edges, 4),
    blocks = sampleIncomingBlocks(incoming, [1], fanouts, seed),
    stages = [];
  let rows = blocks[0].sources.map(id => [features[id]]);
  blocks.forEach((block, layer) => {
    const width = layer === 0 ? 2 : 1,
      input = rows.map(row => [...row]),
      means = block.targets.map((_, t) => Array.from({
        length: input[0].length
      }, (_, c) => mean(block.edges.filter(e => e[1] === t).map(e => input[e[0]][c])))),
      own = block.targets.map((_, t) => Array(width).fill(.5 * sum(input[t]))),
      neighbor = means.map(row => Array(width).fill(.25 * sum(row))),
      pre = own.map((row, t) => row.map((v, c) => v + neighbor[t][c])),
      output = layer + 1 < blocks.length ? pre.map(row => row.map(v => Math.max(v, 0))) : pre;
    stages.push({
      block,
      input,
      means,
      own,
      neighbor,
      pre,
      output
    });
    rows = output;
  });
  const logit = rows[0][0];
  return {
    features,
    edges,
    incoming,
    fanouts: [...fanouts],
    seed,
    blocks,
    stages,
    logit,
    loss: stableSoftplus(-logit),
    seedIds: [1],
    target: 1
  };
}
export function pairSamplingTrace(last = 9, values = [1, 3, 5, last]) {
  const pairs = [];
  for (let i = 0; i < values.length; i++) for (let j = i + 1; j < values.length; j++) {
    const m = (values[i] + values[j]) / 2;
    pairs.push({
      ids: [i, j],
      values: [values[i], values[j]],
      mean: m,
      square: m * m,
      relu: Math.max(m, 0)
    });
  }
  const full = mean(values),
    expectedMean = mean(pairs.map(p => p.mean)),
    expectedSquare = mean(pairs.map(p => p.square)),
    variance = mean(pairs.map(p => (p.mean - expectedMean) ** 2));
  return {
    values: [...values],
    pairs,
    full,
    expectedMean,
    expectedSquare,
    squareFull: full * full,
    variance,
    gap: expectedSquare - full * full
  };
}
export function independentBatchTrace(firstB = 8, correct = true, retained = false) {
  if (retained) {
    const batch = batchGraphs(firstB, correct);
    return {
      ...batch,
      ptr: [0, 2, 4],
      offset: correct ? 2 : 1,
      expected: [2, 2, (firstB + 2) / 2, (firstB + 2) / 2],
      rule: 'closed receiver mean',
      sumReadout: [sum(batch.output.slice(0, 2)), sum(batch.output.slice(2))],
      meanReadout: [mean(batch.output.slice(0, 2)), mean(batch.output.slice(2))],
      globalMean: mean(batch.output),
      retained
    };
  }
  const features = [1, 3, 5, firstB, 2],
    membership = [0, 0, 0, 1, 1],
    offset = correct ? 3 : 2,
    edges = [[0, 1], [1, 0], [1, 2], [2, 1], [offset, offset + 1], [offset + 1, offset]],
    adjacency = Array.from({
      length: 5
    }, () => Array(5).fill(0));
  edges.forEach(([s, t]) => adjacency[t][s]++);
  const incoming = incomingLists(edges, 5),
    neighbor = incoming.map(row => mean(row.map(s => features[s]))),
    output = features.map((v, n) => v + neighbor[n]);
  return {
    features,
    membership,
    ptr: [0, 3, 5],
    offset,
    edges,
    adjacency,
    incoming,
    neighbor,
    output,
    expected: [4, 6, 8, firstB + 2, firstB + 2],
    rule: 'own + open-neighbor mean',
    sumReadout: [sum(output.slice(0, 3)), sum(output.slice(3))],
    meanReadout: [mean(output.slice(0, 3)), mean(output.slice(3))],
    globalMean: mean(output),
    retained
  };
}
export function typedMessageTrace(first = 1, swapped = false) {
  const donors = [first, 3],
    relations = swapped ? [1, 0] : [0, 1],
    maps = [2, -1],
    products = donors.map((v, i) => v * maps[relations[i]]);
  return {
    donors,
    relations,
    maps,
    products,
    output: sum(products),
    originalProducts: [2 * first, -3],
    swappedProducts: [-first, 6],
    pairedEdges: [[1, 0], [2, 0]],
    readout: {
      atomStates: [1, 3],
      oneSum: 4,
      twoSum: 8,
      oneMean: 2,
      twoMean: 2
    }
  };
}
export function programTrace(a = 2) {
  const b = 3,
    history = [[a, b, 0, 0], [a, b, a + b, 0], [a, b, a + b, 2 * (a + b)]];
  return {
    a,
    b,
    history,
    output: history[2][3],
    direct: [a, b, a + b, 2 * (a + b)],
    collapsed: [a, b, a + b, a + b],
    reversed: [a, b, b, 2 * b],
    derivatives: [2, 2]
  };
}
export function trafficTrace(lag = 4, reversed = false) {
  const history = [[lag, 6], [8, 10], [12, 14]],
    source = reversed ? 2 : 0,
    own = .5 * history[1][1],
    upstream = .5 * history[source][0];
  return {
    history,
    source,
    receiver: 1,
    own,
    upstream,
    output: own + upstream,
    edges: reversed ? [[2, 1], [1, 0]] : [[0, 1], [1, 2]],
    cutoff: 't1',
    targetTime: 't2'
  };
}
export function typedLibraryTrace() {
  const maps = [[[2, 1], [-1, 3], [.5, -2]], [[0, -1], [4, 2], [-3, .25]]],
    donors = [[1, 2], [-2, 3]],
    messages = maps.map((map, i) => map.map(row => row.reduce((s, w, c) => s + w * donors[i][c], 0))),
    output = messages[0].map((v, c) => v + messages[1][c]),
    nativeMaps = maps.map(map => map[0].map((_, c) => map.map(row => row[c])));
  return {
    maps,
    donors,
    messages,
    output,
    nativeMaps
  };
}
