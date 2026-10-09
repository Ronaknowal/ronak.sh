import { flowNumber } from './LessonFlow.jsx';
import './loss-intuition.css';

// Every value below is an exact constructed calculation, checked against independent
// arithmetic by scripts/verify-loss-beginner-revision.mjs (revision 5),
// scripts/verify-loss-foundations.mjs (revision 7) and scripts/verify-loss-reading-flow.mjs.
// Figures sit in the reading flow: the sentence before each one says what to look at, and
// the prose after it walks through the labelled parts. Colours follow
// docs/teaching/deep-learning-beginner/visual-vocabulary.md.

const minus = text => String(text).replace(/-/g, '−');
const bar = (value, largest) => `${Math.max(2, 100 * Math.abs(value) / largest)}%`;

// A small line plot whose curves are labelled where they end, not in a legend.
// series: [{ values: [[x, y], ...], color, dashed, label, labelAt: [x, y], anchor }]
export function LossCurvePlot({ ariaLabel, xLabel, yLabel, xDomain, yDomain, xTicks, yTicks, series, points = [], width = 520, height = 300 }) {
  const left = 52, right = 24, top = 18, bottom = 52;
  const [xmin, xmax] = xDomain, [ymin, ymax] = yDomain;
  const x = v => left + (v - xmin) / (xmax - xmin) * (width - left - right);
  const y = v => height - bottom - (v - ymin) / (ymax - ymin) * (height - top - bottom);
  return <svg className="lf-plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
    <line className="lf-plot-axis" x1={left} x2={width - right} y1={y(ymin)} y2={y(ymin)} />
    <line className="lf-plot-axis" x1={left} x2={left} y1={top} y2={y(ymin)} />
    {xTicks.map(t => <text key={`x${t}`} className="lf-plot-tick" x={x(t)} y={y(ymin) + 20} textAnchor="middle">{minus(t)}</text>)}
    {yTicks.map(t => <text key={`y${t}`} className="lf-plot-tick" x={left - 8} y={y(t) + 5} textAnchor="end">{minus(t)}</text>)}
    <text className="lf-plot-axis-label" x={(left + width - right) / 2} y={height - 10} textAnchor="middle">{xLabel}</text>
    <text className="lf-plot-axis-label" x={14} y={(top + y(ymin)) / 2} textAnchor="middle" transform={`rotate(-90 14 ${(top + y(ymin)) / 2})`}>{yLabel}</text>
    {series.map(line => <g key={line.label}>
      <polyline fill="none" stroke={line.color} strokeWidth="2.5" strokeDasharray={line.dashed ? '6 5' : undefined} points={line.values.map(([a, b]) => `${x(a)},${y(b)}`).join(' ')} />
      <text className="lf-plot-series" x={x(line.labelAt[0])} y={y(line.labelAt[1])} textAnchor={line.anchor || 'start'} fill={line.color}>{line.label}</text>
    </g>)}
    {points.map(point => <g key={point.label}>
      <circle cx={x(point.x)} cy={y(point.y)} r="5.5" fill={point.color} stroke="#111" strokeWidth="1.5" />
      <text className="lf-plot-point" x={x(point.x) + (point.dx ?? 10)} y={y(point.y) + (point.dy ?? -10)} textAnchor={point.anchor || 'start'} fill={point.color}>{point.label}</text>
    </g>)}
  </svg>;
}

export function CountVersusLossFigure() {
  const rows = [[-2, 2.1269], [-1, 1.3133], [-.5, .9741], [.5, .4741], [1, .3133], [2, .1269]];
  return <figure className="lf-figure" data-figure="count-versus-loss">
    <div className="lf-count" role="table" aria-label="Correct or not, and cross-entropy loss, for one example with label 1 at six logits">
      <div role="row" className="lf-count-head"><span role="columnheader">logit z</span><span role="columnheader">classified correctly? (yes when z &gt; 0)</span><span role="columnheader">cross-entropy loss</span></div>
      {rows.map(([z, loss]) => <div role="row" key={z}>
        <span role="cell">{z > 0 ? '+' : ''}{flowNumber(z)}</span>
        <span role="cell" className={z > 0 ? 'lf-yes' : 'lf-no'}>{z > 0 ? 'yes: count 1' : 'no: count 0'}</span>
        <span role="cell" className="lf-bar-cell"><i className="lf-bar lf-bar-ce" style={{ width: bar(loss, 2.1269) }} /><strong>{loss.toFixed(4)}</strong></span>
      </div>)}
    </div>
  </figure>;
}

