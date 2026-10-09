import { flowNumber } from './LessonFlow.jsx';
import { softmax } from '../../data/vision-transformer-models.js';
import { VisionFlowCells, VisionFlowDrawing, VisionFlowWire, visionFlowColors as colors } from './VisionTransformerFlowFigures.jsx';

const plus=(a,b)=>a.map((value,index)=>value+b[index]);
const normalize=row=>{
  const mean=row.reduce((a,b)=>a+b,0)/row.length;
  const divisor=Math.sqrt(row.reduce((a,b)=>a+(b-mean)**2,0)/row.length+1e-5);
  return row.map(value=>(value-mean)/divisor);
};

function NormPlacementRoute({ post }) {
  const x=[1,2,3,4],bias=[.5,-1,2,0];
  const first=post?plus(x,bias):normalize(x);
  const second=post?normalize(first):plus(first,bias);
  const output=plus(x,second);
  return <VisionFlowDrawing width={340} height={810} label={`${post?'Residual post-normalization':'Pre-normalization'} with an explicitly constructed identity affine branch. Every incoming coordinate, first and second operation, saved bypass and final addition is shown; gain 1,offset 0,epsilon 0.00001.`}>
    {arrowId=><>
      <text x="20" y="24">{post?'Post: x + LN(branch(x))':'Pre: x + branch(LN(x))'}</text>
      <VisionFlowCells x={20} y={78} rows={[x]} cellWidth={76} label="Saved input x" role="input" />
      <VisionFlowWire path="M172 112 V165" arrowId={arrowId} />
      <rect x="42" y="165" width="258" height="38" fill="none" stroke={colors.operation} />
      <text x="171" y="190" textAnchor="middle">{post?'Identity W × x + branch bias':'LN: all 4, gain 1, offset 0'}</text>
      <VisionFlowWire path="M171 203 H7 V281 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={264} rows={[first]} cellWidth={76} label="First operation output" />
      <VisionFlowCells x={20} y={360} rows={[bias]} cellWidth={76} label="Constructed learned branch bias" role="parameter" />
      {post&&<VisionFlowWire path="M324 377 H335 V184 H300" arrowId={arrowId} />}
      <VisionFlowWire path="M324 281 H331 V460 H300" arrowId={arrowId} />
      {!post&&<VisionFlowWire path="M172 394 V441" arrowId={arrowId} />}
      <rect x="42" y="441" width="258" height="38" fill="none" stroke={colors.operation} />
      <text x="171" y="466" textAnchor="middle">{post?'LN: all 4, gain 1, offset 0':'Identity W × norm + bias'}</text>
      <VisionFlowWire path="M171 479 H7 V558 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={541} rows={[second]} cellWidth={76} label="Complete branch write" />
      <VisionFlowWire path="M172 575 V631" arrowId={arrowId} />
      <VisionFlowWire path="M20 95 H7 V648 H155" arrowId={arrowId} />
      <circle cx="172" cy="648" r="17" fill="none" stroke={colors.operation} />
      <text x="172" y="653" textAnchor="middle">+</text>
      <VisionFlowWire path="M172 665 H7 V738 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={721} rows={[output]} cellWidth={76} label="Saved input + complete write" />
      <text x="20" y="792">Constructed affine branch here.</text>
    </>}
  </VisionFlowDrawing>;
}

export function VisionNormPlacementDrawing() {
  return <div className="vision-flow-parallel"><NormPlacementRoute post={false}/><NormPlacementRoute post/></div>;
}

