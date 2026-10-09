import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { originalRatings, originalEvents, resizeRatings } from '../../data/recommender-flow-evidence-models.js';
import './recommender-flow-controls.css';

export const formatRec = value => value === null || value === undefined ? 'unavailable'
  : Number.isInteger(value) ? String(value) : Number(value.toPrecision(8)).toString();
export const itemHue = index => ['#84b8ef', '#c59bdd', '#e8b44a', '#ef9fae', '#74cdd3', '#bfc2c9', '#caa5b6'][index % 7];
const completeNumber = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

export function RecQuantity({ label, value, onChange, min, max, integer = false, step = .1, revision = 0 }) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState('');
  const last = useRef(value);
  const previousRevision = useRef(revision);
  useEffect(() => {
    if (!Object.is(value, last.current) || previousRevision.current !== revision) {
      setDraft(String(value));
      setError('');
    }
    last.current = value;
    previousRevision.current = revision;
  }, [value, revision]);
  const commit = next => {
    last.current = next;
    setDraft(String(next));
    setError('');
    onChange(next);
  };
  return <fieldset className="rec-flow-quantity"><legend>{label}: <output>{formatRec(value)}</output></legend>
    <input type="range" aria-label={`${label}: slider`} min={min} max={max} step={integer ? 1 : 'any'} value={value}
      onChange={event => commit(Number(event.target.value))} onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? min : event.key === 'End' ? max
          : Math.min(max, Math.max(min, value + (['ArrowLeft', 'ArrowDown'].includes(event.key) ? -1 : 1) * (integer ? 1 : step)));
        commit(next);
      }} />
    <label htmlFor={id}>Exact value</label><input id={id} type="text" inputMode="decimal" value={draft}
      aria-label={`${label}: exact value`} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
      onChange={event => {
        const text = event.target.value;
        setDraft(text);
        const parsed = Number(text);
        if (!completeNumber.test(text.trim()) || !Number.isFinite(parsed) || parsed < min || parsed > max || (integer && !Number.isInteger(parsed))) {
          setError(`Enter ${integer ? 'an integer' : 'a finite decimal'} from ${min} to ${max}. The last valid result remains.`);
          return;
        }
        last.current = parsed;
        setError('');
        onChange(parsed);
      }} />
    {error && <span role="alert" id={`${id}-error`}>{error}</span>}
  </fieldset>;
}

export function RecExactObject({ label, value, onChange, parse, revision = 0, description }) {
  const id = useId();
  const serial = typeof value === 'string' ? value : JSON.stringify(value);
  const [draft, setDraft] = useState(serial);
  const [error, setError] = useState('');
  const last = useRef(serial);
  const previousRevision = useRef(revision);
  useEffect(() => {
    if (serial !== last.current || previousRevision.current !== revision) {
      setDraft(serial);
      setError('');
    }
    last.current = serial;
    previousRevision.current = revision;
  }, [serial, revision]);
  return <fieldset className="rec-flow-quantity"><legend>{label}</legend>
    {description && <p id={`${id}-help`}>{description}</p>}
    <textarea id={id} value={draft} aria-label={label} aria-invalid={Boolean(error)}
      aria-describedby={[description && `${id}-help`, error && `${id}-error`].filter(Boolean).join(' ') || undefined} rows={2}
      onChange={event => {
        const text = event.target.value;
        setDraft(text);
        try {
          const next = parse(text);
          last.current = typeof next === 'string' ? next : JSON.stringify(next);
          setError('');
          onChange(next);
        } catch (failure) {
          setError(`${failure.message} The last valid result remains.`);
        }
      }} />
    {error && <span role="alert" id={`${id}-error`}>{error}</span>}
  </fieldset>;
}

export function parseRecVector(text, length, min, max) {
  const parts = text.trim().startsWith('[') ? JSON.parse(text) : text.split(',').map(part => {
    if (!completeNumber.test(part.trim())) throw new Error('Use complete decimal coordinates.');
    return Number(part);
  });
  if (!Array.isArray(parts) || parts.length !== length || parts.some(value => typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)) {
    throw new Error(`Use ${length} finite coordinates from ${min} to ${max}.`);
  }
  return parts;
}

