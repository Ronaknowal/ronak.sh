import { flowNumber as number } from './LessonFlow.jsx';
import './long-context-flow.css';

const paint = { input: '#79c5d8', learned: '#e2b55a', result: '#baa1e3', ink: '#dedede', wire: '#898989', credit: '#e99369', mask: '#646464' };
function Text({ x, y, children, role = 'ink', anchor = 'start', size = 14 }) {
  return <text x={x} y={y} fill={paint[role]} textAnchor={anchor} fontSize={size}>{children}</text>;
}
function Wire({ points, credit = false }) {
  const vertices = points.map(([x, y]) => `${x},${y}`).join(' ');
  const end = points.at(-1), before = points.at(-2), angle = Math.atan2(end[1] - before[1], end[0] - before[0]);
  const side = sign => [end[0] - 7 * Math.cos(angle) + sign * 3 * Math.sin(angle), end[1] - 7 * Math.sin(angle) - sign * 3 * Math.cos(angle)];
  return <g fill="none" stroke={credit ? paint.credit : paint.wire} strokeWidth="1.5" strokeDasharray={credit ? '5 4' : undefined}>
    <polyline points={vertices} /><polyline points={[side(-1), end, side(1)].map(p => p.join(',')).join(' ')} />
  </g>;
}
function Op({ x, y, width = 120, text, height = 36 }) {
  return <g><rect x={x} y={y} width={width} height={height} rx="5" fill="none" stroke={paint.ink} /><Text x={x + width / 2} y={y + height / 2 + 5} anchor="middle">{text}</Text></g>;
}
function ArrayRows({ x, y, rows, width = 108, cellHeight = 27, role = 'input', selected = -1 }) {
  const cols = rows[0]?.length ?? 1, cellWidth = width / cols;
  return <g>{rows.map((row, i) => <g key={i}>{row.map((value, j) => <g key={j}>
    <rect x={x + j * cellWidth} y={y + i * cellHeight} width={cellWidth} height={cellHeight} fill="none" stroke={i === selected ? paint.ink : paint[role]} strokeWidth={i === selected ? 2.3 : 1} />
    <Text x={x + (j + .5) * cellWidth} y={y + i * cellHeight + 18} role={role} anchor="middle" size={13}>{typeof value === 'number' ? number(value, 3) : value}</Text>
  </g>)}</g>)}</g>;
}
function Drawing({ name, label, height, children, caption, width = 360 }) {
  return <figure className="long-flow-drawing" data-figure={`long-context-${name}`}>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>{children}</svg>
    {caption && <figcaption>{caption}</figcaption>}
  </figure>;
}

export function LongEntranceDrawing() {
  const messages = ['Use the east entrance.', 'Meeting starts at ten.', 'Lunch in the courtyard.', 'Bring your badge.', 'Which entrance?'];
  return <Drawing name="entrance" height={332} label="Five ordered messages; the final question sees only positions three and four" caption="The dashed rows lie outside the two-message window. The question is still visible; its evidence is not.">
    <Text x={12} y={22}>Earlier → later messages</Text>
    {messages.map((text, i) => <g key={text}>
      <Text x={14} y={66 + 49 * i} role="input">{i}</Text>
      <rect x="42" y={45 + 49 * i} width="293" height="35" fill="none" stroke={i >= 3 ? paint.input : paint.mask} strokeDasharray={i < 3 ? '5 4' : undefined} />
      <Text x={55} y={67 + 49 * i} role={i < 3 ? 'mask' : 'input'}>{text}</Text>
      {i < 4 && <Wire points={[[27, 74 + 49 * i], [27, 87 + 49 * i]]} />}
    </g>)}
    <Text x={42} y={319}>Current visible window: positions 3, 4</Text>
  </Drawing>;
}

export function LongMemoryObjectsDrawing() {
  const values = [6, 1, 8, 2, 0];
  return <div className="long-flow-three">
    <Drawing name="records-object" height={270} label="Five supplied records are retained in five separate rows" width={280} caption="Separate rows remain individually addressable.">
      <Text x={18} y={22}>Keep records</Text><Text x={18} y={48} role="input">Input values, positions 0–4</Text>
      <ArrayRows x={26} y={65} width={60} rows={values.map(v => [v])} />
      <Wire points={[[86, 132], [132, 132]]} />
      <ArrayRows x={150} y={65} width={98} rows={values.map((v, i) => [i, v])} role="result" />
      <Text x={155} y={222} role="result">position | value</Text>
    </Drawing>
    <Drawing name="state-object" height={270} label="Each incoming value updates a sum and count, replacing the earlier two-coordinate state" width={280} caption="For a running average, two numbers suffice. They do not expose the original second value.">
      <Text x={18} y={22}>Update a summary</Text>
      <ArrayRows x={18} y={50} width={70} rows={[[6], [1], [8], [2], [0]]} />
      <Wire points={[[88, 112], [120, 112]]} />
      <Op x={120} y={93} width={128} text="update sum/count" />
      <Wire points={[[184, 129], [184, 168]]} />
      <ArrayRows x={124} y={168} width={120} rows={[[17, 5]]} role="result" />
      <Text x={124} y={220} role="result">sum 17; count 5</Text>
      <Text x={124} y={246}>average = 17/5</Text>
    </Drawing>
    <Drawing name="latents-object" height={270} label="Five original input rows remain outside a two-row working array and can be read again" width={280} caption="Two working rows hold computed summaries; the five-row input bank is still available.">
      <Text x={18} y={22}>Make working notes</Text>
      <ArrayRows x={18} y={54} width={54} rows={values.map(v => [v])} />
      <Text x={18} y={215} role="input">input bank</Text>
      <Wire points={[[72, 109], [119, 109]]} />
      <Op x={119} y={91} width={127} text="two reads" />
      <Wire points={[[182, 127], [182, 165]]} />
      <ArrayRows x={126} y={165} width={116} rows={[['z₁₁', 'z₁₂'], ['z₂₁', 'z₂₂']]} role="result" />
      <Wire points={[[126, 207], [100, 207], [100, 119], [119, 119]]} />
      <Text x={112} y={249}>can read again</Text>
    </Drawing>
  </div>;
}

export function LongSegmentDrawing({ records = [6, 1, 8, 2, 0], memory = 2, segment = 2, query = 4, statuses }) {
  const start = Math.floor(query / segment) * segment, first = Math.max(0, start - memory);
  return <Drawing name="segment-records" height={records.length * 43 + 125} label={`Current query at position ${query} reads retained positions from ${first} and current segment through ${query}`} caption="Rows before the retained boundary have gone. Later rows are not legal evidence for this query; neither group enters its weight denominator.">
    <Text x={12} y={22}>Global position</Text><Text x={135} y={22}>record value</Text>
    {records.map((value, i) => <g key={i}>
      <Text x={37} y={57 + i * 43} role="input" anchor="middle">{i}</Text>
      <rect x="95" y={37 + i * 43} width="78" height="29" fill="none" stroke={i < first || i > query || (statuses && statuses[i] !== 'legal') ? paint.mask : paint.input} strokeDasharray={i < first || i > query || (statuses && statuses[i] !== 'legal') ? '4 3' : undefined} />
      <Text x={134} y={57 + i * 43} anchor="middle" role={i < first || i > query || (statuses && statuses[i] !== 'legal') ? 'mask' : 'input'}>{number(value)}</Text>
      <Text x={191} y={57 + i * 43} role={i < first || i > query || (statuses && statuses[i] !== 'legal') ? 'mask' : 'ink'}>{statuses?.[i] === 'excluded by edit' ? 'excluded by edit' : i < first ? 'discarded' : i < start ? 'retained old row' : i <= query ? 'current row' : 'future: masked'}</Text>
    </g>)}
    <Text x={12} y={records.length * 43 + 76}>Current segment begins at {start}</Text>
    <Text x={12} y={records.length * 43 + 104}>Retained span M={memory}; segment L={segment}</Text>
  </Drawing>;
}

