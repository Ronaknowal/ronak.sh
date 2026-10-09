export function scheduleRequests(prompt = 6, arrival = 1, tokenBudget = 4, continuous = true) {
  const pending = [{
    name: 'A',
    arrival: 0,
    prompt,
    output: 3
  }, {
    name: 'B',
    arrival,
    prompt: 2,
    output: 2
  }, {
    name: 'C',
    arrival: 2,
    prompt: 1,
    output: 2
  }].sort((a, b) => a.arrival - b.arrival || a.name.localeCompare(b.name));
  let active = [],
    tick = 0;
  const events = [],
    completed = {};
  while (pending.length || active.length) {
    if (continuous || !active.length) while (pending.length && pending[0].arrival <= tick && active.length < 2) active.push({
      ...pending.shift(),
      prefilled: 0,
      generated: 0,
      first: null
    });
    let budget = tokenBudget;
    const actions = {};
    for (const state of active) if (state.prefilled === state.prompt && budget) {
      state.generated++;
      budget--;
      actions[state.name] = 'D1';
    }
    for (const state of active) if (state.prefilled < state.prompt && budget) {
      const amount = Math.min(state.prompt - state.prefilled, budget);
      state.prefilled += amount;
      budget -= amount;
      actions[state.name] = `P${amount}`;
      if (state.prefilled === state.prompt) {
        state.generated = 1;
        state.first = tick + 1;
      }
    }
    events.push({
      tick,
      actions,
      used: tokenBudget - budget
    });
    active = active.filter(state => {
      if (state.generated < state.output) return true;
      completed[state.name] = {
        first: state.first,
        finish: tick + 1,
        ttft: state.first - state.arrival
      };
      return false;
    });
    tick++;
  }
  return {
    events,
    completed
  };
}
export function cachePages(first, second, block, prefix) {
  const effectivePrefix = Math.min(first, second, prefix),
    shared = Math.floor(effectivePrefix / block);
  const counts = [first, second].map(n => Math.ceil(n / block));
  const maps = [Array.from({
    length: counts[0]
  }, (_, i) => i), Array.from({
    length: counts[1]
  }, (_, i) => i < shared ? i : counts[0] + i - shared)];
  const physical = counts[0] + counts[1] - shared,
    useful = first + second - shared * block;
  return {
    maps,
    shared,
    effectivePrefix,
    physical,
    useful,
    capacity: physical * block,
    slack: physical * block - useful
  };
}
