import { useState } from 'react';
import { ensembleNumber } from '../../data/ensemble-methods-models.js';
import { constructedBiasVarianceLaw, equicorrelationCalculation, fixedCombinerStep, simplexProjectionTrace } from '../../data/ensemble-geometry-flow-models.js';
import { EnsembleVectorEntry } from './EnsembleFlowControls.jsx';
import { EnsembleFlowCanvas, EnsembleFlowFigure } from './EnsembleFlowCombination.jsx';
import './ensemble-flow-geometry.css';

const hues = ['#7fc9ba', '#b2b7e1', '#db96af', '#80b3e8'];
const amber = '#e8bb60';
const number = value => ensembleNumber(value, 7);
const tuple = values => `[${values.map(number).join(', ')}]`;

function CoordinatePlane({ trace, unitDetail = false }) {
  const origin = [0, 0, 0];
  const units = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const corners = [[1, 1, 0], [1, 0, 1], [0, 1, 1]];
  // Two orthonormal camera directions. This is a labelled orthographic view,
  // with numerical triples retaining the third-dimensional information.
  const view = point => [
    (3 * point[0] - 2 * point[1]) / Math.sqrt(13),
    (8 * point[0] + 12 * point[1] - 13 * point[2]) / Math.sqrt(377)
  ];
  const includedCandidate = !unitDetail || trace.candidate.every(value => value >= -1 && value <= 2);
  const points = [origin, ...units, ...corners, trace.weights, ...(includedCandidate ? [trace.candidate] : [])].map(view);
  const minimum = [0, 1].map(axis => Math.min(...points.map(point => point[axis])));
  const maximum = [0, 1].map(axis => Math.max(...points.map(point => point[axis])));
  const scale = Math.min(500 / (maximum[0] - minimum[0] || 1), 310 / (maximum[1] - minimum[1] || 1));
  const compressed = !unitDetail && scale < 50;
  const point = value => {
    const coordinates = view(value);
    return [110 + (coordinates[0] - minimum[0]) * scale, 76 + (coordinates[1] - minimum[1]) * scale];
  };
  const polygon = values => values.map(value => point(value).join(',')).join(' ');
  const projected = point(trace.weights);
  const candidate = point(trace.candidate);
  const zero = point(origin);
  const labels = ['A=1', 'B=1', 'C=1'];
  return <EnsembleFlowCanvas title={unitDetail ? 'Unit simplex detail with all three coordinate planes' : 'Orthographic coordinate planes and the closest sum-one nonnegative point'} width={720} height={470}>
    <text x={16} y={27}>{unitDetail ? 'Unit-coordinate detail' : 'Overview: includes the current candidate'}</text>
    {[[origin, units[0], corners[0], units[1]], [origin, units[0], corners[1], units[2]], [origin, units[1], corners[2], units[2]]].map((plane, index) => {
      const facePoint = point(corners[index].map(value => value * .65));
      return <g key={index}>
        <polygon points={polygon(plane)} fill="#91919b" fillOpacity={.055} stroke="#555560" strokeDasharray="3 5" />
        {!compressed && <text x={facePoint[0] - 16} y={facePoint[1] + 25} fill="#c6c6ce">{['C=0', 'B=0', 'A=0'][index]}</text>}
      </g>;
    })}
    <polygon points={polygon(units)} fill={amber} fillOpacity={.12} stroke={amber} />
    {units.map((value, index) => {
      const endpoint = point(value);
      return <g key={index}>
        <path d={`M${zero[0]},${zero[1]} L${endpoint[0]},${endpoint[1]}`} stroke={hues[index]} />
        <circle cx={endpoint[0]} cy={endpoint[1]} r={4} fill={hues[index]} />
        {!compressed && <text x={endpoint[0] + 8} y={endpoint[1] - 9} fill={hues[index]}>{labels[index]}</text>}
      </g>;
    })}
    <circle cx={zero[0]} cy={zero[1]} r={3} fill="#ededf0" />
    {!compressed && <text x={zero[0] + 8} y={zero[1] + 22}>origin (0,0,0)</text>}
    {includedCandidate && <>
      <path d={`M${candidate[0]},${candidate[1]} L${projected[0]},${projected[1]}`} stroke="#ededf0" strokeDasharray="4 4" />
      <circle cx={candidate[0]} cy={candidate[1]} r={6} fill="none" stroke="#ededf0" />
      <text x={candidate[0] + 10} y={candidate[1] + 22}>candidate v</text>
    </>}
    <circle cx={projected[0]} cy={projected[1]} r={5} fill={amber} />
    <text x={Math.max(16, projected[0] - 115)} y={projected[1] + 28} fill={amber}>{compressed ? 'unit simplex / projection' : 'projection'}</text>
    <text x={16} y={427}>Triangle: A+B+C=1; A, B, C ≥ 0.</text>
    <text x={16} y={456}>{includedCandidate ? 'Dashed segment: projection displacement in this view.' : 'Candidate is outside this unit detail; use the overview and triples.'}</text>
  </EnsembleFlowCanvas>;
}

