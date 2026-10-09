import { CodeBlock } from '../content/Code.jsx';
import useLessonViewport from './useLessonViewport.js';
import { useEffect, useState } from 'react';
import { NeuralTable, NeuralPlot } from './NeuralLessonElements.jsx';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout } from './LessonFlow.jsx';
import { formatDropout as fmt, maskOutcomes, maskShapes, geometryOutput, residualMask, depthRates, expectedActive, executeDepth, monteCarloSummary } from '../../data/dropout-models.js';
import { modePass, branchSentence } from '../../data/dropout-flow.js';
import measurements from '../../data/dropout-measurements.json';
import { ResidualBranchDiagram, DepthStackStrip } from './DropoutStructureFigures.jsx';
import './dropout-labs.css';

const num = (value, digits) => fmt(value, digits).replace(/-/g, '−');
const vector = (values, digits) => '[' + values.map(value => num(value, digits)).join(', ') + ']';
const shapeProduct = shape => shape.reduce((product, value) => product * value, 1);

// §2: every two-bit mask for h = [1, 2], with exact probabilities, under a chosen survivor rule.
export function DropoutExpectationLab() {
  const [probability, setProbability] = useState(.5);
  const [scaling, setScaling] = useState('inverted');
  const keep = 1 - probability;
  const multiplier = scaling === 'inverted' ? (probability === 1 ? 0 : 1 / keep) : keep;
  const result = maskOutcomes(probability, multiplier);
  return <FlowLab id="dropout-expectation" label="Four outcomes and their average">
    <div className="dropout-outcomes flow-columns-2">{result.outcomes.map(row => <div key={row.mask.join('')} className={row.probability === 0 ? 'is-impossible' : undefined}>
      <span>Mask {vector(row.mask)}</span>
      <strong>h̃ = {vector(row.values)}</strong>
      <div className="dropout-probability" aria-hidden="true"><span style={{ width: (100 * row.probability) + '%' }} /></div>
      <span>probability {num(row.probability, 6)}</span>
    </div>)}</div>
    <FlowControls>
      <FlowSlider name="Drop probability p" value={probability} onChange={setProbability} min={0} max={1} step={.05} format={value => num(value, 2)} />
      <FlowChoice label="Survivors" options={[['inverted', 'divided by q (inverted)'], ['bug', 'multiplied by q (a bug)']]} value={scaling} onChange={setScaling} />
    </FlowControls>
    <FlowReadout>{probability === 1
      ? <>At p = 1 only the all-zero mask can happen, so every pass returns [0, 0]; there is no keep probability to divide by.</>
      : <>Survivors are multiplied by {num(multiplier, 4)}. The probability-weighted average is <strong>{vector(result.mean, 4)}</strong>{scaling === 'inverted' ? ', the unmasked h' : `, not the unmasked [1, 2]`}; the variances are {vector(result.variance, 4)}.</>}</FlowReadout>
  </FlowLab>;
}

// §3: two examples × two channels × a 2×2 grid. Choose which values share a bit; click a cell to flip its bit.
const geometryNames = { element: 'Element', channel: 'Channel', row: 'Example', batch: 'Whole batch' };
const geometryMeaning = {
  element: 'each value has its own bit',
  channel: 'one bit covers a whole channel of one example',
  row: 'one bit covers everything in one example',
  batch: 'one bit covers the whole batch',
};
export function DropoutGeometryLab() {
  const [mode, setMode] = useState('channel');
  const [bits, setBits] = useState([1, 0, 0, 1]);
  const shape = maskShapes[mode];
  const result = geometryOutput({ mode, bits, probability: .5, training: true });
  const changeMode = next => { setMode(next); setBits(Array(shapeProduct(maskShapes[next])).fill(1)); };
  const flip = index => setBits(bits.map((bit, i) => i === index ? 1 - bit : bit));
  const dropped = result.filter(cell => cell.factor === 0).length;
  return <FlowLab id="dropout-geometry" label="Choose which values share one random bit">
    <div className="dropout-examples flow-columns-2">{[0, 1].map(example => <section key={example}>
      <h5>Example {example + 1}</h5>
      {[0, 1].map(channel => <div className="dropout-channel" key={channel}>
        <p>Channel {channel + 1}</p>
        <div className="dropout-grid">{result.slice(example * 8 + channel * 4, example * 8 + channel * 4 + 4).map((cell, index) => <button type="button" key={index}
          data-mask={cell.factor === 0 ? 0 : 1} aria-pressed={Boolean(cell.bit)} onClick={() => flip(cell.maskIndex)}
          aria-label={`Example ${example + 1}, channel ${channel + 1}, value ${cell.input}: bit ${cell.maskIndex + 1} = ${cell.bit}, output ${cell.output}. Select to flip bit ${cell.maskIndex + 1}.`}>
          <span>bit {cell.maskIndex + 1}</span><b>{cell.factor === 0 ? '× ' : ''}{num(cell.input)} → {num(cell.output)}</b>
        </button>)}</div>
      </div>)}
    </section>)}</div>
    <FlowControls>
      <FlowChoice label="One bit covers" options={Object.entries(geometryNames)} value={mode} onChange={changeMode} />
    </FlowControls>
    <FlowReadout>Mask shape <strong>{vector(shape)}</strong>: {shapeProduct(shape)} independent {shapeProduct(shape) === 1 ? 'bit' : 'bits'}, so {geometryMeaning[mode]}. With p = 0.5, kept values double; {dropped} of 16 values are dropped. Select any cell to flip the bit it shares.</FlowReadout>
  </FlowLab>;
}