const pullCases = [
  { key: 'mse', name: 'Squared error', rule: 'pull = 2 × distance', down: 6, up: 19, verdict: 'net pull 13 upward: move c up; the pulls balance at the mean 1.429' },
  { key: 'mae', name: 'Absolute error', rule: 'pull = 1 for every measurement', down: 6, up: 1, verdict: 'net pull 5 downward: move c down; the pulls balance at the median 0' },
  { key: 'huber', name: 'Huber, δ = 1', rule: 'pull = distance, capped at 1', down: 3, up: 1, verdict: 'net pull 2 downward: move c down; the pulls balance at 1/6' },
];
export function PullBalanceFigure() {
  return <figure className="lf-figure" data-figure="pull-balance">
    <p className="lf-figure-label">Measurements 0, 0, 0, 0, 0, 0, 10 · trial answer <strong>c = 0.5</strong></p>
    {pullCases.map(row => <div className={`lf-pull lf-fn-${row.key}`} key={row.key}>
      <p className="lf-pull-name"><strong>{row.name}</strong> <span>{row.rule}</span></p>
      <div className="lf-pull-bars">
        <div><span>↓ six zeros pull down, total</span><i className="lf-bar" style={{ width: bar(row.down, 19) }} /><strong>{row.down}</strong></div>
        <div><span>↑ the 10 pulls up</span><i className="lf-bar" style={{ width: bar(row.up, 19) }} /><strong>{row.up}</strong></div>
      </div>
      <p className="lf-pull-verdict">{row.verdict}</p>
    </div>)}
  </figure>;
}

export function QuantileBalanceFigure() {
  const observations = [1, 2, 3, 4, 10];
  return <figure className="lf-figure" data-figure="quantile-balance" aria-label="A quantile balances asymmetric pulls">
    <p className="lf-figure-label">Measurements 1, 2, 3, 4, 10 · quantile level <strong>q = .75</strong> · each entry is that measurement's derivative contribution</p>
    {[3.5, 4.5].map(estimate => <div key={estimate} className="lf-quantile">
      <p className="lf-pull-name"><strong>Estimate {estimate}</strong></p>
      <div className="lf-quantile-votes">{observations.map(value => <div key={value}><span>y = {value}</span><span className="lf-quantile-arrow" aria-hidden="true">{value > estimate ? '↑' : '↓'}</span><strong>{value > estimate ? '−.75' : '+.25'}</strong><small>{value > estimate ? 'above: pulls up' : 'below: pulls down'}</small></div>)}</div>
      <p className="lf-pull-verdict">{estimate === 3.5 ? 'two above × (−.75) + three below × (+.25) = −.75: subtracting it moves the estimate up' : 'one above × (−.75) + four below × (+.25) = +.25: subtracting it moves the estimate down'}</p>
    </div>)}
  </figure>;
}

