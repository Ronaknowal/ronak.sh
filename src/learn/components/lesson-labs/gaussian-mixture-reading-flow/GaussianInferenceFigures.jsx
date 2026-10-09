import {useState} from 'react';
import {FlowLab,FlowControls,FlowReadout,flowNumber} from "../LessonFlow.jsx";
import {GaussianDrawing,GaussianQuantity} from "./GaussianScalarFigures.jsx";
import {MixtureArrow,gaussianMixtureColours} from "./GaussianMixtureFigures.jsx";
import {savedPartition,savedQuery,operationRoles} from "./gaussian-inference-models.mjs";
const {left:LEFT,right:RIGHT,sum:SUM,ink:INK,reference:REFERENCE}=gaussianMixtureColours,componentColours=[LEFT,RIGHT];
const speciesColours=['#d9a8d5','#e6b786','#df8f9d'];
const number=(v,digits=9)=>v!==0&&Math.abs(v)<1e-7?v.toExponential(5).replace(/-/g,'−'):flowNumber(v,digits);
function SpeciesGlyph({species,x,y}) {
  const index=['setosa','versicolor','virginica'].indexOf(species),common={fill:'none',stroke:speciesColours[index],strokeWidth:2};
  return index===0?<rect x={x-5} y={y-5} width="10" height="10" {...common}/>:index===1?<path d={`M${x},${y-6} l6,12 h-12 Z`} {...common}/>:<path d={`M${x},${y-6} l6,6 l-6,6 l-6,-6 Z`} {...common}/>;
}

export function GaussianSavedPartition() {
  const state=savedPartition(),renamed=savedPartition(true);
  return <>
    <GaussianDrawing id="D49" title="The same thirty reserved IDs have a component partition and separate species annotations" width={850} height={width=>width<700?1770:1055} adaptive description={`Only retained test outcomes. Species counts ${state.speciesCounts}; component counts ${state.componentCounts}; contingency ${state.contingency.flat()}; ARI ${state.ari}. Species never entered fitting. Renaming already saved component columns preserves every observation pair.`}>
      {width=>{const narrow=width<700,columns=narrow?3:6,rowHeight=98,tableY=narrow?1250:755,conclusionY=tableY+(narrow?360:175);return <>
        <text x="20" y="25">Filled circle: saved component 0/1</text>
        <text x="20" y="55" fill={LEFT}>0 teal</text><text x="135" y="55" fill={RIGHT}>1 blue</text>
        {state.speciesOrder.map((name,k)=><g key={name}><SpeciesGlyph species={name} x={27} y={90+k*30}/><text x="45" y={96+k*30} fill={speciesColours[k]}>{k+1}. {name}: {state.speciesCounts[k]}</text></g>)}
        <text x="20" y="203">Species marks are annotation, not fit input.</text>
        {state.rows.map((row,i)=>{const x=30+(i%columns)*(width-50)/columns,y=242+Math.floor(i/columns)*rowHeight;return <g key={row.id} data-partition-id={row.id} data-partition-component={row.component} data-partition-species={row.species}>
          <text x={x} y={y}>ID {row.id}</text><circle cx={x+9} cy={y+26} r="5" fill={componentColours[row.component]}/><text x={x+24} y={y+32} fill={componentColours[row.component]}>{row.component}</text><SpeciesGlyph species={row.species} x={x+9} y={y+57}/><text x={x+24} y={y+63}>{state.speciesOrder.indexOf(row.species)+1}</text>
        </g>;})}
        {[state,renamed].map((table,index)=>{const left=narrow?20:20+index*width/2,top=tableY+(narrow?index*185:0),colours=index?[RIGHT,LEFT]:componentColours;return <g key={index}>
          <text x={left} y={top}>{index?'Renamed saved IDs: 0 ↔ 1':'Original saved component names'}</text>
          <text x={left+155} y={top+35} fill={colours[0]}>0</text><text x={left+220} y={top+35} fill={colours[1]}>1</text>
          {table.contingency.map((row,k)=><g key={k}><text x={left} y={top+70+k*34}>{state.speciesOrder[k]}</text>{row.map((v,j)=><text key={j} x={left+155+j*65} y={top+70+k*34} fill={colours[j]} data-contingency-cell={`${index},${k},${j}`}>{v}</text>)}</g>)}
        </g>;})}
        <text x="20" y={conclusionY}>435 observation pairs; ARI {number(state.ari)}</text>
        <text x="20" y={conclusionY+35}>Rename moves names and columns only.</text>
        <text x="20" y={conclusionY+70}>Same-group pairs and ARI stay unchanged.</text>
        <text x="20" y={conclusionY+105}>This does not recompute any prediction.</text>
      </>;}}
    </GaussianDrawing>
    <p>The filled component circles and outlined species shapes describe the same reserved IDs in two ways. The species legend assigns squares, triangles and diamonds to its three names; the small 1/2/3 beside each shape refers to that legend. Summing the contingency cells gives 6, 9 and 15 species observations, and 6 and 24 component assignments. Purely exchanging the names of the saved component columns changes neither pair membership nor ARI. It does not repeat argmax under permuted fitted parameters.</p>
  </>;
}

