import { useId } from 'react';
import { flowNumber } from './LessonFlow.jsx';
import './seq2seq-flow.css';

const color = { input: '#82c5dc', parameter: '#e7b74b', computed: '#b497df', operation: '#dddfe2', forward: '#899095', gradient: '#e8a16e' };
const n = (value, digits = 4) => flowNumber(value, digits);

export function SeqDrawing({ name, width = 340, height, title, description, children }) {
  const id = useId();
  return <svg className="seq-flow-drawing" data-figure={name} viewBox={`0 0 ${width} ${height}`} style={{ aspectRatio: `${width} / ${height}` }} role="img" aria-labelledby={`${id}-title ${id}-description`}>
    <title id={`${id}-title`}>{title}</title><desc id={`${id}-description`}>{description}</desc>{children}
  </svg>;
}
function Label({ x, y, children, role = 'operation', anchor = 'middle', small = false }) {
  return <text x={x} y={y} textAnchor={anchor} fill={color[role]} className={small ? 'seq-flow-small' : undefined}>{children}</text>;
}
function Wire({ points, backward = false, label, lx, ly }) {
  const pairs = points.trim().split(/\s+/).map(pair => pair.split(',').map(Number));
  const [a, b] = pairs.slice(-2); const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const head = [b, [b[0] - 7 * Math.cos(angle - .45), b[1] - 7 * Math.sin(angle - .45)], [b[0] - 7 * Math.cos(angle + .45), b[1] - 7 * Math.sin(angle + .45)]];
  return <g><polyline points={points} fill="none" stroke={backward ? color.gradient : color.forward} strokeWidth="1.5" strokeDasharray={backward ? '5 4' : undefined}/><polygon points={head.map(pair => pair.join(',')).join(' ')} fill={backward ? color.gradient : color.forward}/>{label && <Label x={lx} y={ly} role={backward ? 'gradient' : 'operation'} small>{label}</Label>}</g>;
}
function Op({ x, y, width = 56, height = 28, label }) {
  return <g><rect x={x} y={y} width={width} height={height} rx="5" fill="none" stroke={color.operation}/><Label x={x + width / 2} y={y + height / 2 + 5} small>{label}</Label></g>;
}
function Value({ x, y, value, role = 'computed', radius = 17 }) {
  return <g><circle cx={x} cy={y} r={radius} fill="#090a0c" stroke={color[role]}/><Label x={x} y={y + 5} role={role} small>{value}</Label></g>;
}
function Vector({ x, y, length, width = 192, role = 'computed', label, values }) {
  const displayed = values?.length ?? Math.min(length, 8); const cell = width / displayed;
  return <g><Label x={x + width / 2} y={y - 10} role={role} small>{label}</Label>{Array.from({ length: displayed }, (_, i) => <g key={i}><rect x={x + cell * i} y={y} width={cell} height={values ? 30 : 17} fill="none" stroke={color[role]}/>{values && <Label x={x + cell * (i + .5)} y={y + 20} role={role} small>{typeof values[i] === 'number' ? n(values[i], 2) : values[i]}</Label>}</g>)}{!values && displayed < length && <Label x={x + width / 2} y={y + 36} small>{displayed}/{length} shown</Label>}</g>;
}

export function SeqAnatomyFigure() {
  const source = ['past', 'w', 'a', 'l', 'k', 'EOS'];
  return <figure className="seq-flow-figure" data-figure="seq2seq-anatomy"><div className="seq-flow-columns">
    <SeqDrawing name="seq2seq-encoder-anatomy" height={298} title="Read six source tokens, then transfer the final state" description="The grammatical request, four letters and source EOS enter six repeated encoder updates. State flows between updates; only the final state transfers to the decoder.">
      <Label x={170} y={21}>Encoder: read the requested spelling</Label>
      <Label x={170} y={48} role="input" small>source tokens · six positions</Label>
      {source.map((token, i) => {const x = 25 + 56 * i; return <g key={i}>
        <Label x={x} y={77} role="input" small>{token}</Label><Wire points={`${x},84 ${x},107`}/>
        <Op x={x - 19} y={107} width={38} label="GRU"/>
        <Wire points={`${x},135 ${x},160`}/><Value x={x} y={177} value={`h${i + 1}`} radius={16}/>
        {i < 5 && <Wire points={`${x + 17},177 ${x + 29},177 ${x + 29},121 ${x + 37},121`}/>}</g>;})}
      <Label x={170} y={217} small>Each update receives token + carried state</Label>
      <Wire points="305,194 305,251 259,251"/>
      <Vector x={67} y={242} length={64} label="v = final encoder state"/>
    </SeqDrawing>
    <SeqDrawing name="seq2seq-decoder-anatomy" height={710} title="Generate seven outputs on a separate decoder timeline" description="First and second updates and the final seventh update are drawn. Tokens flow down the left lane; recurrent states flow down the right lane. Middle updates3through6 repeat the same operation. The seventh prediction is output EOS; there is no one-to-one source alignment.">
      <Label x={170} y={21}>Decoder: write one next token</Label>
      <Vector x={68} y={53} length={64} label="v arrives from encoder"/>
      <Wire points="260,62 290,62 290,113 269,113"/><Value x={248} y={113} value="s₀=v" radius={25}/>
      {[{input:'BOS',output:'w',step:1,y:157},{input:'w',output:'a',step:2,y:321},{input:'d',output:'EOS',step:7,y:531}].map((row,i)=><g key={i}>
        <Value x={49} y={row.y} value={row.input} role="input" radius={23}/><Wire points={`72,${row.y} 137,${row.y}`}/>
        <Op x={137} y={row.y-14} width={60} label="GRU"/>
        <Wire points={`248,${row.y-19} 248,${row.y} 197,${row.y}`}/>
        <Wire points={`167,${row.y+14} 167,${row.y+48} 223,${row.y+48}`}/><Value x={248} y={row.y+48} value={`s${row.step}`} radius={25}/>
        <Wire points={`223,${row.y+48} 112,${row.y+48}`}/><Op x={56} y={row.y+34} label="choose"/>
        <Wire points={`56,${row.y+48} 25,${row.y+48} 25,${row.y+87} 49,${row.y+87}`}/><Value x={49} y={row.y+110} value={row.output} radius={20}/>
        <Label x={299} y={row.y+53} small>{row.step}</Label>
        {i===0&&<><Wire points="49,288 49,298"/><Wire points="248,230 248,302"/></>}
        {i===1&&<><Wire points="49,454 49,466"/><Wire points="248,394 248,466"/><Label x={170} y={486} small>Steps 3–6 repeat; omitted here</Label><Wire points="49,497 49,508"/><Wire points="248,497 248,512"/></>}
      </g>)}
      <Label x={170} y={695} small>Six letters + output EOS · seven predictions</Label>
    </SeqDrawing>
  </div><figcaption>The encoder finishes before decoding starts. Horizontal state wires carry learned summaries; the lower feedback wires carry chosen letters. Source EOS and output EOS belong to different timelines. The two rows reuse their own learned weights, with no forced character-to-character alignment.</figcaption></figure>;
}

