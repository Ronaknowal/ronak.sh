// Browser counterparts of the frozen, complete queueing programs.
// Seconds and work units are illustrative inputs; no GPU measurement occurs.
export const requestColours = ['#78b5ff', '#ffc36b', '#be9bff', '#fb93b3', '#72d2df'];
export const requestFixture = [
  { id: 'A', arrival: 0, service: 3 },
  { id: 'B', arrival: 1, service: 1 },
  { id: 'C', arrival: 2, service: 2 },
  { id: 'D', arrival: 6, service: 1 },
];

function finite(value, name, minimum = 0) {
  if (!Number.isFinite(value) || value < minimum)
    throw new RangeError(`${name} must be finite and at least ${minimum}.`);
  return value;
}

function integer(value, name, minimum = 1) {
  finite(value, name, minimum);
  if (!Number.isInteger(value)) throw new RangeError(`${name} must be an integer.`);
  return value;
}

function chronological(rows) {
  let previous = -Infinity;
  const identities = new Set();
  for (const row of rows) {
    finite(row.arrival, 'Arrival');
    if (row.arrival < previous || !row.id || identities.has(row.id))
      throw new RangeError('Use distinct IDs and chronological arrivals.');
    previous = row.arrival;
    identities.add(row.id);
  }
}

export function tokenClocks(arrival, start, outputs) {
  finite(arrival, 'Arrival');
  finite(start, 'Start', arrival);
  let previous = start;
  for (const output of outputs) {
    finite(output, 'Output time', previous);
    previous = output;
  }
  const gaps = outputs.slice(1).map((time, i) => time - outputs[i]);
  return {
    arrival,
    start,
    outputs,
    gaps,
    wait: start - arrival,
    ttft: outputs.length ? outputs[0] - arrival : null,
    tpot: gaps.length ? gaps.reduce((sum, value) => sum + value, 0) / gaps.length : null,
    e2e: outputs.length ? outputs.at(-1) - arrival : null,
  };
}

export function fcfs(requests = requestFixture) {
  chronological(requests);
  let previous = 0;
  return requests.map((request) => {
    finite(request.service, 'Service');
    const start = Math.max(request.arrival, previous);
    const departure = start + request.service;
    const row = {
      ...request,
      start,
      departure,
      wait: start - request.arrival,
      response: departure - request.arrival,
      idleBefore: Math.max(0, request.arrival - previous),
    };
    previous = departure;
    return row;
  });
}

export function occupancy(intervals, left, right) {
  finite(left, 'Left boundary');
  finite(right, 'Right boundary', left);
  const deltas = new Map([
    [left, 0],
    [right, 0],
  ]);
  const contributions = intervals.map(({ id, start, end }) => {
    finite(start, 'Interval start');
    finite(end, 'Interval end', start);
    const a = Math.min(right, Math.max(left, start));
    const b = Math.max(a, Math.min(right, end));
    const length = Math.max(0, b - a);
    if (length) {
      deltas.set(a, (deltas.get(a) ?? 0) + 1);
      deltas.set(b, (deltas.get(b) ?? 0) - 1);
    }
    return { id, start: a, end: b, area: length };
  });
  const times = [...deltas.keys()].sort((a, b) => a - b);
  const segments = [];
  let count = 0;
  let area = 0;
  for (let index = 0; index < times.length - 1; index++) {
    count += deltas.get(times[index]);
    const end = times[index + 1];
    const segmentArea = count * (end - times[index]);
    segments.push({ start: times[index], end, count, area: segmentArea });
    area += segmentArea;
  }
  const intervalArea = contributions.reduce((sum, row) => sum + row.area, 0);
  if (Math.abs(area - intervalArea) > 1e-9) throw new Error('Sweep and interval areas disagree.');
  return {
    left,
    right,
    segments,
    contributions,
    area,
    intervalArea,
    average: right > left ? area / (right - left) : null,
  };
}

