import { MoeScene, MoeCells, MoeMatrix, MoeText, MoeWire, MoeOperation, MOE_PAINT } from './MoeFlowFigures.jsx';
import { flowNumber } from './LessonFlow.jsx';
import { route, balance, costs, biasedSelection, choice, dispatch } from '../../data/moe-models.js';
import { coreScores, coreOutputs, softMoEFixture } from '../../data/moe-reading-traces.js';

const n = value => flowNumber(value, 4);

export function MoeTransformerPosition() {
  return <MoeScene width={740} height={910} title="MoE replaces the positionwise transformation between two saved bypasses"
    description="Symbolic pre-normalized architecture: each incoming row xA/xB has its own within-row LN before the shared attention read. Raw xA is saved independently for the first residual. The resulting u is separately normalized before router/experts, while saved raw u supplies the second residual. Experts read only their own contextual row.">
    <MoeCells x={20} y={40} values={['xA,0', 'xA,1']} role="input" label="incoming row A"/>
    <MoeCells x={400} y={40} values={['xB,0', 'xB,1']} role="input" label="incoming row B"/>
    {[86,466].map((x,i)=><g key={x}><MoeWire path={`M${x} 78V128`}/><MoeOperation x={x} y={158} radius={30} symbol="LN"/>
      <MoeWire path={`M${x} 188V225`}/><MoeCells x={x-66} y={225} values={[`LN(x${i?'B':'A'})0`,`LN(x${i?'B':'A'})1`]} width={120}/></g>)}
    <MoeWire path="M140 263V313H264V317"/><MoeWire path="M520 263V313H336V317"/>
    <MoeOperation x={300} y={350} radius={50} symbol="read"/><MoeText x={366} y={355}>shared attention across rows</MoeText>
    <MoeWire path="M300 400V435"/><MoeOperation x={300} y={455} symbol="+"/>
    <MoeWire path="M20 58H8V455H280"/><MoeText x={18} y={420}>saved raw xA bypass</MoeText>
    <MoeWire path="M300 475V510"/><MoeCells x={234} y={510} values={['u0','u1']}/><MoeText x={390} y={534}>u = xA + attention(LN(x))</MoeText>
    <MoeWire path="M300 548V578"/><MoeOperation x={300} y={608} radius={30} symbol="LN"/>
    <MoeWire path="M300 638V675"/><MoeCells x={234} y={675} values={['LN(u)0','LN(u)1']} width={100}/>
    <MoeWire path="M300 713V738"/><MoeOperation x={300} y={778} radius={40} symbol="MoE"/>
    <MoeText x={355} y={783}>router + selected expert maps</MoeText>
    <MoeWire path="M300 818V840"/><MoeOperation x={300} y={860} symbol="+"/>
    <MoeWire path="M234 529H174V860H280"/><MoeText x={20} y={815}>saved raw u bypass</MoeText>
    <MoeWire path="M320 860H445"/><MoeCells x={445} y={842} values={['next0','next1']}/>
    <MoeText x={18} y={900}>nextA = u + MoE(LN(u)); neither bypass passes through its LN.</MoeText>
  </MoeScene>;
}

