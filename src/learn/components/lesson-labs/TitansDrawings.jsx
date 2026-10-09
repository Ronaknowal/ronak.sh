import { useEffect, useId, useRef, useState } from 'react';
import { scalar as f, vector as v, dot, projectionCase } from '../../data/titans-reading-flow-models.js';
import './titans-reading-flow.css';

export const ink = { data: 'var(--titans-data)', computed: 'var(--titans-computed)', parameter: 'var(--titans-parameter)', gradient: 'var(--titans-gradient)', forward: 'var(--titans-forward)' };
export const Text = ({ x, y, children, role = '', color, anchor = 'start' }) => <text x={x} y={y} textAnchor={anchor} fill={color || ink[role] || 'currentColor'}>{children}</text>;
export function Wire({ x1, y1, x2, y2, role = '', dashed = false }) {
  const angle = Math.atan2(y2 - y1, x2 - x1), bx = x2 - 8 * Math.cos(angle), by = y2 - 8 * Math.sin(angle);
  return <g data-wire-role={role || 'forward'} fill={role === 'gradient' ? ink.gradient : ink.forward} stroke={role === 'gradient' ? ink.gradient : ink.forward}><line x1={x1} y1={y1} x2={bx} y2={by} strokeWidth="1.5" strokeDasharray={dashed || role === 'gradient' ? '5 4' : undefined}/><polygon points={`${x2},${y2} ${bx - 4 * Math.sin(angle)},${by + 4 * Math.cos(angle)} ${bx + 4 * Math.sin(angle)},${by - 4 * Math.cos(angle)}`}/></g>;
}
export function Route({ points, role = '' }) { const end = points.at(-1), prior = points.at(-2); return <g><polyline points={points.slice(0, -1).map(p => p.join(',')).join(' ')} fill="none" stroke={role === 'gradient' ? ink.gradient : ink.forward} strokeDasharray={role === 'gradient' ? '5 4' : undefined} strokeWidth="1.5"/><Wire x1={prior[0]} y1={prior[1]} x2={end[0]} y2={end[1]} role={role}/></g>; }
export function Cells({ x, y, rows, role = 'computed', label, cell = 108 }) {
  return <g><Text x={x} y={y - 12} role={role}>{label}</Text>{rows.map((row, i) => row.map((value, j) => <g key={`${i}-${j}`}><rect x={x + j * cell} y={y + i * 35} width={cell} height="35" fill="none" stroke={ink[role]}/><Text x={x + (j + .5) * cell} y={y + i * 35 + 23} role={role} anchor="middle">{typeof value === 'number' ? f(value) : value}</Text></g>))}</g>;
}
export function Operator({ x, y, label, radius = 22 }) { return <g data-operation={label}><rect x={x-radius} y={y-radius} width={radius*2} height={radius*2} rx="5" stroke="currentColor" fill="var(--titans-paper)"/><Text x={x} y={y + 6} anchor="middle">{label}</Text></g>; }
export function Drawing({ title, width = 900, height = 250, children }) {
  const ref = useRef(null), id = useId(), [overflow, setOverflow] = useState(false);
  useEffect(() => { const node = ref.current, measure = () => setOverflow(node.scrollWidth > node.clientWidth + 1); const observer = new ResizeObserver(measure); observer.observe(node); observer.observe(node.firstElementChild); measure(); return () => observer.disconnect(); }, [width, height]);
  return <figure className="titans-drawing">{overflow && <p id={id} className="titans-pan-hint">Picture continues horizontally. Swipe or scroll to follow the circuit; focus the picture and use ← / →.</p>}<div ref={ref} className="titans-drawing-scroll" tabIndex="0" role="region" aria-describedby={overflow ? id : undefined} aria-label={`Scrollable drawing: ${title}`}><svg role="img" aria-label={title} viewBox={`0 0 ${width} ${height}`} style={{ width: `${width / 16}rem`, height: `${height / 16}rem` }}><title>{title}</title>{children}</svg></div></figure>;
}

export function PlacesDrawing() {
  return <Drawing title="Recent rows, fast parameter grid and shared prefix have different lifetimes" width={330} height={580}>
    <Text x={15} y={28}>Storage at position 7</Text>
    <Cells x={15} y={70} rows={[[5, 'x₅'], [6, 'x₆']]} cell={120} role="data" label="Recent rows: separate positions"/>
    <Cells x={15} y={205} rows={[[.5, 0], [0, .5]]} cell={120} label="Fast weights φ: request writes" role="parameter"/>
    <Cells x={15} y={340} rows={[[0, 0], [0, 0]]} cell={120} label="Matching velocity S" role="computed"/>
    <Cells x={15} y={480} rows={[[1, 0]]} cell={120} label="Persistent prefix P: fixed here" role="parameter"/>
    <Text x={15} y={556}>These objects feed later reads.</Text>
  </Drawing>;
}

// The opening circuit runs top to bottom and fits an ordinary phone.
export function ReadDrawing({ weight, query, title = 'A read multiplies each query coordinate by its weight, then adds', target = null, caseLabel = null }) {
  const result = dot(weight, query);
  return <Drawing title={title} width={330} height={target === null ? 390 : 470}>
    <Text x={15} y={26}>{caseLabel || 'Top to bottom: multiply, then sum'}</Text>
    {query.map((q,i) => <g key={i}><Cells x={15} y={70+i*110} cell={78} rows={[[q]]} label={`${target === null ? 'q' : 'k'}${i+1}`} role="data"/><Cells x={220} y={70+i*110} cell={78} rows={[[weight[i]]]} label={`w${i+1}`} role="parameter"/>
      <Wire x1={93} y1={87+i*110} x2={143} y2={87+i*110}/><Wire x1={220} y1={87+i*110} x2={187} y2={87+i*110}/><Operator x={165} y={87+i*110} label="×"/>
      <Wire x1={165} y1={109+i*110} x2={165} y2={128+i*110}/><Text x={165} y={148+i*110} anchor="middle" role="computed">product {i+1} = {f(q*weight[i])}</Text>
      <Route points={[[i ? 220 : 110,153+i*110],[i ? 320 : 5,153+i*110],[i ? 320 : 5,312],[i ? 187 : 143,312]]}/>
    </g>)}<Operator x={165} y={312} label="+"/><Wire x1={165} y1={334} x2={165} y2={352}/><Text x={165} y={378} anchor="middle" role="computed">M({target === null ? 'q' : 'k'}) = {f(result)}</Text>
    {target !== null && <><Text x={15} y={420} role="data">Target v = {f(target)}</Text><Text x={15} y={455} role="computed">Residual = {f(result-target)}</Text></>}
  </Drawing>;
}

