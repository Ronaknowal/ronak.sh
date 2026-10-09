import { ensembleNumber } from '../../data/ensemble-methods-models.js';
import { ensembleServingEvidence, servingCandidateNames } from '../../data/ensemble-serving-flow-models.js';
import { EnsembleFlowFigure, EnsembleFlowCanvas } from './EnsembleFlowCombination.jsx';
import { EnsembleQuantity, EnsembleVectorEntry } from './EnsembleFlowControls.jsx';
import { useEnsembleServing } from './EnsembleFlowServingControls.jsx';
import './ensemble-flow-serving.css';

const hues = ['#7fc9ba', '#b2b7e1', '#db96af'], amber = '#e8bb60';
const n = value => Number.isFinite(value) && value !== 0 && (Math.abs(value) >= 1e6 || Math.abs(value) < 1e-7)
  ? value.toExponential(8) : ensembleNumber(value, 9);
const baseNames = ['Logistic line', 'Gaussian Bayes', 'Nine-neighbor'];
function Wire({ x1, y1, x2, y2, colour = '#aaaab2' }) {
  return <><path d={`M${x1},${y1} L${x2},${y2}`} stroke={colour} fill="none" /><path d={`M${x2-6},${y2-4} L${x2},${y2} L${x2-6},${y2+4}`} stroke={colour} fill="none" /></>;
}
function Scalar({ x, y, value, label, colour = '#ededf0', width = 170, stage }) {
  return <g data-serving-stage={stage}><text x={x} y={y-24} fill={colour}>{label}</text><rect x={x} y={y-17} width={width} height={35} fill="#17171b" stroke={colour} />
    <text x={x+8} y={y+6} fill={colour}>{n(value)}</text></g>;
}
function Operation({ x, y, symbol, operand, label, colour = amber }) {
  return <g><circle cx={x} cy={y} r={20} fill="#17171b" stroke={colour} /><text x={x} y={y+6} textAnchor="middle" fill={colour}>{symbol}</text>
    {operand !== undefined && <><path d={`M${x},${y+66} V${y+21}`} fill="none" stroke={colour} /><text x={x-55} y={y+90}>{n(operand)}</text><text x={x-55} y={y+115}>{label}</text></>}
  </g>;
}
function InvalidServing({ state }) {
  return state.pending ? <p role="status">Checking saved state before computing this query…</p> : <p role="alert">Saved state rejected: {state.error} No forecast is computed for this invalid bundle.</p>;
}
function ServingTable({ label, children }) {
  return <div className="ensemble-serving-table" tabIndex={0} role="region" aria-label={`${label}; scroll horizontally if needed`}>{children}</div>;
}

