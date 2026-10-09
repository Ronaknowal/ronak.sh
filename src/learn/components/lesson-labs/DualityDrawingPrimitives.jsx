import { useId, useLayoutEffect, useRef, useState } from 'react';
import { formatDualityNumber as number } from '../../data/duality-kkt-models.js';
export const C = {
  objective: '#97bfca',
  candidate: '#edc267',
  optimum: '#ded5bf',
  price: '#b8a6da',
  invalid: '#e6a1b0',
  neutral: '#a8a8a8',
  ink: '#eeeeee',
  selection: '#ffffff',
  witness: '#ded5bf',
  'witness-circle': '#ded5bf',
  'witness-square': '#ded5bf',
  changed: '#ded5bf'
};
export { number };
export const pointText = p => `(${p.map(number).join(', ')})`;
export function Figure({
  id,
  description,
  children
}) {
  return <figure className="duality-mechanism" data-mechanism={id} aria-label={description}>{children}<figcaption>{description}</figcaption></figure>;
}
export function Facts({
  rows
}) {
  return <dl className="duality-facts">{rows.map(([term, value, role], i) => <div key={i}><dt>{role && <span aria-hidden="true" className={'duality-key ' + role} style={{
          color: C[role]
        }} />}{term}</dt><dd>{value}</dd></div>)}</dl>;
}
export function Panels({
  children
}) {
  return <div className="duality-panels">{children}</div>;
}
export function Plot({
  domain = [-1, 6],
  range = domain,
  equal = false,
  xLabel = 'x',
  yLabel = 'y',
  description,
  children,
  ticks = true
}) {
  const ref = useRef(null), fontRef = useRef(null),
    [size, setSize] = useState({
      w: 500,
      font: 16
    });
  useLayoutEffect(() => {
    const node = ref.current;
    const update = () => {
      const w = node.getBoundingClientRect().width;
      const font = parseFloat(getComputedStyle(document.documentElement).fontSize);
      setSize(previous => Math.abs(previous.w - w) < .1 && Math.abs(previous.font - font) < .01 ? previous : { w, font });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    // A rem probe changes size even when the plot has a fixed pixel width.
    observer.observe(fontRef.current);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);
  const tick = n => n === 0 ? '0' : Math.abs(n) < .01 || Math.abs(n) >= 1000 ? n.toExponential(1) : String(Number(n.toPrecision(3)));
  const f = size.font,
    w = Math.max(220, size.w),
    left = Math.max(2.8 * f, Math.max(...range.map(n => tick(n).length)) * .48 * f + .8 * f),
    right = 1.4 * f,
    top = 1.5 * f,
    bottom = 2.7 * f;
  const plotW = w - left - right,
    plotH = equal ? plotW : yLabel === "" ? Math.max(6 * f, .28 * w) : Math.max(10 * f, Math.min(plotW, .63 * w)),
    h = plotH + top + bottom;
  const x = n => left + (n - domain[0]) / (domain[1] - domain[0]) * plotW,
    y = n => top + (range[1] - n) / (range[1] - range[0]) * plotH;
  const rawId = useId().replaceAll(':', ''),
    clip = 'clip' + rawId,
    arrow = 'arrow' + rawId,
    hatch = 'hatch' + rawId;
  const line = (a, b, color = C.neutral, extra = {}) => <line x1={x(a[0])} y1={y(a[1])} x2={x(b[0])} y2={y(b[1])} stroke={color} strokeWidth="2" {...extra} />;
  const curve = (fn, color = C.objective, extra = {}, lo = domain[0], hi = domain[1]) => {
    const points = Array.from({
      length: 161
    }, (_, i) => {
      const a = lo + (hi - lo) * i / 160;
      return [x(a), y(fn(a))];
    });
    return <path d={points.map((p, i) => (i ? 'L' : 'M') + p.join(',')).join(' ')} fill="none" stroke={color} strokeWidth="2.5" {...extra} />;
  };
  const mark = (p, role = 'candidate', label = '', extra = {}) => {
    const xx=x(p[0]),yy=y(p[1]),r=.25*f,color=C[role]||role;
    const leftLabel=role==='candidate'||role==='optimum',below=role==='candidate'||role==='price'||role==='changed';
    let shape;
    if(role==='selection')shape=<path d={`M${xx},${yy-r*2}l${r*2},${r*2}l${-r*2},${r*2}l${-r*2},${-r*2}Z`} fill="none" stroke={color} strokeWidth="2"/>;
    else if(role==='witness'||role==='witness-square')shape=<rect x={xx-r*1.5} y={yy-r*1.5} width={3*r} height={3*r} fill="none" stroke={color} strokeWidth="2"/>;
    else if(role==='candidate')shape=<rect x={xx-r} y={yy-r} width={2*r} height={2*r} fill={color}/>;
    else if(role==='price')shape=<path d={`M${xx},${yy-r*1.4}l${r*1.4},${r*1.4}l${-r*1.4},${r*1.4}l${-r*1.4},${-r*1.4}Z`} fill={color}/>;
    else if(role==='invalid')shape=<path d={`M${xx-r},${yy-r}l${2*r},${2*r}m0,${-2*r}l${-2*r},${2*r}`} stroke={color} strokeWidth="3"/>;
    else {const hollow=['optimum','witness-circle','changed'].includes(role);shape=<><circle cx={xx} cy={yy} r={hollow?r*1.6:r} stroke={color} strokeWidth="2" fill={hollow?'none':color}/>{role==='changed'&&<circle cx={xx} cy={yy} r={r*.55} fill={color}/>}</>;}
    const labelWidth=label.length*.55*f,preferredX=xx+(leftLabel?-.6:.6)*f,anchor=leftLabel?(preferredX-labelWidth<left?'start':'end'):(preferredX+labelWidth>left+plotW?'end':'start');
    const labelX=anchor==='end'?Math.max(left+labelWidth,Math.min(left+plotW-.2*f,xx-.6*f)):Math.max(left+.2*f,Math.min(left+plotW-labelWidth,xx+.6*f)),labelY=Math.max(top+.9*f,Math.min(top+plotH-.1*f,yy+(below?1:-.5)*f));
    return <g {...extra}>{shape}{label&&<text x={labelX} y={labelY} textAnchor={anchor} fill={color}>{label}</text>}</g>;
  };
  const vector = (a, b, color = C.objective, dashed = false) => line(a, b, color, {
    markerEnd: `url(#${arrow})`,
    strokeDasharray: dashed ? '6 4' : undefined
  });
  const polygon = (points, fill = `url(#${hatch})`, extra = {}) => <polygon points={points.map(p => [x(p[0]), y(p[1])].join(',')).join(' ')} fill={fill} {...extra} />;
  const circle = (centre, radius, color = C.objective, extra = {}) => <ellipse cx={x(centre[0])} cy={y(centre[1])} rx={radius * plotW / (domain[1] - domain[0])} ry={radius * plotH / (range[1] - range[0])} fill="none" stroke={color} strokeOpacity=".6" {...extra} />;
  const xticks = [domain[0], ...(domain[0] < 0 && domain[1] > 0 && Math.min(x(0) - x(domain[0]), x(domain[1]) - x(0)) > 2 * f ? [0] : []), domain[1]],
    yticks = [range[0], ...(range[0] < 0 && range[1] > 0 && Math.min(y(range[0]) - y(0), y(0) - y(range[1])) > 1.4 * f ? [0] : []), range[1]];
  return <div ref={ref} className="duality-plot"><span ref={fontRef} aria-hidden="true" style={{ position: 'absolute', width: '1rem', height: 0, visibility: 'hidden', pointerEvents: 'none' }} /><svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={description || `${yLabel || 'quantity'} against ${xLabel}`} style={{
      fontSize: Math.max(14, f * .875)
    }}><defs><clipPath id={clip}><rect x={left-.45*f} y={top-.45*f} width={plotW+.9*f} height={plotH+.9*f} /></clipPath><marker id={arrow} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="context-stroke" /></marker><pattern id={hatch} width="9" height="9" patternUnits="userSpaceOnUse"><path d="M-1 1L1 -1M0 9L9 0M8 10L10 8" stroke="#888" strokeOpacity=".32" /></pattern></defs><g className="duality-axes"><path d={yLabel === "" ? `M${left} ${top+plotH}H${left+plotW}` : `M${left} ${top}V${top + plotH}H${left + plotW}`} fill="none" stroke="#777" />{domain[0] < 0 && domain[1] > 0 && line([0, range[0]], [0, range[1]], '#444')}{range[0] < 0 && range[1] > 0 && line([domain[0], 0], [domain[1], 0], '#444')}{ticks && xticks.map((n, i) => <text key={'x' + i} x={x(n)} y={top + plotH + 1.2 * f} textAnchor="middle">{tick(n)}</text>)}{ticks && yLabel !== "" && yticks.map((n, i) => <text key={'y' + i} x={left - .5 * f} y={y(n) + .3 * f} textAnchor="end">{tick(n)}</text>)}<text x={left + plotW / 2} y={h - .15 * f} textAnchor="middle">{xLabel}</text><text x={left} y={.9 * f}>{yLabel}</text></g><g clipPath={`url(#${clip})`}>{children({
          x,
          y,
          line,
          curve,
          mark,
          vector,
          polygon,
          circle,
          f,
          domain,
          range
        })}</g></svg></div>;
}
export function HalfPlane({
  budget = 5,
  normal = [1, 1],
  target = [3, 4],
  candidate,
  foot,
  centre,
  centreLabel = 'zλ',
  comparison,
  contours = false,
  arrows = false,
  extra,
  domain,
  description = 'Coordinate plane with a feasible half-plane and its boundary.'
}) {
  const points = [target, candidate, foot, centre, comparison].filter(Boolean),
    lo = domain?.[0] ?? Math.min(-1, ...points.flat().map(v => Math.floor(v) - 1)),
    hi = domain?.[1] ?? Math.max(6, ...points.flat().map(v => Math.ceil(v) + 1));
  const radius=foot?Math.hypot(foot[0]-target[0],foot[1]-target[1]):0;
  const contourRadii=radius>0?[radius*.5,radius,radius*1.6]:[.6,1.4,2.2];
  const boundary = a => (budget - normal[0] * a) / normal[1];
  return <Plot domain={[lo, hi]} equal description={description}>{p => <>{p.polygon([[lo, lo], [hi, lo], [hi, boundary(hi)], [lo, boundary(lo)]])}{p.line([lo, boundary(lo)], [hi, boundary(hi)], C.neutral)}{contours && contourRadii.map(r => <g key={r}>{p.circle(target, r)}</g>)}{foot && p.line(target, foot, C.objective, {
        strokeDasharray: '5 4'
      })}{target && p.mark(target, 'objective', 't')}{candidate && p.mark(candidate, 'candidate', 'z')}{foot && p.mark(foot, 'optimum', pointText(foot) === pointText(target) ? '' : 'z*')}{centre && p.mark(centre, 'price', centreLabel)}{comparison && p.mark(comparison,'changed','new')}{arrows && foot && <>{p.vector(foot, [foot[0] + normal[0], foot[1] + normal[1]], C.price, true)}{p.vector(foot, [foot[0] - normal[1], foot[1] + normal[0]], C.neutral)}</>}{extra?.(p)}</>}</Plot>;
}
export function CostAxis({
  items,
  domain,
  label = 'cost'
}) {
  const values = items.map(r => r.value),
    lo = domain?.[0] ?? Math.min(0, ...values) - .5,
    hi = domain?.[1] ?? Math.max(2, ...values) + .5;
  return <div><Plot domain={[lo, hi]} range={[-.5, Math.max(1, items.length)]} xLabel={label} yLabel="" ticks>{p => <>{items.map((r, i) => <g key={i}>{p.line([lo, i], [r.value, i], C.neutral, {
            strokeDasharray: '3 5'
          })}{p.mark([r.value, i], r.role || 'candidate',number(r.value))}</g>)}</>}</Plot><Facts rows={items.map(r => [r.label, number(r.value), r.role])} /></div>;
}
export function Numeric({
  label,
  value,
  min,
  max,
  onChange,
  error
}) {
  const id = useId();
  return <label htmlFor={id}>{label}<input id={id} type="number" step="any" min={min} max={max} value={value} onChange={e => onChange(e.target.value)} aria-invalid={!!error} /></label>;
}
export function useInputs(initial, limits) {
  const [state, setState] = useState(initial),
    [draft, setDraft] = useState(Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, String(v)]))),
    [errors, setErrors] = useState({});
  const edit = (k, text) => {
    setDraft(s => ({
      ...s,
      [k]: text
    }));
    const n = Number(text),
      [lo, hi] = limits[k];
    if (text.trim() === '' || !Number.isFinite(n) || n < lo || n > hi) {
      setErrors(s => ({
        ...s,
        [k]: `Enter a finite value from ${lo} to ${hi}. The diagram keeps the last valid values.`
      }));
      return;
    }
    setErrors(s => ({
      ...s,
      [k]: null
    }));
    setState(s => ({
      ...s,
      [k]: n
    }));
  };
  const setAll = values => {
    setState(values);
    setDraft(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v)])));
    setErrors({});
  };
  return {
    state,
    draft,
    errors,
    edit,
    setAll,
    reset: () => setAll(initial)
  };
}
export function Controls({
  input,
  labels,
  limits,
  children
}) {
  return <div className="duality-controls">{Object.keys(labels).map(k => <Numeric key={k} label={labels[k]} value={input.draft[k]} min={limits[k][0]} max={limits[k][1]} onChange={s => input.edit(k, s)} error={input.errors[k]} />)}<div className="duality-actions">{children}<button type="button" onClick={input.reset}>Reset</button></div>{Object.entries(input.errors).filter(([, e]) => e).map(([k, e]) => <p role="alert" key={k}>{labels[k]}: {e}</p>)}</div>;
}
