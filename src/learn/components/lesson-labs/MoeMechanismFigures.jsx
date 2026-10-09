import { MoeScene, MoeText, MoeCells, MoeMatrix, MoeWire, MoeOperation, MOE_PAINT } from './MoeFlowFigures.jsx';
import { balance, dot, softmax } from '../../data/moe-models.js';
import { affineTrace, expertTrace, noisyProbability } from '../../data/moe-reading-traces.js';
import { flowNumber } from './LessonFlow.jsx';

// Each view is an operation on the displayed objects, rather than a sentence flowchart.
export function MoeAffineDrawing({ trace, title = 'Multiply each map row, sum its products, then add its bias', row = 0 }) {
  const shown = Math.min(trace.input.length, 6), products = trace.products[row], bias = trace.bias[row];
  const height = 520;
  return <MoeScene width={850} height={height} title={title}
    description={`Selected output row ${row}. All ${trace.input.length} input coordinates contribute to the full sum ${trace.sums[row]}. The first ${shown} coordinate products are shown, the remaining sum is explicit, and the actual bias ${bias} is added to give ${trace.output[row]}. Maps are output-by-input.`}>
    <MoeText x={18} y={25}>Selected output row {row}; {shown} of {trace.input.length} columns shown.</MoeText>
    <MoeCells x={18} y={65} values={trace.input.slice(0, shown)} width={110} role="computed" label="actual input coordinates"/>
    <MoeCells x={18} y={170} values={trace.weight[row].slice(0, shown)} width={110} role="parameter"/>
    <MoeText x={690} y={186} role="parameter">matching learned</MoeText><MoeText x={690} y={210} role="parameter">map row</MoeText>
    {Array.from({length:shown}, (_, i) => <g key={i}>
      <MoeWire path={`M${71+i*110} 103V121`}/>
      <MoeWire path={`M${71+i*110} 170V145`}/>
      <MoeOperation x={71+i*110} y={133} radius={12} symbol="×"/>
      <MoeWire path={`M${83+i*110} 133H${126.5+i*110}V277H${125+i*110}`}/>
    </g>)}
    <MoeCells x={18} y={258} values={products.slice(0,shown)} width={110}/>
    <MoeText x={690} y={250}>actual products</MoeText>
    <MoeWire path={`M${18+shown*110-3} 277H750V329H400`}/>
    <MoeCells x={18} y={330} values={[products.slice(shown).reduce((a,b)=>a+b,0)]} width={140} label="all omitted-column products, summed"/>
    <MoeWire path="M155 349H380"/>
    <MoeOperation x={400} y={349} symbol="Σ"/>
    <MoeWire path="M420 349H492"/>
    <MoeCells x={492} y={330} values={[trace.sums[row]]} width={140} label="full row sum"/>
    <MoeWire path="M629 349H681"/>
    <MoeOperation x={701} y={349} symbol="+"/>
    <MoeCells x={650} y={410} values={[bias]} width={100} role="parameter" label="actual bias"/>
    <MoeWire path="M747 428H760V379H701V369"/><MoeWire path="M721 349H775V470H405V463"/>
    <MoeCells x={335} y={425} values={[trace.output[row]]} width={140} label="actual output"/>
    <MoeText x={18} y={495}>The cutaway omits columns, never their numerical contribution.</MoeText>
  </MoeScene>;
}

