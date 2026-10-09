import React, { useState } from 'react';
import * as m from "../../../data/inference-cost-models.js";
import { Figure, Controls, Choice, NumberControl, Readout, Note, SafeResult, Bars, Strip, Matrix, n, money } from './CostPrimitives.jsx';
export function WorkloadSurface() {
  const [fraction, setFraction] = useState(.5),
    [unknown, setUnknown] = useState(0);
  return <Figure id="D15" label="Declared workload response surface"><div className="cost-table-scroll" tabIndex={0} role="region" aria-label="Workload input by output classes; use arrow keys to pan"><table className="cost-table cost-surface-table"><thead><tr><th scope="col">Input tokens</th><th scope="col">16 output tokens</th><th scope="col">128 output tokens</th></tr></thead><tbody>{[[128, 10, 30], [2048, 80, 180], [8192, null, null]].map(([input, ...values]) => <tr key={input}><th scope="row">{input} input tokens</th>{values.map((v, j) => <td key={j} className={v === null ? 'cost-unknown' : ''}>{v === null ? 'unknown' : `${v} ms`}</td>)}</tr>)}</tbody></table></div><SafeResult calculate={() => m.workload(fraction, unknown)}>{r => <><Strip total={1} pieces={[{
          label: '128→16 class',
          value: (1 - unknown) * (1 - fraction),
          color: '#5da9ff'
        }, {
          label: '2048→16 class',
          value: (1 - unknown) * fraction,
          color: '#ffc04d'
        }, {
          label: 'Unmeasured 8192→512 class',
          value: unknown,
          color: '#777'
        }]} /><Readout>{r.meanMs === null ? 'Mixture rate is unresolved because an unknown class has positive weight.' : `Mean service time ${1 - fraction} × 10 + ${fraction} × 80 = ${n(r.meanMs)} ms; serial reciprocal rate ${n(r.rate)} tasks/s.`}</Readout></>}</SafeResult><Controls><NumberControl name="Long class fraction among known classes" value={fraction} step={.1} max={1} onChange={setFraction} /><NumberControl name="Unknown class weight" value={unknown} step={.1} max={1} onChange={setUnknown} /></Controls><Note>All times are explicitly constructed response-surface cells, not this checkpoint's measurements. Unknown 8192→512 remains unknown; the displayed extra row also shows that no rate is supplied for other outputs at that input size.</Note></Figure>;
}
function StairChart({
  capacity = 180000,
  fixed = 1200,
  variable = .002,
  alternative = null,
  volume = 160000,
  alwaysOn = false
}) {
  const count = Math.max(3, Math.ceil(volume / capacity)),
    maxV = capacity * count,
    maxY = Math.max(count * fixed + maxV * variable, alternative ? maxV * alternative : 0, 1),
    x = v => 65 + v / maxV * 510,
    y = v => 220 - v / maxY * 185;
  let points = [];
  for (let k = 1; k <= count; k++) {
    points.push(`${x((k - 1) * capacity)},${y(k * fixed + (k - 1) * capacity * variable)}`, `${x(k * capacity)},${y(k * fixed + k * capacity * variable)}`);
  }
  return <><div className="cost-chart-scroll" tabIndex={0} role="region" aria-label="Scrollable quantitative drawing"><svg className="cost-chart" viewBox="0 0 640 280" role="img" aria-label="Expense against completed task volume with integer capacity stairs"><line x1="65" y1="220" x2="595" y2="220" /><line x1="65" y1="220" x2="65" y2="20" /><text x="70" y="18">USD per horizon</text><text x="250" y="268">Completed tasks per horizon</text><circle cx={x(0)} cy={y(alwaysOn ? fixed : 0)} r="5" fill="#b595ff" />{!alwaysOn && <circle cx={x(0)} cy={y(fixed)} r="5" fill="#121212" stroke="#b595ff" strokeWidth="2" />}<polyline points={points.join(' ')} fill="none" stroke="#b595ff" strokeWidth="3" />{alternative !== null && <line x1={x(0)} y1={y(0)} x2={x(maxV)} y2={y(maxV * alternative)} style={{
          stroke: "#59d9ed",
          strokeWidth: 3
        }} />}{Array.from({
          length: count + 1
        }, (_, i) => i).map(k => <g key={k}>{(count <= 4 || k === 0 || k === 1 || k === count) && <text x={x(k * capacity)} y="242" textAnchor="middle">{n(k * capacity / 1000)}k</text>}{k > 0 && <circle cx={x(k * capacity)} cy={y(k * fixed + k * capacity * variable)} r="5" fill="#b595ff" />}{k > 0 && k < count && <circle cx={x(k * capacity)} cy={y((k + 1) * fixed + k * capacity * variable)} r="5" fill="#121212" stroke="#b595ff" strokeWidth="2" />}</g>)}{[0, .5, 1].map(f => <text key={f} x="58" y={y(f * maxY) + 4} textAnchor="end">{n(f * maxY, 0)}</text>)}<circle cx={x(volume)} cy={y(m.fleet(volume, capacity, fixed, variable, alwaysOn).cost)} r="7" fill="#ffc04d" stroke="white" strokeWidth="2" /></svg></div><div className="cost-legend"><span><i style={{
          background: '#b595ff'
        }} />Integer reserved fleet</span>{alternative !== null && <span><i style={{
          background: '#59d9ed'
        }} />Metered alternative</span>}<span>● closed capacity endpoint; ○ open next region</span></div></>;
}
export function CapacityStairs() {
  const [volume, setVolume] = useState(160000),
    [always, setAlways] = useState(false);
  return <Figure id="D16" label="Integer capacity and fixed expense"><SafeResult calculate={() => m.fleet(volume, 180000, 1200, .002, always)}>{r => <><div className="cost-replicas">{Array.from({
            length: r.slots
          }, (_, i) => <div key={i} style={{
            borderColor: m.identityColors[i % 5]
          }}>Replica {i + 1}<br />180,000 task capacity<br />$1,200 fixed expense</div>)}</div><StairChart volume={volume} alwaysOn={always} /><Readout>{r.slots} slots × $1,200 + {n(volume)} × $0.002 = {money(r.cost)}; average {money(r.average)} per task.</Readout></>}</SafeResult><Controls><NumberControl name="Tasks in horizon" value={volume} max={540000} onChange={setVolume} /><Choice name="Zero-demand policy" value={always} onChange={setAlways} options={[[false, 'Release all slots'], [true, 'Keep one always on']]} /><button type="button" onClick={() => setVolume(180000)}>At capacity</button><button type="button" onClick={() => setVolume(180001)}>One task beyond</button></Controls></Figure>;
}
export function SurvivingSupply() {
  const [replicas, setReplicas] = useState(4),
    [demand, setDemand] = useState(150000),
    [fraction, setFraction] = useState(.7),
    [failed, setFailed] = useState(0);
  return <Figure id="D17" label="Usable supply after one failure"><SafeResult calculate={() => m.surviving(demand, fraction, replicas, Math.min(failed, replicas - 1))}>{r => <><div className="cost-replicas">{Array.from({
            length: replicas
          }, (_, i) => <button type="button" key={i} className={i === r.failed ? 'cost-failed' : ''} style={{
            borderColor: m.identityColors[i % 5]
          }} aria-pressed={i === r.failed} onClick={() => setFailed(i)}>Replica {i + 1}<br />{i === r.failed ? 'Failed: zero supply' : `${n(r.usable)} usable tasks`}<br />100,000 nominal</button>)}</div><Bars rows={[{
          label: 'Surviving usable supply',
          value: r.supply,
          color: '#59d9ed'
        }, {
          label: 'Required demand',
          value: demand,
          color: '#ffc04d'
        }]} unit="tasks" /><Readout>{replicas - 1} survivors × {n(r.usable)} usable tasks = {n(r.supply)}: {r.feasible ? 'satisfies' : 'fails'} demand. Required total slots for one failure: {r.required === null ? 'no finite count' : r.required}.</Readout></>}</SafeResult><Controls><NumberControl name="Replicas" value={replicas} min={1} max={8} onChange={setReplicas} /><NumberControl name="Demand" value={demand} step={10000} onChange={setDemand} /><NumberControl name="Usable fraction" value={fraction} max={1} step={.1} onChange={setFraction} /></Controls><Note>Select a failed replica. Its identity colour stays while hatching marks failure; the supplied usable fraction already includes the chosen headroom.</Note></Figure>;
}
export function Crossovers() {
  const [capacity, setCapacity] = useState(180000),
    [alt, setAlt] = useState(.01),
    [volume, setVolume] = useState(160000);
  return <Figure id="D18" label="Feasible economic crossover"><SafeResult calculate={() => ({
      fleet: m.fleet(volume, capacity),
      cross: m.crossovers(capacity, 1200, .002, alt)
    })}>{r => <><StairChart capacity={capacity} alternative={alt} volume={volume} /><div className="cost-crossings">{r.cross.map(row => <p key={row.slots}>{row.slots} slots: crossing {n(row.crossing)}; region ({n(row.lower)}, {n(row.upper)}] → <strong>{row.feasible ? 'feasible' : 'outside region'}</strong></p>)}</div><Readout>At {n(volume)} tasks: reserved {money(r.fleet.cost)} versus metered {money(volume * alt)}.{!r.cross.length && ' No positive fixed-cost crossover when alternative rate is no greater than variable expense.'}</Readout></>}</SafeResult><Controls><Choice name="Per-slot capacity" value={capacity} onChange={setCapacity} options={[[180000, '180,000'], [100000, '100,000']]} /><NumberControl name="Metered USD / task" value={alt} step={.001} onChange={setAlt} /><NumberControl name="Tasks" value={volume} onChange={setVolume} /></Controls></Figure>;
}
export function MarginalCost() {
  const [volume, setVolume] = useState(180000),
    [paid, setPaid] = useState(false);
  return <Figure id="D19" label="Cost of one more task"><SafeResult calculate={() => m.marginal(volume, paid)}>{r => <><div className="cost-two-branches">{[[volume, r.before], [volume + 1, r.after]].map(([v, record]) => <div key={v}><strong>{n(v)} tasks</strong><div className="cost-replicas">{Array.from({
                length: record.slots
              }, (_, i) => <div key={i}>Slot {i + 1}<br />$1,200</div>)}</div><span>variable {money(v * .002)}<br />total {money(record.cost)}</span></div>)}</div><Readout>Next-task increment: {money(r.after.cost)} − {money(r.before.cost)} = {money(r.incremental)}. Current average: {money(r.before.average)} per task. {paid && (r.paidNext === null ? 'No paid spare capacity for the next task; a $0.002 shortcut is invalid.' : `Within paid spare capacity, short-run increment is ${money(r.paidNext)}.`)}</Readout></>}</SafeResult><Controls><Choice name="Starting demand" value={volume} onChange={setVolume} options={[[160000, '160,000'], [180000, '180,000']]} /><Choice name="Short-run boundary" value={paid} onChange={setPaid} options={[[false, 'Plan all required slots'], [true, 'Inspect paid spare slot']]} /></Controls></Figure>;
}
export function RetryTree() {
  const [first, setFirst] = useState(.8),
    [conditional, setConditional] = useState(.8),
    [enabled, setEnabled] = useState(true);
  return <Figure id="D23" label="Attempt tree with terminal outcomes"><SafeResult calculate={() => m.retry(first, conditional, enabled)}>{r => <><div className="cost-probability-tree"><div>Task → first attempt · $0.01</div><div className="cost-two-branches"><div style={{
              borderColor: '#5da9ff'
            }}>Success<br />mass {n(r.first)}<br />terminal cost $0.01</div><div style={{
              borderColor: '#ffc04d'
            }}>Failure mass {n(r.failed)}<br />{enabled ? '→ retry · another $0.01' : '→ terminal failure'}{enabled && <div className="cost-two-branches"><span>Recovered<br />{n(r.recovered)} mass<br />terminal cost $0.02</span><span>Still failed<br />{n(r.terminalFailure)} mass<br />terminal cost $0.02</span></div>}</div></div></div><Readout>Expected expense {money(r.cost)}; success probability {n(r.success)}; expense per success {money(r.perSuccess)}. Failed terminal work remains in the numerator.</Readout></>}</SafeResult><Controls><NumberControl name="First success probability" value={first} max={1} step={.1} onChange={setFirst} /><NumberControl name="Retry success given first failure" value={conditional} max={1} step={.1} onChange={setConditional} /><Choice name="Retry policy" value={enabled} onChange={setEnabled} options={[[true, 'One retry'], [false, 'No retry']]} /></Controls></Figure>;
}
export function ConditionalRouting() {
  const [falsePositive, setFalsePositive] = useState(.1),
    [miss, setMiss] = useState(.2),
    [strong, setStrong] = useState(.95);
  return <Figure id="D24" label="Verifier-conditioned routing cohorts"><SafeResult calculate={() => m.routing(falsePositive, miss, strong)}>{r => <><div className="cost-route-flow"><div><strong>100 cheap answers · $0.20</strong><Bars rows={[{
              label: 'Initially correct',
              value: 82,
              color: '#5da9ff'
            }, {
              label: 'Initially wrong',
              value: 18,
              color: '#ff83ad'
            }]} maximum={100} unit="expected tasks" /></div><div className="cost-two-branches"><div><strong>Retain unflagged</strong><p>{n(r.retainedCorrect)} correct<br />{n(r.retainedWrong)} wrong</p></div><div><strong>Replace flagged</strong><p>{n(r.flaggedCorrect)} originally correct + {n(r.flaggedWrong)} originally wrong = {n(r.flagged)}</p><span>Strong route on this cohort → {n(r.replacements)} correct; {n(r.flagged - r.replacements)} wrong</span></div></div></div><Readout>Expected correct {n(r.retainedCorrect)} + {n(r.replacements)} = {n(r.success)} / 100. Expense {money(r.cost)}; {money(r.perSuccess)} per expected success. Quality ≥ 95%: {r.eligible ? 'eligible' : 'ineligible'}.</Readout></>}</SafeResult><Controls><NumberControl name="False-positive probability" value={falsePositive} max={1} step={.05} onChange={setFalsePositive} /><NumberControl name="Miss probability" value={miss} max={1} step={.05} onChange={setMiss} /><NumberControl name="Strong quality on flagged cohort" value={strong} max={1} step={.05} onChange={setStrong} /></Controls><Note>These are expected cohort masses. Overall strong-model accuracy does not establish its quality on verifier-selected tasks.</Note></Figure>;
}
export function AllocationLattice() {
  const [demand, setDemand] = useState(7),
    [selected, setSelected] = useState([2, 0]);
  const r = m.lattice(demand),
    cell = r.cells.find(c => c.x === selected[0] && c.y === selected[1]);
  return <Figure id="D25" label="Integer allocation lattice"><div className="cost-lattice" tabIndex={0} role="group" aria-label="x horizontal, y vertical integer allocations">{[3, 2, 1, 0].map(y => <div className="cost-lattice-row" key={y}><strong>y={y}</strong>{[0, 1, 2, 3].map(x => {
          const c = r.cells.find(v => v.x === x && v.y === y);
          return <button type="button" key={x} className={`${c.feasible ? '' : 'cost-infeasible'} ${r.optimum === c ? 'cost-optimum' : ''}`} aria-pressed={selected[0] === x && selected[1] === y} onClick={() => setSelected([x, y])}>( {x}, {y} )<br />supply {c.supply}<br />cost {c.cost}</button>;
        })}</div>)}<div className="cost-lattice-row"><span />{[0, 1, 2, 3].map(x => <strong key={x}>x={x}</strong>)}</div></div><Readout>Selected ({cell.x},{cell.y}): 4x + 2y = {cell.supply} {cell.supply >= demand ? '≥' : '<'} {demand}; x+y={cell.slots} {cell.slots <= 3 ? '≤' : '>'} 3; cost 7x+4y={cell.cost}. {cell.feasible ? 'Feasible.' : 'Infeasible.'} Optimum: {r.optimum ? `(${r.optimum.x},${r.optimum.y}), cost ${r.optimum.cost}` : 'none'}.</Readout><Controls><Choice name="Required supply" value={demand} onChange={setDemand} options={[[7, 'Seven units'], [13, 'Thirteen units']]} /></Controls><Note>Hatching marks infeasibility; amber border marks optimum; white inset outline marks inspection. Every lattice cell is a complete integer allocation.</Note></Figure>;
}
export function ClassAssignment() {
  const [quality, setQuality] = useState(.9),
    [capacity, setCapacity] = useState(10),
    [cheap, setCheap] = useState(20);
  const r = m.classAssignment(quality, capacity, cheap),
    o = r.optimum;
  return <Figure id="D26" label="Class-conditional route eligibility"><div className="cost-class-routes"><div style={{
        borderColor: '#5da9ff'
      }}><strong>20 easy tasks</strong><p>Cheap quality 1; strong .95</p><span>{o ? `${o.easyCheap} → cheap; ${o.easyStrong} → strong` : 'No feasible assignment'}</span></div><div style={{
        borderColor: '#ff83ad'
      }}><strong>10 hard tasks</strong><p>Cheap .5 {quality <= .5 ? 'eligible' : 'ineligible'}; strong .95 {quality <= .95 ? 'eligible' : 'ineligible'}</p><span>{o ? `${o.hardCheap} → cheap; ${o.hardStrong} → strong` : 'No feasible assignment'}</span></div><div>Cheap route<br />{o?.cheap ?? '—'} / {cheap} capacity<br />$0.002/task</div><div>Strong route<br />{o?.strong ?? '—'} / {capacity} capacity<br />$0.02/task</div></div><Readout>{o ? `Feasible minimum expense ${money(o.cost)} for all 30 tasks.` : 'No assignment meets each class quality and route capacity. Infeasibility is not a zero-dollar result.'}</Readout><Controls><Choice name="Required hard-class quality" value={quality} onChange={setQuality} options={[[.4, '.40'], [.9, '.90'], [.99, '.99']]} /><Choice name="Strong capacity" value={capacity} onChange={setCapacity} options={[[10, 'Ten'], [5, 'Five']]} /><Choice name="Cheap capacity" value={cheap} onChange={setCheap} options={[[20, 'Twenty'], [30, 'Thirty']]} /></Controls><Note>Each assigned route must itself meet that class's quality requirement. Easy-class requirement remains .9.</Note></Figure>;
}
export function SolverMapping() {
  const [variant, setVariant] = useState('integer'),
    [row, setRow] = useState('capacity');
  const demand = variant === 'infeasible' ? 13 : 7;
  return <Figure id="D27" label="Ordinary solver arrays and retained results"><div className="cost-solver-equation"><Matrix label="c · objective" rows={[[7, 4]]} color="#ffc04d" /><Matrix label="A · constraint rows" rows={[[4, 2], [1, 1]]} selectedRow={row === 'capacity' ? 0 : 1} color="#5da9ff" /><div><strong>{row === 'capacity' ? 'Capacity row: 4x+2y' : 'Slot row: x+y'}</strong><p>lower = [{demand}, −∞]<br />upper = [∞, 3]<br />variable bounds = [0,3] each<br />integrality = [{variant === 'relaxed' ? '0,0' : '1,1'}]</p></div></div><Readout>{variant === 'integer' ? 'Retained SciPy status 0: x=[2,0], objective 14. Matches the integer lattice.' : variant === 'infeasible' ? 'Retained SciPy status 2: infeasible; no allocation or expense to deploy.' : 'Retained continuous relaxation: x=[1.75,0], objective 12.25. Fractional devices are not an integer deployment.'}</Readout><Controls><Choice name="Saved solver case" value={variant} onChange={setVariant} options={[['integer', 'Whole-slot optimum'], ['infeasible', 'Demand thirteen'], ['relaxed', 'Continuous relaxation']]} /><Choice name="Trace a constraint" value={row} onChange={setRow} options={[['capacity', 'Capacity row'], ['slots', 'Slot row']]} /></Controls><Note>These values are retained ordinary SciPy results, cross-checked against finite enumeration. The browser does not execute SciPy.</Note></Figure>;
}
export function Sensitivity() {
  const [scenario, setScenario] = useState('uncertain'),
    [known, setKnown] = useState(true);
  const args = scenario === 'robust' ? [160000, 170000, 1000, 1100] : scenario === 'stair' ? [170000, 190000, 1000, 1400] : [120000, 160000, 1000, 1400],
    r = m.sensitivity(...args);
  return <Figure id="D30" label="Cost bands across declared assumptions"><div className="cost-sensitivity-grid">{r.rows.map(row => <div key={row.volume}><strong>{n(row.volume)} tasks</strong><Bars rows={[{
          label: 'Reserved low fixed',
          value: row.low,
          color: '#b595ff'
        }, {
          label: 'Reserved high fixed',
          value: row.high,
          color: '#b595ff'
        }, {
          label: 'Metered alternative',
          value: row.alternative,
          color: '#59d9ed'
        }]} maximum={Math.max(...r.rows.map(v => Math.max(v.high, v.alternative)))} unit="USD" /></div>)}</div><Readout>{!known ? 'No eligible winner: required quality is unknown.' : r.robustReserved ? 'Reserved expense is lower across every declared endpoint and capacity boundary.' : r.robustMetered ? 'Metered expense is lower across every declared endpoint and capacity boundary.' : 'Ordering changes or overlaps within this declared range; no robust expense winner.'}</Readout><Controls><Choice name="Declared input range" value={scenario} onChange={setScenario} options={[['uncertain', 'Fixed 1000–1400; demand 120–160k'], ['robust', 'Fixed 1000–1100; demand 160–170k'], ['stair', 'Cross 180k capacity stair']]} /><Choice name="Quality requirement" value={known} onChange={setKnown} options={[[true, 'Both known eligible'], [false, 'Quality unknown']]} /></Controls><Note>These are scenario ranges, not confidence intervals. Integer stair endpoints and their next tasks are evaluated explicitly.</Note></Figure>;
}
