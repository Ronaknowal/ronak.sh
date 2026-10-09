import { useState } from 'react';
import { ensembleNumber } from '../../data/ensemble-methods-models.js';
import { ensembleContextProducts, ensembleTypedScore, printedContextTheta, printedOOFTheta, printedOOFQueries } from '../../data/ensemble-context-flow-models.js';
import { EnsembleFlowFigure, EnsembleFlowCanvas } from './EnsembleFlowCombination.jsx';
import { EnsembleQuantity } from './EnsembleFlowControls.jsx';
import './ensemble-flow-context.css';

const aColour='#7fc9ba',bColour='#b2b7e1',amber='#e8bb60';
const n=x=>ensembleNumber(x,9);
function Arrow({x1,y1,x2,y2,colour=amber}) {
 return <><path d={`M${x1},${y1} H${x2}`} stroke={colour} fill="none"/><path d={`M${x2-6},${y2-4} L${x2},${y2} L${x2-6},${y2+4}`} stroke={colour} fill="none"/></>;
}
function Value({x,y,label,value,colour=amber,width=184}) {
 return <g><text x={x} y={y-26} fill={colour}>{label}</text><rect x={x} y={y-19} width={width} height={38} fill="#17171b" stroke={colour}/><text x={x+10} y={y+6}>{n(value)}</text></g>;
}
function Multiply({x,y,weight,colour=amber}) {
 return <g><circle cx={x} cy={y} r={20} fill="#17171b" stroke={colour}/><text x={x} y={y+6} textAnchor="middle">×</text><path d={`M${x},${y-20} V${y-50}`} stroke={colour}/><text x={x-60} y={y-66} fill={colour}>weight {n(weight)}</text></g>;
}

export function ContextProductFigure() {
 const [a,setA]=useState(.2),[b,setB]=useState(.8),[z,setZ]=useState(0),[revision,setRevision]=useState(0),s=ensembleContextProducts(a,b,z);
 return <EnsembleFlowFigure job="D42" title="Make context change a member's coefficient through actual product inputs">
  <EnsembleFlowCanvas width={1070} height={414} title="Two context-dependent weights multiply actual A/B forecasts, then their products join; additive slopes stay fixed">
   <text x={16} y={26}>Retained exact constructed relation · context z={n(z)}</text>
   {[a,b].map((value,i)=>{const y=132+i*132,colour=i?bColour:aColour;return <g key={i}>
    <Value x={16} y={y} label={`Member ${i?'B':'A'} probability`} value={value} colour={colour}/><Arrow x1={200} y1={y} x2={308} y2={y} colour={colour}/>
    <Multiply x={328} y={y} weight={s.weights[i]} colour={colour}/><text x={263} y={y-91}>{i?'z':'1−z'}</text>
    <Arrow x1={348} y1={y} x2={431} y2={y} colour={colour}/><Value x={431} y={y} label={i?'z×pB':'(1−z)×pA'} value={s.products[i]} colour={colour}/>
    <path d={`M615,${y} H698 V323`} stroke={colour} fill="none"/></g>;})}
   <circle cx={698} cy={345} r={20} fill="#17171b" stroke={amber}/><text x={698} y={351} textAnchor="middle">+</text><Arrow x1={718} y1={345} x2={831} y2={345}/>
   <Value x={831} y={345} label="desired probability" value={s.desired}/>
   <text x={16} y={402}>Effective slopes: ∂output/∂pA={n(1-z)}, ∂output/∂pB={n(z)}. These weights sum to 1.</text>
  </EnsembleFlowCanvas>
  <div className="ensemble-flow-controls"><EnsembleQuantity label="Member A probability" value={a} onChange={setA} min={0} max={1} revision={revision}/>
   <EnsembleQuantity label="Member B probability" value={b} onChange={setB} min={0} max={1} revision={revision}/>
   <EnsembleQuantity label="Context z" value={z} onChange={setZ} min={0} max={1} revision={revision}/>
   <button onClick={()=>{setA(.2);setB(.8);setZ(0);setRevision(x=>x+1);}}>Reset context products</button></div>
  <p aria-live="polite">Current products [{n(s.products[0])}, {n(s.products[1])}] sum to {n(s.desired)}.
   An additive context-only column keeps member slopes .5/.5 in the retained eight-row fit; its current prediction is {n(s.additive)}.</p>
  <EnsembleFlowCanvas width={1070} height={526} title="The original additive fit retains fixed slopes; the separate penalized twelve-row fit sums parallel product contributions and its intercept">
   <text x={16} y={27}>Original eight-row additive fit: β=[0,.5,.5,0], MSE .125; slopes do not switch with z.</text>
   <text x={16} y={62}>.5×pA={n(s.additiveProducts[0])} + .5×pB={n(s.additiveProducts[1])} + 0×z → {n(s.additive)}</text>
   <text x={16} y={113}>Separate twelve-row penalized N5 fit: printed θ=[{printedContextTheta.map(n).join(', ')}]</text>
   <Value x={16} y={181} label="θA×[(1−z)pA]" value={s.learnedProducts[0]} colour={aColour}/><path d="M200,181 H650 V378" stroke={aColour} fill="none"/>
   <Value x={16} y={267} label="θB×[z pB]" value={s.learnedProducts[1]} colour={bColour}/><path d="M200,267 H650 V378" stroke={bColour} fill="none"/>
   <Value x={16} y={353} label="printed intercept" value={printedContextTheta[0]}/><path d="M200,353 H650 V378" stroke={amber} fill="none"/>
   <circle cx={650} cy={398} r={20} fill="#17171b" stroke={amber}/><text x={650} y={404} textAnchor="middle">Σ</text><Arrow x1={670} y1={398} x2={829} y2={398}/>
   <Value x={829} y={398} label="approximate forward" value={s.learned}/>
   <text x={16} y={450}>N5 effective slopes θA(1−z)={n(s.learnedSlopes[0])}, θB z={n(s.learnedSlopes[1])}.</text>
   <text x={16} y={486}>Different data and penalty: this fit is not the old exact [1,1] gate or a new measured improvement.</text>
   <text x={16} y={519}>Displayed coefficient precision is nine decimal places; computed forwards are approximate.</text>
  </EnsembleFlowCanvas>
 </EnsembleFlowFigure>;
}

