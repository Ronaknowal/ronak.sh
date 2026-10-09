import { useEffect, useId, useRef, useState } from 'react';
import {
  expertColours, sum, dot, softmax, logsumexp, mixtureTrace, swiglu,
  capacityTrace, binomialLoad, balance, gradientTerms, scopeTrace,
  biasReplay, expertBudget, systemsTrace, savedPrediction,
} from '../../data/moe-training-models.js';
import study from '../../data/moe-training-study.json';
import './moe-training-flow.css';

const number = (value, digits = 4) => Number.isInteger(value)
  ? String(value) : value.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '');
const vector = values => `[${values.map(value => number(value)).join(', ')}]`;
const colour = id => expertColours[id % expertColours.length];

function Figure({ id, children, caption }) {
  return <figure className="moet-figure" data-moe-figure={id}>
    {children}
    <figcaption>{caption}</figcaption>
  </figure>;
}

function Controls({ children, reset }) {
  return <div className="moet-controls">
    {children}
    {reset && <button type="button" onClick={reset}>Reset</button>}
  </div>;
}

function Range({ label, value, min, max, step = 1, onChange }) {
  const id = useId();
  return <label className="moet-control" htmlFor={id}>
    <span>{label}: <output htmlFor={id}>{number(value)}</output></span>
    <input id={id} type="range" min={min} max={max} step={step} value={value}
      onChange={event => onChange(Number(event.target.value))} />
  </label>;
}

function Select({ label, value, options, onChange }) {
  const id = useId();
  return <label className="moet-control" htmlFor={id}>
    <span>{label}</span>
    <select id={id} value={value} onChange={event => onChange(event.target.value)}>
      {options.map(([key, name]) => <option key={key} value={key}>{name}</option>)}
    </select>
  </label>;
}

function Scroll({ label, children }) {
  const ref = useRef(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const element = ref.current;
    const update = () => setOverflow(element.scrollWidth > element.clientWidth + 1);
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    update();
    return () => observer.disconnect();
  }, []);
  return <div className="moet-scroll-shell">
    <div ref={ref} className="moet-scroll" role="region" tabIndex={0}
      aria-label={`${label}${overflow ? '; scroll horizontally with arrow keys' : ''}`}>
      {children}
    </div>
    {overflow && <p className="moet-scroll-cue">↔ More columns: scroll sideways, or focus here and use arrow keys.</p>}
  </div>;
}

function Matrix({ name, rows, expert, selected, annotation }) {
  return <div className="moet-matrix-object" style={{ '--expert': expert == null ? '#bfc3c9' : colour(expert) }}>
    <div className="moet-matrix-label"><strong>{name}</strong>{annotation && <span>{annotation}</span>}</div>
    <Scroll label={name}>
      <table className="moet-matrix"><tbody>{rows.map((row, rowIndex) =>
        <tr key={rowIndex}>{row.map((value, column) =>
          <td key={column} data-selected={selected?.(rowIndex, column) || undefined}>
            {typeof value === 'number' ? number(value) : value}
          </td>)}</tr>)}</tbody></table>
    </Scroll>
  </div>;
}

export function MoeTrainingTable({ label, caption, headers, rows }) {
  const title = label || caption;
  return <div className="moet-table-object">
    <p className="moet-table-caption">{title}</p>
    <Scroll label={title}>
    <table className="moet-table" aria-label={title}>
      <thead><tr>{headers.map((header, index) => <th key={index} scope="col">{header}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}>{row.map((value, column) =>
        column === 0 ? <th key={column} scope="row">{value}</th> : <td key={column}>{value}</td>
      )}</tr>)}</tbody>
    </table>
    </Scroll>
  </div>;
}

const Table = MoeTrainingTable;

function Arrow({ children = '↓', backward = false }) {
  return <div className={`moet-arrow${backward ? ' moet-backward' : ''}`}>{children}</div>;
}

function ExpertKey({ count = 4 }) {
  return <div className="moet-key">{Array.from({ length: count }, (_, id) =>
    <span key={id} style={{ color: colour(id) }}><i />E{id}</span>)}
    <span className="moet-key-selection">Outline = selected</span>
  </div>;
}

function MapDrawing({ expert = 0, width = 3, hidden = 6, selected = true, linear = false }) {
  const input = Array.from({ length: width }, (_, index) => 18 + index * 54 / Math.max(1, width - 1));
  const middle = Array.from({ length: hidden }, (_, index) => 10 + index * 70 / Math.max(1, hidden - 1));
  return <svg className="moet-network" viewBox="0 0 170 90" role="img"
    aria-label={linear ? `Expert ${expert}: ${expert + 1} times the ${width}-by-${width} identity; only diagonal connections are nonzero`
      : `Expert ${expert}: ${width} shown input coordinates map to ${hidden}, then return to ${width}`}>
    <g stroke={colour(expert)} strokeWidth=".7" opacity={selected ? .4 : .16}>
      {linear ? input.map((y, i) => <path key={i} d={`M12 ${y} L158 ${y}`} />) : <>
        {input.flatMap((y, i) => middle.map((z, j) => <path key={`a${i}-${j}`} d={`M12 ${y} L85 ${z}`} />))}
        {middle.flatMap((y, i) => input.map((z, j) => <path key={`b${i}-${j}`} d={`M85 ${y} L158 ${z}`} />))}
      </>}
    </g>
    {[input, linear ? [] : middle, input].map((column, index) => column.map((y, i) =>
      <circle key={`${index}-${i}`} cx={[12, 85, 158][index]} cy={y} r="3.6"
        fill="#222" stroke={colour(expert)} strokeWidth={selected ? 1.7 : .7} />))}
  </svg>;
}

export function MoeTrainingAnatomy() {
  return <Figure id="M01" caption="Coordinate circles and connecting maps show width, not numerical weight magnitude. Expert colours retain their identities through later figures.">
    <div className="moet-context">
      <Matrix name="Permitted prefix: separate token positions" rows={[
        ['position 0', 'position 1', 'position t'], ['Alice', 'was', '…'],
      ]} annotation="Causal attention produces one contextual row per position." />
      <Arrow>Select the contextual row at position t</Arrow>
      <Matrix name="One row x: coordinates within that position" rows={[
        ['x₀', 'x₁', 'x₂'],
      ]} annotation="Three coordinates shown from its d-coordinate vector." />
      <Arrow />
      <div className="moet-residual">
        <div className="moet-saved"><span>Saved row x</span><div className="moet-bypass" /><span>+ x</span></div>
        <div className="moet-transform">
          <p>Normalize → router → two selected FFNs</p>
          <div className="moet-bank">{expertColours.map((_, id) => <div key={id}
            className="moet-expert" data-selected={id < 2 || undefined} style={{ '--expert': colour(id) }}>
            <strong>E{id}: separate matrices</strong><MapDrawing expert={id} selected={id < 2} />
            <span>d → m → d</span>
          </div>)}</div>
          <Arrow>Weighted sum of returned d-coordinate rows</Arrow>
          <Matrix name="Residual result" rows={[["x₀ + Y₀", "x₁ + Y₁", "x₂ + Y₂"]]} />
        </div>
      </div>
      <Arrow>Later decoder layers → output head → next-token probabilities</Arrow>
    </div>
  </Figure>;
}