export function ProbabilityPenaltyFigure() {
  const rows = [[.9, .1054, .01, -.1, -.018], [.5, .6931, .25, -.5, -.25], [.1, 2.3026, .81, -.9, -.162], [.01, 4.6052, .9801, -.99, -.0196]];
  return <figure className="lf-figure" data-figure="probability-penalty">
    <div className="lf-penalty" role="table" aria-label="Penalty and logit push for four probabilities of the correct label">
      <div role="row" className="lf-penalty-head"><span role="columnheader">p given to the correct label</span><span role="columnheader">penalty</span><span role="columnheader">push sent back to the logit</span></div>
      {rows.map(([p, ce, sq, dce, dsq]) => <div role="row" key={p}><span role="cell"><strong>{p}</strong></span>
        <span role="cell" className="lf-pair"><span><b className="lf-ce">CE</b><i className="lf-bar lf-bar-ce" style={{ width: bar(ce, 4.6052) }} />{ce.toFixed(4)}</span><span><b className="lf-sq">sq</b><i className="lf-bar lf-bar-sq" style={{ width: bar(sq, 4.6052) }} />{sq.toFixed(4)}</span></span>
        <span role="cell" className="lf-pair"><span><b className="lf-ce">CE</b><i className="lf-bar lf-bar-ce" style={{ width: bar(dce, .99) }} />{Math.abs(dce).toFixed(3)}</span><span><b className="lf-sq">sq</b><i className="lf-bar lf-bar-sq" style={{ width: bar(dsq, .99) }} />{Math.abs(dsq).toFixed(4)}</span></span></div>)}
    </div>
    <p className="lf-figure-note"><b className="lf-ce">CE</b> cross-entropy −log p · <b className="lf-sq">sq</b> squared probability error (1 − p)² · pushes are sizes of the derivative with respect to the logit; both push it upward</p>
  </figure>;
}

export function SoftmaxTraceFigure({ ariaLabel, nameLabel = 'class', names, logits, target, temperature = 1, figure }) {
  const scaled = logits.map(value => value / temperature);
  // Unshifted exponentials are shown because they are what a learner computes by hand;
  // these small logits cannot overflow. Shares are identical to the shifted form.
  const weights = scaled.map(value => Math.exp(value)), total = weights.reduce((a, b) => a + b, 0);
  const shares = weights.map(value => value / total);
  const loss = -Math.log(shares[target]);
  const exponent = temperature === 1 ? 'eᶻ' : 'e^(s÷τ)';
  return <figure className="lf-figure" data-figure={figure} id={figure}>
    <div className="lf-softmax" role="table" aria-label={ariaLabel}>
      <div role="row" className="lf-softmax-head"><span role="columnheader">{nameLabel}</span><span role="columnheader">{temperature === 1 ? '1 · logit z' : '1 · logit s ÷ τ'}</span><span role="columnheader">2 · exponentiate {exponent}</span><span role="columnheader">3 · share = {exponent} ÷ total</span><span role="columnheader">4 · gradient p − target</span></div>
      {names.map((name, i) => <div role="row" key={name} className={i === target ? 'lf-softmax-target' : ''}><span role="cell"><strong>{name}</strong>{i === target && <em> correct answer</em>}</span><span role="cell">{minus(scaled[i].toFixed(2))}</span><span role="cell">{weights[i].toFixed(3)}</span><span role="cell" className="lf-bar-cell"><i className="lf-bar lf-bar-share" style={{ width: `${Math.max(1, shares[i] * 100)}%` }} />{shares[i].toFixed(4)}</span><span role="cell" className="lf-grad">{minus((shares[i] - (i === target ? 1 : 0)).toFixed(4))}</span></div>)}
      <div role="row" className="lf-softmax-total"><span role="cell">total</span><span role="cell" /><span role="cell">{total.toFixed(3)}</span><span role="cell">1.0000</span><span role="cell">0</span></div>
    </div>
    <p className="lf-softmax-result">Loss = −log of the correct share = −log {shares[target].toFixed(4)} = <strong>{loss.toFixed(4)}</strong> nats.</p>
  </figure>;
}

