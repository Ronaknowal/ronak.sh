import { Children, cloneElement, useId, useLayoutEffect, useRef, useState } from 'react';
import { MathBlock } from '../../components/content/Math.jsx';

export const colors = {
  field: '#78cbe8',
  computed: '#e8b44a',
  defect: '#f29ab1',
  reference: '#c6b6f0',
  muted: '#969da8',
};

// Identity is stable across the entire diffusion comparison chain.
export const timeMethods = {
  explicit: { label: 'Explicit Euler', color: colors.computed, dash: undefined },
  backward: { label: 'Backward Euler', color: colors.reference, dash: '9 3' },
  crank: { label: 'Crank–Nicolson', color: colors.defect, dash: '2 3' },
  semidiscrete: { label: 'Exact spatial ODE', color: colors.field, dash: '6 2 1 2' },
  continuous: { label: 'Exact continuous PDE', color: colors.muted, dash: '12 4' },
};
export const correctionStages = { initial: colors.field, smooth: colors.computed, final: colors.reference };

export function number(value, places = 5) {
  if (value === null || value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (!Number.isFinite(value)) return 'outside numeric range';
  if (value === 0) return '0';
  if (Math.abs(value) < 10 ** -places || Math.abs(value) >= 10000) return value.toExponential(2);
  return String(Number(value.toFixed(places)));
}

export function ReadingRegion({ label, children, kind = 'table' }) {
  const ref = useRef(null);
  const [overflow, setOverflow] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    const inspect = () => setOverflow(element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1);
    inspect();
    const observer = new ResizeObserver(inspect);
    observer.observe(element);
    for (const child of element.children) observer.observe(child);
    return () => observer.disconnect();
  }, [children]);
  return <>
    <div ref={ref} className={`npde-reading-region npde-${kind}-region`} role="region" tabIndex={0} aria-label={label}>{children}</div>
    {overflow && <p className="npde-scroll-hint">Focus this {kind} and use the arrow keys to read the remaining rows and columns.</p>}
  </>;
}

export function NumericalPdeEquation({ children }) {
  return <ReadingRegion label="Complete derived equation; keyboard reading region" kind="equation"><div className="npde-equation-content"><MathBlock>{children}</MathBlock></div></ReadingRegion>;
}

export function Ledger({ label, headers, rows }) {
  return <div className="npde-ledger"><p>{label}</p><ReadingRegion label={`${label}; complete values`}>
    <table><thead><tr>{headers.map((header, index) => <th key={index}>{header}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, column) => column === 0 ? <th key={column} scope="row">{Array.isArray(cell) ? cell.map(value => number(value)).join(', ') : number(cell)}</th> : <td key={column}>{Array.isArray(cell) ? cell.map(value => number(value)).join(', ') : number(cell)}</td>)}</tr>)}</tbody>
    </table>
  </ReadingRegion></div>;
}