export function MoeTrainingRouting() {
  const [convention, setConvention] = useState('selected');
  const [k, setK] = useState(2);
  const [third, setThird] = useState(0);
  const trace = mixtureTrace({ logits: [Math.log(4), Math.log(2), third], k, convention });
  return <Figure id="M02" caption="IDs are selected before returned vectors are weighted. A white outline marks requests; the expert's identity colour stays fixed when selection changes. Lower ID breaks an exact tie.">
    <div className="moet-row">
      <Matrix name="Router W" rows={[["w₀₀", "w₀₁"], ["w₁₀", "w₁₁"], ["w₂₀", "w₂₁"]]} annotation="E × d" />
      <Arrow>×</Arrow><Matrix name="Context x" rows={[["x₀"], ["x₁"]]} annotation="d × 1" />
      <Arrow>=</Arrow><Matrix name="Logits z" rows={trace.logits.map(value => [value])} annotation="E × 1" />
    </div>
    <div className="moet-branches">{trace.affinity.map((p, id) => <div key={id} className="moet-expert"
      style={{ '--expert': colour(id) }} data-selected={trace.ids.includes(id) || undefined}>
      <strong>E{id}</strong><p>p = {number(p)}</p>
      <MapDrawing expert={id} width={2} selected={trace.ids.includes(id)} />
      <Matrix name={`F${id}(x)`} rows={[trace.returns[id]]} expert={id} />
      <p>× gate {number(trace.gates[id])}</p>
      <Matrix name={`E${id} contribution`} rows={[trace.contributions[id]]} expert={id} />
    </div>)}</div>
    <div className="moet-sum">Σ contributions → Y = {vector(trace.output)}</div>
    <Controls reset={() => { setConvention('selected'); setK(2); setThird(0); }}>
      <Select label="Gate convention" value={convention} onChange={setConvention}
        options={[["selected", "Selected gates"], ["full", "Full softmax"]]} />
      <Range label="Requested experts k" value={k} min={1} max={3} onChange={setK} />
      <Range label="E2 logit" value={third} min={-2} max={2} step={.25} onChange={setThird} />
    </Controls>
    <p>Requested IDs {vector(trace.ids)}; applied denominator {number(trace.denominator)};
      applied gate sum {number(sum(trace.gates))}. Add Y to the saved row after this sum.</p>
  </Figure>;
}

export function MoeTrainingSwiGLU() {
  const [value, setValue] = useState(2);
  const x = [1, value], identity = [[1, 0], [0, 1]];
  const trace = swiglu(x, identity, identity, identity);
  return <Figure id="M03" caption="This two-coordinate cutaway uses identity matrices to expose SiLU and elementwise multiplication. A learned dense map usually mixes coordinates.">
    <Matrix name="Input x" rows={[x]} />
    <div className="moet-fork">
      <div><Arrow>Gx, G = identity</Arrow><Matrix name="Gate preactivation a" rows={[trace.a]} />
        <Arrow>a × sigmoid(a)</Arrow><Matrix name="SiLU(a)" rows={[trace.activation]} /></div>
      <div><Arrow>Ux, U = identity</Arrow><Matrix name="Value branch b" rows={[trace.b]} />
        <div className="moet-long-wire" aria-hidden="true" /></div>
    </div>
    <Arrow>Corresponding coordinates multiply ⊙</Arrow>
    <Matrix name="Intermediate h" rows={[trace.product]} />
    <Arrow>Dh, D = identity</Arrow><Matrix name="Expert return F(x)" rows={[trace.output]} />
    <Controls reset={() => setValue(2)}><Range label="Second input coordinate" value={value} min={-3} max={3} step={.5} onChange={setValue} /></Controls>
    <p>Setting the second input to zero makes that branch product zero. This gate acts inside one FFN; it is separate from the router's weight for the whole returned row.</p>
  </Figure>;
}

export function MoeTrainingBackward() {
  const [mode, setMode] = useState('selected');
  const [k, setK] = useState(2);
  const [fixture, setFixture] = useState('ordinary');
  const returns = fixture === 'equal' ? [[2, 0], [2, 0], [2, 0]] : [[2, 0], [0, 3], [1, 1]];
  const accepted = fixture === 'partial' ? [false, true, true] : fixture === 'dropped' ? [false, false, false] : [true, true, true];
  const trace = mixtureTrace({ k, convention: mode, returns, accepted });
  return <Figure id="M04" caption="Backward arrows hold requested IDs and capacity decisions fixed. The diagnostic L = [1,1]·Y is a local directional loss, not the language-model objective.">
    <Matrix name="Upstream r = ∂L/∂Y" rows={[[1, 1]]} />
    <Arrow backward>↑ sum Y = {vector(trace.output)}; r·Y = {number(trace.objective)}</Arrow>
    <div className="moet-branches">{trace.returns.map((row, id) => <div key={id}
      className="moet-expert" style={{ '--expert': colour(id) }} data-selected={trace.ids.includes(id) || undefined}>
      <strong>E{id}{!accepted[id] ? ' · rejected' : ''}</strong>
      <Matrix name="Return" rows={[row]} expert={id} />
      <Arrow backward>↑ g × r × accepted</Arrow>
      <Matrix name="Expert-return gradient" rows={[trace.returnGradient[id]]} expert={id} />
      <p>Applied gate {number(trace.gates[id])}; selected {trace.ids.includes(id) ? 'yes' : 'no'}</p>
      <div className="moet-denominator">Shared denominator → logit credit {number(trace.logitGradient[id])}</div>
    </div>)}</div>
    <Controls reset={() => { setMode('selected'); setK(2); setFixture('ordinary'); }}>
      <Select label="Weight rule" value={mode} onChange={setMode} options={[["selected", "Selected softmax"], ["full", "Retained full softmax"]]} />
      <Range label="Requested k" value={k} min={1} max={3} onChange={setK} />
      <Select label="Changed graph" value={fixture} onChange={setFixture} options={[
        ['ordinary', 'Distinct returns'], ['equal', 'Equal returns'],
        ['partial', 'Reject E0 only'], ['dropped', 'Reject every branch'],
      ]} />
    </Controls>
    <p>Router-logit gradient {vector(trace.logitGradient)}. For the parameter row Wᵢ,
      multiply this scalar by input xᵀ. The input also receives the router path and accepted expert-map paths;
      the saved residual carries its own upstream gradient.</p>
  </Figure>;
}

