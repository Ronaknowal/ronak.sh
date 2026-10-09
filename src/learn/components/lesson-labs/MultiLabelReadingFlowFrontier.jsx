import { useState } from 'react';
import { joinedHiddenPullback, outputCovarianceHand, sharedHiddenWeights, sketchHandGradients, splitGradientHand } from '../../data/multilabel-reading-flow-scale-models.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelQuantity, MultiLabelTable, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';
const colors = ['#f0b45b', '#75adff', '#bc9aff'];
const names = ['A', 'B', 'C'];
function Cells({
  rows,
  x,
  y,
  width = 91,
  height = 43,
  labels = names,
  rowColors = null,
  columnColors = colors
}) {
  return <g>
    {labels.map((label, j) => <text
      key={label}
      x={x + (j + .5) * width}
      y={y - 12}
      textAnchor="middle"
      style={{
        fill: columnColors[j] || '#d5c3df'
      }}
    >
      {label}
    </text>)}
    {rows.map((row, i) => row.map((value, j) => <g key={i + '-' + j}>
      <rect
        x={x + j * width}
        y={y + i * height}
        width={width}
        height={height}
        fill="#111114"
        stroke={rowColors?.[i] || columnColors[j] || '#d5c3df'}
      />
      <text
        x={x + (j + .5) * width}
        y={y + i * height + 28}
        textAnchor="middle"
        style={{
          fill: columnColors[j] || '#d5c3df'
        }}
      >
        {number(value)}
      </text>
    </g>))}
  </g>;
}
export function SplitGradientSketchFigure() {
  const [coordinate, setCoordinate] = useState(0);
  const [cut, setCut] = useState(2);
  const state = splitGradientHand(coordinate, cut);
  return <MultiLabelFigure
    job="D57"
    description="A selected gradient column supplies reduced split-search sums while a separate full three-column branch supplies both vector Newton leaves"
  >
    <MultiLabelCanvas
      width={1040}
      height={723}
      title="Four actual gradient rows, selected-column search sketch and full diagonal-Hessian leaves with Hessian1 per row and penalty1"
    >
      <text x={16} y={30}>Output A amber / B blue / C violet. Search sketch uses {names[coordinate]}; leaf values retain A/B/C.</text>
      <text x={16} y={80}>Full G · 4 rows × 3 outputs</text>
      <Cells rows={sketchHandGradients} x={16} y={114} />
      <rect
        x={16 + coordinate * 91}
        y={114}
        width={91}
        height={172}
        fill="none"
        stroke="#eee8f0"
        strokeWidth={3}
      />
      <path d={`M10,${114 + cut * 43} H295`} stroke="#eee8f0" strokeWidth={2} strokeDasharray="4 3" />
      <text x={16} y={326}>White cut after {cut} rows</text>
      <path d="M289,199 H372" stroke={colors[coordinate]} fill="none" />
      <text x={322} y={180}>select</text>
      <text x={397} y={80}>Search sketch {names[coordinate]} · 4×1</text>
      <Cells
        rows={state.sketch.map(value => [value])}
        x={397}
        y={114}
        labels={[names[coordinate]]}
        columnColors={[colors[coordinate]]}
      />
      <text x={642} y={80}>Selected-column child sums</text>
      <Cells
        rows={state.sketchSums.map(value => [value])}
        x={642}
        y={114}
        width={129}
        labels={[names[coordinate]]}
        columnColors={[colors[coordinate]]}
      />
      <path d="M488,199 H560 V135 H633 M560,177 H633" stroke={colors[coordinate]} fill="none" />
      <text x={800} y={140}>left rows 0…{cut - 1}</text>
      <text x={800} y={184}>right rows {cut}…3</text>
      <text x={397} y={326}>Sketch quadratic improvement: {number(state.sketchImprovement)}</text>
      <path d="M151,286 V365 H7 V494 H16" stroke="#d5c3df" fill="none" />
      <text x={176} y={365}>Full G branch: no output columns discarded</text>
      <text x={16} y={416}>Full child gradient sums</text>
      <Cells rows={[state.left, state.right]} x={16} y={451} />
      <text x={16} y={586}>Hessian sums: left [{cut}, {cut}, {cut}]</text>
      <text x={16} y={624}>right [{4 - cut}, {4 - cut}, {4 - cut}]</text>
      <path d="M289,494 H447" stroke="#d5c3df" fill="none" />
      <text x={322} y={473}>−G/(H+1)</text>
      <text x={474} y={416}>Full three-component vector leaves</text>
      <Cells rows={state.leaves} x={474} y={451} />
      <text x={800} y={478}>left vector leaf</text>
      <text x={800} y={521}>right vector leaf</text>
      <text x={474} y={586}>Full quadratic improvement: {number(state.fullImprovement)}</text>
      <text x={16} y={692}>These hand sums explain a search sketch, not an executed boosting fit or speed/quality benchmark.</text>
    </MultiLabelCanvas>
    <FlowControls>
      <label>Split-search sketch coordinate <select
        aria-label="Split-search sketch coordinate"
        value={coordinate}
        onChange={event => setCoordinate(Number(event.target.value))}
      >
        <option value={0}>A</option>
        <option value={2}>C</option>
      </select></label>
      <label>Candidate cut after row count <select
        aria-label="Candidate cut after row count"
        value={cut}
        onChange={event => setCut(Number(event.target.value))}
      >
        {[1, 2, 3].map(value => <option key={value}>
          {value}
        </option>)}
      </select></label>
      <button
        type="button"
        onClick={() => {
          setCoordinate(0);
          setCut(2);
        }}
      >Reset gradient sketch</button>
    </FlowControls>
    <FlowReadout>Sketch {names[coordinate]} at the cut after {cut} rows has child sums [{state.sketchSums.join(', ')}]. The full child sums remain [{state.left.join(', ')}] and [{state.right.join(', ')}], producing vector leaves [{state.leaves[0].map(value => number(value)).join(', ')}] and [{state.leaves[1].map(value => number(value)).join(', ')}]. A small split-search sketch and a compressed final prediction are different mechanisms.</FlowReadout>
  </MultiLabelFigure>;
}
export function JoinedSharedPullbackFigure() {
  const [truth, setTruth] = useState([1, 0, 1]);
  const [selected, setSelected] = useState('all');
  const state = joinedHiddenPullback(truth, selected);
  return <MultiLabelFigure
    job="D58"
    description="Two supplied hidden coordinates multiply into three separate sigmoid heads; mean BCE deltas flow through signed output weights into two shared hidden-gradient sums"
  >
    <MultiLabelCanvas
      width={1072}
      height={878}
      title="Supplied shared representation, three independent sigmoid sockets and actual mean-over-three-cell hidden pullback"
    >
      <text x={16} y={30}>A amber / B blue / C violet. Divisor 3 is mean BCE across this one row's three outputs.</text>
      <text x={16} y={79}>x=[1,−1] → supplied neutral h=[1,2]</text>
      <Cells
        rows={[state.hidden]}
        x={16}
        y={113}
        labels={['h0', 'h1']}
        columnColors={['#d5c3df', '#d5c3df']}
      />
      <text x={347} y={79}>W · hidden rows × outputs</text>
      <Cells rows={sharedHiddenWeights} x={347} y={113} />
      <path d="M198,135 H338" stroke="#d5c3df" fill="none" />
      <text x={253} y={116}>hW</text>
      <text x={765} y={79}>Three output logits · bias 0</text>
      <Cells rows={[state.logits]} x={765} y={113} />
      <path d="M620,156 H698 V135 H756" stroke="#d5c3df" fill="none" />
      {names.map((name, j) => <g key={name} opacity={selected === 'all' || selected === name ? 1 : .3}>
        <path d={`M${810 + j * 91},156 V229`} stroke={colors[j]} fill="none" />
        <circle cx={810 + j * 91} cy={254} r={25} stroke={colors[j]} fill="#111114" />
        <text
          x={810 + j * 91}
          y={261}
          textAnchor="middle"
          style={{
            fill: colors[j]
          }}
        >σ</text>
        <text
          x={810 + j * 91}
          y={316}
          textAnchor="middle"
          style={{
            fill: colors[j]
          }}
        >
          {number(state.probabilities[j])}
        </text>
      </g>)}
      <text x={16} y={285}>Known target row</text>
      <Cells rows={[truth]} x={16} y={324} />
      <text x={347} y={285}>δ=(σ(z)−y)/3</text>
      <Cells rows={[state.delta]} x={347} y={324} />
      <path d="M289,345 H338" stroke="#d5c3df" fill="none" />
      <text x={715} y={376}>
        <tspan x={715}>{'Separate sigmoid sockets; '}</tspan>
        <tspan x={715} dy={26}>no softmax sum</tspan>
      </text>
      <text x={16} y={453}>Each output's signed hidden contribution</text>
      {names.map((name, j) => <g key={name} opacity={selected === 'all' || selected === name ? 1 : .25}>
        <text
          x={16 + j * 344}
          y={491}
          style={{
            fill: colors[j]
          }}
        >{name}: δ × weights [{sharedHiddenWeights.map(row => row[j]).join(', ')}]</text>
        <Cells
          rows={[state.contributions[j]]}
          x={16 + j * 344}
          y={529}
          labels={['to h0', 'to h1']}
          width={135}
          rowColors={[colors[j]]}
          columnColors={[colors[j], colors[j]]}
        />
        <path d={`M${83 + j * 344},572 V${591 + j * 22} H370 V704`} stroke={colors[j]} fill="none" />
        <path d={`M${218 + j * 344},572 V${658 + j * 22} H880 V704`} stroke={colors[j]} fill="none" />
      </g>)}
      {[0, 1].map(hidden => <g key={hidden}>
        <circle cx={hidden === 0 ? 370 : 880} cy={729} r={25} stroke="#d5c3df" fill="#111114" />
        <text x={hidden === 0 ? 370 : 880} y={736} textAnchor="middle">Σ</text>
        <text x={hidden === 0 ? 370 : 880} y={784} textAnchor="middle">h{hidden}: {number(state.selectedGradient[hidden])}</text>
      </g>)}
      <text x={16} y={826}>Path sum: {selected}. Full joined gradient [{state.gradient.map(value => number(value)).join(', ')}]</text>
      <text x={16} y={863}>Shared hidden parameters receive several loss paths. These supplied heads alone do not define a joint law.</text>
    </MultiLabelCanvas>
    <FlowControls>
      <label>Visible output pullback paths <select
        aria-label="Visible output pullback paths"
        value={selected}
        onChange={event => setSelected(event.target.value)}
      >
        {['all', ...names].map(name => <option key={name}>
          {name}
        </option>)}
      </select></label>
      <fieldset>
        <legend>Known target bits</legend>
        {names.map((name, j) => <label key={name}><input
          type="checkbox"
          checked={Boolean(truth[j])}
          onChange={event => setTruth(current => current.map((value, i) => i === j ? Number(event.target.checked) : value))}
        />{name} truth 1</label>)}
      </fieldset>
      <button
        type="button"
        onClick={() => {
          setTruth([1, 0, 1]);
          setSelected('all');
        }}
      >Reset joined pullback</button>
    </FlowControls>
    <FlowReadout>Truth [{truth.join(', ')}] gives logits [{state.logits.join(', ')}] and deltas [{state.delta.map(value => number(value)).join(', ')}]. Full hidden pullback is [{state.gradient.map(value => number(value)).join(', ')}]; selected {selected} paths contribute [{state.selectedGradient.map(value => number(value)).join(', ')}]. BCE mean is {number(state.loss)}. Path selection inspects contributions and does not change the full objective or pretend to fit the hidden network.</FlowReadout>
    <MultiLabelTable caption="Actual signed weight products into each supplied hidden coordinate">
      <thead>
        <tr>
          <th>Output</th>
          <th>Truth</th>
          <th>Mean-cell δ</th>
          <th>W_h0,j</th>
          <th>δW_h0,j</th>
          <th>W_h1,j</th>
          <th>δW_h1,j</th>
        </tr>
      </thead>
      <tbody>
        {names.map((name, j) => <tr key={name}>
          <th
            style={{
              color: colors[j]
            }}
          >
            {name}
          </th>
          <td>
            {truth[j]}
          </td>
          <td>
            {number(state.delta[j])}
          </td>
          <td>
            {sharedHiddenWeights[0][j]}
          </td>
          <td>
            {number(state.contributions[j][0])}
          </td>
          <td>
            {sharedHiddenWeights[1][j]}
          </td>
          <td>
            {number(state.contributions[j][1])}
          </td>
        </tr>)}
      </tbody>
    </MultiLabelTable>
  </MultiLabelFigure>;
}
export function OutputCovarianceFigure() {
  const [rho, setRho] = useState(.5);
  const [observedOutput, setObservedOutput] = useState('A');
  const [revision, setRevision] = useState(0);
  const state = outputCovarianceHand(rho, observedOutput);
  return <MultiLabelFigure
    job="D59"
    description="Point-major input-output coordinates identify literal covariance blocks and the exact one-observation conditional mean/variance at the opposite output and other input"
  >
    <MultiLabelCanvas
      width={1090}
      height={793}
      title="K tensor B with labeled point-major blocks and one explicitly positive-marginal-variance Gaussian conditioning operation"
    >
      <text x={16} y={30}>A amber / B blue. Input index x0 or x1 remains explicit; block outlines identify input pairs.</text>
      <text x={16} y={79}>Input K · neutral x0 / x1</text>
      <Cells rows={state.input} x={16} y={113} labels={['x0', 'x1']} columnColors={['#d5c3df', '#d5c3df']} />
      <text x={363} y={79}>Output B · A / B</text>
      <Cells rows={state.output} x={363} y={113} labels={['A', 'B']} />
      <text x={16} y={243}>Joint K⊗B · four point-major coordinates</text>
      {state.labels.map((label, j) => <text
        key={label}
        x={217 + j * 130}
        y={284}
        textAnchor="middle"
        style={{
          fill: colors[j % 2]
        }}
      >
        {label}
      </text>)}
      {state.joint.map((row, i) => <g key={i}>
        <text
          x={132}
          y={331 + i * 53}
          textAnchor="end"
          style={{
            fill: colors[i % 2]
          }}
        >
          {state.labels[i]}
        </text>
        {row.map((value, j) => <g key={j}>
          <rect
            x={152 + j * 130}
            y={297 + i * 53}
            width={130}
            height={53}
            stroke={colors[j % 2]}
            fill={i === state.opposite && j === state.observed ? '#453445' : '#111114'}
          />
          <text
            x={217 + j * 130}
            y={331 + i * 53}
            textAnchor="middle"
            style={{
              fill: value < 0 ? '#ef8ca4' : colors[j % 2]
            }}
          >
            {number(value)}
          </text>
        </g>)}
      </g>)}
      {[0, 1].flatMap(i => [0, 1].map(j => <rect
        key={i + '-' + j}
        x={152 + j * 260}
        y={297 + i * 106}
        width={260}
        height={106}
        fill="none"
        stroke="#d5c3df"
        strokeWidth={3}
      />))}
      <text x={760} y={283}>Observe {state.labels[state.observed]} = 1</text>
      <circle cx={824} cy={340} r={28} stroke={colors[state.observed]} fill="#111114" />
      <text x={824} y={347} textAnchor="middle">1</text>
      <path
        d={`M${152 + (state.observed + 1) * 130},${323 + state.opposite * 53} V270 H984 V317`}
        stroke="#ef8ca4"
        fill="none"
      />
      <circle cx={152 + (state.observed + 1) * 130} cy={323 + state.opposite * 53} r={5} fill="#ef8ca4" />
      <text x={760} y={238}>Cross value {number(.8 * rho)}</text>
      <path d="M852,340 H961" stroke="#d5c3df" fill="none" />
      <circle cx={984} cy={340} r={23} stroke="#d5c3df" fill="#111114" />
      <text x={984} y={347} textAnchor="middle">×</text>
      <path d="M984,363 V416" stroke="#d5c3df" fill="none" />
      <circle cx={984} cy={445} r={29} stroke="#d5c3df" fill="#111114" />
      <text x={984} y={452} textAnchor="middle">÷var</text>
      <text x={760} y={511}>Observed marginal variance = 1</text>
      <path d="M984,474 V545" stroke="#d5c3df" fill="none" />
      <circle cx={984} cy={590} r={45} stroke={colors[state.opposite % 2]} fill="#111114" />
      <text x={984} y={597} textAnchor="middle">
        {number(state.targetMean)}
      </text>
      <text x={760} y={649}>Mean at {state.labels[state.opposite]}</text>
      <text x={16} y={558}>Opposite output at other input: {state.labels[state.opposite]}</text>
      <text x={16} y={602}>Cross = .8ρ = {number(.8 * rho)} → conditional mean {number(state.targetMean)}</text>
      <text x={16} y={647}>Conditional variance = 1−(.8ρ)² = {number(state.targetVariance)}</text>
      <text x={16} y={692}>B eigenvalues = [{state.eigenvalues.map(value => number(value)).join(', ')}]; |ρ|≤1 is the PSD condition.</text>
      <text x={16} y={736}>Current |ρ|≤.9. Semidefinite endpoints do not imply arbitrary inversion is supported.</text>
      <text x={16} y={775}>This hand covariance is not injected by an ordinary multi-target GPR scalar-kernel call.</text>
    </MultiLabelCanvas>
    <FlowControls>
      <MultiLabelQuantity
        label="Output covariance ρ"
        value={rho}
        min={-.9}
        max={.9}
        step={.1}
        revision={revision}
        onChange={setRho}
      />
      <label>Observed output at x0 <select
        aria-label="Observed output at x0"
        value={observedOutput}
        onChange={event => setObservedOutput(event.target.value)}
      >
        <option>A</option>
        <option>B</option>
      </select></label>
      <button
        type="button"
        onClick={() => {
          setRho(.5);
          setObservedOutput('A');
          setRevision(value => value + 1);
        }}
      >Reset output covariance</button>
    </FlowControls>
    <FlowReadout>Observing noiseless 1 at {state.labels[state.observed]} gives mean {number(state.targetMean)} and variance {number(state.targetVariance)} at {state.labels[state.opposite]}. With ρ={number(rho)}, the cross-output cross-input covariance is {number(.8 * rho)}. Negative covariance changes the mean's sign; ρ=0 removes this cross-output link. Nonzero covariance alone establishes no accuracy improvement.</FlowReadout>
    <MultiLabelTable
      caption="All actual conditional coordinates, with one positive-variance observed marginal"
    >
      <thead>
        <tr>
          <th>Coordinate</th>
          <th>Covariance to observed</th>
          <th>Conditional mean</th>
          <th>Conditional variance</th>
        </tr>
      </thead>
      <tbody>
        {state.labels.map((label, i) => <tr key={label}>
          <th
            style={{
              color: colors[i % 2]
            }}
          >
            {label}
          </th>
          <td>
            {number(state.cross[i])}
          </td>
          <td>
            {number(state.mean[i])}
          </td>
          <td>
            {number(state.conditional[i][i])}
          </td>
        </tr>)}
      </tbody>
    </MultiLabelTable>
  </MultiLabelFigure>;
}