export function queueAreas(
  rows,
  left = 0,
  right = Math.max(0, ...rows.map((row) => row.departure)),
) {
  return {
    system: occupancy(
      rows.map((row) => ({ id: row.id, start: row.arrival, end: row.departure })),
      left,
      right,
    ),
    queue: occupancy(
      rows.map((row) => ({ id: row.id, start: row.arrival, end: row.start })),
      left,
      right,
    ),
  };
}

export function arrivalDiagnostics(times, width = 2, horizon = 10) {
  integer(width, 'Bin width');
  finite(horizon, 'Horizon', Number.MIN_VALUE);
  let previous = -Infinity;
  for (const time of times) {
    finite(time, 'Arrival');
    if (time < previous)
      throw new RangeError('Arrival timestamps must retain chronological order.');
    previous = time;
  }
  const gaps = times.slice(1).map((time, index) => time - times[index]);
  const mean = gaps.length ? gaps.reduce((sum, value) => sum + value, 0) / gaps.length : null;
  const variance =
    mean !== null ? gaps.reduce((sum, gap) => sum + (gap - mean) ** 2, 0) / gaps.length : null;
  const bins = Array.from({ length: Math.ceil(horizon / width) }, (_, index) => ({
    left: index * width,
    right: Math.min(horizon, (index + 1) * width),
    count: 0,
  }));
  for (const time of times) if (time < horizon) bins[Math.floor(time / width)].count++;
  return {
    times,
    gaps,
    meanGap: mean,
    gapVariance: variance,
    caSquared: mean > 0 ? variance / mean ** 2 : null,
    bins,
  };
}

export function clientArrivals(service = 1, count = 8, concurrency = 2) {
  finite(service, 'Service', Number.MIN_VALUE);
  integer(count, 'Requests');
  integer(concurrency, 'Concurrency');
  const open = Array.from({ length: count }, (_, index) => ({
    id: String(index + 1),
    arrival: index * 0.5,
    service,
  }));
  // Each closed client replaces its own completed request immediately.
  const clients = Array(concurrency).fill(0);
  const closed = [];
  for (let index = 0; index < count; index++) {
    const earliest = Math.min(...clients);
    const client = clients.indexOf(earliest);
    closed.push({ id: String(index + 1), arrival: earliest, service, client });
    clients[client] += service;
  }
  return { open, closed };
}

export function mm1(lambda, mu, probability = 0.99) {
  finite(lambda, 'Arrival rate');
  finite(mu, 'Service rate', Number.MIN_VALUE);
  finite(probability, 'Quantile probability');
  if (probability > 1) throw new RangeError('Probability must be at most one.');
  const rho = lambda / mu;
  if (rho >= 1) return { rho, stable: false };
  const rate = mu - lambda;
  return {
    rho,
    stable: true,
    rate,
    meanService: 1 / mu,
    meanResponse: 1 / rate,
    meanWait: rho / rate,
    population: rho / (1 - rho),
    queuePopulation: rho ** 2 / (1 - rho),
    waitAtom: 1 - rho,
    responseQuantile: probability === 1 ? Infinity : -Math.log1p(-probability) / rate,
    waitQuantile:
      probability <= 1 - rho
        ? 0
        : probability === 1
          ? Infinity
          : Math.log(rho / (1 - probability)) / rate,
    probabilities: Array.from({ length: 9 }, (_, n) => (1 - rho) * rho ** n),
    omittedTail: rho ** 9,
  };
}

export function survival(lambda, mu, time) {
  const model = mm1(lambda, mu);
  finite(time, 'Time');
  return model.stable
    ? { response: Math.exp(-model.rate * time), wait: model.rho * Math.exp(-model.rate * time) }
    : { response: null, wait: null };
}

export const serviceDistributions = {
  constant: { mean: 1, secondMoment: 1, support: [{ duration: 1, probability: 1 }] },
  exponential: { mean: 1, secondMoment: 2, support: null },
  mixture: {
    mean: 1,
    secondMoment: 3.25,
    support: [
      { duration: 0.5, probability: 0.9 },
      { duration: 5.5, probability: 0.1 },
    ],
  },
};