export function MoeTrainingCapacity() {
  const [capacity, setCapacity] = useState(2);
  const [priority, setPriority] = useState(0);
  const [changed, setChanged] = useState(false);
  const routes = [[0, 1], [0, 1], [0, 2], changed ? [1, 2] : [0, 2]];
  const trace = capacityTrace(routes, capacity, priority);
  const full = capacityTrace(routes, 4, priority);
  return <Figure id="M05" caption="Each request retains its token and slot address. Rejected entries are crossed; accepted returns scatter back to their original token. Gates remain 1/2, even when the other request is rejected.">
    <Matrix name="Requested addresses: token rows × two slots" rows={routes.map((row, token) => row.map((id, slot) => `t${token}/s${slot} → E${id}`))} />
    <Arrow>Stable grouping by expert; chosen token first, then original order</Arrow>
    <div className="moet-branches">{trace.queues.map((queue, id) => <div key={id}
      className="moet-queue" style={{ '--expert': colour(id) }}>
      <strong>E{id} queue · {queue.length} requests</strong>
      {queue.map(item => <div key={`${item.token}-${item.slot}`} data-rejected={!item.accepted || undefined}>
        t{item.token}/s{item.slot} {item.accepted ? '✓ run' : '× reject'}
      </div>)}
      <p>Return scalar {id + 1}; capacity {capacity}</p>
    </div>)}</div>
    <Arrow>Return by token/slot, multiply by 1/2 and add</Arrow>
    <Table label="Same requests, changed acceptance" headers={['Token', 'Dropless Y', 'Capped Y', '10 + capped Y']}
      rows={trace.updates.map((value, token) => [`t${token}`, full.updates[token], value, 10 + value])} />
    <Controls reset={() => { setCapacity(2); setPriority(0); setChanged(false); }}>
      <Range label="Slots per expert C" value={capacity} min={0} max={4} onChange={setCapacity} />
      <Select label="First-priority token" value={priority} onChange={value => setPriority(Number(value))}
        options={[0, 1, 2, 3].map(token => [token, `t${token}`])} />
      <button type="button" aria-pressed={changed} onClick={() => setChanged(value => !value)}>t3 requests {changed ? 'E1/E2' : 'E0/E2'}</button>
    </Controls>
    <p>{trace.rejected}/8 assignments rejected; {trace.dropped}/4 complete tokens lose both branches.
      A full drop preserves residual 10. The denominators count different things.</p>
  </Figure>;
}

export function MoeTrainingRandomLoad() {
  const [tokens, setTokens] = useState(512), [k, setK] = useState(2), [factor, setFactor] = useState(1);
  const trace = binomialLoad(tokens, 8, k, factor);
  const low = Math.max(0, Math.min(trace.capacity - 2, Math.floor(trace.mean - 4 * Math.sqrt(trace.variance))));
  const high = Math.min(tokens, Math.ceil(Math.max(trace.mean + 4 * Math.sqrt(trace.variance), trace.capacity + 2)));
  const maximum = Math.max(...trace.pmf);
  const width = 560, height = 140;
  return <Figure id="M06" caption="Exact binomial masses; display zooms around the mean. All 0…T outcomes enter both reported sums. Amber marks N > C, with excess slots encoded by the lower bars.">
    <div className="moet-chart-label">P(N = n) for one expert · E = 8 · uniform independent top-k subsets</div>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Binomial probability bars with overload tail">
      {trace.pmf.slice(low, high + 1).map((mass, index) => {
        const x = index * width / (high - low + 1), bar = mass / maximum * 115;
        return <rect key={index} x={x} y={120 - bar} width={width / (high - low + 1) * .82} height={bar}
          fill={index + low > trace.capacity ? '#e8b860' : '#82b4ff'} />;
      })}
      <path d={`M${(trace.capacity - low + .5) * width / (high - low + 1)} 0 V125`} stroke="#fff" strokeDasharray="3 3" />
    </svg>
    <div className="moet-axis"><span>n = {low}</span><span>capacity C = {trace.capacity}</span><span>n = {high}</span></div>
    <div className="moet-chart-label">Expected excess contribution (n − C)₊ P(N = n)</div>
    <svg viewBox={`0 0 ${width} 65`} role="img" aria-label="Expected excess-slot contributions">
      {trace.pmf.slice(low, high + 1).map((mass, index) => {
        const excess = Math.max(0, index + low - trace.capacity) * mass;
        const scale = Math.max(1e-20, ...trace.pmf.map((p, n) => Math.max(0, n - trace.capacity) * p));
        return <rect key={index} x={index * width / (high - low + 1)} y={60 - 55 * excess / scale}
          width={width / (high - low + 1) * .82} height={55 * excess / scale} fill="#f093b7" />;
      })}
    </svg>
    <p className="moet-small">The two vertical scales differ. Upper peak mass: {number(maximum, 6)};
      lower peak contribution: {number(Math.max(...trace.pmf.map((mass, n) => Math.max(0, n - trace.capacity) * mass)), 6)} expected slots.</p>
    <Controls reset={() => { setTokens(512); setK(2); setFactor(1); }}>
      <Select label="Routed rows T" value={tokens} onChange={value => setTokens(Number(value))} options={[[32, '32'], [128, '128'], [512, '512']]} />
      <Range label="Selected k" value={k} min={1} max={4} onChange={setK} />
      <Range label="Capacity factor c" value={factor} min={.5} max={1.5} step={.05} onChange={setFactor} />
    </Controls>
    <p>Mean {number(trace.mean)}; variance {number(trace.variance)}; C = ceil(cTk/E) = {trace.capacity}.
      Overload-event probability {number(trace.tail, 6)}; expected rejected-assignment fraction {number(trace.rejectedShare, 6)}.</p>
  </Figure>;
}