function BaseOperationDrawing({ state }) {
  const t = state.trace, j = state.feature, [line, bayes, neighbor] = t.group, raw = state.query[j];
  const firstNeighbor = neighbor.neighbors[0], neighborCoordinate = neighbor.coordinates[j];
  const remainingLine = line.base.intercept + line.products.reduce((total,value,i)=>total+(i===j?0:value),0);
  return <EnsembleFlowCanvas width={1550} height={784} title={`Actual saved ${t.fittedRows}-row base operations for feature ${j}: ${state.bundle.feature_order[j]}`}>
    <text x={16} y={26}>Feature {j}: {state.bundle.feature_order[j]} · {t.fittedRows}-row {state.selected==='blend'?'kept holdout':'full-refit'} bases</text>
    <text x={16} y={57}>One visible coordinate below; all thirty contributions are retained in the table. Classes: 0 benign, 1 malignant.</text>
    <text x={16} y={91} fill={hues[0]}>Logistic line: subtract, divide, multiply, sum all 30, then apply sigmoid</text>
    <Scalar x={16} y={141} value={raw} label="raw feature xⱼ" width={145} colour={hues[0]} />
    <Wire x1={161} y1={141} x2={225} y2={141} colour={hues[0]} /><Operation x={245} y={141} symbol="−" operand={line.base.scaler.mean[j]} label="saved mean μⱼ" colour={hues[0]} />
    <Wire x1={265} y1={141} x2={360} y2={141} colour={hues[0]} /><Operation x={380} y={141} symbol="÷" operand={line.base.scaler.scale[j]} label="saved scale sⱼ" colour={hues[0]} />
    <Wire x1={400} y1={141} x2={475} y2={141} colour={hues[0]} /><Scalar x={475} y={141} value={line.coordinates[j]} label="standardized zⱼ" colour={hues[0]} />
    <Wire x1={645} y1={141} x2={720} y2={141} colour={hues[0]} /><Operation x={740} y={141} symbol="×" operand={line.base.coefficients[j]} label="saved slope βⱼ" colour={hues[0]} />
    <Wire x1={760} y1={141} x2={835} y2={141} colour={hues[0]} /><Scalar x={835} y={141} value={line.products[j]} label="coordinate product" colour={hues[0]} />
    <Wire x1={1005} y1={141} x2={1090} y2={141} colour={hues[0]} /><Operation x={1110} y={141} symbol="Σ" colour={hues[0]} />
    <rect x={1010} y={218} width={210} height={35} fill="#17171b" stroke={hues[0]}/><text x={1020} y={241}>{n(remainingLine)}</text>
    <text x={994} y={278}>other 29 + saved intercept</text><path d="M1110,218 V162 M1106,168 L1110,162 L1114,168" fill="none" stroke={hues[0]}/>
    <text x={1240} y={217}>score {n(line.score)}</text>
    <Wire x1={1130} y1={141} x2={1260} y2={141} colour={hues[0]} /><Operation x={1280} y={141} symbol="σ" colour={hues[0]} />
    <Wire x1={1300} y1={141} x2={1360} y2={141} colour={hues[0]} /><Scalar x={1360} y={141} value={line.probability} label="P(class 1)" colour={hues[0]} />
    <text x={16} y={305} fill={hues[1]}>Gaussian Bayes uses raw features; each class has its own saved mean, smoothed variance and prior.</text>
    {bayes.classes.map((c,i) => { const y = 352+i*121, term = c.terms[j]; return <g key={c.id} data-gaussian-class={c.id}>
      <text x={16} y={y}>class {c.id}: xⱼ−μcⱼ</text><text x={16} y={y+28}>{n(raw)}−{n(bayes.base.mean[i][j])}</text>
      <Wire x1={232} y1={y+9} x2={281} y2={y+9} colour={hues[1]} /><Scalar x={281} y={y+9} value={term.squared} label="square difference" colour={hues[1]} />
      <Wire x1={451} y1={y+9} x2={494} y2={y+9} colour={hues[1]} /><Scalar x={494} y={y+9} value={term.standardizedSquare} label="÷ saved variance" colour={hues[1]} />
      <text x={494} y={y+62}>variance {n(bayes.base.variance[i][j])}</text>
      <Wire x1={664} y1={y+9} x2={726} y2={y+9} colour={hues[1]} /><Scalar x={726} y={y+9} value={term.standardizedSquare+term.logNormalization} label="+ log term → sum" stage="gaussian-sum" colour={hues[1]} />
      <text x={726} y={y+62}>log term {n(term.logNormalization)}</text>
      <Wire x1={896} y1={y+9} x2={947} y2={y+9} colour={hues[1]} /><Scalar x={947} y={y+9} value={term.contribution} label="× −1/2 → contribution" colour={hues[1]} />
      <Wire x1={1117} y1={y+9} x2={1210} y2={y+9} colour={hues[1]} /><Operation x={1230} y={y+9} symbol="Σ" colour={hues[1]} />
      <text x={1150} y={y+65}>all 30 + log(prior {n(c.prior)})</text><Scalar x={1335} y={y+9} value={c.joint} label="joint log score" colour={hues[1]} />
      <Wire x1={1250} y1={y+9} x2={1335} y2={y+9} colour={hues[1]} />
    </g>; })}
    <text x={16} y={593} fill={hues[2]}>Nine-neighbor: saved scaler → thirty squared differences per stored row → rank distances, then mean labels.</text>
    <Scalar x={16} y={650} value={neighborCoordinate} label="query zⱼ" colour={hues[2]} />
    <Wire x1={186} y1={650} x2={262} y2={650} colour={hues[2]} /><Operation x={282} y={650} symbol="−" colour={hues[2]} />
    <text x={226} y={711}>rowID {firstNeighbor.id} zⱼ={n(neighborCoordinate+firstNeighbor.deltas[j])}</text>
    <Wire x1={302} y1={650} x2={468} y2={650} colour={hues[2]} /><Scalar x={468} y={650} value={firstNeighbor.squares[j]} label="square difference" colour={hues[2]} />
    <Wire x1={638} y1={650} x2={745} y2={650} colour={hues[2]} /><Operation x={765} y={650} symbol="Σ" colour={hues[2]} />
    <text x={706} y={712}>all 30 squares</text><Wire x1={785} y1={650} x2={876} y2={650} colour={hues[2]} />
    <Scalar x={876} y={650} value={firstNeighbor.squaredDistance} label={`nearest rowID ${firstNeighbor.id}`} colour={hues[2]} />
    <text x={16} y={760}>Every base probability is aligned to malignant class 1 before it enters a combiner; a query is not a measured specimen.</text>
  </EnsembleFlowCanvas>;
}

