import { useId } from 'react';

export function LogicDrawing({ label, height = 240, children, className = '' }) {
  const marker = useId().replaceAll(':', '');
  return <svg className={`sets-logic-svg ${className}`} viewBox={`0 0 340 ${height}`} role="img" aria-label={label}>
    <defs><marker id={marker} markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 1L7 4L0 7" className="sets-arrowhead" /></marker></defs>
    {typeof children === 'function' ? children(marker) : children}
  </svg>;
}

export function LogicFigure({ label, height, children, caption, className }) {
  return <figure className="sets-logic-figure">
    <LogicDrawing label={label} height={height} className={className}>{children}</LogicDrawing>
    <figcaption>{caption}</figcaption>
  </figure>;
}

export function Mark({ x, y, text, selected = false, comparison = false, radius = 21 }) {
  return <g><circle cx={x} cy={y} r={radius} className={selected ? 'sets-mark sets-selected' : comparison ? 'sets-mark sets-comparison' : 'sets-mark'} /><text x={x} y={y + 6} textAnchor="middle">{text}</text></g>;
}

export function LogicArrow({ from, to, marker, missing = false, comparison = false, bend = 0 }) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const distance = Math.hypot(x2 - x1, y2 - y1);
  if (!distance) return <path d={`M${x1 - 14} ${y1 - 16}C${x1 - 55} ${y1 - 72},${x1 + 55} ${y1 - 72},${x1 + 14} ${y1 - 16}`} className={missing ? 'sets-edge sets-missing' : 'sets-edge'} markerEnd={`url(#${marker})`} />;
  const ux = (x2 - x1) / distance;
  const uy = (y2 - y1) / distance;
  const start = [x1 + ux * 23, y1 + uy * 23];
  const end = [x2 - ux * 25, y2 - uy * 25];
  const curve = bend ? `Q${(x1 + x2) / 2 - uy * bend} ${(y1 + y2) / 2 + ux * bend} ` : 'L';
  return <path d={`M${start.join(' ')}${curve}${end.join(' ')}`} className={`sets-edge${missing ? ' sets-missing' : comparison ? ' sets-comparison' : ''}`} markerEnd={`url(#${marker})`} />;
}

export function BinaryBoard({ matrix, rowLabels, columnLabels, highlight, onToggle, label }) {
  return <div className="sets-logic-matrix-scroll" role="region" tabIndex={0} aria-label={`${label}; scroll horizontally if needed`}>
    <table className="sets-logic-board"><caption>{label}</caption><thead><tr><th scope="col">row / column</th>{columnLabels.map((name, index) => <th scope="col" key={index}>{name}</th>)}</tr></thead>
      <tbody>{rowLabels.map((name, row) => <tr key={row}><th scope="row">{name}</th>{columnLabels.map((column, col) => <td key={col} className={highlight?.(row, col) ? 'sets-cell-selected' : ''}>
        {onToggle ? <button type="button" aria-label={`${name}, ${column}`} aria-pressed={matrix[row][col]} onClick={() => onToggle(row, col)}>{matrix[row][col] ? '1' : '0'}</button> : <span>{matrix[row][col] ? '1' : '0'}</span>}
      </td>)}</tr>)}</tbody>
    </table>
  </div>;
}

