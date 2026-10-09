import React, { useState } from 'react';
import { beam, localGlobal, work } from '../../data/decoding-strategies-models.js';
import {
  Figure,
  Controls,
  Select,
  Slider,
  Local,
  Bars,
  Strip,
  Readout,
  Table,
  colours,
  fmt,
  vector,
} from './DecodingElements.jsx';
function BeamLattice({ states, step }) {
  const current = states[Math.min(step, states.length - 1)];
  return (
    <>
      <Local label="Parent rows and globally ranked extensions">
        <svg
          viewBox="0 0 760 390"
          role="img"
          aria-label="Beam parent rows connected to expanded candidate paths"
        >
          <text x="15" y="24" fontSize="16">
            previous live frontier
          </text>
          <text x="305" y="24" fontSize="16">
            all extensions, globally ranked
          </text>
          {(states[Math.max(0, step - 1)]?.alive || []).map((row, i) => (
            <g key={row.path}>
              <rect
                x="15"
                y={60 + i * 85}
                width="220"
                height="48"
                fill="#222"
                stroke={colours[i]}
              />
              <text x="27" y={90 + i * 85} fontSize="17" style={{ fill: colours[i] }}>
                {row.path || 'root'} · {fmt(row.probability)}
              </text>
            </g>
          ))}
          {current.candidates.map((row, i) => {
            const selected =
              current.alive.some((x) => x.path === row.path) ||
              current.finished.some((x) => x.path === row.path);
            return (
              <g key={row.path}>
                <path
                  d={`M235 ${84 + row.parent * 85}L305 ${55 + i * 46}`}
                  stroke={colours[row.parent % 5]}
                  fill="none"
                  strokeDasharray={selected ? undefined : '5 4'}
                />
                <text
                  x="315"
                  y={60 + i * 46}
                  fontSize="16"
                  style={{ fill: colours[row.parent % 5] }}
                >
                  {row.path} · p={fmt(row.probability)} · edge {fmt(row.edge)}
                </text>
                <text x="652" y={60 + i * 46} fontSize="14">
                  {row.token === 'EOS' ? 'finished' : selected ? 'live' : 'pruned'}
                </text>
              </g>
            );
          })}
        </svg>
      </Local>
      <Table
        headers={['Path', 'Parent row', 'Local log p', 'Cumulative log p', 'Destination']}
        rows={current.candidates.map((row) => [
          row.path,
          row.parent,
          fmt(Math.log(row.edge)),
          fmt(Math.log(row.probability)),
          row.token === 'EOS'
            ? 'finished pool'
            : current.alive.some((x) => x.path === row.path)
              ? 'next live'
              : 'pruned',
        ])}
      />
    </>
  );
}
export function BeamExpansion() {
  const [width, setWidth] = useState(2),
    [step, setStep] = useState(2);
  const states = beam(width);
  return (
    <Figure id="D17" label="Beam expansion and ancestry">
      <BeamLattice states={states} step={Math.min(step, states.length - 1)} />
      <Controls
        reset={() => {
          setWidth(2);
          setStep(2);
        }}
      >
        <Slider label="Beam width" min={1} max={3} step={1} value={width} onChange={setWidth} />
        <Slider
          label="Expansion step"
          min={1}
          max={states.length - 1}
          step={1}
          value={Math.min(step, states.length - 1)}
          onChange={setStep}
        />
      </Controls>
      <Readout>
        Keep at most {width} live prefixes across all parents. The finite oracle's best complete
        route is B X EOS, probability 0.315. Pruned prefixes are outside later stopping
        certificates.
      </Readout>
    </Figure>
  );
}
export function FinishedAlive() {
  const [fixture, setFixture] = useState('standard'),
    [width, setWidth] = useState(2),
    [step, setStep] = useState(2);
  const states = beam(width, 3, fixture),
    s = states[Math.min(step, states.length - 1)];
  return (
    <Figure id="D18" label="Live, finished and capped lanes">
      <Local label="EOS exits the live frontier">
        <svg
          viewBox="0 0 760 335"
          role="img"
          aria-label="Distinct live, finished and capped storage"
        >
          <text x="15" y="32" fontSize="17">
            expanded candidates
          </text>
          {s.candidates.map((row, i) => (
            <g key={row.path}>
              <text x="15" y={65 + i * 34} fontSize="15" style={{ fill: colours[row.parent % 5] }}>
                {row.path} · {fmt(row.probability)}
              </text>
              {(row.token === 'EOS' || s.alive.includes(row)) && (
                <path
                  d={`M240 ${60 + i * 34}L400 ${row.token === 'EOS' ? 160 : step === 3 ? 250 : 65}`}
                  stroke={row.token === 'EOS' ? colours[4] : colours[0]}
                  fill="none"
                />
              )}
            </g>
          ))}
          {[
            [step === 3 ? 'nonterminal survivors' : 'next live', 65, s.alive, 0],
            ['finished; no next call', 160, s.finished, 4],
            ['capped at horizon', 250, step === 3 ? s.alive : [], 2],
          ].map(([label, y, rows, c]) => (
            <g key={label}>
              <path d={`M400 ${y}H735`} stroke={colours[c]} strokeWidth="2" />
              <text x="405" y={y - 14} fontSize="16" style={{ fill: colours[c] }}>
                {label}
              </text>
              {(rows.length ? rows : [null]).map((r, i) => (
                <text key={i} x="405" y={y + 23 + i * 18} fontSize="14">
                  {r ? `${r.path} (${fmt(r.probability)})` : 'none'}
                </text>
              ))}
            </g>
          ))}
        </svg>
      </Local>
      <Controls
        reset={() => {
          setFixture('standard');
          setWidth(2);
          setStep(2);
        }}
      >
        <Select
          label="Fixture"
          value={fixture}
          onChange={setFixture}
          options={[
            ['standard', 'Original tree'],
            ['early', 'Early EOS saved'],
            ['no-eos', 'No EOS before horizon'],
          ]}
        />
        <Slider label="Width" min={1} max={3} step={1} value={width} onChange={setWidth} />
        <Slider label="Step" min={1} max={3} step={1} value={step} onChange={setStep} />
      </Controls>
      <Readout>
        Teaching convention: admit every EOS child, retain top finished and top nonterminal pools
        separately.{' '}
        {fixture === 'early'
          ? 'Width 1 saves early EOS with probability 0.4; greedy instead follows A then X with probability 0.3.'
          : fixture === 'no-eos'
            ? 'At the horizon all surviving prefixes are capped, not EOS-completed.'
            : 'Finished sequences have no outgoing model call.'}{' '}
        Native admission can differ.
      </Readout>
    </Figure>
  );
}
export function LengthScore() {
  const [alpha, setAlpha] = useState(1),
    [prompt, setPrompt] = useState(8);
  const rows = [
    [0.5, 2],
    [0.4, 4],
  ].map(([p, l]) => ({ p, l, s: Math.log(p) / l ** alpha }));
  return (
    <Figure id="D19" label="Generated-length score">
      <Local label="Prompt context is separate from generated score length">
        <svg
          viewBox="0 0 700 225"
          role="img"
          aria-label="Two generated paths and their score denominators"
        >
          {rows.map((r, i) => (
            <g key={i}>
              <text x="15" y={30 + i * 95} fontSize="16" style={{ fill: colours[i] }}>
                path {i + 1}: p={r.p}, S={fmt(Math.log(r.p))}
              </text>
              <rect
                x="15"
                y={48 + i * 95}
                width={Math.min(160, prompt * 8)}
                height="25"
                fill="#444"
              />
              <text x="20" y={66 + i * 95} fontSize="13">
                prompt {prompt}
              </text>
              {Array.from({ length: r.l }, (_, j) => (
                <g key={j}>
                  <rect
                    x={190 + j * 65}
                    y={48 + i * 95}
                    width="55"
                    height="25"
                    fill={colours[i]}
                    fillOpacity=".3"
                    stroke={colours[i]}
                  />
                  <text x={217 + j * 65} y={66 + i * 95} fontSize="13" textAnchor="middle">
                    {j === r.l - 1 ? 'EOS' : j + 1}
                  </text>
                </g>
              ))}
              <text x="480" y={66 + i * 95} fontSize="16">
                S / {r.l}^{alpha} = {fmt(r.s)}
              </text>
            </g>
          ))}
        </svg>
      </Local>
      <Controls
        reset={() => {
          setAlpha(1);
          setPrompt(8);
        }}
      >
        <Slider
          label="Length exponent α"
          min={0}
          max={2}
          step={0.5}
          value={alpha}
          onChange={setAlpha}
        />
        <Slider
          label="Prompt length"
          min={0}
          max={20}
          step={1}
          value={prompt}
          onChange={setPrompt}
        />
      </Controls>
      <Readout>
        Path {rows[0].s >= rows[1].s ? 1 : 2} wins this score. Generated length includes EOS and
        excludes the prompt. The normalized score is not a probability.
      </Readout>
    </Figure>
  );
}
export function StoppingBound() {
  const [alpha, setAlpha] = useState(0),
    [horizon, setHorizon] = useState(6),
    [available, setAvailable] = useState('yes');
  const live = [-1.2, -1.6],
    bounds = live.map((s) => s / horizon ** alpha),
    best = -0.5;
  const stop = available === 'yes' && best >= Math.max(...bounds);
  const x = (s) => 50 + ((s + 2) / 2) * 570;
  return (
    <Figure id="D20" label="Retained-frontier stopping certificate">
      <Local label="Scores increase to the right">
        <svg
          viewBox="0 0 690 290"
          role="img"
          aria-label="Completed score compared with live upper bounds"
        >
          <path d="M50 225H625" stroke="#aaa" />
          {[-2, -1.5, -1, -0.5, 0].map((s) => (
            <text key={s} x={x(s)} y="250" textAnchor="middle" fontSize="14">
              {s}
            </text>
          ))}
          {bounds.map((b, i) => (
            <g key={i}>
              <path
                d={`M${x(live[i])} ${70 + i * 65}H${x(b)}`}
                stroke={colours[i]}
                strokeWidth="3"
              />
              <circle cx={x(b)} cy={70 + i * 65} r="6" fill={colours[i]} />
              <text x="50" y={48 + i * 65} fontSize="15">
                live {i}: S={live[i]}, bound {fmt(b)}
              </text>
            </g>
          ))}
          {available === 'yes' && (
            <>
              <path d={`M${x(best)} 25V220`} stroke="white" strokeDasharray="5 3" />
              <text x={x(best) + 8} y="195" fontSize="15">
                finished −0.5
              </text>
            </>
          )}
          <text x="50" y="274" fontSize="14">
            previously pruned branches: outside this certificate
          </text>
        </svg>
      </Local>
      <Controls
        reset={() => {
          setAlpha(0);
          setHorizon(6);
          setAvailable('yes');
        }}
      >
        <Slider label="α" min={0} max={2} step={0.5} value={alpha} onChange={setAlpha} />
        <Slider
          label="Maximum generated length"
          min={2}
          max={12}
          step={1}
          value={horizon}
          onChange={setHorizon}
        />
        <Select
          label="Completed candidate"
          value={available}
          onChange={setAvailable}
          options={[
            ['yes', 'Available'],
            ['no', 'None yet'],
          ]}
        />
      </Controls>
      <Readout>
        {stop
          ? 'May stop: the completed score is at least every surviving bound.'
          : available === 'no'
            ? 'No completion exists: this certificate cannot stop the search.'
            : 'Continue: at least one retained prefix has an optimistic score above the completed score.'}{' '}
        Current prefix length is 2; the finite horizon is {horizon}.
      </Readout>
    </Figure>
  );
}
export function NativeModel() {
  const [block, setBlock] = useState(0);
  return (
    <Figure id="D23" label="Actual Pythia decoder architecture">
      <Local label="Six sequential blocks, selected parallel residual block">
        <svg
          viewBox="0 0 780 490"
          role="img"
          aria-label="Pythia six sequential GPTNeoX blocks and expanded parallel attention and MLP branches"
        >
          <text x="20" y="26" fontSize="16">
            tokenizer IDs → embedding, width 128
          </text>
          <path d="M50 40V72H730" fill="none" stroke="#aaa" />
          {Array.from({ length: 6 }, (_, i) => (
            <g key={i}>
              <rect
                x={35 + i * 120}
                y="52"
                width="95"
                height="48"
                fill="#222"
                stroke={i === block ? 'white' : colours[i % 5]}
                strokeWidth={i === block ? 3 : 1}
              />
              <text x={82 + i * 120} y="81" textAnchor="middle" fontSize="16">
                block {i + 1}
              </text>
              {i < 5 && (
                <path
                  d={`M${130 + i * 120} 76H${150 + i * 120}l-6 -4m6 4l-6 4`}
                  fill="none"
                  stroke="#bbb"
                />
              )}
            </g>
          ))}
          <path d="M730 76V155H70V167" fill="none" stroke="#aaa" />
          <text x="90" y="139" fontSize="16">
            final norm → head [128 × 50,304] → decoder → append → feedback
          </text>
          <text x="20" y="190" fontSize="17">
            Inside block {block + 1}: parallel pre-normalized branches
          </text>
          <path
            d="M60 235H190M125 235V310H190M125 235V410H610V310M355 235H410M355 310H410M570 235H610V310M570 310H635M675 310H745"
            fill="none"
            stroke="#aaa"
            strokeWidth="2"
          />
          <text x="20" y="230" fontSize="17">
            x
          </text>
          {[
            [190, 210, 'norm A'],
            [190, 285, 'norm M'],
            [410, 210, 'attention'],
            [410, 285, 'MLP'],
          ].map(([x, y, name]) => (
            <g key={name}>
              <rect
                x={x}
                y={y}
                width="165"
                height="50"
                fill="#222"
                stroke={name === 'MLP' ? colours[2] : colours[0]}
              />
              <text x={x + 82} y={y + 30} textAnchor="middle" fontSize="17">
                {name}
              </text>
            </g>
          ))}
          <circle cx="655" cy="310" r="20" fill="#222" stroke="white" />
          <text x="655" y="317" textAnchor="middle" fontSize="24">
            +
          </text>
          <text x="430" y="200" fontSize="14">
            4 heads × width 32
          </text>
          <text x="425" y="365" fontSize="14">
            128 → 512 → 128
          </text>
          <text x="265" y="438" fontSize="16">
            residual x bypasses both branches
          </text>
          <text x="25" y="472" fontSize="15">
            y = x + attention(norm A(x)) + MLP(norm M(x))
          </text>
        </svg>
      </Local>
      <Controls reset={() => setBlock(0)}>
        <Slider label="Inspect block" min={0} max={5} step={1} value={block} onChange={setBlock} />
      </Controls>
      <Readout>
        Pinned EleutherAI/pythia-14m, revision cf967c0a…; use_parallel_residual=true. Structure is
        shown continuously. The diagram's coordinates are schematic, with no claimed measured
        activations.
      </Readout>
    </Figure>
  );
}
export function UtilityDecision() {
  const [a, setA] = useState(0),
    [b, setB] = useState(1),
    [c, setC] = useState(1);
  const u = [a, b, c],
    p = [0.5, 0.3, 0.2],
    expected = u.reduce((s, v, i) => s + p[i] * v, 0),
    best = Math.max(...u);
  return (
    <Figure id="D28" label="Probability and assigned utility">
      <Bars
        p={p}
        names={['candidate 1', 'candidate 2', 'candidate 3']}
        label="Fixed model probability"
      />
      <Table
        headers={['Complete candidate', 'Assigned utility', 'p × utility', 'Decision']}
        rows={u.map((v, i) => [
          i + 1,
          v,
          fmt(p[i] * v),
          `${i === 0 ? 'modal choice; ' : ''}${v === best ? 'utility preferred' : ''}`,
        ])}
      />
      <Controls
        reset={() => {
          setA(0);
          setB(1);
          setC(1);
        }}
      >
        {u.map((v, i) => (
          <Slider
            key={i}
            label={`Utility ${i + 1}`}
            value={v}
            onChange={[setA, setB, setC][i]}
            step={0.1}
          />
        ))}
      </Controls>
      <Readout>
        Sampling from p gives expected assigned utility {fmt(expected)}. These are constructed
        external utilities; they are not measured language quality or model confidence.
      </Readout>
    </Figure>
  );
}
export function LocalGlobal() {
  const [a, setA] = useState(0.6),
    [b, setB] = useState(0.9);
  const r = localGlobal(a, b);
  return (
    <Figure id="D29" label="Local masking and global conditioning">
      <Local label="Where each normalization denominator acts">
        <svg
          viewBox="0 0 740 345"
          role="img"
          aria-label="Two-step tree with accepted and rejected leaves"
        >
          <text x="15" y="175" fontSize="17">
            root
          </text>
          {[a, b].map((p, i) => (
            <g key={i}>
              <path
                d={`M70 170L225 ${80 + i * 175}M300 ${80 + i * 175}L495 ${40 + i * 175}M300 ${80 + i * 175}L495 ${115 + i * 175}`}
                fill="none"
                stroke={colours[i]}
                strokeWidth="2"
              />
              <text x="120" y={100 + i * 100} fontSize="17" style={{ fill: colours[i] }}>
                {i === 0 ? '.6' : '.4'}
              </text>
              <text x="230" y={85 + i * 175} fontSize="17">
                {i === 0 ? 'A' : 'B'}
              </text>
              <text x="350" y={50 + i * 175} fontSize="16">
                accept {p}
              </text>
              <text x="350" y={127 + i * 175} fontSize="16">
                reject {fmt(1 - p)}
              </text>
              <text x="510" y={45 + i * 175} fontSize="16" style={{ fill: colours[i] }}>
                original mass {fmt(r.accepted[i])}
              </text>
              <text x="510" y={120 + i * 175} fontSize="15">
                discarded by local mask
              </text>
            </g>
          ))}
        </svg>
      </Local>
      <Table
        headers={['Route', 'A terminal mass', 'B terminal mass', 'Failure / denominator']}
        rows={[
          [
            'Local masked decoder',
            r.local[0],
            r.local[1],
            `failure ${fmt(r.failure)}; child denominators ${a}, ${b}`,
          ],
          [
            'Global conditional',
            r.global ? fmt(r.global[0]) : 'undefined',
            r.global ? fmt(r.global[1]) : 'undefined',
            `global accepted mass ${fmt(r.mass)}`,
          ],
        ]}
      />
      <Controls
        reset={() => {
          setA(0.6);
          setB(0.9);
        }}
      >
        <Slider label="A accepted-child probability" value={a} onChange={setA} step={0.05} />
        <Slider label="B accepted-child probability" value={b} onChange={setB} step={0.05} />
        <button onClick={() => setA(0)}>A dead end</button>
        <button
          onClick={() => {
            setA(0);
            setB(0);
          }}
        >
          Both dead ends
        </button>
      </Controls>
      <Readout>
        {r.failure > 0
          ? `Local empty-support branches fail with probability ${fmt(r.failure)}; root mass is not redistributed.`
          : 'Both local child normalizations are defined.'}{' '}
        {r.global
          ? `Global conditioning normalizes accepted masses by ${fmt(r.mass)}.`
          : 'The event has zero mass: global conditioning is undefined.'}
      </Readout>
    </Figure>
  );
}
export function DecoderWork() {
  const [v, setV] = useState(1000),
    [b, setB] = useState(4),
    [steps, setSteps] = useState(3),
    [ends, setEnds] = useState(2),
    [policy, setPolicy] = useState('none');
  const finishes = Math.min(ends, b),
    r = work(v, b, steps, finishes, policy === 'replenish');
  return (
    <Figure id="D30" label="Active prefix work grid">
      <Local label="Every active rectangle contains V candidate cells">
        <svg
          viewBox={`0 0 ${Math.max(650, steps * 90 + 130)} ${b * 45 + 100}`}
          role="img"
          aria-label="Active prefix rows across generation steps"
        >
          {Array.from({ length: b }, (_, row) => (
            <g key={row}>
              <text x="5" y={60 + row * 45} fontSize="14">
                prefix {row}
              </text>
              {r.rows.map((count, t) => (
                <g key={t}>
                  <rect
                    x={90 + t * 90}
                    y={37 + row * 45}
                    width="72"
                    height="32"
                    fill={row < count ? colours[row % 5] : '#222'}
                    fillOpacity={row < count ? 0.35 : 1}
                    stroke={row < count ? colours[row % 5] : '#666'}
                    strokeDasharray={row < count ? undefined : '4 3'}
                  />
                  <text x={126 + t * 90} y={59 + row * 45} textAnchor="middle" fontSize="13">
                    {row < count ? `V=${v}` : 'inactive'}
                  </text>
                </g>
              ))}
            </g>
          ))}
          {r.rows.map((_, i) => (
            <text key={i} x={126 + i * 90} y="23" textAnchor="middle" fontSize="14">
              step {i + 1}
            </text>
          ))}
        </svg>
      </Local>
      <Table
        headers={['Step', 'Active rows', 'Candidate cells']}
        rows={r.rows.map((n, i) => [i + 1, n, r.cells[i]])}
      />
      <Controls
        reset={() => {
          setV(1000);
          setB(4);
          setSteps(3);
          setEnds(2);
          setPolicy('none');
        }}
      >
        <Slider label="Vocabulary size" min={100} max={2000} step={100} value={v} onChange={setV} />
        <Slider label="Initial prefixes" min={1} max={5} step={1} value={b} onChange={setB} />
        <Slider label="Steps" min={1} max={6} step={1} value={steps} onChange={setSteps} />
        <Slider
          label="Finish after step 1"
          min={0}
          max={b}
          step={1}
          value={finishes}
          onChange={setEnds}
        />
        <Select
          label="Frontier"
          value={policy}
          onChange={setPolicy}
          options={[
            ['none', 'No replacement'],
            ['replenish', 'Replenish to initial width'],
          ]}
        />
      </Controls>
      <Readout>
        Total {r.total} candidate cells = V × sum of active rows. Each step still projects full
        vocabulary rows; filtering then chooses candidates and parent-state gather reorders
        surviving prefixes. This is an analytic count, not a latency measurement.
      </Readout>
    </Figure>
  );
}
