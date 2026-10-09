// Browser models of the lesson's finite contracts. No model, network or timing calls.
export const terminalPhases = ['eos', 'limit', 'canceled', 'deadline', 'error', 'rejected'];
export const anchorJobs = [{
  id: 'A',
  prompt: [11, 12, 13],
  cap: 3,
  arrival: 0
}, {
  id: 'B',
  prompt: [11, 12, 14, 15],
  cap: 2,
  arrival: 1
}];
export function positiveInteger(value, name, minimum = 1) {
  if (!Number.isSafeInteger(value) || value < minimum) throw Error(`${name} must be an integer ≥ ${minimum}`);
  return value;
}
export function reserveRows(prompt, cap, pageSize = 2) {
  positiveInteger(prompt, 'Prompt length');
  positiveInteger(cap, 'Output cap');
  positiveInteger(pageSize, 'Page size');
  const maxRows = prompt + cap - 1,
    pages = Math.ceil(maxRows / pageSize);
  return {
    maxRows,
    pages,
    reservedRows: pages * pageSize,
    slack: pages * pageSize - maxRows
  };
}
export function runEngine({
  jobs = anchorJobs,
  poolPages = 6,
  pageSize = 2,
  queueLimit = 16,
  cancelAt = {},
  failure = null,
  scripts = {
    A: [21, 22, 0],
    B: [31, 0]
  },
  maxIterations = 100
} = {}) {
  positiveInteger(poolPages, 'Pool');
  positiveInteger(pageSize, 'Page size');
  positiveInteger(queueLimit, 'Waiting limit');
  positiveInteger(maxIterations, 'Iteration bound');
  const states = {},
    events = [],
    snapshots = [],
    waiting = [],
    active = [];
  let freePages = poolPages,
    time = 0;
  for (const job of jobs) {
    if (typeof job.id !== 'string' || !job.id.trim() || states[job.id]) throw Error('Unique nonempty request IDs required');
    if (!Array.isArray(job.prompt) || !job.prompt.length) throw Error('Nonempty prompt required');
    job.prompt.forEach(x => positiveInteger(x, 'Token ID', 0));
    positiveInteger(job.cap, 'Output cap');
    const arrival = job.arrival ?? 0;
    if (!Number.isFinite(arrival) || arrival < 0) throw Error('Arrival must be finite and nonnegative');
    if (job.deadline != null && (!Number.isFinite(job.deadline) || job.deadline < arrival)) throw Error('Deadline must not precede arrival');
    states[job.id] = {
      job: {
        ...job,
        prompt: [...job.prompt],
        arrival
      },
      phase: 'future',
      outputs: [],
      pages: 0,
      cacheRows: 0
    };
  }
  for (const [id, tick] of Object.entries(cancelAt)) if (!states[id] || !Number.isFinite(tick) || tick < 0) throw Error('Invalid cancellation');
  const future = Object.keys(states).sort((a, b) => states[a].job.arrival - states[b].job.arrival);
  const copy = () => JSON.parse(JSON.stringify(states));
  const record = (s, event, detail = {}) => {
    events.push({
      time,
      request: s.job.id,
      event,
      ...detail
    });
    snapshots.push({
      eventIndex: events.length - 1,
      time,
      freePages,
      states: copy(),
      waiting: [...waiting],
      active: [...active]
    });
  };
  const finish = (s, reason) => {
    if (terminalPhases.includes(s.phase)) return false;
    const detail = {
      reason,
      outputs: [...s.outputs],
      cached_rows_at_finish: s.cacheRows,
      released_pages: s.pages
    };
    freePages += s.pages;
    s.pages = 0;
    s.cacheRows = 0;
    s.phase = reason;
    const index = active.indexOf(s.job.id);
    if (index >= 0) active.splice(index, 1);
    record(s, 'terminal', detail);
    return true;
  };
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    if (!(future.length || waiting.length || active.length)) return {
      events,
      snapshots,
      states,
      freePages,
      poolPages,
      pageSize
    };
    if (!waiting.length && !active.length && future.length) time = Math.max(time, states[future[0]].job.arrival);
    while (future.length && states[future[0]].job.arrival <= time) {
      const s = states[future.shift()],
        demand = reserveRows(s.job.prompt.length, s.job.cap, pageSize).pages;
      record(s, 'arrive', {
        reservation_pages: demand
      });
      if (demand > poolPages || waiting.length >= queueLimit) finish(s, 'rejected');else {
        s.phase = 'queued';
        waiting.push(s.job.id);
        record(s, 'queued');
      }
    }
    for (const s of Object.values(states)) {
      if (terminalPhases.includes(s.phase) || s.phase === 'future') continue;
      if (s.job.deadline != null && s.job.deadline <= time) finish(s, 'deadline');else if ((cancelAt[s.job.id] ?? Infinity) <= time) finish(s, 'canceled');
    }
    const scan = waiting.length;
    for (let i = 0; i < scan; i++) {
      const s = states[waiting.shift()];
      if (terminalPhases.includes(s.phase)) continue;
      const demand = reserveRows(s.job.prompt.length, s.job.cap, pageSize).pages;
      if (demand > freePages) {
        waiting.push(s.job.id);
        continue;
      }
      freePages -= demand;
      s.pages = demand;
      s.phase = 'prefill';
      active.push(s.job.id);
      record(s, 'admit', {
        pages: demand
      });
    }
    for (const id of [...active]) {
      const s = states[id],
        input = s.phase === 'prefill' ? s.job.prompt : [s.outputs.at(-1)];
      record(s, 'forward', {
        phase: s.phase,
        input_ids: [...input]
      });
      if (failure && failure[0] === id && failure[1] === s.outputs.length) {
        record(s, 'runner_error', {
          type: 'RuntimeError',
          message: 'explicit supplied runner failure'
        });
        finish(s, 'error');
        continue;
      }
      const token = scripts[id]?.[s.outputs.length] ?? 0;
      positiveInteger(token, 'Runner output', 0);
      s.cacheRows += input.length;
      s.outputs.push(token);
      record(s, 'emit', {
        token,
        index: s.outputs.length - 1,
        cached_rows: s.cacheRows
      });
      if (token === 0) finish(s, 'eos');else if (s.outputs.length === s.job.cap) finish(s, 'limit');else s.phase = 'decode';
    }
    const reserved = Object.values(states).reduce((n, s) => n + s.pages, 0);
    if (freePages + reserved !== poolPages || freePages < 0) throw Error('Page conservation failed');
    for (const s of Object.values(states)) if (s.cacheRows > s.pages * pageSize || s.outputs.length > s.job.cap) throw Error('State invariant failed');
    time += 1;
  }
  throw Error('Explicit iteration bound reached');
}
export function packedPrompts(reverse = false) {
  const jobs = reverse ? [...anchorJobs].reverse() : anchorJobs;
  const rows = [],
    offsets = [0],
    lastRows = {};
  for (const job of jobs) {
    job.prompt.forEach((token, position) => rows.push({
      owner: job.id,
      token,
      position,
      row: rows.length
    }));
    offsets.push(rows.length);
    lastRows[job.id] = rows.length - 1;
  }
  const allowed = rows.map(q => rows.map(k => q.owner === k.owner && k.position <= q.position));
  return {
    rows,
    offsets,
    lastRows,
    allowed,
    count: allowed.flat().filter(Boolean).length
  };
}
export function decodeSteps(cap = 3) {
  const budget = reserveRows(3, cap),
    outputs = [21, 22, 0].slice(0, cap),
    consumed = [11, 12, 13, ...outputs.slice(0, -1)];
  return {
    budget,
    outputs,
    consumed,
    decodeInputs: outputs.slice(0, -1),
    stop: outputs.at(-1) === 0 ? 'EOS' : 'cap',
    actualRows: consumed.length
  };
}
export function commitRecords(index = 0) {
  positiveInteger(index, 'Commit index', 0);
  if (index > 2) throw Error('Only three anchor outputs');
  const outputs = [21, 22, 0],
    prior = outputs.slice(0, index),
    cached = 3 + index;
  return {
    input: index ? [prior.at(-1)] : [11, 12, 13],
    before: {
      fed: cached,
      cached,
      outputs: prior,
      phase: index ? 'decode' : 'prefill'
    },
    after: {
      fed: cached,
      cached,
      outputs: outputs.slice(0, index + 1),
      phase: index === 2 ? 'EOS selected; release follows' : 'decode'
    },
    terminal: index === 2
  };
}
export class SSEParser {
  constructor() {
    this.decoder = new TextDecoder('utf-8', {
      fatal: true
    });
    this.line = '';
    this.data = [];
    this.afterCR = false;
    this.closed = false;
    this.partial = false;
    this.trace = [];
  }
  endLine() {
    const line = this.line;
    this.line = '';
    if (!line) {
      if (!this.data.length) {
        this.trace.push({
          action: 'blank line, no data',
          line
        });
        return [];
      }
      const event = this.data.join('\n');
      this.data = [];
      this.trace.push({
        action: 'dispatch',
        line,
        event
      });
      return [event];
    }
    if (line.startsWith(':')) {
      this.trace.push({
        action: 'ignore comment',
        line
      });
      return [];
    }
    const colon = line.indexOf(':'),
      field = colon < 0 ? line : line.slice(0, colon);
    let value = colon < 0 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    if (field === 'data') {
      this.data.push(value);
      this.trace.push({
        action: 'append data',
        line,
        fields: [...this.data]
      });
    } else this.trace.push({
      action: 'ignore field',
      line
    });
    return [];
  }
  feed(bytes) {
    if (this.closed) throw Error('Parser already finalized');
    const text = this.decoder.decode(bytes, {
        stream: true
      }),
      events = [];
    for (const char of text) {
      if (this.afterCR) {
        this.afterCR = false;
        if (char === '\n') continue;
      }
      if (char === '\r' || char === '\n') {
        events.push(...this.endLine());
        this.afterCR = char === '\r';
      } else this.line += char;
    }
    return {
      text,
      events
    };
  }
  finish() {
    if (this.closed) throw Error('Parser already finalized');
    this.closed = true;
    this.decoder.decode();
    this.partial = Boolean(this.line || this.data.length);
    this.line = '';
    this.data = [];
    return [];
  }
}
export function nativeRecord(data) {
  const result = JSON.parse(data);
  if (!result || typeof result !== 'object' || Array.isArray(result)) throw Error('Expected a JSON object in native event');
  if ('stop' in result && typeof result.stop !== 'boolean') throw Error('stop must be boolean');
  if ('content' in result && typeof result.content !== 'string') throw Error('content must be text');
  if ('tokens' in result && (!Array.isArray(result.tokens) || result.tokens.some(x => !Number.isSafeInteger(x) || x < 0))) throw Error('tokens must be nonnegative integer IDs');
  return result;
}
const encoder = new TextEncoder();
export const utf8Wire = encoder.encode('data: {"content":"é"}\n\n');
export const sseFixtures = {
  lf: {
    label: 'LF: content then terminal',
    bytes: encoder.encode('data: {"content":"é","stop":false}\n\ndata: {"stop":true}\n\n')
  },
  crlf: {
    label: 'BOM, comment and CRLF',
    bytes: encoder.encode('\uFEFF: ping\r\ndata: {"content":"é","stop":false}\r\n\r\ndata: {"stop":true}\r\n\r\n')
  },
  cr: {
    label: 'CR and repeated data fields',
    bytes: encoder.encode('data: {"content":\rdata: "é","stop":false}\r\r')
  },
  partial: {
    label: 'EOF before blank line',
    bytes: encoder.encode('data: {"stop":true}')
  },
  invalid: {
    label: 'Invalid UTF-8 byte FF',
    bytes: new Uint8Array([...encoder.encode('data: '), 255, 10, 10])
  },
  incomplete: {
    label: 'EOF inside UTF-8 character',
    bytes: new Uint8Array([...encoder.encode('data: '), 195])
  },
  done: {
    label: '[DONE] is not native JSON',
    bytes: encoder.encode('data: [DONE]\n\n')
  }
};
export function parseWire(bytes, chunkSize = 1, split = null) {
  positiveInteger(chunkSize, 'Chunk size');
  const parser = new SSEParser(),
    events = [],
    records = [],
    reads = [];
  let error = null;
  const chunks = split == null ? Array.from({
    length: Math.ceil(bytes.length / chunkSize)
  }, (_, i) => bytes.slice(i * chunkSize, (i + 1) * chunkSize)) : [bytes.slice(0, split), bytes.slice(split)];
  try {
    for (const chunk of chunks) {
      const result = parser.feed(chunk);
      events.push(...result.events);
      reads.push({
        bytes: [...chunk],
        ...result,
        pendingLine: parser.line,
        pendingFields: [...parser.data]
      });
    }
    parser.finish();
    for (const event of events) records.push(nativeRecord(event));
  } catch (caught) {
    error = caught.message;
  }
  return {
    events,
    records,
    reads,
    trace: parser.trace,
    partial: parser.partial,
    error
  };
}
export function sharedOwnership(stage = 1, retain = true) {
  const active = stage === 0 ? ['A', 'B'] : stage === 1 ? ['B'] : [];
  return {
    active,
    refs: active.length,
    resident: active.length > 0 || retain,
    privateA: active.includes('A'),
    privateB: active.includes('B')
  };
}
