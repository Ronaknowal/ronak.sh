import { gelu } from '../../data/convnext-models.js';
import { flowNumber as f } from './LessonFlow.jsx';
import './convnext-flow.css';

const Label = ({ x, y, children, anchor = 'start', role = '' }) => <text x={x} y={y} textAnchor={anchor} className={`cnx-label cnx-${role}`}>{children}</text>;
function Wire({ x1, y1, x2, y2, dashed = false }) {
  const angle = Math.atan2(y2-y1, x2-x1), length=7, halfWidth=4;
  const baseX=x2-length*Math.cos(angle), baseY=y2-length*Math.sin(angle);
  const points=`${baseX-halfWidth*Math.sin(angle)},${baseY+halfWidth*Math.cos(angle)} ${baseX+halfWidth*Math.sin(angle)},${baseY-halfWidth*Math.cos(angle)} ${x2},${y2}`;
  return <g><line x1={x1} y1={y1} x2={x2} y2={y2} className={dashed?'cnx-target-wire':'cnx-wire'}/><polygon points={points} className="cnx-arrowhead"/></g>;
}

function Grid({ x, y, rows, columns, cell = 12, role = 'computed', values, selected = [], mask }) {
  return <g>{Array.from({ length: rows * columns }, (_, index) => {
    const row = Math.floor(index / columns), column = index % columns;
    const hidden = mask && !mask[row][column];
    return <g key={index}><rect x={x + column * cell} y={y + row * cell} width={cell} height={cell} className={`cnx-svg-cell cnx-cell-${role}${hidden ? ' cnx-masked' : ''}${selected.includes(index) ? ' cnx-selected' : ''}`}/>{values && <text x={x + (column + .5) * cell} y={y + (row + .5) * cell + 4} textAnchor="middle" className="cnx-cell-text">{f(values[index], 3)}</text>}{hidden && <text x={x + (column + .5) * cell} y={y + (row + .5) * cell + 4} textAnchor="middle" className="cnx-cell-text">×</text>}</g>;
  })}</g>;
}

function Stack({ x, y, count = 3, side = 45, role = 'computed', grid = false, mask }) {
  return <g>{Array.from({ length: count }, (_, index) => <g key={index} transform={`translate(${x + (count - 1 - index) * 6},${y + (count - 1 - index) * 4})`}><rect width={side} height={side} className={`cnx-svg-cell cnx-cell-${role}`}/>{mask ? <Grid x={0} y={0} rows={4} columns={4} cell={side/4} role={role} mask={mask}/> : grid && <>{[1, 2, 3].map(line => <path key={line} d={`M ${line * side / 4},0 v ${side} M 0,${line * side / 4} h ${side}`} className="cnx-grid-line"/>)}</>}</g>)}</g>;
}

function Draw({ id, height, children, description, width = 400 }) {
  return <figure data-figure={id}><svg viewBox={`0 0 ${width} ${height}`} className="cnx-drawing" role="img" aria-label={description}>{children}</svg></figure>;
}

export function ConvNeXtPurposeFigure() {
  return <Draw id="convnext-purpose" height={370} description="An image becomes channel maps through a stem and repeated body blocks. Each last map is averaged over locations into one feature value. A classifier connects that vector to every class score.">
    <Grid x={16} y={28} rows={8} columns={8} cell={7} role="data"/><Label x={16} y={17} role="data">pixel image</Label><Label x={16} y={106}>H × W</Label>
    <Wire x1={77} y1={61} x2={131} y2={61}/><Label x={88} y={47}>stem</Label>
    <Stack x={144} y={34} count={3} side={44} grid/><Label x={138} y={112} role="computed">channel maps</Label>
    <Wire x1={204} y1={61} x2={257} y2={61}/><Label x={214} y={46}>body</Label>
    <Stack x={270} y={40} count={3} side={32} grid/><Label x={254} y={112} role="computed">richer features</Label>
    <path d="M 288,84 V 146 H 229" className="cnx-wire"/><Wire x1={229} y1={146} x2={218} y2={146}/><Label x={14} y={155}>average locations</Label>
    <Grid x={134} y={132} rows={1} columns={3} cell={28}/><Label x={245} y={179} role="computed">feature vector</Label>
    <Wire x1={176} y1={164} x2={176} y2={210}/><circle cx={176} cy={229} r={19} className="cnx-op"/><Label x={203} y={234}>classifier</Label>
    {[0,1,2,3].map(index=><g key={index}><Wire x1={176} y1={248} x2={94+index*46} y2={283}/><rect x={79+index*46} y={283} width={30} height={24} className="cnx-svg-cell cnx-cell-computed"/><Label x={94+index*46} y={326} anchor="middle">score {index}</Label></g>)}
    <Label x={15} y={366}>Few channels/classes drawn; all scores use the vector.</Label>
  </Draw>;
}