export function TypedScoreLinkFigure() {
 const fixed=ensembleTypedScore();
 return <EnsembleFlowFigure job="D43" title="Keep a probability and a margin typed through their score products and output link">
  <EnsembleFlowCanvas width={1060} height={382} title="Probability .8 times 2 and margin 2 times .5 plus intercept −1 give score 1.6 and sigmoid .832018">
   <text x={16} y={26}>Fixed constructed forward · β₀=−1, βprobability=2, βmargin=.5</text>
   {[.8,2].map((value,i)=>{const y=121+i*128,colour=i?bColour:aColour;return <g key={i}>
    <Value x={16} y={y} label={i?'margin toward class 1':'class 1 probability'} value={value} colour={colour}/><Arrow x1={200} y1={y} x2={305} y2={y} colour={colour}/>
    <Multiply x={325} y={y} weight={fixed.theta[i+1]} colour={colour}/><Arrow x1={345} y1={y} x2={431} y2={y} colour={colour}/>
    <Value x={431} y={y} label="score contribution" value={fixed.products[i]} colour={colour}/><path d={`M615,${y} H678 V300`} stroke={colour} fill="none"/></g>;})}
   <circle cx={678} cy={320} r={20} fill="#17171b" stroke={amber}/><text x={678} y={326} textAnchor="middle">Σ</text>
   <text x={16} y={329}>−1 + 1.6 + 1 = score {n(fixed.score)}</text><Arrow x1={698} y1={320} x2={756} y2={320}/>
   <circle cx={776} cy={320} r={20} fill="#17171b" stroke={amber}/><text x={776} y={326} textAnchor="middle">σ</text><Arrow x1={796} y1={320} x2={847} y2={320}/>
   <Value x={847} y={320} label="class 1 probability" value={fixed.probability}/><text x={16} y={373}>A margin of 2 never becomes an input probability; only the final sigmoid gives a probability.</text>
  </EnsembleFlowCanvas>
  <EnsembleFlowCanvas width={1380} height={265} title="Separately retained learned N2 theta reads two named probability columns from its actual recorded changed queries">
   <text x={16} y={26}>Separate learned N2 route: [line:P(1), bayes:P(1)] → saved score θ → sigmoid.</text>
   <text x={16} y={62}>Printed θ=[{printedOOFTheta.map(n).join(', ')}]; both inputs below are probabilities.</text>
   {printedOOFQueries.map((query,i)=>{const t=ensembleTypedScore(query.columns,printedOOFTheta),y=121+i*78;return <g key={i}>
    <text x={16} y={y-23}>recorded raw query [{query.raw.join(', ')}]</text><text x={16} y={y+7}>columns [{query.columns.map(n).join(', ')}]</text>
    <Arrow x1={530} y1={y} x2={576} y2={y}/><text x={593} y={y+7}>θ₀ + {n(t.products[0])} + {n(t.products[1])}</text>
    <Arrow x1={990} y1={y} x2={1040} y2={y}/><text x={1060} y={y+7}>σ({n(t.score)})={n(t.probability)}</text>
   </g>;})}
   <text x={16} y={256}>Nine-decimal printed inputs/θ yield approximate forwards; the original complete stdout remains alongside its program.</text>
  </EnsembleFlowCanvas>
 </EnsembleFlowFigure>;
}
