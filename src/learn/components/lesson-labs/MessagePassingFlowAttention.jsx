import { useState } from 'react';
import { FlowLab, FlowControls, FlowReadout } from './LessonFlow.jsx';
import { Drawing, Arrow, Paper, paperHues, channelHues } from './MessagePassingFlowElements.jsx';
import { AttentionQuantity, AttentionSelect, usePaperAttention, useScoreStage } from './MessagePassingAttentionState.jsx';
import { paperAttentionTrace, graphHeadTrace, scoreStageTrace, normalizedReadTrace, dynamicAttentionTrace, sampledContextTrace, aggregationNumber as num } from '../../data/message-aggregation-flow-models.js';
import './message-attention-flow.css';
export { MessagePassingAttentionProvider } from './MessagePassingAttentionState.jsx';

const parameterHue = '#e4b752', resultHue = '#c1a4f5';
const centre = (y, text, hue = '#eee') => <text x="144" y={y} textAnchor="middle" fill={hue}>{text}</text>;
const vectorText = row => `[${row.map(v => num(v, 5)).join(', ')}]`;
function Operation({ y, text, width = 220 }) {
  return <g><rect x={144-width/2} y={y} width={width} height="44" rx="4" fill="#101010" stroke="#aaa" />{centre(y+28,text)}</g>;
}
function ChannelRow({ y, values, prefix = 'channel', hue = channelHues }) {
  return <g>{values.map((value, i) => <text key={i} x="20" y={y+i*27} fill={hue[i] ?? resultHue}>{prefix} {i+1} = {num(value, 6)}</text>)}</g>;
}
function ExactRows({ caption, rows, headers = ['Named quantity', 'Current value'] }) {
  return <table className="mp-attention-table"><caption>{caption}</caption><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(([name,value,hue],i)=><tr key={i}><th style={{color:hue}}>{name}</th><td>{value}</td></tr>)}</tbody></table>;
}
function PaperRows({ features, projected, parameters }) {
  return <div className="mp-attention-grid">{features.map((row,id)=><Drawing key={id} width={288} height={400} label={`Paper ${id}: two feature channels, shared W projection and two projected channels`}>
    <Paper id={id} x={144} y={78} />
    <ChannelRow y={137} values={row} prefix="feature" />
    <Arrow x1={144} y1={180} x2={144} y2={207} />
    <Operation y={215} text="shared W projection" />
    {centre(287,`W row 1: ${vectorText(parameters.weight[0])}`,parameterHue)}
    {centre(314,`W row 2: ${vectorText(parameters.weight[1])}`,parameterHue)}
    <ChannelRow y={352} values={projected[id]} prefix="z channel" />
  </Drawing>)}</div>;
}
function EndpointScore({ sender, receiver, receiverTerm, senderTerm, raw, score, slope, senderName, receiverName }) {
  return <Drawing width={288} height={425} label={`${receiverName} reading ${senderName}: endpoint terms ${receiverTerm} plus ${senderTerm}, raw ${raw}, slope ${slope}, score ${score}`}>
    {centre(26,`${receiverName} reads ${senderName}`)}
    <text x="20" y="71" fill={paperHues[receiver]}>Receiver term = {num(receiverTerm,5)}</text>
    <text x="20" y="105" fill={paperHues[sender]}>Sender term = {num(senderTerm,5)}</text>
    <path d="M254,68H275V152" stroke={paperHues[receiver]} fill="none" /><Arrow x1={275} y1={152} x2={259} y2={152} hue={paperHues[receiver]} />
    <path d="M242,102H266V167" stroke={paperHues[sender]} fill="none" /><Arrow x1={266} y1={167} x2={259} y2={167} hue={paperHues[sender]} />
    <Operation y={138} text="add endpoint terms" width={230} />
    {centre(219,`raw sum = ${num(raw,5)}`)}
    <Arrow x1={144} y1={233} x2={144} y2={257} />
    <Operation y={265} text="LeakyReLU" />
    {centre(346,`negative slope = ${num(slope,5)}`,parameterHue)}
    {centre(397,`edge score = ${num(score,6)}`,resultHue)}
  </Drawing>;
}
function PaperScoreRoutes({ trace }) {
  return <div className="mp-attention-grid">{[0,1,2].map(source=><EndpointScore key={source} sender={source} receiver={1}
    receiverName="Paper 1" senderName={`Paper ${source}`} receiverTerm={trace.receiverTerms[1]} senderTerm={trace.senderTerms[source]}
    raw={trace.raw[1][source]} score={trace.scores[1][source]} slope={.2} />)}</div>;
}
export function MessagePassingPaperAttentionLab() {
  const state = usePaperAttention(), trace=paperAttentionTrace(state.features);
  return <FlowLab label="Full paper GAT projection and endpoint-score investigation">
    <figure data-mp-drawing="D17"><PaperRows {...trace} /><Drawing width={288} height={290} label="Selected receiver 1 permits sources 0,1,2, including its own self read; other receivers' self reads are not pictured here">
      {centre(25,"Receiver 1's permitted senders")}
      {[0,1,2].map(id=><Paper key={id} id={id} x={55+id*88} y={118} />)}
      <circle cx="143" cy="118" r="32" fill="none" stroke="#fff" strokeWidth="2" />
      <Arrow x1={82} y1={118} x2={110} y2={118} /><Arrow x1={205} y1={118} x2={175} y2={118} />
      <path d="M123,142C107,190 179,190 163,142" stroke={paperHues[1]} fill="none" /><Arrow x1={166} y1={151} x2={163} y2={142} hue={paperHues[1]} />
      {centre(204,'Self-read: source 1 → receiver 1',paperHues[1])}
      {centre(241,'White ring: traced receiver')}{centre(276,'No permission: 0 ↔ 2')}
    </Drawing><ExactRows caption="Declared score parameters" rows={[
      ['Receiver score vector',vectorText(trace.parameters.receiverVector),parameterHue],['Sender score vector',vectorText(trace.parameters.senderVector),parameterHue],
      ...trace.projected.map((row,i)=>[`Paper ${i}: z · score vector`,num(trace.receiverTerms[i],9),paperHues[i]])
    ]}/><PaperScoreRoutes trace={trace} /></figure>
    <FlowControls>
      <AttentionSelect label="Paper row to edit" value={state.paper} onChange={state.setPaper} choices={[[0,'Paper 0'],[1,'Paper 1'],[2,'Paper 2']]} />
      <AttentionSelect label="Feature channel" value={state.channel} onChange={state.setChannel} choices={[[0,'Channel 1'],[1,'Channel 2']]} />
      <AttentionQuantity key={`${state.paper}:${state.channel}`} label="Current paper feature" value={state.features[state.paper][state.channel]} onChange={state.editFeature} min={-8} max={8} revision={state.revision} />
      <button type="button" onClick={state.resetPaper}>Reset</button>
    </FlowControls>
    <FlowReadout data-paper-scores={trace.scores[1].join(',')}>Receiver 1 contributes {num(trace.receiverTerms[1],9)}; permitted sender terms are {trace.senderTerms.map(v=>num(v,9)).join(', ')}. Their current post-LeakyReLU scores are <strong>{trace.scores[1].map(v=>num(v,9)).join(', ')}</strong>. Channel 2 is returned as a value but the declared score vectors select channel 1.</FlowReadout>
    <p className="mp-attention-caption">Paper hues follow identity; cyan and pink label feature channels. Amber denotes fixed parameters, violet calculated scores; a white ring marks the fixed receiver being traced. The same W projects every paper row.</p>
  </FlowLab>;
}