// Structure diagrams of where an embedding loss sits. Photos are supplied inputs (cyan), the
// encoder is an operation whose weights θ are learned (amber tag), embeddings and losses are
// computed values (violet), backward flow is orange and dashed. Roles are written in words.
export function EmbeddingEncoderFigure() {
  const branches = [
    { role: 'anchor', photo: 'Photo 1 · Ana', point: 'a = (0, 0)' },
    { role: 'positive', photo: 'Photo 2 · Ana', point: 'p = (1, 0)' },
    { role: 'negative', photo: 'Photo 3 · Ben', point: 'n = (.72, .96)' },
  ];
  return <figure className="lf-figure lf-flow-figure" data-figure="embedding-encoder" id="embedding-encoder">
    <p className="lf-figure-label">Data moves down the page · <span className="lf-tag lf-tag-input">supplied</span> <span className="lf-tag lf-tag-param">learned</span> <span className="lf-tag lf-tag-computed">computed</span> <span className="lf-tag lf-tag-back">backward</span></p>
    <div className="lf-row" role="list" aria-label="Three photos">{branches.map(b => <div role="listitem" key={b.role} className="lf-node lf-node-input"><strong>{b.photo}</strong><span>the {b.role}</span></div>)}</div>
    <div className="lf-row lf-arrows" aria-hidden="true"><span>↓</span><span>↓</span><span>↓</span></div>
    <div className="lf-node lf-node-op"><strong>Encoder f<sub>θ</sub>: one network, applied to each photo</strong><span>three forward passes through the same weights <b className="lf-tag lf-tag-param">θ, learned</b></span></div>
    <div className="lf-row lf-arrows" aria-hidden="true"><span>↓</span><span>↓</span><span>↓</span></div>
    <div className="lf-row" role="list" aria-label="Three embeddings">{branches.map(b => <div role="listitem" key={b.role} className="lf-node lf-node-computed"><strong>{b.point}</strong><span>embedding of {b.photo.split(' · ')[1]} ({b.role})</span></div>)}</div>
    <div className="lf-row lf-arrows" aria-hidden="true"><span>↘</span><span>↓</span><span>↙</span></div>
    <div className="lf-node lf-node-op"><strong>Compare the points</strong><span>squared distance anchor–positive D²(a, p) = 1² + 0² = <b className="lf-computed">1</b></span><span>squared distance anchor–negative D²(a, n) = .72² + .96² = <b className="lf-computed">1.44</b></span></div>
    <div className="lf-arrows lf-single" aria-hidden="true"><span>↓</span></div>
    <div className="lf-node lf-node-computed"><strong>Loss L</strong><span>one number built from these distances; the next subsections choose its formula</span></div>
    <div className="lf-node lf-node-back"><strong>Backward, up through the same boxes</strong><span>The loss sends one push to each point, ∂L/∂a, ∂L/∂p and ∂L/∂n. Each push travels back through the encoder pass that made that point, and the three gradients for θ are <em>added</em>, because θ is shared.</span></div>
  </figure>;
}

export function SimClrPipelineFigure() {
  const images = [['A', ['A₁', 'A₂']], ['B', ['B₁', 'B₂']]];
  const views = ['A₁', 'A₂', 'B₁', 'B₂'];
  const rowA = { 'A₁': 'self', 'A₂': '.9', 'B₁': '.3', 'B₂': '.2' };
  return <figure className="lf-figure lf-flow-figure" data-figure="simclr-pipeline" id="simclr-pipeline">
    <p className="lf-figure-label">Data moves down the page · no labels: two photos, A and B (N = 2)</p>
    <div className="lf-pair-images">{images.map(([name, pair]) => <div key={name} className="lf-image-branch">
      <div className="lf-node lf-node-input"><strong>Photo {name}</strong><span>one unlabelled image</span></div>
      <div className="lf-arrows lf-single" aria-hidden="true"><span>↓</span></div>
      <div className="lf-node lf-node-op lf-node-small">two random augmentations: crop + recolour, twice</div>
      <div className="lf-arrows" aria-hidden="true"><span>↙</span><span>↘</span></div>
      <div className="lf-row">{pair.map(v => <div key={v} className="lf-node lf-node-computed"><strong>view {v}</strong></div>)}</div>
    </div>)}</div>
    <div className="lf-row lf-arrows" aria-hidden="true"><span>↓</span><span>↓</span><span>↓</span><span>↓</span></div>
    <div className="lf-node lf-node-op"><strong>The same encoder f<sub>θ</sub> for all four views, then a projection head g (a small extra layer used only for this loss)</strong><span>each view becomes a vector z = g(f<sub>θ</sub>(view)), scaled to length 1 <b className="lf-tag lf-tag-param">θ and g, learned</b></span></div>
    <div className="lf-row lf-arrows" aria-hidden="true"><span>↓</span><span>↓</span><span>↓</span><span>↓</span></div>
    <div className="lf-row" role="list" aria-label="Four unit-length embeddings">{views.map(v => <div role="listitem" key={v} className="lf-node lf-node-computed"><strong>z({v})</strong></div>)}</div>
    <div className="lf-arrows lf-single" aria-hidden="true"><span>↓</span></div>
    <div className="lf-node lf-node-op"><strong>Cosine similarity of every pair of z vectors: a 4 × 4 matrix</strong>
      <div className="lf-mask-wrap" role="region" tabIndex={0} aria-label="Similarity matrix, row A₁ filled in"><table className="lf-mask"><thead><tr><th scope="col">row</th>{views.map(v => <th scope="col" key={v}>{v}</th>)}</tr></thead><tbody>{views.map(r => <tr key={r}><th scope="row">{r}</th>{views.map(c => { const value = r === 'A₁' ? rowA[c] : r === c ? 'self' : '·'; const kind = r === c ? 'self' : r === 'A₁' ? (c === 'A₂' ? 'positive' : 'negative') : ''; return <td key={c} className={kind ? `lf-mask-${kind}` : ''}>{value}</td>; })}</tr>)}</tbody></table></div>
      <span>Row A₁: A₂ is the other view of the same photo, the <b className="lf-pos">positive</b> (.9); B₁ and B₂ are <b className="lf-neg">negatives</b> (.3, .2); A₁ with itself is always 1 and is excluded.</span></div>
    <div className="lf-arrows lf-single" aria-hidden="true"><span>↓</span></div>
    <div className="lf-node lf-node-computed"><strong>Each row is one multiple-choice softmax</strong><span>row A₁ with τ = .5 gives loss .4368</span></div>
    <div className="lf-node lf-node-back"><strong>Backward</strong><span>Every row's loss pushes on the z vectors it used; those pushes flow back through g and the one shared encoder, and add up in the gradient for θ.</span></div>
  </figure>;
}

