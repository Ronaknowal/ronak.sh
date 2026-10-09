import { words, wordColors, classColors } from '../../data/naive-bayes-reading-flow-models.js';
import { Svg, Text, Arrow, Mark, Port, RecordStack, f } from './NaiveBayesReadingFlowElements.jsx';

export function ClassRoutes() {
  const fractions = [['1/7', '1/7', '1/7', '2/7', '2/7'], ['4/11', '3/11', '2/11', '1/11', '1/11']];
  return <>
    <Svg width={400} height={350} label="Illustrative count plane with a zero-score boundary">
      <line x1={60} y1={280} x2={310} y2={280} stroke="#bbb" />
      <line x1={60} y1={280} x2={60} y2={45} stroke="#bbb" />
      <Text x={85} y={340}>free count →</Text>
      <Text x={60} y={30}>meeting count ↑</Text>
      <line x1={75} y1={255} x2={260} y2={80} stroke="white" />
      {[[1, 3, 0], [2, 2, 0], [3, 0, 1], [4, 1, 1]].map(([x, y, c], index) =>
        <Mark key={index} x={60 + x * 48} y={280 - y * 48} c={c} />)}
      <Text x={100} y={65}>score = 0</Text>
      {[0, 1, 2, 3, 4].map(tick => <g key={tick}>
        <Text x={60 + tick * 48} y={300} anchor="middle">{tick}</Text>
        <Text x={50} y={285 - tick * 48} anchor="end">{tick}</Text>
      </g>)}
    </Svg>
    <Svg width={900} height={330} label="Two class roots feed fitted indexed word-composition rows">
      <Text x={20} y={28}>Supplied toy fitted state; section 3 builds its training counts.</Text>
      {fractions.map((row, c) => <g key={c}>
        <Mark x={30} y={107 + c * 125} c={c} />
        <Text x={50} y={113 + c * 125} color={classColors[c]}>class {c}</Text>
        <Arrow x1={105} y1={107 + c * 125} x2={145} y2={107 + c * 125} color={classColors[c]} />
        {words.map((word, column) => <g key={word}>
          <Text x={157 + column * 125} y={73 + c * 125} color={wordColors[column]}>{column}: {word}</Text>
          <rect x={150 + column * 125} y={85 + c * 125} width={115} height={48}
            fill="none" stroke={column === 0 ? 'white' : classColors[c]} />
          <Text x={165 + column * 125} y={115 + c * 125} color={wordColors[column]}>{row[column]}</Text>
        </g>)}
        <Port x={790} y={85 + c * 125} width={90} lines={['prior', c ? '2/3' : '1/3']} color={classColors[c]} />
      </g>)}
      <Text x={20} y={312}>Each row sums to 1. Word labels stay attached to their fitted columns.</Text>
    </Svg>
    <Svg width={1050} height={390} label="One supplied query selects word likelihoods, multiplies priors and enters Bayes normalization">
      <Port x={20} y={20} width={300} lines={['supplied query Q = free', 'counts [1,0,0,0,0]; label ?']} color="white" />
      {[0, 1].map(c => <g key={c}>
        <Port x={20} y={137 + c * 110} width={145} lines={['Q: free count 1', 'other counts 0']} color={wordColors[0]} />
        <Arrow x1={165} y1={170 + c * 110} x2={210} y2={170 + c * 110} color={wordColors[0]} />
        <Port x={210} y={137 + c * 110} width={220} lines={['lookup θ' + c + ',free', c ? '(4/11)¹ = 4/11' : '(1/7)¹ = 1/7']} color={wordColors[0]} />
        <Arrow x1={430} y1={170 + c * 110} x2={475} y2={170 + c * 110} color={classColors[c]} />
        <Port x={475} y={137 + c * 110} width={250} lines={['× fitted prior; class ' + c, c ? '4/11 × 2/3 = 8/33' : '1/7 × 1/3 = 1/21']} color={classColors[c]} />
        <Arrow x1={725} y1={170 + c * 110} x2={775} y2={200 + c * 40} color={classColors[c]} />
      </g>)}
      <Arrow x1={90} y1={88} x2={90} y2={137} color="white" />
      <Arrow x1={90} y1={205} x2={90} y2={247} color="white" dashed />
      <Port x={775} y={170} width={250} lines={['shared evidence 67/231', 'divide both joint weights', 'P(0|Q)=11/67', 'P(1|Q)=56/67']} />
      <Text x={20} y={363}>Joint class likelihood, conditional logistic loss and SVM margin are different fitting objectives.</Text>
    </Svg>
  </>;
}