export function WriteDrawing({ before, keyValue, target, write, rate, retention = 0, decay = 0, momentum = [0, 0], basic = false }) {
  const w = before, g = write.gradient[0], after = write.weight[0];
  return <><Drawing title="The write subtracts its arrived target from the current read" width={330} height={230}>
    <Cells x={15} y={65} cell={105} rows={[[write.before[0]]]} label="M(k)"/><Cells x={205} y={65} cell={105} rows={[[target]]} label="arrived v" role="data"/>
    <Wire x1={120} y1={82} x2={143} y2={140}/><Wire x1={205} y1={82} x2={187} y2={140}/><Operator x={165} y={140} label="−"/><Wire x1={165} y1={162} x2={165} y2={183}/><Text x={165} y={209} anchor="middle" role="computed">r = {f(write.residual[0])}; L = {f(write.loss)}</Text>
  </Drawing>{g.map((value,j) => basic ? <Drawing key={j} title={`Basic write coordinate ${j+1}: residual and key feed the gradient, rate and weight`} width={330} height={520}>
    <Cells x={15} y={65} cell={105} rows={[[write.residual[0]]]} label="residual r" role="gradient"/><Cells x={205} y={65} cell={105} rows={[[keyValue[j]]]} label={`key k${j+1}`} role="data"/>
    <Wire x1={120} y1={82} x2={143} y2={140} role="gradient"/><Wire x1={205} y1={82} x2={187} y2={140} role="gradient"/><Operator x={165} y={140} label="×"/>
    <Wire x1={165} y1={162} x2={165} y2={181} role="gradient"/><Text x={165} y={207} role="gradient" anchor="middle">g{j+1} = {f(value)}</Text>
    <Cells x={15} y={245} cell={105} rows={[[rate]]} label="write rate θ" role="parameter"/><Route points={[[120,262],[143,300]]}/><Wire x1={165} y1={215} x2={165} y2={278} role="gradient"/><Operator x={165} y={300} label="−×"/>
    <Wire x1={165} y1={322} x2={165} y2={341}/><Text x={165} y={367} anchor="middle" role="computed">step −θg = {f(-rate*value)}</Text>
    <Cells x={15} y={405} cell={105} rows={[[w[j]]]} label={`old w${j+1}`} role="parameter"/><Wire x1={120} y1={422} x2={143} y2={450}/><Wire x1={165} y1={375} x2={165} y2={428}/><Operator x={165} y={450} label="+"/>
    <Wire x1={165} y1={472} x2={165} y2={486}/><Text x={165} y={512} role="parameter" anchor="middle">new w{j+1} = {f(after[j])}</Text>
  </Drawing> : <Drawing key={j} title={`General write coordinate ${j+1}: gradient, velocity and shrinkage join their actual operands`} width={1140} height={380}>
    <Cells x={20} y={65} rows={[[write.residual[0]]]} label="residual r" role="gradient"/><Cells x={20} y={160} rows={[[keyValue[j]]]} label={`key k${j+1}`} role="data"/>
    <Wire x1={128} y1={82} x2={198} y2={82} role="gradient"/><Route points={[[128,177],[220,177],[220,104]]} role="gradient"/><Operator x={220} y={82} label="×"/><Wire x1={242} y1={82} x2={270} y2={82} role="gradient"/><Cells x={285} y={65} rows={[[value]]} label="gradient g" role="gradient"/>
    <Cells x={285} y={185} rows={[[rate]]} label="θ" role="parameter"/><Wire x1={393} y1={82} x2={453} y2={82} role="gradient"/><Route points={[[393,202],[475,202],[475,104]]}/><Operator x={475} y={82} label="−×"/><Wire x1={497} y1={82} x2={540} y2={82}/><Cells x={555} y={65} rows={[[-rate*value]]} label="fresh step"/>
    <Cells x={555} y={230} rows={[[retention*momentum[j]]]} label={`ηS = ${f(retention)}×${f(momentum[j])}`}/><Wire x1={663} y1={82} x2={723} y2={82}/><Route points={[[663,247],[745,247],[745,104]]}/><Operator x={745} y={82} label="+"/><Wire x1={767} y1={82} x2={805} y2={82}/><Cells x={820} y={65} rows={[[write.momentum[0][j]]]} label="new S′"/>
    <Cells x={820} y={230} rows={[[(1-decay)*w[j]]]} label={`(1−α)w = ${f((1-decay)*w[j])}`} role="computed"/><Wire x1={928} y1={82} x2={1003} y2={82}/><Route points={[[928,247],[1110,247],[1110,82],[1047,82]]}/><Operator x={1025} y={82} label="+"/><Wire x1={1025} y1={104} x2={1025} y2={160}/><Cells x={970} y={160} rows={[[after[j]]]} role="parameter"/><Text x={970} y={225} role="parameter">new w{j+1}</Text>
    <Text x={20} y={350}>Old w = {f(w[j])}; α = {f(decay)}. The applied change includes shrinkage and S′.</Text>
  </Drawing>)}</>;
}

