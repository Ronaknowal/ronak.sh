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
import { PatientTimeline } from './MeasureConditionalDrawings.jsx';
import { reweightState, conditionalMeanState } from '../../data/measure-theory-models.js';

export function TransferPicture({ state, controls = null, showRatio = true }) {
  return (
    <>
      <p>
        Cyan rings are source probabilities P; amber squares are target probabilities Q.
        {showRatio && ' A pink cross marks positive target mass on a source-null face.'} The horizontal
        probability axis is 0 to 1 in every row. The six faces and their losses Y stay fixed.
      </p>
      <MResponsive>
        {(width) => {
          const left = 12,
            right = width - 12,
            x = (p) => left + p * (right - left);
          return (
            <MScene
              label="Every source and target probability on the same six outcomes"
              width={width}
              height={6 * 90 + 15}
            >
              {state.rows.map((r, i) => {
                const y = 26 + i * 90;
                return (
                  <g key={r.face}>
                    <MLabel x={left} y={y - 8}>
                      Face {r.face}; Y={r.loss}
                    </MLabel>
                    <line x1={left} x2={right} y1={y + 15} y2={y + 15} stroke="#777" />
                    <line
                      x1={x(r.p)}
                      x2={x(r.q)}
                      y1={y + 15}
                      y2={y + 15}
                      stroke={r.unsupported ? mc[2] : '#aaa'}
                      strokeDasharray={r.unsupported ? '4 3' : undefined}
                    />
                    <circle
                      cx={x(r.p)}
                      cy={y + 15}
                      r={8}
                      fill="none"
                      stroke={mc[1]}
                      strokeWidth={2}
                    />
                    <rect x={x(r.q) - 5} y={y + 10} width={10} height={10} fill={mc[0]} />
                    {showRatio && r.unsupported && (
                      <path
                        d={`M${left - 5} ${y + 10}l10 10m-10 0l10 -10`}
                        stroke={mc[2]}
                        strokeWidth={2}
                      />
                    )}
                    <MLabel x={left} y={y + 52}>
                      p={mt(r.p, 3)}; q={mt(r.q, 3)}
                    </MLabel>
                  </g>
                );
              })}
            </MScene>
          );
        }}
      </MResponsive>
      <p aria-live="polite">
        Source mean {mt(state.sourceMean)}; target mean {mt(state.targetMean)}.{' '}
        {showRatio && (state.supported
          ? `Weighted source mean ${mt(state.weightedMean)}; source-average ratio ${mt(state.ratioMean)}.`
          : `Unsupported target mass ${mt(state.unsupportedMass)}. A source density ratio and weighted expectation are unavailable.`)}
      </p>
      {controls}
      {showRatio && <MTable
        label="Every source-to-target multiplication"
        columns={['Face', 'p', 'q', 'q/p', 'p·(q/p)', 'Y', 'p·(q/p)·Y']}
        rows={state.rows.map((r) => [
          r.face,
          mt(r.p),
          mt(r.q),
          r.unsupported ? 'unavailable' : mt(r.ratio),
          r.unsupported ? 'unavailable' : mt(r.p * r.ratio),
          r.loss,
          r.unsupported ? 'unavailable' : mt(r.p * r.ratio * r.loss),
        ])}
      />}
      {showRatio && <p>
        When p=q=0, the displayed ratio 0 is one harmless finite version. When p=0&lt;q, no finite
        multiplier can produce q.
      </p>}
    </>
  );
}
function IndicatorMatrix({ sampling = 'fair', partition = 'pairs' }) {
  const s = conditionalMeanState(partition, sampling);
  const root = sampling === 'fair' ? '√(1/6)' : '√(1/5)';
  const shortRoot = sampling === 'fair' ? '√⅙' : '√⅕';
  const matrix = (weighted) => (
    <MResponsive>
      {(width) => {
        const perGroup = weighted ? Math.max(1, Math.floor((width - 38) / 48)) : s.cells.length;
        const groups = Array.from({ length: Math.ceil(s.cells.length / perGroup) }, (_, k) =>
          s.cells.map((cell, j) => ({ ...cell, j })).slice(k * perGroup, (k + 1) * perGroup));
        return groups.map((columns, group) => {
          const gap = (width - 38) / columns.length;
          return <MScene key={group} width={width} height={266}
            label={`${weighted ? 'Weighted matrix A' : 'Membership matrix B'}: ${sampling}, ${partition}; columns ${columns.map(c => 'C' + (c.j + 1)).join(', ')}`}>
            <MLabel x={4} y={18}>Face</MLabel>
            {columns.map(c => <MLabel key={c.j} x={38 + (columns.indexOf(c) + .5) * gap} y={18}
              anchor="middle" colour={mc[c.j % mc.length]}>C{c.j + 1}</MLabel>)}
            {s.rows.map((r, i) => <g key={r.face}>
              <MLabel x={12} y={48 + i * 36}>{r.face}</MLabel>
              {columns.map((c, j) => {
                const member = c.faces.includes(r.face), active = member && (!weighted || r.weight > 0);
                const x = 38 + (j + .5) * gap, y = 43 + i * 36;
                return <g key={c.j}>
                  <rect x={x - gap / 2 + 2} y={y - 14} width={gap - 4} height={28}
                    fill={active ? mc[1] : 'none'} fillOpacity={active ? .16 : 1}
                    stroke={weighted && r.weight === 0 ? mc[2] : '#777'}
                    strokeDasharray={weighted && r.weight === 0 ? '3 2' : undefined} />
                  <MLabel x={x} y={y + 5} anchor="middle">
                    {active ? weighted ? shortRoot : '1' : '0'}
                  </MLabel>
                </g>;
              })}
            </g>)}
          </MScene>;
        });
      }}
    </MResponsive>
  );
  return <>
    <p>{sampling}, {partition}: B records membership before any probability weighting.
      Each numbered column C is one information cell; each numbered row is the same die face.
      Cyan-filled entries are 1 and hollow entries are 0. Column labels keep their colour and name.</p>
    <p>{s.cells.map((c, j) => `C${j + 1}={${c.faces.join(', ')}}`).join('; ')}.</p>
    {matrix(false)}
    <p>↓ Multiply every entry in row i by √pᵢ. A = diag(√p)B.</p>
    <MTable label={'Row multiplication from B to A for ' + sampling + ' ' + partition}
      columns={['Face i', 'Row multiplier √pᵢ', 'Nonzero membership entry', 'Resulting A entry']}
      rows={s.rows.map(r => {
        const j = s.cells.findIndex(c => c.faces.includes(r.face)) + 1;
        return [r.face, r.weight === 0 ? '0' : root, `B${r.face},${j}=1`,
          r.weight === 0 ? `A${r.face},${j}=0×1=0` : `A${r.face},${j}=${root}×1=${root}`];
      })} />
    <p>↓ Weighted matrix A. Each nonzero entry is {root} ≈ {mt(Math.sqrt(s.rows[0].weight))};
      every other entry is 0. The column names and face numbers match B.
      {sampling === 'missing-six' && ' B₆₆ is still 1; its multiplier is 0, so A₆₆ becomes 0. The dashed sixth row is weighted zero, not missing membership.'}</p>
    {matrix(true)}
    <p>b = diag(√p)Y uses the same row multipliers.{' '}
      {sampling === 'missing-six'
        ? 'The sixth weighted row and full-information sixth column are zero; rank is 5. The minimum-norm coefficient 0 is a solver convention.'
        : 'Three pair columns are independent, rank 3. Their coefficients are 1, 4, 10.'}</p>
    <MTable label="Weighted system and returned prediction" columns={['Face', '√p', 'b=√pY', 'Z']}
      rows={s.rows.map(r => [r.face, mt(Math.sqrt(r.weight)), mt(Math.sqrt(r.weight) * r.loss), mt(r.prediction)])} />
  </>;
}
export default function TransferDrawing({ id }) {
  let picture;
  switch (id) {
    case 'MT57':
      picture = <TransferPicture state={reweightState()} showRatio={false} />;
      break;
    case 'MT58':
      picture = <TransferPicture state={reweightState()} />;
      break;
    case 'MT60':
      picture = (
        <>
          <MResponsive>
            {(width) => (
              <MScene
                label="An atom and continuous reference interval carry separate density factors"
                width={width}
                height={175}
              >
                <circle cx={24} cy={32} r={9} fill={mc[0]} />
                <MLabel x={45} y={37}>
                  Atom δ₀
                </MLabel>
                <MLabel x={24} y={68}>
                  Reference mass 1
                </MLabel>
                <line x1={24} x2={width - 20} y1={100} y2={100} stroke={mc[1]} strokeWidth={4} />
                <MLabel x={24} y={130}>
                  Length on (0,1]
                </MLabel>
                <MLabel x={24} y={162}>
                  density: .25 / .75
                </MLabel>
              </MScene>
            )}
          </MResponsive>
          <MTable
            label="Reference mass multiplied by density gives the same target law"
            columns={['Reference piece', 'Reference size', 'Density', 'Target contribution']}
            rows={[
              ['Atom {0}', 1, 0.25, 0.25],
              ['Interval (0,.5]', 0.5, 0.75, 0.375],
              ['Whole (0,1]', 1, 0.75, 0.75],
            ]}
          />
          <p>
            The reference is λ|[0,1]+δ₀. Its density is .25 at 0 and .75 on (0,1]. Relative to
            length alone no whole density exists, since the null singleton carries target mass .25.
            Counting measure instead supplies discrete mass functions. RN densities are unique only
            reference-almost everywhere.
          </p>
        </>
      );
      break;
    case 'MT61':
      picture = (
        <>
          <MPlot
            label="Exact expectation stays fixed while the weighted second moment grows"
            xDomain={[0.01, 0.5]}
            yDomain={[0, 25]}
            xLabel="Source rare-event probability ε"
            yLabel="Contribution"
            series={[
              {
                name: 'Exact target expectation 1/2',
                colour: mc[0],
                points: [
                  [0.01, 0.5],
                  [0.5, 0.5],
                ],
              },
              {
                name: 'Weighted second moment 1/(4ε)',
                colour: mc[2],
                points: Array.from({ length: 101 }, (_, i) => {
                  const e = 0.01 + (0.49 * i) / 100;
                  return [e, 1 / (4 * e)];
                }),
              },
            ]}
          />
          <MTable
            label="Rare-event identity, variance risk and missing support"
            columns={['ε', 'Ratio 1/(2ε)', 'Expectation', 'Second moment']}
            rows={[
              [0.5, 1, 0.5, 0.5],
              [0.1, 5, 0.5, 2.5],
              [0.01, 50, 0.5, 25],
              [0, 'unavailable', 'unavailable', 'unavailable'],
            ]}
          />
          <p>
            The graph begins at ε=.01 and does not clip a claimed finite value at ε=0. At zero the
            target event is unsupported; with positive tiny ε, the identity remains valid but the
            second moment can be large.
          </p>
        </>
      );
      break;
    case 'MT62':
      picture = <PatientTimeline risk />;
      break;
    case 'MT63':
      picture = (
        <>
          <IndicatorMatrix />
          <IndicatorMatrix sampling="missing-six" partition="full" />
          <p>
            The exact event identity leaves a null coefficient free. NumPy's chosen 0 may be
            replaced by 7 without changing source-weighted risk; that does not repair target
            support.
          </p>
        </>
      );
      break;
    case 'MT64':
      picture = (
        <>
          <MPlot
            label="A known narrow integration breakpoint separates supported and zero regions"
            xDomain={[0, 1]}
            yDomain={[0, 16]}
            xLabel="x"
            yLabel="Spike height for n=16"
            series={[
              {
                name: 'Height 16 inside open support',
                colour: mc[1],
                points: [
                  [0, 16],
                  [1 / 16, 16],
                ],
              },
            ]}
            references={[{ axis: 'x', value: 1 / 16, name: 'Supplied breakpoint 1/16' }]}
            background={({ x, y }) => (
              <rect
                x={x(0)}
                y={y(16)}
                width={x(1 / 16) - x(0)}
                height={y(0) - y(16)}
                fill={mc[1]}
                opacity={0.2}
              />
            )}
          />
          <MPlot
            label="Enlarged support detail with excluded top endpoints and actual zero values"
            xDomain={[-1 / 64, 1 / 8]}
            yDomain={[0, 16]}
            xLabel="x; local detail −1/64 to 1/8"
            yLabel="Same spike height, unchanged vertical units"
            series={[
              {
                name: 'Height inside (0,1/16)',
                colour: mc[1],
                points: [
                  [0, 16],
                  [1 / 16, 16],
                ],
              },
              {
                name: 'Excluded top endpoints',
                colour: mc[1],
                points: [
                  [0, 16],
                  [1 / 16, 16],
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
                  [1 / 16, 0],
                ],
                connect: false,
                dots: true,
              },
            ]}
          />
          <p>
            The detail changes only the horizontal window. The spike equals 0 at both boundaries;
            open rings exclude the two top values, and filled dots show the actual endpoint values.
          </p>
          <p>
            Split at the known corner rather than hoping sample nodes find the narrow region. The
            spike integral is 16·(1/16)=1. For a mixed law, add the atom separately; quadrature over
            a zero-width interval cannot find it.
          </p>
          <MTable
            label="Quantities retained from ordinary quadrature"
            columns={['Operation', 'Domain treatment', 'Meaning of error report']}
            rows={[
              [
                'Mixed-law interval',
                'Continuous overlap plus separate atom',
                'Continuous quadrature estimate only',
              ],
              [
                'Spike / truncation',
                'Known 1/n or 1/n² breakpoint',
                'Estimated absolute error, counts and messages',
              ],
              [
                'Coordinate cell',
                'Transform support and density together',
                'Outer and inner estimates retained separately',
              ],
            ]}
          />
        </>
      );
      break;
    default:
      throw new Error('Unknown transfer mechanism ' + id);
  }
  return <MFigure id={id}>{picture}</MFigure>;
}