export function pk(lambda, distribution = 'mixture') {
  finite(lambda, 'Arrival rate');
  const source = serviceDistributions[distribution];
  if (!source) throw new RangeError('Choose a named service distribution.');
  const rho = lambda * source.mean;
  const residualMean = source.secondMoment / (2 * source.mean);
  const wait = rho < 1 ? (lambda * source.secondMoment) / (2 * (1 - rho)) : null;
  return {
    ...source,
    distribution,
    rho,
    residualMean,
    csSquared: source.secondMoment / source.mean ** 2 - 1,
    meanWait: wait,
    meanResponse: wait === null ? null : wait + source.mean,
  };
}

export function kingman(caSquared, csSquared, rho, meanService, renewal = true) {
  finite(caSquared, 'Arrival squared CV');
  finite(csSquared, 'Service squared CV');
  finite(rho, 'Load');
  finite(meanService, 'Mean service', Number.MIN_VALUE);
  const variability = (caSquared + csSquared) / 2;
  const loadMultiplier = rho < 1 ? rho / (1 - rho) : null;
  return {
    variability,
    loadMultiplier,
    applicable: renewal && rho < 1,
    estimate: renewal && rho < 1 ? variability * loadMultiplier * meanService : null,
  };
}

export function processorSharing(requests, capacity = 1) {
  chronological(requests);
  finite(capacity, 'Capacity', Number.MIN_VALUE);
  const rows = requests.map((row) => ({
    ...row,
    remaining: finite(row.service, 'Work'),
    departure: row.service === 0 ? row.arrival : null,
  }));
  let index = 0;
  let time = 0;
  let active = [];
  const segments = [];
  let events = 0;
  while (index < rows.length || active.length) {
    if (++events > 2 * rows.length + 1) throw new Error('PS event progress failed.');
    if (!active.length) time = Math.max(time, rows[index].arrival);
    while (index < rows.length && rows[index].arrival <= time) {
      if (rows[index].remaining > 0) active.push(index);
      index++;
    }
    if (!active.length) continue;
    const share = capacity / active.length;
    const minimum = Math.min(...active.map((job) => rows[job].remaining));
    const completing = active.filter((job) => rows[job].remaining === minimum);
    const completionDelta = minimum / share;
    const arrivalDelta = index < rows.length ? rows[index].arrival - time : Infinity;
    const elapsed = Math.min(completionDelta, arrivalDelta);
    const end = time + elapsed;
    const contributions = active.map((job) => ({
      id: rows[job].id,
      before: rows[job].remaining,
      attainedBefore: rows[job].service - rows[job].remaining,
      rate: share,
    }));
    for (const job of active)
      rows[job].remaining = Math.max(0, rows[job].remaining - share * elapsed);
    if (completionDelta <= arrivalDelta) {
      for (const job of completing) {
        rows[job].remaining = 0;
        rows[job].departure = end;
      }
      active = active.filter((job) => !completing.includes(job));
    }
    segments.push({ start: time, end, elapsedOperand: elapsed, contributions });
    time = end;
  }
  return {
    rows: rows.map((row) => ({ ...row, response: row.departure - row.arrival })),
    segments,
    work: rows.reduce((sum, row) => sum + row.service, 0),
    capacity,
  };
}

export function pooledQueue(requests, servers = 2, assignments = null, speed = 1) {
  chronological(requests);
  integer(servers, 'Servers');
  finite(speed, 'Speed', Number.MIN_VALUE);
  const free = Array(servers).fill(0);
  return requests.map((request, index) => {
    finite(request.service, 'Service');
    const server = assignments ? assignments[index] : free.indexOf(Math.min(...free));
    if (!Number.isInteger(server) || server < 0 || server >= servers)
      throw new RangeError('Invalid worker assignment.');
    const start = Math.max(request.arrival, free[server]);
    const departure = start + request.service / speed;
    free[server] = departure;
    return {
      ...request,
      server,
      start,
      departure,
      wait: start - request.arrival,
      response: departure - request.arrival,
    };
  });
}

