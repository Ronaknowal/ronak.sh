// docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/runtime-preview/PreparationInvestigations.jsx
import React4, { useId as useId3 } from "react";
import { useState } from "file:///C:/Personal%20Projects%20and%20files/Portfolio/Portfolio/docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/runtime-preview/.scenario-state.mjs";

// docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/runtime-preview/Drawing.jsx
import React, { useId } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var ink = {
  query: "#e5b85c",
  A: "#78b5e3",
  B: "#cd9fe9",
  observed: "#e2e2e2",
  estimated: "#dfad74",
  missing: "#c3a0d5",
  muted: "#a5a5ae",
  axis: "#777781"
};
function fmt(value, precision = 6) {
  if (value === null || value === void 0) return "NA";
  if (typeof value !== "number") return String(value);
  if (!Number.isFinite(value)) return "undefined";
  return Number(value.toPrecision(precision)).toString();
}
function Table({
  headers,
  rows,
  caption,
  label
}) {
  return /* @__PURE__ */ jsx("div", { className: "prep-table-scroll", tabIndex: 0, role: "region", "aria-label": caption || label || "Complete values; scroll horizontally when needed", children: /* @__PURE__ */ jsxs("table", { children: [
    /* @__PURE__ */ jsx("caption", { children: caption }),
    /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: headers.map((header, i) => /* @__PURE__ */ jsx("th", { scope: "col", children: header }, i)) }) }),
    /* @__PURE__ */ jsx("tbody", { children: rows.map((row, i) => /* @__PURE__ */ jsx("tr", { children: row.map((value, j) => /* @__PURE__ */ jsx("td", { children: typeof value === "number" || value === null || value === void 0 ? fmt(value) : value }, j)) }, i)) })
  ] }) });
}
function Matrix({
  values,
  columns,
  rowLabels,
  missing,
  highlightRows = [],
  label
}) {
  return /* @__PURE__ */ jsx("div", { className: "prep-matrix", children: /* @__PURE__ */ jsx(Table, { caption: label, headers: ["Row", ...columns], rows: values.map((row, i) => [/* @__PURE__ */ jsx("span", { className: highlightRows.includes(i) ? "prep-selected" : "", children: rowLabels?.[i] ?? i }), ...row.map((value, j) => /* @__PURE__ */ jsxs("span", { className: `prep-cell${missing?.[i]?.[j] || value === null ? " prep-cell--estimated" : ""}${highlightRows.includes(i) ? " prep-cell--selected" : ""}`, children: [
    React.isValidElement(value) ? value : fmt(value),
    missing?.[i]?.[j] && value !== null ? /* @__PURE__ */ jsx("span", { className: "prep-cell-note", children: "filled" }) : null
  ] }))]) }) });
}
function Cells({
  values,
  names,
  mask,
  label
}) {
  return /* @__PURE__ */ jsx("div", { className: "prep-cells", "aria-label": label, children: values.map((value, i) => /* @__PURE__ */ jsxs("div", { className: mask?.[i] ? "prep-coordinate prep-cell--estimated" : "prep-coordinate", children: [
    /* @__PURE__ */ jsx("span", { children: names?.[i] ?? `coordinate ${i}` }),
    /* @__PURE__ */ jsx("strong", { children: fmt(value) }),
    mask?.[i] ? /* @__PURE__ */ jsx("small", { children: "originally missing" }) : null
  ] }, i)) });
}
function Plot({
  points: points2 = [],
  paths = [],
  circles = [],
  xDomain = [-1, 1],
  yDomain = [-1, 1],
  equal = false,
  xLabel,
  yLabel,
  label,
  children
}) {
  const marker = useId().replaceAll(":", "");
  const left = 58, right = 382, top = 32, bottom = 356;
  let [xmin, xmax] = xDomain, [ymin, ymax] = yDomain;
  if (equal) {
    const span = Math.max(xmax - xmin, ymax - ymin), cx = (xmin + xmax) / 2, cy = (ymin + ymax) / 2;
    xmin = cx - span / 2;
    xmax = cx + span / 2;
    ymin = cy - span / 2;
    ymax = cy + span / 2;
  }
  const x = (value) => left + (value - xmin) / (xmax - xmin) * (right - left);
  const y = (value) => bottom - (value - ymin) / (ymax - ymin) * (bottom - top);
  const ticks = (low, high) => [low, low + (high - low) / 2, high];
  return /* @__PURE__ */ jsxs("div", { className: "prep-plot", children: [
    /* @__PURE__ */ jsxs("p", { className: "prep-axis-labels", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        "Horizontal: ",
        xLabel
      ] }),
      /* @__PURE__ */ jsxs("span", { children: [
        "Vertical: ",
        yLabel
      ] })
    ] }),
    /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 440 398", role: "img", "aria-label": label, children: [
      /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsx("marker", { id: marker, viewBox: "0 0 10 10", refX: "9", refY: "5", markerWidth: "6", markerHeight: "6", orient: "auto-start-reverse", children: /* @__PURE__ */ jsx("path", { d: "M0 0 L10 5 L0 10 Z", fill: "context-stroke" }) }) }),
      ticks(xmin, xmax).map((value) => /* @__PURE__ */ jsxs("g", { children: [
        /* @__PURE__ */ jsx("line", { x1: x(value), x2: x(value), y1: top, y2: bottom, className: "prep-grid" }),
        /* @__PURE__ */ jsx("text", { x: x(value), y: bottom + 24, textAnchor: "middle", children: fmt(value, 3) })
      ] }, `x${value}`)),
      ticks(ymin, ymax).map((value) => /* @__PURE__ */ jsxs("g", { children: [
        /* @__PURE__ */ jsx("line", { x1: left, x2: right, y1: y(value), y2: y(value), className: "prep-grid" }),
        /* @__PURE__ */ jsx("text", { x: left - 8, y: y(value) + 5, textAnchor: "end", children: fmt(value, 3) })
      ] }, `y${value}`)),
      /* @__PURE__ */ jsx("line", { x1: left, x2: right, y1: y(Math.min(ymax, Math.max(ymin, 0))), y2: y(Math.min(ymax, Math.max(ymin, 0))), stroke: ink.axis }),
      /* @__PURE__ */ jsx("line", { x1: x(Math.min(xmax, Math.max(xmin, 0))), x2: x(Math.min(xmax, Math.max(xmin, 0))), y1: top, y2: bottom, stroke: ink.axis }),
      circles.map((circle, i) => /* @__PURE__ */ jsx("circle", { cx: x(circle.x || 0), cy: y(circle.y || 0), r: circle.radius / (xmax - xmin) * (right - left), fill: "none", stroke: circle.color || ink.muted, strokeDasharray: "5 5" }, i)),
      paths.map((path, i) => /* @__PURE__ */ jsx("polyline", { points: path.values.filter((row) => row.every(Number.isFinite)).map(([px, py]) => `${x(px)},${y(py)}`).join(" "), fill: "none", stroke: path.color || ink.query, strokeWidth: path.width || 2, strokeDasharray: path.dashed ? "5 4" : void 0, markerEnd: path.arrow ? `url(#${marker})` : void 0 }, i)),
      points2.map((point, i) => /* @__PURE__ */ jsx("g", { children: i % 3 === 1 ? /* @__PURE__ */ jsx("rect", { x: x(point.x) - (point.radius || 5), y: y(point.y) - (point.radius || 5), width: 2 * (point.radius || 5), height: 2 * (point.radius || 5), fill: point.color || ink.query, stroke: "#171719" }) : i % 3 === 2 ? /* @__PURE__ */ jsx("path", { d: `M${x(point.x)} ${y(point.y) - 7} l7 7 l-7 7 l-7 -7Z`, fill: point.color || ink.query, stroke: "#171719" }) : /* @__PURE__ */ jsx("circle", { cx: x(point.x), cy: y(point.y), r: point.radius || 5, fill: point.color || ink.query, stroke: "#171719", strokeWidth: "1.5" }) }, i)),
      children?.({
        x,
        y
      })
    ] }),
    points2.some((point) => point.id) ? /* @__PURE__ */ jsx("ul", { className: "prep-plot-key", children: points2.map((point, i) => point.id ? /* @__PURE__ */ jsxs("li", { children: [
      /* @__PURE__ */ jsxs("span", { style: {
        color: point.color || ink.query
      }, children: [
        ["\u25CF", "\u25A0", "\u25C6"][i % 3],
        " ",
        point.id
      ] }),
      ": (",
      fmt(point.x),
      ", ",
      fmt(point.y),
      ")"
    ] }, i) : null) }) : null
  ] });
}
function NumberLine({
  values,
  min,
  max,
  label,
  colors = [],
  marks = []
}) {
  const domainMin = min ?? Math.min(0, ...values, ...marks.map((mark) => mark.value));
  const domainMax = max ?? Math.max(1, ...values, ...marks.map((mark) => mark.value));
  const span = domainMax - domainMin || 1, x = (value) => 38 + (value - domainMin) / span * 364;
  return /* @__PURE__ */ jsxs("div", { className: "prep-number-line", children: [
    /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 440 134", role: "img", "aria-label": label, children: [
      /* @__PURE__ */ jsx("line", { x1: "38", x2: "402", y1: "55", y2: "55", stroke: ink.axis }),
      [domainMin, domainMax].map((value) => /* @__PURE__ */ jsxs("g", { children: [
        /* @__PURE__ */ jsx("line", { x1: x(value), x2: x(value), y1: "49", y2: "61", stroke: ink.axis }),
        /* @__PURE__ */ jsx("text", { x: x(value), y: "88", textAnchor: "middle", children: fmt(value, 4) })
      ] }, value)),
      values.map((value, i) => /* @__PURE__ */ jsx("circle", { cx: x(value), cy: 55 - values.slice(0, i).filter((old) => old === value).length * 10, r: "4", fill: colors[i] || ink.A }, i)),
      marks.map((mark, i) => /* @__PURE__ */ jsx("line", { x1: x(mark.value), x2: x(mark.value), y1: "26", y2: "65", stroke: mark.color || ink.query }, i))
    ] }),
    /* @__PURE__ */ jsx("p", { className: "prep-axis-labels", children: label }),
    marks.length ? /* @__PURE__ */ jsx("ul", { className: "prep-plot-key", children: marks.map((mark, i) => /* @__PURE__ */ jsxs("li", { children: [
      mark.id,
      ": ",
      fmt(mark.value)
    ] }, i)) }) : null
  ] });
}
function Bars({
  rows,
  maximum,
  label
}) {
  const max = maximum ?? Math.max(...rows.map((row) => Math.abs(row.value)), 1);
  return /* @__PURE__ */ jsx("div", { className: "prep-bars", "aria-label": label, children: rows.map((row, i) => /* @__PURE__ */ jsxs("div", { className: "prep-bar-row", children: [
    /* @__PURE__ */ jsx("span", { children: row.name }),
    /* @__PURE__ */ jsx("div", { className: "prep-bar-track", children: /* @__PURE__ */ jsx("span", { style: {
      width: `${100 * Math.abs(row.value) / max}%`,
      background: row.color || ink.A
    } }) }),
    /* @__PURE__ */ jsx("strong", { children: fmt(row.value) })
  ] }, i)) });
}

// docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/runtime-preview/preparation-models.mjs
var mean = (values) => values.reduce((sum2, value) => sum2 + value, 0) / values.length;
var sum = (values) => values.reduce((total, value) => total + value, 0);
function percentile(values, p) {
  const sorted = values.filter((value) => value !== null).slice().sort((a, b) => a - b);
  if (!sorted.length) throw Error("No observed value supports this fitted statistic.");
  const position = p * (sorted.length - 1), low = Math.floor(position), high = Math.ceil(position);
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}
function ruler(values, kind) {
  const observed = values.filter((value) => value !== null);
  if (!observed.length) throw Error("An all-missing column has no supported fitted ruler.");
  let center, measured;
  if (kind === "standard") {
    center = mean(observed);
    measured = Math.sqrt(mean(observed.map((value) => (value - center) ** 2)));
  } else if (kind === "robust") {
    center = percentile(observed, 0.5);
    measured = percentile(observed, 0.75) - percentile(observed, 0.25);
  } else if (kind === "maxabs") {
    center = 0;
    measured = Math.max(...observed.map(Math.abs));
  } else {
    center = Math.min(...observed);
    measured = Math.max(...observed) - center;
  }
  return {
    center,
    scale: measured === 0 ? 1 : measured,
    measured,
    constant: measured === 0
  };
}
var applyRuler = (state, value) => (value - state.center) / state.scale;
var points = {
  Q: [40, 4e3],
  A: [41, 4100],
  B: [43, 4001]
};
function distance(from, to, divisors = [1, 100]) {
  const delta = from.map((value, i) => (to[i] - value) / divisors[i]);
  const contributions = delta.map((value) => value ** 2);
  return {
    delta,
    contributions,
    squared: sum(contributions),
    length: Math.sqrt(sum(contributions))
  };
}
function doubleDivisors(values) {
  const next = values.map((value) => value * 2);
  if (!next.every(Number.isFinite) || next[0] < 0.1 || next[0] > 10 || next[1] < 1 || next[1] > 500) throw Error("Doubling would exceed the declared divisor domain; neither divisor was changed.");
  return next;
}
function translateCases(data) {
  const next = Object.fromEntries(Object.entries(data).map(([id, row]) => [id, [row[0] + 1, row[1] + 10]]));
  if (Object.values(next).some((row) => !row.every(Number.isFinite) || row[0] < 0 || row[0] > 100 || row[1] < 0 || row[1] > 1e4)) throw Error("Translation would exceed the declared coordinate domain; no point was changed.");
  return next;
}
var donorFixture = [[2, 12, null], [1, 10, 100], [3, null, 300], [null, 14, 500]];
function donors(table = donorFixture, k = 2) {
  const query = table[0], target = 2;
  const scored = table.slice(1).map((row, i) => {
    const overlap = row.map((value, j) => value !== null && query[j] !== null ? j : -1).filter((j) => j >= 0);
    const squares = overlap.map((j) => (row[j] - query[j]) ** 2);
    const squared = overlap.length ? row.length / overlap.length * sum(squares) : null;
    return {
      id: `D${i + 1}`,
      row,
      overlap,
      squares,
      squared,
      length: squared === null ? null : Math.sqrt(squared),
      eligible: row[target] !== null
    };
  });
  const eligible = scored.filter((row) => row.eligible && row.squared !== null).sort((a, b) => a.squared - b.squared || a.id.localeCompare(b.id));
  const chosen = eligible.slice(0, k);
  const observed = scored.filter((row) => row.eligible).map((row) => row.row[target]);
  if (!observed.length) throw Error("All donor target values are missing: no evidence for a fill.");
  return {
    scored,
    chosen,
    value: mean(chosen.length ? chosen.map((row) => row.row[target]) : observed),
    fallback: !chosen.length
  };
}
function category(query = "a", minimum = 2, policy = "infrequent") {
  const counts = {
    a: 4,
    b: 1
  };
  if (typeof query === "string" && query.startsWith("@")) throw Error("Labels starting with @ are reserved internal markers.");
  const frequent = Object.keys(counts).filter((key) => counts[key] >= minimum).sort();
  const hasRare = Object.keys(counts).some((key) => counts[key] < minimum);
  const vocabulary = ["@missing", ...hasRare ? ["@rare"] : [], ...frequent];
  let token = query === null ? "@missing" : frequent.includes(query) ? query : Object.hasOwn(counts, query) ? "@rare" : null;
  if (token === null && policy === "error") throw Error("Unknown category under the declared error policy.");
  if (token === null && policy === "infrequent" && hasRare) token = "@rare";
  return {
    vocabulary,
    token,
    counts,
    vector: vocabulary.map((value) => Number(value === token)),
    hasRare
  };
}
var smallFit = {
  medians: [20, 300, 7],
  means: [20, 300, 7],
  scales: [Math.sqrt(50), Math.sqrt(2e4), 1],
  vocabulary: ["a", "b", "not_recorded"]
};
function prepare(row, label = "a", state = smallFit) {
  const filled = row.map((value, i) => value === null ? state.medians[i] : value);
  const numeric = filled.map((value, i) => (value - state.means[i]) / state.scales[i]);
  const token = label === null ? "not_recorded" : label;
  const encoded = state.vocabulary.map((value) => Number(value === token));
  return {
    row,
    filled,
    numeric,
    encoded,
    mask: row.map((value) => Number(value === null)),
    output: [...numeric, ...encoded]
  };
}
function power(x, lambda, method = "YJ") {
  if (method === "BC") {
    if (x <= 0) throw Error("Box\u2013Cox requires a strictly positive input.");
    return Math.abs(lambda) < 1e-8 ? Math.log(x) : Math.expm1(lambda * Math.log(x)) / lambda;
  }
  if (x >= 0) return Math.abs(lambda) < 1e-8 ? Math.log1p(x) : Math.expm1(lambda * Math.log1p(x)) / lambda;
  const exponent = 2 - lambda;
  return Math.abs(exponent) < 1e-8 ? -Math.log1p(-x) : -Math.expm1(exponent * Math.log1p(-x)) / exponent;
}
function normalQuantile(p) {
  if (!(p > 0 && p < 1)) throw Error("Normal quantile requires probability strictly inside (0,1).");
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const evaluate = (coefficients, x) => coefficients.reduce((value, coefficient) => value * x + coefficient, 0);
  if (p < 0.02425 || p > 0.97575) {
    const q2 = Math.sqrt(-2 * Math.log(p < 0.5 ? p : 1 - p));
    const value = evaluate(c, q2) / evaluate([...d, 1], q2);
    return p < 0.5 ? value : -value;
  }
  const q = p - 0.5, r = q * q;
  return evaluate(a, r) * q / evaluate([...b, 1], r);
}
function quantileMap(x, output = "uniform") {
  const landmarks = [1, 2, 2, 4, 100], references = [0, 0.25, 0.5, 0.75, 1];
  let probability;
  if (x <= 1) probability = 0;
  else if (x >= 100) probability = 1;
  else if (x === 2) probability = 0.375;
  else {
    const upper = landmarks.findIndex((value) => value > x), lower = upper - 1;
    probability = references[lower] + (references[upper] - references[lower]) * (x - landmarks[lower]) / (landmarks[upper] - landmarks[lower]);
  }
  const clipped = Math.min(1 - 1e-7, Math.max(1e-7, probability));
  return {
    landmarks,
    references,
    probability,
    value: output === "normal" ? normalQuantile(clipped) : probability,
    saturated: x < 1 || x > 100
  };
}
var targetFixture = {
  categories: ["A", "A", "B", "B", "C", "C"],
  targets: [1, 1, 0, 0, 1, 0],
  folds: [0, 1, 0, 1, 0, 1]
};
function crossFit(fixture = targetFixture, alpha = 2) {
  return fixture.categories.map((label, i) => {
    const donors2 = fixture.folds.map((fold, j) => fold !== fixture.folds[i] ? j : -1).filter((j) => j >= 0);
    if (!donors2.length) throw Error("An inspected fold has no permitted donor rows.");
    const prior = mean(donors2.map((j) => fixture.targets[j]));
    const matching = donors2.filter((j) => fixture.categories[j] === label);
    const total = sum(matching.map((j) => fixture.targets[j]));
    return {
      donors: donors2,
      matching,
      prior,
      total,
      count: matching.length,
      value: matching.length + alpha === 0 ? prior : (total + alpha * prior) / (matching.length + alpha)
    };
  });
}
var incomplete = [[1, 2], [2, 4], [3, null], [null, 8], [5, 10]];
function conditionalTrace(input = incomplete, alpha = 1, initialOverrides = {}) {
  const medians = [0, 1].map((j) => percentile(input.map((row) => row[j]), 0.5));
  let current = input.map((row, i) => row.map((value, j) => value === null ? initialOverrides[`${i},${j}`] ?? medians[j] : value));
  const initial = current.map((row) => row.slice()), trace = [];
  for (let turn = 0; turn < 6; turn++) {
    const target = turn % 2, other = 1 - target;
    const observed = input.map((row, i) => row[target] !== null ? i : -1).filter((i) => i >= 0);
    const design = observed.map((i) => current[i][other]), response = observed.map((i) => input[i][target]);
    const xMean = mean(design), yMean = mean(response);
    const coefficient = sum(design.map((value, i) => (value - xMean) * (response[i] - yMean))) / (sum(design.map((value) => (value - xMean) ** 2)) + alpha);
    const intercept = yMean - coefficient * xMean;
    current = current.map((row, i) => input[i][target] === null ? row.map((value, j) => j === target ? intercept + coefficient * row[other] : value) : row.slice());
    trace.push({
      turn: turn + 1,
      target,
      other,
      observed,
      design,
      response,
      coefficient,
      intercept,
      current
    });
  }
  return {
    medians,
    initial,
    trace,
    status: "3 sweeps \xB7 iteration cap (not convergence)"
  };
}
function pool(estimates = [9, 10, 11], variances = [4, 4, 4]) {
  if (estimates.length < 2 || estimates.length !== variances.length || variances.some((value) => value < 0)) throw Error("Pooling needs at least two aligned estimates and nonnegative variances.");
  const estimate = mean(estimates), within = mean(variances);
  const between = sum(estimates.map((value) => (value - estimate) ** 2)) / (estimates.length - 1);
  const simulation = between / estimates.length, total = within + between + simulation;
  return {
    estimate,
    within,
    between,
    simulation,
    total,
    standardError: Math.sqrt(total)
  };
}
var completionTables = [[8, 10, 13.844877, 12, 10.417592], [8, 10, 3.469308, 12, 3.517166], [8, 10, 9.252957, 12, 10.045356]];
var sensitivity = (delta) => 8.686461347735442 + 0.4 * delta;

// docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/runtime-preview/saved-data.js
var saved = { "environment": { "python": "3.12.14", "numpy": "2.3.5", "pandas": "3.0.1", "sklearn": "1.9.1" }, "data_sha256": "f204db2c753b0937caac3cb35258562c14f073e4bbc76be24b4c51ce22767a93", "missing_counts": { "species": 0, "island": 0, "bill_length_mm": 2, "bill_depth_mm": 2, "flipper_length_mm": 2, "body_mass_g": 2, "sex": 11, "year": 0 }, "splits": { "train": [214, 177, 230, 111, 52, 327, 13, 97, 50, 266, 85, 201, 179, 296, 329, 151, 235, 80, 116, 136, 89, 175, 331, 197, 81, 154, 293, 233, 35, 0, 124, 33, 228, 288, 236, 314, 55, 96, 129, 130, 260, 279, 20, 172, 56, 155, 205, 342, 150, 240, 272, 132, 268, 300, 93, 134, 202, 8, 218, 304, 239, 241, 165, 261, 317, 338, 128, 332, 2, 306, 280, 57, 11, 234, 195, 232, 117, 19, 60, 181, 9, 92, 171, 73, 121, 340, 289, 302, 208, 1, 184, 115, 252, 27, 161, 276, 341, 180, 209, 301, 76, 47, 67, 53, 282, 310, 44, 138, 263, 322, 139, 38, 51, 64, 108, 114, 274, 292, 107, 68, 133, 182, 215, 28, 63, 14, 229, 135, 45, 140, 213, 246, 245, 23, 173, 103, 284, 320, 323, 211, 153, 65, 70, 109, 254, 58, 37, 337, 21, 54, 123, 12, 168, 290, 106, 143, 324, 256, 95, 217, 144, 325, 122, 41, 146, 48, 277, 66, 39, 222, 156, 227, 199, 49, 5, 224, 100, 255, 321, 316, 86, 264, 250, 69, 194, 4, 74, 158, 336, 198, 269, 78, 31, 339, 94, 226, 333, 273, 312, 253, 281, 257, 91, 36, 242, 160, 152, 46, 62, 219, 335, 196, 220, 286, 174, 225, 187, 265, 294, 186, 87, 183, 330, 30, 285, 193, 185, 166, 34, 164, 328, 275, 72, 98, 311, 159, 84, 24, 259, 29, 343, 212, 125, 119, 248, 42, 203, 82, 295, 88, 113, 112, 192, 258, 176, 305, 104, 102], "test": [309, 318, 243, 334, 77, 207, 126, 221, 206, 170, 99, 149, 231, 326, 105, 61, 131, 283, 313, 188, 271, 3, 204, 83, 17, 191, 10, 137, 59, 251, 142, 26, 145, 79, 308, 249, 167, 278, 287, 178, 163, 141, 299, 270, 169, 25, 32, 200, 16, 262, 15, 244, 189, 43, 307, 110, 147, 303, 297, 291, 118, 238, 71, 267, 127, 298, 162, 120, 315, 40, 237, 319, 157, 247, 6, 223, 75, 210, 18, 101, 216, 90, 148, 7, 22, 190] }, "results": [{ "method": "raw", "accuracy": 0.7790697674418605, "correct": 67, "confusion": [[32, 1, 5], [9, 7, 1], [3, 0, 28]] }, { "method": "standard", "accuracy": 0.9767441860465116, "correct": 84, "confusion": [[37, 1, 0], [0, 17, 0], [0, 1, 30]] }, { "method": "minmax", "accuracy": 0.9883720930232558, "correct": 85, "confusion": [[38, 0, 0], [0, 17, 0], [1, 0, 30]] }, { "method": "robust", "accuracy": 0.9883720930232558, "correct": 85, "confusion": [[38, 0, 0], [0, 17, 0], [1, 0, 30]] }], "baseline_accuracy": 0.4418604651162791, "scaled_inspection": { "feature_names": ["numeric__bill_length_mm", "numeric__bill_depth_mm", "numeric__flipper_length_mm", "numeric__body_mass_g", "category__sex_female", "category__sex_male", "category__sex_not_recorded"], "train_medians": [45, 17.3, 197, 4e3], "mean": [43.93062015503876, 17.09922480620155, 200.65891472868216, 4190.988372093023], "scale": [5.400031618043809, 1.9387119564900213, 14.230655916521705, 806.6875829303058], "test_source_rows": [309, 318, 243, 334, 77, 207, 126, 221, 206, 170, 99, 149, 231, 326, 105, 61, 131, 283, 313, 188, 271, 3, 204, 83, 17, 191, 10, 137, 59, 251, 142, 26, 145, 79, 308, 249, 167, 278, 287, 178, 163, 141, 299, 270, 169, 25, 32, 200, 16, 262, 15, 244, 189, 43, 307, 110, 147, 303, 297, 291, 118, 238, 71, 267, 127, 298, 162, 120, 315, 40, 237, 319, 157, 247, 6, 223, 75, 210, 18, 101, 216, 90, 148, 7, 22, 190], "raw_test": [{ "bill_length_mm": 51, "bill_depth_mm": 18.8, "flipper_length_mm": 203, "body_mass_g": 4100, "sex": "male" }, { "bill_length_mm": 50.9, "bill_depth_mm": 19.1, "flipper_length_mm": 196, "body_mass_g": 3550, "sex": "male" }, { "bill_length_mm": 52.2, "bill_depth_mm": 17.1, "flipper_length_mm": 228, "body_mass_g": 5400, "sex": "male" }, { "bill_length_mm": 50.2, "bill_depth_mm": 18.8, "flipper_length_mm": 202, "body_mass_g": 3800, "sex": "male" }, { "bill_length_mm": 37.2, "bill_depth_mm": 19.4, "flipper_length_mm": 184, "body_mass_g": 3900, "sex": "male" }, { "bill_length_mm": 45, "bill_depth_mm": 15.4, "flipper_length_mm": 220, "body_mass_g": 5050, "sex": "male" }, { "bill_length_mm": 38.8, "bill_depth_mm": 17.6, "flipper_length_mm": 191, "body_mass_g": 3275, "sex": "female" }, { "bill_length_mm": 50.7, "bill_depth_mm": 15, "flipper_length_mm": 223, "body_mass_g": 5550, "sex": "male" }, { "bill_length_mm": 46.5, "bill_depth_mm": 14.4, "flipper_length_mm": 217, "body_mass_g": 4900, "sex": "female" }, { "bill_length_mm": 46.2, "bill_depth_mm": 14.5, "flipper_length_mm": 209, "body_mass_g": 4800, "sex": "female" }, { "bill_length_mm": 43.2, "bill_depth_mm": 18.5, "flipper_length_mm": 192, "body_mass_g": 4100, "sex": "male" }, { "bill_length_mm": 37.8, "bill_depth_mm": 18.1, "flipper_length_mm": 193, "body_mass_g": 3750, "sex": "male" }, { "bill_length_mm": 45.2, "bill_depth_mm": 16.4, "flipper_length_mm": 223, "body_mass_g": 5950, "sex": "male" }, { "bill_length_mm": 48.1, "bill_depth_mm": 16.4, "flipper_length_mm": 199, "body_mass_g": 3325, "sex": "female" }, { "bill_length_mm": 39.7, "bill_depth_mm": 18.9, "flipper_length_mm": 184, "body_mass_g": 3550, "sex": "male" }, { "bill_length_mm": 41.3, "bill_depth_mm": 21.1, "flipper_length_mm": 195, "body_mass_g": 4400, "sex": "male" }, { "bill_length_mm": 43.1, "bill_depth_mm": 19.2, "flipper_length_mm": 197, "body_mass_g": 3500, "sex": "male" }, { "bill_length_mm": 51.3, "bill_depth_mm": 18.2, "flipper_length_mm": 197, "body_mass_g": 3750, "sex": "male" }, { "bill_length_mm": 52, "bill_depth_mm": 20.7, "flipper_length_mm": 210, "body_mass_g": 4800, "sex": "male" }, { "bill_length_mm": 42.6, "bill_depth_mm": 13.7, "flipper_length_mm": 213, "body_mass_g": 4950, "sex": "female" }, { "bill_length_mm": null, "bill_depth_mm": null, "flipper_length_mm": null, "body_mass_g": null, "sex": null }, { "bill_length_mm": null, "bill_depth_mm": null, "flipper_length_mm": null, "body_mass_g": null, "sex": null }, { "bill_length_mm": 45.1, "bill_depth_mm": 14.4, "flipper_length_mm": 210, "body_mass_g": 4400, "sex": "female" }, { "bill_length_mm": 35.1, "bill_depth_mm": 19.4, "flipper_length_mm": 193, "body_mass_g": 4200, "sex": "male" }, { "bill_length_mm": 42.5, "bill_depth_mm": 20.7, "flipper_length_mm": 197, "body_mass_g": 4500, "sex": "male" }, { "bill_length_mm": 48.7, "bill_depth_mm": 15.7, "flipper_length_mm": 208, "body_mass_g": 5350, "sex": "male" }, { "bill_length_mm": 37.8, "bill_depth_mm": 17.1, "flipper_length_mm": 186, "body_mass_g": 3300, "sex": null }, { "bill_length_mm": 40.2, "bill_depth_mm": 20.1, "flipper_length_mm": 200, "body_mass_g": 3975, "sex": "male" }, { "bill_length_mm": 37.6, "bill_depth_mm": 19.1, "flipper_length_mm": 194, "body_mass_g": 3750, "sex": "male" }, { "bill_length_mm": 51.1, "bill_depth_mm": 16.5, "flipper_length_mm": 225, "body_mass_g": 5250, "sex": "male" }, { "bill_length_mm": 32.1, "bill_depth_mm": 15.5, "flipper_length_mm": 188, "body_mass_g": 3050, "sex": "female" }, { "bill_length_mm": 40.6, "bill_depth_mm": 18.6, "flipper_length_mm": 183, "body_mass_g": 3550, "sex": "male" }, { "bill_length_mm": 39, "bill_depth_mm": 18.7, "flipper_length_mm": 185, "body_mass_g": 3650, "sex": "male" }, { "bill_length_mm": 42.1, "bill_depth_mm": 19.1, "flipper_length_mm": 195, "body_mass_g": 4e3, "sex": "male" }, { "bill_length_mm": 42.5, "bill_depth_mm": 16.7, "flipper_length_mm": 187, "body_mass_g": 3350, "sex": "female" }, { "bill_length_mm": 46.9, "bill_depth_mm": 14.6, "flipper_length_mm": 222, "body_mass_g": 4875, "sex": "female" }, { "bill_length_mm": 49.3, "bill_depth_mm": 15.7, "flipper_length_mm": 217, "body_mass_g": 5850, "sex": "male" }, { "bill_length_mm": 51.3, "bill_depth_mm": 19.2, "flipper_length_mm": 193, "body_mass_g": 3650, "sex": "male" }, { "bill_length_mm": 51.7, "bill_depth_mm": 20.3, "flipper_length_mm": 194, "body_mass_g": 3775, "sex": "male" }, { "bill_length_mm": 44.5, "bill_depth_mm": 14.3, "flipper_length_mm": 216, "body_mass_g": 4100, "sex": null }, { "bill_length_mm": 49, "bill_depth_mm": 16.1, "flipper_length_mm": 216, "body_mass_g": 5550, "sex": "male" }, { "bill_length_mm": 40.6, "bill_depth_mm": 17.2, "flipper_length_mm": 187, "body_mass_g": 3475, "sex": "male" }, { "bill_length_mm": 50.6, "bill_depth_mm": 19.4, "flipper_length_mm": 193, "body_mass_g": 3800, "sex": "male" }, { "bill_length_mm": 47.2, "bill_depth_mm": 13.7, "flipper_length_mm": 214, "body_mass_g": 4925, "sex": "female" }, { "bill_length_mm": 49.2, "bill_depth_mm": 15.2, "flipper_length_mm": 221, "body_mass_g": 6300, "sex": "male" }, { "bill_length_mm": 35.3, "bill_depth_mm": 18.9, "flipper_length_mm": 187, "body_mass_g": 3800, "sex": "female" }, { "bill_length_mm": 39.5, "bill_depth_mm": 17.8, "flipper_length_mm": 188, "body_mass_g": 3300, "sex": "female" }, { "bill_length_mm": 44.9, "bill_depth_mm": 13.3, "flipper_length_mm": 213, "body_mass_g": 5100, "sex": "female" }, { "bill_length_mm": 38.7, "bill_depth_mm": 19, "flipper_length_mm": 195, "body_mass_g": 3450, "sex": "female" }, { "bill_length_mm": 50.5, "bill_depth_mm": 15.2, "flipper_length_mm": 216, "body_mass_g": 5e3, "sex": "female" }, { "bill_length_mm": 36.6, "bill_depth_mm": 17.8, "flipper_length_mm": 185, "body_mass_g": 3700, "sex": "female" }, { "bill_length_mm": 45.5, "bill_depth_mm": 14.5, "flipper_length_mm": 212, "body_mass_g": 4750, "sex": "female" }, { "bill_length_mm": 44.4, "bill_depth_mm": 17.3, "flipper_length_mm": 219, "body_mass_g": 5250, "sex": "male" }, { "bill_length_mm": 44.1, "bill_depth_mm": 19.7, "flipper_length_mm": 196, "body_mass_g": 4400, "sex": "male" }, { "bill_length_mm": 54.2, "bill_depth_mm": 20.8, "flipper_length_mm": 201, "body_mass_g": 4300, "sex": "male" }, { "bill_length_mm": 38.1, "bill_depth_mm": 16.5, "flipper_length_mm": 198, "body_mass_g": 3825, "sex": "female" }, { "bill_length_mm": 36.6, "bill_depth_mm": 18.4, "flipper_length_mm": 184, "body_mass_g": 3475, "sex": "female" }, { "bill_length_mm": 49.5, "bill_depth_mm": 19, "flipper_length_mm": 200, "body_mass_g": 3800, "sex": "male" }, { "bill_length_mm": 48.5, "bill_depth_mm": 17.5, "flipper_length_mm": 191, "body_mass_g": 3400, "sex": "male" }, { "bill_length_mm": 50.5, "bill_depth_mm": 19.6, "flipper_length_mm": 201, "body_mass_g": 4050, "sex": "male" }, { "bill_length_mm": 35.7, "bill_depth_mm": 17, "flipper_length_mm": 189, "body_mass_g": 3350, "sex": "female" }, { "bill_length_mm": 43.4, "bill_depth_mm": 14.4, "flipper_length_mm": 218, "body_mass_g": 4600, "sex": "female" }, { "bill_length_mm": 39.7, "bill_depth_mm": 18.4, "flipper_length_mm": 190, "body_mass_g": 3900, "sex": "male" }, { "bill_length_mm": 55.1, "bill_depth_mm": 16, "flipper_length_mm": 230, "body_mass_g": 5850, "sex": "male" }, { "bill_length_mm": 41.5, "bill_depth_mm": 18.3, "flipper_length_mm": 195, "body_mass_g": 4300, "sex": "male" }, { "bill_length_mm": 43.2, "bill_depth_mm": 16.6, "flipper_length_mm": 187, "body_mass_g": 2900, "sex": "female" }, { "bill_length_mm": 40.9, "bill_depth_mm": 13.7, "flipper_length_mm": 214, "body_mass_g": 4650, "sex": "female" }, { "bill_length_mm": 36.2, "bill_depth_mm": 17.2, "flipper_length_mm": 187, "body_mass_g": 3150, "sex": "female" }, { "bill_length_mm": 53.5, "bill_depth_mm": 19.9, "flipper_length_mm": 205, "body_mass_g": 4500, "sex": "male" }, { "bill_length_mm": 36.5, "bill_depth_mm": 18, "flipper_length_mm": 182, "body_mass_g": 3150, "sex": "female" }, { "bill_length_mm": 50.8, "bill_depth_mm": 17.3, "flipper_length_mm": 228, "body_mass_g": 5600, "sex": "male" }, { "bill_length_mm": 45.5, "bill_depth_mm": 17, "flipper_length_mm": 196, "body_mass_g": 3500, "sex": "female" }, { "bill_length_mm": 46.5, "bill_depth_mm": 13.5, "flipper_length_mm": 210, "body_mass_g": 4550, "sex": "female" }, { "bill_length_mm": 50.8, "bill_depth_mm": 15.7, "flipper_length_mm": 226, "body_mass_g": 5200, "sex": "male" }, { "bill_length_mm": 38.9, "bill_depth_mm": 17.8, "flipper_length_mm": 181, "body_mass_g": 3625, "sex": "female" }, { "bill_length_mm": 46.4, "bill_depth_mm": 15.6, "flipper_length_mm": 221, "body_mass_g": 5e3, "sex": "male" }, { "bill_length_mm": 42.8, "bill_depth_mm": 18.5, "flipper_length_mm": 195, "body_mass_g": 4250, "sex": "male" }, { "bill_length_mm": 43.2, "bill_depth_mm": 14.5, "flipper_length_mm": 208, "body_mass_g": 4450, "sex": "female" }, { "bill_length_mm": 34.4, "bill_depth_mm": 18.4, "flipper_length_mm": 184, "body_mass_g": 3325, "sex": "female" }, { "bill_length_mm": 41, "bill_depth_mm": 20, "flipper_length_mm": 203, "body_mass_g": 4725, "sex": "male" }, { "bill_length_mm": 45.8, "bill_depth_mm": 14.2, "flipper_length_mm": 219, "body_mass_g": 4700, "sex": "female" }, { "bill_length_mm": 35.7, "bill_depth_mm": 18, "flipper_length_mm": 202, "body_mass_g": 3550, "sex": "female" }, { "bill_length_mm": 36, "bill_depth_mm": 17.8, "flipper_length_mm": 195, "body_mass_g": 3450, "sex": "female" }, { "bill_length_mm": 39.2, "bill_depth_mm": 19.6, "flipper_length_mm": 195, "body_mass_g": 4675, "sex": "male" }, { "bill_length_mm": 35.9, "bill_depth_mm": 19.2, "flipper_length_mm": 189, "body_mass_g": 3800, "sex": "female" }, { "bill_length_mm": 44, "bill_depth_mm": 13.6, "flipper_length_mm": 208, "body_mass_g": 4350, "sex": "female" }], "transformed_test": [[1.3091367504848355, 0.877270699293386, 0.16451000467236732, -0.11279257796742845, 0, 1, 0], [1.2906183403951872, 1.0320126138907155, -0.3273858040003055, -0.7945930812082445, 0, 1, 0], [1.5313576715606103, 39984990852050625e-20, 1.9212807499319131, 1.4987358842381366, 0, 1, 0], [1.1609894697676528, 0.877270699293386, 0.09423917486198548, -0.4846837615533281, 0, 1, 0], [-1.2464038418865704, 1.1867545284880434, -1.1706357617248875, -0.3607200336913616, 0, 1, 0], [0.19803214510596306, -0.8764709994763459, 1.3591141114488583, 1.0648628367212538, 0, 1, 0], [-0.9501092804522056, 0.2583030409040693, -0.6787399530522147, -1.1354933328286525, 1, 0, 0], [1.2535815202158922, -1.0827935522727852, 1.569926600880004, 1.6846814760310866, 0, 1, 0], [0.4758082964506811, -1.3922773814674434, 1.148301622017713, 0.8789172449283039, 1, 0, 0], [0.4202530661817381, -1.3406967432683339, 0.5861349835346583, 0.7549535170663374, 1, 0, 0], [-0.1352992365076981, 0.7225287846960563, -0.6084691232418328, -0.11279257796742845, 0, 1, 0], [-1.1352933813486843, 0.516206231899618, -0.538198293431451, -0.5466656254843114, 0, 1, 0], [0.23506896528525933, -0.36066461748524925, 1.569926600880004, 2.180536387478953, 0, 1, 0], [0.7721028578850474, -0.36066461748524925, -0.11657331456916001, -1.0735114688976692, 1, 0, 0], [-0.7834435896453736, 0.9288513374924946, -1.1706357617248875, -0.7945930812082445, 0, 1, 0], [-0.4871490282110087, 2.063625377872911, -0.39765663381068733, 0.2590986056184712, 0, 1, 0], [-0.15381764659734623, 1.0835932520898242, -0.2571149741899237, -0.8565749451392277, 0, 1, 0], [1.3646919807537785, 0.5677868700987267, -0.2571149741899237, -0.5466656254843114, 0, 1, 0], [1.494320851381314, 1.8573028250764705, 0.6564058133450401, 0.7549535170663374, 0, 1, 0], [-0.2464096970455856, -1.7533418488612122, 0.8672183027761856, 0.9408991088592873, 1, 0, 0], [0.19803214510596306, 0.10356112630673965, -0.2571149741899237, -0.236756305829395, 0, 0, 1], [0.19803214510596306, 0.10356112630673965, -0.2571149741899237, -0.236756305829395, 0, 0, 1], [0.2165505551956112, -1.3922773814674434, 0.6564058133450401, 0.2590986056184712, 1, 0, 0], [-1.635290453769176, 1.1867545284880434, -0.538198293431451, 0.011171149894538103, 0, 1, 0], [-0.26492810713523374, 1.8573028250764705, -0.2571149741899237, 0.3830623334804378, 0, 1, 0], [0.8832133184229348, -0.7217290848790172, 0.5158641537242764, 1.4367540203071534, 0, 1, 0], [-1.1352933813486843, 39984990852050625e-20, -1.0300941021041239, -1.1045024008631608, 0, 0, 1], [-0.6908515391971343, 1.5478189958818132, -0.046302484758778184, -0.26774723779488663, 0, 1, 0], [-1.1723302015279793, 1.0320126138907155, -0.4679274636210692, -0.5466656254843114, 0, 1, 0], [1.3276551605744835, -0.30908397928613873, 1.7104682605007675, 1.3127902924451869, 0, 1, 0], [-2.190842756458612, -0.8248903612772364, -0.8895524424833602, -1.4144117205180773, 1, 0, 0], [-0.6167778988385431, 0.7741094228951668, -1.2409065915352693, -0.7945930812082445, 0, 1, 0], [-0.9130724602729092, 0.8256900610942755, -1.1003649319145057, -0.6706293533462779, 0, 1, 0], [-0.33900174749382495, 1.0320126138907155, -0.39765663381068733, -0.236756305829395, 0, 1, 0], [-0.26492810713523374, -0.2059227028879196, -0.959823272293742, -1.0425205369321775, 1, 0, 0], [0.5498819368092723, -1.2891161050692244, 1.4996557710696221, 0.8479263129628123, 1, 0, 0], [0.994323778960821, -0.7217290848790172, 1.148301622017713, 2.056572659616986, 0, 1, 0], [1.3646919807537785, 1.0835932520898242, -0.538198293431451, -0.6706293533462779, 0, 1, 0], [1.438765621112371, 1.6509802722800322, -0.4679274636210692, -0.5156746935188198, 0, 1, 0], [0.1054400946577237, -1.443858019666553, 1.0780307922073311, -0.11279257796742845, 0, 0, 1], [0.938768548691878, -0.515406532082577, 1.0780307922073311, 1.6846814760310866, 0, 1, 0], [-0.6167778988385431, 0.05198048810762916, -0.959823272293742, -0.8875658771047193, 0, 1, 0], [1.2350631101262441, 1.1867545284880434, -0.538198293431451, -0.4846837615533281, 0, 1, 0], [0.6054371670782168, -1.7533418488612122, 0.9374891325865674, 0.9099081768937956, 1, 0, 0], [0.9758053688711742, -0.9796322758745659, 1.4293849412592403, 2.6144094349958356, 0, 1, 0], [-1.598253633589881, 0.9288513374924946, -0.959823272293742, -0.4846837615533281, 1, 0, 0], [-0.8204804098246699, 0.36146431730228845, -0.8895524424833602, -1.1045024008631608, 1, 0, 0], [0.17951373501631493, -1.9596644016576505, 0.8672183027761856, 1.126844700652237, 1, 0, 0], [-0.9686276905418524, 0.9804319756916051, -0.39765663381068733, -0.9185568090702111, 1, 0, 0], [1.216544700036596, -0.9796322758745659, 1.0780307922073311, 1.0028809727902706, 1, 0, 0], [-1.3575143024244578, 0.36146431730228845, -1.1003649319145057, -0.6086474894152947, 1, 0, 0], [0.29062419555420244, -1.3406967432683339, 0.7969474729658038, 0.6929716531353541, 1, 0, 0], [0.08692168456807557, 0.10356112630673965, 1.2888432816384765, 1.3127902924451869, 0, 1, 0], [0.031366454299132485, 1.341496443085373, -0.3273858040003055, 0.2590986056184712, 0, 1, 0], [1.9017258733535678, 1.9088834632755811, 0.023968345051603647, 0.13513487775650465, 0, 1, 0], [-1.07973815107974, -0.30908397928613873, -0.18684414437954183, -0.45369282958783647, 1, 0, 0], [-1.3575143024244578, 0.6709481464969459, -1.1706357617248875, -0.8875658771047193, 1, 0, 0], [1.0313605991401174, 0.9804319756916051, -0.046302484758778184, -0.4846837615533281, 0, 1, 0], [0.8461764982436386, 0.20672240270495879, -0.6787399530522147, -0.9805386730011943, 0, 1, 0], [1.216544700036596, 1.2899158048862644, 0.023968345051603647, -0.17477444189841174, 0, 1, 0], [-1.5241799932312885, -0.05118078829058998, -0.8192816126729783, -1.0425205369321775, 1, 0, 0], [-0.09826241632840314, -1.3922773814674434, 1.2185724518280947, 0.5070260613424044, 1, 0, 0], [-0.7834435896453736, 0.6709481464969459, -0.7490107828625965, -0.3607200336913616, 0, 1, 0], [2.0683915641603985, -0.5669871702816875, 2.0618224095526765, 2.056572659616986, 0, 1, 0], [-0.4501122080317124, 0.6193675082978372, -0.39765663381068733, 0.13513487775650465, 0, 1, 0], [-0.1352992365076981, -0.25750334108702827, -0.959823272293742, -1.600357312311027, 1, 0, 0], [-0.5612226685695999, -1.7533418488612122, 0.9374891325865674, 0.5690079252733876, 1, 0, 0], [-1.4315879427830491, 0.05198048810762916, -0.959823272293742, -1.2904479926561108, 1, 0, 0], [1.772097002726032, 1.4446577194835921, 0.30505166429313096, 0.3830623334804378, 0, 1, 0], [-1.376032712514106, 0.46462559370050754, -1.311177421345651, -1.2904479926561108, 1, 0, 0], [1.2720999303055391, 0.10356112630673965, 1.9212807499319131, 1.74666333996207, 0, 1, 0], [0.29062419555420244, -0.05118078829058998, -0.3273858040003055, -0.8565749451392277, 1, 0, 0], [0.4758082964506811, -1.8565031252594315, 0.6564058133450401, 0.44504419741142104, 1, 0, 0], [1.2720999303055391, -0.7217290848790172, 1.7807390903111493, 1.2508084285142036, 0, 1, 0], [-0.9315908703625574, 0.36146431730228845, -1.3814482511560329, -0.7016202853117696, 1, 0, 0], [0.457289886361033, -0.7733097230781267, 1.4293849412592403, 1.0028809727902706, 0, 1, 0], [-0.20937287686629064, 0.7225287846960563, -0.39765663381068733, 0.07315301382552138, 0, 1, 0], [-0.1352992365076981, -1.3406967432683339, 0.5158641537242764, 0.32108046954945446, 1, 0, 0], [-1.7649193243967116, 0.6709481464969459, -1.1706357617248875, -1.0735114688976692, 1, 0, 0], [-0.5427042584799519, 1.4962383576827027, 0.16451000467236732, 0.6619807211698625, 0, 1, 0], [0.34617942582314554, -1.4954386578656635, 1.2888432816384765, 0.6309897892043709, 1, 0, 0], [-1.5241799932312885, 0.46462559370050754, 0.09423917486198548, -0.7945930812082445, 1, 0, 0], [-1.4686247629623455, 0.36146431730228845, -0.39765663381068733, -0.9185568090702111, 1, 0, 0], [-0.876035640093613, 1.2899158048862644, -0.39765663381068733, 0.5999988572388792, 0, 1, 0], [-1.4871431730519935, 1.0835932520898242, -0.8192816126729783, -0.4846837615533281, 1, 0, 0], [0.01284804420948435, -1.8049224870603218, 0.5158641537242764, 0.19711674168748794, 1, 0, 0]], "predictions": ["Chinstrap", "Chinstrap", "Gentoo", "Chinstrap", "Adelie", "Gentoo", "Adelie", "Gentoo", "Gentoo", "Gentoo", "Adelie", "Adelie", "Gentoo", "Chinstrap", "Adelie", "Adelie", "Adelie", "Chinstrap", "Chinstrap", "Gentoo", "Chinstrap", "Chinstrap", "Gentoo", "Adelie", "Adelie", "Gentoo", "Adelie", "Adelie", "Adelie", "Gentoo", "Adelie", "Adelie", "Adelie", "Adelie", "Chinstrap", "Gentoo", "Gentoo", "Chinstrap", "Chinstrap", "Gentoo", "Gentoo", "Adelie", "Chinstrap", "Gentoo", "Gentoo", "Adelie", "Adelie", "Gentoo", "Adelie", "Gentoo", "Adelie", "Gentoo", "Gentoo", "Adelie", "Chinstrap", "Adelie", "Adelie", "Chinstrap", "Chinstrap", "Chinstrap", "Adelie", "Gentoo", "Adelie", "Gentoo", "Adelie", "Chinstrap", "Gentoo", "Adelie", "Chinstrap", "Adelie", "Gentoo", "Chinstrap", "Gentoo", "Gentoo", "Adelie", "Gentoo", "Adelie", "Gentoo", "Adelie", "Adelie", "Gentoo", "Adelie", "Adelie", "Adelie", "Adelie", "Gentoo"], "truth": ["Chinstrap", "Chinstrap", "Gentoo", "Chinstrap", "Adelie", "Gentoo", "Adelie", "Gentoo", "Gentoo", "Gentoo", "Adelie", "Adelie", "Gentoo", "Chinstrap", "Adelie", "Adelie", "Adelie", "Chinstrap", "Chinstrap", "Gentoo", "Gentoo", "Adelie", "Gentoo", "Adelie", "Adelie", "Gentoo", "Adelie", "Adelie", "Adelie", "Gentoo", "Adelie", "Adelie", "Adelie", "Adelie", "Chinstrap", "Gentoo", "Gentoo", "Chinstrap", "Chinstrap", "Gentoo", "Gentoo", "Adelie", "Chinstrap", "Gentoo", "Gentoo", "Adelie", "Adelie", "Gentoo", "Adelie", "Gentoo", "Adelie", "Gentoo", "Gentoo", "Adelie", "Chinstrap", "Adelie", "Adelie", "Chinstrap", "Chinstrap", "Chinstrap", "Adelie", "Gentoo", "Adelie", "Gentoo", "Adelie", "Chinstrap", "Gentoo", "Adelie", "Chinstrap", "Adelie", "Gentoo", "Chinstrap", "Gentoo", "Gentoo", "Adelie", "Gentoo", "Adelie", "Gentoo", "Adelie", "Adelie", "Gentoo", "Adelie", "Adelie", "Adelie", "Adelie", "Gentoo"] }, "scale_fixture": { "standard": { "values": [-0.5382846166435669, -0.512652015851016, -0.48701941505846524, -0.46138681426591444, 1.9993428618189626], "new_150": 3.2809729014465026 }, "minmax": { "values": [0, 0.010101010101010102, 0.0202020202020202, 0.030303030303030304, 1], "new_150": 1.5050505050505052 }, "robust": { "values": [-1, -0.5, 0, 0.5, 48.5], "new_150": 73.5 } }, "target_encoding": { "categories": ["A", "A", "B", "B", "C", "C"], "target": [1, 1, 0, 0, 1, 0], "folds": [0, 1, 0, 1, 0, 1], "encoded": [0.5555555555555555, 0.7777777777777777, 0.2222222222222222, 0.4444444444444444, 0.2222222222222222, 0.7777777777777777], "fold_records": [{ "held_fold": 0, "prior": 0.3333333333333333, "encoded_rows": [0, 2, 4] }, { "held_fold": 1, "prior": 0.6666666666666666, "encoded_rows": [1, 3, 5] }], "changed_target": [0, 1, 0, 0, 1, 0], "changed_encoded": [0.5555555555555555, 0.2222222222222222, 0.2222222222222222, 0.2222222222222222, 0.2222222222222222, 0.5555555555555555] }, "knn_imputed": [[2, 12, 200]] };
var observations = [{ "species": "Adelie", "island": "Torgersen", "bill_length_mm": 39.1, "bill_depth_mm": 18.7, "flipper_length_mm": 181, "body_mass_g": 3750, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 39.5, "bill_depth_mm": 17.4, "flipper_length_mm": 186, "body_mass_g": 3800, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 40.3, "bill_depth_mm": 18, "flipper_length_mm": 195, "body_mass_g": 3250, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": null, "bill_depth_mm": null, "flipper_length_mm": null, "body_mass_g": null, "sex": null, "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 36.7, "bill_depth_mm": 19.3, "flipper_length_mm": 193, "body_mass_g": 3450, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 39.3, "bill_depth_mm": 20.6, "flipper_length_mm": 190, "body_mass_g": 3650, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 38.9, "bill_depth_mm": 17.8, "flipper_length_mm": 181, "body_mass_g": 3625, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 39.2, "bill_depth_mm": 19.6, "flipper_length_mm": 195, "body_mass_g": 4675, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 34.1, "bill_depth_mm": 18.1, "flipper_length_mm": 193, "body_mass_g": 3475, "sex": null, "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 42, "bill_depth_mm": 20.2, "flipper_length_mm": 190, "body_mass_g": 4250, "sex": null, "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 37.8, "bill_depth_mm": 17.1, "flipper_length_mm": 186, "body_mass_g": 3300, "sex": null, "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 37.8, "bill_depth_mm": 17.3, "flipper_length_mm": 180, "body_mass_g": 3700, "sex": null, "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 41.1, "bill_depth_mm": 17.6, "flipper_length_mm": 182, "body_mass_g": 3200, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 38.6, "bill_depth_mm": 21.2, "flipper_length_mm": 191, "body_mass_g": 3800, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 34.6, "bill_depth_mm": 21.1, "flipper_length_mm": 198, "body_mass_g": 4400, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 36.6, "bill_depth_mm": 17.8, "flipper_length_mm": 185, "body_mass_g": 3700, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 38.7, "bill_depth_mm": 19, "flipper_length_mm": 195, "body_mass_g": 3450, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 42.5, "bill_depth_mm": 20.7, "flipper_length_mm": 197, "body_mass_g": 4500, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 34.4, "bill_depth_mm": 18.4, "flipper_length_mm": 184, "body_mass_g": 3325, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 46, "bill_depth_mm": 21.5, "flipper_length_mm": 194, "body_mass_g": 4200, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 37.8, "bill_depth_mm": 18.3, "flipper_length_mm": 174, "body_mass_g": 3400, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 37.7, "bill_depth_mm": 18.7, "flipper_length_mm": 180, "body_mass_g": 3600, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 35.9, "bill_depth_mm": 19.2, "flipper_length_mm": 189, "body_mass_g": 3800, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 38.2, "bill_depth_mm": 18.1, "flipper_length_mm": 185, "body_mass_g": 3950, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 38.8, "bill_depth_mm": 17.2, "flipper_length_mm": 180, "body_mass_g": 3800, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 35.3, "bill_depth_mm": 18.9, "flipper_length_mm": 187, "body_mass_g": 3800, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 40.6, "bill_depth_mm": 18.6, "flipper_length_mm": 183, "body_mass_g": 3550, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 40.5, "bill_depth_mm": 17.9, "flipper_length_mm": 187, "body_mass_g": 3200, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 37.9, "bill_depth_mm": 18.6, "flipper_length_mm": 172, "body_mass_g": 3150, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 40.5, "bill_depth_mm": 18.9, "flipper_length_mm": 180, "body_mass_g": 3950, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 39.5, "bill_depth_mm": 16.7, "flipper_length_mm": 178, "body_mass_g": 3250, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 37.2, "bill_depth_mm": 18.1, "flipper_length_mm": 178, "body_mass_g": 3900, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 39.5, "bill_depth_mm": 17.8, "flipper_length_mm": 188, "body_mass_g": 3300, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 40.9, "bill_depth_mm": 18.9, "flipper_length_mm": 184, "body_mass_g": 3900, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36.4, "bill_depth_mm": 17, "flipper_length_mm": 195, "body_mass_g": 3325, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 39.2, "bill_depth_mm": 21.1, "flipper_length_mm": 196, "body_mass_g": 4150, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 38.8, "bill_depth_mm": 20, "flipper_length_mm": 190, "body_mass_g": 3950, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 42.2, "bill_depth_mm": 18.5, "flipper_length_mm": 180, "body_mass_g": 3550, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 37.6, "bill_depth_mm": 19.3, "flipper_length_mm": 181, "body_mass_g": 3300, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 39.8, "bill_depth_mm": 19.1, "flipper_length_mm": 184, "body_mass_g": 4650, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36.5, "bill_depth_mm": 18, "flipper_length_mm": 182, "body_mass_g": 3150, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 40.8, "bill_depth_mm": 18.4, "flipper_length_mm": 195, "body_mass_g": 3900, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36, "bill_depth_mm": 18.5, "flipper_length_mm": 186, "body_mass_g": 3100, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 44.1, "bill_depth_mm": 19.7, "flipper_length_mm": 196, "body_mass_g": 4400, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 37, "bill_depth_mm": 16.9, "flipper_length_mm": 185, "body_mass_g": 3e3, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 39.6, "bill_depth_mm": 18.8, "flipper_length_mm": 190, "body_mass_g": 4600, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 41.1, "bill_depth_mm": 19, "flipper_length_mm": 182, "body_mass_g": 3425, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 37.5, "bill_depth_mm": 18.9, "flipper_length_mm": 179, "body_mass_g": 2975, "sex": null, "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36, "bill_depth_mm": 17.9, "flipper_length_mm": 190, "body_mass_g": 3450, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 42.3, "bill_depth_mm": 21.2, "flipper_length_mm": 191, "body_mass_g": 4150, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 39.6, "bill_depth_mm": 17.7, "flipper_length_mm": 186, "body_mass_g": 3500, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 40.1, "bill_depth_mm": 18.9, "flipper_length_mm": 188, "body_mass_g": 4300, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 35, "bill_depth_mm": 17.9, "flipper_length_mm": 190, "body_mass_g": 3450, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 42, "bill_depth_mm": 19.5, "flipper_length_mm": 200, "body_mass_g": 4050, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 34.5, "bill_depth_mm": 18.1, "flipper_length_mm": 187, "body_mass_g": 2900, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 41.4, "bill_depth_mm": 18.6, "flipper_length_mm": 191, "body_mass_g": 3700, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 39, "bill_depth_mm": 17.5, "flipper_length_mm": 186, "body_mass_g": 3550, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 40.6, "bill_depth_mm": 18.8, "flipper_length_mm": 193, "body_mass_g": 3800, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 36.5, "bill_depth_mm": 16.6, "flipper_length_mm": 181, "body_mass_g": 2850, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 37.6, "bill_depth_mm": 19.1, "flipper_length_mm": 194, "body_mass_g": 3750, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 35.7, "bill_depth_mm": 16.9, "flipper_length_mm": 185, "body_mass_g": 3150, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 41.3, "bill_depth_mm": 21.1, "flipper_length_mm": 195, "body_mass_g": 4400, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 37.6, "bill_depth_mm": 17, "flipper_length_mm": 185, "body_mass_g": 3600, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 41.1, "bill_depth_mm": 18.2, "flipper_length_mm": 192, "body_mass_g": 4050, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 36.4, "bill_depth_mm": 17.1, "flipper_length_mm": 184, "body_mass_g": 2850, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 41.6, "bill_depth_mm": 18, "flipper_length_mm": 192, "body_mass_g": 3950, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 35.5, "bill_depth_mm": 16.2, "flipper_length_mm": 195, "body_mass_g": 3350, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 41.1, "bill_depth_mm": 19.1, "flipper_length_mm": 188, "body_mass_g": 4100, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 35.9, "bill_depth_mm": 16.6, "flipper_length_mm": 190, "body_mass_g": 3050, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 41.8, "bill_depth_mm": 19.4, "flipper_length_mm": 198, "body_mass_g": 4450, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 33.5, "bill_depth_mm": 19, "flipper_length_mm": 190, "body_mass_g": 3600, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 39.7, "bill_depth_mm": 18.4, "flipper_length_mm": 190, "body_mass_g": 3900, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 39.6, "bill_depth_mm": 17.2, "flipper_length_mm": 196, "body_mass_g": 3550, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 45.8, "bill_depth_mm": 18.9, "flipper_length_mm": 197, "body_mass_g": 4150, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 35.5, "bill_depth_mm": 17.5, "flipper_length_mm": 190, "body_mass_g": 3700, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 42.8, "bill_depth_mm": 18.5, "flipper_length_mm": 195, "body_mass_g": 4250, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 40.9, "bill_depth_mm": 16.8, "flipper_length_mm": 191, "body_mass_g": 3700, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 37.2, "bill_depth_mm": 19.4, "flipper_length_mm": 184, "body_mass_g": 3900, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 36.2, "bill_depth_mm": 16.1, "flipper_length_mm": 187, "body_mass_g": 3550, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 42.1, "bill_depth_mm": 19.1, "flipper_length_mm": 195, "body_mass_g": 4e3, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 34.6, "bill_depth_mm": 17.2, "flipper_length_mm": 189, "body_mass_g": 3200, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 42.9, "bill_depth_mm": 17.6, "flipper_length_mm": 196, "body_mass_g": 4700, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 36.7, "bill_depth_mm": 18.8, "flipper_length_mm": 187, "body_mass_g": 3800, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 35.1, "bill_depth_mm": 19.4, "flipper_length_mm": 193, "body_mass_g": 4200, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 37.3, "bill_depth_mm": 17.8, "flipper_length_mm": 191, "body_mass_g": 3350, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 41.3, "bill_depth_mm": 20.3, "flipper_length_mm": 194, "body_mass_g": 3550, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36.3, "bill_depth_mm": 19.5, "flipper_length_mm": 190, "body_mass_g": 3800, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36.9, "bill_depth_mm": 18.6, "flipper_length_mm": 189, "body_mass_g": 3500, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 38.3, "bill_depth_mm": 19.2, "flipper_length_mm": 189, "body_mass_g": 3950, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 38.9, "bill_depth_mm": 18.8, "flipper_length_mm": 190, "body_mass_g": 3600, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 35.7, "bill_depth_mm": 18, "flipper_length_mm": 202, "body_mass_g": 3550, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 41.1, "bill_depth_mm": 18.1, "flipper_length_mm": 205, "body_mass_g": 4300, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 34, "bill_depth_mm": 17.1, "flipper_length_mm": 185, "body_mass_g": 3400, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 39.6, "bill_depth_mm": 18.1, "flipper_length_mm": 186, "body_mass_g": 4450, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36.2, "bill_depth_mm": 17.3, "flipper_length_mm": 187, "body_mass_g": 3300, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 40.8, "bill_depth_mm": 18.9, "flipper_length_mm": 208, "body_mass_g": 4300, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 38.1, "bill_depth_mm": 18.6, "flipper_length_mm": 190, "body_mass_g": 3700, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 40.3, "bill_depth_mm": 18.5, "flipper_length_mm": 196, "body_mass_g": 4350, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 33.1, "bill_depth_mm": 16.1, "flipper_length_mm": 178, "body_mass_g": 2900, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 43.2, "bill_depth_mm": 18.5, "flipper_length_mm": 192, "body_mass_g": 4100, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 35, "bill_depth_mm": 17.9, "flipper_length_mm": 192, "body_mass_g": 3725, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 41, "bill_depth_mm": 20, "flipper_length_mm": 203, "body_mass_g": 4725, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 37.7, "bill_depth_mm": 16, "flipper_length_mm": 183, "body_mass_g": 3075, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 37.8, "bill_depth_mm": 20, "flipper_length_mm": 190, "body_mass_g": 4250, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 37.9, "bill_depth_mm": 18.6, "flipper_length_mm": 193, "body_mass_g": 2925, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 39.7, "bill_depth_mm": 18.9, "flipper_length_mm": 184, "body_mass_g": 3550, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 38.6, "bill_depth_mm": 17.2, "flipper_length_mm": 199, "body_mass_g": 3750, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 38.2, "bill_depth_mm": 20, "flipper_length_mm": 190, "body_mass_g": 3900, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 38.1, "bill_depth_mm": 17, "flipper_length_mm": 181, "body_mass_g": 3175, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 43.2, "bill_depth_mm": 19, "flipper_length_mm": 197, "body_mass_g": 4775, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 38.1, "bill_depth_mm": 16.5, "flipper_length_mm": 198, "body_mass_g": 3825, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 45.6, "bill_depth_mm": 20.3, "flipper_length_mm": 191, "body_mass_g": 4600, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 39.7, "bill_depth_mm": 17.7, "flipper_length_mm": 193, "body_mass_g": 3200, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 42.2, "bill_depth_mm": 19.5, "flipper_length_mm": 197, "body_mass_g": 4275, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 39.6, "bill_depth_mm": 20.7, "flipper_length_mm": 191, "body_mass_g": 3900, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 42.7, "bill_depth_mm": 18.3, "flipper_length_mm": 196, "body_mass_g": 4075, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 38.6, "bill_depth_mm": 17, "flipper_length_mm": 188, "body_mass_g": 2900, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 37.3, "bill_depth_mm": 20.5, "flipper_length_mm": 199, "body_mass_g": 3775, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 35.7, "bill_depth_mm": 17, "flipper_length_mm": 189, "body_mass_g": 3350, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 41.1, "bill_depth_mm": 18.6, "flipper_length_mm": 189, "body_mass_g": 3325, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 36.2, "bill_depth_mm": 17.2, "flipper_length_mm": 187, "body_mass_g": 3150, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 37.7, "bill_depth_mm": 19.8, "flipper_length_mm": 198, "body_mass_g": 3500, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 40.2, "bill_depth_mm": 17, "flipper_length_mm": 176, "body_mass_g": 3450, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 41.4, "bill_depth_mm": 18.5, "flipper_length_mm": 202, "body_mass_g": 3875, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 35.2, "bill_depth_mm": 15.9, "flipper_length_mm": 186, "body_mass_g": 3050, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 40.6, "bill_depth_mm": 19, "flipper_length_mm": 199, "body_mass_g": 4e3, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 38.8, "bill_depth_mm": 17.6, "flipper_length_mm": 191, "body_mass_g": 3275, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 41.5, "bill_depth_mm": 18.3, "flipper_length_mm": 195, "body_mass_g": 4300, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 39, "bill_depth_mm": 17.1, "flipper_length_mm": 191, "body_mass_g": 3050, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 44.1, "bill_depth_mm": 18, "flipper_length_mm": 210, "body_mass_g": 4e3, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 38.5, "bill_depth_mm": 17.9, "flipper_length_mm": 190, "body_mass_g": 3325, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 43.1, "bill_depth_mm": 19.2, "flipper_length_mm": 197, "body_mass_g": 3500, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36.8, "bill_depth_mm": 18.5, "flipper_length_mm": 193, "body_mass_g": 3500, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 37.5, "bill_depth_mm": 18.5, "flipper_length_mm": 199, "body_mass_g": 4475, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 38.1, "bill_depth_mm": 17.6, "flipper_length_mm": 187, "body_mass_g": 3425, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 41.1, "bill_depth_mm": 17.5, "flipper_length_mm": 190, "body_mass_g": 3900, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 35.6, "bill_depth_mm": 17.5, "flipper_length_mm": 191, "body_mass_g": 3175, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 40.2, "bill_depth_mm": 20.1, "flipper_length_mm": 200, "body_mass_g": 3975, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 37, "bill_depth_mm": 16.5, "flipper_length_mm": 185, "body_mass_g": 3400, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 39.7, "bill_depth_mm": 17.9, "flipper_length_mm": 193, "body_mass_g": 4250, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 40.2, "bill_depth_mm": 17.1, "flipper_length_mm": 193, "body_mass_g": 3400, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 40.6, "bill_depth_mm": 17.2, "flipper_length_mm": 187, "body_mass_g": 3475, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 32.1, "bill_depth_mm": 15.5, "flipper_length_mm": 188, "body_mass_g": 3050, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 40.7, "bill_depth_mm": 17, "flipper_length_mm": 190, "body_mass_g": 3725, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 37.3, "bill_depth_mm": 16.8, "flipper_length_mm": 192, "body_mass_g": 3e3, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 39, "bill_depth_mm": 18.7, "flipper_length_mm": 185, "body_mass_g": 3650, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 39.2, "bill_depth_mm": 18.6, "flipper_length_mm": 190, "body_mass_g": 4250, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36.6, "bill_depth_mm": 18.4, "flipper_length_mm": 184, "body_mass_g": 3475, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36, "bill_depth_mm": 17.8, "flipper_length_mm": 195, "body_mass_g": 3450, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 37.8, "bill_depth_mm": 18.1, "flipper_length_mm": 193, "body_mass_g": 3750, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36, "bill_depth_mm": 17.1, "flipper_length_mm": 187, "body_mass_g": 3700, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 41.5, "bill_depth_mm": 18.5, "flipper_length_mm": 201, "body_mass_g": 4e3, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.1, "bill_depth_mm": 13.2, "flipper_length_mm": 211, "body_mass_g": 4500, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50, "bill_depth_mm": 16.3, "flipper_length_mm": 230, "body_mass_g": 5700, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.7, "bill_depth_mm": 14.1, "flipper_length_mm": 210, "body_mass_g": 4450, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50, "bill_depth_mm": 15.2, "flipper_length_mm": 218, "body_mass_g": 5700, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.6, "bill_depth_mm": 14.5, "flipper_length_mm": 215, "body_mass_g": 5400, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.5, "bill_depth_mm": 13.5, "flipper_length_mm": 210, "body_mass_g": 4550, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.4, "bill_depth_mm": 14.6, "flipper_length_mm": 211, "body_mass_g": 4800, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.7, "bill_depth_mm": 15.3, "flipper_length_mm": 219, "body_mass_g": 5200, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 43.3, "bill_depth_mm": 13.4, "flipper_length_mm": 209, "body_mass_g": 4400, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.8, "bill_depth_mm": 15.4, "flipper_length_mm": 215, "body_mass_g": 5150, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 40.9, "bill_depth_mm": 13.7, "flipper_length_mm": 214, "body_mass_g": 4650, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49, "bill_depth_mm": 16.1, "flipper_length_mm": 216, "body_mass_g": 5550, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.5, "bill_depth_mm": 13.7, "flipper_length_mm": 214, "body_mass_g": 4650, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.4, "bill_depth_mm": 14.6, "flipper_length_mm": 213, "body_mass_g": 5850, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.8, "bill_depth_mm": 14.6, "flipper_length_mm": 210, "body_mass_g": 4200, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.3, "bill_depth_mm": 15.7, "flipper_length_mm": 217, "body_mass_g": 5850, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 42, "bill_depth_mm": 13.5, "flipper_length_mm": 210, "body_mass_g": 4150, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.2, "bill_depth_mm": 15.2, "flipper_length_mm": 221, "body_mass_g": 6300, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.2, "bill_depth_mm": 14.5, "flipper_length_mm": 209, "body_mass_g": 4800, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.7, "bill_depth_mm": 15.1, "flipper_length_mm": 222, "body_mass_g": 5350, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50.2, "bill_depth_mm": 14.3, "flipper_length_mm": 218, "body_mass_g": 5700, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.1, "bill_depth_mm": 14.5, "flipper_length_mm": 215, "body_mass_g": 5e3, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.5, "bill_depth_mm": 14.5, "flipper_length_mm": 213, "body_mass_g": 4400, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.3, "bill_depth_mm": 15.8, "flipper_length_mm": 215, "body_mass_g": 5050, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 42.9, "bill_depth_mm": 13.1, "flipper_length_mm": 215, "body_mass_g": 5e3, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.1, "bill_depth_mm": 15.1, "flipper_length_mm": 215, "body_mass_g": 5100, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 44.5, "bill_depth_mm": 14.3, "flipper_length_mm": 216, "body_mass_g": 4100, "sex": null, "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.8, "bill_depth_mm": 15, "flipper_length_mm": 215, "body_mass_g": 5650, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.2, "bill_depth_mm": 14.3, "flipper_length_mm": 210, "body_mass_g": 4600, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50, "bill_depth_mm": 15.3, "flipper_length_mm": 220, "body_mass_g": 5550, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.3, "bill_depth_mm": 15.3, "flipper_length_mm": 222, "body_mass_g": 5250, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 42.8, "bill_depth_mm": 14.2, "flipper_length_mm": 209, "body_mass_g": 4700, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.1, "bill_depth_mm": 14.5, "flipper_length_mm": 207, "body_mass_g": 5050, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 59.6, "bill_depth_mm": 17, "flipper_length_mm": 230, "body_mass_g": 6050, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.1, "bill_depth_mm": 14.8, "flipper_length_mm": 220, "body_mass_g": 5150, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.4, "bill_depth_mm": 16.3, "flipper_length_mm": 220, "body_mass_g": 5400, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 42.6, "bill_depth_mm": 13.7, "flipper_length_mm": 213, "body_mass_g": 4950, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 44.4, "bill_depth_mm": 17.3, "flipper_length_mm": 219, "body_mass_g": 5250, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 44, "bill_depth_mm": 13.6, "flipper_length_mm": 208, "body_mass_g": 4350, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.7, "bill_depth_mm": 15.7, "flipper_length_mm": 208, "body_mass_g": 5350, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 42.7, "bill_depth_mm": 13.7, "flipper_length_mm": 208, "body_mass_g": 3950, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.6, "bill_depth_mm": 16, "flipper_length_mm": 225, "body_mass_g": 5700, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.3, "bill_depth_mm": 13.7, "flipper_length_mm": 210, "body_mass_g": 4300, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.6, "bill_depth_mm": 15, "flipper_length_mm": 216, "body_mass_g": 4750, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50.5, "bill_depth_mm": 15.9, "flipper_length_mm": 222, "body_mass_g": 5550, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 43.6, "bill_depth_mm": 13.9, "flipper_length_mm": 217, "body_mass_g": 4900, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.5, "bill_depth_mm": 13.9, "flipper_length_mm": 210, "body_mass_g": 4200, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50.5, "bill_depth_mm": 15.9, "flipper_length_mm": 225, "body_mass_g": 5400, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 44.9, "bill_depth_mm": 13.3, "flipper_length_mm": 213, "body_mass_g": 5100, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.2, "bill_depth_mm": 15.8, "flipper_length_mm": 215, "body_mass_g": 5300, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.6, "bill_depth_mm": 14.2, "flipper_length_mm": 210, "body_mass_g": 4850, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.5, "bill_depth_mm": 14.1, "flipper_length_mm": 220, "body_mass_g": 5300, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.1, "bill_depth_mm": 14.4, "flipper_length_mm": 210, "body_mass_g": 4400, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50.1, "bill_depth_mm": 15, "flipper_length_mm": 225, "body_mass_g": 5e3, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.5, "bill_depth_mm": 14.4, "flipper_length_mm": 217, "body_mass_g": 4900, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45, "bill_depth_mm": 15.4, "flipper_length_mm": 220, "body_mass_g": 5050, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 43.8, "bill_depth_mm": 13.9, "flipper_length_mm": 208, "body_mass_g": 4300, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.5, "bill_depth_mm": 15, "flipper_length_mm": 220, "body_mass_g": 5e3, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 43.2, "bill_depth_mm": 14.5, "flipper_length_mm": 208, "body_mass_g": 4450, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50.4, "bill_depth_mm": 15.3, "flipper_length_mm": 224, "body_mass_g": 5550, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.3, "bill_depth_mm": 13.8, "flipper_length_mm": 208, "body_mass_g": 4200, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.2, "bill_depth_mm": 14.9, "flipper_length_mm": 221, "body_mass_g": 5300, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.7, "bill_depth_mm": 13.9, "flipper_length_mm": 214, "body_mass_g": 4400, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 54.3, "bill_depth_mm": 15.7, "flipper_length_mm": 231, "body_mass_g": 5650, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.8, "bill_depth_mm": 14.2, "flipper_length_mm": 219, "body_mass_g": 4700, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.8, "bill_depth_mm": 16.8, "flipper_length_mm": 230, "body_mass_g": 5700, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.2, "bill_depth_mm": 14.4, "flipper_length_mm": 214, "body_mass_g": 4650, "sex": null, "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.5, "bill_depth_mm": 16.2, "flipper_length_mm": 229, "body_mass_g": 5800, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 43.5, "bill_depth_mm": 14.2, "flipper_length_mm": 220, "body_mass_g": 4700, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50.7, "bill_depth_mm": 15, "flipper_length_mm": 223, "body_mass_g": 5550, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.7, "bill_depth_mm": 15, "flipper_length_mm": 216, "body_mass_g": 4750, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.4, "bill_depth_mm": 15.6, "flipper_length_mm": 221, "body_mass_g": 5e3, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.2, "bill_depth_mm": 15.6, "flipper_length_mm": 221, "body_mass_g": 5100, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.5, "bill_depth_mm": 14.8, "flipper_length_mm": 217, "body_mass_g": 5200, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.4, "bill_depth_mm": 15, "flipper_length_mm": 216, "body_mass_g": 4700, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.6, "bill_depth_mm": 16, "flipper_length_mm": 230, "body_mass_g": 5800, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.5, "bill_depth_mm": 14.2, "flipper_length_mm": 209, "body_mass_g": 4600, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 51.1, "bill_depth_mm": 16.3, "flipper_length_mm": 220, "body_mass_g": 6e3, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.2, "bill_depth_mm": 13.8, "flipper_length_mm": 215, "body_mass_g": 4750, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.2, "bill_depth_mm": 16.4, "flipper_length_mm": 223, "body_mass_g": 5950, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.1, "bill_depth_mm": 14.5, "flipper_length_mm": 212, "body_mass_g": 4625, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 52.5, "bill_depth_mm": 15.6, "flipper_length_mm": 221, "body_mass_g": 5450, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.4, "bill_depth_mm": 14.6, "flipper_length_mm": 212, "body_mass_g": 4725, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50, "bill_depth_mm": 15.9, "flipper_length_mm": 224, "body_mass_g": 5350, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 44.9, "bill_depth_mm": 13.8, "flipper_length_mm": 212, "body_mass_g": 4750, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50.8, "bill_depth_mm": 17.3, "flipper_length_mm": 228, "body_mass_g": 5600, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 43.4, "bill_depth_mm": 14.4, "flipper_length_mm": 218, "body_mass_g": 4600, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 51.3, "bill_depth_mm": 14.2, "flipper_length_mm": 218, "body_mass_g": 5300, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.5, "bill_depth_mm": 14, "flipper_length_mm": 212, "body_mass_g": 4875, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 52.1, "bill_depth_mm": 17, "flipper_length_mm": 230, "body_mass_g": 5550, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.5, "bill_depth_mm": 15, "flipper_length_mm": 218, "body_mass_g": 4950, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 52.2, "bill_depth_mm": 17.1, "flipper_length_mm": 228, "body_mass_g": 5400, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.5, "bill_depth_mm": 14.5, "flipper_length_mm": 212, "body_mass_g": 4750, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.5, "bill_depth_mm": 16.1, "flipper_length_mm": 224, "body_mass_g": 5650, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 44.5, "bill_depth_mm": 14.7, "flipper_length_mm": 214, "body_mass_g": 4850, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50.8, "bill_depth_mm": 15.7, "flipper_length_mm": 226, "body_mass_g": 5200, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.4, "bill_depth_mm": 15.8, "flipper_length_mm": 216, "body_mass_g": 4925, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.9, "bill_depth_mm": 14.6, "flipper_length_mm": 222, "body_mass_g": 4875, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.4, "bill_depth_mm": 14.4, "flipper_length_mm": 203, "body_mass_g": 4625, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 51.1, "bill_depth_mm": 16.5, "flipper_length_mm": 225, "body_mass_g": 5250, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.5, "bill_depth_mm": 15, "flipper_length_mm": 219, "body_mass_g": 4850, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 55.9, "bill_depth_mm": 17, "flipper_length_mm": 228, "body_mass_g": 5600, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.2, "bill_depth_mm": 15.5, "flipper_length_mm": 215, "body_mass_g": 4975, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.1, "bill_depth_mm": 15, "flipper_length_mm": 228, "body_mass_g": 5500, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.3, "bill_depth_mm": 13.8, "flipper_length_mm": 216, "body_mass_g": 4725, "sex": null, "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.8, "bill_depth_mm": 16.1, "flipper_length_mm": 215, "body_mass_g": 5500, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 41.7, "bill_depth_mm": 14.7, "flipper_length_mm": 210, "body_mass_g": 4700, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 53.4, "bill_depth_mm": 15.8, "flipper_length_mm": 219, "body_mass_g": 5500, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 43.3, "bill_depth_mm": 14, "flipper_length_mm": 208, "body_mass_g": 4575, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.1, "bill_depth_mm": 15.1, "flipper_length_mm": 209, "body_mass_g": 5500, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50.5, "bill_depth_mm": 15.2, "flipper_length_mm": 216, "body_mass_g": 5e3, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.8, "bill_depth_mm": 15.9, "flipper_length_mm": 229, "body_mass_g": 5950, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 43.5, "bill_depth_mm": 15.2, "flipper_length_mm": 213, "body_mass_g": 4650, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 51.5, "bill_depth_mm": 16.3, "flipper_length_mm": 230, "body_mass_g": 5500, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.2, "bill_depth_mm": 14.1, "flipper_length_mm": 217, "body_mass_g": 4375, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 55.1, "bill_depth_mm": 16, "flipper_length_mm": 230, "body_mass_g": 5850, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 44.5, "bill_depth_mm": 15.7, "flipper_length_mm": 217, "body_mass_g": 4875, "sex": null, "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.8, "bill_depth_mm": 16.2, "flipper_length_mm": 222, "body_mass_g": 6e3, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.2, "bill_depth_mm": 13.7, "flipper_length_mm": 214, "body_mass_g": 4925, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": null, "bill_depth_mm": null, "flipper_length_mm": null, "body_mass_g": null, "sex": null, "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.8, "bill_depth_mm": 14.3, "flipper_length_mm": 215, "body_mass_g": 4850, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50.4, "bill_depth_mm": 15.7, "flipper_length_mm": 222, "body_mass_g": 5750, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.2, "bill_depth_mm": 14.8, "flipper_length_mm": 212, "body_mass_g": 5200, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.9, "bill_depth_mm": 16.1, "flipper_length_mm": 213, "body_mass_g": 5400, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 46.5, "bill_depth_mm": 17.9, "flipper_length_mm": 192, "body_mass_g": 3500, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50, "bill_depth_mm": 19.5, "flipper_length_mm": 196, "body_mass_g": 3900, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 51.3, "bill_depth_mm": 19.2, "flipper_length_mm": 193, "body_mass_g": 3650, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 45.4, "bill_depth_mm": 18.7, "flipper_length_mm": 188, "body_mass_g": 3525, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 52.7, "bill_depth_mm": 19.8, "flipper_length_mm": 197, "body_mass_g": 3725, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 45.2, "bill_depth_mm": 17.8, "flipper_length_mm": 198, "body_mass_g": 3950, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 46.1, "bill_depth_mm": 18.2, "flipper_length_mm": 178, "body_mass_g": 3250, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 51.3, "bill_depth_mm": 18.2, "flipper_length_mm": 197, "body_mass_g": 3750, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 46, "bill_depth_mm": 18.9, "flipper_length_mm": 195, "body_mass_g": 4150, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 51.3, "bill_depth_mm": 19.9, "flipper_length_mm": 198, "body_mass_g": 3700, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 46.6, "bill_depth_mm": 17.8, "flipper_length_mm": 193, "body_mass_g": 3800, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 51.7, "bill_depth_mm": 20.3, "flipper_length_mm": 194, "body_mass_g": 3775, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 47, "bill_depth_mm": 17.3, "flipper_length_mm": 185, "body_mass_g": 3700, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 52, "bill_depth_mm": 18.1, "flipper_length_mm": 201, "body_mass_g": 4050, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 45.9, "bill_depth_mm": 17.1, "flipper_length_mm": 190, "body_mass_g": 3575, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.5, "bill_depth_mm": 19.6, "flipper_length_mm": 201, "body_mass_g": 4050, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.3, "bill_depth_mm": 20, "flipper_length_mm": 197, "body_mass_g": 3300, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 58, "bill_depth_mm": 17.8, "flipper_length_mm": 181, "body_mass_g": 3700, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 46.4, "bill_depth_mm": 18.6, "flipper_length_mm": 190, "body_mass_g": 3450, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 49.2, "bill_depth_mm": 18.2, "flipper_length_mm": 195, "body_mass_g": 4400, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 42.4, "bill_depth_mm": 17.3, "flipper_length_mm": 181, "body_mass_g": 3600, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 48.5, "bill_depth_mm": 17.5, "flipper_length_mm": 191, "body_mass_g": 3400, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 43.2, "bill_depth_mm": 16.6, "flipper_length_mm": 187, "body_mass_g": 2900, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.6, "bill_depth_mm": 19.4, "flipper_length_mm": 193, "body_mass_g": 3800, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 46.7, "bill_depth_mm": 17.9, "flipper_length_mm": 195, "body_mass_g": 3300, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 52, "bill_depth_mm": 19, "flipper_length_mm": 197, "body_mass_g": 4150, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.5, "bill_depth_mm": 18.4, "flipper_length_mm": 200, "body_mass_g": 3400, "sex": "female", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 49.5, "bill_depth_mm": 19, "flipper_length_mm": 200, "body_mass_g": 3800, "sex": "male", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 46.4, "bill_depth_mm": 17.8, "flipper_length_mm": 191, "body_mass_g": 3700, "sex": "female", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 52.8, "bill_depth_mm": 20, "flipper_length_mm": 205, "body_mass_g": 4550, "sex": "male", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 40.9, "bill_depth_mm": 16.6, "flipper_length_mm": 187, "body_mass_g": 3200, "sex": "female", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 54.2, "bill_depth_mm": 20.8, "flipper_length_mm": 201, "body_mass_g": 4300, "sex": "male", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 42.5, "bill_depth_mm": 16.7, "flipper_length_mm": 187, "body_mass_g": 3350, "sex": "female", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 51, "bill_depth_mm": 18.8, "flipper_length_mm": 203, "body_mass_g": 4100, "sex": "male", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 49.7, "bill_depth_mm": 18.6, "flipper_length_mm": 195, "body_mass_g": 3600, "sex": "male", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 47.5, "bill_depth_mm": 16.8, "flipper_length_mm": 199, "body_mass_g": 3900, "sex": "female", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 47.6, "bill_depth_mm": 18.3, "flipper_length_mm": 195, "body_mass_g": 3850, "sex": "female", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 52, "bill_depth_mm": 20.7, "flipper_length_mm": 210, "body_mass_g": 4800, "sex": "male", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 46.9, "bill_depth_mm": 16.6, "flipper_length_mm": 192, "body_mass_g": 2700, "sex": "female", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 53.5, "bill_depth_mm": 19.9, "flipper_length_mm": 205, "body_mass_g": 4500, "sex": "male", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 49, "bill_depth_mm": 19.5, "flipper_length_mm": 210, "body_mass_g": 3950, "sex": "male", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 46.2, "bill_depth_mm": 17.5, "flipper_length_mm": 187, "body_mass_g": 3650, "sex": "female", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.9, "bill_depth_mm": 19.1, "flipper_length_mm": 196, "body_mass_g": 3550, "sex": "male", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 45.5, "bill_depth_mm": 17, "flipper_length_mm": 196, "body_mass_g": 3500, "sex": "female", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.9, "bill_depth_mm": 17.9, "flipper_length_mm": 196, "body_mass_g": 3675, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.8, "bill_depth_mm": 18.5, "flipper_length_mm": 201, "body_mass_g": 4450, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.1, "bill_depth_mm": 17.9, "flipper_length_mm": 190, "body_mass_g": 3400, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 49, "bill_depth_mm": 19.6, "flipper_length_mm": 212, "body_mass_g": 4300, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 51.5, "bill_depth_mm": 18.7, "flipper_length_mm": 187, "body_mass_g": 3250, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 49.8, "bill_depth_mm": 17.3, "flipper_length_mm": 198, "body_mass_g": 3675, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 48.1, "bill_depth_mm": 16.4, "flipper_length_mm": 199, "body_mass_g": 3325, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 51.4, "bill_depth_mm": 19, "flipper_length_mm": 201, "body_mass_g": 3950, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 45.7, "bill_depth_mm": 17.3, "flipper_length_mm": 193, "body_mass_g": 3600, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.7, "bill_depth_mm": 19.7, "flipper_length_mm": 203, "body_mass_g": 4050, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 42.5, "bill_depth_mm": 17.3, "flipper_length_mm": 187, "body_mass_g": 3350, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 52.2, "bill_depth_mm": 18.8, "flipper_length_mm": 197, "body_mass_g": 3450, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 45.2, "bill_depth_mm": 16.6, "flipper_length_mm": 191, "body_mass_g": 3250, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 49.3, "bill_depth_mm": 19.9, "flipper_length_mm": 203, "body_mass_g": 4050, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.2, "bill_depth_mm": 18.8, "flipper_length_mm": 202, "body_mass_g": 3800, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 45.6, "bill_depth_mm": 19.4, "flipper_length_mm": 194, "body_mass_g": 3525, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 51.9, "bill_depth_mm": 19.5, "flipper_length_mm": 206, "body_mass_g": 3950, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 46.8, "bill_depth_mm": 16.5, "flipper_length_mm": 189, "body_mass_g": 3650, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 45.7, "bill_depth_mm": 17, "flipper_length_mm": 195, "body_mass_g": 3650, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 55.8, "bill_depth_mm": 19.8, "flipper_length_mm": 207, "body_mass_g": 4e3, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 43.5, "bill_depth_mm": 18.1, "flipper_length_mm": 202, "body_mass_g": 3400, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 49.6, "bill_depth_mm": 18.2, "flipper_length_mm": 193, "body_mass_g": 3775, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.8, "bill_depth_mm": 19, "flipper_length_mm": 210, "body_mass_g": 4100, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.2, "bill_depth_mm": 18.7, "flipper_length_mm": 198, "body_mass_g": 3775, "sex": "female", "year": 2009 }];

// docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/runtime-preview/CoreFigures.jsx
import React2 from "react";
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var numericNames = ["bill mm", "depth mm", "flipper mm", "mass g"];
function DistanceView({
  data = points,
  divisors = [1, 100],
  raw = false
}) {
  const comparisons = ["A", "B"].map((id) => ({
    id,
    color: ink[id],
    ...distance(data.Q, data[id], divisors)
  }));
  const radius = Math.max(1, ...comparisons.map((row) => row.length)) * 1.12;
  return /* @__PURE__ */ jsxs2("div", { children: [
    raw ? /* @__PURE__ */ jsx2(Plot, { label: "Recorded bill length and body mass; axes carry different physical units", xDomain: [Math.min(...Object.values(data).map((row) => row[0])) - 1, Math.max(...Object.values(data).map((row) => row[0])) + 1], yDomain: [Math.min(...Object.values(data).map((row) => row[1])) - 20, Math.max(...Object.values(data).map((row) => row[1])) + 20], xLabel: "bill length (mm)", yLabel: "body mass (g)", points: Object.entries(data).map(([id, row]) => ({
      id,
      x: row[0],
      y: row[1],
      color: ink[id] || ink.query
    })) }) : null,
    /* @__PURE__ */ jsx2(Plot, { label: "Query-centred transformed displacement triangles and full true-radius circles", equal: true, xDomain: [-radius, radius], yDomain: [-radius, radius], xLabel: "\u0394 bill / bill divisor", yLabel: "\u0394 mass / mass divisor", circles: comparisons.map((row) => ({
      radius: row.length,
      color: row.color
    })), paths: comparisons.flatMap((row) => [{
      values: [[0, 0], [row.delta[0], 0], row.delta],
      color: row.color
    }, {
      values: [[0, 0], row.delta],
      color: row.color,
      arrow: true
    }]), points: [{
      id: "Q",
      x: 0,
      y: 0
    }, ...comparisons.map((row) => ({
      id: row.id,
      x: row.delta[0],
      y: row.delta[1],
      color: row.color,
      dy: row.id === "B" ? 22 : -10
    }))] }),
    /* @__PURE__ */ jsx2(Bars, { label: "Squared coordinate contributions on one common zero-based scale", rows: comparisons.flatMap((row) => row.contributions.map((value, j) => ({
      name: `${row.id} \xB7 ${j ? "mass" : "bill"} squared contribution`,
      value,
      color: row.color
    }))) }),
    /* @__PURE__ */ jsx2(Table, { caption: "Unrounded contributions determine the ranking; displayed values are rounded", headers: ["Point", "\u0394 bill / a", "\u0394 mass / b", "bill\xB2", "mass\xB2", "sum d\xB2", "length d"], rows: comparisons.map((row) => [row.id, ...row.delta, ...row.contributions, row.squared, row.length]) })
  ] });
}
function RulerView({
  training = [1, 2, 3, 4, 100],
  query = 150,
  selected
}) {
  const kinds = selected ? [selected] : ["standard", "minmax", "robust", "maxabs"];
  const standard = ruler(training, "standard");
  return /* @__PURE__ */ jsxs2("div", { children: [
    /* @__PURE__ */ jsx2(NumberLine, { values: training, marks: [{
      id: "query",
      value: query
    }], label: "Original values \xB7 full extent" }),
    /* @__PURE__ */ jsx2(NumberLine, { values: training.filter((value) => value >= 1 && value <= 4), min: 0.5, max: 4.5, label: "Zoom into central observations1\u20134; extreme values omitted only in this zoom" }),
    !selected || selected === "standard" ? /* @__PURE__ */ jsxs2(Fragment, { children: [
      /* @__PURE__ */ jsx2(Plot, { label: "Each observed value contributes a deviation from the fitted mean", xDomain: [Math.min(...training) - 1, Math.max(...training) + 1], yDomain: [-0.5, training.length - 0.5], xLabel: "training value and fitted mean", yLabel: "training row index", paths: [...training.map((value, i) => ({
        values: [[value, i], [standard.center, i]],
        color: ink.A
      })), {
        values: [[standard.center, -0.5], [standard.center, training.length - 0.5]],
        color: ink.query,
        dashed: true
      }], points: training.map((value, i) => ({
        x: value,
        y: i
      })) }),
      /* @__PURE__ */ jsx2(Table, { caption: "Population spread reduction, divided by n", headers: ["training value", "value\u2212mean", "squared deviation"], rows: [...training.map((value) => [value, value - standard.center, (value - standard.center) ** 2]), ["variance", "", standard.measured ** 2], ["standard deviation", "", standard.measured]] })
    ] }) : null,
    /* @__PURE__ */ jsx2("div", { className: "prep-columns", children: kinds.map((kind) => {
      const fit = ruler(training, kind), outputs = training.map((value) => applyRuler(fit, value));
      return /* @__PURE__ */ jsxs2("div", { children: [
        /* @__PURE__ */ jsx2(NumberLine, { values: outputs, marks: [{
          id: "query",
          value: applyRuler(fit, query)
        }], label: `${kind} \xB7 output full extent` }),
        /* @__PURE__ */ jsx2(Table, { caption: `${kind} fitted state`, headers: ["center", "measured spread", "stored divisor", "query coordinate"], rows: [[fit.center, fit.measured, fit.scale, applyRuler(fit, query)]] })
      ] }, kind);
    }) }),
    /* @__PURE__ */ jsx2(Table, { caption: "Original values and all fitted coordinates", headers: ["value", ...kinds], rows: [...training, query].map((value) => [value, ...kinds.map((kind) => applyRuler(ruler(training, kind), value))]) })
  ] });
}
function CategoryView({
  query = "new",
  minimum = 2,
  policy = "infrequent"
}) {
  const state = category(query, minimum, policy);
  return /* @__PURE__ */ jsxs2("div", { children: [
    /* @__PURE__ */ jsx2(Table, { caption: "Counts are learned from training only", headers: ["label", "training count", "state"], rows: [["a", 4, 4 >= minimum ? "frequent" : "rare"], ["b", 1, 1 >= minimum ? "frequent" : "rare"], ["None", 1, "reserved missing"]] }),
    /* @__PURE__ */ jsx2(Cells, { label: "Exact output positions", names: state.vocabulary, values: state.vector }),
    /* @__PURE__ */ jsxs2("p", { children: [
      "Input ",
      query === null ? "None (missing)" : JSON.stringify(query),
      " \u2192 ",
      state.token ?? "all-zero unknown",
      "; rare bucket ",
      state.hasRare ? "exists" : "does not exist",
      "."
    ] })
  ] });
}
function DonorView({
  table = donorFixture,
  k = 2,
  stage = "all"
}) {
  const state = donors(table, k);
  return /* @__PURE__ */ jsxs2("div", { children: [
    /* @__PURE__ */ jsx2(Matrix, { label: "Complete original query and donor cells", columns: ["a", "b", "target c"], rowLabels: ["Q", "D1", "D2", "D3"], values: table, highlightRows: [0] }),
    stage === "overlap" ? /* @__PURE__ */ jsx2("div", { className: "prep-columns", children: state.scored.map((row) => /* @__PURE__ */ jsxs2("div", { className: "prep-operation", children: [
      /* @__PURE__ */ jsxs2("p", { children: [
        "Q compared with ",
        row.id,
        ": connectors exist only for both-observed coordinates."
      ] }),
      /* @__PURE__ */ jsx2("svg", { viewBox: "0 0 440 170", role: "img", "aria-label": `${row.id} overlap coordinates${row.overlap.join(",") || "none"}`, children: ["a", "b", "target c"].map((name, j) => /* @__PURE__ */ jsxs2("g", { children: [
        /* @__PURE__ */ jsx2("text", { x: 75 + j * 145, y: "20", textAnchor: "middle", children: name }),
        /* @__PURE__ */ jsx2("circle", { cx: 75 + j * 145, cy: "50", r: "8", fill: table[0][j] === null ? "none" : ink.query, stroke: ink.query }),
        /* @__PURE__ */ jsx2("circle", { cx: 75 + j * 145, cy: "120", r: "8", fill: row.row[j] === null ? "none" : ink.A, stroke: ink.A }),
        row.overlap.includes(j) ? /* @__PURE__ */ jsx2("line", { x1: 75 + j * 145, x2: 75 + j * 145, y1: "60", y2: "110", stroke: ink.B, strokeWidth: "2" }) : null,
        /* @__PURE__ */ jsxs2("text", { x: 75 + j * 145, y: "155", textAnchor: "middle", children: [
          fmt(table[0][j]),
          " / ",
          fmt(row.row[j])
        ] })
      ] }, name)) })
    ] }, row.id)) }) : null,
    /* @__PURE__ */ jsx2(Table, { caption: "Common observed coordinates are chosen before target-specific eligibility", headers: ["donor", "overlap coordinates", "q", "square differences", "sum", "p/q", "d\xB2", "distance", "target observed"], rows: state.scored.map((row) => [row.id, row.overlap.map((i) => ["a", "b", "c"][i]).join(", ") || "none", row.overlap.length, row.squares.map((value) => fmt(value)).join(" + ") || "undefined", row.overlap.length ? row.squares.reduce((a, b) => a + b, 0) : "undefined", row.overlap.length ? 3 / row.overlap.length : "undefined", row.squared, row.length, row.eligible ? "yes" : "no"]) }),
    stage !== "overlap" ? /* @__PURE__ */ jsx2(NumberLine, { values: state.scored.filter((row) => row.length !== null).map((row) => row.length), label: "Actual distance d (not squared distance)" }) : null,
    stage === "all" ? /* @__PURE__ */ jsxs2(Fragment, { children: [
      /* @__PURE__ */ jsx2(Cells, { label: "Selected target cells", names: state.chosen.map((row) => `${row.id} \xB7 weight1/${state.chosen.length}`), values: state.chosen.map((row) => row.row[2]) }),
      /* @__PURE__ */ jsx2("div", { className: "prep-flow-arrow", "aria-hidden": "true", children: "\u2193" }),
      /* @__PURE__ */ jsx2(Cells, { names: [state.fallback ? "observed-target mean fallback" : "equal-weight target estimate"], values: [state.value] }),
      /* @__PURE__ */ jsxs2("p", { children: [
        state.fallback ? "No target-eligible overlap exists; all observed target cells support the fallback." : `Selected ${state.chosen.map((row) => row.id).join(", ")} from the target-eligible sorted distances.`,
        " Observed cells remain unchanged."
      ] })
    ] }) : null
  ] });
}
function SmallPreparationView({
  row = [30, null, 9],
  label = "b"
}) {
  const result = prepare(row, label);
  return /* @__PURE__ */ jsxs2("div", { children: [
    /* @__PURE__ */ jsxs2("div", { className: "prep-columns", children: [
      /* @__PURE__ */ jsxs2("div", { children: [
        /* @__PURE__ */ jsx2(Cells, { label: "Numeric input", names: ["numeric0", "numeric1", "numeric2"], values: row }),
        /* @__PURE__ */ jsx2("div", { className: "prep-flow-arrow", children: "\u2193 median fill" }),
        /* @__PURE__ */ jsx2(Cells, { names: ["filled0", "filled1", "filled2"], values: result.filled, mask: result.mask }),
        /* @__PURE__ */ jsx2("div", { className: "prep-flow-arrow", children: "\u2193 saved centre and divisor" }),
        /* @__PURE__ */ jsx2(Cells, { names: ["scaled0", "scaled1", "scaled2"], values: result.numeric, mask: result.mask })
      ] }),
      /* @__PURE__ */ jsxs2("div", { children: [
        /* @__PURE__ */ jsx2(Cells, { names: ["category input"], values: [label ?? "None"] }),
        /* @__PURE__ */ jsx2("div", { className: "prep-flow-arrow", children: "\u2193 saved vocabulary" }),
        /* @__PURE__ */ jsx2(Cells, { names: smallFit.vocabulary, values: result.encoded })
      ] })
    ] }),
    /* @__PURE__ */ jsx2("div", { className: "prep-flow-arrow", children: "\u2193 concatenate numeric then category" }),
    /* @__PURE__ */ jsx2(Cells, { label: "Full six-coordinate P1 output", names: ["n0", "n1", "n2", "a", "b", "not_recorded"], values: result.output, mask: [...result.mask, false, false, false] }),
    /* @__PURE__ */ jsx2(Table, { caption: "Pinned P1 fitted arrays; query edits cannot refit them", headers: ["array", "entries"], rows: Object.entries(smallFit).map(([name, values]) => [name, values.map((value) => fmt(value, 9)).join(", ")]) })
  ] });
}
function RealPreparationView({
  source = 309,
  altered,
  feature = "body_mass_g"
}) {
  const record = observations[source], names = ["bill_length_mm", "bill_depth_mm", "flipper_length_mm", "body_mass_g"];
  const state = {
    medians: saved.scaled_inspection.train_medians,
    means: saved.scaled_inspection.mean,
    scales: saved.scaled_inspection.scale,
    vocabulary: ["female", "male", "not_recorded"]
  };
  const values = names.map((name) => name === feature && altered !== void 0 ? altered : record[name]);
  const label = feature === "sex" && altered !== void 0 ? altered : record.sex;
  const result = prepare(values, label, state);
  return /* @__PURE__ */ jsxs2("div", { children: [
    /* @__PURE__ */ jsxs2("p", { children: [
      "Source row ",
      source,
      "; observed target ",
      /* @__PURE__ */ jsx2("strong", { children: record.species }),
      " is separate from these inputs. ",
      altered !== void 0 ? "This is an altered inspection copy; no new model prediction or accuracy is calculated." : "Original recorded row under the retained fitted preparation."
    ] }),
    /* @__PURE__ */ jsx2(Table, { caption: "One coordinate at a time through the saved fit", headers: ["feature", "input", "median", "filled", "mean", "divisor", "coordinate"], rows: names.map((name, i) => [name, values[i], state.medians[i], result.filled[i], state.means[i], state.scales[i], result.numeric[i]]) }),
    /* @__PURE__ */ jsx2(Cells, { label: "Seven output coordinates, fixed numeric then category order", names: [...numericNames, ...state.vocabulary], values: result.output, mask: [...result.mask, false, false, false] })
  ] });
}

// docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/runtime-preview/DeeperFigures.jsx
import React3, { useId as useId2 } from "react";
import { Fragment as Fragment2, jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var sample = (low, high, count = 121) => Array.from({
  length: count
}, (_, i) => low + i * (high - low) / (count - 1));
function PowerView({
  method = "YJ",
  lambda = 1,
  x = -3
}) {
  const result = power(x, lambda, method);
  const domain = method === "BC" ? [Math.min(0.1, x), 30] : [-10, 30];
  const rows = sample(...domain).map((value) => [value, power(value, lambda, method)]);
  return /* @__PURE__ */ jsxs3(Fragment2, { children: [
    /* @__PURE__ */ jsx3(Plot, { label: `${method} actual transformation at lambda${lambda}`, xDomain: domain, yDomain: [Math.min(0, ...rows.map((row) => row[1]), result), Math.max(1, ...rows.map((row) => row[1]), result)], xLabel: "input x", yLabel: `${method} output`, paths: [{
      values: rows
    }], points: [{
      id: "x",
      x,
      y: result
    }] }),
    /* @__PURE__ */ jsx3(Table, { headers: ["method", "x", "lambda", "branch", "mapped coordinate"], rows: [[method, x, lambda, method === "BC" ? lambda === 0 ? "log x" : "(x^\u03BB\u22121)/\u03BB" : x >= 0 ? lambda === 0 ? "log1p(x)" : "positive power" : lambda === 2 ? "\u2212log1p(\u2212x)" : "negative power", result]] })
  ] });
}
function QuantileView({
  x = 3,
  output = "uniform"
}) {
  const state = quantileMap(x, output);
  return /* @__PURE__ */ jsxs3(Fragment2, { children: [
    /* @__PURE__ */ jsx3(Matrix, { label: "Saved empirical landmark state; ties occupy two probability positions", columns: ["input landmark", "reference probability"], values: state.landmarks.map((value, i) => [value, state.references[i]]) }),
    /* @__PURE__ */ jsx3(Plot, { label: "Fitted input-to-uniform map; exact tie midpoint and one-sided limits", xDomain: [Math.min(0, x), Math.max(105, x)], yDomain: [-0.1, 1.1], xLabel: "query x; training support1\u2026100", yLabel: "uniform coordinate u", paths: [{
      values: [[Math.min(0, x), 0], [1, 0], [2, 0.25]]
    }, {
      values: [[2, 0.5], [4, 0.75], [100, 1], [Math.max(105, x), 1]]
    }], points: [{
      id: "tie",
      x: 2,
      y: 0.375,
      color: ink.B
    }, {
      id: "query",
      x,
      y: state.probability,
      dy: -12
    }] }),
    /* @__PURE__ */ jsx3(Cells, { names: ["query x", "u", output === "normal" ? "finite normal coordinate z" : "uniform output", "inverse support policy"], values: [x, state.probability, state.value, state.saturated ? x < 1 ? "endpoint1" : "endpoint100" : "within fitted support"] }),
    output === "normal" ? /* @__PURE__ */ jsx3(Plot, { label: "Normal inverse CDF after endpoint clipping epsilon1e-7", xDomain: [0, 1], yDomain: [-5.3, 5.3], xLabel: "uniform probability u", yLabel: "normal coordinate", paths: [{
      values: sample(1e-7, 0.9999999, 201).map((value) => {
        return [value, normalQuantile(value)];
      })
    }] }) : null
  ] });
}
function CycleView({
  first = 350,
  second = 10
}) {
  const point = (angle) => [Math.cos(angle * Math.PI / 180), Math.sin(angle * Math.PI / 180)];
  const a = point(first), b = point(second), chord = Math.hypot(a[0] - b[0], a[1] - b[1]);
  return /* @__PURE__ */ jsxs3(Fragment2, { children: [
    /* @__PURE__ */ jsx3(Plot, { equal: true, label: "True unit circle with both coordinate projections and chord", xDomain: [-1.3, 1.3], yDomain: [-1.3, 1.3], xLabel: "cos(2\u03C0t/period)", yLabel: "sin(2\u03C0t/period)", circles: [{
      radius: 1
    }], points: [{
      id: "A",
      x: a[0],
      y: a[1],
      color: ink.A,
      dx: -22,
      dy: 23
    }, {
      id: "B",
      x: b[0],
      y: b[1],
      color: ink.B,
      dx: -22,
      dy: -12
    }], paths: [{
      values: [[0, 0], a],
      arrow: true,
      color: ink.A
    }, {
      values: [[0, 0], b],
      arrow: true,
      color: ink.B
    }, {
      values: [a, b],
      color: ink.query
    }, ...[a, b].flatMap((row) => [{
      values: [[row[0], 0], row, [0, row[1]]],
      dashed: true,
      color: ink.muted
    }])] }),
    /* @__PURE__ */ jsx3(Table, { headers: ["point", "angle degrees", "cos", "sin"], rows: [["A", first, ...a], ["B", second, ...b]] }),
    /* @__PURE__ */ jsxs3("p", { children: [
      "Chord length ",
      fmt(chord, 10),
      ". Period is360\xB0; a duration uses this circle only with a justified periodic interpretation."
    ] })
  ] });
}
function SmoothingView({
  count = 1,
  total = count,
  alpha = 2,
  prior = 0.5
}) {
  const value = count + alpha ? (total + alpha * prior) / (count + alpha) : prior;
  return /* @__PURE__ */ jsxs3(Fragment2, { children: [
    /* @__PURE__ */ jsxs3("div", { className: "prep-operation", children: [
      /* @__PURE__ */ jsx3("svg", { viewBox: `0 0 370 ${Math.max(60, Math.ceil(count / 10) * 30 + 20)}`, role: "img", "aria-label": `${count} observed positive target cells, each equal to1; empty support has no target cells`, children: Array.from({
        length: count
      }, (_entry, i) => /* @__PURE__ */ jsxs3("g", { children: [
        /* @__PURE__ */ jsx3("circle", { cx: 22 + i % 10 * 36, cy: 22 + Math.floor(i / 10) * 30, r: "11", fill: "none", stroke: ink.A }),
        /* @__PURE__ */ jsx3("text", { x: 22 + i % 10 * 36, y: 27 + Math.floor(i / 10) * 30, textAnchor: "middle", children: "1" })
      ] }, i)) }),
      /* @__PURE__ */ jsx3("p", { children: count ? `${count} observed positive target ${count === 1 ? "cell" : "cells"}; each equals 1. Reduce them to sum ${total} and count ${count}.` : "No observed target cells support this category; use the donor prior." })
    ] }),
    /* @__PURE__ */ jsx3("div", { className: "prep-flow-arrow", children: "\u2193 sum and count" }),
    /* @__PURE__ */ jsx3(Cells, { names: ["target sum", "category count n", "prior \u03BC", "smoothing \u03B1", "mapped value"], values: [total, count, prior, alpha, value] }),
    /* @__PURE__ */ jsx3(NumberLine, { min: 0, max: 1, values: [prior, ...count ? [total / count] : []], marks: [{
      id: "prior \u03BC",
      value: prior,
      color: ink.B
    }, ...count ? [{
      id: "category mean",
      value: total / count,
      color: ink.A
    }] : [], {
      id: "map",
      value
    }], label: "Category mean and prior on the same target scale" }),
    /* @__PURE__ */ jsx3(Bars, { maximum: 1, label: "Exact mixing weights", rows: [{
      name: "category n/(n+\u03B1)",
      value: count + alpha ? count / (count + alpha) : 0,
      color: ink.A
    }, {
      name: "prior \u03B1/(n+\u03B1)",
      value: count + alpha ? alpha / (count + alpha) : 1,
      color: ink.B
    }] }),
    /* @__PURE__ */ jsx3("p", { children: count ? "Smoothing changes the weights; it does not exclude a held row\u2019s target." : "No matching category support: declared fallback is the donor prior." })
  ] });
}
function CrossFitView({
  fixture = targetFixture,
  selected = 0
}) {
  const marker = useId2().replaceAll(":", ""), rows = crossFit(fixture), state = rows[selected];
  const height = Math.max(340, state.donors.length * 80 + 40);
  const priorY = height * 0.35, sumY = height - 50;
  const categoryColors = [ink.A, ink.B, "#e49b94", "#b8b8c6"];
  const categoryColor = (label) => categoryColors[Array.from(label).reduce((value, letter) => value + letter.codePointAt(0), 0) % categoryColors.length];
  return /* @__PURE__ */ jsxs3(Fragment2, { children: [
    /* @__PURE__ */ jsx3(Matrix, { columns: ["category", "target y", "fold", "OOF code"], values: fixture.categories.map((label, i) => [/* @__PURE__ */ jsx3("span", { style: {
      color: categoryColor(label)
    }, children: label || "(empty label)" }), fixture.targets[i], fixture.folds[i], rows[i].value]), highlightRows: [selected], label: "Complete six-row training table; category identity, fold digits and selection outline are separate cues" }),
    /* @__PURE__ */ jsx3("div", { className: "prep-operation", children: /* @__PURE__ */ jsxs3("svg", { viewBox: `0 0 440 ${height}`, role: "img", "aria-label": `All permitted targets${state.donors.join(",")} contribute to row${selected} prior; matching rows${state.matching.join(",")} also contribute to numerator`, children: [
      /* @__PURE__ */ jsx3("defs", { children: /* @__PURE__ */ jsx3("marker", { id: marker, viewBox: "0 0 10 10", refX: "9", refY: "5", markerWidth: "6", markerHeight: "6", orient: "auto", children: /* @__PURE__ */ jsx3("path", { d: "M0 0 L10 5 L0 10Z", fill: "context-stroke" }) }) }),
      state.donors.map((row, i) => /* @__PURE__ */ jsxs3("g", { children: [
        /* @__PURE__ */ jsx3("circle", { cx: "55", cy: 48 + i * 80, r: "18", fill: "none", stroke: ink.A }),
        /* @__PURE__ */ jsx3("text", { x: "55", y: 53 + i * 80, textAnchor: "middle", children: row }),
        /* @__PURE__ */ jsxs3("text", { x: "85", y: 53 + i * 80, children: [
          "y=",
          fixture.targets[row]
        ] }),
        /* @__PURE__ */ jsx3("path", { d: `M135 ${48 + i * 80} L265 ${priorY}`, stroke: ink.B, fill: "none", markerEnd: `url(#${marker})` }),
        state.matching.includes(row) ? /* @__PURE__ */ jsx3("path", { d: `M135 ${48 + i * 80} L180 ${sumY} L265 ${sumY}`, stroke: ink.query, fill: "none", markerEnd: `url(#${marker})` }) : null
      ] }, row)),
      /* @__PURE__ */ jsx3("circle", { cx: "300", cy: priorY, r: "32", fill: "#19191c", stroke: ink.B }),
      /* @__PURE__ */ jsx3("text", { x: "300", y: priorY + 5, textAnchor: "middle", children: "\u03BC" }),
      /* @__PURE__ */ jsx3("circle", { cx: "300", cy: sumY, r: "32", fill: "#19191c", stroke: ink.query }),
      /* @__PURE__ */ jsx3("text", { x: "300", y: sumY + 5, textAnchor: "middle", children: "\u03A3" })
    ] }) }),
    /* @__PURE__ */ jsx3("p", { children: "Purple edges reach \u03BC from every permitted donor. Amber edges reach the category sum \u03A3 only from matching donors. The held fold sends no edge into either reduction." }),
    /* @__PURE__ */ jsx3(Table, { headers: ["selected row", "permitted donors", "same-category donors", "prior", "numerator", "denominator", "code"], rows: [[selected, state.donors.join(","), state.matching.join(",") || "none", state.prior, state.total + 2 * state.prior, state.count + 2, state.value]] }),
    /* @__PURE__ */ jsx3("p", { children: "Every other-fold donor remains in the prior, including same-category donors." })
  ] });
}
function HashView({
  counts = [3, 1, 2],
  buckets = [0, 0, 1],
  signs = [1, -1, 1]
}) {
  const output = [0, 0];
  counts.forEach((count, i) => {
    output[buckets[i]] += signs[i] * count;
  });
  return /* @__PURE__ */ jsxs3(Fragment2, { children: [
    /* @__PURE__ */ jsx3(Table, { caption: "Declared constructed projection; distinct from the ordinary hash function", headers: ["token", "count", "bucket", "sign", "signed contribution"], rows: ["apple", "pear", "banana"].map((token, i) => [token, counts[i], buckets[i], signs[i], counts[i] * signs[i]]) }),
    /* @__PURE__ */ jsx3(Matrix, { columns: ["apple", "pear", "banana"], rowLabels: ["bucket0", "bucket1"], values: [0, 1].map((bucket) => counts.map((_count, i) => buckets[i] === bucket ? signs[i] : 0)), label: "Projection matrix: one signed nonzero per token column" }),
    /* @__PURE__ */ jsx3("div", { className: "prep-flow-arrow", children: "\u2193 sparse accumulation into bucket coordinates" }),
    /* @__PURE__ */ jsx3(Cells, { names: ["bucket0", "bucket1"], values: output })
  ] });
}
function ConditionalView({
  input = incomplete,
  turn = 0,
  initialOverrides = {}
}) {
  const state = conditionalTrace(input, 1, initialOverrides), current = turn === 0 ? state.initial : state.trace[turn - 1].current;
  const mask = input.map((row) => row.map((value) => value === null));
  const model = turn ? state.trace[turn - 1] : null;
  const edited = Object.values(initialOverrides).some((value) => value !== null && value !== void 0);
  const initialLabel = edited ? "Initial estimates: edited gaps override medians2.5/6; observed row2 a=3 stays fixed" : "Initialized medians2.5/6; observed row2 a=3";
  const gaps = model ? input.map((row, i) => row[model.target] === null ? i : -1).filter((i) => i >= 0) : [];
  const predictorRange = model ? [Math.min(...current.map((row) => row[model.other])) - 1, Math.max(...current.map((row) => row[model.other])) + 1] : [];
  const fitAt = (value) => model.intercept + model.coefficient * value;
  return /* @__PURE__ */ jsxs3(Fragment2, { children: [
    /* @__PURE__ */ jsxs3("div", { className: "prep-columns", children: [
      /* @__PURE__ */ jsx3(Matrix, { columns: ["a", "b"], values: input, label: "Original observations; original missing mask remains fixed" }),
      /* @__PURE__ */ jsx3(Matrix, { columns: ["a", "b"], values: current, missing: mask, highlightRows: model?.observed || [], label: turn ? `Turn${turn}: observed target rows outlined, original gaps hatched` : initialLabel })
    ] }),
    model ? /* @__PURE__ */ jsxs3(Fragment2, { children: [
      /* @__PURE__ */ jsx3(Table, { headers: ["observed response row", "intercept input", `current predictor${model.other}`, "original response"], rows: model.observed.map((row, i) => [row, 1, model.design[i], model.response[i]]) }),
      /* @__PURE__ */ jsx3(Cells, { names: ["coefficient", "unpenalized intercept", "alpha", "target column"], values: [model.coefficient, model.intercept, 1, model.target] }),
      /* @__PURE__ */ jsx3(Plot, { label: "Current conditional regression: observed responses, fitted line, residuals and original missing target estimates", xDomain: predictorRange, yDomain: [Math.min(...model.response, ...predictorRange.map(fitAt)) - 1, Math.max(...model.response, ...predictorRange.map(fitAt)) + 1], xLabel: `current predictor${model.other}`, yLabel: `target${model.target}; observed or estimated`, paths: [{
        values: predictorRange.map((value) => [value, fitAt(value)]),
        color: ink.A
      }, ...model.design.map((value, i) => ({
        values: [[value, model.response[i]], [value, fitAt(value)]],
        color: ink.B
      }))], points: [...model.design.map((value, i) => ({
        id: `observed row${model.observed[i]}`,
        x: value,
        y: model.response[i],
        color: ink.A
      })), ...gaps.map((row) => ({
        id: `estimated row${row}`,
        x: current[row][model.other],
        y: current[row][model.target],
        color: ink.estimated
      }))] }),
      /* @__PURE__ */ jsx3(Table, { caption: "Apply the saved linear expression only to original target gaps", headers: ["row", "predictor", "coefficient \xD7 predictor", "+ intercept", "new estimate"], rows: gaps.map((row) => [row, current[row][model.other], model.coefficient * current[row][model.other], model.intercept, current[row][model.target]]) }),
      /* @__PURE__ */ jsx3("p", { children: "Only originally missing target cells are replaced. Predictors may already be estimates from the previous column update. Purple segments show residuals of the observed responses; amber marks are estimates, not observed fitting responses." })
    ] }) : /* @__PURE__ */ jsx3(Cells, { names: ["median a", "median b"], values: state.medians }),
    /* @__PURE__ */ jsxs3("p", { children: [
      state.status,
      ". Training uses original observations as responses; later rows apply this saved sequence without refitting."
    ] })
  ] });
}
function PoolView({
  estimates = [9, 10, 11],
  variances = [4, 4, 4]
}) {
  const state = pool(estimates, variances);
  const intervals = estimates.map((value, i) => [value - Math.sqrt(variances[i]), value + Math.sqrt(variances[i])]);
  return /* @__PURE__ */ jsxs3(Fragment2, { children: [
    /* @__PURE__ */ jsx3(Table, { headers: ["analysis", "Q (estimate units)", "U (squared estimate units)"], rows: estimates.map((value, i) => [i + 1, value, variances[i]]) }),
    /* @__PURE__ */ jsx3(Plot, { label: "Each estimate with a segment extending one within-analysis standard error in either direction; these are not confidence intervals", xDomain: [Math.min(...intervals.flat()) - 1, Math.max(...intervals.flat()) + 1], yDomain: [0, estimates.length + 1], xLabel: "estimate units; segment Q \xB1 \u221AU", yLabel: "analysis identity", paths: intervals.map((values, i) => ({
      values: [[values[0], i + 1], [values[1], i + 1]],
      color: ink.A
    })), points: estimates.map((value, i) => ({
      id: `analysis${i + 1}`,
      x: value,
      y: i + 1
    })) }),
    /* @__PURE__ */ jsx3("p", { children: "The segment half-length is \u221AU, measured in estimate units. It shows each analysis\u2019s uncertainty separately from variation between estimates." }),
    /* @__PURE__ */ jsx3(NumberLine, { values: estimates, marks: [{
      id: "mean Q",
      value: state.estimate
    }], label: "Estimate axis; variances are not lengths on this axis" }),
    /* @__PURE__ */ jsx3(Bars, { label: "Additive variance components in squared estimate units", rows: [{
      name: "within",
      value: state.within
    }, {
      name: "between",
      value: state.between,
      color: ink.B
    }, {
      name: "finite-m B/m",
      value: state.simulation,
      color: ink.query
    }] }),
    /* @__PURE__ */ jsx3(Cells, { names: ["pooled estimate", "total variance T", "SE=\u221AT (estimate units)"], values: [state.estimate, state.total, state.standardError] })
  ] });
}

// docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/runtime-preview/PreparationInvestigations.jsx
import { Fragment as Fragment3, jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function Select({
  label,
  value,
  onChange,
  options
}) {
  const id = useId3();
  return /* @__PURE__ */ jsxs4("label", { className: "prep-control", htmlFor: id, children: [
    label,
    /* @__PURE__ */ jsx4("select", { id, value, onChange: (event) => onChange(event.target.value), children: options.map((option) => {
      const row = Array.isArray(option) ? option : [option, option];
      return /* @__PURE__ */ jsx4("option", { value: row[0], children: row[1] }, row[0]);
    }) })
  ] });
}
function Text({
  label,
  value,
  onChange,
  numeric = false,
  error
}) {
  const id = useId3(), errorId = `${id}-error`;
  return /* @__PURE__ */ jsxs4("label", { className: "prep-control", htmlFor: id, children: [
    label,
    /* @__PURE__ */ jsx4("input", { id, type: "text", inputMode: numeric ? "decimal" : void 0, value, "aria-invalid": Boolean(error), "aria-describedby": error ? errorId : void 0, onChange: (event) => onChange(event.target.value) }),
    error ? /* @__PURE__ */ jsx4("span", { id: errorId, className: "prep-error", children: error }) : null
  ] });
}
function NumberEditor({
  label,
  value,
  onChange,
  minimum,
  maximum,
  step = 0.1,
  nullable = false,
  blankMeaning = "missing"
}) {
  const number = value.trim() === "" ? null : Number(value);
  const error = number === null ? nullable ? "" : "Enter a finite number." : !Number.isFinite(number) || number < minimum || number > maximum ? `Enter a number from${minimum} to${maximum}.` : "";
  const id = useId3();
  return /* @__PURE__ */ jsxs4("div", { className: "prep-control", children: [
    /* @__PURE__ */ jsx4(Text, { label: `${label}${nullable ? ` (blank = ${blankMeaning})` : ""}`, value, onChange, numeric: true, error }),
    number !== null && !error ? /* @__PURE__ */ jsxs4(Fragment3, { children: [
      /* @__PURE__ */ jsxs4("label", { htmlFor: id, children: [
        label,
        " slider"
      ] }),
      /* @__PURE__ */ jsx4("input", { id, type: "range", min: minimum, max: maximum, step, value: number, onChange: (event) => onChange(event.target.value) })
    ] }) : null
  ] });
}
function parseDraft(value, minimum, maximum, nullable = false, integer = false) {
  if (value.trim() === "" && nullable) return null;
  if (value.trim() === "") throw Error("Enter a finite number; a blank draft is not zero.");
  const result = Number(value);
  if (!Number.isFinite(result) || result < minimum || result > maximum || integer && !Number.isInteger(result)) throw Error(`Enter${integer ? " an integer" : " a finite value"} from${minimum} to${maximum}.`);
  return result;
}
function Current({
  calculate,
  children
}) {
  let value;
  try {
    value = calculate();
  } catch (error) {
    return /* @__PURE__ */ jsxs4("p", { role: "status", className: "prep-error", children: [
      "Current draft has no result: ",
      error.message
    ] });
  }
  return /* @__PURE__ */ jsx4("div", { className: "prep-current", "data-current-result": "", children: children(value) });
}
var ModelBoundary = class extends React4.Component {
  state = {
    error: null
  };
  static getDerivedStateFromError(error) {
    return {
      error
    };
  }
  render() {
    return this.state.error ? /* @__PURE__ */ jsxs4("p", { role: "status", className: "prep-error", children: [
      "Current inputs are refused: ",
      this.state.error.message
    ] }) : this.props.children;
  }
};
function SafeModel({
  identity,
  children
}) {
  return /* @__PURE__ */ jsx4(ModelBoundary, { children }, identity);
}
function Divisors() {
  const [bill, setBill] = useState("1"), [mass, setMass] = useState("100");
  const [actionError, setActionError] = useState("");
  function doubleBoth() {
    try {
      const [nextBill, nextMass] = doubleDivisors([parseDraft(bill, 0.1, 10), parseDraft(mass, 1, 500)]);
      setBill(String(nextBill));
      setMass(String(nextMass));
      setActionError("");
    } catch (error) {
      setActionError(error.message);
    }
  }
  return /* @__PURE__ */ jsxs4(Fragment3, { children: [
    /* @__PURE__ */ jsx4(Current, { calculate: () => [parseDraft(bill, 0.1, 10), parseDraft(mass, 1, 500)], children: (values) => /* @__PURE__ */ jsx4(DistanceView, { divisors: values }) }),
    /* @__PURE__ */ jsxs4("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx4(NumberEditor, { label: "Bill divisor", minimum: 0.1, maximum: 10, value: bill, onChange: (value) => {
        setBill(value);
        setActionError("");
      } }),
      /* @__PURE__ */ jsx4(NumberEditor, { label: "Mass divisor", minimum: 1, maximum: 500, step: 1, value: mass, onChange: (value) => {
        setMass(value);
        setActionError("");
      } }),
      /* @__PURE__ */ jsx4("button", { type: "button", onClick: doubleBoth, children: "Double both divisors" })
    ] }),
    actionError ? /* @__PURE__ */ jsx4("p", { className: "prep-error", role: "status", children: actionError }) : null,
    /* @__PURE__ */ jsx4("p", { className: "prep-live", children: "Mass divisor1 restores the raw ranking. Common rescaling changes lengths while preserving ranking." })
  ] });
}
function PointEdit() {
  const [selected, setSelected] = useState("A");
  const [drafts, setDrafts] = useState(Object.fromEntries(Object.entries(points).map(([key, row]) => [key, row.map(String)])));
  const [actionError, setActionError] = useState("");
  function translateAll() {
    try {
      const data = Object.fromEntries(Object.entries(drafts).map(([key, row]) => [key, [parseDraft(row[0], 0, 100), parseDraft(row[1], 0, 1e4)]]));
      setDrafts(Object.fromEntries(Object.entries(translateCases(data)).map(([key, row]) => [key, row.map(String)])));
      setActionError("");
    } catch (error) {
      setActionError(error.message);
    }
  }
  const update = (j, value) => {
    setActionError("");
    setDrafts((old) => ({
      ...old,
      [selected]: old[selected].map((entry, i) => i === j ? value : entry)
    }));
  };
  return /* @__PURE__ */ jsxs4(Fragment3, { children: [
    /* @__PURE__ */ jsx4(Current, { calculate: () => Object.fromEntries(Object.entries(drafts).map(([key, row]) => [key, [parseDraft(row[0], 0, 100), parseDraft(row[1], 0, 1e4)]])), children: (data) => /* @__PURE__ */ jsx4(DistanceView, { data }) }),
    /* @__PURE__ */ jsxs4("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx4(Select, { label: "Actual case to edit", value: selected, onChange: setSelected, options: ["Q", "A", "B"] }),
      /* @__PURE__ */ jsx4(NumberEditor, { label: `${selected} bill mm`, value: drafts[selected][0], onChange: (value) => update(0, value), minimum: 0, maximum: 100 }),
      /* @__PURE__ */ jsx4(NumberEditor, { label: `${selected} mass g`, value: drafts[selected][1], onChange: (value) => update(1, value), minimum: 0, maximum: 1e4, step: 1 }),
      /* @__PURE__ */ jsx4("button", { type: "button", onClick: translateAll, children: "Translate all: +1 mm, +10 g" })
    ] }),
    actionError ? /* @__PURE__ */ jsx4("p", { className: "prep-error", role: "status", children: actionError }) : null,
    /* @__PURE__ */ jsx4("p", { className: "prep-live", children: "Try A mass4400, or make A equal Q. Divisors remain1/100; circles use current values." })
  ] });
}
function RulerEdit() {
  const [last, setLast] = useState("100"), [query, setQuery] = useState("150"), [kind, setKind] = useState("robust");
  return /* @__PURE__ */ jsxs4(Fragment3, { children: [
    /* @__PURE__ */ jsx4(Current, { calculate: () => [parseDraft(last, 0, 1e3), parseDraft(query, 0, 1500)], children: (values) => /* @__PURE__ */ jsx4(RulerView, { training: [1, 2, 3, 4, values[0]], query: values[1], selected: kind }) }),
    /* @__PURE__ */ jsxs4("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx4(NumberEditor, { label: "Last training value", minimum: 0, maximum: 1e3, step: 1, value: last, onChange: setLast }),
      /* @__PURE__ */ jsx4(Select, { label: "Fitted ruler", value: kind, onChange: setKind, options: ["standard", "minmax", "robust", "maxabs"] }),
      /* @__PURE__ */ jsx4(NumberEditor, { label: "Later query", minimum: 0, maximum: 1500, step: 1, value: query, onChange: setQuery })
    ] }),
    /* @__PURE__ */ jsx4("p", { className: "prep-live", children: "Training edits change saved statistics; query edits change only its output. Here100\u21921000 retains the central median/IQR3/2." })
  ] });
}
function CategoryEdit() {
  const [query, setQuery] = useState("new"), [policy, setPolicy] = useState("infrequent"), [minimum, setMinimum] = useState("2");
  return /* @__PURE__ */ jsxs4(Fragment3, { children: [
    /* @__PURE__ */ jsx4(Current, { calculate: () => parseDraft(minimum, 1, 8, false, true), children: (count) => /* @__PURE__ */ jsx4(SafeModel, { identity: `${query}|${policy}|${count}`, children: /* @__PURE__ */ jsx4(CategoryView, { query: query === "None" ? null : query, minimum: count, policy }) }) }),
    /* @__PURE__ */ jsxs4("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx4(Text, { label: "Query label (None = missing)", value: query, onChange: setQuery }),
      /* @__PURE__ */ jsx4(Select, { label: "Unknown policy", value: policy, onChange: setPolicy, options: [["infrequent", "Infrequent if present"], ["zero", "All-zero"], ["error", "Error"]] }),
      /* @__PURE__ */ jsx4(NumberEditor, { label: "Minimum count", minimum: 1, maximum: 8, step: 1, value: minimum, onChange: setMinimum })
    ] }),
    /* @__PURE__ */ jsx4("p", { className: "prep-live", children: "Compare a, b, None and new. The query does not update training counts." })
  ] });
}
function DonorEdit() {
  const [drafts, setDrafts] = useState(donorFixture.map((row) => row.map((value) => value === null ? "" : String(value))));
  const [selected, setSelected] = useState("2,2"), [count, setCount] = useState("2");
  const [i, j] = selected.split(",").map(Number);
  const options = drafts.flatMap((row, r) => row.map((_value, c) => [`${r},${c}`, `${r === 0 ? "Q" : `D${r}`} ${["a", "b", "target c"][c]}`]).filter((_entry, c) => r !== 0 || c !== 2));
  return /* @__PURE__ */ jsxs4(Fragment3, { children: [
    /* @__PURE__ */ jsx4(Current, { calculate: () => ({
      table: drafts.map((row) => row.map((value) => parseDraft(value, -1e4, 1e4, true))),
      k: parseDraft(count, 1, 3, false, true)
    }), children: (state) => /* @__PURE__ */ jsx4(SafeModel, { identity: JSON.stringify(state), children: /* @__PURE__ */ jsx4(DonorView, { table: state.table, k: state.k }) }) }),
    /* @__PURE__ */ jsxs4("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx4(Select, { label: "Query or donor cell", value: selected, onChange: setSelected, options }),
      /* @__PURE__ */ jsx4(NumberEditor, { label: "Selected cell", minimum: -1e4, maximum: 1e4, step: 1, nullable: true, value: drafts[i][j], onChange: (value) => setDrafts((old) => old.map((row, r) => r === i ? row.map((entry, c) => c === j ? value : entry) : row)) }),
      /* @__PURE__ */ jsx4(NumberEditor, { label: "Target-eligible neighbours k", minimum: 1, maximum: 3, step: 1, value: count, onChange: setCount })
    ] }),
    /* @__PURE__ */ jsx4("p", { className: "prep-live", children: "Blank D2 target to remove eligibility. D1 target140 gives220. An unused D3 target change leaves the two-donor estimate unchanged." })
  ] });
}
function SmallQueryEdit() {
  const [drafts, setDrafts] = useState(["30", "", "9"]), [selected, setSelected] = useState("2");
  const j = Number(selected);
  return /* @__PURE__ */ jsxs4(Fragment3, { children: [
    /* @__PURE__ */ jsx4(Current, { calculate: () => drafts.map((value) => parseDraft(value, -1e4, 1e4, true)), children: (row) => /* @__PURE__ */ jsx4(SmallPreparationView, { row, label: "a" }) }),
    /* @__PURE__ */ jsxs4("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx4(Select, { label: "Numeric query cell", value: selected, onChange: setSelected, options: ["0", "1", "2"] }),
      /* @__PURE__ */ jsx4(NumberEditor, { label: "Query value", minimum: -1e4, maximum: 1e4, step: 1, nullable: true, value: drafts[j], onChange: (value) => setDrafts((old) => old.map((entry, i) => i === j ? value : entry)) })
    ] }),
    /* @__PURE__ */ jsx4("p", { className: "prep-live", children: "Category stays a. Third coordinate9 maps to2; fit arrays remain pinned." })
  ] });
}
function RealQueryEdit() {
  const [source, setSource] = useState("309"), [feature, setFeature] = useState("body_mass_g"), [value, setValue] = useState("4100");
  const fields = ["bill_length_mm", "bill_depth_mm", "flipper_length_mm", "body_mass_g", "sex"];
  function choose(nextSource, nextFeature) {
    setSource(nextSource);
    setFeature(nextFeature);
    setValue(observations[Number(nextSource)][nextFeature]?.toString() ?? "");
  }
  return /* @__PURE__ */ jsxs4(Fragment3, { children: [
    /* @__PURE__ */ jsx4(Current, { calculate: () => feature === "sex" ? value === "None" || value === "" ? null : value : parseDraft(value, 0, 1e6, true), children: (altered) => /* @__PURE__ */ jsxs4(Fragment3, { children: [
      /* @__PURE__ */ jsx4(RealPreparationView, { source: Number(source) }),
      /* @__PURE__ */ jsx4(RealPreparationView, { source: Number(source), feature, altered })
    ] }) }),
    /* @__PURE__ */ jsxs4("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx4(Select, { label: "Held-out source row", value: source, onChange: (next) => choose(next, feature), options: saved.scaled_inspection.test_source_rows.map((row) => [String(row), `${row} \xB7 ${observations[row].species}`]) }),
      /* @__PURE__ */ jsx4(Select, { label: "Feature in altered copy", value: feature, onChange: (next) => choose(source, next), options: fields }),
      feature === "sex" ? /* @__PURE__ */ jsx4(Text, { label: "Sex label (None/blank = missing)", value, onChange: setValue }) : /* @__PURE__ */ jsx4(NumberEditor, { label: "Altered measurement", minimum: 0, maximum: 1e6, step: 1, nullable: true, value, onChange: setValue })
    ] }),
    /* @__PURE__ */ jsx4("p", { className: "prep-live", children: "Queries cannot change fitted arrays, historical predictions or accuracy. Negative measurements are refused in this inspection domain." })
  ] });
}
function PowerEdit() {
  const [method, setMethod] = useState("YJ"), [x, setX] = useState("-3"), [lambda, setLambda] = useState("2");
  return /* @__PURE__ */ jsxs4(Fragment3, { children: [
    /* @__PURE__ */ jsx4(Current, { calculate: () => ({
      x: parseDraft(x, -10, 30),
      lambda: parseDraft(lambda, -3, 3)
    }), children: (state) => /* @__PURE__ */ jsx4(SafeModel, { identity: `${method}${JSON.stringify(state)}`, children: /* @__PURE__ */ jsx4(PowerView, { method, ...state }) }) }),
    /* @__PURE__ */ jsxs4("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx4(Select, { label: "Power method", value: method, onChange: setMethod, options: [["YJ", "Yeo\u2013Johnson"], ["BC", "Box\u2013Cox"]] }),
      /* @__PURE__ */ jsx4(NumberEditor, { label: "Input x", minimum: -10, maximum: 30, value: x, onChange: setX }),
      /* @__PURE__ */ jsx4(NumberEditor, { label: "Manual lambda", minimum: -3, maximum: 3, step: 0.01, value: lambda, onChange: setLambda })
    ] }),
    /* @__PURE__ */ jsx4("p", { className: "prep-live", children: "This lambda is manually edited. Saved learned P7 lambdas appear separately in D26. Try the negative logarithmic boundary\u03BB2 or identity\u03BB1." })
  ] });
}
function QuantileEdit() {
  const [x, setX] = useState("3"), [output, setOutput] = useState("uniform");
  return /* @__PURE__ */ jsxs4(Fragment3, { children: [
    /* @__PURE__ */ jsx4(Current, { calculate: () => parseDraft(x, -10, 1e3), children: (value) => /* @__PURE__ */ jsx4(QuantileView, { x: value, output }) }),
    /* @__PURE__ */ jsxs4("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx4(NumberEditor, { label: "Later query", minimum: -10, maximum: 1e3, step: 1, value: x, onChange: setX }),
      /* @__PURE__ */ jsx4(Select, { label: "Output coordinate", value: output, onChange: setOutput, options: ["uniform", "normal"] })
    ] }),
    /* @__PURE__ */ jsx4("p", { className: "prep-live", children: "Landmarks stay fixed. Try2 for its tie midpoint,3 for interpolation and1000 for saturation. Custom constant c\u2192.5 differs from ordinary c\u21920." })
  ] });
}
function CycleEdit() {
  const [first, setFirst] = useState("350"), [second, setSecond] = useState("10");
  return /* @__PURE__ */ jsxs4(Fragment3, { children: [
    /* @__PURE__ */ jsx4(Current, { calculate: () => [parseDraft(first, 0, 360), parseDraft(second, 0, 360)], children: (values) => /* @__PURE__ */ jsx4(CycleView, { first: values[0], second: values[1] }) }),
    /* @__PURE__ */ jsxs4("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx4(NumberEditor, { label: "Angle A degrees", minimum: 0, maximum: 360, step: 1, value: first, onChange: setFirst }),
      /* @__PURE__ */ jsx4(NumberEditor, { label: "Angle B degrees", minimum: 0, maximum: 360, step: 1, value: second, onChange: setSecond })
    ] }),
    /* @__PURE__ */ jsx4("p", { className: "prep-live", children: "Compare0/360,1/359 and30/150. The last pair shares sine but differs in cosine." })
  ] });
}
function SmoothingEdit() {
  const [support, setSupport] = useState("1"), [alpha, setAlpha] = useState("2");
  return /* @__PURE__ */ jsxs4(Fragment3, { children: [
    /* @__PURE__ */ jsx4(Current, { calculate: () => parseDraft(alpha, 0, 100), children: (value) => /* @__PURE__ */ jsx4(SmoothingView, { count: Number(support), alpha: value }) }),
    /* @__PURE__ */ jsxs4("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx4(Select, { label: "Positive category support", value: support, onChange: setSupport, options: [["1", "Singleton"], ["100", "100 positives"], ["0", "Absent category"]] }),
      /* @__PURE__ */ jsx4(NumberEditor, { label: "Smoothing alpha", minimum: 0, maximum: 100, step: 1, value: alpha, onChange: setAlpha })
    ] }),
    /* @__PURE__ */ jsx4("p", { className: "prep-live", children: "\u03B10 keeps a supported category mean; absent categories retain the prior fallback. Exclusion is separate." })
  ] });
}
function TargetEdit() {
  const initial = targetFixture.categories.map((label, i2) => [label, String(targetFixture.targets[i2]), String(targetFixture.folds[i2])]);
  const [drafts, setDrafts] = useState(initial), [selected, setSelected] = useState("3,1"), [inspected, setInspected] = useState("0");
  const [i, j] = selected.split(",").map(Number);
  return /* @__PURE__ */ jsxs4(Fragment3, { children: [
    /* @__PURE__ */ jsx4(Current, { calculate: () => ({
      categories: drafts.map((row) => row[0]),
      targets: drafts.map((row) => parseDraft(row[1], 0, 1, false, true)),
      folds: drafts.map((row) => parseDraft(row[2], 0, 1, false, true))
    }), children: (fixture) => /* @__PURE__ */ jsx4(SafeModel, { identity: JSON.stringify(fixture), children: /* @__PURE__ */ jsx4(CrossFitView, { fixture, selected: Number(inspected) }) }) }),
    /* @__PURE__ */ jsxs4("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx4(Select, { label: "Category, target or fold cell", value: selected, onChange: setSelected, options: drafts.flatMap((row, r) => row.map((_entry, c) => [`${r},${c}`, `row${r} ${["category", "target", "fold"][c]}`])) }),
      /* @__PURE__ */ jsx4(Text, { label: `Selected ${["category", "0/1 target", "0/1 fold"][j]}`, numeric: j !== 0, value: drafts[i][j], onChange: (value) => setDrafts((old) => old.map((row, r) => r === i ? row.map((entry, c) => c === j ? value : entry) : row)) }),
      /* @__PURE__ */ jsx4(Select, { label: "Inspected encoded row", value: inspected, onChange: setInspected, options: ["0", "1", "2", "3", "4", "5"] })
    ] }),
    /* @__PURE__ */ jsx4("p", { className: "prep-live", children: "Flip row3 target0\u21921: row0 becomes7/9 through its prior; row3's own4/9 stays fixed. Changing row0's own target leaves row0 unchanged." })
  ] });
}
function HashEdit() {
  const [selected, setSelected] = useState("1"), [counts, setCounts] = useState(["3", "1", "2"]), [mapping, setMapping] = useState(["0,1", "0,-1", "1,1"]);
  const i = Number(selected);
  return /* @__PURE__ */ jsxs4(Fragment3, { children: [
    /* @__PURE__ */ jsx4(Current, { calculate: () => counts.map((value) => parseDraft(value, 0, 10, false, true)), children: (values) => /* @__PURE__ */ jsx4(HashView, { counts: values, buckets: mapping.map((value) => Number(value.split(",")[0])), signs: mapping.map((value) => Number(value.split(",")[1])) }) }),
    /* @__PURE__ */ jsxs4("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx4(Select, { label: "Token", value: selected, onChange: setSelected, options: [["0", "apple"], ["1", "pear"], ["2", "banana"]] }),
      /* @__PURE__ */ jsx4(NumberEditor, { label: "Token count", minimum: 0, maximum: 10, step: 1, value: counts[i], onChange: (value) => setCounts((old) => old.map((entry, j) => j === i ? value : entry)) }),
      /* @__PURE__ */ jsx4(Select, { label: "Declared bucket and sign", value: mapping[i], onChange: (value) => setMapping((old) => old.map((entry, j) => j === i ? value : entry)), options: [["0,1", "bucket0 sign+"], ["0,-1", "bucket0 sign\u2212"], ["1,1", "bucket1 sign+"], ["1,-1", "bucket1 sign\u2212"]] })
    ] }),
    /* @__PURE__ */ jsx4("p", { className: "prep-live", children: "This is the constructed map, separate from FeatureHasher. A zero-count token contributes nothing even if its map changes." })
  ] });
}
function IterativeEdit() {
  const [selected, setSelected] = useState("3,0"), [drafts, setDrafts] = useState({
    "3,0": "",
    "2,1": ""
  }), [turn, setTurn] = useState("0");
  return /* @__PURE__ */ jsxs4(Fragment3, { children: [
    /* @__PURE__ */ jsx4(Current, { calculate: () => ({
      "3,0": parseDraft(drafts["3,0"], -20, 20, true),
      "2,1": parseDraft(drafts["2,1"], -20, 20, true)
    }), children: (initialOverrides) => /* @__PURE__ */ jsx4(ConditionalView, { turn: Number(turn), initialOverrides }) }),
    /* @__PURE__ */ jsxs4("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx4(Select, { label: "Original missing cell initialization", value: selected, onChange: setSelected, options: [["3,0", "row3 a"], ["2,1", "row2 b"]] }),
      /* @__PURE__ */ jsx4(NumberEditor, { label: "Initial estimate", blankMeaning: "median", minimum: -20, maximum: 20, step: 0.1, nullable: true, value: drafts[selected], onChange: (value) => setDrafts((old) => ({
        ...old,
        [selected]: value
      })) }),
      /* @__PURE__ */ jsx4(Select, { label: "Conditional turn", value: turn, onChange: setTurn, options: Array.from({
        length: 7
      }, (_, i) => [String(i), i ? `turn${i}` : "median/edited initialization"]) })
    ] }),
    /* @__PURE__ */ jsx4("p", { className: "prep-live", children: "Only original gaps accept initial estimates; observations and response rows stay fixed. Steps0\u20266 expose feedback. The three-sweep cap does not assert convergence." })
  ] });
}
function PoolEdit() {
  const [selected, setSelected] = useState("Q,0"), [estimates, setEstimates] = useState(["9", "10", "11"]), [variances, setVariances] = useState(["4", "4", "4"]);
  const [kind, index] = selected.split(","), i = Number(index), values = kind === "Q" ? estimates : variances;
  return /* @__PURE__ */ jsxs4(Fragment3, { children: [
    /* @__PURE__ */ jsx4(Current, { calculate: () => ({
      estimates: estimates.map((value) => parseDraft(value, -100, 100)),
      variances: variances.map((value) => parseDraft(value, 0, 100))
    }), children: (state) => /* @__PURE__ */ jsx4(PoolView, { ...state }) }),
    /* @__PURE__ */ jsxs4("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx4(Select, { label: "Analysis estimate or variance", value: selected, onChange: setSelected, options: ["Q", "U"].flatMap((name) => [0, 1, 2].map((j) => [`${name},${j}`, `${name}${j + 1}`])) }),
      /* @__PURE__ */ jsx4(NumberEditor, { label: kind === "Q" ? "Estimate Q" : "Variance U (squared units)", minimum: kind === "Q" ? -100 : 0, maximum: 100, step: 0.1, value: values[i], onChange: (value) => (kind === "Q" ? setEstimates : setVariances)((old) => old.map((entry, j) => j === i ? value : entry)) })
    ] }),
    /* @__PURE__ */ jsx4("p", { className: "prep-live", children: "Q edits can change between variance; U edits change within variance. Identical Q makes between variance zero. The pooling contract refuses m1 or negative U." })
  ] });
}
function SensitivityEdit() {
  const [delta, setDelta] = useState("0");
  return /* @__PURE__ */ jsxs4(Fragment3, { children: [
    /* @__PURE__ */ jsx4(Current, { calculate: () => parseDraft(delta, -2, 2), children: (value) => /* @__PURE__ */ jsxs4(Fragment3, { children: [
      /* @__PURE__ */ jsx4(Matrix, { columns: ["baseline completion1", "shifted completion1", "original missing M"], values: completionTables[0].map((entry, i) => [entry, entry + ([2, 4].includes(i) ? value : 0), Number([2, 4].includes(i))]), missing: completionTables[0].map((_entry, i) => [[2, 4].includes(i), [2, 4].includes(i), false]), label: "First of five retained baseline draws, rounded; only original gaps shift by \u03B4" }),
      /* @__PURE__ */ jsx4(Plot, { label: "Fixed normal-model draws under an assumed missing-cell shift", xDomain: [-2, 2], yDomain: [7.5, 10], xLabel: "assumed delta", yLabel: "pooled mean", paths: [{
        values: [[-2, sensitivity(-2)], [2, sensitivity(2)]]
      }], points: [{
        x: value,
        y: sensitivity(value),
        id: "current"
      }] }),
      /* @__PURE__ */ jsx4(Cells, { names: ["assumed delta", "pooled mean", "no-missing contrast"], values: [value, sensitivity(value), "unchanged with no missing cells"] })
    ] }) }),
    /* @__PURE__ */ jsx4("div", { className: "prep-controls", children: /* @__PURE__ */ jsx4(NumberEditor, { label: "Assumed missing-cell delta", minimum: -2, maximum: 2, step: 0.1, value: delta, onChange: setDelta }) }),
    /* @__PURE__ */ jsx4("p", { className: "prep-live", children: "Seed20, five draws and the prior stay fixed. Baseline8.686461347735442+.4\u03B4 is not a confidence interval or an estimated MNAR mechanism." })
  ] });
}
var implementations = {
  L1: Divisors,
  L2: PointEdit,
  L3: RulerEdit,
  L4: CategoryEdit,
  L5: DonorEdit,
  L6: SmallQueryEdit,
  L7: RealQueryEdit,
  L8: PowerEdit,
  L9: QuantileEdit,
  L10: CycleEdit,
  L11a: SmoothingEdit,
  L11b: TargetEdit,
  L12: HashEdit,
  L13: IterativeEdit,
  L14a: PoolEdit,
  L14b: SensitivityEdit
};
function PreparationInvestigation({
  id
}) {
  const [epoch, setEpoch] = useState(0), Implementation = implementations[id];
  if (!Implementation) throw Error(`Unknown investigation ${id}`);
  return /* @__PURE__ */ jsxs4("section", { className: "prep-investigation", "data-investigation-id": id, "aria-label": `${id} live investigation`, children: [
    /* @__PURE__ */ jsx4(Implementation, {}, epoch),
    /* @__PURE__ */ jsx4("div", { className: "prep-controls", children: /* @__PURE__ */ jsx4("button", { type: "button", onClick: () => setEpoch((value) => value + 1), "aria-label": `Reset ${id} values, drafts, selection and trace`, children: "Reset investigation" }) })
  ] });
}
export {
  Current,
  NumberEditor,
  PreparationInvestigation,
  SafeModel,
  Select,
  Text,
  parseDraft
};