export function LongLowerLayerDrawing() {
  return <Drawing name="lower-layer-memory" height={555} label="Transformer-XL current upper layer reads cached lower-layer rows and current lower-layer rows; past gradient creation is detached" caption="Cyan rows are supplied activations. Amber W matrices are current learned projections. Gray arrows carry values; orange dashed arrows mark current loss credit. The orange path stops at stored old rows, not at their current K/V projections.">
    <Text x={12} y={22}>Previous segment</Text><Text x={201} y={22}>Current segment</Text>
    <ArrayRows x={15} y={47} width={118} rows={[[ 'h₀₁', 'h₀₂'], ['h₁₁', 'h₁₂']]} />
    <ArrayRows x={209} y={47} width={118} rows={[['h₂₁', 'h₂₂'], ['h₃₁', 'h₃₂']]} />
    <Text x={15} y={41}>LOWER-layer rows</Text><Text x={210} y={41}>LOWER-layer rows</Text>
    <Wire points={[[74, 101], [74, 144]]} /><Op x={15} y={144} width={118} text="detach past" />
    <Wire points={[[74, 180], [74, 207], [155, 207], [155, 236]]} />
    <Wire points={[[267, 101], [267, 207], [189, 207], [189, 236]]} />
    <Op x={117} y={236} width={110} text="‖ join rows" />
    <Wire points={[[172, 272], [172, 308], [78, 308], [78, 336]]} />
    <Wire points={[[172, 272], [172, 308], [181, 308], [181, 336]]} />
    <Wire points={[[267, 207], [290, 207], [290, 336]]} />
    <Text x={41} y={324} role="learned">Wₖ</Text><Text x={157} y={324} role="learned">Wᵥ</Text><Text x={255} y={324} role="learned">Wq</Text>
    <ArrayRows x={25} y={336} width={100} rows={[[ 'k₀₁', 'k₀₂'], ['k₁₁', 'k₁₂'], ['k₂₁', 'k₂₂'], ['k₃₁', 'k₃₂']]} role="result" />
    <ArrayRows x={145} y={336} width={75} rows={[[ 'v₀₁', 'v₀₂'], ['v₁₁', 'v₁₂'], ['v₂₁', 'v₂₂'], ['v₃₁', 'v₃₂']]} role="result" />
    <ArrayRows x={250} y={336} width={92} rows={[[ 'q₂₁', 'q₂₂'], ['q₃₁', 'q₃₂']]} role="result" />
    <Wire points={[[75, 444], [75, 480], [124, 480]]} />
    <Wire points={[[182, 444], [182, 462]]} />
    <Wire points={[[296, 390], [296, 480], [232, 480]]} />
    <Op x={124} y={462} width={108} text="legal read" />
    <Wire credit points={[[117, 467], [90, 467], [90, 319]]} />
    <Wire credit points={[[233, 467], [229, 467], [229, 319], [203, 319]]} />
    <Wire credit points={[[120, 236], [120, 217], [99, 217], [99, 180]]} />
    <Text x={12} y={520}>New upper-layer rows</Text>
    <Text x={12} y={546}>Past values still influence the read</Text>
  </Drawing>;
}

export function LongRetainWriteDrawing({ previous = .6, input = 0, inputGate = 1, retention = .8, simple = false }) {
  const scale = Math.sqrt(1 - retention * retention), retained = retention * previous, written = scale * inputGate * input;
  return <Drawing name="retain-write" height={405} label="Old state is multiplied by retention, new input by its write coefficient, then both contributions are added" caption={simple ? 'The ⊗ marks multiply; the ⊕ mark adds. With zero incoming input, the write contribution is zero while the old-state route still shrinks.' : 'The ⊗ marks are coordinate-wise multiplication. Closing the input gate removes the write contribution; the old-state route still has its separate retention multiplier.'}>
    <Text x={16} y={24}>Old state h={number(previous)}</Text><Text x={206} y={24} role="input">New x={number(input)}</Text>
    <ArrayRows x={43} y={42} width={64} rows={[[previous]]} />
    <ArrayRows x={238} y={42} width={64} rows={[[input]]} />
    <Wire points={[[75, 69], [118, 69], [118, 120], [90, 133]]} /><Wire points={[[270, 69], [329, 69], [329, 120], [286, 133]]} />
    <Text x={14} y={108}>a={number(retention)}</Text><Text x={294} y={108} anchor="end">{simple ? `b=${number(scale * inputGate)}` : `i=${number(inputGate)}`}</Text>
    <Op x={44} y={133} width={63} text="⊗" /><Op x={239} y={133} width={63} text="⊗" />
    <Wire points={[[75, 169], [75, 224]]} />
    {!simple && <><Wire points={[[270, 169], [270, 224]]} /><Text x={183} y={203}>√(1−a²)={number(scale)}</Text><Op x={239} y={224} width={63} text="⊗" /></>}
    <ArrayRows x={44} y={224} width={63} rows={[[retained]]} role="result" />
    <Wire points={[[270, simple ? 169 : 260], [270, 282], [210, 282]]} />
    <Wire points={[[75, 251], [75, 282], [150, 282]]} />
    <Op x={150} y={264} width={60} text="⊕" />
    <Text x={231} y={311} role="result">write {number(written)}</Text>
    <Wire points={[[180, 300], [180, 338]]} />
    <ArrayRows x={125} y={338} width={110} rows={[[retained + written]]} role="result" />
    <Text x={125} y={395}>New state</Text>
  </Drawing>;
}