export function erlangC(lambda, mu, servers) {
  finite(lambda, 'Arrival rate');
  finite(mu, 'Service rate', Number.MIN_VALUE);
  integer(servers, 'Servers');
  const offered = lambda / mu;
  const rho = offered / servers;
  if (rho >= 1) return { rho, stable: false };
  let blocking = 1;
  for (let n = 1; n <= servers; n++) blocking = (offered * blocking) / (n + offered * blocking);
  const waiting = blocking / (1 - rho + rho * blocking);
  const meanWait = waiting / (servers * mu - lambda);
  const weights = [1];
  for (let n = 1; n <= Math.max(9, servers); n++)
    weights.push((weights.at(-1) * offered) / Math.min(n, servers));
  const normalizer =
    weights.slice(0, servers).reduce((sum, value) => sum + value, 0) + weights[servers] / (1 - rho);
  const probabilities = weights.slice(0, 9).map((value) => value / normalizer);
  const omittedTail = Math.max(0, 1 - probabilities.reduce((sum, value) => sum + value, 0));
  return {
    rho,
    stable: true,
    probabilityWait: waiting,
    meanWait,
    meanResponse: meanWait + 1 / mu,
    probabilities,
    omittedTail,
  };
}

export function finiteQueue(lambda, mu, capacity) {
  finite(lambda, 'Arrival rate');
  finite(mu, 'Service rate', Number.MIN_VALUE);
  integer(capacity, 'Resident capacity');
  const rho = lambda / mu;
  const logs = Array.from({ length: capacity + 1 }, (_, n) =>
    rho === 0 ? (n === 0 ? 0 : -Infinity) : n * Math.log(rho),
  );
  const max = Math.max(...logs);
  const weights = logs.map((value) => Math.exp(value - max));
  const sum = weights.reduce((total, value) => total + value, 0);
  const probabilities = weights.map((weight) => weight / sum);
  const population = probabilities.reduce((total, value, n) => total + n * value, 0);
  const admittedRate = mu * (1 - probabilities[0]);
  return {
    rho,
    probabilities,
    population,
    blocking: probabilities.at(-1),
    admittedRate,
    response: admittedRate > 0 ? population / admittedRate : null,
  };
}

export const defaultTokenRequests = [
  { id: 'A', arrival: 0, prompt: 9, outputTarget: 3 },
  { id: 'B', arrival: 0.01, prompt: 4, outputTarget: 2 },
  { id: 'C', arrival: 0.04, prompt: 3, outputTarget: 1 },
];

