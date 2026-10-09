// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/author-operation-correction/.scenario-state.mjs
import React from "react";
function scenarioState(initial) {
  const s = globalThis.__nmfScopedState, i = s.index++;
  return React.useState(i < s.values.length ? s.values[i] : initial);
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/GeometryFigures.jsx
import React4, { useState } from "react";

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/Drawing.jsx
import React2, { useId } from "react";

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/nmf-model.js
var X0 = [[2, 1, 3], [1, 3, 4], [0, 2, 2]];
var H0 = [[1, 0, 1], [0, 1, 1]];
var W0 = [[2, 1], [1, 3], [0, 2]];
var onesW = [[1, 1], [1, 1], [1, 1]];
var transpose = (a) => a[0].map((_, j) => a.map((r) => r[j]));
var dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
var matmul = (a, b) => a.map((r) => transpose(b).map((c) => dot(r, c)));
var add = (a, b) => a.map((r, i) => r.map((v, j) => v + b[i][j]));
var scale = (a, s) => a.map((r) => r.map((v) => v * s));
var halfLoss = (x, y, mask) => x.reduce((s, r, i) => s + r.reduce((t, v, j) => t + (mask?.[i]?.[j] ?? 1) * (v - y[i][j]) ** 2 / 2, 0), 0);
var clamp = (v, l, h) => Math.max(l, Math.min(h, v));
function table(values, {
  nonnegative = true
} = {}) {
  if (!Array.isArray(values) || !values.length || !Array.isArray(values[0]) || !values[0].length) throw Error("Supply a nonempty rectangular real table.");
  const d = values[0].length;
  if (values.some((r) => !Array.isArray(r) || r.length !== d || r.some((v) => typeof v !== "number" || !Number.isFinite(v) || nonnegative && v < 0))) throw Error("Values must be finite, real, rectangular and nonnegative.");
  return values.map((r) => r.slice());
}
function coordinateBlock(x, w, h, {
  l1 = 0,
  l2 = 0
} = {}) {
  x = table(x);
  w = table(w);
  h = table(h);
  if (x.length !== w.length || x[0].length !== h[0].length || w[0].length !== h.length) throw Error("Coordinate shapes disagree.");
  const g = matmul(h, transpose(h)), p = matmul(x, transpose(h)), trace = [{
    w: w.map((r) => r.slice()),
    loss: halfLoss(x, matmul(w, h)),
    component: null
  }];
  for (let c = 0; c < h.length; c++) {
    for (let i = 0; i < w.length; i++) {
      const other = w[i].reduce((s, v, t) => s + (t === c ? 0 : v * g[t][c]), 0), den = g[c][c] + l2;
      if (den === 0) {
        if (p[i][c] !== 0) throw Error("Inconsistent flat coordinate.");
        w[i][c] = 0;
      } else w[i][c] = Math.max(0, (p[i][c] - other - l1) / den);
    }
    trace.push({
      w: w.map((r) => r.slice()),
      loss: halfLoss(x, matmul(w, h)),
      component: c
    });
  }
  return {
    w,
    g,
    p,
    trace
  };
}
function cdSweep(x, w, h) {
  const first = coordinateBlock(x, w, h), second = coordinateBlock(transpose(x), transpose(h), transpose(first.w));
  return {
    w: first.w,
    h: transpose(second.w),
    wTrace: first.trace,
    hTrace: second.trace
  };
}
function muSweep(x, w, h) {
  const ratio = (a, b) => a.map((r, i) => r.map((v, j) => b[i][j] === 0 ? v === 0 ? 1 : (() => {
    throw Error("Positive numerator over zero denominator.");
  })() : v / b[i][j]));
  const multiply = (a, b) => a.map((r, i) => r.map((v, j) => v * b[i][j]));
  const hn = matmul(transpose(w), x), hd = matmul(matmul(transpose(w), w), h), nextH = multiply(h, ratio(hn, hd));
  const wn = matmul(x, transpose(nextH)), wd = matmul(w, matmul(nextH, transpose(nextH))), nextW = multiply(w, ratio(wn, wd));
  return {
    w: nextW,
    h: nextH,
    hn,
    hd,
    wn,
    wd
  };
}
function divergence(x, y, beta = 2) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) throw Error("Loss needs finite nonnegative values.");
  if (beta === 2) return (x - y) ** 2 / 2;
  if (beta === 1) {
    if (x === 0) return y;
    if (y === 0) throw Error("Positive observation over zero prediction has infinite KL.");
    return x * Math.log(x / y) - x + y;
  }
  if (x <= 0 || y <= 0) throw Error("This beta illustration requires positive observation and prediction.");
  if (beta === 0) return x / y - Math.log(x / y) - 1;
  return (x ** beta + (beta - 1) * y ** beta - beta * x * y ** (beta - 1)) / (beta * (beta - 1));
}
var gamma = (b) => b < 1 ? 1 / (2 - b) : b <= 2 ? 1 : 1 / (b - 1);
function coneQuery(u, v) {
  const w = v <= u ? [u - v, v] : [0, (u + v) / 2];
  return {
    w,
    prediction: [w[0] + w[1], w[1]]
  };
}
function shear(t) {
  return {
    w: [[2, 1 + 2 * t]],
    h: [[1, 1 - t, 1 - t], [0, 1, 1]],
    product: [[2, 3, 3]]
  };
}
function signPair(a) {
  const u = [a, -Math.sqrt(Math.max(0, 1 - a * a))], v = [0.6, -0.8];
  const positive = Math.max(u[0], 0) * 0.6, negative = Math.max(-u[1], 0) * 0.8;
  const choosePositive = positive >= negative, weight = 5 * (choosePositive ? positive : negative);
  return {
    u,
    v,
    positive,
    negative,
    choosePositive,
    term: choosePositive ? [[weight, 0], [0, 0]] : [[0, 0], [0, weight]]
  };
}
function staleCode(h) {
  const den = 2 * h * h + 1, w = [(4 * h + 2) / den, (4 * h * h - 2 * h + 1) / den], dictionary = [[h, 0, 1], [0, 1, 1]];
  return {
    w,
    dictionary,
    oldPrediction: matmul([[2, 1]], dictionary)[0],
    freshPrediction: matmul([w], dictionary)[0]
  };
}
var fmt = (v) => typeof v === "number" ? Math.abs(v) < 1e-10 ? "0" : Number(v.toFixed(6)).toString() : String(v);

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/Drawing.jsx
import { jsx, jsxs } from "react/jsx-runtime";
var colors = ["#7bb7ff", "#ee8faf", "#78d3e2", "#c1a1ee", "#f2c276", "#9b9fe8", "#dca47e", "#e1c7cf"];
function Figure({
  id,
  caption,
  children
}) {
  return /* @__PURE__ */ jsxs("figure", { className: "nmf-figure", "data-nmf-figure": id, children: [
    children,
    /* @__PURE__ */ jsx("figcaption", { children: caption })
  ] });
}
function Panels({
  children
}) {
  return /* @__PURE__ */ jsx("div", { className: "nmf-panels", children });
}
function Matrix({
  values,
  label,
  rows,
  columns,
  componentRows = false,
  componentColumns = false,
  color,
  selected,
  selectedCells = [],
  hatchedCells = [],
  originalZeros = [],
  signed = false,
  max = 4
}) {
  const contains = (cells, i, j) => cells.some(([r, c]) => r === i && c === j);
  return /* @__PURE__ */ jsxs("div", { className: "nmf-array", children: [
    /* @__PURE__ */ jsx("p", { className: "nmf-object-label", children: label }),
    /* @__PURE__ */ jsx("div", { className: "nmf-array-scroll", tabIndex: 0, role: "region", "aria-label": `${label}; complete labelled array, scroll horizontally when needed`, children: /* @__PURE__ */ jsxs("table", { children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { scope: "col", "aria-label": "Row identity" }),
        values[0].map((_, j) => /* @__PURE__ */ jsx("th", { scope: "col", children: columns?.[j] ?? `F${j}` }, j))
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: values.map((r, i) => /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { scope: "row", children: rows?.[i] ?? `R${i}` }),
        r.map((v, j) => /* @__PURE__ */ jsx("td", { "data-missing": typeof v === "string" && /missing|not observed|excluded/.test(v) ? "" : void 0, "data-selected": selected?.[0] === i && selected?.[1] === j || contains(selectedCells, i, j) ? "" : void 0, "data-negative-origin": contains(hatchedCells, i, j) ? "" : void 0, "data-original-zero": contains(originalZeros, i, j) ? "" : void 0, style: {
          backgroundColor: typeof v === "number" ? `color-mix(in srgb, ${color ?? (signed ? v < 0 ? "#ee8faf" : "#7bb7ff" : componentRows || rows?.every((r2) => /^C\d$/.test(r2)) ? colors[i % 8] : componentColumns || columns?.every((c) => /^C\d$/.test(c)) ? colors[j % 8] : "#9ca7b5")} ${Math.min(75, Math.abs(v) / max * 65)}%, transparent)` : void 0
        }, children: fmt(v) }, j))
      ] }, i)) })
    ] }) })
  ] });
}
function Bars({
  values,
  label,
  ids,
  max = 4,
  component = false,
  signed = false,
  color = "#aab6c7"
}) {
  return /* @__PURE__ */ jsxs("div", { className: "nmf-bars", children: [
    /* @__PURE__ */ jsx("p", { className: "nmf-object-label", children: label }),
    /* @__PURE__ */ jsxs("p", { className: "nmf-ruler", children: [
      signed ? `\u2212${max} \xB7 0 \xB7 +${max}` : `0 \u2192 ${max}`,
      " \xB7 units named above"
    ] }),
    values.map((v, i) => /* @__PURE__ */ jsxs("div", { className: "nmf-bar-row", children: [
      /* @__PURE__ */ jsx("span", { children: ids?.[i] ?? `F${i}` }),
      /* @__PURE__ */ jsx("span", { className: `nmf-bar-track${signed ? " nmf-bar-track--signed" : ""}`, children: /* @__PURE__ */ jsx("span", { style: {
        left: signed ? v < 0 ? `${50 - 50 * Math.abs(v) / max}%` : "50%" : 0,
        width: `${(signed ? 50 : 100) * Math.abs(v) / max}%`,
        background: signed ? v < 0 ? colors[1] : colors[0] : component ? colors[i % 8] : color
      } }) }),
      /* @__PURE__ */ jsx("output", { children: fmt(v) })
    ] }, i))
  ] });
}
function Plot({
  label,
  xmin = 0,
  xmax = 4,
  ymin = 0,
  ymax = 4,
  xlabel = "F0",
  ylabel = "F1",
  xticks,
  equalUnits = false,
  children
}) {
  const unit = 210 / Math.max(xmax - xmin, ymax - ymin);
  const height = equalUnits ? unit * (ymax - ymin) : 210;
  const width = equalUnits ? unit * (xmax - xmin) : 210;
  const map = ([x, y]) => [60 + (x - xmin) / (xmax - xmin) * width, 250 - (y - ymin) / (ymax - ymin) * height];
  return /* @__PURE__ */ jsxs("div", { className: "nmf-plot", children: [
    /* @__PURE__ */ jsx("p", { className: "nmf-object-label", children: label }),
    /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 300 282", role: "img", "aria-label": `${label}; ${xlabel} horizontal ${xmin}\u2013${xmax}, ${ylabel} vertical ${ymin}\u2013${ymax}${equalUnits ? "; equal distance for one unit on both axes" : ""}`, children: [
      /* @__PURE__ */ jsx("path", { d: `M60 ${250 - height - 15}V250H${60 + width + 10}`, fill: "none", stroke: "currentColor", opacity: ".6" }),
      [0, 0.25, 0.5, 0.75, 1].map((t) => /* @__PURE__ */ jsxs("g", { children: [
        /* @__PURE__ */ jsx("path", { d: `M55 ${250 - t * height}h5`, stroke: "currentColor" }),
        /* @__PURE__ */ jsx("text", { x: 51, y: 255 - t * height, textAnchor: "end", children: fmt(ymin + t * (ymax - ymin)) })
      ] }, t)),
      (xticks ?? [0, 0.25, 0.5, 0.75, 1].map((t) => xmin + t * (xmax - xmin))).map((x) => /* @__PURE__ */ jsxs("g", { children: [
        /* @__PURE__ */ jsx("path", { d: `M${map([x, ymin])[0]} 250v5`, stroke: "currentColor" }),
        /* @__PURE__ */ jsx("text", { x: map([x, ymin])[0], y: "275", textAnchor: "middle", children: fmt(x) })
      ] }, x)),
      children(map)
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "nmf-ruler", children: [
      "Horizontal: ",
      xlabel,
      ". Vertical: ",
      ylabel,
      ".",
      equalUnits && " Both axes use equal-length units."
    ] })
  ] });
}
function Point({
  at,
  label,
  color = colors[0],
  open = false,
  diamond = false
}) {
  return /* @__PURE__ */ jsxs("g", { children: [
    diamond ? /* @__PURE__ */ jsx("path", { d: `M${at[0]} ${at[1] - 7}l7 7l-7 7l-7-7Z`, fill: open ? "none" : color, stroke: color, strokeWidth: "2" }) : /* @__PURE__ */ jsx("circle", { cx: at[0], cy: at[1], r: "5", fill: open ? "none" : color, stroke: color, strokeWidth: "2" }),
    label && /* @__PURE__ */ jsx("text", { x: at[0] + (at[0] > 215 ? -10 : 10), y: at[1] + (at[1] < 45 ? 22 : -10), textAnchor: at[0] > 215 ? "end" : "start", fill: color, children: label })
  ] });
}
function Arrow({
  from,
  to,
  color = colors[0],
  dashed = false
}) {
  const id = useId().replaceAll(":", "");
  if (from[0] === to[0] && from[1] === to[1]) return null;
  return /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsx("marker", { id, markerWidth: "6", markerHeight: "6", refX: "5", refY: "3", orient: "auto", children: /* @__PURE__ */ jsx("path", { d: "M0 0L6 3L0 6Z", fill: color }) }) }),
    /* @__PURE__ */ jsx("path", { d: `M${from.join(" ")}L${to.join(" ")}`, stroke: color, strokeWidth: "2", strokeDasharray: dashed ? "5 4" : void 0, markerEnd: `url(#${id})` })
  ] });
}
function Curve({
  map,
  fn,
  xmin = 0,
  xmax = 4,
  color = colors[0]
}) {
  const points = Array.from({
    length: 81
  }, (_, i) => {
    const x = xmin + i * (xmax - xmin) / 80;
    return map([x, fn(x)]).join(",");
  }).join(" ");
  return /* @__PURE__ */ jsx("polyline", { points, fill: "none", stroke: color, strokeWidth: "2.5" });
}
function Controls({
  children,
  onReset
}) {
  return /* @__PURE__ */ jsxs("div", { className: "nmf-controls", children: [
    children,
    /* @__PURE__ */ jsx("button", { type: "button", onClick: onReset, children: "Reset" })
  ] });
}
function Range({
  label,
  value,
  onChange,
  min = 0,
  max = 4,
  step = 0.25
}) {
  const id = useId();
  return /* @__PURE__ */ jsxs("label", { htmlFor: id, children: [
    label,
    ": ",
    /* @__PURE__ */ jsx("output", { children: fmt(value) }),
    /* @__PURE__ */ jsx("input", { id, type: "range", value, min, max, step, onChange: (e) => onChange(Number(e.target.value)) })
  ] });
}
function Result({
  children
}) {
  return /* @__PURE__ */ jsx("p", { className: "nmf-current", "aria-live": "polite", "aria-atomic": "true", children });
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/Operations.jsx
import React3 from "react";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function Operation({ label, children }) {
  return /* @__PURE__ */ jsx2("div", { className: "nmf-operation", role: "group", "aria-label": label, children });
}
function Port({ label, symbol = "\u2192" }) {
  return /* @__PURE__ */ jsxs2("div", { className: "nmf-port", children: [
    /* @__PURE__ */ jsx2("span", { className: symbol === "\u2192" ? "nmf-port-arrow" : void 0, "aria-hidden": "true", children: symbol }),
    /* @__PURE__ */ jsx2("span", { children: label })
  ] });
}
function DotProduct({ left, right, ids, leftLabel, rightLabel, resultLabel, componentTerms = false }) {
  const terms = left.map((v, i) => v * right[i]);
  return /* @__PURE__ */ jsxs2("div", { className: "nmf-dot-product", children: [
    /* @__PURE__ */ jsx2("p", { className: "nmf-object-label", children: resultLabel }),
    /* @__PURE__ */ jsx2("div", { className: "nmf-array-scroll", tabIndex: 0, role: "region", "aria-label": `${resultLabel}; each paired operand and its contribution`, children: /* @__PURE__ */ jsxs2("table", { children: [
      /* @__PURE__ */ jsx2("thead", { children: /* @__PURE__ */ jsxs2("tr", { children: [
        /* @__PURE__ */ jsx2("th", { scope: "col", children: "Matched axis" }),
        /* @__PURE__ */ jsx2("th", { scope: "col", children: leftLabel }),
        /* @__PURE__ */ jsx2("th", { scope: "col", children: "\xD7" }),
        /* @__PURE__ */ jsx2("th", { scope: "col", children: rightLabel }),
        /* @__PURE__ */ jsx2("th", { scope: "col", children: "Contribution" })
      ] }) }),
      /* @__PURE__ */ jsx2("tbody", { children: terms.map((v, i) => /* @__PURE__ */ jsxs2("tr", { style: componentTerms ? { color: colors[i % 8] } : void 0, children: [
        /* @__PURE__ */ jsx2("th", { scope: "row", children: ids[i] }),
        /* @__PURE__ */ jsx2("td", { children: fmt(left[i]) }),
        /* @__PURE__ */ jsx2("td", { children: "\xD7" }),
        /* @__PURE__ */ jsx2("td", { children: fmt(right[i]) }),
        /* @__PURE__ */ jsx2("td", { children: fmt(v) })
      ] }, i)) }),
      /* @__PURE__ */ jsx2("tfoot", { children: /* @__PURE__ */ jsxs2("tr", { children: [
        /* @__PURE__ */ jsx2("th", { scope: "row", colSpan: 4, children: "Add the contributions \u2192" }),
        /* @__PURE__ */ jsx2("td", { children: fmt(terms.reduce((a, b) => a + b, 0)) })
      ] }) })
    ] }) })
  ] });
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/GeometryFigures.jsx
import { Fragment, jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function Shear() {
  const [t, setT] = scenarioState(0.5), s = shear(t);
  return /* @__PURE__ */ jsxs3(Figure, { id: "D07", caption: "This separate supplied dictionary Hs permits a shear beyond scale or permutation. The plot shows its F0/F1 projection; the complete three-feature cells retain F2.", children: [
    /* @__PURE__ */ jsxs3(Panels, { children: [
      /* @__PURE__ */ jsx3(Matrix, { label: "Original Hs", values: [[1, 1, 1], [0, 1, 1]], rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx3(Matrix, { label: "Changed Hs", values: s.h, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx3(Matrix, { label: "Changed amounts", values: s.w, columns: ["C0", "C1"], componentColumns: true }),
      /* @__PURE__ */ jsx3(Matrix, { label: "Both products", values: [[2, 3, 3], ...matmul(s.w, s.h)], rows: ["Before", "After"] }),
      /* @__PURE__ */ jsx3(Plot, { label: "Pattern direction changes \xB7 projected rays", xmax: 2, ymax: 2, children: (map) => /* @__PURE__ */ jsxs3(Fragment, { children: [
        /* @__PURE__ */ jsx3(Arrow, { from: map([0, 0]), to: map([1, 1]), dashed: true }),
        /* @__PURE__ */ jsx3(Arrow, { from: map([0, 0]), to: map([1, 1 - t]) }),
        /* @__PURE__ */ jsx3(Arrow, { from: map([0, 0]), to: map([0, 1]), color: colors[1] }),
        /* @__PURE__ */ jsx3(Point, { at: map([1, 1 - t]), label: "C0" }),
        /* @__PURE__ */ jsx3(Point, { at: map([0, 1]), label: "C1", color: colors[1] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx3(Controls, { onReset: () => setT(0.5), children: /* @__PURE__ */ jsx3(Range, { label: "Feasible shear t", value: t, onChange: setT, max: 1, step: 0.1 }) }),
    /* @__PURE__ */ jsxs3(Result, { children: [
      "t=",
      fmt(t),
      "; amounts [2,",
      fmt(1 + 2 * t),
      "] still reconstruct [2,3,3]. At t0 the original factors return; at t1 the edited pattern zeros remain valid."
    ] })
  ] });
}
function ConePicture({
  u,
  v
}) {
  const q = coneQuery(u, v);
  return /* @__PURE__ */ jsx3(Plot, { label: "Fixed Hc \xB7 attainable cone and query", xmax: 2, ymax: 2, children: (map) => /* @__PURE__ */ jsxs3(Fragment, { children: [
    /* @__PURE__ */ jsx3("polygon", { points: [[0, 0], [2, 0], [2, 2]].map((p) => map(p).join(",")).join(" "), fill: colors[0], opacity: ".1" }),
    /* @__PURE__ */ jsx3(Arrow, { from: map([0, 0]), to: map([1.7, 0]) }),
    /* @__PURE__ */ jsx3(Arrow, { from: map([0, 0]), to: map([1.7, 1.7]), color: colors[1] }),
    /* @__PURE__ */ jsx3(Arrow, { from: map(q.prediction), to: map([u, v]), color: "#f2c276", dashed: true }),
    /* @__PURE__ */ jsx3(Point, { at: map(q.prediction), label: q.prediction[0] === u && q.prediction[1] === v ? void 0 : "fit", color: colors[1] }),
    /* @__PURE__ */ jsx3(Point, { at: map([u, v]), label: q.prediction[0] === u && q.prediction[1] === v ? "q = fit" : "q", diamond: true, open: true, color: "#f2c276" })
  ] }) });
}
function Cone({
  id = "D13",
  frozen = false
}) {
  const [u, setU] = scenarioState(frozen ? 0 : 1), [v, setV] = scenarioState(frozen ? 1 : 0.5), q = coneQuery(u, v);
  return /* @__PURE__ */ jsxs3(Figure, { id, caption: frozen ? "A query uses the stored feature order and fixed dictionary; only its new amounts change. Wrong shape or feature order is refused rather than refitting H." : "Nonnegative combinations of Hc rows fill the shaded cone, including its boundary and origin. Outside queries project onto a feasible ray.", children: [
    /* @__PURE__ */ jsxs3(Panels, { children: [
      /* @__PURE__ */ jsx3(Matrix, { label: "Stored Hc \xB7 fixed F0/F1 order", values: [[1, 0], [1, 1]], rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx3(ConePicture, { u, v }),
      /* @__PURE__ */ jsx3(Matrix, { label: "Query \u2192 new amounts \u2192 prediction", values: [[u, v], q.w, q.prediction], rows: ["Query", "C0/C1 amounts", "Prediction"] })
    ] }),
    /* @__PURE__ */ jsxs3(Controls, { onReset: () => {
      setU(frozen ? 0 : 1);
      setV(frozen ? 1 : 0.5);
    }, children: [
      /* @__PURE__ */ jsx3(Range, { label: "Query F0", value: u, onChange: setU, max: 2 }),
      /* @__PURE__ */ jsx3(Range, { label: "Query F1", value: v, onChange: setV, max: 2 })
    ] }),
    /* @__PURE__ */ jsxs3(Result, { children: [
      "Amounts [",
      q.w.map(fmt).join(", "),
      "]; prediction [",
      q.prediction.map(fmt).join(", "),
      "]; half-loss ",
      fmt(halfLoss([[u, v]], [q.prediction])),
      ". Hc is unchanged."
    ] })
  ] });
}
function ClipFailure() {
  return /* @__PURE__ */ jsxs3(Figure, { id: "D14", caption: "Clipping the unconstrained coefficients does not reoptimize the remaining positive coordinate. The clipped free-coordinate gradient1 becomes0 at the NNLS solution.", children: [
    /* @__PURE__ */ jsxs3(Panels, { children: [
      /* @__PURE__ */ jsx3(Plot, { label: "Amount plane \xB7 feasible first quadrant", xmin: -1.5, xmax: 1.5, ymax: 1.5, xlabel: "C0 amount", ylabel: "C1 amount", equalUnits: true, children: (map) => /* @__PURE__ */ jsxs3(Fragment, { children: [
        /* @__PURE__ */ jsx3("polygon", { points: [[0, 0], [1.5, 0], [1.5, 1.5], [0, 1.5]].map((p) => map(p).join(",")).join(" "), fill: colors[0], opacity: ".1" }),
        /* @__PURE__ */ jsx3(Point, { at: map([-1, 1]), label: "LS", open: true }),
        /* @__PURE__ */ jsx3(Point, { at: map([0, 1]), label: "clip", color: colors[1] }),
        /* @__PURE__ */ jsx3(Point, { at: map([0, 0.5]), label: "NNLS", color: "#f2c276" })
      ] }) }),
      /* @__PURE__ */ jsx3(Plot, { label: "Observation plane \xB7 three predictions", xmax: 1.5, ymax: 1.5, children: (map) => /* @__PURE__ */ jsxs3(Fragment, { children: [
        /* @__PURE__ */ jsx3(Point, { at: map([0, 1]), label: "q / LS", open: true }),
        /* @__PURE__ */ jsx3(Point, { at: map([1, 1]), label: "clip", color: colors[1] }),
        /* @__PURE__ */ jsx3(Point, { at: map([0.5, 0.5]), label: "NNLS", color: "#f2c276" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx3(Matrix, { label: "Amounts / reconstructed cells / half-loss", rows: ["Unconstrained", "Clipped", "NNLS"], columns: ["C0", "C1", "F0", "F1", "Loss"], values: [[-1, 1, 0, 1, 0], [0, 1, 1, 1, 0.5], [0, 0.5, 0.5, 0.5, 0.25]], signed: true })
  ] });
}
function CoordinateSlice() {
  const [a, setA] = scenarioState(1), prediction = [a, 1, a + 1];
  return /* @__PURE__ */ jsxs3(Figure, { id: "D16", caption: "Only C0 changes; C1 remains1. Its exact convex slice L(a)=a\xB2\u22124a+7 has minimum a2 and loss3. This is one coordinate, not a complete solved fit.", children: [
    /* @__PURE__ */ jsxs3(Panels, { children: [
      /* @__PURE__ */ jsx3(Bars, { label: "R1 minus current prediction", values: [1 - a, 2, 3 - a], signed: true, max: 3 }),
      /* @__PURE__ */ jsx3(Plot, { label: "Coordinate half-loss", xmax: 3, ymax: 7, xlabel: "C0 amount a", ylabel: "half-loss", children: (map) => /* @__PURE__ */ jsxs3(Fragment, { children: [
        /* @__PURE__ */ jsx3(Curve, { map, xmax: 3, fn: (a2) => a2 * a2 - 4 * a2 + 7 }),
        /* @__PURE__ */ jsx3(Point, { at: map([a, a * a - 4 * a + 7]), label: a === 2 ? "now / min" : "now", color: colors[1] }),
        a !== 2 && /* @__PURE__ */ jsx3(Point, { at: map([2, 3]), label: "min" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx3(Controls, { onReset: () => setA(1), children: /* @__PURE__ */ jsx3(Range, { label: "C0 amount; C1 fixed1", value: a, onChange: setA, max: 3 }) }),
    /* @__PURE__ */ jsxs3(Result, { children: [
      "Prediction [",
      prediction.map(fmt).join(", "),
      "]; half-loss ",
      fmt(a * a - 4 * a + 7),
      "; coordinate slope ",
      fmt(2 * a - 4),
      "."
    ] })
  ] });
}
function Caches() {
  return /* @__PURE__ */ jsxs3(Figure, { id: "D17", caption: "G contracts feature bins into component pairs, while P contracts each observed row with each pattern. G01=1\xD70+0\xD71+1\xD71=1; P[R1,C1]=1\xD70+3\xD71+4\xD71=7.", children: [
    /* @__PURE__ */ jsxs3(Operation, { label: "Build the Gram cache from two pattern operands", children: [
      /* @__PURE__ */ jsx3(Matrix, { label: "H \xB7 component \xD7 feature", values: H0, rows: ["C0", "C1"], componentRows: true, selectedCells: [[0, 0], [0, 1], [0, 2]] }),
      /* @__PURE__ */ jsx3(Port, { label: "contract F0/F1/F2", symbol: "\xD7" }),
      /* @__PURE__ */ jsx3(Matrix, { label: "H\u1D40 \xB7 feature \xD7 component", values: transpose(H0), rows: ["F0", "F1", "F2"], columns: ["C0", "C1"], componentColumns: true, selectedCells: [[0, 1], [1, 1], [2, 1]] }),
      /* @__PURE__ */ jsx3(Port, { label: "sum feature paths" }),
      /* @__PURE__ */ jsx3(Matrix, { label: "G = H H\u1D40", values: matmul(H0, transpose(H0)), rows: ["C0", "C1"], columns: ["C0", "C1"], selected: [0, 1] })
    ] }),
    /* @__PURE__ */ jsx3(DotProduct, { left: H0[0], right: H0[1], ids: ["F0", "F1", "F2"], leftLabel: "H[C0,f]", rightLabel: "H[C1,f]", resultLabel: "Selected Gram entry G[C0,C1]" }),
    /* @__PURE__ */ jsxs3(Operation, { label: "Build the cross cache from an observation and a pattern", children: [
      /* @__PURE__ */ jsx3(Matrix, { label: "X0 \xB7 select R1", values: X0, selectedCells: [[1, 0], [1, 1], [1, 2]] }),
      /* @__PURE__ */ jsx3(Port, { label: "same feature order", symbol: "\xD7" }),
      /* @__PURE__ */ jsx3(Matrix, { label: "H\u1D40 \xB7 select C1", values: transpose(H0), rows: ["F0", "F1", "F2"], columns: ["C0", "C1"], componentColumns: true, selectedCells: [[0, 1], [1, 1], [2, 1]] }),
      /* @__PURE__ */ jsx3(Port, { label: "sum feature paths" }),
      /* @__PURE__ */ jsx3(Matrix, { label: "P = X0 H\u1D40", values: matmul(X0, transpose(H0)), columns: ["C0", "C1"], selected: [1, 1] })
    ] }),
    /* @__PURE__ */ jsx3(DotProduct, { left: X0[1], right: H0[1], ids: ["F0", "F1", "F2"], leftLabel: "X[R1,f]", rightLabel: "H[C1,f]", resultLabel: "Selected cross entry P[R1,C1]" })
  ] });
}
function Cyclic() {
  const [step, setStep] = scenarioState(0), states = [[1, 1], [2, 1], [2, 2.5]], fresh = states[step], stale = step < 2 ? fresh : [2, 3];
  return /* @__PURE__ */ jsxs3(Figure, { id: "D18", caption: "Fresh earlier coordinates matter. The second cyclic slope uses C0=2; its stale branch still uses C0=1. Known exact[1,3] is a separate reference, not this sweep's result.", children: [
    /* @__PURE__ */ jsxs3(Panels, { children: [
      /* @__PURE__ */ jsx3(Matrix, { label: "Cyclic \xB7 current operands", rows: ["Amounts", "Prediction"], columns: ["0", "1", "2"], values: [[...fresh, "\u2014"], matmul([fresh], H0)[0]] }),
      /* @__PURE__ */ jsx3(Matrix, { label: "Stale comparison \xB7 persistent branch", rows: ["Amounts", "Prediction"], columns: ["0", "1", "2"], values: [[...stale, "\u2014"], matmul([stale], H0)[0]] }),
      /* @__PURE__ */ jsx3(Matrix, { label: "Known exact reference", values: [[1, 3, "\u2014"], [1, 3, 4]], rows: ["Amounts", "Prediction"] })
    ] }),
    /* @__PURE__ */ jsxs3(Controls, { onReset: () => setStep(0), children: [
      /* @__PURE__ */ jsx3("button", { disabled: step === 0, onClick: () => setStep(step - 1), children: "Back" }),
      /* @__PURE__ */ jsx3("button", { disabled: step === 2, onClick: () => setStep(step + 1), children: "Step" })
    ] }),
    /* @__PURE__ */ jsx3(Result, { children: ["Start [1,1]. First C0 slope\u22122; next update will set C0=2.", "C0 updated to2. Fresh C1 slope\u22123; stale C1 slope\u22124.", "Cyclic [2,2.5], loss.75; stale [2,3], loss1. Exact reference [1,3] has loss0."][step] })
  ] });
}
function KKT() {
  const [b, setB] = scenarioState(0.5), g = [b, 2 * b - 1], pg = [0, g[1]];
  return /* @__PURE__ */ jsxs3(Figure, { id: "D19", caption: "At zero C0, a positive outward slope is compatible with a constrained minimum. At positive C1 its gradient must be zero. At the origin C1 has an improving feasible direction.", children: [
    /* @__PURE__ */ jsxs3(Panels, { children: [
      /* @__PURE__ */ jsx3(Plot, { label: "Feasible C0 motion and improving C1 direction", xmax: 1, ymax: 1, xlabel: "C0 amount", ylabel: "C1 amount", children: (map) => /* @__PURE__ */ jsxs3(Fragment, { children: [
        /* @__PURE__ */ jsx3(Arrow, { from: map([0, b]), to: map([0.35, b]), color: colors[0] }),
        /* @__PURE__ */ jsx3(Arrow, { from: map([0, b]), to: map([0, b === 0.5 ? b : b < 0.5 ? Math.min(1, b + 0.35) : Math.max(0, b - 0.35)]), color: colors[1] }),
        /* @__PURE__ */ jsx3(Point, { at: map([0, b]), label: "w" })
      ] }) }),
      /* @__PURE__ */ jsx3(Matrix, { label: "Gradient and projected gradient", rows: ["Gradient", "Projected"], columns: ["C0", "C1"], values: [g, b === 0 ? [0, -1] : pg], signed: true })
    ] }),
    /* @__PURE__ */ jsx3(Controls, { onReset: () => setB(0.5), children: /* @__PURE__ */ jsx3(Range, { label: "C1 amount; C0 fixed0", value: b, onChange: setB, max: 1, step: 0.1 }) }),
    /* @__PURE__ */ jsxs3(Result, { children: [
      "Blue arrow is a feasible C0 increase, not an improving step; rose arrow shows C1 improvement and disappears at its optimum. Prediction [",
      fmt(b),
      ",",
      fmt(b),
      "]; gradient [",
      g.map(fmt).join(", "),
      "]. ",
      b === 0.5 ? "Both KKT coordinate conditions hold." : b === 0 ? "C1 gradient\u22121 permits a feasible improvement." : "Positive C1 has a nonzero gradient; it is not stationary."
    ] })
  ] });
}
function Alternation() {
  const [step, setStep] = scenarioState(0), s = cdSweep(X0, onesW, H0), w = step === 0 ? onesW : s.w, h = step < 2 ? H0 : s.h, prediction = matmul(w, h), newWG = matmul(transpose(s.w), s.w), newWP = matmul(transpose(s.w), X0);
  return /* @__PURE__ */ jsxs3(Figure, { id: "D20", caption: "This complete CD sweep changes W first, then changes H using the new W. Its operand order differs from the historical H-first multiplicative route.", children: [
    /* @__PURE__ */ jsxs3(Operation, { label: "W block holds H0 fixed, constructs caches, then updates W", children: [
      /* @__PURE__ */ jsx3(Matrix, { label: "Held H0 \xB7 never changed by W block", values: H0, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx3(Port, { label: "H0 H0\u1D40 and X0 H0\u1D40" }),
      /* @__PURE__ */ jsxs3("div", { children: [
        /* @__PURE__ */ jsx3(Matrix, { label: "W-block G", values: matmul(H0, transpose(H0)), rows: ["C0", "C1"], columns: ["C0", "C1"] }),
        /* @__PURE__ */ jsx3(Matrix, { label: "W-block P", values: matmul(X0, transpose(H0)), columns: ["C0", "C1"] })
      ] }),
      /* @__PURE__ */ jsx3(Port, { label: "cyclic CD from W start; publish new W" }),
      /* @__PURE__ */ jsx3(Matrix, { label: step === 0 ? "W start \xB7 block not yet applied" : "New W \xB7 H-block operand", values: w, columns: ["C0", "C1"], componentColumns: true })
    ] }),
    step > 0 && /* @__PURE__ */ jsxs3(Operation, { label: "H block rebuilds its operands from new W, not the old W", children: [
      /* @__PURE__ */ jsx3(Matrix, { label: "New W \xB7 held for H block", values: s.w, columns: ["C0", "C1"], componentColumns: true }),
      /* @__PURE__ */ jsx3(Port, { label: "new W\u1D40 new W and new W\u1D40 X0" }),
      /* @__PURE__ */ jsxs3("div", { children: [
        /* @__PURE__ */ jsx3(Matrix, { label: "H-block G \xB7 rebuilt from new W", values: newWG, rows: ["C0", "C1"], columns: ["C0", "C1"] }),
        /* @__PURE__ */ jsx3(Matrix, { label: "H-block P \xB7 rebuilt from new W", values: newWP, rows: ["C0", "C1"] })
      ] }),
      /* @__PURE__ */ jsx3(Port, { label: "cyclic CD from H0; publish new H" }),
      /* @__PURE__ */ jsx3(Matrix, { label: step === 1 ? "H0 \xB7 H block not yet applied" : "New H \xB7 from new W", values: h, rows: ["C0", "C1"], componentRows: true })
    ] }),
    /* @__PURE__ */ jsxs3(Operation, { label: "Current factor state reconstructs the full table", children: [
      /* @__PURE__ */ jsx3(Matrix, { label: "Current W", values: w, componentColumns: true, columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx3(Port, { label: "\xD7 current H" }),
      /* @__PURE__ */ jsx3(Matrix, { label: "Current H", values: h, componentRows: true, rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx3(Port, { label: "reconstruct" }),
      /* @__PURE__ */ jsx3(Matrix, { label: "Current prediction", values: prediction })
    ] }),
    /* @__PURE__ */ jsxs3(Controls, { onReset: () => setStep(0), children: [
      /* @__PURE__ */ jsx3("button", { disabled: step === 0, onClick: () => setStep(step - 1), children: "Back" }),
      /* @__PURE__ */ jsx3("button", { disabled: step === 2, onClick: () => setStep(step + 1), children: "Step" })
    ] }),
    /* @__PURE__ */ jsxs3(Result, { children: [
      ["Initial factors", "W block complete; H remains H0", "H block complete using new W"][step],
      "; whole-table half-loss ",
      fmt(halfLoss(X0, prediction)),
      ". Expected checkpoints6 \u2192 15/16 \u2192 11733/26620."
    ] })
  ] });
}
function Joint() {
  return /* @__PURE__ */ jsx3(Figure, { id: "D21", caption: "Two feasible factor pairs reconstruct x1 exactly, while their factor midpoint predicts9/8 and has positive loss1/128. A separate fixed-H slice remains convex.", children: /* @__PURE__ */ jsxs3(Panels, { children: [
    /* @__PURE__ */ jsx3(Plot, { label: "Factor plane \xB7 wh=1", xmax: 2.5, ymax: 2, xlabel: "w", ylabel: "h", children: (map) => /* @__PURE__ */ jsxs3(Fragment, { children: [
      /* @__PURE__ */ jsx3(Curve, { map, xmin: 0.5, xmax: 2.5, fn: (w) => 1 / w }),
      /* @__PURE__ */ jsx3("path", { d: `M${map([1, 1]).join(" ")}L${map([2, 0.5]).join(" ")}`, stroke: colors[1] }),
      /* @__PURE__ */ jsx3(Point, { at: map([1, 1]), label: "A" }),
      /* @__PURE__ */ jsx3(Point, { at: map([2, 0.5]), label: "B" }),
      /* @__PURE__ */ jsx3(Point, { at: map([1.5, 0.75]), label: "mid", color: colors[1] })
    ] }) }),
    /* @__PURE__ */ jsx3(Plot, { label: "Fixed h1 \xB7 convex slice", xmax: 2.5, ymax: 1.5, xlabel: "w", ylabel: "half-loss", children: (map) => /* @__PURE__ */ jsx3(Curve, { map, xmax: 2.5, fn: (w) => (1 - w) ** 2 / 2 }) })
  ] }) });
}
function Stationarity() {
  const [w, setW] = scenarioState(0);
  return /* @__PURE__ */ jsxs3(Figure, { id: "D22", caption: "An unchanged zero-locked amount can have a substantial feasible gradient. A cap or zero loss-change does not certify stationarity.", children: [
    /* @__PURE__ */ jsxs3(Panels, { children: [
      /* @__PURE__ */ jsx3(Plot, { label: "Exact scalar objective", xmax: 1, ymax: 0.5, xlabel: "w", ylabel: "half-loss", children: (map) => /* @__PURE__ */ jsxs3(Fragment, { children: [
        /* @__PURE__ */ jsx3(Curve, { map, xmax: 1, fn: (w2) => (1 - w2) ** 2 / 2 }),
        /* @__PURE__ */ jsx3(Point, { at: map([w, (1 - w) ** 2 / 2]), label: "now" })
      ] }) }),
      /* @__PURE__ */ jsx3(Bars, { label: "Absolute projected gradient \xB7 tolerance1e\u22125", values: [1 - w], ids: ["PG"], max: 1 })
    ] }),
    /* @__PURE__ */ jsx3(Controls, { onReset: () => setW(0), children: /* @__PURE__ */ jsx3(Range, { label: "Scalar amount w", value: w, onChange: setW, max: 1, step: 0.1 }) }),
    /* @__PURE__ */ jsxs3(Result, { children: [
      "Half-loss ",
      fmt((1 - w) ** 2 / 2),
      "; projected-gradient magnitude ",
      fmt(1 - w),
      ". ",
      w === 1 ? "Stationary exact solution." : "Nonzero projected gradient despite a possible unchanged multiplicative state."
    ] })
  ] });
}
function Storage() {
  return /* @__PURE__ */ jsxs3(Figure, { id: "D23", caption: "Actual shapes make the storage terms concrete. X exists as input; training W may be returned, H and metadata support later queries, and Gram/cross/row diagnostics are workspace. A changed factor requires cache rebuilding.", children: [
    /* @__PURE__ */ jsxs3("div", { className: "nmf-lifetime", children: [
      /* @__PURE__ */ jsx3("h4", { children: "Caller input \xB7 not learned state" }),
      /* @__PURE__ */ jsx3(Matrix, { label: "Input X \xB7 nd=9 cells", values: X0 })
    ] }),
    /* @__PURE__ */ jsxs3("div", { className: "nmf-lifetime", children: [
      /* @__PURE__ */ jsx3("h4", { children: "Returned training result \xB7 caller lifetime" }),
      /* @__PURE__ */ jsx3(Matrix, { label: "Returned training W \xB7 nk=6", values: W0, columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx3("p", { children: "Returning W does not require keeping all training rows inside the fitted object for later queries." })
    ] }),
    /* @__PURE__ */ jsxs3("div", { className: "nmf-lifetime nmf-lifetime--retained", children: [
      /* @__PURE__ */ jsx3("h4", { children: "Retained fitted state \xB7 later query lifetime" }),
      /* @__PURE__ */ jsxs3(Panels, { children: [
        /* @__PURE__ */ jsx3(Matrix, { label: "Retained fitted H \xB7 kd=6", values: H0, rows: ["C0", "C1"] }),
        /* @__PURE__ */ jsx3(Matrix, { label: "Retained metadata slots", values: [[2, "F0/F1/F2", "stored objective", "stored stop reason"]], columns: ["Fitted k", "Ordered features", "Diagnostic", "Diagnostic"] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs3("div", { className: "nmf-lifetime", children: [
      /* @__PURE__ */ jsx3("h4", { children: "Transient solver workspace \xB7 rebuild after operand changes" }),
      /* @__PURE__ */ jsxs3(Operation, { label: "A changed H invalidates G and P", children: [
        /* @__PURE__ */ jsx3(Matrix, { label: "Current H", values: H0 }),
        /* @__PURE__ */ jsx3(Port, { label: "H changes \u2192 rebuild H H\u1D40 and X H\u1D40" }),
        /* @__PURE__ */ jsxs3("div", { children: [
          /* @__PURE__ */ jsx3(Matrix, { label: "Workspace G \xB7 k\xB2=4", values: matmul(H0, transpose(H0)), columns: ["C0", "C1"], rows: ["C0", "C1"] }),
          /* @__PURE__ */ jsx3(Matrix, { label: "Workspace P \xB7 nk=6", values: matmul(X0, transpose(H0)), columns: ["C0", "C1"] })
        ] })
      ] }),
      /* @__PURE__ */ jsx3("p", { children: "For the H block, new W similarly replaces W\u1D40W and W\u1D40X. Caches belong to their exact current operands." })
    ] }),
    /* @__PURE__ */ jsxs3("div", { className: "nmf-lifetime", children: [
      /* @__PURE__ */ jsx3("h4", { children: "Temporary row diagnostics \xB7 release after reduction" }),
      /* @__PURE__ */ jsx3(Matrix, { label: "One diagnostic row block \xB7 bd=3", values: [X0[0]] }),
      /* @__PURE__ */ jsx3("p", { children: "A block reduces into diagnostic totals; explicitly requested history has its own retained lifetime." })
    ] }),
    /* @__PURE__ */ jsx3("p", { children: "Cache construction O(ndk+(n+d)k\xB2); q cyclic sweeps O(q(n+d)k\xB2); reconstruction diagnostics O(ndk). Transient caches O(k\xB2+max(nk,kd)), plus block diagnostics and explicitly retained history. These are operation/storage counts, not measured timings." })
  ] });
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/OptimizationFigures.jsx
import React5, { useState as useState2 } from "react";
import { Fragment as Fragment2, jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function Ratio() {
  const s = muSweep(X0, onesW, H0), gram = matmul(transpose(onesW), onesW);
  return /* @__PURE__ */ jsxs4(Figure, { id: "D24", caption: "Each elementwise ratio multiplies the old H cell. The selected C0/F2 cell is1\xD79/6=1.5; an old zero remains zero. No matrix inverse is involved.", children: [
    /* @__PURE__ */ jsxs4(Operation, { label: "Selected numerator contracts observation identities", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "W\u1D40 \xB7 component by observation", values: transpose(onesW), rows: ["C0", "C1"], columns: ["R0", "R1", "R2"], selectedCells: [[0, 0], [0, 1], [0, 2]] }),
      /* @__PURE__ */ jsx4(Port, { label: "contract R0/R1/R2 with X F2" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "X \xB7 selected feature F2", values: X0, selectedCells: [[0, 2], [1, 2], [2, 2]] }),
      /* @__PURE__ */ jsx4(Port, { label: "W\u1D40 X" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Numerator W\u1D40 X", values: s.hn, rows: ["C0", "C1"], selected: [0, 2] })
    ] }),
    /* @__PURE__ */ jsx4(DotProduct, { left: [1, 1, 1], right: [3, 4, 2], ids: ["R0", "R1", "R2"], leftLabel: "W[R,C0]", rightLabel: "X[R,F2]", resultLabel: "Numerator[C0,F2]=9" }),
    /* @__PURE__ */ jsxs4(Operation, { label: "Selected denominator contracts component identities", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "W\u1D40 W", values: gram, rows: ["C0", "C1"], columns: ["C0", "C1"], selectedCells: [[0, 0], [0, 1]] }),
      /* @__PURE__ */ jsx4(Port, { label: "contract C0/C1 with old H F2" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Old H", values: H0, rows: ["C0", "C1"], componentRows: true, selectedCells: [[0, 2], [1, 2]] }),
      /* @__PURE__ */ jsx4(Port, { label: "W\u1D40 W H" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Denominator", values: s.hd, rows: ["C0", "C1"], selected: [0, 2] })
    ] }),
    /* @__PURE__ */ jsx4(DotProduct, { left: gram[0], right: [H0[0][2], H0[1][2]], ids: ["C0", "C1"], leftLabel: "Gram[C0,C]", rightLabel: "Old H[C,F2]", resultLabel: "Denominator[C0,F2]=6", componentTerms: true }),
    /* @__PURE__ */ jsxs4(Operation, { label: "Elementwise multiplication updates the selected cell", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Selected old H[C0,F2]", values: [[1]], color: colors[0] }),
      /* @__PURE__ */ jsx4(Port, { label: "\xD7 numerator9 / denominator6" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Selected new H[C0,F2]", values: [[s.h[0][2]]], color: colors[0] }),
      /* @__PURE__ */ jsx4(Port, { label: "same rule for every cell" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "New H", values: s.h, rows: ["C0", "C1"], componentRows: true, selected: [0, 2] })
    ] }),
    /* @__PURE__ */ jsxs4(Operation, { label: "Zero-lock consequence uses the same positive denominator", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Old H[C0,F1]=0", values: [[0]], color: colors[0] }),
      /* @__PURE__ */ jsx4(Port, { label: `\xD7 ${fmt(s.hn[0][1])} / ${fmt(s.hd[0][1])}` }),
      /* @__PURE__ */ jsx4(Matrix, { label: "New H[C0,F1]=0", values: [[s.h[0][1]]], color: colors[0] })
    ] })
  ] });
}
function HistoricalMU() {
  const [step, setStep] = scenarioState(0), x = [[2, 1, 3], [1, 2, 3], [3, 3, 6]], w0 = [[1, 0.5], [0.5, 1], [1, 1]], h0 = [[1, 0.2, 0.8], [0.2, 1, 0.8]], s = muSweep(x, w0, h0), w = step < 2 ? w0 : s.w, h = step === 0 ? h0 : s.h;
  return /* @__PURE__ */ jsxs4(Figure, { id: "D25", caption: "This direct one-step calculation uses the original supplied operands. H updates first; its new values feed W's Gram/cross products. It does not rerun the preserved forty-sweep program.", children: [
    /* @__PURE__ */ jsxs4(Operation, { label: "H-first update holds original W fixed", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Held original W", values: w0, columns: ["C0", "C1"], componentColumns: true }),
      /* @__PURE__ */ jsx4(Port, { label: "W\u1D40X / ((W\u1D40W)H old)" }),
      /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsx4(Matrix, { label: "H numerator", values: s.hn }),
        /* @__PURE__ */ jsx4(Matrix, { label: "H denominator \xB7 old H", values: s.hd })
      ] }),
      /* @__PURE__ */ jsx4(Port, { label: "old H \u2299 ratio \u2192 new H" }),
      /* @__PURE__ */ jsx4(Matrix, { label: step === 0 ? "Original H \xB7 update not yet applied" : "New H \xB7 next W-block operand", values: h, rows: ["C0", "C1"], componentRows: true })
    ] }),
    step > 0 && /* @__PURE__ */ jsxs4(Operation, { label: "W update consumes new H, with original W as the multiplicative amount", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Fresh new H", values: s.h, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx4(Port, { label: "rebuild new H H\u1D40 and X new H\u1D40" }),
      /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsx4(Matrix, { label: "New H H\u1D40 \xB7 W Gram cache", values: matmul(s.h, transpose(s.h)), rows: ["C0", "C1"], columns: ["C0", "C1"] }),
        /* @__PURE__ */ jsx4(Matrix, { label: "W numerator \xB7 X new H\u1D40", values: s.wn }),
        /* @__PURE__ */ jsx4(Matrix, { label: "W denominator \xB7 original W \xD7 new Gram", values: s.wd })
      ] }),
      /* @__PURE__ */ jsx4(Port, { label: "original W \u2299 ratio \u2192 new W" }),
      /* @__PURE__ */ jsx4(Matrix, { label: step === 1 ? "Original W \xB7 update not yet applied" : "New W \xB7 from new H", values: w, columns: ["C0", "C1"], componentColumns: true })
    ] }),
    /* @__PURE__ */ jsx4(Matrix, { label: "Current prediction \xB7 current W \xD7 current H", values: matmul(w, h) }),
    /* @__PURE__ */ jsxs4(Controls, { onReset: () => setStep(0), children: [
      /* @__PURE__ */ jsx4("button", { disabled: step === 0, onClick: () => setStep(step - 1), children: "Back" }),
      /* @__PURE__ */ jsx4("button", { disabled: step === 2, onClick: () => setStep(step + 1), children: "Step" })
    ] }),
    /* @__PURE__ */ jsxs4(Result, { children: [
      ["Initial supplied factors", "H-first update complete", "W update using new H complete"][step],
      "; half-loss ",
      fmt(halfLoss(x, matmul(w, h))),
      ". Original rounded endpoints17.06 \u2192 .03944744."
    ] })
  ] });
}
function ZeroLock() {
  const [w, setW] = scenarioState(0), mu = 2 * w / (w + 1);
  return /* @__PURE__ */ jsxs4(Figure, { id: "D26", caption: "The denominator w+1 is positive throughout. At exact zero, multiplication cannot enter an improving direction; a coordinate update can.", children: [
    /* @__PURE__ */ jsxs4(Panels, { children: [
      /* @__PURE__ */ jsx4(Bars, { label: "Starting amount and both updated amounts", values: [w, mu, 1], ids: ["Start", "MU", "CD"], max: 1 }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Actual predictions, losses and gradients", columns: ["Prediction", "Half-loss", "Gradient"], rows: ["Start", "MU", "CD"], values: [[w + 1, (1 - w) ** 2 / 2, w - 1], [mu + 1, (1 - mu) ** 2 / 2, mu - 1], [2, 0, 0]], signed: true })
    ] }),
    /* @__PURE__ */ jsx4(Controls, { onReset: () => setW(0), children: /* @__PURE__ */ jsx4(Range, { label: "Starting amount; other contribution fixed1", value: w, onChange: setW, max: 1, step: 0.05 }) }),
    /* @__PURE__ */ jsxs4(Result, { children: [
      "MU ",
      fmt(w),
      "\xD72/(",
      fmt(w),
      "+1)=",
      fmt(mu),
      "; coordinate result1. ",
      w === 0 ? "Zero is unchanged despite gradient\u22121." : w === 1 ? "Both routes remain at the optimum." : "Both updates are shown from the same starting amount."
    ] })
  ] });
}
function Counts() {
  const [x, setX] = scenarioState(4);
  return /* @__PURE__ */ jsxs4(Figure, { id: "D27", caption: "Two positive contributions predict a fixed count rate2. Their fractional ownership1/2 allocates the observed count; these fractions are explanatory allocations, not class posteriors.", children: [
    /* @__PURE__ */ jsxs4(Panels, { children: [
      /* @__PURE__ */ jsx4(Bars, { label: "Fixed component rates", values: [1, 1], ids: ["C0", "C1"], component: true, max: 6 }),
      /* @__PURE__ */ jsx4(Bars, { label: "Allocated observed counts", values: [x / 2, x / 2], ids: ["C0", "C1"], component: true, max: 6 }),
      /* @__PURE__ */ jsx4(Bars, { label: "Observed count and unchanged rate", values: [x, 2], ids: ["Count", "Rate"], max: 6 })
    ] }),
    /* @__PURE__ */ jsx4(Controls, { onReset: () => setX(4), children: /* @__PURE__ */ jsx4(Range, { label: "Integer observed count", value: x, onChange: setX, max: 6, step: 1 }) }),
    /* @__PURE__ */ jsxs4(Result, { children: [
      "Count ",
      x,
      ", rate2, ratio ",
      fmt(x / 2),
      ", allocations [",
      fmt(x / 2),
      ",",
      fmt(x / 2),
      "]. Generalized KL ",
      fmt(divergence(x, 2, 1)),
      "; count0 gives zero allocations and KL2."
    ] })
  ] });
}
function Majorizer() {
  const [a, setA] = scenarioState(1), f = (z2) => (z2 - 2) ** 2, q = (z2) => (a - 2) ** 2 + (2 * a - 4) * (z2 - a) + 0.5 * (2 + 1 / a) * (z2 - a) ** 2, z = 5 * a / (2 * a + 1), fixed = a === 2;
  return /* @__PURE__ */ jsxs4(Figure, { id: "D28", caption: "The two exact curves touch at a. Their difference (z\u2212a)\xB2/(2a) is nonnegative; minimizing the upper curve gives a safe restricted-coordinate step, rather than a universal beta proof.", children: [
    /* @__PURE__ */ jsxs4(Operation, { label: "One amount changes a three-bin reconstruction", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Held C1 amount1; changing C0=z", values: [[z, 1]], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx4(Port, { label: "\xD7 fixed H0" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Actual reconstructed row at new z", values: [[z, 1, z + 1]], columns: ["F0", "F1", "F2"] })
    ] }),
    /* @__PURE__ */ jsx4(Plot, { label: "Touching objective and auxiliary \xB7 visible gap at new z", xmax: 3, ymax: 18, xlabel: "candidate z", ylabel: "cost", children: (map) => {
      const upper = map([z, q(z)]), lower = map([z, f(z)]);
      return /* @__PURE__ */ jsxs4(Fragment2, { children: [
        /* @__PURE__ */ jsx4(Curve, { map, xmax: 3, fn: f }),
        /* @__PURE__ */ jsx4(Curve, { map, xmax: 3, fn: q, color: colors[1] }),
        /* @__PURE__ */ jsx4(Point, { at: map([a, f(a)]), open: true }),
        fixed ? /* @__PURE__ */ jsxs4(Fragment2, { children: [
          /* @__PURE__ */ jsx4(Point, { at: lower, diamond: true, open: true, color: "#f2c276" }),
          /* @__PURE__ */ jsx4("text", { x: "75", y: "225", children: "touch = q min = f new" })
        ] }) : /* @__PURE__ */ jsxs4(Fragment2, { children: [
          /* @__PURE__ */ jsx4("path", { d: `M${upper.join(" ")}L${lower.join(" ")}`, stroke: "#f2c276", strokeWidth: "3" }),
          /* @__PURE__ */ jsx4(Point, { at: upper, color: colors[1] }),
          /* @__PURE__ */ jsx4(Point, { at: lower, diamond: true, open: true, color: "#f2c276" }),
          /* @__PURE__ */ jsx4("path", { d: `M${upper.join(" ")}L80 190M${lower.join(" ")}L175 225`, stroke: "currentColor", fill: "none" }),
          /* @__PURE__ */ jsx4("text", { x: "62", y: "185", children: "q min" }),
          /* @__PURE__ */ jsx4("text", { x: "175", y: "242", children: "f new" }),
          /* @__PURE__ */ jsx4("text", { x: "65", y: "70", children: "gap" }),
          /* @__PURE__ */ jsx4("path", { d: `M95 75L${[(upper[0] + lower[0]) / 2, (upper[1] + lower[1]) / 2].join(" ")}`, stroke: "#f2c276", fill: "none" })
        ] })
      ] });
    } }),
    /* @__PURE__ */ jsx4(Controls, { onReset: () => setA(1), children: /* @__PURE__ */ jsx4(Range, { label: "Current positive coordinate a", value: a, onChange: setA, min: 0.25, max: 2, step: 0.25 }) }),
    /* @__PURE__ */ jsxs4(Result, { children: [
      "Blue f, rose q; open circle is the touching point, rose circle is q minimum, amber diamond is f(new). Amber vertical segment is q(new)\u2212f(new); at a2 its length is0 and the points coincide. New z=",
      fmt(z),
      "; f(new)=",
      fmt(f(z)),
      " \u2264 q(new)=",
      fmt(q(z)),
      " \u2264 q(a)=f(a)=",
      fmt(f(a)),
      ". Gap at new ",
      fmt(q(z) - f(z)),
      "."
    ] })
  ] });
}
function PSD() {
  const [d0, setD0] = scenarioState(1), [d1, setD1] = scenarioState(0), side = Math.abs(d0 - d1);
  return /* @__PURE__ */ jsxs4(Figure, { id: "D29", caption: "The diagonal auxiliary difference is PSD because \u0394\u1D40[[1,\u22121],[\u22121,1]]\u0394=(\u03940\u2212\u03941)\xB2. The square displays its actual nonnegative area; the objective auxiliary includes the additional factor1/2.", children: [
    /* @__PURE__ */ jsxs4(Panels, { children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "G", values: [[2, 1], [1, 2]], rows: ["C0", "C1"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "3I \u2212 G", values: [[1, -1], [-1, 1]], signed: true, rows: ["C0", "C1"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsxs4("div", { className: "nmf-plot", children: [
        /* @__PURE__ */ jsx4("p", { className: "nmf-object-label", children: "Square side |\u03940\u2212\u03941|" }),
        /* @__PURE__ */ jsxs4("svg", { viewBox: "0 0 300 250", role: "img", "aria-label": `Square side${fmt(side)}, area${fmt(side * side)}`, children: [
          /* @__PURE__ */ jsx4("rect", { x: "40", y: 220 - side * 90, width: side * 90, height: side * 90, fill: colors[0], opacity: ".55" }),
          /* @__PURE__ */ jsx4("path", { d: "M40 30V220H230", stroke: "currentColor", fill: "none" }),
          /* @__PURE__ */ jsx4("text", { x: "45", y: "245", children: "0 \u2264 side \u2264 2" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs4(Controls, { onReset: () => {
      setD0(1);
      setD1(0);
    }, children: [
      /* @__PURE__ */ jsx4(Range, { label: "Increment \u03940", value: d0, onChange: setD0, min: -1, max: 1 }),
      /* @__PURE__ */ jsx4(Range, { label: "Increment \u03941", value: d1, onChange: setD1, min: -1, max: 1 })
    ] }),
    /* @__PURE__ */ jsxs4(Result, { children: [
      "Increment [",
      fmt(d0),
      ",",
      fmt(d1),
      "], side ",
      fmt(side),
      ", quadratic area ",
      fmt(side * side),
      ". Equal increments give area0."
    ] })
  ] });
}
function BetaPower() {
  const [b, setB] = scenarioState(0), g = gamma(b), next = 4 ** g;
  return /* @__PURE__ */ jsxs4(Figure, { id: "D30", caption: "The positive ratio4 is deliberately fixed to isolate the MM power. A beta-dependent exponent changes the step; the exponent-one heuristic agrees only on beta\u2208[1,2]. The persistent Jensen and tangent insets expose their separate assumptions.", children: [
    /* @__PURE__ */ jsx4(Bars, { label: "Live updated coordinate \xB7 old coordinate1", values: [4, next], ids: ["Heuristic", "MM"], max: 4 }),
    /* @__PURE__ */ jsxs4(Operation, { label: "Separate fixed Jensen example \xB7 contributions give normalized shares", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Positive contributions", values: [[1, 3]], columns: ["C0", "C1"], componentColumns: true }),
      /* @__PURE__ */ jsx4(Port, { label: "sum4; divide each by4" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Shares \xB7 sum1", values: [[0.25, 0.75]], columns: ["C0", "C1"], componentColumns: true }),
      /* @__PURE__ */ jsx4(Port, { label: "apply to arguments2 and6" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Weighted mean and heights", values: [[0.25, 2, 4], [0.75, 6, 36]], rows: ["C0", "C1"], columns: ["Share", "Argument", "Square"] })
    ] }),
    /* @__PURE__ */ jsxs4(Panels, { children: [
      /* @__PURE__ */ jsx4(Plot, { label: "Fixed convex t\xB2 \xB7 Jensen gap3 at mean5", xmax: 6, ymax: 36, xlabel: "t", ylabel: "\u03C6(t)", children: (map) => /* @__PURE__ */ jsxs4(Fragment2, { children: [
        /* @__PURE__ */ jsx4(Curve, { map, xmax: 6, fn: (t) => t * t }),
        /* @__PURE__ */ jsx4("path", { d: `M${map([2, 4]).join(" ")}L${map([6, 36]).join(" ")}`, stroke: colors[1], strokeWidth: "2" }),
        /* @__PURE__ */ jsx4("path", { d: `M${map([5, 25]).join(" ")}L${map([5, 28]).join(" ")}`, stroke: "#f2c276", strokeWidth: "4" }),
        /* @__PURE__ */ jsx4(Point, { at: map([2, 4]), label: "arg2" }),
        /* @__PURE__ */ jsx4(Point, { at: map([6, 36]), label: "arg6" }),
        /* @__PURE__ */ jsx4(Point, { at: map([5, 25]) }),
        /* @__PURE__ */ jsx4(Point, { at: map([5, 28]), color: colors[1] }),
        /* @__PURE__ */ jsx4("text", { x: "90", y: "75", children: "gap3" }),
        /* @__PURE__ */ jsx4("path", { d: `M130 75L${map([5, 26.5]).join(" ")}`, stroke: "#f2c276", fill: "none" }),
        /* @__PURE__ */ jsx4("path", { d: `M${map([5, 25]).join(" ")}L${map([5, 0]).join(" ")}`, stroke: "currentColor", strokeDasharray: "3 3" }),
        /* @__PURE__ */ jsx4("text", { x: "225", y: "240", textAnchor: "end", children: "mean5" }),
        /* @__PURE__ */ jsx4("text", { x: "75", y: "35", children: "heights28" }),
        /* @__PURE__ */ jsx4("path", { d: `M145 40L${map([5, 28]).join(" ")}`, stroke: colors[1] }),
        /* @__PURE__ */ jsx4("text", { x: "75", y: "120", children: "\u03C6(mean)25" }),
        /* @__PURE__ */ jsx4("path", { d: `M150 115L${map([5, 25]).join(" ")}`, stroke: colors[0] })
      ] }) }),
      /* @__PURE__ */ jsx4(Plot, { label: "Fixed concave log \xB7 tangent touches at4", xmin: 1, xmax: 6, ymin: 0, ymax: 2, xlabel: "t", ylabel: "log(t)", children: (map) => /* @__PURE__ */ jsxs4(Fragment2, { children: [
        /* @__PURE__ */ jsx4(Curve, { map, xmin: 1, xmax: 6, fn: Math.log }),
        /* @__PURE__ */ jsx4(Curve, { map, xmin: 1, xmax: 6, fn: (t) => Math.log(4) + (t - 4) / 4, color: colors[1] }),
        /* @__PURE__ */ jsx4(Point, { at: map([4, Math.log(4)]), label: "touch4", open: true })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx4(Controls, { onReset: () => setB(0), children: /* @__PURE__ */ jsx4(Range, { label: "Beta", value: b, onChange: setB, max: 3, step: 0.1 }) }),
    /* @__PURE__ */ jsxs4(Result, { children: [
      "Live gamma=",
      fmt(g),
      ", MM1\xD74^gamma=",
      fmt(next),
      " versus heuristic4. Separate fixed Jensen example: .25\xD72+.75\xD76=5; .25\xD74+.75\xD736=28; \u03C6(5)=25; amber gap3. The log tangent is an upper bound touching at4. These fixed illustrations are not recalculated beta objectives."
    ] })
  ] });
}
function Centering() {
  return /* @__PURE__ */ jsxs4(Figure, { id: "D31", caption: "Subtracting means[1,2,3] introduces signed entries. NMF initialization uses the uncentred nonnegative input, rather than silently importing PCA's centred fitted model.", children: [
    /* @__PURE__ */ jsxs4(Operation, { label: "Column-mean subtraction creates a negative cell", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Original X0 \xB7 selected R0/F1=1", values: X0, selected: [0, 1] }),
      /* @__PURE__ */ jsx4(Port, { label: "subtract column means[1,2,3]" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Column means \xB7 selected F1=2", values: [[1, 2, 3]], rows: ["Mean"], selected: [0, 1] }),
      /* @__PURE__ */ jsx4(Port, { label: "R0/F1: 1\u22122=\u22121" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "X0 \u2212 means \xB7 signed", values: [[1, -1, 0], [0, 1, 1], [-1, 0, -1]], signed: true, selected: [0, 1] })
    ] }),
    /* @__PURE__ */ jsxs4(Panels, { children: [
      /* @__PURE__ */ jsx4(Plot, { label: "Selected R0/F1 \xB7 common zero before and after", xmax: 1, ymin: -2, ymax: 2, xlabel: "same selected cell", ylabel: "signed cell value", children: (map) => /* @__PURE__ */ jsxs4(Fragment2, { children: [
        /* @__PURE__ */ jsx4("path", { d: `M${map([0, 0]).join(" ")}L${map([1, 0]).join(" ")}`, stroke: "currentColor", strokeDasharray: "4 3" }),
        /* @__PURE__ */ jsx4(Arrow, { from: map([0.5, 1]), to: map([0.5, -1]), color: "#f2c276" }),
        /* @__PURE__ */ jsx4(Point, { at: map([0.5, 1]) }),
        /* @__PURE__ */ jsx4(Point, { at: map([0.5, -1]), color: colors[1] }),
        /* @__PURE__ */ jsx4("text", { x: "175", y: "120", fill: colors[0], children: "before1" }),
        /* @__PURE__ */ jsx4("path", { d: `M210 125L${map([0.5, 1]).join(" ")}`, stroke: colors[0], fill: "none" }),
        /* @__PURE__ */ jsx4("text", { x: "75", y: "175", fill: colors[1], children: "after\u22121" }),
        /* @__PURE__ */ jsx4("path", { d: `M110 160L${map([0.5, -1]).join(" ")}`, stroke: colors[1], fill: "none" })
      ] }) }),
      /* @__PURE__ */ jsx4(Bars, { label: "Original nonnegative intensities \xB7 unchanged input for NMF", values: X0[0], ids: ["F0", "F1", "F2"], max: 4 })
    ] })
  ] });
}
function SignedTriplet() {
  return /* @__PURE__ */ jsxs4(Figure, { id: "D32", caption: "The known supplied Xt has a signed second singular term. Its positive part has two disjoint support rectangles; retaining one positive rank-one rectangle requires a paired-sign choice.", children: [
    /* @__PURE__ */ jsxs4(Panels, { children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Xt \xB7 known supplied matrix", values: [[8.2, 2.4], [2.4, 6.8]], max: 10, rows: ["T0", "T1"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "First term \xB7 \u03C310 u=v[.8,.6]", values: [[6.4, 4.8], [4.8, 3.6]], color: colors[0], max: 10, rows: ["T0", "T1"] })
    ] }),
    /* @__PURE__ */ jsx4(Panels, { children: ["u \xB7 observation direction", "v \xB7 feature direction"].map((label) => /* @__PURE__ */ jsxs4("div", { children: [
      /* @__PURE__ */ jsx4(Plot, { label: `C1 ${label}`, xmin: -1, xmax: 1, ymin: -1, ymax: 1, xlabel: "entry0", ylabel: "entry1", equalUnits: true, children: (map) => /* @__PURE__ */ jsxs4(Fragment2, { children: [
        /* @__PURE__ */ jsx4(Arrow, { from: map([0, 0]), to: map([0.6, -0.8]), color: colors[1] }),
        /* @__PURE__ */ jsx4(Point, { at: map([0.6, -0.8]), label: "(.6,\u2212.8)", color: colors[1] })
      ] }) }),
      /* @__PURE__ */ jsxs4("div", { className: "nmf-plot", children: [
        /* @__PURE__ */ jsxs4("p", { className: "nmf-object-label", children: [
          "C1 signed entries \xB7 ",
          label
        ] }),
        /* @__PURE__ */ jsxs4("svg", { viewBox: "0 0 300 120", role: "img", "aria-label": `C1 ${label}: entry0 .6 extends right of zero, entry1 \u2212.8 extends left; rose is component identity`, children: [
          /* @__PURE__ */ jsx4("path", { d: "M150 10V110", stroke: "currentColor" }),
          /* @__PURE__ */ jsx4("rect", { x: "150", y: "25", width: "48", height: "14", fill: colors[1] }),
          /* @__PURE__ */ jsx4("rect", { x: "86", y: "75", width: "64", height: "14", fill: colors[1] }),
          /* @__PURE__ */ jsx4("text", { x: "10", y: "36", children: "entry0" }),
          /* @__PURE__ */ jsx4("text", { x: "205", y: "36", children: ".6" }),
          /* @__PURE__ */ jsx4("text", { x: "10", y: "86", children: "entry1" }),
          /* @__PURE__ */ jsx4("text", { x: "90", y: "106", children: "\u2212.8" }),
          /* @__PURE__ */ jsx4("text", { x: "155", y: "110", children: "0" })
        ] })
      ] })
    ] }, label)) }),
    /* @__PURE__ */ jsxs4(Operation, { label: "Signed column-by-row outer product builds C1 term", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "C1 \u03C35 u \xB7 observation column", values: [[3], [-4]], rows: ["T0", "T1"], color: colors[1] }),
      /* @__PURE__ */ jsx4(Port, { label: "outer product \xD7 v\u1D40" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "C1 v\u1D40 \xB7 feature row", values: [[0.6, -0.8]], columns: ["F0", "F1"], color: colors[1] }),
      /* @__PURE__ */ jsx4(Port, { label: "\u03C35 u v\u1D40" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "C1 signed term \xB7 signs remain literal", values: [[1.8, -2.4], [-2.4, 3.2]], color: colors[1], signed: true, max: 4, rows: ["T0", "T1"] })
    ] }),
    /* @__PURE__ */ jsxs4(Operation, { label: "Split signed vectors into two nonnegative sign pieces", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Positive pieces \xB7 u+ and v+", values: [[0.6, 0], [0.6, 0]], rows: ["u+", "v+"], color: colors[1], max: 1 }),
      /* @__PURE__ */ jsx4(Port, { label: "pair matching positive origins" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Negative pieces \xB7 magnitudes u\u2212 and v\u2212", values: [[0, 0.8], [0, 0.8]], rows: ["u\u2212", "v\u2212"], color: colors[1], hatchedCells: [[0, 1], [1, 1]], max: 1 }),
      /* @__PURE__ */ jsx4(Port, { label: "pair matching negative origins \xB7 both products nonnegative" })
    ] }),
    /* @__PURE__ */ jsxs4(Panels, { children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "C1 positive-origin rectangle \xB7 u+ v+", values: [[1.8, 0], [0, 0]], color: colors[1], selected: [0, 0], rows: ["T0", "T1"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "C1 negative-origin rectangle \xB7 u\u2212 v\u2212", values: [[0, 0], [0, 3.2]], color: colors[1], hatchedCells: [[1, 1]], selected: [1, 1], rows: ["T0", "T1"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "C1 positive part \xB7 both disjoint rectangles", values: [[1.8, 0], [0, 3.2]], color: colors[1], hatchedCells: [[1, 1]], rows: ["T0", "T1"] })
    ] }),
    /* @__PURE__ */ jsx4("p", { children: "Rose always identifies C1. Literal signs mark signed coordinates; a solid support is the positive-origin pair and hatching is the negative-origin pair. Neither sign changes the component identity." })
  ] });
}
function PairedSigns() {
  const [a, setA] = scenarioState(0.6), s = signPair(a), up = [a, 0], un = [0, -s.u[1]], vp = [0.6, 0], vn = [0, 0.8];
  return /* @__PURE__ */ jsxs4(Figure, { id: "D33", caption: "Compare the products of paired sign-part norms before selecting and normalizing. Both candidates stay visible. Editing u gives a supplied triplet illustration, not another SVD of the original Xt.", children: [
    /* @__PURE__ */ jsx4(Matrix, { label: "C1 current supplied singular vectors \xB7 signs literal", values: [s.u, s.v], rows: ["u", "v"], columns: ["entry0", "entry1"], color: colors[1], hatchedCells: [[0, 1], [1, 1]], signed: true, max: 1 }),
    /* @__PURE__ */ jsxs4(Operation, { label: "Positive-origin sign parts give one support candidate", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "u+ and v+ \xB7 nonnegative sign parts", values: [up, vp], rows: ["u+", "v+"], color: colors[1], max: 1 }),
      /* @__PURE__ */ jsx4(Port, { label: `norms ${fmt(a)} \xD7 .6 = ${fmt(s.positive)}` }),
      /* @__PURE__ */ jsx4(Matrix, { label: "\u03C35 \xD7 norm product \xB7 solid positive-origin rectangle", values: [[5 * s.positive, 0], [0, 0]], color: colors[1], selected: [0, 0], rows: ["T0", "T1"] })
    ] }),
    /* @__PURE__ */ jsxs4(Operation, { label: "Negative-origin sign parts give the other support candidate", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "u\u2212 and v\u2212 \xB7 magnitudes, not negative entries", values: [un, vn], rows: ["u\u2212", "v\u2212"], color: colors[1], hatchedCells: [[0, 1], [1, 1]], max: 1 }),
      /* @__PURE__ */ jsx4(Port, { label: `norms ${fmt(-s.u[1])} \xD7 .8 = ${fmt(s.negative)}` }),
      /* @__PURE__ */ jsx4(Matrix, { label: "\u03C35 \xD7 norm product \xB7 hatched negative-origin rectangle", values: [[0, 0], [0, 5 * s.negative]], color: colors[1], hatchedCells: [[1, 1]], selected: [1, 1], rows: ["T0", "T1"] })
    ] }),
    /* @__PURE__ */ jsxs4(Operation, { label: "Compare norms, choose support, normalize only nonzero chosen parts", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Norm products before selection", values: [[s.positive, s.negative]], columns: ["Positive pair", "Negative pair"], color: colors[1] }),
      /* @__PURE__ */ jsx4(Port, { label: s.choosePositive ? "positive \u2265 negative \xB7 choose positive" : "negative > positive \xB7 choose negative" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Chosen u and v pieces normalized to unit norm", values: s.choosePositive ? [[1, 0], [1, 0]] : [[0, 1], [0, 1]], rows: ["Unit u piece", "Unit v piece"], color: colors[1], hatchedCells: s.choosePositive ? [] : [[0, 1], [1, 1]], max: 1 }),
      /* @__PURE__ */ jsx4(Port, { label: `outer product \xD7 \u03C35 \xD7 selected norm product = ${fmt(5 * (s.choosePositive ? s.positive : s.negative))}` }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Selected nonnegative rank-one term \xB7 still C1", values: s.term, color: colors[1], hatchedCells: s.choosePositive ? [] : [[1, 1]], selected: s.choosePositive ? [0, 0] : [1, 1], rows: ["T0", "T1"] })
    ] }),
    /* @__PURE__ */ jsx4(Controls, { onReset: () => setA(0.6), children: /* @__PURE__ */ jsx4(Range, { label: "u positive entry a", value: a, onChange: setA, max: 1, step: 0.1 }) }),
    /* @__PURE__ */ jsxs4(Result, { children: [
      "Norm products positive ",
      fmt(s.positive),
      ", negative ",
      fmt(s.negative),
      "; ",
      s.choosePositive ? "positive" : "negative",
      " pair selected. At a.8 the declared positive-pair tie applies. Zero-norm endpoints are never divided. Rose is C1 throughout; solid/hatching tracks sign-part origin after normalization."
    ] })
  ] });
}
function FilledZeros() {
  const [d, setD] = scenarioState(0), x = [[8.2, 2.4], [2.4, 6.8]], original = [[0.8 * Math.sqrt(10), 0], [0.6 * Math.sqrt(10), 4 / Math.sqrt(5)]], w = original.map((r) => r.map((v) => v === 0 ? d : v)), h = transpose(w), s = muSweep(x, w, h);
  return /* @__PURE__ */ jsxs4(Figure, { id: "D34", caption: "Only the original zeros receive \u03B4. Filled and unfilled factors, initial product and one complete H-first/new-H W result remain visible. This edit is not guaranteed to improve the fit; the matrix mean4.95 is a separate nndsvda value outside the live range.", children: [
    /* @__PURE__ */ jsxs4(Operation, { label: "Fill only the original zero support", children: [
      /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsx4(Matrix, { label: "Original W \xB7 outlined original zero[0,1]", values: original, componentColumns: true, originalZeros: [[0, 1]], rows: ["T0", "T1"], columns: ["C0", "C1"] }),
        /* @__PURE__ */ jsx4(Matrix, { label: "Original H=W\u1D40 \xB7 outlined original zero[1,0]", values: transpose(original), componentRows: true, originalZeros: [[1, 0]], rows: ["C0", "C1"], columns: ["F0", "F1"] })
      ] }),
      /* @__PURE__ */ jsx4(Port, { label: `original zeros only \u2192 \u03B4=${fmt(d)}` }),
      /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsx4(Matrix, { label: "Filled initial W", values: w, componentColumns: true, originalZeros: [[0, 1]], rows: ["T0", "T1"], columns: ["C0", "C1"] }),
        /* @__PURE__ */ jsx4(Matrix, { label: "Filled initial H", values: h, componentRows: true, originalZeros: [[1, 0]], rows: ["C0", "C1"], columns: ["F0", "F1"] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs4(Operation, { label: "H-first multiplicative update then W update from fresh H", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Filled initial H \xB7 W held fixed", values: h, componentRows: true, originalZeros: [[1, 0]], rows: ["C0", "C1"], columns: ["F0", "F1"] }),
      /* @__PURE__ */ jsx4(Port, { label: "H \u2299 (W\u1D40X)/(W\u1D40WH)" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "One-step new H \xB7 feeds W block", values: s.h, componentRows: true, originalZeros: [[1, 0]], rows: ["C0", "C1"], columns: ["F0", "F1"] }),
      /* @__PURE__ */ jsx4(Port, { label: "fresh new H \u2192 W numerator and denominator" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "One-step new W", values: s.w, componentColumns: true, originalZeros: [[0, 1]], rows: ["T0", "T1"], columns: ["C0", "C1"] })
    ] }),
    /* @__PURE__ */ jsx4(Matrix, { label: "Initial / updated predictions", values: [...matmul(w, h), ...matmul(s.w, s.h)], rows: ["Initial R0", "Initial R1", "Updated R0", "Updated R1"], max: 12 }),
    /* @__PURE__ */ jsx4("p", { children: "Dashed amber cell outlines preserve original-zero identity through filling and both update results; component color remains C0 blue/C1 rose." }),
    /* @__PURE__ */ jsx4(Controls, { onReset: () => setD(0), children: /* @__PURE__ */ jsx4(Range, { label: "Fill original zeros \u03B4", value: d, onChange: setD, max: 2, step: 0.1 }) }),
    /* @__PURE__ */ jsxs4(Result, { children: [
      "Initial half-loss ",
      fmt(halfLoss(x, matmul(w, h))),
      "; after one complete update ",
      fmt(halfLoss(x, matmul(s.w, s.h))),
      ". New H[1,0]=",
      fmt(s.h[1][0]),
      ", W[0,1]=",
      fmt(s.w[0][1]),
      "."
    ] })
  ] });
}
function PublicAnatomy() {
  const learnedW = [["w00", "w01"], ["w10", "w11"], ["w20", "w21"]], learnedH = [["h00", "h01", "h02"], ["h10", "h11", "h12"]];
  return /* @__PURE__ */ jsxs4(Figure, { id: "D35", caption: "The numerical lane is a supplied hand decomposition, not invented sklearn factors. Public fit_transform learns new arrays; later transform uses its fitted dictionary. The shown query calculation explicitly uses supplied H0.", children: [
    /* @__PURE__ */ jsx4("h4", { children: "Supplied hand decomposition \xB7 numerical lane" }),
    /* @__PURE__ */ jsxs4(Operation, { label: "Hand W times hand H0 equals hand X0", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Hand W \xB7 3\xD72", values: W0, columns: ["C0", "C1"], componentColumns: true }),
      /* @__PURE__ */ jsx4(Port, { label: "\xD7 supplied H0" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Hand H0 \xB7 2\xD73", values: H0, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx4(Port, { label: "exact product" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Hand X0 \xB7 3\xD73", values: X0 })
    ] }),
    /* @__PURE__ */ jsx4("h4", { children: "Public fitted object \xB7 symbolic learned-state lane" }),
    /* @__PURE__ */ jsxs4(Operation, { label: "fit_transform learns returned W and stores fitted H", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Training input X0 \xB7 ordered F0/F1/F2", values: X0 }),
      /* @__PURE__ */ jsx4(Port, { label: "fit_transform \xB7 learn new arrays" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Returned learned W \xB7 shape only \xB7 outside fitted state", values: learnedW, columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsxs4("div", { className: "nmf-lifetime nmf-lifetime--retained", children: [
        /* @__PURE__ */ jsx4("h4", { children: "Fitted-state boundary" }),
        /* @__PURE__ */ jsx4(Matrix, { label: "Stored components_ \xB7 learned H \xB7 shape only", values: learnedH, rows: ["C0", "C1"] }),
        /* @__PURE__ */ jsx4(Matrix, { label: "Stored feature IDs and fitted rank", values: [["F0/F1/F2", 2]], columns: ["Ordered features", "Fitted k"] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs4(Operation, { label: "Later transform reads the same fitted H without refitting", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Later query \xB7 ordered F0/F1/F2", values: [[1.5, 0.5, 2]] }),
      /* @__PURE__ */ jsx4(Port, { label: "transform reads this stored H" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Same stored learned H \xB7 read-only operand", values: learnedH, rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx4(Port, { label: "solve new amounts only" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "New query amounts \xB7 symbolic learned-H solution", values: [["query w0", "query w1"]], columns: ["C0", "C1"] })
    ] }),
    /* @__PURE__ */ jsxs4(Operation, { label: "inverse_transform multiplies new query amounts by the same stored H", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Those new query amounts", values: [["query w0", "query w1"]], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx4(Port, { label: "\xD7 that same stored H" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Same stored learned H \xB7 unchanged", values: learnedH, rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx4(Port, { label: "inverse_transform prediction" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Predicted query \xB7 symbolic", values: [["prediction F0", "prediction F1", "prediction F2"]] })
    ] }),
    /* @__PURE__ */ jsx4("h4", { children: "Separate supplied-H0 query arithmetic \xB7 numerical lane" }),
    /* @__PURE__ */ jsxs4(Operation, { label: "Supplied H0 query amounts reconstruct the shown query", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Query \xB7 supplied H0 gives amounts[1.5,.5]", values: [[1.5, 0.5, 2]] }),
      /* @__PURE__ */ jsx4(Port, { label: "fixed supplied H0 \u2192 amounts[1.5,.5]" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Complete component addends", values: [[1.5, 0, 1.5], [0, 0.5, 0.5]], rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx4(Port, { label: "sum addends" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Supplied-H0 prediction", values: [[1.5, 0.5, 2]] })
    ] }),
    /* @__PURE__ */ jsx4("p", { children: "Refused: query feature order[F1,F0,F2] differs from fitted[F0,F1,F2]; query[\u22121,0,1] contains a negative value. Neither request changes the fitted state. Symbolic learned arrays above are not asserted equal to the hand factors." })
  ] });
}
function SameBlock() {
  const [a, setA] = scenarioState(1), cd = [2, 2.5], mu = [5 * a / (2 * a + 1), 7 / (a + 2)], lanes = [["Cyclic CD", cd], ["Simultaneous MU", mu]];
  return /* @__PURE__ */ jsxs4(Figure, { id: "D36", caption: "Both routes start from[a,1] with fixed H0. CD sends its new C0=2 into C1=(7\u22122)/2; MU sends old operands into both denominators2a+1 and a+2. One block is not a stationary coupled solution.", children: [
    /* @__PURE__ */ jsx4(Matrix, { label: "Fixed G and p \xB7 component axes", values: [[2, 1], [1, 2], [5, 7]], rows: ["G C0", "G C1", "p R1"], columns: ["C0", "C1"] }),
    /* @__PURE__ */ jsxs4(Operation, { label: "Cyclic CD wires fresh C0 into the C1 update", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Old amounts", values: [[a, 1]], columns: ["C0", "C1"], componentColumns: true, rows: ["R1"] }),
      /* @__PURE__ */ jsx4(Port, { label: "C0=(5\u2212old C1)/2=2" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Fresh C0 with held old C1", values: [[2, 1]], componentColumns: true, rows: ["R1"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx4(Port, { label: "C1=(7\u2212fresh C0)/2=2.5" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "CD amounts", values: [cd], componentColumns: true, rows: ["R1"], columns: ["C0", "C1"] })
    ] }),
    /* @__PURE__ */ jsxs4(Operation, { label: "Simultaneous MU uses old amounts in both contractions", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Old amounts \xB7 held for both denominators", values: [[a, 1]], componentColumns: true, rows: ["R1"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx4(Port, { label: "C0: a\xD75/(2a+1); C1: 1\xD77/(a+2)" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "MU amounts \xB7 published together", values: [mu], componentColumns: true, rows: ["R1"], columns: ["C0", "C1"] })
    ] }),
    lanes.map(([name, w]) => {
      const pred = matmul([w], H0)[0], g = [2 * w[0] + w[1] - 5, w[0] + 2 * w[1] - 7], arrowScale = 0.25 / Math.max(1, ...g.map(Math.abs));
      return /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsxs4("h4", { children: [
          name,
          " \xB7 resulting coupled slopes"
        ] }),
        /* @__PURE__ */ jsx4(Panels, { children: [1, -1].map((direction) => /* @__PURE__ */ jsx4(Plot, { label: `${name} \xB7 ${direction === 1 ? "slope +gradient" : "improving \u2212gradient"} directions`, xmax: 4, ymax: 4, xlabel: "C0 amount", ylabel: "C1 amount", equalUnits: true, children: (map) => /* @__PURE__ */ jsxs4(Fragment2, { children: [
          g.map((v, c) => {
            const end = map(w.map((x, j) => x + (j === c ? direction * v * arrowScale : 0)));
            return /* @__PURE__ */ jsxs4("g", { children: [
              v !== 0 && /* @__PURE__ */ jsxs4(Fragment2, { children: [
                /* @__PURE__ */ jsx4(Arrow, { from: map(w), to: end, color: colors[c] }),
                /* @__PURE__ */ jsx4("path", { d: `M${c === 0 ? 105 : 205} ${c === 0 ? 45 : 65}L${end.join(" ")}`, stroke: colors[c], fill: "none" })
              ] }),
              /* @__PURE__ */ jsx4("text", { x: c === 0 ? 70 : 165, y: c === 0 ? 40 : 60, fill: colors[c], children: `C${c} ${v === 0 ? "slope0" : direction === 1 ? "+g" : "\u2212g"}` })
            ] }, c);
          }),
          /* @__PURE__ */ jsx4(Point, { at: map(w), label: "amounts", open: true })
        ] }) }, direction)) }),
        /* @__PURE__ */ jsx4(Matrix, { label: `${name} amounts and complete addends`, values: [[...w, "\u2014"], [w[0], 0, w[0]], [0, w[1], w[1]], pred, [1 - pred[0], 3 - pred[1], 4 - pred[2]]], rows: ["C0/C1 amounts", "C0 addend", "C1 addend", "Prediction", "Residual"], signed: true }),
        /* @__PURE__ */ jsxs4("p", { children: [
          "Blue arrow is C0, rose arrow is C1. Left arrows follow positive coordinate slope; right arrows reverse it to improve this positive-coordinate point. Both drawings use one common scale ",
          fmt(arrowScale),
          " per gradient unit; a zero slope has no arrow. Half-loss ",
          fmt(halfLoss([[1, 3, 4]], [pred])),
          "; gradient [",
          g.map(fmt).join(", "),
          "]; PG\xB2 ",
          fmt(g[0] ** 2 + g[1] ** 2),
          "."
        ] })
      ] }, name);
    }),
    /* @__PURE__ */ jsx4(Controls, { onReset: () => setA(1), children: /* @__PURE__ */ jsx4(Range, { label: "Initial C0 amount; initial C1=1", value: a, onChange: setA, min: 0.5, max: 2 }) }),
    /* @__PURE__ */ jsxs4(Result, { children: [
      "Start [",
      fmt(a),
      ",1]: CD loss.75; MU loss ",
      fmt(halfLoss([[1, 3, 4]], matmul([mu], H0))),
      ". ",
      halfLoss([[1, 3, 4]], matmul([mu], H0)) < 0.75 ? "MU" : "CD",
      " has lower loss at this selected block; neither has zero projected gradient."
    ] })
  ] });
}
function Publication() {
  return /* @__PURE__ */ jsxs4(Figure, { id: "D37", caption: "A complete fitted snapshot is published together only after supported validation and arithmetic succeed. Rejected candidates do not partially replace its H, features, fitted rank or diagnostics. Next-fit configuration and returned copies remain outside it.", children: [
    /* @__PURE__ */ jsxs4("div", { className: "nmf-lifetime nmf-lifetime--retained", children: [
      /* @__PURE__ */ jsx4("h4", { children: "Existing fitted snapshot \xB7 one coherent published state" }),
      /* @__PURE__ */ jsxs4(Panels, { children: [
        /* @__PURE__ */ jsx4(Matrix, { label: "Old fitted H0 \xB7 unchanged after refusal", values: H0, rows: ["C0", "C1"] }),
        /* @__PURE__ */ jsx4(Matrix, { label: "Old ordered feature identities", values: [["F0", "F1", "F2"]], rows: ["Order"] }),
        /* @__PURE__ */ jsx4(Matrix, { label: "Old fitted metadata slots", values: [[2, "stored objective", "stored stop reason"]], columns: ["Fitted k", "Diagnostic", "Diagnostic"] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs4(Operation, { label: "Invalid candidates stop before any fitted slot is published", children: [
      /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsx4(Matrix, { label: "Negative candidate", values: [[-1, 0, 1]], signed: true }),
        /* @__PURE__ */ jsx4(Matrix, { label: "Nonfinite candidate", values: [["NaN", 0, 1]] }),
        /* @__PURE__ */ jsx4(Matrix, { label: "Actual width2 candidate \xB7 only two cells", values: [[1, 2]], columns: ["F0", "F1"] })
      ] }),
      /* @__PURE__ */ jsx4(Port, { label: "STOP \xB7 negative / nonfinite / expected width3", symbol: "\u22A3" }),
      /* @__PURE__ */ jsx4("p", { children: "Validation refuses these candidates. No path transfers any of their cells into the existing fitted snapshot." })
    ] }),
    /* @__PURE__ */ jsxs4(Operation, { label: "Valid complete candidate transfers all fitted slots together", children: [
      /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsx4(Matrix, { label: "Valid new H \xB7 indexed values only", values: [["new h00", "new h01", "new h02"], ["new h10", "new h11", "new h12"]], rows: ["new C0", "new C1"] }),
        /* @__PURE__ */ jsx4(Matrix, { label: "Candidate metadata \xB7 complete", values: [["F0/F1/F2", 2, "new objective", "new stop reason"]], columns: ["Ordered features", "Fitted k", "Diagnostic", "Diagnostic"] })
      ] }),
      /* @__PURE__ */ jsx4(Port, { label: "validation + arithmetic succeed \u2192 atomic publication" }),
      /* @__PURE__ */ jsxs4("div", { className: "nmf-lifetime nmf-lifetime--retained", children: [
        /* @__PURE__ */ jsx4("h4", { children: "Replacement fitted snapshot" }),
        /* @__PURE__ */ jsx4(Matrix, { label: "Published new H \xB7 all six cells together", values: [["new h00", "new h01", "new h02"], ["new h10", "new h11", "new h12"]], rows: ["new C0", "new C1"] }),
        /* @__PURE__ */ jsx4(Matrix, { label: "Published new metadata \xB7 together with H", values: [["F0/F1/F2", 2, "new objective", "new stop reason"]], columns: ["Ordered features", "Fitted k", "Diagnostic", "Diagnostic"] }),
        /* @__PURE__ */ jsx4("p", { children: "All new H cells, ordered feature IDs, fitted k, objective and stop reason cross the boundary together. No partial candidate is visible to queries." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs4(Operation, { label: "Refusal leaves old query behavior attached to old fitted state", children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Old query \xB7 ordered F0/F1/F2", values: [[1.5, 0.5, 2]] }),
      /* @__PURE__ */ jsx4(Port, { label: "read unchanged fitted k2 and H0" }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Old query amounts \xB7 still two components", values: [[1.5, 0.5]], columns: ["C0", "C1"] })
    ] }),
    /* @__PURE__ */ jsxs4(Panels, { children: [
      /* @__PURE__ */ jsxs4("div", { className: "nmf-lifetime", children: [
        /* @__PURE__ */ jsx4("h4", { children: "Future configuration \xB7 outside fitted snapshot" }),
        /* @__PURE__ */ jsx4(Matrix, { label: "Next-fit requested k1", values: [[1]] }),
        /* @__PURE__ */ jsx4("p", { children: "It cannot resize the old two-component query." })
      ] }),
      /* @__PURE__ */ jsxs4("div", { className: "nmf-lifetime", children: [
        /* @__PURE__ */ jsx4("h4", { children: "Returned copy \xB7 outside fitted snapshot" }),
        /* @__PURE__ */ jsx4(Matrix, { label: "Edited returned copy \xB7 no backward mutation", values: [[-99, 0, 1], [0, 1, 1]], signed: true }),
        /* @__PURE__ */ jsx4("p", { children: "Editing this copy does not cross back into stored H." })
      ] })
    ] }),
    /* @__PURE__ */ jsx4("p", { children: "Valid publication is a state-consistency operation; it does not certify global optimality." })
  ] });
}
function Penalty() {
  const [l, setL] = scenarioState(0), w = Math.max(0, 2 - l), data = (2 - w) ** 2 / 2, paid = l * w;
  return /* @__PURE__ */ jsxs4(Figure, { id: "D38", caption: "A linear price moves the constrained optimum to max(0,2\u2212\u03BB), including the nonnegative boundary. The separate squared-price inset has \u03BB1=0, \u03BB2=1 and optimum1.", children: [
    /* @__PURE__ */ jsxs4(Panels, { children: [
      /* @__PURE__ */ jsx4(Plot, { label: "Data + linear price = total", xmax: 3, ymax: 10, xlabel: "amount w", ylabel: "cost", children: (map) => /* @__PURE__ */ jsxs4(Fragment2, { children: [
        /* @__PURE__ */ jsx4(Curve, { map, xmax: 3, fn: (w2) => (2 - w2) ** 2 / 2 }),
        /* @__PURE__ */ jsx4(Curve, { map, xmax: 3, fn: (w2) => l * w2, color: "#f2c276" }),
        /* @__PURE__ */ jsx4(Curve, { map, xmax: 3, fn: (w2) => (2 - w2) ** 2 / 2 + l * w2, color: colors[1] }),
        /* @__PURE__ */ jsx4(Point, { at: map([w, data + paid]), label: "best", color: colors[1] })
      ] }) }),
      /* @__PURE__ */ jsx4(Plot, { label: "Fixed squared price \xB7 .5w\xB2", xmax: 3, ymax: 6, xlabel: "amount w", ylabel: "cost", children: (map) => /* @__PURE__ */ jsxs4(Fragment2, { children: [
        /* @__PURE__ */ jsx4(Curve, { map, xmax: 3, fn: (w2) => (2 - w2) ** 2 / 2 }),
        /* @__PURE__ */ jsx4(Curve, { map, xmax: 3, fn: (w2) => w2 * w2 / 2, color: "#f2c276" }),
        /* @__PURE__ */ jsx4(Curve, { map, xmax: 3, fn: (w2) => (2 - w2) ** 2 / 2 + w2 * w2 / 2, color: colors[1] }),
        /* @__PURE__ */ jsx4(Point, { at: map([1, 1]), label: "best1", color: colors[1] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx4(Controls, { onReset: () => setL(0), children: /* @__PURE__ */ jsx4(Range, { label: "Linear price \u03BB", value: l, onChange: setL, max: 3 }) }),
    /* @__PURE__ */ jsxs4(Result, { children: [
      "\u03BB=",
      fmt(l),
      ", best amount ",
      fmt(w),
      ", data cost ",
      fmt(data),
      ", price ",
      fmt(paid),
      ", total ",
      fmt(data + paid),
      ", total derivative ",
      fmt(w - 2 + l),
      ". Blue data, amber price, rose total."
    ] })
  ] });
}
function ScalePenalty() {
  const [s, setS] = scenarioState(1), w = W0.map((r) => [r[0] / s, r[1]]), h = [H0[0].map((v) => v * s), H0[1]], wm = 3 / s + 6, hm = 2 * s + 2;
  return /* @__PURE__ */ jsxs4(Figure, { id: "D39", caption: "The exact product stays X0, while dimension-scaled factor penalties change. With alphaW.1/alphaH.2,r1,n=d3, the prices are.3 per W unit and.6 per H unit. Zero alphas would cost0 at every scale.", children: [
    /* @__PURE__ */ jsxs4(Panels, { children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Current compensated W", values: w, columns: ["C0", "C1"], componentColumns: true }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Current scaled H", values: h, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx4(Matrix, { label: "C0 contribution \xB7 invariant", color: colors[0], values: W0.map((r) => H0[0].map((v) => v * r[0])) }),
      /* @__PURE__ */ jsx4(Matrix, { label: "C1 contribution \xB7 invariant", color: colors[1], values: W0.map((r) => H0[1].map((v) => v * r[1])) }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Same reconstructed X0", values: matmul(w, h) })
    ] }),
    /* @__PURE__ */ jsx4(Controls, { onReset: () => setS(1), children: /* @__PURE__ */ jsx4(Range, { label: "C0 pattern scale s", value: s, onChange: setS, min: 0.5, max: 3 }) }),
    /* @__PURE__ */ jsxs4(Result, { children: [
      "W mass ",
      fmt(wm),
      " \xD7.3=",
      fmt(0.3 * wm),
      "; H mass ",
      fmt(hm),
      " \xD7.6=",
      fmt(0.6 * hm),
      "; total penalty ",
      fmt(0.3 * wm + 0.6 * hm),
      ". Data half-loss0."
    ] })
  ] });
}
function MaskGram() {
  const [m, setM] = scenarioState(1), root = Math.sqrt(m), g = [[1 + m, m], [m, 1 + m]], p = [[2 + 3 * m, 1 + 3 * m]], A = [[1, 0], [0, 1], [root, root]], b = [[2], [1], [3 * root]];
  return /* @__PURE__ */ jsxs4(Figure, { id: "D40", caption: "Weights change the local Gram and cross product. F2 remains measured3 even when excluded from the objective. Square-root weighting produces the same G=A\u1D40A and p=A\u1D40b; different masks require different caches.", children: [
    /* @__PURE__ */ jsxs4(Operation, { label: "Square-root weights act on features, not on measured values", children: [
      /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsx4(Matrix, { label: "Measured R0 \xB7 unchanged", values: [[2, 1, 3]], selected: [0, 2] }),
        /* @__PURE__ */ jsx4(Matrix, { label: "Separate weights [1,1,m]", values: [[1, 1, m]], selected: [0, 2] }),
        /* @__PURE__ */ jsx4(Matrix, { label: "Observation status \xB7 hatching means excluded", values: [["observed", "observed", m === 0 ? "excluded" : "observed"]], selected: [0, 2] }),
        /* @__PURE__ */ jsx4(Matrix, { label: "Fixed H0", values: H0, rows: ["C0", "C1"], componentRows: true, selectedCells: [[0, 2], [1, 2]] })
      ] }),
      /* @__PURE__ */ jsx4(Port, { label: "each feature row \xD7 sqrt(weight)" }),
      /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsx4(Matrix, { label: "A = sqrt(weights) H\u1D40", values: A, rows: ["F0", "F1", "F2"], columns: ["C0", "C1"], selectedCells: [[2, 0], [2, 1]] }),
        /* @__PURE__ */ jsx4(Matrix, { label: "b = sqrt(weights) x", values: b, rows: ["F0", "F1", "F2"], columns: ["Target"], selected: [2, 0] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs4(Operation, { label: "Contract the same feature identities into weighted caches", children: [
      /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsx4(DotProduct, { left: [1, 0, root], right: [0, 1, root], ids: ["F0", "F1", "F2"], leftLabel: "A[F,C0]", rightLabel: "A[F,C1]", resultLabel: "G[C0,C1] \xB7 F2 contributes m" }),
        /* @__PURE__ */ jsx4(DotProduct, { left: [1, 0, root], right: [2, 1, 3 * root], ids: ["F0", "F1", "F2"], leftLabel: "A[F,C0]", rightLabel: "b[F]", resultLabel: "p[C0] \xB7 F2 contributes3m" })
      ] }),
      /* @__PURE__ */ jsx4(Port, { label: "A\u1D40A and A\u1D40b" }),
      /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsx4(Matrix, { label: "Current local G", values: g, rows: ["C0", "C1"], columns: ["C0", "C1"], selected: [0, 1] }),
        /* @__PURE__ */ jsx4(Matrix, { label: "Current local p", values: p, columns: ["C0", "C1"], selected: [0, 0] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs4(Panels, { children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "All-observed comparison G / p", values: [[2, 1], [1, 2], [5, 4]], rows: ["G C0", "G C1", "p"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Second observation pattern \xB7 mask[1,0,0]", values: [[1, 0, 0]] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Second mask requires G=diag(1,0), p=[2,0]", values: [[1, 0], [0, 0], [2, 0]], rows: ["G C0", "G C1", "p"], columns: ["C0", "C1"] })
    ] }),
    /* @__PURE__ */ jsx4(Controls, { onReset: () => setM(1), children: /* @__PURE__ */ jsx4(Range, { label: "F2 observation weight m", value: m, onChange: setM, max: 1 }) }),
    /* @__PURE__ */ jsxs4(Result, { children: [
      "m=",
      fmt(m),
      "; offdiagonal contribution ",
      fmt(m),
      ", each F2 cross contribution ",
      fmt(3 * m),
      ". A third row [",
      fmt(root),
      ",",
      fmt(root),
      "], target ",
      fmt(3 * root),
      ". ",
      m === 0 ? "F2 is excluded." : m === 1 ? "All three cells observed equally." : "Fractional weighting differs from a binary observation mask."
    ] })
  ] });
}
function NoInformation() {
  return /* @__PURE__ */ jsxs4(Figure, { id: "D41", caption: "Identical placeholder values do not carry identical information. Missing quality0/0 is undefined; three measured zeros give MSE0/3=0. An unsupported dictionary column is a chosen convention, not estimated physical absence.", children: [
    /* @__PURE__ */ jsxs4(Panels, { children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Missing lane \xB7 finite placeholders", values: [[0, 0, 0], ["not observed", "not observed", "not observed"], [0, 0, 0]], rows: ["Values", "Mask0/0/0", "Chosen prediction"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Measured-zero lane", values: [[0, 0, 0], [1, 1, 1], [0, 0, 0]], rows: ["Measured values", "Mask", "Prediction"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Both chosen amount rows", values: [[0, 0], [0, 0]], rows: ["Missing", "Measured zero"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Changed masks \xB7 F2 entirely unsupported", values: [[0, 0, 0], [1, 1, 0]] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Column support flags / chosen H column", values: [[true, true, false], [0, 0, "chosen F2 column0"]], rows: ["Supported?", "H F2=[0,0]"] })
    ] }),
    /* @__PURE__ */ jsx4("p", { children: "Missing included numerator0, denominator0: unknown predictive quality. Measured-zero numerator0, denominator3: observed-cell MSE0." })
  ] });
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/TransferFigures.jsx
import React6, { useState as useState3 } from "react";
import { Fragment as Fragment3, jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function WordCounts() {
  const docs = ["orbit rocket orbit", "rocket orbit rocket", "goal team goal", "team goal team", "orbit rocket goal team"], vocabulary = ["goal", "orbit", "rocket", "team"];
  return /* @__PURE__ */ jsxs5(Figure, { id: "D57", caption: "Repeated occurrences enter the same vocabulary column. Two orbit tokens in document0 become its orbit count2. The patterns and amounts below are rounded values from the preserved original count/KL experiment, in its original component order.", children: [
    /* @__PURE__ */ jsx5("div", { className: "nmf-token-rows", children: docs.map((d, i) => /* @__PURE__ */ jsxs5("p", { children: [
      /* @__PURE__ */ jsxs5("strong", { children: [
        "Document",
        i,
        ": "
      ] }),
      d.split(" ").map((word, j) => /* @__PURE__ */ jsxs5("span", { className: "nmf-token", style: {
        borderColor: colors[vocabulary.indexOf(word)]
      }, children: [
        word,
        " \u2192 ",
        word === "orbit" && i === 0 ? "R0 orbit cell" : word + " column",
        " "
      ] }, j))
    ] }, i)) }),
    /* @__PURE__ */ jsxs5(Panels, { children: [
      /* @__PURE__ */ jsx5(Matrix, { label: "Observed token counts \xB7 word identities", values: [[0, 2, 1, 0], [0, 1, 2, 0], [2, 0, 0, 1], [1, 0, 0, 2], [1, 1, 1, 1]], columns: vocabulary, max: 2 }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Rounded unit-row-sum word patterns", values: [[0.5, 0, 0, 0.5], [0, 0.5, 0.5, 0]], rows: ["C0", "C1"], columns: vocabulary, componentRows: true, max: 1 }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Mixed-document amount \xD7 full pattern \u2192 sum", values: [[1, 0, 0, 1], [0, 1, 1, 0], [1, 1, 1, 1]], rows: ["2\xD7C0", "2\xD7C1", "Sum"], columns: vocabulary, max: 2 })
    ] }),
    /* @__PURE__ */ jsx5("p", { children: "Amounts[2,2] sum4 token occurrences, rather than1. Word identity and pattern identity have different roles; this is not a topic posterior." })
  ] });
}
function FrozenIDF() {
  const [a, setA] = scenarioState(2), idf = [1 + Math.log(2), 1 + Math.log(4 / 3), 1 + Math.log(4 / 3)], counts = [[2, 1, 0], [0, 1, 1], [0, 0, 2]], query = [a, 1, 0], weighted = query.map((v, j) => v * idf[j]), base = [2 * idf[0], idf[1], 0], length = Math.hypot(...base);
  return /* @__PURE__ */ jsxs5(Figure, { id: "D58", caption: "This new three-column corpus fixes its vocabulary and IDF on training rows. Query edits change occurrences, never document frequencies or IDF. The separate unit-length inset changes representation; the live weighted row keeps norm=None.", children: [
    /* @__PURE__ */ jsxs5(Panels, { children: [
      /* @__PURE__ */ jsx5(Matrix, { label: "New training counts", values: counts, columns: ["orbit", "rocket", "team"] }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Training document presence \u2192 df \u2192 fixed IDF", values: [[1, 1, 0], [0, 1, 1], [0, 0, 1], [1, 2, 2], idf], rows: ["Doc0 presence", "Doc1 presence", "Doc2 presence", "df", "IDF"], columns: ["orbit", "rocket", "team"] }),
      /* @__PURE__ */ jsx5(Bars, { label: "Current query counts \xB7 occurrence units", values: query, ids: ["orbit", "rocket", "team"], max: 4 }),
      /* @__PURE__ */ jsx5(Bars, { label: "Current weighted query \xB7 weight units", values: weighted, ids: ["orbit", "rocket", "team"], max: 7 }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Static all-OOV planet \u2192 zero retained row", values: [[0, 0, 0]], columns: ["orbit", "rocket", "team"] }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Static default row / Euclidean length \xB7 different representation", values: [base, base.map((v) => v / length)], rows: ["Default weighted", "Unit length"], columns: ["orbit", "rocket", "team"] })
    ] }),
    /* @__PURE__ */ jsx5(Controls, { onReset: () => setA(2), children: /* @__PURE__ */ jsx5(Range, { label: "Orbit occurrences in this query", value: a, onChange: setA, max: 4, step: 1 }) }),
    /* @__PURE__ */ jsxs5(Result, { children: [
      "Count [",
      query.join(", "),
      "] \u2192 weighted [",
      weighted.map(fmt).join(", "),
      "]; training weights unchanged. Rocket planet maps to[0,1,0]; all-planet maps to zero, meaning no retained vocabulary occurrence."
    ] })
  ] });
}
function SpectralConstraints() {
  const [g, setG] = scenarioState(1), query = [2 * g, g, 3 * g], cone = [2 * g, g], t = clamp((g + 1) / 2, 0, 1), simplex = [t, 1 - t], prediction = matmul([simplex], H0)[0], residual = query.map((v, j) => v - prediction[j]);
  return /* @__PURE__ */ jsxs5(Figure, { id: "D59", caption: "Constructed band responses: the cone allows arbitrary nonnegative amounts, while the segment requires them to sum1. The plot is a bands0/1 projection; the complete third band remains in the arrays and full3D half-loss. The open blue diamond is the query; the amber circle is the simplex prediction. No calibrated physical material is claimed.", children: [
    /* @__PURE__ */ jsxs5(Panels, { children: [
      /* @__PURE__ */ jsx5(Plot, { label: "Fixed cone rays and sum-one segment \xB7 bands0/1", xmax: 4, ymax: 4, xlabel: "Band0", ylabel: "Band1", children: (map) => /* @__PURE__ */ jsxs5(Fragment3, { children: [
        /* @__PURE__ */ jsx5(Arrow, { from: map([0, 0]), to: map([3.5, 0]) }),
        /* @__PURE__ */ jsx5(Arrow, { from: map([0, 0]), to: map([0, 3.5]), color: colors[1] }),
        /* @__PURE__ */ jsx5("path", { d: `M${map([1, 0]).join(" ")}L${map([0, 1]).join(" ")}`, stroke: "#f2c276", strokeWidth: "3" }),
        /* @__PURE__ */ jsx5(Point, { at: map(query.slice(0, 2)), diamond: true, open: true }),
        /* @__PURE__ */ jsx5(Point, { at: map(prediction.slice(0, 2)), label: "simplex", color: "#f2c276" })
      ] }) }),
      /* @__PURE__ */ jsx5(Bars, { label: "Query \xB7 three band intensities", values: query, ids: ["Band0", "Band1", "Band2"], max: 6 }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Amounts and complete predictions", values: [[...cone, "\u2014"], query, [...simplex, "\u2014"], prediction, residual], rows: ["Cone C0/C1", "Cone prediction", "Simplex C0/C1", "Simplex prediction", "Simplex residual"], signed: true, max: 6 }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Static gain1 normalize-after-NNLS comparison", values: [[2 / 3, 1 / 3, "\u2014"], [2 / 3, 1 / 3, 1]], rows: ["Normalized amounts", "Changed prediction"] })
    ] }),
    /* @__PURE__ */ jsx5(Controls, { onReset: () => setG(1), children: /* @__PURE__ */ jsx5(Range, { label: "Common query gain g", value: g, onChange: setG, min: 0.5, max: 2, step: 0.05 }) }),
    /* @__PURE__ */ jsxs5(Result, { children: [
      "Cone amounts[",
      cone.map(fmt).join(", "),
      "], half-loss0. Simplex amounts[",
      simplex.map(fmt).join(", "),
      "], half-loss ",
      fmt(halfLoss([query], [prediction])),
      ", third-band prediction1. At gain1 normalized NNLS has loss28/9, rather than the segment optimum3."
    ] })
  ] });
}
function ExternalEvidence() {
  const h = [[1, 1, 1], [0, 1, 1]], changed = [[1, 0.5, 0.5], [0, 1, 1]];
  return /* @__PURE__ */ jsxs5(Figure, { id: "D60", caption: "Two modeled explanations have the same complete constructed response[2,3,3] and zero residual. Calibration, independently validated endmembers and a justified mixing law are additional evidence; zero residual does not provide them.", children: [
    /* @__PURE__ */ jsx5(Panels, { children: [[h, [2, 1], "Original modeled lane"], [changed, [2, 2], "Changed modeled lane"]].map(([dictionary, w, label]) => /* @__PURE__ */ jsxs5("div", { children: [
      /* @__PURE__ */ jsx5(Matrix, { label: `${label} \xB7 patterns`, values: dictionary, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Amounts \xD7 patterns \u2192 complete addends and sum", values: [[...w, "\u2014"], dictionary[0].map((v) => v * w[0]), dictionary[1].map((v) => v * w[1]), matmul([w], dictionary)[0], [0, 0, 0]], rows: ["C0/C1 amounts", "C0 addend", "C1 addend", "Modeled response", "Residual"], max: 3 })
    ] }, label)) }),
    /* @__PURE__ */ jsx5(Bars, { label: "One constructed candidate response \xB7 band units", values: [2, 3, 3], max: 3 }),
    /* @__PURE__ */ jsx5("p", { children: "Additional evidence, not supplied by zero residual: instrument calibration; pure-material measurements; a defensible mixing law; independent source validation." })
  ] });
}
var oldA = [[4, 2], [2, 1]];
var oldB = [[4, 2, 6], [2, 1, 3]];
var deltaA = [[0, 0], [0, 4]];
var deltaB = [[0, 0, 0], [0, 4, 4]];
function OnlineStatistics() {
  return /* @__PURE__ */ jsx5(Figure, { id: "D61", caption: "Each historical encoding contributes an outer product to A and a code\xD7observation product to B. These exact products expose the compact surrogate without implying that all earlier rows are retained or freshly re-encoded.", children: [{ name: "Historical", x: [2, 1, 3], w: [2, 1], a: oldA, b: oldB }, { name: "Incoming fixed-H", x: [0, 2, 2], w: [0, 2], a: deltaA, b: deltaB }].map(({ name, x, w, a, b }) => /* @__PURE__ */ jsxs5("div", { children: [
    /* @__PURE__ */ jsxs5("h4", { children: [
      name,
      " row contribution"
    ] }),
    /* @__PURE__ */ jsxs5(Operation, { label: `${name} code column outer code row produces A`, children: [
      /* @__PURE__ */ jsx5(Matrix, { label: `${name} code column w\u1D40`, values: w.map((v) => [v]), rows: ["C0", "C1"], componentRows: true, selected: [0, 0] }),
      /* @__PURE__ */ jsx5(Port, { label: "outer product \xD7 code row w" }),
      /* @__PURE__ */ jsx5(Matrix, { label: `${name} code row w`, values: [w], columns: ["C0", "C1"], componentColumns: true, selected: [0, 1] }),
      /* @__PURE__ */ jsx5(Port, { label: `A01 = ${w[0]}\xD7${w[1]} = ${a[0][1]}` }),
      /* @__PURE__ */ jsx5(Matrix, { label: `${name} A contribution`, values: a, rows: ["C0", "C1"], columns: ["C0", "C1"], selected: [0, 1] })
    ] }),
    /* @__PURE__ */ jsxs5(Operation, { label: `${name} code column outer observation row produces B`, children: [
      /* @__PURE__ */ jsx5(Matrix, { label: `${name} code column w\u1D40`, values: w.map((v) => [v]), rows: ["C0", "C1"], componentRows: true, selected: [0, 0] }),
      /* @__PURE__ */ jsx5(Port, { label: "outer product \xD7 observation x" }),
      /* @__PURE__ */ jsx5(Matrix, { label: `${name} observation row x`, values: [x], columns: ["F0", "F1", "F2"], selected: [0, 2] }),
      /* @__PURE__ */ jsx5(Port, { label: `B02 = ${w[0]}\xD7${x[2]} = ${b[0][2]}` }),
      /* @__PURE__ */ jsx5(Matrix, { label: `${name} B contribution`, values: b, rows: ["C0", "C1"], columns: ["F0", "F1", "F2"], selected: [0, 2] })
    ] })
  ] }, name)) });
}
function Retention() {
  const [rho, setRho] = scenarioState(1), a = add(scale(oldA, rho), deltaA), b = add(scale(oldB, rho), deltaB);
  return /* @__PURE__ */ jsxs5(Figure, { id: "D62", caption: "For this nonempty batch, old statistics receive retention\u03C1 and the incoming products enter once. Empty batch is a no-op. At\u03C10 the old statistics vanish while the existing dictionary is not reset.", children: [
    /* @__PURE__ */ jsxs5(Operation, { label: "Retain old A, add incoming A once, publish new A", children: [
      /* @__PURE__ */ jsx5(Matrix, { label: "Old A", values: oldA, rows: ["C0", "C1"], columns: ["C0", "C1"], selected: [1, 1] }),
      /* @__PURE__ */ jsx5(Port, { label: `\xD7 \u03C1=${fmt(rho)}` }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Retained old A \xB7 \u03C1 Aold", values: scale(oldA, rho), selected: [1, 1], rows: ["C0", "C1"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx5(Port, { label: "+ incoming \u0394A", symbol: "+" }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Incoming \u0394A \xB7 unscaled", values: deltaA, selected: [1, 1], rows: ["C0", "C1"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx5(Port, { label: `A11: ${fmt(rho)}\xD71+4=${fmt(a[1][1])}` }),
      /* @__PURE__ */ jsx5(Matrix, { label: "New A", values: a, selected: [1, 1], rows: ["C0", "C1"], columns: ["C0", "C1"] })
    ] }),
    /* @__PURE__ */ jsxs5(Operation, { label: "Retain old B, add incoming B once, publish new B", children: [
      /* @__PURE__ */ jsx5(Matrix, { label: "Old B", values: oldB, rows: ["C0", "C1"], selected: [1, 1] }),
      /* @__PURE__ */ jsx5(Port, { label: `\xD7 \u03C1=${fmt(rho)}` }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Retained old B \xB7 \u03C1 Bold", values: scale(oldB, rho), selected: [1, 1], rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx5(Port, { label: "+ incoming \u0394B", symbol: "+" }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Incoming \u0394B \xB7 unscaled", values: deltaB, selected: [1, 1], rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx5(Port, { label: `B11: ${fmt(rho)}\xD71+4=${fmt(b[1][1])}` }),
      /* @__PURE__ */ jsx5(Matrix, { label: "New B", values: b, selected: [1, 1], rows: ["C0", "C1"] })
    ] }),
    /* @__PURE__ */ jsxs5("div", { className: "nmf-lifetime nmf-lifetime--retained", children: [
      /* @__PURE__ */ jsx5("h4", { children: "Dictionary lifetime is separate from old-statistic retention" }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Existing dictionary \xB7 retained even at\u03C10", values: H0, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx5("p", { children: "Empty batch bypasses both operations above: Aold \u2192 Aold, Bold \u2192 Bold, H \u2192 H. It does not apply retention without incoming data." })
    ] }),
    /* @__PURE__ */ jsx5(Controls, { onReset: () => setRho(1), children: /* @__PURE__ */ jsx5(Range, { label: "Old-statistic retention \u03C1", value: rho, onChange: setRho, max: 1 }) }),
    /* @__PURE__ */ jsxs5(Result, { children: [
      "\u03C1=",
      fmt(rho),
      ". A11=",
      fmt(rho + 4),
      ", B[1,F1]=",
      fmt(rho + 4),
      ". Empty batch leaves A/B/H unchanged. At\u03C10 an unused C0 surrogate coordinate is flat and its dictionary row is retained."
    ] })
  ] });
}
function StaleStatistics() {
  const [h, setH] = scenarioState(1), s = staleCode(h);
  return /* @__PURE__ */ jsxs5(Figure, { id: "D63", caption: "Changing the current dictionary does not retroactively change stored encodings. A/B keep historical code products; a new fixed-H encoding answers a different current-dictionary question.", children: [
    /* @__PURE__ */ jsxs5(Panels, { children: [
      /* @__PURE__ */ jsx5(Matrix, { label: "Current edited dictionary", values: s.dictionary, rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Historical A \xB7 unchanged", values: [[4, 2], [2, 5]], rows: ["C0", "C1"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Historical B \xB7 unchanged", values: [[4, 2, 6], [2, 5, 7]], rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Old versus freshly solved first-row amounts", values: [[2, 1], s.w], rows: ["Stored codes", "Fresh codes"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Actual first-row predictions", values: [[2, 1, 3], s.oldPrediction, s.freshPrediction], rows: ["Observation", "Stored-code prediction", "Fresh-code prediction"] }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Second row remains exact", values: [[0, 2, 2], [0, 2, 2]], rows: ["Observation", "Prediction"] })
    ] }),
    /* @__PURE__ */ jsx5(Controls, { onReset: () => setH(1), children: /* @__PURE__ */ jsx5(Range, { label: "Current H[C0,F0]", value: h, onChange: setH, min: 1, max: 2, step: 0.05 }) }),
    /* @__PURE__ */ jsxs5(Result, { children: [
      "Stored-code half-loss ",
      fmt(halfLoss([[2, 1, 3]], [s.oldPrediction])),
      "; fresh-code half-loss ",
      fmt(halfLoss([[2, 1, 3]], [s.freshPrediction])),
      ", fresh amounts [",
      s.w.map(fmt).join(", "),
      "]. At h1 both coincide; historical statistics remain fixed throughout."
    ] })
  ] });
}
function TensorAddress() {
  return /* @__PURE__ */ jsxs5(Figure, { id: "D64", caption: "Named axes are observation i, feature j and time t. A complete rank-one tensor retains its zero feature plane. The declared j-major/t-minor unfolding uses column2j+t, so its inverse maps each cell back without loss.", children: [
    /* @__PURE__ */ jsxs5(Operation, { label: "Selected three-mode factor cells multiply into voxel (1,0,1)", children: [
      /* @__PURE__ */ jsx5(Matrix, { label: "Observation factor a_i \xB7 selected i1", values: [[1], [2]], rows: ["i0", "i1"], selected: [1, 0] }),
      /* @__PURE__ */ jsx5(Port, { label: "a1=2 \xD7 b0=1", symbol: "\xD7" }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Feature factor b_j \xB7 selected j0", values: [[1], [0]], rows: ["j0", "j1"], selected: [0, 0] }),
      /* @__PURE__ */ jsx5(Port, { label: "\xD7 c1=3", symbol: "\xD7" }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Time factor c_t \xB7 selected t1", values: [[1], [3]], rows: ["t0", "t1"], selected: [1, 0] }),
      /* @__PURE__ */ jsx5(Port, { label: "2\xD71\xD73=6 at (i1,j0,t1)" }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Tensor time t1 \xB7 i\xD7j slice", values: [[3, 0], [6, 0]], rows: ["i0", "i1"], columns: ["j0", "j1"], selected: [1, 0] })
    ] }),
    /* @__PURE__ */ jsxs5(Operation, { label: "Voxel address maps to the declared unfolding address", children: [
      /* @__PURE__ */ jsx5(Matrix, { label: "Selected voxel T[1,0,1]", values: [[6]] }),
      /* @__PURE__ */ jsx5(Port, { label: "row i=1; column2j+t=1" }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Unfolding \xB7 j-major/t-minor", values: [[1, 3, 0, 0], [2, 6, 0, 0]], rows: ["i0", "i1"], columns: ["j0t0", "j0t1", "j1t0", "j1t1"], selected: [1, 1] }),
      /* @__PURE__ */ jsx5(Port, { label: "inverse: j=floor(1/2)=0; t=1 mod2=1" }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Recovered address and value", values: [[1, 0, 1, 6]], columns: ["i", "j", "t", "T value"] })
    ] }),
    /* @__PURE__ */ jsx5(Matrix, { label: "Tensor time t0 \xB7 entire companion slice retained", values: [[1, 0], [2, 0]], rows: ["i0", "i1"], columns: ["j0", "j1"] }),
    /* @__PURE__ */ jsx5("p", { children: "The entire j1 feature plane remains zero, rather than disappearing." })
  ] });
}
function TensorAnatomy() {
  return /* @__PURE__ */ jsxs5(Figure, { id: "D65", caption: "CP rank1 and Tucker rank(1,1,1) with scalar core1 reconstruct the same rank-one example. A separate identity-factor core example isolates a single core interaction; it is a different anatomy example, without a fitted tensor optimizer.", children: [
    /* @__PURE__ */ jsxs5(Operation, { label: "CP rank1 connects one common component across three named modes", children: [
      /* @__PURE__ */ jsx5(Matrix, { label: "Observation mode factor a \xB7 i\xD7C0", values: [[1], [2]], rows: ["i0", "i1"], columns: ["C0"] }),
      /* @__PURE__ */ jsx5(Port, { label: "same CP component C0" }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Feature mode factor b \xB7 j\xD7C0", values: [[1], [0]], rows: ["j0", "j1"], columns: ["C0"] }),
      /* @__PURE__ */ jsx5(Port, { label: "outer product across i/j/t" }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Time mode factor c \xB7 t\xD7C0", values: [[1], [3]], rows: ["t0", "t1"], columns: ["C0"] }),
      /* @__PURE__ */ jsx5(Port, { label: "T_ijt = a_i b_j c_t" }),
      /* @__PURE__ */ jsxs5("div", { children: [
        /* @__PURE__ */ jsx5(Matrix, { label: "CP time0 slice", values: [[1, 0], [2, 0]], rows: ["i0", "i1"], columns: ["j0", "j1"] }),
        /* @__PURE__ */ jsx5(Matrix, { label: "CP time1 slice", values: [[3, 0], [6, 0]], rows: ["i0", "i1"], columns: ["j0", "j1"] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs5(Operation, { label: "Tucker scalar core connects three distinct latent mode ports", children: [
      /* @__PURE__ */ jsx5(Matrix, { label: "Core G000=1 \xB7 latent p0/q0/r0", values: [[1]] }),
      /* @__PURE__ */ jsx5(Port, { label: "p0 \u2192 observation a_i0; q0 \u2192 feature b_j0; r0 \u2192 time c_t0" }),
      /* @__PURE__ */ jsxs5("div", { children: [
        /* @__PURE__ */ jsx5(Matrix, { label: "Observation mode \xB7 i\xD7p0", values: [[1], [2]], columns: ["p0"], rows: ["i0", "i1"] }),
        /* @__PURE__ */ jsx5(Matrix, { label: "Feature mode \xB7 j\xD7q0", values: [[1], [0]], columns: ["q0"], rows: ["j0", "j1"] }),
        /* @__PURE__ */ jsx5(Matrix, { label: "Time mode \xB7 t\xD7r0", values: [[1], [3]], columns: ["r0"], rows: ["t0", "t1"] })
      ] }),
      /* @__PURE__ */ jsx5(Port, { label: "sum core-weighted mode products" }),
      /* @__PURE__ */ jsxs5("div", { children: [
        /* @__PURE__ */ jsx5(Matrix, { label: "CP and Tucker time0 slice \xB7 same product", values: [[1, 0], [2, 0]], rows: ["i0", "i1"], columns: ["j0", "j1"] }),
        /* @__PURE__ */ jsx5(Matrix, { label: "CP and Tucker time1 slice \xB7 same product", values: [[3, 0], [6, 0]], rows: ["i0", "i1"], columns: ["j0", "j1"] })
      ] })
    ] }),
    /* @__PURE__ */ jsx5("h4", { children: "Separate identity-factor core interaction \xB7 different example" }),
    /* @__PURE__ */ jsxs5(Operation, { label: "One core address connects through one cell in each identity mode factor", children: [
      /* @__PURE__ */ jsx5(Matrix, { label: "Core time r0 \xB7 sole G[0,1,0]=2", values: [[0, 2], [0, 0]], rows: ["p0", "p1"], columns: ["q0", "q1"], selected: [0, 1] }),
      /* @__PURE__ */ jsx5(Port, { label: "core value2 \xD7 three addressed factors" }),
      /* @__PURE__ */ jsxs5("div", { children: [
        /* @__PURE__ */ jsx5(Matrix, { label: "Observation factor \xB7 i\xD7p \xB7 use I[0,0]=1", values: [[1, 0], [0, 1]], rows: ["i0", "i1"], columns: ["p0", "p1"], selected: [0, 0] }),
        /* @__PURE__ */ jsx5(Matrix, { label: "Feature factor \xB7 j\xD7q \xB7 use I[1,1]=1", values: [[1, 0], [0, 1]], rows: ["j0", "j1"], columns: ["q0", "q1"], selected: [1, 1] }),
        /* @__PURE__ */ jsx5(Matrix, { label: "Time factor \xB7 t\xD7r \xB7 use I[0,0]=1", values: [[1, 0], [0, 1]], rows: ["t0", "t1"], columns: ["r0", "r1"], selected: [0, 0] })
      ] }),
      /* @__PURE__ */ jsx5(Port, { label: "2\xD71\xD71\xD71=2 at (i0,j1,t0)" }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Tensor time t0 \xB7 sole T[0,1,0]=2", values: [[0, 2], [0, 0]], rows: ["i0", "i1"], columns: ["j0", "j1"], selected: [0, 1] })
    ] }),
    /* @__PURE__ */ jsxs5(Panels, { children: [
      /* @__PURE__ */ jsx5(Matrix, { label: "Separate core time r1 slice \xB7 all zero", values: [[0, 0], [0, 0]], rows: ["p0", "p1"], columns: ["q0", "q1"] }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Separate tensor time t1 slice \xB7 all zero", values: [[0, 0], [0, 0]], rows: ["i0", "i1"], columns: ["j0", "j1"] })
    ] }),
    /* @__PURE__ */ jsx5("p", { children: "General core dimensions and cross-component interactions require their own decomposition scope." })
  ] });
}
function Phase() {
  return /* @__PURE__ */ jsx5(Figure, { id: "D66", caption: "These two finite DFT coefficient lists have identical magnitudes but opposite k1 phase. Under inverse normalization1/2 they produce opposite two-sample waveforms. Magnitude alone cannot select which original phase occurred; no audio experiment or STFT inversion is performed.", children: /* @__PURE__ */ jsxs5(Panels, { children: [
    /* @__PURE__ */ jsx5(Plot, { label: "k1 DFT coefficient \xB7 real/imaginary plane", xmin: -1, xmax: 1, ymin: -1, ymax: 1, xlabel: "Real", ylabel: "Imaginary", children: (map) => /* @__PURE__ */ jsxs5(Fragment3, { children: [
      /* @__PURE__ */ jsx5(Arrow, { from: map([0, 0]), to: map([1, 0]) }),
      /* @__PURE__ */ jsx5(Arrow, { from: map([0, 0]), to: map([-1, 0]), color: colors[1] }),
      /* @__PURE__ */ jsx5(Point, { at: map([1, 0]), label: "phase0" }),
      /* @__PURE__ */ jsx5(Point, { at: map([-1, 0]), label: "phase\u03C0", color: colors[1] })
    ] }) }),
    /* @__PURE__ */ jsx5(Matrix, { label: "Coefficients and common magnitudes", values: [[0, 1], [0, -1], [0, 1]], rows: ["DFT A", "DFT B", "Both magnitudes"], columns: ["k0", "k1"], signed: true, max: 1 }),
    /* @__PURE__ */ jsx5(Plot, { label: "Two literal inverse samples", xmax: 1, ymin: -0.5, ymax: 0.5, xlabel: "sample n", ylabel: "amplitude", children: (map) => /* @__PURE__ */ jsx5(Fragment3, { children: [[[0.5, -0.5], colors[0]], [[-0.5, 0.5], colors[1]]].map(([values, color], i) => /* @__PURE__ */ jsxs5("g", { children: [
      /* @__PURE__ */ jsx5("path", { d: `M${map([0, values[0]]).join(" ")}L${map([1, values[1]]).join(" ")}`, stroke: color, fill: "none", strokeDasharray: i ? "5 3" : void 0 }),
      values.map((v, n) => /* @__PURE__ */ jsx5("circle", { cx: map([n, v])[0], cy: map([n, v])[1], r: i ? 3 : 5, fill: color }, n))
    ] }, i)) }) }),
    /* @__PURE__ */ jsx5(Matrix, { label: "Exact inverse normalization1/2", values: [[0.5, -0.5], [-0.5, 0.5]], rows: ["Waveform A", "Waveform B"], columns: ["n0", "n1"], signed: true, max: 0.5 })
  ] }) });
}
export {
  Alternation,
  BetaPower,
  Caches,
  Centering,
  ClipFailure,
  Cone,
  CoordinateSlice,
  Counts,
  Cyclic,
  ExternalEvidence,
  FilledZeros,
  FrozenIDF,
  HistoricalMU,
  Joint,
  KKT,
  Majorizer,
  MaskGram,
  NoInformation,
  OnlineStatistics,
  PSD,
  PairedSigns,
  Penalty,
  Phase,
  PublicAnatomy,
  Publication,
  Ratio,
  Retention,
  SameBlock,
  ScalePenalty,
  Shear,
  SignedTriplet,
  SpectralConstraints,
  StaleStatistics,
  Stationarity,
  Storage,
  TensorAddress,
  TensorAnatomy,
  WordCounts,
  ZeroLock
};
