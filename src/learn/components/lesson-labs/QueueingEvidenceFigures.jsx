import React from 'react';
import {
  observedGeometry as observed,
  retainedRunMeans,
  retainedRunSummary,
} from '../../data/queueing-reading-models.js';
import {
  Drawing,
  Figure,
  Legend,
  Plot,
  ShareStrip,
  Table,
  format,
  ink,
} from './QueueingReadingPrimitives.jsx';

const binColors = [ink.cyan, ink.amber, ink.rose, ink.violet, ink.pale];
const binShapes = ['●', '■', '▲', '◆', '×'];
const binLabel = (bin, i) => `B${i + 1}: (${bin.lower}, ${bin.upper}] s`;

function EmpiricalAtoms({ maximum }) {
  const atoms = observed.atoms.filter((atom) => atom.duration <= maximum);
  const maxMass = Math.ceil(Math.max(...observed.atoms.map((a) => a.mass)) * 1000) / 1000;
  return (
    <Plot
      description={`Empirical duration atoms through${maximum}seconds. Each record carries mass 1/4521; repeated durations aggregate.`}
      xDomain={[0, maximum]}
      yDomain={[0, maxMass]}
      xLabel="last-contact duration (s)"
      yLabel="atom probability"
      xTicks={[0, maximum / 2, maximum]}
      yTicks={[0, maxMass]}
    >
      {({ x, y }) =>
        atoms.map((atom) => (
          <line
            key={atom.duration}
            x1={x(atom.duration)}
            x2={x(atom.duration)}
            y1={y(0)}
            y2={y(atom.mass)}
            stroke={binColors[atom.bin]}
            strokeWidth="1"
          >
            <title>
              {atom.duration} seconds: {atom.multiplicity} records, mass {format(atom.mass, 6)}
            </title>
          </line>
        ))
      }
    </Plot>
  );
}

