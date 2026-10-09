// Finite browser counterparts of the accepted capacity/metrics/evidence programs.
// These calculations are not native serving measurements.
import evidence from '../../../public/learn/examples/inference-engines/engine-evidence.json';

export { evidence };
const integer = (x, name, minimum = 0) => {
  if (!Number.isSafeInteger(x) || x < minimum)
    throw Error(`${name} must be an integer ≥ ${minimum}`);
  return x;
};
export function reservation(prompt, cap, pageSize) {
  integer(prompt, 'Prompt length', 1);
  integer(cap, 'Output cap', 1);
  integer(pageSize, 'Page size', 1);
  const rows = prompt + cap - 1,
    pages = Math.ceil(rows / pageSize);
  return { rows, pages, reservedRows: pages * pageSize, slack: pages * pageSize - rows };
}
export function memoryBudget({
  total,
  weights,
  workspace,
  reserve,
  layers,
  heads,
  width,
  bytes,
  pageSize,
  context,
}) {
  for (const [name, value] of Object.entries({ total, weights, workspace, reserve }))
    integer(value, name);
  for (const [name, value] of Object.entries({ layers, heads, width, bytes, pageSize, context }))
    integer(value, name, 1);
  const available = total - weights - workspace - reserve;
  const perRow = 2 * layers * heads * width * bytes,
    perPage = perRow * pageSize;
  const demand = Math.ceil(context / pageSize),
    pages = Math.max(0, Math.floor(available / perPage));
  return {
    available,
    perRow,
    perPage,
    pages,
    demand,
    live: context * perRow,
    reserved: demand * perPage,
    slack: demand * pageSize - context,
    feasible: available >= 0 && demand <= pages,
  };
}

export function requestMetrics(trace, cutoff = Infinity) {
  const content = trace.content.filter((t) => t <= cutoff);
  const tokens = trace.tokens === null ? null : trace.tokens.filter((t) => t <= cutoff);
  const terminal = trace.terminal !== null && trace.terminal <= cutoff ? trace.terminal : null;
  const gap = (values) =>
    values && values.length > 1 ? (values.at(-1) - values[0]) / (values.length - 1) : null;
  return {
    id: trace.id,
    outcome: terminal === null ? 'censored' : trace.outcome,
    first: content.length ? content[0] - trace.arrival : null,
    tokenFirst: tokens?.length ? tokens[0] - trace.arrival : null,
    contentGap: gap(content),
    tokenGap: gap(tokens),
    terminal: terminal === null ? null : terminal - trace.arrival,
    quality: terminal === null ? null : trace.quality,
    admitted: trace.admitted !== null && trace.admitted <= cutoff,
    content,
    tokens,
  };
}
export function cohortFixture() {
  return [
    {
      id: 'A',
      arrival: 0,
      admitted: 0.05,
      content: [0.3, 0.5, 0.7],
      tokens: [0.3, 0.5, 0.7],
      terminal: 0.8,
      outcome: 'completed',
      quality: true,
    },
    {
      id: 'B',
      arrival: 0.1,
      admitted: 0.15,
      content: [0.9],
      tokens: null,
      terminal: 1,
      outcome: 'completed',
      quality: true,
    },
    {
      id: 'C',
      arrival: 0.2,
      admitted: null,
      content: [],
      tokens: null,
      terminal: 0.2,
      outcome: 'rejected',
      quality: null,
    },
    {
      id: 'D',
      arrival: 0.3,
      admitted: 0.31,
      content: [],
      tokens: null,
      terminal: 0.45,
      outcome: 'canceled',
      quality: null,
    },
  ];
}
export function cohortMetrics(
  traces,
  { windowEnd = 2, cutoff = 2, firstLimit = 0.5, terminalLimit = 1 } = {},
) {
  if (!(windowEnd > 0 && cutoff >= windowEnd))
    throw Error('Cutoff must follow the positive arrival window.');
  const selected = traces.filter((t) => t.arrival >= 0 && t.arrival < windowEnd);
  const rows = selected.map((t) => {
    const row = requestMetrics(t, cutoff),
      reasons = [];
    if (row.outcome !== 'completed') reasons.push(row.outcome);
    if (row.quality !== true)
      reasons.push(row.quality === null ? 'quality unknown' : 'quality failed');
    if (row.first === null) reasons.push('first content unknown');
    else if (row.first > firstLimit) reasons.push('first content late');
    if (row.terminal === null) reasons.push('terminal unknown');
    else if (row.terminal > terminalLimit) reasons.push('terminal late');
    return { ...row, reasons, good: reasons.length === 0 };
  });
  const good = rows.filter((r) => r.good).length,
    completed = rows.filter((r) => r.outcome === 'completed').length;
  return {
    rows,
    offered: rows.length,
    completed,
    good,
    fraction: rows.length ? good / rows.length : null,
    conditional: completed ? good / completed : null,
    goodput: good / windowEnd,
    outcomes: Object.fromEntries(
      ['completed', 'rejected', 'canceled', 'error', 'censored'].map((k) => [
        k,
        rows.filter((r) => r.outcome === k).length,
      ]),
    ),
  };
}