export function ConvNeXtSpatialChannelFigure() {
  return <Draw id="convnext-spatial-channel" height={318} description="Two supplied 5 by 5 channel maps A and B each enter their own spatial filter. The resulting maps meet at the same position through channel mixing. An unchanged input bypass joins the learned correction at the addition.">
    <Grid x={16} y={28} rows={5} columns={5} cell={10} role="data" selected={[6,7,8,11,12,13,16,17,18]}/><Grid x={16} y={125} rows={5} columns={5} cell={10} role="data" selected={[6,7,8,11,12,13,16,17,18]}/>
    <Label x={16} y={18} role="data">input A</Label><Label x={16} y={115} role="data">input B</Label>
    <Wire x1={71} y1={54} x2={110} y2={54}/><Wire x1={71} y1={151} x2={110} y2={151}/>
    <Grid x={116} y={39} rows={3} columns={3} cell={10} role="parameter"/><Grid x={116} y={136} rows={3} columns={3} cell={10} role="parameter"/>
    <Label x={101} y={91} role="parameter">filter A</Label><Label x={101} y={188} role="parameter">filter B</Label>
    <Wire x1={151} y1={54} x2={188} y2={54}/><Wire x1={151} y1={151} x2={188} y2={151}/>
    <Grid x={192} y={29} rows={5} columns={5} cell={10} selected={[12]}/><Grid x={192} y={126} rows={5} columns={5} cell={10} selected={[12]}/>
    <Label x={182} y={91} role="computed">filtered A</Label><Label x={182} y={188} role="computed">filtered B</Label>
    <line x1={217} y1={54} x2={296} y2={105} className="cnx-weight-wire"/><line x1={217} y1={151} x2={296} y2={105} className="cnx-weight-wire"/>
    <rect x={283} y={92} width={62} height={28} rx={6} className="cnx-op"/><Label x={314} y={111} anchor="middle">mix</Label>
    <Label x={255} y={73} role="parameter">shared channel weights</Label>
    <Wire x1={314} y1={125} x2={314} y2={243}/><Label x={325} y={209}>correction</Label>
    <path d="M 16,54 H 5 V 259 H 296 M 16,151 H 5" className="cnx-wire"/><Label x={30} y={238} role="data">saved x: A and B</Label>
    <circle cx={314} cy={259} r={18} className="cnx-op"/><Label x={314} y={265} anchor="middle">⊕</Label>
    <Wire x1={314} y1={279} x2={314} y2={307}/><Label x={15} y={304} role="computed">output: x + correction</Label>
  </Draw>;
}