export function QueueingEvidenceFigure({ id }) {
  if (id === 'Q35')
    return (
      <Figure
        id={id}
        caption="All eight points and the mean/MCSE interval use the retained rounded printed summaries. The interval is ±one estimated MCSE, not a 95% interval."
      >
        <Drawing
          height={400}
          description="Eight independent run means, seeds101 through108, with mean .50058 and one MCSE .005147 seconds."
        >
          {({ width, scale }) => {
            const left = 65 * scale,
              right = width - 15 * scale;
            const x = (t) => left + ((t - 0.47) / 0.06) * (right - left);
            const bottom = 364 * scale;
            return (
              <>
                <line
                  x1={x(0.5)}
                  x2={x(0.5)}
                  y1={8 * scale}
                  y2={bottom}
                  stroke={ink.amber}
                  strokeDasharray="4 4"
                />
                {retainedRunMeans.map((value, i) => (
                  <g key={i}>
                    <text x={0} y={(29 + i * 33) * scale}>
                      {101 + i}
                    </text>
                    <circle
                      cx={x(value)}
                      cy={(25 + i * 33) * scale}
                      r={4 * scale}
                      fill={ink.pale}
                    />
                  </g>
                ))}
                <text x={0} y={322 * scale}>
                  mean
                </text>
                <line
                  x1={x(retainedRunSummary.mean - retainedRunSummary.mcse)}
                  x2={x(retainedRunSummary.mean + retainedRunSummary.mcse)}
                  y1={318 * scale}
                  y2={318 * scale}
                  stroke={ink.cyan}
                  strokeWidth={3 * scale}
                />
                <circle
                  cx={x(retainedRunSummary.mean)}
                  cy={318 * scale}
                  r={5 * scale}
                  fill={ink.cyan}
                />
                {[0.47, 0.5, 0.53].map((t, i) => (
                  <text
                    key={t}
                    x={x(t)}
                    y={bottom}
                    textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}
                  >
                    {t} s
                  </text>
                ))}
                <text x={left} y={392 * scale}>
                  total residence time
                </text>
              </>
            );
          }}
        </Drawing>
        <Legend
          entries={[
            ['seed: independent run mean', ink.pale, '●'],
            ['mean ± one MCSE', ink.cyan, '━'],
            ['theory .5 s, λ8 μ10', ink.amber, '┄'],
          ]}
        />
        <Table
          caption="Retained printed independent run means"
          headers={['Seed', 'Total mean (s)']}
          rows={retainedRunMeans.map((value, i) => [101 + i, value.toFixed(6)])}
        />
      </Figure>
    );
  if (id === 'Q36')
    return (
      <Figure
        id={id}
        caption="Observed last-contact durations, UCI Bank Marketing published subset. Bins summarize the raw records; their midpoints are never used in the moments."
      >
        <ShareStrip
          label="Share of 4,521 records"
          segments={observed.bins.map((bin, i) => ({
            label: binLabel(bin, i),
            value: bin.countShare,
            color: binColors[i],
            shape: binShapes[i],
          }))}
        />
        <ShareStrip
          label="Share of total recorded duration"
          segments={observed.bins.map((bin, i) => ({
            label: binLabel(bin, i),
            value: bin.timeShare,
            color: binColors[i],
            shape: binShapes[i],
          }))}
        />
        <Table
          caption="Exact bin counts; percentages rounded only for display"
          headers={['Bin', 'Records', 'Count share', 'Duration share']}
          rows={observed.bins.map((bin, i) => [
            binLabel(bin, i),
            bin.count,
            format(bin.countShare, 6),
            format(bin.timeShare, 6),
          ])}
        />
        <p>
          The longest 453 records are {format((100 * 453) / observed.count, 4)}% of records and{' '}
          {format(100 * observed.longestShare, 4)}% of total duration. Ties use source-row ID.
          Observed range: 4–3025 s; 86400 is a bin boundary.
        </p>
        <details>
          <summary>Source-row IDs in the longest group</summary>
          <p>{observed.longest.map((row) => row.sourceRow).join(', ')}</p>
        </details>
        <p>
          <a href="/learn-code/queueing-theory/bank-contact-durations.csv">
            Complete attributed records
          </a>{' '}
          ·{' '}
          <a href="/learn-code/queueing-theory/bank-contact-durations-provenance.json">
            CC BY4.0 provenance
          </a>
        </p>
      </Figure>
    );
  if (id === 'Q37')
    return (
      <Figure
        id={id}
        caption="The empirical law uses all raw durations. The independent arrival clock and its chosen load are a declared model, not measured banking queue behavior."
      >
        <p>Full empirical support: 0–3025 s</p>
        <EmpiricalAtoms maximum={3025} />
        <p>Magnified detail: 0–300 s, on the same probability scale</p>
        <EmpiricalAtoms maximum={300} />
        <Legend
          entries={observed.bins.map((bin, i) => [binLabel(bin, i), binColors[i], binShapes[i]])}
        />
        <div className="queue-topology">
          <span className="queue-token">λ</span>
          <span>independent Poisson clock</span>
          <span>→</span>
          <div className="queue-waiting">
            <strong>empirical service law</strong>
            <span>each record mass 1/4521</span>
          </div>
        </div>
        <p>
          m₁=1193369/4521={format(observed.mean, 6)} s.
          <br />
          m₂=620218345/4521={format(observed.second, 6)} s².
          <br />
          Choose λ=.5/m₁={format(observed.arrivalRate, 9)} /s, so load=.5.
        </p>
        <Drawing
          description="Busy residual multiplied by load .5 gives full-time residual; amplification by1/(1-.5) returns the same numerical mean wait."
          height={200}
        >
          {({ width, scale }) => {
            const left = 12 * scale,
              span = width - left - 18 * scale,
              max = 300;
            return (
              <>
                {[
                  ['busy residual', observed.busyResidual, ink.cyan],
                  ['full-time residual', 0.5 * observed.busyResidual, ink.pale],
                  ['model queue wait', observed.wait, ink.amber],
                ].map(([label, v, color], i) => (
                  <g key={label}>
                    <text x={left} y={(20 + 55 * i) * scale}>
                      {label}
                    </text>
                    <rect
                      x={left}
                      y={(28 + 55 * i) * scale}
                      width={(span * v) / max}
                      height={16 * scale}
                      fill={color}
                    />
                  </g>
                ))}
                <text x={left} y={194 * scale}>
                  Same duration scale: 0–300 s
                </text>
              </>
            );
          }}
        </Drawing>
        <p>
          Wq=m₂/(2m₁)={format(observed.wait, 6)} s. Equality with the busy residual occurs at this
          chosen half load.
        </p>
      </Figure>
    );
  throw new Error(`Unknown queue evidence figure ${id}`);
}
