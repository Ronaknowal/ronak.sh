import { flowNumber } from './LessonFlow.jsx';
import { VisionFlowCells as Cells, VisionFlowDrawing as Drawing, VisionFlowWire as Wire, visionFlowColors as colors } from './VisionTransformerFlowFigures.jsx';

function Node({x=20,y,width=288,children,role='operation'}) {
  return <g><rect x={x} y={y} width={width} height="38" fill="none" stroke={colors[role]}/>
    <text x={x+width/2} y={y+25} textAnchor="middle">{children}</text></g>;
}

export function VisionCropPairDrawing() {
  const crops=[{name:'Global A',pixels:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],side:4},
    {name:'Global B: reflected',pixels:[3,2,1,0,7,6,5,4,11,10,9,8,15,14,13,12],side:4},
    {name:'Local C: upper-left',pixels:[0,1,4,5],side:2}];
  return <Drawing width={340} height={1170} label="Three explicit views of one image: two whole-image views, one reflected, and a cropped upper-left local view. Teacher sees only the two global views; student sees all three. Four cross-view teacher-to-student pairs exclude the same-global-view pair, so matching a target cannot mean copying the exact teacher input.">
    {id=><>
      <text x="20" y="25">One image; three different views</text>
      {crops.map((crop,index)=><g key={crop.name}>
        <text x="20" y={65+index*150}>{crop.name}</text>
        {crop.pixels.map((value,cell)=><g key={cell}>
          <rect x={20+cell%crop.side*28} y={80+index*150+Math.floor(cell/crop.side)*28} width="28" height="28"
            fill={`rgb(${30+value*11},${30+value*11},${30+value*11})`} stroke={colors.input}/>
          <text x={34+cell%crop.side*28} y={100+index*150+Math.floor(cell/crop.side)*28} textAnchor="middle"
            fill={value>8?'#080808':'#eeeeee'}>{value}</text>
        </g>)}
        <text x="155" y={115+index*150}>{index<2?'Teacher + student':'Student only'}</text>
      </g>)}
      <Wire path="M132 136 H326 V540 H308" arrowId={id}/><Wire path="M132 286 H326 V540" arrowId={id}/>
      <Node y={521}>Teacher: global A and global B</Node>
      <Wire path="M164 559 H7 V629 H20" arrowId={id}/>
      <Cells x={20} y={612} rows={[["qA","qB"]]} cellWidth={142} label="Detached prototype distributions"/>
      <Wire path="M76 416 H7 V706 H20" arrowId={id}/>
      <Wire path="M20 136 H7 V706" arrowId={id}/><Wire path="M20 286 H7 V706" arrowId={id}/>
      <Node y={687}>Student: A, B and local C</Node>
      <Wire path="M164 725 H7 V794 H20" arrowId={id}/>
      <Cells x={20} y={777} rows={[["pA","pB","pC"]]} cellWidth={96} label="Student prototype distributions"/>
      <Wire path="M304 629 H326 V880 H308" arrowId={id}/><Wire path="M164 811 V861" arrowId={id}/>
      <Node y={861}>Choose cross-view target pairs</Node>
      <Wire path="M164 899 H7 V969 H20" arrowId={id}/>
      <Cells x={20} y={952} rows={[["qA→pB","qA→pC"],["qB→pA","qB→pC"]]} cellWidth={142} label="Four cross-view loss terms"/>
      <text x="20" y="1064">No qA→pA or qB→pB term.</text>
      <text x="20" y="1090">C is resized by the view pipeline.</text>
      <text x="20" y="1116">Prototype coordinates ≠ classes.</text>
    </>}
  </Drawing>;
}

function MovingAverageRoute({center=false}) {
  const old=center?[.1,0]:[2],fresh=center?[.5,-.5]:[4],momentum=.9;
  const kept=old.map(value=>value*momentum),incoming=fresh.map(value=>value*(1-momentum));
  const next=kept.map((value,index)=>value+incoming[index]);
  return <Drawing width={340} height={720} label={center?'The center tracks batch-mean teacher logits: old [0.1,0], current batch mean [0.5,-0.5], momentum 0.9 yields [0.14,-0.05]. It is separate from teacher parameter averaging.':'The teacher parameter average: old teacher 2, updated student 4, momentum 0.9 gives 2.2. No loss gradient updates the teacher directly.'}>
    {id=><>
      <Cells x={20} y={65} rows={[old]} cellWidth={120} label={center?'Old running logit center':'Old teacher parameter'} role={center?'input':'parameter'}/>
      <Wire path="M80 99 V151" arrowId={id}/><Node y={151}>Multiply old value by 0.9</Node>
      <Wire path="M164 189 V239" arrowId={id}/>
      <Cells x={20} y={239} rows={[kept]} cellWidth={120} label="Retained part"/>
      <Cells x={20} y={343} rows={[fresh]} cellWidth={120} label={center?'This batch mean teacher logits':'Updated student parameter'} role={center?'computed':'parameter'}/>
      <Wire path="M80 377 V421" arrowId={id}/><Node y={421}>Multiply new value by 0.1</Node>
      <Wire path="M164 459 V510" arrowId={id}/>
      <Cells x={20} y={510} rows={[incoming]} cellWidth={120} label="Incoming part"/>
      <Wire path={`M${20+kept.length*120} 256 H327 V598 H308`} arrowId={id}/><Wire path="M80 544 V579" arrowId={id}/>
      <Node y={579}>Add the two parts</Node><Wire path="M164 617 H7 V685 H20" arrowId={id}/>
      <Cells x={20} y={668} rows={[next]} cellWidth={120} label={center?'New running center':'New teacher parameter'}/>
    </>}
  </Drawing>;
}

