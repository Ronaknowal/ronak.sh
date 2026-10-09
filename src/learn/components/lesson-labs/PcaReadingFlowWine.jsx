import { useState } from 'react';
import { CoordinatePlane } from './PcaReadingFlowFoundation.jsx';
import { formatNumber, recordNames } from "../../data/pca-geometry.js";
import { Arrow, Controls, Drawing, Figure, Matrix, NumberField, useNumericDrafts } from './PcaReadingFlowPrimitives.jsx';
import {
  budgetCrossing, cultivarColors, descriptiveCoordinates, featureColors,
  rectangleMetric, savedQuery, storageCounts, wineState
} from "../../data/pca-wine-state.js";

function Spectrum({ values, label, cumulative = false, selected = null, threshold = null }) {
  const width = 360;
  const left = 55;
  const top = 60;
  const height = 240;
  const step = 20;
  const running = [];
  let sum = 0;
  values.forEach(value => {
    sum += value;
    running.push(sum);
  });
  const display = cumulative ? running : values;
  const x = index => left + index * step;
  const y = value => top + height * (1 - value);
  return <Drawing width={width} height={350} title={label}
    description="Every component uses the labelled fraction range from zero to one. Individual bars show increments; the cumulative line adds those same increments.">
    {[0, .25, .5, .75, 1].map(value => <g key={value}>
      <line x1={left} x2={left + 260} y1={y(value)} y2={y(value)} stroke="#444" />
      <text x={left - 9} y={y(value) + 4} textAnchor="end">{value}</text>
    </g>)}
    {threshold !== null && <>
      <line x1={left} x2={left + 260} y1={y(threshold)} y2={y(threshold)}
        stroke="#efbd6d" strokeDasharray="5 4" />
      <text x={left + 254} y={y(threshold) - 9} textAnchor="end" fill="#efbd6d">Budget {formatNumber(threshold)}</text>
    </>}
    {cumulative ? <path d={display.map((value, index) => `${index ? 'L' : 'M'}${x(index)},${y(value)}`).join(' ')}
      fill="none" stroke="#4EA3D8" strokeWidth={2} /> : null}
    {display.map((value, index) => <g key={index}>
      {cumulative ? <circle cx={x(index)} cy={y(value)} r={4}
        fill="#4EA3D8" stroke={selected === index ? '#efbd6d' : '#4EA3D8'} strokeWidth={2} /> :
        <rect x={x(index)} y={y(value)} width={12} height={height * value}
          fill="#4EA3D8" stroke={selected === index ? '#efbd6d' : 'none'} strokeWidth={2} />}
      <text x={x(index) + (cumulative ? 0 : 6)} y={321} textAnchor="middle">{index + 1}</text>
    </g>)}
    <text x={left} y={17}>{label}</text>
    <text x={left} y={38}>Fraction of this metric's total</text>
    <text x={180} y={345} textAnchor="middle">Component number</text>
  </Drawing>;
}

function FractionTable({ columns, values, label }) {
  return <Matrix values={values} label={label} columnLabels={columns} exactNumbers />;
}

export function UnitChangeAnatomy() {
  const ordinary = rectangleMetric(1);
  const changed = rectangleMetric(10);
  return <Figure job="D18" title="Changing a measurement unit changes its square contribution"
    description="The same keyed rectangle records appear before and after multiplying y by ten. The second feature energy multiplies by one hundred."
    caption="Constructed unit example. Original x/y square sums: 16 and 4. Multiplying y by m gives energies 16 and 4m²; multiplying a residual coordinate by √w makes its square cost w r².">
    <div className="pca-comparison">
      <CoordinatePlane rows={ordinary.rawRows} mean={[0, 0]} extent={[[-11, 11], [-11, 11]]}
        title="Original unit: y multiplier 1" cornerLabels referenceCaption />
      <CoordinatePlane rows={changed.rawRows} mean={[0, 0]} extent={[[-11, 11], [-11, 11]]}
        title="Changed unit: y multiplier 10" />
    </div>
    <Matrix values={[[16, 4], [16, 400]]} label="Coordinate square sums under the two numerical metrics"
      rowLabels={['Original units', 'y × 10']} columnLabels={['x energy', 'y energy']} />
  </Figure>;
}