export function MoeGradientDrawing({ scores = coreScores, outputs = coreOutputs, k = 2, direction = [1, 1], full = false }) {
  const result = route(scores, outputs, k, !full, direction);
  return <MoeScene width={760} height={265 + scores.length * 140} title="Output credit and score credit have different backward paths"
    description={`For the diagnostic J equal to the dot product of direction ${direction} and output, orange dashed paths show numerical derivatives. Every executed output receives gate times direction. Score credit is ${result.gradient.map(n).join(', ')}. ${full ? 'An unselected score can receive denominator credit even while its expert network is unexecuted.' : 'Unselected scores have zero task derivative inside this fixed selection region.'}`}>
    <MoeCells x={460} y={30} values={result.output} label="computed y" width={100}/>
    <MoeCells x={15} y={30} values={direction} role="gradient" label="r = derivative of J with respect to y"/>
    <MoeOperation x={350} y={48} symbol="dot" radius={29}/>
    <MoeWire path="M144 48H321"/><MoeWire path="M460 48H379"/>
    <MoeWire path="M350 77V108H510V128"/>
    <MoeWire path="M560 146H700V48H660" gradient/>
    <MoeCells x={460} y={128} values={[result.output.reduce((sum, value, j) => sum + value * direction[j], 0)]} label="scalar J" width={100}/>
    {scores.map((_, e) => {
      const y = 216 + e * 140, active = result.selected.includes(e);
      return <g key={e}>
        <MoeText x={15} y={y - 20}>E{e}: {active ? 'executed' : 'network unexecuted'}</MoeText>
        <MoeCells x={15} y={y} values={outputs[e]} role="input"/>
        <MoeCells x={235} y={y} values={direction.map(value => result.weights[e] * value)} role="gradient" label="output credit g × r" width={90}/>
        <MoeWire path={`M235 ${y + 18}H144`} gradient/>
        <MoeCells x={495} y={y} values={[result.gradient[e]]} role="gradient" label={`score credit ∂J/∂h${e}`} width={120}/>
        <MoeWire path={`M557 146H680V${y + 18}H615`} gradient/>
        <MoeText x={15} y={y + 73}>{active ? 'Returned vector and gate both matter.' : 'No expert-output path is evaluated.'}</MoeText>
      </g>;
    })}
    <MoeText x={15} y={240 + scores.length * 140}>Orange dashed arrows: backward credit; IDs are held fixed.</MoeText>
  </MoeScene>;
}