export function VisionMovingAveragesDrawing() {
  return <div className="vision-flow-parallel"><MovingAverageRoute/><MovingAverageRoute center/></div>;
}

export function VisionMaskedPatchTargetDrawing() {
  const cells=Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>r*4+c));
  return <Drawing width={340} height={1440} label="Separate masked-student and unmasked-teacher input grids preserve original patch 5. The teacher supplies that patch's detached target through its patch head. The image loss uses an already-taught other-global-view target, not this same-view patch target. Special records are not spatial patch targets.">
    {id=><>
      <text x="20" y="25">Same view; mask original patch 5</text>
      {cells.map((row,r)=>row.map((value,c)=><g key={value}>
        <rect x={20+c*62} y={65+r*48} width="62" height="48" fill="#0a0a0a" stroke={value===5?colors.parameter:colors.input}/>
        <text x={51+c*62} y={95+r*48} textAnchor="middle" fill={value===5?colors.parameter:colors.text}>{value===5?'MASK':value}</text>
      </g>))}
      <text x="20" y="287">MASK is a learned vector.</text>
      <Wire path="M144 257 H7 V347 H20" arrowId={id}/><Node y={328}>Student encoder: masked input</Node>
      <Wire path="M164 366 H7 V435 H20" arrowId={id}/>
      <Cells x={20} y={418} rows={[["hCLS","h5"]]} cellWidth={142} label="CLS and spatial patch 5 outputs"/>
      <Wire path="M91 452 V501" arrowId={id}/><Wire path="M233 452 V501" arrowId={id}/>
      <Node x={20} y={501} width={142}>Image head</Node><Node x={174} y={501} width={142}>Patch head</Node>
      <Wire path="M91 539 H7 V605 H20" arrowId={id}/><Wire path="M245 539 H333 V605 H304" arrowId={id}/>
      <Cells x={20} y={588} rows={[["pCLS","p5"]]} cellWidth={142} label="Two different output distributions"/>
      <text x="20" y="682">Teacher: same view, no mask</text>
      {cells.map((row,r)=>row.map((value,c)=><g key={value}>
        <rect x={20+c*62} y={705+r*48} width="62" height="48" fill="#0a0a0a" stroke={colors.input}/>
        <text x={51+c*62} y={735+r*48} textAnchor="middle">{value}</text>
      </g>))}
      <Wire path="M144 897 H7 V947 H20" arrowId={id}/>
      <Node y={928}>Teacher encoder → patch head</Node>
      <Wire path="M164 966 H328 V1038 H316" arrowId={id}/>
      <Cells x={174} y={1021} rows={[["q5"]]} cellWidth={142} label="q5: detached"/>
      <Cells x={20} y={1130} rows={[["qOther"]]} cellWidth={142} label="Other global-view image target"/>
      <Wire path="M91 622 H7 V1247 H20" arrowId={id}/>
      <Wire path="M233 622 H333 V1247 H316" arrowId={id}/>
      <Wire path="M245 1055 H333 V1247 H316" arrowId={id}/><Wire path="M91 1164 V1228" arrowId={id}/>
      <Node x={20} y={1228} width={142}>Image CE</Node><Node x={174} y={1228} width={142}>Masked CE</Node>
      <text x="20" y="1330">Image target: different global view.</text>
      <text x="20" y="1356">Patch target: same original site 5.</text>
      <text x="20" y="1382">Patch loss uses masked sites only.</text>
      <text x="20" y="1408">Separate learned image/patch heads.</text>
    </>}
  </Drawing>;
}