export function LongLatentArraysDrawing() {
  return <Drawing name="latent-arrays" height={525} label="Three supplied tagged records make keys and values; two learned query rows produce a two-by-three read grid and two computed latent rows" caption="Each colored array is a real row-by-coordinate object. Here the scalar projected fixture keeps the arithmetic small; wider learned feature arrays use the same row axes.">
    <Text x={12} y={22}>Supplied tagged records</Text>
    <ArrayRows x={25} y={43} width={132} rows={[[-1, 2], [0, 6], [1, 10]]} />
    <Text x={25} y={147} role="input">tag | returned value</Text>
    <Text x={203} y={22} role="learned">Learned questions</Text>
    <ArrayRows x={221} y={43} width={100} rows={[['−ln 2'], ['+ln 2']]} role="learned" />
    <Wire points={[[25,84],[4,84],[4,229],[77,229]]} />
    <Wire points={[[271, 97], [271, 181], [218, 181], [218, 211]]} />
    <Op x={77} y={211} width={200} text="score + row softmax" />
    <Wire points={[[177, 247], [177, 277]]} />
    <ArrayRows x={70} y={277} width={213} rows={[['4/7', '2/7', '1/7'], ['1/7', '2/7', '4/7']]} role="result" />
    <Text x={12} y={353} role="result">2 question rows</Text><Text x={12} y={377} role="result">3 donor columns</Text>
    <Wire points={[[177, 331], [177, 380]]} /><rect x="91" y="43" width="66" height="81" fill="none" stroke={paint.input} strokeWidth="2"/><Wire points={[[157,115],[350,115],[350,398],[254,398]]}/><Text x={274} y={378}>all values</Text>
    <Op x={101} y={380} width={153} text="weights × values" />
    <Wire points={[[177, 416], [177, 431]]} />
    <ArrayRows x={115} y={431} width={124} rows={[["30/7"], ["54/7"]]} role="result" />
    <Text x={115} y={513}>Two computed rows</Text>
  </Drawing>;
}

export function LongWeightedDrawing({ masked = false }) {
  const supports=[2,1,masked?0:3],values=[2,4,8],total=supports.reduce((a,b)=>a+b,0);
  return <Drawing name={masked?'masked-read':'weighted-read'} height={600} label="Each supplied value and its normalized share enter a multiplication; the three resulting contributions enter a sum" caption={masked?'The future row has share zero because its support was removed before normalization. It adds no contribution.':'Each multiplication receives two distinct inputs: the supplied value and its computed share. The final sum combines the three returned contributions.'}>
    <Text x={15} y={24}>Value and share → multiply → contribution</Text>
    {values.map((value,i)=><g key={i}>
      <Text x={17} y={61+i*127} role={masked&&i===2?'mask':'input'}>Value {i+1}</Text>
      <ArrayRows x={17} y={78+i*127} width={69} rows={[[value]]} role={masked&&i===2?'mask':'input'}/>
      <Text x={17} y={133+i*127} role="result">Share {supports[i]}/{total}</Text>
      <ArrayRows x={154} y={114+i*127} width={74} rows={[[`${supports[i]}/${total}`]]} role="result"/>
      <Wire points={[[86,91+i*127],[174,91+i*127]]}/><Op x={174} y={73+i*127} width={54} text="×"/>
      <Wire points={[[191,114+i*127],[191,109+i*127]]}/>
      <Wire points={[[228,91+i*127],[263,91+i*127]]}/><ArrayRows x={263} y={78+i*127} width={78} rows={[[value*supports[i]/total]]} role="result"/>
      <Wire points={[[302,105+i*127],[348-i*9,105+i*127],[348-i*9,483-i*12],[219,483-i*12]]}/>
    </g>)}
    <Op x={136} y={452} width={83} height={49} text="Σ add"/><Wire points={[[178,501],[178,531]]}/>
    <ArrayRows x={116} y={531} width={125} rows={[[values.reduce((a,v,i)=>a+v*supports[i]/total,0)]]} role="result"/>
    <Text x={15} y={590}>Shares total 1; contributions need not</Text>
  </Drawing>;
}

export function LongShapeDrawing() {
  return <Drawing name="attention-arrays" height={552} label="Two query rows times three transposed key columns make a two-by-three grid; weighted values return two rows" caption="Actual row and column axes stay visible. A cutaway uses two questions, three donors and two coordinates; the same multiplication supports longer arrays.">
    <Text x={12} y={24}>Q: 2 × 2</Text><Text x={12} y={52}>question × feature</Text>
    <ArrayRows x={18} y={59} width={115} rows={[["q₁₁", "q₁₂"], ["q₂₁", "q₂₂"]]} />
    <Text x={175} y={24}>Kᵀ: 2 × 3</Text><Text x={175} y={52}>feature × donor</Text><ArrayRows x={172} y={59} width={170} rows={[["k₁₁", "k₂₁", "k₃₁"], ["k₁₂", "k₂₂", "k₃₂"]]} />
    <Wire points={[[76, 113], [76, 156], [147, 156]]} /><Wire points={[[258, 113], [258, 156], [206, 156]]} />
    <Op x={147} y={138} width={59} text="×" /><Wire points={[[206, 156],[351, 156],[351, 236],[279, 236]]} />
    <Text x={13} y={197}>2 × 3 scores → row softmax</Text>
    <ArrayRows x={84} y={211} width={195} rows={[["α₁₁", "α₁₂", "α₁₃"], ["α₂₁", "α₂₂", "α₂₃"]]} role="result" />
    <Text x={15} y={299}>V: same 3 donors × 2 features</Text>
    <ArrayRows x={18} y={323} width={112} rows={[["v₁₁", "v₁₂"], ["v₂₁", "v₂₂"], ["v₃₁", "v₃₂"]]} />
    <Wire points={[[279, 252],[320, 252],[320, 359],[211, 359]]} /><Wire points={[[130, 363], [151, 363]]} /><Op x={151} y={340} width={60} text="×" />
    <Wire points={[[181, 376], [181, 438]]} /><ArrayRows x={105} y={438} width={153} rows={[["o₁₁", "o₁₂"], ["o₂₁", "o₂₂"]]} role="result" />
    <Text x={20} y={531}>Output: 2 questions × 2 value features</Text>
  </Drawing>;
}

export function LongRelativeDrawing() {
  return <Drawing name="relative-addresses" height={335} label="Keys at logical positions one and five remain distances four and zero from query five after a common shift of one hundred" caption="Global positions are addresses; relative distances remain the same when the whole coordinate origin shifts.">
    {[0, 100].map((shift, row) => <g key={shift}>
      <Text x={15} y={25 + row * 154}>Origin shifted by {shift}</Text>
      <line x1="36" y1={83 + row * 154} x2="327" y2={83 + row * 154} stroke={paint.wire} />
      {[1, 2, 3, 4, 5].map((position, i) => <g key={position}><circle cx={48 + i * 64} cy={83 + row * 154} r="5" fill={i === 4 ? paint.result : paint.input} /><Text x={48 + i * 64} y={110 + row * 154} anchor="middle">{position + shift}</Text></g>)}
      <Wire points={[[48, 58 + row * 154], [304, 58 + row * 154]]} />
      <Text x={167} y={49 + row * 154} anchor="middle">distance 4</Text>
      <Text x={229} y={137 + row * 154}>query distance 0</Text>
    </g>)}
  </Drawing>;
}