export function Scene({ label, height = 180, children }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(280);
  useLayoutEffect(() => {
    const inspect = () => {
      const scale = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
      setWidth(Math.max(110, ref.current.clientWidth / scale));
    };
    inspect();
    const observer = new ResizeObserver(inspect);
    observer.observe(ref.current);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);
  return <div className="npde-scene" ref={ref}><svg role="img" aria-label={label} viewBox={`0 0 ${width} ${height}`} style={{ height: `${height / 16}rem` }}>
    <title>{label}</title>{typeof children === 'function' ? children(width, height) : children}
  </svg></div>;
}

export function Legend({ series }) {
  return <ul className="npde-legend">{series.map(item => <li key={item.label}><svg aria-hidden="true" viewBox="0 0 32 8"><line x1="0" x2="32" y1="4" y2="4" stroke={item.color} strokeWidth="2" strokeDasharray={item.dash ?? (item.dashed ? '5 4' : undefined)} /></svg>{item.label}</li>)}</ul>;
}

export function Plot({ series, label, xLabel = 'Position x', yLabel = 'Field value', markers = [], zero = true, xDomain, yDomain, equal = false, ledgerOnly = false }) {
  if (ledgerOnly) return null;
  const points = series.flatMap(item => item.points).concat(markers);
  const xMin = xDomain?.[0] ?? Math.min(...points.map(point => point[0]));
  const xMax = xDomain?.[1] ?? Math.max(...points.map(point => point[0]));
  const low = Math.min(...points.map(point => point[1]), ...(zero ? [0] : []));
  const high = Math.max(...points.map(point => point[1]), ...(zero ? [0] : []));
  const pad = Math.max((high - low) * .08, high === low ? .1 : 0);
  const yMin = yDomain?.[0] ?? low - pad;
  const yMax = yDomain?.[1] ?? high + pad;
  return <figure className="npde-reading-object"><p>{label}</p><Scene label={label} height={equal ? 210 : 180}>{width => {
    const spanX = xMax - xMin || 1;
    const spanY = yMax - yMin || 1;
    const horizontal = Math.max(65, width - 24);
    const scale = equal ? Math.min(horizontal / spanX, 176 / spanY) : null;
    const plotWidth = equal ? spanX * scale : horizontal;
    const plotHeight = equal ? spanY * scale : 150;
    const left = (width - plotWidth) / 2;
    const top = 12;
    const x = value => left + (value - xMin) / spanX * plotWidth;
    const y = value => top + plotHeight - (value - yMin) / spanY * plotHeight;
    return <>
      {[0, .5, 1].map(fraction => <line key={fraction} x1={left} x2={left + plotWidth} y1={top + fraction * plotHeight} y2={top + fraction * plotHeight} stroke="#343a44" />)}
      {xMin <= 0 && xMax >= 0 && <line x1={x(0)} x2={x(0)} y1={top} y2={top + plotHeight} stroke={colors.muted} />}
      {yMin <= 0 && yMax >= 0 && <line x1={left} x2={left + plotWidth} y1={y(0)} y2={y(0)} stroke={colors.muted} />}
      {series.map(item => <polyline key={item.label} fill="none" stroke={item.color} strokeWidth="2" strokeDasharray={item.dash ?? (item.dashed ? '5 4' : undefined)} points={item.points.map(([a, b]) => `${x(a)},${y(b)}`).join(' ')} />)}
      {markers.map((point, index) => <circle key={index} cx={x(point[0])} cy={y(point[1])} r="3.5" fill={colors.computed} stroke="#090b0d" strokeWidth="1" />)}
    </>;
  }}</Scene><div className="npde-axis-keys"><p>{xLabel}: {number(xMin)} to {number(xMax)}</p><p>{yLabel}: {number(yMin)} to {number(yMax)}</p></div><Legend series={series} /></figure>;
}

export function Matrix({ label, values, rowNames, columnNames }) {
  if (values[0].length > 4) return <div className="npde-matrix-object"><p>{label}: complete coefficient pattern</p><Scene label={`${label}; every row and column, including zeros`} height={200}>{width => {
    const side = Math.min(width - 28, 170);
    const cellX = side / values[0].length, cellY = side / values.length;
    return <>{values.flatMap((row, j) => row.map((value, k) => <rect key={`${j},${k}`} x={14 + k * cellX} y={12 + j * cellY} width={cellX} height={cellY} fill={value === 0 ? '#111418' : value > 0 ? colors.computed : colors.defect} stroke="#555963" strokeWidth=".5" />))}</>;
  }}</Scene><p>Rows top to bottom and columns left to right, preserving the addresses below. Amber: positive; pink: negative; blank: exactly zero. Every coefficient follows in the complete ledger.</p><Ledger label={label} headers={['Row / column', ...(columnNames ?? values[0].map((_, j) => j))]} rows={values.map((row, j) => [rowNames?.[j] ?? j, ...row])} /></div>;
  return <div className="npde-matrix-object"><p>{label}</p>{values.map((row, j) => <div key={j}><p>Row {rowNames?.[j] ?? j}</p><div className="npde-matrix-row" style={{ gridTemplateColumns: `repeat(${row.length},minmax(0,1fr))` }}>{row.map((value, i) => <div key={i}><small>c{columnNames?.[i] ?? i}</small><strong>{number(value, 3)}</strong></div>)}</div></div>)}<p>c0,c1,… preserve the original column addresses. Grid values round to three decimals; the complete numerical ledger follows.</p><Ledger label={`${label}: complete coefficients`} headers={['Row / column', ...(columnNames ?? values[0].map((_, j) => j))]} rows={values.map((row, j) => [rowNames?.[j] ?? j, ...row])} /></div>;
}

export function Mesh({ nodes, values, selected = null, label = 'Actual mesh nodes', coefficients, addresses, coreOnly = false, ledgerOnly = false }) {
  const ledger = <Ledger label="Complete pictured positions and values" headers={['Entry / address', 'Coordinate', ...(values ? ['Value'] : [])]} rows={nodes.map((value, j) => [addresses?.[j] ?? j, value, ...(values ? [values[j]] : [])])} />;
  if (ledgerOnly) return ledger;
  const a = nodes[0];
  const b = nodes.at(-1);
  return <div className="npde-reading-object"><p>{label}</p><Scene label={label} height={80}>{width => {
    const x = value => 14 + (width - 28) * (value - a) / (b - a || 1);
    return <><line x1="14" x2={width - 14} y1="32" y2="32" stroke={colors.muted} />
      {nodes.map((value, j) => <g key={j}><circle cx={x(value)} cy="32" r={j === selected ? 5 : 3} fill={j === selected ? colors.computed : j === 0 || j === nodes.length - 1 ? colors.reference : colors.field} />
        {(j === 0 || j === nodes.length - 1 || j === selected) && <text x={x(value)} y="62" textAnchor={j === 0 ? 'start' : j === nodes.length - 1 ? 'end' : 'middle'}>{addresses?.[j] ?? j}</text>}
      </g>)}
      {selected !== null && coefficients && coefficients.map(([offset, value]) => nodes[selected + offset] !== undefined && <line key={offset} x1={x(nodes[selected + offset])} x2={x(nodes[selected])} y1="12" y2="26" stroke={value >= 0 ? colors.computed : colors.defect} strokeWidth="2" />)}
    </>;
  }}</Scene><p>Cyan: interior entries of this pictured list. Violet: its two ends.{selected !== null && ' Amber: selected entry.'} Horizontal position follows the stated coordinates; only the full problem's prescribed endpoints are known boundary data.</p>
    {!coreOnly && ledger}
  </div>;
}

export function Stencil({ operands, coefficients, result, label, positions, addresses, coreOnly = false, ledgerOnly = false }) {
  if (ledgerOnly) return <Mesh nodes={positions ?? operands.map((_, j) => j)} values={operands} addresses={addresses} ledgerOnly />;
  const nodes = positions ?? operands.map((_, j) => j);
  return <div className="npde-reading-object"><Mesh nodes={nodes} values={operands} addresses={addresses} selected={Math.floor(nodes.length / 2)} coreOnly={coreOnly} label={label} coefficients={coefficients.map((value, j) => [j - Math.floor(nodes.length / 2), value])} />
    <div className="npde-term-rows">{operands.map((value, j) => <p key={j} style={{ borderLeftColor: coefficients[j] >= 0 ? colors.computed : colors.defect }}>Operand {j}: {number(coefficients[j])} × {number(value)} = <strong>{number(coefficients[j] * value)}</strong></p>)}</div>
    <p>Sum of the connected contributions: <strong>{number(result ?? operands.reduce((sum, value, j) => sum + coefficients[j] * value, 0))}</strong>.</p>
  </div>;
}

export function Triangle({ vertices, gradients, label, coreOnly = false, ledgerOnly = false }) {
  const ledger = <Ledger label="Actual vertices and basis gradients" headers={['Vertex / basis', 'Coordinates', 'Gradient']} rows={vertices.map((point, j) => [j, point, gradients?.[j] ?? 'not used'])} />;
  if (ledgerOnly) return ledger;
  const lowX = Math.min(...vertices.map(p => p[0]));
  const lowY = Math.min(...vertices.map(p => p[1]));
  const spanX = Math.max(...vertices.map(p => p[0])) - lowX;
  const spanY = Math.max(...vertices.map(p => p[1])) - lowY;
  return <div className="npde-reading-object"><p>{label}</p><Scene label={label} height={220}>{width => {
    const scale = Math.min((width - 28) / spanX, 140 / spanY);
    const x = a => 14 + (a - lowX) * scale;
    const y = b => 170 - (b - lowY) * scale;
    const centroid = [vertices.reduce((s, p) => s + p[0], 0) / 3, vertices.reduce((s, p) => s + p[1], 0) / 3];
    const largest = gradients ? Math.max(...gradients.map(g => Math.hypot(...g))) : 1;
    return <><polygon points={vertices.map(([a, b]) => `${x(a)},${y(b)}`).join(' ')} fill="rgba(232,180,74,.06)" stroke={colors.computed} strokeWidth="2" />
      {vertices.map(([a, b], j) => <g key={j}><circle cx={x(a)} cy={y(b)} r="4" fill={colors.field} /><text x={x(a)} y={y(b) + (j === 2 ? -10 : 22)} textAnchor={j === 1 ? 'end' : 'start'}>{j}</text></g>)}
      {gradients?.map(([a, b], j) => <g key={j} stroke={[colors.field, colors.defect, colors.reference][j]}><line x1={x(centroid[0])} y1={y(centroid[1])} x2={x(centroid[0]) + a / largest * 32} y2={y(centroid[1]) - b / largest * 32} strokeWidth="2" /><circle cx={x(centroid[0]) + a / largest * 32} cy={y(centroid[1]) - b / largest * 32} r="2" /></g>)}
    </>;
  }}</Scene><p>Horizontal and vertical coordinate units use the same scale. {gradients && <>Cyan: ∇φ₀; pink: ∇φ₁; violet: ∇φ₂. All arrows share the scale: maximum gradient norm {number(Math.max(...gradients.map(g => Math.hypot(...g))))} occupies 32 logical units, preserving relative magnitudes.</>}</p>{!coreOnly && ledger}</div>;
}

export function Investigation({ title, prompt, reset, children }) {
  const sequence = Children.toArray(children);
  const controls = sequence.filter(child => child?.type?.npdeRole === 'control' || child?.props?.className === 'npde-controls');
  const rest = sequence.filter(child => !controls.includes(child));
  const visuals = rest.filter(child => child?.type?.npdeRole === 'core');
  const outputs = rest.filter(child => ['npde-result', 'npde-budget'].includes(child?.props?.className));
  return <div className="npde-investigation" data-live-exploration aria-label={title}>
    <p>{prompt}</p><div className="npde-live-core">{visuals.map(child => cloneElement(child, { coreOnly: true }))}{outputs}</div>
    <div className="npde-visible-controls">{controls}<button type="button" onClick={reset}>Reset</button></div>
    {visuals.map(child => cloneElement(child, { ledgerOnly: true }))}
    {rest.filter(child => !visuals.includes(child) && !outputs.includes(child))}
  </div>;
}

// These explicit roles survive production minification; function names do not.
for (const component of [Plot, Triangle, Mesh, Stencil]) component.npdeRole = 'core';