export function SeqLookupFigure() {
  return <figure className="seq-flow-figure"><SeqDrawing name="seq2seq-lookup" height={314} title="A token ID selects one learned embedding row" description="Letter l has ID17. It selects row17 in a32-by24 learned table. Six rows and six coordinates are drawn as a cutaway; the output has24 coordinates, not the numeric value17.">
    <Label x={170} y={20}>An integer is an address, not a magnitude</Label>
    <Label x={29} y={64} role="input">l</Label><Wire points="41,60 88,60"/><Value x={108} y={60} value="17" role="input"/>
    <Wire points="108,78 108,167 140,167"/>
    <Label x={236} y={56} role="parameter" small>E: learned table, 32 × 24</Label>
    {[0, 1, 2, 16, 17, 18].map((row, i) => <g key={row}>
      <Label x={130} y={83 + i * 22} anchor="end" role="parameter" small>{row}</Label>
      {Array.from({ length: 6 }, (_, j) => <rect key={j} x={140 + j * 29} y={68 + i * 22} width={29} height={22} fill={row === 17 ? '#302716' : 'none'} stroke={row === 17 ? '#fff' : color.parameter}/>)}
    </g>)}
    <Label x={229} y={222} small>Other rows/columns omitted</Label>
    <Wire points="229,198 229,239 170,239 170,265"/>
    <Vector x={74} y={265} length={24} label="E[17]: computed input vector"/>
  </SeqDrawing><figcaption>Different token IDs select different learned rows. Repeated letters can share the same row across the encoder and decoder; their surrounding recurrent states can still differ.</figcaption></figure>;
}

export function SeqStepFigure({ state = 'sₜ₋₁', input = 'previous token', name = 'seq2seq-decoder-step' }) {
  return <figure className="seq-flow-figure"><SeqDrawing name={name} height={422} title="One decoder step maps a previous token and state to next-token probabilities" description="A24-coordinate lookup and64-coordinate old state feed a GRU. Its new64-coordinate state feeds a32-score linear head. Five forbidden classes are removed before a27-class softmax.">
    <Label x={82} y={22} role="input">{input}</Label><Wire points="82,31 82,49"/><Op x={47} y={49} width={70} label="lookup E"/>
    <Vector x={26} y={109} width={112} length={24} label="input: 24"/>
    <Vector x={188} y={109} width={130} length={64} label={`${state}: 64`}/>
    <Wire points="82,147 82,177 142,177"/><Wire points="252,147 252,177 198,177"/>
    <Op x={142} y={163} label="GRU"/><Label x={170} y={212} role="parameter" small>decoder weights and both biases</Label>
    <Wire points="170,191 170,236"/><Vector x={74} y={236} length={64} label="sₜ: new state, 64"/>
    <Wire points="170,274 170,291"/><Op x={120} y={291} width={100} label="linear readout"/>
    <Label x={277} y={312} role="parameter" small>W, b</Label>
    <Wire points="170,319 170,341"/><Op x={101} y={341} width={138} label="mask → softmax"/>
    <Label x={170} y={396} role="computed" small>27 allowed probabilities: a…z and EOS</Label>
    <Label x={170} y={419} small>PAD, BOS and requests: probability zero</Label>
  </SeqDrawing></figure>;
}