export function MoeCapacityDrawing({ caseState, result, focus = caseState.token ?? 0 }) {
  const routes = caseState.routes, gates = caseState.gates, values = caseState.values;
  const retained = new Set(result.retained.map(row => `${row.token}:${row.slot}`));
  const products = routes[focus].map((e, slot) => retained.has(`${focus}:${slot}`) ? gates[focus][slot] * values[e] : 0);
  const mass = result.mass[focus], extent = Math.max(routes.length * 64, values.length * 100);
  return <MoeScene width={900} height={480 + extent} title="Allocate slots before computing and add every retained return"
    description={`There are ${routes.length * routes[0].length} requested assignments, ${result.retained.length} retained and ${result.dropped.length} dropped. Token ${focus} has two displayed slot products ${products}; its final expert update is ${result.output[focus]}. A dropped slot contributes zero. Slot IDs and priority remain metadata, not learned parameters.`}>
    <MoeText x={18} y={25}>Priority: {caseState.order.join(' → ')}</MoeText>
    <MoeText x={18} y={55}>token IDs / selected expert IDs</MoeText>
    <MoeText x={300} y={55}>per-expert accepted queue</MoeText>
    <MoeText x={635} y={55}>returns in original token order</MoeText>
    {routes.map((ids, token) => <g key={token}>
      <MoeText x={18} y={100 + token * 64}>t{token}</MoeText>
      <MoeCells x={52} y={80 + token * 64} values={ids.map((e, s) => `E${e}${retained.has(`${token}:${s}`) ? '' : ' ×'}`)} role="operation"/>
      {ids.map((e, slot) => retained.has(`${token}:${slot}`) && <MoeWire key={slot}
        path={`M${84 + slot * 66} ${118 + token * 64}V${124 + token * 64 + slot * 5}H${238 + slot * 12}V${115 + e * 100}H300`}/>)}
      <MoeCells x={670} y={80 + token * 64} values={[result.output[token]]} width={110} selected={token === focus ? 0 : null}/>
    </g>)}
    {values.map((_, expert) => <g key={expert}>
      <MoeText x={300} y={82 + expert * 100}>E{expert}: scalar {n(values[expert])}</MoeText>
      <MoeText x={505} y={82 + expert * 100}>slots {result.used[expert]}/{result.requested[expert]}</MoeText>
      <MoeCells x={300} y={96 + expert * 100} width={61} values={result.retained.filter(row => row.expert === expert).map(row => `${row.token}:${row.slot}`)} role="operation"/>
      {result.retained.filter(row=>row.expert===expert).map((row,index)=><MoeWire key={`${row.token}:${row.slot}`} path={`M${330.5+index*61} ${134+expert*100}V${140+expert*100+row.slot*5}H${630+row.slot*10}V${98+row.token*64}H670`}/>)}
    </g>)}
    <MoeText x={18} y={120 + extent}>Trace token {focus}: every slot is included in this sum.</MoeText>
    {routes[focus].map((e, slot) => {
      const y = 156 + extent + slot * 100;
      return <g key={slot}>
        <MoeCells x={18} y={y} values={[gates[focus][slot]]} label={`slot ${slot} gate`} width={96}/>
        <MoeCells x={177} y={y} values={[values[e]]} role="input" label={`E${e} supplied scalar`} width={96}/>
        {retained.has(`${focus}:${slot}`)&&<><MoeWire path={`M111 ${y + 18}H135V${y+65}H327V${y+18}`}/><MoeWire path={`M225 ${y + 38}V${y + 55}H347V${y + 38}`}/>
        <MoeOperation x={347} y={y + 18} symbol="×"/>
        <MoeWire path={`M367 ${y + 18}H417`}/></>}
        <MoeCells x={417} y={y} values={[products[slot]]} width={100} label={retained.has(`${focus}:${slot}`) ? 'retained product' : 'dropped → zero'}/>
        <MoeWire path={`M514 ${y + 18}H550V${270 + extent}H579`}/>
      </g>;
    })}
    <MoeOperation x={599} y={270 + extent} symbol="Σ"/>
    <MoeWire path={`M619 ${270 + extent}H670`}/>
    <MoeCells x={670} y={252 + extent} values={[products.reduce((sum, value) => sum + value, 0)]} label="all-slot sum" width={110}/>
    <MoeText x={18} y={420 + extent}>Surviving gate mass: {n(mass)}.</MoeText>
    {caseState.renormalize&&<>
      {mass>0&&<><MoeCells x={417} y={332+extent} values={[mass]} width={100} label="positive surviving mass"/>
        <MoeWire path={`M777 ${270+extent}H820V${350+extent}H619`}/><MoeWire path={`M514 ${350+extent}H579`}/><MoeOperation x={599} y={350+extent} symbol="÷"/>
        <MoeWire path={`M599 ${370+extent}V${393+extent}H670`}/></>}
      <MoeCells x={670} y={375+extent} values={[result.output[focus]]} width={110} label={mass>0?'policy output':'declared zero output'}/>
    </>}
    <MoeText x={18} y={356 + extent}>{caseState.renormalize ? mass>0 ? `Positive mass divides: ${n(products.reduce((a,b)=>a+b,0))} ÷ ${n(mass)} = ${n(result.output[focus])}.` : 'Zero surviving mass: policy returns zero without a division.' : 'No surviving-gate renormalization is applied.'}</MoeText>
    <MoeText x={18} y={448 + extent}>An expert update of zero leaves the separate residual bypass intact.</MoeText>
  </MoeScene>;
}

