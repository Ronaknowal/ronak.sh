import { useState } from 'react';
import { compressedHandDictionary, compressedHandRecovery, denseConditionalMeanHand, rareCompressionHand, reducedRankHand, reducedRankHandX, reducedRankHandY } from '../../data/multilabel-reading-flow-compression-models.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelQuantity, MultiLabelTable, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';
const outputColors = ['#f0b45b', '#75adff', '#bc9aff', '#ef8ca4'];
const featureColors = ['#ef8ca4', '#bc9aff'];
const labelNames = ['A', 'B', 'C', 'D'];
function Matrix({
  values,
  x,
  y,
  width = 94,
  height = 42,
  colors = outputColors,
  rowColors = null,
  labels = null
}) {
  return <g>
    {labels?.map((label, column) => <text
      key={label}
      x={x + (column + .5) * width}
      y={y - 12}
      textAnchor="middle"
      style={{
        fill: colors[column]
      }}
    >
      {label}
    </text>)}
    {values.map((row, i) => row.map((value, j) => <g key={i + '-' + j}>
      <rect
        x={x + j * width}
        y={y + i * height}
        width={width}
        height={height}
        fill="#111114"
        stroke={rowColors?.[i] || colors[j] || '#c7b1d3'}
      />
      <text
        x={x + (j + .5) * width}
        y={y + i * height + height / 2 + 6}
        textAnchor="middle"
        style={{
          fill: colors[j] || '#eee8f0'
        }}
      >
        {typeof value === 'string' ? value : number(value)}
      </text>
    </g>))}
  </g>;
}
function Wire({
  from,
  to,
  label,
  color = '#c7b1d3',
  labelY
}) {
  return <g>
    <path d={`M${from[0]},${from[1]} H${to[0] - 9}`} stroke={color} fill="none" />
    <path
      d={`M${to[0] - 17},${to[1] - 6} L${to[0] - 9},${to[1]} L${to[0] - 17},${to[1] + 6}`}
      stroke={color}
      fill="none"
    />
    {label && <text x={(from[0] + to[0]) / 2} y={labelY ?? from[1] - 14} textAnchor="middle">
      {label}
    </text>}
  </g>;
}
export function FittedResponseProjectionFigure() {
  const state = reducedRankHand();
  return <MultiLabelFigure
    job="D50"
    description="Actual centered input and response matrices factor into Q and R; Q-transpose extracts fitted response coordinates while the residual is orthogonal to the input span"
  >
    <MultiLabelCanvas
      width={1060}
      height={689}
      title="Four centered observations, two full-rank input columns and two named response columns; explicit reduced QR projection"
    >
      <text x={16} y={29}>Input features f0 rose / f1 violet; response columns U0 amber / U1 blue.</text>
      <text x={16} y={79}>Centered X · 4×2</text>
      <Matrix values={reducedRankHandX} x={16} y={113} colors={featureColors} labels={['f0', 'f1']} />
      <text x={365} y={79}>Q = X/√2 · orthonormal columns</text>
      <Matrix values={state.basis} x={365} y={113} colors={featureColors} labels={['q0', 'q1']} />
      <Wire from={[204, 197]} to={[365, 197]} label="÷√2" />
      <text x={715} y={79}>R = √2 I · invertible 2×2</text>
      <Matrix values={state.triangular} x={715} y={113} colors={featureColors} labels={['f0', 'f1']} />
      <Wire from={[553, 197]} to={[715, 197]} label="X = QR" />
      <text x={16} y={337}>Centered Y · 4×2</text>
      <Matrix values={reducedRankHandY} x={16} y={371} labels={['U0', 'U1']} />
      <text x={365} y={337}>Z = QᵀY · 2×2</text>
      <Matrix values={state.projected} x={365} y={371} labels={['U0', 'U1']} />
      <Wire from={[204, 455]} to={[365, 455]} label="Qᵀ ×" />
      <text x={365} y={497}>Fitted energy: 8 + 2 = 10</text>
      <text x={715} y={337}>Unfit Y−QZ · 4×2</text>
      <Matrix values={state.unfit} x={715} y={371} labels={['U0', 'U1']} />
      <Wire from={[553, 455]} to={[715, 455]} label="Y − QZ" />
      <text x={715} y={579}>Unfit SSE = 400</text>
      <text x={16} y={620}>Raw response energy: U0 = 8, U1 = 402. Projected fitted energy: U0 = 8, U1 = 2.</text>
      <text x={16} y={660}>QᵀQ=I and rank(X)=2. The unfit component has Qᵀ(Y−QZ)=0.</text>
    </MultiLabelCanvas>
    <FlowReadout>The four observed response rows have much greater raw energy in U1. Projection through the actual two-column input span leaves singular directions 2√2 and √2, so U0 has the stronger fitted direction. The remaining U1 values [10, 10, −10, −10] cannot be fitted by this centered X.</FlowReadout>
  </MultiLabelFigure>;
}
export function ReducedRankSolveFigure() {
  const [rank, setRank] = useState(1);
  const state = reducedRankHand(rank);
  return <MultiLabelFigure
    job="D51"
    description="Fitted-response singular directions are retained by rank, solved through R into coefficients, and restored to four predictions alongside the different raw-target PCA route"
  >
    <MultiLabelCanvas
      width={1036}
      height={740}
      title="Two exact fitted singular directions, rank mask, triangular solve and original-unit predictions; raw-target PCA comparison"
    >
      <text x={16} y={30}>Same centered X/Y as above. U0 amber / U1 blue. Rank selects fitted response directions.</text>
      <text x={16} y={82}>σ of fitted Z</text>
      {state.fittedSingular.map((value, j) => <g key={j}>
        <text x={16} y={122 + j * 78}>σ{j} = {number(value)}</text>
        <rect
          x={16}
          y={138 + j * 78}
          width={value * 56}
          height={18}
          fill={outputColors[j]}
          opacity={j < rank ? 1 : .24}
        />
        <text x={205} y={153 + j * 78}>
          {j < rank ? 'retain' : 'discard'}
        </text>
      </g>)}
      <text x={354} y={82}>Z_rank · U0 / U1</text>
      <Matrix values={state.retained} x={354} y={110} labels={['U0', 'U1']} />
      <Wire from={[270, 172]} to={[354, 172]} label="mask" labelY={242} />
      <text x={704} y={82}>W_rank · f0 / f1 rows</text>
      <Matrix values={state.weights} x={704} y={110} labels={['U0', 'U1']} rowColors={featureColors} />
      <Wire from={[542, 172]} to={[704, 172]} label="R solve" />
      <text x={354} y={279}>R W_rank = Z_rank; intercept = [0, 0]</text>
      <text x={16} y={332}>RRR predictions XW · 4×2</text>
      <Matrix values={state.prediction} x={16} y={365} labels={['U0', 'U1']} />
      <text x={354} y={332}>Raw-target PCA rank 1 → regression</text>
      <Matrix values={state.rawPcaPrediction} x={354} y={365} labels={['U0', 'U1']} />
      <text x={704} y={332}>Raw Y singular values</text>
      {state.rawSingular.map((value, j) => <g key={j}>
        <text x={704} y={373 + j * 83}>σ{j} = {number(value)}</text>
        <rect x={704} y={389 + j * 83} width={value * 12} height={18} fill={outputColors[1 - j]} />
        <text x={704} y={430 + j * 83}>
          {j === 0 ? 'first direction: U1' : 'second direction: U0'}
        </text>
      </g>)}
      <text x={16} y={579}>RRR SSE = {state.error}</text>
      <text x={354} y={579}>Raw-target PCA route SSE = 408</text>
      <text x={16} y={626}>RRR: fixed unfit 400 + discarded fitted {state.fittedDiscardError} = {state.error}.</text>
      <text x={16} y={668}>Raw PCA route: fixed unfit 400 + discarded fitted U0 energy 8 = 408.</text>
      <text x={16} y={715}>Full centered column rank makes R invertible. Output units/weights alter this squared-error objective.</text>
    </MultiLabelCanvas>
    <FlowControls>
      <label>Retained fitted rank <select
        aria-label="Retained fitted rank"
        value={rank}
        onChange={event => setRank(Number(event.target.value))}
      >
        <option value={1}>1 direction</option>
        <option value={2}>2 directions</option>
      </select></label>
      <button type="button" onClick={() => setRank(1)}>Reset rank</button>
    </FlowControls>
    <FlowReadout>Rank {rank} gives the displayed coefficient matrix and four predictions, with training SSE {state.error}. The raw-target PCA rank-1 route always keeps U1 here and has SSE 408. This hand arithmetic illustrates the NumPy QR/SVD/solve route in the complete program; changing rank is not a new fitted experiment.</FlowReadout>
  </MultiLabelFigure>;
}
export function RareLabelCompressionFigure() {
  const [row, setRow] = useState(0);
  const [revision, setRevision] = useState(0);
  const state = rareCompressionHand(row);
  return <MultiLabelFigure
    job="D52"
    description="All 200 original binary rows and the selected row map through one common centered direction while the rare output is reconstructed at its mean"
  >
    <MultiLabelCanvas
      width={996}
      height={806}
      title="Centered row-sample compression: two repeated common columns and a third rare label with two positives; energy and recall are distinct"
    >
      <text x={16} y={30}>Common0 amber / common1 blue / rare violet. Selected original row {row}.</text>
      <text x={16} y={79}>All 200 original rows</text>
      {['C0', 'C1', 'rare'].map((label, j) => <text
        key={label}
        x={88 + j * 58}
        y={112}
        textAnchor="middle"
        style={{
          fill: outputColors[j]
        }}
      >
        {label}
      </text>)}
      {Array.from({
        length: 200
      }, (_, i) => <g key={i}>
        {[i % 2, i % 2, Number(i < 2)].map((value, j) => <rect
          key={j}
          x={65 + j * 58}
          y={132 + i * 2.3}
          width={46}
          height={2}
          fill={value ? outputColors[j] : '#27232b'}
        />)}
        {i === row && <path d={`M45,${133 + i * 2.3} H59 M238,${133 + i * 2.3} H255`} stroke="#eee8f0" strokeWidth={2} />}
      </g>)}
      <text x={16} y={633}>200 rows; rare positives only 0, 1</text>
      <text x={354} y={79}>Squared singular energy</text>
      {state.energy.map((energy, j) => <g key={j}>
        <text x={354} y={122 + j * 73}>direction {j}: {number(energy)}</text>
        <rect
          x={354}
          y={139 + j * 73}
          width={Math.max(energy > 0 ? 2 : 0, energy * 3)}
          height={17}
          fill={j === 0 ? '#d5c3df' : outputColors[2]}
        />
      </g>)}
      <text x={354} y={357}>Retain direction 0: energy {number(state.retained)}</text>
      <text x={354} y={402}>Selected raw row</text>
      <Matrix values={[state.original]} x={354} y={440} labels={['common0', 'common1', 'rare']} />
      <text x={354} y={526}>Centered common coordinate = {number(state.coordinate)}</text>
      <path d="M636,461 H655 V632 H643" stroke="#d5c3df" fill="none" />
      <text x={674} y={580}>project, inverse, + mean</text>
      <text x={354} y={575}>Rank-1 reconstructed row</text>
      <Matrix values={[state.reconstructed]} x={354} y={611} labels={['common0', 'common1', 'rare']} />
      <text x={354} y={693}>At threshold .5 → [{state.decisions.join(', ')}]</text>
      <text x={16} y={754}>Rare reconstruction is always .01. Rare support = 2/200; rare recall = 0.</text>
      <text x={16} y={789}>This is centered row-sample compression, distinct from original uncentered PLST.</text>
    </MultiLabelCanvas>
    <FlowControls>
      <MultiLabelQuantity
        label="Original compression row"
        value={row}
        min={0}
        max={199}
        integer
        revision={revision}
        onChange={setRow}
      />
      <button
        type="button"
        onClick={() => {
          setRow(0);
          setRevision(value => value + 1);
        }}
      >Reset compression row</button>
    </FlowControls>
    <FlowReadout>Row {row} is [{state.original.join(', ')}]; one centered direction restores [{state.reconstructed.join(', ')}]. Retained energy is {number(state.retained)}, yet both rare positive rows are predicted negative at .5. Row selection exposes the same exact construction, rather than fitting another SVD.</FlowReadout>
  </MultiLabelFigure>;
}
export function CompressedRecoveryFigure() {
  const [first, setFirst] = useState(1);
  const [second, setSecond] = useState(0);
  const [cap, setCap] = useState(1);
  const [revision, setRevision] = useState(0);
  const state = compressedHandRecovery([first, second], cap);
  const point = vector => [174 + vector[0] * 64, 350 - vector[1] * 64];
  const measured = point(state.measurement),
    remainder = point(state.residual);
  return <MultiLabelFigure
    job="D53"
    description="Three normalized label atoms span two measurement coordinates; actual absolute correlations choose active atoms, a small Gram solve gives coefficients and residual updates"
  >
    <MultiLabelCanvas
      width={1084}
      height={723}
      title="Two-measurement OMP hand dictionary, actual correlation/active-system trace and restored three-label vector"
    >
      <text x={16} y={30}>Dictionary atoms A amber / B blue / C violet. z and residual are measurement vectors.</text>
      <text x={16} y={79}>A · measurement rows × label atoms</text>
      <Matrix values={compressedHandDictionary} x={16} y={112} labels={['A', 'B', 'C']} />
      <path d="M38,350 H310 M174,214 V486" stroke="#b7a3c1" fill="none" />
      {[-2, -1, 1, 2].map(value => <g key={value}>
        <text x={174 + value * 64} y={514} textAnchor="middle">
          {value}
        </text>
        <text x={30} y={356 - value * 64} textAnchor="end">
          {value}
        </text>
      </g>)}
      {compressedHandDictionary[0].map((_, atom) => {
        const end = point(compressedHandDictionary.map(values => values[atom]));
        return <g key={atom}>
          <path d={`M174,350 L${end[0]},${end[1]}`} stroke={outputColors[atom]} strokeWidth={3} fill="none" />
          <text
            x={end[0] + 12}
            y={end[1] - 13}
            style={{
              fill: outputColors[atom]
            }}
          >
            {labelNames[atom]}
          </text>
        </g>;
      })}
      <circle cx={measured[0]} cy={measured[1]} r={7} fill="#eee8f0" />
      <text x={measured[0] + 13} y={measured[1] + 23}>z</text>
      <path
        d={`M174,350 L${remainder[0]},${remainder[1]}`}
        stroke="#ef8ca4"
        fill="none"
        strokeDasharray="4 4"
      />
      <rect x={remainder[0] - 5} y={remainder[1] - 5} width={10} height={10} fill="#ef8ca4" />
      <text
        x={remainder[0] - 12}
        y={remainder[1] + 23}
        textAnchor="end"
        style={{
          fill: '#ef8ca4'
        }}
      >residual</text>
      <text x={16} y={550}>measurement axis 0 horizontal / 1 vertical</text>
      <text x={390} y={79}>Aᵀr · choose largest |correlation|</text>
      {(state.trace.length ? state.trace : [{
        correlations: [0, 0, 0],
        active: [],
        chosen: null,
        gram: [],
        rhs: [],
        local: [],
        residualAfter: state.residual
      }]).map((step, i) => <g key={i}>
        <text x={390} y={114 + i * 217}>{state.trace.length ? 'Step ' + (i + 1) : 'Initial zero state'}: active [{step.active.map(atom => labelNames[atom]).join(', ')}]</text>
        <Matrix values={[step.correlations]} x={390} y={152 + i * 217} labels={['A', 'B', 'C']} />
        {step.chosen !== null && <g>
          <rect
            x={390 + step.chosen * 94}
            y={152 + i * 217}
            width={94}
            height={42}
            fill="none"
            stroke="#eee8f0"
            strokeWidth={3}
          />
          <text x={719} y={124 + i * 217}>Active Gram G</text>
          <Matrix
            values={step.gram}
            x={719}
            y={146 + i * 217}
            width={75}
            height={38}
            colors={step.active.map(atom => outputColors[atom])}
          />
          <text x={891} y={124 + i * 217}>A_activeᵀz</text>
          <Matrix
            values={step.rhs.map(value => [value])}
            x={891}
            y={146 + i * 217}
            width={137}
            height={38}
            colors={['#d5c3df']}
          />
          <text x={719} y={249 + i * 217}>G c = rhs → c=[{step.local.map(value => number(value)).join(', ')}]</text>
        </g>}
        <text x={390} y={286 + i * 217}>r ← z−A_active c = [{step.residualAfter.map(value => number(value)).join(', ')}]</text>
      </g>)}
      <text x={16} y={592}>Restored original label coordinates</text>
      <Matrix values={[state.coefficients]} x={16} y={625} labels={['A', 'B', 'C']} />
      <text x={390} y={560}>Residual norm {number(state.residualNorm)} · {state.status}</text>
      <text x={390} y={608}>Selected atoms cannot repeat; exact ties use smaller original index.</text>
      <text x={16} y={705}>Unit columns; numerical active-rank check; tolerance 1e−10. A small residual does not prove unique recovery.</text>
    </MultiLabelCanvas>
    <FlowControls>
      <MultiLabelQuantity
        label="Measurement z0"
        value={first}
        min={-2}
        max={2}
        step={.1}
        revision={revision}
        onChange={setFirst}
      />
      <MultiLabelQuantity
        label="Measurement z1"
        value={second}
        min={-2}
        max={2}
        step={.1}
        revision={revision}
        onChange={setSecond}
      />
      <label>Maximum active atoms <select
        aria-label="Maximum active atoms"
        value={cap}
        onChange={event => setCap(Number(event.target.value))}
      >
        <option value={1}>1 atom</option>
        <option value={2}>2 atoms</option>
      </select></label>
      <button
        type="button"
        onClick={() => {
          setFirst(1);
          setSecond(0);
          setCap(1);
          setRevision(value => value + 1);
        }}
      >Reset measurements</button>
    </FlowControls>
    <FlowReadout>z=[{number(first)}, {number(second)}] selects [{state.active.map(atom => labelNames[atom]).join(', ') || 'no atoms'}], restoring [{state.coefficients.map(value => number(value)).join(', ')}]. Residual norm is {number(state.residualNorm)}; {state.status}. Gram/right-side values use the original z, while each next selection uses the current residual. The complete Python route also shows the ordinary API and its actual warning/tie behavior.</FlowReadout>
    <MultiLabelTable caption="Actual active solves for the current hand measurement">
      <thead>
        <tr>
          <th>Step</th>
          <th>Selected atom</th>
          <th>Active coefficients</th>
          <th>Residual before</th>
          <th>Residual after</th>
        </tr>
      </thead>
      <tbody>
        {state.trace.map(step => <tr key={step.step}>
          <td>
            {step.step + 1}
          </td>
          <td>
            {labelNames[step.chosen]}
          </td>
          <td>
            {step.local.map(value => number(value)).join(', ')}
          </td>
          <td>
            {step.residualBefore.map(value => number(value)).join(', ')}
          </td>
          <td>
            {step.residualAfter.map(value => number(value)).join(', ')}
          </td>
        </tr>)}
        {!state.trace.length && <tr>
          <td colSpan={5}>Zero measurement: residual tolerance reached before selecting an atom.</td>
        </tr>}
      </tbody>
    </MultiLabelTable>
  </MultiLabelFigure>;
}
export function SparseOutcomesDenseMeanFigure() {
  const state = denseConditionalMeanHand();
  return <MultiLabelFigure
    job="D54"
    description="Four equally likely one-hot outcomes average into a dense conditional mean; an explicit dictionary maps that mean and a different sparse vector to identical measurements"
  >
    <MultiLabelCanvas
      width={1090}
      height={754}
      title="Known four-outcome conditional law and a concrete dense-mean versus sparse-recovery ambiguity; no empirical rarity inference"
    >
      <text x={16} y={30}>At one fixed x: A amber / B blue / C violet / D rose. Each observed outcome has one positive.</text>
      <text x={16} y={79}>Four possible Y rows · probability .25 each</text>
      <Matrix values={state.outcomes} x={16} y={113} labels={labelNames} />
      {state.outcomes.map((_, row) => <text key={row} x={409} y={140 + row * 42}>× .25</text>)}
      <path d="M476,134 V263 M476,198 H555" stroke="#d5c3df" fill="none" />
      <circle cx={581} cy={198} r={24} stroke="#d5c3df" fill="#111114" />
      <text x={581} y={205} textAnchor="middle">Σ</text>
      <Wire from={[605, 198]} to={[668, 198]} />
      <text x={668} y={79}>E[Y|x] · four nonzero coordinates</text>
      <Matrix values={[state.mean]} x={668} y={176} labels={labelNames} />
      <text x={16} y={330}>Explicit A · three measurement rows × four label atoms</text>
      <Matrix values={state.dictionary} x={16} y={365} labels={labelNames} />
      <text x={568} y={330}>Dense mean z=A E[Y|x]</text>
      <Matrix
        values={[state.meanMeasurement]}
        x={568}
        y={365}
        labels={['z0', 'z1', 'z2']}
        colors={['#d5c3df', '#d5c3df', '#d5c3df']}
      />
      <Wire from={[392, 428]} to={[568, 428]} label="A × mean" />
      <text x={16} y={560}>Different sparse vector v</text>
      <Matrix values={[state.sparse]} x={16} y={594} labels={labelNames} />
      <text x={568} y={560}>Identical z=A v</text>
      <Matrix
        values={[state.sparseMeasurement]}
        x={568}
        y={594}
        labels={['z0', 'z1', 'z2']}
        colors={['#d5c3df', '#d5c3df', '#d5c3df']}
      />
      <Wire from={[392, 615]} to={[568, 615]} label="A × v" />
      <text x={16} y={696}>Measurement residual 0, but original-mean squared error = {number(state.outputError)}.</text>
      <text x={16} y={735}>Sparsity of observed Y does not imply sparsity of E[Y|x], the compressed regressor's target.</text>
    </MultiLabelCanvas>
    <FlowReadout>The four sparse outcomes have a dense expectation [.25, .25, .25, .25]. The explicit dictionary encodes this mean and [0, 0, 0, {number(state.sparse[3])}] to the same three measurements. Recovering that sparse vector loses .375 in original-mean squared error despite zero measurement residual.</FlowReadout>
    <MultiLabelTable
      caption="Preserved complete-program conditional-mean contrasts; fixed dictionaries and original output error"
    >
      <thead>
        <tr>
          <th>Conditional mean</th>
          <th>Dictionary</th>
          <th>Measurement residual</th>
          <th>Original-mean squared error</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>[.325, .2, 0, 0]</td>
          <td>Explicit four-atom contrast</td>
          <td>0</td>
          <td>0</td>
        </tr>
        <tr>
          <td>[.325, .2, 0, 0]</td>
          <td>Declared Gaussian seed 71</td>
          <td>1.494683e−16</td>
          <td>1.263410e−31</td>
        </tr>
        <tr>
          <td>[.25, .25, .25, .25]</td>
          <td>Explicit four-atom contrast</td>
          <td>9.614813e−17</td>
          <td>.375</td>
        </tr>
        <tr>
          <td>[.25, .25, .25, .25]</td>
          <td>Declared Gaussian seed 71</td>
          <td>.01940336</td>
          <td>.16499842</td>
        </tr>
      </tbody>
    </MultiLabelTable>
  </MultiLabelFigure>;
}
