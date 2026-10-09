import {
  MFigure,
  MResponsive,
  MScene,
  MLabel,
  MArrow,
  MPlot,
  MTable,
  mt,
  mc,
} from './MeasureReadingPrimitives.jsx';
import { jointCellState, signedArrayState } from '../../data/measure-theory-models.js';

export function ProbabilityGrid({
  state = jointCellState(),
  transformed = false,
  reference = false,
  columnOnly = false,
  extent = 1,
}) {
  const a = transformed ? state.scaleX : 1,
    b = transformed ? state.scaleY : 1;
  return (
    <>
      <p>
        {transformed ? 'Transformed coordinates (u,v)' : 'Original coordinates (x,y)'}. Both axes
        run from 0 to {extent} with equal units.{' '}
        {reference
          ? 'Every original cell has reference area 1/16.'
          : 'Amber intensity encodes cell probability, from 0 to 49/256; white outlines identify the selected event.'}
      </p>
      <MResponsive>
        {(width) => {
          const left = 42,
            top = 12,
            side = width - 58,
            s = side / extent,
            x = (v) => left + v * s,
            y = (v) => top + side - v * s;
          return (
            <MScene
              label={
                (transformed ? 'Stretched' : 'Original') +
                ' full sixteen-cell region with equal coordinate units'
              }
              width={width}
              height={side + 58}
            >
              {(extent === 1 ? [0, 0.5, 1] : [0, 1, 2, 3]).map((v) => (
                <g key={v}>
                  <line x1={x(v)} x2={x(v)} y1={y(0)} y2={y(extent)} stroke="#444" />
                  <line x1={x(0)} x2={x(extent)} y1={y(v)} y2={y(v)} stroke="#444" />
                  <MLabel x={x(v)} y={y(0) + 26} anchor="middle">
                    {v}
                  </MLabel>
                  <MLabel x={left - 12} y={y(v) + 5} anchor="end">
                    {v}
                  </MLabel>
                </g>
              ))}
              {state.cells.map((c) => (
                <rect
                  key={c.column + ',' + c.row}
                  x={x((a * c.column) / 4)}
                  y={y((b * (c.row + 1)) / 4)}
                  width={(a * s) / 4}
                  height={(b * s) / 4}
                  fill={reference ? mc[1] : mc[0]}
                  fillOpacity={reference ? 0.12 : 0.08 + (0.92 * c.probability) / (49 / 256)}
                  stroke="#777"
                  strokeWidth={1}
                />
              ))}
              <rect
                x={x((a * state.column) / 4)}
                y={y(columnOnly ? b : (b * (state.row + 1)) / 4)}
                width={(a * s) / 4}
                height={columnOnly ? b * s : (b * s) / 4}
                fill="none"
                stroke="#fff"
                strokeWidth={2.5}
              />
            </MScene>
          );
        }}
      </MResponsive>
      {!reference && (
        <p className="mt-mass-scale">
          <span>0</span>
          <i aria-hidden="true" />
          <span>49/256</span>
        </p>
      )}
    </>
  );
}
export function CoordinatePicture({ state, controls = null }) {
  return (
    <>
      <ProbabilityGrid state={state} extent={3} />
      <ProbabilityGrid state={state} transformed extent={3} />
      <p>
        Cell ({state.column},{state.row}): area {mt(state.area)} → {mt(state.transformedArea)};
        density at corresponding centre {mt(state.centerDensity)} → {mt(state.transformedDensity)}.
        Probability stays {mt(state.probability)}. Determinant a·b={mt(state.jacobian)}.
      </p>
      {controls}
      <MTable
        label="Corresponding rectangles and mass, complete values"
        columns={['Quantity', 'Original', 'Transformed']}
        rows={[
          [
            'Horizontal interval',
            `[${mt(state.x0)}, ${mt(state.x1)}]`,
            `[${mt(state.u0)}, ${mt(state.u1)}]`,
          ],
          [
            'Vertical interval',
            `[${mt(state.y0)}, ${mt(state.y1)}]`,
            `[${mt(state.v0)}, ${mt(state.v1)}]`,
          ],
          ['Reference area', mt(state.area), mt(state.transformedArea)],
          ['Centre density', mt(state.centerDensity), mt(state.transformedDensity)],
          ['Integrated probability', mt(state.probability), mt(state.probability)],
        ]}
      />
      <p>
        The area-times-centre-density equality is exact for this bilinear fixture. Density is
        q(u,v)=4uv/(a²b²) inside the transformed support, zero outside. Other densities require
        their integrals.
      </p>
    </>
  );
}
export function TriangleSupport({ conditional = false }) {
  const section = 0.75;
  return (
    <>
      <MPlot
        label="Dependent triangular support and one vertical conditioning section"
        xDomain={[0, 1]}
        yDomain={[0, 1]}
        equal
        xLabel="x"
        yLabel="y"
        series={[
          {
            name: 'Boundary y=x',
            colour: mc[1],
            points: [
              [0, 0],
              [1, 1],
            ],
          },
        ]}
        background={({ x, y }) => (
          <>
            <polygon
              points={[
                [0, 0],
                [1, 0],
                [1, 1],
              ]
                .map((p) => `${x(p[0])},${y(p[1])}`)
                .join(' ')}
              fill={mc[1]}
              opacity={0.22}
            />
            <line
              x1={x(section)}
              x2={x(section)}
              y1={y(0)}
              y2={y(section)}
              stroke={mc[0]}
              strokeWidth={4}
            />
            {conditional && <circle cx={x(section)} cy={y(section / 2)} r={5} fill={mc[2]} />}
          </>
        )}
      />
      <p>
        Density 2 on 0&lt;y&lt;x&lt;1; zero above the diagonal. The highlighted section x=.75 has
        height .75 and marginal density 2x=1.5.{' '}
        {conditional
          ? 'Dividing density 2 by 1.5 gives conditional density 4/3 on (0,.75); its mean is .375, the pink point.'
          : 'The support removes combinations that the product of the two marginals would allow.'}
      </p>
    </>
  );
}
function SignedArray({ columns }) {
  const s = signedArrayState(4, columns);
  return (
    <>
      <p>
        Complete 4×{columns} window. Amber +1 on the diagonal; pink −1 on its right neighbour; dots
        are zeros.
      </p>
      <MResponsive>
        {(width) => {
          const side = (width - 48) / columns;
          return (
            <MScene
              label={'Every entry of the 4 by ' + columns + ' signed array'}
              width={width}
              height={4 * side + 74}
            >
              {s.values.flatMap((r, i) =>
                r.map((v, j) => (
                  <g key={i + ',' + j}>
                    <rect
                      x={40 + j * side}
                      y={28 + i * side}
                      width={side}
                      height={side}
                      fill={v > 0 ? mc[0] : v < 0 ? mc[2] : 'none'}
                      fillOpacity={0.15}
                      stroke="#555"
                    />
                    <MLabel
                      x={40 + (j + 0.5) * side}
                      y={28 + (i + 0.5) * side + 5}
                      anchor="middle"
                      colour={v > 0 ? mc[0] : v < 0 ? mc[2] : '#888'}
                    >
                      {v === 0 ? '·' : v > 0 ? '+1' : '−1'}
                    </MLabel>
                  </g>
                )),
              )}
              {[0, 1, 2, 3].map((i) => (
                <MLabel key={i} x={26} y={28 + (i + 0.5) * side + 5} anchor="end">
                  {i + 1}
                </MLabel>
              ))}
              {Array.from({ length: columns }, (_, j) => (
                <MLabel key={j} x={40 + (j + 0.5) * side} y={18} anchor="middle">
                  {j + 1}
                </MLabel>
              ))}
            </MScene>
          );
        }}
      </MResponsive>
      <MTable
        label={'Finite window sums, ' + columns + ' columns'}
        columns={['Quantity', 'Complete values']}
        rows={[
          ['Row sums', s.rowSums.join(', ')],
          ['Column sums', s.columnSums.join(', ')],
          ['Total', s.finiteSum],
          ['Absolute total', s.finiteAbsoluteSum],
        ]}
      />
    </>
  );
}
export default function ProductDrawing({ id }) {
  let picture;
  const state = jointCellState();
  switch (id) {
    case 'MT36':
      picture = (
        <>
          <ProbabilityGrid state={state} reference />
          <p>
            Reference rectangle widths 1/4 and 1/4 multiply to area 1/16. There are sixteen disjoint
            cells of total area 1. This drawing has not assigned probability.
          </p>
        </>
      );
      break;
    case 'MT37':
      picture = (
        <>
          <ProbabilityGrid />
          <MTable
            label="All sixteen integrated cell masses, numerator over 256"
            columns={['y row / x column', 0, 1, 2, 3]}
            rows={[0, 1, 2, 3].map((r) => [
              r,
              ...[0, 1, 2, 3].map((c) => (2 * c + 1) * (2 * r + 1)),
            ])}
          />
          <p>The 16 numerators sum to 256. Each entry integrates 4xy over its entire rectangle.</p>
        </>
      );
      break;
    case 'MT38':
      picture = (
        <>
          <ProbabilityGrid columnOnly />
          <MResponsive>
            {(width) => (
              <MScene
                label="All four selected-column masses combine into one marginal mass"
                width={width}
                height={240}
              >
                {[0, 1, 2, 3].map((r) => (
                  <g key={r}>
                    <MLabel x={12} y={30 + r * 52} colour={mc[0]}>
                      {5 * (2 * r + 1)}/256
                    </MLabel>
                    <MArrow x1={92} y1={25 + r * 52} x2={width - 67} y2={110} colour={mc[0]} />
                  </g>
                ))}
                <MLabel x={width - 10} y={115} anchor="end">
                  5/16
                </MLabel>
              </MScene>
            )}
          </MResponsive>
          <p>
            All four y rows in column 2 contribute 5, 15, 25 and 35 over 256. Their sum is
            80/256=5/16, the x-interval marginal. The selected row 1 contributes 15/256.
          </p>
        </>
      );
      break;
    case 'MT39':
      picture = <CoordinatePicture state={state} />;
      break;
    case 'MT41':
      picture = (
        <>
          <ProbabilityGrid />
          <TriangleSupport />
          <p>
            The square law factors as (2x)(2y). The triangular law has marginals 2x and 2(1−y),
            whose product would be positive in parts of the forbidden upper triangle. Both laws use
            the same product-length reference.
          </p>
        </>
      );
      break;
    case 'MT42':
      picture = (
        <>
          <MPlot
            label="Horizontal and vertical sections of the nonnegative unit-square domain"
            xDomain={[0, 1]}
            yDomain={[0, 1]}
            equal
            xLabel="x"
            yLabel="y"
            background={({ x, y }) => (
              <>
                <rect
                  x={x(0)}
                  y={y(1)}
                  width={x(1) - x(0)}
                  height={y(0) - y(1)}
                  fill={mc[1]}
                  opacity={0.1}
                />
                {[0.25, 0.5, 0.75].map((t) => (
                  <g key={t}>
                    <line x1={x(t)} x2={x(t)} y1={y(0)} y2={y(1)} stroke={mc[0]} />
                    <line
                      x1={x(0)}
                      x2={x(1)}
                      y1={y(t)}
                      y2={y(t)}
                      stroke={mc[1]}
                      strokeDasharray="5 3"
                    />
                  </g>
                ))}
              </>
            )}
          />
          <MTable
            label="Both valid Tonelli orders"
            columns={['Nonnegative function', 'Integrate y then x', 'Integrate x then y']}
            rows={[
              ['4xy', '∫₀¹2x dx = 1', '∫₀¹2y dy = 1'],
              ['1/(xy), x,y>0', '+∞', '+∞'],
            ]}
          />
          <p>
            Both factors are sigma-finite length measures. An infinite nonnegative result is
            permitted; no positive/negative subtraction occurs.
          </p>
        </>
      );
      break;
    case 'MT43':
      picture = (
        <>
          <MPlot
            label="Separate positive and negative regions of x minus y"
            xDomain={[0, 1]}
            yDomain={[0, 1]}
            equal
            xLabel="x"
            yLabel="y"
            background={({ x, y }) => (
              <>
                {[
                  [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                  ],
                  [
                    [0, 0],
                    [0, 1],
                    [1, 1],
                  ],
                ].map((vertices, i) => (
                  <polygon
                    key={i}
                    points={vertices.map((p) => `${x(p[0])},${y(p[1])}`).join(' ')}
                    fill={i ? mc[2] : mc[0]}
                    opacity={0.35}
                  />
                ))}
              </>
            )}
          />
          <p>
            Amber lower triangle: f=x−y&gt;0, integral 1/6. Pink upper triangle: f&lt;0,
            negative-part integral 1/6. Signed integral 0; absolute integral 1/3. Each colour marks
            sign, while height |x−y| supplies the integral, not unweighted triangle area.
          </p>
        </>
      );
      break;
    case 'MT44':
      picture = (
        <>
          <SignedArray columns={4} />
          <SignedArray columns={5} />
          <p>
            Continuing every complete row adds its +1 and −1, giving 0. Continuing columns gives
            1,0,0,… . The two infinite orders give 0 and 1; each sign has infinite total. Each
            single finite window still has identical row-first and column-first totals.
          </p>
        </>
      );
      break;
    case 'MT45':
      picture = (
        <>
          <MPlot
            label="Deterministic parabola and the same two selected events"
            xDomain={[-1, 1]}
            yDomain={[0, 1]}
            xLabel="U"
            yLabel="V=U²"
            series={[
              {
                name: 'All allowed (U,V)',
                colour: mc[1],
                points: Array.from({ length: 121 }, (_, i) => {
                  const u = -1 + i / 60;
                  return [u, u * u];
                }),
              },
              {
                name: 'Both events: |U|≤.5 and V≤.25',
                colour: mc[0],
                points: Array.from({ length: 61 }, (_, i) => {
                  const u = -0.5 + i / 60;
                  return [u, u * u];
                }),
              },
            ]}
            references={[{ axis: 'y', value: 0.25, name: 'V event boundary' }]}
          />
          <p>
            The highlighted part is the same event under both descriptions. Uniform U assigns it
            mass 1/2. Intersection mass 1/2 differs from the product 1/4, although E[U]=E[U³]=0
            gives covariance 0.
          </p>
        </>
      );
      break;
    case 'MT46':
      picture = (
        <>
          <MPlot
            label="Diagonal singleton sections with different reference measures"
            xDomain={[0, 1]}
            yDomain={[0, 1]}
            equal
            xLabel="x: length measure"
            yLabel="y: counting measure"
            series={[
              {
                name: 'Measurable diagonal x=y',
                colour: mc[1],
                points: [
                  [0, 0],
                  [1, 1],
                ],
              },
            ]}
            references={[
              { axis: 'x', value: 0.5, name: 'Fix x' },
              { axis: 'y', value: 0.5, name: 'Fix y' },
            ]}
          />
          <p>
            Fix y: its horizontal diagonal section is one x point, length 0; the outer counting
            integral is 0. Fix x: its vertical section is one y point, counting mass 1; the outer
            length integral is 1. Counting on uncountable [0,1] is not sigma-finite.
          </p>
          <MTable
            label="What each proof extension carries"
            columns={['Object', 'Preserved operation']}
            rows={[
              ['Rectangle indicator', 'Factor measures multiply'],
              ['Measurable set', 'Sigma-finite product / monotone-class construction'],
              ['Nonnegative simple function', 'Finite weighted sums'],
              ['Nonnegative measurable function', 'Increasing simple limits by MCT'],
              ['Absolutely integrable signed function', 'Two finite sign integrals'],
            ]}
          />
        </>
      );
      break;
    default:
      throw new Error('Unknown product mechanism ' + id);
  }
  return <MFigure id={id}>{picture}</MFigure>;
}
