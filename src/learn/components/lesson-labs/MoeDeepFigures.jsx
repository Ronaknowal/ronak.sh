import { MoeScene, MoeText, MoeCells, MoeMatrix, MoeWire, MoeOperation, MOE_PAINT } from './MoeFlowFigures.jsx';
import { coreScores, coreOutputs, affineTrace } from '../../data/moe-reading-traces.js';
import { route } from '../../data/moe-models.js';

export function MoeRouterMapDrawing() {
  const input=[1,2],weight=[[Math.log(4),0],[Math.log(2),0],[0,0]],t=affineTrace(input,weight);
  return <MoeScene width={700} height={480} title="A learned map produces one score per stored expert"
    description="The same one,two input reaches each of three map rows. The map is three outputs by two inputs. Its coordinate products and row sums are log four, log two and zero; later exponentiation and normalization are distinct operations.">
    <MoeCells x={18} y={50} values={input} role="input" label="supplied x"/>
    <MoeMatrix x={250} y={50} values={weight} width={100} label="router Wᵣ: E × d = 3 × 2"/>
    <MoeWire path="M147 68H160V210H275"/><MoeWire path="M350 164V210H315"/><MoeOperation x={295} y={210} symbol="×"/>
    <MoeWire path="M295 230V260"/><MoeMatrix x={200} y={260} values={t.products} width={100} role="computed" label="each input × matching map entry"/>
    {[0,1,2].map(i=><g key={i}><MoeWire path={`M397 ${279+i*38}H450`}/><MoeOperation x={470} y={279+i*38} radius={15} symbol="Σ"/>
      <MoeWire path={`M485 ${279+i*38}H540`}/><MoeCells x={540} y={260+i*38} values={[t.output[i]]} width={100}/></g>)}
    <MoeText x={18} y={438}>The three computed scores name expert IDs 0, 1 and 2.</MoeText>
  </MoeScene>;
}

export function MoeInputCreditDrawing() {
  const result=route(coreScores,coreOutputs,2,true,[1,1]);
  const matrix=[[Math.log(4),0],[Math.log(2),0],[0,0]];
  const routerCredit=[0,1].map(j=>result.gradient.reduce((a,v,i)=>a+v*matrix[i][j],0));
  const expertCredits=[[4/3,0],[0,.5]];
  return <MoeScene width={800} height={560} title="The supplied input receives credit through both the expert maps and the router map"
    description={`For J equal to the sum of the core output coordinates, expert input credits are four thirds,zero and zero,one half. Router score credits are minus two ninths,two ninths,zero. Multiplying by the transpose of the displayed router map gives ${routerCredit}. All three input-credit branches add to four thirds minus two log two over nine,one half. Selection is held fixed.`}>
    <MoeCells x={18} y={50} values={result.gradient} role="gradient" width={110} label="score credit ∂J/∂h"/>
    <MoeMatrix x={430} y={50} values={matrix[0].map((_,j)=>matrix.map(row=>row[j]))} width={110} label="actual Wᵣ transpose"/>
    <MoeWire path="M182 88V180H355" gradient/><MoeWire path="M595 126V180H395" gradient/><MoeOperation x={375} y={180} symbol="×"/>
    <MoeWire path="M375 200V243" gradient/><MoeCells x={265} y={243} values={routerCredit} role="gradient" width={110} label="router branch input credit"/>
    {expertCredits.map((credit,i)=><g key={i}><MoeCells x={18+i*510} y={345} values={credit} role="gradient" width={110} label={`expert ${i}: map-transpose credit`}/>
      <MoeWire path={`M${125+i*510} 383V420H${355+i*40}`} gradient/></g>)}
    <MoeWire path="M375 281V400" gradient/><MoeOperation x={375} y={420} symbol="Σ"/>
    <MoeWire path="M375 440V476" gradient/><MoeCells x={265} y={476} values={[4/3+routerCredit[0],.5]} role="gradient" width={110} label="complete input credit"/>
    <MoeText x={18} y={545}>Orange dashed routes add; no reverse arrow goes through the chosen IDs.</MoeText>
  </MoeScene>;
}