export function DataRolePorts() {
  return <>
    <Svg width={1010} height={470} label="Labelled training record cells enter count fitting and a named frozen vocabulary grid">
      <RecordStack x={20} y={45} label="Representative training records (symbolic)"
        rows={[['T₀', 'x₀₀', 'x₀₁', 'y(T₀)'], ['T₁', 'x₁₀', 'x₁₁', 'y(T₁)']]} />
      <Arrow x1={350} y1={121} x2={405} y2={121} />
      <Port x={405} y={85} width={250} lines={['FIT counts and class mass', 'training features + targets']} />
      <Arrow x1={655} y1={121} x2={710} y2={121} />
      <Port x={710} y={85} width={275} lines={['FREEZE fitted state', 'vocabulary, θ and class prior']} />
      <Arrow x1={845} y1={153} x2={845} y2={235} />
      <Text x={20} y={225}>Named indexed fitted vocabulary / class table</Text>
      {words.map((word, column) => <g key={word}>
        <Text x={135 + column * 170} y={267} color={wordColors[column]}>{column}: {word}</Text>
        {[0, 1].map(c => <g key={c}>
          <rect x={125 + column * 170} y={285 + c * 56} width={155} height={48} fill="none" stroke={classColors[c]} />
          <Text x={140 + column * 170} y={314 + c * 56} color={wordColors[column]}>θ{c},{column}</Text>
        </g>)}
      </g>)}
      <Text x={20} y={314} color={classColors[0]}>class 0</Text>
      <Text x={20} y={370} color={classColors[1]}>class 1</Text>
      <Text x={20} y={422}>Symbols denote fitted values, not an additional measured model.</Text>
      <Text x={20} y={451}>The same feature index is used when a later row looks up θ.</Text>
    </Svg>
    <Svg width={1070} height={595} label="Held-out features enter frozen prediction; targets enter evaluation; query annotation remains empty">
      {['validation', 'test', 'new query'].map((role, index) => {
        const y = 45 + index * 180;
        const id = ['V₀', 'E₀', 'Q'][index];
        return <g key={role}>
          <RecordStack x={20} y={y} label={role + ' record; same indexed columns'}
            rows={[[id, 'x₀', 'x₁', index === 2 ? '?' : 'y(' + id + ')']]} />
          <Text x={370} y={y + 42}>features only</Text>
          <Arrow x1={267} y1={y + 57} x2={490} y2={y + 57} dashed />
          <Port x={490} y={y + 23} width={210} lines={['INFER ' + id, 'frozen θ and prior']} dashed />
          <Arrow x1={700} y1={y + 57} x2={745} y2={y + 57} dashed />
          <Port x={745} y={y + 23} width={125} lines={['prediction', 'p(' + id + ')']} dashed />
          {index < 2 ? <>
            <Arrow x1={870} y1={y + 57} x2={900} y2={y + 57} dashed />
            <Port x={900} y={y + 23} width={150} lines={['EVALUATE', 'p versus y']} dashed />
            <Arrow x1={308} y1={y + 70} x2={955} y2={y + 115} dashed />
            <Arrow x1={955} y1={y + 115} x2={955} y2={y + 91} dashed />
            <Text x={420} y={y + 120}>target y({id}) → evaluation only</Text>
          </> : <Text x={490} y={y + 130}>Empty annotation slot: no target enters prediction or fitting.</Text>}
        </g>;
      })}
    </Svg>
  </>;
}