export function RawAndStandardized() {
  const input = useNumericDrafts([1], [[.1, 10]]);
  const state = rectangleMetric(input.values[0]);
  return <Figure job="D19" title="Raw and standardized metrics remain visible together"
    description="The same current unit multiplier feeds both lanes. The raw axis may change; population scaling always returns the square and therefore a tied direction family."
    caption={`Multiplier ${formatNumber(input.values[0])}. Raw energies ${state.rawEnergies.map(value => formatNumber(value)).join(' / ')}; retained fraction ${formatNumber(state.rawFraction)}. ${state.numericalTie ? state.exactTie ? 'Exact raw tie at m = 2; no favored ruler.' : 'Numerical tie under the declared 1e−12 relative gap rule; no favored ruler.' : 'The unique raw leading line is drawn.'} Standardized energies 4 / 4, fraction .5: all unit directions tie.`}>
    <div className="pca-comparison">
      <div>
        <p>Raw measurements: fixed axes −11 to 11</p>
        <CoordinatePlane rows={state.rawRows} mean={[0, 0]} direction={state.rawDirection}
          extent={[[-11, 11], [-11, 11]]} title="Current raw numerical metric" cornerLabels referenceCaption />
      </div>
      <div>
        <p>Divide x by 2, y by m: dimensionless axes −2 to 2</p>
        <CoordinatePlane rows={state.standardizedRows} mean={[0, 0]}
          extent={[[-2, 2], [-2, 2]]} title="Current standardized square; all rulers tie" />
      </div>
    </div>
    <Controls onReset={input.reset}>
      <NumberField state={input} index={0} label="Positive y-unit multiplier m" min={.1} max={10} />
    </Controls>
    <Matrix values={[state.rawEnergies, state.standardizedEnergies]}
      label="Both current energy lanes; standardization uses its own total"
      rowLabels={['Raw', 'Standardized']} columnLabels={['x square sum', 'y square sum']} />
  </Figure>;
}

export function ScalerAnatomy() {
  return <Figure job="D20" title="Training stores a scale; later queries reuse it"
    description="The four x values fit a population mean and centered variance. A constant training column takes an effective scale of one, preserving a later nonzero difference."
    caption="x training mean 3; centered squares 4 + 1 + 1 + 4 = 10; divide by 4 → 2.5; square root → scale √2.5. Constant column 5/5/5/5 → mean 5, variance 0, effective scale 1. Later query 6 → standardized 1 → inverse 6.">
    <Drawing width={540} height={300} title="Fitted scaling and constant-column route"
      description="Actual coordinate cells, a centered-square accumulator and a square-root operation write a stored scale; the future query reads that state.">
      {[1, 2, 4, 5].map((value, index) => <g key={index}>
        <text x={15} y={32 + index * 35} fill={['#4EA3D8', '#AB83D8', '#DD8C78', '#55B7BD'][index]}>
          {recordNames[index]}: ({value} − 3)² = {(value - 3) ** 2}
        </text>
        <Arrow x1={154} y1={28 + index * 35} x2={235} y2={83} />
      </g>)}
      <circle cx={258} cy={83} r={19} stroke="#ddd" fill="none" />
      <text x={258} y={88} textAnchor="middle">+</text>
      <Arrow x1={281} y1={83} x2={320} y2={83} />
      <text x={329} y={76}>10 ÷ 4 = 2.5</text>
      <text x={329} y={105}>Stored scale = √2.5</text>
      <text x={15} y={198}>Constant training cells: [5, 5, 5, 5]</text>
      <text x={15} y={227}>Stored mean 5; zero scale → effective scale 1</text>
      <text x={15} y={267}>Future 6: (6 − 5)/1 = 1; inverse 1 × 1 + 5 = 6</text>
    </Drawing>
  </Figure>;
}