export function MoeTrainingBalance() {
  const [fixture, setFixture] = useState('worked'), [logit, setLogit] = useState(0);
  const initial = fixture === 'worked' ? [[.6, .3, .1], [.5, .4, .1], [.2, .7, .1], [.1, .2, .7]]
    : fixture === 'ties' ? [[.5, .5], [.5, .5], [.5, .5], [.5, .5]]
      : [[.51, .49], [.51, .49], [.51, .49], [.001, .999]];
  const rows = initial.map((row, index) => index === 0
    ? softmax(row.map((value, id) => Math.log(value) + (id === 0 ? logit : 0))) : row);
  const trace = balance(rows);
  return <Figure id="M07" caption="The same probability matrix forks into hard requested counts and differentiable column means. Counts are held constant for the local derivative; moving across a tie changes that discrete branch.">
    <Matrix name={`Rows pₜ · columns ${trace.counts.map((_, id) => `E${id}`).join(', ')}`} rows={rows} selected={(row, column) => trace.ids[row].includes(column)} />
    <div className="moet-fork">
      <div><Arrow>top-1 → count → divide by Tk = 4</Arrow><Matrix name="f (stop gradient)" rows={[trace.hard]} /></div>
      <div><Arrow>column sum → divide by T = 4</Arrow><Matrix name="P (differentiable)" rows={[trace.soft]} /></div>
    </div>
    <div className="moet-sum">{trace.counts.length} × Σ fᵢPᵢ = {number(trace.loss, 6)}</div>
    <Controls reset={() => { setFixture('worked'); setLogit(0); }}>
      <Select label="Probability fixture" value={fixture} onChange={setFixture}
        options={[["worked", "Worked example"], ["counterexample", "Counterexample"], ["ties", "Equal rows"]]} />
      <Range label="First-row E0 logit change" value={logit} min={-1} max={1} step={.05} onChange={setLogit} />
    </Controls>
    <Table label="Corresponding expert columns" headers={['Expert', 'Requested count', 'f', 'P', 'f × P']}
      rows={trace.counts.map((count, id) => [`E${id}`, count, number(trace.hard[id]), number(trace.soft[id]), number(trace.hard[id] * trace.soft[id])])} />
    <p>Count CV² = {number(trace.cvSquared)}; maximum/mean load = {number(trace.peak)}.
      First-row logit derivative {vector(trace.gradient[0])}. The balance surrogate is neither a percentage nor a guaranteed distance above one.</p>
  </Figure>;
}

export function MoeTrainingGradient() {
  const [alpha, setAlpha] = useState(.5), [beta, setBeta] = useState(0);
  const trace = gradientTerms(alpha, beta, 1);
  const lanes = [['Task', trace.task, '#82b4ff'], ['α balance', trace.auxiliary, '#e8b860'], ['β z-loss', trace.z, '#bb9aff'], ['Sum', trace.total, '#eeeeee']];
  const magnitude = Math.max(.2, ...lanes.flatMap(([, row]) => row.map(Math.abs)));
  return <Figure id="M08" caption="Actual logit derivatives of one full-softmax top-1 directional example. The common logit offset is +1, so z-loss has a visible gradient when β is nonzero. Learning rate is 0.1.">
    <div className="moet-gradient-lanes">{lanes.map(([name, values, hue]) => <div key={name}>
      <strong style={{ color: hue }}>{name}</strong>
      {values.map((value, id) => <div className="moet-signed-row" key={id}>
        <span>E{id}</span><div className="moet-signed-track"><i style={{
          left: value < 0 ? `${50 + 45 * value / magnitude}%` : '50%',
          width: `${45 * Math.abs(value) / magnitude}%`, background: hue,
        }} /></div><span>{number(value)}</span>
      </div>)}
    </div>)}</div>
    <Controls reset={() => { setAlpha(.5); setBeta(0); }}>
      <Range label="Balance coefficient α" value={alpha} min={0} max={1} step={.05} onChange={setAlpha} />
      <Range label="z coefficient β" value={beta} min={0} max={.2} step={.01} onChange={setBeta} />
    </Controls>
    <p>Task/auxiliary cosine: {trace.cosine == null ? 'undefined (zero auxiliary vector)' : number(trace.cosine)}.
      Old logits {vector(trace.logits)} → old − 0.1 × sum → {vector(trace.updated)}.
      At α = .5 and β = 0 the opposing derivatives cancel in this example.</p>
  </Figure>;
}

export function MoeTrainingZLoss() {
  const [offset, setOffset] = useState(0);
  const logits = [Math.log(.99) + offset, Math.log(.01) + offset];
  const maximum = Math.max(...logits);
  const exps = logits.map(value => Math.exp(value - maximum));
  const normalizer = logsumexp(logits);
  return <Figure id="M09" caption="The stable circuit subtracts the maximum for exponentiation and adds it back after the logarithm. A common shift cancels in softmax but survives in log-sum-exp.">
    <Matrix name="Shifted logits" rows={[logits]} />
    <Arrow>subtract max {number(maximum)} → exp</Arrow>
    <Matrix name="Safe exponential masses" rows={[exps]} />
    <div className="moet-fork">
      <div><Arrow>divide by sum {number(sum(exps))}</Arrow><Matrix name="Unchanged probabilities" rows={[softmax(logits)]} /></div>
      <div><Arrow>log(sum) + max → square</Arrow><Matrix name="Normalizer ℓ and ℓ²" rows={[[normalizer, normalizer * normalizer]]} /></div>
    </div>
    <Controls reset={() => setOffset(0)}><Range label="Common score shift" value={offset} min={-4} max={4} step={.25} onChange={setOffset} /></Controls>
    <p>E0 still wins with probability .99. Squared z-loss = {number(normalizer * normalizer)}.
      Zero z-loss at offset zero coexists with concentrated routing.</p>
  </Figure>;
}

export function MoeTrainingScope() {
  const [equal, setEqual] = useState(false), [moved, setMoved] = useState(false);
  const trace = scopeTrace(equal, moved);
  return <Figure id="M10" caption="Moving the middle row changes group membership but preserves the pooled dataset. Each group first forms its own hard/soft product; pooling multiplies different means.">
    <div className="moet-fork">{trace.groups.map((rows, index) => <div key={index}>
      <Matrix name={`Group ${index === 0 ? 'A' : 'B'}: ${rows.length} rows`} rows={rows} />
      <Arrow>count fraction × mean probability × 2</Arrow>
      <p>f = {vector(trace.local[index].hard)}, P = {vector(trace.local[index].soft)}</p>
      <p>Local loss {number(trace.local[index].loss)}</p>
    </div>)}</div>
    <div className="moet-fork">
      <div className="moet-sum">Token-weighted local losses<br />{number(trace.weightedLocal, 6)}</div>
      <div className="moet-sum">Pooled f = {vector(trace.global.hard)}<br />Pooled P = {vector(trace.global.soft)}<br />Pooled loss {number(trace.global.loss, 6)}</div>
    </div>
    <Controls reset={() => { setEqual(false); setMoved(false); }}>
      <button type="button" aria-pressed={moved} onClick={() => setMoved(value => !value)}>Middle row in {moved ? 'B' : 'A'}</button>
      <button type="button" aria-pressed={equal} onClick={() => setEqual(value => !value)}>{equal ? 'Identical rows' : 'Contrasting rows'}</button>
    </Controls>
    <p>Pooling is unchanged by the move. Identical rows make the two objectives agree.</p>
    <div className="moet-layer-panels">
      <div><strong>Layer 1, its own matrices</strong><Matrix name="Requested fractions" rows={[[1, 0]]} /><MapDrawing expert={0} /></div>
      <div><strong>Layer 2, different matrices</strong><Matrix name="Requested fractions" rows={[[0, 1]]} /><MapDrawing expert={1} /></div>
    </div>
    <p>Pooling these layers gives [1/2,1/2], hiding collapse in each separate bank. E0 in layer 1 does not share E0's parameters in layer 2.</p>
  </Figure>;
}

