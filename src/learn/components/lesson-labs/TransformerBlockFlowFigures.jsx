import { useId } from 'react';
import { flowNumber as number } from './LessonFlow.jsx';
import { blockDefault, feedforwardTrace } from '../../data/transformer-block-models.js';
import { layerNorm, mean } from '../../data/sequence-tensor-operations.js';

export const blockColors = { input: '#77cddb', parameter: '#e4b752', computed: '#be9cf5', operation: '#e8e6df', edge: '#99978f', backward: '#eda064' };
export const blockVector = values => `[${values.map(v => number(v, 5)).join(', ')}]`;

export function BlockArray({ label, values, role = 'computed', rows, columns, digits = 4 }) {
  const matrix = Array.isArray(values[0]) ? values : [values];
  return <div className="block-flow-array" style={{ '--block-role': blockColors[role] }}>
    <span className="block-array-label">{label}</span>
    <div className="block-array-scroll" tabIndex={0} role="region" aria-label={label}>
      <table><thead><tr><th aria-label="row" />{matrix[0].map((_, i) => <th key={i}>{columns?.[i] ?? `feature ${i + 1}`}</th>)}</tr></thead>
        <tbody>{matrix.map((row, i) => <tr key={i}><th>{rows?.[i] ?? `position ${i + 1}`}</th>{row.map((v, j) => <td key={j} data-sign={typeof v === 'number' ? Math.sign(v) : 0}>{typeof v === 'number' ? number(v, digits) : v}</td>)}</tr>)}</tbody></table>
    </div>
  </div>;
}
export function BlockFeatureRow({ label, values, coordinate = 'feature', role = 'computed' }) {
  return <div className="block-flow-array" style={{ '--block-role': blockColors[role] }}><span className="block-array-label">{label}</span><div className="block-feature-row" role="list" aria-label={label}>{values.map((value,i)=><div key={i} role="listitem" data-sign={Math.sign(value)}><span>{coordinate} {i+1}</span><strong>{number(value,4)}</strong></div>)}</div></div>;
}
function Drawing({ label, children, height = 300, width = 760 }) {
  const id = useId();
  return <figure className="block-flow-drawing"><div className="block-drawing-scroll" tabIndex={0} role="region" aria-label={label}><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={id}><title id={id}>{label}</title>{children}</svg></div></figure>;
}
function Text({ x, y, children, color = blockColors.operation, size = 15, anchor = 'middle' }) {
  return <text x={x} y={y} textAnchor={anchor} fill={color} fontSize={size}>{children}</text>;
}
function Arrow({ x1, y1, x2, y2, backward = false }) {
  const angle = Math.atan2(y2 - y1, x2 - x1), r = 7;
  return <g stroke={backward ? blockColors.backward : blockColors.edge} fill={backward ? blockColors.backward : blockColors.edge}>
    <line x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={backward ? '5 4' : undefined} />
    <polygon points={`${x2},${y2} ${x2 - r * Math.cos(angle - .45)},${y2 - r * Math.sin(angle - .45)} ${x2 - r * Math.cos(angle + .45)},${y2 - r * Math.sin(angle + .45)}`} />
  </g>;
}
function Cells({ x, y, values, role = 'computed', width = 66, height = 40, digits = 3, label }) {
  const matrix = Array.isArray(values[0]) ? values : [values];
  return <g>{label && <Text x={x + matrix[0].length * width / 2} y={y - 14} color={blockColors[role]}>{label}</Text>}{matrix.map((row, i) => row.map((v, j) => <g key={`${i}-${j}`}>
    <rect x={x + j * width} y={y + i * height} width={width} height={height} stroke={blockColors[role]} fill={typeof v === 'number' && v > 0 ? '#e4b75220' : typeof v === 'number' && v < 0 ? '#77cddb20' : 'none'} />
    <Text x={x + (j + .5) * width} y={y + i * height + 26}>{typeof v === 'number' ? number(v, digits) : v}</Text>
  </g>))}</g>;
}
function Operation({ x, y, label, width = 116 }) {
  return <g><rect x={x - width / 2} y={y - 19} width={width} height={38} rx={14} fill="none" stroke={blockColors.operation} /><Text x={x} y={y + 5}>{label}</Text></g>;
}
function Plus({ x, y }) { return <g><circle cx={x} cy={y} r={14} fill="none" stroke={blockColors.operation} /><Text x={x} y={y + 5}>+</Text></g>; }

