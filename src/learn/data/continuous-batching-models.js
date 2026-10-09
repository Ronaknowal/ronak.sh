// Finite CPU teaching models. No language-model generation occurs in the browser.
export const requestColors = ['#5da9ff', '#ffc04d', '#b595ff', '#ff83ad', '#59d9ed', '#d2b6ff', '#f5aa76', '#91c9fa'];
export const requestColor = identity => requestColors[{
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
  F: 5,
  G: 6,
  H: 7,
  long: 2
}[identity] ?? 0];
export const originalJobs = [30, 500, 25, 480, 40, 450, 20, 510].map((length, i) => ({
  identity: String.fromCharCode(65 + i),
  arrival: 0,
  length
}));
const copy = value => JSON.parse(JSON.stringify(value));
export function schedule(jobs, slots = 4, policy = 'continuous') {
  if (slots < 1 || !['continuous', 'static'].includes(policy)) throw new Error('Invalid scheduling policy or capacity');
  if (new Set(jobs.map(row => row.identity)).size !== jobs.length) throw new Error('Duplicate request ID; state was not changed');
  const future = jobs.map((row, order) => ({
    ...row,
    order
  })).sort((a, b) => a.arrival - b.arrival || a.order - b.order);
  let waiting = [],
    now = 0;
  const active = Array(slots).fill(null),
    events = [],
    requests = {};
  const remaining = Object.fromEntries(jobs.map(row => [row.identity, row.length]));
  jobs.forEach(row => {
    requests[row.identity] = {
      arrival: row.arrival,
      start: null,
      finish: null,
      status: null,
      work: 0,
      slot: null
    };
  });
  const terminal = (row, status) => {
    Object.assign(requests[row.identity], {
      finish: now,
      status
    });
    events.push({
      time: now,
      event: status,
      id: row.identity
    });
  };
  while (future.length || waiting.length || active.some(Boolean)) {
    if (!waiting.length && !active.some(Boolean) && future.length && future[0].arrival > now) now = future[0].arrival;
    while (future.length && future[0].arrival <= now) {
      const row = future.shift();
      waiting.push(row);
      events.push({
        time: now,
        event: 'arrive',
        id: row.identity
      });
    }
    waiting = waiting.filter(row => {
      if (row.cancel_at != null && row.cancel_at <= now) {
        terminal(row, 'canceled');
        return false;
      }
      if (!row.length) {
        terminal(row, 'empty');
        return false;
      }
      return true;
    });
    active.forEach((row, slot) => {
      if (row && row.cancel_at != null && row.cancel_at <= now) {
        terminal(row, 'canceled');
        active[slot] = null;
      }
    });
    if (policy === 'continuous' || !active.some(Boolean)) active.forEach((row, slot) => {
      if (!row && waiting.length) {
        const admitted = waiting.shift();
        active[slot] = admitted;
        Object.assign(requests[admitted.identity], {
          start: now,
          slot
        });
        events.push({
          time: now,
          event: 'admit',
          id: admitted.identity,
          slot
        });
      }
    });
    if (!active.some(Boolean)) continue;
    active.forEach(row => {
      if (row) {
        remaining[row.identity]--;
        requests[row.identity].work++;
      }
    });
    now++;
    active.forEach((row, slot) => {
      if (row && !remaining[row.identity]) {
        terminal(row, 'finished');
        active[slot] = null;
      }
    });
  }
  const intervals = Object.entries(requests).filter(([, row]) => row.start != null).map(([id, row]) => ({
    id,
    slot: row.slot,
    begin: row.start,
    end: row.finish
  }));
  return {
    policy,
    slots,
    finish: now,
    requests,
    events,
    intervals,
    useful_work: Object.values(requests).reduce((sum, row) => sum + row.work, 0)
  };
}