function ProjectionOperands({ trace }) {
  return <div className="ensemble-geometry-operands">
    <p>Candidate v={tuple(trace.candidate)}.</p>
    <p><span style={{ color: amber }}>Projection={tuple(trace.weights)}</span>; displacement={tuple(trace.displacement)}.</p>
    <p>Squared Euclidean distance={number(trace.squaredDistance)}. Clipping and renormalizing gives {trace.renormalized === null ? 'no result: positive-coordinate total is zero' : `${tuple(trace.renormalized)}, squared distance ${number(trace.renormalizedDistance)}`}.</p>
    <p>The three coordinate planes are A=0, B=0 and C=0; their faces meet at the labelled origin. Numerical triples retain depth in this orthographic view.</p>
  </div>;
}

export function SimplexProjectionFigure() {
  const trace = simplexProjectionTrace([.8, .3, -.1]);
  return <EnsembleFlowFigure job="D10" title="The closest permitted point lies on this triangular simplex">
    <CoordinatePlane trace={trace} />
    <ProjectionOperands trace={trace} />
  </EnsembleFlowFigure>;
}

export function SimplexStepFigure() {
  const worked = fixedCombinerStep();
  const [candidate, setCandidate] = useState([.8, .3, -.1]);
  const [revision, setRevision] = useState(0);
  const trace = simplexProjectionTrace(candidate);
  return <EnsembleFlowFigure job="D10-step" title="Row residuals generate a step; projection returns a permitted vector">
    <div className="ensemble-geometry-table" tabIndex={0} role="region" aria-label="Fixed combining-step operands; scroll horizontally if needed">
      <table>
        <caption>Fixed P and y example · columns are member forecasts</caption>
        <thead><tr><th>Row</th><th>A</th><th>B</th><th>C</th><th>Pw</th><th>y</th><th>Pw−y</th></tr></thead>
        <tbody>{worked.rows.map(row => <tr key={row.id}><th>{row.id}</th>{row.values.map((value, index) => <td key={index} style={{ color: hues[index] }}>{number(value)}×1/3</td>)}<td>{number(row.forecast)}</td><td>{row.target}</td><td>{number(row.residual)}</td></tr>)}</tbody>
      </table>
    </div>
    <EnsembleFlowCanvas title="The transpose sends each actual row residual back into the three gradient sums" width={1010} height={390}>
      {worked.weights.map((weight, member) => <g key={member}>
        <text x={16} y={43 + member * 90} fill={hues[member]}>Member {['A', 'B', 'C'][member]}</text>
        <text x={145} y={43 + member * 90}>{worked.rows.map(row => `${row.values[member]}×(${number(row.residual)})`).join(' + ')}</text>
        <circle cx={465} cy={38 + member * 90} r={4} fill={hues[member]} />
        <path d={`M469,${38 + member * 90} H650`} stroke={hues[member]} />
        <text x={662} y={43 + member * 90}>grad {['A','B','C'][member]}: ÷3 + .2×1/3 = {number(worked.gradient[member])}</text>
        <text x={145} y={76 + member * 90}>1/3 − .02×({number(worked.gradient[member])}) = {number(worked.candidate[member])}</text>
      </g>)}
      <text x={16} y={337}>Derived candidate: {tuple(worked.candidate)}</text>
      <text x={16} y={370}>Projection: {tuple(worked.projection.weights)}. This is one step, not a fitted solution.</text>
    </EnsembleFlowCanvas>
    <CoordinatePlane trace={trace} />
    {candidate.some(value => value < -1 || value > 2) && <CoordinatePlane trace={trace} unitDetail />}
    <div className="ensemble-flow-controls">
      <EnsembleVectorEntry label="Projection candidate (A, B, C)" values={candidate} revision={revision} onChange={setCandidate} />
      <button type="button" onClick={() => setCandidate([...worked.candidate])}>Use the derived step</button>
      <button type="button" onClick={() => { setCandidate([.8, .3, -.1]); setRevision(previous => previous + 1); }}>Reset candidate</button>
    </div>
    <ProjectionOperands trace={trace} />
    <div className="ensemble-geometry-table" tabIndex={0} role="region" aria-label="Sorted coordinates and projection threshold; scroll horizontally if needed">
      <table>
        <caption>Sorted-prefix threshold · original A/B/C identities survive the sort</caption>
        <thead><tr><th>Prefix j</th><th>New coordinate</th><th>Prefix sum</th><th>τ_j=(sum−1)/j</th><th>u_j&gt;τ_j?</th></tr></thead>
        <tbody>{trace.prefixes.map((row, index) => <tr key={row.length}><th>{row.length}</th><td style={{ color: hues[trace.sortedMembers[index].index] }}>{trace.sortedMembers[index].id}: {number(trace.sortedMembers[index].value)}</td><td>{number(row.sum)}</td><td>{number(row.tau)}</td><td>{row.eligible ? 'yes' : 'no'}</td></tr>)}</tbody>
      </table>
    </div>
    <p aria-live="polite">Use the last eligible prefix j={trace.active}: τ={number(trace.threshold)}. Each returned coordinate is max(v−τ,0). The resulting weights are {tuple(trace.weights)}, with sum {number(trace.weights.reduce((sum,value)=>sum+value,0))}.</p>
  </EnsembleFlowFigure>;
}

