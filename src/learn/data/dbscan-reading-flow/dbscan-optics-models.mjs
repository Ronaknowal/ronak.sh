// Browser operations on accepted supplied states, never an estimator or old study.
// xiExtract is a JavaScript teaching translation of optics_xi_extraction.py,
// itself derived from scikit-learn 1.9.1's corrected Xi helper implementation.
// The complete upstream BSD notice is retained in optics-xi-browser-NOTICE.txt.
import { trailProvider, rankedSupport } from './dbscan-geometry-models.mjs';
const frozen = value => {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) frozen(child);
    Object.freeze(value);
  }
  return value;
};
export function suppliedGraph(order, heights, cores, parents, minimum = 2, cap = Infinity) {
  const n = order.length,
    reach = Array(n),
    core = Array(n),
    predecessor = Array(n);
  order.forEach((row, i) => {
    reach[row] = heights[i];
    core[row] = cores[i];
    predecessor[row] = parents[i];
  });
  const graph = {
    order: [...order],
    reach,
    core,
    predecessor,
    minimum,
    cap
  };
  validateGraph(graph);
  return frozen(graph);
}
export function validateGraph(graph) {
  const n = graph.order.length;
  if (!n || graph.order.some(x => !Number.isSafeInteger(x)) || [...graph.order].sort((a, b) => a - b).some((x, i) => x !== i)) throw Error('Ordering must permute input positions');
  if ([graph.reach, graph.core, graph.predecessor].some(x => x.length !== n)) throw Error('One graph entry per input row is required');
  if ([...graph.reach, ...graph.core].some(x => typeof x !== 'number' || Number.isNaN(x) || x < 0)) throw Error('Nonnegative graph distances are required; infinity is permitted');
  if (graph.predecessor.some(x => !Number.isSafeInteger(x) || x < -1 || x >= n)) throw Error('Predecessor must be an input position or −1');
}
export const trailGraph = suppliedGraph([0, 1, 2, 3, 8, 4, 5, 6, 7, 9], [Infinity, .75, .5, .5, 1, 1.25, .75, .5, .5, Infinity], [0, 1, 2, 3, 8, 4, 5, 6, 7, 9].map(row => rankedSupport(trailProvider, 4)[row].value <= 2 ? rankedSupport(trailProvider, 4)[row].value : Infinity), Array(10).fill(-1), 4, 2);
// The old retained output contains no predecessor vector. −1 above is a
// placeholder only; figures explicitly refuse to claim this field as evidence.
export const mainXiGraph = suppliedGraph([0, 3, 6, 10, 5, 1, 9, 8, 2, 7, 4], [Infinity, 10, 1, 1, 8, 1, 1, 10, 1, 1, 16], [10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 16], [-1, 0, 3, 6, 10, 5, 1, 9, 8, 2, 7]);
export const mainXiPositions = Object.freeze([0, 21, 33, 10, 50, 20, 11, 34, 32, 22, 12]);
export const rightXiGraph = suppliedGraph(Array.from({
  length: 11
}, (_, i) => i), [Infinity, 10, 1, 1, 8, 1, 1, 9, 12, 18, 30], [10, 1, 1, 1, 1, 1, 1, 9, 12, 18, 30], [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
export const outsideXiGraph = suppliedGraph(Array.from({
  length: 9
}, (_, i) => i), [Infinity, 1, 9, 1, 1, 1, 1, 1, 9.5], [1, 1, 1, 1, 1, 1, 1, 1, 9.5], [-1, 0, 1, 2, 2, 3, 4, 5, 1]);
export const earlierBorderGraph = suppliedGraph([0, 1, 2, 3], [Infinity, 3, 2, 1], [3, 2, 1, 2], [-1, 0, 1, 2], 3);
export function radiusExtraction(graph, eps) {
  validateGraph(graph);
  if (!Number.isFinite(eps) || eps <= 0) throw Error('Radius must be positive and finite');
  if (eps > graph.cap) throw Error('Extraction radius exceeds the construction cap');
  const labels = Array(graph.order.length).fill(-1),
    events = [];
  let group = -1;
  for (const row of graph.order) {
    const far = graph.reach[row] > eps,
      qualifies = graph.core[row] <= eps;
    if (far && qualifies) group++;
    if (!far || qualifies) labels[row] = group;
    events.push({
      row,
      far,
      qualifies,
      operation: far ? qualifies ? 'start group' : 'write noise' : 'join current group',
      labels: [...labels]
    });
  }
  return frozen({
    labels,
    events
  });
}
export function transitionFlags(heights, xi) {
  const c = 1 - xi,
    ratios = heights.slice(0, -1).map((x, i) => x / heights[i + 1]);
  return {
    ratios,
    down: ratios.map(x => x >= 1 / c),
    up: ratios.map(x => x <= c),
    downward: ratios.map(x => x > 1),
    upward: ratios.map(x => x < 1)
  };
}
export function extendRegion(steep, opposing, start, budget) {
  let cursor = start,
    last = start,
    consecutive = 0;
  const trace = [];
  while (cursor < steep.length) {
    let stop = false,
      reason;
    if (steep[cursor]) {
      consecutive = 0;
      last = cursor;
      reason = 'steep: reset run and retain endpoint';
    } else if (opposing[cursor]) {
      stop = true;
      reason = 'opposing direction: stop';
    } else {
      consecutive++;
      stop = consecutive > budget;
      reason = stop ? 'non-steep budget exceeded' : 'permitted non-steep edge';
    }
    trace.push({
      cursor,
      last,
      consecutive,
      stop,
      reason
    });
    if (stop) break;
    cursor++;
  }
  return frozen({
    last,
    trace
  });
}
export function xiExtract(graph, xi = .2, size = 3, correctPredecessors = true) {
  validateGraph(graph);
  const n = graph.order.length,
    minimum = graph.minimum;
  if (typeof xi !== 'number' || !Number.isFinite(xi) || xi <= 0 || xi >= 1) throw Error('Xi must lie strictly between 0 and 1');
  if (![minimum, size].every(x => Number.isSafeInteger(x) && x >= 2 && x <= n) || typeof correctPredecessors !== 'boolean') throw Error('Explicit integer minima and a boolean correction flag are required');
  const inverse = Array(n),
    heights = graph.order.map(row => graph.reach[row]).concat(Infinity),
    parents = graph.order.map(row => graph.predecessor[row]);
  graph.order.forEach((row, i) => inverse[row] = i);
  const flags = transitionFlags(heights, xi),
    complement = 1 - xi,
    intervals = [],
    events = [];
  let areas = [],
    cursor = 0,
    maximumBetween = 0;
  const event = (operation, fields = {}) => events.push({
    operation,
    cursor,
    areas: areas.map(a => ({
      ...a
    })),
    ...fields
  });
  const filterAreas = maximum => {
    const before = areas.map(a => ({
      ...a
    }));
    if (maximum === Infinity) areas = [];else {
      areas = areas.filter(area => maximum <= heights[area.start] * complement);
      for (const area of areas) area.maximum = Math.max(area.maximum, maximum);
    }
    event('filter active down regions', {
      maximum,
      before
    });
  };
  for (let position = 0; position < n; position++) {
    if (!flags.up[position] && !flags.down[position] || position < cursor) continue;
    maximumBetween = Math.max(maximumBetween, ...heights.slice(cursor, position + 1));
    filterAreas(maximumBetween);
    if (flags.down[position]) {
      const extension = extendRegion(flags.down, flags.upward, position, minimum),
        end = extension.last;
      areas.push({
        start: position,
        end,
        maximum: 0
      });
      cursor = end + 1;
      maximumBetween = heights[cursor];
      event('open down region', {
        start: position,
        end,
        extension: extension.trace
      });
      continue;
    }
    const upStart = position,
      extension = extendRegion(flags.up, flags.downward, position, minimum),
      upEnd = extension.last;
    cursor = upEnd + 1;
    maximumBetween = heights[cursor];
    event('close up region', {
      start: upStart,
      end: upEnd,
      extension: extension.trace
    });
    const closingIntervals = [];
    for (const area of areas) {
      let start = area.start,
        end = upEnd;
      const ceiling = heights[end + 1] * complement;
      if (ceiling < area.maximum) {
        event('reject maximum-in-between', {
          start,
          end,
          ceiling,
          maximum: area.maximum
        });
        continue;
      }
      const leftHeight = heights[area.start],
        closingHeight = heights[end + 1],
        before = [start, end],
        movements = [];
      if (leftHeight * complement >= closingHeight) {
        while (heights[start + 1] > closingHeight && start < area.end) {
          movements.push({
            side: 'start',
            from: start,
            to: start + 1,
            operand: heights[start + 1],
            boundary: closingHeight
          });
          start++;
        }
      } else if (closingHeight * complement >= leftHeight) {
        while (heights[end - 1] > leftHeight && end > upStart) {
          movements.push({
            side: 'end',
            from: end,
            to: end - 1,
            operand: heights[end - 1],
            boundary: leftHeight
          });
          end--;
        }
      }
      event('height-adjust endpoints', {
        before,
        after: [start, end],
        movements
      });
      if (correctPredecessors) {
        while (start < end) {
          const predecessor = parents[end],
            parentPosition = predecessor === -1 ? -1 : inverse[predecessor],
            shortcut = heights[start] > heights[end],
            inside = start <= parentPosition && parentPosition < end;
          event('test endpoint predecessor', {
            start,
            end,
            predecessor,
            parentPosition,
            shortcut,
            inside
          });
          if (shortcut || inside) break;
          end--;
        }
        if (start === end) {
          event('reject exhausted predecessor interval', {
            start,
            end
          });
          continue;
        }
      }
      const length = end - start + 1;
      if (length < size || start > area.end || end < upStart) {
        event('reject size or boundary', {
          start,
          end,
          length,
          required: size
        });
        continue;
      }
      closingIntervals.push([start, end]);
      event('accept interval', {
        start,
        end,
        length
      });
    }
    intervals.push(...closingIntervals.reverse());
  }
  const orderedLabels = Array(n).fill(-1),
    selection = [];
  let group = 0;
  for (const [start, end] of intervals) {
    const accepted = orderedLabels.slice(start, end + 1).every(x => x === -1);
    selection.push({
      start,
      end,
      accepted,
      group: accepted ? group : null
    });
    if (accepted) {
      orderedLabels.fill(group, start, end + 1);
      group++;
    }
  }
  const labels = Array(n);
  graph.order.forEach((row, i) => labels[row] = orderedLabels[i]);
  return frozen({
    labels,
    orderedLabels,
    intervals,
    selection,
    events,
    flags,
    heights
  });
}
export function indexedHeapTrace() {
  let slots = ['R', 'S', 'Q', 'T'],
    keys = {
      R: 1,
      S: 1.5,
      Q: 2,
      T: 3
    },
    predecessor = {
      R: null,
      S: null,
      Q: 'A',
      T: null
    };
  const frames = [];
  const capture = (operation, committed, extracted = null) => frames.push({
    operation,
    committed,
    extracted,
    slots: [...slots],
    keys: {
      ...keys
    },
    predecessor: {
      ...predecessor
    },
    inverse: Object.fromEntries(['R', 'S', 'Q', 'T'].map(id => [id, slots.includes(id) ? slots.indexOf(id) : null]))
  });
  capture('Initial indexed heap', true);
  keys.Q = Math.max(.5, .25);
  predecessor.Q = 'P';
  capture('Write Q key .5 and predecessor P', false);
  [slots[0], slots[2]] = [slots[2], slots[0]];
  capture('Swap Q upward with R; update both inverse entries', true);
  const extracted = slots[0];
  slots[0] = slots.pop();
  capture('Extract Q and move T to root', false, extracted);
  [slots[0], slots[2]] = [slots[2], slots[0]];
  capture('Choose smaller child R and repair downward', true, extracted);
  return frozen(frames);
}
export const heapFrames = indexedHeapTrace();
export function proposalImproves(previous, proposal) {
  if (![previous, proposal].every(x => Number.isFinite(x) && x >= 0)) throw Error('Finite nonnegative proposals are required');
  return proposal < previous;
}