export function BlockWorkspaceDrawing() {
  return <Drawing label="Two movement points become rows of a four-feature workspace; row and column axes are labelled" height={390}>
    <Cells x={22} y={55} values={[[.75, .5], [.25, 1]]} role="input" label="Points (x, y)" />
    <Arrow x1={165} y1={95} x2={236} y2={95} />
    <Cells x={252} y={55} values={[[-.8, 3.2, 6.4, 12], [3.2, -.8, .4, -2]]} role="parameter" width={58} label="Illustrative learned stem W" />
    <Text x={368} y={163}>2 coordinates × 4 features; bias zero</Text>
    <Arrow x1={368} y1={181} x2={368} y2={229} />
    <Cells x={252} y={255} values={[[1, 2, 5, 8], [3, 0, 2, 1]]} label="Example workspace X" />
    <Text x={124} y={280}>positions ↓</Text><Arrow x1={198} y1={267} x2={198} y2={324} />
    <Text x={607} y={282}>features →</Text>
    <Text x={380} y={371}>Each point × this stem gives one feature row; this is not the fitted movement model.</Text>
  </Drawing>;
}

export function BlockCommunicationDrawing() {
  return <Drawing label="Attention sends projected values between positions; a shared local feedforward map writes each row's update" height={610}>
    <Cells x={24} y={70} values={[[1, 2, 5, 8], [3, 0, 2, 1]]} role="input" label="X: two positions, four features" width={57} />
    <Text x={410} y={36}>Communication across rows</Text>
    {[0, 1].map(i => <g key={i}><Arrow x1={262} y1={90 + i * 40} x2={367} y2={90 + i * 40} /><Arrow x1={262} y1={90 + i * 40} x2={367} y2={130 - i * 40} /></g>)}
    <Cells x={382} y={70} values={[['z₁','z₂','z₃','z₄'],['r₁','r₂','r₃','r₄']]} label="Context Z: saved row + attention update" width={80} />
    <Arrow x1={450} y1={160} x2={450} y2={216} />
    <Cells x={265} y={252} values={blockDefault().up} role="parameter" width={42} height={32} label="Shared up: 4 × 3" />
    <Arrow x1={397} y1={316} x2={434} y2={316} /><Operation x={491} y={316} label="ReLU" width={96} />
    <Arrow x1={545} y1={316} x2={582} y2={316} /><Cells x={592} y={268} values={blockDefault().down} role="parameter" width={36} height={32} label="Shared down: 3 × 4" />
    <Text x={131} y={272}>The same maps</Text><Text x={131} y={296}>act on each</Text><Text x={131} y={320}>contextual row.</Text>
    <Arrow x1={664} y1={374} x2={664} y2={412}/><Cells x={399} y={449} values={['u₁','u₂','u₃','u₄']} width={64} label="FFN's four-feature written update"/>
    <path d="M382 90 H20 V516 H348" fill="none" stroke={blockColors.edge}/><Text x={174} y={503}>saved first contextual row Z</Text><Plus x={365} y={516}/><Arrow x1={532} y1={495} x2={386} y2={516}/><Arrow x1={365} y1={534} x2={365} y2={555}/>
    <Cells x={219} y={562} values={['z₁+u₁','z₂+u₂','z₃+u₃','z₄+u₄']} width={88} height={36}/>
    <Text x={380} y={417}>Local feature processing → update; original context returns at +</Text>
  </Drawing>;
}

export function BlockStackDrawing() {
  return <Drawing label="Compatible representation widths allow independently learned blocks to form a stack and task readout" height={245}>
    {[22, 255, 488].map((x, i) => <g key={x}><Cells x={x} y={80} values={i === 0 ? [[1, 2, 5, 8], [3, 0, 2, 1]] : [[`a${i}`, `b${i}`, `c${i}`, `d${i}`], [`e${i}`, `f${i}`, `g${i}`, `h${i}`]]} role={i ? 'computed' : 'input'} width={40} height={36} label={i ? `After block ${i}` : 'Input: L × d'} />{i < 2 && <><Arrow x1={x + 170} y1={115} x2={x + 223} y2={115} /><Text x={x + 194} y={172}>block {i + 1}</Text></>}</g>)}
    <Text x={380} y={221}>Same outer shape. Each block learns its own parameters; a task adds a readout.</Text>
  </Drawing>;
}