export function RegionsDrawing({ members, selected }) {
  const positions = {};
  for (const region of ['first', 'both', 'second', 'neither']) {
    const people = members.filter(member => member.region === region);
    people.forEach((member, index) => {
      positions[member.name] = region === 'neither'
        ? [340 * (index + 1) / (people.length + 1), 267]
        : [{ first: 76, both: 170, second: 264 }[region], 128 + (index - (people.length - 1) / 2) * 29];
    });
  }
  return <LogicDrawing label={`People in training T and badges B. Selected people: ${selected.length ? selected.join(', ') : 'none'}. Circle areas are schematic.`} height={304}>
    <rect x="8" y="9" width="324" height="286" className="sets-universe" />
    <text x="20" y="33">U</text><text x="100" y="39">T</text><text x="240" y="39">B</text>
    <circle cx="124" cy="128" r="82" className="sets-region" /><circle cx="216" cy="128" r="82" className="sets-region" />
    {members.map(member => <g key={member.name}><rect x={positions[member.name][0] - 32} y={positions[member.name][1] - 18} width="64" height="27" rx="3" className={member.selected ? 'sets-person sets-selected' : 'sets-person'} /><text x={positions[member.name][0]} y={positions[member.name][1]} textAnchor="middle">{member.name}</text></g>)}
    <text x="170" y="239" textAnchor="middle" className="sets-small">outside both</text>
  </LogicDrawing>;
}

export function SquareDrawing({ result }) {
  const side = 266 / (result.size + 1);
  return <LogicDrawing label={`${result.before} old cells plus ${result.added} new border cells make ${result.after} cells; the corner is counted once.`} height={330}>
    {result.cells.map(cell => <rect key={`${cell.row}-${cell.column}`} x={37 + cell.column * side} y={20 + cell.row * side} width={side} height={side} className={cell.added ? 'sets-tile sets-selected' : 'sets-tile'} />)}
    <text x="170" y="317" textAnchor="middle">{result.before} + {result.added} = {result.after}</text>
  </LogicDrawing>;
}

export function HasseDrawing({ result, labels }) {
  const top = Math.max(0, ...result.levels);
  const positions = result.levels.map((level, index) => {
    const peers = result.levels.flatMap((candidate, other) => candidate === level ? [other] : []);
    return [340 * (peers.indexOf(index) + 1) / (peers.length + 1), top ? 247 - level * 190 / top : 152];
  });
  return <LogicDrawing label={`Divisibility covers on ${labels.join(', ')}. Edges go upward; omitted self and transitive pairs remain in the relation.`} height={304}>
    {result.covers.map(([a, b]) => <line key={`${a}-${b}`} x1={positions[a][0]} y1={positions[a][1]} x2={positions[b][0]} y2={positions[b][1]} className="sets-edge" />)}
    {labels.map((name, index) => <Mark key={name} x={positions[index][0]} y={positions[index][1]} text={name} selected={result.minimal.includes(index)} />)}
    <text x="170" y="292" textAnchor="middle">upward: divides</text>
  </LogicDrawing>;
}

export function RelationFailureDrawing({ property, witness, labels }) {
  if (!witness) return <p className="sets-logic-result">No failing tuple for this property in the displayed finite relation.</p>;
  const indices = [...new Set(witness)];
  const positions = indices.map((_, index) => [indices.length === 1 ? 170 : 55 + index * 230 / (indices.length - 1), 100]);
  const point = index => positions[indices.indexOf(index)];
  const edges = property === 'reflexive' ? [[witness[0], witness[0], true]]
    : property === 'symmetric' ? [[witness[0], witness[1], false], [witness[1], witness[0], true]]
    : property === 'antisymmetric' ? [[witness[0], witness[1], false], [witness[1], witness[0], false]]
    : [[witness[0], witness[1], false], [witness[1], witness[2], false], [witness[0], witness[2], true]];
  return <LogicDrawing height={237} label={`${property} fails at ${witness.map(index => labels[index]).join(', ')}; solid present arrows and dashed missing obligation.`}>{marker => <>
    {edges.map(([a, b, missing], index) => <LogicArrow key={index} from={point(a)} to={point(b)} marker={marker} missing={missing} bend={index === 2 ? 105 : property === 'symmetric' || property === 'antisymmetric' ? -32 : 0} />)}
    {indices.map((index, position) => <Mark key={index} x={positions[position][0]} y={positions[position][1]} text={labels[index]} selected />)}
    <text x="170" y="226" textAnchor="middle" className="sets-small">solid: present · dashed: required but absent</text>
  </>}</LogicDrawing>;
}
