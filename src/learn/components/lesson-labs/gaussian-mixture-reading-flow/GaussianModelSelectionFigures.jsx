import { useId, useLayoutEffect, useRef, useState } from 'react';
import { FlowLab, FlowControls, FlowReadout } from "../LessonFlow.jsx";
import { criterionComparison, densityUnitConversion, savedObservationTransform, retainedThinComponent, reservedTestComparison, savedSelectionWinners, SAVED_CANDIDATES, FAMILY_IDENTITIES, IRIS_ROLES } from "./gaussian-model-selection-models.mjs";
import "./gaussian-model-selection.css";

const INK = '#deded8', MUTED = '#aaa8ad', GOLD = '#e9b94c', LENGTH = '#edb489', WIDTH = '#87baf1';
const CANDIDATE = ['#edb489', '#c4a0e8'];
export const selectionNumber = (value, digits = 9) => (value !== 0 && Math.abs(value) < 1e-7 ? value.toExponential(6) : String(Number(value.toFixed(digits)))).replaceAll('-', '−');
const f = selectionNumber;

function Drawing({ id, name, description, max = 800, min = 300, height, children }) {
  const unique = useId(), region = useRef(null), probe = useRef(null), [extent, setExtent] = useState(max), [pans, setPans] = useState(false);
  useLayoutEffect(() => {
    const measure = () => { const rem = probe.current.getBoundingClientRect().width, next = Math.max(min, Math.min(max, Math.floor(region.current.clientWidth * 16 / rem))); setExtent(next); setPans(next * rem / 16 > region.current.clientWidth + 1); };
    measure(); const observer = new ResizeObserver(measure); observer.observe(region.current); observer.observe(probe.current); return () => observer.disconnect();
  }, [max, min]);
  const h = typeof height === 'function' ? height(extent) : height;
  return <><div className="gmm-selection-drawing-region" ref={region} tabIndex="0" role="region" aria-label={`${id}: ${name}; keyboard-scroll if needed`}>
    <span ref={probe} className="gmm-selection-probe" aria-hidden="true" />
    <svg data-selection-drawing={id} viewBox={`0 0 ${extent} ${h}`} style={{ width: `${extent / 16}rem`, height: `${h / 16}rem` }} role="img" aria-labelledby={`${unique}-t ${unique}-d`}>
      <title id={`${unique}-t`}>{name}</title><desc id={`${unique}-d`}>{description}</desc><g fontSize="16" fill={INK}>{children(extent)}</g>
    </svg>
  </div>{pans && <p className="gmm-selection-pan-hint">Scroll horizontally for the full drawing; focus it and use the arrow keys.</p>}</>;
}
function Table({ caption, heads, rows }) {
  return <div className="gmm-selection-table-region" role="region" tabIndex="0" aria-label={`${caption}; scroll for full columns`}><table><caption>{caption}</caption><thead><tr>{heads.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ? <th key={j} scope="row">{cell}</th> : <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>;
}
function Cross({ x, y, color = GOLD, size = 5 }) { return <path d={`M${x - size},${y} H${x + size} M${x},${y - size} V${y + size}`} stroke={color} strokeWidth="2" />; }
function Glyph({ x, y, kind = 'circle', color = INK, fill = 'none', size = 5, children, ...props }) {
  return kind === 'square' ? <rect {...props} x={x - size} y={y - size} width={size * 2} height={size * 2} stroke={color} fill={fill}>{children}</rect>
    : kind === 'diamond' ? <path {...props} d={`M${x},${y - size} l${size},${size} l${-size},${size} l${-size},${-size} Z`} stroke={color} fill={fill}>{children}</path>
      : kind === 'triangle' ? <path {...props} d={`M${x},${y - size} L${x + size},${y + size} H${x - size} Z`} stroke={color} fill={fill}>{children}</path>
        : <circle {...props} cx={x} cy={y} r={size} stroke={color} fill={fill}>{children}</circle>;
}
function Plane({ xDomain, yDomain, width, points = [], ellipse, mean, unit, xTicks, yTicks, selected, magnified = false }) {
  const plotWidth = width - 100, sx = plotWidth / (xDomain[1] - xDomain[0]);
  const sy = magnified ? (plotWidth / 3.8) * 2.6 / (yDomain[1] - yDomain[0]) : sx;
  const X = x => 65 + (x - xDomain[0]) * sx, Y = y => 45 + (yDomain[1] - y) * sy, bottom = Y(yDomain[0]);
  const unique = useId();
  return <>
    <defs><clipPath id={`${unique}-clip`}><rect x="65" y="45" width={plotWidth} height={bottom - 45} /></clipPath></defs>
    <text x="16" y="23" fill={WIDTH}>Width ({unit})</text>
    <line x1="65" x2={X(xDomain[1])} y1={bottom} y2={bottom} stroke={LENGTH} /><line x1="65" x2="65" y1="45" y2={bottom} stroke={WIDTH} />
    {xTicks.map(t => <g key={t}><line x1={X(t)} x2={X(t)} y1={bottom} y2={bottom + 5} stroke={LENGTH} /><text x={X(t)} y={bottom + 27} textAnchor="middle" fill={LENGTH}>{f(t, 2)}</text></g>)}
    {yTicks.map(t => <g key={t}><line x1="60" x2="65" y1={Y(t)} y2={Y(t)} stroke={WIDTH} /><text x="53" y={Y(t) + 5} textAnchor="end" fill={WIDTH}>{f(t, 2)}</text></g>)}
    <text x={width / 2} y={bottom + 64} textAnchor="middle" fill={LENGTH}>Length ({unit})</text>
    <g clipPath={`url(#${unique}-clip)`}>
      {points.map(point => <circle key={point.id} data-measured-id={point.id} data-width-three={point.widthCm === 3 ? 'true' : 'false'} cx={X(point.lengthCm)} cy={Y(point.widthCm)} r={selected === point.id ? 5 : 2.8} fill={point.widthCm === 3 && !selected ? '#deded8' : MUTED} stroke={selected === point.id ? GOLD : 'none'}><title>ID {point.id}: {point.lengthCm}, {point.widthCm} {unit}; measured observation</title></circle>)}
      {selected && points.some(p => p.id === selected) && (() => { const p = points.find(p => p.id === selected); return <><line x1={X(p.lengthCm)} x2={X(p.lengthCm)} y1={bottom} y2={Y(p.widthCm)} stroke={LENGTH} strokeDasharray="3 3" /><line x1="65" x2={X(p.lengthCm)} y1={Y(p.widthCm)} y2={Y(p.widthCm)} stroke={WIDTH} strokeDasharray="3 3" /></>; })()}
      {ellipse && <path data-retained-ellipse="true" d={ellipse.map((p, i) => `${i ? 'L' : 'M'}${X(p[0])},${Y(p[1])}`).join(' ')} stroke={GOLD} strokeWidth="1.5" fill="none" />}
      {mean && <Cross x={X(mean[0])} y={Y(mean[1])} />}
    </g>
  </>;
}

export function GaussianInformationCriteria() {
  const rows = criterionComparison();
  return <FlowLab id="gmm-d43" label="Two criteria use the same constructed candidate operands" data-selection-job="D43">
    <Table caption="Same constructed data: n = 100 rows" heads={['Candidate', 'Total log likelihood ℓ', 'Free parameters p', 'Fit cost −2ℓ']} rows={rows.map(r => [r.id, f(r.logLikelihood), r.parameters, r.fitCost])} />
    <Drawing id="D43" name="Fit cost and a different complexity penalty" height={590} description="Candidate A has log likelihood minus150 and five parameters; B has minus143 and eleven. AIC adds2p, gives310/308 and prefers B. BIC adds p log100, gives323.025851/336.656872 and prefers A. All stacked lengths share one0–350 scale; white pointer marks smaller preferred, separate from candidate hue.">
      {w => { const X = x => 52 + x * (w - 85) / 350; return <>
        {['aic', 'bic'].map((criterion, lane) => { const top = 24 + lane * 285; return <g key={criterion} data-criterion={criterion}>
          <text x="20" y={top}>{criterion.toUpperCase()} · {criterion === 'aic' ? '−2ℓ + 2p' : '−2ℓ + p log(n)'}</text>
          {rows.map((row, i) => { const y = top + 60 + i * 95, penalty = row[`${criterion}Penalty`], preferred = criterion === 'aic' ? row.id === 'B' : row.id === 'A'; return <g key={row.id} data-candidate={row.id}>
            <text x="20" y={y} fill={CANDIDATE[i]}>{row.id}</text>
            <rect x={X(0)} y={y - 16} width={X(row.fitCost) - X(0)} height="20" fill={CANDIDATE[i]} opacity=".65" />
            <rect x={X(row.fitCost)} y={y - 16} width={X(row[criterion]) - X(row.fitCost)} height="20" fill="none" stroke={CANDIDATE[i]} strokeWidth="2" />
            <text x="52" y={y + 31}>Fit {row.fitCost} + penalty {f(penalty, 6)}</text>
            <text x="52" y={y + 58} fill={preferred ? INK : MUTED}>{preferred ? '▷ ' : ''}{f(row[criterion], 6)}{preferred ? ' · smaller' : ' · total'}</text>
          </g>; })}
          <line x1={X(0)} x2={X(350)} y1={top + 237} y2={top + 237} stroke={MUTED} />
          {[0, 100, 200, 300, 350].map(t => <g key={t}><line x1={X(t)} x2={X(t)} y1={top + 237} y2={top + 242} stroke={MUTED} /><text x={X(t)} y={top + 265} textAnchor="middle">{t}</text></g>)}
        </g>; })}
      </>; }}
    </Drawing>
    <FlowReadout>AIC prefers <strong>B (308)</strong>; BIC prefers <strong>A ({f(rows[0].bic, 6)})</strong>. The parameter and likelihood operands are unchanged between the two rules. Filled lengths encode fit cost; outlined lengths encode penalty. Neither rule gives a posterior probability or guarantees the true number of sources.</FlowReadout>
  </FlowLab>;
}

export function GaussianDensityUnits() {
  const [factor, setFactor] = useState(10), state = densityUnitConversion(factor);
  return <FlowLab id="gmm-d44" label="Convert the same physical observations under every candidate">
    <Drawing id="D44" name="Coordinate scaling changes density and likelihood units" height={w => ((w < 600 ? w : w / 2) - 85) * 4 / 6 * (w < 600 ? 2 : 1) + (w < 600 ? 320 : 160)} description={`The same observed ID34 becomes(${state.converted.join(',')})${state.unit}. Both coordinates scale by${factor}; determinant${state.determinant}. Each model receives the same per-row log shift${state.perRowLogShift} and total shift${state.totalLogShift} over the constructed100 rows. Likelihood products multiply by determinant to power minus100.`}>
      {w => { const narrow = w < 600, planeWidth = narrow ? w : w / 2, stride = (planeWidth - 85) * 4 / 6 + 160; return [1, factor].map((s, i) => { const offsetX = narrow ? 0 : i * w / 2, offsetY = narrow ? i * stride : 0, X = x => 48 + (x / s - 3) * (planeWidth - 85) / 6, Y = y => 50 + (5 - y / s) * (planeWidth - 85) / 6; return <g key={i} transform={`translate(${offsetX},${offsetY})`}>
        <text x="20" y="24">ID 34 · {i ? state.unit : 'cm'}</text>
        <line x1={X(3 * s)} x2={X(9 * s)} y1={Y(s)} y2={Y(s)} stroke={LENGTH} /><line x1={X(3 * s)} x2={X(3 * s)} y1={Y(s)} y2={Y(5 * s)} stroke={WIDTH} />
        <line x1={X(5.5 * s)} x2={X(5.5 * s)} y1={Y(s)} y2={Y(4.2 * s)} stroke={LENGTH} strokeDasharray="3 3" /><line x1={X(3 * s)} x2={X(5.5 * s)} y1={Y(4.2 * s)} y2={Y(4.2 * s)} stroke={WIDTH} strokeDasharray="3 3" />
        <circle cx={X(5.5 * s)} cy={Y(4.2 * s)} r="4" fill={INK} />
        {[3, 6, 9].map(t => <text key={t} x={X(t * s)} y={Y(s) + 25} textAnchor="middle" fill={LENGTH}>{t * s}</text>)}
        {[1, 3, 5].map(t => <text key={t} x={X(3 * s) - 9} y={Y(t * s) + 5} textAnchor="end" fill={WIDTH}>{t * s}</text>)}
        <text x="20" y={Y(s) + 58}>Length / width: {i ? state.unit : 'cm'}</text>
      </g>; }); }}
    </Drawing>
    <Drawing id="D44-Jacobian" name="The determinant divides each density, multiplies products and shifts logs" max={560} height={735} description={`A diagonal ${factor},${factor} coordinate map has determinant ${state.determinant}. The same physical one square centimetre is ${state.determinant} square ${state.unit}. A routed determinant branch divides each density by ${state.determinant}, multiplies the 100-row product by ${state.productMultiplier}, and adds ${state.totalLogShift} to the log total. Identity factor one leaves all three unchanged.`}>
      {w => { const cx = w / 2, grid = Array.from({ length: factor - 1 }, (_, i) => (i + 1) * 100 / factor); return <>
        <text x="20" y="25">D: same map on every row</text>
        <path d={`M${cx - 65},45 h-8 v70 h8 M${cx + 65},45 h8 v70 h-8`} stroke={INK} fill="none" />
        <text x={cx - 32} y="70" textAnchor="middle" fill={LENGTH}>{factor}</text><text x={cx + 32} y="70" textAnchor="middle">0</text>
        <text x={cx - 32} y="101" textAnchor="middle">0</text><text x={cx + 32} y="101" textAnchor="middle" fill={WIDTH}>{factor}</text>
        <path d={`M${cx},119 v23 m-5,-7 l5,7 l5,-7`} stroke={INK} fill="none" /><text x={cx} y="169" textAnchor="middle">det D = {state.determinant}</text>
        <rect x="30" y="195" width="100" height="100" stroke={INK} fill="none" /><rect x={w - 130} y="195" width="100" height="100" stroke={INK} fill="none" />
        {grid.map(t => <g key={t} stroke={MUTED}><line x1={w - 130 + t} x2={w - 130 + t} y1="195" y2="295" /><line x1={w - 130} x2={w - 30} y1={195 + t} y2={195 + t} /></g>)}
        <text x="80" y="320" textAnchor="middle">1 cm²</text><text x={w - 80} y="320" textAnchor="middle">{state.determinant} {state.unit}²</text>
        <text x={cx} y="350" textAnchor="middle">Same physical area</text>
        <path d={`M${cx},363 v20 m-5,-7 l5,7 l5,-7`} stroke={INK} fill="none" /><text x="30" y="410">Each density: p′(Dx) = p(x) ÷ {state.determinant}</text>
        <path d="M22,423 v251 M22,454 h18 m-6,-5 l6,5 l-6,5 M22,587 h18 m-6,-5 l6,5 l-6,5" stroke={INK} fill="none" />
        <text x="44" y="458">Product of n = 100 densities</text><text x="44" y="491">L′ = L × {state.determinant}⁻¹⁰⁰</text><text x="44" y="524">Multiplier: {f(state.productMultiplier)}</text>
        <text x="44" y="591">Sum of n = 100 log densities</text><text x="44" y="624">ℓ′ = ℓ − 100 log {state.determinant}</text><text x="44" y="657">Add: {f(state.totalLogShift, 6)}</text>
        <text x="20" y="707" fill={MUTED}>log(product) = sum(log densities)</text>
      </>; }}
    </Drawing>
    <FlowControls><label htmlFor="gmm-d44-unit">Both coordinate units <select id="gmm-d44-unit" value={factor} onChange={e => setFactor(Number(e.target.value))}><option value="1">cm · identity factor 1</option><option value="10">mm · factor 10</option></select></label><button onClick={() => setFactor(10)}>Reset</button></FlowControls>
    <Table caption="Constructed n=100 candidates: the same conversion acts on every model" heads={['Candidate', 'L in cm coordinates', `L in ${state.unit} coordinates`, 'ℓ before', 'ℓ after']} rows={state.rows.map(row => [row.id, f(row.productCm), f(row.productConverted), f(row.logLikelihood), f(row.logConverted, 9)])} />
    <FlowReadout>Per-row log density shifts by <strong>{f(state.perRowLogShift, 9)}</strong>; the 100-row total shifts by <strong>{f(state.totalLogShift, 9)}</strong>. Both candidates keep their seven-nat difference. Product likelihood is multiplied by <strong>{f(state.productMultiplier)}</strong>, which becomes addition after taking logs. Identity conversion changes neither the products nor the logs.</FlowReadout>
  </FlowLab>;
}

export function GaussianSavedTrainingTransform() {
  const [id, setId] = useState(34), [draft, setDraft] = useState('34'), state = savedObservationTransform(id), unique = useId();
  const valid = /^\d+$/.test(draft) && Number(draft) >= 1 && Number(draft) <= 150;
  const update = text => { setDraft(text); if (/^\d+$/.test(text) && Number(text) >= 1 && Number(text) <= 150) setId(Number(text)); };
  const rawPoint = { id, lengthCm: state.raw[0], widthCm: state.raw[1] }, zPoint = { id, lengthCm: state.standardized[0], widthCm: state.standardized[1] };
  return <FlowLab id="gmm-d45" label="Follow one measured ID through the saved training transform">
    <p className="gmm-selection-measured"><strong>Observed ID {id}</strong> · {state.role}; <span style={{ color: LENGTH }}>length {state.raw[0]} cm</span> · <span style={{ color: WIDTH }}>width {state.raw[1]} cm</span></p>
    <div className="gmm-selection-paired-planes">
      <Drawing id="D45-raw" name={`Measured ID${id} in raw centimetres`} max={490} height={w => (w - 100) * 4 / 6 + 150} description={`Raw point ${state.raw.join(',')} cm, role ${state.role}; equal centimetre axis scales.`}>{w => <Plane width={w} xDomain={[3, 9]} yDomain={[1, 5]} xTicks={[3, 6, 9]} yTicks={[1, 3, 5]} points={[rawPoint]} selected={id} unit="cm" />}</Drawing>
      <Drawing id="D45-standardized" name={`Same measured ID${id} after saved subtraction and division`} max={490} height={w => w + 50} description={`Standardized point ${state.standardized.join(',')}; length and width scaled by their saved training standard deviations; equal standardized axis scales. The fixed minus4 to4 domains contain all150 retained measured rows.`}>{w => <Plane width={w} xDomain={[-4, 4]} yDomain={[-4, 4]} xTicks={[-4, 0, 4]} yTicks={[-4, 0, 4]} points={[zPoint]} selected={id} unit="training SD" />}</Drawing>
    </div>
    <Drawing id="D45-operations" name="Each coordinate uses its own saved training mean and scale" height={370} description="Both observed coordinates go through subtraction of their saved training means, then division by their own training population SD. The ID and role do not change; no scaler is refitted.">{w => <>
      {[0, 1].map(i => { const y = 35 + i * 175, color = i ? WIDTH : LENGTH; return <g key={i} fill={color}>
        <text x="20" y={y}>{i ? 'Width' : 'Length'} · ID {id}</text>
        <text x="20" y={y + 35}>{f(state.raw[i])} − {f(state.mean[i])}</text>
        <path d={`M40,${y + 47} V${y + 69} H${w - 38}`} fill="none" stroke={color} />
        <text x="20" y={y + 102}>{f(state.residual[i])} ÷ {f(state.scale[i])}</text>
        <text x="20" y={y + 135}>= {f(state.standardized[i])} training SD</text>
      </g>; })}
    </>}</Drawing>
    <FlowControls><label htmlFor={`${unique}-id`}>Observed ID (1–150) <input id={`${unique}-id`} type="text" inputMode="numeric" value={draft} onChange={e => update(e.target.value)} aria-invalid={!valid} aria-describedby={!valid ? `${unique}-error` : undefined} /></label><button onClick={() => { setId(34); setDraft('34'); }}>Reset</button></FlowControls>
    {!valid && <p id={`${unique}-error`} className="gmm-selection-error" role="status">Enter an integer observed ID from 1 to 150. Both planes retain last-valid ID {id}.</p>}
    <FlowReadout>ID <strong>{id}</strong> stays a measured <strong>{state.role}</strong> observation. The saved training state maps it to <strong>({f(state.standardized[0])}, {f(state.standardized[1])})</strong>. Selecting it changes neither training means nor scales.</FlowReadout>
    <Table caption={`Exact saved transform operands for observed ID ${id}; no scaler refit`} heads={['Coordinate', 'Measured cm', 'Saved training mean', 'Saved population SD', 'Residual cm', 'Standardized coordinate']} rows={['Length', 'Width'].map((name, i) => [name, String(state.raw[i]), String(state.mean[i]), String(state.scale[i]), String(state.residual[i]), String(state.standardized[i])])} />
    <div className="gmm-selection-covariance-transfer"><span className="gmm-selection-matrix" aria-label="Saved diagonal scale D"><span>{f(state.scale[0], 6)}</span><span>0</span><span>0</span><span>{f(state.scale[1], 6)}</span></span><span>×</span><span className="gmm-selection-matrix" aria-label="Standardized covariance cells"><span>Σ₁₁</span><span>Σ₁₂</span><span>Σ₂₁</span><span>Σ₂₂</span></span><span>× Dᵀ</span><span>→ Σ raw</span></div>
    <p>Coordinates convert back by multiplying their saved scales and adding their saved means. Covariance cells convert by multiplying row and column scales: Σ raw<sub>ij</sub> = s<sub>i</sub> Σ standardized<sub>ij</sub> s<sub>j</sub>. Mean offsets do not enter that scatter.</p>
    <Table caption="Complete retained ID roles; label-blind seed 16" heads={['Role', 'Count', 'IDs in retained order']} rows={Object.entries(IRIS_ROLES).map(([role, ids]) => [role, ids.length, ids.join(', ')])} />
  </FlowLab>;
}

function CandidateChart({ criterion }) {
  const validation = criterion === 'validation', [low, high] = validation ? [-3.35, -2.60] : [450, 550], winners = savedSelectionWinners();
  const key = validation ? 'validation_mean_log_density' : 'bic';
  return <Drawing id={`D46-${criterion}`} name={validation ? 'All saved validation densities: higher is better' : 'All saved training BIC values: smaller is better'} max={720} height={465} description={`All sixteen exact retained candidates appear. Four family hues, dashes and point shapes have the same identity in both plots. ${validation ? 'Validation selects full K2' : 'Training BIC selects full K4'}. Lines connect saved candidates only; no intervening candidate is computed.`}>
    {w => { const X = k => 72 + (k - 1) * (w - 122) / 3, Y = value => 340 - (value - low) * 280 / (high - low), ticks = validation ? [-3.3, -3.1, -2.9, -2.7] : [450, 475, 500, 525, 550], win = validation ? winners.validation : winners.bic; return <>
      <text x="20" y="25">{validation ? 'Validation · higher ↑' : 'Training BIC · smaller ↓'}</text>
      {ticks.map(t => <g key={t}><line x1="72" x2={w - 50} y1={Y(t)} y2={Y(t)} stroke="#303033" /><text x="61" y={Y(t) + 5} textAnchor="end">{f(t, 1)}</text></g>)}
      <line x1="72" x2="72" y1="60" y2="340" stroke={MUTED} /><line x1="72" x2={w - 50} y1="340" y2="340" stroke={MUTED} />
      {Object.entries(FAMILY_IDENTITIES).map(([family, identity]) => { const points = SAVED_CANDIDATES.filter(r => r.covariance_type === family); return <g key={family} data-family={family}>
        <path d={points.map((p, i) => `${i ? 'L' : 'M'}${X(p.components)},${Y(p[key])}`).join(' ')} fill="none" stroke={identity.color} strokeDasharray={identity.dash} />
        {points.map(p => <Glyph key={p.components} x={X(p.components)} y={Y(p[key])} kind={identity.glyph} color={identity.color} fill={p === win ? identity.color : '#070707'} data-grid-candidate={`${family}-${p.components}`}><title>{family} K{p.components}: {p[key]}</title></Glyph>)}
      </g>; })}
      {validation ? <path d={`M${X(win.components)},${Y(win[key]) - 13} l-7,-10 h14 Z`} fill={INK} data-selection-winner="validation" /> : <rect x={X(win.components) - 10} y={Y(win[key]) - 10} width="20" height="20" fill="none" stroke={INK} data-selection-winner="bic" />}
      {[1, 2, 3, 4].map(k => <text key={k} x={X(k)} y="372" textAnchor="middle">{k}</text>)}
      <text x={w / 2} y="405" textAnchor="middle">Component count K</text>
      <text x="20" y="440">{validation ? '▼ full K2 selected' : '□ full K4 diagnostic'}</text>
    </>; }}
  </Drawing>;
}
export function GaussianSavedModelGrid() {
  return <FlowLab id="gmm-d46" label="Read the full saved grid without refitting">
    <div className="gmm-selection-family-key">{Object.entries(FAMILY_IDENTITIES).map(([family, identity]) => <span key={family} style={{ color: identity.color }}>{({ circle: '○', square: '□', diamond: '◇', triangle: '△' })[identity.glyph]} {family}</span>)}</div>
    <CandidateChart criterion="validation" /><CandidateChart criterion="bic" />
    <Table caption="All sixteen saved candidates in standardized coordinates; no new fit" heads={['Candidate', 'Validation mean log density', 'Train mean log density', 'AIC', 'Training BIC', 'Converged / iterations']} rows={SAVED_CANDIDATES.map(r => [<span style={{ color: FAMILY_IDENTITIES[r.covariance_type].color }}>{({ full: '○', tied: '□', diag: '◇', spherical: '△' })[r.covariance_type]} {r.covariance_type} K{r.components}</span>, String(r.validation_mean_log_density), String(r.train_mean_log_density), String(r.aic), String(r.bic), `${r.converged} / ${r.iterations}`])} />
    <FlowReadout>Validation selects <strong>full K2 (−2.668799817608869)</strong>; training BIC minimizes at <strong>full K4 (461.59516764543383)</strong>. Full K3's validation score is close (−2.671121581431881). These are different decision rules on the retained 90/30 roles. The connecting lines identify a family across saved K values; they do not interpolate new fits.</FlowReadout>
  </FlowLab>;
}

export function GaussianNarrowFittedComponent() {
  const component = retainedThinComponent(), context = { x: [4.2, 8], y: [1.8, 4.4] }, zoom = { x: [4.2, 8], y: [2.94, 3.06] };
  const inZoom = component.training.filter(p => p.widthCm >= zoom.y[0] && p.widthCm <= zoom.y[1]);
  return <FlowLab id="gmm-d47" label="Retained fitted width versus recorded measurement resolution">
    <Drawing id="D47-context" name="Ninety actual training measurements and one retained thin contour" max={820} height={w => (w - 100) * 2.6 / 3.8 + 150} description="All90 retained training measurements are points in centimetres. Amber is full K4 component0's actual D²=1 contour, not hard membership. Both axes have equal centimetre scale. Width3cm points are measurement facts; the historical fourteen assignment IDs were not retained.">{w => <Plane width={w} xDomain={context.x} yDomain={context.y} xTicks={[4.5, 5.5, 6.5, 7.5]} yTicks={[2, 3, 4]} points={component.training} ellipse={component.ellipse} mean={component.mean} unit="cm" />}</Drawing>
    <p>Amber contour: <strong>full K4 / component 0, D² = 1</strong>, weight {f(component.weight)}. It uses the retained mean and covariance, with width SD <strong>{f(component.sd[1])} cm</strong>. Neutral points are observed training measurements, not inferred members.</p>
    <Drawing id="D47-magnified" name="The same width geometry in an explicitly magnified window" max={820} height={w => (w - 100) * 2.6 / 3.8 + 150} description="Length uses the same domain4.2–8cm. Width alone is magnified: context extent2.6cm becomes0.12cm, factor21.6667. Only actual training widths in2.94–3.06cm appear. The ellipse is transformed without widening. The original IDs remain on each point title and exact table.">{w => <Plane width={w} xDomain={zoom.x} yDomain={zoom.y} xTicks={[4.5, 5.5, 6.5, 7.5]} yTicks={[2.94, 3, 3.06]} points={inZoom} ellipse={component.ellipse} mean={component.mean} unit="cm" magnified />}</Drawing>
    <p>Width-only magnification: <strong>0.12 cm window versus 2.6 cm context</strong> (21⅔×); length domain stays 4.2–8 cm. Different axis scales are explicit here. It is the same contour and the same measured IDs; no fitted spread was inflated.</p>
    <Drawing id="D47-correspondence" name="Every inset observation keeps its measured ID across both windows" max={820} min={700} height={190} description={`The complete measured width3cm ID list in retained training order is ${inZoom.map(p => p.id).join(',')}. Each ID has a connector between context and magnified observation strips. These are ID columns, not a feature axis or a component-assignment list.`}>
      {w => { const column = Math.max(45, (w - 65) / inZoom.length); return <>
        <text x="20" y="25">Measured ID columns · width 3 cm</text><text x="20" y="55" fill={MUTED}>Context → same IDs → magnified</text>
        {inZoom.map((point, i) => { const x = 32 + i * column; return <g key={point.id} data-corresponding-measured-id={point.id}><circle cx={x} cy="84" r="3" fill={INK} /><path d={`M${x},87 V101 M${x},126 V143`} stroke={MUTED} fill="none" /><circle cx={x} cy="146" r="3" fill={INK} /><text x={x} y="121" textAnchor="middle">{point.id}</text></g>; })}
      </>; }}
    </Drawing>
    <Table caption="Actual retained component geometry, converted by saved training scales" heads={['Quantity', 'Length', 'Width']} rows={[
      ['Standardized mean', String(component.standardizedMean[0]), String(component.standardizedMean[1])],
      ['Raw mean (cm)', f(component.mean[0], 12), f(component.mean[1], 12)],
      ['Raw variance (cm²)', f(component.covariance[0][0], 12), f(component.covariance[1][1], 12)],
      ['Raw SD (cm)', f(component.sd[0], 12), f(component.sd[1], 12)],
      ['Recording resolution (cm)', '.1', '.1'],
    ]} />
    <FlowReadout>Width SD is <strong>{f(component.sd[1])} cm</strong>, while measurements are recorded at <strong>0.1 cm</strong> resolution. There are <strong>{component.recordedWidth3.length}</strong> retained training measurements at width 3 cm. The historical analysis reports fourteen assignments to this component, but its assignment ID list is absent; these measurements are not reconstructed assignments. Thin fitted geometry and quantized data can raise training density without improving generalization.</FlowReadout>
    <Table caption="All ninety actual training measurements; the inset selects measured width only" heads={['ID', 'Length (cm)', 'Width (cm)', 'Width 3 cm?']} rows={component.training.map(r => [r.id, r.lengthCm, r.widthCm, r.widthCm === 3 ? 'yes · in inset' : 'no'])} />
  </FlowLab>;
}

export function GaussianReservedTestResult() {
  const state = reservedTestComparison();
  return <FlowLab id="gmm-d48" label="Read the reserved result after the validation choice">
    <p><strong>Choice already fixed: full K2 by validation.</strong> The test set answers the reserved comparison; it supplies no model-selection control.</p>
    <Drawing id="D48" name="A fixed validation winner loses to the baseline on this reserved split" max={800} height={390} description={`Higher mean log density is better. The selected fullK2 is${state.selected.value}; baseline fullK1 is${state.baseline.value}. On the explicit axis[-3.1,-2.8], an arrow from baseline to selected points left and gives selected-minus-baseline${state.difference} nats per row. These exact aggregates are saved original execution outcomes.`}>
      {w => { const X = score => 48 + (score + 3.1) * (w - 85) / .3, baselineX = X(state.baseline.value), selectedX = X(state.selected.value); return <>
        <text x="20" y="28">Mean log density · higher →</text>
        <line x1={X(-3.1)} x2={X(-2.8)} y1="105" y2="105" stroke={MUTED} />
        {[-3.1, -3, -2.9, -2.8].map(t => <g key={t}><line x1={X(t)} x2={X(t)} y1="100" y2="110" stroke={MUTED} /><text x={X(t)} y="140" textAnchor="middle">{f(t, 1)}</text></g>)}
        <Glyph x={selectedX} y={105} kind="diamond" color={FAMILY_IDENTITIES.full.color} fill={FAMILY_IDENTITIES.full.color} size={7} /><Glyph x={baselineX} y={105} color={FAMILY_IDENTITIES.full.color} size={7} />
        <path d={`M${baselineX},180 H${selectedX} m9,-6 l-9,6 l9,6`} fill="none" stroke={INK} />
        <text x="20" y="225">Selected − baseline:</text><text x="20" y="257">{f(state.difference)} nats / row</text>
        <text x="20" y="293" fill={FAMILY_IDENTITIES.full.color}>◆ selected full K2</text>
        <text x="20" y="325" fill={FAMILY_IDENTITIES.full.color}>○ baseline full K1</text>
        <text x="20" y="359" fill={MUTED}>Zoomed axis −3.1 to −2.8</text>
      </>; }}
    </Drawing>
    <Table caption="Reserved original aggregate outcomes; full-precision original execution" heads={['Model', 'Test mean log density (nats/row)']} rows={[[state.selected.id, String(state.selected.value)], [state.baseline.id, String(state.baseline.value)], ['Selected − baseline', String(state.difference)]]} />
    <FlowReadout>The selected mixture is worse by <strong>{f(-state.difference)}</strong> nats per row on these 30 reserved IDs. Keep the validation choice. This split does not establish that mixtures are universally worse; it shows that added flexibility did not help this declared comparison. The aggregate is retained, not recomputed from rounded browser parameters.</FlowReadout>
    <Table caption="All thirty retained per-row test outcomes in saved order" heads={['ID', 'Length / width (cm)', 'Saved log density', 'Saved component ID', 'Saved share 0', 'Saved share 1']} rows={state.rows.map(r => [r.id, `${r.lengthCm} / ${r.widthCm}`, String(r.logDensity), r.componentId, String(r.responsibilities[0]), String(r.responsibilities[1])])} />
  </FlowLab>;
}
