// Small deterministic teaching models. Retained neural observations load separately.
export const policies = {
  overlap: { p: [0.2, 0.5, 0.3], q: [0.5, 0.3, 0.2] },
  equal: { p: [0.2, 0.5, 0.3], q: [0.2, 0.5, 0.3] },
  disjoint: { p: [0, 0.6, 0.4], q: [1, 0, 0] },
  targetOnly: { p: [0.3, 0.2, 0.5], q: [0, 0.6, 0.4] },
};
export function distribution(row) {
  const total = row.reduce((a, b) => a + b, 0);
  if (!row.length || row.some((x) => !Number.isFinite(x) || x < 0) || Math.abs(total - 1) > 1e-12)
    throw Error('Use a finite nonnegative probability row summing to one.');
  return row.map((x) => x / total);
}
export function mass(p0, q0) {
  const p = distribution(p0),
    q = distribution(q0);
  if (p.length !== q.length) throw Error('Vocabulary sizes must agree.');
  const common = p.map((x, i) => Math.min(x, q[i]));
  const excess = q.map((x, i) => Math.max(0, x - p[i]));
  const deficit = p.map((x, i) => Math.max(0, x - q[i]));
  const rejected = deficit.reduce((a, b) => a + b, 0);
  return {
    p,
    q,
    common,
    excess,
    deficit,
    rejected,
    overlap: common.reduce((a, b) => a + b, 0),
    repair: rejected === 0 ? null : deficit.map((x) => x / rejected),
    final: common.map((x, i) => x + deficit[i]),
  };
}
export function threshold(p, q, id) {
  if (q[id] === 0) return null;
  return Math.min(1, p[id] / q[id]);
}
export function sample(row, u) {
  const p = distribution(row);
  if (!Number.isFinite(u) || u < 0 || u >= 1) throw Error('Uniform must be in [0, 1).');
  const support = p.map((v, i) => (v > 0 ? i : -1)).filter((i) => i >= 0);
  let cumulative = 0;
  for (const id of support.slice(0, -1)) {
    cumulative += p[id];
    if (u < cumulative) return id;
  }
  return support.at(-1);
}
export function firstRejection(secondUniform = 0.6) {
  const ids = [1, 0, 2],
    p = [0.5, 0.2, 0.3],
    q = [0.3, 0.5, 0.2];
  const uniforms = [0.2, secondUniform, 0.1];
  let rejectedAt = -1;
  const rows = ids.map((id, i) => {
    const alpha = Math.min(1, p[i] / q[i]);
    const tested = rejectedAt === -1;
    const accepted = tested && uniforms[i] < alpha;
    if (tested && !accepted) rejectedAt = i;
    return { id, p: p[i], q: q[i], alpha, uniform: uniforms[i], tested, accepted };
  });
  // Conditional rows are constructed specifically for this path. At the second
  // position the residual is [0, 2/3, 1/3]; repair uniform .8 selects C.
  const accepted = rejectedAt < 0 ? ids : ids.slice(0, rejectedAt);
  return {
    rows,
    rejectedAt,
    emitted: [...accepted, 2],
    ending: rejectedAt < 0 ? 'target bonus C' : 'repair C',
    acceptanceDraws: rejectedAt < 0 ? 3 : rejectedAt + 1,
  };
}
export function stopRound(mode = 'bonus', remaining = 4) {
  const drafted = Math.min(3, Math.max(0, remaining - 1));
  const candidates = [0, 1, 0].slice(0, drafted);
  let emitted, accepted, end;
  if (mode === 'acceptedEos' && drafted > 0) {
    candidates[Math.min(1, drafted - 1)] = 2;
    candidates.length = Math.min(2, drafted);
    accepted = candidates.length;
    emitted = [...candidates];
    end = 'accepted EOS';
  } else if (mode === 'repairEos' && drafted > 0) {
    accepted = Math.min(1, drafted - 1);
    emitted = [...candidates.slice(0, accepted), 2];
    end = 'repair EOS';
  } else {
    accepted = drafted;
    emitted = [...candidates, 1];
    end = drafted ? 'target bonus B' : 'ordinary target B';
  }
  return {
    candidates,
    proposed: candidates.length,
    accepted,
    emitted,
    end,
    targetScoreRows: candidates.length + 1,
    bonus: end.includes('bonus'),
  };
}
export function conditional(prefix, draft = false) {
  return !prefix.length
    ? draft
      ? [0.2, 0.6, 0.2]
      : [0.5, 0.3, 0.2]
    : prefix.at(-1) === 0
      ? draft
        ? [0.6, 0.3, 0.1]
        : [0.2, 0.5, 0.3]
      : draft
        ? [0.2, 0.5, 0.3]
        : [0.4, 0.1, 0.5];
}
const add = (map, path, value) => {
  const key = path.join(',');
  map.set(key, (map.get(key) ?? 0) + value);
};
export function roundLaw(prefix, remaining, lookahead, contributions = null) {
  let proposals = [{ ids: [], probability: 1 }];
  for (let step = 0; step < Math.min(lookahead, remaining - 1); step++) {
    proposals = proposals.flatMap((row) =>
      row.ids.at(-1) === 2
        ? [row]
        : conditional([...prefix, ...row.ids], true).map((p, id) => ({
            ids: [...row.ids, id],
            probability: row.probability * p,
          })),
    );
  }
  const output = new Map();
  for (const proposal of proposals) {
    const emit = (ids, probability, event) => {
      add(output, ids, probability);
      contributions?.push({
        proposal: proposal.ids,
        proposalMass: proposal.probability,
        ids,
        probability,
        event,
      });
    };
    const walk = (index, accepted, probability) => {
      if (accepted.at(-1) === 2) {
        emit(accepted, probability * proposal.probability, `${index} accepted, EOS`);
        return;
      }
      const p = conditional([...prefix, ...accepted]);
      if (index === proposal.ids.length) {
        p.forEach((v, id) =>
          emit(
            [...accepted, id],
            probability * proposal.probability * v,
            `${index} accepted, target bonus`,
          ),
        );
        return;
      }
      const q = conditional([...prefix, ...proposal.ids.slice(0, index)], true);
      const id = proposal.ids[index],
        alpha = threshold(p, q, id);
      if (alpha > 0) walk(index + 1, [...accepted, id], probability * alpha);
      if (alpha < 1)
        mass(p, q).repair.forEach((v, replacement) => {
          if (v > 0)
            emit(
              [...accepted, replacement],
              proposal.probability * probability * (1 - alpha) * v,
              `${index} accepted, reject position ${index + 1}, repair`,
            );
        });
    };
    walk(0, [], 1);
  }
  return output;
}
export function terminalLaw(lookahead = null, horizon = 3) {
  const terminal = new Map();
  const expand = (prefix, probability) => {
    if (prefix.length === horizon || prefix.at(-1) === 2) {
      add(terminal, prefix, probability);
      return;
    }
    const branches =
      lookahead === null
        ? new Map(conditional(prefix).map((p, i) => [String(i), p]))
        : roundLaw(prefix, horizon - prefix.length, lookahead);
    for (const [path, p] of branches)
      if (p > 0) expand([...prefix, ...path.split(',').map(Number)], probability * p);
  };
  expand([], 1);
  return [...terminal]
    .map(([key, probability]) => ({ ids: key.split(',').map(Number), probability }))
    .sort((a, b) => a.ids.join(',').localeCompare(b.ids.join(',')));
}
export function processed(weights, temperature = 1, topK = 3) {
  const scores = weights.map((x) => Math.pow(x, 1 / temperature));
  const retained = scores
    .map((x, i) => [x, i])
    .sort((a, b) => b[0] - a[0] || a[1] - b[1])
    .slice(0, topK)
    .map((x) => x[1]);
  const total = scores.reduce((sum, v, i) => sum + (retained.includes(i) ? v : 0), 0);
  return scores.map((v, i) => (retained.includes(i) ? v / total : 0));
}
export function lengthModel(alpha, k) {
  const tails = Array.from({ length: k }, (_, j) => alpha ** (j + 1));
  return {
    tails,
    accepted: tails.reduce((a, b) => a + b, 0),
    emitted: 1 + tails.reduce((a, b) => a + b, 0),
  };
}
export function costModel(alpha, k, draft, growth, overhead = 1, target = 10) {
  const length = lengthModel(alpha, k),
    verification = target + growth * k;
  const total = k * draft + verification + overhead;
  return {
    ...length,
    verification,
    draftTotal: k * draft,
    overhead,
    total,
    baseline: length.emitted * target,
    speedup: (length.emitted * target) / total,
  };
}
