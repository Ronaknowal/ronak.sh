import { useState } from 'react';
import { ensembleNumber } from '../../data/ensemble-methods-models.js';
import { typedColumnsIllustration, preprocessingOwnership, nestedSelectionOwnership, forwardAvailability, groupOwnership,
  partitionOwnership, blendRoles, blendRefitIllustration } from '../../data/ensemble-permissions-flow-models.js';
import { EnsembleFlowFigure, EnsembleFlowCanvas } from './EnsembleFlowCombination.jsx';
import { EnsembleQuantity } from './EnsembleFlowControls.jsx';
import './ensemble-flow-permissions.css';

const hues = ['#7fc9ba', '#b2b7e1', '#db96af', '#80b3e8', '#d8aece', '#e8bb60'];
const amber = '#e8bb60';
const number = value => ensembleNumber(value, 8);
const letter = value => String.fromCharCode(65 + value);
const ids = values => values.join(', ');
const letters = values => values.map(letter).join(', ');

function Arrow({ x1, y1, x2, y2, color = '#92929b', dashed = false }) {
  const mid = (x1 + x2) / 2;
  return <g stroke={color} fill="none" strokeDasharray={dashed ? '5 4' : undefined}>
    <path d={`M${x1},${y1} H${mid} V${y2} H${x2}`} />
    <path d={`M${x2 - 7},${y2 - 4} L${x2},${y2} L${x2 - 7},${y2 + 4}`} />
  </g>;
}

function Operation({ x, y, width = 270, title, lines, color = '#bdbdc5' }) {
  return <g>
    <rect x={x} y={y} width={width} height={45 + 26 * lines.length} fill="#17171b" stroke={color} />
    <text x={x + 12} y={y + 25} fill={color}>{title}</text>
    {lines.map((line, index) => <text key={index} x={x + 12} y={y + 54 + index * 26}>{line}</text>)}
  </g>;
}

function TableRegion({ label, children }) {
  return <div className="ensemble-permissions-table" tabIndex={0} role="region" aria-label={`${label}; pan if needed`}>{children}</div>;
}