export function ConvNeXtBlockFigure({ version = 1 }) {
  const rows = version === 1 ? [[58,52,'input x: C channels'],[155,52,'filtered: C'],[252,208,'expanded: 4C'],[403,52,'projected: C']] : [[58,52,'input x: C channels'],[155,52,'filtered: C'],[252,208,'expanded: 4C'],[403,52,'projected: C']];
  return <Draw id={`convnext-block-v${version}`} height={580} description={`ConvNeXt V${version} block with tensor widths drawn in ratio 1 to 4 to 1. The input's bypass enters the residual add. Spatial filtering preserves width; channel LayerNorm precedes fourfold expansion and GELU; ${version === 2 ? 'GRN follows GELU, then projection; there is no LayerScale.' : 'projection is followed by learned LayerScale.'} DropPath masks the whole correction during training.`}>
    {rows.map(([y,width,label],index) => <g key={y}><rect x={190-width/2} y={y} width={width} height={29} className={`cnx-svg-cell cnx-cell-${index === 0 ? 'data' : 'computed'}`}/>{Array.from({length:index===2?8:2},(_,i)=><line key={i} x1={190-width/2+(i+1)*width/(index===2?9:3)} y1={y} x2={190-width/2+(i+1)*width/(index===2?9:3)} y2={y+29} className="cnx-grid-line"/>)}<Label x={index===2?304:230} y={y+20} role={index===0?'data':'computed'}>{label}</Label></g>)}
    <Wire x1={190} y1={92} x2={190} y2={142}/><Label x={222} y={112}>depthwise 7 × 7</Label><Label x={222} y={131}>padding 3</Label>
    <Wire x1={190} y1={189} x2={190} y2={238}/><Label x={216} y={211}>channel LayerNorm</Label><Label x={216} y={231}>linear C → 4C</Label>
    <Wire x1={190} y1={287} x2={190} y2={389}/><Label x={216} y={311}>GELU</Label>{version===2&&<Label x={216} y={334}>GRN across maps</Label>}<Label x={216} y={365}>linear 4C → C</Label>
    <Wire x1={190} y1={437} x2={190} y2={496}/>{version===1&&<Label x={216} y={455} role="parameter">LayerScale</Label>}<Label x={216} y={478}>DropPath</Label>
    <path d="M 164,72 H 28 V 516 H 171" className="cnx-wire"/><Label x={39} y={470} role="data">saved x</Label>
    <circle cx={190} cy={516} r={19} className="cnx-op"/><Label x={190} y={523} anchor="middle">⊕</Label>
    <Wire x1={190} y1={539} x2={190} y2={567}/><Label x={220} y={562} role="computed">output: C</Label>
    <Label x={18} y={18}>Downward forward flow; grid H × W stays fixed.</Label>
  </Draw>;
}

export function ConvNeXtGeluFigure() {
  const x = value => 46 + (value + 3) * 44, y = value => 133 - value * 32;
  const points = Array.from({length:121},(_,index)=>-3+index*.05);
  return <Draw id="convnext-gelu" height={245} width={350} description="Numerical approximation to exact-erf GELU is plotted as a violet curve over scores minus 3 to 3. Axes mark zero and unit values. A small negative score produces a small negative activation; large positive scores mostly pass through."><line x1={x(-3)} y1={y(0)} x2={x(3)} y2={y(0)} className="cnx-wire"/><line x1={x(0)} y1={y(-.6)} x2={x(0)} y2={y(3.2)} className="cnx-wire"/><polyline points={points.map(value=>`${x(value)},${y(gelu(value))}`).join(' ')} className="cnx-curve"/>{[-3,-2,-1,0,1,2,3].map(value=><Label key={value} x={x(value)} y={y(0)+48} anchor="middle">{value}</Label>)}{[1,2,3].map(value=><g key={value}><line x1={x(0)-4} y1={y(value)} x2={x(0)+4} y2={y(value)} className="cnx-wire"/><Label x={x(0)-9} y={y(value)+4} anchor="end">{value}</Label></g>)}<Label x={239} y={69} role="computed">GELU(z)</Label><Label x={280} y={199}>score z</Label><Label x={15} y={226}>−1 → −0.158655; 0 → 0; 1 → 0.841345</Label></Draw>;
}

export function ConvNeXtNormalizationDrawing({ locations, local, whole }) {
  return <div className="flow-columns-2">{[['Channel LayerNorm',local,true],['One GroupNorm group',whole,false]].map(([name,result,separate])=><svg key={name} viewBox="0 0 210 430" className="cnx-drawing" role="img" aria-label={`${name}: the outlined groups determine which values share mean and variance.`}><Label x={8} y={19}>{name}</Label><Label x={66} y={46} anchor="middle">A</Label><Label x={126} y={46} anchor="middle">B</Label><Grid x={36} y={55} rows={2} columns={2} cell={60} role="data" values={locations.flat()}/>{separate?[0,1].map(row=><rect key={row} x={36} y={55+row*60} width={120} height={60} rx={6} className="cnx-group-outline"/>):<rect x={36} y={55} width={120} height={120} rx={6} className="cnx-group-outline"/>}<Label x={8} y={96}>0</Label><Label x={8} y={156}>1</Label><Wire x1={96} y1={183} x2={96} y2={215}/><Label x={112} y={201}>normalize</Label><Grid x={36} y={244} rows={2} columns={2} cell={60} values={result.output.flat()}/><Label x={164} y={270} role="computed">output</Label><Label x={8} y={393}>Rows = locations</Label><Label x={8} y={414}>Columns = A, B</Label></svg>)}</div>;
}