function StageRoutes({ includeRead=false }) {
  const {stage}=useScoreStage(), trace=scoreStageTrace(stage);
  return <>{[0,1].map(receiver=><div key={receiver}>
    <div className="mp-attention-grid">{[0,1].map(sender=><EndpointScore key={sender} sender={sender} receiver={receiver} receiverName={`Receiver ${receiver+1}`} senderName={`sender ${sender+1}`} receiverTerm={stage.receivers[receiver]} senderTerm={stage.senders[sender]} raw={trace.raw[receiver][sender]} score={trace.scores[receiver][sender]} slope={stage.slope} />)}</div>
    {includeRead && <StageRead trace={trace} stage={stage} receiver={receiver} />}
  </div>)}</>;
}
function StageRead({ trace, stage, receiver }) {
  const shares=trace.weights[receiver];
  const permitted=stage.allowed[receiver].flatMap((yes,i)=>yes?[i]:[]);
  const max=permitted.length?Math.max(...permitted.map(i=>trace.scores[receiver][i])):null;
  const masses=stage.allowed[receiver].map((yes,i)=>yes?Math.exp(trace.scores[receiver][i]-max):0);
  const sum=masses.reduce((a,b)=>a+b,0);
  return <div className="mp-attention-grid">{[0,1].map(sender=><Drawing key={sender} width={288} height={480} label={`Receiver ${receiver+1} sender ${sender+1} permission, shifted mass, share and actual returned scalar product`}>
    {centre(27,`Receiver ${receiver+1} ← sender ${sender+1}`,paperHues[sender])}
    {centre(69,stage.allowed[receiver][sender]?'Pair is permitted':'Pair is forbidden')}
    {centre(106,`score = ${num(trace.scores[receiver][sender],6)}`)}
    {centre(143,max===null?'No allowed maximum':`allowed maximum = ${num(max,6)}`)}
    <Arrow x1={144} y1={158} x2={144} y2={179} />
    <Operation y={187} text={stage.allowed[receiver][sender]?'exp(score − maximum)':'mask → zero mass'} width={262} />
    {centre(271,`mass = ${num(masses[sender],8)}`,resultHue)}
    {centre(307,`allowed mass total = ${num(sum,8)}`)}
    {centre(345,`share = ${shares?num(shares[sender],8):'undefined'}`,resultHue)}
    {centre(383,`returned value = ${num(stage.values[sender],6)}`,paperHues[sender])}
    {centre(424,`share × value = ${trace.products[receiver]?num(trace.products[receiver][sender],8):'undefined'}`,resultHue)}
    {centre(465,`receiver output = ${num(trace.output[receiver],8)}`,resultHue)}
  </Drawing>)}</div>;
}
function StageSentence() {
  const {stage}=useScoreStage(), t=scoreStageTrace(stage);
  return <FlowReadout data-stage-output={JSON.stringify(t.output)}>Receiver 1 scores [{t.scores[0].map(v=>num(v,7)).join(', ')}]; receiver 2 scores [{t.scores[1].map(v=>num(v,7)).join(', ')}]. Current scalar reads are <strong>{num(t.output[0],9)} and {num(t.output[1],9)}</strong>.{t.weights.some(row=>row===null)&&' With no permitted sender that receiver has no normalized distribution, so its output is undefined.'}</FlowReadout>;
}
const stageChoices = [[0,'Sender 1'],[1,'Sender 2']], receiverChoices=[[0,'Receiver 1'],[1,'Receiver 2']];
export function MessagePassingSenderTermLab() {
  const s=useScoreStage();
  return <FlowLab label="Intermediate sender-term investigation"><figure data-mp-drawing="D17b"><StageRoutes /></figure><FlowControls>
    <AttentionSelect label="Score-stage sender" value={s.sender} onChange={s.setSender} choices={stageChoices} />
    <AttentionQuantity key={s.sender} label="Sender endpoint term" value={s.stage.senders[s.sender]} onChange={v=>s.editStage('senders',s.sender,v)} min={-8} max={8} revision={s.revision} />
    <button type="button" onClick={s.resetStage}>Reset</button>
  </FlowControls><StageSentence /><p className="mp-attention-caption">This fixture edits intermediate scalar terms; it is separate from the projected paper rows above. Sender identity hues remain attached to their two routes.</p></FlowLab>;
}
export function MessagePassingReceiverTermLab() {
  const s=useScoreStage();
  return <FlowLab label="Intermediate receiver-term and negative-slope investigation"><figure data-mp-drawing="D17c"><StageRoutes /></figure><FlowControls>
    <AttentionSelect label="Score-stage receiver" value={s.receiver} onChange={s.setReceiver} choices={receiverChoices} />
    <AttentionQuantity key={s.receiver} label="Receiver endpoint term" value={s.stage.receivers[s.receiver]} onChange={v=>s.editStage('receivers',s.receiver,v)} min={-8} max={8} revision={s.revision} />
    <AttentionQuantity label="Negative LeakyReLU slope" value={s.stage.slope} onChange={s.setSlope} min={0} max={1} revision={s.revision} />
    <button type="button" onClick={s.resetStage}>Reset</button>
  </FlowControls><StageSentence /><p className="mp-attention-caption">With positive slope and the same candidates, a receiver-term edit can change score gaps and shares but cannot reverse sender order. Zero slope can tie negative sums.</p></FlowLab>;
}