export function MoeDispatchDrawing({kind='dispatch'}) {
  const routes=[[0,1],[0,1],[0,2],[0,2]],grouped=[[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1]];
  return <MoeScene width={860} height={640} title="Stable grouping retains both token and slot return addresses"
    description="Four tokens request two branches each. Each record carries token ID, slot ID, expert ID and gate. Stable sorting groups all expert-zero records first, expert-one next, and expert-two last. Expert computation changes values but never the original addresses. Returning two products to one token uses addition; assignment would overwrite a previous contribution.">
    <MoeText x={18} y={28}>requested rows; weights are 1/2 per slot</MoeText>
    <MoeMatrix x={18} y={60} values={routes} role="operation" width={70} label="token row → E IDs"/>
    <MoeWire path="M155 136H225V200H260"/><MoeOperation x={290} y={200} radius={30} symbol="sort"/>
    <MoeWire path="M320 200H365"/>
    <MoeMatrix x={365} y={60} values={grouped.map(([token,slot])=>[token,slot,routes[token][slot]])} role="operation" width={70} height={38} label="token / slot / expert"/>
    <rect x={361} y={56} width={218} height={152} fill="none" stroke="#fff"/>
    <rect x={361} y={210} width={218} height={76} fill="none" stroke="#fff"/>
    <rect x={361} y={286} width={218} height={76} fill="none" stroke="#fff"/>
    <MoeWire path="M575 136H620"/><MoeOperation x={650} y={136} radius={30} symbol="E0"/>
    <MoeWire path="M575 248H620"/><MoeOperation x={650} y={248} radius={30} symbol="E1"/>
    <MoeWire path="M575 324H620"/><MoeOperation x={650} y={324} radius={30} symbol="E2"/>
    <MoeText x={620} y={395}>each group's actual input rows</MoeText>
    <MoeCells x={18} y={465} values={[.5,.25]} role="computed" label="token 0: first weighted return" width={110}/>
    <MoeCells x={380} y={465} values={[-.75,2.25]} role="computed" label="token 0: second weighted return" width={110}/>
    <MoeWire path="M235 483H278"/><MoeWire path="M380 483H318"/><MoeOperation x={298} y={483} symbol="+"/>
    <MoeWire path="M298 503V565H500"/><MoeCells x={500} y={547} values={[-.25,2.5]} width={110} label="same destination, added"/>
    <MoeText x={18} y={620}>Lower return is an announced overwrite diagnostic: [.25 × (2,1)] + [.75 × (−1,3)].</MoeText>
  </MoeScene>;
}

export function MoeAllocationPolicyDrawing({kind='padding'}) {
  return <MoeScene width={760} height={455} title={kind==='causal'?'A future competitor can change an earlier capacity decision':'Ragged used rows and padded slots are different allocations'}
    description={kind==='causal'?'Expert choice with capacity one sees current token affinity .6 and a future token affinity .9. When only the current token is available it receives the expert; in the whole sequence the future token displaces it. Causal attention cannot undo this independent allocation dependency.':'Three experts use four,two,two rows. Uniform capacity four allocates twelve slots, including four padding slots. Ragged grouping stores eight used rows. This drawing counts slots, not measured speed.'}>
    {kind==='causal'?<>
      <MoeCells x={18} y={55} values={[.6]} label="current token affinity" width={140}/><MoeCells x={385} y={55} values={[.9]} label="future competitor" width={140}/>
      <MoeWire path="M155 73H270V173H300"/><MoeWire path="M455 93V173H340"/><MoeOperation x={320} y={173} radius={30} symbol="max"/>
      <MoeWire path="M320 203V250"/><MoeCells x={250} y={250} values={['future']} role="operation" width={140} label="whole-group capacity-1 owner"/>
      <MoeText x={18} y={365}>Prefix-only allocation: current token receives its expert output.</MoeText>
      <MoeText x={18} y={402}>Whole-sequence allocation: its expert update is zero after displacement.</MoeText>
    </>:<>{[4,2,2].map((used,e)=><g key={e}>
      <MoeText x={18+e*250} y={30}>E{e}: {used} used / 4 slots</MoeText>
      {[0,1,2,3].map(i=><rect key={i} x={18+e*250} y={55+i*65} width={180} height={50} fill={i<used?'#28232e':'#18181b'} stroke={i<used?MOE_PAINT.computed:MOE_PAINT.operation} strokeDasharray={i<used?undefined:'5 4'}/>)}
      <MoeText x={18+e*250} y={343}>{used<4?'Dashed = unused padding':'All four rows used'}</MoeText>
    </g>)}<MoeText x={18} y={410}>Ragged/block-sparse computation retains exactly the eight actual rows.</MoeText></>}
  </MoeScene>;
}