export function PredictionCovarianceFigure() {
  const four = equicorrelationCalculation(4, 4, .25);
  const twenty = equicorrelationCalculation(20, 4, .25);
  return <EnsembleFlowFigure job="D11" title="Hold the request fixed and vary the training samples">
    <EnsembleFlowCanvas title="Repeated fitting experiments use one shared sample for the four members at the same query" width={1000} height={475}>
      <text x={16} y={26}>One fixed request x · symbolic repeated experiments, not observed runs</text>
      {[0, 1, 2].map(index => <g key={index}>
        <text x={35 + index * 320} y={66}>Experiment {index + 1}: sample D{index + 1}</text>
        {[0, 1, 2].map(row => <g key={row}>
          <rect x={35 + index * 320} y={84 + row * 28} width={26} height={20} fill="none" stroke="#92929d" />
          <path d={`M${75 + index * 320},${94 + row * 28} h100`} stroke="#92929d" strokeDasharray="3 4" />
        </g>)}
        <text x={35 + index * 320} y={187}>rows of (X,Y)</text>
        <path d={`M${130 + index * 320},199 V224`} stroke="#92929d" />
        <text x={35 + index * 320} y={253}>fit all A/B/C/D on this sample</text>
        <path d={`M${130 + index * 320},266 V285`} stroke="#92929d" />
        {hues.map((hue, member) => <text key={member} x={35 + index * 320} y={312 + member * 32} fill={hue}>
          F{['A','B','C','D'][member]}{index + 1}(x): random forecast
        </text>)}
      </g>)}
      <text x={16} y={462}>Co-variation compares member rows across these random fitting experiments.</text>
    </EnsembleFlowCanvas>
    <div className="ensemble-geometry-table ensemble-geometry-covariance" tabIndex={0} role="region" aria-label="Four-member covariance matrix; row identities remain while scrolling">
      <table>
        <caption>Assumed Σ in hours²: each entry compares its row and column forecasts</caption>
        <thead><tr><th>row / col</th>{hues.map((hue,index)=><th key={index} style={{color:hue}}>{['A','B','C','D'][index]}</th>)}</tr></thead>
        <tbody>{hues.map((hue,row)=><tr key={row}><th style={{color:hue}}>{['A','B','C','D'][row]}</th>{hues.map((columnHue,column)=><td key={column} style={{color:columnHue}}>{row===column?4:1}</td>)}</tr>)}</tbody>
      </table>
    </div>
    <EnsembleFlowCanvas title="The four diagonal and twelve cross contributions sum to the equal-weight variance" width={920} height={370}>
      <text x={16} y={27}>Assume member variance 4 h² and common correlation .25</text>
      <text x={16} y={61}>Σ entries: diagonal 4; off-diagonal .25×4=1 h²</text>
      <text x={16} y={102}>Every pair term carries w_i w_j=(1/4)(1/4)=1/16</text>
      <text x={16} y={149}>4 diagonal terms ×4/16</text>
      <path d="M220,145 H258" stroke={amber} />
      <text x={270} y={149}>1 h²</text>
      <circle cx={340} cy={145} r={4} fill={amber} />
      <text x={16} y={195}>12 cross terms ×1/16</text>
      <path d="M220,191 H258" stroke={amber} />
      <text x={270} y={195}>.75 h²</text>
      <circle cx={340} cy={191} r={4} fill={amber} />
      <path d="M344,145 H392 V191 H450" stroke={amber} fill="none" />
      <path d="M344,191 H450" stroke={amber} />
      <text x={467} y={193} fill={amber}>wᵀΣw =1+.75= {number(four.combinedVariance)} h²</text>
      <text x={16} y={281}>Possible covariance: eigenvalues 7 (shared direction), 3 (three contrast directions).</text>
      <text x={16} y={338}>At 20 members: 20×4/400 + 380×1/400 = {number(twenty.combinedVariance)} h².</text>
    </EnsembleFlowCanvas>
    <p>This covariance describes training randomness at one x. It is a different object from the four fixed-row residuals. Under these assumptions, the shared component leaves the limit 4×.25=1 h²; copying forecasts at correlation 1 would leave variance 4 h².</p>
  </EnsembleFlowFigure>;
}