export function tokenSchedule({
  requests = defaultTokenRequests,
  budget = 4,
  sequences = 3,
  blocks = 8,
  blockSize = 4,
  chunked = true,
} = {}) {
  for (const [name, value] of Object.entries({ budget, sequences, blocks, blockSize }))
    integer(value, name);
  chronological(requests);
  const rows = requests.map((request) => {
    integer(request.prompt, 'Prompt');
    integer(request.outputTarget, 'Output target', 0);
    return {
      ...request,
      status: 'not-arrived',
      admitted: null,
      processedPrompt: 0,
      generated: 0,
      decodeInputs: 0,
      reserved: Math.ceil((request.prompt + Math.max(0, request.outputTarget - 1)) / blockSize),
      committed: 0,
      outputs: [],
      finish: null,
    };
  });
  let active = [];
  const waiting = [];
  let index = 0;
  let time = 0;
  const iterations = [];
  while (index < rows.length || active.length || waiting.length) {
    if (iterations.length > 10000) throw new Error('Token scheduler iteration guard.');
    if (!active.length && !waiting.length && index < rows.length)
      time = Math.max(time, rows[index].arrival);
    while (index < rows.length && rows[index].arrival <= time) {
      const row = rows[index];
      if (!row.outputTarget) {
        row.status = 'zero-output-canceled';
        row.finish = row.arrival;
      } else if (row.reserved > blocks) row.status = 'rejected-unfit-peak';
      else if (!chunked && row.prompt > budget) row.status = 'rejected-unfit-full-prefill-budget';
      else {
        row.status = 'waiting';
        waiting.push(index);
      }
      index++;
    }
    while (waiting.length && active.length < sequences) {
      const reserved = active.reduce((sum, job) => sum + rows[job].reserved, 0);
      if (reserved + rows[waiting[0]].reserved > blocks) break;
      const job = waiting.shift();
      rows[job].status = 'active';
      rows[job].admitted = time;
      active.push(job);
    }
    if (!active.length) {
      if (waiting.length) throw new Error('No active work can free memory.');
      continue;
    }
    let unused = budget;
    const operations = [];
    for (const job of active) {
      const row = rows[job];
      if (row.processedPrompt === row.prompt && unused > 0) {
        operations.push({
          job,
          id: row.id,
          phase: 'decode',
          inputs: 1,
          context: row.prompt + row.decodeInputs + 1,
        });
        unused--;
      }
    }
    for (const job of active) {
      const row = rows[job];
      const unfinished = row.prompt - row.processedPrompt;
      if (!unfinished || unused <= 0) continue;
      const amount = chunked ? Math.min(unfinished, unused) : unfinished;
      if (amount > unused) continue;
      operations.push({ job, id: row.id, phase: 'prefill', inputs: amount, context: 0 });
      unused -= amount;
    }
    if (!operations.length) throw new Error('No schedulable admitted work.');
    const prefill = operations
      .filter((op) => op.phase === 'prefill')
      .reduce((sum, op) => sum + op.inputs, 0);
    const decode = operations.filter((op) => op.phase === 'decode').length;
    const context = operations.reduce((sum, op) => sum + op.context, 0);
    const duration = 0.02 + 0.005 * prefill + 0.01 * decode + 0.0001 * context;
    const end = time + duration;
    const reservedBefore = Object.fromEntries(
      active.map((job) => [rows[job].id, rows[job].reserved]),
    );
    const committedBefore = Object.fromEntries(
      active.map((job) => [rows[job].id, rows[job].committed]),
    );
    const emitted = [];
    for (const op of operations) {
      const row = rows[op.job];
      if (op.phase === 'prefill') row.processedPrompt += op.inputs;
      else row.decodeInputs++;
      if (op.phase === 'decode' || row.processedPrompt === row.prompt) {
        row.generated++;
        row.outputs.push(end);
        emitted.push(row.id);
      }
      row.committed = Math.ceil((row.processedPrompt + row.decodeInputs) / blockSize);
    }
    const committedAfter = Object.fromEntries(
      active.map((job) => [rows[job].id, rows[job].committed]),
    );
    const finished = active.filter((job) => rows[job].generated === rows[job].outputTarget);
    for (const job of finished) {
      rows[job].status = 'completed';
      rows[job].finish = end;
    }
    active = active.filter((job) => !finished.includes(job));
    iterations.push({
      index: iterations.length,
      start: time,
      end,
      duration,
      operations,
      prefill,
      decode,
      context,
      unused,
      reservedBefore,
      committedBefore,
      committedAfter,
      emitted,
      released: finished.map((job) => rows[job].id),
    });
    time = end;
  }
  return {
    rows: rows.map((row) => ({
      ...row,
      ...tokenClocks(row.arrival, row.admitted ?? row.arrival, row.outputs),
      e2e: row.status === 'completed' ? row.finish - row.arrival : null,
    })),
    iterations,
    budget,
    sequences,
    blocks,
    blockSize,
    chunked,
  };
}

export function deadlineTrace(requests, honorWaiting = true, cancelRunning = false) {
  chronological(requests);
  let previous = 0;
  const rows = requests.map((row) => {
    finite(row.service, 'Service');
    finite(row.deadline, 'Deadline', row.arrival);
    const start = Math.max(row.arrival, previous);
    if ((honorWaiting || cancelRunning) && start >= row.deadline)
      return {
        ...row,
        start: null,
        finish: row.deadline,
        work: 0,
        status: 'canceled-before-start',
      };
    const fullFinish = start + row.service;
    const finish = cancelRunning ? Math.min(fullFinish, row.deadline) : fullFinish;
    previous = finish;
    return {
      ...row,
      start,
      finish,
      work: finish - start,
      status:
        finish < fullFinish
          ? 'canceled-in-service'
          : finish <= row.deadline
            ? 'completed-in-time'
            : 'completed-after-deadline',
    };
  });
  return { rows, work: rows.reduce((sum, row) => sum + row.work, 0) };
}