function MixtureRoute({ score, value, maximum, shifted, mass, denominator, coefficient, product, name, hue }) {
  return <Drawing width={288} height={590} label={`${name}: score ${score}, shifted ${shifted}, mass ${mass}, share ${coefficient}, returned value ${value}, product ${product}`}>
    {centre(28,name,hue)}{centre(72,`score = ${num(score,8)}`)}
    {centre(110,`maximum = ${num(maximum,8)}`)}<Arrow x1={144} y1={125} x2={144} y2={149} />
    <Operation y={156} text="subtract maximum" />{centre(238,`shifted = ${num(shifted,8)}`)}
    <Arrow x1={144} y1={251} x2={144} y2={275} /><Operation y={282} text="exponential → mass" />
    {centre(363,`mass = ${num(mass,9)}`,resultHue)}{centre(401,`mass total = ${num(denominator,9)}`)}
    {centre(442,`share = ${num(coefficient,9)}`,resultHue)}{centre(482,`returned value = ${num(value,8)}`,hue)}
    <Arrow x1={144} y1={495} x2={144} y2={518} /><Operation y={524} text={`product = ${num(product,8)}`} width={250} />
  </Drawing>;
}
export function MessagePassingNormalizedReadLab() {
  const [score,setScore]=useState(Math.log(3)),[value,setValue]=useState(5),[revision,setRevision]=useState(0);
  const t=normalizedReadTrace(score,value);
  return <FlowLab label="Two supplied scores become a normalized scalar read"><figure data-mp-drawing="D18"><div className="mp-attention-grid">{[0,1].map(i=><MixtureRoute key={i} name={`Supplied sender ${i+1}`} hue={paperHues[i]} score={t.scores[i]} value={t.values[i]} maximum={t.maximum} shifted={t.shifted[i]} mass={t.masses[i]} denominator={t.denominator} coefficient={t.coefficients[i]} product={t.products[i]} />)}</div>
    <ExactRows caption="Add the two actual products" rows={t.products.map((p,i)=>[`Sender ${i+1} product`,num(p,12),paperHues[i]]).concat([['Receiving sum',num(t.output,12),resultHue]])}/></figure>
    <FlowControls><AttentionQuantity label="Second supplied score" value={score} onChange={setScore} min={-4} max={4} revision={revision}/><AttentionQuantity label="Second returned value" value={value} onChange={setValue} min={-5} max={6} revision={revision}/><button type="button" onClick={()=>{setScore(Math.log(3));setValue(5);setRevision(r=>r+1);}}>Reset</button></FlowControls>
    <FlowReadout data-normalized-read={t.output}>Shifted masses {num(t.masses[0],9)} and {num(t.masses[1],9)} divide by {num(t.denominator,9)}, giving shares {num(t.coefficients[0],9)} and {num(t.coefficients[1],9)}. Their value products sum to <strong>{num(t.output,9)}</strong>. This supplied-score fixture is separate from the three-paper layer.</FlowReadout>
  </FlowLab>;
}
function PaperValueRoute({ trace, source }) {
  const share=trace.coefficients[1][source];
  return <Drawing width={288} height={710} label={`Receiver 1 paper ${source}: score, shifted mass, share and both projected-value contributions`}>
    {centre(28,`Receiver 1 ← paper ${source}`,paperHues[source])}
    {centre(75,`score = ${num(trace.scores[1][source],7)}`)}
    {centre(116,`maximum = ${num(trace.maxima[1],7)}`)}
    {centre(158,`shifted = ${num(trace.shifted[1][source],7)}`)}
    <Arrow x1={144} y1={172} x2={144} y2={202}/><Operation y={210} text="exponential" />
    {centre(293,`mass = ${num(trace.masses[1][source],9)}`,resultHue)}
    {centre(334,`total = ${num(trace.denominators[1],9)}`)}
    {centre(376,`share = ${num(share,9)}`,resultHue)}
    <ChannelRow y={424} values={trace.projected[source]} prefix="z value" />
    <Arrow x1={144} y1={467} x2={144} y2={494} /><Operation y={502} text="share × each value" />
    <ChannelRow y={590} values={trace.products[1][source]} prefix="contribution" />
    {centre(665,`Paper ${source} supplies both channels`,paperHues[source])}
  </Drawing>;
}
export function MessagePassingPaperRead() {
  const {features}=usePaperAttention(), t=paperAttentionTrace(features);
  return <figure data-mp-drawing="D18-paper-read"><div className="mp-attention-grid">{[0,1,2].map(source=><PaperValueRoute key={source} trace={t} source={source}/>)}</div>
    <Drawing width={288} height={300} label="Receiver 1 sums each of three donor products separately in each channel">
      {centre(28,'Receiving sum for paper 1')}
      {[0,1].map(c=><g key={c}>{centre(78+c*96,`channel ${c+1}: add three products`,channelHues[c])}{centre(115+c*96,`${t.products[1].map(row=>num(row[c],6)).join(' + ')}`,channelHues[c])}{centre(151+c*96,`= ${num(t.output[1][c],9)}`,resultHue)}</g>)}
    </Drawing><FlowReadout data-paper-read={JSON.stringify(t.output[1])}>The same paper inputs used above now produce receiver 1's row <strong>{vectorText(t.output[1])}</strong>. Each coefficient stays attached to its own projected sender row; the two channel sums remain distinct.</FlowReadout>
  </figure>;
}
export function MessagePassingReturnedValueLab() {
  const s=useScoreStage();
  return <FlowLab label="Intermediate returned-value investigation"><figure data-mp-drawing="D18a"><StageRoutes includeRead /></figure><FlowControls>
    <AttentionSelect label="Returned-value sender" value={s.sender} onChange={s.setSender} choices={stageChoices}/>
    <AttentionQuantity key={s.sender} label="Returned scalar value" value={s.stage.values[s.sender]} onChange={v=>s.editStage('values',s.sender,v)} min={-8} max={8} revision={s.revision}/>
    <button type="button" onClick={s.resetStage}>Reset</button>
  </FlowControls><StageSentence /><p className="mp-attention-caption">Changing a supplied returned value changes products, not the independently supplied endpoint scores of this intermediate-stage fixture.</p></FlowLab>;
}
export function MessagePassingPermissionLab() {
  const s=useScoreStage();
  return <FlowLab label="Intermediate allowed-pair investigation"><figure data-mp-drawing="D18b"><StageRoutes includeRead /></figure><FlowControls>
    <AttentionSelect label="Permission receiver" value={s.receiver} onChange={s.setReceiver} choices={receiverChoices}/>
    <AttentionSelect label="Permission sender" value={s.sender} onChange={s.setSender} choices={stageChoices}/>
    <label className="mp-attention-check"><input type="checkbox" aria-label="Permit this receiver-sender pair" checked={s.stage.allowed[s.receiver][s.sender]} onChange={e=>s.editPermission(e.target.checked)}/>Permit this receiver–sender pair</label>
    <button type="button" onClick={s.resetStage}>Reset</button>
  </FlowControls><StageSentence /><p className="mp-attention-caption">A forbidden pair has zero mass and zero product when a valid distribution exists. With no permitted pairs, the distribution and output are undefined; this is not the full layer's separately declared zero-aggregate convention.</p></FlowLab>;
}

