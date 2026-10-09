export const PUMPS = Object.freeze([
  ['A', 2, true], ['B', 3, false], ['C', 4, true], ['D', 4, false],
  ['E', 6, true], ['F', 7, false], ['G', 8, true], ['H', 9, false],
].map(([id, time, event]) => Object.freeze({ id, time, event })));

export function observationsAt(cutoff, rows = PUMPS) {
  if (!Number.isFinite(cutoff) || cutoff < 0) throw new RangeError('Use a finite nonnegative observation cutoff.');
  return rows.map(row => ({ ...row, time: Math.min(row.time, cutoff), event: row.event && row.time <= cutoff }));
}

// Event-first tied accounting. Retain censor-only groups to expose their roster change.
export function kaplanMeier(rows = PUMPS) {
  const ordered = [...rows].sort((a, b) => a.time - b.time);
  let risk = ordered.length, survival = 1, greenwood = 0, nelsonAalen = 0;
  const groups = [];
  for (let i = 0; i < ordered.length;) {
    const time = ordered[i].time;
    const members = [];
    while (i < ordered.length && ordered[i].time === time) members.push(ordered[i++]);
    const deaths = members.filter(row => row.event).length;
    const before = survival;
    survival *= 1 - deaths / risk;
    nelsonAalen += deaths / risk;
    if (deaths > 0) greenwood = deaths === risk ? Infinity : greenwood + deaths / (risk * (risk - deaths));
    groups.push({ time, risk, deaths, censors: members.length - deaths, before, survival, greenwood, nelsonAalen, members });
    risk -= members.length;
  }
  return groups;
}

export function survivalAt(time, groups = kaplanMeier()) {
  let result = 1;
  for (const group of groups) { if (group.time > time) break; result = group.survival; }
  return result;
}

export function restrictedArea(tau, groups = kaplanMeier()) {
  if (!Number.isFinite(tau) || tau < 0 || (groups.length && tau > groups.at(-1).time))
    throw new RangeError('Use a horizon inside observed follow-up.');
  let start = 0, height = 1, area = 0;
  const rectangles = [];
  for (const group of [...groups, { time: tau }]) {
    const end = Math.min(group.time, tau);
    if (end > start) { rectangles.push({ start, end, height, area: (end - start) * height }); area += (end - start) * height; }
    if (group.time >= tau) break;
    start = group.time; height = group.survival;
  }
  return { area, rectangles };
}

export function logLogInterval(time, groups = kaplanMeier()) {
  const group = groups.filter(row => row.time <= time).at(-1);
  const survival = group?.survival ?? 1, greenwood = group?.greenwood ?? 0;
  if (!(survival > 0 && survival < 1) || !Number.isFinite(greenwood))
    return { survival, greenwood, available: false };
  const transformed = Math.log(-Math.log(survival));
  const standardError = Math.sqrt(greenwood) / Math.abs(Math.log(survival));
  const low = Math.exp(-Math.exp(transformed + 1.959963984540054 * standardError));
  const high = Math.exp(-Math.exp(transformed - 1.959963984540054 * standardError));
  return { survival, greenwood, transformed, standardError, low, high, available: true };
}

export function staircase(groups = kaplanMeier(), end = 9) {
  const points = [[0, 1]];
  for (const group of groups) { if (group.time > end) break; points.push([group.time, group.before], [group.time, group.survival]); }
  points.push([end, survivalAt(end, groups)]);
  return points;
}

export function retention(longChance) {
  if (!(longChance >= 0 && longChance <= 1)) throw new RangeError('Retention is a probability.');
  return { shortMass: .25, longMass: .5 * longChance, selectedLongShare: longChance / (longChance + .5) };
}
