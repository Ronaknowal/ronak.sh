import { useEffect, useId, useRef, useState } from 'react';
import { flowNumber as number } from './LessonFlow.jsx';
import { groupedDefaults, groupedRead, rotate, cacheBudget, linear } from '../../data/grouped-query-models.js';
import studyHistory from '../../data/grouped-query-study.js';

export const gqaColors = { input: '#77cddb', parameter: '#e4b752', computed: '#be9cf5', operation: '#e8e6df', edge: '#99978f', backward: '#eda064' };
export const gqaVector = (values, digits = 5) => values == null ? 'undefined' : `[${values.map(value => number(value, digits)).join(', ')}]`;

export function GqaGroupedLayoutDrawing() {
  return <GqaDrawing label="Four query heads reshape into two groups of two; each group broadcasts one compact key and value array" width={860} height={540}>
    <GqaCells x={80} y={64} values={[[0, 1], [2, 3]]} label="Query-head indices: group × reader" rows={['group 0', 'group 1']} role="operation" width={100}/>
    <GqaText x={570} y={47}>Same two compact memory groups</GqaText>
    <GqaCells x={465} y={64} values={[[0, 'K₀'], [1, 'K₁']]} label={null} role="computed" width={100}/>
    <GqaArrow path="M260 85 H400 V214 H450"/><GqaArrow path="M665 85 H770 V214 H680"/>
    <GqaOperation x={565} y={214} width={230} label="Q × transposed K"/>
    <GqaCells x={365} y={281} values={[['g0/r0', 'T × S'], ['g0/r1', 'T × S'], ['g1/r0', 'T × S'], ['g1/r1', 'T × S']]} width={170} label="Separate matching matrices for all four readers"/>
    <GqaArrow x1={565} y1={234} x2={565} y2={280}/>
    <GqaText x={420} y={490}>K/V broadcast along the reader axis; they are not copied.</GqaText>
    <GqaText x={420} y={521}>Scores still have B × Hq × T × S entries in this dense reference.</GqaText>
  </GqaDrawing>;
}

export function GqaMovementDrawing({ points, boundary, predictions, rollout = [], targetPoints = [], selectedFrame }) {
  const all = [...points, ...(predictions ?? []), ...rollout, ...targetPoints];
  const xMin = Math.min(...all.map(row => row[0])), xMax = Math.max(...all.map(row => row[0])), yMin = Math.min(...all.map(row => row[1])), yMax = Math.max(...all.map(row => row[1]));
  const span = Math.max(.05, xMax - xMin, yMax - yMin) * 1.24;
  const xMiddle = (xMin + xMax) / 2, yMiddle = (yMin + yMax) / 2, xLow = xMiddle - span / 2, yLow = yMiddle - span / 2;
  const px = value => 60 + (value - xLow) / span * 250, py = value => 310 - (value - yLow) / span * 250;
  const line = rows => rows.map((row, i) => `${i ? 'L' : 'M'}${px(row[0])} ${py(row[1])}`).join(' ');
  return <GqaDrawing label="Recorded hand positions and the selected model's next-point forecasts in the same coordinate plane" width={340} height={525}>
    <path d="M60 45 V310 H325" fill="none" stroke={gqaColors.edge}/>
    {[xLow, xMiddle, xLow + span].map(value => <GqaText key={value} x={px(value)} y={335}>{number(value, 2)}</GqaText>)}
    {[yLow, yMiddle, yLow + span].map(value => <GqaText key={value} x={48} y={py(value) + 5} anchor="end">{number(value, 2)}</GqaText>)}
    <GqaText x={320} y={361}>x</GqaText><GqaText x={48} y={28}>y</GqaText>
    <path d={line(points)} fill="none" stroke={gqaColors.input} strokeWidth={2}/>
    {points.map((point, i) => <circle key={i} cx={px(point[0])} cy={py(point[1])} r={i === selectedFrame ? 5 : 2} fill={gqaColors.input} stroke={i === selectedFrame ? 'white' : 'none'}/>)}
    {predictions && <path d={line(predictions)} fill="none" stroke={gqaColors.computed} strokeWidth={1.5} strokeDasharray="4 3"/>}
    {targetPoints.length > 0 && <path d={line([points.at(-1), ...targetPoints])} fill="none" stroke={gqaColors.edge} strokeWidth={1.5} strokeDasharray="2 4"/>}
    {rollout.length > 0 && <><path d={line([points.at(-1), ...rollout])} fill="none" stroke={gqaColors.parameter} strokeWidth={2}/>{rollout.map((point, i) => <circle key={i} cx={px(point[0])} cy={py(point[1])} r={3} fill={gqaColors.parameter}/>)}</>}
    <GqaText x={20} y={398} anchor="start" role="input">Cyan: {boundary} supplied observations</GqaText>
    <GqaText x={20} y={425} anchor="start" role="computed">Violet dashed: next-point forecasts</GqaText>
    <GqaText x={20} y={452} anchor="start" role="parameter">Amber: generated inputs and outputs</GqaText>
    <GqaText x={20} y={479} anchor="start">Grey dotted: unseen recorded future</GqaText>
    <GqaText x={170} y={513}>View follows the curves; x/y units match.</GqaText>
  </GqaDrawing>;
}

export function GqaContinuationHistoryDrawing() {
  return <div className="gqa-independent-scenes">{[4, 2, 1].map(heads => {
    const { selected, history } = studyHistory[heads], x = update => 55 + update / 45 * 250, y = loss => 300 - (Math.log10(loss) + 4) / 3 * 255;
    const selectedLoss = history.find(([update]) => update === selected)[1];
    return <GqaDrawing key={heads} label={`Measured ${heads}-KV-head validation MSE over all 45 continuation updates; selected checkpoint marked`} width={340} height={440}>
      <path d="M55 35 V300 H315" fill="none" stroke={gqaColors.edge}/>
      {[0, 15, 30, 45].map(value => <GqaText key={value} x={x(value)} y={326}>{value}</GqaText>)}
      {[.0001, .001, .01, .1].map(value => <g key={value}><GqaText x={55} y={y(value) + 5} anchor="end">{value}</GqaText><path d={`M55 ${y(value)} H310`} stroke={gqaColors.edge} strokeDasharray="2 5"/></g>)}
      <path d={history.map(([update, loss], i) => `${i ? 'L' : 'M'}${x(update)} ${y(loss)}`).join(' ')} fill="none" stroke={gqaColors.computed} strokeWidth={2}/>
      <circle cx={x(selected)} cy={y(selectedLoss)} r={5} stroke="white" fill={gqaColors.computed}/>
      <GqaText x={180} y={359}>Extra full-batch Adam updates</GqaText>
      <GqaText x={180} y={392}>{heads === 4 ? 'MHA continuation' : heads === 2 ? 'Converted GQA' : 'Converted MQA'}</GqaText>
      <GqaText x={180} y={423}>Selected {selected}; MSE {number(selectedLoss, 7)}</GqaText>
    </GqaDrawing>;
  })}</div>;
}

export function GqaPublishedTradeoffDrawing() {
  const cases = [['MHA', 1.51, 47.2], ['MQA', .24, 46.6], ['GQA-8', .28, 47.1]], x = time => 60 + time / 1.6 * 250, y = score => 300 - (score - 46) / 2 * 250;
  return <GqaDrawing label="Actual T5-XXL GQA paper Table 1: three task-score and TPUv4 time pairs, not a universal scaling curve" width={380} height={435}>
    <path d="M60 35 V300 H330" fill="none" stroke={gqaColors.edge}/>
    {[0, .5, 1, 1.5].map(value => <GqaText key={value} x={x(value)} y={327}>{value}</GqaText>)}
    {[46, 47, 48].map(value => <GqaText key={value} x={49} y={y(value) + 5} anchor="end">{value}</GqaText>)}
    {cases.map(([label, time, score], i) => <g key={label}><circle cx={x(time)} cy={y(score)} r={5} fill={gqaColors.computed}/><GqaArrow path={`M${x(time)} ${y(score)} L${i === 0 ? 256 : 132} ${i === 0 ? 109 : i === 1 ? 256 : 141}`}/><GqaText x={i === 0 ? 290 : 158} y={i === 0 ? 105 : i === 1 ? 278 : 133}>{label}</GqaText></g>)}
    <GqaText x={190} y={366}>seconds/sample/TPUv4 chip</GqaText>
    <GqaText x={190} y={397}>y: average development-task score</GqaText>
    <GqaText x={190} y={426}>8 TPUv4 chips; source timing protocol</GqaText>
  </GqaDrawing>;
}