export function LongRelativeScoreDrawing() {
  return <Drawing name="relative-score" height={474} label="Four scalar dot-product branches combine content, relative location and two learned global preferences before one shared scale" caption="r is the projected row for the query-minus-key offset. Amber u and v are shared learned preferences, not extra query positions.">
    {[["q", "k", "q·k"], ["q", "r", "q·r"], ["u", "k", "u·k"], ["v", "r", "v·r"]].map(([left, right, name], i) => <g key={name}>
      <ArrayRows x={15} y={39 + i * 78} width={90} rows={[[`${left}₁`, `${left}₂`]]} role={i >= 2 ? 'learned' : 'input'} />
      <ArrayRows x={211} y={39 + i * 78} width={90} rows={[[`${right}₁`, `${right}₂`]]} role={right === 'r' ? 'result' : 'input'} />
      <Wire points={[[105, 52 + i * 78], [132, 52 + i * 78]]} /><Wire points={[[211, 52 + i * 78], [183, 52 + i * 78]]} />
      <Op x={132} y={34 + i * 78} width={51} text="·" /><Text x={116} y={93 + i * 78} anchor="end">{name}</Text>
      <Wire points={[[158, 70 + i * 78], [158, 105 + i * 78], [331 + i * 5, 105 + i * 78], [331 + i * 5, 370 + i * 4], [216, 370 + i * 4]]} />
    </g>)}
    <Op x={120} y={353} width={96} height={55} text="Σ / √d" />
    <Wire points={[[168, 408], [168, 432]]} /><Text x={168} y={465} anchor="middle" role="result">One comparison score</Text>
  </Drawing>;
}

export function LongGateGenerationDrawing() {
  return <Drawing name="gate-generation" height={507} label="The supplied input enters independent block-diagonal affine gate matrices; input and recurrence gates act on different paths" caption="Only the input determines these gates. Each outlined diagonal block mixes its own input coordinates; old state does not enter the gate generators.">
    <Text x={20} y={22}>Current x: four supplied features</Text><ArrayRows x={49} y={45} width={257} rows={[["x₁", "x₂", "x₃", "x₄"]]} />
    {[25, 205].map((x, branch) => <g key={x}>
      <Wire points={[[branch ? 244 : 100, 72], [branch ? 244 : 100, 114]]} />
      {[0, 1, 2, 3].map(i => [0, 1, 2, 3].map(j => <rect key={`${i}-${j}`} x={x + j * 26} y={114 + i * 26} width="26" height="26" fill={Math.floor(i / 2) === Math.floor(j / 2) ? '#e2b55a22' : 'none'} stroke={Math.floor(i / 2) === Math.floor(j / 2) ? paint.learned : paint.mask} />))}
      <Text x={x} y={242} role="learned">{branch ? 'Wr, br' : 'Wi, bi'}</Text><Wire points={[[x + 52, 218], [x + 52, 264]]} /><Op x={x + 18} y={264} width={70} text="σ" />
      <Text x={x} y={332} role="result">{branch ? 'recurrence r' : 'input gate i'}</Text>
    </g>)}
    <Wire points={[[293,282],[353,282],[353,368],[324,368]]} /><Op x={190} y={350} width={134} text="a = base^(8r)" /><Text x={20} y={403} role="learned">Learned base</Text><ArrayRows x={20} y={350} width={122} rows={[["base"]]} role="learned"/><Wire points={[[142,368],[190,368]]}/>
    <Wire points={[[258, 386], [258, 424]]} /><Op x={164} y={424} width={173} text="√(1−a²) injection" />
    <Text x={20} y={489}>Return i, a and injection to the circuit</Text>
  </Drawing>;
}

export function LongGriffinBlockDrawing() {
  return <Drawing name="griffin-branches" height={566} label="Input splits into a temporal convolution plus recurrent state branch and a parallel GELU branch; products return to model width and residual" caption="The four-slot stencil uses present and three past samples of each channel. Gray forward wires meet at coordinate-wise multiplication; a full-input bypass meets the projected update at addition.">
    <Text x={20} y={24}>Input row, model width d</Text><ArrayRows x={81} y={44} width={177} rows={[["x₁", "x₂", "…", "xd"]]} />
    <Wire points={[[120, 71], [120, 113]]} /><Wire points={[[219, 71], [282, 71], [282, 113]]} />
    <Op x={20} y={113} width={146} text="learned projection" /><Op x={211} y={113} width={140} text="learned projection" />
    <Text x={20} y={181}>One channel</Text><ArrayRows x={20} y={199} width={157} rows={[["t−3", "t−2", "t−1", "t"]]} />
    <Wire points={[[93,149],[185,149],[185,212],[177,212]]} /><Wire points={[[93, 226], [93, 269]]} /><Op x={20} y={269} width={145} text="depthwise filter" />
    <Wire points={[[93, 305], [93, 344]]} /><Op x={20} y={344} width={145} text="RG-LRU" />
    <Wire points={[[282, 149], [282, 344]]} /><Op x={233} y={344} width={102} text="GELU" />
    <Wire points={[[93, 380], [93, 410], [150, 410]]} /><Wire points={[[284, 380], [284, 410], [205, 410]]} /><Op x={150} y={392} width={55} text="⊗" />
    <Wire points={[[177, 428], [177, 456]]} /><Op x={107} y={456} width={143} text="output projection" />
    <Wire points={[[177, 492], [177, 514]]} /><Op x={151} y={514} width={54} text="⊕" />
    <Wire points={[[81, 57], [4, 57], [4, 532], [151, 532]]} /><Text x={218} y={546}>same width d</Text>
  </Drawing>;
}

export function LongLatentProcessDrawing() {
  return <Drawing name="latent-processing" height={533} label="A large input bank remains available for two reads while a smaller latent matrix is self-processed between them" caption="The same learned parameters are reused on the second round; the query rows have changed, so the read need not be the same.">
    <Text x={12} y={23}>Input bank</Text><Text x={12} y={40}>T × input features</Text><ArrayRows x={15} y={47} width={103} rows={[["x₀", "…"], ["x₁", "…"], ["…", "…"], ["xT−1", "…"]]} />
    <Text x={181} y={23} role="learned">K initial rows</Text><ArrayRows x={199} y={47} width={128} rows={[["z₁₁", "z₁₂"], ["z₂₁", "z₂₂"]]} role="learned" />
    <Wire points={[[118, 87], [152, 87], [152, 187], [199, 187]]} /><Wire points={[[263, 101], [263, 169]]} /><Op x={199} y={169} width={128} text="cross-read" />
    <Wire points={[[263, 205], [263, 238]]} /><ArrayRows x={199} y={238} width={128} rows={[["z′₁₁", "z′₁₂"], ["z′₂₁", "z′₂₂"]]} role="result" />
    <Wire points={[[263, 292], [263, 325]]} /><Op x={179} y={325} width={163} text="self-read + MLP" />
    <Wire points={[[263, 361], [263, 406]]} /><Op x={199} y={406} width={128} text="cross-read again" />
    <Wire points={[[118, 134], [136, 134], [136, 424], [199, 424]]} /><Wire points={[[263, 442], [263, 466]]} />
    <ArrayRows x={199} y={466} width={128} rows={[["z″₁₁", "z″₁₂"], ["z″₂₁", "z″₂₂"]]} role="result" />
    <Text x={15} y={360}>Original input</Text><Text x={15} y={383}>not discarded</Text>
  </Drawing>;
}