export function MoeOwnershipDrawing({kind='experts',budget={d:64,tokens:32,k:2,bytes:2,remote:1}}) {
  return <MoeScene width={780} height={510} title="Expert owners exchange an input vector and its returned vector"
    description="Device zero supplies one token vector. Device one owns a selected expert map. The input crosses once, the computed expert vector crosses back, then the original token uses its own gate before additive return. Shared blocks and metadata are outside this forward payload calculation.">
    <rect x={18} y={30} width={310} height={360} fill="none" stroke="#aaa"/><rect x={450} y={30} width={310} height={360} fill="none" stroke="#aaa"/>
    <MoeText x={35} y={60}>device 0: token and local expert</MoeText><MoeText x={470} y={60}>device 1: remote expert owner</MoeText>
    <MoeCells x={40} y={110} values={['x0','x1','…']} role="input" label={`${budget.d}-coordinate input`}/>
    <MoeWire path="M235 128H470"/><MoeText x={350} y={105}>send x</MoeText>
    <MoeMatrix x={485} y={175} values={[[1,0],[0,1]]} label="expert map cutaway"/><MoeOperation x={660} y={212} symbol="E"/>
    <MoeWire path="M570 128V151H660V192"/><MoeWire path="M660 232V285H670"/>
    <MoeCells x={480} y={285} values={['E(x)0','E(x)1','…']} label="returned computed vector" width={85}/>
    <MoeWire path="M480 303H260"/><MoeText x={350} y={331}>return E(x)</MoeText>
    <MoeCells x={40} y={285} values={['g']} label="token gate"/><MoeWire path="M103 303H210"/><MoeOperation x={230} y={303} symbol="×"/>
    <MoeText x={18} y={437}>Outbound + inbound: 2 × T × k × d × bytes × remote fraction.</MoeText>
    <MoeText x={18} y={478}>DP duplicates maps; TP partitions map entries; PP owns layers; EP owns branches.</MoeText>
  </MoeScene>;
}

export function MoeMatchingDrawing() {
  return <MoeScene width={720} height={410} title="Balanced matching constrains both token and expert degrees"
    description="Two tokens each need one expert; each expert accepts exactly one token. The score matrix is three,two;2.9,zero. The feasible diagonal assignment totals three and the crossed assignment totals4.9, so the balanced best sends token zero to expert one and token one to expert zero.">
    <MoeMatrix x={18} y={55} values={[[3,2],[2.9,0]]} role="computed" width={100} label="scores, row = token"/>
    {[0,1].map(caseId=><g key={caseId}>
      <MoeCells x={290} y={70+caseId*170} values={['t0','t1']} role="operation" width={90}/>
      <MoeCells x={570} y={70+caseId*170} values={['E0','E1']} role="operation" width={65}/>
      <MoeWire path={`M333 ${108+caseId*170}V${130+caseId*170}H${caseId?667:602}V${108+caseId*170}`}/>
      <MoeWire path={`M423 ${108+caseId*170}V${152+caseId*170}H${caseId?602:667}V${108+caseId*170}`}/>
      <MoeText x={290} y={190+caseId*170}>feasible score sum: {caseId?'2 + 2.9 = 4.9':'3 + 0 = 3'}</MoeText>
    </g>)}
  </MoeScene>;
}