export function BlockPlacementDrawing({ pre, trace, input, branch = 1 }) {
  const rows = [input, trace.attentionInput, trace.update, trace.context, trace.ffnInput, trace.ffnUpdate, trace.output];
  const labels = ['Saved input X', 'Attention reads H_attn', `Attention update × ${number(branch)}`, 'Carried state Z', 'FFN reads G', `FFN update × ${number(branch)}`, 'Final Y'];
  return <Drawing label={`${pre ? 'Pre' : 'Post'}-norm actual branch and bypass routes for one selected position`} height={710} width={670}>
    {rows.map((values, i) => <g key={i}><Cells x={270} y={38 + i * 92} values={values} width={88} height={38} digits={4} label={labels[i]} role={i === 0 ? 'input' : 'computed'} />{i < 6 && <Arrow x1={446} y1={82 + i * 92} x2={446} y2={104 + i * 92} />}</g>)}
    <path d="M270 57 H52 V333 H250" fill="none" stroke={blockColors.edge} /><Arrow x1={235} y1={333} x2={258} y2={333} /><Text x={87} y={189} anchor="start">saved X</Text>
    <path d="M270 333 H91 V609 H250" fill="none" stroke={blockColors.edge} /><Arrow x1={235} y1={609} x2={258} y2={609} /><Text x={102} y={487} anchor="start">saved Z</Text>
    <Text x={93} y={78} anchor="start">{pre ? 'Norm₁ in branch' : 'Raw input to branch'}</Text>
    <Text x={93} y={354} anchor="start">{pre ? 'X + update' : 'X + update → Norm₁'}</Text>
    <Text x={93} y={420} anchor="start">{pre ? 'Norm₂ in branch' : 'Z directly to branch'}</Text>
    <Text x={93} y={630} anchor="start">{pre ? 'Z + update' : 'Z + update → Norm₂'}</Text>
    <Text x={300} y={686}>{pre ? 'Pre-norm' : 'Post-norm'} · gains 1 · offsets 0 · ε = 0.00001</Text>
  </Drawing>;
}

export function BlockNormalizerDrawing({ input, epsilon = 1e-5 }) {
  const m = mean(input), centered = input.map(x => x - m), v = mean(centered.map(x => x * x)), raw = mean(input.map(x => x * x));
  const ln = layerNorm(input, [], [], epsilon), rms = input.map(x => x / Math.sqrt(raw + epsilon));
  return <div><BlockReferenceRulers input={input} /><div className="block-flow-pair">
    <div><BlockArray label={`LayerNorm: raw input; mean ${number(m)}`} values={input} role="input" /><BlockArray label="Subtract this row's mean" values={centered} /><BlockArray label="Squared distances from the mean" values={centered.map(x => x * x)} /><p className="block-operation-label">Average {number(v)} → square root of {number(v)} + ε → divide by {number(Math.sqrt(v + epsilon))}</p><BlockArray label="Centered and rescaled; gains 1, offsets 0" values={ln} /></div>
    <div><BlockArray label="RMSNorm: same raw input, reference zero" values={input} role="input" /><BlockArray label="Squared distances from zero" values={input.map(x => x * x)} /><p className="block-operation-label">Average {number(raw)} → square root of {number(raw)} + ε → divide by {number(Math.sqrt(raw + epsilon))}</p><BlockArray label="Rescaled without centering; gains 1" values={rms} /></div>
  </div></div>;
}
function BlockReferenceRulers({ input }) {
  const center = mean(input), lo = Math.min(0, ...input) - 1, hi = Math.max(0, ...input) + 1;
  return <Drawing label="The same features measured from their mean in LayerNorm and from zero in RMSNorm" height={315}>
    {[['LayerNorm: reference mean', center], ['RMSNorm: reference zero', 0]].map(([label, reference], panel) => {
      const start = 68 + panel * 380, x = value => start + 230 * (value - lo) / (hi - lo);
      return <g key={label}><Text x={start + 115} y={27}>{label}</Text><Text x={start + 115} y={53}>reference = {number(reference, 4)}</Text>
        <line x1={x(reference)} x2={x(reference)} y1={77} y2={259} stroke={blockColors.edge} strokeDasharray="4 4" />
        {input.map((value, i) => <g key={i}><Text x={start - 18} y={99 + i * 51} anchor="end">x{i + 1}</Text><line x1={start} x2={start + 230} y1={94 + i * 51} y2={94 + i * 51} stroke={blockColors.edge} />
          <line x1={x(reference)} x2={x(value)} y1={94 + i * 51} y2={94 + i * 51} stroke={blockColors.computed} strokeWidth={4} />
          <circle cx={x(value)} cy={94 + i * 51} r={5} fill={blockColors.input} /><Text x={x(value)} y={80 + i * 51} color={blockColors.input}>{number(value, 3)}</Text>
        </g>)}<Text x={start + 115} y={299} size={13}>Violet = distance from reference</Text></g>;
    })}
  </Drawing>;
}
export function BlockAxisDrawing() {
  return <Drawing label="Feature normalization is independent at each batch and position; reducing across time would mix future records" height={285}>
    <Cells x={76} y={65} values={[[1, 2, 5, 8], [3, 0, 2, 1]]} role="input" width={70} label="One sequence X; N indexes separate sequences" />
    {[0, 1].map(i => <g key={i}><Arrow x1={371} y1={85 + 40 * i} x2={438} y2={85 + 75 * i} /><Operation x={511} y={85 + 75 * i} label={`Norm row ${i + 1}`} /><Arrow x1={576} y1={85 + 75 * i} x2={633} y2={85 + 75 * i} /></g>)}
    <Text x={250} y={187}>Reduce horizontally over d features.</Text><Text x={460} y={253}>No edge connects another position's statistics.</Text>
  </Drawing>;
}