export function LongTaggedDrawing({ fourier = false }) {
  const rows = fourier ? [[0, 0, 1], [.5, 1, 0]] : [[-1, 2], [0, 6], [1, 10]];
  return <Drawing name={fourier ? 'fourier-tags' : 'tagged-records'} height={fourier ? 230 : 330} label={fourier ? 'A coordinate joins sine and cosine columns; zero and one-half have distinct three-feature rows' : 'Whole tag-value rows move together in one case; values alone move under fixed tags in the other'} caption={fourier ? 'Columns: raw coordinate x, sin(πx), cos(πx). Shown zeros are exact mathematical values, up to floating-point evaluation.' : 'A tag is part of a record. Permuting complete rows keeps each tag associated with its own value.'}>
    {fourier ? <><Text x={18} y={26}>x | sin(πx) | cos(πx)</Text><ArrayRows x={20} y={58} width={312} rows={rows} cellHeight={43} /><Text x={20} y={190}>More frequencies add pairs of columns</Text></> : <>
      <Text x={20} y={25}>Original</Text><ArrayRows x={20} y={47} width={124} rows={rows} />
      <Text x={182} y={25}>Move whole rows</Text><ArrayRows x={195} y={47} width={124} rows={[rows[2], rows[0], rows[1]]} />
      <Wire points={[[144, 87], [194, 87]]} /><Text x={20} y={170}>Reassign values to fixed tags</Text><ArrayRows x={99} y={195} width={146} rows={[[-1, 10], [0, 2], [1, 6]]} />
    </>}
  </Drawing>;
}

export function LongOutputQueriesDrawing() {
  return <Drawing name="output-queries" height={432} label="Four output-query rows read two processed latent donors, producing four returned answer rows" caption="The number of output rows follows the requests. Their feature width follows the value features and final task projection; no optical-flow values are invented here.">
    <Text x={12} y={24}>Four output requests</Text><Text x={210} y={24}>Two latents</Text>
    <ArrayRows x={18} y={50} width={139} rows={[["q₁₁", "q₁₂"], ["q₂₁", "q₂₂"], ["q₃₁", "q₃₂"], ["q₄₁", "q₄₂"]]} />
    <ArrayRows x={215} y={50} width={120} rows={[["z₁₁", "z₁₂"], ["z₂₁", "z₂₂"]]} role="result" />
    <Wire points={[[88, 158], [88, 205], [146, 205]]} /><Wire points={[[275, 104], [275, 205], [215, 205]]} /><Op x={146} y={187} width={69} text="read" />
    <Wire points={[[180, 223], [180, 260]]} /><ArrayRows x={106} y={260} width={148} rows={[["o₁₁", "o₁₂"], ["o₂₁", "o₂₂"], ["o₃₁", "o₃₂"], ["o₄₁", "o₄₂"]]} role="result" />
    <Text x={30} y={412}>Four returned rows, two value coordinates</Text>
  </Drawing>;
}

export function LongCausalDrawing({ crossMask = true, selfMask = true }) {
  return <Drawing name="causal-latents" height={430} label="Trailing latents anchored at three and four predict tokens four and five; both source and latent mixing paths require causal masks" caption={selfMask?"Cross-read cells restrict each source read. The interrupted gray path also blocks later-to-earlier latent mixing; both restrictions are needed.":"Cross-read cells restrict each source read, but the continuous gray later-to-earlier path can still carry forbidden information. This is a forward information leak, not loss credit."}>
    <Text x={12} y={22}>Inputs 0  1  2  3  4</Text><ArrayRows x={28} y={45} width={294} rows={[[0, 1, 2, 3, 4]]} />
    <Text x={12} y={110}>Cross-read allowed grid</Text>
    {[3, 4].map((anchor, row) => <g key={anchor}><Text x={12} y={151 + row * 32}>z{anchor}</Text>{[0, 1, 2, 3, 4].map(j => <g key={j}><rect x={62 + j * 49} y={129 + row * 32} width="49" height="32" fill={j <= anchor || !crossMask ? '#baa1e333' : 'none'} stroke={j <= anchor || !crossMask ? paint.result : paint.mask} /><Text x={86 + j * 49} y={151 + row * 32} anchor="middle">{j <= anchor || !crossMask ? '✓' : '×'}</Text></g>)}</g>)}
    <ArrayRows x={31} y={225} width={89} rows={[["z₃"]]} role="result" /><ArrayRows x={235} y={225} width={89} rows={[["z₄"]]} role="result" />
    {selfMask?<><line x1="280" y1="252" x2="280" y2="295" stroke={paint.mask}/><line x1="280" y1="295" x2="193" y2="295" stroke={paint.mask}/><Wire points={[[160,295],[76,295],[76,252]]}/><Text x={177} y={302} anchor="middle" role="mask">×</Text></>:<Wire points={[[280,252],[280,295],[76,295],[76,252]]}/> }
    <Text x={171} y={281} anchor="middle" role={selfMask ? 'mask' : 'ink'}>{selfMask ? 'later→earlier blocked' : 'later→earlier OPEN'}</Text>
    <Wire points={[[76, 252], [76, 337]]} /><Wire points={[[280, 252], [280, 337]]} />
    <ArrayRows x={27} y={337} width={99} rows={[["token 4"]]} role="result" /><ArrayRows x={230} y={337} width={99} rows={[["token 5"]]} role="result" />
    <Text x={15} y={409}>Leak: input 4 → z₄ → z₃ → token 4</Text>
  </Drawing>;
}

export function LongTrajectoryArchitectureDrawing() {
  return <Drawing name="trajectory-classifier" height={889} label="Forty-five measured rows become feature rows; four learned starting rows enter two residual-processing rounds, then their mean produces fifteen class logits and target-only cross entropy" caption="This is the four-latent case; the one-latent model starts with one row instead. Ellipses mean undisplayed feature coordinates and input rows. Fifteen logits are displayed in a three-by-five grid for readability, not as fifteen latent vectors.">
    <Text x={13} y={22}>45 supplied rows: x, y, ordinal tag</Text>
    <ArrayRows x={22} y={43} width={287} rows={[["x₁","y₁","tag₁"],["…","…","…"],["x₄₅","y₄₅","tag₄₅"]]}/>
    <Wire points={[[165,124],[165,154]]}/><Op x={88} y={154} width={154} text="3 → 24 affine"/>
    <Wire points={[[165,190],[165,223]]}/><ArrayRows x={22} y={223} width={287} rows={[["f₁₁","…","f₁₂₄"],["…","…","…"],["f₄₅₁","…","f₄₅₂₄"]]} role="result"/>
    <Text x={13} y={340} role="learned">4 learned initial rows × 24 features</Text>
    <ArrayRows x={204} y={364} width={126} rows={[["z₁₁","…"],["z₂₁","…"],["z₃₁","…"],["z₄₁","…"]]} role="learned"/>
    <Wire points={[[22,263],[8,263],[8,465],[36,465]]}/><Text x={15} y={394}>Retained</Text><Text x={15} y={415}>input bank</Text>
    <Op x={36} y={448} width={150} text="processing round"/>
    <Wire points={[[204,417],[175,417],[175,448]]}/>
    <Wire points={[[110,484],[110,524]]}/><Op x={36} y={524} width={150} text="same round again"/>
    <Wire points={[[8,465],[8,542],[36,542]]}/><Text x={206} y={521}>Shared parameters</Text><Text x={206} y={544}>New queries</Text>
    <Wire points={[[110,560],[110,590]]}/><Op x={43} y={590} width={133} text="mean 4 rows"/>
    <Wire points={[[110,626],[110,655]]}/><Op x={43} y={655} width={146} text="24 → 15 affine"/>
    <Wire points={[[110,691],[110,719]]}/>
    <ArrayRows x={21} y={719} width={293} rows={[["ℓ₁","ℓ₂","ℓ₃","ℓ₄","ℓ₅"],["ℓ₆","ℓ₇","ℓ₈","ℓ₉","ℓ₁₀"],["ℓ₁₁","ℓ₁₂","ℓ₁₃","ℓ₁₄","ℓ₁₅"]]} role="result"/>
    <Wire points={[[164,800],[164,833]]}/><Op x={76} y={833} width={174} text="cross-entropy loss"/>
    <Text x={266} y={838} role="input">label c</Text><Wire points={[[295,844],[295,851],[250,851]]}/>
  </Drawing>;
}