export function MoeFourTokenCapacityDrawing() {
  const caseState={routes:[[0,1],[0,1],[0,2],[0,2]],gates:Array.from({length:4},()=>[.5,.5]),values:[1,2,3],order:[0,1,2,3],capacity:2,token:2,renormalize:false};
  return <MoeCapacityDrawing caseState={caseState} result={dispatch(caseState.routes,2,caseState)}/>;
}
export function MoeBalanceDrawing({ result }) {
  const e = result.mean.length;
  return <MoeScene width={690} height={240 + e * 110} title="Hard assignment counts and mean full probabilities meet only at the final product"
    description={`Hard fractions are ${result.fractions.map(n)}, mean probabilities ${result.mean.map(n)}. Every corresponding pair is multiplied, all products summed, then multiplied by expert count ${e}. The scalar is ${n(result.value)}. Count credit is stopped; probability credit remains continuous.`}>
    <MoeText x={18} y={28}>counts ÷ (tokens × selected slots)</MoeText>
    <MoeText x={316} y={28}>full probabilities summed ÷ tokens</MoeText>
    {result.mean.map((p, i) => <g key={i}>
      <MoeCells x={18} y={65 + i * 110} values={[result.fractions[i]]} width={105} label={`q${i}: hard count fraction`}/>
      <MoeCells x={316} y={65 + i * 110} values={[p]} width={105} label={`P${i}: mean p`}/>
      <MoeWire path={`M120 ${84 + i * 110}H196`}/>
      <MoeWire path={`M316 ${84 + i * 110}H236`}/>
      <MoeOperation x={216} y={84 + i * 110} symbol="×"/>
      <MoeWire path={`M216 ${104 + i * 110}V${124 + i * 110}H505V${104 + i * 110}`}/>
      <MoeCells x={462} y={65 + i * 110} values={[p * result.fractions[i]]} width={100} label="pair product"/>
      <MoeWire path={`M559 ${84 + i * 110}H610V${110 + e * 110}H320`}/>
    </g>)}
    <MoeOperation x={300} y={110 + e * 110} symbol="Σ"/>
    <MoeWire path={`M300 ${130 + e * 110}V${160 + e * 110}`}/>
    <MoeOperation x={300} y={180 + e * 110} symbol="×"/>
    <MoeCells x={18} y={162 + e * 110} values={[e]} role="operation" label="expert count E"/>
    <MoeWire path={`M81 ${180 + e * 110}H280`}/>
    <MoeWire path={`M320 ${180 + e * 110}H462`}/>
    <MoeCells x={462} y={162 + e * 110} values={[result.value]} label="balance scalar" width={110}/>
    <MoeText x={18} y={220 + e * 110}>Uniformity gives reference 1; this surrogate is not a distance.</MoeText>
  </MoeScene>;
}

export function MoeChoiceDrawing({ probabilities = [[.7, .2, .1], [.6, .3, .1], [.2, .2, .6], [.1, .8, .1]], k = 1, capacity = 1 }) {
  const picked = choice(probabilities, k, capacity);
  return <MoeScene width={700} height={470} title="Choosing across rows and down columns constrains different counts"
    description="The identical probability grid is drawn twice. Token choice selects across each row; expert choice selects down each column. White outlines and explicit check marks indicate selected cells. Under expert capacity one, token one has no assignment even though each expert fills one slot.">
    {[0, 1].map(mode => <g key={mode}>
      <MoeText x={20 + mode * 360} y={28}>{mode ? 'expert chooses down its column' : 'token chooses across its row'}</MoeText>
      {probabilities.map((row, t) => <g key={t}>
        <MoeText x={8 + mode * 360} y={100 + t * 75}>t{t}</MoeText>
        {row.map((p, e) => {
          const selected = mode ? picked.expert[e].includes(t) : picked.token[t].includes(e);
          return <g key={e}>
            <MoeCells x={44 + mode * 360 + e * 90} y={80 + t * 75} values={[p]} width={82} selected={selected ? 0 : null}/>
            {selected && <MoeText x={58 + mode * 360 + e * 90} y={138 + t * 75}>✓ E{e}</MoeText>}
          </g>;
        })}
      </g>)}
    </g>)}
    <MoeText x={20} y={438}>White outline plus ✓ means selected; probabilities remain violet.</MoeText>
  </MoeScene>;
}