export function BlockFeedforwardDrawing({ input, up = blockDefault().up, down = blockDefault().down, activation = 'relu' }) {
  const trace = feedforwardTrace(input, up, down, activation);
  return <div className="block-feature-circuit">
    <BlockArray label="Direct input row x" values={input} role="input" />
    <BlockArray label="Learned up map W_up: each column is one detector" values={up} role="parameter" rows={['input 1', 'input 2', 'input 3', 'input 4']} columns={['detector 1', 'detector 2', 'detector 3']} />
    <BlockArray label="Coordinate products for each detector; sum down each column" values={up.map((row, i) => row.map(w => w * input[i]))} rows={['input 1','input 2','input 3','input 4']} columns={['detector 1', 'detector 2', 'detector 3']} />
    <BlockArray label="Sum → three responses before activation" values={trace.responses} columns={['hidden 1', 'hidden 2', 'hidden 3']} />
    <p className="block-operation-label">{activation.toUpperCase()} acts independently on each response ↓</p>
    <BlockArray label="Activated hidden responses h" values={trace.hidden} columns={['hidden 1', 'hidden 2', 'hidden 3']} />
    <BlockArray label="Learned down map W_down: each row is a write direction" values={down} role="parameter" rows={['write 1', 'write 2', 'write 3']} />
    <BlockArray label="Multiply each write row by its hidden response" values={trace.contributions} rows={['h₁ × write 1', 'h₂ × write 2', 'h₃ × write 3']} />
    <BlockArray label="Sum contributions down each column → four-feature update" values={trace.output} />
  </div>;
}
export function BlockGateDrawing({ trace, input, up, gate, down }) {
  return <div><BlockArray label="One input feeds both projections" values={input} role="input" />
    <div className="block-flow-pair"><div><BlockArray label="Up map W_up" values={up} role="parameter" rows={['input 1','input 2','input 3','input 4']} columns={['hidden 1', 'hidden 2', 'hidden 3']} /><BlockArray label="Value responses u = x W_up" values={trace.value} columns={['hidden 1', 'hidden 2', 'hidden 3']} /></div><div><BlockArray label="Gate map W_gate" values={gate} role="parameter" rows={['input 1','input 2','input 3','input 4']} columns={['hidden 1', 'hidden 2', 'hidden 3']} /><BlockArray label="Gate responses g = x W_gate" values={trace.gateLogits} columns={['hidden 1', 'hidden 2', 'hidden 3']} /><BlockArray label="SiLU(g) = g × sigmoid(g)" values={trace.gateResponse} columns={['hidden 1', 'hidden 2', 'hidden 3']} /></div></div>
    <BlockArray label="Coordinatewise product u × SiLU(g)" values={trace.hidden} columns={['hidden 1', 'hidden 2', 'hidden 3']} /><BlockArray label="Down-map write rows" values={down} role="parameter" rows={['write 1', 'write 2', 'write 3']} /><BlockArray label="Weighted writes" values={trace.contributions} rows={['write 1', 'write 2', 'write 3']} /><BlockArray label="Sum of writes → update" values={trace.output} />
  </div>;
}
export function BlockMovementArchitectureDrawing() {
  return <Drawing label="Retained movement architecture: center coordinates, project with bias, apply two blocks, normalize, valid-pool and classify" width={760} height={785}>
    <Cells x={48} y={48} values={[[.75,.5,-1],[.25,1,1]]} role="input" width={66} label="Example (x,y,time)"/><Text x={464} y={75}>45 observed records in the model</Text>
    <Arrow x1={150} y1={135} x2={150} y2={165}/><Text x={401} y={152}>Fixed transformation: (2x−1, 2y−1, time)</Text>
    <Cells x={48} y={197} values={[[.5,0,-1],[-.5,1,1]]} role="computed" width={66} label="Scaled (2x−1,2y−1,time)"/>
    <Arrow x1={150} y1={287} x2={150} y2={328}/>
    <Cells x={40} y={364} values={Array.from({length:3},(_,i)=>Array.from({length:12},()=>`w${i+1}`))} role="parameter" width={34} height={30} label="Stem W: 3 × 24 (12 columns shown)"/>
    <Cells x={489} y={268} values={Array(6).fill('b')} role="parameter" width={34} height={30} label="Stem bias: 6 of 24 features"/><Arrow x1={591} y1={309} x2={494} y2={386}/>
    <Arrow x1={463} y1={406} x2={478} y2={406}/><Plus x={494} y={406}/><Arrow x1={510} y1={406} x2={522} y2={406}/>
    <Cells x={530} y={364} values={[Array(6).fill('h'),Array(6).fill('h')]} width={32} height={30} label="2/45 rows × 6/24 features"/>
    <Arrow x1={626} y1={436} x2={626} y2={484}/><Operation x={626} y={511} label="Block 1"/><Arrow x1={564} y1={511} x2={418} y2={511}/><Operation x={352} y={511} label="Block 2"/>
    <Arrow x1={285} y1={511} x2={177} y2={511}/><Operation x={108} y={511} label="Final LN"/><Arrow x1={108} y1={537} x2={108} y2={596}/>
    <Cells x={90} y={632} values={Array(6).fill('p')} width={32} label="Valid-row mean: 6 of 24 features"/>
    <Arrow x1={291} y1={652} x2={365} y2={652}/><Text x={386} y={590} color={blockColors.parameter}>24 × 15 head + bias</Text>
    <Cells x={387} y={632} values={Array(8).fill('ℓ')} width={34} label="15 class logits (8 shown)"/>
    <Text x={380} y={747}>Separate block weights · final norm in both placements · softmax for inspection</Text>
  </Drawing>;
}