export function CalibrationRolePorts() {
  const rows = prefix => [[prefix + '₀', 'x₀₀', 'x₀₁', `y(${prefix}₀)`], [prefix + '₁', 'x₁₀', 'x₁₁', `y(${prefix}₁)`], ['⋮', '⋮', '⋮', '⋮']];
  return <>
    <Svg width={1000} height={310} label="800 base records have separate feature and target inputs to base fit, then complete base state freezes">
      <RecordStack x={20} y={42} label="800 base-fit rows; representative symbolic slots" rows={rows('B')} headers={['ID', 'x₀', 'x₁', 'target']} />
      <Text x={365} y={80}>features</Text>
      <Arrow x1={267} y1={99} x2={460} y2={99} />
      <Port x={460} y={65} width={225} lines={['FIT base Gaussian', 'features input']} />
      <Arrow x1={308} y1={150} x2={540} y2={190} />
      <Text x={360} y={180}>base targets only</Text>
      <Port x={460} y={190} width={225} lines={['FIT base target input', 'y(B₀), y(B₁), …']} />
      <Arrow x1={575} y1={190} x2={575} y2={133} />
      <Arrow x1={685} y1={99} x2={745} y2={99} />
      <Port x={745} y={65} width={235} lines={['FREEZE complete base', 'representation + state']} />
      <Text x={20} y={292}>Recorded seed 2026 protocol. These symbolic slots are not new fitted observations.</Text>
    </Svg>
    <Svg width={1080} height={310} label="800 calibration feature rows reach frozen base predictions; only their separate targets fit the score mapping">
      <RecordStack x={20} y={42} label="800 calibration rows; disjoint from base" rows={rows('C')} headers={['ID', 'x₀', 'x₁', 'target']} />
      <Text x={365} y={80}>features only</Text>
      <Arrow x1={267} y1={99} x2={475} y2={99} dashed />
      <Port x={475} y={65} width={225} lines={['frozen base INFER', 'no base fit target']} dashed />
      <Arrow x1={700} y1={99} x2={750} y2={99} dashed />
      <Port x={750} y={65} width={125} lines={['fresh scores', 'p(C₀), …']} dashed />
      <Arrow x1={875} y1={99} x2={925} y2={99} />
      <Port x={925} y={65} width={135} lines={['FIT mapping', 'score input']} />
      <Arrow x1={308} y1={150} x2={990} y2={190} />
      <Text x={375} y={180}>calibration targets y(C₀), … → mapping only</Text>
      <Port x={925} y={190} width={135} lines={['target input', 'y(C₀), …']} />
      <Arrow x1={990} y1={190} x2={990} y2={133} />
      <Text x={20} y={292}>Freeze the fitted mapping g next. The 400-row practice is a separate retained experiment.</Text>
    </Svg>
    <Svg width={1120} height={370} label="The same 1200 test records and targets evaluate both frozen raw and mapped predictions without fitting">
      <RecordStack x={20} y={45} label="1,200 untouched test rows" rows={rows('E')} headers={['ID', 'x₀', 'x₁', 'target']} />
      <Text x={365} y={85}>features only</Text>
      <Arrow x1={267} y1={102} x2={475} y2={102} dashed />
      <Port x={475} y={68} width={205} lines={['frozen base INFER', 'p(E₀), p(E₁), …']} dashed />
      <Arrow x1={680} y1={102} x2={730} y2={75} dashed />
      <Port x={730} y={40} width={150} lines={['raw route', 'p(E₀), …']} dashed />
      <Arrow x1={680} y1={102} x2={730} y2={200} dashed />
      <Port x={730} y={165} width={150} lines={['frozen g', 'g(p(E₀)), …']} dashed />
      <Arrow x1={880} y1={75} x2={930} y2={75} dashed />
      <Arrow x1={880} y1={200} x2={930} y2={130} dashed />
      <Port x={930} y={40} width={170} lines={['EVALUATE both', 'same E row IDs', 'same targets y(E)']} dashed />
      <Arrow x1={308} y1={193} x2={980} y2={240} dashed />
      <Text x={365} y={258}>test targets → shared evaluation only</Text>
      <Arrow x1={980} y1={240} x2={980} y2={133} dashed />
      <Text x={20} y={332}>Neither test targets nor calibration targets enter base fitting.</Text>
    </Svg>
  </>;
}

