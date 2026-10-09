import { useId } from 'react';
import { RbmFigure } from './RbmElements.jsx';
export function RbmFamilyFigure() {
  const id = useId().replaceAll(':', '');
  return <div className="rbm-two">{['RBM', 'Deep belief network', 'Deep Boltzmann machine'].map((name, kind) => <RbmFigure key={name} title={name} width={310} height={300} description={kind === 0 ? 'One undirected visible/hidden pair.' : kind === 1 ? 'Only the top pair is undirected. Lower arrows specify conditional generative directions.' : 'All adjacent-layer interactions are undirected; hidden inference no longer separates like one RBM.'}>
    <defs><marker id={id + kind} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="#aaa" /></marker></defs>
    {(kind === 0 ? [0] : [0, 1]).flatMap(layer => (layer === 0 ? [105, 205] : [75, 155, 235]).flatMap(from => [75, 155, 235].map(to => <line key={layer + '-' + from + '-' + to} x1={from} y1={50 + layer * 95 + 14} x2={to} y2={145 + layer * 95 - 14} stroke={kind === 1 && layer === 1 ? "#aaa" : "#e6b854"} opacity=".8" markerEnd={kind === 1 && layer === 1 ? 'url(#' + id + kind + ')' : undefined} />)))}
    {(kind === 0 ? [0, 1] : [0, 1, 2]).map(layer => <g key={layer}>{(layer === 0 ? [105, 205] : [75, 155, 235]).map(x => <circle key={x} cx={x} cy={50 + layer * 95} r="14" fill={layer === (kind === 0 ? 1 : 2) ? '#7cc8db22' : '#bd9ee522'} stroke={layer === (kind === 0 ? 1 : 2) ? '#7cc8db' : '#bd9ee5'} />)}<text x="155" y={26 + layer * 95} textAnchor="middle" fill="#eee" fontSize="13">{layer === (kind === 0 ? 1 : 2) ? 'visible variables' : 'hidden layer ' + (kind === 0 ? 1 : 2 - layer)}</text></g>)}
  </RbmFigure>)}</div>;
}
export function RbmAisFigure() {
  const onMasses = [1, 3, 9, 27];
  return <figure className="rbm-ais-flow" aria-label="Two-state illustrative annealed importance path">
    <div className="rbm-ais-stages">{onMasses.map((onMass, i) => <figure key={i}>
      <p>{['Base: known Z₀=2', 'Bridge 1', 'Bridge 2', 'Target: Z₃'][i]}</p>
      <svg viewBox="0 0 280 142" role="img" aria-label={'State masses 1 and ' + onMass + ', before normalization'}>
        {[1, onMass].map((mass, j) => <g key={j}><line x1="30" y1={46 + j * 54} x2="250" y2={46 + j * 54} stroke="#444" /><rect x="30" y={34 + j * 54} width={220 * mass / 27} height="24" fill="#bd9ee5" /><text x="30" y={25 + j * 54}>state {j}: mass {mass}</text></g>)}
        <text x="140" y="137" textAnchor="middle">same mass scale 0–27</text>
      </svg>
    </figure>)}</div>
    <p>Violet bars are unnormalized masses, not probabilities. Consider one path with states 1 → 0 → 1 → 1. Each arrow is a transition preserving the new intermediate distribution. Before that transition, use the old/current state to calculate the new-to-old mass ratio.</p>
    <div className="rbm-ais-stages">{[1, 0, 1].map((state, i) => <p key={i}>Stage {i + 1}: current state <strong>{state}</strong>; mass ratio <strong>{state ? onMasses[i + 1] / onMasses[i] : 1}</strong>; then transition to <strong>{[0, 1, 1][i]}</strong>.</p>)}</div>
    <p>This constructed path has weight 3 × 1 × 3 = 9. It is one possible weight, not the normalizer ratio. Averaging complete weights over valid base draws and transitions estimates Z₃/Z₀; taking one weight or its logarithm does not certify that ratio. The endpoint masses in this tiny drawing can be summed directly; real AIS is useful when that target sum is unavailable.</p>
  </figure>;
}
export function RbmSupportFigure() {
  return <div className="rbm-support-flow">
    <RbmFigure title="Binary support" width={280} height={115} description="Two cyan points are the only allowed binary values; probabilities are assigned to these points."><line x1="30" y1="50" x2="250" y2="50" stroke="#aaa" />{[0,1].map((value,i)=><g key={value}><circle cx={45+190*i} cy="50" r="8" fill="#7cc8db" /><text x={45+190*i} y="85" textAnchor="middle">{value}</text></g>)}</RbmFigure>
    <RbmFigure title="Categorical support" width={280} height={115} description="One of three named categories is selected; their probabilities sum to one.">{['low','medium','high'].map((name,i)=><g key={name}><circle cx={45+95*i} cy="50" r="8" fill="#7cc8db" /><text x={45+95*i} y="85" textAnchor="middle">{name}</text></g>)}</RbmFigure>
    <RbmFigure title="Gaussian visible conditional" width={280} height={160} description="This continuous conditional has a violet density curve, not point probabilities. Its centre is the conditional mean; shading a region would represent its probability."><line x1="20" y1="125" x2="260" y2="125" stroke="#aaa" /><path d={'M'+Array.from({length:81},(_,i)=>{const x=-3+i*6/80;return (20+i*3)+','+(125-90*Math.exp(-x*x/2));}).join(' L')} fill="none" stroke="#bd9ee5" strokeWidth="2" /><line x1="140" y1="35" x2="140" y2="125" stroke="#aaa" strokeDasharray="4 4" /><text x="140" y="150" textAnchor="middle">mean = a + Wh</text></RbmFigure>
  </div>;
}
