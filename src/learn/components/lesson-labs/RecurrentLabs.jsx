import { CodeBlock } from '../content/Code.jsx';
import useLessonViewport from './useLessonViewport.js';
import { useEffect, useId, useRef, useState } from 'react';
import { NeuralTable, formatNeural as fmt } from './NeuralLessonElements.jsx';
import { pointStatistics } from '../../data/recurrent-models.js';
import './recurrent-labs.css';
import { FlowLab, FlowReadout } from './LessonFlow.jsx';

const assetBase = '/learn-assets/rnns-lstms-grus/';
const defaultPoints = [[.4, 1], [1, .94], [.4, .62], [-.1, .3], [-.4, -.02], [-.6, -.34], [-1, -.68], [-1, -1]];
const vector = values => '[' + values.map(value => fmt(value, 5)).join(', ') + ']';
const dataRequests = new Map();
function recurrentData(file) {
  if (!dataRequests.has(file)) {
    const request = fetch(assetBase + file).then(response => {
      if (!response.ok) throw new Error('Could not load lab data');
      return response.json();
    }).catch(error => { dataRequests.delete(file); throw error; });
    dataRequests.set(file, request);
  }
  return dataRequests.get(file);
}

export function useRecurrentData(file) {
  const ref = useRef(null), [visible, setVisible] = useState(false), [data, setData] = useState(null);
  const [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '300px' });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible || data) return;
    let active = true;
    setFailed(false);
    recurrentData(file).then(value => { if (active) setData(value); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [visible, file, attempt, data]);
  return { ref, data, fallback: failed ? <><p role="alert">The retained data could not load.</p><div className="recurrent-flow-actions"><button onClick={() => setAttempt(value => value + 1)}>Retry lab data</button></div></> : <p role="status">Loading this investigation’s retained data…</p> };
}

export function RecurrentProgram({ file = 'recurrent-mechanics.py', title = 'Read the complete scratch recurrent mechanism', start, end }) {
  const [container, ready] = useLessonViewport();
  const [code, setCode] = useState(null), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!ready) return undefined;
    const controller = new AbortController();
    setCode(null); setFailed(false);
    fetch(assetBase + file, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Source unavailable');
      return response.text();
    }).then(value => { if (!controller.signal.aborted) setCode(value); }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [ready, attempt, file]);
  const from = code && start ? code.indexOf(start) : 0;
  const to = code && end ? code.indexOf(end, from + 1) : code?.length;
  const excerpt = code && from >= 0 && to > from ? code.slice(from, to).trim() : null;
  return <section ref={container} className="lesson-teaching-section" data-lesson-teaching="code" aria-label={title}>
    {(start || end) && <p>This is a teaching excerpt from <a href={assetBase + file}>the complete runnable {file}</a>; the excerpt alone is not a standalone program.</p>}
    {excerpt ? <CodeBlock language="python" filename={start || end ? file.replace(/\.py$/, '-excerpt.py') : file}>{excerpt}</CodeBlock>
      : failed || code ? <><p role="alert">This source view is unavailable.</p><div className="recurrent-flow-actions"><button onClick={() => { setCode(null); setAttempt(value => value + 1); }}>Retry source</button></div></>
        : <p role="status">Loading source…</p>}
  </section>;
}

export function PointPath({ points, selected, onSelect, onMove, title = 'Numbered pen trajectory' }) {
  const arrow = useId().replaceAll(':', ''), svg = useRef(null), drag = useRef(null);
  const xy = point => [35 + (point[0] + 1) * 125, 275 - (point[1] + 1) * 125];
  const move = event => {
    if (drag.current === null || !onMove) return;
    const p = svg.current.createSVGPoint(); p.x = event.clientX; p.y = event.clientY;
    const local = p.matrixTransform(svg.current.getScreenCTM().inverse());
    const bounded = value => Math.max(-1, Math.min(1, value));
    onMove(drag.current.index, [bounded((local.x - drag.current.dx - 35) / 125 - 1), bounded((275 - local.y + drag.current.dy) / 125 - 1)]);
  };
  return <figure className="recurrent-path"><figcaption>{title}</figcaption><svg ref={svg} viewBox="0 0 330 315" role="img" aria-label={`${title}. Point numbers show order, not elapsed time. Exact coordinates follow.`} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
    <defs><marker id={arrow} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#939393" /></marker></defs>
    <path d="M35 25 V275 H285" fill="none" stroke="#666" />
    {points.slice(1).map((point, i) => <line key={i} x1={xy(points[i])[0]} y1={xy(points[i])[1]} x2={xy(point)[0]} y2={xy(point)[1]} stroke="#939393" strokeWidth="2" markerEnd={`url(#${arrow})`} />)}
    {points.map((point, i) => <g key={i}><circle cx={xy(point)[0]} cy={xy(point)[1]} r={i === selected ? 12 : 10} fill="#102329" stroke={i === selected ? '#eee' : '#89bfd0'} role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={onSelect ? `Select point ${i + 1}` : undefined} onKeyDown={event => { if (onSelect && ['Enter', ' '].includes(event.key)) { event.preventDefault(); onSelect(i); } }} onPointerDown={event => {
      if (!onMove) return;
      const p = svg.current.createSVGPoint(); p.x = event.clientX; p.y = event.clientY;
      const local = p.matrixTransform(svg.current.getScreenCTM().inverse());
      drag.current = { index: i, dx: local.x - xy(point)[0], dy: local.y - xy(point)[1] };
      onSelect(i); event.currentTarget.setPointerCapture(event.pointerId);
    }} /><text className="recurrent-point-label" style={{ fill: '#eee' }} x={xy(point)[0]} y={xy(point)[1] + 5} textAnchor="middle">{i + 1}</text></g>)}
    <text x="35" y="298">−1</text><text x="285" y="298" textAnchor="end">1 · x</text><text x="8" y="32">1</text><text x="4" y="270">−1</text>
  </svg><p>Normalized coordinates; positions are not timestamps.{onMove && ' Drag a point or use the point selector and numeric controls.'}</p></figure>;
}

export function PenRepresentationLab() {
  const [points, setPoints] = useState(defaultPoints);
  const statistics = pointStatistics(points);
  return <FlowLab id="pen-representation" label="Same points, different information">
    <div className="neural-two"><PointPath points={points} /><div><p><strong>Ordered input slots</strong></p><ol className="recurrent-slots">{points.map((point, i) => <li key={i}><b>Position {i + 1}</b><span>{vector(point)}</span></li>)}</ol></div></div>
    <div className="recurrent-flow-actions"><button onClick={() => setPoints([...points].reverse())}>Reverse positions</button><button onClick={() => setPoints(points.map((point, i) => i === 2 ? points[3] : i === 3 ? points[2] : point))}>Swap positions 3 and 4</button><button onClick={() => setPoints(defaultPoints)}>Reset representation</button></div>
    <FlowReadout>These are the eight coordinates of specimen pendigits.tes:6. Reordering changes the input slots and traversal arrows, while the orderless statistics below stay fixed.</FlowReadout>
    <NeuralTable caption="Orderless features discard these permutations" headers={['Axis', 'Mean', 'Std. deviation', 'Minimum', 'Maximum']} rows={statistics.map((row, i) => [i ? 'y' : 'x', ...Object.values(row).map(value => fmt(value))])} />
  </FlowLab>;
}