export function FocalFactorFigure() {
  const rows = [[.99, .01005, .0001, .000001005], [.9, .1054, .01, .00105], [.5, .6931, .25, .1733], [.1, 2.3026, .81, 1.8651]];
  return <figure className="lf-figure" data-figure="focal-factor">
    <div className="lf-focal" role="table" aria-label="Cross-entropy, modulating factor and focal loss at four confidences, gamma 2">
      <div role="row" className="lf-focal-head"><span role="columnheader">pₜ (probability of the correct label)</span><span role="columnheader">cross-entropy −log pₜ</span><span role="columnheader">× factor (1 − pₜ)²</span><span role="columnheader">= focal loss</span></div>
      {rows.map(([pt, ce, factor, focal]) => <div role="row" key={pt}><span role="cell"><strong>{pt}</strong> {pt > .5 ? 'easy' : 'hard'}</span><span role="cell">{ce < .02 ? ce.toFixed(5) : ce.toFixed(4)}</span><span role="cell">{factor}</span><span role="cell" className="lf-bar-cell"><i className="lf-bar lf-bar-focal" style={{ width: bar(focal, 2.3026) }} />{focal < .001 ? '1.0 × 10⁻⁶' : focal.toPrecision(3)}</span></div>)}
    </div>
    <div className="lf-crowd flow-columns-2">
      <p><strong>1000 easy examples at pₜ = .99</strong><br />cross-entropy total 10.05 · focal total 0.001</p>
      <p><strong>1 hard example at pₜ = .1</strong><br />cross-entropy 2.30 · focal 1.87</p>
    </div>
  </figure>;
}

export function PairPenaltyFigure() {
  const distances = Array.from({ length: 41 }, (_, i) => i / 20);
  return <figure className="lf-figure" data-figure="pair-penalty" id="pair-penalty">
    <LossCurvePlot ariaLabel="Pair loss against distance D, margin 1. Matching pair: D squared, .04 at D = .2. Different pair: max(0, 1 − D) squared, .64 at D = .2 and 0 from D = 1 onward, including D = 1.2."
      xLabel="distance D between the two embeddings" yLabel="pair loss" xDomain={[0, 2]} yDomain={[0, 1.25]} xTicks={[0, .2, 1, 1.2, 2]} yTicks={[0, .5, 1]}
      series={[
        { label: 'same pair: D²', color: '#e4b752', labelAt: [1.02, 1.12], values: distances.filter(d => d <= 1).map(d => [d, d * d]) },
        { label: 'different pair: max(0, 1 − D)²', color: '#83b4e8', dashed: true, labelAt: [.12, 1.15], values: distances.map(d => [d, Math.max(0, 1 - d) ** 2]) },
      ]}
      points={[
        { x: .2, y: .04, color: '#e4b752', label: '.04', dx: 8, dy: -8 },
        { x: .2, y: .64, color: '#83b4e8', label: '.64', dx: 10, dy: 4 },
        { x: 1.2, y: 0, color: '#83b4e8', label: '0 beyond the margin', dx: 8, dy: -12 },
      ]} />
  </figure>;
}

