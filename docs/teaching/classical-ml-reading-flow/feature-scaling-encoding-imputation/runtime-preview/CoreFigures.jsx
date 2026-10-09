import React from 'react';
import { Figure, Table, Matrix, Cells, Plot, NumberLine, Bars, fmt, ink } from './Drawing.jsx';
import { points, distance, ruler, applyRuler, category, donorFixture, donors, smallFit, prepare } from './preparation-models.mjs';
import { saved, observations } from './saved-data.js';
const numericNames = ['bill mm', 'depth mm', 'flipper mm', 'mass g'];
export function DistanceView({
  data = points,
  divisors = [1, 100],
  raw = false
}) {
  const comparisons = ['A', 'B'].map(id => ({
    id,
    color: ink[id],
    ...distance(data.Q, data[id], divisors)
  }));
  const radius = Math.max(1, ...comparisons.map(row => row.length)) * 1.12;
  return <div>
    {raw ? <Plot label="Recorded bill length and body mass; axes carry different physical units" xDomain={[Math.min(...Object.values(data).map(row => row[0])) - 1, Math.max(...Object.values(data).map(row => row[0])) + 1]} yDomain={[Math.min(...Object.values(data).map(row => row[1])) - 20, Math.max(...Object.values(data).map(row => row[1])) + 20]} xLabel="bill length (mm)" yLabel="body mass (g)" points={Object.entries(data).map(([id, row]) => ({
      id,
      x: row[0],
      y: row[1],
      color: ink[id] || ink.query
    }))} /> : null}
    <Plot label="Query-centred transformed displacement triangles and full true-radius circles" equal xDomain={[-radius, radius]} yDomain={[-radius, radius]} xLabel="Δ bill / bill divisor" yLabel="Δ mass / mass divisor" circles={comparisons.map(row => ({
      radius: row.length,
      color: row.color
    }))} paths={comparisons.flatMap(row => [{
      values: [[0, 0], [row.delta[0], 0], row.delta],
      color: row.color
    }, {
      values: [[0, 0], row.delta],
      color: row.color,
      arrow: true
    }])} points={[{
      id: 'Q',
      x: 0,
      y: 0
    }, ...comparisons.map(row => ({
      id: row.id,
      x: row.delta[0],
      y: row.delta[1],
      color: row.color,
      dy: row.id === 'B' ? 22 : -10
    }))]} />
    <Bars label="Squared coordinate contributions on one common zero-based scale" rows={comparisons.flatMap(row => row.contributions.map((value, j) => ({
      name: `${row.id} · ${j ? 'mass' : 'bill'} squared contribution`,
      value,
      color: row.color
    })))} />
    <Table caption="Unrounded contributions determine the ranking; displayed values are rounded" headers={['Point', 'Δ bill / a', 'Δ mass / b', 'bill²', 'mass²', 'sum d²', 'length d']} rows={comparisons.map(row => [row.id, ...row.delta, ...row.contributions, row.squared, row.length])} />
  </div>;
}
export function RulerView({
  training = [1, 2, 3, 4, 100],
  query = 150,
  selected
}) {
  const kinds = selected ? [selected] : ['standard', 'minmax', 'robust', 'maxabs'];
  const standard = ruler(training, 'standard');
  return <div>
    <NumberLine values={training} marks={[{
      id: 'query',
      value: query
    }]} label="Original values · full extent" />
    <NumberLine values={training.filter(value => value >= 1 && value <= 4)} min={.5} max={4.5} label="Zoom into central observations1–4; extreme values omitted only in this zoom" />
    {!selected || selected === 'standard' ? <><Plot label="Each observed value contributes a deviation from the fitted mean" xDomain={[Math.min(...training) - 1, Math.max(...training) + 1]} yDomain={[-.5, training.length - .5]} xLabel="training value and fitted mean" yLabel="training row index" paths={[...training.map((value, i) => ({
        values: [[value, i], [standard.center, i]],
        color: ink.A
      })), {
        values: [[standard.center, -.5], [standard.center, training.length - .5]],
        color: ink.query,
        dashed: true
      }]} points={training.map((value, i) => ({
        x: value,
        y: i
      }))} /><Table caption="Population spread reduction, divided by n" headers={['training value', 'value−mean', 'squared deviation']} rows={[...training.map(value => [value, value - standard.center, (value - standard.center) ** 2]), ['variance', '', standard.measured ** 2], ['standard deviation', '', standard.measured]]} /></> : null}
    <div className="prep-columns">{kinds.map(kind => {
        const fit = ruler(training, kind),
          outputs = training.map(value => applyRuler(fit, value));
        return <div key={kind}><NumberLine values={outputs} marks={[{
            id: 'query',
            value: applyRuler(fit, query)
          }]} label={`${kind} · output full extent`} /><Table caption={`${kind} fitted state`} headers={['center', 'measured spread', 'stored divisor', 'query coordinate']} rows={[[fit.center, fit.measured, fit.scale, applyRuler(fit, query)]]} /></div>;
      })}</div>
    <Table caption="Original values and all fitted coordinates" headers={['value', ...kinds]} rows={[...training, query].map(value => [value, ...kinds.map(kind => applyRuler(ruler(training, kind), value))])} />
  </div>;
}
export function CategoryView({
  query = 'new',
  minimum = 2,
  policy = 'infrequent'
}) {
  const state = category(query, minimum, policy);
  return <div><Table caption="Counts are learned from training only" headers={['label', 'training count', 'state']} rows={[['a', 4, 4 >= minimum ? 'frequent' : 'rare'], ['b', 1, 1 >= minimum ? 'frequent' : 'rare'], ['None', 1, 'reserved missing']]} />
    <Cells label="Exact output positions" names={state.vocabulary} values={state.vector} />
    <p>Input {query === null ? 'None (missing)' : JSON.stringify(query)} → {state.token ?? 'all-zero unknown'}; rare bucket {state.hasRare ? 'exists' : 'does not exist'}.</p>
  </div>;
}
export function DonorView({
  table = donorFixture,
  k = 2,
  stage = 'all'
}) {
  const state = donors(table, k);
  return <div><Matrix label="Complete original query and donor cells" columns={['a', 'b', 'target c']} rowLabels={['Q', 'D1', 'D2', 'D3']} values={table} highlightRows={[0]} />
    {stage === 'overlap' ? <div className="prep-columns">{state.scored.map(row => <div key={row.id} className="prep-operation"><p>Q compared with {row.id}: connectors exist only for both-observed coordinates.</p><svg viewBox="0 0 440 170" role="img" aria-label={`${row.id} overlap coordinates${row.overlap.join(',') || 'none'}`}>
      {['a', 'b', 'target c'].map((name, j) => <g key={name}><text x={75 + j * 145} y="20" textAnchor="middle">{name}</text><circle cx={75 + j * 145} cy="50" r="8" fill={table[0][j] === null ? 'none' : ink.query} stroke={ink.query} /><circle cx={75 + j * 145} cy="120" r="8" fill={row.row[j] === null ? 'none' : ink.A} stroke={ink.A} />{row.overlap.includes(j) ? <line x1={75 + j * 145} x2={75 + j * 145} y1="60" y2="110" stroke={ink.B} strokeWidth="2" /> : null}<text x={75 + j * 145} y="155" textAnchor="middle">{fmt(table[0][j])} / {fmt(row.row[j])}</text></g>)}
    </svg></div>)}</div> : null}
    <Table caption="Common observed coordinates are chosen before target-specific eligibility" headers={['donor', 'overlap coordinates', 'q', 'square differences', 'sum', 'p/q', 'd²', 'distance', 'target observed']} rows={state.scored.map(row => [row.id, row.overlap.map(i => ['a', 'b', 'c'][i]).join(', ') || 'none', row.overlap.length, row.squares.map(value => fmt(value)).join(' + ') || 'undefined', row.overlap.length ? row.squares.reduce((a, b) => a + b, 0) : 'undefined', row.overlap.length ? 3 / row.overlap.length : 'undefined', row.squared, row.length, row.eligible ? 'yes' : 'no'])} />
    {stage !== 'overlap' ? <NumberLine values={state.scored.filter(row => row.length !== null).map(row => row.length)} label="Actual distance d (not squared distance)" /> : null}
    {stage === 'all' ? <><Cells label="Selected target cells" names={state.chosen.map(row => `${row.id} · weight1/${state.chosen.length}`)} values={state.chosen.map(row => row.row[2])} /><div className="prep-flow-arrow" aria-hidden="true">↓</div><Cells names={[state.fallback ? 'observed-target mean fallback' : 'equal-weight target estimate']} values={[state.value]} /><p>{state.fallback ? 'No target-eligible overlap exists; all observed target cells support the fallback.' : `Selected ${state.chosen.map(row => row.id).join(', ')} from the target-eligible sorted distances.`} Observed cells remain unchanged.</p></> : null}
  </div>;
}
export function SmallPreparationView({
  row = [30, null, 9],
  label = 'b'
}) {
  const result = prepare(row, label);
  return <div><div className="prep-columns"><div><Cells label="Numeric input" names={['numeric0', 'numeric1', 'numeric2']} values={row} /><div className="prep-flow-arrow">↓ median fill</div><Cells names={['filled0', 'filled1', 'filled2']} values={result.filled} mask={result.mask} /><div className="prep-flow-arrow">↓ saved centre and divisor</div><Cells names={['scaled0', 'scaled1', 'scaled2']} values={result.numeric} mask={result.mask} /></div><div><Cells names={['category input']} values={[label ?? 'None']} /><div className="prep-flow-arrow">↓ saved vocabulary</div><Cells names={smallFit.vocabulary} values={result.encoded} /></div></div><div className="prep-flow-arrow">↓ concatenate numeric then category</div><Cells label="Full six-coordinate P1 output" names={['n0', 'n1', 'n2', 'a', 'b', 'not_recorded']} values={result.output} mask={[...result.mask, false, false, false]} /><Table caption="Pinned P1 fitted arrays; query edits cannot refit them" headers={['array', 'entries']} rows={Object.entries(smallFit).map(([name, values]) => [name, values.map(value => fmt(value, 9)).join(', ')])} /></div>;
}
export function RealPreparationView({
  source = 309,
  altered,
  feature = 'body_mass_g'
}) {
  const record = observations[source],
    names = ['bill_length_mm', 'bill_depth_mm', 'flipper_length_mm', 'body_mass_g'];
  const state = {
    medians: saved.scaled_inspection.train_medians,
    means: saved.scaled_inspection.mean,
    scales: saved.scaled_inspection.scale,
    vocabulary: ['female', 'male', 'not_recorded']
  };
  const values = names.map(name => name === feature && altered !== undefined ? altered : record[name]);
  const label = feature === 'sex' && altered !== undefined ? altered : record.sex;
  const result = prepare(values, label, state);
  return <div><p>Source row {source}; observed target <strong>{record.species}</strong> is separate from these inputs. {altered !== undefined ? 'This is an altered inspection copy; no new model prediction or accuracy is calculated.' : 'Original recorded row under the retained fitted preparation.'}</p>
    <Table caption="One coordinate at a time through the saved fit" headers={['feature', 'input', 'median', 'filled', 'mean', 'divisor', 'coordinate']} rows={names.map((name, i) => [name, values[i], state.medians[i], result.filled[i], state.means[i], state.scales[i], result.numeric[i]])} />
    <Cells label="Seven output coordinates, fixed numeric then category order" names={[...numericNames, ...state.vocabulary]} values={result.output} mask={[...result.mask, false, false, false]} />
  </div>;
}
export function CoreFigure({
  id
}) {
  let body, caption;
  switch (id) {
    case 'D01':
      caption = 'A recorded observation, its five input fields and separate target. Row position is not a model feature.';
      body = <><Matrix label="X feature block: n rows ×5 input fields" columns={[...numericNames, 'recorded sex']} rowLabels={['309']} values={[[51, 18.8, 203, 4100, 'male']]} highlightRows={[0]} /><Matrix label="y target block: n rows ×1 label" columns={['target species']} rowLabels={['309']} values={[['Chinstrap']]} /></>;
      break;
    case 'D02':
      caption = 'The observed row and an explicitly altered copy retain different recording histories.';
      body = <><Matrix label="Input rows before learned arithmetic" columns={[...numericNames, 'sex']} rowLabels={['observed309', 'altered copy']} values={[[51, 18.8, 203, 4100, 'male'], [51, 18.8, 203, null, 'male']]} /><div className="prep-flow-arrow">↓ declared mass fill; original mask persists</div><Matrix label="Prepared values before later centring/division" columns={[...numericNames, 'sex']} rowLabels={['observed309', 'altered copy']} values={[[51, 18.8, 203, 4100, 'male'], [51, 18.8, 203, 4000, 'male']]} missing={[[false, false, false, false, false], [false, false, false, true, false]]} /></>;
      break;
    case 'D03':
      caption = 'Raw physical measurements and query-centred raw displacements.';
      body = <DistanceView raw divisors={[1, 1]} />;
      break;
    case 'D04':
      caption = 'Dividing by1 mm and100 g changes both squared contributions; circles retain their complete true radii.';
      body = <DistanceView />;
      break;
    case 'D05':
      caption = 'Five training values determine four different fitted rulers; later150 is transformed without refitting.';
      body = <RulerView />;
      break;
    case 'D06':
      caption = 'A zero measured spread stores divisor1; future9 becomes2, while an all-missing column has no fitted median.';
      body = <><Cells names={['train0', 'train1', 'train2']} values={[7, 7, 7]} /><div className="prep-flow-arrow">↓ subtract7; measured spread0 → stored divisor1</div><NumberLine values={[0, 0, 0, 2]} min={-.5} max={2.5} marks={[{
          id: 'query9→2',
          value: 2
        }]} label="Output coordinate" /><Matrix columns={['unsupported training column']} values={[[null], [null], [null]]} label="All-missing is a separate refusal, not median0" /></>;
      break;
    case 'D07':
      caption = 'Two input magnitudes share one direction; normalization maps both to the same point on a true unit circle.';
      body = <div className="prep-columns"><Plot equal label="Vectors on the same input ray" xDomain={[-1, 9]} yDomain={[-1, 9]} xLabel="x0" yLabel="x1" paths={[{
          values: [[0, 0], [6, 8]],
          arrow: true,
          color: ink.B
        }, {
          values: [[0, 0], [3, 4]],
          arrow: true,
          color: ink.A
        }]} points={[{
          id: '[3,4]',
          x: 3,
          y: 4,
          color: ink.A
        }, {
          id: '[6,8]',
          x: 6,
          y: 8,
          color: ink.B
        }]} /><div><Plot equal label="Unit direction; zero has no direction" xDomain={[-1.3, 1.3]} yDomain={[-1.3, 1.3]} xLabel="normalized x0" yLabel="normalized x1" circles={[{
            radius: 1
          }]} paths={[{
            values: [[0, 0], [.6, .8]],
            arrow: true
          }]} points={[{
            id: '[.6,.8]',
            x: .6,
            y: .8
          }, {
            id: 'zero',
            x: 0,
            y: 0,
            color: ink.muted
          }]} /><Table headers={['input', 'norm', 'output']} rows={[['[3,4]', 5, '[.6,.8]'], ['[6,8]', 10, '[.6,.8]'], ['[0,0]', 0, 'left zero; direction undefined']]} /></div></div>;
      break;
    case 'D08':
      caption = 'Centring turns three nonzeros into nine; reciprocal coefficient changes preserve prediction and change the penalty.';
      body = <><div className="prep-columns"><Matrix columns={['c0', 'c1', 'c2']} values={[[0, 0, 3], [1, 0, 0], [0, 2, 0]]} label="Sparse input:3 nonzeros" /><Matrix columns={['c0−1/3', 'c1−2/3', 'c2−1']} values={[[-1 / 3, -2 / 3, 2], [2 / 3, -2 / 3, -1], [-1 / 3, 4 / 3, -1]]} label="Centred result:9 nonzeros" /></div><Table headers={['state', 'x', 'w', 'dot', 'squared coefficient norm']} rows={[['original', '[1,100]', '[1,.01]', 2, 1.0001], ['x/s, sw', '[1,1]', '[1,1]', 2, 2]]} /></>;
      break;
    case 'D09':
      caption = 'Full one-hot labels are three true coordinate endpoints; the 2D projection is a schematic of3D geometry.';
      body = <><Matrix label="Exact three-coordinate vectors" columns={['red', 'green', 'blue']} rowLabels={['red', 'green', 'blue']} values={[[1, 0, 0], [0, 1, 0], [0, 0, 1]]} /><Plot equal label="Schematic projection of three orthogonal coordinate endpoints; exact distances in table" xDomain={[-1.4, 1.4]} yDomain={[-1.3, 1.5]} xLabel="projected coordinate plane" yLabel="3D schematic" points={[{
          id: 'red',
          x: 0,
          y: 1.1
        }, {
          id: 'green',
          x: -1,
          y: -.6,
          color: ink.A
        }, {
          id: 'blue',
          x: 1,
          y: -.6,
          color: ink.B,
          dx: -44
        }]} paths={[{
          values: [[0, 0], [0, 1.1]],
          arrow: true
        }, {
          values: [[0, 0], [-1, -.6]],
          arrow: true,
          color: ink.A
        }, {
          values: [[0, 0], [1, -.6]],
          arrow: true,
          color: ink.B
        }, {
          values: [[0, 1.1], [-1, -.6], [1, -.6], [0, 1.1]],
          dashed: true,
          color: ink.muted
        }]} /><Table headers={['pair', 'exact Euclidean distance']} rows={[['red–green', Math.SQRT2], ['red–blue', Math.SQRT2], ['green–blue', Math.SQRT2]]} /></>;
      break;
    case 'D10':
      caption = 'Dropping red creates an origin and unequal distances; full indicators also sum to the intercept column.';
      body = <><Plot equal label="Dropped-red coordinates" xDomain={[-.25, 1.3]} yDomain={[-.25, 1.3]} xLabel="green coordinate" yLabel="blue coordinate" points={[{
          id: 'red',
          x: 0,
          y: 0
        }, {
          id: 'green',
          x: 1,
          y: 0,
          color: ink.A,
          dx: -45,
          dy: 22
        }, {
          id: 'blue',
          x: 0,
          y: 1,
          color: ink.B
        }]} paths={[{
          values: [[0, 0], [1, 0], [0, 1], [0, 0]],
          color: ink.muted
        }]} /><Table headers={['edge', 'distance']} rows={[['red→green', 1], ['red→blue', 1], ['green→blue', Math.SQRT2]]} /><Matrix columns={['intercept', 'red', 'green', 'blue', 'sum indicators']} rowLabels={['red', 'green', 'blue']} values={[[1, 1, 0, 0, 1], [1, 0, 1, 0, 1], [1, 0, 0, 1, 1]]} label="Full design dependence: intercept equals indicator sum" /></>;
      break;
    case 'D11':
      caption = 'A missing value, known rare label and unknown label take explicitly different vocabulary paths.';
      body = <><CategoryView /><Table headers={['query', 'policy', 'output @missing,@rare,a']} rows={[['None', 'any', '[1,0,0]'], ['b', 'known rare', '[0,1,0]'], ['new', 'all-zero', '[0,0,0]'], ['new', 'error', 'refused'], ['new', 'infrequent exists', '[0,1,0]']]} /></>;
      break;
    case 'D12':
      caption = 'Ordered0/1/2 codes add equal spacing; a nominal permutation changes code distances.';
      body = <><NumberLine values={[0, 1, 2]} min={-.5} max={2.5} label="small0 · medium1 · large2: order plus equal adjacent spacing" /><Table headers={['pair', 'nominal assignment R0/G1/B2', 'permuted R0/G2/B1', 'full one-hot']} rows={[['R–G', 1, 2, Math.SQRT2], ['R–B', 2, 1, Math.SQRT2], ['G–B', 1, 1, Math.SQRT2]]} /></>;
      break;
    case 'D13':
      caption = 'The two fills at15 retain the original mask; identical numbers need not share an observation history.';
      body = <><Matrix columns={['input', 'original mask M', 'completed']} values={[[10, 0, 10], [20, 0, 20], [null, 1, 15], [null, 1, 15]]} missing={[[false, false, false], [false, false, false], [true, false, true], [true, false, true]]} label="Observed median(10+20)/2=15" /><NumberLine values={[10, 20]} min={5} max={25} label="Observed measurements" /><NumberLine values={[10, 20, 15, 15]} min={5} max={25} colors={[ink.A, ink.A, ink.estimated, ink.estimated]} label="Completed coordinates; narrower empirical spread" /></>;
      break;
    case 'D14':
      caption = 'The same recorded mask is compatible with different assumed generators; the mask alone does not identify one.';
      body = <><div className="prep-columns">{['MCAR independent coin', 'MAR observed station', 'MNAR unobserved weight'].map((name, mechanism) => <div key={name}><Matrix columns={['station', 'recorded weight', 'mask M', 'assumed P(M=1)']} values={['a', 'b', 'a', 'b'].map((station, i) => [station, [10, null, 20, null][i], i % 2, mechanism === 0 ? '.2' : mechanism === 1 ? station === 'a' ? '.1' : '.6' : i % 2 ? 'depends on hidden weight' : i === 0 ? '.1' : '.6'])} label={`${name}: same recorded observations and gaps`} /></div>)}</div><Table headers={['assumed generator', 'conditioning input', 'specified chance of a gap']} rows={[['MCAR independent coin', 'none', '.2 for each eligible weight cell'], ['MAR observed station', 'a / b', '.1 / .6'], ['MNAR unobserved weight', 'weight≤15 / >15', '.1 / .6'], ['structural not applicable', 'a different recorded state', 'not a missing measurement drawn by these examples']]} /><p>These probabilities specify three hypothetical mechanisms. They are not estimated from the table or certified by arrows. Under MNAR, the probability for an unrecorded weight cannot be read from its blank cell.</p></>;
      break;
    case 'D15':
      caption = 'Only jointly observed coordinates contribute; distance-defined and target-eligible are separate flags.';
      body = <DonorView stage="overlap" />;
      break;
    case 'D16':
      caption = 'Overlap rescaling gives squared distances7.5,3,12; the axis displays their square roots.';
      body = <DonorView stage="distance" />;
      break;
    case 'D17':
      caption = 'The two selected target cells receive equal weight; removed-target and no-overlap cases have explicit alternatives.';
      body = <><DonorView /><Table headers={['changed case', 'selected target cells', 'estimate']} rows={[['D2 target removed', 'D1=100,D3=500', 300], ['query overlap all missing', 'all observed target values100/300/500', 300], ['all donor targets missing', 'none', 'refused; no evidence']]} /></>;
      break;
    case 'D18':
      caption = 'Training cells reduce to saved arrays; later query cells never return to these reductions.';
      body = <><Matrix columns={['n0', 'n1', 'n2', 'category']} values={[[10, 100, 7, 'b'], [20, null, 7, 'a'], [30, 300, 7, null], [null, 500, 7, 'a']]} label="Four P1 training rows" /><div className="prep-flow-arrow">↓ observed medians; fill; population means/scales; sorted vocabulary</div><Table headers={['saved array', 'complete entries']} rows={Object.entries(smallFit).map(([name, values]) => [name, values.map(value => fmt(value, 10)).join(', ')])} /></>;
      break;
    case 'D19':
      caption = 'P1 joins3 numeric and3 category coordinates; the real penguin example explicitly changes to4+3=7.';
      body = <><SmallPreparationView /><p>The next schema has four measurements, so its output has seven positions.</p><RealPreparationView /></>;
      break;
    case 'D20':
      caption = 'Fresh training rows fit arrays; held-out rows transform through saved state, without a return path.';
      body = <><div className="prep-fitting-boundary"><Matrix columns={['n0', 'n1', 'n2', 'category']} values={[[10, 100, 7, 'b'], [20, null, 7, 'a'], [30, 300, 7, null], [null, 500, 7, 'a']]} label="P4 fitting boundary: only these four training rows enter reductions" /></div><div className="prep-flow-arrow">↓ fit once, save state</div><Table headers={['saved state outside the fitting boundary', 'entries']} rows={Object.entries(smallFit).map(([name, values]) => [name, values.map(value => fmt(value)).join(', ')])} /><div className="prep-flow-arrow">↓ transform later row [30, missing, missing], category a</div><Cells label="Complete P4 output: original six coordinates then all three original-mask indicators" names={['n0', 'n1', 'n2', 'a', 'b', 'not_recorded', 'M0', 'M1', 'M2']} values={[...prepare([30, null, null], 'a').output, 0, 1, 1]} mask={[false, true, true, false, false, false, false, false, false]} /><p><span aria-hidden="true">↛ </span>The later row has no return path into fitting. M2=1 is present even though n2 had no gaps in training; a missing-only-at-fit indicator scheme would omit that position.</p><Matrix columns={['fold0 status', 'fold1 status']} rowLabels={['row0', 'row1', 'row2', 'row3']} values={[['held', 'train'], ['train', 'held'], ['held', 'train'], ['train', 'held']]} label="A separate two-fold illustration: each fold requires fresh training state" /><Table headers={['operation', 'permitted data dependency', 'held-row effect on fitted arrays']} rows={[['fit inside fold0', 'rows1,3', 'none'], ['fit inside fold1', 'rows0,2', 'none'], ['transform a new row', 'saved medians/means/scales/vocabulary', 'none; forbidden new-row→fit path']]} /></>;
      break;
    case 'D21':
      caption = 'One retained258/86 split, one fixed k=5 rule; these are observed counts, not a universal ordering.';
      body = <><Bars label="Exact train and held-out partition" maximum={344} rows={[{
          name: 'training rows',
          value: 258
        }, {
          name: 'held-out rows',
          value: 86,
          color: ink.B
        }]} /><Bars label="Correct out of86 on the same retained split" maximum={86} rows={[{
          name: 'majority baseline',
          value: 38,
          color: ink.muted
        }, ...saved.results.map(row => ({
          name: row.method,
          value: row.correct
        }))]} /><Table caption="Retained confusion matrices; rows truth and columns predictions in Adelie/Chinstrap/Gentoo order" headers={['method', 'Adelie truth row', 'Chinstrap truth row', 'Gentoo truth row']} rows={saved.results.map(row => [row.method, ...row.confusion.map(values => values.join(', '))])} /></>;
      break;
    case 'D22':
      caption = 'Original row309 and an altered missing-mass copy share the same saved fit arrays.';
      body = <><RealPreparationView /><RealPreparationView altered={null} /></>;
      break;
    case 'D23':
      caption = 'Source position, held-out order, truth and saved prediction are different columns; newline identity is provenance.';
      body = <><Table caption="All86 retained held-out rows, not newly calculated predictions" headers={['held-out order', 'source position', 'truth', 'saved standard prediction']} rows={saved.scaled_inspection.test_source_rows.map((source, i) => [i, source, saved.scaled_inspection.truth[i], saved.scaled_inspection.predictions[i]])} /><Table headers={['file role', 'byte identity']} rows={[['historical LF executed input', '15241 bytes · f204db2c…'], ['current CRLF download', '15586 bytes ·79995be0…'], ['relation', 'exact CRLF→LF normalization; same observations']]} /></>;
      break;
    default:
      throw Error(`Unknown core drawing ${id}`);
  }
  return <Figure id={id} caption={caption}>{body}</Figure>;
}