export function MoeTrainingReplicas() {
  const trace = scopeTrace();
  const pooled = trace.global;
  const localGlobalGradients = trace.groups.map(group => group.map(row =>
    row.map((probability, id) => 2 / group.length * probability * (pooled.hard[id] - dot(pooled.hard, row)))));
  const sumRows = rows => rows[0].map((_, column) => sum(rows.map(row => row[column])));
  const scaled = localGlobalGradients.map((rows, index) => sumRows(rows).map(value => value * trace.replicaScales[index]));
  const averaged = scaled[0].map((value, id) => (value + scaled[1][id]) / 2);
  return <Figure id="M11" caption="The example differentiates a shared additive router offset, so row gradients sum within a replica. Detached global counts and differentiable local probabilities have different communication paths.">
    <div className="moet-ranks">{trace.groups.map((rows, index) => <div className="moet-rank" key={index}>
      <strong>Replica {index} · Tlocal = {rows.length}</strong>
      <Matrix name="Local probabilities" rows={rows} />
      <Arrow>Detached counts → all-reduce sum</Arrow>
      <p>Global f received: {vector(pooled.hard)}</p>
      <Arrow backward>Local P → loss → gradient</Arrow>
      <p>Scale W Tlocal/Tglobal = {number(trace.replicaScales[index])}</p>
      <Matrix name="Scaled parameter gradient" rows={[scaled[index]]} />
    </div>)}</div>
    <Arrow backward>Replica parameter-gradient average: divide sum by W = 2</Arrow>
    <Matrix name="Reconstructed pooled gradient" rows={[averaged]} />
    <Matrix name="Direct full-group gradient" rows={[sumRows(pooled.gradient)]} />
    <p>Both routes give {vector(averaged)}. Omitting the factor W while still averaging would halve this gradient.
      All-reducing integer counts does not magically propagate a gradient through those counts.</p>
  </Figure>;
}

export function MoeTrainingBias() {
  const [speed, setSpeed] = useState(.02), [affinity, setAffinity] = useState(.8), [step, setStep] = useState(0);
  const replay = biasReplay(speed, affinity);
  const current = replay.history[step];
  const first = current.routes[0];
  return <Figure id="M12" caption="A deterministic replay of twelve repeated synthetic batches, not a fitted-model training curve. Original sigmoid affinities determine the weights; the bias only changes which IDs are requested.">
    <Matrix name="Original affinities s, first row" rows={[replay.affinities[0]]} />
    <div className="moet-fork">
      <div><Arrow>add old bias, then top-2</Arrow>
        <Matrix name="Selection scores s + b" rows={[replay.affinities[0].map((value, id) => value + current.bias[id])]} />
        <p>IDs {vector(first.ids)}</p></div>
      <div><Arrow>Gather original s at those IDs → normalize</Arrow>
        <Matrix name="Applied gates (same ID order)" rows={[first.gates]} />
        <p>Weighted scalar return, Fᵢ = i + 1: {number(sum(first.ids.map((id, index) => (id + 1) * first.gates[index])))}</p></div>
    </div>
    <div className="moet-feedback">
      <Matrix name={`Batch ${step} requested counts`} rows={[current.counts]} />
      <Arrow>target 8/3 − count → sign × u</Arrow>
      <Matrix name={`Bias for batch ${step + 1}`} rows={[current.nextBias]} />
      <p>Feedback enters the next batch; the current batch used {vector(current.bias)}.</p>
    </div>
    <Controls reset={() => { setSpeed(.02); setAffinity(.8); setStep(0); }}>
      <Range label="Bias update speed u" value={speed} min={0} max={.2} step={.01} onChange={setSpeed} />
      <Range label="First-row E0 affinity" value={affinity} min={.1} max={.9} step={.05} onChange={setAffinity} />
      <Range label="Displayed batch" value={step} min={0} max={11} onChange={setStep} />
    </Controls>
    <Table label="All twelve replay counts" headers={['Batch', 'E0', 'E1', 'E2']}
      rows={replay.history.map(item => [item.step, ...item.counts])} />
    <p>At u = 0 all feedback vanishes. Larger updates can alternate the overloaded expert; they do not guarantee that identical rows split within a batch.</p>
  </Figure>;
}

export function MoeTrainingCausality() {
  const [future, setFuture] = useState(.6);
  const currentSelected = .7 >= future;
  return <Figure id="M13" caption="Two sequences share the current prefix. A one-slot expert-choice queue compares the current row with a future row; changing only that future can remove the current branch.">
    <div className="moet-timeline">
      <div><strong>Permitted prefix</strong><Matrix name="Current row score" rows={[[.7]]} expert={0} /><span>prediction boundary</span></div>
      <div className="moet-future"><strong>Future suffix</strong><Matrix name="Competing row score" rows={[[future]]} expert={0} /><span>not permitted context</span></div>
    </div>
    <div className="moet-fork">
      <div><Arrow>Expert choice: compare both rows</Arrow><div className="moet-queue" style={{ '--expert': colour(0) }}>
        <strong>One slot</strong><div>{currentSelected ? 'Current row' : 'Future row'}</div>
      </div><p>Current row {currentSelected ? 'receives' : 'loses'} E0.</p></div>
      <div><Arrow>Token choice with frozen historical bias</Arrow><div className="moet-queue" style={{ '--expert': colour(0) }}>
        <strong>Current scores [.7,.4], bias [0,0]</strong><div>Current row → E0</div>
      </div><p>Future score has no edge into this decision.</p></div>
    </div>
    <Controls reset={() => setFuture(.6)}><Range label="Future competitor score" value={future} min={.1} max={.9} step={.1} onChange={setFuture} /></Controls>
  </Figure>;
}