export function WineMeasurementRow() {
  return <Figure job="D21" title="One wine owns thirteen chemical measurements"
    description="A single Wine row has thirteen fixed-order feature cells. Cultivar is a separate three-category annotation, never a fourteenth PCA feature."
    caption="Saved offline Wine data: 178 observations × 13 features. Cultivar counts 59 / 71 / 48; category codes 1/2/3 stay outside the numerical PCA table. Feature units are not inferred from their names.">
    <Drawing width={830} height={160} title="The actual first thirteen-feature record"
      description="Thirteen numbered, differently keyed feature cells are bracketed as one observation. The separate cultivar annotation has no fitting arrow.">
      <path d="M15,30 V100 H811 V30" stroke="#999" fill="none" />
      {wineState.wineRows[0].map((value, feature) => <g key={feature}>
        <rect x={23 + feature * 60} y={35} width={55} height={49} stroke={featureColors[feature]} fill="none" />
        <text x={50 + feature * 60} y={23} textAnchor="middle" fill={featureColors[feature]}>{feature + 1}</text>
        <text x={50 + feature * 60} y={65} textAnchor="middle">{value}</text>
      </g>)}
      <text x={15} y={133}>Row ID 0: all thirteen measurements stay paired</text>
      <text x={520} y={133} fill={cultivarColors[0]}>Separate cultivar annotation: 1</text>
    </Drawing>
    <div className="pca-table-pan" tabIndex={0} role="region" aria-label="Complete first Wine row and fixed feature names">
      <table><caption>First row: the exact fixed feature order</caption>
        <thead><tr><th scope="col">Feature port</th><th scope="col">Feature name</th><th scope="col">Measurement</th></tr></thead>
        <tbody>{wineState.wineFeatures.map((name, feature) => <tr key={name}>
          <th scope="row">{feature + 1}</th><td style={{ color: featureColors[feature] }}>{name}</td>
          <td>{wineState.wineRows[0][feature]}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </Figure>;
}

export function WineSpectra() {
  const { rawRatios, standardizedRatios } = wineState.wineFullFit;
  return <Figure job="D22" title="Different metrics produce different saved spectra"
    description="Both thirteen-component spectra remain visible on the same fraction range zero to one. Each fraction has its own metric's total as denominator."
    caption="Saved all 178-row descriptive fits. Raw and standardized fractions use different metric totals; neither subtraction nor the larger first bar measures universal information preservation.">
    <div className="pca-comparison">
      <Spectrum values={rawRatios} label="Saved raw Wine fractions" />
      <Spectrum values={standardizedRatios} label="Saved standardized Wine fractions" />
    </div>
    <FractionTable label="All thirteen exact saved fractions" columns={['Raw metric', 'Standardized metric']}
      values={rawRatios.map((value, component) => [value, standardizedRatios[component]])} />
  </Figure>;
}

export function WineCoordinateMap() {
  const [pair, setPair] = useState([0, 1]);
  const [overlay, setOverlay] = useState(true);
  const input = useNumericDrafts([0], [[0, 177, true]]);
  const rows = descriptiveCoordinates(pair);
  const domains = [0, 1].map(column => {
    const values = rows.map(row => row.coordinates[column]);
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const padding = Math.max(.1, .1 * (hi - lo));
    return [lo - padding, hi + padding];
  });
  const x = value => 52 + (value - domains[0][0]) / (domains[0][1] - domains[0][0]) * 255;
  const y = value => 300 - (value - domains[1][0]) / (domains[1][1] - domains[1][0]) * 245;
  const selected = rows[input.values[0]];
  function reset() {
    setPair([0, 1]);
    setOverlay(true);
    input.reset();
  }
  return <Figure job="D23" title="Project Wine records using the saved descriptive basis"
    description="Every point is a saved-state forward calculation. The chosen pair determines axes, the row ID determines selection and the cultivar overlay changes only visual annotation."
    caption={`Saved full-collection transform, no refitting. Selected row ID ${selected.index}; PC${pair[0] + 1}/PC${pair[1] + 1} coordinates (${selected.coordinates.map(value => formatNumber(value)).join(', ')}). Fractions ${pair.map(component => formatNumber(wineState.wineFullFit.standardizedRatios[component])).join(' / ')}. Cultivars are external annotations.`}>
    <Drawing width={395} height={370} title="Saved-state Wine coordinate map"
      description="All 178 IDs use the current pair extent. Cultivar 1 is circle/blue, 2 triangle/coral, 3 square/violet. An amber outline marks only the selected ID.">
      <g transform="translate(30,0)">
      <rect x={52} y={55} width={255} height={245} fill="none" stroke="#777" />
      {[0, .5, 1].map(fraction => <g key={fraction}>
        <text x={52 + fraction * 255} y={325} textAnchor="middle">
          {formatNumber(domains[0][0] + fraction * (domains[0][1] - domains[0][0]), 4)}
        </text>
        <text x={43} y={304 - fraction * 245} textAnchor="end">
          {formatNumber(domains[1][0] + fraction * (domains[1][1] - domains[1][0]), 4)}
        </text>
      </g>)}
      {rows.map(row => {
        const px = x(row.coordinates[0]);
        const py = y(row.coordinates[1]);
        const color = overlay ? cultivarColors[row.cultivar - 1] : '#c5c5c5';
        return <g key={row.index}>
          {overlay && row.cultivar === 2 ? <path d={`M${px},${py - 3} L${px + 3},${py + 3} L${px - 3},${py + 3} Z`} fill={color} /> :
            overlay && row.cultivar === 3 ? <rect x={px - 3} y={py - 3} width={6} height={6} fill={color} /> :
              <circle cx={px} cy={py} r={3} fill={color} />}
          {row.index === selected.index && <circle cx={px} cy={py} r={7} stroke="#efbd6d" strokeWidth={2} fill="none" />}
        </g>;
      })}
      <text x={52} y={31}>PC{pair[1] + 1} scores</text>
      <text x={180} y={352} textAnchor="middle">PC{pair[0] + 1} scores</text>
      <text x={x(selected.coordinates[0])} y={y(selected.coordinates[1]) - 12}
        textAnchor="middle" fill="#efbd6d">ID {selected.index}</text>
      </g>
    </Drawing>
    <Controls onReset={reset}>
      <label className="pca-number-field">Coordinate pair
        <select aria-label="Wine coordinate pair" value={pair.join(',')}
          onChange={event => setPair(event.target.value.split(',').map(Number))}>
          {Array.from({ length: 13 }, (_, first) =>
            Array.from({ length: 12 - first }, (_, second) => [first, first + second + 1]))
            .flat().map(value => <option key={value.join(',')} value={value.join(',')}>
              PC{value[0] + 1} / PC{value[1] + 1}
            </option>)}
        </select>
      </label>
      <NumberField state={input} index={0} label="Wine record ID" min={0} max={177} step={1} />
      <label><input type="checkbox" checked={overlay} onChange={event => setOverlay(event.target.checked)} /> Cultivar annotation</label>
    </Controls>
    <p>Selected record ID {selected.index}: cultivar {selected.cultivar}; its category does not enter projection.</p>
    <Matrix values={[[selected.index, selected.cultivar, ...selected.coordinates]]}
      columnLabels={['Original row ID', 'External cultivar', `PC${pair[0] + 1} score `, `PC${pair[1] + 1} score `]}
      label="Selected record's full derived coordinate values" exactNumbers />
  </Figure>;
}

export function IndividualAndCumulative() {
  const ratios = wineState.wineFullFit.standardizedRatios;
  let sum = 0;
  const cumulative = ratios.map(value => (sum += value));
  return <Figure job="D24" title="A cumulative fraction adds the same individual increments"
    description="All 13 individual fraction bars and the running sum are visible together, each on the labelled range 0 to 1."
    caption="Saved descriptive standardized collection. First two sum .554063383569353; eight about .9201754432; ten about .9616971684. This is not the training-only compression curve.">
    <div className="pca-comparison">
      <Spectrum values={ratios} label="Saved individual full-collection fractions" />
      <Spectrum values={ratios} cumulative label="Running sum of the same saved fractions" />
    </div>
    <FractionTable values={ratios.map((value, index) => [value, cumulative[index]])}
      columns={['Individual fraction', 'Cumulative fraction']} label="Every saved increment and running sum" />
  </Figure>;
}

export function TrainingOwnedCompression() {
  const split = wineState.wineSplit;
  return <Figure job="D25" title="Training measurements own every fitted compression value"
    description="The stratified split branches 178 rows into 133 training and 45 validation rows. Cultivar labels end after splitting; both measurement branches read the training state."
    caption="Saved seed 42 split: 133 training and 45 validation observations. Training alone supplies means, scales and the basis; validation loss selects the kept count. There is no final-test lane in this experiment.">
    <Drawing width={620} height={340} title="Split, fit, fixed transforms and selection"
      description="Observed row cells branch into training/validation roles. A separate category lane ends at split, and only training writes the fitted state.">
      <text x={15} y={26}>178 × 13 measurement table</text>
      {Array.from({ length: 3 }, (_, row) => Array.from({ length: 4 }, (_, column) =>
        <rect key={`${row}-${column}`} x={25 + column * 22} y={42 + row * 22}
          width={18} height={18} fill="none" stroke={featureColors[column]} />))}
      <text x={15} y={132}>Cultivar1/2/3 → stratified split</text>
      <line x1={246} y1={121} x2={246} y2={139} stroke="#ddd" strokeWidth={3} />
      <text x={262} y={132}>Category lane ends</text>
      <Arrow x1={126} y1={70} x2={194} y2={70} />
      <text x={202} y={65}>133 training rows</text>
      <text x={202} y={89}>IDs include {split.train.slice(0, 3).join(', ')}</text>
      <Arrow x1={136} y1={78} x2={195} y2={185} />
      <text x={202} y={181}>45 validation rows</text>
      <text x={202} y={205}>IDs include {split.validation.slice(0, 3).join(', ')}</text>
      <Arrow x1={338} y1={67} x2={391} y2={67} />
      <rect x={397} y={39} width={139} height={70} fill="none" stroke="#bbb" strokeDasharray="5 4" />
      <text x={407} y={62}>Stored μ/scales/D</text>
      <text x={407} y={87}>Training only</text>
      <path d="M466,112 V164 H390" fill="none" stroke="#ddd" />
      <Arrow x1={340} y1={185} x2={397} y2={185} />
      <text x={402} y={190}>Fixed transform</text>
      <Arrow x1={466} y1={200} x2={466} y2={249} />
      <text x={285} y={276}>Validation residuals → budget/count selection</text>
      <text x={15} y={322}>Selection rows are development evidence, not an untouched test.</text>
    </Drawing>
  </Figure>;
}

export function ValidationBudget() {
  const input = useNumericDrafts([.1, 8], [[0, 1], [0, 13, true]]);
  const [budget, inspection] = input.values;
  const crossing = budgetCrossing(budget);
  const values = wineState.wineSplit.lossRatios;
  const x = kept => 54 + kept * 20;
  const y = ratio => 285 - ratio * 240;
  return <Figure job="D26" title="A budget crossing and an inspection count have different jobs"
    description="All fourteen recorded validation ratios remain visible. The budget line determines the first satisfying count; the separate highlighted inspection marker does not redefine that crossing."
    caption={`Saved aggregate validation error. Budget ${formatNumber(budget)}; first qualifying k ${crossing === null ? 'none' : crossing}; inspection k ${inspection}, ratio ${values[inspection]}, entry MSE ${values[inspection] * wineState.wineSplit.baselineMse}. k = 13 retains its tiny positive recorded ratio, so budget 0 has no qualifying count.`}>
    <Drawing width={365} height={355} title="Saved validation loss ratio and actual crossing"
      description="Loss ratios use a common zero-to-one vertical scale. Amber horizontal budget, white dashed first crossing and blue/amber inspection marker are separately labelled.">
      {[0, .25, .5, .75, 1].map(value => <g key={value}>
        <line x1={54} x2={314} y1={y(value)} y2={y(value)} stroke="#444" />
        <text x={44} y={y(value) + 4} textAnchor="end">{value}</text>
      </g>)}
      <path d={values.map((value, kept) => `${kept ? 'L' : 'M'}${x(kept)},${y(value)}`).join(' ')}
        stroke="#4EA3D8" fill="none" strokeWidth={2} />
      <line x1={54} x2={314} y1={y(budget)} y2={y(budget)} stroke="#efbd6d" strokeDasharray="5 4" />
      {crossing !== null && <line x1={x(crossing)} x2={x(crossing)} y1={45} y2={285}
        stroke="#ddd" strokeDasharray="3 5" />}
      {values.map((value, kept) => <g key={kept}>
        <circle cx={x(kept)} cy={y(value)} r={kept === inspection ? 6 : 3}
          stroke={kept === inspection ? '#efbd6d' : '#4EA3D8'} strokeWidth={2} fill="#4EA3D8" />
        <text x={x(kept)} y={307} textAnchor="middle">{kept}</text>
      </g>)}
      <text x={54} y={25}>Error / mean-only baseline error</text>
      <text x={185} y={331} textAnchor="middle">Kept count k</text>
    </Drawing>
    <Controls onReset={input.reset}>
      <NumberField state={input} index={0} label="Maximum validation loss ratio" min={0} max={1} />
      <NumberField state={input} index={1} label="Independent inspection count k" min={0} max={13} step={1} />
    </Controls>
    <Matrix values={values.map(value => [value, value * wineState.wineSplit.baselineMse])}
      rowLabels={values.map((_, kept) => `k = ${kept}`)}
      columnLabels={['Exact saved ratio', 'Derived entry MSE']}
      label="All recorded ratios; baseline entry MSE 1.0962540507211542" exactNumbers />
  </Figure>;
}

export function ValidationRowDecoder() {
  const input = useNumericDrafts([0, 8], [[0, 44, true], [0, 13, true]]);
  const [feature, setFeature] = useState(0);
  const [position, kept] = input.values;
  const rowId = wineState.wineSplit.validation[position];
  const state = savedQuery(wineState.wineRows[rowId], wineState.wineSplit, kept);
  function reset() {
    input.reset();
    setFeature(0);
  }
  return <Figure job="D27" title="Decode one held-out record with the saved training basis"
    description="The chosen validation position addresses an original row ID. A kept count changes the saved-direction products and decoded row; a feature selector changes only the inspected output column."
    caption={`Derived forward calculation from saved training state. Validation position ${position} → original row ID ${rowId}; k = ${kept}. Selected feature ${feature + 1}: ${wineState.wineFeatures[feature]}. Row standardized loss ${state.standardizedSquaredLoss}; it is distinct from the saved aggregate validation curve.`}>
    <Drawing width={540} height={225} title="Saved row projection and selected-feature decoder"
      description="The full thirteen-feature standardized row supplies every score; each retained score contributes through its saved coefficient to the selected restored feature.">
      <text x={15} y={28}>Validation position {position} → original row {rowId}</text>
      <text x={15} y={62}>13 raw measurements</text>
      <Arrow x1={173} y1={58} x2={214} y2={58} />
      <text x={222} y={62}>− μ, divide scales</text>
      <Arrow x1={360} y1={58} x2={402} y2={58} />
      <text x={407} y={62}>13 standardized</text>
      <text x={15} y={111}>Row × each kept direction → {kept} scores</text>
      <Arrow x1={295} y1={106} x2={339} y2={106} />
      <text x={346} y={111}>Selected decoder column</text>
      <text x={15} y={157} fill={featureColors[feature]}>Feature {feature + 1}: sum kept score × coefficient</text>
      <text x={15} y={198}>Sum {formatNumber(state.decodedStandardized[feature])} × scale {formatNumber(wineState.wineSplit.scale[feature])}
        {' + mean '}{formatNumber(wineState.wineSplit.mean[feature])}{' = '}{formatNumber(state.decoded[feature])}</text>
    </Drawing>
    <Controls onReset={reset}>
      <NumberField state={input} index={0} label="Validation position" min={0} max={44} step={1} />
      <NumberField state={input} index={1} label="Decoded kept count k" min={0} max={13} step={1} />
      <label className="pca-number-field">Inspected feature
        <select aria-label="Decoded feature" value={feature} onChange={event => setFeature(Number(event.target.value))}>
          {wineState.wineFeatures.map((name, index) => <option key={name} value={index}>{index + 1}: {name}</option>)}
        </select>
      </label>
    </Controls>
    {kept > 0 && <>
      <Drawing width={540} height={200} title="One first-score feature product and the other twelve contributions"
        description="The inspected feature's standardized measurement multiplies its first-direction coefficient. The remaining twelve products are separately summed and then added to make the current first score.">
        <text x={15} y={29} fill={featureColors[feature]}>Selected feature {feature + 1}</text>
        <text x={15} y={58}>{formatNumber(state.standardized[feature])} × {formatNumber(wineState.wineSplit.components[0][feature])}</text>
        <Arrow x1={227} y1={54} x2={270} y2={54} />
        <text x={280} y={58}>{formatNumber(state.scoreProducts[0][feature])}</text>
        <text x={15} y={112}>Other 12 products sum = {formatNumber(state.scoreProducts[0]
          .reduce((sum, value, index) => sum + (index === feature ? 0 : value), 0))}</text>
        <Arrow x1={385} y1={54} x2={425} y2={89} />
        <Arrow x1={330} y1={108} x2={425} y2={89} />
        <circle cx={449} cy={89} r={19} stroke="#ddd" fill="none" />
        <text x={449} y={94} textAnchor="middle">+</text>
        <text x={300} y={160}>First score = {formatNumber(state.scores[0])}</text>
      </Drawing>
      <Matrix values={state.standardized.map((value, index) => [value,
        wineState.wineSplit.components[0][index], state.scoreProducts[0][index]])}
        rowLabels={wineState.wineFeatures.map((_, index) => `Feature ${index + 1}`)}
        rowColors={featureColors} columnLabels={['Standardized measurement', 'PC1 coefficient', 'Product']}
        label="All 13 actual operand pairs for the first kept score" exactNumbers />
    </>}
    <Matrix values={state.scoreProducts}
      rowLabels={state.scores.map((_, component) => `PC${component + 1}`)}
      columnLabels={wineState.wineFeatures.map((_, index) => `Feature ${index + 1}`)}
      label={`All current score products; ${kept} directions × 13 original feature identities`}
      exactNumbers />
    {kept === 0 ? <p>No score products: the decoder returns the training mean.</p> :
      <Matrix values={state.scores.map((score, component) => [score,
        wineState.wineSplit.components[component][feature], state.decoderProducts[feature][component]])}
        columnLabels={['Current score', 'Selected feature coefficient', 'Decoder product']}
        rowLabels={state.scores.map((_, component) => `PC${component + 1}`)}
        label="Every kept scalar and selected-column decoder contribution" exactNumbers />}
    <div className="pca-table-pan" tabIndex={0} role="region" aria-label="All thirteen original, standardized, decoded and residual measurements">
      <table><caption>Original row ID {rowId}; all 13 measurements in fixed order</caption>
        <thead><tr>{['Feature', 'Original', 'Standardized', 'Decoded standardized', 'Decoded raw', 'Raw residual', 'Standardized residual'].map(name =>
          <th key={name} scope="col">{name}</th>)}</tr></thead>
        <tbody>{wineState.wineFeatures.map((name, index) => <tr key={name}
          style={index === feature ? { outline: '2px solid #efbd6d', outlineOffset: '-2px' } : undefined}>
          <th scope="row" style={{ color: featureColors[index] }}>{index + 1}: {name}</th>
          {[state.row[index], state.standardized[index], state.decodedStandardized[index], state.decoded[index],
            state.residual[index], state.residualStandardized[index]].map((value, column) => <td key={column}>{String(value)}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
  </Figure>;
}

export function InverseWineUnits() {
  const branch = wineState.wineSplit;
  const rowId = branch.validation[0];
  const state = savedQuery(wineState.wineRows[rowId], branch, 8);
  const feature = 0;
  return <Figure job="D28" title="Return alcohol to the same original unit"
    description="The saved row 35 alcohol measurement is centered and scaled, decoded at k = 8, multiplied by the stored scale and restored by the stored mean. Raw and standardized residuals retain different units."
    caption={`Actual row ID ${rowId}, k = 8 alcohol. ${state.row[feature]} → standardized ${state.standardized[feature]} → decoded standardized ${state.decodedStandardized[feature]} → decoded raw ${state.decoded[feature]}. Raw residual ${state.residual[feature]}; standardized residual square ${state.residualStandardized[feature] ** 2}.`}>
    <Drawing width={540} height={240} title="Selected alcohol forward/inverse scaling"
      description="Numbered operation ports show the actual saved mean, scale, decoded scalar and final residual in original units.">
      <text x={15} y={35} fill={featureColors[feature]}>Alcohol original {state.row[feature]}</text>
      <text x={15} y={76}>({state.row[feature]} − {formatNumber(branch.mean[feature])}) / {formatNumber(branch.scale[feature])}</text>
      <Arrow x1={280} y1={72} x2={328} y2={72} />
      <text x={338} y={76}>{formatNumber(state.standardized[feature])} standardized</text>
      <text x={15} y={121}>Saved k8 decoder sum = {formatNumber(state.decodedStandardized[feature])}</text>
      <text x={15} y={163}>× {formatNumber(branch.scale[feature])} + {formatNumber(branch.mean[feature])}</text>
      <Arrow x1={236} y1={159} x2={288} y2={159} />
      <text x={298} y={163}>{formatNumber(state.decoded[feature])} raw units</text>
      <text x={15} y={211}>Original − decoded = {formatNumber(state.residual[feature])} raw units</text>
    </Drawing>
  </Figure>;
}

export function DecoderStorage() {
  const input = useNumericDrafts([100, 20, 10], [[1, 10000, true], [1, 500, true], [0, 500, true]],
    undefined, values => values[2] > values[1] ?
      'Kept count k must not exceed feature count d; the last valid dimensions remain in the drawing.' : null);
  const [observations, features, kept] = input.values;
  const counts = storageCounts(observations, features, kept);
  const objects = [
    ['Original X', `${observations} × ${features}`, counts.original],
    ['Scores Z', `${observations} × ${kept}`, counts.scores],
    ['Decoder D', `${kept} × ${features}`, counts.decoder],
    ['Mean μ', `1 × ${features}`, counts.mean]
  ];
  return <Figure job="D29" title="Scores also require a shared decoder and mean"
    description="Four actual array roles have their own dimensions and scalar counts. Every bar uses the same scale relative to the original table."
    caption={`Original ${counts.original} scalars. Scores ${counts.scores} + decoder ${counts.decoder} + mean ${counts.mean} = ${counts.total}, or ${formatNumber(100 * counts.fraction)}% of original. An additional fitted scale stores ${features} more scalars. Dtype, metadata, format and quantization are separate; no fitted-data cost is measured here.`}>
    <Drawing width={540} height={300} title="Dimensioned storage objects on one scalar-count scale"
      description="Bars use one original table as a labelled count unit and a common range up to three original tables. Zero-width score/decoder objects stay explicitly zero when k = 0.">
      {objects.map(([name, dimensions, count], index) => <g key={name}>
        <text x={15} y={29 + index * 60}>{name}: {dimensions}</text>
        <rect x={196} y={12 + index * 60} width={300 * count / (3 * counts.original)} height={24}
          fill={index === 0 ? '#888' : '#4EA3D8'} />
        <text x={196} y={53 + index * 60}>{count} scalars</text>
      </g>)}
      <line x1={196} y1={263} x2={496} y2={263} stroke="#aaa" />
      {[0, 1, 2, 3].map(value => <text key={value} x={196 + value * 100} y={285} textAnchor="middle">{value}</text>)}
      <text x={15} y={285}>Original-table count units</text>
    </Drawing>
    <Controls onReset={input.reset}>
      <NumberField state={input} index={0} label="Observation count n" min={1} max={10000} step={1} />
      <NumberField state={input} index={1} label="Feature count d" min={1} max={500} step={1} />
      <NumberField state={input} index={2} label="Stored kept count k" min={0} max={features} step={1} />
    </Controls>
  </Figure>;
}

export const wineDrawings = {
  D18: UnitChangeAnatomy,
  D19: RawAndStandardized,
  D20: ScalerAnatomy,
  D21: WineMeasurementRow,
  D22: WineSpectra,
  D23: WineCoordinateMap,
  D24: IndividualAndCumulative,
  D25: TrainingOwnedCompression,
  D26: ValidationBudget,
  D27: ValidationRowDecoder,
  D28: InverseWineUnits,
  D29: DecoderStorage
};