export function GaussianSavedQueryLab() {
  const [length,setLength]=useState(5.5),[width,setWidth]=useState(4.2),[reset,setReset]=useState(0),state=savedQuery(length,width);
  return <FlowLab id="gmm-d50" label="Change an unlabelled raw query under a fixed retained Gaussian mixture">
    <GaussianDrawing id="D50" title="An unlabelled query passes through a fixed training transform and two saved Gaussian components" width={850} height={width=>width<700?1810:1520} adaptive description={`Separate unlabelled query ${state.raw}cm. Measured ID34 remains fixed at5.5/4.2cm with test role. Standardized query ${state.standardized}, log weighted terms ${state.terms.map(t=>t.logWeightedDensity)}, standardized log density ${state.logDensity}, NLL ${state.nll}, conditional shares ${state.terms.map(t=>t.share)}. NLL threshold10 is illustrative, not calibrated; no species prediction or fitting.`}>
      {extent=>{const plotLeft=55,plotRight=extent-28,x=v=>plotLeft+(v-3)*(plotRight-plotLeft)/6,y=v=>343-(v-1)*46,barWidth=extent-70,narrow=extent<700,branchY=855,normalizationY=narrow?1340:1050;return <>
        <text x="20" y="25">Fixed model and training transform</text>
        <text x="20" y="55">● Measured ID 34 stays at 5.5/4.2 cm.</text>
        <text x="20" y="85">◇ Separate query; no species or test role</text>
        <line x1={plotLeft} x2={plotRight} y1="343" y2="343" stroke={REFERENCE}/><line x1={plotLeft} x2={plotLeft} y1="159" y2="343" stroke={REFERENCE}/>
        {[3,5,7,9].map(v=><text key={v} x={x(v)} y="370" textAnchor="middle">{v}</text>)}
        {[1,3,5].map(v=><text key={v} x="39" y={y(v)+5} textAnchor="end">{v}</text>)}
        <text x="20" y="126">Sepal width / cm</text><text x="20" y="402">Sepal length / cm</text>
        <circle cx={x(5.5)} cy={y(4.2)} r="5" fill={INK}/><text x={x(5.5)+12} y={y(4.2)-12}>34</text>
        <path d={`M${x(length)},${y(width)-9} l9,9 l-9,9 l-9,-9 Z`} fill="none" stroke={SUM} strokeWidth="2" data-query-raw={`${length},${width}`}/>
        <text x="20" y="445">Query: [{number(length)}, {number(width)}] cm</text>
        {['Length','Width'].map((name,k)=>{const yy=484+k*125;return <g key={name}>
          <text x="20" y={yy}>{name}: subtract training mean {number(state.scaleMean[k])}</text>
          <text x="20" y={yy+31}>Residual {number(state.residual[k])}</text>
          <text x="20" y={yy+62}>Divide by training scale {number(state.scale[k])}</text>
          <text x="20" y={yy+93}>Standardized {number(state.standardized[k])}</text>
        </g>;})}
        <text x="20" y="779">The same standardized pair enters both.</text>
        <MixtureArrow points={[[extent/2,792],[extent/2,818]]}/>
        {state.terms.map((term,k)=>{const yy=branchY+(narrow?k*195:0),left=narrow?20:20+k*extent/2;return <g key={term.id} data-query-component={term.id} data-query-log-joint={term.logWeightedDensity} data-query-share={term.share}>
          <text x={left} y={yy} fill={componentColours[k]}>Component {term.id}; weight {number(term.weight)}</text>
          <text x={left} y={yy+32}>Gaussian log height {number(term.logDensity)}</text>
          <text x={left} y={yy+64}>+ log weight {number(term.logPrior)}</text>
          <text x={left} y={yy+96} fill={componentColours[k]}>Log weighted height {number(term.logWeightedDensity)}</text>
          <text x={left} y={yy+128}>Subtract max {number(state.maximum)}</text>
          <text x={left} y={yy+160}>Exp shifted term {number(term.shiftedExponential)}</text>
        </g>;})}
        <text x="20" y={normalizationY}>Shifted sum {number(state.denominator)}</text>
        <text x="20" y={normalizationY+35}>Log sum + max = {number(state.logDensity)}</text>
        <text x="20" y={normalizationY+70}>Standardized-coordinate log density</text>
        <rect x="35" y={normalizationY+100} width={barWidth*state.terms[0].share} height="17" fill={LEFT}/><rect x={35+barWidth*state.terms[0].share} y={normalizationY+100} width={barWidth*state.terms[1].share} height="17" fill={RIGHT}/>
        <text x="20" y={normalizationY+148} fill={LEFT}>0 share {number(state.terms[0].share)}</text><text x="20" y={normalizationY+178} fill={RIGHT}>1 share {number(state.terms[1].share)}</text>
        <text x="20" y={normalizationY+220}>NLL = −log density = {number(state.nll)}</text>
        <text x="20" y={normalizationY+255} fill={SUM}>Illustrative NLL &gt; 10: {state.illustrativeAction?'act':'no action'}</text>
        <text x="20" y={normalizationY+288}>Not calibrated by the Iris collection.</text>
        <text x="20" y={normalizationY+325}>Membership is not a species probability.</text>
      </>;}}
    </GaussianDrawing>
    <FlowControls key={reset}><GaussianQuantity name="Query sepal length / cm" value={length} onChange={setLength} min={3} max={9} step={0.1}/><GaussianQuantity name="Query sepal width / cm" value={width} onChange={setWidth} min={1} max={5} step={0.1}/><button type="button" onClick={()=>{setLength(5.5);setWidth(4.2);setReset(v=>v+1);}}>Reset</button></FlowControls>
    <FlowReadout>For the separate query <strong>{number(length)} / {number(width)} cm</strong>, standardized log density is <strong>{number(state.logDensity)}</strong>, NLL is <strong>{number(state.nll)}</strong>, and component shares are <strong>{number(state.terms[0].share)} / {number(state.terms[1].share)}</strong>. The measured ID 34 and fitted parameters remain fixed.</FlowReadout>
  </FlowLab>;
}