export function ConvNeXtResponseDrawing({ maps, result, scales }) {
  return <svg viewBox="0 0 400 575" className="cnx-drawing" role="img" aria-label="Original maps branch into a length computation and saved map route. Each length is divided by the shared mean plus epsilon. Relative response multiplies gamma and the original map, then the original map is added back. Beta is held at zero.">
    <Label x={24} y={20} role="data">A: spatial values</Label><Label x={254} y={20} role="data">B: spatial values</Label>
    <Grid x={24} y={31} rows={1} columns={2} cell={40} role="data" values={maps[0]}/><Grid x={254} y={31} rows={1} columns={2} cell={40} role="data" values={maps[1]}/>
    <path d="M 24,51 H 5 V 450 H 41 M 5,386 H 41 M 254,51 H 225 V 450 H 261 M 225,386 H 261" className="cnx-data-wire"/>
    <Wire x1={55} y1={76} x2={55} y2={96}/><Wire x1={275} y1={76} x2={275} y2={96}/>
    <Label x={24} y={114} role="computed">GA = {f(result.norms[0])}</Label><Label x={254} y={114} role="computed">GB = {f(result.norms[1])}</Label>
    <rect x={24} y={126} width={result.norms[0]/24*95} height={12} className="cnx-norm-bar"/><rect x={254} y={126} width={result.norms[1]/24*95} height={12} className="cnx-norm-bar"/>
    <Wire x1={91} y1={142} x2={152} y2={161}/><Wire x1={300} y1={142} x2={228} y2={161}/>
    <ellipse cx={190} cy={172} rx={40} ry={19} className="cnx-op"/><Label x={190} y={177} anchor="middle">mean + ε</Label>
    <Label x={190} y={207} anchor="middle" role="computed">{f(result.denominator)}</Label>
    <Wire x1={55} y1={142} x2={55} y2={220}/><Wire x1={275} y1={142} x2={275} y2={220}/>
    <path d="M 150,172 H 125 V 234 H 69 M 230,172 H 345 V 234 H 289" className="cnx-wire"/>
    {[55,275].map(x=><g key={x}><circle cx={x} cy={234} r={14} className="cnx-op"/><Label x={x} y={239} anchor="middle">÷</Label></g>)}
    <Label x={78} y={269} role="computed">RA = {f(result.relative[0])}</Label><Label x={298} y={269} role="computed">RB = {f(result.relative[1])}</Label>
    {[55,275].map((x,index)=><g key={x}>
      <Wire x1={x} y1={248} x2={x} y2={291}/><circle cx={x} cy={305} r={14} className="cnx-op"/><Label x={x} y={310} anchor="middle">×</Label>
      <Label x={x+49} y={310} role="parameter">γ{index?'B':'A'} = {f(scales[index])}</Label><Wire x1={x+43} y1={305} x2={x+14} y2={305}/>
      <Wire x1={x} y1={319} x2={x} y2={372}/><Label x={x+20} y={350} role="computed">γR = {f(scales[index]*result.relative[index])}</Label>
      <circle cx={x} cy={386} r={14} className="cnx-op"/><Label x={x} y={391} anchor="middle">×</Label><Label x={x+22} y={391}>map × γR</Label>
      <Wire x1={x} y1={400} x2={x} y2={436}/><circle cx={x} cy={450} r={14} className="cnx-op"/><Label x={x} y={455} anchor="middle">+</Label><Label x={x+22} y={455}>add saved map</Label>
      <Wire x1={x} y1={464} x2={x} y2={488}/>
    </g>)}
    <Label x={9} y={426} role="data">A</Label><Label x={229} y={426} role="data">B</Label>
    <Grid x={24} y={493} rows={1} columns={2} cell={40} values={result.output[0]}/><Grid x={254} y={493} rows={1} columns={2} cell={40} values={result.output[1]}/>
    <Label x={24} y={549} role="computed">output A; β = 0</Label><Label x={254} y={549} role="computed">output B; β = 0</Label>
  </svg>;
}