export function BlockProbeDrawing({ input, probe, gradient, scalar }) {
  const normalized = layerNorm(input, [], [], 1e-5);
  return <Drawing label="A probe multiplies four normalized features, sums a scalar, and sends sensitivities backwards" width={650} height={370}>
    <Cells x={126} y={43} values={input} role="input" width={96} label="Input x" />
    <Arrow x1={318} y1={89} x2={318} y2={122} /><Text x={429} y={111}>LayerNorm, ε = 10⁻⁵</Text>
    <Cells x={126} y={153} values={normalized} width={96} digits={4} label="Normalized features" />
    <Cells x={126} y={224} values={probe} role="input" width={96} label="Chosen probe p: fixed diagnostic, multiply coordinatewise" />
    <Text x={318} y={310}>Sum weighted coordinates → scalar {number(scalar)}</Text>
    <Arrow x1={64} y1={288} x2={64} y2={63} backward /><Text x={69} y={349} anchor="start" color={blockColors.backward}>Input derivative Jᵀp = {blockVector(gradient)}</Text>
  </Drawing>;
}
export function BlockGradientDirectionsDrawing() {
  return <Drawing label="LayerNorm removes common-offset sensitivity, almost removes radial sensitivity, and rescales perpendicular contrasts" height={375}>
    <Cells x={24} y={59} values={[-3, -2, 1, 4]} role="input" width={60} label="Centered input c" />
    {[['Common offset', [1, 1, 1, 1], '0'], ['Radial direction', [-3, -2, 1, 4], 'ε / s³ × c'], ['Perpendicular contrast', [3, -4, 1, 0], '(1 / s) × direction']].map(([label, values, output], i) => <g key={label}>
      <Cells x={30} y={149 + 70 * i} values={values} role="input" width={60} height={32} label={label} />
      <Arrow x1={279} y1={165 + 70 * i} x2={370} y2={165 + 70 * i} /><Text x={316} y={150 + 70 * i}>J acts</Text>
      <Text x={541} y={170 + 70 * i} color={blockColors.backward}>{output}</Text>
    </g>)}
    <Text x={531} y={71}>s = √(mean(c²) + ε); gains 1</Text>
  </Drawing>;
}
export function BlockDerivativeRoutesDrawing() {
  return <Drawing label="Pre-norm has an identity derivative route; post-norm applies the same normalizer derivative to both incoming routes" height={270}>
    <Text x={178} y={35}>Pre-norm local residual</Text><Text x={570} y={35}>Post-norm local residual</Text>
    {[60, 450].map((x, i) => <g key={x}><Cells x={x} y={85} values={['x₁', 'x₂']} role="input" width={48} /><Operation x={x + 174} y={104} label={i ? 'F' : 'Norm → F'} /><Arrow x1={x + 105} y1={104} x2={x + 108} y2={104} /><Plus x={x + 174} y={189} /><Arrow x1={x + 174} y1={128} x2={x + 174} y2={174} /><path d={`M${x + 48} 125 V189 H${x + 160}`} stroke={blockColors.edge} fill="none" />{i ? <><Arrow x1={x + 174} y1={205} x2={x + 174} y2={230} /><Text x={x + 174} y={250}>Norm acts on both routes</Text></> : <Text x={x + 120} y={250} color={blockColors.backward}>Identity + branch derivative</Text>}</g>)}
  </Drawing>;
}
export function BlockVarianceDrawing() {
  const signs = [-1, -1, 1, 1];
  return <div className="block-flow-pair"><div><BlockArray label="Across examples: one unit-variance update z" values={signs} rows={['examples']} columns={['example 1', 'example 2', 'example 3', 'example 4']} role="input" /><BlockArray label="Same update eight times: 8z; population variance 64" values={signs.map(x => 8 * x)} rows={['sum']} columns={['example 1', 'example 2', 'example 3', 'example 4']} /></div><div><BlockArray label="Two independent unit-variance updates: all four combinations" values={[[-1, -1], [-1, 1], [1, -1], [1, 1]]} role="input" rows={['example 1', 'example 2', 'example 3', 'example 4']} columns={['update 1', 'update 2']} /><BlockArray label="Their sum: population variance 2; eight independent updates give 8" values={[-2, 0, 0, 2]} rows={['sum']} columns={['example 1', 'example 2', 'example 3', 'example 4']} /></div></div>;
}