export function VisionCosineScaleDrawing({ logScale=Math.log(10) }) {
  const scale=Math.exp(Math.min(logScale,Math.log(100)));
  return <VisionFlowDrawing width={340} height={640} label="The constructed SwinV2 cosine match: query [3,4] and key [0,2] divide by their respective lengths, dot to 0.8 and multiply a learned exponentiated log scale capped at 100. Epsilon normalization handles the zero vector separately.">
    {arrowId=><>
      <VisionFlowCells x={20} y={60} rows={[[3,4],[0,2]]} cellWidth={96} label="Query (top), key (bottom)" />
      <VisionFlowWire path="M116 128 V175" arrowId={arrowId}/>
      <rect x="30" y="175" width="230" height="34" fill="none" stroke={colors.operation}/>
      <text x="145" y="198" textAnchor="middle">÷ own lengths: 5 and 2</text>
      <VisionFlowWire path="M145 209 H7 V276 H20" arrowId={arrowId}/>
      <VisionFlowCells x={20} y={259} rows={[[.6,.8],[0,1]]} cellWidth={96} label="Unit query, unit key" />
      <VisionFlowWire path="M116 327 V374" arrowId={arrowId}/>
      <rect x="30" y="374" width="230" height="34" fill="none" stroke={colors.operation}/>
      <text x="145" y="397" textAnchor="middle">Sum products: 0.8</text>
      <VisionFlowCells x={20} y={475} rows={[[scale]]} cellWidth={96} label="exp(min(log scale, log 100))" role="parameter" />
      <VisionFlowWire path="M145 408 H280 V548 H214" arrowId={arrowId}/>
      <VisionFlowWire path="M116 509 V548 H180" arrowId={arrowId}/>
      <circle cx="197" cy="548" r="17" fill="none" stroke={colors.operation}/>
      <text x="197" y="553" textAnchor="middle">×</text>
      <VisionFlowWire path="M197 565 H7 V614 H149" arrowId={arrowId}/>
      <VisionFlowCells x={149} y={597} rows={[[.8*scale]]} cellWidth={96} label="Scaled cosine score" />
    </>}
  </VisionFlowDrawing>;
}

export function VisionContinuousBiasDrawing() {
  const offset=[2,-1];
  const normalized=offset.map(value=>8*value/3);
  const transformed=normalized.map(value=>Math.sign(value)*Math.log2(Math.abs(value)+1)/3);
  const map=[[1,1],[1,-1]];
  const hidden=map.map(row=>Math.max(0,row.reduce((total,value,index)=>total+value*transformed[index],0)));
  const final=.5*hidden[0]-.25*hidden[1];
  const bias=16/(1+Math.exp(-final));
  return <VisionFlowDrawing width={340} height={1000} label="A constructed continuous relative-position bias for a four-wide window. Query-minus-key [2,-1] is scaled by 8/3, transformed by signed log2(1+absolute)/3, then enters actual stipulated MLP maps and the 16 sigmoid output. These are illustrative coefficients, not a released checkpoint.">
    {arrowId=><>
      <VisionFlowCells x={20} y={60} rows={[offset]} cellWidth={96} label="Query−key offset, window side 4" role="input" />
      <VisionFlowWire path="M116 94 V140" arrowId={arrowId}/>
      <rect x="25" y="140" width="272" height="34" fill="none" stroke={colors.operation}/>
      <text x="161" y="163" textAnchor="middle">÷(4−1) then ×8</text>
      <VisionFlowWire path="M161 174 H7 V241 H20" arrowId={arrowId}/>
      <VisionFlowCells x={20} y={224} rows={[normalized]} cellWidth={96} label="Normalized offsets" />
      <VisionFlowWire path="M116 258 V303" arrowId={arrowId}/>
      <rect x="25" y="303" width="272" height="34" fill="none" stroke={colors.operation}/>
      <text x="161" y="326" textAnchor="middle">sign(v) × log₂(1+|v|) ÷3</text>
      <VisionFlowWire path="M161 337 H7 V404 H20" arrowId={arrowId}/>
      <VisionFlowCells x={20} y={387} rows={[transformed]} cellWidth={96} label="Continuous bias MLP input" />
      <VisionFlowCells x={20} y={484} rows={map} cellWidth={96} label="Stipulated first W, zero bias" role="parameter" />
      <VisionFlowWire path="M212 404 H321 V588 H281" arrowId={arrowId}/>
      <VisionFlowWire path="M116 552 V570" arrowId={arrowId}/>
      <rect x="25" y="570" width="256" height="36" fill="none" stroke={colors.operation}/>
      <text x="153" y="594" textAnchor="middle">W × transformed row, ReLU</text>
      <VisionFlowWire path="M153 606 H7 V675 H20" arrowId={arrowId}/>
      <VisionFlowCells x={20} y={658} rows={[hidden]} cellWidth={96} label="Two hidden coordinates" />
      <VisionFlowCells x={20} y={754} rows={[[.5,-.25]]} cellWidth={96} label="Stipulated second W, zero bias" role="parameter" />
      <VisionFlowWire path="M212 675 H321 V845 H281" arrowId={arrowId}/>
      <VisionFlowWire path="M116 788 V827" arrowId={arrowId}/>
      <rect x="25" y="827" width="256" height="36" fill="none" stroke={colors.operation}/>
      <text x="153" y="851" textAnchor="middle">Second W, then 16×sigmoid</text>
      <VisionFlowWire path="M153 863 H7 V933 H105" arrowId={arrowId}/>
      <VisionFlowCells x={105} y={916} rows={[[bias]]} cellWidth={96} label="One head's score bias" />
    </>}
  </VisionFlowDrawing>;
}