export function MoeSwiGLUDrawing() {
  const t=expertTrace([1,2],[[1,0],[0,1]],[[2,0],[0,-1]],[[1,0],[0,1]]);
  return <MoeScene width={740} height={815} title="A SwiGLU expert has two projections, a component product, and a third projection"
    description="Input one,two forks into identity gate and diagonal two,minus-one value maps. The gate branch applies SiLU, giving .7310586,1.7615942. The other branch returns two,minus-two. Their component products are 1.4621172,minus3.5231883. An identity down map returns that complete vector.">
    <MoeCells x={300} y={40} values={t.input} role="input" label="supplied x"/>
    {[['gate',t.gatePath,18],['up',t.upPath,405]].map(([name,path,x])=><g key={name}>
      <MoeMatrix x={x} y={140} values={path.weight} label={`W${name}: 2 × 2`}/>
      <MoeWire path={`M366 78V103H${x+232}V263H${x+86}`}/>
      <MoeWire path={`M${x+66} 216V243`}/><MoeOperation x={x+66} y={263} symbol="×"/>
      <MoeWire path={`M${x+66} 283H${x-13}V338H${x}`}/><MoeMatrix x={x} y={320} values={path.products} role="computed" label="row products"/>
      <MoeWire path={`M${x+66} 396V420`}/><MoeOperation x={x+66} y={440} symbol="Σ"/>
      <MoeWire path={`M${x+66} 460H${x-13}V508H${x}`}/><MoeCells x={x} y={490} values={path.output} label="row sums"/>
    </g>)}
    <MoeOperation x={205} y={508} symbol="SiLU" radius={36}/><MoeWire path="M147 508H169"/>
    <MoeWire path="M205 544H240V619H215"/><MoeCells x={18} y={600} values={t.activated} width={100} label="z / (1 + exp(−z))"/>
    <MoeWire path="M215 619H300"/><MoeWire path="M471 528V619H340"/><MoeOperation x={320} y={619} symbol="⊙"/>
    <MoeWire path="M320 639V651H5V719H18"/><MoeCells x={18} y={700} values={t.product} width={100}/><MoeText x={18} y={685}>matching-coordinate products</MoeText>
    <MoeMatrix x={405} y={670} values={t.downPath.weight} label="Wdown = I2"/>
    <MoeWire path="M215 719H283"/><MoeWire path="M405 708H350V719H323"/><MoeOperation x={303} y={719} symbol="×"/>
    <MoeWire path="M303 739V777H405"/><MoeCells x={405} y={758} values={t.output} width={100}/>
  </MoeScene>;
}

export function MoeBalanceInputs({ scores, k=1 }) {
  const b=balance(scores,k), p=b.probabilities;
  return <MoeScene width={820} height={600} title="The same probability rows supply discrete counts and continuous means"
    description={`All probability rows are displayed. Selecting ${k} IDs per row yields counts ${b.counts}. Dividing by ${scores.length*k} yields hard fractions. Summing all entries in each probability column and dividing by ${scores.length} yields means. Only the count route is treated as fixed for credit.`}>
    <MoeMatrix x={18} y={60} values={p} role="computed" width={100} label="full probabilities, rows = tokens"/>
    <MoeWire path="M165 212V270H285"/><MoeOperation x={315} y={270} radius={30} symbol="top"/>
    <MoeWire path="M345 270H420"/><MoeCells x={420} y={251} values={b.counts} width={100} label="hard assignment counts"/>
    <MoeCells x={420} y={357} values={[scores.length*k]} role="operation" label="T × k assignments"/>
    <MoeWire path="M570 289V326H315V355"/><MoeWire path="M420 375H335"/>
    <MoeOperation x={315} y={375} symbol="÷"/><MoeWire path="M295 375H165V440"/>
    <MoeCells x={18} y={440} values={b.fractions} width={100} label="q: stopped count fractions"/>
    <MoeWire path="M315 60H350V100H380"/><MoeOperation x={400} y={100} symbol="Σ"/>
    <MoeWire path="M420 100H490"/><MoeCells x={490} y={81} values={b.mean.map(x=>x*scores.length)} width={100} label="column sums of every probability"/>
    <MoeWire path="M637 119V151H455V172"/><MoeOperation x={455} y={192} symbol="÷"/>
    <MoeCells x={350} y={174} values={[scores.length]} role="operation" label="T tokens" width={70}/><MoeWire path="M417 192H435"/>
    <MoeWire path="M475 192H490"/><MoeCells x={490} y={174} values={b.mean} width={100} label="P: probability means"/>
    <MoeText x={18} y={550}>Stop-gradient belongs to q, not to the supplied full probability rows.</MoeText>
    <MoeText x={18} y={580}>Both q and P sum to one; the subsequent product is a separate view.</MoeText>
  </MoeScene>;
}