export function TypedMetaColumnsFigure() {
  const [variant, setVariant] = useState('binary');
  const [passthrough, setPassthrough] = useState(false);
  const state = typedColumnsIllustration(variant, passthrough);
  const reset = () => { setVariant('binary'); setPassthrough(false); };
  return <EnsembleFlowFigure job="D29" title="The output meaning determines which named columns enter the meta model">
    <EnsembleFlowCanvas title="Actual constructed member outputs are class-aligned before binary dropping or typed concatenation" width={1170} height={120 + state.members.length * 125}>
      <text x={16} y={25}>Constructed one-row illustration · named class order [{ids(state.order)}] · auto: probability → margin → label</text>
      {state.members.map((member, index) => <g key={member.member}>
        <Operation x={16} y={48 + index * 125} width={385} title={`${member.member}: ${member.method}`} lines={[
          `classes_=[${ids(member.classes)}]`,
          `${member.outputShape === 'pairwise' ? 'pairs (0,1),(0,2),(1,2)' : 'returned values'}=[${ids(member.values)}]`
        ]} color={hues[index]} />
        <Arrow x1={401} y1={88 + index * 125} x2={451} y2={88 + index * 125} color={hues[index]} />
        <Operation x={451} y={48 + index * 125} width={333} title={state.error ? 'Reject before concatenation' : 'Apply declared identity mapping'} lines={state.error ? [variant === 'ovo' ? '3 pair scores ≠ 3 class scores' : 'missing margin class: no fallback', 'No guessed class column'] : [
          member.method === 'probability' ? state.order.length === 2 ? 'align [0,1]; drop P(class=0)' : 'align [0,1,2]; keep all classes' : member.method === 'margin' ? state.order.length === 2 ? 'align sign toward named class 1' : 'align genuine per-class scores [0,1,2]' : 'encode label as named class index',
          member.classes.length < state.order.length ? 'absent probability class → 0' : 'positions never define identity'
        ]} color={state.error ? amber : hues[index]} />
        {!state.error && <Arrow x1={784} y1={88 + index * 125} x2={834} y2={139} color={hues[index]} />}
      </g>)}
      <Operation x={834} y={92} width={315} title={state.error ? 'Meta input unavailable' : `P[1,${state.columns.length}]`} lines={state.error ? ['No final prediction is certified'] : ['concatenate typed member columns', passthrough ? 'append raw x=[.4,−.2]' : 'raw features omitted', 'column order retained with state']} color={amber} />
      <text x={16} y={104 + state.members.length * 125}>{variant === 'ovo' ? 'SVC and a Pipeline ending in that SVC both require this declared pairwise rejection.' : 'Probability columns lie in [0,1]; signed margins and class indices retain different units.'}</text>
    </EnsembleFlowCanvas>
    {!state.error && <TableRegion label="Literal current meta row and typed column order">
      <table><caption>Current typed meta row, in saved order</caption><thead><tr><th>Row</th>{state.columns.map(column => <th key={column.name}>{column.name}<br />{column.type}</th>)}</tr></thead>
        <tbody><tr><th scope="row">query</th>{state.columns.map(column => <td key={column.name}>{number(column.value)}</td>)}</tr></tbody>
      </table>
    </TableRegion>}
    <div className="ensemble-flow-controls">
      <label>Output contract<select aria-label="Output contract" value={variant} onChange={event => setVariant(event.target.value)}>
        <option value="binary">Three binary probability members</option><option value="multiclass">Two three-class probability members</option>
        <option value="mixed">Binary probability and signed margin</option><option value="label">Hard label, encoded class index</option>
        <option value="perclass">Genuine per-class OVR margins, reordered</option>
        <option value="missing-probability">Absent probability class: declared zero</option><option value="missing-margin">Absent margin class: reject</option>
        <option value="ovo">Three-class OVO pair scores: reject</option>
      </select></label>
      <label className="ensemble-permissions-toggle"><input type="checkbox" checked={passthrough} onChange={event => setPassthrough(event.target.checked)} />Append the two raw features</label>
      <button type="button" onClick={reset}>Reset typed columns</button>
    </div>
    <p aria-live="polite">{state.error ? state.error : `${state.columns.length} named columns enter the meta model: ${state.columns.map(column => column.name).join('; ')}.`}{' '}
      These are constructed values illustrating the column contract. Saved OOF predictions and full-refit transform are different objects.</p>
  </EnsembleFlowFigure>;
}

export function FoldPreprocessingFigure() {
  const state = preprocessingOwnership();
  return <EnsembleFlowFigure job="D30" title="Held features read the saved fold scaler; they cannot teach it">
    <EnsembleFlowCanvas title="Exact legal fold statistics and forbidden global-statistic path, plus fixed hours-to-minutes conversion" width={1260} height={580}>
      <text x={16} y={25}>A–F x=[0,1,2,3,4,5]; held A,D; population variance convention used by StandardScaler</text>
      <Operation x={16} y={55} width={293} title="Clone pipeline; fit only B,C,E,F" lines={['x=[1,2,4,5]; sum 12 ÷4', 'mean μ=3', 'squared deviations [4,1,1,4]']} color={hues[0]} />
      <Arrow x1={309} y1={110} x2={353} y2={110} color={hues[0]} />
      <Operation x={353} y={55} width={317} title="Save fold statistics" lines={['variance=(4+1+1+4) ÷4=2.5', `scale s=√2.5=${number(state.scale)}`, 'held features/targets excluded']} color={hues[0]} />
      <Arrow x1={670} y1={110} x2={716} y2={110} color={hues[0]} />
      <Operation x={716} y={55} width={520} title="Held x reads z=(x−μ)/s" lines={state.reads.map(row => `${letter(row.row)}: (${row.feature}−3)/√2.5 = ${number(row.legal)}`)} color={hues[1]} />
      <text x={716} y={208}>Fresh line in z: intercept 4.75, slope 1.7√2.5</text>
      <text x={716} y={236}>A → −.35; D →4.75, using these saved statistics</text>
      <Operation x={16} y={284} width={293} title="Incorrect: globally fit scaler" lines={['A–F enter the statistic', 'sum 15 ÷6 = μglobal 2.5']} color={amber} />
      <Arrow x1={309} y1={325} x2={353} y2={325} color={amber} dashed />
      <Operation x={353} y={284} width={317} title="Held feature access enters fit" lines={['variance=35/12', `scale=${number(state.globalScale)}`]} color={amber} />
      <Arrow x1={670} y1={325} x2={716} y2={325} color={amber} dashed />
      <Operation x={716} y={284} width={520} title="Same held x; different learned input transform" lines={state.reads.map(row => `${letter(row.row)}: (${row.feature}−2.5)/√(35/12) = ${number(row.illegal)}`)} color={amber} />
      <text x={16} y={426}>This ownership leak need not change every fitted model’s prediction; unpenalized linear regression can absorb a rescaling.</text>
      <Operation x={16} y={457} width={293} title="Fixed conversion: no fit rows" lines={['Externally specified minutes=60×hours']} />
      <Arrow x1={309} y1={496} x2={353} y2={496} />
      <Operation x={353} y={457} width={580} title="Apply constant 60 to held features" lines={['A:0×60=0; D:3×60=180', 'No mean, scale or target learned from A–F']} />
    </EnsembleFlowCanvas>
  </EnsembleFlowFigure>;
}