function ProbabilityAndCombinationDrawing({ state }) {
  const t=state.trace,c=t.combination,b=t.group[1];
  return <>
    <EnsembleFlowCanvas width={1190} height={238} title="Both Gaussian class log scores share a stable exponential normalization">
      <text x={16} y={26}>Bayes normalization: subtract maximum joint score {n(b.maximum)} before exponentiating.</text>
      {[0,1].map(i=><g key={i}><Scalar x={16} y={80+i*90} value={b.classes[i].joint} label={`class ${i} joint`} colour={hues[1]} />
        <Wire x1={186} y1={80+i*90} x2={280} y2={80+i*90} colour={hues[1]} /><Scalar x={280} y={80+i*90} value={b.exponentials[i]} label="exp(joint−maximum)" colour={hues[1]} /></g>)}
      <Wire x1={450} y1={80} x2={580} y2={80} colour={hues[1]}/><path d="M450,170 H500 V80 H580" fill="none" stroke={hues[1]}/><Operation x={600} y={80} symbol="Σ" colour={hues[1]}/>
      <Wire x1={620} y1={80} x2={680} y2={80} colour={hues[1]}/><Scalar x={680} y={80} value={b.normalizer} label="sum exponentials" colour={hues[1]}/>
      <path d="M850,80 H960 V149 M956,143 L960,149 L964,143" stroke={hues[1]} fill="none"/>
      <Wire x1={450} y1={170} x2={940} y2={170} colour={hues[1]}/><Operation x={960} y={170} symbol="÷" colour={hues[1]}/>
      <Scalar x={995} y={170} value={b.probability} label="class 1 probability" colour={hues[1]}/><Wire x1={980} y1={170} x2={995} y2={170} colour={hues[1]}/>
      <text x={16} y={230}>Class 1 numerator divides by the shared sum. Subtracting the maximum leaves both named probabilities unchanged.</text>
    </EnsembleFlowCanvas>
    <EnsembleFlowCanvas width={1180} height={c.products?362:165} title={`Actual ${servingCandidateNames[t.selected]} output route with the saved ordered inputs`}>
      <text x={16} y={26}>{servingCandidateNames[t.selected]} · bases fitted on {t.fittedRows} rows · output P(malignant)</text>
      {c.products ? <>
        {c.products.map((product,i)=><g key={i}><Scalar x={16} y={94+i*75} value={c.inputs[i]} label={`${baseNames[i]} P(1)`} colour={hues[i]} />
          <Wire x1={186} y1={94+i*75} x2={287} y2={94+i*75} colour={hues[i]} /><Operation x={307} y={94+i*75} symbol="×" colour={hues[i]} />
          <text x={352} y={100+i*75}>weight {n(c.weights[i])}</text><Wire x1={549} y1={94+i*75} x2={597} y2={94+i*75} colour={hues[i]} />
          <Scalar x={597} y={94+i*75} value={product} label="actual product" colour={hues[i]} />
          <path d={`M767,${94+i*75} H812 V288`} fill="none" stroke={hues[i]} /></g>)}
        <Operation x={812} y={308} symbol="Σ" /><text x={16} y={327}>intercept {n(c.intercept)} + three products = {n(c.total)} {c.kind==='score-link'?'score':'probability'}</text>
        <Wire x1={832} y1={308} x2={948} y2={308} /><Operation x={968} y={308} symbol={c.link==='sigmoid'?'σ':'='} />
        <Scalar x={1010} y={308} value={t.probability} label="P(malignant)" width={150} /><Wire x1={988} y1={308} x2={1010} y2={308} />
      </> : <><Scalar x={16} y={99} value={t.probability} label={c.kind==='prior'?'Saved training prior':`${baseNames[c.selected]} P(1)`} width={220} />
        <Wire x1={236} y1={99} x2={376} y2={99} /><text x={398} y={105}>identity output; no new weight fit or extra sigmoid</text></>}
    </EnsembleFlowCanvas>
  </>;
}