export function SeqScalarFigure({ result, inputs = [.2, .8], weight = .7, credit = false }) {
  const states = result.encoderStates ?? result.encoder;
  const encoder = states ?? [Math.tanh(weight * inputs[0] + .1), result.context];
  const decoder = result.decoderStates ?? result.decoder;
  const s1 = typeof decoder?.[0] === 'number' ? decoder[0] : Math.tanh(.6 * .1 + .5 * result.context + .05);
  const s2 = typeof decoder?.[1] === 'number' ? decoder[1] : Math.tanh(.6 * .4 + .5 * s1 + .05);
  return <div className="seq-flow-columns">
    <SeqDrawing name={credit ? 'seq2seq-scalar-encoder-credit' : 'seq2seq-scalar-encoder'} height={342} title="Two scalar encoder updates produce context" description="Each input is multiplied by the shared weight, combined with0.4times old state and bias0.1, then tanh. The final scalar context initializes the decoder.">
      <Label x={170} y={22}>Constructed encoder · h₀ = 0</Label>
      {[0, 1].map(i => {const y = 68 + i * 132; return <g key={i}>
        <Value x={35} y={y} value={n(inputs[i], 2)} role="input"/>
        <Wire points={`52,${y} 92,${y}`}/><Label x={72} y={y - 13} role="parameter" small>× {n(weight, 2)}</Label>
        <Op x={92} y={y - 14} width={62} label="Σ + .1"/>
        <Wire points={`154,${y} 187,${y}`}/><Op x={187} y={y - 14} width={47} label="tanh"/>
        <Wire points={`234,${y} 270,${y}`}/><Value x={294} y={y} value={n(encoder[i])} radius={24}/>
        <Label x={294} y={y + 44} role="computed" small>{i ? 'h₂ = v' : 'h₁'}</Label>
        {i === 0 && <Wire points="294,92 294,130 123,130 123,186" label="old state × .4" lx={190} ly={154}/>}</g>;})}
      <Label x={170} y={284} role="parameter" small>Same encoder input weight w at both positions</Label>
      {credit && <><Wire points="288,229 288,314 58,314 58,219" backward/><Label x={170} y={337} role="gradient" small>decoder credit reaches both uses of w</Label></>}
    </SeqDrawing>
    <SeqDrawing name={credit ? 'seq2seq-scalar-decoder-credit' : 'seq2seq-scalar-decoder'} height={credit ? 422 : 350} title="Context and previous output embeddings produce two conditional distributions" description="BOS embedding0.1 and context enter first decoder update. Then A embedding0.4 and first state enter second. Each state gives scores[s,-s]for A and EOS; credit returns through both decoder positions.">
      <Label x={170} y={22}>Constructed decoder · s₀ = v</Label>
      {[{input: 'BOS', e: .1, state: s1, old: result.context}, {input: 'A', e: .4, state: s2, old: s1}].map((row, i) => {const y = 62 + 157 * i; const p = 1 / (1 + Math.exp(-2 * row.state)); return <g key={i}>
        <Label x={170} y={y} role="input" small>{row.input}: e = {row.e}; old state = {n(row.old)}</Label>
        <Op x={30} y={y + 15} width={180} label=".6e + .5 old + .05 → tanh"/>
        <Wire points={`210,${y + 29} 241,${y + 29}`}/><Value x={279} y={y + 29} value={n(row.state)} radius={27}/>
        <Label x={170} y={y + 76} role="computed" small>scores: [{n(row.state)}, {n(-row.state)}]</Label>
        <rect x={48} y={y + 90} width={244 * p} height={15} fill={color.computed}/><rect x={48 + 244 * p} y={y + 90} width={244 * (1 - p)} height={15} fill="none" stroke={color.computed}/>
        <Label x={170} y={y + 127} role="computed" small>P(A) {n(p)} · P(EOS) {n(1 - p)}</Label>
      </g>;})}
      {credit && <><Wire points="286,326 315,326 315,383 41,383 41,105" backward/><Label x={170} y={411} role="gradient" small>both losses → decoder → initial context v</Label></>}
    </SeqDrawing>
  </div>;
}

export function SeqProbabilityTreeFigure({ tree, a = .6, afterA = .51, afterB = .9, step = 3 }) {
  const leaves = [{text: 'A, EOS', p: a * afterA, y: 69}, {text: 'A, C, EOS', p: a * (1 - afterA), y: 147}, {text: 'B, EOS', p: (1 - a) * afterB, y: 255}, {text: 'B, C, EOS', p: (1 - a) * (1 - afterB), y: 333}];
  return <SeqDrawing name="seq2seq-probability-tree" height={430} title="Conditional branches form four complete answer probabilities" description="A literal tree distinguishes conditional edge probabilities from whole-route probabilities. Each node's symbolic state belongs to its own consumed prefix; no fabricated fitted coordinates are shown.">
    <Label x={170} y={20}>Constructed answers · time flows downward</Label>
    <Value x={170} y={55} value="BOS" radius={22}/>
    <Wire points="152,68 80,99"/><Wire points="188,68 260,99"/>
    <Label x={90} y={68} role="computed" small>{n(a, 2)}</Label><Label x={250} y={68} role="computed" small>{n(1 - a, 2)}</Label>
    <circle cx={66} cy={115} r={28} fill="none" stroke={color.computed}/><Label x={66} y={110}>A</Label><Label x={66} y={131} small>s[A]</Label>
    <circle cx={274} cy={115} r={28} fill="none" stroke={color.computed}/><Label x={274} y={110}>B</Label><Label x={274} y={131} small>s[B]</Label>
    <Wire points="56,142 35,189"/><Wire points="78,141 128,189"/>
    <Wire points="261,141 212,189"/><Wire points="285,142 306,189"/>
    {[{x: 32, label: 'EOS', p: afterA}, {x: 131, label: 'C', p: 1 - afterA}, {x: 209, label: 'EOS', p: afterB}, {x: 308, label: 'C', p: 1 - afterB}].map((row, i) => <g key={i}><Label x={[18,150,193,325][i]} y={172} role="computed" small>{n(row.p, 2)}</Label><Value x={row.x} y={212} value={row.label} radius={22}/>{row.label === 'C' && <><Wire points={`${row.x},234 ${row.x},263`}/><Label x={row.x + (i === 1 ? 28 : -28)} y={253} role="computed" small>1</Label><Value x={row.x} y={285} value="EOS" radius={22}/></>}</g>)}
    <Label x={170} y={333} small>Complete route probability = edge product</Label>
    {leaves.map((leaf, i) => <Label key={leaf.text} x={i % 2 ? 251 : 86} y={361 + Math.floor(i / 2) * 27} role="computed" small>{leaf.text}: {n(leaf.p, 3)}</Label>)}
    {tree && <Label x={170} y={419} small>Frontier step {step}; winner {tree.winner.path.replace('!', ', EOS')}</Label>}
  </SeqDrawing>;
}

