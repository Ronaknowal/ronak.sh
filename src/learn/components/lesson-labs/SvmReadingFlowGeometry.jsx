import { useState } from 'react';
import { FlowLab, FlowSlider } from './LessonFlow.jsx';
import { marginGeometry, supportMotion, softPairState, hingeStep, sum } from '../../data/svm-reading-flow-models.js';
import { Scene, Text, Wire, Port, Mark, Bracket, Plane, Curve, Grid, number as n, vectorText as v, colors as c, FlowControls, FlowReadout, ExactInput, Select, Reset, ExactTable } from './SvmReadingFlowDrawing.jsx';

export function ScoreCircuit() {
  return <><div className="svm-flow-desktop"><Scene label="Two input-weight products join the bias to make score 3 and sign +1" width={740} height={340}>
    {[{ x: 2, w: 1, hue: c.first }, { x: 1, w: 2, hue: c.second }].map((row, i) => <g key={i}>
      <Port x={25} y={85 + i * 130} label={`input x${i + 1}`} value={row.x} hue={row.hue} width={100}/>
      <Port x={155} y={25 + i * 130} label={`weight w${i + 1}`} value={row.w} hue={c.query} width={100}/>
      <Wire x1={125} y1={106 + i * 130} x2={285} y2={106 + i * 130} hue={row.hue} arrow/>
      <Wire x1={255} y1={46 + i * 130} x2={285} y2={95 + i * 130} hue={c.query} arrow/>
      <Port x={285} y={85 + i * 130} label={`multiply x${i + 1} × w${i + 1}`} value={`${row.x} × ${row.w} = 2`} hue={row.hue} width={140}/>
      <Wire x1={425} y1={106 + i * 130} x2={475} y2={171} hue={row.hue} arrow/>
    </g>)}
    <Text x={495} y={55} hue={c.query}>bias b = −1</Text><Wire x1={530} y1={65} x2={530} y2={150} hue={c.query} arrow/>
    <Port x={475} y={150} label="sum + bias" value="2 + 2 − 1 = 3" width={150}/>
    <Wire x1={625} y1={171} x2={670} y2={171} arrow/><Text x={635} y={217} hue={c.positive}>sign +1</Text>
  </Scene></div><div className="svm-flow-compact"><Scene label="The same two input-weight products, recomposed vertically" width={300} height={555}>
    {[{x:2,w:1,hue:c.first,left:10},{x:1,w:2,hue:c.second,left:165}].map((row,i)=><g key={i}>
      <Port x={row.left} y={55} label={`input x${i+1}`} value={row.x} hue={row.hue} width={120}/><Port x={row.left} y={135} label={`weight w${i+1}`} value={row.w} hue={c.query} width={120}/>
      <Wire x1={row.left+120} y1={76} x2={row.left+133} y2={76} hue={row.hue}/><Wire x1={row.left+133} y1={76} x2={row.left+133} y2={230} hue={row.hue}/><Wire x1={row.left+133} y1={230} x2={row.left+120} y2={230} hue={row.hue} arrow/>
      <Wire x1={row.left+60} y1={177} x2={row.left+60} y2={205} hue={c.query} arrow/><Port x={row.left} y={205} label={`multiply x${i+1}×w${i+1}`} value={`${row.x}×${row.w}=2`} hue={row.hue} width={120}/>
      <Wire x1={row.left+60} y1={247} x2={i ? 220 : 85} y2={315} hue={row.hue} arrow/>
    </g>)}<Port x={55} y={315} label="sum + bias" value="2+2−1 = 3" width={195}/><Port x={55} y={400} label="bias b" value="−1" hue={c.query} width={195}/><Wire x1={152} y1={400} x2={152} y2={357} hue={c.query} arrow/>
    <Wire x1={250} y1={336} x2={275} y2={336}/><Wire x1={275} y1={336} x2={275} y2={501}/><Wire x1={275} y1={501} x2={250} y2={501} arrow/><Port x={55} y={480} label="sign of score" value="class +1" hue={c.positive} width={195}/>
  </Scene></div></>;
}
export function Geometry({ state, setState, canonical = false }) {
  const g = marginGeometry(state.angle, state.offset, state.scale), factor = canonical && g.separating ? 1 / (state.scale * g.geometricMargin) : 1;
  const w = g.w.map(x => x * factor), b = g.b * factor, norm = Math.hypot(...w);
  const sideLabel = (side, map) => {
    // Keep labels in their actual signed half-plane. Try nearby placements
    // against observation glyphs, their names, axis labels and margin labels.
    const box = (x, y, width, height = 22) => ({ x, y, width, height });
    const overlaps = (a, z) => Math.min(a.x + a.width, z.x + z.width) > Math.max(a.x, z.x) && Math.min(a.y + a.height, z.y + z.height) > Math.max(a.y, z.y);
    const occupied = g.rows.flatMap(row => { const [x, y] = map(row.x); return [box(x - 12, y - 12, 24, 24), box(x + 10, y - 28, 17)]; });
    const origin = map([0, 0]);
    occupied.push(box(380, origin[1] + 6, 22), box(origin[0] + 10, 17, 22), box(43, origin[1] + 7, 18), box(357, origin[1] + 7, 20), box(origin[0] - 32, 37, 22), box(origin[0] - 32, 353, 22));
    const point = (level, tangent) => map(w.map((x, i) => (level - b) * x / norm ** 2 + (i ? g.normal[0] : -g.normal[1]) * tangent));
    const levels = canonical && g.separating ? [-1, 0, 1] : [0];
    levels.forEach(level => { const [x, y] = point(level, canonical && g.separating ? 1.45 : 2.5); occupied.push(box(x + 8, y - 30, 38)); });
    if (canonical && g.separating) for (const [tangent, lo, hi, width] of [[-1.6, 0, 1, 145], [-2.3, -1, 1, 110]]) { const a = point(lo, tangent), z = point(hi, tangent); occupied.push(box((a[0] + z[0]) / 2 - width / 2, (a[1] + z[1]) / 2 + 7, width)); }
    for (const distance of [1.25, 1.7, .8, 2.2]) for (const tangent of [2, 1.5, -1.5, -2, 2.5, -2.5]) {
      const p = map(w.map((x, i) => -b * x / norm ** 2 + side * distance * x / norm + (i ? g.normal[0] : -g.normal[1]) * tangent));
      const x = p[0] + side * 12, y = p[1], label = box(side < 0 ? x - 34 : x, y - 18, 34);
      if (p[0] >= 52 && p[0] <= 368 && p[1] >= 52 && p[1] <= 368 && label.x >= 8 && label.x + label.width <= 412 && !occupied.some(other => overlaps(label, other))) return <Text key={side} x={x} y={y} anchor={side < 0 ? 'end' : 'start'} hue={side < 0 ? c.negative : c.positive}>{side < 0 ? 'f<0' : 'f>0'}</Text>;
    }
    throw Error('No clear signed-side label placement in the accepted geometry domain.');
  };
  return <FlowLab label={canonical ? 'Canonical one-sided and full corridor' : 'Rotate or shift the same-scale boundary'}>
    <Plane points={g.rows.map(row => ({ ...row, support: canonical && Math.abs(row.labelDistance - g.geometricMargin) < 1e-9 }))} w={w} b={b} levels={canonical && g.separating ? [-1, 0, 1] : [0]} size={420} showBoundaryLabels>
      {map => <g>
        {[-1, 1].map(side => sideLabel(side, map))}
        {!(canonical && g.separating) && (() => { const p = map(w.map((x, i) => -b * x / norm ** 2 + (i ? g.normal[0] : -g.normal[1]) * 2.5)); return <Text x={p[0] + 10} y={p[1] - 12} hue={c.query}>f=0</Text>; })()}
        {canonical && g.separating && <g>{[-1, 0, 1].map(level => { const p = map(w.map((x, i) => (level - b) * x / norm ** 2 + (i ? g.normal[0] : -g.normal[1]) * 1.45)); return <Text key={level} x={p[0] + 10} y={p[1] - 12}>f={level}</Text>; })}
        {[{ lo: 0, hi: 1, tangent: -1.6, title: 'one side', value: 1 / norm }, { lo: -1, hi: 1, tangent: -2.3, title: 'full', value: 2 / norm }].map(row => { const point = level => map(w.map((x, i) => (level - b) * x / norm ** 2 + (i ? g.normal[0] : -g.normal[1]) * row.tangent)), a = point(row.lo), z = point(row.hi), tangent = [-g.normal[1] * 5, -g.normal[0] * 5]; return <g key={row.title}><Wire x1={a[0]} y1={a[1]} x2={z[0]} y2={z[1]} hue={c.query}/>{[a, z].map((p, i) => <Wire key={i} x1={p[0] - tangent[0]} y1={p[1] - tangent[1]} x2={p[0] + tangent[0]} y2={p[1] + tangent[1]} hue={c.query}/>)}<Text x={(a[0] + z[0]) / 2} y={(a[1] + z[1]) / 2 + 25} anchor="middle" hue={c.query}>{row.title} {n(row.value)}</Text></g>; })}
        </g>}
      </g>}
    </Plane>
    {!canonical && <FlowControls><FlowSlider name="Angle (degrees)" value={state.angle} onChange={angle => setState({ ...state, angle })} min={-45} max={45} step={5}/><FlowSlider name="Boundary offset" value={state.offset} onChange={offset => setState({ ...state, offset })} min={-.75} max={.75} step={.05}/><FlowSlider name="Positive score scale" value={state.scale} onChange={scale => setState({ ...state, scale })} min={.5} max={3} step={.25}/><Reset onClick={() => setState({ angle: 0, offset: 0, scale: 1 })}/></FlowControls>}
    <FlowReadout>{canonical ? g.separating ? `Rescale the minimum signed score to 1: w=${v(w)}, b=${n(b)}. The perpendicular one-sided margin is ${n(1 / norm)}; the full corridor is ${n(2 / norm)}.` : 'Some labeled distances are nonpositive: canonical hard-margin rescaling is unavailable.' : `w=${v(w)}, b=${n(b)}; nearest labeled distance ${n(g.geometricMargin)} at ${g.nearest.id}. ${g.separating ? 'The line separates all six rows.' : 'The line fails at least one label.'}`}</FlowReadout>
    <ExactTable caption="Each observation retains its actual score, signed distance and perpendicular foot" columns={['Row / label', 'x', 'f(x)', 'distance', 'foot']} rows={g.rows.map(row => [ `${row.id} / ${row.y > 0 ? '+1' : '−1'}`, v(row.x), n(row.score), n(row.signedDistance), v(row.projection) ])}/>
  </FlowLab>;
}
export function Foot({ scaling = false }) {
  const [scale, setScale] = useState(1);
  return <FlowLab label={scaling ? 'Positive scaling changes scores, not distance' : 'Shortest perpendicular route to the affine boundary'}>
    <Plane points={[]} w={[scale, 2 * scale]} b={-scale} query={[2, 1]} foot={[1.4, -.2]} size={400}>
      {map => <g><Text x={20} y={375}>foot (1.4, −.2); displacement (.6, 1.2)</Text><Text x={20} y={395} hue={c.query}>distance 3/√5 ≈ 1.34164</Text></g>}
    </Plane>
    {scaling && <><Scene label="Linked score and weight norm rulers" width={570} height={160}>
      {[{ title: 'score', value: 3 * scale, initial: 3, max: 9 }, { title: 'weight norm', value: Math.sqrt(5) * scale, initial: Math.sqrt(5), max: 3 * Math.sqrt(5) }].map((row, i) => <g key={i}><Text x={20} y={35 + i * 70}>{row.title}</Text><Wire x1={170} y1={30 + i * 70} x2={520} y2={30 + i * 70}/><circle cx={170 + 350 * row.initial / row.max} cy={30 + i * 70} r="5" fill={c.neutral}/><circle cx={170 + 350 * row.value / row.max} cy={30 + i * 70} r="6" fill={c.query}/><Text x={175} y={56 + i * 70}>{n(row.initial)} → {n(row.value)}</Text></g>)}
    </Scene><FlowControls><FlowSlider name="Positive scale" value={scale} onChange={setScale} min={1} max={3} step={.25}/><Reset onClick={() => setScale(1)}/></FlowControls><FlowReadout>The score is {n(3 * scale)} and norm {n(Math.sqrt(5) * scale)}; their ratio stays {n(3 / Math.sqrt(5))}. The foot and zero line stay fixed.</FlowReadout></>}
  </FlowLab>;
}
export function SupportMotion() {
  const [z, setZ] = useState(2), s = supportMotion(z), px = x => 70 + (x + 2) * 100;
  return <FlowLab label="Move a positive observation and compare old and refit corridors"><Scene label="One-dimensional input locations with old and refit corridor" width={630} height={270}>
    {[{ y: 70, title: 'old w=1, b=0', bounds: [-1, 0, 1] }, { y: 190, title: `refit w=${n(s.w)}, b=${n(s.b)}`, bounds: [-1, s.boundary, s.nearestPositive] }].map(row => <g key={row.y}><Text x={25} y={row.y - 40}>{row.title}</Text><Wire x1={50} y1={row.y} x2={590} y2={row.y} arrow/>{row.bounds.map((x, i) => <Wire key={i} x1={px(x)} x2={px(x)} y1={row.y - 25} y2={row.y + 25} dash={i === 1 ? undefined : '5 4'}/>)}
      {s.rows.map((point, i) => <Mark key={i} x={px(point.x)} y={row.y + (i === 3 && z === 1 ? 17 : 0)} label={`${point.id}: ${n(point.x)}`} kind={point.y} support={row.y === 190 && Math.abs(point.margin - 1) < 1e-8}/>)}</g>)}
    <Wire x1={px(2)} y1={90} x2={px(z)} y2={165} hue={c.positive} arrow/>
  </Scene><FlowControls><FlowSlider name="Moved point z" value={z} onChange={setZ} min={.25} max={3} step={.05}/><Reset onClick={() => setZ(2)}/></FlowControls>
    <FlowReadout>Nearest positive r={n(s.nearestPositive)} gives boundary {n(s.boundary)} and margin {n(s.margin)}. {z > 1 ? 'The outer move leaves the solution unchanged.' : z === 1 ? 'Two positive observations now share the tight location.' : 'The moved observation replaces the old nearest positive support.'} The old classifier is {s.oldFeasible ? 'still feasible' : 'infeasible'}.</FlowReadout></FlowLab>;
}
export function Stability() {
  const [amount, setAmount] = useState(.8), radius = 3 / Math.sqrt(5), x = [2, 1], moved = [2 - amount / Math.sqrt(5), 1 - 2 * amount / Math.sqrt(5)];
  return <FlowLab label="Perturb an observation toward its fixed boundary"><Plane points={[]} w={[1, 2]} b={-1} query={x} foot={[1.4, -.2]} size={400}>{map => { const a = map(x), b = map(moved); return <g><Wire x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} hue={c.query} arrow/><Mark x={b[0]} y={b[1]} kind={0} label="x + δ"/></g>; }}</Plane>
    <FlowControls><FlowSlider name="Toward-boundary perturbation length" value={amount} onChange={setAmount} min={0} max={2} step={.05}/><Reset onClick={() => setAmount(.8)}/></FlowControls>
    <FlowReadout>The normal component is {n(amount)}, compared with radius {n(radius)}. The fixed score becomes {n(3 - Math.sqrt(5) * amount)}; {amount < radius ? 'the sign is preserved' : amount === radius ? 'the observation reaches zero score' : 'the perturbation crosses the boundary'}. No refitting occurs.</FlowReadout></FlowLab>;
}
export function Shortfalls() {
  const margins = [1.7, 1, .6, 0, -.2], px = x => 155 + (x + .4) * 185;
  return <Scene label="Five signed margins and shortfall brackets ending at the requested margin 1" width={650} height={350}>{margins.map((m, i) => <g key={i}><Text x={20} y={40 + i * 63}>m={n(m)}</Text><Wire x1={px(-.4)} x2={px(2)} y1={35 + i * 63} y2={35 + i * 63}/><Wire x1={px(1)} x2={px(1)} y1={20 + i * 63} y2={50 + i * 63} dash="5 4"/><circle cx={px(m)} cy={35 + i * 63} r="5" fill={c.query}/><Bracket x1={px(Math.min(m, 1))} x2={px(1)} y={42 + i * 63} label={`shortfall ${n(Math.max(0, 1 - m))}`}/></g>)}</Scene>;
}
export function Losses() {
  const [margin, setMargin] = useState(.6), h = Math.max(0, 1 - margin), logistic = Math.log1p(Math.exp(-margin));
  return <FlowLab label="Compare three losses on the same signed-margin axis"><Curve xmin={-1} xmax={2} ymax={4} xLabel="signed margin m = y f(x)" yLabel="loss" curves={[{ name: 'hinge', hue: c.query, fn: m => Math.max(0, 1 - m), labelX: -.7 }, { name: 'squared hinge', hue: c.second, fn: m => Math.max(0, 1 - m) ** 2, labelX: -.4 }, { name: 'logistic', hue: c.first, fn: m => Math.log1p(Math.exp(-m)), labelX: .9 }]} dots={[{ x: margin, y: h, label: 'hinge' }, { x: margin, y: h * h, hue: c.second }, { x: margin, y: logistic, hue: c.first }]}/>
    <FlowControls><FlowSlider name="Signed margin" value={margin} onChange={setMargin} min={-1} max={2} step={.05}/><Reset onClick={() => setMargin(.6)}/></FlowControls><FlowReadout>At m={n(margin)}, hinge={n(h)}, squared hinge={n(h * h)}, logistic={n(logistic)}. {margin === 1 ? 'Hinge has a kink with subgradients [−1,0]; the chosen loss subgradient is zero.' : `The slopes are ${margin < 1 ? '−1' : '0'}, ${n(-2 * h)}, and ${n(-1 / (1 + Math.exp(margin)))}.`}</FlowReadout></FlowLab>;
}
export function ObjectiveAssembly() {
  return <Scene label="Squared weight branch and row-shortfall branch join the primal cost" width={710} height={330}>
    <Port x={20} y={50} label="w" value=".5" hue={c.query} width={100}/><Wire x1={120} y1={71} x2={170} y2={71} arrow/><Port x={170} y={50} label="square × ½" value=".125" width={120}/><Wire x1={290} y1={71} x2={520} y2={190} arrow/>
    <Grid x={145} y={170} matrix={[[.25, .75], [.75, .25]]} rows={['negative row', 'positive row']} columns={['y f', 'hinge']} rowHues={[c.negative, c.positive]}/>
    <Wire x1={345} y1={194} x2={390} y2={216} arrow/><Wire x1={345} y1={242} x2={390} y2={216} arrow/><Port x={390} y={195} label="sum × C=.25" value="1 × .25 = .25" width={125}/><Wire x1={515} y1={216} x2={545} y2={216} arrow/><Port x={545} y={195} label="total primal P" value=".125+.25=.375" width={155}/>
    <Text x={20} y={315}>b=.25 changes the two margins; the bias has no squared penalty.</Text>
  </Scene>;
}
export function SoftPair() {
  const [cValue, setC] = useState(.25), [conflict, setConflict] = useState(false), [fraction, setFraction] = useState(.5), [revision, setRevision] = useState(0), s = softPairState(cValue, conflict, fraction);
  const reset = () => { setC(.25); setConflict(false); setFraction(.5); setRevision(r => r + 1); };
  return <FlowLab label="Optimal bias interval with separated or conflicting observations"><Scene label="Two input locations and the admissible unpenalized bias interval" width={650} height={260}>
    <Wire x1={70} y1={55} x2={550} y2={55} arrow/>{s.rows.map((row, i) => <Mark key={i} x={310 + row.x * 180} y={55 + (conflict ? i * 24 : 0)} kind={i ? 1 : -1} label={`x=${row.x}, f=${n(row.score)}`}/>)}
    <Text x={40} y={130}>bias interval</Text><Wire x1={210} y1={150} x2={530} y2={150}/><Bracket x1={370 - 140 * s.biasLimit} x2={370 + 140 * s.biasLimit} y={150} label={`[${n(-s.biasLimit)}, ${n(s.biasLimit)}]`}/><circle cx={370 + 140 * s.b} cy="150" r="6" fill={c.query}/><Text x={30} y={230}>w={n(s.w)}; b={n(s.b)}; hinges {v(s.rows.map(r => r.hinge))}</Text>
  </Scene><FlowControls><ExactInput name="C (.05–4)" value={cValue} onChange={setC} min={.05} max={4} revision={revision}/><Select name="Observation locations" value={conflict ? 'conflict' : 'separated'} onChange={v => setConflict(v === 'conflict')} options={[['separated', '−1 and +1'], ['conflict', 'Both at zero']]}/><FlowSlider name="Position in admissible bias interval" value={fraction} onChange={setFraction} min={-1} max={1} step={.25}/><Reset onClick={reset}/></FlowControls>
    <FlowReadout>Weight cost {n(s.normCost)} + paid loss {n(s.lossCost)} = P {n(s.primal)}, equal to D {n(s.dual)}. {s.w === 0 ? 'The normal is zero: there is no geometric margin to divide by.' : `This chosen bias gives geometric margin ${n(s.geometricMargin)}.`}</FlowReadout></FlowLab>;
}
export function HingeUpdate() {
  const [lambda, setLambda] = useState(.5), [eta, setEta] = useState(.1), h = hingeStep(lambda, eta);
  return <FlowLab label="Pull three hinge contributions back before one atomic update"><Scene label="Each row seed multiplies its feature coordinates; weight penalty joins before simultaneous subtraction" width={1080} height={510}>
    <Grid x={130} y={60} matrix={h.x.map((row, i) => [h.margins[i], h.seeds[i], row[0], h.seeds[i] * row[0], row[1], h.seeds[i] * row[1]])} rows={['row 0 −1', 'row 1 +1', 'row 2 +1']} columns={['margin', 'seed −y/3', 'x₁', 'seed × x₁', 'x₂', 'seed × x₂']} columnHues={[c.neutral,c.neutral,c.first,c.first,c.second,c.second]} rowHues={[c.negative, c.positive, c.positive]} cell={135}/>
    <Wire x1={603} y1={205} x2={603} y2={238} hue={c.first}/><Wire x1={603} y1={238} x2={180} y2={238} hue={c.first}/><Wire x1={180} y1={238} x2={180} y2={311} hue={c.first}/><Wire x1={180} y1={311} x2={230} y2={311} hue={c.first} arrow/>
    <Wire x1={873} y1={205} x2={873} y2={250} hue={c.second}/><Wire x1={873} y1={250} x2={505} y2={250} hue={c.second}/><Wire x1={505} y1={250} x2={505} y2={311} hue={c.second}/><Wire x1={505} y1={311} x2={530} y2={311} hue={c.second} arrow/>
    <Port x={30} y={395} label="saved old w, b" value="[.2, −.1], .1" hue={c.query} width={180}/>
    <Port x={230} y={290} label={`sum x₁ products + λ×.2`} value={n(h.gw[0])} hue={c.first} width={250}/><Port x={530} y={290} label={`sum x₂ products + λ×(−.1)`} value={n(h.gw[1])} hue={c.second} width={280}/>
    <Text x={250} y={375}>sum row seeds = g_b = {n(h.gb)}</Text>
    <Wire x1={480} y1={311} x2={840} y2={417} hue={c.first} arrow/><Wire x1={810} y1={311} x2={840} y2={417} hue={c.second} arrow/>
    <Wire x1={210} y1={416} x2={840} y2={416} hue={c.query} arrow/><Wire x1={120} y1={437} x2={840} y2={486} hue={c.query} arrow/><Port x={840} y={395} label="new w from old − ηg" value={v(h.after)} hue={c.query} width={230}/>
    <Text x={250} y={490}>Both new cells read the same saved old state.</Text><Port x={840} y={465} label="new b from old − ηg_b" value={n(h.afterB)} hue={c.query} width={230}/>
  </Scene><FlowControls><FlowSlider name="Weight penalty λ" value={lambda} onChange={setLambda} min={0} max={2} step={.05}/><FlowSlider name="Step η" value={eta} onChange={setEta} min={.001} max={1} step={.001}/><Reset onClick={() => { setLambda(.5); setEta(.1); }}/></FlowControls>
    <FlowReadout>The same saved old state supplies both gradients. J changes from {n(h.beforeObjective)} to {n(h.afterObjective)} after this one step; a larger step need not reduce it.</FlowReadout></FlowLab>;
}
export function CertificateBracket() {
  const states = [0, .1, .25].map(a => ({ a, w: 2 * a, d: 2 * a - 2 * a * a, p: 2 * a * a + .25 * 2 * (1 - 2 * a) })), px = value => 80 + 950 * value;
  return <Scene label="Feasible dual lower bounds and primal upper bounds bracket the optimum .375" width={650} height={265}>{states.map((s, i) => <g key={i}><Text x={25} y={28 + i * 80}>α=({s.a},{s.a}); w={s.w}</Text><Wire x1={70} y1={55 + i * 80} x2={600} y2={55 + i * 80}/><Bracket x1={px(s.d)} x2={px(s.p)} y={55 + i * 80} label={`D=${n(s.d)} ≤ optimum ≤ P=${n(s.p)}; gap=${n(s.p - s.d)}`}/></g>)}</Scene>;
}
export function Elimination() {
  return <Scene label="Weight square completion and unrestricted bias/slack minimization eliminate primal variables" width={790} height={555}>
    <Text x={20} y={30}>weight lane: a = Σ αᵢ yᵢ xᵢ = .1(−1)(−1) + .1(+1)(+1) = .2</Text>
    <Port x={30} y={70} label="½w² − .2w" value="complete the square" width={210}/><Wire x1={240} y1={91} x2={300} y2={91} arrow/><Port x={300} y={70} label="½(w−.2)² − .02" value="minimum at w=.2" width={240}/><Wire x1={540} y1={91} x2={590} y2={91} arrow/><Port x={590} y={70} label="retained minimum" value="−.02" width={170}/>
    <Text x={20} y={160}>bias lane: −b Σ αᵢ yᵢ; equal opposing prices give −.1 + .1 = 0</Text><Wire x1={100} y1={200} x2={730} y2={200} arrow/><Text x={100} y={230}>nonzero coefficient → arbitrarily negative in one direction of b</Text><Text x={100} y={258}>zero coefficient → intercept term disappears; label balance survives</Text>
    <Text x={20} y={288}>Original primal constraint −ξᵢ ≤ 0 gives multiplier βᵢ ≥ 0.</Text>
    <Text x={20} y={318}>Slack term ξᵢ(C−αᵢ−βᵢ): minimize L over unrestricted ξᵢ ∈ ℝ.</Text>
    <Port x={30} y={370} label="Finite minimum requires C − α − β = 0" value=".25 − .1 − .15 = 0" width={300}/><Wire x1={330} y1={391} x2={360} y2={391} arrow/><Text x={370} y={397}>α ≥ 0 and β=C−α ≥ 0</Text><Text x={370} y={425}>therefore 0 ≤ α ≤ C</Text>
    <Port x={30} y={475} label="Nonzero coefficient" value=".25 − .1 − 0 = .15" width={200}/><Wire x1={230} y1={496} x2={270} y2={496} arrow/><Port x={270} y={475} label="Multiply by ξ = −100" value=".15 × (−100) = −15" width={225}/><Wire x1={495} y1={496} x2={535} y2={496} arrow/><Text x={550} y={502}>ξ → −∞ gives L → −∞</Text>
    <Text x={20} y={548}>For a negative nonzero coefficient, ξ → +∞ gives the same unbounded infimum.</Text>
  </Scene>;
}
export function Kkt() {
  const rows = [{ m: 1.2, a: 0 }, { m: 1, a: 0 }, { m: 1, a: .1 }, { m: 1, a: .25 }, { m: .6, a: .25 }];
  return <Scene label="Margin and coefficient rulers preserve one-way KKT implications" width={1060} height={420}>
    <Text x={175} y={25}>signed margin m</Text><Text x={455} y={25}>coefficient α; C=.25</Text>{rows.map(({ m, a }, i) => { const xi = Math.max(0, 1 - m); return <g key={i}><Wire x1={130} y1={60 + i * 72} x2={370} y2={60 + i * 72}/><Wire x1={330} x2={330} y1={48 + i * 72} y2={72 + i * 72} dash="5 3"/><circle cx={130 + m * 200} cy={60 + i * 72} r="5" fill={c.first}/><Text x={20} y={65 + i * 72}>m={m}</Text><Wire x1={440} y1={60 + i * 72} x2={650} y2={60 + i * 72}/><circle cx={440 + a / .25 * 210} cy={60 + i * 72} r="5" fill={c.query}/><Text x={440} y={88 + i * 72}>α={a}; ξ={n(xi)}</Text><Port x={715} y={43 + i * 72} label="α × (m−1+ξ)" value={`${n(a)} × ${n(m - 1 + xi)} = 0`} width={155}/><Wire x1={650} y1={60 + i * 72} x2={710} y2={60 + i * 72} arrow/><Port x={900} y={43 + i * 72} label="(C−α) × ξ" value={`${n(.25 - a)} × ${n(xi)} = 0`} width={155}/></g>; })}
  </Scene>;
}
export function DuplicateExpansion() {
  const [t, setT] = useState(.2), a = [.5, t, .5 - t], contribution = a.map(x => x);
  return <FlowLab label="Move coefficient mass between identical positive rows"><Scene label="Three signed coefficient vectors join head to tail to the same weight" width={620} height={220}>
    <Text x={25} y={35}>x=[−1,1,1]; y=[−1,+1,+1]; α={v(a)}</Text><Wire x1={60} y1={100} x2={570} y2={100}/>{contribution.map((value, i) => { const left = 60 + sum(contribution.slice(0, i)) * 460, right = left + value * 460; return <g key={i}><Wire x1={left} y1={100} x2={right} y2={100} hue={i === 0 ? c.negative : c.positive} strokeWidth="4" arrow/><Text x={(left + right) / 2} y={i === 2 ? 170 : 70} anchor="middle" hue={i === 0 ? c.negative : c.positive}>row {i}: {n(value)}</Text></g>; })}<Text x={60} y={207}>weight w=1; balance −.5+t+(.5−t)=0; dual=.5</Text>
  </Scene><FlowControls><FlowSlider name="Positive duplicate share t" value={t} onChange={setT} min={0} max={.5} step={.01}/><Reset onClick={() => setT(.2)}/></FlowControls><FlowReadout>Only the allocation between duplicate positive identities changes; their combined contribution remains .5 and the weight remains 1.</FlowReadout></FlowLab>;
}