export function MoeTrainingGranularity() {
  const [refinement, setRefinement] = useState(1), [shared, setShared] = useState(0), [perturb, setPerturb] = useState(false);
  const budget = expertBudget(refinement, shared);
  const parentColours = [...expertColours, '#73c6dd', '#e79268'];
  return <Figure id="M14" caption="Rectangle area encodes expert hidden width at fixed d = 24. In this separate six-parent budget example, colour tracks the original parent map, and P0.1 means child 1 of parent 0. Refinement preserves total expert-map area and selected work; the separate router grows with the routed candidate count.">
    <Scroll label="Equal-area expert map budget"><div className="moet-area-bank">{Array.from({ length: budget.experts }, (_, id) =>
      <div key={id} className="moet-area-expert" style={{ '--expert': parentColours[Math.floor(id / refinement)], width: `${100 / budget.experts}%` }}
        data-active={id < budget.active || undefined} data-shared={id < shared || undefined}>
        <span>P{Math.floor(id / refinement)}.{id % refinement}{id < shared ? ' S' : ''}</span>
      </div>)}</div></Scroll>
    <div className="moet-key"><span>Outline = active for one row</span><span>Hatching = always-on shared</span></div>
    <Matrix name="Router map shape (stored separately)" rows={[[budget.routed, '×', budget.width]]} />
    <Controls reset={() => { setRefinement(1); setShared(0); setPerturb(false); }}>
      <Select label="Refinement r" value={refinement} onChange={value => { setRefinement(Number(value)); setShared(0); }}
        options={[[1, '1'], [2, '2'], [3, '3'], [4, '4']]} />
      <Range label="Shared experts inside active budget" value={shared} min={0} max={budget.active - 1} onChange={setShared} />
    </Controls>
    <Table label="Exact map and work ledger" headers={['Quantity', 'Value']}
      rows={[
        ['Expert hidden width m/r', budget.hidden], ['Stored experts', budget.experts],
        ['Shared + selected routed', `${budget.shared} + ${budget.selected}`],
        ['Stored expert parameters', budget.expertParameters], ['Selected expert multiply-adds', budget.expertWork],
        ['Router parameters', budget.routerParameters],
      ]} />
    <div className="moet-upcycle">
      <Matrix name="Copied dense return F" rows={[[2, 3]]} />
      <div className="moet-fork"><Matrix name="First copy, gate 2/3" rows={[[2, 3]]} expert={0} />
        <Matrix name="Second copy, gate 1/3" rows={[[perturb ? 3 : 2, 3]]} expert={1} /></div>
      <Arrow>Normalized weighted sum</Arrow><Matrix name="Mixture return" rows={[[perturb ? 7 / 3 : 2, 3]]} />
      <Controls><button type="button" aria-pressed={perturb} onClick={() => setPerturb(value => !value)}>Perturb second copy: {perturb ? 'on' : 'off'}</button></Controls>
      <p>Identical copies return F because the gates sum to one. Changing a copy breaks the equality and can create router task credit.</p>
    </div>
  </Figure>;
}

const byteName = value => value === 256 ? 'BOS (input only)' : value === 32 ? 'space · 32'
  : value >= 33 && value <= 126 ? `${String.fromCharCode(value)} · ${value}` : `byte ${value}`;