export function SeqShiftFigure({ target = 'cared', padding = 0, position = 3 }) {
  const targets = [...target, 'EOS', ...Array(padding).fill('PAD')];
  const inputs = ['BOS', ...targets.slice(0, -1)];
  const selected=Math.min(position,targets.length-1);
  return <figure className="seq-flow-figure"><div className="seq-flow-columns">{targets.slice(selected,selected+1).map((token)=>{const i=selected;return <SeqDrawing key={i} name="seq2seq-shift-position" height={220} title={`Decoder position ${i+1}`} description={`Previous token ${inputs[i]} enters the GRU; target ${token} enters only the loss. ${token==='PAD'?'Ignored storage position.':'Valid scored position.'}`}>
    <Label x={170} y={20}>Position {i+1}{i===position?' · inspected':''}</Label>
    <Value x={46} y={74} value={inputs[i]} role="input" radius={25}/><Wire points="71,74 108,74"/><Op x={108} y={60} width={62} label="GRU"/>
    <Wire points="170,74 214,74"/><Value x={244} y={74} value="pₜ" radius={23}/>
    <Wire points="244,97 244,147"/><Op x={215} y={147} width={58} label="loss"/>
    <Value x={74} y={161} value={token} role="input" radius={26}/><Wire points="100,161 215,161"/>
    <Label x={170} y={213} small>{token==='PAD'?'m = 0 · no loss contribution':'m = 1 · target is scored here'}</Label>
  </SeqDrawing>;})}</div><figcaption>The upper arrow supplies the previous token. The lower reference arrow meets the distribution only at the loss. No target arrow enters its own GRU. Adjacent positions share recurrent state even though this cutaway isolates one position’s input and target.</figcaption></figure>;
}

export function SeqMaskFigure({ padding=0, probability=.8 }) {
  const lengths=[6,6], total=12*(-Math.log(probability));
  return <SeqDrawing name="seq2seq-loss-mask" height={310} title="Sum valid token costs, then divide by valid token count" description="Two six-target examples include EOS. Appended PAD costs are zero-weight storage. The loss denominator remains twelve.">
    <Label x={170} y={21}>Two answers · six valid targets each</Label>
    {lengths.map((length,row)=><g key={row}>{Array.from({length:length+padding},(_,i)=><g key={i}><rect x={19+i*33} y={56+row*67} width={30} height={28} fill="none" stroke={i<length?color.computed:color.forward} strokeDasharray={i<length?undefined:'3 3'}/><Label x={34+i*33} y={74+row*67} small>{i<length?'1':'0'}</Label></g>)}<Label x={170} y={103+row*67} small>{row?'try → tried + EOS':'care → cared + EOS'} · mask weights</Label></g>)}
    <Wire points="170,184 170,201"/><Op x={115} y={201} width={110} label="sum → ÷ 12"/>
    <Label x={170} y={263} role="computed" small>cost sum {n(total)}; mean {n(total/12)} nats</Label>
    <Label x={170} y={296} small>Ignored positions ≠ forbidden classes</Label>
  </SeqDrawing>;
}

export function SeqLengthFigure({ alpha=0 }) {
  return <SeqDrawing name="seq2seq-length-score" height={262} title="A length denominator changes ranking" description="The same two raw log scores feed separate positive length denominators, then divide. The score is a ranking heuristic rather than a probability.">
    <Label x={170} y={20}>Fixed raw scores · changed ranking policy</Label>
    {[{length:3,logp:-1.5},{length:6,logp:-1.8}].map((row,i)=>{const x=85+170*i,d=((5+row.length)/6)**alpha;return <g key={i}><Label x={x} y={56} small>L = {row.length} including EOS</Label><Value x={x} y={96} value={n(row.logp)} radius={27}/><Wire points={`${x},123 ${x},153`}/><Op x={x-28} y={153} label="÷"/><Label x={x+39} y={171} anchor="start" role="parameter" small>{n(d,3)}</Label><Wire points={`${x},181 ${x},207`}/><Label x={x} y={230} role="computed">{n(row.logp/d,6)}</Label></g>})}
  </SeqDrawing>;
}