export const requirementOptions = [
  [
    'route.windows_cpu_pythia14m_f16_observed',
    'Exact recorded Windows CPU / Pythia-14m / F16 route',
  ],
  ['interface.http_streaming', 'Documented HTTP streaming'],
  ['interface.offline_python', 'Documented offline Python interface'],
  ['backend.tensorrt_available', 'TensorRT execution backend'],
  ['model_family.gpt_neox_listed', 'GPTNeoX family explicitly listed'],
  ['maintenance.accepts_new_major_features', 'Accepts new major features'],
];
export function engineClaim(engine, proposition, observed) {
  if (
    observed &&
    engine.id === 'llama.cpp' &&
    proposition === 'route.windows_cpu_pythia14m_f16_observed'
  ) {
    return {
      proposition,
      status: 'supported',
      basis: 'observed',
      sources: ['llama'],
      explanation:
        'The exact pinned Windows CPU route completed four Pythia-14m requests. This does not establish another checkpoint or configuration.',
      scope:
        'b11429 / d8123504, pinned Pythia-14m, converted F16 GGUF, CPU, four sequential requests',
      observation: '/learn/examples/inference-engines/evidence/observations.json',
    };
  }
  return engine.claims.find((c) => c.proposition === proposition) ?? null;
}
export function selectCandidates(requirements, observed = false) {
  if (!requirements.length) throw Error('Choose at least one exact requirement.');
  return evidence.engines.map((engine) => {
    const rows = requirements.map((proposition) => {
      const claim = engineClaim(engine, proposition, observed);
      return {
        proposition,
        claim,
        result:
          !claim || claim.status === 'unknown'
            ? 'unknown'
            : claim.status === 'supported'
              ? 'satisfied'
              : 'conflict',
      };
    });
    return {
      engine,
      rows,
      decision: rows.some((r) => r.result === 'conflict')
        ? 'excluded'
        : rows.some((r) => r.result === 'unknown')
          ? 'unknown'
          : 'eligible',
    };
  });
}

// Display-only addresses track the exact engine's reserve/release events. The Python
// engine counts pages; these stable numbered addresses are an illustrative allocator.
export function addressSnapshots(run) {
  const free = Array.from({ length: run.poolPages }, (_, i) => i),
    owners = {};
  return run.events.map((event, index) => {
    if (event.event === 'admit') owners[event.request] = free.splice(0, event.pages);
    if (event.event === 'terminal') {
      free.push(...(owners[event.request] ?? []));
      free.sort((a, b) => a - b);
      delete owners[event.request];
    }
    return {
      ...run.snapshots[index],
      addresses: Object.fromEntries(Object.entries(owners).map(([id, pages]) => [id, [...pages]])),
    };
  });
}
export function eventSeries(run) {
  let outputs = 0;
  return run.events.map((e, i) => {
    if (e.event === 'emit') outputs++;
    const snapshot = run.snapshots[i];
    return {
      index: i,
      tick: e.time,
      outputs,
      queued: snapshot.waiting.filter((id) => snapshot.states[id].phase === 'queued').length,
      request: e.request,
      event: e.event,
    };
  });
}
export const controlledFields = {
  model_sha256: '0'.repeat(64),
  tokenizer_sha256: '1'.repeat(64),
  precision: 'synthetic; no model',
  sampler: 'supplied',
  cache_policy: 'cold',
  load_policy: 'fixed simultaneous arrivals',
  quality_rule: 'supplied true',
  metric_semantics: 'local elapsed content and terminal',
  stop_policy: 'supplied',
  workload: [
    {
      request_id: 'A',
      prompt: 'supplied fixture',
      prompt_sha256: 'd015f25f6b484fecde07facc2d528e1d915ac74a31fb56d6ded283f2787769aa',
      prompt_ids: [11, 12],
      cap: 2,
      arrival_offset_s: 0,
    },
    {
      request_id: 'B',
      prompt: 'supplied fixture',
      prompt_sha256: 'd015f25f6b484fecde07facc2d528e1d915ac74a31fb56d6ded283f2787769aa',
      prompt_ids: [11, 12],
      cap: 2,
      arrival_offset_s: 0,
    },
  ],
};
export function manifestPair(change = 'none') {
  const left = structuredClone(controlledFields),
    right = structuredClone(controlledFields);
  if (change === 'cap') right.workload[0].cap = 3;
  if (change === 'cache') right.cache_policy = 'warm';
  if (change === 'precision') right.precision = 'changed hypothetical precision';
  const differences = Object.keys(left).filter(
    (k) => JSON.stringify(left[k]) !== JSON.stringify(right[k]),
  );
  return { left, right, differences, comparable: !differences.length };
}
