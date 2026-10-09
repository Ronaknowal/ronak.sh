import { useId } from 'react';
import './lesson-flow.css';

// Shared building blocks for lessons that opt into the reading flow (root class "lesson-flow").
// Figures and labs read as part of the text: the prose before a lab states its question,
// the controls sit in one row directly under the visual, and the result is a live sentence.

// Numbers use a true minus sign so diagram, readout and equation agree typographically.
export const flowNumber = (value, digits = 6) => value === null || value === undefined
  ? 'undefined'
  : Number(value.toFixed(digits)).toString().replace(/-/g, '−');

// A lab or interactive figure: no frame, banner or heading.
export function FlowLab({ id, label, children, note }) {
  return <section className="flow-lab" id={id} aria-label={label}>
    {children}
    {note && <p className="flow-note">{note}</p>}
  </section>;
}

// The control row under a visual. Keep it to the controls the lab's question needs.
export function FlowControls({ children }) {
  return <div className="flow-controls">{children}</div>;
}

// One slider with its current value beside the label. The value is the model's exact state.
export function FlowSlider({ name, value, onChange, min, max, step = 0.25, format = flowNumber }) {
  const id = useId();
  return <label htmlFor={id} className="flow-slider">
    <span>{name} <output htmlFor={id}>{format(value)}</output></span>
    <input id={id} type="range" min={min} max={max} step={step} value={value}
      onChange={event => onChange(Number(event.target.value))} />
  </label>;
}

// A small set of mutually exclusive choices, shown as buttons. options: [[key, text], ...]
export function FlowChoice({ label, options, value, onChange }) {
  return <div className="flow-choice" role="group" aria-label={label}>
    <span className="flow-choice-label">{label}</span>
    {options.map(([key, text]) => <button key={String(key)} type="button" aria-pressed={value === key}
      onClick={() => onChange(key)}>{text}</button>)}
  </div>;
}

// The live result of a lab, written as a sentence; wrap key numbers in <strong>.
export function FlowReadout({ children, className = '', ...attributes }) {
  return <p {...attributes} className={`flow-readout ${className}`.trim()} aria-live="polite">{children}</p>;
}

// An in-text check question with its answer behind the disclosure.
export function FlowCheck({ prompt, children }) {
  return <div className="flow-check">
    <p><strong>Check:</strong> {prompt}</p>
    <details><summary>Show the answer</summary><div>{children}</div></details>
  </div>;
}