export function MergeGeometry({ value }) {
  const { a, b, left, right, merged } = value;
  const origin = merged.n ? merged.mean : 0;
  const span = Math.max(1, ...[...a, ...b].map(x => Math.abs(x - origin)));
  const readingScale = 170 / span;
  const offsetA = left.n ? left.mean - origin : 0;
  const offsetB = right.n ? right.mean - origin : 0;
  const shiftedA = left.n * offsetA * offsetA;
  const shiftedB = right.n * offsetB * offsetB;
  const areas = [left.M2, shiftedA, right.M2, shiftedB, merged.M2];
  const sideScale = 130 / Math.max(1, ...areas.map(area => Math.sqrt(area)));
  return <>
    <Svg width={800} height={310} label="Actual group readings, group means and offsets from the merged mean on a common reading axis">
      {[{ readings: a, group: left, offset: offsetA, name: 'A', color: '#b79cff' },
        { readings: b, group: right, offset: offsetB, name: 'B', color: '#78d3ea' }].map(({ readings, group, offset, name, color }, index) => {
        const y = 87 + index * 95;
        return <g key={name}>
          <Text x={20} y={y - 30} color={color}>group {name}: n={group.n}; mean {group.n ? f(group.mean) : 'empty'}</Text>
          <line x1={160} y1={y} x2={530} y2={y} stroke="#777" />
          {readings.map((reading, row) => <g key={row}>
            <line x1={350 + (reading - origin) * readingScale} y1={y - 8}
              x2={350 + (group.mean - origin) * readingScale} y2={y - 8} stroke={color} strokeOpacity={.35} />
            <circle cx={350 + (reading - origin) * readingScale} cy={y - 8} r={4} fill={color}>
              <title>{name}{row}: reading {reading}; centered deviation {reading - group.mean}</title>
            </circle>
            {readings.length <= 6 && <Text x={350 + (reading - origin) * readingScale} y={y - 18} anchor="middle">{f(reading)}</Text>}
          </g>)}
          {group.n > 0 && <>
            <Arrow x1={350 + offset * readingScale} y1={y + 8} x2={350} y2={y + 8} color={color} />
            <circle cx={350 + offset * readingScale} cy={y} r={7} fill="none" stroke={color} strokeWidth={2} />
          </>}
          <Text x={550} y={y + 5}>mean offset {f(offset)}</Text>
        </g>;
      })}
      <line x1={350} y1={32} x2={350} y2={220} stroke="white" />
      <Text x={350} y={245} anchor="middle">merged mean {f(origin)}</Text>
      <Text x={20} y={283}>Common scale: {f(readingScale)} pixels per reading unit; centered deviations enter M2.</Text>
    </Svg>
    <Svg width={1080} height={370} label="Centered within-group squared areas and both recentering squared areas add to merged M2">
      {areas.map((area, index) => {
        const x = 20 + index * 210;
        const side = Math.sqrt(area) * sideScale;
        const titles = ['A within M2', 'A recentering', 'B within M2', 'B recentering', 'merged M2'];
        return <g key={titles[index]}>
          <Text x={x} y={30}>{titles[index]}</Text>
          {area ? <rect x={x} y={65} width={side} height={side} data-nb-square-area={area} data-nb-area-scale={sideScale * sideScale}
            fill={index < 2 ? '#b79cff' : index < 4 ? '#78d3ea' : '#bbb'}
            fillOpacity={.25} stroke={index < 2 ? '#b79cff' : index < 4 ? '#78d3ea' : '#bbb'} />
            : <Text x={x} y={107}>zero area</Text>}
          <Text x={x} y={224}>area = {f(area)}</Text>
          {(index === 1 || index === 3) && <>
            <Text x={x} y={253}>{index === 1 ? left.n : right.n} × ({f(index === 1 ? offsetA : offsetB)})²</Text>
            <Text x={x} y={278}>side √n × |offset|</Text>
          </>}
          {index < 4 && <Text x={x + 174} y={137}>{index === 3 ? '=' : '+'}</Text>}
        </g>;
      })}
      <Text x={20} y={317}>One area scale: {f(sideScale * sideScale)} pixels² per squared reading unit.</Text>
      <Text x={20} y={349}>Squares represent aggregate squared deviations, not probability or density.</Text>
    </Svg>
    <Svg width={850} height={190} label="Both group-mean offset sums form the between-group correction and join old M2 values">
      <Port x={20} y={20} width={250} lines={['recenter A + recenter B', `${f(shiftedA)} + ${f(shiftedB)} = ${f(merged.correction)}`]} />
      <Arrow x1={270} y1={54} x2={315} y2={54} />
      <Port x={315} y={20} width={510} lines={['M2A + M2B + between-group correction', `${f(left.M2)} + ${f(right.M2)} + ${f(merged.correction)} = ${f(merged.M2)}`]} />
      <Text x={20} y={126}>δ={f(merged.delta)}; correction δ² nA nB/(nA+nB)={f(merged.correction)}.</Text>
      <Text x={20} y={163}>Empty groups have no recentering square. Raw variance = M2/n, separately from any floor.</Text>
    </Svg>
  </>;
}