export function MoeBiasUpdateDrawing() {
  const count=[4,1,1],average=2,old=[0,0,0],next=[-.1,.1,.1];
  return <MoeScene width={740} height={435} title="Completed counts change the next batch's bias, not the current batch's gates"
    description="A completed batch counts four,one,one assignments. Mean count is two. With adjustment .1 the overloaded expert's bias decreases and the underloaded experts' biases increase. These new values are stored for the next batch. Counts have no fictional gradient route into this control update.">
    <MoeCells x={18} y={55} values={count} role="computed" label="completed batch counts" width={110}/>
    <MoeWire path="M182 93V140H275"/><MoeOperation x={305} y={140} radius={30} symbol="avg"/>
    <MoeWire path="M335 140H420"/><MoeCells x={420} y={122} values={[average]} label="average count" width={110}/>
    <MoeCells x={18} y={230} values={old} role="computed" label="old load-control state" width={110}/>
    <MoeWire path="M182 268V302H385"/><MoeWire path="M475 160V302H445"/><MoeOperation x={415} y={302} radius={30} symbol="±.1"/>
    <MoeWire path="M445 302H490"/><MoeCells x={490} y={284} values={next} role="computed" width={75} label="next load-control state"/>
    <MoeText x={18} y={398}>Counts drive this control update; task gradients train the router maps.</MoeText>
  </MoeScene>;
}

export function MoeOptimizerNullDrawing() {
  return <MoeScene width={940} height={855} title="An absent task gradient and an explicit zero tensor can lead to different updates"
    description="Ordinary PyTorch SGD, momentum coefficient .9, dampening zero, weight decay zero, Nesterov false, rate .1, old weight1 and existing velocity buffer .5. None skips both weight and buffer. An explicit zero gives new buffer .9 times .5 plus zero = .45, update .045 and weight .955.">
    <MoeText x={18} y={28}>SGD: μ=.9, dampening=0, decay=0, Nesterov off.</MoeText>
    <MoeCells x={18} y={90} values={[1]} role="parameter" width={120} label="old weight"/>
    <MoeCells x={230} y={90} values={[.5]} width={120} label="old velocity buffer"/>
    <MoeCells x={18} y={200} values={['None']} role="gradient" width={120} label="absent gradient"/>
    <MoeWire path="M78 238V285"/><MoeOperation x={78} y={315} symbol="skip" radius={30}/>
    <MoeWire path="M78 345H8V443H18"/><MoeCells x={18} y={425} values={[1]} role="parameter" width={120} label="unchanged weight"/>
    <MoeWire path="M290 128V425"/><MoeCells x={230} y={425} values={[.5]} width={120}/><MoeText x={230} y={487}>buffer unchanged</MoeText>
    <MoeCells x={480} y={90} values={[.9]} role="input" width={120} label="supplied μ"/>
    <MoeCells x={700} y={90} values={[.5]} width={120} label="old velocity buffer"/>
    <MoeWire path="M540 128V178H620"/><MoeWire path="M760 128V178H660"/><MoeOperation x={640} y={178} symbol="×"/>
    <MoeWire path="M640 198H560V268H580"/><MoeCells x={580} y={250} values={[.45]} width={120} label="μ times old buffer"/>
    <MoeCells x={790} y={335} values={[0]} role="gradient" width={120} label="explicit zero"/>
    <MoeWire path="M640 288V353H670"/><MoeWire path="M790 353H710"/><MoeOperation x={690} y={353} symbol="+"/>
    <MoeWire path="M690 373H610V443H630"/><MoeCells x={630} y={425} values={[.45]} width={120} label="new velocity v′"/>
    <MoeCells x={480} y={525} values={[.1]} role="input" width={120} label="supplied η"/>
    <MoeWire path="M690 463V543H660"/><MoeWire path="M597 543H620"/><MoeOperation x={640} y={543} symbol="×"/>
    <MoeWire path="M640 563H560V628H580"/><MoeCells x={580} y={610} values={[.045]} width={120} label="step magnitude ηv′"/>
    <MoeCells x={480} y={685} values={[1]} role="parameter" width={120} label="old weight"/>
    <MoeWire path="M640 648H770V703H750"/><MoeWire path="M597 703H710"/><MoeOperation x={730} y={703} symbol="−"/>
    <MoeWire path="M730 723V761H617"/><MoeCells x={500} y={743} values={[.955]} role="parameter" width={120}/>
    <MoeText x={18} y={835}>v′=μv+g; w′=w−ηv′. A zero gradient still uses the existing buffer.</MoeText>
  </MoeScene>;
}