export function MoeBiasDrawing({ target = 2, amount = .3 }) {
  const affinity = [.8, .7, .6, .1], bias = affinity.map((_, i) => i === target ? amount : 0);
  const result = biasedSelection(affinity, bias);
  return <MoeScene width={750} height={720} title="Selection bias chooses IDs while original affinity determines weights"
    description={`Selection sees affinities plus bias. Selected IDs are ${result.selected}. The weight path reads original affinities, whose selected sum is ${n(result.selected.reduce((sum, e) => sum + affinity[e], 0))}; it does not normalize biased scores.`}>
    {affinity.map((value, e) => <g key={e}>
      <MoeCells x={18} y={45 + e * 130} values={[value]} label={`original s${e}`} width={100}/>
      <MoeCells x={170} y={45 + e * 130} values={[bias[e]]} role="computed" label="load-control bias" width={100}/>
      <MoeWire path={`M115 ${63 + e * 130}H135V${140 + e * 130}H290V${63 + e * 130}H300`}/>
      <MoeWire path={`M220 ${83 + e * 130}V${110 + e * 130}H320V${83 + e * 130}`}/>
      <MoeOperation x={320} y={63 + e * 130} symbol="+"/>
      <MoeWire path={`M340 ${63 + e * 130}H396`}/>
      <MoeCells x={396} y={45 + e * 130} values={[value + bias[e]]} label="selection score" width={110} selected={result.selected.includes(e) ? 0 : null}/>
      {result.selected.includes(e)&&<MoeOperation x={556} y={63+e*130} symbol="÷"/>}
      <MoeCells x={602} y={45 + e * 130} values={[result.weights[e]]} label="original-affinity gate" width={110}/>
      {result.selected.includes(e)&&<><MoeWire path={`M68 ${83 + e * 130}V${131 + e * 130}H516V${63+e*130}H536`}/>
      <MoeWire path={`M547 594H585V${105+e*130}H556V${83+e*130}`}/>
      <MoeWire path={`M576 ${63+e*130}H602`}/></>}
    </g>)}
    <MoeCells x={440} y={575} values={[result.selected.reduce((sum,e)=>sum+affinity[e],0)]} width={110}/>
    <MoeText x={18} y={565}>Σ selected original affinities</MoeText>
    <MoeText x={18} y={623}>Only selected rows divide; unselected gate cells are declared zero.</MoeText>
    <MoeText x={18} y={653}>White outlines mark IDs; violet bias follows a count-control rule.</MoeText>
    <MoeText x={18} y={683}>The two gate paths deliberately use different numerical inputs.</MoeText>
  </MoeScene>;
}

