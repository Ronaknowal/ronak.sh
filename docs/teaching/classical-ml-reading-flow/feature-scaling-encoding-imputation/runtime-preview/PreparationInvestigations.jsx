import React, { useId, useState } from 'react';
import { Cells, Matrix, Plot } from './Drawing.jsx';
import { points, donorFixture, targetFixture, sensitivity, completionTables, doubleDivisors, translateCases } from './preparation-models.mjs';
import { saved, observations } from './saved-data.js';
import { DistanceView, RulerView, CategoryView, DonorView, SmallPreparationView, RealPreparationView } from './CoreFigures.jsx';
import { PowerView, QuantileView, CycleView, SmoothingView, CrossFitView, HashView, ConditionalView, PoolView } from './DeeperFigures.jsx';
export function Select({
  label,
  value,
  onChange,
  options
}) {
  const id = useId();
  return <label className="prep-control" htmlFor={id}>{label}<select id={id} value={value} onChange={event => onChange(event.target.value)}>{options.map(option => {
        const row = Array.isArray(option) ? option : [option, option];
        return <option key={row[0]} value={row[0]}>{row[1]}</option>;
      })}</select></label>;
}
export function Text({
  label,
  value,
  onChange,
  numeric = false,
  error
}) {
  const id = useId(),
    errorId = `${id}-error`;
  return <label className="prep-control" htmlFor={id}>{label}<input id={id} type="text" inputMode={numeric ? 'decimal' : undefined} value={value} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} onChange={event => onChange(event.target.value)} />{error ? <span id={errorId} className="prep-error">{error}</span> : null}</label>;
}
export function NumberEditor({
  label,
  value,
  onChange,
  minimum,
  maximum,
  step = .1,
  nullable = false,
  blankMeaning = 'missing'
}) {
  const number = value.trim() === '' ? null : Number(value);
  const error = number === null ? nullable ? '' : 'Enter a finite number.' : !Number.isFinite(number) || number < minimum || number > maximum ? `Enter a number from${minimum} to${maximum}.` : '';
  const id = useId();
  return <div className="prep-control"><Text label={`${label}${nullable ? ` (blank = ${blankMeaning})` : ''}`} value={value} onChange={onChange} numeric error={error} />{number !== null && !error ? <><label htmlFor={id}>{label} slider</label><input id={id} type="range" min={minimum} max={maximum} step={step} value={number} onChange={event => onChange(event.target.value)} /></> : null}</div>;
}
export function parseDraft(value, minimum, maximum, nullable = false, integer = false) {
  if (value.trim() === '' && nullable) return null;
  if (value.trim() === '') throw Error('Enter a finite number; a blank draft is not zero.');
  const result = Number(value);
  if (!Number.isFinite(result) || result < minimum || result > maximum || integer && !Number.isInteger(result)) throw Error(`Enter${integer ? ' an integer' : ' a finite value'} from${minimum} to${maximum}.`);
  return result;
}
export function Current({
  calculate,
  children
}) {
  let value;
  try {
    value = calculate();
  } catch (error) {
    return <p role="status" className="prep-error">Current draft has no result: {error.message}</p>;
  }
  return <div className="prep-current" data-current-result="">{children(value)}</div>;
}
class ModelBoundary extends React.Component {
  state = {
    error: null
  };
  static getDerivedStateFromError(error) {
    return {
      error
    };
  }
  render() {
    return this.state.error ? <p role="status" className="prep-error">Current inputs are refused: {this.state.error.message}</p> : this.props.children;
  }
}
export function SafeModel({
  identity,
  children
}) {
  return <ModelBoundary key={identity}>{children}</ModelBoundary>;
}
function Divisors() {
  const [bill, setBill] = useState('1'),
    [mass, setMass] = useState('100');
  const [actionError, setActionError] = useState('');
  function doubleBoth() {
    try {
      const [nextBill, nextMass] = doubleDivisors([parseDraft(bill, .1, 10), parseDraft(mass, 1, 500)]);
      setBill(String(nextBill));
      setMass(String(nextMass));
      setActionError('');
    } catch (error) {
      setActionError(error.message);
    }
  }
  return <><Current calculate={() => [parseDraft(bill, .1, 10), parseDraft(mass, 1, 500)]}>{values => <DistanceView divisors={values} />}</Current><div className="prep-controls"><NumberEditor label="Bill divisor" minimum={.1} maximum={10} value={bill} onChange={value => {
        setBill(value);
        setActionError('');
      }} /><NumberEditor label="Mass divisor" minimum={1} maximum={500} step={1} value={mass} onChange={value => {
        setMass(value);
        setActionError('');
      }} /><button type="button" onClick={doubleBoth}>Double both divisors</button></div>{actionError ? <p className="prep-error" role="status">{actionError}</p> : null}<p className="prep-live">Mass divisor1 restores the raw ranking. Common rescaling changes lengths while preserving ranking.</p></>;
}
function PointEdit() {
  const [selected, setSelected] = useState('A');
  const [drafts, setDrafts] = useState(Object.fromEntries(Object.entries(points).map(([key, row]) => [key, row.map(String)])));
  const [actionError, setActionError] = useState('');
  function translateAll() {
    try {
      const data = Object.fromEntries(Object.entries(drafts).map(([key, row]) => [key, [parseDraft(row[0], 0, 100), parseDraft(row[1], 0, 10000)]]));
      setDrafts(Object.fromEntries(Object.entries(translateCases(data)).map(([key, row]) => [key, row.map(String)])));
      setActionError('');
    } catch (error) {
      setActionError(error.message);
    }
  }
  const update = (j, value) => {
    setActionError('');
    setDrafts(old => ({
      ...old,
      [selected]: old[selected].map((entry, i) => i === j ? value : entry)
    }));
  };
  return <><Current calculate={() => Object.fromEntries(Object.entries(drafts).map(([key, row]) => [key, [parseDraft(row[0], 0, 100), parseDraft(row[1], 0, 10000)]]))}>{data => <DistanceView data={data} />}</Current><div className="prep-controls"><Select label="Actual case to edit" value={selected} onChange={setSelected} options={['Q', 'A', 'B']} /><NumberEditor label={`${selected} bill mm`} value={drafts[selected][0]} onChange={value => update(0, value)} minimum={0} maximum={100} /><NumberEditor label={`${selected} mass g`} value={drafts[selected][1]} onChange={value => update(1, value)} minimum={0} maximum={10000} step={1} /><button type="button" onClick={translateAll}>Translate all: +1 mm, +10 g</button></div>{actionError ? <p className="prep-error" role="status">{actionError}</p> : null}<p className="prep-live">Try A mass4400, or make A equal Q. Divisors remain1/100; circles use current values.</p></>;
}
function RulerEdit() {
  const [last, setLast] = useState('100'),
    [query, setQuery] = useState('150'),
    [kind, setKind] = useState('robust');
  return <><Current calculate={() => [parseDraft(last, 0, 1000), parseDraft(query, 0, 1500)]}>{values => <RulerView training={[1, 2, 3, 4, values[0]]} query={values[1]} selected={kind} />}</Current><div className="prep-controls"><NumberEditor label="Last training value" minimum={0} maximum={1000} step={1} value={last} onChange={setLast} /><Select label="Fitted ruler" value={kind} onChange={setKind} options={['standard', 'minmax', 'robust', 'maxabs']} /><NumberEditor label="Later query" minimum={0} maximum={1500} step={1} value={query} onChange={setQuery} /></div><p className="prep-live">Training edits change saved statistics; query edits change only its output. Here100→1000 retains the central median/IQR3/2.</p></>;
}
function CategoryEdit() {
  const [query, setQuery] = useState('new'),
    [policy, setPolicy] = useState('infrequent'),
    [minimum, setMinimum] = useState('2');
  return <><Current calculate={() => parseDraft(minimum, 1, 8, false, true)}>{count => <SafeModel identity={`${query}|${policy}|${count}`}><CategoryView query={query === 'None' ? null : query} minimum={count} policy={policy} /></SafeModel>}</Current><div className="prep-controls"><Text label="Query label (None = missing)" value={query} onChange={setQuery} /><Select label="Unknown policy" value={policy} onChange={setPolicy} options={[['infrequent', 'Infrequent if present'], ['zero', 'All-zero'], ['error', 'Error']]} /><NumberEditor label="Minimum count" minimum={1} maximum={8} step={1} value={minimum} onChange={setMinimum} /></div><p className="prep-live">Compare a, b, None and new. The query does not update training counts.</p></>;
}
function DonorEdit() {
  const [drafts, setDrafts] = useState(donorFixture.map(row => row.map(value => value === null ? '' : String(value))));
  const [selected, setSelected] = useState('2,2'),
    [count, setCount] = useState('2');
  const [i, j] = selected.split(',').map(Number);
  const options = drafts.flatMap((row, r) => row.map((_value, c) => [`${r},${c}`, `${r === 0 ? 'Q' : `D${r}`} ${['a', 'b', 'target c'][c]}`]).filter((_entry, c) => r !== 0 || c !== 2));
  return <><Current calculate={() => ({
      table: drafts.map(row => row.map(value => parseDraft(value, -10000, 10000, true))),
      k: parseDraft(count, 1, 3, false, true)
    })}>{state => <SafeModel identity={JSON.stringify(state)}><DonorView table={state.table} k={state.k} /></SafeModel>}</Current><div className="prep-controls"><Select label="Query or donor cell" value={selected} onChange={setSelected} options={options} /><NumberEditor label="Selected cell" minimum={-10000} maximum={10000} step={1} nullable value={drafts[i][j]} onChange={value => setDrafts(old => old.map((row, r) => r === i ? row.map((entry, c) => c === j ? value : entry) : row))} /><NumberEditor label="Target-eligible neighbours k" minimum={1} maximum={3} step={1} value={count} onChange={setCount} /></div><p className="prep-live">Blank D2 target to remove eligibility. D1 target140 gives220. An unused D3 target change leaves the two-donor estimate unchanged.</p></>;
}
function SmallQueryEdit() {
  const [drafts, setDrafts] = useState(['30', '', '9']),
    [selected, setSelected] = useState('2');
  const j = Number(selected);
  return <><Current calculate={() => drafts.map(value => parseDraft(value, -10000, 10000, true))}>{row => <SmallPreparationView row={row} label="a" />}</Current><div className="prep-controls"><Select label="Numeric query cell" value={selected} onChange={setSelected} options={['0', '1', '2']} /><NumberEditor label="Query value" minimum={-10000} maximum={10000} step={1} nullable value={drafts[j]} onChange={value => setDrafts(old => old.map((entry, i) => i === j ? value : entry))} /></div><p className="prep-live">Category stays a. Third coordinate9 maps to2; fit arrays remain pinned.</p></>;
}
function RealQueryEdit() {
  const [source, setSource] = useState('309'),
    [feature, setFeature] = useState('body_mass_g'),
    [value, setValue] = useState('4100');
  const fields = ['bill_length_mm', 'bill_depth_mm', 'flipper_length_mm', 'body_mass_g', 'sex'];
  function choose(nextSource, nextFeature) {
    setSource(nextSource);
    setFeature(nextFeature);
    setValue(observations[Number(nextSource)][nextFeature]?.toString() ?? '');
  }
  return <><Current calculate={() => feature === 'sex' ? value === 'None' || value === '' ? null : value : parseDraft(value, 0, 1000000, true)}>{altered => <><RealPreparationView source={Number(source)} /><RealPreparationView source={Number(source)} feature={feature} altered={altered} /></>}</Current><div className="prep-controls"><Select label="Held-out source row" value={source} onChange={next => choose(next, feature)} options={saved.scaled_inspection.test_source_rows.map(row => [String(row), `${row} · ${observations[row].species}`])} /><Select label="Feature in altered copy" value={feature} onChange={next => choose(source, next)} options={fields} />{feature === 'sex' ? <Text label="Sex label (None/blank = missing)" value={value} onChange={setValue} /> : <NumberEditor label="Altered measurement" minimum={0} maximum={1000000} step={1} nullable value={value} onChange={setValue} />}</div><p className="prep-live">Queries cannot change fitted arrays, historical predictions or accuracy. Negative measurements are refused in this inspection domain.</p></>;
}
function PowerEdit() {
  const [method, setMethod] = useState('YJ'),
    [x, setX] = useState('-3'),
    [lambda, setLambda] = useState('2');
  return <><Current calculate={() => ({
      x: parseDraft(x, -10, 30),
      lambda: parseDraft(lambda, -3, 3)
    })}>{state => <SafeModel identity={`${method}${JSON.stringify(state)}`}><PowerView method={method} {...state} /></SafeModel>}</Current><div className="prep-controls"><Select label="Power method" value={method} onChange={setMethod} options={[['YJ', 'Yeo–Johnson'], ['BC', 'Box–Cox']]} /><NumberEditor label="Input x" minimum={-10} maximum={30} value={x} onChange={setX} /><NumberEditor label="Manual lambda" minimum={-3} maximum={3} step={.01} value={lambda} onChange={setLambda} /></div><p className="prep-live">This lambda is manually edited. Saved learned P7 lambdas appear separately in D26. Try the negative logarithmic boundaryλ2 or identityλ1.</p></>;
}
function QuantileEdit() {
  const [x, setX] = useState('3'),
    [output, setOutput] = useState('uniform');
  return <><Current calculate={() => parseDraft(x, -10, 1000)}>{value => <QuantileView x={value} output={output} />}</Current><div className="prep-controls"><NumberEditor label="Later query" minimum={-10} maximum={1000} step={1} value={x} onChange={setX} /><Select label="Output coordinate" value={output} onChange={setOutput} options={['uniform', 'normal']} /></div><p className="prep-live">Landmarks stay fixed. Try2 for its tie midpoint,3 for interpolation and1000 for saturation. Custom constant c→.5 differs from ordinary c→0.</p></>;
}
function CycleEdit() {
  const [first, setFirst] = useState('350'),
    [second, setSecond] = useState('10');
  return <><Current calculate={() => [parseDraft(first, 0, 360), parseDraft(second, 0, 360)]}>{values => <CycleView first={values[0]} second={values[1]} />}</Current><div className="prep-controls"><NumberEditor label="Angle A degrees" minimum={0} maximum={360} step={1} value={first} onChange={setFirst} /><NumberEditor label="Angle B degrees" minimum={0} maximum={360} step={1} value={second} onChange={setSecond} /></div><p className="prep-live">Compare0/360,1/359 and30/150. The last pair shares sine but differs in cosine.</p></>;
}
function SmoothingEdit() {
  const [support, setSupport] = useState('1'),
    [alpha, setAlpha] = useState('2');
  return <><Current calculate={() => parseDraft(alpha, 0, 100)}>{value => <SmoothingView count={Number(support)} alpha={value} />}</Current><div className="prep-controls"><Select label="Positive category support" value={support} onChange={setSupport} options={[['1', 'Singleton'], ['100', '100 positives'], ['0', 'Absent category']]} /><NumberEditor label="Smoothing alpha" minimum={0} maximum={100} step={1} value={alpha} onChange={setAlpha} /></div><p className="prep-live">α0 keeps a supported category mean; absent categories retain the prior fallback. Exclusion is separate.</p></>;
}
function TargetEdit() {
  const initial = targetFixture.categories.map((label, i) => [label, String(targetFixture.targets[i]), String(targetFixture.folds[i])]);
  const [drafts, setDrafts] = useState(initial),
    [selected, setSelected] = useState('3,1'),
    [inspected, setInspected] = useState('0');
  const [i, j] = selected.split(',').map(Number);
  return <><Current calculate={() => ({
      categories: drafts.map(row => row[0]),
      targets: drafts.map(row => parseDraft(row[1], 0, 1, false, true)),
      folds: drafts.map(row => parseDraft(row[2], 0, 1, false, true))
    })}>{fixture => <SafeModel identity={JSON.stringify(fixture)}><CrossFitView fixture={fixture} selected={Number(inspected)} /></SafeModel>}</Current><div className="prep-controls"><Select label="Category, target or fold cell" value={selected} onChange={setSelected} options={drafts.flatMap((row, r) => row.map((_entry, c) => [`${r},${c}`, `row${r} ${['category', 'target', 'fold'][c]}`]))} /><Text label={`Selected ${['category', '0/1 target', '0/1 fold'][j]}`} numeric={j !== 0} value={drafts[i][j]} onChange={value => setDrafts(old => old.map((row, r) => r === i ? row.map((entry, c) => c === j ? value : entry) : row))} /><Select label="Inspected encoded row" value={inspected} onChange={setInspected} options={['0', '1', '2', '3', '4', '5']} /></div><p className="prep-live">Flip row3 target0→1: row0 becomes7/9 through its prior; row3's own4/9 stays fixed. Changing row0's own target leaves row0 unchanged.</p></>;
}
function HashEdit() {
  const [selected, setSelected] = useState('1'),
    [counts, setCounts] = useState(['3', '1', '2']),
    [mapping, setMapping] = useState(['0,1', '0,-1', '1,1']);
  const i = Number(selected);
  return <><Current calculate={() => counts.map(value => parseDraft(value, 0, 10, false, true))}>{values => <HashView counts={values} buckets={mapping.map(value => Number(value.split(',')[0]))} signs={mapping.map(value => Number(value.split(',')[1]))} />}</Current><div className="prep-controls"><Select label="Token" value={selected} onChange={setSelected} options={[['0', 'apple'], ['1', 'pear'], ['2', 'banana']]} /><NumberEditor label="Token count" minimum={0} maximum={10} step={1} value={counts[i]} onChange={value => setCounts(old => old.map((entry, j) => j === i ? value : entry))} /><Select label="Declared bucket and sign" value={mapping[i]} onChange={value => setMapping(old => old.map((entry, j) => j === i ? value : entry))} options={[['0,1', 'bucket0 sign+'], ['0,-1', 'bucket0 sign−'], ['1,1', 'bucket1 sign+'], ['1,-1', 'bucket1 sign−']]} /></div><p className="prep-live">This is the constructed map, separate from FeatureHasher. A zero-count token contributes nothing even if its map changes.</p></>;
}
function IterativeEdit() {
  const [selected, setSelected] = useState('3,0'),
    [drafts, setDrafts] = useState({
      '3,0': '',
      '2,1': ''
    }),
    [turn, setTurn] = useState('0');
  return <><Current calculate={() => ({
      '3,0': parseDraft(drafts['3,0'], -20, 20, true),
      '2,1': parseDraft(drafts['2,1'], -20, 20, true)
    })}>{initialOverrides => <ConditionalView turn={Number(turn)} initialOverrides={initialOverrides} />}</Current><div className="prep-controls"><Select label="Original missing cell initialization" value={selected} onChange={setSelected} options={[['3,0', 'row3 a'], ['2,1', 'row2 b']]} /><NumberEditor label="Initial estimate" blankMeaning="median" minimum={-20} maximum={20} step={.1} nullable value={drafts[selected]} onChange={value => setDrafts(old => ({
        ...old,
        [selected]: value
      }))} /><Select label="Conditional turn" value={turn} onChange={setTurn} options={Array.from({
        length: 7
      }, (_, i) => [String(i), i ? `turn${i}` : 'median/edited initialization'])} /></div><p className="prep-live">Only original gaps accept initial estimates; observations and response rows stay fixed. Steps0…6 expose feedback. The three-sweep cap does not assert convergence.</p></>;
}
function PoolEdit() {
  const [selected, setSelected] = useState('Q,0'),
    [estimates, setEstimates] = useState(['9', '10', '11']),
    [variances, setVariances] = useState(['4', '4', '4']);
  const [kind, index] = selected.split(','),
    i = Number(index),
    values = kind === 'Q' ? estimates : variances;
  return <><Current calculate={() => ({
      estimates: estimates.map(value => parseDraft(value, -100, 100)),
      variances: variances.map(value => parseDraft(value, 0, 100))
    })}>{state => <PoolView {...state} />}</Current><div className="prep-controls"><Select label="Analysis estimate or variance" value={selected} onChange={setSelected} options={['Q', 'U'].flatMap(name => [0, 1, 2].map(j => [`${name},${j}`, `${name}${j + 1}`]))} /><NumberEditor label={kind === 'Q' ? 'Estimate Q' : 'Variance U (squared units)'} minimum={kind === 'Q' ? -100 : 0} maximum={100} step={.1} value={values[i]} onChange={value => (kind === 'Q' ? setEstimates : setVariances)(old => old.map((entry, j) => j === i ? value : entry))} /></div><p className="prep-live">Q edits can change between variance; U edits change within variance. Identical Q makes between variance zero. The pooling contract refuses m1 or negative U.</p></>;
}
function SensitivityEdit() {
  const [delta, setDelta] = useState('0');
  return <><Current calculate={() => parseDraft(delta, -2, 2)}>{value => <><Matrix columns={['baseline completion1', 'shifted completion1', 'original missing M']} values={completionTables[0].map((entry, i) => [entry, entry + ([2, 4].includes(i) ? value : 0), Number([2, 4].includes(i))])} missing={completionTables[0].map((_entry, i) => [[2, 4].includes(i), [2, 4].includes(i), false])} label="First of five retained baseline draws, rounded; only original gaps shift by δ" /><Plot label="Fixed normal-model draws under an assumed missing-cell shift" xDomain={[-2, 2]} yDomain={[7.5, 10]} xLabel="assumed delta" yLabel="pooled mean" paths={[{
          values: [[-2, sensitivity(-2)], [2, sensitivity(2)]]
        }]} points={[{
          x: value,
          y: sensitivity(value),
          id: 'current'
        }]} /><Cells names={['assumed delta', 'pooled mean', 'no-missing contrast']} values={[value, sensitivity(value), 'unchanged with no missing cells']} /></>}</Current><div className="prep-controls"><NumberEditor label="Assumed missing-cell delta" minimum={-2} maximum={2} step={.1} value={delta} onChange={setDelta} /></div><p className="prep-live">Seed20, five draws and the prior stay fixed. Baseline8.686461347735442+.4δ is not a confidence interval or an estimated MNAR mechanism.</p></>;
}
const implementations = {
  L1: Divisors,
  L2: PointEdit,
  L3: RulerEdit,
  L4: CategoryEdit,
  L5: DonorEdit,
  L6: SmallQueryEdit,
  L7: RealQueryEdit,
  L8: PowerEdit,
  L9: QuantileEdit,
  L10: CycleEdit,
  L11a: SmoothingEdit,
  L11b: TargetEdit,
  L12: HashEdit,
  L13: IterativeEdit,
  L14a: PoolEdit,
  L14b: SensitivityEdit
};
export function PreparationInvestigation({
  id
}) {
  const [epoch, setEpoch] = useState(0),
    Implementation = implementations[id];
  if (!Implementation) throw Error(`Unknown investigation ${id}`);
  return <section className="prep-investigation" data-investigation-id={id} aria-label={`${id} live investigation`}><Implementation key={epoch} /><div className="prep-controls"><button type="button" onClick={() => setEpoch(value => value + 1)} aria-label={`Reset ${id} values, drafts, selection and trace`}>Reset investigation</button></div></section>;
}