const EvidenceContext = createContext(null);
const defaults = () => ({ matrix: originalRatings.map(row => [...row]), user: 0, item: 2, pair: [0, 3],
  prediction: 3, request: 20, requestUser: 0, releases: Array(7).fill(0), artifact: 30, prior: 3.1, baselineShrinkage: 3,
  mode: 'item', rule: 'adjusted', minimum: 2, shrinkage: 2, k: 3, signed: false,
  events: originalEvents.map(event => ({ ...event })) });

export function RecommenderEvidenceProvider({ children }) {
  const [state, setState] = useState(defaults);
  const [revision, setRevision] = useState(0);
  const patch = values => setState(previous => ({ ...previous, ...values }));
  const resize = (users, items) => setState(previous => ({ ...previous,
    matrix: resizeRatings(previous.matrix, users, items), user: Math.min(previous.user, users - 1),
    item: Math.min(previous.item, items - 1), pair: previous.pair.map(item => Math.min(item, items - 1)),
    releases: Array.from({ length: items }, (_, item) => previous.releases[item] ?? 0) }));
  const reset = () => { setState(defaults()); setRevision(value => value + 1); };
  return <EvidenceContext.Provider value={{ ...state, patch, resize, reset, revision }}>{children}</EvidenceContext.Provider>;
}

export function useRecEvidence() {
  const state = useContext(EvidenceContext);
  if (!state) throw new Error('Evidence views require RecommenderEvidenceProvider.');
  return state;
}

export function RecSelect({ label, value, options, onChange }) {
  return <label className="rec-flow-select">{label}<select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>
    {options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
  </select></label>;
}

export function RecFigure({ id, label, children, controls, reset, result }) {
  return <figure className="rec-flow-figure" data-rec-job={id} aria-label={label}>
    <div className="rec-flow-picture">{children}</div>
    {(controls || reset) && <div className="rec-flow-controls">{controls}{reset && <button type="button" onClick={reset}>Reset</button>}</div>}
    <figcaption aria-live="polite">{result}</figcaption>
  </figure>;
}

// Hues identify declared semantic axes, never the position of a generic field.
// Unspecified headers/rows stay neutral; values keep their readable neutral ink.
export function RecMatrix({ label, rows, columns, rowNames, columnHues, rowHues, selected, onSelect, zeroDiagonal=false }) {
  return <div className="rec-flow-pan" tabIndex={0} role="region" aria-label={`${label}: scrollable matrix`}>
    <table className="rec-flow-matrix"><caption>{label}</caption>
      <thead><tr><th scope="col">Row / column</th>{columns.map((name, column) => <th key={column} scope="col" style={{ color: columnHues?.[column] }}>{name}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}><th scope="row" style={{ color: rowHues?.[index] }}>{rowNames?.[index] ?? index}</th>{row.map((value, column) => {
        const active = selected?.[0] === index && selected?.[1] === column;
        return <td key={column} className={`${value === null ? 'is-missing' : 'is-observed'}${active ? ' is-selected' : ''}${selected?.[0]===index||selected?.[1]===column?' is-selected-axis':''}${zeroDiagonal&&index===column?' is-prohibited':''}`}>
          {onSelect ? <button type="button" aria-label={`${rowNames?.[index] ?? index}, ${columns[column]}: ${value === null ? 'missing' : value}${active ? ', selected' : ''}`}
            aria-pressed={active} onClick={() => onSelect(index, column)}>{value === null ? '—' : formatRec(value)}</button>
            : typeof value === 'number' || value === null ? (value === null ? '—' : formatRec(value)) : value}
        </td>;
      })}</tr>)}</tbody>
    </table>
  </div>;
}

// columnHues align with displayed fields after the first row-label header.
export function RecOperands({ label, rows, columnHues, rowHues, headers = ['Coordinate', 'Left operand', 'Right operand', 'Product'] }) {
  return <RecMatrix label={label} rows={rows.map(row => row.slice(1))}
    columns={headers.slice(1)} rowNames={rows.map(row => row[0])} columnHues={columnHues} rowHues={rowHues} />;
}