export function ConvNeXtMaskFigure({ small = false }) {
  const mask=[[0,1,0,0],[1,0,1,0],[0,1,0,1],[0,0,1,0]];
  return <Draw id={small?'convnext-digit-model':'convnext-information-boundary'} height={485} description="Original pixels branch into a visible-only encoder route and a separate target route. Six of sixteen patches are visible. The encoder's inactive locations remain masked. The decoder fills missing locations using learned mask tokens. Hidden original targets meet decoded values only at the loss."><Label x={15} y={18} role="data">image: 8 × 8 pixels</Label><Grid x={15} y={30} rows={8} columns={8} cell={8} role="data"/><Wire x1={91} y1={62} x2={138} y2={62}/><Label x={103} y={44}>mask</Label><Grid x={147} y={30} rows={4} columns={4} cell={16} role="data" mask={mask}/><Label x={131} y={118}>16 patches; 6 visible</Label><Wire x1={179} y1={126} x2={179} y2={166}/><Label x={20} y={151}>stem → masked encoder</Label><Stack x={155} y={177} count={3} side={43} mask={mask}/><Label x={217} y={198} role="computed">{small ? '12 × 4 × 4' : 'channel maps'}</Label><Label x={217} y={219}>{small ? 'two blocks' : 'visible sites only'}</Label><Wire x1={179} y1={228} x2={179} y2={263}/><Label x={15} y={247} role="parameter">mask tokens + decoder</Label><Grid x={147} y={276} rows={8} columns={8} cell={8}/><Label x={220} y={302} role="computed">reconstruction</Label><Wire x1={179} y1={345} x2={179} y2={411}/><circle cx={179} cy={428} r={17} className="cnx-op"/><Label x={179} y={433} anchor="middle">L</Label><path d="M 15,62 H 5 V 458 H 355 V 428 H 196" className="cnx-target-wire"/><Label x={20} y={361} role="data">dashed: hidden targets</Label><Label x={20} y={381} role="data">to loss only</Label><Label x={218} y={410}>40 squared errors</Label><Label x={15} y={429}>loss</Label></Draw>;
}

export function ConvNeXtFusionDrawing({ result }) {
  return <svg viewBox="0 0 400 325" className="cnx-drawing" role="img" aria-label="With fixed BatchNorm statistics, the three branches become aligned affine kernels. The 1 by 1 and identity impulses occupy the centre of a 3 by 3 support; their coefficients and biases sum into one kernel and bias.">
    <Label x={8} y={18}>3 × 3 + fixed BN</Label><Label x={156} y={18}>1 × 1 + BN</Label><Label x={305} y={18}>identity</Label>
    <Grid x={8} y={31} rows={3} columns={3} cell={32} role="parameter" values={result.firstKernel}/>
    <Grid x={149} y={31} rows={3} columns={3} cell={32} role="parameter" values={[0,0,0,0,result.secondKernel,0,0,0,0]} selected={[4]}/>
    <Grid x={289} y={31} rows={3} columns={3} cell={32} role="parameter" values={[0,0,0,0,1,0,0,0,0]} selected={[4]}/>
    <path d="M 56,132 V 174 H 182 M 197,132 V 159 M 337,132 V 174 H 212" className="cnx-wire"/>
    <circle cx={197} cy={174} r={15} className="cnx-op"/><Label x={197} y={180} anchor="middle">Σ</Label><Wire x1={197} y1={193} x2={197} y2={210}/>
    <Grid x={149} y={217} rows={3} columns={3} cell={32} role="parameter" values={result.foldedKernel} selected={[4]}/>
    <Label x={259} y={239}>fused kernel</Label><Label x={259} y={264} role="parameter">bias {f(result.foldedBias)}</Label>
    <Label x={8} y={320}>Aligned supports; white outline marks centre impulses.</Label>
  </svg>;
}

export function ConvNeXtCommunicationFigure() {
  return <Draw id="convnext-communication" height={232} description="A selected white query connects to every position on a fine or coarse grid. Full attention counts every possible query-key pair. Downsampling reduces the number of possible pairs.">{[[15,12,'56 × 56 grid','3,136² = 9,834,496'],[228,3,'14 × 14 grid','196² = 38,416']].map(([x,cell,title,count])=><g key={title}><Label x={x} y={18} role="data">{title}</Label><Grid x={x} y={38} rows={7} columns={7} cell={cell} role="data" selected={[24]}/>{Array.from({length:49},(_,index)=><line key={index} x1={x+3.5*cell} y1={38+3.5*cell} x2={x+(index%7+.5)*cell} y2={38+(Math.floor(index/7)+.5)*cell} className="cnx-attention-wire"/>)}<Label x={x} y={152} role="computed">{count}</Label><Label x={x} y={174}>pairs per head</Label></g>)}<Label x={15} y={208}>White query → every key; only 7 × 7 sites drawn.</Label><Label x={15} y={228}>Coarse side is ¼ of fine side; pair count is 1/256.</Label></Draw>;
}

