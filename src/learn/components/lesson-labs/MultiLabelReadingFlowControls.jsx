import { useEffect, useId, useRef, useState } from 'react';
import { FlowControls, FlowReadout } from './LessonFlow.jsx';
import './multilabel-reading-flow.css';

export { FlowControls, FlowReadout };

export function multilabelNumber(value, digits = 6) {
  if (value === null || value === undefined) return 'unsupported';
  if (!Number.isFinite(value)) return String(value);
  if (value !== 0 && (Math.abs(value) < 1e-5 || Math.abs(value) >= 1e7)) return value.toExponential(3).replace(/-/g, '−');
  return Number(value.toFixed(digits)).toString().replace(/-/g, '−');
}

export function MultiLabelFigure({ job, description, children }) {
  return <figure className="mlf-figure" data-multilabel-job={job} aria-label={description}>
    {children}
  </figure>;
}

export function MultiLabelScroll({ title, kind = 'drawing', children }) {
  const region = useRef(null);
  const instruction = useId();
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const element = region.current;
    const measure = () => setOverflow(element.scrollWidth > element.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    measure();
    return () => observer.disconnect();
  }, [children]);
  return <div className="mlf-scroll-object">
    <div ref={region} className={kind === 'table' ? 'mlf-table-scroll' : 'mlf-canvas-scroll'}
      tabIndex={0} role="region" aria-label={title} aria-describedby={overflow ? instruction : undefined}>
      {children}
    </div>
    {overflow && <p className="mlf-pan-cue" id={instruction}>Pan horizontally to read the complete {kind}. Keyboard: focus this region, then use the left and right arrow keys.</p>}
  </div>;
}

export function MultiLabelCanvas({ width = 600, height = 240, title, children }) {
  const id = useId();
  return <MultiLabelScroll title={title}>
    <svg className="mlf-canvas" role="img" aria-labelledby={id} viewBox={`0 0 ${width} ${height}`}
      style={{ width: `${width / 16}rem` }}>
      <title id={id}>{title}</title>
      {children}
    </svg>
  </MultiLabelScroll>;
}

export function MultiLabelQuantity({ label, value, onChange, min, max, step = .1, integer = false, revision = 0 }) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState('');
  const previous = useRef({ value, revision });
  useEffect(() => {
    if (value !== previous.current.value || revision !== previous.current.revision) {
      setDraft(String(value));
      setError('');
    }
    previous.current = { value, revision };
  }, [value, revision]);
  const change = next => {
    setDraft(String(next));
    setError('');
    onChange(next);
  };
  const edit = text => {
    setDraft(text);
    const complete = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(text.trim());
    const next = Number(text);
    if (!complete || !Number.isFinite(next) || next < min || next > max || (integer && !Number.isInteger(next))) {
      setError(`Enter ${integer ? 'an integer' : 'a finite number'} from ${min} to ${max}. The drawing is labelled by the last valid value.`);
      return;
    }
    setError('');
    onChange(next);
  };
  return <fieldset className="mlf-quantity">
    <legend>{label} <output>{multilabelNumber(value)}</output></legend>
    <input type="range" aria-label={`${label}: slider`} min={min} max={max}
      step={integer ? 1 : 'any'} value={value} onChange={event => change(Number(event.target.value))}
      onKeyDown={event => {
        if (integer || !['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const direction = ['ArrowLeft', 'ArrowDown'].includes(event.key) ? -1 : 1;
        const next = event.key === 'Home' ? min : event.key === 'End' ? max : Math.min(max, Math.max(min, value + direction * step));
        change(next);
      }} />
    <label htmlFor={id}>Exact value</label>
    <input id={id} type="text" inputMode="decimal" value={draft} aria-label={`${label}: exact value`}
      aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
      onChange={event => edit(event.target.value)} />
    {error && <span className="mlf-error" id={`${id}-error`} role="alert">{error}</span>}
  </fieldset>;
}

export function MultiLabelVector({ label, values, onChange, min, max, revision = 0, integer = false }) {
  const id = useId();
  const serialized = values.join(', ');
  const [draft, setDraft] = useState(serialized);
  const [error, setError] = useState('');
  const previous = useRef({ serialized, revision });
  useEffect(() => {
    if (serialized !== previous.current.serialized || revision !== previous.current.revision) {
      setDraft(serialized);
      setError('');
    }
    previous.current = { serialized, revision };
  }, [serialized, revision]);
  return <fieldset className="mlf-quantity">
    <legend>{label}</legend>
    <label htmlFor={id}>Exactly {values.length} comma-separated values, from {min} to {max}</label>
    <input id={id} type="text" value={draft} aria-label={label} aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined} onChange={event => {
        const text = event.target.value;
        setDraft(text);
        const fields = text.split(',').map(field => field.trim());
        const numbers = fields.map(Number);
        const complete = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
        if (fields.length !== values.length || fields.some(field => !complete.test(field)) ||
          numbers.some(number => !Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number)))) {
          setError(`Use ${values.length} ${integer ? 'integer' : 'finite'} values from ${min} to ${max}. The displayed vector is the last valid entry.`);
          return;
        }
        setError('');
        onChange(numbers);
      }} />
    {error && <span className="mlf-error" role="alert" id={`${id}-error`}>{error}</span>}
  </fieldset>;
}

export function MultiLabelTable({ caption, children }) {
  return <MultiLabelScroll title={caption} kind="table">
    <table><caption>{caption}</caption>{children}</table>
  </MultiLabelScroll>;
}
