import { useId } from 'react';
import './recurrent-intuition.css';

export function RecurrentDirectionProductFigure() {
  const arrow = useId().replaceAll(':', '');
  const stages = [{label:'Start',v:[0,1]}, {label:'After A',v:[2,0]}, {label:'After B',v:[0,4]}];
  return <figure className="recurrent-intuition" data-figure="recurrent-direction-product" data-constructed-fixture="true"><div className="recurrent-intuition-stages">{stages.map(({label,v},i)=><svg key={label} viewBox="0 0 150 172" role="img" aria-label={`${label}: vector (${v.join(', ')}). Equal axis scale: 20 drawing units per coordinate.`}>
    <defs><marker id={`${arrow}-${i}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#969696" /></marker></defs>
    <text x="75" y="18" textAnchor="middle">{label}</text>
    <path d="M28 133 H133 M28 133 V38" stroke="#666" fill="none" />
    {[1,2,3,4].map(t=><g key={t}><path d={`M${28+20*t} 130v6 M25 ${133-20*t}h6`} stroke="#666" /><text x="18" y={137-20*t} textAnchor="end">{t}</text></g>)}
    <line x1="28" y1="133" x2={28+20*v[0]} y2={133-20*v[1]} stroke="#969696" strokeWidth="2.5" markerEnd={`url(#${arrow}-${i})`} />
    <text x="75" y="161" textAnchor="middle" fill="#b5a3dd">({v.join(', ')})</text>
  </svg>)}</div><figcaption>The same coordinate scale in all three views. Solid grey arrows show the forward action of each map.</figcaption></figure>;
}
