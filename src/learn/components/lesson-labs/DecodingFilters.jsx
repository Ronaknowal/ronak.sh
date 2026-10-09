import React, { useState } from 'react';
import {
  base,
  peaked,
  flat,
  tokens,
  filter,
  temperature,
  entropy,
  repetition,
  softmax,
  bans,
} from '../../data/decoding-strategies-models.js';
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
function SelectionDrawing({ p, result, label }) {
  return (
    <>
      <Local label={label}>
        <svg
          viewBox="0 0 720 320"
          role="img"
          aria-label="Original IDs connect to sorted ranks, retained mask and normalized output"
        >
          <text x="20" y="24" fontSize="16">
            original ID / p
          </text>
          <text x="263" y="24" fontSize="16">
            rank / cumulative mass
          </text>
          <text x="555" y="24" fontSize="16">
            retained q
          </text>
          {p.map((value, id) => {
            const rank = result.ranking.indexOf(id);
            const keep = result.mask[id];
            const cumulative = result.ranking.slice(0, rank + 1).reduce((a, i) => a + p[i], 0);
            return (
              <g key={id}>
                <text x="20" y={65 + id * 49} fontSize="16" style={{ fill: colours[id] }}>
                  {tokens[id]} {fmt(value)}
                </text>
                <path
                  d={`M160 ${60 + id * 49}L260 ${60 + rank * 49}M435 ${60 + rank * 49}H500L550 ${60 + id * 49}`}
                  fill="none"
                  stroke={colours[id]}
                  strokeDasharray={keep ? undefined : '5 5'}
                />
                <rect
                  x="262"
                  y={42 + rank * 49}
                  width={170 * value}
                  height="25"
                  fill={colours[id]}
                  fillOpacity=".3"
                />
                <text x="270" y={61 + rank * 49} fontSize="14">
                  {rank + 1}: Σ={fmt(cumulative, 4)}
                </text>
                <text x="560" y={65 + id * 49} fontSize="16" style={{ fill: colours[id] }}>
                  {keep ? fmt(result.q[id]) : 'excluded → 0'}
                </text>
              </g>
            );
          })}
        </svg>
      </Local>
      <Readout>
        Retained mass {fmt(result.mass)}; {result.mask.filter(Boolean).length} survivors. Normalize
        only retained entries. {label}
      </Readout>
    </>
  );
}
export function RankedCut() {
  const [k, setK] = useState(3),
    [preset, setPreset] = useState('base'),
    [tie, setTie] = useState('threshold');
  const p = { base, peaked, flat }[preset];
  const r = filter(p, 'k', k, tie === 'exact');
  return (
    <Figure id="D08" label="Rank threshold and ties">
      <SelectionDrawing p={p} result={r} label={`kth probability threshold ${fmt(r.cutoff)}`} />
      <Controls
        reset={() => {
          setK(3);
          setPreset('base');
          setTie('threshold');
        }}
      >
        <Slider label="Requested k" min={1} max={5} step={1} value={k} onChange={setK} />
        <Select
          label="Row"
          value={preset}
          onChange={setPreset}
          options={['base', 'peaked', 'flat'].map((x) => [x, x])}
        />
        <Select
          label="Tie policy"
          value={tie}
          onChange={setTie}
          options={[
            ['threshold', 'Keep kth-score ties'],
            ['exact', 'Exactly k, ID tie break'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function NucleusBoundary() {
  const [rho, setRho] = useState(0.8);
  const r = filter(base, 'p', rho);
  return (
    <Figure id="D09" label="Nucleus cumulative crossing">
      <SelectionDrawing
        p={base}
        result={r}
        label={`Target mass ρ=${rho}; the crossing token stays.`}
      />
      <Local label="Cumulative steps and target">
        <svg viewBox="0 0 620 190" role="img" aria-label="Cumulative mass at each ranked candidate">
          {[0.5, 0.75, 0.875, 0.9375, 1].map((mass, i) => (
            <g key={i}>
              <rect
                x={60 + i * 103}
                y={150 - mass * 120}
                width="80"
                height={mass * 120}
                fill={colours[i]}
                fillOpacity=".25"
              />
              <text x={100 + i * 103} y={140 - mass * 120} textAnchor="middle" fontSize="14">
                {fmt(mass)}
              </text>
              <text x={100 + i * 103} y="175" textAnchor="middle" fontSize="14">
                {tokens[i]}
              </text>
            </g>
          ))}
          <path d={`M40 ${150 - rho * 120}H600`} stroke="white" strokeDasharray="5 3" />
          <text x="40" y="18" fontSize="15">
            target {rho}; cumulative probability axis 0–1
          </text>
        </svg>
      </Local>
      <Controls reset={() => setRho(0.8)}>
        <Slider label="Target mass" min={0.05} max={1} step={0.01} value={rho} onChange={setRho} />
        {[0.5, 0.75, 0.8, 1].map((x) => (
          <button key={x} onClick={() => setRho(x)}>
            {x}
          </button>
        ))}
      </Controls>
      <Readout>
        This picture uses descending cumulative sums with stable ID ties. Exact floating boundaries
        can differ from the native ascending-tail calculation; inspect neighboring thresholds.
      </Readout>
    </Figure>
  );
}
export function PeakedFlat() {
  const [rho, setRho] = useState(0.8);
  return (
    <Figure id="D10" label="Adaptive nucleus size">
      <div className="decoding-columns">
        {[
          [peaked, 'Peaked'],
          [flat, 'Flat'],
        ].map(([p, name]) => {
          const r = filter(p, 'p', rho);
          return (
            <div key={name}>
              <Bars p={p} label={`${name} p`} />
              <Bars p={r.q} label={`${name} q: ${r.mask.filter(Boolean).length} survivors`} />
              <p>
                Crossing mass {fmt(r.mass)} ≥ {rho}
              </p>
            </div>
          );
        })}
      </div>
      <Controls reset={() => setRho(0.8)}>
        <Slider
          label="Shared target mass"
          min={0.05}
          max={1}
          step={0.01}
          value={rho}
          onChange={setRho}
        />
        <button onClick={() => setRho(0.95)}>0.95</button>
      </Controls>
    </Figure>
  );
}
export function RelativeCut() {
  const [m, setM] = useState(0.25),
    [preset, setPreset] = useState('base');
  const p = { base, peaked, flat }[preset],
    r = filter(p, 'min', m);
  return (
    <Figure id="D11" label="Relative peak cutoff">
      <Bars p={p} label={`Original p; cutoff ${fmt(r.cutoff)} = ${m} × ${Math.max(...p)}`} />
      <Local label="Probability bars crossed by the relative cutoff">
        <svg viewBox="0 0 630 215" role="img" aria-label="Probability and relative threshold">
          {p.map((v, i) => (
            <g key={i}>
              <rect
                x={65 + i * 108}
                y={170 - v * 135}
                width="65"
                height={v * 135}
                fill={colours[i]}
                fillOpacity={r.mask[i] ? 0.6 : 0.2}
                stroke={colours[i]}
                strokeDasharray={r.mask[i] ? undefined : '4 4'}
              />
              <text x={98 + i * 108} y="196" textAnchor="middle" fontSize="14">
                {tokens[i]}
              </text>
            </g>
          ))}
          <path d={`M45 ${170 - r.cutoff * 135}H610`} stroke="white" strokeDasharray="5 3" />
          <text x="45" y="20" fontSize="15">
            p axis 0–1; cutoff {fmt(r.cutoff)}
          </text>
        </svg>
      </Local>
      <Bars p={r.q} label="Normalized q" />
      <Controls
        reset={() => {
          setM(0.25);
          setPreset('base');
        }}
      >
        <Slider label="Peak fraction m" value={m} onChange={setM} step={0.05} />
        <Select
          label="Row"
          value={preset}
          onChange={setPreset}
          options={['base', 'peaked', 'flat'].map((x) => [x, x])}
        />
      </Controls>
      <Readout>
        Keep equality. {r.mask.filter(Boolean).length} entries survive, retained mass {fmt(r.mass)}.
        One maximum plus comparisons; no sort is required.
      </Readout>
    </Figure>
  );
}
export function OperatorComposition() {
  const [chain, setChain] = useState('min'),
    [t, setT] = useState(2),
    [cut, setCut] = useState(0.3),
    [k, setK] = useState(3),
    [rho, setRho] = useState(0.8);
  const hot = temperature(base, t),
    before = filter(base, 'min', cut),
    after = filter(hot, 'min', cut),
    ranked = filter(base, 'k', k),
    nucleus = filter(ranked.q, 'p', rho);
  return (
    <Figure id="D12" label="Noncommuting filter order">
      {chain === 'min' ? (
        <div className="decoding-columns">
          <div>
            <Strip values={['p', `T ${t}`, `min-p ${cut}`]} />
            <Bars p={hot} label="After temperature" />
            <Bars p={after.q} label={`Then cutoff ${fmt(after.cutoff)} → q`} />
          </div>
          <div>
            <Strip values={['p', `min-p ${cut}`, `T ${t}`]} />
            <Bars p={before.q} label={`After cutoff ${fmt(before.cutoff)}`} />
            <Bars p={temperature(before.q, t)} label="Then temperature → q" />
          </div>
        </div>
      ) : (
        <>
          <Strip values={['p', `top-k ${k}`, `top-p ${rho}`]} />
          <div className="decoding-columns">
            <Bars p={ranked.q} label="Normalized after top-k" />
            <Bars p={nucleus.q} label="Then nucleus on current row" />
          </div>
        </>
      )}
      <Controls
        reset={() => {
          setChain('min');
          setT(2);
          setCut(0.3);
          setK(3);
          setRho(0.8);
        }}
      >
        <Select
          label="Chain"
          value={chain}
          onChange={setChain}
          options={[
            ['min', 'Temperature / min-p order'],
            ['kp', 'Top-k then top-p'],
          ]}
        />
        {chain === 'min' ? (
          <>
            <Slider label="Temperature" min={0.1} max={3} step={0.1} value={t} onChange={setT} />
            <Slider label="Peak fraction" value={cut} onChange={setCut} step={0.05} />
          </>
        ) : (
          <>
            <Slider label="k" min={1} max={5} step={1} value={k} onChange={setK} />
            <Slider
              label="Target mass"
              min={0.05}
              max={1}
              step={0.05}
              value={rho}
              onChange={setRho}
            />
          </>
        )}
      </Controls>
      <Readout>
        Native core order: temperature → top-k → top-p → min-p. The reversed path is a
        counterfactual decoder. A removed score stays excluded under later finite temperature
        scaling.
      </Readout>
    </Figure>
  );
}
export function SurprisalGeometry() {
  const [rule, setRule] = useState('typical'),
    [amount, setAmount] = useState(0.25);
  const p = [0.4, 0.3, 0.2, 0.1],
    h = entropy(p),
    r = filter(p, rule, amount);
  return (
    <Figure id="D13" label="Surprisal and alternative filters">
      {rule === 'typical' ? (
        <Local label="Surprisal distances from mean entropy">
          <svg
            viewBox="0 0 660 275"
            role="img"
            aria-label="Each surprisal connected to the mean entropy"
          >
            <path d="M55 220H610" stroke="#aaa" />
            {[0, 0.5, 1, 1.5, 2, 2.5].map((x) => (
              <text key={x} x={55 + x * 220} y="245" fontSize="14" textAnchor="middle">
                {x}
              </text>
            ))}
            <text x="320" y="271" textAnchor="middle" fontSize="15">
              surprisal −log p, nats
            </text>
            <path d={`M${55 + h * 220} 15V220`} stroke="white" strokeDasharray="4 4" />
            <text x={55 + h * 220 + 8} y="20" fontSize="14">
              H={fmt(h)}
            </text>
            {p.map((v, i) => (
              <g key={i}>
                <path
                  d={`M${55 + h * 220} ${55 + i * 40}H${55 - Math.log(v) * 220}`}
                  stroke={colours[i]}
                  strokeWidth="3"
                />
                <circle cx={55 - Math.log(v) * 220} cy={55 + i * 40} r="5" fill={colours[i]} />
                <text x="10" y={60 + i * 40} fontSize="14">
                  ID {i}
                </text>
                <text
                  x={70 - Math.log(v) * 220}
                  y={43 + i * 40}
                  fontSize="14"
                  style={{ fill: colours[i] }}
                >
                  {fmt(-Math.log(v), 3)}
                </text>
              </g>
            ))}
          </svg>
        </Local>
      ) : (
        <Bars p={p} names={p.map((_, i) => `ID ${i}`)} label={`${rule} cutoff ${fmt(r.cutoff)}`} />
      )}
      <Table
        headers={['ID', 'p', 'surprisal', 'distance to H', 'keep', 'q']}
        rows={p.map((v, i) => [
          i,
          v,
          fmt(-Math.log(v)),
          fmt(Math.abs(-Math.log(v) - h)),
          r.mask[i] ? 'yes' : 'no',
          fmt(r.q[i]),
        ])}
      />
      <Controls
        reset={() => {
          setRule('typical');
          setAmount(0.25);
        }}
      >
        <Select
          label="Rule"
          value={rule}
          onChange={setRule}
          options={['typical', 'epsilon', 'eta'].map((x) => [x, x])}
        />
        <Slider
          label={rule === 'typical' ? 'Typical mass' : 'Epsilon parameter'}
          min={0.01}
          max={1}
          step={0.01}
          value={amount}
          onChange={setAmount}
        />
      </Controls>
      <Readout>
        {rule === 'typical'
          ? `Distance order: ${r.ranking.join(' → ')}. Equal-distance boundary entries remain; a nonmodal entry can satisfy the target alone.`
          : 'Entries at the cutoff remain; maximum-probability entries are preserved if the cutoff would exclude all entries.'}
      </Readout>
    </Figure>
  );
}
export function SignedPenalty() {
  const [penalty, setPenalty] = useState(1.2),
    [shift, setShift] = useState(0),
    [seen, setSeen] = useState('02'),
    [bias, setBias] = useState(-0.5);
  const z = [2, 1, -1].map((x) => x + shift),
    ids = seen === 'none' ? [] : seen === 'all' ? [0, 1, 2] : [0, 2];
  const changed = repetition(z, ids, penalty),
    biased = z.map((x, i) => (i === 0 ? x + bias : x));
  return (
    <Figure id="D14" label="Signed repetition and additive bias">
      <Table
        headers={['ID', 'raw z', 'seen?', 'operation', 'new z', 'bias path z']}
        rows={z.map((x, i) => [
          i,
          x,
          ids.includes(i) ? 'yes' : 'no',
          ids.includes(i) ? (x < 0 ? `× ${penalty}` : `÷ ${penalty}`) : 'unchanged',
          fmt(changed[i]),
          biased[i],
        ])}
      />
      <div className="decoding-columns">
        <Bars p={softmax(z)} names={['ID 0', 'ID 1', 'ID 2']} label="Original p" />
        <Bars p={softmax(changed)} names={['ID 0', 'ID 1', 'ID 2']} label="Signed-rule q" />
        <Bars p={softmax(biased)} names={['ID 0', 'ID 1', 'ID 2']} label="ID 0 additive bias q" />
      </div>
      <Controls
        reset={() => {
          setPenalty(1.2);
          setShift(0);
          setSeen('02');
          setBias(-0.5);
        }}
      >
        <Slider
          label="Penalty r"
          min={0.5}
          max={2}
          step={0.1}
          value={penalty}
          onChange={setPenalty}
        />
        <Slider
          label="Common shift"
          min={-3}
          max={3}
          step={0.5}
          value={shift}
          onChange={setShift}
        />
        <Select
          label="Seen IDs"
          value={seen}
          onChange={setSeen}
          options={[
            ['02', '0 and 2'],
            ['all', 'All'],
            ['none', 'None'],
          ]}
        />
        <Slider label="Bias on ID 0" min={-3} max={3} step={0.5} value={bias} onChange={setBias} />
      </Controls>
      <Readout>
        The signed rule adjusts each seen ID once. r=1 is neutral; r below 1 rewards seen tokens. A
        common shift preserves original p, but can change signed-rule q.
      </Readout>
    </Figure>
  );
}
export function NgramLookup() {
  const [fixture, setFixture] = useState('repeat'),
    [n, setN] = useState(2);
  const history = {
    repeat: ['New', 'York', 'New'],
    empty: [],
    unmatched: ['New', 'York', 'City'],
    all: ['New', 'York', 'City'],
  }[fixture];
  const actualN = fixture === 'all' ? 1 : n;
  const result = bans(history, actualN),
    names = ['New', 'York', 'City'],
    p = [0.4, 0.35, 0.25],
    mass = p.reduce((a, v, i) => a + (result.banned.includes(names[i]) ? 0 : v), 0);
  return (
    <Figure id="D15" label="History suffix lookup">
      <Strip
        values={history.length ? history : ['empty history']}
        identities={history.map((token) => names.indexOf(token))}
      />
      <Table
        headers={['Prefix key', 'Previously observed next IDs']}
        rows={
          result.map.length
            ? result.map.map(([k, v]) => [k || 'empty prefix', v.join(', ')])
            : [['none', 'none']]
        }
      />
      <Strip
        values={[
          `current suffix: ${result.suffix || 'empty'}`,
          `lookup bans: ${result.banned.join(', ') || 'none'}`,
          mass ? `normalize remaining mass ${fmt(mass)}` : 'ERROR: empty support',
        ]}
      />
      <Bars
        p={mass ? p.map((v, i) => (result.banned.includes(names[i]) ? 0 : v / mass)) : null}
        names={names}
        label="Allowed next-token q"
      />
      <Controls
        reset={() => {
          setFixture('repeat');
          setN(2);
        }}
      >
        <Select
          label="History fixture"
          value={fixture}
          onChange={setFixture}
          options={[
            ['repeat', 'New York New'],
            ['empty', 'Empty history'],
            ['unmatched', 'Unmatched suffix'],
            ['all', 'All excluded, unigram'],
          ]}
        />
        <Slider
          label="n-gram length"
          min={1}
          max={2}
          step={1}
          value={actualN}
          onChange={setN}
          disabled={fixture === 'all'}
        />
      </Controls>
      <Readout>
        These labelled tokens have IDs New=0, York=1, City=2. Prompt IDs participate in this
        history. Word boundaries are constructed here; native subword IDs need not follow them.
      </Readout>
    </Figure>
  );
}
export function StopBoundary() {
  const [fixture, setFixture] = useState('cross'),
    [step, setStep] = useState(3),
    [trim, setTrim] = useState('yes');
  const chunks =
    fixture === 'cross'
      ? ['s', 'to', 'pped']
      : fixture === 'old'
        ? ['stop', ' at']
        : fixture === 'eos'
          ? ['hello', 'EOS']
          : ['hello', ' world'];
  const used = chunks.slice(0, Math.min(step, chunks.length)),
    text = used.filter((x) => x !== 'EOS').join('');
  const prev = used.slice(0, -1).join('');
  const match =
    fixture !== 'none' && text.includes('stop') && text.indexOf('stop') + 4 > prev.length;
  const index = text.indexOf('stop');
  const display = trim === 'yes' && match ? text.slice(0, index) : text;
  return (
    <Figure id="D16" label="Token and character stopping boundary">
      <Strip values={used} />
      <Local label="Decoded character positions">
        <div className="decoding-token-row" style={{ minWidth: '28em' }}>
          {Array.from(text).map((c, i) => (
            <span
              key={i}
              className="decoding-token"
              style={{ '--entity': match && i >= index && i < index + 4 ? colours[2] : colours[0] }}
            >
              {c === ' ' ? '␣' : c}
              <small> {i}</small>
            </span>
          ))}
        </div>
      </Local>
      <Table
        headers={['Returned text', 'Displayed text', 'Reason', 'Overhang']}
        rows={[
          [
            JSON.stringify(text),
            JSON.stringify(display),
            used.includes('EOS')
              ? 'EOS'
              : match
                ? 'newly completed stop'
                : fixture === 'cap' && used.length === 2
                  ? 'cap'
                  : 'active',
            match ? JSON.stringify(text.slice(index + 4)) : 'none',
          ],
        ]}
      />
      <Controls
        reset={() => {
          setFixture('cross');
          setStep(3);
          setTrim('yes');
        }}
      >
        <Select
          label="Fixture"
          value={fixture}
          onChange={setFixture}
          options={[
            ['cross', 's | to | pped'],
            ['old', 'Old stop | at'],
            ['eos', 'Genuine EOS'],
            ['cap', 'Generation cap'],
            ['none', 'Empty stop list'],
          ]}
        />
        <Slider
          label="Emitted tokens"
          min={1}
          max={chunks.length}
          step={1}
          value={Math.min(step, chunks.length)}
          onChange={setStep}
        />
        <Select
          label="Trim display before stop"
          value={trim}
          onChange={setTrim}
          options={[
            ['yes', 'Yes'],
            ['no', 'No'],
          ]}
        />
      </Controls>
      <Readout>
        Stop string: {fixture === 'none' ? 'none' : '“stop”'}. A newly completed match must overlap
        the newest token. Trimming changes display only; the complete final token was generated.
      </Readout>
    </Figure>
  );
}