export function BiasVarianceNoiseFigure() {
  const law = constructedBiasVarianceLaw();
  const position = value => 95 + (value - 8) * 75;
  return <EnsembleFlowFigure job="D12" title="A procedure's random forecast and a future outcome have different variation">
    <EnsembleFlowCanvas title="An invented independent two-point law separates bias, fitting variation and target noise" width={780} height={475}>
      <text x={16} y={28}>Illustrative law in hours · not measured predictions</text>
      {[8,9,10,11,12,13,14,15].map(value=><g key={value}><path d={`M${position(value)},65 V386`} stroke="#393941" strokeDasharray="2 5"/><text x={position(value)-7} y={420}>{value}</text></g>)}
      <text x={16} y={62}>forecast</text>
      <path d={`M${position(8)},127 H${position(15)}`} stroke="#74747f" />
      {law.predictions.map(value=><g key={value}><circle cx={position(value)} cy={127} r={6} fill={hues[0]}/><text x={position(value)-35} y={100} fill={hues[0]}>F={value}; p=.5</text></g>)}
      <circle cx={position(law.predictionMean)} cy={127} r={6} fill={amber}/>
      <text x={position(law.predictionMean)-33} y={160} fill={amber}>E[F]=12</text>
      <path d={`M${position(10)},190 H${position(12)}`} stroke={amber}/>
      <path d={`M${position(10)},181 V199 M${position(12)},181 V199`} stroke={amber}/>
      <text x={position(10)+12} y={221}>signed bias: 12−10=2 h</text>
      <text x={16} y={275}>outcome</text>
      <path d={`M${position(8)},313 H${position(15)}`} stroke="#74747f" />
      {law.noises.map(noise=><g key={noise}><circle cx={position(10+noise)} cy={313} r={6} fill="none" stroke="#ededf0"/><text x={position(10+noise)-40} y={282}>Y={10+noise}; p=.5</text></g>)}
      <path d={`M${position(10)},297 V329`} stroke="#ededf0" strokeWidth={3}/>
      <text x={position(10)-55} y={353}>m(x)=10; E[ε]=0</text>
      <text x={16} y={462}>Forecast and target noise are independent in this invented law.</text>
    </EnsembleFlowCanvas>
    <div className="ensemble-geometry-table" tabIndex={0} role="region" aria-label="Four independent forecast and outcome cases; scroll horizontally if needed">
      <table><caption>All four joint cases, each with probability 1/4</caption><thead><tr><th>F</th><th>ε</th><th>Y=10+ε</th><th>(F−Y)²</th></tr></thead><tbody>{law.paths.map((row,index)=><tr key={index}><td style={{color:hues[0]}}>{row.prediction}</td><td>{row.noise}</td><td>{row.outcome}</td><td>{row.squaredError}</td></tr>)}</tbody></table>
    </div>
    <p>Squared bias={law.bias}²=4 h². Fitting variance=((10−12)²+(14−12)²)/2=4 h². Noise variance=((−1)²+1²)/2=1 h². Expected squared error=(1+1+25+9)/4={law.expectedSquaredError} h²=4+4+1.</p>
    <p>Here teal identifies one procedure's random forecast, amber its expectation, and white the independent target. Averaging may change fitting variance under the covariance assumptions; it does not remove this shared bias or the target's noise.</p>
  </EnsembleFlowFigure>;
}