export function SeqFittedStateFigure({ trace, step=0, coordinate=0 }) {
  const selected=Math.min(step,trace.steps.length-1),current=trace.steps[selected],previousState=selected?trace.steps[selected-1].state:trace.usedContext;
  const points=(values,startY)=>values.map((value,i)=>`${22+i*296/Math.max(1,values.length-1)},${startY-value*32}`).join(' ');
  return <div className="seq-flow-columns"><SeqDrawing name="seq2seq-fitted-states" height={354} title="Follow one actual learned coordinate through source and decoder positions" description="Both axes use fixed minus-one to one vertical scale. Coordinate numbers are raw learned values, not assigned linguistic meanings.">
    <Label x={170} y={20}>Coordinate {coordinate} · fixed vertical scale [−1, 1]</Label>
    {[{title:'Encoder: after each source token',values:trace.states.map(s=>s[coordinate]),y:108},{title:'Decoder: after previous-token input',values:trace.steps.map(s=>s.state[coordinate]),y:245}].map(row=><g key={row.title}><Label x={170} y={row.y-54} small>{row.title}</Label><line x1={22} x2={318} y1={row.y} y2={row.y} stroke={color.forward}/><polyline points={points(row.values,row.y)} fill="none" stroke={color.computed} strokeWidth={2}/>{row.values.map((v,i)=><g key={i}><circle cx={22+i*296/Math.max(1,row.values.length-1)} cy={row.y-v*32} r={3.5} fill={color.computed}/><Label x={22+i*296/Math.max(1,row.values.length-1)} y={row.y+54} small>{i+1}</Label></g>)}</g>)}
    <Label x={170} y={344} small>Horizontal coordinate: token position</Label>
  </SeqDrawing><SeqDrawing name="seq2seq-fitted-step" height={434} title="Inspect the actual decoder state at one selected step" description="The previous token and full64-coordinate state feed one step; an inspectable cutaway shows the selected coordinate and the actual chosen-token probability.">
    <Label x={170} y={20}>Step {selected+1}: previous token → state → output</Label>
    <Vector x={188} y={65} width={128} length={64} label="previous state: 64"/><Wire points="252,104 252,126 198,126"/>
    <Value x={61} y={126} value={current.previous===1?'BOS':current.previous===2?'EOS':String.fromCharCode(97+current.previous-6)} role="input" radius={27}/><Wire points="88,126 142,126"/><Op x={142} y={112} label="GRU"/>
    <Wire points="170,140 170,162 58,162 58,220 74,220"/><Vector x={74} y={212} length={64} label="actual sₜ · 64 coordinates"/>
    <Label x={170} y={185} role="computed" small>old[{coordinate}] = {n(previousState[coordinate],6)}</Label>
    <Label x={170} y={277} role="computed" small>new[{coordinate}] = {n(current.state[coordinate],6)}</Label>
    <Wire points="170,292 170,315"/><Op x={103} y={315} width={134} label="readout → softmax"/>
    <Label x={170} y={376} role="computed" small>P(chosen token) = {n(current.probabilities[current.selected],6)}</Label>
    <Label x={170} y={407} small>{current.forced?'Choice forced after distribution':'Choice is largest probability'}</Label>
  </SeqDrawing></div>;
}

export function SeqContextFigure({ source, other, used, coordinate=0 }) {
  return <SeqDrawing name="seq2seq-context-intervention" height={371} title="Replace only the decoder initialization, keeping source and weights fixed" description="Fresh source context and fixed lactate context are combined with a mixing fraction and gain. Honest cutaways plus the selected real coordinate identify values; the full table follows.">
    <Vector x={28} y={60} width={132} length={64} label="current source v"/>
    <Vector x={194} y={60} width={132} length={64} label="lactate context"/>
    <Label x={94} y={121} role="computed" small>[{coordinate}] = {n(source[coordinate],5)}</Label><Label x={260} y={121} role="computed" small>[{coordinate}] = {n(other[coordinate],5)}</Label>
    <Wire points="94,138 94,160 145,160"/><Wire points="260,138 260,160 195,160"/><Op x={145} y={146} width={50} label="mix"/>
    <Wire points="170,174 170,203"/><Op x={142} y={203} label="× gain"/>
    <Wire points="170,231 170,247 58,247 58,286 74,286"/><Vector x={74} y={278} length={64} label="edited v → decoder initial state"/>
    <Label x={170} y={354} role="computed" small>used[{coordinate}] = {n(used[coordinate],6)}</Label>
  </SeqDrawing>;
}

export function SeqBeamOwnershipFigure({ candidates, coordinate=0 }) {
  return <figure className="seq-flow-figure"><div className="seq-flow-columns">{candidates.map((candidate,i)=><SeqDrawing key={i} name={`seq2seq-beam-state-${i}`} height={210} title={`Candidate${i+1} owns its prefix, score and state`} description="These are real saved-model states after consuming the previous input. A newly emitted last token has not yet entered this state. Siblings can share an immutable parent state until next input differs.">
    <Label x={170} y={21}>Candidate {i+1} · {candidate.tokens.at(-1)===2?'ended':'live / capped'}</Label>
    <Label x={170} y={57} role="computed" small>{candidate.tokens.map(id=>id===2?'EOS':String.fromCharCode(97+id-6)).join(' ')}</Label>
    <Vector x={74} y={108} length={64} label="owned state after previous input"/>
    <Label x={170} y={171} role="computed" small>coordinate {coordinate}: {n(candidate.state[coordinate],6)}</Label>
    <Label x={170} y={203} small>accumulated log P = {n(candidate.logProbability,6)}</Label>
  </SeqDrawing>)}</div></figure>;
}

