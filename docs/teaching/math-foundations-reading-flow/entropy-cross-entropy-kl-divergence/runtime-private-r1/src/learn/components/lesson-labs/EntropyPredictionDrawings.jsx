import { useState } from 'react';
import { SOURCE, MODEL, conditionalState, logitCalculation, probabilityDraft, numericDraft, PENGUINS, informationState } from '../../data/entropy-reading-models.js';
import { Figure, Key, FlowPath, Drawing, Arrow, Axis, Curve, Mark, Table, Strip, Bars, Controls, Range, Draft, Choice, COLORS, number } from './EntropyDrawingElements.jsx';
export function TargetSelection() {
  const prices = MODEL.map(p => -Math.log2(p));
  return <Figure id="E26" title="A target selects or weights already-computed prices"><Key /><Bars rows={prices} maximum={4} title="Class prices from the same Q" /><Drawing label="The hard target C selects one price; a soft target weights all four class prices" height={185} minWidth={0}>{[0, 1, 2, 3].map(i => <g key={i}><Mark x={60 + 120 * i} y={35} index={i} /><text x={60 + 120 * i} y="68" textAnchor="middle">{'ABCD'[i]}</text>{i === 2 && <Arrow x1={60 + 120 * i} y1={80} x2={240} y2={165} color={COLORS[2]} />}</g>)}</Drawing><p className="en-flow-result">Selected C price = 2 bits.</p><Bars maximum={4} title="Soft target: multiply each class price by its target weight" rows={prices.map((price, i) => ({
      label: `${'ABCD'[i]}: ${SOURCE[i]} × ${price}`,
      value: SOURCE[i] * price,
      color: COLORS[i]
    }))} /><Table caption="The same price vector with different targets" headers={['Target', 'Weights', 'Loss in bits']} rows={[["Hard C", '(0,0,1,0)', 2], ['Soft', '(.5,.25,.125,.125)', 2.625]]} /><p>These are target weights, not model logits. A hard target picks one class; a soft target averages the class prices.</p></Figure>;
}
export function Conditional() {
  const [context, setContext] = useState(.5),
    [noise, setNoise] = useState(.1),
    [trust, setTrust] = useState(.8),
    [mode, setMode] = useState('symmetric'),
    s = conditionalState({
      context,
      noise,
      trust,
      mode
    });
  return <Figure id="E27" title="Investigate conditional rows and context weights"><Drawing label="Joint probability rectangle splits into context rows and then outcomes, preserving area" height={250}>{s.rows.map((row, i) => <g key={i}>{row.joint.map((mass, j) => <rect key={j} x={45 + (j ? row.probabilities[0] * 390 : 0)} y={30 + (i ? s.rows[0].mass * 165 : 0)} width={row.probabilities[j] * 390} height={row.mass * 165} fill={COLORS[j]} fillOpacity={i ? .45 : .8} stroke="#ddd" />)}<text x="45" y={225 + i * 22}>{`P(X=${i})=${number(row.mass)}`}</text></g>)}</Drawing><Key labels={['Y=0', 'Y=1']} /><Table caption="Joint rows become conditional rows only when their context has positive mass" headers={['Context', 'Joint P(X,Y=0), P(X,Y=1)', 'Conditional P(Y|X)', 'Model Q(Y|X)', 'Row H / CE', 'Weighted CE']} rows={s.rows.map(r => [`X=${r.index}; mass ${number(r.mass)}`, r.joint.map(v => number(v)).join(', '), r.available ? r.probabilities.map(v => number(v)).join(', ') : 'unavailable: zero context', r.model.map(v => number(v)).join(', '), r.available ? `${number(r.entropy)} / ${number(r.crossEntropy)}` : 'not observed', number(r.weightedCost)])} />{s.rows.map(r => <section key={r.index}><p>Context X={r.index}: normalize this joint row by its mass {number(r.mass)}.</p>{r.available ? <><Strip title="Conditional source P(Y|X); solid" values={r.probabilities} labels={['Y=0', 'Y=1']} /><Strip title="Conditional model Q(Y|X); dashed" values={r.model} labels={['Y=0', 'Y=1']} dashed /></> : <p>No conditional row can be recovered from this zero-mass context.</p>}</section>)}<Bars title="Contributions weighted by actual context mass" maximum={2} rows={s.rows.map(r => ({
      label: `X=${r.index}`,
      value: r.weightedCost
    }))} /><p aria-live="polite" className="en-status">Conditional H = {number(s.entropy, 9)}; CE = {number(s.crossEntropy, 9)}; excess = {number(s.excess, 9)} bits. Marginal H(Y) = {number(s.marginalEntropy, 9)}.</p>{mode === 'unequal' && <p className="en-note">An equal average of the two row costs would give {number(s.incorrectUniform, 9)} bits. It is justified only at context weight ½; at a zero-mass context its conditional law is not recoverable from the joint distribution.</p>}<Controls onReset={() => {
      setContext(.5);
      setNoise(.1);
      setTrust(.8);
      setMode('symmetric');
    }}><Choice label="Conditional example" value={mode} onChange={v => {
        setMode(v);
        if (v === 'unequal') setContext(.25);
      }} options={[["symmetric", "Symmetric noisy context"], ["unequal", "Unequal truthful rows"]]} /><Range label="Context probability P(X=1)" value={context} onChange={setContext} /><Range label="Flip noise" value={noise} onChange={setNoise} min={0} max={.5} disabled={mode === 'unequal'} /><Range label="Model trust" value={trust} onChange={setTrust} disabled={mode === 'unequal'} />{mode === 'unequal' && <p>The unequal preset fixes truthful rows (.9,.1) and (.5,.5); noise and trust controls are inactive for this example.</p>}</Controls></Figure>;
}
export function ORCondition() {
  return <Figure id="E28" title="Conditioning can leave unequal amounts of uncertainty"><Drawing label="Four equally likely fair-bit input cells; OR is zero only at A zero B zero" height={250}>{[0, 1].flatMap(a => [0, 1].map(b => <g key={a + '-' + b}><rect x={110 + b * 140} y={30 + a * 90} width="120" height="75" fill={COLORS[a || b]} fillOpacity=".35" stroke={COLORS[a || b]} /><text x={170 + b * 140} y={75 + a * 90} textAnchor="middle">{a} OR {b} = {a || b}</text></g>))}<text x="85" y="76" textAnchor="end">A=0</text><text x="85" y="166" textAnchor="end">A=1</text><text x="170" y="225" textAnchor="middle">B=0</text><text x="310" y="225" textAnchor="middle">B=1</text></Drawing><Table caption="Average conditional entropy with the actual context masses" headers={['Context', 'OR law', 'Entropy', 'Context weight', 'Contribution']} rows={[["A=0", '(½,½)', 1, .5, .5], ['A=1', '(0,1)', 0, .5, 0]]} /><Strip title="Given A=0: OR law" labels={['Y=0', 'Y=1']} values={[.5, .5]} /><Strip title="Given A=1: OR law" labels={['Y=0', 'Y=1']} values={[0, 1]} /><p>H(OR|A)=.5 bit; H(OR)=H₂(¼)=.811278 bits. Each row has its own uncertainty before the weighted average.</p></Figure>;
}
export function LikelihoodTraces() {
  return <Figure id="E29" title="Two different factorizations, drawn separately">
    <p><strong>Fixed supervised rows share parameters θ.</strong> Both paths below begin at the same parameter θ; neither row feeds the other.</p>
    <div className="en-flow-branches">{[['(x₁, y₁=0)', '.8'], ['(x₂, y₂=1)', '.25']].map(([row, p], i) => <FlowPath key={row} identity={i} title={`Independent row ${i + 1}`} steps={[{
        label: 'Shared parameter input',
        value: 'θ'
      }, {
        label: 'Evaluate this fixed observation',
        value: row
      }, {
        label: 'Observed-label probability',
        value: `qθ = ${p}`
      }, {
        label: 'Feed the same product Π',
        value: p
      }]} />)}</div>
    <FlowPath title="Join both factors" steps={[{
      label: 'Product Π',
      value: '.8 × .25 = .2'
    }, {
      label: 'Negate its logarithm',
      value: '−ln(.2) = 1.609437912 nats'
    }, {
      label: 'Divide by two observed rows',
      value: 'mean NLL = .804718956 nats'
    }]} />
    <p><strong>Ordered sequence A, B, A.</strong> This is a separate operation: append the emitted symbol to form the next actual prefix.</p>
    <div className="en-sequence-path">{[['start', 'A', '.5', 'A'], ['A', 'B', '.25', 'A,B'], ['A,B', 'A', '.8', 'A,B,A']].map(([prefix, symbol, p, next], i) => <div key={i}><FlowPath identity={i} title={`Sequence position ${i + 1}`} steps={[{
          label: 'Actual prefix',
          value: prefix
        }, {
          label: `Predict and select next symbol ${symbol}`,
          value: `q(${symbol} | ${prefix}) = ${p}`
        }, {
          label: 'Append the selected symbol',
          value: next
        }]} />{i < 2 && <div className="en-flow-continuation">↓ This becomes the next prefix</div>}</div>)}</div>
    <p>Chain product = .5×.25×.8=.1; NLL=2.302585093 nats. Prefix conditioning is explicit; no iid assumption was inserted.</p>
  </Figure>;
}
export function Logits() {
  const [z, setZ] = useState([1000, 998, 996]),
    [target, setTarget] = useState(2),
    [mode, setMode] = useState('hard'),
    [soft, setSoft] = useState([.5, .25, .25]),
    [shift, setShift] = useState(0),
    s = logitCalculation(z, target, mode === 'soft' ? soft : null, shift);
  return <Figure id="E30" title="Investigate the stable logit calculation"><Key labels={['Class 0', 'Class 1', 'Class 2']} /><div className="en-flow-branches">{s.rows.map(r => <FlowPath key={r.index} identity={r.index} title={`Class ${r.index}`} steps={[{
        label: 'Score z',
        value: number(r.score, 5)
      }, {
        label: `Subtract shared maximum m=${number(s.maximum)}`,
        value: `z − m = ${number(r.shifted, 5)}`
      }, {
        label: 'Exponentiate this shifted score',
        value: number(r.exponential, 7)
      }, {
        label: 'Feed the shared sum S',
        value: `class ${r.index} contribution = ${number(r.exponential, 7)}`
      }]} />)}</div><FlowPath title="One shared normalizer, then return to each class" steps={[{
      label: 'S = sum of the three exponential contributions',
      value: number(s.sum, 8)
    }, {
      label: 'Logarithm of S',
      value: number(s.logSum, 8)
    }]} /><div className="en-flow-branches">{s.rows.map(r => <FlowPath key={r.index} identity={r.index} title={`Return to class ${r.index}`} steps={[{
        label: 'Its shifted score minus the shared ln S',
        value: `${number(r.shifted, 5)} − ${number(s.logSum, 8)}`
      }, {
        label: 'Class log probability',
        value: number(r.logProbability, 8)
      }, {
        label: `Multiply its price by target weight ${number(r.targetWeight)}`,
        value: `loss term = ${number(r.contribution, 8)}`
      }]} />)}</div><p>Every score subtracts maximum m={number(s.maximum)}. Each log probability is its shifted score minus ln(sum)={number(s.logSum, 8)}.</p><Table caption="Class identity through the stable calculation" headers={['Class', 'Score', 'Shifted', 'exp shifted', 'Probability', 'log probability', 'Target weight', 'Loss term']} rows={s.rows.map(r => [r.index, ...[r.score, r.shifted, r.exponential, r.probability, r.logProbability, r.targetWeight, r.contribution].map(v => number(v, 7))])} /><p className="en-status" aria-live="polite">Loss = {number(s.loss, 10)} nats. The target is applied to log probabilities, not to exponentiated values.</p><Controls onReset={() => {
      setZ([1000, 998, 996]);
      setTarget(2);
      setMode('hard');
      setSoft([.5, .25, .25]);
      setShift(0);
    }}>{z.map((v, i) => <Draft key={i} label={`Class ${i} logit`} value={v} parse={t => numericDraft(t, -10000, 10000, 'Logit')} onApply={n => setZ(z.map((old, j) => i === j ? n : old))} />)}<Range label="Common logit shift" value={shift} onChange={setShift} min={-1000} max={1000} step={10} /><Choice label="Target type" value={mode} onChange={setMode} options={[["hard", "Hard class index"], ["soft", "Normalized soft target"]]} />{mode === 'hard' ? <Choice label="Target class" value={String(target)} onChange={v => setTarget(+v)} options={[0, 1, 2].map(i => [String(i), `Class ${i}`])} /> : <Draft label="Soft target probabilities" value={soft.join(', ')} parse={t => probabilityDraft(t, 3)} onApply={setSoft} />}<button onClick={() => {
        setZ([0, -1000, -2000]);
        setTarget(2);
        setMode('hard');
        setShift(0);
      }}>Inspect extreme separation</button></Controls></Figure>;
}
export function UnderflowPaths() {
  return <Figure id="E31" title="Keep log probabilities before exponentiation"><p>Both branches start with the same finite log probability −2000.</p><div className="en-flow-branches"><FlowPath identity={0} title="Direct log-loss branch" steps={[{
        label: 'Log probability',
        value: '−2000'
      }, {
        label: 'Negate',
        value: 'loss = 2000 (finite)'
      }]} /><FlowPath identity={1} title="Probability round-trip branch" steps={[{
        label: 'Log probability',
        value: '−2000'
      }, {
        label: 'Exponentiate in floating point',
        value: 'p rounds to 0'
      }, {
        label: 'Then negate log of rounded p',
        value: '−log(0) → ∞'
      }]} /></div><Table caption="Extreme logits retain finite direct log loss" headers={['Class', 'Logit / log probability', 'exp(log probability)']} rows={[[0, 0, 1], [1, -1000, 0], [2, -2000, 0]]} /><p>The zero in the probability column is floating-point underflow. It is not the model's mathematical support exclusion.</p></Figure>;
}
export function TensorContract() {
  return <Figure id="E32" title="A batch has rows; classes occupy columns"><Table caption="Floating logits with shape (2,3)" headers={['Row', 'Class 0', 'Class 1', 'Class 2']} rows={[[0, 1000, 998, 996], [1, 0, -1000, -2000]]} /><div className="en-flow-branches">{[0, 1].map(i => <FlowPath key={i} identity={i} title={`Batch row ${i}`} steps={[{
        label: 'Select target class',
        value: i === 0 ? 'y = 0' : 'y = 2'
      }, {
        label: 'Negate selected log probability',
        value: i === 0 ? '.142932 nats' : '2000 nats'
      }, {
        label: 'Feed shared total',
        value: i === 0 ? '.142932' : '2000'
      }]} />)}</div><FlowPath title="Join the row losses" steps={[{
      label: 'Total',
      value: '.142932 + 2000 = 2000.142932'
    }, {
      label: 'Divide by batch size 2',
      value: 'mean = 1000.071466 nats'
    }]} /><p>Hard targets are integer class indices, shape (2,): [0,2]. Soft targets are normalized floating rows with the same (2,3) shape as logits. A probability vector passed as logits is a different input.</p></Figure>;
}
export function AccuracyCosts() {
  const rows = Array.from({
    length: 10
  }, (_, i) => ({
    i: i + 1,
    correct: i < 8,
    p1: i < 8 ? .6 : .4,
    p2: i < 8 ? .99 : .01
  }));
  return <Figure id="E33" title="Eight correct answers can have very different prices"><Table caption="Ten actual constructed evaluation rows" headers={['Row', 'Top-class correctness', 'Moderate true-class probability', 'Confident true-class probability']} rows={rows.map(r => [r.i, r.correct ? 'correct' : 'wrong', r.p1, r.p2])} /><Drawing label="Ten paired row-loss bars on a common zero to five nat scale. Tiny correct confident losses keep their actual height." height={270}><Axis yLabel="row loss, nats" xLabel="row index" xDomain={[1, 10]} yDomain={[0, 5]} y={215} height={175} />{rows.map((r, i) => <g key={r.i}><rect x={55 + i * 37} y={215 - -Math.log(r.p1) / 5 * 175} width="10" height={-Math.log(r.p1) / 5 * 175} fill={COLORS[0]} /><rect x={67 + i * 37} y={215 - -Math.log(r.p2) / 5 * 175} width="10" height={-Math.log(r.p2) / 5 * 175} fill={COLORS[1]} /><text x={65 + i * 37} y="245" textAnchor="middle">{r.i}</text></g>)}</Drawing><Key labels={['Moderate .6/.4', 'Confident .99/.01']} /><p>Both accuracies are .8. Mean losses: .591918645 versus .929074306 nats. The second model's rare wrong rows cost 4.605170 each; its correct-row loss .010050 keeps its true, very small bar height.</p></Figure>;
}
export function Perplexity() {
  return <Figure id="E34" title="A geometric probability becomes an effective choice count"><div className="en-steps"><span>True-class probabilities p₁…pₙ</span>→<span>geometric mean exp(mean ln p)</span>→<span>reciprocal = exp(mean NLL)</span></div><Drawing label="Two batches have one and nine rows; each individual row contributes to the combined mean" height={200}>{Array.from({
        length: 10
      }, (_, i) => <g key={i}><rect x={35 + i * 42} y={i === 0 ? 95 : 40} width="30" height={i === 0 ? 0 : 55} fill={i === 0 ? COLORS[0] : COLORS[1]} /><line x1={35 + i * 42} y1="95" x2={65 + i * 42} y2="95" stroke="#ccc" /><text x={50 + i * 42} y="125" textAnchor="middle">{i === 0 ? '0' : '1'}</text></g>)}<path d="M77 147V157H443V147" fill="none" stroke={COLORS[1]} /><text x="260" y="186" textAnchor="middle">nine rows in batch 2</text></Drawing><Table caption="Reduce losses by row count before exponentiating" headers={['Batch', 'Rows', 'Total NLL', 'Mean NLL', 'Perplexity']} rows={[[1, 1, 0, 0, 1], [2, 9, 9, 1, number(Math.E)], ['Combined', 10, 9, .9, number(Math.exp(.9))]]} /><p>Averaging the two batch perplexities, (1+e)/2, ignores their different row counts and applies the nonlinear transformation too early.</p></Figure>;
}
export function PenguinSplit() {
  return <Figure id="E35" title="Observed rows split by year before model fitting"><Drawing label="The observed year axis assigns 2007 and 2008 rows to training and 2009 to held-out testing" height={210}><line x1="65" y1="60" x2="415" y2="60" stroke="#aaa" />{[2007, 2008, 2009].map((year, i) => <g key={year}><Mark x={65 + i * 175} y={60} index={i === 2 ? 1 : 0} /><text x={65 + i * 175} y="100" textAnchor="middle">{year}</text></g>)}<path d="M45 125V140H265V125" stroke={COLORS[0]} fill="none" /><text x="155" y="180" textAnchor="middle">train: 224</text><text x="415" y="180" textAnchor="end">test: 120</text></Drawing><Key labels={PENGUINS.species} /><Table caption="Training species counts; alpha=1 added only after this split" headers={['Island', ...PENGUINS.species, 'Total']} rows={PENGUINS.train.map((r, i) => [PENGUINS.islands[i], ...r, r.reduce((a, b) => a + b, 0)])} /><Table caption="Held-out 2009 species counts; no test row used to fit the probabilities" headers={['Island', ...PENGUINS.species, 'Total']} rows={PENGUINS.test.map((r, i) => [PENGUINS.islands[i], ...r, r.reduce((a, b) => a + b, 0)])} /><p>The counts are a projection of the saved programme's observed CSV execution. They are not a new random sample.</p></Figure>;
}
export function PenguinCosts() {
  const s = PENGUINS,
    totals = s.conditional.map((r, i) => s.test[i].reduce((sum, n, j) => sum - n * Math.log2(r.probabilities[j]), 0));
  return <Figure id="E36" title="One observed row joins an explicitly weighted test average"><Key labels={s.species} /><div className="en-steps"><span>Test row: Adelie on Biscoe</span>→<span>training count 28 + 1</span>÷<span>Biscoe train 108 + 3</span>→<span>29/111</span>→<span>−log₂(29/111) = {number(-Math.log2(29 / 111))}</span></div>{s.islands.map((island, i) => <Strip key={island} title={`${island} model probabilities from training`} values={s.conditional[i].probabilities} labels={s.species} />)}<Table caption="Island totals use every held-out row exactly once" headers={['Island', 'Test rows', 'Total test loss, bits', 'Divide global total by 120']} rows={s.islands.map((name, i) => [name, s.conditional[i].count, number(totals[i], 6), number(totals[i] / 120, 6)])} /><Bars title="Conditional-model total accounting" maximum={1.6} rows={[{
      label: 'H(test)',
      value: s.total.entropy,
      color: COLORS[0]
    }, {
      label: 'KL',
      value: s.total.kl,
      color: COLORS[1]
    }, {
      label: 'CE',
      value: s.total.crossEntropy,
      color: '#ccc'
    }, {
      label: 'Global CE',
      value: s.global.crossEntropy,
      color: COLORS[3]
    }]} /><p>.782798115 empirical conditional entropy + .023095476 mismatch = .805893591 test bits per row (rounded). The global model costs 1.518341224. This comparison is tied to this split and model class.</p></Figure>;
}
export function RealizedPath() {
  return <Figure id="E37" title="A constructed short path differs from its expected trend"><Drawing label="Constructed D A D A cumulative excess costs minus two zero minus two zero, compared with expected n times point875" height={280}><Axis xLabel="observed prefix length" yLabel="cumulative bits" y={220} height={170} /><line x1="45" x2="435" y1={220 - 2.5 / 6.5 * 170} y2={220 - 2.5 / 6.5 * 170} stroke="#888" strokeDasharray="3 4" /><Curve points={[[0, 0], [1, -2], [2, 0], [3, -2], [4, 0]]} xDomain={[0, 4]} yDomain={[-2.5, 4]} y={220} height={170} /><Curve points={[[0, 0], [4, 3.5]]} xDomain={[0, 4]} yDomain={[-2.5, 4]} y={220} height={170} color={COLORS[1]} dash />{[0, 1, 2, 3, 4].map(n => <text key={n} x={45 + n * 97.5} y="250" textAnchor="middle">{n === 0 ? '0' : ['D', 'A', 'D', 'A'][n - 1]}</text>)}</Drawing><Key labels={['Actual D,A,D,A path', 'Expected n × .875']} /><Table caption="Constructed increments, not a random-path claim" headers={['Symbol', 'Increment', 'Cumulative']} rows={[["D", -2, -2], ['A', 2, 0], ['D', -2, -2], ['A', 2, 0]]} /><p>The selected string has zero cumulative excess. Expected excess under P is .875 bits per draw; that statement does not determine each realized prefix.</p></Figure>;
}
