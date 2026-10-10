// Pure route planning over Home's compact lesson index.
// A lesson is [id, title, trackId, section, prerequisiteIndexes, published].
export const ID = 0, TITLE = 1, TRACK = 2, SECTION = 3, PREREQS = 4, PUBLISHED = 5;

export function ancestors(lessons, goal) {
  const found = new Set();
  const stack = [goal];
  while (stack.length) {
    for (const prerequisite of lessons[stack.pop()][PREREQS]) {
      if (!found.has(prerequisite)) { found.add(prerequisite); stack.push(prerequisite); }
    }
  }
  found.delete(goal);
  return found;
}

// Order by longest prerequisite chain inside the route, then curriculum order.
export function orderRoute(lessons, indexes) {
  const members = new Set(indexes);
  const depth = new Map();
  const visiting = new Set();
  const depthOf = index => {
    if (depth.has(index)) return depth.get(index);
    if (visiting.has(index)) return 0;
    visiting.add(index);
    let value = 0;
    for (const prerequisite of lessons[index][PREREQS]) if (members.has(prerequisite)) value = Math.max(value, depthOf(prerequisite) + 1);
    visiting.delete(index);
    depth.set(index, value);
    return value;
  };
  return [...members].sort((a, b) => depthOf(a) - depthOf(b) || a - b);
}

export function fallbackRoute(lessons, goal) {
  const track = lessons[goal][TRACK], section = lessons[goal][SECTION];
  const earlier = [];
  for (let index = 0; index < goal; index++) if (lessons[index][TRACK] === track && lessons[index][SECTION] === section) earlier.push(index);
  return earlier;
}

// Many lessons have no recorded prerequisites, so fall back to their section order.
export function planRoute(lessons, goal) {
  const found = ancestors(lessons, goal);
  if (found.size) return { goal, stops: orderRoute(lessons, found), fallback: false };
  const stops = fallbackRoute(lessons, goal);
  return { goal, stops, fallback: stops.length > 0 };
}

export function collapseRoute(items, max = 7) {
  if (items.length <= max) return items.map(item => ({ item }));
  const head = 2, tail = max - head - 1;
  return [...items.slice(0, head).map(item => ({ item })), { gap: items.length - head - tail }, ...items.slice(-tail).map(item => ({ item }))];
}

export function searchLessons(lessons, query, limit = 6) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const rank = index => [lessons[index][PUBLISHED] ? 0 : 1, lessons[index][PREREQS].length ? 0 : 1, lessons[index][TITLE].length, index];
  const hits = [];
  lessons.forEach((lesson, index) => { if (lesson[TITLE].toLowerCase().includes(needle)) hits.push(index); });
  return hits.sort((a, b) => {
    const left = rank(a), right = rank(b);
    for (let key = 0; key < left.length; key++) if (left[key] !== right[key]) return left[key] - right[key];
    return 0;
  }).slice(0, limit);
}

export const shortTrackTitle = title => title.replace(/\s+—.*$/, "").replace(/\s*\(.*\)$/, "");

export function toRouteView(lessons, route, trackTitles) {
  const view = index => {
    const lesson = lessons[index];
    return { id: lesson[ID], title: lesson[TITLE], trackId: lesson[TRACK], trackTitle: shortTrackTitle(trackTitles[lesson[TRACK]] ?? lesson[TRACK]), published: Boolean(lesson[PUBLISHED]) };
  };
  return { goal: view(route.goal), stops: route.stops.map(view), fallback: route.fallback };
}