function HeadBranch({ trace, index }) {
  return <div><Drawing width={288} height={660} label={`Head ${index+1}: same three paper rows, its own W and endpoint vectors, projected values, scores, local shares and two-channel receiving read`}>
    {centre(27,`Head ${index+1}: own parameters`,paperHues[index+3])}
    {centre(75,`W row 1 ${vectorText(trace.parameters.weight[0])}`,parameterHue)}{centre(113,`W row 2 ${vectorText(trace.parameters.weight[1])}`,parameterHue)}
    {centre(162,`receiver a ${vectorText(trace.parameters.receiverVector)}`,parameterHue)}{centre(201,`sender a ${vectorText(trace.parameters.senderVector)}`,parameterHue)}
    {centre(251,'Same three input paper rows')}
    <Arrow x1={144} y1={265} x2={144} y2={289}/><Operation y={297} text="this head's W projection" width={258}/>
    <Arrow x1={144} y1={347} x2={144} y2={371}/><Operation y={379} text="endpoint dots → scores" width={258}/>
    {centre(459,`scores: ${trace.scores[1].map(v=>num(v,3)).join(', ')}`)}
    <Arrow x1={144} y1={473} x2={144} y2={497}/><Operation y={505} text="local shares × own z rows" width={270}/>
    {centre(586,'Receiver 1: sum three products')}
    <ChannelRow y={622} values={trace.output[1]} prefix="channel"/>
  </Drawing><ExactRows caption={`Head ${index+1}: every paper output, two channels`} headers={['Paper identity','Output [channel 1,channel 2]']} rows={trace.output.map((row,i)=>[`Paper ${i}`,vectorText(row),paperHues[i]])}/>
    <ExactRows caption={`Head ${index+1}: traced receiver 1 ingredients`} rows={trace.projected.flatMap((row,i)=>[
      [`Sender paper ${i}: projected row`,vectorText(row),paperHues[i]], [`Sender paper ${i}: score / share`,`${num(trace.scores[1][i],8)} / ${num(trace.coefficients[1][i],9)}`,paperHues[i]]])}/>
  </div>;
}
export function MessagePassingHeadsLab() {
  const {features}=usePaperAttention(),[count,setCount]=useState(2),[revision,setRevision]=useState(0),t=graphHeadTrace(features,count);
  return <FlowLab label="Independent graph attention heads and two simultaneous merge routes"><figure data-mp-drawing="D19"><div className="mp-attention-grid">{t.heads.map((head,i)=><HeadBranch key={i} trace={head} index={i}/>)}</div>
    <div className="mp-attention-grid"><Drawing width={288} height={330} label={`Concatenation appends ${count} head rows, node count 3, width ${2*count}`}>
      {centre(25,'Concatenation: append head blocks')}{t.heads.map((head,i)=><text key={i} x="20" y={69+i*42} fill={paperHues[i+3]}>head {i+1} row: {vectorText(head.output[1])}</text>)}
      {centre(222,`output shape = 3 × ${2*count}`,resultHue)}{centre(262,'Each head contributes two channels')}{centre(305,'Paper identity does not change')}
    </Drawing><Drawing width={288} height={330} label={`Average corresponding head channels, node count 3, width 2`}>
      {centre(25,'Average: align matching channels')}{centre(80,`${count} corresponding head values`)}<Arrow x1={144} y1={98} x2={144} y2={127}/><Operation y={135} text={`sum each channel ÷ ${count}`} width={258}/>
      {centre(201,'Receiver 1 averaged row')}
      <ChannelRow y={224} values={t.averaged[1]} prefix="channel" />{centre(305,'output shape = 3 × 2',resultHue)}
    </Drawing></div><ExactRows caption={`Exact concatenated output: 3 paper rows ×${2*count} channels`} rows={t.concatenated.map((row,i)=>[`Paper ${i}`,vectorText(row),paperHues[i]])}/><ExactRows caption="Exact averaged output: 3 paper rows ×2 channels" rows={t.averaged.map((row,i)=>[`Paper ${i}`,vectorText(row),paperHues[i]])}/></figure>
    <FlowControls><AttentionQuantity label="Independent head count" value={count} onChange={setCount} min={1} max={3} integer revision={revision}/><button type="button" onClick={()=>{setCount(2);setRevision(r=>r+1);}}>Reset</button></FlowControls>
    <FlowReadout data-head-width={2*count}>{count} independent heads each return two channels for each of three papers. Concatenation yields <strong>3 × {2*count}</strong>; averaging yields <strong>3 × 2</strong>. Both routes use the current paper inputs from D17, with the declared distinct parameter values and no output bias in this constructed trace.</FlowReadout>
  </FlowLab>;
}