export function VisionFusionDrawing() {
  const first=[-3,-2,0],second=[2,3,0];
  const meanLogits=first.map((value,index)=>(value+second[index])/2);
  const firstP=softmax(first),secondP=softmax(second);
  const meanP=firstP.map((value,index)=>(value+secondP[index])/2);
  return <VisionFlowDrawing width={340} height={1000} label="Two constructed three-class heads have different nonlinear fusion routes. Averaging logits picks class 1; averaging each head's probabilities picks class 2. Every complete head vector and computed distribution is shown.">
    {arrowId=><>
      <VisionFlowCells x={20} y={60} rows={[first,second]} cellWidth={96} label="CLS (top), DIST (bottom) logits" />
      <VisionFlowWire path="M164 128 V174" arrowId={arrowId}/>
      <rect x="43" y="174" width="242" height="34" fill="none" stroke={colors.operation}/>
      <text x="164" y="197" textAnchor="middle">Mean logits, then softmax</text>
      <VisionFlowWire path="M164 208 H7 V276 H20" arrowId={arrowId}/>
      <VisionFlowCells x={20} y={259} rows={[meanLogits,softmax(meanLogits)]} cellWidth={96} label="Mean logits; resulting probabilities" />
      <text x="20" y="363">Route A chooses class 1.</text>
      <VisionFlowWire path="M308 94 H335 V445 H285" arrowId={arrowId}/>
      <rect x="43" y="428" width="242" height="34" fill="none" stroke={colors.operation}/>
      <text x="164" y="451" textAnchor="middle">Softmax each head</text>
      <VisionFlowWire path="M164 462 H7 V530 H20" arrowId={arrowId}/>
      <VisionFlowCells x={20} y={513} rows={[firstP,secondP]} cellWidth={96} label="Separate head probabilities" />
      <VisionFlowWire path="M164 581 V631" arrowId={arrowId}/>
      <rect x="43" y="631" width="242" height="34" fill="none" stroke={colors.operation}/>
      <text x="164" y="654" textAnchor="middle">Mean probability rows</text>
      <VisionFlowWire path="M164 665 H7 V733 H20" arrowId={arrowId}/>
      <VisionFlowCells x={20} y={716} rows={[meanP]} cellWidth={96} label="Mean probabilities" />
      <text x="20" y="798">Route B chooses class 2.</text>
      <text x="20" y="833">Softmax is nonlinear.</text>
      <text x="20" y="868">These two averages are different.</text>
    </>}
  </VisionFlowDrawing>;
}