export function KeyGeometry({ keyValue, query }) {
  const origin = [230, 155], scale = 48;
  const keyEnd = [origin[0]+keyValue[0]*scale, origin[1]-keyValue[1]*scale], queryEnd = [origin[0]+query[0]*scale, origin[1]-query[1]*scale];
  const keyZero = keyValue.every(x=>x===0), queryZero = query.every(x=>x===0), coincident = keyValue.every((x,i)=>x===query[i]);
  const endpoint = (point, label, lower=false) => <g data-vector-endpoint={label}><polyline points={`${point.join(',')} ${point[0]+10},${point[1]+(lower?23:-12)} ${point[0]+24},${point[1]+(lower?23:-12)}`} fill="none" stroke={ink.data}/><Text x={point[0]+28} y={point[1]+(lower?29:-6)} role="data">{label}</Text></g>;
  return <Drawing title="Key and query overlap determines the old read change in the plain linear rule" width={780} height={370}>
    <path d="M120 155 H340 M230 45 V265" fill="none" stroke="currentColor"/>
    <Text x={345} y={242}>coordinate 1 →</Text><Text x={180} y={32}>coordinate 2 ↑</Text>
    {!keyZero && <Wire x1={origin[0]} y1={origin[1]} x2={keyEnd[0]} y2={keyEnd[1]} role="data"/>}
    {!queryZero && !coincident && <Wire x1={origin[0]} y1={origin[1]} x2={queryEnd[0]} y2={queryEnd[1]} role="data" dashed/>}
    {coincident ? <><circle cx={keyEnd[0]} cy={keyEnd[1]} r="5" fill="var(--titans-paper)" stroke={ink.data}/>{endpoint(keyEnd,keyZero?'k = q = 0':'k = q')}</> : <>
      <circle cx={keyEnd[0]} cy={keyEnd[1]} r="4" fill="var(--titans-paper)" stroke={ink.data}/>{endpoint(keyEnd,keyZero?'k = 0':'k')}
      <rect x={queryEnd[0]-4} y={queryEnd[1]-4} width="8" height="8" fill="var(--titans-paper)" stroke={ink.data}/>{endpoint(queryEnd,queryZero?'q = 0':'q',true)}
    </>}
    <Text x={440} y={85} role="data">key k={v(keyValue)}</Text><Text x={440} y={120} role="data">query q={v(query)}</Text>
    <Text x={440} y={170}>k·q={f(keyValue[0])}×{f(query[0])}</Text><Text x={482} y={201}>+{f(keyValue[1])}×{f(query[1])}={f(dot(keyValue, query))}</Text>
    <Text x={20} y={330}>{coincident ? (keyZero?'Both zero vectors are named at the origin.':'One shared arrow: k and q have the same endpoint.') : 'Key: solid arrow / circle. Query: dashed arrow / square.'}</Text>
    <Text x={20} y={357}>Fixed ±2.2 axes; a zero vector has an origin marker and no arrow.</Text>
  </Drawing>;
}

export function WeightedTermsDrawing({ inputs, weights, bias = 0, withBias = true, title, inputLabel = 'input', inputRole = 'data', weightLabel = 'weight', weightRole = 'parameter', outputLabel = 'sum' }) {
  const products = inputs.map((value, i) => value * weights[i]), sum = products.reduce((a, b) => a + b, 0), center = 65 + (inputs.length - 1) * 45;
  const backward = inputRole === 'gradient' || weightRole === 'gradient', flowRole = backward ? 'gradient' : '', resultRole = backward ? 'gradient' : 'computed';
  return <Drawing title={title} width={1080} height={inputs.length * 90 + 160}>
    {inputs.map((value, i) => <g key={i}><Cells x={20} y={65 + i * 90} rows={[[weights[i]]]} label={`${weightLabel} ${i + 1}`} role={weightRole}/><Cells x={190} y={110 + i * 90} rows={[[value]]} label={`${inputLabel} ${i + 1}`} role={inputRole}/>
      <Wire x1={128} y1={82 + i * 90} x2={348} y2={82 + i * 90} role={flowRole}/><Route points={[[298,127+i*90],[370,127+i*90],[370,104+i*90]]} role={flowRole}/><Operator x={370} y={82 + i * 90} label="×"/><Wire x1={392} y1={82 + i * 90} x2={430} y2={82 + i * 90} role={flowRole}/><Cells x={445} y={65 + i * 90} rows={[[products[i]]]} label="product" role={resultRole}/>
    </g>)}<path d={`M563 65 H580 V${65 + (inputs.length - 1) * 90 + 35} H563`} fill="none" stroke={ink[resultRole]} strokeDasharray={backward?'5 4':undefined}/><Wire x1={580} y1={center} x2={625} y2={center} role={flowRole}/><Operator x={650} y={center} label="Σ"/><Wire x1={672} y1={center} x2={720} y2={center} role={flowRole}/><Text x={735} y={center + 6} role={resultRole}>Σ={f(sum)}</Text>
    {withBias && <><Cells x={735} y={center + 70} rows={[[bias]]} label="bias" role="parameter"/><Wire x1={850} y1={center} x2={898} y2={center}/><Route points={[[843,center+87],[920,center+87],[920,center+22]]}/><Operator x={920} y={center} label="+"/><Wire x1={942} y1={center} x2={975} y2={center}/><Text x={985} y={center+6} role="computed">{f(sum+bias)}</Text></>}<Text x={20} y={inputs.length * 90 + 145} role={resultRole}>{outputLabel} = Σ products{withBias?' + bias':''} = {f(sum + (withBias?bias:0))}.</Text>
  </Drawing>;
}

export function SensitivityDrawing() { return <Drawing title="A Jacobian routes residuals into parameter gradients" width={900} height={210}>
  <Cells x={20} y={60} rows={[[1, 0], [0, 0]]} label="Jᵀ" role="computed"/><Cells x={300} y={60} rows={[[1], [0]]} label="r₁" role="gradient"/>
  <Wire x1={236} y1={93} x2={465} y2={95}/><Wire x1={408} y1={93} x2={465} y2={95}/><Operator x={490} y={95} label="×"/><Wire x1={512} y1={95} x2={565} y2={95}/><Cells x={580} y={60} rows={[[1], [0]]} label="g₁" role="gradient"/>
  <Text x={20} y={177}>Change r to [0,2]: loss rises from .5 to 2, but Jᵀr becomes [0,0].</Text>
</Drawing>; }