function ArrayDrawing({rows,x,y,width,colour=INK,digits=4}) {
  const columns=rows[0].length,cellWidth=width/columns;
  return <g><path d={`M${x+7},${y-18} H${x} V${y+(rows.length-1)*35+10} H${x+7} M${x+width-7},${y-18} H${x+width} V${y+(rows.length-1)*35+10} H${x+width-7}`} fill="none" stroke={REFERENCE}/>
    {rows.map((row,i)=>row.map((value,j)=><text key={`${i},${j}`} x={x+(j+0.5)*cellWidth} y={y+i*35} textAnchor="middle" fill={typeof colour==='function'?colour(j):colour}>{number(value,digits)}</text>))}
  </g>;
}

export function GaussianOperationRoles() {
  const state=operationRoles();
  return <><p>For generation, the categorical selector z chooses component k. The separate noise vector ε has two independent standard-normal coordinates, each with mean 0 and variance 1. The supplied ε coordinates below illustrate those draws. Select k first, then form x = μₖ + Lₖ ε using that component’s mean and covariance factor.</p>
  <GaussianDrawing id="D51" title="One fixed mixture supports density scoring, conditional membership, component decisions and categorical-first generation" width={850} height={2710} adaptive description={`A constructed batch of four separate unlabelled queries produces four log densities, scalar mean ${state.score}, a4by2 responsibility matrix and four argmax component IDs. A separate supplied categorical uniform and standard-normal-coordinate trace uses ε for its two-coordinate noise vector; z is the categorical component selector. Select component k first, then generate each row as μ_k + L_k ε. Supplied three-component rows .4/.35/.25 and .35/.4/.25 choose0 then1 although all shares are below.5. These are not Iris three-component predictions.`}>
    {width=>{const arrayWidth=Math.min(300,width-70),x=35;return <>
      <text x="20" y="25">Fixed retained state: 2 components</text><text x="20" y="55">Constructed query batch: q = 4, d = 2</text>
      <text x="20" y="95">Raw query coordinates / cm</text>
      <ArrayDrawing rows={state.queries} x={x} y={135} width={arrayWidth}/>
      <MixtureArrow points={[[width/2,259],[width/2,284]]}/>
      <text x="20" y="315">Apply the same training transform</text>
      <ArrayDrawing rows={state.standardized} x={x} y={355} width={arrayWidth}/>
      <text x="20" y="508">These standardized rows enter scoring.</text>
      <text x="20" y="555" fill={SUM}>score_samples → q log densities</text>
      <ArrayDrawing rows={state.scores.map(v=>[v])} x={x} y={595} width={arrayWidth}/>
      <MixtureArrow points={[[width/2,725],[width/2,750]]}/>
      <text x="20" y="785" fill={SUM}>score → their scalar mean</text>
      <text x="35" y="823" fill={SUM}>{number(state.score)}</text>
      <text x="20" y="888">predict_proba → q × K = 4 × 2 shares</text>
      <text x="90" y="921" fill={LEFT}>0</text><text x={35+arrayWidth*0.75} y="921" fill={RIGHT}>1</text>
      <ArrayDrawing rows={state.shares} x={x} y={957} width={arrayWidth} colour={j=>componentColours[j]}/>
      <MixtureArrow points={[[width/2,1086],[width/2,1111]]}/>
      <text x="20" y="1147">predict → largest entry's component ID</text>
      <ArrayDrawing rows={state.componentIds.map(v=>[v])} x={x} y={1187} width={arrayWidth}/>
      <text x="20" y="1344">Separate generation: sample(q)</text>
      <text x="20" y="1378">Select source using uniform u first.</text>
      <text x="20" y="1412">0 if u &lt; {number(state.weights[0],6)}; otherwise 1.</text>
      {state.generated.map((row,i)=><text key={i} x="35" y={1452+i*31} fill={componentColours[row.componentId]}>u {row.u} → source {row.componentId}; ε [{row.z.join(', ')}]</text>)}
      <MixtureArrow points={[[width/2,1570],[width/2,1595]]}/>
      <text x="20" y="1630">Use source k: μₖ + Lₖ ε.</text>
      <ArrayDrawing rows={state.generated.map(r=>r.row)} x={x} y={1670} width={arrayWidth}/>
      <text x="20" y="1825">4 × 2 generated standardized rows</text>
      <text x="20" y="1857">Supplied noise traces, not a benchmark.</text>
      <text x="20" y="1890">Not an average of all component means.</text>
      <text x="20" y="1940">Separate constructed K = 3 contrast</text>
      {state.constructedRows.map((row,i)=>{const y=1990+i*275,best=row.indexOf(Math.max(...row)),colours=[LEFT,RIGHT,'#c4a0e8'],barWidth=width-70,baseline=y+180,plotHeight=80;let offset=0;return <g key={i}>
        <text x="20" y={y}>Largest share selects component {best}.</text>
        {row.map((v,k)=>{const xx=35+offset*barWidth;offset+=v;return <g key={k}><rect x={xx} y={y+20} width={v*barWidth} height="16" fill={colours[k]}/><text x={35+k*(width-60)/3} y={y+70} fill={colours[k]}>ID {k}: {v}</text></g>;})}
        <line x1="35" x2={width-35} y1={baseline} y2={baseline} stroke={REFERENCE}/>
        <line x1="35" x2="35" y1={baseline-plotHeight} y2={baseline} stroke={REFERENCE}/>
        <text x="28" y={baseline-plotHeight+5} textAnchor="end">1</text><text x="28" y={baseline+5} textAnchor="end">0</text>
        <line x1="35" x2={width-35} y1={baseline-0.5*plotHeight} y2={baseline-0.5*plotHeight} stroke={REFERENCE} strokeDasharray="4 4"/>
        <text x="20" y={baseline-0.5*plotHeight-12}>0.5 comparison</text>
        {row.map((v,k)=><g key={k}><rect x={52+k*(width-80)/3} y={baseline-v*plotHeight} width="24" height={v*plotHeight} fill={colours[k]} data-individual-share={v}/><text x={64+k*(width-80)/3} y={baseline+24} textAnchor="middle">{k}</text></g>)}
        <text x="20" y={y+242}>A &gt; 0.5 rule would abstain.</text>
      </g>;})}
      <text x="20" y="2590">Vertical bars: individual shares; baseline 0.</text>
      <text x="20" y="2625">Each vertical bar uses a 0–1 scale.</text>
      <text x="20" y="2660">Dotted 0.5 is a separate comparison.</text>
      <text x="20" y="2695">It is not the preceding NLL &gt; 10 rule.</text>
    </>;}}
  </GaussianDrawing></>;
}