export function StudyFeatureUnits() {
  return <>
    <Svg width={900} height={435} label="Illustrative word and character numerators within known denominators form percentages">
      <Text x={20} y={28}>Illustrative units only; not a reconstructed Spambase email or unknown official denominator.</Text>
      {['word positions', 'character positions'].map((kind, row) => <g key={kind}>
        <Text x={20} y={74 + row * 175}>{kind}: 20 total</Text>
        {Array.from({ length: 20 }, (_, index) => {
          const selected = index === 0 || index === 3;
          const x = 25 + (index % 10) * 46;
          const y = 89 + Math.floor(index / 10) * 43 + row * 175;
          return <g key={index}>
            <rect x={x} y={y} width={40} height={35} fill={selected ? row ? '#78d3ea' : wordColors[0] : 'none'}
              fillOpacity={selected ? .25 : 1} stroke={selected ? row ? '#78d3ea' : wordColors[0] : '#777'} />
            <Text x={x + 20} y={y + 24} anchor="middle" color={selected ? row ? '#78d3ea' : wordColors[0] : '#aaa'}>
              {selected ? row ? '$' : 'free' : index + 1}
            </Text>
          </g>;
        })}
        <Arrow x1={493} y1={143 + row * 175} x2={540} y2={143 + row * 175} />
        <Port x={540} y={101 + row * 175} width={340}
          lines={[row ? 'character $: numerator 2' : 'word free: numerator 2', 'denominator 20 in these positions', '100 × 2/20 = 10%']} color={row ? '#78d3ea' : wordColors[0]} />
      </g>)}
      <Text x={20} y={420}>Official schema: 48 word percentages + 6 character percentages; no invented token counts.</Text>
    </Svg>
    <Svg width={900} height={265} label="Illustrative capital-letter runs have explicit lengths, average, longest and total">
      <Text x={20} y={28}>Separate illustrative capital runs: AB / CDEF / GH</Text>
      {['AB', 'CDEF', 'GH'].map((run, index) => <g key={run}>
        <Text x={20} y={78 + index * 55}>run {index + 1}</Text>
        {Array.from(run).map((letter, position) => <g key={position}>
          <rect x={100 + position * 35} y={53 + index * 55} width={35} height={35} fill="none" stroke="#f49c91" />
          <Text x={117 + position * 35} y={77 + index * 55} anchor="middle">{letter}</Text>
        </g>)}
        <Text x={280} y={78 + index * 55}>length {run.length}</Text>
      </g>)}
      <Arrow x1={375} y1={125} x2={425} y2={125} />
      <Port x={425} y={53} width={450} lines={['3 runs; lengths [2,4,2]', 'average = (2+4+2)/3 = 8/3', 'longest = 4; total = 8', 'These are different measurement units.']} />
      <Text x={20} y={246}>Official last three fields: capital average / longest / total. They are not percentages.</Text>
    </Svg>
  </>;
}