export function MoeTrainingSavedModel() {
  const [model, setModel] = useState(null), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  const [index, setIndex] = useState(100), [disabled, setDisabled] = useState(-1);
  useEffect(() => {
    const controller = new AbortController();
    setFailed(false);
    fetch('/learn-assets/moe-training/model.json', { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Model unavailable'); return response.json(); })
      .then(value => { if (!controller.signal.aborted) setModel(value); })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [attempt]);
  if (!model) return <Figure id="M15" caption="The fixed auxiliary-policy, seed-17, step-400 weights load automatically.">
    <p role={failed ? 'alert' : 'status'}>{failed ? 'The saved model could not load.' : 'Loading saved model…'}</p>
    {failed && <button type="button" onClick={() => setAttempt(value => value + 1)}>Retry saved model</button>}
  </Figure>;
  const baseline = savedPrediction(model, index);
  const trace = disabled < 0 ? baseline : savedPrediction(model, index, disabled);
  const location = model.heldout_locations[index];
  const maximum = Math.max(...trace.probabilities);
  return <Figure id="M15" caption="Actual saved NumPy parameters, evaluated here without fitting. Ablation sets one expert's contribution to zero and preserves the original selected denominator. The fixed model is auxiliary policy, seed 17, step 400.">
    <p>Held-out paragraph {location[0]}, byte position {location[1]}; target {byteName(trace.target)}.</p>
    <Matrix name="Four strictly preceding byte IDs" rows={[trace.context.map(byteName)]} />
    <Arrow>Look up four rows of embedding [257 × 8], concatenate → width 32</Arrow>
    <div className="moet-embedding">{trace.context.map((id, position) =>
      <Matrix key={position} name={`Position ${position}: ${byteName(id)}`}
        rows={[trace.x.slice(position * 8, position * 8 + 8)]} />)}</div>
    <Arrow>Router [4 × 32] → sigmoid affinities → top-2</Arrow>
    <div className="moet-bank">{expertColours.map((_, id) => <div key={id} className="moet-expert"
      style={{ '--expert': colour(id) }} data-selected={trace.routing.ids.includes(id) || undefined}>
      <strong>E{id}{disabled === id ? ' · zeroed' : ''}</strong>
      <MapDrawing expert={id} width={4} hidden={2} selected={trace.routing.ids.includes(id)} />
      <span>32 → 16 → 32 SwiGLU<br />(4 → 2 → 4 coordinates drawn)</span><p>affinity {number(trace.routing.affinity[id])}<br />gate {number(trace.routing.gates[id])}</p>
    </div>)}</div>
    <Arrow>Expert sum + saved x → head [256 × 32] + bias → softmax</Arrow>
    <div className="moet-chart-label">All 256 next-byte probabilities; height uses a common linear scale</div>
    <svg viewBox="0 0 512 120" role="img" aria-label="Full next-byte distribution, target highlighted">
      {trace.probabilities.map((p, id) => <rect key={id} x={id * 2} y={110 - p / maximum * 100}
        width="1.5" height={p / maximum * 100} fill={id === trace.target ? '#e8b860' : '#82b4ff'} />)}
    </svg>
    <div className="moet-axis"><span>byte 0</span><span>target in amber</span><span>byte 255</span></div>
    <Controls reset={() => { setIndex(100); setDisabled(-1); }}>
      <Range label="Held-out target index" value={index} min={0} max={model.heldout_targets.length - 1} onChange={setIndex} />
      <Select label="Zero one expert contribution" value={disabled} onChange={value => setDisabled(Number(value))}
        options={[[-1, 'No ablation'], ...[0, 1, 2, 3].map(id => [id, `E${id}`])]} />
    </Controls>
    <p>Target probability {number(trace.probabilities[trace.target], 8)}; baseline NLL {number(baseline.nll, 6)};
      current NLL {number(trace.nll, 6)}; change {number(trace.nll - baseline.nll, 6)} nats.
      {disabled >= 0 && !trace.routing.ids.includes(disabled) ? ' This expert was unused, so its ablation is a null intervention.' : ''}</p>
    <Table label="Highest-probability bytes (full distribution above)" headers={['Byte', 'Probability']}
      rows={trace.top.map(id => [byteName(id), number(trace.probabilities[id], 8)])} />
  </Figure>;
}

export function MoeTrainingNativeMap() {
  const [routingMask, setRoutingMask] = useState(true);
  return <Figure id="M16" caption="The ordinary Mixtral example is a separate two-layer random causal decoder, not the trained four-byte model. These shapes and counts come from the recorded native CPU run.">
    <div className="moet-fork">
      <div><strong>Saved scratch model</strong>
        <Matrix name="Context IDs" rows={[["t−4", "t−3", "t−2", "t−1"]]} />
        <Arrow>embedding → concatenate</Arrow><Matrix name="Hidden row" rows={[[32]]} />
        <Arrow>One MoE FFN + residual</Arrow><Matrix name="Head logits" rows={[[256]]} /></div>
      <div><strong>Native Mixtral</strong>
        <Matrix name="Padded token IDs" rows={[[2, '×', 37]]} />
        <Arrow>Embedding → causal attention + MoE, twice</Arrow>
        <Matrix name="Each layer's router rows" rows={[[74, '×', 4]]} />
        <Arrow>Final head</Arrow><Matrix name="Logits" rows={[[2, '×', 37, '×', 257]]} /></div>
    </div>
    <Matrix name="Different mask purposes" rows={[
      ['first input', 'real input', 'padding'],
      ['route: yes', 'route: yes', 'route: no'],
      ['target: depends on shift', 'target: if labelled', 'target: ignored'],
    ]} />
    <Controls reset={() => setRoutingMask(true)}>
      <button type="button" aria-pressed={routingMask} onClick={() => setRoutingMask(value => !value)}>
        Router accounting: {routingMask ? 'valid inputs only' : 'all padded storage rows'}
      </button>
    </Controls>
    <p>{routingMask ? '60 valid routed inputs per layer; 120 across two layers.' : '74 storage rows per layer; 148 if padding is incorrectly included.'}
      {' '}Shifted, labelled targets remain 58. The actual run used the valid-input mask: task loss 5.561856;
      native auxiliary 2.001345 = 2 × normalized auxiliary 1.000672. The toggle illustrates denominator accounting, not a rerun of the native loss.</p>
  </Figure>;
}

const policyColours = { none: '#aab6c6', auxiliary: '#e8b860', bias: '#bb9aff', dense: '#f093b7' };

export function MoeTrainingResults() {
  const [seed, setSeed] = useState(17);
  const runs = study.runs.filter(run => run.seed === seed);
  const finalRows = study.runs.map(run => ({ ...run, measured: run.history.at(-1).heldout }));
  const minY = Math.min(...finalRows.map(run => run.measured.nll)) - .02;
  const maxY = Math.max(...finalRows.map(run => run.measured.nll)) + .02;
  const x = value => 25 + (value - 1) * 270;
  const y = value => 180 - (value - minY) / (maxY - minY) * 160;
  return <Figure id="M17" caption="Actual final held-out observations, not an interpolated training curve. Policy colours apply only to this experiment view; expert colours remain the identities in routing figures. The dense model's single branch has maximum/mean load one by construction.">
    <div className="moet-chart-label">Vertical: task NLL (nats/byte); horizontal: maximum/mean requested load</div>
    <svg viewBox="0 0 340 205" role="img" aria-label={`Final task NLL versus load for seed ${seed}`}>
      <path d="M25 10 V180 H320" fill="none" stroke="#aaa" />
      {[minY, (minY + maxY) / 2, maxY].map(value =>
        <path key={value} d={`M25 ${y(value)} H320`} stroke="#444" strokeDasharray="3 4" />)}
      {runs.map(run => { const metrics = run.history.at(-1).heldout;
        return <circle key={run.policy} cx={x(metrics.max_over_mean)} cy={y(metrics.nll)} r="5"
          fill={policyColours[run.policy]} stroke="#fff"><title>{run.policy}: NLL {metrics.nll}, load {metrics.max_over_mean}</title></circle>;
      })}
    </svg>
    <div className="moet-axis"><span>load 1</span><span>NLL range {number(minY, 3)}…{number(maxY, 3)}</span><span>load 2.09</span></div>
    <div className="moet-key">{Object.entries(policyColours).map(([policy, hue]) => <span key={policy} style={{ color: hue }}><i />{policy}</span>)}</div>
    <Controls reset={() => setSeed(17)}><Select label="Displayed paired seed" value={seed} onChange={value => setSeed(Number(value))}
      options={[17, 29, 43].map(value => [value, String(value)])} /></Controls>
    <Table label="All twelve final outcomes" headers={['Seed / policy', 'NLL', 'Peak/mean', 'Balance', 'Learned parameters']}
      rows={finalRows.map(run => [`${run.seed} / ${run.policy}`, number(run.measured.nll, 6), number(run.measured.max_over_mean, 6), number(run.measured.balance, 6), run.learned_parameters])} />
    <p>Every run sees 25,600 training targets. Dense selected FFN work matches the MoE's two selected width-16 branches;
      its stored parameter count differs. No best seed or held-out checkpoint was selected.</p>
  </Figure>;
}

export function MoeTrainingHistory() {
  const [seed, setSeed] = useState(17), [policy, setPolicy] = useState('auxiliary'), [checkpoint, setCheckpoint] = useState(4);
  const run = study.runs.find(item => item.seed === seed && item.policy === policy);
  const current = run.history[checkpoint];
  const maximum = Math.max(...run.history.flatMap(item => item.heldout.counts));
  return <Figure id="M18" caption="Only the five actually recorded checkpoints are selectable. Cell colour preserves expert identity; filled length is requested count on the same scale. These are held-out evaluations of fixed checkpoints.">
    <ExpertKey />
    <div className="moet-history">{run.history.map((item, index) => <div key={item.step}
      className="moet-history-row" data-selected={index === checkpoint || undefined}>
      <strong>step {item.step}</strong>{item.heldout.counts.map((count, id) => <div key={id} className="moet-count-cell">
        <span>E{id}: {count}</span><div><i style={{ width: `${100 * count / maximum}%`, background: colour(id) }} /></div>
      </div>)}
    </div>)}</div>
    <Controls reset={() => { setSeed(17); setPolicy('auxiliary'); setCheckpoint(4); }}>
      <Select label="Measured seed" value={seed} onChange={value => setSeed(Number(value))} options={[17, 29, 43].map(value => [value, String(value)])} />
      <Select label="Measured policy" value={policy} onChange={setPolicy} options={['none', 'auxiliary', 'bias'].map(value => [value, value])} />
      <Select label="Recorded checkpoint" value={checkpoint} onChange={value => setCheckpoint(Number(value))} options={[0, 100, 200, 300, 400].map((value, index) => [index, String(value)])} />
    </Controls>
    <Table label={`Seed ${seed}, ${policy}, step ${current.step}`} headers={['Quantity', 'Recorded value']}
      rows={[
        ['Task NLL', number(current.heldout.nll, 6)], ['Balance surrogate', number(current.heldout.balance, 6)],
        ['Maximum/mean count', number(current.heldout.max_over_mean, 6)], ['CV²', number(current.heldout.cv_squared, 6)],
        ['Bias', vector(current.bias)], ['Gate mass', vector(current.heldout.gate_mass)],
      ]} />
    <p>Counts sum to {sum(current.heldout.counts)} = 1,949 × 2 assignments. Gate mass sums to 1,949,
      because selected gates sum to one for each row. Those totals are deliberately different.</p>
  </Figure>;
}

export function MoeTrainingDevices() {
  const [moved, setMoved] = useState(false), [changed, setChanged] = useState(false), [local, setLocal] = useState(false);
  const placement = local ? [0, 0, 0, 0] : moved ? [1, 0, 1, 1] : [0, 0, 1, 1];
  const trace = systemsTrace(placement, changed, 4, local);
  return <Figure id="M19" caption="Two CPU-simulated rank partitions; this is an address and payload model, not an all-to-all timing measurement. The all-local fixture puts every token and expert on rank 0. Gates stay fixed while placement or one requested ID changes.">
    <Matrix name="Source token rows: t0, t1, t2, t3" rows={trace.inputs} />
    <div className="moet-ranks">{[0, 1].map(rank => <div className="moet-rank" key={rank}>
      <strong>Rank {rank}: expert weights</strong>
      <div className="moet-bank">{placement.map((owner, id) => owner === rank && <div className="moet-expert" key={id} style={{ '--expert': colour(id) }}>
        <strong>E{id}: {id + 1} × identity</strong><MapDrawing expert={id} width={2} linear />
        <Matrix name={`E${id} matrix`} rows={[[id + 1, 0], [0, id + 1]]} expert={id} />
      </div>)}</div>
      <div className="moet-queue" style={{ '--expert': '#bfc3c9' }}>
        {trace.requests.filter(item => item.destination === rank).map(item => <div key={`${item.token}-${item.slot}`}>
          <span style={{ color: colour(item.expert) }}>E{item.expert}</span> ← t{item.token}/s{item.slot}
          {' '}{item.source !== rank ? `↗ from rank ${item.source}` : 'local'}
          <br />Return {vector(item.returned)} × {number(item.gate)}
        </div>)}
      </div>
      <Arrow>Grouped matrix products → preserve t/slot return address</Arrow>
    </div>)}</div>
    <div className="moet-data-path"><span>Forward: dispatch input rows →</span><span>← weighted expert returns</span></div>
    <div className="moet-data-path moet-backward"><span>Backward: dispatch return gradients →</span><span>← input gradients, add by token</span></div>
    <div className="moet-fork">
      <Matrix name="Addressed sums, t0…t3" rows={trace.output} />
      <Matrix name="Input gradients for L = sum(Y)" rows={trace.inputGradient} />
    </div>
    <Controls reset={() => { setMoved(false); setChanged(false); setLocal(false); }}>
      <button type="button" aria-pressed={!local && moved} disabled={local}
        onClick={() => setMoved(value => !value)}>
        E0 on rank {placement[0]}{local ? ' (all local)' : ''}
      </button>
      <button type="button" aria-pressed={changed} onClick={() => setChanged(value => !value)}>t2 requests {changed ? 'E0/E3' : 'E1/E3'}</button>
      <button type="button" aria-pressed={local} onClick={() => setLocal(value => !value)}>All-local comparison: {local ? 'on' : 'off'}</button>
    </Controls>
    <p>Remote assignments {trace.remote}; forward input-plus-return payload {trace.bytes} bytes = remote × 2 directions × d2 × 4 bytes.
      Rank row work {vector(trace.rankRows)}. Replica parameter-gradient reduction is a separate operation from these activation transfers.</p>
  </Figure>;
}

export function MoeTrainingBlocks() {
  const [block, setBlock] = useState(4);
  const trace = systemsTrace(undefined, false, block);
  const modes = [['Equal padded', trace.counts.map(() => 3)], ['Ragged', trace.counts], ['Block aligned', trace.allocated]];
  return <Figure id="M20" caption="Each small row rectangle contains two activation coordinates. Solid rows carry requests; hatched rows are allocation padding. No request is dropped in these layouts.">
    <div className="moet-layouts">{modes.map(([name, allocations]) => <div key={name}>
      <strong>{name}: {sum(allocations)} allocated rows</strong>
      <div className="moet-row-matrices">{allocations.map((count, id) => <div key={id} style={{ '--expert': colour(id) }}>
        <span>E{id}</span>{Array.from({ length: count }, (_, row) => <div key={row}
          className="moet-storage-row" data-padding={row >= trace.counts[id] || undefined}>
          <i /><i /><span>{row < trace.counts[id] ? 'data' : 'pad'}</span>
        </div>)}
      </div>)}</div>
    </div>)}</div>
    <Controls reset={() => setBlock(4)}><Select label="Rows per aligned block B" value={block} onChange={value => setBlock(Number(value))}
      options={[[1, '1'], [2, '2'], [4, '4'], [8, '8']]} /></Controls>
    <p>Counts {vector(trace.counts)}; block allocation {vector(trace.allocated)}. B = 1 removes alignment padding.
      A zero-row expert would allocate zero. Hidden/output tile alignment is a further hardware constraint.</p>
  </Figure>;
}

export function MoeTrainingCosts() {
  const [moved, setMoved] = useState(false), [expertTime, setExpertTime] = useState(1);
  const trace = systemsTrace(moved ? [1, 0, 1, 1] : [0, 0, 1, 1]);
  const budget = expertBudget();
  return <Figure id="M21" caption="The queue bars use an explicit assumed one-row service cost. They are calculated serial-work units, not observed latency or a GPU speed claim. Communication startup, overlap and kernel efficiency are absent from this model.">
    <div className="moet-work-bars">{trace.rankRows.map((rows, rank) => <div key={rank}>
      <span>Rank {rank}: {rows} rows × {expertTime} = {rows * expertTime} units</span>
      <div>{Array.from({ length: rows }, (_, row) => <i key={row} style={{ width: `${100 * expertTime / 24}%` }} />)}</div>
    </div>)}</div>
    <Controls reset={() => { setMoved(false); setExpertTime(1); }}>
      <button type="button" aria-pressed={moved} onClick={() => setMoved(value => !value)}>E0 on rank {moved ? 1 : 0}</button>
      <Range label="Assumed service units per row" value={expertTime} min={1} max={3} onChange={setExpertTime} />
    </Controls>
    <Table label="Keep the denominators and timing boundary separate" headers={['Account', 'Quantity', 'Scope']}
      rows={[
        ['Expert parameter budget', budget.expertParameters, 'Separate d24/E6/k2/m12 architecture example'],
        ['Expert multiply-adds', budget.expertWork, 'Per token, selected three-map FFNs'],
        ['Router parameters / multiply-adds', budget.routerParameters, 'Per-token dense router'],
        ['Dispatch bytes', trace.remote * 2 * 4, 'Systems d2, FP32 remote inputs only'],
        ['Return bytes', trace.remote * 2 * 4, 'Systems d2, FP32 remote outputs only'],
        ['Slowest serial rank work', Math.max(...trace.rankRows) * expertTime, 'Assumed queue units, not measured time'],
      ]} />
    <p>Expert placement changes remote traffic and per-rank work while preserving IDs and maps.
      Add shared attention, embedding/head, optimizer, metadata and temporary storage before estimating a full training step.</p>
  </Figure>;
}