// §4: the residual block with one gate, placed on the branch or after the sum.
export function DropoutBranchLab() {
  const input = [2, -1], correction = [.5, 1];
  const [placement, setPlacement] = useState('branch');
  const [bit, setBit] = useState(0);
  const result = residualMask({ input, correction, probability: .5, bit, placement });
  return <FlowLab id="dropout-branch" label="Move the mask and see what survives">
    <ResidualBranchDiagram placement={placement} factor={result.factor} input={input} correction={correction} output={result.output} />
    <FlowControls>
      <FlowChoice label="Gate position" options={[['branch', 'On branch F'], ['whole', 'After the addition']]} value={placement} onChange={setPlacement} />
      <FlowChoice label="Gate bit" options={[[1, '1 · keep'], [0, '0 · drop']]} value={bit} onChange={setBit} />
    </FlowControls>
    <FlowReadout>{placement === 'branch' ? <>y = x + {num(result.factor)} × F(x)</> : <>y = {num(result.factor)} × (x + F(x))</>} = <strong>{vector(result.output)}</strong>. {branchSentence(placement, bit)}</FlowReadout>
  </FlowLab>;
}

// §4: four residual blocks with a drop-rate schedule; click a block to flip its sampled bit.
export function DropoutDepthLab() {
  const length = 4;
  const [endpoint, setEndpoint] = useState(.5);
  const [convention, setConvention] = useState('original');
  const [bits, setBits] = useState([1, 0, 1, 0]);
  const rates = depthRates(length, endpoint, convention);
  const eager = executeDepth({ rates, bits, strategy: 'eager' });
  const lazy = executeDepth({ rates, bits, strategy: 'lazy' });
  const active = eager.trace.map(row => Boolean(row.active));
  const toggle = index => setBits(bits.map((bit, i) => i === index ? 1 - bit : bit));
  return <FlowLab id="dropout-depth" label="Stochastic depth across four residual blocks">
    <DepthStackStrip rates={rates} active={active} onToggle={toggle} />
    <FlowControls>
      <FlowSlider name="Last block's drop rate p_max" value={endpoint} onChange={setEndpoint} min={0} max={1} step={.05} format={value => num(value, 2)} />
      <FlowChoice label="Schedule" options={[['original', 'p_l = p_max · l / L'], ['zero-first', 'zero-first']]} value={convention} onChange={setConvention} />
    </FlowControls>
    <FlowReadout>Rates {vector(rates, 4)} give <strong>E[A] = {num(expectedActive(rates), 4)}</strong> expected active blocks of {length}. This pass uses {active.filter(Boolean).length}. If the code computes every F(x) and then multiplies by the bit, {eager.calls} of {length} branch functions run; checking the bit first runs {lazy.calls}. Select a block to flip its bit; a block with rate 0 is always on and one with rate 1 always off.</FlowReadout>
  </FlowLab>;
}