export function SeqPackingFigure() {
  return <SeqDrawing name="seq2seq-length-gather" height={395} title="Each source row selects its own last valid state" description="Two rows have different source lengths. The dense scratch recurrence computes padding too, but selects each context at length minus one; the packed library recurrence skips storage padding. Both preserve the valid states.">
    <Label x={170} y={21}>Variable source lengths · one batch</Label>
    {[{length:6,y:67},{length:9,y:174}].map((row,r)=><g key={r}>{Array.from({length:9},(_,i)=><g key={i}><rect x={22+i*33} y={row.y} width={29} height={28} fill="none" stroke={i<row.length?color.input:color.forward} strokeDasharray={i<row.length?undefined:'3 3'}/><Label x={36+i*33} y={row.y+19} small>{i<row.length?i+1:'PAD'}</Label><Wire points={`${36+i*33},${row.y+28} ${36+i*33},${row.y+53}`}/><rect x={22+i*33} y={row.y+53} width={29} height={20} fill="none" stroke={color.computed}/></g>)}<rect x={22+(row.length-1)*33-3} y={row.y+50} width={35} height={26} fill="none" stroke="#fff" strokeWidth={2}/><Wire points={`${36+(row.length-1)*33},${row.y+77} ${36+(row.length-1)*33},${row.y+88} ${r?332:8},${row.y+88} ${r?332:8},310 ${r?312:28},310`}/></g>)}
    <Vector x={28} y={302} width={118} length={64} label="row 1: state at 5"/><Vector x={194} y={302} width={118} length={64} label="row 2: state at 8"/>
    <Label x={170} y={383} small>(N, 64) ↔ (1, N, 64): add/remove layer axis</Label>
  </SeqDrawing>;
}

export function SeqInterfacesFigure() {
  return <figure className="seq-flow-figure"><div className="seq-flow-columns">{['initial','repeat'].map(kind=><SeqDrawing key={kind} name={'seq2seq-interface-'+kind} height={338} title={'Source access: '+kind} description="The final source state initializes once or is supplied again at every decoder step.">
    <Label x={170} y={21}>{kind==='initial'?'Initialize once':'Supply same context every step'}</Label>
    {[0,1,2].map(i=><Value key={i} x={58+112*i} y={71} value={'h'+(i+1)} radius={21}/>)}
    <Wire points="282,92 282,126 170,126 170,143"/><Op x={132} y={143} width={76} label="v = h₃"/>
    {[0,1,2].map(i=><g key={i}><Op x={30+112*i} y={239} width={56} label={'step '+(i+1)}/>{i<2&&<Wire points={(86+112*i)+',253 '+(142+112*i)+',253'}/>}</g>)}
    {kind==='initial'?<Wire points="170,171 170,195 58,195 58,239"/>:[0,1,2].map(i=><Wire key={i} points={'170,171 170,195 '+(58+112*i)+',195 '+(58+112*i)+',239'}/>)}
    <Label x={170} y={319} small>Same fixed source vector; access differs</Label>
  </SeqDrawing>)}</div>
  <div className="seq-flow-columns">{[1,2,3].map(t=><SeqDrawing key={t} name={t===1?'seq2seq-interface-attention':'seq2seq-interface-attention-'+t} height={405} title={'A fresh source read for output step '+t} description="All source states feed this step’s weighted read. The previous decoder state supplies its query. Each output step gets its own read rather than a shared fixed summary.">
    <Label x={170} y={21}>Output step {t}: a separate source read</Label>
    {[0,1,2].map(i=><g key={i}><Value x={58+112*i} y={71} value={'h'+(i+1)} radius={21}/><Wire points={(58+112*i)+',92 '+(58+112*i)+',123 206,123 206,160'}/></g>)}
    <Value x={56} y={183} value={'s'+(t-1)} radius={25}/><Wire points="81,183 151,183"/><Label x={87} y={156} small>query: what to read</Label>
    <Op x={151} y={160} width={110} height={46} label={'weighted read '+t}/>
    <Wire points="206,206 206,233 282,233 282,270 266,270"/><Vector x={74} y={262} length={64} label={'context for step '+t}/>
    <Wire points="170,300 170,330"/><Op x={136} y={330} width={68} label={'decoder '+t}/>
    <Wire points="56,208 56,344 136,344"/>
    <Label x={170} y={391} small>Read weights depend on this step’s query</Label>
  </SeqDrawing>)}</div><figcaption>Attention reads all source states separately at each output step. A query is the decoder state used to decide what to read; the next lesson derives those weights and their combination. These are access diagrams, not a claim that this fixed-context inflector already implements attention.</figcaption></figure>;
}

