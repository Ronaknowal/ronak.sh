// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/nmf-lesson.jsx
import React12 from "react";

// src/learn/styles.js
var colors = {
  gold: "#e2b55a",
  green: "#4ade80",
  bg: "#050505",
  textPrimary: "#e8e8e8",
  textSecondary: "#888",
  textMuted: "#555",
  textDim: "#444",
  textDark: "#333",
  border: "#1a1a1a",
  cardBg: "rgba(255,255,255,0.02)",
  cardHoverBg: "rgba(226,181,90,0.04)",
  cardHoverBorder: "#e2b55a33"
};
var fonts = {
  mono: "'JetBrains Mono', 'Fira Code', monospace",
  sans: "'Space Grotesk', sans-serif"
};
var navLinkStyle = {
  fontFamily: fonts.mono,
  fontSize: 11,
  color: colors.textMuted,
  textDecoration: "none",
  letterSpacing: 1,
  textTransform: "uppercase",
  transition: "color 0.2s"
};
var epochLabelStyle = {
  fontFamily: fonts.mono,
  fontSize: 10,
  color: colors.textDark,
  letterSpacing: 3,
  marginBottom: 40
};
var sectionTitleStyle = {
  fontFamily: fonts.sans,
  fontSize: 40,
  fontWeight: 600,
  letterSpacing: "-0.03em",
  margin: "0 0 12px 0",
  color: colors.textPrimary
};
var subtitleStyle = {
  fontFamily: fonts.mono,
  fontSize: 12,
  color: colors.textDim,
  marginBottom: 40
};

// src/learn/components/lesson-navigation.js
function sectionLabel(text) {
  const label = text.replace(/\s+/g, " ").trim();
  const match = label.match(/^(\d+(?:\.\d+)*)(?:[.):]|\s+[—–-])\s+(.+)$/u);
  return match ? { number: match[1], title: match[2] } : { number: null, title: label };
}

// src/learn/components/content/Headings.jsx
import { jsx } from "react/jsx-runtime";
var teachingLabels = {
  "1. Why it exists": "1. Start with the problem",
  "2. Core intuition": "2. Build the intuition",
  "3. Math foundation": "3. Make the idea precise",
  "3. Mathematical foundation": "3. Make the idea precise",
  "4. How it works": "4. See how it works",
  "5. Implementation": "5. Put it into practice",
  "6. Failure modes": "6. Know where it can fail"
};
function H2({ children }) {
  const label = typeof children === "string" ? teachingLabels[children] || children : children;
  const id = typeof label === "string" ? label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : void 0;
  const parts = typeof label === "string" ? sectionLabel(label) : null;
  const displayLabel = parts?.number ? `${parts.number}. ${parts.title}` : label;
  return /* @__PURE__ */ jsx("h2", { id, style: {
    fontFamily: fonts.sans,
    fontSize: 22,
    fontWeight: 600,
    color: colors.textPrimary,
    margin: "32px 0 14px"
  }, children: displayLabel });
}
function H3({ children }) {
  return /* @__PURE__ */ jsx("h3", { style: {
    fontFamily: fonts.sans,
    fontSize: 20,
    fontWeight: 600,
    color: colors.textPrimary,
    margin: "24px 0 12px"
  }, children });
}

// src/learn/components/LessonOpening.jsx
import { createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { Fragment, jsx as jsx2, jsxs } from "react/jsx-runtime";
var LessonOpeningContext = createContext(null);
function LessonOpeningNote({ children, kind = "route" }) {
  const targets = useContext(LessonOpeningContext);
  const note = /* @__PURE__ */ jsx2("div", { className: `lesson-compass__note lesson-compass__note--${kind}`, children });
  if (targets === null) return note;
  return targets[kind] ? createPortal(note, targets[kind]) : null;
}

// src/learn/components/content/Prose.jsx
import { jsx as jsx3 } from "react/jsx-runtime";
function Prose({ children, dim = false, opening }) {
  if (opening) return /* @__PURE__ */ jsx3(LessonOpeningNote, { kind: opening, children: /* @__PURE__ */ jsx3("p", { children }) });
  return /* @__PURE__ */ jsx3("p", { style: {
    fontFamily: fonts.sans,
    fontSize: "clamp(1rem, 1.25vw, 1.08rem)",
    color: dim ? colors.textMuted : "#bdbdbd",
    lineHeight: 1.82,
    letterSpacing: "-0.005em",
    marginBottom: 20
  }, children });
}

// src/learn/components/content/Code.jsx
import { useCallback as useCallback2, useEffect as useEffect2, useRef as useRef2, useState as useState2 } from "react";

// src/learn/components/content/LessonCodeDownloads.jsx
import { createContext as createContext2, useCallback, useContext as useContext2, useEffect, useId, useMemo, useRef, useState } from "react";

// src/learn/components/content/code-downloads.js
var extensions = { python: "py", py: "py", javascript: "js", js: "js", typescript: "ts", ts: "ts", jsx: "jsx", tsx: "tsx", bash: "sh", shell: "sh", sh: "sh", sql: "sql", json: "json", yaml: "yaml", yml: "yml", c: "c", cpp: "cpp", "c++": "cpp", cuda: "cu", rust: "rs", go: "go", java: "java", r: "R", julia: "jl", matlab: "m", html: "html", css: "css", markdown: "md" };
function codeFilename({ filename, topicId = "lesson", language, kind = "code", ordinal = 1 }) {
  if (filename) return String(filename).split(/[\\/]/).at(-1).replace(/[<>:"|?*\u0000-\u001f]/g, "-");
  const extension = kind === "output" ? "txt" : extensions[String(language || "").toLowerCase()] || "txt";
  return `${topicId}-${kind === "output" ? "output" : "example"}-${String(ordinal).padStart(2, "0")}.${extension}`;
}
function downloadText(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1e3);
}

// src/learn/components/content/LessonCodeDownloads.jsx
import { jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
var RegistrationContext = createContext2(null);
var EntriesContext = createContext2([]);
function useCodeDownload({ filename, language, kind = "code", downloadUrl, title, getText, inPractice }) {
  const context = useContext2(RegistrationContext), id = useId();
  const [registeredFilename, setRegisteredFilename] = useState(null);
  useEffect(() => {
    if (!context) return;
    setRegisteredFilename(context.register(id, { filename, language, kind, downloadUrl, title, getText, practice: Boolean(inPractice?.()) }));
    return () => context.unregister(id);
  }, [context, id, filename, language, kind, downloadUrl, title, getText, inPractice]);
  return filename ? codeFilename({ filename }) : registeredFilename || codeFilename({ language, kind, topicId: context?.topicId });
}

// src/learn/components/content/Code.jsx
import { Fragment as Fragment2, jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
function CodeBlock({ children, language, filename, downloadUrl, title, kind }) {
  const codeRef = useRef2(null), textRef = useRef2(children);
  textRef.current = children;
  const getText = useCallback2(() => typeof textRef.current === "string" ? textRef.current : codeRef.current?.textContent || "", []);
  const inPractice = useCallback2(() => codeRef.current?.closest('details, [data-lesson-exercise], [data-lesson-ending="practice"], .lesson-check, .neural-practice'), []);
  const output = kind === "output" || /^(?:output|text output|console output)$/i.test(language || "");
  const file = useCodeDownload({ filename, language, downloadUrl, title, kind: output ? "output" : "code", getText, inPractice });
  const [message, setMessage] = useState2("");
  const copyTimer = useRef2(null), copyRequest = useRef2(0);
  useEffect2(() => () => {
    copyRequest.current += 1;
    window.clearTimeout(copyTimer.current);
  }, []);
  async function copy() {
    const request = ++copyRequest.current;
    window.clearTimeout(copyTimer.current);
    setMessage("");
    try {
      await navigator.clipboard.writeText(getText());
      if (request !== copyRequest.current) return;
      setMessage("Copied");
      copyTimer.current = window.setTimeout(() => setMessage(""), 2200);
    } catch {
      if (request === copyRequest.current) setMessage("Copy unavailable. Select the code and copy it manually.");
    }
  }
  return /* @__PURE__ */ jsxs3("div", { className: "lesson-code", "data-code-kind": output ? "output" : "code", children: [
    /* @__PURE__ */ jsxs3("div", { className: "lesson-code__toolbar", children: [
      /* @__PURE__ */ jsxs3("div", { className: "lesson-code__identity", children: [
        /* @__PURE__ */ jsx5("span", { children: title || (output ? "Output" : language || "Code") }),
        /* @__PURE__ */ jsx5("span", { className: "lesson-code__filename", children: file })
      ] }),
      /* @__PURE__ */ jsxs3("div", { className: "lesson-code__actions", children: [
        /* @__PURE__ */ jsx5("button", { type: "button", className: "lesson-code__copy", "data-copied": message === "Copied" ? "" : void 0, onClick: copy, "aria-label": `Copy ${file}`, children: message === "Copied" ? /* @__PURE__ */ jsxs3(Fragment2, { children: [
          /* @__PURE__ */ jsx5("span", { "aria-hidden": "true", children: "\u2713" }),
          " Copied"
        ] }) : "Copy" }),
        downloadUrl ? /* @__PURE__ */ jsx5("a", { href: downloadUrl, download: file, "aria-label": `Download ${file}`, children: "Download" }) : /* @__PURE__ */ jsx5("button", { type: "button", onClick: () => downloadText(getText(), file), "aria-label": `Download ${file}`, children: "Download" })
      ] }),
      /* @__PURE__ */ jsx5("span", { className: `lesson-code__status${message === "Copied" ? " lesson-code__status--success" : ""}`, role: "status", "aria-live": "polite", children: message })
    ] }),
    /* @__PURE__ */ jsx5("pre", { tabIndex: 0, "aria-label": `${title || language || (output ? "Output" : "Code")}; scroll horizontally when needed`, children: /* @__PURE__ */ jsx5("code", { ref: codeRef, children }) })
  ] });
}

// src/learn/components/content/RemoteCodeBlock.jsx
import { useCallback as useCallback3, useEffect as useEffect3, useRef as useRef3, useState as useState3 } from "react";
import { jsx as jsx6, jsxs as jsxs4 } from "react/jsx-runtime";
function RemoteCode({ source, filename, language = "python", title }) {
  const container = useRef3(null), [near, setNear] = useState3(false);
  const [code, setCode] = useState3(null), [error, setError] = useState3(false), [attempt, setAttempt] = useState3(0);
  const file = filename || source.split("/").at(-1);
  const getText = useCallback3(() => code || "", [code]);
  const inPractice = useCallback3(() => container.current?.closest('details, [data-lesson-exercise], [data-lesson-ending="practice"], .lesson-check, .neural-practice'), []);
  useCodeDownload({ filename: file, language, downloadUrl: source, title, getText, inPractice });
  useEffect3(() => {
    if (!("IntersectionObserver" in window)) {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setNear(true);
        observer.disconnect();
      }
    }, { rootMargin: "600px" });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect3(() => {
    if (!near) return;
    const controller = new AbortController();
    setError(false);
    fetch(source, { signal: controller.signal }).then((response) => {
      if (!response.ok || /text\/html/i.test(response.headers.get("content-type") || "")) throw new Error("Code unavailable");
      return response.text();
    }).then((text) => {
      if (!controller.signal.aborted) setCode(text);
    }).catch(() => {
      if (!controller.signal.aborted) setError(true);
    });
    return () => controller.abort();
  }, [source, near, attempt]);
  return /* @__PURE__ */ jsx6("div", { ref: container, className: "lesson-code-source", children: code !== null ? /* @__PURE__ */ jsx6(CodeBlock, { filename: file, language, title, downloadUrl: source, children: code }) : /* @__PURE__ */ jsxs4("div", { className: "lesson-code-source__pending", children: [
    /* @__PURE__ */ jsx6("p", { children: title || file }),
    error ? /* @__PURE__ */ jsxs4("p", { role: "alert", children: [
      "The program could not load. ",
      /* @__PURE__ */ jsx6("button", { type: "button", onClick: () => setAttempt((value) => value + 1), children: "Retry" })
    ] }) : /* @__PURE__ */ jsx6("p", { role: "status", children: near ? "Loading program\u2026" : "The program loads here as you reach this part of the lesson." }),
    /* @__PURE__ */ jsxs4("a", { href: source, download: file, children: [
      "Download ",
      file
    ] })
  ] }) });
}
function RemoteCodeBlock(props) {
  return /* @__PURE__ */ jsx6(RemoteCode, { ...props }, props.source);
}

// src/learn/components/content/Math.jsx
import katex from "katex";
import { jsx as jsx7, jsxs as jsxs5 } from "react/jsx-runtime";
function Math2({ children }) {
  const html = katex.renderToString(String(children), {
    displayMode: false,
    throwOnError: false
  });
  return /* @__PURE__ */ jsx7(
    "span",
    {
      style: { fontSize: 13 },
      dangerouslySetInnerHTML: { __html: html }
    }
  );
}
function MathBlock({ children, caption }) {
  const html = katex.renderToString(String(children), {
    displayMode: true,
    throwOnError: false
  });
  return /* @__PURE__ */ jsxs5("div", { style: { margin: "20px 0", textAlign: "center" }, children: [
    /* @__PURE__ */ jsx7("div", { dangerouslySetInnerHTML: { __html: html } }),
    caption && /* @__PURE__ */ jsx7("div", { style: {
      fontFamily: fonts.mono,
      fontSize: 11,
      color: colors.textDim,
      marginTop: 8
    }, children: caption })
  ] });
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/Drawing.jsx
import React, { useId as useId2 } from "react";

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

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/Drawing.jsx
import { jsx as jsx8, jsxs as jsxs6 } from "react/jsx-runtime";
var colors2 = ["#7bb7ff", "#ee8faf", "#78d3e2", "#c1a1ee", "#f2c276", "#9b9fe8", "#dca47e", "#e1c7cf"];
function Figure({
  id,
  caption,
  children
}) {
  return /* @__PURE__ */ jsxs6("figure", { className: "nmf-figure", "data-nmf-figure": id, children: [
    children,
    /* @__PURE__ */ jsx8("figcaption", { children: caption })
  ] });
}
function Panels({
  children
}) {
  return /* @__PURE__ */ jsx8("div", { className: "nmf-panels", children });
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
  return /* @__PURE__ */ jsxs6("div", { className: "nmf-array", children: [
    /* @__PURE__ */ jsx8("p", { className: "nmf-object-label", children: label }),
    /* @__PURE__ */ jsx8("div", { className: "nmf-array-scroll", tabIndex: 0, role: "region", "aria-label": `${label}; complete labelled array, scroll horizontally when needed`, children: /* @__PURE__ */ jsxs6("table", { children: [
      /* @__PURE__ */ jsx8("thead", { children: /* @__PURE__ */ jsxs6("tr", { children: [
        /* @__PURE__ */ jsx8("th", { scope: "col", "aria-label": "Row identity" }),
        values[0].map((_, j) => /* @__PURE__ */ jsx8("th", { scope: "col", children: columns?.[j] ?? `F${j}` }, j))
      ] }) }),
      /* @__PURE__ */ jsx8("tbody", { children: values.map((r, i) => /* @__PURE__ */ jsxs6("tr", { children: [
        /* @__PURE__ */ jsx8("th", { scope: "row", children: rows?.[i] ?? `R${i}` }),
        r.map((v, j) => /* @__PURE__ */ jsx8("td", { "data-missing": typeof v === "string" && /missing|not observed|excluded/.test(v) ? "" : void 0, "data-selected": selected?.[0] === i && selected?.[1] === j || contains(selectedCells, i, j) ? "" : void 0, "data-negative-origin": contains(hatchedCells, i, j) ? "" : void 0, "data-original-zero": contains(originalZeros, i, j) ? "" : void 0, style: {
          backgroundColor: typeof v === "number" ? `color-mix(in srgb, ${color ?? (signed ? v < 0 ? "#ee8faf" : "#7bb7ff" : componentRows || rows?.every((r2) => /^C\d$/.test(r2)) ? colors2[i % 8] : componentColumns || columns?.every((c) => /^C\d$/.test(c)) ? colors2[j % 8] : "#9ca7b5")} ${Math.min(75, Math.abs(v) / max * 65)}%, transparent)` : void 0
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
  const id = useId2();
  return /* @__PURE__ */ jsxs6("div", { className: "nmf-table-wrapper", children: [
    /* @__PURE__ */ jsx8("p", { id, className: "nmf-object-label", children: caption }),
    /* @__PURE__ */ jsx8("div", { className: "nmf-table", tabIndex: 0, role: "region", "aria-label": `${caption}; scroll table horizontally when needed`, children: /* @__PURE__ */ jsxs6("table", { "aria-labelledby": id, children: [
      /* @__PURE__ */ jsx8("thead", { children: /* @__PURE__ */ jsx8("tr", { children: headers.map((h, i) => /* @__PURE__ */ jsx8("th", { scope: "col", children: h }, i)) }) }),
      /* @__PURE__ */ jsx8("tbody", { children: rows.map((r, i) => /* @__PURE__ */ jsx8("tr", { children: r.map((v, j) => /* @__PURE__ */ jsx8("td", { children: v }, j)) }, i)) })
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
  return /* @__PURE__ */ jsxs6("div", { className: "nmf-bars", children: [
    /* @__PURE__ */ jsx8("p", { className: "nmf-object-label", children: label }),
    /* @__PURE__ */ jsxs6("p", { className: "nmf-ruler", children: [
      signed ? `\u2212${max} \xB7 0 \xB7 +${max}` : `0 \u2192 ${max}`,
      " \xB7 units named above"
    ] }),
    values.map((v, i) => /* @__PURE__ */ jsxs6("div", { className: "nmf-bar-row", children: [
      /* @__PURE__ */ jsx8("span", { children: ids?.[i] ?? `F${i}` }),
      /* @__PURE__ */ jsx8("span", { className: `nmf-bar-track${signed ? " nmf-bar-track--signed" : ""}`, children: /* @__PURE__ */ jsx8("span", { style: {
        left: signed ? v < 0 ? `${50 - 50 * Math.abs(v) / max}%` : "50%" : 0,
        width: `${(signed ? 50 : 100) * Math.abs(v) / max}%`,
        background: signed ? v < 0 ? colors2[1] : colors2[0] : component ? colors2[i % 8] : color
      } }) }),
      /* @__PURE__ */ jsx8("output", { children: fmt(v) })
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
  return /* @__PURE__ */ jsxs6("div", { className: "nmf-plot", children: [
    /* @__PURE__ */ jsx8("p", { className: "nmf-object-label", children: label }),
    /* @__PURE__ */ jsxs6("svg", { viewBox: "0 0 300 282", role: "img", "aria-label": `${label}; ${xlabel} horizontal ${xmin}\u2013${xmax}, ${ylabel} vertical ${ymin}\u2013${ymax}${equalUnits ? "; equal distance for one unit on both axes" : ""}`, children: [
      /* @__PURE__ */ jsx8("path", { d: `M60 ${250 - height - 15}V250H${60 + width + 10}`, fill: "none", stroke: "currentColor", opacity: ".6" }),
      [0, 0.25, 0.5, 0.75, 1].map((t) => /* @__PURE__ */ jsxs6("g", { children: [
        /* @__PURE__ */ jsx8("path", { d: `M55 ${250 - t * height}h5`, stroke: "currentColor" }),
        /* @__PURE__ */ jsx8("text", { x: 51, y: 255 - t * height, textAnchor: "end", children: fmt(ymin + t * (ymax - ymin)) })
      ] }, t)),
      (xticks ?? [0, 0.25, 0.5, 0.75, 1].map((t) => xmin + t * (xmax - xmin))).map((x) => /* @__PURE__ */ jsxs6("g", { children: [
        /* @__PURE__ */ jsx8("path", { d: `M${map([x, ymin])[0]} 250v5`, stroke: "currentColor" }),
        /* @__PURE__ */ jsx8("text", { x: map([x, ymin])[0], y: "275", textAnchor: "middle", children: fmt(x) })
      ] }, x)),
      children(map)
    ] }),
    /* @__PURE__ */ jsxs6("p", { className: "nmf-ruler", children: [
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
  color = colors2[0],
  open = false,
  diamond = false
}) {
  return /* @__PURE__ */ jsxs6("g", { children: [
    diamond ? /* @__PURE__ */ jsx8("path", { d: `M${at[0]} ${at[1] - 7}l7 7l-7 7l-7-7Z`, fill: open ? "none" : color, stroke: color, strokeWidth: "2" }) : /* @__PURE__ */ jsx8("circle", { cx: at[0], cy: at[1], r: "5", fill: open ? "none" : color, stroke: color, strokeWidth: "2" }),
    label && /* @__PURE__ */ jsx8("text", { x: at[0] + (at[0] > 215 ? -10 : 10), y: at[1] + (at[1] < 45 ? 22 : -10), textAnchor: at[0] > 215 ? "end" : "start", fill: color, children: label })
  ] });
}
function Arrow({
  from,
  to,
  color = colors2[0],
  dashed = false
}) {
  const id = useId2().replaceAll(":", "");
  if (from[0] === to[0] && from[1] === to[1]) return null;
  return /* @__PURE__ */ jsxs6("g", { children: [
    /* @__PURE__ */ jsx8("defs", { children: /* @__PURE__ */ jsx8("marker", { id, markerWidth: "6", markerHeight: "6", refX: "5", refY: "3", orient: "auto", children: /* @__PURE__ */ jsx8("path", { d: "M0 0L6 3L0 6Z", fill: color }) }) }),
    /* @__PURE__ */ jsx8("path", { d: `M${from.join(" ")}L${to.join(" ")}`, stroke: color, strokeWidth: "2", strokeDasharray: dashed ? "5 4" : void 0, markerEnd: `url(#${id})` })
  ] });
}
function Curve({
  map,
  fn,
  xmin = 0,
  xmax = 4,
  color = colors2[0]
}) {
  const points = Array.from({
    length: 81
  }, (_, i) => {
    const x = xmin + i * (xmax - xmin) / 80;
    return map([x, fn(x)]).join(",");
  }).join(" ");
  return /* @__PURE__ */ jsx8("polyline", { points, fill: "none", stroke: color, strokeWidth: "2.5" });
}
function Controls({
  children,
  onReset
}) {
  return /* @__PURE__ */ jsxs6("div", { className: "nmf-controls", children: [
    children,
    /* @__PURE__ */ jsx8("button", { type: "button", onClick: onReset, children: "Reset" })
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
  const id = useId2();
  return /* @__PURE__ */ jsxs6("label", { htmlFor: id, children: [
    label,
    ": ",
    /* @__PURE__ */ jsx8("output", { children: fmt(value) }),
    /* @__PURE__ */ jsx8("input", { id, type: "range", value, min, max, step, onChange: (e) => onChange(Number(e.target.value)) })
  ] });
}
function Select({
  label,
  value,
  onChange,
  options
}) {
  const id = useId2();
  return /* @__PURE__ */ jsxs6("label", { htmlFor: id, children: [
    label,
    /* @__PURE__ */ jsx8("select", { id, value, onChange: (e) => onChange(e.target.value), children: options.map((o) => /* @__PURE__ */ jsx8("option", { value: o.value ?? o, children: o.label ?? o }, o.value ?? o)) })
  ] });
}
function Result({
  children
}) {
  return /* @__PURE__ */ jsx8("p", { className: "nmf-current", "aria-live": "polite", "aria-atomic": "true", children });
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/combined-author-review/.scenario-state.mjs
import React2 from "react";
function scenarioState(initial) {
  const s = globalThis.__nmfCombinedState, i = s.index++;
  return React2.useState(i < s.values.length ? s.values[i] : initial);
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/NmfFigures.jsx
import React10 from "react";

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/ArrayFigures.jsx
import React4, { useState as useState4 } from "react";

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/Operations.jsx
import React3 from "react";
import { jsx as jsx9, jsxs as jsxs7 } from "react/jsx-runtime";
function Operation({ label, children }) {
  return /* @__PURE__ */ jsx9("div", { className: "nmf-operation", role: "group", "aria-label": label, children });
}
function Port({ label, symbol = "\u2192" }) {
  return /* @__PURE__ */ jsxs7("div", { className: "nmf-port", children: [
    /* @__PURE__ */ jsx9("span", { className: symbol === "\u2192" ? "nmf-port-arrow" : void 0, "aria-hidden": "true", children: symbol }),
    /* @__PURE__ */ jsx9("span", { children: label })
  ] });
}
function DotProduct({ left, right, ids, leftLabel, rightLabel, resultLabel, componentTerms = false }) {
  const terms = left.map((v, i) => v * right[i]);
  return /* @__PURE__ */ jsxs7("div", { className: "nmf-dot-product", children: [
    /* @__PURE__ */ jsx9("p", { className: "nmf-object-label", children: resultLabel }),
    /* @__PURE__ */ jsx9("div", { className: "nmf-array-scroll", tabIndex: 0, role: "region", "aria-label": `${resultLabel}; each paired operand and its contribution`, children: /* @__PURE__ */ jsxs7("table", { children: [
      /* @__PURE__ */ jsx9("thead", { children: /* @__PURE__ */ jsxs7("tr", { children: [
        /* @__PURE__ */ jsx9("th", { scope: "col", children: "Matched axis" }),
        /* @__PURE__ */ jsx9("th", { scope: "col", children: leftLabel }),
        /* @__PURE__ */ jsx9("th", { scope: "col", children: "\xD7" }),
        /* @__PURE__ */ jsx9("th", { scope: "col", children: rightLabel }),
        /* @__PURE__ */ jsx9("th", { scope: "col", children: "Contribution" })
      ] }) }),
      /* @__PURE__ */ jsx9("tbody", { children: terms.map((v, i) => /* @__PURE__ */ jsxs7("tr", { style: componentTerms ? { color: colors2[i % 8] } : void 0, children: [
        /* @__PURE__ */ jsx9("th", { scope: "row", children: ids[i] }),
        /* @__PURE__ */ jsx9("td", { children: fmt(left[i]) }),
        /* @__PURE__ */ jsx9("td", { children: "\xD7" }),
        /* @__PURE__ */ jsx9("td", { children: fmt(right[i]) }),
        /* @__PURE__ */ jsx9("td", { children: fmt(v) })
      ] }, i)) }),
      /* @__PURE__ */ jsx9("tfoot", { children: /* @__PURE__ */ jsxs7("tr", { children: [
        /* @__PURE__ */ jsx9("th", { scope: "row", colSpan: 4, children: "Add the contributions \u2192" }),
        /* @__PURE__ */ jsx9("td", { children: fmt(terms.reduce((a, b) => a + b, 0)) })
      ] }) })
    ] }) })
  ] });
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/ArrayFigures.jsx
import { Fragment as Fragment3, jsx as jsx10, jsxs as jsxs8 } from "react/jsx-runtime";
function Observation() {
  return /* @__PURE__ */ jsx10(Figure, { id: "D01", caption: "R0 is one measured observation. Its three bins share the same0\u20134 intensity ruler; the row identity is not a feature.", children: /* @__PURE__ */ jsx10(Bars, { label: "R0 \xB7 measured intensity", values: X0[0] }) });
}
function Addends() {
  const [a, setA] = scenarioState(2), [b, setB] = scenarioState(1), parts = [[a, 0, a], [0, b, b]], prediction = [a, b, a + b];
  return /* @__PURE__ */ jsxs8(Figure, { id: "D02", caption: "Amounts multiply entire patterns. Matching feature bins then add; neither amount is normalized into a probability.", children: [
    /* @__PURE__ */ jsxs8(Panels, { children: [
      /* @__PURE__ */ jsx10(Matrix, { label: "Fixed H \xB7 component \xD7 feature", values: H0, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx10(Bars, { label: `C0 contribution \xB7 ${fmt(a)} \xD7 H[C0]`, values: parts[0], max: 6, color: colors2[0] }),
      /* @__PURE__ */ jsx10(Bars, { label: `C1 contribution \xB7 ${fmt(b)} \xD7 H[C1]`, values: parts[1], max: 6, color: colors2[1] }),
      /* @__PURE__ */ jsx10(Bars, { label: "Their sum \xB7 reconstructed R0", values: prediction, max: 6 })
    ] }),
    /* @__PURE__ */ jsxs8(Controls, { onReset: () => {
      setA(2);
      setB(1);
    }, children: [
      /* @__PURE__ */ jsx10(Range, { label: "C0 amount", value: a, onChange: setA, max: 3 }),
      /* @__PURE__ */ jsx10(Range, { label: "C1 amount", value: b, onChange: setB, max: 3 })
    ] }),
    /* @__PURE__ */ jsxs8(Result, { children: [
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
  return /* @__PURE__ */ jsxs8(Figure, { id: "D03", caption: "R1/F2 contracts the component dimension: W[R1,C0]H[C0,F2]+W[R1,C1]H[C1,F2]=1\xD71+3\xD71=4. R/C/F IDs are zero-based. White outlines mark every operand used for this output.", children: [
    /* @__PURE__ */ jsxs8(Operation, { label: "Contract the two matching component axes", children: [
      /* @__PURE__ */ jsx10(Matrix, { label: "W \xB7 select observation R1", values: W0, columns: ["C0", "C1"], componentColumns: true, selectedCells: [[1, 0], [1, 1]] }),
      /* @__PURE__ */ jsx10(Port, { label: "match C0/C1", symbol: "\xD7" }),
      /* @__PURE__ */ jsx10(Matrix, { label: "H \xB7 select feature F2", values: H0, rows: ["C0", "C1"], componentRows: true, selectedCells: [[0, 2], [1, 2]] }),
      /* @__PURE__ */ jsx10(Port, { label: "sum both paths" }),
      /* @__PURE__ */ jsx10(Matrix, { label: "WH = X0 \xB7 output R1/F2", values: X0, selected: [1, 2] })
    ] }),
    /* @__PURE__ */ jsx10(DotProduct, { left: W0[1], right: H0.map((row) => row[2]), ids: ["C0", "C1"], leftLabel: "W[R1,c]", rightLabel: "H[c,F2]", resultLabel: "Trace both component paths to reconstructed R1/F2", componentTerms: true })
  ] });
}
function OuterProducts() {
  const parts = [0, 1].map((c) => W0.map((w) => H0[c].map((h) => w[c] * h)));
  return /* @__PURE__ */ jsxs8(Figure, { id: "D04", caption: "Each component contributes a complete row-by-feature outer product. A zero amount removes a row; a zero pattern bin removes a column. Cell size does not encode magnitude.", children: [
    [0, 1].map((c) => /* @__PURE__ */ jsxs8(Operation, { label: `C${c} column times row makes its complete addend`, children: [
      /* @__PURE__ */ jsx10(Matrix, { label: `W[:,C${c}] \xB7 one amount per observation`, values: W0.map((w) => [w[c]]), columns: [`C${c}`], color: colors2[c] }),
      /* @__PURE__ */ jsx10(Port, { label: "column \xD7 row", symbol: "\xD7" }),
      /* @__PURE__ */ jsx10(Matrix, { label: `H[C${c},:] \xB7 one whole pattern`, values: [H0[c]], rows: [`C${c}`], color: colors2[c] }),
      /* @__PURE__ */ jsx10(Port, { label: "outer product" }),
      /* @__PURE__ */ jsx10(Matrix, { label: `Complete C${c} addend`, values: parts[c], color: colors2[c] })
    ] }, c)),
    /* @__PURE__ */ jsxs8(Operation, { label: "Add matching cells of the two complete addends", children: [
      /* @__PURE__ */ jsx10(Matrix, { label: "C0 addend", values: parts[0], color: colors2[0] }),
      /* @__PURE__ */ jsx10(Port, { label: "matching R/F cells", symbol: "+" }),
      /* @__PURE__ */ jsx10(Matrix, { label: "C1 addend", values: parts[1], color: colors2[1] }),
      /* @__PURE__ */ jsx10(Port, { label: "cellwise sum" }),
      /* @__PURE__ */ jsx10(Matrix, { label: "Reconstructed X0", values: X0 })
    ] })
  ] });
}
function AmountFraction() {
  return /* @__PURE__ */ jsx10(Figure, { id: "D05", caption: "Dividing amounts by their total3 changes this product. Fractions sum1; measured amounts do not carry that constraint.", children: /* @__PURE__ */ jsxs8(Panels, { children: [
    /* @__PURE__ */ jsx10(Bars, { label: "Original amounts \xB7 amount units", values: [2, 1], ids: ["C0", "C1"], component: true, max: 3 }),
    /* @__PURE__ */ jsx10(Bars, { label: "Fractions \xB7 dimensionless", values: [2 / 3, 1 / 3], ids: ["C0", "C1"], component: true, max: 1 }),
    /* @__PURE__ */ jsx10(Matrix, { label: "Original reconstruction", values: [[2, 1, 3]] }),
    /* @__PURE__ */ jsx10(Matrix, { label: "Reconstruction using fractions with unchanged H", values: [[2 / 3, 1 / 3, 1]] })
  ] }) });
}
function Compensation() {
  const [s, setS] = scenarioState(1), w = W0.map((r) => [r[0] / s, r[1]]), h = [H0[0].map((v) => v * s), H0[1]];
  return /* @__PURE__ */ jsxs8(Figure, { id: "D06", caption: "The pattern and amount use reciprocal units. Every complete contribution and the product remain unchanged; s=0 cannot be inverted.", children: [
    /* @__PURE__ */ jsxs8(Panels, { children: [
      /* @__PURE__ */ jsx10(Matrix, { label: "Original W", values: W0, columns: ["C0", "C1"], componentColumns: true }),
      /* @__PURE__ */ jsx10(Matrix, { label: "Original H", values: H0, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx10(Matrix, { label: "Compensated W", values: w, columns: ["C0", "C1"], componentColumns: true }),
      /* @__PURE__ */ jsx10(Matrix, { label: "Rescaled H", values: h, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx10(Matrix, { label: "Current product \xB7 unchanged X0", values: matmul(w, h) })
    ] }),
    /* @__PURE__ */ jsx10(Controls, { onReset: () => setS(1), children: /* @__PURE__ */ jsx10(Range, { label: "C0 pattern scale s", value: s, onChange: setS, min: 0.5, max: 3 }) }),
    /* @__PURE__ */ jsxs8(Result, { children: [
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
  return /* @__PURE__ */ jsxs8(Figure, { id: "D08", caption: "A coefficient ranking can reverse under a harmless unit change. Total contributed intensity is unchanged, and still does not establish a physical cause.", children: [
    /* @__PURE__ */ jsxs8(Panels, { children: [
      /* @__PURE__ */ jsx10(Bars, { label: "Amounts \xB7 current factor units", values: [2 / s, 1], ids: ["C0", "C1"], component: true, max: 4 }),
      /* @__PURE__ */ jsx10(Bars, { label: "Total contributed intensity", values: [4, 2], ids: ["C0", "C1"], component: true, max: 4 })
    ] }),
    /* @__PURE__ */ jsx10(Controls, { onReset: () => setS(1), children: /* @__PURE__ */ jsx10(Range, { label: "C0 pattern scale s", value: s, onChange: setS, min: 0.5, max: 3 }) }),
    /* @__PURE__ */ jsxs8(Result, { children: [
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
  return /* @__PURE__ */ jsxs8(Figure, { id: "D09", caption: "Residual means observed minus reconstructed. Blue positive bins need reconstructed mass; rose negative bins have excess. Factor amounts remain nonnegative.", children: [
    /* @__PURE__ */ jsxs8(Panels, { children: [
      /* @__PURE__ */ jsx10(Bars, { label: "Observed R0", values: X0[0], max: 4 }),
      /* @__PURE__ */ jsx10(Bars, { label: "Current prediction", values: prediction, max: 4 }),
      /* @__PURE__ */ jsx10(Bars, { label: "Signed residual \xB7 separate \u22123\u20263 ruler", values: residual, max: 3, signed: true })
    ] }),
    /* @__PURE__ */ jsx10(Controls, { onReset: () => setA(1), children: /* @__PURE__ */ jsx10(Range, { label: "C0 amount; C1 fixed1", value: a, onChange: setA, max: 3 }) }),
    /* @__PURE__ */ jsxs8(Result, { children: [
      "Prediction [",
      prediction.map(fmt).join(", "),
      "]; residual [",
      residual.map(fmt).join(", "),
      "]. At amount2 every residual is zero."
    ] })
  ] });
}
function SquaredCells() {
  return /* @__PURE__ */ jsx10(Figure, { id: "D10", caption: "R1\u2212[1,1,2]=[0,2,2]. The nonzero residual side lengths2 become square areas4 each: half-loss4. Whole-table initial squared residual norm12 gives half-loss6 and MSE12/9.", children: /* @__PURE__ */ jsxs8(Panels, { children: [
    /* @__PURE__ */ jsx10(Matrix, { label: "Observed, predicted, signed residual", rows: ["R1", "Prediction", "Residual"], values: [[1, 3, 4], [1, 1, 2], [0, 2, 2]] }),
    /* @__PURE__ */ jsxs8("div", { className: "nmf-plot", children: [
      /* @__PURE__ */ jsx10("p", { className: "nmf-object-label", children: "Residual squares \xB7 squared intensity units" }),
      /* @__PURE__ */ jsxs8("svg", { viewBox: "0 0 300 150", role: "img", "aria-label": "F0 square area0; F1 and F2 squares side2 area4 each", children: [
        /* @__PURE__ */ jsx10("text", { x: "15", y: "30", children: "F0: area0" }),
        [110, 210].map((x, i) => /* @__PURE__ */ jsxs8("g", { children: [
          /* @__PURE__ */ jsx10("rect", { x, y: "48", width: "70", height: "70", fill: colors2[0], opacity: ".5" }),
          /* @__PURE__ */ jsxs8("text", { x, y: "30", children: [
            "F",
            i + 1,
            ": area4"
          ] }),
          /* @__PURE__ */ jsx10("text", { x: x + 10, y: "140", children: "side2" })
        ] }, x))
      ] })
    ] })
  ] }) });
}
function Missing() {
  const [x, setX] = scenarioState(2);
  return /* @__PURE__ */ jsxs8(Figure, { id: "D11", caption: "An omitted measurement is no information, rather than an observed0. Included loss0 does not assess the missing bin.", children: [
    /* @__PURE__ */ jsxs8(Panels, { children: [
      /* @__PURE__ */ jsx10(Matrix, { label: "Measured zero \xB7 both cells observed", rows: ["Observation", "Prediction"], values: [[x, 0], [x / 2, x / 2]] }),
      /* @__PURE__ */ jsx10(Matrix, { label: "Omitted second bin \xB7 mask[1,0]", rows: ["Observation", "Prediction"], values: [[x, "missing"], [x, x]] })
    ] }),
    /* @__PURE__ */ jsx10(Controls, { onReset: () => setX(2), children: /* @__PURE__ */ jsx10(Range, { label: "First measured value", value: x, onChange: setX, max: 4 }) }),
    /* @__PURE__ */ jsxs8(Result, { children: [
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
  return /* @__PURE__ */ jsxs8(Figure, { id: "D12", caption: "These scalar objectives measure different disagreements. All live values are positive. KL(0,y)=y; positive observation with y=0 has infinite KL. IS excludes observed0.", children: [
    /* @__PURE__ */ jsx10(Panels, { children: [[2, "Half squared error"], [1, "Generalized KL"], [0, "Itakura\u2013Saito"]].map(([beta, label]) => /* @__PURE__ */ jsx10(Plot, { label, xmin: 0.5, xmax: 4, ymax: 8, xlabel: "prediction y", ylabel: "entrywise cost", children: (map) => /* @__PURE__ */ jsxs8(Fragment3, { children: [
      /* @__PURE__ */ jsx10(Curve, { map, xmin: 0.5, xmax: 4, fn: (y) => divergence(x, y, beta) }),
      /* @__PURE__ */ jsx10("circle", { cx: map([x, 0])[0], cy: map([x, 0])[1], r: "5", fill: colors2[1] })
    ] }) }, beta)) }),
    /* @__PURE__ */ jsx10(Controls, { onReset: () => setX(2), children: /* @__PURE__ */ jsx10(Range, { label: "Observed x", value: x, onChange: setX, min: 0.5, max: 4 }) }),
    /* @__PURE__ */ jsxs8(Result, { children: [
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

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/GeometryFigures.jsx
import React5, { useState as useState5 } from "react";
import { Fragment as Fragment4, jsx as jsx11, jsxs as jsxs9 } from "react/jsx-runtime";
function Shear() {
  const [t, setT] = scenarioState(0.5), s = shear(t);
  return /* @__PURE__ */ jsxs9(Figure, { id: "D07", caption: "This separate supplied dictionary Hs permits a shear beyond scale or permutation. The plot shows its F0/F1 projection; the complete three-feature cells retain F2.", children: [
    /* @__PURE__ */ jsxs9(Panels, { children: [
      /* @__PURE__ */ jsx11(Matrix, { label: "Original Hs", values: [[1, 1, 1], [0, 1, 1]], rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx11(Matrix, { label: "Changed Hs", values: s.h, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx11(Matrix, { label: "Changed amounts", values: s.w, columns: ["C0", "C1"], componentColumns: true }),
      /* @__PURE__ */ jsx11(Matrix, { label: "Both products", values: [[2, 3, 3], ...matmul(s.w, s.h)], rows: ["Before", "After"] }),
      /* @__PURE__ */ jsx11(Plot, { label: "Pattern direction changes \xB7 projected rays", xmax: 2, ymax: 2, children: (map) => /* @__PURE__ */ jsxs9(Fragment4, { children: [
        /* @__PURE__ */ jsx11(Arrow, { from: map([0, 0]), to: map([1, 1]), dashed: true }),
        /* @__PURE__ */ jsx11(Arrow, { from: map([0, 0]), to: map([1, 1 - t]) }),
        /* @__PURE__ */ jsx11(Arrow, { from: map([0, 0]), to: map([0, 1]), color: colors2[1] }),
        /* @__PURE__ */ jsx11(Point, { at: map([1, 1 - t]), label: "C0" }),
        /* @__PURE__ */ jsx11(Point, { at: map([0, 1]), label: "C1", color: colors2[1] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx11(Controls, { onReset: () => setT(0.5), children: /* @__PURE__ */ jsx11(Range, { label: "Feasible shear t", value: t, onChange: setT, max: 1, step: 0.1 }) }),
    /* @__PURE__ */ jsxs9(Result, { children: [
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
  return /* @__PURE__ */ jsx11(Plot, { label: "Fixed Hc \xB7 attainable cone and query", xmax: 2, ymax: 2, children: (map) => /* @__PURE__ */ jsxs9(Fragment4, { children: [
    /* @__PURE__ */ jsx11("polygon", { points: [[0, 0], [2, 0], [2, 2]].map((p) => map(p).join(",")).join(" "), fill: colors2[0], opacity: ".1" }),
    /* @__PURE__ */ jsx11(Arrow, { from: map([0, 0]), to: map([1.7, 0]) }),
    /* @__PURE__ */ jsx11(Arrow, { from: map([0, 0]), to: map([1.7, 1.7]), color: colors2[1] }),
    /* @__PURE__ */ jsx11(Arrow, { from: map(q.prediction), to: map([u, v]), color: "#f2c276", dashed: true }),
    /* @__PURE__ */ jsx11(Point, { at: map(q.prediction), label: q.prediction[0] === u && q.prediction[1] === v ? void 0 : "fit", color: colors2[1] }),
    /* @__PURE__ */ jsx11(Point, { at: map([u, v]), label: q.prediction[0] === u && q.prediction[1] === v ? "q = fit" : "q", diamond: true, open: true, color: "#f2c276" })
  ] }) });
}
function Cone({
  id = "D13",
  frozen = false
}) {
  const [u, setU] = scenarioState(frozen ? 0 : 1), [v, setV] = scenarioState(frozen ? 1 : 0.5), q = coneQuery(u, v);
  return /* @__PURE__ */ jsxs9(Figure, { id, caption: frozen ? "A query uses the stored feature order and fixed dictionary; only its new amounts change. Wrong shape or feature order is refused rather than refitting H." : "Nonnegative combinations of Hc rows fill the shaded cone, including its boundary and origin. Outside queries project onto a feasible ray.", children: [
    /* @__PURE__ */ jsxs9(Panels, { children: [
      /* @__PURE__ */ jsx11(Matrix, { label: "Stored Hc \xB7 fixed F0/F1 order", values: [[1, 0], [1, 1]], rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx11(ConePicture, { u, v }),
      /* @__PURE__ */ jsx11(Matrix, { label: "Query \u2192 new amounts \u2192 prediction", values: [[u, v], q.w, q.prediction], rows: ["Query", "C0/C1 amounts", "Prediction"] })
    ] }),
    /* @__PURE__ */ jsxs9(Controls, { onReset: () => {
      setU(frozen ? 0 : 1);
      setV(frozen ? 1 : 0.5);
    }, children: [
      /* @__PURE__ */ jsx11(Range, { label: "Query F0", value: u, onChange: setU, max: 2 }),
      /* @__PURE__ */ jsx11(Range, { label: "Query F1", value: v, onChange: setV, max: 2 })
    ] }),
    /* @__PURE__ */ jsxs9(Result, { children: [
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
  return /* @__PURE__ */ jsxs9(Figure, { id: "D14", caption: "Clipping the unconstrained coefficients does not reoptimize the remaining positive coordinate. The clipped free-coordinate gradient1 becomes0 at the NNLS solution.", children: [
    /* @__PURE__ */ jsxs9(Panels, { children: [
      /* @__PURE__ */ jsx11(Plot, { label: "Amount plane \xB7 feasible first quadrant", xmin: -1.5, xmax: 1.5, ymax: 1.5, xlabel: "C0 amount", ylabel: "C1 amount", equalUnits: true, children: (map) => /* @__PURE__ */ jsxs9(Fragment4, { children: [
        /* @__PURE__ */ jsx11("polygon", { points: [[0, 0], [1.5, 0], [1.5, 1.5], [0, 1.5]].map((p) => map(p).join(",")).join(" "), fill: colors2[0], opacity: ".1" }),
        /* @__PURE__ */ jsx11(Point, { at: map([-1, 1]), label: "LS", open: true }),
        /* @__PURE__ */ jsx11(Point, { at: map([0, 1]), label: "clip", color: colors2[1] }),
        /* @__PURE__ */ jsx11(Point, { at: map([0, 0.5]), label: "NNLS", color: "#f2c276" })
      ] }) }),
      /* @__PURE__ */ jsx11(Plot, { label: "Observation plane \xB7 three predictions", xmax: 1.5, ymax: 1.5, children: (map) => /* @__PURE__ */ jsxs9(Fragment4, { children: [
        /* @__PURE__ */ jsx11(Point, { at: map([0, 1]), label: "q / LS", open: true }),
        /* @__PURE__ */ jsx11(Point, { at: map([1, 1]), label: "clip", color: colors2[1] }),
        /* @__PURE__ */ jsx11(Point, { at: map([0.5, 0.5]), label: "NNLS", color: "#f2c276" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx11(Matrix, { label: "Amounts / reconstructed cells / half-loss", rows: ["Unconstrained", "Clipped", "NNLS"], columns: ["C0", "C1", "F0", "F1", "Loss"], values: [[-1, 1, 0, 1, 0], [0, 1, 1, 1, 0.5], [0, 0.5, 0.5, 0.5, 0.25]], signed: true })
  ] });
}
function CoordinateSlice() {
  const [a, setA] = scenarioState(1), prediction = [a, 1, a + 1];
  return /* @__PURE__ */ jsxs9(Figure, { id: "D16", caption: "Only C0 changes; C1 remains1. Its exact convex slice L(a)=a\xB2\u22124a+7 has minimum a2 and loss3. This is one coordinate, not a complete solved fit.", children: [
    /* @__PURE__ */ jsxs9(Panels, { children: [
      /* @__PURE__ */ jsx11(Bars, { label: "R1 minus current prediction", values: [1 - a, 2, 3 - a], signed: true, max: 3 }),
      /* @__PURE__ */ jsx11(Plot, { label: "Coordinate half-loss", xmax: 3, ymax: 7, xlabel: "C0 amount a", ylabel: "half-loss", children: (map) => /* @__PURE__ */ jsxs9(Fragment4, { children: [
        /* @__PURE__ */ jsx11(Curve, { map, xmax: 3, fn: (a2) => a2 * a2 - 4 * a2 + 7 }),
        /* @__PURE__ */ jsx11(Point, { at: map([a, a * a - 4 * a + 7]), label: a === 2 ? "now / min" : "now", color: colors2[1] }),
        a !== 2 && /* @__PURE__ */ jsx11(Point, { at: map([2, 3]), label: "min" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx11(Controls, { onReset: () => setA(1), children: /* @__PURE__ */ jsx11(Range, { label: "C0 amount; C1 fixed1", value: a, onChange: setA, max: 3 }) }),
    /* @__PURE__ */ jsxs9(Result, { children: [
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
  return /* @__PURE__ */ jsxs9(Figure, { id: "D17", caption: "G contracts feature bins into component pairs, while P contracts each observed row with each pattern. G01=1\xD70+0\xD71+1\xD71=1; P[R1,C1]=1\xD70+3\xD71+4\xD71=7.", children: [
    /* @__PURE__ */ jsxs9(Operation, { label: "Build the Gram cache from two pattern operands", children: [
      /* @__PURE__ */ jsx11(Matrix, { label: "H \xB7 component \xD7 feature", values: H0, rows: ["C0", "C1"], componentRows: true, selectedCells: [[0, 0], [0, 1], [0, 2]] }),
      /* @__PURE__ */ jsx11(Port, { label: "contract F0/F1/F2", symbol: "\xD7" }),
      /* @__PURE__ */ jsx11(Matrix, { label: "H\u1D40 \xB7 feature \xD7 component", values: transpose(H0), rows: ["F0", "F1", "F2"], columns: ["C0", "C1"], componentColumns: true, selectedCells: [[0, 1], [1, 1], [2, 1]] }),
      /* @__PURE__ */ jsx11(Port, { label: "sum feature paths" }),
      /* @__PURE__ */ jsx11(Matrix, { label: "G = H H\u1D40", values: matmul(H0, transpose(H0)), rows: ["C0", "C1"], columns: ["C0", "C1"], selected: [0, 1] })
    ] }),
    /* @__PURE__ */ jsx11(DotProduct, { left: H0[0], right: H0[1], ids: ["F0", "F1", "F2"], leftLabel: "H[C0,f]", rightLabel: "H[C1,f]", resultLabel: "Selected Gram entry G[C0,C1]" }),
    /* @__PURE__ */ jsxs9(Operation, { label: "Build the cross cache from an observation and a pattern", children: [
      /* @__PURE__ */ jsx11(Matrix, { label: "X0 \xB7 select R1", values: X0, selectedCells: [[1, 0], [1, 1], [1, 2]] }),
      /* @__PURE__ */ jsx11(Port, { label: "same feature order", symbol: "\xD7" }),
      /* @__PURE__ */ jsx11(Matrix, { label: "H\u1D40 \xB7 select C1", values: transpose(H0), rows: ["F0", "F1", "F2"], columns: ["C0", "C1"], componentColumns: true, selectedCells: [[0, 1], [1, 1], [2, 1]] }),
      /* @__PURE__ */ jsx11(Port, { label: "sum feature paths" }),
      /* @__PURE__ */ jsx11(Matrix, { label: "P = X0 H\u1D40", values: matmul(X0, transpose(H0)), columns: ["C0", "C1"], selected: [1, 1] })
    ] }),
    /* @__PURE__ */ jsx11(DotProduct, { left: X0[1], right: H0[1], ids: ["F0", "F1", "F2"], leftLabel: "X[R1,f]", rightLabel: "H[C1,f]", resultLabel: "Selected cross entry P[R1,C1]" })
  ] });
}
function Cyclic() {
  const [step, setStep] = scenarioState(0), states = [[1, 1], [2, 1], [2, 2.5]], fresh = states[step], stale = step < 2 ? fresh : [2, 3];
  return /* @__PURE__ */ jsxs9(Figure, { id: "D18", caption: "Fresh earlier coordinates matter. The second cyclic slope uses C0=2; its stale branch still uses C0=1. Known exact[1,3] is a separate reference, not this sweep's result.", children: [
    /* @__PURE__ */ jsxs9(Panels, { children: [
      /* @__PURE__ */ jsx11(Matrix, { label: "Cyclic \xB7 current operands", rows: ["Amounts", "Prediction"], columns: ["0", "1", "2"], values: [[...fresh, "\u2014"], matmul([fresh], H0)[0]] }),
      /* @__PURE__ */ jsx11(Matrix, { label: "Stale comparison \xB7 persistent branch", rows: ["Amounts", "Prediction"], columns: ["0", "1", "2"], values: [[...stale, "\u2014"], matmul([stale], H0)[0]] }),
      /* @__PURE__ */ jsx11(Matrix, { label: "Known exact reference", values: [[1, 3, "\u2014"], [1, 3, 4]], rows: ["Amounts", "Prediction"] })
    ] }),
    /* @__PURE__ */ jsxs9(Controls, { onReset: () => setStep(0), children: [
      /* @__PURE__ */ jsx11("button", { disabled: step === 0, onClick: () => setStep(step - 1), children: "Back" }),
      /* @__PURE__ */ jsx11("button", { disabled: step === 2, onClick: () => setStep(step + 1), children: "Step" })
    ] }),
    /* @__PURE__ */ jsx11(Result, { children: ["Start [1,1]. First C0 slope\u22122; next update will set C0=2.", "C0 updated to2. Fresh C1 slope\u22123; stale C1 slope\u22124.", "Cyclic [2,2.5], loss.75; stale [2,3], loss1. Exact reference [1,3] has loss0."][step] })
  ] });
}
function KKT() {
  const [b, setB] = scenarioState(0.5), g = [b, 2 * b - 1], pg = [0, g[1]];
  return /* @__PURE__ */ jsxs9(Figure, { id: "D19", caption: "At zero C0, a positive outward slope is compatible with a constrained minimum. At positive C1 its gradient must be zero. At the origin C1 has an improving feasible direction.", children: [
    /* @__PURE__ */ jsxs9(Panels, { children: [
      /* @__PURE__ */ jsx11(Plot, { label: "Feasible C0 motion and improving C1 direction", xmax: 1, ymax: 1, xlabel: "C0 amount", ylabel: "C1 amount", children: (map) => /* @__PURE__ */ jsxs9(Fragment4, { children: [
        /* @__PURE__ */ jsx11(Arrow, { from: map([0, b]), to: map([0.35, b]), color: colors2[0] }),
        /* @__PURE__ */ jsx11(Arrow, { from: map([0, b]), to: map([0, b === 0.5 ? b : b < 0.5 ? Math.min(1, b + 0.35) : Math.max(0, b - 0.35)]), color: colors2[1] }),
        /* @__PURE__ */ jsx11(Point, { at: map([0, b]), label: "w" })
      ] }) }),
      /* @__PURE__ */ jsx11(Matrix, { label: "Gradient and projected gradient", rows: ["Gradient", "Projected"], columns: ["C0", "C1"], values: [g, b === 0 ? [0, -1] : pg], signed: true })
    ] }),
    /* @__PURE__ */ jsx11(Controls, { onReset: () => setB(0.5), children: /* @__PURE__ */ jsx11(Range, { label: "C1 amount; C0 fixed0", value: b, onChange: setB, max: 1, step: 0.1 }) }),
    /* @__PURE__ */ jsxs9(Result, { children: [
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
  return /* @__PURE__ */ jsxs9(Figure, { id: "D20", caption: "This complete CD sweep changes W first, then changes H using the new W. Its operand order differs from the historical H-first multiplicative route.", children: [
    /* @__PURE__ */ jsxs9(Operation, { label: "W block holds H0 fixed, constructs caches, then updates W", children: [
      /* @__PURE__ */ jsx11(Matrix, { label: "Held H0 \xB7 never changed by W block", values: H0, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx11(Port, { label: "H0 H0\u1D40 and X0 H0\u1D40" }),
      /* @__PURE__ */ jsxs9("div", { children: [
        /* @__PURE__ */ jsx11(Matrix, { label: "W-block G", values: matmul(H0, transpose(H0)), rows: ["C0", "C1"], columns: ["C0", "C1"] }),
        /* @__PURE__ */ jsx11(Matrix, { label: "W-block P", values: matmul(X0, transpose(H0)), columns: ["C0", "C1"] })
      ] }),
      /* @__PURE__ */ jsx11(Port, { label: "cyclic CD from W start; publish new W" }),
      /* @__PURE__ */ jsx11(Matrix, { label: step === 0 ? "W start \xB7 block not yet applied" : "New W \xB7 H-block operand", values: w, columns: ["C0", "C1"], componentColumns: true })
    ] }),
    step > 0 && /* @__PURE__ */ jsxs9(Operation, { label: "H block rebuilds its operands from new W, not the old W", children: [
      /* @__PURE__ */ jsx11(Matrix, { label: "New W \xB7 held for H block", values: s.w, columns: ["C0", "C1"], componentColumns: true }),
      /* @__PURE__ */ jsx11(Port, { label: "new W\u1D40 new W and new W\u1D40 X0" }),
      /* @__PURE__ */ jsxs9("div", { children: [
        /* @__PURE__ */ jsx11(Matrix, { label: "H-block G \xB7 rebuilt from new W", values: newWG, rows: ["C0", "C1"], columns: ["C0", "C1"] }),
        /* @__PURE__ */ jsx11(Matrix, { label: "H-block P \xB7 rebuilt from new W", values: newWP, rows: ["C0", "C1"] })
      ] }),
      /* @__PURE__ */ jsx11(Port, { label: "cyclic CD from H0; publish new H" }),
      /* @__PURE__ */ jsx11(Matrix, { label: step === 1 ? "H0 \xB7 H block not yet applied" : "New H \xB7 from new W", values: h, rows: ["C0", "C1"], componentRows: true })
    ] }),
    /* @__PURE__ */ jsxs9(Operation, { label: "Current factor state reconstructs the full table", children: [
      /* @__PURE__ */ jsx11(Matrix, { label: "Current W", values: w, componentColumns: true, columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx11(Port, { label: "\xD7 current H" }),
      /* @__PURE__ */ jsx11(Matrix, { label: "Current H", values: h, componentRows: true, rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx11(Port, { label: "reconstruct" }),
      /* @__PURE__ */ jsx11(Matrix, { label: "Current prediction", values: prediction })
    ] }),
    /* @__PURE__ */ jsxs9(Controls, { onReset: () => setStep(0), children: [
      /* @__PURE__ */ jsx11("button", { disabled: step === 0, onClick: () => setStep(step - 1), children: "Back" }),
      /* @__PURE__ */ jsx11("button", { disabled: step === 2, onClick: () => setStep(step + 1), children: "Step" })
    ] }),
    /* @__PURE__ */ jsxs9(Result, { children: [
      ["Initial factors", "W block complete; H remains H0", "H block complete using new W"][step],
      "; whole-table half-loss ",
      fmt(halfLoss(X0, prediction)),
      ". Expected checkpoints6 \u2192 15/16 \u2192 11733/26620."
    ] })
  ] });
}
function Joint() {
  return /* @__PURE__ */ jsx11(Figure, { id: "D21", caption: "Two feasible factor pairs reconstruct x1 exactly, while their factor midpoint predicts9/8 and has positive loss1/128. A separate fixed-H slice remains convex.", children: /* @__PURE__ */ jsxs9(Panels, { children: [
    /* @__PURE__ */ jsx11(Plot, { label: "Factor plane \xB7 wh=1", xmax: 2.5, ymax: 2, xlabel: "w", ylabel: "h", children: (map) => /* @__PURE__ */ jsxs9(Fragment4, { children: [
      /* @__PURE__ */ jsx11(Curve, { map, xmin: 0.5, xmax: 2.5, fn: (w) => 1 / w }),
      /* @__PURE__ */ jsx11("path", { d: `M${map([1, 1]).join(" ")}L${map([2, 0.5]).join(" ")}`, stroke: colors2[1] }),
      /* @__PURE__ */ jsx11(Point, { at: map([1, 1]), label: "A" }),
      /* @__PURE__ */ jsx11(Point, { at: map([2, 0.5]), label: "B" }),
      /* @__PURE__ */ jsx11(Point, { at: map([1.5, 0.75]), label: "mid", color: colors2[1] })
    ] }) }),
    /* @__PURE__ */ jsx11(Plot, { label: "Fixed h1 \xB7 convex slice", xmax: 2.5, ymax: 1.5, xlabel: "w", ylabel: "half-loss", children: (map) => /* @__PURE__ */ jsx11(Curve, { map, xmax: 2.5, fn: (w) => (1 - w) ** 2 / 2 }) })
  ] }) });
}
function Stationarity() {
  const [w, setW] = scenarioState(0);
  return /* @__PURE__ */ jsxs9(Figure, { id: "D22", caption: "An unchanged zero-locked amount can have a substantial feasible gradient. A cap or zero loss-change does not certify stationarity.", children: [
    /* @__PURE__ */ jsxs9(Panels, { children: [
      /* @__PURE__ */ jsx11(Plot, { label: "Exact scalar objective", xmax: 1, ymax: 0.5, xlabel: "w", ylabel: "half-loss", children: (map) => /* @__PURE__ */ jsxs9(Fragment4, { children: [
        /* @__PURE__ */ jsx11(Curve, { map, xmax: 1, fn: (w2) => (1 - w2) ** 2 / 2 }),
        /* @__PURE__ */ jsx11(Point, { at: map([w, (1 - w) ** 2 / 2]), label: "now" })
      ] }) }),
      /* @__PURE__ */ jsx11(Bars, { label: "Absolute projected gradient \xB7 tolerance1e\u22125", values: [1 - w], ids: ["PG"], max: 1 })
    ] }),
    /* @__PURE__ */ jsx11(Controls, { onReset: () => setW(0), children: /* @__PURE__ */ jsx11(Range, { label: "Scalar amount w", value: w, onChange: setW, max: 1, step: 0.1 }) }),
    /* @__PURE__ */ jsxs9(Result, { children: [
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
  return /* @__PURE__ */ jsxs9(Figure, { id: "D23", caption: "Actual shapes make the storage terms concrete. X exists as input; training W may be returned, H and metadata support later queries, and Gram/cross/row diagnostics are workspace. A changed factor requires cache rebuilding.", children: [
    /* @__PURE__ */ jsxs9("div", { className: "nmf-lifetime", children: [
      /* @__PURE__ */ jsx11("h4", { children: "Caller input \xB7 not learned state" }),
      /* @__PURE__ */ jsx11(Matrix, { label: "Input X \xB7 nd=9 cells", values: X0 })
    ] }),
    /* @__PURE__ */ jsxs9("div", { className: "nmf-lifetime", children: [
      /* @__PURE__ */ jsx11("h4", { children: "Returned training result \xB7 caller lifetime" }),
      /* @__PURE__ */ jsx11(Matrix, { label: "Returned training W \xB7 nk=6", values: W0, columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx11("p", { children: "Returning W does not require keeping all training rows inside the fitted object for later queries." })
    ] }),
    /* @__PURE__ */ jsxs9("div", { className: "nmf-lifetime nmf-lifetime--retained", children: [
      /* @__PURE__ */ jsx11("h4", { children: "Retained fitted state \xB7 later query lifetime" }),
      /* @__PURE__ */ jsxs9(Panels, { children: [
        /* @__PURE__ */ jsx11(Matrix, { label: "Retained fitted H \xB7 kd=6", values: H0, rows: ["C0", "C1"] }),
        /* @__PURE__ */ jsx11(Matrix, { label: "Retained metadata slots", values: [[2, "F0/F1/F2", "stored objective", "stored stop reason"]], columns: ["Fitted k", "Ordered features", "Diagnostic", "Diagnostic"] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs9("div", { className: "nmf-lifetime", children: [
      /* @__PURE__ */ jsx11("h4", { children: "Transient solver workspace \xB7 rebuild after operand changes" }),
      /* @__PURE__ */ jsxs9(Operation, { label: "A changed H invalidates G and P", children: [
        /* @__PURE__ */ jsx11(Matrix, { label: "Current H", values: H0 }),
        /* @__PURE__ */ jsx11(Port, { label: "H changes \u2192 rebuild H H\u1D40 and X H\u1D40" }),
        /* @__PURE__ */ jsxs9("div", { children: [
          /* @__PURE__ */ jsx11(Matrix, { label: "Workspace G \xB7 k\xB2=4", values: matmul(H0, transpose(H0)), columns: ["C0", "C1"], rows: ["C0", "C1"] }),
          /* @__PURE__ */ jsx11(Matrix, { label: "Workspace P \xB7 nk=6", values: matmul(X0, transpose(H0)), columns: ["C0", "C1"] })
        ] })
      ] }),
      /* @__PURE__ */ jsx11("p", { children: "For the H block, new W similarly replaces W\u1D40W and W\u1D40X. Caches belong to their exact current operands." })
    ] }),
    /* @__PURE__ */ jsxs9("div", { className: "nmf-lifetime", children: [
      /* @__PURE__ */ jsx11("h4", { children: "Temporary row diagnostics \xB7 release after reduction" }),
      /* @__PURE__ */ jsx11(Matrix, { label: "One diagnostic row block \xB7 bd=3", values: [X0[0]] }),
      /* @__PURE__ */ jsx11("p", { children: "A block reduces into diagnostic totals; explicitly requested history has its own retained lifetime." })
    ] }),
    /* @__PURE__ */ jsx11("p", { children: "Cache construction O(ndk+(n+d)k\xB2); q cyclic sweeps O(q(n+d)k\xB2); reconstruction diagnostics O(ndk). Transient caches O(k\xB2+max(nk,kd)), plus block diagnostics and explicitly retained history. These are operation/storage counts, not measured timings." })
  ] });
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/OptimizationFigures.jsx
import React6, { useState as useState6 } from "react";
import { Fragment as Fragment5, jsx as jsx12, jsxs as jsxs10 } from "react/jsx-runtime";
function Ratio() {
  const s = muSweep(X0, onesW, H0), gram = matmul(transpose(onesW), onesW);
  return /* @__PURE__ */ jsxs10(Figure, { id: "D24", caption: "Each elementwise ratio multiplies the old H cell. The selected C0/F2 cell is1\xD79/6=1.5; an old zero remains zero. No matrix inverse is involved.", children: [
    /* @__PURE__ */ jsxs10(Operation, { label: "Selected numerator contracts observation identities", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "W\u1D40 \xB7 component by observation", values: transpose(onesW), rows: ["C0", "C1"], columns: ["R0", "R1", "R2"], selectedCells: [[0, 0], [0, 1], [0, 2]] }),
      /* @__PURE__ */ jsx12(Port, { label: "contract R0/R1/R2 with X F2" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "X \xB7 selected feature F2", values: X0, selectedCells: [[0, 2], [1, 2], [2, 2]] }),
      /* @__PURE__ */ jsx12(Port, { label: "W\u1D40 X" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Numerator W\u1D40 X", values: s.hn, rows: ["C0", "C1"], selected: [0, 2] })
    ] }),
    /* @__PURE__ */ jsx12(DotProduct, { left: [1, 1, 1], right: [3, 4, 2], ids: ["R0", "R1", "R2"], leftLabel: "W[R,C0]", rightLabel: "X[R,F2]", resultLabel: "Numerator[C0,F2]=9" }),
    /* @__PURE__ */ jsxs10(Operation, { label: "Selected denominator contracts component identities", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "W\u1D40 W", values: gram, rows: ["C0", "C1"], columns: ["C0", "C1"], selectedCells: [[0, 0], [0, 1]] }),
      /* @__PURE__ */ jsx12(Port, { label: "contract C0/C1 with old H F2" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Old H", values: H0, rows: ["C0", "C1"], componentRows: true, selectedCells: [[0, 2], [1, 2]] }),
      /* @__PURE__ */ jsx12(Port, { label: "W\u1D40 W H" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Denominator", values: s.hd, rows: ["C0", "C1"], selected: [0, 2] })
    ] }),
    /* @__PURE__ */ jsx12(DotProduct, { left: gram[0], right: [H0[0][2], H0[1][2]], ids: ["C0", "C1"], leftLabel: "Gram[C0,C]", rightLabel: "Old H[C,F2]", resultLabel: "Denominator[C0,F2]=6", componentTerms: true }),
    /* @__PURE__ */ jsxs10(Operation, { label: "Elementwise multiplication updates the selected cell", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "Selected old H[C0,F2]", values: [[1]], color: colors2[0] }),
      /* @__PURE__ */ jsx12(Port, { label: "\xD7 numerator9 / denominator6" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Selected new H[C0,F2]", values: [[s.h[0][2]]], color: colors2[0] }),
      /* @__PURE__ */ jsx12(Port, { label: "same rule for every cell" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "New H", values: s.h, rows: ["C0", "C1"], componentRows: true, selected: [0, 2] })
    ] }),
    /* @__PURE__ */ jsxs10(Operation, { label: "Zero-lock consequence uses the same positive denominator", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "Old H[C0,F1]=0", values: [[0]], color: colors2[0] }),
      /* @__PURE__ */ jsx12(Port, { label: `\xD7 ${fmt(s.hn[0][1])} / ${fmt(s.hd[0][1])}` }),
      /* @__PURE__ */ jsx12(Matrix, { label: "New H[C0,F1]=0", values: [[s.h[0][1]]], color: colors2[0] })
    ] })
  ] });
}
function HistoricalMU() {
  const [step, setStep] = scenarioState(0), x = [[2, 1, 3], [1, 2, 3], [3, 3, 6]], w0 = [[1, 0.5], [0.5, 1], [1, 1]], h0 = [[1, 0.2, 0.8], [0.2, 1, 0.8]], s = muSweep(x, w0, h0), w = step < 2 ? w0 : s.w, h = step === 0 ? h0 : s.h;
  return /* @__PURE__ */ jsxs10(Figure, { id: "D25", caption: "This direct one-step calculation uses the original supplied operands. H updates first; its new values feed W's Gram/cross products. It does not rerun the preserved forty-sweep program.", children: [
    /* @__PURE__ */ jsxs10(Operation, { label: "H-first update holds original W fixed", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "Held original W", values: w0, columns: ["C0", "C1"], componentColumns: true }),
      /* @__PURE__ */ jsx12(Port, { label: "W\u1D40X / ((W\u1D40W)H old)" }),
      /* @__PURE__ */ jsxs10("div", { children: [
        /* @__PURE__ */ jsx12(Matrix, { label: "H numerator", values: s.hn }),
        /* @__PURE__ */ jsx12(Matrix, { label: "H denominator \xB7 old H", values: s.hd })
      ] }),
      /* @__PURE__ */ jsx12(Port, { label: "old H \u2299 ratio \u2192 new H" }),
      /* @__PURE__ */ jsx12(Matrix, { label: step === 0 ? "Original H \xB7 update not yet applied" : "New H \xB7 next W-block operand", values: h, rows: ["C0", "C1"], componentRows: true })
    ] }),
    step > 0 && /* @__PURE__ */ jsxs10(Operation, { label: "W update consumes new H, with original W as the multiplicative amount", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "Fresh new H", values: s.h, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx12(Port, { label: "rebuild new H H\u1D40 and X new H\u1D40" }),
      /* @__PURE__ */ jsxs10("div", { children: [
        /* @__PURE__ */ jsx12(Matrix, { label: "New H H\u1D40 \xB7 W Gram cache", values: matmul(s.h, transpose(s.h)), rows: ["C0", "C1"], columns: ["C0", "C1"] }),
        /* @__PURE__ */ jsx12(Matrix, { label: "W numerator \xB7 X new H\u1D40", values: s.wn }),
        /* @__PURE__ */ jsx12(Matrix, { label: "W denominator \xB7 original W \xD7 new Gram", values: s.wd })
      ] }),
      /* @__PURE__ */ jsx12(Port, { label: "original W \u2299 ratio \u2192 new W" }),
      /* @__PURE__ */ jsx12(Matrix, { label: step === 1 ? "Original W \xB7 update not yet applied" : "New W \xB7 from new H", values: w, columns: ["C0", "C1"], componentColumns: true })
    ] }),
    /* @__PURE__ */ jsx12(Matrix, { label: "Current prediction \xB7 current W \xD7 current H", values: matmul(w, h) }),
    /* @__PURE__ */ jsxs10(Controls, { onReset: () => setStep(0), children: [
      /* @__PURE__ */ jsx12("button", { disabled: step === 0, onClick: () => setStep(step - 1), children: "Back" }),
      /* @__PURE__ */ jsx12("button", { disabled: step === 2, onClick: () => setStep(step + 1), children: "Step" })
    ] }),
    /* @__PURE__ */ jsxs10(Result, { children: [
      ["Initial supplied factors", "H-first update complete", "W update using new H complete"][step],
      "; half-loss ",
      fmt(halfLoss(x, matmul(w, h))),
      ". Original rounded endpoints17.06 \u2192 .03944744."
    ] })
  ] });
}
function ZeroLock() {
  const [w, setW] = scenarioState(0), mu = 2 * w / (w + 1);
  return /* @__PURE__ */ jsxs10(Figure, { id: "D26", caption: "The denominator w+1 is positive throughout. At exact zero, multiplication cannot enter an improving direction; a coordinate update can.", children: [
    /* @__PURE__ */ jsxs10(Panels, { children: [
      /* @__PURE__ */ jsx12(Bars, { label: "Starting amount and both updated amounts", values: [w, mu, 1], ids: ["Start", "MU", "CD"], max: 1 }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Actual predictions, losses and gradients", columns: ["Prediction", "Half-loss", "Gradient"], rows: ["Start", "MU", "CD"], values: [[w + 1, (1 - w) ** 2 / 2, w - 1], [mu + 1, (1 - mu) ** 2 / 2, mu - 1], [2, 0, 0]], signed: true })
    ] }),
    /* @__PURE__ */ jsx12(Controls, { onReset: () => setW(0), children: /* @__PURE__ */ jsx12(Range, { label: "Starting amount; other contribution fixed1", value: w, onChange: setW, max: 1, step: 0.05 }) }),
    /* @__PURE__ */ jsxs10(Result, { children: [
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
  return /* @__PURE__ */ jsxs10(Figure, { id: "D27", caption: "Two positive contributions predict a fixed count rate2. Their fractional ownership1/2 allocates the observed count; these fractions are explanatory allocations, not class posteriors.", children: [
    /* @__PURE__ */ jsxs10(Panels, { children: [
      /* @__PURE__ */ jsx12(Bars, { label: "Fixed component rates", values: [1, 1], ids: ["C0", "C1"], component: true, max: 6 }),
      /* @__PURE__ */ jsx12(Bars, { label: "Allocated observed counts", values: [x / 2, x / 2], ids: ["C0", "C1"], component: true, max: 6 }),
      /* @__PURE__ */ jsx12(Bars, { label: "Observed count and unchanged rate", values: [x, 2], ids: ["Count", "Rate"], max: 6 })
    ] }),
    /* @__PURE__ */ jsx12(Controls, { onReset: () => setX(4), children: /* @__PURE__ */ jsx12(Range, { label: "Integer observed count", value: x, onChange: setX, max: 6, step: 1 }) }),
    /* @__PURE__ */ jsxs10(Result, { children: [
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
  return /* @__PURE__ */ jsxs10(Figure, { id: "D28", caption: "The two exact curves touch at a. Their difference (z\u2212a)\xB2/(2a) is nonnegative; minimizing the upper curve gives a safe restricted-coordinate step, rather than a universal beta proof.", children: [
    /* @__PURE__ */ jsxs10(Operation, { label: "One amount changes a three-bin reconstruction", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "Held C1 amount1; changing C0=z", values: [[z, 1]], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx12(Port, { label: "\xD7 fixed H0" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Actual reconstructed row at new z", values: [[z, 1, z + 1]], columns: ["F0", "F1", "F2"] })
    ] }),
    /* @__PURE__ */ jsx12(Plot, { label: "Touching objective and auxiliary \xB7 visible gap at new z", xmax: 3, ymax: 18, xlabel: "candidate z", ylabel: "cost", children: (map) => {
      const upper = map([z, q(z)]), lower = map([z, f(z)]);
      return /* @__PURE__ */ jsxs10(Fragment5, { children: [
        /* @__PURE__ */ jsx12(Curve, { map, xmax: 3, fn: f }),
        /* @__PURE__ */ jsx12(Curve, { map, xmax: 3, fn: q, color: colors2[1] }),
        /* @__PURE__ */ jsx12(Point, { at: map([a, f(a)]), open: true }),
        fixed ? /* @__PURE__ */ jsxs10(Fragment5, { children: [
          /* @__PURE__ */ jsx12(Point, { at: lower, diamond: true, open: true, color: "#f2c276" }),
          /* @__PURE__ */ jsx12("text", { x: "75", y: "225", children: "touch = q min = f new" })
        ] }) : /* @__PURE__ */ jsxs10(Fragment5, { children: [
          /* @__PURE__ */ jsx12("path", { d: `M${upper.join(" ")}L${lower.join(" ")}`, stroke: "#f2c276", strokeWidth: "3" }),
          /* @__PURE__ */ jsx12(Point, { at: upper, color: colors2[1] }),
          /* @__PURE__ */ jsx12(Point, { at: lower, diamond: true, open: true, color: "#f2c276" }),
          /* @__PURE__ */ jsx12("path", { d: `M${upper.join(" ")}L80 190M${lower.join(" ")}L175 225`, stroke: "currentColor", fill: "none" }),
          /* @__PURE__ */ jsx12("text", { x: "62", y: "185", children: "q min" }),
          /* @__PURE__ */ jsx12("text", { x: "175", y: "242", children: "f new" }),
          /* @__PURE__ */ jsx12("text", { x: "65", y: "70", children: "gap" }),
          /* @__PURE__ */ jsx12("path", { d: `M95 75L${[(upper[0] + lower[0]) / 2, (upper[1] + lower[1]) / 2].join(" ")}`, stroke: "#f2c276", fill: "none" })
        ] })
      ] });
    } }),
    /* @__PURE__ */ jsx12(Controls, { onReset: () => setA(1), children: /* @__PURE__ */ jsx12(Range, { label: "Current positive coordinate a", value: a, onChange: setA, min: 0.25, max: 2, step: 0.25 }) }),
    /* @__PURE__ */ jsxs10(Result, { children: [
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
  return /* @__PURE__ */ jsxs10(Figure, { id: "D29", caption: "The diagonal auxiliary difference is PSD because \u0394\u1D40[[1,\u22121],[\u22121,1]]\u0394=(\u03940\u2212\u03941)\xB2. The square displays its actual nonnegative area; the objective auxiliary includes the additional factor1/2.", children: [
    /* @__PURE__ */ jsxs10(Panels, { children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "G", values: [[2, 1], [1, 2]], rows: ["C0", "C1"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx12(Matrix, { label: "3I \u2212 G", values: [[1, -1], [-1, 1]], signed: true, rows: ["C0", "C1"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsxs10("div", { className: "nmf-plot", children: [
        /* @__PURE__ */ jsx12("p", { className: "nmf-object-label", children: "Square side |\u03940\u2212\u03941|" }),
        /* @__PURE__ */ jsxs10("svg", { viewBox: "0 0 300 250", role: "img", "aria-label": `Square side${fmt(side)}, area${fmt(side * side)}`, children: [
          /* @__PURE__ */ jsx12("rect", { x: "40", y: 220 - side * 90, width: side * 90, height: side * 90, fill: colors2[0], opacity: ".55" }),
          /* @__PURE__ */ jsx12("path", { d: "M40 30V220H230", stroke: "currentColor", fill: "none" }),
          /* @__PURE__ */ jsx12("text", { x: "45", y: "245", children: "0 \u2264 side \u2264 2" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs10(Controls, { onReset: () => {
      setD0(1);
      setD1(0);
    }, children: [
      /* @__PURE__ */ jsx12(Range, { label: "Increment \u03940", value: d0, onChange: setD0, min: -1, max: 1 }),
      /* @__PURE__ */ jsx12(Range, { label: "Increment \u03941", value: d1, onChange: setD1, min: -1, max: 1 })
    ] }),
    /* @__PURE__ */ jsxs10(Result, { children: [
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
  return /* @__PURE__ */ jsxs10(Figure, { id: "D30", caption: "The positive ratio4 is deliberately fixed to isolate the MM power. A beta-dependent exponent changes the step; the exponent-one heuristic agrees only on beta\u2208[1,2]. The persistent Jensen and tangent insets expose their separate assumptions.", children: [
    /* @__PURE__ */ jsx12(Bars, { label: "Live updated coordinate \xB7 old coordinate1", values: [4, next], ids: ["Heuristic", "MM"], max: 4 }),
    /* @__PURE__ */ jsxs10(Operation, { label: "Separate fixed Jensen example \xB7 contributions give normalized shares", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "Positive contributions", values: [[1, 3]], columns: ["C0", "C1"], componentColumns: true }),
      /* @__PURE__ */ jsx12(Port, { label: "sum4; divide each by4" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Shares \xB7 sum1", values: [[0.25, 0.75]], columns: ["C0", "C1"], componentColumns: true }),
      /* @__PURE__ */ jsx12(Port, { label: "apply to arguments2 and6" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Weighted mean and heights", values: [[0.25, 2, 4], [0.75, 6, 36]], rows: ["C0", "C1"], columns: ["Share", "Argument", "Square"] })
    ] }),
    /* @__PURE__ */ jsxs10(Panels, { children: [
      /* @__PURE__ */ jsx12(Plot, { label: "Fixed convex t\xB2 \xB7 Jensen gap3 at mean5", xmax: 6, ymax: 36, xlabel: "t", ylabel: "\u03C6(t)", children: (map) => /* @__PURE__ */ jsxs10(Fragment5, { children: [
        /* @__PURE__ */ jsx12(Curve, { map, xmax: 6, fn: (t) => t * t }),
        /* @__PURE__ */ jsx12("path", { d: `M${map([2, 4]).join(" ")}L${map([6, 36]).join(" ")}`, stroke: colors2[1], strokeWidth: "2" }),
        /* @__PURE__ */ jsx12("path", { d: `M${map([5, 25]).join(" ")}L${map([5, 28]).join(" ")}`, stroke: "#f2c276", strokeWidth: "4" }),
        /* @__PURE__ */ jsx12(Point, { at: map([2, 4]), label: "arg2" }),
        /* @__PURE__ */ jsx12(Point, { at: map([6, 36]), label: "arg6" }),
        /* @__PURE__ */ jsx12(Point, { at: map([5, 25]) }),
        /* @__PURE__ */ jsx12(Point, { at: map([5, 28]), color: colors2[1] }),
        /* @__PURE__ */ jsx12("text", { x: "90", y: "75", children: "gap3" }),
        /* @__PURE__ */ jsx12("path", { d: `M130 75L${map([5, 26.5]).join(" ")}`, stroke: "#f2c276", fill: "none" }),
        /* @__PURE__ */ jsx12("path", { d: `M${map([5, 25]).join(" ")}L${map([5, 0]).join(" ")}`, stroke: "currentColor", strokeDasharray: "3 3" }),
        /* @__PURE__ */ jsx12("text", { x: "225", y: "240", textAnchor: "end", children: "mean5" }),
        /* @__PURE__ */ jsx12("text", { x: "75", y: "35", children: "heights28" }),
        /* @__PURE__ */ jsx12("path", { d: `M145 40L${map([5, 28]).join(" ")}`, stroke: colors2[1] }),
        /* @__PURE__ */ jsx12("text", { x: "75", y: "120", children: "\u03C6(mean)25" }),
        /* @__PURE__ */ jsx12("path", { d: `M150 115L${map([5, 25]).join(" ")}`, stroke: colors2[0] })
      ] }) }),
      /* @__PURE__ */ jsx12(Plot, { label: "Fixed concave log \xB7 tangent touches at4", xmin: 1, xmax: 6, ymin: 0, ymax: 2, xlabel: "t", ylabel: "log(t)", children: (map) => /* @__PURE__ */ jsxs10(Fragment5, { children: [
        /* @__PURE__ */ jsx12(Curve, { map, xmin: 1, xmax: 6, fn: Math.log }),
        /* @__PURE__ */ jsx12(Curve, { map, xmin: 1, xmax: 6, fn: (t) => Math.log(4) + (t - 4) / 4, color: colors2[1] }),
        /* @__PURE__ */ jsx12(Point, { at: map([4, Math.log(4)]), label: "touch4", open: true })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx12(Controls, { onReset: () => setB(0), children: /* @__PURE__ */ jsx12(Range, { label: "Beta", value: b, onChange: setB, max: 3, step: 0.1 }) }),
    /* @__PURE__ */ jsxs10(Result, { children: [
      "Live gamma=",
      fmt(g),
      ", MM1\xD74^gamma=",
      fmt(next),
      " versus heuristic4. Separate fixed Jensen example: .25\xD72+.75\xD76=5; .25\xD74+.75\xD736=28; \u03C6(5)=25; amber gap3. The log tangent is an upper bound touching at4. These fixed illustrations are not recalculated beta objectives."
    ] })
  ] });
}
function Centering() {
  return /* @__PURE__ */ jsxs10(Figure, { id: "D31", caption: "Subtracting means[1,2,3] introduces signed entries. NMF initialization uses the uncentred nonnegative input, rather than silently importing PCA's centred fitted model.", children: [
    /* @__PURE__ */ jsxs10(Operation, { label: "Column-mean subtraction creates a negative cell", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "Original X0 \xB7 selected R0/F1=1", values: X0, selected: [0, 1] }),
      /* @__PURE__ */ jsx12(Port, { label: "subtract column means[1,2,3]" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Column means \xB7 selected F1=2", values: [[1, 2, 3]], rows: ["Mean"], selected: [0, 1] }),
      /* @__PURE__ */ jsx12(Port, { label: "R0/F1: 1\u22122=\u22121" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "X0 \u2212 means \xB7 signed", values: [[1, -1, 0], [0, 1, 1], [-1, 0, -1]], signed: true, selected: [0, 1] })
    ] }),
    /* @__PURE__ */ jsxs10(Panels, { children: [
      /* @__PURE__ */ jsx12(Plot, { label: "Selected R0/F1 \xB7 common zero before and after", xmax: 1, ymin: -2, ymax: 2, xlabel: "same selected cell", ylabel: "signed cell value", children: (map) => /* @__PURE__ */ jsxs10(Fragment5, { children: [
        /* @__PURE__ */ jsx12("path", { d: `M${map([0, 0]).join(" ")}L${map([1, 0]).join(" ")}`, stroke: "currentColor", strokeDasharray: "4 3" }),
        /* @__PURE__ */ jsx12(Arrow, { from: map([0.5, 1]), to: map([0.5, -1]), color: "#f2c276" }),
        /* @__PURE__ */ jsx12(Point, { at: map([0.5, 1]) }),
        /* @__PURE__ */ jsx12(Point, { at: map([0.5, -1]), color: colors2[1] }),
        /* @__PURE__ */ jsx12("text", { x: "175", y: "120", fill: colors2[0], children: "before1" }),
        /* @__PURE__ */ jsx12("path", { d: `M210 125L${map([0.5, 1]).join(" ")}`, stroke: colors2[0], fill: "none" }),
        /* @__PURE__ */ jsx12("text", { x: "75", y: "175", fill: colors2[1], children: "after\u22121" }),
        /* @__PURE__ */ jsx12("path", { d: `M110 160L${map([0.5, -1]).join(" ")}`, stroke: colors2[1], fill: "none" })
      ] }) }),
      /* @__PURE__ */ jsx12(Bars, { label: "Original nonnegative intensities \xB7 unchanged input for NMF", values: X0[0], ids: ["F0", "F1", "F2"], max: 4 })
    ] })
  ] });
}
function SignedTriplet() {
  return /* @__PURE__ */ jsxs10(Figure, { id: "D32", caption: "The known supplied Xt has a signed second singular term. Its positive part has two disjoint support rectangles; retaining one positive rank-one rectangle requires a paired-sign choice.", children: [
    /* @__PURE__ */ jsxs10(Panels, { children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "Xt \xB7 known supplied matrix", values: [[8.2, 2.4], [2.4, 6.8]], max: 10, rows: ["T0", "T1"] }),
      /* @__PURE__ */ jsx12(Matrix, { label: "First term \xB7 \u03C310 u=v[.8,.6]", values: [[6.4, 4.8], [4.8, 3.6]], color: colors2[0], max: 10, rows: ["T0", "T1"] })
    ] }),
    /* @__PURE__ */ jsx12(Panels, { children: ["u \xB7 observation direction", "v \xB7 feature direction"].map((label) => /* @__PURE__ */ jsxs10("div", { children: [
      /* @__PURE__ */ jsx12(Plot, { label: `C1 ${label}`, xmin: -1, xmax: 1, ymin: -1, ymax: 1, xlabel: "entry0", ylabel: "entry1", equalUnits: true, children: (map) => /* @__PURE__ */ jsxs10(Fragment5, { children: [
        /* @__PURE__ */ jsx12(Arrow, { from: map([0, 0]), to: map([0.6, -0.8]), color: colors2[1] }),
        /* @__PURE__ */ jsx12(Point, { at: map([0.6, -0.8]), label: "(.6,\u2212.8)", color: colors2[1] })
      ] }) }),
      /* @__PURE__ */ jsxs10("div", { className: "nmf-plot", children: [
        /* @__PURE__ */ jsxs10("p", { className: "nmf-object-label", children: [
          "C1 signed entries \xB7 ",
          label
        ] }),
        /* @__PURE__ */ jsxs10("svg", { viewBox: "0 0 300 120", role: "img", "aria-label": `C1 ${label}: entry0 .6 extends right of zero, entry1 \u2212.8 extends left; rose is component identity`, children: [
          /* @__PURE__ */ jsx12("path", { d: "M150 10V110", stroke: "currentColor" }),
          /* @__PURE__ */ jsx12("rect", { x: "150", y: "25", width: "48", height: "14", fill: colors2[1] }),
          /* @__PURE__ */ jsx12("rect", { x: "86", y: "75", width: "64", height: "14", fill: colors2[1] }),
          /* @__PURE__ */ jsx12("text", { x: "10", y: "36", children: "entry0" }),
          /* @__PURE__ */ jsx12("text", { x: "205", y: "36", children: ".6" }),
          /* @__PURE__ */ jsx12("text", { x: "10", y: "86", children: "entry1" }),
          /* @__PURE__ */ jsx12("text", { x: "90", y: "106", children: "\u2212.8" }),
          /* @__PURE__ */ jsx12("text", { x: "155", y: "110", children: "0" })
        ] })
      ] })
    ] }, label)) }),
    /* @__PURE__ */ jsxs10(Operation, { label: "Signed column-by-row outer product builds C1 term", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "C1 \u03C35 u \xB7 observation column", values: [[3], [-4]], rows: ["T0", "T1"], color: colors2[1] }),
      /* @__PURE__ */ jsx12(Port, { label: "outer product \xD7 v\u1D40" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "C1 v\u1D40 \xB7 feature row", values: [[0.6, -0.8]], columns: ["F0", "F1"], color: colors2[1] }),
      /* @__PURE__ */ jsx12(Port, { label: "\u03C35 u v\u1D40" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "C1 signed term \xB7 signs remain literal", values: [[1.8, -2.4], [-2.4, 3.2]], color: colors2[1], signed: true, max: 4, rows: ["T0", "T1"] })
    ] }),
    /* @__PURE__ */ jsxs10(Operation, { label: "Split signed vectors into two nonnegative sign pieces", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "Positive pieces \xB7 u+ and v+", values: [[0.6, 0], [0.6, 0]], rows: ["u+", "v+"], color: colors2[1], max: 1 }),
      /* @__PURE__ */ jsx12(Port, { label: "pair matching positive origins" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Negative pieces \xB7 magnitudes u\u2212 and v\u2212", values: [[0, 0.8], [0, 0.8]], rows: ["u\u2212", "v\u2212"], color: colors2[1], hatchedCells: [[0, 1], [1, 1]], max: 1 }),
      /* @__PURE__ */ jsx12(Port, { label: "pair matching negative origins \xB7 both products nonnegative" })
    ] }),
    /* @__PURE__ */ jsxs10(Panels, { children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "C1 positive-origin rectangle \xB7 u+ v+", values: [[1.8, 0], [0, 0]], color: colors2[1], selected: [0, 0], rows: ["T0", "T1"] }),
      /* @__PURE__ */ jsx12(Matrix, { label: "C1 negative-origin rectangle \xB7 u\u2212 v\u2212", values: [[0, 0], [0, 3.2]], color: colors2[1], hatchedCells: [[1, 1]], selected: [1, 1], rows: ["T0", "T1"] }),
      /* @__PURE__ */ jsx12(Matrix, { label: "C1 positive part \xB7 both disjoint rectangles", values: [[1.8, 0], [0, 3.2]], color: colors2[1], hatchedCells: [[1, 1]], rows: ["T0", "T1"] })
    ] }),
    /* @__PURE__ */ jsx12("p", { children: "Rose always identifies C1. Literal signs mark signed coordinates; a solid support is the positive-origin pair and hatching is the negative-origin pair. Neither sign changes the component identity." })
  ] });
}
function PairedSigns() {
  const [a, setA] = scenarioState(0.6), s = signPair(a), up = [a, 0], un = [0, -s.u[1]], vp = [0.6, 0], vn = [0, 0.8];
  return /* @__PURE__ */ jsxs10(Figure, { id: "D33", caption: "Compare the products of paired sign-part norms before selecting and normalizing. Both candidates stay visible. Editing u gives a supplied triplet illustration, not another SVD of the original Xt.", children: [
    /* @__PURE__ */ jsx12(Matrix, { label: "C1 current supplied singular vectors \xB7 signs literal", values: [s.u, s.v], rows: ["u", "v"], columns: ["entry0", "entry1"], color: colors2[1], hatchedCells: [[0, 1], [1, 1]], signed: true, max: 1 }),
    /* @__PURE__ */ jsxs10(Operation, { label: "Positive-origin sign parts give one support candidate", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "u+ and v+ \xB7 nonnegative sign parts", values: [up, vp], rows: ["u+", "v+"], color: colors2[1], max: 1 }),
      /* @__PURE__ */ jsx12(Port, { label: `norms ${fmt(a)} \xD7 .6 = ${fmt(s.positive)}` }),
      /* @__PURE__ */ jsx12(Matrix, { label: "\u03C35 \xD7 norm product \xB7 solid positive-origin rectangle", values: [[5 * s.positive, 0], [0, 0]], color: colors2[1], selected: [0, 0], rows: ["T0", "T1"] })
    ] }),
    /* @__PURE__ */ jsxs10(Operation, { label: "Negative-origin sign parts give the other support candidate", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "u\u2212 and v\u2212 \xB7 magnitudes, not negative entries", values: [un, vn], rows: ["u\u2212", "v\u2212"], color: colors2[1], hatchedCells: [[0, 1], [1, 1]], max: 1 }),
      /* @__PURE__ */ jsx12(Port, { label: `norms ${fmt(-s.u[1])} \xD7 .8 = ${fmt(s.negative)}` }),
      /* @__PURE__ */ jsx12(Matrix, { label: "\u03C35 \xD7 norm product \xB7 hatched negative-origin rectangle", values: [[0, 0], [0, 5 * s.negative]], color: colors2[1], hatchedCells: [[1, 1]], selected: [1, 1], rows: ["T0", "T1"] })
    ] }),
    /* @__PURE__ */ jsxs10(Operation, { label: "Compare norms, choose support, normalize only nonzero chosen parts", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "Norm products before selection", values: [[s.positive, s.negative]], columns: ["Positive pair", "Negative pair"], color: colors2[1] }),
      /* @__PURE__ */ jsx12(Port, { label: s.choosePositive ? "positive \u2265 negative \xB7 choose positive" : "negative > positive \xB7 choose negative" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Chosen u and v pieces normalized to unit norm", values: s.choosePositive ? [[1, 0], [1, 0]] : [[0, 1], [0, 1]], rows: ["Unit u piece", "Unit v piece"], color: colors2[1], hatchedCells: s.choosePositive ? [] : [[0, 1], [1, 1]], max: 1 }),
      /* @__PURE__ */ jsx12(Port, { label: `outer product \xD7 \u03C35 \xD7 selected norm product = ${fmt(5 * (s.choosePositive ? s.positive : s.negative))}` }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Selected nonnegative rank-one term \xB7 still C1", values: s.term, color: colors2[1], hatchedCells: s.choosePositive ? [] : [[1, 1]], selected: s.choosePositive ? [0, 0] : [1, 1], rows: ["T0", "T1"] })
    ] }),
    /* @__PURE__ */ jsx12(Controls, { onReset: () => setA(0.6), children: /* @__PURE__ */ jsx12(Range, { label: "u positive entry a", value: a, onChange: setA, max: 1, step: 0.1 }) }),
    /* @__PURE__ */ jsxs10(Result, { children: [
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
  return /* @__PURE__ */ jsxs10(Figure, { id: "D34", caption: "Only the original zeros receive \u03B4. Filled and unfilled factors, initial product and one complete H-first/new-H W result remain visible. This edit is not guaranteed to improve the fit; the matrix mean4.95 is a separate nndsvda value outside the live range.", children: [
    /* @__PURE__ */ jsxs10(Operation, { label: "Fill only the original zero support", children: [
      /* @__PURE__ */ jsxs10("div", { children: [
        /* @__PURE__ */ jsx12(Matrix, { label: "Original W \xB7 outlined original zero[0,1]", values: original, componentColumns: true, originalZeros: [[0, 1]], rows: ["T0", "T1"], columns: ["C0", "C1"] }),
        /* @__PURE__ */ jsx12(Matrix, { label: "Original H=W\u1D40 \xB7 outlined original zero[1,0]", values: transpose(original), componentRows: true, originalZeros: [[1, 0]], rows: ["C0", "C1"], columns: ["F0", "F1"] })
      ] }),
      /* @__PURE__ */ jsx12(Port, { label: `original zeros only \u2192 \u03B4=${fmt(d)}` }),
      /* @__PURE__ */ jsxs10("div", { children: [
        /* @__PURE__ */ jsx12(Matrix, { label: "Filled initial W", values: w, componentColumns: true, originalZeros: [[0, 1]], rows: ["T0", "T1"], columns: ["C0", "C1"] }),
        /* @__PURE__ */ jsx12(Matrix, { label: "Filled initial H", values: h, componentRows: true, originalZeros: [[1, 0]], rows: ["C0", "C1"], columns: ["F0", "F1"] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs10(Operation, { label: "H-first multiplicative update then W update from fresh H", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "Filled initial H \xB7 W held fixed", values: h, componentRows: true, originalZeros: [[1, 0]], rows: ["C0", "C1"], columns: ["F0", "F1"] }),
      /* @__PURE__ */ jsx12(Port, { label: "H \u2299 (W\u1D40X)/(W\u1D40WH)" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "One-step new H \xB7 feeds W block", values: s.h, componentRows: true, originalZeros: [[1, 0]], rows: ["C0", "C1"], columns: ["F0", "F1"] }),
      /* @__PURE__ */ jsx12(Port, { label: "fresh new H \u2192 W numerator and denominator" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "One-step new W", values: s.w, componentColumns: true, originalZeros: [[0, 1]], rows: ["T0", "T1"], columns: ["C0", "C1"] })
    ] }),
    /* @__PURE__ */ jsx12(Matrix, { label: "Initial / updated predictions", values: [...matmul(w, h), ...matmul(s.w, s.h)], rows: ["Initial R0", "Initial R1", "Updated R0", "Updated R1"], max: 12 }),
    /* @__PURE__ */ jsx12("p", { children: "Dashed amber cell outlines preserve original-zero identity through filling and both update results; component color remains C0 blue/C1 rose." }),
    /* @__PURE__ */ jsx12(Controls, { onReset: () => setD(0), children: /* @__PURE__ */ jsx12(Range, { label: "Fill original zeros \u03B4", value: d, onChange: setD, max: 2, step: 0.1 }) }),
    /* @__PURE__ */ jsxs10(Result, { children: [
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
  return /* @__PURE__ */ jsxs10(Figure, { id: "D35", caption: "The numerical lane is a supplied hand decomposition, not invented sklearn factors. Public fit_transform learns new arrays; later transform uses its fitted dictionary. The shown query calculation explicitly uses supplied H0.", children: [
    /* @__PURE__ */ jsx12("h4", { children: "Supplied hand decomposition \xB7 numerical lane" }),
    /* @__PURE__ */ jsxs10(Operation, { label: "Hand W times hand H0 equals hand X0", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "Hand W \xB7 3\xD72", values: W0, columns: ["C0", "C1"], componentColumns: true }),
      /* @__PURE__ */ jsx12(Port, { label: "\xD7 supplied H0" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Hand H0 \xB7 2\xD73", values: H0, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx12(Port, { label: "exact product" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Hand X0 \xB7 3\xD73", values: X0 })
    ] }),
    /* @__PURE__ */ jsx12("h4", { children: "Public fitted object \xB7 symbolic learned-state lane" }),
    /* @__PURE__ */ jsxs10(Operation, { label: "fit_transform learns returned W and stores fitted H", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "Training input X0 \xB7 ordered F0/F1/F2", values: X0 }),
      /* @__PURE__ */ jsx12(Port, { label: "fit_transform \xB7 learn new arrays" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Returned learned W \xB7 shape only \xB7 outside fitted state", values: learnedW, columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsxs10("div", { className: "nmf-lifetime nmf-lifetime--retained", children: [
        /* @__PURE__ */ jsx12("h4", { children: "Fitted-state boundary" }),
        /* @__PURE__ */ jsx12(Matrix, { label: "Stored components_ \xB7 learned H \xB7 shape only", values: learnedH, rows: ["C0", "C1"] }),
        /* @__PURE__ */ jsx12(Matrix, { label: "Stored feature IDs and fitted rank", values: [["F0/F1/F2", 2]], columns: ["Ordered features", "Fitted k"] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs10(Operation, { label: "Later transform reads the same fitted H without refitting", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "Later query \xB7 ordered F0/F1/F2", values: [[1.5, 0.5, 2]] }),
      /* @__PURE__ */ jsx12(Port, { label: "transform reads this stored H" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Same stored learned H \xB7 read-only operand", values: learnedH, rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx12(Port, { label: "solve new amounts only" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "New query amounts \xB7 symbolic learned-H solution", values: [["query w0", "query w1"]], columns: ["C0", "C1"] })
    ] }),
    /* @__PURE__ */ jsxs10(Operation, { label: "inverse_transform multiplies new query amounts by the same stored H", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "Those new query amounts", values: [["query w0", "query w1"]], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx12(Port, { label: "\xD7 that same stored H" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Same stored learned H \xB7 unchanged", values: learnedH, rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx12(Port, { label: "inverse_transform prediction" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Predicted query \xB7 symbolic", values: [["prediction F0", "prediction F1", "prediction F2"]] })
    ] }),
    /* @__PURE__ */ jsx12("h4", { children: "Separate supplied-H0 query arithmetic \xB7 numerical lane" }),
    /* @__PURE__ */ jsxs10(Operation, { label: "Supplied H0 query amounts reconstruct the shown query", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "Query \xB7 supplied H0 gives amounts[1.5,.5]", values: [[1.5, 0.5, 2]] }),
      /* @__PURE__ */ jsx12(Port, { label: "fixed supplied H0 \u2192 amounts[1.5,.5]" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Complete component addends", values: [[1.5, 0, 1.5], [0, 0.5, 0.5]], rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx12(Port, { label: "sum addends" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Supplied-H0 prediction", values: [[1.5, 0.5, 2]] })
    ] }),
    /* @__PURE__ */ jsx12("p", { children: "Refused: query feature order[F1,F0,F2] differs from fitted[F0,F1,F2]; query[\u22121,0,1] contains a negative value. Neither request changes the fitted state. Symbolic learned arrays above are not asserted equal to the hand factors." })
  ] });
}
function SameBlock() {
  const [a, setA] = scenarioState(1), cd = [2, 2.5], mu = [5 * a / (2 * a + 1), 7 / (a + 2)], lanes = [["Cyclic CD", cd], ["Simultaneous MU", mu]];
  return /* @__PURE__ */ jsxs10(Figure, { id: "D36", caption: "Both routes start from[a,1] with fixed H0. CD sends its new C0=2 into C1=(7\u22122)/2; MU sends old operands into both denominators2a+1 and a+2. One block is not a stationary coupled solution.", children: [
    /* @__PURE__ */ jsx12(Matrix, { label: "Fixed G and p \xB7 component axes", values: [[2, 1], [1, 2], [5, 7]], rows: ["G C0", "G C1", "p R1"], columns: ["C0", "C1"] }),
    /* @__PURE__ */ jsxs10(Operation, { label: "Cyclic CD wires fresh C0 into the C1 update", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "Old amounts", values: [[a, 1]], columns: ["C0", "C1"], componentColumns: true, rows: ["R1"] }),
      /* @__PURE__ */ jsx12(Port, { label: "C0=(5\u2212old C1)/2=2" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Fresh C0 with held old C1", values: [[2, 1]], componentColumns: true, rows: ["R1"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx12(Port, { label: "C1=(7\u2212fresh C0)/2=2.5" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "CD amounts", values: [cd], componentColumns: true, rows: ["R1"], columns: ["C0", "C1"] })
    ] }),
    /* @__PURE__ */ jsxs10(Operation, { label: "Simultaneous MU uses old amounts in both contractions", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "Old amounts \xB7 held for both denominators", values: [[a, 1]], componentColumns: true, rows: ["R1"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx12(Port, { label: "C0: a\xD75/(2a+1); C1: 1\xD77/(a+2)" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "MU amounts \xB7 published together", values: [mu], componentColumns: true, rows: ["R1"], columns: ["C0", "C1"] })
    ] }),
    lanes.map(([name, w]) => {
      const pred = matmul([w], H0)[0], g = [2 * w[0] + w[1] - 5, w[0] + 2 * w[1] - 7], arrowScale = 0.25 / Math.max(1, ...g.map(Math.abs));
      return /* @__PURE__ */ jsxs10("div", { children: [
        /* @__PURE__ */ jsxs10("h4", { children: [
          name,
          " \xB7 resulting coupled slopes"
        ] }),
        /* @__PURE__ */ jsx12(Panels, { children: [1, -1].map((direction) => /* @__PURE__ */ jsx12(Plot, { label: `${name} \xB7 ${direction === 1 ? "slope +gradient" : "improving \u2212gradient"} directions`, xmax: 4, ymax: 4, xlabel: "C0 amount", ylabel: "C1 amount", equalUnits: true, children: (map) => /* @__PURE__ */ jsxs10(Fragment5, { children: [
          g.map((v, c) => {
            const end = map(w.map((x, j) => x + (j === c ? direction * v * arrowScale : 0)));
            return /* @__PURE__ */ jsxs10("g", { children: [
              v !== 0 && /* @__PURE__ */ jsxs10(Fragment5, { children: [
                /* @__PURE__ */ jsx12(Arrow, { from: map(w), to: end, color: colors2[c] }),
                /* @__PURE__ */ jsx12("path", { d: `M${c === 0 ? 105 : 205} ${c === 0 ? 45 : 65}L${end.join(" ")}`, stroke: colors2[c], fill: "none" })
              ] }),
              /* @__PURE__ */ jsx12("text", { x: c === 0 ? 70 : 165, y: c === 0 ? 40 : 60, fill: colors2[c], children: `C${c} ${v === 0 ? "slope0" : direction === 1 ? "+g" : "\u2212g"}` })
            ] }, c);
          }),
          /* @__PURE__ */ jsx12(Point, { at: map(w), label: "amounts", open: true })
        ] }) }, direction)) }),
        /* @__PURE__ */ jsx12(Matrix, { label: `${name} amounts and complete addends`, values: [[...w, "\u2014"], [w[0], 0, w[0]], [0, w[1], w[1]], pred, [1 - pred[0], 3 - pred[1], 4 - pred[2]]], rows: ["C0/C1 amounts", "C0 addend", "C1 addend", "Prediction", "Residual"], signed: true }),
        /* @__PURE__ */ jsxs10("p", { children: [
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
    /* @__PURE__ */ jsx12(Controls, { onReset: () => setA(1), children: /* @__PURE__ */ jsx12(Range, { label: "Initial C0 amount; initial C1=1", value: a, onChange: setA, min: 0.5, max: 2 }) }),
    /* @__PURE__ */ jsxs10(Result, { children: [
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
  return /* @__PURE__ */ jsxs10(Figure, { id: "D37", caption: "A complete fitted snapshot is published together only after supported validation and arithmetic succeed. Rejected candidates do not partially replace its H, features, fitted rank or diagnostics. Next-fit configuration and returned copies remain outside it.", children: [
    /* @__PURE__ */ jsxs10("div", { className: "nmf-lifetime nmf-lifetime--retained", children: [
      /* @__PURE__ */ jsx12("h4", { children: "Existing fitted snapshot \xB7 one coherent published state" }),
      /* @__PURE__ */ jsxs10(Panels, { children: [
        /* @__PURE__ */ jsx12(Matrix, { label: "Old fitted H0 \xB7 unchanged after refusal", values: H0, rows: ["C0", "C1"] }),
        /* @__PURE__ */ jsx12(Matrix, { label: "Old ordered feature identities", values: [["F0", "F1", "F2"]], rows: ["Order"] }),
        /* @__PURE__ */ jsx12(Matrix, { label: "Old fitted metadata slots", values: [[2, "stored objective", "stored stop reason"]], columns: ["Fitted k", "Diagnostic", "Diagnostic"] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs10(Operation, { label: "Invalid candidates stop before any fitted slot is published", children: [
      /* @__PURE__ */ jsxs10("div", { children: [
        /* @__PURE__ */ jsx12(Matrix, { label: "Negative candidate", values: [[-1, 0, 1]], signed: true }),
        /* @__PURE__ */ jsx12(Matrix, { label: "Nonfinite candidate", values: [["NaN", 0, 1]] }),
        /* @__PURE__ */ jsx12(Matrix, { label: "Actual width2 candidate \xB7 only two cells", values: [[1, 2]], columns: ["F0", "F1"] })
      ] }),
      /* @__PURE__ */ jsx12(Port, { label: "STOP \xB7 negative / nonfinite / expected width3", symbol: "\u22A3" }),
      /* @__PURE__ */ jsx12("p", { children: "Validation refuses these candidates. No path transfers any of their cells into the existing fitted snapshot." })
    ] }),
    /* @__PURE__ */ jsxs10(Operation, { label: "Valid complete candidate transfers all fitted slots together", children: [
      /* @__PURE__ */ jsxs10("div", { children: [
        /* @__PURE__ */ jsx12(Matrix, { label: "Valid new H \xB7 indexed values only", values: [["new h00", "new h01", "new h02"], ["new h10", "new h11", "new h12"]], rows: ["new C0", "new C1"] }),
        /* @__PURE__ */ jsx12(Matrix, { label: "Candidate metadata \xB7 complete", values: [["F0/F1/F2", 2, "new objective", "new stop reason"]], columns: ["Ordered features", "Fitted k", "Diagnostic", "Diagnostic"] })
      ] }),
      /* @__PURE__ */ jsx12(Port, { label: "validation + arithmetic succeed \u2192 atomic publication" }),
      /* @__PURE__ */ jsxs10("div", { className: "nmf-lifetime nmf-lifetime--retained", children: [
        /* @__PURE__ */ jsx12("h4", { children: "Replacement fitted snapshot" }),
        /* @__PURE__ */ jsx12(Matrix, { label: "Published new H \xB7 all six cells together", values: [["new h00", "new h01", "new h02"], ["new h10", "new h11", "new h12"]], rows: ["new C0", "new C1"] }),
        /* @__PURE__ */ jsx12(Matrix, { label: "Published new metadata \xB7 together with H", values: [["F0/F1/F2", 2, "new objective", "new stop reason"]], columns: ["Ordered features", "Fitted k", "Diagnostic", "Diagnostic"] }),
        /* @__PURE__ */ jsx12("p", { children: "All new H cells, ordered feature IDs, fitted k, objective and stop reason cross the boundary together. No partial candidate is visible to queries." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs10(Operation, { label: "Refusal leaves old query behavior attached to old fitted state", children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "Old query \xB7 ordered F0/F1/F2", values: [[1.5, 0.5, 2]] }),
      /* @__PURE__ */ jsx12(Port, { label: "read unchanged fitted k2 and H0" }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Old query amounts \xB7 still two components", values: [[1.5, 0.5]], columns: ["C0", "C1"] })
    ] }),
    /* @__PURE__ */ jsxs10(Panels, { children: [
      /* @__PURE__ */ jsxs10("div", { className: "nmf-lifetime", children: [
        /* @__PURE__ */ jsx12("h4", { children: "Future configuration \xB7 outside fitted snapshot" }),
        /* @__PURE__ */ jsx12(Matrix, { label: "Next-fit requested k1", values: [[1]] }),
        /* @__PURE__ */ jsx12("p", { children: "It cannot resize the old two-component query." })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "nmf-lifetime", children: [
        /* @__PURE__ */ jsx12("h4", { children: "Returned copy \xB7 outside fitted snapshot" }),
        /* @__PURE__ */ jsx12(Matrix, { label: "Edited returned copy \xB7 no backward mutation", values: [[-99, 0, 1], [0, 1, 1]], signed: true }),
        /* @__PURE__ */ jsx12("p", { children: "Editing this copy does not cross back into stored H." })
      ] })
    ] }),
    /* @__PURE__ */ jsx12("p", { children: "Valid publication is a state-consistency operation; it does not certify global optimality." })
  ] });
}
function Penalty() {
  const [l, setL] = scenarioState(0), w = Math.max(0, 2 - l), data = (2 - w) ** 2 / 2, paid = l * w;
  return /* @__PURE__ */ jsxs10(Figure, { id: "D38", caption: "A linear price moves the constrained optimum to max(0,2\u2212\u03BB), including the nonnegative boundary. The separate squared-price inset has \u03BB1=0, \u03BB2=1 and optimum1.", children: [
    /* @__PURE__ */ jsxs10(Panels, { children: [
      /* @__PURE__ */ jsx12(Plot, { label: "Data + linear price = total", xmax: 3, ymax: 10, xlabel: "amount w", ylabel: "cost", children: (map) => /* @__PURE__ */ jsxs10(Fragment5, { children: [
        /* @__PURE__ */ jsx12(Curve, { map, xmax: 3, fn: (w2) => (2 - w2) ** 2 / 2 }),
        /* @__PURE__ */ jsx12(Curve, { map, xmax: 3, fn: (w2) => l * w2, color: "#f2c276" }),
        /* @__PURE__ */ jsx12(Curve, { map, xmax: 3, fn: (w2) => (2 - w2) ** 2 / 2 + l * w2, color: colors2[1] }),
        /* @__PURE__ */ jsx12(Point, { at: map([w, data + paid]), label: "best", color: colors2[1] })
      ] }) }),
      /* @__PURE__ */ jsx12(Plot, { label: "Fixed squared price \xB7 .5w\xB2", xmax: 3, ymax: 6, xlabel: "amount w", ylabel: "cost", children: (map) => /* @__PURE__ */ jsxs10(Fragment5, { children: [
        /* @__PURE__ */ jsx12(Curve, { map, xmax: 3, fn: (w2) => (2 - w2) ** 2 / 2 }),
        /* @__PURE__ */ jsx12(Curve, { map, xmax: 3, fn: (w2) => w2 * w2 / 2, color: "#f2c276" }),
        /* @__PURE__ */ jsx12(Curve, { map, xmax: 3, fn: (w2) => (2 - w2) ** 2 / 2 + w2 * w2 / 2, color: colors2[1] }),
        /* @__PURE__ */ jsx12(Point, { at: map([1, 1]), label: "best1", color: colors2[1] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx12(Controls, { onReset: () => setL(0), children: /* @__PURE__ */ jsx12(Range, { label: "Linear price \u03BB", value: l, onChange: setL, max: 3 }) }),
    /* @__PURE__ */ jsxs10(Result, { children: [
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
  return /* @__PURE__ */ jsxs10(Figure, { id: "D39", caption: "The exact product stays X0, while dimension-scaled factor penalties change. With alphaW.1/alphaH.2,r1,n=d3, the prices are.3 per W unit and.6 per H unit. Zero alphas would cost0 at every scale.", children: [
    /* @__PURE__ */ jsxs10(Panels, { children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "Current compensated W", values: w, columns: ["C0", "C1"], componentColumns: true }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Current scaled H", values: h, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx12(Matrix, { label: "C0 contribution \xB7 invariant", color: colors2[0], values: W0.map((r) => H0[0].map((v) => v * r[0])) }),
      /* @__PURE__ */ jsx12(Matrix, { label: "C1 contribution \xB7 invariant", color: colors2[1], values: W0.map((r) => H0[1].map((v) => v * r[1])) }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Same reconstructed X0", values: matmul(w, h) })
    ] }),
    /* @__PURE__ */ jsx12(Controls, { onReset: () => setS(1), children: /* @__PURE__ */ jsx12(Range, { label: "C0 pattern scale s", value: s, onChange: setS, min: 0.5, max: 3 }) }),
    /* @__PURE__ */ jsxs10(Result, { children: [
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
  return /* @__PURE__ */ jsxs10(Figure, { id: "D40", caption: "Weights change the local Gram and cross product. F2 remains measured3 even when excluded from the objective. Square-root weighting produces the same G=A\u1D40A and p=A\u1D40b; different masks require different caches.", children: [
    /* @__PURE__ */ jsxs10(Operation, { label: "Square-root weights act on features, not on measured values", children: [
      /* @__PURE__ */ jsxs10("div", { children: [
        /* @__PURE__ */ jsx12(Matrix, { label: "Measured R0 \xB7 unchanged", values: [[2, 1, 3]], selected: [0, 2] }),
        /* @__PURE__ */ jsx12(Matrix, { label: "Separate weights [1,1,m]", values: [[1, 1, m]], selected: [0, 2] }),
        /* @__PURE__ */ jsx12(Matrix, { label: "Observation status \xB7 hatching means excluded", values: [["observed", "observed", m === 0 ? "excluded" : "observed"]], selected: [0, 2] }),
        /* @__PURE__ */ jsx12(Matrix, { label: "Fixed H0", values: H0, rows: ["C0", "C1"], componentRows: true, selectedCells: [[0, 2], [1, 2]] })
      ] }),
      /* @__PURE__ */ jsx12(Port, { label: "each feature row \xD7 sqrt(weight)" }),
      /* @__PURE__ */ jsxs10("div", { children: [
        /* @__PURE__ */ jsx12(Matrix, { label: "A = sqrt(weights) H\u1D40", values: A, rows: ["F0", "F1", "F2"], columns: ["C0", "C1"], selectedCells: [[2, 0], [2, 1]] }),
        /* @__PURE__ */ jsx12(Matrix, { label: "b = sqrt(weights) x", values: b, rows: ["F0", "F1", "F2"], columns: ["Target"], selected: [2, 0] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs10(Operation, { label: "Contract the same feature identities into weighted caches", children: [
      /* @__PURE__ */ jsxs10("div", { children: [
        /* @__PURE__ */ jsx12(DotProduct, { left: [1, 0, root], right: [0, 1, root], ids: ["F0", "F1", "F2"], leftLabel: "A[F,C0]", rightLabel: "A[F,C1]", resultLabel: "G[C0,C1] \xB7 F2 contributes m" }),
        /* @__PURE__ */ jsx12(DotProduct, { left: [1, 0, root], right: [2, 1, 3 * root], ids: ["F0", "F1", "F2"], leftLabel: "A[F,C0]", rightLabel: "b[F]", resultLabel: "p[C0] \xB7 F2 contributes3m" })
      ] }),
      /* @__PURE__ */ jsx12(Port, { label: "A\u1D40A and A\u1D40b" }),
      /* @__PURE__ */ jsxs10("div", { children: [
        /* @__PURE__ */ jsx12(Matrix, { label: "Current local G", values: g, rows: ["C0", "C1"], columns: ["C0", "C1"], selected: [0, 1] }),
        /* @__PURE__ */ jsx12(Matrix, { label: "Current local p", values: p, columns: ["C0", "C1"], selected: [0, 0] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs10(Panels, { children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "All-observed comparison G / p", values: [[2, 1], [1, 2], [5, 4]], rows: ["G C0", "G C1", "p"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Second observation pattern \xB7 mask[1,0,0]", values: [[1, 0, 0]] }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Second mask requires G=diag(1,0), p=[2,0]", values: [[1, 0], [0, 0], [2, 0]], rows: ["G C0", "G C1", "p"], columns: ["C0", "C1"] })
    ] }),
    /* @__PURE__ */ jsx12(Controls, { onReset: () => setM(1), children: /* @__PURE__ */ jsx12(Range, { label: "F2 observation weight m", value: m, onChange: setM, max: 1 }) }),
    /* @__PURE__ */ jsxs10(Result, { children: [
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
  return /* @__PURE__ */ jsxs10(Figure, { id: "D41", caption: "Identical placeholder values do not carry identical information. Missing quality0/0 is undefined; three measured zeros give MSE0/3=0. An unsupported dictionary column is a chosen convention, not estimated physical absence.", children: [
    /* @__PURE__ */ jsxs10(Panels, { children: [
      /* @__PURE__ */ jsx12(Matrix, { label: "Missing lane \xB7 finite placeholders", values: [[0, 0, 0], ["not observed", "not observed", "not observed"], [0, 0, 0]], rows: ["Values", "Mask0/0/0", "Chosen prediction"] }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Measured-zero lane", values: [[0, 0, 0], [1, 1, 1], [0, 0, 0]], rows: ["Measured values", "Mask", "Prediction"] }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Both chosen amount rows", values: [[0, 0], [0, 0]], rows: ["Missing", "Measured zero"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Changed masks \xB7 F2 entirely unsupported", values: [[0, 0, 0], [1, 1, 0]] }),
      /* @__PURE__ */ jsx12(Matrix, { label: "Column support flags / chosen H column", values: [[true, true, false], [0, 0, "chosen F2 column0"]], rows: ["Supported?", "H F2=[0,0]"] })
    ] }),
    /* @__PURE__ */ jsx12("p", { children: "Missing included numerator0, denominator0: unknown predictive quality. Measured-zero numerator0, denominator3: observed-cell MSE0." })
  ] });
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/SavedDataFigures.jsx
import React7, { useId as useId3, useRef as useRef4, useState as useState7 } from "react";

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/saved-data.js
var saved = { "datasetSha256": "d93f963c4b2610eb07122a312eec3ddceac18a031477370d71e33835eced728e", "license": "CC BY 4.0", "attribution": "E. Alpaydin and C. Kaynak (1998), Optical Recognition of Handwritten Digits, UCI Machine Learning Repository", "provenance": "/learn-assets/nmf/data-provenance.md", "csv": "/learn-assets/nmf/digits-300.csv", "scale": 16, "side": 8, "splitSizes": { "train": 180, "validation": 60, "test": 60 }, "fit": { "k": 8, "seed": 19, "init": "random", "solver": "cd", "maxIter": 2e3, "tol": 1e-5 }, "dictionary": [[0, 0, 0, 0.5452207624967085, 0.4095273191122956, 0.0032738725363875235, 0.01681396589080354, 0.011303952425851567, 0, 0, 0.5798605410667163, 0.40813194871906505, 0.5410936516317683, 0.7468128085194613, 0.033936702627451895, 0.005651976212925783, 0, 0.0054649923737094585, 0.1142326706623143, 0, 0.19563614790275166, 1.194550746929823, 0.24681639781363998, 0.001490732779435335, 0, 0, 0, 0, 0.26298584569743727, 1.3353766171994814, 0.419057910273771, 0, 0, 0.06490782859151373, 0.057425870352950784, 0, 0, 0.7310871694622716, 0.5496718650649962, 0, 0, 0.013267888649701506, 0, 0, 0, 0, 0.06218969167893644, 0, 0, 0, 0, 0.1864415956594669, 0, 0, 0, 0, 0, 0, 0, 0.5226455673513869, 0, 0, 0, 0], [0, 0, 0, 0.22831267182640838, 0.45541916858605475, 0.036492142637753675, 0, 0.0067306550015986955, 0, 0, 0, 0.49969973526180855, 0.12654325536354383, 0, 0, 0.0033653275007993477, 0, 0, 0, 0.08610871845949049, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.09899900134593437, 0.6666521140817067, 1.032435568842472, 0.8672643308533736, 0, 0, 0, 0, 0.1100839614590444, 0.5682417398217321, 1.107694630016878, 0.7657014778951113, 0, 0, 2777356230913594e-19, 0, 0, 0.03749513404577792, 0.6316069277384847, 0.31304859260698553, 0, 0, 0.0029524433476481385, 0, 0, 0, 0.1531299552817061, 0.05757589233305222, 0, 0, 0], [0, 0, 0.018777498885022437, 0.669124058486497, 0.013297704357583774, 0, 0, 0, 0, 0, 0.5596677029952549, 0.5963959652116955, 0, 0, 0, 0, 0, 0.10516805849444419, 0.6424545845468463, 0.1601894482117721, 0, 0.22619281095378732, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.056866114827202954, 0, 0, 0, 0, 0, 0.0811763550067284, 0.8408016254985371, 0.1923952982226453, 0, 0.20353766799362172, 0.45056549116164757, 0.0012254003880172385, 0, 0.07623127732249224, 1.1770843982644912, 0.5842155438595986, 0, 0.8822180161457316, 0.7931314830343865, 0.01709479894706051, 0, 0, 0.026010526191649355, 0.6081856742633671, 0.9030137990775886, 1.0185647605959933, 0.38973442124145713, 0.0073732012632652414], [0, 0.05587149156190696, 0.7488044490175612, 0.7620249640818427, 0.21269821668061173, 0, 0, 0, 0, 0.1104123082933756, 0.5637491818631478, 0.3849866997353717, 0.5181212698089133, 0.04351319003116312, 0, 0, 0, 0.008577867867237536, 0, 0, 0.5528665840071592, 0, 0, 0, 0, 0, 0, 0.10422421533275342, 0.7602210491357746, 0, 0, 0, 0, 0, 0, 0.06087745495687146, 0.4606700858740838, 0.35201593796748154, 0, 0, 0, 0, 0, 0, 0, 0.4550465069574604, 0.12240811073789319, 0, 0, 0, 0.181190631718772, 0.33900159742357533, 0.27943949751850616, 0.33243726027470605, 0.08432570438311894, 0, 0, 0.06687606756477682, 0.8113587358229821, 0.7697332143135511, 0.31494093705394777, 0, 0.008515912403402739, 0.004311244860506516], [0, 0, 0, 0, 0.7066432969886774, 0.9717394202133349, 0.20989415436636574, 0.005004911186076742, 0, 0, 0, 0, 0.17206345975451942, 1.2017594087097887, 0.4509863069558517, 0.002502455593038371, 0, 0, 0, 0, 0, 1.0618734065875557, 0.2502669307760567, 0, 0, 0, 0.033448149317311666, 0, 0.24501974109043692, 0.7990105116681347, 0, 0, 0, 0, 0, 0.0835904250822763, 0.7115089418369894, 0.48537642770975825, 0, 0, 0, 0.02845405897195121, 0, 0, 0.7523538581460832, 0.5035960084242987, 0, 0, 0, 0.03183463700786668, 0.013627421045589031, 0, 0.6980051124977253, 0.6033655598989045, 0, 0, 0, 0, 0, 0, 0.2806596634618026, 0.38654835336594445, 0, 0], [0, 0, 0, 0, 0.0964211697344673, 0, 0, 0, 0, 0, 0, 0.04221915422805248, 0.8958374138819365, 0, 0, 0, 0, 0, 0, 1.0159429596281646, 1.389323550924926, 0, 0, 0.001046446484514251, 0, 0, 0.11900813752228433, 1.3802210453880088, 1.2561054790898722, 0.016611471145815734, 0, 0, 0, 0, 0, 0.27765213760605156, 0.15496097865711772, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00930121063888378, 0.020372714289296632, 0, 0.1264466391553927, 0, 0, 0, 0, 0, 0, 0, 0.512597648930029, 0.3777486091539714, 0.0716588099151347, 7432941092963941e-19], [0, 0.09180849936968948, 0.5722226463430513, 0.5267809299094709, 0.3848333839768033, 0.4045848214337089, 0.07841505437754875, 0, 0, 0.25793602287195405, 0.7501348283351726, 0.34434700226912834, 0.1622344018028079, 0.3296880185659973, 0.07790581939768271, 0, 0, 0.30526304684823935, 0.7235024230283255, 0, 0, 0, 0.021177689925761252, 0, 0, 0.1870514125991531, 0.624215171285832, 0.3593851589751179, 0.061198235991517684, 0, 0, 0, 0, 0, 0.12584289807084212, 0.18349168068803307, 0, 0, 0, 0, 0, 0, 0, 0.02835993055192491, 0.1727169595927673, 0, 0, 0, 0, 0.040446501693072706, 0.3470966168009258, 0.3445104791635526, 0.38803113688656193, 0, 0, 0, 0, 0.08096041689561823, 0.5974056454937383, 0.6144190424660241, 0.08545959557100061, 0, 0, 0], [0, 0, 0, 0, 0.2830418933746405, 0, 0, 0, 0, 0, 0, 0.3866776681060496, 0.4254584158619083, 0, 0, 0, 0, 0.0048504294048323125, 0.6427051313236756, 0.6250092362785254, 0, 0, 0, 0, 0, 0.31885333715174474, 1.264170738762138, 0.25230804920480737, 0, 0.19231860950929694, 0.2002244508928143, 0, 0, 0.39117216633814067, 0.9231790735899313, 0, 0.0419652950204764, 0.8298332498411142, 0.25461710615084954, 0, 0, 0.11332989730468777, 0.26781955784537415, 0, 0.18810594695810864, 1.0960064636443374, 0.31592626241031363, 6304602576143281e-19, 0, 0, 0, 0, 0.6862180094823759, 0.5316091286845613, 0.020112757401910177, 0, 0, 0, 0, 0.07783661180354828, 0.6446358288409058, 0, 0, 0]], "activations": [[0.17645306257523935, 0.7401606838954491, 0.35507968290394915, 0.09898370289714804, 0.2751947642817364, 0.6129899958656101, 0.1857680492602524, 0], [0.2321911099210713, 0.011934602685408047, 0.3424206826975729, 0, 0.12081544616148039, 0, 0.6884925427238711, 0.628002130601251], [0.06850244484308012, 0.4922968165804899, 0.2919395765878569, 0.2707352072272636, 0.3974411384758673, 0.45389863294705873, 0.4248041769675399, 0], [0.4821412692038989, 0, 0.0011948443596831032, 0.630439784296947, 0.13867577910146528, 0.12068113376338206, 0.5100302762147536, 0.43667314818351777], [0, 0.39910592373615683, 0.5116408147150648, 0.41496253197721766, 0, 0.45440831646916835, 0.5271886425531841, 0], [0.17876355444526804, 0.586062155519975, 0, 0, 0.17574022895886368, 0.30889847061954595, 0, 0.7838307339598126], [0, 0.7243279864419385, 0.07623133017419845, 0.08584490416822682, 0.32241330048101563, 0.7165295211963071, 0.2939066839174276, 0.16087111617641414], [0, 0, 0.23172218921812116, 0.8701964550149489, 0.6755736736037703, 0.24605981890235892, 0.016760218008273257, 7715809428859795e-19], [0.3909398135394487, 0.5290761476417956, 0, 0, 0.42944935495683056, 0.10990023104886221, 0.22633008293275453, 0.19995068208105266], [0.0940690466850795, 0.5021159922953674, 0.47658518669238814, 0.3430508871802317, 0, 0.4817411422789252, 0.5123496524803683, 0], [0.15849080363914134, 0.16779414593668615, 0, 0.44772459300782824, 0.107836766067562, 0.19200026231975684, 0.5698304587448296, 0.3291470284864378], [0.0724936230912565, 0.6129972366312734, 0.6114862623190841, 0.0900467675157052, 0, 0, 0.039739321955010065, 0.5689114450897824], [0.17660924628182123, 0.5640673653482697, 0.4157120682362664, 0.06302153153079264, 0.00517408057989016, 0.6241134325028457, 0.6708514583802954, 0], [0.5204703895280667, 0.17557719846944628, 0.5324342033008579, 0.04750670324161154, 0, 0, 0.34577946701870166, 0.6656795372138576], [0, 0.8311565369767856, 0.437690312580896, 0, 0.0758289395324161, 0.42886650738049503, 0.3348653463962268, 0.33819752290137334], [0.33098115878752504, 0.16856559234458662, 0, 0.055464942050277674, 0.42728545094032855, 0.24954513708112, 0.8392631049090669, 0.04822543181641521], [0, 0.4074054411419564, 0, 0.4635732005616393, 0.13820358948785486, 0.0528826988951364, 0.8610355626023569, 0.3556077406609023], [0, 0.5202218101928828, 0.11364052579492182, 0, 0.8003059993424251, 0.6665207018510105, 0.03653441985688586, 0.44895223508216964], [0.3526120147662815, 0.6244073334784723, 0.45186214233294386, 0.2948517298143034, 0.26973996549030055, 0.5052264067962933, 0, 0.13817868723561866], [0.12469887338766442, 0.06859490719829882, 0.01748536860892227, 1.094545646232888, 0.6581276689521914, 0, 0, 0.02157449928870426], [0, 0.5268547901457094, 0.02742455774442317, 0.2858585470300585, 0.21068492643336606, 0.2709277957110999, 1.1427383310266528, 0], [0, 0.31720076254465246, 0.0914030491874698, 0.5727445275792681, 0.18873836824778473, 0.14994340734691322, 0.5166312204192188, 0.4842150147867096], [0, 0.7188226997995214, 0.6062481214718544, 0, 0, 0.13643944805618244, 0.16449703140459018, 0.5785968268899001], [0.02692017384147784, 0.5599284656807494, 0.5781028416542022, 0.019580338592944703, 0, 0.1825324647426752, 0.22551648611342948, 0.6045571975296687], [0.5578712648045303, 0.77529953808653, 0, 0.24634312092132712, 0.3950286761272544, 0.053899550745313, 0.1996604180695196, 0], [0.29219486552400153, 0.5986886377809788, 0, 0.08496631423908615, 0.3306311904601879, 0.20053568837143854, 0.45097691522168987, 0], [0.5256176110934133, 0.34204814022619956, 0.4004324034372505, 0, 0.06497166757527392, 0.05026966727814014, 0.09051350014620616, 0.6918402232548432], [0.3890786189646431, 0, 0.4311689404167654, 0.4981573608977298, 0, 0.4924371662107114, 0, 0.31735079123505794], [0.1481641659795343, 0, 0.19263882196801893, 0.3436760791462832, 0.17075634333118442, 0.1928568506660887, 0.61918609979157, 0.40320526555717806], [0.014796528732870937, 0, 0.2521031398767424, 0.9101290286078436, 0.5090546900122245, 0.17475722229501053, 0, 0.022704206161760405], [0, 0.5626204913701446, 0, 0, 0.03839930043097556, 0.08906568955697669, 1.305222208823279, 0.040202053511153246], [0, 0.17808300264859062, 0, 0.0272204104433071, 0.6149341587767829, 0.6252625817197403, 0.11874335715481768, 0.33249397594851726], [0, 0.6244976024893577, 0, 0, 0.18960243425664933, 0.5376260587038525, 0, 0.5092052225033739], [0.040840890514737216, 0.14513739484727378, 0, 0, 0.7621507768370629, 0.648163996749805, 0, 0.26317329873075207], [0.6281110333543323, 0, 0.555048680883091, 0.023921523759225734, 0.06641727136362756, 0.46361903442788677, 0, 0.15909741770308855], [0.5610835368760478, 0, 0.3316086661031853, 0.441116005916426, 0.06600667381819143, 0.2923096271619734, 0, 0.29375817432682955], [0.12456728914748866, 0.4771041735015189, 0.047344236709685336, 0, 0.1363975616131259, 0.3432983231938124, 0.9669438153954205, 0], [0.01319655071954904, 0, 0.31553859971584924, 0.9613825383278762, 0.13434258714801495, 0.3017957412525238, 0, 0.11991876370709696], [0.23500970644517966, 0, 0, 0, 0.6748642906136353, 0.593868946959291, 0, 0.5317145984117821], [0.574857328712728, 0.9319374292854736, 0, 0.5412265364584163, 0, 0.218246004986071, 0, 0.027153517781280737], [0, 0.23226692726718734, 0.545529666718704, 0.3866736660705895, 0, 0.4519024970388965, 0.5361728222395361, 0], [0, 0.06808749962293095, 0.17383995483309414, 0.8617148942868633, 0.506884035880263, 0.2959446165272875, 0, 0], [0, 0.44961936043707135, 0.7162258162499501, 0.2768137121070615, 0, 0.4410579271202832, 0.41103789324825635, 0], [0.445273883133402, 0.7675442478361537, 0.03902332706691933, 0, 0.04585632227650423, 0.15550145541126392, 0.07169322169975867, 0.8160040411320851], [0.5590178558744591, 0.05915088982836048, 0.35294754104080783, 0.14175523215479305, 0.019269127774284047, 0, 0.38264460375833326, 0.7131115411364464], [0.2604447684801515, 0.4067918725909876, 0.5720087101325382, 0.31758475363822203, 0.3174377793066609, 0.30790087430583, 0.15046659285869116, 0.05447529683147041], [0.4385374813833229, 0, 0.09633606185531644, 0.5681923102355811, 0.2471035525772711, 0.26843362937663634, 0.375857292597508, 0.41057752650202683], [0.6175005575742657, 0.20978157350115995, 0.4048011804221114, 0, 0.06292912719125401, 0, 0.31019192565862574, 0.6218358914206394], [0.5909658018396403, 0.8097020144385956, 0, 0.4039437902752291, 0.039593028080708595, 0.22323515350819928, 0, 0], [0, 0.7212412061470614, 0.6552355386452519, 0, 0, 0.24051172259565043, 0.3301611793302834, 0.5879372540284772], [0.026570687201098682, 0.5651198634680678, 0, 0, 0.4711121128856416, 0.7049059063023964, 0.11964229287564736, 0.17006940196770465], [0.1751096887388967, 0.6405718648809873, 0.5909157796925122, 0.30293737466502757, 0.13582703130690948, 0.4354668396201162, 0, 0], [0.6714869819488557, 0.8422324496279615, 0, 0.22525551169420718, 0.21444120858429186, 0, 0.35677276415910447, 0], [0.2647990400647813, 0.49630309772805076, 0.1448970208957514, 0, 0.02931364701187932, 0.44611820759523346, 0.6197621420291191, 0], [0.5260793235795206, 0.7886161860411672, 0, 0, 0, 0.4135349503247048, 0.3373092349068192, 0.4074187726890977], [0, 0.2692040706896545, 0, 0.43658369793407775, 0.3369116924483512, 0.3105944024619573, 0.5654828470276134, 0], [0, 0.697530799501314, 0.6482474592519106, 0, 0.016590027475714215, 0.07342641040794486, 0.04900263691563263, 0.4598382838949607], [0.6406669405207319, 0.35640289656604257, 0.5680029344428253, 0.009442814765749315, 0, 0.010219757204770256, 0.18866017093160226, 0.7685533240992717], [0.3826307792646341, 0.7024618998557096, 0, 0, 0, 0, 0.259476821236635, 0.5576085840020767], [0, 0.8606661650949871, 0, 0, 0.28727085177031236, 0.6852764315205603, 0, 0.498124380643084]], "test": [{ "sourceRow": 242, "digit": 8, "pixels": [0, 0, 2, 12, 12, 0, 0, 0, 0, 0, 7, 16, 15, 9, 1, 0, 0, 0, 6, 14, 13, 15, 3, 0, 0, 0, 1, 16, 16, 4, 0, 0, 0, 0, 7, 16, 14, 0, 0, 0, 0, 1, 15, 9, 16, 5, 0, 0, 0, 2, 13, 13, 16, 10, 0, 0, 0, 0, 1, 11, 12, 5, 0, 0] }, { "sourceRow": 256, "digit": 0, "pixels": [0, 0, 4, 11, 15, 8, 0, 0, 0, 0, 13, 16, 11, 13, 7, 0, 0, 3, 16, 12, 0, 4, 8, 0, 0, 6, 16, 5, 0, 4, 8, 0, 0, 7, 9, 0, 0, 9, 7, 0, 0, 4, 10, 0, 2, 15, 2, 0, 0, 1, 16, 12, 14, 10, 0, 0, 0, 0, 4, 14, 14, 1, 0, 0] }, { "sourceRow": 40, "digit": 8, "pixels": [0, 0, 11, 10, 12, 4, 0, 0, 0, 0, 12, 13, 9, 16, 1, 0, 0, 0, 7, 13, 11, 16, 0, 0, 0, 0, 1, 16, 14, 4, 0, 0, 0, 0, 10, 16, 13, 0, 0, 0, 0, 0, 14, 7, 12, 7, 0, 0, 0, 4, 14, 4, 12, 13, 0, 0, 0, 1, 11, 14, 12, 4, 0, 0] }, { "sourceRow": 220, "digit": 9, "pixels": [0, 0, 11, 16, 8, 0, 0, 0, 0, 6, 16, 11, 13, 9, 0, 0, 0, 7, 16, 0, 9, 16, 0, 0, 0, 2, 15, 12, 16, 16, 3, 0, 0, 0, 5, 7, 7, 16, 4, 0, 0, 0, 0, 0, 5, 16, 5, 0, 0, 0, 3, 7, 16, 11, 0, 0, 0, 0, 13, 16, 11, 1, 0, 0] }, { "sourceRow": 132, "digit": 2, "pixels": [0, 2, 15, 16, 6, 0, 0, 0, 0, 5, 16, 15, 14, 0, 0, 0, 0, 5, 13, 10, 14, 0, 0, 0, 0, 0, 0, 12, 12, 0, 0, 0, 0, 0, 1, 16, 7, 0, 0, 0, 0, 0, 10, 15, 2, 0, 0, 0, 0, 3, 16, 10, 8, 6, 1, 0, 0, 2, 15, 16, 16, 16, 7, 0] }, { "sourceRow": 97, "digit": 4, "pixels": [0, 0, 0, 3, 14, 1, 0, 0, 0, 0, 0, 13, 12, 1, 0, 0, 0, 0, 7, 16, 5, 3, 0, 0, 0, 3, 15, 11, 5, 16, 2, 0, 0, 5, 16, 11, 11, 16, 6, 0, 0, 0, 6, 12, 16, 13, 3, 0, 0, 0, 0, 1, 15, 7, 0, 0, 0, 0, 0, 2, 16, 7, 0, 0] }, { "sourceRow": 1, "digit": 1, "pixels": [0, 0, 0, 12, 13, 5, 0, 0, 0, 0, 0, 11, 16, 9, 0, 0, 0, 0, 3, 15, 16, 6, 0, 0, 0, 7, 15, 16, 16, 2, 0, 0, 0, 0, 1, 16, 16, 3, 0, 0, 0, 0, 1, 16, 16, 6, 0, 0, 0, 0, 1, 16, 16, 6, 0, 0, 0, 0, 0, 11, 16, 10, 0, 0] }, { "sourceRow": 13, "digit": 3, "pixels": [0, 2, 9, 15, 14, 9, 3, 0, 0, 4, 13, 8, 9, 16, 8, 0, 0, 0, 0, 6, 14, 15, 3, 0, 0, 0, 0, 11, 14, 2, 0, 0, 0, 0, 0, 2, 15, 11, 0, 0, 0, 0, 0, 0, 2, 15, 4, 0, 0, 1, 5, 6, 13, 16, 6, 0, 0, 2, 12, 12, 13, 11, 0, 0] }, { "sourceRow": 43, "digit": 7, "pixels": [0, 0, 0, 9, 15, 12, 0, 0, 0, 0, 4, 7, 7, 14, 0, 0, 0, 0, 0, 0, 0, 13, 3, 0, 0, 4, 9, 8, 10, 13, 1, 0, 0, 4, 16, 15, 16, 16, 6, 0, 0, 0, 0, 0, 14, 3, 0, 0, 0, 0, 0, 9, 12, 0, 0, 0, 0, 0, 0, 11, 7, 0, 0, 0] }, { "sourceRow": 180, "digit": 2, "pixels": [0, 0, 7, 15, 15, 4, 0, 0, 0, 8, 16, 16, 16, 4, 0, 0, 0, 8, 15, 8, 16, 4, 0, 0, 0, 0, 0, 10, 15, 0, 0, 0, 0, 0, 1, 15, 9, 0, 0, 0, 0, 0, 6, 16, 2, 0, 0, 0, 0, 0, 8, 16, 8, 11, 9, 0, 0, 0, 9, 16, 16, 12, 3, 0] }, { "sourceRow": 120, "digit": 5, "pixels": [0, 0, 6, 13, 2, 0, 0, 0, 0, 4, 16, 16, 16, 11, 0, 0, 0, 0, 12, 11, 1, 6, 1, 0, 0, 0, 12, 14, 10, 2, 0, 0, 0, 0, 1, 8, 12, 12, 0, 0, 0, 0, 0, 0, 9, 14, 0, 0, 0, 0, 4, 9, 16, 5, 0, 0, 0, 0, 9, 14, 4, 0, 0, 0] }, { "sourceRow": 272, "digit": 6, "pixels": [0, 0, 0, 13, 9, 0, 0, 0, 0, 0, 8, 15, 5, 0, 0, 0, 0, 0, 14, 8, 0, 0, 0, 0, 0, 2, 16, 3, 0, 2, 0, 0, 0, 0, 16, 13, 16, 16, 6, 0, 0, 1, 16, 11, 4, 7, 12, 0, 0, 0, 11, 12, 5, 13, 9, 0, 0, 0, 1, 12, 15, 11, 2, 0] }, { "sourceRow": 244, "digit": 2, "pixels": [0, 0, 4, 14, 16, 4, 0, 0, 0, 3, 16, 16, 16, 6, 0, 0, 0, 8, 16, 12, 16, 7, 0, 0, 0, 3, 5, 12, 15, 0, 0, 0, 0, 0, 0, 15, 12, 0, 0, 0, 0, 0, 6, 16, 2, 0, 0, 0, 0, 0, 8, 16, 12, 5, 1, 0, 0, 0, 4, 16, 16, 15, 4, 0] }, { "sourceRow": 202, "digit": 0, "pixels": [0, 0, 4, 15, 11, 1, 0, 0, 0, 2, 14, 14, 16, 8, 0, 0, 0, 8, 15, 2, 3, 13, 0, 0, 0, 4, 16, 0, 0, 12, 7, 0, 0, 7, 16, 0, 0, 12, 8, 0, 0, 3, 16, 6, 1, 14, 9, 0, 0, 0, 15, 16, 16, 16, 2, 0, 0, 0, 4, 13, 14, 6, 0, 0] }, { "sourceRow": 95, "digit": 6, "pixels": [0, 0, 0, 11, 16, 8, 0, 0, 0, 0, 6, 16, 13, 3, 0, 0, 0, 0, 8, 16, 8, 0, 0, 0, 0, 0, 13, 16, 2, 0, 0, 0, 0, 0, 15, 16, 5, 0, 0, 0, 0, 2, 16, 16, 16, 5, 0, 0, 0, 1, 10, 16, 16, 14, 0, 0, 0, 0, 0, 12, 16, 15, 0, 0] }, { "sourceRow": 265, "digit": 9, "pixels": [0, 0, 6, 12, 13, 5, 0, 0, 0, 2, 16, 9, 8, 15, 2, 0, 0, 8, 12, 0, 3, 15, 8, 0, 0, 4, 15, 12, 16, 13, 1, 0, 0, 0, 2, 2, 16, 6, 0, 0, 0, 0, 0, 1, 16, 1, 0, 0, 0, 0, 0, 5, 16, 0, 0, 0, 0, 0, 3, 16, 14, 0, 0, 0] }, { "sourceRow": 102, "digit": 5, "pixels": [0, 0, 12, 16, 16, 8, 0, 0, 0, 3, 16, 13, 8, 5, 0, 0, 0, 2, 16, 3, 0, 0, 0, 0, 0, 0, 16, 13, 9, 0, 0, 0, 0, 0, 10, 16, 16, 7, 0, 0, 0, 0, 0, 1, 10, 13, 0, 0, 0, 0, 2, 11, 16, 10, 0, 0, 0, 0, 11, 16, 12, 0, 0, 0] }, { "sourceRow": 221, "digit": 1, "pixels": [0, 0, 0, 4, 14, 14, 5, 0, 0, 0, 0, 9, 16, 16, 7, 0, 0, 0, 5, 15, 16, 15, 3, 0, 0, 4, 15, 16, 16, 12, 0, 0, 0, 5, 16, 16, 16, 12, 0, 0, 0, 0, 0, 12, 16, 13, 1, 0, 0, 0, 0, 8, 16, 16, 7, 0, 0, 0, 0, 4, 14, 15, 6, 0] }, { "sourceRow": 248, "digit": 8, "pixels": [0, 0, 3, 14, 13, 1, 0, 0, 0, 0, 9, 16, 16, 9, 0, 0, 0, 0, 8, 16, 11, 15, 1, 0, 0, 0, 2, 14, 16, 15, 2, 0, 0, 0, 6, 16, 16, 6, 0, 0, 0, 0, 15, 11, 10, 12, 0, 0, 0, 1, 16, 11, 11, 15, 0, 0, 0, 0, 5, 13, 15, 7, 0, 0] }, { "sourceRow": 213, "digit": 3, "pixels": [0, 2, 14, 16, 12, 6, 0, 0, 0, 1, 10, 8, 14, 16, 1, 0, 0, 0, 0, 0, 10, 15, 2, 0, 0, 0, 0, 2, 16, 12, 0, 0, 0, 0, 0, 3, 16, 12, 0, 0, 0, 0, 0, 0, 11, 16, 2, 0, 0, 0, 7, 10, 15, 15, 2, 0, 0, 3, 13, 11, 7, 2, 0, 0] }, { "sourceRow": 145, "digit": 5, "pixels": [0, 4, 15, 16, 16, 16, 4, 0, 0, 4, 16, 15, 9, 7, 1, 0, 0, 0, 15, 14, 1, 0, 0, 0, 0, 0, 5, 16, 9, 0, 0, 0, 0, 0, 0, 14, 16, 0, 0, 0, 0, 0, 0, 9, 16, 5, 0, 0, 0, 3, 10, 13, 16, 4, 0, 0, 0, 5, 16, 16, 12, 0, 0, 0] }, { "sourceRow": 74, "digit": 5, "pixels": [0, 0, 13, 13, 8, 2, 0, 0, 0, 5, 16, 16, 16, 12, 0, 0, 0, 1, 15, 12, 0, 0, 0, 0, 0, 0, 12, 13, 7, 1, 0, 0, 0, 0, 8, 16, 16, 12, 0, 0, 0, 0, 0, 4, 9, 16, 3, 0, 0, 0, 1, 5, 14, 15, 1, 0, 0, 0, 10, 16, 16, 6, 0, 0] }, { "sourceRow": 58, "digit": 6, "pixels": [0, 0, 0, 10, 13, 1, 0, 0, 0, 1, 11, 12, 7, 0, 0, 0, 0, 2, 16, 12, 0, 0, 0, 0, 0, 4, 16, 11, 0, 0, 0, 0, 0, 4, 16, 15, 8, 4, 0, 0, 0, 4, 16, 16, 13, 16, 6, 0, 0, 0, 7, 16, 7, 13, 14, 0, 0, 0, 0, 7, 15, 15, 5, 0] }, { "sourceRow": 232, "digit": 6, "pixels": [0, 0, 0, 11, 14, 0, 0, 0, 0, 0, 10, 16, 4, 0, 0, 0, 0, 1, 15, 11, 0, 0, 0, 0, 0, 3, 16, 12, 8, 2, 0, 0, 0, 7, 16, 16, 12, 14, 3, 0, 0, 4, 16, 8, 0, 10, 9, 0, 0, 1, 12, 15, 9, 14, 10, 0, 0, 0, 2, 10, 13, 11, 1, 0] }, { "sourceRow": 222, "digit": 7, "pixels": [0, 0, 4, 15, 16, 16, 5, 0, 0, 0, 6, 9, 11, 16, 11, 0, 0, 0, 0, 0, 3, 16, 5, 0, 0, 0, 0, 3, 14, 16, 10, 0, 0, 0, 7, 16, 16, 11, 3, 0, 0, 0, 8, 15, 13, 0, 0, 0, 0, 0, 5, 16, 7, 0, 0, 0, 0, 0, 7, 14, 2, 0, 0, 0] }, { "sourceRow": 7, "digit": 7, "pixels": [0, 0, 7, 8, 13, 16, 15, 1, 0, 0, 7, 7, 4, 11, 12, 0, 0, 0, 0, 0, 8, 13, 1, 0, 0, 4, 8, 8, 15, 15, 6, 0, 0, 2, 11, 15, 15, 4, 0, 0, 0, 0, 0, 16, 5, 0, 0, 0, 0, 0, 9, 15, 1, 0, 0, 0, 0, 0, 13, 5, 0, 0, 0, 0] }, { "sourceRow": 179, "digit": 0, "pixels": [0, 0, 0, 10, 15, 1, 0, 0, 0, 0, 5, 16, 16, 10, 0, 0, 0, 0, 14, 6, 6, 15, 0, 0, 0, 4, 16, 4, 0, 15, 3, 0, 0, 5, 15, 5, 0, 11, 5, 0, 0, 0, 12, 11, 0, 13, 5, 0, 0, 0, 8, 16, 16, 16, 3, 0, 0, 0, 1, 8, 13, 8, 0, 0] }, { "sourceRow": 29, "digit": 9, "pixels": [0, 0, 9, 13, 7, 0, 0, 0, 0, 0, 12, 16, 16, 2, 0, 0, 0, 0, 12, 13, 16, 6, 0, 0, 0, 0, 6, 16, 16, 14, 0, 0, 0, 0, 0, 0, 2, 16, 3, 0, 0, 0, 0, 0, 0, 9, 10, 0, 0, 0, 3, 7, 12, 14, 16, 2, 0, 0, 7, 12, 12, 12, 11, 0] }, { "sourceRow": 261, "digit": 5, "pixels": [0, 0, 6, 8, 12, 14, 0, 0, 0, 5, 16, 15, 12, 7, 0, 0, 0, 8, 16, 13, 4, 0, 0, 0, 0, 2, 11, 8, 14, 11, 0, 0, 0, 0, 0, 0, 0, 15, 1, 0, 0, 0, 0, 0, 0, 14, 5, 0, 0, 1, 9, 8, 12, 14, 1, 0, 0, 0, 10, 15, 12, 3, 0, 0] }, { "sourceRow": 60, "digit": 3, "pixels": [0, 0, 10, 15, 14, 4, 0, 0, 0, 0, 4, 6, 13, 16, 2, 0, 0, 0, 0, 3, 16, 9, 0, 0, 0, 0, 0, 1, 16, 6, 0, 0, 0, 0, 0, 0, 10, 12, 0, 0, 0, 0, 0, 0, 1, 16, 4, 0, 0, 1, 9, 5, 6, 16, 7, 0, 0, 0, 14, 12, 15, 11, 2, 0] }, { "sourceRow": 246, "digit": 5, "pixels": [0, 4, 13, 9, 8, 3, 0, 0, 0, 5, 16, 14, 12, 12, 6, 0, 0, 8, 16, 1, 0, 0, 0, 0, 0, 3, 16, 11, 1, 0, 0, 0, 0, 0, 8, 16, 9, 0, 0, 0, 0, 0, 0, 10, 16, 0, 0, 0, 0, 1, 1, 12, 14, 0, 0, 0, 0, 4, 14, 14, 3, 0, 0, 0] }, { "sourceRow": 47, "digit": 1, "pixels": [0, 0, 0, 1, 11, 9, 0, 0, 0, 0, 0, 7, 16, 13, 0, 0, 0, 0, 4, 14, 16, 9, 0, 0, 0, 10, 16, 11, 16, 8, 0, 0, 0, 0, 0, 3, 16, 6, 0, 0, 0, 0, 0, 3, 16, 8, 0, 0, 0, 0, 0, 5, 16, 10, 0, 0, 0, 0, 0, 2, 14, 6, 0, 0] }, { "sourceRow": 194, "digit": 4, "pixels": [0, 0, 0, 0, 11, 5, 0, 0, 0, 0, 0, 8, 16, 2, 0, 0, 0, 0, 4, 15, 16, 3, 0, 0, 0, 0, 12, 6, 16, 3, 0, 0, 0, 5, 15, 0, 15, 5, 3, 0, 0, 6, 16, 16, 16, 11, 4, 0, 0, 0, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 12, 2, 0, 0] }, { "sourceRow": 107, "digit": 1, "pixels": [0, 0, 0, 0, 6, 10, 0, 0, 0, 0, 0, 0, 14, 15, 0, 0, 0, 0, 0, 10, 16, 16, 0, 0, 0, 0, 7, 16, 16, 15, 0, 0, 0, 3, 15, 7, 15, 10, 0, 0, 0, 0, 0, 0, 13, 11, 0, 0, 0, 0, 0, 0, 15, 9, 0, 0, 0, 0, 0, 0, 8, 15, 0, 0] }, { "sourceRow": 119, "digit": 9, "pixels": [0, 0, 0, 12, 14, 1, 0, 0, 0, 0, 9, 16, 10, 5, 0, 0, 0, 0, 8, 13, 5, 14, 0, 0, 0, 0, 2, 14, 16, 16, 4, 0, 0, 0, 0, 0, 4, 10, 10, 0, 0, 0, 0, 0, 0, 4, 16, 0, 0, 0, 2, 6, 4, 9, 16, 0, 0, 0, 1, 11, 16, 15, 7, 0] }, { "sourceRow": 159, "digit": 9, "pixels": [0, 0, 5, 13, 4, 0, 0, 0, 0, 0, 15, 14, 14, 5, 0, 0, 0, 0, 12, 7, 8, 16, 1, 0, 0, 0, 4, 13, 16, 16, 1, 0, 0, 0, 0, 0, 0, 15, 2, 0, 0, 0, 0, 0, 0, 14, 6, 0, 0, 0, 2, 7, 8, 16, 4, 0, 0, 0, 6, 12, 13, 10, 0, 0] }, { "sourceRow": 38, "digit": 8, "pixels": [0, 0, 7, 7, 13, 16, 4, 0, 0, 0, 13, 13, 6, 12, 7, 0, 0, 0, 10, 4, 10, 11, 1, 0, 0, 0, 8, 16, 10, 0, 0, 0, 0, 3, 14, 16, 0, 0, 0, 0, 0, 8, 8, 11, 5, 0, 0, 0, 0, 4, 10, 9, 8, 0, 0, 0, 0, 1, 11, 16, 6, 0, 0, 0] }, { "sourceRow": 259, "digit": 3, "pixels": [0, 0, 10, 16, 10, 1, 0, 0, 0, 6, 14, 6, 16, 3, 0, 0, 0, 5, 4, 5, 15, 0, 0, 0, 0, 0, 0, 12, 14, 1, 0, 0, 0, 0, 0, 3, 11, 15, 1, 0, 0, 0, 0, 0, 0, 10, 8, 0, 0, 0, 9, 8, 8, 15, 6, 0, 0, 0, 9, 15, 15, 9, 0, 0] }, { "sourceRow": 177, "digit": 1, "pixels": [0, 0, 0, 0, 12, 11, 1, 0, 0, 0, 0, 1, 16, 16, 7, 0, 0, 0, 1, 14, 16, 16, 7, 0, 0, 1, 14, 16, 14, 16, 8, 0, 0, 5, 12, 3, 8, 16, 7, 0, 0, 0, 0, 0, 8, 16, 4, 0, 0, 0, 0, 0, 8, 16, 1, 0, 0, 0, 0, 0, 11, 12, 0, 0] }, { "sourceRow": 147, "digit": 7, "pixels": [0, 0, 3, 15, 14, 1, 0, 0, 0, 0, 13, 16, 16, 6, 0, 0, 0, 0, 4, 4, 16, 8, 0, 0, 0, 0, 0, 1, 16, 10, 1, 0, 0, 0, 7, 16, 16, 16, 8, 0, 0, 0, 12, 15, 16, 6, 0, 0, 0, 0, 0, 14, 11, 0, 0, 0, 0, 0, 4, 12, 1, 0, 0, 0] }, { "sourceRow": 306, "digit": 2, "pixels": [0, 2, 15, 16, 7, 0, 0, 0, 0, 10, 15, 10, 16, 2, 0, 0, 0, 9, 11, 5, 16, 0, 0, 0, 0, 0, 0, 12, 11, 0, 0, 0, 0, 0, 5, 16, 2, 0, 0, 0, 0, 3, 15, 8, 0, 0, 0, 0, 0, 8, 15, 5, 5, 8, 3, 0, 0, 3, 15, 16, 16, 16, 10, 0] }, { "sourceRow": 59, "digit": 3, "pixels": [0, 1, 10, 15, 11, 1, 0, 0, 0, 3, 8, 8, 11, 12, 0, 0, 0, 0, 0, 5, 14, 15, 1, 0, 0, 0, 0, 11, 15, 2, 0, 0, 0, 0, 0, 4, 15, 2, 0, 0, 0, 0, 0, 0, 12, 10, 0, 0, 0, 0, 3, 4, 10, 16, 1, 0, 0, 0, 13, 16, 15, 10, 0, 0] }, { "sourceRow": 84, "digit": 2, "pixels": [0, 1, 13, 15, 2, 0, 0, 0, 0, 6, 15, 15, 9, 0, 0, 0, 0, 9, 8, 10, 13, 0, 0, 0, 0, 5, 3, 12, 12, 0, 0, 0, 0, 0, 3, 16, 6, 0, 0, 0, 0, 5, 15, 15, 1, 0, 0, 0, 0, 6, 16, 15, 12, 12, 11, 0, 0, 1, 11, 13, 16, 16, 12, 0] }, { "sourceRow": 41, "digit": 4, "pixels": [0, 0, 0, 9, 15, 1, 0, 0, 0, 0, 4, 16, 12, 0, 0, 0, 0, 0, 15, 14, 2, 11, 3, 0, 0, 4, 16, 9, 4, 16, 10, 0, 0, 9, 16, 11, 13, 16, 2, 0, 0, 0, 9, 16, 16, 14, 0, 0, 0, 0, 0, 8, 16, 6, 0, 0, 0, 0, 0, 9, 16, 2, 0, 0] }, { "sourceRow": 140, "digit": 0, "pixels": [0, 0, 12, 9, 12, 1, 0, 0, 0, 0, 14, 16, 16, 8, 0, 0, 0, 3, 16, 9, 3, 15, 2, 0, 0, 4, 16, 1, 0, 16, 5, 0, 0, 5, 12, 0, 0, 16, 5, 0, 0, 3, 14, 1, 4, 16, 4, 0, 0, 0, 15, 12, 14, 14, 0, 0, 0, 0, 7, 12, 12, 2, 0, 0] }, { "sourceRow": 8, "digit": 8, "pixels": [0, 0, 9, 14, 8, 1, 0, 0, 0, 0, 12, 14, 14, 12, 0, 0, 0, 0, 9, 10, 0, 15, 4, 0, 0, 0, 3, 16, 12, 14, 2, 0, 0, 0, 4, 16, 16, 2, 0, 0, 0, 3, 16, 8, 10, 13, 2, 0, 0, 1, 15, 1, 3, 16, 8, 0, 0, 0, 11, 16, 15, 11, 1, 0] }, { "sourceRow": 203, "digit": 9, "pixels": [0, 0, 10, 15, 7, 0, 0, 0, 0, 4, 16, 13, 11, 11, 0, 0, 0, 10, 16, 12, 15, 16, 4, 0, 0, 3, 12, 12, 14, 16, 4, 0, 0, 0, 0, 0, 10, 16, 4, 0, 0, 0, 0, 0, 9, 16, 4, 0, 0, 0, 4, 4, 15, 15, 0, 0, 0, 1, 12, 15, 12, 3, 0, 0] }, { "sourceRow": 20, "digit": 0, "pixels": [0, 0, 3, 13, 11, 7, 0, 0, 0, 0, 11, 16, 16, 16, 2, 0, 0, 4, 16, 9, 1, 14, 2, 0, 0, 4, 16, 0, 0, 16, 2, 0, 0, 0, 16, 1, 0, 12, 8, 0, 0, 0, 15, 9, 0, 13, 6, 0, 0, 0, 9, 14, 9, 14, 1, 0, 0, 0, 2, 12, 13, 4, 0, 0] }, { "sourceRow": 182, "digit": 7, "pixels": [0, 0, 5, 16, 12, 2, 0, 0, 0, 0, 4, 11, 16, 10, 0, 0, 0, 0, 0, 0, 14, 11, 0, 0, 0, 0, 2, 4, 14, 14, 2, 0, 0, 0, 13, 16, 16, 10, 4, 0, 0, 0, 3, 10, 14, 0, 0, 0, 0, 0, 0, 15, 5, 0, 0, 0, 0, 0, 6, 11, 0, 0, 0, 0] }, { "sourceRow": 26, "digit": 6, "pixels": [0, 0, 1, 13, 14, 3, 0, 0, 0, 0, 8, 16, 13, 2, 0, 0, 0, 2, 16, 16, 3, 0, 0, 0, 0, 3, 16, 12, 1, 0, 0, 0, 0, 5, 16, 14, 5, 0, 0, 0, 0, 3, 16, 16, 16, 16, 6, 0, 0, 1, 14, 16, 16, 16, 12, 0, 0, 0, 3, 12, 15, 14, 7, 0] }, { "sourceRow": 85, "digit": 1, "pixels": [0, 0, 0, 1, 16, 5, 0, 0, 0, 0, 0, 5, 16, 11, 0, 0, 0, 0, 0, 12, 16, 11, 0, 0, 0, 7, 12, 16, 16, 7, 0, 0, 0, 4, 8, 12, 16, 4, 0, 0, 0, 0, 0, 9, 16, 2, 0, 0, 0, 0, 0, 10, 16, 2, 0, 0, 0, 0, 0, 3, 13, 5, 0, 0] }, { "sourceRow": 113, "digit": 2, "pixels": [0, 0, 2, 16, 13, 1, 0, 0, 0, 0, 6, 15, 16, 7, 0, 0, 0, 0, 3, 6, 16, 8, 0, 0, 0, 0, 0, 3, 16, 6, 0, 0, 0, 0, 1, 13, 13, 0, 0, 0, 0, 6, 14, 16, 4, 0, 0, 0, 0, 9, 16, 16, 13, 10, 3, 0, 0, 0, 4, 11, 15, 16, 10, 0] }, { "sourceRow": 118, "digit": 7, "pixels": [0, 0, 9, 12, 15, 15, 2, 0, 0, 1, 15, 14, 11, 16, 7, 0, 0, 0, 2, 0, 2, 16, 4, 0, 0, 0, 2, 4, 10, 15, 2, 0, 0, 0, 13, 16, 16, 16, 9, 0, 0, 0, 13, 16, 10, 1, 0, 0, 0, 0, 6, 16, 1, 0, 0, 0, 0, 0, 11, 9, 0, 0, 0, 0] }, { "sourceRow": 127, "digit": 8, "pixels": [0, 0, 5, 4, 9, 10, 0, 0, 0, 0, 10, 8, 11, 16, 2, 0, 0, 0, 8, 12, 14, 14, 1, 0, 0, 0, 5, 15, 7, 0, 0, 0, 0, 0, 14, 12, 0, 0, 0, 0, 0, 1, 14, 13, 3, 0, 0, 0, 0, 0, 12, 13, 5, 0, 0, 0, 0, 0, 7, 16, 5, 0, 0, 0] }, { "sourceRow": 121, "digit": 4, "pixels": [0, 0, 0, 12, 13, 0, 0, 0, 0, 0, 5, 16, 10, 0, 0, 0, 0, 6, 16, 13, 11, 12, 2, 0, 0, 12, 16, 10, 15, 16, 9, 0, 0, 4, 14, 16, 16, 12, 4, 0, 0, 0, 0, 14, 13, 0, 0, 0, 0, 0, 0, 14, 12, 0, 0, 0, 0, 0, 0, 11, 13, 0, 0, 0] }, { "sourceRow": 103, "digit": 3, "pixels": [0, 4, 13, 16, 16, 12, 3, 0, 0, 3, 7, 4, 13, 16, 6, 0, 0, 0, 0, 8, 15, 5, 0, 0, 0, 0, 0, 12, 8, 0, 0, 0, 0, 0, 0, 7, 12, 0, 0, 0, 0, 0, 0, 4, 12, 0, 0, 0, 0, 1, 7, 12, 11, 0, 0, 0, 0, 3, 15, 12, 2, 0, 0, 0] }, { "sourceRow": 290, "digit": 6, "pixels": [0, 0, 0, 8, 15, 2, 0, 0, 0, 0, 6, 16, 5, 0, 0, 0, 0, 0, 12, 8, 0, 0, 0, 0, 0, 0, 13, 6, 0, 0, 0, 0, 0, 0, 12, 12, 16, 14, 0, 0, 0, 0, 14, 15, 6, 8, 11, 0, 0, 3, 12, 14, 5, 10, 13, 0, 0, 0, 0, 9, 16, 13, 5, 0] }, { "sourceRow": 185, "digit": 0, "pixels": [0, 0, 2, 15, 13, 0, 0, 0, 0, 0, 13, 16, 16, 9, 0, 0, 0, 5, 16, 9, 6, 16, 4, 0, 0, 5, 16, 3, 1, 14, 7, 0, 0, 6, 16, 4, 0, 16, 8, 0, 0, 3, 16, 12, 6, 16, 12, 0, 0, 0, 14, 16, 16, 16, 4, 0, 0, 0, 2, 13, 15, 8, 0, 0] }, { "sourceRow": 260, "digit": 4, "pixels": [0, 0, 0, 12, 4, 0, 0, 0, 0, 0, 6, 15, 2, 0, 0, 0, 0, 0, 16, 5, 0, 4, 4, 0, 0, 4, 15, 2, 3, 15, 9, 0, 0, 2, 15, 16, 16, 16, 4, 0, 0, 0, 2, 8, 16, 8, 0, 0, 0, 0, 0, 8, 15, 0, 0, 0, 0, 0, 0, 11, 9, 0, 0, 0] }, { "sourceRow": 239, "digit": 4, "pixels": [0, 0, 0, 0, 15, 9, 0, 0, 0, 0, 0, 8, 16, 5, 0, 0, 0, 0, 1, 16, 16, 5, 0, 0, 0, 0, 11, 16, 16, 1, 1, 0, 0, 6, 16, 16, 16, 15, 9, 0, 0, 7, 15, 16, 16, 10, 1, 0, 0, 0, 1, 7, 16, 1, 0, 0, 0, 0, 0, 1, 15, 5, 0, 0] }], "runs": [{ "k": 1, "seed": 7, "iterations": 6, "trainMse": 0.07214412726956479, "validationMse": 0.07280297762810437 }, { "k": 1, "seed": 19, "iterations": 6, "trainMse": 0.07214412726956489, "validationMse": 0.07280297804796376 }, { "k": 4, "seed": 7, "iterations": 192, "trainMse": 0.04040871277824657, "validationMse": 0.041899149163385656 }, { "k": 4, "seed": 19, "iterations": 207, "trainMse": 0.040408712822337434, "validationMse": 0.041899935779433586 }, { "k": 8, "seed": 7, "iterations": 261, "trainMse": 0.02475004181007092, "validationMse": 0.025548017870485402 }, { "k": 8, "seed": 19, "iterations": 448, "trainMse": 0.025147105358696256, "validationMse": 0.026315303314664616 }, { "k": 16, "seed": 7, "iterations": 575, "trainMse": 0.012295160150866928, "validationMse": 0.013547922081604519 }, { "k": 16, "seed": 19, "iterations": 560, "trainMse": 0.012729497371186178, "validationMse": 0.015288655568708278 }], "baselines": { "meanTestMse": 0.06999462363160687, "pcaTestMse": 0.019678463136677867, "nmfTestMse": 0.02538089143047506 }, "versions": { "python": "3.12.14", "numpy": "2.3.5", "sklearn": "1.9.1" } };
var comparison = { "role": "new predeclared rank6/seed23 controlled study; not recovered historical PCA8 factors", "versions": { "python": "3.12.14", "numpy": "2.3.5", "sklearn": "1.9.1" }, "datasetSha256": "d93f963c4b2610eb07122a312eec3ddceac18a031477370d71e33835eced728e", "fixedScale": 16, "rank": 6, "seed": 23, "settings": { "NMF": { "alpha_H": 0, "alpha_W": 0, "beta_loss": "frobenius", "init": "nndsvda", "l1_ratio": 0, "max_iter": 3e3, "n_components": 6, "random_state": 23, "shuffle": false, "solver": "cd", "tol": 1e-6, "verbose": 0 }, "PCA": { "copy": true, "iterated_power": "auto", "n_components": 6, "n_oversamples": 10, "power_iteration_normalizer": "auto", "random_state": null, "svd_solver": "full", "tol": 0, "whiten": false } }, "sourceIDs": { "train": [31, 228, 16, 2, 163, 176, 205, 100, 23, 37, 78, 83, 35, 276, 211, 196, 15, 24, 91, 294, 161, 33, 98, 252, 71, 70, 170, 281, 278, 96, 93, 240, 283, 267, 237, 165, 258, 52, 198, 57, 99, 189, 231, 126, 39, 125, 264, 133, 274, 249, 184, 199, 162, 44, 219, 243, 88, 247, 269, 104, 11, 110, 141, 293, 45, 300, 225, 178, 172, 181, 6, 287, 51, 101, 229, 77, 217, 134, 28, 142, 131, 155, 299, 298, 208, 285, 206, 69, 280, 279, 54, 250, 153, 94, 174, 173, 139, 282, 61, 66, 124, 209, 188, 204, 17, 18, 157, 216, 284, 160, 154, 34, 224, 200, 255, 90, 227, 4, 53, 262, 214, 215, 0, 238, 36, 158, 137, 111, 80, 65, 186, 117, 191, 82, 21, 128, 152, 30, 257, 230, 253, 12, 49, 234, 64, 164, 130, 288, 251, 320, 226, 268, 169, 138, 270, 3, 22, 190, 105, 135, 136, 9, 168, 55, 175, 25, 187, 275, 108, 109, 273, 166, 150, 151, 149, 314, 76, 212, 63, 156], "validation": [286, 106, 245, 218, 297, 210, 277, 223, 72, 233, 73, 143, 167, 46, 183, 86, 129, 241, 27, 301, 122, 114, 5, 48, 89, 14, 192, 195, 56, 254, 87, 271, 62, 116, 266, 235, 75, 79, 148, 115, 123, 171, 68, 201, 19, 50, 236, 112, 193, 263, 67, 92, 144, 146, 207, 42, 10, 81, 197, 32], "test": [242, 256, 40, 220, 132, 97, 1, 13, 43, 180, 120, 272, 244, 202, 95, 265, 102, 221, 248, 213, 145, 74, 58, 232, 222, 7, 179, 29, 261, 60, 246, 47, 194, 107, 119, 159, 38, 259, 177, 147, 306, 59, 84, 41, 140, 8, 203, 20, 182, 26, 85, 113, 118, 127, 121, 103, 290, 185, 260, 239] }, "dictionaryFitRows": 180, "reservedRows": 60, "selectionOnReservedRows": false, "nmfFitIterations": 229, "nmfCapReached": false, "warnings": [], "NMFTrainMSE": 0.03105257759330203, "NMFValidationMSE": 0.03196800008378407, "testMSE": { "mean": 0.06999462363160687, "PCA6": 0.02416372023704315, "NMF6": 0.030231907695106697 }, "predictionRanges": { "mean": [0, 0.7381944444444445], "PCA6": [-0.2351021064761421, 1.2007030976024105], "NMF6": [0, 1.1729489319699486] }, "PCAMean": [0, 0.029513888888888888, 0.33958333333333335, 0.6989583333333333, 0.7090277777777778, 0.3420138888888889, 0.06145833333333333, 0.003472222222222222, 0, 0.09583333333333334, 0.6069444444444444, 0.7381944444444445, 0.7114583333333333, 0.528125, 0.1125, 0.001736111111111111, 0, 0.12083333333333333, 0.5524305555555555, 0.4840277777777778, 0.5013888888888889, 0.515625, 0.1, 34722222222222224e-20, 0, 0.12881944444444443, 0.54375, 0.5625, 0.6079861111111111, 0.49756944444444445, 0.121875, 0, 0, 0.1375, 0.5493055555555556, 0.6076388888888888, 0.6684027777777778, 0.5256944444444445, 0.16180555555555556, 0, 0, 0.09409722222222222, 0.4722222222222222, 0.5114583333333333, 0.5715277777777777, 0.5069444444444444, 0.1954861111111111, 34722222222222224e-20, 0, 0.03611111111111111, 0.44375, 0.6194444444444445, 0.675, 0.5128472222222222, 0.18611111111111112, 0.004166666666666667, 0, 0.028819444444444446, 0.36666666666666664, 0.7041666666666667, 0.6895833333333333, 0.3871527777777778, 0.09895833333333333, 0.0024305555555555556], "PCAComponents": [[-33132898708546138e-34, 0.005277654789790365, 0.04053901574965385, 0.1498489908026328, -0.0834865121888535, -0.1768454928480726, -0.041549751446625, -0.0017742387068939054, 1734723475976807e-33, 0.04099177980797918, 0.17872989180997959, 0.1880935797949868, -0.1383597824319974, -0.25559482401020567, -0.09151691383658123, -8871193534469528e-19, -0, 0.07742842567369854, 0.3220429091775396, 0.007635687280096971, -0.2549571561944226, -0.2616965260791956, -0.04864200011356242, -17719182322192218e-20, -7346839692639297e-55, 0.062410234392432484, 0.20811379620454554, -0.07053822991137354, -0.32156877185560123, -0.22791095563134517, 0.010994079757923006, -0, -0, 0.0404696605681111, 0.18128635053865705, 0.07744353308369913, -0.17287329894338724, -0.1695363781740072, 6493377892784474e-19, -0, -0, 0.020137380726389983, 0.22827939143826692, 0.15893849284675812, -0.09308590197637462, -0.0688059797549237, 0.07261233458014531, 591328395463989e-18, -0, 0.009730175874001564, 0.223484064373511, 0.18418782755492083, -0.05917483667704724, -0.035220131659719864, 0.11372654427418787, 0.0037250224636949485, -0, 0.0032681503572003752, 0.03539410484158261, 0.13398870967217713, 0.053220154308792136, -0.0018924390456532003, 0.03859717345436672, 46531671023456594e-20], [13646861665046388e-34, 0.04124407698171508, 0.31435064493311815, 0.25745626929220555, 0.0025547203665827606, 0.07645938788691076, 0.0287310436292621, 9416624573330701e-19, 11102230246251565e-32, 0.09940670453069331, 0.33687838669309134, -0.0032141712575380122, -0.047496169722083835, 0.15353679068234283, 0.05481103112461387, 47083122866657803e-20, -0, 0.08592437348576733, 0.060423824387256526, -0.2941958235832895, -0.0706476532173159, 0.09554568566978289, 0.026154050966085432, 5110168413541348e-20, -752316384526264e-51, -0.004684983964151663, -0.13242430483273382, -0.1230346499523098, 0.0684421305532749, -0.0020138076314868, -0.027037249857373335, -0, -0, -0.1000763126770575, -0.28400576218181794, -0.17226719038360705, -0.11769878684375779, -0.07772071206360208, -0.04066595001400981, -0, -0, -0.06919326833347403, -0.24395463426984249, -0.21013786200072535, -0.1716053360298983, -0.07332359527225067, -0.03590153307875326, -5336747673856243e-19, -0, 0.010255123592868965, 0.0930263007106945, 0.04287563248681283, -0.06163083938881593, -0.003575753187303799, -0.03404905814252626, -0.004221282120070291, -0, 0.040851872799346496, 0.32871636096883855, 0.2786227739649501, -0.12624935785680846, -0.13313858933919642, -0.026929567628148573, 0.0013191431056742559], [9160490825731862e-33, -0.030790780580410737, -0.09872543136720258, 0.0016975293208899983, -0.12128057786201812, -0.1604075529313514, -0.05167326840633876, -0.005061144222835573, -5551115123125783e-32, -0.053338768190196464, -0.009123257477003639, -0.003772478308803578, 0.017665069531409006, 0.003928799272166904, -0.044712924786677544, -0.0025305721114178125, 0, -0.02205199914727499, 0.08067681488189694, 0.06630888974985344, 0.0033349653608607884, 0.18359912015216542, 0.01577744668277753, -573546009371511e-18, 0, 0.006148910127796265, 0.026290554611379, -0.07320242745136991, -0.09214606638431802, 0.1582464259603992, 0.046678479886482216, 0, 0, 0.007181107885439454, -0.06690264993090625, -0.33172238786060176, -0.23462549600180177, 0.186490099053585, 0.0745658651468825, 0, 0, 0.0134964857068984, 0.05618689709950184, -0.27532494213348335, -0.30184669598971364, 0.2944843551669039, 0.22152642311398354, 15048538708082034e-20, 0, 0.00511263207071271, 0.10867655098224402, -0.13612784679513013, -0.07608404446506162, 0.3872558811605339, 0.1928836467485924, 0.002214000721372999, 0, -0.030895436464479197, -0.10586621629383346, 0.005205179576541135, 0.22621429849981634, 0.22174224079030877, 0.04314593792241845, 9772109133482747e-19], [8305772267981417e-33, -0.009257597095400194, 0.058337176497891524, 0.0569556606718678, -0.12084160470540654, -0.17758172633904146, -0.08591755289861847, -0.009429592100805365, -27755575615628914e-33, 0.025844233952217174, -0.017310416264078244, 0.012740459947993645, 0.08104337599452947, -0.15978487301026462, -0.11412131029719616, -0.004714796050402701, -5293955920339377e-38, -0.030169857187460777, -0.12782240912799467, 0.1351350447154908, 0.31894151942007437, -0.11583664589313454, -0.10507148075478127, 3169466302828733e-19, -30814879110195774e-49, -0.1294431502537366, -0.28859299637858776, 0.18074914941882006, 0.2966785996782144, -0.2324816479636147, -0.14318807618946774, -0, -0, -0.13139060293249513, -0.24785059364950188, 0.11485916105423627, 0.08799128527656708, -0.24285962888761595, -0.14632047008752538, -0, -0, -0.01857597227882391, 0.03363357782526428, 0.08312322432825396, -0.15507711957648493, -0.136409427279193, 0.024614825851467452, 14412059622460354e-20, -0, 0.012853211587176066, 0.1660092331812648, 0.05426392112975374, -0.12926732922295545, 0.06994761763171081, 0.15554768311894762, 0.005105992747101789, -0, -0.012245195672674595, 0.04726625278500722, 0.010057786968972337, 0.14931795763831518, 0.28530682448191286, 0.14847775908058825, 0.004925659210179605], [-7617406505547474e-34, 0.04431397300552223, 0.12046761748964697, -0.08628417481764347, -0.01600502564139024, 0.05401835122293207, -0.024550513041515967, -0.016038180342020113, 13877787807814457e-33, 0.06826330631889352, -0.009419471980057215, -0.07393301165332788, -0.026451313032751417, -0.10259598745178061, -0.05475942042953021, -0.00801909017101013, 5421010862427522e-35, 0.0728444308058822, 0.23432327527729022, 0.20640165909663422, 0.03444389769505422, -0.2851940698429717, -0.09842614793722745, -2691860166769189e-19, -10097419586828951e-44, 0.08341304635628331, 0.38510996328597413, 0.3780026296129908, 0.06049433847150633, -0.21422113918659344, -0.08469805409344602, -0, -0, -0.027625417612456158, -0.0846047604225456, -0.0943103040054451, -0.02002377034119922, -0.02338384332742409, -0.11345599683898464, -0, -0, -0.0971537599525964, -0.36922857764263756, -0.24827153512258412, 0.13859206658985826, 0.18613856820056018, -0.002074247204833894, 37463516853442844e-20, -0, -0.011147088586383806, -0.1577189348335685, -0.1944590450231104, 0.12666735641921387, 0.056465252849374176, 0.003336253205064047, 0.002405591227820999, -0, 0.036528330929487186, 0.11056543290468901, -0.03605547699823606, 0.06871625993425977, -0.026502375697591656, -0.058213363645763724, 6592386540907602e-19], [1726505716539243e-32, -0.021674363742884728, 0.027683918614822833, 0.13249823379165254, -0.1731019207945083, -0.32461455689278834, -0.0431423220016387, 0.0014831535038091481, -5551115123125783e-32, -0.050412929062106676, 0.038218871494198774, 0.14027828386429375, 0.01946695766789404, -0.34575068740483184, -0.1299914336987734, 7415767519045411e-19, -4336808689942018e-34, -0.06827203856564439, -0.08031946085049486, -0.0211020995869796, 0.09035005949247663, -0.2082875817977635, -0.08240210145930814, 0.001019713625141719, 6462348535570529e-42, -0.017042868407973664, -0.0911261290304148, -0.06410056619970637, 0.10874816958088293, 0.14221230283035516, 0.09869146668057573, -4092601131822876e-49, 14293785611083658e-47, 0.08393882102183031, 0.032146652987579814, -0.006411430224422678, 0.08649943847033424, 0.4083292216788741, 0.19206843909445054, 17230333765254961e-47, 9147852573233073e-47, -0.04203411678065793, -0.22185392344091723, 0.011336169404147747, -0.05443871702740398, 0.006182435511651109, 0.1336613678103854, -22548865257162101e-20, -22430681693697178e-48, -0.06352853717268955, -0.30179423438382535, -0.0036729061434291987, -0.23799865590542627, -0.21074459485056732, 0.08691062046857452, 0.002021276506717245, -0, -0.014109829320091534, 0.02588541801253373, 0.06750079983576242, -0.12187711899857338, -0.2062465334628256, -0.03644610048446779, 0.004399214191171452]], "NMFDictionary": [[0, 0, 0, 1.5441604239500797, 1.9012605676654932, 0, 0, 0.05080972355086669, 0, 0, 0.3029069175921904, 3.112461166043084, 1.0702946398886408, 0, 0, 0.025404861775433343, 0, 0, 0, 0.7160712143784093, 0, 0, 0, 0.002698306125369652, 0, 0, 0, 0, 0, 0, 0.05409496348256024, 0, 0, 0.4939804774344226, 3.4722482526873244, 5.41768520707558, 3.074780665828962, 0, 0.2761969893919824, 0, 0, 1.0386473916560512, 5.05980945742773, 6.227970343843308, 2.347029476271315, 0, 0, 0.002143229400795195, 0, 0.0800235387575903, 1.5722156228392756, 4.109973481173683, 0.9861873934277893, 0, 0, 0.01933768294641416, 0, 0, 0, 1.1057980783692247, 0.6395226166829707, 0.19220520903908203, 0.5127078613087577, 0], [0, 0, 0, 0.38762067145632323, 2.3474879186173485, 2.123718672561504, 0.5525655189020865, 0.0362210128546993, 0, 0, 0.05139936781392952, 0.16506025469835134, 1.6674889350843043, 3.952650096955814, 1.21286935462243, 0.01811050642734965, 0, 0, 0, 0, 0.7931637514350768, 4.342132110293485, 1.0661456514389451, 0, 0, 0, 0, 0, 1.5229700728131597, 4.050651215299685, 0.5509012592651022, 0, 0, 0.04163190315854878, 0.032592750275335196, 0, 1.8699627803404546, 3.0975537131110236, 0.7779345635558496, 0, 0, 0.09420826910556371, 0, 0, 1.602340397888248, 1.967534670742872, 0, 0, 0, 0, 0, 0, 1.9154784606157262, 1.431687063134114, 0, 0, 0, 0, 0, 0.6899947532113914, 0.44335172528884287, 0, 0, 0], [0, 0.2389733324319533, 2.2911992545194093, 2.5321424244835393, 0.8525930064946209, 0.41703188061996177, 0.06010393795753839, 0, 0, 0.7321228974256263, 2.8081336837491992, 1.332052343644085, 0.6368404072418592, 0.7653289078404563, 0.08782730081042157, 0, 0, 0.5790882312296229, 1.0581956130953414, 0, 0.20407040067179366, 0.08171871643314522, 0, 0.0010341218391138093, 0, 0.005412453824751077, 0.005458287799448128, 0.32441203468496044, 0.970043996522572, 0, 0, 0, 0, 0, 0, 0.5876574106546391, 0.3486422987010374, 0, 0, 0, 0, 0, 0, 0.1780113322262794, 0, 0, 0, 0, 0, 0.10496122160812589, 1.1185694188987667, 1.5011755956978223, 0.5031169659031816, 0, 0, 0, 0, 0.23747008026311148, 2.4193188142072475, 2.618801190537946, 0.1781200599939386, 0, 0, 0.004533816520297242], [0, 0, 0.1389811298558834, 1.0840240762016207, 0.3243112854620603, 0, 0, 0, 0, 0, 1.0686817172983392, 1.172354652797822, 0.47112581166894024, 0.0566514594961498, 0, 0, 0, 0.2147591263869748, 1.5937409067195525, 0.6559077344707882, 0, 0.42340857952005717, 0.04872994768288849, 0, 0, 0.3592310085428092, 1.4021949463678176, 0.31981325253744397, 0, 0.4743016355455848, 0.33587044098936625, 0, 0, 0.3249509579876858, 0.9253566618642607, 0, 0, 0.7228225806980438, 0.39913571045002705, 0, 0, 0.13999172565033086, 0.9174489780411313, 0, 0, 1.1028325148993243, 0.8859182703523643, 0.0017372490440941142, 0, 0.05806114617331466, 1.084885129867727, 0.6552697369031286, 0.4845527562122459, 1.2886516165760233, 0.8279673826124611, 0.013516568368700072, 0, 0, 0.1757108263965794, 1.0741117264318603, 1.3601840401581817, 0.8110364858805509, 0.16872752994870158, 0.001896673476734329], [0, 0.039127172404162185, 0, 0, 0.7975514901085256, 0.5553996526083441, 0.07547893395322529, 0, 0, 0.01436103234736893, 0, 0.40093720844021674, 0.3469729449296081, 0.18987505100954583, 0.032868825443909705, 0, 0, 0.10018028994812345, 0.8016789205320481, 0.6075213983966253, 0, 0, 0, 0, 0, 0.3985868617092363, 1.591349066334724, 0.8846906402577438, 0, 0.16596821283609015, 0.09797355553833445, 0, 0, 0.2958527952336611, 0.8999185915595669, 0.6823842117558109, 0.6155742041557309, 0.3726728594008783, 0.06525278111249773, 0, 0, 0, 0, 0.3792344138423594, 1.3596693644905413, 0.343982893467243, 0, 4669160363354797e-19, 0, 0, 0, 0.09005467010486258, 1.042368491457036, 0, 0, 0.0017399116841953258, 0, 0.027593079077030024, 0, 0, 0.3752472143603953, 0, 0, 0], [0, 0, 0, 0.03790695948707647, 0.07380037594508963, 0, 0, 0, 0, 0, 0, 0.17068066962683606, 1.0879941589969233, 0, 0, 0, 0, 0, 0, 1.0771356976561621, 1.8475654965166224, 0.15730005620658963, 0, 46816094700962384e-20, 0, 0, 0, 1.3234344308517165, 1.5578498099075073, 0.01263741848283129, 0, 0, 0, 0, 0, 0.1255178754170663, 0.5295254920388891, 0.19300423547812778, 0, 0, 0, 0, 0, 0, 0, 0.39418510479433255, 0.2660899874914557, 0, 0, 0.03613889636105242, 0.08294423206394859, 0, 0.2822447866897281, 0.8259927157535538, 0.30931462848306984, 0.0049537497438792025, 0, 0, 0, 0, 1.2304607053116068, 1.1665913067645528, 0.22849634963551235, 0.008087822781391562]], "selected": [{ "source_row": 242, "label": 8, "reserved_position": 0, "observed": [0, 0, 0.125, 0.75, 0.75, 0, 0, 0, 0, 0, 0.4375, 1, 0.9375, 0.5625, 0.0625, 0, 0, 0, 0.375, 0.875, 0.8125, 0.9375, 0.1875, 0, 0, 0, 0.0625, 1, 1, 0.25, 0, 0, 0, 0, 0.4375, 1, 0.875, 0, 0, 0, 0, 0.0625, 0.9375, 0.5625, 1, 0.3125, 0, 0, 0, 0.125, 0.8125, 0.8125, 1, 0.625, 0, 0, 0, 0, 0.0625, 0.6875, 0.75, 0.3125, 0, 0], "mean": [0, 0.029513888888888888, 0.33958333333333335, 0.6989583333333333, 0.7090277777777778, 0.3420138888888889, 0.06145833333333333, 0.003472222222222222, 0, 0.09583333333333334, 0.6069444444444444, 0.7381944444444445, 0.7114583333333333, 0.528125, 0.1125, 0.001736111111111111, 0, 0.12083333333333333, 0.5524305555555555, 0.4840277777777778, 0.5013888888888889, 0.515625, 0.1, 34722222222222224e-20, 0, 0.12881944444444443, 0.54375, 0.5625, 0.6079861111111111, 0.49756944444444445, 0.121875, 0, 0, 0.1375, 0.5493055555555556, 0.6076388888888888, 0.6684027777777778, 0.5256944444444445, 0.16180555555555556, 0, 0, 0.09409722222222222, 0.4722222222222222, 0.5114583333333333, 0.5715277777777777, 0.5069444444444444, 0.1954861111111111, 34722222222222224e-20, 0, 0.03611111111111111, 0.44375, 0.6194444444444445, 0.675, 0.5128472222222222, 0.18611111111111112, 0.004166666666666667, 0, 0.028819444444444446, 0.36666666666666664, 0.7041666666666667, 0.6895833333333333, 0.3871527777777778, 0.09895833333333333, 0.0024305555555555556], "PCA6": [-5714505026379849e-33, 0.010315371400982046, 0.21413378004056632, 0.5459953039622931, 0.7757685750471742, 0.42139256983693824, 0.03958781704428483, 0.0024556314062898557, -28403522472947597e-33, 0.08584143731513907, 0.37604450474155454, 0.6583034629206216, 0.825173135120209, 0.598801194322239, 0.11979011402474665, 0.0012278157031449443, 20990364634985422e-35, 0.05703924027588912, 0.2703230323554729, 0.6475045216668123, 0.7982735237368772, 0.5652945001441947, 0.08243653872075479, 4231426484940594e-19, -33679024686044546e-43, -0.012455254225620022, 0.22588145398802667, 0.7238360276950319, 0.8576913934851429, 0.29176114435757494, -0.028933714106123345, 2154551388582862e-49, -752496875324592e-46, 0.029454652634336012, 0.4774967523308831, 0.9418380994968882, 0.898764912773996, 0.11695376374262073, -0.033813459804789475, -9070915621611308e-47, -48158903908214123e-48, 0.15639807658030283, 0.7804371578413638, 0.8371796194755361, 0.6570270215145126, 0.25506510840558055, 0.05241111963297748, 5088293653162718e-19, 11808640723433936e-48, 0.07455899129268306, 0.6494750636806359, 0.7252499660719293, 0.726425889339318, 0.5088076633772279, 0.17527596406271514, 0.006696627654389681, 0, 0.006520843749694024, 0.23375850232076434, 0.5218862982366157, 0.8057561989490194, 0.7104773265433686, 0.24582159582164026, 0.0028006985869169186], "NMF6": [0, 0.038542358145215866, 0.31888104022359753, 0.6439370091785646, 0.759566601469079, 0.3373920390951047, 0.07118291561156047, 0.01050989532050747, 0, 0.10289116278652169, 0.4596378009822253, 0.7957004494881501, 0.9394107729178276, 0.5063555880633323, 0.1310547120655265, 0.005254947660253735, 0, 0.09934569607388584, 0.29954115351009797, 0.6823061403983399, 0.9244194847656744, 0.5003531615218783, 0.10158425535130881, 727584237004824e-18, 0, 0.06677926660212292, 0.26361860696684214, 0.7682673521334213, 0.9698013192167234, 0.4224332387396139, 0.08163977576165267, 0, 0, 0.1233539349822272, 0.6400194819114509, 0.9918760680700417, 0.9777936606709756, 0.44862435470893347, 0.13086628094736047, 0, 0, 0.15735541024999558, 0.7290151890902906, 0.9492105284782633, 0.6745320881494521, 0.4366936361937262, 0.1396831291841614, 40851199157336434e-20, 0, 0.04310514297913753, 0.4367298471892713, 0.8096919357237693, 0.6747062924757767, 0.5332160968907882, 0.15750847208471191, 0.005480830259395355, 0, 0.03667503130969009, 0.33741021886361044, 0.6060092840982038, 0.7896192720490767, 0.5651857762948261, 0.17730951334748107, 0.004266755413830303], "PCA6_coordinates": [-0.23779873919888678, -0.4780452673327731, -0.42258691260270836, 0.8249965888782711, -0.3387584714756587, -0.526450372070148], "NMF6_amounts": [0.139709373461349, 0.09418015700322843, 0.1377144797289649, 0.024102026912130786, 0.14394779009518485, 0.44470182552051124], "rowMSE": { "mean": 0.04595146273389275, "PCA6": 0.021948620787064027, "NMF6": 0.026957889373735507 } }, { "source_row": 256, "label": 0, "reserved_position": 1, "observed": [0, 0, 0.25, 0.6875, 0.9375, 0.5, 0, 0, 0, 0, 0.8125, 1, 0.6875, 0.8125, 0.4375, 0, 0, 0.1875, 1, 0.75, 0, 0.25, 0.5, 0, 0, 0.375, 1, 0.3125, 0, 0.25, 0.5, 0, 0, 0.4375, 0.5625, 0, 0, 0.5625, 0.4375, 0, 0, 0.25, 0.625, 0, 0.125, 0.9375, 0.125, 0, 0, 0.0625, 1, 0.75, 0.875, 0.625, 0, 0, 0, 0, 0.25, 0.875, 0.875, 0.0625, 0, 0], "mean": [0, 0.029513888888888888, 0.33958333333333335, 0.6989583333333333, 0.7090277777777778, 0.3420138888888889, 0.06145833333333333, 0.003472222222222222, 0, 0.09583333333333334, 0.6069444444444444, 0.7381944444444445, 0.7114583333333333, 0.528125, 0.1125, 0.001736111111111111, 0, 0.12083333333333333, 0.5524305555555555, 0.4840277777777778, 0.5013888888888889, 0.515625, 0.1, 34722222222222224e-20, 0, 0.12881944444444443, 0.54375, 0.5625, 0.6079861111111111, 0.49756944444444445, 0.121875, 0, 0, 0.1375, 0.5493055555555556, 0.6076388888888888, 0.6684027777777778, 0.5256944444444445, 0.16180555555555556, 0, 0, 0.09409722222222222, 0.4722222222222222, 0.5114583333333333, 0.5715277777777777, 0.5069444444444444, 0.1954861111111111, 34722222222222224e-20, 0, 0.03611111111111111, 0.44375, 0.6194444444444445, 0.675, 0.5128472222222222, 0.18611111111111112, 0.004166666666666667, 0, 0.028819444444444446, 0.36666666666666664, 0.7041666666666667, 0.6895833333333333, 0.3871527777777778, 0.09895833333333333, 0.0024305555555555556], "PCA6": [-12529979169509638e-33, 0.05222771050074658, 0.34435208840096554, 0.7583742726132155, 0.752081055456771, 0.4529422227440437, 0.09800278471741292, 0.0033323865427158615, 51680403120737696e-33, 0.133202508637625, 0.8484193452039361, 0.7849176217501572, 0.49923994456680615, 0.6929653904644921, 0.19015812451208247, 0.0016661932713579442, 24416580259850917e-35, 0.27655921117787313, 1.1259632743458496, 0.37200941577389046, -0.08989691665547972, 0.6470620213093581, 0.20949298180534995, -0.0011777840822953579, -3483135736839424e-42, 0.3413208120822841, 1.1179448271544774, 0.3403242561255946, -0.05432693318644477, 0.5501291207171329, 0.233366525478396, 2191898811947016e-49, -7655408062012817e-47, 0.226131353993576, 0.7670745994653816, 0.2113553779705088, 0.1565596508861502, 0.5351485543442018, 0.23023872565697873, -922815268163969e-46, -48993699950928475e-48, 0.1197989651870157, 0.6334008094532402, 0.20543518974402336, 0.40760782157938463, 0.8436709103424374, 0.329263007843305, 8464350102360457e-19, 12013334056250361e-48, 0.0702467321033996, 0.7069427871443277, 0.5777533752829943, 0.8292799945763665, 0.8559784206805165, 0.2253433992676203, 0.0020246692569409184, 0, 0.046919552608222365, 0.37581639538445816, 0.8530631706912167, 0.8095009779494581, 0.34343960195109724, 0.01517368406677018, -0.0031296238480530434], "NMF6": [0, 0.03677660461826036, 0.33722075288026054, 0.858617879622351, 0.6167183032532997, 0.3330993931831034, 0.06567837986680121, 0.0028435469284298614, 0, 0.08928781291359199, 0.8557170346481712, 0.8355436670902588, 0.5099164774214954, 0.4593048576632334, 0.10954541053800067, 0.0014217734642149307, 0, 0.19500012355677265, 1.0790431049476172, 0.45576095018168017, 0.08412037366348452, 0.5451392050795008, 0.10456611663898442, 1268330996887128e-19, 0, 0.2640871477959411, 1.036849795106559, 0.39011293444765854, 0.2295241291920242, 0.5750242550750617, 0.22730586377919484, 0, 0, 0.228082191871189, 0.659703161660993, 0.23079530381281424, 0.32509356668152783, 0.6697404716441742, 0.26853312159457704, 0, 0, 0.07739041063268667, 0.45701496632966926, 0.1170010347272782, 0.4272959280356322, 0.7629809466935046, 0.431875253160913, 9544990499071533e-19, 0, 0.040803197008705015, 0.6634602772605407, 0.523882360931654, 0.6734734588841605, 0.7367210698544289, 0.4036248432177747, 0.007012086693308598, 0, 0.03404377503910752, 0.3701942701116121, 0.8860504589649743, 0.8020200738715988, 0.3957423060476064, 0.08324265670356072, 0.0014578313783657434], "PCA6_coordinates": [0.8237331046796642, 0.31723563303664704, 0.8222278385763834, -1.0056235064948278, 0.21847427557562557, -0.5355759677881747], "NMF6_amounts": [0.001930674609957873, 0.07579715940701616, 0.11761046325720487, 0.48748882105020747, 0.22160661637532345, 0], "rowMSE": { "mean": 0.06796480908805942, "PCA6": 0.024197862895577522, "NMF6": 0.03327840298161405 } }] };

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/SavedDataFigures.jsx
import { Fragment as Fragment6, jsx as jsx13, jsxs as jsxs11 } from "react/jsx-runtime";
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
  const [address, setAddress] = scenarioState(selected ?? 0);
  const group = useRef4(null), readout = useId3(), instructions = useId3();
  function inspectKey(event) {
    const rowStart = 8 * Math.floor(address / 8);
    const targets = {
      ArrowLeft: Math.max(rowStart, address - 1),
      ArrowRight: Math.min(rowStart + 7, address + 1),
      ArrowUp: address < 8 ? address : address - 8,
      ArrowDown: address >= 56 ? address : address + 8,
      Home: event.ctrlKey ? 0 : rowStart,
      End: event.ctrlKey ? 63 : rowStart + 7
    };
    if (Object.hasOwn(targets, event.key)) {
      event.preventDefault();
      setAddress(targets[event.key]);
    }
  }
  const ticks = Array.from({ length: 5 }, (_, i) => min + i * (max - min) / 4);
  if (min < 0 && max > 0 && !ticks.includes(0)) ticks.push(0);
  ticks.sort((a, b) => a - b);
  return /* @__PURE__ */ jsxs11("figure", { className: "nmf-image", children: [
    /* @__PURE__ */ jsx13("p", { className: "nmf-object-label", style: component !== void 0 ? {
      color: colors2[component]
    } : void 0, children: label }),
    /* @__PURE__ */ jsxs11("div", { className: "nmf-image-addresses", children: [
      /* @__PURE__ */ jsx13("div", { className: "nmf-column-addresses", "aria-hidden": "true", children: Array.from({ length: 8 }, (_, c) => /* @__PURE__ */ jsx13("span", { children: c }, c)) }),
      /* @__PURE__ */ jsx13("div", { className: "nmf-row-addresses", "aria-hidden": "true", children: Array.from({ length: 8 }, (_, r) => /* @__PURE__ */ jsx13("span", { children: r }, r)) }),
      /* @__PURE__ */ jsx13("div", { className: "nmf-pixels", ref: group, role: "group", "aria-label": `${label}; eight rows, eight columns; feature index8r+c`, "aria-describedby": `${instructions} ${readout}`, tabIndex: 0, onKeyDown: inspectKey, onClick: (event) => {
        const pixel = event.target.closest("[data-pixel-index]");
        if (pixel) {
          setAddress(Number(pixel.dataset.pixelIndex));
          group.current.focus({ preventScroll: true });
        }
      }, children: values.map((v, j) => {
        const fraction = (v - min) / (max - min), grey = Math.round(12 + 230 * fraction), background = signed ? v < 0 ? `color-mix(in srgb, #ee8faf ${100 * Math.abs(v) / Math.abs(min)}%, #101923)` : `color-mix(in srgb, #7bb7ff ${100 * v / max}%, #101923)` : `rgb(${grey},${grey},${grey})`;
        return /* @__PURE__ */ jsx13("span", { "data-pixel-index": j, "data-addressed": address === j ? "" : void 0, role: "img", "aria-label": `row${Math.floor(j / 8)}, column${j % 8}, F${j}: ${v}`, title: `r${Math.floor(j / 8)} c${j % 8} F${j}: ${v}`, style: {
          background
        } }, j);
      }) })
    ] }),
    /* @__PURE__ */ jsxs11("p", { className: "nmf-pixel-readout", id: readout, "aria-live": "polite", "aria-atomic": "true", children: [
      "Row ",
      Math.floor(address / 8),
      ", column ",
      address % 8,
      " \u2192 F",
      address,
      ": ",
      /* @__PURE__ */ jsx13("output", { children: values[address] })
    ] }),
    /* @__PURE__ */ jsx13("p", { className: "nmf-ruler", id: instructions, children: "Tap a cell, or focus the image and use arrow keys. Amber outline marks the inspected cell." }),
    /* @__PURE__ */ jsx13("div", { className: "nmf-pixel-ruler", role: "img", "aria-label": `Shared intensity ruler ${min} to ${max}`, style: {
      background: signed ? "linear-gradient(to right,#ee8faf,#101923 50%,#7bb7ff)" : "linear-gradient(to right,rgb(12,12,12),rgb(242,242,242))"
    }, children: ticks.map((tick) => /* @__PURE__ */ jsx13("span", { className: `nmf-ruler-tick${tick === min ? " nmf-ruler-tick--0" : tick === max ? " nmf-ruler-tick--4" : ""}`, style: { left: `${100 * (tick - min) / (max - min)}%` }, children: fmt(tick) }, tick)) }),
    /* @__PURE__ */ jsxs11("figcaption", { children: [
      "Intensity ruler ",
      min,
      " \u2192 ",
      max,
      min < 0 ? " \xB7 zero lies at its labelled numeric position" : "",
      ". ",
      signed ? "Rose negative; blue positive." : "Dark low, light high."
    ] })
  ] });
}
function Dictionary() {
  return /* @__PURE__ */ jsxs11(Figure, { id: "D42", caption: "The original saved k8/seed19 dictionary contains eight complete64-bin patterns, trained on180 rows. Each panel has the same0\u20134 per-unit pattern ruler. C1\u2013C8 are display IDs for these eight stored rows, with no semantic source label.", children: [
    /* @__PURE__ */ jsx13("div", { className: "nmf-image-grid", children: saved.dictionary.map((h, c) => /* @__PURE__ */ jsx13(Pixels, { label: `C${c + 1} \xB7 original saved pattern`, values: h, component: c, selected: c === 0 ? 35 : void 0 }, c)) }),
    /* @__PURE__ */ jsx13(Matrix, { label: "Magnified C1 address neighbourhood \xB7 row4/column3 is F35=8\xD74+3", values: [[saved.dictionary[0][27], saved.dictionary[0][28]], [saved.dictionary[0][35], saved.dictionary[0][36]]], rows: ["r3", "r4"], columns: ["c3", "c4"], selected: [1, 0], color: colors2[0] })
  ] });
}
function SavedContribution() {
  const [source, setSource] = scenarioState("242"), [component, setComponent] = scenarioState("0"), [gain, setGain] = scenarioState(1), s = savedRow(source), c = Number(component), part = s.parts[c].map((v) => v * gain), other = s.prediction.map((v, j) => v - s.parts[c][j]), prediction = other.map((v, j) => v + part[j]), residual = s.observed.map((v, j) => v - prediction[j]);
  return /* @__PURE__ */ jsxs11(Figure, { id: "D43", caption: "The complete contribution is amount \xD7 all64 pattern bins. Gain changes only this saved amount; all other addends stay fixed. This is an intervention in a recorded decomposition, without refitting.", children: [
    /* @__PURE__ */ jsxs11("div", { className: "nmf-image-grid", children: [
      /* @__PURE__ */ jsx13(Pixels, { label: `Source${source} \xB7 observed digit${s.row.digit}`, values: s.observed }),
      /* @__PURE__ */ jsx13(Pixels, { label: `C${c + 1} \xB7 per-unit pattern`, values: saved.dictionary[c], component: c }),
      /* @__PURE__ */ jsx13(Pixels, { label: `C${c + 1} \xB7 weighted addend`, values: part, component: c }),
      /* @__PURE__ */ jsx13(Pixels, { label: "Current complete reconstruction", values: prediction }),
      /* @__PURE__ */ jsx13(Pixels, { label: "Observed minus reconstruction", values: residual, min: -4, max: 4, signed: true })
    ] }),
    /* @__PURE__ */ jsx13(Bars, { label: "Original saved amounts \xB7 stable component IDs", values: s.w, ids: s.w.map((_, i) => `C${i + 1}`), component: true, max: 1 }),
    /* @__PURE__ */ jsxs11(Controls, { onReset: () => {
      setSource("242");
      setComponent("0");
      setGain(1);
    }, children: [
      /* @__PURE__ */ jsx13(Select, { label: "Saved source ID", value: source, onChange: setSource, options: ["242", "256"] }),
      /* @__PURE__ */ jsx13(Select, { label: "Component", value: component, onChange: setComponent, options: s.w.map((_, i) => ({
        value: String(i),
        label: `C${i + 1}`
      })) }),
      /* @__PURE__ */ jsx13(Range, { label: "Selected amount gain", value: gain, onChange: setGain, max: 2, step: 0.1 })
    ] }),
    /* @__PURE__ */ jsxs11(Result, { children: [
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
  return /* @__PURE__ */ jsxs11(Figure, { id: "D44", caption: "Source256 has largest raw coefficient C7 but largest total contributed intensity C8. Per-bin addends, rather than coefficients alone, determine the image. Sixteen of the60 reserved rows have different rankings.", children: [
    /* @__PURE__ */ jsxs11(Panels, { children: [
      /* @__PURE__ */ jsx13(Bars, { label: "Saved amounts \xB7 factor units", values: s.w, ids: s.w.map((_, i) => `C${i + 1}`), component: true, max: 1 }),
      /* @__PURE__ */ jsx13(Bars, { label: "Total addend intensity \xB7 summed64 bins", values: totals, ids: s.w.map((_, i) => `C${i + 1}`), component: true, max: 8 }),
      /* @__PURE__ */ jsx13(Pixels, { label: "C7 weighted pattern", values: s.parts[6], component: 6 }),
      /* @__PURE__ */ jsx13(Pixels, { label: "C8 weighted pattern", values: s.parts[7], component: 7 })
    ] }),
    /* @__PURE__ */ jsx13(Table, { caption: "Exact saved ranking values", headers: ["Component", "Amount", "Total intensity"], rows: s.w.map((v, i) => [`C${i + 1}`, v, totals[i]]) })
  ] });
}
function Removal() {
  const [removedFraction, setRemovedFraction] = scenarioState(0), s = savedRow(256), part = s.parts[7], removed = part.map((v) => removedFraction * v), current = s.prediction.map((v, j) => v - removed[j]);
  return /* @__PURE__ */ jsxs11(Figure, { id: "D45", caption: "Remove or restore the complete C8 addend from source256 with all other amounts fixed. This is the displayed decomposition's counterfactual, not retraining. Source242's saved C8 amount is zero, so its analogous removal changes nothing.", children: [
    /* @__PURE__ */ jsxs11("div", { className: "nmf-image-grid", children: [
      /* @__PURE__ */ jsx13(Pixels, { label: "Source256 observed", values: s.observed }),
      /* @__PURE__ */ jsx13(Pixels, { label: "Original saved reconstruction", values: s.prediction }),
      /* @__PURE__ */ jsx13(Pixels, { label: "C8 addend actually removed \xB7 r \xD7 complete addend", values: removed, component: 7 }),
      /* @__PURE__ */ jsx13(Pixels, { label: "Current reconstruction", values: current }),
      /* @__PURE__ */ jsx13(Pixels, { label: "Current signed residual", values: s.observed.map((v, j) => v - current[j]), min: -4, max: 4, signed: true })
    ] }),
    /* @__PURE__ */ jsx13(Controls, { onReset: () => setRemovedFraction(0), children: /* @__PURE__ */ jsx13(Range, { label: "Fraction of C8 amount removed r", value: removedFraction, onChange: setRemovedFraction, max: 1, step: 0.1 }) }),
    /* @__PURE__ */ jsxs11(Result, { children: [
      "Removal fraction r=",
      fmt(removedFraction),
      "; MSE ",
      mse(s.observed, current),
      ". Original ",
      mse(s.observed, s.prediction),
      "; fully removed ",
      mse(s.observed, s.prediction.map((v, j) => v - part[j])),
      ". Removed total intensity ",
      fmt(removed.reduce((a, b) => a + b, 0)),
      "."
    ] })
  ] });
}
function Partitions() {
  const arrow = useId3().replaceAll(":", "");
  const roles = [
    { key: "train", label: "Training", color: colors2[0] },
    { key: "validation", label: "Validation", color: colors2[3] },
    { key: "test", label: "Reserved", color: "#e7b54a" }
  ];
  return /* @__PURE__ */ jsxs11(Figure, { id: "D46", caption: "Source IDs and digit labels are metadata, separate from64 fitting columns. The known/16 measurement ruler is fixed. Only training rows fit dictionaries; validation compares candidates and reserved rows use frozen transforms. No writer IDs are supplied.", children: [
    /* @__PURE__ */ jsx13("div", { className: "nmf-split-masks", role: "group", "aria-label": "The three recorded disjoint source-row masks", children: roles.map((role) => /* @__PURE__ */ jsxs11("div", { children: [
      /* @__PURE__ */ jsxs11("p", { className: "nmf-object-label", style: { color: role.color }, children: [
        role.label,
        " \xB7 ",
        comparison.sourceIDs[role.key].length,
        " source rows"
      ] }),
      /* @__PURE__ */ jsx13("div", { className: "nmf-source-mask", "aria-label": `${role.label}; one tick per actual source row`, children: comparison.sourceIDs[role.key].map((id) => /* @__PURE__ */ jsx13("span", { style: { backgroundColor: role.color }, title: `Source${id}` }, id)) })
    ] }, role.key)) }),
    /* @__PURE__ */ jsx13("div", { className: "nmf-dependency-scroll", tabIndex: 0, role: "region", "aria-label": "Training fits H once; validation and reserved routes reuse that exact H; scroll horizontally if needed", children: /* @__PURE__ */ jsxs11("svg", { className: "nmf-partition-dependencies", viewBox: "0 0 760 300", role: "img", "aria-label": "Training X with180 rows fits W and H. The one stored H feeds both validation and reserved transforms. Neither held set points back into fit.", children: [
      /* @__PURE__ */ jsx13("defs", { children: /* @__PURE__ */ jsx13("marker", { id: arrow, markerWidth: "7", markerHeight: "7", refX: "6", refY: "3.5", orient: "auto", children: /* @__PURE__ */ jsx13("path", { d: "M0 0L7 3.5L0 7Z", fill: "currentColor" }) }) }),
      /* @__PURE__ */ jsxs11("g", { fill: "none", stroke: "currentColor", strokeWidth: "1.8", markerEnd: `url(#${arrow})`, children: [
        /* @__PURE__ */ jsx13("path", { d: "M125 45H235" }),
        /* @__PURE__ */ jsx13("path", { d: "M320 45H405" }),
        /* @__PURE__ */ jsx13("path", { d: "M460 65V120H230V155H310" }),
        /* @__PURE__ */ jsx13("path", { d: "M460 65V245H310" }),
        /* @__PURE__ */ jsx13("path", { d: "M125 155H310" }),
        /* @__PURE__ */ jsx13("path", { d: "M125 245H310" }),
        /* @__PURE__ */ jsx13("path", { d: "M390 155H550" }),
        /* @__PURE__ */ jsx13("path", { d: "M390 245H550" })
      ] }),
      /* @__PURE__ */ jsxs11("g", { fill: "currentColor", fontSize: "13", children: [
        /* @__PURE__ */ jsx13("text", { x: "8", y: "30", fill: colors2[0], children: "X training:180 \xD764" }),
        /* @__PURE__ */ jsx13("text", { x: "8", y: "50", children: "fixed pixel /16 units" }),
        /* @__PURE__ */ jsx13("text", { x: "245", y: "36", children: "fit once" }),
        /* @__PURE__ */ jsx13("text", { x: "245", y: "58", children: "W training + H" }),
        /* @__PURE__ */ jsx13("text", { x: "415", y: "30", children: "one stored H:8 \xD764" }),
        /* @__PURE__ */ jsx13("text", { x: "415", y: "52", children: "k8 / seed19 inspection" }),
        /* @__PURE__ */ jsx13("text", { x: "330", y: "111", children: "reuse this H; no refit" }),
        /* @__PURE__ */ jsx13("text", { x: "8", y: "139", fill: colors2[3], children: "X validation:60 \xD764" }),
        /* @__PURE__ */ jsx13("text", { x: "8", y: "160", children: "fixed pixel /16 units" }),
        /* @__PURE__ */ jsx13("text", { x: "320", y: "145", children: "transform" }),
        /* @__PURE__ */ jsx13("text", { x: "320", y: "170", children: "H fixed; solve W" }),
        /* @__PURE__ */ jsx13("text", { x: "560", y: "145", children: "W validation:60 \xD78" }),
        /* @__PURE__ */ jsx13("text", { x: "560", y: "168", children: "compare candidates" }),
        /* @__PURE__ */ jsx13("text", { x: "8", y: "229", fill: "#e7b54a", children: "X reserved:60 \xD764" }),
        /* @__PURE__ */ jsx13("text", { x: "8", y: "250", children: "fixed pixel /16 units" }),
        /* @__PURE__ */ jsx13("text", { x: "320", y: "235", children: "transform" }),
        /* @__PURE__ */ jsx13("text", { x: "320", y: "260", children: "H fixed; solve W" }),
        /* @__PURE__ */ jsx13("text", { x: "560", y: "235", children: "W reserved:60 \xD78" }),
        /* @__PURE__ */ jsx13("text", { x: "560", y: "258", children: "final descriptive error" }),
        /* @__PURE__ */ jsx13("text", { x: "8", y: "290", children: "Arrows carry arrays or fitted state. Only the training route enters fit." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx13(Matrix, { label: "The actual stored inspection H \xB7 all eight patterns and64 bins \xB7 reused by both held routes", values: saved.dictionary, rows: saved.dictionary.map((_, i) => `C${i + 1}`), componentRows: true }),
    /* @__PURE__ */ jsxs11(Panels, { children: [
      /* @__PURE__ */ jsx13(Matrix, { label: "Reserved metadata \xB7 never fitting features", values: [[242, 8], [256, 0]], columns: ["Source ID", "Digit label"] }),
      /* @__PURE__ */ jsx13(Matrix, { label: "Reserved fitting features \xB7 all64 pixel columns \xB7 first two of60 rows", values: saved.test.slice(0, 2).map((r) => r.pixels.map((v) => v / 16)), rows: ["Source242", "Source256"] }),
      /* @__PURE__ */ jsx13(Matrix, { label: "Actual saved transform amounts \xB7 first two of60 reserved rows \xB7 no browser refit", values: saved.activations.slice(0, 2), rows: ["Source242", "Source256"], columns: saved.dictionary.map((_, i) => `C${i + 1}`), componentColumns: true, max: 1 })
    ] }),
    /* @__PURE__ */ jsx13("p", { children: "The dependency drawing shows the original k8/seed19 inspection. Candidate comparison repeats the same train-only boundary for each candidate; the minimum recorded validation error belongs to k16/seed7. The complete H above is recorded data, not a new fit. The validation outputs are a shape-labelled route; their row values are not supplied here." }),
    Object.entries(comparison.sourceIDs).map(([role, ids]) => /* @__PURE__ */ jsxs11("div", { children: [
      /* @__PURE__ */ jsxs11("p", { className: "nmf-object-label", children: [
        "Complete ",
        role,
        " source IDs \xB7 ",
        ids.length,
        " rows"
      ] }),
      /* @__PURE__ */ jsx13("p", { children: ids.join(", ") })
    ] }, role))
  ] });
}
function Candidates() {
  return /* @__PURE__ */ jsxs11(Figure, { id: "D47", caption: "Every recorded training/validation pair is shown without interpolated fits or error bars. Seed7 uses circles, seed19 diamonds; blue training and rose validation share a zero-origin0\u2013.08 MSE ruler. Validation minimum16/7 and inspectable8/19 are different roles.", children: [
    /* @__PURE__ */ jsx13(Plot, { label: "All eight recorded candidates", xmax: 16, xticks: [1, 4, 8, 16], ymax: 0.08, xlabel: "component count k", ylabel: "MSE", children: (map) => /* @__PURE__ */ jsx13(Fragment6, { children: saved.runs.flatMap((r) => [["trainMse", colors2[0]], ["validationMse", colors2[1]]].map(([key, color]) => {
      const p = map([r.k, r[key]]);
      return r.seed === 7 ? /* @__PURE__ */ jsx13("circle", { cx: p[0], cy: p[1], r: "4", fill: color, children: /* @__PURE__ */ jsx13("title", { children: `k${r.k} seed${r.seed} ${key} ${r[key]}` }) }, r.k + key + r.seed) : /* @__PURE__ */ jsx13("path", { d: `M${p[0]} ${p[1] - 5}l5 5l-5 5l-5-5Z`, fill: "none", stroke: color, children: /* @__PURE__ */ jsx13("title", { children: `k${r.k} seed${r.seed} ${key} ${r[key]}` }) }, r.k + key + r.seed);
    })) }) }),
    /* @__PURE__ */ jsxs11("p", { children: [
      "Direct mark identities: ",
      saved.runs.map((r) => `${r.seed === 7 ? "\u25CB" : "\u25C7"} k${r.k}/seed${r.seed}`).join("; "),
      ". Validation minimum is \u25CB k16/seed7; fixed inspection is \u25C7 k8/seed19. Near-identical runs overlap at their actual coordinates."
    ] }),
    /* @__PURE__ */ jsx13(Table, { caption: "All recorded candidate values and iteration counts", headers: ["k", "Seed", "Training MSE", "Validation MSE", "Iterations"], rows: saved.runs.map((r) => [r.k, r.seed, r.trainMse, r.validationMse, r.iterations]) })
  ] });
}
function MatchedComparison() {
  return /* @__PURE__ */ jsxs11(Figure, { id: "D48", caption: "Original eight-component aggregate errors stay separate from this new predeclared rank6/seed23 comparison. New images are literal recorded predictions for source242/256, with the same signed\u2212.25\u20261.25 ruler and no clipping. No historical PCA8 factors are fabricated.", children: [
    /* @__PURE__ */ jsx13(Bars, { label: "Original reserved means \xB7 k8 comparison \xB7 MSE0\u2013.08", values: [saved.baselines.meanTestMse, saved.baselines.pcaTestMse, saved.baselines.nmfTestMse], ids: ["Mean", "PCA8", "NMF8"], max: 0.08 }),
    /* @__PURE__ */ jsx13(Table, { caption: "Original aggregate MSE", headers: ["Representation", "MSE"], rows: Object.entries(saved.baselines) }),
    /* @__PURE__ */ jsx13("p", { className: "nmf-object-label", children: "New predeclared six-coordinate study \xB7 rank6, seed23" }),
    comparison.selected.map((row) => /* @__PURE__ */ jsxs11("div", { children: [
      /* @__PURE__ */ jsxs11("p", { children: [
        "Reserved source",
        row.source_row,
        ", digit",
        row.label,
        " \xB7 fixed64-bin/16 units"
      ] }),
      /* @__PURE__ */ jsx13("div", { className: "nmf-image-grid", children: ["observed", "mean", "PCA6", "NMF6"].map((key) => /* @__PURE__ */ jsx13(Pixels, { label: key, values: row[key], min: -0.25, max: 1.25 }, key)) }),
      /* @__PURE__ */ jsx13(Table, { caption: `New source${row.source_row} row MSE`, headers: ["Representation", "MSE"], rows: ["mean", "PCA6", "NMF6"].map((key) => [key, mse(row.observed, row[key])]) })
    ] }, row.source_row)),
    /* @__PURE__ */ jsx13(Table, { caption: "New rank6/seed23 all60 reserved MSE", headers: ["Representation", "MSE"], rows: Object.entries(comparison.testMSE) }),
    /* @__PURE__ */ jsxs11("p", { children: [
      "Training180 / validation60 / reserved60. NMF nndsvda, CD/Frobenius, zero alphas, tolerance1e\u22126, cap3000; recorded229 iterations, no warnings, cap not reached. Selection on reserved rows: no. New PCA range [",
      comparison.predictionRanges.PCA6.join(", "),
      "]. Negative values retain their signed position on the shared ruler."
    ] })
  ] });
}
function PixelAddress() {
  const s = savedRow(242);
  return /* @__PURE__ */ jsxs11(Figure, { id: "D49", caption: "The original k8 inspection keeps the measurement address and units explicit. Row4/column3 maps to F35 by8r+c; raw16 becomes1 under the known/16 ruler, while the prediction can exceed1.", children: [
    /* @__PURE__ */ jsxs11(Panels, { children: [
      /* @__PURE__ */ jsx13(Pixels, { label: "Source242 \xB7 raw measurement /16", values: s.observed, selected: 35 }),
      /* @__PURE__ */ jsx13(Pixels, { label: "Original NMF8 reconstruction", values: s.prediction, selected: 35 }),
      /* @__PURE__ */ jsx13(Matrix, { label: "Literal address trace", values: [[4, 3, 35, 16, 1, s.prediction[35]]], rows: ["Source242"], columns: ["Row", "Column", "F", "Raw", "Raw/16", "NMF8 prediction"] })
    ] }),
    /* @__PURE__ */ jsxs11("p", { children: [
      "Source242/F35 prediction ",
      s.prediction[35],
      ". Separately source256's original NMF8 maximum is F26=",
      savedRow(256).prediction[26],
      ". These are not the new six-coordinate study."
    ] })
  ] });
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/IdentifiabilityFigures.jsx
import React8, { useState as useState8 } from "react";
import { Fragment as Fragment7, jsx as jsx14, jsxs as jsxs12 } from "react/jsx-runtime";
var cycle = [[1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 1], [1, 0, 0, 1]];
var identity = cycle.map((r, i) => r.map((_, j) => Number(i === j)));
function AlternativeCones() {
  const [t, setT] = scenarioState(0.5), s = shear(t);
  return /* @__PURE__ */ jsxs12(Figure, { id: "D50", caption: "Separate shear fixture: original and changed rays explain the same observed[2,3,3]. Full pattern bars retain the third feature; the equal-aspect slice shows only F0/F1, rather than pretending the third dimension vanished.", children: [
    /* @__PURE__ */ jsxs12(Panels, { children: [
      /* @__PURE__ */ jsx14(Bars, { label: "Original C0 pattern", values: [1, 1, 1], max: 3 }),
      /* @__PURE__ */ jsx14(Bars, { label: "Current C0 pattern", values: s.h[0], max: 3 }),
      /* @__PURE__ */ jsx14(Bars, { label: "Fixed C1 pattern", values: s.h[1], max: 3 }),
      /* @__PURE__ */ jsx14(Plot, { label: "Original and current cone rays \xB7 F0/F1 slice", xmax: 3, ymax: 3, children: (map) => /* @__PURE__ */ jsxs12(Fragment7, { children: [
        /* @__PURE__ */ jsx14(Arrow, { from: map([0, 0]), to: map([1, 1]), dashed: true }),
        /* @__PURE__ */ jsx14(Arrow, { from: map([0, 0]), to: map([1, 1 - t]) }),
        /* @__PURE__ */ jsx14(Arrow, { from: map([0, 0]), to: map([0, 1]), color: colors2[1] }),
        /* @__PURE__ */ jsx14(Point, { at: map([2, 3]), label: "x", open: true })
      ] }) }),
      /* @__PURE__ */ jsx14(Matrix, { label: "Amounts \u2192 complete addends \u2192 same product", values: [[...s.w[0], "\u2014"], [2, 2 * (1 - t), 2 * (1 - t)], [0, 1 + 2 * t, 1 + 2 * t], [2, 3, 3]], rows: ["C0/C1 amounts", "C0 addend", "C1 addend", "Sum"] })
    ] }),
    /* @__PURE__ */ jsx14(Controls, { onReset: () => setT(0.5), children: /* @__PURE__ */ jsx14(Range, { label: "Feasible shear t", value: t, onChange: setT, max: 1, step: 0.02 }) }),
    /* @__PURE__ */ jsxs12(Result, { children: [
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
  return /* @__PURE__ */ jsxs12(Figure, { id: "D51", caption: "A nonnegative rank-one support is a row-set \xD7 column-set rectangle, even when those sets are noncontiguous. Each selected pair of diagonal positives requires both crosscells positive; at least one is a literal forbidden zero, so one term cannot cover that pair.", children: [
    /* @__PURE__ */ jsxs12(Panels, { children: [
      /* @__PURE__ */ jsxs12("div", { className: "nmf-plot", children: [
        /* @__PURE__ */ jsx14("p", { className: "nmf-object-label", children: "Four persistent diagonal witnesses" }),
        /* @__PURE__ */ jsxs12("svg", { viewBox: "0 0 300 300", role: "img", "aria-label": `Selected diagonal(${a},${a}) and(${b},${b}); forbidden crosszero(${zero.join(",")})`, children: [
          cycle.flatMap((r, i) => r.map((v, j) => /* @__PURE__ */ jsxs12("g", { children: [
            /* @__PURE__ */ jsx14("rect", { x: 45 + j * 55, y: 35 + i * 55, width: "50", height: "50", fill: v ? "#30475f" : "#101923", stroke: i === j ? "white" : cross.some(([x, y]) => x === i && y === j) ? "#f2c276" : "#536578", strokeWidth: i === j || cross.some(([x, y]) => x === i && y === j) ? 3 : 1 }),
            /* @__PURE__ */ jsx14("text", { x: 70 + j * 55, y: 65 + i * 55, textAnchor: "middle", children: v }),
            v === 0 && cross.some(([x, y]) => x === i && y === j) && /* @__PURE__ */ jsx14("path", { d: `M${45 + j * 55} ${35 + i * 55}l50 50m-50 0l50-50`, stroke: "#f2c276" })
          ] }, `${i}${j}`))),
          [0, 1, 2, 3].map((i) => /* @__PURE__ */ jsxs12("g", { children: [
            /* @__PURE__ */ jsxs12("text", { x: "5", y: 65 + i * 55, children: [
              "R",
              i
            ] }),
            /* @__PURE__ */ jsxs12("text", { x: 65 + i * 55, y: "20", children: [
              "F",
              i
            ] })
          ] }, i))
        ] })
      ] }),
      /* @__PURE__ */ jsx14(Matrix, { label: "Actual noncontiguous outer product u v\u1D40", values: [[0, 3, 0, 4], [0, 0, 0, 0], [0, 6, 0, 8], [0, 0, 0, 0]], max: 8 }),
      /* @__PURE__ */ jsx14(Matrix, { label: "u and v support operands", values: [[1, 0, 2, 0], [0, 3, 0, 4]], rows: ["u row set{0,2}", "v column set{1,3}"] })
    ] }),
    /* @__PURE__ */ jsx14(Controls, { onReset: () => setSelected("0"), children: /* @__PURE__ */ jsx14(Select, { label: "First diagonal witness", value: selected, onChange: setSelected, options: [0, 1, 2, 3].map((i) => ({
      value: String(i),
      label: `(${i},${i})`
    })) }) }),
    /* @__PURE__ */ jsxs12(Result, { children: [
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
  return /* @__PURE__ */ jsxs12(Figure, { id: "D52", caption: "A determinant1 triangular minor proves ordinary rank\u22653, and signed row dependence proves\u22643. Four separated diagonal support witnesses require nonnegative rank\u22654; I4\xD7X provides its upper bound4. Filling zeros changes the support premise and does not establish a new rank.", children: [
    /* @__PURE__ */ jsxs12(Panels, { children: [
      /* @__PURE__ */ jsx14(Matrix, { label: "Four-cycle X", values: cycle }),
      /* @__PURE__ */ jsx14(Matrix, { label: "Top-left triangular minor \xB7 determinant1", values: cycle.slice(0, 3).map((r) => r.slice(0, 3)) }),
      /* @__PURE__ */ jsx14(Matrix, { label: "Signed row coefficients \u2192 exact zero combination", values: [[1, -1, 1, -1], [0, 0, 0, 0]], rows: ["Coefficients across R0\u2026R3", "Weighted row sum"], signed: true }),
      /* @__PURE__ */ jsx14(Matrix, { label: "Nonnegative left factor I4", values: identity }),
      /* @__PURE__ */ jsx14(Matrix, { label: "I4 \xD7 X = X \xB7 upper bound4", values: matmul(identity, cycle) }),
      /* @__PURE__ */ jsx14(Matrix, { label: "Changed premise \xB7 X+.1\xD7ones", values: cycle.map((r) => r.map((v) => v + 0.1)) })
    ] }),
    /* @__PURE__ */ jsx14("p", { children: "Ordinary rank3; nonnegative rank4. The changed positive inset has no forbidden support zeros; its nonnegative rank is not asserted here." })
  ] });
}
function NormalizeMixture() {
  const [a, setA] = scenarioState(2), unit = [a / (a + 1), 1 / (a + 1)];
  return /* @__PURE__ */ jsxs12(Figure, { id: "D53", caption: "Divide an actual nonzero mixture by its row mass to intersect the unit-sum slice. The resulting coefficients are fractions of modeled intensity, rather than class probabilities. An all-zero row has no direction and is excluded.", children: [
    /* @__PURE__ */ jsxs12(Panels, { children: [
      /* @__PURE__ */ jsx14(Plot, { label: "Original cone point", xmax: 3, ymax: 3, children: (map) => /* @__PURE__ */ jsxs12(Fragment7, { children: [
        /* @__PURE__ */ jsx14(Arrow, { from: map([0, 0]), to: map([a, 1]) }),
        /* @__PURE__ */ jsx14(Point, { at: map([a, 1]), label: "x" })
      ] }) }),
      /* @__PURE__ */ jsx14(Plot, { label: "Normalized point \xB7 sum1 slice", xmax: 1, ymax: 1, children: (map) => /* @__PURE__ */ jsxs12(Fragment7, { children: [
        /* @__PURE__ */ jsx14("path", { d: `M${map([1, 0]).join(" ")}L${map([0, 1]).join(" ")}`, stroke: colors2[1], strokeWidth: "2" }),
        /* @__PURE__ */ jsx14(Point, { at: map([1, 0]), label: "P0" }),
        /* @__PURE__ */ jsx14(Point, { at: map([0, 1]), label: a === 0 ? "P1 / x" : "P1", color: colors2[1] }),
        a !== 0 && /* @__PURE__ */ jsx14(Point, { at: map(unit), label: "x/mass", color: "#f2c276" })
      ] }) }),
      /* @__PURE__ */ jsx14(Matrix, { label: "Actual row divided by its mass", values: [[a, 1], unit], rows: ["Original", "Normalized"] }),
      /* @__PURE__ */ jsx14(Matrix, { label: "Static all-zero inset \xB7 undefined direction", values: [[0, 0], ["excluded", "excluded"]], rows: ["Zero row", "Normalization"] })
    ] }),
    /* @__PURE__ */ jsx14(Controls, { onReset: () => setA(2), children: /* @__PURE__ */ jsx14(Range, { label: "First mixture amount a", value: a, onChange: setA, max: 3, step: 0.05 }) }),
    /* @__PURE__ */ jsxs12(Result, { children: [
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
  return /* @__PURE__ */ jsxs12(Figure, { id: "D54", caption: "The pure patterns A0/A1 are actually observed rows; M0/M1 and a separately shaped query lie on their hull. Full-rank/separability assumptions supply the anchor argument. A query at an endpoint adds no new direction.", children: [
    /* @__PURE__ */ jsxs12(Panels, { children: [
      /* @__PURE__ */ jsx14(Plot, { label: "Observed hull and new query", xmax: 1, ymax: 1, children: (map) => /* @__PURE__ */ jsxs12(Fragment7, { children: [
        /* @__PURE__ */ jsx14("path", { d: `M${map([1, 0]).join(" ")}L${map([0, 1]).join(" ")}`, stroke: "currentColor", opacity: ".5" }),
        normalizedRows.map((r, i) => /* @__PURE__ */ jsx14(Point, { at: map(r), label: ["A0", "A1", "M0", "M1"][i], color: i < 2 ? colors2[i] : "#aab6c7" }, i)),
        (() => {
          const p = map([t, 1 - t]);
          return /* @__PURE__ */ jsx14("path", { d: `M${p[0]} ${p[1] - 6}l6 6l-6 6l-6-6Z`, fill: "none", stroke: "#f2c276", strokeWidth: "2" });
        })()
      ] }) }),
      /* @__PURE__ */ jsx14(Matrix, { label: "Actual observed rows \xB7 original IDs", values: normalizedRows, rows: ["ID0 A0", "ID1 A1", "ID2 M0", "ID3 M1"] })
    ] }),
    /* @__PURE__ */ jsx14(Controls, { onReset: () => setT(0.25), children: /* @__PURE__ */ jsx14(Range, { label: "New query first amount t", value: t, onChange: setT, max: 1, step: 0.02 }) }),
    /* @__PURE__ */ jsxs12(Result, { children: [
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
  return /* @__PURE__ */ jsxs12(Figure, { id: "D55", caption: "Select largest residual squared norm, with original normalized norm then global ID breaking ties. Projection removes a span; the length and squared length are separate quantities. Signed residuals are not clipped back into nonnegativity.", children: [
    /* @__PURE__ */ jsxs12(Panels, { children: [
      /* @__PURE__ */ jsx14(Plot, { label: "Original observations and current residual directions", xmax: 1, ymax: 1, children: (map) => /* @__PURE__ */ jsxs12(Fragment7, { children: [
        normalizedRows.map((r, i) => /* @__PURE__ */ jsx14(Arrow, { from: map([0, 0]), to: map(r), color: "#687586", dashed: true }, `old${i}`)),
        step === 2 ? /* @__PURE__ */ jsx14(Point, { at: map([0, 0]), label: "IDs0\u20133" }) : residuals.map((r, i) => /* @__PURE__ */ jsxs12("g", { children: [
          norm2(r) > 0 && /* @__PURE__ */ jsx14(Arrow, { from: map([0, 0]), to: map(r), color: colors2[i % 2] }),
          /* @__PURE__ */ jsx14(Point, { at: map(r), label: `ID${i}`, color: colors2[i % 2] })
        ] }, i))
      ] }) }),
      /* @__PURE__ */ jsx14(Matrix, { label: "Current exact residual rows", values: residuals }),
      /* @__PURE__ */ jsx14(Matrix, { label: "Length versus selection squared norm", values: lengths.map((v, i) => [v, norm2(residuals[i])]), columns: ["Length", "Squared length"] }),
      /* @__PURE__ */ jsx14(Matrix, { label: "Duplicate/zero ID case \xB7 selected7 then42", values: [[42, 1, 0], [7, 0, 1], [99, 0.75, 0.25], [10, 0, 1], [6, 0, 0]], columns: ["Global ID", "F0", "F1"] }),
      /* @__PURE__ */ jsx14(Matrix, { label: "Separate recorded signed-projection example", values: [[0, 0], [-0.176470588235294, 0.7058823529411765], [-0.08823529411764697, 0.35294117647058826]], signed: true, max: 1 })
    ] }),
    /* @__PURE__ */ jsxs12(Controls, { onReset: () => setStep(0), children: [
      /* @__PURE__ */ jsx14("button", { disabled: step === 0, onClick: () => setStep(step - 1), children: "Back" }),
      /* @__PURE__ */ jsx14("button", { disabled: step === 2, onClick: () => setStep(step + 1), children: "Step" })
    ] }),
    /* @__PURE__ */ jsxs12(Result, { children: [
      ["Initial squared norms1,1,.625,.625; global ID0 wins the tie.", "After A0 projection: lengths0,1,.25,.75; squared norms0,1,.0625,.5625. A1 is next.", "After A1 projection all residuals are zero; two independent directions are exhausted."][step],
      " Duplicate ID10 does not supply a new direction; zero ID6 is excluded."
    ] })
  ] });
}
function Conditioning() {
  const [e, setE] = scenarioState(0.1), p = [1 - e, e];
  return /* @__PURE__ */ jsxs12(Figure, { id: "D56", caption: "Nearly parallel endmembers give nearly coincident mixtures. The separate fixed magnified inset uses its own .98\u20261 /0\u2026.02 rulers and a static small perturbation; it is not an empirical noise bound or a change to the main axes.", children: [
    /* @__PURE__ */ jsxs12(Panels, { children: [
      /* @__PURE__ */ jsx14(Plot, { label: "Current complete unit-sum geometry", xmax: 1, ymax: 1, children: (map) => /* @__PURE__ */ jsxs12(Fragment7, { children: [
        /* @__PURE__ */ jsx14(Arrow, { from: map([0, 0]), to: map([1, 0]) }),
        /* @__PURE__ */ jsx14(Arrow, { from: map([0, 0]), to: map(p), color: colors2[1] }),
        [[[1, 0], "P0", colors2[0]], [p, "P1", colors2[1]], [[1 - e / 2, e / 2], "mix", "#aab6c7"]].map(([point, label, color], i) => {
          const at = map(point), y = 75 + i * 35;
          return /* @__PURE__ */ jsxs12("g", { children: [
            /* @__PURE__ */ jsx14(Point, { at, color }),
            /* @__PURE__ */ jsx14("path", { d: `M${at.join(" ")}L100 ${y}`, fill: "none", stroke: color, strokeDasharray: "3 3" }),
            /* @__PURE__ */ jsx14("text", { x: "65", y, fill: color, children: label })
          ] }, label);
        })
      ] }) }),
      /* @__PURE__ */ jsx14(Plot, { label: "Static magnified noise illustration \xB7 epsilon.01", xmin: 0.98, xmax: 1, ymin: 0, ymax: 0.02, children: (map) => /* @__PURE__ */ jsxs12(Fragment7, { children: [
        /* @__PURE__ */ jsx14(Point, { at: map([1, 0]), label: "P0" }),
        /* @__PURE__ */ jsx14(Point, { at: map([0.99, 0.01]), label: "P1", color: colors2[1] }),
        /* @__PURE__ */ jsx14(Point, { at: map([0.988, 0.012]), label: "perturbed", color: "#f2c276" })
      ] }) }),
      /* @__PURE__ */ jsx14(Matrix, { label: "Current endmembers and midpoint", values: [[1, 0], p, [1 - e / 2, e / 2]], rows: ["P0", "P1", "Mixture"] })
    ] }),
    /* @__PURE__ */ jsx14(Controls, { onReset: () => setE(0.1), children: /* @__PURE__ */ jsx14(Range, { label: "Endmember separation epsilon", value: e, onChange: setE, max: 1, step: 0.01 }) }),
    /* @__PURE__ */ jsxs12(Result, { children: [
      "Separation \u221A2\u03B5=",
      fmt(Math.SQRT2 * e),
      ", angle atan2(\u03B5,1\u2212\u03B5)=",
      fmt(Math.atan2(e, 1 - e)),
      " radians. ",
      e === 0 ? "Coincident patterns: independent-direction rank request refused." : "Separation alone does not give a universal noisy recovery guarantee."
    ] })
  ] });
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/TransferFigures.jsx
import React9, { useState as useState9 } from "react";
import { Fragment as Fragment8, jsx as jsx15, jsxs as jsxs13 } from "react/jsx-runtime";
function WordCounts() {
  const docs = ["orbit rocket orbit", "rocket orbit rocket", "goal team goal", "team goal team", "orbit rocket goal team"], vocabulary = ["goal", "orbit", "rocket", "team"];
  return /* @__PURE__ */ jsxs13(Figure, { id: "D57", caption: "Repeated occurrences enter the same vocabulary column. Two orbit tokens in document0 become its orbit count2. The patterns and amounts below are rounded values from the preserved original count/KL experiment, in its original component order.", children: [
    /* @__PURE__ */ jsx15("div", { className: "nmf-token-rows", children: docs.map((d, i) => /* @__PURE__ */ jsxs13("p", { children: [
      /* @__PURE__ */ jsxs13("strong", { children: [
        "Document",
        i,
        ": "
      ] }),
      d.split(" ").map((word, j) => /* @__PURE__ */ jsxs13("span", { className: "nmf-token", style: {
        borderColor: colors2[vocabulary.indexOf(word)]
      }, children: [
        word,
        " \u2192 ",
        word === "orbit" && i === 0 ? "R0 orbit cell" : word + " column",
        " "
      ] }, j))
    ] }, i)) }),
    /* @__PURE__ */ jsxs13(Panels, { children: [
      /* @__PURE__ */ jsx15(Matrix, { label: "Observed token counts \xB7 word identities", values: [[0, 2, 1, 0], [0, 1, 2, 0], [2, 0, 0, 1], [1, 0, 0, 2], [1, 1, 1, 1]], columns: vocabulary, max: 2 }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Rounded unit-row-sum word patterns", values: [[0.5, 0, 0, 0.5], [0, 0.5, 0.5, 0]], rows: ["C0", "C1"], columns: vocabulary, componentRows: true, max: 1 }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Mixed-document amount \xD7 full pattern \u2192 sum", values: [[1, 0, 0, 1], [0, 1, 1, 0], [1, 1, 1, 1]], rows: ["2\xD7C0", "2\xD7C1", "Sum"], columns: vocabulary, max: 2 })
    ] }),
    /* @__PURE__ */ jsx15("p", { children: "Amounts[2,2] sum4 token occurrences, rather than1. Word identity and pattern identity have different roles; this is not a topic posterior." })
  ] });
}
function FrozenIDF() {
  const [a, setA] = scenarioState(2), idf = [1 + Math.log(2), 1 + Math.log(4 / 3), 1 + Math.log(4 / 3)], counts = [[2, 1, 0], [0, 1, 1], [0, 0, 2]], query = [a, 1, 0], weighted = query.map((v, j) => v * idf[j]), base = [2 * idf[0], idf[1], 0], length = Math.hypot(...base);
  return /* @__PURE__ */ jsxs13(Figure, { id: "D58", caption: "This new three-column corpus fixes its vocabulary and IDF on training rows. Query edits change occurrences, never document frequencies or IDF. The separate unit-length inset changes representation; the live weighted row keeps norm=None.", children: [
    /* @__PURE__ */ jsxs13(Panels, { children: [
      /* @__PURE__ */ jsx15(Matrix, { label: "New training counts", values: counts, columns: ["orbit", "rocket", "team"] }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Training document presence \u2192 df \u2192 fixed IDF", values: [[1, 1, 0], [0, 1, 1], [0, 0, 1], [1, 2, 2], idf], rows: ["Doc0 presence", "Doc1 presence", "Doc2 presence", "df", "IDF"], columns: ["orbit", "rocket", "team"] }),
      /* @__PURE__ */ jsx15(Bars, { label: "Current query counts \xB7 occurrence units", values: query, ids: ["orbit", "rocket", "team"], max: 4 }),
      /* @__PURE__ */ jsx15(Bars, { label: "Current weighted query \xB7 weight units", values: weighted, ids: ["orbit", "rocket", "team"], max: 7 }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Static all-OOV planet \u2192 zero retained row", values: [[0, 0, 0]], columns: ["orbit", "rocket", "team"] }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Static default row / Euclidean length \xB7 different representation", values: [base, base.map((v) => v / length)], rows: ["Default weighted", "Unit length"], columns: ["orbit", "rocket", "team"] })
    ] }),
    /* @__PURE__ */ jsx15(Controls, { onReset: () => setA(2), children: /* @__PURE__ */ jsx15(Range, { label: "Orbit occurrences in this query", value: a, onChange: setA, max: 4, step: 1 }) }),
    /* @__PURE__ */ jsxs13(Result, { children: [
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
  return /* @__PURE__ */ jsxs13(Figure, { id: "D59", caption: "Constructed band responses: the cone allows arbitrary nonnegative amounts, while the segment requires them to sum1. The plot is a bands0/1 projection; the complete third band remains in the arrays and full3D half-loss. The open blue diamond is the query; the amber circle is the simplex prediction. No calibrated physical material is claimed.", children: [
    /* @__PURE__ */ jsxs13(Panels, { children: [
      /* @__PURE__ */ jsx15(Plot, { label: "Fixed cone rays and sum-one segment \xB7 bands0/1", xmax: 4, ymax: 4, xlabel: "Band0", ylabel: "Band1", children: (map) => /* @__PURE__ */ jsxs13(Fragment8, { children: [
        /* @__PURE__ */ jsx15(Arrow, { from: map([0, 0]), to: map([3.5, 0]) }),
        /* @__PURE__ */ jsx15(Arrow, { from: map([0, 0]), to: map([0, 3.5]), color: colors2[1] }),
        /* @__PURE__ */ jsx15("path", { d: `M${map([1, 0]).join(" ")}L${map([0, 1]).join(" ")}`, stroke: "#f2c276", strokeWidth: "3" }),
        /* @__PURE__ */ jsx15(Point, { at: map(query.slice(0, 2)), diamond: true, open: true }),
        /* @__PURE__ */ jsx15(Point, { at: map(prediction.slice(0, 2)), label: "simplex", color: "#f2c276" })
      ] }) }),
      /* @__PURE__ */ jsx15(Bars, { label: "Query \xB7 three band intensities", values: query, ids: ["Band0", "Band1", "Band2"], max: 6 }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Amounts and complete predictions", values: [[...cone, "\u2014"], query, [...simplex, "\u2014"], prediction, residual], rows: ["Cone C0/C1", "Cone prediction", "Simplex C0/C1", "Simplex prediction", "Simplex residual"], signed: true, max: 6 }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Static gain1 normalize-after-NNLS comparison", values: [[2 / 3, 1 / 3, "\u2014"], [2 / 3, 1 / 3, 1]], rows: ["Normalized amounts", "Changed prediction"] })
    ] }),
    /* @__PURE__ */ jsx15(Controls, { onReset: () => setG(1), children: /* @__PURE__ */ jsx15(Range, { label: "Common query gain g", value: g, onChange: setG, min: 0.5, max: 2, step: 0.05 }) }),
    /* @__PURE__ */ jsxs13(Result, { children: [
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
  return /* @__PURE__ */ jsxs13(Figure, { id: "D60", caption: "Two modeled explanations have the same complete constructed response[2,3,3] and zero residual. Calibration, independently validated endmembers and a justified mixing law are additional evidence; zero residual does not provide them.", children: [
    /* @__PURE__ */ jsx15(Panels, { children: [[h, [2, 1], "Original modeled lane"], [changed, [2, 2], "Changed modeled lane"]].map(([dictionary, w, label]) => /* @__PURE__ */ jsxs13("div", { children: [
      /* @__PURE__ */ jsx15(Matrix, { label: `${label} \xB7 patterns`, values: dictionary, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Amounts \xD7 patterns \u2192 complete addends and sum", values: [[...w, "\u2014"], dictionary[0].map((v) => v * w[0]), dictionary[1].map((v) => v * w[1]), matmul([w], dictionary)[0], [0, 0, 0]], rows: ["C0/C1 amounts", "C0 addend", "C1 addend", "Modeled response", "Residual"], max: 3 })
    ] }, label)) }),
    /* @__PURE__ */ jsx15(Bars, { label: "One constructed candidate response \xB7 band units", values: [2, 3, 3], max: 3 }),
    /* @__PURE__ */ jsx15("p", { children: "Additional evidence, not supplied by zero residual: instrument calibration; pure-material measurements; a defensible mixing law; independent source validation." })
  ] });
}
var oldA = [[4, 2], [2, 1]];
var oldB = [[4, 2, 6], [2, 1, 3]];
var deltaA = [[0, 0], [0, 4]];
var deltaB = [[0, 0, 0], [0, 4, 4]];
function OnlineStatistics() {
  return /* @__PURE__ */ jsx15(Figure, { id: "D61", caption: "Each historical encoding contributes an outer product to A and a code\xD7observation product to B. These exact products expose the compact surrogate without implying that all earlier rows are retained or freshly re-encoded.", children: [{ name: "Historical", x: [2, 1, 3], w: [2, 1], a: oldA, b: oldB }, { name: "Incoming fixed-H", x: [0, 2, 2], w: [0, 2], a: deltaA, b: deltaB }].map(({ name, x, w, a, b }) => /* @__PURE__ */ jsxs13("div", { children: [
    /* @__PURE__ */ jsxs13("h4", { children: [
      name,
      " row contribution"
    ] }),
    /* @__PURE__ */ jsxs13(Operation, { label: `${name} code column outer code row produces A`, children: [
      /* @__PURE__ */ jsx15(Matrix, { label: `${name} code column w\u1D40`, values: w.map((v) => [v]), rows: ["C0", "C1"], componentRows: true, selected: [0, 0] }),
      /* @__PURE__ */ jsx15(Port, { label: "outer product \xD7 code row w" }),
      /* @__PURE__ */ jsx15(Matrix, { label: `${name} code row w`, values: [w], columns: ["C0", "C1"], componentColumns: true, selected: [0, 1] }),
      /* @__PURE__ */ jsx15(Port, { label: `A01 = ${w[0]}\xD7${w[1]} = ${a[0][1]}` }),
      /* @__PURE__ */ jsx15(Matrix, { label: `${name} A contribution`, values: a, rows: ["C0", "C1"], columns: ["C0", "C1"], selected: [0, 1] })
    ] }),
    /* @__PURE__ */ jsxs13(Operation, { label: `${name} code column outer observation row produces B`, children: [
      /* @__PURE__ */ jsx15(Matrix, { label: `${name} code column w\u1D40`, values: w.map((v) => [v]), rows: ["C0", "C1"], componentRows: true, selected: [0, 0] }),
      /* @__PURE__ */ jsx15(Port, { label: "outer product \xD7 observation x" }),
      /* @__PURE__ */ jsx15(Matrix, { label: `${name} observation row x`, values: [x], columns: ["F0", "F1", "F2"], selected: [0, 2] }),
      /* @__PURE__ */ jsx15(Port, { label: `B02 = ${w[0]}\xD7${x[2]} = ${b[0][2]}` }),
      /* @__PURE__ */ jsx15(Matrix, { label: `${name} B contribution`, values: b, rows: ["C0", "C1"], columns: ["F0", "F1", "F2"], selected: [0, 2] })
    ] })
  ] }, name)) });
}
function Retention() {
  const [rho, setRho] = scenarioState(1), a = add(scale(oldA, rho), deltaA), b = add(scale(oldB, rho), deltaB);
  return /* @__PURE__ */ jsxs13(Figure, { id: "D62", caption: "For this nonempty batch, old statistics receive retention\u03C1 and the incoming products enter once. Empty batch is a no-op. At\u03C10 the old statistics vanish while the existing dictionary is not reset.", children: [
    /* @__PURE__ */ jsxs13(Operation, { label: "Retain old A, add incoming A once, publish new A", children: [
      /* @__PURE__ */ jsx15(Matrix, { label: "Old A", values: oldA, rows: ["C0", "C1"], columns: ["C0", "C1"], selected: [1, 1] }),
      /* @__PURE__ */ jsx15(Port, { label: `\xD7 \u03C1=${fmt(rho)}` }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Retained old A \xB7 \u03C1 Aold", values: scale(oldA, rho), selected: [1, 1], rows: ["C0", "C1"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx15(Port, { label: "+ incoming \u0394A", symbol: "+" }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Incoming \u0394A \xB7 unscaled", values: deltaA, selected: [1, 1], rows: ["C0", "C1"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx15(Port, { label: `A11: ${fmt(rho)}\xD71+4=${fmt(a[1][1])}` }),
      /* @__PURE__ */ jsx15(Matrix, { label: "New A", values: a, selected: [1, 1], rows: ["C0", "C1"], columns: ["C0", "C1"] })
    ] }),
    /* @__PURE__ */ jsxs13(Operation, { label: "Retain old B, add incoming B once, publish new B", children: [
      /* @__PURE__ */ jsx15(Matrix, { label: "Old B", values: oldB, rows: ["C0", "C1"], selected: [1, 1] }),
      /* @__PURE__ */ jsx15(Port, { label: `\xD7 \u03C1=${fmt(rho)}` }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Retained old B \xB7 \u03C1 Bold", values: scale(oldB, rho), selected: [1, 1], rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx15(Port, { label: "+ incoming \u0394B", symbol: "+" }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Incoming \u0394B \xB7 unscaled", values: deltaB, selected: [1, 1], rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx15(Port, { label: `B11: ${fmt(rho)}\xD71+4=${fmt(b[1][1])}` }),
      /* @__PURE__ */ jsx15(Matrix, { label: "New B", values: b, selected: [1, 1], rows: ["C0", "C1"] })
    ] }),
    /* @__PURE__ */ jsxs13("div", { className: "nmf-lifetime nmf-lifetime--retained", children: [
      /* @__PURE__ */ jsx15("h4", { children: "Dictionary lifetime is separate from old-statistic retention" }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Existing dictionary \xB7 retained even at\u03C10", values: H0, rows: ["C0", "C1"], componentRows: true }),
      /* @__PURE__ */ jsx15("p", { children: "Empty batch bypasses both operations above: Aold \u2192 Aold, Bold \u2192 Bold, H \u2192 H. It does not apply retention without incoming data." })
    ] }),
    /* @__PURE__ */ jsx15(Controls, { onReset: () => setRho(1), children: /* @__PURE__ */ jsx15(Range, { label: "Old-statistic retention \u03C1", value: rho, onChange: setRho, max: 1 }) }),
    /* @__PURE__ */ jsxs13(Result, { children: [
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
  return /* @__PURE__ */ jsxs13(Figure, { id: "D63", caption: "Changing the current dictionary does not retroactively change stored encodings. A/B keep historical code products; a new fixed-H encoding answers a different current-dictionary question.", children: [
    /* @__PURE__ */ jsxs13(Panels, { children: [
      /* @__PURE__ */ jsx15(Matrix, { label: "Current edited dictionary", values: s.dictionary, rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Historical A \xB7 unchanged", values: [[4, 2], [2, 5]], rows: ["C0", "C1"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Historical B \xB7 unchanged", values: [[4, 2, 6], [2, 5, 7]], rows: ["C0", "C1"] }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Old versus freshly solved first-row amounts", values: [[2, 1], s.w], rows: ["Stored codes", "Fresh codes"], columns: ["C0", "C1"] }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Actual first-row predictions", values: [[2, 1, 3], s.oldPrediction, s.freshPrediction], rows: ["Observation", "Stored-code prediction", "Fresh-code prediction"] }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Second row remains exact", values: [[0, 2, 2], [0, 2, 2]], rows: ["Observation", "Prediction"] })
    ] }),
    /* @__PURE__ */ jsx15(Controls, { onReset: () => setH(1), children: /* @__PURE__ */ jsx15(Range, { label: "Current H[C0,F0]", value: h, onChange: setH, min: 1, max: 2, step: 0.05 }) }),
    /* @__PURE__ */ jsxs13(Result, { children: [
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
  return /* @__PURE__ */ jsxs13(Figure, { id: "D64", caption: "Named axes are observation i, feature j and time t. A complete rank-one tensor retains its zero feature plane. The declared j-major/t-minor unfolding uses column2j+t, so its inverse maps each cell back without loss.", children: [
    /* @__PURE__ */ jsxs13(Operation, { label: "Selected three-mode factor cells multiply into voxel (1,0,1)", children: [
      /* @__PURE__ */ jsx15(Matrix, { label: "Observation factor a_i \xB7 selected i1", values: [[1], [2]], rows: ["i0", "i1"], selected: [1, 0] }),
      /* @__PURE__ */ jsx15(Port, { label: "a1=2 \xD7 b0=1", symbol: "\xD7" }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Feature factor b_j \xB7 selected j0", values: [[1], [0]], rows: ["j0", "j1"], selected: [0, 0] }),
      /* @__PURE__ */ jsx15(Port, { label: "\xD7 c1=3", symbol: "\xD7" }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Time factor c_t \xB7 selected t1", values: [[1], [3]], rows: ["t0", "t1"], selected: [1, 0] }),
      /* @__PURE__ */ jsx15(Port, { label: "2\xD71\xD73=6 at (i1,j0,t1)" }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Tensor time t1 \xB7 i\xD7j slice", values: [[3, 0], [6, 0]], rows: ["i0", "i1"], columns: ["j0", "j1"], selected: [1, 0] })
    ] }),
    /* @__PURE__ */ jsxs13(Operation, { label: "Voxel address maps to the declared unfolding address", children: [
      /* @__PURE__ */ jsx15(Matrix, { label: "Selected voxel T[1,0,1]", values: [[6]] }),
      /* @__PURE__ */ jsx15(Port, { label: "row i=1; column2j+t=1" }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Unfolding \xB7 j-major/t-minor", values: [[1, 3, 0, 0], [2, 6, 0, 0]], rows: ["i0", "i1"], columns: ["j0t0", "j0t1", "j1t0", "j1t1"], selected: [1, 1] }),
      /* @__PURE__ */ jsx15(Port, { label: "inverse: j=floor(1/2)=0; t=1 mod2=1" }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Recovered address and value", values: [[1, 0, 1, 6]], columns: ["i", "j", "t", "T value"] })
    ] }),
    /* @__PURE__ */ jsx15(Matrix, { label: "Tensor time t0 \xB7 entire companion slice retained", values: [[1, 0], [2, 0]], rows: ["i0", "i1"], columns: ["j0", "j1"] }),
    /* @__PURE__ */ jsx15("p", { children: "The entire j1 feature plane remains zero, rather than disappearing." })
  ] });
}
function TensorAnatomy() {
  return /* @__PURE__ */ jsxs13(Figure, { id: "D65", caption: "CP rank1 and Tucker rank(1,1,1) with scalar core1 reconstruct the same rank-one example. A separate identity-factor core example isolates a single core interaction; it is a different anatomy example, without a fitted tensor optimizer.", children: [
    /* @__PURE__ */ jsxs13(Operation, { label: "CP rank1 connects one common component across three named modes", children: [
      /* @__PURE__ */ jsx15(Matrix, { label: "Observation mode factor a \xB7 i\xD7C0", values: [[1], [2]], rows: ["i0", "i1"], columns: ["C0"] }),
      /* @__PURE__ */ jsx15(Port, { label: "same CP component C0" }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Feature mode factor b \xB7 j\xD7C0", values: [[1], [0]], rows: ["j0", "j1"], columns: ["C0"] }),
      /* @__PURE__ */ jsx15(Port, { label: "outer product across i/j/t" }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Time mode factor c \xB7 t\xD7C0", values: [[1], [3]], rows: ["t0", "t1"], columns: ["C0"] }),
      /* @__PURE__ */ jsx15(Port, { label: "T_ijt = a_i b_j c_t" }),
      /* @__PURE__ */ jsxs13("div", { children: [
        /* @__PURE__ */ jsx15(Matrix, { label: "CP time0 slice", values: [[1, 0], [2, 0]], rows: ["i0", "i1"], columns: ["j0", "j1"] }),
        /* @__PURE__ */ jsx15(Matrix, { label: "CP time1 slice", values: [[3, 0], [6, 0]], rows: ["i0", "i1"], columns: ["j0", "j1"] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs13(Operation, { label: "Tucker scalar core connects three distinct latent mode ports", children: [
      /* @__PURE__ */ jsx15(Matrix, { label: "Core G000=1 \xB7 latent p0/q0/r0", values: [[1]] }),
      /* @__PURE__ */ jsx15(Port, { label: "p0 \u2192 observation a_i0; q0 \u2192 feature b_j0; r0 \u2192 time c_t0" }),
      /* @__PURE__ */ jsxs13("div", { children: [
        /* @__PURE__ */ jsx15(Matrix, { label: "Observation mode \xB7 i\xD7p0", values: [[1], [2]], columns: ["p0"], rows: ["i0", "i1"] }),
        /* @__PURE__ */ jsx15(Matrix, { label: "Feature mode \xB7 j\xD7q0", values: [[1], [0]], columns: ["q0"], rows: ["j0", "j1"] }),
        /* @__PURE__ */ jsx15(Matrix, { label: "Time mode \xB7 t\xD7r0", values: [[1], [3]], columns: ["r0"], rows: ["t0", "t1"] })
      ] }),
      /* @__PURE__ */ jsx15(Port, { label: "sum core-weighted mode products" }),
      /* @__PURE__ */ jsxs13("div", { children: [
        /* @__PURE__ */ jsx15(Matrix, { label: "CP and Tucker time0 slice \xB7 same product", values: [[1, 0], [2, 0]], rows: ["i0", "i1"], columns: ["j0", "j1"] }),
        /* @__PURE__ */ jsx15(Matrix, { label: "CP and Tucker time1 slice \xB7 same product", values: [[3, 0], [6, 0]], rows: ["i0", "i1"], columns: ["j0", "j1"] })
      ] })
    ] }),
    /* @__PURE__ */ jsx15("h4", { children: "Separate identity-factor core interaction \xB7 different example" }),
    /* @__PURE__ */ jsxs13(Operation, { label: "One core address connects through one cell in each identity mode factor", children: [
      /* @__PURE__ */ jsx15(Matrix, { label: "Core time r0 \xB7 sole G[0,1,0]=2", values: [[0, 2], [0, 0]], rows: ["p0", "p1"], columns: ["q0", "q1"], selected: [0, 1] }),
      /* @__PURE__ */ jsx15(Port, { label: "core value2 \xD7 three addressed factors" }),
      /* @__PURE__ */ jsxs13("div", { children: [
        /* @__PURE__ */ jsx15(Matrix, { label: "Observation factor \xB7 i\xD7p \xB7 use I[0,0]=1", values: [[1, 0], [0, 1]], rows: ["i0", "i1"], columns: ["p0", "p1"], selected: [0, 0] }),
        /* @__PURE__ */ jsx15(Matrix, { label: "Feature factor \xB7 j\xD7q \xB7 use I[1,1]=1", values: [[1, 0], [0, 1]], rows: ["j0", "j1"], columns: ["q0", "q1"], selected: [1, 1] }),
        /* @__PURE__ */ jsx15(Matrix, { label: "Time factor \xB7 t\xD7r \xB7 use I[0,0]=1", values: [[1, 0], [0, 1]], rows: ["t0", "t1"], columns: ["r0", "r1"], selected: [0, 0] })
      ] }),
      /* @__PURE__ */ jsx15(Port, { label: "2\xD71\xD71\xD71=2 at (i0,j1,t0)" }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Tensor time t0 \xB7 sole T[0,1,0]=2", values: [[0, 2], [0, 0]], rows: ["i0", "i1"], columns: ["j0", "j1"], selected: [0, 1] })
    ] }),
    /* @__PURE__ */ jsxs13(Panels, { children: [
      /* @__PURE__ */ jsx15(Matrix, { label: "Separate core time r1 slice \xB7 all zero", values: [[0, 0], [0, 0]], rows: ["p0", "p1"], columns: ["q0", "q1"] }),
      /* @__PURE__ */ jsx15(Matrix, { label: "Separate tensor time t1 slice \xB7 all zero", values: [[0, 0], [0, 0]], rows: ["i0", "i1"], columns: ["j0", "j1"] })
    ] }),
    /* @__PURE__ */ jsx15("p", { children: "General core dimensions and cross-component interactions require their own decomposition scope." })
  ] });
}
function Phase() {
  return /* @__PURE__ */ jsx15(Figure, { id: "D66", caption: "These two finite DFT coefficient lists have identical magnitudes but opposite k1 phase. Under inverse normalization1/2 they produce opposite two-sample waveforms. Magnitude alone cannot select which original phase occurred; no audio experiment or STFT inversion is performed.", children: /* @__PURE__ */ jsxs13(Panels, { children: [
    /* @__PURE__ */ jsx15(Plot, { label: "k1 DFT coefficient \xB7 real/imaginary plane", xmin: -1, xmax: 1, ymin: -1, ymax: 1, xlabel: "Real", ylabel: "Imaginary", children: (map) => /* @__PURE__ */ jsxs13(Fragment8, { children: [
      /* @__PURE__ */ jsx15(Arrow, { from: map([0, 0]), to: map([1, 0]) }),
      /* @__PURE__ */ jsx15(Arrow, { from: map([0, 0]), to: map([-1, 0]), color: colors2[1] }),
      /* @__PURE__ */ jsx15(Point, { at: map([1, 0]), label: "phase0" }),
      /* @__PURE__ */ jsx15(Point, { at: map([-1, 0]), label: "phase\u03C0", color: colors2[1] })
    ] }) }),
    /* @__PURE__ */ jsx15(Matrix, { label: "Coefficients and common magnitudes", values: [[0, 1], [0, -1], [0, 1]], rows: ["DFT A", "DFT B", "Both magnitudes"], columns: ["k0", "k1"], signed: true, max: 1 }),
    /* @__PURE__ */ jsx15(Plot, { label: "Two literal inverse samples", xmax: 1, ymin: -0.5, ymax: 0.5, xlabel: "sample n", ylabel: "amplitude", children: (map) => /* @__PURE__ */ jsx15(Fragment8, { children: [[[0.5, -0.5], colors2[0]], [[-0.5, 0.5], colors2[1]]].map(([values, color], i) => /* @__PURE__ */ jsxs13("g", { children: [
      /* @__PURE__ */ jsx15("path", { d: `M${map([0, values[0]]).join(" ")}L${map([1, values[1]]).join(" ")}`, stroke: color, fill: "none", strokeDasharray: i ? "5 3" : void 0 }),
      values.map((v, n) => /* @__PURE__ */ jsx15("circle", { cx: map([n, v])[0], cy: map([n, v])[1], r: i ? 3 : 5, fill: color }, n))
    ] }, i)) }) }),
    /* @__PURE__ */ jsx15(Matrix, { label: "Exact inverse normalization1/2", values: [[0.5, -0.5], [-0.5, 0.5]], rows: ["Waveform A", "Waveform B"], columns: ["n0", "n1"], signed: true, max: 0.5 })
  ] }) });
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/NmfFigures.jsx
import { jsx as jsx16 } from "react/jsx-runtime";
var figures = [Observation, Addends, Shapes, OuterProducts, AmountFraction, Compensation, Shear, ContributionRanking, Residual, SquaredCells, Missing, LossDomains, Cone, ClipFailure, () => /* @__PURE__ */ jsx16(Cone, { id: "D15", frozen: true }), CoordinateSlice, Caches, Cyclic, KKT, Alternation, Joint, Stationarity, Storage, Ratio, HistoricalMU, ZeroLock, Counts, Majorizer, PSD, BetaPower, Centering, SignedTriplet, PairedSigns, FilledZeros, PublicAnatomy, SameBlock, Publication, Penalty, ScalePenalty, MaskGram, NoInformation, Dictionary, SavedContribution, SavedRanking, Removal, Partitions, Candidates, MatchedComparison, PixelAddress, AlternativeCones, SupportRectangle, RankWitness, NormalizeMixture, ObservedAnchors, ProjectionTrace, Conditioning, WordCounts, FrozenIDF, SpectralConstraints, ExternalEvidence, OnlineStatistics, Retention, StaleStatistics, TensorAddress, TensorAnatomy, Phase];
function NmfFigure({
  id
}) {
  const n = Number(id.slice(1)), Component = figures[n - 1];
  if (!Component || n < 1 || n > 66) throw Error(`Unknown NMF drawing ${id}`);
  return /* @__PURE__ */ jsx16(Component, {});
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/FileIndex.jsx
import React11, { useState as useState10 } from "react";

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/file-index-data.js
var files = [{ "filename": "centered_pca.py", "role": "unchanged helper", "url": "/learn-assets/nmf-private/centered_pca.py", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/content-preparation/content-programs/centered_pca.py", "bytes": 5089, "sha256": "9c2485fcfa03a74c22f58c1f98f9834a0d76194d925d8d4929bae0058ff45055" } }, { "filename": "nmf_arrays.py", "role": "new computational source", "url": "/learn-assets/nmf-private/nmf_arrays.py", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/content-preparation/content-programs/nmf_arrays.py", "bytes": 7230, "sha256": "951f7c7a275a08a4e0ed404d0e144b5dcfb2748e5aa621e027aee1e41073d9bf" } }, { "filename": "nmf_coordinate.py", "role": "new computational source", "url": "/learn-assets/nmf-private/nmf_coordinate.py", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/content-preparation/content-programs/nmf_coordinate.py", "bytes": 9109, "sha256": "bdacf644a3b41910d027b480700ee0efeea320c73e3b18a449bf2f8d597596ec" } }, { "filename": "nmf_nnls.py", "role": "new computational source", "url": "/learn-assets/nmf-private/nmf_nnls.py", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/content-preparation/content-programs/nmf_nnls.py", "bytes": 2256, "sha256": "d476765a364dc35f5153a647630ccecec313ce25647a9e2f7ca0b5efde45f961" } }, { "filename": "nmf_multiplicative.py", "role": "new computational source", "url": "/learn-assets/nmf-private/nmf_multiplicative.py", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/content-preparation/content-programs/nmf_multiplicative.py", "bytes": 8988, "sha256": "56d22f18907297f5c1239e31e98071e6bde0d33c5d2c5a1cbc9aa92546c210f9" } }, { "filename": "nmf_beta_mm.py", "role": "new computational source", "url": "/learn-assets/nmf-private/nmf_beta_mm.py", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/content-preparation/content-programs/nmf_beta_mm.py", "bytes": 10103, "sha256": "92fa782d807217caa2edb033b22ad9ccfab207d6497a7ef0cc15cd600eb81815" } }, { "filename": "nmf_initialization.py", "role": "new computational source", "url": "/learn-assets/nmf-private/nmf_initialization.py", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/content-preparation/content-programs/nmf_initialization.py", "bytes": 6885, "sha256": "1b6696a60871fcc092e7e5d2232f2d0d09ff19b6eb964d9b35ba3c12e87b7cde" } }, { "filename": "ordinary_nmf_lifecycle.py", "role": "new computational source", "url": "/learn-assets/nmf-private/ordinary_nmf_lifecycle.py", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/content-preparation/ordinary-state-authoring/ordinary_nmf_lifecycle.py", "bytes": 6184, "sha256": "bcb1705c424895be7629900ba26005629c7f0701faeb41c1f31c08980218122b" } }, { "filename": "nmf_penalties_masks.py", "role": "new computational source", "url": "/learn-assets/nmf-private/nmf_penalties_masks.py", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/content-preparation/content-programs/nmf_penalties_masks.py", "bytes": 15667, "sha256": "66011064d265a75292ce62978ce7aa81cdb018b3f5ed2a1717266a0de483a3dd" } }, { "filename": "nmf_factor_alignment.py", "role": "new computational source", "url": "/learn-assets/nmf-private/nmf_factor_alignment.py", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/content-preparation/content-programs/nmf_factor_alignment.py", "bytes": 6580, "sha256": "6505488fa7183cb8fb656629707eb9585b4228162764dd355ce8a5f4e60d257c" } }, { "filename": "nmf_saved_digits.py", "role": "new computational source", "url": "/learn-assets/nmf-private/nmf_saved_digits.py", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/content-preparation/content-programs/nmf_saved_digits.py", "bytes": 6991, "sha256": "ff1e4f2d5f395745e4f1b824bcb7c33d5dcb6d0bc025c7c68d717ec1c268ce14" } }, { "filename": "nmf_digit_comparison.py", "role": "new computational source", "url": "/learn-assets/nmf-private/nmf_digit_comparison.py", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/content-preparation/content-programs/nmf_digit_comparison.py", "bytes": 4275, "sha256": "36ac3ce284bfa74dd5ff25124327eca5c73b1e4d28603535df78961d448c1e0e" } }, { "filename": "nmf_anchors.py", "role": "new computational source", "url": "/learn-assets/nmf-private/nmf_anchors.py", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/content-preparation/content-programs/nmf_anchors.py", "bytes": 5319, "sha256": "2dd67d6e1784525b356d39daf580f62499756319cd742dfba74b0bb418e74b30" } }, { "filename": "nmf_text_spectra.py", "role": "new computational source", "url": "/learn-assets/nmf-private/nmf_text_spectra.py", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/content-preparation/content-programs/nmf_text_spectra.py", "bytes": 9130, "sha256": "2fbca92d514885bcf9b1d84dfd678437d09837a8fdad8ae7b9c02cfed3513c3b" } }, { "filename": "nmf_online.py", "role": "new computational source", "url": "/learn-assets/nmf-private/nmf_online.py", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/content-preparation/content-programs/nmf_online.py", "bytes": 7983, "sha256": "44880c6ed798d3156d8f98dcc0d24df5794057f7d5f63889919d33838180db10" } }, { "filename": "nmf_axis_phase.py", "role": "new computational source", "url": "/learn-assets/nmf-private/nmf_axis_phase.py", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/content-preparation/axis-phase-authoring/nmf_axis_phase.py", "bytes": 2229, "sha256": "d3a454899bb6bc3946bf243f00264d571b488b21e7dadd174bad520cc10eb3b5" } }, { "filename": "nmf_step.py", "role": "preserved decoded program", "url": "/learn-assets/nmf-private/nmf_step.py", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/decoded-originals/nmf_step.py", "bytes": 465, "sha256": "b75511b9f0d8bacdf28a316351ac668ca7246cbe18de0c55d15f93002578c1a1" } }, { "filename": "nmf_digits.py", "role": "preserved decoded program", "url": "/learn-assets/nmf-private/nmf_digits.py", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/decoded-originals/nmf_digits.py", "bytes": 1915, "sha256": "f6b15d1b1ad710debcb19f102a089fd970fe8ca11e892b8ddd6bfbf689f29989" } }, { "filename": "nmf_words.py", "role": "preserved decoded program", "url": "/learn-assets/nmf-private/nmf_words.py", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/decoded-originals/nmf_words.py", "bytes": 805, "sha256": "feff3cfa4fe595a9311fbfad30475a85e9ebdf4f45c6fce01852553542dce343" } }, { "filename": "nmf_saved_state.json", "role": "offline data/provenance", "url": "/learn-assets/nmf-private/nmf_saved_state.json", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/content-preparation/content-programs/nmf_saved_state.json", "bytes": 69820, "sha256": "46f3dc0931e3ccddc30cc3e30bbb4d3f330bc35a4dccccef33f74a63472eddd0" } }, { "filename": "digits-300.csv", "role": "offline data/provenance", "url": "/learn-assets/nmf-private/digits-300.csv", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/content-preparation/content-programs/digits-300.csv", "bytes": 46235, "sha256": "d93f963c4b2610eb07122a312eec3ddceac18a031477370d71e33835eced728e" } }, { "filename": "digits-data-provenance.md", "role": "offline data/provenance", "url": "/learn-assets/nmf-private/digits-data-provenance.md", "source": { "path": "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/content-preparation/content-programs/digits-data-provenance.md", "bytes": 2939, "sha256": "b8657ad20d9ec461599bb12ecc8d7c306fb6d4b0ba1d37d4bc2da8c078cd73e7" } }];

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/FileIndex.jsx
import { jsx as jsx17, jsxs as jsxs14 } from "react/jsx-runtime";
function FileActions({
  filename
}) {
  const file = files.find((item) => item.filename === filename);
  if (!file) throw Error(`Unknown NMF teaching file: ${filename}`);
  const [message, setMessage] = useState10("");
  async function copy() {
    setMessage("");
    try {
      const response = await fetch(file.url);
      if (!response.ok || /text\/html/.test(response.headers.get("content-type") || "")) throw Error();
      const text = await response.text();
      await navigator.clipboard.writeText(text);
      setMessage("Copied complete file");
    } catch {
      setMessage("Copy unavailable. Open or download the complete file to copy it manually.");
    }
  }
  return /* @__PURE__ */ jsxs14("div", { className: "nmf-file-actions", children: [
    /* @__PURE__ */ jsx17("button", { type: "button", "aria-label": `Copy complete ${file.filename}`, onClick: copy, children: "Copy" }),
    /* @__PURE__ */ jsx17("a", { href: file.url, download: file.filename, "aria-label": `Download complete ${file.filename}`, children: "Download" }),
    /* @__PURE__ */ jsx17("a", { href: file.url, target: "_blank", rel: "noreferrer", children: "Open complete file" }),
    /* @__PURE__ */ jsx17("span", { role: "status", "aria-live": "polite", children: message })
  ] });
}

// docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/runtime-preview/consolidated-review-correction/nmf-lesson.jsx
import { Fragment as Fragment9, jsx as jsx18, jsxs as jsxs15 } from "react/jsx-runtime";
function NmfLesson() {
  return /* @__PURE__ */ jsxs15("div", { className: "lesson-flow nmf-reader", children: [
    /* @__PURE__ */ jsx18(Prose, { opening: "summary", children: "A bright pixel, a word count and a measured spectral band can all be built by adding contributions. NMF asks whether a table of such measurements can be explained by a small collection of nonnegative patterns and a different amount of each pattern for every observation. We will first build that explanation ourselves, then learn the patterns, inspect a recorded digit example and test what the factors can\u2014and cannot\u2014tell us." }),
    /* @__PURE__ */ jsx18(Prose, { opening: "prerequisites", children: "You need addition, multiplication, array indexing and Python functions. Matrix multiplication, the constrained fitting problem and the stopping diagnostic are introduced here. The first pass follows sections 1\u201310, 12\u201313 and 19. Sections 11 and 14\u201318 extend the same ideas to penalties, incomplete observations, identifiability, anchors, new applications and streams. The complete section index belongs directly below this opening." }),
    /* @__PURE__ */ jsx18("span", { id: "1-a-component-is-a-pattern-and-an-activation-is-an-amount", className: "nmf-historical-anchor" }),
    /* @__PURE__ */ jsx18(H2, { children: "1. Build one observation from positive amounts" }),
    /* @__PURE__ */ jsx18(Prose, { children: "How could two reusable patterns explain three measured values?" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Start with one observation: three measured bins, each with its own address." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D01" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The bars belong to row ",
      /* @__PURE__ */ jsx18("strong", { children: "R0" }),
      ". Its first feature, ",
      /* @__PURE__ */ jsx18("strong", { children: "F0" }),
      ", measures 2 intensity units; ",
      /* @__PURE__ */ jsx18("strong", { children: "F1" }),
      " measures 1; ",
      /* @__PURE__ */ jsx18("strong", { children: "F2" }),
      " measures 3. A ",
      /* @__PURE__ */ jsx18("em", { children: "feature" }),
      " is one measured quantity, and a ",
      /* @__PURE__ */ jsx18("em", { children: "row" }),
      " is one observation containing all three quantities. The bin labels are addresses, not numerical values. We will keep those addresses through every transformation."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "Suppose we have two possible patterns. A pattern tells us how one unit of a component contributes to all three features together." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D02" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The blue pattern, ",
      /* @__PURE__ */ jsx18("strong", { children: "C0" }),
      ", is ",
      /* @__PURE__ */ jsx18("code", { children: "[1, 0, 1]" }),
      ": one unit contributes 1 to F0, nothing to F1 and 1 to F2. The rose pattern, ",
      /* @__PURE__ */ jsx18("strong", { children: "C1" }),
      ", is ",
      /* @__PURE__ */ jsx18("code", { children: "[0, 1, 1]" }),
      ". Two units of C0 produce the blue addend ",
      /* @__PURE__ */ jsx18("code", { children: "[2, 0, 2]" }),
      "; one unit of C1 produces the rose addend ",
      /* @__PURE__ */ jsx18("code", { children: "[0, 1, 1]" }),
      ". Add corresponding bins to obtain ",
      /* @__PURE__ */ jsx18("code", { children: "[2, 1, 3]" }),
      ", exactly R0."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The amounts are ",
      /* @__PURE__ */ jsx18("code", { children: "[2, 1]" }),
      ". An amount can exceed 1. It is an intensity multiplier, not a probability. The picture uses blue and rose to preserve component identity; the neutral bars show the sum. The sliders directly beneath the picture change the two amounts. Setting both to 1 gives ",
      /* @__PURE__ */ jsx18("code", { children: "[1, 1, 2]" }),
      ". Setting both to zero removes both addends. Notice that changing C0's amount always changes F0 and F2 together: that coupling is what makes a reusable pattern different from three unrelated adjustable bins."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "Here is the same operation written compactly, with the pattern names still attached:" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "\\underbrace{[2,1,3]}_{\\text{R0}}\n=\\underbrace{2}_{\\text{amount C0}}\\underbrace{[1,0,1]}_{\\text{pattern C0}}\n+\\underbrace{1}_{\\text{amount C1}}\\underbrace{[0,1,1]}_{\\text{pattern C1}}." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "All amounts and pattern entries are ",
      /* @__PURE__ */ jsx18("strong", { children: "nonnegative" }),
      ": zero or larger. A component can add intensity or add nothing; it cannot subtract intensity to cancel another component. That constraint can be appropriate for measured counts or additive intensities. It does not establish that our invented patterns are physical sources."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "Now keep the same two patterns and explain several observations." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D03" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The middle address, C0 or C1, connects an amount to its pattern. The observation table ",
      /* @__PURE__ */ jsx18("strong", { children: "X" }),
      " has three rows R0\u2013R2 and three features F0\u2013F2. The amount table ",
      /* @__PURE__ */ jsx18("strong", { children: "W" }),
      " has three observation rows and two component columns. The pattern table ",
      /* @__PURE__ */ jsx18("strong", { children: "H" }),
      ", also called the ",
      /* @__PURE__ */ jsx18("em", { children: "dictionary" }),
      ", has two component rows and three feature columns:"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "W_{\\rm exact}=\\begin{bmatrix}2&1\\\\1&3\\\\0&2\\end{bmatrix},\\qquad\nH_0=\\begin{bmatrix}1&0&1\\\\0&1&1\\end{bmatrix},\\qquad\nX_0=\\begin{bmatrix}2&1&3\\\\1&3&4\\\\0&2&2\\end{bmatrix}." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Follow the marked output cell R1,F2. R1 uses amount 1 of C0 and amount 3 of C1. Both patterns contribute 1 per unit to F2, so this cell is ",
      /* @__PURE__ */ jsx18("code", { children: "1\xD71 + 3\xD71 = 4" }),
      ". Every output cell follows that same multiply-and-add rule. Matrix multiplication is the name for doing all those contractions together: ",
      /* @__PURE__ */ jsx18("code", { children: "W @ H" }),
      " in NumPy."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For a general table, let ",
      /* @__PURE__ */ jsx18("strong", { children: "n" }),
      " be the number of observations, ",
      /* @__PURE__ */ jsx18("strong", { children: "d" }),
      " the number of features and ",
      /* @__PURE__ */ jsx18("strong", { children: "k" }),
      " the number of components. W has shape ",
      /* @__PURE__ */ jsx18("code", { children: "n\xD7k" }),
      ", H has shape ",
      /* @__PURE__ */ jsx18("code", { children: "k\xD7d" }),
      ", and the reconstruction W H has shape ",
      /* @__PURE__ */ jsx18("code", { children: "n\xD7d" }),
      ". The repeated component dimension k is summed over. In mathematical notation, i runs from 1 to n, c from 1 to k and j from 1 to d; Python addresses begin at zero, so R1,F2 is mathematical row 2, feature 3."
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "\\widehat X_{ij}=\\sum_{c=1}^{k}W_{ic}H_{cj},\\qquad X\\approx\\widehat X=WH,\\qquad W,H\\ge0." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The hat means ",
      /* @__PURE__ */ jsx18("em", { children: "reconstructed" }),
      ", rather than measured. An exact equality happens in our constructed example. For real data, fewer patterns usually leave some disagreement, which the approximation sign allows."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "There is a second way to read the very same multiplication: follow one component through every observation." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D04" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The blue column of W is ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1,0]" }),
      ". Multiply each amount by the entire blue pattern ",
      /* @__PURE__ */ jsx18("code", { children: "[1,0,1]" }),
      "; the resulting blue contribution table is ",
      /* @__PURE__ */ jsx18("code", { children: "[[2,0,2],[1,0,1],[0,0,0]]" }),
      ". The rose contribution table is ",
      /* @__PURE__ */ jsx18("code", { children: "[[0,1,1],[0,3,3],[0,2,2]]" }),
      ". Their cellwise sum is X0. A zero amount removes a whole contribution row; a zero pattern entry removes a whole contribution column. The rectangular cells have equal layout area; their labels and bar heights carry magnitude."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "This column-times-row construction is an ",
      /* @__PURE__ */ jsx18("strong", { children: "outer product" }),
      ". NMF represents a table as a sum of k nonnegative outer products. ",
      /* @__PURE__ */ jsx18("em", { children: "Factorization" }),
      " means finding W and H whose product approximates X. So far we chose both factors ourselves. Learning them is the next problem, after we settle what their values mean and how to measure a mismatch."
    ] }),
    /* @__PURE__ */ jsx18("span", { id: "4-the-same-observations-can-have-different-explanations", className: "nmf-historical-anchor" }),
    /* @__PURE__ */ jsx18(H2, { children: "2. Amount is not probability or identity" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Section 1 built a measurement from amounts. Would dividing those amounts by their total make the interpretation clearer?" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Compare the actual reconstruction with the reconstruction after that division." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D05" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "R0's amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1]" }),
      " sum to 3. Their fractions ",
      /* @__PURE__ */ jsx18("code", { children: "[2/3,1/3]" }),
      " sum to 1, but with H0 unchanged they reconstruct ",
      /* @__PURE__ */ jsx18("code", { children: "[2/3,1/3,1]" }),
      ", one third of R0. We have changed the measured intensity, not simply improved the labels. NMF amounts are sometimes called ",
      /* @__PURE__ */ jsx18("em", { children: "activations" }),
      ", ",
      /* @__PURE__ */ jsx18("em", { children: "loadings" }),
      " or ",
      /* @__PURE__ */ jsx18("em", { children: "coefficients" }),
      ". Those names still refer to W's multipliers; none makes them probabilities."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "There is, however, a way to change an amount without changing its contribution: change the pattern's unit at the same time." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D06" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "At scale s=2, C0's pattern becomes ",
      /* @__PURE__ */ jsx18("code", { children: "[2,0,2]" }),
      " and its R0 amount becomes 1 instead of 2. The blue addend remains ",
      /* @__PURE__ */ jsx18("code", { children: "[2,0,2]" }),
      ". The same compensation applies to every amount in that component's W column. The slider changes s in both places, leaving the contribution table and reconstructed observations visible. Zero is excluded because division by zero cannot define the compensation."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "For any positive scale s," }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "(W_{:c}/s)(sH_{c:})=W_{:c}H_{c:}." }) }),
    /* @__PURE__ */ jsx18(Prose, { children: "The colon means all rows or all features at that address. Scaling changes the separate factors' units while leaving their product invariant. Reordering W's component columns and H's matching component rows also preserves the product: names can change without changing the explanation's numerical content." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "These are not the only ambiguities. To see a genuinely different dictionary, we will switch explicitly to a second constructed example: patterns ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1,1]" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1,1]" }),
      ", with amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1]" }),
      ". We need this example because H0's zeros would make the following subtraction invalid."
    ] }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D07" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The first pattern starts as the ray ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1,1]" }),
      "; the second stays ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1,1]" }),
      ". Moving t from 0 to 1 changes the first pattern to ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1\u2212t,1\u2212t]" }),
      " and the amounts to ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1+2t]" }),
      ". At t=1/2, the first pattern is ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1/2,1/2]" }),
      " and the amounts are ",
      /* @__PURE__ */ jsx18("code", { children: "[2,2]" }),
      ". The prediction remains ",
      /* @__PURE__ */ jsx18("code", { children: "[2,3,3]" }),
      ": the blue contribution loses ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1,1]" }),
      ", and the rose contribution gains exactly that vector."
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "2[1,1-t,1-t]+(1+2t)[0,1,1]=[2,3,3],\\quad 0\\le t\\le1." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "All entries remain nonnegative, yet the first pattern changes direction, not just length. Thus even a perfect reconstruction need not identify one unique dictionary. Section 14 will ask what additional conditions can identify patterns; here the important distinction is already visible: ",
      /* @__PURE__ */ jsx18("em", { children: "fits the data" }),
      " and ",
      /* @__PURE__ */ jsx18("em", { children: "recovers the real parts" }),
      " are different claims."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "Return to R0 and H0. Which component contributes more to this row?" }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D08" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The amount bars show ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1]" }),
      ". The contribution totals show ",
      /* @__PURE__ */ jsx18("code", { children: "[4,2]" }),
      ", because C0 contributes ",
      /* @__PURE__ */ jsx18("code", { children: "2\xD7(1+0+1)=4" }),
      " intensity units and C1 contributes ",
      /* @__PURE__ */ jsx18("code", { children: "1\xD7(0+1+1)=2" }),
      ". At s=3, C0's amount shrinks to 2/3, below C1's amount 1, while its pattern becomes three times stronger. Its contribution remains 4. Ranking raw amounts can therefore reverse under an equally valid change of units."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "When comparing components, first say what you are comparing. The vector ",
      /* @__PURE__ */ jsx18("code", { children: "W[i,c] * H[c,:]" }),
      " gives its per-feature contribution. Summing that vector gives one scale-invariant total. That total is useful for this intensity question; it is not a universal importance score or a causal attribution. We will use the same distinction when inspecting real digit pixels in section 12."
    ] }),
    /* @__PURE__ */ jsx18("span", { id: "2-what-gets-optimized", className: "nmf-historical-anchor" }),
    /* @__PURE__ */ jsx18(H2, { children: "3. Measure the disagreement before choosing a loss" }),
    /* @__PURE__ */ jsx18(Prose, { children: "We can now build and interpret a reconstruction. How do we judge one that misses the measurements?" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Keep R0 and H0, fix C1's amount at 1 and move only C0's amount." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D09" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "At C0 amount 1, the prediction is ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1,2]" }),
      ", below R0 ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1,3]" }),
      " by ",
      /* @__PURE__ */ jsx18("code", { children: "[1,0,1]" }),
      ". At amount 3, the prediction is ",
      /* @__PURE__ */ jsx18("code", { children: "[3,1,4]" }),
      ", above R0 by one unit in F0 and F2. The signed residual is measured minus reconstructed: positive means the reconstruction is too low; negative means it is too high. Amount 2 gives zero residual in all bins. Residuals can be negative even though amounts and patterns cannot."
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "R=X-WH." }) }),
    /* @__PURE__ */ jsx18(Prose, { children: "A signed sum would let an overestimate cancel an underestimate. Squaring each residual instead makes both kinds of mistake cost something." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D10" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For R1, the measured row is ",
      /* @__PURE__ */ jsx18("code", { children: "[1,3,4]" }),
      "; the initial reconstruction ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1,2]" }),
      " leaves ",
      /* @__PURE__ */ jsx18("code", { children: "[0,2,2]" }),
      ". Each residual of length 2 produces a squared area 4. The sum is 8; half that sum is 4. The square's side has intensity units, while its area has squared intensity units. That geometric distinction matters when reading an error report."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Our fitting objective is ",
      /* @__PURE__ */ jsx18("strong", { children: "half the total squared disagreement" }),
      ", also called the half-squared Frobenius objective:"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "L(W,H)=\\tfrac12\\sum_{i=1}^{n}\\sum_{j=1}^{d}(X_{ij}-(WH)_{ij})^2\n=\\tfrac12\\lVert X-WH\\rVert_F^2." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The F subscript says to collect the squares of ",
      /* @__PURE__ */ jsx18("em", { children: "all" }),
      " matrix cells. The factor 1/2 makes derivatives simpler; it does not move the minimum. Starting with every amount equal to 1 and H0 fixed, the row losses are 1, 4 and 1, so L=6 for all nine observed cells."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "These commonly reported quantities describe the same unweighted residuals on different scales:" }),
    /* @__PURE__ */ jsx18(Table, { caption: "3. Measure the disagreement before choosing a loss", headers: [/* @__PURE__ */ jsx18(Fragment9, { children: "Quantity" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Definition from L and N observed cells" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Initial X0 value" })], rows: [[/* @__PURE__ */ jsx18(Fragment9, { children: "Squared Frobenius norm" }), /* @__PURE__ */ jsx18(Fragment9, { children: "2L" }), /* @__PURE__ */ jsx18(Fragment9, { children: "12" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "Frobenius norm" }), /* @__PURE__ */ jsx18(Fragment9, { children: "\u221A(2L)" }), /* @__PURE__ */ jsx18(Fragment9, { children: "\u221A12 \u2248 3.464102" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "Mean squared error, MSE" }), /* @__PURE__ */ jsx18(Fragment9, { children: "2L/N" }), /* @__PURE__ */ jsx18(Fragment9, { children: "4/3 \u2248 1.333333" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "Root mean squared error, RMSE" }), /* @__PURE__ */ jsx18(Fragment9, { children: "\u221A(2L/N)" }), /* @__PURE__ */ jsx18(Fragment9, { children: "\u221A(4/3) \u2248 1.154701" })]] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Norm and RMSE return to intensity units; squared norm, L and MSE use squared units. MSE averages over cells, not rows or components. With Frobenius loss, scikit-learn's ",
      /* @__PURE__ */ jsx18("code", { children: "reconstruction_err_" }),
      " is the residual norm \u221A(2L), so comparing that number directly with our half-loss would compare different quantities."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "Before choosing a loss, distinguish a measured zero from an absent measurement." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D11" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Here we temporarily use one pattern ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1]" }),
      " and a measured row ",
      /* @__PURE__ */ jsx18("code", { children: "[x,0]" }),
      ". If both bins were measured, the best amount is x/2: it compromises between the first bin asking for x and the second asking for zero. At x=2, the prediction ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1]" }),
      " has half-loss 1. If the second bin was not measured, its hatched cell supplies no constraint. Amount x then fits the first bin exactly; at x=2, the included-cell loss is zero, but we have learned nothing about whether the unobserved second prediction is accurate."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Let ",
      /* @__PURE__ */ jsx18("strong", { children: "M" }),
      " be a table of nonnegative weights. A binary weight 1 includes a measurement and 0 omits it. A fractional weight changes that cell's relative contribution to a weighted objective:"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "L_M=\\tfrac12\\sum_{ij}M_{ij}(X_{ij}-(WH)_{ij})^2." }) }),
    /* @__PURE__ */ jsx18(Prose, { children: "Do not replace missing cells by observed zeros. An all-missing row has zero included objective for every reconstruction, so zero loss there is not evidence of quality. If reporting a weighted mean, explicitly state its denominator; division by the number of table cells and division by the sum of weights answer different questions. Section 11 derives the corresponding masked fitting updates." }),
    /* @__PURE__ */ jsx18(Prose, { children: "Squared error is not the only way to express disagreement. To compare alternatives, we now isolate one strictly positive observation x and one strictly positive reconstructed value y." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D12" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Each curve reaches zero at y=x. With x=2, predicting 1 or 3 costs 1/2 under half-squared error. The count-oriented generalized KL costs approximately 0.386294 at y=1 and 0.189070 at y=3. The relative-scale Itakura\u2013Saito cost is approximately 0.306853 and 0.072132 respectively. These are different objectives, not three interchangeable units of one error score." }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "\\begin{aligned}\nd_2(x,y)&=\\tfrac12(x-y)^2,\\\\\nd_1(x,y)&=x\\log(x/y)-x+y,\\\\\nd_0(x,y)&=x/y-\\log(x/y)-1.\n\\end{aligned}" }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Here log is the natural logarithm. Summing one chosen cell cost over the table gives its fitting objective. Generalized KL has a count interpretation: if independent counts have modelled mean y, the Poisson negative log-likelihood contains ",
      /* @__PURE__ */ jsx18("code", { children: "y\u2212x log y" }),
      "; terms depending only on observed x do not change the optimizer. It is not the KL between normalized probability distributions unless that additional normalization and interpretation are supplied. Itakura\u2013Saito depends on the ratio x/y, so rescaling both by the same positive factor leaves this cell cost unchanged. Squared error instead changes by the square of that scale. A choice of loss therefore encodes what kinds of discrepancy matter."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Their boundaries also differ. For KL, an observed zero contributes y; ",
      /* @__PURE__ */ jsx18("code", { children: "(x,y)=(0,0)" }),
      " contributes zero by continuity. A positive observation with y=0 has infinite KL. Itakura\u2013Saito here requires both values to be positive. Adding a tiny constant to every zero changes the problem; it is not an invisible numerical repair. Section 7 will use these conventions in the KL update, and section 8 will connect the three losses to the beta family."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "For now, we will fit the half-squared objective. Keeping that choice fixed lets us understand the optimizer rather than changing the question halfway through a calculation." }),
    /* @__PURE__ */ jsx18(H2, { children: "4. Encode a new row with the dictionary held fixed" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Section 3 told us how to score a mismatch. Before learning a whole dictionary, can we find the best amounts for one new observation under a dictionary we already have?" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Use two features instead of three so we can draw every attainable prediction in a plane. This is a separate geometry example: C0=",
      /* @__PURE__ */ jsx18("code", { children: "[1,0]" }),
      ", C1=",
      /* @__PURE__ */ jsx18("code", { children: "[1,1]" }),
      "."
    ] }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D13" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The horizontal ray is C0; the diagonal ray is C1. A nonnegative amount can move outward along either ray. Adding the two moves reaches the shaded ",
      /* @__PURE__ */ jsx18("strong", { children: "cone" }),
      ", the wedge where the second coordinate is between zero and the first. A ",
      /* @__PURE__ */ jsx18("em", { children: "cone" }),
      " allows arbitrary nonnegative amounts; it does not restrict their sum to 1."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For query ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1/2]" }),
      ", amount 1/2 of each pattern predicts the query exactly. For ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1]" }),
      ", an exact prediction would need a negative horizontal amount, which NMF forbids. The closest feasible prediction is ",
      /* @__PURE__ */ jsx18("code", { children: "[1/2,1/2]" }),
      ", made from amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1/2]" }),
      ". The residual arrow reaches from that prediction to the observed query. The two query controls change the diamond; they leave both pattern rays fixed."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "If the query is ",
      /* @__PURE__ */ jsx18("code", { children: "[u,v]" }),
      " with nonnegative u and v, prediction from amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[a,b]" }),
      " is ",
      /* @__PURE__ */ jsx18("code", { children: "[a+b,b]" }),
      ". Inside the cone, ",
      /* @__PURE__ */ jsx18("code", { children: "u\u2265v" }),
      ", choose ",
      /* @__PURE__ */ jsx18("code", { children: "[a,b]=[u\u2212v,v]" }),
      ". Outside, ",
      /* @__PURE__ */ jsx18("code", { children: "v>u" }),
      ", the optimum sits on the boundary a=0. Minimizing ",
      /* @__PURE__ */ jsx18("code", { children: "1/2((u\u2212b)\xB2+(v\u2212b)\xB2)" }),
      " gives b=(u+v)/2. At the zero query, both amounts can be zero. This tiny geometry gives us a complete answer before a solver appears."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The general fixed-dictionary problem is ",
      /* @__PURE__ */ jsx18("strong", { children: "nonnegative least squares" }),
      ", abbreviated NNLS:"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "\\min_{w\\ge0}\\tfrac12\\lVert x-wH\\rVert_2^2," }) }),
    /* @__PURE__ */ jsx18(Prose, { children: "where x is one observed row and w is its k amounts. The subscript 2 denotes the ordinary Euclidean vector norm. With H fixed, this is a convex quadratic problem: there are no separated lower valleys. An optimizer can find a global fixed-H minimum, although dependent pattern rows can make the minimizing amounts nonunique." }),
    /* @__PURE__ */ jsx18(Prose, { children: "Why not solve unconstrained least squares and clip negative amounts to zero?" }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D14" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For query ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1]" }),
      ", unconstrained amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[-1,1]" }),
      " reconstruct it exactly. Clipping to ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1]" }),
      " moves the prediction to ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1]" }),
      ", half-loss 1/2. But ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1/2]" }),
      " predicts ",
      /* @__PURE__ */ jsx18("code", { children: "[1/2,1/2]" }),
      ", half-loss 1/4. Clipping removed the negative horizontal cancellation without readjusting the diagonal amount. Because the two rays overlap in their first coordinate, that remaining amount must be optimized again."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The ordinary SciPy route solves this constrained problem directly:" }),
    /* @__PURE__ */ jsx18(CodeBlock, { language: "python", children: "import numpy as np\nfrom scipy.optimize import nnls\n\nh = np.array([[1., 0.], [1., 1.]])\nquery = np.array([0., 1.])\namounts, residual_norm = nnls(h.T, query, maxiter=1000)\nprediction = amounts @ h\nhalf_loss = 0.5 * residual_norm**2" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "SciPy accepts a column-oriented design matrix, so ",
      /* @__PURE__ */ jsx18("code", { children: "h.T" }),
      " has shape ",
      /* @__PURE__ */ jsx18("code", { children: "d\xD7k" }),
      "; the amount vector has length k. Its returned diagnostic is the ",
      /* @__PURE__ */ jsx18("strong", { children: "residual norm" }),
      ", approximately 0.707107 here. Squaring it and dividing by two gives 1/4. The output amounts are ",
      /* @__PURE__ */ jsx18("code", { children: "[0,0.5]" }),
      " up to floating-point rounding. SciPy's maintained constrained solver is useful as an independent reference for our coordinate implementation in the next section."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "Encoding changes the amounts, not the dictionary." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D15" }),
    /* @__PURE__ */ jsx18(Prose, { children: "The stored pattern rows and feature order stay on the fixed side of the boundary. A new row crosses the boundary, acquires new amounts and then reconstructs through those same patterns. A query with F0 and F1 swapped represents a different observation unless its columns are reordered deliberately. An empty query has zero rows and still returns two amount columns; it does not trigger a new fit." }),
    /* @__PURE__ */ jsx18(Prose, { children: "This fit-versus-encode distinction will remain the same for real digits and text. We will first learn H from training rows, then hold it fixed for later rows. A query must not silently change the patterns against which earlier queries were interpreted." }),
    /* @__PURE__ */ jsx18("span", { id: "3-learn-one-factor-while-holding-the-other-still", className: "nmf-historical-anchor" }),
    /* @__PURE__ */ jsx18(H2, { children: "5. Change one coordinate, then reuse the arithmetic" }),
    /* @__PURE__ */ jsx18(Prose, { children: "NNLS gave us the best amounts with fixed H. How can we implement the actual constrained optimization instead of delegating it?" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Return to our original three-feature R1=",
      /* @__PURE__ */ jsx18("code", { children: "[1,3,4]" }),
      " and H0. Start both amounts at 1; hold the rose amount at 1 while moving the blue amount a."
    ] }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D16" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The predicted row is ",
      /* @__PURE__ */ jsx18("code", { children: "[a,1,a+1]" }),
      ". Its residuals are ",
      /* @__PURE__ */ jsx18("code", { children: "[1\u2212a,2,3\u2212a]" }),
      ". The curve sums half their squared lengths. At a=1, loss is 4; at a=2, loss is 3; at a=3, loss is back to 4. The lowest point along this one-coordinate slice is a=2. It is not the lowest possible loss after changing both amounts, because the rose amount is still fixed."
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "L(a)=\\tfrac12\\big[(1-a)^2+2^2+(3-a)^2\\big]\n=a^2-4a+7." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The slope is ",
      /* @__PURE__ */ jsx18("code", { children: "2a\u22124" }),
      " and the curvature\u2014the rate at which that slope changes\u2014is 2. Setting the slope to zero gives a=2. If the unconstrained minimum fell below zero, the best allowed value would be the boundary a=0. That is a ",
      /* @__PURE__ */ jsx18("strong", { children: "coordinate update" }),
      ": minimize over one amount while holding the others fixed."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "We can reuse the same calculation across every row without rebuilding every residual for every amount." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D17" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The ",
      /* @__PURE__ */ jsx18("strong", { children: "Gram matrix G" }),
      " stores how much each pattern overlaps every pattern: ",
      /* @__PURE__ */ jsx18("code", { children: "G=H @ H.T" }),
      ", shape ",
      /* @__PURE__ */ jsx18("code", { children: "k\xD7k" }),
      ". For H0, ",
      /* @__PURE__ */ jsx18("code", { children: "G=[[2,1],[1,2]]" }),
      ". Diagonal value 2 is a pattern's squared length; off-diagonal value 1 comes from the shared F2 bin. The ",
      /* @__PURE__ */ jsx18("strong", { children: "cross-product table P" }),
      " stores each observation's overlap with every pattern: ",
      /* @__PURE__ */ jsx18("code", { children: "P=X @ H.T" }),
      ", shape ",
      /* @__PURE__ */ jsx18("code", { children: "n\xD7k" }),
      ", here ",
      /* @__PURE__ */ jsx18("code", { children: "[[5,4],[5,7],[2,4]]" }),
      ". For R1 and C1, ",
      /* @__PURE__ */ jsx18("code", { children: "P=3\xD71+4\xD71=7" }),
      "."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "Expand one row's half-loss, treating H as fixed:" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "L(w)=\\tfrac12\\lVert x\\rVert_2^2-wP_i^T+\\tfrac12wGw^T." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The first term does not depend on w. The slope of coordinate c is ",
      /* @__PURE__ */ jsx18("code", { children: "(wG\u2212P_i)_c" }),
      ", and its curvature is ",
      /* @__PURE__ */ jsx18("code", { children: "G_cc" }),
      ". Therefore, for positive curvature, the constrained minimizing update is"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "w_c\\leftarrow\\max\\left(0,\\ w_c-\\frac{(wG-P_i)_c}{G_{cc}}\\right)." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The division is by one positive scalar, not a matrix inverse. We compute G and P once while H stays fixed. Updating the entire component column ",
      /* @__PURE__ */ jsx18("code", { children: "W[:,c]" }),
      " handles every observation in a vectorized operation; no ",
      /* @__PURE__ */ jsx18("code", { children: "n\xD7d\xD7k" }),
      " contribution tensor is needed. If pattern c is all zero, its Gram diagonal and cross-products are zero. The reconstruction is independent of its amount; our implementation chooses amount zero for that flat coordinate instead of dividing by zero."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The order of the coordinate changes matters within a sweep." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D18" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "R1 starts at ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1]" }),
      ". For C0, the slope is ",
      /* @__PURE__ */ jsx18("code", { children: "1\xD72+1\xD71\u22125=\u22122" }),
      "; subtracting slope/curvature changes the amount to 2. Next C1 must use that ",
      /* @__PURE__ */ jsx18("strong", { children: "new" }),
      " 2: its slope is ",
      /* @__PURE__ */ jsx18("code", { children: "2\xD71+1\xD72\u22127=\u22123" }),
      ", so its amount becomes ",
      /* @__PURE__ */ jsx18("code", { children: "1\u2212(\u22123)/2=2.5" }),
      ". One cyclic sweep returns ",
      /* @__PURE__ */ jsx18("code", { children: "[2,2.5]" }),
      ", prediction ",
      /* @__PURE__ */ jsx18("code", { children: "[2,2.5,4.5]" }),
      ", half-loss 3/4."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The other lane uses stale C0=1 while updating C1, yielding C1=3. It describes a simultaneous update, not the cyclic algorithm. Neither lane's one sweep is automatically the fixed-dictionary optimum ",
      /* @__PURE__ */ jsx18("code", { children: "[1,3]" }),
      ". A sweep means that each coordinate had one turn; it does not mean all coordinates are jointly solved. Repeating cyclic sweeps lets the next C0 adjustment account for the changed C1."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The core operation is short:" }),
    /* @__PURE__ */ jsx18(CodeBlock, { language: "python", children: "gram = h @ h.T\ncross = x @ h.T\nfor c in range(h.shape[0]):\n    curvature = gram[c, c]\n    if curvature == 0:\n        w[:, c] = 0.0\n    else:\n        slope = w @ gram[:, c] - cross[:, c]\n        w[:, c] = np.maximum(0.0, w[:, c] - slope / curvature)" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Here x, w and h are validated float64 arrays. Assigning one column before visiting the next makes the freshness visible. The complete implementation separates that kernel from validation and retains its Gram/cross caches across fixed-dictionary encoding sweeps. A changed H requires new caches." }),
    /* @__PURE__ */ jsx18(Prose, { children: "How do we know when further feasible coordinate movement offers no first-order improvement?" }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D19" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Use the two-feature cone example again. At optimal amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1/2]" }),
      ", the gradient is ",
      /* @__PURE__ */ jsx18("code", { children: "[1/2,0]" }),
      ". C0's positive slope does not mean the optimizer failed: reducing its amount would lower the loss, but that would leave the allowed nonnegative quadrant. Increasing it is feasible and would raise the loss. At amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[0,0]" }),
      ", by contrast, the C1 slope is \u22121: increasing that zero amount is feasible and lowers the loss."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The ",
      /* @__PURE__ */ jsx18("strong", { children: "Karush\u2013Kuhn\u2013Tucker conditions" }),
      ", or KKT conditions, express this boundary logic for this smooth constrained problem. For each coordinate, a positive amount requires zero slope; an amount at zero requires a nonnegative slope. Equivalently, ",
      /* @__PURE__ */ jsx18("code", { children: "w\u22650" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "g\u22650" }),
      ", and ",
      /* @__PURE__ */ jsx18("code", { children: "w_c g_c=0" }),
      ", where ",
      /* @__PURE__ */ jsx18("code", { children: "g=wG\u2212P_i" }),
      ". The ",
      /* @__PURE__ */ jsx18("em", { children: "projected gradient" }),
      " keeps slopes on positive coordinates, keeps negative slopes at zero, and suppresses positive slopes at zero:"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "g_c^{\\rm proj}=\\begin{cases}\ng_c,&w_c>0,\\\\\n\\min(g_c,0),&w_c=0.\n\\end{cases}" }) }),
    /* @__PURE__ */ jsx18(Prose, { children: "Its norm is zero exactly at these first-order conditions in exact arithmetic. Our code uses its norm relative to the initial norm as a declared stopping test. A small value is a numerical tolerance statement, not exact zero. For the convex fixed-H problem these conditions characterize a global minimum; section 6 explains why fitting both factors requires a weaker conclusion." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "Deeper: where the later penalty arguments enter this same kernel." }),
      " A penalty is an extra cost attached to amounts. Adding ",
      /* @__PURE__ */ jsx18("code", { children: "\u03BB\u2081 \u03A3_c w_c + (\u03BB\u2082/2) \u03A3_c w_c\xB2" }),
      ", with nonnegative \u03BB values, adds slope ",
      /* @__PURE__ */ jsx18("code", { children: "\u03BB\u2081+\u03BB\u2082 w_c" }),
      " and curvature \u03BB\u2082. Thus the update becomes"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "w_c\\leftarrow\\max\\left(0,\\ w_c-\n\\frac{(wG-P_i)_c+\\lambda_1+\\lambda_2w_c}{G_{cc}+\\lambda_2}\\right)." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Both \u03BB\u2082 terms are necessary: adding it to curvature alone would solve a different coordinate problem. In ",
      /* @__PURE__ */ jsx18("code", { children: "coordinate_block" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "l1" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "l2" }),
      " name these two coefficients; both default to zero for the current unpenalized lesson. With a flat zero pattern, \u03BB\u2082>0 makes zero the unique penalized optimum; \u03BB\u2082=0 with \u03BB\u2081>0 also chooses zero. Section 11 will connect these local coefficients to dimension-scaled library settings and explain why penalties change the scale ambiguity."
    ] }),
    /* @__PURE__ */ jsx18(H2, { children: "6. Fit both factors and decide when to stop" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Section 5 changed amounts with fixed patterns. To learn the dictionary too, what changes when we give the pattern entries their own turn?" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Transpose the same problem rather than inventing a different optimizer." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D20" }),
    /* @__PURE__ */ jsx18(Prose, { children: "The first lane holds H0 fixed and updates W. Starting with W filled with ones, one cyclic sweep gives" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "W_1=\\begin{bmatrix}2&1\\\\2&5/2\\\\1/2&7/4\\end{bmatrix}." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The half-loss falls from 6 to 15/16. The next lane holds ",
      /* @__PURE__ */ jsx18("strong", { children: "that new W1" }),
      " fixed and updates H. In the transposed problem, the observation table is ",
      /* @__PURE__ */ jsx18("code", { children: "X.T" }),
      ", the changing amount table is ",
      /* @__PURE__ */ jsx18("code", { children: "H.T" }),
      ", and the fixed dictionary is ",
      /* @__PURE__ */ jsx18("code", { children: "W1.T" }),
      ". The identical coordinate kernel gives"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "H_1=\\begin{bmatrix}\n8/11&3/22&19/22\\\\\n0&641/605&569/605\n\\end{bmatrix}." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The half-loss then becomes ",
      /* @__PURE__ */ jsx18("code", { children: "11733/26620\u22480.440759" }),
      ". The repeated component ports show which factor is fixed at each stage. Back and Reset restore entire earlier factor pairs, not just their displayed loss. This ",
      /* @__PURE__ */ jsx18("strong", { children: "W-first, then new-W H" }),
      " order defines the coordinate route taught here. Section 7's multiplicative route will deliberately use the opposite block order."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "Why can each block be convex while the combined fit is not?" }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D21" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Shrink the entire example to one observed scalar x=1 and two nonnegative factors w and h. Factor pairs ",
      /* @__PURE__ */ jsx18("code", { children: "(1,1)" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "(2,1/2)" }),
      " both reconstruct 1 and have zero loss. Their midpoint ",
      /* @__PURE__ */ jsx18("code", { children: "(3/2,3/4)" }),
      " reconstructs 9/8, with half-loss 1/128. For a convex joint objective, the midpoint's loss could not exceed the average of the endpoint losses, which is zero. It does, so the joint objective is nonconvex\u2014even in this smallest case."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "Holding h fixed still leaves a convex parabola in w. Alternating useful block steps can lower the joint loss, but it does not turn the joint landscape into a convex one. Different initial factors can lead to different stationary solutions. The scale ambiguity from section 2 also remains unless extra constraints or penalties change it." }),
    /* @__PURE__ */ jsx18(Prose, { children: "Loss improvement and stationarity answer different stopping questions." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D22" }),
    /* @__PURE__ */ jsx18(Prose, { children: "For this diagnostic picture only, take a fixed scalar pattern 1 and target 1. At amount w=0, half-loss is 1/2 and projected-gradient norm is 1. A procedure that refuses to move a zero amount would report no loss change while leaving an obvious improving direction. At w=1/2, loss is 1/8 and projected-gradient norm is 1/2. At w=1, both are zero. Section 7 will show an actual update rule that can become locked at zero; here the picture establishes why \u201Cunchanged\u201D is insufficient evidence of convergence." }),
    /* @__PURE__ */ jsx18(Prose, { children: "For both factors together, the gradients are" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "\\nabla_W L=(WH-X)H^T\\quad(n\\times k),\\qquad\n\\nabla_H L=W^T(WH-X)\\quad(k\\times d)." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The coordinate derivation already gave the first expression as ",
      /* @__PURE__ */ jsx18("code", { children: "WG\u2212P" }),
      ". Transposing gives the second. Apply the same boundary rule to both factors, then combine their projected-gradient norms by the square root of the sum of their squares. Call the initial combined norm b. Our stopping rule is ",
      /* @__PURE__ */ jsx18("code", { children: "current_norm \u2264 tol \xD7 b" }),
      ". If b=0, the supplied factors are already stationary under this test. Otherwise a cap ends the computation after the requested maximum number of outer iterations, even if the tolerance has not been reached. The returned status says which happened."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "This is a ",
      /* @__PURE__ */ jsx18("strong", { children: "stationarity diagnostic" }),
      ", not a certificate of the best joint factorization, uniqueness or true source recovery. Its numerical value also depends on factor scale: the invariant reconstruction from section 2 does not make gradients in differently scaled parameter coordinates identical. Compare diagnostics under declared coordinates, tolerances and initialization rather than treating one threshold as universal."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "What does an efficient implementation keep in memory?" }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D23" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For our ",
      /* @__PURE__ */ jsx18("code", { children: "n=3,d=3,k=2" }),
      " example, the input contains 9 cells, returned W contains 6, and fitted H contains 6. A fixed-H block uses a 4-cell Gram and 6-cell cross-product table. Once H changes, those caches are obsolete. The diagnostic's row block stores only its current residual rows. The brackets distinguish ",
      /* @__PURE__ */ jsx18("strong", { children: "returned training amounts" }),
      ", ",
      /* @__PURE__ */ jsx18("strong", { children: "retained fitted dictionary and feature order" }),
      ", and ",
      /* @__PURE__ */ jsx18("strong", { children: "temporary workspace" }),
      "."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For general dimensions, forming each outer iteration's caches costs ",
      /* @__PURE__ */ jsx18("code", { children: "O(ndk+(n+d)k\xB2)" }),
      " arithmetic; q cyclic sweeps add ",
      /* @__PURE__ */ jsx18("code", { children: "O(q(n+d)k\xB2)" }),
      ". Reconstructing to measure the objective adds ",
      /* @__PURE__ */ jsx18("code", { children: "O(ndk)" }),
      ". Sequential cache workspace is ",
      /* @__PURE__ */ jsx18("code", { children: "O(k\xB2+max(nk,kd))" }),
      ", alongside the input/factors and a row-block residual buffer. This is an efficient dense reference, not a hardware timing result or a claim that sparse or specialized solvers cannot be better for a different problem."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The implementation below stores only H, immutable ordered feature IDs, fitted stopping settings and diagnostics after fitting. ",
      /* @__PURE__ */ jsx18("code", { children: "transform" }),
      " uses that snapshot to solve new fixed-H amounts; ",
      /* @__PURE__ */ jsx18("code", { children: "inverse_transform" }),
      " multiplies amounts by its H. Changing ",
      /* @__PURE__ */ jsx18("code", { children: "n_components" }),
      " prepares a future fit but does not resize an already fitted model. A new candidate is built in local arrays; only a fully valid candidate replaces the old snapshot. If a fit fails, the earlier dictionary and query behavior remain usable."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The shared array helpers reuse exactly ",
      /* @__PURE__ */ jsx18("code", { children: "real_table" }),
      " from ",
      /* @__PURE__ */ jsxs15("a", { href: "https://ronak.sh/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#4-fit-once-project-and-reconstruct-in-python", children: [
        "PCA's supplied ",
        /* @__PURE__ */ jsx18("code", { children: "centered_pca.py" }),
        ""
      ] }),
      ". That helper copies a finite real two-dimensional table and checks its feature count. We add nonnegativity checks here. We do ",
      /* @__PURE__ */ jsx18("strong", { children: "not" }),
      " call PCA fitting or subtract feature means: doing so would change the data and can introduce negatives."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "Place the supplied Python files in one directory. In a local environment with Python, NumPy, SciPy and scikit-learn, run the program from that directory. The recorded new examples below were executed with Python 3.12.14, NumPy 2.3.5, SciPy 1.18.1 and scikit-learn 1.9.1; these are tested versions, not a promise about every installation." }),
    /* @__PURE__ */ jsx18(CodeBlock, { language: "sh", children: "python -m venv .venv\n# Activate .venv using the command for your shell, then:\npython -m pip install numpy scipy scikit-learn\npython nmf_coordinate.py" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("code", { children: "nmf_arrays.py" }),
      " supplies the shared table contracts and objective reductions. ",
      /* @__PURE__ */ jsx18("code", { children: "frobenius_metrics" }),
      " streams row blocks; ",
      /* @__PURE__ */ jsx18("code", { children: "weighted_half_square" }),
      " evaluates included cells only. Its generalized KL helper uses a short local series when x and y nearly agree, avoiding subtraction of nearly equal first-order terms. That numerical rearrangement preserves the stated cost to floating-point accuracy; it does not introduce a hidden floor. The stable norm scales entries before squaring them. Products outside finite float64 arithmetic are refused with a rescaling message, rather than published as fitted state."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_arrays.py", filename: "nmf_arrays.py", language: "python" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The complete recorded output of ",
      /* @__PURE__ */ jsx18("code", { children: "python nmf_arrays.py" }),
      " follows. The reconstruction has three equal rows because this demonstration uses unit amounts; its whole-table squared residual norm is 12, so the half-square is 6 and the MSE is 12/9. The final two lines separately check an observed zero under KL and included-cell weighting."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_arrays.stdout.txt", filename: "nmf_arrays.stdout.txt", language: "output" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The coordinate program separates ",
      /* @__PURE__ */ jsx18("code", { children: "block_cache" }),
      " from ",
      /* @__PURE__ */ jsx18("code", { children: "coordinate_sweeps" }),
      ". During a fixed-H query, both G and P remain fixed across all sweeps and are formed once. During fitting, changing the opposite factor rebuilds the appropriate cache. ",
      /* @__PURE__ */ jsx18("code", { children: "coordinate_block" }),
      " deliberately changes a writable float64 factor in place; the public fit/encode methods validate and copy caller inputs before using that kernel."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_coordinate.py", filename: "nmf_coordinate.py", language: "python" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The guarded example first prints the hand-traced sweep, then fits the same tiny table by our scratch route and an explicitly configured ordinary ",
      /* @__PURE__ */ jsx18("code", { children: "NMF" }),
      " estimator. Both receive copies of the same W0 and H0. ",
      /* @__PURE__ */ jsx18("code", { children: "init='custom'" }),
      " means those arrays supply the initialization; ",
      /* @__PURE__ */ jsx18("code", { children: "solver='cd'" }),
      " selects coordinate descent, ",
      /* @__PURE__ */ jsx18("code", { children: "beta_loss='frobenius'" }),
      " selects our squared objective, both alphas are zero, and ",
      /* @__PURE__ */ jsx18("code", { children: "shuffle=False" }),
      " makes coordinate order explicit."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The complete recorded stdout starts with that first sweep, then shows the fitted reconstruction, stopping diagnostic, ordinary comparison and empty-query shape:" }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_coordinate.stdout.txt", filename: "nmf_coordinate.stdout.txt", language: "output" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The scratch fit stopped at its declared tolerance after 32 outer sweeps, with half-loss approximately ",
      /* @__PURE__ */ jsx18("code", { children: "2.080268\xD710\u207B\xB9\xB3" }),
      " and combined projected-gradient norm ",
      /* @__PURE__ */ jsx18("code", { children: "6.978496\xD710\u207B\u2077" }),
      ". The ordinary route's half-loss was approximately ",
      /* @__PURE__ */ jsx18("code", { children: "1.422005\xD710\u207B\xB9\u2074" }),
      ", with residual norm ",
      /* @__PURE__ */ jsx18("code", { children: "1.686419\xD710\u207B\u2077" }),
      ". These are outputs from the tiny constructed example, not a real-data performance study. Different stopping implementations can stop at different iterates even from matching inputs. Compare the actual objective, reconstruction, constraints and diagnostics; do not require identical arbitrary factors or infer universal superiority from the smaller final number."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For an independent constrained-block reference, the following complete program calls public SciPy NNLS for each observation row, then for each feature in the transposed problem. Those exact convex block solves differ from taking just one cyclic sweep. Its ",
      /* @__PURE__ */ jsx18("code", { children: "encode_nnls" }),
      " returns both amounts and the ordinary residual norm; ",
      /* @__PURE__ */ jsx18("code", { children: "alternating_nnls" }),
      " records the joint half-loss after each W-then-H pair."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_nnls.py", filename: "nmf_nnls.py", language: "python" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Here is its complete recorded stdout. The signed unconstrained answer, clipped answer and reoptimized NNLS answer remain separate; the last line compares their constrained predictions with the scratch route." }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_nnls.stdout.txt", filename: "nmf_nnls.stdout.txt", language: "output" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Its cone example prints clipped amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1]" }),
      " with half-loss 1/2, NNLS amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[0,0.5]" }),
      " with norm approximately 0.707107, and scratch amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[0,0.5]" }),
      " with zero projected gradient. Their predictions agree. Duplicate or zero patterns need not give unique amounts; compare reconstructed rows, objective and KKT conditions in that case. NNLS's internal active-set work depends on the problem, so these per-row calls are not automatically faster than the batched coordinate route."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Try a changed case before proceeding: keep H0 fixed, start R1 at ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1]" }),
      " and take only the C0 update. You should obtain ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1]" }),
      " and half-loss 3. Now take C1's update using the new 2; you should obtain ",
      /* @__PURE__ */ jsx18("code", { children: "[2,2.5]" }),
      " and half-loss 3/4. Explain why neither step can modify another observation's measurements or the fixed dictionary. The larger practice set in section 19 will ask you to diagnose stale operands, boundary gradients and rejected fitted states without replaying these exact numbers."
    ] }),
    /* @__PURE__ */ jsx18(H2, { children: "7. Explain the multiplicative route" }),
    /* @__PURE__ */ jsx18(Prose, { children: "The coordinate route subtracts a slope-based correction and enforces the nonnegative boundary. Can we instead preserve nonnegativity by multiplying each current entry by a nonnegative corrective ratio?" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Return to X0, W filled with ones and H0. This time give H the first turn." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D24" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Follow the marked pattern entry H[C0,F2]. Its current value is 1. The numerator is 9, the amount-weighted overlap with the observed F2 column. The denominator is 6, the corresponding overlap with the current reconstruction. The ratio is 9/6, so the entry becomes ",
      /* @__PURE__ */ jsx18("code", { children: "1\xD79/6=1.5" }),
      ". The blue and rose component addresses stay attached to both products; the neutral reconstructed bins supply the denominator."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Across the full pattern matrix, the numerator is ",
      /* @__PURE__ */ jsx18("code", { children: "[[3,6,9],[3,6,9]]" }),
      ", the denominator is ",
      /* @__PURE__ */ jsx18("code", { children: "[[3,3,6],[3,3,6]]" }),
      ", and the new H is ",
      /* @__PURE__ */ jsx18("code", { children: "[[1,0,1.5],[0,2,1.5]]" }),
      ". A zero entry remains zero when multiplied by a finite ratio. Nonzero entries can grow or shrink. Every entry in this H block uses the same old W and H: it is a simultaneous block update, unlike section 5's fresh-within-sweep cyclic coordinates."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The Frobenius multiplicative updates are" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "H\\leftarrow H\\odot\\frac{W^TX}{W^TWH},\\qquad\nW\\leftarrow W\\odot\\frac{XH^T}{WHH^T}." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The symbol \u2299 means elementwise multiplication, and the fraction means elementwise division of equally shaped tables. The H numerator and denominator both have shape ",
      /* @__PURE__ */ jsx18("code", { children: "k\xD7d" }),
      "; the W pair both have shape ",
      /* @__PURE__ */ jsx18("code", { children: "n\xD7k" }),
      ". In the second formula, H is the ",
      /* @__PURE__ */ jsx18("strong", { children: "new H from the first formula" }),
      ". The amount update then gives"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "W_1=\\begin{bmatrix}13/11&13/17\\\\14/11&24/17\\\\6/11&14/17\\end{bmatrix}." }) }),
    /* @__PURE__ */ jsx18(Prose, { children: "The resulting half-loss is approximately 0.743659. Section 6's one coordinate sweep ended at approximately 0.440759, but it used a different block order and different block updates. Those two numbers illustrate the specified operations; one comparison on a constructed table cannot rank optimizers in general." }),
    /* @__PURE__ */ jsx18(Prose, { children: "To trace H-first order without initial zeros, switch explicitly to this second constructed table and its supplied positive factors:" }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D25" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The three observations are now ",
      /* @__PURE__ */ jsx18("code", { children: "[[2,1,3],[1,2,3],[3,3,6]]" }),
      ". Initial amounts are ",
      /* @__PURE__ */ jsx18("code", { children: "[[1,1/2],[1/2,1],[1,1]]" }),
      "; initial patterns are ",
      /* @__PURE__ */ jsx18("code", { children: "[[1,1/5,4/5],[1/5,1,4/5]]" }),
      ". The first stage produces pattern rows ",
      /* @__PURE__ */ jsx18("code", { children: "[110/53,20/49,42/17]" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "[20/49,110/53,42/17]" }),
      ". The next stage's amount denominator uses those updated patterns, not their starting values. The displayed W entries become approximately ",
      /* @__PURE__ */ jsx18("code", { children: "[0.826888,0.393655]" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "[0.393655,0.826888]" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "[1.212145,1.212145]" }),
      "."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Following the literal arrays through the two ports reduces half-loss from 17.06 to approximately 0.03944744 in this one outer update. The stepper exposes both factor states so you can check the changed operands. The complete ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_step.py" }),
      " example supplies a longer recorded run of this same fixture; the single-step picture describes this calculation, not a fabricated intermediate training history."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "What happens if we repeat that same H-first sweep forty times?" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The following complete original ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_step.py" }),
      " keeps D25's three observations and positive starting factors. Save it in the same local Python environment as the other supplied files and run ",
      /* @__PURE__ */ jsx18("code", { children: "python nmf_step.py" }),
      " deliberately. It needs NumPy only; it does not fetch data or call a library NMF estimator."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_step.py", filename: "nmf_step.py", language: "python" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Read the two assignments in order. The first computes every H multiplier from the old W/H and then changes H in place. The next computes W's multipliers using that ",
      /* @__PURE__ */ jsx18("strong", { children: "new H" }),
      ". The loop prints the initial half-loss, then only sweeps 1, 2, 10 and 40; the unprinted sweeps still occur. Here is the original recorded output, preserved rather than rerun:"
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_step.retained.stdout.txt", filename: "nmf_step.retained.stdout.txt", language: "output" }),
    /* @__PURE__ */ jsx18(Prose, { children: "At printed sweep 1 the loss is 0.03944744, the rounded result of D25's literal one-step calculation. By sweep 40 the printed loss is 5\xD710\u207B\u2078, small but not an exact zero or a convergence certificate. The program runs a fixed number of sweeps and prints no projected-gradient diagnostic; it neither proves the best joint factorization nor establishes that its factors equal the ones from section 1. Its observations and initial factors are the separately announced D25 fixture, and scale/nonuniqueness remain possible." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "This short historical positive-input demonstration intentionally exposes the two array updates without general shape, domain, overflow or stopping checks. The complete validated ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_multiplicative.py" }),
      " route later in this section supplies those contracts. Do not add a hidden epsilon or reinterpret this retained rounded output as a newly executed benchmark. Its code and output are the original preserved example; the newly authored robust route and its independently labelled streams have their own evidence."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "Does multiplication automatically solve the boundary problem?" }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D26" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Keep a fixed other contribution of 1 and a measured target of 2. The editable amount w adds directly, so the prediction is w+1. At w=0, the multiplicative ratio is ",
      /* @__PURE__ */ jsx18("code", { children: "2/(w+1)=2" }),
      ", yet the new amount is still ",
      /* @__PURE__ */ jsx18("code", { children: "0\xD72=0" }),
      ". The half-loss stays 1/2 and the slope is \u22121. Increasing w is feasible and lowers the loss: this state fails the KKT test from section 5. Coordinate minimization instead chooses w=1 and loss zero."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "At w=1/4, the multiplicative step gives ",
      /* @__PURE__ */ jsx18("code", { children: "(1/4)\xD72/(5/4)=2/5" }),
      ", while the exact coordinate step still gives 1. At w=1, both stay at the optimum. The persistent comparison shows ",
      /* @__PURE__ */ jsx18("strong", { children: "zero locking" }),
      ": multiplicative updates cannot revive an exact zero through a finite multiplier. No-loss-change alone therefore cannot certify stationarity. A positive initialization avoids this particular initial lock but does not guarantee the best joint solution."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The denominators in that example are positive. A different boundary deserves an explicit convention: if numerator and denominator are both zero, our code retains that entry as a flat update. A positive numerator over zero denominator is refused. We do not add an epsilon and pretend the original objective was unchanged. Supported finite positive multiplication can also underflow after many steps toward zero; the reference reports that numerical refusal rather than silently certifying a minimum. The loss trace and projected gradient remain separate diagnostics." }),
    /* @__PURE__ */ jsx18(Prose, { children: "Section 3 introduced a count-oriented loss. What does its corrective ratio mean?" }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D27" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Two components each contribute rate 1, giving total predicted rate 2 in one bin. For observed count 4, their equal shares allocate 2 counts to each component. For count 2, each receives 1. For observed count zero, both receive zero, while the KL cost is still the predicted rate 2. The count control changes the observation; the two modelled contributions remain fixed, so there is no hidden refit during the allocation picture." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "In general, component c's fraction of a positive predicted rate Y_ij is ",
      /* @__PURE__ */ jsx18("code", { children: "W_ic H_cj / Y_ij" }),
      ". Multiplying by X_ij allocates the observed count proportionally. These nonnegative allocations sum to the observed count for that cell. They are a useful explanation of a KL update; they are not probabilities that an observation belongs to a class."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "Let Y=WH and let Q be the elementwise count/rate ratio X/Y, with Q=0 where both observed count and predicted rate are zero. Generalized-KL multiplicative updates use" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "H_{cj}\\leftarrow H_{cj}\\frac{(W^TQ)_{cj}}{\\sum_iW_{ic}},\\qquad\nW_{ic}\\leftarrow W_{ic}\\frac{(QH^T)_{ic}}{\\sum_jH_{cj}}." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Recompute Y and Q after H changes, before updating W. For positive X_ij and zero Y_ij, the loss is infinite, so our supported finite route refuses the calculation. For X_ij=0 and Y_ij>0, the ratio is zero, but the cell still contributes Y_ij to KL. The gradient of a supported cell with respect to its predicted rate is ",
      /* @__PURE__ */ jsx18("code", { children: "1\u2212X_ij/Y_ij" }),
      "; multiplying this rate-gradient table by the appropriate factor gives the W and H gradients and their projected-gradient diagnostic."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Here is the complete Frobenius/KL route. ",
      /* @__PURE__ */ jsx18("code", { children: "multiplicative_sweep" }),
      " returns new factors, H first. ",
      /* @__PURE__ */ jsx18("code", { children: "fit_multiplicative" }),
      " returns one complete read-only fitted snapshot; it does not gradually publish partly updated state. The snapshot retains ordered features and loss/stopping settings. Its ",
      /* @__PURE__ */ jsx18("code", { children: "transform" }),
      " changes only new amounts; its ",
      /* @__PURE__ */ jsx18("code", { children: "inverse_transform" }),
      " reconstructs them. Fixed-H Frobenius queries retain their Gram/cross products across repeated updates, whereas KL queries recompute their changing rate ratios."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_multiplicative.py", filename: "nmf_multiplicative.py", language: "python" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For Frobenius, Gram/cross contractions give dense outer-update cost ",
      /* @__PURE__ */ jsx18("code", { children: "O(ndk+(n+d)k\xB2)" }),
      ". The KL route constructs its ",
      /* @__PURE__ */ jsx18("code", { children: "n\xD7d" }),
      " prediction and ratio tables and multiplies them with the factors, costing ",
      /* @__PURE__ */ jsx18("code", { children: "O(ndk)" }),
      " per dense block and requiring that ",
      /* @__PURE__ */ jsx18("code", { children: "n\xD7d" }),
      " workspace. These choices expose the actual mechanism and its memory cost. Very sparse counts or larger-than-memory tables call for a sparse or blocked implementation with the same support semantics, not an unannounced switch in the objective."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The ordinary route uses ",
      /* @__PURE__ */ jsx18("code", { children: "NMF(solver='mu', init='custom', ...)" }),
      ". The spelling ",
      /* @__PURE__ */ jsx18("code", { children: "beta_loss='frobenius'" }),
      " selects squared error; ",
      /* @__PURE__ */ jsx18("code", { children: "'kullback-leibler'" }),
      " selects generalized KL. Both alphas are zero here. We give scratch and ordinary fits copies of the same inputs and initial factors, then recompute the chosen objective from their returned factors. Their internal block order and stopping rules need not match, so neither identical iterates nor one-step parity is promised."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The recorded Frobenius example reached the 2,000-iteration cap with scratch half-loss approximately ",
      /* @__PURE__ */ jsx18("code", { children: "4.152819\xD710\u207B\u2077" }),
      " and projected-gradient norm ",
      /* @__PURE__ */ jsx18("code", { children: "0.001245492" }),
      "; the ordinary half-loss was approximately ",
      /* @__PURE__ */ jsx18("code", { children: "4.135019\xD710\u207B\u2077" }),
      ", with its cap warning retained. Those small losses are not declarations that the tolerance was reached."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "This complete retained stdout belongs to the original Frobenius portion of this demonstration. Its subsequent zero-containing KL run refused numerical underflow; that failure and its diagnostic stream remain retained. The current positive shifted KL comparison is shown separately below, so this block does not claim that the changed current full main was rerun." }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_multiplicative.stdout.txt", filename: "nmf_multiplicative.stdout.txt", language: "output" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For the runnable KL comparison, explicitly add ",
      /* @__PURE__ */ jsx18("code", { children: "[0.5,0.25,0.75]" }),
      " to each X0 row. This is an additional 1/2 unit of C0 and 1/4 unit of C1, so it keeps the additive mechanism while making all three measured bins positive. The table becomes ",
      /* @__PURE__ */ jsx18("code", { children: "[[2.5,1.25,3.75],[1.5,3.25,4.75],[0.5,2.25,2.75]]" }),
      ". This comparison isolates the optimizer from the long-run zero-boundary underflow illustrated by the original zero-containing run. KL itself still supports observed zeros with the conventions just taught."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Run this comparison alone with ",
      /* @__PURE__ */ jsx18("code", { children: "python nmf_multiplicative.py --loss kl" }),
      ". In the recorded execution, scratch reached its stationarity tolerance after 98 outer updates with KL approximately ",
      /* @__PURE__ */ jsx18("code", { children: "8.699385\xD710\u207B\xB9\xB3" }),
      "; the ordinary objective was approximately ",
      /* @__PURE__ */ jsx18("code", { children: "7.585221\xD710\u207B\xB9\u2076" }),
      ". Both empty-query encodings had shape ",
      /* @__PURE__ */ jsx18("code", { children: "(0,2)" }),
      ". These results belong to the positive shifted table, not X0 or the recorded digit study."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The complete stdout of that separately executed ",
      /* @__PURE__ */ jsx18("code", { children: "--loss kl" }),
      " comparison is:"
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/positive-kl.stdout.txt", filename: "positive-kl.stdout.txt", language: "output" }),
    /* @__PURE__ */ jsx18(Prose, { children: "We now have the update formulas, their literal operands and a concrete failure at a boundary. The next question is why a supported multiplicative step can lower its objective\u2014and exactly what that descent argument does not prove." }),
    /* @__PURE__ */ jsx18(H2, { children: "8. Why the upper bound gives a safe step" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Section 7 showed what a multiplicative update does. What makes a supported step a descent step rather than merely a plausible correction?" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Keep H0 fixed and the second amount equal to 1; only the first amount can move." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D28" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The horizontal position is a candidate first amount z. The measured row remains ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1,3]" }),
      "; the reconstructed row is ",
      /* @__PURE__ */ jsx18("code", { children: "[z,1,z+1]" }),
      ". Its half-squared loss is therefore ",
      /* @__PURE__ */ jsx18("code", { children: "(z\u22122)\xB2" }),
      ", the lower curve. The current amount a marks where the upper curve touches it. Both curves have the same height and slope there, but the upper curve rises more rapidly away from that point."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "At a=1, the loss is 1. The upper curve's minimum is at z=5/3. Moving there lowers the upper curve to 1/3 and the actual loss further to 1/9. The three marked heights tell us why this is safe: the new actual loss cannot exceed the new upper bound, and minimizing that bound cannot exceed its old touching height. The amount control moves the touching point and rebuilds the bound; it does not change the measurements or H0. At a=2, both curves are minimized at the current amount, so there is no move." }),
    /* @__PURE__ */ jsx18(Prose, { children: "Here is the exact upper curve shown in the picture:" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "\\begin{aligned}\nf(z)&=(z-2)^2,\\\\\nQ(z\\mid a)&=f(a)+2(a-2)(z-a)\n+\\tfrac12\\left(2+\\frac1a\\right)(z-a)^2,\\qquad a>0,\\\\\nQ(z\\mid a)-f(z)&=\\frac{(z-a)^2}{2a}\\ge0.\n\\end{aligned}" }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The vertical bar in ",
      /* @__PURE__ */ jsx18("code", { children: "Q(z|a)" }),
      " means \u201Cevaluate candidate z while keeping the bound's current touching point a fixed.\u201D It is not a conditional probability. The last line proves that the upper curve really stays above the loss for every candidate z, rather than merely looking that way in a plot. Its derivative vanishes at ",
      /* @__PURE__ */ jsx18("code", { children: "z=a\xD75/(2a+1)" }),
      ", exactly the fixed-H multiplicative amount update. Our supported figure uses a between 1/4 and 2, so it never divides by a zero current amount."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "This method is called ",
      /* @__PURE__ */ jsx18("strong", { children: "majorization\u2013minimization" }),
      ", or MM. ",
      /* @__PURE__ */ jsx18("em", { children: "Majorize" }),
      " means construct an upper function that touches the original at the current state; ",
      /* @__PURE__ */ jsx18("em", { children: "minimize" }),
      " means lower that upper function while holding its construction fixed. The upper function is also called an ",
      /* @__PURE__ */ jsx18("strong", { children: "auxiliary function" }),
      ". If a new state is chosen this way,"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "f(z_{\\rm new})\\le Q(z_{\\rm new}\\mid a)\n\\le Q(a\\mid a)=f(a)." }) }),
    /* @__PURE__ */ jsx18(Prose, { children: "The logic even permits a step that lowers, rather than fully minimizes, the upper function. It proves a loss inequality. It does not say that the new state is a global minimum, or that an unchanged state passes the boundary KKT test." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The scalar picture fixed the other amount. Why can a ",
      /* @__PURE__ */ jsx18("em", { children: "diagonal" }),
      " upper bound safely update all amounts at once, although the patterns overlap?"
    ] }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D29" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Blue and rose amounts share F2, so changing one can affect the usefulness of changing the other. Their overlap matrix is G=",
      /* @__PURE__ */ jsx18("code", { children: "[[2,1],[1,2]]" }),
      ". At current amounts v=",
      /* @__PURE__ */ jsx18("code", { children: "[1,1]" }),
      ", the diagonal bound uses K=",
      /* @__PURE__ */ jsx18("code", { children: "[[3,0],[0,3]]" }),
      ": each coordinate gets extra curvature. The difference K\u2212G is ",
      /* @__PURE__ */ jsx18("code", { children: "[[1,\u22121],[\u22121,1]]" }),
      ". For proposed increments \u03940 and \u03941, its quadratic form is ",
      /* @__PURE__ */ jsx18("code", { children: "(\u03940\u2212\u03941)\xB2" }),
      ". Increments ",
      /* @__PURE__ */ jsx18("code", { children: "[1,0]" }),
      " give 1; equal increments ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1]" }),
      " give zero. The shaded square is the extra curvature, not a residual-error square from section 3."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "We can now prove the general fixed-H result. Treat one amount row as a column vector w for this derivation, and write its current positive values as v. Define" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "G=HH^T,\\qquad p=Hx^T,\\qquad\nK_{cc}=\\frac{(Gv)_c}{v_c},\\quad K_{cd}=0\\;(c\\ne d)." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "These are the same Gram and cross products from section 5, with the cross row transposed to match our temporary column notation. The fixed-H loss has gradient ",
      /* @__PURE__ */ jsx18("code", { children: "Gv\u2212p" }),
      " and Hessian G. A Hessian is the matrix of second derivatives: here it describes how the slope of one amount changes when another amount changes. Because the loss is quadratic, its expansion around v is exact. Replacing G by K gives"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "Q(w\\mid v)=f(v)+(w-v)^T(Gv-p)\n+\\tfrac12(w-v)^TK(w-v)." }) }),
    /* @__PURE__ */ jsx18(Prose, { children: "Every entry of G is nonnegative because H is nonnegative. For an arbitrary increment vector \u0394," }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "\\Delta^T(K-G)\\Delta\n=\\tfrac12\\sum_{c,d}G_{cd}v_cv_d\n\\left(\\frac{\\Delta_c}{v_c}-\\frac{\\Delta_d}{v_d}\\right)^2\\ge0." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Each summand is a nonnegative weight times a square. Expanding the square gives the diagonal terms from K and the cross terms from \u2212G. This is what ",
      /* @__PURE__ */ jsx18("strong", { children: "positive semidefinite" }),
      ", abbreviated PSD, means for K\u2212G: its quadratic form is never negative. Consequently ",
      /* @__PURE__ */ jsx18("code", { children: "Q\u2212f" }),
      " is nonnegative for every increment. At w=v the gap and first derivative of the gap are zero, establishing touching as well as upper-bounding."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Since K is diagonal, its bound separates into one quadratic per amount. Assuming a positive current v and positive ",
      /* @__PURE__ */ jsx18("code", { children: "(Gv)c" }),
      ", minimize each one:"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "w_c^{\\rm new}=v_c-\\frac{(Gv-p)_c}{K_{cc}}\n=v_c\\frac{p_c}{(Gv)_c}." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The nonnegative numerator makes this a feasible nonnegative update. This establishes the Frobenius rule from section 7 without treating overlapping coordinates as independent in the original loss. A zero numerator can take the new amount to zero; this positive-current derivation does not justify dividing by that new zero on a subsequent step. Refer back to ",
      /* @__PURE__ */ jsx18("strong", { children: "zero locking" }),
      " and the flat/support conventions for that boundary. Transpose the same argument for the H block, then compose the two blockwise inequalities for a full supported outer sweep."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "Does the Frobenius proof establish every multiplicative rule for every loss?" }),
    /* @__PURE__ */ jsx18(Prose, { children: "We can join section 3's losses with a shape parameter called beta (\u03B2); its value also changes the safe update power." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D30" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The first comparison deliberately fixes one positive corrective ratio at 4 and the old coordinate at 1. It isolates the exponent: at beta=0, MM multiplies by ",
      /* @__PURE__ */ jsx18("code", { children: "4^(1/2)=2" }),
      ", whereas an exponent-one heuristic multiplies by 4. Throughout beta from 1 to 2, both use power 1. At beta=3, MM again uses power 1/2. The two output bars remain visible together; beta changes the power in this illustration, not a hidden NMF dataset or a freshly estimated ratio."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The deeper panel explains where that power comes from. A reconstructed bin is a sum of component contributions. At the current positive state, divide each contribution by the bin's total to obtain nonnegative shares that sum to 1. A curve bending upward, called convex, lies below the share-weighted chord joining its component arguments. A curve bending downward, called concave, lies below its tangent: the straight line with the same height and slope at the current argument. These two labelled upper bounds let us separate the components while still touching at the current state. Their arrows refer to a bound construction, not to a new data-generation process." }),
    /* @__PURE__ */ jsx18(Prose, { children: "The beta family has the following cell cost:" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "d_\\beta(x,y)=\n\\begin{cases}\n\\dfrac{x^\\beta+(\\beta-1)y^\\beta-\\beta xy^{\\beta-1}}\n{\\beta(\\beta-1)},&\\beta\\notin\\{0,1\\},\\\\\nx\\log(x/y)-x+y,&\\beta=1,\\\\\nx/y-\\log(x/y)-1,&\\beta=0.\n\\end{cases}" }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "At \u03B2=2, the first branch is exactly half-squared error. The separate branches at 1 and 0 are the continuous limits; substituting 1 or 0 into the general fraction would divide by zero. Summing this cell loss over observations and features defines ",
      /* @__PURE__ */ jsx18("code", { children: "D_beta(X,WH)" }),
      ". For this derivation and the new general-beta implementation, all observations, factors and reconstructions are strictly positive. That deliberately narrower implementation contract does not erase Frobenius or KL's wider mathematical zero support."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For a fixed-H amount block, let Y=WH and define two nonnegative tables with shape ",
      /* @__PURE__ */ jsx18("code", { children: "n\xD7k" }),
      ":"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "B=(X\\odot Y^{\\beta-2})H^T,\\qquad\nA=Y^{\\beta-1}H^T." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Powers act cell by cell. A is the positive contribution to the gradient, B the subtracted contribution, so the amount gradient is A\u2212B. At \u03B2=2, B is XH\u1D40 and A is WHH\u1D40. At \u03B2=1, B is ",
      /* @__PURE__ */ jsx18("code", { children: "(X/Y)H\u1D40" }),
      " and A is the sum of each pattern across features. The new family therefore connects to the exact products already taught, rather than introducing unrelated operators."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For one coordinate, hold its current amount v fixed and write a candidate amount as ",
      /* @__PURE__ */ jsx18("code", { children: "v\xD7r" }),
      ", where r is its positive multiplier. Decomposing the beta loss into convex and concave parts, then applying the chord and tangent bounds from the panel, gives the following auxiliary-function derivatives with respect to the candidate amount:"
    ] }),
    /* @__PURE__ */ jsx18(Table, { caption: "8. Why the upper bound gives a safe step", headers: [/* @__PURE__ */ jsx18(Fragment9, { children: "Beta range" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Bound derivative" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Positive root r" })], rows: [[/* @__PURE__ */ jsx18(Fragment9, { children: "\u03B2<1" }), /* @__PURE__ */ jsx18(Fragment9, { children: "A\u2212B r^(\u03B2\u22122)" }), /* @__PURE__ */ jsx18(Fragment9, { children: "(B/A)^(1/(2\u2212\u03B2))" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "1\u2264\u03B2\u22642" }), /* @__PURE__ */ jsx18(Fragment9, { children: "A r^(\u03B2\u22121)\u2212B r^(\u03B2\u22122)" }), /* @__PURE__ */ jsx18(Fragment9, { children: "B/A" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "\u03B2>2" }), /* @__PURE__ */ jsx18(Fragment9, { children: "A r^(\u03B2\u22121)\u2212B" }), /* @__PURE__ */ jsx18(Fragment9, { children: "(B/A)^(1/(\u03B2\u22121))" })]] }),
    /* @__PURE__ */ jsx18(Prose, { children: "Here A and B mean the selected entries of the tables computed at the old state; they are not recomputed while solving this scalar bound. Every derivative agrees with A\u2212B at r=1, as touching requires. Setting it to zero gives the root in the last column. This is the source of the piecewise power, not a numerical damping constant chosen by trial and error:" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "W\\leftarrow W\\odot(B/A)^{\\gamma(\\beta)},\\qquad\n\\gamma(\\beta)=\n\\begin{cases}\n1/(2-\\beta),&\\beta<1,\\\\\n1,&1\\le\\beta\\le2,\\\\\n1/(\\beta-1),&\\beta>2.\n\\end{cases}" }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For \u03B2<1, the observation-dependent part of the loss is convex and its other y-dependent part is concave; for \u03B2>2 their roles switch. In the middle range, the whole cell loss is convex in y. At \u03B2=0 or 1, use the corresponding limiting loss and derivative. The actual shares are ",
      /* @__PURE__ */ jsx18("code", { children: "v_c H_cj / Y_ij" }),
      "; weighting the convex bounds by those shares yields component-separated terms, while a tangent handles the concave term. This explains both the derivative table and why the Frobenius diagonal-quadratic proof should not simply be asserted for another loss."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("a", { href: "https://arxiv.org/pdf/1010.1763", children: "F\xE9votte and Idier's MM construction" }),
      " supplies this beta-dependent update. A different exponent does not imply that the exponent-one heuristic always increases loss: that paper also establishes its monotonicity across \u03B2\u2208[0,2] by a separate argument. The implementation here chooses the auxiliary function's minimizing rule. Minimizing a bound is still distinct from certifying a stationary point or the best joint factorization. Outside the middle range, even a fixed-factor beta objective need not be convex."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Here is the complete general-beta route. It supports real beta between 0 and 3, including fractional values; wider values need a separately reviewed numerical-domain extension. ",
      /* @__PURE__ */ jsx18("code", { children: "beta_sweep" }),
      " performs a simultaneous H block, then a W block using the new H. ",
      /* @__PURE__ */ jsx18("code", { children: "fit_beta" }),
      " returns a complete read-only snapshot, feature order and explicit stopping status. ",
      /* @__PURE__ */ jsx18("code", { children: "transform" }),
      " holds H fixed and reuses section 7's explained KL or Gram-cached Frobenius encoder for the exact \u03B2=1 or 2 cases. Other supported beta values use the newly derived block. There is no opaque library NMF call inside the scratch algorithm."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_beta_mm.py", filename: "nmf_beta_mm.py", language: "python" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Read the complete recorded stdout by beta value. Each branch begins from the same displayed positive observations. The ",
      /* @__PURE__ */ jsx18("code", { children: "scratch" }),
      " tuple reports update count, objective and projected-gradient norm; ",
      /* @__PURE__ */ jsx18("code", { children: "ordinary_loss" }),
      " is recomputed from the ordinary factors, and ",
      /* @__PURE__ */ jsx18("code", { children: "empty_query" }),
      " checks the fixed-dictionary query shape. The cap and tolerance labels are part of the result."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_beta_mm.stdout.txt", filename: "nmf_beta_mm.stdout.txt", language: "output" }),
    /* @__PURE__ */ jsx18(Prose, { children: "The code keeps beta=2, 1 and 0 loss branches explicit. Near x=y, it evaluates the small relative-difference series rather than subtracting almost equal powers. Near the removable beta=0/1 singularities, non-near-equal cells use a high-precision decimal fallback; this rare branch costs more than vectorized float arithmetic. Nonfinite or lost positive arithmetic is refused without publishing partial fitted state. No artificial positive floor is concealed in the original objective." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For non-Frobenius beta, each dense block forms an ",
      /* @__PURE__ */ jsx18("code", { children: "n\xD7d" }),
      " reconstruction and weighted cell tables, then contracts them with a factor: ",
      /* @__PURE__ */ jsx18("code", { children: "O(ndk)" }),
      " arithmetic and ",
      /* @__PURE__ */ jsx18("code", { children: "O(nd)" }),
      " temporary cell workspace. The exact Frobenius update uses Gram products, as in section 7. Loss and gradient diagnostics have their own contractions; retaining history adds storage proportional to the number of recorded outer sweeps. These are implementation costs, not benchmark evidence or a universal fastest-solver claim."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The new example explicitly uses positive observations ",
      /* @__PURE__ */ jsx18("code", { children: "[[2.2,1.4,3],[1.6,3.2,4],[0.9,2.1,2.5]]" }),
      ", constructed from positive two-component factors. Its ordinary route is public ",
      /* @__PURE__ */ jsx18("code", { children: "NMF(solver='mu', beta_loss=beta, init='custom', ...)" }),
      ", with both alphas zero and copies of the same starting W and H. It recomputes the actual chosen loss from both returned reconstructions. The library's generic reported reconstruction error is not substituted for this loss."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "In the recorded execution, beta=0 reached the 100-update cap with scratch IS loss approximately ",
      /* @__PURE__ */ jsx18("code", { children: "4.094054\xD710\u207B\xB9\u2070" }),
      "; beta=1 reached scratch stationarity tolerance at update 82 with KL approximately ",
      /* @__PURE__ */ jsx18("code", { children: "4.625565\xD710\u207B\xB9\xB3" }),
      "; beta=2 reached the cap with half-squared loss approximately ",
      /* @__PURE__ */ jsx18("code", { children: "2.797262\xD710\u207B\xB9\xB2" }),
      ". The corresponding ordinary losses were approximately ",
      /* @__PURE__ */ jsx18("code", { children: "2.195754\xD710\u207B\xB9\u2070" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "5.242448\xD710\u207B\xB9\u2076" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "6.424896\xD710\u207B\xB9\xB3" }),
      ". All three ordinary cap warnings are retained with the actual output. Those outcomes belong to this constructed positive table, not the saved digit study. An iteration cap and a tolerance stop have different meanings even when both produce small losses."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "For a changed case, take \u03B2=0, old amount 1 and corrective ratio 9. The MM multiplier is 3; the exponent-one heuristic multiplier is 9. Explain why this calculation isolates the exponent and cannot predict the next step after the full factor matrices and their ratios change. Then return to the Frobenius bound: if a=2, why must the marked minimizer remain at 2?" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "We now know how the current positive state controls a safe bound. The next question is how to choose the ",
      /* @__PURE__ */ jsx18("em", { children: "first" }),
      " state without introducing negative entries or silently changing NMF into centered PCA."
    ] }),
    /* @__PURE__ */ jsx18(H2, { children: "9. Initialize without silently importing PCA centering" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Section 8 explained how to improve a current factorization. Where should its first amounts and patterns come from? We want a starting point that uses the observations' structure, stays nonnegative and leaves the chosen solver able to move." }),
    /* @__PURE__ */ jsx18(Prose, { children: "Can we simply use the PCA program we already learned?" }),
    /* @__PURE__ */ jsx18(Prose, { children: "PCA's subtraction changes the object being factorized." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D31" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The left table is our original X0: rows ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1,3]" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "[1,3,4]" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "[0,2,2]" }),
      ". The feature means are ",
      /* @__PURE__ */ jsx18("code", { children: "[1,2,3]" }),
      ". Subtract those means, as ",
      /* @__PURE__ */ jsx18("a", { href: "https://ronak.sh/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#4-fit-once-project-and-reconstruct-in-python", children: "PCA's fit-and-reconstruct route" }),
      " does, and the right table becomes ",
      /* @__PURE__ */ jsx18("code", { children: "[[1,-1,0],[0,1,1],[-1,0,-1]]" }),
      ". Follow R0,F1: the measured value 1 becomes a deviation of -1 from its mean 2. The signed arrow points below zero; the original intensity bar does not."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "PCA learns directions for deviations and stores the mean so it can add it back on reconstruction. This lesson's NMF learns additive contributions to the original nonnegative measurements. A centered negative cell cannot be reconstructed by adding nonnegative amounts of nonnegative patterns. Adding a different offset or scaling all values into a nonnegative interval creates another representation; its physical interpretation must be explained separately. It is not the same operation as PCA centering." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "We can reuse a lower-level operation from PCA: ",
      /* @__PURE__ */ jsx18("strong", { children: "singular value decomposition" }),
      ", or SVD. It expresses a matrix as a sum of simple column-times-row terms. Here we apply it to X itself, without subtracting its means. The public NumPy operation ",
      /* @__PURE__ */ jsx18("code", { children: "np.linalg.svd(X, full_matrices=False)" }),
      " is the maintained numerical primitive; the construction of nonnegative factors around that operation is our implementation."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "How can signed SVD directions help us build nonnegative parts?" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Keep the positive rectangles of a signed outer product, then retain one of those rectangles as a component." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D32" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "We temporarily switch from X0 to a constructed two-feature table, ",
      /* @__PURE__ */ jsx18("strong", { children: "X_t = [[8.2,2.4],[2.4,6.8]]" }),
      ", so every step is visible. Call its two observation rows T0 and T1; their features are F0 and F1. These are different observations from the old three-feature rows. Its first SVD term has strength 10 and left and right directions ",
      /* @__PURE__ */ jsx18("code", { children: "[0.8,0.6]" }),
      ". Multiplying the direction column by its direction row and then by 10 gives ",
      /* @__PURE__ */ jsx18("code", { children: "[[6.4,4.8],[4.8,3.6]]" }),
      ". The second term has strength 5 and directions ",
      /* @__PURE__ */ jsx18("code", { children: "[0.6,-0.8]" }),
      "; it gives ",
      /* @__PURE__ */ jsx18("code", { children: "[[1.8,-2.4],[-2.4,3.2]]" }),
      ". Add the two tables cell by cell to recover X_t. These are known singular pairs of this constructed table; the later program also computes its SVD."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The signed bars are entries of a direction, not NMF amounts. The second term adds 1.8 in the top-left corner and 3.2 in the bottom-right corner, but subtracts 2.4 in both off-diagonal cells. Those subtractions are legal for SVD and forbidden for an NMF component. In the positive-part view, the two negative off-diagonal cells become zero. Two separate positive rectangles remain. Rose identifies this second term consistently with C1 in its factors; solid and hatched outlines distinguish the positive-pair and negative-pair candidates. Plus and minus labels explain their origin, so colour is not the only distinction." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Let u be a unit-length left direction, v a unit-length right direction, and \u03C3 its nonnegative strength, called a ",
      /* @__PURE__ */ jsx18("strong", { children: "singular value" }),
      ". The term is ",
      /* @__PURE__ */ jsx18("code", { children: "\u03C3 u v\u1D40" }),
      ". The superscript T turns a column into a row. For a table with n observations and d features, economy SVD returns U with shape ",
      /* @__PURE__ */ jsx18("code", { children: "n\xD7m" }),
      ", singular values s with length m and Vh with shape ",
      /* @__PURE__ */ jsx18("code", { children: "m\xD7d" }),
      ", where ",
      /* @__PURE__ */ jsx18("code", { children: "m=min(n,d)" }),
      ". Column c of U and row c of Vh supply one pair. The cth singular value supplies its strength:"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "X=\\sum_{c=1}^{m}\\sigma_c u_c v_c^T,\n\\qquad \\sigma_1\\ge\\sigma_2\\ge\\cdots\\ge0." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The ",
      /* @__PURE__ */ jsx18("strong", { children: "rank" }),
      " counts independent row or column directions: directions that cannot be built by combining the others. A nonzero column-times-row term has rank one; a sum of k such terms has rank at most k. Keeping the largest k SVD terms is a best rank-at-most-k approximation under squared error when signs are allowed. Replacing those signed terms with nonnegative pieces changes that problem. Its output will be a useful candidate start for constrained optimization, rather than the already-solved NMF problem."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "To identify the two rectangles, split each direction into two nonnegative pieces. The ",
      /* @__PURE__ */ jsx18("strong", { children: "positive piece" }),
      " keeps entries above zero. The ",
      /* @__PURE__ */ jsx18("strong", { children: "negative piece" }),
      " keeps the magnitudes of entries below zero; it does not contain negative numbers. Thus ",
      /* @__PURE__ */ jsx18("code", { children: "u = u_plus - u_minus" }),
      ". For ",
      /* @__PURE__ */ jsx18("code", { children: "[0.6,-0.8]" }),
      ", those pieces are ",
      /* @__PURE__ */ jsx18("code", { children: "[0.6,0]" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "[0,0.8]" }),
      ". Do the same for v. Multiplying the two differences gives four terms:"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "uv^T=u_+v_+^T+u_-v_-^T-u_+v_-^T-u_-v_+^T." }) }),
    /* @__PURE__ */ jsx18(Prose, { children: "The first two terms have matching signs and are positive; the cross-sign terms subtract. Because the positive and negative pieces occupy disjoint entries, their outer products occupy disjoint rectangles. Consequently the positive part of the original outer product is exactly" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "(uv^T)_+=u_+v_+^T+u_-v_-^T." }) }),
    /* @__PURE__ */ jsx18(Prose, { children: "This explains a useful surprise in the picture: the original signed table has rank one, but its positive part can have rank two. Here both diagonal rectangles are nonzero, so neither one alone reconstructs the positive-part table. Clipping negative cells and retaining one component are two different operations." }),
    /* @__PURE__ */ jsx18(Prose, { children: "Which of those two positive rectangles should one component retain?" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Compare the sizes of the paired pieces, keeping both candidates visible." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D33" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "At the default setting, u and v are both ",
      /* @__PURE__ */ jsx18("code", { children: "[0.6,-0.8]" }),
      ". The positive pieces have lengths 0.6 and 0.6, giving paired size ",
      /* @__PURE__ */ jsx18("code", { children: "0.6\xD70.6=0.36" }),
      ". The negative pieces have lengths 0.8 and 0.8, giving paired size ",
      /* @__PURE__ */ jsx18("code", { children: "0.8\xD70.8=0.64" }),
      ". Multiplying by \u03C3=5 gives candidate strengths 1.8 and 3.2. Retain the negative-pair rectangle, which contains the larger contribution. Its NMF factors are the nonnegative column ",
      /* @__PURE__ */ jsx18("code", { children: "[0,4/\u221A5]" }),
      " and row ",
      /* @__PURE__ */ jsx18("code", { children: "[0,4/\u221A5]" }),
      "; their outer product is ",
      /* @__PURE__ */ jsx18("code", { children: "[[0,0],[0,16/5]]" }),
      "."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The single control changes u's positive entry a; its other entry is ",
      /* @__PURE__ */ jsx18("code", { children: "-sqrt(1-a\xB2)" }),
      ", so u keeps length 1. v and \u03C3 stay fixed. At a=1, only the positive-pair rectangle remains. At a=0, only the negative-pair rectangle remains. No normalization divides by the missing piece's zero length. At a=0.8, the two paired sizes are both 0.48 in exact arithmetic. The displayed tie policy chooses the positive pair. The tied candidates occupy different cells, but have equal local approximation quality. After an edit, this is a supplied singular-triplet illustration; we are not claiming the edited u remains a singular direction of the unchanged X_t."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "For an arbitrary pair, write the two sizes as" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "p=\\|u_+\\|_2\\|v_+\\|_2,\\qquad\nq=\\|u_-\\|_2\\|v_-\\|_2." }) }),
    /* @__PURE__ */ jsx18(Prose, { children: "The subscript 2 means Euclidean length: square the entries, sum them and take the square root. If p\u2265q and p>0, normalize the positive pieces to unit length and share the retained strength across W and H:" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "w_c=\\sqrt{\\sigma p}\\;\\frac{u_+}{\\|u_+\\|_2},\\qquad\nh_c=\\sqrt{\\sigma p}\\;\\frac{v_+^T}{\\|v_+\\|_2}." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For q>p, use the negative pieces and q in the same construction. Multiplying w_c and h_c cancels the two normalization lengths against p or q, leaving exactly the chosen ",
      /* @__PURE__ */ jsx18("code", { children: "\u03C3 u_plus v_plus\u1D40" }),
      " or ",
      /* @__PURE__ */ jsx18("code", { children: "\u03C3 u_minus v_minus\u1D40" }),
      ". The square-root split gives the two factors equal Euclidean norm; section 2's compensating scale change could redistribute that scale without changing their outer product. If the singular value or both candidate sizes are zero, the whole new component is zero and normalization is skipped."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "Deeper: why compare norm products?" }),
      " Positive and negative pieces have zero inner product because their supports do not overlap. Normalizing the two left pieces therefore produces perpendicular left directions; normalizing the right pieces does the same on the right. The positive-part table already has an SVD with singular strengths p and q. Its best rank-one approximation keeps the larger strength and discards the smaller one. With strength \u03C3 restored, the discarded positive rectangle has Frobenius norm ",
      /* @__PURE__ */ jsx18("code", { children: "\u03C3 min(p,q)" }),
      ". That local result follows from the actual geometry of two orthogonal rectangles. Summing these separately approximated SVD terms does not establish a globally best joint NMF, because the complete residual also includes the removed negative terms and interactions across components."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Simply clipping u and v separately would always retain ",
      /* @__PURE__ */ jsx18("code", { children: "u_plus v_plus\u1D40" }),
      ". In our example that would keep strength 1.8 and throw away the stronger 3.2 rectangle. Jointly flipping both singular vectors preserves their original signed outer product but swaps which rectangle is called positive-pair or negative-pair. Away from a tie, comparing both pairs still selects the same retained product. At an exact tie, our positive-pair convention can select the other equal-quality rectangle after a sign flip. Equal singular values also permit rotations within a singular subspace. Thus a fixed SVD backend and explicit tie rules make this a controlled implementation; they do not make the initializer unique across every backend and degenerate matrix."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "We can now assemble ",
      /* @__PURE__ */ jsx18("strong", { children: "Nonnegative Double SVD" }),
      ", abbreviated NNDSVD. The first step finds the SVD of the observation table. The second finds a leading singular term of each positive-part outer product; the sign-pair calculation obtains that second result without performing another large decomposition. For a nonnegative X, a leading left/right singular pair can be chosen nonnegative. We use the absolute leading vectors, as the ordinary implementation does, and scale each by ",
      /* @__PURE__ */ jsx18("code", { children: "sqrt(\u03C31)" }),
      ". For the remaining k-1 terms, apply the paired-sign construction."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "For X_t, this gives" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "W_{\\rm start}=\\begin{bmatrix}0.8\\sqrt{10}&0\\\\0.6\\sqrt{10}&4/\\sqrt5\\end{bmatrix},\n\\qquad H_{\\rm start}=W_{\\rm start}^T,\n\\qquad X_t-W_{\\rm start}H_{\\rm start}\n=\\begin{bmatrix}1.8&-2.4\\\\-2.4&0\\end{bmatrix}." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Read the residual in the same direction as section 3: ",
      /* @__PURE__ */ jsx18("strong", { children: "observed minus reconstructed" }),
      ". The positive 1.8 says the reconstruction is too low in the top-left cell. The negative -2.4 says it is too high off the diagonal. We preserved a good nonnegative start, not an exact explanation of X_t. The half-squared loss is ",
      /* @__PURE__ */ jsx18("code", { children: "(1.8\xB2+2.4\xB2+2.4\xB2)/2=7.38" }),
      "."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "Why are zeros in this good-looking start worth inspecting?" }),
    /* @__PURE__ */ jsx18(Prose, { children: "A zero can be either a useful absent contribution or a coordinate the chosen solver can never revive." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D34" }),
    /* @__PURE__ */ jsx18(Prose, { children: "The unfilled factors have two exact zero entries: W[T0,C1] and H[C1,F0]. The second component initially contributes only to the bottom-right cell. The filled view changes only those original zeros, leaving every nonzero entry unchanged. The control's fill amount \u03B4 runs from 0 to 2, directly under these factor cells. A fill is an explicit change to the initial factors, not a change to the observations or a hidden floor inside the loss." }),
    /* @__PURE__ */ jsx18(Prose, { children: "At \u03B4=0, section 7's H-first multiplicative sweep keeps both zero entries at zero. Its other values move, reducing the half-squared loss from 7.38 to approximately 3.287531. At \u03B4=0.1, H[C1,F0] becomes approximately 0.0535559 after the H block and W[T0,C1] becomes approximately 0.0672734 after the W block uses that new H. The component can now contribute off the diagonal. Yet this one-sweep loss, approximately 3.652713, is higher than the unfilled case's 3.287531. Allowing a coordinate to move and producing a better answer after exactly one sweep are different questions." }),
    /* @__PURE__ */ jsx18(Prose, { children: "At \u03B4=2, the initial loss is approximately 38.153002 and the one-sweep loss is approximately 12.279289. Larger fill is not automatically a better start. Setting \u03B4 back to zero restores the exact unfilled start and its update. The comparison shows both initial and updated factors and losses; it does not fit an entire model or claim one initializer universally wins." }),
    /* @__PURE__ */ jsx18(Prose, { children: "There are three useful variants:" }),
    /* @__PURE__ */ jsx18(Table, { caption: "9. Initialize without silently importing PCA centering", headers: [/* @__PURE__ */ jsx18(Fragment9, { children: "Variant" }), /* @__PURE__ */ jsx18(Fragment9, { children: "What happens to exact zeros" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Consequence to inspect" })], rows: [[/* @__PURE__ */ jsx18(Fragment9, { children: "Plain NNDSVD" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Leave them at zero" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Sparse initial factors; exact MU zero locks remain. Coordinate descent can revive a zero when its derivative points into the feasible region." })], [/* @__PURE__ */ jsx18(Fragment9, { children: "Mean-filled NNDSVD, often named NNDSVDa" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Replace them with mean(X)" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Dense start when mean(X)>0; it can substantially increase initial loss and changes factor scale." })], [/* @__PURE__ */ jsx18(Fragment9, { children: "Small-random-filled NNDSVD, often named NNDSVDar" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Replace them with small nonnegative random values scaled by mean(X)" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Gives formerly zero coordinates room to move; record the distribution, generator and seed." })]] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For X_t the mean is ",
      /* @__PURE__ */ jsx18("strong", { children: "4.95" }),
      ", outside the live \u03B4 range. The \u03B4=2 endpoint therefore is not NNDSVDa for this table. Our small-random variant uses uniform draws between 0 and ",
      /* @__PURE__ */ jsx18("code", { children: "mean(X)/100" }),
      ", following the original variant. The inspected scikit-learn 1.9.1 implementation instead uses the absolute value of normal draws times ",
      /* @__PURE__ */ jsx18("code", { children: "mean(X)/100" }),
      ". That distribution is not bounded by ",
      /* @__PURE__ */ jsx18("code", { children: "mean(X)/100" }),
      ". Even with the same integer seed these routes do not promise the same arrays. The original treatment and its dense variants are described in ",
      /* @__PURE__ */ jsx18("a", { href: "https://doi.org/10.1016/j.patcog.2007.09.010", children: "Boutsidis and Gallopoulos" }),
      "."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Zero handling has two other boundaries. First, floating-point SVD can return tiny nonzero values for mathematically zero terms; an absolute cutoff is a deliberate numerical convention. Our default leaves them unchanged. The explicit ",
      /* @__PURE__ */ jsx18("code", { children: "zero_threshold" }),
      " option sets factor entries below that cutoff to zero before any fill. It is not a singular-value rank test and changes which coordinates are subsequently filled or locked. The inspected library initializer applies an internal absolute cutoff of 10\u207B\u2076. Second, an all-zero data table gives zero singular values and zero mean. All three data-scaled NNDSVD variants therefore return zero factors; mean or random fill cannot create positive entries from zero mean. Section 8's strictly positive beta route needs a different, explicitly positive starting contract and strictly positive observations."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Here is the complete implementation and its ordinary-tool example. Save it as ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_initialization.py" }),
      " beside the earlier NMF files and the supplied unchanged ",
      /* @__PURE__ */ jsx18("code", { children: "centered_pca.py" }),
      ". N1's ",
      /* @__PURE__ */ jsx18("code", { children: "nonnegative_table" }),
      " reuses only PCA's finite-array helper; no PCA fitting or centering runs. The new code owns the sign split, pair comparison, component assembly, zero-fill policies and a separate positive random initializer. NumPy owns the maintained SVD kernel."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_initialization.py", filename: "nmf_initialization.py", language: "python" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The complete recorded stdout makes the starting factors, signed residual, three explicit fills and both ordinary-tool comparisons available together. ",
      /* @__PURE__ */ jsx18("code", { children: "changed_entries" }),
      " prints the two formerly zero coordinates after an H-first sweep. The separate ",
      /* @__PURE__ */ jsx18("code", { children: "same_W_first_factor_max_differences" }),
      " comparison deliberately matches the ordinary tool's W-first order rather than comparing different update orders."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/initialization-main.stdout.txt", filename: "initialization-main.stdout.txt", language: "output" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("code", { children: "initialize_nndsvd" }),
      " returns fresh W and H arrays with shapes ",
      /* @__PURE__ */ jsx18("code", { children: "n\xD7k" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "k\xD7d" }),
      ", without mutating X. It requires ",
      /* @__PURE__ */ jsx18("code", { children: "1\u2264k\u2264min(n,d)" }),
      " because it constructs at most one component per economy-SVD triplet. Requesting more components, called an ",
      /* @__PURE__ */ jsx18("strong", { children: "overcomplete" }),
      " representation here, is a different starting policy: ",
      /* @__PURE__ */ jsx18("code", { children: "initialize_positive_random" }),
      " supports it and uses bounded positive uniform entries scaled by ",
      /* @__PURE__ */ jsx18("code", { children: "sqrt(mean(X)/k)" }),
      ". Its factors are deliberately different from the library's absolute-normal random initialization. It refuses an all-zero table rather than inventing a data scale. No factorization is fitted by either initializer."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The code normalizes sign pieces before multiplying by their shared scale. ",
      /* @__PURE__ */ jsx18("code", { children: "stable_norm" }),
      ", taught in N1, avoids losing a small piece merely by squaring its entries unscaled. ",
      /* @__PURE__ */ jsx18("code", { children: "table_mean" }),
      " scales the input before averaging, so summing large finite positive measurements need not overflow. Nonfinite singular strengths or factors are refused. Exact zero terms skip division; no epsilon is slipped into their denominator. This is a dense float64 reference route, with finite-arithmetic limits, not a guarantee of bitwise equality across LAPACK implementations."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "Deeper: why is the leading absolute pair legitimate?" }),
      " For a nonnegative X, replacing real unit vectors u,v by their entrywise absolute values can only increase ",
      /* @__PURE__ */ jsx18("code", { children: "u\u1D40Xv" }),
      ". Its value still cannot exceed the largest singular value. If u,v attain that largest value, their absolute pair must attain it too. Thus we may choose a nonnegative leading pair even when the backend's signs or a repeated singular value make its supplied pair ambiguous. This argument concerns the largest singular pair of nonnegative X; it does not justify taking absolute values of every later SVD direction. Later directions need the paired-sign construction we just derived."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The dense economy SVD costs on the order of ",
      /* @__PURE__ */ jsx18("code", { children: "nd\xD7min(n,d)" }),
      " arithmetic, with thin U/Vh storage on the order of ",
      /* @__PURE__ */ jsx18("code", { children: "(n+d)\xD7min(n,d)" }),
      ", plus the input copy and the numerical kernel's workspace. Pair assembly and filling cost ",
      /* @__PURE__ */ jsx18("code", { children: "O((n+d)k)" }),
      " and retain ",
      /* @__PURE__ */ jsx18("code", { children: "O((n+d)k)" }),
      " factors. Computing only k leading triplets with a suitable iterative or randomized backend can change the cost and approximation error. This program computes the whole thin decomposition even when k is small, so its SVD must not be advertised as ",
      /* @__PURE__ */ jsx18("code", { children: "O(ndk)" }),
      " or as a streaming sparse method. For large sparse text, avoid densifying the entire table solely to use this teaching implementation; use a maintained sparse-aware route and understand its approximation settings."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The main program first prints the actual initialized arrays and signed residual, then the three D34 fill cases. It reuses section 7's H-first/new-H W operation on the constructed two-feature table. In the recorded run, the plain factors agree with the displayed exact square-root expressions to floating-point precision, and the three loss pairs are:" }),
    /* @__PURE__ */ jsx18(Table, { caption: "9. Initialize without silently importing PCA centering", headers: [/* @__PURE__ */ jsx18(Fragment9, { children: "Fill \u03B4" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Initial half-squared loss" }), /* @__PURE__ */ jsx18(Fragment9, { children: "After one H-first/new-H W sweep" })], rows: [[/* @__PURE__ */ jsx18(Fragment9, { children: "0" }), /* @__PURE__ */ jsx18(Fragment9, { children: "7.380000" }), /* @__PURE__ */ jsx18(Fragment9, { children: "3.287531" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "0.1" }), /* @__PURE__ */ jsx18(Fragment9, { children: "8.252700" }), /* @__PURE__ */ jsx18(Fragment9, { children: "3.652713" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "2" }), /* @__PURE__ */ jsx18(Fragment9, { children: "38.153002" }), /* @__PURE__ */ jsx18(Fragment9, { children: "12.279289" })]] }),
    /* @__PURE__ */ jsx18(Prose, { children: "How do these choices map to the usual tool?" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The complete example uses public ",
      /* @__PURE__ */ jsx18("code", { children: "sklearn.decomposition.NMF" }),
      ", whose ",
      /* @__PURE__ */ jsx18("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.NMF.html", children: "documented initialization choices" }),
      " include ",
      /* @__PURE__ */ jsx18("code", { children: "nndsvd" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "nndsvda" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "nndsvdar" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "random" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "custom" }),
      ". Set ",
      /* @__PURE__ */ jsx18("code", { children: "n_components" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "init" }),
      " explicitly when studying a choice. In the inspected 1.9.1 version, ",
      /* @__PURE__ */ jsx18("code", { children: "init=None" }),
      " selects ",
      /* @__PURE__ */ jsx18("code", { children: "nndsvda" }),
      " when k fits within the smaller matrix dimension and random otherwise; ",
      /* @__PURE__ */ jsx18("code", { children: "random_state" }),
      " also affects its randomized SVD backend. Its sign-pair comparison selects the negative pair on an exact computed tie; our convention selects the positive pair. The scratch program's exact dense SVD, default cutoff and uniform random-fill distribution are other intentional differences. The library's internal initializer was inspected to resolve these differences; the learner calls the public estimator, not its private helper."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For a controlled solver comparison, the first ordinary call supplies copies of our exact W and H using ",
      /* @__PURE__ */ jsx18("code", { children: "init='custom'" }),
      ", sets both penalties to zero and performs one Frobenius MU sweep. The library updates ",
      /* @__PURE__ */ jsx18("strong", { children: "W first, then H using the new W" }),
      ", whereas D34 deliberately follows the earlier H-first scratch route. The program therefore also constructs a W-first scratch reference using the already-taught ",
      /* @__PURE__ */ jsx18("code", { children: "update_amounts" }),
      " primitive. In the recorded run, its W agrees exactly with the public route and the largest H difference is approximately ",
      /* @__PURE__ */ jsx18("code", { children: "4.44\xD710\u207B\xB9\u2076" }),
      ". The two sweep orders happen to give the same rounded loss on this symmetric example; that coincidence is not evidence that their factor updates are identical. Read the block-order labels before comparing either factors or losses."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The second ordinary call demonstrates normal use: ",
      /* @__PURE__ */ jsx18("code", { children: "NMF(init='nndsvda', solver='cd', ...)" }),
      " initializes internally and then fits. Here it took 10 iterations and obtained half-squared loss approximately ",
      /* @__PURE__ */ jsx18("code", { children: "4.630824\xD710\u207B\xB9\u2076" }),
      ". Those numbers describe this constructed two-by-two example under the recorded Python/NumPy/SciPy/scikit-learn versions. This is a complete independently initialized fit; an initializer-isolation benchmark would hold the subsequent solver and its stopping rules fixed. The next section will examine the fitted estimator's state and query operations in detail."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Try a changed case before leaving initialization. With \u03C3=5, u=",
      /* @__PURE__ */ jsx18("code", { children: "[0.8,-0.6]" }),
      " and v=",
      /* @__PURE__ */ jsx18("code", { children: "[0.6,-0.8]" }),
      ", compute both sign-pair norm products and construct the component our tie rule retains. Each product is 0.48, so the positive pair gives the nonnegative outer product ",
      /* @__PURE__ */ jsx18("code", { children: "[[2.4,0],[0,0]]" }),
      "; the alternative has the same size but lies in the bottom-right cell. Now add a third component to a two-by-two table: explain why the NNDSVD route refuses it and why the separate random route can still provide the requested factor shapes. Finally, change only ",
      /* @__PURE__ */ jsx18("code", { children: "zero_threshold" }),
      " on the supplied initializer and inspect exactly which nonzero cells become zero before filling. These checks separate geometry, numerical convention and solver behavior rather than treating an initialization name as a quality guarantee."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "We now have both a structurally informed first state and explicit alternatives when its zeros, dimensional limit or numerical cost are unsuitable. The next step is to use those choices through a fitted model whose stored dictionary, feature order and new-row behavior remain clear." }),
    /* @__PURE__ */ jsx18("span", { id: "6-practical-choices-that-change-the-model", className: "nmf-historical-anchor" }),
    /* @__PURE__ */ jsx18(H2, { children: "10. Use the ordinary tools deliberately" }),
    /* @__PURE__ */ jsx18(Prose, { children: "We now know how an initializer proposes factors and how a solver changes them. To use either one outside a hand calculation, we need to separate two moments: learning patterns from training rows, then expressing a new row with those patterns held fixed. Otherwise a call that looks like \u201Cencode this measurement\u201D can quietly become a different fitting problem." }),
    /* @__PURE__ */ jsx18(Prose, { children: "Which arrays should a fitted model keep, and which arrays should it return for a new observation?" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Keep the learned patterns; solve new amounts in the same feature order." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D35" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Read the feature labels F0, F1 and F2 across every observation and pattern row. Our original X0 has three observation rows and three features. With two components, training returns an amount table of shape ",
      /* @__PURE__ */ jsx18("code", { children: "(3,2)" }),
      " and a dictionary of shape ",
      /* @__PURE__ */ jsx18("code", { children: "(2,3)" }),
      ". The blue and rose columns of amounts correspond to the blue and rose rows of the dictionary. Multiplying them contracts the two-component axis and returns a ",
      /* @__PURE__ */ jsx18("code", { children: "(3,3)" }),
      " reconstruction."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The picture's numerical W_exact and H0 are the hand-constructed factors from section 1, used to make those dimensions concrete. They are not a claim that a library fit learned those exact factors. The separate fitting lane labels its output as learned arrays, whose actual entries depend on initialization, solver and stopping. We will inspect a computed tiny example below." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Below the fitted boundary, a new row with three features receives two new amounts. Only that amount row changes; the stored dictionary stays fixed. For the supplied H0, the row ",
      /* @__PURE__ */ jsx18("code", { children: "[1.5,0.5,2]" }),
      " has exact amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[1.5,0.5]" }),
      ", because its component contributions are ",
      /* @__PURE__ */ jsx18("code", { children: "[1.5,0,1.5]" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "[0,0.5,0.5]" }),
      ". Their sum restores the row. This is a supplied-dictionary calculation, not a fresh fit or a prediction of a future measurement."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For a fitted dictionary ",
      /* @__PURE__ */ jsx18(Math2, { children: "\\widehat H" }),
      ", the unpenalized squared-error query is"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "\\widehat w(x)=\\arg\\min_{w\\geq0}\\tfrac12\\|x-w\\widehat H\\|_2^2,\n\\qquad \\widehat x=\\widehat w(x)\\widehat H." }) }),
    /* @__PURE__ */ jsx18(Prose, { children: "If several amount vectors minimize the query cost, the argmin is a set and the solver returns one allowed choice. Our earlier dependent-pattern examples explain why comparing reconstructions can be more meaningful than comparing coefficients. An inverse reconstruction is also not an exact inverse for arbitrary x: the available patterns may not represent it, and the query solve may stop at a finite tolerance." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The ",
      /* @__PURE__ */ jsx18("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.NMF.html", children: "public NMF interface" }),
      " uses ",
      /* @__PURE__ */ jsx18("code", { children: "fit_transform(X)" }),
      " to learn the dictionary and return training amounts, ",
      /* @__PURE__ */ jsx18("code", { children: "components_" }),
      " for the dictionary, ",
      /* @__PURE__ */ jsx18("code", { children: "transform(Q)" }),
      " for new amounts and ",
      /* @__PURE__ */ jsx18("code", { children: "inverse_transform(amounts)" }),
      " for reconstruction. Here Q is a new observation table with the same features. ",
      /* @__PURE__ */ jsx18("code", { children: "fit_transform(Q)" }),
      " would instead learn a new dictionary from Q. It is the wrong operation when the question is how the training dictionary represents new observations."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("a", { href: "#5-change-one-coordinate-then-reuse-the-arithmetic", children: "Section 5 derived the coordinate kernel" }),
      "; section 6 supplies its complete ",
      /* @__PURE__ */ jsxs15("a", { href: "#6-fit-both-factors-and-decide-when-to-stop", children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "nmf_coordinate.py" }),
        " fitter and ",
        /* @__PURE__ */ jsx18("code", { children: "nmf_nnls.py" }),
        " public NNLS comparison"
      ] }),
      ". Fixed-H encoding was introduced in ",
      /* @__PURE__ */ jsx18("a", { href: "#4-encode-a-new-row-with-the-dictionary-held-fixed", children: "section 4" }),
      " and implemented by those programs. We reuse those files rather than introduce a second coordinate solver. In particular, ",
      /* @__PURE__ */ jsx18("code", { children: "CoordinateNMF.transform" }),
      " reads the fitted dictionary and its stopping settings, checks any supplied feature identities and calls the already-explained fixed-H encoder:"
    ] }),
    /* @__PURE__ */ jsx18(CodeBlock, { language: "python", children: '    def transform(self, values, *, features=None, return_diagnostics=False):\n        state = self._fitted()\n        if features is not None and feature_ids(features, state.h.shape[1]) != state.features:\n            raise ValueError("Query feature IDs/order differ from the fitted dictionary")\n        w, diagnostic = encode_coordinates(values, state.h, max_iter=state.max_iter, tol=state.tol, sweeps=state.sweeps)\n        return (w, diagnostic) if return_diagnostics else w' }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("code", { children: "state" }),
      " is the previously published snapshot, not a new initializer. Its dictionary's row count determines the number of returned amounts. With explicit feature identities, a query ordered ",
      /* @__PURE__ */ jsx18("code", { children: "[F1,F0,F2]" }),
      " is refused rather than silently treated as ",
      /* @__PURE__ */ jsx18("code", { children: "[F0,F1,F2]" }),
      ". A plain numerical array cannot carry those meanings by itself: if you omit the optional feature IDs in this scratch API, preserving their order is your responsibility. The ordinary adapter below requires them explicitly. It does not assume that an ndarray's shape proves its columns mean the right thing."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "How should we compare two solver choices without confusing their different update schedules?" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Give both the same row, fixed dictionary and starting amounts, then inspect one precisely named block." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D36" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "This is R1=",
      /* @__PURE__ */ jsx18("code", { children: "[1,3,4]" }),
      " from our running example, with H0 held fixed. The only control changes the first starting amount a between 0.5 and 2; the second starting amount remains 1. The two lanes begin from exactly ",
      /* @__PURE__ */ jsx18("code", { children: "[a,1]" }),
      ". One lane makes a cyclic coordinate-descent sweep, changing the blue amount before the rose amount. The other changes both amounts simultaneously with a Frobenius multiplicative W update. Neither lane updates the dictionary or runs a whole alternating fit."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "With H0, the shared Gram is ",
      /* @__PURE__ */ jsx18("code", { children: "[[2,1],[1,2]]" }),
      " and R1's cross row is ",
      /* @__PURE__ */ jsx18("code", { children: "[5,7]" }),
      ". In the coordinate lane, the first amount becomes ",
      /* @__PURE__ */ jsx18("code", { children: "(5-1)/2=2" }),
      ". The second uses that ",
      /* @__PURE__ */ jsx18("strong", { children: "new" }),
      " first amount and becomes ",
      /* @__PURE__ */ jsx18("code", { children: "(7-2)/2=2.5" }),
      ". Thus this one cyclic sweep ends at ",
      /* @__PURE__ */ jsx18("code", { children: "[2,2.5]" }),
      " for every a in the control's interval. It reconstructs ",
      /* @__PURE__ */ jsx18("code", { children: "[2,2.5,4.5]" }),
      "; half the sum of its three squared residuals is ",
      /* @__PURE__ */ jsx18("code", { children: "3/4" }),
      "."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The multiplicative lane uses the original amounts in both denominators:" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "w_0^{\\mathrm{new}}=a\\frac{5}{2a+1},\\qquad\nw_1^{\\mathrm{new}}=1\\frac{7}{a+2}." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "At a=1 it gives ",
      /* @__PURE__ */ jsx18("code", { children: "[5/3,7/3]" }),
      ", reconstructing ",
      /* @__PURE__ */ jsx18("code", { children: "[5/3,7/3,4]" }),
      ", with half-loss ",
      /* @__PURE__ */ jsx18("code", { children: "4/9" }),
      ". At a=0.5 it gives ",
      /* @__PURE__ */ jsx18("code", { children: "[5/4,14/5]" }),
      ", with half-loss ",
      /* @__PURE__ */ jsx18("code", { children: "21/400" }),
      "; at a=2 it gives ",
      /* @__PURE__ */ jsx18("code", { children: "[2,7/4]" }),
      ", with half-loss ",
      /* @__PURE__ */ jsx18("code", { children: "21/16" }),
      ". The same coordinate sweep therefore has a higher loss than the multiplicative block at the default and lower-end states, but a lower loss at the upper endpoint. The direction of that comparison changes with the starting state. It cannot establish that either full solver is always preferable."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The picture also draws the slope for each updated amount. The fixed-block gradient is ",
      /* @__PURE__ */ jsx18("code", { children: "g=wG-[5,7]" }),
      ". At the default, the coordinate result has gradient ",
      /* @__PURE__ */ jsx18("code", { children: "[1.5,0]" }),
      ", while the multiplicative result has ",
      /* @__PURE__ */ jsx18("code", { children: "[2/3,-2/3]" }),
      ". Since all these amounts are positive, their projected-gradient squared norms are ",
      /* @__PURE__ */ jsx18("code", { children: "9/4" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "8/9" }),
      " respectively. Neither result solves this coupled block to stationarity. The coordinate sweep minimized one coordinate at a time; its later rose update changed the slope of the earlier blue coordinate. This makes the need for further sweeps visible instead of confusing a single coordinate minimization with a fully solved NNLS problem."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The two local operations are the exact primitives already derived in sections 5 and 7. The live picture uses those displayed single-block equations; it is not a browser call to sklearn and does not imply that the library's private schedules match every scratch loop. The public full-fit comparison in ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_coordinate.py" }),
      " supplies the same initial W/H, disables additional penalties, uses Frobenius CD and sets the coordinate order explicitly. Its already recorded X0 fit has scratch half-loss about ",
      /* @__PURE__ */ jsx18("code", { children: "2.080268\xD710\u207B\xB9\xB3" }),
      " and ordinary half-loss about ",
      /* @__PURE__ */ jsx18("code", { children: "1.422005\xD710\u207B\xB9\u2074" }),
      ". Those retained outputs describe that configured full fit, not D36's single block or a new timing study. The ordinary residual norm ",
      /* @__PURE__ */ jsx18("code", { children: "1.686419\xD710\u207B\u2077" }),
      " equals the square root of twice its half-loss, as section 3 established."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "Deeper: choose a compatible objective and solver." }),
      " A name like NMF does not fix the discrepancy we minimize. Section 7's KL construction and section 8's beta divergences deliberately changed that discrepancy. Keep the following combinations explicit rather than changing only a solver keyword and assuming the mathematics stays the same."
    ] }),
    /* @__PURE__ */ jsx18(Table, { caption: "10. Use the ordinary tools deliberately", headers: [/* @__PURE__ */ jsx18(Fragment9, { children: "Public solver" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Discrepancy" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Important input/support distinction" })], rows: [[/* @__PURE__ */ jsxs15(Fragment9, { children: [
      "",
      /* @__PURE__ */ jsx18("code", { children: "cd" }),
      ""
    ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Frobenius, beta=2" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Nonnegative observations may include zero; coordinate curvature and gradients are the squared-error ones." })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
      "",
      /* @__PURE__ */ jsx18("code", { children: "mu" }),
      ""
    ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Frobenius or generalized KL" }), /* @__PURE__ */ jsx18(Fragment9, { children: "The previously taught zero-support and zero-lock issues still matter." })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
      "",
      /* @__PURE__ */ jsx18("code", { children: "mu" }),
      ""
    ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Other supported beta values" }), /* @__PURE__ */ jsx18(Fragment9, { children: "For beta\u22640 the public estimator refuses zero-valued observations; our section 8 general-beta scratch route deliberately requires strictly positive data and factors." })]] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "These are the ",
      /* @__PURE__ */ jsx18("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.NMF.html", children: "documented solver/loss settings" }),
      ", not permission to transfer a Frobenius derivation to every beta. Recompute the chosen objective when comparing implementations. An iteration cap, a small residual and first-order stationarity answer different questions; none is a certificate that the joint nonconvex factorization recovered a unique physical source. The next section will explain what additional factor penalties change."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "What should happen if an attempted refit fails while a useful dictionary already exists?" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Build a complete candidate separately, then replace the fitted state in one step." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D37" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The left lane contains the old dictionary, ordered features ",
      /* @__PURE__ */ jsx18("code", { children: "[F0,F1,F2]" }),
      ", fitted component count 2 and its diagnostics. Together they describe one model. The upper candidate lane receives new training rows and initialization. Invalid values or incompatible shapes stop that lane before publication, so every old slot remains available for a query. The valid-candidate lane shows all the new slots crossing the publication boundary together. Moving only the dictionary while leaving the old feature order or shape settings behind would create a model that never existed during fitting."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "In our scratch estimator, the final lines of ",
      /* @__PURE__ */ jsx18("code", { children: "fit_transform" }),
      " construct the whole state and then publish it. This exact excerpt comes from the complete earlier program:"
    ] }),
    /* @__PURE__ */ jsx18(CodeBlock, { language: "python", children: "        candidate = CoordinateState(read_only(h), names, cap, tol, sweeps, tuple(history), status)\n        self._state = candidate  # The only publication point; failures above preserve old state.\n        return w.copy()" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The snapshot owns a read-only dictionary; ",
      /* @__PURE__ */ jsx18("code", { children: "components_" }),
      " returns a copy. The returned training amounts are also copied. Query dimensions come from that dictionary rather than a mutable next-fit ",
      /* @__PURE__ */ jsx18("code", { children: "n_components" }),
      ". Changing the next-fit rank to 1 must therefore leave the old model's two-component queries intact until a new candidate successfully replaces it."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Public estimators do not promise that calling a failing ",
      /* @__PURE__ */ jsx18("code", { children: "fit" }),
      " on the same object preserves every previous fitted field. We can provide that application-level behavior without changing the library solver: construct a fresh candidate estimator, fit and inspect it, then publish it. The following complete adapter fixes one deliberately narrow configuration, unpenalized CD/Frobenius, so its state logic is easy to see. The earlier source supplies the actual scratch algorithm. Save ",
      /* @__PURE__ */ jsx18("code", { children: "ordinary_nmf_lifecycle.py" }),
      " beside ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_arrays.py" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_coordinate.py" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_nnls.py" }),
      " and their ",
      /* @__PURE__ */ jsx18("code", { children: "centered_pca.py" }),
      " helper, then run ",
      /* @__PURE__ */ jsx18("code", { children: "python ordinary_nmf_lifecycle.py" }),
      " in the same NumPy/SciPy/scikit-learn environment as the earlier examples."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/ordinary_nmf_lifecycle.py", filename: "ordinary_nmf_lifecycle.py", language: "python" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Follow the adapter's publication point. It validates the fitting table, identities and supplied factor shapes, then creates a local public estimator with ",
      /* @__PURE__ */ jsx18("code", { children: "init='custom'" }),
      ". The validated initial factors are copies, so library updates cannot overwrite the caller's starting arrays. Only after fitting and recomputing a finite data cost does the adapter replace ",
      /* @__PURE__ */ jsx18("code", { children: "_state" }),
      ". The resulting snapshot contains the fitted estimator, its feature tuple, fitted component count and measured half-loss. It is an encapsulated model state, not a claim that a Python dataclass recursively freezes the library object it contains. Callers use the adapter's copied dictionary and query methods."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For a query, the adapter validates feature order before calling the saved estimator's ",
      /* @__PURE__ */ jsx18("code", { children: "transform" }),
      ". Its own empty-table branch returns ",
      /* @__PURE__ */ jsx18("code", { children: "(0,fitted_k)" }),
      "; ",
      /* @__PURE__ */ jsx18("code", { children: "inverse_transform" }),
      " analogously returns ",
      /* @__PURE__ */ jsx18("code", { children: "(0,d)" }),
      " for empty amounts. Those branches are stated adapter behavior, not a claim that a bare sklearn estimator accepts zero-row inputs. Nonempty inverse calls use the ordinary public operation. Finite but capped library fitting may still return a candidate and emit its convergence warning; this adapter does not turn a finite fit into a claim of stationarity. Use the scratch diagnostic or an explicitly computed fixed-block gradient when that is the quantity you need."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The main deliberately switches to a ",
      /* @__PURE__ */ jsx18("strong", { children: "new constructed training table" }),
      " ",
      /* @__PURE__ */ jsx18("code", { children: "[[3,1,4],[1,2,3],[2,1,3]]" }),
      ", while keeping the same features and initial H0. This changes the data so we can test the lifecycle without treating an old demonstration as a new experiment. Both routes return shapes ",
      /* @__PURE__ */ jsx18("code", { children: "(3,2)" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "(2,3)" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "(1,2)" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "(1,3)" }),
      " for training amounts, dictionary, query amounts and query reconstruction. In the recorded run, their dictionaries are close but not identical:"
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/lifecycle-main.stdout.txt", filename: "lifecycle-main.stdout.txt", language: "output" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The query ",
      /* @__PURE__ */ jsx18("code", { children: "[1.5,0.5,2]" }),
      " is reconstructed with small nonzero numerical residuals visible in the output. Its learned amount values are around ",
      /* @__PURE__ */ jsx18("code", { children: "[1.57233,0.46233]" }),
      ", rather than the ",
      /* @__PURE__ */ jsx18("code", { children: "[1.5,0.5]" }),
      " amounts of the supplied H0 calculation above, because the fitted dictionary is different. That comparison connects factor-scale/representation ambiguity to normal API use: the same measured row need not have the same coefficients under different dictionaries. The training half-losses, approximately ",
      /* @__PURE__ */ jsx18("code", { children: "9.521514\xD710\u207B\xB9\u2074" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "7.590800\xD710\u207B\xB9\u2075" }),
      ", describe this tiny changed table only."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The program next modifies returned dictionary copies and verifies that the fitted dictionaries survive. It changes next-fit rank to 1, attempts negative, nonfinite and wrong-shape refits, and verifies exact preservation of each old dictionary and old query result. It also rejects reordered, negative and wrong-width queries. Both empty-query and empty-reconstruction shapes still use the fitted two-component state. The 26 internal conditions test those contracts; they do not prove that arbitrary software cannot fail or that a close reconstruction validates an interpretation of its patterns." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "Deeper: fitting amounts and querying the training rows are different computations." }),
      " At finite stopping, alternating fitting may end immediately after an H update. Its returned W was solved against the preceding H. Calling ",
      /* @__PURE__ */ jsx18("code", { children: "transform(X_train)" }),
      " holds the final dictionary fixed and solves amounts again. Consequently, do not require bitwise equality between returned training amounts and a later encoding of the same table, even when the shapes and objective agree. Test the intended reconstruction and stopping contract. When dictionary rows are dependent, an additional reason for different coefficients is genuine nonuniqueness, already illustrated by our NNLS examples."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The added state wrapper does not change the asymptotic cost of the maintained fit or transform. It copies the validated input and initial factors and temporarily holds the old and candidate models together; that overlap is the price of keeping an old model available through a rejected candidate. Stored dictionary size is ",
      /* @__PURE__ */ jsx18("code", { children: "k\xD7d" }),
      ", with feature metadata of length d and the library's fitted attributes. The full scratch solver's Gram, sweep and blocked-diagnostic costs remain those derived in section 6. Avoid keeping all per-row component contribution tensors merely to support these state operations."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Try a changed state problem. A dictionary was trained in order ",
      /* @__PURE__ */ jsx18("code", { children: "[F0,F1,F2]" }),
      ", but a new array arrives in order ",
      /* @__PURE__ */ jsx18("code", { children: "[F2,F0,F1]" }),
      ". Supplying the old names without moving its data is incorrect. Reorder both the data columns and their actual identities consistently, or refuse the query. For the supplied H0, the correctly ordered row ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1,2]" }),
      " has amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1]" }),
      " and zero reconstruction residual. Explain why merely seeing three columns, or obtaining nonnegative output from a mismatched query, would not establish that the representation was meaningful. Then cap a fit early and compare its returned training amounts with a fresh ",
      /* @__PURE__ */ jsx18("code", { children: "transform" }),
      " under the final dictionary; inspect both residual and fixed-block slope instead of assuming exact equality."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "We can now initialize, fit, compare a precisely named update and query one coherent model without quietly refitting the question. Next we will make two modeling choices explicit: charging for factor size and excluding measurements that were never observed." }),
    /* @__PURE__ */ jsx18(H2, { children: "11. Control penalties and incomplete observations" }),
    /* @__PURE__ */ jsx18(Prose, { children: "The previous section separated a fitted dictionary from the new rows we encode with it. Two decisions now change what \u201Cfit well\u201D means: how much complexity we permit in the factors, and which measurements actually exist. We will change those decisions explicitly while keeping the same amount-times-pattern model." }),
    /* @__PURE__ */ jsx18(Prose, { children: "What if fitting a measurement closely requires an amount we would rather keep small?" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Charge for using the amount as well as for its reconstruction error." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D38" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The observed scalar is 2 and its fixed pattern is 1, so amount w predicts w. The unpenalized curve is ",
      /* @__PURE__ */ jsx18("code", { children: "0.5\xD7(2-w)\xB2" }),
      ", with minimum at w=2. The added cost is ",
      /* @__PURE__ */ jsx18("code", { children: "\u03BBw" }),
      ", where ",
      /* @__PURE__ */ jsx18("strong", { children: "\u03BB" }),
      ", pronounced lambda, is a nonnegative price per unit of amount. The picture keeps the data cost, added straight-line cost and their sum visible. Moving the one \u03BB control changes the slope of the straight line, rather than secretly changing the observation."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "At \u03BB=1, reducing w slightly from 2 saves more penalty than it initially costs in squared error; the best compromise is w=1. At \u03BB=3, the unconstrained minimum would be -1, but amounts cannot be negative. The best feasible amount is the boundary w=0. At that boundary the total curve has outward slope 1: moving into the allowed positive region would increase the objective. Reset \u03BB to zero and the original optimum returns to 2." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "A ",
      /* @__PURE__ */ jsx18("strong", { children: "penalty" }),
      ", also called regularization, expresses this additional preference as part of the objective. It is not a probability that a component is reliable. Different preferences produce different penalties. A linear cost \u03BB\u2081w charges the same extra slope per unit; a squared cost ",
      /* @__PURE__ */ jsx18("code", { children: "0.5\u03BB\u2082w\xB2" }),
      " makes an already large amount increasingly expensive. The static squared-penalty comparison uses \u03BB\u2081=0 and \u03BB\u2082=1: its optimum is w=1 as well, but its curve and response to another target differ from the linear case."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "For a scalar observed value x and fixed pattern value h, the total cost, slope and curvature are" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "f(w)=\\tfrac12(x-wh)^2+\\lambda_1w+\\tfrac12\\lambda_2w^2,\n\\quad f'(w)=(h^2+\\lambda_2)w-xh+\\lambda_1,\n\\quad f''(w)=h^2+\\lambda_2." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Here \u03BB\u2081 and \u03BB\u2082 are nonnegative coefficients. If ",
      /* @__PURE__ */ jsx18("code", { children: "h\xB2+\u03BB\u2082>0" }),
      ", setting the slope to zero and respecting w\u22650 gives"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "w_* = \\max\\left(0,\\frac{xh-\\lambda_1}{h^2+\\lambda_2}\\right)." }) }),
    /* @__PURE__ */ jsx18(Prose, { children: "This derives the threshold and the shrinkage from an optimization problem; they are not arbitrary changes applied after fitting. If h=0 and \u03BB\u2082=0, the data does not depend on w. Positive \u03BB\u2081 chooses zero; when \u03BB\u2081 is also zero, every nonnegative amount has the same cost and we choose zero by convention." }),
    /* @__PURE__ */ jsx18(Prose, { children: "How do these extra costs fit the coordinate updates we already built?" }),
    /* @__PURE__ */ jsx18(Prose, { children: "The linear penalty adds a slope, while the squared penalty adds both slope and curvature." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "In section 5, one fixed-H block used ",
      /* @__PURE__ */ jsx18("code", { children: "G=HH\u1D40" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "P=XH\u1D40" }),
      ". With nonnegative factors, the elementwise L1 size of W is simply the sum of its entries; the L2 square is the sum of their squares. For one coordinate c, add \u03BB\u2081 to the old slope and \u03BB\u2082W_ic to the old slope, then add \u03BB\u2082 to its curvature:"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "W_{ic}\\leftarrow\\max\\left(0,\nW_{ic}-\\frac{(WG-P)_{ic}+\\lambda_1+\\lambda_2W_{ic}}\n{G_{cc}+\\lambda_2}\\right)." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The operation still uses fresh earlier coordinates in the same cyclic sweep. Equivalently, isolate every other coordinate and divide ",
      /* @__PURE__ */ jsx18("code", { children: "(P_ic - sum_other W_it G_tc - \u03BB\u2081)" }),
      " by ",
      /* @__PURE__ */ jsx18("code", { children: "G_cc+\u03BB\u2082" }),
      ". Omitting \u03BB\u2082 from the slope while adding it to the denominator would solve a different problem. The exact ",
      /* @__PURE__ */ jsx18("code", { children: "coordinate_sweeps" }),
      " kernel in ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_coordinate.py" }),
      " already has these two coefficient arguments; here we derive their meaning, choose their dimension scaling and compose the complete penalized fitting route around that kernel."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For a table with n observation rows and d feature columns, let ",
      /* @__PURE__ */ jsx18("strong", { children: "\u03B1W" }),
      " and ",
      /* @__PURE__ */ jsx18("strong", { children: "\u03B1H" }),
      " set the strength of the amount and pattern penalties. A mixing fraction ",
      /* @__PURE__ */ jsx18("strong", { children: "r" }),
      ", between zero and one, assigns r to the linear part and 1-r to the squared part. The coefficients are"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "\\lambda_{W,1}=\\alpha_W d r,\\quad\n\\lambda_{W,2}=\\alpha_W d(1-r),\\qquad\n\\lambda_{H,1}=\\alpha_H n r,\\quad\n\\lambda_{H,2}=\\alpha_H n(1-r)." }) }),
    /* @__PURE__ */ jsx18(Prose, { children: "The full objective is therefore" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "\\tfrac12\\|X-WH\\|_F^2\n+\\alpha_Wdr\\sum_{i,c}W_{ic}\n+\\tfrac12\\alpha_Wd(1-r)\\sum_{i,c}W_{ic}^2\n+\\alpha_Hnr\\sum_{c,j}H_{cj}\n+\\tfrac12\\alpha_Hn(1-r)\\sum_{c,j}H_{cj}^2." }) }),
    /* @__PURE__ */ jsx18(Prose, { children: "Multiplying W's penalty by d puts it on the scale of the d reconstruction cells each row contributes; H's penalty uses n for the analogous reason across observations. This is the convention used by the public NMF API. It is a convention to preserve when reproducing an objective, not a rule that determines the correct penalty for every dataset. A masked problem with fewer observed cells may need its strengths retuned under a training-only validation protocol. The code keeps n and d as the original table dimensions rather than silently substituting observation counts into that convention." }),
    /* @__PURE__ */ jsx18(Prose, { children: "Does section 2's scale ambiguity still leave the total objective unchanged?" }),
    /* @__PURE__ */ jsx18(Prose, { children: "The reconstructed measurements can stay fixed while the charged factor sizes change." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D39" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Return to the exact W and H0 of section 1. Scale the first pattern by s and divide its amounts by s. The blue component's contribution stays the same in every cell, and the rose component is unchanged. The total amount mass becomes ",
      /* @__PURE__ */ jsx18("code", { children: "3/s+6" }),
      ", while total pattern mass becomes ",
      /* @__PURE__ */ jsx18("code", { children: "2s+2" }),
      ". These are sizes of two different factors, not alternative reconstruction errors."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The picture uses \u03B1W=0.1, \u03B1H=0.2, r=1 and n=d=3, so the two linear coefficients are 0.3 and 0.6. At s=1, the cost is ",
      /* @__PURE__ */ jsx18("code", { children: "0.3\xD79 + 0.6\xD74 = 5.1" }),
      ". At s=2 it becomes ",
      /* @__PURE__ */ jsx18("code", { children: "0.3\xD77.5 + 0.6\xD76 = 5.85" }),
      ". At s=0.5 it is ",
      /* @__PURE__ */ jsx18("code", { children: "0.3\xD712 + 0.6\xD73 = 5.4" }),
      ". The residual remains zero throughout this comparison. The one s control therefore exposes a change in the penalty alone. When both alphas are zero, the static comparison has zero penalty at every scale."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "Deeper: a one-sided penalty can leave an escape route." }),
      " Suppose the scalar observation is 1, only w is charged and the pattern h is unpenalized. Choosing w=1/s and h=s keeps the reconstruction exactly 1 while shrinking a linear amount penalty toward zero as s grows. No finite exact factorization reaches zero penalty: w=0 cannot reconstruct 1 with finite h. Charging one factor alone can therefore favor an unbounded sequence of scales instead of a finite preferred scale. Penalizing both factors, fixing dictionary normalization or imposing another explicit constraint closes different versions of this ambiguity. Each changes the stated problem; normalization is not a cost-free repair of a penalized objective."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "So far every cell was a real measurement, including observed zeros. What changes when a sensor never measured one bin?" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Give each cell an explicit observation weight instead of pretending its absence is a measured zero." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D40" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The row is R0=",
      /* @__PURE__ */ jsx18("code", { children: "[2,1,3]" }),
      " and the dictionary remains H0. F0 and F1 have weight 1. The one m control changes F2's weight between zero and one. A hatched F2 cell at m=0 means \u201Cexcluded from this fitting objective\u201D; it does not say the real value was zero. At fractional m, the measurement is included with a smaller squared-error weight. Its observed value, mask weight and model prediction remain separately labelled."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "For this row the two local caches become" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "G_i=\\begin{bmatrix}1+m&m\\\\m&1+m\\end{bmatrix},\n\\qquad p_i=[2+3m,\\;1+3m]." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "At m=1, we recover section 5's shared Gram ",
      /* @__PURE__ */ jsx18("code", { children: "[[2,1],[1,2]]" }),
      " and cross row ",
      /* @__PURE__ */ jsx18("code", { children: "[5,4]" }),
      ". At m=0, the shared third-bin contribution disappears: the Gram becomes the identity and the cross row ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1]" }),
      ". Notice that both caches change. Multiplying a final residual by a mask while still using the old unweighted Gram would not compute the coordinate steps for this objective."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "Let M_ij be the nonnegative weight of observation row i, feature j. A binary mask uses only zero and one; more general nonnegative weights express a weighted fit. The changed data cost is" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "L_M(W,H)=\\tfrac12\\sum_{i,j:M_{ij}>0}\nM_{ij}\\left(X_{ij}-\\sum_cW_{ic}H_{cj}\\right)^2." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "An observed zero has X_ij=0 with positive M_ij and still contributes a residual term. A missing cell has M_ij=0 and contributes no term. For example, a single pattern ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1]" }),
      " and row ",
      /* @__PURE__ */ jsx18("code", { children: "[2,0]" }),
      " give best amount 1 if both bins were measured. If the second bin is missing, the best amount is 2: only matching the first bin remains. The observed-zero objective's minimum half-loss is 1; the masked objective's included half-loss is zero. That zero says nothing about the unknown second measurement."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "For fixed H, the row-specific Gram and cross products follow by expanding the included squares:" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "(G_i)_{ct}=\\sum_{j:M_{ij}>0}M_{ij}H_{cj}H_{tj},\\qquad\n(p_i)_c=\\sum_{j:M_{ij}>0}M_{ij}X_{ij}H_{cj}." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Insert G_i and p_i into the same penalized coordinate formula. Rows with different masks generally need different caches. To update H, transpose the data and mask, treat each original feature as the row being solved, and use the ",
      /* @__PURE__ */ jsx18("strong", { children: "new W" }),
      " from the preceding amount block. The component dimension still contracts; transposition changes which observations support each pattern entry."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "How can we do this without storing one large Gram tensor for the entire dataset?" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Build one row's weighted design, solve its amounts, then release that cache." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For the included features of row i, multiply each dictionary column and observed value by ",
      /* @__PURE__ */ jsx18("code", { children: "sqrt(M_ij)" }),
      ". The resulting design has entries ",
      /* @__PURE__ */ jsx18("code", { children: "A_jc=sqrt(M_ij)H_cj" }),
      ", and the target has entries ",
      /* @__PURE__ */ jsx18("code", { children: "b_j=sqrt(M_ij)X_ij" }),
      ". Ordinary squared error ",
      /* @__PURE__ */ jsx18("code", { children: "0.5||Aw_i-b||\xB2" }),
      " is exactly the desired weighted row cost. Its products ",
      /* @__PURE__ */ jsx18("code", { children: "A\u1D40A" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "A\u1D40b" }),
      " are G_i and p_i. This square-root construction also makes a public NNLS reference straightforward."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The fitting code keeps one ",
      /* @__PURE__ */ jsx18("code", { children: "k\xD7k" }),
      " Gram and one length-k cross vector at a time. Its weighted design needs at most ",
      /* @__PURE__ */ jsx18("code", { children: "k\xD7d" }),
      " entries for the amount orientation and ",
      /* @__PURE__ */ jsx18("code", { children: "k\xD7n" }),
      " for the transposed pattern orientation. It never constructs all ",
      /* @__PURE__ */ jsx18("code", { children: "n\xD7k\xD7k" }),
      " Grams or a contribution tensor with shape ",
      /* @__PURE__ */ jsx18("code", { children: "n\xD7d\xD7k" }),
      ". For a fixed dictionary query, it keeps that row's cache for every inner sweep before moving to the next row. Unweighted queries share one Gram and one cross table for their entire solve."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "What if a row or feature has no observations at all?" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Zero objective weight means missing information, not a perfectly explained observation." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D41" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The all-missing row has weights ",
      /* @__PURE__ */ jsx18("code", { children: "[0,0,0]" }),
      " and finite placeholder values ",
      /* @__PURE__ */ jsx18("code", { children: "[0,0,0]" }),
      ". Its data cost is independent of its amounts. The code chooses all-zero amounts as a minimum-norm convention, including when the penalties are zero and many choices tie. The companion all-observed row has weights ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1,1]" }),
      " and actual measurements ",
      /* @__PURE__ */ jsx18("code", { children: "[0,0,0]" }),
      "; those measured zeros remain genuine constraints. With H0, its best amounts are also zero, but now they match three observations. The picture keeps an excluded cell hatched and an observed zero as an ordinary labelled zero."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "An entirely unsupported feature column similarly supplies no information about its dictionary entries. This implementation stores that column as zero and records ",
      /* @__PURE__ */ jsx18("code", { children: "observed_columns_" }),
      " so the absence of support is inspectable. Those zeros are a convention, not an estimate that the physical feature always vanishes. Positive penalties also prefer zero unsupported entries. With no penalty, the observed objective cannot distinguish them from other nonnegative choices."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "A quality average needs a denominator as well as a residual sum. For binary masks, dividing included squared error by the number of included cells gives observed-cell MSE. For fractional weights, this code explicitly defines weighted MSE as ",
      /* @__PURE__ */ jsx18("code", { children: "sum(M*residual\xB2)/sum(M)" }),
      ". When ",
      /* @__PURE__ */ jsx18("code", { children: "sum(M)=0" }),
      ", quality is undefined and the function returns ",
      /* @__PURE__ */ jsx18("code", { children: "None" }),
      "; reporting zero would confuse an empty sum with evidence of accuracy. None of these averages estimates error on missing measurements without further assumptions about how measurements went missing."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Here is the complete fitting, encoding and public-reference route. Save ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_penalties_masks.py" }),
      " beside ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_coordinate.py" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_arrays.py" }),
      " and their supplied ",
      /* @__PURE__ */ jsx18("code", { children: "centered_pca.py" }),
      " dependency. It reuses the earlier constrained coordinate kernel, so the new mechanism is weighted-cache construction and objective/state composition, rather than an unexplained replacement solver."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_penalties_masks.py", filename: "nmf_penalties_masks.py", language: "python" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("code", { children: "PenalizedMaskedNMF.fit_transform" }),
      " alternates W first and H with that new W. It records data cost, both penalty costs, their total and the joint projected-gradient diagnostic at each outer sweep. Supported zero-curvature coordinates retain the earlier exact convention; finite-arithmetic failures refuse the candidate. The fitted snapshot includes the dictionary, feature order, actual penalty coefficients, supported-column flags, stopping settings and diagnostics. Publication occurs once after the complete candidate succeeds. ",
      /* @__PURE__ */ jsx18("code", { children: "transform" }),
      " uses that snapshot even if the object's next-fit configuration later changes; ",
      /* @__PURE__ */ jsx18("code", { children: "inverse_transform" }),
      " reconstructs from the same stored dictionary. Returned dictionary arrays are copies."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "All data and mask values supplied to this dense route must be finite. Put a finite placeholder, such as zero, in an unmeasured data cell and set its weight to zero; the algorithm uses the separate mask to exclude it. It does not infer missingness from a zero value or silently accept NaN. Weighted cache and residual operations compute included cells only, so a huge finite excluded value cannot contaminate a product that should never have been formed. The residual sum follows N1's included-cell arithmetic but operates on the already validated arrays, avoiding a new full-mask copy at every diagnostic. Actual included products and reductions must still fit finite float64 arithmetic. Negative weights lose the nonnegative squared-error interpretation and no longer guarantee a convex fixed block, so they are refused." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For a fixed-H weighted query, each row stops relative to its own initial projected-gradient norm; the reported iteration count is the largest row count and the reported norm combines final row norms. If every row meets its relative target, their combined norm also meets the corresponding combined relative bound. A cap in any row reports ",
      /* @__PURE__ */ jsx18("code", { children: "iteration-cap" }),
      ". The joint fitter instead uses its initial joint norm as the baseline. These explicitly stated diagnostics establish approximate first-order stationarity within the supported problem; the joint nonconvex fit still needs the interpretation and validation developed earlier."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "Deeper: costs and memory." }),
      " A dense weighted-cache construction costs ",
      /* @__PURE__ */ jsx18("code", { children: "O(dk\xB2+dk)" }),
      " per row, hence ",
      /* @__PURE__ */ jsx18("code", { children: "O(ndk\xB2+ndk)" }),
      " for an amount block; the transposed pattern block has the same leading cost. Once caches are built, q coordinate sweeps cost ",
      /* @__PURE__ */ jsx18("code", { children: "O(qnk\xB2)" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "O(qdk\xB2)" }),
      " across their respective orientations. Stationarity diagnostics form their own streamed caches and add another bounded traversal. The code retains the input and mask, factors and history; temporary weighted workspace is ",
      /* @__PURE__ */ jsx18("code", { children: "O(k\xB2+max(kd,kn))" }),
      " when the two orientations run sequentially. Keeping one query row's cache across all its inner sweeps avoids rebuilding it on every iteration. For unweighted blocks the shared Gram route is cheaper and the code reuses it. These bounds describe this dense reference, not a timing result or a claim to be optimal for every sparse pattern and hardware layout."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The public comparisons deliberately cover two different contracts. For an ",
      /* @__PURE__ */ jsx18("strong", { children: "unmasked penalized fit" }),
      ", public ",
      /* @__PURE__ */ jsx18("code", { children: "NMF(solver='cd', init='custom', alpha_W=..., alpha_H=..., l1_ratio=..., shuffle=False)" }),
      " accepts copies of the same starting factors. The ",
      /* @__PURE__ */ jsx18("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.NMF.html", children: "NMF objective documentation" }),
      " specifies the axis scaling used above. The code recomputes the full objective; ",
      /* @__PURE__ */ jsx18("code", { children: "reconstruction_err_" }),
      " alone would omit penalties. Stopping conventions can differ, so similar objective values are evidence about this configured comparison, not bitwise identity of fitted factors."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For a ",
      /* @__PURE__ */ jsx18("strong", { children: "fixed-H masked row with no L1 penalty" }),
      ", the public ",
      /* @__PURE__ */ jsx18("a", { href: "https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.nnls.html", children: "SciPy NNLS route" }),
      " solves the square-root-weighted A,b problem. Adding L2 cost ",
      /* @__PURE__ */ jsx18("code", { children: "0.5\u03BB\u2082||w||\xB2" }),
      " appends ",
      /* @__PURE__ */ jsx18("code", { children: "sqrt(\u03BB\u2082)I" }),
      " to A and zeros to b. Expanding that augmented squared norm yields exactly the data cost plus L2 penalty. The returned NNLS residual norm includes this augmentation and is not by itself the original observed-data MSE. L1 adds a linear term and is handled by the explained coordinate route; we do not invent an L1 keyword for NNLS. The ordinary NMF estimator has no arbitrary cell-mask fitting parameter, so the full masked joint fit remains our explicit implementation."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The new main uses a changed constructed table ",
      /* @__PURE__ */ jsx18("code", { children: "[[2,1,3],[1,3,4],[0.5,2,2.5]]" }),
      " to demonstrate these contracts independently of the later real-data study. With \u03B1W=0.03, \u03B1H=0.04 and r=0.4, the scratch fit reached its stationarity tolerance after 385 updates: data cost about 0.00900556 and total objective about ",
      /* @__PURE__ */ jsx18("strong", { children: "1.01580058" }),
      ". The configured ordinary fit's recomputed total is also about ",
      /* @__PURE__ */ jsx18("strong", { children: "1.01580058" }),
      ", with its separate penalty terms printed. Keeping those terms separate shows why the small residual alone is not the complete optimized quantity."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The masked demonstration gives the third row no observations and uses a fractional 0.5 weight in the second row. With its stated squared penalties, it reaches tolerance after 270 updates, total about ",
      /* @__PURE__ */ jsx18("strong", { children: "0.29581822" }),
      ", and third-row amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[0,0]" }),
      ". The separate fixed-H query uses weights ",
      /* @__PURE__ */ jsx18("code", { children: "[1,0,0.25]" }),
      " and \u03BB\u2082=0.2. Its scratch amounts are approximately ",
      /* @__PURE__ */ jsx18("code", { children: "[1.779661017,0.677966102]" }),
      "; public augmented NNLS gives ",
      /* @__PURE__ */ jsx18("code", { children: "[1.779661017,0.677966102]" }),
      " at the displayed precision. The all-missing quality prints ",
      /* @__PURE__ */ jsx18("code", { children: "None" }),
      ". Finally, a deliberately rejected negative-data fit leaves the earlier dictionary intact, and an empty query still returns shape ",
      /* @__PURE__ */ jsx18("code", { children: "(0,2)" }),
      " after next-fit rank was changed to 1. These are distinct numerical, missing-information and state contracts worth checking whenever you adapt the method."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The complete retained stdout of the penalized/masked demonstration is shown below. This execution preceded the later loss-only correction that streams the same included-cell residual calculation without copying the full mask at each diagnostic. The current source above includes that correction; its affected arithmetic/invariance checks are separate evidence, and this historical stream is not a claimed new execution of the changed full main. The two penalized totals, unsupported row, weighted query, undefined missing quality and preserved fitted state retain their original roles." }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/penalties-masks-main.stdout.txt", filename: "penalties-masks-main.stdout.txt", language: "output" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For a changed-input exercise, keep the single pattern ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1]" }),
      " and row ",
      /* @__PURE__ */ jsx18("code", { children: "[2,0]" }),
      ". First derive the amount with weights ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1]" }),
      ", then with ",
      /* @__PURE__ */ jsx18("code", { children: "[1,0]" }),
      ", then add \u03BB\u2082=1 to the masked problem. The three answers are 1, 2 and 1 respectively: the final cost is ",
      /* @__PURE__ */ jsx18("code", { children: "0.5(2-w)\xB2+0.5w\xB2" }),
      ". Explain why changing the omitted cell's finite placeholder cannot change the last two answers. Next rescale only C0 of the exact three-row example by s=2 and recompute the two L1 masses; the residual stays zero but the total penalty is 5.85. A correct implementation must reproduce both the information distinction and the changed objective, not just the shape of the output arrays."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "We can now choose and inspect a factor-size preference, fit only actual measurements and keep unsupported quantities visibly separate from evidence. The next section returns to real digit measurements: we will inspect the stored dictionary and its contributions before deciding what its patterns mean." }),
    /* @__PURE__ */ jsx18("span", { id: "5-fit-real-digits-and-inspect-the-result", className: "nmf-historical-anchor" }),
    /* @__PURE__ */ jsx18(H2, { children: "12. Inspect an actual digit dictionary and contribution" }),
    /* @__PURE__ */ jsx18(Prose, { children: "How do the three-bin calculations look when each observation is a small image? The arithmetic is unchanged; the bins now have positions on a page." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D42" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Read one small square as one measured feature. These handwritten-digit observations have eight rows and eight columns, hence 64 features. Code stores them in row order: feature ",
      /* @__PURE__ */ jsx18("code", { children: "j = 8*row + column" }),
      ", with both coordinates starting at zero. Feature F35 is therefore row 4, column 3. The original measurement is a count from 0 to 16, formed by counting marked pixels in a corresponding block of the original larger binary image. Dividing by the fixed number 16 gives the intensity units used here. This is a known measurement ruler, not a maximum learned from all the images."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The eight maps above are the eight rows of one ",
      /* @__PURE__ */ jsx18("strong", { children: "recorded dictionary" }),
      ", H. C1 is the first dictionary row, C8 the eighth; these display names correspond to code indices 0 and 7. The colours preserve component identity. Each cell of a map says how much that feature receives from ",
      /* @__PURE__ */ jsx18("strong", { children: "one unit of that component's amount" }),
      ". A bright patch is a numerical pattern, not a verified pen stroke, a class label or a probability. Some patterns look stroke-like, but resemblance alone does not identify a physical cause."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "All eight maps use the same 0\u20134 ruler. They are not independently stretched to look equally bright. The largest dictionary entry is about 1.389324, so a pattern can exceed the measured image's 0\u20131 range: its units are intensity ",
      /* @__PURE__ */ jsx18("strong", { children: "per unit amount" }),
      ", and its amount need not be one. Keeping the shared ruler makes comparisons honest, even when a component looks faint."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "This dictionary was fitted earlier with eight components, seed 19, random initialization and coordinate descent. The 180 fitting images determined H. The 60 reserved images shown here were subsequently encoded with that dictionary fixed. We are now reading the recorded arrays, not training a new model. Section 13 explains why this inspection model is different from the model preferred by the recorded validation comparison. For now, ask the local question: what does one saved amount contribute to one image?" }),
    /* @__PURE__ */ jsx18(H3, { children: "Follow one amount all the way to the image" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Which pixels move when one amount changes? Follow a single component through the sum, with every other amount held still." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D43" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Start at ",
      /* @__PURE__ */ jsx18("strong", { children: "source row 242" }),
      ", whose observed digit label is 8. The label helps us describe the observation; it is not an input column used to fit the dictionary. Its C1 amount is approximately 0.176453. The image labelled C1 per-unit pattern is the raw pattern H[C1]. Multiplying each of its 64 cells by 0.176453 makes the image labelled C1 weighted addend, the ",
      /* @__PURE__ */ jsx18("strong", { children: "C1 contribution" }),
      ". The full reconstruction adds that image to seven other component contributions. The final image is the signed residual, observed minus reconstructed, on a separate ruler: a positive residual means the reconstruction is too faint at that cell; a negative residual means it is too bright."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The gain control multiplies only the selected saved amount. At gain 1, it shows the recorded reconstruction. At gain 0, it subtracts precisely the selected contribution. At gain 2, it adds one more copy. It does not refit H, optimize the other amounts or redraw a different observation. Use the source selector to compare row 242 with row 256, while C1 continues to mean the same dictionary pattern." }),
    /* @__PURE__ */ jsx18(Prose, { children: "For source row i, selected component c and gain g, the local change is" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: " p_{ic}=W_{ic}H_{c,:},\\qquad\n \\widehat x_i(g)=\\widehat x_i(1)+(g-1)p_{ic},\\qquad\n r_i(g)=x_i-\\widehat x_i(g)." }) }),
    /* @__PURE__ */ jsx18(Prose, { children: "Here p is an entire 64-feature image, not a scalar importance score. Its entries are nonnegative. Increasing g can therefore only increase or preserve each predicted pixel. A residual may move toward zero at one pixel and away from zero at another; inspect both the residual picture and the total error." }),
    /* @__PURE__ */ jsx18(Prose, { children: "There is a useful null case. Select row 242 and C8. Its saved C8 amount is exactly zero, so its contribution is a completely zero image. Moving gain changes nothing. That is an honest absence of this component from this saved encoding, not a broken control. It does not prove the raw C8 pattern is useless for every observation; row 256 uses it substantially." }),
    /* @__PURE__ */ jsx18(Prose, { children: "The 0\u20134 ruler covers every reconstruction reachable by these two source rows, eight selected components and gains from 0 to 2. Their largest reachable value is about 2.021612. Signed residuals use \u22124 to 4. Predictions are never clipped to the observed 0\u20131 range. Clipping would change the model's output and hide overshoots." }),
    /* @__PURE__ */ jsx18(H3, { children: "Distinguish a large amount from a large contribution" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Which component contributes most to row 256? Compare two different questions with two different units." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D44" }),
    /* @__PURE__ */ jsx18(Prose, { children: "The first row of bars shows the eight raw amounts W[256,c]. C7 is largest, at about 0.688493, followed by C8 at 0.628002. But one unit of C8 spreads more total intensity across its pattern. The second row multiplies each amount by its pattern's sum. C8 now contributes about 6.894594 intensity units, ahead of C7's 6.383307. The first chart answers \u201Chow many of this pattern's chosen units?\u201D; the second answers \u201Chow much predicted intensity over the whole image?\u201D They are not interchangeable." }),
    /* @__PURE__ */ jsx18(Table, { caption: "Distinguish a large amount from a large contribution", headers: [/* @__PURE__ */ jsx18(Fragment9, { children: "Component" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Saved amount" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Total contribution over 64 pixels" })], rows: [[/* @__PURE__ */ jsx18(Fragment9, { children: "C1" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.2321911099210713" }), /* @__PURE__ */ jsx18(Fragment9, { children: "2.1512220831262505" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "C2" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.011934602685408047" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.09375622389611028" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "C3" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.3424206826975729" }), /* @__PURE__ */ jsx18(Fragment9, { children: "3.8695912467273876" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "C4" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "C5" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.12081544616148039" }), /* @__PURE__ */ jsx18(Fragment9, { children: "1.2914123266438298" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "C6" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "C7" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.6884925427238711" }), /* @__PURE__ */ jsx18(Fragment9, { children: "6.383307297328288" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "C8" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.628002130601251" }), /* @__PURE__ */ jsx18(Fragment9, { children: "6.8945940980317655" })]] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Formally, let s_c = sum_j H_cj be a pattern's total mass. Its total contribution to row i is W_ic s_c. This total is unchanged by the compensating rescaling in ",
      /* @__PURE__ */ jsx18("strong", { children: "Amount is not probability or identity" }),
      ", section 2: multiplying H_c by a positive number and dividing W_ic by the same number leaves both the contribution image and its sum unchanged. A raw amount has no such invariance. In these 60 saved encodings, largest amount and largest total contribution disagree on 16 rows. That describes this saved inspection, not a universal frequency or a claim about which digit is recognized."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "Total contribution still is not an all-purpose definition of importance. It sums intensity, so a broad diffuse pattern can contribute a large total without uniquely explaining a distinctive feature. Error increase under a specific edit, downstream task performance and external meaning answer different questions. Name the question before choosing the score." }),
    /* @__PURE__ */ jsx18(H3, { children: "Remove one contribution without pretending to refit" }),
    /* @__PURE__ */ jsx18(Prose, { children: "What happens when we remove C8 from row 256? This time keep the source and component fixed so the only moving idea is the removal fraction." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D45" }),
    /* @__PURE__ */ jsx18(Prose, { children: "At fraction 0, the current reconstruction is the saved sum. At fraction 1, the full C8 contribution has been removed; every other component retains its saved amount. The observed image never changes. The removed-addend image shows exactly what has been subtracted, and the residual shows where that subtraction helps or hurts. Mean squared error rises from about 0.02758816 to 0.07326254. This is a controlled numerical edit of a representation. It is not evidence that a real-world intervention could remove a biological or physical source in the same way." }),
    /* @__PURE__ */ jsx18(Prose, { children: "Why can some pixels improve while the total gets worse? Let p be the C8 contribution, e = x \u2212 x\u0302 the original residual, and r the removal fraction. The edited prediction is x\u0302 \u2212 rp; its residual is e + rp. Expanding the square gives" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: " \\operatorname{MSE}(r)-\\operatorname{MSE}(0)\n =\\frac{2r\\langle e,p\\rangle+r^2\\|p\\|^2}{64}." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Individual terms can have either sign because e is signed. Their sum is the relevant quantity for squared-error fitting. If the original amounts were an ",
      /* @__PURE__ */ jsx18("strong", { children: "exact fixed-dictionary NNLS optimum" }),
      ", removal is another feasible nonnegative amount vector and cannot lower total loss. For a positive coordinate at an exact optimum, its gradient is zero, giving \u27E8e,p\u27E9 = 0; removing that nonzero contribution then adds r\xB2||p||\xB2/64. A zero amount has p = 0 and changes nothing. A finite-tolerance saved fit need not satisfy these equalities exactly; the reported numerical change is what this recorded example actually does. Do not turn a solver tolerance into an exact theorem about every saved row."
    ] }),
    /* @__PURE__ */ jsx18(H3, { children: "Implement contributions, normalization and correspondence" }),
    /* @__PURE__ */ jsx18(Prose, { children: "How can we inspect factors without manufacturing a huge array of every row\u2013component\u2013pixel contribution? Calculate only the output needed for the question." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The complete source below imports the validation and matrix multiplication helpers already explained in ",
      /* @__PURE__ */ jsx18("strong", { children: "Fit both factors and decide when to stop" }),
      ", section 6. ",
      /* @__PURE__ */ jsx18("code", { children: "row_contribution" }),
      " makes only one feature vector. ",
      /* @__PURE__ */ jsx18("code", { children: "contribution_totals" }),
      " uses the dictionary row sums and makes an n\xD7k table, not an n\xD7k\xD7d tensor. ",
      /* @__PURE__ */ jsx18("code", { children: "change_component_gain" }),
      " copies one amount row, edits one entry and reconstructs it."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("code", { children: "normalize_patterns" }),
      " makes each positive pattern sum to one and multiplies the corresponding amount column by its old sum. The product is preserved. An all-zero pattern has no direction or positive mass to normalize; the function labels it unusable and returns zero normalized pattern and zero compensated amount. This changes an arbitrary coefficient of an unused pattern without changing a single reconstructed pixel."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "When comparing two fits, normalize positive pattern rows before matching their shapes. ",
      /* @__PURE__ */ jsx18("code", { children: "align_patterns" }),
      " computes pairwise squared distances, then asks the public SciPy ",
      /* @__PURE__ */ jsx18("code", { children: "linear_sum_assignment" }),
      " routine for a minimum-total-cost one-to-one assignment. Rectangular dictionaries leave some usable patterns unmatched. Unused zero patterns are reported separately. This is a display correspondence, not a proof that the fits are identical or that either recovered a true source."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "There can be multiple best matchings even without duplicate patterns. To detect that global ambiguity in a small display, the optional audit forbids each chosen edge in turn and solves again. Any distinct matching must omit at least one chosen edge, so this covers alternatives within the declared numerical tolerance. The report says ",
      /* @__PURE__ */ jsx18("strong", { children: "no alternative within tolerance" }),
      ", not \u201Cmathematically unique.\u201D Above the explicit size limit it says ",
      /* @__PURE__ */ jsx18("strong", { children: "not audited" }),
      " rather than pretending the ambiguity check ran."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "For similarly sized k-component dictionaries, cost construction takes O(k\xB2d) arithmetic and O(k\xB2) retained costs, plus the normalized factors. One dense assignment has a conventional O(k\xB3) bound. The optional global audit can make k further assignments, raising the conservative bound to O(k\u2074); it is deliberately capped for small displays. The implementation builds one row of costs at a time, avoiding a k\xD7k\xD7d difference tensor. For already validated factors, reconstructing one row takes O(kd), while multiplying one selected amount by its length-d pattern takes O(d) arithmetic and O(d) output. The delivered row_contribution wrapper first validates the whole k\xD7d dictionary and the k-entry amount row through nonnegative_table and real_table: that copies/scans O(kd+k) input cells. Its end-to-end time is therefore O(kd+k), with O(kd+k+d) temporary/output storage, rather than O(d). This safety cost avoids trusting caller state; an internal validated kernel can reuse validated factors without those copies. Requested all-row reconstruction takes O(nkd) arithmetic, and its n\xD7d output is itself a storage cost. These are operation bounds for this route, not a claim of universal fastest execution." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Save the source as ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_factor_alignment.py" }),
      " beside the earlier ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_arrays.py" }),
      " helper."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_factor_alignment.py", filename: "nmf_factor_alignment.py", language: "python" }),
    /* @__PURE__ */ jsx18(Prose, { children: "The following output comes from this program's small constructed example. Its zero third pattern is deliberately included to show the unused-pattern rule; it is separate from the eight-component digit inspection." }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_factor_alignment.stdout.txt", filename: "nmf_factor_alignment.stdout.txt", language: "output" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Read ",
      /* @__PURE__ */ jsx18("code", { children: "pairs=((0,1),(1,0))" }),
      " as original pattern 0 matching the other dictionary's pattern 1 and vice versa. The cost is zero because only scale and order changed. The duplicated two-pattern example has a genuine alternative correspondence. Neither matching changes the reconstruction or supplies a physical identity."
    ] }),
    /* @__PURE__ */ jsx18(H3, { children: "Read the recorded images reproducibly" }),
    /* @__PURE__ */ jsx18(Prose, { children: "How do we preserve the exact dictionary behind the pictures? Read a complete saved state and its attributed measurement file, and refuse a mismatched or missing input." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The next program needs four local siblings: ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_arrays.py" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_factor_alignment.py" }),
      ", the complete ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_saved_state.json" }),
      ", and ",
      /* @__PURE__ */ jsx18("code", { children: "digits-300.csv" }),
      ". Keep ",
      /* @__PURE__ */ jsx18("code", { children: "digits-data-provenance.md" }),
      " with them for source, license, selection and units. The shared file index contains each of these. With NumPy and SciPy available, run ",
      /* @__PURE__ */ jsx18("code", { children: "python nmf_saved_digits.py" }),
      ". This reader needs no scikit-learn import, network request or new fit. The saved model was produced using the separately recorded environment and fitting program; reading it in a new environment does not create a new training result."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("code", { children: "verified_bytes" }),
      " binds the two inputs to the exact example. ",
      /* @__PURE__ */ jsx18("code", { children: "load_saved_digits" }),
      " checks the fixed scale, model, feature order and shapes, then matches every reserved observation by its source ID, label and 64 raw measurements. Source ID is an address, not an array position. The saved H, W and observed arrays are read-only and the source-ID lookup cannot be edited through its mapping interface. The metadata dictionary is descriptive ordinary Python data; it is not advertised as recursively immutable."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("code", { children: "describe_saved_row" }),
      " uses the same contribution functions as the pictures. It returns the observation, selected addend, reconstruction, signed residual, controlled changed reconstruction and both MSEs. The original saved amounts are not overwritten. Missing files raise a clear file error, and a changed hash raises an identity error. There is deliberately no fallback that silently trains a different model while displaying these recorded claims."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Save the source as ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_saved_digits.py" }),
      " beside those inputs."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_saved_digits.py", filename: "nmf_saved_digits.py", language: "python" }),
    /* @__PURE__ */ jsx18(Prose, { children: "The full output is included so the image panels can be checked cell by cell. Each bracketed row is one image row; corresponding addresses line up across observed, addend, reconstruction and residual. Printed decimals are rounded for display, while the saved arrays and computations retain their floating precision." }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_saved_digits.stdout.txt", filename: "nmf_saved_digits.stdout.txt", language: "output" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For row 242, the C1 removal increases MSE from about 0.02150364 to 0.02468635. For row 256, C8 removal gives the larger change studied above. The final ",
      /* @__PURE__ */ jsx18("code", { children: "True" }),
      " is the separate row-242/C8 null case. An MSE is an average over 64 squared feature residuals, not a percentage of wrongly classified digits."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The source-ID and file checks protect correspondence; they do not validate the model statistically. We have learned to read ",
      /* @__PURE__ */ jsx18("strong", { children: "what this saved representation does" }),
      ". The next section asks a different question: ",
      /* @__PURE__ */ jsx18("strong", { children: "how was a representation chosen, and what does its independent comparison actually support?" }),
      ""
    ] }),
    /* @__PURE__ */ jsx18(H2, { children: "13. Separate a representation decision from its evaluation" }),
    /* @__PURE__ */ jsx18(Prose, { children: "The saved pictures showed what one dictionary does. How do we decide which representation to use without letting the examples used for judging it also choose it? Follow the rows before comparing the errors." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D46" }),
    /* @__PURE__ */ jsx18(Prose, { children: "The CSV has 300 observations, each with a source ID, a descriptive digit label and 64 measured pixel features. Only the 64 features enter a dictionary fit. The fixed divisor 16 converts counts to intensity units before fitting; it is not estimated from the dataset. The original split uses seed 19 twice, preserving label proportions: 180 rows for training, 60 for validation and 60 reserved for the test comparison. Labels influence this stratification and the balanced subset selection; they do not become factorization features." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The arrows show a direction of information. ",
      /* @__PURE__ */ jsx18("strong", { children: "Training rows" }),
      " determine the dictionary. ",
      /* @__PURE__ */ jsx18("strong", { children: "Validation rows" }),
      " are encoded against that fixed dictionary and help compare candidate settings. ",
      /* @__PURE__ */ jsx18("strong", { children: "Reserved test rows" }),
      " assess a declared representation after its intended choice. Encoding a reserved row optimizes that row's amounts with H fixed; it does not send the row back into dictionary fitting. In a later supervised system, learned vocabulary, IDF, dictionary and classifier must all be fitted within the training fold, then frozen for its validation/test rows."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The diagram shows actual source IDs, not just hypothetical buckets. In this protocol source row 242 is the first reserved observation, row 256 the second; row 31 is a training observation and row 286 a validation observation. These are addresses in the original source collection, not local array indices or writer IDs. The full ordered partition is retained with the new controlled study below so a comparison can be traced back to the exact rows." }),
    /* @__PURE__ */ jsx18(H3, { children: "Inspect all the candidates before naming a choice" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Which of the recorded rank and seed choices reconstructed validation rows best? Look at every recorded point, with a zero-origin error axis." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D47" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Each training/validation pair belongs to one actual fit, not an average with invented uncertainty bars. The lower validation error among these eight recorded candidates is k=16, seed 7, at approximately 0.01354792. The k=8, seed-19 dictionary used in section 12 was chosen as a fixed, inspectable eight-pattern example; its validation error is approximately 0.02631530. It is not the winner of this candidate comparison, and the plot does not justify calling eight an automatically selected elbow." }),
    /* @__PURE__ */ jsx18(Table, { caption: "Inspect all the candidates before naming a choice", headers: [/* @__PURE__ */ jsx18(Fragment9, { children: "Components k" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Seed" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Training MSE" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Validation MSE" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Fitting iterations" })], rows: [[/* @__PURE__ */ jsx18(Fragment9, { children: "1" }), /* @__PURE__ */ jsx18(Fragment9, { children: "7" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.07214412726956479" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.07280297762810437" }), /* @__PURE__ */ jsx18(Fragment9, { children: "6" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "1" }), /* @__PURE__ */ jsx18(Fragment9, { children: "19" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.07214412726956489" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.07280297804796376" }), /* @__PURE__ */ jsx18(Fragment9, { children: "6" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "4" }), /* @__PURE__ */ jsx18(Fragment9, { children: "7" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.04040871277824657" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.041899149163385656" }), /* @__PURE__ */ jsx18(Fragment9, { children: "192" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "4" }), /* @__PURE__ */ jsx18(Fragment9, { children: "19" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.040408712822337434" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.041899935779433586" }), /* @__PURE__ */ jsx18(Fragment9, { children: "207" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "8" }), /* @__PURE__ */ jsx18(Fragment9, { children: "7" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.02475004181007092" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.025548017870485402" }), /* @__PURE__ */ jsx18(Fragment9, { children: "261" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "8" }), /* @__PURE__ */ jsx18(Fragment9, { children: "19" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.025147105358696256" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.026315303314664616" }), /* @__PURE__ */ jsx18(Fragment9, { children: "448" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "16" }), /* @__PURE__ */ jsx18(Fragment9, { children: "7" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.012295160150866928" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.013547922081604519" }), /* @__PURE__ */ jsx18(Fragment9, { children: "575" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "16" }), /* @__PURE__ */ jsx18(Fragment9, { children: "19" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.012729497371186178" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.015288655568708278" }), /* @__PURE__ */ jsx18(Fragment9, { children: "560" })]] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Different seeds can reach different factors and errors because joint fitting is nonconvex. A larger k expands the set of possible exact products: an earlier solution can be embedded by adding unused components. Thus the globally best training objective cannot worsen merely because k grows. A particular finite optimizer run need not reach that global best, however. The observed downward trend is an outcome of these runs, not a theorem about every call to ",
      /* @__PURE__ */ jsx18("code", { children: "fit" }),
      " or about reserved performance."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "Choosing settings from validation is legitimate, but repeated adaptation to the same small validation set can overfit that comparison too. Use a declared search and an appropriate resampling strategy when uncertainty or task stakes demand it. These two seeds are individual runs, not enough by themselves to estimate broad algorithm variability. This lesson retains their individual outcomes and avoids a fabricated confidence interval." }),
    /* @__PURE__ */ jsx18(H3, { children: "Compare the declared representations on reserved rows" }),
    /* @__PURE__ */ jsx18(Prose, { children: "What does the recorded test comparison actually measure? Compare reconstruction under three different model classes, then look at matched images in a separately declared study." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D48" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The first three bars retain the ",
      /* @__PURE__ */ jsx18("strong", { children: "original fixed-eight-component comparison" }),
      ". The mean baseline predicts the same training-mean image for every reserved row. PCA8 stores a training mean and eight signed orthogonal directions; a query is centered, projected and reconstructed with the mean added back. NMF8 uses the previously inspected eight nonnegative patterns and nonnegative query amounts. Their recorded mean squared errors over the same 60\xD764 measured cells are:"
    ] }),
    /* @__PURE__ */ jsx18(Table, { caption: "Compare the declared representations on reserved rows", headers: [/* @__PURE__ */ jsx18(Fragment9, { children: "Original reserved comparison" }), /* @__PURE__ */ jsx18(Fragment9, { children: "MSE" })], rows: [[/* @__PURE__ */ jsx18(Fragment9, { children: "Training-mean image" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.06999462363160687" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "PCA8" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.019678463136677867" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "NMF8, fixed k=8/seed19 inspection" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.02538089143047506" })]] }),
    /* @__PURE__ */ jsx18(Prose, { children: "PCA8 has the lower recorded error. Nonnegative addition may be useful for a desired representation, but it does not automatically minimize reconstruction error across these different model classes. PCA is an affine model that stores a mean in addition to its directions; NMF is a cone model with nonnegative amounts. Equal coordinate counts do not make their constraints or parameter counts identical. Neither reconstruction metric measures digit-recognition accuracy." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The matched images below the bars belong to a ",
      /* @__PURE__ */ jsx18("strong", { children: "new, separately declared six-coordinate comparison" }),
      ", not to missing historical PCA8 factors. Both dictionaries/bases were fitted only on the same 180 training rows. The declared settings were PCA6 with full SVD and no whitening, and NMF6 with NNDSVD-average initialization, coordinate descent, seed 23, Frobenius loss, zero penalties, tolerance 10\u207B\u2076 and a 3,000-iteration cap. Source rows 242 and 256 were specified for inspection before these new reconstructions were produced. We did not choose six or these examples by minimizing their reserved errors."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For the new comparison, read the observation, training-mean prediction, PCA6 prediction and NMF6 prediction at the ",
      /* @__PURE__ */ jsx18("strong", { children: "same pixel addresses and intensity ruler" }),
      ". This ruler extends from \u22120.25 to 1.25 because signed PCA can predict negative cells and both methods can overshoot 1. A zero tick separates negative intensity predictions from positive ones; values are not clipped or independently autoscaled. The earlier dictionary maps used 0\u20134 per unit amount, a different displayed object. Here we compare actual reconstructed intensity."
    ] }),
    /* @__PURE__ */ jsx18(Table, { caption: "Compare the declared representations on reserved rows", headers: [/* @__PURE__ */ jsx18(Fragment9, { children: "New predeclared six-coordinate comparison" }), /* @__PURE__ */ jsx18(Fragment9, { children: "MSE over all 60 reserved rows" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Row 242 MSE" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Row 256 MSE" })], rows: [[/* @__PURE__ */ jsx18(Fragment9, { children: "Training mean" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.06999462363160687" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.04595146273389275" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.06796480908805942" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "PCA6" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.02416372023704315" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.021948620787064027" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.024197862895577522" })], [/* @__PURE__ */ jsx18(Fragment9, { children: "NMF6" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.030231907695106697" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.026957889373735507" }), /* @__PURE__ */ jsx18(Fragment9, { children: "0.03327840298161405" })]] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The new NMF fit took 229 fitting iterations, below its cap, and emitted no captured convergence warnings. That is useful solver information, not a proof of a global optimum or of negligible statistical uncertainty. The mean baseline agrees with the original comparison because its training rows and rule are unchanged. The PCA/NMF numbers differ because the new study has different coordinate counts and NMF initialization/settings. Keep these roles separate rather than silently using new images as evidence for the old eight-coordinate numbers." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The full reserved prediction ranges in this new study are mean ",
      /* @__PURE__ */ jsx18("code", { children: "[0,0.7381944444]" }),
      ", PCA6 ",
      /* @__PURE__ */ jsx18("code", { children: "[-0.2351021065,1.2007030976]" }),
      " and NMF6 ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1.1729489320]" }),
      ". A negative PCA cell is an allowed affine-model prediction, not a negative observed count. If an application requires output clipping, that defines another prediction rule and its metrics must be evaluated explicitly. It cannot be introduced just to make pictures look plausible."
    ] }),
    /* @__PURE__ */ jsx18(H3, { children: "Preserve the measurement ruler and address" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Which number does a plotted cell actually represent? Trace one measured bin into the earlier saved eight-component reconstruction." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D49" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For source row 242, pixel row 4, column 3 is flattened feature F35 because ",
      /* @__PURE__ */ jsx18("code", { children: "8*4+3=35" }),
      ". Its raw count is 16; division by the fixed measurement ruler gives 1. The original saved NMF8 reconstruction at that same address is approximately 1.0176746162. The original row-256 reconstruction reaches approximately 1.227710461 at F26. These are the eight-component results from section 12, not the new six-component images just compared."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The difference between raw counts, scaled measurements, per-unit dictionary patterns, amount-weighted contributions and reconstructed intensities is part of the model. State which one an axis or colour legend shows. Hashes and source addresses maintain correspondence, while a model's validation comes from a properly designed comparison; neither replaces the other." }),
    /* @__PURE__ */ jsx18(H3, { children: "Keep the original program and evidence" }),
    /* @__PURE__ */ jsx18(Prose, { children: "How were the recorded candidate and fixed-eight comparisons produced? The complete original program below preserves that question and its recorded output." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "It first fits eight candidate NMF models on training rows and encodes validation rows. It then separately fits the predeclared eight-component inspection model and PCA8 on training rows, and compares their reserved reconstructions to the training mean. That last block does ",
      /* @__PURE__ */ jsx18("strong", { children: "not" }),
      " fit the validation winner k=16. A future study of that selected model would need its own declared evaluation; these old test numbers cannot be relabelled as its result."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Save ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_digits.py" }),
      " beside the attributed ",
      /* @__PURE__ */ jsx18("code", { children: "digits-300.csv" }),
      ". NumPy and scikit-learn supply the ordinary numerical tools. This is the original executable route, with its earlier recorded environment/output; the outputs shown are retained evidence, not a claim that every future library environment will reproduce identical final digits. We have already explained the scratch fitting and public NNLS mechanics in sections 4\u20136; PCA's from-scratch centered projection is taught in ",
      /* @__PURE__ */ jsx18("a", { href: "https://ronak.sh/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#4-fit-once-project-and-reconstruct-in-python", children: "PCA \xA74" }),
      ". Those owners explain the computational mechanisms rather than hiding the work behind these imports."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_digits.py", filename: "nmf_digits.py", language: "python" }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_digits.retained.stdout.txt", filename: "nmf_digits.retained.stdout.txt", language: "output" }),
    /* @__PURE__ */ jsx18(Prose, { children: "The program prints rounded errors, while the table retains the original full-precision recorded report. Its first reconstructed image is source 242; it is not an average digit and not a PCA reconstruction." }),
    /* @__PURE__ */ jsx18(H3, { children: "Run the separate controlled image study deliberately" }),
    /* @__PURE__ */ jsx18(Prose, { children: "How can we produce matched comparison images without confusing them with the original experiment? Use a differently named program, explicit settings and saved row identities." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("code", { children: "nmf_digit_comparison.py" }),
      " reads the verified CSV and saved-state identities supplied in section 12. It reconstructs the exact split and checks every reserved source ID in order ",
      /* @__PURE__ */ jsx18("strong", { children: "before fitting" }),
      ". It then runs only the new NMF6/PCA6 study, with training-only mean/dictionaries, frozen query transforms and separate train/validation/test metrics. Warnings and cap status travel with the output. There is no rank search or tuning based on reserved outcomes."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The printed JSON includes the settings, all partition IDs, trained PCA mean/basis, NMF dictionary, complete selected images and row encodings. For PCA, ",
      /* @__PURE__ */ jsx18("code", { children: "z=(x\u2212mean)@components.T" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "x_hat=z@components+mean" }),
      "; for NMF, ",
      /* @__PURE__ */ jsx18("code", { children: "x_hat=w@H" }),
      " with w obtained by fixed-H encoding. The same source IDs let you independently multiply those arrays back into every shown pixel. The reader in section 12 still refuses absent saved files; running this explicitly named new study is never an automatic fallback."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The dense input is deliberately only 300\xD764. A full PCA SVD has conventional O(nd min(n,d)) arithmetic on the training matrix and O(nd) matrix workspace/output storage; query projection/reconstruction costs O(qkd). NMF's per-sweep and encoding costs are the cached-coordinate costs already derived in sections 5\u20136, multiplied by their actual iteration work; the cap is not an observed runtime estimate. Keeping only the two requested comparison rows avoids an unnecessary all-row/component/feature contribution tensor. The full dictionaries, split and selected pixels in the JSON are reproducibility outputs, not things a browser must recompute while a learner drags a control." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Save this program beside ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_saved_digits.py" }),
      " and its verified siblings, then run ",
      /* @__PURE__ */ jsx18("code", { children: "python nmf_digit_comparison.py" }),
      ". The shown new result used Python 3.12.14, NumPy 2.3.5 and scikit-learn 1.9.1. Its full JSON is a companion output file; the figure/table above extracts its literal selected arrays and metrics without fitting again."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_digit_comparison.py", filename: "nmf_digit_comparison.py", language: "python" }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_digit_comparison.stdout.txt", filename: "nmf_digit_comparison.stdout.txt", language: "output" }),
    /* @__PURE__ */ jsx18(Prose, { children: "These two studies support reconstruction comparisons within this small, balanced early-index subset. The 300 rows are the first 30 examples per digit from the scikit-learn copy of the UCI collection's test portion, selected before the local split. Writer IDs are not available here, so this is not a held-out-writer study or a claim about handwriting outside this collection. It is not MNIST, the whole UCI corpus or a recognition benchmark." }),
    /* @__PURE__ */ jsx18(Prose, { children: "We can now distinguish an inspected representation, a validation-based setting choice and a reserved comparison. A final question remains even when all three are done carefully: can the observed matrix uniquely determine the patterns? The next section uses exact small examples to examine that issue without mixing it up with testing error." }),
    /* @__PURE__ */ jsx18("span", { id: "7-deeper-geometry-optimization-and-the-limits-of-factorization", className: "nmf-historical-anchor" }),
    /* @__PURE__ */ jsx18(H2, { children: "14. Decide what a factorization can identify" }),
    /* @__PURE__ */ jsx18(Prose, { children: "The reserved comparison tells us how accurately a representation reconstructs new rows. Does a good reconstruction also tell us which patterns produced the observations? Return to a small exact example so we can separate this question from solver error." }),
    /* @__PURE__ */ jsx18(H3, { children: "See two different dictionaries explain the same row" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Can two genuinely different nonnegative explanations give exactly the same measurements? Watch the directions change while their sum stays fixed." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D50" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The observed row is ",
      /* @__PURE__ */ jsx18("code", { children: "[2,3,3]" }),
      ". The first dictionary has C0=",
      /* @__PURE__ */ jsx18("code", { children: "[1,1,1]" }),
      ", C1=",
      /* @__PURE__ */ jsx18("code", { children: "[0,1,1]" }),
      ", with amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1]" }),
      ". This is the ",
      /* @__PURE__ */ jsx18("strong", { children: "separate shear example from Amount is not probability or identity" }),
      ", section 2; it is not the earlier H0=",
      /* @__PURE__ */ jsx18("code", { children: "[[1,0,1],[0,1,1]]" }),
      ". We changed the example because H0 contains a zero that would forbid the particular shear below."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Keep C1 fixed. As t rises from 0 to 1, replace C0 by ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1\u2212t,1\u2212t]" }),
      " and increase C1's amount to ",
      /* @__PURE__ */ jsx18("code", { children: "1+2t" }),
      ". Two units of C0 lose ",
      /* @__PURE__ */ jsx18("code", { children: "2t" }),
      " from the second and third bins, while the added ",
      /* @__PURE__ */ jsx18("code", { children: "2t" }),
      " units of C1 return precisely that intensity. Every component and amount remains nonnegative. At t=0.5 the alternative factors are amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[2,2]" }),
      ", patterns ",
      /* @__PURE__ */ jsx18("code", { children: "[[1,0.5,0.5],[0,1,1]]" }),
      "; both still produce ",
      /* @__PURE__ */ jsx18("code", { children: "[2,3,3]" }),
      ". At t=1 the first pattern has become ",
      /* @__PURE__ */ jsx18("code", { children: "[1,0,0]" }),
      ", and the amounts are ",
      /* @__PURE__ */ jsx18("code", { children: "[2,3]" }),
      "."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The first ray changes its direction, so this is more than rescaling or reordering component labels. In matrix form, write" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: " T=\\begin{bmatrix}1&t\\\\0&1\\end{bmatrix},\\qquad\n T^{-1}=\\begin{bmatrix}1&-t\\\\0&1\\end{bmatrix}." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Then ",
      /* @__PURE__ */ jsx18("code", { children: "(wT)(T\u207B\xB9H) = wH" }),
      ", with ",
      /* @__PURE__ */ jsx18("code", { children: "wT=[2,1+2t]" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "T\u207B\xB9H=[[1,1\u2212t,1\u2212t],[0,1,1]]" }),
      ". T\u207B\xB9 contains a negative entry, but its product with ",
      /* @__PURE__ */ jsx18("strong", { children: "this particular H" }),
      " is nonnegative throughout the declared range. A transformation need not be nonnegative entrywise for its transformed factors to be feasible. Conversely, an arbitrary invertible transformation is not automatically allowed: it can create negative amounts or pattern cells. Substituting H0 would give a negative second cell in the first transformed pattern for any positive t, explaining the earlier warning concretely."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "Identifiability" }),
      " asks whether the observations and stated assumptions determine the desired factors, allowing the unavoidable naming and unit conventions. This witness shows that nonnegativity and exact reconstruction alone do not always identify them. It does not prove all datasets are ambiguous. Additional structure can make recovery possible; the next section studies the particularly tangible assumption that some observed rows are pure patterns."
    ] }),
    /* @__PURE__ */ jsx18(H3, { children: "Understand what one nonnegative rank-one term can cover" }),
    /* @__PURE__ */ jsx18(Prose, { children: "How many additive components can an exact matrix require? Start with the cells that one component is allowed to make positive." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D51" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "In the outer-product picture, a nonnegative column u selects some observation rows and a nonnegative row v selects some feature columns. Their term is ",
      /* @__PURE__ */ jsx18("code", { children: "uv" }),
      ": cell ",
      /* @__PURE__ */ jsx18("code", { children: "(i,j)" }),
      " receives ",
      /* @__PURE__ */ jsx18("code", { children: "u_i v_j" }),
      ". Wherever both selected entries are positive, that cell is positive. Its positive cells therefore form a row-set \xD7 column-set ",
      /* @__PURE__ */ jsx18("strong", { children: "rectangle" }),
      ". Rectangle means this Cartesian product, not necessarily adjacent cells in the displayed matrix."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For example, u=",
      /* @__PURE__ */ jsx18("code", { children: "[1,0,2,0]\u1D40" }),
      " and v=",
      /* @__PURE__ */ jsx18("code", { children: "[0,3,0,4]" }),
      " make positive cells at rows0/2 and columns1/3, with values3/4 in row0 and6/8 in row2. The holes between these positions do not change the rectangle argument. This is the same component outer product introduced in ",
      /* @__PURE__ */ jsx18("strong", { children: "Build one observation from positive amounts" }),
      ", now used to reason about support\u2014the locations of nonzero entries."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "Consider the exact binary matrix" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: " X_\\square=\\begin{bmatrix}\n 1&1&0&0\\\\\n 0&1&1&0\\\\\n 0&0&1&1\\\\\n 1&0&0&1\n \\end{bmatrix}." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The four outlined diagonal cells are positive. Could a single nonnegative rank-one term contribute positively to two of them, ",
      /* @__PURE__ */ jsx18("code", { children: "(i,i)" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "(j,j)" }),
      "? That would require ",
      /* @__PURE__ */ jsx18("code", { children: "u_i,v_i,u_j,v_j" }),
      " all positive. Its cross cells ",
      /* @__PURE__ */ jsx18("code", { children: "(i,j)" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "(j,i)" }),
      " would then also be positive. But for every pair of distinct outlined diagonal cells in this matrix, at least one cross cell is an observed zero. For example, to cover ",
      /* @__PURE__ */ jsx18("code", { children: "(0,0)" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "(1,1)" }),
      ", the rectangle would make ",
      /* @__PURE__ */ jsx18("code", { children: "(1,0)" }),
      " positive even though X there is zero."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "There is no negative component to cancel that forbidden positive entry. In an exact sum of nonnegative terms, every term must be zero at every zero of X. Thus no one term can cover two of the four chosen diagonal positives. Each chosen positive must be covered by at least one term, so at least four terms are needed. The diagonal selector only highlights one witness and its forbidden cross cells; it never changes X or performs a numerical factorization." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "This is a ",
      /* @__PURE__ */ jsx18("strong", { children: "support lower bound" }),
      ". A chosen set of positive entries with these pairwise forbidden cross cells is often called a fooling set in rectangle-cover arguments. We have proved the four-component lower bound directly; learning that name is not required to follow the proof. Different matrices require different lower-bound arguments, and a rectangle cover alone need not solve the numerical factorization problem because positive values also have to agree."
    ] }),
    /* @__PURE__ */ jsx18(H3, { children: "Separate ordinary rank from nonnegative rank" }),
    /* @__PURE__ */ jsx18(Prose, { children: "Why not read the number of required components from ordinary matrix rank? The same four-by-four example makes the difference exact." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D52" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The ordinary rank is 3. Its top-left 3\xD73 submatrix is upper triangular with all diagonal entries 1, so its determinant is 1 and the rank is at least 3. The four full rows satisfy ",
      /* @__PURE__ */ jsx18("code", { children: "row0 \u2212 row1 + row2 \u2212 row3 = 0" }),
      ", so the rank is at most 3. Together these facts give rank exactly 3, without a numerical tolerance or a fitted model."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The ",
      /* @__PURE__ */ jsx18("strong", { children: "nonnegative rank" }),
      ", written rank\u208A(X), is the smallest k for which an exact product X=WH exists with both factors nonnegative and inner dimension k. The support proof requires at least 4 here. The product ",
      /* @__PURE__ */ jsx18("code", { children: "I\u2084 X_square" }),
      " is a valid nonnegative factorization with four components, so the lower and upper bounds meet: rank\u208A(X_square)=4."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "In general," }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: " \\operatorname{rank}(X)\\leq\\operatorname{rank}_+(X)\n \\leq\\min(n,d),\\qquad X\\geq0." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The first inequality follows because any n\xD7k times k\xD7d product has ordinary rank at most k, regardless of signs. For the second, ",
      /* @__PURE__ */ jsx18("code", { children: "I_n X" }),
      " uses n nonnegative terms and ",
      /* @__PURE__ */ jsx18("code", { children: "X I_d" }),
      " uses d; choose the smaller. These bounds concern exact algebraic representation. A requested rank in an approximate fitting routine is a model choice, not a computed certificate of nonnegative rank."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The positive-epsilon inset changes a premise: adding a small positive quantity to every cell removes all exact zeros. A component is no longer forbidden from covering a cross cell just because that cell used to be zero. The four-rectangle proof therefore no longer establishes the new matrix's nonnegative rank. This does not, by itself, prove that its nonnegative rank has dropped; the argument simply stopped applying. Similarly, allowing a nonzero approximation error weakens an exact support obstruction. A tiny cross-cell value or a small Frobenius error is not an exact zero." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The practical consequence is to keep three questions separate. ",
      /* @__PURE__ */ jsx18("strong", { children: "Representation:" }),
      " how many nonnegative terms suffice to the required accuracy? ",
      /* @__PURE__ */ jsx18("strong", { children: "Optimization:" }),
      " did this algorithm find a good solution for the chosen k? ",
      /* @__PURE__ */ jsx18("strong", { children: "Identification:" }),
      " do the observations and external assumptions determine the scientifically intended patterns? A small error, a stationarity diagnostic and a rank claim answer different parts of that list."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "A quick changed case checks the logic. If two observed features are exact copies, ordinary rank can decrease; that fact alone still does not specify which physical sources exist. If a known pure-pattern observation is added, it may constrain the feasible cone substantially. That is why the next section changes the information available, rather than merely asking the same optimizer to run longer." }),
    /* @__PURE__ */ jsx18(H2, { children: "15. When anchors help recover the dictionary" }),
    /* @__PURE__ */ jsx18(Prose, { children: "The previous section showed that exact reconstruction need not identify the patterns. What extra observation would help? If we have actually measured a pure pattern, its direction is no longer hidden inside an arbitrary mixture." }),
    /* @__PURE__ */ jsx18(H3, { children: "Turn a cone into a slice we can see" }),
    /* @__PURE__ */ jsx18(Prose, { children: "How can we compare mixture directions without confusing them with overall brightness? Divide a positive observation by its total intensity." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D53" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Here we temporarily use two features so the entire geometry fits on the page. The two patterns are P0=",
      /* @__PURE__ */ jsx18("code", { children: "[1,0]" }),
      " and P1=",
      /* @__PURE__ */ jsx18("code", { children: "[0,1]" }),
      ". Amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1]" }),
      " produce the row ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1]" }),
      ". Dividing that row by its mass, 3, gives ",
      /* @__PURE__ */ jsx18("code", { children: "[2/3,1/3]" }),
      ". Both normalized coordinates add to one, so the point lies on the line joining the two normalized patterns. When the first amount becomes zero and the second stays one, the point reaches P1. Brightness changed, but we can now inspect direction on a common slice."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For general patterns, their masses also matter. Let ",
      /* @__PURE__ */ jsx18("code", { children: "t_c = sum_j H_cj > 0" }),
      ", let ",
      /* @__PURE__ */ jsx18("code", { children: "p_c = H_c/t_c" }),
      " be a unit-mass pattern, and let ",
      /* @__PURE__ */ jsx18("code", { children: "s_i = sum_j x_ij > 0" }),
      ". If the exact mixture is x_i = sum_c W_ic H_c, then"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: " z_i=\\frac{x_i}{s_i}=\\sum_c a_{ic}p_c,\n \\qquad a_{ic}=\\frac{W_{ic}t_c}{s_i},\n \\qquad \\sum_c a_{ic}=1." }) }),
    /* @__PURE__ */ jsx18(Prose, { children: "The a coefficients are fractions of this row's total modeled intensity. They are not automatically class probabilities or physical material fractions. Dividing W by its own row sum instead would generally be wrong when the pattern masses differ. The all-zero observation has s_i=0 and no direction on this slice: keep its original ID, exclude it from geometric selection, and do not divide by zero. An unused zero pattern likewise has no direction to recover." }),
    /* @__PURE__ */ jsx18(H3, { children: "Locate a pattern that is actually observed" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "What makes an observed point an ",
      /* @__PURE__ */ jsx18("strong", { children: "anchor" }),
      "? It is a pure-pattern direction already present among the measurements, rather than an imagined vertex inferred outside them."
    ] }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D54" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The observed rows here are A0=",
      /* @__PURE__ */ jsx18("code", { children: "[1,0]" }),
      ", A1=",
      /* @__PURE__ */ jsx18("code", { children: "[0,1]" }),
      ", M0=",
      /* @__PURE__ */ jsx18("code", { children: "[0.75,0.25]" }),
      " and M1=",
      /* @__PURE__ */ jsx18("code", { children: "[0.25,0.75]" }),
      ". The two A rows are anchors, and the M rows are mixtures between them. The new-mixture control draws ",
      /* @__PURE__ */ jsx18("code", { children: "[t,1\u2212t]" }),
      "; at an endpoint it coincides with an anchor and adds no new direction. The line segment and all points enclosed by it form the ",
      /* @__PURE__ */ jsx18("strong", { children: "convex hull" }),
      " of the anchors: all sums of these points with nonnegative weights adding to one."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For this lesson, ",
      /* @__PURE__ */ jsx18("strong", { children: "row separability" }),
      " means that each dictionary direction has at least one pure observed row, perhaps with a different positive intensity before normalization, and that all other rows are its nonnegative mixtures. The original anchor paper writes observations as columns; our observations are rows, so its data matrix is the transpose of ours. This orientation matters: \u201Cpure documents\u201D and \u201Cwords unique to a topic\u201D are different assumptions, depending on which axis holds observations."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "We also require the k normalized pattern rows to be linearly independent, so k cannot exceed the feature count. This is stronger than merely having k different-looking rows. With exact separability and independent patterns, the anchors are visible extremal directions. Without pure observations, a greedy selection still returns observed rows, but calling them recovered true patterns would be unsupported. A good reconstruction after selection cannot verify separability by itself." }),
    /* @__PURE__ */ jsx18(H3, { children: "Select a direction, then remove only its span" }),
    /* @__PURE__ */ jsx18(Prose, { children: "How can we find the anchors without testing every subset? Select a far-reaching row, project its direction out, then look for a genuinely new direction." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D55" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "At the initial step the squared lengths of A0, A1, M0 and M1 are ",
      /* @__PURE__ */ jsx18("code", { children: "1,1,0.625,0.625" }),
      ". A0 and A1 tie; the stable source-ID rule chooses A0 first in this fixture. Its unit direction is ",
      /* @__PURE__ */ jsx18("code", { children: "[1,0]" }),
      ". Removing each row's projection onto that direction leaves residual rows ",
      /* @__PURE__ */ jsx18("code", { children: "[0,0]" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1]" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "[0,0.25]" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "[0,0.75]" }),
      ". Their ",
      /* @__PURE__ */ jsx18("strong", { children: "lengths" }),
      " are ",
      /* @__PURE__ */ jsx18("code", { children: "0,1,0.25,0.75" }),
      "; their squared lengths are ",
      /* @__PURE__ */ jsx18("code", { children: "0,1,0.0625,0.5625" }),
      ". Selection uses squared length throughout, so A1 wins next. Two independent directions now span all four observations, leaving zero residual."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The projection is not an NMF reconstruction. It is a temporary geometric calculation used to choose row IDs. In general its residuals have negative entries, even though the original observations are nonnegative. For example, projecting ",
      /* @__PURE__ */ jsx18("code", { children: "[0.2,0.8]" }),
      " away from the direction ",
      /* @__PURE__ */ jsx18("code", { children: "[0.8,0.2]" }),
      " leaves approximately ",
      /* @__PURE__ */ jsx18("code", { children: "[-0.176471,0.705882]" }),
      ". Clipping that negative cell would change the geometry and the algorithm. The selected dictionary itself always comes from the original normalized nonnegative observations, not from these signed residuals."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "Write R for the current normalized residual table and u for the selected residual row. Its unit vector is q=u/||u||. Every row changes by" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: " R_{i,:}\\leftarrow R_{i,:}-(R_{i,:}q^\\top)q." }) }),
    /* @__PURE__ */ jsx18(Prose, { children: "The scalar in parentheses measures how far row i lies along q; subtracting that copy leaves the part perpendicular to q. This is the same projection idea used by ordinary QR, applied successively after each choice. The routine stops with an explicit refusal if a requested next direction is zero or too small relative to the declared tolerance. Duplicate observations can have different global IDs, but they do not create another independent direction." }),
    /* @__PURE__ */ jsx18(Prose, { children: "Why does selecting the largest squared length work in the ideal case? A mixture of distinct residual anchors cannot have a larger squared length than every anchor that enters it. The exact identity behind that statement, for nonnegative weights \u03B1 adding to one, is" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: " \\left\\|\\sum_c\\alpha_cv_c\\right\\|^2\n =\\sum_c\\alpha_c\\|v_c\\|^2\n -\\frac12\\sum_{c,e}\\alpha_c\\alpha_e\\|v_c-v_e\\|^2." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The subtracted term is nonnegative and is strictly positive when different positively weighted vectors occur. Thus a genuine mixture is strictly below at least one participating extreme in squared length. After projecting out a selected anchor, the other independent anchor directions remain independent and nonzero; the residual observations are still the same mixtures of those projected anchors and the selected zero directions. Repeating the argument selects a new pure direction. This is the noiseless mechanism behind the separable selection result, not a guarantee for arbitrary noisy data. The ",
      /* @__PURE__ */ jsx18("a", { href: "https://arxiv.org/pdf/1208.1237", children: "Gillis\u2013Vavasis primary treatment" }),
      " states the precise assumptions and recovery theorem; its broader noisy theorem has additional conditions not established by these examples."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "If squared selection values are exactly equal, the code compares their ",
      /* @__PURE__ */ jsx18("strong", { children: "original normalized row" }),
      " squared norms, before any projection, then the smallest global ID. \u201COriginal\u201D here means the normalized input to the selection algorithm, not the raw pre-normalization brightness. Multiplying an observation by 100 should not give it priority merely because we changed its intensity units. Rank tolerance does not merge near-equal selection scores into a tie; it decides whether another independent direction is numerically supported."
    ] }),
    /* @__PURE__ */ jsx18(H3, { children: "See why nearly parallel patterns are fragile" }),
    /* @__PURE__ */ jsx18(Prose, { children: "How much information separates two almost identical directions? Make that separation visible before trusting a noisy recovery result." }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D56" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "P0 is ",
      /* @__PURE__ */ jsx18("code", { children: "[1,0]" }),
      "; P1 is ",
      /* @__PURE__ */ jsx18("code", { children: "[1\u2212\u03B5,\u03B5]" }),
      ". Their Euclidean separation is \u221A2\u03B5, and their angle is ",
      /* @__PURE__ */ jsx18("code", { children: "atan2(\u03B5,1\u2212\u03B5)" }),
      " radians. At \u03B5=0.1 their distance is about 0.141421; at \u03B5=0.01 it is about 0.014142. The second projection now has much less signal to work with. At \u03B5=0 the directions coincide, rank drops and a request for two independent anchors must fail."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "An error in a measured row can move a nearby mixture past a supposed pure row or blur the distinction between these two directions. The small static perturbation illustrates this possibility; it is not an experimentally measured recovery-error curve. Our tolerance records a numerical decision at a chosen scale, not a universal noise threshold or proof that the physical data satisfy the theorem. Reorthogonalization, preconditioning and robust/noisy separable methods can be appropriate for harder instances, but their assumptions and costs require separate assessment. A positive numerical residual alone does not establish reliable source recovery." }),
    /* @__PURE__ */ jsx18(H3, { children: "Implement the bounded route and check the ordinary primitives" }),
    /* @__PURE__ */ jsx18(Prose, { children: "How do we keep the geometry, source IDs and query units consistent in code? Normalize for selection, preserve the mapping, then encode original observations against the selected unit-mass patterns." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("code", { children: "normalized_rows" }),
      " validates finite nonnegative input, returns positive-row flags and leaves zero rows at zero. ",
      /* @__PURE__ */ jsx18("code", { children: "global_ids" }),
      " requires one unique nonnegative integer ID per original row; an array position is a separate address. ",
      /* @__PURE__ */ jsx18("code", { children: "select_anchors" }),
      " stores signed residuals, chooses each squared-norm maximum and applies the projection above. ",
      /* @__PURE__ */ jsx18("code", { children: "chosen" }),
      " excludes already selected rows. Returned dictionary, normalized observations, directions and residual arrays are read-only copies. Failed selection returns no partially published result."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The rank refusal uses ",
      /* @__PURE__ */ jsx18("code", { children: "tolerance * largest initial normalized-row length" }),
      ". A relative tolerance below one is required, and rank must fit both the feature count and positive-row count. Very small independent directions can still be refused under this numerical rule. Roundoff in successive projections can accumulate, especially for nearly dependent data; do not interpret the requested integer k as a certified algebraic rank. The explicitly bounded adapter favors transparent, checked small-to-moderate dense problems, not an unqualified claim of optimal numerical behavior for every scale."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("code", { children: "qr_residual" }),
      " uses the public ",
      /* @__PURE__ */ jsx18("a", { href: "https://numpy.org/doc/stable/reference/generated/numpy.linalg.qr.html", children: "NumPy reduced QR" }),
      " on the transpose of the ",
      /* @__PURE__ */ jsx18("strong", { children: "selected original dictionary" }),
      ". Its columns are an orthonormal basis for that selected span. Subtracting ",
      /* @__PURE__ */ jsx18("code", { children: "(Z@Q)@Q.T" }),
      " checks the final residual by a different primitive. QR is a reference for the span after selection, not a public API that certifies separability or promises the same pivot choices. ",
      /* @__PURE__ */ jsx18("code", { children: "encode_selected" }),
      " reuses the complete public NNLS adapter from ",
      /* @__PURE__ */ jsx18("strong", { children: "Fit both factors and decide when to stop" }),
      ", section 6. It solves each original-unit observation against the selected normalized dictionary. For the exact fixture it reconstructs every row, including the zero row. It does not pretend the signed projection residuals are observation amounts."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "Normalization takes O(nd) arithmetic. Each selection/projection takes O(nd), so k steps take O(nkd); selecting maxima adds O(nk). Retained normalized observations and residuals require O(nd), directions and selected patterns O(kd), with IDs/flags O(n). One projection creates an O(nd) temporary; it never allocates an n\xD7k\xD7d tensor or n\xD7n projector. The reference QR costs O(dk\xB2), and applying its basis costs O(nkd); it is an explicit independent check rather than mandatory repeated work in a streaming browser. Re-encoding uses the earlier NNLS route and its solver-dependent active-set work, so it has a separate cost. These bounds do not include storing every intermediate residual for an unbounded animation; the small lesson trace stores only its finite fixture states." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Save ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_anchors.py" }),
      " beside ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_arrays.py" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_nnls.py" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_coordinate.py" }),
      " and the supplied ",
      /* @__PURE__ */ jsx18("code", { children: "centered_pca.py" }),
      " validation helper. NumPy and SciPy provide QR and convex encoding primitives. Run ",
      /* @__PURE__ */ jsx18("code", { children: "python nmf_anchors.py" }),
      " for this constructed demonstration."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_anchors.py", filename: "nmf_anchors.py", language: "python" }),
    /* @__PURE__ */ jsx18(Prose, { children: "This program's actual output shows the initial two-feature fixture, the separate source-ID duplicate case and the signed-residual example. No digit model is retrained." }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_anchors.stdout.txt", filename: "nmf_anchors.stdout.txt", language: "output" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The duplicate case chooses global IDs ",
      /* @__PURE__ */ jsx18("code", { children: "(7,42)" }),
      ", even though their physical positions in its array are 1 and 0. ID 10 duplicates the first selected direction and is not a third anchor. The excluded zero observation retains its ID for later queries. The final signed numbers agree with the hand projection above."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "We have gained recoverability by adding explicit information about the observations, not by declaring every NMF pattern meaningful. The next section takes the same additive mechanism to words and spectra, where the feature units and physical assumptions must be stated again." }),
    /* @__PURE__ */ jsx18("span", { id: "8-deeper-applications-words-spectra-and-streams", className: "nmf-historical-anchor" }),
    /* @__PURE__ */ jsx18(H2, { children: "16. Change application assumptions explicitly" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "Can the same additive machinery explain words or light?" }),
      " The shape of the calculation survives; the meaning of its inputs needs a new argument. ",
      /* @__PURE__ */ jsx18("a", { href: "#15-when-anchors-help-recover-the-dictionary", children: "When anchors help recover the dictionary" }),
      " gave conditions under which observed pure rows can identify patterns. A short document or a measured spectrum does not automatically satisfy those conditions. We will first replace pixel bins with word bins, then deliberately switch to a constructed spectrum to see how a physical constraint changes the answer."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "How does a sentence become one nonnegative row?" }),
      " Count each retained word in its own named column."
    ] }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D57" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The five documents in the picture are ",
      /* @__PURE__ */ jsx18("code", { children: "orbit rocket orbit" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "rocket orbit rocket" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "goal team goal" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "team goal team" }),
      ", and ",
      /* @__PURE__ */ jsx18("code", { children: "orbit rocket goal team" }),
      ". The ordered vocabulary is ",
      /* @__PURE__ */ jsx18("code", { children: "[goal, orbit, rocket, team]" }),
      ". Follow both copies of ",
      /* @__PURE__ */ jsx18("code", { children: "orbit" }),
      " in the first sentence into its ",
      /* @__PURE__ */ jsx18("code", { children: "orbit" }),
      " cell: that cell is 2, not two new columns. Its complete row is ",
      /* @__PURE__ */ jsx18("code", { children: "[0,2,1,0]" }),
      ". The next three rows are ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1,2,0]" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "[2,0,0,1]" }),
      ", and ",
      /* @__PURE__ */ jsx18("code", { children: "[1,0,0,2]" }),
      "; the last is ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1,1,1]" }),
      ". A zero says the retained word did not occur in that document. It is an observed count, not a missing measurement."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "With documents as rows and vocabulary entries as features, ",
      /* @__PURE__ */ jsx18("code", { children: "X \u2248 WH" }),
      " has exactly the orientation we have used throughout. A dictionary row now distributes a component over words. A document's amount multiplies that whole word pattern. In the preserved count experiment, the printed, rounded, unit-row-sum patterns are ",
      /* @__PURE__ */ jsx18("code", { children: "[0.5,0,0,0.5]" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "[0,0.5,0.5,0]" }),
      ". Their component order is the order of that saved run. The mixed document uses amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[2,2]" }),
      ": its two contributions are ",
      /* @__PURE__ */ jsx18("code", { children: "[1,0,0,1]" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1,1,0]" }),
      ", adding to ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1,1,1]" }),
      ". These are rounded recorded values, not a newly inferred full-precision dictionary."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Normalizing a dictionary row to sum to one is the compensated convention from ",
      /* @__PURE__ */ jsx18("a", { href: "#2-amount-is-not-probability-or-identity", children: "Amount is not probability or identity" }),
      ". Its document amounts need not sum to one. Those two amounts sum to four because this representation has four token occurrences. The product is an approximation to counts; it is not a posterior distribution over topics. A label such as \u201Cspace\u201D can be a useful human interpretation of the ",
      /* @__PURE__ */ jsx18("code", { children: "orbit/rocket" }),
      " pattern, but it is not a theorem that the program discovered a semantic theme or an independent source. Two documents with the same retained counts but different word order are indistinguishable here."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The count program below uses the generalized-KL route taught in ",
      /* @__PURE__ */ jsx18("a", { href: "#7-explain-the-multiplicative-route", children: "Explain the multiplicative route" }),
      ". Count nonnegativity makes this loss admissible, including observed zero counts, but a Poisson likelihood interpretation additionally assumes a suitable count-generating model. Word occurrences can be correlated and document length can matter; a useful approximation is not a proof of that generative assumption. A new ",
      /* @__PURE__ */ jsx18("code", { children: "rocket team" }),
      " query is counted in the same four columns and encoded against the existing dictionary. The saved rounded reconstruction ",
      /* @__PURE__ */ jsx18("code", { children: "[0.5,0.5,0.5,0.5]" }),
      " shows that encoding may predict nonzero ",
      /* @__PURE__ */ jsx18("code", { children: "goal/orbit" }),
      " counts even when the query did not contain them: a least-divergence combination of whole patterns cannot independently edit every word."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "This is the original complete ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_words.py" }),
      " and its preserved output. The lowercase default tokenizer, vectorizer fit, public KL/MU configuration, dictionary normalization and compensated amounts are all visible. This code was executed for the earlier lesson; its recorded output is reused here, not regenerated for the new example."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_words.py", filename: "nmf_words.py", language: "python" }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_words.retained.stdout.txt", filename: "nmf_words.retained.stdout.txt", language: "output" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "Should every occurrence count equally?" }),
      " We can learn a fixed word-weighting rule from training documents before encoding a query."
    ] }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D58" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Here we change to three explicitly named training documents so the weighting arithmetic fits on the page: ",
      /* @__PURE__ */ jsx18("code", { children: "orbit orbit rocket" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "rocket team" }),
      ", and ",
      /* @__PURE__ */ jsx18("code", { children: "team team" }),
      ". The new ordered vocabulary is ",
      /* @__PURE__ */ jsx18("code", { children: "[orbit, rocket, team]" }),
      "; do not carry the previous four-column dictionary into this three-column problem. The count rows are ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1,0]" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1,1]" }),
      ", and ",
      /* @__PURE__ */ jsx18("code", { children: "[0,0,2]" }),
      ". Document frequency counts ",
      /* @__PURE__ */ jsx18("strong", { children: "documents containing the word" }),
      ", rather than occurrences: ",
      /* @__PURE__ */ jsx18("code", { children: "orbit" }),
      " appears in one document, ",
      /* @__PURE__ */ jsx18("code", { children: "rocket" }),
      " in two and ",
      /* @__PURE__ */ jsx18("code", { children: "team" }),
      " in two, even though the last document says ",
      /* @__PURE__ */ jsx18("code", { children: "team" }),
      " twice."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The picture gives each column a fixed multiplier. A rarer training word receives a larger multiplier. With three training documents and the smoothed convention used here, the three multipliers are ",
      /* @__PURE__ */ jsx18("code", { children: "1 + log(2)" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "1 + log(4/3)" }),
      ", and ",
      /* @__PURE__ */ jsx18("code", { children: "1 + log(4/3)" }),
      ", approximately ",
      /* @__PURE__ */ jsx18("code", { children: "1.693147" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "1.287682" }),
      ", and ",
      /* @__PURE__ */ jsx18("code", { children: "1.287682" }),
      ". These are called ",
      /* @__PURE__ */ jsx18("strong", { children: "inverse document frequency" }),
      ", or IDF, weights. \u201CInverse\u201D describes their decreasing dependence on document frequency; it does not mean we simply divide by frequency."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Let ",
      /* @__PURE__ */ jsx18("code", { children: "n" }),
      " be the number of training documents, ",
      /* @__PURE__ */ jsx18("code", { children: "df_j" }),
      " the number containing vocabulary word ",
      /* @__PURE__ */ jsx18("code", { children: "j" }),
      ", and ",
      /* @__PURE__ */ jsx18("code", { children: "count_ij" }),
      " its occurrences in document ",
      /* @__PURE__ */ jsx18("code", { children: "i" }),
      ". Our representation is"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "\\operatorname{idf}_j=1+\\log\\frac{1+n}{1+\\operatorname{df}_j},\n\\qquad X_{ij}=\\operatorname{count}_{ij}\\operatorname{idf}_j." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The logarithm is natural. The added ones keep the rule defined for an absent column and avoid erasing a word present in every training document. This is one precise TF-IDF convention: ",
      /* @__PURE__ */ jsx18("strong", { children: "term frequency" }),
      " is the raw occurrence count here, and ",
      /* @__PURE__ */ jsx18("strong", { children: "inverse document frequency" }),
      " is the learned column multiplier. Other conventions use logarithmic term frequency or normalize rows. We use ",
      /* @__PURE__ */ jsx18("code", { children: "norm=None" }),
      ", so the first training row is ",
      /* @__PURE__ */ jsx18("code", { children: "[3.386294361119891,1.2876820724517808,0]" }),
      ". Its entries are word weights, no longer literal token counts. ",
      /* @__PURE__ */ jsx18("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfTransformer.html", children: "TfidfTransformer's weighting contract" }),
      " specifies the smoothing and normalization choices."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Move the orbit-count control from 2 to 0. The query's count row changes from ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1,0]" }),
      " to ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1,0]" }),
      "; the weighted row changes from ",
      /* @__PURE__ */ jsx18("code", { children: "[2*idf_orbit,idf_rocket,0]" }),
      " to ",
      /* @__PURE__ */ jsx18("code", { children: "[0,idf_rocket,0]" }),
      ". The IDF weights do not move. The query is not a new training corpus. Likewise, ",
      /* @__PURE__ */ jsx18("code", { children: "rocket planet" }),
      " becomes ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1,0]" }),
      ": the unseen word ",
      /* @__PURE__ */ jsx18("code", { children: "planet" }),
      " is ignored under this fixed vocabulary. An all-",
      /* @__PURE__ */ jsx18("code", { children: "planet" }),
      " document becomes a zero row and receives zero amounts. That null says \u201Cnothing retained by this representation,\u201D not \u201Ca document with no meaning.\u201D OOV means ",
      /* @__PURE__ */ jsx18("strong", { children: "out of vocabulary" }),
      ", and is a practical reason to monitor coverage or deliberately retrain a representation on a new training corpus."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The small separate unit-length example in the picture illustrates an additional decision. Dividing a nonzero weighted row by its Euclidean length makes its direction carry the information and removes its overall magnitude. That can be useful when document length is a nuisance, but it changes the matrix and therefore the squared-error fitting problem. Our live row remains unnormalized; the inset is not an extra hidden transformation. A zero row must remain zero instead of being divided by zero." }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "What does the whole training-and-query program do?" }),
      " It fixes the vocabulary and IDF, fits a dictionary on the weighted training rows, and only then solves for new amounts. ",
      /* @__PURE__ */ jsx18("code", { children: "count_rows" }),
      " implements the lowercase, word-character tokens of length at least two used in this bounded comparison. This is not a language-aware tokenizer: punctuation separates words, one-character tokens are omitted, and no stemming, subword segmentation or phrase model is inferred. ",
      /* @__PURE__ */ jsx18("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.CountVectorizer.html", children: "CountVectorizer's token contract" }),
      " is the ordinary interface being matched."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The new ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_text_spectra.py" }),
      " below supplies that scratch adapter, IDF calculation, and calls to the already explained ",
      /* @__PURE__ */ jsx18("code", { children: "CoordinateNMF" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "encode_nnls" }),
      ". Both the scratch and ordinary NMF routes use ",
      /* @__PURE__ */ jsx18("strong", { children: "Frobenius" }),
      " loss on exactly the same weighted matrix, the same two-component custom start, zero penalties, a cap of 4,000 and tolerance ",
      /* @__PURE__ */ jsx18("code", { children: "1e-8" }),
      ". We use the ",
      /* @__PURE__ */ jsx18("a", { href: "#10-use-the-ordinary-tools-deliberately", children: "ordinary lifecycle from \xA710" }),
      ", rather than reimplementing the optimizer. The ordinary text route calls ",
      /* @__PURE__ */ jsx18("code", { children: "fit_transform" }),
      " on training rows, reads ",
      /* @__PURE__ */ jsx18("code", { children: "components_" }),
      ", calls ",
      /* @__PURE__ */ jsx18("code", { children: "transform" }),
      " on query rows, and reconstructs with ",
      /* @__PURE__ */ jsx18("code", { children: "inverse_transform" }),
      ". Only the vectorizer and IDF transformer are fit on raw training text; their query calls are ",
      /* @__PURE__ */ jsx18("code", { children: "transform" }),
      ". Labels play no role."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The vectorizer's sparse arrays store only nonzero counts or weights. The scratch optimizer in this lesson is deliberately dense; the program checks the new demonstration is 3\xD73 before converting it. More generally, its explicit dense adapter bounds the result to 10,000 cells. If a real vocabulary produces a large sparse document matrix, retain the sparse format and use an appropriate public solver; do not convert a corpus to dense merely to reuse these teaching loops. Tokenization itself takes work proportional to the inspected text; vocabulary sorting costs ",
      /* @__PURE__ */ jsx18("code", { children: "O(v log v)" }),
      " for ",
      /* @__PURE__ */ jsx18("code", { children: "v" }),
      " retained distinct tokens, counting takes ",
      /* @__PURE__ */ jsx18("code", { children: "O(tokens + nv)" }),
      " with the dense allocation, and multiplying IDF takes ",
      /* @__PURE__ */ jsx18("code", { children: "O(nv)" }),
      " dense work or ",
      /* @__PURE__ */ jsx18("code", { children: "O(nnz)" }),
      " when a sparse implementation touches only stored entries. After that, the NMF dimensions/costs are the ones already derived for ",
      /* @__PURE__ */ jsx18("code", { children: "n" }),
      " documents, ",
      /* @__PURE__ */ jsx18("code", { children: "v" }),
      " features and ",
      /* @__PURE__ */ jsx18("code", { children: "k" }),
      " components."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The executed new study reached scratch projected-stationarity tolerance after 12 alternating updates, with half-loss ",
      /* @__PURE__ */ jsx18("code", { children: "0.5710663094424072" }),
      "; the ordinary route used 13 iterations and half-loss ",
      /* @__PURE__ */ jsx18("code", { children: "0.5710663094424069" }),
      ", with no recorded warnings. Their stopping measurements differ, as \xA710 explained; this is not evidence that one extra library iteration is extra useful learning. For ",
      /* @__PURE__ */ jsx18("code", { children: "rocket planet" }),
      ", the scratch reconstruction is approximately ",
      /* @__PURE__ */ jsx18("code", { children: "[0.437238,0.223229,0.215498]" }),
      ": some error is inevitable because no combination of its two nonnegative patterns isolates the ",
      /* @__PURE__ */ jsx18("code", { children: "rocket" }),
      " column. Its all-OOV query has exact zero amounts and zero reconstruction. Independent fixed-dictionary NNLS objectives support these finite query results. We compare losses and reconstructions, not an obligation for arbitrary factor entries to match."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "Why not attach the count likelihood automatically?" }),
      " TF-IDF entries are real-valued weights determined by the corpus. A count model for word occurrences does not automatically become a count model for weighted entries. Here Frobenius loss states exactly the numerical disagreement we fit. Generalized KL can also be defined for admissible nonnegative weighted values, but its probability-model interpretation would need a separate argument. Model selection must assess the intended task\u2014retrieval, compression, exploration or a downstream prediction\u2014under a train-only preprocessing rule, not merely the pleasant names given to components."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "Do nonnegative spectral amounts represent physical fractions?" }),
      " Only an additional sum-to-one constraint makes them fractions of a fixed total."
    ] }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D59" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "We now deliberately leave documents and return to the familiar two patterns ",
      /* @__PURE__ */ jsx18("code", { children: "[1,0,1]" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1,1]" }),
      ". In this ",
      /* @__PURE__ */ jsx18("strong", { children: "constructed" }),
      " application, the three features are spectral bands and a pattern is called an ",
      /* @__PURE__ */ jsx18("strong", { children: "endmember" }),
      ": a candidate pure-material response. They are numerical examples, not instrument measurements or certified substances. The query is ",
      /* @__PURE__ */ jsx18("code", { children: "x = g[2,1,3]" }),
      ", with the gain control initially ",
      /* @__PURE__ */ jsx18("code", { children: "g=1" }),
      ". Gain multiplies every band together."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The nonnegative cone contains every nonnegative combination of both patterns, including its zero and boundary cases. At gain 1, NNLS amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1]" }),
      " reconstruct ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1,3]" }),
      " exactly. At gain 2, ",
      /* @__PURE__ */ jsx18("code", { children: "[4,2]" }),
      " reconstruct ",
      /* @__PURE__ */ jsx18("code", { children: "[4,2,6]" }),
      ". The sum of amounts changes with signal strength. The line segment joins the two endmembers and contains only their sum-one combinations: ",
      /* @__PURE__ */ jsx18("code", { children: "[t,1-t]" }),
      " for ",
      /* @__PURE__ */ jsx18("code", { children: "0 \u2264 t \u2264 1" }),
      ". In geometry, those amounts belong to a ",
      /* @__PURE__ */ jsx18("strong", { children: "simplex" }),
      "; for two components the simplex is just an interval. Both constraints are nonnegative, but the feasible sets are different. Every point on this segment has third band 1, so it cannot exactly represent our third band 3 at gain 1."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "To compute the segment optimum, name the first and second pattern rows ",
      /* @__PURE__ */ jsx18("code", { children: "h0" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "h1" }),
      ". A sum-one reconstruction is ",
      /* @__PURE__ */ jsx18("code", { children: "h1 + t(h0-h1)" }),
      ". Define the direction ",
      /* @__PURE__ */ jsx18("code", { children: "v=h0-h1" }),
      ". Minimizing the half-square error along its whole line gives slope ",
      /* @__PURE__ */ jsx18("code", { children: "v\xB7(h1+tv-x)" }),
      " and zero-slope coordinate ",
      /* @__PURE__ */ jsx18("code", { children: "(x-h1)\xB7v/(v\xB7v)" }),
      ". Constraining the coordinate to ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1]" }),
      " clips that scalar optimum to the segment, because the scalar quadratic is convex:"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "t^*=\\operatorname{clip}\\!\\left(\\frac{(x-h_1)\\cdot(h_0-h_1)}{\\|h_0-h_1\\|_2^2},0,1\\right),\n\\qquad w^*=[t^*,1-t^*]." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For our ",
      /* @__PURE__ */ jsx18("code", { children: "h0-h1=[1,-1,0]" }),
      " the denominator is 2 and numerator is ",
      /* @__PURE__ */ jsx18("code", { children: "g+1" }),
      ". Thus ",
      /* @__PURE__ */ jsx18("code", { children: "t*=clip((g+1)/2,0,1)" }),
      ". At ",
      /* @__PURE__ */ jsx18("code", { children: "g=0.5" }),
      ", the optimum is ",
      /* @__PURE__ */ jsx18("code", { children: "[0.75,0.25]" }),
      ", predicts ",
      /* @__PURE__ */ jsx18("code", { children: "[0.75,0.25,1]" }),
      " and has half-loss ",
      /* @__PURE__ */ jsx18("code", { children: "3/16=0.1875" }),
      ". At gain 1 it reaches the first endpoint ",
      /* @__PURE__ */ jsx18("code", { children: "[1,0]" }),
      ", predicts ",
      /* @__PURE__ */ jsx18("code", { children: "[1,0,1]" }),
      " and has half-loss 3. At gain 2 the same endpoint has half-loss 19. The cone-constrained NNLS answer remains exact throughout this control's domain, apart from floating-point NNLS residuals near ",
      /* @__PURE__ */ jsx18("code", { children: "1e-16" }),
      " in the executed reference."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "If instead we normalize the exact unconstrained amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1]" }),
      " to ",
      /* @__PURE__ */ jsx18("code", { children: "[2/3,1/3]" }),
      ", the gain-1 prediction is ",
      /* @__PURE__ */ jsx18("code", { children: "[2/3,1/3,1]" }),
      " and half-loss is ",
      /* @__PURE__ */ jsx18("code", { children: "28/9 \u2248 3.111111" }),
      ", worse than the true segment optimum 3. Normalizing ",
      /* @__PURE__ */ jsx18("strong", { children: "after" }),
      " optimizing changes the prediction without solving the newly constrained objective. This is different from the compensated dictionary-row normalization in \xA72, which preserves the product."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("code", { children: "simplex_two" }),
      " implements the closed-form two-pattern projection in ",
      /* @__PURE__ */ jsx18("code", { children: "O(d)" }),
      " time and workspace for ",
      /* @__PURE__ */ jsx18("code", { children: "d" }),
      " bands. Its arrays are read-only results. If both patterns are identical, every sum-one amount has the same prediction: it returns ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1]" }),
      " by a declared convention and marks amounts nonunique. If distinct patterns lose their squared separation to underflow, or the products/loss exceed finite arithmetic, it refuses and requests a better numerical scale rather than pretending it found a unique answer. With more than two patterns, the simplex has several coordinates and this clipping formula is no longer a general solution. Use a suitable constrained least-squares/quadratic optimizer and check feasibility and stationarity."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The public diagnostic route here independently minimizes the same one-coordinate objective with SciPy SLSQP, an analytic gradient and ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1]" }),
      " bounds. It checks solver success and finite feasible output. All three constructed gains converged to the same amounts and losses in this new execution; a numerical success flag is not a proof that every future call will work. See the ",
      /* @__PURE__ */ jsx18("a", { href: "https://docs.scipy.org/doc/scipy/reference/optimize.minimize-slsqp.html", children: "SLSQP objective and stopping interface" }),
      "."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Here is the complete new file. Its first application uses the fixed training representation described above; its second uses the fixed constructed spectral dictionary. They are separated functions because their features, fitted state and assumptions are different. Place it beside the supplied ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_arrays.py" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_coordinate.py" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_nnls.py" }),
      " and unchanged ",
      /* @__PURE__ */ jsx18("code", { children: "centered_pca.py" }),
      " siblings."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_text_spectra.py", filename: "nmf_text_spectra.py", language: "python" }),
    /* @__PURE__ */ jsx18(Prose, { children: "The full output of the new bounded demonstration follows. It includes actual dictionaries and amounts, the null query, convergence diagnostics and all three constrained comparisons. These data belong to this new three-document/Frobenius example, not the preceding historical five-document/KL run." }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_text_spectra.stdout.txt", filename: "nmf_text_spectra.stdout.txt", language: "output" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "What would justify a material interpretation?" }),
      " Calibration and independent evidence must connect a numerical component to the world."
    ] }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D60" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The measured/modelled/residual lanes now reuse our separate positive-shear example, explicitly switching from ",
      /* @__PURE__ */ jsx18("code", { children: "H0" }),
      " to patterns ",
      /* @__PURE__ */ jsx18("code", { children: "[1,1,1]" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1,1]" }),
      ", with amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1]" }),
      ". Their modelled response is ",
      /* @__PURE__ */ jsx18("code", { children: "[2,3,3]" }),
      ". A different dictionary ",
      /* @__PURE__ */ jsx18("code", { children: "[1,0.5,0.5]" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1,1]" }),
      " with amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[2,2]" }),
      " gives the same response. The numerical residual in either lane is zero. Equal fit cannot choose which explanation names the physical materials."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "An instrument's band response, units, baseline, noise, saturation and calibration establish what the observed vector means. Independent endmember measurements or credible mixing laws establish whether the candidate dictionary represents pure responses. An abundance sum-one constraint might describe fractions under a particular linear mixture model; brightness, illumination, path length, nonlinear scattering or additional materials can violate that simple model. These are questions for the experiment and the application, not facts inferred from ",
      /* @__PURE__ */ jsx18("code", { children: "WH" }),
      " alone. Even an identifiable algebraic dictionary under \xA715's assumptions is not automatically a calibrated substance catalogue."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "That distinction explains both the promise and the restraint of additive models: a nonnegative table lets us reuse the computation, while each domain must defend its representation, noise/loss and interpretation. A useful changed task is to hold the vocabulary fixed for a new text query, or hold the endmembers fixed while changing gain, and explain which inference remains justified. ",
      /* @__PURE__ */ jsx18("a", { href: "#practice-t-query-with-fixed-idf", children: "Practice T" }),
      " and the physical-interpretation task revisit those decisions. Next, we keep the data representation fixed but change ",
      /* @__PURE__ */ jsx18("strong", { children: "when" }),
      " rows arrive, so the model must decide what to remember."
    ] }),
    /* @__PURE__ */ jsx18(H2, { children: "17. Update as rows arrive" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "What if we cannot keep every training row?" }),
      " Remember the products needed for a dictionary update, rather than pretending an old encoding is a fresh one. ",
      /* @__PURE__ */ jsx18("a", { href: "#16-change-application-assumptions-explicitly", children: "Change application assumptions explicitly" }),
      " kept vocabulary or endmembers fixed while queries arrived. Here new ",
      /* @__PURE__ */ jsx18("strong", { children: "training" }),
      " rows may change the dictionary. We return to ",
      /* @__PURE__ */ jsx18("code", { children: "H0=[[1,0,1],[0,1,1]]" }),
      " and three named numerical bands so the memory update can be followed by hand; this is a constructed stream, not an additional digit or physical experiment."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "What information from one row helps update the dictionary?" }),
      " Its amounts tell us how much of the observed signal to credit to each component."
    ] }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D61" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The first arriving row is ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1,3]" }),
      ". Holding ",
      /* @__PURE__ */ jsx18("code", { children: "H0" }),
      " fixed gives its exact amount row ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1]" }),
      ". Take the outer product of these amounts with themselves: multiply each amount by each amount to obtain ",
      /* @__PURE__ */ jsx18("code", { children: "A=[[4,2],[2,1]]" }),
      ". Its axes are component by component. Take the outer product of the amount column with the observation row: the first row is twice ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1,3]" }),
      ", the second once, giving ",
      /* @__PURE__ */ jsx18("code", { children: "B=[[4,2,6],[2,1,3]]" }),
      ". Its axes are component by feature. In particular ",
      /* @__PURE__ */ jsx18("code", { children: "A01=2*1=2" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "B02=2*3=6" }),
      "; the columns of ",
      /* @__PURE__ */ jsx18("code", { children: "B" }),
      " remain the same named bands as the dictionary."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The next row ",
      /* @__PURE__ */ jsx18("code", { children: "[0,2,2]" }),
      " has exact amounts ",
      /* @__PURE__ */ jsx18("code", { children: "[0,2]" }),
      " under ",
      /* @__PURE__ */ jsx18("code", { children: "H0" }),
      ". Its added Gram product is ",
      /* @__PURE__ */ jsx18("code", { children: "deltaA=[[0,0],[0,4]]" }),
      " and its added amount-observation product is ",
      /* @__PURE__ */ jsx18("code", { children: "deltaB=[[0,0,0],[0,4,4]]" }),
      ". The first component receives no credit for this row; the second receives twice its measured bands. These are products of ",
      /* @__PURE__ */ jsx18("strong", { children: "amounts computed at arrival" }),
      ", not labels of physical sources."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For a batch of ",
      /* @__PURE__ */ jsx18("code", { children: "b" }),
      " arriving rows, write its observation table as ",
      /* @__PURE__ */ jsx18("code", { children: "Xb" }),
      " of shape ",
      /* @__PURE__ */ jsx18("code", { children: "b\xD7d" }),
      " and amounts as ",
      /* @__PURE__ */ jsx18("code", { children: "Wb" }),
      " of shape ",
      /* @__PURE__ */ jsx18("code", { children: "b\xD7k" }),
      ". The two compact products are"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "\\Delta A=W_b^TW_b\\quad(k\\times k),\\qquad\n\\Delta B=W_b^TX_b\\quad(k\\times d)." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Why are those enough? Expand the sum of half-squared residuals while the historical amounts are held fixed. The term containing the dictionary twice is ",
      /* @__PURE__ */ jsx18("code", { children: "0.5 sum_c,l A_cl (h_c\xB7h_l)" }),
      "; the term containing it once is ",
      /* @__PURE__ */ jsx18("code", { children: "-sum_c,j B_cj H_cj" }),
      ". The remaining ",
      /* @__PURE__ */ jsx18("code", { children: "0.5 sum_i ||x_i||\xB2" }),
      " does not depend on ",
      /* @__PURE__ */ jsx18("code", { children: "H" }),
      " and cannot change its optimum. In matrix notation the retained part is"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "Q(H)=\\tfrac12\\operatorname{tr}(H^TAH)-\\operatorname{tr}(H^TB),\n\\qquad \\nabla_H Q=AH-B." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The ",
      /* @__PURE__ */ jsx18("strong", { children: "trace" }),
      " adds the diagonal cells of a square matrix; here it is compact notation for those ordinary scalar sums, not a new measurement. ",
      /* @__PURE__ */ jsx18("code", { children: "A" }),
      " records component co-activity, ",
      /* @__PURE__ */ jsx18("code", { children: "B" }),
      " records component-observation association, and the original rows are no longer necessary ",
      /* @__PURE__ */ jsx18("strong", { children: "for this fixed-code quadratic" }),
      ". A displayed ",
      /* @__PURE__ */ jsx18("code", { children: "Q=-7" }),
      " is possible because we omitted the positive, dictionary-independent constant. It is not a negative squared reconstruction error."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "How much should the past count?" }),
      " Multiply old statistics before adding this batch's products."
    ] }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D62" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The old cells remain visible as one contribution and the incoming cells as another. At ",
      /* @__PURE__ */ jsx18("code", { children: "rho=1" }),
      ", every old product is retained. At ",
      /* @__PURE__ */ jsx18("code", { children: "rho=0.5" }),
      ", the first row's influence is halved while the incoming row is fully added, producing ",
      /* @__PURE__ */ jsx18("code", { children: "A=[[2,1],[1,4.5]]" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "B=[[2,1,3],[1,4.5,5.5]]" }),
      ". At ",
      /* @__PURE__ */ jsx18("code", { children: "rho=0" }),
      ", only the incoming products remain: ",
      /* @__PURE__ */ jsx18("code", { children: "A=[[0,0],[0,4]]" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "B=[[0,0,0],[0,4,4]]" }),
      ". The dictionary is not reset by that multiplication; an unused row has no evidence to move it."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "The recurrence is" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "A\\leftarrow\\rho A+W_b^TW_b,\\qquad\nB\\leftarrow\\rho B+W_b^TX_b,\\qquad 0\\le\\rho\\le1." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "In this implementation ",
      /* @__PURE__ */ jsx18("code", { children: "rho" }),
      " acts ",
      /* @__PURE__ */ jsx18("strong", { children: "per nonempty batch" }),
      ", not per observation. An older batch's weight is the product of the later retention factors. With constant ",
      /* @__PURE__ */ jsx18("code", { children: "rho<1" }),
      ", batches several updates ago decay exponentially in the number of nonempty updates. A batch of 100 rows contributes 100 outer products, while a batch of one contributes one; changing batch sizes changes weighting unless you deliberately choose another normalized convention. An empty batch is an actual no-op, even when ",
      /* @__PURE__ */ jsx18("code", { children: "rho=0" }),
      ", so an accidental empty chunk cannot erase accumulated evidence."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Smaller retention can adapt to a changing distribution but loses information about earlier regimes. Keeping all past products gives stable historical weighting but may adapt slowly. Those are decisions about the task and time scale, not automatic improvements. The live figure changes only ",
      /* @__PURE__ */ jsx18("code", { children: "rho" }),
      " for the two named outer products, so its meaning stays visible."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "How does the compact quadratic move one dictionary row?" }),
      " Reuse the cyclic coordinate reasoning from ",
      /* @__PURE__ */ jsx18("a", { href: "#5-change-one-coordinate-then-reuse-the-arithmetic", children: "Change one coordinate, then reuse the arithmetic" }),
      ", now with ",
      /* @__PURE__ */ jsx18("code", { children: "A/B" }),
      " as caches. Hold all other dictionary rows fixed. For feature ",
      /* @__PURE__ */ jsx18("code", { children: "j" }),
      ", the slope is ",
      /* @__PURE__ */ jsx18("code", { children: "(AH-B)_cj" }),
      ", and the curvature for that coordinate is ",
      /* @__PURE__ */ jsx18("code", { children: "A_cc" }),
      ". When this curvature is positive, the nonnegative scalar minimum is"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "H_{cj}\\leftarrow\\max\\left(0,H_{cj}-\\frac{(AH-B)_{cj}}{A_{cc}}\\right)." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "All features in row ",
      /* @__PURE__ */ jsx18("code", { children: "c" }),
      " can move together because the fixed-code squared objective separates over features. Row ",
      /* @__PURE__ */ jsx18("code", { children: "c+1" }),
      " must use the ",
      /* @__PURE__ */ jsx18("strong", { children: "new" }),
      " earlier dictionary rows: this is the same fresh-versus-stale distinction we traced for amounts. ",
      /* @__PURE__ */ jsx18("code", { children: "A" }),
      " is positive semidefinite because it is a nonnegative weighted sum of Gram products. Thus the dictionary block is a convex quadratic over nonnegative entries; the joint changing-code problem remains nonconvex. Finite sweeps improve this surrogate but need not finish its optimization."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "If ",
      /* @__PURE__ */ jsx18("code", { children: "A_cc=0" }),
      ", generated nonnegative statistics also have that row/column of ",
      /* @__PURE__ */ jsx18("code", { children: "A" }),
      " and row of ",
      /* @__PURE__ */ jsx18("code", { children: "B" }),
      " zero: the component has never received retained amount. The objective is flat in its dictionary row. We explicitly keep that unused row, instead of dividing by zero or erasing its starting pattern. If a supplied/generated cache nevertheless combines zero curvature with a nonzero cross term, the kernel refuses that inconsistent state. The public class only constructs these caches from validated batches; the underscored kernel is not an arbitrary-matrix quadratic-programming interface."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "Is this the same as refitting every previous row?" }),
      " No: old amounts are useful memory, but they become stale when the dictionary moves."
    ] }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D63" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The two observations remain ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1,3]" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "[0,2,2]" }),
      ", and their stored amounts remain ",
      /* @__PURE__ */ jsx18("code", { children: "[2,1]" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "[0,2]" }),
      ". Initially the dictionary is ",
      /* @__PURE__ */ jsx18("code", { children: "H0" }),
      ". Move just its first-band entry in component 0 from ",
      /* @__PURE__ */ jsx18("code", { children: "h=1" }),
      " to ",
      /* @__PURE__ */ jsx18("code", { children: "h=2" }),
      ", keeping ",
      /* @__PURE__ */ jsx18("code", { children: "H=[[h,0,1],[0,1,1]]" }),
      ". The stored first amount row now predicts ",
      /* @__PURE__ */ jsx18("code", { children: "[2h,1,3]" }),
      "; at ",
      /* @__PURE__ */ jsx18("code", { children: "h=2" }),
      ", this is ",
      /* @__PURE__ */ jsx18("code", { children: "[4,1,3]" }),
      " and its half-loss is 2. The second row remains exact with ",
      /* @__PURE__ */ jsx18("code", { children: "[0,2]" }),
      "."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Fresh fixed-dictionary encoding is a different calculation. For the first row, the two normal equations are ",
      /* @__PURE__ */ jsx18("code", { children: "(h\xB2+1)w0+w1=2h+3" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "w0+2w1=4" }),
      ". Solving them gives"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "w_0=\\frac{4h+2}{2h^2+1},\\qquad\nw_1=\\frac{4h^2-2h+1}{2h^2+1}." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Both amounts are positive throughout this figure's ",
      /* @__PURE__ */ jsx18("code", { children: "h\u2208[1,2]" }),
      ", so this unconstrained stationary solution is also the NNLS optimum there. At ",
      /* @__PURE__ */ jsx18("code", { children: "h=2" }),
      ", it is ",
      /* @__PURE__ */ jsx18("code", { children: "[10/9,13/9]" }),
      ", predicts ",
      /* @__PURE__ */ jsx18("code", { children: "[20/9,13/9,23/9]" }),
      " and has half-loss ",
      /* @__PURE__ */ jsx18("code", { children: "2/9" }),
      ", smaller than the stored-code loss 2. Its new outer products would change ",
      /* @__PURE__ */ jsx18("code", { children: "A/B" }),
      ". The displayed old statistics do not magically become those new products when the control moves."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "That is the meaning of a ",
      /* @__PURE__ */ jsx18("strong", { children: "surrogate" }),
      " here: an easier remembered objective formed with previously computed codes. For each old row, minimizing over a new code cannot be worse than evaluating its old code, so the fixed-code reconstruction objective is an upper bound on the freshly minimized one for the same weighted observations. A stream algorithm uses that structure without retaining every row to re-encode it. Its finite iterations, retention choice and numerical stopping do not prove an asymptotic theorem. ",
      /* @__PURE__ */ jsx18("a", { href: "https://jmlr.org/papers/volume11/mairal10a/mairal10a.pdf", children: "Mairal and colleagues' original online formulation" }),
      " develops accumulated statistics, dictionary updates and nonnegative variants under stated assumptions; our bounded code is not their full sparse-coding algorithm or a transfer of its convergence guarantee."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "What does a reliable streaming interface retain?" }),
      " One coherent dictionary/statistic snapshot and enough diagnostics to know what happened. ",
      /* @__PURE__ */ jsx18("code", { children: "OnlineNMF" }),
      " starts from an explicitly supplied dictionary and zero statistics. A nonempty ",
      /* @__PURE__ */ jsx18("code", { children: "partial_fit" }),
      " first encodes the incoming batch with that held dictionary, computes local candidate ",
      /* @__PURE__ */ jsx18("code", { children: "A/B" }),
      ", makes a writable candidate dictionary, performs the configured sweeps, checks finite objectives/gradients, and only then publishes all of them together. Invalid features, retention, shapes or arithmetic preserve the old snapshot. It returns the amounts ",
      /* @__PURE__ */ jsx18("strong", { children: "used at arrival" }),
      "; these are not promised to be optimal under the updated dictionary. ",
      /* @__PURE__ */ jsx18("code", { children: "transform" }),
      " solves new amounts with the current dictionary without changing state; ",
      /* @__PURE__ */ jsx18("code", { children: "inverse_transform" }),
      " uses the fitted rank and feature dimension. Returned public arrays are copies."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The snapshot contains only ",
      /* @__PURE__ */ jsx18("code", { children: "H" }),
      " (",
      /* @__PURE__ */ jsx18("code", { children: "k\xD7d" }),
      "), ",
      /* @__PURE__ */ jsx18("code", { children: "A" }),
      " (",
      /* @__PURE__ */ jsx18("code", { children: "k\xD7k" }),
      "), ",
      /* @__PURE__ */ jsx18("code", { children: "B" }),
      " (",
      /* @__PURE__ */ jsx18("code", { children: "k\xD7d" }),
      "), feature order, fixed encoding/sweep settings and the latest scalar diagnostic. Its ",
      /* @__PURE__ */ jsx18("code", { children: "rows_seen" }),
      " is a count, not a retained observation table or an effective sample-weight sum. History is not hidden in a diagnostics list. The latest report separates incoming-encoding status/iterations/projected gradient from dictionary sweeps, before/after surrogate and dictionary projected gradient. An encoding cap is reported rather than called exact; its returned finite approximate amounts define the products that were actually accumulated. An application requiring tighter encoding can increase the cap or reject cap-status arrivals before using this interface."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "What does this save, and what work remains?" }),
      " Fixed-H batch encoding constructs ",
      /* @__PURE__ */ jsx18("code", { children: "HH.T" }),
      " in ",
      /* @__PURE__ */ jsx18("code", { children: "O(dk\xB2)" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "XbH.T" }),
      " in ",
      /* @__PURE__ */ jsx18("code", { children: "O(bdk)" }),
      ", then uses ",
      /* @__PURE__ */ jsx18("code", { children: "q" }),
      " coordinate sweeps in ",
      /* @__PURE__ */ jsx18("code", { children: "O(qbk\xB2)" }),
      ". Building ",
      /* @__PURE__ */ jsx18("code", { children: "Wb.TWb" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "Wb.TXb" }),
      " costs ",
      /* @__PURE__ */ jsx18("code", { children: "O(bk\xB2+bdk)" }),
      ". Each dictionary sweep and its gradient diagnostic cost ",
      /* @__PURE__ */ jsx18("code", { children: "O(dk\xB2)" }),
      ". These products operate on contracted axes; no ",
      /* @__PURE__ */ jsx18("code", { children: "b\xD7d\xD7k" }),
      " contribution tensor is allocated. Retained memory is ",
      /* @__PURE__ */ jsx18("code", { children: "O(k\xB2+kd)" }),
      " regardless of the number of past rows. Batch input/amounts/cross work require ",
      /* @__PURE__ */ jsx18("code", { children: "O(bd+bk)" }),
      " plus the ",
      /* @__PURE__ */ jsx18("code", { children: "k\xB2/kd" }),
      " caches and deliberate snapshot copies. Increasing rank raises both Gram memory and quadratic-coordinate work; streaming is not free merely because historical rows are discarded."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "How is ordinary MiniBatchNMF used?" }),
      " The complete new program below includes both routes on the same two newly declared arrivals. The public estimator is configured explicitly with two components, custom initial factors, Frobenius loss, no penalties, batch size 1, retention parameter ",
      /* @__PURE__ */ jsx18("code", { children: "forget_factor=1" }),
      ", fresh code solves capped at 1,000, transform cap 1,000 and tolerance ",
      /* @__PURE__ */ jsx18("code", { children: "1e-8" }),
      ". The first ",
      /* @__PURE__ */ jsx18("code", { children: "partial_fit" }),
      " receives the initial ",
      /* @__PURE__ */ jsx18("code", { children: "W/H" }),
      "; the second updates from its fitted ",
      /* @__PURE__ */ jsx18("code", { children: "components_" }),
      ". ",
      /* @__PURE__ */ jsx18("code", { children: "n_steps_" }),
      " counts the two calls, and ",
      /* @__PURE__ */ jsx18("code", { children: "n_components_" }),
      " records fitted rank. A final ",
      /* @__PURE__ */ jsx18("code", { children: "transform" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "inverse_transform" }),
      " encode/reconstruct a new query without changing the dictionary. The ",
      /* @__PURE__ */ jsx18("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.MiniBatchNMF.html", children: "public MiniBatchNMF API" }),
      " documents that incremental lifecycle."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The library uses its own multiplicative accumulators and update rules. Its ",
      /* @__PURE__ */ jsx18("code", { children: "forget_factor" }),
      " is ",
      /* @__PURE__ */ jsx18("strong", { children: "not algebraically equated" }),
      " with this class's ",
      /* @__PURE__ */ jsx18("code", { children: "rho" }),
      " per batch, and its batch-size scaling/fresh-restart work differ. Its whole-data ",
      /* @__PURE__ */ jsx18("code", { children: "fit" }),
      " can stop using parameter change and smoothed-cost controls; two explicit ",
      /* @__PURE__ */ jsx18("code", { children: "partial_fit" }),
      " calls are not a claim that those whole-fit criteria were satisfied. We set parameters rather than inheriting defaults, retain warnings, and compare coherent state/use of the interface rather than arbitrary identical trajectories."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Here is the complete ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_online.py" }),
      ", using the already taught N1 validation/reductions and N2 fixed-H encoder. Its underscored cache kernels are used only behind that validating class. Put it beside those supplied siblings and ",
      /* @__PURE__ */ jsx18("code", { children: "centered_pca.py" }),
      "."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_online.py", filename: "nmf_online.py", language: "python" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "This is the full output of the new two-arrival demonstration. The hand figures use exact amounts; the numerical encoder stops at a tolerance and consequently produces tiny nonzero cells instead of exact symbolic zeros. Both are labelled roles, not contradictory fits. The first scratch arrival used 17 encoding iterations, and the second used 17; the two final dictionary sweeps were a configured cap, not a declaration of whole joint stationarity. The ordinary route recorded two incremental steps and no warnings. Its final query prediction is approximately ",
      /* @__PURE__ */ jsx18("code", { children: "[1.000260,2.000260,2.999740]" }),
      ", whereas the scratch prediction is ",
      /* @__PURE__ */ jsx18("code", { children: "[1.000000,2.000000,3.000000]" }),
      " to six decimals; this tiny constructed stream does not establish a general ranking of optimizers."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_online.stdout.txt", filename: "nmf_online.stdout.txt", language: "output" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The practical decision is now precise: use fresh queries against a current dictionary, and know whether training memory stores old codes, old rows or something else. ",
      /* @__PURE__ */ jsx18("a", { href: "#practice-u-old-statistics-versus-new-encoding", children: "Practice U" }),
      " asks you to distinguish those objectives with the changed ",
      /* @__PURE__ */ jsx18("code", { children: "h=2" }),
      " row. The next section changes the ",
      /* @__PURE__ */ jsx18("strong", { children: "number of data axes" }),
      ", which exposes a different boundary: a compact nonnegative array may still omit essential structure."
    ] }),
    /* @__PURE__ */ jsx18(H2, { children: "18. Keep extra axes and recognize what is missing" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "What if one row has more structure than a list of bins?" }),
      " Preserve the named axes before deciding how to compress them. ",
      /* @__PURE__ */ jsx18("a", { href: "#17-update-as-rows-arrive", children: "Update as rows arrive" }),
      " changed training order while retaining a row-by-feature table. A subject measured at several times has a third axis; treating time and feature as interchangeable can hide the question we meant to answer. We now switch to one exact three-axis array, then a separate two-sample Fourier example to distinguish information we reorganize from information we discard."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "What is one nonnegative component with three axes?" }),
      " One amount from each axis multiplies into each addressed cell."
    ] }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D64" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The picture's axes are observation ",
      /* @__PURE__ */ jsx18("code", { children: "i" }),
      ", feature ",
      /* @__PURE__ */ jsx18("code", { children: "j" }),
      ", and time ",
      /* @__PURE__ */ jsx18("code", { children: "t" }),
      ", each with positions 0 and 1. The observation vector is ",
      /* @__PURE__ */ jsx18("code", { children: "a=[1,2]" }),
      ", the feature vector is ",
      /* @__PURE__ */ jsx18("code", { children: "b=[1,0]" }),
      ", and the time vector is ",
      /* @__PURE__ */ jsx18("code", { children: "c=[1,3]" }),
      ". Choose address ",
      /* @__PURE__ */ jsx18("code", { children: "(i,j,t)=(1,0,1)" }),
      ": the marked entries are ",
      /* @__PURE__ */ jsx18("code", { children: "a1=2" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "b0=1" }),
      ", and ",
      /* @__PURE__ */ jsx18("code", { children: "c1=3" }),
      ", so the cell is 6. No sum over components is needed because this is one component."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "At time 0 the observation-by-feature slice is ",
      /* @__PURE__ */ jsx18("code", { children: "[[1,0],[2,0]]" }),
      "; at time 1 it is ",
      /* @__PURE__ */ jsx18("code", { children: "[[3,0],[6,0]]" }),
      ". The second feature is zero at both times for both observations because its factor entry ",
      /* @__PURE__ */ jsx18("code", { children: "b1=0" }),
      ". A zero entry erases the slice associated with that axis position; an entire zero factor would erase the whole tensor. A ",
      /* @__PURE__ */ jsx18("strong", { children: "tensor" }),
      " here simply means a multidimensional array with named axes. Its order is three, meaning three indices, not matrix rank three."
    ] }),
    /* @__PURE__ */ jsx18(Prose, { children: "This three-vector outer product is written" }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "T=a\\otimes b\\otimes c,\\qquad T_{ijt}=a_i b_j c_t." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The outer-product symbol is used here for this entrywise three-axis construction; it is not a flattened matrix product whose axes are implicit. We call a nonzero outer product ",
      /* @__PURE__ */ jsx18("strong", { children: "rank one" }),
      " in the CP sense because it needs one such separable component. \u201CSeparable\u201D means the dependence on ",
      /* @__PURE__ */ jsx18("code", { children: "i" }),
      ", ",
      /* @__PURE__ */ jsx18("code", { children: "j" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "t" }),
      " factors into independent multipliers, not statistical independence of random variables. A general array may need several terms."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "Does flattening destroy the measurements?" }),
      " Not when the column address map is retained\u2014but an unconstrained matrix factorization can forget separable structure."
    ] }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D65" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The same eight cells now form the matrix ",
      /* @__PURE__ */ jsx18("code", { children: "[[1,3,0,0],[2,6,0,0]]" }),
      ". Its rows are observations; its columns are the ordered pairs ",
      /* @__PURE__ */ jsx18("code", { children: "(feature,time)=(0,0),(0,1),(1,0),(1,1)" }),
      ". Time changes fastest within each feature, so column address is ",
      /* @__PURE__ */ jsx18("code", { children: "2*j+t" }),
      ". Our marked tensor cell ",
      /* @__PURE__ */ jsx18("code", { children: "(1,0,1)" }),
      " maps to matrix row 1, column 1 and still equals 6. This is ",
      /* @__PURE__ */ jsx18("strong", { children: "unfolding" }),
      ". It reorders cells without deleting them. Without that pair-to-column map, a \u201Cfeature 1\u201D in the matrix could ambiguously mean a time or an original feature."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For this one-term example the flattened pattern is ",
      /* @__PURE__ */ jsx18("code", { children: "[b0*c0,b0*c1,b1*c0,b1*c1]=[1,3,0,0]" }),
      " and observation amounts are ",
      /* @__PURE__ */ jsx18("code", { children: "[1,2]" }),
      ". It can be represented by rank-one NMF. But a general four-entry matrix pattern need not equal the outer product of a two-entry feature vector and a two-entry time vector. Flattening followed by ordinary NMF allows a broader pattern class than enforcing a shared feature/time factorization. It is the ",
      /* @__PURE__ */ jsx18("strong", { children: "model constraint" }),
      ", not the mere rearrangement of cells, that changes the assumption."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The first branch of the picture extends the outer product by adding several components. In a ",
      /* @__PURE__ */ jsx18("strong", { children: "CP decomposition" }),
      "\u2014CANDECOMP/PARAFAC\u2014the same component index ",
      /* @__PURE__ */ jsx18("code", { children: "r" }),
      " chooses one observation vector, one feature vector and one time vector, whose outer product is added to the others:"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "\\widehat T_{ijt}=\\sum_{r=1}^{R} A_{ir}B_{jr}C_{tr}." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("code", { children: "A" }),
      " is observation-by-component, ",
      /* @__PURE__ */ jsx18("code", { children: "B" }),
      " feature-by-component and ",
      /* @__PURE__ */ jsx18("code", { children: "C" }),
      " time-by-component. Requiring every entry nonnegative makes each term additive. For ",
      /* @__PURE__ */ jsx18("code", { children: "I" }),
      " observations, ",
      /* @__PURE__ */ jsx18("code", { children: "J" }),
      " features and ",
      /* @__PURE__ */ jsx18("code", { children: "T" }),
      " times, the factors use ",
      /* @__PURE__ */ jsx18("code", { children: "R(I+J+T)" }),
      " numbers, instead of the dense array's ",
      /* @__PURE__ */ jsx18("code", { children: "IJT" }),
      ", before optional scaling weights or metadata. That is a potential saving when rank is small, not a guarantee for every array or rank. Positive factor rescaling and component permutation remain possible, and CP identifiability has its own conditions; the matrix support proof in \xA714 cannot simply be renamed a tensor proof."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The other branch permits different component counts on each axis and an intervening ",
      /* @__PURE__ */ jsx18("strong", { children: "core" }),
      " array. In a ",
      /* @__PURE__ */ jsx18("strong", { children: "Tucker decomposition" }),
      ", a core cell ",
      /* @__PURE__ */ jsx18("code", { children: "G_pqr" }),
      " weights the interaction of observation component ",
      /* @__PURE__ */ jsx18("code", { children: "p" }),
      ", feature component ",
      /* @__PURE__ */ jsx18("code", { children: "q" }),
      ", and time component ",
      /* @__PURE__ */ jsx18("code", { children: "r" }),
      ":"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "\\widehat T_{ijt}=\\sum_{p=1}^{P}\\sum_{q=1}^{Q}\\sum_{r=1}^{R}\nG_{pqr}A_{ip}B_{jq}C_{tr}." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Our same rank-one array uses ",
      /* @__PURE__ */ jsx18("code", { children: "P=Q=R=1" }),
      ", core ",
      /* @__PURE__ */ jsx18("code", { children: "[1]" }),
      ", and the original vectors as the single factor columns. Its factor/core multiplication therefore reproduces exactly ",
      /* @__PURE__ */ jsx18("code", { children: "a_i*b_j*c_t" }),
      ". The separate inset deliberately changes examples: its three factor matrices are ",
      /* @__PURE__ */ jsx18("code", { children: "I2" }),
      ", the 2\xD72 identity, and its core has the sole nonzero ",
      /* @__PURE__ */ jsx18("code", { children: "G[0,1,0]=2" }),
      ". Its reconstructed tensor has the sole nonzero cell ",
      /* @__PURE__ */ jsx18("code", { children: "T[0,1,0]=2" }),
      ". It is ",
      /* @__PURE__ */ jsx18("strong", { children: "not" }),
      " another fitted explanation of our original ",
      /* @__PURE__ */ jsx18("code", { children: "T" }),
      ". It shows that a core can connect different latent positions on different axes, rather than always tying position ",
      /* @__PURE__ */ jsx18("code", { children: "r" }),
      " to position ",
      /* @__PURE__ */ jsx18("code", { children: "r" }),
      " to position ",
      /* @__PURE__ */ jsx18("code", { children: "r" }),
      "."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Tucker storage is ",
      /* @__PURE__ */ jsx18("code", { children: "IP+JQ+TR+PQR" }),
      "; an oversized core can erase a compression advantage. A superdiagonal core with equal axis ranks recovers CP as a special structural case. Neither shape choice supplies missing observations, physical identities or a global optimum. The ",
      /* @__PURE__ */ jsx18("a", { href: "https://www.kolda.net/publication/TensorReview.pdf", children: "Kolda\u2013Bader survey's CP/Tucker definitions" }),
      " distinguish those forms and their axis ranks. ",
      /* @__PURE__ */ jsx18("a", { href: "https://ronak.sh/learn/path/full-curriculum/tensor-algebra-einsum-notation?module=math-foundations#4-keep-batches-and-broadcast-groups-straight", children: "Tensor Algebra \xA74" }),
      " provides the local unfolding, mode-product and outer-product foundations."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The small complete program later in this section constructs every cell with loops and checks the ordinary ",
      /* @__PURE__ */ jsx18("code", { children: "np.einsum" }),
      " route for the same contractions. It does ",
      /* @__PURE__ */ jsx18("strong", { children: "not" }),
      " fit CP or Tucker factors. General nonnegative tensor fitting needs dedicated initialization, masked/sparse objectives, convergence/degeneracy analysis and model selection beyond this matrix lesson. For that next investigation, ",
      /* @__PURE__ */ jsx18("a", { href: "https://tensorly.org/stable/modules/generated/tensorly.decomposition.non_negative_parafac.html", children: "TensorLy's nonnegative CP" }),
      " and ",
      /* @__PURE__ */ jsx18("a", { href: "https://tensorly.org/stable/modules/generated/tensorly.decomposition.non_negative_tucker.html", children: "nonnegative Tucker" }),
      " document actual public optimizer interfaces and returned factor/core shapes. Those are specialist extension resources, not a promise that a general optimizer has already been derived here or in the prerequisite."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "Does sparse storage tell us which values were observed?" }),
      " No: storage and missingness are separate contracts. A word-count zero can be an observed absence stored implicitly in a sparse matrix. A missing spectral measurement can be absent from the objective using the mask from ",
      /* @__PURE__ */ jsx18("a", { href: "#11-control-penalties-and-incomplete-observations", children: "Control penalties and incomplete observations" }),
      ". Discarding unstored zeros would change the first objective; inserting measured zeros would change the second. More axes make the same distinction important at a larger scale. Describe the observation set and error denominator explicitly before selecting sparse or tensor software."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "Can a nonnegative time-frequency picture reconstruct sound by itself?" }),
      " Magnitude omits the direction of a complex coefficient."
    ] }),
    /* @__PURE__ */ jsx18(NmfFigure, { id: "D66" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "We switch from the constructed tensor to a separate, exact two-sample Fourier calculation. Each Fourier coefficient is an arrow in the complex plane: its length is ",
      /* @__PURE__ */ jsx18("strong", { children: "magnitude" }),
      ", and its angle is ",
      /* @__PURE__ */ jsx18("strong", { children: "phase" }),
      ". The coefficient lists are ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1]" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "[0,-1]" }),
      ". Both have magnitudes ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1]" }),
      ", but the second arrow points right in the first list (phase 0) and left in the second (phase ",
      /* @__PURE__ */ jsx18("code", { children: "pi" }),
      "). A magnitude bar keeps the length and throws away that direction. The zero-frequency coefficient is zero; its angle has no signal-bearing meaning here."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "For two samples, the inverse DFT with the convention used here divides by 2. The first sample adds the coefficients; the second subtracts the second coefficient because its rotating factor is ",
      /* @__PURE__ */ jsx18("code", { children: "exp(i*pi)=-1" }),
      ". Thus ",
      /* @__PURE__ */ jsx18("code", { children: "[0,1]" }),
      " gives ",
      /* @__PURE__ */ jsx18("code", { children: "[0.5,-0.5]" }),
      ", whereas ",
      /* @__PURE__ */ jsx18("code", { children: "[0,-1]" }),
      " gives ",
      /* @__PURE__ */ jsx18("code", { children: "[-0.5,0.5]" }),
      ":"
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "neural-equation", tabIndex: 0, role: "region", "aria-label": "Complete mathematical derivation; scroll horizontally when needed", children: /* @__PURE__ */ jsx18(MathBlock, { children: "x_n=\\frac12\\sum_{k=0}^{1}X_k e^{2\\pi i kn/2}." }) }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("code", { children: "i" }),
      " in this equation is the imaginary unit, not our earlier observation index; we have changed to the standard finite-Fourier notation for this separate example. The two real waveforms differ even though their magnitude arrays agree exactly. Their equal magnitudes therefore cannot specify a unique waveform. ",
      /* @__PURE__ */ jsx18("a", { href: "https://ronak.sh/learn/path/full-curriculum/complex-numbers-fourier-laplace-transforms?module=math-foundations#2-describe-an-oscillation-with-a-rotating-arrow", children: "Fourier \xA72" }),
      " explains the rotating arrow; ",
      /* @__PURE__ */ jsx18("a", { href: "https://ronak.sh/learn/path/full-curriculum/complex-numbers-fourier-laplace-transforms?module=math-foundations#6-transform-a-finite-list-exactly", children: "Fourier \xA76" }),
      " derives the finite transform and normalization."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "The ",
      /* @__PURE__ */ jsx18("strong", { children: "short-time Fourier transform" }),
      ", or STFT, applies a windowed Fourier transform to overlapping short signal segments. Its columns index time frames and its rows index frequency bins. A magnitude spectrogram is the nonnegative array of coefficient lengths. If ",
      /* @__PURE__ */ jsx18("code", { children: "S" }),
      " is that complex array, ",
      /* @__PURE__ */ jsx18("code", { children: "|S|" }),
      " is magnitude and ",
      /* @__PURE__ */ jsx18("code", { children: "|S|\xB2" }),
      " is power; they are different numerical representations and lead to different losses/rulers. To match this lesson's rows-as-observations convention, transpose a frequency-by-time magnitude array before using row-oriented NMF, or deliberately state an alternative factor orientation. A factor called a \u201Cspectral template\u201D should then have named frequency bins, while its time amounts name frames."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "A learned additive approximation to magnitude does not restore the missing phase. Reusing mixture phase is an extra approximation; reconstructing a waveform also requires the matching window, overlap, transform size and inverse convention. An iterative magnitude-to-waveform method searches for a signal compatible with a target magnitude but does not establish a unique original phase or auditory source identity. ",
      /* @__PURE__ */ jsx18("a", { href: "https://librosa.org/doc/main/api/generated/librosa.stft.html", children: "librosa STFT" }),
      " documents the complex array, magnitude and phase interface; ",
      /* @__PURE__ */ jsx18("a", { href: "https://librosa.org/doc/main/api/generated/librosa.griffinlim.html", children: "Griffin\u2013Lim" }),
      " is an optional reconstruction route. These inspected links are the development 1.0.0 documentation, so check your installed stable version before using its parameters. No audio experiment or quality comparison is being inferred from our two-sample proof."
    ] }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "",
      /* @__PURE__ */ jsx18("strong", { children: "How can we verify the anatomy without an unexplained optimizer?" }),
      " The complete ",
      /* @__PURE__ */ jsx18("code", { children: "nmf_axis_phase.py" }),
      " below uses explicit addressed multiplication, explicit unfolding and direct inverse sums, then compares them with ",
      /* @__PURE__ */ jsx18("code", { children: "np.einsum" }),
      " and ",
      /* @__PURE__ */ jsx18("code", { children: "np.fft.ifft" }),
      ". Every tensor cell is supplied by the three vectors; no training data, random start or fitting step is hidden. Direct complex exponentials leave a tiny imaginary roundoff term for ",
      /* @__PURE__ */ jsx18("code", { children: "sin(pi)" }),
      "; the output preserves it rather than presenting it as measured signal."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_axis_phase.py", filename: "nmf_axis_phase.py", language: "python" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "Here is its full new finite output. The loops, contractions, exact address and unfolding agree; both inverses share magnitude and differ in sign. The work is deliberately only the promised anatomy. Materializing a dense outer product needs ",
      /* @__PURE__ */ jsx18("code", { children: "O(IJT)" }),
      " cells; retaining its three factors needs ",
      /* @__PURE__ */ jsx18("code", { children: "O(I+J+T)" }),
      " values. Production contractions should avoid materializing an array when only selected cells or a contracted result are required. This two-sample inverse is a direct definition check, not a performance recommendation to replace an FFT by nested loops."
    ] }),
    /* @__PURE__ */ jsx18(RemoteCodeBlock, { source: "/learn-assets/nmf-private/nmf_axis_phase.stdout.txt", filename: "nmf_axis_phase.stdout.txt", language: "output" }),
    /* @__PURE__ */ jsxs15(Prose, { children: [
      "We can now name three different boundaries accurately: flattening with an address map ",
      /* @__PURE__ */ jsx18("strong", { children: "reorganizes" }),
      " information, imposing CP/Tucker ",
      /* @__PURE__ */ jsx18("strong", { children: "restricts" }),
      " a model class, and keeping magnitude alone ",
      /* @__PURE__ */ jsx18("strong", { children: "discards" }),
      " phase. The final changed tasks ask you to make those distinctions yourself, alongside the optimization, state and interpretation decisions from the rest of the lesson."
    ] }),
    /* @__PURE__ */ jsx18("span", { id: "9-practice-explain-change-diagnose", className: "nmf-historical-anchor" }),
    /* @__PURE__ */ jsx18("span", { id: "10-readiness-and-the-next-step", className: "nmf-historical-anchor" }),
    /* @__PURE__ */ jsx18(H2, { children: "19. Solve changed tasks, use files and follow useful next questions" }),
    /* @__PURE__ */ jsx18(Prose, { children: "The tensor and phase examples ended with a distinction we have used throughout: a calculation can be correct without establishing every interpretation we hope to attach to it. These tasks ask you to carry the mechanism into changed inputs, diagnose a plausible wrong answer, and choose a justified implementation. Attempt each visible prompt before opening its hint or solution. Nothing here gates the live labs." }),
    /* @__PURE__ */ jsx18(Prose, { children: "Start with amounts and objectives (A\u2013B, F\u2013K), then interpretation and evaluation (C\u2013E, L\u2013O), then initialization, penalties and extensions (P\u2013X). That order is suggested support, not a requirement to hide the deeper tasks. A correct scalar answer is only part of success: show the addressed arrays, state what was held fixed and explain what the result permits you to conclude." }),
    /* @__PURE__ */ jsxs15("section", { className: "lesson-ending lesson-ending--practice", "data-lesson-ending": "practice", children: [
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "A", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice A: preserve the observation when normalizing" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " Two patterns are ",
          /* @__PURE__ */ jsx18("code", { children: "H=[[2,0,1],[0,1,2]]" }),
          ", with amount row ",
          /* @__PURE__ */ jsx18("code", { children: "[1,3]" }),
          ". Compute the observation, then make each pattern sum to one without changing any reconstructed bin. Are the original amounts probabilities?"
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx18(Prose, { children: "A pattern's row mass is the factor by which its associated amount must grow when you divide that pattern by its mass." })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "The contributions are ",
            /* @__PURE__ */ jsx18("code", { children: "[2,0,1]" }),
            " and ",
            /* @__PURE__ */ jsx18("code", { children: "[0,3,6]" }),
            ", so the observation is ",
            /* @__PURE__ */ jsx18("code", { children: "[2,3,7]" }),
            ". Both pattern masses are 3. The new patterns are ",
            /* @__PURE__ */ jsx18("code", { children: "[2/3,0,1/3]" }),
            " and ",
            /* @__PURE__ */ jsx18("code", { children: "[0,1/3,2/3]" }),
            "; compensated amounts ",
            /* @__PURE__ */ jsx18("code", { children: "[3,9]" }),
            " reconstruct the same two contributions and the same observation. Their sum is 12, not one. Dividing these compensated amounts by 12 gives shares ",
            /* @__PURE__ */ jsx18("code", { children: "[1/4,3/4]" }),
            " of total reconstructed mass under this normalization; it also requires keeping that total mass to reconstruct the observation. This convention does not make the original coefficients calibrated probabilities or identify physical sources."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Divide ",
            /* @__PURE__ */ jsx18("code", { children: "[1,3]" }),
            " by its sum while leaving ",
            /* @__PURE__ */ jsx18("code", { children: "H" }),
            " unchanged. You obtain ",
            /* @__PURE__ */ jsx18("code", { children: "[0.5,0.75,1.75]" }),
            ", a different observation."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Supply both contribution vectors before/after, all three equal reconstructed cells, and the difference between an amount and a sum-one share."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "B", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice B: one fixed-factor multiplicative update" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " Let ",
          /* @__PURE__ */ jsx18("code", { children: "X=[[2,1],[4,3]]" }),
          ", ",
          /* @__PURE__ */ jsx18("code", { children: "W=[[1],[2]]" }),
          ", and ",
          /* @__PURE__ */ jsx18("code", { children: "H=[[1,1]]" }),
          ". Keep ",
          /* @__PURE__ */ jsx18("code", { children: "W" }),
          " fixed and do one Frobenius multiplicative update of ",
          /* @__PURE__ */ jsx18("code", { children: "H" }),
          ". Compute the resulting half-squared loss."
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "The numerator ",
            /* @__PURE__ */ jsx18("code", { children: "W.T@X" }),
            " and denominator ",
            /* @__PURE__ */ jsx18("code", { children: "(W.T@W)@H" }),
            " each have one component row and two feature columns."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "The numerator is ",
            /* @__PURE__ */ jsx18("code", { children: "[10,7]" }),
            ", ",
            /* @__PURE__ */ jsx18("code", { children: "W.T@W=5" }),
            ", and the denominator is ",
            /* @__PURE__ */ jsx18("code", { children: "[5,5]" }),
            ". Elementwise multiplication by their ratio gives ",
            /* @__PURE__ */ jsx18("code", { children: "Hnew=[2,7/5]" }),
            ". The predictions are ",
            /* @__PURE__ */ jsx18("code", { children: "[[2,7/5],[4,14/5]]" }),
            ". The only nonzero residuals are ",
            /* @__PURE__ */ jsx18("code", { children: "-2/5" }),
            " and ",
            /* @__PURE__ */ jsx18("code", { children: "1/5" }),
            "; their squared sum divided by two is ",
            /* @__PURE__ */ jsx18("code", { children: "1/10" }),
            ". In this special one-component fixed-W problem, the two independent feature quadratics have positive curvature 5 and nonnegative unconstrained minimizers ",
            /* @__PURE__ */ jsx18("code", { children: "[10/5,7/5]" }),
            ", so that step happens to be the exact block optimum. That does not make one general alternating sweep exact."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Treat the ratio as matrix division or transpose the feature cells into separate observations."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Show the shaped intermediate products, the prediction, residuals and the reason this particular block is solved."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "C", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice C: distinguish a useful pattern from a biological source" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " Someone chooses six components, observes a low reconstruction error and concludes, \u201CThere are exactly six biological sources; the largest coefficient is the strongest source.\u201D Describe a concrete evaluation and independent domain evidence that would be needed to defend a source claim."
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx18(Prose, { children: "Chosen rank, coefficient units, predictive usefulness and physical identity answer different questions." })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsx18(Prose, { children: "One acceptable response is: compare candidate ranks using a declared held-out reconstruction or downstream task metric, with fitting and selection restricted to training/validation roles. This assesses usefulness of a representation, not the true source count. Compare each component's invariant weighted contribution, rather than a raw coefficient whose size can be changed by compensated scaling. Then validate a proposed biological interpretation against independent markers or controlled mixtures that distinguish alternatives with equally good products. The application must establish relevant measurement and mixture assumptions. Neither a low error nor a visually localized pattern alone verifies source identity or causation. Other experimentally justified validation designs are valid answers." }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Rename component rows after familiar substances and use the reconstruction error as independent confirmation."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Name one actual assessment procedure, one independent validation source, and a scale-invariant comparison; do not invent clinical performance or claim six causes from ",
          /* @__PURE__ */ jsx18("code", { children: "k=6" }),
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "D", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice D: remove an actual saved contribution" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " Use saved reserved source row 256, not the first displayed row. Remove the component with the largest ",
          /* @__PURE__ */ jsx18("strong", { children: "total" }),
          " contribution, holding all other amounts and the dictionary fixed. Identify the component, describe the 64-bin change, and compare MSE. Then find a zero-change removal in source row 242."
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "Rank ",
            /* @__PURE__ */ jsx18("code", { children: "W_ic * sum_j H_cj" }),
            ", not ",
            /* @__PURE__ */ jsx18("code", { children: "W_ic" }),
            " alone. The supplied ",
            /* @__PURE__ */ jsx18("code", { children: "describe_saved_row" }),
            " uses zero-based code component indices."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "Source 256's largest coefficient is C7, but its largest total addend is C8. Set component index 7's gain to zero. Every reconstructed bin loses the corresponding cell of ",
            /* @__PURE__ */ jsx18("code", { children: "W_256,7 * H_7" }),
            "; this full 8\xD78 addend is printed in ",
            /* @__PURE__ */ jsx18("a", { href: "#12-inspect-an-actual-digit-dictionary-and-contribution", children: "Inspect an actual digit dictionary and contribution" }),
            ". MSE changes from ",
            /* @__PURE__ */ jsx18("code", { children: "0.02758816154887481" }),
            " to ",
            /* @__PURE__ */ jsx18("code", { children: "0.0732625383196997" }),
            ". This is a descriptive removal from the preserved k8/seed19 factors, not a refit and not the new k6 comparison. Some bin residuals can get closer to zero even while the total error worsens. An exact fixed-H NNLS optimum could not improve under this feasible amount change; finite solver tolerance is the qualification for the saved numerical code."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "For source 242, C8 has zero amount. Removing that component changes no prediction cell. The relevant complete program calls are ",
            /* @__PURE__ */ jsx18("code", { children: "describe_saved_row(saved,256,component=7,gain=0)" }),
            " and ",
            /* @__PURE__ */ jsx18("code", { children: "describe_saved_row(saved,242,component=7,gain=0)" }),
            ". ",
            /* @__PURE__ */ jsx18("code", { children: "load_saved_digits()" }),
            " verifies the supplied payload/CSV identities; it never fits missing factors as a fallback."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Choose C7 from its raw coefficient, silently refit the remaining components, or use current array position 256 instead of global source ID 256."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " State source/component IDs, the all-bin subtraction rule, both MSEs, fixed-versus-refitted roles and the source242/C8 null case."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "E", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice E: repair representation leakage" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " A document classifier learns TF-IDF and NMF from all documents and then splits their encodings for classifier training and testing. Repair its evaluation flow."
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx18(Prose, { children: "The representation itself learns vocabulary, document frequencies and patterns, even before a classifier sees labels." })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "Split source documents first. Within each training fold, fit the vocabulary/count mapping, IDF weights and NMF dictionary on that fold's training rows, then transform validation rows using those fitted objects. Fit the classifier using only training encodings/labels. Select the full preparation-plus-model configuration by validation; reserve the test documents for the final selected procedure. An OOV test word cannot create a test-derived column or update an IDF. A known fixed measurement conversion such as the digit ",
            /* @__PURE__ */ jsx18("code", { children: "/16" }),
            " ruler is different from a learned corpus statistic. If a deployment task intentionally permits transductive access to unlabelled future data, declare and evaluate that different information setting rather than describing it as ordinary held-out testing."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Split only the classifier while leaving the globally learned representation untouched."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Name all learned objects, their fit/transform roles and the assessment boundary, including the classifier. Explain why labels need not have been used for leakage to occur."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "F", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice F: test joint convexity numerically" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " For scalar observation ",
          /* @__PURE__ */ jsx18("code", { children: "x=2" }),
          ", both factor pairs ",
          /* @__PURE__ */ jsx18("code", { children: "(w,h)=(1,2)" }),
          " and ",
          /* @__PURE__ */ jsx18("code", { children: "(4,0.5)" }),
          " reconstruct it exactly. Average the factor pairs and test the convex midpoint inequality for ",
          /* @__PURE__ */ jsx18("code", { children: "L=0.5(x-wh)\xB2" }),
          "."
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx18(Prose, { children: "Average the factors first, not their already multiplied predictions." })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "The factor midpoint is ",
            /* @__PURE__ */ jsx18("code", { children: "(2.5,1.25)" }),
            ", predicting ",
            /* @__PURE__ */ jsx18("code", { children: "3.125" }),
            ". Its half-loss is ",
            /* @__PURE__ */ jsx18("code", { children: "(2-3.125)\xB2/2=0.6328125" }),
            ", whereas the average endpoint loss is zero. This violates the convex midpoint inequality. Each fixed-factor slice remains a convex quadratic; the counterexample concerns the joint factor coordinates, not every individual block."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Average the two products (both 2) and assert that averaged factors must also produce 2."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Show the literal midpoint, product, loss and scope of the failed inequality."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "G", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice G: change the joint gain under three losses" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " For strictly positive observed/predicted arrays ",
          /* @__PURE__ */ jsx18("code", { children: "x,y" }),
          ", multiply both by 3. How do Frobenius half-square, generalized KL and Itakura\u2013Saito losses change?"
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx18(Prose, { children: "Substitute into each scalar term before summing. The logarithmic ratio is unchanged." })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("code", { children: "(3x-3y)\xB2/2=9(x-y)\xB2/2" }),
            ". Generalized KL is ",
            /* @__PURE__ */ jsx18("code", { children: "x log(x/y)-x+y" }),
            ", so substitution gives three times every term. Itakura\u2013Saito is ",
            /* @__PURE__ */ jsx18("code", { children: "x/y-log(x/y)-1" }),
            ", whose ratio is unchanged, hence its loss multiplier is one. The respective multipliers are 9, 3 and 1. These are ",
            /* @__PURE__ */ jsx18("strong", { children: "joint" }),
            " gain changes: changing only the prediction is not the same experiment. Strict positivity keeps the stated IS domain valid."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Call all reconstruction losses scale invariant, or apply the IS conclusion to observed zeros without examining its domain."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Derive all three substitutions and state what was scaled and which domain was used."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "H", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice H: an unchanged multiplicative coordinate can be wrong" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " Keep scalar ",
          /* @__PURE__ */ jsx18("code", { children: "W=1" }),
          " fixed, with observation row ",
          /* @__PURE__ */ jsx18("code", { children: "[3,1]" }),
          " and dictionary row ",
          /* @__PURE__ */ jsx18("code", { children: "[0,2]" }),
          ". Compute the gradient, test nonnegative stationarity, and explain what multiplication does to the zero coordinate."
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "The gradient is ",
            /* @__PURE__ */ jsx18("code", { children: "H-X" }),
            "; at a zero coordinate, a negative derivative points into a feasible improving positive direction."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "The gradient is ",
            /* @__PURE__ */ jsx18("code", { children: "[-3,1]" }),
            ". The zero first cell fails the boundary condition because increasing it reduces loss; the positive second cell fails the interior zero-gradient condition. The true fixed-W optimum is ",
            /* @__PURE__ */ jsx18("code", { children: "[3,1]" }),
            ". A multiplicative rule keeps the first cell at zero, because multiplying zero by a finite ratio cannot make it positive. The resulting lack of motion cannot certify stationarity. A coordinate method can activate that cell using its slope."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Infer \u201Cconverged\u201D from an unchanged zero or from the factors merely being nonnegative."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Explain both coordinate conditions, the improving direction and the difference between algorithm motion and objective stationarity."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "I", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice I: use the fresh coordinate" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " For ",
          /* @__PURE__ */ jsx18("code", { children: "x=[1,3,4]" }),
          ", ",
          /* @__PURE__ */ jsx18("code", { children: "H0=[[1,0,1],[0,1,1]]" }),
          " and starting amounts ",
          /* @__PURE__ */ jsx18("code", { children: "[1,1]" }),
          ", update C0 then C1 once. Is that the exact encoding?"
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("code", { children: "G=[[2,1],[1,2]]" }),
            ", ",
            /* @__PURE__ */ jsx18("code", { children: "p=[5,7]" }),
            ". C1's slope uses the newly updated C0."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "C0's slope is ",
            /* @__PURE__ */ jsx18("code", { children: "2*1+1-5=-2" }),
            "; curvature 2 gives C0=2. C1's fresh slope is ",
            /* @__PURE__ */ jsx18("code", { children: "2+2*1-7=-3" }),
            ", so C1 becomes ",
            /* @__PURE__ */ jsx18("code", { children: "1-(-3)/2=2.5" }),
            ". Prediction ",
            /* @__PURE__ */ jsx18("code", { children: "[2,2.5,4.5]" }),
            " has residual ",
            /* @__PURE__ */ jsx18("code", { children: "[-1,0.5,-0.5]" }),
            " and half-loss ",
            /* @__PURE__ */ jsx18("code", { children: "3/4" }),
            ". Exact amounts ",
            /* @__PURE__ */ jsx18("code", { children: "[1,3]" }),
            " give zero error. A finite sweep is useful without being the solved block."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Use stale C0=1 to obtain C1=3 and call that a cyclic sweep."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Supply both slopes, fresh prediction/loss and the exact reference showing remaining improvement."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "J", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice J: clipping least squares is not NNLS" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " With patterns ",
          /* @__PURE__ */ jsx18("code", { children: "[[1,0],[1,1]]" }),
          " and query ",
          /* @__PURE__ */ jsx18("code", { children: "[0,1]" }),
          ", unconstrained least squares gives ",
          /* @__PURE__ */ jsx18("code", { children: "[-1,1]" }),
          ". Compare clipping it to solving the actual nonnegative problem."
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx18(Prose, { children: "After imposing C0=0, reoptimize C1 instead of assuming its old value still works." })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "Clipping gives ",
            /* @__PURE__ */ jsx18("code", { children: "[0,1]" }),
            ", predicting ",
            /* @__PURE__ */ jsx18("code", { children: "[1,1]" }),
            " with half-loss ",
            /* @__PURE__ */ jsx18("code", { children: "1/2" }),
            ". On boundary C0=0 the objective is ",
            /* @__PURE__ */ jsx18("code", { children: "0.5(t\xB2+(t-1)\xB2)" }),
            ", minimized at C1=",
            /* @__PURE__ */ jsx18("code", { children: "1/2" }),
            "; prediction ",
            /* @__PURE__ */ jsx18("code", { children: "[1/2,1/2]" }),
            " has half-loss ",
            /* @__PURE__ */ jsx18("code", { children: "1/4" }),
            ". Its gradient for C0 is ",
            /* @__PURE__ */ jsx18("code", { children: "1/2" }),
            " (compatible with the zero boundary), and for C1 is zero (required at the positive coordinate). The clipped point has positive C1 derivative 1 and can improve by decreasing it."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Treat projection of the unconstrained coefficients onto the nonnegative orthant as projection of the observation onto the pattern cone."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Show both predictions/losses and the boundary/free-coordinate derivatives."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "K", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice K: missing is not measured zero" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " A single pattern is ",
          /* @__PURE__ */ jsx18("code", { children: "[1,1]" }),
          " and the row is ",
          /* @__PURE__ */ jsx18("code", { children: "[2,0]" }),
          ". Solve for its amount when both bins are measured, then when the second bin is omitted with mask ",
          /* @__PURE__ */ jsx18("code", { children: "[1,0]" }),
          "."
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx18(Prose, { children: "Write the two included-residual objectives explicitly." })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "With both measured, ",
            /* @__PURE__ */ jsx18("code", { children: "L(w)=0.5((2-w)\xB2+w\xB2)" }),
            " has derivative ",
            /* @__PURE__ */ jsx18("code", { children: "2w-2" }),
            ", so ",
            /* @__PURE__ */ jsx18("code", { children: "w=1" }),
            ", prediction ",
            /* @__PURE__ */ jsx18("code", { children: "[1,1]" }),
            ", half-loss 1. With mask ",
            /* @__PURE__ */ jsx18("code", { children: "[1,0]" }),
            ", ",
            /* @__PURE__ */ jsx18("code", { children: "L_M(w)=0.5(2-w)\xB2" }),
            ", minimized at ",
            /* @__PURE__ */ jsx18("code", { children: "w=2" }),
            " with included loss zero. The prediction ",
            /* @__PURE__ */ jsx18("code", { children: "[2,2]" }),
            " at the omitted bin is not verified by that zero loss. The mask changes which data constrain the fit; it is not just a display setting."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Fill a missing bin with zero and fit it as observed, or call masked zero loss accuracy on all bins."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Show both minimizers/objectives and state what remains unknown."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "L", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice L: another joint midpoint" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " For ",
          /* @__PURE__ */ jsx18("code", { children: "x=1" }),
          ", compare exact factor endpoints ",
          /* @__PURE__ */ jsx18("code", { children: "(1,1)" }),
          " and ",
          /* @__PURE__ */ jsx18("code", { children: "(2,0.5)" }),
          " with their midpoint. Why does the answer not contradict convex fixed-H encoding?"
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "The midpoint is ",
            /* @__PURE__ */ jsx18("code", { children: "(1.5,0.75)" }),
            "; multiply those values."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "Its product is ",
            /* @__PURE__ */ jsx18("code", { children: "9/8" }),
            "; half-loss is ",
            /* @__PURE__ */ jsx18("code", { children: "0.5(1-9/8)\xB2=1/128" }),
            ", while endpoint losses are zero. The jointly varying ",
            /* @__PURE__ */ jsx18("code", { children: "(w,h)" }),
            " midpoint inequality fails. A fixed-H subproblem varies only ",
            /* @__PURE__ */ jsx18("code", { children: "w" }),
            "; its feasible slice never joins these two endpoints with different ",
            /* @__PURE__ */ jsx18("code", { children: "h" }),
            " values."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Use this example to call the fixed-H NNLS problem nonconvex."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Give the explicit inequality and the difference between a joint path and a block slice."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "M", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice M: a feasible ambiguity beyond scale" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " Use the separate positive-shear dictionary ",
          /* @__PURE__ */ jsx18("code", { children: "Hs=[[1,1,1],[0,1,1]]" }),
          ", amounts ",
          /* @__PURE__ */ jsx18("code", { children: "[2,1]" }),
          " and shear value ",
          /* @__PURE__ */ jsx18("code", { children: "t=0.5" }),
          ". Construct the changed nonnegative factors and verify their product. Could you apply the same shear to ",
          /* @__PURE__ */ jsx18("code", { children: "H0" }),
          "?"
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "Multiply the amount row by ",
            /* @__PURE__ */ jsx18("code", { children: "[[1,t],[0,1]]" }),
            " and the dictionary by its inverse ",
            /* @__PURE__ */ jsx18("code", { children: "[[1,-t],[0,1]]" }),
            "."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "Amounts become ",
            /* @__PURE__ */ jsx18("code", { children: "[2,2]" }),
            "; the dictionary becomes ",
            /* @__PURE__ */ jsx18("code", { children: "[[1,0.5,0.5],[0,1,1]]" }),
            ". Its contributions ",
            /* @__PURE__ */ jsx18("code", { children: "[2,1,1]" }),
            " and ",
            /* @__PURE__ */ jsx18("code", { children: "[0,2,2]" }),
            " add to ",
            /* @__PURE__ */ jsx18("code", { children: "[2,3,3]" }),
            ", the same as the original contributions ",
            /* @__PURE__ */ jsx18("code", { children: "[2,2,2]" }),
            " and ",
            /* @__PURE__ */ jsx18("code", { children: "[0,1,1]" }),
            ". One ray's direction changed, so this is more than a row rescaling or permutation. Applying the inverse to ",
            /* @__PURE__ */ jsx18("code", { children: "H0" }),
            " makes its first row ",
            /* @__PURE__ */ jsx18("code", { children: "[1,-0.5,0.5]" }),
            ", which violates nonnegativity. A valid transformation depends on the actual support."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Assume an invertible factor transformation always preserves nonnegative feasibility."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Show all arrays/products and the forbidden ",
          /* @__PURE__ */ jsx18("code", { children: "H0" }),
          " entry."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "N", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice N: ordinary rank can be too small" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " For ",
          /* @__PURE__ */ jsx18("code", { children: "X=[[1,1,0,0],[0,1,1,0],[0,0,1,1],[1,0,0,1]]" }),
          ", show ordinary rank 3 but nonnegative rank 4. Would the same zero-support argument apply after adding a small positive value to every zero?"
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx18(Prose, { children: "Ordinary row dependence permits subtraction; nonnegative outer products do not cancel forbidden positives. Consider the four positive diagonal cells." })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "The first minus second plus third minus fourth row is zero, so rank is at most 3. The top-left 3\xD73 triangular minor has determinant 1, so rank is at least 3. For a nonnegative rank-one term, positive row positions crossed with positive column positions form a positive support rectangle. Any two diagonal positives here have a forbidden cross-zero between them, so one term cannot cover both without incorrectly making that zero positive. At least four terms are required. ",
            /* @__PURE__ */ jsx18("code", { children: "I4@X" }),
            " is a nonnegative four-component factorization, giving the matching upper bound. Thus ordinary rank is 3 and nonnegative rank is 4. Filling the zeros changes the support premise; it invalidates this exact lower-bound proof, without by itself proving that the new nonnegative rank is 3."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Equate nonnegative rank with ordinary rank, or carry an exact zero-support proof into a noisy positive approximation."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Supply the ordinary lower/upper bounds, support argument and nonnegative upper bound, with the changed-premise limitation."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "O", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice O: reverse a raw ranking without changing anything observed" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " For ",
          /* @__PURE__ */ jsx18("code", { children: "x=[2,1,3]" }),
          ", ",
          /* @__PURE__ */ jsx18("code", { children: "H0" }),
          " and amounts ",
          /* @__PURE__ */ jsx18("code", { children: "[2,1]" }),
          ", multiply component 0's pattern by 3 and divide its amount by 3. Which raw coefficient is now larger? Which component contributes more total mass?"
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx18(Prose, { children: "Compare each complete weighted pattern rather than amounts with different units." })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "The changed dictionary is ",
            /* @__PURE__ */ jsx18("code", { children: "[[3,0,3],[0,1,1]]" }),
            " and amounts are ",
            /* @__PURE__ */ jsx18("code", { children: "[2/3,1]" }),
            ". C1's raw coefficient is now larger, but C0's contribution remains ",
            /* @__PURE__ */ jsx18("code", { children: "[2,0,2]" }),
            ", total 4, versus C1's ",
            /* @__PURE__ */ jsx18("code", { children: "[0,1,1]" }),
            ", total 2. Their sum remains ",
            /* @__PURE__ */ jsx18("code", { children: "[2,1,3]" }),
            ". Ranking the raw coefficients reverses while the actual additive contributions stay fixed."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Declare C1 the larger total source solely because its coefficient now exceeds C0's."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Show both all-bin contributions, both totals and the unit-change explanation."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "P", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice P: retain the stronger sign pair" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " A singular triplet has ",
          /* @__PURE__ */ jsx18("code", { children: "sigma=5" }),
          ", ",
          /* @__PURE__ */ jsx18("code", { children: "u=v=[0.6,-0.8]" }),
          ". Which positive/negative pair does the NNDSVD sign-pair rule retain, and what is its reconstructed rank-one term? Then change ",
          /* @__PURE__ */ jsx18("code", { children: "u" }),
          " to ",
          /* @__PURE__ */ jsx18("code", { children: "[0.8,-0.6]" }),
          " while keeping ",
          /* @__PURE__ */ jsx18("code", { children: "v" }),
          " fixed and apply the declared tie convention."
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx18(Prose, { children: "Compare the products of paired vector-part norms, not the independent largest entries. This is a triplet exercise, not a claim that the edited triplet remains the same input matrix's SVD." })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "The positive-part norm product is ",
            /* @__PURE__ */ jsx18("code", { children: "0.6*0.6=0.36" }),
            "; the negative-part product is ",
            /* @__PURE__ */ jsx18("code", { children: "0.8*0.8=0.64" }),
            ". The latter wins. Its unit directions both point to the second coordinate, and scaled product is ",
            /* @__PURE__ */ jsx18("code", { children: "5*0.64=16/5" }),
            ", yielding ",
            /* @__PURE__ */ jsx18("code", { children: "[[0,0],[0,16/5]]" }),
            ". Positive-only clipping would retain ",
            /* @__PURE__ */ jsx18("code", { children: "9/5" }),
            " in the top-left instead and miss the larger admissible pair. With edited ",
            /* @__PURE__ */ jsx18("code", { children: "u" }),
            ", both products equal ",
            /* @__PURE__ */ jsx18("code", { children: "0.8*0.6=0.6*0.8=0.48" }),
            "; our declared positive-pair tie rule chooses the first support. Coupled sign flips of a valid SVD pair exchange the candidate names without changing their products, except that a declared exact-tie orientation convention must still be understood."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Clip each singular vector independently and assume the surviving positive-positive pair must be best."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Give both norm products, selected support rectangle/scale and the tie policy, without claiming a unique global NMF start."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "Q", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice Q: verify the auxiliary upper bound" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " Let ",
          /* @__PURE__ */ jsx18("code", { children: "f(z)=(z-2)\xB2" }),
          ", current ",
          /* @__PURE__ */ jsx18("code", { children: "a=0.5" }),
          ", and ",
          /* @__PURE__ */ jsx18("code", { children: "q(z|a)=f(z)+(z-a)\xB2/(2a)" }),
          ". Find the minimizer of ",
          /* @__PURE__ */ jsx18("code", { children: "q" }),
          " and verify the touching, upper-bound and descent relations."
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "At ",
            /* @__PURE__ */ jsx18("code", { children: "a=0.5" }),
            ", ",
            /* @__PURE__ */ jsx18("code", { children: "q=(z-2)\xB2+(z-0.5)\xB2" }),
            "; its derivative is ",
            /* @__PURE__ */ jsx18("code", { children: "4z-5" }),
            "."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "The minimizer is ",
            /* @__PURE__ */ jsx18("code", { children: "z=5/4" }),
            ". There, ",
            /* @__PURE__ */ jsx18("code", { children: "f=9/16" }),
            ", ",
            /* @__PURE__ */ jsx18("code", { children: "q=9/8" }),
            ", and the gap is ",
            /* @__PURE__ */ jsx18("code", { children: "9/16" }),
            ". For every real ",
            /* @__PURE__ */ jsx18("code", { children: "z" }),
            ", ",
            /* @__PURE__ */ jsx18("code", { children: "q-f=(z-a)\xB2/(2a)\u22650" }),
            " because ",
            /* @__PURE__ */ jsx18("code", { children: "a>0" }),
            "; at ",
            /* @__PURE__ */ jsx18("code", { children: "z=a" }),
            " both equal ",
            /* @__PURE__ */ jsx18("code", { children: "(0.5-2)\xB2=9/4" }),
            ". Therefore ",
            /* @__PURE__ */ jsx18("code", { children: "f(5/4)\u2264q(5/4)\u2264q(a)=f(a)" }),
            ". This is the logical chain behind that MM step, not a statement that it jumps to the minimizer of ",
            /* @__PURE__ */ jsx18("code", { children: "f" }),
            ", which is 2. The local scalar upper bound does not prove every beta-divergence update."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Minimize ",
            /* @__PURE__ */ jsx18("code", { children: "f" }),
            " directly and label the result the auxiliary-function step, or skip the touching condition."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Supply the derivative, minimum, gap, touching value and complete ordered descent chain."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "R", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice R: a product-invariant rescaling can change the penalty" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " Use exact ",
          /* @__PURE__ */ jsx18("code", { children: "W=[[2,1],[1,3],[0,2]]" }),
          ", ",
          /* @__PURE__ */ jsx18("code", { children: "H0" }),
          ", ",
          /* @__PURE__ */ jsx18("code", { children: "alpha_W=0.1" }),
          ", ",
          /* @__PURE__ */ jsx18("code", { children: "alpha_H=0.2" }),
          ", ",
          /* @__PURE__ */ jsx18("code", { children: "l1_ratio=1" }),
          ", and ",
          /* @__PURE__ */ jsx18("code", { children: "n=d=3" }),
          ". Multiply C0's dictionary row by 2 and divide its amount column by 2. Compare objective values, then set both alphas to zero."
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "The dimension-scaled L1 coefficients are ",
            /* @__PURE__ */ jsx18("code", { children: "alpha_W*d=0.3" }),
            " and ",
            /* @__PURE__ */ jsx18("code", { children: "alpha_H*n=0.6" }),
            "."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "Original factor masses are ",
            /* @__PURE__ */ jsx18("code", { children: "sum(W)=9" }),
            " and ",
            /* @__PURE__ */ jsx18("code", { children: "sum(H)=4" }),
            ", so the penalty is ",
            /* @__PURE__ */ jsx18("code", { children: "0.3*9+0.6*4=5.1" }),
            ". Changed ",
            /* @__PURE__ */ jsx18("code", { children: "W" }),
            " has mass ",
            /* @__PURE__ */ jsx18("code", { children: "1+0.5+0+1+3+2=7.5" }),
            "; changed ",
            /* @__PURE__ */ jsx18("code", { children: "H" }),
            " has mass 6, so the penalty is ",
            /* @__PURE__ */ jsx18("code", { children: "0.3*7.5+0.6*6=5.85" }),
            ". Residual loss stays zero because the product is unchanged. Hence the penalized objective rises even though reconstruction is invariant. With both alphas zero, both penalties vanish and the objectives are again equal."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Infer objective invariance from product invariance after adding factor penalties."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Supply the two masses, dimension factors, two costs and null-penalty case."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "S", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice S: preserve global IDs when choosing anchors" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " The ordered observations are ID42=",
          /* @__PURE__ */ jsx18("code", { children: "[1,0]" }),
          ", ID7=",
          /* @__PURE__ */ jsx18("code", { children: "[0,1]" }),
          ", ID99=",
          /* @__PURE__ */ jsx18("code", { children: "[0.75,0.25]" }),
          ", ID10=",
          /* @__PURE__ */ jsx18("code", { children: "[0,1]" }),
          ", ID6=",
          /* @__PURE__ */ jsx18("code", { children: "[0,0]" }),
          ". Request two anchors using the normalized-row rule. Which IDs are selected? What happens if you request three independent anchors?"
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "Exclude zero rows, retain their ID mapping, and resolve exact norm ties by original ",
            /* @__PURE__ */ jsx18("strong", { children: "normalized-input" }),
            " norm and then global ID."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "The nonzero rows already sum to one. Pure rows 42, 7 and 10 have squared norm 1, so ID7 wins the exact tie. Projection along ",
            /* @__PURE__ */ jsx18("code", { children: "[0,1]" }),
            " leaves ID42 residual ",
            /* @__PURE__ */ jsx18("code", { children: "[1,0]" }),
            ", ID99 ",
            /* @__PURE__ */ jsx18("code", { children: "[0.75,0]" }),
            " and the duplicate ID10 ",
            /* @__PURE__ */ jsx18("code", { children: "[0,0]" }),
            ". ID42 wins the next squared-norm comparison. Selected global IDs are ",
            /* @__PURE__ */ jsx18("code", { children: "(7,42)" }),
            " even though their physical input positions are 1 and 0. ID6 remains the excluded-zero mapping. Three independent directions cannot exist in two features, so the rank request is refused; the duplicate cannot supply a third direction. Signed projection residuals in less axis-aligned cases must not be clipped back into the original nonnegative data domain."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Return local array indices as source identities, select the duplicate as a new direction, or treat the zero row as a pure anchor."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Give both IDs, intermediate residuals, excluded-zero identity and the rank refusal, with tie units stated."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "T", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice T: query with fixed IDF" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " Use \xA716's three training documents and vocabulary ",
          /* @__PURE__ */ jsx18("code", { children: "[orbit,rocket,team]" }),
          ". Encode the raw words ",
          /* @__PURE__ */ jsx18("code", { children: "rocket planet" }),
          " into counts and unnormalized TF-IDF. Then do the same for an all-",
          /* @__PURE__ */ jsx18("code", { children: "planet" }),
          " query. Should either query change the IDF or dictionary?"
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("code", { children: "rocket" }),
            " appeared in two of the three training documents; ",
            /* @__PURE__ */ jsx18("code", { children: "planet" }),
            " has no retained column."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "Counts are ",
            /* @__PURE__ */ jsx18("code", { children: "[0,1,0]" }),
            "; weighted values are ",
            /* @__PURE__ */ jsx18("code", { children: "[0,1+log(4/3),0]" }),
            ", approximately ",
            /* @__PURE__ */ jsx18("code", { children: "[0,1.2876820724517808,0]" }),
            ". ",
            /* @__PURE__ */ jsx18("code", { children: "planet" }),
            " does not create a new feature, and the all-OOV query is ",
            /* @__PURE__ */ jsx18("code", { children: "[0,0,0]" }),
            " in both representations. Query encoding holds the learned dictionary fixed; neither vocabulary nor training IDF is refit. Its zero amounts describe a null retained representation, not an absence of meaning. The weighted row is not a literal count observation for a Poisson likelihood simply because it stays nonnegative."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Recompute document frequencies from the query or append a query-derived vocabulary column."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Give fixed dimensions, exact weight, OOV/null behavior and the fit-versus-query boundary."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "U", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice U: old statistics versus new encoding" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " Keep \xA717's observations ",
          /* @__PURE__ */ jsx18("code", { children: "[2,1,3]" }),
          ", ",
          /* @__PURE__ */ jsx18("code", { children: "[0,2,2]" }),
          " and arrival codes ",
          /* @__PURE__ */ jsx18("code", { children: "[2,1]" }),
          ", ",
          /* @__PURE__ */ jsx18("code", { children: "[0,2]" }),
          ". Change the first dictionary cell from 1 to 2, keeping ",
          /* @__PURE__ */ jsx18("code", { children: "H=[[2,0,1],[0,1,1]]" }),
          ". Compare stored-code and fresh optimal first-row reconstructions. Do the stored ",
          /* @__PURE__ */ jsx18("code", { children: "A/B" }),
          " become freshly encoded statistics?"
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx18(Prose, { children: "Solve the new two-coordinate normal equations; both resulting amounts are positive, so no boundary clipping is needed." })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "Old amounts ",
            /* @__PURE__ */ jsx18("code", { children: "[2,1]" }),
            " predict ",
            /* @__PURE__ */ jsx18("code", { children: "[4,1,3]" }),
            ", with half-loss 2. Fresh amounts ",
            /* @__PURE__ */ jsx18("code", { children: "[10/9,13/9]" }),
            " predict ",
            /* @__PURE__ */ jsx18("code", { children: "[20/9,13/9,23/9]" }),
            "; their residual is ",
            /* @__PURE__ */ jsx18("code", { children: "[-2/9,-4/9,4/9]" }),
            ", giving half-loss ",
            /* @__PURE__ */ jsx18("code", { children: "(4+16+16)/(2*81)=2/9" }),
            ". The second row remains exact with ",
            /* @__PURE__ */ jsx18("code", { children: "[0,2]" }),
            ". Stored ",
            /* @__PURE__ */ jsx18("code", { children: "A=[[4,2],[2,5]]" }),
            " and ",
            /* @__PURE__ */ jsx18("code", { children: "B=[[4,2,6],[2,5,7]]" }),
            " came from the old codes. Fresh first-row outer products differ, so those retained matrices do not become them automatically. The remembered quadratic is a historical-code surrogate, not a full freshly re-encoded refit."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Change ",
            /* @__PURE__ */ jsx18("code", { children: "H" }),
            " and quietly reinterpret old ",
            /* @__PURE__ */ jsx18("code", { children: "A/B" }),
            " as products of fresh optimal amounts."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Supply both predictions/losses, the unchanged second row and the two distinct statistic roles."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "V", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice V: a rejected next fit must preserve the old query contract" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " A coherent fitted snapshot has ",
          /* @__PURE__ */ jsx18("code", { children: "H0" }),
          ", ordered features ",
          /* @__PURE__ */ jsx18("code", { children: "[F0,F1,F2]" }),
          " and rank 2. Configure a future rank-1 fit, but provide negative or nonfinite fitting input so it is rejected. What should a valid later query return? What should an empty query's shape be? How should a public-library wrapper provide the same publication boundary?"
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx18(Prose, { children: "Future configuration is not fitted state. Publish all candidate factors and metadata together only after every check succeeds." })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "The failed fit raises and preserves the entire previous dictionary, fitted feature order, rank and associated diagnostics/solver settings. A valid nonempty query still returns two amounts; a valid empty row batch has shape ",
            /* @__PURE__ */ jsx18("code", { children: "(0,2)" }),
            ". Changing ",
            /* @__PURE__ */ jsx18("code", { children: "n_components" }),
            " for the next fit cannot resize a query against the old two-row dictionary. Supplied feature order must still match ",
            /* @__PURE__ */ jsx18("code", { children: "[F0,F1,F2]" }),
            ". The ",
            /* @__PURE__ */ jsx18("code", { children: "CoordinateNMF" }),
            " implementation in \xA76 uses one snapshot publication point; the ordinary ",
            /* @__PURE__ */ jsx18("code", { children: "PublishedNMF" }),
            " adapter in \xA710 fits a ",
            /* @__PURE__ */ jsx18("strong", { children: "fresh candidate estimator" }),
            ", checks its state, then replaces its previous snapshot. Directly mutating/refitting one public estimator is not claimed to provide that rollback contract. The saved foundation/lifecycle checks actually cover rejected candidates, old-rank queries and feature-order preservation; no new fit is required to restate their meaning."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Keep old ",
            /* @__PURE__ */ jsx18("code", { children: "H" }),
            " but publish new rank or feature metadata first, or assume the third-party estimator itself promises transactional rollback."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Name the complete preserved snapshot, both query shapes/feature constraints and the fresh-candidate publication strategy."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "W", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice W: refuse a changed objective masquerading as the original" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " Evaluate generalized KL for observed 0/predicted 2, then observed 1/predicted 0. Consider IS for observed 0/predicted 2. What should happen if finite inputs overflow a required reduction during a new fit?"
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx18(Prose, { children: "Use each loss's stated limit/domain. Adding an arbitrary epsilon changes its input and objective." })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsx18(Prose, { children: "The generalized-KL zero-count term is its predicted rate, so the first loss is 2. A positive observation with zero predicted rate has infinite divergence; the supported finite route refuses it. IS in this lesson requires strictly positive observations and predictions; its observed-zero case is outside that domain and is refused. Finite entries alone do not imply finite products or reductions. If a required new candidate computation overflows, raise with a rescaling explanation and preserve an already fitted snapshot instead of publishing nonfinite factors or silently replacing the requested objective. A deliberately smoothed model can be valid, but must be named, justified and evaluated as that changed model." }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Floor every zero, continue and report the value as the original KL/IS problem."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Give the finite/infinite/domain outcomes and atomic finite-arithmetic refusal, without inventing a solver output."
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("section", { className: "nmf-practice", "data-lesson-exercise": "X", children: [
        /* @__PURE__ */ jsx18(H3, { children: "Practice X: distinguish an address map from lost phase" }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Task." }),
          " For \xA718's ",
          /* @__PURE__ */ jsx18("code", { children: "a=[1,2]" }),
          ", ",
          /* @__PURE__ */ jsx18("code", { children: "b=[1,0]" }),
          ", ",
          /* @__PURE__ */ jsx18("code", { children: "c=[1,3]" }),
          ", find tensor address ",
          /* @__PURE__ */ jsx18("code", { children: "(1,0,1)" }),
          " and its unfolded matrix address in feature-major/time-minor order. Then invert ",
          /* @__PURE__ */ jsx18("code", { children: "[0,1]" }),
          " and ",
          /* @__PURE__ */ jsx18("code", { children: "[0,-1]" }),
          " under the two-sample DFT convention and compare their magnitudes."
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Hint" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "Unfolding uses column ",
            /* @__PURE__ */ jsx18("code", { children: "2*j+t" }),
            "; inverse DFT divides by 2 and its second-sample factor is ",
            /* @__PURE__ */ jsx18("code", { children: "-1" }),
            " for bin 1."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15("details", { children: [
          /* @__PURE__ */ jsx18("summary", { children: "Reasoned solution" }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "The tensor cell is ",
            /* @__PURE__ */ jsx18("code", { children: "2*1*3=6" }),
            ", mapped to matrix row 1, column 1, still 6. Knowing the map permits the rearrangement to be reversed. Both Fourier lists have magnitude ",
            /* @__PURE__ */ jsx18("code", { children: "[0,1]" }),
            ", but inverse samples are ",
            /* @__PURE__ */ jsx18("code", { children: "[0.5,-0.5]" }),
            " and ",
            /* @__PURE__ */ jsx18("code", { children: "[-0.5,0.5]" }),
            ". The phase of their nonzero bin is 0 versus pi. Removing that phase destroys information rather than merely reordering cells; the common magnitude cannot select a unique original waveform."
          ] }),
          /* @__PURE__ */ jsxs15(Prose, { children: [
            "",
            /* @__PURE__ */ jsx18("strong", { children: "Tempting wrong route." }),
            " Exchange feature/time addressing without declaring a map, or infer identical waveforms from identical magnitudes."
          ] })
        ] }),
        /* @__PURE__ */ jsxs15(Prose, { children: [
          "",
          /* @__PURE__ */ jsx18("strong", { children: "Success check." }),
          " Supply the index map, both explicit inverse sums and the different information roles."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs15("section", { className: "lesson-ending", "data-lesson-ending": "files", children: [
      /* @__PURE__ */ jsx18(H3, { children: "Files for the worked implementations" }),
      /* @__PURE__ */ jsx18(Prose, { children: "The full code bodies appear beside their explanations, with the same Copy/Download actions as this index. Keep their supplied filenames if running the examples together: the imports are real reuse of earlier explained implementations. The numerical examples were checked with Python 3.12.14, NumPy 2.3.5, SciPy 1.18.1 and scikit-learn 1.9.1; inspect warning/diagnostic output in your environment rather than expecting bit-identical arbitrary factors. No file installs packages or downloads a dataset automatically." }),
      /* @__PURE__ */ jsx18(Table, { caption: "Files for the worked implementations", headers: [/* @__PURE__ */ jsx18(Fragment9, { children: "File" }), /* @__PURE__ */ jsx18(Fragment9, { children: "What it supplies" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Teaching and execution role" })], rows: [[/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "centered_pca.py" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "centered_pca.py" }),
        ""
      ] }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "Unchanged ",
        /* @__PURE__ */ jsx18("code", { children: "real_table" }),
        " validation sibling from the PCA lesson"
      ] }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "https://ronak.sh/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#4-fit-once-project-and-reconstruct-in-python", children: "PCA \xA74" }),
        "; no PCA centering or PCA fit is imported into NMF initialization."
      ] })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "nmf_arrays.py" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "nmf_arrays.py" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Finite/nonnegative shaped arrays, reconstruction, explicit metrics, weighted errors, KL and projected gradients" }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "#3-measure-the-disagreement-before-choosing-a-loss", children: "Measure the disagreement" }),
        "; new foundation program/output."
      ] })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "nmf_coordinate.py" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "nmf_coordinate.py" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Cached cyclic coordinate blocks, held-dictionary encoding and coherent fitted CD snapshots" }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "#4-encode-a-new-row-with-the-dictionary-held-fixed", children: "Encode a new row" }),
        ", ",
        /* @__PURE__ */ jsx18("a", { href: "#5-change-one-coordinate-then-reuse-the-arithmetic", children: "coordinates" }),
        ", ",
        /* @__PURE__ */ jsx18("a", { href: "#6-fit-both-factors-and-decide-when-to-stop", children: "fitting/stopping" }),
        "; new bounded program/output."
      ] })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "nmf_nnls.py" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "nmf_nnls.py" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Public SciPy NNLS fixed-H route with transposed design and residual norms" }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "#4-encode-a-new-row-with-the-dictionary-held-fixed", children: "Encode a new row" }),
        "; constrained numerical reference, not private sklearn code."
      ] })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "nmf_multiplicative.py" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "nmf_multiplicative.py" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Explicit Frobenius/KL multiplicative algorithm and coherent finite state" }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "#7-explain-the-multiplicative-route", children: "Explain the multiplicative route" }),
        "; its qualified corrected KL demonstration is separate from the retained original stream."
      ] })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "nmf_beta_mm.py" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "nmf_beta_mm.py" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Supported beta-divergence/MM branches, domains and convergence diagnostics" }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "#8-why-the-upper-bound-gives-a-safe-step", children: "Why the upper bound gives a safe step" }),
        "; complete new algorithm/output, no claim the scalar Frobenius proof proves every beta case."
      ] })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "nmf_initialization.py" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "nmf_initialization.py" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Uncentred SVD sign-pair initialization, zero-fill/mean/random variants and public NMF route" }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "#9-initialize-without-silently-importing-pca-centering", children: "Initialize without PCA centering" }),
        "; supplied SVD primitive, explicit sign/tie/zero conventions."
      ] })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "ordinary_nmf_lifecycle.py" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "ordinary_nmf_lifecycle.py" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Public CD/Frobenius candidate-estimator publication adapter" }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "#10-use-the-ordinary-tools-deliberately", children: "Use the ordinary tools" }),
        "; new changed-input lifecycle example, not another scratch optimizer."
      ] })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "nmf_penalties_masks.py" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "nmf_penalties_masks.py" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Dimension-scaled penalties and streamed local masked Gram coordinate updates" }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "#11-control-penalties-and-incomplete-observations", children: "Control penalties and incomplete observations" }),
        "; no dense ",
        /* @__PURE__ */ jsx18("code", { children: "n*d*k" }),
        " contribution allocation."
      ] })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "nmf_factor_alignment.py" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "nmf_factor_alignment.py" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Compensated normalization, invariant contribution totals, row interventions and permutation assignment" }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "#12-inspect-an-actual-digit-dictionary-and-contribution", children: "Inspect the digit contribution" }),
        "; core assignment and separately bounded optional global ambiguity audit."
      ] })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "nmf_saved_digits.py" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "nmf_saved_digits.py" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Strict verified loading and descriptive inspection of saved digit arrays" }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "#12-inspect-an-actual-digit-dictionary-and-contribution", children: "Inspect the digit dictionary" }),
        "; no estimator import, no missing-state fallback fit."
      ] })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "nmf_digit_comparison.py" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "nmf_digit_comparison.py" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "New explicitly labelled rank6/seed23 mean/PCA/NMF comparison" }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "#13-separate-a-representation-decision-from-its-evaluation", children: "Evaluate a representation" }),
        "; new train-only study with the declared split, not recovery of missing historical PCA8 factors."
      ] })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "nmf_anchors.py" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "nmf_anchors.py" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Normalized-row residual selection with stable source IDs, QR/NNLS reference routes" }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "#15-when-anchors-help-recover-the-dictionary", children: "When anchors help" }),
        "; exact assumptions/finite tolerance qualification, not a general noisy-recovery guarantee."
      ] })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "nmf_text_spectra.py" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "nmf_text_spectra.py" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Scratch counts/IDF, ordinary and scratch text fitting/queries, exact two-pattern simplex and constrained reference" }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "#16-change-application-assumptions-explicitly", children: "Change applications" }),
        "; new tiny weighted-text and constructed-spectra examples."
      ] })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "nmf_online.py" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "nmf_online.py" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Compact historical-code surrogate with atomic A/B/H state and distinct MiniBatchNMF route" }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "#17-update-as-rows-arrive", children: "Update as rows arrive" }),
        "; new two-arrival example, finite caps and no stored historical row list."
      ] })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "nmf_axis_phase.py" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "nmf_axis_phase.py" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Addressed rank-one/Tucker anatomy and direct/IFFT phase counterexample" }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "#18-keep-extra-axes-and-recognize-what-is-missing", children: "Keep extra axes" }),
        "; finite definitions only, no tensor fitting/audio study."
      ] })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "nmf_step.py" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "nmf_step.py" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Preserved original forty-sweep constructed Frobenius program" }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "#7-explain-the-multiplicative-route", children: "Multiplicative route" }),
        "; original complete source and recorded rounded output retained."
      ] })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "nmf_digits.py" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "nmf_digits.py" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Preserved original eight candidate fits and fixed k8 inspection/baseline experiment" }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "#13-separate-a-representation-decision-from-its-evaluation", children: "Representation evaluation" }),
        "; original source/output retained, no replay implied."
      ] })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "nmf_words.py" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "nmf_words.py" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Preserved original five-document count/KL experiment" }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "#16-change-application-assumptions-explicitly", children: "Application assumptions" }),
        "; original source and recorded rounded factors/output retained."
      ] })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "nmf_saved_state.json" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "nmf_saved_state.json" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Exact descriptive dictionary, 60 reserved amount/observation rows and original reports" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Required by strict saved-array inspection; not a newly fitted model or a claim that historical PCA8 factors were saved." })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "digits-300.csv" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "digits-300.csv" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Same 300 offline rows with source IDs, labels and 64 integer bins" }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "Input to the preserved digit program, strict saved loader and explicitly new controlled comparison; fixed numerical conversion ",
        /* @__PURE__ */ jsx18("code", { children: "/16" }),
        "."
      ] })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("code", { children: "digits-data-provenance.md" }),
        /* @__PURE__ */ jsx18(FileActions, { filename: "digits-data-provenance.md" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Dataset source, subset construction, attribution/license and measurement caveats" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Read before reusing the digit file; labels support subset/split roles rather than becoming NMF features." })]] }),
      /* @__PURE__ */ jsxs15(Prose, { children: [
        "Each worked new program's complete stdout is displayed beside it. The corresponding retained text streams are ",
        /* @__PURE__ */ jsx18("code", { children: "nmf_arrays.stdout.txt" }),
        ", ",
        /* @__PURE__ */ jsx18("code", { children: "nmf_coordinate.stdout.txt" }),
        ", ",
        /* @__PURE__ */ jsx18("code", { children: "nmf_nnls.stdout.txt" }),
        ", ",
        /* @__PURE__ */ jsx18("code", { children: "nmf_multiplicative.stdout.txt" }),
        ", ",
        /* @__PURE__ */ jsx18("code", { children: "nmf_beta_mm.stdout.txt" }),
        ", ",
        /* @__PURE__ */ jsx18("code", { children: "initialization-main.stdout.txt" }),
        ", ",
        /* @__PURE__ */ jsx18("code", { children: "lifecycle-main.stdout.txt" }),
        ", ",
        /* @__PURE__ */ jsx18("code", { children: "penalties-masks-main.stdout.txt" }),
        ", ",
        /* @__PURE__ */ jsx18("code", { children: "nmf_factor_alignment.stdout.txt" }),
        ", ",
        /* @__PURE__ */ jsx18("code", { children: "nmf_saved_digits.stdout.txt" }),
        ", ",
        /* @__PURE__ */ jsx18("code", { children: "nmf_digit_comparison.stdout.txt" }),
        ", ",
        /* @__PURE__ */ jsx18("code", { children: "nmf_anchors.stdout.txt" }),
        ", ",
        /* @__PURE__ */ jsx18("code", { children: "nmf_text_spectra.stdout.txt" }),
        ", ",
        /* @__PURE__ */ jsx18("code", { children: "nmf_online.stdout.txt" }),
        " and ",
        /* @__PURE__ */ jsx18("code", { children: "nmf_axis_phase.stdout.txt" }),
        ". The corrected changed KL demonstration additionally has its own ",
        /* @__PURE__ */ jsx18("code", { children: "positive-kl.stdout.txt" }),
        "; it does not overwrite an earlier stream. Original programs' rounded outputs are the separately labelled blocks accompanying their original code. Empty stderr companions and verification receipts describe the execution evidence; they are not extra learner algorithms. Saved output lets you inspect the exact recorded run without retraining merely to see a figure."
      ] })
    ] }),
    /* @__PURE__ */ jsxs15("section", { className: "lesson-ending", "data-lesson-ending": "further-learning", children: [
      /* @__PURE__ */ jsx18(H3, { children: "Another way to learn these ideas" }),
      /* @__PURE__ */ jsxs15("ul", { children: [
        /* @__PURE__ */ jsxs15("li", { children: [
          "",
          /* @__PURE__ */ jsx18("a", { href: "https://arxiv.org/pdf/1401.5226", children: "Nicolas Gillis, *The Why and How of Nonnegative Matrix Factorization*" }),
          ", a freely accessible survey. After \xA7\xA71\u20136, use its geometry and algorithm discussion to connect additive representations, computational difficulty and optimization. After \xA7\xA714\u201315, its nonuniqueness/nonnegative-rank/separability sections offer a specialist continuation. Matrix algebra and least squares are useful prerequisites; its application examples do not certify source identity in your data."
        ] }),
        /* @__PURE__ */ jsxs15("li", { children: [
          "",
          /* @__PURE__ */ jsx18("a", { href: "https://langvillea.people.cofc.edu/CSDA.pdf", children: "Michael Berry and colleagues, *Algorithms and Applications for Approximate Nonnegative Matrix Factorization*" }),
          ", an accessible author-hosted survey/preprint. After the coordinate/NNLS and initialization sections, use its numerical-method comparisons and text/spectral examples as an alternate route through the same questions. Expect matrix algebra; older software interfaces and timing comparisons are historical, not current performance guidance."
        ] }),
        /* @__PURE__ */ jsxs15("li", { children: [
          "",
          /* @__PURE__ */ jsx18("a", { href: "https://www.kolda.net/publication/TensorReview.pdf", children: "Kolda and Bader, *Tensor Decompositions and Applications*" }),
          ", an accessible specialist survey. For the extension in \xA718, begin with unfolding in \xA72.4 and the CP/Tucker definitions in \xA7\xA73\u20134, after the linked Tensor Algebra foundations. These named sections extend the anatomy; a general nonnegative tensor optimizer requires its own deeper study rather than assuming an NMF update transfers unchanged."
        ] }),
        /* @__PURE__ */ jsxs15("li", { children: [
          "",
          /* @__PURE__ */ jsx18("a", { href: "https://tensorly.org/stable/modules/generated/tensorly.decomposition.non_negative_parafac.html", children: "TensorLy nonnegative CP" }),
          " and ",
          /* @__PURE__ */ jsx18("a", { href: "https://tensorly.org/stable/modules/generated/tensorly.decomposition.non_negative_tucker.html", children: "nonnegative Tucker" }),
          ", practical public API routes for that tensor extension after named axes, component/core meaning and iterative optimization are clear. Check the installed version, initialization, rank dimensions, reconstruction error and returned factor structure; this lesson does not supply an unreported TensorLy fit."
        ] }),
        /* @__PURE__ */ jsxs15("li", { children: [
          "",
          /* @__PURE__ */ jsx18("a", { href: "https://librosa.org/doc/main/api/generated/librosa.stft.html", children: "librosa STFT" }),
          " and ",
          /* @__PURE__ */ jsx18("a", { href: "https://librosa.org/doc/main/api/generated/librosa.griffinlim.html", children: "Griffin\u2013Lim" }),
          ", optional audio-tool exploration after the phase counterexample and Fourier foundations. The linked development 1.0.0 interface may differ from a stable installation. A magnitude approximation and a waveform reconstruction are separate tasks; do not assess auditory source separation using only a magnitude reconstruction number."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs15("section", { className: "lesson-ending", "data-lesson-ending": "references", children: [
      /* @__PURE__ */ jsx18(H3, { children: "Technical references and provenance" }),
      /* @__PURE__ */ jsx18(Prose, { children: "These support particular statements and implementations; they do not replace the local explanations." }),
      /* @__PURE__ */ jsx18(Table, { caption: "Technical references and provenance", headers: [/* @__PURE__ */ jsx18(Fragment9, { children: "Reference" }), /* @__PURE__ */ jsx18(Fragment9, { children: "Relevant question and location" })], rows: [[/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "https://www.cs.cornell.edu/courses/cs6241/2020sp/readings/Lee-Seung-1999-NMF.pdf", children: "Lee and Seung, 1999, *Learning the parts of objects by non-negative matrix factorization*" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Original additive pattern/amount interpretation and examples; useful historical origin, not a universal \u201Ctrue parts\u201D guarantee." })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "https://papers.nips.cc/paper_files/paper/2000/file/f9d1152547c0bde01830b7e8bd60024c-Paper.pdf", children: "Lee and Seung, 2000, *Algorithms for Non-negative Matrix Factorization*" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Frobenius auxiliary-function/descent argument and generalized-KL multiplicative update, transposed here to row observations. Positive-interior proof conditions matter." })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "https://www.csie.ntu.edu.tw/~cjlin/papers/multconv.pdf", children: "Lin, 2007, *On the Convergence of Multiplicative Update Algorithms for Nonnegative Matrix Factorization*" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Boundary stationarity/zero-lock issue and why unchanged multiplicative factors need not be KKT stationary; the modified-update analysis is distinct from this lesson's CD route." })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "https://arxiv.org/pdf/1010.1763", children: "F\xE9votte and Idier, *Algorithms for nonnegative matrix factorization with the beta-divergence*" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Divergence definitions, gain behavior, actual MM update exponent in Eq.38/Table2, and the difference from an unqualified exponent-one heuristic." })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "https://user.it.uu.se/~milga730/histo/before2011august/Boutsidis.pdf", children: "Boutsidis and Gallopoulos, NNDSVD treatment" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Sign/support argument, paired norm selection, construction table and fill variants; an initialization strategy rather than a global-quality guarantee." })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "https://arxiv.org/pdf/1208.1237", children: "Gillis and Vavasis, *Fast and Robust Recursive Algorithms for Separable Nonnegative Matrix Factorization*" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Algorithm1, row/column normalization after transpose, full-rank/separability assumptions and exact recovery argument. Noisy recovery has additional hypotheses/bounds beyond our finite examples." })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "https://jmlr.org/papers/volume11/mairal10a/mairal10a.pdf", children: "Mairal, Bach, Ponce and Sapiro, *Online Learning for Matrix Factorization and Sparse Coding*" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Algorithms1\u20132's stored-code statistics/dictionary surrogate and \xA75.3's nonnegative variant. Their stochastic/asymptotic analysis is not inherited by a bounded finite stream." })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.NMF.html", children: "scikit-learn NMF" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Current public configuration, solver/loss compatibility, initialization, dimension-scaled penalties, fitted shapes and held-dictionary transform. The inspected/executed version is 1.9.1." })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.MiniBatchNMF.html", children: "scikit-learn MiniBatchNMF" }),
        ""
      ] }), /* @__PURE__ */ jsxs15(Fragment9, { children: [
        "Incremental ",
        /* @__PURE__ */ jsx18("code", { children: "partial_fit" }),
        ", fitted ",
        /* @__PURE__ */ jsx18("code", { children: "components_/n_steps_" }),
        ", query transform, retention and fresh-restart controls; a distinct optimizer from the scratch A/B recurrence."
      ] })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.nnls.html", children: "SciPy NNLS" }),
        ", ",
        /* @__PURE__ */ jsx18("a", { href: "https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.linear_sum_assignment.html", children: "linear assignment" }),
        ", ",
        /* @__PURE__ */ jsx18("a", { href: "https://docs.scipy.org/doc/scipy/reference/optimize.minimize-slsqp.html", children: "SLSQP" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Public fixed-H constrained least squares, pattern permutation assignment and the separately constrained simplex diagnostic. SciPy 1.18.1 execution; current manual pages may carry 1.18.0 labels." })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.CountVectorizer.html", children: "CountVectorizer" }),
        ", ",
        /* @__PURE__ */ jsx18("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfTransformer.html", children: "TfidfTransformer" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Fixed vocabulary/tokenization, sparse word counts, smoothed training IDF and explicit no-row-normalization convention." })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "https://numpy.org/doc/stable/reference/generated/numpy.linalg.qr.html", children: "NumPy reduced QR" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Public span/projection primitive used to independently check the anchor residuals. Current online manual may be newer than the executed NumPy 2.3.5 environment." })], [/* @__PURE__ */ jsxs15(Fragment9, { children: [
        "",
        /* @__PURE__ */ jsx18("a", { href: "https://archive.ics.uci.edu/dataset/80/optical+recognition+of+handwritten+digits", children: "UCI Optical Recognition of Handwritten Digits" }),
        ", ",
        /* @__PURE__ */ jsx18("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_digits.html", children: "scikit-learn load_digits" }),
        ""
      ] }), /* @__PURE__ */ jsx18(Fragment9, { children: "Dataset origin/attribution and the supplied integer 8\xD78/64-feature measurements. The local provenance file governs this fixed subset; no additional dataset download is required." })]] })
    ] }),
    /* @__PURE__ */ jsxs15("section", { className: "lesson-ending", "data-lesson-ending": "next", children: [
      /* @__PURE__ */ jsx18(H3, { children: "Readiness and the next question" }),
      /* @__PURE__ */ jsx18(Prose, { children: "The core mechanism is a nonnegative sum of complete patterns. Holding one factor fixed gives a constrained convex block; alternating both factors introduces initialization, stopping and nonuniqueness questions. The objective, observation mask and penalty determine what \u201Cbetter\u201D means. A saved contribution explains the current product; it does not by itself identify a physical cause. Training-derived feature rules, held-out evaluation and coherent fitted state make those calculations usable." }),
      /* @__PURE__ */ jsx18(Prose, { children: "Before moving on, try explaining one changed row without looking at a solution: trace its two addends; choose and compute a loss with its domain; take a coordinate step and test its boundary gradient; encode it with a frozen dictionary; and name what evidence would justify its interpretation. For a programming readiness check, implement a small changed-input route using the supplied kernels, compare independent reconstruction/objective or NNLS/KKT conditions, and deliberately reject a bad shape/order/overflow candidate while preserving a valid fitted query. Explain a counterexample\u2014zero lock, nonnegative-rank gap, stale statistics or lost phase\u2014in your own words. If the explanation fails at one transition, return to that named section rather than treating a checked exercise as universal mastery." }),
      /* @__PURE__ */ jsxs15(Prose, { children: [
        "The next curriculum topic is ",
        /* @__PURE__ */ jsx18("a", { href: "https://ronak.sh/learn/path/full-curriculum/feature-scaling-encoding-imputation?module=classical-ml#5-learn-the-preparation-rule-without-looking-ahead", children: "Feature Scaling, Encoding & Imputation" }),
        ". It follows because our fixed ",
        /* @__PURE__ */ jsx18("code", { children: "/16" }),
        " ruler, trained IDF and observation masks already showed how representation and available information affect a model. It broadens those preparation decisions into train-only rules and pipelines; it is not a prerequisite we silently assumed for this lesson. For a specialist branch, choose one justified question\u2014noisy separability, structured penalties, physically validated unmixing, general tensor fitting or phase-aware audio reconstruction\u2014and revisit its assumptions, numerical objective and evaluation evidence before extending the algorithm."
      ] })
    ] })
  ] });
}
var nmf_lesson_default = { title: "Non-Negative Matrix Factorization (NMF)", readTime: "~120 min core reading \xB7 code and practice in separate sittings", hasIntegratedGuide: true, content: NmfLesson };
export {
  Pixels,
  figures,
  nmf_lesson_default as lesson,
  savedRow
};
