import { useState } from 'react';
import { numericForwardTrace, residualArithmetic, rootAggregation, unitResidualWitness } from '../../data/multilabel-reading-flow-categorical-numeric-models.js';
import { savedNumericObservations as saved } from '../../data/multilabel-reading-flow-numeric-observations.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelQuantity, MultiLabelTable, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';
const outputColors = ['#f0b45b', '#75adff'];
export function UnitResidualFigure() {
  const [selected, setSelected] = useState(0);
  const state = residualArithmetic(unitResidualWitness.observed, unitResidualWitness.predicted);
  return <MultiLabelFigure
    job="D42"
    description="Two supplied observed/predicted pairs retain their row IDs while residual segments are squared and averaged in separate physical units"
  >
    <MultiLabelCanvas
      width={736}
      height={548}
      title="First-use unit arithmetic witness: these two supplied rows are separate from the fitted experiment below"
    >
      <text x={16} y={30}>Circle = observation; square = supplied prediction. White outline selects a row.</text>
      {[0, 1].map(column => {
        const x = 64 + column * 365;
        const lower = column ? 95 : 18,
          upper = column ? 115 : 24;
        const scale = value => 308 - (value - lower) / (upper - lower) * 210;
        return <g key={column}>
          <text
            x={x}
            y={69}
            style={{
              fill: outputColors[column]
            }}
          >{column ? 'Energy' : 'Temperature'} ({unitResidualWitness.units[column]})</text>
          <path d={'M' + x + ',95 V309 H' + (x + 255)} fill="none" stroke="#b7a7c2" />
          {[lower, (lower + upper) / 2, upper].map(value => <g key={value}>
            <path d={'M' + (x - 5) + ',' + scale(value) + ' H' + x} stroke="#b7a7c2" />
            <text x={x - 9} y={scale(value) + 6} textAnchor="end">
              {value}
            </text>
          </g>)}
          {unitResidualWitness.observed.map((row, index) => {
            const px = x + 80 + index * 125;
            const actual = scale(row[column]),
              predicted = scale(unitResidualWitness.predicted[index][column]);
            return <g key={index}>
              <path
                d={'M' + px + ',' + actual + ' V' + predicted}
                stroke={outputColors[column]}
                strokeWidth={index === selected ? 4 : 2}
              />
              <circle
                cx={px}
                cy={actual}
                r={9}
                fill="#111114"
                stroke={index === selected ? '#fff' : outputColors[column]}
                strokeWidth={2}
              />
              <rect x={px - 8} y={predicted - 8} width={16} height={16} fill={outputColors[column]} />
              <text x={px} y={344} textAnchor="middle">row {index}</text>
              <text x={px} y={376} textAnchor="middle">e={state.residuals[index][column]} {unitResidualWitness.units[column]}</text>
            </g>;
          })}
          <path d={'M' + (x + 135) + ',390 V420'} stroke={outputColors[column]} />
          <text x={x} y={449}>Σe² = {state.sse[column]} {unitResidualWitness.units[column]}²</text>
          <text x={x} y={486}>÷2 rows → MSE {state.mse[column]}</text>
          <text x={x} y={529}>√ → RMSE {state.rmse[column]} {unitResidualWitness.units[column]}</text>
        </g>;
      })}
    </MultiLabelCanvas>
    <FlowControls>
      <label>Supplied residual row<select
        aria-label="Supplied residual row"
        value={selected}
        onChange={event => setSelected(Number(event.target.value))}
      >
        <option value={0}>First supplied row</option>
        <option value={1}>Second supplied row</option>
      </select></label>
      <button type="button" onClick={() => setSelected(0)}>Reset residual row</button>
    </FlowControls>
    <FlowReadout>Row {selected}: observation [{unitResidualWitness.observed[selected].join(', ')}], prediction [{unitResidualWitness.predicted[selected].join(', ')}]; prediction-minus-observation residual [{state.residuals[selected].join(', ')}]. The two-row RMSE is 1°C and 3Wh. These supplied arithmetic values are not fitted or held-out performance; the separate recorded 120-row experiment below reports its own errors.</FlowReadout>
    <MultiLabelTable
      caption="Preserved 120-row construction: 90 training/30 held-out; original printed results, not the two supplied pairs"
    >
      <thead>
        <tr>
          <th>Model</th>
          <th>Temperature RMSE °C</th>
          <th>Energy RMSE Wh</th>
          <th>Training-scale MSE</th>
        </tr>
      </thead>
      <tbody>
        {[['Mean', 1.591947, 14.119042, .587719], ['OLS', .180527, 4.620232, .038911], ['Ridge', .177978, 4.605764, .038596], ['Linear chain', .180527, 4.620232, .038911]].map(row => <tr key={row[0]}>
          <th>
            {row[0]}
          </th>
          {row.slice(1).map((value, index) => <td key={index}>
            {value}
          </td>)}
        </tr>)}
      </tbody>
    </MultiLabelTable>
  </MultiLabelFigure>;
}
function MatrixGrid({
  matrix,
  x,
  y,
  cellWidth = 92,
  cellHeight = 35,
  selectedRow = -1,
  selectedColumn = -1,
  color = '#c3b1ce'
}) {
  return <g>
    {matrix.map((row, i) => row.map((value, j) => <g key={i + '-' + j}>
      <rect
        x={x + j * cellWidth}
        y={y + i * cellHeight}
        width={cellWidth}
        height={cellHeight}
        fill={selectedRow === i || selectedColumn === j ? color : '#111114'}
        fillOpacity={selectedRow === i || selectedColumn === j ? .17 : 1}
        stroke={selectedRow === i || selectedColumn === j ? '#fff' : color}
      />
      <text x={x + (j + .5) * cellWidth} y={y + (i + .5) * cellHeight + 6} textAnchor="middle">
        {number(value)}
      </text>
    </g>))}
  </g>;
}
export function SeparateMatrixSolveFigure() {
  const [row, setRow] = useState(0);
  const [output, setOutput] = useState(0);
  const state = numericForwardTrace(saved, row, output);
  return <MultiLabelFigure
    job="D43"
    description="Saved original-unit coefficients are traced through centered input products and independent output columns; Gram factorization work is shared without a cross-output penalty"
  >
    <MultiLabelCanvas
      width={1050}
      height={590}
      title="Actual saved 24-row OLS: centered X is 24×3; Y is 24×2; coefficients W are 3×2"
    >
      <text x={16} y={30}>Saved numerical construction; original-unit outputs U0/U1. Separate from the °C/Wh example.</text>
      <text x={16} y={76}>First four centered X rows</text>
      <MatrixGrid
        matrix={state.centeredX.slice(0, 4)}
        x={16}
        y={94}
        cellWidth={100}
        selectedRow={row < 4 ? row : -1}
      />
      <text x={393} y={76}>First four centered Y rows</text>
      <MatrixGrid
        matrix={state.centeredY.slice(0, 4)}
        x={393}
        y={94}
        cellWidth={100}
        selectedRow={row < 4 ? row : -1}
        selectedColumn={output}
        color={outputColors[output]}
      />
      <path d="M316,155 H372" stroke="#c3b1ce" />
      <text x={333} y={142}>rows</text>
      <text x={716} y={76}>Saved coefficient columns W</text>
      <MatrixGrid
        matrix={saved.olsWeights}
        x={716}
        y={94}
        cellWidth={145}
        selectedColumn={output}
        color={outputColors[output]}
      />
      <text x={16} y={280}>One Gram matrix XcᵀXc · shared left side</text>
      <MatrixGrid matrix={state.gram} x={16} y={301} cellWidth={100} />
      <path d="M316,354 H372" stroke="#c3b1ce" />
      <text x={332} y={339}>→</text>
      <text x={393} y={280}>Two right sides XcᵀYc</text>
      <MatrixGrid
        matrix={state.cross}
        x={393}
        y={301}
        cellWidth={100}
        selectedColumn={output}
        color={outputColors[output]}
      />
      <path d="M593,354 H660 V199 H716" stroke="#c3b1ce" fill="none" />
      <text x={607} y={425}>solve each column</text>
      <text x={716} y={302}>Full centered rank = 3</text>
      <text x={716} y={337}>Saved NumPy OLS W above</text>
      <text x={716} y={377}>No penalty links U0 to U1</text>
      <text x={16} y={453}>Selected centered row {row}, output U{output}: multiply each feature by its own W column.</text>
      {state.products.map((value, index) => <g key={index}>
        <text
          x={16 + index * 240}
          y={490}
          style={{
            fill: outputColors[output]
          }}
        >{number(state.centeredX[row][index])} × {number(saved.olsWeights[index][output])}</text>
        <text x={16 + index * 240} y={527}>= {number(value)}</text>
        <path d={'M' + (120 + index * 240) + ',539 V555 H790'} stroke={outputColors[output]} fill="none" />
      </g>)}
      <circle cx={814} cy={555} r={22} fill="#111114" stroke={outputColors[output]} />
      <text x={814} y={561} textAnchor="middle">Σ</text>
      <text x={848} y={561}>
        {number(state.centeredPrediction)}
      </text>
    </MultiLabelCanvas>
    <FlowControls>
      <label>Saved OLS row<select aria-label="Saved OLS row" value={row} onChange={event => setRow(Number(event.target.value))}>
        {saved.inputs.map((_, index) => <option key={index} value={index}>Recorded row {index}</option>)}
      </select></label>
      <label>Separate coefficient column<select
        aria-label="OLS output column"
        value={output}
        onChange={event => setOutput(Number(event.target.value))}
      >
        <option value={0}>U0 · amber</option>
        <option value={1}>U1 · blue</option>
      </select></label>
      <button
        type="button"
        onClick={() => {
          setRow(0);
          setOutput(0);
        }}
      >Reset matrix trace</button>
    </FlowControls>
    <FlowReadout>Σ of selected products is {number(state.centeredPrediction)}. Add training output mean {number(state.meanY[output])} to restore prediction {number(state.restored)}. The original-input route XW+b gives {number(state.prediction)} with saved b={number(saved.olsIntercept[output])}. Sharing X's factorization saves work; each output still has its own coefficient vector.</FlowReadout>
    <MultiLabelTable caption="All actual saved construction rows, centered inputs and both target values">
      <thead>
        <tr>
          <th>Row</th>
          <th>Original X</th>
          <th>Centered X</th>
          <th>Original Y</th>
          <th>Centered Y</th>
        </tr>
      </thead>
      <tbody>
        {saved.inputs.map((values, index) => <tr key={index}>
          <th>
            {index}
          </th>
          <td>
            {values.map(value => number(value)).join(', ')}
          </td>
          <td>
            {state.centeredX[index].map(value => number(value)).join(', ')}
          </td>
          <td>
            {saved.targets[index].map(value => number(value)).join(', ')}
          </td>
          <td>
            {state.centeredY[index].map(value => number(value)).join(', ')}
          </td>
        </tr>)}
      </tbody>
    </MultiLabelTable>
  </MultiLabelFigure>;
}
export function LinearChainCancellationFigure() {
  return <MultiLabelFigure
    job="D44"
    description="Actual served predecessor substitution is drawn into effective coefficient columns and the matching-penalty normal equation before declaring cancellation"
  >
    <MultiLabelCanvas
      width={1000}
      height={615}
      title="Centered true-label linear chain: matching original-feature penalties make the served effective column solve the independent equation"
    >
      <text x={16} y={30}>Training uses Y_prev; serving uses X B_prev. Their identities are different.</text>
      <text x={16} y={91}>Serve original X</text>
      <path d="M155,85 H210 V142 H250 M210,85 H560 V142 H615" stroke="#c7b3d2" fill="none" />
      <rect x={250} y={119} width={145} height={90} fill="#111114" stroke="#f0b45b" />
      <text x={322} y={150} textAnchor="middle">β_x</text>
      <text x={322} y={184} textAnchor="middle">d × 1</text>
      <rect x={615} y={119} width={255} height={90} fill="#111114" stroke="#75adff" />
      <text x={742} y={150} textAnchor="middle">B_prev β_p</text>
      <text x={742} y={184} textAnchor="middle">(d × k)(k × 1)</text>
      <path d="M322,209 V248 H470 M742,209 V248 H514" stroke="#c7b3d2" fill="none" />
      <circle cx={492} cy={248} r={22} fill="#111114" stroke="#c7b3d2" />
      <text x={492} y={255} textAnchor="middle">+</text>
      <path d="M492,270 V303" stroke="#c7b3d2" />
      <text x={492} y={332} textAnchor="middle">Effective B = β_x + B_prev β_p</text>
      <text x={16} y={389}>A = XᵀX + λI</text>
      <text x={16} y={426}>Training: Aβ_x + (XᵀY_prev)β_p = Xᵀy</text>
      <path d="M263,435 V458 H548 V435" stroke="#75adff" fill="none" />
      <text
        x={580}
        y={457}
        style={{
          fill: '#75adff'
        }}
      >XᵀY_prev = A B_prev</text>
      <text x={16} y={503}>Substitute: A(β_x + B_prev β_p) = Xᵀy</text>
      <text x={16} y={548}>Unique matching solve → independent coefficient column.</text>
      <text x={16} y={594}>Ridge keeps λ: XᵀY_prev ≠ XᵀX B_prev in general.</text>
    </MultiLabelCanvas>
    <FlowReadout>The proof uses centered matching preprocessing, unpenalized intercepts, true previous training targets and one matching slope penalty. Full column rank is needed for unique OLS; positive ridge λ gives a unique slope solve. OOF inputs, unequal penalties or nonlinear stages remove the stated premise. No pseudoinverse extension is claimed.</FlowReadout>
    <MultiLabelTable
      caption="Actual saved matching-λ=.7 columns: chain effective coefficients and separate ridge coefficients"
    >
      <thead>
        <tr>
          <th>Feature</th>
          <th>Chain U0</th>
          <th>Independent U0</th>
          <th>Chain U1</th>
          <th>Independent U1</th>
        </tr>
      </thead>
      <tbody>
        {saved.chainWeights.map((row, index) => <tr key={index}>
          <th>
            {index}
          </th>
          <td>
            {String(row[0])}
          </td>
          <td>
            {String(saved.ridgeWeights[index][0])}
          </td>
          <td>
            {String(row[1])}
          </td>
          <td>
            {String(saved.ridgeWeights[index][1])}
          </td>
        </tr>)}
      </tbody>
    </MultiLabelTable>
    <MultiLabelTable caption="Preserved serving outcomes and the actual unequal-penalty counterexample">
      <thead>
        <tr>
          <th>Recorded state</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        {saved.queries.map((query, index) => <tr key={index}>
          <th>Query [{query.join(', ')}]</th>
          <td>
            {saved.queriesPredicted[index].map(String).join(', ')}
          </td>
        </tr>)}
        <tr>
          <th>Predecessor λ=.7; final λ=4</th>
          <td>Maximum coefficient difference from independent λ=4: {String(saved.changedCoefficientDifference)}</td>
        </tr>
      </tbody>
    </MultiLabelTable>
  </MultiLabelFigure>;
}
export function RootReductionFigure() {
  const [first, setFirst] = useState(1);
  const [second, setSecond] = useState(9);
  const [revision, setRevision] = useState(0);
  const state = rootAggregation(first, second);
  return <MultiLabelFigure
    job="D45"
    description="Two genuine operator trees show roots before averaging versus averaging before rooting with per-output raw-value ports"
  >
    <MultiLabelCanvas
      width={736}
      height={564}
      title="Compare operation order on two declared compatible-scale MSE inputs"
    >
      <text x={16} y={30}>
        <tspan x={16}>{'Only combine outputs after choosing compatible units '}</tspan>
        <tspan x={16} dy={26}>or explicit dimensionless scales.</tspan>
      </text>
      <g transform="translate(0 28)">
      {[first, second].map((value, index) => <g key={index}>
        <circle cx={100 + index * 210} cy={99} r={34} fill="#111114" stroke={outputColors[index]} />
        <text x={100 + index * 210} y={105} textAnchor="middle">
          {number(value)}
        </text>
        <text
          x={16 + index * 210}
          y={163}
          style={{
            fill: outputColors[index]
          }}
        >MSE U{index}</text>
        <path d={'M' + (100 + index * 210) + ',133 V192'} stroke={outputColors[index]} />
        <circle cx={100 + index * 210} cy={214} r={22} fill="#111114" stroke={outputColors[index]} />
        <text x={100 + index * 210} y={221} textAnchor="middle">√</text>
        <text x={100 + index * 210} y={277} textAnchor="middle">
          {number(state.roots[index])}
        </text>
        <path d={'M' + (100 + index * 210) + ',293 V326 H184'} stroke={outputColors[index]} fill="none" />
      </g>)}
      <circle cx={205} cy={326} r={22} fill="#111114" stroke="#c9b5d4" />
      <text x={205} y={333} textAnchor="middle">μ</text>
      <path d="M205,348 V389" stroke="#c9b5d4" />
      <text x={205} y={422} textAnchor="middle">API RMSE {number(state.rootsThenMean)}</text>
      <path d="M134,99 H166 V54 H475 V214 M344,99 H385 V74 H519 V214" stroke="#c9b5d4" fill="none" />
      <circle cx={497} cy={214} r={22} fill="#111114" stroke="#c9b5d4" />
      <text x={497} y={221} textAnchor="middle">μ</text>
      <text x={547} y={221}>mean MSE {number(state.mean)}</text>
      <path d="M497,236 V304" stroke="#c9b5d4" />
      <circle cx={497} cy={326} r={22} fill="#111114" stroke="#c9b5d4" />
      <text x={497} y={333} textAnchor="middle">√</text>
      <path d="M497,348 V389" stroke="#c9b5d4" />
      <text x={497} y={422} textAnchor="middle">Root of mean {number(state.meanThenRoot)}</text>
      <text x={16} y={476}>Raw-value port before averaging: [{state.roots.map(value => number(value)).join(', ')}]</text>
      <text x={16} y={522}>The two orders agree when the two MSE inputs agree, including both zero.</text>
      </g>
    </MultiLabelCanvas>
    <FlowControls>
      <MultiLabelQuantity
        label="MSE U0"
        value={first}
        min={0}
        max={100}
        revision={revision}
        onChange={setFirst}
      />
      <MultiLabelQuantity
        label="MSE U1"
        value={second}
        min={0}
        max={100}
        revision={revision}
        onChange={setSecond}
      />
      <button
        type="button"
        onClick={() => {
          setFirst(1);
          setSecond(9);
          setRevision(value => value + 1);
        }}
      >Reset root order</button>
    </FlowControls>
    <FlowReadout>Per-output roots are [{state.roots.map(value => number(value)).join(', ')}]. Their mean is {number(state.rootsThenMean)}, matching uniform-average root_mean_squared_error. Averaging MSE first gives {number(state.mean)}, whose root is {number(state.meanThenRoot)}. Raw-values reporting keeps each original output visible before a combined decision.</FlowReadout>
  </MultiLabelFigure>;
}
