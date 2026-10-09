import { useId, useLayoutEffect, useRef, useState } from 'react';
export const C = {
  a: '#97bfca',
  b: '#edc267',
  c: '#b8a6da',
  reference: '#ded5bf',
  invalid: '#e6a1b0',
  neutral: '#aaa',
  selection: '#fff'
};
export const number = (value, precision = 8) => !Number.isFinite(value) ? 'unavailable' : value === 0 ? '0' : Math.abs(value) < 1e-5 || Math.abs(value) >= 1e7 ? value.toExponential(5) : String(Number(value.toPrecision(precision)));
export function Figure({
  id,
  caption,
  children
}) {
  return <figure className="nm-mechanism" data-mechanism={id}>{children}<figcaption>{caption}</figcaption></figure>;
}
export function Panels({
  children
}) {
  return <div className="nm-panels">{children}</div>;
}
export function Facts({
  rows
}) {
  return <dl className="nm-facts">{rows.map(([label, value, role], i) => <div key={i}><dt>{role && <i className={'nm-key ' + role} style={{
          color: C[role]
        }} />}{label}</dt><dd>{value}</dd></div>)}</dl>;
}
export function Table({
  headers,
  rows,
  caption
}) {
  const ref = useRef(null),
    [overflow, setOverflow] = useState(false);
  useLayoutEffect(() => {
    const node = ref.current;
    const update = () => setOverflow(node.scrollWidth > node.clientWidth + 1);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    observer.observe(node.firstElementChild);
    return () => observer.disconnect();
  }, [rows, headers]);
  return <div className="nm-table"><p className="nm-table-caption">{caption}</p>{overflow && <p className="nm-scroll-cue">Scroll the table horizontally to read all columns; keyboard: focus it and use the arrow keys.</p>}<div ref={ref} className="nm-table-scroll" role="region" aria-label={caption + '; scroll horizontally when needed'} tabIndex={0}><table aria-label={caption}><thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{v}</td>)}</tr>)}</tbody></table></div></div>;
}
export function Plot({
  domain = [0, 1],
  range = [0, 1],
  xLabel = 'x',
  yLabel = 'f(x)',
  description,
  equal = false,
  children
}) {
  const ref = useRef(null),
    fontRef = useRef(null),
    [size, setSize] = useState({
      width: 500,
      font: 16
    });
  const uid = useId().replaceAll(':', '');
  useLayoutEffect(() => {
    const update = () => {
      const width = ref.current.getBoundingClientRect().width;
      const font = parseFloat(getComputedStyle(document.documentElement).fontSize);
      setSize(old => Math.abs(old.width - width) < .1 && Math.abs(old.font - font) < .01 ? old : {
        width,
        font
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(ref.current);
    observer.observe(fontRef.current);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);
  const f = size.font,
    w = Math.max(200, size.width),
    left = 3.7 * f,
    right = 1.3 * f,
    top = 2 * f,
    bottom = 3.3 * f;
  const plotWidth = Math.max(80, w - left - right);
  const plotHeight = equal ? plotWidth * (range[1] - range[0]) / (domain[1] - domain[0]) : Math.max(8 * f, Math.min(13 * f, .55 * w));
  const height = top + plotHeight + bottom;
  const x = value => left + (value - domain[0]) / (domain[1] - domain[0]) * plotWidth;
  const y = value => top + (range[1] - value) / (range[1] - range[0]) * plotHeight;
  const line = (a, b, color = C.neutral, props = {}) => <line x1={x(a[0])} y1={y(a[1])} x2={x(b[0])} y2={y(b[1])} stroke={color} strokeWidth="2" {...props} />;
  const path = (points, color = C.reference, props = {}) => <path d={points.map((p, i) => `${i ? 'L' : 'M'}${x(p[0])},${y(p[1])}`).join(' ')} fill="none" stroke={color} strokeWidth="2.5" {...props} />;
  const curve = (fn, color = C.reference, lo = domain[0], hi = domain[1], props = {}) => path(Array.from({
    length: 181
  }, (_, i) => {
    const xx = lo + (hi - lo) * i / 180;
    return [xx, fn(xx)];
  }), color, props);
  const polygon = (points, color = C.a, props = {}) => <polygon points={points.map(p => `${x(p[0])},${y(p[1])}`).join(' ')} fill={color} fillOpacity=".22" {...props} />;
  const area = (fn, lo, hi, color = C.a, baseline = 0) => polygon([[lo, baseline], ...Array.from({
    length: 81
  }, (_, i) => {
    const xx = lo + (hi - lo) * i / 80;
    return [xx, fn(xx)];
  }), [hi, baseline]], color);
  const mark = (point, role = 'a', label = '', selected = false) => {
    const xx = x(point[0]),
      yy = y(point[1]),
      r = .25 * f,
      color = C[role] || role;
    return <g>{role === 'b' ? <rect x={xx - r} y={yy - r} width={2 * r} height={2 * r} fill={color} /> : role === 'c' ? <path d={`M${xx} ${yy - r * 1.4}l${r * 1.4} ${r * 1.4}l${-r * 1.4} ${r * 1.4}l${-r * 1.4} ${-r * 1.4}Z`} fill={color} /> : role === 'invalid' ? <path d={`M${xx - r} ${yy - r}l${2 * r} ${2 * r}m0 ${-2 * r}l${-2 * r} ${2 * r}`} fill="none" stroke={color} strokeWidth="2.5" /> : <circle cx={xx} cy={yy} r={r} fill={role === 'reference' ? '#0d0d0d' : color} stroke={color} strokeWidth="2" />}{selected && <circle cx={xx} cy={yy} r={r * 2} fill="none" stroke={C.selection} strokeWidth="2" />}{label && <text x={xx} y={Math.max(top + .8 * f, yy - .6 * f)} textAnchor={xx < left + 2 * f ? "start" : xx > left + plotWidth - 2 * f ? "end" : "middle"} fill={color}>{label}</text>}</g>;
  };
  const arrow = (a, b, color = C.neutral) => line(a, b, color, {
    markerEnd: `url(#nm-arrow-${uid})`
  });
  const ticks = values => {
    const span = Math.abs(values[1] - values[0]);
    const digits = Math.min(14, Math.max(3, Math.ceil(-Math.log10(span)) + 3));
    return values.map(v => Math.abs(v) >= 1e4 || v !== 0 && Math.abs(v) < .001 ? v.toExponential(2) : String(Number(v.toPrecision(digits))));
  };
  return <div ref={ref} className="nm-plot"><span ref={fontRef} aria-hidden="true" style={{
      position: 'absolute',
      width: '1rem',
      height: 0,
      visibility: 'hidden'
    }} /><svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} role="img" aria-label={description || `${yLabel} against ${xLabel}`} style={{
      fontSize: .875 * f
    }}><defs><clipPath id={'nm-clip-' + uid}><rect x={left - .5 * f} y={top - .5 * f} width={plotWidth + f} height={plotHeight + f} /></clipPath><marker id={'nm-arrow-' + uid} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="context-stroke" /></marker><pattern id={'nm-hatch-' + uid} width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 8L8 0" stroke={C.invalid} strokeWidth="1" /></pattern></defs><path d={`M${left} ${top}V${top + plotHeight}H${left + plotWidth}`} stroke="#666" fill="none" />{range[0] < 0 && range[1] > 0 && line([domain[0], 0], [domain[1], 0], '#555')}{domain.map((v, i) => <text key={i} x={x(v)} y={top + plotHeight + 1.25 * f} textAnchor={i === 0 ? "start" : "end"}>{ticks(domain)[i]}</text>)}{range.map((v, i) => <text key={i} x={left - .4 * f} y={y(v) + .3 * f} textAnchor="end">{ticks(range)[i]}</text>)}<text x={left} y={f}>{yLabel}</text><text x={left + plotWidth / 2} y={height - .6 * f} textAnchor="middle">{xLabel}</text><g clipPath={`url(#nm-clip-${uid})`}>{children({
          x,
          y,
          f,
          line,
          path,
          curve,
          polygon,
          area,
          mark,
          arrow,
          hatch: `url(#nm-hatch-${uid})`
        })}</g></svg></div>;
}
export function Equation({
  children
}) {
  return <p className="nm-operation">{children}</p>;
}
export function Weighted({
  nodes,
  divisor = 1,
  label = 'Signed weighted contributions',
  available = true,
  unavailableReason = 'Distinct sample coordinates are required'
}) {
  const products = nodes.map(n => n.value * n.weight),
    bound = Math.max(1e-15, ...products.map(Math.abs));
  return <><div className="nm-contributions">{nodes.map((n, i) => <div key={i}><span className={'nm-key ' + (n.role || 'neutral')} style={{
          color: C[n.role] || C.neutral
        }} />{n.label ?? `sample ${i}`}: {number(n.weight)} × {number(n.value)}<div className="nm-signed-track"><i style={{
            left: products[i] < 0 ? `${50 + 50 * products[i] / bound}%` : '50%',
            width: `${50 * Math.abs(products[i]) / bound}%`,
            background: C[n.role] || C.neutral
          }} /></div><span>{number(products[i])}</span></div>)}</div><Equation>{label}: ({products.map(value => number(value)).join(' + ')}){available ? <> / {number(divisor)} = {number(products.reduce((a, b) => a + b, 0) / divisor)}.</> : <> = stored numerator {number(products.reduce((a, b) => a + b, 0))}. Division not performed: {unavailableReason}. No derivative value is assigned.</>} Signed bars share range ±{number(bound)}.</Equation></>;
}