export function routeWork(left = [8], right = [1, 1], newWork = 2, policy = 'count') {
  const work = [left, right].map((queue) =>
    queue.reduce((sum, value) => sum + finite(value, 'Queued work'), 0),
  );
  const counts = [left.length, right.length];
  const metric = policy === 'count' ? counts : work;
  const selected = metric[0] <= metric[1] ? 0 : 1;
  return {
    queues: [left, right],
    work,
    counts,
    selected,
    response: work[selected] + finite(newWork, 'New work'),
    newWork,
  };
}

export function delayedCapacity(delay = 5, initial = 2) {
  finite(delay, 'Startup delay');
  integer(initial, 'Initial workers');
  const ready = 10 + delay;
  const events = Array.from({ length: 30 }, (_, index) => ({
    time: 10 + index / 3,
    kind: 'arrival',
    job: index,
    priority: 1,
    serial: index,
  }));
  events.push({ time: ready, kind: 'ready', server: initial, priority: 0, serial: 30 });
  let serial = 31;
  const idle = Array.from({ length: initial }, (_, index) => index);
  const waiting = [];
  const rows = Array.from({ length: 30 }, (_, index) => ({
    id: `burst-${index}`,
    arrival: 10 + index / 3,
    start: null,
    departure: null,
  }));
  const history = [];
  let installed = initial;
  let running = 0;
  while (events.length) {
    events.sort((a, b) => a.time - b.time || a.priority - b.priority || a.serial - b.serial);
    const event = events.shift();
    if (event.kind === 'ready') {
      installed++;
      idle.push(event.server);
    } else if (event.kind === 'arrival') waiting.push(event.job);
    else {
      rows[event.job].departure = event.time;
      idle.push(event.server);
      running--;
    }
    idle.sort((a, b) => a - b);
    while (idle.length && waiting.length) {
      const job = waiting.shift();
      const server = idle.shift();
      rows[job].start = event.time;
      rows[job].server = server;
      running++;
      events.push({
        time: event.time + 1,
        priority: 0,
        serial: serial++,
        kind: 'departure',
        job,
        server,
      });
    }
    history.push({
      time: event.time,
      event: event.kind,
      installed,
      pending: event.time < ready ? 1 : 0,
      waiting: waiting.length,
      running,
    });
  }
  const drain = Math.max(...rows.map((row) => row.departure));
  return {
    ready,
    rows,
    history,
    drain,
    area: occupancy(
      rows.map((row) => ({ id: row.id, start: row.arrival, end: row.start })),
      0,
      Math.max(ready, drain),
    ).area,
  };
}

export function quantile(values, probability = 0.99) {
  finite(probability, 'Probability');
  if (probability > 1) throw new RangeError('Probability is at most one.');
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = probability * (sorted.length - 1);
  const left = Math.floor(index);
  return sorted[left] + (index - left) * (sorted[Math.ceil(index)] - sorted[left]);
}

export function cumulativeBuckets(values, edges) {
  return edges.map((edge) => values.filter((value) => value <= edge).length);
}

export function histogramQuantile(counts, edges, probability = 0.99) {
  if (!counts.length || counts.length !== edges.length || !counts.at(-1)) return null;
  const target = probability * counts.at(-1);
  let previousCount = 0;
  let previousEdge = 0;
  for (let index = 0; index < edges.length; index++) {
    if (counts[index] < previousCount || edges[index] <= previousEdge)
      throw new RangeError('Compatible increasing edges and cumulative counts required.');
    if (counts[index] >= target)
      return Number.isFinite(edges[index]) && counts[index] > previousCount
        ? previousEdge +
            ((edges[index] - previousEdge) * (target - previousCount)) /
              (counts[index] - previousCount)
        : null;
    previousCount = counts[index];
    previousEdge = edges[index];
  }
  return null;
}

