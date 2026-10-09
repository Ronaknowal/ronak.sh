import React, { useId } from 'react';
import { Figure, Table, Matrix, Cells, Plot, NumberLine, Bars, fmt, ink } from './Drawing.jsx';
import { power, profile, normalQuantile, quantileMap, splineRow, targetFixture, crossFit, incomplete, conditionalTrace, applyConditional, completionTables, completionQ, completionU, pool, sensitivity } from './preparation-models.mjs';
const sample = (low, high, count = 121) => Array.from({
  length: count
}, (_, i) => low + i * (high - low) / (count - 1));
export function PowerView({
  method = 'YJ',
  lambda = 1,
  x = -3
}) {
  const result = power(x, lambda, method);
  const domain = method === 'BC' ? [Math.min(.1, x), 30] : [-10, 30];
  const rows = sample(...domain).map(value => [value, power(value, lambda, method)]);
  return <><Plot label={`${method} actual transformation at lambda${lambda}`} xDomain={domain} yDomain={[Math.min(0, ...rows.map(row => row[1]), result), Math.max(1, ...rows.map(row => row[1]), result)]} xLabel="input x" yLabel={`${method} output`} paths={[{
      values: rows
    }]} points={[{
      id: 'x',
      x,
      y: result
    }]} /><Table headers={['method', 'x', 'lambda', 'branch', 'mapped coordinate']} rows={[[method, x, lambda, method === 'BC' ? lambda === 0 ? 'log x' : '(x^λ−1)/λ' : x >= 0 ? lambda === 0 ? 'log1p(x)' : 'positive power' : lambda === 2 ? '−log1p(−x)' : 'negative power', result]]} /></>;
}
export function QuantileView({
  x = 3,
  output = 'uniform'
}) {
  const state = quantileMap(x, output);
  return <><Matrix label="Saved empirical landmark state; ties occupy two probability positions" columns={['input landmark', 'reference probability']} values={state.landmarks.map((value, i) => [value, state.references[i]])} /><Plot label="Fitted input-to-uniform map; exact tie midpoint and one-sided limits" xDomain={[Math.min(0, x), Math.max(105, x)]} yDomain={[-.1, 1.1]} xLabel="query x; training support1…100" yLabel="uniform coordinate u" paths={[{
      values: [[Math.min(0, x), 0], [1, 0], [2, .25]]
    }, {
      values: [[2, .5], [4, .75], [100, 1], [Math.max(105, x), 1]]
    }]} points={[{
      id: 'tie',
      x: 2,
      y: .375,
      color: ink.B
    }, {
      id: 'query',
      x,
      y: state.probability,
      dy: -12
    }]} /><Cells names={['query x', 'u', output === 'normal' ? 'finite normal coordinate z' : 'uniform output', 'inverse support policy']} values={[x, state.probability, state.value, state.saturated ? x < 1 ? 'endpoint1' : 'endpoint100' : 'within fitted support']} />{output === 'normal' ? <Plot label="Normal inverse CDF after endpoint clipping epsilon1e-7" xDomain={[0, 1]} yDomain={[-5.3, 5.3]} xLabel="uniform probability u" yLabel="normal coordinate" paths={[{
      values: sample(.0000001, .9999999, 201).map(value => {
        return [value, normalQuantile(value)];
      })
    }]} /> : null}</>;
}
export function CycleView({
  first = 350,
  second = 10
}) {
  const point = angle => [Math.cos(angle * Math.PI / 180), Math.sin(angle * Math.PI / 180)];
  const a = point(first),
    b = point(second),
    chord = Math.hypot(a[0] - b[0], a[1] - b[1]);
  return <><Plot equal label="True unit circle with both coordinate projections and chord" xDomain={[-1.3, 1.3]} yDomain={[-1.3, 1.3]} xLabel="cos(2πt/period)" yLabel="sin(2πt/period)" circles={[{
      radius: 1
    }]} points={[{
      id: 'A',
      x: a[0],
      y: a[1],
      color: ink.A,
      dx: -22,
      dy: 23
    }, {
      id: 'B',
      x: b[0],
      y: b[1],
      color: ink.B,
      dx: -22,
      dy: -12
    }]} paths={[{
      values: [[0, 0], a],
      arrow: true,
      color: ink.A
    }, {
      values: [[0, 0], b],
      arrow: true,
      color: ink.B
    }, {
      values: [a, b],
      color: ink.query
    }, ...[a, b].flatMap(row => [{
      values: [[row[0], 0], row, [0, row[1]]],
      dashed: true,
      color: ink.muted
    }])]} /><Table headers={['point', 'angle degrees', 'cos', 'sin']} rows={[['A', first, ...a], ['B', second, ...b]]} /><p>Chord length {fmt(chord, 10)}. Period is360°; a duration uses this circle only with a justified periodic interpretation.</p></>;
}
export function SmoothingView({
  count = 1,
  total = count,
  alpha = 2,
  prior = .5
}) {
  const value = count + alpha ? (total + alpha * prior) / (count + alpha) : prior;
  return <><div className="prep-operation"><svg viewBox={`0 0 370 ${Math.max(60, Math.ceil(count / 10) * 30 + 20)}`} role="img" aria-label={`${count} observed positive target cells, each equal to1; empty support has no target cells`}>{Array.from({
          length: count
        }, (_entry, i) => <g key={i}><circle cx={22 + i % 10 * 36} cy={22 + Math.floor(i / 10) * 30} r="11" fill="none" stroke={ink.A} /><text x={22 + i % 10 * 36} y={27 + Math.floor(i / 10) * 30} textAnchor="middle">1</text></g>)}</svg><p>{count ? `${count} observed positive target ${count === 1 ? 'cell' : 'cells'}; each equals 1. Reduce them to sum ${total} and count ${count}.` : 'No observed target cells support this category; use the donor prior.'}</p></div><div className="prep-flow-arrow">↓ sum and count</div><Cells names={['target sum', 'category count n', 'prior μ', 'smoothing α', 'mapped value']} values={[total, count, prior, alpha, value]} /><NumberLine min={0} max={1} values={[prior, ...(count ? [total / count] : [])]} marks={[{
      id: 'prior μ',
      value: prior,
      color: ink.B
    }, ...(count ? [{
      id: 'category mean',
      value: total / count,
      color: ink.A
    }] : []), {
      id: 'map',
      value
    }]} label="Category mean and prior on the same target scale" /><Bars maximum={1} label="Exact mixing weights" rows={[{
      name: 'category n/(n+α)',
      value: count + alpha ? count / (count + alpha) : 0,
      color: ink.A
    }, {
      name: 'prior α/(n+α)',
      value: count + alpha ? alpha / (count + alpha) : 1,
      color: ink.B
    }]} /><p>{count ? 'Smoothing changes the weights; it does not exclude a held row’s target.' : 'No matching category support: declared fallback is the donor prior.'}</p></>;
}
export function CrossFitView({
  fixture = targetFixture,
  selected = 0
}) {
  const marker = useId().replaceAll(':', ''),
    rows = crossFit(fixture),
    state = rows[selected];
  const height = Math.max(340, state.donors.length * 80 + 40);
  const priorY = height * .35,
    sumY = height - 50;
  const categoryColors = [ink.A, ink.B, '#e49b94', '#b8b8c6'];
  const categoryColor = label => categoryColors[Array.from(label).reduce((value, letter) => value + letter.codePointAt(0), 0) % categoryColors.length];
  return <><Matrix columns={['category', 'target y', 'fold', 'OOF code']} values={fixture.categories.map((label, i) => [<span style={{
      color: categoryColor(label)
    }}>{label || '(empty label)'}</span>, fixture.targets[i], fixture.folds[i], rows[i].value])} highlightRows={[selected]} label="Complete six-row training table; category identity, fold digits and selection outline are separate cues" />
    <div className="prep-operation"><svg viewBox={`0 0 440 ${height}`} role="img" aria-label={`All permitted targets${state.donors.join(',')} contribute to row${selected} prior; matching rows${state.matching.join(',')} also contribute to numerator`}>
      <defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="context-stroke" /></marker></defs>
      {state.donors.map((row, i) => <g key={row}><circle cx="55" cy={48 + i * 80} r="18" fill="none" stroke={ink.A} /><text x="55" y={53 + i * 80} textAnchor="middle">{row}</text><text x="85" y={53 + i * 80}>y={fixture.targets[row]}</text><path d={`M135 ${48 + i * 80} L265 ${priorY}`} stroke={ink.B} fill="none" markerEnd={`url(#${marker})`} />{state.matching.includes(row) ? <path d={`M135 ${48 + i * 80} L180 ${sumY} L265 ${sumY}`} stroke={ink.query} fill="none" markerEnd={`url(#${marker})`} /> : null}</g>)}
      <circle cx="300" cy={priorY} r="32" fill="#19191c" stroke={ink.B} /><text x="300" y={priorY + 5} textAnchor="middle">μ</text>
      <circle cx="300" cy={sumY} r="32" fill="#19191c" stroke={ink.query} /><text x="300" y={sumY + 5} textAnchor="middle">Σ</text>
    </svg></div><p>Purple edges reach μ from every permitted donor. Amber edges reach the category sum Σ only from matching donors. The held fold sends no edge into either reduction.</p><Table headers={['selected row', 'permitted donors', 'same-category donors', 'prior', 'numerator', 'denominator', 'code']} rows={[[selected, state.donors.join(','), state.matching.join(',') || 'none', state.prior, state.total + 2 * state.prior, state.count + 2, state.value]]} /><p>Every other-fold donor remains in the prior, including same-category donors.</p></>;
}
export function HashView({
  counts = [3, 1, 2],
  buckets = [0, 0, 1],
  signs = [1, -1, 1]
}) {
  const output = [0, 0];
  counts.forEach((count, i) => {
    output[buckets[i]] += signs[i] * count;
  });
  return <><Table caption="Declared constructed projection; distinct from the ordinary hash function" headers={['token', 'count', 'bucket', 'sign', 'signed contribution']} rows={['apple', 'pear', 'banana'].map((token, i) => [token, counts[i], buckets[i], signs[i], counts[i] * signs[i]])} /><Matrix columns={['apple', 'pear', 'banana']} rowLabels={['bucket0', 'bucket1']} values={[0, 1].map(bucket => counts.map((_count, i) => buckets[i] === bucket ? signs[i] : 0))} label="Projection matrix: one signed nonzero per token column" /><div className="prep-flow-arrow">↓ sparse accumulation into bucket coordinates</div><Cells names={['bucket0', 'bucket1']} values={output} /></>;
}
export function ConditionalView({
  input = incomplete,
  turn = 0,
  initialOverrides = {},
  state = conditionalTrace(input, 1, initialOverrides)
}) {
  const current = turn === 0 ? state.initial : state.trace[turn - 1].current;
  const mask = input.map(row => row.map(value => value === null));
  const model = turn ? state.trace[turn - 1] : null;
  const edited = Object.values(initialOverrides).some(value => value !== null && value !== undefined);
  const initialLabel = edited ? 'Initial estimates: edited gaps override medians2.5/6; observed row2 a=3 stays fixed' : 'Initialized medians2.5/6; observed row2 a=3';
  const gaps = model ? input.map((row, i) => row[model.target] === null ? i : -1).filter(i => i >= 0) : [];
  const predictorRange = model ? [Math.min(...current.map(row => row[model.other])) - 1, Math.max(...current.map(row => row[model.other])) + 1] : [];
  const fitAt = value => model.intercept + model.coefficient * value;
  return <>
    <div className="prep-columns"><Matrix columns={['a', 'b']} values={input} label="Original observations; original missing mask remains fixed" /><Matrix columns={['a', 'b']} values={current} missing={mask} highlightRows={model?.observed || []} label={turn ? `Turn${turn}: observed target rows outlined, original gaps hatched` : initialLabel} /></div>
    {model ? <>
      <Table headers={['observed response row', 'intercept input', `current predictor${model.other}`, 'original response']} rows={model.observed.map((row, i) => [row, 1, model.design[i], model.response[i]])} />
      <Cells names={['coefficient', 'unpenalized intercept', 'alpha', 'target column']} values={[model.coefficient, model.intercept, 1, model.target]} />
      <Plot label="Current conditional regression: observed responses, fitted line, residuals and original missing target estimates" xDomain={predictorRange} yDomain={[Math.min(...model.response, ...predictorRange.map(fitAt)) - 1, Math.max(...model.response, ...predictorRange.map(fitAt)) + 1]} xLabel={`current predictor${model.other}`} yLabel={`target${model.target}; observed or estimated`} paths={[{
        values: predictorRange.map(value => [value, fitAt(value)]),
        color: ink.A
      }, ...model.design.map((value, i) => ({
        values: [[value, model.response[i]], [value, fitAt(value)]],
        color: ink.B
      }))]} points={[...model.design.map((value, i) => ({
        id: `observed row${model.observed[i]}`,
        x: value,
        y: model.response[i],
        color: ink.A
      })), ...gaps.map(row => ({
        id: `estimated row${row}`,
        x: current[row][model.other],
        y: current[row][model.target],
        color: ink.estimated
      }))]} />
      <Table caption="Apply the saved linear expression only to original target gaps" headers={['row', 'predictor', 'coefficient × predictor', '+ intercept', 'new estimate']} rows={gaps.map(row => [row, current[row][model.other], model.coefficient * current[row][model.other], model.intercept, current[row][model.target]])} />
      <p>Only originally missing target cells are replaced. Predictors may already be estimates from the previous column update. Purple segments show residuals of the observed responses; amber marks are estimates, not observed fitting responses.</p>
    </> : <Cells names={['median a', 'median b']} values={state.medians} />}
    <p>{state.status}. Training uses original observations as responses; later rows apply this saved sequence without refitting.</p>
  </>;
}
export function SavedConditionalView({ state, workedDefault = false }) {
  const queries = [[3, null], [null, 6], [null, null]];
  return <div data-saved-conditional="current-sequence">
    <p>{workedDefault ? 'Default worked example. ' : 'Current fitted sequence. '}Training saves all six models in order. The fixed queries below read those models; they supply no fitting responses.</p>
    <Table caption="Saved models from this training trace, applied from turn1 through turn6" headers={['turn', 'target', 'predictor', 'coefficient', 'intercept']} rows={state.trace.map(row => [row.turn, row.target, row.other, row.coefficient, row.intercept])} />
    <div className="prep-flow-arrow">↓ apply saved models to fixed later rows; no refit</div>
    {queries.map((query, i) => <Matrix key={i} columns={['a', 'b']} rowLabels={['training-median initialization', ...state.trace.map(row => `after saved turn${row.turn}`)]} values={applyConditional(query, state)} missing={Array.from({ length: 7 }, () => query.map(value => value === null))} label={`Later query${i}: [${query.map(value => fmt(value)).join(', ')}]; only its original gaps change`} />)}
    <p>{state.status}. Query observations stay fixed. Each working vector uses the preceding vector and the current saved model, without changing the training arrays.</p>
  </div>;
}
export function FullTargetFitView({ fixture = targetFixture, alpha = 2 }) {
  const marker = useId().replaceAll(':', '');
  const prior = fixture.targets.reduce((a, b) => a + b, 0) / fixture.targets.length;
  const aggregates = [...new Set(fixture.categories)].map(category => {
    const ids = fixture.categories.map((label, i) => label === category ? i : -1).filter(i => i >= 0);
    const total = ids.reduce((value, i) => value + fixture.targets[i], 0);
    return { category, ids, total, count: ids.length };
  });
  const apply = category => {
    const row = aggregates.find(row => row.category === category);
    return row ? (row.total + alpha * prior) / (row.count + alpha) : prior;
  };
  const groups = [0, 0, 1, 1, 2, 2], held = [0, 1];
  const foldDonors = fixture.folds.map((fold, i) => fold !== fixture.folds[0] ? i : -1).filter(i => i >= 0);
  const groupDonors = groups.map((group, i) => group !== groups[0] ? i : -1).filter(i => i >= 0);
  const groupPrior = groupDonors.reduce((sum, i) => sum + fixture.targets[i], 0) / groupDonors.length;
  return <>
    <div className="prep-target-fit" tabIndex={0} role="region" aria-label="Full-training target reductions into stored category state; scroll horizontally if needed"><svg viewBox="0 0 620 285" role="img" aria-label="All six training targets reduce to a global prior; category targets reduce separately to saved sums and counts">
      <defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="context-stroke" /></marker></defs>
      {aggregates.map((row, j) => <g key={row.category}>
        <text x={100 + j * 190} y="24" textAnchor="middle">category {row.category}</text>
        {row.ids.map((i, k) => <g key={i}><circle cx={65 + j * 190 + k * 70} cy="65" r="18" fill="none" stroke={ink.A} /><text x={65 + j * 190 + k * 70} y="70" textAnchor="middle">{fixture.targets[i]}</text><text x={65 + j * 190 + k * 70} y="100" textAnchor="middle">row{i}</text></g>)}
        <path d={`M${100 + j * 190} 114 V145`} stroke={ink.A} markerEnd={`url(#${marker})`} />
        <text x={100 + j * 190} y="169" textAnchor="middle">sum {row.total} · count {row.count}</text>
        <path d={`M${100 + j * 190} 185 L310 230`} stroke={ink.B} markerEnd={`url(#${marker})`} />
      </g>)}
      <text x="310" y="264" textAnchor="middle">all targets: sum {fixture.targets.reduce((a, b) => a + b, 0)} / count {fixture.targets.length} = prior {fmt(prior)}</text>
    </svg></div>
    <Table caption="Stored full-training state; no outer assessment target or later query enters these reductions" headers={['category', 'training row IDs', 'sum s', 'count n', 'prior μ', 'α', 'code (s+αμ)/(n+α)']} rows={aggregates.map(row => [row.category, row.ids.join(','), row.total, row.count, prior, alpha, apply(row.category)])} />
    <div className="prep-flow-arrow">↓ saved map is read by genuinely external rows</div>
    <Table caption="Later inputs have categories only; no query target is supplied and no refit occurs" headers={['external row', 'category input', 'saved operands', 'application', 'encoded feature']} rows={['A', 'unseen'].map((category, i) => { const row = aggregates.find(row => row.category === category); return [`new${i}`, category, row ? `s=${row.total}, n=${row.count}, μ=${prior}, α=${alpha}` : `no category support; μ=${prior}`, row ? `(${row.total}+${alpha}×${prior})/(${row.count}+${alpha})` : 'read saved prior', apply(category)]; })} />
    <Matrix label="P9 group metadata on the same six row IDs; group labels are supplied independently of category labels" columns={['category', 'target', 'fold', 'group ID']} values={fixture.categories.map((category, i) => [category, fixture.targets[i], fixture.folds[i], groups[i]])} />
    <Table caption="Actual group admissibility contrast from P9; group0 owns held rows0,1" headers={['split', 'held rows', 'donors', 'shared group?', 'permitted state for held A rows']} rows={[
      ['ordinary fold0', '0,2,4', foldDonors.join(','), 'yes: group0 row1 crosses to row0', 'refused under group contract'],
      ['group0 held', held.join(','), groupDonors.join(','), 'none', `A absent; donor prior=${fmt(groupPrior)}`]
    ]} />
    <p>Groups identify related observations, not categories. P9 rejects the ordinary folds when these group IDs are supplied. Holding an entire group recomputes both sums and prior from the remaining groups.</p>
  </>;
}
export function SensitivityView() {
  return <><Plot label="P16 fixed-draw sensitivity line baseline+.4delta; not an identified MNAR process or confidence interval" xDomain={[-2, 2]} yDomain={[7.5, 10]} xLabel="assumed missing-cell delta" yLabel="pooled mean" paths={[{ values: [[-2, sensitivity(-2)], [0, sensitivity(0)], [2, sensitivity(2)]] }]} points={[-2, 0, 2].map(x => ({ x, y: sensitivity(x) }))} /><Table headers={['assumed delta', 'pooled mean']} rows={[-2, 0, 2].map(delta => [delta, sensitivity(delta)])} /></>;
}
export function PoolView({
  estimates = [9, 10, 11],
  variances = [4, 4, 4]
}) {
  const state = pool(estimates, variances);
  const intervals = estimates.map((value, i) => [value - Math.sqrt(variances[i]), value + Math.sqrt(variances[i])]);
  return <><Table headers={['analysis', 'Q (estimate units)', 'U (squared estimate units)']} rows={estimates.map((value, i) => [i + 1, value, variances[i]])} /><Plot label="Each estimate with a segment extending one within-analysis standard error in either direction; these are not confidence intervals" xDomain={[Math.min(...intervals.flat()) - 1, Math.max(...intervals.flat()) + 1]} yDomain={[0, estimates.length + 1]} xLabel="estimate units; segment Q ± √U" yLabel="analysis identity" paths={intervals.map((values, i) => ({
      values: [[values[0], i + 1], [values[1], i + 1]],
      color: ink.A
    }))} points={estimates.map((value, i) => ({
      id: `analysis${i + 1}`,
      x: value,
      y: i + 1
    }))} /><p>The segment half-length is √U, measured in estimate units. It shows each analysis’s uncertainty separately from variation between estimates.</p><NumberLine values={estimates} marks={[{
      id: 'mean Q',
      value: state.estimate
    }]} label="Estimate axis; variances are not lengths on this axis" /><Bars label="Additive variance components in squared estimate units" rows={[{
      name: 'within',
      value: state.within
    }, {
      name: 'between',
      value: state.between,
      color: ink.B
    }, {
      name: 'finite-m B/m',
      value: state.simulation,
      color: ink.query
    }]} /><Cells names={['pooled estimate', 'total variance T', 'SE=√T (estimate units)']} values={[state.estimate, state.total, state.standardError]} /></>;
}
export function DeeperFigure({
  id
}) {
  let body, caption;
  switch (id) {
    case 'D24':
      caption = 'Equal input ratios become equal log differences; zero and negatives are outside the log domain.';
      body = <><NumberLine values={[1, 10, 100]} min={0} max={105} label="Positive original values" /><NumberLine values={[0, Math.log(10), Math.log(100)]} min={-.2} max={5} label="Log coordinates: equal successive differences ln10" /><Plot label="Natural logarithm on positive inputs only" xDomain={[0, 105]} yDomain={[-2.5, 5]} xLabel="x>0" yLabel="ln x" paths={[{
          values: sample(.1, 100).map(x => [x, Math.log(x)])
        }]} points={[1, 10, 100].map((x, i) => ({
          id: String(x),
          x,
          y: Math.log(x),
          dx: i === 2 ? -35 : 10
        }))} /></>;
      break;
    case 'D25':
      caption = 'The Yeo–Johnson sign branch and lambda boundary determine the actual expression; Box–Cox has a separate positive domain.';
      body = <><PowerView lambda={2} /><Table headers={['branch fixture', 'result']} rows={[['YJ−3,λ0', -7.5], ['YJ−3,λ1', -3], ['YJ−3,λ2', -Math.log(4)], ['BCx≤0', 'refused'], ['BCx3,λ1', 2]]} /></>;
      break;
    case 'D26':
      {
        caption = 'The profile curve is calculated from transformed variance and Jacobian on five declared training values.';
        const values = [1, 2, 4, 10, 30],
          lambda = -.146859;
        const curve = sample(-3, 3).map(x => [x, profile(values, x, 'BC').total]),
          selected = profile(values, lambda, 'BC');
        body = <><Cells names={values.map((_v, i) => `training${i}`)} values={values} /><Plot label="Actual Box–Cox profile objective over bounded candidates−3…3" xDomain={[-3, 3]} yDomain={[Math.min(...curve.map(row => row[1])) - 1, Math.max(...curve.map(row => row[1])) + 1]} xLabel="candidate lambda" yLabel="profile objective (higher is better)" paths={[{
            values: curve
          }]} points={[{
            id: 'saved λ',
            x: lambda,
            y: selected.total
          }]} /><Table headers={['saved λ (rounded)', 'variance', '−n/2 log variance', 'Jacobian', 'sum']} rows={[[lambda, selected.variance, selected.varianceTerm, selected.jacobian, selected.total]]} /><p>Saved optimum is the retained P7 bounded-search result; curve points are direct objective evaluations. Bounds−3…3 and finite search status do not prove a global optimum outside the searched domain.</p></>;
        break;
      }
    case 'D27':
      caption = 'Saved tied landmarks map3 to.625; endpoint saturation loses the magnitude beyond fitted support.';
      body = <QuantileView output="normal" />;
      break;
    case 'D28':
      caption = 'Learned edges and membership retain their actual count; ties merge four requested quantile bins to three.';
      body = <><NumberLine values={[1, 2, 2, 4, 100]} min={0} max={105} marks={[1, 25.75, 50.5, 75.25, 100].map((value, i) => ({
          id: `u${i}`,
          value
        }))} label="Uniform edges, four intervals" /><NumberLine values={[1, 2, 2, 4, 100]} min={0} max={105} marks={[1, 2, 4, 100].map((value, i) => ({
          id: `q${i}`,
          value
        }))} label="Quantile unique edges, three effective intervals" /><Table headers={['policy', 'edges', 'x=2 membership', 'one-hot']} rows={[['quantile, right insertion', '1,2,4,100', 1, '[0,1,0]'], ['uniform', '1,25.75,50.5,75.25,100', 0, '[1,0,0,0]']]} /><NumberLine values={[0, 1, 2, 8, 9, 10]} min={-.5} max={10.5} marks={[{
          id: 'c0',
          value: 1
        }, {
          id: 'edge',
          value: 5
        }, {
          id: 'c1',
          value: 9
        }]} label="Supplied-centre Lloyd: init0/10 → centres1/9 → midpoint5" /><p>KMeans owns supplied centres, n_init=1 and Lloyd stopping settings. The separate KBins route chooses its own initialization.</p></>;
      break;
    case 'D29':
      {
        caption = 'A polynomial design row is evaluated from explicit exponent pairs; the ab response varies over two input axes.';
        const xs = [0, 1, 2, 3, 4];
        body = <><Matrix columns={['1', 'a', 'b', 'a²', 'ab', 'b²']} rowLabels={['power a', 'power b', 'a2,b3 values']} values={[[0, 1, 0, 2, 1, 0], [0, 0, 1, 0, 1, 2], [1, 2, 3, 4, 6, 9]]} label="Multi-index powers and complete numeric feature row" /><Plot label="Actual ab contour curves for products2,4,6,8,12" xDomain={[0, 4.5]} yDomain={[0, 4.5]} xLabel="a" yLabel="b" paths={[2, 4, 6, 8, 12].map((value, i) => ({
            values: sample(.1, 4).map(a => [a, value / a]).filter(row => row[1] <= 4.5),
            color: i % 2 ? ink.B : ink.A
          }))} points={[{
            id: 'ab=6',
            x: 2,
            y: 3
          }]} /><Table headers={['a / b', ...xs]} rows={xs.map(a => [a, ...xs.map(b => a * b)])} caption="Exact ab response grid; interaction-only keepsab but excludesa²,b²" /></>;
        break;
      }
    case 'D30':
      {
        caption = 'Local basis supports overlap; all active degree1/2 curves feed their banded design rows and weighted response.';
        const colors = [ink.query, ink.A, ink.B, '#e49b94'];
        body = <><Plot label="Degree-one weighted response:2B0+4B1+B2" xDomain={[-.1, 2.1]} yDomain={[0, 4.5]} xLabel="input x" yLabel="weighted response" paths={[{
            values: sample(0, 2).map(x => [x, splineRow(x, 1).row.reduce((total, value, j) => total + value * [2, 4, 1][j], 0)])
          }]} points={[{
            id: 'x.5→3',
            x: .5,
            y: 3
          }]} /><Table caption="Degree-zero support intervals feeding the degree-one recurrence at x=.5" headers={['basis', 'half-open support', 'B_i,0(.5)']} rows={[[0, '[-1,0)', 0], [1, '[0,1)', 1], [2, '[1,2)', 0], [3, '[2,3)', 0]]} />{[1, 2].map(degree => {
            const selected = splineRow(.5, degree),
              width = selected.row.length;
            return <div key={degree}><NumberLine values={selected.knots} min={selected.knots[0] - .2} max={selected.knots.at(-1) + .2} label={`Complete degree${degree} knot vector`} /><Plot label={`All${width} degree${degree} basis curves on fitted base interval0…2`} xDomain={[-.1, 2.1]} yDomain={[-.05, 1.1]} xLabel="x; selected.5" yLabel="basis weight B_j(x)" paths={Array.from({
                length: width
              }, (_, j) => ({
                values: sample(0, 2).map(x => [x, splineRow(x, degree).row[j]]),
                color: colors[j]
              }))} points={selected.row.map((value, j) => ({
                x: .5,
                y: value,
                color: colors[j],
                radius: 4
              }))} /><Cells names={selected.row.map((_v, j) => `B${j}(.5)`)} values={selected.row} /><p>Degree{degree} row sum={fmt(selected.row.reduce((a, b) => a + b, 0))}; weights are local on this fitted interval.</p></div>;
          })}<Table headers={['degree1 operation', 'basis row', 'weights', 'response']} rows={[['x.5 inside', '[.5,.5,0]', '[2,4,1]', 3], ['x2 right boundary', '[0,0,1]', '[2,4,1]', 1], ['x2.5 constant', '[0,0,1]', '[2,4,1]', 1], ['x2.5 linear exterior', '[0,−.5,1.5]', '[2,4,1]', -.5], ['x2.5 error policy', 'refused', '', 'outside fitted interval']]} /><p>Linear extrapolation uses the interior left derivative at the right boundary and can produce negative basis entries. Degree-zero ordinary outside-constant comparison was unsupported in the observed sklearn1.9.1 run; its actual failed attempts remain preserved.</p></>;
        break;
      }
    case 'D31':
      caption = '350° and10° are close on the circle; both sine and cosine are needed to distinguish positions.';
      body = <CycleView />;
      break;
    case 'D32':
      caption = 'A positive singleton shrinks toward the prior more than100 positive observations; smoothing does not exclude target information.';
      body = <div className="prep-columns"><SmoothingView /><SmoothingView count={100} /></div>;
      break;
    case 'D33':
      caption = 'All other-fold targets enter the prior; only matching-category donors additionally enter the category sum.';
      body = <CrossFitView />;
      break;
    case 'D34':
      caption = 'OOF training, full-fit inference and chronological warm-up have different admissible row sets.';
      body = <><Matrix columns={['category', 'OOFα2', 'OOFα0', 'fullα2', 'fullα0']} values={targetFixture.categories.map((label, i) => [label, crossFit()[i].value, crossFit(targetFixture, 0)[i].value, [.75, .75, .25, .25, .5, .5][i], [1, 1, 0, 0, .5, .5][i]])} label="Same six identities; distinct training/inference contracts" /><FullTargetFitView /><Table headers={['row time', 'coverage', 'allowed earlier donors', 'aligned training code/target']} rows={[[0, 0, 'none', 'uncovered warm-up'], [1, 0, 'none', 'uncovered warm-up'], [2, 1, '0,1', '1 /0'], [3, 1, '0,1', '1 /0'], [4, 1, '0,1,2,3', '.5 /1'], [5, 1, '0,1,2,3', '.5 /0']]} /><p>Manual past-only encoding drops uncovered warm-up rows and aligns downstream targets. Current TargetEncoder cross-fit validation requires full coverage; group and time donor admissibility need explicit separate design.</p></>;
      break;
    case 'D35':
      caption = 'Signed contributions add into the declared projection; the actual ordinary mapping is a separate width4 fixture.';
      body = <><HashView /><Matrix label="Actual retained FeatureHasher width4 mapping, separate from the constructed width2 map" columns={['bucket0', 'bucket1', 'bucket2', 'bucket3']} rowLabels={['apple', 'pear', 'banana']} values={[[1, 0, 0, 0], [0, 0, 0, -1], [0, -1, 0, 0]]} /></>;
      break;
    case 'D36':
      caption = 'Two different sparse bags collide at exactly the same output; signed hashing does not make the map invertible.';
      body = <div className="prep-columns"><HashView /><HashView counts={[2, 0, 2]} /></div>;
      break;
    case 'D37':
      caption = 'Only the two original missing cells are initialized; row2 a=3 stays observed.';
      body = <ConditionalView />;
      break;
    case 'D38':
      caption = 'The first conditional regression supplies missinga; the next regression uses that newly estimated predictor.';
      body = <><ConditionalView turn={1} /><ConditionalView turn={2} /></>;
      break;
    case 'D39':
      {
        caption = 'Default worked example: six fitted models are saved in order; new rows pass through them without refitting. L13 below carries its own current edited sequence into the same query paths.';
        const state = conditionalTrace();
        body = <SavedConditionalView state={state} workedDefault />;
        break;
      }
    case 'D40':
      caption = 'Each actual P16 completion has its own analysis and variance; averaging data before analysis is a different operation.';
      body = <><div className="prep-columns">{completionTables.map((values, i) => <div key={i}><Matrix columns={['value']} values={values.map(value => [value])} missing={[[false], [false], [true], [false], [true]]} label={`Rounded simulated normal-model completion${i + 1}`} /><Cells names={['this Q', 'this U']} values={[completionQ[i], completionU[i]]} /></div>)}</div><Table headers={['square example', 'input', 'analysis']} rows={[['completion1', 0, 0], ['completion2', 2, 4], ['analyse then average', '', 2], ['average input then square', 1, 1]]} /><p>Displayed matrices are the first three of five actual P16 draws; their own Q/U are retained. They do not carry the supplied U=4 from the separate pooling example.</p></>;
      break;
    case 'D41':
      caption = 'Supplied scalar analyses illustrate pooling; variance contributions use squared units and standard errors use estimate units.';
      body = <PoolView />;
      break;
    case 'D41b':
      caption = 'The fixed P16 normal-model draws change only at original gaps by the assumed delta; this is sensitivity, not a confidence band.';
      body = <SensitivityView />;
      break;
    default:
      throw Error(`Unknown deeper drawing ${id}`);
  }
  return <Figure id={id} caption={caption}>{body}</Figure>;
}