export function GqaPhysicalReplicationDrawing() {
  return <GqaDrawing label="32 query heads across eight devices: two logical K/V heads each have four physical replicas under this local-read layout" width={940} height={630}>
    <GqaCells x={256} y={55} values={[['K₀', 'V₀'], ['K₁', 'V₁']]} width={190} label="Two logical KV heads, each storing all legal positions"/>
    {Array.from({ length: 8 }, (_, device) => {
      const x = 35 + device % 4 * 230, y = 265 + Math.floor(device / 4) * 165, group = Math.floor(device / 4);
      return <g key={device}><GqaArrow path={`M${group ? 636 : 256} ${97 + group * 42} V${y - 45} H${x + 95} V${y}`}/><GqaCells x={x} y={y} values={[[`K${group}`, `V${group}`]]} width={95} label={`Device ${device}: one replica`}/><GqaText x={x + 95} y={y + 74}>Local queries {device * 4}–{device * 4 + 3}</GqaText></g>;
    })}
    <GqaText x={470} y={575}>Each logical head has four replicas: eight physical stored-head copies.</GqaText>
    <GqaText x={470} y={607}>Another algorithm can shard positions or communicate; this is one layout.</GqaText>
  </GqaDrawing>;
}

export function GqaCacheOwnershipDrawing() {
  const source = [[.2,-.1],[.8,.3],[-.2,.7]], values = source.map(row => [2*row[0],row[1]]);
  const fixture=groupedDefaults(), read=groupedRead({ ...fixture,query:[[1,0]],mapping:[0] })[0];
  return <div className="gqa-independent-scenes"><GqaDrawing label="Illustrative fixed encoder representations feed K/V projections; attached IDs are metadata, not projection inputs" width={360} height={880}>
    <GqaCells x={104} y={70} values={source} width={105} role="input" label="Fixed encoder representations"/>
    <GqaCells x={16} y={70} values={[[0],[1],[2]]} width={54} role="input" label="IDs"/>
    <GqaText x={180} y={238}>Constructed two-coordinate example</GqaText>
    <GqaArrow path="M209 196 V267 H84 V300"/><GqaArrow path="M209 196 V267 H270 V300"/>
    <GqaCells x={4} y={300} values={[[1,0],[0,1]]} width={80} role="parameter" label="Key map"/><GqaCells x={190} y={300} values={[[2,0],[0,1]]} width={80} role="parameter" label="Value map"/>
    <GqaArrow x1={84} y1={384} x2={84} y2={445}/><GqaArrow x1={270} y1={384} x2={270} y2={445}/>
    <GqaCells x={4} y={465} values={source} width={80} label="Stored K"/><GqaCells x={190} y={465} values={values} width={80} label="Stored V"/>
    <GqaArrow path="M84 591 V640 H135"/><GqaArrow path="M270 591 V640 H225"/><GqaOperation x={180} y={660} label="cross-attention read" width={240}/>
    <GqaCells x={105} y={750} values={[1,0]} role="computed" width={75} label="A new decoder query"/><GqaArrow path="M255 771 H338 V660 H300"/>
    <GqaText x={180} y={835}>Reuse unchanged source K/V.</GqaText><GqaText x={180} y={863}>Changing encoder states invalidates them.</GqaText>
  </GqaDrawing><GqaDrawing label="A new decoder query reads both old prefix records and its new K/V; feedforward routing follows separately" width={360} height={880}>
    <GqaCells x={104} y={70} values={[1,0]} width={76} label="New projected decoder Q"/>
    <GqaCells x={20} y={245} values={fixture.keys[0].map((key,i)=>[...key,...fixture.values[0][i]])} width={80} label="Prefix plus new record: K x/y | V x/y" rows={null}/>
    <GqaText x={180} y={419}>Rows are IDs0,1; new ID2.</GqaText>
    <GqaArrow path="M180 112 H347 V495 H300"/><GqaArrow x1={180} y1={371} x2={180} y2={475}/><GqaOperation x={180} y={495} label="legal score / mix" width={240}/>
    <GqaArrow x1={180} y1={515} x2={180} y2={580}/><GqaCells x={80} y={580} values={read.output} width={100} label="Actual attention write" digits={5}/>
    <GqaArrow x1={180} y1={622} x2={180} y2={692}/><GqaOperation x={180} y={712} label="O map + bypass; then FFN" width={310}/>
    <GqaText x={180} y={790}>Expert routing changes FFN work.</GqaText><GqaText x={180} y={822}>It does not multiply KV heads.</GqaText><GqaText x={180} y={854}>Self-attention memory grows with inputs.</GqaText>
  </GqaDrawing></div>;
}

export function GqaLearnedHeadDrawing({ trace, head, kvHeads, positions }) {
  const n = Math.min(4, trace.keys.length), rowBottom = 215 + n * 42, valuesY = rowBottom + 260, writesY = valuesY + n * 42 + 135, outputY = writesY + n * 42 + 180;
  return <GqaDrawing label={'Actual ' + kvHeads + '-KV-head model, query head ' + head + ', group ' + trace.group + ': score, full softmax, weighted values and six-coordinate sum'} width={1120} height={outputY + 135}>
    <GqaCells x={100} y={60} values={trace.query} width={90} label={'Actual rotated query head' + head + ', attached ID' + positions.at(-1)} digits={4}/>
    <GqaCells x={100} y={215} values={trace.keys.slice(0,n)} width={90} rows={positions.slice(0,n).map(id => 'ID' + id)} label={'Rotated K group' + trace.group + ': ' + n + ' of ' + trace.keys.length + ' records'} digits={4}/>
    <GqaArrow path={'M370 102 V135 H750 V' + (215 + n * 21 - 20)}/>
    <GqaArrow x1={640} y1={215 + n * 21} x2={685} y2={215 + n * 21}/><GqaOperation x={750} y={215 + n * 21} width={130} label="dot / √6"/>
    <GqaArrow x1={815} y1={215 + n * 21} x2={860} y2={215 + n * 21}/><GqaCells x={860} y={215} values={trace.scores.slice(0,n).map(value => [value])} width={190} label="Actual scaled scores" digits={5}/>
    <GqaArrow x1={955} y1={rowBottom} x2={955} y2={rowBottom + 75}/><GqaOperation x={920} y={rowBottom + 95} width={330} label={'softmax over ALL ' + trace.keys.length + ' legal keys'}/>
    <GqaText x={500} y={rowBottom + 50}>Omitted key rows also contribute to the full denominator.</GqaText>
    <GqaCells x={95} y={valuesY} values={trace.probabilities.slice(0,n).map(value => [value])} width={150} rows={positions.slice(0,n).map(id => 'ID' + id)} label="Matching masses" digits={6}/>
    <GqaArrow path={'M920 ' + (rowBottom + 115) + ' V' + (valuesY - 55) + ' H170 V' + valuesY}/>
    <GqaCells x={405} y={valuesY} values={trace.values.slice(0,n)} width={90} label={'Unrotated V group' + trace.group + ': same ' + n + ' stored records'} digits={4}/>
    <GqaArrow path={'M245 ' + (valuesY + n * 21) + ' H330 V' + (writesY + n * 21) + ' H405'}/><GqaArrow x1={675} y1={valuesY + n * 42} x2={675} y2={writesY}/>
    <GqaCells x={405} y={writesY} values={trace.contributions.slice(0,n)} width={90} rows={positions.slice(0,n).map(id => 'ID' + id)} label="Each row = its matching mass × its six value coordinates" digits={5}/>
    <GqaArrow x1={675} y1={writesY + n * 42} x2={675} y2={outputY - 100}/><GqaOperation x={675} y={outputY - 80} width={300} label={'sum ALL ' + trace.keys.length + ' weighted value rows'}/>
    <GqaText x={620} y={outputY - 135}>Omitted writes participate too; the full table follows.</GqaText>
    <GqaArrow x1={675} y1={outputY - 60} x2={675} y2={outputY}/><GqaCells x={405} y={outputY} values={trace.headOutputs[head]} width={90} label={'Head' + head + ': actual six-coordinate output'} digits={5}/>
    <GqaText x={560} y={outputY + 107}>This is an attention write, before the learned output map, residuals and task forecast.</GqaText>
  </GqaDrawing>;
}