export function SimClrMaskFigure() {
  const views = ['A₁', 'A₂', 'B₁', 'B₂'];
  const short = { positive: 'pos', negative: 'neg', 'self: excluded': 'self' };
  const cell = text => <><span className="lf-mask-long">{text}</span><span className="lf-mask-short" aria-hidden="true">{short[text]}</span></>;
  const role = (row, column) => row === column ? 'self: excluded' : Math.floor(row / 2) === Math.floor(column / 2) ? 'positive' : 'negative';
  return <figure className="lf-figure" data-figure="simclr-masks" id="simclr-masks">
    <div className="lf-mask-pair flow-columns-2">
      <div><p className="lf-pull-name"><strong>Photo–caption pairs, N × N</strong></p><table className="lf-mask"><thead><tr><th scope="col">query</th><th scope="col">caption A</th><th scope="col">caption B</th></tr></thead><tbody>{['A', 'B'].map((q, i) => <tr key={q}><th scope="row">photo {q}</th>{['A', 'B'].map((k, j) => <td key={k} className={i === j ? 'lf-mask-positive' : 'lf-mask-negative'}>{cell(i === j ? 'positive' : 'negative')}</td>)}</tr>)}</tbody></table><p className="lf-figure-note">N = 2 candidates per row</p></div>
      <div><p className="lf-pull-name"><strong>Two views per image, 2N × 2N</strong></p><table className="lf-mask"><thead><tr><th scope="col">view</th>{views.map(v => <th scope="col" key={v}>{v}</th>)}</tr></thead><tbody>{views.map((v, i) => <tr key={v}><th scope="row">{v}</th>{views.map((k, j) => <td key={k} className={'lf-mask-' + role(i, j).split(':')[0]}>{cell(role(i, j))}</td>)}</tr>)}</tbody></table><p className="lf-figure-note">2N − 1 = 3 candidates per row</p></div>
    </div>
    <p className="lf-figure-note"><b className="lf-pos">pos (amber): positive</b> · <b className="lf-neg">neg (blue): negative</b> · <s>self</s>: the view itself, excluded</p>
  </figure>;
}

export function AngularMarginFigure() {
  const point = degrees => [150 + 100 * Math.cos(degrees * Math.PI / 180), 150 - 100 * Math.sin(degrees * Math.PI / 180)];
  const [x30, y30] = point(30), [x40, y40] = point(40);
  return <figure className="lf-figure" data-figure="angular-margin" aria-label="Angular margin lowers the target score without moving the feature">
    <svg className="lf-angle" viewBox="0 0 310 235" role="img" aria-label="True-class direction at zero degrees, feature at thirty degrees, scoring angle at forty degrees"><path d="M 250 150 A 100 100 0 0 0 150 50" fill="none" stroke="#817868" /><line x1="150" y1="150" x2="260" y2="150" stroke="#d4d0c8" /><line x1="150" y1="150" x2={x30} y2={y30} stroke="#c7a5ee" strokeWidth="3" /><line x1="150" y1="150" x2={x40} y2={y40} stroke="#c7a5ee" strokeDasharray="5 4" /><path d="M 205 150 A 55 55 0 0 0 197.63 122.5" stroke="#d4d0c8" fill="none" /><circle cx={x30} cy={y30} r="4" fill="#c7a5ee" /><text x="149" y="177">class direction · 0°</text><text x="16" y="205">solid: feature at φ = 30°</text><text x="16" y="226">dashed: scored at φ + m = 40°</text></svg>
  </figure>;
}