function DynamicPair({ trace, sender }) {
  return <Drawing width={288} height={765} label={`GATv2 receiver ${trace.receiver} sender ${trace.senders[sender]}: full projected pair to nonlinear score and value products`}>
    {centre(28,`receiver ${num(trace.receiver,6)} ← sender ${trace.senders[sender]}`,paperHues[sender])}
    {centre(73,'Receiver projection [r, −r]')}
    <ChannelRow y={116} values={trace.receiverProjection} prefix="receiver" />
    <path d="M144,158H275V286" fill="none" stroke="#bbb" strokeWidth="2" /><Arrow x1={275} y1={286} x2={275} y2={309}/>
    {centre(187,'Sender projection [−k, k]')}
    <ChannelRow y={230} values={trace.senderProjections[sender]} prefix="sender" />
    <Arrow x1={144} y1={275} x2={144} y2={301}/><Operation y={309} text="add projected coordinates" width={268}/>
    <ChannelRow y={392} values={trace.pairSums[sender]} prefix="pair sum" />
    <Arrow x1={144} y1={436} x2={144} y2={461}/><Operation y={469} text="coordinate LeakyReLU .2" width={268}/>
    <ChannelRow y={554} values={trace.activated[sender]} prefix="activated" />
    {centre(627,`score products ${vectorText(trace.scoreProducts[sender])}`,parameterHue)}
    {centre(666,`score = ${num(trace.scores[sender],9)}`,resultHue)}
    {centre(707,`share = ${num(trace.coefficients[sender],9)}`,resultHue)}
    {centre(747,`value products ${vectorText(trace.products[sender])}`,resultHue)}
  </Drawing>;
}
function DynamicReceiver({ trace, label }) {
  return <div><p>{label}: the same two permitted candidates; no loops.</p><div className="mp-attention-grid">{[0,1].map(sender=><DynamicPair key={sender} trace={trace} sender={sender}/>)}</div><ExactRows caption="Sum the two projected-value contributions" rows={[['Sender −1 contribution',vectorText(trace.products[0]),paperHues[0]],['Sender +1 contribution',vectorText(trace.products[1]),paperHues[1]],['Two-channel receiving sum',vectorText(trace.output),resultHue]]}/></div>;
}
export function MessagePassingDynamicAttentionLab() {
  const [receiver,setReceiver]=useState(-1),[revision,setRevision]=useState(0),t=dynamicAttentionTrace(receiver),other=dynamicAttentionTrace(1);
  // Static comparison: original GAT endpoint sum with identical two candidates.
  const staticScores=[-1,1].map(k=>receiver+k>=0?receiver+k:.2*(receiver+k));
  return <FlowLab label="GATv2 full coupled receiver-ranking investigation"><figure data-mp-drawing="D20"><DynamicReceiver trace={t} label="Edited receiver"/><DynamicReceiver trace={other} label="Fixed +1 receiver comparison"/>
    <ExactRows caption="Original GAT static-ranking comparison: same candidates and support" rows={[
      ['Edited receiver: sender−1 / +1 scores',staticScores.map(v=>num(v,9)).join(' / ')],['Fixed +1 receiver: sender−1 / +1 scores','0 / 2'],['Ranking with positive slope','Sender +1 ranks above sender −1 for both receivers']
    ]}/></figure><FlowControls><AttentionQuantity label="GATv2 receiver value" value={receiver} onChange={setReceiver} min={-1} max={1} revision={revision}/><button type="button" onClick={()=>{setReceiver(-1);setRevision(r=>r+1);}}>Reset</button></FlowControls>
    <FlowReadout data-dynamic-read={JSON.stringify(t.output)}>The edited receiver's actual pair scores are {t.scores.map(v=>num(v,9)).join(' and ')}, giving shares {t.coefficients.map(v=>num(v,9)).join(' and ')} and row <strong>{vectorText(t.output)}</strong>.{receiver===0?' Zero ties the candidates and both returned channels cancel.':` Sender ${t.scores[0]>t.scores[1]?'−1':'+1'} currently ranks first.`}</FlowReadout>
    <p className="mp-attention-caption">Cyan/pink retain coordinate identity; sender hues label the two candidates. Amber score products use the fixed vector [−1.25,−1.25]. Every changed score follows projection, pair sum and coordinate nonlinearity before scalar reduction.</p>
  </FlowLab>;
}
function ContextRoute({ positive, trace }) {
  const value=positive?trace.positive:trace.negative,score=positive?trace.positiveScore:trace.negativeScore,argument=positive?-score:score,loss=positive?trace.positiveLoss:trace.negativeLoss,likelihood=positive?trace.positiveLikelihood:trace.negativeLikelihood,derivative=positive?trace.positiveDerivative:trace.negativeDerivative;
  return <Drawing width={288} height={525} label={`${positive?'Positive nearby':'Sampled negative'} context: anchor 1 times ${value}, score ${score}, stable loss ${loss}, anchor derivative ${derivative}`}>
    {centre(26,positive?'Nearby positive context':'Sampled negative context',paperHues[positive?0:1])}
    {centre(71,`anchor z = ${trace.anchor}`)}{centre(111,`context = ${num(value,8)}`)}
    <Arrow x1={144} y1={126} x2={144} y2={148}/><Operation y={156} text="dot: anchor × context" width={264}/>
    {centre(239,`dot score = ${num(score,8)}`)}{centre(279,`likelihood = ${num(likelihood,9)}`)}
    {centre(320,`loss argument = ${num(argument,8)}`)}
    <Arrow x1={144} y1={333} x2={144} y2={356}/><Operation y={364} text="stable softplus" />
    {centre(446,`loss = ${num(loss,9)}`,resultHue)}
    {centre(492,`anchor derivative = ${num(derivative,9)}`,resultHue)}
  </Drawing>;
}
export function MessagePassingContextObjectiveLab() {
  const [negative,setNegative]=useState(-1),[revision,setRevision]=useState(0),t=sampledContextTrace(negative);
  return <FlowLab label="Sampled context likelihood and loss investigation"><figure data-mp-drawing="D21"><div className="mp-attention-grid"><ContextRoute positive trace={t}/><ContextRoute trace={t}/></div><ExactRows caption="Add the two sampled loss/derivative contributions" rows={[
    ['Positive loss + negative loss',`${num(t.positiveLoss,12)} + ${num(t.negativeLoss,12)}`],['Total sampled loss',num(t.loss,12),resultHue],['Positive derivative + negative derivative',`${num(t.positiveDerivative,12)} + ${num(t.negativeDerivative,12)}`],['Anchor derivative',num(t.derivative,12),resultHue]
  ]}/></figure><FlowControls><AttentionQuantity label="Sampled negative context" value={negative} onChange={setNegative} min={-2} max={2} revision={revision}/><button type="button" onClick={()=>{setNegative(-1);setRevision(r=>r+1);}}>Reset</button></FlowControls>
    <FlowReadout data-context-loss={t.loss}>With anchor 1 and nearby positive 2 fixed, negative {num(negative,9)} contributes loss {num(t.negativeLoss,9)}. Total loss is <strong>{num(t.loss,9)}</strong>; the anchor derivative is {num(t.derivative,9)}. Sampling defines this comparison; a sampled noncontext is not guaranteed to be a semantic negative and these factors do not supply a class label.</FlowReadout>
  </FlowLab>;
}
