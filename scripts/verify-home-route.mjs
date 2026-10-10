import assert from "node:assert/strict";
import { ancestors, orderRoute, fallbackRoute, planRoute, collapseRoute, searchLessons, shortTrackTitle, toRouteView } from "../src/home/route.js";
import { suggestions, exampleGoalId } from "../src/home/suggestions.js";

// [id, title, trackId, section, prerequisiteIndexes, published]
const lessons = [
  ["a", "Alpha basics", "t1", "s1", [], 1],
  ["b", "Beta", "t1", "s1", [0], 1],
  ["c", "Gamma", "t2", "s2", [1], 0],
  ["d", "Delta", "t2", "s2", [0, 2], 0],
  ["e", "Echo", "t1", "s1", [], 0],
  ["f", "Foxtrot", "t3", "s3", [], 1],
  ["x", "X", "t3", "s3", [7], 0],
  ["y", "Y", "t3", "s3", [6], 0],
];

assert.deepEqual([...ancestors(lessons, 3)].sort(), [0, 1, 2], "transitive prerequisites");
assert.deepEqual(orderRoute(lessons, [2, 0, 1]), [0, 1, 2], "deepest prerequisites come last");
assert.deepEqual(fallbackRoute(lessons, 4), [0, 1], "earlier lessons in the same track and section");
assert.deepEqual(planRoute(lessons, 3), { goal: 3, stops: [0, 1, 2], fallback: false });
assert.deepEqual(planRoute(lessons, 4), { goal: 4, stops: [0, 1], fallback: true });
assert.deepEqual(planRoute(lessons, 5), { goal: 5, stops: [], fallback: false }, "a starting point has no stops");
assert.deepEqual(planRoute(lessons, 6).stops, [7], "a prerequisite cycle terminates");

const ten = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
assert.deepEqual(collapseRoute(ten), [{ item: 0 }, { item: 1 }, { gap: 4 }, { item: 6 }, { item: 7 }, { item: 8 }, { item: 9 }]);
assert.deepEqual(collapseRoute(ten.slice(0, 7)), ten.slice(0, 7).map(item => ({ item })), "seven items are never collapsed");

assert.deepEqual(searchLessons(lessons, "a"), [1, 0, 2, 3], "published first, then lessons with a route, then shorter titles");
assert.deepEqual(searchLessons(lessons, "  "), []);
assert.deepEqual(searchLessons(lessons, "a", 2), [1, 0]);

assert.equal(shortTrackTitle("Large Language Models — Architecture, Training & Inference"), "Large Language Models");
assert.equal(shortTrackTitle("Meta-Learning (Learning to Learn)"), "Meta-Learning");
assert.equal(shortTrackTitle("Classical Machine Learning"), "Classical Machine Learning");

const view = toRouteView(lessons, planRoute(lessons, 2), { t1: "Track One", t2: "Track Two — Extra" });
assert.deepEqual(view.goal, { id: "c", title: "Gamma", trackId: "t2", trackTitle: "Track Two", published: false });
assert.deepEqual(view.stops.map(stop => stop.id), ["a", "b"]);
assert.equal(view.fallback, false);

assert.ok(suggestions.length === 4 && suggestions.some(suggestion => suggestion.id === exampleGoalId), "the example route is one of the suggestions");
console.log("PASS: Home route planning, collapse, search ranking and views.");
