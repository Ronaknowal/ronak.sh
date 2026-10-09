export const colors = ['#6daeff', '#bb96ff', '#62d7e2', '#ffc266', '#ff91b4', '#97bbef', '#d8a6f4', '#f3b18b', '#4dcaef', '#d882df', '#e3bf79', '#a8b4ff', '#ee97dc', '#79c1e4', '#c3a7dc', '#eea877', '#91cfee', '#ecaac9', '#bea2f5', '#ffbca0', '#86a0dc', '#db85b1', '#d8bd99', '#a4b9d8', '#c6a1bc'];
export const color = id => colors[(Math.abs(Number(id)) - 1 + colors.length) % colors.length];
export const requests = {
  A: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  B: [1, 2, 3, 4, 5, 6, 7, 8, 11, 12],
  C: [1, 2, 3, 4, 20, 21, 22, 23, 24, 25]
};
export const namespace = {
  model: 'fixed-v1',
  adapter: 'none',
  positions: 'absolute',
  mask: 'causal',
  trust: 'demo'
};
export const clone = value => JSON.parse(JSON.stringify(value));
export function integer(n, minimum = 0) {
  if (!Number.isInteger(n) || n < minimum) throw Error('Invalid integer');
  return n;
}
export function ids(values) {
  if (!Array.isArray(values) || values.some(x => !Number.isInteger(x) || x < 0 || x >= 2 ** 32)) throw Error('Use uint32 token IDs');
  return [...values];
}
export function parseIds(text) {
  if (!text.trim()) return [];
  if (!/^\d+(?:\s*,\s*\d+)*$/.test(text.trim())) throw Error('Use comma-separated nonnegative integer IDs.');
  return ids(text.split(',').map(x => Number(x.trim())));
}
export function common(a, b) {
  let n = 0;
  while (n < Math.min(a.length, b.length) && a[n] === b[n]) n++;
  return n;
}
export function eligible(length, page = 4) {
  integer(length);
  integer(page, 1);
  return page * Math.floor(Math.max(0, length - 1) / page);
}
export function work(length, prefix) {
  integer(length, 1);
  integer(prefix);
  if (prefix > length) throw Error('Prefix exceeds prompt');
  const triangle = n => n * (n + 1) / 2;
  return {
    queries: length - prefix,
    full: triangle(length),
    avoided: triangle(prefix),
    rectangle: (length - prefix) * prefix,
    tail: triangle(length - prefix),
    remaining: triangle(length) - triangle(prefix)
  };
}
export function compatible(a, b) {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].sort().find(k => a[k] !== b[k]) ?? null;
}
const exact = (tokens, space) => JSON.stringify([Object.entries(space).sort(), tokens]);

