import { useId } from 'react';
import { Caption, useGeometry, ink } from './CausalDrawingPrimitives.jsx';

// Labels use rem; only short mathematical objects live inside the geometry.
// Longer explanations remain ordinary text beside each drawing.
function Arrow({ id }) { return <defs><marker id={id} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L8,4L0,8Z" fill="#bfb7a9" /></marker></defs>; }
function Label({ x, y, children, color=ink.Z }) { return <text x={x} y={y} fill={color} textAnchor="middle" dominantBaseline="central" fontSize=".9rem">{children}</text>; }

export function ObservedRecordUse() {
  const [ref,{width,em}]=useGeometry(),id=useId().replaceAll(':',''),left=width*.25,right=width*.75;
  return <div ref={ref} className="causal-graph"><svg width="100%" height={12*em} viewBox={'0 0 '+width+' '+12*em} role="img" aria-label="Observed and missing outcome rows both supply the target covariates; only observed outcomes supply the fit">
    <Arrow id={id}/>
    <rect x={left-2.5*em} y={em} width={5*em} height={2*em} fill="none" stroke={ink.Z}/>
    <rect x={right-2.5*em} y={em} width={5*em} height={2*em} fill="none" stroke={ink.Z} strokeDasharray="5 4"/>
    <Label x={left} y={2*em}>R=1: 1,566</Label><Label x={right} y={2*em}>R=0: 63</Label>
    <path d={'M'+left+','+3*em+'V'+5*em} fill="none" stroke={ink.Y} markerEnd={'url(#'+id+')'}/>
    <Label x={left} y={6*em} color={ink.Y}>Y → fit</Label>
    <path d={'M'+(left-2.5*em)+','+2*em+'H'+.5*em+'V'+8*em+'H'+width*.5+'M'+right+','+3*em+'V'+8*em+'H'+width*.5+'V'+9.5*em} fill="none" stroke={ink.Z} markerEnd={'url(#'+id+')'}/>
    <Label x={width*.5} y={10.5*em}>L → target: 1,629</Label>
  </svg><Caption>Solid R=1 and dashed R=0 are outcome-observation status. Both branches join the L target; only the solid branch provides Y for fitting.</Caption></div>;
}

export function CommonTargetCopies() {
  const [ref,{width,em}]=useGeometry(),id=useId().replaceAll(':',''),left=width*.22,right=width*.78,mid=width*.5;
  return <div ref={ref} className="causal-graph"><svg width="100%" height={17*em} viewBox={'0 0 '+width+' '+17*em} role="img" aria-label="Each target covariate row feeds both forced predictions; each column averages over the same 1629 rows">
    <Arrow id={id}/><Label x={mid} y={em}>Same target L</Label>
    {[['L₁',3],['L₂',6],['…',8],['L₁₆₂₉',10]].map(([label,y])=><g key={label}>
      <Label x={mid} y={y*em}>{label}</Label>
      {label!=='…'&&<><path d={'M'+(mid-.9*em)+','+y*em+'H'+left+'V'+(y+.7)*em} fill="none" stroke={ink.Z} markerEnd={'url(#'+id+')'}/><path d={'M'+(mid+.9*em)+','+y*em+'H'+right+'V'+(y+.7)*em} fill="none" stroke={ink.Z} markerEnd={'url(#'+id+')'}/><Label x={left} y={(y+1.4)*em} color={ink.Y}>m̂(0,{label})</Label><Label x={right} y={(y+1.4)*em} color={ink.Y}>m̂(1,{label})</Label></>}
    </g>)}
    <path d={'M'+.5*em+','+2*em+'V'+12*em+'H'+left+'V'+13*em+'M'+(width-.5*em)+','+2*em+'V'+12*em+'H'+right+'V'+13*em} fill="none" stroke={ink.Y} markerEnd={'url(#'+id+')'}/>
    <Label x={left} y={14*em} color={ink.Y}>sum / 1,629</Label><Label x={right} y={14*em} color={ink.Y}>sum / 1,629</Label>
    <Label x={left} y={16*em} color={ink.X}>□ A=0</Label><Label x={right} y={16*em} color={ink.X}>■ A=1</Label>
  </svg><Caption>Only four symbolic row positions are illustrated. The side brackets collect every prediction, including rows whose Y is missing; both divisors remain 1,629.</Caption></div>;
}

export function BootstrapCopies() {
  const [ref,{width,em}]=useGeometry(),id=useId().replaceAll(':',''),x=width*.4,half=Math.min(width*.34,4.4*em),sourceY=[2,5],targetY=[10,13,16];
  return <div ref={ref} className="causal-graph"><svg width="100%" height={18*em} viewBox={'0 0 '+width+' '+18*em} role="img" aria-label="Schematic index prefix 4,4,1: source record 4 is copied through two distinct paths to sampled positions 1 and 2; record 1 goes to position 3">
    <Arrow id={id}/>
    {[1,4].map((row,i)=><g key={row}><Label x={x} y={(sourceY[i]-.9)*em}>Source row {row}</Label><rect x={x-half} y={(sourceY[i]-.1)*em} width={2*half} height={1.6*em} fill="#171719" stroke={row===4?ink.M:ink.Z}/><Label x={x} y={(sourceY[i]+.7)*em} color={row===4?ink.M:ink.Z}>{row===4?'[A₄,L₄,R₄,Y₄]':'[A₁,L₁,R₁,Y₁]'}</Label></g>)}
    {[[4,0],[4,1],[1,2]].map(([source,k])=>{const channel=width-(.6+k*.45)*em,sy=(source===4?5.7:2.7)*em,ty=(targetY[k]+.7)*em;return <g key={k}><path d={'M'+(x+half)+','+sy+'H'+channel+'V'+ty+'H'+(x+half+.1*em)} fill="none" stroke={source===4?ink.M:ink.Z} markerEnd={'url(#'+id+')'}/><Label x={x} y={(targetY[k]-.9)*em}>Sample position {k+1}</Label><rect x={x-half} y={(targetY[k]-.1)*em} width={2*half} height={1.6*em} fill="#171719" stroke={source===4?ink.M:ink.Z}/><Label x={x} y={ty} color={source===4?ink.M:ink.Z}>{source===4?'[A₄,L₄,R₄,Y₄]':'[A₁,L₁,R₁,Y₁]'}</Label></g>})}
  </svg><Caption>Schematic indices [4,4,1,…], not a stored replicate. Rose paths trace both copies of record 4; lavender traces record 1. Each connector carries the whole A,L,R,Y record, and any missing Y stays missing.</Caption></div>;
}

export function BootstrapPredictionFlow() {
  const [ref, { width, em }] = useGeometry(), id = useId().replaceAll(':', '');
  const left = width * .27, right = width * .73, middle = width / 2;
  return <div className="causal-bootstrap-prediction" ref={ref}>
    <p>Fit branch: sampled positions with R*=1 supply their actual A*, L*, Y* to one refit.</p>
    <svg width="100%" height={6 * em} viewBox={'0 0 ' + width + ' ' + 6 * em} role="img" aria-label="One refitted coefficient vector beta star supplies both forced prediction functions">
      <Arrow id={id} />
      <Label x={middle} y={em} color={ink.M}>One refit β*</Label>
      <path d={'M' + middle + ',' + 1.8 * em + 'V' + 2.8 * em} fill="none" stroke={ink.M} />
      {[left, right].map(x => <path key={x} d={'M' + middle + ',' + 2.8 * em + 'H' + x + 'V' + 4 * em} fill="none" stroke={ink.M} markerEnd={'url(#' + id + ')'} />)}
      <Label x={left} y={5 * em} color={ink.X}>□ m*₀</Label><Label x={right} y={5 * em} color={ink.X}>■ m*₁</Label>
    </svg>
    <p>Target branch: all 1,629 sampled L* rows enter both prediction columns below, including positions with missing Y*.</p>
    <table className="causal-prediction-matrix">
      <caption>Same sampled positions, same β*, two forced treatment copies</caption>
      <thead><tr><th scope="col">L*ⱼ</th><th scope="col">□ A=0</th><th scope="col">■ A=1</th></tr></thead>
      <tbody>{[['1', '4'], ['2', '4'], ['3', '1']].map(([position, source]) => <tr key={position}><th scope="row">L*{position}<small>row {source}</small></th><td>m*₀(L*{position})</td><td>m*₁(L*{position})</td></tr>)}<tr><th scope="row">…</th><td>…</td><td>…</td></tr><tr><th scope="row">L*ₙ</th><td>m*₀(L*ₙ)</td><td>m*₁(L*ₙ)</td></tr></tbody>
      <tfoot><tr><th scope="row">↓ sum</th><td>Σ m*₀<br />÷ 1,629<br /><strong>μ*₀</strong></td><td>Σ m*₁<br />÷ 1,629<br /><strong>μ*₁</strong></td></tr></tfoot>
    </table>
    <div className="causal-bootstrap-difference"><span>μ*₁</span><span>−</span><span>μ*₀</span><span>→</span><strong>one Δ*</strong></div>
    <Caption>Here n=1,629. For every position j, m*ₐ(L*ⱼ) uses the same refitted β* with A=a and the corresponding interaction column rebuilt. Duplicate source 4 contributes twice to each average. Both the fit and the empirical target change across resamples.</Caption>
    <p>One Δ* enters the stored distribution below. The illustrated index prefix is schematic; no numerical value is assigned to this illustrative replicate.</p>
  </div>;
}