export function SeqReversalFigure() {
  return <SeqDrawing name="seq2seq-source-reversal" height={285} title="Reversal moves source information nearer some decoder outputs and farther from others" description="Two literal chains show sourceABCversusCBA followed by the sameXYZdecoder. Count recurrent edges from each source state to its corresponding output. Mean path length is three in either constructed case.">
    <Label x={170} y={21}>Constructed alignment: A→X, B→Y, C→Z</Label>
    {[['A','B','C','X','Y','Z'],['C','B','A','X','Y','Z']].map((tokens,row)=><g key={row}>{tokens.map((token,i)=><g key={i}><Value x={30+i*56} y={79+row*104} value={token} role={i<3?'input':'computed'} radius={17}/>{i<5&&<Wire points={`${47+i*56},${79+row*104} ${69+i*56},${79+row*104}`}/>}</g>)}<Label x={170} y={124+row*104} small>{row?'Reversed source: path counts 1, 3, 5':'Original source: path counts 3, 3, 3'}</Label></g>)}
    <Label x={170} y={273} small>Targets stay X Y Z; average stays 3</Label>
  </SeqDrawing>;
}

export function SeqSmoothingFigure() {
  return <SeqDrawing name="seq2seq-support-smoothing" height={316} title="Smoothing must distribute mass only over allowed output classes" description="A constructed three-score vector has two finite allowed scores and a forbidden negative-infinity score. Ordinary uniform smoothing puts nonzero mass on that impossible class and makes loss infinite. Restricted smoothing avoids it.">
    <Label x={170} y={21}>Constructed scores [0, 0, −∞]; correct class 0</Label>
    {[{label:'All-three smoothing .1',mass:['.9333','.0333','.0333'],y:68},{label:'Allowed-two smoothing .1',mass:['.95','.05','0'],y:189}].map(row=><g key={row.y}><Label x={170} y={row.y} small>{row.label}</Label>{row.mass.map((mass,i)=><g key={i}><rect x={36+i*101} y={row.y+18} width={66} height={34} fill="none" stroke={i===2?color.forward:color.computed}/><Label x={69+i*101} y={row.y+40} role={i===2?'operation':'computed'} small>{mass}</Label><Label x={69+i*101} y={row.y+77} small>{i===2?'forbidden':'allowed '+i}</Label></g>)}</g>)}
    <Label x={170} y={298} small>First loss = ∞; restricted loss = log 2</Label>
  </SeqDrawing>;
}

export function SeqStateTransferFigure() {
  return <figure className="seq-flow-figure"><div className="seq-flow-columns">
    <SeqDrawing name="seq2seq-bidirectional-transfer" height={328} title="Concatenate two directional states, then project to decoder width" description="Two64-coordinate directional states concatenate into128. A learned linear map makes the required64-coordinate decoder initial hidden state.">
      <Vector x={25} y={62} width={128} length={64} label="forward h: 64"/><Vector x={187} y={62} width={128} length={64} label="backward h: 64"/>
      <Wire points="89,100 89,130 142,130"/><Wire points="251,100 251,130 198,130"/><Op x={142} y={116} label="concat"/>
      <Wire points="170,144 170,153 12,153 12,196 30,196"/><Vector x={30} y={188} width={280} length={128} label="[forward, backward]: 128"/>
      <Wire points="170,226 170,247"/><Op x={115} y={247} width={110} label="project 128→64"/>
      <Wire points="170,275 170,298"/><Label x={170} y={320} role="computed" small>decoder s₀: 64 coordinates</Label>
    </SeqDrawing>
    <SeqDrawing name="seq2seq-lstm-transfer" height={328} title="Transfer hidden and cell memory on distinct paths" description="An LSTM decoder needs both hidden state and cell state. Separate projections create each required shape; a stack also retains layer ownership.">
      <Vector x={25} y={62} width={128} length={64} label="encoder hidden h"/><Vector x={187} y={62} width={128} length={64} label="encoder cell c"/>
      {[89,251].map((x,i)=><g key={x}><Wire points={x+',100 '+x+',146'}/><Op x={x-48} y={146} width={96} label={i?'project c':'project h'}/><Wire points={x+',174 '+x+',188 '+(x-80)+',188 '+(x-80)+',224 '+(x-60)+',224'}/><Vector x={x-60} y={216} width={120} length={64} label={i?'decoder c₀':'decoder h₀'}/></g>)}
      <Label x={170} y={299} small>Each layer owns a hidden / cell pair</Label>
      <Label x={170} y={323} small>Layer axis is not extra time or batch</Label>
    </SeqDrawing>
  </div></figure>;
}

export function SeqRewardFigure() {
  return <SeqDrawing name="seq2seq-sequence-reward" height={316} title="Expected reward weighs complete answers by their probabilities" description="Complete answerAhas probability0.6and reward0; Bhas probability0.4and reward1. Multiplication and summation give expected reward0.4.">
    <Label x={170} y={21}>Two complete answers · one task reward</Label>
    {[{x:85,name:'A',p:.6,reward:0},{x:255,name:'B',p:.4,reward:1}].map(row=><g key={row.name}><Value x={row.x} y={70} value={row.name} radius={24}/><Label x={row.x} y={119} role="computed" small>P={row.p}; reward={row.reward}</Label><Wire points={row.x+',135 '+row.x+',151'}/><Op x={row.x-28} y={151} label="×"/><Label x={row.x} y={207} role="computed" small>{row.p*row.reward}</Label><Wire points={row.x+',219 '+row.x+',239 170,239 170,252'}/></g>)}
    <Op x={142} y={252} label="Σ"/><Label x={170} y={298} role="computed" small>Expected reward = 0.4</Label>
  </SeqDrawing>;
}

