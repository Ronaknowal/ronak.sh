// docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/runtime-preview/preparation-lesson.jsx
import React6 from "react";

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

// docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/runtime-preview/Drawing.jsx
import React, { useId as useId2 } from "react";
import { jsx as jsx8, jsxs as jsxs6 } from "react/jsx-runtime";
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
function Figure({
  id,
  children,
  caption
}) {
  return /* @__PURE__ */ jsxs6("figure", { className: "prep-figure", "data-drawing-id": id, "aria-label": caption, children: [
    children,
    /* @__PURE__ */ jsxs6("figcaption", { children: [
      /* @__PURE__ */ jsx8("span", { className: "prep-id", children: id }),
      " ",
      caption
    ] })
  ] });
}
function Table({
  headers,
  rows,
  caption,
  label
}) {
  return /* @__PURE__ */ jsx8("div", { className: "prep-table-scroll", tabIndex: 0, role: "region", "aria-label": caption || label || "Complete values; scroll horizontally when needed", children: /* @__PURE__ */ jsxs6("table", { children: [
    /* @__PURE__ */ jsx8("caption", { children: caption }),
    /* @__PURE__ */ jsx8("thead", { children: /* @__PURE__ */ jsx8("tr", { children: headers.map((header, i) => /* @__PURE__ */ jsx8("th", { scope: "col", children: header }, i)) }) }),
    /* @__PURE__ */ jsx8("tbody", { children: rows.map((row, i) => /* @__PURE__ */ jsx8("tr", { children: row.map((value, j) => /* @__PURE__ */ jsx8("td", { children: typeof value === "number" || value === null || value === void 0 ? fmt(value) : value }, j)) }, i)) })
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
  return /* @__PURE__ */ jsx8("div", { className: "prep-matrix", children: /* @__PURE__ */ jsx8(Table, { caption: label, headers: ["Row", ...columns], rows: values.map((row, i) => [/* @__PURE__ */ jsx8("span", { className: highlightRows.includes(i) ? "prep-selected" : "", children: rowLabels?.[i] ?? i }), ...row.map((value, j) => /* @__PURE__ */ jsxs6("span", { className: `prep-cell${missing?.[i]?.[j] || value === null ? " prep-cell--estimated" : ""}${highlightRows.includes(i) ? " prep-cell--selected" : ""}`, children: [
    React.isValidElement(value) ? value : fmt(value),
    missing?.[i]?.[j] && value !== null ? /* @__PURE__ */ jsx8("span", { className: "prep-cell-note", children: "filled" }) : null
  ] }))]) }) });
}
function Cells({
  values,
  names,
  mask,
  label
}) {
  return /* @__PURE__ */ jsx8("div", { className: "prep-cells", "aria-label": label, children: values.map((value, i) => /* @__PURE__ */ jsxs6("div", { className: mask?.[i] ? "prep-coordinate prep-cell--estimated" : "prep-coordinate", children: [
    /* @__PURE__ */ jsx8("span", { children: names?.[i] ?? `coordinate ${i}` }),
    /* @__PURE__ */ jsx8("strong", { children: fmt(value) }),
    mask?.[i] ? /* @__PURE__ */ jsx8("small", { children: "originally missing" }) : null
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
  const marker = useId2().replaceAll(":", "");
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
  return /* @__PURE__ */ jsxs6("div", { className: "prep-plot", children: [
    /* @__PURE__ */ jsxs6("p", { className: "prep-axis-labels", children: [
      /* @__PURE__ */ jsxs6("span", { children: [
        "Horizontal: ",
        xLabel
      ] }),
      /* @__PURE__ */ jsxs6("span", { children: [
        "Vertical: ",
        yLabel
      ] })
    ] }),
    /* @__PURE__ */ jsxs6("svg", { viewBox: "0 0 440 398", role: "img", "aria-label": label, children: [
      /* @__PURE__ */ jsx8("defs", { children: /* @__PURE__ */ jsx8("marker", { id: marker, viewBox: "0 0 10 10", refX: "9", refY: "5", markerWidth: "6", markerHeight: "6", orient: "auto-start-reverse", children: /* @__PURE__ */ jsx8("path", { d: "M0 0 L10 5 L0 10 Z", fill: "context-stroke" }) }) }),
      ticks(xmin, xmax).map((value) => /* @__PURE__ */ jsxs6("g", { children: [
        /* @__PURE__ */ jsx8("line", { x1: x(value), x2: x(value), y1: top, y2: bottom, className: "prep-grid" }),
        /* @__PURE__ */ jsx8("text", { x: x(value), y: bottom + 24, textAnchor: "middle", children: fmt(value, 3) })
      ] }, `x${value}`)),
      ticks(ymin, ymax).map((value) => /* @__PURE__ */ jsxs6("g", { children: [
        /* @__PURE__ */ jsx8("line", { x1: left, x2: right, y1: y(value), y2: y(value), className: "prep-grid" }),
        /* @__PURE__ */ jsx8("text", { x: left - 8, y: y(value) + 5, textAnchor: "end", children: fmt(value, 3) })
      ] }, `y${value}`)),
      /* @__PURE__ */ jsx8("line", { x1: left, x2: right, y1: y(Math.min(ymax, Math.max(ymin, 0))), y2: y(Math.min(ymax, Math.max(ymin, 0))), stroke: ink.axis }),
      /* @__PURE__ */ jsx8("line", { x1: x(Math.min(xmax, Math.max(xmin, 0))), x2: x(Math.min(xmax, Math.max(xmin, 0))), y1: top, y2: bottom, stroke: ink.axis }),
      circles.map((circle, i) => /* @__PURE__ */ jsx8("circle", { cx: x(circle.x || 0), cy: y(circle.y || 0), r: circle.radius / (xmax - xmin) * (right - left), fill: "none", stroke: circle.color || ink.muted, strokeDasharray: "5 5" }, i)),
      paths.map((path, i) => /* @__PURE__ */ jsx8("polyline", { points: path.values.filter((row) => row.every(Number.isFinite)).map(([px, py]) => `${x(px)},${y(py)}`).join(" "), fill: "none", stroke: path.color || ink.query, strokeWidth: path.width || 2, strokeDasharray: path.dashed ? "5 4" : void 0, markerEnd: path.arrow ? `url(#${marker})` : void 0 }, i)),
      points2.map((point, i) => /* @__PURE__ */ jsx8("g", { children: i % 3 === 1 ? /* @__PURE__ */ jsx8("rect", { x: x(point.x) - (point.radius || 5), y: y(point.y) - (point.radius || 5), width: 2 * (point.radius || 5), height: 2 * (point.radius || 5), fill: point.color || ink.query, stroke: "#171719" }) : i % 3 === 2 ? /* @__PURE__ */ jsx8("path", { d: `M${x(point.x)} ${y(point.y) - 7} l7 7 l-7 7 l-7 -7Z`, fill: point.color || ink.query, stroke: "#171719" }) : /* @__PURE__ */ jsx8("circle", { cx: x(point.x), cy: y(point.y), r: point.radius || 5, fill: point.color || ink.query, stroke: "#171719", strokeWidth: "1.5" }) }, i)),
      children?.({
        x,
        y
      })
    ] }),
    points2.some((point) => point.id) ? /* @__PURE__ */ jsx8("ul", { className: "prep-plot-key", children: points2.map((point, i) => point.id ? /* @__PURE__ */ jsxs6("li", { children: [
      /* @__PURE__ */ jsxs6("span", { style: {
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
  colors: colors2 = [],
  marks = []
}) {
  const domainMin = min ?? Math.min(0, ...values, ...marks.map((mark) => mark.value));
  const domainMax = max ?? Math.max(1, ...values, ...marks.map((mark) => mark.value));
  const span = domainMax - domainMin || 1, x = (value) => 38 + (value - domainMin) / span * 364;
  return /* @__PURE__ */ jsxs6("div", { className: "prep-number-line", children: [
    /* @__PURE__ */ jsxs6("svg", { viewBox: "0 0 440 134", role: "img", "aria-label": label, children: [
      /* @__PURE__ */ jsx8("line", { x1: "38", x2: "402", y1: "55", y2: "55", stroke: ink.axis }),
      [domainMin, domainMax].map((value) => /* @__PURE__ */ jsxs6("g", { children: [
        /* @__PURE__ */ jsx8("line", { x1: x(value), x2: x(value), y1: "49", y2: "61", stroke: ink.axis }),
        /* @__PURE__ */ jsx8("text", { x: x(value), y: "88", textAnchor: "middle", children: fmt(value, 4) })
      ] }, value)),
      values.map((value, i) => /* @__PURE__ */ jsx8("circle", { cx: x(value), cy: 55 - values.slice(0, i).filter((old) => old === value).length * 10, r: "4", fill: colors2[i] || ink.A }, i)),
      marks.map((mark, i) => /* @__PURE__ */ jsx8("line", { x1: x(mark.value), x2: x(mark.value), y1: "26", y2: "65", stroke: mark.color || ink.query }, i))
    ] }),
    /* @__PURE__ */ jsx8("p", { className: "prep-axis-labels", children: label }),
    marks.length ? /* @__PURE__ */ jsx8("ul", { className: "prep-plot-key", children: marks.map((mark, i) => /* @__PURE__ */ jsxs6("li", { children: [
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
  return /* @__PURE__ */ jsx8("div", { className: "prep-bars", "aria-label": label, children: rows.map((row, i) => /* @__PURE__ */ jsxs6("div", { className: "prep-bar-row", children: [
    /* @__PURE__ */ jsx8("span", { children: row.name }),
    /* @__PURE__ */ jsx8("div", { className: "prep-bar-track", children: /* @__PURE__ */ jsx8("span", { style: {
      width: `${100 * Math.abs(row.value) / max}%`,
      background: row.color || ink.A
    } }) }),
    /* @__PURE__ */ jsx8("strong", { children: fmt(row.value) })
  ] }, i)) });
}

// docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/runtime-preview/PreparationFigures.jsx
import React4 from "react";

// docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/runtime-preview/CoreFigures.jsx
import React2 from "react";

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
function profile(values, lambda, method = "BC") {
  const mapped = values.map((value) => power(value, lambda, method));
  const variance = mean(mapped.map((value) => (value - mean(mapped)) ** 2));
  if (!(variance > 0)) throw Error("Degenerate transformed variance has no finite profile likelihood.");
  const varianceTerm = -values.length / 2 * Math.log(variance);
  const jacobian = sum(values.map((value) => method === "BC" ? (lambda - 1) * Math.log(value) : (lambda - 1) * Math.sign(value) * Math.log1p(Math.abs(value))));
  return {
    mapped,
    variance,
    varianceTerm,
    jacobian,
    total: varianceTerm + jacobian
  };
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
function splineRow(x, degree = 1) {
  const knots = degree === 1 ? [-1, 0, 1, 2, 3] : [-2, -1, 0, 1, 2, 3, 4];
  function basis(i, order, value) {
    if (order === 0) return Number(knots[i] <= value && value < knots[i + 1]);
    const left = knots[i + order] - knots[i], right = knots[i + order + 1] - knots[i + 1];
    return (left ? (value - knots[i]) / left * basis(i, order - 1, value) : 0) + (right ? (knots[i + order + 1] - value) / right * basis(i + 1, order - 1, value) : 0);
  }
  const at = x === 2 ? 2 - 1e-12 : x;
  return {
    knots,
    row: Array.from({
      length: knots.length - degree - 1
    }, (_, i) => basis(i, degree, at))
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
function applyConditional(query, state) {
  let current = query.map((value, j) => value === null ? state.medians[j] : value);
  const rows = [current];
  for (const model of state.trace) {
    current = current.map((value, j) => j === model.target && query[j] === null ? model.intercept + model.coefficient * current[model.other] : value);
    rows.push(current);
  }
  return rows;
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
var completionQ = [10.852494, 7.397295, 9.859663];
var completionU = [0.966187, 2.940335, 0.423083];
var sensitivity = (delta) => 8.686461347735442 + 0.4 * delta;

// docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/runtime-preview/saved-data.js
var saved = { "environment": { "python": "3.12.14", "numpy": "2.3.5", "pandas": "3.0.1", "sklearn": "1.9.1" }, "data_sha256": "f204db2c753b0937caac3cb35258562c14f073e4bbc76be24b4c51ce22767a93", "missing_counts": { "species": 0, "island": 0, "bill_length_mm": 2, "bill_depth_mm": 2, "flipper_length_mm": 2, "body_mass_g": 2, "sex": 11, "year": 0 }, "splits": { "train": [214, 177, 230, 111, 52, 327, 13, 97, 50, 266, 85, 201, 179, 296, 329, 151, 235, 80, 116, 136, 89, 175, 331, 197, 81, 154, 293, 233, 35, 0, 124, 33, 228, 288, 236, 314, 55, 96, 129, 130, 260, 279, 20, 172, 56, 155, 205, 342, 150, 240, 272, 132, 268, 300, 93, 134, 202, 8, 218, 304, 239, 241, 165, 261, 317, 338, 128, 332, 2, 306, 280, 57, 11, 234, 195, 232, 117, 19, 60, 181, 9, 92, 171, 73, 121, 340, 289, 302, 208, 1, 184, 115, 252, 27, 161, 276, 341, 180, 209, 301, 76, 47, 67, 53, 282, 310, 44, 138, 263, 322, 139, 38, 51, 64, 108, 114, 274, 292, 107, 68, 133, 182, 215, 28, 63, 14, 229, 135, 45, 140, 213, 246, 245, 23, 173, 103, 284, 320, 323, 211, 153, 65, 70, 109, 254, 58, 37, 337, 21, 54, 123, 12, 168, 290, 106, 143, 324, 256, 95, 217, 144, 325, 122, 41, 146, 48, 277, 66, 39, 222, 156, 227, 199, 49, 5, 224, 100, 255, 321, 316, 86, 264, 250, 69, 194, 4, 74, 158, 336, 198, 269, 78, 31, 339, 94, 226, 333, 273, 312, 253, 281, 257, 91, 36, 242, 160, 152, 46, 62, 219, 335, 196, 220, 286, 174, 225, 187, 265, 294, 186, 87, 183, 330, 30, 285, 193, 185, 166, 34, 164, 328, 275, 72, 98, 311, 159, 84, 24, 259, 29, 343, 212, 125, 119, 248, 42, 203, 82, 295, 88, 113, 112, 192, 258, 176, 305, 104, 102], "test": [309, 318, 243, 334, 77, 207, 126, 221, 206, 170, 99, 149, 231, 326, 105, 61, 131, 283, 313, 188, 271, 3, 204, 83, 17, 191, 10, 137, 59, 251, 142, 26, 145, 79, 308, 249, 167, 278, 287, 178, 163, 141, 299, 270, 169, 25, 32, 200, 16, 262, 15, 244, 189, 43, 307, 110, 147, 303, 297, 291, 118, 238, 71, 267, 127, 298, 162, 120, 315, 40, 237, 319, 157, 247, 6, 223, 75, 210, 18, 101, 216, 90, 148, 7, 22, 190] }, "results": [{ "method": "raw", "accuracy": 0.7790697674418605, "correct": 67, "confusion": [[32, 1, 5], [9, 7, 1], [3, 0, 28]] }, { "method": "standard", "accuracy": 0.9767441860465116, "correct": 84, "confusion": [[37, 1, 0], [0, 17, 0], [0, 1, 30]] }, { "method": "minmax", "accuracy": 0.9883720930232558, "correct": 85, "confusion": [[38, 0, 0], [0, 17, 0], [1, 0, 30]] }, { "method": "robust", "accuracy": 0.9883720930232558, "correct": 85, "confusion": [[38, 0, 0], [0, 17, 0], [1, 0, 30]] }], "baseline_accuracy": 0.4418604651162791, "scaled_inspection": { "feature_names": ["numeric__bill_length_mm", "numeric__bill_depth_mm", "numeric__flipper_length_mm", "numeric__body_mass_g", "category__sex_female", "category__sex_male", "category__sex_not_recorded"], "train_medians": [45, 17.3, 197, 4e3], "mean": [43.93062015503876, 17.09922480620155, 200.65891472868216, 4190.988372093023], "scale": [5.400031618043809, 1.9387119564900213, 14.230655916521705, 806.6875829303058], "test_source_rows": [309, 318, 243, 334, 77, 207, 126, 221, 206, 170, 99, 149, 231, 326, 105, 61, 131, 283, 313, 188, 271, 3, 204, 83, 17, 191, 10, 137, 59, 251, 142, 26, 145, 79, 308, 249, 167, 278, 287, 178, 163, 141, 299, 270, 169, 25, 32, 200, 16, 262, 15, 244, 189, 43, 307, 110, 147, 303, 297, 291, 118, 238, 71, 267, 127, 298, 162, 120, 315, 40, 237, 319, 157, 247, 6, 223, 75, 210, 18, 101, 216, 90, 148, 7, 22, 190], "raw_test": [{ "bill_length_mm": 51, "bill_depth_mm": 18.8, "flipper_length_mm": 203, "body_mass_g": 4100, "sex": "male" }, { "bill_length_mm": 50.9, "bill_depth_mm": 19.1, "flipper_length_mm": 196, "body_mass_g": 3550, "sex": "male" }, { "bill_length_mm": 52.2, "bill_depth_mm": 17.1, "flipper_length_mm": 228, "body_mass_g": 5400, "sex": "male" }, { "bill_length_mm": 50.2, "bill_depth_mm": 18.8, "flipper_length_mm": 202, "body_mass_g": 3800, "sex": "male" }, { "bill_length_mm": 37.2, "bill_depth_mm": 19.4, "flipper_length_mm": 184, "body_mass_g": 3900, "sex": "male" }, { "bill_length_mm": 45, "bill_depth_mm": 15.4, "flipper_length_mm": 220, "body_mass_g": 5050, "sex": "male" }, { "bill_length_mm": 38.8, "bill_depth_mm": 17.6, "flipper_length_mm": 191, "body_mass_g": 3275, "sex": "female" }, { "bill_length_mm": 50.7, "bill_depth_mm": 15, "flipper_length_mm": 223, "body_mass_g": 5550, "sex": "male" }, { "bill_length_mm": 46.5, "bill_depth_mm": 14.4, "flipper_length_mm": 217, "body_mass_g": 4900, "sex": "female" }, { "bill_length_mm": 46.2, "bill_depth_mm": 14.5, "flipper_length_mm": 209, "body_mass_g": 4800, "sex": "female" }, { "bill_length_mm": 43.2, "bill_depth_mm": 18.5, "flipper_length_mm": 192, "body_mass_g": 4100, "sex": "male" }, { "bill_length_mm": 37.8, "bill_depth_mm": 18.1, "flipper_length_mm": 193, "body_mass_g": 3750, "sex": "male" }, { "bill_length_mm": 45.2, "bill_depth_mm": 16.4, "flipper_length_mm": 223, "body_mass_g": 5950, "sex": "male" }, { "bill_length_mm": 48.1, "bill_depth_mm": 16.4, "flipper_length_mm": 199, "body_mass_g": 3325, "sex": "female" }, { "bill_length_mm": 39.7, "bill_depth_mm": 18.9, "flipper_length_mm": 184, "body_mass_g": 3550, "sex": "male" }, { "bill_length_mm": 41.3, "bill_depth_mm": 21.1, "flipper_length_mm": 195, "body_mass_g": 4400, "sex": "male" }, { "bill_length_mm": 43.1, "bill_depth_mm": 19.2, "flipper_length_mm": 197, "body_mass_g": 3500, "sex": "male" }, { "bill_length_mm": 51.3, "bill_depth_mm": 18.2, "flipper_length_mm": 197, "body_mass_g": 3750, "sex": "male" }, { "bill_length_mm": 52, "bill_depth_mm": 20.7, "flipper_length_mm": 210, "body_mass_g": 4800, "sex": "male" }, { "bill_length_mm": 42.6, "bill_depth_mm": 13.7, "flipper_length_mm": 213, "body_mass_g": 4950, "sex": "female" }, { "bill_length_mm": null, "bill_depth_mm": null, "flipper_length_mm": null, "body_mass_g": null, "sex": null }, { "bill_length_mm": null, "bill_depth_mm": null, "flipper_length_mm": null, "body_mass_g": null, "sex": null }, { "bill_length_mm": 45.1, "bill_depth_mm": 14.4, "flipper_length_mm": 210, "body_mass_g": 4400, "sex": "female" }, { "bill_length_mm": 35.1, "bill_depth_mm": 19.4, "flipper_length_mm": 193, "body_mass_g": 4200, "sex": "male" }, { "bill_length_mm": 42.5, "bill_depth_mm": 20.7, "flipper_length_mm": 197, "body_mass_g": 4500, "sex": "male" }, { "bill_length_mm": 48.7, "bill_depth_mm": 15.7, "flipper_length_mm": 208, "body_mass_g": 5350, "sex": "male" }, { "bill_length_mm": 37.8, "bill_depth_mm": 17.1, "flipper_length_mm": 186, "body_mass_g": 3300, "sex": null }, { "bill_length_mm": 40.2, "bill_depth_mm": 20.1, "flipper_length_mm": 200, "body_mass_g": 3975, "sex": "male" }, { "bill_length_mm": 37.6, "bill_depth_mm": 19.1, "flipper_length_mm": 194, "body_mass_g": 3750, "sex": "male" }, { "bill_length_mm": 51.1, "bill_depth_mm": 16.5, "flipper_length_mm": 225, "body_mass_g": 5250, "sex": "male" }, { "bill_length_mm": 32.1, "bill_depth_mm": 15.5, "flipper_length_mm": 188, "body_mass_g": 3050, "sex": "female" }, { "bill_length_mm": 40.6, "bill_depth_mm": 18.6, "flipper_length_mm": 183, "body_mass_g": 3550, "sex": "male" }, { "bill_length_mm": 39, "bill_depth_mm": 18.7, "flipper_length_mm": 185, "body_mass_g": 3650, "sex": "male" }, { "bill_length_mm": 42.1, "bill_depth_mm": 19.1, "flipper_length_mm": 195, "body_mass_g": 4e3, "sex": "male" }, { "bill_length_mm": 42.5, "bill_depth_mm": 16.7, "flipper_length_mm": 187, "body_mass_g": 3350, "sex": "female" }, { "bill_length_mm": 46.9, "bill_depth_mm": 14.6, "flipper_length_mm": 222, "body_mass_g": 4875, "sex": "female" }, { "bill_length_mm": 49.3, "bill_depth_mm": 15.7, "flipper_length_mm": 217, "body_mass_g": 5850, "sex": "male" }, { "bill_length_mm": 51.3, "bill_depth_mm": 19.2, "flipper_length_mm": 193, "body_mass_g": 3650, "sex": "male" }, { "bill_length_mm": 51.7, "bill_depth_mm": 20.3, "flipper_length_mm": 194, "body_mass_g": 3775, "sex": "male" }, { "bill_length_mm": 44.5, "bill_depth_mm": 14.3, "flipper_length_mm": 216, "body_mass_g": 4100, "sex": null }, { "bill_length_mm": 49, "bill_depth_mm": 16.1, "flipper_length_mm": 216, "body_mass_g": 5550, "sex": "male" }, { "bill_length_mm": 40.6, "bill_depth_mm": 17.2, "flipper_length_mm": 187, "body_mass_g": 3475, "sex": "male" }, { "bill_length_mm": 50.6, "bill_depth_mm": 19.4, "flipper_length_mm": 193, "body_mass_g": 3800, "sex": "male" }, { "bill_length_mm": 47.2, "bill_depth_mm": 13.7, "flipper_length_mm": 214, "body_mass_g": 4925, "sex": "female" }, { "bill_length_mm": 49.2, "bill_depth_mm": 15.2, "flipper_length_mm": 221, "body_mass_g": 6300, "sex": "male" }, { "bill_length_mm": 35.3, "bill_depth_mm": 18.9, "flipper_length_mm": 187, "body_mass_g": 3800, "sex": "female" }, { "bill_length_mm": 39.5, "bill_depth_mm": 17.8, "flipper_length_mm": 188, "body_mass_g": 3300, "sex": "female" }, { "bill_length_mm": 44.9, "bill_depth_mm": 13.3, "flipper_length_mm": 213, "body_mass_g": 5100, "sex": "female" }, { "bill_length_mm": 38.7, "bill_depth_mm": 19, "flipper_length_mm": 195, "body_mass_g": 3450, "sex": "female" }, { "bill_length_mm": 50.5, "bill_depth_mm": 15.2, "flipper_length_mm": 216, "body_mass_g": 5e3, "sex": "female" }, { "bill_length_mm": 36.6, "bill_depth_mm": 17.8, "flipper_length_mm": 185, "body_mass_g": 3700, "sex": "female" }, { "bill_length_mm": 45.5, "bill_depth_mm": 14.5, "flipper_length_mm": 212, "body_mass_g": 4750, "sex": "female" }, { "bill_length_mm": 44.4, "bill_depth_mm": 17.3, "flipper_length_mm": 219, "body_mass_g": 5250, "sex": "male" }, { "bill_length_mm": 44.1, "bill_depth_mm": 19.7, "flipper_length_mm": 196, "body_mass_g": 4400, "sex": "male" }, { "bill_length_mm": 54.2, "bill_depth_mm": 20.8, "flipper_length_mm": 201, "body_mass_g": 4300, "sex": "male" }, { "bill_length_mm": 38.1, "bill_depth_mm": 16.5, "flipper_length_mm": 198, "body_mass_g": 3825, "sex": "female" }, { "bill_length_mm": 36.6, "bill_depth_mm": 18.4, "flipper_length_mm": 184, "body_mass_g": 3475, "sex": "female" }, { "bill_length_mm": 49.5, "bill_depth_mm": 19, "flipper_length_mm": 200, "body_mass_g": 3800, "sex": "male" }, { "bill_length_mm": 48.5, "bill_depth_mm": 17.5, "flipper_length_mm": 191, "body_mass_g": 3400, "sex": "male" }, { "bill_length_mm": 50.5, "bill_depth_mm": 19.6, "flipper_length_mm": 201, "body_mass_g": 4050, "sex": "male" }, { "bill_length_mm": 35.7, "bill_depth_mm": 17, "flipper_length_mm": 189, "body_mass_g": 3350, "sex": "female" }, { "bill_length_mm": 43.4, "bill_depth_mm": 14.4, "flipper_length_mm": 218, "body_mass_g": 4600, "sex": "female" }, { "bill_length_mm": 39.7, "bill_depth_mm": 18.4, "flipper_length_mm": 190, "body_mass_g": 3900, "sex": "male" }, { "bill_length_mm": 55.1, "bill_depth_mm": 16, "flipper_length_mm": 230, "body_mass_g": 5850, "sex": "male" }, { "bill_length_mm": 41.5, "bill_depth_mm": 18.3, "flipper_length_mm": 195, "body_mass_g": 4300, "sex": "male" }, { "bill_length_mm": 43.2, "bill_depth_mm": 16.6, "flipper_length_mm": 187, "body_mass_g": 2900, "sex": "female" }, { "bill_length_mm": 40.9, "bill_depth_mm": 13.7, "flipper_length_mm": 214, "body_mass_g": 4650, "sex": "female" }, { "bill_length_mm": 36.2, "bill_depth_mm": 17.2, "flipper_length_mm": 187, "body_mass_g": 3150, "sex": "female" }, { "bill_length_mm": 53.5, "bill_depth_mm": 19.9, "flipper_length_mm": 205, "body_mass_g": 4500, "sex": "male" }, { "bill_length_mm": 36.5, "bill_depth_mm": 18, "flipper_length_mm": 182, "body_mass_g": 3150, "sex": "female" }, { "bill_length_mm": 50.8, "bill_depth_mm": 17.3, "flipper_length_mm": 228, "body_mass_g": 5600, "sex": "male" }, { "bill_length_mm": 45.5, "bill_depth_mm": 17, "flipper_length_mm": 196, "body_mass_g": 3500, "sex": "female" }, { "bill_length_mm": 46.5, "bill_depth_mm": 13.5, "flipper_length_mm": 210, "body_mass_g": 4550, "sex": "female" }, { "bill_length_mm": 50.8, "bill_depth_mm": 15.7, "flipper_length_mm": 226, "body_mass_g": 5200, "sex": "male" }, { "bill_length_mm": 38.9, "bill_depth_mm": 17.8, "flipper_length_mm": 181, "body_mass_g": 3625, "sex": "female" }, { "bill_length_mm": 46.4, "bill_depth_mm": 15.6, "flipper_length_mm": 221, "body_mass_g": 5e3, "sex": "male" }, { "bill_length_mm": 42.8, "bill_depth_mm": 18.5, "flipper_length_mm": 195, "body_mass_g": 4250, "sex": "male" }, { "bill_length_mm": 43.2, "bill_depth_mm": 14.5, "flipper_length_mm": 208, "body_mass_g": 4450, "sex": "female" }, { "bill_length_mm": 34.4, "bill_depth_mm": 18.4, "flipper_length_mm": 184, "body_mass_g": 3325, "sex": "female" }, { "bill_length_mm": 41, "bill_depth_mm": 20, "flipper_length_mm": 203, "body_mass_g": 4725, "sex": "male" }, { "bill_length_mm": 45.8, "bill_depth_mm": 14.2, "flipper_length_mm": 219, "body_mass_g": 4700, "sex": "female" }, { "bill_length_mm": 35.7, "bill_depth_mm": 18, "flipper_length_mm": 202, "body_mass_g": 3550, "sex": "female" }, { "bill_length_mm": 36, "bill_depth_mm": 17.8, "flipper_length_mm": 195, "body_mass_g": 3450, "sex": "female" }, { "bill_length_mm": 39.2, "bill_depth_mm": 19.6, "flipper_length_mm": 195, "body_mass_g": 4675, "sex": "male" }, { "bill_length_mm": 35.9, "bill_depth_mm": 19.2, "flipper_length_mm": 189, "body_mass_g": 3800, "sex": "female" }, { "bill_length_mm": 44, "bill_depth_mm": 13.6, "flipper_length_mm": 208, "body_mass_g": 4350, "sex": "female" }], "transformed_test": [[1.3091367504848355, 0.877270699293386, 0.16451000467236732, -0.11279257796742845, 0, 1, 0], [1.2906183403951872, 1.0320126138907155, -0.3273858040003055, -0.7945930812082445, 0, 1, 0], [1.5313576715606103, 39984990852050625e-20, 1.9212807499319131, 1.4987358842381366, 0, 1, 0], [1.1609894697676528, 0.877270699293386, 0.09423917486198548, -0.4846837615533281, 0, 1, 0], [-1.2464038418865704, 1.1867545284880434, -1.1706357617248875, -0.3607200336913616, 0, 1, 0], [0.19803214510596306, -0.8764709994763459, 1.3591141114488583, 1.0648628367212538, 0, 1, 0], [-0.9501092804522056, 0.2583030409040693, -0.6787399530522147, -1.1354933328286525, 1, 0, 0], [1.2535815202158922, -1.0827935522727852, 1.569926600880004, 1.6846814760310866, 0, 1, 0], [0.4758082964506811, -1.3922773814674434, 1.148301622017713, 0.8789172449283039, 1, 0, 0], [0.4202530661817381, -1.3406967432683339, 0.5861349835346583, 0.7549535170663374, 1, 0, 0], [-0.1352992365076981, 0.7225287846960563, -0.6084691232418328, -0.11279257796742845, 0, 1, 0], [-1.1352933813486843, 0.516206231899618, -0.538198293431451, -0.5466656254843114, 0, 1, 0], [0.23506896528525933, -0.36066461748524925, 1.569926600880004, 2.180536387478953, 0, 1, 0], [0.7721028578850474, -0.36066461748524925, -0.11657331456916001, -1.0735114688976692, 1, 0, 0], [-0.7834435896453736, 0.9288513374924946, -1.1706357617248875, -0.7945930812082445, 0, 1, 0], [-0.4871490282110087, 2.063625377872911, -0.39765663381068733, 0.2590986056184712, 0, 1, 0], [-0.15381764659734623, 1.0835932520898242, -0.2571149741899237, -0.8565749451392277, 0, 1, 0], [1.3646919807537785, 0.5677868700987267, -0.2571149741899237, -0.5466656254843114, 0, 1, 0], [1.494320851381314, 1.8573028250764705, 0.6564058133450401, 0.7549535170663374, 0, 1, 0], [-0.2464096970455856, -1.7533418488612122, 0.8672183027761856, 0.9408991088592873, 1, 0, 0], [0.19803214510596306, 0.10356112630673965, -0.2571149741899237, -0.236756305829395, 0, 0, 1], [0.19803214510596306, 0.10356112630673965, -0.2571149741899237, -0.236756305829395, 0, 0, 1], [0.2165505551956112, -1.3922773814674434, 0.6564058133450401, 0.2590986056184712, 1, 0, 0], [-1.635290453769176, 1.1867545284880434, -0.538198293431451, 0.011171149894538103, 0, 1, 0], [-0.26492810713523374, 1.8573028250764705, -0.2571149741899237, 0.3830623334804378, 0, 1, 0], [0.8832133184229348, -0.7217290848790172, 0.5158641537242764, 1.4367540203071534, 0, 1, 0], [-1.1352933813486843, 39984990852050625e-20, -1.0300941021041239, -1.1045024008631608, 0, 0, 1], [-0.6908515391971343, 1.5478189958818132, -0.046302484758778184, -0.26774723779488663, 0, 1, 0], [-1.1723302015279793, 1.0320126138907155, -0.4679274636210692, -0.5466656254843114, 0, 1, 0], [1.3276551605744835, -0.30908397928613873, 1.7104682605007675, 1.3127902924451869, 0, 1, 0], [-2.190842756458612, -0.8248903612772364, -0.8895524424833602, -1.4144117205180773, 1, 0, 0], [-0.6167778988385431, 0.7741094228951668, -1.2409065915352693, -0.7945930812082445, 0, 1, 0], [-0.9130724602729092, 0.8256900610942755, -1.1003649319145057, -0.6706293533462779, 0, 1, 0], [-0.33900174749382495, 1.0320126138907155, -0.39765663381068733, -0.236756305829395, 0, 1, 0], [-0.26492810713523374, -0.2059227028879196, -0.959823272293742, -1.0425205369321775, 1, 0, 0], [0.5498819368092723, -1.2891161050692244, 1.4996557710696221, 0.8479263129628123, 1, 0, 0], [0.994323778960821, -0.7217290848790172, 1.148301622017713, 2.056572659616986, 0, 1, 0], [1.3646919807537785, 1.0835932520898242, -0.538198293431451, -0.6706293533462779, 0, 1, 0], [1.438765621112371, 1.6509802722800322, -0.4679274636210692, -0.5156746935188198, 0, 1, 0], [0.1054400946577237, -1.443858019666553, 1.0780307922073311, -0.11279257796742845, 0, 0, 1], [0.938768548691878, -0.515406532082577, 1.0780307922073311, 1.6846814760310866, 0, 1, 0], [-0.6167778988385431, 0.05198048810762916, -0.959823272293742, -0.8875658771047193, 0, 1, 0], [1.2350631101262441, 1.1867545284880434, -0.538198293431451, -0.4846837615533281, 0, 1, 0], [0.6054371670782168, -1.7533418488612122, 0.9374891325865674, 0.9099081768937956, 1, 0, 0], [0.9758053688711742, -0.9796322758745659, 1.4293849412592403, 2.6144094349958356, 0, 1, 0], [-1.598253633589881, 0.9288513374924946, -0.959823272293742, -0.4846837615533281, 1, 0, 0], [-0.8204804098246699, 0.36146431730228845, -0.8895524424833602, -1.1045024008631608, 1, 0, 0], [0.17951373501631493, -1.9596644016576505, 0.8672183027761856, 1.126844700652237, 1, 0, 0], [-0.9686276905418524, 0.9804319756916051, -0.39765663381068733, -0.9185568090702111, 1, 0, 0], [1.216544700036596, -0.9796322758745659, 1.0780307922073311, 1.0028809727902706, 1, 0, 0], [-1.3575143024244578, 0.36146431730228845, -1.1003649319145057, -0.6086474894152947, 1, 0, 0], [0.29062419555420244, -1.3406967432683339, 0.7969474729658038, 0.6929716531353541, 1, 0, 0], [0.08692168456807557, 0.10356112630673965, 1.2888432816384765, 1.3127902924451869, 0, 1, 0], [0.031366454299132485, 1.341496443085373, -0.3273858040003055, 0.2590986056184712, 0, 1, 0], [1.9017258733535678, 1.9088834632755811, 0.023968345051603647, 0.13513487775650465, 0, 1, 0], [-1.07973815107974, -0.30908397928613873, -0.18684414437954183, -0.45369282958783647, 1, 0, 0], [-1.3575143024244578, 0.6709481464969459, -1.1706357617248875, -0.8875658771047193, 1, 0, 0], [1.0313605991401174, 0.9804319756916051, -0.046302484758778184, -0.4846837615533281, 0, 1, 0], [0.8461764982436386, 0.20672240270495879, -0.6787399530522147, -0.9805386730011943, 0, 1, 0], [1.216544700036596, 1.2899158048862644, 0.023968345051603647, -0.17477444189841174, 0, 1, 0], [-1.5241799932312885, -0.05118078829058998, -0.8192816126729783, -1.0425205369321775, 1, 0, 0], [-0.09826241632840314, -1.3922773814674434, 1.2185724518280947, 0.5070260613424044, 1, 0, 0], [-0.7834435896453736, 0.6709481464969459, -0.7490107828625965, -0.3607200336913616, 0, 1, 0], [2.0683915641603985, -0.5669871702816875, 2.0618224095526765, 2.056572659616986, 0, 1, 0], [-0.4501122080317124, 0.6193675082978372, -0.39765663381068733, 0.13513487775650465, 0, 1, 0], [-0.1352992365076981, -0.25750334108702827, -0.959823272293742, -1.600357312311027, 1, 0, 0], [-0.5612226685695999, -1.7533418488612122, 0.9374891325865674, 0.5690079252733876, 1, 0, 0], [-1.4315879427830491, 0.05198048810762916, -0.959823272293742, -1.2904479926561108, 1, 0, 0], [1.772097002726032, 1.4446577194835921, 0.30505166429313096, 0.3830623334804378, 0, 1, 0], [-1.376032712514106, 0.46462559370050754, -1.311177421345651, -1.2904479926561108, 1, 0, 0], [1.2720999303055391, 0.10356112630673965, 1.9212807499319131, 1.74666333996207, 0, 1, 0], [0.29062419555420244, -0.05118078829058998, -0.3273858040003055, -0.8565749451392277, 1, 0, 0], [0.4758082964506811, -1.8565031252594315, 0.6564058133450401, 0.44504419741142104, 1, 0, 0], [1.2720999303055391, -0.7217290848790172, 1.7807390903111493, 1.2508084285142036, 0, 1, 0], [-0.9315908703625574, 0.36146431730228845, -1.3814482511560329, -0.7016202853117696, 1, 0, 0], [0.457289886361033, -0.7733097230781267, 1.4293849412592403, 1.0028809727902706, 0, 1, 0], [-0.20937287686629064, 0.7225287846960563, -0.39765663381068733, 0.07315301382552138, 0, 1, 0], [-0.1352992365076981, -1.3406967432683339, 0.5158641537242764, 0.32108046954945446, 1, 0, 0], [-1.7649193243967116, 0.6709481464969459, -1.1706357617248875, -1.0735114688976692, 1, 0, 0], [-0.5427042584799519, 1.4962383576827027, 0.16451000467236732, 0.6619807211698625, 0, 1, 0], [0.34617942582314554, -1.4954386578656635, 1.2888432816384765, 0.6309897892043709, 1, 0, 0], [-1.5241799932312885, 0.46462559370050754, 0.09423917486198548, -0.7945930812082445, 1, 0, 0], [-1.4686247629623455, 0.36146431730228845, -0.39765663381068733, -0.9185568090702111, 1, 0, 0], [-0.876035640093613, 1.2899158048862644, -0.39765663381068733, 0.5999988572388792, 0, 1, 0], [-1.4871431730519935, 1.0835932520898242, -0.8192816126729783, -0.4846837615533281, 1, 0, 0], [0.01284804420948435, -1.8049224870603218, 0.5158641537242764, 0.19711674168748794, 1, 0, 0]], "predictions": ["Chinstrap", "Chinstrap", "Gentoo", "Chinstrap", "Adelie", "Gentoo", "Adelie", "Gentoo", "Gentoo", "Gentoo", "Adelie", "Adelie", "Gentoo", "Chinstrap", "Adelie", "Adelie", "Adelie", "Chinstrap", "Chinstrap", "Gentoo", "Chinstrap", "Chinstrap", "Gentoo", "Adelie", "Adelie", "Gentoo", "Adelie", "Adelie", "Adelie", "Gentoo", "Adelie", "Adelie", "Adelie", "Adelie", "Chinstrap", "Gentoo", "Gentoo", "Chinstrap", "Chinstrap", "Gentoo", "Gentoo", "Adelie", "Chinstrap", "Gentoo", "Gentoo", "Adelie", "Adelie", "Gentoo", "Adelie", "Gentoo", "Adelie", "Gentoo", "Gentoo", "Adelie", "Chinstrap", "Adelie", "Adelie", "Chinstrap", "Chinstrap", "Chinstrap", "Adelie", "Gentoo", "Adelie", "Gentoo", "Adelie", "Chinstrap", "Gentoo", "Adelie", "Chinstrap", "Adelie", "Gentoo", "Chinstrap", "Gentoo", "Gentoo", "Adelie", "Gentoo", "Adelie", "Gentoo", "Adelie", "Adelie", "Gentoo", "Adelie", "Adelie", "Adelie", "Adelie", "Gentoo"], "truth": ["Chinstrap", "Chinstrap", "Gentoo", "Chinstrap", "Adelie", "Gentoo", "Adelie", "Gentoo", "Gentoo", "Gentoo", "Adelie", "Adelie", "Gentoo", "Chinstrap", "Adelie", "Adelie", "Adelie", "Chinstrap", "Chinstrap", "Gentoo", "Gentoo", "Adelie", "Gentoo", "Adelie", "Adelie", "Gentoo", "Adelie", "Adelie", "Adelie", "Gentoo", "Adelie", "Adelie", "Adelie", "Adelie", "Chinstrap", "Gentoo", "Gentoo", "Chinstrap", "Chinstrap", "Gentoo", "Gentoo", "Adelie", "Chinstrap", "Gentoo", "Gentoo", "Adelie", "Adelie", "Gentoo", "Adelie", "Gentoo", "Adelie", "Gentoo", "Gentoo", "Adelie", "Chinstrap", "Adelie", "Adelie", "Chinstrap", "Chinstrap", "Chinstrap", "Adelie", "Gentoo", "Adelie", "Gentoo", "Adelie", "Chinstrap", "Gentoo", "Adelie", "Chinstrap", "Adelie", "Gentoo", "Chinstrap", "Gentoo", "Gentoo", "Adelie", "Gentoo", "Adelie", "Gentoo", "Adelie", "Adelie", "Gentoo", "Adelie", "Adelie", "Adelie", "Adelie", "Gentoo"] }, "scale_fixture": { "standard": { "values": [-0.5382846166435669, -0.512652015851016, -0.48701941505846524, -0.46138681426591444, 1.9993428618189626], "new_150": 3.2809729014465026 }, "minmax": { "values": [0, 0.010101010101010102, 0.0202020202020202, 0.030303030303030304, 1], "new_150": 1.5050505050505052 }, "robust": { "values": [-1, -0.5, 0, 0.5, 48.5], "new_150": 73.5 } }, "target_encoding": { "categories": ["A", "A", "B", "B", "C", "C"], "target": [1, 1, 0, 0, 1, 0], "folds": [0, 1, 0, 1, 0, 1], "encoded": [0.5555555555555555, 0.7777777777777777, 0.2222222222222222, 0.4444444444444444, 0.2222222222222222, 0.7777777777777777], "fold_records": [{ "held_fold": 0, "prior": 0.3333333333333333, "encoded_rows": [0, 2, 4] }, { "held_fold": 1, "prior": 0.6666666666666666, "encoded_rows": [1, 3, 5] }], "changed_target": [0, 1, 0, 0, 1, 0], "changed_encoded": [0.5555555555555555, 0.2222222222222222, 0.2222222222222222, 0.2222222222222222, 0.2222222222222222, 0.5555555555555555] }, "knn_imputed": [[2, 12, 200]] };
var observations = [{ "species": "Adelie", "island": "Torgersen", "bill_length_mm": 39.1, "bill_depth_mm": 18.7, "flipper_length_mm": 181, "body_mass_g": 3750, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 39.5, "bill_depth_mm": 17.4, "flipper_length_mm": 186, "body_mass_g": 3800, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 40.3, "bill_depth_mm": 18, "flipper_length_mm": 195, "body_mass_g": 3250, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": null, "bill_depth_mm": null, "flipper_length_mm": null, "body_mass_g": null, "sex": null, "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 36.7, "bill_depth_mm": 19.3, "flipper_length_mm": 193, "body_mass_g": 3450, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 39.3, "bill_depth_mm": 20.6, "flipper_length_mm": 190, "body_mass_g": 3650, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 38.9, "bill_depth_mm": 17.8, "flipper_length_mm": 181, "body_mass_g": 3625, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 39.2, "bill_depth_mm": 19.6, "flipper_length_mm": 195, "body_mass_g": 4675, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 34.1, "bill_depth_mm": 18.1, "flipper_length_mm": 193, "body_mass_g": 3475, "sex": null, "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 42, "bill_depth_mm": 20.2, "flipper_length_mm": 190, "body_mass_g": 4250, "sex": null, "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 37.8, "bill_depth_mm": 17.1, "flipper_length_mm": 186, "body_mass_g": 3300, "sex": null, "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 37.8, "bill_depth_mm": 17.3, "flipper_length_mm": 180, "body_mass_g": 3700, "sex": null, "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 41.1, "bill_depth_mm": 17.6, "flipper_length_mm": 182, "body_mass_g": 3200, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 38.6, "bill_depth_mm": 21.2, "flipper_length_mm": 191, "body_mass_g": 3800, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 34.6, "bill_depth_mm": 21.1, "flipper_length_mm": 198, "body_mass_g": 4400, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 36.6, "bill_depth_mm": 17.8, "flipper_length_mm": 185, "body_mass_g": 3700, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 38.7, "bill_depth_mm": 19, "flipper_length_mm": 195, "body_mass_g": 3450, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 42.5, "bill_depth_mm": 20.7, "flipper_length_mm": 197, "body_mass_g": 4500, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 34.4, "bill_depth_mm": 18.4, "flipper_length_mm": 184, "body_mass_g": 3325, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 46, "bill_depth_mm": 21.5, "flipper_length_mm": 194, "body_mass_g": 4200, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 37.8, "bill_depth_mm": 18.3, "flipper_length_mm": 174, "body_mass_g": 3400, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 37.7, "bill_depth_mm": 18.7, "flipper_length_mm": 180, "body_mass_g": 3600, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 35.9, "bill_depth_mm": 19.2, "flipper_length_mm": 189, "body_mass_g": 3800, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 38.2, "bill_depth_mm": 18.1, "flipper_length_mm": 185, "body_mass_g": 3950, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 38.8, "bill_depth_mm": 17.2, "flipper_length_mm": 180, "body_mass_g": 3800, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 35.3, "bill_depth_mm": 18.9, "flipper_length_mm": 187, "body_mass_g": 3800, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 40.6, "bill_depth_mm": 18.6, "flipper_length_mm": 183, "body_mass_g": 3550, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 40.5, "bill_depth_mm": 17.9, "flipper_length_mm": 187, "body_mass_g": 3200, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 37.9, "bill_depth_mm": 18.6, "flipper_length_mm": 172, "body_mass_g": 3150, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 40.5, "bill_depth_mm": 18.9, "flipper_length_mm": 180, "body_mass_g": 3950, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 39.5, "bill_depth_mm": 16.7, "flipper_length_mm": 178, "body_mass_g": 3250, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 37.2, "bill_depth_mm": 18.1, "flipper_length_mm": 178, "body_mass_g": 3900, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 39.5, "bill_depth_mm": 17.8, "flipper_length_mm": 188, "body_mass_g": 3300, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 40.9, "bill_depth_mm": 18.9, "flipper_length_mm": 184, "body_mass_g": 3900, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36.4, "bill_depth_mm": 17, "flipper_length_mm": 195, "body_mass_g": 3325, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 39.2, "bill_depth_mm": 21.1, "flipper_length_mm": 196, "body_mass_g": 4150, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 38.8, "bill_depth_mm": 20, "flipper_length_mm": 190, "body_mass_g": 3950, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 42.2, "bill_depth_mm": 18.5, "flipper_length_mm": 180, "body_mass_g": 3550, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 37.6, "bill_depth_mm": 19.3, "flipper_length_mm": 181, "body_mass_g": 3300, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 39.8, "bill_depth_mm": 19.1, "flipper_length_mm": 184, "body_mass_g": 4650, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36.5, "bill_depth_mm": 18, "flipper_length_mm": 182, "body_mass_g": 3150, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 40.8, "bill_depth_mm": 18.4, "flipper_length_mm": 195, "body_mass_g": 3900, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36, "bill_depth_mm": 18.5, "flipper_length_mm": 186, "body_mass_g": 3100, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 44.1, "bill_depth_mm": 19.7, "flipper_length_mm": 196, "body_mass_g": 4400, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 37, "bill_depth_mm": 16.9, "flipper_length_mm": 185, "body_mass_g": 3e3, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 39.6, "bill_depth_mm": 18.8, "flipper_length_mm": 190, "body_mass_g": 4600, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 41.1, "bill_depth_mm": 19, "flipper_length_mm": 182, "body_mass_g": 3425, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 37.5, "bill_depth_mm": 18.9, "flipper_length_mm": 179, "body_mass_g": 2975, "sex": null, "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36, "bill_depth_mm": 17.9, "flipper_length_mm": 190, "body_mass_g": 3450, "sex": "female", "year": 2007 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 42.3, "bill_depth_mm": 21.2, "flipper_length_mm": 191, "body_mass_g": 4150, "sex": "male", "year": 2007 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 39.6, "bill_depth_mm": 17.7, "flipper_length_mm": 186, "body_mass_g": 3500, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 40.1, "bill_depth_mm": 18.9, "flipper_length_mm": 188, "body_mass_g": 4300, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 35, "bill_depth_mm": 17.9, "flipper_length_mm": 190, "body_mass_g": 3450, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 42, "bill_depth_mm": 19.5, "flipper_length_mm": 200, "body_mass_g": 4050, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 34.5, "bill_depth_mm": 18.1, "flipper_length_mm": 187, "body_mass_g": 2900, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 41.4, "bill_depth_mm": 18.6, "flipper_length_mm": 191, "body_mass_g": 3700, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 39, "bill_depth_mm": 17.5, "flipper_length_mm": 186, "body_mass_g": 3550, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 40.6, "bill_depth_mm": 18.8, "flipper_length_mm": 193, "body_mass_g": 3800, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 36.5, "bill_depth_mm": 16.6, "flipper_length_mm": 181, "body_mass_g": 2850, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 37.6, "bill_depth_mm": 19.1, "flipper_length_mm": 194, "body_mass_g": 3750, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 35.7, "bill_depth_mm": 16.9, "flipper_length_mm": 185, "body_mass_g": 3150, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 41.3, "bill_depth_mm": 21.1, "flipper_length_mm": 195, "body_mass_g": 4400, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 37.6, "bill_depth_mm": 17, "flipper_length_mm": 185, "body_mass_g": 3600, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 41.1, "bill_depth_mm": 18.2, "flipper_length_mm": 192, "body_mass_g": 4050, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 36.4, "bill_depth_mm": 17.1, "flipper_length_mm": 184, "body_mass_g": 2850, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 41.6, "bill_depth_mm": 18, "flipper_length_mm": 192, "body_mass_g": 3950, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 35.5, "bill_depth_mm": 16.2, "flipper_length_mm": 195, "body_mass_g": 3350, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 41.1, "bill_depth_mm": 19.1, "flipper_length_mm": 188, "body_mass_g": 4100, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 35.9, "bill_depth_mm": 16.6, "flipper_length_mm": 190, "body_mass_g": 3050, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 41.8, "bill_depth_mm": 19.4, "flipper_length_mm": 198, "body_mass_g": 4450, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 33.5, "bill_depth_mm": 19, "flipper_length_mm": 190, "body_mass_g": 3600, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 39.7, "bill_depth_mm": 18.4, "flipper_length_mm": 190, "body_mass_g": 3900, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 39.6, "bill_depth_mm": 17.2, "flipper_length_mm": 196, "body_mass_g": 3550, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 45.8, "bill_depth_mm": 18.9, "flipper_length_mm": 197, "body_mass_g": 4150, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 35.5, "bill_depth_mm": 17.5, "flipper_length_mm": 190, "body_mass_g": 3700, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 42.8, "bill_depth_mm": 18.5, "flipper_length_mm": 195, "body_mass_g": 4250, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 40.9, "bill_depth_mm": 16.8, "flipper_length_mm": 191, "body_mass_g": 3700, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 37.2, "bill_depth_mm": 19.4, "flipper_length_mm": 184, "body_mass_g": 3900, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 36.2, "bill_depth_mm": 16.1, "flipper_length_mm": 187, "body_mass_g": 3550, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 42.1, "bill_depth_mm": 19.1, "flipper_length_mm": 195, "body_mass_g": 4e3, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 34.6, "bill_depth_mm": 17.2, "flipper_length_mm": 189, "body_mass_g": 3200, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 42.9, "bill_depth_mm": 17.6, "flipper_length_mm": 196, "body_mass_g": 4700, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 36.7, "bill_depth_mm": 18.8, "flipper_length_mm": 187, "body_mass_g": 3800, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 35.1, "bill_depth_mm": 19.4, "flipper_length_mm": 193, "body_mass_g": 4200, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 37.3, "bill_depth_mm": 17.8, "flipper_length_mm": 191, "body_mass_g": 3350, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 41.3, "bill_depth_mm": 20.3, "flipper_length_mm": 194, "body_mass_g": 3550, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36.3, "bill_depth_mm": 19.5, "flipper_length_mm": 190, "body_mass_g": 3800, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36.9, "bill_depth_mm": 18.6, "flipper_length_mm": 189, "body_mass_g": 3500, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 38.3, "bill_depth_mm": 19.2, "flipper_length_mm": 189, "body_mass_g": 3950, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 38.9, "bill_depth_mm": 18.8, "flipper_length_mm": 190, "body_mass_g": 3600, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 35.7, "bill_depth_mm": 18, "flipper_length_mm": 202, "body_mass_g": 3550, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 41.1, "bill_depth_mm": 18.1, "flipper_length_mm": 205, "body_mass_g": 4300, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 34, "bill_depth_mm": 17.1, "flipper_length_mm": 185, "body_mass_g": 3400, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 39.6, "bill_depth_mm": 18.1, "flipper_length_mm": 186, "body_mass_g": 4450, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36.2, "bill_depth_mm": 17.3, "flipper_length_mm": 187, "body_mass_g": 3300, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 40.8, "bill_depth_mm": 18.9, "flipper_length_mm": 208, "body_mass_g": 4300, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 38.1, "bill_depth_mm": 18.6, "flipper_length_mm": 190, "body_mass_g": 3700, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 40.3, "bill_depth_mm": 18.5, "flipper_length_mm": 196, "body_mass_g": 4350, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 33.1, "bill_depth_mm": 16.1, "flipper_length_mm": 178, "body_mass_g": 2900, "sex": "female", "year": 2008 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 43.2, "bill_depth_mm": 18.5, "flipper_length_mm": 192, "body_mass_g": 4100, "sex": "male", "year": 2008 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 35, "bill_depth_mm": 17.9, "flipper_length_mm": 192, "body_mass_g": 3725, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 41, "bill_depth_mm": 20, "flipper_length_mm": 203, "body_mass_g": 4725, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 37.7, "bill_depth_mm": 16, "flipper_length_mm": 183, "body_mass_g": 3075, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 37.8, "bill_depth_mm": 20, "flipper_length_mm": 190, "body_mass_g": 4250, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 37.9, "bill_depth_mm": 18.6, "flipper_length_mm": 193, "body_mass_g": 2925, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 39.7, "bill_depth_mm": 18.9, "flipper_length_mm": 184, "body_mass_g": 3550, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 38.6, "bill_depth_mm": 17.2, "flipper_length_mm": 199, "body_mass_g": 3750, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 38.2, "bill_depth_mm": 20, "flipper_length_mm": 190, "body_mass_g": 3900, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 38.1, "bill_depth_mm": 17, "flipper_length_mm": 181, "body_mass_g": 3175, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 43.2, "bill_depth_mm": 19, "flipper_length_mm": 197, "body_mass_g": 4775, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 38.1, "bill_depth_mm": 16.5, "flipper_length_mm": 198, "body_mass_g": 3825, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 45.6, "bill_depth_mm": 20.3, "flipper_length_mm": 191, "body_mass_g": 4600, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 39.7, "bill_depth_mm": 17.7, "flipper_length_mm": 193, "body_mass_g": 3200, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 42.2, "bill_depth_mm": 19.5, "flipper_length_mm": 197, "body_mass_g": 4275, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 39.6, "bill_depth_mm": 20.7, "flipper_length_mm": 191, "body_mass_g": 3900, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Biscoe", "bill_length_mm": 42.7, "bill_depth_mm": 18.3, "flipper_length_mm": 196, "body_mass_g": 4075, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 38.6, "bill_depth_mm": 17, "flipper_length_mm": 188, "body_mass_g": 2900, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 37.3, "bill_depth_mm": 20.5, "flipper_length_mm": 199, "body_mass_g": 3775, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 35.7, "bill_depth_mm": 17, "flipper_length_mm": 189, "body_mass_g": 3350, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 41.1, "bill_depth_mm": 18.6, "flipper_length_mm": 189, "body_mass_g": 3325, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 36.2, "bill_depth_mm": 17.2, "flipper_length_mm": 187, "body_mass_g": 3150, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 37.7, "bill_depth_mm": 19.8, "flipper_length_mm": 198, "body_mass_g": 3500, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 40.2, "bill_depth_mm": 17, "flipper_length_mm": 176, "body_mass_g": 3450, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 41.4, "bill_depth_mm": 18.5, "flipper_length_mm": 202, "body_mass_g": 3875, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 35.2, "bill_depth_mm": 15.9, "flipper_length_mm": 186, "body_mass_g": 3050, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 40.6, "bill_depth_mm": 19, "flipper_length_mm": 199, "body_mass_g": 4e3, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 38.8, "bill_depth_mm": 17.6, "flipper_length_mm": 191, "body_mass_g": 3275, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 41.5, "bill_depth_mm": 18.3, "flipper_length_mm": 195, "body_mass_g": 4300, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 39, "bill_depth_mm": 17.1, "flipper_length_mm": 191, "body_mass_g": 3050, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 44.1, "bill_depth_mm": 18, "flipper_length_mm": 210, "body_mass_g": 4e3, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 38.5, "bill_depth_mm": 17.9, "flipper_length_mm": 190, "body_mass_g": 3325, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Torgersen", "bill_length_mm": 43.1, "bill_depth_mm": 19.2, "flipper_length_mm": 197, "body_mass_g": 3500, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36.8, "bill_depth_mm": 18.5, "flipper_length_mm": 193, "body_mass_g": 3500, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 37.5, "bill_depth_mm": 18.5, "flipper_length_mm": 199, "body_mass_g": 4475, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 38.1, "bill_depth_mm": 17.6, "flipper_length_mm": 187, "body_mass_g": 3425, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 41.1, "bill_depth_mm": 17.5, "flipper_length_mm": 190, "body_mass_g": 3900, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 35.6, "bill_depth_mm": 17.5, "flipper_length_mm": 191, "body_mass_g": 3175, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 40.2, "bill_depth_mm": 20.1, "flipper_length_mm": 200, "body_mass_g": 3975, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 37, "bill_depth_mm": 16.5, "flipper_length_mm": 185, "body_mass_g": 3400, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 39.7, "bill_depth_mm": 17.9, "flipper_length_mm": 193, "body_mass_g": 4250, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 40.2, "bill_depth_mm": 17.1, "flipper_length_mm": 193, "body_mass_g": 3400, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 40.6, "bill_depth_mm": 17.2, "flipper_length_mm": 187, "body_mass_g": 3475, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 32.1, "bill_depth_mm": 15.5, "flipper_length_mm": 188, "body_mass_g": 3050, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 40.7, "bill_depth_mm": 17, "flipper_length_mm": 190, "body_mass_g": 3725, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 37.3, "bill_depth_mm": 16.8, "flipper_length_mm": 192, "body_mass_g": 3e3, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 39, "bill_depth_mm": 18.7, "flipper_length_mm": 185, "body_mass_g": 3650, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 39.2, "bill_depth_mm": 18.6, "flipper_length_mm": 190, "body_mass_g": 4250, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36.6, "bill_depth_mm": 18.4, "flipper_length_mm": 184, "body_mass_g": 3475, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36, "bill_depth_mm": 17.8, "flipper_length_mm": 195, "body_mass_g": 3450, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 37.8, "bill_depth_mm": 18.1, "flipper_length_mm": 193, "body_mass_g": 3750, "sex": "male", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 36, "bill_depth_mm": 17.1, "flipper_length_mm": 187, "body_mass_g": 3700, "sex": "female", "year": 2009 }, { "species": "Adelie", "island": "Dream", "bill_length_mm": 41.5, "bill_depth_mm": 18.5, "flipper_length_mm": 201, "body_mass_g": 4e3, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.1, "bill_depth_mm": 13.2, "flipper_length_mm": 211, "body_mass_g": 4500, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50, "bill_depth_mm": 16.3, "flipper_length_mm": 230, "body_mass_g": 5700, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.7, "bill_depth_mm": 14.1, "flipper_length_mm": 210, "body_mass_g": 4450, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50, "bill_depth_mm": 15.2, "flipper_length_mm": 218, "body_mass_g": 5700, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.6, "bill_depth_mm": 14.5, "flipper_length_mm": 215, "body_mass_g": 5400, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.5, "bill_depth_mm": 13.5, "flipper_length_mm": 210, "body_mass_g": 4550, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.4, "bill_depth_mm": 14.6, "flipper_length_mm": 211, "body_mass_g": 4800, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.7, "bill_depth_mm": 15.3, "flipper_length_mm": 219, "body_mass_g": 5200, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 43.3, "bill_depth_mm": 13.4, "flipper_length_mm": 209, "body_mass_g": 4400, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.8, "bill_depth_mm": 15.4, "flipper_length_mm": 215, "body_mass_g": 5150, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 40.9, "bill_depth_mm": 13.7, "flipper_length_mm": 214, "body_mass_g": 4650, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49, "bill_depth_mm": 16.1, "flipper_length_mm": 216, "body_mass_g": 5550, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.5, "bill_depth_mm": 13.7, "flipper_length_mm": 214, "body_mass_g": 4650, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.4, "bill_depth_mm": 14.6, "flipper_length_mm": 213, "body_mass_g": 5850, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.8, "bill_depth_mm": 14.6, "flipper_length_mm": 210, "body_mass_g": 4200, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.3, "bill_depth_mm": 15.7, "flipper_length_mm": 217, "body_mass_g": 5850, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 42, "bill_depth_mm": 13.5, "flipper_length_mm": 210, "body_mass_g": 4150, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.2, "bill_depth_mm": 15.2, "flipper_length_mm": 221, "body_mass_g": 6300, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.2, "bill_depth_mm": 14.5, "flipper_length_mm": 209, "body_mass_g": 4800, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.7, "bill_depth_mm": 15.1, "flipper_length_mm": 222, "body_mass_g": 5350, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50.2, "bill_depth_mm": 14.3, "flipper_length_mm": 218, "body_mass_g": 5700, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.1, "bill_depth_mm": 14.5, "flipper_length_mm": 215, "body_mass_g": 5e3, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.5, "bill_depth_mm": 14.5, "flipper_length_mm": 213, "body_mass_g": 4400, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.3, "bill_depth_mm": 15.8, "flipper_length_mm": 215, "body_mass_g": 5050, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 42.9, "bill_depth_mm": 13.1, "flipper_length_mm": 215, "body_mass_g": 5e3, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.1, "bill_depth_mm": 15.1, "flipper_length_mm": 215, "body_mass_g": 5100, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 44.5, "bill_depth_mm": 14.3, "flipper_length_mm": 216, "body_mass_g": 4100, "sex": null, "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.8, "bill_depth_mm": 15, "flipper_length_mm": 215, "body_mass_g": 5650, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.2, "bill_depth_mm": 14.3, "flipper_length_mm": 210, "body_mass_g": 4600, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50, "bill_depth_mm": 15.3, "flipper_length_mm": 220, "body_mass_g": 5550, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.3, "bill_depth_mm": 15.3, "flipper_length_mm": 222, "body_mass_g": 5250, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 42.8, "bill_depth_mm": 14.2, "flipper_length_mm": 209, "body_mass_g": 4700, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.1, "bill_depth_mm": 14.5, "flipper_length_mm": 207, "body_mass_g": 5050, "sex": "female", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 59.6, "bill_depth_mm": 17, "flipper_length_mm": 230, "body_mass_g": 6050, "sex": "male", "year": 2007 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.1, "bill_depth_mm": 14.8, "flipper_length_mm": 220, "body_mass_g": 5150, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.4, "bill_depth_mm": 16.3, "flipper_length_mm": 220, "body_mass_g": 5400, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 42.6, "bill_depth_mm": 13.7, "flipper_length_mm": 213, "body_mass_g": 4950, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 44.4, "bill_depth_mm": 17.3, "flipper_length_mm": 219, "body_mass_g": 5250, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 44, "bill_depth_mm": 13.6, "flipper_length_mm": 208, "body_mass_g": 4350, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.7, "bill_depth_mm": 15.7, "flipper_length_mm": 208, "body_mass_g": 5350, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 42.7, "bill_depth_mm": 13.7, "flipper_length_mm": 208, "body_mass_g": 3950, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.6, "bill_depth_mm": 16, "flipper_length_mm": 225, "body_mass_g": 5700, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.3, "bill_depth_mm": 13.7, "flipper_length_mm": 210, "body_mass_g": 4300, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.6, "bill_depth_mm": 15, "flipper_length_mm": 216, "body_mass_g": 4750, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50.5, "bill_depth_mm": 15.9, "flipper_length_mm": 222, "body_mass_g": 5550, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 43.6, "bill_depth_mm": 13.9, "flipper_length_mm": 217, "body_mass_g": 4900, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.5, "bill_depth_mm": 13.9, "flipper_length_mm": 210, "body_mass_g": 4200, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50.5, "bill_depth_mm": 15.9, "flipper_length_mm": 225, "body_mass_g": 5400, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 44.9, "bill_depth_mm": 13.3, "flipper_length_mm": 213, "body_mass_g": 5100, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.2, "bill_depth_mm": 15.8, "flipper_length_mm": 215, "body_mass_g": 5300, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.6, "bill_depth_mm": 14.2, "flipper_length_mm": 210, "body_mass_g": 4850, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.5, "bill_depth_mm": 14.1, "flipper_length_mm": 220, "body_mass_g": 5300, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.1, "bill_depth_mm": 14.4, "flipper_length_mm": 210, "body_mass_g": 4400, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50.1, "bill_depth_mm": 15, "flipper_length_mm": 225, "body_mass_g": 5e3, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.5, "bill_depth_mm": 14.4, "flipper_length_mm": 217, "body_mass_g": 4900, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45, "bill_depth_mm": 15.4, "flipper_length_mm": 220, "body_mass_g": 5050, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 43.8, "bill_depth_mm": 13.9, "flipper_length_mm": 208, "body_mass_g": 4300, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.5, "bill_depth_mm": 15, "flipper_length_mm": 220, "body_mass_g": 5e3, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 43.2, "bill_depth_mm": 14.5, "flipper_length_mm": 208, "body_mass_g": 4450, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50.4, "bill_depth_mm": 15.3, "flipper_length_mm": 224, "body_mass_g": 5550, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.3, "bill_depth_mm": 13.8, "flipper_length_mm": 208, "body_mass_g": 4200, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.2, "bill_depth_mm": 14.9, "flipper_length_mm": 221, "body_mass_g": 5300, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.7, "bill_depth_mm": 13.9, "flipper_length_mm": 214, "body_mass_g": 4400, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 54.3, "bill_depth_mm": 15.7, "flipper_length_mm": 231, "body_mass_g": 5650, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.8, "bill_depth_mm": 14.2, "flipper_length_mm": 219, "body_mass_g": 4700, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.8, "bill_depth_mm": 16.8, "flipper_length_mm": 230, "body_mass_g": 5700, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.2, "bill_depth_mm": 14.4, "flipper_length_mm": 214, "body_mass_g": 4650, "sex": null, "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.5, "bill_depth_mm": 16.2, "flipper_length_mm": 229, "body_mass_g": 5800, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 43.5, "bill_depth_mm": 14.2, "flipper_length_mm": 220, "body_mass_g": 4700, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50.7, "bill_depth_mm": 15, "flipper_length_mm": 223, "body_mass_g": 5550, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.7, "bill_depth_mm": 15, "flipper_length_mm": 216, "body_mass_g": 4750, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.4, "bill_depth_mm": 15.6, "flipper_length_mm": 221, "body_mass_g": 5e3, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.2, "bill_depth_mm": 15.6, "flipper_length_mm": 221, "body_mass_g": 5100, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.5, "bill_depth_mm": 14.8, "flipper_length_mm": 217, "body_mass_g": 5200, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.4, "bill_depth_mm": 15, "flipper_length_mm": 216, "body_mass_g": 4700, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.6, "bill_depth_mm": 16, "flipper_length_mm": 230, "body_mass_g": 5800, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.5, "bill_depth_mm": 14.2, "flipper_length_mm": 209, "body_mass_g": 4600, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 51.1, "bill_depth_mm": 16.3, "flipper_length_mm": 220, "body_mass_g": 6e3, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.2, "bill_depth_mm": 13.8, "flipper_length_mm": 215, "body_mass_g": 4750, "sex": "female", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.2, "bill_depth_mm": 16.4, "flipper_length_mm": 223, "body_mass_g": 5950, "sex": "male", "year": 2008 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.1, "bill_depth_mm": 14.5, "flipper_length_mm": 212, "body_mass_g": 4625, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 52.5, "bill_depth_mm": 15.6, "flipper_length_mm": 221, "body_mass_g": 5450, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.4, "bill_depth_mm": 14.6, "flipper_length_mm": 212, "body_mass_g": 4725, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50, "bill_depth_mm": 15.9, "flipper_length_mm": 224, "body_mass_g": 5350, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 44.9, "bill_depth_mm": 13.8, "flipper_length_mm": 212, "body_mass_g": 4750, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50.8, "bill_depth_mm": 17.3, "flipper_length_mm": 228, "body_mass_g": 5600, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 43.4, "bill_depth_mm": 14.4, "flipper_length_mm": 218, "body_mass_g": 4600, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 51.3, "bill_depth_mm": 14.2, "flipper_length_mm": 218, "body_mass_g": 5300, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.5, "bill_depth_mm": 14, "flipper_length_mm": 212, "body_mass_g": 4875, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 52.1, "bill_depth_mm": 17, "flipper_length_mm": 230, "body_mass_g": 5550, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.5, "bill_depth_mm": 15, "flipper_length_mm": 218, "body_mass_g": 4950, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 52.2, "bill_depth_mm": 17.1, "flipper_length_mm": 228, "body_mass_g": 5400, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.5, "bill_depth_mm": 14.5, "flipper_length_mm": 212, "body_mass_g": 4750, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.5, "bill_depth_mm": 16.1, "flipper_length_mm": 224, "body_mass_g": 5650, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 44.5, "bill_depth_mm": 14.7, "flipper_length_mm": 214, "body_mass_g": 4850, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50.8, "bill_depth_mm": 15.7, "flipper_length_mm": 226, "body_mass_g": 5200, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.4, "bill_depth_mm": 15.8, "flipper_length_mm": 216, "body_mass_g": 4925, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.9, "bill_depth_mm": 14.6, "flipper_length_mm": 222, "body_mass_g": 4875, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.4, "bill_depth_mm": 14.4, "flipper_length_mm": 203, "body_mass_g": 4625, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 51.1, "bill_depth_mm": 16.5, "flipper_length_mm": 225, "body_mass_g": 5250, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.5, "bill_depth_mm": 15, "flipper_length_mm": 219, "body_mass_g": 4850, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 55.9, "bill_depth_mm": 17, "flipper_length_mm": 228, "body_mass_g": 5600, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.2, "bill_depth_mm": 15.5, "flipper_length_mm": 215, "body_mass_g": 4975, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.1, "bill_depth_mm": 15, "flipper_length_mm": 228, "body_mass_g": 5500, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.3, "bill_depth_mm": 13.8, "flipper_length_mm": 216, "body_mass_g": 4725, "sex": null, "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.8, "bill_depth_mm": 16.1, "flipper_length_mm": 215, "body_mass_g": 5500, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 41.7, "bill_depth_mm": 14.7, "flipper_length_mm": 210, "body_mass_g": 4700, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 53.4, "bill_depth_mm": 15.8, "flipper_length_mm": 219, "body_mass_g": 5500, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 43.3, "bill_depth_mm": 14, "flipper_length_mm": 208, "body_mass_g": 4575, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.1, "bill_depth_mm": 15.1, "flipper_length_mm": 209, "body_mass_g": 5500, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50.5, "bill_depth_mm": 15.2, "flipper_length_mm": 216, "body_mass_g": 5e3, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.8, "bill_depth_mm": 15.9, "flipper_length_mm": 229, "body_mass_g": 5950, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 43.5, "bill_depth_mm": 15.2, "flipper_length_mm": 213, "body_mass_g": 4650, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 51.5, "bill_depth_mm": 16.3, "flipper_length_mm": 230, "body_mass_g": 5500, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.2, "bill_depth_mm": 14.1, "flipper_length_mm": 217, "body_mass_g": 4375, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 55.1, "bill_depth_mm": 16, "flipper_length_mm": 230, "body_mass_g": 5850, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 44.5, "bill_depth_mm": 15.7, "flipper_length_mm": 217, "body_mass_g": 4875, "sex": null, "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 48.8, "bill_depth_mm": 16.2, "flipper_length_mm": 222, "body_mass_g": 6e3, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 47.2, "bill_depth_mm": 13.7, "flipper_length_mm": 214, "body_mass_g": 4925, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": null, "bill_depth_mm": null, "flipper_length_mm": null, "body_mass_g": null, "sex": null, "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 46.8, "bill_depth_mm": 14.3, "flipper_length_mm": 215, "body_mass_g": 4850, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 50.4, "bill_depth_mm": 15.7, "flipper_length_mm": 222, "body_mass_g": 5750, "sex": "male", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 45.2, "bill_depth_mm": 14.8, "flipper_length_mm": 212, "body_mass_g": 5200, "sex": "female", "year": 2009 }, { "species": "Gentoo", "island": "Biscoe", "bill_length_mm": 49.9, "bill_depth_mm": 16.1, "flipper_length_mm": 213, "body_mass_g": 5400, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 46.5, "bill_depth_mm": 17.9, "flipper_length_mm": 192, "body_mass_g": 3500, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50, "bill_depth_mm": 19.5, "flipper_length_mm": 196, "body_mass_g": 3900, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 51.3, "bill_depth_mm": 19.2, "flipper_length_mm": 193, "body_mass_g": 3650, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 45.4, "bill_depth_mm": 18.7, "flipper_length_mm": 188, "body_mass_g": 3525, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 52.7, "bill_depth_mm": 19.8, "flipper_length_mm": 197, "body_mass_g": 3725, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 45.2, "bill_depth_mm": 17.8, "flipper_length_mm": 198, "body_mass_g": 3950, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 46.1, "bill_depth_mm": 18.2, "flipper_length_mm": 178, "body_mass_g": 3250, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 51.3, "bill_depth_mm": 18.2, "flipper_length_mm": 197, "body_mass_g": 3750, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 46, "bill_depth_mm": 18.9, "flipper_length_mm": 195, "body_mass_g": 4150, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 51.3, "bill_depth_mm": 19.9, "flipper_length_mm": 198, "body_mass_g": 3700, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 46.6, "bill_depth_mm": 17.8, "flipper_length_mm": 193, "body_mass_g": 3800, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 51.7, "bill_depth_mm": 20.3, "flipper_length_mm": 194, "body_mass_g": 3775, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 47, "bill_depth_mm": 17.3, "flipper_length_mm": 185, "body_mass_g": 3700, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 52, "bill_depth_mm": 18.1, "flipper_length_mm": 201, "body_mass_g": 4050, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 45.9, "bill_depth_mm": 17.1, "flipper_length_mm": 190, "body_mass_g": 3575, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.5, "bill_depth_mm": 19.6, "flipper_length_mm": 201, "body_mass_g": 4050, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.3, "bill_depth_mm": 20, "flipper_length_mm": 197, "body_mass_g": 3300, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 58, "bill_depth_mm": 17.8, "flipper_length_mm": 181, "body_mass_g": 3700, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 46.4, "bill_depth_mm": 18.6, "flipper_length_mm": 190, "body_mass_g": 3450, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 49.2, "bill_depth_mm": 18.2, "flipper_length_mm": 195, "body_mass_g": 4400, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 42.4, "bill_depth_mm": 17.3, "flipper_length_mm": 181, "body_mass_g": 3600, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 48.5, "bill_depth_mm": 17.5, "flipper_length_mm": 191, "body_mass_g": 3400, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 43.2, "bill_depth_mm": 16.6, "flipper_length_mm": 187, "body_mass_g": 2900, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.6, "bill_depth_mm": 19.4, "flipper_length_mm": 193, "body_mass_g": 3800, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 46.7, "bill_depth_mm": 17.9, "flipper_length_mm": 195, "body_mass_g": 3300, "sex": "female", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 52, "bill_depth_mm": 19, "flipper_length_mm": 197, "body_mass_g": 4150, "sex": "male", "year": 2007 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.5, "bill_depth_mm": 18.4, "flipper_length_mm": 200, "body_mass_g": 3400, "sex": "female", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 49.5, "bill_depth_mm": 19, "flipper_length_mm": 200, "body_mass_g": 3800, "sex": "male", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 46.4, "bill_depth_mm": 17.8, "flipper_length_mm": 191, "body_mass_g": 3700, "sex": "female", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 52.8, "bill_depth_mm": 20, "flipper_length_mm": 205, "body_mass_g": 4550, "sex": "male", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 40.9, "bill_depth_mm": 16.6, "flipper_length_mm": 187, "body_mass_g": 3200, "sex": "female", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 54.2, "bill_depth_mm": 20.8, "flipper_length_mm": 201, "body_mass_g": 4300, "sex": "male", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 42.5, "bill_depth_mm": 16.7, "flipper_length_mm": 187, "body_mass_g": 3350, "sex": "female", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 51, "bill_depth_mm": 18.8, "flipper_length_mm": 203, "body_mass_g": 4100, "sex": "male", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 49.7, "bill_depth_mm": 18.6, "flipper_length_mm": 195, "body_mass_g": 3600, "sex": "male", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 47.5, "bill_depth_mm": 16.8, "flipper_length_mm": 199, "body_mass_g": 3900, "sex": "female", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 47.6, "bill_depth_mm": 18.3, "flipper_length_mm": 195, "body_mass_g": 3850, "sex": "female", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 52, "bill_depth_mm": 20.7, "flipper_length_mm": 210, "body_mass_g": 4800, "sex": "male", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 46.9, "bill_depth_mm": 16.6, "flipper_length_mm": 192, "body_mass_g": 2700, "sex": "female", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 53.5, "bill_depth_mm": 19.9, "flipper_length_mm": 205, "body_mass_g": 4500, "sex": "male", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 49, "bill_depth_mm": 19.5, "flipper_length_mm": 210, "body_mass_g": 3950, "sex": "male", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 46.2, "bill_depth_mm": 17.5, "flipper_length_mm": 187, "body_mass_g": 3650, "sex": "female", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.9, "bill_depth_mm": 19.1, "flipper_length_mm": 196, "body_mass_g": 3550, "sex": "male", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 45.5, "bill_depth_mm": 17, "flipper_length_mm": 196, "body_mass_g": 3500, "sex": "female", "year": 2008 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.9, "bill_depth_mm": 17.9, "flipper_length_mm": 196, "body_mass_g": 3675, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.8, "bill_depth_mm": 18.5, "flipper_length_mm": 201, "body_mass_g": 4450, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.1, "bill_depth_mm": 17.9, "flipper_length_mm": 190, "body_mass_g": 3400, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 49, "bill_depth_mm": 19.6, "flipper_length_mm": 212, "body_mass_g": 4300, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 51.5, "bill_depth_mm": 18.7, "flipper_length_mm": 187, "body_mass_g": 3250, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 49.8, "bill_depth_mm": 17.3, "flipper_length_mm": 198, "body_mass_g": 3675, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 48.1, "bill_depth_mm": 16.4, "flipper_length_mm": 199, "body_mass_g": 3325, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 51.4, "bill_depth_mm": 19, "flipper_length_mm": 201, "body_mass_g": 3950, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 45.7, "bill_depth_mm": 17.3, "flipper_length_mm": 193, "body_mass_g": 3600, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.7, "bill_depth_mm": 19.7, "flipper_length_mm": 203, "body_mass_g": 4050, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 42.5, "bill_depth_mm": 17.3, "flipper_length_mm": 187, "body_mass_g": 3350, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 52.2, "bill_depth_mm": 18.8, "flipper_length_mm": 197, "body_mass_g": 3450, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 45.2, "bill_depth_mm": 16.6, "flipper_length_mm": 191, "body_mass_g": 3250, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 49.3, "bill_depth_mm": 19.9, "flipper_length_mm": 203, "body_mass_g": 4050, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.2, "bill_depth_mm": 18.8, "flipper_length_mm": 202, "body_mass_g": 3800, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 45.6, "bill_depth_mm": 19.4, "flipper_length_mm": 194, "body_mass_g": 3525, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 51.9, "bill_depth_mm": 19.5, "flipper_length_mm": 206, "body_mass_g": 3950, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 46.8, "bill_depth_mm": 16.5, "flipper_length_mm": 189, "body_mass_g": 3650, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 45.7, "bill_depth_mm": 17, "flipper_length_mm": 195, "body_mass_g": 3650, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 55.8, "bill_depth_mm": 19.8, "flipper_length_mm": 207, "body_mass_g": 4e3, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 43.5, "bill_depth_mm": 18.1, "flipper_length_mm": 202, "body_mass_g": 3400, "sex": "female", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 49.6, "bill_depth_mm": 18.2, "flipper_length_mm": 193, "body_mass_g": 3775, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.8, "bill_depth_mm": 19, "flipper_length_mm": 210, "body_mass_g": 4100, "sex": "male", "year": 2009 }, { "species": "Chinstrap", "island": "Dream", "bill_length_mm": 50.2, "bill_depth_mm": 18.7, "flipper_length_mm": 198, "body_mass_g": 3775, "sex": "female", "year": 2009 }];

// docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/runtime-preview/CoreFigures.jsx
import { Fragment as Fragment3, jsx as jsx9, jsxs as jsxs7 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsxs7("div", { children: [
    raw ? /* @__PURE__ */ jsx9(Plot, { label: "Recorded bill length and body mass; axes carry different physical units", xDomain: [Math.min(...Object.values(data).map((row) => row[0])) - 1, Math.max(...Object.values(data).map((row) => row[0])) + 1], yDomain: [Math.min(...Object.values(data).map((row) => row[1])) - 20, Math.max(...Object.values(data).map((row) => row[1])) + 20], xLabel: "bill length (mm)", yLabel: "body mass (g)", points: Object.entries(data).map(([id, row]) => ({
      id,
      x: row[0],
      y: row[1],
      color: ink[id] || ink.query
    })) }) : null,
    /* @__PURE__ */ jsx9(Plot, { label: "Query-centred transformed displacement triangles and full true-radius circles", equal: true, xDomain: [-radius, radius], yDomain: [-radius, radius], xLabel: "\u0394 bill / bill divisor", yLabel: "\u0394 mass / mass divisor", circles: comparisons.map((row) => ({
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
    /* @__PURE__ */ jsx9(Bars, { label: "Squared coordinate contributions on one common zero-based scale", rows: comparisons.flatMap((row) => row.contributions.map((value, j) => ({
      name: `${row.id} \xB7 ${j ? "mass" : "bill"} squared contribution`,
      value,
      color: row.color
    }))) }),
    /* @__PURE__ */ jsx9(Table, { caption: "Unrounded contributions determine the ranking; displayed values are rounded", headers: ["Point", "\u0394 bill / a", "\u0394 mass / b", "bill\xB2", "mass\xB2", "sum d\xB2", "length d"], rows: comparisons.map((row) => [row.id, ...row.delta, ...row.contributions, row.squared, row.length]) })
  ] });
}
function RulerView({
  training = [1, 2, 3, 4, 100],
  query = 150,
  selected
}) {
  const kinds = selected ? [selected] : ["standard", "minmax", "robust", "maxabs"];
  const standard = ruler(training, "standard");
  return /* @__PURE__ */ jsxs7("div", { children: [
    /* @__PURE__ */ jsx9(NumberLine, { values: training, marks: [{
      id: "query",
      value: query
    }], label: "Original values \xB7 full extent" }),
    /* @__PURE__ */ jsx9(NumberLine, { values: training.filter((value) => value >= 1 && value <= 4), min: 0.5, max: 4.5, label: "Zoom into central observations1\u20134; extreme values omitted only in this zoom" }),
    !selected || selected === "standard" ? /* @__PURE__ */ jsxs7(Fragment3, { children: [
      /* @__PURE__ */ jsx9(Plot, { label: "Each observed value contributes a deviation from the fitted mean", xDomain: [Math.min(...training) - 1, Math.max(...training) + 1], yDomain: [-0.5, training.length - 0.5], xLabel: "training value and fitted mean", yLabel: "training row index", paths: [...training.map((value, i) => ({
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
      /* @__PURE__ */ jsx9(Table, { caption: "Population spread reduction, divided by n", headers: ["training value", "value\u2212mean", "squared deviation"], rows: [...training.map((value) => [value, value - standard.center, (value - standard.center) ** 2]), ["variance", "", standard.measured ** 2], ["standard deviation", "", standard.measured]] })
    ] }) : null,
    /* @__PURE__ */ jsx9("div", { className: "prep-columns", children: kinds.map((kind) => {
      const fit = ruler(training, kind), outputs = training.map((value) => applyRuler(fit, value));
      return /* @__PURE__ */ jsxs7("div", { children: [
        /* @__PURE__ */ jsx9(NumberLine, { values: outputs, marks: [{
          id: "query",
          value: applyRuler(fit, query)
        }], label: `${kind} \xB7 output full extent` }),
        /* @__PURE__ */ jsx9(Table, { caption: `${kind} fitted state`, headers: ["center", "measured spread", "stored divisor", "query coordinate"], rows: [[fit.center, fit.measured, fit.scale, applyRuler(fit, query)]] })
      ] }, kind);
    }) }),
    /* @__PURE__ */ jsx9(Table, { caption: "Original values and all fitted coordinates", headers: ["value", ...kinds], rows: [...training, query].map((value) => [value, ...kinds.map((kind) => applyRuler(ruler(training, kind), value))]) })
  ] });
}
function CategoryView({
  query = "new",
  minimum = 2,
  policy = "infrequent"
}) {
  const state = category(query, minimum, policy);
  return /* @__PURE__ */ jsxs7("div", { children: [
    /* @__PURE__ */ jsx9(Table, { caption: "Counts are learned from training only", headers: ["label", "training count", "state"], rows: [["a", 4, 4 >= minimum ? "frequent" : "rare"], ["b", 1, 1 >= minimum ? "frequent" : "rare"], ["None", 1, "reserved missing"]] }),
    /* @__PURE__ */ jsx9(Cells, { label: "Exact output positions", names: state.vocabulary, values: state.vector }),
    /* @__PURE__ */ jsxs7("p", { children: [
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
  return /* @__PURE__ */ jsxs7("div", { children: [
    /* @__PURE__ */ jsx9(Matrix, { label: "Complete original query and donor cells", columns: ["a", "b", "target c"], rowLabels: ["Q", "D1", "D2", "D3"], values: table, highlightRows: [0] }),
    stage === "overlap" ? /* @__PURE__ */ jsx9("div", { className: "prep-columns", children: state.scored.map((row) => /* @__PURE__ */ jsxs7("div", { className: "prep-operation", children: [
      /* @__PURE__ */ jsxs7("p", { children: [
        "Q compared with ",
        row.id,
        ": connectors exist only for both-observed coordinates."
      ] }),
      /* @__PURE__ */ jsx9("svg", { viewBox: "0 0 440 170", role: "img", "aria-label": `${row.id} overlap coordinates${row.overlap.join(",") || "none"}`, children: ["a", "b", "target c"].map((name, j) => /* @__PURE__ */ jsxs7("g", { children: [
        /* @__PURE__ */ jsx9("text", { x: 75 + j * 145, y: "20", textAnchor: "middle", children: name }),
        /* @__PURE__ */ jsx9("circle", { cx: 75 + j * 145, cy: "50", r: "8", fill: table[0][j] === null ? "none" : ink.query, stroke: ink.query }),
        /* @__PURE__ */ jsx9("circle", { cx: 75 + j * 145, cy: "120", r: "8", fill: row.row[j] === null ? "none" : ink.A, stroke: ink.A }),
        row.overlap.includes(j) ? /* @__PURE__ */ jsx9("line", { x1: 75 + j * 145, x2: 75 + j * 145, y1: "60", y2: "110", stroke: ink.B, strokeWidth: "2" }) : null,
        /* @__PURE__ */ jsxs7("text", { x: 75 + j * 145, y: "155", textAnchor: "middle", children: [
          fmt(table[0][j]),
          " / ",
          fmt(row.row[j])
        ] })
      ] }, name)) })
    ] }, row.id)) }) : null,
    /* @__PURE__ */ jsx9(Table, { caption: "Common observed coordinates are chosen before target-specific eligibility", headers: ["donor", "overlap coordinates", "q", "square differences", "sum", "p/q", "d\xB2", "distance", "target observed"], rows: state.scored.map((row) => [row.id, row.overlap.map((i) => ["a", "b", "c"][i]).join(", ") || "none", row.overlap.length, row.squares.map((value) => fmt(value)).join(" + ") || "undefined", row.overlap.length ? row.squares.reduce((a, b) => a + b, 0) : "undefined", row.overlap.length ? 3 / row.overlap.length : "undefined", row.squared, row.length, row.eligible ? "yes" : "no"]) }),
    stage !== "overlap" ? /* @__PURE__ */ jsx9(NumberLine, { values: state.scored.filter((row) => row.length !== null).map((row) => row.length), label: "Actual distance d (not squared distance)" }) : null,
    stage === "all" ? /* @__PURE__ */ jsxs7(Fragment3, { children: [
      /* @__PURE__ */ jsx9(Cells, { label: "Selected target cells", names: state.chosen.map((row) => `${row.id} \xB7 weight1/${state.chosen.length}`), values: state.chosen.map((row) => row.row[2]) }),
      /* @__PURE__ */ jsx9("div", { className: "prep-flow-arrow", "aria-hidden": "true", children: "\u2193" }),
      /* @__PURE__ */ jsx9(Cells, { names: [state.fallback ? "observed-target mean fallback" : "equal-weight target estimate"], values: [state.value] }),
      /* @__PURE__ */ jsxs7("p", { children: [
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
  return /* @__PURE__ */ jsxs7("div", { children: [
    /* @__PURE__ */ jsxs7("div", { className: "prep-columns", children: [
      /* @__PURE__ */ jsxs7("div", { children: [
        /* @__PURE__ */ jsx9(Cells, { label: "Numeric input", names: ["numeric0", "numeric1", "numeric2"], values: row }),
        /* @__PURE__ */ jsx9("div", { className: "prep-flow-arrow", children: "\u2193 median fill" }),
        /* @__PURE__ */ jsx9(Cells, { names: ["filled0", "filled1", "filled2"], values: result.filled, mask: result.mask }),
        /* @__PURE__ */ jsx9("div", { className: "prep-flow-arrow", children: "\u2193 saved centre and divisor" }),
        /* @__PURE__ */ jsx9(Cells, { names: ["scaled0", "scaled1", "scaled2"], values: result.numeric, mask: result.mask })
      ] }),
      /* @__PURE__ */ jsxs7("div", { children: [
        /* @__PURE__ */ jsx9(Cells, { names: ["category input"], values: [label ?? "None"] }),
        /* @__PURE__ */ jsx9("div", { className: "prep-flow-arrow", children: "\u2193 saved vocabulary" }),
        /* @__PURE__ */ jsx9(Cells, { names: smallFit.vocabulary, values: result.encoded })
      ] })
    ] }),
    /* @__PURE__ */ jsx9("div", { className: "prep-flow-arrow", children: "\u2193 concatenate numeric then category" }),
    /* @__PURE__ */ jsx9(Cells, { label: "Full six-coordinate P1 output", names: ["n0", "n1", "n2", "a", "b", "not_recorded"], values: result.output, mask: [...result.mask, false, false, false] }),
    /* @__PURE__ */ jsx9(Table, { caption: "Pinned P1 fitted arrays; query edits cannot refit them", headers: ["array", "entries"], rows: Object.entries(smallFit).map(([name, values]) => [name, values.map((value) => fmt(value, 9)).join(", ")]) })
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
  return /* @__PURE__ */ jsxs7("div", { children: [
    /* @__PURE__ */ jsxs7("p", { children: [
      "Source row ",
      source,
      "; observed target ",
      /* @__PURE__ */ jsx9("strong", { children: record.species }),
      " is separate from these inputs. ",
      altered !== void 0 ? "This is an altered inspection copy; no new model prediction or accuracy is calculated." : "Original recorded row under the retained fitted preparation."
    ] }),
    /* @__PURE__ */ jsx9(Table, { caption: "One coordinate at a time through the saved fit", headers: ["feature", "input", "median", "filled", "mean", "divisor", "coordinate"], rows: names.map((name, i) => [name, values[i], state.medians[i], result.filled[i], state.means[i], state.scales[i], result.numeric[i]]) }),
    /* @__PURE__ */ jsx9(Cells, { label: "Seven output coordinates, fixed numeric then category order", names: [...numericNames, ...state.vocabulary], values: result.output, mask: [...result.mask, false, false, false] })
  ] });
}
function CoreFigure({
  id
}) {
  let body, caption;
  switch (id) {
    case "D01":
      caption = "A recorded observation, its five input fields and separate target. Row position is not a model feature.";
      body = /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsx9(Matrix, { label: "X feature block: n rows \xD75 input fields", columns: [...numericNames, "recorded sex"], rowLabels: ["309"], values: [[51, 18.8, 203, 4100, "male"]], highlightRows: [0] }),
        /* @__PURE__ */ jsx9(Matrix, { label: "y target block: n rows \xD71 label", columns: ["target species"], rowLabels: ["309"], values: [["Chinstrap"]] })
      ] });
      break;
    case "D02":
      caption = "The observed row and an explicitly altered copy retain different recording histories.";
      body = /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsx9(Matrix, { label: "Input rows before learned arithmetic", columns: [...numericNames, "sex"], rowLabels: ["observed309", "altered copy"], values: [[51, 18.8, 203, 4100, "male"], [51, 18.8, 203, null, "male"]] }),
        /* @__PURE__ */ jsx9("div", { className: "prep-flow-arrow", children: "\u2193 declared mass fill; original mask persists" }),
        /* @__PURE__ */ jsx9(Matrix, { label: "Prepared values before later centring/division", columns: [...numericNames, "sex"], rowLabels: ["observed309", "altered copy"], values: [[51, 18.8, 203, 4100, "male"], [51, 18.8, 203, 4e3, "male"]], missing: [[false, false, false, false, false], [false, false, false, true, false]] })
      ] });
      break;
    case "D03":
      caption = "Raw physical measurements and query-centred raw displacements.";
      body = /* @__PURE__ */ jsx9(DistanceView, { raw: true, divisors: [1, 1] });
      break;
    case "D04":
      caption = "Dividing by1 mm and100 g changes both squared contributions; circles retain their complete true radii.";
      body = /* @__PURE__ */ jsx9(DistanceView, {});
      break;
    case "D05":
      caption = "Five training values determine four different fitted rulers; later150 is transformed without refitting.";
      body = /* @__PURE__ */ jsx9(RulerView, {});
      break;
    case "D06":
      caption = "A zero measured spread stores divisor1; future9 becomes2, while an all-missing column has no fitted median.";
      body = /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsx9(Cells, { names: ["train0", "train1", "train2"], values: [7, 7, 7] }),
        /* @__PURE__ */ jsx9("div", { className: "prep-flow-arrow", children: "\u2193 subtract7; measured spread0 \u2192 stored divisor1" }),
        /* @__PURE__ */ jsx9(NumberLine, { values: [0, 0, 0, 2], min: -0.5, max: 2.5, marks: [{
          id: "query9\u21922",
          value: 2
        }], label: "Output coordinate" }),
        /* @__PURE__ */ jsx9(Matrix, { columns: ["unsupported training column"], values: [[null], [null], [null]], label: "All-missing is a separate refusal, not median0" })
      ] });
      break;
    case "D07":
      caption = "Two input magnitudes share one direction; normalization maps both to the same point on a true unit circle.";
      body = /* @__PURE__ */ jsxs7("div", { className: "prep-columns", children: [
        /* @__PURE__ */ jsx9(Plot, { equal: true, label: "Vectors on the same input ray", xDomain: [-1, 9], yDomain: [-1, 9], xLabel: "x0", yLabel: "x1", paths: [{
          values: [[0, 0], [6, 8]],
          arrow: true,
          color: ink.B
        }, {
          values: [[0, 0], [3, 4]],
          arrow: true,
          color: ink.A
        }], points: [{
          id: "[3,4]",
          x: 3,
          y: 4,
          color: ink.A
        }, {
          id: "[6,8]",
          x: 6,
          y: 8,
          color: ink.B
        }] }),
        /* @__PURE__ */ jsxs7("div", { children: [
          /* @__PURE__ */ jsx9(Plot, { equal: true, label: "Unit direction; zero has no direction", xDomain: [-1.3, 1.3], yDomain: [-1.3, 1.3], xLabel: "normalized x0", yLabel: "normalized x1", circles: [{
            radius: 1
          }], paths: [{
            values: [[0, 0], [0.6, 0.8]],
            arrow: true
          }], points: [{
            id: "[.6,.8]",
            x: 0.6,
            y: 0.8
          }, {
            id: "zero",
            x: 0,
            y: 0,
            color: ink.muted
          }] }),
          /* @__PURE__ */ jsx9(Table, { headers: ["input", "norm", "output"], rows: [["[3,4]", 5, "[.6,.8]"], ["[6,8]", 10, "[.6,.8]"], ["[0,0]", 0, "left zero; direction undefined"]] })
        ] })
      ] });
      break;
    case "D08":
      caption = "Centring turns three nonzeros into nine; reciprocal coefficient changes preserve prediction and change the penalty.";
      body = /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsxs7("div", { className: "prep-columns", children: [
          /* @__PURE__ */ jsx9(Matrix, { columns: ["c0", "c1", "c2"], values: [[0, 0, 3], [1, 0, 0], [0, 2, 0]], label: "Sparse input:3 nonzeros" }),
          /* @__PURE__ */ jsx9(Matrix, { columns: ["c0\u22121/3", "c1\u22122/3", "c2\u22121"], values: [[-1 / 3, -2 / 3, 2], [2 / 3, -2 / 3, -1], [-1 / 3, 4 / 3, -1]], label: "Centred result:9 nonzeros" })
        ] }),
        /* @__PURE__ */ jsx9(Table, { headers: ["state", "x", "w", "dot", "squared coefficient norm"], rows: [["original", "[1,100]", "[1,.01]", 2, 1.0001], ["x/s, sw", "[1,1]", "[1,1]", 2, 2]] })
      ] });
      break;
    case "D09":
      caption = "Full one-hot labels are three true coordinate endpoints; the 2D projection is a schematic of3D geometry.";
      body = /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsx9(Matrix, { label: "Exact three-coordinate vectors", columns: ["red", "green", "blue"], rowLabels: ["red", "green", "blue"], values: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] }),
        /* @__PURE__ */ jsx9(Plot, { equal: true, label: "Schematic projection of three orthogonal coordinate endpoints; exact distances in table", xDomain: [-1.4, 1.4], yDomain: [-1.3, 1.5], xLabel: "projected coordinate plane", yLabel: "3D schematic", points: [{
          id: "red",
          x: 0,
          y: 1.1
        }, {
          id: "green",
          x: -1,
          y: -0.6,
          color: ink.A
        }, {
          id: "blue",
          x: 1,
          y: -0.6,
          color: ink.B,
          dx: -44
        }], paths: [{
          values: [[0, 0], [0, 1.1]],
          arrow: true
        }, {
          values: [[0, 0], [-1, -0.6]],
          arrow: true,
          color: ink.A
        }, {
          values: [[0, 0], [1, -0.6]],
          arrow: true,
          color: ink.B
        }, {
          values: [[0, 1.1], [-1, -0.6], [1, -0.6], [0, 1.1]],
          dashed: true,
          color: ink.muted
        }] }),
        /* @__PURE__ */ jsx9(Table, { headers: ["pair", "exact Euclidean distance"], rows: [["red\u2013green", Math.SQRT2], ["red\u2013blue", Math.SQRT2], ["green\u2013blue", Math.SQRT2]] })
      ] });
      break;
    case "D10":
      caption = "Dropping red creates an origin and unequal distances; full indicators also sum to the intercept column.";
      body = /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsx9(Plot, { equal: true, label: "Dropped-red coordinates", xDomain: [-0.25, 1.3], yDomain: [-0.25, 1.3], xLabel: "green coordinate", yLabel: "blue coordinate", points: [{
          id: "red",
          x: 0,
          y: 0
        }, {
          id: "green",
          x: 1,
          y: 0,
          color: ink.A,
          dx: -45,
          dy: 22
        }, {
          id: "blue",
          x: 0,
          y: 1,
          color: ink.B
        }], paths: [{
          values: [[0, 0], [1, 0], [0, 1], [0, 0]],
          color: ink.muted
        }] }),
        /* @__PURE__ */ jsx9(Table, { headers: ["edge", "distance"], rows: [["red\u2192green", 1], ["red\u2192blue", 1], ["green\u2192blue", Math.SQRT2]] }),
        /* @__PURE__ */ jsx9(Matrix, { columns: ["intercept", "red", "green", "blue", "sum indicators"], rowLabels: ["red", "green", "blue"], values: [[1, 1, 0, 0, 1], [1, 0, 1, 0, 1], [1, 0, 0, 1, 1]], label: "Full design dependence: intercept equals indicator sum" })
      ] });
      break;
    case "D11":
      caption = "A missing value, known rare label and unknown label take explicitly different vocabulary paths.";
      body = /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsx9(CategoryView, {}),
        /* @__PURE__ */ jsx9(Table, { headers: ["query", "policy", "output @missing,@rare,a"], rows: [["None", "any", "[1,0,0]"], ["b", "known rare", "[0,1,0]"], ["new", "all-zero", "[0,0,0]"], ["new", "error", "refused"], ["new", "infrequent exists", "[0,1,0]"]] })
      ] });
      break;
    case "D12":
      caption = "Ordered0/1/2 codes add equal spacing; a nominal permutation changes code distances.";
      body = /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsx9(NumberLine, { values: [0, 1, 2], min: -0.5, max: 2.5, label: "small0 \xB7 medium1 \xB7 large2: order plus equal adjacent spacing" }),
        /* @__PURE__ */ jsx9(Table, { headers: ["pair", "nominal assignment R0/G1/B2", "permuted R0/G2/B1", "full one-hot"], rows: [["R\u2013G", 1, 2, Math.SQRT2], ["R\u2013B", 2, 1, Math.SQRT2], ["G\u2013B", 1, 1, Math.SQRT2]] })
      ] });
      break;
    case "D13":
      caption = "The two fills at15 retain the original mask; identical numbers need not share an observation history.";
      body = /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsx9(Matrix, { columns: ["input", "original mask M", "completed"], values: [[10, 0, 10], [20, 0, 20], [null, 1, 15], [null, 1, 15]], missing: [[false, false, false], [false, false, false], [true, false, true], [true, false, true]], label: "Observed median(10+20)/2=15" }),
        /* @__PURE__ */ jsx9(NumberLine, { values: [10, 20], min: 5, max: 25, label: "Observed measurements" }),
        /* @__PURE__ */ jsx9(NumberLine, { values: [10, 20, 15, 15], min: 5, max: 25, colors: [ink.A, ink.A, ink.estimated, ink.estimated], label: "Completed coordinates; narrower empirical spread" })
      ] });
      break;
    case "D14":
      caption = "The same recorded mask is compatible with different assumed generators; the mask alone does not identify one.";
      body = /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsx9("div", { className: "prep-columns", children: ["MCAR independent coin", "MAR observed station", "MNAR unobserved weight"].map((name, mechanism) => /* @__PURE__ */ jsx9("div", { children: /* @__PURE__ */ jsx9(Matrix, { columns: ["station", "recorded weight", "mask M", "assumed P(M=1)"], values: ["a", "b", "a", "b"].map((station, i) => [station, [10, null, 20, null][i], i % 2, mechanism === 0 ? ".2" : mechanism === 1 ? station === "a" ? ".1" : ".6" : i % 2 ? "depends on hidden weight" : i === 0 ? ".1" : ".6"]), label: `${name}: same recorded observations and gaps` }) }, name)) }),
        /* @__PURE__ */ jsx9(Table, { headers: ["assumed generator", "conditioning input", "specified chance of a gap"], rows: [["MCAR independent coin", "none", ".2 for each eligible weight cell"], ["MAR observed station", "a / b", ".1 / .6"], ["MNAR unobserved weight", "weight\u226415 / >15", ".1 / .6"], ["structural not applicable", "a different recorded state", "not a missing measurement drawn by these examples"]] }),
        /* @__PURE__ */ jsx9("p", { children: "These probabilities specify three hypothetical mechanisms. They are not estimated from the table or certified by arrows. Under MNAR, the probability for an unrecorded weight cannot be read from its blank cell." })
      ] });
      break;
    case "D15":
      caption = "Only jointly observed coordinates contribute; distance-defined and target-eligible are separate flags.";
      body = /* @__PURE__ */ jsx9(DonorView, { stage: "overlap" });
      break;
    case "D16":
      caption = "Overlap rescaling gives squared distances7.5,3,12; the axis displays their square roots.";
      body = /* @__PURE__ */ jsx9(DonorView, { stage: "distance" });
      break;
    case "D17":
      caption = "The two selected target cells receive equal weight; removed-target and no-overlap cases have explicit alternatives.";
      body = /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsx9(DonorView, {}),
        /* @__PURE__ */ jsx9(Table, { headers: ["changed case", "selected target cells", "estimate"], rows: [["D2 target removed", "D1=100,D3=500", 300], ["query overlap all missing", "all observed target values100/300/500", 300], ["all donor targets missing", "none", "refused; no evidence"]] })
      ] });
      break;
    case "D18":
      caption = "Training cells reduce to saved arrays; later query cells never return to these reductions.";
      body = /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsx9(Matrix, { columns: ["n0", "n1", "n2", "category"], values: [[10, 100, 7, "b"], [20, null, 7, "a"], [30, 300, 7, null], [null, 500, 7, "a"]], label: "Four P1 training rows" }),
        /* @__PURE__ */ jsx9("div", { className: "prep-flow-arrow", children: "\u2193 observed medians; fill; population means/scales; sorted vocabulary" }),
        /* @__PURE__ */ jsx9(Table, { headers: ["saved array", "complete entries"], rows: Object.entries(smallFit).map(([name, values]) => [name, values.map((value) => fmt(value, 10)).join(", ")]) })
      ] });
      break;
    case "D19":
      caption = "P1 joins3 numeric and3 category coordinates; the real penguin example explicitly changes to4+3=7.";
      body = /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsx9(SmallPreparationView, {}),
        /* @__PURE__ */ jsx9("p", { children: "The next schema has four measurements, so its output has seven positions." }),
        /* @__PURE__ */ jsx9(RealPreparationView, {})
      ] });
      break;
    case "D20":
      caption = "Fresh training rows fit arrays; held-out rows transform through saved state, without a return path.";
      body = /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsx9("div", { className: "prep-fitting-boundary", children: /* @__PURE__ */ jsx9(Matrix, { columns: ["n0", "n1", "n2", "category"], values: [[10, 100, 7, "b"], [20, null, 7, "a"], [30, 300, 7, null], [null, 500, 7, "a"]], label: "P4 fitting boundary: only these four training rows enter reductions" }) }),
        /* @__PURE__ */ jsx9("div", { className: "prep-flow-arrow", children: "\u2193 fit once, save state" }),
        /* @__PURE__ */ jsx9(Table, { headers: ["saved state outside the fitting boundary", "entries"], rows: Object.entries(smallFit).map(([name, values]) => [name, values.map((value) => fmt(value)).join(", ")]) }),
        /* @__PURE__ */ jsx9("div", { className: "prep-flow-arrow", children: "\u2193 transform later row [30, missing, missing], category a" }),
        /* @__PURE__ */ jsx9(Cells, { label: "Complete P4 output: original six coordinates then all three original-mask indicators", names: ["n0", "n1", "n2", "a", "b", "not_recorded", "M0", "M1", "M2"], values: [...prepare([30, null, null], "a").output, 0, 1, 1], mask: [false, true, true, false, false, false, false, false, false] }),
        /* @__PURE__ */ jsxs7("p", { children: [
          /* @__PURE__ */ jsx9("span", { "aria-hidden": "true", children: "\u219B " }),
          "The later row has no return path into fitting. M2=1 is present even though n2 had no gaps in training; a missing-only-at-fit indicator scheme would omit that position."
        ] }),
        /* @__PURE__ */ jsx9(Matrix, { columns: ["fold0 status", "fold1 status"], rowLabels: ["row0", "row1", "row2", "row3"], values: [["held", "train"], ["train", "held"], ["held", "train"], ["train", "held"]], label: "A separate two-fold illustration: each fold requires fresh training state" }),
        /* @__PURE__ */ jsx9(Table, { headers: ["operation", "permitted data dependency", "held-row effect on fitted arrays"], rows: [["fit inside fold0", "rows1,3", "none"], ["fit inside fold1", "rows0,2", "none"], ["transform a new row", "saved medians/means/scales/vocabulary", "none; forbidden new-row\u2192fit path"]] })
      ] });
      break;
    case "D21":
      caption = "One retained258/86 split, one fixed k=5 rule; these are observed counts, not a universal ordering.";
      body = /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsx9(Bars, { label: "Exact train and held-out partition", maximum: 344, rows: [{
          name: "training rows",
          value: 258
        }, {
          name: "held-out rows",
          value: 86,
          color: ink.B
        }] }),
        /* @__PURE__ */ jsx9(Bars, { label: "Correct out of86 on the same retained split", maximum: 86, rows: [{
          name: "majority baseline",
          value: 38,
          color: ink.muted
        }, ...saved.results.map((row) => ({
          name: row.method,
          value: row.correct
        }))] }),
        /* @__PURE__ */ jsx9(Table, { caption: "Retained confusion matrices; rows truth and columns predictions in Adelie/Chinstrap/Gentoo order", headers: ["method", "Adelie truth row", "Chinstrap truth row", "Gentoo truth row"], rows: saved.results.map((row) => [row.method, ...row.confusion.map((values) => values.join(", "))]) })
      ] });
      break;
    case "D22":
      caption = "Original row309 and an altered missing-mass copy share the same saved fit arrays.";
      body = /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsx9(RealPreparationView, {}),
        /* @__PURE__ */ jsx9(RealPreparationView, { altered: null })
      ] });
      break;
    case "D23":
      caption = "Source position, held-out order, truth and saved prediction are different columns; newline identity is provenance.";
      body = /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsx9(Table, { caption: "All86 retained held-out rows, not newly calculated predictions", headers: ["held-out order", "source position", "truth", "saved standard prediction"], rows: saved.scaled_inspection.test_source_rows.map((source, i) => [i, source, saved.scaled_inspection.truth[i], saved.scaled_inspection.predictions[i]]) }),
        /* @__PURE__ */ jsx9(Table, { headers: ["file role", "byte identity"], rows: [["historical LF executed input", "15241 bytes \xB7 f204db2c\u2026"], ["current CRLF download", "15586 bytes \xB779995be0\u2026"], ["relation", "exact CRLF\u2192LF normalization; same observations"]] })
      ] });
      break;
    default:
      throw Error(`Unknown core drawing ${id}`);
  }
  return /* @__PURE__ */ jsx9(Figure, { id, caption, children: body });
}

// docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/runtime-preview/DeeperFigures.jsx
import React3, { useId as useId3 } from "react";
import { Fragment as Fragment4, jsx as jsx10, jsxs as jsxs8 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsxs8(Fragment4, { children: [
    /* @__PURE__ */ jsx10(Plot, { label: `${method} actual transformation at lambda${lambda}`, xDomain: domain, yDomain: [Math.min(0, ...rows.map((row) => row[1]), result), Math.max(1, ...rows.map((row) => row[1]), result)], xLabel: "input x", yLabel: `${method} output`, paths: [{
      values: rows
    }], points: [{
      id: "x",
      x,
      y: result
    }] }),
    /* @__PURE__ */ jsx10(Table, { headers: ["method", "x", "lambda", "branch", "mapped coordinate"], rows: [[method, x, lambda, method === "BC" ? lambda === 0 ? "log x" : "(x^\u03BB\u22121)/\u03BB" : x >= 0 ? lambda === 0 ? "log1p(x)" : "positive power" : lambda === 2 ? "\u2212log1p(\u2212x)" : "negative power", result]] })
  ] });
}
function QuantileView({
  x = 3,
  output = "uniform"
}) {
  const state = quantileMap(x, output);
  return /* @__PURE__ */ jsxs8(Fragment4, { children: [
    /* @__PURE__ */ jsx10(Matrix, { label: "Saved empirical landmark state; ties occupy two probability positions", columns: ["input landmark", "reference probability"], values: state.landmarks.map((value, i) => [value, state.references[i]]) }),
    /* @__PURE__ */ jsx10(Plot, { label: "Fitted input-to-uniform map; exact tie midpoint and one-sided limits", xDomain: [Math.min(0, x), Math.max(105, x)], yDomain: [-0.1, 1.1], xLabel: "query x; training support1\u2026100", yLabel: "uniform coordinate u", paths: [{
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
    /* @__PURE__ */ jsx10(Cells, { names: ["query x", "u", output === "normal" ? "finite normal coordinate z" : "uniform output", "inverse support policy"], values: [x, state.probability, state.value, state.saturated ? x < 1 ? "endpoint1" : "endpoint100" : "within fitted support"] }),
    output === "normal" ? /* @__PURE__ */ jsx10(Plot, { label: "Normal inverse CDF after endpoint clipping epsilon1e-7", xDomain: [0, 1], yDomain: [-5.3, 5.3], xLabel: "uniform probability u", yLabel: "normal coordinate", paths: [{
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
  return /* @__PURE__ */ jsxs8(Fragment4, { children: [
    /* @__PURE__ */ jsx10(Plot, { equal: true, label: "True unit circle with both coordinate projections and chord", xDomain: [-1.3, 1.3], yDomain: [-1.3, 1.3], xLabel: "cos(2\u03C0t/period)", yLabel: "sin(2\u03C0t/period)", circles: [{
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
    /* @__PURE__ */ jsx10(Table, { headers: ["point", "angle degrees", "cos", "sin"], rows: [["A", first, ...a], ["B", second, ...b]] }),
    /* @__PURE__ */ jsxs8("p", { children: [
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
  return /* @__PURE__ */ jsxs8(Fragment4, { children: [
    /* @__PURE__ */ jsxs8("div", { className: "prep-operation", children: [
      /* @__PURE__ */ jsx10("svg", { viewBox: `0 0 370 ${Math.max(60, Math.ceil(count / 10) * 30 + 20)}`, role: "img", "aria-label": `${count} observed positive target cells, each equal to1; empty support has no target cells`, children: Array.from({
        length: count
      }, (_entry, i) => /* @__PURE__ */ jsxs8("g", { children: [
        /* @__PURE__ */ jsx10("circle", { cx: 22 + i % 10 * 36, cy: 22 + Math.floor(i / 10) * 30, r: "11", fill: "none", stroke: ink.A }),
        /* @__PURE__ */ jsx10("text", { x: 22 + i % 10 * 36, y: 27 + Math.floor(i / 10) * 30, textAnchor: "middle", children: "1" })
      ] }, i)) }),
      /* @__PURE__ */ jsx10("p", { children: count ? `${count} observed positive target ${count === 1 ? "cell" : "cells"}; each equals 1. Reduce them to sum ${total} and count ${count}.` : "No observed target cells support this category; use the donor prior." })
    ] }),
    /* @__PURE__ */ jsx10("div", { className: "prep-flow-arrow", children: "\u2193 sum and count" }),
    /* @__PURE__ */ jsx10(Cells, { names: ["target sum", "category count n", "prior \u03BC", "smoothing \u03B1", "mapped value"], values: [total, count, prior, alpha, value] }),
    /* @__PURE__ */ jsx10(NumberLine, { min: 0, max: 1, values: [prior, ...count ? [total / count] : []], marks: [{
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
    /* @__PURE__ */ jsx10(Bars, { maximum: 1, label: "Exact mixing weights", rows: [{
      name: "category n/(n+\u03B1)",
      value: count + alpha ? count / (count + alpha) : 0,
      color: ink.A
    }, {
      name: "prior \u03B1/(n+\u03B1)",
      value: count + alpha ? alpha / (count + alpha) : 1,
      color: ink.B
    }] }),
    /* @__PURE__ */ jsx10("p", { children: count ? "Smoothing changes the weights; it does not exclude a held row\u2019s target." : "No matching category support: declared fallback is the donor prior." })
  ] });
}
function CrossFitView({
  fixture = targetFixture,
  selected = 0
}) {
  const marker = useId3().replaceAll(":", ""), rows = crossFit(fixture), state = rows[selected];
  const height = Math.max(340, state.donors.length * 80 + 40);
  const priorY = height * 0.35, sumY = height - 50;
  const categoryColors = [ink.A, ink.B, "#e49b94", "#b8b8c6"];
  const categoryColor = (label) => categoryColors[Array.from(label).reduce((value, letter) => value + letter.codePointAt(0), 0) % categoryColors.length];
  return /* @__PURE__ */ jsxs8(Fragment4, { children: [
    /* @__PURE__ */ jsx10(Matrix, { columns: ["category", "target y", "fold", "OOF code"], values: fixture.categories.map((label, i) => [/* @__PURE__ */ jsx10("span", { style: {
      color: categoryColor(label)
    }, children: label || "(empty label)" }), fixture.targets[i], fixture.folds[i], rows[i].value]), highlightRows: [selected], label: "Complete six-row training table; category identity, fold digits and selection outline are separate cues" }),
    /* @__PURE__ */ jsx10("div", { className: "prep-operation", children: /* @__PURE__ */ jsxs8("svg", { viewBox: `0 0 440 ${height}`, role: "img", "aria-label": `All permitted targets${state.donors.join(",")} contribute to row${selected} prior; matching rows${state.matching.join(",")} also contribute to numerator`, children: [
      /* @__PURE__ */ jsx10("defs", { children: /* @__PURE__ */ jsx10("marker", { id: marker, viewBox: "0 0 10 10", refX: "9", refY: "5", markerWidth: "6", markerHeight: "6", orient: "auto", children: /* @__PURE__ */ jsx10("path", { d: "M0 0 L10 5 L0 10Z", fill: "context-stroke" }) }) }),
      state.donors.map((row, i) => /* @__PURE__ */ jsxs8("g", { children: [
        /* @__PURE__ */ jsx10("circle", { cx: "55", cy: 48 + i * 80, r: "18", fill: "none", stroke: ink.A }),
        /* @__PURE__ */ jsx10("text", { x: "55", y: 53 + i * 80, textAnchor: "middle", children: row }),
        /* @__PURE__ */ jsxs8("text", { x: "85", y: 53 + i * 80, children: [
          "y=",
          fixture.targets[row]
        ] }),
        /* @__PURE__ */ jsx10("path", { d: `M135 ${48 + i * 80} L265 ${priorY}`, stroke: ink.B, fill: "none", markerEnd: `url(#${marker})` }),
        state.matching.includes(row) ? /* @__PURE__ */ jsx10("path", { d: `M135 ${48 + i * 80} L180 ${sumY} L265 ${sumY}`, stroke: ink.query, fill: "none", markerEnd: `url(#${marker})` }) : null
      ] }, row)),
      /* @__PURE__ */ jsx10("circle", { cx: "300", cy: priorY, r: "32", fill: "#19191c", stroke: ink.B }),
      /* @__PURE__ */ jsx10("text", { x: "300", y: priorY + 5, textAnchor: "middle", children: "\u03BC" }),
      /* @__PURE__ */ jsx10("circle", { cx: "300", cy: sumY, r: "32", fill: "#19191c", stroke: ink.query }),
      /* @__PURE__ */ jsx10("text", { x: "300", y: sumY + 5, textAnchor: "middle", children: "\u03A3" })
    ] }) }),
    /* @__PURE__ */ jsx10("p", { children: "Purple edges reach \u03BC from every permitted donor. Amber edges reach the category sum \u03A3 only from matching donors. The held fold sends no edge into either reduction." }),
    /* @__PURE__ */ jsx10(Table, { headers: ["selected row", "permitted donors", "same-category donors", "prior", "numerator", "denominator", "code"], rows: [[selected, state.donors.join(","), state.matching.join(",") || "none", state.prior, state.total + 2 * state.prior, state.count + 2, state.value]] }),
    /* @__PURE__ */ jsx10("p", { children: "Every other-fold donor remains in the prior, including same-category donors." })
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
  return /* @__PURE__ */ jsxs8(Fragment4, { children: [
    /* @__PURE__ */ jsx10(Table, { caption: "Declared constructed projection; distinct from the ordinary hash function", headers: ["token", "count", "bucket", "sign", "signed contribution"], rows: ["apple", "pear", "banana"].map((token, i) => [token, counts[i], buckets[i], signs[i], counts[i] * signs[i]]) }),
    /* @__PURE__ */ jsx10(Matrix, { columns: ["apple", "pear", "banana"], rowLabels: ["bucket0", "bucket1"], values: [0, 1].map((bucket) => counts.map((_count, i) => buckets[i] === bucket ? signs[i] : 0)), label: "Projection matrix: one signed nonzero per token column" }),
    /* @__PURE__ */ jsx10("div", { className: "prep-flow-arrow", children: "\u2193 sparse accumulation into bucket coordinates" }),
    /* @__PURE__ */ jsx10(Cells, { names: ["bucket0", "bucket1"], values: output })
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
  return /* @__PURE__ */ jsxs8(Fragment4, { children: [
    /* @__PURE__ */ jsxs8("div", { className: "prep-columns", children: [
      /* @__PURE__ */ jsx10(Matrix, { columns: ["a", "b"], values: input, label: "Original observations; original missing mask remains fixed" }),
      /* @__PURE__ */ jsx10(Matrix, { columns: ["a", "b"], values: current, missing: mask, highlightRows: model?.observed || [], label: turn ? `Turn${turn}: observed target rows outlined, original gaps hatched` : initialLabel })
    ] }),
    model ? /* @__PURE__ */ jsxs8(Fragment4, { children: [
      /* @__PURE__ */ jsx10(Table, { headers: ["observed response row", "intercept input", `current predictor${model.other}`, "original response"], rows: model.observed.map((row, i) => [row, 1, model.design[i], model.response[i]]) }),
      /* @__PURE__ */ jsx10(Cells, { names: ["coefficient", "unpenalized intercept", "alpha", "target column"], values: [model.coefficient, model.intercept, 1, model.target] }),
      /* @__PURE__ */ jsx10(Plot, { label: "Current conditional regression: observed responses, fitted line, residuals and original missing target estimates", xDomain: predictorRange, yDomain: [Math.min(...model.response, ...predictorRange.map(fitAt)) - 1, Math.max(...model.response, ...predictorRange.map(fitAt)) + 1], xLabel: `current predictor${model.other}`, yLabel: `target${model.target}; observed or estimated`, paths: [{
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
      /* @__PURE__ */ jsx10(Table, { caption: "Apply the saved linear expression only to original target gaps", headers: ["row", "predictor", "coefficient \xD7 predictor", "+ intercept", "new estimate"], rows: gaps.map((row) => [row, current[row][model.other], model.coefficient * current[row][model.other], model.intercept, current[row][model.target]]) }),
      /* @__PURE__ */ jsx10("p", { children: "Only originally missing target cells are replaced. Predictors may already be estimates from the previous column update. Purple segments show residuals of the observed responses; amber marks are estimates, not observed fitting responses." })
    ] }) : /* @__PURE__ */ jsx10(Cells, { names: ["median a", "median b"], values: state.medians }),
    /* @__PURE__ */ jsxs8("p", { children: [
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
  return /* @__PURE__ */ jsxs8(Fragment4, { children: [
    /* @__PURE__ */ jsx10(Table, { headers: ["analysis", "Q (estimate units)", "U (squared estimate units)"], rows: estimates.map((value, i) => [i + 1, value, variances[i]]) }),
    /* @__PURE__ */ jsx10(Plot, { label: "Each estimate with a segment extending one within-analysis standard error in either direction; these are not confidence intervals", xDomain: [Math.min(...intervals.flat()) - 1, Math.max(...intervals.flat()) + 1], yDomain: [0, estimates.length + 1], xLabel: "estimate units; segment Q \xB1 \u221AU", yLabel: "analysis identity", paths: intervals.map((values, i) => ({
      values: [[values[0], i + 1], [values[1], i + 1]],
      color: ink.A
    })), points: estimates.map((value, i) => ({
      id: `analysis${i + 1}`,
      x: value,
      y: i + 1
    })) }),
    /* @__PURE__ */ jsx10("p", { children: "The segment half-length is \u221AU, measured in estimate units. It shows each analysis\u2019s uncertainty separately from variation between estimates." }),
    /* @__PURE__ */ jsx10(NumberLine, { values: estimates, marks: [{
      id: "mean Q",
      value: state.estimate
    }], label: "Estimate axis; variances are not lengths on this axis" }),
    /* @__PURE__ */ jsx10(Bars, { label: "Additive variance components in squared estimate units", rows: [{
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
    /* @__PURE__ */ jsx10(Cells, { names: ["pooled estimate", "total variance T", "SE=\u221AT (estimate units)"], values: [state.estimate, state.total, state.standardError] })
  ] });
}
function DeeperFigure({
  id
}) {
  let body, caption;
  switch (id) {
    case "D24":
      caption = "Equal input ratios become equal log differences; zero and negatives are outside the log domain.";
      body = /* @__PURE__ */ jsxs8(Fragment4, { children: [
        /* @__PURE__ */ jsx10(NumberLine, { values: [1, 10, 100], min: 0, max: 105, label: "Positive original values" }),
        /* @__PURE__ */ jsx10(NumberLine, { values: [0, Math.log(10), Math.log(100)], min: -0.2, max: 5, label: "Log coordinates: equal successive differences ln10" }),
        /* @__PURE__ */ jsx10(Plot, { label: "Natural logarithm on positive inputs only", xDomain: [0, 105], yDomain: [-2.5, 5], xLabel: "x>0", yLabel: "ln x", paths: [{
          values: sample(0.1, 100).map((x) => [x, Math.log(x)])
        }], points: [1, 10, 100].map((x, i) => ({
          id: String(x),
          x,
          y: Math.log(x),
          dx: i === 2 ? -35 : 10
        })) })
      ] });
      break;
    case "D25":
      caption = "The Yeo\u2013Johnson sign branch and lambda boundary determine the actual expression; Box\u2013Cox has a separate positive domain.";
      body = /* @__PURE__ */ jsxs8(Fragment4, { children: [
        /* @__PURE__ */ jsx10(PowerView, { lambda: 2 }),
        /* @__PURE__ */ jsx10(Table, { headers: ["branch fixture", "result"], rows: [["YJ\u22123,\u03BB0", -7.5], ["YJ\u22123,\u03BB1", -3], ["YJ\u22123,\u03BB2", -Math.log(4)], ["BCx\u22640", "refused"], ["BCx3,\u03BB1", 2]] })
      ] });
      break;
    case "D26": {
      caption = "The profile curve is calculated from transformed variance and Jacobian on five declared training values.";
      const values = [1, 2, 4, 10, 30], lambda = -0.146859;
      const curve = sample(-3, 3).map((x) => [x, profile(values, x, "BC").total]), selected = profile(values, lambda, "BC");
      body = /* @__PURE__ */ jsxs8(Fragment4, { children: [
        /* @__PURE__ */ jsx10(Cells, { names: values.map((_v, i) => `training${i}`), values }),
        /* @__PURE__ */ jsx10(Plot, { label: "Actual Box\u2013Cox profile objective over bounded candidates\u22123\u20263", xDomain: [-3, 3], yDomain: [Math.min(...curve.map((row) => row[1])) - 1, Math.max(...curve.map((row) => row[1])) + 1], xLabel: "candidate lambda", yLabel: "profile objective (higher is better)", paths: [{
          values: curve
        }], points: [{
          id: "saved \u03BB",
          x: lambda,
          y: selected.total
        }] }),
        /* @__PURE__ */ jsx10(Table, { headers: ["saved \u03BB (rounded)", "variance", "\u2212n/2 log variance", "Jacobian", "sum"], rows: [[lambda, selected.variance, selected.varianceTerm, selected.jacobian, selected.total]] }),
        /* @__PURE__ */ jsx10("p", { children: "Saved optimum is the retained P7 bounded-search result; curve points are direct objective evaluations. Bounds\u22123\u20263 and finite search status do not prove a global optimum outside the searched domain." })
      ] });
      break;
    }
    case "D27":
      caption = "Saved tied landmarks map3 to.625; endpoint saturation loses the magnitude beyond fitted support.";
      body = /* @__PURE__ */ jsx10(QuantileView, { output: "normal" });
      break;
    case "D28":
      caption = "Learned edges and membership retain their actual count; ties merge four requested quantile bins to three.";
      body = /* @__PURE__ */ jsxs8(Fragment4, { children: [
        /* @__PURE__ */ jsx10(NumberLine, { values: [1, 2, 2, 4, 100], min: 0, max: 105, marks: [1, 25.75, 50.5, 75.25, 100].map((value, i) => ({
          id: `u${i}`,
          value
        })), label: "Uniform edges, four intervals" }),
        /* @__PURE__ */ jsx10(NumberLine, { values: [1, 2, 2, 4, 100], min: 0, max: 105, marks: [1, 2, 4, 100].map((value, i) => ({
          id: `q${i}`,
          value
        })), label: "Quantile unique edges, three effective intervals" }),
        /* @__PURE__ */ jsx10(Table, { headers: ["policy", "edges", "x=2 membership", "one-hot"], rows: [["quantile, right insertion", "1,2,4,100", 1, "[0,1,0]"], ["uniform", "1,25.75,50.5,75.25,100", 0, "[1,0,0,0]"]] }),
        /* @__PURE__ */ jsx10(NumberLine, { values: [0, 1, 2, 8, 9, 10], min: -0.5, max: 10.5, marks: [{
          id: "c0",
          value: 1
        }, {
          id: "edge",
          value: 5
        }, {
          id: "c1",
          value: 9
        }], label: "Supplied-centre Lloyd: init0/10 \u2192 centres1/9 \u2192 midpoint5" }),
        /* @__PURE__ */ jsx10("p", { children: "KMeans owns supplied centres, n_init=1 and Lloyd stopping settings. The separate KBins route chooses its own initialization." })
      ] });
      break;
    case "D29": {
      caption = "A polynomial design row is evaluated from explicit exponent pairs; the ab response varies over two input axes.";
      const xs = [0, 1, 2, 3, 4];
      body = /* @__PURE__ */ jsxs8(Fragment4, { children: [
        /* @__PURE__ */ jsx10(Matrix, { columns: ["1", "a", "b", "a\xB2", "ab", "b\xB2"], rowLabels: ["power a", "power b", "a2,b3 values"], values: [[0, 1, 0, 2, 1, 0], [0, 0, 1, 0, 1, 2], [1, 2, 3, 4, 6, 9]], label: "Multi-index powers and complete numeric feature row" }),
        /* @__PURE__ */ jsx10(Plot, { label: "Actual ab contour curves for products2,4,6,8,12", xDomain: [0, 4.5], yDomain: [0, 4.5], xLabel: "a", yLabel: "b", paths: [2, 4, 6, 8, 12].map((value, i) => ({
          values: sample(0.1, 4).map((a) => [a, value / a]).filter((row) => row[1] <= 4.5),
          color: i % 2 ? ink.B : ink.A
        })), points: [{
          id: "ab=6",
          x: 2,
          y: 3
        }] }),
        /* @__PURE__ */ jsx10(Table, { headers: ["a / b", ...xs], rows: xs.map((a) => [a, ...xs.map((b) => a * b)]), caption: "Exact ab response grid; interaction-only keepsab but excludesa\xB2,b\xB2" })
      ] });
      break;
    }
    case "D30": {
      caption = "Local basis supports overlap; all active degree1/2 curves feed their banded design rows and weighted response.";
      const colors2 = [ink.query, ink.A, ink.B, "#e49b94"];
      body = /* @__PURE__ */ jsxs8(Fragment4, { children: [
        /* @__PURE__ */ jsx10(Plot, { label: "Degree-one weighted response:2B0+4B1+B2", xDomain: [-0.1, 2.1], yDomain: [0, 4.5], xLabel: "input x", yLabel: "weighted response", paths: [{
          values: sample(0, 2).map((x) => [x, splineRow(x, 1).row.reduce((total, value, j) => total + value * [2, 4, 1][j], 0)])
        }], points: [{
          id: "x.5\u21923",
          x: 0.5,
          y: 3
        }] }),
        /* @__PURE__ */ jsx10(Table, { caption: "Degree-zero support intervals feeding the degree-one recurrence at x=.5", headers: ["basis", "half-open support", "B_i,0(.5)"], rows: [[0, "[-1,0)", 0], [1, "[0,1)", 1], [2, "[1,2)", 0], [3, "[2,3)", 0]] }),
        [1, 2].map((degree) => {
          const selected = splineRow(0.5, degree), width = selected.row.length;
          return /* @__PURE__ */ jsxs8("div", { children: [
            /* @__PURE__ */ jsx10(NumberLine, { values: selected.knots, min: selected.knots[0] - 0.2, max: selected.knots.at(-1) + 0.2, label: `Complete degree${degree} knot vector` }),
            /* @__PURE__ */ jsx10(Plot, { label: `All${width} degree${degree} basis curves on fitted base interval0\u20262`, xDomain: [-0.1, 2.1], yDomain: [-0.05, 1.1], xLabel: "x; selected.5", yLabel: "basis weight B_j(x)", paths: Array.from({
              length: width
            }, (_, j) => ({
              values: sample(0, 2).map((x) => [x, splineRow(x, degree).row[j]]),
              color: colors2[j]
            })), points: selected.row.map((value, j) => ({
              x: 0.5,
              y: value,
              color: colors2[j],
              radius: 4
            })) }),
            /* @__PURE__ */ jsx10(Cells, { names: selected.row.map((_v, j) => `B${j}(.5)`), values: selected.row }),
            /* @__PURE__ */ jsxs8("p", { children: [
              "Degree",
              degree,
              " row sum=",
              fmt(selected.row.reduce((a, b) => a + b, 0)),
              "; weights are local on this fitted interval."
            ] })
          ] }, degree);
        }),
        /* @__PURE__ */ jsx10(Table, { headers: ["degree1 operation", "basis row", "weights", "response"], rows: [["x.5 inside", "[.5,.5,0]", "[2,4,1]", 3], ["x2 right boundary", "[0,0,1]", "[2,4,1]", 1], ["x2.5 constant", "[0,0,1]", "[2,4,1]", 1], ["x2.5 linear exterior", "[0,\u2212.5,1.5]", "[2,4,1]", -0.5], ["x2.5 error policy", "refused", "", "outside fitted interval"]] }),
        /* @__PURE__ */ jsx10("p", { children: "Linear extrapolation uses the interior left derivative at the right boundary and can produce negative basis entries. Degree-zero ordinary outside-constant comparison was unsupported in the observed sklearn1.9.1 run; its actual failed attempts remain preserved." })
      ] });
      break;
    }
    case "D31":
      caption = "350\xB0 and10\xB0 are close on the circle; both sine and cosine are needed to distinguish positions.";
      body = /* @__PURE__ */ jsx10(CycleView, {});
      break;
    case "D32":
      caption = "A positive singleton shrinks toward the prior more than100 positive observations; smoothing does not exclude target information.";
      body = /* @__PURE__ */ jsxs8("div", { className: "prep-columns", children: [
        /* @__PURE__ */ jsx10(SmoothingView, {}),
        /* @__PURE__ */ jsx10(SmoothingView, { count: 100 })
      ] });
      break;
    case "D33":
      caption = "All other-fold targets enter the prior; only matching-category donors additionally enter the category sum.";
      body = /* @__PURE__ */ jsx10(CrossFitView, {});
      break;
    case "D34":
      caption = "OOF training, full-fit inference and chronological warm-up have different admissible row sets.";
      body = /* @__PURE__ */ jsxs8(Fragment4, { children: [
        /* @__PURE__ */ jsx10(Matrix, { columns: ["category", "OOF\u03B12", "OOF\u03B10", "full\u03B12", "full\u03B10"], values: targetFixture.categories.map((label, i) => [label, crossFit()[i].value, crossFit(targetFixture, 0)[i].value, [0.75, 0.75, 0.25, 0.25, 0.5, 0.5][i], [1, 1, 0, 0, 0.5, 0.5][i]]), label: "Same six identities; distinct training/inference contracts" }),
        /* @__PURE__ */ jsx10(Table, { headers: ["row time", "coverage", "allowed earlier donors", "aligned training code/target"], rows: [[0, 0, "none", "uncovered warm-up"], [1, 0, "none", "uncovered warm-up"], [2, 1, "0,1", "1 /0"], [3, 1, "0,1", "1 /0"], [4, 1, "0,1,2,3", ".5 /1"], [5, 1, "0,1,2,3", ".5 /0"]] }),
        /* @__PURE__ */ jsx10("p", { children: "Manual past-only encoding drops uncovered warm-up rows and aligns downstream targets. Current TargetEncoder cross-fit validation requires full coverage; group and time donor admissibility need explicit separate design." })
      ] });
      break;
    case "D35":
      caption = "Signed contributions add into the declared projection; the actual ordinary mapping is a separate width4 fixture.";
      body = /* @__PURE__ */ jsxs8(Fragment4, { children: [
        /* @__PURE__ */ jsx10(HashView, {}),
        /* @__PURE__ */ jsx10(Matrix, { label: "Actual retained FeatureHasher width4 mapping, separate from the constructed width2 map", columns: ["bucket0", "bucket1", "bucket2", "bucket3"], rowLabels: ["apple", "pear", "banana"], values: [[1, 0, 0, 0], [0, 0, 0, -1], [0, -1, 0, 0]] })
      ] });
      break;
    case "D36":
      caption = "Two different sparse bags collide at exactly the same output; signed hashing does not make the map invertible.";
      body = /* @__PURE__ */ jsxs8("div", { className: "prep-columns", children: [
        /* @__PURE__ */ jsx10(HashView, {}),
        /* @__PURE__ */ jsx10(HashView, { counts: [2, 0, 2] })
      ] });
      break;
    case "D37":
      caption = "Only the two original missing cells are initialized; row2 a=3 stays observed.";
      body = /* @__PURE__ */ jsx10(ConditionalView, {});
      break;
    case "D38":
      caption = "The first conditional regression supplies missinga; the next regression uses that newly estimated predictor.";
      body = /* @__PURE__ */ jsxs8(Fragment4, { children: [
        /* @__PURE__ */ jsx10(ConditionalView, { turn: 1 }),
        /* @__PURE__ */ jsx10(ConditionalView, { turn: 2 })
      ] });
      break;
    case "D39": {
      caption = "Six fitted models are saved in order; new rows pass through them without refitting.";
      const state = conditionalTrace();
      body = /* @__PURE__ */ jsxs8(Fragment4, { children: [
        /* @__PURE__ */ jsx10(Table, { headers: ["turn", "target", "other feature", "coefficient", "intercept"], rows: state.trace.map((row) => [row.turn, row.target, row.other, row.coefficient, row.intercept]) }),
        [[3, null], [null, 6], [null, null]].map((query, i) => /* @__PURE__ */ jsx10(Matrix, { columns: ["a", "b"], rowLabels: ["median initialization", ...state.trace.map((row) => `saved turn${row.turn}`)], values: applyConditional(query, state), missing: Array.from({
          length: 7
        }, () => query.map((value) => value === null)), label: `Query${i}: ${query.map((value) => fmt(value)).join(", ")} \u2192 saved sequence` }, i)),
        /* @__PURE__ */ jsxs8("p", { children: [
          state.status,
          "; inference does not change the six saved arrays."
        ] })
      ] });
      break;
    }
    case "D40":
      caption = "Each actual P16 completion has its own analysis and variance; averaging data before analysis is a different operation.";
      body = /* @__PURE__ */ jsxs8(Fragment4, { children: [
        /* @__PURE__ */ jsx10("div", { className: "prep-columns", children: completionTables.map((values, i) => /* @__PURE__ */ jsxs8("div", { children: [
          /* @__PURE__ */ jsx10(Matrix, { columns: ["value"], values: values.map((value) => [value]), missing: [[false], [false], [true], [false], [true]], label: `Rounded simulated normal-model completion${i + 1}` }),
          /* @__PURE__ */ jsx10(Cells, { names: ["this Q", "this U"], values: [completionQ[i], completionU[i]] })
        ] }, i)) }),
        /* @__PURE__ */ jsx10(Table, { headers: ["square example", "input", "analysis"], rows: [["completion1", 0, 0], ["completion2", 2, 4], ["analyse then average", "", 2], ["average input then square", 1, 1]] }),
        /* @__PURE__ */ jsx10("p", { children: "Displayed matrices are the first three of five actual P16 draws; their own Q/U are retained. They do not carry the supplied U=4 from the separate pooling example." })
      ] });
      break;
    case "D41":
      caption = "Supplied scalar analyses illustrate pooling; the assumed delta shift describes sensitivity, not a confidence band.";
      body = /* @__PURE__ */ jsxs8(Fragment4, { children: [
        /* @__PURE__ */ jsx10(PoolView, {}),
        /* @__PURE__ */ jsx10(Plot, { label: "P16 fixed-draw sensitivity line baseline+.4delta; not an identified MNAR process or confidence interval", xDomain: [-2, 2], yDomain: [7.5, 10], xLabel: "assumed missing-cell delta", yLabel: "pooled mean", paths: [{
          values: [[-2, sensitivity(-2)], [0, sensitivity(0)], [2, sensitivity(2)]]
        }], points: [-2, 0, 2].map((x) => ({
          x,
          y: sensitivity(x)
        })) }),
        /* @__PURE__ */ jsx10(Table, { headers: ["assumed delta", "pooled mean"], rows: [-2, 0, 2].map((delta) => [delta, sensitivity(delta)]) })
      ] });
      break;
    default:
      throw Error(`Unknown deeper drawing ${id}`);
  }
  return /* @__PURE__ */ jsx10(Figure, { id, caption, children: body });
}

// docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/runtime-preview/PreparationFigures.jsx
import { jsx as jsx11 } from "react/jsx-runtime";
function PreparationFigure({
  id
}) {
  return Number(id.slice(1)) <= 23 ? /* @__PURE__ */ jsx11(CoreFigure, { id }) : /* @__PURE__ */ jsx11(DeeperFigure, { id });
}

// docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/runtime-preview/PreparationInvestigations.jsx
import React5, { useId as useId4, useState as useState4 } from "react";
import { Fragment as Fragment5, jsx as jsx12, jsxs as jsxs9 } from "react/jsx-runtime";
function Select({
  label,
  value,
  onChange,
  options
}) {
  const id = useId4();
  return /* @__PURE__ */ jsxs9("label", { className: "prep-control", htmlFor: id, children: [
    label,
    /* @__PURE__ */ jsx12("select", { id, value, onChange: (event) => onChange(event.target.value), children: options.map((option) => {
      const row = Array.isArray(option) ? option : [option, option];
      return /* @__PURE__ */ jsx12("option", { value: row[0], children: row[1] }, row[0]);
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
  const id = useId4(), errorId = `${id}-error`;
  return /* @__PURE__ */ jsxs9("label", { className: "prep-control", htmlFor: id, children: [
    label,
    /* @__PURE__ */ jsx12("input", { id, type: "text", inputMode: numeric ? "decimal" : void 0, value, "aria-invalid": Boolean(error), "aria-describedby": error ? errorId : void 0, onChange: (event) => onChange(event.target.value) }),
    error ? /* @__PURE__ */ jsx12("span", { id: errorId, className: "prep-error", children: error }) : null
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
  const id = useId4();
  return /* @__PURE__ */ jsxs9("div", { className: "prep-control", children: [
    /* @__PURE__ */ jsx12(Text, { label: `${label}${nullable ? ` (blank = ${blankMeaning})` : ""}`, value, onChange, numeric: true, error }),
    number !== null && !error ? /* @__PURE__ */ jsxs9(Fragment5, { children: [
      /* @__PURE__ */ jsxs9("label", { htmlFor: id, children: [
        label,
        " slider"
      ] }),
      /* @__PURE__ */ jsx12("input", { id, type: "range", min: minimum, max: maximum, step, value: number, onChange: (event) => onChange(event.target.value) })
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
    return /* @__PURE__ */ jsxs9("p", { role: "status", className: "prep-error", children: [
      "Current draft has no result: ",
      error.message
    ] });
  }
  return /* @__PURE__ */ jsx12("div", { className: "prep-current", "data-current-result": "", children: children(value) });
}
var ModelBoundary = class extends React5.Component {
  state = {
    error: null
  };
  static getDerivedStateFromError(error) {
    return {
      error
    };
  }
  render() {
    return this.state.error ? /* @__PURE__ */ jsxs9("p", { role: "status", className: "prep-error", children: [
      "Current inputs are refused: ",
      this.state.error.message
    ] }) : this.props.children;
  }
};
function SafeModel({
  identity,
  children
}) {
  return /* @__PURE__ */ jsx12(ModelBoundary, { children }, identity);
}
function Divisors() {
  const [bill, setBill] = useState4("1"), [mass, setMass] = useState4("100");
  const [actionError, setActionError] = useState4("");
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
  return /* @__PURE__ */ jsxs9(Fragment5, { children: [
    /* @__PURE__ */ jsx12(Current, { calculate: () => [parseDraft(bill, 0.1, 10), parseDraft(mass, 1, 500)], children: (values) => /* @__PURE__ */ jsx12(DistanceView, { divisors: values }) }),
    /* @__PURE__ */ jsxs9("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx12(NumberEditor, { label: "Bill divisor", minimum: 0.1, maximum: 10, value: bill, onChange: (value) => {
        setBill(value);
        setActionError("");
      } }),
      /* @__PURE__ */ jsx12(NumberEditor, { label: "Mass divisor", minimum: 1, maximum: 500, step: 1, value: mass, onChange: (value) => {
        setMass(value);
        setActionError("");
      } }),
      /* @__PURE__ */ jsx12("button", { type: "button", onClick: doubleBoth, children: "Double both divisors" })
    ] }),
    actionError ? /* @__PURE__ */ jsx12("p", { className: "prep-error", role: "status", children: actionError }) : null,
    /* @__PURE__ */ jsx12("p", { className: "prep-live", children: "Mass divisor1 restores the raw ranking. Common rescaling changes lengths while preserving ranking." })
  ] });
}
function PointEdit() {
  const [selected, setSelected] = useState4("A");
  const [drafts, setDrafts] = useState4(Object.fromEntries(Object.entries(points).map(([key, row]) => [key, row.map(String)])));
  const [actionError, setActionError] = useState4("");
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
  return /* @__PURE__ */ jsxs9(Fragment5, { children: [
    /* @__PURE__ */ jsx12(Current, { calculate: () => Object.fromEntries(Object.entries(drafts).map(([key, row]) => [key, [parseDraft(row[0], 0, 100), parseDraft(row[1], 0, 1e4)]])), children: (data) => /* @__PURE__ */ jsx12(DistanceView, { data }) }),
    /* @__PURE__ */ jsxs9("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx12(Select, { label: "Actual case to edit", value: selected, onChange: setSelected, options: ["Q", "A", "B"] }),
      /* @__PURE__ */ jsx12(NumberEditor, { label: `${selected} bill mm`, value: drafts[selected][0], onChange: (value) => update(0, value), minimum: 0, maximum: 100 }),
      /* @__PURE__ */ jsx12(NumberEditor, { label: `${selected} mass g`, value: drafts[selected][1], onChange: (value) => update(1, value), minimum: 0, maximum: 1e4, step: 1 }),
      /* @__PURE__ */ jsx12("button", { type: "button", onClick: translateAll, children: "Translate all: +1 mm, +10 g" })
    ] }),
    actionError ? /* @__PURE__ */ jsx12("p", { className: "prep-error", role: "status", children: actionError }) : null,
    /* @__PURE__ */ jsx12("p", { className: "prep-live", children: "Try A mass4400, or make A equal Q. Divisors remain1/100; circles use current values." })
  ] });
}
function RulerEdit() {
  const [last, setLast] = useState4("100"), [query, setQuery] = useState4("150"), [kind, setKind] = useState4("robust");
  return /* @__PURE__ */ jsxs9(Fragment5, { children: [
    /* @__PURE__ */ jsx12(Current, { calculate: () => [parseDraft(last, 0, 1e3), parseDraft(query, 0, 1500)], children: (values) => /* @__PURE__ */ jsx12(RulerView, { training: [1, 2, 3, 4, values[0]], query: values[1], selected: kind }) }),
    /* @__PURE__ */ jsxs9("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx12(NumberEditor, { label: "Last training value", minimum: 0, maximum: 1e3, step: 1, value: last, onChange: setLast }),
      /* @__PURE__ */ jsx12(Select, { label: "Fitted ruler", value: kind, onChange: setKind, options: ["standard", "minmax", "robust", "maxabs"] }),
      /* @__PURE__ */ jsx12(NumberEditor, { label: "Later query", minimum: 0, maximum: 1500, step: 1, value: query, onChange: setQuery })
    ] }),
    /* @__PURE__ */ jsx12("p", { className: "prep-live", children: "Training edits change saved statistics; query edits change only its output. Here100\u21921000 retains the central median/IQR3/2." })
  ] });
}
function CategoryEdit() {
  const [query, setQuery] = useState4("new"), [policy, setPolicy] = useState4("infrequent"), [minimum, setMinimum] = useState4("2");
  return /* @__PURE__ */ jsxs9(Fragment5, { children: [
    /* @__PURE__ */ jsx12(Current, { calculate: () => parseDraft(minimum, 1, 8, false, true), children: (count) => /* @__PURE__ */ jsx12(SafeModel, { identity: `${query}|${policy}|${count}`, children: /* @__PURE__ */ jsx12(CategoryView, { query: query === "None" ? null : query, minimum: count, policy }) }) }),
    /* @__PURE__ */ jsxs9("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx12(Text, { label: "Query label (None = missing)", value: query, onChange: setQuery }),
      /* @__PURE__ */ jsx12(Select, { label: "Unknown policy", value: policy, onChange: setPolicy, options: [["infrequent", "Infrequent if present"], ["zero", "All-zero"], ["error", "Error"]] }),
      /* @__PURE__ */ jsx12(NumberEditor, { label: "Minimum count", minimum: 1, maximum: 8, step: 1, value: minimum, onChange: setMinimum })
    ] }),
    /* @__PURE__ */ jsx12("p", { className: "prep-live", children: "Compare a, b, None and new. The query does not update training counts." })
  ] });
}
function DonorEdit() {
  const [drafts, setDrafts] = useState4(donorFixture.map((row) => row.map((value) => value === null ? "" : String(value))));
  const [selected, setSelected] = useState4("2,2"), [count, setCount] = useState4("2");
  const [i, j] = selected.split(",").map(Number);
  const options = drafts.flatMap((row, r) => row.map((_value, c) => [`${r},${c}`, `${r === 0 ? "Q" : `D${r}`} ${["a", "b", "target c"][c]}`]).filter((_entry, c) => r !== 0 || c !== 2));
  return /* @__PURE__ */ jsxs9(Fragment5, { children: [
    /* @__PURE__ */ jsx12(Current, { calculate: () => ({
      table: drafts.map((row) => row.map((value) => parseDraft(value, -1e4, 1e4, true))),
      k: parseDraft(count, 1, 3, false, true)
    }), children: (state) => /* @__PURE__ */ jsx12(SafeModel, { identity: JSON.stringify(state), children: /* @__PURE__ */ jsx12(DonorView, { table: state.table, k: state.k }) }) }),
    /* @__PURE__ */ jsxs9("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx12(Select, { label: "Query or donor cell", value: selected, onChange: setSelected, options }),
      /* @__PURE__ */ jsx12(NumberEditor, { label: "Selected cell", minimum: -1e4, maximum: 1e4, step: 1, nullable: true, value: drafts[i][j], onChange: (value) => setDrafts((old) => old.map((row, r) => r === i ? row.map((entry, c) => c === j ? value : entry) : row)) }),
      /* @__PURE__ */ jsx12(NumberEditor, { label: "Target-eligible neighbours k", minimum: 1, maximum: 3, step: 1, value: count, onChange: setCount })
    ] }),
    /* @__PURE__ */ jsx12("p", { className: "prep-live", children: "Blank D2 target to remove eligibility. D1 target140 gives220. An unused D3 target change leaves the two-donor estimate unchanged." })
  ] });
}
function SmallQueryEdit() {
  const [drafts, setDrafts] = useState4(["30", "", "9"]), [selected, setSelected] = useState4("2");
  const j = Number(selected);
  return /* @__PURE__ */ jsxs9(Fragment5, { children: [
    /* @__PURE__ */ jsx12(Current, { calculate: () => drafts.map((value) => parseDraft(value, -1e4, 1e4, true)), children: (row) => /* @__PURE__ */ jsx12(SmallPreparationView, { row, label: "a" }) }),
    /* @__PURE__ */ jsxs9("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx12(Select, { label: "Numeric query cell", value: selected, onChange: setSelected, options: ["0", "1", "2"] }),
      /* @__PURE__ */ jsx12(NumberEditor, { label: "Query value", minimum: -1e4, maximum: 1e4, step: 1, nullable: true, value: drafts[j], onChange: (value) => setDrafts((old) => old.map((entry, i) => i === j ? value : entry)) })
    ] }),
    /* @__PURE__ */ jsx12("p", { className: "prep-live", children: "Category stays a. Third coordinate9 maps to2; fit arrays remain pinned." })
  ] });
}
function RealQueryEdit() {
  const [source, setSource] = useState4("309"), [feature, setFeature] = useState4("body_mass_g"), [value, setValue] = useState4("4100");
  const fields = ["bill_length_mm", "bill_depth_mm", "flipper_length_mm", "body_mass_g", "sex"];
  function choose(nextSource, nextFeature) {
    setSource(nextSource);
    setFeature(nextFeature);
    setValue(observations[Number(nextSource)][nextFeature]?.toString() ?? "");
  }
  return /* @__PURE__ */ jsxs9(Fragment5, { children: [
    /* @__PURE__ */ jsx12(Current, { calculate: () => feature === "sex" ? value === "None" || value === "" ? null : value : parseDraft(value, 0, 1e6, true), children: (altered) => /* @__PURE__ */ jsxs9(Fragment5, { children: [
      /* @__PURE__ */ jsx12(RealPreparationView, { source: Number(source) }),
      /* @__PURE__ */ jsx12(RealPreparationView, { source: Number(source), feature, altered })
    ] }) }),
    /* @__PURE__ */ jsxs9("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx12(Select, { label: "Held-out source row", value: source, onChange: (next) => choose(next, feature), options: saved.scaled_inspection.test_source_rows.map((row) => [String(row), `${row} \xB7 ${observations[row].species}`]) }),
      /* @__PURE__ */ jsx12(Select, { label: "Feature in altered copy", value: feature, onChange: (next) => choose(source, next), options: fields }),
      feature === "sex" ? /* @__PURE__ */ jsx12(Text, { label: "Sex label (None/blank = missing)", value, onChange: setValue }) : /* @__PURE__ */ jsx12(NumberEditor, { label: "Altered measurement", minimum: 0, maximum: 1e6, step: 1, nullable: true, value, onChange: setValue })
    ] }),
    /* @__PURE__ */ jsx12("p", { className: "prep-live", children: "Queries cannot change fitted arrays, historical predictions or accuracy. Negative measurements are refused in this inspection domain." })
  ] });
}
function PowerEdit() {
  const [method, setMethod] = useState4("YJ"), [x, setX] = useState4("-3"), [lambda, setLambda] = useState4("2");
  return /* @__PURE__ */ jsxs9(Fragment5, { children: [
    /* @__PURE__ */ jsx12(Current, { calculate: () => ({
      x: parseDraft(x, -10, 30),
      lambda: parseDraft(lambda, -3, 3)
    }), children: (state) => /* @__PURE__ */ jsx12(SafeModel, { identity: `${method}${JSON.stringify(state)}`, children: /* @__PURE__ */ jsx12(PowerView, { method, ...state }) }) }),
    /* @__PURE__ */ jsxs9("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx12(Select, { label: "Power method", value: method, onChange: setMethod, options: [["YJ", "Yeo\u2013Johnson"], ["BC", "Box\u2013Cox"]] }),
      /* @__PURE__ */ jsx12(NumberEditor, { label: "Input x", minimum: -10, maximum: 30, value: x, onChange: setX }),
      /* @__PURE__ */ jsx12(NumberEditor, { label: "Manual lambda", minimum: -3, maximum: 3, step: 0.01, value: lambda, onChange: setLambda })
    ] }),
    /* @__PURE__ */ jsx12("p", { className: "prep-live", children: "This lambda is manually edited. Saved learned P7 lambdas appear separately in D26. Try the negative logarithmic boundary\u03BB2 or identity\u03BB1." })
  ] });
}
function QuantileEdit() {
  const [x, setX] = useState4("3"), [output, setOutput] = useState4("uniform");
  return /* @__PURE__ */ jsxs9(Fragment5, { children: [
    /* @__PURE__ */ jsx12(Current, { calculate: () => parseDraft(x, -10, 1e3), children: (value) => /* @__PURE__ */ jsx12(QuantileView, { x: value, output }) }),
    /* @__PURE__ */ jsxs9("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx12(NumberEditor, { label: "Later query", minimum: -10, maximum: 1e3, step: 1, value: x, onChange: setX }),
      /* @__PURE__ */ jsx12(Select, { label: "Output coordinate", value: output, onChange: setOutput, options: ["uniform", "normal"] })
    ] }),
    /* @__PURE__ */ jsx12("p", { className: "prep-live", children: "Landmarks stay fixed. Try2 for its tie midpoint,3 for interpolation and1000 for saturation. Custom constant c\u2192.5 differs from ordinary c\u21920." })
  ] });
}
function CycleEdit() {
  const [first, setFirst] = useState4("350"), [second, setSecond] = useState4("10");
  return /* @__PURE__ */ jsxs9(Fragment5, { children: [
    /* @__PURE__ */ jsx12(Current, { calculate: () => [parseDraft(first, 0, 360), parseDraft(second, 0, 360)], children: (values) => /* @__PURE__ */ jsx12(CycleView, { first: values[0], second: values[1] }) }),
    /* @__PURE__ */ jsxs9("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx12(NumberEditor, { label: "Angle A degrees", minimum: 0, maximum: 360, step: 1, value: first, onChange: setFirst }),
      /* @__PURE__ */ jsx12(NumberEditor, { label: "Angle B degrees", minimum: 0, maximum: 360, step: 1, value: second, onChange: setSecond })
    ] }),
    /* @__PURE__ */ jsx12("p", { className: "prep-live", children: "Compare0/360,1/359 and30/150. The last pair shares sine but differs in cosine." })
  ] });
}
function SmoothingEdit() {
  const [support, setSupport] = useState4("1"), [alpha, setAlpha] = useState4("2");
  return /* @__PURE__ */ jsxs9(Fragment5, { children: [
    /* @__PURE__ */ jsx12(Current, { calculate: () => parseDraft(alpha, 0, 100), children: (value) => /* @__PURE__ */ jsx12(SmoothingView, { count: Number(support), alpha: value }) }),
    /* @__PURE__ */ jsxs9("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx12(Select, { label: "Positive category support", value: support, onChange: setSupport, options: [["1", "Singleton"], ["100", "100 positives"], ["0", "Absent category"]] }),
      /* @__PURE__ */ jsx12(NumberEditor, { label: "Smoothing alpha", minimum: 0, maximum: 100, step: 1, value: alpha, onChange: setAlpha })
    ] }),
    /* @__PURE__ */ jsx12("p", { className: "prep-live", children: "\u03B10 keeps a supported category mean; absent categories retain the prior fallback. Exclusion is separate." })
  ] });
}
function TargetEdit() {
  const initial = targetFixture.categories.map((label, i2) => [label, String(targetFixture.targets[i2]), String(targetFixture.folds[i2])]);
  const [drafts, setDrafts] = useState4(initial), [selected, setSelected] = useState4("3,1"), [inspected, setInspected] = useState4("0");
  const [i, j] = selected.split(",").map(Number);
  return /* @__PURE__ */ jsxs9(Fragment5, { children: [
    /* @__PURE__ */ jsx12(Current, { calculate: () => ({
      categories: drafts.map((row) => row[0]),
      targets: drafts.map((row) => parseDraft(row[1], 0, 1, false, true)),
      folds: drafts.map((row) => parseDraft(row[2], 0, 1, false, true))
    }), children: (fixture) => /* @__PURE__ */ jsx12(SafeModel, { identity: JSON.stringify(fixture), children: /* @__PURE__ */ jsx12(CrossFitView, { fixture, selected: Number(inspected) }) }) }),
    /* @__PURE__ */ jsxs9("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx12(Select, { label: "Category, target or fold cell", value: selected, onChange: setSelected, options: drafts.flatMap((row, r) => row.map((_entry, c) => [`${r},${c}`, `row${r} ${["category", "target", "fold"][c]}`])) }),
      /* @__PURE__ */ jsx12(Text, { label: `Selected ${["category", "0/1 target", "0/1 fold"][j]}`, numeric: j !== 0, value: drafts[i][j], onChange: (value) => setDrafts((old) => old.map((row, r) => r === i ? row.map((entry, c) => c === j ? value : entry) : row)) }),
      /* @__PURE__ */ jsx12(Select, { label: "Inspected encoded row", value: inspected, onChange: setInspected, options: ["0", "1", "2", "3", "4", "5"] })
    ] }),
    /* @__PURE__ */ jsx12("p", { className: "prep-live", children: "Flip row3 target0\u21921: row0 becomes7/9 through its prior; row3's own4/9 stays fixed. Changing row0's own target leaves row0 unchanged." })
  ] });
}
function HashEdit() {
  const [selected, setSelected] = useState4("1"), [counts, setCounts] = useState4(["3", "1", "2"]), [mapping, setMapping] = useState4(["0,1", "0,-1", "1,1"]);
  const i = Number(selected);
  return /* @__PURE__ */ jsxs9(Fragment5, { children: [
    /* @__PURE__ */ jsx12(Current, { calculate: () => counts.map((value) => parseDraft(value, 0, 10, false, true)), children: (values) => /* @__PURE__ */ jsx12(HashView, { counts: values, buckets: mapping.map((value) => Number(value.split(",")[0])), signs: mapping.map((value) => Number(value.split(",")[1])) }) }),
    /* @__PURE__ */ jsxs9("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx12(Select, { label: "Token", value: selected, onChange: setSelected, options: [["0", "apple"], ["1", "pear"], ["2", "banana"]] }),
      /* @__PURE__ */ jsx12(NumberEditor, { label: "Token count", minimum: 0, maximum: 10, step: 1, value: counts[i], onChange: (value) => setCounts((old) => old.map((entry, j) => j === i ? value : entry)) }),
      /* @__PURE__ */ jsx12(Select, { label: "Declared bucket and sign", value: mapping[i], onChange: (value) => setMapping((old) => old.map((entry, j) => j === i ? value : entry)), options: [["0,1", "bucket0 sign+"], ["0,-1", "bucket0 sign\u2212"], ["1,1", "bucket1 sign+"], ["1,-1", "bucket1 sign\u2212"]] })
    ] }),
    /* @__PURE__ */ jsx12("p", { className: "prep-live", children: "This is the constructed map, separate from FeatureHasher. A zero-count token contributes nothing even if its map changes." })
  ] });
}
function IterativeEdit() {
  const [selected, setSelected] = useState4("3,0"), [drafts, setDrafts] = useState4({
    "3,0": "",
    "2,1": ""
  }), [turn, setTurn] = useState4("0");
  return /* @__PURE__ */ jsxs9(Fragment5, { children: [
    /* @__PURE__ */ jsx12(Current, { calculate: () => ({
      "3,0": parseDraft(drafts["3,0"], -20, 20, true),
      "2,1": parseDraft(drafts["2,1"], -20, 20, true)
    }), children: (initialOverrides) => /* @__PURE__ */ jsx12(ConditionalView, { turn: Number(turn), initialOverrides }) }),
    /* @__PURE__ */ jsxs9("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx12(Select, { label: "Original missing cell initialization", value: selected, onChange: setSelected, options: [["3,0", "row3 a"], ["2,1", "row2 b"]] }),
      /* @__PURE__ */ jsx12(NumberEditor, { label: "Initial estimate", blankMeaning: "median", minimum: -20, maximum: 20, step: 0.1, nullable: true, value: drafts[selected], onChange: (value) => setDrafts((old) => ({
        ...old,
        [selected]: value
      })) }),
      /* @__PURE__ */ jsx12(Select, { label: "Conditional turn", value: turn, onChange: setTurn, options: Array.from({
        length: 7
      }, (_, i) => [String(i), i ? `turn${i}` : "median/edited initialization"]) })
    ] }),
    /* @__PURE__ */ jsx12("p", { className: "prep-live", children: "Only original gaps accept initial estimates; observations and response rows stay fixed. Steps0\u20266 expose feedback. The three-sweep cap does not assert convergence." })
  ] });
}
function PoolEdit() {
  const [selected, setSelected] = useState4("Q,0"), [estimates, setEstimates] = useState4(["9", "10", "11"]), [variances, setVariances] = useState4(["4", "4", "4"]);
  const [kind, index] = selected.split(","), i = Number(index), values = kind === "Q" ? estimates : variances;
  return /* @__PURE__ */ jsxs9(Fragment5, { children: [
    /* @__PURE__ */ jsx12(Current, { calculate: () => ({
      estimates: estimates.map((value) => parseDraft(value, -100, 100)),
      variances: variances.map((value) => parseDraft(value, 0, 100))
    }), children: (state) => /* @__PURE__ */ jsx12(PoolView, { ...state }) }),
    /* @__PURE__ */ jsxs9("div", { className: "prep-controls", children: [
      /* @__PURE__ */ jsx12(Select, { label: "Analysis estimate or variance", value: selected, onChange: setSelected, options: ["Q", "U"].flatMap((name) => [0, 1, 2].map((j) => [`${name},${j}`, `${name}${j + 1}`])) }),
      /* @__PURE__ */ jsx12(NumberEditor, { label: kind === "Q" ? "Estimate Q" : "Variance U (squared units)", minimum: kind === "Q" ? -100 : 0, maximum: 100, step: 0.1, value: values[i], onChange: (value) => (kind === "Q" ? setEstimates : setVariances)((old) => old.map((entry, j) => j === i ? value : entry)) })
    ] }),
    /* @__PURE__ */ jsx12("p", { className: "prep-live", children: "Q edits can change between variance; U edits change within variance. Identical Q makes between variance zero. The pooling contract refuses m1 or negative U." })
  ] });
}
function SensitivityEdit() {
  const [delta, setDelta] = useState4("0");
  return /* @__PURE__ */ jsxs9(Fragment5, { children: [
    /* @__PURE__ */ jsx12(Current, { calculate: () => parseDraft(delta, -2, 2), children: (value) => /* @__PURE__ */ jsxs9(Fragment5, { children: [
      /* @__PURE__ */ jsx12(Matrix, { columns: ["baseline completion1", "shifted completion1", "original missing M"], values: completionTables[0].map((entry, i) => [entry, entry + ([2, 4].includes(i) ? value : 0), Number([2, 4].includes(i))]), missing: completionTables[0].map((_entry, i) => [[2, 4].includes(i), [2, 4].includes(i), false]), label: "First of five retained baseline draws, rounded; only original gaps shift by \u03B4" }),
      /* @__PURE__ */ jsx12(Plot, { label: "Fixed normal-model draws under an assumed missing-cell shift", xDomain: [-2, 2], yDomain: [7.5, 10], xLabel: "assumed delta", yLabel: "pooled mean", paths: [{
        values: [[-2, sensitivity(-2)], [2, sensitivity(2)]]
      }], points: [{
        x: value,
        y: sensitivity(value),
        id: "current"
      }] }),
      /* @__PURE__ */ jsx12(Cells, { names: ["assumed delta", "pooled mean", "no-missing contrast"], values: [value, sensitivity(value), "unchanged with no missing cells"] })
    ] }) }),
    /* @__PURE__ */ jsx12("div", { className: "prep-controls", children: /* @__PURE__ */ jsx12(NumberEditor, { label: "Assumed missing-cell delta", minimum: -2, maximum: 2, step: 0.1, value: delta, onChange: setDelta }) }),
    /* @__PURE__ */ jsx12("p", { className: "prep-live", children: "Seed20, five draws and the prior stay fixed. Baseline8.686461347735442+.4\u03B4 is not a confidence interval or an estimated MNAR mechanism." })
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
  const [epoch, setEpoch] = useState4(0), Implementation = implementations[id];
  if (!Implementation) throw Error(`Unknown investigation ${id}`);
  return /* @__PURE__ */ jsxs9("section", { className: "prep-investigation", "data-investigation-id": id, "aria-label": `${id} live investigation`, children: [
    /* @__PURE__ */ jsx12(Implementation, {}, epoch),
    /* @__PURE__ */ jsx12("div", { className: "prep-controls", children: /* @__PURE__ */ jsx12("button", { type: "button", onClick: () => setEpoch((value) => value + 1), "aria-label": `Reset ${id} values, drafts, selection and trace`, children: "Reset investigation" }) })
  ] });
}

// docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/runtime-preview/preparation-lesson.jsx
import { Fragment as Fragment6, jsx as jsx13, jsxs as jsxs10 } from "react/jsx-runtime";
function NeuralTable({ caption, ...props }) {
  return /* @__PURE__ */ jsx13(Table, { ...props, label: caption });
}
function PreparationLesson() {
  return /* @__PURE__ */ jsxs10("div", { className: "lesson-flow prep-reader", children: [
    /* @__PURE__ */ jsx13(Prose, { children: "A model reads coordinates. A field notebook records measurements, categories and gaps. Turning one into the other is part of the modeling decision: a ruler changes which penguin looks nearest, a category representation changes which differences count, and a fill supplies a number we did not observe." }),
    /* @__PURE__ */ jsx13(Prose, { opening: "summary", children: "We will follow one practical question: can a penguin's measurements help distinguish its species? The real observations anchor the question; small, explicitly constructed tables make each mechanism possible to calculate. We will build preparation functions, recognize their stored state in ordinary library objects, and inspect one preserved real experiment. No method is a universal winner." }),
    /* @__PURE__ */ jsx13(Prose, { opening: "route", children: "Start with sections 1\u20136, then core practice in section 10 and readiness in section 11. Sections 7\u20139 are visible deeper branches: nonlinear coordinates and bases; high-cardinality categories; conditional completion and uncertainty. They use the same step-by-step approach and can be read in a second sitting. You need rows and columns, Python arrays, averages and the idea of predicting a label. We introduce new notation where it enters. Complete files, exact outputs and setup are supplied; code is part of the explanation, available without a disclosure. Hints and solutions alone use disclosures." }),
    /* @__PURE__ */ jsx13(H2, { children: "1. Three different questions hiding inside \u201Cpreprocessing\u201D" }),
    /* @__PURE__ */ jsx13(Prose, { children: "The first held-out case in the retained experiment is zero-based source row 309. \u201C309\u201D means its position in this file, not a biological identifier and not a feature used by our model. Look across its measurement cells, then across to the separate answer column." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D01" }),
    /* @__PURE__ */ jsx13(NeuralTable, { caption: "1. Three different questions hiding inside \u201Cpreprocessing\u201D", headers: [/* @__PURE__ */ jsx13(Fragment6, { children: "Source position" }), /* @__PURE__ */ jsx13(Fragment6, { children: "Bill length" }), /* @__PURE__ */ jsx13(Fragment6, { children: "Bill depth" }), /* @__PURE__ */ jsx13(Fragment6, { children: "Flipper length" }), /* @__PURE__ */ jsx13(Fragment6, { children: "Body mass" }), /* @__PURE__ */ jsx13(Fragment6, { children: "Recorded sex" }), /* @__PURE__ */ jsx13(Fragment6, { children: "Target species" })], rows: [[/* @__PURE__ */ jsx13(Fragment6, { children: "309" }), /* @__PURE__ */ jsx13(Fragment6, { children: "51.0 mm" }), /* @__PURE__ */ jsx13(Fragment6, { children: "18.8 mm" }), /* @__PURE__ */ jsx13(Fragment6, { children: "203.0 mm" }), /* @__PURE__ */ jsx13(Fragment6, { children: "4100 g" }), /* @__PURE__ */ jsx13(Fragment6, { children: "male" }), /* @__PURE__ */ jsx13(Fragment6, { children: "Chinstrap" })]] }),
    /* @__PURE__ */ jsx13(Prose, { children: "An observation is one row. A feature is a selected input available when a prediction must be made. The target is the answer used for training or later assessment, species here. Availability matters as much as numerical format: a field recorded after species identification might reveal the answer rather than help predict it. Our experiment excludes source position, island, year and species from its input." }),
    /* @__PURE__ */ jsx13(Prose, { children: "Write the feature table as X with n rows and d columns. Thus X has shape n\xD7d; a row x\u1D62 holds one case's inputs, and column j follows one feature across cases. The target vector y has n entries and stays separate. Before encoding, X can contain different kinds of values. A numerical estimator ultimately needs the representation its interface promises; being stored in a table does not make every column a quantitative measurement." }),
    /* @__PURE__ */ jsx13(Prose, { children: "Now make an independent copy of row 309 and erase only its mass. Follow the same row positions into the prepared coordinates." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D02" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "The altered copy is ",
      /* @__PURE__ */ jsx13("code", { children: "[51,18.8,203,NA,male]" }),
      ". Sex is still observed. For numeric cells define M\u1D62\u2C7C=1 when the ",
      /* @__PURE__ */ jsx13("strong", { children: "input is missing" }),
      ", and 0 when observed. This convention is the opposite of an observation indicator R used in many statistical texts: R=1\u2212M. We will keep the original M after filling. A filled mass coordinate is an estimate carrying a missing marker, not an observed 4000 g. Unknown sex, when a present string was absent from the fitted vocabulary, is a separate input-policy case; it is not another biological state we found in the file."
    ] }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "Scaling asks which numeric differences should have comparable influence. Encoding asks which relationships a category should express. Imputation asks which usable input to supply for an absent measurement. Converting grams to kilograms, making an indicator for ",
      /* @__PURE__ */ jsx13("code", { children: "male" }),
      ", and replacing a missing mass are three different operations. Combining them does not remove their separate assumptions."
    ] }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "The preceding ",
      /* @__PURE__ */ jsx13("a", { href: "/learn/path/full-curriculum/non-negative-matrix-factorization-nmf?module=classical-ml", children: "NMF lesson" }),
      " uses rows as observations and requires nonnegative X for its additive reconstruction. Centering can create negative coordinates, so a useful preparation for a distance model can violate that domain. Begin with the downstream operation's meaning and input contract, rather than choosing a familiar preprocessing recipe."
    ] }),
    /* @__PURE__ */ jsx13(H2, { children: "2. Scaling changes the meaning of \u201Cnearby\u201D" }),
    /* @__PURE__ */ jsx13(H3, { children: "Make the ruler explicit" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "Switch now to three ",
      /* @__PURE__ */ jsx13("strong", { children: "constructed" }),
      " two-feature cases: Q=(40,4000), A=(41,4100), B=(43,4001), in millimeters and grams. These are arithmetic fixtures, not additional penguin observations. The KNN prerequisite's ",
      /* @__PURE__ */ jsx13("a", { href: "/learn/path/full-curriculum/k-nearest-neighbors-knn?module=classical-ml#2-make-nearness-an-explicit-choice", children: "actual distance section" }),
      " derives Euclidean, Manhattan and maximum-coordinate distances; its complete ",
      /* @__PURE__ */ jsx13("code", { children: "units-cosine" }),
      " example shows why units and directions matter. Here we change the coordinate map before using that distance."
    ] }),
    /* @__PURE__ */ jsx13(Prose, { children: "Look first at the differences from Q, which are much easier to compare than absolute masses." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D03" }),
    /* @__PURE__ */ jsx13(Prose, { children: "A differs by (1,100); B by (3,1). Raw squared Euclidean distance gives 1\xB2+100\xB2=10001 for A and 3\xB2+1\xB2=10 for B. The rule chooses B. The arithmetic silently gave a 100 g difference much more numerical influence than a few millimeters." }),
    /* @__PURE__ */ jsx13(Prose, { children: "Decide instead that 1 mm and 100 g should each count as one comparison unit. Draw each divided difference as a triangle leg and its squared contribution beside it." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D04" }),
    /* @__PURE__ */ jsx13(Prose, { children: "With divisors a=1, b=100, A has squared distance 1\xB2+1\xB2=2, while B has 3\xB2+.01\xB2=9.0001. A is now nearest. Nothing about the physical measurements changed. Dividing feature j by s\u2C7C gives" }),
    /* @__PURE__ */ jsx13("div", { className: "neural-equation", children: /* @__PURE__ */ jsx13(MathBlock, { children: "d_s^2(x,z)=\\sum_j((x_j-z_j)/s_j)^2\n           =\\sum_j (x_j-z_j)^2/s_j^2,\\qquad s_j>0." }) }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "The squared-distance weight is 1/s\u2C7C\xB2. A shared center cancels: ",
      /* @__PURE__ */ jsx13("code", { children: "(x\u2212c)\u2212(z\u2212c)=x\u2212z" }),
      ". Doubling ",
      /* @__PURE__ */ jsx13("strong", { children: "both" }),
      " divisors divides both sums by four, giving .5 and 2.250025; ranking is unchanged. Changing just one divisor changes relative influence. L1 and maximum-coordinate distance use their own contribution rules; dividing coordinates still changes their geometry, but the L2 circles here are not pictures of L1 diamonds."
    ] }),
    /* @__PURE__ */ jsx13(PreparationInvestigation, { id: "L1" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Begin with A nearer at 2 versus 9.0001. Change the mass divisor toward 1 and watch the mass leg and squared contribution grow until B is nearer. The immediately visible result explains which contribution changed. Common rescaling is a useful null for the ranking. Choose a divisor because of feature meaning or development evidence, rather than because standardization is fashionable." }),
    /* @__PURE__ */ jsx13(PreparationInvestigation, { id: "L2" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Keep divisors 1 and 100, then change A's mass to 4400. Its difference becomes (1,400), giving 1+16=17; B stays at 9.0001 and wins. Coincide A with Q and its distance becomes zero. Editing Q must update both candidates. Geometry and arithmetic remain the same state; an axis viewport cannot clamp a computed length or circle radius. Keep the complete uncapped-radius geometry visible throughout the declared input domain." }),
    /* @__PURE__ */ jsx13(H3, { children: "Fit a ruler on training observations" }),
    /* @__PURE__ */ jsx13(Prose, { children: "If domain knowledge does not supply divisors, summarize typical training variation. For a numerical column, fit mean \u03BC=(\u03A3x\u1D62)/n and population standard deviation s=\u221A[\u03A3(x\u1D62\u2212\u03BC)\xB2/n], then transform a later x into z=(x\u2212\u03BC)/s. Dividing by n matches the transformation convention in StandardScaler; this is not an unbiased sample-variance calculation. A nonconstant training column gets mean zero and variance one. Its ordering and distribution shape are otherwise unchanged: a skewed distribution remains skewed, and no regression-error assumption has been proved." }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "See which observations determine three different rulers on the constructed training column ",
      /* @__PURE__ */ jsx13("code", { children: "[1,2,3,4,100]" }),
      "."
    ] }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D05" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "The mean is 22, the population scale is about 39.012818, the minimum/range are 1/99, and the median/IQR are 3/2 under linear percentiles (Q25=2, Q75=4). Standard scaling uses ",
      /* @__PURE__ */ jsx13("code", { children: "(x\u221222)/39.012818" }),
      "; min\u2013max uses ",
      /* @__PURE__ */ jsx13("code", { children: "(x\u22121)/99" }),
      "; robust uses ",
      /* @__PURE__ */ jsx13("code", { children: "(x\u22123)/2" }),
      ". Max-absolute scaling uses x/100 and preserves measured zeros."
    ] }),
    /* @__PURE__ */ jsx13(NeuralTable, { caption: "Fit a ruler on training observations", headers: [/* @__PURE__ */ jsx13(Fragment6, { children: "Value" }), /* @__PURE__ */ jsx13(Fragment6, { children: "Standard" }), /* @__PURE__ */ jsx13(Fragment6, { children: "Min\u2013max" }), /* @__PURE__ */ jsx13(Fragment6, { children: "Robust" }), /* @__PURE__ */ jsx13(Fragment6, { children: "Max-absolute" })], rows: [[/* @__PURE__ */ jsx13(Fragment6, { children: "1" }), /* @__PURE__ */ jsx13(Fragment6, { children: "\u2212.5383" }), /* @__PURE__ */ jsx13(Fragment6, { children: "0" }), /* @__PURE__ */ jsx13(Fragment6, { children: "\u22121" }), /* @__PURE__ */ jsx13(Fragment6, { children: ".01" })], [/* @__PURE__ */ jsx13(Fragment6, { children: "2" }), /* @__PURE__ */ jsx13(Fragment6, { children: "\u2212.5127" }), /* @__PURE__ */ jsx13(Fragment6, { children: ".0101" }), /* @__PURE__ */ jsx13(Fragment6, { children: "\u2212.5" }), /* @__PURE__ */ jsx13(Fragment6, { children: ".02" })], [/* @__PURE__ */ jsx13(Fragment6, { children: "3" }), /* @__PURE__ */ jsx13(Fragment6, { children: "\u2212.4870" }), /* @__PURE__ */ jsx13(Fragment6, { children: ".0202" }), /* @__PURE__ */ jsx13(Fragment6, { children: "0" }), /* @__PURE__ */ jsx13(Fragment6, { children: ".03" })], [/* @__PURE__ */ jsx13(Fragment6, { children: "4" }), /* @__PURE__ */ jsx13(Fragment6, { children: "\u2212.4614" }), /* @__PURE__ */ jsx13(Fragment6, { children: ".0303" }), /* @__PURE__ */ jsx13(Fragment6, { children: ".5" }), /* @__PURE__ */ jsx13(Fragment6, { children: ".04" })], [/* @__PURE__ */ jsx13(Fragment6, { children: "100" }), /* @__PURE__ */ jsx13(Fragment6, { children: "1.9993" }), /* @__PURE__ */ jsx13(Fragment6, { children: "1" }), /* @__PURE__ */ jsx13(Fragment6, { children: "48.5" }), /* @__PURE__ */ jsx13(Fragment6, { children: "1" })], [/* @__PURE__ */ jsx13(Fragment6, { children: "Later 150" }), /* @__PURE__ */ jsx13(Fragment6, { children: "3.2810" }), /* @__PURE__ */ jsx13(Fragment6, { children: "1.5051" }), /* @__PURE__ */ jsx13(Fragment6, { children: "73.5" }), /* @__PURE__ */ jsx13(Fragment6, { children: "1.5" })]] }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "The full extent keeps 100 and later 150 visible; the magnified view makes the separation among 1\u20134 perceptible. Robust scaling has not deleted or clipped the outlier. It uses central spread, making 100 a large coordinate. Min\u2013max places ",
      /* @__PURE__ */ jsx13("strong", { children: "training" }),
      " endpoints at 0 and 1. Later values can exceed them. Clipping would be another operation that discards how far beyond the fitted range a value lies."
    ] }),
    /* @__PURE__ */ jsx13(PreparationInvestigation, { id: "L3" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Change the last training value from 100 to 1000. Mean, standard deviation and range change. The central quartiles here remain 2 and 4, so robust scaling's saved center/scale remain 3/2. Change only the query and none of these fitted summaries should move. \u201CRobust\u201D refers to this rule's resistance to particular changes in the fit, not proof that outliers never matter downstream." }),
    /* @__PURE__ */ jsx13(Prose, { children: "What if training variation is zero? Trace the replacement divisor separately from the later coordinate." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D06" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "For ",
      /* @__PURE__ */ jsx13("code", { children: "[7,7,7]" }),
      ", center=7 and measured spread=0. Our explicit policy stores divisor 1 with a zero-spread flag. Training values and later 7 become zero; later 9 becomes 2. \u201CConstant during fit\u201D does not mean \u201Cforce every future input to zero.\u201D An all-missing training column is different: there is no center or spread supported by observations. Refuse it or choose a declared keep/drop policy; do not infer a median of zero."
    ] }),
    /* @__PURE__ */ jsx13(H3, { children: "Preserve direction only when size is dispensable" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Column scaling learns one ruler per feature. Row normalization uses each case's own size. Look at two vectors on one ray and the single point they become on the unit circle." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D07" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "The lengths of [3,4] and [6,8] are 5 and 10. Both become [.6,.8] after L2 normalization. Direction survives; amplitude disappears. This can suit document composition or a spectral shape comparison. It can harm a task in which total count, energy or body size is informative. For nonzero vectors, expanding their normalized squared Euclidean difference gives ",
      /* @__PURE__ */ jsx13("code", { children: "2\u22122 cosine_similarity" }),
      "; that is why the prerequisite compares direction this way. The zero vector has no direction; our policy leaves it zero and does not call that a meaningful angle. L1 divides by the sum of absolute coordinates; max normalization divides by the largest absolute coordinate. These are row operations, not column standardization."
    ] }),
    /* @__PURE__ */ jsx13(Prose, { children: "Storage and penalties introduce further reasons to inspect the map. Watch actual zeros change when a sparse matrix is centered, then compare two coefficient vectors making the same prediction." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D08" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "The matrix ",
      /* @__PURE__ */ jsx13("code", { children: "[[0,0,3],[1,0,0],[0,2,0]]" }),
      " has three nonzero cells. Subtracting column means [1/3,2/3,1] makes all nine cells nonzero. A sparse container cannot make those new values free. Scale-only StandardScaler(with_mean=False) and MaxAbsScaler can preserve zero support; they serve a different centering contract."
    ] }),
    /* @__PURE__ */ jsx13(Prose, { children: "For x=[1,100], w=[1,.01], the prediction x\xB7w=2. Divide the second coordinate by 100 and multiply its coefficient by 100: x\u2032=[1,1], w\u2032=[1,1] still predict 2. But squared coefficient penalties are 1.0001 and 2. Equal predictions do not give equal regularized objectives. Feature units therefore determine which coefficient changes a fixed penalty discourages. We derive this two-coordinate example here; the later regularization lesson owns systematic selection and optimization." }),
    /* @__PURE__ */ jsx13(Prose, { children: "Ideal threshold trees depend on order: a strictly increasing map with a corresponding threshold preserves a split's membership. This explains their lesser sensitivity to unit scaling. Finite precision, histogram boundaries, clipping and merged values qualify implementation behavior. Polynomial construction or row normalization changes more than one column's strictly increasing coordinate map, so this observation does not establish invariance to arbitrary preparation." }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "The complete program below owns fitted summaries, schema checks, transformation and inverses, plus stateless row normalization. Read ",
      /* @__PURE__ */ jsx13("code", { children: "Ruler" }),
      " as saved state. Frozen arrays prevent accidental edits; transformation validates both feature names and width. NaNs are skipped during fit and preserved at transform so a separate imputation policy can handle them. Infinity is refused. Our exact-zero spread policy is intentionally simpler than sklearn's numerical near-constant heuristics."
    ] }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "",
      /* @__PURE__ */ jsx13("strong", { children: "fitted_rulers.py \u2014 actual new checked process." }),
      ""
    ] }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/fitted_rulers.py", filename: "fitted_rulers.py", language: "python", title: "fitted_rulers.py" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Whole recorded stdout (exact captured new stdout bytes):" }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/fitted_rulers.stdout.txt", filename: "fitted_rulers.stdout.txt", language: "output", title: "Recorded stdout \xB7 fitted_rulers.stdout.txt" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Each estimator is fitted to the same column before its query is transformed. The comparisons check state-dependent coordinates and inverse consistency, not every possible floating-point input. The row routine divides first by the largest magnitude to avoid squaring enormous raw values. It changes no fitting state. Reductions/transformation take O(nd) work; percentile fitting may sort, costing O(dn log n). Dense output occupies its actual row\xD7column width. Sparse scaling retains sparse storage; our dense scratch functions do not promise sparse centering." }),
    /* @__PURE__ */ jsx13(H2, { children: "3. Encoding categories means choosing relationships" }),
    /* @__PURE__ */ jsx13(H3, { children: "Membership is different from order" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "A label is not necessarily a quantity. Use the constructed category vocabulary ",
      /* @__PURE__ */ jsx13("code", { children: "red" }),
      ", ",
      /* @__PURE__ */ jsx13("code", { children: "green" }),
      ", ",
      /* @__PURE__ */ jsx13("code", { children: "blue" }),
      ". Giving them codes 0,1,2 lets a distance model treat the middle code as between the others. A name alone does not justify that relation. Look at their membership coordinates instead."
    ] }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D09" }),
    /* @__PURE__ */ jsx13(Prose, { children: "The full one-hot rows are red=[1,0,0], green=[0,1,0], blue=[0,0,1]. Each has exactly one active category coordinate. Any two distinct categories differ in two cells and have distance \u221A2. The three-coordinate geometry is symmetric; a two-dimensional schematic is only a projection, and the literal vectors establish the true distances. Different one-hot blocks and numeric features still need relative weighting. Encoding does not discover their importance." }),
    /* @__PURE__ */ jsx13(Prose, { children: "Now remove the red coordinate and examine both distances and the intercept relation." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D10" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Red becomes [0,0], green [1,0], blue [0,1]. Red is distance 1 from either, while green and blue remain \u221A2 apart. Dropping a reference is useful for some parameterizations, but it changes a distance model's geometry. For a full linear design with an intercept, the three indicator columns sum to the all-ones intercept column. Coefficients are therefore not uniquely identified without a constraint. A suitable least-squares solver can still fit predictions; \u201Call solvers require dropping one column\u201D is false. A penalty also depends on the parameterization, just as units affected the previous coefficient example." }),
    /* @__PURE__ */ jsx13(H3, { children: "Unknown, missing and rare need explicit policies" }),
    /* @__PURE__ */ jsx13(Prose, { children: "A missing category was not recorded. An unknown category is present now but absent from the fitted vocabulary. A rare category is known with little training support. See how the fitted frequency table, not the query batch, determines the output positions." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D11" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "In the constructed policy program, train on a\xD74, b\xD71 and one missing label. With threshold 2, b enters a fitted ",
      /* @__PURE__ */ jsx13("code", { children: "@rare" }),
      " bucket, missing keeps its own ",
      /* @__PURE__ */ jsx13("code", { children: "@missing" }),
      " coordinate, and a remains frequent. These ",
      /* @__PURE__ */ jsx13("code", { children: "@" }),
      " names are reserved internal markers: real labels starting with ",
      /* @__PURE__ */ jsx13("code", { children: "@" }),
      " are refused so no measured category silently collides with absence. A present ",
      /* @__PURE__ */ jsx13("code", { children: "new" }),
      " label either errors, becomes all zeros, or uses the rare bucket ",
      /* @__PURE__ */ jsx13("strong", { children: "if one exists" }),
      ", according to the selected unknown policy. Missing is not automatically unknown if it had a fitted coordinate."
    ] }),
    /* @__PURE__ */ jsx13(PreparationInvestigation, { id: "L4" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "Inspect the full output vector and column names while editing the query label, unknown policy and rare threshold. A threshold can remove the rare bucket; ",
      /* @__PURE__ */ jsx13("code", { children: "infrequent_if_exist" }),
      " then has no fitted bucket to use and falls back to all zeros in this custom contract. An unchanged frequent a is a null case. Raising a threshold refits the training policy; changing only the query does not."
    ] }),
    /* @__PURE__ */ jsx13(Prose, { children: "OneHotEncoder exposes categories_, output names, drop and unknown/rare policy. Its native frequency grouping can put a missing marker into the infrequent bucket. That differs from our policy keeping missing separate. The program first compares an explicitly pregrouped, same-column library route, then prints the native route's distinct names. This qualification is more useful than asserting universal parity because two examples happen to have the same width. Sparse output stores active coordinates without allocating a dense n\xD7v matrix." }),
    /* @__PURE__ */ jsx13(Prose, { children: "Order can be real without equal gaps being real. Put small, medium and large on their supplied code axis." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D12" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Codes 0,1,2 express an order and, for linear/distance arithmetic, equal adjacent gaps. Clinical grades or sizes may justify the order without equal spacing. An ordinal threshold can split contiguous parts of the order; arbitrary nominal subsets need another representation or estimator. Renaming nominal codes can alter distance while renaming full one-hot columns preserves its geometry." }),
    /* @__PURE__ */ jsx13(Prose, { children: "The complete program fits deterministic counts/vocabulary, creates dense or sparse membership rows, and separately maps a supplied ordinal order. It returns output names alongside the matrix. Unknown and missing ordinal codes are distinct negative values outside the ordered range; a model still needs to interpret them appropriately. Native categorical estimators can offer another route\u2014check the actual estimator's category and missing interfaces rather than feeding arbitrary codes to every tree implementation." }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "",
      /* @__PURE__ */ jsx13("strong", { children: "category_policies.py \u2014 actual new checked process." }),
      ""
    ] }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/category_policies.py", filename: "category_policies.py", language: "python", title: "category_policies.py" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Whole recorded stdout (exact captured new stdout bytes):" }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/category_policies.stdout.txt", filename: "category_policies.stdout.txt", language: "output", title: "Recorded stdout \xB7 category_policies.stdout.txt" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Counting costs O(n), with O(v log v) sorting for reproducible vocabulary order. One sparse one-hot field needs at most one active entry per row; dense output still has n\xD7v cells. Rare grouping discards individual identities deliberately. Unknown all-zero encoding is not neutral: it is distance 1 from a full known one-hot row, closer than the \u221A2 between two known categories. With a dropped reference it can coincide with the reference. Monitoring unseen valid labels remains an application decision even when transformation does not raise." }),
    /* @__PURE__ */ jsx13(H2, { children: "4. A missing value is a question, not a zero" }),
    /* @__PURE__ */ jsx13(H3, { children: "A transparent fill preserves its recording history" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "Switch to the constructed measurements ",
      /* @__PURE__ */ jsx13("code", { children: "[10,20,NA,NA]" }),
      ". Draw the observed order statistics, filled cells and original missing mask side by side."
    ] }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D13" }),
    /* @__PURE__ */ jsx13(Prose, { children: "The median of the observed 10 and 20 is 15. Replacing the two missing cells gives [10,20,15,15], with M=[0,0,1,1]. It is a usable numerical input, but its spread is reduced: population squared deviations from 15 average to 12.5, versus 25 among the two observed values. Neither figure estimates the true full-data variance without assumptions. Both [10,20,10,20] and [10,20,50,60] agree with the observations; their full means are 15 and 35. Filling did not decide which unseen world occurred." }),
    /* @__PURE__ */ jsx13(Prose, { children: "An actual measured 15 and a filled 15 have the same numeric coordinate. Appending M lets a predictor distinguish their recording histories. This can help when measurement is selective. If collection policy changes, the indicator relationship can change too. A measured zero remains observed; we represent absence with NaN, not every zero." }),
    /* @__PURE__ */ jsx13(H3, { children: "What caused the gap?" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "Now compare three ",
      /* @__PURE__ */ jsx13("strong", { children: "specified generators" }),
      " for missing mass while holding a small station/weight table visible. Their probability rules are assumptions about the recording process, not diagnoses inferred from the mask."
    ] }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D14" }),
    /* @__PURE__ */ jsx13(Prose, { children: "MCAR means missingness is independent of the data values under the stated model. An independent coin erasing mass with probability .2 is an example. MAR permits dependence on observed information: station a erases with probability .1 and station b with probability .6, with no remaining weight dependence within a station. Rates can be unequal and still satisfy that conditional assumption. MNAR permits remaining dependence on the unseen value, such as a scale failing above an unrecorded weight threshold even after conditioning on other observed information. Remember M=1 means missing here; statistical texts often state these conditions using R=1 observed instead." }),
    /* @__PURE__ */ jsx13(Prose, { children: "The same observed pattern may be compatible with different mechanisms. Observed cells generally cannot rule out all MNAR alternatives. MAR alone is also not a universal inferential validity certificate: the imputation/analysis model and relevant ignorability conditions matter. A descriptive co-missingness plot shows which gaps occur together, not why. Structural \u201Cnot applicable\u201D may need a distinct state rather than an estimated measurement. Complete-case deletion can alter which population is represented and reduce precision; there is no universal percentage below which deletion is safe. Indicators can improve prediction without identifying unseen values or fixing MNAR." }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "The simple-fill program saves observed counts and a median, mean or declared constant for each named feature. Transform returns both completed values and the original mask. All-missing training columns are rejected by default; an explicit constant policy retains width. ",
      /* @__PURE__ */ jsx13("code", { children: "SimpleImputer(keep_empty_features=True)" }),
      " is an ordinary route with its own empty-column semantics. We compare supported observed-column median behavior, rather than pretending every constant policy is identical."
    ] }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "",
      /* @__PURE__ */ jsx13("strong", { children: "masked_simple_imputation.py \u2014 actual new checked process." }),
      ""
    ] }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/masked_simple_imputation.py", filename: "masked_simple_imputation.py", language: "python", title: "masked_simple_imputation.py" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Whole recorded stdout (exact captured new stdout bytes):" }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/masked_simple_imputation.stdout.txt", filename: "masked_simple_imputation.stdout.txt", language: "output", title: "Recorded stdout \xB7 masked_simple_imputation.stdout.txt" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "",
      /* @__PURE__ */ jsx13("code", { children: "fit_mixed" }),
      " is also the complete supported successor for the indicator/robust modification introduced later with the retained P1. It does not import or run P1's top-level example. Its three stages fit fills, fit a standard or robust numeric ruler on the filled training matrix, then save category order. ",
      /* @__PURE__ */ jsx13("code", { children: "mixed_transform" }),
      " appends the original mask ",
      /* @__PURE__ */ jsx13("strong", { children: "after" }),
      " the numeric and category coordinates. MissingIndicator(features='all', error_on_new=False) supplies the same fixed-width indicator branch. SimpleImputer(add_indicator=True) instead includes only columns missing during fitting; a newly missing column can therefore lack its own indicator. The printed widths make that difference concrete."
    ] }),
    /* @__PURE__ */ jsx13(H3, { children: "Borrow only from rows that can donate this target" }),
    /* @__PURE__ */ jsx13(Prose, { children: "For local conditional information, compare the constructed query Q=[2,12,NA] with three donors. Look first at which coordinates can be compared." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D15" }),
    /* @__PURE__ */ jsx13(NeuralTable, { caption: "Borrow only from rows that can donate this target", headers: [/* @__PURE__ */ jsx13(Fragment6, { children: "Row" }), /* @__PURE__ */ jsx13(Fragment6, { children: "a" }), /* @__PURE__ */ jsx13(Fragment6, { children: "b" }), /* @__PURE__ */ jsx13(Fragment6, { children: "c" })], rows: [[/* @__PURE__ */ jsx13(Fragment6, { children: "Q" }), /* @__PURE__ */ jsx13(Fragment6, { children: "2" }), /* @__PURE__ */ jsx13(Fragment6, { children: "12" }), /* @__PURE__ */ jsx13(Fragment6, { children: "NA" })], [/* @__PURE__ */ jsx13(Fragment6, { children: "D1" }), /* @__PURE__ */ jsx13(Fragment6, { children: "1" }), /* @__PURE__ */ jsx13(Fragment6, { children: "10" }), /* @__PURE__ */ jsx13(Fragment6, { children: "100" })], [/* @__PURE__ */ jsx13(Fragment6, { children: "D2" }), /* @__PURE__ */ jsx13(Fragment6, { children: "3" }), /* @__PURE__ */ jsx13(Fragment6, { children: "NA" }), /* @__PURE__ */ jsx13(Fragment6, { children: "300" })], [/* @__PURE__ */ jsx13(Fragment6, { children: "D3" }), /* @__PURE__ */ jsx13(Fragment6, { children: "NA" }), /* @__PURE__ */ jsx13(Fragment6, { children: "14" }), /* @__PURE__ */ jsx13(Fragment6, { children: "500" })]] }),
    /* @__PURE__ */ jsx13(Prose, { children: "Q and D1 overlap on a,b; Q and D2 only a; Q and D3 only b. The target c is missing in Q, so none of the donors' c values enter a Q-to-donor distance. Having a defined distance and observing the requested target are separate requirements." }),
    /* @__PURE__ */ jsx13(Prose, { children: "Draw the overlap counts and adjusted squared differences before ranking lengths." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D16" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "For total width d and q jointly observed coordinates, the nan-aware squared distance is ",
      /* @__PURE__ */ jsx13("code", { children: "(d/q) \u03A3shared \u0394\xB2" }),
      ". Here d=3. D1 gives (3/2)(1+4)=7.5; D2 gives 3(1)=3; D3 gives 3(4)=12. The distances are their square roots, not 7.5,3,12 drawn as Euclidean lengths. No overlap means an undefined distance, not zero. The factor extrapolates the average squared discrepancy across the full width; weak or selective overlap can make this a poor similarity estimate."
    ] }),
    /* @__PURE__ */ jsx13(Prose, { children: "Now connect only the selected target cells to the estimate." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D17" }),
    /* @__PURE__ */ jsx13(Prose, { children: "With k=2 and uniform weights, D2 and D1 supply (300+100)/2=200. Remove D2's c and it cannot donate c even though its observed a still permits a comparison; D1 and D3 now give 300. Separately, change D1's c to 140 with all original cells otherwise restored: selection stays D2,D1 and the answer becomes 220. Changing unused D3 c can be a null. If no target-eligible donor has any overlap, the fallback uses the training target's observed mean, 300 here. If the entire training target column is absent, no donor evidence supports an estimate; our default refuses it, while an explicit constant policy remains a modeling choice." }),
    /* @__PURE__ */ jsx13(PreparationInvestigation, { id: "L5" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Select and edit one actual Q/donor input cell, including marking it absent, and vary k. Eligibility, overlap, distances, selected c cells and result update together. Start at 200; inspect the 300 and 220 contrasts and the no-overlap fallback. Stable source-index ties are our custom policy. sklearn need not select the same tied subset; compare untied cases or aggregates invariant to the tie." }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "For multiple missing query features, compute distances from the ",
      /* @__PURE__ */ jsx13("strong", { children: "original" }),
      " query once. Filling c must not silently make c available when selecting donors for another target. This differs from iterative conditional completion, which deliberately uses current filled predictors and will receive its own algorithm. Read the full target-specific selection loop below."
    ] }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "",
      /* @__PURE__ */ jsx13("strong", { children: "nan_aware_donors.py \u2014 actual new checked process." }),
      ""
    ] }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/nan_aware_donors.py", filename: "nan_aware_donors.py", language: "python", title: "nan_aware_donors.py" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Whole recorded stdout (exact captured new stdout bytes):" }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/nan_aware_donors.stdout.txt", filename: "nan_aware_donors.stdout.txt", language: "output", title: "Recorded stdout \xB7 nan_aware_donors.stdout.txt" }),
    /* @__PURE__ */ jsx13(Prose, { children: "The state keeps copies of training donors, observed means and counts. For each query, the shared mask creates one distance vector. For each missing target, it filters eligible target-observed rows, stably orders them and chooses up to k defined distances. Uniform means and normalized inverse-distance weights are separate choices; when exact-zero donors occur, distance weighting shares mass among exact matches, avoiding division by zero. Observed query cells remain unchanged. Distance work is O(qnd) for q query rows; full donor sorting costs O(n log n) per missing target in this transparent reference. Reusing the distance vector saves repeated coordinate arithmetic, but does not make a wide incomplete table free." }),
    /* @__PURE__ */ jsx13(Prose, { children: "Iterative completion can use broader feature relationships. For a first conceptual turn, if complete cases follow mass=100\xD7length, observed length 3 can suggest missing mass 300. That is a fitted conditional estimate, not a measurement. When another row lacks length, a later model may use currently filled mass. Section 9 builds and saves this sequence rather than leaving the mechanism inside an unexplained estimator." }),
    /* @__PURE__ */ jsx13(H2, { children: "5. Learn the preparation rule without looking ahead" }),
    /* @__PURE__ */ jsx13(H3, { children: "Fit and transform have different information" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Fit learns state: medians, centers, scales, vocabulary or parameters. Transform applies that state to new inputs. A query must not redefine its own ruler. If training endpoints are 1 and 100, later 150 maps to 149/99; fitting again on the later batch changes the question." }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "Switch to P1's ",
      /* @__PURE__ */ jsx13("strong", { children: "four-row constructed example with three numeric features" }),
      ", not the penguin experiment's four. Follow each training column into its saved arrays."
    ] }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D18" }),
    /* @__PURE__ */ jsx13(Prose, { children: "The training numeric rows are [10,100,7], [20,NA,7], [30,300,7], [NA,500,7]. Medians are [20,300,7]. After filling, means are [20,300,7] and population scales [\u221A50,\u221A20000,1], with 1 replacing the third column's zero spread. Categories b,a,missing,a give sorted columns a,b,not_recorded. These arrays, not the later batch, determine subsequent coordinates." }),
    /* @__PURE__ */ jsx13(Prose, { children: "Join the actual numeric and categorical cells in their invariant order." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D19" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "P1 outputs three numeric plus three one-hot coordinates: width ",
      /* @__PURE__ */ jsx13("strong", { children: "6" }),
      ". The later real penguin pipeline has four numeric plus three one-hot coordinates: width ",
      /* @__PURE__ */ jsx13("strong", { children: "7" }),
      ". This switch is explicit. The target remains separate in both. In a Pipeline, steps in one branch run sequentially; ColumnTransformer runs designated column branches and concatenates their outputs in the declared order. Output names are part of the schema, not decoration."
    ] }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "The retained complete P1 below constructs the state with NumPy, then fits SimpleImputer, StandardScaler and OneHotEncoder on the same inputs to compare supported behavior. Its exact source and recorded stdout are preserved from the historical execution; this content revision did not replay its main. The scratch policy rejects all-missing training numeric columns and reserves ",
      /* @__PURE__ */ jsx13("code", { children: "not_recorded" }),
      " for absence. That is a bounded teaching policy, not general equivalence to every library configuration."
    ] }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "",
      /* @__PURE__ */ jsx13("strong", { children: "fitted_preparation.py \u2014 historical retained native receipt." }),
      ""
    ] }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/fitted_preparation.py", filename: "fitted_preparation.py", language: "python", title: "fitted_preparation.py" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Whole recorded stdout (exact historical stdout literal):" }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/fitted_preparation.stdout.txt", filename: "fitted_preparation.stdout.txt", language: "output", title: "Recorded stdout \xB7 fitted_preparation.stdout.txt" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "",
      /* @__PURE__ */ jsx13("code", { children: "inputs" }),
      " checks row/column form and one category per row. ",
      /* @__PURE__ */ jsx13("code", { children: "np.where" }),
      " fills only NaNs, broadcasting the three saved medians across rows. Means/scales broadcast the same way at transform. Comparing each category against vocabulary positions creates one-hot membership; ",
      /* @__PURE__ */ jsx13("code", { children: "column_stack" }),
      " places the numeric block before it. The first query [25,NA,9],unknown becomes approximately [.707107,0,2,0,0,0]. Missing numeric feature two is filled with its fitted median and becomes zero here. Constant-training feature three later 9 becomes 2. The unknown category gets zeros; a missing category instead uses not_recorded. The second query's edited measurement 1000 changes its coordinate to about 4.949747 while state and the other row stay fixed."
    ] }),
    /* @__PURE__ */ jsx13(Prose, { children: "Keep a boundary around the rows allowed to fit those arrays; the query has no backward path." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D20" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Split before learning preparation. Unsupervised summaries can leak held-out feature distribution even without labels. Fit the preprocessing and predictor using training rows; transform the held-out inputs and compare predictions with held-out outcomes afterward. In a validation fold, that boundary is repeated with a fresh fitting state for the fold's training rows. This local explanation needs only a held-out subset; the next lesson owns complete selection, inner/outer assessment and refit procedures." }),
    /* @__PURE__ */ jsx13(PreparationInvestigation, { id: "L6" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Edit one numeric query cell with the P1 state pinned. Its output coordinate changes or uses the stored median; every fitted array remains unchanged. Change third-feature 7 to 9 and see 2. Reset restores the query, selection and current output together. A no-refit invariant is something to inspect, not a badge automatically earned by using a Pipeline." }),
    /* @__PURE__ */ jsx13(Prose, { children: "The complete P4 preparation combines numeric coordinates, category coordinates and the original missing-value mask, with standard or robust scaling. For [15,500,NA],b, standard numeric coordinates are [\u22121/\u221A2,\u221A2,0], category block [0,1,0], original mask [0,0,1]. Its nine-coordinate result is approximately [\u2212.707107,1.414214,0,0,1,0,0,0,1]. Robust state uses the filled training medians and linear IQR, with constant spread replaced by 1. The source and ordinary comparisons are already fully shown in section 4; practice changes its input rather than asking you to invent hidden helpers." }),
    /* @__PURE__ */ jsx13(Prose, { children: "Pipeline packages the boundary but does not repair a target-revealing feature, related subjects split on both sides, or a transformer manually fitted on all rows beforehand. TargetEncoder also has a deliberate training exception: fit_transform creates cross-fitted codes, whereas fit then transform creates full-fit codes. Section 8 teaches why the two representations differ." }),
    /* @__PURE__ */ jsx13(H2, { children: "6. A complete experiment on real penguin measurements" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Return now to the real Palmer Penguins file. It contains 344 observations; the supplied four measurements each have two missing rows, and recorded sex has eleven. Bill length/depth and flipper length are millimeters, mass grams. We select these four measurements plus sex and predict Adelie, Chinstrap or Gentoo. The data were collected for ecological research; this classification exercise does not establish performance for every future population or collection protocol." }),
    /* @__PURE__ */ jsx13(Prose, { children: "Inspect the preserved partition and correct counts on a common zero-based axis." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D21" }),
    /* @__PURE__ */ jsx13(Prose, { children: "The retained stratified seed-20 split has 258 training and 86 assessment rows. Each classifier uses five neighbors, identical categorical preparation and the same indices. The only comparison choice is the numerical ruler after median fill. The training majority baseline gets 38/86 correct. Raw numeric coordinates get 67, standard 84, min\u2013max 85, robust 85. An extra correct case does not identify a generally superior scaler. Repeatedly choosing from this held-out result makes it development evidence rather than fresh assessment; the next lesson formalizes a better selection protocol." }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "This exact full program and stdout are retained from the September 21 native receipt (NumPy 2.3.5, pandas 3.0.1, scikit-learn 1.9.1, Python 3.12 route). They have ",
      /* @__PURE__ */ jsx13("strong", { children: "not" }),
      " been rerun for this content revision. Keep penguins.csv beside the file. The exact historical LF execution-input identity and current CRLF download identity are both explained below."
    ] }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "",
      /* @__PURE__ */ jsx13("strong", { children: "penguins_prepare.py \u2014 historical retained native receipt." }),
      ""
    ] }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/penguins_prepare.py", filename: "penguins_prepare.py", language: "python", title: "penguins_prepare.py" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Whole recorded stdout (exact historical stdout literal):" }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/penguins_prepare.stdout.txt", filename: "penguins_prepare.stdout.txt", language: "output", title: "Recorded stdout \xB7 penguins_prepare.stdout.txt" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "",
      /* @__PURE__ */ jsx13("code", { children: "train_test_split" }),
      " returns source positions, stratifying by species. Numeric and categorical names select X; y is separate. ",
      /* @__PURE__ */ jsx13("code", { children: "make_model" }),
      " constructs new fitted objects for each comparison. Numeric Pipeline fills and then scales; categorical Pipeline inserts a reserved marker and then one-hot encodes. ColumnTransformer joins their outputs. The outer Pipeline applies fitted preparation before KNeighborsClassifier. ",
      /* @__PURE__ */ jsx13("code", { children: "fit(X.iloc[train], y.iloc[train])" }),
      " is the only fitting route. ",
      /* @__PURE__ */ jsx13("code", { children: "predict(X.iloc[test])" }),
      " applies saved state. \u201Cpassthrough\u201D leaves numeric units unchanged but retains median fill. DummyClassifier learns the training majority; it does not read the held-out class counts to choose its answer."
    ] }),
    /* @__PURE__ */ jsx13(Prose, { children: "Follow the actual source row 309 through frozen statistics into all seven coordinates." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D22" }),
    /* @__PURE__ */ jsx13(Prose, { children: "The numeric medians are [45,17.3,197,4000]. Training means after fill are approximately [43.9306,17.0992,200.6589,4190.9884]; scales [5.4000,1.9387,14.2307,806.6876]. Row 309's observed [51,18.8,203,4100] becomes approximately [1.3091,.8773,.1645,\u2212.1128]. The ordered categorical block is female,male,not_recorded, giving [0,1,0]. A negative mass coordinate means below the training mean, not negative physical mass." }),
    /* @__PURE__ */ jsx13(PreparationInvestigation, { id: "L7" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "Inspect a retained row or alter an independent copy, with fitted state fixed. Erasing row 309's mass supplies median 4000 and computes ",
      /* @__PURE__ */ jsx13("code", { children: "(4000\u22124190.988372093023)/806.6875829303058\u2248\u2212.2368" }),
      "; other coordinates stay unchanged. Editing sex affects the category block. A present unknown string maps all-zero under the saved policy; missing uses not_recorded. These are input inspection operations, not newly trained predictions or updated accuracy. All 86 retained transformed rows and predictions remain available in the data attachment."
    ] }),
    /* @__PURE__ */ jsx13(Prose, { children: "Now align source positions, split order and retained outcomes before interpreting the result's provenance." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D23" }),
    /* @__PURE__ */ jsx13(Prose, { children: "There are two exact byte identities for one parsed observation table. The actual current downloadable file has CRLF line endings and 15586 bytes. The historical execution input has LF line endings and 15241 bytes. Replacing every CRLF with LF in the current bytes gives the exact historical SHA-256, not merely a similar-looking table. The setup/source-role index prints both full hashes. Generated predecessor provenance still advertises the LF identity; that literal is historical metadata and does not describe the current download's raw bytes. None of this asserts a new fit against the current byte file. The 344 parsed rows preserve order/values/missing cells, and the 86 transformed rows equal the retained calculated JSON without numerical replay." }),
    /* @__PURE__ */ jsx13(Prose, { children: "Standard scaling misclassified two rows and raw coordinates nineteen on this split. Examine actual errors, feature availability and geometry before inventing a species story. The recording process and population matter more than a tidy score. This is a controlled application showing that representation changes an estimator's evidence; it is not a leaderboard or proof that prediction-oriented fills recover scientific truth." }),
    /* @__PURE__ */ jsx13(H2, { children: "7. Deeper branch: change the shape, not only the ruler" }),
    /* @__PURE__ */ jsx13(H3, { children: "Equal ratios, power families and fitted parameters" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "An affine map ",
      /* @__PURE__ */ jsx13("code", { children: "(x\u2212a)/b" }),
      " changes every gap by the same factor. Sometimes equal ratios should have equal influence instead. On the constructed values 1,10,100, follow equal tenfold steps into equal log differences."
    ] }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D24" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Natural logs give 0, ln10 and ln100=2ln10. Each tenfold change adds ln10\u22482.302585. This is useful when a multiplicative concentration change is the meaningful comparison. It does not justify logging an arbitrary signed measurement. log x requires x>0; log1p x means log(1+x), with a different domain x>\u22121 and a different offset." }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "Box\u2013Cox supplies a family: for x>0, ",
      /* @__PURE__ */ jsx13("code", { children: "g\u03BB(x)=(x^\u03BB\u22121)/\u03BB" }),
      " when \u03BB\u22600 and log x when \u03BB=0. Why this log limit? Write x^\u03BB=exp(\u03BBlog x); ",
      /* @__PURE__ */ jsx13("code", { children: "(exp(t)\u22121)/t\u21921" }),
      " as t\u21920. Multiplying by log x gives the result. At \u03BB=1, Box\u2013Cox gives x\u22121, an identity ",
      /* @__PURE__ */ jsx13("strong", { children: "up to an offset" }),
      ", whereas the signed Yeo\u2013Johnson family gives exactly x. The book's geometric-mean-normalized Box\u2013Cox convention is another stated scaling; our ordinary sklearn route uses the unnormalized formula here."
    ] }),
    /* @__PURE__ */ jsx13(Prose, { children: "For Yeo\u2013Johnson, see the positive and negative pieces and the active branch before doing arithmetic." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D25" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "For x\u22650, let v=1+x. Use ",
      /* @__PURE__ */ jsx13("code", { children: "(v^\u03BB\u22121)/\u03BB" }),
      ", or log v at \u03BB=0. For x<0, let u=1\u2212x>1. Use ",
      /* @__PURE__ */ jsx13("code", { children: "\u2212(u^(2\u2212\u03BB)\u22121)/(2\u2212\u03BB)" }),
      ", or \u2212log u at \u03BB=2. The reflected negative branch joins at zero and uses exponent 2\u2212\u03BB. Thus x=\u22123 gives \u22127.5 at \u03BB=0, \u22123 at \u03BB=1, and \u2212ln4\u2248\u22121.386294 at \u03BB=2. Positive 3 at \u03BB=1 gives 3 as well. \u201CNegative inputs use a square root\u201D misses the parameter dependence entirely."
    ] }),
    /* @__PURE__ */ jsx13(PreparationInvestigation, { id: "L8" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "Begin at Yeo\u2013Johnson x=\u22123, \u03BB=2 with the logarithmic negative branch visible. Change x and \u03BB to see the expression and coordinate move together. Box\u2013Cox nonpositive x is a domain refusal, not a point to clamp into the plot. Near \u03BB=0 or 2, ",
      /* @__PURE__ */ jsx13("code", { children: "expm1" }),
      " computes exp(t)\u22121 accurately without subtracting nearly equal floating-point numbers. ",
      /* @__PURE__ */ jsx13("code", { children: "log1p" }),
      " similarly computes log(1+t). Manually selecting \u03BB is an exploration; it must not be labeled a learned parameter."
    ] }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "Fitting \u03BB is a separate operation. Suppose a transformed scalar feature is approximated by a normal distribution with its mean and variance estimated at each \u03BB. The normal log density, maximized over mean/variance, contributes ",
      /* @__PURE__ */ jsx13("code", { children: "\u2212n log(v\u03BB)/2" }),
      " up to constants, where v\u03BB is the transformed ",
      /* @__PURE__ */ jsx13("strong", { children: "population" }),
      " variance. But transformed densities must be measured in the original x units. The derivative g\u2032 supplies a change-of-variables Jacobian; summing log|g\u2032(x\u1D62)| adds another term. Without it, shrinking all transformed numbers can falsely look like a better fit just by changing units."
    ] }),
    /* @__PURE__ */ jsx13(Prose, { children: "Inspect both terms over a finite constructed training column and mark the selected \u03BB on the computed curve." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D26" }),
    /* @__PURE__ */ jsx13(Prose, { children: "For positive Box\u2013Cox data," }),
    /* @__PURE__ */ jsx13("div", { className: "neural-equation", children: /* @__PURE__ */ jsx13(MathBlock, { children: "\\ell(\\lambda)=-\\frac n2\\log v_\\lambda+(\\lambda-1)\\sum_i\\log x_i." }) }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "For Yeo\u2013Johnson, replace the sum of logs by ",
      /* @__PURE__ */ jsx13("code", { children: "\u03A3 sign(x\u1D62) log(1+|x\u1D62|)" }),
      " in the Jacobian term. Positive branch derivative is (1+x)^(\u03BB\u22121); negative branch derivative is (1\u2212x)^(1\u2212\u03BB), giving that sign. Zero variance is degenerate: it is not an infinitely successful normalizing fit. Fit only on training observations, save \u03BB, then optionally fit a separate affine standardization on those transformed training values."
    ] }),
    /* @__PURE__ */ jsx13(Prose, { children: "The complete program implements forward/inverse families, objective terms and a bounded scalar search. SciPy's optimizer is a declared numerical primitive; it does not implement the owned transform or likelihood for us. Candidate endpoints are explicitly compared. State records name, bounds, selected \u03BB, objective, evaluation count and whether the selection is interior, boundary or capped. A bounded local search is not a universal global optimum theorem. A boundary result is information that the specified search range mattered." }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "",
      /* @__PURE__ */ jsx13("strong", { children: "fitted_power_maps.py \u2014 actual new checked process." }),
      ""
    ] }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/fitted_power_maps.py", filename: "fitted_power_maps.py", language: "python", title: "fitted_power_maps.py" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Whole recorded stdout (exact captured new stdout bytes):" }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/fitted_power_maps.stdout.txt", filename: "fitted_power_maps.stdout.txt", language: "output", title: "Recorded stdout \xB7 fitted_power_maps.stdout.txt" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "Read the inverse algebra alongside the code. For a nonzero exponent p, y=(v^p\u22121)/p implies ",
      /* @__PURE__ */ jsx13("code", { children: "log v=log1p(py)/p" }),
      ", requiring 1+py>0. This holds for either sign of p. In the zero-power limit log v=y. Undo the Yeo\u2013Johnson sign/shift after recovering v or u. Box\u2013Cox uses exp rather than expm1 because its original variable is v itself; Yeo\u2013Johnson removes the added 1. The saved center/scale are undone before the family inverse."
    ] }),
    /* @__PURE__ */ jsx13(Prose, { children: "The bounded Box\u2013Cox fixture [1,2,4,10,30] selects about \u2212.146859; the signed fixture [\u22123,\u22121,0,2,8] selects about .596210. These are small constructed fits, not ecology experiments. Same-\u03BB comparison against the ordinary family and PowerTransformer verifies formulas, while attained likelihood and actual learned \u03BB expose differences between bounded and library search. Do not assume every dataset's optima match. PowerTransformer standardizes by default; this code requests standardize=False for a clear family comparison. Work is O(n) per scalar objective evaluation, plus the search's evaluations. Domains, overflows and unsupported constant fits are refused. Better marginal shape does not guarantee jointly Gaussian features, correct regression residuals or better prediction." }),
    /* @__PURE__ */ jsx13(H3, { children: "A fitted quantile map is not a new-batch rank" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "An illustrative rank map for sorted [1,2,3,4,100] uses ",
      /* @__PURE__ */ jsx13("code", { children: "(rank\u22121)/4" }),
      ", giving 0,.25,.5,.75,1. It forgets the large final numerical gap. That old illustration explains rank; it is not the exact fitted QuantileTransformer algorithm, particularly with ties and unseen values."
    ] }),
    /* @__PURE__ */ jsx13(Prose, { children: "Switch to fitted value landmarks [1,2,2,4,100] and probabilities [0,.25,.5,.75,1]. Follow interpolation from a later value to its probability and, optionally, to a normal quantile." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D27" }),
    /* @__PURE__ */ jsx13(Prose, { children: "At a repeated landmark 2, ascending interpolation picks one edge of the tie interval and descending interpolation the other. Averaging gives (.25+.5)/2=.375. At 3, the interval from the last 2 at .5 to 4 at .75 gives .625. Below the fitted extent maps to 0, above to 1. Changing a later batch cannot recompute these landmarks; 3 alone and 3 beside 10000 must get the same coordinate." }),
    /* @__PURE__ */ jsx13(Prose, { children: "Uniform output uses u directly. Normal output uses \u03A6\u207B\xB9(u), the number below which a standard normal distribution places probability u. At u=.375 and .625, coordinates are about \u2212.318639 and .318639. Since \u03A6\u207B\xB9(0/1) is infinite, our explicitly declared finite clipping epsilon is 10\u207B\u2077; endpoints are about \xB15.199338. This is a coordinate convention, not evidence for a normal scientific data-generating process." }),
    /* @__PURE__ */ jsx13(PreparationInvestigation, { id: "L9" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Change only the query, keeping landmarks visible. A query 1000 saturates at the upper endpoint. Many large values therefore merge. A duplicate 2 always receives the same tie result. Query edits never refit. Normal output changes numerical spacing again but preserves the declared ordering away from merged points." }),
    /* @__PURE__ */ jsx13(Prose, { children: "The complete program saves column names, reference probabilities and fitted landmarks, skips NaNs during fit and preserves them in transformation. It implements both interpolation directions and the inverse's limited return to fitted value space. Exact inversion is impossible after saturation or merged ties. Its custom constant-column convention is 0 below c, .5 at c, 1 above c. Actual sklearn 1.9.1 maps the constant c itself to 0 in the checked uniform case, so the two policies are printed separately. Its normal endpoint source also uses 10\u207B\u2077 minus spacing(1) and a boundary tolerance; we compare supported interior values, not claim bit-level endpoint identity." }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "",
      /* @__PURE__ */ jsx13("strong", { children: "fitted_quantile_maps.py \u2014 actual new checked process." }),
      ""
    ] }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/fitted_quantile_maps.py", filename: "fitted_quantile_maps.py", language: "python", title: "fitted_quantile_maps.py" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Whole recorded stdout (exact captured new stdout bytes):" }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/fitted_quantile_maps.stdout.txt", filename: "fitted_quantile_maps.stdout.txt", language: "output", title: "Recorded stdout \xB7 fitted_quantile_maps.stdout.txt" }),
    /* @__PURE__ */ jsx13(Prose, { children: "QuantileTransformer(n_quantiles=5, subsample=None, random_state=20) makes the ordinary landmark choice explicit. Subsampling can change fitted landmarks, so it must be part of a reproducibility statement. Sorting costs O(dn log n), and interpolation about O(qd log k) for q queries and k landmarks. This nonlinear marginal map can alter correlations and remove useful magnitude. A pleasant histogram is not a sufficient selection criterion." }),
    /* @__PURE__ */ jsx13(H3, { children: "Add boundaries and interactions deliberately" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Bins replace a measurement by an interval. Look at actual training points and the fitted edges before inspecting the one-hot interval coordinate." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D28" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Uniform four-bin edges for [1,2,2,4,100] are [1,25.75,50.5,75.25,100]. Linear-quantile requested edges are [1,2,2,4,100]; merging duplicate edges leaves [1,2,4,100], only three effective bins. Equal requested counts do not guarantee equal populations when ties cannot be split by a value boundary. Our membership uses right insertion at an interior edge: x=2 enters the interval beginning at 2. Outside the fitted range stays in the first/last bin. A coordinate for a bin is not a continuous value within it; distinctions are intentionally lost." }),
    /* @__PURE__ */ jsx13(Prose, { children: "K-means bins add a fitted-center mechanism. Assign each value to its nearest supplied center, update each nonempty cluster to its mean, repeat to a cap/tolerance, sort distinct final centers and form midpoint boundaries. The full local one-dimensional Lloyd loop declares earlier-center ties and retains an empty center. Invalid outer partitions from exceptional retained empty centers are refused. With [0,1,2,8,9,10] and initial centers [0,10], the first update gives [1,9], the next is unchanged, and the midpoint edge is 5. KMeans with an explicit (k,1) center array, n_init=1 and algorithm='lloyd' is the controlled comparator. KBinsDiscretizer(strategy='kmeans') is a separate route; it accepts neither init nor n_init and owns its own initialization. Stopping and empty-cluster rules can differ, so this supported match is not universal parity." }),
    /* @__PURE__ */ jsx13(Prose, { children: "Polynomial features retain numbers and add products. Trace each exponent column from the constructed row (a,b)=(2,3)." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D29" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "Degree two with bias gives [1,a,b,a\xB2,ab,b\xB2]=[1,2,3,4,6,9]. The exponent rows are (0,0),(1,0),(0,1),(2,0),(1,1),(0,2). A coefficient multiplying ab makes one variable's influence depend on the other. A model is still linear ",
      /* @__PURE__ */ jsx13("strong", { children: "in its coefficients" }),
      ", though nonlinear in original measurements. Interaction-only omits a\xB2/b\xB2 and keeps [1,2,3,6]. Adding a bias feature beside a model intercept duplicates a constant column. With d variables, total-degree-p features including bias number C(d+p,p); width and conditioning can grow quickly. The complete implementation bounds degree/width before allocation and refuses overflowing products."
    ] }),
    /* @__PURE__ */ jsx13(Prose, { children: "The following program separately owns fitted bins, Lloyd updates, monomial generation and the stateless cycle function used shortly. Keeping functions separate makes their different state contracts visible. Ordinary KBinsDiscretizer specifies quantile_method='linear' and subsample=None, avoiding the version 1.9 default percentile change. PolynomialFeatures exposes powers_ so output order is checked directly." }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "",
      /* @__PURE__ */ jsx13("strong", { children: "bins_polynomials_cycles.py \u2014 actual new checked process." }),
      ""
    ] }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/bins_polynomials_cycles.py", filename: "bins_polynomials_cycles.py", language: "python", title: "bins_polynomials_cycles.py" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Whole recorded stdout (exact captured new stdout bytes):" }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/bins_polynomials_cycles.stdout.txt", filename: "bins_polynomials_cycles.stdout.txt", language: "output", title: "Recorded stdout \xB7 bins_polynomials_cycles.stdout.txt" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Separate actual stderr diagnostic:" }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/bins_polynomials_cycles.stderr.txt", filename: "bins_polynomials_cycles.stderr.txt", language: "output", title: "Recorded stderr \xB7 bins_polynomials_cycles.stderr.txt" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Inspect the retained warning about quantile bins too narrow to keep; it is the ordinary route documenting the merged-edge condition, not a failed calculation. Bin fitting uses O(n) reductions or sorting for quantiles; membership searches edges. Each Lloyd iteration compares n\xD7k distances then reduces clusters, bounded by the recorded cap. Monomial evaluation costs proportional to output cells and exponent work; its combinatorial width is a modeling and storage choice. Capacity settings need training-only selection, not after-the-fact tuning on assessment outcomes." }),
    /* @__PURE__ */ jsx13(H3, { children: "Draw the local basis before fitting a curve" }),
    /* @__PURE__ */ jsx13(Prose, { children: "A spline basis supplies local overlapping functions. Coefficients combine them into a curve; choosing the basis does not itself estimate those coefficients. Start with degree-zero interval indicators, then watch adjacent pieces combine at degree one." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D30" }),
    /* @__PURE__ */ jsx13(Prose, { children: "For full nondecreasing knots t\u2080,\u2026,t\u2096, define B\u1D62,0(x)=1 on [t\u1D62,t\u1D62\u208A\u2081), 0 otherwise. A higher-degree basis is" }),
    /* @__PURE__ */ jsx13("div", { className: "neural-equation", children: /* @__PURE__ */ jsx13(MathBlock, { children: "B_{i,p}(x)=\\frac{x-t_i}{t_{i+p}-t_i}B_{i,p-1}(x)\n +\\frac{t_{i+p+1}-x}{t_{i+p+1}-t_{i+1}}B_{i+1,p-1}(x)." }) }),
    /* @__PURE__ */ jsx13(Prose, { children: "A zero-width denominator contributes zero. This recurrence blends neighboring supported pieces; outside a piece's knot support its contribution is zero. Degree one makes triangles, degree two smoother pieces. For degree one and extended knots [\u22121,0,1,2,3], the supported base interval is [0,2]. At x=.5, the row is [.5,.5,0]; at x=2, [0,0,1]. Given coefficients [2,4,1], the first prediction is .5\xD72+.5\xD74=3 and the endpoint prediction 1. Nonnegative basis rows sum to one inside the supported interval, so a constant coefficient vector produces a constant function. Only nearby bases are active: this gives the design matrix its banded pattern and lets a coefficient change affect a local part of the curve." }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "The base knots [0,1,2] differ from the extended full knot vector. Our saved state extends each end by degree times the adjacent spacing, matching the inspected ordinary nonperiodic convention. A right endpoint uses its interior limiting value; the linear extrapolation derivative there is the ",
      /* @__PURE__ */ jsx13("strong", { children: "left" }),
      " derivative. For degree one, using the outside derivative would choose the wrong piece at a knot. Constant extrapolation uses the nearest boundary basis row; error policy refuses outside values; linear policy continues with that interior derivative. Beyond the fitted interval, linearly extrapolated basis entries can be negative, so interior nonnegativity should not be advertised there."
    ] }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "",
      /* @__PURE__ */ jsx13("strong", { children: "local_spline_basis.py \u2014 actual new checked process." }),
      ""
    ] }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/local_spline_basis.py", filename: "local_spline_basis.py", language: "python", title: "local_spline_basis.py" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Whole recorded stdout (exact captured new stdout bytes):" }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/local_spline_basis.stdout.txt", filename: "local_spline_basis.stdout.txt", language: "output", title: "Recorded stdout \xB7 local_spline_basis.stdout.txt" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "The program implements the complete recurrence, knot fitting/extension, basis design, derivative and saved extrapolation policy. NumPy provides arrays; SciPy BSpline independently compares supported rows; SplineTransformer supplies the ordinary preprocessing route with explicit knots, include_bias=True and handle_missing='error'. sklearn 1.9.1 raised a shape error for degree-zero constant extrapolation outside its interval in the first author check. The final comparison therefore checks degree-zero ",
      /* @__PURE__ */ jsx13("strong", { children: "interior" }),
      " values, custom constant outside values separately, and degree-one/two outside policies. The failed source/streams remain in author evidence. A later repair fixed the custom right-boundary derivative before the final checked source. These are scoped findings, not a reason to assert all library splines are unreliable."
    ] }),
    /* @__PURE__ */ jsx13(Prose, { children: "Natural cubic splines impose a different boundary constraint; they are not the same as this B-spline feature API. Full basis rows already sum to one, so another intercept can create rank dependence. Dropping a basis column is a parameterization choice. The transparent recurrence uses O(qpK) work and O(qK) workspace for q values, degree p and K intermediate bases; optimized routines exploit local support. It intentionally delegates no owned recurrence to the ordinary estimator. Missing input is refused rather than equated with the all-zero feature vector." }),
    /* @__PURE__ */ jsx13(H3, { children: "Close a genuine cycle's seam" }),
    /* @__PURE__ */ jsx13(Prose, { children: "A direction wraps after a full turn; elapsed duration does not. Draw both coordinates of the unit circle so the seam has a geometric meaning." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D31" }),
    /* @__PURE__ */ jsx13(Prose, { children: "For period P, encode t as [cos(2\u03C0t/P),sin(2\u03C0t/P)]. NumPy expects radians; P=360 converts degrees. Angles 350\xB0 and 10\xB0 become approximately [.984808,\u2212.173648] and [.984808,.173648], chord distance 2sin10\xB0\u2248.347296. The raw 340-degree difference was a coordinate seam. Zero and 360 coincide by design. Sine alone merges 30\xB0 and 150\xB0 at .5; cosine distinguishes +.866025 from \u2212.866025. P10 provides the full function and FunctionTransformer comparison." }),
    /* @__PURE__ */ jsx13(PreparationInvestigation, { id: "L10" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Move either angle and inspect both projections and chord. Try 1/359, opposite points, and the sine-only collision. Equal physical axis scales keep a circle circular. The map deliberately forgets completed cycles: that suits time of day or direction if the task is periodic, but it is wrong for elapsed hours when days of duration matter. Preserve a noncyclic magnitude coordinate when it carries required information." }),
    /* @__PURE__ */ jsx13(H2, { children: "8. Deeper branch: high-cardinality categories and target information" }),
    /* @__PURE__ */ jsx13(H3, { children: "Shrink noisy category estimates" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "One-hot width may grow large for many products or devices. A target encoding replaces a category by an estimate of its target behavior. For category c with n_c permitted donor targets and sum s_c, prior mean \u03BC and smoothing \u03B1\u22650, use ",
      /* @__PURE__ */ jsx13("code", { children: "t_c=(s_c+\u03B1\u03BC)/(n_c+\u03B1)" }),
      " when n_c>0. For no donors use \u03BC, including \u03B1=0; this explicit fallback avoids 0/0."
    ] }),
    /* @__PURE__ */ jsx13(Prose, { children: "Draw the actual target cells contributing to the category average, then their weights on a scalar segment toward the prior." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D32" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "For one positive target, \u03BC=.5 and \u03B1=2, t=(1+1)/3=2/3. Write it as ",
      /* @__PURE__ */ jsx13("code", { children: "(n/(n+\u03B1)) category_mean + (\u03B1/(n+\u03B1)) \u03BC" }),
      ". The singleton receives weight 1/3; a category with 100 positives receives 100/102 and a result 101/102\u2248.990196. More support reduces the pull to the prior. At \u03B1=0 a supported category uses its own donor mean; large \u03B1 approaches \u03BC."
    ] }),
    /* @__PURE__ */ jsx13(PreparationInvestigation, { id: "L11a" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "Change \u03B1 while inspecting a singleton or the 100-row support fixture. Start at 2/3. The target counts and both weights remain visible. An absent category uses the prior. Shrinkage addresses unstable estimates, but it does ",
      /* @__PURE__ */ jsx13("strong", { children: "not" }),
      " prevent a training row's answer from entering its own feature. These are different problems."
    ] }),
    /* @__PURE__ */ jsx13(H3, { children: "Remove the row's fold from every target path" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Without separation, an unsmoothed singleton encodes its own target exactly. Even with smoothing, its answer enters the numerator and often the prior. A downstream model can then learn an answer-containing input it will not have for a genuinely new row." }),
    /* @__PURE__ */ jsx13(Prose, { children: "Switch to the retained constructed six rows. Follow all target-to-prior edges, not only the matching-category edge." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D33" }),
    /* @__PURE__ */ jsx13(NeuralTable, { caption: "Remove the row's fold from every target path", headers: [/* @__PURE__ */ jsx13(Fragment6, { children: "Row" }), /* @__PURE__ */ jsx13(Fragment6, { children: "Category" }), /* @__PURE__ */ jsx13(Fragment6, { children: "Target" }), /* @__PURE__ */ jsx13(Fragment6, { children: "Fold" }), /* @__PURE__ */ jsx13(Fragment6, { children: "OOF value, \u03B1=2" })], rows: [[/* @__PURE__ */ jsx13(Fragment6, { children: "0" }), /* @__PURE__ */ jsx13(Fragment6, { children: "A" }), /* @__PURE__ */ jsx13(Fragment6, { children: "1" }), /* @__PURE__ */ jsx13(Fragment6, { children: "0" }), /* @__PURE__ */ jsx13(Fragment6, { children: "5/9" })], [/* @__PURE__ */ jsx13(Fragment6, { children: "1" }), /* @__PURE__ */ jsx13(Fragment6, { children: "A" }), /* @__PURE__ */ jsx13(Fragment6, { children: "1" }), /* @__PURE__ */ jsx13(Fragment6, { children: "1" }), /* @__PURE__ */ jsx13(Fragment6, { children: "7/9" })], [/* @__PURE__ */ jsx13(Fragment6, { children: "2" }), /* @__PURE__ */ jsx13(Fragment6, { children: "B" }), /* @__PURE__ */ jsx13(Fragment6, { children: "0" }), /* @__PURE__ */ jsx13(Fragment6, { children: "0" }), /* @__PURE__ */ jsx13(Fragment6, { children: "2/9" })], [/* @__PURE__ */ jsx13(Fragment6, { children: "3" }), /* @__PURE__ */ jsx13(Fragment6, { children: "B" }), /* @__PURE__ */ jsx13(Fragment6, { children: "0" }), /* @__PURE__ */ jsx13(Fragment6, { children: "1" }), /* @__PURE__ */ jsx13(Fragment6, { children: "4/9" })], [/* @__PURE__ */ jsx13(Fragment6, { children: "4" }), /* @__PURE__ */ jsx13(Fragment6, { children: "C" }), /* @__PURE__ */ jsx13(Fragment6, { children: "1" }), /* @__PURE__ */ jsx13(Fragment6, { children: "0" }), /* @__PURE__ */ jsx13(Fragment6, { children: "2/9" })], [/* @__PURE__ */ jsx13(Fragment6, { children: "5" }), /* @__PURE__ */ jsx13(Fragment6, { children: "C" }), /* @__PURE__ */ jsx13(Fragment6, { children: "0" }), /* @__PURE__ */ jsx13(Fragment6, { children: "1" }), /* @__PURE__ */ jsx13(Fragment6, { children: "7/9" })]] }),
    /* @__PURE__ */ jsx13(Prose, { children: "For held fold 0, donors are rows 1,3,5 with targets [1,0,0], giving \u03BC=1/3. Row 0's A numerator uses target 1 from row 1 and 2\u03BC=2/3; divide by 1+2 to get 5/9. For fold 1, donors 0,2,4 give \u03BC=2/3, hence row 1 gets 7/9. All donor targets enter the prior, even categories that do not match. Computing a global \u03BC before splitting would leave a leakage path around the category exclusion." }),
    /* @__PURE__ */ jsx13(Prose, { children: "Change row 0's own target 1\u21920. Fold-0 encodings stay unchanged. Fold-1 values become [2/9,2/9,5/9]; B changed even though no B target changed, through \u03BC. The exact retained historical program below computes this default \u03B1=2 example and its recorded stdout. It remains unchanged and was not replayed here. Its minimal callable is not a robust arbitrary-input API: \u03B1=0 with no matching-category donors can divide by zero, and empty donor sets are not validated. The new P9 below is the separately named supported successor." }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "",
      /* @__PURE__ */ jsx13("strong", { children: "cross_fit.py \u2014 historical retained native receipt." }),
      ""
    ] }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/cross_fit.py", filename: "cross_fit.py", language: "python", title: "cross_fit.py" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Whole recorded stdout (exact historical stdout literal):" }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/cross_fit.stdout.txt", filename: "cross_fit.stdout.txt", language: "output", title: "Recorded stdout \xB7 cross_fit.stdout.txt" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "",
      /* @__PURE__ */ jsx13("code", { children: "donors = folds != held_fold" }),
      " creates the permitted set. The prior is recomputed inside that loop; the inner category mask narrows those same donors. Reusing a target mean from all rows would change the dependency, even if many values looked similar on a small example. The printed null for row 0 tests exclusion, not absence of all statistical dependence between training features and other rows' targets."
    ] }),
    /* @__PURE__ */ jsx13(PreparationInvestigation, { id: "L11b" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Edit one category/target/fold cell and choose an inspected row with \u03B1 fixed at 2. Begin at row 0=5/9. Flip row 3's target: row 0 becomes 7/9 via the prior while row 3's own encoding remains 4/9. Flip the inspected row's own target and inspect its null. The dependency arrows, donor IDs, numerator, prior and full output array must stay synchronized. Emptying a donor fold is an error, not a displayed NaN mislabeled as a valid encoding." }),
    /* @__PURE__ */ jsx13(H3, { children: "Training and inference are intentionally different" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "OOF means out-of-fold: each training row's feature uses a permitted other-row fit. For a later external row, use a map fitted on the ",
      /* @__PURE__ */ jsx13("strong", { children: "whole outer training set" }),
      ", because those targets are then available. Draw the two states and their row coverage side by side."
    ] }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D34" }),
    /* @__PURE__ */ jsx13(Prose, { children: "With \u03B1=2 and the whole six-row training prior .5, full-fit A codes are .75, B .25, C .5; without smoothing (\u03B1=0), A=1, B=0, C=.5. These are different from the OOF values by design. The downstream model trains on OOF features, then sees full-fit encodings for later inference. The outer assessment targets enter neither state. TargetEncoder.fit_transform implements internal cross-fitting; fit(...).transform(...) does not produce those training OOF values. Explicit target_type='continuous' prevents integer-valued regression targets being inferred as multiclass; actual multiclass encoding expands columns for classes and is a separate shape contract." }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "The robust successor accepts explicit index pairs, validates nonempty disjoint donors, forbids repeated validation coverage and reports row coverage. It rebuilds sums ",
      /* @__PURE__ */ jsx13("strong", { children: "and priors" }),
      " within every split. Group validation checks no group ID appears on both sides. Past-only validation requires max donor time < min held time. This is a local information contract; it does not select a scientifically appropriate outer split automatically."
    ] }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "",
      /* @__PURE__ */ jsx13("strong", { children: "fitted_target_encoding.py \u2014 actual new checked process." }),
      ""
    ] }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/fitted_target_encoding.py", filename: "fitted_target_encoding.py", language: "python", title: "fitted_target_encoding.py" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Whole recorded stdout (exact captured new stdout bytes):" }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/fitted_target_encoding.stdout.txt", filename: "fitted_target_encoding.stdout.txt", language: "output", title: "Recorded stdout \xB7 fitted_target_encoding.stdout.txt" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "The ordinary same-fold comparison uses TargetEncoder(smooth=2, target_type='continuous', cv=splits). sklearn 1.9.1 requires every training row in validation exactly once for that internal cv API. Ordinary expanding TimeSeriesSplit leaves the earliest warm-up observations unvalidated; passing it as though it were a full-coverage drop-in is invalid. The chronological path here instead fits an ordinary encoder manually in each past-only window, transforms that window's future rows, and returns only the aligned retained row indices, features ",
      /* @__PURE__ */ jsx13("strong", { children: "and targets" }),
      ". For this six-row example, rows [2,3,4,5] remain, targets [0,0,1,0], codes [1,1,.5,.5]; coverage [0,0,1,1,1,1] exposes the warm-up gap. There is no encoded placeholder trained on future targets."
    ] }),
    /* @__PURE__ */ jsx13(Prose, { children: "Groups and time answer different dependence questions. Group-disjoint random folds can use later times; past-only windows can include repeated subjects. If the application needs both restrictions, each permitted donor pair must satisfy both, possibly reducing support substantially. A time/group rule cannot be inferred from a category string alone. This transparent reference scans a donor column for each distinct category: aggregation takes O(nv) for n donor rows and v categories, plus category sorting, repeated across K splits. A dictionary accumulation can reduce aggregation to O(n) per split; an optimized subtraction implementation must still preserve every donor restriction, including priors. Full-fit inference state is immutable. Reserved string markers remain validated, missing is one category, and unseen values use the fitted prior even at \u03B1=0." }),
    /* @__PURE__ */ jsx13(H3, { children: "A fixed-width sparse map trades state for collisions" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Hashing avoids fitting a vocabulary: a deterministic map assigns a token to a bucket and optionally a sign, then sums signed counts. Inspect every contribution for a deliberately constructed map, separate from the ordinary library's mapping." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D35" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Let apple\u2192(bucket0,+1), pear\u2192(bucket0,\u22121), banana\u2192(bucket1,+1). Counts apple3,pear1,banana2 give bucket0=3\u22121=2 and bucket1=2. This is sparse linear accumulation, not merely setting a binary membership flag. Opposite signs can cancel." }),
    /* @__PURE__ */ jsx13(Prose, { children: "Now pass two different bags through that same map." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D36" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Bag {apple:3,pear:1,banana:2} and bag {apple:2,banana:2} both give [2,2]. The original vocabulary/counts cannot be recovered from this representation alone. Increasing width changes collision pressure and model size; it does not remove the need to inspect what information the task can tolerate losing. Random signed maps have inner-product expectation results under their stated assumptions. A single small map does not prove that theorem, and signs do not eliminate every collision." }),
    /* @__PURE__ */ jsx13(PreparationInvestigation, { id: "L12" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Edit one token count or its constructed bucket/sign, keeping signed contributions and sparse bucket sums visible. Begin with the [2,2] collision; give apple and pear equal counts to see cancellation. Editing a zero-count token's map has no effect. A supplied-map unknown token is an explicit missing mapping error. The ordinary FeatureHasher panel uses separately observed mappings; it must not pretend this hand-designed apple/pear map is MurmurHash3." }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "",
      /* @__PURE__ */ jsx13("strong", { children: "signed_feature_hashing.py \u2014 actual new checked process." }),
      ""
    ] }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/signed_feature_hashing.py", filename: "signed_feature_hashing.py", language: "python", title: "signed_feature_hashing.py" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Whole recorded stdout (exact captured new stdout bytes):" }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/signed_feature_hashing.stdout.txt", filename: "signed_feature_hashing.stdout.txt", language: "output", title: "Recorded stdout \xB7 signed_feature_hashing.stdout.txt" }),
    /* @__PURE__ */ jsx13(Prose, { children: "The scratch accumulator stores only touched nonzero buckets and refuses nonfinite counts, invalid signs or out-of-range buckets. Its arbitrary-string adapter explicitly uses SHA-256 bytes; the ordinary FeatureHasher uses its own mapping, whose actual single-token sparse vectors are printed. There is no fitted target information or learned vocabulary in either hashing operation. Work is O(number of input nonzeros), with sorting of touched buckets for deterministic output ordering in this reference. Output width still determines the downstream parameter/storage requirement. No speed benchmark is inferred from sparse code." }),
    /* @__PURE__ */ jsx13(H2, { children: "9. Deeper branch: completing data versus representing uncertainty" }),
    /* @__PURE__ */ jsx13(H3, { children: "Fit conditional relationships one column at a time" }),
    /* @__PURE__ */ jsx13(Prose, { children: "The earlier length-to-mass example described one turn. Now build the complete cycle on a constructed incomplete two-column table. Keep the original mask beside its initialized copy." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D37" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Use rows [1,2], [2,4], [3,NA], [NA,8], [5,10]. The observed a values [1,2,3,5] have median 2.5; observed b values [2,4,8,10] have median 6. These fill row 2 as [3,6] and row 3 as [2.5,8], giving the initialized matrix [[1,2],[2,4],[3,6],[2.5,8],[5,10]]. Observed cells remain measurements; initialized cells retain their missing marker. Select column a as the first conditional target. Only rows 0,1,2,4 observed a; their b predictors include the current estimated 6 in row 2. A row may fit this conditional regression only if its target a was originally observed; its predictors may contain current estimates." }),
    /* @__PURE__ */ jsx13(Prose, { children: "Draw the actual design, target, coefficients and product for this turn before advancing to b." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D38" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "For a from b, the first predictor column is [2,4,6,10], targets [1,2,3,5]. Fit ",
      /* @__PURE__ */ jsx13("code", { children: "\u03A3(y\u2212intercept\u2212A\u03B2)\xB2+\u03B1||\u03B2||\xB2" }),
      " with \u03B1=1 and an unpenalized intercept. Center A and y, append \u221A\u03B1 times the identity below centered A and zeros below centered y, then solve least squares. This augmented system minimizes the same ridge objective without explicitly forming an inverse. Restore intercept=ymean\u2212Amean\xB7\u03B2. The coefficient is about .4861111111 and intercept .0763888889, so missing row-3 a at b=8 becomes 3.9652777778."
    ] }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "Now fit b using its observed-target rows 0,1,3,4. Their a predictor values are [1,2,3.9652777778,5], including the ",
      /* @__PURE__ */ jsx13("strong", { children: "newly updated" }),
      " a. The coefficient is about 1.8232290981 and intercept .5461393472, so missing row-2 b at a=3 becomes 6.0158266415. Feeding stale initialized a=2.5 into this second regression would fit a different model. Conditional cycling deliberately reuses current estimates, unlike P5's original-query distance rule."
    ] }),
    /* @__PURE__ */ jsx13(Prose, { children: "After a sweep, repeat the ordered column loop. Stop at a declared tolerance or cap. Our tolerance compares the maximum row sum of absolute changes with tol times the largest absolute observed input, matching the configured ordinary criterion. A cap is not convergence. The three-sweep fixture ends at a cap with last change about .00013875; the ordinary warning is printed rather than suppressed as success." }),
    /* @__PURE__ */ jsx13(Prose, { children: "Draw the ordered fitted models that a new row will actually use." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D39" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "Save each conditional model's target index, other-feature indices, coefficient and intercept ",
      /* @__PURE__ */ jsx13("strong", { children: "in order for every turn" }),
      ". A later row starts from the training medians, keeps its own original missing mask, then applies that saved sequence only to its missing cells. It does not fit regressions on the query. Observed values are preserved even if a conditional predictor would suggest another number. Repeated deterministic transformation gives the same result. A row with all inputs missing is numerically transformable under the saved model but supported only by its assumptions and initial training summaries; do not call it rich new evidence."
    ] }),
    /* @__PURE__ */ jsx13(PreparationInvestigation, { id: "L13" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Inspect the initialized state and the first turn immediately. Change one missing input cell and step through the recomputed bounded trace. Keep observed-target row sets, current predictors and updated cells visible. The sweep inspector changes the viewed algorithm state, not permission to reveal an answer. A new-row panel applies the saved sequence without a backwards fitting edge. Unsupported all-missing training columns refuse a conditional fit." }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "",
      /* @__PURE__ */ jsx13("strong", { children: "conditional_iterative_completion.py \u2014 actual new checked process." }),
      ""
    ] }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/conditional_iterative_completion.py", filename: "conditional_iterative_completion.py", language: "python", title: "conditional_iterative_completion.py" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Whole recorded stdout (exact captured new stdout bytes):" }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/conditional_iterative_completion.stdout.txt", filename: "conditional_iterative_completion.stdout.txt", language: "output", title: "Recorded stdout \xB7 conditional_iterative_completion.stdout.txt" }),
    /* @__PURE__ */ jsx13(Prose, { children: "This program uses NumPy's least-squares primitive for the linear solve, while owning mask, observed-target selection, ridge design, ordered updates, saved sequence and inference. The ordinary route explicitly enables experimental IterativeImputer, selects Ridge(alpha=1, solver='svd'), roman column order, median initialization, skip_complete=False and no posterior sampling. Supported fixture values and later rows match within stated tolerance. Full source/stream retains every turn's matrices and coefficients. General estimator heuristics or order choices can produce different sequences; there is no claim to clone every IterativeImputer configuration." }),
    /* @__PURE__ */ jsx13(Prose, { children: "For S sweeps, d targets and n rows, work is S times the sum of conditional regression costs; with dense least squares on d\u22121 predictors this can be substantial. State stores every fitted model used at inference. Shared numerical primitives avoid teaching an unneeded matrix inversion engine. Misspecified relationships, poor conditioning, unconverged cycles or collection shifts can give poor fills. Deterministic iteration gives a single completed table, not proper multiple imputation." }),
    /* @__PURE__ */ jsx13(H3, { children: "Several completions must become several analyses" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "Prediction preparation asks for usable inputs. Scientific inference asks how unknown values affect an estimate and its uncertainty. Treating a single completed table as observed can hide uncertainty from missing data. Multiple imputation creates several plausible completions under an explicit model, analyzes each, then pools ",
      /* @__PURE__ */ jsx13("strong", { children: "analysis estimates" }),
      ", not raw table cells."
    ] }),
    /* @__PURE__ */ jsx13(Prose, { children: "Look at actual completed matrices sharing observed cells and carrying different hatched missing entries. Follow each table into its own estimate Q\u2097 and estimated variance U\u2097." }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D40" }),
    /* @__PURE__ */ jsx13(Prose, { children: "The order matters even without probability theory. If one unseen value could be completed as 0 or 2 and analysis squares it, analyzing first gives 0 and 4, average 2. Averaging the input first gives 1, whose square is 1. Pooling tables erased a nonlinear effect and all disagreement. The completion matrices in this drawing are the first three actual simulated tables from the bounded normal model developed below, paired with their own computed Q/U. They introduce the analysis sequence; their validity depends on that model's assumptions. The separate supplied Q=[9,10,11], U=[4,4,4] example next is arithmetic practice and is not attributed to these matrices. Arbitrary plausible-looking tables are not thereby proper stochastic imputations." }),
    /* @__PURE__ */ jsx13(Prose, { children: "For m\u22652 scalar analyses, define Qbar=mean(Q\u2097), Ubar=mean(U\u2097), B=\u03A3(Q\u2097\u2212Qbar)\xB2/(m\u22121). The total variance rule is" }),
    /* @__PURE__ */ jsx13("div", { className: "neural-equation", children: /* @__PURE__ */ jsx13(MathBlock, { children: "T=\\bar U+(1+1/m)B=\\bar U+B+B/m,\n\\qquad SE=\\sqrt T." }) }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "U\u2097 is a ",
      /* @__PURE__ */ jsx13("strong", { children: "variance" }),
      ", in squared estimate units, not a standard error. B uses sample denominator m\u22121 because the finite set of completions estimates between-completion variability. The B/m term reflects finite-m simulation variation. Show these contributions on a squared-unit scale, keeping the standard-error length separate."
    ] }),
    /* @__PURE__ */ jsx13(PreparationFigure, { id: "D41" }),
    /* @__PURE__ */ jsx13(Prose, { children: "For Q=[9,10,11] and U=[4,4,4], Qbar=10, Ubar=4, B=(1+0+1)/2=1, simulation=1/3 and T=16/3. SE\u22482.309401, larger than \u221A4=2. Identical Q gives B=0 while within-analysis uncertainty can remain. More completions reduce the finite-m term but cannot fix an inappropriate model." }),
    /* @__PURE__ */ jsx13(PreparationInvestigation, { id: "L14a" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Edit one estimate or variance and see all components immediately. Changing a Q affects the mean and between component; changing a U affects within variance. Negative variance and m=1 are refusals. The given tables/analyses are instructional objects, not evidence that an arbitrary completion sampler satisfies inferential assumptions. A standard error alone does not specify a universally valid confidence interval: degrees of freedom and the complete-data/imputation model matter." }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "",
      /* @__PURE__ */ jsx13("strong", { children: "pool_scalar_analyses.py \u2014 actual new checked process." }),
      ""
    ] }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/pool_scalar_analyses.py", filename: "pool_scalar_analyses.py", language: "python", title: "pool_scalar_analyses.py" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Whole recorded stdout (exact captured new stdout bytes):" }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/pool_scalar_analyses.stdout.txt", filename: "pool_scalar_analyses.stdout.txt", language: "output", title: "Recorded stdout \xB7 pool_scalar_analyses.stdout.txt" }),
    /* @__PURE__ */ jsx13(Prose, { children: "The full O(m) scalar routine checks paired finite vectors and nonnegative U, computes every labeled term, and refuses invalid inputs. It does not silently use 1.96 for all intervals. Proper imputations and valid compatible complete-data analysis are conditions for using pooling inferentially, not consequences of applying this arithmetic. A predictive accuracy improvement supplies no evidence for those conditions." }),
    /* @__PURE__ */ jsx13(H3, { children: "A bounded stochastic model with declared assumptions" }),
    /* @__PURE__ */ jsx13(Prose, { children: "To see what \u201Cstochastic completion\u201D actually samples, use one scalar column [8,10,NA,12,NA]. This is constructed data under a marginal normal model with an ignorability/MCAR teaching assumption. There are no unimplemented MAR covariates. Let unknown mean \u03BC and variance \u03C3\xB2 have a proper normal\u2013inverse-gamma prior: \u03C3\xB2\u223Cinverse-gamma(\u03B1\u2080, scale \u03B2\u2080), and \u03BC|\u03C3\xB2\u223CNormal(\u03BC\u2080,\u03C3\xB2/\u03BA\u2080), with positive \u03BA\u2080,\u03B1\u2080,\u03B2\u2080." }),
    /* @__PURE__ */ jsx13(Prose, { children: "Conditioning on n observed values updates" }),
    /* @__PURE__ */ jsx13("div", { className: "neural-equation", children: /* @__PURE__ */ jsx13(MathBlock, { children: "\\kappa_n=\\kappa_0+n,\\quad\n\\mu_n=(\\kappa_0\\mu_0+n\\bar x)/\\kappa_n,\\quad\n\\alpha_n=\\alpha_0+n/2," }) }),
    /* @__PURE__ */ jsx13("div", { className: "neural-equation", children: /* @__PURE__ */ jsx13(MathBlock, { children: "\\beta_n=\\beta_0+\\tfrac12\\sum(x_i-\\bar x)^2\n +\\frac{\\kappa_0n(\\bar x-\\mu_0)^2}{2\\kappa_n}." }) }),
    /* @__PURE__ */ jsx13(Prose, { children: "These terms follow by completing the square in the normal likelihood times prior. Observed variation contributes the squared-deviation term; disagreement between the prior mean and observed mean adds the last term. Mean precision combines \u03BA\u2080 with n. Given \u03BC\u2080=0,\u03BA\u2080=1,\u03B1\u2080=2,\u03B2\u2080=2 and observed [8,10,12], n=3, xbar=10, squared deviations sum 8. Thus \u03BAn=4, \u03BCn=7.5, \u03B1n=3.5, \u03B2n=2+4+37.5=43.5. The visibly influential prior is intentional and should be examined, not hidden behind \u201Cproper.\u201D" }),
    /* @__PURE__ */ jsx13(Prose, { children: "For each completion, draw \u03C3\xB2 from the posterior inverse gamma, draw \u03BC conditionally using \u03C3\xB2/\u03BAn, then draw each missing value conditionally using \u03C3\xB2. Draws of \u03BC/\u03C3\xB2 represent parameter uncertainty; conditional missing draws represent remaining value uncertainty. Keep all observed cells exactly fixed. Analyze each completed mean Q and complete-data variance-of-mean U=s\xB2/N before pooling. The normal sample variance uses N\u22121; N is total completed row count, distinct from the n observed values used for the posterior." }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "",
      /* @__PURE__ */ jsx13("strong", { children: "normal_completion_and_sensitivity.py \u2014 actual new checked process." }),
      ""
    ] }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/normal_completion_and_sensitivity.py", filename: "normal_completion_and_sensitivity.py", language: "python", title: "normal_completion_and_sensitivity.py" }),
    /* @__PURE__ */ jsx13(Prose, { children: "Whole recorded stdout (exact captured new stdout bytes):" }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/normal_completion_and_sensitivity.stdout.txt", filename: "normal_completion_and_sensitivity.stdout.txt", language: "output", title: "Recorded stdout \xB7 normal_completion_and_sensitivity.stdout.txt" }),
    /* @__PURE__ */ jsx13(Prose, { children: "The program publishes posterior parameters, all five seed-20 completed tables, per-completion Q/U and pooled components. Different seed/m values show a changed realization without a large simulation campaign. The ordinary SciPy normal_inverse_gamma route receives (\u03BCn,\u03BAn,\u03B1n,\u03B2n); identical posterior parameters and conditional identities are the relevant bridge. Its actual draws happen to agree for this environment/seed, but cross-generator random sample equality is not the contract. A no-observation case needs explicit prior-only opt-in, and at least two total rows are needed for the stated complete-data variance calculation." }),
    /* @__PURE__ */ jsx13(Prose, { children: "A proper prior makes this model a defined posterior; it does not prove frequentist coverage of every pooled interval or justify the model for real penguin gaps. Unbounded normal draws can be unsuitable for physical nonnegative quantities. Choose a scientific model respecting the estimand and support, inspect diagnostics and assess sensitivity rather than patching negative draws into false observations." }),
    /* @__PURE__ */ jsx13(PreparationInvestigation, { id: "L14b" }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "Now assume the missing values differ by an additive \u03B4 from this baseline completion model. Change \u03B4 while all random baseline draws and observed cells stay fixed. With two of five values missing, each completed mean moves by (2/5)\u03B4. Seed-20 pooled means are about 7.886461,8.686461,9.486461 for \u03B4=\u22122,0,2. If no values are missing, \u03B4 has no effect. This sensitivity parameter is ",
      /* @__PURE__ */ jsx13("strong", { children: "assumed" }),
      ", not identified from observed data; the curve shows which conclusion depends on that assumption. It does not diagnose actual MNAR."
    ] }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "The ordinary R route below demonstrates a complete mice\u2192with\u2192pool workflow and scalar pooling call. It is a separately optional tool example, with source authored but R execution ",
      /* @__PURE__ */ jsx13("strong", { children: "not claimed" }),
      " in this Python environment. The tiny constructed regression is instructional, not a coverage experiment; actual analysis must inspect logged events, trace behavior, model compatibility, degrees of freedom and support. Including an outcome in a scientific imputation model differs from giving unavailable deployment targets to a predictive pipeline."
    ] }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "",
      /* @__PURE__ */ jsx13("strong", { children: "multiple_imputation_mice.R \u2014 not executed." }),
      ""
    ] }),
    /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/multiple_imputation_mice.R", filename: "multiple_imputation_mice.R", language: "r", title: "multiple_imputation_mice.R" }),
    /* @__PURE__ */ jsx13(Prose, { children: "R output is not supplied because execution is not claimed." }),
    /* @__PURE__ */ jsx13(Prose, { children: "The Python completion work is O(mN), plus each analysis, for m completions and N total rows. Saving all tables costs O(mN); streaming analyses can reduce storage if preserving complete tables is unnecessary for the teaching or audit. More sophisticated conditional/multilevel models, survey weights and a full causal identification theory belong to later specialist work. The local lesson remains: unknown values require explicit assumptions, analysis comes before pooling, and uncertainty/sensitivity are different from deterministic input preparation." }),
    /* @__PURE__ */ jsxs10("section", { className: "lesson-ending lesson-ending--practice", "data-lesson-ending": "practice", children: [
      /* @__PURE__ */ jsx13(H2, { children: "10. Practice: explain the representation before choosing the function" }),
      /* @__PURE__ */ jsx13(Prose, { children: "Attempt each question before opening its hint or solution. The activity IDs T1\u2013T26 identify tasks across the core and deeper branches. Use the fitted rules, source rows and saved state from the worked examples to reason through changed inputs. Each solution explains the tempting wrong route as well as the calculation." }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "T1. Follow a missing measurement without erasing another fact" }),
        /* @__PURE__ */ jsx13(Prose, { children: "Take an independent copy of source row 309, set mass to missing and sex to female. List features, target, numeric mask and the information allowed to fill the gap. Does absence in one cell make sex unknown?" }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Keep one mask bit per numeric input, separate from the target and categorical policy." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsx13(Prose, { children: "The features are [51,18.8,203,NA,female], the target remains Chinstrap in the held-out record, and numeric M=[0,0,0,1]. Sex is observed, giving the fitted female coordinate; it is neither missing nor an unseen string. The frozen training median 4000 fills mass before its saved center/scale apply. Held-out species and later input distribution may not refit those statistics. The filled coordinate is an estimate with mask 1. Treating the whole row as \u201Cmissing\u201D would discard observed information; treating species as an input would reveal the answer." })
        ] }),
        /* @__PURE__ */ jsx13("span", { id: "t2", className: "prep-preserved-anchor" })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "1. A changed ruler" }),
        /* @__PURE__ */ jsxs10(Prose, { children: [
          "Query ",
          /* @__PURE__ */ jsx13("code", { children: "[0,0]" }),
          " has candidates A ",
          /* @__PURE__ */ jsx13("code", { children: "[2,60]" }),
          " and B ",
          /* @__PURE__ */ jsx13("code", { children: "[5,10]" }),
          ". Which is nearest under raw squared distance? Which is nearest with divisors ",
          /* @__PURE__ */ jsx13("code", { children: "[1,30]" }),
          "?"
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Calculate one contribution per feature; the divisor belongs inside the square." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsxs10(Prose, { children: [
            "Raw distances squared are 3,604 and 125, so B wins. Scaled distances squared are ",
            /* @__PURE__ */ jsx13(Math2, { children: "4+4=8" }),
            " and ",
            /* @__PURE__ */ jsx13(Math2, { children: "25+1/9=25.111\\ldots" }),
            ", so A wins. The input observations are unchanged; relative feature weighting changed."
          ] })
        ] }),
        /* @__PURE__ */ jsx13("span", { id: "t3", className: "prep-preserved-anchor" })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "2. Fit once, transform later" }),
        /* @__PURE__ */ jsxs10(Prose, { children: [
          "A training column is ",
          /* @__PURE__ */ jsx13("code", { children: "[2,4,6]" }),
          ". Find its mean, population-style standard deviation, standardized value for a new 8, and min\u2013max value for that 8. Should adding 8 to the later batch change the saved training statistics?"
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "The training squared deviations are 4, 0, and 4." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsxs10(Prose, { children: [
            "The mean is 4 and standard deviation ",
            /* @__PURE__ */ jsx13(Math2, { children: "\\sqrt{8/3}" }),
            ". The standardized new value is ",
            /* @__PURE__ */ jsx13(Math2, { children: "4/\\sqrt{8/3}=\\sqrt6\\approx2.4495" }),
            ". Min\u2013max gives ",
            /* @__PURE__ */ jsx13(Math2, { children: "(8-2)/(6-2)=1.5" }),
            ". Transformation reuses the fitted statistics; refitting on later inputs would create a different map."
          ] })
        ] }),
        /* @__PURE__ */ jsx13("span", { id: "t4", className: "prep-preserved-anchor" })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "3. What did normalization discard?" }),
        /* @__PURE__ */ jsxs10(Prose, { children: [
          "A spectrum ",
          /* @__PURE__ */ jsx13("code", { children: "[2,1,2]" }),
          " and another ",
          /* @__PURE__ */ jsx13("code", { children: "[6,3,6]" }),
          " are L2-normalized. What are the results? Would this be appropriate if total emitted energy is the prediction signal?"
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsxs10(Prose, { children: [
            "The lengths are 3 and 9, so both map to ",
            /* @__PURE__ */ jsx13("code", { children: "[2/3,1/3,2/3]" }),
            ". Relative shape remains, but the threefold intensity difference disappears. If total energy matters, preserve a magnitude feature or choose another representation rather than discarding it blindly."
          ] })
        ] }),
        /* @__PURE__ */ jsx13("span", { id: "t5", className: "prep-preserved-anchor" })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "4. A category that did not exist during fitting" }),
        /* @__PURE__ */ jsxs10(Prose, { children: [
          "A full one-hot vocabulary has ",
          /* @__PURE__ */ jsx13("code", { children: "small" }),
          ", ",
          /* @__PURE__ */ jsx13("code", { children: "medium" }),
          ", and ",
          /* @__PURE__ */ jsx13("code", { children: "large" }),
          ", and an unknown value uses an all-zero block. Compare unknown-to-small distance with small-to-medium distance. What application decision is hidden behind accepting the unknown value?"
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsxs10(Prose, { children: [
            "The distances are 1 and ",
            /* @__PURE__ */ jsx13(Math2, { children: "\\sqrt2" }),
            ". Ignoring unknown categories creates a representation with a specific geometry; it is not neutral. The application must decide whether a new value is valid, should trigger a review or fallback, or belongs in a deliberately learned other-category group."
          ] })
        ] }),
        /* @__PURE__ */ jsx13("span", { id: "t6", className: "prep-preserved-anchor" })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "5. Changed donors" }),
        /* @__PURE__ */ jsxs10(Prose, { children: [
          "In the imputation table, change D2's ",
          /* @__PURE__ */ jsx13("code", { children: "c" }),
          " to missing. With two neighbors, what value replaces the query's missing ",
          /* @__PURE__ */ jsx13("code", { children: "c" }),
          "? What if D1's ",
          /* @__PURE__ */ jsx13("code", { children: "c" }),
          " changes from 100 to 140 while the other original cells remain unchanged?"
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "First decide who can donate the target feature, then use the distances on the query's observed coordinates." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsxs10(Prose, { children: [
            "With D2 ineligible, D1 and D3 supply ",
            /* @__PURE__ */ jsx13(Math2, { children: "(100+500)/2=300" }),
            ". In the separate second change, the original selected donors D2 and D1 remain nearest, so the estimate becomes ",
            /* @__PURE__ */ jsx13(Math2, { children: "(300+140)/2=220" }),
            ". Changing a value in the query's missing target column does not itself enter these overlap distances."
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "T7. Keep every original coordinate before adding recording history" }),
        /* @__PURE__ */ jsxs10(Prose, { children: [
          "Extend the retained P1 mechanism with one indicator for every numeric input column. Transform [15,500,NaN] with category b, checking the first six coordinates, three indicators and unchanged fitted state. Then implement a ",
          /* @__PURE__ */ jsx13("strong", { children: "distinct" }),
          " robust-ruler successor keeping the same fill/vocabulary. The full callable implementations are in masked_simple_imputation.py, with the complete changed-input answer function in practice_solutions.py."
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Save np.isnan(input) before filling. Fit the robust ruler on the already-filled training matrix, not on the query." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsx13(Prose, { children: "The filled row is [15,500,7]. Standard numeric coordinates are [(15\u221220)/\u221A50,(500\u2212300)/\u221A20000,0]=[\u22121/\u221A2,\u221A2,0]. The retained category order a,b,not_recorded gives [0,1,0]; original missing indicators [0,0,1] are appended. The result has width 9 and approximately [\u2212.707107,1.414214,0,0,1,0,0,0,1]. The filled training first column [10,20,30,20] has median 20 and linear IQR 5; second [100,300,300,500] median 300 and IQR 100; constant third uses divisor 1. Robust query coordinates are [\u22121,2,0], giving [\u22121,2,0,0,1,0,0,0,1]. Snapshot fills, centers, scales and vocabulary before transform; exact comparison afterward verifies no mutation. Recovering the mask from completed values is wrong because an observed 7 and filled 7 coincide. Fitting only missing-at-training indicators misses the new third-column absence; all-feature indicators retain its bit." })
        ] }),
        /* @__PURE__ */ jsx13("span", { id: "t8", className: "prep-preserved-anchor" })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "6. Explain a transformed real record" }),
        /* @__PURE__ */ jsx13(Prose, { children: "For the fitted standard penguin pipeline, keep the first held-out record unchanged except set its body mass to missing. Predict that output coordinate. Does this mean the animal's true mass was 4,000 g?" }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "First apply the saved median, then the saved mean and scale." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsxs10(Prose, { children: [
            "The coordinate becomes ",
            /* @__PURE__ */ jsx13(Math2, { children: "(4000-4190.9883721)/806.6875829\\approx-0.2368" }),
            ". This is a numerical estimate passed to the model. It is not a recovered observation. Other coordinate values and the fitted statistics remain unchanged."
          ] })
        ] }),
        /* @__PURE__ */ jsx13("span", { id: "t9", className: "prep-preserved-anchor" })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "8. Identity is a useful transform check \u2014 deeper" }),
        /* @__PURE__ */ jsxs10(Prose, { children: [
          "Use the Yeo\u2013Johnson formula at ",
          /* @__PURE__ */ jsx13(Math2, { children: "\\lambda=1" }),
          " on 3 and \u22123. Why is a generic claim that \u201Cnegative inputs use a square root\u201D wrong?"
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsxs10(Prose, { children: [
            "For 3, ",
            /* @__PURE__ */ jsx13(Math2, { children: "((3+1)^1-1)/1=3" }),
            ". For \u22123, ",
            /* @__PURE__ */ jsx13(Math2, { children: "-((1+3)^1-1)/1=-3" }),
            ". Both branches depend on ",
            /* @__PURE__ */ jsx13(Math2, { children: "\\lambda" }),
            "; the negative exponent is ",
            /* @__PURE__ */ jsx13(Math2, { children: "2-\\lambda" }),
            ", with a logarithmic limit at ",
            /* @__PURE__ */ jsx13(Math2, { children: "\\lambda=2" }),
            ", not a fixed square root."
          ] })
        ] }),
        /* @__PURE__ */ jsx13(Prose, { children: "For an additional changed branch in T9, evaluate x=\u22123 at \u03BB=2 and \u03BB=0." }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "The negative exponent is 2\u2212\u03BB; identify its zero-power limit before calculating." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsx13(Prose, { children: "At \u03BB=2 the branch is \u2212log(1\u2212x)=\u2212ln4. At \u03BB=0 its exponent is 2, so \u2212(4\xB2\u22121)/2=\u22127.5. The \u03BB=1 identity preserved above and these two changed cases show why a generic square-root explanation fails." })
        ] }),
        /* @__PURE__ */ jsx13("span", { id: "t10", className: "prep-preserved-anchor" })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "7. Which part of target encoding changed? \u2014 deeper" }),
        /* @__PURE__ */ jsx13(Prose, { children: "In the six-row example, change row 3's target from 0 to 1. Calculate row 0's new encoding. Does row 3's own cross-fitted encoding change?" }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsxs10(Prose, { children: [
            "Row 0's donors are rows 1, 3, and 5, now with prior ",
            /* @__PURE__ */ jsx13(Math2, { children: "2/3" }),
            ". Its A donor is still positive, so its value becomes ",
            /* @__PURE__ */ jsx13(Math2, { children: "7/9" }),
            ". Row 3 belongs to held-out fold 1, whose donor targets are unchanged, so its own value remains ",
            /* @__PURE__ */ jsx13(Math2, { children: "4/9" }),
            ". The first change passes through the prior; the null demonstrates excluding one's own target."
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "T11. Distinguish a byte identity from an experiment" }),
        /* @__PURE__ */ jsx13(Prose, { children: "The current CSV is a 15586-byte CRLF file, while the historical receipt binds a 15241-byte LF input. What checks justify saying they contain the same observations? May we call the old experiment a fresh run against the current download?" }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Check an exact normalization relation and parsed row order; an equal data table is not a new process execution." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Replacing CRLF by LF yields the historical exact SHA-256 and size; parsing both gives all 344 identical rows, columns and NA cells in order. The newline count explains the 345-byte size difference. This establishes a source relation. It does not execute the program, refit models or refresh versions. Bind both raw identities, label the current download separately from the historical executed input, and reuse the retained output with its original date/environment. The setup metadata supplies full hashes rather than relying on abbreviated names." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "T12. Equal predictions, different penalties and storage" }),
        /* @__PURE__ */ jsxs10(Prose, { children: [
          "Compare x=[1,100], w=[1,.01] with x\u2032=[1,1], w\u2032=[1,1]. Compute predictions and squared coefficient norms. Center ",
          /* @__PURE__ */ jsx13("code", { children: "[[0,0,3],[1,0,0],[0,2,0]]" }),
          " and count nonzeros."
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Multiply coefficients by the same divisor used on each coordinate; sparse zero support is about actual entries." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Both dot products are 2. The coefficient norms squared are 1+.0001=1.0001 and 1+1=2. A fixed ridge penalty therefore changes even with equal predictions. Matrix column means are [1/3,2/3,1]; centered rows [\u22121/3,\u22122/3,2], [2/3,\u22122/3,\u22121], [\u22121/3,4/3,\u22121] all contain three nonzeros, so support grows 3\u21929. Scale-only sparse transformation can preserve original zeros; representing nonzero centered values as zeros would alter the data, not optimize storage." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "T13. Let training counts own the rare policy" }),
        /* @__PURE__ */ jsxs10(Prose, { children: [
          "Fit a\xD74,b\xD71,missing\xD71 with rare threshold 2, keeping missing separate. Transform b,new,missing,a under infrequent-if-present. What happens with only a\xD74 during fit? Try a real label ",
          /* @__PURE__ */ jsx13("code", { children: "@missing" }),
          "."
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Inspect the vocabulary, not just the vector width." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Counts are a\xD74,b\xD71,@missing\xD71. Fitted rare set={b}; columns sorted as @missing,@rare,a. Rows are b=[0,1,0],new=[0,1,0],missing=[1,0,0],a=[0,0,1]. With only a\xD74 no rare bucket exists; new becomes [0] under the declared fallback. The literal @missing as a measured category is refused by the reserved-prefix rule, preventing a collision with absence. sklearn's native min_frequency may group the missing marker because it is infrequent; use explicitly pregrouped categories for our same-policy comparison. Query labels never change the fitted counts or width." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "T14. Expose forbidden query feedback" }),
        /* @__PURE__ */ jsx13(Prose, { children: "For k=1, donors are [0,0,NA], [2,100,100], [3,0,200], query [1,NA,NA]. Fill both missing targets using original-query distances. Then deliberately feed the first fill back into the distance for the second target. Explain the difference and the tie convention." }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "For the first target all donors have b, while for c the first donor is ineligible. Original overlap uses only a." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Original squared distances are3,3,12. Custom source-order tie picks donor 0 for b, giving 0. For c, donor 0 lacks c and is excluded; donor 1 is nearest, giving 100. Correct output is [1,0,100]. If completed b=0 is illegally treated as observed before choosing c, donor 1 adjusted squared distance is (3/2)(1+10000)=15001.5, donor 2 is (3/2)(4+0)=6; it gives 200. The wrong algorithm outputs [1,0,200]. P5 and the answer file compute both and assert the contrast. This does not say conditional iteration is wrong: section 9 deliberately specifies current-estimate predictors under another model. It says two algorithms cannot be silently mixed. With an all-target-missing training column our default rejects; no tie convention can invent evidence." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "T15. Feature-only leakage is still a fitting dependency" }),
        /* @__PURE__ */ jsx13(Prose, { children: "A held-out row changes the fitted quantile landmarks or determines whether a category passes the rare threshold. No targets were used. Is this safe assessment? Contrast an externally specified schema." }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Ask whether the map uses information available before the assessment row arrives." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsx13(Prose, { children: "The assessment feature distribution influenced a fitted rule. That can make the representation adapted to the examples judging it. Split first and refit landmarks/count thresholds inside each permitted training set. A category schema declared independently beforehand is different from vocabulary estimated from all assessment-inclusive rows. Pipeline helps only when it receives training-only input at fit. It cannot repair subject/time leakage, post-outcome features or manual pre-fitting outside it." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "T16. Report the real result without a winner claim" }),
        /* @__PURE__ */ jsx13(Prose, { children: "Write a deployment-facing paragraph interpreting 38,67,84,85,85 correct out of 86 under the retained controls. Name one next decision and one limitation; do not run a new campaign." }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Identify the shared split, k and category policy before differences." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsx13(Prose, { children: "An acceptable report says: \u201COn the preserved seed 20 stratified split of 344 Palmer Penguins rows, five-neighbor models shared 258 training/86 assessment indices and category fill/one-hot policy. Raw numeric inputs got 67 correct, standard 84, min\u2013max 85 and robust 85, against training-majority 38. Scaling changed this model's useful geometry on this collection; one extra correct case does not establish a generally best scaler. We would compare proposed preprocessing inside training-only development splits and reserve separate assessment, matching future population/group/time availability. Deployment also needs schema, unknown-category and new-missingness monitoring.\u201D Omitting the baseline, changing the objective after seeing scores or calling 85 versus 84 proof of superiority fails the report's purpose." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "T17. Invert a stable power map, then refuse an invalid input" }),
        /* @__PURE__ */ jsx13(Prose, { children: "Evaluate Box\u2013Cox(4,\u03BB=10\u207B\u2079), invert log4 at \u03BB=0, and try Box\u2013Cox(0,\u03BB=0). What may a selected bound in a fitted \u03BB search mean?" }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Use expm1(\u03BBlog4)/\u03BB and the exact logarithmic branch." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsx13(Prose, { children: "The first value approaches ln4\u22481.3862943611, with tiny finite-\u03BB correction, rather than zero from cancellation. Inverting y=ln4 at \u03BB=0 gives exp(y)=4. Zero violates Box\u2013Cox's strictly positive domain, so the program raises ValueError; patching it to epsilon changes the map and dataset. A best tested boundary can indicate the search range restricted the fit; it is reported with bounds/status, not described as a global optimum. The full answer function calls the stable implementation and its inverse; same-\u03BB ordinary comparison tests formulas separately from optimizer choices." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "T18. Query landmarks and bin edges without refitting" }),
        /* @__PURE__ */ jsx13(Prose, { children: "For fitted [1,2,2,4,100] landmarks/probabilities, transform later 3 and 1000 uniformly. Fit four requested linear-quantile bins and assign x=2. Can an inverse recover 1000?" }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Distinguish averaging tie endpoints from interpolating after the last duplicate; exact bin edges use right insertion." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsx13(Prose, { children: "The tie 2 maps(.25+.5)/2=.375. Later 3 is halfway from last 2 at.5 to 4 at.75, giving.625. Later 1000 saturates at 1. The inverse of 1 returns fitted endpoint 100, losing the original 1000. Quantile edges [1,2,2,4,100] merge to [1,2,4,100], three effective bins;2 enters bin index 1, beginning at 2. A later batch containing 1000 cannot refit those edges or references. Ties can prevent equal bin populations; preserving the requested count in a label would misdescribe the actual representation." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "T19. Inspect a product, a local basis and a cyclic ambiguity" }),
        /* @__PURE__ */ jsx13(Prose, { children: "Construct degree-two features for (2,3), calculate degree-one B-splines at.5 for full knots[\u22121,0,1,2,3], and compare angle30\xB0/150\xB0 using one versus two trigonometric coordinates." }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "List exponent pairs; at.5 only two neighboring triangles are active." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Exponent pairs (0,0),(1,0),(0,1),(2,0),(1,1),(0,2) give [1,2,3,4,6,9]. At.5, recurrence weights produce B0=.5,B1=.5,B2=0, row sum 1. Coefficients [2,4,1] give 3. Both angles have sine.5, but cosine is\xB1\u221A3/2, so [cos,sin] distinguishes them. Neither product width nor a period should be chosen from held-out outcomes. A supplied bias plus model intercept needs a parameterization decision; a duration without periodic meaning should not wrap." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "T20. Separate unsmoothed full-fit and OOF codes" }),
        /* @__PURE__ */ jsx13(Prose, { children: "Use the six-row A/A/B/B/C/C table, \u03B1=0 and the same alternating folds. Compute full-fit/OOF arrays, then encode an absent category from a nonempty donor set. Why did the retained short example need a successor?" }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Each held fold has exactly one donor from each category in this particular fixture; the general no-match case is separate." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Full-fit codes are[1,1,0,0,.5,.5]. OOF codes are[1,1,0,0,0,1]: each C row sees the other C target. An absent category uses the donor prior even with \u03B1=0; for fitting only a\u21921 it returns 1, avoiding0/0. The retained \u03B1=2 short calculation is valid for its demonstrated fixture but lacks empty/no-match validation. P9 validates those boundaries and keeps the original source/output unchanged. Smoothing and exclusion are separate: \u03B1=0 does not itself decide which targets are permitted." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "T21. Keep groups and time constraints explicit" }),
        /* @__PURE__ */ jsx13(Prose, { children: "There are two rows per person and monthly arrivals. An expanding two-window split validates rows 2\u20133 from donors 0\u20131, then 4\u20135 from donors 0\u20133. Which rows have training features, and can that splitter directly satisfy TargetEncoder 1.9's full OOF cv contract?" }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Write the coverage vector before choosing an API. Then inspect person overlap separately." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Coverage is [0,0,1,1,1,1]; only rows [2,3,4,5] have chronological OOF features, and targets must be selected by exactly those indices. Warm-up rows 0\u20131 are not filled using future targets. TargetEncoder's internal cv requires each validation index once, so this expanding splitter violates its full-row coverage contract. Fit/transform manually per window and return the aligned subset, as P9 does. Also require max donor time<min held time; if the two rows per person straddle a boundary, exclude that person's donor row too or choose a group/time design matching the question. Random group folds alone need not be chronological. Repeated validation or shared group IDs are refused by the supported checks." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "T22. Break one constructed collision without claiming a theorem" }),
        /* @__PURE__ */ jsx13(Prose, { children: "The apple+/pear\u2212 bucket0 and banana+ bucket1 map sends bags(3,1,2) and (2,0,2) to [2,2]. Change the second bag's apple count to 3. What changes? Does this show signed hashing is unbiased?" }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Recompute bucket sums; expectation is over a specified random-map family." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsx13(Prose, { children: "The first remains[3\u22121,2]=[2,2]; the second becomes[3\u22120,2]=[3,2], separating them. Changing bucket assignment could also separate particular bags but can create another collision elsewhere. This one deterministic map does not establish an expectation theorem or remove irreversibility. The program's actual FeatureHasher token map differs from our constructed map and is printed separately. A sign changes a contribution, not its declared bucket." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "T23. Complete one conditional sweep and save its route" }),
        /* @__PURE__ */ jsx13(Prose, { children: "Use the two-column table from section 9, \u03B1=1, a-then-b order and one-sweep cap. Work the fitting row sets, coefficients and missing updates. Transform later [3,NA] with the saved sequence. Does the cap certify convergence?" }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Initialize medians [2.5,6]; after fitting a use its updated value in the b design." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsx13(Prose, { children: "For a, observed rows 0,1,2,4 give b=[2,4,6,10],y=[1,2,3,5], \u03B2\u2248.4861111111, intercept\u2248.0763888889. Missing row 3 a becomes 3.9652777778. For b, observed rows 0,1,3,4 now use a=[1,2,3.9652777778,5],y=[2,4,8,10]; \u03B2\u22481.8232290981, intercept\u2248.5461393472. Row 2 b becomes 6.0158266415. Save both ordered models. Later [3,NA] preserves observed 3 and applies the b model to give 6.0158266415; it does not refit. One sweep ends at a cap, not a convergence guarantee. All observed cells must compare exactly unchanged. The answer program prints this complete table and query, with the full mechanism source already visible." })
        ] }),
        /* @__PURE__ */ jsx13("span", { id: "t24", className: "prep-preserved-anchor" })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "9. Pool estimates, not completed tables \u2014 deeper" }),
        /* @__PURE__ */ jsxs10(Prose, { children: [
          "Four completed-data analyses yield estimates ",
          /* @__PURE__ */ jsx13("code", { children: "[8,10,10,12]" }),
          ", each with variance 1. Find the pooled estimate and total variance using the stated rule."
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsxs10(Prose, { children: [
            "The average is 10. Squared deviations sum to 8, so ",
            /* @__PURE__ */ jsx13(Math2, { children: "B=8/3" }),
            ". Then ",
            /* @__PURE__ */ jsx13(Math2, { children: "T=1+(1+1/4)(8/3)=13/3\\approx4.3333" }),
            ". Its standard error is ",
            /* @__PURE__ */ jsx13(Math2, { children: "\\sqrt{13/3}\\approx2.0817" }),
            ". Between-completion disagreement contributes substantial uncertainty; validity still depends on how the completions and analyses were constructed."
          ] })
        ] }),
        /* @__PURE__ */ jsx13(Prose, { children: "For T24, also compare \u201Canalyze 0/2 by squaring then average\u201D with \u201Caverage0/2 then square.\u201D" }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Nonlinear analysis and averaging need not commute." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsx13(Prose, { children: "The analysis-first mean is (0\xB2+2\xB2)/2=2, while the square of mean input is 1\xB2=1. This is why the completed-data analyses, and their variance estimates, enter pooling. B=8/3 and T=13/3 from the retained task are variances in squared-estimate units; standard error is \u221A(13/3). Validity still depends on the imputation/analysis models." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "T25. Separate stochastic variation from an assumed sensitivity shift" }),
        /* @__PURE__ */ jsx13(Prose, { children: "Use P16's [8,10,NA,12,NA], seed 20,m=5. Compare seed 21,m=3, then \u03B4=\u22122,0,2 with baseline draws fixed. State exactly which cells may change and what conclusion the sensitivity curve supports." }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Two of five values are missing; posterior parameter draws and \u03B4 have different roles." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Observed 8,10,12 stay exact in every table. Changing seed/m changes simulated \u03BC,\u03C3\xB2 and missing draws, hence realized Q/U; it is not new sampling evidence about model accuracy. With the same seed/m, \u03B4 changes only the two missing entries, moving every completed mean by 2\u03B4/5. The seed 20 pooled mean is about 8.686461; \u03B4=\u22122 gives 7.886461, \u03B4=2 gives 9.486461. \u03B4=0 recovers baseline exactly, and no missing cells makes every \u03B4 a null. This is an explicit assumed departure from the marginal normal/MCAR teaching model, not an identified MNAR estimate. A proper prior or more completions does not prove universal pooled interval coverage. The full answer code prints the actual realizations and the setup records their environment." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "lesson-exercise", "data-lesson-exercise": "", children: [
        /* @__PURE__ */ jsx13(H3, { children: "T26. Build a representation for a new sensor task" }),
        /* @__PURE__ */ jsx13(Prose, { children: "The input has amount in declared physical units, direction in degrees, ordered grade low/medium/high, nominal device IDs and deployment gaps. All are available before the target. Use training amounts [10,20,NA,40], angles [350,10,30,150], grades [low,high,medium,low], IDs [a,a,b,missing]. Transform later amounts [30,NA], angles [359,1], grades [medium,new], IDs [c,missing]. Implement and compare one justified pipeline without turning this into a tuning campaign." }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Hint" }),
          /* @__PURE__ */ jsx13(Prose, { children: "Choose a fit-owned amount fill/ruler, period-owned circle, supplied grade order and fitted rare policy. Keep the target outside the preparation function." })
        ] }),
        /* @__PURE__ */ jsxs10("details", { children: [
          /* @__PURE__ */ jsx13("summary", { children: "Solution" }),
          /* @__PURE__ */ jsx13(Prose, { children: "An acceptable complete implementation is sensor_solution() in the answer file. Median amount 20 fills training to [10,20,20,40]; its saved mean/scale standardize later 30 and filled 20. A stateless period 360 circle supplies cosine/sine, preserving the 359/1 seam. Domain-supplied grade order maps medium 1 and unknown \u22121; monitor that unknown policy rather than pretending it is a valid lower grade. Device threshold 2 yields @missing,@rare,a columns; c maps to the existing rare bucket, missing stays separate. Append one original amount-missing indicator. The output is 2\xD78 with ordered names amount,cos_direction,sin_direction,grade,@missing,@rare,a,amount_missing. The ordinary ColumnTransformer uses the same explicitly pregrouped device policy, numeric Pipeline, FunctionTransformer and OrdinalEncoder, then appends the mask; a numerical assertion compares rows. Amount magnitude is preserved by an invertible affine map rather than row-normalized away. Direction wraps because its domain is cyclic; elapsed duration would need a separate coordinate. A rubric checks feature availability, units/period, fit/transform state, target separation, schema, unknown/missing distinctions, output comparison and deployment monitoring. Another pipeline can be acceptable if its different information choices are justified and tested." })
        ] }),
        /* @__PURE__ */ jsxs10(Prose, { children: [
          "The entire answer asset below contains the indicator successor check, changed donor counterexample, nonlinear/basis/encoding/pooling examples and complete sensor implementation. It imports the new supported teaching modules in this same downloaded directory; it never imports the three old top-level mains. It is listed separately as a ",
          /* @__PURE__ */ jsx13("strong", { children: "solution" }),
          " file so an exercise download does not reveal answers inadvertently."
        ] }),
        /* @__PURE__ */ jsxs10(Prose, { children: [
          "",
          /* @__PURE__ */ jsx13("strong", { children: "practice_solutions.py \u2014 actual new checked process." }),
          ""
        ] }),
        /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/practice_solutions.py", filename: "practice_solutions.py", language: "python", title: "practice_solutions.py" }),
        /* @__PURE__ */ jsx13(Prose, { children: "Whole recorded stdout (exact captured new stdout bytes):" }),
        /* @__PURE__ */ jsx13(RemoteCodeBlock, { source: "/learn-assets/feature-preparation-private/practice_solutions.stdout.txt", filename: "practice_solutions.stdout.txt", language: "output", title: "Recorded stdout \xB7 practice_solutions.stdout.txt" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs10("section", { className: "lesson-ending lesson-ending--next", "data-lesson-ending": "next", children: [
      /* @__PURE__ */ jsx13(H2, { children: "11. Readiness and the next connection" }),
      /* @__PURE__ */ jsx13(Prose, { children: "You are ready for the next core topic when you can take a new row, identify which inputs are observed/missing/unknown, apply a fitted fill/ruler/vocabulary without changing its state, and explain how the chosen representation changes the model's comparisons. Trace row 309 or a genuinely changed practice row through all output names. A count of completed sections or a model score is not a mastery test." }),
      /* @__PURE__ */ jsx13(Prose, { children: "The deeper route adds different checks: derive a power branch and inverse; interpolate a later value using saved landmarks; build a bin/product/local basis/cyclic pair; exclude a held row's targets from both numerator and prior; distinguish full-fit inference from OOF training; preserve original observations during conditional cycling; and analyze before pooling under explicit assumptions. If one of those remains unclear, return to its actual small table or trace rather than learning another API name." }),
      /* @__PURE__ */ jsxs10(Prose, { children: [
        "Next, ",
        /* @__PURE__ */ jsx13("a", { href: "/learn/path/full-curriculum/cross-validation-hyperparameter-tuning?module=classical-ml", children: "Cross-Validation & Hyperparameter Tuning" }),
        " asks which observations may select a preparation/model and which may assess the selected procedure. Here we held one experiment fixed to inspect representations. There, each fold fits fresh preparation inside its training boundary, and selection/refit/outer assessment have separate roles. Later regularization develops the units/penalty connection, while feature selection asks which inputs should remain. Neither is a hidden prerequisite for the local mechanisms just taught."
      ] })
    ] }),
    /* @__PURE__ */ jsxs10("section", { className: "lesson-ending lesson-ending--further-learning", "data-lesson-ending": "further-learning", children: [
      /* @__PURE__ */ jsx13(H3, { children: "Further learning" }),
      /* @__PURE__ */ jsx13(Prose, { children: "These offer another explanation or a broader worked context; the lesson's core remains self-contained. The selected research readings were consumed during the accepted design stage and reused for the same claim scope here. No video was watched and no remote figure pixels were personally reviewed; a book/API link is not a claim of having read every page. The research record distinguishes substantive sections, metadata-only attribution and failed access." }),
      /* @__PURE__ */ jsxs10("ul", { children: [
        /* @__PURE__ */ jsxs10("li", { children: [
          "",
          /* @__PURE__ */ jsx13("a", { href: "https://inria.github.io/scikit-learn-mooc/python_scripts/02_numerical_pipeline_scaling.html", children: "Inria's scikit-learn course: numerical preprocessing" }),
          " is a practical notebook-style second account of training summaries, saved state and Pipeline. Use it after section 5 and follow which table is passed to fit. Selected substantive text/code was read; unseen exercises and image pixels were not certified."
        ] }),
        /* @__PURE__ */ jsxs10("li", { children: [
          "Kuhn and Johnson's ",
          /* @__PURE__ */ jsx13("a", { href: "https://feat.engineering/05-Encoding_Categorical_Predictors.html", children: "categorical predictors" }),
          ", ",
          /* @__PURE__ */ jsx13("a", { href: "https://feat.engineering/06-Engineering_Numeric_Predictors.html", children: "numeric predictors" }),
          " and ",
          /* @__PURE__ */ jsx13("a", { href: "https://feat.engineering/08-Handling_Missing_Data.html", children: "missing data" }),
          " chapters add predictive feature-engineering context. The selected chapter5 encoding sections, chapter6 individual/basis sections and chapter8 introduction through the KNN discussion were read. Compare its normalized Box\u2013Cox and natural-cubic conventions with ours; do not import its informal missing-percentage advice as a rule. This is a broader book route after the corresponding local section, not required first-pass homework."
        ] }),
        /* @__PURE__ */ jsxs10("li", { children: [
          "Van Buuren's ",
          /* @__PURE__ */ jsx13("a", { href: "https://stefvanbuuren.name/fimd/sec-nutshell.html", children: "multiple imputation in a nutshell" }),
          " and ",
          /* @__PURE__ */ jsx13("a", { href: "https://stefvanbuuren.name/fimd/sec-whyandwhen.html", children: "why and when MI works" }),
          " deepen section 9's impute\u2192analyze\u2192pool sequence and the conditions behind its variance terms. Selected substantive procedures/conditions were read, not every later chapter. Use this specialist route before treating arbitrary completions as scientifically valid analyses."
        ] }),
        /* @__PURE__ */ jsxs10("li", { children: [
          "The official ",
          /* @__PURE__ */ jsx13("a", { href: "https://scikit-learn.org/stable/auto_examples/preprocessing/plot_target_encoder_cross_val.html", children: "TargetEncoder cross-fitting example" }),
          " offers a code-and-results alternative for near-unique-category overfitting. Its selected source/example context is inherited from the baseline research; its experiment is not our new benchmark. Follow where fit_transform differs from transform and how the model receives its training features."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs10("section", { className: "lesson-ending lesson-ending--references", "data-lesson-ending": "references", children: [
      /* @__PURE__ */ jsx13(H3, { children: "Technical references and attribution" }),
      /* @__PURE__ */ jsx13(Prose, { children: "Use a reference to verify a specific contract you can already explain. APIs below are version-sensitive; the checked Python environment is scikit-learn 1.9.1/SciPy 1.18.1, while the accepted research read the official 1.9.1/SciPy 1.18.0 documentation. Content-time local source checks inspected quantile tie/endpoint logic, spline extensions and iterative stopping, and the four official TargetEncoder/QuantileTransformer/SplineTransformer/normal-inverse-gamma pages were freshly read for their relevant parameters." }),
      /* @__PURE__ */ jsxs10("ul", { children: [
        /* @__PURE__ */ jsxs10("li", { children: [
          "",
          /* @__PURE__ */ jsx13("a", { href: "https://scikit-learn.org/stable/modules/preprocessing.html", children: "Preprocessing guide" }),
          ": primary formulas and ordinary numeric/category/basis alternatives. ",
          /* @__PURE__ */ jsx13("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.StandardScaler.html", children: "StandardScaler" }),
          ", ",
          /* @__PURE__ */ jsx13("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.OneHotEncoder.html", children: "OneHotEncoder" }),
          " and ",
          /* @__PURE__ */ jsx13("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.OrdinalEncoder.html", children: "OrdinalEncoder" }),
          " own their fitted-state and policy interfaces. Our scratch all-missing/near-constant/marker choices are explicitly bounded."
        ] }),
        /* @__PURE__ */ jsxs10("li", { children: [
          "",
          /* @__PURE__ */ jsx13("a", { href: "https://scikit-learn.org/stable/modules/impute.html", children: "Imputation guide" }),
          ", ",
          /* @__PURE__ */ jsx13("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.impute.KNNImputer.html", children: "KNNImputer" }),
          " and ",
          /* @__PURE__ */ jsx13("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.impute.IterativeImputer.html", children: "IterativeImputer" }),
          ": target-specific donors/fallbacks, indicator/empty-column choices and experimental conditional completion. An API's NaN support is not a universal missingness assumption."
        ] }),
        /* @__PURE__ */ jsxs10("li", { children: [
          "",
          /* @__PURE__ */ jsx13("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.PowerTransformer.html", children: "PowerTransformer" }),
          " and ",
          /* @__PURE__ */ jsx13("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.QuantileTransformer.html", children: "QuantileTransformer" }),
          ": fitted parameter/landmark state and standardization/endpoint conventions. Box and Cox's ",
          /* @__PURE__ */ jsx13("a", { href: "https://doi.org/10.1111/j.2517-6161.1964.tb00553.x", children: "1964 original paper" }),
          " and Yeo and Johnson's ",
          /* @__PURE__ */ jsx13("a", { href: "https://academic.oup.com/biomet/article-abstract/87/4/954/232908", children: "2000 paper" }),
          " receive primary attribution; metadata/abstract access did not establish a full scanned/paywalled-body reading. Accessible official formulas and the compared canonical book support the local teaching."
        ] }),
        /* @__PURE__ */ jsxs10("li", { children: [
          "",
          /* @__PURE__ */ jsx13("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.KBinsDiscretizer.html", children: "KBinsDiscretizer" }),
          ", ",
          /* @__PURE__ */ jsx13("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html", children: "KMeans" }),
          ", ",
          /* @__PURE__ */ jsx13("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.PolynomialFeatures.html", children: "PolynomialFeatures" }),
          " and ",
          /* @__PURE__ */ jsx13("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.SplineTransformer.html", children: "SplineTransformer" }),
          ": explicit percentile method, supplied-centers ownership, exponent order and extended knots. KMeans owns supplied init/n_init; KBins does not. B-spline and natural-cubic boundary conditions are distinct."
        ] }),
        /* @__PURE__ */ jsxs10("li", { children: [
          "",
          /* @__PURE__ */ jsx13("a", { href: "https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.TargetEncoder.html", children: "TargetEncoder" }),
          ": primary reference for the training/inference distinction, target-type shape, smoothing and exactly-once cv coverage. Past-only warm-up needs a manually aligned subset rather than an invalid full-coverage claim."
        ] }),
        /* @__PURE__ */ jsxs10("li", { children: [
          "",
          /* @__PURE__ */ jsx13("a", { href: "https://arxiv.org/pdf/0902.2206v5", children: "Weinberger and colleagues' feature-hashing paper" }),
          ": original signed-projection assumptions and inner-product analysis. Selected body sections2\u20133 and lemma text were read in the inherited research; our constructed collision is not its empirical evaluation or theorem verification."
        ] }),
        /* @__PURE__ */ jsxs10("li", { children: [
          "",
          /* @__PURE__ */ jsx13("a", { href: "https://amices.org/mice/reference/pool.html", children: "mice analysis/pooling" }),
          " and ",
          /* @__PURE__ */ jsx13("a", { href: "https://amices.org/mice/reference/pool.scalar.html", children: "pool.scalar" }),
          ": ordinary specialist analysis-estimate extraction, variance and degrees-of-freedom route. The optional R source has no claimed run. ",
          /* @__PURE__ */ jsx13("a", { href: "https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.normal_inverse_gamma.html", children: "SciPy normal_inverse_gamma" }),
          " supplies the ordinary joint distribution primitive, introduced 1.15; the posterior updates are derived locally. Rubin's ",
          /* @__PURE__ */ jsx13("a", { href: "https://dash.harvard.edu/entities/publication/73120378-8764-6bd4-e053-0100007fdf3b", children: "1976 primary abstract/record" }),
          " supplies historical missing-data attribution without an unseen whole-paper claim."
        ] }),
        /* @__PURE__ */ jsxs10("li", { children: [
          "",
          /* @__PURE__ */ jsx13("a", { href: "https://allisonhorst.github.io/palmerpenguins/reference/penguins.html", children: "Palmer Penguins project and variables" }),
          ", by Allison Horst, Alison Hill and Kristen Gorman using Palmer Station observations collected by Gorman and colleagues: data context and CC0 availability. Our CSV preserves all observations and NA cells; the predictive task and fixed-split comparison are this lesson's controlled exercise, not a claim about all ecological populations."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx13(H3, { children: "Setup and actual files" }),
    /* @__PURE__ */ jsx13(Prose, { children: "The full README, pinned direct dependencies and source-role metadata accompany the download directory. Use Python 3.12 and install requirements once; keep imported helper files together. The optional R route has its separate installation/run instructions and unexecuted status. Every teaching program is shown whole with its actual retained or new output. The answer asset has a separate role. Copy and Download must use the shared controls and the exact shown file contents; a count of files cannot certify that agreement." }),
    /* @__PURE__ */ jsx13(CodeBlock, { language: "shell", children: "python -m venv .venv\n# Activate .venv for your platform, then:\npython -m pip install -r requirements.txt\npython fitted_rulers.py" }),
    /* @__PURE__ */ jsx13(NeuralTable, { caption: "Setup and actual files", headers: [/* @__PURE__ */ jsx13(Fragment6, { children: "Actual file" }), /* @__PURE__ */ jsx13(Fragment6, { children: "Purpose" }), /* @__PURE__ */ jsx13(Fragment6, { children: "Bytes" })], rows: [[/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/fitted_preparation.py", children: "fitted_preparation.py" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact retained whole historical programme; no replay" }), /* @__PURE__ */ jsx13(Fragment6, { children: "3634" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/fitted_preparation.stdout.txt", children: "fitted_preparation.stdout.txt" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact historical stdout literal" }), /* @__PURE__ */ jsx13(Fragment6, { children: "213" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/fitted_rulers.py", children: "fitted_rulers.py" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "complete new constructed teaching programme" }), /* @__PURE__ */ jsx13(Fragment6, { children: "5853" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/fitted_rulers.stdout.txt", children: "fitted_rulers.stdout.txt" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact captured new stdout bytes" }), /* @__PURE__ */ jsx13(Fragment6, { children: "664" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/category_policies.py", children: "category_policies.py" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "complete new constructed teaching programme" }), /* @__PURE__ */ jsx13(Fragment6, { children: "5466" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/category_policies.stdout.txt", children: "category_policies.stdout.txt" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact captured new stdout bytes" }), /* @__PURE__ */ jsx13(Fragment6, { children: "521" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/masked_simple_imputation.py", children: "masked_simple_imputation.py" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "complete new constructed teaching programme" }), /* @__PURE__ */ jsx13(Fragment6, { children: "5330" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/masked_simple_imputation.stdout.txt", children: "masked_simple_imputation.stdout.txt" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact captured new stdout bytes" }), /* @__PURE__ */ jsx13(Fragment6, { children: "392" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/nan_aware_donors.py", children: "nan_aware_donors.py" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "complete new constructed teaching programme" }), /* @__PURE__ */ jsx13(Fragment6, { children: "5144" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/nan_aware_donors.stdout.txt", children: "nan_aware_donors.stdout.txt" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact captured new stdout bytes" }), /* @__PURE__ */ jsx13(Fragment6, { children: "514" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/penguins_prepare.py", children: "penguins_prepare.py" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact retained whole historical programme; no replay" }), /* @__PURE__ */ jsx13(Fragment6, { children: "2296" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/penguins_prepare.stdout.txt", children: "penguins_prepare.stdout.txt" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact historical stdout literal" }), /* @__PURE__ */ jsx13(Fragment6, { children: "343" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/fitted_power_maps.py", children: "fitted_power_maps.py" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "complete new constructed teaching programme" }), /* @__PURE__ */ jsx13(Fragment6, { children: "6558" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/fitted_power_maps.stdout.txt", children: "fitted_power_maps.stdout.txt" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact captured new stdout bytes" }), /* @__PURE__ */ jsx13(Fragment6, { children: "592" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/fitted_quantile_maps.py", children: "fitted_quantile_maps.py" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "complete new constructed teaching programme" }), /* @__PURE__ */ jsx13(Fragment6, { children: "3612" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/fitted_quantile_maps.stdout.txt", children: "fitted_quantile_maps.stdout.txt" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact captured new stdout bytes" }), /* @__PURE__ */ jsx13(Fragment6, { children: "408" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/fitted_target_encoding.py", children: "fitted_target_encoding.py" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "complete new constructed teaching programme" }), /* @__PURE__ */ jsx13(Fragment6, { children: "6049" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/fitted_target_encoding.stdout.txt", children: "fitted_target_encoding.stdout.txt" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact captured new stdout bytes" }), /* @__PURE__ */ jsx13(Fragment6, { children: "601" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/bins_polynomials_cycles.py", children: "bins_polynomials_cycles.py" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "complete new constructed teaching programme" }), /* @__PURE__ */ jsx13(Fragment6, { children: "6190" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/bins_polynomials_cycles.stdout.txt", children: "bins_polynomials_cycles.stdout.txt" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact captured new stdout bytes" }), /* @__PURE__ */ jsx13(Fragment6, { children: "746" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/bins_polynomials_cycles.stderr.txt", children: "bins_polynomials_cycles.stderr.txt" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact actual diagnostic, separate from stdout" }), /* @__PURE__ */ jsx13(Fragment6, { children: "281" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/local_spline_basis.py", children: "local_spline_basis.py" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "complete new constructed teaching programme" }), /* @__PURE__ */ jsx13(Fragment6, { children: "5699" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/local_spline_basis.stdout.txt", children: "local_spline_basis.stdout.txt" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact captured new stdout bytes" }), /* @__PURE__ */ jsx13(Fragment6, { children: "1410" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/cross_fit.py", children: "cross_fit.py" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact retained whole historical programme; no replay" }), /* @__PURE__ */ jsx13(Fragment6, { children: "789" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/cross_fit.stdout.txt", children: "cross_fit.stdout.txt" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact historical stdout literal" }), /* @__PURE__ */ jsx13(Fragment6, { children: "111" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/signed_feature_hashing.py", children: "signed_feature_hashing.py" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "complete new constructed teaching programme" }), /* @__PURE__ */ jsx13(Fragment6, { children: "2938" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/signed_feature_hashing.stdout.txt", children: "signed_feature_hashing.stdout.txt" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact captured new stdout bytes" }), /* @__PURE__ */ jsx13(Fragment6, { children: "545" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/conditional_iterative_completion.py", children: "conditional_iterative_completion.py" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "complete new constructed teaching programme" }), /* @__PURE__ */ jsx13(Fragment6, { children: "5111" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/conditional_iterative_completion.stdout.txt", children: "conditional_iterative_completion.stdout.txt" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact captured new stdout bytes" }), /* @__PURE__ */ jsx13(Fragment6, { children: "2240" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/pool_scalar_analyses.py", children: "pool_scalar_analyses.py" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "complete new constructed teaching programme" }), /* @__PURE__ */ jsx13(Fragment6, { children: "1709" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/pool_scalar_analyses.stdout.txt", children: "pool_scalar_analyses.stdout.txt" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact captured new stdout bytes" }), /* @__PURE__ */ jsx13(Fragment6, { children: "726" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/normal_completion_and_sensitivity.py", children: "normal_completion_and_sensitivity.py" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "complete new constructed teaching programme" }), /* @__PURE__ */ jsx13(Fragment6, { children: "4181" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/normal_completion_and_sensitivity.stdout.txt", children: "normal_completion_and_sensitivity.stdout.txt" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact captured new stdout bytes" }), /* @__PURE__ */ jsx13(Fragment6, { children: "1117" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/multiple_imputation_mice.R", children: "multiple_imputation_mice.R" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "complete optional ordinary R source; unexecuted" }), /* @__PURE__ */ jsx13(Fragment6, { children: "1442" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/practice_solutions.py", children: "practice_solutions.py" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "complete changed-task answer asset" }), /* @__PURE__ */ jsx13(Fragment6, { children: "6513" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/practice_solutions.stdout.txt", children: "practice_solutions.stdout.txt" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact captured new stdout bytes" }), /* @__PURE__ */ jsx13(Fragment6, { children: "1552" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/penguins.csv", children: "penguins.csv" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "retained actual CRLF data; CC0" }), /* @__PURE__ */ jsx13(Fragment6, { children: "15586" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/calculated-inputs.json", children: "calculated-inputs.json" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "retained full split/fit/prediction/transformed-row inputs" }), /* @__PURE__ */ jsx13(Fragment6, { children: "43077" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/scaling-native.json", children: "scaling-native.json" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "retained historical native receipt" }), /* @__PURE__ */ jsx13(Fragment6, { children: "2506" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/source-roles.json", children: "source-roles.json" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "exact source/stream/data roles" }), /* @__PURE__ */ jsx13(Fragment6, { children: "16412" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/README.md", children: "README.md" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "complete setup, run and Copy/Download contract" }), /* @__PURE__ */ jsx13(Fragment6, { children: "4399" })], [/* @__PURE__ */ jsxs10(Fragment6, { children: [
      "",
      /* @__PURE__ */ jsx13("a", { href: "/learn-assets/feature-preparation-private/requirements.txt", children: "requirements.txt" }),
      ""
    ] }), /* @__PURE__ */ jsx13(Fragment6, { children: "actual tested direct dependency pins" }), /* @__PURE__ */ jsx13(Fragment6, { children: "61" })]] }),
    /* @__PURE__ */ jsxs10(Prose, { children: [
      "Current CSV SHA-256: ",
      /* @__PURE__ */ jsx13("code", { children: "79995be0ba7a6df1e9309e399a23438c0854f959d29950885dafb94ab881be68" }),
      "; historical LF execution-input SHA-256: ",
      /* @__PURE__ */ jsx13("code", { children: "f204db2c753b0937caac3cb35258562c14f073e4bbc76be24b4c51ce22767a93" }),
      ". Exact newline normalization relates the two; it is not a new numerical run."
    ] }),
    /* @__PURE__ */ jsx13(Prose, { children: "The source-role record binds exact current-download and historical-executed CSV identities, three retained source/stdout pairs, new successful sources/streams, failed attempts and explicit unexecuted R status. Programs are complete offline assets; fixtures in them are declared constructed examples. Real-data numerical evidence remains historical with its original split, inputs and versions. The diagrams use these retained values; current live edits apply the stated arithmetic and never rerun the historical experiment." })
  ] });
}
var preparation_lesson_default = { title: "Feature Scaling, Encoding & Imputation", readTime: "~110 min core reading \xB7 deeper code and practice in separate sittings", hasIntegratedGuide: true, content: PreparationLesson };
export {
  preparation_lesson_default as default
};