export function NonlinearDrawing({ model }) {
  const { key, parameters: p, initial: r, write, read } = model;
  return <>{r.pre.map((z,i) => <Drawing key={`forward-${i}`} title={`Hidden unit ${i+1}: two learned weights and a bias join their actual products`} width={1240} height={250}>
    {key.map((value,j) => <g key={j}><Cells x={20} y={65+j*100} rows={[[value]]} label={`k${j+1}`} role="data"/><Cells x={175} y={30+j*100} rows={[[p[0][i][j]]]} label={`W₁[${i+1},${j+1}]`} role="parameter"/><Wire x1={128} y1={82+j*100} x2={345} y2={82+j*100}/><Route points={[[283,47+j*100],[365,47+j*100],[365,60+j*100]]}/><Operator x={365} y={82+j*100} label="×"/><Wire x1={387} y1={82+j*100} x2={430} y2={82+j*100}/><Text x={445} y={88+j*100} role="computed">{f(value*p[0][i][j])}</Text><Wire x1={535} y1={82+j*100} x2={623} y2={j?148:116}/></g>)}
    <Cells x={590} y={200} rows={[[p[1][i]]]} label={`b₁[${i+1}]`} role="parameter"/><Wire x1={644} y1={200} x2={644} y2={154}/><Operator x={645} y={132} label="Σ"/><Wire x1={667} y1={132} x2={715} y2={132}/><Text x={730} y={138} role="computed">z = {f(z)}</Text><Wire x1={840} y1={132} x2={893} y2={132}/><Operator x={925} y={132} label="SiLU" radius={32}/><Wire x1={957} y1={132} x2={1000} y2={132}/><Text x={1015} y={138} role="computed">h{i+1} = {f(r.hidden[i])}</Text>
  </Drawing>)}<WeightedTermsDrawing inputs={r.hidden} inputRole="computed" weights={p[2][0]} bias={p[3][0]} inputLabel="hidden h" weightLabel="W₂" title="The three hidden activations multiply W₂, sum and receive the output bias" outputLabel="initial nonlinear read"/>
  <Drawing title="The output residual directly credits its bias and feeds all three reverse branches" width={900} height={220}><Cells x={20} y={65} rows={[[write.residual]]} label="r = output − target" role="gradient"/><Wire x1={128} y1={82} x2={260} y2={82} role="gradient"/><Cells x={280} y={65} rows={[[write.gradient[3][0]]]} label="∂L/∂b₂ = r" role="gradient"/><Wire x1={388} y1={82} x2={480} y2={82} role="gradient"/><Text x={500} y={88} role="gradient">Same r feeds each branch below.</Text><Text x={20} y={183}>Orange dashed paths carry reverse credit. Zero credit remains visible.</Text></Drawing>
  {r.pre.map((z,i) => {const sigmoid=1/(1+Math.exp(-z)), derivative=sigmoid+z*sigmoid*(1-sigmoid), dz=write.gradient[1][i]; return <Drawing key={`reverse-${i}`} title={`Reverse hidden unit ${i+1}: residual, output weight, SiLU derivative and both input credits`} width={1510} height={460}>
    <Cells x={20} y={70} rows={[[write.residual]]} label="r" role="gradient"/><Cells x={20} y={190} rows={[[p[2][0][i]]]} label={`W₂[${i+1}]`} role="parameter"/><Wire x1={128} y1={87} x2={198} y2={87} role="gradient"/><Route points={[[128,207],[220,207],[220,109]]} role="gradient"/><Operator x={220} y={87} label="×"/><Wire x1={242} y1={87} x2={280} y2={87} role="gradient"/><Cells x={295} y={70} rows={[[write.residual*p[2][0][i]]]} label="∂L/∂h" role="gradient"/>
    <Cells x={295} y={190} rows={[[derivative]]} label="SiLU′(z)"/><Wire x1={403} y1={87} x2={473} y2={87} role="gradient"/><Route points={[[403,207],[495,207],[495,109]]} role="gradient"/><Operator x={495} y={87} label="×"/><Wire x1={517} y1={87} x2={555} y2={87} role="gradient"/><Cells x={570} y={70} rows={[[dz]]} label="∂L/∂z = ∂L/∂b₁" role="gradient"/>
    {key.map((k,j) => <g key={j}><Cells x={780} y={70+j*130} rows={[[k]]} label={`k${j+1}`} role="data"/><Route points={[[678,87],[730,87],[730,130+j*130],[970,130+j*130],[970,131+j*130]]} role="gradient"/><Route points={[[888,87+j*130],[925,87+j*130],[925,109+j*130],[948,109+j*130]]} role="gradient"/><Operator x={970} y={109+j*130} label="×"/><Wire x1={992} y1={109+j*130} x2={1030} y2={109+j*130} role="gradient"/><Cells x={1045} y={92+j*130} rows={[[write.gradient[0][i][j]]]} label={`∂L/∂W₁[${i+1},${j+1}]`} role="gradient"/></g>)}
    <Cells x={20} y={330} rows={[[r.hidden[i]]]} label={`h${i+1}`} role="computed"/><Route points={[[74,105],[155,105],[155,290],[220,290],[220,325]]} role="gradient"/><Wire x1={128} y1={347} x2={198} y2={347} role="gradient"/><Operator x={220} y={347} label="×"/><Wire x1={242} y1={347} x2={280} y2={347} role="gradient"/><Cells x={295} y={330} rows={[[write.gradient[2][0][i]]]} label={`∂L/∂W₂[${i+1}] = r h${i+1}`} role="gradient"/>
    <Text x={20} y={437}>After the same write: z{i+1} = {f(read.pre[i])}; h{i+1} = {f(read.hidden[i])}. Every gradient uses the pre-write state.</Text>
  </Drawing>;})}<p className="titans-live">Updated key read {f(read.output)}. Other query read: {f(model.otherBefore.output)} → {f(model.otherAfter.output)}.</p></>;
}

