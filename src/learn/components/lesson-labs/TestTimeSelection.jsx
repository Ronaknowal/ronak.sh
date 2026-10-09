import { useState } from 'react';
import {
  pool,
  schedule,
  opportunity,
  plurality,
  risk,
} from '../../data/test-time-compute-models.js';
import {
  Figure,
  Drawing,
  Controls,
  Range,
  Select,
  Table,
  Status,
  Plot,
  colors,
  fmt,
} from './TestTimeShared.jsx';

export function CandidateBoundary() {
  return (
    <Figure
      id="D01"
      caption="Candidate colour carries identity. Solid lines carry available inference information; the dashed gold line joins only after selection."
    >
      <Drawing
        label="One frozen model branches into five candidates, then numeric groups and selection"
        height={410}
      >
        <path d="M40 190H95V65M95 65V305" fill="none" stroke="#b8beca" />
        <text x="15" y="355">
          One prompt · one frozen generator
        </text>
        {pool.map((r, i) => (
          <g key={r.id}>
            <path
              d={`M95 ${65 + i * 60}H160L340 ${r.answer === '11/2' ? 95 : 65 + i * 60}`}
              fill="none"
              stroke={colors[i]}
              strokeWidth="2"
            />
            <circle cx="160" cy={65 + i * 60} r="6" fill={colors[i]} />
            <text x="175" y={55 + i * 60}>
              {r.id} {r.text}
            </text>
          </g>
        ))}
        <text x="355" y="99">
          11/2 · A+B · 2 votes
        </text>
        <text x="355" y="189">
          15/2 · C · 1 vote
        </text>
        <text x="355" y="249">
          2/11 · D · 1 vote
        </text>
        <text x="355" y="309">
          invalid · E excluded
        </text>
        <path d="M350 111H575V355" fill="none" stroke="#eee" strokeWidth="2" />
        <text x="350" y="350">
          Selected: 11/2
        </text>
        <text x="350" y="390">
          Evaluation: ✓ equals gold
        </text>
        <path d="M165 385H335" stroke="#ffc56b" strokeDasharray="5 5" />
        <text x="15" y="390">
          Gold: 11/2
        </text>
      </Drawing>
    </Figure>
  );
}
export function WorkTimeline() {
  const [workers, setWorkers] = useState(3),
    value = schedule(workers),
    x = (n) => 105 + n * 70;
  return (
    <Figure
      id="D02"
      caption="Supplied two-second jobs with ideal independent durations; contention and shared-device slowdowns are excluded."
    >
      <Drawing label="Parallel worker lanes beside a serial dependency path" height={340}>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <text x="5" y={65 + i * 55}>
              Worker {i + 1}
            </text>
            <path d={`M105 ${65 + i * 55}H525`} stroke="#4b505b" />
            {i >= workers && (
              <text x="115" y={60 + i * 55}>
                not allocated
              </text>
            )}
          </g>
        ))}
        {value.jobs.map((j, i) => (
          <g key={j.id}>
            <rect
              x={x(j.start)}
              y={44 + j.worker * 55}
              width="140"
              height="27"
              fill={colors[i]}
              fillOpacity=".25"
              stroke={colors[i]}
            />
            <text x={x(j.start) + 8} y={63 + j.worker * 55}>
              {j.id} {j.start}→{j.end}
            </text>
          </g>
        ))}
        <text x="5" y="238">
          Serial chain
        </text>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect
              x={x(i * 2)}
              y="219"
              width="140"
              height="28"
              stroke={colors[i]}
              fill={colors[i]}
              fillOpacity=".18"
            />
            <text x={x(i * 2) + 12} y="239">
              {'ABC'[i]} →
            </text>
          </g>
        ))}
        {[0, 2, 4, 6].map((t) => (
          <text key={t} x={x(t)} y="282" textAnchor="middle">
            {t}
          </text>
        ))}
        <text x="300" y="319">
          Elapsed seconds
        </text>
      </Drawing>
      <Status>
        Independent makespan: {value.makespan}s. Serial dependency: 6s. Both use 6 worker-seconds.
      </Status>
      <Controls reset={() => setWorkers(3)}>
        <Range label="Workers" value={workers} min={1} max={3} onChange={setWorkers} />
      </Controls>
    </Figure>
  );
}
export function ComputeLedger() {
  return (
    <Figure
      id="D03"
      caption="Blue = processed prompt positions; amber = newly emitted tokens. Previous outputs become later prompt positions. This count assumes no cache saving."
    >
      <Drawing
        label="Two revision chains with growing prompts and equal output segments"
        height={330}
      >
        {[0, 1].map((chain) => (
          <g key={chain}>
            {[0, 1, 2].map((j) => (
              <g key={j}>
                <text x="5" y={40 + chain * 145 + j * 38}>
                  {chain ? 'B' : 'A'}
                  {j + 1}
                </text>
                <rect
                  x="55"
                  y={23 + chain * 145 + j * 38}
                  width={(20 + 10 * j) * 8}
                  height="25"
                  fill={colors[0]}
                  fillOpacity=".3"
                />
                <text x="66" y={41 + chain * 145 + j * 38}>
                  {20 + 10 * j} prompt
                </text>
                <rect
                  x={55 + (20 + 10 * j) * 8}
                  y={23 + chain * 145 + j * 38}
                  width="80"
                  height="25"
                  fill={colors[2]}
                  fillOpacity=".4"
                />
                <text x={60 + (20 + 10 * j) * 8} y={41 + chain * 145 + j * 38}>
                  10 output
                </text>
                {j < 2 && (
                  <path
                    d={`M${95 + (20 + j * 10) * 8} ${49 + chain * 145 + j * 38}v10`}
                    stroke={colors[2]}
                    strokeWidth="2"
                  />
                )}
              </g>
            ))}
          </g>
        ))}
        <text x="55" y="320">
          Prompt work 180 positions · generated work 60 tokens
        </text>
      </Drawing>
      <p>Parsing and verifier calls add separate work; no quantity is invented for them here.</p>
    </Figure>
  );
}
export function Opportunity() {
  const [p, setP] = useState(0.3),
    [n, setN] = useState(4),
    fail = (1 - p) ** n;
  return (
    <Figure
      id="D04"
      caption="Analytical opportunity: at least one correct candidate exists. This is not selected-answer accuracy."
    >
      <div className="ttc-token-row">
        {Array.from({ length: n }, (_, i) => (
          <span className="ttc-token" key={i}>
            Attempt {i + 1}
            <br />
            fail {fmt(1 - p)}
          </span>
        ))}
      </div>
      <p>
        All fail jointly: {fmt(1 - p)}
        <sup>{n}</sup> = {fmt(fail)}. Complement: {fmt(1 - fail)}.
      </p>
      <Plot
        xMax={8}
        yMax={1}
        xLabel="Candidate count N"
        yLabel="Probability of any correct candidate"
        selectedX={n}
        series={[
          {
            name: 'iid attempts',
            color: colors[0],
            line: true,
            points: Array.from({ length: 8 }, (_, i) => [i + 1, opportunity(p, i + 1)]),
          },
          {
            name: 'identical copies',
            color: colors[1],
            line: true,
            points: Array.from({ length: 8 }, (_, i) => [i + 1, p]),
          },
        ]}
      />
      <Status>
        At N={n}: iid {fmt(opportunity(p, n))}; identical copies {fmt(p)}.
      </Status>
      <Controls
        reset={() => {
          setP(0.3);
          setN(4);
        }}
      >
        <Range
          label="Single-attempt success probability"
          value={p}
          min={0}
          max={1}
          step={0.05}
          onChange={setP}
        />
        <Range label="Candidates N" value={n} min={1} max={8} onChange={setN} />
      </Controls>
    </Figure>
  );
}
export function ScoreSelection() {
  const [score, setScore] = useState(0.9),
    rows = pool.map((r) => (r.id === 'C' ? { ...r, score } : r));
  const eligible = rows
      .filter((r) => r.answer != null)
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)),
    chosen = eligible[0];
  return (
    <Figure
      id="D05"
      caption="Ranking scores are not correctness probabilities. Candidate E was generated and cost work, but its answer fails the numeric parser."
    >
      <p>Score axis: 0 → 1. White outline marks selected candidate.</p>
      {[...eligible, rows[4]].map((r) => (
        <div key={r.id} className={`ttc-score-row ${r.id === chosen.id ? 'ttc-selected' : ''}`}>
          <span style={{ color: colors['ABCDE'.indexOf(r.id)] }}>
            {r.id}: {r.text}
          </span>
          <div className="ttc-score-track">
            <i style={{ width: `${100 * r.score}%`, background: colors['ABCDE'.indexOf(r.id)] }} />
          </div>
          <span>
            {fmt(r.score)}
            {r.answer == null ? ' excluded' : ''}
          </span>
        </div>
      ))}
      <Status>
        Selected {chosen.id}: {chosen.answer}. Evaluation against gold 11/2:{' '}
        {chosen.answer === '11/2' ? '✓ correct' : '× wrong'}. A correct candidate is present at
        every score.
      </Status>
      <Controls reset={() => setScore(0.9)}>
        <Range
          label="Candidate C score"
          value={score}
          min={0}
          max={1}
          step={0.05}
          onChange={setScore}
        />
      </Controls>
    </Figure>
  );
}
export function AnswerGroups() {
  const rows = [...pool, { id: 'F', text: '22/4', answer: '11/2' }],
    groupY = { '11/2': 95, '15/2': 195, '2/11': 270, invalid: 345 };
  return (
    <Figure
      id="D06"
      caption="F is an added spelling example: six generated strings, five valid numeric strings, three numeric answer groups and one invalid bin."
    >
      <Drawing label="Spelling strands converge into exact reduced-fraction groups" height={390}>
        {rows.map((r, i) => (
          <g key={r.id}>
            <text x="15" y={40 + i * 60} style={{ fill: colors[i] }}>
              {r.id}: {r.text}
            </text>
            <path
              d={`M165 ${35 + i * 60}C235 ${35 + i * 60},255 ${groupY[r.answer || 'invalid']},355 ${groupY[r.answer || 'invalid']}`}
              stroke={colors[i]}
              fill="none"
              strokeWidth="2"
            />
          </g>
        ))}
        <text x="370" y="100">
          11/2 ← A, B, F
        </text>
        <text x="370" y="125">
          22÷2 / 4÷2 = 11/2
        </text>
        <text x="370" y="200">
          15/2 ← C
        </text>
        <text x="370" y="275">
          2/11 ← D
        </text>
        <text x="370" y="350">
          invalid ← E
        </text>
      </Drawing>
    </Figure>
  );
}
export function VoteDistribution() {
  const [n, setN] = useState(7),
    distributions = [
      [0.4, 0.35, 0.25],
      [0.4, 0.5, 0.1],
    ],
    values = distributions.map((p) => plurality(p, n));
  return (
    <Figure
      id="D07"
      caption="Here colour encodes answer class: blue correct, violet wrong 1, amber wrong 2. Enumeration uses first-occurrence ties; no binary collapse."
    >
      <div className="ttc-pair">
        {distributions.map((p, i) => (
          <div key={i}>
            <p>
              Distribution {i + 1} · mode {i ? 'wrong 1' : 'correct'}
            </p>
            <div className="ttc-token-row">
              {p.map((v, j) => (
                <span key={j} className="ttc-token" style={{ '--token-color': colors[j] }}>
                  {['correct', 'wrong 1', 'wrong 2'][j]}
                  <br />
                  {fmt(v)}
                </span>
              ))}
            </div>
            <Table
              headers={['Returned class', `P(selected), N=${n}`]}
              rows={values[i].map((v, j) => [['correct', 'wrong 1', 'wrong 2'][j], fmt(v, 6)])}
            />
          </div>
        ))}
      </div>
      <Plot
        xMax={7}
        yMax={1}
        xTicks={[1, 3, 5, 7]}
        xLabel="Candidate count N"
        yLabel="Exact probability of selecting correct class"
        series={distributions.map((p, i) => ({
          name: `Distribution ${i + 1} · ${i ? 'dashed / hollow' : 'solid / filled'}`,
          color: colors[0],
          dashed: i === 1,
          line: true,
          points: [1, 3, 5, 7].map((k) => [k, plurality(p, k)[0]]),
        }))}
        selectedX={n}
      />
      <Controls reset={() => setN(7)}>
        <Select
          label="Number of votes"
          value={n}
          options={[1, 3, 5, 7].map((v) => [v, String(v)])}
          onChange={(v) => setN(Number(v))}
        />
      </Controls>
    </Figure>
  );
}
export function RiskMatrix() {
  const [kind, setKind] = useState('absolute'),
    r = risk(kind),
    max = Math.max(...r.matrix.flat());
  return (
    <Figure
      id="D08"
      caption="Cell intensity encodes loss magnitude, from zero to the largest entry. Columns are sampled-reference possibilities, not evaluation gold."
    >
      <Table
        headers={[
          'Action ↓ / reference →',
          ...r.actions.map((a, j) => `${a}, weight ${r.weights[j]}`),
          'Expected loss',
        ]}
        rows={r.matrix.map((row, i) => [
          <span className={i === r.selected ? 'ttc-selected' : ''}>
            {r.actions[i]}
            {i === r.selected ? ' selected' : ''}
          </span>,
          ...row.map((v, j) => (
            <span
              key={j}
              className="ttc-cell"
              style={{ background: `rgba(125,184,255,${0.04 + (0.5 * v) / max})` }}
            >
              {v}
            </span>
          )),
          fmt(r.risks[i]),
        ])}
      />
      <Status>
        Action {r.actions[r.selected]}:{' '}
        {r.matrix[r.selected].map((v, j) => `${v}×${r.weights[j]}`).join(' + ')} ={' '}
        {fmt(r.risks[r.selected])} expected loss.
      </Status>
      <Controls reset={() => setKind('absolute')}>
        <Select
          label="Loss"
          value={kind}
          options={[
            ['absolute', 'Absolute difference'],
            ['exact', 'Exact-match error'],
          ]}
          onChange={setKind}
        />
      </Controls>
    </Figure>
  );
}