export function VisionNeighborSpreadDrawing() {
  const points=[[1,0],[0,1],[-1,0]],names=['A','B','C'];
  return <Drawing width={340} height={560} label="Three nonzero unit feature directions on a circle. A and C each have B as a nearest neighbor; B has an A/C tie. All selected distances are square-root 2. The nearest-neighbor negative log-distance loss rewards separation, not a class assignment.">
    {id=><>
      <text x="20" y="25">Each feature has length 1.</text>
      <circle cx="170" cy="188" r="100" fill="none" stroke={colors.forward}/>
      <path d="M60 188 H280 M170 78 V298" fill="none" stroke={colors.forward}/>
      {points.map(([x,y],index)=><g key={index}>
        <circle cx={170+x*100} cy={188-y*100} r="6" fill={colors.computed}/>
        <text x={index===0?235:index===2?20:184} y={index===1?72:225}>{names[index]} [{x},{y}]</text>
      </g>)}
      <path d="M270 188 L170 88 L70 188" fill="none" stroke={colors.computed} strokeDasharray="5 4"/>
      <text x="200" y="122">√2</text><text x="93" y="122">√2</text>
      <Wire path="M170 298 H7 V364 H20" arrowId={id}/>
      <Cells x={20} y={347} rows={[[Math.SQRT2,Math.SQRT2,Math.SQRT2]]} cellWidth={96} label="Nearest nonself distances: A, B, C"/>
      <Wire path="M164 381 V427" arrowId={id}/><Node y={427}>Mean of −log(distance)</Node>
      <text x="20" y="515">Value: {flowNumber(-Math.log(Math.SQRT2),6)}</text>
      <text x="20" y="542">A zero distance needs an ε policy.</text>
    </>}
  </Drawing>;
}

export function VisionRegisterAnatomyDrawing() {
  const rows=[['CLS','image readout'],['REG0','workspace'],['REG1','workspace'],['PATCH0','grid cell (0,0)'],['PATCH1','grid cell (0,1)']];
  return <Drawing width={340} height={700} label="Class, register and patch records all communicate in the attention sequence. Registers are trained nonspatial workspace records; only spatial patch outputs are placed back into the dense image grid. Adding untrained register records to another checkpoint is not equivalent.">
    {id=><>
      <text x="20" y="25">Five-record symbolic cutaway</text>
      <Cells x={20} y={82} rows={rows} cellWidth={142} label="Record name and job"/>
      <Wire path="M162 252 V300" arrowId={id}/><Node y={300}>Attention: all five records</Node>
      <Wire path="M164 338 H7 V408 H20" arrowId={id}/>
      <Cells x={20} y={391} rows={[["hCLS","hREG0"],["hREG1","hPATCH0"],["hPATCH1","…"]]} cellWidth={142} label="Updated vectors; width d each"/>
      <Wire path="M304 442 H328 V569 H308" arrowId={id}/><Wire path="M91 493 V550" arrowId={id}/>
      <Node y={550}>Select spatial PATCH rows</Node>
      <Wire path="M164 588 H7 V658 H20" arrowId={id}/>
      <Cells x={20} y={641} rows={[["(0,0):h0","(0,1):h1"]]} cellWidth={142} label="Dense grid excludes CLS/registers"/>
    </>}
  </Drawing>;
}

export function VisionAxialRotationDrawing() {
  const q=[1,0,1,0],phase=[Math.PI/2,0],turned=[0,1,1,0];
  return <Drawing width={340} height={1060} label="A constructed four-coordinate query has one adjacent coordinate pair controlled by row position and a second pair controlled by column position. Row1 column 0 with quarter-turn frequency rotates the first pair and leaves the second unchanged. Query and key are turned for matching; the value vector remains unchanged.">
    {id=><>
      <Cells x={20} y={65} rows={[[1,0]]} cellWidth={142} label="Selected patch: row 1, column 0" role="input"/>
      <Wire path="M162 99 V145" arrowId={id}/><Node y={145}>Each axis × π/2 frequency</Node>
      <Wire path="M164 183 H7 V255 H20" arrowId={id}/>
      <Cells x={20} y={238} rows={[phase]} cellWidth={142} label="Row-pair phase; column-pair phase"/>
      <Cells x={20} y={346} rows={[q]} cellWidth={76} label="Projected query: two adjacent pairs"/>
      <Wire path="M304 255 H332 V454 H308" arrowId={id}/><Wire path="M172 380 V435" arrowId={id}/>
      <Node y={435}>Turn pairs by own axis phase</Node>
      <Wire path="M164 473 H7 V543 H20" arrowId={id}/>
      <Cells x={20} y={526} rows={[turned]} cellWidth={76} label="Turned query: [0,1] and [1,0]"/>
      <Cells x={20} y={635} rows={[["kr0","kr1","kc0","kc1"]]} cellWidth={76} label="Key turned by its patch's axes"/>
      <Wire path="M324 543 H332 V748 H308" arrowId={id}/><Wire path="M172 669 V729" arrowId={id}/>
      <Node y={729}>Turned query·key → read weights</Node>
      <Cells x={20} y={840} rows={[[2,-1]]} cellWidth={142} label="Value pair: no position turn"/>
      <Wire path="M164 767 H332 V948 H308" arrowId={id}/><Wire path="M162 874 V929" arrowId={id}/>
      <Node y={929}>Weights mix unchanged values</Node>
      <text x="20" y="1011">π/2 here is a hand-only frequency.</text>
      <text x="20" y="1037">Use checkpoint axes/periods in code.</text>
    </>}
  </Drawing>;
}
