// Browser-only arithmetic over explicit scenarios. No model or solver execution.
export const categoryNames = ['Uncached input', 'Five-minute creation', 'One-hour creation', 'Cache read', 'Output'];
export const categoryColors = ['#5da9ff', '#ffc04d', '#b595ff', '#59d9ed', '#ff83ad'];
export const physicalColors = {
  weights: '#b595ff',
  K: '#5da9ff',
  V: '#59d9ed',
  workspace: '#ffc04d',
  free: '#888b94'
};
export const identityColors = ['#5da9ff', '#ffc04d', '#b595ff', '#ff83ad', '#59d9ed'];
export const rateTenths = [20, 25, 40, 1, 100];
function finite(value, name, min = 0, max = Infinity) {
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError(`${name} must be between ${min} and ${max}.`);
  return value;
}
function integer(value, name, min = 0, max = Number.MAX_SAFE_INTEGER) {
  finite(value, name, min, max);
  if (!Number.isSafeInteger(value)) throw new RangeError(`${name} must be a whole number.`);
  return value;
}
export function bill(counts) {
  if (counts.length !== 5) throw new Error('All five disjoint categories are required.');
  const parts = counts.map((count, index) => {
    integer(count, categoryNames[index]);
    return {
      name: categoryNames[index],
      count,
      rate: rateTenths[index] / 10,
      units: BigInt(count) * BigInt(rateTenths[index]),
      color: categoryColors[index]
    };
  });
  const units = parts.reduce((sum, part) => sum + part.units, 0n);
  const exact = value => `${value / 10000000n}.${(value % 10000000n).toString().padStart(7, '0')}`;
  return {
    parts: parts.map(part => ({
      ...part,
      usd: Number(part.units) / 1e7,
      exact: exact(part.units)
    })),
    usd: Number(units) / 1e7,
    exact: exact(units)
  };
}
export function rental(active = 80, devices = 2, contract = 'reserved') {
  finite(active, 'Active hours', 0, 720);
  integer(devices, 'Devices', 0, 16);
  return {
    active,
    idle: 720 - active,
    devices,
    hours: contract === 'reserved' ? 720 : active,
    charge: devices * (contract === 'reserved' ? 720 : active) * 4.29
  };
}
export function weightStorage(parameters = 7e9, bytes = 2, capacity = 80e9) {
  integer(parameters, 'Parameters');
  if (![1, 2, 4].includes(bytes)) throw new RangeError('Choose a declared element size.');
  finite(capacity, 'Capacity');
  const occupied = parameters * bytes;
  return {
    occupied,
    capacity,
    free: Math.max(0, capacity - occupied),
    overflow: Math.max(0, occupied - capacity)
  };
}
export function kvStorage({
  layers = 32,
  heads = 8,
  width = 128,
  positions = 4096,
  requests = 4,
  bytes = 2,
  lengths = null
} = {}) {
  [layers, heads, width, positions, requests, bytes].forEach((value, index) => integer(value, ['Layers', 'KV heads', 'Width', 'Positions', 'Requests', 'Bytes'][index]));
  const occupiedPositions = lengths === null ? positions * requests : lengths.reduce((sum, value) => sum + integer(value, 'Request positions'), 0);
  return {
    bytes: 2 * layers * heads * width * occupiedPositions * bytes,
    positions: occupiedPositions,
    perPosition: 2 * layers * heads * width * bytes
  };
}
export function memoryFit(requests = 4, positions = 4096, device = 24e9) {
  integer(requests, 'Requests', 0, 32);
  const perRequest = kvStorage({
    requests: 1,
    positions
  }).bytes;
  const fixed = 16e9;
  const available = device - fixed;
  return {
    device,
    weights: 14e9,
    workspace: 2e9,
    perRequest,
    available,
    occupied: fixed + requests * perRequest,
    maximum: available < 0 ? 0 : perRequest > 0 ? Math.floor(available / perRequest) : null,
    fits: available >= 0 && requests * perRequest <= available
  };
}
export const matrixX = [[1, 2, 3], [2, 0, -1]];
export const matrixW = [[1, 0, 2], [0, 1, 1], [1, -1, 0], [2, 2, 1]];
export function projection(batch = 2) {
  integer(batch, 'Rows', 0, 16);
  const x = Array.from({
    length: batch
  }, (_, i) => [...matrixX[i % 2]]);
  const y = x.map(row => matrixW.map(weight => row.reduce((sum, value, index) => sum + value * weight[index], 0)));
  const operations = 2 * batch * 3 * 4;
  const bytes = 2 * (batch * 3 + 12 + batch * 4);
  return {
    x,
    w: matrixW,
    y,
    operations,
    bytes,
    intensity: operations / bytes
  };
}
export function roofline(batch = false, arithmetic = 100, bandwidth = 1) {
  finite(arithmetic, 'Usable TFLOP/s', Number.MIN_VALUE);
  finite(bandwidth, 'TB/s', Number.MIN_VALUE);
  const operations = batch ? 3.2e12 : 400e9;
  const bytes = batch ? 22e9 : 20e9;
  const mathMs = operations / (arithmetic * 1e12) * 1000;
  const trafficMs = bytes / (bandwidth * 1e12) * 1000;
  return {
    operations,
    bytes,
    mathMs,
    trafficMs,
    boundMs: Math.max(mathMs, trafficMs),
    perItemMs: Math.max(mathMs, trafficMs) / (batch ? 8 : 1),
    intensity: operations / bytes,
    crossover: arithmetic / bandwidth
  };
}
export function hardwareCost(fraction = .25, rate = 200, devices = 2) {
  finite(fraction, 'Delivered fraction', 0, 1);
  finite(rate, 'Aggregate output rate');
  const charge = rental(80, devices).charge;
  const tokens = devices === 0 ? 0 : rate * fraction * 720 * 3600;
  return {
    charge,
    tokens,
    perMillion: tokens ? charge * 1e6 / tokens : null
  };
}
export function attribution(a = .5, b = .25, storage = 0, known = true) {
  finite(a, 'Share A', 0, 1);
  finite(b, 'Share B', 0, 1 - a);
  finite(storage, 'Independent storage expense');
  const lease = 6177.6;
  return {
    lease,
    allocations: known ? [a * lease, b * lease, (1 - a - b) * lease] : null,
    total: lease + storage
  };
}
export function workload(fraction = .5, unknownWeight = 0) {
  finite(fraction, 'Long input fraction', 0, 1);
  finite(unknownWeight, 'Unknown class fraction', 0, 1);
  const meanMs = unknownWeight > 0 ? null : (1 - fraction) * 10 + fraction * 80;
  return {
    meanMs,
    rate: meanMs === null ? null : 1000 / meanMs
  };
}
export function fleet(volume = 160000, capacity = 180000, fixed = 1200, variable = .002, alwaysOn = false) {
  integer(volume, 'Task volume', 0, 1000000);
  integer(capacity, 'Per-slot capacity', 1);
  finite(fixed, 'Fixed expense');
  finite(variable, 'Variable expense');
  const slots = Math.max(alwaysOn ? 1 : 0, Math.ceil(volume / capacity));
  const cost = slots * fixed + volume * variable;
  return {
    slots,
    supply: slots * capacity,
    cost,
    average: volume ? cost / volume : null
  };
}
export function surviving(demand = 150000, fraction = .7, replicas = 4, failed = 0) {
  finite(demand, 'Demand');
  finite(fraction, 'Usable fraction', 0, 1);
  integer(replicas, 'Replicas', 1, 8);
  integer(failed, 'Failed replica', 0, replicas - 1);
  const usable = 100000 * fraction;
  const supply = (replicas - 1) * usable;
  return {
    usable,
    supply,
    required: usable ? Math.ceil(demand / usable) + 1 : demand ? null : 1,
    feasible: supply >= demand,
    failed
  };
}
export function crossovers(capacity = 180000, fixed = 1200, variable = .002, alternative = .01, count = 3) {
  integer(capacity, 'Capacity', 1);
  finite(fixed, 'Fixed expense');
  finite(variable, 'Variable expense');
  finite(alternative, 'Alternative expense');
  integer(count, 'Regions', 1, 32);
  if (alternative <= variable) return [];
  return Array.from({
    length: count
  }, (_, index) => {
    const slots = index + 1;
    const crossing = slots * fixed / (alternative - variable);
    return {
      slots,
      crossing,
      lower: index * capacity,
      upper: slots * capacity,
      feasible: crossing > index * capacity && crossing <= slots * capacity
    };
  });
}
export function marginal(volume = 180000, paid = false) {
  const before = fleet(volume),
    after = fleet(volume + 1);
  return {
    before,
    after,
    incremental: after.cost - before.cost,
    paidNext: paid && before.supply >= volume + 1 ? .002 : null
  };
}
export function prefixCosts({
  starts = [0, 120, 240],
  identities = ['P', 'P', 'P'],
  prefix = 900,
  ttl = 300,
  delay = 0,
  cached = true
} = {}) {
  const entries = new Map();
  const rows = starts.map((start, index) => {
    const identity = identities[index];
    const writes = entries.get(identity) || [];
    const eligible = writes.filter(row => row.available <= start && start < row.expires);
    let stored = eligible.sort((a, b) => b.expires - a.expires)[0];
    const hit = cached && !!stored;
    if (cached) {
      if (hit) stored.expires = start + ttl;else {
        stored = {
          available: start + delay,
          expires: start + ttl,
          owner: index
        };
        writes.push(stored);
      }
      entries.set(identity, writes);
    }
    const counts = [100 + (cached ? 0 : prefix), cached && !hit && ttl === 300 ? prefix : 0, cached && !hit && ttl === 3600 ? prefix : 0, hit ? prefix : 0, 200];
    return {
      start,
      identity,
      hit,
      index,
      counts,
      ...bill(counts),
      available: stored?.available ?? null,
      expires: stored?.expires ?? null,
      source: stored?.owner ?? null
    };
  });
  return {
    rows,
    total: rows.reduce((sum, row) => sum + row.usd, 0),
    entries: [...entries.entries()]
  };
}
export function mixedUsage(mode = 'complete') {
  if (mode !== 'complete') return {
    valid: false,
    reason: {
      missing: 'Nonzero creation requires separate five-minute and one-hour counts.',
      inconsistent: 'The two creation subcounts must sum to their parent subtotal.',
      reversed: 'The longer-lived prefix must precede its shorter-lived extension.'
    }[mode]
  };
  return {
    valid: true,
    ...bill([2048, 148, 100, 1800, 503])
  };
}
export function retry(first = .8, conditional = .8, enabled = true) {
  finite(first, 'First success', 0, 1);
  finite(conditional, 'Retry conditional success', 0, 1);
  const failed = 1 - first;
  const recovered = enabled ? failed * conditional : 0;
  const success = first + recovered;
  const cost = .01 * (1 + (enabled ? failed : 0));
  return {
    first,
    failed,
    recovered,
    terminalFailure: 1 - success,
    success,
    cost,
    perSuccess: success ? cost / success : null
  };
}
export function routing(falsePositive = .1, miss = .2, strong = .95) {
  [falsePositive, miss, strong].forEach(value => finite(value, 'Conditional probability', 0, 1));
  const flaggedCorrect = 82 * falsePositive,
    flaggedWrong = 18 * (1 - miss);
  const flagged = flaggedCorrect + flaggedWrong;
  const retainedCorrect = 82 - flaggedCorrect,
    retainedWrong = 18 - flaggedWrong;
  const replacements = flagged * strong;
  const success = retainedCorrect + replacements,
    cost = .2 + flagged * .02;
  return {
    flaggedCorrect,
    flaggedWrong,
    flagged,
    retainedCorrect,
    retainedWrong,
    replacements,
    success,
    quality: success / 100,
    cost,
    eligible: success >= 95,
    perSuccess: success ? cost / success : null
  };
}
export function lattice(demand = 7) {
  const cells = [];
  for (let x = 0; x <= 3; x++) for (let y = 0; y <= 3; y++) {
    cells.push({
      x,
      y,
      supply: 4 * x + 2 * y,
      slots: x + y,
      cost: 7 * x + 4 * y,
      feasible: 4 * x + 2 * y >= demand && x + y <= 3
    });
  }
  const eligible = cells.filter(row => row.feasible).sort((a, b) => a.cost - b.cost || a.x - b.x || a.y - b.y);
  return {
    cells,
    optimum: eligible[0] || null
  };
}
export function classAssignment(required = .9, strongCapacity = 10, cheapCapacity = 20) {
  finite(required, 'Required hard quality', 0, 1);
  const choices = [];
  for (let easyStrong = 0; easyStrong <= 20; easyStrong++) for (let hardStrong = 0; hardStrong <= 10; hardStrong++) {
    const strong = easyStrong + hardStrong,
      cheap = 30 - strong;
    // Eligibility is a route/class contract, rather than quality averaging across routes.
    const eligible = (hardStrong === 10 || .5 >= required) && (hardStrong === 0 || .95 >= required);
    if (eligible && strong <= strongCapacity && cheap <= cheapCapacity) choices.push({
      easyStrong,
      hardStrong,
      easyCheap: 20 - easyStrong,
      hardCheap: 10 - hardStrong,
      strong,
      cheap,
      cost: strong * .02 + cheap * .002
    });
  }
  choices.sort((a, b) => a.cost - b.cost || a.easyStrong - b.easyStrong || a.hardStrong - b.hardStrong);
  return {
    optimum: choices[0] || null,
    choices
  };
}
export function sensitivity(lowDemand = 120000, highDemand = 160000, lowFixed = 1000, highFixed = 1400) {
  integer(lowDemand, 'Low demand');
  integer(highDemand, 'High demand', lowDemand);
  finite(lowFixed, 'Low fixed expense');
  finite(highFixed, 'High fixed expense', lowFixed);
  const volumes = new Set([lowDemand, highDemand]);
  for (let boundary = Math.ceil(lowDemand / 180000) * 180000; boundary <= highDemand; boundary += 180000) {
    if (boundary >= lowDemand) volumes.add(boundary);
    if (boundary + 1 <= highDemand) volumes.add(boundary + 1);
  }
  const rows = [...volumes].sort((a, b) => a - b).map(volume => ({
    volume,
    low: fleet(volume, 180000, lowFixed).cost,
    high: fleet(volume, 180000, highFixed).cost,
    alternative: volume * .01
  }));
  return {
    rows,
    robustReserved: rows.every(row => row.high < row.alternative),
    robustMetered: rows.every(row => row.low > row.alternative)
  };
}
export function aggregation(zero = false, outcomeKnown = true) {
  const rows = [{
    id: 'A',
    cost: .004,
    tokens: zero ? 0 : 20
  }, {
    id: 'B',
    cost: .030,
    tokens: zero ? 0 : 300
  }];
  const cost = rows.reduce((sum, row) => sum + row.cost, 0);
  const tokens = rows.reduce((sum, row) => sum + row.tokens, 0);
  return {
    rows,
    cost,
    tokens,
    ratio: tokens ? cost / tokens : null,
    mean: tokens ? rows.reduce((sum, row) => sum + row.cost / row.tokens, 0) / rows.length : null,
    outcomeKnown
  };
}
