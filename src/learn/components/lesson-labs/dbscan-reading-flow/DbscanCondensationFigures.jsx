import React, { useState } from 'react';
import { chainTree, shrinkWeights, splitWeights, selectionWeights, condense } from '../../../data/dbscan-reading-flow/dbscan-hierarchy-models.mjs';
import { Figure, Canvas, Point, Arrow, Table, CellStrip, NumericControl, Steps, number, hues, focus, line, neutral } from './DbscanDrawingPrimitives.jsx';
const letter = row => String.fromCharCode(65 + row);
export const branchName = (result, branch) => branch === 0 ? 'root' : result.branchRows[branch].map(letter).join('');
export function branchHue(result, branch) {
  if (branch === 0) return neutral;
  const name = branchName(result, branch);
  if (['AB', 'ABC'].includes(name)) return hues[0];
  if (['CDEFG', 'DEFG', 'DEFGHI'].includes(name)) return hues[1];
  if (['CD', 'DEF'].includes(name)) return hues[2];
  return hues[3];
}
function exitsFor(result, branch) {
  const exits = new Map();
  for (const record of result.records.filter(row => row.parent === branch)) {
    const rows = record.kind === 'point' ? [record.child] : result.branchRows[record.child];
    for (const row of rows) exits.set(row, record.level);
  }
  return exits;
}
export function WeightedChain({
  weights
}) {
  return <Canvas height={(_, rem) => (weights.length * 4 + 5) * rem} label="Supplied positive dimensionless weighted tree; structural spacing does not depict feature distances">
    {({
      width,
      rem
    }) => {
      const x = 3 * rem,
        Y = i => (2 + i * 4) * rem;
      return <g>{weights.map((weight, i) => <g key={i}><line x1={x} x2={x} y1={Y(i)} y2={Y(i + 1)} stroke={line} strokeWidth="2" /><text x={x + 2 * rem} y={(Y(i) + Y(i + 1)) / 2 + .3 * rem}>{weight === 1 ? '1' : `1/${number(1 / weight)}`}</text></g>)}{Array.from({
          length: weights.length + 1
        }, (_, i) => <Point key={i} x={x} y={Y(i)} id={letter(i)} role="context" labelX={rem} labelY={Y(i) + .3 * rem} />)}<text x={width - rem} y={2 * rem} textAnchor="end">Weighted links</text></g>;
    }}
  </Canvas>;
}
export function CondensedTree({
  result,
  showSelection = false,
  showArea = false,
  through = Infinity
}) {
  const max = Math.max(...result.records.map(row => row.level));
  return <Canvas height={(_, rem) => (max * 3 + 7) * rem} label="Condensed tree on a common increasing reciprocal-lambda axis; width equals live row count; branch births and individual point exits are distinct">
    {({
      width,
      rem
    }) => {
      const left = 4 * rem,
        unit = (width - left - rem) / result.tree.rowCount,
        X = row => left + (row + .5) * unit,
        Y = level => (3 + level * 3) * rem;
      return <g><text x={0} y={rem}>λ increases ↓</text><text x={left} y={2 * rem}>width = live count</text><line x1={left - rem} x2={left - rem} y1={Y(0)} y2={Y(max)} stroke={line} />{[...new Set([0, ...result.records.map(row => row.level)])].sort((a, b) => a - b).map(level => <g key={level}><text x={left - 1.5 * rem} y={Y(level) + .3 * rem} textAnchor="end">{number(level)}</text><line x1={left - rem} x2={width} y1={Y(level)} y2={Y(level)} stroke={line} strokeDasharray="2 5" /></g>)}{Number.isFinite(through)&&<line data-event-level={through} x1={left-rem} x2={width} y1={Y(through)} y2={Y(through)} stroke={focus} strokeWidth="3" strokeDasharray="6 3"/>}{result.branches.map((branch, id) => {
          const exits = exitsFor(result, id),
            levels = [...new Set([branch.birth, ...exits.values()])].sort((a, b) => a - b),
            color = branchHue(result, id),
            selected = showSelection && result.selected.includes(id);
          return <g key={id} opacity={branch.birth <= through ? 1 : .65}>{levels.slice(0, -1).map((start, i) => {
              const end = levels[i + 1],
                active = [...exits].filter(([, exit]) => exit >= end).map(([row]) => row).sort((a, b) => a - b),
                x = X(active[0]) - unit / 2,
                w = active.length * unit;
              return <g key={start}><rect x={x} y={Y(start)} width={w} height={Y(end) - Y(start)} fill={color} fillOpacity=".15" stroke={color} strokeWidth="2" strokeDasharray={id === 0 ? '5 3' : undefined} />{selected && <rect x={x - 2} y={Y(start) - 2} width={w + 4} height={Y(end) - Y(start) + 4} fill="none" stroke={focus} strokeWidth="3" />}<text x={x + w / 2} y={Y(start) + 1.5 * rem} textAnchor="middle">{branchName(result, id)}: {active.length}</text>{showArea && end - start >= 1 && <text x={x + w / 2} y={Y(start) + 2.7 * rem} textAnchor="middle">{number(active.length * (end - start))}</text>}</g>;
            })}</g>;
        })}{result.records.filter(record => record.kind === 'branch').map((record, i) => {
          const rows = result.branchRows[record.child],
            x = (X(rows[0]) + X(rows.at(-1))) / 2;
          return <g key={i}><line x1={x} x2={x} y1={Y(record.level) - .5 * rem} y2={Y(record.level) + .5 * rem} stroke={branchHue(result, record.child)} strokeWidth="3" /><circle cx={x} cy={Y(record.level)} r="4" fill={branchHue(result, record.child)} /></g>;
        })}{result.records.filter(record => record.kind === 'point').map(record => <g key={record.child}><line x1={X(record.child)} x2={X(record.child)} y1={Y(record.level) - .3 * rem} y2={Y(record.level) + .4 * rem} stroke={branchHue(result, record.parent)} strokeWidth="2" /><circle cx={X(record.child)} cy={Y(record.level) + .4 * rem} r="4" fill="#111" stroke={branchHue(result, record.parent)} /><text x={X(record.child)} y={Y(record.level) + 1.5 * rem} textAnchor="middle">{letter(record.child)}</text></g>)}<text x={0} y={Y(max) + 3 * rem}>Root birth 0; root excluded</text></g>;
    }}
  </Canvas>;
}
function RecordTable({
  result
}) {
  return <Table caption="Literal branch-birth and individual point-departure records" headers={['Parent identity', 'Kind', 'Child identity', 'λ', 'Count']} rows={result.records.map(record => [branchName(result, record.parent), record.kind, record.kind === 'point' ? letter(record.child) : branchName(result, record.child), number(record.level), record.count])} />;
}
function D39() {
  const [minimum, setMinimum] = useState(3),
    result = condense(chainTree(shrinkWeights), minimum),
    names = result.branches.map((branch, i) => `${branchName(result, i)} born ${branch.birth}`).join('; ');
  return <Figure id="D39" sentence={`Condensation minimum ${minimum}: ${names}. ${result.branches.length - 1} eligible nonroot identities. Narrowing with one qualifying survivor retains the branch’s name and birth; two qualifying children receive new identities. At minimum 3, the only branch is the excluded root. Events mean just above λ, rather than a closed distance cut at equality.`}>
    <WeightedChain weights={shrinkWeights} /><CondensedTree result={result} />
    <NumericControl label="Condensation minimum size; same seven-row tree" value={minimum} onChange={setMinimum} min={2} max={7} step={1} resetValue={3} onReset={() => setMinimum(3)} />
    <RecordTable result={result} />
  </Figure>;
}
function D40() {
  const [step, setStep] = useState(0),
    result = condense(chainTree(splitWeights), 3),
    events = [...result.events].sort((a, b) => a.level - b.level || a.branch - b.branch),
    event = events[step];
  return <Figure id="D40" sentence={`λ = ${number(event.level)}: ${event.operation}. At 1, ABC and DEFG receive birth 1. D’s departure at 3 leaves EFG inside the same DEFG identity, still born 1; it creates no EFG branch. Simultaneous equal-weight departures form one event.`}>
    <WeightedChain weights={splitWeights} /><CondensedTree result={result} through={event.level} /><Steps step={step} setStep={setStep} last={events.length - 1} />
    <Table caption="Current event’s emitted records" headers={['Identity', 'Kind', 'Child', 'λ', 'Count']} rows={event.records.map(record => [branchName(result, record.parent), record.kind, record.kind === 'point' ? letter(record.child) : branchName(result, record.child), number(record.level), record.count])} />
  </Figure>;
}
function D41() {
  const result = condense(chainTree(splitWeights), 3);
  return <Figure id="D41" sentence="Root → ABC/DEFG branch edges record births at λ=1 and counts 3/4. Point edges record ABC exits at 2, D at 3 and EFG at 6. DEFG keeps birth 1 as width falls 4 → 3. λ has reciprocal input-length units; this fixture’s weights are dimensionless. Zero/nonfinite merges are unsupported here, without infinity-minus-infinity arithmetic.">
    <CondensedTree result={result} /><RecordTable result={result} />
    <CellStrip label="Kinds remain distinct in the actual data records" values={['branch edge: child branch, birth, count', 'point edge: row ID, exit, count 1', 'synthetic root: birth 0; excluded', 'zero merge: named unsupported status']} />
  </Figure>;
}
export function RowStrips({
  result,
  branch
}) {
  const exits = exitsFor(result, branch),
    birth = result.branches[branch].birth,
    rows = result.branchRows[branch],
    max = Math.max(8,...result.records.map(row => row.level));
  return <Canvas height={(_, rem) => (rows.length * 3.3 + 5) * rem} label={`${branchName(result, branch)}: each literal member has a birth-to-selected-branch-exit strip on one lambda ruler`}>
    {({
      width,
      rem
    }) => {
      const X = value => 3 * rem + value / max * (width - 5 * rem),
        Y = i => (4 + i * 3.3) * rem,
        color = branchHue(result, branch);
      return <g><text x={0} y={rem}>{branchName(result, branch)} birth {number(birth)}</text><text x={0} y={2.5 * rem}>λ</text><text x={X(0)} y={2.5 * rem}>0</text><text x={X(max)} y={2.5 * rem} textAnchor="end">{max}</text><line x1={X(0)} x2={X(max)} y1={3 * rem} y2={3 * rem} stroke={line} />{rows.map((row, i) => <g key={row}><text x={0} y={Y(i) + .4 * rem}>{letter(row)}</text><rect x={X(birth)} y={Y(i)} width={X(exits.get(row)) - X(birth)} height={rem} fill={color} fillOpacity=".6" /><line x1={X(birth)} x2={X(birth)} y1={Y(i) - .3 * rem} y2={Y(i) + 1.3 * rem} stroke={neutral} /><text x={X(exits.get(row))} y={Y(i) + 2.2 * rem} textAnchor="end">{number(birth)} → {number(exits.get(row))}</text></g>)}</g>;
    }}
  </Canvas>;
}
function D42() {
  const shrink3 = condense(chainTree(shrinkWeights), 3),
    shrink2 = condense(chainTree(shrinkWeights), 2),
    split3 = condense(chainTree(splitWeights), 3);
  return <Figure id="D42" sentence="The shrinking root’s rectangles 7×1 + 5×2 + 3×3 equal its seven row strips: 26. Root exclusion still leaves no selected group at minimum 3. At minimum 2, AB/CD/EFG contribute 14/10/9, total 33. The separate split tree contributes ABC 3 and DEFG 17, total 20; D’s strip still begins at birth 1.">
    <div className="db-pair"><div><p>Live-count rectangles, root only</p><CondensedTree result={shrink3} showArea /></div><div><p>Same root area as seven row strips</p><RowStrips result={shrink3} branch={0} /></div></div>
    <p>Same first tree at minimum 2: child birth is subtracted in every strip.</p>
    {shrink2.branches.map((_, branch) => branch > 0 && <RowStrips key={branch} result={shrink2} branch={branch} />)}
    <Table caption="First tree’s actual branch areas and selected identities" headers={['Branch', 'Birth', 'Area', 'Selected?']} rows={shrink2.branches.map((row, i) => [branchName(shrink2, i), row.birth, number(row.stability), i === 0 ? 'root excluded' : String(shrink2.selected.includes(i))])} />
    <p>Separate true-split tree, minimum 3.</p>{split3.branches.map((_, branch) => branch > 0 && <RowStrips key={branch} result={split3} branch={branch} />)}
    <Table caption="ABC and DEFG stability are separate from point strength" headers={['Branch', 'Row strips', 'Area']} rows={split3.branches.map((row, i) => [branchName(split3, i), split3.branchRows[i].map(letter).join(', '), number(row.stability)])} />
  </Figure>;
}
function D43() {
  const [departure, setDeparture] = useState(4),
    weights = selectionWeights(departure),
    result = condense(chainTree(weights), 3),
    parent = result.branchRows.findIndex(rows => rows.length === 6),
    children = result.children[parent],
    parentArea = result.branches[parent].stability,
    childArea = children.reduce((sum, child) => sum + result.branches[child].stability, 0),
    selected = result.selected.map(branch => branchName(result, branch)).join(' + ');
  return <Figure id="D43" sentence={`Child departure x = ${number(departure)}: DEFGHI area ${number(parentArea)} versus child sum ${number(childArea)}. ${parentArea === childArea ? 'Exact tie keeps the parent.' : parentArea > childArea ? 'Parent has the larger legal area.' : 'Both children have the larger combined area.'} Select ${selected}, total ${number(result.total)}. Parent birth 1/split 3 and ABC area 3 remain fixed; this is a persistence objective, not accuracy or a posterior.`}>
    <WeightedChain weights={weights} /><CondensedTree result={result} showSelection showArea />
    <NumericControl label="Child departure level x; four tree edges become 1/x" value={departure} onChange={setDeparture} min={4} max={6} step={.01} resetValue={4} onReset={() => setDeparture(4)} />
    <Table caption="Areas computed from the current condensed birth/exit records; hue names identity and amber outlines selection" headers={['Stable branch', 'Birth', 'Exit / split', 'Area', 'Selected row set']} rows={result.branches.map((row, i) => [branchName(result, i), number(row.birth), number(row.maximum), number(row.stability), i === 0 ? 'root excluded' : result.selected.includes(i) ? result.branchRows[i].map(letter).join(', ') : 'not selected'])} />
  </Figure>;
}
function SelectionFlow({
  result,
  direction = 'up'
}) {
  const names = result.branches.map((_, i) => branchName(result, i)),
    location = name => name === 'root' ? [.5, 3] : name === 'ABC' ? [.2, 11] : name === 'DEFGHI' ? [.7, 11] : name === 'DEF' ? [.52, 21] : [.87, 21];
  return <Canvas height={430} label={`${direction === 'up' ? 'Bottom-up best-area values' : 'Top-down reconstruction stops at a chosen parent'} on actual ABC / DEFGHI / DEF / GHI branches`}>
    {({
      width,
      rem
    }) => <g>{result.branches.map((branch, i) => {
        const [x, y] = location(names[i]),
          radius = (i === 0 ? 1.8 : 2.3) * rem,
          decision = result.decisions.find(row => row.branch === i),
          chosen = result.selected.includes(i);
        return <g key={i}>{i > 0 && (() => {
            const [px, py] = location(names[branch.parent]);
            return direction === 'up' ? <Arrow x1={x * width} y1={y * rem - radius} x2={px * width} y2={py * rem + 2 * rem} color={branchHue(result, i)} /> : <Arrow x1={px * width} y1={py * rem + 2 * rem} x2={x * width} y2={y * rem - radius} color={result.selected.includes(branch.parent) ? line : focus} />;
          })()}<circle cx={x * width} cy={y * rem} r={radius} fill="#111" stroke={branchHue(result, i)} strokeWidth="2" />{chosen && direction === 'down' && <circle cx={x * width} cy={y * rem} r={radius + .25 * rem} fill="none" stroke={focus} strokeWidth="3" />}<text x={x * width} y={(y - .5) * rem} textAnchor="middle">{names[i]}</text><text x={x * width} y={(y + .9) * rem} textAnchor="middle">{direction === 'up' ? `best ${number(decision.best)}` : i === 0 ? 'excluded' : chosen ? 'select' : 'skip'}</text><text x={x * width} y={(y + 4) * rem} textAnchor="middle">area {number(branch.stability)}</text></g>;
      })}</g>}
  </Canvas>;
}
function D44() {
  const result = condense(chainTree(selectionWeights(5)), 3),
    leaf = condense(chainTree(selectionWeights(5)), 3, 'leaf');
  return <Figure id="D44" sentence="At the taught tie x=5, DEF and GHI each return best area 6. Their sum 12 ties parent DEFGHI area 12, so reconstruction stops at DEFGHI and also selects ABC. Root area 9 is excluded. Leaf selection instead takes ABC/DEF/GHI: a different legal rule, with the same total 15 in this tie case.">
    <p>Compute children first; arrows carry best values upward.</p><SelectionFlow result={result} /><p>Then reconstruct downward; amber outlines identify the selected branches.</p><SelectionFlow result={result} direction="down" />
    <Table caption="Actual bottom-up comparison followed by the separate root rule" headers={['Branch', 'Own area', 'Children’s best sum', 'Best', 'Decision']} rows={result.decisions.map(row => [branchName(result, row.branch), number(row.own), number(row.descendantTotal), number(row.best), row.excludedRoot ? 'root excluded in reconstruction' : row.chooseParent ? 'choose parent; exact tie included' : 'choose descendants'])} />
    <CellStrip label="Separate leaf alternative at x=5" values={leaf.selected.map(branch => branchName(leaf, branch))} />
  </Figure>;
}
function DepartureRuler({
  result,
  score = false
}) {
  const branch = result.branchRows.findIndex(rows => rows.join(',') === '3,4,5,6'),
    maximum = result.branches[branch].maximum,
    points = result.pointRecords.filter(row => row.immediateBranch === branch).sort((a, b) => a.row - b.row);
  return <Canvas height={400} label={`DEFG birth1, D exit3, EFG exit6; ${score ? 'gap to immediate-branch reference6' : 'capped exit over selected-branch maximum6'}`}>
    {({
      width,
      rem
    }) => {
      const X = level => 3 * rem + level / maximum * (width - 5 * rem);
      return <g><text x={0} y={2 * rem}>DEFG: birth 1; maximum 6</text><line x1={X(0)} x2={X(6)} y1={4 * rem} y2={4 * rem} stroke={line} />{[0, 1, 3, 6].map(level => <text key={level} x={X(level)} y={3.5 * rem} textAnchor="middle">{level}</text>)}{points.map((point, i) => {
          const y = (7 + i * 4) * rem,
            value = score ? result.outliers[point.row] : result.strengths[point.row];
          return <g key={point.row}><text x={0} y={y + .3 * rem}>{letter(point.row)}</text><line x1={X(0)} x2={X(6)} y1={y} y2={y} stroke={line} /><line x1={score ? X(point.pointExit) : X(0)} x2={score ? X(point.reference) : X(point.ownerDeparture)} y1={y} y2={y} stroke={hues[1]} strokeWidth="5" /><circle cx={X(point.pointExit)} cy={y} r="5" fill={hues[1]} /><line x1={X(1)} x2={X(1)} y1={y - rem} y2={y + rem} stroke={neutral} strokeDasharray="3 3" /><text x={X(6)} y={y + 2 * rem} textAnchor="end">{score ? `(6−${point.pointExit})/6` : `${point.ownerDeparture}/6`} = {number(value)}</text></g>;
        })}<text x={0} y={24 * rem}>Dotted birth: used for area</text></g>;
    }}
  </Canvas>;
}
function D45() {
  const result = condense(chainTree(splitWeights), 3),
    ancestor = condense(chainTree(selectionWeights(4)), 3),
    parent = ancestor.branchRows.findIndex(rows => rows.length === 6);
  return <Figure id="D45" sentence="Selected DEFG has maximum exit 6: D receives 3/6=.5; EFG each receive 6/6=1. Birth 1 is not subtracted in this ratio, unlike stability 17. In the deeper selected DEFGHI parent, first child split 3 is carried to descendant rows; their eventual exit 4 does not replace it. Noise strength is separately 0, not a posterior or full soft-membership vector.">
    <DepartureRuler result={result} />
    <p>Selected ancestor’s first departure remains attached to every descendant row.</p><CondensedTree result={ancestor} showSelection />
    <Table caption="Actual carried selected-owner departure in the deeper x=4 tree" headers={['Row', 'Selected owner', 'Owner exit', 'Deepest point exit', 'Selected maximum', 'Strength']} rows={ancestor.pointRecords.filter(row => ancestor.branchRows[parent].includes(row.row)).sort((a, b) => a.row - b.row).map(row => [letter(row.row), branchName(ancestor, row.selectedOwner), row.ownerDeparture, row.pointExit, ancestor.branches[row.selectedOwner].maximum, ancestor.strengths[row.row]])} />
    <CellStrip label="Ordinary API role" values={['probabilities_: attachment strength', 'not calibrated class probability', 'noise convention: strength 0']} />
  </Figure>;
}
function D46() {
  const result = condense(chainTree(splitWeights), 3),
    deep = condense(chainTree(selectionWeights(4)), 3),
    parent = deep.branchRows.findIndex(rows => rows.length === 6),
    children = deep.children[parent];
  return <Figure id="D46" sentence="D leaves its immediate DEFG branch at 3 against reference 6: (6−3)/6=.5. EFG score 0; ABC use their own reference 2 and also score 0. In the deeper x=4 tree, DEF/GHI deaths at 4 propagate reference 4 into DEFGHI above its own outgoing split 3. This finite GLOSH-style mechanism is separate from stability and strength; it does not certify anomaly truth.">
    <DepartureRuler result={result} score />
    <Canvas height={310} label="Actual deeper DEF and GHI maximum exits4 propagate upward to parent DEFGHI, whose own maximum outgoing split is3">
      {({
        width,
        rem
      }) => <g><circle cx={width / 2} cy={5 * rem} r={3 * rem} fill="none" stroke={hues[1]} /><text x={width / 2} y={4 * rem} textAnchor="middle">DEFGHI</text><text x={width / 2} y={5.5 * rem} textAnchor="middle">own 3</text><text x={width / 2} y={7 * rem} textAnchor="middle">ref {deep.reference[parent]}</text>{children.map((child, i) => <g key={child}><circle cx={width * (i ? .78 : .22)} cy={15 * rem} r={2 * rem} fill="none" stroke={branchHue(deep, child)} /><text x={width * (i ? .78 : .22)} y={14.8 * rem} textAnchor="middle">{branchName(deep, child)}</text><text x={width * (i ? .78 : .22)} y={16.2 * rem} textAnchor="middle">max 4</text><Arrow x1={width * (i ? .78 : .22)} y1={13 * rem} x2={width / 2} y2={8 * rem} color={branchHue(deep, child)} /></g>)}</g>}
    </Canvas>
    <Table caption="Immediate-branch reference and finite GLOSH-style score for every supplied row" headers={['Row', 'Immediate identity', 'Point exit', 'Reference', 'Score']} rows={[...result.pointRecords].sort((a, b) => a.row - b.row).map(row => [letter(row.row), branchName(result, row.immediateBranch), row.pointExit, row.reference, number(result.outliers[row.row])])} />
    <p>The contrib outlier_scores_ route has its own API. sklearn probabilities_ supplies strength instead; the original density-theory reading limits remain in the surrounding explanation.</p>
  </Figure>;
}
export const condensationDrawings = {
  D39,
  D40,
  D41,
  D42,
  D43,
  D44,
  D45,
  D46
};