export function GqaLearnedBlockDrawing({ trace, weights, kvHeads }) {
  const cells = (x, y, values, label, role = 'computed') => <GqaCells x={x} y={y} values={values} label={label} role={role} width={88} digits={4}/>;
  const partial = row => row.slice(0, 4), map = name => weights[`${name}.weight`].slice(0, 3).map(row => row.slice(0, 4));
  return <GqaDrawing label={`Complete actual ${kvHeads}-KV-head learned forecast route, with explicitly labelled array cutaways and both residual additions`} width={1160} height={2200}>
    {cells(375, 55, trace.scaled.at(-1), 'Last supplied point, fixed scaling 2x−1', 'input')}
    {cells(275, 173, weights['stem.weight'].slice(0, 4), 'Stem map: 4 of 24 output rows; both inputs shown', 'parameter')}
    {cells(710, 173, partial(weights['stem.bias']), 'Stem bias: 4 of 24', 'parameter')}
    <GqaArrow path="M463 97 V128 H1020 V390 H730"/><GqaArrow path="M363 341 V390 H500"/><GqaArrow path="M885 215 V369 H680"/>
    <GqaOperation x={615} y={390} label="map × input + bias" width={230}/><GqaArrow x1={615} y1={410} x2={615} y2={462}/>
    {cells(440, 462, partial(trace.stem.at(-1)), 'Saved stem row: 4 of 24 features')}
    <GqaArrow x1={615} y1={504} x2={615} y2={550}/><GqaOperation x={615} y={570} width={330} label="LayerNorm: all 24 features, ε=10⁻⁵"/>
    <GqaArrow x1={615} y1={590} x2={615} y2={636}/>{cells(440, 636, partial(trace.normalized.at(-1)), 'Normalized attention input: 4 of 24')}
    {['query', 'key', 'value'].map((name, i) => <g key={name}>{cells(70 + i * 365, 741, map(name), `${name} W: 3 rows × 4 columns shown`, 'parameter')}<GqaText x={246 + i * 365} y={900}>{name === 'query' ? '24×24' : `${kvHeads * 6}×24`}; bias included</GqaText><GqaArrow path={`M615 678 V707 H${246 + i * 365} V741`}/></g>)}
    {['query', 'key', 'value'].map((name, i) => <g key={name}><GqaArrow x1={246 + i * 365} y1={867} x2={246 + i * 365} y2={947}/><GqaCells x={114 + i * 365} y={947} values={linear(trace.normalized.at(-1), weights, name).slice(0, 3)} width={88} digits={4} label={`${name}: first 3 of ${name === 'query' ? 24 : kvHeads * 6}`}/><GqaArrow path={`M${246 + i * 365} 989 V${1033 + i * 18} H${525 + i * 90} V1080`}/></g>)}
    <GqaOperation x={615} y={1100} width={400} label="Q/K rotations → legal scores → weighted V"/>
    <GqaText x={565} y={1150}>Four six-coordinate writes; the preceding head investigation expands each read.</GqaText>
    <GqaArrow path="M440 483 H30 V1520 H525"/>
    <g transform="translate(0 200)">
    <GqaArrow path="M815 900 H1110 V1071 H792"/>{cells(440, 1050, partial(trace.concatenated), 'Concatenated head outputs: first 4 of 24')}
    <GqaArrow x1={615} y1={1092} x2={615} y2={1129}/><GqaOperation x={615} y={1149} width={330} label="Output map 24×24 + bias"/>
    <GqaArrow x1={615} y1={1169} x2={615} y2={1220}/>{cells(440, 1220, partial(trace.attentionUpdate), 'Attention written update: 4 of 24')}
    <GqaArrow x1={615} y1={1262} x2={615} y2={1300}/><GqaOperation x={615} y={1320} label="+ saved stem" width={180}/>
    <GqaArrow x1={615} y1={1340} x2={615} y2={1377}/>{cells(440, 1377, partial(trace.context), 'Context after first residual: 4 of 24')}
    <GqaArrow x1={615} y1={1419} x2={615} y2={1460}/><GqaOperation x={615} y={1480} width={390} label="LN → 48×24 map+bias → GELU"/>
    <GqaArrow x1={615} y1={1500} x2={615} y2={1550}/>{cells(440, 1550, partial(trace.activated), 'Activated workspace: first 4 of 48')}
    <GqaArrow x1={615} y1={1592} x2={615} y2={1630}/><GqaOperation x={615} y={1650} width={300} label="24×48 down-map + bias"/>
    <GqaArrow x1={615} y1={1670} x2={615} y2={1720}/>{cells(440, 1720, partial(trace.feedforwardUpdate), 'Feedforward written update: 4 of 24')}
    <GqaArrow x1={615} y1={1762} x2={615} y2={1800}/><GqaOperation x={615} y={1820} label="+ saved context" width={210}/><GqaArrow path="M440 1398 H60 V1820 H510"/>
    <GqaArrow x1={615} y1={1840} x2={615} y2={1871}/><GqaOperation x={615} y={1891} width={430} label="Final LN → 2×24 task map+bias → (y+1)/2"/>
    <GqaArrow x1={615} y1={1911} x2={615} y2={1958}/>{cells(527, 1958, trace.prediction, 'Next-point forecast, both coordinates')}
    </g>
  </GqaDrawing>;
}

export function GqaLearnedAffineRouteDrawing({ input, map, bias, output, name }) {
  const rows = Math.min(4, map.length), columns = Math.min(4, input.length), shownMap = map.slice(0, rows).map(row => row.slice(0, columns));
  const shownBias = bias.slice(0, rows), preBias = output.slice(0, rows).map((value, i) => value - bias[i]);
  return <GqaDrawing label={`Actual ${name} affine route: supplied computed row, learned map and bias, multiplication, addition and resulting row; omissions explicitly labelled`} width={1060} height={850}>
    <GqaCells x={365} y={62} values={input.slice(0, columns)} width={100} label={`${name} input: ${columns} of ${input.length} coordinates`} digits={4}/>
    <GqaCells x={40} y={236} values={shownMap} width={94} role="parameter" label={`${name} W: ${rows}/${map.length} rows × ${columns}/${input.length} columns`} digits={4}/>
    <GqaCells x={650} y={236} values={shownBias} width={95} role="parameter" label={`${name} bias: ${rows} of ${bias.length}`} digits={4}/>
    <GqaArrow path="M565 104 V149 H510 V440"/>
    <GqaArrow path={`M${40 + columns * 94} ${236 + rows * 21} H450 V460 H490`}/><GqaOperation x={575} y={460} label="full W × input" width={170}/>
    <GqaArrow x1={575} y1={480} x2={575} y2={546}/><GqaCells x={575 - rows * 50} y={546} values={preBias} width={100} label="Before bias: actual full dot products" digits={4}/>
    <GqaArrow x1={575} y1={588} x2={575} y2={650}/><GqaOperation x={575} y={670} label="+" width={70}/><GqaArrow path={`M${650 + rows * 95} 257 H1038 V670 H610`}/>
    <GqaArrow x1={575} y1={690} x2={575} y2={750}/><GqaCells x={575 - rows * 50} y={750} values={output.slice(0, rows)} width={100} label={`${name} output: ${rows} of ${output.length} coordinates`} digits={4}/>
    <GqaText x={530} y={818}>Omitted input coordinates still participate in each full dot product.</GqaText><GqaText x={530} y={845}>These are labelled cutaways, not smaller learned maps.</GqaText>
  </GqaDrawing>;
}