export function BlockTaskDrawing() {
  return <Drawing label="Encoder and decoder representations join at cross-attention; prediction targets stay on a separate loss branch" height={820}>
    <Cells x={20} y={58} values={['source A','source B','PAD']} role="input" width={100} label="Encoder input positions"/><Cells x={433} y={58} values={[[1,1,'×'],[1,1,'×'],[1,1,'×']]} width={58} height={34} label="Encoder key validity: PAD never read"/>
    <Arrow x1={171} y1={109} x2={171} y2={147}/><Operation x={171} y={176} label="Encoder"/>
    <path d="M520 172 V211 H264 V176" stroke={blockColors.edge} fill="none"/><Arrow x1={264} y1={176} x2={236} y2={176}/><Text x={485} y={238}>Validity permits reads</Text>
    <Arrow x1={171} y1={201} x2={171} y2={241}/><Cells x={20} y={275} values={['e_A','e_B','e_PAD']} width={90} label="Actual encoder representations"/>
    <Text x={145} y={365}>All 3 output rows retained</Text>
    <Cells x={385} y={290} values={['BOS','a','b']} role="input" width={100} label="Decoder input: shifted one step"/><Cells x={385} y={400} values={[[1,'×','×'],[1,1,'×'],[1,1,1]]} width={58} height={34} label="Causal self-attention: diagonal allowed"/>
    <Arrow x1={696} y1={310} x2={684} y2={380}/><Operation x={684} y={410} label="Decoder block" width={136}/>
    <Arrow x1={574} y1={451} x2={612} y2={430}/><Text x={502} y={550}>Mask permits reads</Text><Arrow x1={684} y1={436} x2={664} y2={564}/><Cells x={494} y={600} values={['d₁','d₂','d₃']} width={68} label="Actual decoder representations"/>
    <path d="M290 295 H300 V566 H281" stroke={blockColors.edge} fill="none"/><Arrow x1={281} y1={566} x2={281} y2={593}/><Text x={220} y={450}>Encoder → K, V</Text><Arrow x1={482} y1={620} x2={374} y2={620}/><Text x={417} y={589}>Decoder → Q</Text><Operation x={298} y={620} label="Cross-attention" width={146}/>
    <Cells x={30} y={510} values={[1,1,'×']} width={70} height={32} label="Cross keys: PAD forbidden"/><Arrow x1={249} y1={526} x2={254} y2={593}/>
    <Arrow x1={298} y1={645} x2={298} y2={677}/><Text x={298} y={693}>Next-token head</Text><Cells x={212} y={730} values={['ℓa','ℓb','ℓc']} width={56} height={32}/><Arrow x1={390} y1={746} x2={409} y2={746}/><Operation x={456} y={746} label="Loss" width={80}/><Cells x={556} y={730} values={['a','b','c']} role="input" width={56} height={32} label="Targets for loss only"/><Arrow x1={544} y1={746} x2={507} y2={746}/>
    <Text x={380} y={808}>× = forbidden; mask rows receive, columns donate.</Text>
  </Drawing>;
}
export function BlockCopyDrawing() {
  const tokens = ['BOS', ...'abcdefgh', 'SEP', ...'abcdefgh', 'EOS'];
  return <div><BlockArray label="Full copying sequence: 19 tokens" values={tokens} role="input" columns={tokens.map((_, i) => i)} /><BlockArray label="18 next-token targets: first 8 fresh, delimiter, 8 copies, delimiter" values={tokens.slice(1)} columns={tokens.slice(1).map((_, i) => `target ${i}`)} /><p className="block-operation-label">Input position 9 is SEP → target 9 is the first copied a. Eight unpredictable uniform ten-way symbols contribute 8 ln(10) / 18 nats.</p></div>;
}
export function BlockVariantsDrawing() {
  return <div>
    <Drawing label="Sequential branches: FFN reads attention-updated z; both saved arrays rejoin their own update" height={320}>
      <Text x={380} y={24}>Sequential pre-norm · A attention · F feed-forward</Text>
      <Cells x={22} y={70} values={['x₁', 'x₂']} role="input" width={48} /><Arrow x1={128} y1={90} x2={178} y2={90} /><Operation x={225} y={90} label="Norm₁" width={84} /><Arrow x1={275} y1={90} x2={324} y2={90} /><Operation x={367} y={90} label="A" width={76} /><Arrow x1={415} y1={90} x2={480} y2={90} /><Plus x={496} y={90} /><Arrow x1={518} y1={90} x2={576} y2={90} /><Cells x={588} y={70} values={['z₁', 'z₂']} width={48} label="Z" />
      <path d="M70 115 V146 H496 V105" fill="none" stroke={blockColors.edge} /><Text x={273} y={141}>saved X</Text>
      <path d="M636 115 V177 H70 V218" fill="none" stroke={blockColors.edge} /><Cells x={22} y={223} values={['z₁', 'z₂']} width={48} /><Arrow x1={128} y1={243} x2={178} y2={243} /><Operation x={225} y={243} label="Norm₂" width={84} /><Arrow x1={275} y1={243} x2={324} y2={243} /><Operation x={367} y={243} label="F" width={76} /><Arrow x1={415} y1={243} x2={480} y2={243} /><Plus x={496} y={243} /><Arrow x1={518} y1={243} x2={576} y2={243} /><Cells x={588} y={223} values={['y₁', 'y₂']} width={48} label="Y" />
      <path d="M70 265 V297 H496 V258" fill="none" stroke={blockColors.edge} /><Text x={273} y={292}>saved Z</Text>
    </Drawing>
    <Drawing label="Parallel branches read the same normalized x and add both updates to the saved x" height={270}>
      <Text x={380} y={24}>Parallel attention and FFN</Text><Cells x={22} y={86} values={['x₁', 'x₂']} role="input" width={48} /><Arrow x1={128} y1={106} x2={180} y2={106} /><Operation x={225} y={106} label="Norm" width={84} />
      {[62,150].map((y,i)=><g key={y}><Arrow x1={275} y1={106} x2={329} y2={y}/><Operation x={373} y={y} label={i?'F':'A'} width={76}/><Arrow x1={418} y1={y} x2={486} y2={106}/></g>)}<Plus x={500} y={106}/><Arrow x1={521} y1={106} x2={576} y2={106}/><Cells x={588} y={86} values={['y₁','y₂']} width={48}/><path d="M70 132 V213 H500 V122" fill="none" stroke={blockColors.edge}/><Text x={283} y={207}>saved X; neither branch reads the other's update</Text>
    </Drawing>
    {['Branch-output norm','Input + output norm','Scaled post-norm'].map((label,i)=><Drawing key={label} label={label+' with the saved bypass and normalizer positions drawn separately'} height={220}>
      <Text x={380} y={24}>{label}</Text><Cells x={18} y={72} values={['x₁','x₂']} role="input" width={42}/><Arrow x1={109} y1={92} x2={151} y2={92}/>
      {i===1&&<><Operation x={194} y={92} label="Norm in" width={86}/><Arrow x1={241} y1={92} x2={270} y2={92}/></>}
      <Operation x={i===1?309:194} y={92} label="F" width={76}/><Arrow x1={i===1?354:240} y1={92} x2={i===1?379:379} y2={92}/>
      {i<2&&<><Operation x={426} y={92} label={i===1?'Norm out':'Norm'} width={92}/><Arrow x1={479} y1={92} x2={516} y2={92}/></>}
      {i===2&&<Arrow x1={379} y1={92} x2={516} y2={92}/>}<Plus x={531} y={92}/><path d="M60 118 V166 H531 V108" fill="none" stroke={blockColors.edge}/><Text x={260} y={160}>{i===2?'α × saved X':'saved X'}</Text><Arrow x1={552} y1={92} x2={i===2?584:653} y2={92}/>{i===2&&<><Operation x={624} y={92} label="Norm" width={80}/><Arrow x1={669} y1={92} x2={681} y2={92}/></>}<Cells x={i===2?690:661} y={72} values={['y₁','y₂']} width={30}/>
    </Drawing>)}
  </div>;
}
export function BlockParameterDrawing() {
  return <Drawing label="Parameter arrays are separate from sequence-dependent score, hidden activation and cache arrays" height={430}>
    {['Q', 'K', 'V', 'O'].map((label, i) => <g key={label}><Cells x={20 + i * 181} y={63} values={[[`w${label}`, `w${label}`], [`w${label}`, `w${label}`]]} role="parameter" width={42} height={36} label={`${label} map: d × d`} /><Text x={63 + i * 181} y={168}>d bias scalars</Text></g>)}
    <Cells x={29} y={251} values={Array.from({ length: 2 }, () => Array(4).fill('w'))} role="parameter" width={42} height={36} label="FFN up d × f" /><Cells x={276} y={235} values={Array.from({ length: 4 }, () => Array(2).fill('w'))} role="parameter" width={42} height={32} label="FFN down f × d" />
    <Cells x={503} y={235} values={Array.from({ length: 4 }, (_, i) => Array(3).fill(['γ₁', 'β₁', 'γ₂', 'β₂'][i]))} role="parameter" width={47} height={32} label="Two norms: four d-wide vectors" />
    <Text x={380} y={413}>Parameter shapes depend on d and f, not the sequence length L.</Text>
  </Drawing>;
}
export function BlockMemoryDrawing() {
  return <Drawing label="An attention score square, FFN hidden rectangle and key/value cache are different memory objects" height={300}>
    <Cells x={15} y={63} values={Array.from({ length: 4 }, () => Array(4).fill('s'))} width={38} height={38} label="Scores: H × L × L" />
    <Cells x={266} y={63} values={Array.from({ length: 4 }, () => Array(5).fill('h'))} width={35} height={28} label="Hidden: L × f" />
    <Cells x={548} y={63} values={Array.from({ length: 4 }, () => ['k', 'k'])} width={37} height={28} label="K cache: L × d" /><Cells x={644} y={63} values={Array.from({ length: 4 }, () => ['v', 'v'])} width={37} height={28} label="V: L × d" />
    <Text x={380} y={268}>One sequence, one layer; multiply by N for a batch. These are not weights.</Text>
  </Drawing>;
}
export function BlockSystemsDrawing() {
  const fixture = blockDefault(), trace = feedforwardTrace([1, 2, -1, -2], fixture.up, fixture.down);
  return <div>
    <Drawing label="Tensor partitioning keeps matching up columns and down rows together; partial output arrays sum to the full update" height={370}>
      <Cells x={77} y={68} values={fixture.up.map(row => row.slice(0, 2))} role="parameter" width={42} height={32} label="Device A: up columns 1–2" /><Cells x={16} y={237} values={trace.contributions.slice(0, 2)} width={60} height={32} label="Two weighted write rows" />
      <Cells x={396} y={68} values={fixture.up.map(row => row.slice(2))} role="parameter" width={42} height={32} label="Device B: up column 3" /><Cells x={397} y={237} values={trace.contributions.slice(2)} width={60} height={32} label="Matching third write row" />
      <Arrow x1={147} y1={277} x2={292} y2={330} /><Arrow x1={500} y1={277} x2={362} y2={330} /><Text x={345} y={356}>Communicate and sum → [2, 4, 1.5, −1.5]</Text>
    </Drawing>
    <Drawing label="Checkpointing saves boundary features, recreates hidden arrays for backward; pipeline devices communicate feature arrays" height={315}>
      <Cells x={15} y={59} values={['x₁', 'x₂', 'x₃', 'x₄']} role="input" width={42} label="Saved boundary X" /><Arrow x1={193} y1={79} x2={263} y2={79} /><Cells x={276} y={59} values={['h₁', 'h₂', 'h₃']} width={42} label="Recreated hidden" /><Arrow x1={412} y1={79} x2={514} y2={79} /><Cells x={530} y={59} values={['y₁', 'y₂', 'y₃', 'y₄']} width={42} label="Saved boundary Y" />
      <Arrow x1={603} y1={132} x2={120} y2={132} backward /><Text x={370} y={166} color={blockColors.backward}>Backward reads recomputed intermediates.</Text>
      <Operation x={127} y={249} label="Device A: blocks" width={168} /><Cells x={285} y={229} values={['h₁', 'h₂', 'h₃', 'h₄']} width={42} label="Communicated rows" /><Operation x={622} y={249} label="Device B: blocks" width={168} /><Arrow x1={217} y1={249} x2={276} y2={249} /><Arrow x1={463} y1={249} x2={527} y2={249} />
    </Drawing>
  </div>;
}