export function NestedSelectionFigure() {
  const [row, setRow] = useState(0);
  const [placement, setPlacement] = useState('fold');
  const state = nestedSelectionOwnership(row, placement);
  return <EnsembleFlowFigure job="D31" title="The setting-selection arrow must obey the same held-row boundary">
    <EnsembleFlowCanvas title="Six-row permission illustration keeps setting choice distinct from coefficient fit, then encloses the full workflow in outer assessment" width={1230} height={470}>
      <text x={16} y={25}>Inspect held row {letter(row)}; its paired held row is {letters(state.held.filter(value => value !== row))}</text>
      <Operation x={16} y={57} width={345} title="Labels available to setting choice" lines={[
        `IDs[${letters(state.choice)}]`,
        placement === 'global' ? `${letter(row)} target → choose setting (forbidden)` : `${letter(row)} target excluded from every inner choice`,
        'choose neighbor count / ridge strength'
      ]} color={placement === 'global' ? amber : hues[0]} />
      <Arrow x1={361} y1={99} x2={404} y2={99} color={placement === 'global' ? amber : hues[0]} dashed={placement === 'global'} />
      <Operation x={404} y={57} width={345} title={`Coefficient fit: ${letters(state.fit)}`} lines={['selected setting enters this fit', `held targets ${letters(state.held)} excluded`]} color={hues[1]} />
      <Arrow x1={749} y1={99} x2={792} y2={99} color={hues[1]} />
      <Operation x={792} y={57} width={415} title={`Read held x for ${letter(row)}`} lines={[placement === 'global' ? 'Coefficient exclusion alone is insufficient' : 'Entire choice-and-fit omitted this row', 'write original held matrix destination']} color={amber} />
      <rect x={16} y={236} width={1191} height={203} fill="none" stroke={hues[3]} strokeDasharray="6 4" />
      <text x={30} y={263} fill={hues[3]}>N3 actual outer 0: complete fitting workflow uses IDs 0,1,2,6,8,9,10,11</text>
      <Operation x={36} y={282} width={309} title="For each OOF base fit" lines={['inner 2-fold search [.1,1]', 'clone scaler + selected ridge']} color={hues[0]} />
      <Arrow x1={345} y1={325} x2={386} y2={325} color={hues[0]} />
      <Operation x={386} y={282} width={319} title="OOF P → meta Ridge(alpha 1)" lines={['every child fit/search omits its held IDs', 'refit chosen bases on outer-fit IDs']} color={hues[1]} />
      <Arrow x1={705} y1={325} x2={748} y2={325} color={hues[1]} />
      <Operation x={748} y={282} width={437} title="Read reserved assessment IDs 3,4,5,7" lines={['Targets assess the saved whole rule only', 'They enter neither choice nor coefficients']} color={hues[3]} />
      <text x={16} y={463}>Outer assessment encloses setting selection, every OOF fit, meta fitting and full-base refits.</text>
    </EnsembleFlowCanvas>
    <div className="ensemble-flow-controls">
      <label>Inspect held identity<select aria-label="Inspect held identity" value={row} onChange={event => setRow(Number(event.target.value))}>{Array.from({ length: 6 }, (_, index) => <option key={index} value={index}>{letter(index)}</option>)}</select></label>
      <label>Setting choice location<select aria-label="Setting choice location" value={placement} onChange={event => setPlacement(event.target.value)}><option value="fold">Inside the allowed fold rows</option><option value="global">Incorrect: all six labels before OOF</option></select></label>
      <button type="button" onClick={() => { setRow(0); setPlacement('fold'); }}>Reset selection permissions</button>
    </div>
    <p aria-live="polite">{letter(row)} {state.targetEnteredChoice ? 'entered setting selection despite being excluded from the coefficient fit.' : 'enters neither the setting choice nor coefficient fit that creates its base prediction.'}{' '}
      The six-row permission illustration is separate from N3’s saved twelve-row execution below.</p>
    <details><summary>Read all 75 saved N3 fit/search events and three outer scores</summary>
      <TableRegion label="All original N3 choice and coefficient access events">
        <table><caption>Saved N3 audit; coefficient IDs and selection-label IDs are separate accesses</caption><thead><tr><th>Owner / action</th><th>Setting / inner fold</th><th>Coefficient-fit IDs</th><th>Selection-label IDs</th></tr></thead>
          <tbody>{state.savedAudit.events.map((event, index) => <tr key={index}><th scope="row">{event.owner}<br />{event.action}</th><td>{event.alpha ?? 'not selected'} / {event.inner_fold ?? 'refit'}</td><td>{ids(event.coefficient_fit_ids)}</td><td>{event.selection_label_ids.length ? ids(event.selection_label_ids) : 'none'}</td></tr>)}</tbody>
        </table>
      </TableRegion>
      <p>Outer MSEs: {state.savedAudit.outerMSE.map(number).join(', ')}. A global choice reading all 12 labels is rejected for each outer assessment set; it supplies none of these scores.</p>
    </details>
  </EnsembleFlowFigure>;
}

