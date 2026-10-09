import { useEffect, useRef, useState } from "react";
import { squareVertices, squareElementNames, vertexImage, moveSquareData } from "../../data/abstract-algebra-models.js";
const names = squareElementNames;
const num = (value) => value === null || value === void 0 ? "undefined" : typeof value === "number" ? Number(value.toFixed(6)).toString() : String(value);
const colour = (index) => ["blue", "gold", "rose", "white"][index % 4];
const vector = (values) => `(${values.map(num).join(", ")})`;
function Canvas({ label, height = 230, maxWidth = 520, children }) {
  const host = useRef(null);
  const [width, setWidth] = useState(maxWidth);
  useEffect(() => {
    const node = host.current;
    const measure = () => setWidth(Math.max(140, Math.min(maxWidth, node.clientWidth * 16 / parseFloat(getComputedStyle(document.documentElement).fontSize))));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [maxWidth]);
  return <div className="aa-canvas" ref={host}><svg
    role="img"
    aria-label={label}
    className="aa-svg"
    viewBox={`0 0 ${width} ${height}`}
    style={{ width: "100%", height: `${height / 16}rem` }}
  >
    {children({ width, height })}
  </svg></div>;
}
function Text({ x, y, children, anchor = "middle", tone = "", ...props }) {
  return <text className={`aa-text ${tone}`} x={x} y={y} textAnchor={anchor} {...props}>{children}</text>;
}
function Arrow({ x1, y1, x2, y2, tone = "gold", label, bend = 0, control }) {
  const dx = x2 - x1, dy = y2 - y1, length = Math.hypot(dx, dy) || 1;
  const cx = control?.[0] ?? (x1 + x2) / 2 - dy / length * bend, cy = control?.[1] ?? (y1 + y2) / 2 + dx / length * bend;
  const angle = Math.atan2(y2 - cy, x2 - cx), size = 7;
  const head = [-0.45, 0.45].map((offset) => [x2 - size * Math.cos(angle + offset), y2 - size * Math.sin(angle + offset)]);
  return <g className={`aa-stroke ${tone}`}><path d={`M${x1},${y1}Q${cx},${cy} ${x2},${y2}`} fill="none"><title>{label || "Directed transformation"}</title></path>
    <path d={`M${head[0]}L${x2},${y2}L${head[1]}`} fill="none" /></g>;
}
function Panel({ title, children }) {
  return <section className="aa-panel"><p className="aa-panel-title">{title}</p>{children}</section>;
}
function Compare({ children }) {
  return <div className="aa-compare">{children}</div>;
}
function Figure({ job, title, caption, children }) {
  return <figure className="aa-figure" data-algebra-mechanism={job} aria-label={title}><p className="aa-figure-title">{title}</p>{children}<figcaption>{caption}</figcaption></figure>;
}
function Square({ values = ["A", "B", "C", "D"], label = "Four addressed square positions", selected = -1, map, coordinate = false, painted = false }) {
  const displayed = map === void 0 ? values : moveSquareData(map, values);
  const toneAt = (i) => painted ? colour(displayed[i]) : typeof displayed[i] === "string" && ["A", "B", "C", "D"].includes(displayed[i]) ? colour(["A", "B", "C", "D"].indexOf(displayed[i])) : colour(i);
  return <div className="aa-square"><Canvas label={label} height={230} maxWidth={260}>{({ width }) => {
    const cx = width / 2, cy = 112, radius = Math.min(65, width * 0.31);
    const at = (i) => [cx + squareVertices[i][0] * radius, cy - squareVertices[i][1] * radius];
    return <><polygon className="aa-outline" points={[0, 1, 2, 3].map((i) => at(i).join(",")).join(" ")} />
      <line className="aa-axis" x1={cx - radius - 14} x2={cx + radius + 14} y1={cy} y2={cy} />
      <line className="aa-axis" x1={cx} x2={cx} y1={cy - radius - 14} y2={cy + radius + 14} />
      {[0, 1, 2, 3].map((i) => {
      const [x, y] = at(i);
      return <g key={i}><circle cx={x} cy={y} r={9} className={`aa-node ${toneAt(i)} ${selected === i ? "selected" : ""}`} /><Text x={x} y={y + 5}>{i}</Text>{typeof displayed[i] === "string" && displayed[i].length === 1 && <Text x={x} y={y + (i === 3 ? 27 : -17)}>{displayed[i]}</Text>}</g>;
    })}
      {coordinate && <><Text x={cx + radius + 16} y={cy + 27} anchor="end">x</Text><Text x={cx + 17} y={cy - radius - 14}>y</Text><Text x={cx - 12} y={cy + 20}>0</Text></>}
    </>;
  }}</Canvas><ol className="aa-addresses" start={0}>{displayed.map((value, i) => <li key={i} className={toneAt(i)}><span>Position {i}</span><strong>{num(value)}</strong></li>)}</ol></div>;
}
function PermutationWires({ g = 1, values = ["A", "B", "C", "D"], label = `${names[g]} on all four positions` }) {
  const moved = moveSquareData(g, values);
  return <><Canvas label={label} height={220}>{({ width }) => {
    const left = 24, right = width - 24, y = (i) => 34 + i * 48;
    return <>{[0, 1, 2, 3].map((i) => <Arrow key={i} x1={left + 10} y1={y(i)} x2={right - 10} y2={y(vertexImage(g, i))} tone={colour(i)} label={`Source ${i} \u2192 destination ${vertexImage(g, i)}`} />)}
      {[0, 1, 2, 3].map((i) => <g key={i}><circle cx={left} cy={y(i)} r={9} className={`aa-node ${colour(i)}`} /><Text x={left} y={y(i) + 5}>{i}</Text><circle cx={right} cy={y(i)} r={9} className={`aa-node ${colour(i)}`} /><Text x={right} y={y(i) + 5}>{i}</Text></g>)}</>;
  }}</Canvas><Table label={`${label}; complete addressed values`} headers={["Old i", "Value", "New g(i)", "Output at i"]} rows={[0, 1, 2, 3].map((i) => [i, values[i], vertexImage(g, i), moved[i]])} /></>;
}
function Table({ label, headers, rows, rowClass, cellClass }) {
  const host = useRef(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const node = host.current;
    const measure = () => setOverflow(node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    for (const child of node.children) observer.observe(child);
    return () => observer.disconnect();
  }, [rows]);
  return <div className="aa-table"><p className="aa-table-title">{label}</p><div ref={host} className="aa-table-scroll" role="region" tabIndex={0} aria-label={`${label}; complete keyboard-scrollable table`}>
    <table><caption>{label}</caption><thead><tr>{headers.map((header, i) => <th key={i} scope="col">{header}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr className={rowClass?.(row, i)} key={i}>{row.map((value, j) => <td className={cellClass?.(value, i, j)} key={j}>{num(value)}</td>)}</tr>)}</tbody></table>
  </div>{overflow && <p className="aa-scroll-hint">Focus this table; use Left/Right for every column and Up/Down for every row.</p>}</div>;
}
function Matrix({ label, values, rowNames, columnNames, classFor }) {
  return <Table
    label={label}
    headers={["Destination \u2193 / source \u2192", ...values[0].map((_, j) => columnNames?.[j] ?? j)]}
    rows={values.map((row, i) => [rowNames?.[i] ?? i, ...row])}
    cellClass={(value, i, j) => j > 0 ? classFor?.(i, j - 1, value) : ""}
  />;
}
function Blocks({ blocks, label = "Complete coset blocks", selected, names: labels = names }) {
  return <div className="aa-blocks" aria-label={label}>{blocks.map((block, i) => <section key={i} className={`aa-block ${colour(i)} ${selected === i ? "selected" : ""}`}>
    <p>Block {i}</p><Canvas label={`${label}; block ${i}: ${block.map((g) => labels[g]).join(", ")}`} maxWidth={260} height={Math.ceil(block.length / 2) * 52 + 52}>{({ width, height }) => <>
      <ellipse cx={width / 2} cy={height / 2} rx={width / 2 - 8} ry={height / 2 - 8} className={`aa-stroke ${colour(i)}`} />
      {block.map((g, j) => {
    const x = j % 2 === 0 ? width * 0.32 : width * 0.68, y = 42 + Math.floor(j / 2) * 52;
    return <g key={g}><circle cx={x} cy={y} r={17} className={`aa-node ${colour(i)}`} /><Text x={x} y={y + 5}>{labels[g]}</Text></g>;
  })}
    </>}</Canvas><div className="aa-elements">{block.map((g) => <span key={g} className={colour(i)}>{labels[g]}</span>)}</div>
  </section>)}</div>;
}
function States({ states, title = "Complete orbit", selected, painted = true }) {
  return <div className="aa-state-grid">{states.map((state, i) => <Panel key={i} title={`${title} ${i}`}><Square values={state} label={`${title} ${i}: ${vector(state)}`} selected={selected} painted={painted} /></Panel>)}</div>;
}
function Products({ weights, values, label = "Addressed multiply-add contributions", unit = "V" }) {
  const products = weights.map((weight, i) => weight * values[i]), sum = products.reduce((a, b) => a + b, 0);
  return <><Canvas label={label} height={weights.length * 56 + 82}>{({ width }) => {
    const left = 20, productX = width / 2, right = width - 20, y = (i) => 26 + i * 56, sumY = weights.length * 56 + 40;
    return <>{products.map((product, i) => <g key={i}><circle cx={left} cy={y(i)} r={8} className={`aa-node ${colour(i)}`} /><Text x={left} y={y(i) + 5}>{i}</Text>
      <Arrow x1={left + 10} y1={y(i)} x2={productX - 10} y2={y(i)} tone={colour(i)} label={`Source ${i} contributes ${num(product)} ${unit}`} />
      <circle cx={productX} cy={y(i)} r={9} className="aa-node gold" /><Text x={productX} y={y(i) + 26} tone="external">{`p${i}=${num(product)}`}</Text>
      <line x1={productX + 9} x2={right} y1={y(i)} y2={y(i)} className="aa-stroke gold" />
      <line x1={right} x2={right} y1={y(i)} y2={sumY} className="aa-stroke rose" /></g>)}
      <Arrow x1={right} y1={sumY} x2={productX + 10} y2={sumY} tone="rose" label={`Sum ${num(sum)} ${unit}`} /><circle cx={productX} cy={sumY} r={9} className="aa-node rose" /><Text x={productX - 17} y={sumY + 5} anchor="end">Σ</Text></>;
  }}</Canvas><Table label={`${label}; exact operands and ${unit} outputs`} headers={["Source", "Weight", "Input", "Product"]} rows={weights.map((weight, i) => [i, weight, values[i], products[i]])} /><p className="aa-result">Sum: <strong>{num(sum)} {unit}</strong></p></>;
}
function MapRows({ inputs, outputs, label, inputName = "Input", outputName = "Output" }) {
  const unique = [...new Set(outputs)];
  return <><Canvas label={label} height={Math.max(inputs.length, unique.length) * 42 + 28}>{({ width }) => {
    const left = 24, right = width - 24, y = (i) => 24 + i * 42;
    return <>{inputs.map((input, i) => <g key={i}><Arrow x1={left + 18} y1={y(i)} x2={right - 18} y2={y(unique.indexOf(outputs[i]))} tone={colour(i)} label={`${num(input)} \u2192 ${num(outputs[i])}`} /><circle cx={left} cy={y(i)} r={17} className={`aa-node ${colour(i)}`} /><Text x={left} y={y(i) + 5}>{num(input)}</Text></g>)}
      {unique.map((value, i) => <g key={i}><circle cx={right} cy={y(i)} r={17} className="aa-node rose" /><Text x={right} y={y(i) + 5}>{num(value)}</Text></g>)}</>;
  }}</Canvas><Table label={label} headers={[inputName, outputName]} rows={inputs.map((value, i) => [value, outputs[i]])} /></>;
}
function Route({ states, moves, label, tracked = -1, stage = -1 }) {
  return <div className="aa-route" aria-label={label}>{states.map((state, i) => <div className={`aa-route-stage ${stage === i ? "active" : ""}`} key={i}>
    {i > 0 && <p className="aa-route-operation">↓ {moves[i - 1]}</p>}<p className="aa-stage-name">Stage {i}</p>
    <Square values={state} selected={Array.isArray(tracked) ? tracked[i] : tracked < 0 ? -1 : state.indexOf(states[0][tracked])} label={`${label}; stage ${i}`} />
  </div>)}</div>;
}
function SegmentGeometry({ from, to, label, tone = "gold" }) {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  return <><Canvas label={label} height={240}>{({ width }) => {
    const radius = Math.min(72, width * 0.29), cx = width / 2, cy = 118, at = (p) => [cx + p[0] * radius, cy - p[1] * radius];
    const a = at(from), b = at(to);
    return <><polygon className="aa-outline" points={squareVertices.map((p) => at(p).join(",")).join(" ")} />
      <line className={`aa-stroke ${tone}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
      <circle cx={a[0]} cy={a[1]} r={5} className="aa-node blue" /><circle cx={b[0]} cy={b[1]} r={5} className="aa-node rose" /></>;
  }}</Canvas><p>{vector(from)} → {vector(to)}; length <strong>{num(length)}</strong> coordinate units.</p></>;
}
function MoveGraph({ labels, edges, label }) {
  const rows = Math.ceil(labels.length / 2), height = rows * 68 + 60;
  return <><Canvas label={label} height={height}>{({ width }) => {
    const point = (i) => [i < rows ? 32 : width - 32, 48 + (i < rows ? i : rows - 1 - i % rows) * 68];
    return <>{edges.map((edge, index) => {
      const a = point(edge.from), b = point(edge.to), siblings = edges.filter((e) => Math.min(e.from, e.to) === Math.min(edge.from, edge.to) && Math.max(e.from, e.to) === Math.max(edge.from, edge.to));
      const lane = siblings.indexOf(edge) - (siblings.length - 1) / 2;
      if (edge.from === edge.to) {
        const end = [a[0] + 12, a[1] - 16], control = [a[0] + 30, a[1] - 44];
        const angle = Math.atan2(end[1] - control[1], end[0] - control[0]);
        const heads = [-0.45, 0.45].map(offset => [end[0] - 7 * Math.cos(angle + offset), end[1] - 7 * Math.sin(angle + offset)]);
        return <g key={index} className={`aa-stroke ${edge.tone || "gold"}`}><path d={`M${a[0] - 12},${a[1] - 16}C${a[0] - 30},${a[1] - 44} ${control} ${end}`} fill="none"><title>{`${edge.move}: ${labels[edge.from]} \u2192 itself`}</title></path><path d={`M${heads[0]}L${end}L${heads[1]}`} fill="none" /></g>;
      }
      const low = point(Math.min(edge.from, edge.to)), high = point(Math.max(edge.from, edge.to)), dx = high[0] - low[0], dy = high[1] - low[1], length = Math.hypot(dx, dy);
      const control = [(a[0] + b[0]) / 2 - dy / length * lane * 28, (a[1] + b[1]) / 2 + dx / length * lane * 28];
      if (a[0] === b[0] && Math.abs(a[1] - b[1]) > 68) control[0] = a[0] === 32 ? 12 : width - 12;
      const startAngle = Math.atan2(control[1] - a[1], control[0] - a[0]), endAngle = Math.atan2(b[1] - control[1], b[0] - control[0]);
      return <Arrow key={index} x1={a[0] + 18 * Math.cos(startAngle)} y1={a[1] + 18 * Math.sin(startAngle)} x2={b[0] - 18 * Math.cos(endAngle)} y2={b[1] - 18 * Math.sin(endAngle)} control={control} tone={edge.tone || "gold"} label={`${edge.move}: ${labels[edge.from]} \u2192 ${labels[edge.to]}`} />;
    })}{labels.map((name, i) => {
      const [x, y] = point(i);
      return <g key={i}><circle cx={x} cy={y} r={17} className={`aa-node ${i < rows ? "blue" : "rose"}`} /><Text x={x} y={y + 5}>{name}</Text></g>;
    })}</>;
  }}</Canvas><Table label={`${label}; complete directed transitions`} headers={["From", "Move", "To"]} rows={edges.map((edge) => [labels[edge.from], edge.move, labels[edge.to]])} /></>;
}
export {
  Arrow,
  Blocks,
  Canvas,
  Compare,
  Figure,
  MapRows,
  Matrix,
  MoveGraph,
  Panel,
  PermutationWires,
  Products,
  Route,
  SegmentGeometry,
  Square,
  States,
  Table,
  Text,
  colour,
  names,
  num,
  vector
};
