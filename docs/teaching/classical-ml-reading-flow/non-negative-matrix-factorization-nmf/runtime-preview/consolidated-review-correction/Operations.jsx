import React from 'react';
import {colors} from './Drawing.jsx';
import {fmt} from './nmf-model.js';

// Operand tables retain real axes and values; these small ports expose the operation.
export function Operation({label,children}) {
  return <div className="nmf-operation" role="group" aria-label={label}>{children}</div>;
}
export function Port({label,symbol='→'}) {
  return <div className="nmf-port"><span className={symbol === '→' ? 'nmf-port-arrow' : undefined} aria-hidden="true">{symbol}</span><span>{label}</span></div>;
}
export function DotProduct({left,right,ids,leftLabel,rightLabel,resultLabel,componentTerms=false}) {
  const terms=left.map((v,i)=>v*right[i]);
  return <div className="nmf-dot-product"><p className="nmf-object-label">{resultLabel}</p><div className="nmf-array-scroll" tabIndex={0} role="region" aria-label={`${resultLabel}; each paired operand and its contribution`}><table><thead><tr><th scope="col">Matched axis</th><th scope="col">{leftLabel}</th><th scope="col">×</th><th scope="col">{rightLabel}</th><th scope="col">Contribution</th></tr></thead><tbody>{terms.map((v,i)=><tr key={i} style={componentTerms ? {color:colors[i%8]} : undefined}><th scope="row">{ids[i]}</th><td>{fmt(left[i])}</td><td>×</td><td>{fmt(right[i])}</td><td>{fmt(v)}</td></tr>)}</tbody><tfoot><tr><th scope="row" colSpan={4}>Add the contributions →</th><td>{fmt(terms.reduce((a,b)=>a+b,0))}</td></tr></tfoot></table></div></div>;
}