export function MoePartitionDrawing({ row, offset=0 }) {
  const scores=row.map(x=>x+offset), maximum=Math.max(...scores), masses=scores.map(x=>Math.exp(x-maximum));
  const sum=masses.reduce((a,b)=>a+b,0), partition=maximum+Math.log(sum);
  return <MoeScene width={740} height={440} title="Add the maximum back after the stable exponential sum"
    description={`The maximum ${maximum} is subtracted before exponentials and added back after log of the shared sum. The partition ${partition} is squared into ${partition*partition}; probabilities alone discard this common scale.`}>
    <MoeCells x={18} y={55} values={scores} width={100} label="current logits"/>
    <MoeCells x={480} y={55} values={[maximum]} width={100} label="maximum"/>
    <MoeWire path="M165 93V130H330"/><MoeWire path="M530 93V130H370"/><MoeOperation x={350} y={130} symbol="−"/>
    <MoeWire path="M330 130H235V172"/><MoeOperation x={235} y={202} radius={30} symbol="exp"/>
    <MoeWire path="M235 232V255H318"/><MoeCells x={18} y={237} values={masses} width={100} label="shifted exponential masses"/>
    <MoeWire path="M315 255H350"/><MoeOperation x={370} y={255} symbol="Σ"/>
    <MoeWire path="M390 255H426"/><MoeOperation x={456} y={255} radius={30} symbol="log"/>
    <MoeWire path="M486 255H550"/><MoeOperation x={570} y={255} symbol="+"/><MoeWire path="M577 74H680V190H570V235"/>
    <MoeWire path="M590 255H650V328H338"/><MoeCells x={238} y={310} values={[partition]} width={100} label="log partition"/>
    <MoeWire path="M335 328H400"/><MoeOperation x={420} y={328} symbol="²"/><MoeWire path="M440 328H480"/>
    <MoeCells x={480} y={310} values={[partition*partition]} width={110} label="one row's z penalty"/>
    <MoeText x={18} y={408}>Average these squares over all rows for the complete z-loss.</MoeText>
  </MoeScene>;
}

