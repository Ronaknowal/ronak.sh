import { VisionFlowCells as Cells, VisionFlowDrawing as Drawing, VisionFlowWire as Wire, visionFlowColors as colors } from './VisionTransformerFlowFigures.jsx';

export const visionDenseHandCase=(()=>{
  const features=[[[1,0],[0,1]],[[1,1],[0,0]]],weight=[2,-1],bias=.5;
  const coarse=features.map(row=>row.map(value=>value[0]*weight[0]+value[1]*weight[1]+bias));
  const weights=[0,.25,.75,1];
  const fine=weights.map(y=>weights.map(x=>(1-y)*((1-x)*coarse[0][0]+x*coarse[0][1])+y*((1-x)*coarse[1][0]+x*coarse[1][1])));
  return {features,weight,bias,coarse,fine};
})();

export function VisionDenseHeadDrawing() {
  const {features,weight,bias,coarse,fine}=visionDenseHandCase;
  return <Drawing width={340} height={1070} label="A constructed two-by-two grid of two-coordinate patch features enters the same learned scalar map 2x0−x1+0.5 at every location. The four actual coarse scores are bilinearly resized to a four-by-four score grid with align-corners false. Sixteen output values do not mean sixteen independently measured feature vectors.">
    {id=><>
      <text x="20" y="25">Constructed 2×2 feature grid</text>
      {features.flat().map((row,index)=><Cells key={index} x={20+index%2*164} y={82+Math.floor(index/2)*95}
        rows={[row]} cellWidth={68} label={['Top-left','Top-right','Bottom-left','Bottom-right'][index]}/>)}
      <Cells x={20} y={305} rows={[weight]} cellWidth={96} label="Shared learned W" role="parameter"/>
      <Cells x={232} y={305} rows={[[bias]]} cellWidth={76} label="Bias" role="parameter"/>
      <Wire path="M156 99 H172 V224 H333 V369 H102 V388" arrowId={id}/>
      <Wire path="M320 99 H336 V369 H234 V388" arrowId={id}/>
      <Wire path="M320 194 H331 V407 H300" arrowId={id}/>
      <Wire path="M88 211 H7 V407 H40" arrowId={id}/>
      <Wire path="M164 339 V388" arrowId={id}/><Wire path="M270 339 H326 V407 H300" arrowId={id}/>
      <rect x="40" y="388" width="260" height="38" fill="none" stroke={colors.operation}/>
      <text x="170" y="413" textAnchor="middle">Shared W × feature + bias</text>
      <Wire path="M170 426 H7 V498 H20" arrowId={id}/>
      <Cells x={20} y={481} rows={coarse} cellWidth={142} label="Four coarse scores; not class labels"/>
      <Wire path="M162 549 V608" arrowId={id}/>
      <rect x="30" y="608" width="278" height="38" fill="none" stroke={colors.operation}/>
      <text x="169" y="633" textAnchor="middle">Bilinear resize 2×2 → 4×4</text>
      <Wire path="M169 646 H7 V718 H20" arrowId={id}/>
      <Cells x={20} y={701} rows={fine} cellWidth={76} label="Actual interpolated score grid"/>
      <text x="20" y="903">16 scores from 4 measured features.</text>
      <text x="20" y="932">Do not interpolate hard class IDs.</text>
      <text x="20" y="961">Learn W/b using actual task targets.</text>
      <text x="20" y="1015">This example has no physical units.</text>
      <text x="20" y="1042">Height needs measured target data.</text>
    </>}
  </Drawing>;
}
