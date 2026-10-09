import { useId, useLayoutEffect, useRef, useState } from 'react';
import { C, Plot, Equation, Table, number } from './NonconvexDrawingPrimitives.jsx';
import { linspace, stationaryValue, networkState } from '../../data/nonconvex-reading-models.js';
export function useCanvas() {
  const ref = useRef(null),
    probe = useRef(null),
    [size, setSize] = useState({
      width: 500,
      font: 16
    });
  useLayoutEffect(() => {
    const update = () => {
      const width = ref.current.getBoundingClientRect().width,
        font = parseFloat(getComputedStyle(document.documentElement).fontSize);
      setSize(old => Math.abs(old.width - width) < .1 && old.font === font ? old : {
        width,
        font
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(ref.current);
    ro.observe(probe.current);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);
  return {
    ref,
    probe,
    ...size
  };
}
export function Canvas({
  label,
  height = 18,
  children
}) {
  const {
      ref,
      probe,
      width,
      font
    } = useCanvas(),
    id = useId().replaceAll(':', ''),
    h = height * font;
  return <div className="nc-structure" ref={ref}><span ref={probe} style={{
      position: 'absolute',
      width: '1rem',
      height: 0,
      visibility: 'hidden'
    }} aria-hidden="true" /><svg width="100%" height={h} viewBox={`0 0 ${width} ${h}`} role="img" aria-label={label} style={{
      fontSize: font
    }}><defs><marker id={'nc-tip' + id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="context-stroke" /></marker></defs>{children({
        w: width,
        h,
        f: font,
        tip: 'url(#nc-tip' + id + ')'
      })}</svg></div>;
}
export function Surface({
  fn,
  extent = .8,
  range = [-1.28, 1.28],
  label = 'Objective height',
  selected = []
}) {
  const n = 16,
    grid = linspace(-extent, extent, n + 1),
    faces = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const points = [[grid[i], grid[j]], [grid[i + 1], grid[j]], [grid[i + 1], grid[j + 1]], [grid[i], grid[j + 1]]].map(([x, y]) => [x, y, fn(x, y)]);
    faces.push({
      points,
      depth: grid[i] + grid[j],
      height: points.reduce((a, p) => a + p[2], 0) / 4
    });
  }
  faces.sort((a, b) => b.depth - a.depth);
  return <><Canvas label={label + '; actual sampled surface with x and y parameter axes and objective height'} height={22}>{({
        w,
        h,
        f,
        tip
      }) => {
        const xy = Math.max(35, Math.min((w - 5 * f) / 4, 5 * f)),
          z = (h - 6 * f - 1.4 * xy) / (range[1] - range[0]),
          cx = w / 2,
          cy = h / 2;
        const project = ([x, y, height]) => [cx + (x - y) / extent * xy, cy + (x + y) / extent * .35 * xy - (height - (range[0] + range[1]) / 2) * z];
        const poly = p => p.map(point => project(point).join(',')).join(' '),
          line = (a, b, stroke, props = {}) => {
            const aa = project(a),
              bb = project(b);
            return <line x1={aa[0]} y1={aa[1]} x2={bb[0]} y2={bb[1]} stroke={stroke} {...props} />;
          };
        const axes = [{
          p: [extent, 0, 0],
          name: 'x',
          colour: C.x
        }, {
          p: [0, extent, 0],
          name: 'y',
          colour: C.y
        }, {
          p: [0, 0, range[1]],
          name: 'F',
          colour: C.reference
        }];
        return <><polygon points={poly([[-extent, -extent, 0], [extent, -extent, 0], [extent, extent, 0], [-extent, extent, 0]])} fill="#555" fillOpacity=".08" stroke="#777" strokeDasharray="4 4" />{faces.map((face, i) => <polygon key={i} points={poly(face.points)} fill={`rgb(${Math.round(50 + 70 * (face.height - range[0]) / (range[1] - range[0]))},${Math.round(48 + 62 * (face.height - range[0]) / (range[1] - range[0]))},${Math.round(43 + 48 * (face.height - range[0]) / (range[1] - range[0]))})`} fillOpacity=".85" stroke="#aaa" strokeOpacity=".35" strokeWidth=".6" />)}{axes.map(({
            p,
            name,
            colour
          }) => {
            const [x, y] = project(p);
            return <g key={name}>{line([0, 0, 0], p, colour, {
                strokeWidth: 2,
                markerEnd: tip
              })}<text x={Math.max(f, Math.min(w - f, x))} y={Math.max(f, y - f * .4)} textAnchor="middle" fill={colour}>{name}</text></g>;
          })}{selected.map(({
            point,
            label,
            role = 'a'
          }, i) => {
            const p = [...point, fn(...point)],
              [x, y] = project(p);
            return <g key={i}>{line([...point, 0], p, C[role], {
                strokeDasharray: '3 3'
              })}<circle cx={x} cy={y} r={.25 * f} fill={C[role]} stroke="white" /><line x1={x} y1={y - .3 * f} x2={x + (i % 2 ? -2 : 2) * f} y2={y - (.9 + i % 2) * f} stroke={C[role]} /><text x={x + (i % 2 ? -2 : 2) * f} y={y - (1.2 + i % 2) * f} textAnchor="middle" fill={C[role]}>{label}</text></g>;
          })}</>;
      }}</Canvas><p className="nc-surface-caption">The dashed plane marks objective height 0. {label}. Parameters x,y ∈ [−{extent},{extent}]; objective height scale [{range.map(n => number(n)).join(', ')}]. Neutral face brightness follows height; mesh values come from the formula.</p></>;
}
export function contourSegments(fn, extent, levels, n = 36) {
  const grid = linspace(-extent, extent, n + 1),
    segments = [];
  for (const level of levels) for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const corners = [[grid[i], grid[j]], [grid[i + 1], grid[j]], [grid[i + 1], grid[j + 1]], [grid[i], grid[j + 1]]],
      crossings = [];
    for (let edge = 0; edge < 4; edge++) {
      const a = corners[edge],
        b = corners[(edge + 1) % 4],
        va = fn(...a) - level,
        vb = fn(...b) - level;
      if (va < 0 && vb >= 0 || va >= 0 && vb < 0) {
        const t = va / (va - vb);
        crossings.push(a.map((v, k) => v + t * (b[k] - v)));
      }
    }
    for (let k = 0; k + 1 < crossings.length; k += 2) segments.push({
      a: crossings[k],
      b: crossings[k + 1],
      level
    });
  }
  return segments;
}
export function Contours({
  fn,
  extent = .8,
  levels = [-1, -.5, 0, .5, 1],
  children
}) {
  const segments = contourSegments(fn, extent, levels);
  return <Plot domain={[-extent, extent]} range={[-extent, extent]} xLabel="parameter x" yLabel="parameter y" equal description={'Equal-objective contours at levels ' + levels.join(', ')}>{plot => <>{segments.map((s, i) => plot.line(s.a, s.b, s.level === 0 ? C.reference : '#777', {
        key: i,
        strokeWidth: s.level === 0 ? 2 : 1,
        strokeDasharray: s.level < 0 ? '4 3' : undefined
      }))}{children?.(plot)}</>}</Plot>;
}
export function GeometryFamily({
  kind,
  extent = .8,
  range = [-1.28, 1.28]
}) {
  const fn = (x, y) => stationaryValue(kind, x, y),
    levels = kind === 'flatMinimum' ? [.002, .02, .1, .2] : kind === 'flatSaddle' ? [-.1, -.02, 0, .02, .1] : [-1, -.5, 0, .5, 1];
  return <><Surface fn={fn} extent={extent} range={range} label={kind} /><Contours fn={fn} extent={extent} levels={levels} /><Plot domain={[-extent, extent]} range={range} xLabel="distance t along a unit axis" yLabel="objective change">{p => <>{p.curve(t => fn(t, 0), C.x)}{p.curve(t => fn(0, t), C.y, -extent, extent, {
          strokeDasharray: '6 4'
        })}{p.mark([.2, fn(.2, 0)], 'x')}{p.mark([.2, fn(0, .2)], 'y')}</>}</Plot><Equation>Cyan square: x restriction; amber triangle/dashed: y restriction. Contours show levels {levels.join(', ')} where present; negative levels are dashed.</Equation></>;
}
export function Matrix({
  rows,
  columns,
  label
}) {
  return <div className="nc-scroll-matrix" role="region" tabIndex={0} aria-label={label + '; scroll horizontally if needed'}><p>{label}</p><div className="nc-matrix" style={{
      gridTemplateColumns: `repeat(${rows[0].length},auto)`
    }}>{rows.flatMap((row, i) => row.map((value, j) => <span key={i + '-' + j} style={{
        color: columns?.[j]
      }}>{value}</span>))}</div></div>;
}
// A vertical multiplication graph fits the complete causal path at phone widths.
export function OperationGraph({
  stages,
  label
}) {
  return <Canvas label={label} height={stages.length * 5.2}>{({
      w,
      f,
      tip
    }) => <>{stages.map((s, i) => {
        const y = (i * 5.2 + 2) * f;
        return <g key={i}>{i > 0 && <line x1={w / 2} y1={y - 3.2 * f} x2={w / 2} y2={y - .65 * f} stroke={s.colour || C.reference} strokeWidth="2" markerEnd={tip} />}{s.shape === 'square' ? <rect x={w / 2 - .6 * f} y={y - .6 * f} width={1.2 * f} height={1.2 * f} fill={s.active ? s.colour : '#151515'} stroke={s.colour || C.reference} strokeWidth="2" /> : <circle cx={w / 2} cy={y} r={.6 * f} fill={s.active ? s.colour : '#151515'} stroke={s.colour || C.reference} strokeWidth="2" />}<text x={w / 2} y={y + .3 * f} textAnchor="middle" fill={s.active ? '#151515' : s.colour || C.reference}>{s.symbol}</text><text x={w / 2} y={y + 1.6 * f} textAnchor="middle" fill={s.colour || C.reference}>{s.value}</text>{s.bias && <><line x1={w - f} y1={y} x2={w / 2 + .7 * f} y2={y} stroke={s.colour || C.reference} markerEnd={tip} /><text x={w - f} y={y - .6 * f} textAnchor="end" fill={s.colour || C.reference}>{s.bias}</text></>}{s.parameter && <><line x1={f} y1={y} x2={w / 2 - .7 * f} y2={y} stroke={s.colour || C.reference} markerEnd={tip} /><text x={f} y={y - .6 * f} fill={s.colour || C.reference}>{s.parameter}</text></>}</g>;
      })}</>}</Canvas>;
}
export function UnitNetwork({
  state = networkState(),
  name = 'Current network'
}) {
  return <div className="nc-network" aria-label={name}><p>{name}. Input u={number(state.input)}; filled unit nodes mean active, open nodes mean inactive or the explicitly labelled kink.</p><Canvas label={name + ': shared input splits through two complete hidden-unit branches, then contributions join the output sum'} height={30}>{({
        w,
        f,
        tip
      }) => {
        const text = (x, y, value, colour = C.reference) => <text x={x} y={y * f} textAnchor="middle" fill={colour}>{value}</text>;
        const edge = (x1, y1, x2, y2, c = C.reference) => <line x1={x1} y1={y1 * f} x2={x2} y2={y2 * f} stroke={c} strokeWidth="2" markerEnd={tip} />;
        return <>{text(w / 2, 4, 'u = ' + number(state.input))}<circle cx={w / 2} cy={5 * f} r={.35 * f} fill={C.reference} />{state.units.map((u, i) => {
            const x = w * (i === 0 ? .25 : .75),
              c = u.id === 1 ? C.a : C.c,
              outside = x + (i === 0 ? -1 : 1) * 2.4 * f;
            const node = (y, symbol) => {
              const props = {
                fill: u.state === 'active' ? c : '#111',
                stroke: c,
                strokeWidth: 2
              };
              return <g>{u.id === 1 ? <circle cx={x} cy={y * f} r={.65 * f} {...props} /> : <rect x={x - .65 * f} y={(y - .65) * f} width={1.3 * f} height={1.3 * f} {...props} />}<text x={x} y={(y + .32) * f} textAnchor="middle" fill={u.state === 'active' ? '#111' : c}>{symbol}</text></g>;
            };
            return <g key={u.id}>{text(x, 1, 'unit ' + u.id, c)}{text(x, 2.4, 'w=' + number(u.w), c)}{edge(w / 2, 5.4, x, 8.25, c)}{node(9, '+')}{edge(outside, 9, x + (i === 0 ? -1 : 1) * .75 * f, 9, c)}{text(outside, 8.3, 'b=' + number(u.b), c)}{text(x, 10.8, 'z=' + number(u.z), c)}{edge(x, 11.5, x, 13.25, c)}{node(14, 'R')}{text(x, 15.8, 'h=' + number(u.h), c)}{text(x, 17, u.state, c)}{edge(x, 17.5, x, 19.25, c)}{node(20, '×')}{edge(outside, 20, x + (i === 0 ? -1 : 1) * .75 * f, 20, c)}{text(outside, 19.3, 'v=' + number(u.v), c)}{text(x, 22, number(u.contribution), c)}{edge(x, 22.7, w / 2, 25.25, c)}</g>;
          })}<circle cx={w / 2} cy={26 * f} r={.65 * f} fill="#111" stroke={C.reference} />{text(w / 2, 26.32, 'Σ')}{text(w / 2, 28, 'output ' + number(state.output))}</>;
      }}</Canvas><Table caption="Complete unit bundles; identity travels when positions swap" headers={['unit', 'incoming w', 'bias b', 'outgoing v', 'z', 'ReLU(z)', 'contribution']} rows={state.units.map(u => [u.id, ...[u.w, u.b, u.v, u.z, u.h, u.contribution].map(v => number(v))])} /></div>;
}
