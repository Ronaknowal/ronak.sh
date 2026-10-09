import React, { createContext, useContext, useId, useState } from 'react';
import { FlowControls, FlowReadout } from '../LessonFlow.jsx';
import { NeuralNumber, NeuralSelect } from '../NeuralLessonElements.jsx';
import { direction, subtract, IDS, ORDER } from './ica-models.mjs';

export const C = { source1: '#e4b752', source2: '#83b4e8', residual: '#dc8fc7', query: '#c1a0dc', neutral: '#c7c7c7', dim: '#777777', focus: '#ffffff' };
export const number = (value, digits = 5) => value === null || value === undefined ? 'unavailable' :
  Math.abs(value) < 1e-12 ? '0' : Number(value.toFixed(digits)).toString().replace('-', '−');
export const vector = values => `(${values.map(value => number(value)).join(', ')})`;
const Context = createContext(null);
export function IcaState({ children }) {
  const [instant, setInstant] = useState(1), [amplitude, setAmplitude] = useState(1);
  const [initial, setInitial] = useState(Math.atan2(.6, .8) * 180 / Math.PI);
  const [steps, setSteps] = useState([]);
  const resetMix = () => { setInstant(1); setAmplitude(1); };
  const chooseInstant = value => { setInstant(value); setAmplitude(value === 0 || value === 2 ? -1 : 1); };
  const changeInitial = value => { setInitial(value); setSteps([]); };
  return <Context.Provider value={{ instant, amplitude, setAmplitude, chooseInstant, resetMix, initial, steps, setSteps, changeInitial }}>{children}</Context.Provider>;
}
export const useIca = () => useContext(Context);
export function Figure({ id, children, equivalent }) {
  return <figure data-ica-drawing={id} id={`ica-${id.toLowerCase()}`}>
    {children}<figcaption>{equivalent}</figcaption>
  </figure>;
}
export function Controls({ id, children, reset }) {
  return <FlowControls><div className="ica-control-fields" data-ica-lab={id}>{children}</div><button type="button" onClick={reset}>Reset</button></FlowControls>;
}
export function Numeric({ label, value, onChange, min, max, step = 'any', integer = false }) {
  return <NeuralNumber label={label} value={value} onChange={onChange} min={min} max={max} step={step} integer={integer} range={false} />;
}
export { FlowReadout as Readout, NeuralSelect as Select };
export function Panels({ children }) { return <div className="ica-panels">{children}</div>; }
export function Key({ entries }) { return <ul className="ica-key">{entries.map(([label, color]) => <li key={label}><span style={{ borderColor: color }} />{label}</li>)}</ul>; }
export function Matrix({ name, rows, headers, rowLabels, colors, selectedRow }) {
  return <div className="ica-matrix"><p>{name}</p><div tabIndex={0} role="region" aria-label={`${name}; scroll when needed`} className="ica-table-scroll"><table><thead>{headers && <tr><th scope="col">{rowLabels ? 'row' : ''}</th>{headers.map((text, i) => <th key={i} scope="col">{text}</th>)}</tr>}</thead><tbody>{rows.map((row, i) => <tr key={i} className={i === selectedRow ? 'ica-selected' : ''}><th scope="row">{rowLabels?.[i] ?? i + 1}</th>{row.map((value, j) => <td key={j} style={{ color: colors?.[j] }}>{typeof value === 'number' || value === null ? number(value) : value}</td>)}</tr>)}</tbody></table></div></div>;
}
export function Mark({ x, y, id, color = C.neutral, focus = false, size = 4 }) {
  const common = { fill: color, stroke: focus ? C.focus : color, strokeWidth: focus ? 2 : 1 };
  if (id === 'B') return <path d={`M${x},${y-size-1} L${x-size-1},${y+size} L${x+size+1},${y+size} Z`} {...common} />;
  if (id === 'C') return <rect x={x-size} y={y-size} width={2*size} height={2*size} {...common} />;
  if (id === 'D') return <path d={`M${x-size-1},${y-size-1} L${x+size+1},${y+size+1} M${x-size-1},${y+size+1} L${x+size+1},${y-size-1}`} fill="none" stroke={color} strokeWidth="2" />;
  if (id === 'Q') return <path d={`M${x},${y-size-2} L${x+size+2},${y} L${x},${y+size+2} L${x-size-2},${y} Z`} {...common} />;
  return <circle cx={x} cy={y} r={size} {...common} />;
}
export function Plane({ label, domain = [-4, 4], points = [], vectors = [], curves = [], ellipse, circles = [], children }) {
  const uid = useId().replaceAll(':', '');
  const lo = domain[0], hi = domain[1], span = hi - lo;
  const x = value => 44 + 240 * (value - lo) / span;
  const y = value => 274 - 240 * (value - lo) / span;
  return <div className="ica-plane"><p>{label}</p><svg viewBox="0 0 328 314" role="img" aria-label={`${label}. Equal horizontal and vertical scale from ${lo} to ${hi}; exact vectors and points below.`}>
    <defs>{vectors.map((item, i) => <marker key={i} id={`${uid}-arrow-${i}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill={item.color || C.neutral} /></marker>)}</defs>
    {[lo, (lo+hi)/2, hi].map(value => <g key={value}><line x1={x(value)} x2={x(value)} y1="34" y2="274" stroke="#333" /><line x1="44" x2="284" y1={y(value)} y2={y(value)} stroke="#333" /><text x={x(value)} y="296" textAnchor="middle">{number(value,2)}</text><text x="37" y={y(value)+5} textAnchor="end">{number(value,2)}</text></g>)}
    {lo <= 0 && hi >= 0 && <><line x1="44" x2="284" y1={y(0)} y2={y(0)} stroke={C.dim}/><line x1={x(0)} x2={x(0)} y1="34" y2="274" stroke={C.dim}/></>}
    {circles.map((r, i) => <circle key={i} cx={x(0)} cy={y(0)} r={240*r/span} fill="none" stroke={C.dim} />)}
    {ellipse && <ellipse cx={x(ellipse.center?.[0] || 0)} cy={y(ellipse.center?.[1] || 0)} rx={240*ellipse.radii[0]/span} ry={240*ellipse.radii[1]/span} transform={`rotate(${-ellipse.angle} ${x(ellipse.center?.[0] || 0)} ${y(ellipse.center?.[1] || 0)})`} fill="none" stroke={ellipse.color || C.neutral} strokeDasharray="5 3" />}
    {curves.map((curve, i) => <polyline key={i} points={curve.values.map(([a,b]) => `${x(a)},${y(b)}`).join(' ')} fill="none" stroke={curve.color || C.neutral} strokeWidth="1.5" />)}
    {vectors.map((item, i) => { const start = item.start || [0,0]; return <g key={i}><line x1={x(start[0])} y1={y(start[1])} x2={x(item.end[0])} y2={y(item.end[1])} stroke={item.color || C.neutral} strokeWidth={item.width || 2} strokeDasharray={item.dashed ? '5 4' : undefined} markerEnd={Math.hypot(item.end[0]-start[0],item.end[1]-start[1]) > 1e-12 ? `url(#${uid}-arrow-${i})` : undefined}/>{Math.hypot(item.end[0]-start[0],item.end[1]-start[1]) <= 1e-12 && <circle cx={x(start[0])} cy={y(start[1])} r="4" fill={item.color || C.neutral}/>}</g>; })}
    {points.map((point, i) => <g key={i}><Mark x={x(point.value[0])} y={y(point.value[1])} id={point.id} color={point.color} focus={point.focus}/>{point.label && <text x={x(point.value[0])+8} y={y(point.value[1])-8}>{point.label}</text>}</g>)}
    {children?.({x,y})}
  </svg><Key entries={vectors.filter(item => item.label).map(item => [`${item.label} ${vector(item.start ? subtract(item.end,item.start) : item.end)}${item.start ? `; from ${vector(item.start)} to ${vector(item.end)}` : ''}`, item.color || C.neutral])}/>
    {points.length > 0 && <p className="ica-exact">{points.map(point => `${point.id || point.label || 'point'} ${vector(point.value)}`).join(' · ')}</p>}
  </div>;
}
export function Trace({ label, values, color = C.neutral, selected, ids, domain, xLabel = 'illustrative instant', yLabel = 'constructed amplitude', stems = false }) {
  const lo = domain?.[0] ?? Math.min(-1,...values), hi = domain?.[1] ?? Math.max(1,...values);
  const x = index => 44 + index / Math.max(1, values.length - 1) * 240;
  const y = value => 150 - (value - lo) / (hi - lo) * 112;
  return <div className="ica-trace"><p style={{color}}>{label}</p><svg viewBox="0 0 328 190" role="img" aria-label={`${label}; ${values.map(value=>number(value)).join(', ')}. Horizontal ${xLabel}; vertical ${yLabel}.`}>
    <line x1="44" x2="284" y1={y(0)} y2={y(0)} stroke={C.dim}/>
    {[lo,0,hi].filter((v,i,a) => a.indexOf(v)===i).map(value => <text key={value} x="37" y={y(value)+5} textAnchor="end">{number(value,2)}</text>)}
    {selected !== undefined && <line x1={x(selected)} x2={x(selected)} y1="30" y2="155" stroke="#777" strokeDasharray="4 3"/>}
    {!stems && <polyline points={values.map((value,i) => `${x(i)},${y(value)}`).join(' ')} fill="none" stroke={color} strokeWidth="2"/>}
    {values.map((value,i) => <g key={i}>{stems && <line x1={x(i)} x2={x(i)} y1={y(0)} y2={y(value)} stroke={color} strokeWidth="3"/>}<Mark x={x(i)} y={y(value)} id={ids?.[i]} color={color} focus={i===selected}/>{values.length<=6 && <text x={x(i)} y="177" textAnchor="middle">{ids?.[i] || i}</text>}</g>)}
  </svg><p className="ica-axis">{xLabel}; vertical: {label.includes('ADC')?'ADC counts':yLabel}</p></div>;
}
export function Curve({ label, values, xDomain, yDomain, color = C.neutral, selected }) {
  const x = value => 45 + 238 * (value-xDomain[0])/(xDomain[1]-xDomain[0]);
  const y = value => 194 - 156 * (value-yDomain[0])/(yDomain[1]-yDomain[0]);
  return <div className="ica-curve"><p>{label}</p><svg viewBox="0 0 328 234" role="img" aria-label={`${label}; horizontal ${xDomain.join(' to ')}, vertical ${yDomain.join(' to ')}`}>
    <line x1="45" x2="283" y1="194" y2="194" stroke={C.dim}/><line x1="45" x2="45" y1="38" y2="194" stroke={C.dim}/>
    {[0,.5,1].map(t=><g key={t}><text x={45+238*t} y="217" textAnchor="middle">{number(xDomain[0]+t*(xDomain[1]-xDomain[0]),2)}</text><text x="38" y={194-156*t+5} textAnchor="end">{number(yDomain[0]+t*(yDomain[1]-yDomain[0]),2)}</text></g>)}
    <polyline points={values.map(([a,b])=>`${x(a)},${y(b)}`).join(' ')} fill="none" stroke={color} strokeWidth="2"/>
    {selected && <><line x1={x(selected[0])} x2={x(selected[0])} y1="38" y2="194" stroke={C.dim} strokeDasharray="3 3"/><circle cx={x(selected[0])} cy={y(selected[1])} r="5" fill={color}/></>}
  </svg></div>;
}
export function ProbabilityGrid({ label, rows, rowLabels, columnLabels }) {
  return <div className="ica-probability"><p>{label}</p><div className="ica-table-scroll" tabIndex={0} role="region" aria-label={label}><table><thead><tr><th scope="col">joint event</th>{columnLabels.map(v=><th key={v} scope="col">{v}</th>)}<th scope="col">row mass</th></tr></thead><tbody>{rows.map((row,i)=><tr key={i}><th scope="row">{rowLabels[i]}</th>{row.map((mass,j)=><td key={j}><svg viewBox="0 0 60 60" aria-hidden="true"><rect x={30-25*Math.sqrt(mass)} y={30-25*Math.sqrt(mass)} width={50*Math.sqrt(mass)} height={50*Math.sqrt(mass)} fill={C.residual}/>{mass===0&&<path d="M25,25 L35,35 M25,35 L35,25" stroke={C.dim}/>}</svg><span>{number(mass,6)}</span></td>)}<td>{number(row.reduce((a,b)=>a+b,0),6)}</td></tr>)}</tbody></table></div><p className="ica-axis">Cell area ∝ probability; zero cells have no mass. Column masses {columnLabels.map((_,j)=>number(rows.reduce((sum,row)=>sum+row[j],0),6)).join(', ')}.</p></div>;
}
export function Atoms({ label, atoms, domain = [-2,2] }) {
  const x = value => 44 + 240*(value-domain[0])/(domain[1]-domain[0]);
  return <div><p>{label}</p><svg viewBox="0 0 328 214" role="img" aria-label={`${label}; ${atoms.map(atom=>`${number(atom.value)} mass ${number(atom.mass)}`).join('; ')}`}>
    <line x1="44" x2="284" y1="158" y2="158" stroke={C.dim}/>
    {atoms.map((atom,i)=><g key={i}><line x1={x(atom.value)} x2={x(atom.value)} y1="158" y2={158-atom.mass*160} stroke={C.neutral} strokeWidth="3"/><circle cx={x(atom.value)} cy={158-atom.mass*160} r="4" fill={C.neutral}/><text x={x(atom.value)} y={146-atom.mass*160} textAnchor="middle">{number(atom.mass,3)}</text><text x={x(atom.value)} y="182" textAnchor="middle">{number(atom.value,3)}</text></g>)}
  </svg><p className="ica-axis">Horizontal: projected value; vertical stick height: probability mass.</p></div>;
}
export const samplePoints = rows => rows.map((value,i)=>({value,id:IDS[i]}));
export const ruler = (angle, color=C.neutral, label='unit ruler') => ({end:direction(angle),color,label});
export const instantIds = ORDER.map(i=>IDS[i]);