export function ConvNeXtWorkedBlockFigure() {
  const a=1/Math.sqrt(1+1e-6), activated=[gelu(-a),gelu(a)];
  const stages=[
    [30,[1,3],'supplied x: two channels','data'],
    [124,[-a,a],'filtered, then normalized','computed'],
    [232,[...activated,0,0,0,0,0,0],'eight activated combinations','computed'],
    [374,activated,'projected back to two','computed'],
    [472,activated.map(value=>value*.1),'scaled correction','computed'],
    [575,activated.map((value,index)=>[1,3][index]+.1*value),'output: x + correction','computed'],
  ];
  return <Draw id="convnext-worked-block" height={645} description="A complete constructed two-channel block: input 1 and 3; centre-only spatial filters; channel normalization; expansion to eight values, GELU, projection to two values, scale 0.1, and addition to the saved input.">
    {stages.map(([y,values,label,role])=><g key={y}>{values.length===8?<><Label x={275} y={y+25} role={role}>eight values</Label><Label x={275} y={y+44} role={role}>after GELU</Label></>:<Label x={195} y={y+25} role={role}>{label}</Label>}<Grid x={82} y={y} rows={values.length===8?2:1} columns={values.length===8?4:2} cell={45} role={role} values={values}/></g>)}
    <Wire x1={127} y1={80} x2={127} y2={108}/><Label x={190} y={92}>centre filters</Label><Label x={190} y={110}>mean 2; variance 1</Label>
    <Wire x1={127} y1={174} x2={127} y2={214}/><Label x={190} y={198}>expand then GELU</Label>
    <Wire x1={127} y1={327} x2={127} y2={357}/><Label x={190} y={344}>select first two values</Label>
    <Wire x1={127} y1={423} x2={127} y2={455}/><Label x={190} y={440} role="parameter">multiply by 0.1</Label>
    <path d="M 82,52 H 30 V 550 H 115" className="cnx-wire"/><Label x={35} y={537} role="data">saved x</Label>
    <Wire x1={127} y1={523} x2={127} y2={538}/><circle cx={127} cy={550} r={12} className="cnx-op"/><Label x={127} y={555} anchor="middle">⊕</Label><Wire x1={127} y1={562} x2={127} y2={574}/>
    <Label x={82} y={639}>Grid entries rounded; zero biases, no DropPath.</Label>
  </Draw>;
}

export function ConvNeXtHeadOrderFigure() {
  const normalize=values=>{const mean=(values[0]+values[1])/2,variance=values.reduce((sum,value)=>sum+(value-mean)**2,0)/2;return values.map(value=>(value-mean)/Math.sqrt(variance+1e-6));};
  const pooled=normalize([5,4]), first=normalize([1,3]),second=normalize([9,5]);
  return <figure data-figure="convnext-head-order"><div className="flow-columns-2">{[false,true].map(normalizeFirst=><svg key={String(normalizeFirst)} viewBox="0 0 210 300" className="cnx-drawing" role="img" aria-label={normalizeFirst?'Normalize each location first then average; opposite contrasts nearly cancel.':'Average locations first then normalize; channel A remains stronger.'}><Label x={8} y={20}>{normalizeFirst?'Normalize → average':'Average → normalize'}</Label><Grid x={25} y={40} rows={2} columns={2} cell={45} role="data" values={[1,3,9,5]}/><Label x={125} y={64}>location 0</Label><Label x={125} y={109}>location 1</Label><Wire x1={70} y1={135} x2={70} y2={165}/><Grid x={25} y={176} rows={normalizeFirst?2:1} columns={2} cell={40} values={normalizeFirst?[...first,...second]:[5,4]}/><Label x={119} y={197}>{normalizeFirst?'local vectors':'pooled vector'}</Label><Wire x1={70} y1={normalizeFirst?258:218} x2={70} y2={normalizeFirst?277:247}/><Label x={119} y={normalizeFirst?269:236}>{normalizeFirst?'average':'normalize'}</Label><Label x={8} y={296} role="computed">{normalizeFirst?`≈ [${f((first[0]+second[0])/2)}, ${f((first[1]+second[1])/2)}]`:`≈ [${f(pooled[0])}, ${f(pooled[1])}]`}</Label></svg>)}</div><p>Same inputs, unit scale, zero shift, ε = 10⁻⁶. Rows are spatial locations; columns are channels A and B.</p></figure>;
}