export function LongClassifierRoundDrawing(){
 return <Drawing name="classifier-round" height={1200} label="One complete latent processing round: normalize for cross attention and add update, normalize for self attention and add update, normalize for the 24 to 48 to 24 GELU feature network and add update" caption="All three bypasses carry the complete current latent array. Norms act per latent row. The arrays show representative feature coordinates; the expanded width is really twice the latent width. Repeat this circuit with the same parameters and the updated latents for round two.">
   <Text x={13} y={24}>Latent rows: K × 24 features</Text><ArrayRows x={97} y={46} width={211} rows={[["z₁₁","…","z₁₂₄"],["…","…","…"]]} role="result"/>
   <Text x={12} y={135}>Input bank</Text><ArrayRows x={12} y={155} width={85} rows={[["f₁","…"],["…","…"],["f₄₅","…"]]} role="result"/>
   <Wire points={[[203,100],[203,145]]}/><Op x={127} y={145} width={151} text="cross row norm"/>
   <Wire points={[[203,181],[203,216]]}/><Op x={127} y={216} width={151} text="cross-read"/><Wire points={[[97,196],[127,234]]}/>
   <Wire points={[[203,252],[203,286]]}/><Op x={176} y={286} width={54} text="⊕"/>
   <Wire points={[[308,73],[346,73],[346,304],[230,304]]}/>
   <Wire points={[[203,322],[203,365]]}/><Op x={127} y={365} width={151} text="self row norm"/>
   <Wire points={[[203,401],[203,444]]}/><Wire points={[[127,383],[111,383],[111,462],[127,462]]}/><Op x={127} y={444} width={151} text="self-read"/>
   <Text x={13} y={437}>same rows</Text>
   <Wire points={[[203,480],[203,515]]}/><Op x={176} y={515} width={54} text="⊕"/>
   <Wire points={[[203,342],[330,342],[330,533],[230,533]]}/>
   <Wire points={[[203,551],[203,595]]}/><Op x={127} y={595} width={151} text="feature row norm"/>
   <Wire points={[[203,631],[203,674]]}/><Op x={112} y={674} width={182} text="24 → 48 affine"/>
   <Wire points={[[203,710],[203,750]]}/><ArrayRows x={33} y={750} width={305} rows={[["h₁","h₂","…","h₄₇","h₄₈"]]} role="result"/>
   <Wire points={[[185,777],[185,814]]}/><Op x={117} y={814} width={136} text="GELU"/>
   <Wire points={[[185,850],[185,889]]}/><Op x={107} y={889} width={156} text="48 → 24 affine"/>
   <Wire points={[[185,925],[185,960]]}/><ArrayRows x={101} y={960} width={170} rows={[["δ₁","…","δ₂₄"]]} role="result"/>
   <Wire points={[[185,987],[185,1033]]}/><Op x={158} y={1033} width={54} text="⊕"/>
   <Wire points={[[203,573],[347,573],[347,1051],[212,1051]]}/>
   <Wire points={[[185,1069],[185,1113]]}/><ArrayRows x={75} y={1113} width={219} rows={[["z′₁₁","…","z′₁₂₄"],["…","…","…"]]} role="result"/>
   <Text x={13} y={1191}>Updated K × 24 rows → next round</Text>
 </Drawing>;
}

export function LongGriffinHybridDrawing(){
 return <Drawing name="griffin-hybrid" height={653} label="Two recurrent blocks followed by local attention: old influence travels through two state updates while a recent key-value bank supplies direct nearby attention" caption="The 1,024-token window is the paper’s setting, not the four-slot convolution stencil. State and recent K/V are separate storage. This schedule is the studied Griffin hybrid; the released model’s exact configuration remains its own contract.">
   <Text x={17} y={24}>Current token representation</Text><ArrayRows x={125} y={44} width={155} rows={[["x₁","…","xd"]]}/>
   <Text x={14} y={115}>Old state 1</Text><ArrayRows x={16} y={137} width={94} rows={[["h₁","…"]]} role="result"/>
   <Wire points={[[110,150],[153,150]]}/><Wire points={[[203,71],[203,132]]}/><Op x={153} y={132} width={188} text="recurrent block 1"/>
   <Wire points={[[153,161],[129,161],[129,223],[108,223]]}/><ArrayRows x={14} y={210} width={94} rows={[["h′₁","…"]]} role="result"/><Text x={14} y={267}>Store for next t</Text><Wire points={[[247,168],[247,212]]}/><ArrayRows x={170} y={212} width={155} rows={[["u₁","…","ud"]]} role="result"/>
   <Text x={14} y={292}>Old state 2</Text><ArrayRows x={16} y={314} width={94} rows={[["h₂","…"]]} role="result"/>
   <Wire points={[[110,327],[153,327]]}/><Wire points={[[247,239],[247,309]]}/><Op x={153} y={309} width={188} text="recurrent block 2"/>
   <Wire points={[[153,337],[128,337],[128,367],[108,367]]}/><ArrayRows x={14} y={354} width={94} rows={[["h′₂","…"]]} role="result"/><Wire points={[[247,345],[247,404]]}/><Op x={186} y={404} width={123} text="current query"/>
   <Text x={14} y={400}>Recent K/V</Text><ArrayRows x={14} y={418} width={126} rows={[["k(t−W+1)","v"],["…","…"],["k(t)","v"]]} role="result"/>
   <Wire points={[[140,458],[179,458],[179,539]]}/><Wire points={[[247,440],[247,539]]}/><Op x={138} y={539} width={186} text="local attention block"/>
   <Wire points={[[231,575],[231,608]]}/><Text x={231} y={636} anchor="middle" role="result">Output row, width d</Text>
 </Drawing>;
}

export function LongSplitDrawing() {
  return <Drawing name="data-roles" height={333} label="Exact duplicate groups select first rows before one retained dataset splits into fit, validation and test with separate jobs" caption="No exact coordinate row crosses roles. Missing performer/session identities prevent a new-performer conclusion.">
    <Text x={15} y={24}>360 source trajectories</Text><ArrayRows x={18} y={44} width={106} rows={[["path A"], ["copy A"], ["path B"], ["…"]]} />
    <Wire points={[[124, 87], [174, 87]]} /><Op x={174} y={69} width={166} text="first exact row" />
    <Text x={174} y={139}>330 distinct paths</Text><Wire points={[[340,87],[348,87],[348,173]]} />
    {[['220 fit', 'gradients'], ['50 validation', 'epoch selection'], ['60 test', 'frozen assessment']].map(([count, job], i) => <g key={count}><ArrayRows x={18} y={189 + i * 42} width={131} rows={[[count]]} role="result" /><Wire points={[[348,173],[348,202+i*42],[149,202+i*42]]} /><Text x={169} y={222 + i * 42}>{job}</Text></g>)}
  </Drawing>;
}