export function MoeNoiseDrawing({ clean=0, sigma=.5 }) {
  const probability=noisyProbability(clean,sigma), threshold=.5;
  const points=Array.from({length:121},(_,i)=>{const x=-3+i*.05;return `${380+x*80},${370-Math.exp(-x*x/2)*150}`;});
  const z=(threshold-clean)/sigma;
  const visible=z>=-3&&z<=3, a=Math.log(Math.expm1(sigma));
  const tailPoints=Array.from({length:121},(_,i)=>-3+i*.05).filter(v=>v>=z).map(v=>`${380+v*80},${370-Math.exp(-v*v/2)*150}`);
  return <><MoeScene width={740} height={390} title="Separate learned projections produce a clean score and a positive noise scale"
    description={`A constructed one-coordinate input 1 reads two separate learned scalar maps. Clean map ${clean} returns h=${clean}. Noise map ${a} returns a, then softplus log(1+exp(a)) gives positive scale ${sigma}. This is a parameterized scalar illustration of the original mechanism, not a trained additional model.`}>
    <MoeCells x={18} y={60} values={[1]} role="input" label="supplied scalar x"/>
    {[0,1].map(branch=><g key={branch}><MoeCells x={210} y={60+branch*145} values={[branch?a:clean]} role="parameter" width={120} label={branch?'noise map Wₙ':'clean map Wᵣ'}/>
      <MoeWire path={`M81 78H150V${105+branch*145}H380`}/><MoeWire path={`M270 ${98+branch*145}V${105+branch*145}H420`}/><MoeOperation x={400} y={105+branch*145} symbol="×"/>
      <MoeWire path={`M420 ${105+branch*145}H490`}/><MoeCells x={490} y={87+branch*145} values={[branch?a:clean]} width={120} label={branch?'raw a':'clean h'}/></g>)}
    <MoeWire path="M550 270V310H310"/><MoeOperation x={280} y={310} radius={30} symbol="sp"/><MoeWire path="M250 310H148"/>
    <MoeCells x={18} y={292} values={[sigma]} width={130} label="softplus(a) = positive σ"/>
    <MoeText x={380} y={357}>sp(a) = log(1 + exp(a)).</MoeText>
  </MoeScene><MoeScene width={740} height={600} title="One sampled gate and a conditional crossing probability answer different questions"
    description={`A supplied epsilon one produces noisy score ${clean+sigma}. Holding the other scores fixed gives threshold .5 and standardized crossing ${z}. The upper Gaussian tail probability is ${probability}. It is an expected selection contribution, not the count of this single sample.`}>
    <MoeCells x={18} y={50} values={[clean]} role="computed" label="clean score" width={100}/>
    <MoeCells x={175} y={50} values={[sigma]} role="computed" label="positive scale σ" width={100}/>
    <MoeCells x={330} y={50} values={[1]} role="input" label="fixed normal draw ε" width={100}/>
    <MoeWire path="M272 68H280V105H310"/><MoeWire path="M380 88V105H350"/><MoeOperation x={330} y={105} symbol="×"/>
    <MoeWire path="M330 125V151H155"/><MoeWire path="M68 88V151H115"/><MoeOperation x={135} y={151} symbol="+"/>
    <MoeWire path="M155 151H205"/><MoeCells x={205} y={133} values={[clean+sigma]} width={100} label="one noisy score"/>
    <path d={`M140 370H630`} stroke={MOE_PAINT.forward}/>
    {tailPoints.length>0&&<polygon points={`${tailPoints[0].split(',')[0]},370 ${tailPoints.join(' ')} 620,370`} fill={MOE_PAINT.computed} opacity=".25"/>}
    <polyline points={points.join(' ')} fill="none" stroke={MOE_PAINT.computed} strokeWidth="2"/>
    {visible&&<path d={`M${380+z*80} 205V390`} stroke={MOE_PAINT.operation} strokeDasharray="5 4"/>}
    <MoeText x={140} y={400}>−3</MoeText><MoeText x={374} y={400}>0</MoeText><MoeText x={608} y={400}>3</MoeText>
    <MoeText x={140} y={422}>standard normal coordinate; threshold at (0.5 − clean)/σ</MoeText>
    <MoeCells x={18} y={465} values={[probability]} width={130} label="conditional upper-tail mass"/>
    <MoeText x={18} y={535}>Threshold z={flowNumber(z,4)}{visible?'; dashed line; shaded right tail.':z>3?'; beyond the right edge; tiny upper tail.':'; beyond the left edge; almost the whole curve.'}</MoeText>
    <MoeText x={18} y={575}>Sum these probabilities for expected load; compare its variance/mean².</MoeText>
  </MoeScene></>;
}

export function MoeUpcyclingDrawing() {
  return <MoeScene width={740} height={470} title="Copying maps preserves the function only when retained weights sum to one"
    description="The same original map is copied into three expert banks. Every bank returns two,minus-three. Two thirds times the first and one third times the second add to exactly the original output. Dropping a route or retaining less than unit total weight breaks this equality.">
    <MoeMatrix x={18} y={55} values={[[2,0],[0,-1.5]]} label="original down map; up = I2"/>
    {[0,1,2].map(e=><g key={e}>
      <MoeWire path={`M147 93H170V${100+e*90}H235`}/>
      <MoeMatrix x={235} y={62+e*90} values={[[2,0],[0,-1.5]]} label={`copy E${e}`} width={70} height={30}/>
      <MoeWire path={`M372 ${92+e*90}H430`}/><MoeCells x={430} y={74+e*90} values={[2,-3]} label="same returned F(x)"/>
    </g>)}
    <MoeText x={18} y={390}>(2/3) [2, −3] + (1/3) [2, −3] = [2, −3].</MoeText>
    <MoeText x={18} y={429}>Router task credit cancels while all copies return identical vectors.</MoeText>
  </MoeScene>;
}