export function ForwardAvailabilityFigure() {
  const [block, setBlock] = useState(0);
  const [delay, setDelay] = useState(0);
  const [revision, setRevision] = useState(0);
  const state = forwardAvailability(block, delay);
  return <EnsembleFlowFigure job="D32" title="An earlier feature is not necessarily an available training outcome">
    <EnsembleFlowCanvas title="All twelve feature times and separate label availability points relative to the selected prediction origin" width={1220} height={400}>
      <text x={16} y={25}>Predict rows[{ids(state.held)}] at origin {state.origin}; label availableAt=featureTime+{delay}</text>
      <text x={16} y={57}>Each horizontal route: feature time ○ → outcome becomes available ◆</text>
      <path d="M130,91 H1190" stroke="#92929b" />
      {Array.from({ length: 15 }, (_, time) => <g key={time}><path d={`M${130 + time * 70},86 V96`} stroke="#92929b" /><text x={130 + time * 70} y={118} textAnchor="middle">{time}</text></g>)}
      {state.rows.map(row => {
        const y = 147 + 17 * row.id;
        return <g key={row.id}>
          <text x={16} y={y + 6} fill={row.held ? hues[3] : row.eligible ? hues[0] : '#bdbdc5'}>row {row.id}</text>
          <path d={`M${130 + row.featureTime * 70},${y} H${130 + row.availableAt * 70}`} stroke={row.eligible ? hues[0] : amber} />
          <circle cx={130 + row.featureTime * 70} cy={y} r={4} fill="#17171b" stroke={row.held ? hues[3] : '#bdbdc5'} />
          <path d={`M${130 + row.availableAt * 70},${y - 5} l5,5 -5,5 -5,-5 Z`} fill={row.eligible ? hues[0] : amber} />
        </g>;
      })}
      <path d={`M${130 + state.origin * 70},80 V365`} stroke="white" strokeDasharray="5 4" />
      <text x={16} y={390}>Fit: earlier feature AND availableAt≤origin. Initial rows 0–2 have no earlier OOF predictions.</text>
    </EnsembleFlowCanvas>
    <TableRegion label="Current time permissions and retained forward coverage">
      <table><caption>Feature time, outcome availability and fit permission are different fields</caption><thead><tr><th>Row</th><th>Feature time</th><th>Label availableAt</th><th>Current fit</th><th>Current prediction</th><th>Original forward coverage</th></tr></thead>
        <tbody>{state.rows.map(row => <tr key={row.id}><th scope="row">{row.id}</th><td>{row.featureTime}</td><td>{row.availableAt}</td><td>{row.eligible ? 'allowed' : row.historical ? 'outcome unavailable' : 'not earlier'}</td><td>{row.held ? 'held query' : 'not this block'}</td><td>{row.coverage ? 'one held prediction' : 'unavailable'}</td></tr>)}</tbody>
      </table>
    </TableRegion>
    <div className="ensemble-flow-controls">
      <label>Prediction origin<select aria-label="Prediction origin" value={block} onChange={event => setBlock(Number(event.target.value))}><option value="0">Origin 3 → rows 3–5</option><option value="1">Origin 6 → rows 6–8</option><option value="2">Origin 9 → rows 9–11</option></select></label>
      <EnsembleQuantity label="Outcome delay" value={delay} onChange={setDelay} min={0} max={3} integer revision={revision} />
      <button type="button" onClick={() => { setBlock(0); setDelay(0); setRevision(value => value + 1); }}>Reset time availability</button>
    </div>
    <p aria-live="polite">At origin {state.origin}, permitted fit IDs are [{ids(state.fit)}]; prediction IDs [{ids(state.held)}].
      An outcome available exactly at the origin is allowed by this declared inclusive convention. Delays change the illustrative eligibility mask; they do not replace the original saved no-delay forecasts.</p>
  </EnsembleFlowFigure>;
}