export function LongDetachDrawing() {
  return <div className="long-flow-three long-flow-two">{[true, false].map(detached => <Drawing key={String(detached)} name={`detach-${detached}`} width={300} height={362} label={detached ? 'Stored m equals six, forward y equals eighteen, detached gradient to current w equals six' : 'Connected creation adds another six, full gradient twelve'} caption={detached ? 'Current multiplication credits w by the stored value 6; the earlier creation route stops.' : 'Both appearances of w now receive credit: 6 + 6 = 12.'}>
    <Text x={18} y={23}>{detached ? 'Detached' : 'Connected'}</Text><ArrayRows x={18} y={49} width={75} rows={[["w=3"]]} role="learned" />
    <Wire points={[[93, 62], [149, 62]]} /><Op x={149} y={44} width={91} text="×2" /><Wire points={[[195, 80], [195, 122]]} /><ArrayRows x={149} y={122} width={91} rows={[["m=6"]]} role="result" />
    <Wire points={[[195, 149], [195, 194]]} /><Op x={144} y={194} width={102} text={detached ? 'detach' : 'keep graph'} /><Wire points={[[195, 230], [195, 267], [141, 267]]} />
    <Wire points={[[55, 76], [55, 267], [91, 267]]} /><Op x={91} y={249} width={50} text="×" /><Text x={149} y={308} role="result">y=18</Text>
    <Wire credit points={[[91, 284], [39, 284], [39, 82]]} />{!detached && <Wire credit points={[[259, 267], [259, 96], [240, 62]]} />}
    <Text x={18} y={347} role="credit">dy/dw = {detached ? 6 : 12}</Text>
  </Drawing>)}</div>;
}

export function LongAffineDrawing() {
  return <Drawing name="affine-composition" height={369} label="Three affine updates compose through either binary grouping into the same final slope .08 and offset 2.52" caption="A pair stores a slope and an offset, not a state value. Composition respects time order; associativity changes grouping, not that order.">
    <ArrayRows x={14} y={25} width={102} rows={[["A .5", "+1"]]} role="input" /><ArrayRows x={125} y={25} width={102} rows={[["B .4", "+2"]]} role="input" /><ArrayRows x={237} y={25} width={108} rows={[["C .4", "+1.56"]]} role="input" />
    <Wire points={[[65, 52], [65, 102]]} /><Wire points={[[176, 52], [176, 102], [167, 102]]} /><Op x={35} y={102} width={132} text="B∘A .2, 2.4" />
    <Wire points={[[101, 138], [101, 218]]} /><Wire points={[[291, 52], [291, 179], [210, 179], [210, 218]]} /><Op x={37} y={218} width={264} text="C∘(B∘A): .08h + 2.52" />
    <Text x={20} y={305}>C∘B: .16h + 2.36</Text><Text x={20} y={339}>(C∘B)∘A: .08h + 2.52</Text>
  </Drawing>;
}

export function LongPositionPolicyDrawing({ pair = 0, factor = 2, prefix = 3, position = 4 }) {
  const theta = pair ? .01 : 1, angle = position * theta / (position < prefix ? 1 : factor);
  const center = 178, y = 168, scale = 106, end = [center + scale * Math.cos(angle), y - scale * Math.sin(angle)];
  return <Drawing name="position-policy" height={418} label={`Rotary coordinate pair ${pair + 1} rotates a unit vector by ${angle} radians with an explicit prefix exception`} caption="The axes use equal coordinate scale. Cyan is the supplied unit vector; purple is its rotated endpoint. The dashed circle preserves length; the policy changes angle.">
    <Text x={18} y={23}>Pair {pair + 1}: θ={theta} radians / position</Text>
    <line x1="40" y1={y} x2="319" y2={y} stroke={paint.wire} /><line x1={center} y1="38" x2={center} y2="296" stroke={paint.wire} />
    <circle cx={center} cy={y} r={scale} fill="none" stroke={paint.mask} strokeDasharray="4 4" />
    <Wire points={[[center, y], [center + scale, y]]} /><circle cx={center + scale} cy={y} r="5" fill={paint.input} />
    <Wire points={[[center, y], end]} /><circle cx={end[0]} cy={end[1]} r="5" fill={paint.result} />
    <Text x={306} y={194}>a</Text><Text x={193} y={47}>b</Text><Text x={282} y={151} role="input">(1,0)</Text>
    <Text x={19} y={328}>n={position}; prefix threshold={prefix}</Text>
    <Text x={19} y={359}>Use {position < prefix ? 'unscaled nθ' : `nθ / factor ${number(factor)}`}</Text>
    <Text x={19} y={390} role="result">Angle {number(angle, 6)} radians</Text>
  </Drawing>;
}

export function LongSearchDrawing() {
  return <Drawing name="policy-search" height={511} label="Candidate frequency factors and prefix policies enter real-model evaluation, measured losses select parents, mutation and crossover make the next population" caption="The gray cycle proposes and selects policies. Data/model/tokenizer identities stay fixed during comparison; a separate held-out route assesses the chosen policy.">
    <Text x={15} y={24}>Candidate factor arrays + prefix</Text><ArrayRows x={34} y={47} width={260} rows={[["f₁", "f₂", "prefix"], ["f′₁", "f′₂", "prefix′"], ["…", "…", "…"]]} role="learned" />
    <Wire points={[[164, 128], [164, 183]]} /><Op x={67} y={183} width={197} text="fixed model / token loss" />
    <Text x={12} y={162}>fixed records</Text>
    <Wire points={[[164, 219], [164, 255]]} /><ArrayRows x={56} y={255} width={218} rows={[["candidate", "measured loss"], ["A", "ℓA"], ["B", "ℓB"]]} role="result" />
    <Wire points={[[164, 336], [164, 373]]} /><Op x={93} y={373} width={142} text="keep best parents" />
    <Wire points={[[164, 409], [164, 439]]} /><Op x={64} y={439} width={200} text="mutate / cross factors" />
    <Wire points={[[64, 457], [4, 457], [4, 87], [34, 87]]} /><Text x={14} y={500}>Chosen policy → separate held-out assessment</Text>
  </Drawing>;
}