export function ParameterBankDrawing({ parameters: p, label = 'Actual nonlinear memory parameters' }) { return <Drawing title={label} width={1030} height={210}><Cells x={20} y={65} rows={p[0]} label="W₁ (hidden × input)" role="parameter"/><Cells x={310} y={65} rows={p[1].map(x => [x])} label="b₁ (hidden)" role="parameter"/><Cells x={485} y={65} rows={p[2]} label="W₂ (output × hidden)" role="parameter"/><Cells x={865} y={65} rows={[p[3]]} label="b₂ (output)" role="parameter"/></Drawing>; }
export function ZeroKeyDrawing() { return <Drawing title="A zero key blocks both backward parameter products even with a large residual" width={1000} height={230}><Cells x={20} y={65} rows={[[0, 0]]} label="key" role="data"/><Text x={300} y={88}>read 0, target 10 → r=−10, half-loss 50</Text><Wire x1={730} y1={82} x2={780} y2={82}/><Text x={800} y={65}>g₁=−10×0=0</Text><Text x={800} y={102}>g₂=−10×0=0</Text><Cells x={300} y={155} rows={[[0, 0]]} label="unchanged gradient and weight increments"/></Drawing>; }
export function CausalStateDrawing({ state, other }) { return <Drawing title="A request carries a parameter matrix, matching momentum and actual recent rows together" width={1120} height={300}><Cells x={20} y={75} rows={state.weight} label="A: W" role="parameter"/><Cells x={300} y={75} rows={state.momentum} label="A: S" role="computed"/><Cells x={580} y={75} rows={state.recent} label="A: recent rows" role="data"/><Wire x1={125} y1={146} x2={125} y2={220}/><Wire x1={405} y1={146} x2={405} y2={220}/><Wire x1={685} y1={146} x2={685} y2={220}/><Text x={20} y={253}>Same owned tuple → next A suffix; fresh suffix restores zeros and empty rows.</Text><Cells x={850} y={75} rows={other.weight} label="B: independent request" role="parameter"/><Text x={850} y={197}>B never receives A's tuple.</Text></Drawing>; }
export function FixedFactorsDrawing() { return <Drawing title="Four residual factors distinguish contraction from oscillation and growth" width={1220} height={310}>{[.5, -.5, -1, -1.5].map((factor, panel) => { const extent = panel === 3 ? 12 : 1, x0 = 35 + panel * 300, y0 = 160; return <g key={factor}><Text x={x0} y={30}>factor {factor}: y±{extent}</Text><path d={`M${x0} ${y0} h240 M${x0} 55 V265`} stroke="currentColor" fill="none"/><polyline points={Array.from({ length: 7 }, (_, i) => `${x0 + i * 38},${y0 - factor ** i / extent * 100}`).join(' ')} stroke={ink.computed} fill="none"/><Text x={x0} y={292}>steps 0–6; r₀=1</Text></g>; })}</Drawing>; }
export function WindowObjectiveDrawing() { return <Drawing title="Two available residuals feed a mean-gradient node" width={1130} height={250}><Cells x={20} y={65} rows={[[1, 1], [1, 3]]} label="keys and arrived targets" role="data"/>{[-1, -3].map((r, i) => <g key={r}><Wire x1={236} y1={82 + i * 35} x2={280} y2={82 + i * 70}/><Text x={300} y={88 + i * 70}>r={r}, g={r}×1={r}</Text><Wire x1={500} y1={82 + i * 70} x2={560} y2={117}/></g>)}<Operator x={585} y={117} label="Σ"/><Wire x1={607} y1={117} x2={650} y2={117}/><Text x={670} y={105}>(−1−3)/2=−2</Text><Text x={670} y={142} role="parameter">w′=0−.25×(−2)=.5</Text><Text x={20} y={220}>Latest-only gradient −3 yields .75. Duplicate targets 3/3 give .75 in both; this changes the objective, not the anchor.</Text></Drawing>; }
export function FrequencyDrawing() { return <Drawing title="Two parameter banks update at different declared clocks" width={1190} height={330}><Cells x={20} y={75} rows={[[0, 0]]} label="fast bank" role="parameter"/><Cells x={20} y={220} rows={[[0, 0]]} label="slow bank" role="parameter"/>{[1, 2, 3, 4].map((n, i) => <g key={n}><Cells x={315 + i * 210} y={75} cell={170} rows={[[`φfast,${n}`]]} label={`arrival${n} → gradient`} role="parameter"/><Wire x1={i ? 275 + i * 210 : 236} y1={92} x2={300 + i * 210} y2={92}/>{n === 4 && <><Cells x={945} y={220} cell={170} rows={[[ 'φslow,1' ]]} label="arrival 4 → slow gradient" role="parameter"/><Wire x1={236} y1={237} x2={930} y2={237}/><Wire x1={1030} y1={112} x2={1030} y2={190} dashed/></>}</g>)}<Text x={20} y={310}>Fast writes at 1,2,3,4; slow writes only at 4. These declared clocks illustrate nested learning, not a fitted HOPE model.</Text></Drawing>; }
export function DistillationDrawing() { return <Drawing title="Teacher and student answer the same causal position" width={1140} height={340}><Cells x={20} y={65} cell={90} rows={[[ 'x₁', 'x₂', 'x₃', 'x₄' ]]} label="teacher available rows at position 4" role="data"/><Cells x={20} y={200} cell={90} rows={[[ 'x₃', 'x₄' ]]} label="student shorter context at position 4" role="data"/><Wire x1={380} y1={82} x2={430} y2={82}/><Text x={450} y={88}>teacher output 2 → stop gradient</Text><Wire x1={780} y1={82} x2={850} y2={167}/><Wire x1={200} y1={217} x2={430} y2={217}/><Text x={450} y={223}>student w0, key 1 → output 0</Text><Wire x1={780} y1={217} x2={850} y2={167}/><Operator x={875} y={167} label="−"/><Text x={935} y={173}>r=−2</Text><Text x={450} y={288} role="parameter">θ=.1 → w′=.2; equal teacher/student 0 → no change</Text><Text x={20} y={330}>Position 5 is unavailable. Auxiliary imitation loss still needs a separate later queried-task evaluation.</Text></Drawing>; }

export function ProjectionDrawing() {
  const p = projectionCase();
  return <>{p.branches.map((b,i) => <Drawing key={i} title={`${['q','k','v'][i]} branch: independent activation and parameter operands project, filter, then normalize`} width={2060} height={430}>
    <Cells x={20} y={70} rows={p.history} label="X: oldest → newest rows" role="data" cell={75}/><Cells x={20} y={240} rows={b.matrix} label={`W${['q','k','v'][i]}`} role="parameter" cell={75}/>
    <Wire x1={170} y1={122} x2={278} y2={122}/><Route points={[[170,275],[300,275],[300,144]]}/><Operator x={300} y={122} label="×"/><Wire x1={322} y1={122} x2={360} y2={122}/><Cells x={375} y={70} rows={b.rows} label="XWᵀ: projected time rows" cell={75}/>
    <Cells x={375} y={260} rows={p.kernel} label="kernel: time × channel" role="parameter" cell={75}/>
    {[0,1].map(c => <g key={c}><Route points={[[525,87+c*35],[600,87+c*35],[600,110+c*175],[628,110+c*175]]}/><Route points={[[525,277+c*35],[550,277+c*35],[550,155+c*175],[650,155+c*175],[650,132+c*175]]}/><Operator x={650} y={110+c*175} label="×"/><Wire x1={672} y1={110+c*175} x2={710} y2={110+c*175}/><Cells x={725} y={93+c*175} cell={105} rows={[b.rows.map((r,t)=>r[c]*p.kernel[t][c])]} label={`channel ${c+1}: timewise products`}/><Wire x1={1040} y1={110+c*175} x2={1098} y2={110+c*175}/><Operator x={1120} y={110+c*175} label="Σ"/><Wire x1={1142} y1={110+c*175} x2={1180} y2={110+c*175}/><Cells x={1195} y={93+c*175} rows={[[b.convolved[c]]]} label={`filtered ${c+1}`}/></g>)}
    <Route points={[[1303,110],[1335,110],[1335,180],[1408,180]]}/><Route points={[[1303,285],[1335,285],[1335,220],[1408,220]]}/><Operator x={1450} y={200} label={i<2?'L2':'keep'} radius={42}/><Wire x1={1492} y1={200} x2={1530} y2={200}/><Cells x={1545} y={165} rows={[i<2?b.unit:b.convolved]} label={`${['q','k','v'][i]} output`} cell={100}/>
    <Text x={1545} y={255}>{i<2?`√(${f(b.convolved[0])}² + ${f(b.convolved[1])}²) = ${f(b.norm)}`:'Values remain unnormalized.'}</Text><Text x={1545} y={295}>{i<2?`Divide each filtered channel by ${f(b.norm)}.`:'Only q and k use this unit norm.'}</Text>
    <Text x={20} y={409}>Each column uses its own channel taps. X and W supply distinct inputs to ×; the projected history and kernel do the same.</Text>
  </Drawing>)}<p>Unequal taps expose the order: filtering raw rows before Wk gives {v(p.wrong)}, while projection before filtering gives {v(p.branches[1].convolved)}. This fixture uses the identity activation.</p></>;
}

export function GatedDrawing({ record: r, position }) {
  return <Drawing title={`Position ${position}: separate attention products and memory products meet at a coordinate gate`} width={1280} height={480}>
    <Cells x={20} y={75} rows={r.context} label="P + permitted recent rows" role="data" cell={85}/>
    <Cells x={20} y={250} rows={[r.input]} label="current x=q=k=v" role="data" cell={85}/>
    {r.context.map((row, i) => <g key={i}><Wire x1={190} y1={92 + i * 35} x2={240} y2={92 + i * 35}/><Text x={255} y={98 + i * 35}>({f(row[0])}×{f(r.input[0])}+{f(row[1])}×{f(r.input[1])})/√2={f(r.scores[i])}</Text></g>)}
    <Text x={255} y={228}>softmax: subtract max, exp, divide by sum</Text><Text x={255} y={258} role="computed">weights {v(r.attention)}</Text>
    <Wire x1={670} y1={165} x2={720} y2={165}/><Text x={740} y={159} role="computed">a₁=Σ pᵢVᵢ₁={f(r.short[0])}</Text><Text x={740} y={192} role="computed">a₂=Σ pᵢVᵢ₂={f(r.short[1])}</Text>
    <Cells x={255} y={315} rows={r.weight} label="written fast matrix W" role="parameter" cell={110}/>
    <Route points={[[190,267],[210,267],[210,400],[525,400],[525,362]]} role="data"/><Wire x1={475} y1={340} x2={500} y2={340} role="parameter"/><Operator x={525} y={340} label="×"/><Wire x1={547} y1={340} x2={605} y2={340}/><Text x={620} y={324} role="computed">m={v(r.long)}</Text><Text x={620} y={360} role="computed">tanh(m)={v(r.gate)}</Text>
    {[0, 1].map(j => <g key={j}><Wire x1={1015} y1={159 + j * 33} x2={1050} y2={250 + j * 90}/><Wire x1={890} y1={355} x2={1075} y2={272 + j * 90}/><Operator x={1075} y={250 + j * 90} label="×"/><Text x={1130} y={230+j*90} role="computed">gate{j+1}={f(r.gate[j])}</Text><Wire x1={1097} y1={250 + j * 90} x2={1135} y2={250 + j * 90}/><Text x={1145} y={256 + j * 90} role="computed">y{j + 1}={f(r.output[j])}</Text></g>)}
    <Text x={20} y={453}>Persist W, momentum S and recent rows together. Identity projections here isolate MAG; the paper route above includes projections/convolutions.</Text>
  </Drawing>;
}

export function JunctionsDrawing() { return <Drawing title="MAC adds causal retrieval rows; MAG multiplies parallel lanes; MAL composes layers" width={1250} height={540}>
  <Text x={20} y={28}>MAC: current-query retrieval from old φ joins P and X; the separate mask limits attention.</Text>
  <Cells x={20} y={65} rows={[[1, 0], [1, 0], [0, 1]]} label="P | R(current only) | X" role="computed" cell={100}/><Cells x={290} y={220} rows={[[1, 0, 0], [1, 1, 0], [1, 1, 1]]} label="causal permission operand" cell={70}/>
  <Wire x1={220} y1={117} x2={478} y2={117}/><Route points={[[500,272],[530,272],[530,167]]}/><Operator x={530} y={117} label="attn" radius={50}/><Wire x1={580} y1={117} x2={620} y2={117}/><Text x={640} y={123} role="computed">Y → write/read φ′ → Mφ′(Y) × Y</Text>
  <Text x={20} y={350}>MAG</Text><Cells x={20} y={395} rows={[[1, 0]]} label="x" role="data"/><Wire x1={236} y1={412} x2={290} y2={385}/><Wire x1={236} y1={412} x2={290} y2={455}/><Text x={310} y={391}>P + local attention → a</Text><Text x={310} y={461}>write x → Mφ′(x) → tanh(m)</Text><Wire x1={625} y1={385} x2={708} y2={412}/><Wire x1={625} y1={455} x2={730} y2={434}/><Operator x={730} y={412} label="×"/><Wire x1={752} y1={412} x2={795} y2={412}/><Text x={810} y={418}>output a⊙tanh(m)</Text>
  <Text x={20} y={520}>MAL: [P | X] → memory layer → transformed rows → sliding-window attention → output</Text>
</Drawing>; }

export function OuterDrawing({ rate, keep, result }) { return <><Drawing title="A slow rate and inner gradient produce the fast weight used by a later query" width={1270} height={350}>
  <Cells x={20} y={65} rows={[[2,1]]} label="inner key and arrived target" role="data"/><Wire x1={236} y1={82} x2={398} y2={82}/><Cells x={20} y={195} rows={[[0]]} label="initial w₀" role="parameter"/><Route points={[[128,212],[435,212],[435,119]]}/><Operator x={435} y={82} label="∇L" radius={37}/><Wire x1={472} y1={82} x2={510} y2={82}/><Cells x={525} y={65} rows={[[-2]]} label="inner gradient" role="gradient"/>
  <Cells x={525} y={195} rows={[[rate]]} label="slow θ" role="parameter"/><Wire x1={633} y1={82} x2={703} y2={82}/><Route points={[[633,212],[725,212],[725,104]]}/><Operator x={725} y={82} label="−×"/><Wire x1={747} y1={82} x2={785} y2={82}/><Cells x={800} y={65} rows={[[result.weight]]} label="fast w′ = w₀−θg" role="parameter"/>
  <Cells x={800} y={195} rows={[[3]]} label="later query q" role="data"/><Wire x1={908} y1={82} x2={978} y2={82}/><Route points={[[908,212],[1000,212],[1000,104]]}/><Operator x={1000} y={82} label="×"/><Wire x1={1022} y1={82} x2={1060} y2={82}/><Cells x={1075} y={65} rows={[[result.prediction]]} label="later prediction"/>
  <Text x={20} y={315}>Later target = 2; residual = {f(result.prediction-2)}; outer half-loss = {f(result.loss)}.</Text>
</Drawing><Drawing title="Outer residual contracts the query and write-rate sensitivity, then updates the slow rate" width={1270} height={310}>
  <Cells x={20} y={65} rows={[[result.prediction-2]]} label="outer residual" role="gradient"/><Cells x={20} y={195} rows={[[3]]} label="∂prediction/∂w′ = q" role="computed"/><Wire x1={128} y1={82} x2={198} y2={82} role="gradient"/><Route points={[[128,212],[220,212],[220,104]]} role="gradient"/><Operator x={220} y={82} label="×"/><Wire x1={242} y1={82} x2={280} y2={82} role="gradient"/><Cells x={295} y={65} rows={[[3*(result.prediction-2)]]} label="∂L/∂w′" role="gradient"/>
  <Cells x={295} y={195} rows={[[2]]} label="∂w′/∂θ = −g"/><Wire x1={403} y1={82} x2={473} y2={82} role="gradient"/><Route points={[[403,212],[495,212],[495,104]]} role="gradient"/><Operator x={495} y={82} label="×"/><Wire x1={517} y1={82} x2={555} y2={82} role="gradient"/><Cells x={570} y={65} rows={[[keep?result.derivative:'absent']]} label={keep?'∂L/∂θ':'detach: stop θ path'} role="gradient"/>
  {keep && <><Wire x1={678} y1={82} x2={748} y2={82} role="gradient"/><Operator x={790} y={82} label="step" radius={42}/><Wire x1={832} y1={82} x2={870} y2={82}/><Cells x={885} y={65} rows={[[result.nextRate]]} label="θ − .01 ∂L/∂θ" role="parameter"/><Cells x={885} y={195} rows={[[rate,.01]]} label="old θ and slow rate" role="parameter"/><Route points={[[885,212],[790,212],[790,124]]}/></>}
  <Text x={20} y={288}>{keep?`New later loss = ${f(result.nextLoss)}. Reverse contraction uses all three factors.`:'Detach keeps the forward numbers; no θ derivative is available (None), not a measured zero.'}</Text>
</Drawing></>; }

export function ChunkDrawing({ value, model }) { return <Drawing title="Two identical targets, two different gradient evaluation states" width={1180} height={330}>
  {['sequential', 'anchor'].map((name, row) => <g key={name}><Text x={20} y={35 + row * 140}>{name === 'sequential' ? 'Current-state gradient' : `Anchor refreshed every ${value.size} arrivals`}</Text><Text x={20} y={80 + row * 140} role="parameter">start {f(value.initial)}</Text>{model[name].map((r, i) => <g key={i}><Wire x1={150 + i * 470} y1={75 + row * 140} x2={195 + i * 470} y2={75 + row * 140}/><Text x={210 + i * 470} y={70 + row * 140} role="computed">g{i + 1}={f(r.evaluation)}−{f(r.target)}={f(r.gradient)}</Text><Text x={210 + i * 470} y={108 + row * 140} role="parameter">w{i + 1}={f(r.before)}−{f(value.rate)}×{f(r.gradient)}={f(r.weight)}</Text>{value.selected === i && <path d={`M${210 + i * 470} ${118 + row * 140} h385`} stroke="currentColor" strokeWidth="3"/>}</g>)}</g>)}<Text x={20} y={321}>Selected step {value.selected+1} has a thick underline. Size 1 refreshes every anchor; rate 0 keeps the start.</Text>
</Drawing>; }

export function ScanDrawing() { return <Drawing title="Affine operators compose actual operands, including coupled weight and momentum" width={1100} height={300}>
  <Text x={20} y={40} role="parameter">S₀=0</Text><Wire x1={85} y1={35} x2={130} y2={35}/><Text x={145} y={40}>×.5 +2 → S₁=2</Text><Wire x1={350} y1={35} x2={395} y2={35}/><Text x={410} y={40}>×.25 −1 → S₂=−.5</Text>
  <Text x={20} y={90}>Composed: (.25×.5, .25×2−1)=(.125,−.5); .125×0−.5=−.5</Text>
  <Cells x={20} y={165} rows={[[.9, .5], [0, .5]]} label="A on z=[φ,S]" role="computed"/><Cells x={300} y={165} rows={[[1], [.2]]} label="old z" role="parameter"/><Wire x1={236} y1={195} x2={450} y2={195}/><Wire x1={408} y1={195} x2={450} y2={195}/><Operator x={475} y={195} label="×"/><Wire x1={497} y1={195} x2={550} y2={195}/><Text x={570} y={183}>[.9×1+.5×.2, 0×1+.5×.2]</Text><Text x={570} y={221}>+[.2,.2]=[1.2,.3]</Text><Text x={20} y={287}>The operators must already be known. A changing nonlinear gradient is not made equal to an anchor gradient by a scan.</Text>
</Drawing>; }

export function BudgetDrawing() { return <Drawing title="Real matrix slabs, momentum copies and K/V history contribute different bytes" width={1100} height={370}>
  <Cells x={20} y={70} cell={115} rows={[[ '2048×512', '512×2048' ]]} label="bias-free parameter matrices: 2,097,152 entries" role="parameter"/>
  <Wire x1={250} y1={106} x2={310} y2={135}/><Cells x={330} y={110} rows={[[ 'W fp32', 'S fp32' ]]} label="16 MiB / layer / request" role="parameter"/>
  <Text x={650} y={136}>×24 layers ×4 requests =1.5 GiB</Text><Wire x1={546} y1={128} x2={630} y2={128}/>
  <Text x={20} y={200} role="data">K and V: 2 ×4 requests ×24 layers ×2048 rows ×8 heads ×128 coordinates ×2 bytes</Text>
  {[[1.5, 'fast W + S', 'parameter'], [.75, 'local K/V', 'data']].map(([n, label, role], i) => <g key={label}><rect x={20} y={235 + i * 45} width={n * 240} height="25" fill={ink[role]}/><Text x={410} y={255 + i * 45}>{label}: {n} GiB</Text></g>)}<Text x={20} y={357}>Partial sum 2.25 GiB. Full 131072-row K/V is 48 GiB; shared weights, prefix, workspace and other state are additional.</Text>
</Drawing>; }

export function ObjectiveDrawing({ target }) { const square = .1 * target, huber = .1 * Math.max(-1, Math.min(1, target)); return <Drawing title="The objective changes the derivative before the same parameter update" width={1000} height={240}>
  <Cells x={20} y={65} rows={[[0, 1, target]]} label="w=0, key=1, arrived target v" role="data"/><Wire x1={344} y1={82} x2={395} y2={82}/><Text x={415} y={88} role="computed">residual=−{f(target)}</Text>
  <Wire x1={615} y1={82} x2={680} y2={55}/><Wire x1={615} y1={82} x2={680} y2={150}/><Text x={700} y={61}>half-square g=−{f(target)}</Text><Text x={700} y={92} role="parameter">w′={f(square)}</Text><Text x={700} y={156}>Huber δ=1: clip(r)</Text><Text x={700} y={187} role="parameter">w′={f(huber)}</Text><Text x={20} y={227}>Same memory, rate .1 and no retention. Targets |v|≤1 give identical updates.</Text>
</Drawing>; }

export function ResearchRoutesDrawing() { return <Drawing title="Window targets, update clocks and teacher targets are separate changes to the write" width={1250} height={370}>
  <Cells x={20} y={65} rows={[[1, 3]]} label="ATLAS-style available window targets, k=1" role="data"/><Wire x1={236} y1={82} x2={280} y2={82}/><Text x={300} y={88}>mean gradients (−1−3)/2=−2 → rate .25 → w′=.5</Text><Text x={300} y={124}>latest-only −3 → w′=.75; duplicate targets 3/3 give .75 in both.</Text>
  <Text x={20} y={187}>Nested-learning illustrative clocks</Text>{[1, 2, 3, 4].map((n, i) => <g key={n}><Cells x={20 + i * 160} y={210} rows={[[n]]} label="arrival" role="data"/><Wire x1={75 + i * 160} y1={246} x2={75 + i * 160} y2={280}/><Text x={20 + i * 160} y={304} role="parameter">fast bank update</Text>{n === 4 && <Text x={670} y={304} role="parameter">also slow bank update</Text>}</g>)}
  <Text x={20} y={357}>TTCD: teacher rows1–4 and student rows3–4 both answer position 4; stop-gradient teacher output 2 → student w0,k1,θ.1 → w′=.2.</Text>
</Drawing>; }

export function VisionDrawing() { return <Drawing title="An applied rotation supplies an available auxiliary target while the class label stays withheld" width={1080} height={240}>
  <path d="M35 135 V45 H90 M180 45 H270 V100" stroke={ink.data} strokeWidth="10" fill="none"/><Wire x1={105} y1={85} x2={160} y2={85}/><Text x={90} y={170}>known 90° rotation</Text><Wire x1={290} y1={85} x2={340} y2={85}/><Text x={360} y={91} role="parameter">shared features → updated features</Text><Wire x1={715} y1={85} x2={770} y2={45}/><Wire x1={715} y1={85} x2={770} y2={135}/><Text x={790} y={51}>rotation target 90°</Text><Text x={790} y={141}>class prediction</Text><Text x={790} y={175}>class label withheld</Text><Text x={20} y={227}>Constructed mechanism illustration of vision TTT; no vision model was fitted for this lesson.</Text>
</Drawing>; }