export function WholeGroupExclusionFigure() {
  const [group, setGroup] = useState(0);
  const [revision, setRevision] = useState(0);
  const state = groupOwnership(group);
  return <EnsembleFlowFigure job="D33" title="Both rows of a held entity leave every base fit and search together">
    <EnsembleFlowCanvas title="Six actual two-row groups remain intact under three whole-group folds, beside an explicit sibling leakage route" width={1150} height={390}>
      <text x={16} y={25}>Inspect entity {group}; its actual held fold also holds entity {state.heldGroups.find(value => value !== group)}</text>
      {Array.from({ length: 6 }, (_, index) => <g key={index}>
        <rect x={16 + index * 183} y={54} width={166} height={129} fill="#17171b" stroke={index === group ? 'white' : hues[index]} strokeWidth={index === group ? 2 : 1} />
        <text x={28 + index * 183} y={80} fill={hues[index]}>entity {index}</text>
        {[0, 1].map(offset => <g key={offset}><circle cx={45 + index * 183} cy={106 + 39 * offset} r={10} fill={state.heldGroups.includes(index) ? '#17171b' : hues[index]} stroke={hues[index]} />
          <text x={64 + index * 183} y={112 + 39 * offset}>row {2 * index + offset}</text></g>)}
        <text x={28 + index * 183} y={176}>{state.heldGroups.includes(index) ? 'whole held group' : 'whole fit group'}</text>
      </g>)}
      <Operation x={16} y={231} width={469} title="Legal fit and choice rows" lines={[`IDs[${ids(state.fit)}]`, `exclude held IDs[${ids(state.held)}]`]} color={hues[0]} />
      <Operation x={529} y={231} width={598} title="Incorrect row-wise comparison" lines={[`Hold row ${state.leakyHeld}; fit sibling row ${state.leakySibling}`, `entity ${group} information still enters coefficients / selection`]} color={amber} />
      <text x={16} y={383}>The three original whole-group folds cover all 12 rows once. New entities and future times are different assessment tasks.</text>
    </EnsembleFlowCanvas>
    <div className="ensemble-flow-controls"><EnsembleQuantity label="Inspected entity" value={group} onChange={setGroup} min={0} max={5} integer revision={revision} />
      <button type="button" onClick={() => { setGroup(0); setRevision(value => value + 1); }}>Reset group inspection</button></div>
    <p aria-live="polite">Held entities[{ids(state.heldGroups)}] contribute IDs[{ids(state.held)}]. No row of either entity enters the shown fit or choice.
      Leaving sibling {state.leakySibling} in a row-wise fit violates the illustrated new-entity boundary.</p>
  </EnsembleFlowFigure>;
}