export function LongSoftmaxDrawing() {
  return <Drawing name="softmax-circuit" height={480} label="Three scores exponentiate to two, one and three; each support forks to a shared sum and its own numerator, then each divides by total six" caption="Each division has two real inputs: its own exp(score) and the shared total. A mask removes a branch from the total before normalization.">
    <Text x={15} y={22}>Scores → positive supports → shares</Text>
    {[["ln2", 2], [0, 1], ["ln3", 3]].map(([score, support], i) => <g key={i}>
      <ArrayRows x={14} y={48 + i * 107} width={70} rows={[[score]]} />
      <Wire points={[[84, 62 + i * 107], [105, 62 + i * 107]]} /><Op x={105} y={44 + i * 107} width={53} text="exp" />
      <Wire points={[[158, 62 + i * 107], [179, 62 + i * 107]]} /><ArrayRows x={179} y={48 + i * 107} width={56} rows={[[support]]} role="result" />
      <Wire points={[[207, 75 + i * 107], [207, 96 + i * 107], [280, 96 + i * 107]]} /><Op x={280} y={78 + i * 107} width={62} text="÷6" />
      <Text x={280} y={142 + i * 107} role="result">{support}/6</Text>
      <Wire points={[[179, 61 + i * 107], [169, 61 + i * 107], [169, 386], [195, 386]]} />
    </g>)}
    <Op x={195} y={368} width={67} text="Σ = 6" />
    <Wire points={[[262, 386], [356, 386], [356, 92], [342, 92]]} />
    <Wire points={[[356, 199], [342, 199]]} /><Wire points={[[356, 306], [342, 306]]} />
    <Text x={16} y={457}>The same denominator reaches every division</Text>
  </Drawing>;
}

export function LongResidualBlockDrawing() {
  return <Drawing name="residual-block" height={551} label="Current rows pass through attention then a feature-wise nonlinear network, each with a full representation bypass and normalization" caption="This cutaway makes a four-feature row expand to eight hidden features and return to four. The expansion is a hand illustration; use the actual model’s feed-forward width in code.">
    <Text x={21} y={23}>Current input row: width4</Text><ArrayRows x={73} y={43} width={208} rows={[["x₁", "x₂", "x₃", "x₄"]]} />
    <Wire points={[[177, 70], [177, 104]]} /><Op x={110} y={104} width={137} text="attention update" />
    <Wire points={[[177, 140], [177, 169]]} /><Op x={151} y={169} width={53} text="⊕" />
    <Wire points={[[73, 55], [26, 55], [26, 187], [151, 187]]} /><Wire points={[[177, 205], [177, 234]]} /><Op x={114} y={234} width={125} text="normalize row" />
    <Wire points={[[177, 270], [177, 305]]} /><ArrayRows x={58} y={305} width={240} rows={[["h₁", "h₂", "h₃", "h₄", "h₅", "h₆", "h₇", "h₈"]]} role="result" />
    <Text x={12} y={358}>affine 4→8</Text><Text x={218} y={358}>activation</Text><Wire points={[[177, 332], [177, 382]]} />
    <ArrayRows x={82} y={382} width={190} rows={[["δ₁", "δ₂", "δ₃", "δ₄"]]} role="result" /><Text x={12} y={441}>affine 8→4</Text>
    <Wire points={[[177, 409], [177, 464]]} /><Op x={151} y={464} width={53} text="⊕" />
    <Wire points={[[239, 251], [336, 251], [336, 482], [204, 482]]} /><Text x={22} y={536}>normalize → next current-layer row</Text>
  </Drawing>;
}

export function LongBudgetArraysDrawing() {
  const panels = [['Dense grid', 4096, 4096, '16,777,216'], ['One segment', 384, 256, '×16 segments'], ['One latent read', 4096, 32, '131,072 cells']];
  return <div className="long-flow-three">{panels.map(([name, keys, queries, count]) => <Drawing key={name} name={`budget-${name.toLowerCase().replaceAll(" ","-")}`} width={280} height={322} label={`${name}: ${queries} query rows and ${keys} donor columns on the same scale`} caption={name === 'One segment' ? 'Rectangular upper count, including masked slots. Memory 128 plus current 256 makes 384 donors.' : name === 'One latent read' ? 'The 32 query rows are visibly shorter than the 4096-row dense grid. Deep latent work adds its own 32×32 grids.' : 'Every supplied row asks about every donor before a causal mask restricts legal edges.'}>
    <Text x={15} y={23}>{name}</Text><Text x={15} y={51}>{keys} donor columns</Text>
    <rect x="25" y="74" width={220 * keys / 4096} height={220 * queries / 4096} fill="#baa1e322" stroke={paint.result} />
    <Text x={25} y={queries === 4096 ? 313 : 124}>{queries} queries; {count}</Text>
  </Drawing>)}</div>;
}

export function LongAdaptationWorkflowDrawing(){
 return <Drawing name="adaptation-roles" height={555} label="Short examples use original position rules and long examples use selected extended rules; both enter adaptation, while validation and final assessments use separate records" caption="This depicts a training/evaluation protocol, not an experiment executed here. The selected policy is fixed while the model is adapted. The later short and long assessments use records that did not supply the update or choose the policy.">
   <Text x={13} y={24}>Short examples</Text><Text x={203} y={24}>Long examples</Text>
   <ArrayRows x={15} y={45} width={145} rows={[["tokens A"],["original angles"]]}/><ArrayRows x={200} y={45} width={145} rows={[["tokens B"],["selected factors"]]}/>
   <Wire points={[[87,99],[87,145],[147,145],[147,180]]}/><Wire points={[[272,99],[272,145],[213,145],[213,180]]}/><Op x={100} y={180} width={160} text="same model forward"/>
   <Wire points={[[180,216],[180,252]]}/><Op x={95} y={252} width={190} text="eligible token loss"/><Text x={15} y={261} role="input">targets</Text><Wire points={[[77,256],[77,270],[95,270]]}/>
   <Wire credit points={[[180,288],[180,327]]}/><ArrayRows x={61} y={327} width={238} rows={[["updated model parameters"]]} role="learned"/>
   <Text x={14} y={395}>Separate validation</Text><Text x={14} y={416}>chooses settings</Text><Wire points={[[180,354],[180,425]]}/>
   <Op x={84} y={425} width={193} text="freeze chosen checkpoint"/>
   <Wire points={[[180,461],[180,496],[90,496],[90,519]]}/><Wire points={[[180,496],[274,496],[274,519]]}/><Text x={90} y={545} anchor="middle" role="result">short assessment</Text><Text x={274} y={545} anchor="middle" role="result">long assessment</Text>
 </Drawing>;
}
export function LongDocumentMaskDrawing(){
 return <Drawing name="document-mask" height={352} label="Four packed positions belong to documents A and B; each row can consult only earlier positions in its own document" caption="Purple cells are permitted reads; crossed gray cells are forbidden. B0 cannot read A1 even though A1 occurs earlier in storage. The document boundary changes legality, not the factual contents of the two documents.">
   <Text x={16} y={22}>Donors: A0, A1 | B0, B1</Text>
   {['A0','A1','B0','B1'].map((label,i)=><g key={label}><Text x={15} y={91+i*47}>query {label}</Text>{[0,1,2,3].map(j=>{const allowed=j<=i&&Math.floor(j/2)===Math.floor(i/2);return <g key={j}><rect x={116+j*52} y={63+i*47} width="52" height="47" stroke={allowed?paint.result:paint.mask} fill={allowed?'#baa1e333':'none'}/><Text x={142+j*52} y={91+i*47} anchor="middle" role={allowed?'result':'mask'}>{allowed?'✓':'×'}</Text></g>})}</g>)}
   <Text x={15} y={309}>Different document OR future → exclude</Text>
   <Text x={15} y={339}>This is a permission grid, not weights</Text>
 </Drawing>;
}