export function GqaDrawing({ label, children, width = 920, height = 400 }) {
  const id = useId(), host = useRef(null), [scrolls, setScrolls] = useState(false);
  useEffect(() => {
    const element = host.current;
    if (!element) return undefined;
    const update = () => setScrolls(element.scrollWidth > element.clientWidth + 1);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <figure className="gqa-flow-drawing"><div ref={host} className="gqa-flow-scroll" tabIndex={0} role="region" aria-label={label}>
    <svg viewBox={`0 0 ${width} ${height}`} style={{ minWidth: width, width }} role="img" aria-labelledby={id}><title id={id}>{label}</title>{children}</svg>
  </div>{scrolls && <span className="gqa-flow-scroll-hint">↔ Scroll this connected drawing sideways; focus it and use arrow keys with a keyboard.</span>}</figure>;
}
export function GqaText({ x, y, children, role = 'operation', anchor = 'middle', size = 15 }) {
  return <text x={x} y={y} textAnchor={anchor} fill={gqaColors[role]} fontSize={size}>{children}</text>;
}
export function GqaArrow({ x1, y1, x2, y2, path, backward = false, color: suppliedColor }) {
  const id = useId().replaceAll(':', ''), color = backward ? gqaColors.backward : suppliedColor ?? gqaColors.edge;
  return <g><defs><marker id={id} markerWidth={8} markerHeight={8} refX={7} refY={4} orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill={color}/></marker></defs>
    <path d={path ?? `M${x1} ${y1} L${x2} ${y2}`} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray={backward ? '5 4' : undefined} markerEnd={`url(#${id})`}/>
  </g>;
}
export function GqaCells({ x, y, values, label, role = 'computed', width = 106, height = 42, digits = 5, rows }) {
  const matrix = Array.isArray(values[0]) ? values : [values];
  return <g>{label && <GqaText x={x + matrix[0].length * width / 2} y={y - 17} role={role}>{label}</GqaText>}
    {matrix.map((row, i) => <g key={i}>{rows && <GqaText x={x - 12} y={y + i * height + 27} anchor="end">{rows[i]}</GqaText>}{row.map((value, j) => <g key={j}>
      <rect x={x + j * width} y={y + i * height} width={width} height={height} stroke={gqaColors[role]} fill={typeof value === 'number' && value > 0 ? '#e4b75220' : typeof value === 'number' && value < 0 ? '#77cddb20' : 'none'}/>
      <GqaText x={x + (j + .5) * width} y={y + i * height + 27}>{typeof value === 'number' ? number(value, digits) : value}</GqaText>
    </g>)}</g>)}
  </g>;
}
export function GqaOperation({ x, y, label, width = 136 }) {
  return <g><rect x={x - width / 2} y={y - 20} width={width} height={40} rx={16} fill="none" stroke={gqaColors.operation}/><GqaText x={x} y={y + 6}>{label}</GqaText></g>;
}
export function GqaArray({ label, values, rows, columns, role = 'computed', digits = 6 }) {
  const matrix = Array.isArray(values[0]) ? values : [values];
  return <div className="gqa-flow-array" style={{ '--gqa-role': gqaColors[role] }}><span>{label}</span><div className="gqa-array-scroll" role="region" tabIndex={0} aria-label={label}>
    <table><thead><tr><th aria-label="row"/>{matrix[0].map((_, j) => <th key={j}>{columns?.[j] ?? `coordinate ${j}`}</th>)}</tr></thead><tbody>{matrix.map((row, i) => <tr key={i}><th>{rows?.[i] ?? `row ${i}`}</th>{row.map((value, j) => <td key={j} data-sign={typeof value === 'number' ? Math.sign(value) : 0}>{typeof value === 'number' ? number(value, digits) : value}</td>)}</tr>)}</tbody></table>
  </div></div>;
}

export function GqaProjectionDrawing() {
  const mobile = [
    ['Query map: identity', [[1, 0], [0, 1]], [[0, 1]], 'Current query: row1'],
    ['Key map: identity', [[1, 0], [0, 1]], [[1, 0], [0, 1]], 'Both stored matching keys'],
    ['Value map', [[1, 1], [1, -1]], [[1, 1], [1, -1]], 'Both stored information values'],
  ];
  return <><div className="gqa-flow-desktop"><GqaDrawing label="Two constructed feature rows pass through actual Q/K/V maps; only the current query is needed for the next read" height={560}>
    <GqaCells x={354} y={60} values={[[1, 0], [0, 1]]} role="input" label="Supplied feature rows 0 and 1" rows={['0', '1']}/>
    {[130, 460, 790].map(x => <GqaArrow key={x} path={`M460 145 V175 H${x} V205`}/>)}
    <GqaCells x={40} y={230} values={[[1, 0], [0, 1]]} width={90} role="parameter" label="Query map: identity"/>
    <GqaCells x={370} y={230} values={[[1, 0], [0, 1]]} width={90} role="parameter" label="Key map: identity"/>
    <GqaCells x={700} y={230} values={[[1, 1], [1, -1]]} width={90} role="parameter" label="Value map"/>
    {[130, 460, 790].map(x => <GqaArrow key={x} x1={x} y1={315} x2={x} y2={371}/>)}
    <GqaCells x={24} y={397} values={[0, 1]} label="Current question: row 1"/>
    <GqaCells x={354} y={397} values={[[1, 0], [0, 1]]} label="Stored matching keys" rows={['0', '1']}/>
    <GqaCells x={684} y={397} values={[[1, 1], [1, -1]]} label="Stored information values" rows={['0', '1']}/>
    <GqaText x={460} y={536}>Map rows are output coordinates; each input is multiplied by every map row. Biases are zero.</GqaText>
  </GqaDrawing></div><div className="gqa-flow-mobile">{mobile.map(([label, map, output, outputLabel]) => <GqaDrawing key={label} label={`The same supplied rows through ${label}, with every coefficient and projected coordinate visible`} width={340} height={560}>
    <GqaCells x={64} y={60} values={[[1, 0], [0, 1]]} role="input" label="Same supplied rows0 and1"/>
    <GqaArrow path="M170 144 V181 H295 V261 H276"/><GqaCells x={64} y={240} values={map} role="parameter" label={label}/>
    <GqaArrow path="M170 324 V360 H42 V441 H64"/><GqaCells x={64} y={420} values={output} label={outputLabel}/>
    <GqaText x={170} y={539}>Output-by-input map; zero bias.</GqaText>
  </GqaDrawing>)}</div></>;
}
export function GqaOpeningReadDrawing() {
  const probability = Math.exp(1 / Math.sqrt(2)) / (1 + Math.exp(1 / Math.sqrt(2)));
  return <><div className="gqa-flow-desktop"><GqaDrawing label="The current question scores the two stored keys and mixes their values into one two-coordinate attention output" height={540}>
    <GqaCells x={45} y={65} values={[0, 1]} label="Current query"/><GqaCells x={390} y={65} values={[[1, 0], [0, 1]]} label="Keys: rows 0, 1"/>
    <GqaArrow path="M257 86 H300 V216 H361"/><GqaArrow path="M496 150 V187"/>
    <GqaCells x={375} y={212} values={[[0, 1 / Math.sqrt(2)]]} label="Dot products ÷ √2"/><GqaArrow x1={587} y1={233} x2={648} y2={233}/>
    <GqaCells x={662} y={212} values={[1 - probability, probability]} label="Normalized matching weights"/>
    <GqaCells x={45} y={350} values={[[1, 1], [1, -1]]} label="Values: rows 0, 1"/>
    <GqaArrow path="M768 254 V319 H428 V350"/><GqaArrow x1={257} y1={392} x2={322} y2={392}/>
    <GqaCells x={322} y={350} values={[[1 - probability, 1 - probability], [probability, -probability]]} label="Multiply each value by its weight"/>
    <GqaArrow x1={534} y1={392} x2={616} y2={392}/><GqaText x={578} y={373}>sum rows</GqaText>
    <GqaCells x={630} y={371} values={[1, 1 - 2 * probability]} label="Attention output"/>
    <GqaText x={460} y={505}>Future reads need these keys and values again; this completed question does not become a stored field.</GqaText>
  </GqaDrawing></div><div className="gqa-flow-mobile"><GqaDrawing label="The same two-row read stacked vertically: query and keys supply scores, normalized weights multiply values, and the two writes add" width={340} height={960}>
    <GqaCells x={64} y={50} values={[0, 1]} label="Current query: row1"/>
    <GqaCells x={64} y={160} values={[[1, 0], [0, 1]]} label="Stored keys: rows0 and1"/>
    <GqaArrow path="M170 92 V113 H42 V330 H64"/><GqaArrow path="M170 244 V265 H295 V330 H276"/>
    <GqaCells x={64} y={309} values={[0, 1 / Math.sqrt(2)]} label="Dot products ÷ √2"/>
    <GqaArrow path="M170 351 V374 H42 V440 H64"/><GqaCells x={64} y={419} values={[1 - probability, probability]} label="Normalized matching weights"/>
    <GqaCells x={64} y={530} values={[[1, 1], [1, -1]]} label="Stored information values"/>
    <GqaArrow path="M170 461 V484 H295 V686 H276"/><GqaArrow path="M170 614 V636 H42 V686 H64"/>
    <GqaCells x={64} y={665} values={[[1 - probability, 1 - probability], [probability, -probability]]} label="Weight × each value"/>
    <GqaArrow path="M170 749 V779 H42 V851 H64"/><GqaCells x={64} y={830} values={[1, 1 - 2 * probability]} label="Add both writes: current output"/>
    <GqaText x={170} y={918}>Only keys and values persist;</GqaText><GqaText x={170} y={948}>this completed query is finished.</GqaText>
  </GqaDrawing></div></>;
}
export function GqaCacheContentsDrawing() {
  return <GqaDrawing label="One layer keeps both coordinate fields for each occupied record; a new query reads this stored history" width={800} height={335}>
    <GqaCells x={60} y={75} values={[[0, 1, 0, 1, 1], [1, 0, 1, 1, -1]]} width={88} label="Cache fields: ID | key x | key y | value x | value y"/>
    <GqaText x={280} y={202}>Two occupied records; four stored coordinates per record.</GqaText>
    <GqaCells x={583} y={75} values={[0, 1]} label="Current query" width={93}/>
    <GqaArrow path="M500 117 H540 V248 H593"/><GqaArrow path="M676 117 V248 H670"/>
    <GqaOperation x={649} y={270} label="read + mix" width={140}/>
    <GqaText x={295} y={285}>Completed queries are absent from the cache.</GqaText>
  </GqaDrawing>;
}
export function GqaPromptAvailabilityDrawing() {
  return <div className="gqa-independent-scenes"><GqaDrawing label="Both observed input rows are already available; the causal permission matrix controls which prefix each question reads" width={360} height={395}>
    <GqaCells x={73} y={65} values={[[1, 0], [0, 1]]} role="input" label="Already supplied rows" rows={['0', '1']}/>
    <GqaArrow x1={180} y1={150} x2={180} y2={197}/><GqaCells x={73} y={224} values={[[1, '×'], [1, 1]]} label="Allowed keys: columns 0, 1"/>
    <GqaText x={180} y={353}>Both queries can be calculated together.</GqaText><GqaText x={180} y={382}>Their allowed histories still differ.</GqaText>
  </GqaDrawing><GqaDrawing label="A generated next input can only be projected after the preceding model prediction has supplied it" width={360} height={395}>
    <GqaCells x={72} y={65} values={[0, 1]} role="input" label="Last supplied point"/>
    <GqaArrow x1={180} y1={107} x2={180} y2={152}/><GqaOperation x={180} y={175} label="model prediction" width={198}/>
    <GqaArrow x1={180} y1={196} x2={180} y2={235}/><GqaCells x={54} y={263} values={['next x', 'next y']} width={126} label="Generated next input"/>
    <GqaText x={180} y={353}>Project this input only once it exists.</GqaText><GqaText x={180} y={382}>Arrows show dependencies, not time.</GqaText>
  </GqaDrawing></div>;
}
export function GqaGroupingDrawing({ count = 2, mapping = null, selected = 0 }) {
  const connections = mapping ?? [0, 1, 2, 3].map(head => Math.floor(head / (4 / count)));
  const groups = mapping ? 2 : count;
  return <GqaDrawing label="Four separately labelled query coordinate rows connect to shared key/value coordinate fields; these lines are fixed head assignments" width={680} height={435}>
    {connections.map((group, head) => <g key={head}>
      <GqaText x={70} y={61 + head * 89} role="computed">head {head}</GqaText><GqaCells x={120} y={36 + head * 89} values={[`q${head} x`, `q${head} y`]} width={82}/>
      <GqaArrow path={`M284 ${57 + head * 89} H340 V${55 + group * 340 / Math.max(groups, 1)} H399`}/>
      {head === selected && <path d={`M116 ${33 + head * 89} H289 V${81 + head * 89} H116 Z`} fill="none" stroke={gqaColors.operation} strokeWidth={2}/>}
    </g>)}
    {Array.from({ length: groups }, (_, group) => <g key={group}>
      <GqaText x={527} y={31 + group * 340 / Math.max(groups, 1)}>KV group {group}</GqaText>
      <GqaCells x={400} y={36 + group * 340 / Math.max(groups, 1)} values={[[`k${group} x`, `k${group} y`, `v${group} x`, `v${group} y`]]} width={64}/>
    </g>)}
    <GqaText x={340} y={393}>Each group record repeats at every stored position.</GqaText>
    <GqaText x={340} y={424}>Connections assign heads; matching weights select positions.</GqaText>
  </GqaDrawing>;
}
export function GqaConstructedMemoryDrawing({ state = groupedDefaults() }) {
  const count = state.positions.length, second = 64 + count * 42 + 100, bottom = second + count * 42;
  return <GqaDrawing label="The complete current constructed queries and both groups' stored key/value arrays, with physical slots and attached logical IDs" height={bottom + 105}>
    <GqaCells x={90} y={64} values={state.query} label="Four current query vectors" rows={state.query.map((_, h) => `head ${h}`)} width={110}/>
    {[0, 1].map(group => <g key={group}>
      <GqaText x={605} y={(group ? second : 64) - 45}>Group {group}</GqaText>
      <GqaCells x={385} y={group ? second : 64} values={state.keys[group]} width={90} label="Keys"/>
      <GqaCells x={630} y={group ? second : 64} values={state.values[group]} width={90} label="Values"/>
    </g>)}
    <GqaText x={460} y={bottom + 40}>Physical slots: {state.positions.map((_, i) => i).join(', ')}. Attached logical IDs: {state.positions.join(', ')}.</GqaText>
    <GqaText x={460} y={bottom + 73}>Each key stays paired with its value when a complete record moves.</GqaText>
  </GqaDrawing>;
}
export function GqaReadDrawing({ state, head = 0, row, legal }) {
  const group = state.mapping[head], query = state.query[head], keys = state.keys[group], values = state.values[group], count = keys.length;
  const products = keys.map(key => key.map((value, j) => value * query[j]));
  const lower = 255 + count * 42, height = lower + count * 42 + 120;
  return <GqaDrawing label={`Head ${head} reads actual group ${group} coordinate products, normalized weights and signed value contributions`} width={1020} height={height}>
    <GqaCells x={335} y={60} values={query} label={`Head ${head}: current query`} width={112}/>
    <GqaArrow path="M447 102 V128 H612 V211 H559"/>
    <GqaCells x={80} y={190} values={keys} label={`Group ${group}: keys`} width={96} rows={state.positions.map(id => `ID ${id}`)}/>
    <GqaArrow x1={272} y1={190 + count * 21} x2={335} y2={190 + count * 21}/>
    <GqaCells x={335} y={190} values={products} label="q x × k x | q y × k y" width={112}/>
    <GqaArrow x1={559} y1={190 + count * 21} x2={645} y2={190 + count * 21}/><GqaText x={603} y={158}>sum ÷ √2</GqaText>
    <GqaCells x={647} y={190} values={keys.map((_, i) => [row?.scores[i] ?? products[i].reduce((a, b) => a + b, 0) / Math.sqrt(2)])} width={110} label="Scaled scores"/>
    <GqaArrow x1={757} y1={190 + count * 21} x2={836} y2={190 + count * 21}/><GqaText x={798} y={158}>normalize</GqaText>
    <GqaCells x={840} y={190} values={keys.map((_, i) => [row ? row.weights[i] : '—'])} width={128} label="Matching weights"/>
    <GqaText x={510} y={lower - 40}>Allowed IDs: {state.positions.filter((_, i) => legal[i]).join(', ') || 'none'}; × excludes a key, never gives it a probability.</GqaText>
    <GqaCells x={80} y={lower} values={values} width={96} label={`Group ${group}: values`} rows={state.positions.map(id => `ID ${id}`)}/>
    <GqaArrow x1={272} y1={lower + count * 21} x2={335} y2={lower + count * 21}/>
    <GqaCells x={335} y={lower} values={values.map((value, i) => row ? row.contributions[i] : value.map(() => '—'))} width={112} label="Weight × each value coordinate"/>
    <GqaArrow x1={559} y1={lower + count * 21} x2={645} y2={lower + count * 21}/><GqaText x={604} y={lower - 17}>sum rows</GqaText>
    <GqaCells x={660} y={lower + (count - 1) * 21} values={row?.output ?? ['—', '—']} width={142} label={`Head ${head}: mixed output`}/>
    <GqaArrow path={`M904 ${190 + count * 42} V${lower - 65} H285 V${lower + 21} H335`}/>
    <GqaText x={510} y={height - 38}>Raw scores stay visible for excluded keys; only allowed scores enter the normalization.</GqaText>
  </GqaDrawing>;
}
export function GqaOutputMapDrawing({ outputs = groupedRead(groupedDefaults()).map(row => row.output) }) {
  const flat = outputs.flat(), output = [flat[0] + .5 * flat[4], flat[3] + .5 * flat[7]];
  const map = [[1, 0, 0, 0, .5, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, .5]];
  return <GqaDrawing label="All four distinct two-coordinate outputs concatenate to eight coordinates, then a separate learned output map returns two features" width={1030} height={480}>
    <GqaCells x={25} y={65} values={outputs} label="Four head outputs" width={108} rows={['0', '1', '2', '3']}/>
    <GqaArrow x1={241} y1={149} x2={309} y2={149}/><GqaCells x={325} y={65} values={flat.map(value => [value])} label="Concatenated row" width={148}/>
    <GqaArrow x1={473} y1={233} x2={514} y2={233}/><GqaCells x={523} y={203} values={map} role="parameter" width={58} label="Separate learned output map; two rows × eight coordinates"/>
    <GqaArrow path="M755 287 V346"/><GqaCells x={626} y={373} values={output} label="Two-feature attention contribution" width={136}/>
    <GqaText x={765} y={465}>This illustrated map is not the trained forecast head.</GqaText>
  </GqaDrawing>;
}
export function GqaPermissionsDrawing({ positions = [0, 1, 2, 3, 4], queryPositions = [3, 4], upperLeft = false }) {
  const legal = queryPositions.map((query, row) => positions.map((key, slot) => upperLeft ? slot <= row : key <= query));
  const width = Math.max(800, 240 + positions.length * 90);
  return <GqaDrawing label="Two query IDs compare with every attached key ID; physical slots remain a different field" width={width} height={435}>
    <GqaCells x={216} y={60} values={[positions.map((_, i) => i), positions]} role="input" width={90} label="Physical slots above; attached key IDs below" rows={['slots', 'key IDs']}/>
    <GqaCells x={72} y={227} values={queryPositions.map(id => [id])} role="input" label="Query IDs" width={106}/>
    <GqaArrow x1={178} y1={269} x2={215} y2={269}/><GqaCells x={216} y={227} values={legal.map(row => row.map(value => value ? 1 : '×'))} label={upperLeft ? 'Local row/column permission triangle' : 'Compare attached key ID ≤ query ID'} width={90}/>
    <GqaArrow path={`M${216 + positions.length * 45} 145 V190`}/>
    <GqaText x={width / 2} y={358}>1 permits a comparison; × removes that record from the normalized read.</GqaText>
    <GqaText x={width / 2} y={390}>Both rows reuse the same edited projected queries.</GqaText>
    <GqaText x={width / 2} y={421}>Their attached permission IDs differ.</GqaText>
  </GqaDrawing>;
}
export function GqaCompactAppendDrawing() {
  const state = groupedDefaults(), id = 2, keys = state.keys.map(group => group[id]), values = state.values.map(group => group[id]);
  const rotated = { ...state, query: state.query.map(q => rotate(q, id)), keys: state.keys.map(group => group.map((key, i) => rotate(key, i))) };
  const outputs = groupedRead(rotated).map(row => row.output);
  return <GqaDrawing label="Four rotated new queries read three occupied native-head records; only unique keys and values enter the compact cache" width={1060} height={1430}>
    <GqaCells x={28} y={75} values={state.query} label="Four new projected queries" width={95}/>
    <GqaCells x={382} y={75} values={keys} label="Two new projected keys" width={95}/>
    <GqaCells x={736} y={75} values={values} label="Two projected values" width={95}/>
    <GqaArrow x1={123} y1={243} x2={123} y2={290}/><GqaOperation x={123} y={310} label="turn pairs at ID2" width={202}/>
    <GqaArrow x1={477} y1={159} x2={477} y2={290}/><GqaOperation x={477} y={310} label="turn pairs at ID2" width={202}/>
    <GqaArrow x1={123} y1={330} x2={123} y2={409}/><GqaArrow x1={477} y1={330} x2={477} y2={409}/>
    <GqaCells x={28} y={409} values={rotated.query} label="Rotated current queries" width={95}/>
    <GqaCells x={382} y={409} values={keys.map(key => rotate(key, id))} label="Rotated unique keys" width={95}/>
    <GqaArrow path="M831 159 V368 H970 V451 H926"/><GqaCells x={736} y={409} values={values} label="Unchanged values" width={95}/>
    <GqaArrow path="M477 493 V555 H495 V620"/><GqaArrow path="M831 493 V555 H715 V620"/>
    <GqaCells x={385} y={620} values={keys.map((key, g) => [...rotate(key, id), ...values[g]])} width={110} label="New slot2: group rows; key x/y | value x/y" rows={['g0', 'g1']}/>
    <GqaText x={933} y={591}>Capacity5</GqaText>
    {[0,1,2,3,4].map(slot => <g key={slot}><rect x={889} y={620 + slot * 43} width={118} height={36} stroke={slot < 3 ? gqaColors.computed : gqaColors.edge} fill="none" strokeDasharray={slot < 3 ? undefined : '4 3'}/><GqaText x={948} y={644 + slot * 43}>{slot}: {slot < 3 ? 'occupied' : 'free'}</GqaText></g>)}
    <GqaText x={530} y={787}>Append beside the two unchanged old records; three of five slots are occupied.</GqaText>
    {[0,1].map(g => <g key={g}><GqaCells x={55 + g * 530} y={866} values={rotated.keys[g].map((key, i) => [...key, ...state.values[g][i]])} width={98} label={'Occupied group' + g + ' key | value records'} rows={['ID0', 'ID1', 'ID2']}/><GqaArrow path={'M' + (495 + g * 220) + ' 704 V740 H' + (g ? 781 : 251) + ' V866'}/><GqaArrow path={'M' + (g ? 781 : 251) + ' 992 V1110 H' + (g ? 675 : 385)}/></g>)}
    <GqaArrow path="M123 577 H12 V1110 H385"/><GqaOperation x={530} y={1110} label="four grouped reads" width={290}/>
    <GqaText x={530} y={1050}>Only occupied records enter each legal softmax and weighted value sum.</GqaText>
    <GqaArrow x1={530} y1={1130} x2={530} y2={1210}/><GqaCells x={420} y={1210} values={outputs} width={110} label="Four transient head outputs" rows={['h0', 'h1', 'h2', 'h3']}/>
    <GqaText x={530} y={1413}>Old queries and the new outputs are not persistent K/V cache fields.</GqaText>
  </GqaDrawing>;
}
export function GqaPayloadDrawing({ state }) {
  const kv = state.kvHeads, visible = kv > 3 ? [0, 1, kv - 1] : Array.from({ length: kv }, (_, i) => i), budget = cacheBudget(state);
  return <GqaDrawing label="One compact cache row contains key and value coordinate fields; KV heads, positions, layers and requests repeat that storage" width={1000} height={555}>
    <GqaText x={274} y={28}>One occupied position in one layer</GqaText>
    {visible.map((head, row) => <g key={head}><GqaText x={48} y={94 + row * 65}>KV {head}</GqaText>
      <GqaCells x={104} y={67 + row * 65} values={state.keyWidth === 1 ? ['k0'] : state.keyWidth === 2 ? ['k0', 'k1'] : ['k0', '…', `k${state.keyWidth - 1}`]} width={65}/>
      <GqaCells x={332} y={67 + row * 65} values={state.valueWidth === 1 ? ['v0'] : state.valueWidth === 2 ? ['v0', 'v1'] : ['v0', '…', `v${state.valueWidth - 1}`]} width={65}/>
    </g>)}
    <GqaText x={202} y={65 + visible.length * 65}>Key field: {state.keyWidth} numbers</GqaText><GqaText x={430} y={65 + visible.length * 65}>Value field: {state.valueWidth} numbers</GqaText>
    <GqaText x={275} y={106 + visible.length * 65}>{visible.length} of {kv} KV rows pictured; {state.bytes} bytes per stored number.</GqaText>
    <GqaArrow x1={536} y1={160} x2={596} y2={160}/>
    {[0, 1, 2].map(i => <g key={i}><rect x={618 + i * 9} y={63 + i * 10} width={235} height={163} fill="none" stroke={gqaColors.computed}/>{[0, 1, 2].map(j => <path key={j} d={`M${630 + i * 9} ${91 + i * 10 + j * 38} H${838 + i * 9}`} stroke={gqaColors.edge}/> )}</g>)}
    <GqaText x={753} y={287}>Repeat at {state.length} occupied positions.</GqaText>
    <GqaText x={753} y={321}>Then repeat through {state.layers} layers.</GqaText>
    <GqaText x={753} y={355}>Then repeat for {state.batch} requests.</GqaText>
    <GqaArrow x1={753} y1={374} x2={753} y2={405}/><GqaCells x={573} y={433} values={[budget.total]} width={360} label="Exact current K/V payload bytes" digits={0}/>
    <GqaText x={280} y={397}>{state.queryHeads} query readers do not add stored rows.</GqaText>
    <GqaText x={500} y={522}>Stack outlines indicate repeated axes; unoccupied capacity, position IDs and metadata are separate costs.</GqaText>
  </GqaDrawing>;
}
export function GqaMeanConversionDrawing({ state, result }) {
  return <GqaDrawing label="Two scalar readers use their original keys and values, then the shared candidate arrays; compare both weight rows and actual outputs" width={1030} height={745}>
    <GqaCells x={60} y={65} values={state.query.map(q => [q])} width={105} label="Two queries" rows={['head0', 'head1']}/>
    <GqaCells x={266} y={65} values={state.keys} width={102} label="Original K: each head's slots"/>
    <GqaCells x={717} y={65} values={state.values} width={102} label="Original V: each head's slots"/>
    <GqaArrow path="M154 106 H230 V256 H266"/><GqaArrow path="M368 149 V183 H493 V277 H470"/>
    <GqaCells x={266} y={235} values={result.map(row => row.originalWeights)} width={102} label="Original matching weights"/>
    <GqaArrow x1={470} y1={277} x2={536} y2={277}/><GqaArrow path="M819 149 V197 H694 V298 H678"/>
    <GqaCells x={543} y={255} values={result.map(row => [row.original])} width={135} label="Original outputs" rows={['head0', 'head1']}/>
    <GqaCells x={266} y={421} values={[result[0].sharedKeys]} width={102} label="One shared candidate key row"/>
    <GqaCells x={717} y={421} values={[result[0].sharedValues]} width={102} label="One shared candidate value row"/>
    <GqaArrow path="M154 149 H202 V595 H266"/><GqaArrow path="M368 463 V495 H493 V595 H470"/>
    <GqaCells x={266} y={553} values={result.map(row => row.convertedWeights)} width={102} label="New matching weights"/>
    <GqaArrow x1={470} y1={595} x2={536} y2={595}/><GqaArrow path="M819 463 V504 H694 V618 H678"/>
    <GqaCells x={543} y={576} values={result.map(row => [row.converted])} width={135} label="New outputs" rows={['head0', 'head1']}/>
    <GqaText x={515} y={704}>The starting candidates are coordinate means; your candidate offsets may change them.</GqaText><GqaText x={515} y={734}>A smaller projection distance does not imply preserved matching weights or outputs.</GqaText>
  </GqaDrawing>;
}
export function GqaMeanDistanceDrawing({ originals, candidate, mean, label }) {
  const all = [...originals, candidate, mean], low = Math.min(-1, ...all.flat()) - 1, high = Math.max(3, ...all.flat()) + 1, span = high - low;
  const px = value => 85 + (value - low) / span * 380, py = value => 455 - (value - low) / span * 380;
  const distance = originals.reduce((sum, row) => sum + row.reduce((s, value, j) => s + (value - candidate[j]) ** 2, 0), 0);
  const minimum = originals.reduce((sum, row) => sum + row.reduce((s, value, j) => s + (value - mean[j]) ** 2, 0), 0);
  return <GqaDrawing label={`${label}: both original two-slot projection rows connect to a shared candidate in projection-coordinate space`} width={900} height={550}>
    <path d="M85 75 V455 H465" fill="none" stroke={gqaColors.edge}/><GqaText x={280} y={515}>slot0 coordinate</GqaText><GqaText x={43} y={257}>slot1</GqaText>
    {[0, 1, 2, 3, 4].map(i => { const value = low + span * i / 4; return <g key={i}><GqaText x={px(value)} y={479}>{number(value, 2)}</GqaText><GqaText x={74} y={py(value) + 5} anchor="end">{number(value, 2)}</GqaText></g>; })}
    {originals.map((row, i) => <g key={i}><path d={`M${px(row[0])} ${py(row[1])} L${px(candidate[0])} ${py(candidate[1])}`} stroke={gqaColors.edge} fill="none"/><circle cx={px(row[0])} cy={py(row[1])} r={6} fill={gqaColors.computed}/><GqaArrow path={`M${px(row[0])} ${py(row[1])} H${510 + i * 12} V${87 + i * 80} H545`}/><GqaText x={554} y={92 + i * 80} anchor="start">Original head{i}: {gqaVector(row)}</GqaText></g>)}
    <circle cx={px(mean[0])} cy={py(mean[1])} r={10} fill="none" stroke={gqaColors.operation}/><GqaArrow path={`M${px(mean[0])} ${py(mean[1])} H520 V247 H545`}/><GqaText x={554} y={252} anchor="start">Mean: {gqaVector(mean)}</GqaText>
    <path d={`M${px(candidate[0]) - 8} ${py(candidate[1])} h16 M${px(candidate[0])} ${py(candidate[1]) - 8} v16`} stroke={gqaColors.computed} strokeWidth={3}/><GqaArrow path={`M${px(candidate[0])} ${py(candidate[1])} H533 V327 H545`}/><GqaText x={554} y={332} anchor="start">Candidate: {gqaVector(candidate)}</GqaText>
    <GqaText x={641} y={421}>Squared distance sum: {number(distance)}</GqaText><GqaText x={641} y={459}>Mean's minimum: {number(minimum)}</GqaText>
    <GqaText x={641} y={497}>Excess: {number(distance - minimum)}</GqaText>
  </GqaDrawing>;
}
export function GqaSharedGradientDrawing({ weights, upstream }) {
  const writes = weights.map(w => 2 * w), contributions = weights.map((w, i) => w * upstream[i]);
  return <GqaDrawing label="One shared value coordinate2 feeds two weighted reader outputs; their backward contributions add at that one shared coordinate" width={860} height={510}>
    <GqaCells x={20} y={245} values={[2]} width={118} label="Shared value v"/>
    {[0, 1].map(i => <g key={i}>
      <GqaCells x={320} y={65 + i * 205} values={[weights[i]]} width={120} label={`Reader${i} weight a${i}`}/>
      <GqaArrow x1={380} y1={107 + i * 205} x2={380} y2={160 + i * 205}/><GqaOperation x={380} y={180 + i * 205} label="×" width={44}/>
      <GqaArrow path={`M138 266 H230 V${180 + i * 205} H358`}/><GqaArrow x1={402} y1={180 + i * 205} x2={466} y2={180 + i * 205}/>
      <GqaCells x={470} y={159 + i * 205} values={[writes[i]]} width={124} label={`Write o${i}`}/>
      <GqaCells x={715} y={159 + i * 205} values={[upstream[i]]} width={130} role="input" label={`Loss derivative u${i}`}/>
      <GqaArrow x1={715} y1={180 + i * 205} x2={594} y2={180 + i * 205} backward/>
      <GqaArrow path={`M532 ${201 + i * 205} V${225 + i * 205} H380 V${200 + i * 205}`} backward/>
      <GqaText x={599} y={246 + i * 205} role="backward">a{i}u{i} = {number(contributions[i])}</GqaText>
      <GqaArrow path={`M358 ${200 + i * 205} H188 V${i ? 330 : 290}`} backward/>
    </g>)}
    <GqaOperation x={188} y={310} label="+" width={44}/><GqaArrow path="M188 330 V389 H138" backward/>
    <GqaCells x={20} y={368} values={[contributions.reduce((a, b) => a + b, 0)]} width={118} label="∂loss/∂v"/>
    <GqaText x={430} y={494}>Dashed orange derivatives sum at the shared coordinate, with no additional group average.</GqaText>
  </GqaDrawing>;
}
export function GqaAffineFoldingDrawing({ first = .25, second = .75 }) {
  const folded = [[first, second], [-second, 2 * first]], bias = [first - second, 2 * second], output = [3 * first - 2 * second, -2 * first];
  const preBias = [2 * first - second, -2 * second - 2 * first];
  return <GqaDrawing label="Two learned affine projections are linearly combined, or their weighted maps and biases are folded into one identical projection" width={1000} height={1090}>
    <GqaCells x={394} y={55} values={[2, -1]} role="input" label="Supplied x"/>
    <GqaArrow path="M500 97 V123 H230 V202"/><GqaArrow path="M500 97 V123 H724 V202"/>
    <GqaCells x={70} y={202} values={[[1, 0], [0, 2]]} width={94} role="parameter" label="Map0"/><GqaCells x={300} y={223} values={[1, 0]} width={90} role="parameter" label="Bias0"/>
    <GqaCells x={568} y={202} values={[[0, 1], [-1, 0]]} width={94} role="parameter" label="Map1"/><GqaCells x={800} y={223} values={[-1, 2]} width={90} role="parameter" label="Bias1"/>
    <GqaArrow x1={164} y1={286} x2={164} y2={303}/><GqaOperation x={164} y={323} label="+ bias" width={130}/><GqaArrow path="M390 265 V323 H229"/><GqaArrow path="M164 343 V354 H45 V416 H70"/>
    <GqaCells x={70} y={395} values={[3, -2]} width={94} label="Projected row0"/>
    <GqaArrow x1={662} y1={286} x2={662} y2={303}/><GqaOperation x={662} y={323} label="+ bias" width={130}/><GqaArrow path="M890 265 V323 H727"/><GqaArrow path="M662 343 V354 H543 V416 H568"/>
    <GqaCells x={568} y={395} values={[-2, 0]} width={94} label="Projected row1"/>
    <GqaArrow path="M164 437 V495 H378"/><GqaArrow path="M662 437 V495 H590"/><GqaOperation x={484} y={495} label={`× ${number(first)} + × ${number(second)}`} width={210}/>
    <GqaArrow path="M484 515 V527 H350 V578 H378"/><GqaCells x={378} y={557} values={output} label="Explicit combined output"/>
    <GqaText x={500} y={627}>Now apply the one folded map and bias to the same input.</GqaText>
    <GqaCells x={35} y={735} values={[2, -1]} role="input" width={95} label="Same supplied x"/>
    <GqaArrow x1={225} y1={756} x2={314} y2={756}/><GqaCells x={318} y={735} values={folded} role="parameter" width={100} label="Folded map"/>
    <GqaArrow x1={518} y1={756} x2={588} y2={756}/><GqaCells x={592} y={735} values={preBias} width={115} label="Map × x before bias"/>
    <GqaCells x={318} y={866} values={bias} role="parameter" width={100} label="Folded bias"/><GqaArrow x1={518} y1={887} x2={665} y2={887}/>
    <GqaArrow x1={707} y1={777} x2={707} y2={866}/><GqaOperation x={707} y={887} label="+" width={80}/>
    <GqaArrow x1={707} y1={908} x2={707} y2={945}/><GqaCells x={592} y={977} values={output} width={115} label="Identical combined output"/>
    <GqaText x={500} y={1050}>These coefficients mix affine maps, not normalized token-matching probabilities.</GqaText>
  </GqaDrawing>;
}
export function GqaParameterShapesDrawing({ state }) {
  const entries = [
    ['Query map', state.queryHeads * state.keyWidth, state.modelWidth],
    ['Key map', state.kvHeads * state.keyWidth, state.modelWidth],
    ['Value map', state.kvHeads * state.valueWidth, state.modelWidth],
    ['Output map', state.modelWidth, state.queryHeads * state.valueWidth],
  ];
  return <GqaDrawing label="The four learned map arrays have independent input/output dimensions; all query outputs concatenate before the output map returns model-width features" width={1040} height={330}>
    {entries.map(([label, rows, columns], i) => <g key={label}>
      <GqaCells x={28 + i * 260} y={65} values={Array.from({ length: Math.min(3, rows) }, (_, r) => Array.from({ length: Math.min(3, columns) }, (_, c) => (rows > 3 && r === 1) || (columns > 3 && c === 1) ? '…' : 'w'))} width={68} role="parameter" label={label}/>
      <GqaText x={130 + i * 260} y={246}>{rows} rows × {columns} columns</GqaText><GqaText x={130 + i * 260} y={286}>{rows * columns} weights</GqaText>
    </g>)}
    <GqaText x={520} y={323}>Each w is a separate unknown weight; first/last-coordinate cutaways omit the middle. Counts exclude biases.</GqaText>
  </GqaDrawing>;
}
export function GqaAmdahlDrawing({ fraction, factor }) {
  const remainder = 1 - fraction, cost = remainder + fraction / factor, x = value => 70 + 700 * value;
  return <GqaDrawing label="A declared baseline cost1 consists of unchanged work plus reducible cache traffic; reducing only traffic leaves the rest intact" width={850} height={330}>
    <GqaText x={70} y={28} anchor="start">Assumed baseline cost = 1</GqaText>
    <rect x={70} y={54} width={700 * remainder} height={42} fill="#e8e6df22" stroke={gqaColors.operation}/><rect x={x(remainder)} y={54} width={700 * fraction} height={42} fill="#be9cf52b" stroke={gqaColors.computed}/>
    <GqaText x={230} y={128}>Unchanged: {number(remainder)}</GqaText><GqaText x={600} y={128} role="computed">Cache traffic: {number(fraction)}</GqaText>
    <GqaText x={70} y={181} anchor="start">After traffic-only reduction by {number(factor)}</GqaText>
    <rect x={70} y={205} width={700 * remainder} height={42} fill="#e8e6df22" stroke={gqaColors.operation}/><rect x={x(remainder)} y={205} width={700 * fraction / factor} height={42} fill="#be9cf52b" stroke={gqaColors.computed}/>
    <path d={`M${x(cost)} 253 V265 H790`} stroke={gqaColors.edge} fill="none"/><GqaText x={790} y={286} anchor="end">New total = {number(cost)}; modeled speed factor {number(1 / cost)}</GqaText>
    <GqaText x={425} y={323}>An assumption calculation, not a measured timeline or an estimate of every model/device.</GqaText>
  </GqaDrawing>;
}
export function gqaConvexHull(points) {
  const sorted = [...new Map(points.map(point => [point.join(','), point])).values()].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (sorted.length < 3) return sorted;
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const half = rows => { const result = []; for (const row of rows) { while (result.length > 1 && cross(result.at(-2), result.at(-1), row) <= 0) result.pop(); result.push(row); } return result; };
  const lower = half(sorted), upper = half([...sorted].reverse());
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
export function GqaValueMixtureDrawing({ state, head, row }) {
  const group = state.mapping[head], values = state.values[group], count = values.length;
  const low = Math.min(-.5, ...values.flat()) - .75, high = Math.max(.5, ...values.flat()) + .75, span = high - low;
  const px = value => 75 + (value - low) / span * 350, py = value => 435 - (value - low) / span * 350;
  const start = [px(0), py(0)], hull = gqaConvexHull(values);
  const accumulated = [[0, 0]];
  row?.contributions.forEach(value => accumulated.push(accumulated.at(-1).map((x, j) => x + value[j])));
  const height = Math.max(550, count * 75 + 130);
  return <GqaDrawing label={`Head${head} mixes group${group} values; head-to-tail weighted arrows end at the exact output, inside the current value hull`} width={950} height={height}>
    <path d={`M75 ${py(0)} H425 M${px(0)} 85 V435`} stroke={gqaColors.edge} fill="none"/>
    <GqaText x={250} y={510}>value x coordinate</GqaText><GqaText x={90} y={49}>value y coordinate</GqaText>
    {[0, 1, 2, 3, 4].map(i => { const value = low + span * i / 4; return <g key={i}><GqaText x={px(value)} y={465}>{number(value, 2)}</GqaText><GqaText x={64} y={py(value) + 5} anchor="end">{number(value, 2)}</GqaText></g>; })}
    {hull.length > 2 ? <polygon points={hull.map(v => `${px(v[0])},${py(v[1])}`).join(' ')} fill="#be9cf50f" stroke={gqaColors.computed}/> : hull.length === 2 ? <path d={`M${px(hull[0][0])} ${py(hull[0][1])} L${px(hull[1][0])} ${py(hull[1][1])}`} stroke={gqaColors.computed}/> : null}
    {values.map((value, i) => <g key={i}>
      <path d={`M${start[0]} ${start[1]} L${px(value[0])} ${py(value[1])}`} stroke={gqaColors.computed} strokeDasharray="3 4" fill="none"/>
      <circle cx={px(value[0])} cy={py(value[1])} r={5} fill={gqaColors.computed}/>
      <GqaArrow path={`M${px(value[0])} ${py(value[1])} H${475 + i * 4} V${80 + i * 75} H525`}/>
      <GqaText x={537} y={85 + i * 75} anchor="start">ID{state.positions[i]} value {gqaVector(value, 4)}</GqaText>
      {row ? <><GqaArrow x1={px(accumulated[i][0])} y1={py(accumulated[i][1])} x2={px(accumulated[i + 1][0])} y2={py(accumulated[i + 1][1])} color={gqaColors.computed}/>
        <GqaArrow path={`M${px((accumulated[i][0] + accumulated[i + 1][0]) / 2)} ${py((accumulated[i][1] + accumulated[i + 1][1]) / 2)} H${510 + i * 3} V${110 + i * 75} H525`}/>
        <GqaText x={537} y={115 + i * 75} anchor="start">Mass {number(row.weights[i], 4)}; write {gqaVector(row.contributions[i], 4)}</GqaText></> : <GqaText x={537} y={115 + i * 75} anchor="start">No legal normalized read; contribution undefined.</GqaText>}
    </g>)}
    {row && <><GqaArrow x1={start[0]} y1={start[1]} x2={px(row.output[0])} y2={py(row.output[1])} color={gqaColors.operation}/><GqaArrow path={`M${px(row.output[0])} ${py(row.output[1])} H505 V${height - 75} H525`}/><GqaText x={537} y={height - 70} anchor="start">Output {gqaVector(row.output, 4)}</GqaText></>}
    <GqaText x={475} y={height - 22}>Dotted rays locate stored values; solid violet segments add weighted writes; white gives the final sum.</GqaText>
  </GqaDrawing>;
}
export function GqaPairedReadersDrawing({ state, group, rows }) {
  const readers = state.mapping.map((g, head) => g === group ? head : null).filter(head => head !== null), count = state.positions.length;
  const lower = 170 + count * 42, outputY = lower + readers.length * 42 + 115;
  return <GqaDrawing label={`Every current reader of group${group} compares its own query with the same key rows and mixes the same value rows`} width={1040} height={outputY + readers.length * 42 + 95}>
    <GqaCells x={95} y={65} values={state.keys[group]} label={`Shared group${group} keys`} width={102} rows={state.positions.map(id => `ID${id}`)}/>
    <GqaCells x={740} y={65} values={state.values[group]} label={`Shared group${group} values`} width={102}/>
    <GqaCells x={55} y={lower} values={readers.map(head => state.query[head])} label="Their separate queries" width={92} rows={readers.map(head => `h${head}`)}/>
    <GqaArrow x1={239} y1={lower + readers.length * 21} x2={295} y2={lower + readers.length * 21}/>
    <GqaCells x={295} y={lower} values={readers.map(head => rows?.[head].weights ?? state.positions.map(() => '—'))} width={86} label="Matching weights"/>
    <GqaArrow path={`M197 ${65 + count * 42} V${65 + count * 42 + 25} H${Math.min(1010, 350 + count * 86)} V${lower + 21} H${295 + count * 86}`}/>
    <GqaCells x={405} y={outputY} values={readers.map(head => rows?.[head].output ?? ['—', '—'])} width={112} label="Distinct current mixed outputs" rows={readers.map(head => `h${head}`)}/>
    <GqaArrow path={`M${295 + count * 43} ${lower + readers.length * 42} V${outputY - 65} H672 V${outputY + readers.length * 21} H629`}/>
    <GqaArrow path={`M842 ${65 + count * 42} V${65 + count * 42 + 40} H1028 V${outputY + readers.length * 21} H629`}/>
    <GqaText x={520} y={outputY + readers.length * 42 + 67}>A shared key change can affect these rows differently; orthogonal queries may keep exactly the same score.</GqaText>
  </GqaDrawing>;
}
