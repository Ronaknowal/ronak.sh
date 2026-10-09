import { useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout, flowNumber as f } from './LessonFlow.jsx';
import { NeuralTable } from './NeuralLessonElements.jsx';
import { rbmDefault, binaryStates, tinyDistribution, hiddenProbabilities, statistics, updateTiny, probabilityFlow, tinyDraw, particleTrace, persistenceTrace, rbmMetrics } from '../../data/rbm-models.js';
import { SwitchGraph, ProbabilityBars, RbmFigure, RbmStateTable, stateName, vector } from './RbmElements.jsx';
import libraryModel from '../../data/rbm-library-model.js';
const states = binaryStates(2);
const options = states.map((v, i) => [i, stateName(v)]);

// Each investigation has its own explicitly stated fixed model, rather than
// silently inheriting unrelated edits from an earlier section.
function BinaryState({ values }) {
  return <span className="rbm-binary-state" aria-label={'binary state ' + stateName(values)}>{values.map((value, i) => <b key={i}>{value}</b>)}</span>;
}
function Distribution({ model, offset = 0 }) {
  const distribution = tinyDistribution(model, offset);
  return <ProbabilityBars title="Visible probability, after adding both hidden alternatives" rows={states.map((v, i) => ({ label: stateName(v), current: distribution.p[i] }))} />;
}
export function RbmGeneralFigure() {
  const [interaction, setInteraction] = useState(Math.log(3));
  const mass = [1, 1, 1, Math.exp(interaction)], total = mass.reduce((a, b) => a + b, 0);
  const marginal = (1 + mass[3]) / total;
  return <FlowLab id="rbm-general" label="Direct interaction between two binary variables">
    <SwitchGraph model={{ ...rbmDefault(), w: [[interaction], [interaction]] }} visible={[1, 1]} hidden={0} general />
    <ProbabilityBars title="The four possible pairs share one probability budget" rows={states.map((v, i) => ({ label: stateName(v), current: mass[i] / total }))} />
    <FlowControls><FlowSlider name="Direct interaction J" value={interaction} min={-3} max={3} step={.05} onChange={setInteraction} /></FlowControls>
    <FlowReadout>Only state 11 receives mass exp(J) = <strong>{f(mass[3])}</strong>; the other masses stay 1. Both-on probability is <strong>{f(mass[3] / total)}</strong>, whereas multiplying the two marginal on-probabilities gives <strong>{f(marginal ** 2)}</strong>. At J = 0 these agree.</FlowReadout>
  </FlowLab>;
}
export function RbmHiddenSumFigure({ model = rbmDefault() }) {
  const distribution = tinyDistribution(model);
  return <div className="rbm-hidden-sums" aria-label="Add the two hidden explanations for each visible pair">{states.map((v, i) => {
    const rows = distribution.joint.slice(2 * i, 2 * i + 2);
    return <figure key={i}><svg viewBox="0 0 280 166" role="img" aria-label={'Visible ' + stateName(v) + ' has two hidden alternatives'}>
      <text x="140" y="20" textAnchor="middle">visible {stateName(v)}</text>
      <circle cx="140" cy="47" r="15" fill="#7cc8db22" stroke="#7cc8db" />
      <path d="M130 59 L72 85 M150 59 L208 85" fill="none" stroke="#aaa" />
      {rows.map((row, j) => <g key={j}><circle cx={70 + 140 * j} cy="101" r="17" fill="#bd9ee522" stroke="#bd9ee5" /><text x={70 + 140 * j} y="106" textAnchor="middle">{row.h}</text><text x={70 + 140 * j} y="135" textAnchor="middle">mass {f(Math.exp(-row.energy), 3)}</text></g>)}
      <text x="140" y="159" textAnchor="middle">sum {f(rows.reduce((sum, row) => sum + Math.exp(-row.energy), 0), 3)}</text>
    </svg></figure>;
  })}<p>Each cyan parent is one observed pair. Its violet circles are the two possible values of the unobserved hidden switch, not two deterministic activations. Add their masses; then divide all four totals by the same sum.</p></div>;
}
export function RbmEnergyLab() {
  const [weights, setWeights] = useState([Math.log(3), Math.log(3)]);
  const [biases, setBiases] = useState([0, 0]);
  const [hiddenBias, setHiddenBias] = useState(0);
  const edgeModel = { ...rbmDefault(), w: weights.map(w => [w]) };
  const visibleModel = { ...rbmDefault(), a: biases };
  const hiddenModel = { ...rbmDefault(), b: [hiddenBias] };
  return <>
    <FlowLab id="rbm-energy" label="Change the two cross-layer interactions">
      <SwitchGraph model={edgeModel} visible={[1, 1]} hidden={1} />
      <Distribution model={edgeModel} />
      <FlowControls>{weights.map((w, i) => <FlowSlider key={i} name={'Interaction W' + (i + 1)} value={w} min={-4} max={4} step={.05} onChange={value => setWeights(old => old.map((x, j) => j === i ? value : x))} />)}</FlowControls>
      <FlowReadout>Biases stay zero. W₁ and W₂ may differ: the probability of 10 is <strong>{f(tinyDistribution(edgeModel).p[2])}</strong>, and of 01 is <strong>{f(tinyDistribution(edgeModel).p[1])}</strong>. Selecting the pictured state 11, h = 1 gives energy <strong>{f(-weights[0] - weights[1])}</strong>; the distribution still includes every state.</FlowReadout>
    </FlowLab>
    <p>Those edges reward joint on-states. A bias instead rewards a single switch, regardless of the other layer. In this separate investigation, the edges return to ln 3 and the hidden bias stays zero.</p>
    <FlowLab id="rbm-visible-bias" label="Change the two visible biases">
      <Distribution model={visibleModel} />
      <FlowControls>{biases.map((bias, i) => <FlowSlider key={i} name={'Visible bias a' + (i + 1)} value={bias} min={-4} max={4} step={.05} onChange={value => setBiases(old => old.map((x, j) => j === i ? value : x))} />)}</FlowControls>
      <FlowReadout>The visible on-probabilities are <strong>{vector(tinyDistribution(visibleModel).marginals)}</strong>. A positive a₁ rewards both 10 and 11; it does not reward 01.</FlowReadout>
    </FlowLab>
    <p>The last bias rewards the unobserved switch. Resetting visible biases to zero makes its effect easier to isolate.</p>
    <FlowLab id="rbm-hidden-bias" label="Change the hidden bias">
      <RbmHiddenSumFigure model={hiddenModel} /><Distribution model={hiddenModel} />
      <FlowControls><FlowSlider name="Hidden bias b" value={hiddenBias} min={-4} max={4} step={.05} onChange={setHiddenBias} /></FlowControls>
      <FlowReadout>Both interactions stay ln 3. The hidden marginal on-probability is <strong>{f(tinyDistribution(hiddenModel).hidden)}</strong>. Increasing b multiplies every h = 1 mass, before the common normalization.</FlowReadout>
    </FlowLab>
  </>;
}
export function RbmOffsetLab() {
  const [offset, setOffset] = useState(0);
  return <FlowLab id="rbm-offset" label="Shift every energy by the same amount">
    <ProbabilityBars title="Same two visible switches: only 11 has the extra interaction mass" rows={states.map((v, i) => ({ label: stateName(v), current: (i === 3 ? 3 : 1) / 6 }))} />
    <FlowControls><FlowSlider name="Common energy offset" value={offset} min={-100} max={100} step={1} onChange={setOffset} /></FlowControls>
    <FlowReadout>With J fixed at ln 3, every mass gains the same factor exp(−offset). log Z becomes <strong>{f(Math.log(6) - offset)}</strong>, but p(11) stays <strong>0.5</strong>. Changing a score and changing a normalized probability are different operations.</FlowReadout>
  </FlowLab>;
}
export function RbmConditionalLab() {
  const [index, setIndex] = useState(3);
  const probability = hiddenProbabilities(states[index], rbmDefault())[0];
  const onMass = Math.exp(states[index].reduce((sum, v) => sum + v * Math.log(3), 0));
  return <FlowLab id="rbm-conditional" label="Normalize two hidden alternatives with visible values fixed">
    <SwitchGraph model={rbmDefault()} visible={states[index]} hidden="?" />
    <ProbabilityBars title="Hidden alternatives, conditioned on the pictured visible pair" rows={[{ label: 'h=0', current: 1 - probability }, { label: 'h=1', current: probability }]} />
    <FlowControls><FlowChoice label="Fixed visible pair" options={options} value={index} onChange={setIndex} /></FlowControls>
    <FlowReadout>For visible <strong>{stateName(states[index])}</strong>, hidden masses are 1 and <strong>{f(onMass)}</strong>, so p(h = 1 | v) is <strong>{f(probability)}</strong>. The hidden value remains a binary draw; its probability may be fractional.</FlowReadout>
  </FlowLab>;
}
export function RbmParameterLab() {
  const [model, setModel] = useState(rbmDefault), [coefficient, setCoefficient] = useState(0), [event, setEvent] = useState(7);
  const values = [...model.w.flat(), ...model.a, ...model.b];
  const distribution = tinyDistribution(model), inspected = distribution.joint[event];
  const setValue = value => {
    const next = values.map((x, i) => i === coefficient ? value : x);
    setModel({ w: [[next[0]], [next[1]]], a: next.slice(2, 4), b: [next[4]] });
  };
  return <FlowLab id="rbm-parameters" label="Assemble an arbitrary three-switch probability model">
    <SwitchGraph model={model} visible={inspected.v} hidden={inspected.h} /><Distribution model={model} />
    <FlowControls>
      <label className="rbm-flow-select">Parameter to edit<select value={coefficient} onChange={event => setCoefficient(Number(event.target.value))}>{['W₁','W₂','a₁','a₂','b'].map((name, i) => <option key={name} value={i}>{name}</option>)}</select></label>
      <FlowSlider name={'Value of ' + ['W₁','W₂','a₁','a₂','b'][coefficient]} value={values[coefficient]} min={-6} max={6} step={.05} onChange={setValue} />
      <label className="rbm-flow-select">Joint state to inspect<select value={event} onChange={event => setEvent(Number(event.target.value))}>{distribution.joint.map((row, i) => <option key={i} value={i}>v={stateName(row.v)}, h={row.h}</option>)}</select></label>
    </FlowControls>
    <FlowReadout>All five edits persist within this investigation. The inspected event has energy <strong>{f(inspected.energy)}</strong> and normalized joint probability <strong>{f(inspected.probability,8)}</strong>. Visible marginals are <strong>{vector(distribution.marginals)}</strong>; covariance p(11) − p(v₁=1)p(v₂=1) is <strong>{f(distribution.covariance,8)}</strong>. Selecting an event changes inspection, not the distribution.</FlowReadout>
    <RbmStateTable distribution={distribution} />
  </FlowLab>;
}
export function RbmEnumerationFigure() {
  const [visible, setVisible] = useState(64), [hidden, setHidden] = useState(8);
  return <FlowLab id="rbm-enumeration" label="Count the configurations of the smaller layer">
    <RbmFigure title="One fixed hidden vector leaves separate visible choices" width={280} height={190} description="Each visible switch has two alternatives. With hidden values fixed, there are no visible-to-visible interactions, so the alternative masses multiply.">
      {[0, 1, 2].map(i => <g key={i}><circle cx={50 + 90 * i} cy="35" r="17" stroke="#bd9ee5" fill="#bd9ee522" /><text x={50 + 90 * i} y="40" textAnchor="middle">h{i + 1}</text>{[0, 1, 2].map(j => <line key={j} x1={50 + 90 * i} y1="52" x2={50 + 90 * j} y2="100" stroke="#e6b854" opacity=".4" />)}</g>)}
      {[0, 1, 2].map(i => <g key={i}><circle cx={50 + 90 * i} cy="118" r="17" stroke="#7cc8db" fill="#7cc8db22" /><text x={50 + 90 * i} y="123" textAnchor="middle">v{i + 1}</text><text x={50 + 90 * i} y="158" textAnchor="middle">0 or 1</text></g>)}
      <text x="140" y="184" textAnchor="middle">schematic: more units omitted</text>
    </RbmFigure>
    <FlowControls><FlowSlider name="Visible binary units D" value={visible} min={1} max={80} step={1} onChange={setVisible} /><FlowSlider name="Hidden binary units H" value={hidden} min={1} max={30} step={1} onChange={setHidden} /></FlowControls>
    <FlowReadout>Visible enumeration would visit <strong>{(1n << BigInt(visible)).toLocaleString()}</strong> states; hidden enumeration visits <strong>{(1n << BigInt(hidden)).toLocaleString()}</strong>. Choose the smaller layer and sum the other analytically. This is an exact integer count, not a promise that the browser fits that size.</FlowReadout>
  </FlowLab>;
}
function StatisticsFigure({ result }) {
  return <figure className="rbm-statistics"><div className="rbm-statistic-key">Cyan: data expectation · violet: model expectation. Bar scale 0–1.</div>{['W₁', 'W₂', 'a₁', 'a₂', 'b'].map((name, i) => <div key={name}><span>{name}: {f(result.positive[i])} − {f(result.negative[i])} = <strong>{f(result.gradient[i])}</strong></span><div className="rbm-statistic-track"><i style={{ width: result.positive[i] * 100 + '%', background: '#7cc8db' }} /></div><div className="rbm-statistic-track"><i style={{ width: result.negative[i] * 100 + '%', background: '#bd9ee5' }} /></div></div>)}</figure>;
}
export function RbmGradientLab() {
  const [mixture, setMixture] = useState(1), [rate, setRate] = useState(.1), [modelData, setModelData] = useState(false);
  const model = rbmDefault();
  const counts = modelData ? tinyDistribution(model).p : [0, 0, 1 - mixture, mixture];
  const result = statistics(model, counts), updated = updateTiny(model, result.gradient, rate);
  return <FlowLab id="rbm-gradient" label="Compare data and model expectations before a simultaneous update">
    <StatisticsFigure result={result} />
    <FlowControls><FlowSlider name="Data fraction in state 11; remainder in 10" value={mixture} min={0} max={1} step={.01} onChange={value => { setMixture(value); setModelData(false); }} /><FlowSlider name="Simultaneous learning rate" value={rate} min={0} max={.5} step={.01} onChange={setRate} /><button type="button" onClick={() => setModelData(true)}>Use model itself as data</button></FlowControls>
    <FlowReadout>{modelData ? 'Data are now the original four-state model distribution, so every difference is zero.' : 'Data are the displayed mixture of 10 and 11; the model remains the original three-switch distribution.'} Mean data log probability changes from <strong>{f(result.logLikelihood, 8)}</strong> to <strong>{f(statistics(updated, counts).logLikelihood, 8)}</strong> after applying all five differences together.</FlowReadout>
    <NeuralTable caption="One simultaneous update, using only the old statistics" headers={['Parameter', 'Before', 'After']} rows={['W₁', 'W₂', 'a₁', 'a₂', 'b'].map((name, i) => [name, f([...model.w.flat(), ...model.a, ...model.b][i]), f([...updated.w.flat(), ...updated.a, ...updated.b][i])])} />
  </FlowLab>;
}
export function RbmEmpiricalLab() {
  const [counts, setCounts] = useState([0, 0, 0, 1]);
  const [index, setIndex] = useState(3);
  const total = counts.reduce((a, b) => a + b, 0);
  const result = total ? statistics(rbmDefault(), counts) : null;
  return <FlowLab id="rbm-empirical" label="Build an arbitrary empirical distribution">
    <ProbabilityBars title="Data distribution from four nonnegative masses" rows={states.map((v, i) => ({ label: stateName(v), current: total ? counts[i] / total : 0 }))} />
    <FlowControls><FlowChoice label="Mass to edit" value={index} onChange={setIndex} options={options} /><FlowSlider name={'Data mass for ' + stateName(states[index])} value={counts[index]} min={0} max={10} step={.1} onChange={value => setCounts(old => old.map((x, i) => i === index ? value : x))} /></FlowControls>
    <FlowReadout>{result ? <>The masses sum to <strong>{f(total)}</strong> and are normalized before averaging. All five exact gradients are <strong>{vector(result.gradient)}</strong>.</> : 'All data masses are zero. No empirical distribution or likelihood gradient is defined; the empty bars are not a uniform distribution.'}</FlowReadout>
  </FlowLab>;
}
export function RbmHandDrawLab() {
  const [uniforms, setUniforms] = useState([.8, .3, .6]);
  const draw = tinyDraw([1, 0], rbmDefault(), uniforms);
  return <FlowLab id="rbm-hand-draw" label="One binary Gibbs draw, with explicit uniform numbers">
    <SwitchGraph model={rbmDefault()} visible={[1, 0]} hidden={draw.hidden} />
    {[draw.ph, ...draw.pv].map((probability, i) => <figure key={i} className="rbm-draw-ruler"><p>{['Hidden draw', 'Visible 1 draw', 'Visible 2 draw'][i]}: threshold probability {f(probability)}; uniform {f(uniforms[i])}</p><svg viewBox="0 0 280 66" role="img" aria-label={'Uniform ' + f(uniforms[i]) + (uniforms[i] < probability ? ' is below' : ' is not below') + ' threshold ' + f(probability)}><line x1="20" y1="26" x2="260" y2="26" stroke="#aaa" /><line x1="20" y1="26" x2={20 + 240 * probability} y2="26" stroke="#bd9ee5" strokeWidth="8" /><circle cx={20 + 240 * uniforms[i]} cy="26" r="6" fill="#eee" /><text x="20" y="56">0</text><text x="260" y="56" textAnchor="end">1</text></svg></figure>)}
    <p>Violet segment: uniforms that draw 1. White dot: the current uniform. The hidden draw is evaluated first; it sets the thresholds for both visible draws.</p>
    <FlowControls>{uniforms.map((u, i) => <FlowSlider key={i} name={['Uniform for hidden', 'Uniform for visible 1', 'Uniform for visible 2'][i]} value={u} min={0} max={.999} step={.001} onChange={value => setUniforms(old => old.map((x, j) => i === j ? value : x))} />)}</FlowControls>
    <FlowReadout>Each draw is 1 exactly when its uniform is smaller than its probability. The hidden state is <strong>{draw.hidden}</strong>; it changes both visible probabilities together. The output <strong>{stateName(draw.next)}</strong> is a pair of binary values, not a fractional mean.</FlowReadout>
  </FlowLab>;
}
export function RbmChainLab() {
  const [initial, setInitial] = useState(3), [steps, setSteps] = useState(1), [equilibriumStart, setEquilibriumStart] = useState(false);
  const model = rbmDefault(), equilibrium = tinyDistribution(model).p;
  const q0 = equilibriumStart ? equilibrium : equilibrium.map((_, i) => Number(i === initial));
  const flow = probabilityFlow(model, q0, steps), current = flow.traces.at(-1);
  const dataStats = statistics(model, q0), negative = statistics(model, current.mass).positive;
  return <FlowLab id="rbm-chain" label="Evolve exact distribution mass under fixed-parameter Gibbs transitions">
    <ProbabilityBars title={'Exact distribution mass after ' + steps + ' transitions, not sampled frequencies'} baselineLabel="fixed model equilibrium" rows={states.map((v, i) => ({ label: stateName(v), current: current.mass[i], baseline: equilibrium[i] }))} />
    <FlowControls><FlowChoice label="Initial point mass" options={options} value={initial} onChange={value => { setInitial(value); setEquilibriumStart(false); }} /><FlowSlider name="Full hidden–visible transitions" value={steps} min={0} max={30} step={1} onChange={setSteps} /><button type="button" onClick={() => setEquilibriumStart(true)}>Start mass at equilibrium</button></FlowControls>
    <FlowReadout>Parameters remain fixed. Total variation from equilibrium is <strong>{f(current.tv, 9)}</strong>. Expected finite-chain gradient is <strong>{vector(dataStats.positive.map((x, i) => x - negative[i]))}</strong>, compared with exact likelihood gradient <strong>{vector(dataStats.gradient)}</strong>. Starting at equilibrium leaves every bar unchanged.</FlowReadout>
    <NeuralTable caption="Exact transition probabilities: every row sums to one" headers={['From / to', '00', '01', '10', '11']} rows={flow.transition.map((row, i) => [stateName(states[i]), ...row.map(x => f(x, 6))])} />
  </FlowLab>;
}
export function RbmParticleLab() {
  const [seed, setSeed] = useState(19), [steps, setSteps] = useState(4);
  const trace = particleTrace([1, 1], rbmDefault(), steps, seed);
  return <FlowLab id="rbm-particle" label="Follow one sampled trajectory from 11">
    <div className="rbm-particle-path">{[[1, 1], ...trace.map(row => row.next)].map((v, i) => <span key={i}>{i > 0 && <span aria-hidden="true"> → </span>}<BinaryState values={v} /><small>{i === 0 ? 'start' : 'draw ' + i}</small></span>)}</div>
    <FlowControls><FlowSlider name="Sampled transitions" value={steps} min={1} max={12} step={1} onChange={setSteps} /><FlowSlider name="Mulberry32 random stream seed" value={seed} min={0} max={100} step={1} onChange={setSeed} /></FlowControls>
    <FlowReadout>This single trajectory ends at <strong>{stateName(trace.at(-1).next)}</strong>. Changing the seed changes the draws, not the exact distribution bars in the previous investigation.</FlowReadout>
    <NeuralTable caption="Every probability, uniform and binary state in this replay" headers={['Step', 'Input', 'p hidden', 'u hidden', 'h', 'p visible', 'u visible', 'Output']} rows={trace.map((row, i) => [i + 1, stateName(row.previous), f(row.ph), f(row.uniforms[0]), row.hidden, vector(row.pv), vector(row.uniforms.slice(1)), stateName(row.next)])} />
  </FlowLab>;
}
export function RbmPersistenceLab() {
  const [second, setSecond] = useState(0), [seed, setSeed] = useState(31);
  const batches = [[[1, 1], [1, 1], [1, 0], [0, 1]], [states[second], [0, 1], [1, 0], [1, 0]]];
  const trace = persistenceTrace(rbmDefault(), batches, seed);
  return <FlowLab id="rbm-persistence" label="Compare data starts and persistent particle starts at fixed parameters">
    <div className="rbm-persistence-path">{['cd', 'pcd'].map(method => <div key={method}><strong>{method.toUpperCase()} particle 0</strong><div className="rbm-particle-path">{[trace[0][method][0].previous, trace[0][method][0].next, trace[1][method][0].previous, trace[1][method][0].next].map((v, i) => <span key={i}>{i > 0 && <span aria-hidden="true"> → </span>}<BinaryState values={v} /><small>{['A start', 'A draw', 'B start', 'B draw'][i]}</small></span>)}</div></div>)}</div>
    <FlowControls><FlowChoice label="Minibatch B, first observation" options={options} value={second} onChange={setSecond} /><FlowSlider name="Shared random stream seed" value={seed} min={0} max={100} step={1} onChange={setSeed} /></FlowControls>
    <FlowReadout>All parameters are fixed. CD restarts from the current data; PCD starts B at A’s result. Changing only B’s first observation changes the CD start, while the PCD path stays the same. Actual learning would also update parameters; that happens in the complete study.</FlowReadout>
    {trace.map(row => <NeuralTable key={row.step} caption={'Minibatch ' + (row.step ? 'B' : 'A') + ': ' + row.batch.map(stateName).join(', ')} headers={['Particle', 'CD start → draw', 'PCD start → draw', 'Shared uniforms']} rows={row.cd.map((cd, i) => [i, stateName(cd.previous) + ' → ' + stateName(cd.next), stateName(row.pcd[i].previous) + ' → ' + stateName(row.pcd[i].next), vector(row.draws[i])])} />)}
  </FlowLab>;
}
export function RbmMeanFigure() {
  const model = rbmDefault(), mass = probabilityFlow(model, [0, 0, 0, 1], 1).traces[1].mass;
  const average = mass.reduce((sum, p, i) => sum + p * hiddenProbabilities(states[i], model)[0], 0);
  const atMean = hiddenProbabilities([.725, .725], model)[0];
  return <figure>
    <p>Route 1: keep the four binary states, apply the sigmoid, then take the weighted average.</p>
    <RbmFigure title="Four binary states through the hidden sigmoid" width={280} height={230}>
      {states.map((v,i) => <g key={i}>
        {[0,1].map(j=><g key={j}><circle cx={25+35*j} cy={25+i*49} r="14" fill="#7cc8db22" stroke="#7cc8db" /><text x={25+35*j} y={30+i*49} textAnchor="middle">{v[j]}</text></g>)}
        <line x1="76" y1={25+i*49} x2="111" y2={25+i*49} stroke="#aaa" />
        <rect x="111" y={10+i*49} width="36" height="30" fill="none" stroke="#aaa" /><text x="129" y={30+i*49} textAnchor="middle">σ</text>
        <line x1="147" y1={25+i*49} x2="175" y2={25+i*49} stroke="#aaa" />
        <text x="179" y={30+i*49}>{f(hiddenProbabilities(v,model)[0],2)}</text><text x="90" y={49+i*49}>weight {f(mass[i],5)}</text>
      </g>)}<text x="140" y="227" textAnchor="middle">weighted sum = {f(average,6)}</text>
    </RbmFigure>
    <p>Each cyan pair is a possible binary state. σ applies the hidden sigmoid to that state’s weighted sum. Its numeric output is a probability; the weight below the row is that visible state’s q₁ probability. Multiply each output by its row weight and add.</p>
    <p>Route 2: average the visible states first, then apply the same sigmoid once.</p>
    <RbmFigure title="The fractional visible mean through the hidden sigmoid" width={280} height={125}>
      <text x="10" y="26">mean [0.725, 0.725]</text><path d="M60 43 V66 H110" stroke="#aaa" fill="none" /><rect x="110" y="51" width="36" height="30" stroke="#aaa" fill="none" /><text x="128" y="72" textAnchor="middle">σ</text><line x1="146" y1="66" x2="174" y2="66" stroke="#aaa" /><text x="178" y="72">{f(atMean,6)}</text><text x="140" y="116" textAnchor="middle">one fractional input vector</text>
    </RbmFigure>
    <ProbabilityBars title="These two operation orders give different answers" rows={[{ label: 'average', current: average }, { label: 'at mean', current: atMean }]} /><p>The first route gives {f(average)}; the second gives {f(atMean)}. Fractional coordinates in route 2 are not states of the binary sampler.</p>
  </figure>;
}
export function RbmReconstructionLab() {
  const [index, setIndex] = useState(3), v = states[index];
  const models = [{ w: [[20], [20]], a: [-10, -10], b: [-20] }, { w: [[0], [0]], a: [Math.log(9), Math.log(9)], b: [0] }];
  return <FlowLab id="rbm-reconstruction" label="Compare a decoder mean with a normalized probability distribution">
    <div className="rbm-two">{models.map((model, i) => {
      const result = rbmMetrics(v, model);
      return <div key={i}><p>Model {i ? 'B: independent pixels' : 'A: two sharp modes'}</p><div className="rbm-draw-path"><span>Input<br /><strong>{stateName(v)}</strong></span><span aria-hidden="true">→</span><span>Hidden mean<br /><strong>{f(hiddenProbabilities(v, model)[0])}</strong></span><span aria-hidden="true">→</span><span>Visible mean<br /><strong>{vector(result.reconstructed)}</strong></span></div><Distribution model={model} /><p>Return-path MSE <strong>{result.mse.toExponential(6)}</strong>; full-distribution NLL <strong>{f(result.nll, 6)}</strong> nats.</p></div>;
    })}</div>
    <FlowControls><FlowChoice label="Input to both models" value={index} onChange={setIndex} options={options} /></FlowControls>
    <FlowReadout>The mean return path may reproduce the input closely without assigning it most of the distribution’s probability. For 11, A has lower reconstruction error but B has lower NLL. For 00, A wins both comparisons.</FlowReadout>
  </FlowLab>;
}
export function RbmLibraryLab() {
  const [bias, setBias] = useState(0);
  const model = { ...libraryModel, b: [libraryModel.b[0] + bias] }, dist = tinyDistribution(model);
  const after = probabilityFlow(model, dist.p, 1).traces[1].mass;
  return <FlowLab id="rbm-library" label="Transpose library parameters into the exact oracle">
    <div className="rbm-matrix-transpose"><figure><figcaption>Library: hidden rows × visible columns</figcaption><div className="rbm-matrix-row">{libraryModel.w.map((row, i) => <span key={i}>{f(row[0], 5)}<small>h₁, v{i + 1}</small></span>)}</div></figure><span aria-hidden="true">→ transpose →</span><figure><figcaption>Scratch: visible rows × hidden columns</figcaption><div className="rbm-matrix-column">{libraryModel.w.map((row, i) => <span key={i}>{f(row[0], 5)}<small>v{i + 1}, h₁</small></span>)}</div></figure></div>
    <Distribution model={model} />
    <FlowControls><FlowSlider name="Added hidden bias" value={bias} min={-3} max={3} step={.05} onChange={setBias} /></FlowControls>
    <FlowReadout>These are the retained sklearn fit parameters, with only the shown bias increment edited. A bias increment ln 2 doubles hidden on/off odds. The current equilibrium error max |pT − p| is <strong>{Math.max(...dist.p.map((p, i) => Math.abs(p - after[i]))).toExponential(3)}</strong>.</FlowReadout>
    <NeuralTable caption="Normalized probabilities and hidden transform, from the same current parameters" headers={['Visible', 'p hidden on', 'Exact p visible', 'Exact log p visible']} rows={states.map((v, i) => [stateName(v), f(hiddenProbabilities(v, model)[0], 8), f(dist.p[i], 8), f(Math.log(dist.p[i]), 8)])} />
  </FlowLab>;
}