export function StudyGroups() {
  return <Svg width={1130} height={620} label="Each exact-vector group has one assignment edge to one disjoint role; a conflicting group keeps both labels">
    <Text x={20} y={28}>Saved protocol: 4,601 rows in 4,207 exact-feature-vector groups; 3 conflicting-label groups retained.</Text>
    <Text x={20} y={62}>Glyph IDs and group placements below are symbolic; the counts and role ownership are recorded.</Text>
    {[
      { role: 'training', rows: 2811, ham: 1682, spam: 1129, id: 'gA', labels: [0, 1], operation: 'fit representation + estimator' },
      { role: 'validation', rows: 890, ham: 547, spam: 343, id: 'gB', labels: [0, 0], operation: 'candidate selection only' },
      { role: 'test', rows: 900, ham: 559, spam: 341, id: 'gC', labels: [1, 1], operation: 'locked reports only' },
    ].map(({ role, rows, ham, spam, id, labels, operation }, index) => {
      const y = 85 + index * 170;
      return <g key={role}>
        <rect x={20} y={y} width={215} height={130} fill="none" stroke={index === 0 ? 'white' : '#aaa'} />
        <Text x={30} y={y + 25}>whole group {id}</Text>
        {labels.map((c, row) => <g key={row}>
          <Mark x={42} y={y + 57 + row * 35} c={c} />
          <Text x={60} y={y + 63 + row * 35}>same features z{id.slice(1)}</Text>
        </g>)}
        <Arrow x1={235} y1={y + 65} x2={280} y2={y + 65} />
        <Port x={280} y={y + 20} width={240} lines={['assign by group ID', 'without using labels', 'whole group → one role']} />
        <Arrow x1={520} y1={y + 65} x2={565} y2={y + 65} />
        <rect x={565} y={y} width={540} height={145} fill="none" stroke="#aaa" />
        <Text x={580} y={y + 25}>{role}: {rows} rows ({ham} ham / {spam} spam)</Text>
        <rect x={580} y={y + 40} width={160} height={63} fill="none" stroke={index === 0 ? 'white' : '#777'} />
        <Text x={590} y={y + 64}>{id}: both rows</Text>
        {labels.map((c, row) => <Mark key={row} x={600 + row * 35} y={y + 86} c={c} />)}
        <Text x={770} y={y + 64}>other whole groups ⋮</Text>
        <Text x={580} y={y + 130}>{operation}</Text>
      </g>;
    })}
    <Text x={20} y={597}>One edge per group, with all its rows/labels retained. Actual conflict placements are not asserted by these glyphs.</Text>
  </Svg>;
}

export function SavedQueryPorts({ value }) {
  const { raw, family } = value;
  return <Svg width={1070} height={250} label="A separate current unlabeled statistical query enters only saved representation and model state">
    <Text x={20} y={28}>Separate query Q; supplied statistics, not an observed test email</Text>
    {[0, 54, 55, 56].map((index, column) => <g key={index}>
      <rect x={20 + column * 130} y={57} width={120} height={85} fill="none" stroke="white" />
      <Text x={30 + column * 130} y={82}>{['0 make %', '54 avg', '55 longest', '56 total'][column]}</Text>
      <Text x={30 + column * 130} y={115}>{f(raw[index])}</Text>
    </g>)}
    <Text x={20} y={177}>Other indexed fields: complete vector table below. Target slot: ?</Text>
    <Arrow x1={540} y1={100} x2={590} y2={100} dashed />
    <Port x={590} y={57} width={250} lines={['saved ' + family, 'representation + parameters', 'INFER only; no fitting']} dashed />
    <Arrow x1={840} y1={100} x2={890} y2={100} dashed />
    <Port x={890} y={57} width={160} lines={['query posterior', 'and stable logs', 'label still ?']} dashed />
    <Text x={20} y={230}>Changing Q never changes the prefrozen validation choice, test reports or model arrays.</Text>
  </Svg>;
}
