import { createContext, useContext, useId } from 'react';
import { flowNumber } from './LessonFlow.jsx';
import { coreOutputs, coreScores, affineTrace } from '../../data/moe-reading-traces.js';
import { route, softmax, top } from '../../data/moe-models.js';
import './moe-flow.css';

export const MOE_PAINT = {
  input: '#6fd9eb', parameter: '#e5b55b', computed: '#b49aff',
  operation: '#e5e5e5', forward: '#898b90', gradient: '#f49a62', frozen: '#a1a1aa',
};
const number = value => typeof value === 'number' ? flowNumber(value, 4) : String(value);
const ArrowContext = createContext('moe');

export function MoeScroll({ children, label = 'Connected MoE drawing' }) {
  const id = useId();
  return <div className="moe-flow-scene">
    <p id={id} className="moe-flow-scroll-hint">If the whole drawing does not fit, focus it and use the arrow keys or swipe to follow its connected parts.</p>
    <div className="moe-flow-scroll" tabIndex={0} role="region" aria-label={label} aria-describedby={id}>{children}</div>
  </div>;
}

export function MoeScene({ width = 600, height, title, description, children, compact = false }) {
  const id = useId().replace(/:/g, '');
  return <MoeScroll label={title}><ArrowContext.Provider value={id}><svg className={`moe-flow-svg${compact ? ' moe-flow-svg--compact' : ''}`}
    style={{ width: `${width / 16}rem`, aspectRatio: `${width} / ${height}` }} viewBox={`0 0 ${width} ${height}`}
    role="img" aria-labelledby={`${id}-title ${id}-desc`}>
    <title id={`${id}-title`}>{title}</title><desc id={`${id}-desc`}>{description}</desc>
    <defs>
      <marker id={`${id}-forward-arrow`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill={MOE_PAINT.forward}/></marker>
      <marker id={`${id}-gradient-arrow`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill={MOE_PAINT.gradient}/></marker>
    </defs>
    {children}
  </svg></ArrowContext.Provider></MoeScroll>;
}

export function MoeText({ x, y, children, role = 'operation', anchor = 'start' }) {
  return <text x={x} y={y} fill={MOE_PAINT[role]} textAnchor={anchor}>{children}</text>;
}

export function MoeCells({ values, x, y, width = 66, height = 38, role = 'computed', label, selected = null, columns = null }) {
  const count = columns ?? values.length;
  return <g>
    {label && <MoeText x={x} y={y - 10} role={role}>{label}</MoeText>}
    {values.map((value, i) => <g key={i}>
      <rect x={x + (i % count) * width} y={y + Math.floor(i / count) * height} width={width - 3} height={height - 3}
        fill="#1b1b1d" stroke={selected === i ? '#fff' : MOE_PAINT[role]} strokeWidth={selected === i ? 2.5 : 1}/>
      <MoeText x={x + (i % count) * width + (width - 3) / 2} y={y + Math.floor(i / count) * height + height / 2 + 5} role={role} anchor="middle">{number(value)}</MoeText>
    </g>)}
  </g>;
}

export function MoeMatrix({ values, x, y, width = 66, height = 38, role = 'parameter', label }) {
  return <MoeCells values={values.flat()} columns={values[0].length} x={x} y={y} width={width} height={height} role={role} label={label}/>;
}

export function MoeWire({ path, gradient = false, arrow = true }) {
  const id = useContext(ArrowContext);
  return <path d={path} fill="none" stroke={gradient ? MOE_PAINT.gradient : MOE_PAINT.forward} strokeWidth={1.7}
    strokeDasharray={gradient ? '5 4' : undefined} markerEnd={arrow ? `url(#${id}-${gradient ? 'gradient' : 'forward'}-arrow)` : undefined}/>;
}

export function MoeOperation({ x, y, symbol, radius = 20 }) {
  return <g><circle cx={x} cy={y} r={radius} fill="#18181b" stroke={MOE_PAINT.operation}/>
    <MoeText x={x} y={y + 5} anchor="middle">{symbol}</MoeText></g>;
}

export function MoeRoleKey({ y, x = 12 }) {
  return <g>
    <MoeText x={x} y={y} role="input">cyan: supplied vector</MoeText>
    <MoeText x={x} y={y + 24} role="parameter">amber: learned map</MoeText>
    <MoeText x={x} y={y + 48} role="computed">violet: computed value</MoeText>
    <MoeText x={x} y={y + 72}>grey arrow: forward operation</MoeText>
  </g>;
}

function TinyAffine({ input, matrix, y, label, inputRole = 'input' }) {
  const path = affineTrace(input, matrix);
  return <g>
    <MoeCells x={18} y={y} values={input} width={66} role={inputRole} label={`${label}: input`}/>
    <MoeMatrix x={181} y={y} values={matrix} label="map (2 × 2)"/>
    <MoeWire path={`M84 ${y + 38}V${y + 148}H148`}/>
    <MoeWire path={`M247 ${y + 76}V${y + 148}H188`}/>
    <MoeOperation x={168} y={y + 148} symbol="×"/>
    <MoeWire path={`M168 ${y + 168}V${y + 208}H84V${y + 228}`}/>
    <MoeMatrix x={18} y={y + 228} values={path.products} role="computed"/>
    <MoeCells x={257} y={y + 228} values={path.output} columns={1} width={65} label="sums"/>
    {[0, 1].map(row => <g key={row}>
      <MoeWire path={`M147 ${y + 247 + row * 38}H190`}/>
      <MoeOperation x={205} y={y + 247 + row * 38} symbol="Σ" radius={15}/>
      <MoeWire path={`M220 ${y + 247 + row * 38}H257`}/>
    </g>)}
    <MoeText x={18} y={y + 338}>× matches x with each map row.</MoeText>
    <MoeText x={18} y={y + 363}>Σ adds the two products in that row.</MoeText>
  </g>;
}

export function MoeExpertAnatomy() {
  return <MoeScene width={340} height={1050} compact title="One expert is two real maps and an activation"
    description="The supplied vector one, two is multiplied by an identity up map, producing one, two. ReLU keeps these positive values. A down map with first row two, zero and second row zero, zero produces two, zero. Each row displays both products and its sum. No routing or selection happens in this drawing.">
    <TinyAffine input={[1, 2]} matrix={[[1, 0], [0, 1]]} y={35} label="up map"/>
    <MoeText x={158} y={430}>R = max(0, value)</MoeText>
    <MoeOperation x={50} y={460} symbol="R"/>
    <MoeOperation x={116} y={460} symbol="R"/>
    <MoeCells x={18} y={500} values={[1, 2]}/>
    <MoeWire path="M322 282H330V405H50V440"/>
    <MoeWire path="M322 320H333V410H116V440"/>
    <MoeWire path="M50 480V500"/>
    <MoeWire path="M116 480V500"/>
    <TinyAffine input={[1, 2]} matrix={[[2, 0], [0, 0]]} y={590} label="down map" inputRole="computed"/>
    <MoeWire path="M147 519H164V609H147"/>
    <MoeText x={18} y={1010}>Expert 0 returns [2, 0].</MoeText>
    <MoeText x={18} y={1035}>Each Σ adds the two shown products.</MoeText>
  </MoeScene>;
}

export function MoeExpertBank() {
  const downs = [[[2, 0], [0, 0]], [[0, 0], [0, 1.5]], [[-1, 0], [1, 0]]];
  return <MoeScene width={700} height={425} title="The same input reaches three separately stored expert maps"
    description="Three experts each own an identity up map and their own down map. All receive the same supplied one, two vector. Their complete returned vectors are two, zero; zero, three; and minus one, one. This bank is stored before a router chooses which maps execute.">
    <MoeCells x={277} y={30} values={[1, 2]} role="input" label="one shared supplied x"/>
    {downs.map((matrix, e) => <g key={e}>
      <MoeText x={20 + e * 230} y={104}>E{e}: separately stored maps</MoeText>
      <MoeMatrix x={40 + e * 230} y={142} values={[[1, 0], [0, 1]]} label="up map"/>
      <MoeWire path={`M343 68V86H${106 + e * 230}V142`}/>
      <MoeText x={40 + e * 230} y={239}>ReLU [1, 2]</MoeText>
      <MoeMatrix x={40 + e * 230} y={275} values={matrix} label="down map"/>
      <MoeWire path={`M${106 + e * 230} 218V230`}/>
      <MoeWire path={`M${106 + e * 230} 252V275`}/>
      <MoeCells x={40 + e * 230} y={377} values={coreOutputs[e]}/>
      <MoeWire path={`M${106 + e * 230} 351V377`}/>
    </g>)}
  </MoeScene>;
}

export function MoeRouterDrawing({ scores = coreScores, k = 2 }) {
  const max = Math.max(...scores), masses = scores.map(value => Math.exp(value - max));
  const full = softmax(scores), selected = top(scores, k);
  const allMass = masses.reduce((sum, value) => sum + value, 0);
  const selectedMass = selected.reduce((sum, i) => sum + masses[i], 0);
  const height = 210 + scores.length * 126;
  return <MoeScene width={730} height={height} title="Scores fork into full and selected normalization"
    description={`Scores use one common maximum subtraction. Their exponential masses enter the full sum ${number(allMass)}. Selected expert IDs ${selected.join(', ')} enter a second sum ${number(selectedMass)}. Each row divides its own mass by the appropriate shared total; unselected full probabilities remain in the full denominator.`}>
    <MoeText x={14} y={25}>h − max(h) → exp → its own mass</MoeText>
    <MoeText x={394} y={25}>Every full mass enters the shared total.</MoeText>
    <MoeCells x={423} y={58} values={[allMass]} label="Σ all masses"/>
    <MoeCells x={571} y={58} values={[selectedMass]} label="Σ selected masses"/>
    {scores.map((value, e) => {
      const y = 155 + e * 126;
      return <g key={e}>
        <MoeText x={14} y={y - 42}>E{e}{selected.includes(e) ? ' · selected' : ' · not selected'}</MoeText>
        <MoeCells x={14} y={y} values={[value]} label="score h" width={78}/>
        <MoeWire path={`M89 ${y + 18}H113`}/>
        <MoeOperation x={142} y={y + 18} symbol="exp" radius={29}/>
      <MoeText x={107} y={y + 58}>after −max</MoeText>
        <MoeWire path={`M171 ${y + 18}H198`}/>
        <MoeCells x={198} y={y} values={[masses[e]]} width={78}/>
        <MoeWire path={`M273 ${y + 18}H293V96H456`}/>
        <MoeWire path={`M273 ${y + 18}H365`}/>
        <MoeOperation x={385} y={y + 18} symbol="÷"/>
        <MoeWire path={`M456 96V112H341V${y - 25}H385V${y - 2}`}/>
        <MoeWire path={`M405 ${y + 18}H423`}/>
        <MoeCells x={423} y={y} values={[full[e]]} width={88}/>
        <MoeText x={423} y={y + 68}>full p{e}</MoeText>
        {selected.includes(e) && <>
          <MoeWire path={`M273 ${y + 18}H283V${y + 90}H556V${y + 38}`}/>
          <MoeOperation x={556} y={y + 18} symbol="÷"/>
          <MoeWire path={`M604 96V120H710V${y - 26}H556V${y - 2}`}/>
          <MoeWire path={`M576 ${y + 18}H592`}/>
          <MoeCells x={592} y={y} values={[masses[e] / selectedMass]} width={88}/>
          <MoeText x={592} y={y + 68}>selected g{e}</MoeText>
        </>}
      </g>;
    })}
    <MoeText x={14} y={height - 35} role="computed">violet: scores, masses and probabilities</MoeText>
    <MoeText x={14} y={height - 12}>White selection marks name IDs; grey arrows carry forward values.</MoeText>
  </MoeScene>;
}

export function MoeMixtureDrawing({ scores = coreScores, outputs = coreOutputs, k = 2, full = false, returnedRole = 'computed' }) {
  const result = route(scores, outputs, k, !full);
  return <MoeScene width={340} height={220 + result.selected.length * 200} compact title={full ? 'Retain selected full probabilities' : 'Combine selected-normalized branches'}
    description={`Each selected gate multiplies every coordinate of its own returned vector. The complete component sums give ${result.output.map(number).join(', ')}. Unselected networks contribute nothing. ${full ? 'Selected full probabilities may sum to less than one.' : 'Selected gate weights sum to one.'}`}>
    {result.selected.map((e, slot) => {
      const y = 40 + slot * 200;
      return <g key={e}>
        <MoeCells x={15} y={y} values={outputs[e]} role={returnedRole} label={`returned E${e} vector`}/>
        <MoeCells x={184} y={y} values={[result.weights[e]]} label="gate" width={88}/>
        <MoeWire path={`M144 ${y + 18}H156V${y + 65}H297`}/>
        <MoeWire path={`M269 ${y + 18}H317V${y + 45}`}/>
        <MoeOperation x={317} y={y + 65} symbol="×"/>
        <MoeWire path={`M317 ${y + 85}V${y + 119}H188`}/>
        <MoeCells x={15} y={y + 100} values={result.products[e]} label="two coordinate products" width={88}/>
        <MoeWire path={`M188 ${y + 119}H240V${115 + result.selected.length * 200}H134`}/>
      </g>;
    })}
    <MoeOperation x={114} y={115 + result.selected.length * 200} symbol="Σ"/>
    <MoeWire path={`M114 ${135 + result.selected.length * 200}V${166 + result.selected.length * 200}H103V${180 + result.selected.length * 200}`}/>
    <MoeCells x={15} y={180 + result.selected.length * 200} values={result.output} width={88}/>
    <MoeText x={15} y={75 + result.selected.length * 200}>Σ adds matching coordinates.</MoeText>
    <MoeText x={160} y={135 + result.selected.length * 200}>Complete result y ↓</MoeText>
  </MoeScene>;
}