// §5: one batch through dropout → BatchNorm in four situations.
const modeOptions = [['train', 'Training pass'], ['noGrad', 'Training inside no_grad'], ['eval', 'Evaluation']];
export function DropoutModeLab() {
  const [name, setName] = useState('train');
  const pass = modePass(name);
  const buffers = state => `mean ${num(state.runningMean)}, variance ${num(state.runningVariance)}`;
  return <FlowLab id="dropout-mode" label="Dropout before BatchNorm in four situations">
    <ol className="dropout-mode-chain">
      <li className="is-input"><span>X (activations reaching dropout)</span><b>[1, 1, 3, 3]</b></li>
      <li className={pass.dropout ? 'is-mask' : 'is-identity'}><span>{pass.dropout ? 'Dropout on: keep bits [0, 1, 0, 1], survivors × 2' : 'Dropout off: identity'}</span><b>{pass.dropout ? 'X̃' : 'X'} = {vector(pass.reaching)}</b></li>
      <li><span>{pass.batchNorm === 'train' ? `BatchNorm uses this batch: mean ${num(pass.batchMean)}, variance ${num(pass.batchVariance)}` : `BatchNorm uses its stored buffers: ${buffers(pass.before)}`}</span><b>output {vector(pass.output, 3)}</b></li>
      <li className={pass.written ? 'is-written' : undefined}><span>Stored buffers</span><b>{pass.written ? `${buffers(pass.before)} → ${buffers(pass.after)}` : `unchanged at ${buffers(pass.before)}`}</b></li>
    </ol>
    <FlowControls>
      <FlowChoice label="Situation" options={modeOptions} value={name} onChange={setName} />
    </FlowControls>
    <FlowReadout>{{
      train: <>Training: the noisy X̃ has variance 6, BatchNorm normalizes with it, and it <strong>writes</strong> the unbiased estimate 8 into its stored variance.</>,
      noGrad: <>Same numbers as the training pass. Turning off gradient recording does not switch modes: dropout still samples and BatchNorm still <strong>writes</strong> its buffers.</>,
      eval: <>Evaluation after one training pass: dropout is off, so the clean X arrives, but BatchNorm divides by the stored √8, giving <strong>about ±0.354</strong> instead of ±1.</>,
    }[name]}</FlowReadout>
  </FlowLab>;
}

function Digit({ specimen }) {
  return <figure className="dropout-digit"><div className="neural-pixels" role="img" aria-label={'Real UCI digit ' + specimen.target + ', source ID ' + specimen.id}>{specimen.pixels.map((value, index) => <span key={index} style={{ '--pixel': 'rgb(' + Array(3).fill(Math.round(value / 16 * 255)).join(',') + ')' }} />)}</div><figcaption>Source {specimen.id} · digit {specimen.target}</figcaption></figure>;
}

// §6: a few of the real 8×8 digits used in the experiment.
export function DigitSpecimensFigure() {
  return <figure className="dx-figure" data-figure="dropout-digit-specimens">
    <div className="dropout-specimens">{measurements.specimens.map(specimen => <Digit specimen={specimen} key={specimen.id} />)}</div>
    <figcaption>Three of the 400 real 8×8 UCI Optical Recognition digits (Alpaydin and Kaynak, CC BY 4.0). Each square is one pixel's grayscale value from 0 to 16.</figcaption>
  </figure>;
}

// §6: recorded fits, baseline against one masking variant.
export function DropoutMeasuredLab() {
  const [family, setFamily] = useState('mlp');
  const [seed, setSeed] = useState(1);
  const [variantKey, setVariantKey] = useState('0.2-row');
  const options = measurements.fits.filter(run => run.family === family && run.seed === seed);
  const baseline = options.find(run => run.drop_probability === 0);
  const variants = options.filter(run => run.drop_probability !== 0);
  const variant = variants.find(run => run.drop_probability + '-' + run.mode === variantKey) || variants[0];
  const last = run => run.trace.at(-1);
  const gap = last(variant).validation.cross_entropy - last(baseline).validation.cross_entropy;
  const series = [baseline, variant].flatMap((run, index) => ['train', 'validation'].map(split => ({
    label: (index ? 'Variant' : 'Baseline') + ' ' + split,
    color: index ? '#e4b752' : '#dddddd', dashed: split === 'train',
    values: run.trace.map(row => [row.step, row[split].cross_entropy]),
  })));
  const maxY = Math.max(...series.flatMap(item => item.values.map(point => point[1]))) * 1.08;
  const variantName = run => (family === 'mlp' ? 'element' : run.mode) + ' ' + run.drop_probability;
  return <FlowLab id="dropout-measured" label="Compare recorded fits">
    <NeuralPlot title="Recorded loss, baseline against the selected variant" xLabel="optimizer updates" yLabel="cross-entropy (nats per example)" xDomain={[0, 400]} yDomain={[0, maxY]} series={series} points={series.flatMap((item, index) => item.values.map(([x, y], i) => ({ id: index + '-' + i, x, y, color: item.color, label: item.label + ': step ' + x + ', CE ' + num(y, 6) })))} />
    <NeuralTable caption="Final values after 400 updates" headers={['Run', 'Train CE', 'Validation CE', 'Validation correct']} rows={[['No masking (white)', num(last(baseline).train.cross_entropy, 6), num(last(baseline).validation.cross_entropy, 6), last(baseline).validation.correct + ' / 120'], [variantName(variant) + ' (amber)', num(last(variant).train.cross_entropy, 6), num(last(variant).validation.cross_entropy, 6), last(variant).validation.correct + ' / 120']]} />
    <FlowControls>
      <FlowChoice label="Family" options={[['mlp', 'MLP'], ['residual', 'Residual MLP']]} value={family} onChange={value => { setFamily(value); setVariantKey(value === 'mlp' ? '0.2-row' : '0.2-row'); }} />
      <FlowChoice label="Masking" options={variants.map(run => [run.drop_probability + '-' + run.mode, variantName(run)])} value={variant.drop_probability + '-' + variant.mode} onChange={setVariantKey} />
      <FlowChoice label="Seed" options={[[1, '1'], [2, '2'], [3, '3']]} value={seed} onChange={setSeed} />
    </FlowControls>
    <FlowReadout>Variant minus baseline validation CE = <strong>{num(gap, 6)}</strong>: {Math.abs(gap) < 1e-10 ? 'identical within 10⁻¹⁰' : gap > 0 ? 'masking made validation loss worse in this recorded run' : 'masking made validation loss better in this recorded run'}. Solid lines are validation, dashed lines training; segments join six measured checkpoints (0, 1, 25, 100, 200, 400).</FlowReadout>
  </FlowLab>;
}