// One displayed layer/head/coordinate projection of the Python multi-axis pool.
// Every stored slot has a real finite key and value, not just an occupancy flag.
export class PagePool {
  constructor(pages = 8, pageSize = 3) {
    this.pageSize = pageSize;
    this.keys = Array.from({
      length: pages
    }, () => Array(pageSize).fill(0));
    this.values = Array.from({
      length: pages
    }, () => Array(pageSize).fill(0));
    this.refs = Array(pages).fill(0);
    this.free = Array.from({
      length: pages
    }, (_, i) => i);
    this.tables = {};
    this.lengths = {};
  }
  create(id) {
    if (Object.hasOwn(this.tables, id)) throw new Error('Duplicate live request ID');
    this.tables[id] = [];
    this.lengths[id] = 0;
  }
  fork(parent, child, prefix) {
    if (!Object.hasOwn(this.tables, parent) || Object.hasOwn(this.tables, child) || prefix < 0 || prefix > this.lengths[parent]) throw new Error('Invalid fork');
    this.tables[child] = this.tables[parent].slice(0, Math.ceil(prefix / this.pageSize));
    this.tables[child].forEach(page => this.refs[page]++);
    this.lengths[child] = prefix;
  }
  address(id, position) {
    if (!Object.hasOwn(this.tables, id) || position < 0 || position >= this.lengths[id]) throw new Error('Position is outside this request’s valid history');
    return [this.tables[id][Math.floor(position / this.pageSize)], position % this.pageSize];
  }
  dense(id, field = 'keys') {
    return Array.from({
      length: this.lengths[id]
    }, (_, position) => {
      const [page, offset] = this.address(id, position);
      return this[field][page][offset];
    });
  }
  append(id, keys, values = keys.map(value => -value)) {
    if (!Object.hasOwn(this.tables, id) || keys.length !== values.length || ![...keys, ...values].every(Number.isFinite)) throw new Error('Invalid append');
    const oldLength = this.lengths[id],
      old = this.tables[id],
      end = oldLength + keys.length;
    if (!keys.length) return {
      new_pages: [],
      copied_valid_rows: 0,
      length: oldLength
    };
    const tail = oldLength % this.pageSize,
      cow = Boolean(tail && this.refs[old.at(-1)] > 1);
    const need = Math.ceil(end / this.pageSize) - old.length + Number(cow);
    if (need > this.free.length) throw new Error(`Need ${need} free pages; only ${this.free.length} available`);
    const reserved = this.free.slice(0, need),
      target = [...old];
    if (cow) target[target.length - 1] = reserved[0];
    target.push(...reserved.slice(Number(cow)));
    const staged = {};
    for (let logical = Math.floor(oldLength / this.pageSize); logical < target.length; logical++) {
      staged[logical] = [Array(this.pageSize).fill(0), Array(this.pageSize).fill(0)];
      const keep = logical < old.length ? Math.min(this.pageSize, oldLength - logical * this.pageSize) : 0;
      for (let offset = 0; offset < keep; offset++) {
        staged[logical][0][offset] = this.keys[old[logical]][offset];
        staged[logical][1][offset] = this.values[old[logical]][offset];
      }
    }
    keys.forEach((key, row) => {
      const p = oldLength + row,
        logical = Math.floor(p / this.pageSize),
        offset = p % this.pageSize;
      staged[logical][0][offset] = key;
      staged[logical][1][offset] = values[row];
    });
    Object.entries(staged).forEach(([logical, rows]) => {
      this.keys[target[logical]] = rows[0];
      this.values[target[logical]] = rows[1];
    });
    this.free.splice(0, need);
    reserved.forEach(page => {
      this.refs[page] = 1;
    });
    if (cow) this.refs[old.at(-1)]--;
    this.tables[id] = target;
    this.lengths[id] = end;
    return {
      new_pages: reserved,
      copied_valid_rows: cow ? tail : 0,
      length: end
    };
  }
  release(id) {
    if (!Object.hasOwn(this.tables, id)) throw new Error('Unknown or already released request');
    this.tables[id].forEach(page => {
      if (--this.refs[page] === 0) this.free.push(page);
    });
    delete this.tables[id];
    delete this.lengths[id];
  }
  snapshot() {
    return copy({
      tables: this.tables,
      lengths: this.lengths,
      refs: this.refs,
      free: this.free,
      keys: this.keys,
      values: this.values
    });
  }
}
export function softmax(scores) {
  const valid = scores.filter(Number.isFinite);
  if (!valid.length) return null;
  const maximum = Math.max(...valid),
    mass = scores.map(score => Number.isFinite(score) ? Math.exp(score - maximum) : 0),
    sum = mass.reduce((a, b) => a + b, 0);
  return mass.map(value => value / sum);
}
export function pageAttention(scores, values, pageSize = 2, mask = scores.map(() => true)) {
  let maximum = -Infinity,
    mass = 0,
    numerator = 0;
  const registers = [];
  for (let start = 0; start < scores.length; start += pageSize) {
    const rows = scores.slice(start, start + pageSize).map((score, i) => ({
      score,
      value: values[start + i],
      valid: mask[start + i]
    })).filter(row => row.valid);
    if (!rows.length) {
      registers.push({
        start,
        skipped: true,
        maximum: Number.isFinite(maximum) ? maximum : null,
        mass,
        numerator
      });
      continue;
    }
    const nextMaximum = Math.max(maximum, ...rows.map(row => row.score)),
      rescale = Number.isFinite(maximum) ? Math.exp(maximum - nextMaximum) : 0;
    const weights = rows.map(row => Math.exp(row.score - nextMaximum));
    mass = rescale * mass + weights.reduce((a, b) => a + b, 0);
    numerator = rescale * numerator + rows.reduce((sum, row, i) => sum + row.value * weights[i], 0);
    registers.push({
      start,
      maximum: nextMaximum,
      rescale,
      mass,
      numerator,
      output: numerator / mass
    });
    maximum = nextMaximum;
  }
  const weights = softmax(scores.map((score, i) => mask[i] ? score : -Infinity));
  return {
    output: mass ? numerator / mass : null,
    registers,
    weights,
    dense: weights ? weights.reduce((sum, weight, i) => sum + weight * values[i], 0) : null
  };
}
export function segmentedAttention(perturb = 0, broken = false, reverse = false) {
  const groups = {
    A: [{
      id: 'A',
      position: 2,
      key: 1 + perturb,
      value: 2 + perturb
    }, {
      id: 'A',
      position: 3,
      key: 2 + perturb,
      value: 4 + perturb
    }],
    B: [{
      id: 'B',
      position: 50,
      key: 3,
      value: 7
    }]
  };
  const rows = (reverse ? ['B', 'A'] : ['A', 'B']).flatMap(id => groups[id]);
  const mask = rows.map((query, i) => rows.map((key, j) => broken ? j <= i : key.id === query.id && key.position <= query.position));
  const scores = rows.map((_, i) => rows.map((key, j) => mask[i][j] ? key.key / 2 : -Infinity));
  const weights = scores.map(softmax),
    outputs = weights.map(row => row.reduce((sum, value, i) => sum + value * rows[i].value, 0));
  return {
    rows,
    mask,
    scores,
    weights,
    outputs,
    keyed: Object.fromEntries(rows.map((row, i) => [`${row.id}${row.position}`, outputs[i]]))
  };
}
export function projection(aRows = 2, reverse = false) {
  const segments = {
    A: Array.from({
      length: aRows
    }, (_, i) => ({
      id: 'A',
      position: 2 + i,
      values: [1 + i, 2, 0, -1]
    })),
    B: [{
      id: 'B',
      position: 50,
      values: [0, 1, 2, 1]
    }]
  };
  const order = reverse ? ['B', 'A'] : ['A', 'B'],
    rows = order.flatMap(id => segments[id]);
  const weights = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, -1, 1]];
  return {
    rows,
    order,
    offsets: [0, segments[order[0]].length, rows.length],
    weights,
    result: rows.map(row => [0, 1, 2].map(column => row.values.reduce((sum, value, i) => sum + value * weights[i][column], 0)))
  };
}
export function chunkGeometry(length = 12, chunk = 4) {
  const blocks = [];
  for (let begin = 0; begin < length; begin += chunk) {
    const rows = Math.min(chunk, length - begin);
    blocks.push({
      begin,
      rows,
      oldPairs: rows * begin,
      triangle: rows * (rows + 1) / 2
    });
  }
  return {
    blocks,
    pairs: blocks.reduce((sum, row) => sum + row.oldPairs + row.triangle, 0)
  };
}
export function pipeline(count = 2, first = 2, second = 3) {
  const intervals = [];
  let available = 0;
  for (let i = 0; i < count; i++) {
    const ready = (i + 1) * first,
      start = Math.max(ready, available);
    intervals.push({
      id: String.fromCharCode(65 + i),
      slot: 0,
      begin: i * first,
      end: ready
    }, {
      id: String.fromCharCode(65 + i),
      slot: 1,
      begin: start,
      end: start + second
    });
    available = start + second;
  }
  return {
    intervals,
    finish: available
  };
}
export const servingRequests = [{
  identity: 'A',
  arrival: 0,
  prompt: 3,
  cap: 8
}, {
  identity: 'B',
  arrival: 0,
  prompt: 3,
  cap: 8
}, {
  identity: 'long',
  arrival: .6,
  prompt: 12,
  cap: 3
}];
export function simulate(requests = servingRequests, options = {}) {
  const settings = {
    budget: 6,
    pages: 10,
    page_size: 4,
    slots: 3,
    chunk: 4,
    reservation: false,
    fixed: .2,
    linear: .05,
    attention: .001,
    ...options
  };
  const {
    budget,
    pages,
    page_size: size,
    slots,
    chunk,
    reservation,
    fixed,
    linear,
    attention
  } = settings;
  if (budget < 1 || pages < 1 || size < 1 || chunk < 1 || fixed + linear <= 0) throw new Error('A positive progress budget is required');
  const future = requests.map((row, order) => ({
    ...row,
    order
  })).sort((a, b) => a.arrival - b.arrival || a.order - b.order);
  const waiting = [],
    active = [],
    pool = new PagePool(pages, size),
    states = {},
    events = [],
    iterations = [];
  requests.forEach(row => {
    states[row.identity] = {
      request: row,
      generated: 0,
      emissions: [],
      status: 'future',
      useful_rows: 0,
      repeated_rows: 0,
      high_water: 0,
      preemptions: 0
    };
  });
  let now = 0,
    guard = 0;
  const remove = (array, id) => {
    const index = array.indexOf(id);
    if (index >= 0) array.splice(index, 1);
  };
  const finish = (id, status) => {
    Object.assign(states[id], {
      status,
      finished: now
    });
    remove(active, id);
    remove(waiting, id);
    if (Object.hasOwn(pool.tables, id)) pool.release(id);
    events.push({
      time: now,
      event: status,
      id
    });
  };
  const capPages = id => Math.ceil((states[id].request.prompt + states[id].request.cap - 1) / size);
  const preempt = id => {
    pool.release(id);
    remove(active, id);
    waiting.push(id);
    states[id].status = 'waiting-rebuild';
    states[id].preemptions++;
    events.push({
      time: now,
      event: 'preempt',
      id
    });
  };
  while (future.length || waiting.length || active.length) {
    if (++guard > 10000) throw new Error('Finite progress guard reached');
    if (!active.length && !waiting.length && future.length && future[0].arrival > now) now = future[0].arrival;
    while (future.length && future[0].arrival <= now) {
      const row = future.shift();
      waiting.push(row.identity);
      states[row.identity].status = 'waiting';
      events.push({
        time: now,
        event: 'arrive',
        id: row.identity
      });
    }
    [...active, ...waiting].forEach(id => {
      const row = states[id].request;
      if (row.cancel_at != null && row.cancel_at <= now) finish(id, 'canceled');
    });
    while (waiting.length && active.length < slots) {
      const id = waiting[0],
        need = capPages(id);
      if (reservation && need > pages) {
        finish(id, 'infeasible-cap-reservation');
        continue;
      }
      if (reservation && active.reduce((sum, key) => sum + capPages(key), 0) + need > pages) break;
      waiting.shift();
      pool.create(id);
      active.push(id);
      states[id].status = 'active';
      events.push({
        time: now,
        event: 'admit',
        id
      });
    }
    if (!active.length) continue;
    const protectedId = active[0],
      decode = [],
      prefill = [];
    active.forEach(id => {
      const s = states[id],
        target = s.request.prompt + Math.max(0, s.generated - 1);
      (s.generated && pool.lengths[id] === target ? decode : prefill).push(id);
    });
    let order = [...decode, ...prefill];
    if (!decode.includes(protectedId) && decode.length >= budget) order = [protectedId, ...order.filter(id => id !== protectedId)];
    let available = budget;
    const work = [],
      emissions = [],
      processed = new Set();
    for (const id of order) {
      if (!active.includes(id) || !available) continue;
      const s = states[id],
        row = s.request,
        old = pool.lengths[id],
        target = row.prompt + Math.max(0, s.generated - 1);
      const kind = s.generated && old === target ? 'decode' : s.generated ? 'recompute' : 'prefill';
      let rows = kind === 'decode' ? 1 : Math.min(chunk, target - old, available);
      if (old + 1 > pages * size) {
        finish(id, 'infeasible-next-row');
        continue;
      }
      rows = Math.min(rows, pages * size - old);
      const need = Math.ceil((old + rows) / size) - pool.tables[id].length;
      if (!reservation && id === protectedId) while (need > pool.free.length) {
        const victim = [...active].reverse().find(key => key !== protectedId && !processed.has(key));
        if (!victim) break;
        preempt(victim);
      }
      if (need > pool.free.length) continue;
      pool.append(id, Array.from({
        length: rows
      }, (_, i) => requests.indexOf(row) * 1000 + old + i));
      const repeated = Math.max(0, Math.min(old + rows, s.high_water) - old);
      s.repeated_rows += repeated;
      s.useful_rows += rows - repeated;
      s.high_water = Math.max(s.high_water, old + rows);
      processed.add(id);
      available -= rows;
      work.push({
        id,
        kind,
        begin: old,
        rows,
        new_rows: rows - repeated,
        repeated_rows: repeated,
        attention_pairs: rows * old + rows * (rows + 1) / 2
      });
      if (kind === 'decode' || kind === 'prefill' && pool.lengths[id] === row.prompt) emissions.push(id);
    }
    if (!work.length) {
      if (active.length) throw new Error('No progress despite a protected request');
      continue;
    }
    const begin = now;
    now += fixed + linear * work.reduce((sum, row) => sum + row.rows, 0) + attention * work.reduce((sum, row) => sum + row.attention_pairs, 0);
    emissions.forEach(id => {
      const s = states[id];
      s.generated++;
      s.emissions.push(now);
      events.push({
        time: now,
        event: 'emit',
        id,
        output: s.generated
      });
      if (s.generated === s.request.cap) finish(id, 'finished');
    });
    iterations.push({
      begin,
      end: now,
      work,
      resident_pages: pool.refs.filter(Boolean).length,
      pool: pool.snapshot()
    });
  }
  const result = {};
  Object.entries(states).forEach(([id, state]) => {
    const {
        request: row,
        ...rest
      } = state,
      times = state.emissions;
    result[id] = {
      ...rest,
      arrival: row.arrival,
      prompt: row.prompt,
      cap: row.cap,
      ttft: times.length ? times[0] - row.arrival : null,
      inter_token_gaps: times.slice(1).map((time, i) => time - times[i]),
      response_elapsed: state.status === 'finished' ? times.at(-1) - row.arrival : null
    };
  });
  return {
    settings,
    requests: result,
    events,
    iterations,
    finish: now
  };
}