export function PartitionStorageFigure() {
  const state = partitionOwnership();
  return <EnsembleFlowFigure job="D34" title="Held lists must be a permutation of all row IDs for a partition-based API">
    <EnsembleFlowCanvas title="Expanding-window held IDs write only rows 3–11; original rows 0–2 remain unavailable, not numeric zeros" width={1160} height={540}>
      <text x={16} y={25}>Actual held lists concatenate to [3,4,5,6,7,8,9,10,11]; required partition is all IDs 0–11 once</text>
      {state.held.map((held, index) => <g key={index}>
        <Operation x={16} y={71 + index * 144} width={300} title={`Forward block ${index + 1}`} lines={[`fit 0…${3 * (index + 1) - 1}`, `held[${ids(held)}]`]} color={hues[index]} />
        {held.map(row => <Arrow key={row} x1={316} y1={108 + index * 144} x2={730} y2={57 + row * 35} color={hues[index]} />)}
      </g>)}
      <text x={742} y={25}>Original row → covered meta cells</text>
      {state.coverage.map((coverage, row) => <g key={row}>
        <text x={748} y={63 + row * 35}>row {row}</text>
        <rect x={835} y={42 + row * 35} width={291} height={29} fill="#17171b" stroke={coverage ? hues[Math.floor((row - 3) / 3)] : '#92929b'} strokeDasharray={coverage ? undefined : '4 3'} />
        <text x={847} y={63 + row * 35}>{coverage ? 'two held-generated member cells' : 'unavailable; no earlier history'}</text>
      </g>)}
      <text x={16} y={501}>Missing IDs[{ids(state.missing)}] → permutation check false → partition API cannot construct a full meta matrix.</text>
      <text x={16} y={531}>Explicit forward loop keeps the mask and fits the combiner only on covered legal rows 3–11.</text>
    </EnsembleFlowCanvas>
  </EnsembleFlowFigure>;
}