export function SeqCreditFigure({ result }) {
  return <SeqDrawing name="seq2seq-joint-credit" height={606} title="Two decoder losses send credit through one context bridge into two encoder updates" description="The complete constructed dependency chain has encoderh1andh2, then decoders1ands2. Orange reverse arrows return loss credit through both decoder steps and the initial state; the two encoder uses belong to the same weight.">
    <Label x={170} y={22}>Forward values ↓ · loss credit ↑</Label>
    {[{name:'h₁',value:result.encoder[0],y:86},{name:'h₂ = v',value:result.context,y:222},{name:'s₁',value:result.decoder[0],y:358},{name:'s₂',value:result.decoder[1],y:494}].map((row,i)=><g key={row.name}>
      <Value x={115} y={row.y} value={n(row.value,4)} radius={31}/><Label x={i===0?115:178} y={row.y-46} role="computed" small>{row.name}</Label>
      {i<3&&<><Wire points={'115,'+(row.y+31)+' 115,'+(row.y+105)}/><Label x={159} y={row.y+74} small>{i===0?'× .4':i===1?'bridge × .5':'× .5'}</Label></>}
      <Wire points={'84,'+(row.y+24)+' 42,'+(row.y+24)+' 42,'+(row.y-26)+' 84,'+(row.y-26)} backward/>
      {i>=2&&<><Wire points={'146,'+row.y+' 227,'+row.y}/><Op x={227} y={row.y-14} width={80} label={i===2?'A loss':'EOS loss'}/><Wire points={'227,'+(row.y+20)+' 182,'+(row.y+20)+' 182,'+(row.y+7)+' 146,'+(row.y+7)} backward/></>}
      {i<3&&<Wire points={'42,'+(row.y+109)+' 42,'+(row.y+25)} backward/>}
    </g>)}
    <Label x={245} y={551} small>Both losses enter the mean</Label>
    <Label x={170} y={582} role="gradient" small>Same w is reused at h₁ and h₂</Label>
    <Label x={170} y={603} small>Reverse arrows show dependencies, not updates</Label>
  </SeqDrawing>;
}

export function SeqGroupSplitFigure() {
  return <SeqDrawing name="seq2seq-grouped-split" height={435} title="Connected lexical variants stay in one data partition" description="work andworke share target forms and are linked before splitting. Their group cannot cross train and development. Aggregate partition counts are451and149lemmas; this drawing does not assign a particular shown group without consulting the data.">
    <Label x={170} y={21}>Split connected groups, then build examples</Label>
    <Op x={25} y={61} width={90} label="work"/><Op x={225} y={61} width={90} label="worke"/>
    <Wire points="70,89 70,126 120,126"/><Wire points="270,89 270,126 220,126"/><Op x={120} y={112} width={100} label="worked"/>
    <Label x={170} y={170} small>Shared target links both lemma spellings</Label>
    <Wire points="170,140 170,151 329,151 329,197 170,197 170,219"/>
    <Op x={95} y={219} width={150} label="one connected group"/>
    <Wire points="170,247 170,277"/><Op x={120} y={277} width={100} label="assign group"/>
    <Wire points="145,305 85,343"/><Wire points="195,305 255,343"/>
    <Op x={25} y={343} width={120} label="training groups"/><Op x={195} y={343} width={120} label="development"/>
    <Label x={85} y={403} role="computed" small>451 lemmas; 1353 rows</Label><Label x={255} y={403} role="computed" small>149 lemmas; 447 rows</Label>
    <Label x={170} y={429} small>Every group takes one branch, never both</Label>
  </SeqDrawing>;
}

export function SeqPrefixFigure({ baseline, edited }) {
  const index=Math.min(1,baseline.steps.length-1,edited.steps.length-1);
  return <SeqDrawing name="seq2seq-prefix-intervention" height={394} title="A forced emitted token changes only the following recurrent update" description="The first distribution is computed fromBOSand the same initial context. At the next compared step, the previous chosen token can differ; each branch recomputes its own next state and distribution.">
    <Label x={170} y={21}>First distribution stays fixed before choice</Label>
    <Label x={170} y={54} role="computed" small>P(e) = {n(baseline.steps[0].probabilities[10],6)} in both</Label>
    {[{name:'Own-context greedy',trace:baseline,x:85},{name:'Forced-prefix route',trace:edited,x:255}].map(row=>{const step=row.trace.steps[index];return <g key={row.name}>
      <Label x={row.x} y={94} small>{row.name}</Label>
      <Value x={row.x} y={139} role="input" value={step.previous===1?'BOS':String.fromCharCode(97+step.previous-6)} radius={23}/>
      <Wire points={row.x+',162 '+row.x+',194'}/><Op x={row.x-28} y={194} label="GRU"/>
      <Vector x={row.x+31} y={150} width={42} length={64} label="old 64"/>
      <Wire points={(row.x+73)+',158 '+(row.x+77)+',158 '+(row.x+77)+',208 '+(row.x+28)+',208'}/>
      <Wire points={row.x+',222 '+row.x+',294'}/><Op x={row.x-53} y={294} width={106} label="readout + softmax"/>
      <Label x={row.x} y={351} role="computed" small>P(m) = {n(step.probabilities[18],6)}</Label>
    </g>})}
    <Label x={170} y={383} small>Compare decoder position {index+1}; weights unchanged</Label>
  </SeqDrawing>;
}
