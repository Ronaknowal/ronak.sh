import { useState } from 'react';
import { diagonalSubset, inspectArgument, inspectQuantifiers, inspectRelation, oddSquareStep, propositionLabels, relationPreset, rosterNames, selectRoster } from '../../data/sets-logic-models.js';
import { BinaryBoard, HasseDrawing, RegionsDrawing, RelationFailureDrawing, SquareDrawing } from './SetsLogicDrawings.jsx';
import './sets-logic-labs.css';
const setText = values => values.length ? `{${values.join(', ')}}` : '∅';
const truth = value => value ? 'true' : 'false';
function Choice({ label, value, choices, onChange }) { return <label className="sets-logic-control"><span>{label}</span><select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>{choices.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>; }
function Actions({ children, onReset }) { return <div className="sets-logic-actions">{children}<button type="button" onClick={onReset}>Reset</button></div>; }
const operations = [['intersection', 'T ∩ B: both'], ['union', 'T ∪ B: either or both'], ['difference', 'T ∖ B: trained only'], ['reverseDifference', 'B ∖ T: badged only'], ['complement', 'U ∖ T: not trained'], ['symmetricDifference', 'T △ B: exactly one']];
export function SetRegionsLab() {
  const [training, setTraining] = useState(3), [badges, setBadges] = useState(6), [operation, setOperation] = useState('intersection');
  const result = selectRoster(training, badges, operation);
  return <section data-live-exploration className="sets-logic-lab" aria-label="Set membership regions investigation"><RegionsDrawing {...result} />
    <p className="sets-logic-result" aria-live="polite">{operations.find(([key]) => key === operation)[1]} selects {setText(result.selected)}.</p><p>Change one person's membership and watch that person move between the regions. Amber names satisfy the current selection rule.</p>
    <Choice label="Selection rule" value={operation} choices={operations} onChange={setOperation} />
    <BinaryBoard matrix={rosterNames.map((_, i) => [Boolean(training & 1 << i), Boolean(badges & 1 << i)])} rowLabels={rosterNames} columnLabels={['trained T', 'badged B']} label="Edit each person's two membership bits" onToggle={(r, c) => c === 0 ? setTraining(training ^ 1 << r) : setBadges(badges ^ 1 << r)} />
    <Actions onReset={() => { setTraining(3); setBadges(6); setOperation('intersection'); }}><button type="button" onClick={() => { setTraining(0); setBadges(0); }}>Make both sets empty</button><button type="button" onClick={() => { setTraining(15); setBadges(15); }}>Give everyone both</button></Actions></section>;
}
const argumentsByName = { converseError: [['implication', 'q'], 'p'], ponens: [['implication', 'p'], 'q'], tollens: [['implication', 'notQ'], 'notP'], contradiction: [['p', 'notP'], 'q'], equivalence: [['equivalence', 'p'], 'q'] };
export function TruthArgumentLab() {
  const [preset, setPreset] = useState('converseError'), [premises, setPremises] = useState(argumentsByName.converseError[0]), [conclusion, setConclusion] = useState('p');
  const result = inspectArgument(premises, conclusion);
  const choose = name => { setPreset(name); if (argumentsByName[name]) { setPremises(argumentsByName[name][0]); setConclusion(argumentsByName[name][1]); } };
  return <section data-live-exploration className="sets-logic-lab" aria-label="Argument truth worlds investigation">
    <div className="sets-logic-matrix-scroll" tabIndex={0} role="region" aria-label="Four truth assignments and their argument outcomes"><table className="sets-logic-board"><caption>Premises: {premises.length ? premises.map(n => propositionLabels[n]).join('; ') : 'none'}; conclusion: {propositionLabels[conclusion]}</caption><thead><tr><th>P</th><th>Q</th><th>all premises</th><th>conclusion</th><th>counterexample</th></tr></thead><tbody>{result.worlds.map((world, i) => <tr key={i} className={world.counterexample ? 'sets-counterexample-row' : world.admitted ? 'sets-admitted-row' : ''}><td>{Number(world.p)}</td><td>{Number(world.q)}</td><td>{Number(world.admitted)}</td><td>{Number(world.conclusion)}</td><td>{world.counterexample ? 'yes' : 'no'}</td></tr>)}</tbody></table></div>
    <p className="sets-logic-result" aria-live="polite">Consistent: {truth(result.consistent)}. Valid: {truth(result.valid)}. {result.counterexamples.length ? `Countermodel: P=${Number(result.counterexamples[0].p)}, Q=${Number(result.counterexamples[0].q)}.` : 'No admitted world has a false conclusion.'}</p><p>Amber rows satisfy every premise. Rose rows are admitted counterexamples. With no admitted rows, the premises are inconsistent and validity is vacuous.</p>
    <Choice label="Argument" value={preset} choices={[[ 'converseError', 'Converse error'], ['ponens', 'Modus ponens'], ['tollens', 'Modus tollens'], ['contradiction', 'Inconsistent premises'], ['equivalence', 'Equivalence'], ['custom', 'Edit premises and conclusion']]} onChange={choose} />
    <fieldset><legend>Include premises</legend><div className="sets-logic-actions">{['implication', 'p', 'q', 'notP', 'notQ', 'equivalence'].map(name => <button type="button" key={name} aria-pressed={premises.includes(name)} onClick={() => { setPreset('custom'); setPremises(premises.includes(name) ? premises.filter(n => n !== name) : [...premises, name]); }}>{propositionLabels[name]}</button>)}</div></fieldset>
    <Choice label="Conclusion" value={conclusion} choices={Object.entries(propositionLabels)} onChange={name => { setPreset('custom'); setConclusion(name); }} /><Actions onReset={() => choose('converseError')} />
  </section>;
}
const initialApproval = [[true, false, false], [false, true, false], [false, false, true]], jobs = ['Scan', 'Label', 'Audit'], people = ['Ada', 'Bo', 'Cam'];
export function QuantifierWitnessLab() {
  const [matrix, setMatrix] = useState(initialApproval.map(row => [...row])), [rows, setRows] = useState(3), [columns, setColumns] = useState(3), [mode, setMode] = useState('each');
  const result = inspectQuantifiers(matrix, rows, columns);
  const valid = { each: result.eachHasSomeone, common: result.someoneCoversAll, notEach: !result.eachHasSomeone, notCommon: !result.someoneCoversAll }[mode];
  const witness = mode === 'each' ? result.rowWitnesses.map((members, r) => `${jobs[r]}: ${members.length ? people[members[0]] : 'no witness'}`).join('; ')
    : mode === 'common' ? result.commonWitnesses.length ? `Common reviewers: ${result.commonWitnesses.map(i => people[i]).join(', ')}.` : 'No reviewer covers every displayed job.'
    : mode === 'notEach' ? result.rowFailures.length ? `Job with nobody: ${jobs[result.rowFailures[0]]}.` : 'No job lacks a reviewer.'
    : result.columns.map(c => `${people[c]}: ${result.columnFailures[c] === null ? 'misses no job' : `misses ${jobs[result.columnFailures[c]]}`}`).join('; ');
  const highlight = (r, c) => mode === 'each' ? result.rowWitnesses[r][0] === c : mode === 'common' ? result.commonWitnesses.includes(c) : mode === 'notEach' ? result.rowFailures[0] === r : result.columnFailures[c] === r;
  return <section data-live-exploration className="sets-logic-lab" aria-label="Quantifier witnesses investigation">
    <BinaryBoard matrix={matrix} rowLabels={jobs.slice(0, rows)} columnLabels={people.slice(0, columns)} label="Approved job-reviewer pairs; edit 1 or 0" onToggle={(r, c) => setMatrix(matrix.map((row, i) => i === r ? row.map((v, j) => j === c ? !v : v) : row))} highlight={highlight} />
    <p className="sets-logic-result" aria-live="polite">Claim: {truth(valid)}. {witness || 'No domain element supplies an obligation to check.'}</p>
    {(!rows || !columns) && <p>Jobs: {rows}; reviewers: {columns}. A universal check over no jobs has no counterexample; an existential reviewer claim still needs an actual reviewer.</p>}
    <Choice label="Claim to inspect" value={mode} choices={[[ 'each', 'Every job has someone'], ['common', 'Someone covers every job'], ['notEach', 'A job has nobody'], ['notCommon', 'Each reviewer misses a job']]} onChange={setMode} />
    <div className="sets-logic-controls"><Choice label="Jobs in domain" value={rows} choices={[0, 1, 2, 3].map(n => [n, n])} onChange={v => setRows(Number(v))} /><Choice label="Reviewers in domain" value={columns} choices={[0, 1, 2, 3].map(n => [n, n])} onChange={v => setColumns(Number(v))} /></div>
    <Actions onReset={() => { setMatrix(initialApproval.map(row => [...row])); setRows(3); setColumns(3); setMode('each'); }}><button type="button" onClick={() => setMatrix(matrix.map(row => row.map((v, c) => c === 1 ? true : v)))}>Approve Bo for every job</button><button type="button" onClick={() => setMatrix(initialApproval.map(row => row.map(() => false)))}>Clear approvals</button></Actions>
  </section>;
}
export function RelationPropertiesLab() {
  const [preset, setPreset] = useState('nearby'), [relation, setRelation] = useState(relationPreset('nearby')), [property, setProperty] = useState('transitive');
  const result = inspectRelation(relation.labels.length, relation.pairs);
  const choose = name => { setPreset(name); if (name !== 'custom') setRelation(relationPreset(name)); };
  const toggle = (a, b) => { setPreset('custom'); setRelation({ ...relation, pairs: result.matrix[a][b] ? relation.pairs.filter(([x, y]) => x !== a || y !== b) : [...relation.pairs, [a, b]] }); };
  const tuple = result.failures[property]?.map(i => relation.labels[i]);
  return <section data-live-exploration className="sets-logic-lab" aria-label="Relation property failing tuples investigation"><RelationFailureDrawing property={property} witness={result.failures[property]} labels={relation.labels} />
    <p className="sets-logic-result" aria-live="polite">{property}: {truth(result.properties[property])}. {tuple ? `Failing tuple: (${tuple.join(', ')}).` : 'Every required tuple passes in this finite domain.'} {property === 'antisymmetric' && tuple ? 'Distinct endpoints are related in both directions.' : ''}</p>
    <BinaryBoard matrix={result.matrix} rowLabels={relation.labels} columnLabels={relation.labels} onToggle={toggle} label="Relation pairs: row R column" />
    <Choice label="Property" value={property} choices={['reflexive', 'symmetric', 'transitive', 'antisymmetric'].map(n => [n, n])} onChange={setProperty} /><Choice label="Relation" value={preset} choices={[[ 'nearby', 'Distance at most one'], ['moduloThree', 'Same remainder modulo three'], ['identity', 'Equality'], ['custom', 'Edited pair board']]} onChange={choose} /><Actions onReset={() => { choose('nearby'); setProperty('transitive'); }} />
  </section>;
}
export function PartialOrderLab() {
  const [preset, setPreset] = useState('noLeast'), [removed, setRemoved] = useState([]);
  const universes = { noLeast: [2, 3, 6], divisors: [1, 2, 3, 6], changed: [4, 6, 12, 24] }, labels = universes[preset].filter(n => !removed.includes(n));
  const pairs = labels.flatMap((a, i) => labels.flatMap((b, j) => b % a === 0 ? [[i, j]] : [])), result = inspectRelation(labels.length, pairs);
  const names = indices => setText(indices.map(i => labels[i]));
  return <section data-live-exploration className="sets-logic-lab" aria-label="Divisibility partial order investigation">
    {labels.length ? <HasseDrawing result={result} labels={labels} /> : <p>The domain is empty: there are no vertices or cover edges.</p>}
    <p className="sets-logic-result" aria-live="polite">Minimal: {names(result.minimal)}; least: {names(result.least)}. Maximal: {names(result.maximal)}; greatest: {names(result.greatest)}.</p><p>Amber vertices are minimal. Each upward line is a cover, with no intermediate displayed divisor. Removing a vertex can create a new cover; self-pairs and transitive pairs still belong to the relation.</p>
    <Choice label="Divisibility domain" value={preset} choices={[[ 'noLeast', '2, 3, 6'], ['divisors', '1, 2, 3, 6'], ['changed', '4, 6, 12, 24']]} onChange={name => { setPreset(name); setRemoved([]); }} />
    <fieldset><legend>Include domain elements</legend><div className="sets-logic-actions">{universes[preset].map(n => <button type="button" key={n} aria-pressed={!removed.includes(n)} onClick={() => setRemoved(removed.includes(n) ? removed.filter(v => v !== n) : [...removed, n])}>{n}</button>)}</div></fieldset><Actions onReset={() => { setPreset('noLeast'); setRemoved([]); }} />
  </section>;
}
export function OddSquareLab() {
  const [size, setSize] = useState(3), result = oddSquareStep(size);
  return <section data-live-exploration className="sets-logic-lab" aria-label="Odd border square investigation"><SquareDrawing result={result} /><p className="sets-logic-result" aria-live="polite">{size}² + (2·{size} + 1) = ({size} + 1)². The amber border has {result.added} cells.</p><p>The new row and column share one corner, counted once. This illustrates the arbitrary-n algebra; a finite collection of pictures is not the induction proof.</p><Choice label="Old square side n" value={size} choices={Array.from({ length: 8 }, (_, n) => [n, n])} onChange={v => setSize(Number(v))} /><Actions onReset={() => setSize(3)} /></section>;
}
const initialDiagonal = [[true, false, true, false], [true, false, false, false], [false, true, true, true], [true, true, false, false]];
export function DiagonalSubsetLab() {
  const [matrix, setMatrix] = useState(initialDiagonal.map(row => [...row])), [row, setRow] = useState(0), result = diagonalSubset(matrix), difference = result.differences[row];
  return <section data-live-exploration className="sets-logic-lab" aria-label="Diagonal subset investigation">
    <BinaryBoard matrix={matrix} rowLabels={['f(0)', 'f(1)', 'f(2)', 'f(3)']} columnLabels={['0', '1', '2', '3']} label="Proposed rows: edit membership bits" highlight={(r, c) => r === c} onToggle={(r, c) => setMatrix(matrix.map((values, i) => i === r ? values.map((v, j) => j === c ? !v : v) : values))} />
    <BinaryBoard matrix={[result.subset]} rowLabels={['D']} columnLabels={['0', '1', '2', '3']} label="D: derived opposite diagonal" highlight={(_, c) => c === row} />
    <p className="sets-logic-result" aria-live="polite">D = {setText(result.members)}. At element {row}: f({row}) has {Number(difference.proposed)}, D has {Number(difference.constructed)}. These are always opposite.</p><p>The amber diagonal picks one membership from each proposed row. D reverses those choices. Changing a diagonal entry rebuilds D immediately; changing another entry leaves D unchanged.</p>
    <Choice label="Proposed row to compare" value={row} choices={[0, 1, 2, 3].map(n => [n, `f(${n})`])} onChange={v => setRow(Number(v))} /><Actions onReset={() => { setMatrix(initialDiagonal.map(values => [...values])); setRow(0); }} />
  </section>;
}