export function ConvNeXtTargetFigure() {
  return <figure data-figure="convnext-target-normalization"><div className="flow-columns-2">{[[1,3],[11,13]].map((values,index)=><svg key={index} viewBox="0 0 210 185" className="cnx-drawing" role="img" aria-label={`Target patch ${index?'B':'A'}: subtract mean ${index?12:2}, divide by sample standard deviation square root 2, gives minus 0.707107 and 0.707107 before epsilon.`}><Label x={16} y={18} role="data">target patch {index?'B':'A'}</Label><Grid x={16} y={32} rows={1} columns={2} cell={44} role="data" values={values}/><Wire x1={60} y1={82} x2={60} y2={117}/><Label x={89} y={95}>subtract {index?12:2}</Label><Label x={89} y={112}>divide by √2</Label><Grid x={16} y={126} rows={1} columns={2} cell={44} values={[-1/Math.SQRT2,1/Math.SQRT2]}/><Label x={114} y={151}>before ε</Label></svg>)}</div></figure>;
}

export function ConvNeXtProbeFigure() {
  return <Draw id="convnext-linear-probe" height={250} description="A fully visible image enters a frozen encoder; frozen feature values go to a trainable linear readout. Label targets train only that readout, and reserved images evaluate it."><Grid x={15} y={31} rows={8} columns={8} cell={7} role="data"/><Label x={15} y={18} role="data">clean image</Label><Wire x1={77} y1={60} x2={131} y2={60}/><Stack x={142} y={32} side={43} count={3} grid/><Label x={138} y={108}>frozen encoder</Label><path d="M 139,27 h 66 v 66 h -66 z" className="cnx-frozen-wire"/><Wire x1={211} y1={60} x2={255} y2={60}/>{[0,1,2].map(index=><g key={index}><circle cx={282} cy={35+index*33} r={10} className="cnx-svg-cell cnx-cell-computed"/><line x1={292} y1={35+index*33} x2={358} y2={69} className="cnx-weight-wire"/></g>)}<Label x={246} y={128} role="computed">feature vector</Label><circle cx={358} cy={69} r={12} className="cnx-svg-cell cnx-cell-computed"/><Label x={310} y={148} anchor="end" role="parameter">linear readout</Label><Label x={310} y={170} anchor="end">class scores</Label><path d="M 155,213 H 353 V 90" className="cnx-target-wire"/><Label x={15} y={212} role="data">training labels</Label><Label x={15} y={242}>Only the readout learns; the encoder weights stay fixed.</Label></Draw>;
}

export function ConvNeXtNonlinearDrawing({ input }) {
  return <svg viewBox="0 0 390 230" className="cnx-drawing" role="img" aria-label={`At input ${input}, separate activations produce absolute x ${Math.abs(input)}, while summing x and minus x before ReLU produces zero.`}><circle cx={195} cy={25} r={18} className="cnx-svg-cell cnx-cell-data"/><Label x={195} y={30} anchor="middle">{f(input)}</Label><path d="M 184,43 L 76,85 M 206,43 L 295,85" className="cnx-wire"/><Label x={23} y={75}>x and −x</Label><Label x={250} y={75}>x − x = 0</Label><rect x={24} y={86} width={104} height={29} rx={6} className="cnx-op"/><Label x={76} y={105} anchor="middle">two ReLUs</Label><rect x={245} y={86} width={99} height={29} rx={6} className="cnx-op"/><Label x={294} y={105} anchor="middle">one ReLU</Label><Label x={16} y={145} role="computed">{f(Math.max(0,input))} + {f(Math.max(0,-input))}</Label><Label x={280} y={145} role="computed">0</Label><Wire x1={76} y1={151} x2={76} y2={174}/><Label x={16} y={199} role="computed">separate: {f(Math.abs(input))}</Label><Label x={243} y={199} role="computed">combined: 0</Label></svg>;
}
