import { StudyFeatureUnits, StudyGroups, SavedQueryPorts } from './NaiveBayesReadingFlowAnatomy.jsx';
import { useState } from 'react';
import { tokenEvidenceState, gaussianLogDensity } from '../../data/naive-bayes-models.js';
import { classColors, complementCounts, complement, finite, vector, sum, sparseRows, savedInference, textFoldRoles, scores, featureCountMasses } from '../../data/naive-bayes-reading-flow-models.js';
import observations from '../../data/naive-bayes-reading-flow-observations.js';
import { Figure, Svg, Text, Arrow, Mark, ClassLegend, Table, Result, Probability, Field, Choice, Controls, useDraft, num, f } from './NaiveBayesReadingFlowElements.jsx';
export function ComplementPooling() {
  const m = useDraft({
      target: '0'
    }, d => {
      const c = num(d.target);
      if (![0, 1, 2].includes(c)) throw Error('Select an existing class.');
      return c;
    }),
    c = m.value;
  const pooled = [0, 1, 2].map(j => sum(complementCounts.filter((_, k) => k !== c).map(row => row[j])));
  return <Figure title="For target c, pool every other class" caption="Identity follows the class, not its row position. The excluded class contributes no edge to its own complement.">
    <Svg height={300} label="Three raw count rows and selected other-class pool">
      {complementCounts.map((row, k) => <g key={k}>
        <Mark x={25} y={55 + k * 70} c={k} selected={k === c} />
        <Text x={50} y={60 + k * 70} color={classColors[k]}>class {k}: [{row.join(', ')}]</Text>
        {k !== c ? <Arrow x1={270} y1={55 + k * 70} x2={410} y2={135} color={classColors[k]} /> : <Text x={290} y={60 + k * 70}>excluded</Text>}
      </g>)}
      <Text x={430} y={120}>complement for class {c}</Text>
      <Text x={430} y={157}>[{pooled.join(', ')}] observed tokens</Text>
      <Text x={430} y={197}>+ [1,1,1] → normalize</Text>
      <Text x={50} y={282}>No target-row token enters its own complement.</Text>
    </Svg>
    <Controls model={m}>
      <Choice label="Target class" value={m.draft.target} onChange={x => m.edit('target', x)} options={[[0, 'class 0'], [1, 'class 1'], [2, 'class 2']]} />
    </Controls>
    <Table caption="Each named complement column: exclude target, then add alpha once" headers={['column', 'other-class addition', 'observed pool', '+ alpha', 'normalized']} rows={[0, 1, 2].map(j => ['ABC'[j], complementCounts.filter((_, k) => k !== c).map(row => row[j]).join(' + '), pooled[j], pooled[j] + 1, f((pooled[j] + 1) / (sum(pooled) + 3))])} />
    <ClassLegend three />
  </Figure>;
}
export function ComplementScores() {
  const m = useDraft({
      query: '2, 0, 1',
      alpha: '1',
      norm: 'false'
    }, d => complement(num(d.alpha), d.norm === 'true', vector(d.query, {
      minLength: 3,
      maxLength: 3,
      low: 0,
      high: 20,
      integer: true
    }))),
    v = m.value;
  const [focus, setFocus] = useState('query');
  const scale = 300 / Math.max(1, ...v.values.filter(Number.isFinite));
  return <Figure title="Negative log complement evidence selects the largest score" caption="Complete weight rows are normalized when norm=True. The resulting softmax is a score normalization, not the literal posterior of a generative complement law.">
    <p>Active valid query [{v.query.join(', ')}]; alpha {v.alpha}; norm {String(v.norm)}.</p>
    <Svg height={270} label="Class negative log complement score bars on a common scale">
      {v.values.map((s, c) => <g key={c}>
        <Mark x={25} y={55 + c * 70} c={c} />
        <Text x={48} y={60 + c * 70}>class {c}</Text>
        {Number.isFinite(s) ? <rect x={150} y={36 + c * 70} width={s * scale} height={25} fill={classColors[c]} stroke={v.decision === c ? 'white' : undefined} strokeWidth={3} /> : <Text x={150} y={60 + c * 70}>unsupported score</Text>}
        <Text x={510} y={60 + c * 70}>
          {f(s)}
        </Text>
      </g>)}
      <Text x={150} y={265}>zero origin; {f(scale, 2)} pixels per score unit</Text>
    </Svg>
    <Controls model={{
      ...m,
      reset: () => {
        m.reset();
        setFocus('query');
      }
    }}>
      <Choice label="Investigation focus" value={focus} onChange={setFocus} options={[['query', 'query products'], ['normalization', 'alpha and full-row normalization']]} />
      {focus === 'query' ? <Field label="Query counts A, B, C" value={m.draft.query} onChange={x => m.edit('query', x)} vector help="three integers 0–20" /> : <>
        <Field label="Alpha" value={m.draft.alpha} onChange={x => m.edit('alpha', x)} help="0 or 1e-8–10" />
        <Choice label="Normalize weight row" value={m.draft.norm} onChange={x => m.edit('norm', x)} options={[['false', 'norm=False'], ['true', 'norm=True']]} />
      </>}
    </Controls>
    <Table caption="Full row weights, prior to multiplying query counts" headers={['class', 'A', 'B', 'C', 'row weight sum']} rows={v.weights.map((row, c) => [c, ...row.map(x => f(x)), f(sum(row))])} />
    <Table caption="Actual current query products before class comparison" headers={['class', 'A product', 'B product', 'C product', 'score sum']} rows={v.weights.map((row, c) => [c, ...row.map((x, j) => f(x * v.query[j])), f(v.values[c])])} />
    <Probability values={v.probabilities} />
    <Result>
      <p>Maximum-score decision: {v.decision === null ? 'undefined' : v.decision}. A one-word normalized zero-weight row uses the declared zero-weight convention.</p>
    </Result>
  </Figure>;
}
export function Rarity() {
  const m = useDraft({
      kind: 'prior',
      prior: '.02',
      lr: '9',
      cost: '20',
      independent: '4',
      copies: '49'
    }, d => {
      const prior = finite(num(d.prior), .001, .999, 'Prior'),
        lr = finite(num(d.lr), .01, 100, 'Likelihood ratio'),
        cost = finite(num(d.cost), .01, 100, 'Missed-fault cost'),
        independent = finite(num(d.independent), 1, 196, 'Independent fault records'),
        copies = finite(num(d.copies), 1, 100, 'Copies per record');
      if (!Number.isInteger(independent) || !Number.isInteger(copies)) throw Error('Evidence counts must be integers.');
      const odds = prior / (1 - prior) * lr;
      return {
        kind: d.kind,
        prior,
        lr,
        cost,
        independent,
        copies,
        p: odds / (1 + odds),
        balanced: lr / (1 + lr),
        threshold: 1 / (1 + cost)
      };
    }),
    v = m.value;
  return <Figure title="Choose which rare-class problem the intervention addresses" caption="Prevalence, independent evidence volume, likelihood representation and action costs enter different ports. Each view keeps the other quantities explicit.">
    <Svg height={330} label={'Rare-class ' + v.kind + ' mechanism'}>
      {v.kind === 'prior' ? [[v.prior, 'deployment prior'], [.5, 'balanced prior'], [v.p, 'deployment posterior'], [v.balanced, 'balanced posterior']].map(([p, name], j) => <g key={name}>
        <Text x={20} y={43 + j * 60}>
          {name}
        </Text>
        <rect x={245} y={25 + j * 60} width={360} height={24} fill="#36363c" />
        <rect x={245} y={25 + j * 60} width={360 * p} height={24} fill={classColors[1]} />
        <Text x={630} y={43 + j * 60}>
          {f(p)}
        </Text>
      </g>) : v.kind === 'evidence' ? <>
        <Text x={20} y={35}>distinct records retain their identity through copies</Text>
        {Array.from({
          length: Math.min(8, v.independent)
        }, (_, j) => <g key={j}>
          <Mark x={60 + j * 75} y={90} c={1} />
          <Text x={60 + j * 75} y={120} anchor="middle">#{j + 1}</Text>
          <Arrow x1={60 + j * 75} y1={135} x2={60 + j * 75} y2={180} />
          <Text x={60 + j * 75} y={210} anchor="middle">×{v.copies}</Text>
        </g>)}
        <Text x={20} y={263}>raw copied rows {v.independent * v.copies}; independent volume remains {v.independent}</Text>
        <Text x={20} y={305}>First up to eight identities drawn; all counts are shown. No likelihood is refitted.</Text>
      </> : v.kind === 'likelihood' ? <>
        {[1 / (1 + v.lr), v.lr / (1 + v.lr)].map((p, c) => <g key={c}>
          <Mark x={25} y={80 + c * 100} c={c} />
          <Text x={50} y={85 + c * 100}>P(E | class {c})</Text>
          <rect x={245} y={60 + c * 100} width={350 * p} height={28} fill={classColors[c]} />
          <Text x={620} y={85 + c * 100}>
            {f(p)}
          </Text>
        </g>)}
        <Text x={20} y={285}>Illustrative event table: rates 1/(1+LR), LR/(1+LR); ratio={f(v.lr)}</Text>
      </> : <>
        <line x1={80} y1={255} x2={560} y2={255} stroke="#aaa" />
        <line x1={80} y1={255} x2={80} y2={55} stroke="#aaa" />
        <line x1={80} y1={255 - 200 / Math.max(1, v.cost)} x2={560} y2={255} stroke="#b79cff" strokeWidth={3} />
        <line x1={80} y1={255} x2={560} y2={255 - 200 * v.cost / Math.max(1, v.cost)} stroke="#78d3ea" strokeWidth={3} />
        <Text x={80} y={285}>p=0</Text>
        <Text x={560} y={285}>p=1</Text>
        <Text x={585} y={90}>flag: 1×(1−p)</Text>
        <Text x={585} y={145}>allow: {f(v.cost)}×p</Text>
        <Text x={585} y={200}>crossing {f(v.threshold)}</Text>
        <Text x={80} y={325}>cost height 0–{f(Math.max(1, v.cost))}; complete common scale</Text>
      </>}
    </Svg>
    <Controls model={m}>
      <Choice label="Intervention" value={m.draft.kind} onChange={x => m.edit('kind', x)} options={['prior', 'evidence', 'likelihood', 'cost'].map(x => [x, x])} />
      {v.kind === 'prior' ? <Field label="Deployment fault prior" value={m.draft.prior} onChange={x => m.edit('prior', x)} help=".001–.999" /> : v.kind === 'evidence' ? <>
        <Field label="Independent fault records" value={m.draft.independent} onChange={x => m.edit('independent', x)} help="integer 1–196" />
        <Field label="Copies per record" value={m.draft.copies} onChange={x => m.edit('copies', x)} help="integer 1–100" />
      </> : v.kind === 'likelihood' ? <Field label="Likelihood ratio" value={m.draft.lr} onChange={x => m.edit('lr', x)} help=".01–100" /> : <Field label="Missed-fault cost; false alarm=1" value={m.draft.cost} onChange={x => m.edit('cost', x)} help=".01–100" />}
    </Controls>
    <Result>
      <p>Held-active deployment prior {f(v.prior)}, LR {f(v.lr)}: posterior {f(v.p)} versus balanced-prior {f(v.balanced)}. Independent fault records {v.independent}; copied raw rows {v.independent * v.copies}.</p>
      <p>Action threshold 1/(1+{f(v.cost)}) = {f(v.threshold)}; deployment action {v.p > v.threshold ? 'flag' : 'allow'}. This evidence-count view inspects observation ownership; it does not run a new estimator.</p>
    </Result>
  </Figure>;
}
export function Sparse() {
  const arrays = observations.nb_discrete_library.sparse_arrays;
  const m = useDraft({
      row: '0'
    }, d => {
      const row = num(d.row);
      if (!Number.isInteger(row) || row < 0 || row > 6) throw Error('Use row 0–5 or the separate empty query.');
      return row;
    }),
    row = m.value,
    start = arrays.indptr[row],
    stop = row === 6 ? start : arrays.indptr[row + 1];
  const products = observations.nb_discrete_library.theta.map(theta => arrays.data.slice(start, stop).map((x, j) => x * Math.log(theta[arrays.indices[start + j]]))),
    scoreValues = products.map(row => Math.log(.5) + sum(row)),
    normalized = scores(scoreValues);
  return <Figure title="CSR stores only values and their named column indices" caption="indptr selects a row span. Each selected data value follows its matching index into the class parameter table.">
    <Svg width={900} height={340} label="CSR indptr span, data and indices arrays with matching named parameters">
      <Text x={20} y={30}>indptr</Text>
      {arrays.indptr.map((v, j) => <g key={j}>
        <rect x={120 + j * 77} y={10} width={65} height={38} fill="none" stroke={j === row || j === row + 1 ? 'white' : '#777'} />
        <Text x={152 + j * 77} y={36} anchor="middle">
          {v}
        </Text>
      </g>)}
      <Text x={20} y={110}>data</Text>
      <Text x={20} y={180}>indices</Text>
      {arrays.data.map((v, j) => <g key={j}>
        <rect x={120 + j * 77} y={85} width={65} height={38} fill="none" stroke={j >= start && j < stop ? 'white' : '#777'} />
        <Text x={152 + j * 77} y={111} anchor="middle">
          {v}
        </Text>
        <rect x={120 + j * 77} y={155} width={65} height={38} fill="none" stroke={j >= start && j < stop ? 'white' : '#777'} />
        <Text x={152 + j * 77} y={181} anchor="middle">
          {arrays.indices[j]}
        </Text>
        {j >= start && j < stop && <>
          <Arrow x1={152 + j * 77} y1={195} x2={210 + arrays.indices[j] * 210} y2={256} />
          <Text x={152 + j * 77} y={72} anchor="middle">slot {j}</Text>
        </>}
      </g>)}
      {['A', 'B', 'C'].map((word, j) => <Text key={word} x={210 + j * 210} y={283} anchor="middle">column {j}: {word} parameter</Text>)}
      <Text x={20} y={325}>row {row} span [{start},{stop}); dense counts [{(sparseRows[row] || [0, 0, 0]).join(', ')}]</Text>
    </Svg>
    <Controls model={m}>
      <Choice label="CSR row" value={m.draft.row} onChange={x => m.edit('row', x)} options={[...sparseRows.map((_, j) => [j, `row ${j}`]), [6, 'separate empty query']]} />
    </Controls>
    <Table caption="Selected stored products and one prior" headers={['class', 'each stored x × log θ', 'likelihood log sum', '+ log .5 = score']} rows={products.map((terms, c) => [c, terms.map((term, j) => `${arrays.data[start + j]} × log(${f(observations.nb_discrete_library.theta[c][arrays.indices[start + j]])}) = ${f(term)}`).join('; ') || 'no stored terms', f(sum(terms)), f(scoreValues[c])])} />
    <Probability values={normalized.probabilities} />
    <Result>
      <p>The separate empty query is an inference example, not an added row in the six-row training fixture.</p>
      <p>For class c, only stored products xⱼ log θcⱼ enter the count score. Empty rows have start=stop and no token terms. Duplicate sparse column indices must be combined consistently.</p>
    </Result>
  </Figure>;
}
export function FoldPorts() {
  return <Figure title="Each fold learns its own vocabulary and class table" caption="The retained twenty-text experiment uses fourteen development rows and six final test rows. Selection chooses alpha .5 before the final fourteen-row fit.">
    <Svg width={1080} height={660} label="Three separate vocabulary and class parameter tables inside training fold lanes">
      {[0, 1, 2].map(j => <g key={j}>
        <rect x={10} y={12 + j * 185} width={1030} height={162} fill="none" stroke="#555" />
        <Text x={25} y={40 + j * 185}>fold {j + 1}: fit rows</Text>
        <Arrow x1={190} y1={35 + j * 185} x2={265} y2={35 + j * 185} />
        <Text x={285} y={40 + j * 185}>fitted vocabulary {j + 1}</Text>
        {['word', 'column j'].map((x, k) => <g key={k}>
          <rect x={285 + k * 110} y={52 + j * 185} width={102} height={32} fill="none" stroke="#b79cff" />
          <Text x={336 + k * 110} y={74 + j * 185} anchor="middle">
            {x}
          </Text>
        </g>)}
        <Arrow x1={505} y1={68 + j * 185} x2={575} y2={68 + j * 185} />
        <Text x={595} y={40 + j * 185}>fitted NB table {j + 1}</Text>
        {[0, 1].map(c => <g key={c}>
          <rect x={595} y={52 + c * 35 + j * 185} width={250} height={32} fill="none" stroke={classColors[c]} />
          <Text x={610} y={74 + c * 35 + j * 185} color={classColors[c]}>class {c}: θc,j and prior</Text>
        </g>)}
        <Text x={25} y={150 + j * 185}>fold {j + 1} held-out</Text>
        <Arrow x1={190} y1={145 + j * 185} x2={265} y2={145 + j * 185} dashed />
        <Text x={285} y={150 + j * 185}>frozen vocabulary → transform</Text>
        <Arrow x1={552} y1={145 + j * 185} x2={575} y2={145 + j * 185} dashed />
        <Text x={595} y={150 + j * 185}>frozen NB → scores → loss</Text>
      </g>)}
      <Text x={20} y={598}>validation losses → choose α=.5 → fit complete pipeline on 14</Text>
      <Text x={20} y={642}>six test rows → frozen final vocabulary/NB → report (no fit arrow)</Text>
    </Svg>
    <p>The small tables draw each fold's learned objects and lookup schema; θc,j denotes a fitted class/word entry, not a newly measured number. Each lane gets its own vocabulary and parameters from the exact fit IDs below.</p>
    <Table caption="Exact retained row IDs; each held-out set is disjoint from its fold fit" headers={['role', 'fit IDs', 'held-out IDs']} rows={[...textFoldRoles.folds.map((fold, j) => ['fold ' + (j + 1), fold.fit.join(', '), fold.validation.join(', ')]), ['final', textFoldRoles.train.join(', '), textFoldRoles.test.join(', ')]]} />
    <Result>
      <p>Fitted preprocessing belongs inside every fold. The final training-only vocabulary has 32 words in the retained run. Exact row-role correspondence is shown in the source-bound author fixture.</p>
    </Result>
  </Figure>;
}
export function Selection() {
  const data = observations['nb-feature-selection'];
  const m = useDraft({
      feature: '0',
      method: 'MI'
    }, d => {
      const j = num(d.feature);
      if (!Number.isInteger(j) || j < 0 || j > 6) throw Error('Select a fitted feature.');
      return {
        j,
        method: d.method
      };
    }),
    v = m.value,
    table = data.presence_definition.tables_class_by_absent_present[v.j];
  const rows = table.map(sum),
    cols = [sum(table.map(x => x[0])), sum(table.map(x => x[1]))],
    expected = table.map((r, c) => r.map((_, j) => rows[c] * cols[j] / 8));
  return <Figure title="Presence contingency and count chi-square use different operands" caption="The selected train-only transform retains alarm, routine and urgent. Method names do not make their numerical statistics interchangeable.">
    {v.method === 'count chi2' ? <Svg height={280} label="Observed and expected token mass by class for count chi2">
      {featureCountMasses[v.j].map((mass, c) => {
        const expected = sum(featureCountMasses[v.j]) / 2,
          scale = 300 / Math.max(1, ...featureCountMasses[v.j]);
        return <g key={c}>
        <Mark x={25} y={60 + c * 90} c={c} />
        <Text x={50} y={65 + c * 90}>class {c}</Text>
        <rect x={170} y={35 + c * 90} width={mass * scale} height={20} fill={classColors[c]} />
        <rect x={170} y={63 + c * 90} width={expected * scale} height={20} fill="none" stroke={classColors[c]} strokeDasharray="5 4" />
        <Text x={500} y={55 + c * 90}>observed {mass} tokens</Text>
        <Text x={500} y={86 + c * 90}>expected {f(expected)} tokens</Text>
      </g>;
      })}
      <Text x={20} y={252}>Each class has 4 documents: expected token mass = total × 4/8</Text>
    </Svg> : <Svg height={280} label="Actual and independence-expected presence contingency cells">
      {table.map((row, c) => row.map((count, j) => <g key={`${c}${j}`}>
        <rect x={120 + j * 180} y={50 + c * 80} width={155} height={60} fill={classColors[c]} opacity={.13} />
        <Text x={135 + j * 180} y={76 + c * 80}>observed {count}</Text>
        <Text x={135 + j * 180} y={99 + c * 80}>expected {f(expected[c][j])}</Text>
      </g>))}
      <Text x={130} y={35}>absent</Text>
      <Text x={310} y={35}>present</Text>
      <Text x={20} y={85}>class 0</Text>
      <Text x={20} y={165}>class 1</Text>
      <Text x={520} y={85}>row totals {rows.join(', ')}</Text>
      <Text x={520} y={145}>column totals {cols.join(', ')}</Text>
      <Text x={120} y={252}>common row unit: one of 8 training records</Text>
    </Svg>}
    <Controls model={m}>
      <Choice label="Feature identity" value={m.draft.feature} onChange={x => m.edit('feature', x)} options={data.feature_names.map((name, j) => [j, name])} />
      <Choice label="Statistic focus" value={m.draft.method} onChange={x => m.edit('method', x)} options={['MI', 'Pearson', 'count chi2'].map(x => [x, x])} />
    </Controls>
    <Result>
      <p>Selected {data.feature_names[v.j]} / {v.method}: {f(v.method === 'MI' ? data.presence_definition.MI_nats[v.j] : v.method === 'Pearson' ? data.presence_definition.Pearson_chi2[v.j] : data.sklearn_count_chi2[v.j])}.</p>
      <p>
        {v.method === 'MI' ? 'Presence MI sums observed/8 × log(observed/expected), with zero observed terms omitted.' : v.method === 'Pearson' ? 'Presence Pearson sums (observed−expected)²/expected across the displayed 2×2 cells.' : `Count chi2 uses token mass [${featureCountMasses[v.j].join(', ')}], expected ${sum(featureCountMasses[v.j]) / 2} in each class. It does not use an absent column. For alarm, the count statistic is 3 versus presence Pearson 8/3.`}
      </p>
    </Result>
    <Table caption="Saved seven-feature statistics" headers={['feature', 'MI nats', 'presence Pearson', 'count chi2', 'kept']} rows={data.feature_names.map((name, j) => [name, f(data.presence_definition.MI_nats[j]), f(data.presence_definition.Pearson_chi2[j]), f(data.sklearn_count_chi2[j]), data.stored_transform.MI_selected_indices.includes(j) ? 'yes' : 'no'])} />
  </Figure>;
}
const streamWords = ['free', 'money', 'win', 'prize', 'meeting', 'agenda', 'report', 'quarter'];
const firstRows = [[3, 2, 1, 1, 0, 0, 0, 0], [2, 3, 2, 0, 0, 0, 0, 0], [1, 1, 3, 2, 0, 0, 0, 0], [4, 2, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 2, 3, 1, 1], [0, 0, 0, 0, 1, 1, 3, 2], [0, 1, 0, 0, 3, 2, 1, 0], [0, 0, 0, 0, 2, 1, 2, 3]];
export function Packets() {
  const rows = [...firstRows, ...firstRows.slice(0, 6)],
    labels = [1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0];
  const m = useDraft({
      size: '4'
    }, d => {
      const n = num(d.size);
      if (!Number.isInteger(n) || n < 1 || n > 14) throw Error('Use an integer chunk size 1–14.');
      return n;
    }),
    size = m.value,
    packets = Array.from({
      length: Math.ceil(14 / size)
    }, (_, j) => rows.slice(j * size, (j + 1) * size).map((_, i) => j * size + i));
  const counters = [0, 1].map(c => streamWords.map((_, j) => sum(rows.filter((_, i) => labels[i] === c).map(row => row[j]))));
  return <Figure title="The remainder is real data, not padding" caption="Changing packet boundaries preserves fourteen row identities and the same raw counters. Alpha enters only the separate table derivation port.">
    <Svg width={850} height={150 + packets.length * 50} label="Same fourteen row IDs grouped into alternative chunks">
      {packets.map((ids, j) => <g key={j}>
        <Text x={20} y={35 + j * 50}>packet {j + 1}</Text>
        {ids.map((id, i) => <g key={id}>
          <rect x={130 + i * 44} y={15 + j * 50} width={38} height={28} fill="none" stroke={classColors[labels[id]]} />
          <Text x={149 + i * 44} y={36 + j * 50} anchor="middle" color={classColors[labels[id]]}>
            {id}
          </Text>
        </g>)}
        <Text x={765} y={36 + j * 50}>{ids.length} rows</Text>
      </g>)}
      <Text x={20} y={90 + packets.length * 50}>14 rows → raw class/feature counts → + α once → probabilities</Text>
      <Text x={20} y={130 + packets.length * 50}>At size 4: packets 4/4/4/2. The faulty floor loop consumes only 12 rows.</Text>
    </Svg>
    <Controls model={m}>
      <Field label="Chunk size" value={m.draft.size} onChange={x => m.edit('size', x)} help="integer 1–14" />
    </Controls>
    <Table caption="Final raw state, independent of these packet boundaries" headers={['class', 'document count', ...streamWords]} rows={counters.map((row, c) => [c, labels.filter(y => y === c).length, ...row])} />
  </Figure>;
}
export function PriorShift() {
  const m = useDraft({
      prior: String(2 / 3)
    }, d => tokenEvidenceState('free meeting', 1, num(d.prior))),
    v = m.value;
  const bias = Math.log(v.spamPrior / (1 - v.spamPrior)),
    evidence = v.final.logOdds - bias;
  return <Figure title="Move the prior bias while holding both word tables fixed" caption="The conditional likelihood does not move with this control. A separate changed-likelihood fixture illustrates a different shift.">
    <Svg height={230} label="Common log odds axis with prior translation and unchanged word evidence">
      {[-4, -2, 0, 2, 4].map(t => <Text key={t} x={380 + t * 60} y={195} anchor="middle">
        {t}
      </Text>)}
      <line x1={80} y1={170} x2={680} y2={170} stroke="#aaa" />
      <line x1={380} y1={35} x2={380} y2={170} stroke="white" />
      <Arrow x1={380} y1={75} x2={380 + bias * 60} y2={75} color="#e7c37d" />
      <Text x={20} y={80}>prior</Text>
      <Arrow x1={380 + bias * 60} y1={125} x2={380 + (bias + evidence) * 60} y2={125} color="#b79cff" />
      <Text x={20} y={130}>fixed likelihood ratio</Text>
    </Svg>
    <Controls model={m}>
      <Field label="Deployment spam prior" value={m.draft.prior} onChange={x => m.edit('prior', x)} help=".01–.99" />
    </Controls>
    <Probability values={v.final.probabilities} />
    <Result>
      <p>Prior log odds {f(bias)} + fixed evidence {f(evidence)} = {f(v.final.logOdds)}.</p>
      <p>Conditional shift example: changing P(free|spam) from 4/11 to 2/11 subtracts log 2 from this evidence. A prior-only adjustment does not make that changed table equal to the original.</p>
    </Result>
  </Figure>;
}
export function Study() {
  const state = observations.state,
    study = observations.study;
  const initial = Array(57).fill(0);
  initial[0] = 1;
  initial.splice(54, 3, 2, 4, 8);
  const m = useDraft({
      raw: initial.join(', '),
      family: 'logistic'
    }, d => {
      const raw = vector(d.raw, {
        minLength: 57,
        maxLength: 57,
        low: 0,
        high: 1e9
      });
      return {
        raw,
        family: d.family,
        ...savedInference(raw, d.family, state)
      };
    }),
    v = m.value;
  const outcomes = study.all_validation_outcomes,
    reports = Object.entries(study.test_reports);
  return <Figure title="Read the locked study; inspect one unlabelled saved-state query" caption="One row is an email's supplied 57 statistics. Percentage fields are 0–100; capital fields have different units. No controls fit models or change measured outcomes.">
    <StudyFeatureUnits />
    <StudyGroups />
    <SavedQueryPorts value={v} />
    <Table caption="Every original validation outcome; winner locked before test" headers={['ID', 'family / representation', 'setting', 'validation log loss', 'eligibility']} rows={outcomes.map(row => {
      const c = row.configuration;
      return [c.id, c.family + ' / ' + c.representation, String(c.var_smoothing ?? c.alpha ?? c.C), row.validation ? f(row.validation.log_loss, 6) : 'failed', row.eligible ? 'eligible' : JSON.stringify(row.failure || row.error || row.warnings)];
    })} />
    <Result>
      <p>Overall winner: {study.overall_winner}. Family winners: {Object.entries(study.family_winners).map(([k, x]) => `${k} ${x}`).join('; ')}. All models retain training-only state.</p>
      <p>Candidate 12's nonfinite log-probability failure remains ineligible. The original selected-logistic test-report API underflow is preserved; stable logs use the same saved decision coefficients, with zero refits or retries.</p>
    </Result>
    <Table caption="Untouched test: distinct accuracy, proper losses and action performance" headers={['route', 'accuracy', 'balanced acc.', 'log loss', 'Brier', 'confusion ham/spam', 'actions .8', '4:1 cost']} rows={reports.map(([name, r]) => [name, f(r.accuracy, 6), f(r.balanced_accuracy, 6), f(r.log_loss, 6), f(r.Brier, 6), JSON.stringify(r.confusion_ham_spam), r.positive_actions_at_08, f(r.cost_4_to_1_at_08, 6)])} />
    <Svg height={310} label="Recorded log loss on a labelled logarithmic scale">
      {reports.map(([name, r], j) => <g key={name}>
        <Text x={20} y={45 + j * 60}>
          {name}
        </Text>
        <line x1={200} y1={40 + j * 60} x2={200 + (Math.log10(r.log_loss) + 1) * 220} y2={40 + j * 60} stroke="#ccc" strokeWidth={3} />
        <circle cx={200 + (Math.log10(r.log_loss) + 1) * 220} cy={40 + j * 60} r={5} fill="#b79cff" />
        <Text x={680} y={45 + j * 60}>
          {f(r.log_loss)}
        </Text>
      </g>)}
      {[.1, 1, 10].map(t => <Text key={t} x={200 + (Math.log10(t) + 1) * 220} y={282} anchor="middle">
        {t}
      </Text>)}
      <Text x={200} y={307}>logarithmic loss axis; equal distance = ×10</Text>
    </Svg>
    <Controls model={m}>
      <Field label="All 57 raw fields, in saved schema order" value={m.draft.raw} onChange={x => m.edit('raw', x)} vector help="54 percentages then capital average,longest,total; all zero or 1≤avg≤long≤total" />
      <Choice label="Frozen family" value={m.draft.family} onChange={x => m.edit('family', x)} options={['Gaussian', 'Bernoulli', 'logistic'].map(x => [x, x])} />
    </Controls>
    <Table caption="Complete current unlabelled raw vector and its active representation" headers={['index / field', 'raw', 'model input']} rows={state.models.candidate_11.raw_schema.map((name, j) => [`${j}: ${name}`, f(v.raw[j]), j < v.transformed.length ? f(v.transformed[j]) : 'not used'])} />
    <Probability values={v.probabilities} />
    <Result>
      <p>{v.family} log probabilities: [{v.logs.map(x => f(x)).join(', ')}]. This is query inference, not a new test outcome. Collection limits include personalised ham features, unavailable time and near-duplicate campaign identity.</p>
    </Result>
  </Figure>;
}