export function SavedWDBCForwardFigure() {
  const state=useEnsembleServing(),t=state.trace;
  return <EnsembleFlowFigure job="D41" title="Apply every saved preprocessing, base and combination array to the same thirty-feature query">
    {t ? <><BaseOperationDrawing state={state}/><ProbabilityAndCombinationDrawing state={state}/></> : <InvalidServing state={state}/>}
    <div className="ensemble-flow-controls">
      <label className="ensemble-flow-field">Saved candidate<select aria-label="Saved WDBC candidate" value={state.selected} onChange={e=>state.setSelected(e.target.value)}>
        {Object.entries(servingCandidateNames).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
      <EnsembleVectorEntry label="All thirty saved-order query features" values={state.query} onChange={state.setQuery} revision={state.revision}/>
      <button onClick={state.reset}>Reset saved forward</button>
    </div>
    {t && <p aria-live="polite">Computed {servingCandidateNames[t.selected]} P(malignant)={n(t.probability)}. The frozen selected rule remains line at threshold {String(t.selectedThreshold)};
      its current query action is {t.selectedRuleAction?'positive':'negative'}. Inspecting another candidate does not change the original validation winner.</p>}
    {t && <>
      <ServingTable label="Thirty actual feature coordinates and contributions"><table><caption>All thirty feature identities; selected {state.feature}: {state.bundle.feature_order[state.feature]}</caption>
        <thead><tr><th>Feature ID/name</th><th>Raw query</th><th>Saved line mean</th><th>Saved line scale</th><th>Line z</th><th>Line β</th><th>Line product</th><th>Bayes class 0 contribution</th><th>Bayes class 1 contribution</th><th>Neighbor z</th></tr></thead>
        <tbody>{state.bundle.feature_order.map((name,j)=><tr key={name} aria-current={j===state.feature?'true':undefined}><th scope="row">{j}: {name}</th><td>{n(state.query[j])}</td><td>{n(t.group[0].base.scaler.mean[j])}</td><td>{n(t.group[0].base.scaler.scale[j])}</td><td>{n(t.group[0].coordinates[j])}</td><td>{n(t.group[0].base.coefficients[j])}</td><td>{n(t.group[0].products[j])}</td><td>{n(t.group[1].classes[0].terms[j].contribution)}</td><td>{n(t.group[1].classes[1].terms[j].contribution)}</td><td>{n(t.group[2].coordinates[j])}</td></tr>)}</tbody>
      </table></ServingTable>
      <ServingTable label="Nine actual selected neighbor IDs"><table><caption>Portable neighbors: squared distance, then original row ID; all thirty coordinates contribute</caption>
        <thead><tr><th>Rank</th><th>Original row ID</th><th>Squared distance</th><th>Stored class</th><th>Focused coordinate squared difference</th></tr></thead>
        <tbody>{t.group[2].neighbors.map((row,i)=><tr key={row.id}><th scope="row">{i+1}</th><td>{row.id}</td><td>{n(row.squaredDistance)}</td><td>{row.label} ({row.label?'malignant':'benign'})</td><td>{n(row.squares[state.feature])}</td></tr>)}</tbody>
      </table></ServingTable>
      <p>Nine selected labels contain {t.group[2].positiveCount} malignant rows: {t.group[2].positiveCount}/9={n(t.group[2].probability)}.
        An exact distance tie uses original ID in this portable rule and can differ from the ordinary backend. It does not replace the measured test arrays.</p>
      <ServingTable label="Eight saved rule query outputs and fixed measured outcomes"><table><caption>Current query versus the original fixed split; measured outcomes remain unchanged</caption><thead><tr><th>Candidate</th><th>Current P(malignant)</th><th>Validation log loss</th><th>Test log loss</th><th>Test Brier</th><th>Test accuracy at .5</th></tr></thead>
        <tbody>{Object.keys(servingCandidateNames).map(id=><tr key={id}><th scope="row">{servingCandidateNames[id]}{id==='line'?' · validation winner':''}</th><td>{n(t.predictions[id])}</td><td>{n(ensembleServingEvidence.validation[id].log_loss)}</td><td>{n(ensembleServingEvidence.test[id].log_loss)}</td><td>{n(ensembleServingEvidence.test[id].Brier)}</td><td>{n(ensembleServingEvidence.test[id].accuracy_at_half)}</td></tr>)}</tbody>
      </table></ServingTable>
    </>}
  </EnsembleFlowFigure>;
}

export function FocusedWDBCFeatureFigure() {
  const state=useEnsembleServing();
  return <EnsembleFlowFigure job="D41-feature" title="Change one named coordinate in the same complete query">
    <EnsembleFlowCanvas width={770} height={137} title="Selected feature retains its actual schema index and value inside all thirty query coordinates">
      <text x={16} y={27}>Feature {state.feature}: {state.bundle.feature_order[state.feature]}</text>
      <Scalar x={16} y={86} value={state.query[state.feature]} label="exact current coordinate" width={210}/><Wire x1={226} y1={86} x2={301} y2={86}/>
      <text x={324} y={93}>query[{state.feature}] · the other 29 coordinates stay fixed</text>
    </EnsembleFlowCanvas>
    <div className="ensemble-flow-controls"><label className="ensemble-flow-field">Focused feature<select aria-label="Focused WDBC feature" value={state.feature} onChange={e=>state.setFeature(Number(e.target.value))}>
      {state.bundle.feature_order.map((name,j)=><option value={j} key={name}>{j}: {name}</option>)}</select></label>
      <EnsembleQuantity key={`feature-${state.feature}`} label="Focused query feature value" value={state.query[state.feature]} onChange={state.editFeature} min={-1e6} max={1e6} revision={state.revision}/>
      <button onClick={state.reset}>Reset focused saved query</button></div>
    <p>These are computational queries, including zero, negative or extreme coordinates; their availability does not make them plausible specimens.</p>
  </EnsembleFlowFigure>;
}

export function WholeSavedBundleFigure() {
  const state=useEnsembleServing(),t=state.trace,b=state.bundle;
  return <EnsembleFlowFigure job="D44" title="Keep named schemas and every fitted array in one validated saved rule">
    {t ? <EnsembleFlowCanvas width={1130} height={635} title="Feature/class schema, saved preprocessing/base arrays, ordered meta columns, parameters/link and threshold share one bound whole state">
      <text x={16} y={26}>Schema version {b.schema_version} · class 0 benign / class 1 malignant · query has 30 named coordinates</text>
      <text x={16} y={62}>query[{state.feature}] {b.feature_order[state.feature]}={n(state.query[state.feature])}</text>
      <Wire x1={515} y1={58} x2={601} y2={58}/><text x={622} y={64}>feature-order identity</text>
      <text x={16} y={110}>Thirty names match thirty fitted positions; class names match probability columns.</text>
      {[0,1,2].map(i=><g key={i}><rect x={24+i*353} y={156} width={307} height={117} fill="#17171b" stroke={hues[i]}/>
        <text x={38+i*353} y={181} fill={hues[i]}>{baseNames[i]}</text>
        <text x={38+i*353} y={209}>{i===1?'2×30 means and variances':'30 saved means and scales'}</text>
        <text x={38+i*353} y={239}>{i===0?'30 slopes + intercept':i===1?'2 class priors':'saved rows + labels + 9 count'}</text>
        <path d={`M${178+i*353},273 V308`} stroke={hues[i]} fill="none"/><text x={38+i*353} y={335} fill={hues[i]}>{b.meta_column_order[i]}</text>
        <text x={38+i*353} y={364}>P(1)={n(t.group[i].probability)}</text>
        {(t.combination.products || t.combination.selected===i) && <path d={`M${178+i*353},376 V404 H550 V429`} stroke={hues[i]} fill="none"/>}</g>)}
      <Operation x={550} y={450} symbol={t.combination.products?'Σ':'='}/><text x={16} y={448}>Full bases 341 rows; kept blend bases 204.</text>
      {t.combination.kind==='prior' && <><text x={410} y={386}>saved prior {n(b.prior)}</text><path d="M550,394 V429" stroke={amber} fill="none"/></>}
      <text x={16} y={481}>Fixed simplex weights or saved score intercept/slopes</text>
      <text x={16} y={514}>A score uses its saved sigmoid; a probability sum uses the identity link.</text>
      <Wire x1={570} y1={450} x2={779} y2={450}/><text x={801} y={456}>P(malignant)={n(t.probability)}</text>
      <text x={622} y={488}>Selected route: {servingCandidateNames[t.selected]}</text>
      <text x={16} y={557}>Frozen validation winner: line. Threshold {String(b.threshold)} uses p≥t positive.</text>
      <text x={16} y={594}>Versions: Python {b.versions.python}, NumPy {b.versions.numpy}, sklearn {b.versions.sklearn}</text>
      <text x={16} y={625}>Checksum covers schemas, both base groups, all arrays, combination parameters, threshold and source identities.</text>
    </EnsembleFlowCanvas> : <InvalidServing state={state}/>}
    <div className="ensemble-flow-controls"><label className="ensemble-flow-field">Saved bundle state<select aria-label="Saved bundle state" value={state.fault} onChange={e=>state.setFault(e.target.value)}>
      <option value="valid">Valid original whole state</option><option value="feature-order">Swap two feature names; retain parameters</option><option value="meta-order">Reverse typed meta columns</option><option value="class-order">Reverse class order</option><option value="zero-scale">Replace a saved scale with zero</option><option value="changed-coefficient">Change a meta slope; retain checksum</option>
    </select></label><button onClick={()=>state.setFault('valid')}>Reload valid saved state</button></div>
    {state.identity && <p className="ensemble-serving-identity">Last valid whole-state identity: <code>{state.identity.nativePayloadSHA256}</code>.
      {state.error?' The current changed bundle is invalid; that identity is historical and supplies no current forecast.':' Exact saved state verified.'}</p>}
    {t && <ServingTable label="Saved feature, class, source and data identities"><table><caption>Schema, source and data values stored with the complete rule</caption><thead><tr><th>Saved field</th><th>Actual value</th></tr></thead>
      <tbody>{[
        ['Schema version',String(b.schema_version)],['Feature schema SHA-256',b.feature_schema_sha256],
        ['Class order','0 benign, 1 malignant'],['Meta columns',b.meta_column_order.join(' → ')],
        ['Program SHA-256',b.source.program_sha256],['CSV SHA-256',b.source.csv_sha256],
        ['Whole-state checksum',b.checksum],['Array source artifact SHA-256',state.identity.artifactSHA256],
        ['Library versions',`Python ${b.versions.python}; NumPy ${b.versions.numpy}; SciPy ${b.versions.scipy}; sklearn ${b.versions.sklearn}`]
      ].map(([field,value])=><tr key={field}><th scope="row">{field}</th><td className="ensemble-serving-identity"><code>{value}</code></td></tr>)}</tbody>
    </table></ServingTable>}
    <p>A checksum binds state; matching dimensions alone do not restore named feature or class meanings. D41 keeps the same query when a bundle fault is selected or the valid state is reloaded.</p>
  </EnsembleFlowFigure>;
}
