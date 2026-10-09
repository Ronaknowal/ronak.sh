import {
  MFigure,
  MScene,
  MResponsive,
  MLabel,
  MArrow,
  MPlot,
  MTable,
  MBars,
  mt,
  mc,
} from './MeasureReadingPrimitives.jsx';
import {
  mixedMeasureState,
  cantorCoverState,
  simpleIntegralState,
  limitIntegralState,
} from '../../data/measure-theory-models.js';

const points = (f, count = 120) =>
  Array.from({ length: count + 1 }, (_, i) => [i / count, f(i / count)]);
export function MixedPicture({ state, controls = null }) {
  const w = state.atomWeight;
  return (
    <>
      <p>
        Atom at x=0 has probability {mt(w)}. The separate continuous density has height {mt(1 - w)}{' '}
        per x-unit on (0,1]. Amber identifies the atom; cyan identifies the continuous component.
        The shaded interval marks the selected continuous mass.
      </p>
      <MBars
        label="Mass from the chosen closed interval"
        rowColours={[mc[0], mc[1]]}
        columns={['Component', 'Probability']}
        rows={[
          [`Atom included: ${state.atomIncluded ? 'yes' : 'no'}`, state.atomMass],
          ['Continuous interval', state.continuousMass],
        ]}
        max={1}
      />
      <MPlot
        label="Continuous density and selected interval, atom kept separate"
        xDomain={[-0.25, 1.25]}
        yDomain={[0, 1]}
        xLabel="x"
        yLabel="continuous density per x-unit"
        series={[
          {
            name: 'Continuous density',
            colour: mc[1],
            points: [
              [0, 1 - w],
              [1, 1 - w],
            ],
          },
        ]}
        background={({ x, y }) =>
          state.continuousLength > 0 && (
            <rect
              x={x(Math.max(0, state.lower))}
              y={y(1 - w)}
              width={x(Math.min(1, state.upper)) - x(Math.max(0, state.lower))}
              height={y(0) - y(1 - w)}
              fill={mc[1]}
              opacity={0.3}
            />
          )
        }
      />
      <MPlot
        label="CDF with its atom jump at zero"
        xDomain={[-0.25, 1.25]}
        yDomain={[0, 1]}
        xLabel="x"
        yLabel="F(x)=P(X≤x)"
        series={[
          {
            name: 'CDF left of 0',
            points: [
              [-0.25, 0],
              [0, 0],
            ],
          },
          {
            name: 'CDF on [0,1] and beyond',
            colour: mc[1],
            points: [
              [0, w],
              [1, 1],
              [1.25, 1],
            ],
          },
          {
            name: 'Included CDF value at 0',
            colour: mc[1],
            points: [[0, w]],
            connect: false,
            dots: true,
          },
          {
            name: 'Left-hand limit at 0',
            colour: mc[0],
            points: [[0, 0]],
            connect: false,
            dots: true,
            marker: 'ring',
          },
        ]}
        references={[{ axis: 'x', value: 0, name: 'Atom location' }]}
      />
      <p>
        Closed interval [{mt(state.lower)},{mt(state.upper)}] has probability{' '}
        {mt(state.probability)} = {mt(state.atomMass)} + {mt(state.continuousMass)}. A zero-width
        interval can contain the atom.
      </p>
      {controls}
      <MTable
        label="Mixed-law interval components and CDF endpoints"
        columns={['Quantity', 'Value']}
        rows={[
          ['Continuous intersection length', mt(state.continuousLength)],
          ['Atom mass', mt(state.atomMass)],
          ['Continuous mass', mt(state.continuousMass)],
          ['F(lower−)', mt(state.cdfBeforeLower)],
          ['F(upper)', mt(state.cdfAtUpper)],
          ['Closed-interval probability', mt(state.probability)],
        ]}
      />
    </>
  );
}
export function SimplePicture({ state, controls = null }) {
  return (
    <>
      <p>
        Values of x² rounded down in increments 1/{state.count}. Each band's width is
        √((k+1)/N)−√(k/N), not 1/N.
      </p>
      <MPlot
        label="True unequal-width input bands under x squared"
        xDomain={[0, 1]}
        yDomain={[0, 1]}
        xLabel="x"
        yLabel="function height"
        series={[{ name: 'x², exact', colour: mc[1], points: points((x) => x * x) }]}
        background={({ x, y }) => (
          <g>
            {state.steps.map((s) => (
              <rect
                key={s.index}
                x={x(s.low)}
                y={y(s.value)}
                width={x(s.high) - x(s.low)}
                height={y(0) - y(s.value)}
                fill={mc[0]}
                opacity={0.4}
              />
            ))}
          </g>
        )}
      />
      <p>
        Lower integral {mt(state.lowerIntegral)}; exact 1/3. Remaining area {mt(state.error)} ≤1/
        {state.count}. The upper bound is {mt(state.upperIntegral)}.
      </p>
      {controls}
      <MTable
        label="Every band, width and integral contribution"
        tall
        columns={['k', 'Lower x', 'Upper x', 'Height k/N', 'Width', 'Height×width']}
        rows={state.steps.map((s) => [
          s.index,
          mt(s.low),
          mt(s.high),
          mt(s.value),
          mt(s.mass),
          mt(s.contribution),
        ])}
      />
    </>
  );
}
export function LimitPicture({ state, controls = null }) {
  const { mode, n } = state;
  const curve =
    mode === 'spike'
      ? [
          [0, n],
          [1 / n, n],
        ]
      : state.points.map((p) => [p.x, p.y]);
  return (
    <>
      <p>
        {mode === 'spike'
          ? 'Current function: n on (0,1/n), and 0 elsewhere.'
          : mode === 'bounded'
            ? 'Current function: xⁿ on [0,1].'
            : 'Current function: min(n,1/√x) for x>0, with value n at 0.'}
      </p>
      <p>
        Current vertical axis is 0 to {state.yMaximum}; it changes with n for the spike and
        increasing truncation. The observation x={mt(state.x)} stays fixed when n changes.
      </p>
      <MPlot
        label={'Actual ' + mode + ' sequence member and fixed observation'}
        xDomain={[0, 1]}
        yDomain={[0, state.yMaximum]}
        xLabel="x on [0,1]"
        yLabel={'fₙ(x), current maximum ' + state.yMaximum}
        series={[
          { name: 'Current fₙ', colour: mc[1], points: curve },
          {
            name: 'Observed function value',
            colour: mc[0],
            points: [[state.x, state.value]],
            dots: true,
            connect: false,
          },
          ...(mode === 'spike'
            ? [
                {
                  name: 'Excluded spike-height endpoints',
                  colour: mc[1],
                  points: [
                    [0, n],
                    [1 / n, n],
                  ],
                  dots: true,
                  connect: false,
                  marker: 'ring',
                },
                {
                  name: 'Actual endpoint values 0',
                  colour: mc[0],
                  points: [
                    [0, 0],
                    [1 / n, 0],
                  ],
                  dots: true,
                  connect: false,
                },
              ]
            : []),
        ]}
        references={[
          { axis: 'x', value: state.x, name: 'Fixed observation' },
          ...(mode === 'bounded'
            ? [{ axis: 'y', value: 1, name: 'One common integrable bound g=1', colour: mc[3] }]
            : []),
        ]}
        background={({ x, y }) =>
          mode === 'spike' && (
            <rect
              x={x(0)}
              y={y(n)}
              width={x(1 / n) - x(0)}
              height={y(0) - y(n)}
              fill={mc[1]}
              opacity={0.15}
            />
          )
        }
      />
      {mode === 'spike' && n >= 8 && (
        <>
          <MPlot
            label="Local support detail separates the shrinking spike endpoints"
            xDomain={[-1 / (4 * n), 2 / n]}
            yDomain={[0, n]}
            xLabel={`x; detail window −1/(4n) to 2/n, here −${mt(1 / (4 * n))} to ${mt(2 / n)}`}
            yLabel="Same spike height; unchanged vertical units"
            series={[
              {
                name: 'Height inside (0,1/n)',
                colour: mc[1],
                points: [
                  [0, n],
                  [1 / n, n],
                ],
              },
              {
                name: 'Excluded top endpoints',
                colour: mc[1],
                points: [
                  [0, n],
                  [1 / n, n],
                ],
                connect: false,
                dots: true,
                marker: 'ring',
              },
              {
                name: 'Actual endpoint values 0',
                colour: mc[0],
                points: [
                  [0, 0],
                  [1 / n, 0],
                ],
                connect: false,
                dots: true,
              },
            ]}
          />
          <p>
            This local horizontal window changes with n so both endpoints remain distinguishable.
            The full-domain plot above retains [0,1]; vertical height and the exact area 1 are
            unchanged. Open rings exclude the top endpoints; filled dots give their actual value 0.
          </p>
        </>
      )}
      <p>
        fₙ(x)={mt(state.value)}; exact integral={mt(state.integral)}. Integral of the pointwise
        limit={mt(state.integralOfLimit)}; limit of the integrals={mt(state.limitOfIntegrals)}.
      </p>
      {mode === 'spike' && (
        <p>
          Support is the open interval (0,1/n). Both endpoints have function value 0. Area n×1/n
          remains 1; drawing width shrinking does not remove its area.
        </p>
      )}
      {mode === 'bounded' && (
        <p>xⁿ is dominated by 1. Its limit is 0 except at x=1, a length-null endpoint.</p>
      )}
      {mode === 'increasing' && (
        <p>
          The exact corner is x=1/n²={mt(state.corner)}. At x=0 each finite truncation is n; the
          limit is infinite there on a null set.
        </p>
      )}
      {controls}
      <MTable
        label="Point value, integral and both limiting operations"
        columns={['Quantity', 'Value']}
        rows={[
          ['Fixed x', mt(state.x)],
          ['fₙ(x)', mt(state.value)],
          ['Pointwise limit at x', mt(state.pointwiseLimit)],
          ['Exact finite integral', mt(state.integral)],
          ['Integral of limit', mt(state.integralOfLimit)],
          ['Limit of integrals', mt(state.limitOfIntegrals)],
        ]}
      />
    </>
  );
}
function CantorCover({ cdf = false }) {
  const state = cantorCoverState(3),
    cdfPoints = [[0, 0]];
  state.intervals.forEach((interval, i) =>
    cdfPoints.push([interval.low, i / 8], [interval.high, (i + 1) / 8]),
  );
  cdfPoints.push([1, 1]);
  return (
    <>
      <p>
        Level 3 cover: eight retained closed intervals. Each has length 1/27 and cylinder
        probability 1/8. Probability lives on retained branches, not in a uniform full-interval law.
      </p>
      <MResponsive>
        {(width) => (
          <MScene
            label="Actual third-level retained intervals and removed gaps"
            width={width}
            height={75}
          >
            {state.intervals.map((r, i) => (
              <g key={i}>
                <rect
                  x={12 + r.low * (width - 24)}
                  y={15}
                  width={(r.high - r.low) * (width - 24)}
                  height={18}
                  fill={mc[1]}
                />
                <circle cx={12 + r.low * (width - 24)} cy={24} r={2} fill={mc[0]} />
                <circle cx={12 + r.high * (width - 24)} cy={24} r={2} fill={mc[0]} />
              </g>
            ))}
            <MLabel x={12} y={62}>
              0
            </MLabel>
            <MLabel x={width - 12} y={62} anchor="end">
              1
            </MLabel>
          </MScene>
        )}
      </MResponsive>
      {cdf && (
        <>
          <MPlot
            label="Third-level CDF approximation, with plateaus across removed gaps"
            xDomain={[0, 1]}
            yDomain={[0, 1]}
            xLabel="x"
            yLabel="accumulated cylinder probability"
            series={[{ name: 'Finite cover CDF approximation', colour: mc[1], points: cdfPoints }]}
          />
          <p>
            Linear portions spread each cylinder's 1/8 across its current cover interval. Later
            refinements replace those slopes. The limiting Cantor CDF is continuous and flat on
            removed gaps; the limiting law has no atoms and no Lebesgue density.
          </p>
        </>
      )}
      <MTable
        label="All eight ternary branch intervals and binary probability levels"
        columns={[
          'Retained ternary branch',
          'Lower x',
          'Upper x',
          'Cylinder mass',
          'CDF before branch',
          'CDF after branch',
        ]}
        rows={state.intervals.map((r, i) => [
          i.toString(2).padStart(3, '0').replaceAll('1', '2'),
          mt(r.low),
          mt(r.high),
          '1/8',
          i + '/8',
          i + 1 + '/8',
        ])}
      />
      <p>
        Total cover length 8/27; total probability 1. At level n, cover length (2/3)ⁿ→0 while total
        cylinder probability stays 1. Finite cover heights are approximations, not a PDF of the
        limiting law.
      </p>
    </>
  );
}
function SimpleDefinition({ refined = false }) {
  const intervals = refined
    ? [
        [0, 0.125, 2],
        [0.125, 0.25, 2],
        [0.25, 0.75, 1],
        [0.75, 1, 0],
      ]
    : [
        [0, 0.25, 2],
        [0.25, 0.75, 1],
        [0.75, 1, 0],
      ];
  return (
    <>
      <MPlot
        label="Simple function: height times measurable input width"
        xDomain={[0, 1]}
        yDomain={[0, 2]}
        xLabel="x"
        yLabel="simple-function height"
        background={({ x, y }) => (
          <g>
            {intervals.map((r, i) => (
              <rect
                key={i}
                x={x(r[0])}
                y={y(r[2])}
                width={x(r[1]) - x(r[0])}
                height={y(0) - y(r[2])}
                fill={r[2] === 2 ? mc[0] : r[2] === 1 ? mc[1] : '#888'}
                stroke="#ddd"
                strokeWidth={1}
                opacity={0.55}
              />
            ))}
          </g>
        )}
      />
      <MTable
        label="Complete measurable pieces and products"
        columns={['Input band', 'Height', 'Length', 'Contribution']}
        rows={intervals.map((r) => [
          '[' + mt(r[0]) + ',' + mt(r[1]) + (r[1] === 1 ? ']' : ')'),
          r[2],
          mt(r[1] - r[0]),
          mt(r[2] * (r[1] - r[0])),
        ])}
      />
      <p>
        {refined
          ? 'Splitting the first set preserves 2×(.125+.125)=.5.'
          : 'The first two contributions are .5 and .5.'}{' '}
        The whole integral is 1. Amber retains height 2 and cyan retains height 1 through the split;
        white boundaries separate the pieces. The zero-valued final band contributes 0.
      </p>
    </>
  );
}
function MonotoneApproximations() {
  return (
    <>
      <p>
        Three members of one increasing sequence: fₙ(x)=2⁻ⁿ⌊2ⁿx²⌋. Each refinement halves the height
        increment and can only raise the lower approximation. All panels use the same axes.
      </p>
      {[1, 2, 3].map((n) => {
        const state = simpleIntegralState(n),
          threshold = 3 / 16,
          start = Math.max(0.5, Math.sqrt(Math.ceil(state.count * threshold) / state.count));
        return (
          <div key={n}>
            <p>
              n={n}; {state.count} height bands; integral {mt(state.lowerIntegral)}.
            </p>
            <MPlot
              label={'Actual monotone lower simple function at level ' + n}
              xDomain={[0, 1]}
              yDomain={[0, 1]}
              xLabel="x"
              yLabel="height"
              series={[{ name: 'Target x²', colour: mc[1], points: points((x) => x * x) }]}
              references={[
                { axis: 'y', value: threshold, name: 't·s = 3/16 on [1/2,1]', colour: mc[3] },
              ]}
              background={({ x, y }) => (
                <g>
                  {state.steps.map((step) => (
                    <rect
                      key={step.index}
                      x={x(step.low)}
                      y={y(step.value)}
                      width={x(step.high) - x(step.low)}
                      height={y(0) - y(step.value)}
                      fill={mc[0]}
                      opacity={0.4}
                    />
                  ))}
                </g>
              )}
            />
            <p>
              Take s=1/4 on [1/2,1] and zero elsewhere, and t=3/4. Inside {'{s>0}'}, Eₙ={'{fₙ≥ts}'}{' '}
              is [{mt(start)},1].
            </p>
            <MResponsive>
              {(width) => (
                <MScene
                  label={
                    'Actual proof-set coverage inside the positive simple-function support, level ' +
                    n
                  }
                  width={width}
                  height={68}
                >
                  <line x1={12} x2={width - 12} y1={22} y2={22} stroke="#777" />
                  <line
                    x1={12 + 0.5 * (width - 24)}
                    x2={width - 12}
                    y1={22}
                    y2={22}
                    stroke={mc[3]}
                    strokeWidth={8}
                  />
                  <line
                    x1={12 + start * (width - 24)}
                    x2={width - 12}
                    y1={22}
                    y2={22}
                    stroke={mc[0]}
                    strokeWidth={3}
                  />
                  <MLabel x={12} y={57}>
                    0
                  </MLabel>
                  <MLabel x={width - 12} y={57} anchor="end">
                    1
                  </MLabel>
                </MScene>
              )}
            </MResponsive>
            <p>
              Violet thick support: s&gt;0; amber thin segment: already reaches t·s. At n=2 the
              entire positive support is covered in this fixture.
            </p>
          </div>
        );
      })}
      <p>
        In the general proof, choose any simple s≤f and 0&lt;t&lt;1. The increasing sets Eₙ=
        {'{fₙ≥ts}'} cover {'{s>0}'}. Continuity from below recovers each positive simple
        contribution; zero pieces contribute nothing. Taking the supremum over s and then t↑1 proves
        MCT, including an infinite integral.
      </p>
    </>
  );
}
export default function IntegralDrawing({ id }) {
  let picture;
  switch (id) {
    case 'MT19':
      picture = (
        <>
          <MBars
            label="Counting reference: six actual atoms"
            columns={['Face', 'Point mass']}
            rows={Array.from({ length: 6 }, (_, i) => [String(i + 1), 1 / 6])}
            max={1 / 6}
          />
          <MPlot
            label="Length reference: unit uniform density and half-interval area"
            xDomain={[0, 1]}
            yDomain={[0, 1]}
            xLabel="x"
            yLabel="density per x-unit"
            series={[
              {
                name: 'Uniform density 1',
                points: [
                  [0, 1],
                  [1, 1],
                ],
              },
            ]}
            background={({ x, y }) => (
              <rect
                x={x(0)}
                y={y(1)}
                width={x(0.5) - x(0)}
                height={y(0) - y(1)}
                fill={mc[0]}
                opacity={0.3}
              />
            )}
          />
          <p>
            Die singleton mass 1/6; uniform singleton mass 0. Uniform interval [0,.5] has area
            1×.5=.5. Density height 1 is not a point probability.
          </p>
        </>
      );
      break;
    case 'MT20':
      picture = <MixedPicture state={mixedMeasureState()} />;
      break;
    case 'MT22':
      picture = <CantorCover />;
      break;
    case 'MT23':
      picture = <CantorCover cdf />;
      break;
    case 'MT24':
      picture = (
        <>
          <p>Three reference behaviours on the same coordinate line.</p>
          <MTable
            label="Atomic, absolutely continuous and singular probability"
            columns={['Law', 'Mass at a point', 'Length density', 'Reference supporting a density']}
            rows={[
              ['Atom δ₀', '1 at 0', 'None', 'δ₀: density 1'],
              ['Uniform[0,1]', '0 everywhere', '1 on [0,1]', 'Length'],
              ['Cantor law', '0 everywhere', 'None', 'Its singular probability measure'],
            ]}
          />
          <CantorCover />
          <p>
            The mixed law .25δ₀+.75λ|[0,1] has density .25 at 0 and .75 on (0,1] relative to
            λ|[0,1]+δ₀. It has no full Lebesgue density when the atom has positive mass.
          </p>
        </>
      );
      break;
    case 'MT25':
      picture = <SimpleDefinition />;
      break;
    case 'MT26':
      picture = <SimpleDefinition refined />;
      break;
    case 'MT28':
      picture = (
        <>
          <MPlot
            label="Signed function and separate sign areas"
            xDomain={[0, 1]}
            yDomain={[-1, 2]}
            xLabel="x"
            yLabel="signed height"
            background={({ x, y }) => (
              <>
                <rect
                  x={x(0)}
                  y={y(2)}
                  width={x(0.5) - x(0)}
                  height={y(0) - y(2)}
                  fill={mc[0]}
                  opacity={0.5}
                />
                <rect
                  x={x(0.5)}
                  y={y(0)}
                  width={x(1) - x(0.5)}
                  height={y(-1) - y(0)}
                  fill={mc[2]}
                  opacity={0.5}
                />
              </>
            )}
            references={[{ axis: 'y', value: 0, name: 'Zero' }]}
          />
          <MTable
            label="Separate positive, negative and absolute integrals"
            columns={['Part', 'Integral']}
            rows={[
              ['f⁺', 1],
              ['f⁻', 0.5],
              ['f=f⁺−f⁻', 0.5],
              ['|f|=f⁺+f⁻', 1.5],
            ]}
          />
          <p>
            Amber lies above zero; pink lies below zero. If both sign integrals are infinite,
            subtraction is undefined. This finite fixture permits the subtraction.
          </p>
        </>
      );
      break;
    case 'MT29':
      picture = (
        <>
          <MPlot
            label="Undergraph of x squared, vertical sections"
            xDomain={[0, 1]}
            yDomain={[0, 1]}
            xLabel="x"
            yLabel="t"
            series={[
              { name: 'Boundary t=x²', colour: mc[1], points: points((x) => x * x), area: true },
            ]}
            background={({ x, y }) => (
              <>
                <line
                  x1={x(0.75)}
                  x2={x(0.75)}
                  y1={y(0)}
                  y2={y(0.75 ** 2)}
                  stroke={mc[0]}
                  strokeWidth={3}
                />
                <line
                  x1={x(Math.sqrt(0.25))}
                  x2={x(1)}
                  y1={y(0.25)}
                  y2={y(0.25)}
                  stroke={mc[0]}
                  strokeWidth={3}
                />
              </>
            )}
          />
          <p>
            Vertical section at x=.75 has height .5625. Horizontal section at t=.25 runs from √t=.5
            to 1, length .5. The same nonnegative area is ∫x²dx=∫(1−√t)dt=1/3.
          </p>
        </>
      );
      break;
    case 'MT30':
      picture = <MonotoneApproximations />;
      break;
    case 'MT31':
      picture = (
        <>
          <p>
            A concrete nonnegative sequence is fₙ(x)=x+1−1/(n+1)+(−1)ⁿ/(2(n+1)), on [0,1]. Each
            future even term is followed by a lower odd term, and the odd terms increase. Thus gₙ is
            the first odd term in its tail.
          </p>
          <MPlot
            label="Actual tail infima increase to x plus one"
            xDomain={[0, 1]}
            yDomain={[0, 2]}
            xLabel="x"
            yLabel="function value"
            series={[
              ...[1, 3, 5].map((n, i) => ({
                name: `Tail floor with first odd index ${n}`,
                colour: mc[i],
                dash: [undefined, '7 3', '2 3'][i],
                points: [
                  [0, 1 - 1.5 / (n + 1)],
                  [1, 2 - 1.5 / (n + 1)],
                ],
              })),
              {
                name: 'Limit x+1',
                colour: mc[3],
                dash: '6 4',
                points: [
                  [0, 1],
                  [1, 2],
                ],
              },
            ]}
          />
          <MTable
            label="Exact tail floors and their integrals"
            columns={['Tail begins n', 'First odd m≥n', 'gₙ(x)', 'Integral']}
            rows={[1, 2, 3, 4, 5, 6].map((n) => {
              const m = n % 2 ? n : n + 1;
              return [n, m, `x + ${mt(1 - 1.5 / (m + 1))}`, mt(1.5 - 1.5 / (m + 1))];
            })}
          />
          <p>
            The floors are nondecreasing and tend to x+1. For this example their integrals tend to
            3/2. In general, gₙ=infₖ≥ₙ fₖ is measurable, increases to liminf fₙ and satisfies
            ∫gₙ≤infₖ≥ₙ∫fₖ. MCT then gives Fatou's inequality; equality in this example does not
            replace that general inequality.
          </p>
        </>
      );
      break;
    case 'MT32':
      picture = <LimitPicture state={limitIntegralState('bounded', 4, 0.25)} />;
      break;
    case 'MT33':
      picture = <LimitPicture state={limitIntegralState('spike', 4, 0.25)} />;
      break;
    case 'MT34':
      picture = <LimitPicture state={limitIntegralState('increasing', 4, 0.25)} />;
      break;
    default:
      throw new Error('Unknown integral mechanism ' + id);
  }
  return <MFigure id={id}>{picture}</MFigure>;
}
