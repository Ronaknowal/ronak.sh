export function scalarResume(interrupt = 3, omitted = 'none', momentum = .8) {
  const initial = {
    w: .5,
    v: 0,
    cursor: 0,
    rng: 7,
    clock: 0
  };
  const order = [2, 0, 3, 1];
  const step = state => {
    const row = order[state.cursor % 4];
    state.cursor += 1;
    state.rng = Math.imul(1664525, state.rng) + 1013904223 >>> 0;
    const noise = (state.rng / 2 ** 32 - .5) * .2;
    const x = row + 1 + noise,
      target = 2 * (row + 1);
    const residual = state.w * x - target,
      loss = .5 * residual ** 2,
      gradient = residual * x;
    const lr = .02 * .5 ** Math.floor(state.clock / 3);
    state.v = momentum * state.v + gradient;
    state.w -= lr * state.v;
    state.clock += 1;
    return {
      row,
      loss,
      w: state.w,
      v: state.v,
      lr,
      noise
    };
  };
  const state = {
    ...initial
  };
  for (let i = 0; i < interrupt; i += 1) step(state);
  const checkpoint = {
    ...state
  };
  const baseline = Array.from({
    length: 6
  }, () => step(state));
  const restored = {
    ...checkpoint
  };
  if (omitted !== 'none') {
    const field = {
      momentum: 'v',
      cursor: 'cursor',
      rng: 'rng',
      schedule: 'clock'
    }[omitted];
    restored[field] = initial[field];
  }
  const resumed = Array.from({
    length: 6
  }, () => step(restored));
  const firstDifference = resumed.findIndex((row, i) => Object.keys(row).some(key => Math.abs(row[key] - baseline[i][key]) > 1e-12));
  return {
    checkpoint,
    baseline,
    resumed,
    firstDifference
  };
}
export function prefetchResume(completed, prefetch, strategy) {
  const committed = completed * 2,
    issued = Math.min(12, committed + prefetch * 2);
  const ids = Array.from({
    length: 12
  }, (_, i) => i);
  const pending = ids.slice(committed, issued);
  const next = strategy === 'issued' ? issued : committed;
  return {
    committed,
    issued,
    consumed: ids.slice(0, committed),
    pending,
    unissued: ids.slice(issued),
    skipped: strategy === 'issued' ? pending : [],
    next: next === 12 ? null : next
  };
}