export function MoeSoftSlotsDrawing() {
  const trace = softMoEFixture();
  return <MoeScene width={840} height={1360} title="Soft MoE routes mixtures of tokens into slots and mixes their returns"
    description="The same two-by-two score matrix is normalized down columns into dispatch weights and across rows into combine weights. Dispatch transpose times X makes two slot vectors. Expert zero uses identity and expert one doubles its slot. Combine times both slot outputs returns the two explicitly calculated token vectors. This whole-input toy is noncausal.">
    <MoeMatrix x={20} y={45} values={trace.x} role="input" label="supplied X (2 × 2)"/>
    <MoeMatrix x={238} y={45} values={trace.phi} role="parameter" label="learned Φ (2 × 2)" width={90}/>
    <MoeWire path="M86 121V158H196"/><MoeWire path="M328 121V158H236"/>
    <MoeOperation x={216} y={158} symbol="×"/>
    <MoeWire path="M216 178V190H470V241H500"/>
    <MoeMatrix x={500} y={222} values={trace.scores} role="computed" label="the same score matrix S = XΦ" width={90}/>
    <MoeOperation x={110} y={342} radius={30} symbol="col"/><MoeOperation x={350} y={342} radius={30} symbol="row"/>
    <MoeWire path="M500 260H475V308H110V312"/><MoeWire path="M500 280H465V302H350V312"/>
    <MoeText x={18} y={402}>exp each entry ÷ its column sum</MoeText><MoeText x={380} y={402}>exp each entry ÷ its row sum</MoeText>
    <MoeMatrix x={20} y={440} values={trace.dispatchWeights} role="computed" label="D: column sums = 1" width={90}/>
    <MoeMatrix x={380} y={440} values={trace.combine} role="computed" label="C: row sums = 1" width={90}/>
    <MoeWire path="M110 372H330V459H197"/><MoeWire path="M350 372V459H380"/>
    <MoeMatrix x={20} y={570} values={trace.dispatchWeights[0].map((_,j)=>trace.dispatchWeights.map(row=>row[j]))} role="computed" label="transpose Dᵀ" width={90}/>
    <MoeWire path="M197 478H240V608H197"/>
    <MoeOperation x={275} y={608} symbol="×"/>
    <MoeWire path="M197 608H255"/><MoeWire path="M20 84H8V668H275V628"/>
    <MoeText x={18} y={704}>The cyan input X is the second matrix operand.</MoeText>
    <MoeWire path="M295 608H380"/><MoeMatrix x={380} y={570} values={trace.slots} role="computed" label="complete slots = DᵀX" width={90}/>
    {[0,1].map(e=><g key={e}>
      <MoeCells x={20+e*400} y={765} values={trace.slots[e]} width={90} label={`complete input to expert ${e}`}/>
      <MoeWire path={e?"M557 627H812V784H597":"M557 589H795V715H8V784H20"}/>
      <MoeMatrix x={20+e*400} y={870} values={[[e+1,0],[0,e+1]]} label={`actual expert ${e} map`} width={75}/>
      <MoeWire path={`M${110+e*400} 803V835H${245+e*400}V908H${230+e*400}`}/>
      <MoeWire path={`M${167+e*400} 908H${190+e*400}`}/><MoeOperation x={210+e*400} y={908} symbol="×"/>
      <MoeWire path={`M${210+e*400} 928V1019H${197+e*400}`}/>
      <MoeCells x={20+e*400} y={1000} values={trace.answers[e]} width={90} label={`actual E${e} slot answer`}/>
      <MoeWire path={`M${110+e*400} 1038V${1070+e*18}H250V${1159+e*38}H280`}/>
    </g>)}
    <MoeMatrix x={280} y={1140} values={trace.answers} role="computed" label="stack both complete slot answers" width={90}/>
    <MoeWire path="M457 1178H510V1210H395V1220"/>
    <MoeOperation x={395} y={1240} symbol="×"/>
    <MoeWire path="M557 478H825V1240H415"/>
    <MoeText x={20} y={1280}>The other operand is row-normalized C.</MoeText>
    <MoeWire path="M395 1260V1294H580"/><MoeMatrix x={580} y={1275} values={trace.output} role="computed" label="C × slot answers" width={100}/>
    <MoeText x={20} y={1340}>Column dispatch and row combination are distinct normalizations.</MoeText>
  </MoeScene>;
}

export function MoeStoredActiveDrawing({ budget = { d: 64, m: 128, n: 8, k: 2, tokens: 32, bytes: 2, remote: 1, shared: 0 } }) {
  const count = costs(budget), shown = Math.min(budget.n, 12);
  return <MoeScene width={760} height={410} title="Stored experts and active expert arithmetic count different map entries"
    description={`There are ${budget.n} stored routed experts and ${budget.k} selected experts, plus ${budget.shared} always-on shared experts. Each owns gate and up maps of hidden-by-input shape and a down map of input-by-hidden shape. Stored expert parameter count ${count.stored}; active expert MAC count ${count.active}; router count ${count.router}. Only twelve representatives are drawn when more experts exist.`}>
    <MoeText x={18} y={28}>Each bank member owns gate, up and down maps.</MoeText>
    {Array.from({ length: shown }, (_, e) => <g key={e}>
      {[0, 1, 2].map(map => <rect key={map} x={18 + e * 60 + map * 4} y={66 + map * 5} width={38} height={130} fill="#1b1b1d"
        stroke={MOE_PAINT.parameter} strokeWidth={1}/>) }
      <MoeText x={18 + e * 60} y={227}>E{e}</MoeText>
      {e < budget.k && <MoeText x={18 + e * 60} y={259}>✓</MoeText>}
    </g>)}
    <MoeText x={18} y={305}>Stored expert maps: {count.stored.toLocaleString()} parameters.</MoeText>
    <MoeText x={18} y={336}>Active expert work: {count.active.toLocaleString()} MACs per token.</MoeText>
    <MoeText x={18} y={369}>Router: {count.router.toLocaleString()} entries; shared experts: {budget.shared}.</MoeText>
  </MoeScene>;
}