export function parseAzureCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(',');
  let origin = null;
  return lines.map((line) => {
    const cells = line.split(',');
    const source = Object.fromEntries(headers.map((header, i) => [header, cells[i]]));
    const [whole, fraction] = source.TIMESTAMP.split('.');
    const milliseconds = Date.parse(whole.replace(' ', 'T') + 'Z');
    const micros =
      BigInt(milliseconds) * 1000n + BigInt((fraction ?? '').padEnd(6, '0').slice(0, 6));
    origin ??= micros;
    return {
      ...source,
      source_row: Number(source.source_row),
      arrival: Number(micros - origin) / 1e6,
      input: Number(source.ContextTokens),
      output: Number(source.GeneratedTokens),
    };
  });
}

export function retryTrace(policy = 'jitter', capacity = 2, delay = 0.4, jitterUniforms = [1, 1]) {
  if (!['none', 'synchronized', 'jitter'].includes(policy))
    throw new RangeError('Choose a retry policy.');
  integer(capacity, 'Resident capacity', 0);
  finite(delay, 'Retry delay');
  const logical = ['A', 'B', 'C', 'D'].map((id) => ({
    id,
    attempts: [],
    outcome: null,
    deadline: 2,
  }));
  const events = logical.map((row, job) => ({
    time: 0,
    kind: 'offer',
    job,
    number: 1,
    priority: 1,
    serial: job,
  }));
  const waiting = [];
  const attempts = [];
  let running = null;
  let serial = 4;
  let jitterIndex = 0;
  const start = (time) => {
    while (running === null && waiting.length) {
      const index = waiting.shift();
      const attempt = attempts[index];
      if (time >= 2) {
        attempt.status = 'expired-waiting';
        attempt.finish = 2;
        logical[attempt.job].outcome = 'deadline-expired';
        continue;
      }
      attempt.status = 'running';
      attempt.start = time;
      running = index;
      events.push({
        time: time + 0.3,
        kind: 'complete',
        attempt: index,
        priority: 0,
        serial: serial++,
      });
    }
  };
  while (events.length) {
    events.sort((a, b) => a.time - b.time || a.priority - b.priority || a.serial - b.serial);
    const event = events.shift();
    if (event.kind === 'complete') {
      const attempt = attempts[event.attempt];
      attempt.status = 'completed';
      attempt.finish = event.time;
      logical[attempt.job].outcome = event.time <= 2 ? 'success' : 'late-completion';
      running = null;
      start(event.time);
      continue;
    }
    const row = logical[event.job];
    const attempt = {
      id: `${row.id}-attempt-${event.number}`,
      logicalId: row.id,
      job: event.job,
      number: event.number,
      arrival: event.time,
      start: null,
      finish: null,
      parent: event.number > 1 ? `${row.id}-attempt-1` : null,
    };
    const index = attempts.length;
    attempts.push(attempt);
    row.attempts.push(attempt.id);
    if (event.time >= 2) {
      attempt.status = 'expired-before-offer';
      row.outcome = 'deadline-expired';
    } else if (waiting.length + Number(running !== null) >= capacity) {
      attempt.status = 'rejected';
      if (policy !== 'none' && event.number < 2) {
        const backoff =
          policy === 'synchronized'
            ? delay
            : delay * jitterUniforms[jitterIndex++ % jitterUniforms.length];
        attempt.nextRetry = event.time + backoff;
        events.push({
          time: attempt.nextRetry,
          kind: 'offer',
          job: event.job,
          number: 2,
          priority: 1,
          serial: serial++,
        });
      } else row.outcome = policy === 'none' ? 'rejected-no-retry' : 'rejected-at-cap';
    } else {
      attempt.status = 'waiting';
      waiting.push(index);
      start(event.time);
    }
  }
  return {
    logical,
    attempts,
    successes: logical.filter((row) => row.outcome === 'success').length,
    offered: attempts.length,
  };
}