// §7: averages over a prefix of the 100 recorded Monte Carlo passes for one digit.
export function DropoutMonteCarloLab() {
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(10);
  const rows = measurements.samples.map(draw => draw[index]);
  const current = monteCarloSummary(rows.slice(0, count));
  const item = measurements.specimens[index];
  return <FlowLab id="dropout-monte-carlo" label="Average a prefix of recorded passes">
    <div className="dropout-mc-layout flow-columns-2"><Digit specimen={item} /><div className="dropout-class-bars">{current.mean.map((value, digit) => <div key={digit} className={digit === current.choice ? 'is-choice' : undefined}><span>Digit {digit}</span><div className="dropout-probability" aria-hidden="true"><span style={{ width: value * 100 + '%' }} /></div><b>{num(value, 4)}</b></div>)}</div></div>
    <FlowControls>
      <FlowChoice label="Digit image" options={measurements.specimens.map((entry, i) => [i, 'source ' + entry.id + ' (a ' + entry.target + ')'])} value={index} onChange={setIndex} />
      <FlowSlider name="Passes averaged T" value={count} onChange={setCount} min={1} max={100} step={1} format={value => String(value)} />
    </FlowControls>
    <FlowReadout>The average of {count} recorded {count === 1 ? 'pass' : 'passes'} picks <strong>{current.choice}</strong> (true digit {item.target}). Entropy of the average {num(current.predictiveEntropy, 4)} nats; average entropy {num(current.meanEntropy, 4)}; disagreement <strong>D = {num(current.disagreement, 4)}</strong>{count === 1 ? ', zero by construction with one pass' : ''}.</FlowReadout>
  </FlowLab>;
}

export function DropoutProgram({ file = 'dropout-experiments.py', title = 'Read the complete experiment program', start, end }) {
  const [container, ready] = useLessonViewport();
  const [source, setSource] = useState(null), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  const url = '/learn-assets/dropout-droppath-stochastic-depth/' + file;
  useEffect(() => {
    if (!ready) return undefined;
    const controller = new AbortController();
    setSource(null); setFailed(false);
    fetch(url, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Source unavailable');
      return response.text();
    }).then(text => {
      const first = start ? text.indexOf(start) : 0;
      const last = end ? text.indexOf(end, first + (start?.length || 0)) : text.length;
      if (first < 0 || last < first) throw new Error('Source boundary missing');
      if (!controller.signal.aborted) setSource(text.slice(first, last));
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [ready, url, start, end, attempt]);
  return <section ref={container} className="lesson-teaching-section" data-lesson-teaching="code">
    <h4 className="lesson-teaching-section__title">{title}</h4>
    {failed ? <p role="alert">The source could not load. <button type="button" onClick={() => setAttempt(value => value + 1)}>Retry source</button></p>
      : source !== null ? <CodeBlock language="python" filename={start || end ? file.replace(/\.py$/, '-excerpt.py') : file}>{source}</CodeBlock>
        : <p role="status">Loading the canonical source…</p>}
    <p><a href={url} download>Download {file}</a></p>
  </section>;
}
