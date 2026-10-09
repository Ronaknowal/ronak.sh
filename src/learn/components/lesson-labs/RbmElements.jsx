import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import { useEffect, useRef, useState } from 'react';
import { NeuralTable, formatNeural as f } from './NeuralLessonElements.jsx';
import { FlowControls } from './LessonFlow.jsx';
export const rbmAssetBase = '/learn-code/boltzmann-machines-restricted-boltzmann-machines-rbm/';
export const stateName = v => v.join('');
export const vector = v => '[' + v.map(x => f(x, 5)).join(', ') + ']';
export function RbmFigure({
  title,
  description,
  width = 420,
  height,
  children
}) {
  return <figure className="rbm-figure" aria-label={title}><svg
    style={{ width: '100%', height: 'auto', maxWidth: width }}
    viewBox={'0 0 ' + width + ' ' + height} role="img" aria-label={description || title}>{children}</svg>
    {description && <figcaption>{description}</figcaption>}</figure>;
}
export function ProbabilityBars({
  title,
  rows,
  baselineLabel = 'the original model'
}) {
  return <figure className="rbm-probabilities"><figcaption>{title}</figcaption>{rows.map(({
      label,
      current,
      baseline
    }) => <div className="rbm-probability-row" key={label}><span>{label}</span><div className="rbm-probability-track"><i style={{
          width: current * 100 + '%'
        }} />{baseline !== undefined && <b style={{
          left: baseline * 100 + '%'
        }} />}</div><strong>{f(current, 6)}</strong></div>)}<p>Scale 0–1; violet length is probability. {rows.some(row => row.baseline !== undefined) && <>White marker: {baselineLabel}.</>}</p></figure>;
}
export function PixelTile({
  title,
  values,
  mask = null,
  selected = -1,
  onSelect = null,
  signed = false,
  extent = 1
}) {
  return <figure className="rbm-pixel-figure"><figcaption>{title}</figcaption><div className={'rbm-pixels ' + (onSelect ? 'rbm-pixels-interactive' : '')} role={onSelect ? 'group' : undefined} aria-label={title}>{values.map((value, i) => {
        const shade = signed ? Math.min(1, Math.abs(value) / extent) : value;
        const background = signed ? value < 0 ? 'rgba(155,187,224,' + shade + ')' : 'rgba(230,184,84,' + shade + ')' : 'rgb(' + [1, 2, 3].map(() => Math.round(25 + 230 * shade)).join(',') + ')';
        const label = 'Pixel ' + i + ', row ' + Math.floor(i / 8) + ', column ' + i % 8 + ': ' + f(value, 6) + (mask && !mask[i] ? ', missing' : '');
        const props = {
          style: {
            background, '--rbm-pixel-paint': background
          },
          className: (mask && !mask[i] ? 'rbm-missing ' : '') + (i === selected ? 'rbm-selected' : ''),
          'aria-label': label,
          title: label
        };
        return onSelect ? <button key={i} {...props} onClick={() => onSelect(i)} aria-pressed={i === selected} /> : <span key={i} {...props} />;
      })}</div>{mask && <small>Hatching marks missing evidence, independently of pixel value.</small>}</figure>;
}
export function useRbmAsset(file) {
  const host = useRef(null),
    [visible, setVisible] = useState(false),
    [attempt, setAttempt] = useState(0),
    [state, setState] = useState({
      file: null,
      data: null,
      error: null
    });
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, {
      rootMargin: '200px'
    });
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return;
    const control = new AbortController();
    setState({
      file,
      data: null,
      error: null
    });
    fetch(rbmAssetBase + file, {
      signal: control.signal
    }).then(r => {
      if (!r.ok) throw Error('download');
      return r.json();
    }).then(data => {
      if (!control.signal.aborted) setState({
        file,
        data,
        error: null
      });
    }).catch(() => {
      if (!control.signal.aborted) setState({
        file,
        data: null,
        error: 'This saved RBM asset could not be loaded. Retry to request it again.'
      });
    });
    return () => control.abort();
  }, [file, visible, attempt]);
  return {
    host,
    data: state.file === file ? state.data : null,
    error: state.file === file ? state.error : null,
    retry: () => setAttempt(n => n + 1)
  };
}
export function RbmResource({
  resource,
  children
}) {
  return <div ref={resource.host}>{resource.error ? <div role="alert"><p>{resource.error}</p><FlowControls><button type="button" onClick={resource.retry}>Retry model download</button></FlowControls></div> : resource.data ? children(resource.data) : <p role="status">Loading this saved RBM asset…</p>}</div>;
}
export function SwitchGraph({
  model,
  visible,
  hidden,
  general = false
}) {
  const positions = [[65, 170], [215, 170]];
  return <RbmFigure title={general ? 'General BM: direct visible interaction' : 'RBM: one hidden and two visible switches'} width={280} height={232}
    description={general ? 'Cyan circles: two binary visible values. The undirected amber wire is an interaction, counted once; it is neither a forward computation nor a causal arrow.' : 'Cyan circles: observed binary variables. Violet circle: an unobserved binary random variable. Amber wires: learned interactions. No within-layer wire. A question mark means its value has not been sampled.'}>
    {general ? <><line x1="90" y1="170" x2="190" y2="170" stroke="#e6b854" strokeWidth="2" /><text x="140" y="137" textAnchor="middle">J = {f(model.w[0][0], 3)}</text></> : positions.map(([x, y], i) => <g key={i}>
      <line x1="140" y1="70" x2={x} y2={y - 25} stroke="#e6b854" strokeWidth="2" />
      <text x={i ? 224 : 56} y="106" textAnchor="middle">W{i + 1}</text><text x={i ? 232 : 48} y="125" textAnchor="middle">{f(model.w[i][0], 3)}</text>
    </g>)}
    {!general && <g><circle cx="140" cy="45" r="25" fill="#bd9ee522" stroke="#bd9ee5" /><text x="140" y="50" textAnchor="middle">h = {hidden}</text></g>}
    {positions.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="25" fill="#7cc8db22" stroke="#7cc8db" /><text x={x} y={y + 5} textAnchor="middle">v{i + 1}={visible[i]}</text></g>)}
    <text x="140" y="219" textAnchor="middle">{general ? 'four possible visible pairs' : 'eight possible joint configurations'}</text>
  </RbmFigure>;
}
export function RbmProgram({
  file
}) {
  return <>
    <RemoteCodeBlock source={rbmAssetBase + file} language="python" filename={file} title={"Read the complete " + (file) + " program"} />
    <p><a href={rbmAssetBase + file} download>Download {file}</a></p>
  </>;
}
export function RbmStateTable({
  distribution
}) {
  return <NeuralTable caption="Every joint event; marginalization adds matching visible rows" headers={['Visible', 'Hidden', 'Energy', 'Joint probability']} rows={distribution.joint.map(row => [stateName(row.v), row.h, f(row.energy, 6), f(row.probability, 8)])} />;
}