// Exact identity is the reference key here. The hash experiment separately
// demonstrates the parent digest and exact collision bucket.
export class Store {
  constructor(capacity = 4, page = 4, space = namespace) {
    integer(capacity, 1);
    integer(page, 1);
    this.page = page;
    this.space = clone(space);
    this.pages = Array.from({
      length: capacity
    }, (_, id) => ({
      id,
      generation: 0,
      tokens: [],
      owners: [],
      complete: false,
      reserved: false,
      key: null
    }));
    this.free = this.pages.map(p => p.id);
    this.inactive = [];
    this.index = new Map();
    this.requests = {};
    this.evictions = 0;
  }
  match(tokens) {
    const out = [];
    for (let end = this.page; end <= eligible(tokens.length, this.page); end += this.page) {
      const n = this.index.get(exact(tokens.slice(0, end), this.space));
      if (n === undefined) break;
      out.push(n);
    }
    return out;
  }
  snapshot() {
    return clone({
      pages: this.pages,
      free: this.free,
      inactive_lru: this.inactive,
      requests: this.requests,
      evictions: this.evictions
    });
  }
  reclaim(n) {
    const p = this.pages[n];
    if (p.owners.length) throw Error('Active page');
    this.inactive = this.inactive.filter(x => x !== n);
    if (p.complete) {
      this.index.delete(p.key);
      this.evictions++;
    }
    p.tokens = [];
    p.key = null;
    p.complete = false;
    p.reserved = false;
    this.free.push(n);
  }
  claim(n, r) {
    const p = this.pages[n];
    if (p.owners.includes(r)) throw Error('Duplicate owner');
    this.inactive = this.inactive.filter(x => x !== n);
    p.owners.push(r);
    p.owners.sort();
  }
  admit(r, tokens) {
    tokens = ids(tokens);
    if (!tokens.length || Object.hasOwn(this.requests, r)) throw Error('New nonempty request required');
    const matched = this.match(tokens),
      needed = Math.ceil(tokens.length / this.page) - matched.length;
    const deficit = Math.max(0, needed - this.free.length),
      candidates = this.inactive.filter(n => !matched.includes(n));
    const plan = {
      matched,
      needed,
      availableFree: [...this.free],
      evictable: candidates,
      deficit
    };
    if (candidates.length < deficit) return {
      accepted: false,
      ...plan,
      reused_rows: 0,
      new_query_rows: tokens.length
    };
    const evicted = candidates.slice(0, deficit);
    matched.forEach(n => this.claim(n, r));
    evicted.forEach(n => this.reclaim(n));
    const allocated = [];
    for (let i = 0; i < needed; i++) {
      const n = this.free.shift(),
        p = this.pages[n];
      p.generation++;
      p.tokens = [];
      p.reserved = true;
      this.claim(n, r);
      allocated.push(n);
    }
    this.requests[r] = {
      ids: tokens,
      table: [...matched, ...allocated],
      computed: false
    };
    return {
      accepted: true,
      ...plan,
      allocated,
      evicted,
      reused_rows: matched.length * this.page,
      new_query_rows: tokens.length - matched.length * this.page
    };
  }
  complete(r) {
    const row = this.requests[r];
    if (!row) throw Error('Unknown request');
    row.table.forEach((n, slot) => {
      const p = this.pages[n];
      if (p.complete) return;
      p.tokens = row.ids.slice(slot * this.page, (slot + 1) * this.page);
      p.reserved = false;
      if (p.tokens.length === this.page) {
        const key = exact(row.ids.slice(0, (slot + 1) * this.page), this.space),
          existing = this.index.get(key);
        if (existing !== undefined && existing !== n) {
          this.claim(existing, r);
          p.owners = p.owners.filter(x => x !== r);
          this.reclaim(n);
          row.table[slot] = existing;
        } else {
          p.key = key;
          p.complete = true;
          this.index.set(key, n);
        }
      }
    });
    row.computed = true;
  }
  release(r) {
    const row = this.requests[r];
    if (!row) throw Error('Unknown/already released request');
    delete this.requests[r];
    row.table.forEach(n => {
      const p = this.pages[n];
      p.owners = p.owners.filter(x => x !== r);
      if (!p.owners.length) {
        if (p.complete) this.inactive.push(n);else this.reclaim(n);
      }
    });
  }
  invariant() {
    const groups = [new Set(this.free), new Set(this.inactive)];
    if (groups[0].size !== this.free.length || groups[1].size !== this.inactive.length) throw Error('Duplicate pool entry');
    for (const p of this.pages) {
      const owners = Object.entries(this.requests).filter(([, r]) => r.table.includes(p.id)).map(([r]) => r).sort();
      if (JSON.stringify(owners) !== JSON.stringify(p.owners) || Number(groups[0].has(p.id)) + Number(groups[1].has(p.id)) + Number(!!owners.length) !== 1) throw Error('Ownership invariant');
    }
    return true;
  }
}
export function lifecycle() {
  const store = new Store(5),
    events = [];
  const save = label => events.push({
    label,
    ...store.snapshot()
  });
  save('Initial free pool');
  store.admit('A', requests.A);
  save('A reserves three pages');
  store.complete('A');
  save('A completes K/V');
  store.admit('B', requests.B);
  save('B acquires shared pages');
  store.complete('B');
  save('B completes private tail');
  store.release('A');
  save('A releases');
  store.release('B');
  save('B releases');
  store.admit('C', requests.A);
  save('C reacquires A prefix');
  return events;
}
export function admission(capacity = 4, pin = true) {
  const s = new Store(capacity);
  s.admit('A', requests.A);
  s.complete('A');
  if (!pin) s.release('A');
  const before = s.snapshot(),
    tokens = [1, 2, 3, 4, 20, 21, 22, 23, 24, 25, 26, 27, 28],
    plan = s.admit('C', tokens),
    after = s.snapshot();
  s.invariant();
  return {
    before,
    after,
    plan,
    tokens,
    unchanged: JSON.stringify(before) === JSON.stringify(after)
  };
}
export function trace(order = ['A', 'C', 'B'], capacity = 4) {
  const s = new Store(capacity),
    events = [],
    decisions = [];
  let reused = 0,
    requested = 0,
    hits = 0;
  for (const [i, name] of order.entries()) {
    const request = name + i,
      tokens = requests[name];
    const plan = s.admit(request, tokens);
    decisions.push({
      name,
      ...plan
    });
    events.push({
      label: `${name} admission`,
      ...s.snapshot(),
      plan
    });
    requested += tokens.length;
    if (plan.accepted) {
      reused += plan.reused_rows;
      hits += Number(plan.reused_rows > 0);
      s.complete(request);
      events.push({
        label: `${name} complete`,
        ...s.snapshot(),
        plan
      });
      s.release(request);
      events.push({
        label: `${name} release`,
        ...s.snapshot(),
        plan
      });
    }
    s.invariant();
  }
  return {
    events,
    decisions,
    reused,
    requested,
    hits,
    count: order.length,
    newQueries: requested - reused
  };
}
export async function hashChain(tokens, page = 4, space = namespace, collision = false) {
  ids(tokens);
  integer(page, 1);
  const encoder = new TextEncoder(),
    uint = n => {
      const bytes = new Uint8Array(4);
      new DataView(bytes.buffer).setUint32(0, n, true);
      return bytes;
    };
  const cat = (...arrays) => {
    const result = new Uint8Array(arrays.reduce((n, a) => n + a.length, 0));
    let offset = 0;
    arrays.forEach(a => {
      result.set(a, offset);
      offset += a.length;
    });
    return result;
  };
  const digest = async bytes => collision ? new Uint8Array([0]) : new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const ns = encoder.encode(JSON.stringify(Object.fromEntries(Object.entries(space).sort())));
  let parent = await digest(cat(uint(ns.length), ns));
  const entries = [];
  for (let end = page; end <= tokens.length; end += page) {
    const block = tokens.slice(end - page, end);
    const input = cat(uint(parent.length), parent, uint(block.length), ...block.map(uint));
    parent = await digest(input);
    entries.push({
      block,
      prefix: tokens.slice(0, end),
      digest: [...parent].map(x => x.toString(16).padStart(2, '0')).join(''),
      exact: exact(tokens.slice(0, end), space)
    });
  }
  return entries;
}
export class Radix {
  constructor() {
    this.next = 1;
    this.clock = 0;
    this.root = {
      id: 0,
      edge: [],
      parent: null,
      children: [],
      pins: 0,
      last: 0
    };
    this.active = {};
  }
  touch(n) {
    n.last = ++this.clock;
  }
  node(edge, parent) {
    return {
      id: this.next++,
      edge: [...edge],
      parent,
      children: [],
      pins: 0,
      last: 0
    };
  }
  insert(tokens) {
    ids(tokens);
    let n = this.root,
      left = [...tokens];
    while (left.length) {
      const child = n.children.find(c => c.edge[0] === left[0]);
      if (!child) {
        const fresh = this.node(left, n);
        n.children.push(fresh);
        this.touch(fresh);
        return fresh;
      }
      const k = common(left, child.edge);
      if (k < child.edge.length) {
        const mid = this.node(child.edge.slice(0, k), n);
        mid.pins = child.pins;
        mid.last = child.last;
        n.children[n.children.indexOf(child)] = mid;
        child.edge = child.edge.slice(k);
        child.parent = mid;
        mid.children.push(child);
        n = mid;
      } else n = child;
      this.touch(n);
      left = left.slice(k);
    }
    return n;
  }
  nodes() {
    const out = [];
    const walk = n => {
      out.push(n);
      n.children.forEach(walk);
    };
    walk(this.root);
    return out;
  }
  pin(r, tokens) {
    if (this.active[r]) throw Error('Duplicate path owner');
    const n = this.insert(tokens);
    this.active[r] = n;
    for (let p = n; p !== this.root; p = p.parent) {
      p.pins++;
      this.touch(p);
    }
    return n;
  }
  unpin(r) {
    const n = this.active[r];
    if (!n) throw Error('Unknown path');
    for (let p = n; p !== this.root; p = p.parent) {
      p.pins--;
      this.touch(p);
    }
    delete this.active[r];
  }
  evict() {
    const candidates = this.nodes().filter(n => n.id !== 0 && !n.children.length && !n.pins).sort((a, b) => a.last - b.last);
    if (!candidates.length) return null;
    const n = candidates[0];
    n.parent.children = n.parent.children.filter(x => x !== n);
    return {
      id: n.id,
      edge: n.edge
    };
  }
  snapshot() {
    return this.nodes().map(n => ({
      id: n.id,
      edge: n.edge,
      parent: n.parent?.id ?? null,
      children: n.children.map(c => c.id),
      pins: n.pins,
      last: n.last
    }));
  }
}
export function radixFixture(third = [1, 2, 8], pin = false, evictions = 0, all = false) {
  const r = new Radix();
  if (pin) r.pin('A', [1, 2, 3, 4, 5]);else r.insert([1, 2, 3, 4, 5]);
  r.insert([1, 2, 3, 9]);
  r.insert(third);
  if (all) {
    r.pin('B', [1, 2, 3, 9]);
    if (third.length) r.pin('C', third);
  }
  const removed = [];
  for (let i = 0; i < evictions; i++) {
    const n = r.evict();
    if (!n) {
      removed.push(null);
      break;
    }
    removed.push(n);
  }
  return {
    nodes: r.snapshot(),
    removed
  };
}
export function costs(hits = 1, storageCents = 0) {
  integer(hits);
  integer(storageCents);
  const write = 125,
    normal = 100,
    hit = 10,
    overhead = write - normal + storageCents,
    benefit = normal - hit;
  return {
    cached: (write + hits * hit + storageCents) / 100,
    normal: (hits + 1) * normal / 100,
    saving: (hits * benefit - overhead) / 100,
    tieOrBetter: Math.max(0, Math.ceil(overhead / benefit)),
    strict: Math.max(0, Math.floor(overhead / benefit) + 1)
  };
}
export function route(wait) {
  if (!Number.isFinite(wait) || wait < 0) throw Error('Nonnegative wait');
  return {
    warm: wait + 4,
    cold: 12,
    choice: wait < 8 ? 'warm' : wait === 8 ? 'tie' : 'cold'
  };
}