export function sloCohort({ ttft = 0.5, gap = 0.3, e2e = 1, window = 2 } = {}) {
  for (const [key, value] of Object.entries({ ttft, gap, e2e, window })) finite(value, key);
  const records = [
    { id: 'A', admitted: true, status: 'completed', arrival: 0, outputs: [0.2, 0.4], finish: 0.4 },
    { id: 'B', admitted: true, status: 'completed', arrival: 0.1, outputs: [0.3], finish: 0.3 },
    { id: 'C', admitted: false, status: 'rejected', arrival: 0.2, outputs: [], finish: null },
    { id: 'D', admitted: true, status: 'canceled', arrival: 0.3, outputs: [], finish: 0.6 },
    { id: 'E', admitted: true, status: 'completed', arrival: 0.4, outputs: [1.5, 2], finish: 2 },
  ];
  const selected = records
    .filter((row) => row.arrival < window)
    .map((row) => {
      const completed = row.status === 'completed' && row.finish <= window;
      const observedOutputs = row.outputs.filter((time) => time <= window);
      const clocks = tokenClocks(row.arrival, row.arrival, observedOutputs);
      clocks.e2e = completed ? row.finish - row.arrival : null;
      const good =
        completed &&
        clocks.ttft <= ttft &&
        clocks.e2e <= e2e &&
        clocks.gaps.every((value) => value <= gap);
      return { ...row, clocks, completed, good };
    });
  const good = selected.filter((row) => row.good).length;
  const admitted = selected.filter((row) => row.admitted).length;
  const completed = selected.filter((row) => row.completed).length;
  return {
    records: selected,
    offered: selected.length,
    admitted,
    completed,
    good,
    offeredRate: window > 0 ? selected.length / window : null,
    goodput: window > 0 ? good / window : null,
    offeredFraction: selected.length ? good / selected.length : null,
    admittedFraction: admitted ? good / admitted : null,
  };
}

export function traceReplay(rows, stretch = 1, alpha = 0.0002, beta = 0.003) {
  finite(stretch, 'Arrival stretch', Number.MIN_VALUE);
  finite(alpha, 'Input coefficient');
  finite(beta, 'Output coefficient');
  const requests = rows.map((row, index) => ({
    id: String(row.source_row ?? index + 1),
    arrival: row.arrival * stretch,
    service: alpha * row.input + beta * row.output,
  }));
  const records = fcfs(requests);
  const responses = records.map((row) => row.response);
  const waits = records.map((row) => row.wait);
  return {
    records,
    meanResponse: responses.length ? responses.reduce((a, b) => a + b, 0) / responses.length : null,
    p99: quantile(responses),
    meanWait: waits.length ? waits.reduce((a, b) => a + b, 0) / waits.length : null,
  };
}

// The same supplied-sample controller as overload_controls.py. This is not a
// prediction of observations between samples or a measured production policy.
export function hysteresisTrace(startupDelay = 5) {
  finite(startupDelay, 'Startup delay');
  const samples = [
    [0, 0, 1],
    [10, 5, 2],
    [12, 6, 2],
    [15, 4, 2],
    [20, 0, 2],
    [25, 0, 1],
    [30, 0, 1],
  ];
  let installed = 2,
    pending = null,
    lowSince = null;
  return samples.map(([time, queue, busy]) => {
    const actions = [];
    if (pending !== null && time >= pending) {
      installed++;
      actions.push(`ready (clock ${pending})`);
      pending = null;
    }
    if (queue >= 4 && installed < 3 && pending === null) {
      pending = time + startupDelay;
      actions.push('request scale-out');
      if (startupDelay === 0) {
        installed++;
        pending = null;
        actions.push('ready now');
      }
    }
    if (queue <= 0) {
      lowSince ??= time;
      if (installed > 2 && pending === null && busy < installed && time - lowSince >= 10) {
        installed--;
        actions.push('remove idle server');
      }
    } else lowSince = null;
    return { time, queue, busy, installed, pending, lowSince, actions };
  });
}
