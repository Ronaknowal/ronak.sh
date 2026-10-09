import {
  MFigure,
  MResponsive,
  MScene,
  MLabel,
  MArrow,
  MPlot,
  MTable,
  MBars,
  mt,
  mc,
} from './MeasureReadingPrimitives.jsx';
import { InformationPicture } from './MeasureFoundationDrawings.jsx';
import { TriangleSupport } from './MeasureProductDrawings.jsx';
import { conditionalMeanState, informationState } from '../../data/measure-theory-models.js';

const set = (xs) => '{' + xs.join(', ') + '}';
export function ConditionalPicture({ state, controls = null }) {
  const extent = Math.max(
    1,
    ...state.rows.flatMap((r) => [Math.abs(r.loss), Math.abs(r.prediction), Math.abs(r.residual)]),
  );
  return (
    <>
      <p>
        Each outline groups outcomes that must receive the same prediction. Cyan circles are losses
        Y; amber squares are permitted predictions Z; pink segments are signed residuals Y−Z.
        Horizontal units are the same in every row, from −{mt(extent)} to {mt(extent)}.
      </p>
      <div className="mt-conditional-cells">
        {state.cells.map((cell, i) => (
          <div className="mt-conditional-cell" key={i}>
            <p>
              Information cell {set(cell.faces)}: mass {mt(cell.mass)}; weighted loss{' '}
              {mt(cell.weightedLoss)}; {cell.mass === 0 ? 'null-cell version' : 'mean'}{' '}
              {mt(cell.prediction)}.
            </p>
            <MResponsive>
              {(width) => {
                const left = 16,
                  right = width - 16,
                  x = (v) => left + ((v + extent) / (2 * extent)) * (right - left);
                return (
                  <MScene
                    label={'Loss, prediction and residual for information cell ' + set(cell.faces)}
                    width={width}
                    height={cell.faces.length * 120 + 20}
                  >
                    {cell.faces.map((face, j) => {
                      const r = state.rows[face - 1],
                        y = 38 + j * 120;
                      return (
                        <g key={face}>
                          <MLabel x={left} y={y - 17}>
                            Face {face}; p={mt(r.weight, 3)}
                          </MLabel>
                          <line x1={left} x2={right} y1={y + 17} y2={y + 17} stroke="#666" />
                          <line x1={x(0)} x2={x(0)} y1={y + 9} y2={y + 25} stroke="#bbb" />
                          <line
                            x1={x(r.prediction)}
                            x2={x(r.loss)}
                            y1={y + 17}
                            y2={y + 17}
                            stroke={mc[2]}
                            strokeWidth={4}
                          />
                          <rect
                            x={x(r.prediction) - 5}
                            y={y + 12}
                            width={10}
                            height={10}
                            fill={mc[0]}
                          />
                          <circle cx={x(r.loss)} cy={y + 17} r={4} fill={mc[1]} />
                          <MLabel x={left} y={y + 51}>
                            Y={mt(r.loss, 3)}
                          </MLabel>
                          <MLabel x={left} y={y + 72}>
                            Z={mt(r.prediction, 3)}
                          </MLabel>
                        </g>
                      );
                    })}
                  </MScene>
                );
              }}
            </MResponsive>
          </div>
        ))}
      </div>
      <p aria-live="polite">
        Mean {mt(state.mean)}; squared residual risk {mt(state.risk)}. Total variance{' '}
        {mt(state.variance)} = residual risk {mt(state.risk)} + prediction variance{' '}
        {mt(state.predictionVariance)}.
      </p>
      {controls}
      <MTable
        label="All six weighted residual contributions"
        columns={['Face', 'p', 'Y', 'Z', 'Y−Z', 'p(Y−Z)²']}
        rows={state.rows.map((r) => [
          r.face,
          mt(r.weight),
          mt(r.loss),
          mt(r.prediction),
          mt(r.residual),
          mt(r.weightedSquare),
        ])}
      />
    </>
  );
}
export function WeightedCells({ state = conditionalMeanState() }) {
  return (
    <>
      <div className="mt-conditional-cells">
        {state.cells.map((c, i) => (
          <div key={i} className="mt-conditional-cell">
            <p>
              Cell {set(c.faces)}. Gather all weighted losses, then divide by the same cell's mass.
            </p>
            <MResponsive>
              {(width) => (
                <MScene
                  label={'All weighted loss contributions to cell ' + set(c.faces)}
                  width={width}
                  height={c.faces.length * 62 + 85}
                >
                  {c.faces.map((face, j) => (
                    <g key={face}>
                      <MLabel x={12} y={26 + j * 62} colour={mc[1]}>
                        p{face}Y{face}=
                        {mt(state.rows[face - 1].weight * state.rows[face - 1].loss, 3)}
                      </MLabel>
                      <MArrow
                        x1={width / 2}
                        y1={31 + j * 62}
                        x2={width - 25}
                        y2={c.faces.length * 62 + 12}
                        colour={mc[1]}
                      />
                    </g>
                  ))}
                  <MLabel x={12} y={c.faces.length * 62 + 35} colour={mc[0]}>
                    Total {mt(c.weightedLoss, 3)}
                  </MLabel>
                  <MLabel x={12} y={c.faces.length * 62 + 62}>
                    Divide by mass {mt(c.mass, 3)}
                  </MLabel>
                </MScene>
              )}
            </MResponsive>
            <p>Prediction {mt(c.prediction)} for every face in this cell.</p>
          </div>
        ))}
      </div>
    </>
  );
}
function EventIdentities() {
  const s = conditionalMeanState(),
    events = informationState('pairs', 3).algebra;
  return (
    <>
      <WeightedCells state={s} />
      <MTable
        label="Every observable event preserves its loss integral"
        columns={['Event', '∑pY', '∑pZ', '∑p(Y−Z)']}
        rows={events.map((faces) => {
          const rows = s.rows.filter((r) => faces.includes(r.face));
          return [
            set(faces),
            mt(rows.reduce((a, r) => a + r.weight * r.loss, 0)),
            mt(rows.reduce((a, r) => a + r.weight * r.prediction, 0)),
            mt(rows.reduce((a, r) => a + r.weight * r.residual, 0)),
          ];
        })}
      />
      <p>
        For two candidate versions, the observable witness Aₙ={'{Z₁>Z₂+1/n}'} would have integral
        difference at least P(Aₙ)/n. Event matching makes that difference zero, so P(Aₙ)=0. Taking
        their countable union and reversing the roles proves almost-sure uniqueness.
      </p>
    </>
  );
}
function ProjectionTriangle() {
  const h = Math.sqrt(5 / 3);
  return (
    <>
      <MPlot
        label="Exact risk triangle in the plane of competitor difference and residual"
        xDomain={[-0.2, 1.4]}
        yDomain={[-0.2, 1.6]}
        equal
        xLabel="Coordinate along Z−W (unit L² length)"
        yLabel="Coordinate along Y−Z (unit L² length)"
        series={[
          {
            name: 'Permitted change W→Z',
            colour: mc[0],
            points: [
              [0, 0],
              [1, 0],
            ],
          },
          {
            name: 'Residual Z→Y',
            colour: mc[2],
            points: [
              [1, 0],
              [1, h],
            ],
          },
          {
            name: 'Total W→Y',
            colour: mc[1],
            points: [
              [0, 0],
              [1, h],
            ],
          },
        ]}
      >
        {({ x, y }) => (
          <>
            <polyline
              points={[
                [0.86, 0],
                [0.86, 0.14],
                [1, 0.14],
              ]
                .map((p) => `${x(p[0])},${y(p[1])}`)
                .join(' ')}
              stroke="#ddd"
              fill="none"
            />
            <MLabel x={x(0) + 4} y={y(0) - 9}>
              W
            </MLabel>
            <MLabel x={x(1) + 8} y={y(0) + 18}>
              Z
            </MLabel>
            <MLabel x={x(1) + 8} y={y(h) - 8}>
              Y
            </MLabel>
          </>
        )}
      </MPlot>
      <p>
        This is the two-dimensional plane spanned by the actual six-entry vectors Z−W and Y−Z in the
        weighted inner product ⟨a,b⟩=Σpᵢaᵢbᵢ. Its axes are not die faces or physical space. Their
        squared lengths are 1 and 5/3; the diagonal has squared length 8/3.
      </p>
      <MTable
        label="Actual six-vector operands behind the right angle"
        columns={['Face', 'Y', 'Z', 'W', 'Y−Z', 'Z−W', 'p(Y−Z)(Z−W)']}
        rows={conditionalMeanState().rows.map((r, i) => {
          const w = [0, 0, 5, 5, 9, 9][i];
          return [
            r.face,
            r.loss,
            r.prediction,
            w,
            r.residual,
            r.prediction - w,
            mt(r.weight * r.residual * (r.prediction - w)),
          ];
        })}
      />
      <p>
        The final column sums to zero. Y∈L² and information-measurable W∈L² are required for this
        projection argument.
      </p>
    </>
  );
}
export function PatientTimeline({ risk = false }) {
  return (
    <>
      <p>
        One sampled outcome is one patient and their full trajectory. Repeated measurements on that
        same line remain within the same patient.
      </p>
      <MResponsive>
        {(width) => (
          <MScene
            label="Patient trajectory with a prediction-time information boundary"
            width={width}
            height={310}
          >
            {[0, 1].map((patient) => (
              <g key={patient}>
                <MLabel x={12} y={24 + patient * 130}>
                  Patient {patient + 1}
                </MLabel>
                <MArrow x1={12} y1={64 + patient * 130} x2={width - 12} y2={64 + patient * 130} />
                {[0.1, 0.27, 0.43].map((t, i) => (
                  <g key={t}>
                    <circle cx={12 + t * (width - 24)} cy={64 + patient * 130} r={5} fill={mc[1]} />
                    <MLabel x={12 + t * (width - 24)} y={91 + patient * 130} anchor="middle">
                      X{i + 1}
                    </MLabel>
                  </g>
                ))}
                <rect
                  x={12 + 0.84 * (width - 24) - 6}
                  y={58 + patient * 130}
                  width={12}
                  height={12}
                  fill={mc[2]}
                />
                <MLabel x={width - 12} y={115 + patient * 130} anchor="end">
                  Later Y
                </MLabel>
              </g>
            ))}
            <line
              x1={width * 0.65}
              x2={width * 0.65}
              y1={8}
              y2={274}
              stroke={mc[0]}
              strokeWidth={2}
              strokeDasharray="5 4"
            />
            <MLabel x={12} y={300} colour={mc[0]}>
              Prediction boundary
            </MLabel>
          </MScene>
        )}
      </MResponsive>
      <p>
        Cyan past measurements enter h(X); the pink future outcome enters evaluation after
        prediction. Crossing the amber boundary backward with Y would leak information.{' '}
        {risk
          ? 'Risk integrates the measurable loss against the deployment patient law. A finite value requires integrability; train-data and seed randomness must be included or conditioned on.'
          : 'This drawing assigns neither independence to repeated measurements nor an invented accuracy score.'}
      </p>
    </>
  );
}
function RNConstruction() {
  const s = conditionalMeanState();
  return (
    <>
      <WeightedCells state={s} />
      <MTable
        label="The same three events under reference and loss measures"
        columns={['𝒢 cell A', 'μ(A)=P(A)', 'ν(A)=∫A Y dP', 'Density Z on A', '∫A Z dP']}
        rows={s.cells.map((c) => [
          set(c.faces),
          mt(c.mass),
          mt(c.weightedLoss),
          mt(c.prediction),
          mt(c.mass * c.prediction),
        ])}
      />
      <p>
        Absolute continuity ν≪μ means every μ-null measurable event is ν-null. Here μ=P restricted
        to 𝒢 is finite and ν is positive and finite because Y≥0 and E[Y]&lt;∞. The RN theorem
        supplies a measurable nonnegative μ-integrable density, unique μ-almost everywhere. Its
        integral against μ reproduces ν on every 𝒢 event.
      </p>
      <p>
        The pictured finite cell division verifies this example; the theorem supplies existence
        beyond cells. For signed integrable Y, construct ν⁺ and ν⁻ from Y⁺ and Y⁻ and subtract their
        two finite-integral densities.
      </p>
    </>
  );
}
export default function ConditionalDrawing({ id }) {
  let picture;
  switch (id) {
    case 'MT47':
      picture = (
        <>
          <MBars
            label="Six losses before observing information"
            colours={[mc[1]]}
            columns={['Die face', 'Loss Y']}
            rows={conditionalMeanState().rows.map((r) => [r.face, r.loss])}
            max={12}
          />
          <p>
            Each face has probability 1/6. The weighted mean is 5. Assigning losses does not specify
            what the predictor can observe.
          </p>
        </>
      );
      break;
    case 'MT48':
      picture = <WeightedCells />;
      break;
    case 'MT49':
      picture = <EventIdentities />;
      break;
    case 'MT51':
      picture = (
        <>
          <TriangleSupport conditional />
          <p>
            For every Borel A⊆(0,1), the original integral ∫A∫₀ˣ2y dy dx and prediction integral
            ∫A(x/2)(2x) dx both equal ∫A x² dx. At x=0 choose a version without changing any
            integral; never divide by P(X=x)=0.
          </p>
        </>
      );
      break;
    case 'MT52':
      picture = (
        <>
          {['none', 'pairs', 'full'].map((partition) => (
            <div key={partition}>
              <InformationPicture state={informationState(partition, 63)} mass={false} />
              <p>
                Conditional predictions:{' '}
                {conditionalMeanState(partition)
                  .rows.map((r) => mt(r.prediction))
                  .join(', ')}
                .
              </p>
            </div>
          ))}
          <p>
            The outlines genuinely refine from none through pairs to full. In contrast, pairs and
            parity cross each other's cells.
          </p>
          <MTable
            label="Nonnested operations on the actual losses"
            columns={['Operation', 'Odd faces 1,3,5', 'Even faces 2,4,6']}
            rows={[
              ['Direct parity means', 4, 6],
              ['Pairs, then parity', 5, 5],
            ]}
          />
        </>
      );
      break;
    case 'MT53':
      picture = <ProjectionTriangle />;
      break;
    case 'MT54':
      picture = (
        <>
          <MResponsive>
            {(width) => {
              const s = (width - 24) / (47 / 3);
              return (
                <MScene
                  label="Exact total variance split into prediction variance and residual risk"
                  width={width}
                  height={90}
                >
                  <rect x={12} y={12} width={14 * s} height={25} fill={mc[0]} />
                  <rect x={12 + 14 * s} y={12} width={(5 / 3) * s} height={25} fill={mc[2]} />
                  <MLabel x={12} y={70}>
                    0
                  </MLabel>
                  <MLabel x={width - 12} y={70} anchor="end">
                    47/3
                  </MLabel>
                </MScene>
              );
            }}
          </MResponsive>
          <p>
            Amber prediction variance 14 plus pink residual risk 5/3 equals total variance 47/3.
            Under no information, pairs and full information, optimal risks are 47/3, 5/3 and 0.
            Nested information cannot increase optimal average risk; no per-row improvement is
            claimed.
          </p>
        </>
      );
      break;
    case 'MT55':
      picture = <PatientTimeline />;
      break;
    case 'MT56':
      picture = <RNConstruction />;
      break;
    default:
      throw new Error('Unknown conditional mechanism ' + id);
  }
  return <MFigure id={id}>{picture}</MFigure>;
}
