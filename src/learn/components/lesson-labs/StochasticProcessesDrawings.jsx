import { Children, useEffect, useId, useRef, useState } from "react";
import "./stochastic-processes-flow.css";
function fmt(value, digits = 5) {
  if (value === null || value === void 0) return "undefined";
  if (!Number.isFinite(value)) return String(value);
  if (value !== 0 && Math.abs(value) < 10 ** -digits) return value.toExponential(3);
  return String(Number(value.toFixed(digits)));
}
function Figure({ title, caption, children, ...props }) {
  return <figure className="sp-figure" aria-label={title} {...props}>
    {children}<figcaption>{caption}</figcaption>
  </figure>;
}
function Compare({ children }) {
  return <div className="sp-compare">{Children.toArray(children).map((child, index) => <div className="sp-panel" key={index}>{child}</div>)}</div>;
}
function ScrollRegion({ title, kind = "diagram", className = "sp-local-scroll", children }) {
  const ref = useRef(null);
  const hintId = useId();
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setOverflows(element.scrollWidth > element.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, [children]);
  return <div className="sp-reading-region">
    {overflows && <p id={hintId} className="sp-scroll-hint">Scroll left or right to read the complete {kind}. Focus the region and use the Left/Right Arrow keys.</p>}
    <div ref={ref} className={className} tabIndex={overflows ? 0 : -1} role="region" aria-label={title} aria-describedby={overflows ? hintId : void 0}>{children}</div>
  </div>;
}
function Canvas({ title, height = 260, width = 360, children }) {
  const id = useId();
  return <ScrollRegion title={title}><svg className="sp-svg" style={{ width: `${width / 16}rem`, minWidth: `${width / 16}rem` }} viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={id}>
    <title id={id}>{title}</title>
    <defs><marker id={`${id}-arrow`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 Z" fill="currentColor" /></marker></defs>
    <g style={{ "--sp-arrow": `url(#${id}-arrow)` }}>{children}</g>
  </svg></ScrollRegion>;
}
function Label({ x, y, children, anchor = "middle", className = "" }) {
  return <text x={x} y={y} textAnchor={anchor} className={`sp-label ${className}`}>{children}</text>;
}
function Arrow({ from, to, bend = 0, className = "", label, labelAt, weight }) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy);
  if (length === 0) return null;
  const middle = [(from[0] + to[0]) / 2 - bend * dy / length, (from[1] + to[1]) / 2 + bend * dx / length];
  return <g className={className}>
    <path d={`M${from} Q${middle} ${to}`} className="sp-arrow" style={weight === void 0 ? void 0 : { strokeWidth: 1 + 8 * weight }} />
    {label !== void 0 && <Label x={labelAt?.[0] ?? middle[0]} y={labelAt?.[1] ?? middle[1] - 12}>{label}</Label>}
  </g>;
}
function Dot({ at, label, below, className = "", onSelect }) {
  const mark = <><circle cx={at[0]} cy={at[1]} r="15" className={`sp-dot ${className}`} /><Label x={at[0]} y={at[1] + 5}>{label}</Label>{below && <Label x={at[0]} y={at[1] + 38}>{below}</Label>}</>;
  return onSelect ? <g role="button" tabIndex="0" aria-label={`Select ${label}`} onClick={onSelect} onKeyDown={(event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  }}>{mark}</g> : <g>{mark}</g>;
}
function Table({ title, headers, rows }) {
  return <ScrollRegion title={title} kind="table" className="sp-table">
    <table><caption>{title}</caption><thead><tr>{headers.map((header) => <th key={header} scope="col">{header}</th>)}</tr></thead>
      <tbody>{rows.map((row, i) => <tr key={i}>{row.map((value, j) => j === 0 ? <th key={j} scope="row">{value}</th> : <td key={j}>{typeof value === "number" ? fmt(value) : value ?? "undefined"}</td>)}</tr>)}</tbody>
    </table>
  </ScrollRegion>;
}
function Matrix({ title, values, rowNames, columnNames }) {
  return <div className="sp-matrix"><Table title={title} headers={["Now / next", ...columnNames]} rows={values.map((row, i) => [rowNames[i], ...row])} /></div>;
}
function Plot({ title, xDomain = [0, 1], yDomain = [0, 1], xLabel = "Time", yLabel = "Value", series = [], children, height = 280 }) {
  const id = useId();
  const x = (value) => 66 + (value - xDomain[0]) / (xDomain[1] - xDomain[0]) * 270;
  const y = (value) => 212 - (value - yDomain[0]) / (yDomain[1] - yDomain[0]) * 170;
  function ticks(domain) {
    return [.../* @__PURE__ */ new Set([domain[0], (domain[0] + domain[1]) / 2, domain[1], ...domain[0] < 0 && domain[1] > 0 ? [0] : []])];
  }
  return <div className="sp-plot"><Canvas title={title} height={height}>
    <defs><clipPath id={id}><rect x="60" y="36" width="282" height="182" /></clipPath></defs>
    <Label x="66" y="21" anchor="start">{yLabel}</Label>
    {ticks(yDomain).map((value) => <g key={value}><line x1="66" x2="336" y1={y(value)} y2={y(value)} className="sp-grid" /><Label x="56" y={y(value) + 4} anchor="end">{fmt(value, 3)}</Label></g>)}
    {ticks(xDomain).map((value) => <g key={value}><line x1={x(value)} x2={x(value)} y1="42" y2="212" className="sp-grid" /><Label x={x(value)} y={value === 0 && xDomain[0] < 0 ? 247 : 230}>{fmt(value, 3)}</Label></g>)}
    <Label x="200" y="270">{xLabel}</Label>
    <g clipPath={`url(#${id})`}>{series.map(({ points, className = "" }, i) => <polyline key={i} points={points.map(([a, b]) => `${x(a)},${y(b)}`).join(" ")} className={`sp-line ${className}`} />)}{children?.({ x, y })}</g>
  </Canvas><p className="sp-units">{xLabel}: [{fmt(xDomain[0])}, {fmt(xDomain[1])}]; {yLabel}: [{fmt(yDomain[0])}, {fmt(yDomain[1])}].</p></div>;
}
function Histories({ law, selected = "", onSelect }) {
  const height = 72 + law.paths.length * 40;
  return <Canvas title={`${law.kind}: all supported four-time histories and exact probabilities`} height={height}>
    {[0, 1, 2, 3].map((t) => <Label key={t} x={66 + 54 * t} y="24">t = {t}</Label>)}
    <Label x="308" y="24">Mass</Label>
    {law.paths.map(({ values, probability }, i) => {
    const row = 54 + i * 40;
    const key = values.join("");
    return <g key={key} className={selected === key ? "sp-selected" : ""} role={onSelect ? "button" : void 0} tabIndex={onSelect ? 0 : void 0} aria-label={`History ${key}, probability ${probability}`} onClick={() => onSelect?.(key)} onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect?.(key);
      }
    }}>
        <polyline points={values.map((bit, t) => `${66 + t * 54},${row + 6 - 12 * bit}`).join(" ")} className={`sp-line ${values[0] === values[1] ? "" : "sp-secondary"}`} />
        {values.map((bit, t) => <g key={t}><circle cx={66 + 54 * t} cy={row + 6 - 12 * bit} r="9" className="sp-bit" /><Label x={66 + 54 * t} y={row + 10 - 12 * bit}>{bit}</Label></g>)}
        <Label x="308" y={row + 5}>{fmt(probability)}</Label>
      </g>;
  })}
    <Label x="180" y={height - 10}>Solid: first two bits agree</Label>
  </Canvas>;
}
function MassFlow({ matrix, source, step = 1, selected = 0, onSelect }) {
  const destination = matrix[0].map((_, j) => source.reduce((sum, mass, i) => sum + mass * matrix[i][j], 0));
  return <div><Canvas title={`Conditional mass routes into step ${step}`} height={320}>
    <Label x="62" y="22">Step {step - 1}</Label><Label x="292" y="22">Step {step}</Label>
    {matrix.flatMap((row, i) => row.map((p, j) => <g key={`${i}-${j}`} className={selected === i * 2 + j ? "sp-selected" : ""} onClick={() => onSelect?.(i * 2 + j)}>
      <Arrow from={[83, 82 + 145 * i]} to={[271, 82 + 145 * j]} bend={i === j ? i === 0 ? -20 : 20 : i === 0 ? -35 : 35} className={p * source[i] === 0 ? "sp-zero" : ""} weight={p * source[i]} />
    </g>))}
    {[0, 1].map((i) => <g key={i}><Dot at={[62, 82 + 145 * i]} label={i === 0 ? "S" : "R"} below={fmt(source[i])} /><Dot at={[292, 82 + 145 * i]} label={i === 0 ? "S" : "R"} below={fmt(destination[i])} /></g>)}
  </Canvas><p>Each flow width is 1 + 8 × arriving mass in drawing units; dashed faint routes have zero mass. The selected route is amber.</p><Table title="Every route has a source mass and conditional transition" headers={["Route", "Source mass", "Transition", "Arriving mass"]} rows={matrix.flatMap((row, i) => row.map((p, j) => [`${i === 0 ? "S" : "R"} \u2192 ${j === 0 ? "S" : "R"}`, source[i], p, source[i] * p]))} /></div>;
}
function StepPath({ values, title, xmax = values.length - 1, yDomain = [0, 1], yLabel = "State", className = "", points }) {
  const coordinates = points ?? values.flatMap((value, i) => i === values.length - 1 ? [[i, value]] : [[i, value], [i + 1, value]]);
  return <Plot title={title} xDomain={[0, xmax]} yDomain={yDomain} xLabel="Step" yLabel={yLabel} series={[{ points: coordinates, className }]}>{({ x, y }) => values.map((value, i) => <circle key={i} cx={x(i)} cy={y(value)} r="3" className="sp-bit" />)}</Plot>;
}
function Bars({ values, title, xLabel = "State", yLabel = "Probability", ymax = Math.max(1, ...values), selected, onSelect }) {
  return <Plot title={title} xDomain={[-0.5, values.length - 0.5]} yDomain={[0, ymax * 1.15]} xLabel={xLabel} yLabel={yLabel}>{({ x, y }) => values.map((value, i) => <g key={i} className={selected === i ? "sp-selected" : ""} onClick={() => onSelect?.(i)}><rect x={x(i - 0.34)} y={y(value)} width={x(i + 0.34) - x(i - 0.34)} height={y(0) - y(value)} className="sp-area" /><Label x={x(i)} y={y(value) - 8}>{fmt(value, 3)}</Label></g>)}</Plot>;
}
function ReserveGraph({ result, selected = result.start, onSelect }) {
  const width = Math.max(360, 60 + result.boundary * 80);
  return <Canvas title="Actual neighbouring reserve states; boundaries absorb" width={width} height={250}>
    {Array.from({ length: result.boundary }, (_, i) => <g key={i}><Arrow from={[48 + 80 * i, 96]} to={[98 + 80 * i, 96]} bend="-30" className={i === 0 ? "sp-zero" : ""} label={i === 0 ? "0" : fmt(result.upward)} /><Arrow from={[98 + 80 * i, 130]} to={[48 + 80 * i, 130]} bend="-30" className={i + 1 === result.boundary ? "sp-zero" : "sp-secondary"} label={i + 1 === result.boundary ? "0" : fmt(1 - result.upward)} labelAt={[72 + 80 * i, 163]} /></g>)}
    {Array.from({ length: result.boundary + 1 }, (_, i) => <Dot key={i} at={[32 + 80 * i, 112]} label={i} below={i === 0 || i === result.boundary ? "Target" : ""} className={selected === i ? "sp-selected" : ""} onSelect={onSelect ? () => onSelect(i) : void 0} />)}
  </Canvas>;
}
export {
  Arrow,
  Bars,
  Canvas,
  Compare,
  Dot,
  Figure,
  Histories,
  Label,
  MassFlow,
  Matrix,
  Plot,
  ReserveGraph,
  ScrollRegion,
  StepPath,
  Table,
  fmt
};
