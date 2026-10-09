import './backprop-labs.css';

export function numberText(value) {
  if (value === 0) return '0';
  if (Math.abs(value) < 0.0001 || Math.abs(value) >= 1e7) return value.toExponential(7).replace(/-/g, '−');
  return Number(value.toPrecision(9)).toString().replace(/-/g, '−');
}

export function BackpropTable({ caption, headers, rows }) {
  return <div className="backprop-table-shell"><p className="backprop-table-title">{caption}</p><p className="backprop-scroll-hint">Scroll the table horizontally to inspect every column.</p><div className="backprop-table" role="region" aria-label={caption} tabIndex={0}>
    <table><caption className="backprop-sr-only">{caption}</caption><thead><tr>{headers.map((header, index) => <th scope="col" key={index}>{header}</th>)}</tr></thead>
      <tbody>{rows.map((row, i) => <tr key={i}>{row.map((value, j) => j === 0 ? <th scope="row" key={j}>{value}</th> : <td key={j}>{value}</td>)}</tr>)}</tbody>
    </table>
  </div></div>;
}

// A figure in the reading flow: no frame or heading. The lesson prose before it says what
// to look at; the caption after it reads as ordinary explanatory text.
export function BackpropFigure({ title, children, caption, id }) {
  return <figure className="backprop-figure" id={id} data-figure={id} aria-label={title}>
    {children}{caption && <figcaption>{caption}</figcaption>}
  </figure>;
}

// Steps through a process whose intermediate states matter. The buttons advance the
// actual trace; the current state stays visible.
export function BackpropSteps({ index, setIndex, count, name = 'Trace' }) {
  return <div className="flow-controls" role="group" aria-label={name}>
    <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)}>Previous step</button>
    <span className="backprop-step-count">Step {index + 1} of {count}</span>
    <button type="button" disabled={index === count - 1} onClick={() => setIndex(index + 1)}>Next step</button>
  </div>;
}
