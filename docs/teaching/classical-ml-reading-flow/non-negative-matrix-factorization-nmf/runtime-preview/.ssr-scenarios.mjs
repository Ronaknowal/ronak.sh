// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/.ssr-scenario-state.mjs
import React from "react";
function scenarioState(initial) {
  const scenario = globalThis.__nmfScenario;
  const i = scenario.index++;
  return React.useState(i < scenario.values.length ? scenario.values[i] : initial);
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/NmfFigures.jsx
import React9 from "react";

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/ArrayFigures.jsx
import React3, { useState } from "react";

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/Drawing.jsx
import React2, { useId } from "react";

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/nmf-model.js
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
var norm2 = (a) => dot(a, a);
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
var normalizedRows = [[1, 0], [0, 1], [0.75, 0.25], [0.25, 0.75]];
function anchorStep(rows, ids, k) {
  const active = rows.map((r, i) => ({
    id: ids[i],
    original: r,
    amount: r.reduce((s, v) => s + v, 0)
  })).filter((r) => r.amount > 0).map((r) => ({
    ...r,
    unit: r.original.map((v) => v / r.amount)
  }));
  let residuals = active.map((r) => r.unit.slice());
  const chosen = [], states = [residuals.map((r) => r.slice())];
  for (let step = 0; step < k; step++) {
    const order = active.map((r, i) => ({
      i,
      norm: norm2(residuals[i]),
      originalNorm: norm2(r.unit),
      id: r.id
    })).sort((a, b) => b.norm - a.norm || b.originalNorm - a.originalNorm || a.id - b.id);
    const pick = order[0];
    if (!pick || pick.norm < 1e-20) throw Error("Requested independent direction is unsupported.");
    const direction = residuals[pick.i].map((v) => v / Math.sqrt(pick.norm));
    chosen.push(pick.id);
    residuals = residuals.map((r) => r.map((v, j) => v - dot(r, direction) * direction[j]));
    states.push(residuals.map((r) => r.slice()));
  }
  return {
    active,
    chosen,
    states
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

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/Drawing.jsx
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
  signed = false,
  max = 4
}) {
  return /* @__PURE__ */ jsxs("div", { className: "nmf-array", children: [
    /* @__PURE__ */ jsx("p", { className: "nmf-object-label", children: label }),
    /* @__PURE__ */ jsx("div", { className: "nmf-array-scroll", tabIndex: 0, role: "region", "aria-label": `${label}; complete labelled array, scroll horizontally when needed`, children: /* @__PURE__ */ jsxs("table", { children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { scope: "col", "aria-label": "Row identity" }),
        values[0].map((_, j) => /* @__PURE__ */ jsx("th", { scope: "col", children: columns?.[j] ?? `F${j}` }, j))
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: values.map((r, i) => /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { scope: "row", children: rows?.[i] ?? `R${i}` }),
        r.map((v, j) => /* @__PURE__ */ jsx("td", { "data-missing": typeof v === "string" && /missing|not observed|excluded/.test(v) ? "" : void 0, "data-selected": selected?.[0] === i && selected?.[1] === j ? "" : void 0, style: {
          background: typeof v === "number" ? `color-mix(in srgb, ${signed ? v < 0 ? "#ee8faf" : "#7bb7ff" : color ?? (componentRows || rows?.every((r2) => /^C\d$/.test(r2)) ? colors[i % 8] : componentColumns || columns?.every((c) => /^C\d$/.test(c)) ? colors[j % 8] : "#9ca7b5")} ${Math.min(75, Math.abs(v) / max * 65)}%, transparent)` : void 0
        }, children: fmt(v) }, j))
      ] }, i)) })
    ] }) })
  ] });
}
function Table({
  caption,
  headers,
  rows
}) {
  const id = useId();
  return /* @__PURE__ */ jsxs("div", { className: "nmf-table-wrapper", children: [
    /* @__PURE__ */ jsx("p", { id, className: "nmf-object-label", children: caption }),
    /* @__PURE__ */ jsx("div", { className: "nmf-table", tabIndex: 0, role: "region", "aria-label": `${caption}; scroll table horizontally when needed`, children: /* @__PURE__ */ jsxs("table", { "aria-labelledby": id, children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: headers.map((h, i) => /* @__PURE__ */ jsx("th", { scope: "col", children: h }, i)) }) }),
      /* @__PURE__ */ jsx("tbody", { children: rows.map((r, i) => /* @__PURE__ */ jsx("tr", { children: r.map((v, j) => /* @__PURE__ */ jsx("td", { children: v }, j)) }, i)) })
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
  children
}) {
  const map = ([x, y]) => [60 + (x - xmin) / (xmax - xmin) * 210, 250 - (y - ymin) / (ymax - ymin) * 210];
  return /* @__PURE__ */ jsxs("div", { className: "nmf-plot", children: [
    /* @__PURE__ */ jsx("p", { className: "nmf-object-label", children: label }),
    /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 300 282", role: "img", "aria-label": `${label}; ${xlabel} horizontal ${xmin}\u2013${xmax}, ${ylabel} vertical ${ymin}\u2013${ymax}`, children: [
      /* @__PURE__ */ jsx("path", { d: "M60 25V250H280", fill: "none", stroke: "currentColor", opacity: ".6" }),
      [0, 0.25, 0.5, 0.75, 1].map((t) => /* @__PURE__ */ jsxs("g", { children: [
        /* @__PURE__ */ jsx("path", { d: `M55 ${250 - t * 210}h5`, stroke: "currentColor" }),
        /* @__PURE__ */ jsx("text", { x: 51, y: 255 - t * 210, textAnchor: "end", children: fmt(ymin + t * (ymax - ymin)) })
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
      "."
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
function Select({
  label,
  value,
  onChange,
  options
}) {
  const id = useId();
  return /* @__PURE__ */ jsxs("label", { htmlFor: id, children: [
    label,
    /* @__PURE__ */ jsx("select", { id, value, onChange: (e) => onChange(e.target.value), children: options.map((o) => /* @__PURE__ */ jsx("option", { value: o.value ?? o, children: o.label ?? o }, o.value ?? o)) })
  ] });
}
function Result({
  children
}) {
  return /* @__PURE__ */ jsx("p", { className: "nmf-current", "aria-live": "polite", "aria-atomic": "true", children });
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/ArrayFigures.jsx
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function Observation() {
  return /* @__PURE__ */ jsx2(Figure, { id: "D01", caption: "R0 is one measured observation. Its three bins share the same0\u20134 intensity ruler; the row identity is not a feature.", children: /* @__PURE__ */ jsx2(Bars, { label: "R0 \xB7 measured intensity", values: X0[0] }) });
}
function Addends() {
  const [a, setA] = scenarioState(2), [b, setB] = scenarioState(1), parts = [[a, 0, a], [0, b, b]], prediction = [a, b, a + b];
  return /* @__PURE__ */ jsxs2(Figure, { id: "D02", caption: "Amounts multiply entire patterns. Matching feature bins then add; neither amount is normalized into a probability.", children: [
    /* @__PURE__ */ jsxs2(Panels, { children: [
      /* @__PURE__ */ jsx2(Matrix, { label: "Fixed H \xB7 component \xD7 feature", values: H0, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx2(Bars, { label: `C0 contribution \xB7 ${fmt(a)} \xD7 H[C0]`, values: parts[0], max: 6, color: colors[0] }),
      /* @__PURE__ */ jsx2(Bars, { label: `C1 contribution \xB7 ${fmt(b)} \xD7 H[C1]`, values: parts[1], max: 6, color: colors[1] }),
      /* @__PURE__ */ jsx2(Bars, { label: "Their sum \xB7 reconstructed R0", values: prediction, max: 6 })
    ] }),
    /* @__PURE__ */ jsxs2(Controls, { onReset: () => {
      setA(2);
      setB(1);
    }, children: [
      /* @__PURE__ */ jsx2(Range, { label: "C0 amount", value: a, onChange: setA, max: 3 }),
      /* @__PURE__ */ jsx2(Range, { label: "C1 amount", value: b, onChange: setB, max: 3 })
    ] }),
    /* @__PURE__ */ jsxs2(Result, { children: [
      fmt(a),
      "[1,0,1] + ",
      fmt(b),
      "[0,1,1] = [",
      prediction.map(fmt).join(", "),
      "]."
    ] })
  ] });
}
function Shapes() {
  return /* @__PURE__ */ jsx2(Figure, { id: "D03", caption: "R1/F2 contracts the component dimension: W[R1,C0]H[C0,F2]+W[R1,C1]H[C1,F2]=1\xD71+3\xD71=4. R/C/F IDs are zero-based.", children: /* @__PURE__ */ jsxs2(Panels, { children: [
    /* @__PURE__ */ jsx2(Matrix, { label: "W \xB7 3 observations \xD7 2 components", values: W0, columns: ["C0", "C1"], componentColumns: true, selected: [1, 1] }),
    /* @__PURE__ */ jsx2(Matrix, { label: "H \xB7 2 components \xD7 3 features", values: H0, rows: ["C0", "C1"], componentRows: true, selected: [1, 2] }),
    /* @__PURE__ */ jsx2(Matrix, { label: "WH = X0 \xB7 3 \xD7 3", values: X0, selected: [1, 2] })
  ] }) });
}
function OuterProducts() {
  return /* @__PURE__ */ jsx2(Figure, { id: "D04", caption: "Each component contributes a complete row-by-feature outer product. A zero amount removes a row; a zero pattern bin removes a column. Cell size does not encode magnitude.", children: /* @__PURE__ */ jsxs2(Panels, { children: [
    [0, 1].map((c) => /* @__PURE__ */ jsx2(Matrix, { label: `W[:,C${c}] \xD7 H[C${c},:]`, values: W0.map((w) => H0[c].map((h) => w[c] * h)), color: colors[c] }, c)),
    /* @__PURE__ */ jsx2(Matrix, { label: "Sum of both outer products = X0", values: X0 })
  ] }) });
}
function AmountFraction() {
  return /* @__PURE__ */ jsx2(Figure, { id: "D05", caption: "Dividing amounts by their total3 changes this product. Fractions sum1; measured amounts do not carry that constraint.", children: /* @__PURE__ */ jsxs2(Panels, { children: [
    /* @__PURE__ */ jsx2(Bars, { label: "Original amounts \xB7 amount units", values: [2, 1], ids: ["C0", "C1"], component: true, max: 3 }),
    /* @__PURE__ */ jsx2(Bars, { label: "Fractions \xB7 dimensionless", values: [2 / 3, 1 / 3], ids: ["C0", "C1"], component: true, max: 1 }),
    /* @__PURE__ */ jsx2(Matrix, { label: "Original reconstruction", values: [[2, 1, 3]] }),
    /* @__PURE__ */ jsx2(Matrix, { label: "Reconstruction using fractions with unchanged H", values: [[2 / 3, 1 / 3, 1]] })
  ] }) });
}
function Compensation() {
  const [s, setS] = scenarioState(1), w = W0.map((r) => [r[0] / s, r[1]]), h = [H0[0].map((v) => v * s), H0[1]];
  return /* @__PURE__ */ jsxs2(Figure, { id: "D06", caption: "The pattern and amount use reciprocal units. Every complete contribution and the product remain unchanged; s=0 cannot be inverted.", children: [
    /* @__PURE__ */ jsxs2(Panels, { children: [
      /* @__PURE__ */ jsx2(Matrix, { label: "Original W", values: W0, columns: ["C0", "C1"], componentColumns: true }),
      /* @__PURE__ */ jsx2(Matrix, { label: "Original H", values: H0, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx2(Matrix, { label: "Compensated W", values: w, columns: ["C0", "C1"], componentColumns: true }),
      /* @__PURE__ */ jsx2(Matrix, { label: "Rescaled H", values: h, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx2(Matrix, { label: "Current product \xB7 unchanged X0", values: matmul(w, h) })
    ] }),
    /* @__PURE__ */ jsx2(Controls, { onReset: () => setS(1), children: /* @__PURE__ */ jsx2(Range, { label: "C0 pattern scale s", value: s, onChange: setS, min: 0.5, max: 3 }) }),
    /* @__PURE__ */ jsxs2(Result, { children: [
      "R0 C0 amount ",
      fmt(2 / s),
      ", pattern [",
      h[0].map(fmt).join(", "),
      "], contribution [2,0,2]. Scale0 is outside this invertible operation."
    ] })
  ] });
}
function ContributionRanking() {
  const [s, setS] = scenarioState(1);
  return /* @__PURE__ */ jsxs2(Figure, { id: "D08", caption: "A coefficient ranking can reverse under a harmless unit change. Total contributed intensity is unchanged, and still does not establish a physical cause.", children: [
    /* @__PURE__ */ jsxs2(Panels, { children: [
      /* @__PURE__ */ jsx2(Bars, { label: "Amounts \xB7 current factor units", values: [2 / s, 1], ids: ["C0", "C1"], component: true, max: 4 }),
      /* @__PURE__ */ jsx2(Bars, { label: "Total contributed intensity", values: [4, 2], ids: ["C0", "C1"], component: true, max: 4 })
    ] }),
    /* @__PURE__ */ jsx2(Controls, { onReset: () => setS(1), children: /* @__PURE__ */ jsx2(Range, { label: "C0 pattern scale s", value: s, onChange: setS, min: 0.5, max: 3 }) }),
    /* @__PURE__ */ jsxs2(Result, { children: [
      "Amounts [",
      fmt(2 / s),
      ",1]; contributions [4,2]. Largest raw amount: ",
      2 / s >= 1 ? "C0" : "C1",
      s === 2 ? " (tie)" : "",
      "."
    ] })
  ] });
}
function Residual() {
  const [a, setA] = scenarioState(1), prediction = [a, 1, a + 1], residual = X0[0].map((v, j) => v - prediction[j]);
  return /* @__PURE__ */ jsxs2(Figure, { id: "D09", caption: "Residual means observed minus reconstructed. Blue positive bins need reconstructed mass; rose negative bins have excess. Factor amounts remain nonnegative.", children: [
    /* @__PURE__ */ jsxs2(Panels, { children: [
      /* @__PURE__ */ jsx2(Bars, { label: "Observed R0", values: X0[0], max: 4 }),
      /* @__PURE__ */ jsx2(Bars, { label: "Current prediction", values: prediction, max: 4 }),
      /* @__PURE__ */ jsx2(Bars, { label: "Signed residual \xB7 separate \u22123\u20263 ruler", values: residual, max: 3, signed: true })
    ] }),
    /* @__PURE__ */ jsx2(Controls, { onReset: () => setA(1), children: /* @__PURE__ */ jsx2(Range, { label: "C0 amount; C1 fixed1", value: a, onChange: setA, max: 3 }) }),
    /* @__PURE__ */ jsxs2(Result, { children: [
      "Prediction [",
      prediction.map(fmt).join(", "),
      "]; residual [",
      residual.map(fmt).join(", "),
      "]. At amount2 every residual is zero."
    ] })
  ] });
}
function SquaredCells() {
  return /* @__PURE__ */ jsx2(Figure, { id: "D10", caption: "R1\u2212[1,1,2]=[0,2,2]. The nonzero residual side lengths2 become square areas4 each: half-loss4. Whole-table initial squared residual norm12 gives half-loss6 and MSE12/9.", children: /* @__PURE__ */ jsxs2(Panels, { children: [
    /* @__PURE__ */ jsx2(Matrix, { label: "Observed, predicted, signed residual", rows: ["R1", "Prediction", "Residual"], values: [[1, 3, 4], [1, 1, 2], [0, 2, 2]] }),
    /* @__PURE__ */ jsxs2("div", { className: "nmf-plot", children: [
      /* @__PURE__ */ jsx2("p", { className: "nmf-object-label", children: "Residual squares \xB7 squared intensity units" }),
      /* @__PURE__ */ jsxs2("svg", { viewBox: "0 0 300 150", role: "img", "aria-label": "F0 square area0; F1 and F2 squares side2 area4 each", children: [
        /* @__PURE__ */ jsx2("text", { x: "15", y: "30", children: "F0: area0" }),
        [110, 210].map((x, i) => /* @__PURE__ */ jsxs2("g", { children: [
          /* @__PURE__ */ jsx2("rect", { x, y: "48", width: "70", height: "70", fill: colors[0], opacity: ".5" }),
          /* @__PURE__ */ jsxs2("text", { x, y: "30", children: [
            "F",
            i + 1,
            ": area4"
          ] }),
          /* @__PURE__ */ jsx2("text", { x: x + 10, y: "140", children: "side2" })
        ] }, x))
      ] })
    ] })
  ] }) });
}
function Missing() {
  const [x, setX] = scenarioState(2);
  return /* @__PURE__ */ jsxs2(Figure, { id: "D11", caption: "An omitted measurement is no information, rather than an observed0. Included loss0 does not assess the missing bin.", children: [
    /* @__PURE__ */ jsxs2(Panels, { children: [
      /* @__PURE__ */ jsx2(Matrix, { label: "Measured zero \xB7 both cells observed", rows: ["Observation", "Prediction"], values: [[x, 0], [x / 2, x / 2]] }),
      /* @__PURE__ */ jsx2(Matrix, { label: "Omitted second bin \xB7 mask[1,0]", rows: ["Observation", "Prediction"], values: [[x, "missing"], [x, x]] })
    ] }),
    /* @__PURE__ */ jsx2(Controls, { onReset: () => setX(2), children: /* @__PURE__ */ jsx2(Range, { label: "First measured value", value: x, onChange: setX, max: 4 }) }),
    /* @__PURE__ */ jsxs2(Result, { children: [
      "H=[1,1]. Measured-zero optimum amount ",
      fmt(x / 2),
      ", half-loss ",
      fmt(x * x / 4),
      ". Omitted-bin optimum amount ",
      fmt(x),
      ", included half-loss0; missing-bin quality unknown."
    ] })
  ] });
}
function LossDomains() {
  const [x, setX] = scenarioState(2);
  return /* @__PURE__ */ jsxs2(Figure, { id: "D12", caption: "These scalar objectives measure different disagreements. All live values are positive. KL(0,y)=y; positive observation with y=0 has infinite KL. IS excludes observed0.", children: [
    /* @__PURE__ */ jsx2(Panels, { children: [[2, "Half squared error"], [1, "Generalized KL"], [0, "Itakura\u2013Saito"]].map(([beta, label]) => /* @__PURE__ */ jsx2(Plot, { label, xmin: 0.5, xmax: 4, ymax: 8, xlabel: "prediction y", ylabel: "entrywise cost", children: (map) => /* @__PURE__ */ jsxs2(Fragment, { children: [
      /* @__PURE__ */ jsx2(Curve, { map, xmin: 0.5, xmax: 4, fn: (y) => divergence(x, y, beta) }),
      /* @__PURE__ */ jsx2("circle", { cx: map([x, 0])[0], cy: map([x, 0])[1], r: "5", fill: colors[1] })
    ] }) }, beta)) }),
    /* @__PURE__ */ jsx2(Controls, { onReset: () => setX(2), children: /* @__PURE__ */ jsx2(Range, { label: "Observed x", value: x, onChange: setX, min: 0.5, max: 4 }) }),
    /* @__PURE__ */ jsxs2(Result, { children: [
      "At y1: squared ",
      fmt(divergence(x, 1, 2)),
      ", KL ",
      fmt(divergence(x, 1, 1)),
      ", IS ",
      fmt(divergence(x, 1, 0)),
      ". At y3: ",
      fmt(divergence(x, 3, 2)),
      ", ",
      fmt(divergence(x, 3, 1)),
      ", ",
      fmt(divergence(x, 3, 0)),
      ". Each cost is zero at y=",
      fmt(x),
      "."
    ] })
  ] });
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/GeometryFigures.jsx
import React4, { useState as useState2 } from "react";
import { Fragment as Fragment2, jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function Shear() {
  const [t, setT] = scenarioState(0.5), s = shear(t);
  return /* @__PURE__ */ jsxs3(Figure, { id: "D07", caption: "This separate supplied dictionary Hs permits a shear beyond scale or permutation. The plot shows its F0/F1 projection; the complete three-feature cells retain F2.", children: [
    /* @__PURE__ */ jsxs3(Panels, { children: [
      /* @__PURE__ */ jsx3(Matrix, { label: "Original Hs", values: [[1, 1, 1], [0, 1, 1]], rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx3(Matrix, { label: "Changed Hs", values: s.h, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx3(Matrix, { label: "Changed amounts", values: s.w, columns: ["C0", "C1"], componentColumns: true }),
      /* @__PURE__ */ jsx3(Matrix, { label: "Both products", values: [[2, 3, 3], ...matmul(s.w, s.h)], rows: ["Before", "After"] }),
      /* @__PURE__ */ jsx3(Plot, { label: "Pattern direction changes \xB7 projected rays", xmax: 2, ymax: 2, children: (map) => /* @__PURE__ */ jsxs3(Fragment2, { children: [
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
  return /* @__PURE__ */ jsx3(Plot, { label: "Fixed Hc \xB7 attainable cone and query", xmax: 2, ymax: 2, children: (map) => /* @__PURE__ */ jsxs3(Fragment2, { children: [
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
      /* @__PURE__ */ jsx3(Plot, { label: "Amount plane \xB7 feasible first quadrant", xmin: -1.5, xmax: 1.5, ymax: 1.5, xlabel: "C0 amount", ylabel: "C1 amount", children: (map) => /* @__PURE__ */ jsxs3(Fragment2, { children: [
        /* @__PURE__ */ jsx3("polygon", { points: [[0, 0], [1.5, 0], [1.5, 1.5], [0, 1.5]].map((p) => map(p).join(",")).join(" "), fill: colors[0], opacity: ".1" }),
        /* @__PURE__ */ jsx3(Point, { at: map([-1, 1]), label: "LS", open: true }),
        /* @__PURE__ */ jsx3(Point, { at: map([0, 1]), label: "clip", color: colors[1] }),
        /* @__PURE__ */ jsx3(Point, { at: map([0, 0.5]), label: "NNLS", color: "#f2c276" })
      ] }) }),
      /* @__PURE__ */ jsx3(Plot, { label: "Observation plane \xB7 three predictions", xmax: 1.5, ymax: 1.5, children: (map) => /* @__PURE__ */ jsxs3(Fragment2, { children: [
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
      /* @__PURE__ */ jsx3(Plot, { label: "Coordinate half-loss", xmax: 3, ymax: 7, xlabel: "C0 amount a", ylabel: "half-loss", children: (map) => /* @__PURE__ */ jsxs3(Fragment2, { children: [
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
  return /* @__PURE__ */ jsx3(Figure, { id: "D17", caption: "G contracts feature bins into component pairs, while P contracts each observed row with each pattern. G01=1\xD70+0\xD71+1\xD71=1; P[R1,C1]=1\xD70+3\xD71+4\xD71=7.", children: /* @__PURE__ */ jsxs3(Panels, { children: [
    /* @__PURE__ */ jsx3(Matrix, { label: "H \xB7 fixed during this block", values: H0, rows: ["C0", "C1"], componentRows: true }),
    /* @__PURE__ */ jsx3(Matrix, { label: "G = H H\u1D40 \xB7 component \xD7 component", values: matmul(H0, transpose(H0)), rows: ["C0", "C1"], columns: ["C0", "C1"], selected: [0, 1] }),
    /* @__PURE__ */ jsx3(Matrix, { label: "P = X0 H\u1D40 \xB7 row \xD7 component", values: matmul(X0, transpose(H0)), columns: ["C0", "C1"], selected: [1, 1] })
  ] }) });
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
      /* @__PURE__ */ jsx3(Plot, { label: "Feasible C0 motion and improving C1 direction", xmax: 1, ymax: 1, xlabel: "C0 amount", ylabel: "C1 amount", children: (map) => /* @__PURE__ */ jsxs3(Fragment2, { children: [
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
  const [step, setStep] = scenarioState(0), s = cdSweep(X0, onesW, H0), w = step === 0 ? onesW : s.w, h = step < 2 ? H0 : s.h, prediction = matmul(w, h);
  return /* @__PURE__ */ jsxs3(Figure, { id: "D20", caption: "This complete CD sweep changes W first, then changes H using the new W. Its operand order differs from the historical H-first multiplicative route.", children: [
    /* @__PURE__ */ jsxs3(Panels, { children: [
      /* @__PURE__ */ jsx3(Matrix, { label: step === 0 ? "W start" : "New W \xB7 supplied to H block", values: w, columns: ["C0", "C1"], componentColumns: true }),
      /* @__PURE__ */ jsx3(Matrix, { label: step < 2 ? "H0 \xB7 fixed for W block" : "New H \xB7 from new W", values: h, rows: ["C0", "C1"], componentRows: true }),
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
    /* @__PURE__ */ jsx3(Plot, { label: "Factor plane \xB7 wh=1", xmax: 2.5, ymax: 2, xlabel: "w", ylabel: "h", children: (map) => /* @__PURE__ */ jsxs3(Fragment2, { children: [
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
      /* @__PURE__ */ jsx3(Plot, { label: "Exact scalar objective", xmax: 1, ymax: 0.5, xlabel: "w", ylabel: "half-loss", children: (map) => /* @__PURE__ */ jsxs3(Fragment2, { children: [
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
    /* @__PURE__ */ jsxs3(Panels, { children: [
      /* @__PURE__ */ jsx3(Matrix, { label: "Input X \xB7 nd=9 cells", values: X0 }),
      /* @__PURE__ */ jsx3(Matrix, { label: "Returned training W \xB7 nk=6", values: W0, columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx3(Matrix, { label: "Retained fitted H \xB7 kd=6", values: H0, rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx3(Matrix, { label: "Workspace G \xB7 k\xB2=4", values: matmul(H0, transpose(H0)), columns: ["C0", "C1"], rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx3(Matrix, { label: "Workspace P \xB7 nk=6", values: matmul(X0, transpose(H0)), columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx3(Matrix, { label: "One diagnostic row block \xB7 bd=3", values: [X0[0]] })
    ] }),
    /* @__PURE__ */ jsx3("p", { children: "Cache construction O(ndk+(n+d)k\xB2); q cyclic sweeps O(q(n+d)k\xB2); reconstruction diagnostics O(ndk). Transient caches O(k\xB2+max(nk,kd)), plus block diagnostics and explicitly retained history." })
  ] });
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/OptimizationFigures.jsx
import React5, { useState as useState3 } from "react";
import { Fragment as Fragment3, jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function Ratio() {
  const s = muSweep(X0, onesW, H0);
  return /* @__PURE__ */ jsx4(Figure, { id: "D24", caption: "Each elementwise ratio multiplies the old H cell. The selected C0/F2 cell is1\xD79/6=1.5; an old zero remains zero. No matrix inverse is involved.", children: /* @__PURE__ */ jsxs4(Panels, { children: [
    /* @__PURE__ */ jsx4(Matrix, { label: "Old H", values: H0, rows: ["C0", "C1"], componentRows: true, selected: [0, 2] }),
    /* @__PURE__ */ jsx4(Matrix, { label: "Numerator W\u1D40 X", values: s.hn, rows: ["C0", "C1"], selected: [0, 2] }),
    /* @__PURE__ */ jsx4(Matrix, { label: "Denominator W\u1D40 W H", values: s.hd, rows: ["C0", "C1"], selected: [0, 2] }),
    /* @__PURE__ */ jsx4(Matrix, { label: "New H", values: s.h, rows: ["C0", "C1"], componentRows: true, selected: [0, 2] })
  ] }) });
}
function HistoricalMU() {
  const [step, setStep] = scenarioState(0), x = [[2, 1, 3], [1, 2, 3], [3, 3, 6]], w0 = [[1, 0.5], [0.5, 1], [1, 1]], h0 = [[1, 0.2, 0.8], [0.2, 1, 0.8]], s = muSweep(x, w0, h0), w = step < 2 ? w0 : s.w, h = step === 0 ? h0 : s.h;
  return /* @__PURE__ */ jsxs4(Figure, { id: "D25", caption: "This direct one-step calculation uses the original supplied operands. H updates first; its new values feed W's Gram/cross products. It does not rerun the preserved forty-sweep program.", children: [
    /* @__PURE__ */ jsxs4(Panels, { children: [
      /* @__PURE__ */ jsx4(Matrix, { label: step < 2 ? "Original W" : "New W from new H", values: w, columns: ["C0", "C1"], componentColumns: true }),
      /* @__PURE__ */ jsx4(Matrix, { label: step === 0 ? "Original H" : "New H \xB7 W block operand", values: h, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Current prediction", values: matmul(w, h) }),
      step > 0 && /* @__PURE__ */ jsxs4(Fragment3, { children: [
        /* @__PURE__ */ jsx4(Matrix, { label: "New H H\u1D40 \xB7 W denominator cache", values: matmul(s.h, transpose(s.h)), rows: ["C0", "C1"], columns: ["C0", "C1"] }),
        /* @__PURE__ */ jsx4(Matrix, { label: "X new H\u1D40 \xB7 W numerator", values: s.wn, columns: ["C0", "C1"] })
      ] })
    ] }),
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
  const [a, setA] = scenarioState(1), f = (z2) => (z2 - 2) ** 2, q = (z2) => (a - 2) ** 2 + (2 * a - 4) * (z2 - a) + 0.5 * (2 + 1 / a) * (z2 - a) ** 2, z = 5 * a / (2 * a + 1);
  return /* @__PURE__ */ jsxs4(Figure, { id: "D28", caption: "The two exact curves touch at a. Their difference (z\u2212a)\xB2/(2a) is nonnegative; minimizing the upper curve gives a safe restricted-coordinate step, rather than a universal beta proof.", children: [
    /* @__PURE__ */ jsx4(Plot, { label: "Touching objective and auxiliary", xmax: 3, ymax: 18, xlabel: "candidate z", ylabel: "cost", children: (map) => /* @__PURE__ */ jsxs4(Fragment3, { children: [
      /* @__PURE__ */ jsx4(Curve, { map, xmax: 3, fn: f }),
      /* @__PURE__ */ jsx4(Curve, { map, xmax: 3, fn: q, color: colors[1] }),
      /* @__PURE__ */ jsx4(Point, { at: map([a, f(a)]), label: "touch", open: true }),
      /* @__PURE__ */ jsx4(Point, { at: map([z, q(z)]), color: colors[1] }),
      /* @__PURE__ */ jsx4(Point, { at: map([z, f(z)]), diamond: true, open: true, color: "#f2c276" })
    ] }) }),
    /* @__PURE__ */ jsx4(Controls, { onReset: () => setA(1), children: /* @__PURE__ */ jsx4(Range, { label: "Current positive coordinate a", value: a, onChange: setA, min: 0.25, max: 2, step: 0.25 }) }),
    /* @__PURE__ */ jsxs4(Result, { children: [
      "Blue f, rose q; blue open circle is the touching point, rose circle is q minimum, amber diamond is the resulting f value. At a2 all three coincide at the fixed point. New z=",
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
    /* @__PURE__ */ jsxs4(Panels, { children: [
      /* @__PURE__ */ jsx4(Bars, { label: "Updated coordinate \xB7 old coordinate1", values: [4, next], ids: ["Heuristic", "MM"], max: 4 }),
      /* @__PURE__ */ jsx4(Plot, { label: "Convex t\xB2 \xB7 Jensen chord", xmax: 6, ymax: 36, xlabel: "t", ylabel: "\u03C6(t)", children: (map) => /* @__PURE__ */ jsxs4(Fragment3, { children: [
        /* @__PURE__ */ jsx4(Curve, { map, xmax: 6, fn: (t) => t * t }),
        /* @__PURE__ */ jsx4("path", { d: `M${map([2, 4]).join(" ")}L${map([6, 36]).join(" ")}`, stroke: colors[1], strokeWidth: "2" }),
        /* @__PURE__ */ jsx4(Point, { at: map([5, 25]), label: "\u03C6(mean)" }),
        /* @__PURE__ */ jsx4(Point, { at: map([5, 28]), label: "chord", color: colors[1] })
      ] }) }),
      /* @__PURE__ */ jsx4(Plot, { label: "Concave log \xB7 tangent at4", xmin: 1, xmax: 6, ymin: 0, ymax: 2, xlabel: "t", ylabel: "log(t)", children: (map) => /* @__PURE__ */ jsxs4(Fragment3, { children: [
        /* @__PURE__ */ jsx4(Curve, { map, xmin: 1, xmax: 6, fn: Math.log }),
        /* @__PURE__ */ jsx4(Curve, { map, xmin: 1, xmax: 6, fn: (t) => Math.log(4) + (t - 4) / 4, color: colors[1] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx4(Controls, { onReset: () => setB(0), children: /* @__PURE__ */ jsx4(Range, { label: "Beta", value: b, onChange: setB, max: 3, step: 0.1 }) }),
    /* @__PURE__ */ jsxs4(Result, { children: [
      "gamma=",
      fmt(g),
      ", MM1\xD74^gamma=",
      fmt(next),
      " versus heuristic4. Jensen shares.25/.75: mean5, \u03C6(mean)25, weighted heights28, gap3. Log tangent is an upper bound."
    ] })
  ] });
}
function Centering() {
  return /* @__PURE__ */ jsx4(Figure, { id: "D31", caption: "Subtracting means[1,2,3] introduces signed entries. NMF initialization uses the uncentred nonnegative input, rather than silently importing PCA's centred fitted model.", children: /* @__PURE__ */ jsxs4(Panels, { children: [
    /* @__PURE__ */ jsx4(Matrix, { label: "Original X0", values: X0 }),
    /* @__PURE__ */ jsx4(Matrix, { label: "Column means", values: [[1, 2, 3]], rows: ["Mean"] }),
    /* @__PURE__ */ jsx4(Matrix, { label: "X0 \u2212 means \xB7 signed", values: [[1, -1, 0], [0, 1, 1], [-1, 0, -1]], signed: true })
  ] }) });
}
function SignedTriplet() {
  return /* @__PURE__ */ jsx4(Figure, { id: "D32", caption: "The known supplied Xt has a signed second singular term. Its positive part has two disjoint support rectangles; retaining one positive rank-one rectangle requires a paired-sign choice.", children: /* @__PURE__ */ jsxs4(Panels, { children: [
    /* @__PURE__ */ jsx4(Matrix, { label: "Xt \xB7 known supplied matrix", values: [[8.2, 2.4], [2.4, 6.8]], max: 10 }),
    /* @__PURE__ */ jsx4(Matrix, { label: "First term \xB7 \u03C310 u=v[.8,.6]", values: [[6.4, 4.8], [4.8, 3.6]], max: 10 }),
    /* @__PURE__ */ jsx4(Matrix, { label: "Second term \xB7 \u03C35 u=v[.6,\u2212.8]", values: [[1.8, -2.4], [-2.4, 3.2]], signed: true, max: 4 }),
    /* @__PURE__ */ jsx4(Matrix, { label: "Positive part \xB7 two diagonal rectangles", values: [[1.8, 0], [0, 3.2]] })
  ] }) });
}
function PairedSigns() {
  const [a, setA] = scenarioState(0.6), s = signPair(a);
  return /* @__PURE__ */ jsxs4(Figure, { id: "D33", caption: "Compare the products of paired sign-part norms before selecting and normalizing. Both candidates stay visible. Editing u gives a supplied triplet illustration, not another SVD of the original Xt.", children: [
    /* @__PURE__ */ jsxs4(Panels, { children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Current supplied singular vectors", values: [s.u, s.v], rows: ["u", "v"], columns: ["entry0", "entry1"], signed: true, max: 1 }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Positive-pair candidate \xB7 \u03C35", values: [[5 * s.positive, 0], [0, 0]] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Negative-pair candidate \xB7 \u03C35", values: [[0, 0], [0, 5 * s.negative]] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Selected nonnegative rank-one term", values: s.term })
    ] }),
    /* @__PURE__ */ jsx4(Controls, { onReset: () => setA(0.6), children: /* @__PURE__ */ jsx4(Range, { label: "u positive entry a", value: a, onChange: setA, max: 1, step: 0.1 }) }),
    /* @__PURE__ */ jsxs4(Result, { children: [
      "Norm products positive ",
      fmt(s.positive),
      ", negative ",
      fmt(s.negative),
      "; ",
      s.choosePositive ? "positive" : "negative",
      " pair selected. At a.8 the declared positive-pair tie applies. Zero-norm endpoints are never divided."
    ] })
  ] });
}
function FilledZeros() {
  const [d, setD] = scenarioState(0), x = [[8.2, 2.4], [2.4, 6.8]], original = [[0.8 * Math.sqrt(10), 0], [0.6 * Math.sqrt(10), 4 / Math.sqrt(5)]], w = original.map((r) => r.map((v) => v === 0 ? d : v)), h = transpose(w), s = muSweep(x, w, h);
  return /* @__PURE__ */ jsxs4(Figure, { id: "D34", caption: "Only the original zeros receive \u03B4. Filled and unfilled factors, initial product and one complete H-first/new-H W result remain visible. This edit is not guaranteed to improve the fit; the matrix mean4.95 is a separate nndsvda value outside the live range.", children: [
    /* @__PURE__ */ jsxs4(Panels, { children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Unfilled W \xB7 H=W\u1D40", values: original }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Filled initial W", values: w }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Filled initial H", values: h }),
      /* @__PURE__ */ jsx4(Matrix, { label: "One-step new W", values: s.w }),
      /* @__PURE__ */ jsx4(Matrix, { label: "One-step new H", values: s.h }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Initial / updated predictions", values: [...matmul(w, h), ...matmul(s.w, s.h)], rows: ["Initial R0", "Initial R1", "Updated R0", "Updated R1"], max: 12 })
    ] }),
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
  return /* @__PURE__ */ jsxs4(Figure, { id: "D35", caption: "The numerical lane is a supplied hand decomposition, not invented sklearn factors. Public fit_transform learns new arrays; later transform uses its fitted dictionary. The shown query calculation explicitly uses supplied H0.", children: [
    /* @__PURE__ */ jsxs4(Panels, { children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Hand X0 \xB7 3\xD73", values: X0 }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Hand W \xB7 3\xD72", values: W0, columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Hand H0 \xB7 2\xD73", values: H0, rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Public fit_transform learned W \xB7 shape only", values: [["w00", "w01"], ["w10", "w11"], ["w20", "w21"]], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Public components_ \xB7 shape only", values: [["h00", "h01", "h02"], ["h10", "h11", "h12"]], rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Supplied query \u2192 transform amounts", values: [[1.5, 0.5, 2], [1.5, 0.5, "\u2014"]], rows: ["Query F0/F1/F2", "New C0/C1 amounts"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Contributions \u2192 inverse_transform prediction", values: [[1.5, 0, 1.5], [0, 0.5, 0.5], [1.5, 0.5, 2]], rows: ["C0 addend", "C1 addend", "Prediction"] })
    ] }),
    /* @__PURE__ */ jsx4("p", { children: "Refused: query feature order[F1,F0,F2] differs from fitted[F0,F1,F2]; query[\u22121,0,1] contains a negative value. Neither request changes the fitted state." })
  ] });
}
function SameBlock() {
  const [a, setA] = scenarioState(1), cd = [2, 2.5], mu = [5 * a / (2 * a + 1), 7 / (a + 2)], lanes = [["Cyclic CD", cd], ["Simultaneous MU", mu]];
  return /* @__PURE__ */ jsxs4(Figure, { id: "D36", caption: "Both routes start from[a,1] with fixed H0. CD sends its new C0=2 into C1=(7\u22122)/2; MU sends old operands into both denominators2a+1 and a+2. One block is not a stationary coupled solution.", children: [
    /* @__PURE__ */ jsxs4(Panels, { children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Fixed G and p \xB7 component axes", values: [[2, 1], [1, 2], [5, 7]], rows: ["G C0", "G C1", "p R1"], columns: ["C0", "C1"] }),
      lanes.map(([name, w]) => {
        const pred = matmul([w], H0)[0], g = [2 * w[0] + w[1] - 5, w[0] + 2 * w[1] - 7];
        return /* @__PURE__ */ jsxs4("div", { children: [
          /* @__PURE__ */ jsx4(Matrix, { label: `${name} amounts and addends`, values: [[...w, "\u2014"], [w[0], 0, w[0]], [0, w[1], w[1]], pred, [1 - pred[0], 3 - pred[1], 4 - pred[2]]], rows: ["C0/C1 amounts", "C0 addend", "C1 addend", "Prediction", "Residual"], signed: true }),
          /* @__PURE__ */ jsxs4("p", { children: [
            "Half-loss ",
            fmt(halfLoss([[1, 3, 4]], [pred])),
            "; gradient [",
            g.map(fmt).join(", "),
            "]; PG\xB2 ",
            fmt(g[0] ** 2 + g[1] ** 2),
            "."
          ] })
        ] }, name);
      })
    ] }),
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
    /* @__PURE__ */ jsxs4(Panels, { children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Old fitted H0 \xB7 unchanged after refusal", values: H0, rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Old ordered feature identities", values: [["F0", "F1", "F2"]], rows: ["Order"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Old coherent fitted metadata slots", values: [[2, "stored objective", "stored stop reason"]], rows: ["Fitted snapshot"], columns: ["Fitted k", "Diagnostic", "Diagnostic"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Rejected negative candidate \xB7 stop before publication", values: [[-1, 0, 1]], signed: true }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Other rejected candidates \xB7 separate examples", values: [["NaN", 0, 1], [1, 2, "wrong width2"]], rows: ["Nonfinite", "Shape"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Valid new candidate \xB7 indexed values only", values: [["new h00", "new h01", "new h02"], ["new h10", "new h11", "new h12"]], rows: ["new C0", "new C1"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Old query reads old fitted k2 and H0", values: [[1.5, 0.5, 2], [1.5, 0.5, "\u2014"]], rows: ["Query", "Two amounts"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Edited returned copy \xB7 no backward mutation", values: [[-99, 0, 1], [0, 1, 1]], signed: true })
    ] }),
    /* @__PURE__ */ jsx4("p", { children: "Next-fit configuration k1 cannot resize the old two-component query. Valid publication transfers H, ordered feature IDs, fitted k and diagnostics as one operation; it does not certify global optimality." })
  ] });
}
function Penalty() {
  const [l, setL] = scenarioState(0), w = Math.max(0, 2 - l), data = (2 - w) ** 2 / 2, paid = l * w;
  return /* @__PURE__ */ jsxs4(Figure, { id: "D38", caption: "A linear price moves the constrained optimum to max(0,2\u2212\u03BB), including the nonnegative boundary. The separate squared-price inset has \u03BB1=0, \u03BB2=1 and optimum1.", children: [
    /* @__PURE__ */ jsxs4(Panels, { children: [
      /* @__PURE__ */ jsx4(Plot, { label: "Data + linear price = total", xmax: 3, ymax: 10, xlabel: "amount w", ylabel: "cost", children: (map) => /* @__PURE__ */ jsxs4(Fragment3, { children: [
        /* @__PURE__ */ jsx4(Curve, { map, xmax: 3, fn: (w2) => (2 - w2) ** 2 / 2 }),
        /* @__PURE__ */ jsx4(Curve, { map, xmax: 3, fn: (w2) => l * w2, color: "#f2c276" }),
        /* @__PURE__ */ jsx4(Curve, { map, xmax: 3, fn: (w2) => (2 - w2) ** 2 / 2 + l * w2, color: colors[1] }),
        /* @__PURE__ */ jsx4(Point, { at: map([w, data + paid]), label: "best", color: colors[1] })
      ] }) }),
      /* @__PURE__ */ jsx4(Plot, { label: "Fixed squared price \xB7 .5w\xB2", xmax: 3, ymax: 6, xlabel: "amount w", ylabel: "cost", children: (map) => /* @__PURE__ */ jsxs4(Fragment3, { children: [
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
  const [m, setM] = scenarioState(1), root = Math.sqrt(m), g = [[1 + m, m], [m, 1 + m]], p = [[2 + 3 * m, 1 + 3 * m]];
  return /* @__PURE__ */ jsxs4(Figure, { id: "D40", caption: "Weights change the local Gram and cross product. F2 remains measured3 even when excluded from the objective. Square-root weighting produces the same G=A\u1D40A and p=A\u1D40b; different masks require different caches.", children: [
    /* @__PURE__ */ jsxs4(Panels, { children: [
      /* @__PURE__ */ jsx4(Matrix, { label: "Measured R0 \xB7 unchanged", values: [[2, 1, 3]] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Separate weights [1,1,m]", values: [[1, 1, m === 0 ? "excluded" : m]] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Fixed H0", values: H0, rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "A = sqrt(weights) H\u1D40", values: [[1, 0], [0, 1], [root, root]], rows: ["F0", "F1", "F2"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "b = sqrt(weights) x", values: [[2], [1], [3 * root]], rows: ["F0", "F1", "F2"], columns: ["Target"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Current local G", values: g, rows: ["C0", "C1"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx4(Matrix, { label: "Current local p", values: p, columns: ["C0", "C1"] }),
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

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/SavedDataFigures.jsx
import React6, { useState as useState4 } from "react";

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/saved-data.js
var saved = { "datasetSha256": "d93f963c4b2610eb07122a312eec3ddceac18a031477370d71e33835eced728e", "license": "CC BY 4.0", "attribution": "E. Alpaydin and C. Kaynak (1998), Optical Recognition of Handwritten Digits, UCI Machine Learning Repository", "provenance": "/learn-assets/nmf/data-provenance.md", "csv": "/learn-assets/nmf/digits-300.csv", "scale": 16, "side": 8, "splitSizes": { "train": 180, "validation": 60, "test": 60 }, "fit": { "k": 8, "seed": 19, "init": "random", "solver": "cd", "maxIter": 2e3, "tol": 1e-5 }, "dictionary": [[0, 0, 0, 0.5452207624967085, 0.4095273191122956, 0.0032738725363875235, 0.01681396589080354, 0.011303952425851567, 0, 0, 0.5798605410667163, 0.40813194871906505, 0.5410936516317683, 0.7468128085194613, 0.033936702627451895, 0.005651976212925783, 0, 0.0054649923737094585, 0.1142326706623143, 0, 0.19563614790275166, 1.194550746929823, 0.24681639781363998, 0.001490732779435335, 0, 0, 0, 0, 0.26298584569743727, 1.3353766171994814, 0.419057910273771, 0, 0, 0.06490782859151373, 0.057425870352950784, 0, 0, 0.7310871694622716, 0.5496718650649962, 0, 0, 0.013267888649701506, 0, 0, 0, 0, 0.06218969167893644, 0, 0, 0, 0, 0.1864415956594669, 0, 0, 0, 0, 0, 0, 0, 0.5226455673513869, 0, 0, 0, 0], [0, 0, 0, 0.22831267182640838, 0.45541916858605475, 0.036492142637753675, 0, 0.0067306550015986955, 0, 0, 0, 0.49969973526180855, 0.12654325536354383, 0, 0, 0.0033653275007993477, 0, 0, 0, 0.08610871845949049, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.09899900134593437, 0.6666521140817067, 1.032435568842472, 0.8672643308533736, 0, 0, 0, 0, 0.1100839614590444, 0.5682417398217321, 1.107694630016878, 0.7657014778951113, 0, 0, 2777356230913594e-19, 0, 0, 0.03749513404577792, 0.6316069277384847, 0.31304859260698553, 0, 0, 0.0029524433476481385, 0, 0, 0, 0.1531299552817061, 0.05757589233305222, 0, 0, 0], [0, 0, 0.018777498885022437, 0.669124058486497, 0.013297704357583774, 0, 0, 0, 0, 0, 0.5596677029952549, 0.5963959652116955, 0, 0, 0, 0, 0, 0.10516805849444419, 0.6424545845468463, 0.1601894482117721, 0, 0.22619281095378732, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.056866114827202954, 0, 0, 0, 0, 0, 0.0811763550067284, 0.8408016254985371, 0.1923952982226453, 0, 0.20353766799362172, 0.45056549116164757, 0.0012254003880172385, 0, 0.07623127732249224, 1.1770843982644912, 0.5842155438595986, 0, 0.8822180161457316, 0.7931314830343865, 0.01709479894706051, 0, 0, 0.026010526191649355, 0.6081856742633671, 0.9030137990775886, 1.0185647605959933, 0.38973442124145713, 0.0073732012632652414], [0, 0.05587149156190696, 0.7488044490175612, 0.7620249640818427, 0.21269821668061173, 0, 0, 0, 0, 0.1104123082933756, 0.5637491818631478, 0.3849866997353717, 0.5181212698089133, 0.04351319003116312, 0, 0, 0, 0.008577867867237536, 0, 0, 0.5528665840071592, 0, 0, 0, 0, 0, 0, 0.10422421533275342, 0.7602210491357746, 0, 0, 0, 0, 0, 0, 0.06087745495687146, 0.4606700858740838, 0.35201593796748154, 0, 0, 0, 0, 0, 0, 0, 0.4550465069574604, 0.12240811073789319, 0, 0, 0, 0.181190631718772, 0.33900159742357533, 0.27943949751850616, 0.33243726027470605, 0.08432570438311894, 0, 0, 0.06687606756477682, 0.8113587358229821, 0.7697332143135511, 0.31494093705394777, 0, 0.008515912403402739, 0.004311244860506516], [0, 0, 0, 0, 0.7066432969886774, 0.9717394202133349, 0.20989415436636574, 0.005004911186076742, 0, 0, 0, 0, 0.17206345975451942, 1.2017594087097887, 0.4509863069558517, 0.002502455593038371, 0, 0, 0, 0, 0, 1.0618734065875557, 0.2502669307760567, 0, 0, 0, 0.033448149317311666, 0, 0.24501974109043692, 0.7990105116681347, 0, 0, 0, 0, 0, 0.0835904250822763, 0.7115089418369894, 0.48537642770975825, 0, 0, 0, 0.02845405897195121, 0, 0, 0.7523538581460832, 0.5035960084242987, 0, 0, 0, 0.03183463700786668, 0.013627421045589031, 0, 0.6980051124977253, 0.6033655598989045, 0, 0, 0, 0, 0, 0, 0.2806596634618026, 0.38654835336594445, 0, 0], [0, 0, 0, 0, 0.0964211697344673, 0, 0, 0, 0, 0, 0, 0.04221915422805248, 0.8958374138819365, 0, 0, 0, 0, 0, 0, 1.0159429596281646, 1.389323550924926, 0, 0, 0.001046446484514251, 0, 0, 0.11900813752228433, 1.3802210453880088, 1.2561054790898722, 0.016611471145815734, 0, 0, 0, 0, 0, 0.27765213760605156, 0.15496097865711772, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00930121063888378, 0.020372714289296632, 0, 0.1264466391553927, 0, 0, 0, 0, 0, 0, 0, 0.512597648930029, 0.3777486091539714, 0.0716588099151347, 7432941092963941e-19], [0, 0.09180849936968948, 0.5722226463430513, 0.5267809299094709, 0.3848333839768033, 0.4045848214337089, 0.07841505437754875, 0, 0, 0.25793602287195405, 0.7501348283351726, 0.34434700226912834, 0.1622344018028079, 0.3296880185659973, 0.07790581939768271, 0, 0, 0.30526304684823935, 0.7235024230283255, 0, 0, 0, 0.021177689925761252, 0, 0, 0.1870514125991531, 0.624215171285832, 0.3593851589751179, 0.061198235991517684, 0, 0, 0, 0, 0, 0.12584289807084212, 0.18349168068803307, 0, 0, 0, 0, 0, 0, 0, 0.02835993055192491, 0.1727169595927673, 0, 0, 0, 0, 0.040446501693072706, 0.3470966168009258, 0.3445104791635526, 0.38803113688656193, 0, 0, 0, 0, 0.08096041689561823, 0.5974056454937383, 0.6144190424660241, 0.08545959557100061, 0, 0, 0], [0, 0, 0, 0, 0.2830418933746405, 0, 0, 0, 0, 0, 0, 0.3866776681060496, 0.4254584158619083, 0, 0, 0, 0, 0.0048504294048323125, 0.6427051313236756, 0.6250092362785254, 0, 0, 0, 0, 0, 0.31885333715174474, 1.264170738762138, 0.25230804920480737, 0, 0.19231860950929694, 0.2002244508928143, 0, 0, 0.39117216633814067, 0.9231790735899313, 0, 0.0419652950204764, 0.8298332498411142, 0.25461710615084954, 0, 0, 0.11332989730468777, 0.26781955784537415, 0, 0.18810594695810864, 1.0960064636443374, 0.31592626241031363, 6304602576143281e-19, 0, 0, 0, 0, 0.6862180094823759, 0.5316091286845613, 0.020112757401910177, 0, 0, 0, 0, 0.07783661180354828, 0.6446358288409058, 0, 0, 0]], "activations": [[0.17645306257523935, 0.7401606838954491, 0.35507968290394915, 0.09898370289714804, 0.2751947642817364, 0.6129899958656101, 0.1857680492602524, 0], [0.2321911099210713, 0.011934602685408047, 0.3424206826975729, 0, 0.12081544616148039, 0, 0.6884925427238711, 0.628002130601251], [0.06850244484308012, 0.4922968165804899, 0.2919395765878569, 0.2707352072272636, 0.3974411384758673, 0.45389863294705873, 0.4248041769675399, 0], [0.4821412692038989, 0, 0.0011948443596831032, 0.630439784296947, 0.13867577910146528, 0.12068113376338206, 0.5100302762147536, 0.43667314818351777], [0, 0.39910592373615683, 0.5116408147150648, 0.41496253197721766, 0, 0.45440831646916835, 0.5271886425531841, 0], [0.17876355444526804, 0.586062155519975, 0, 0, 0.17574022895886368, 0.30889847061954595, 0, 0.7838307339598126], [0, 0.7243279864419385, 0.07623133017419845, 0.08584490416822682, 0.32241330048101563, 0.7165295211963071, 0.2939066839174276, 0.16087111617641414], [0, 0, 0.23172218921812116, 0.8701964550149489, 0.6755736736037703, 0.24605981890235892, 0.016760218008273257, 7715809428859795e-19], [0.3909398135394487, 0.5290761476417956, 0, 0, 0.42944935495683056, 0.10990023104886221, 0.22633008293275453, 0.19995068208105266], [0.0940690466850795, 0.5021159922953674, 0.47658518669238814, 0.3430508871802317, 0, 0.4817411422789252, 0.5123496524803683, 0], [0.15849080363914134, 0.16779414593668615, 0, 0.44772459300782824, 0.107836766067562, 0.19200026231975684, 0.5698304587448296, 0.3291470284864378], [0.0724936230912565, 0.6129972366312734, 0.6114862623190841, 0.0900467675157052, 0, 0, 0.039739321955010065, 0.5689114450897824], [0.17660924628182123, 0.5640673653482697, 0.4157120682362664, 0.06302153153079264, 0.00517408057989016, 0.6241134325028457, 0.6708514583802954, 0], [0.5204703895280667, 0.17557719846944628, 0.5324342033008579, 0.04750670324161154, 0, 0, 0.34577946701870166, 0.6656795372138576], [0, 0.8311565369767856, 0.437690312580896, 0, 0.0758289395324161, 0.42886650738049503, 0.3348653463962268, 0.33819752290137334], [0.33098115878752504, 0.16856559234458662, 0, 0.055464942050277674, 0.42728545094032855, 0.24954513708112, 0.8392631049090669, 0.04822543181641521], [0, 0.4074054411419564, 0, 0.4635732005616393, 0.13820358948785486, 0.0528826988951364, 0.8610355626023569, 0.3556077406609023], [0, 0.5202218101928828, 0.11364052579492182, 0, 0.8003059993424251, 0.6665207018510105, 0.03653441985688586, 0.44895223508216964], [0.3526120147662815, 0.6244073334784723, 0.45186214233294386, 0.2948517298143034, 0.26973996549030055, 0.5052264067962933, 0, 0.13817868723561866], [0.12469887338766442, 0.06859490719829882, 0.01748536860892227, 1.094545646232888, 0.6581276689521914, 0, 0, 0.02157449928870426], [0, 0.5268547901457094, 0.02742455774442317, 0.2858585470300585, 0.21068492643336606, 0.2709277957110999, 1.1427383310266528, 0], [0, 0.31720076254465246, 0.0914030491874698, 0.5727445275792681, 0.18873836824778473, 0.14994340734691322, 0.5166312204192188, 0.4842150147867096], [0, 0.7188226997995214, 0.6062481214718544, 0, 0, 0.13643944805618244, 0.16449703140459018, 0.5785968268899001], [0.02692017384147784, 0.5599284656807494, 0.5781028416542022, 0.019580338592944703, 0, 0.1825324647426752, 0.22551648611342948, 0.6045571975296687], [0.5578712648045303, 0.77529953808653, 0, 0.24634312092132712, 0.3950286761272544, 0.053899550745313, 0.1996604180695196, 0], [0.29219486552400153, 0.5986886377809788, 0, 0.08496631423908615, 0.3306311904601879, 0.20053568837143854, 0.45097691522168987, 0], [0.5256176110934133, 0.34204814022619956, 0.4004324034372505, 0, 0.06497166757527392, 0.05026966727814014, 0.09051350014620616, 0.6918402232548432], [0.3890786189646431, 0, 0.4311689404167654, 0.4981573608977298, 0, 0.4924371662107114, 0, 0.31735079123505794], [0.1481641659795343, 0, 0.19263882196801893, 0.3436760791462832, 0.17075634333118442, 0.1928568506660887, 0.61918609979157, 0.40320526555717806], [0.014796528732870937, 0, 0.2521031398767424, 0.9101290286078436, 0.5090546900122245, 0.17475722229501053, 0, 0.022704206161760405], [0, 0.5626204913701446, 0, 0, 0.03839930043097556, 0.08906568955697669, 1.305222208823279, 0.040202053511153246], [0, 0.17808300264859062, 0, 0.0272204104433071, 0.6149341587767829, 0.6252625817197403, 0.11874335715481768, 0.33249397594851726], [0, 0.6244976024893577, 0, 0, 0.18960243425664933, 0.5376260587038525, 0, 0.5092052225033739], [0.040840890514737216, 0.14513739484727378, 0, 0, 0.7621507768370629, 0.648163996749805, 0, 0.26317329873075207], [0.6281110333543323, 0, 0.555048680883091, 0.023921523759225734, 0.06641727136362756, 0.46361903442788677, 0, 0.15909741770308855], [0.5610835368760478, 0, 0.3316086661031853, 0.441116005916426, 0.06600667381819143, 0.2923096271619734, 0, 0.29375817432682955], [0.12456728914748866, 0.4771041735015189, 0.047344236709685336, 0, 0.1363975616131259, 0.3432983231938124, 0.9669438153954205, 0], [0.01319655071954904, 0, 0.31553859971584924, 0.9613825383278762, 0.13434258714801495, 0.3017957412525238, 0, 0.11991876370709696], [0.23500970644517966, 0, 0, 0, 0.6748642906136353, 0.593868946959291, 0, 0.5317145984117821], [0.574857328712728, 0.9319374292854736, 0, 0.5412265364584163, 0, 0.218246004986071, 0, 0.027153517781280737], [0, 0.23226692726718734, 0.545529666718704, 0.3866736660705895, 0, 0.4519024970388965, 0.5361728222395361, 0], [0, 0.06808749962293095, 0.17383995483309414, 0.8617148942868633, 0.506884035880263, 0.2959446165272875, 0, 0], [0, 0.44961936043707135, 0.7162258162499501, 0.2768137121070615, 0, 0.4410579271202832, 0.41103789324825635, 0], [0.445273883133402, 0.7675442478361537, 0.03902332706691933, 0, 0.04585632227650423, 0.15550145541126392, 0.07169322169975867, 0.8160040411320851], [0.5590178558744591, 0.05915088982836048, 0.35294754104080783, 0.14175523215479305, 0.019269127774284047, 0, 0.38264460375833326, 0.7131115411364464], [0.2604447684801515, 0.4067918725909876, 0.5720087101325382, 0.31758475363822203, 0.3174377793066609, 0.30790087430583, 0.15046659285869116, 0.05447529683147041], [0.4385374813833229, 0, 0.09633606185531644, 0.5681923102355811, 0.2471035525772711, 0.26843362937663634, 0.375857292597508, 0.41057752650202683], [0.6175005575742657, 0.20978157350115995, 0.4048011804221114, 0, 0.06292912719125401, 0, 0.31019192565862574, 0.6218358914206394], [0.5909658018396403, 0.8097020144385956, 0, 0.4039437902752291, 0.039593028080708595, 0.22323515350819928, 0, 0], [0, 0.7212412061470614, 0.6552355386452519, 0, 0, 0.24051172259565043, 0.3301611793302834, 0.5879372540284772], [0.026570687201098682, 0.5651198634680678, 0, 0, 0.4711121128856416, 0.7049059063023964, 0.11964229287564736, 0.17006940196770465], [0.1751096887388967, 0.6405718648809873, 0.5909157796925122, 0.30293737466502757, 0.13582703130690948, 0.4354668396201162, 0, 0], [0.6714869819488557, 0.8422324496279615, 0, 0.22525551169420718, 0.21444120858429186, 0, 0.35677276415910447, 0], [0.2647990400647813, 0.49630309772805076, 0.1448970208957514, 0, 0.02931364701187932, 0.44611820759523346, 0.6197621420291191, 0], [0.5260793235795206, 0.7886161860411672, 0, 0, 0, 0.4135349503247048, 0.3373092349068192, 0.4074187726890977], [0, 0.2692040706896545, 0, 0.43658369793407775, 0.3369116924483512, 0.3105944024619573, 0.5654828470276134, 0], [0, 0.697530799501314, 0.6482474592519106, 0, 0.016590027475714215, 0.07342641040794486, 0.04900263691563263, 0.4598382838949607], [0.6406669405207319, 0.35640289656604257, 0.5680029344428253, 0.009442814765749315, 0, 0.010219757204770256, 0.18866017093160226, 0.7685533240992717], [0.3826307792646341, 0.7024618998557096, 0, 0, 0, 0, 0.259476821236635, 0.5576085840020767], [0, 0.8606661650949871, 0, 0, 0.28727085177031236, 0.6852764315205603, 0, 0.498124380643084]], "test": [{ "sourceRow": 242, "digit": 8, "pixels": [0, 0, 2, 12, 12, 0, 0, 0, 0, 0, 7, 16, 15, 9, 1, 0, 0, 0, 6, 14, 13, 15, 3, 0, 0, 0, 1, 16, 16, 4, 0, 0, 0, 0, 7, 16, 14, 0, 0, 0, 0, 1, 15, 9, 16, 5, 0, 0, 0, 2, 13, 13, 16, 10, 0, 0, 0, 0, 1, 11, 12, 5, 0, 0] }, { "sourceRow": 256, "digit": 0, "pixels": [0, 0, 4, 11, 15, 8, 0, 0, 0, 0, 13, 16, 11, 13, 7, 0, 0, 3, 16, 12, 0, 4, 8, 0, 0, 6, 16, 5, 0, 4, 8, 0, 0, 7, 9, 0, 0, 9, 7, 0, 0, 4, 10, 0, 2, 15, 2, 0, 0, 1, 16, 12, 14, 10, 0, 0, 0, 0, 4, 14, 14, 1, 0, 0] }, { "sourceRow": 40, "digit": 8, "pixels": [0, 0, 11, 10, 12, 4, 0, 0, 0, 0, 12, 13, 9, 16, 1, 0, 0, 0, 7, 13, 11, 16, 0, 0, 0, 0, 1, 16, 14, 4, 0, 0, 0, 0, 10, 16, 13, 0, 0, 0, 0, 0, 14, 7, 12, 7, 0, 0, 0, 4, 14, 4, 12, 13, 0, 0, 0, 1, 11, 14, 12, 4, 0, 0] }, { "sourceRow": 220, "digit": 9, "pixels": [0, 0, 11, 16, 8, 0, 0, 0, 0, 6, 16, 11, 13, 9, 0, 0, 0, 7, 16, 0, 9, 16, 0, 0, 0, 2, 15, 12, 16, 16, 3, 0, 0, 0, 5, 7, 7, 16, 4, 0, 0, 0, 0, 0, 5, 16, 5, 0, 0, 0, 3, 7, 16, 11, 0, 0, 0, 0, 13, 16, 11, 1, 0, 0] }, { "sourceRow": 132, "digit": 2, "pixels": [0, 2, 15, 16, 6, 0, 0, 0, 0, 5, 16, 15, 14, 0, 0, 0, 0, 5, 13, 10, 14, 0, 0, 0, 0, 0, 0, 12, 12, 0, 0, 0, 0, 0, 1, 16, 7, 0, 0, 0, 0, 0, 10, 15, 2, 0, 0, 0, 0, 3, 16, 10, 8, 6, 1, 0, 0, 2, 15, 16, 16, 16, 7, 0] }, { "sourceRow": 97, "digit": 4, "pixels": [0, 0, 0, 3, 14, 1, 0, 0, 0, 0, 0, 13, 12, 1, 0, 0, 0, 0, 7, 16, 5, 3, 0, 0, 0, 3, 15, 11, 5, 16, 2, 0, 0, 5, 16, 11, 11, 16, 6, 0, 0, 0, 6, 12, 16, 13, 3, 0, 0, 0, 0, 1, 15, 7, 0, 0, 0, 0, 0, 2, 16, 7, 0, 0] }, { "sourceRow": 1, "digit": 1, "pixels": [0, 0, 0, 12, 13, 5, 0, 0, 0, 0, 0, 11, 16, 9, 0, 0, 0, 0, 3, 15, 16, 6, 0, 0, 0, 7, 15, 16, 16, 2, 0, 0, 0, 0, 1, 16, 16, 3, 0, 0, 0, 0, 1, 16, 16, 6, 0, 0, 0, 0, 1, 16, 16, 6, 0, 0, 0, 0, 0, 11, 16, 10, 0, 0] }, { "sourceRow": 13, "digit": 3, "pixels": [0, 2, 9, 15, 14, 9, 3, 0, 0, 4, 13, 8, 9, 16, 8, 0, 0, 0, 0, 6, 14, 15, 3, 0, 0, 0, 0, 11, 14, 2, 0, 0, 0, 0, 0, 2, 15, 11, 0, 0, 0, 0, 0, 0, 2, 15, 4, 0, 0, 1, 5, 6, 13, 16, 6, 0, 0, 2, 12, 12, 13, 11, 0, 0] }, { "sourceRow": 43, "digit": 7, "pixels": [0, 0, 0, 9, 15, 12, 0, 0, 0, 0, 4, 7, 7, 14, 0, 0, 0, 0, 0, 0, 0, 13, 3, 0, 0, 4, 9, 8, 10, 13, 1, 0, 0, 4, 16, 15, 16, 16, 6, 0, 0, 0, 0, 0, 14, 3, 0, 0, 0, 0, 0, 9, 12, 0, 0, 0, 0, 0, 0, 11, 7, 0, 0, 0] }, { "sourceRow": 180, "digit": 2, "pixels": [0, 0, 7, 15, 15, 4, 0, 0, 0, 8, 16, 16, 16, 4, 0, 0, 0, 8, 15, 8, 16, 4, 0, 0, 0, 0, 0, 10, 15, 0, 0, 0, 0, 0, 1, 15, 9, 0, 0, 0, 0, 0, 6, 16, 2, 0, 0, 0, 0, 0, 8, 16, 8, 11, 9, 0, 0, 0, 9, 16, 16, 12, 3, 0] }, { "sourceRow": 120, "digit": 5, "pixels": [0, 0, 6, 13, 2, 0, 0, 0, 0, 4, 16, 16, 16, 11, 0, 0, 0, 0, 12, 11, 1, 6, 1, 0, 0, 0, 12, 14, 10, 2, 0, 0, 0, 0, 1, 8, 12, 12, 0, 0, 0, 0, 0, 0, 9, 14, 0, 0, 0, 0, 4, 9, 16, 5, 0, 0, 0, 0, 9, 14, 4, 0, 0, 0] }, { "sourceRow": 272, "digit": 6, "pixels": [0, 0, 0, 13, 9, 0, 0, 0, 0, 0, 8, 15, 5, 0, 0, 0, 0, 0, 14, 8, 0, 0, 0, 0, 0, 2, 16, 3, 0, 2, 0, 0, 0, 0, 16, 13, 16, 16, 6, 0, 0, 1, 16, 11, 4, 7, 12, 0, 0, 0, 11, 12, 5, 13, 9, 0, 0, 0, 1, 12, 15, 11, 2, 0] }, { "sourceRow": 244, "digit": 2, "pixels": [0, 0, 4, 14, 16, 4, 0, 0, 0, 3, 16, 16, 16, 6, 0, 0, 0, 8, 16, 12, 16, 7, 0, 0, 0, 3, 5, 12, 15, 0, 0, 0, 0, 0, 0, 15, 12, 0, 0, 0, 0, 0, 6, 16, 2, 0, 0, 0, 0, 0, 8, 16, 12, 5, 1, 0, 0, 0, 4, 16, 16, 15, 4, 0] }, { "sourceRow": 202, "digit": 0, "pixels": [0, 0, 4, 15, 11, 1, 0, 0, 0, 2, 14, 14, 16, 8, 0, 0, 0, 8, 15, 2, 3, 13, 0, 0, 0, 4, 16, 0, 0, 12, 7, 0, 0, 7, 16, 0, 0, 12, 8, 0, 0, 3, 16, 6, 1, 14, 9, 0, 0, 0, 15, 16, 16, 16, 2, 0, 0, 0, 4, 13, 14, 6, 0, 0] }, { "sourceRow": 95, "digit": 6, "pixels": [0, 0, 0, 11, 16, 8, 0, 0, 0, 0, 6, 16, 13, 3, 0, 0, 0, 0, 8, 16, 8, 0, 0, 0, 0, 0, 13, 16, 2, 0, 0, 0, 0, 0, 15, 16, 5, 0, 0, 0, 0, 2, 16, 16, 16, 5, 0, 0, 0, 1, 10, 16, 16, 14, 0, 0, 0, 0, 0, 12, 16, 15, 0, 0] }, { "sourceRow": 265, "digit": 9, "pixels": [0, 0, 6, 12, 13, 5, 0, 0, 0, 2, 16, 9, 8, 15, 2, 0, 0, 8, 12, 0, 3, 15, 8, 0, 0, 4, 15, 12, 16, 13, 1, 0, 0, 0, 2, 2, 16, 6, 0, 0, 0, 0, 0, 1, 16, 1, 0, 0, 0, 0, 0, 5, 16, 0, 0, 0, 0, 0, 3, 16, 14, 0, 0, 0] }, { "sourceRow": 102, "digit": 5, "pixels": [0, 0, 12, 16, 16, 8, 0, 0, 0, 3, 16, 13, 8, 5, 0, 0, 0, 2, 16, 3, 0, 0, 0, 0, 0, 0, 16, 13, 9, 0, 0, 0, 0, 0, 10, 16, 16, 7, 0, 0, 0, 0, 0, 1, 10, 13, 0, 0, 0, 0, 2, 11, 16, 10, 0, 0, 0, 0, 11, 16, 12, 0, 0, 0] }, { "sourceRow": 221, "digit": 1, "pixels": [0, 0, 0, 4, 14, 14, 5, 0, 0, 0, 0, 9, 16, 16, 7, 0, 0, 0, 5, 15, 16, 15, 3, 0, 0, 4, 15, 16, 16, 12, 0, 0, 0, 5, 16, 16, 16, 12, 0, 0, 0, 0, 0, 12, 16, 13, 1, 0, 0, 0, 0, 8, 16, 16, 7, 0, 0, 0, 0, 4, 14, 15, 6, 0] }, { "sourceRow": 248, "digit": 8, "pixels": [0, 0, 3, 14, 13, 1, 0, 0, 0, 0, 9, 16, 16, 9, 0, 0, 0, 0, 8, 16, 11, 15, 1, 0, 0, 0, 2, 14, 16, 15, 2, 0, 0, 0, 6, 16, 16, 6, 0, 0, 0, 0, 15, 11, 10, 12, 0, 0, 0, 1, 16, 11, 11, 15, 0, 0, 0, 0, 5, 13, 15, 7, 0, 0] }, { "sourceRow": 213, "digit": 3, "pixels": [0, 2, 14, 16, 12, 6, 0, 0, 0, 1, 10, 8, 14, 16, 1, 0, 0, 0, 0, 0, 10, 15, 2, 0, 0, 0, 0, 2, 16, 12, 0, 0, 0, 0, 0, 3, 16, 12, 0, 0, 0, 0, 0, 0, 11, 16, 2, 0, 0, 0, 7, 10, 15, 15, 2, 0, 0, 3, 13, 11, 7, 2, 0, 0] }, { "sourceRow": 145, "digit": 5, "pixels": [0, 4, 15, 16, 16, 16, 4, 0, 0, 4, 16, 15, 9, 7, 1, 0, 0, 0, 15, 14, 1, 0, 0, 0, 0, 0, 5, 16, 9, 0, 0, 0, 0, 0, 0, 14, 16, 0, 0, 0, 0, 0, 0, 9, 16, 5, 0, 0, 0, 3, 10, 13, 16, 4, 0, 0, 0, 5, 16, 16, 12, 0, 0, 0] }, { "sourceRow": 74, "digit": 5, "pixels": [0, 0, 13, 13, 8, 2, 0, 0, 0, 5, 16, 16, 16, 12, 0, 0, 0, 1, 15, 12, 0, 0, 0, 0, 0, 0, 12, 13, 7, 1, 0, 0, 0, 0, 8, 16, 16, 12, 0, 0, 0, 0, 0, 4, 9, 16, 3, 0, 0, 0, 1, 5, 14, 15, 1, 0, 0, 0, 10, 16, 16, 6, 0, 0] }, { "sourceRow": 58, "digit": 6, "pixels": [0, 0, 0, 10, 13, 1, 0, 0, 0, 1, 11, 12, 7, 0, 0, 0, 0, 2, 16, 12, 0, 0, 0, 0, 0, 4, 16, 11, 0, 0, 0, 0, 0, 4, 16, 15, 8, 4, 0, 0, 0, 4, 16, 16, 13, 16, 6, 0, 0, 0, 7, 16, 7, 13, 14, 0, 0, 0, 0, 7, 15, 15, 5, 0] }, { "sourceRow": 232, "digit": 6, "pixels": [0, 0, 0, 11, 14, 0, 0, 0, 0, 0, 10, 16, 4, 0, 0, 0, 0, 1, 15, 11, 0, 0, 0, 0, 0, 3, 16, 12, 8, 2, 0, 0, 0, 7, 16, 16, 12, 14, 3, 0, 0, 4, 16, 8, 0, 10, 9, 0, 0, 1, 12, 15, 9, 14, 10, 0, 0, 0, 2, 10, 13, 11, 1, 0] }, { "sourceRow": 222, "digit": 7, "pixels": [0, 0, 4, 15, 16, 16, 5, 0, 0, 0, 6, 9, 11, 16, 11, 0, 0, 0, 0, 0, 3, 16, 5, 0, 0, 0, 0, 3, 14, 16, 10, 0, 0, 0, 7, 16, 16, 11, 3, 0, 0, 0, 8, 15, 13, 0, 0, 0, 0, 0, 5, 16, 7, 0, 0, 0, 0, 0, 7, 14, 2, 0, 0, 0] }, { "sourceRow": 7, "digit": 7, "pixels": [0, 0, 7, 8, 13, 16, 15, 1, 0, 0, 7, 7, 4, 11, 12, 0, 0, 0, 0, 0, 8, 13, 1, 0, 0, 4, 8, 8, 15, 15, 6, 0, 0, 2, 11, 15, 15, 4, 0, 0, 0, 0, 0, 16, 5, 0, 0, 0, 0, 0, 9, 15, 1, 0, 0, 0, 0, 0, 13, 5, 0, 0, 0, 0] }, { "sourceRow": 179, "digit": 0, "pixels": [0, 0, 0, 10, 15, 1, 0, 0, 0, 0, 5, 16, 16, 10, 0, 0, 0, 0, 14, 6, 6, 15, 0, 0, 0, 4, 16, 4, 0, 15, 3, 0, 0, 5, 15, 5, 0, 11, 5, 0, 0, 0, 12, 11, 0, 13, 5, 0, 0, 0, 8, 16, 16, 16, 3, 0, 0, 0, 1, 8, 13, 8, 0, 0] }, { "sourceRow": 29, "digit": 9, "pixels": [0, 0, 9, 13, 7, 0, 0, 0, 0, 0, 12, 16, 16, 2, 0, 0, 0, 0, 12, 13, 16, 6, 0, 0, 0, 0, 6, 16, 16, 14, 0, 0, 0, 0, 0, 0, 2, 16, 3, 0, 0, 0, 0, 0, 0, 9, 10, 0, 0, 0, 3, 7, 12, 14, 16, 2, 0, 0, 7, 12, 12, 12, 11, 0] }, { "sourceRow": 261, "digit": 5, "pixels": [0, 0, 6, 8, 12, 14, 0, 0, 0, 5, 16, 15, 12, 7, 0, 0, 0, 8, 16, 13, 4, 0, 0, 0, 0, 2, 11, 8, 14, 11, 0, 0, 0, 0, 0, 0, 0, 15, 1, 0, 0, 0, 0, 0, 0, 14, 5, 0, 0, 1, 9, 8, 12, 14, 1, 0, 0, 0, 10, 15, 12, 3, 0, 0] }, { "sourceRow": 60, "digit": 3, "pixels": [0, 0, 10, 15, 14, 4, 0, 0, 0, 0, 4, 6, 13, 16, 2, 0, 0, 0, 0, 3, 16, 9, 0, 0, 0, 0, 0, 1, 16, 6, 0, 0, 0, 0, 0, 0, 10, 12, 0, 0, 0, 0, 0, 0, 1, 16, 4, 0, 0, 1, 9, 5, 6, 16, 7, 0, 0, 0, 14, 12, 15, 11, 2, 0] }, { "sourceRow": 246, "digit": 5, "pixels": [0, 4, 13, 9, 8, 3, 0, 0, 0, 5, 16, 14, 12, 12, 6, 0, 0, 8, 16, 1, 0, 0, 0, 0, 0, 3, 16, 11, 1, 0, 0, 0, 0, 0, 8, 16, 9, 0, 0, 0, 0, 0, 0, 10, 16, 0, 0, 0, 0, 1, 1, 12, 14, 0, 0, 0, 0, 4, 14, 14, 3, 0, 0, 0] }, { "sourceRow": 47, "digit": 1, "pixels": [0, 0, 0, 1, 11, 9, 0, 0, 0, 0, 0, 7, 16, 13, 0, 0, 0, 0, 4, 14, 16, 9, 0, 0, 0, 10, 16, 11, 16, 8, 0, 0, 0, 0, 0, 3, 16, 6, 0, 0, 0, 0, 0, 3, 16, 8, 0, 0, 0, 0, 0, 5, 16, 10, 0, 0, 0, 0, 0, 2, 14, 6, 0, 0] }, { "sourceRow": 194, "digit": 4, "pixels": [0, 0, 0, 0, 11, 5, 0, 0, 0, 0, 0, 8, 16, 2, 0, 0, 0, 0, 4, 15, 16, 3, 0, 0, 0, 0, 12, 6, 16, 3, 0, 0, 0, 5, 15, 0, 15, 5, 3, 0, 0, 6, 16, 16, 16, 11, 4, 0, 0, 0, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 12, 2, 0, 0] }, { "sourceRow": 107, "digit": 1, "pixels": [0, 0, 0, 0, 6, 10, 0, 0, 0, 0, 0, 0, 14, 15, 0, 0, 0, 0, 0, 10, 16, 16, 0, 0, 0, 0, 7, 16, 16, 15, 0, 0, 0, 3, 15, 7, 15, 10, 0, 0, 0, 0, 0, 0, 13, 11, 0, 0, 0, 0, 0, 0, 15, 9, 0, 0, 0, 0, 0, 0, 8, 15, 0, 0] }, { "sourceRow": 119, "digit": 9, "pixels": [0, 0, 0, 12, 14, 1, 0, 0, 0, 0, 9, 16, 10, 5, 0, 0, 0, 0, 8, 13, 5, 14, 0, 0, 0, 0, 2, 14, 16, 16, 4, 0, 0, 0, 0, 0, 4, 10, 10, 0, 0, 0, 0, 0, 0, 4, 16, 0, 0, 0, 2, 6, 4, 9, 16, 0, 0, 0, 1, 11, 16, 15, 7, 0] }, { "sourceRow": 159, "digit": 9, "pixels": [0, 0, 5, 13, 4, 0, 0, 0, 0, 0, 15, 14, 14, 5, 0, 0, 0, 0, 12, 7, 8, 16, 1, 0, 0, 0, 4, 13, 16, 16, 1, 0, 0, 0, 0, 0, 0, 15, 2, 0, 0, 0, 0, 0, 0, 14, 6, 0, 0, 0, 2, 7, 8, 16, 4, 0, 0, 0, 6, 12, 13, 10, 0, 0] }, { "sourceRow": 38, "digit": 8, "pixels": [0, 0, 7, 7, 13, 16, 4, 0, 0, 0, 13, 13, 6, 12, 7, 0, 0, 0, 10, 4, 10, 11, 1, 0, 0, 0, 8, 16, 10, 0, 0, 0, 0, 3, 14, 16, 0, 0, 0, 0, 0, 8, 8, 11, 5, 0, 0, 0, 0, 4, 10, 9, 8, 0, 0, 0, 0, 1, 11, 16, 6, 0, 0, 0] }, { "sourceRow": 259, "digit": 3, "pixels": [0, 0, 10, 16, 10, 1, 0, 0, 0, 6, 14, 6, 16, 3, 0, 0, 0, 5, 4, 5, 15, 0, 0, 0, 0, 0, 0, 12, 14, 1, 0, 0, 0, 0, 0, 3, 11, 15, 1, 0, 0, 0, 0, 0, 0, 10, 8, 0, 0, 0, 9, 8, 8, 15, 6, 0, 0, 0, 9, 15, 15, 9, 0, 0] }, { "sourceRow": 177, "digit": 1, "pixels": [0, 0, 0, 0, 12, 11, 1, 0, 0, 0, 0, 1, 16, 16, 7, 0, 0, 0, 1, 14, 16, 16, 7, 0, 0, 1, 14, 16, 14, 16, 8, 0, 0, 5, 12, 3, 8, 16, 7, 0, 0, 0, 0, 0, 8, 16, 4, 0, 0, 0, 0, 0, 8, 16, 1, 0, 0, 0, 0, 0, 11, 12, 0, 0] }, { "sourceRow": 147, "digit": 7, "pixels": [0, 0, 3, 15, 14, 1, 0, 0, 0, 0, 13, 16, 16, 6, 0, 0, 0, 0, 4, 4, 16, 8, 0, 0, 0, 0, 0, 1, 16, 10, 1, 0, 0, 0, 7, 16, 16, 16, 8, 0, 0, 0, 12, 15, 16, 6, 0, 0, 0, 0, 0, 14, 11, 0, 0, 0, 0, 0, 4, 12, 1, 0, 0, 0] }, { "sourceRow": 306, "digit": 2, "pixels": [0, 2, 15, 16, 7, 0, 0, 0, 0, 10, 15, 10, 16, 2, 0, 0, 0, 9, 11, 5, 16, 0, 0, 0, 0, 0, 0, 12, 11, 0, 0, 0, 0, 0, 5, 16, 2, 0, 0, 0, 0, 3, 15, 8, 0, 0, 0, 0, 0, 8, 15, 5, 5, 8, 3, 0, 0, 3, 15, 16, 16, 16, 10, 0] }, { "sourceRow": 59, "digit": 3, "pixels": [0, 1, 10, 15, 11, 1, 0, 0, 0, 3, 8, 8, 11, 12, 0, 0, 0, 0, 0, 5, 14, 15, 1, 0, 0, 0, 0, 11, 15, 2, 0, 0, 0, 0, 0, 4, 15, 2, 0, 0, 0, 0, 0, 0, 12, 10, 0, 0, 0, 0, 3, 4, 10, 16, 1, 0, 0, 0, 13, 16, 15, 10, 0, 0] }, { "sourceRow": 84, "digit": 2, "pixels": [0, 1, 13, 15, 2, 0, 0, 0, 0, 6, 15, 15, 9, 0, 0, 0, 0, 9, 8, 10, 13, 0, 0, 0, 0, 5, 3, 12, 12, 0, 0, 0, 0, 0, 3, 16, 6, 0, 0, 0, 0, 5, 15, 15, 1, 0, 0, 0, 0, 6, 16, 15, 12, 12, 11, 0, 0, 1, 11, 13, 16, 16, 12, 0] }, { "sourceRow": 41, "digit": 4, "pixels": [0, 0, 0, 9, 15, 1, 0, 0, 0, 0, 4, 16, 12, 0, 0, 0, 0, 0, 15, 14, 2, 11, 3, 0, 0, 4, 16, 9, 4, 16, 10, 0, 0, 9, 16, 11, 13, 16, 2, 0, 0, 0, 9, 16, 16, 14, 0, 0, 0, 0, 0, 8, 16, 6, 0, 0, 0, 0, 0, 9, 16, 2, 0, 0] }, { "sourceRow": 140, "digit": 0, "pixels": [0, 0, 12, 9, 12, 1, 0, 0, 0, 0, 14, 16, 16, 8, 0, 0, 0, 3, 16, 9, 3, 15, 2, 0, 0, 4, 16, 1, 0, 16, 5, 0, 0, 5, 12, 0, 0, 16, 5, 0, 0, 3, 14, 1, 4, 16, 4, 0, 0, 0, 15, 12, 14, 14, 0, 0, 0, 0, 7, 12, 12, 2, 0, 0] }, { "sourceRow": 8, "digit": 8, "pixels": [0, 0, 9, 14, 8, 1, 0, 0, 0, 0, 12, 14, 14, 12, 0, 0, 0, 0, 9, 10, 0, 15, 4, 0, 0, 0, 3, 16, 12, 14, 2, 0, 0, 0, 4, 16, 16, 2, 0, 0, 0, 3, 16, 8, 10, 13, 2, 0, 0, 1, 15, 1, 3, 16, 8, 0, 0, 0, 11, 16, 15, 11, 1, 0] }, { "sourceRow": 203, "digit": 9, "pixels": [0, 0, 10, 15, 7, 0, 0, 0, 0, 4, 16, 13, 11, 11, 0, 0, 0, 10, 16, 12, 15, 16, 4, 0, 0, 3, 12, 12, 14, 16, 4, 0, 0, 0, 0, 0, 10, 16, 4, 0, 0, 0, 0, 0, 9, 16, 4, 0, 0, 0, 4, 4, 15, 15, 0, 0, 0, 1, 12, 15, 12, 3, 0, 0] }, { "sourceRow": 20, "digit": 0, "pixels": [0, 0, 3, 13, 11, 7, 0, 0, 0, 0, 11, 16, 16, 16, 2, 0, 0, 4, 16, 9, 1, 14, 2, 0, 0, 4, 16, 0, 0, 16, 2, 0, 0, 0, 16, 1, 0, 12, 8, 0, 0, 0, 15, 9, 0, 13, 6, 0, 0, 0, 9, 14, 9, 14, 1, 0, 0, 0, 2, 12, 13, 4, 0, 0] }, { "sourceRow": 182, "digit": 7, "pixels": [0, 0, 5, 16, 12, 2, 0, 0, 0, 0, 4, 11, 16, 10, 0, 0, 0, 0, 0, 0, 14, 11, 0, 0, 0, 0, 2, 4, 14, 14, 2, 0, 0, 0, 13, 16, 16, 10, 4, 0, 0, 0, 3, 10, 14, 0, 0, 0, 0, 0, 0, 15, 5, 0, 0, 0, 0, 0, 6, 11, 0, 0, 0, 0] }, { "sourceRow": 26, "digit": 6, "pixels": [0, 0, 1, 13, 14, 3, 0, 0, 0, 0, 8, 16, 13, 2, 0, 0, 0, 2, 16, 16, 3, 0, 0, 0, 0, 3, 16, 12, 1, 0, 0, 0, 0, 5, 16, 14, 5, 0, 0, 0, 0, 3, 16, 16, 16, 16, 6, 0, 0, 1, 14, 16, 16, 16, 12, 0, 0, 0, 3, 12, 15, 14, 7, 0] }, { "sourceRow": 85, "digit": 1, "pixels": [0, 0, 0, 1, 16, 5, 0, 0, 0, 0, 0, 5, 16, 11, 0, 0, 0, 0, 0, 12, 16, 11, 0, 0, 0, 7, 12, 16, 16, 7, 0, 0, 0, 4, 8, 12, 16, 4, 0, 0, 0, 0, 0, 9, 16, 2, 0, 0, 0, 0, 0, 10, 16, 2, 0, 0, 0, 0, 0, 3, 13, 5, 0, 0] }, { "sourceRow": 113, "digit": 2, "pixels": [0, 0, 2, 16, 13, 1, 0, 0, 0, 0, 6, 15, 16, 7, 0, 0, 0, 0, 3, 6, 16, 8, 0, 0, 0, 0, 0, 3, 16, 6, 0, 0, 0, 0, 1, 13, 13, 0, 0, 0, 0, 6, 14, 16, 4, 0, 0, 0, 0, 9, 16, 16, 13, 10, 3, 0, 0, 0, 4, 11, 15, 16, 10, 0] }, { "sourceRow": 118, "digit": 7, "pixels": [0, 0, 9, 12, 15, 15, 2, 0, 0, 1, 15, 14, 11, 16, 7, 0, 0, 0, 2, 0, 2, 16, 4, 0, 0, 0, 2, 4, 10, 15, 2, 0, 0, 0, 13, 16, 16, 16, 9, 0, 0, 0, 13, 16, 10, 1, 0, 0, 0, 0, 6, 16, 1, 0, 0, 0, 0, 0, 11, 9, 0, 0, 0, 0] }, { "sourceRow": 127, "digit": 8, "pixels": [0, 0, 5, 4, 9, 10, 0, 0, 0, 0, 10, 8, 11, 16, 2, 0, 0, 0, 8, 12, 14, 14, 1, 0, 0, 0, 5, 15, 7, 0, 0, 0, 0, 0, 14, 12, 0, 0, 0, 0, 0, 1, 14, 13, 3, 0, 0, 0, 0, 0, 12, 13, 5, 0, 0, 0, 0, 0, 7, 16, 5, 0, 0, 0] }, { "sourceRow": 121, "digit": 4, "pixels": [0, 0, 0, 12, 13, 0, 0, 0, 0, 0, 5, 16, 10, 0, 0, 0, 0, 6, 16, 13, 11, 12, 2, 0, 0, 12, 16, 10, 15, 16, 9, 0, 0, 4, 14, 16, 16, 12, 4, 0, 0, 0, 0, 14, 13, 0, 0, 0, 0, 0, 0, 14, 12, 0, 0, 0, 0, 0, 0, 11, 13, 0, 0, 0] }, { "sourceRow": 103, "digit": 3, "pixels": [0, 4, 13, 16, 16, 12, 3, 0, 0, 3, 7, 4, 13, 16, 6, 0, 0, 0, 0, 8, 15, 5, 0, 0, 0, 0, 0, 12, 8, 0, 0, 0, 0, 0, 0, 7, 12, 0, 0, 0, 0, 0, 0, 4, 12, 0, 0, 0, 0, 1, 7, 12, 11, 0, 0, 0, 0, 3, 15, 12, 2, 0, 0, 0] }, { "sourceRow": 290, "digit": 6, "pixels": [0, 0, 0, 8, 15, 2, 0, 0, 0, 0, 6, 16, 5, 0, 0, 0, 0, 0, 12, 8, 0, 0, 0, 0, 0, 0, 13, 6, 0, 0, 0, 0, 0, 0, 12, 12, 16, 14, 0, 0, 0, 0, 14, 15, 6, 8, 11, 0, 0, 3, 12, 14, 5, 10, 13, 0, 0, 0, 0, 9, 16, 13, 5, 0] }, { "sourceRow": 185, "digit": 0, "pixels": [0, 0, 2, 15, 13, 0, 0, 0, 0, 0, 13, 16, 16, 9, 0, 0, 0, 5, 16, 9, 6, 16, 4, 0, 0, 5, 16, 3, 1, 14, 7, 0, 0, 6, 16, 4, 0, 16, 8, 0, 0, 3, 16, 12, 6, 16, 12, 0, 0, 0, 14, 16, 16, 16, 4, 0, 0, 0, 2, 13, 15, 8, 0, 0] }, { "sourceRow": 260, "digit": 4, "pixels": [0, 0, 0, 12, 4, 0, 0, 0, 0, 0, 6, 15, 2, 0, 0, 0, 0, 0, 16, 5, 0, 4, 4, 0, 0, 4, 15, 2, 3, 15, 9, 0, 0, 2, 15, 16, 16, 16, 4, 0, 0, 0, 2, 8, 16, 8, 0, 0, 0, 0, 0, 8, 15, 0, 0, 0, 0, 0, 0, 11, 9, 0, 0, 0] }, { "sourceRow": 239, "digit": 4, "pixels": [0, 0, 0, 0, 15, 9, 0, 0, 0, 0, 0, 8, 16, 5, 0, 0, 0, 0, 1, 16, 16, 5, 0, 0, 0, 0, 11, 16, 16, 1, 1, 0, 0, 6, 16, 16, 16, 15, 9, 0, 0, 7, 15, 16, 16, 10, 1, 0, 0, 0, 1, 7, 16, 1, 0, 0, 0, 0, 0, 1, 15, 5, 0, 0] }], "runs": [{ "k": 1, "seed": 7, "iterations": 6, "trainMse": 0.07214412726956479, "validationMse": 0.07280297762810437 }, { "k": 1, "seed": 19, "iterations": 6, "trainMse": 0.07214412726956489, "validationMse": 0.07280297804796376 }, { "k": 4, "seed": 7, "iterations": 192, "trainMse": 0.04040871277824657, "validationMse": 0.041899149163385656 }, { "k": 4, "seed": 19, "iterations": 207, "trainMse": 0.040408712822337434, "validationMse": 0.041899935779433586 }, { "k": 8, "seed": 7, "iterations": 261, "trainMse": 0.02475004181007092, "validationMse": 0.025548017870485402 }, { "k": 8, "seed": 19, "iterations": 448, "trainMse": 0.025147105358696256, "validationMse": 0.026315303314664616 }, { "k": 16, "seed": 7, "iterations": 575, "trainMse": 0.012295160150866928, "validationMse": 0.013547922081604519 }, { "k": 16, "seed": 19, "iterations": 560, "trainMse": 0.012729497371186178, "validationMse": 0.015288655568708278 }], "baselines": { "meanTestMse": 0.06999462363160687, "pcaTestMse": 0.019678463136677867, "nmfTestMse": 0.02538089143047506 }, "versions": { "python": "3.12.14", "numpy": "2.3.5", "sklearn": "1.9.1" } };
var comparison = { "role": "new predeclared rank6/seed23 controlled study; not recovered historical PCA8 factors", "versions": { "python": "3.12.14", "numpy": "2.3.5", "sklearn": "1.9.1" }, "datasetSha256": "d93f963c4b2610eb07122a312eec3ddceac18a031477370d71e33835eced728e", "fixedScale": 16, "rank": 6, "seed": 23, "settings": { "NMF": { "alpha_H": 0, "alpha_W": 0, "beta_loss": "frobenius", "init": "nndsvda", "l1_ratio": 0, "max_iter": 3e3, "n_components": 6, "random_state": 23, "shuffle": false, "solver": "cd", "tol": 1e-6, "verbose": 0 }, "PCA": { "copy": true, "iterated_power": "auto", "n_components": 6, "n_oversamples": 10, "power_iteration_normalizer": "auto", "random_state": null, "svd_solver": "full", "tol": 0, "whiten": false } }, "sourceIDs": { "train": [31, 228, 16, 2, 163, 176, 205, 100, 23, 37, 78, 83, 35, 276, 211, 196, 15, 24, 91, 294, 161, 33, 98, 252, 71, 70, 170, 281, 278, 96, 93, 240, 283, 267, 237, 165, 258, 52, 198, 57, 99, 189, 231, 126, 39, 125, 264, 133, 274, 249, 184, 199, 162, 44, 219, 243, 88, 247, 269, 104, 11, 110, 141, 293, 45, 300, 225, 178, 172, 181, 6, 287, 51, 101, 229, 77, 217, 134, 28, 142, 131, 155, 299, 298, 208, 285, 206, 69, 280, 279, 54, 250, 153, 94, 174, 173, 139, 282, 61, 66, 124, 209, 188, 204, 17, 18, 157, 216, 284, 160, 154, 34, 224, 200, 255, 90, 227, 4, 53, 262, 214, 215, 0, 238, 36, 158, 137, 111, 80, 65, 186, 117, 191, 82, 21, 128, 152, 30, 257, 230, 253, 12, 49, 234, 64, 164, 130, 288, 251, 320, 226, 268, 169, 138, 270, 3, 22, 190, 105, 135, 136, 9, 168, 55, 175, 25, 187, 275, 108, 109, 273, 166, 150, 151, 149, 314, 76, 212, 63, 156], "validation": [286, 106, 245, 218, 297, 210, 277, 223, 72, 233, 73, 143, 167, 46, 183, 86, 129, 241, 27, 301, 122, 114, 5, 48, 89, 14, 192, 195, 56, 254, 87, 271, 62, 116, 266, 235, 75, 79, 148, 115, 123, 171, 68, 201, 19, 50, 236, 112, 193, 263, 67, 92, 144, 146, 207, 42, 10, 81, 197, 32], "test": [242, 256, 40, 220, 132, 97, 1, 13, 43, 180, 120, 272, 244, 202, 95, 265, 102, 221, 248, 213, 145, 74, 58, 232, 222, 7, 179, 29, 261, 60, 246, 47, 194, 107, 119, 159, 38, 259, 177, 147, 306, 59, 84, 41, 140, 8, 203, 20, 182, 26, 85, 113, 118, 127, 121, 103, 290, 185, 260, 239] }, "dictionaryFitRows": 180, "reservedRows": 60, "selectionOnReservedRows": false, "nmfFitIterations": 229, "nmfCapReached": false, "warnings": [], "NMFTrainMSE": 0.03105257759330203, "NMFValidationMSE": 0.03196800008378407, "testMSE": { "mean": 0.06999462363160687, "PCA6": 0.02416372023704315, "NMF6": 0.030231907695106697 }, "predictionRanges": { "mean": [0, 0.7381944444444445], "PCA6": [-0.2351021064761421, 1.2007030976024105], "NMF6": [0, 1.1729489319699486] }, "PCAMean": [0, 0.029513888888888888, 0.33958333333333335, 0.6989583333333333, 0.7090277777777778, 0.3420138888888889, 0.06145833333333333, 0.003472222222222222, 0, 0.09583333333333334, 0.6069444444444444, 0.7381944444444445, 0.7114583333333333, 0.528125, 0.1125, 0.001736111111111111, 0, 0.12083333333333333, 0.5524305555555555, 0.4840277777777778, 0.5013888888888889, 0.515625, 0.1, 34722222222222224e-20, 0, 0.12881944444444443, 0.54375, 0.5625, 0.6079861111111111, 0.49756944444444445, 0.121875, 0, 0, 0.1375, 0.5493055555555556, 0.6076388888888888, 0.6684027777777778, 0.5256944444444445, 0.16180555555555556, 0, 0, 0.09409722222222222, 0.4722222222222222, 0.5114583333333333, 0.5715277777777777, 0.5069444444444444, 0.1954861111111111, 34722222222222224e-20, 0, 0.03611111111111111, 0.44375, 0.6194444444444445, 0.675, 0.5128472222222222, 0.18611111111111112, 0.004166666666666667, 0, 0.028819444444444446, 0.36666666666666664, 0.7041666666666667, 0.6895833333333333, 0.3871527777777778, 0.09895833333333333, 0.0024305555555555556], "PCAComponents": [[-33132898708546138e-34, 0.005277654789790365, 0.04053901574965385, 0.1498489908026328, -0.0834865121888535, -0.1768454928480726, -0.041549751446625, -0.0017742387068939054, 1734723475976807e-33, 0.04099177980797918, 0.17872989180997959, 0.1880935797949868, -0.1383597824319974, -0.25559482401020567, -0.09151691383658123, -8871193534469528e-19, -0, 0.07742842567369854, 0.3220429091775396, 0.007635687280096971, -0.2549571561944226, -0.2616965260791956, -0.04864200011356242, -17719182322192218e-20, -7346839692639297e-55, 0.062410234392432484, 0.20811379620454554, -0.07053822991137354, -0.32156877185560123, -0.22791095563134517, 0.010994079757923006, -0, -0, 0.0404696605681111, 0.18128635053865705, 0.07744353308369913, -0.17287329894338724, -0.1695363781740072, 6493377892784474e-19, -0, -0, 0.020137380726389983, 0.22827939143826692, 0.15893849284675812, -0.09308590197637462, -0.0688059797549237, 0.07261233458014531, 591328395463989e-18, -0, 0.009730175874001564, 0.223484064373511, 0.18418782755492083, -0.05917483667704724, -0.035220131659719864, 0.11372654427418787, 0.0037250224636949485, -0, 0.0032681503572003752, 0.03539410484158261, 0.13398870967217713, 0.053220154308792136, -0.0018924390456532003, 0.03859717345436672, 46531671023456594e-20], [13646861665046388e-34, 0.04124407698171508, 0.31435064493311815, 0.25745626929220555, 0.0025547203665827606, 0.07645938788691076, 0.0287310436292621, 9416624573330701e-19, 11102230246251565e-32, 0.09940670453069331, 0.33687838669309134, -0.0032141712575380122, -0.047496169722083835, 0.15353679068234283, 0.05481103112461387, 47083122866657803e-20, -0, 0.08592437348576733, 0.060423824387256526, -0.2941958235832895, -0.0706476532173159, 0.09554568566978289, 0.026154050966085432, 5110168413541348e-20, -752316384526264e-51, -0.004684983964151663, -0.13242430483273382, -0.1230346499523098, 0.0684421305532749, -0.0020138076314868, -0.027037249857373335, -0, -0, -0.1000763126770575, -0.28400576218181794, -0.17226719038360705, -0.11769878684375779, -0.07772071206360208, -0.04066595001400981, -0, -0, -0.06919326833347403, -0.24395463426984249, -0.21013786200072535, -0.1716053360298983, -0.07332359527225067, -0.03590153307875326, -5336747673856243e-19, -0, 0.010255123592868965, 0.0930263007106945, 0.04287563248681283, -0.06163083938881593, -0.003575753187303799, -0.03404905814252626, -0.004221282120070291, -0, 0.040851872799346496, 0.32871636096883855, 0.2786227739649501, -0.12624935785680846, -0.13313858933919642, -0.026929567628148573, 0.0013191431056742559], [9160490825731862e-33, -0.030790780580410737, -0.09872543136720258, 0.0016975293208899983, -0.12128057786201812, -0.1604075529313514, -0.05167326840633876, -0.005061144222835573, -5551115123125783e-32, -0.053338768190196464, -0.009123257477003639, -0.003772478308803578, 0.017665069531409006, 0.003928799272166904, -0.044712924786677544, -0.0025305721114178125, 0, -0.02205199914727499, 0.08067681488189694, 0.06630888974985344, 0.0033349653608607884, 0.18359912015216542, 0.01577744668277753, -573546009371511e-18, 0, 0.006148910127796265, 0.026290554611379, -0.07320242745136991, -0.09214606638431802, 0.1582464259603992, 0.046678479886482216, 0, 0, 0.007181107885439454, -0.06690264993090625, -0.33172238786060176, -0.23462549600180177, 0.186490099053585, 0.0745658651468825, 0, 0, 0.0134964857068984, 0.05618689709950184, -0.27532494213348335, -0.30184669598971364, 0.2944843551669039, 0.22152642311398354, 15048538708082034e-20, 0, 0.00511263207071271, 0.10867655098224402, -0.13612784679513013, -0.07608404446506162, 0.3872558811605339, 0.1928836467485924, 0.002214000721372999, 0, -0.030895436464479197, -0.10586621629383346, 0.005205179576541135, 0.22621429849981634, 0.22174224079030877, 0.04314593792241845, 9772109133482747e-19], [8305772267981417e-33, -0.009257597095400194, 0.058337176497891524, 0.0569556606718678, -0.12084160470540654, -0.17758172633904146, -0.08591755289861847, -0.009429592100805365, -27755575615628914e-33, 0.025844233952217174, -0.017310416264078244, 0.012740459947993645, 0.08104337599452947, -0.15978487301026462, -0.11412131029719616, -0.004714796050402701, -5293955920339377e-38, -0.030169857187460777, -0.12782240912799467, 0.1351350447154908, 0.31894151942007437, -0.11583664589313454, -0.10507148075478127, 3169466302828733e-19, -30814879110195774e-49, -0.1294431502537366, -0.28859299637858776, 0.18074914941882006, 0.2966785996782144, -0.2324816479636147, -0.14318807618946774, -0, -0, -0.13139060293249513, -0.24785059364950188, 0.11485916105423627, 0.08799128527656708, -0.24285962888761595, -0.14632047008752538, -0, -0, -0.01857597227882391, 0.03363357782526428, 0.08312322432825396, -0.15507711957648493, -0.136409427279193, 0.024614825851467452, 14412059622460354e-20, -0, 0.012853211587176066, 0.1660092331812648, 0.05426392112975374, -0.12926732922295545, 0.06994761763171081, 0.15554768311894762, 0.005105992747101789, -0, -0.012245195672674595, 0.04726625278500722, 0.010057786968972337, 0.14931795763831518, 0.28530682448191286, 0.14847775908058825, 0.004925659210179605], [-7617406505547474e-34, 0.04431397300552223, 0.12046761748964697, -0.08628417481764347, -0.01600502564139024, 0.05401835122293207, -0.024550513041515967, -0.016038180342020113, 13877787807814457e-33, 0.06826330631889352, -0.009419471980057215, -0.07393301165332788, -0.026451313032751417, -0.10259598745178061, -0.05475942042953021, -0.00801909017101013, 5421010862427522e-35, 0.0728444308058822, 0.23432327527729022, 0.20640165909663422, 0.03444389769505422, -0.2851940698429717, -0.09842614793722745, -2691860166769189e-19, -10097419586828951e-44, 0.08341304635628331, 0.38510996328597413, 0.3780026296129908, 0.06049433847150633, -0.21422113918659344, -0.08469805409344602, -0, -0, -0.027625417612456158, -0.0846047604225456, -0.0943103040054451, -0.02002377034119922, -0.02338384332742409, -0.11345599683898464, -0, -0, -0.0971537599525964, -0.36922857764263756, -0.24827153512258412, 0.13859206658985826, 0.18613856820056018, -0.002074247204833894, 37463516853442844e-20, -0, -0.011147088586383806, -0.1577189348335685, -0.1944590450231104, 0.12666735641921387, 0.056465252849374176, 0.003336253205064047, 0.002405591227820999, -0, 0.036528330929487186, 0.11056543290468901, -0.03605547699823606, 0.06871625993425977, -0.026502375697591656, -0.058213363645763724, 6592386540907602e-19], [1726505716539243e-32, -0.021674363742884728, 0.027683918614822833, 0.13249823379165254, -0.1731019207945083, -0.32461455689278834, -0.0431423220016387, 0.0014831535038091481, -5551115123125783e-32, -0.050412929062106676, 0.038218871494198774, 0.14027828386429375, 0.01946695766789404, -0.34575068740483184, -0.1299914336987734, 7415767519045411e-19, -4336808689942018e-34, -0.06827203856564439, -0.08031946085049486, -0.0211020995869796, 0.09035005949247663, -0.2082875817977635, -0.08240210145930814, 0.001019713625141719, 6462348535570529e-42, -0.017042868407973664, -0.0911261290304148, -0.06410056619970637, 0.10874816958088293, 0.14221230283035516, 0.09869146668057573, -4092601131822876e-49, 14293785611083658e-47, 0.08393882102183031, 0.032146652987579814, -0.006411430224422678, 0.08649943847033424, 0.4083292216788741, 0.19206843909445054, 17230333765254961e-47, 9147852573233073e-47, -0.04203411678065793, -0.22185392344091723, 0.011336169404147747, -0.05443871702740398, 0.006182435511651109, 0.1336613678103854, -22548865257162101e-20, -22430681693697178e-48, -0.06352853717268955, -0.30179423438382535, -0.0036729061434291987, -0.23799865590542627, -0.21074459485056732, 0.08691062046857452, 0.002021276506717245, -0, -0.014109829320091534, 0.02588541801253373, 0.06750079983576242, -0.12187711899857338, -0.2062465334628256, -0.03644610048446779, 0.004399214191171452]], "NMFDictionary": [[0, 0, 0, 1.5441604239500797, 1.9012605676654932, 0, 0, 0.05080972355086669, 0, 0, 0.3029069175921904, 3.112461166043084, 1.0702946398886408, 0, 0, 0.025404861775433343, 0, 0, 0, 0.7160712143784093, 0, 0, 0, 0.002698306125369652, 0, 0, 0, 0, 0, 0, 0.05409496348256024, 0, 0, 0.4939804774344226, 3.4722482526873244, 5.41768520707558, 3.074780665828962, 0, 0.2761969893919824, 0, 0, 1.0386473916560512, 5.05980945742773, 6.227970343843308, 2.347029476271315, 0, 0, 0.002143229400795195, 0, 0.0800235387575903, 1.5722156228392756, 4.109973481173683, 0.9861873934277893, 0, 0, 0.01933768294641416, 0, 0, 0, 1.1057980783692247, 0.6395226166829707, 0.19220520903908203, 0.5127078613087577, 0], [0, 0, 0, 0.38762067145632323, 2.3474879186173485, 2.123718672561504, 0.5525655189020865, 0.0362210128546993, 0, 0, 0.05139936781392952, 0.16506025469835134, 1.6674889350843043, 3.952650096955814, 1.21286935462243, 0.01811050642734965, 0, 0, 0, 0, 0.7931637514350768, 4.342132110293485, 1.0661456514389451, 0, 0, 0, 0, 0, 1.5229700728131597, 4.050651215299685, 0.5509012592651022, 0, 0, 0.04163190315854878, 0.032592750275335196, 0, 1.8699627803404546, 3.0975537131110236, 0.7779345635558496, 0, 0, 0.09420826910556371, 0, 0, 1.602340397888248, 1.967534670742872, 0, 0, 0, 0, 0, 0, 1.9154784606157262, 1.431687063134114, 0, 0, 0, 0, 0, 0.6899947532113914, 0.44335172528884287, 0, 0, 0], [0, 0.2389733324319533, 2.2911992545194093, 2.5321424244835393, 0.8525930064946209, 0.41703188061996177, 0.06010393795753839, 0, 0, 0.7321228974256263, 2.8081336837491992, 1.332052343644085, 0.6368404072418592, 0.7653289078404563, 0.08782730081042157, 0, 0, 0.5790882312296229, 1.0581956130953414, 0, 0.20407040067179366, 0.08171871643314522, 0, 0.0010341218391138093, 0, 0.005412453824751077, 0.005458287799448128, 0.32441203468496044, 0.970043996522572, 0, 0, 0, 0, 0, 0, 0.5876574106546391, 0.3486422987010374, 0, 0, 0, 0, 0, 0, 0.1780113322262794, 0, 0, 0, 0, 0, 0.10496122160812589, 1.1185694188987667, 1.5011755956978223, 0.5031169659031816, 0, 0, 0, 0, 0.23747008026311148, 2.4193188142072475, 2.618801190537946, 0.1781200599939386, 0, 0, 0.004533816520297242], [0, 0, 0.1389811298558834, 1.0840240762016207, 0.3243112854620603, 0, 0, 0, 0, 0, 1.0686817172983392, 1.172354652797822, 0.47112581166894024, 0.0566514594961498, 0, 0, 0, 0.2147591263869748, 1.5937409067195525, 0.6559077344707882, 0, 0.42340857952005717, 0.04872994768288849, 0, 0, 0.3592310085428092, 1.4021949463678176, 0.31981325253744397, 0, 0.4743016355455848, 0.33587044098936625, 0, 0, 0.3249509579876858, 0.9253566618642607, 0, 0, 0.7228225806980438, 0.39913571045002705, 0, 0, 0.13999172565033086, 0.9174489780411313, 0, 0, 1.1028325148993243, 0.8859182703523643, 0.0017372490440941142, 0, 0.05806114617331466, 1.084885129867727, 0.6552697369031286, 0.4845527562122459, 1.2886516165760233, 0.8279673826124611, 0.013516568368700072, 0, 0, 0.1757108263965794, 1.0741117264318603, 1.3601840401581817, 0.8110364858805509, 0.16872752994870158, 0.001896673476734329], [0, 0.039127172404162185, 0, 0, 0.7975514901085256, 0.5553996526083441, 0.07547893395322529, 0, 0, 0.01436103234736893, 0, 0.40093720844021674, 0.3469729449296081, 0.18987505100954583, 0.032868825443909705, 0, 0, 0.10018028994812345, 0.8016789205320481, 0.6075213983966253, 0, 0, 0, 0, 0, 0.3985868617092363, 1.591349066334724, 0.8846906402577438, 0, 0.16596821283609015, 0.09797355553833445, 0, 0, 0.2958527952336611, 0.8999185915595669, 0.6823842117558109, 0.6155742041557309, 0.3726728594008783, 0.06525278111249773, 0, 0, 0, 0, 0.3792344138423594, 1.3596693644905413, 0.343982893467243, 0, 4669160363354797e-19, 0, 0, 0, 0.09005467010486258, 1.042368491457036, 0, 0, 0.0017399116841953258, 0, 0.027593079077030024, 0, 0, 0.3752472143603953, 0, 0, 0], [0, 0, 0, 0.03790695948707647, 0.07380037594508963, 0, 0, 0, 0, 0, 0, 0.17068066962683606, 1.0879941589969233, 0, 0, 0, 0, 0, 0, 1.0771356976561621, 1.8475654965166224, 0.15730005620658963, 0, 46816094700962384e-20, 0, 0, 0, 1.3234344308517165, 1.5578498099075073, 0.01263741848283129, 0, 0, 0, 0, 0, 0.1255178754170663, 0.5295254920388891, 0.19300423547812778, 0, 0, 0, 0, 0, 0, 0, 0.39418510479433255, 0.2660899874914557, 0, 0, 0.03613889636105242, 0.08294423206394859, 0, 0.2822447866897281, 0.8259927157535538, 0.30931462848306984, 0.0049537497438792025, 0, 0, 0, 0, 1.2304607053116068, 1.1665913067645528, 0.22849634963551235, 0.008087822781391562]], "selected": [{ "source_row": 242, "label": 8, "reserved_position": 0, "observed": [0, 0, 0.125, 0.75, 0.75, 0, 0, 0, 0, 0, 0.4375, 1, 0.9375, 0.5625, 0.0625, 0, 0, 0, 0.375, 0.875, 0.8125, 0.9375, 0.1875, 0, 0, 0, 0.0625, 1, 1, 0.25, 0, 0, 0, 0, 0.4375, 1, 0.875, 0, 0, 0, 0, 0.0625, 0.9375, 0.5625, 1, 0.3125, 0, 0, 0, 0.125, 0.8125, 0.8125, 1, 0.625, 0, 0, 0, 0, 0.0625, 0.6875, 0.75, 0.3125, 0, 0], "mean": [0, 0.029513888888888888, 0.33958333333333335, 0.6989583333333333, 0.7090277777777778, 0.3420138888888889, 0.06145833333333333, 0.003472222222222222, 0, 0.09583333333333334, 0.6069444444444444, 0.7381944444444445, 0.7114583333333333, 0.528125, 0.1125, 0.001736111111111111, 0, 0.12083333333333333, 0.5524305555555555, 0.4840277777777778, 0.5013888888888889, 0.515625, 0.1, 34722222222222224e-20, 0, 0.12881944444444443, 0.54375, 0.5625, 0.6079861111111111, 0.49756944444444445, 0.121875, 0, 0, 0.1375, 0.5493055555555556, 0.6076388888888888, 0.6684027777777778, 0.5256944444444445, 0.16180555555555556, 0, 0, 0.09409722222222222, 0.4722222222222222, 0.5114583333333333, 0.5715277777777777, 0.5069444444444444, 0.1954861111111111, 34722222222222224e-20, 0, 0.03611111111111111, 0.44375, 0.6194444444444445, 0.675, 0.5128472222222222, 0.18611111111111112, 0.004166666666666667, 0, 0.028819444444444446, 0.36666666666666664, 0.7041666666666667, 0.6895833333333333, 0.3871527777777778, 0.09895833333333333, 0.0024305555555555556], "PCA6": [-5714505026379849e-33, 0.010315371400982046, 0.21413378004056632, 0.5459953039622931, 0.7757685750471742, 0.42139256983693824, 0.03958781704428483, 0.0024556314062898557, -28403522472947597e-33, 0.08584143731513907, 0.37604450474155454, 0.6583034629206216, 0.825173135120209, 0.598801194322239, 0.11979011402474665, 0.0012278157031449443, 20990364634985422e-35, 0.05703924027588912, 0.2703230323554729, 0.6475045216668123, 0.7982735237368772, 0.5652945001441947, 0.08243653872075479, 4231426484940594e-19, -33679024686044546e-43, -0.012455254225620022, 0.22588145398802667, 0.7238360276950319, 0.8576913934851429, 0.29176114435757494, -0.028933714106123345, 2154551388582862e-49, -752496875324592e-46, 0.029454652634336012, 0.4774967523308831, 0.9418380994968882, 0.898764912773996, 0.11695376374262073, -0.033813459804789475, -9070915621611308e-47, -48158903908214123e-48, 0.15639807658030283, 0.7804371578413638, 0.8371796194755361, 0.6570270215145126, 0.25506510840558055, 0.05241111963297748, 5088293653162718e-19, 11808640723433936e-48, 0.07455899129268306, 0.6494750636806359, 0.7252499660719293, 0.726425889339318, 0.5088076633772279, 0.17527596406271514, 0.006696627654389681, 0, 0.006520843749694024, 0.23375850232076434, 0.5218862982366157, 0.8057561989490194, 0.7104773265433686, 0.24582159582164026, 0.0028006985869169186], "NMF6": [0, 0.038542358145215866, 0.31888104022359753, 0.6439370091785646, 0.759566601469079, 0.3373920390951047, 0.07118291561156047, 0.01050989532050747, 0, 0.10289116278652169, 0.4596378009822253, 0.7957004494881501, 0.9394107729178276, 0.5063555880633323, 0.1310547120655265, 0.005254947660253735, 0, 0.09934569607388584, 0.29954115351009797, 0.6823061403983399, 0.9244194847656744, 0.5003531615218783, 0.10158425535130881, 727584237004824e-18, 0, 0.06677926660212292, 0.26361860696684214, 0.7682673521334213, 0.9698013192167234, 0.4224332387396139, 0.08163977576165267, 0, 0, 0.1233539349822272, 0.6400194819114509, 0.9918760680700417, 0.9777936606709756, 0.44862435470893347, 0.13086628094736047, 0, 0, 0.15735541024999558, 0.7290151890902906, 0.9492105284782633, 0.6745320881494521, 0.4366936361937262, 0.1396831291841614, 40851199157336434e-20, 0, 0.04310514297913753, 0.4367298471892713, 0.8096919357237693, 0.6747062924757767, 0.5332160968907882, 0.15750847208471191, 0.005480830259395355, 0, 0.03667503130969009, 0.33741021886361044, 0.6060092840982038, 0.7896192720490767, 0.5651857762948261, 0.17730951334748107, 0.004266755413830303], "PCA6_coordinates": [-0.23779873919888678, -0.4780452673327731, -0.42258691260270836, 0.8249965888782711, -0.3387584714756587, -0.526450372070148], "NMF6_amounts": [0.139709373461349, 0.09418015700322843, 0.1377144797289649, 0.024102026912130786, 0.14394779009518485, 0.44470182552051124], "rowMSE": { "mean": 0.04595146273389275, "PCA6": 0.021948620787064027, "NMF6": 0.026957889373735507 } }, { "source_row": 256, "label": 0, "reserved_position": 1, "observed": [0, 0, 0.25, 0.6875, 0.9375, 0.5, 0, 0, 0, 0, 0.8125, 1, 0.6875, 0.8125, 0.4375, 0, 0, 0.1875, 1, 0.75, 0, 0.25, 0.5, 0, 0, 0.375, 1, 0.3125, 0, 0.25, 0.5, 0, 0, 0.4375, 0.5625, 0, 0, 0.5625, 0.4375, 0, 0, 0.25, 0.625, 0, 0.125, 0.9375, 0.125, 0, 0, 0.0625, 1, 0.75, 0.875, 0.625, 0, 0, 0, 0, 0.25, 0.875, 0.875, 0.0625, 0, 0], "mean": [0, 0.029513888888888888, 0.33958333333333335, 0.6989583333333333, 0.7090277777777778, 0.3420138888888889, 0.06145833333333333, 0.003472222222222222, 0, 0.09583333333333334, 0.6069444444444444, 0.7381944444444445, 0.7114583333333333, 0.528125, 0.1125, 0.001736111111111111, 0, 0.12083333333333333, 0.5524305555555555, 0.4840277777777778, 0.5013888888888889, 0.515625, 0.1, 34722222222222224e-20, 0, 0.12881944444444443, 0.54375, 0.5625, 0.6079861111111111, 0.49756944444444445, 0.121875, 0, 0, 0.1375, 0.5493055555555556, 0.6076388888888888, 0.6684027777777778, 0.5256944444444445, 0.16180555555555556, 0, 0, 0.09409722222222222, 0.4722222222222222, 0.5114583333333333, 0.5715277777777777, 0.5069444444444444, 0.1954861111111111, 34722222222222224e-20, 0, 0.03611111111111111, 0.44375, 0.6194444444444445, 0.675, 0.5128472222222222, 0.18611111111111112, 0.004166666666666667, 0, 0.028819444444444446, 0.36666666666666664, 0.7041666666666667, 0.6895833333333333, 0.3871527777777778, 0.09895833333333333, 0.0024305555555555556], "PCA6": [-12529979169509638e-33, 0.05222771050074658, 0.34435208840096554, 0.7583742726132155, 0.752081055456771, 0.4529422227440437, 0.09800278471741292, 0.0033323865427158615, 51680403120737696e-33, 0.133202508637625, 0.8484193452039361, 0.7849176217501572, 0.49923994456680615, 0.6929653904644921, 0.19015812451208247, 0.0016661932713579442, 24416580259850917e-35, 0.27655921117787313, 1.1259632743458496, 0.37200941577389046, -0.08989691665547972, 0.6470620213093581, 0.20949298180534995, -0.0011777840822953579, -3483135736839424e-42, 0.3413208120822841, 1.1179448271544774, 0.3403242561255946, -0.05432693318644477, 0.5501291207171329, 0.233366525478396, 2191898811947016e-49, -7655408062012817e-47, 0.226131353993576, 0.7670745994653816, 0.2113553779705088, 0.1565596508861502, 0.5351485543442018, 0.23023872565697873, -922815268163969e-46, -48993699950928475e-48, 0.1197989651870157, 0.6334008094532402, 0.20543518974402336, 0.40760782157938463, 0.8436709103424374, 0.329263007843305, 8464350102360457e-19, 12013334056250361e-48, 0.0702467321033996, 0.7069427871443277, 0.5777533752829943, 0.8292799945763665, 0.8559784206805165, 0.2253433992676203, 0.0020246692569409184, 0, 0.046919552608222365, 0.37581639538445816, 0.8530631706912167, 0.8095009779494581, 0.34343960195109724, 0.01517368406677018, -0.0031296238480530434], "NMF6": [0, 0.03677660461826036, 0.33722075288026054, 0.858617879622351, 0.6167183032532997, 0.3330993931831034, 0.06567837986680121, 0.0028435469284298614, 0, 0.08928781291359199, 0.8557170346481712, 0.8355436670902588, 0.5099164774214954, 0.4593048576632334, 0.10954541053800067, 0.0014217734642149307, 0, 0.19500012355677265, 1.0790431049476172, 0.45576095018168017, 0.08412037366348452, 0.5451392050795008, 0.10456611663898442, 1268330996887128e-19, 0, 0.2640871477959411, 1.036849795106559, 0.39011293444765854, 0.2295241291920242, 0.5750242550750617, 0.22730586377919484, 0, 0, 0.228082191871189, 0.659703161660993, 0.23079530381281424, 0.32509356668152783, 0.6697404716441742, 0.26853312159457704, 0, 0, 0.07739041063268667, 0.45701496632966926, 0.1170010347272782, 0.4272959280356322, 0.7629809466935046, 0.431875253160913, 9544990499071533e-19, 0, 0.040803197008705015, 0.6634602772605407, 0.523882360931654, 0.6734734588841605, 0.7367210698544289, 0.4036248432177747, 0.007012086693308598, 0, 0.03404377503910752, 0.3701942701116121, 0.8860504589649743, 0.8020200738715988, 0.3957423060476064, 0.08324265670356072, 0.0014578313783657434], "PCA6_coordinates": [0.8237331046796642, 0.31723563303664704, 0.8222278385763834, -1.0056235064948278, 0.21847427557562557, -0.5355759677881747], "NMF6_amounts": [0.001930674609957873, 0.07579715940701616, 0.11761046325720487, 0.48748882105020747, 0.22160661637532345, 0], "rowMSE": { "mean": 0.06796480908805942, "PCA6": 0.024197862895577522, "NMF6": 0.03327840298161405 } }] };

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/SavedDataFigures.jsx
import { Fragment as Fragment4, jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function savedRow(source) {
  const i = saved.test.findIndex((r) => r.sourceRow === Number(source));
  if (i < 0) throw Error("Unknown saved source ID");
  const row = saved.test[i], w = saved.activations[i], parts = saved.dictionary.map((h, c) => h.map((v) => v * w[c])), prediction = Array.from({
    length: 64
  }, (_, j) => parts.reduce((s, p) => s + p[j], 0));
  return {
    row,
    w,
    parts,
    prediction,
    observed: row.pixels.map((v) => v / 16)
  };
}
var mse = (a, b) => a.reduce((s, v, j) => s + (v - b[j]) ** 2, 0) / a.length;
function Pixels({
  values,
  label,
  min = 0,
  max = 4,
  signed = false,
  selected,
  component
}) {
  if (values.some((v) => !Number.isFinite(v) || v < min - 1e-10 || v > max + 1e-10)) throw Error(`Image outside declared ruler: ${label}`);
  return /* @__PURE__ */ jsxs5("figure", { className: "nmf-image", children: [
    /* @__PURE__ */ jsx5("p", { className: "nmf-object-label", style: component !== void 0 ? {
      color: colors[component]
    } : void 0, children: label }),
    /* @__PURE__ */ jsx5("div", { className: "nmf-pixels", role: "group", "aria-label": `${label}; eight rows, eight columns; feature index8r+c`, tabIndex: 0, children: values.map((v, j) => {
      const fraction = (v - min) / (max - min), grey = Math.round(12 + 230 * fraction), background = signed ? v < 0 ? `color-mix(in srgb, #ee8faf ${100 * Math.abs(v) / Math.abs(min)}%, #101923)` : `color-mix(in srgb, #7bb7ff ${100 * v / max}%, #101923)` : `rgb(${grey},${grey},${grey})`;
      return /* @__PURE__ */ jsx5("span", { role: "img", "aria-label": `row${Math.floor(j / 8)}, column${j % 8}, F${j}: ${v}`, title: `r${Math.floor(j / 8)} c${j % 8} F${j}: ${v}`, style: {
        background,
        outline: selected === j ? "2px solid white" : void 0,
        outlineOffset: "-2px"
      } }, j);
    }) }),
    /* @__PURE__ */ jsxs5("div", { className: "nmf-pixel-ruler", role: "img", "aria-label": `Shared intensity ruler ${min} to ${max}; zero at ${100 * (0 - min) / (max - min)} percent`, style: {
      background: signed ? "linear-gradient(to right,#ee8faf,#101923 50%,#7bb7ff)" : "linear-gradient(to right,rgb(12,12,12),rgb(242,242,242))"
    }, children: [
      /* @__PURE__ */ jsx5("span", { className: "nmf-ruler-min", children: min }),
      min < 0 && /* @__PURE__ */ jsx5("span", { className: "nmf-ruler-zero", style: {
        left: `${100 * (0 - min) / (max - min)}%`
      }, children: "0" }),
      /* @__PURE__ */ jsx5("span", { className: "nmf-ruler-max", children: max })
    ] }),
    /* @__PURE__ */ jsxs5("figcaption", { children: [
      "Intensity ruler ",
      min,
      " \u2192 ",
      max,
      min < 0 ? " \xB7 zero separates negative and positive values" : "",
      ". ",
      signed ? "Rose negative; blue positive." : "Dark low, light high."
    ] })
  ] });
}
function Dictionary() {
  return /* @__PURE__ */ jsx5(Figure, { id: "D42", caption: "The original saved k8/seed19 dictionary contains eight complete64-bin patterns, trained on180 rows. Each panel has the same0\u20134 per-unit pattern ruler. C1\u2013C8 are display IDs for these eight stored rows, with no semantic source label.", children: /* @__PURE__ */ jsx5("div", { className: "nmf-image-grid", children: saved.dictionary.map((h, c) => /* @__PURE__ */ jsx5(Pixels, { label: `C${c + 1} \xB7 original saved pattern`, values: h, component: c }, c)) }) });
}
function SavedContribution() {
  const [source, setSource] = scenarioState("242"), [component, setComponent] = scenarioState("0"), [gain, setGain] = scenarioState(1), s = savedRow(source), c = Number(component), part = s.parts[c].map((v) => v * gain), other = s.prediction.map((v, j) => v - s.parts[c][j]), prediction = other.map((v, j) => v + part[j]), residual = s.observed.map((v, j) => v - prediction[j]);
  return /* @__PURE__ */ jsxs5(Figure, { id: "D43", caption: "The complete contribution is amount \xD7 all64 pattern bins. Gain changes only this saved amount; all other addends stay fixed. This is an intervention in a recorded decomposition, without refitting.", children: [
    /* @__PURE__ */ jsxs5("div", { className: "nmf-image-grid", children: [
      /* @__PURE__ */ jsx5(Pixels, { label: `Source${source} \xB7 observed digit${s.row.digit}`, values: s.observed }),
      /* @__PURE__ */ jsx5(Pixels, { label: `C${c + 1} \xB7 per-unit pattern`, values: saved.dictionary[c], component: c }),
      /* @__PURE__ */ jsx5(Pixels, { label: `C${c + 1} \xB7 weighted addend`, values: part, component: c }),
      /* @__PURE__ */ jsx5(Pixels, { label: "Current complete reconstruction", values: prediction }),
      /* @__PURE__ */ jsx5(Pixels, { label: "Observed minus reconstruction", values: residual, min: -4, max: 4, signed: true })
    ] }),
    /* @__PURE__ */ jsx5(Bars, { label: "Original saved amounts \xB7 stable component IDs", values: s.w, ids: s.w.map((_, i) => `C${i + 1}`), component: true, max: 1 }),
    /* @__PURE__ */ jsxs5(Controls, { onReset: () => {
      setSource("242");
      setComponent("0");
      setGain(1);
    }, children: [
      /* @__PURE__ */ jsx5(Select, { label: "Saved source ID", value: source, onChange: setSource, options: ["242", "256"] }),
      /* @__PURE__ */ jsx5(Select, { label: "Component", value: component, onChange: setComponent, options: s.w.map((_, i) => ({
        value: String(i),
        label: `C${i + 1}`
      })) }),
      /* @__PURE__ */ jsx5(Range, { label: "Selected amount gain", value: gain, onChange: setGain, max: 2, step: 0.1 })
    ] }),
    /* @__PURE__ */ jsxs5(Result, { children: [
      "Source",
      source,
      ", C",
      c + 1,
      ": original amount ",
      fmt(s.w[c]),
      ", edited amount ",
      fmt(gain * s.w[c]),
      ", contribution sum ",
      fmt(part.reduce((a, b) => a + b, 0)),
      ", MSE ",
      fmt(mse(s.observed, prediction)),
      ". ",
      s.w[c] === 0 ? "This saved amount is zero; its intervention remains a genuine zero-change case." : gain === 0 ? "Only the selected complete addend is removed." : "No fit or other amount changes."
    ] })
  ] });
}
function SavedRanking() {
  const s = savedRow(256), totals = s.parts.map((p) => p.reduce((a, b) => a + b, 0)), maxTotal = Math.max(...totals);
  return /* @__PURE__ */ jsxs5(Figure, { id: "D44", caption: "Source256 has largest raw coefficient C7 but largest total contributed intensity C8. Per-bin addends, rather than coefficients alone, determine the image. Sixteen of the60 reserved rows have different rankings.", children: [
    /* @__PURE__ */ jsxs5(Panels, { children: [
      /* @__PURE__ */ jsx5(Bars, { label: "Saved amounts \xB7 factor units", values: s.w, ids: s.w.map((_, i) => `C${i + 1}`), component: true, max: 1 }),
      /* @__PURE__ */ jsx5(Bars, { label: "Total addend intensity \xB7 summed64 bins", values: totals, ids: s.w.map((_, i) => `C${i + 1}`), component: true, max: 8 }),
      /* @__PURE__ */ jsx5(Pixels, { label: "C7 weighted pattern", values: s.parts[6], component: 6 }),
      /* @__PURE__ */ jsx5(Pixels, { label: "C8 weighted pattern", values: s.parts[7], component: 7 })
    ] }),
    /* @__PURE__ */ jsx5(Table, { caption: "Exact saved ranking values", headers: ["Component", "Amount", "Total intensity"], rows: s.w.map((v, i) => [`C${i + 1}`, v, totals[i]]) })
  ] });
}
function Removal() {
  const [gain, setGain] = scenarioState(1), s = savedRow(256), part = s.parts[7], current = s.prediction.map((v, j) => v + (gain - 1) * part[j]);
  return /* @__PURE__ */ jsxs5(Figure, { id: "D45", caption: "Remove or restore the complete C8 addend from source256 with all other amounts fixed. This is the displayed decomposition's counterfactual, not retraining. Source242's saved C8 amount is zero, so its analogous removal changes nothing.", children: [
    /* @__PURE__ */ jsxs5("div", { className: "nmf-image-grid", children: [
      /* @__PURE__ */ jsx5(Pixels, { label: "Source256 observed", values: s.observed }),
      /* @__PURE__ */ jsx5(Pixels, { label: "Original saved reconstruction", values: s.prediction }),
      /* @__PURE__ */ jsx5(Pixels, { label: "C8 complete addend", values: part, component: 7 }),
      /* @__PURE__ */ jsx5(Pixels, { label: "Current reconstruction", values: current }),
      /* @__PURE__ */ jsx5(Pixels, { label: "Current signed residual", values: s.observed.map((v, j) => v - current[j]), min: -4, max: 4, signed: true })
    ] }),
    /* @__PURE__ */ jsx5(Controls, { onReset: () => setGain(1), children: /* @__PURE__ */ jsx5(Range, { label: "Retained fraction of C8 amount", value: gain, onChange: setGain, max: 1, step: 0.1 }) }),
    /* @__PURE__ */ jsxs5(Result, { children: [
      "Gain ",
      fmt(gain),
      "; MSE ",
      mse(s.observed, current),
      ". Original ",
      mse(s.observed, s.prediction),
      "; removed ",
      mse(s.observed, s.prediction.map((v, j) => v - part[j])),
      ". Removed total intensity ",
      fmt((1 - gain) * part.reduce((a, b) => a + b, 0)),
      "."
    ] })
  ] });
}
function Partitions() {
  return /* @__PURE__ */ jsxs5(Figure, { id: "D46", caption: "Source IDs and digit labels are metadata, separate from64 fitting columns. The known/16 measurement ruler is fixed. Only training rows fit dictionaries; validation compares candidates and reserved rows use frozen transforms. No writer IDs are supplied.", children: [
    /* @__PURE__ */ jsxs5(Panels, { children: [
      /* @__PURE__ */ jsx5(Matrix, { label: "Reserved metadata \xB7 never fitting features", values: [[242, 8], [256, 0]], columns: ["Source ID", "Digit label"] }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Reserved fitting features \xB7 all64 pixel columns", values: saved.test.slice(0, 2).map((r) => r.pixels.map((v) => v / 16)), rows: ["Source242", "Source256"] }),
      /* @__PURE__ */ jsxs5("div", { children: [
        /* @__PURE__ */ jsx5("p", { children: "180 training rows \u2192 dictionary fit" }),
        /* @__PURE__ */ jsx5("p", { children: "60 validation rows \u2192 frozen dictionary transform \u2192 candidate comparison" }),
        /* @__PURE__ */ jsx5("p", { children: "60 reserved rows \u2192 frozen dictionary transform \u2192 final descriptive evaluation" }),
        /* @__PURE__ */ jsx5("p", { children: "Original inspection k8/seed19; minimum recorded validation k16/seed7." })
      ] })
    ] }),
    Object.entries(comparison.sourceIDs).map(([role, ids]) => /* @__PURE__ */ jsxs5("div", { children: [
      /* @__PURE__ */ jsxs5("p", { className: "nmf-object-label", children: [
        "Complete ",
        role,
        " source IDs \xB7 ",
        ids.length,
        " rows"
      ] }),
      /* @__PURE__ */ jsx5("p", { children: ids.join(", ") })
    ] }, role))
  ] });
}
function Candidates() {
  return /* @__PURE__ */ jsxs5(Figure, { id: "D47", caption: "Every recorded training/validation pair is shown without interpolated fits or error bars. Seed7 uses circles, seed19 diamonds; blue training and rose validation share a zero-origin0\u2013.08 MSE ruler. Validation minimum16/7 and inspectable8/19 are different roles.", children: [
    /* @__PURE__ */ jsx5(Plot, { label: "All eight recorded candidates", xmax: 16, xticks: [1, 4, 8, 16], ymax: 0.08, xlabel: "component count k", ylabel: "MSE", children: (map) => /* @__PURE__ */ jsx5(Fragment4, { children: saved.runs.flatMap((r) => [["trainMse", colors[0]], ["validationMse", colors[1]]].map(([key, color]) => {
      const p = map([r.k, r[key]]);
      return r.seed === 7 ? /* @__PURE__ */ jsx5("circle", { cx: p[0], cy: p[1], r: "4", fill: color, children: /* @__PURE__ */ jsx5("title", { children: `k${r.k} seed${r.seed} ${key} ${r[key]}` }) }, r.k + key + r.seed) : /* @__PURE__ */ jsx5("path", { d: `M${p[0]} ${p[1] - 5}l5 5l-5 5l-5-5Z`, fill: "none", stroke: color, children: /* @__PURE__ */ jsx5("title", { children: `k${r.k} seed${r.seed} ${key} ${r[key]}` }) }, r.k + key + r.seed);
    })) }) }),
    /* @__PURE__ */ jsxs5("p", { children: [
      "Direct mark identities: ",
      saved.runs.map((r) => `${r.seed === 7 ? "\u25CB" : "\u25C7"} k${r.k}/seed${r.seed}`).join("; "),
      ". Validation minimum is \u25CB k16/seed7; fixed inspection is \u25C7 k8/seed19. Near-identical runs overlap at their actual coordinates."
    ] }),
    /* @__PURE__ */ jsx5(Table, { caption: "All recorded candidate values and iteration counts", headers: ["k", "Seed", "Training MSE", "Validation MSE", "Iterations"], rows: saved.runs.map((r) => [r.k, r.seed, r.trainMse, r.validationMse, r.iterations]) })
  ] });
}
function MatchedComparison() {
  return /* @__PURE__ */ jsxs5(Figure, { id: "D48", caption: "Original eight-component aggregate errors stay separate from this new predeclared rank6/seed23 comparison. New images are literal recorded predictions for source242/256, with the same signed\u2212.25\u20261.25 ruler and no clipping. No historical PCA8 factors are fabricated.", children: [
    /* @__PURE__ */ jsx5(Bars, { label: "Original reserved means \xB7 k8 comparison \xB7 MSE0\u2013.08", values: [saved.baselines.meanTestMse, saved.baselines.pcaTestMse, saved.baselines.nmfTestMse], ids: ["Mean", "PCA8", "NMF8"], max: 0.08 }),
    /* @__PURE__ */ jsx5(Table, { caption: "Original aggregate MSE", headers: ["Representation", "MSE"], rows: Object.entries(saved.baselines) }),
    /* @__PURE__ */ jsx5("p", { className: "nmf-object-label", children: "New predeclared six-coordinate study \xB7 rank6, seed23" }),
    comparison.selected.map((row) => /* @__PURE__ */ jsxs5("div", { children: [
      /* @__PURE__ */ jsxs5("p", { children: [
        "Reserved source",
        row.source_row,
        ", digit",
        row.label,
        " \xB7 fixed64-bin/16 units"
      ] }),
      /* @__PURE__ */ jsx5("div", { className: "nmf-image-grid", children: ["observed", "mean", "PCA6", "NMF6"].map((key) => /* @__PURE__ */ jsx5(Pixels, { label: key, values: row[key], min: -0.25, max: 1.25 }, key)) }),
      /* @__PURE__ */ jsx5(Table, { caption: `New source${row.source_row} row MSE`, headers: ["Representation", "MSE"], rows: ["mean", "PCA6", "NMF6"].map((key) => [key, mse(row.observed, row[key])]) })
    ] }, row.source_row)),
    /* @__PURE__ */ jsx5(Table, { caption: "New rank6/seed23 all60 reserved MSE", headers: ["Representation", "MSE"], rows: Object.entries(comparison.testMSE) }),
    /* @__PURE__ */ jsxs5("p", { children: [
      "Training180 / validation60 / reserved60. NMF nndsvda, CD/Frobenius, zero alphas, tolerance1e\u22126, cap3000; recorded229 iterations, no warnings, cap not reached. Selection on reserved rows: no. New PCA range [",
      comparison.predictionRanges.PCA6.join(", "),
      "]. Negative values retain their signed position on the shared ruler."
    ] })
  ] });
}
function PixelAddress() {
  const s = savedRow(242);
  return /* @__PURE__ */ jsxs5(Figure, { id: "D49", caption: "The original k8 inspection keeps the measurement address and units explicit. Row4/column3 maps to F35 by8r+c; raw16 becomes1 under the known/16 ruler, while the prediction can exceed1.", children: [
    /* @__PURE__ */ jsxs5(Panels, { children: [
      /* @__PURE__ */ jsx5(Pixels, { label: "Source242 \xB7 raw measurement /16", values: s.observed, selected: 35 }),
      /* @__PURE__ */ jsx5(Pixels, { label: "Original NMF8 reconstruction", values: s.prediction, selected: 35 }),
      /* @__PURE__ */ jsx5(Matrix, { label: "Literal address trace", values: [[4, 3, 35, 16, 1, s.prediction[35]]], rows: ["Source242"], columns: ["Row", "Column", "F", "Raw", "Raw/16", "NMF8 prediction"] })
    ] }),
    /* @__PURE__ */ jsxs5("p", { children: [
      "Source242/F35 prediction ",
      s.prediction[35],
      ". Separately source256's original NMF8 maximum is F26=",
      savedRow(256).prediction[26],
      ". These are not the new six-coordinate study."
    ] })
  ] });
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/IdentifiabilityFigures.jsx
import React7, { useState as useState5 } from "react";
import { Fragment as Fragment5, jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
var cycle = [[1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 1], [1, 0, 0, 1]];
var identity = cycle.map((r, i) => r.map((_, j) => Number(i === j)));
function AlternativeCones() {
  const [t, setT] = scenarioState(0.5), s = shear(t);
  return /* @__PURE__ */ jsxs6(Figure, { id: "D50", caption: "Separate shear fixture: original and changed rays explain the same observed[2,3,3]. Full pattern bars retain the third feature; the equal-aspect slice shows only F0/F1, rather than pretending the third dimension vanished.", children: [
    /* @__PURE__ */ jsxs6(Panels, { children: [
      /* @__PURE__ */ jsx6(Bars, { label: "Original C0 pattern", values: [1, 1, 1], max: 3 }),
      /* @__PURE__ */ jsx6(Bars, { label: "Current C0 pattern", values: s.h[0], max: 3 }),
      /* @__PURE__ */ jsx6(Bars, { label: "Fixed C1 pattern", values: s.h[1], max: 3 }),
      /* @__PURE__ */ jsx6(Plot, { label: "Original and current cone rays \xB7 F0/F1 slice", xmax: 3, ymax: 3, children: (map) => /* @__PURE__ */ jsxs6(Fragment5, { children: [
        /* @__PURE__ */ jsx6(Arrow, { from: map([0, 0]), to: map([1, 1]), dashed: true }),
        /* @__PURE__ */ jsx6(Arrow, { from: map([0, 0]), to: map([1, 1 - t]) }),
        /* @__PURE__ */ jsx6(Arrow, { from: map([0, 0]), to: map([0, 1]), color: colors[1] }),
        /* @__PURE__ */ jsx6(Point, { at: map([2, 3]), label: "x", open: true })
      ] }) }),
      /* @__PURE__ */ jsx6(Matrix, { label: "Amounts \u2192 complete addends \u2192 same product", values: [[...s.w[0], "\u2014"], [2, 2 * (1 - t), 2 * (1 - t)], [0, 1 + 2 * t, 1 + 2 * t], [2, 3, 3]], rows: ["C0/C1 amounts", "C0 addend", "C1 addend", "Sum"] })
    ] }),
    /* @__PURE__ */ jsx6(Controls, { onReset: () => setT(0.5), children: /* @__PURE__ */ jsx6(Range, { label: "Feasible shear t", value: t, onChange: setT, max: 1, step: 0.02 }) }),
    /* @__PURE__ */ jsxs6(Result, { children: [
      "t=",
      fmt(t),
      ", current amounts[2,",
      fmt(1 + 2 * t),
      "], complete product[2,3,3]. Third-bin equality: ",
      fmt(2 * (1 - t)),
      "+",
      fmt(1 + 2 * t),
      "=3. The direction changes; the observation does not."
    ] })
  ] });
}
function SupportRectangle() {
  const [selected, setSelected] = scenarioState("0"), a = Number(selected), b = (a + 1) % 4, cross = [[a, b], [b, a]], zero = cross.find(([i, j]) => cycle[i][j] === 0);
  return /* @__PURE__ */ jsxs6(Figure, { id: "D51", caption: "A nonnegative rank-one support is a row-set \xD7 column-set rectangle, even when those sets are noncontiguous. Each selected pair of diagonal positives requires both crosscells positive; at least one is a literal forbidden zero, so one term cannot cover that pair.", children: [
    /* @__PURE__ */ jsxs6(Panels, { children: [
      /* @__PURE__ */ jsxs6("div", { className: "nmf-plot", children: [
        /* @__PURE__ */ jsx6("p", { className: "nmf-object-label", children: "Four persistent diagonal witnesses" }),
        /* @__PURE__ */ jsxs6("svg", { viewBox: "0 0 300 300", role: "img", "aria-label": `Selected diagonal(${a},${a}) and(${b},${b}); forbidden crosszero(${zero.join(",")})`, children: [
          cycle.flatMap((r, i) => r.map((v, j) => /* @__PURE__ */ jsxs6("g", { children: [
            /* @__PURE__ */ jsx6("rect", { x: 45 + j * 55, y: 35 + i * 55, width: "50", height: "50", fill: v ? "#30475f" : "#101923", stroke: i === j ? "white" : cross.some(([x, y]) => x === i && y === j) ? "#f2c276" : "#536578", strokeWidth: i === j || cross.some(([x, y]) => x === i && y === j) ? 3 : 1 }),
            /* @__PURE__ */ jsx6("text", { x: 70 + j * 55, y: 65 + i * 55, textAnchor: "middle", children: v }),
            v === 0 && cross.some(([x, y]) => x === i && y === j) && /* @__PURE__ */ jsx6("path", { d: `M${45 + j * 55} ${35 + i * 55}l50 50m-50 0l50-50`, stroke: "#f2c276" })
          ] }, `${i}${j}`))),
          [0, 1, 2, 3].map((i) => /* @__PURE__ */ jsxs6("g", { children: [
            /* @__PURE__ */ jsxs6("text", { x: "5", y: 65 + i * 55, children: [
              "R",
              i
            ] }),
            /* @__PURE__ */ jsxs6("text", { x: 65 + i * 55, y: "20", children: [
              "F",
              i
            ] })
          ] }, i))
        ] })
      ] }),
      /* @__PURE__ */ jsx6(Matrix, { label: "Actual noncontiguous outer product u v\u1D40", values: [[0, 3, 0, 4], [0, 0, 0, 0], [0, 6, 0, 8], [0, 0, 0, 0]], max: 8 }),
      /* @__PURE__ */ jsx6(Matrix, { label: "u and v support operands", values: [[1, 0, 2, 0], [0, 3, 0, 4]], rows: ["u row set{0,2}", "v column set{1,3}"] })
    ] }),
    /* @__PURE__ */ jsx6(Controls, { onReset: () => setSelected("0"), children: /* @__PURE__ */ jsx6(Select, { label: "First diagonal witness", value: selected, onChange: setSelected, options: [0, 1, 2, 3].map((i) => ({
      value: String(i),
      label: `(${i},${i})`
    })) }) }),
    /* @__PURE__ */ jsxs6(Result, { children: [
      "Pair (",
      a,
      ",",
      a,
      ") and (",
      b,
      ",",
      b,
      ") requires crosscells (",
      a,
      ",",
      b,
      ")=",
      cycle[a][b],
      " and (",
      b,
      ",",
      a,
      ")=",
      cycle[b][a],
      ". Forbidden zero (",
      zero.join(","),
      ") remains zero in the original X; no edit to observations."
    ] })
  ] });
}
function RankWitness() {
  return /* @__PURE__ */ jsxs6(Figure, { id: "D52", caption: "A determinant1 triangular minor proves ordinary rank\u22653, and signed row dependence proves\u22643. Four separated diagonal support witnesses require nonnegative rank\u22654; I4\xD7X provides its upper bound4. Filling zeros changes the support premise and does not establish a new rank.", children: [
    /* @__PURE__ */ jsxs6(Panels, { children: [
      /* @__PURE__ */ jsx6(Matrix, { label: "Four-cycle X", values: cycle }),
      /* @__PURE__ */ jsx6(Matrix, { label: "Top-left triangular minor \xB7 determinant1", values: cycle.slice(0, 3).map((r) => r.slice(0, 3)) }),
      /* @__PURE__ */ jsx6(Matrix, { label: "Signed row coefficients \u2192 exact zero combination", values: [[1, -1, 1, -1], [0, 0, 0, 0]], rows: ["Coefficients across R0\u2026R3", "Weighted row sum"], signed: true }),
      /* @__PURE__ */ jsx6(Matrix, { label: "Nonnegative left factor I4", values: identity }),
      /* @__PURE__ */ jsx6(Matrix, { label: "I4 \xD7 X = X \xB7 upper bound4", values: matmul(identity, cycle) }),
      /* @__PURE__ */ jsx6(Matrix, { label: "Changed premise \xB7 X+.1\xD7ones", values: cycle.map((r) => r.map((v) => v + 0.1)) })
    ] }),
    /* @__PURE__ */ jsx6("p", { children: "Ordinary rank3; nonnegative rank4. The changed positive inset has no forbidden support zeros; its nonnegative rank is not asserted here." })
  ] });
}
function NormalizeMixture() {
  const [a, setA] = scenarioState(2), unit = [a / (a + 1), 1 / (a + 1)];
  return /* @__PURE__ */ jsxs6(Figure, { id: "D53", caption: "Divide an actual nonzero mixture by its row mass to intersect the unit-sum slice. The resulting coefficients are fractions of modeled intensity, rather than class probabilities. An all-zero row has no direction and is excluded.", children: [
    /* @__PURE__ */ jsxs6(Panels, { children: [
      /* @__PURE__ */ jsx6(Plot, { label: "Original cone point", xmax: 3, ymax: 3, children: (map) => /* @__PURE__ */ jsxs6(Fragment5, { children: [
        /* @__PURE__ */ jsx6(Arrow, { from: map([0, 0]), to: map([a, 1]) }),
        /* @__PURE__ */ jsx6(Point, { at: map([a, 1]), label: "x" })
      ] }) }),
      /* @__PURE__ */ jsx6(Plot, { label: "Normalized point \xB7 sum1 slice", xmax: 1, ymax: 1, children: (map) => /* @__PURE__ */ jsxs6(Fragment5, { children: [
        /* @__PURE__ */ jsx6("path", { d: `M${map([1, 0]).join(" ")}L${map([0, 1]).join(" ")}`, stroke: colors[1], strokeWidth: "2" }),
        /* @__PURE__ */ jsx6(Point, { at: map([1, 0]), label: "P0" }),
        /* @__PURE__ */ jsx6(Point, { at: map([0, 1]), label: a === 0 ? "P1 / x" : "P1", color: colors[1] }),
        a !== 0 && /* @__PURE__ */ jsx6(Point, { at: map(unit), label: "x/mass", color: "#f2c276" })
      ] }) }),
      /* @__PURE__ */ jsx6(Matrix, { label: "Actual row divided by its mass", values: [[a, 1], unit], rows: ["Original", "Normalized"] }),
      /* @__PURE__ */ jsx6(Matrix, { label: "Static all-zero inset \xB7 undefined direction", values: [[0, 0], ["excluded", "excluded"]], rows: ["Zero row", "Normalization"] })
    ] }),
    /* @__PURE__ */ jsx6(Controls, { onReset: () => setA(2), children: /* @__PURE__ */ jsx6(Range, { label: "First mixture amount a", value: a, onChange: setA, max: 3, step: 0.05 }) }),
    /* @__PURE__ */ jsxs6(Result, { children: [
      "Mass ",
      fmt(a + 1),
      "; [",
      fmt(a),
      ",1]/",
      fmt(a + 1),
      "=[",
      unit.map(fmt).join(", "),
      "]. At a0 the point is still nonzero and equals P1."
    ] })
  ] });
}
function ObservedAnchors() {
  const [t, setT] = scenarioState(0.25);
  return /* @__PURE__ */ jsxs6(Figure, { id: "D54", caption: "The pure patterns A0/A1 are actually observed rows; M0/M1 and a separately shaped query lie on their hull. Full-rank/separability assumptions supply the anchor argument. A query at an endpoint adds no new direction.", children: [
    /* @__PURE__ */ jsxs6(Panels, { children: [
      /* @__PURE__ */ jsx6(Plot, { label: "Observed hull and new query", xmax: 1, ymax: 1, children: (map) => /* @__PURE__ */ jsxs6(Fragment5, { children: [
        /* @__PURE__ */ jsx6("path", { d: `M${map([1, 0]).join(" ")}L${map([0, 1]).join(" ")}`, stroke: "currentColor", opacity: ".5" }),
        normalizedRows.map((r, i) => /* @__PURE__ */ jsx6(Point, { at: map(r), label: ["A0", "A1", "M0", "M1"][i], color: i < 2 ? colors[i] : "#aab6c7" }, i)),
        (() => {
          const p = map([t, 1 - t]);
          return /* @__PURE__ */ jsx6("path", { d: `M${p[0]} ${p[1] - 6}l6 6l-6 6l-6-6Z`, fill: "none", stroke: "#f2c276", strokeWidth: "2" });
        })()
      ] }) }),
      /* @__PURE__ */ jsx6(Matrix, { label: "Actual observed rows \xB7 original IDs", values: normalizedRows, rows: ["ID0 A0", "ID1 A1", "ID2 M0", "ID3 M1"] })
    ] }),
    /* @__PURE__ */ jsx6(Controls, { onReset: () => setT(0.25), children: /* @__PURE__ */ jsx6(Range, { label: "New query first amount t", value: t, onChange: setT, max: 1, step: 0.02 }) }),
    /* @__PURE__ */ jsxs6(Result, { children: [
      "Diamond query [",
      fmt(t),
      ",",
      fmt(1 - t),
      "]. ",
      t === 0 || t === 1 ? "It coincides with an observed pure anchor and adds no direction." : "It is a mixture of the existing observed anchors."
    ] })
  ] });
}
function ProjectionTrace() {
  const [step, setStep] = scenarioState(0), result = anchorStep(normalizedRows, [0, 1, 2, 3], 2), residuals = result.states[step], lengths = residuals.map((r) => Math.sqrt(norm2(r)));
  return /* @__PURE__ */ jsxs6(Figure, { id: "D55", caption: "Select largest residual squared norm, with original normalized norm then global ID breaking ties. Projection removes a span; the length and squared length are separate quantities. Signed residuals are not clipped back into nonnegativity.", children: [
    /* @__PURE__ */ jsxs6(Panels, { children: [
      /* @__PURE__ */ jsx6(Plot, { label: "Original observations and current residual directions", xmax: 1, ymax: 1, children: (map) => /* @__PURE__ */ jsxs6(Fragment5, { children: [
        normalizedRows.map((r, i) => /* @__PURE__ */ jsx6(Arrow, { from: map([0, 0]), to: map(r), color: "#687586", dashed: true }, `old${i}`)),
        step === 2 ? /* @__PURE__ */ jsx6(Point, { at: map([0, 0]), label: "IDs0\u20133" }) : residuals.map((r, i) => /* @__PURE__ */ jsxs6("g", { children: [
          norm2(r) > 0 && /* @__PURE__ */ jsx6(Arrow, { from: map([0, 0]), to: map(r), color: colors[i % 2] }),
          /* @__PURE__ */ jsx6(Point, { at: map(r), label: `ID${i}`, color: colors[i % 2] })
        ] }, i))
      ] }) }),
      /* @__PURE__ */ jsx6(Matrix, { label: "Current exact residual rows", values: residuals }),
      /* @__PURE__ */ jsx6(Matrix, { label: "Length versus selection squared norm", values: lengths.map((v, i) => [v, norm2(residuals[i])]), columns: ["Length", "Squared length"] }),
      /* @__PURE__ */ jsx6(Matrix, { label: "Duplicate/zero ID case \xB7 selected7 then42", values: [[42, 1, 0], [7, 0, 1], [99, 0.75, 0.25], [10, 0, 1], [6, 0, 0]], columns: ["Global ID", "F0", "F1"] }),
      /* @__PURE__ */ jsx6(Matrix, { label: "Separate recorded signed-projection example", values: [[0, 0], [-0.176470588235294, 0.7058823529411765], [-0.08823529411764697, 0.35294117647058826]], signed: true, max: 1 })
    ] }),
    /* @__PURE__ */ jsxs6(Controls, { onReset: () => setStep(0), children: [
      /* @__PURE__ */ jsx6("button", { disabled: step === 0, onClick: () => setStep(step - 1), children: "Back" }),
      /* @__PURE__ */ jsx6("button", { disabled: step === 2, onClick: () => setStep(step + 1), children: "Step" })
    ] }),
    /* @__PURE__ */ jsxs6(Result, { children: [
      ["Initial squared norms1,1,.625,.625; global ID0 wins the tie.", "After A0 projection: lengths0,1,.25,.75; squared norms0,1,.0625,.5625. A1 is next.", "After A1 projection all residuals are zero; two independent directions are exhausted."][step],
      " Duplicate ID10 does not supply a new direction; zero ID6 is excluded."
    ] })
  ] });
}
function Conditioning() {
  const [e, setE] = scenarioState(0.1), p = [1 - e, e];
  return /* @__PURE__ */ jsxs6(Figure, { id: "D56", caption: "Nearly parallel endmembers give nearly coincident mixtures. The separate fixed magnified inset uses its own .98\u20261 /0\u2026.02 rulers and a static small perturbation; it is not an empirical noise bound or a change to the main axes.", children: [
    /* @__PURE__ */ jsxs6(Panels, { children: [
      /* @__PURE__ */ jsx6(Plot, { label: "Current complete unit-sum geometry", xmax: 1, ymax: 1, children: (map) => /* @__PURE__ */ jsxs6(Fragment5, { children: [
        /* @__PURE__ */ jsx6(Arrow, { from: map([0, 0]), to: map([1, 0]) }),
        /* @__PURE__ */ jsx6(Arrow, { from: map([0, 0]), to: map(p), color: colors[1] }),
        [[[1, 0], "P0", colors[0]], [p, "P1", colors[1]], [[1 - e / 2, e / 2], "mix", "#aab6c7"]].map(([point, label, color], i) => {
          const at = map(point), y = 75 + i * 35;
          return /* @__PURE__ */ jsxs6("g", { children: [
            /* @__PURE__ */ jsx6(Point, { at, color }),
            /* @__PURE__ */ jsx6("path", { d: `M${at.join(" ")}L100 ${y}`, fill: "none", stroke: color, strokeDasharray: "3 3" }),
            /* @__PURE__ */ jsx6("text", { x: "65", y, fill: color, children: label })
          ] }, label);
        })
      ] }) }),
      /* @__PURE__ */ jsx6(Plot, { label: "Static magnified noise illustration \xB7 epsilon.01", xmin: 0.98, xmax: 1, ymin: 0, ymax: 0.02, children: (map) => /* @__PURE__ */ jsxs6(Fragment5, { children: [
        /* @__PURE__ */ jsx6(Point, { at: map([1, 0]), label: "P0" }),
        /* @__PURE__ */ jsx6(Point, { at: map([0.99, 0.01]), label: "P1", color: colors[1] }),
        /* @__PURE__ */ jsx6(Point, { at: map([0.988, 0.012]), label: "perturbed", color: "#f2c276" })
      ] }) }),
      /* @__PURE__ */ jsx6(Matrix, { label: "Current endmembers and midpoint", values: [[1, 0], p, [1 - e / 2, e / 2]], rows: ["P0", "P1", "Mixture"] })
    ] }),
    /* @__PURE__ */ jsx6(Controls, { onReset: () => setE(0.1), children: /* @__PURE__ */ jsx6(Range, { label: "Endmember separation epsilon", value: e, onChange: setE, max: 1, step: 0.01 }) }),
    /* @__PURE__ */ jsxs6(Result, { children: [
      "Separation \u221A2\u03B5=",
      fmt(Math.SQRT2 * e),
      ", angle atan2(\u03B5,1\u2212\u03B5)=",
      fmt(Math.atan2(e, 1 - e)),
      " radians. ",
      e === 0 ? "Coincident patterns: independent-direction rank request refused." : "Separation alone does not give a universal noisy recovery guarantee."
    ] })
  ] });
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/TransferFigures.jsx
import React8, { useState as useState6 } from "react";
import { Fragment as Fragment6, jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
function WordCounts() {
  const docs = ["orbit rocket orbit", "rocket orbit rocket", "goal team goal", "team goal team", "orbit rocket goal team"], vocabulary = ["goal", "orbit", "rocket", "team"];
  return /* @__PURE__ */ jsxs7(Figure, { id: "D57", caption: "Repeated occurrences enter the same vocabulary column. Two orbit tokens in document0 become its orbit count2. The patterns and amounts below are rounded values from the preserved original count/KL experiment, in its original component order.", children: [
    /* @__PURE__ */ jsx7("div", { className: "nmf-token-rows", children: docs.map((d, i) => /* @__PURE__ */ jsxs7("p", { children: [
      /* @__PURE__ */ jsxs7("strong", { children: [
        "Document",
        i,
        ": "
      ] }),
      d.split(" ").map((word, j) => /* @__PURE__ */ jsxs7("span", { className: "nmf-token", style: {
        borderColor: colors[vocabulary.indexOf(word)]
      }, children: [
        word,
        " \u2192 ",
        word === "orbit" && i === 0 ? "R0 orbit cell" : word + " column",
        " "
      ] }, j))
    ] }, i)) }),
    /* @__PURE__ */ jsxs7(Panels, { children: [
      /* @__PURE__ */ jsx7(Matrix, { label: "Observed token counts \xB7 word identities", values: [[0, 2, 1, 0], [0, 1, 2, 0], [2, 0, 0, 1], [1, 0, 0, 2], [1, 1, 1, 1]], columns: vocabulary, max: 2 }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Rounded unit-row-sum word patterns", values: [[0.5, 0, 0, 0.5], [0, 0.5, 0.5, 0]], rows: ["C0", "C1"], columns: vocabulary, componentRows: true, max: 1 }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Mixed-document amount \xD7 full pattern \u2192 sum", values: [[1, 0, 0, 1], [0, 1, 1, 0], [1, 1, 1, 1]], rows: ["2\xD7C0", "2\xD7C1", "Sum"], columns: vocabulary, max: 2 })
    ] }),
    /* @__PURE__ */ jsx7("p", { children: "Amounts[2,2] sum4 token occurrences, rather than1. Word identity and pattern identity have different roles; this is not a topic posterior." })
  ] });
}
function FrozenIDF() {
  const [a, setA] = scenarioState(2), idf = [1 + Math.log(2), 1 + Math.log(4 / 3), 1 + Math.log(4 / 3)], counts = [[2, 1, 0], [0, 1, 1], [0, 0, 2]], query = [a, 1, 0], weighted = query.map((v, j) => v * idf[j]), base = [2 * idf[0], idf[1], 0], length = Math.hypot(...base);
  return /* @__PURE__ */ jsxs7(Figure, { id: "D58", caption: "This new three-column corpus fixes its vocabulary and IDF on training rows. Query edits change occurrences, never document frequencies or IDF. The separate unit-length inset changes representation; the live weighted row keeps norm=None.", children: [
    /* @__PURE__ */ jsxs7(Panels, { children: [
      /* @__PURE__ */ jsx7(Matrix, { label: "New training counts", values: counts, columns: ["orbit", "rocket", "team"] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Training document presence \u2192 df \u2192 fixed IDF", values: [[1, 1, 0], [0, 1, 1], [0, 0, 1], [1, 2, 2], idf], rows: ["Doc0 presence", "Doc1 presence", "Doc2 presence", "df", "IDF"], columns: ["orbit", "rocket", "team"] }),
      /* @__PURE__ */ jsx7(Bars, { label: "Current query counts \xB7 occurrence units", values: query, ids: ["orbit", "rocket", "team"], max: 4 }),
      /* @__PURE__ */ jsx7(Bars, { label: "Current weighted query \xB7 weight units", values: weighted, ids: ["orbit", "rocket", "team"], max: 7 }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Static all-OOV planet \u2192 zero retained row", values: [[0, 0, 0]], columns: ["orbit", "rocket", "team"] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Static default row / Euclidean length \xB7 different representation", values: [base, base.map((v) => v / length)], rows: ["Default weighted", "Unit length"], columns: ["orbit", "rocket", "team"] })
    ] }),
    /* @__PURE__ */ jsx7(Controls, { onReset: () => setA(2), children: /* @__PURE__ */ jsx7(Range, { label: "Orbit occurrences in this query", value: a, onChange: setA, max: 4, step: 1 }) }),
    /* @__PURE__ */ jsxs7(Result, { children: [
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
  return /* @__PURE__ */ jsxs7(Figure, { id: "D59", caption: "Constructed band responses: the cone allows arbitrary nonnegative amounts, while the segment requires them to sum1. The plot is a bands0/1 projection; the complete third band remains in the arrays and full3D half-loss. The open blue diamond is the query; the amber circle is the simplex prediction. No calibrated physical material is claimed.", children: [
    /* @__PURE__ */ jsxs7(Panels, { children: [
      /* @__PURE__ */ jsx7(Plot, { label: "Fixed cone rays and sum-one segment \xB7 bands0/1", xmax: 4, ymax: 4, xlabel: "Band0", ylabel: "Band1", children: (map) => /* @__PURE__ */ jsxs7(Fragment6, { children: [
        /* @__PURE__ */ jsx7(Arrow, { from: map([0, 0]), to: map([3.5, 0]) }),
        /* @__PURE__ */ jsx7(Arrow, { from: map([0, 0]), to: map([0, 3.5]), color: colors[1] }),
        /* @__PURE__ */ jsx7("path", { d: `M${map([1, 0]).join(" ")}L${map([0, 1]).join(" ")}`, stroke: "#f2c276", strokeWidth: "3" }),
        /* @__PURE__ */ jsx7(Point, { at: map(query.slice(0, 2)), diamond: true, open: true }),
        /* @__PURE__ */ jsx7(Point, { at: map(prediction.slice(0, 2)), label: "simplex", color: "#f2c276" })
      ] }) }),
      /* @__PURE__ */ jsx7(Bars, { label: "Query \xB7 three band intensities", values: query, ids: ["Band0", "Band1", "Band2"], max: 6 }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Amounts and complete predictions", values: [[...cone, "\u2014"], query, [...simplex, "\u2014"], prediction, residual], rows: ["Cone C0/C1", "Cone prediction", "Simplex C0/C1", "Simplex prediction", "Simplex residual"], signed: true, max: 6 }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Static gain1 normalize-after-NNLS comparison", values: [[2 / 3, 1 / 3, "\u2014"], [2 / 3, 1 / 3, 1]], rows: ["Normalized amounts", "Changed prediction"] })
    ] }),
    /* @__PURE__ */ jsx7(Controls, { onReset: () => setG(1), children: /* @__PURE__ */ jsx7(Range, { label: "Common query gain g", value: g, onChange: setG, min: 0.5, max: 2, step: 0.05 }) }),
    /* @__PURE__ */ jsxs7(Result, { children: [
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
  return /* @__PURE__ */ jsxs7(Figure, { id: "D60", caption: "Two modeled explanations have the same complete constructed response[2,3,3] and zero residual. Calibration, independently validated endmembers and a justified mixing law are additional evidence; zero residual does not provide them.", children: [
    /* @__PURE__ */ jsx7(Panels, { children: [[h, [2, 1], "Original modeled lane"], [changed, [2, 2], "Changed modeled lane"]].map(([dictionary, w, label]) => /* @__PURE__ */ jsxs7("div", { children: [
      /* @__PURE__ */ jsx7(Matrix, { label: `${label} \xB7 patterns`, values: dictionary, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Amounts \xD7 patterns \u2192 complete addends and sum", values: [[...w, "\u2014"], dictionary[0].map((v) => v * w[0]), dictionary[1].map((v) => v * w[1]), matmul([w], dictionary)[0], [0, 0, 0]], rows: ["C0/C1 amounts", "C0 addend", "C1 addend", "Modeled response", "Residual"], max: 3 })
    ] }, label)) }),
    /* @__PURE__ */ jsx7(Bars, { label: "One constructed candidate response \xB7 band units", values: [2, 3, 3], max: 3 }),
    /* @__PURE__ */ jsx7("p", { children: "Additional evidence, not supplied by zero residual: instrument calibration; pure-material measurements; a defensible mixing law; independent source validation." })
  ] });
}
var oldA = [[4, 2], [2, 1]];
var oldB = [[4, 2, 6], [2, 1, 3]];
var deltaA = [[0, 0], [0, 4]];
var deltaB = [[0, 0, 0], [0, 4, 4]];
function OnlineStatistics() {
  return /* @__PURE__ */ jsx7(Figure, { id: "D61", caption: "Each historical encoding contributes an outer product to A and a code\xD7observation product to B. These exact products expose the compact surrogate without implying that all earlier rows are retained or freshly re-encoded.", children: /* @__PURE__ */ jsxs7(Panels, { children: [
    /* @__PURE__ */ jsx7(Matrix, { label: "Old observation and code", values: [[2, 1, 3], [2, 1, "\u2014"]], rows: ["x old", "w old C0/C1"] }),
    /* @__PURE__ */ jsx7(Matrix, { label: "Old A = w\u1D40w", values: oldA, rows: ["C0", "C1"], columns: ["C0", "C1"] }),
    /* @__PURE__ */ jsx7(Matrix, { label: "Old B = w\u1D40x", values: oldB, rows: ["C0", "C1"] }),
    /* @__PURE__ */ jsx7(Matrix, { label: "Incoming observation and fixed-H code", values: [[0, 2, 2], [0, 2, "\u2014"]], rows: ["x new", "w new C0/C1"] }),
    /* @__PURE__ */ jsx7(Matrix, { label: "Incoming \u0394A", values: deltaA, rows: ["C0", "C1"], columns: ["C0", "C1"] }),
    /* @__PURE__ */ jsx7(Matrix, { label: "Incoming \u0394B", values: deltaB, rows: ["C0", "C1"] })
  ] }) });
}
function Retention() {
  const [rho, setRho] = scenarioState(1), a = add(scale(oldA, rho), deltaA), b = add(scale(oldB, rho), deltaB);
  return /* @__PURE__ */ jsxs7(Figure, { id: "D62", caption: "For this nonempty batch, old statistics receive retention\u03C1 and the incoming products enter once. Empty batch is a no-op. At\u03C10 the old statistics vanish while the existing dictionary is not reset.", children: [
    /* @__PURE__ */ jsxs7(Panels, { children: [
      /* @__PURE__ */ jsx7(Matrix, { label: "Retained old A \xB7 \u03C1 Aold", values: scale(oldA, rho), rows: ["C0", "C1"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "New A \xB7 \u03C1 Aold + \u0394A", values: a, rows: ["C0", "C1"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Retained old B \xB7 \u03C1 Bold", values: scale(oldB, rho), rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "New B \xB7 \u03C1 Bold + \u0394B", values: b, rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Existing dictionary \xB7 retained even at\u03C10", values: H0, rows: ["C0", "C1"] })
    ] }),
    /* @__PURE__ */ jsx7(Controls, { onReset: () => setRho(1), children: /* @__PURE__ */ jsx7(Range, { label: "Old-statistic retention \u03C1", value: rho, onChange: setRho, max: 1 }) }),
    /* @__PURE__ */ jsxs7(Result, { children: [
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
  return /* @__PURE__ */ jsxs7(Figure, { id: "D63", caption: "Changing the current dictionary does not retroactively change stored encodings. A/B keep historical code products; a new fixed-H encoding answers a different current-dictionary question.", children: [
    /* @__PURE__ */ jsxs7(Panels, { children: [
      /* @__PURE__ */ jsx7(Matrix, { label: "Current edited dictionary", values: s.dictionary, rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Historical A \xB7 unchanged", values: [[4, 2], [2, 5]], rows: ["C0", "C1"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Historical B \xB7 unchanged", values: [[4, 2, 6], [2, 5, 7]], rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Old versus freshly solved first-row amounts", values: [[2, 1], s.w], rows: ["Stored codes", "Fresh codes"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Actual first-row predictions", values: [[2, 1, 3], s.oldPrediction, s.freshPrediction], rows: ["Observation", "Stored-code prediction", "Fresh-code prediction"] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Second row remains exact", values: [[0, 2, 2], [0, 2, 2]], rows: ["Observation", "Prediction"] })
    ] }),
    /* @__PURE__ */ jsx7(Controls, { onReset: () => setH(1), children: /* @__PURE__ */ jsx7(Range, { label: "Current H[C0,F0]", value: h, onChange: setH, min: 1, max: 2, step: 0.05 }) }),
    /* @__PURE__ */ jsxs7(Result, { children: [
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
  return /* @__PURE__ */ jsxs7(Figure, { id: "D64", caption: "Named axes are observation i, feature j and time t. A complete rank-one tensor retains its zero feature plane. The declared j-major/t-minor unfolding uses column2j+t, so its inverse maps each cell back without loss.", children: [
    /* @__PURE__ */ jsxs7(Panels, { children: [
      /* @__PURE__ */ jsx7(Matrix, { label: "Observation factor a", values: [[1], [2]], columns: ["a_i"] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Feature factor b", values: [[1], [0]], rows: ["j0", "j1"], columns: ["b_j"] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Time factor c", values: [[1], [3]], rows: ["t0", "t1"], columns: ["c_t"] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Tensor time t0 \xB7 i\xD7j slice", values: [[1, 0], [2, 0]] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Tensor time t1 \xB7 i\xD7j slice", values: [[3, 0], [6, 0]], selected: [1, 0] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Unfolding \xB7 columns(j0,t0),(j0,t1),(j1,t0),(j1,t1)", values: [[1, 3, 0, 0], [2, 6, 0, 0]], columns: ["j0t0", "j0t1", "j1t0", "j1t1"], selected: [1, 1] })
    ] }),
    /* @__PURE__ */ jsx7("p", { children: "Forward address(1,0,1) \u2192 row1,column1 \u2192 value6. Inverse column1 gives j=floor(1/2)=0,t=1 mod2=1. The entire j1 feature plane remains zero, rather than disappearing." })
  ] });
}
function TensorAnatomy() {
  return /* @__PURE__ */ jsxs7(Figure, { id: "D65", caption: "CP rank1 and Tucker rank(1,1,1) with scalar core1 reconstruct the same rank-one example. A separate identity-factor core example isolates a single core interaction; it is a different anatomy example, without a fitted tensor optimizer.", children: [
    /* @__PURE__ */ jsxs7(Panels, { children: [
      /* @__PURE__ */ jsx7(Matrix, { label: "CP single component \xB7 mode factors", values: [[1, 2], [1, 0], [1, 3]], rows: ["Observation a", "Feature b", "Time c"] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Tucker scalar core G000=1", values: [[1]], rows: ["core0"], columns: ["core0"] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "CP and Tucker time0 slice \xB7 same product", values: [[1, 0], [2, 0]] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "CP and Tucker time1 slice \xB7 same product", values: [[3, 0], [6, 0]] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Separate core example \xB7 each mode factor I2", values: [[1, 0], [0, 1]] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Separate G time0 slice \xB7 sole G010=2", values: [[0, 2], [0, 0]] }),
      /* @__PURE__ */ jsx7(Matrix, { label: "Separate G time1 slice", values: [[0, 0], [0, 0]] })
    ] }),
    /* @__PURE__ */ jsx7("p", { children: "With identity mode factors, sole core G[0,1,0]=2 becomes sole tensor T[0,1,0]=2. General core dimensions and cross-component interactions require their own decomposition scope." })
  ] });
}
function Phase() {
  return /* @__PURE__ */ jsx7(Figure, { id: "D66", caption: "These two finite DFT coefficient lists have identical magnitudes but opposite k1 phase. Under inverse normalization1/2 they produce opposite two-sample waveforms. Magnitude alone cannot select which original phase occurred; no audio experiment or STFT inversion is performed.", children: /* @__PURE__ */ jsxs7(Panels, { children: [
    /* @__PURE__ */ jsx7(Plot, { label: "k1 DFT coefficient \xB7 real/imaginary plane", xmin: -1, xmax: 1, ymin: -1, ymax: 1, xlabel: "Real", ylabel: "Imaginary", children: (map) => /* @__PURE__ */ jsxs7(Fragment6, { children: [
      /* @__PURE__ */ jsx7(Arrow, { from: map([0, 0]), to: map([1, 0]) }),
      /* @__PURE__ */ jsx7(Arrow, { from: map([0, 0]), to: map([-1, 0]), color: colors[1] }),
      /* @__PURE__ */ jsx7(Point, { at: map([1, 0]), label: "phase0" }),
      /* @__PURE__ */ jsx7(Point, { at: map([-1, 0]), label: "phase\u03C0", color: colors[1] })
    ] }) }),
    /* @__PURE__ */ jsx7(Matrix, { label: "Coefficients and common magnitudes", values: [[0, 1], [0, -1], [0, 1]], rows: ["DFT A", "DFT B", "Both magnitudes"], columns: ["k0", "k1"], signed: true, max: 1 }),
    /* @__PURE__ */ jsx7(Plot, { label: "Two literal inverse samples", xmax: 1, ymin: -0.5, ymax: 0.5, xlabel: "sample n", ylabel: "amplitude", children: (map) => /* @__PURE__ */ jsx7(Fragment6, { children: [[[0.5, -0.5], colors[0]], [[-0.5, 0.5], colors[1]]].map(([values, color], i) => /* @__PURE__ */ jsxs7("g", { children: [
      /* @__PURE__ */ jsx7("path", { d: `M${map([0, values[0]]).join(" ")}L${map([1, values[1]]).join(" ")}`, stroke: color, fill: "none", strokeDasharray: i ? "5 3" : void 0 }),
      values.map((v, n) => /* @__PURE__ */ jsx7("circle", { cx: map([n, v])[0], cy: map([n, v])[1], r: i ? 3 : 5, fill: color }, n))
    ] }, i)) }) }),
    /* @__PURE__ */ jsx7(Matrix, { label: "Exact inverse normalization1/2", values: [[0.5, -0.5], [-0.5, 0.5]], rows: ["Waveform A", "Waveform B"], columns: ["n0", "n1"], signed: true, max: 0.5 })
  ] }) });
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/NmfFigures.jsx
import { jsx as jsx8 } from "react/jsx-runtime";
var figures = [Observation, Addends, Shapes, OuterProducts, AmountFraction, Compensation, Shear, ContributionRanking, Residual, SquaredCells, Missing, LossDomains, Cone, ClipFailure, () => /* @__PURE__ */ jsx8(Cone, { id: "D15", frozen: true }), CoordinateSlice, Caches, Cyclic, KKT, Alternation, Joint, Stationarity, Storage, Ratio, HistoricalMU, ZeroLock, Counts, Majorizer, PSD, BetaPower, Centering, SignedTriplet, PairedSigns, FilledZeros, PublicAnatomy, SameBlock, Publication, Penalty, ScalePenalty, MaskGram, NoInformation, Dictionary, SavedContribution, SavedRanking, Removal, Partitions, Candidates, MatchedComparison, PixelAddress, AlternativeCones, SupportRectangle, RankWitness, NormalizeMixture, ObservedAnchors, ProjectionTrace, Conditioning, WordCounts, FrozenIDF, SpectralConstraints, ExternalEvidence, OnlineStatistics, Retention, StaleStatistics, TensorAddress, TensorAnatomy, Phase];
export {
  figures
};