export function KeptBlendStateFigure() {
  const roles = blendRoles();
  const [protocol, setProtocol] = useState('kept');
  const [query, setQuery] = useState(2.5);
  const [revision, setRevision] = useState(0);
  const state = blendRefitIllustration(query, protocol);
  return <EnsembleFlowFigure job="D35" title="A holdout blend serves the same base states that supplied its meta rows">
    <EnsembleFlowCanvas title="N4 ninety-six actual role IDs feed separate base, meta, calibration and evaluation stages" width={1250} height={452}>
      <text x={16} y={25}>N4 i=0…95; role depends on i mod 8; every ID has exactly one role</text>
      {Array.from({ length: 12 }, (_, block) => <g key={block}>
        <text x={16} y={65 + block * 24}>IDs {8 * block}–{8 * block + 7}</text>
        {Array.from({ length: 8 }, (_, offset) => {
          const role = offset < 3 ? 0 : offset < 5 ? 1 : offset === 5 ? 2 : 3;
          return <g key={offset}><rect x={166 + offset * 68} y={47 + block * 24} width={59} height={21} fill="#17171b" stroke={hues[role]} />
            <text x={195 + offset * 68} y={63 + block * 24} textAnchor="middle" fill={hues[role]}>{8 * block + offset}</text></g>;
        })}
      </g>)}
      {[
        ['Fit bases: 36 IDs, i mod 8∈{0,1,2}', 'save scaler/line and Bayes parameters'],
        ['Read bases on 24 meta IDs: i mod 8∈{3,4}', 'member columns + meta targets → fit meta'],
        ['12 calibration IDs: i mod 8=5', 'saved whole-rule scores + targets → fit link'],
        ['24 evaluation IDs: i mod 8∈{6,7}', 'saved probabilities + held targets → assess']
      ].map(([title, line], index) => <g key={title}>
        <Operation x={767} y={47 + index * 95} width={457} title={title} lines={[line]} color={hues[index]} />
        {index < 3 && <g fill="none" stroke={hues[index]}><path d={`M996,${118 + index * 95} V${139 + index * 95}`} />
          <path d={`M991,${133 + index * 95} L996,${139 + index * 95} L1001,${133 + index * 95}`} /></g>}
      </g>)}
      <text x={16} y={435}>Serving bases keep their 36-row ownership; meta, calibration and evaluation rows do not become base-fit rows.</text>
    </EnsembleFlowCanvas>
    <TableRegion label="All N4 disjoint role identities"><table><caption>Actual N4 role IDs</caption><thead><tr><th>Role</th><th>All permitted IDs</th></tr></thead>
      <tbody>{Object.entries(roles).map(([role, rows], index) => <tr key={role}><th scope="row" style={{ color: hues[index] }}>{role} / {rows.length}</th><td>{ids(rows)}</td></tr>)}</tbody>
    </table></TableRegion>
    <EnsembleFlowCanvas title="Separate six-row arithmetic illustration compares kept and union-refit base inputs under an unchanged half-half combiner" width={1360} height={343}>
      <text x={16} y={25}>Separate A–F arithmetic illustration, not the measured N4/N6 models: original base A–C, meta D–F; fixed .5/.5 rule</text>
      <Operation x={16} y={105} width={220} title={`Read x=${number(query)}`} lines={['base fit IDs', `[${letters(state.fit)}]`]} />
      <Arrow x1={236} y1={147} x2={280} y2={81} color={hues[0]} /><Arrow x1={236} y1={147} x2={280} y2={223} color={hues[1]} />
      <Operation x={280} y={48} width={431} title={`Nearest chooses ${letter(state.nearest)}`} lines={[`read target=${number(state.predictions[0])}`, 'earliest original ID breaks a distance tie']} color={hues[0]} />
      <Operation x={280} y={185} width={431} title="Saved line slope × query + intercept" lines={[`${number(state.slope)} × ${number(query)} + ${number(state.intercept)}`, `prediction=${number(state.predictions[1])}`]} color={hues[1]} />
      <Arrow x1={711} y1={81} x2={755} y2={81} color={hues[0]} /><Arrow x1={711} y1={223} x2={755} y2={223} color={hues[1]} />
      <Operation x={755} y={48} width={230} title="× unchanged .5" lines={[`product=${number(state.products[0])}`]} color={hues[0]} />
      <Operation x={755} y={185} width={230} title="× unchanged .5" lines={[`product=${number(state.products[1])}`]} color={hues[1]} />
      <Arrow x1={985} y1={81} x2={1030} y2={147} color={hues[0]} /><Arrow x1={985} y1={223} x2={1030} y2={147} color={hues[1]} />
      <Operation x={1030} y={105} width={308} title="Add both contributions" lines={[`forecast=${number(state.forecast)}`]} color={amber} />
      <text x={16} y={337}>{protocol === 'kept' ? 'Keep A–C base states; no row reuse or refit.' : 'Changed workflow: A–F refit changes the base outputs under the old .5/.5 combination. No new assessment result is attached.'}</text>
    </EnsembleFlowCanvas>
    <div className="ensemble-flow-controls"><label>Serving base protocol<select aria-label="Serving base protocol" value={protocol} onChange={event => setProtocol(event.target.value)}><option value="kept">Keep the original base-fit state</option><option value="refit">Illustration: refit bases on the union</option></select></label>
      <EnsembleQuantity label="Blend illustration query" value={query} onChange={setQuery} min={0} max={5} step={.1} revision={revision} />
      <button type="button" onClick={() => { setProtocol('kept'); setQuery(2.5); setRevision(value => value + 1); }}>Reset blend illustration</button></div>
    <p aria-live="polite">Under the {protocol === 'kept' ? 'kept A–C' : 'changed union A–F'} base state, the two outputs [{state.predictions.map(number).join(', ')}]
      produce {number(state.forecast)} with fixed .5/.5 coefficients. This illustrates input-distribution change; it is not a new measured blend or a superiority claim.</p>
  </EnsembleFlowFigure>;
}
