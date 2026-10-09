import React, { useState } from 'react';
import {
  Figure,
  Controls,
  Select,
  Slider,
  Readout,
  Table,
  Bars,
  Tokens,
  Drawing,
  Wire,
  Box,
  tokenColours,
  targetColour,
  draftColour,
  tokenNames,
  fmt,
  vector,
} from './SpeculativeElements.jsx';
import {
  policies,
  mass,
  threshold,
  firstRejection,
  stopRound,
  conditional,
  terminalLaw,
  roundLaw,
  processed,
} from '../../data/speculative-decoding-models.js';

const presetOptions = [
  ['overlap', 'Overlapping p and q'],
  ['equal', 'Equal distributions'],
  ['disjoint', 'Disjoint supports'],
  ['targetOnly', 'Target-only A'],
];
const Preset = ({ value, onChange }) => (
  <Select label="Probability pair" value={value} onChange={onChange} options={presetOptions} />
);

export function DecoderPaths() {
  const [depth, setDepth] = useState('3');
  return (
    <Figure id="D01" label="Target and draft decoder structure">
      <Drawing
        width={1100}
        height={450}
        label="Six sequential Pythia blocks; separate copied draft and expanded parallel residual block"
      >
        <text x="20" y="25" fontSize="17">
          Same committed token IDs → embedding and positions → sequential blocks → final norm /
          vocabulary head
        </text>
        {[
          ['Target', 6, targetColour, 70],
          ['Draft illustration', Number(depth), draftColour, 150],
        ].map(([name, n, colour, y]) => (
          <g key={name}>
            <text x="20" y={y + 23} fontSize="16" style={{ fill: colour }}>
              {name}
            </text>
            <Box x={190} y={y} w={100} label="embed 128" colour={colour} />
            {Array.from({ length: n }, (_, i) => (
              <g key={i}>
                <Wire x1={290 + i * 91} y1={y + 18} x2={305 + i * 91} y2={y + 18} colour={colour} />
                <Box x={305 + i * 91} y={y} w={76} label={`block ${i + 1}`} colour={colour} />
              </g>
            ))}
            <Wire x1={290 + n * 91} y1={y + 18} x2={882} y2={y + 18} colour={colour} />
            <Box x={890} y={y} w={180} label="norm → shared ID space" colour={colour} />
          </g>
        ))}
        <text x="20" y="225" fontSize="17">
          Inside one target block: parallel residual branches (checkpoint setting)
        </text>
        <Box x={30} y={310} w={100} label="state h" colour={targetColour} />
        <Wire x1={130} y1={328} x2={220} y2={275} />
        <Wire x1={130} y1={328} x2={220} y2={365} />
        <Box x={220} y={255} w={130} label="layer norm 1" />
        <Box x={220} y={345} w={130} label="layer norm 2" />
        <Wire x1={350} y1={273} x2={390} y2={273} />
        <Wire x1={350} y1={363} x2={390} y2={363} />
        <Box x={390} y={255} w={215} label="causal attention · 4 heads" colour={targetColour} />
        <Box x={390} y={345} w={215} label="MLP 128 → 512 → 128" colour={draftColour} />
        <Wire x1={605} y1={273} x2={740} y2={318} />
        <Wire x1={605} y1={363} x2={740} y2={328} />
        <path d="M80 310V242H755V297" fill="none" stroke="#ddd" />
        <text x="650" y="235" fontSize="15">
          residual h
        </text>
        <circle cx="760" cy="325" r="25" fill="#191919" stroke="#ddd" />
        <text x="760" y="332" textAnchor="middle" fontSize="24">
          +
        </text>
        <Wire x1={786} y1={325} x2={900} y2={325} />
        <Box x={905} y={307} w={145} label="next block state" colour={targetColour} />
        <text x="220" y="424" fontSize="15">
          Both branches read the same incoming state. Their outputs and the residual are summed.
        </text>
      </Drawing>
      <Readout>
        Native target: six blocks; actual native draft: three. This depth control only illustrates
        architecture.{' '}
        {depth === '6'
          ? 'Equal depth removes the assumed block-count saving.'
          : 'Fewer blocks change the proposal distribution; no speed measurement is assigned to this edit.'}
      </Readout>
      <Controls reset={() => setDepth('3')}>
        <Select
          label="Illustrated draft depth"
          value={depth}
          onChange={setDepth}
          options={['1', '3', '6'].map((x) => [x, `${x} blocks`])}
        />
      </Controls>
    </Figure>
  );
}
export function PolicyProposal() {
  const [preset, setPreset] = useState('overlap');
  const values = mass(policies[preset].p, policies[preset].q);
  return (
    <Figure id="D02" label="Desired target and draft proposal">
      <div className="speculative-columns">
        <Bars label="Target p · desired output law" values={values.p} />
        <Bars label="Draft q · proposal law" values={values.q} />
      </div>
      <Readout>
        Shared probability mass = {fmt(values.overlap)}. Returning q directly{' '}
        {preset === 'equal'
          ? 'agrees with p in this equal-law case.'
          : 'would change the desired output law.'}
      </Readout>
      <Controls reset={() => setPreset('overlap')}>
        <Preset value={preset} onChange={setPreset} />
      </Controls>
    </Figure>
  );
}
export function VerificationMatrix() {
  const [k, setK] = useState(3),
    [row, setRow] = useState(1);
  const selected = Math.min(row, k);
  return (
    <Figure id="D03" label="Causal verification matrix">
      <Drawing
        width={820}
        height={390}
        label="Each query can read only its actual prefix and itself"
      >
        <text x="190" y="24" fontSize="16">
          Absolute key positions
        </text>
        {Array.from({ length: 8 }, (_, j) => (
          <text key={j} x={220 + j * 64} y="53" textAnchor="middle" fontSize="15">
            {j}
          </text>
        ))}
        {Array.from({ length: k + 1 }, (_, i) => (
          <g key={i}>
            <text x="15" y={94 + i * 62} fontSize="15">
              {i === 0 ? 'prefix tail, pos 4' : `candidate ${i}, pos ${4 + i}`}
            </text>
            {Array.from({ length: 8 }, (_, j) => (
              <g key={j}>
                <rect
                  x={193 + j * 64}
                  y={70 + i * 62}
                  width="54"
                  height="44"
                  fill={j <= 4 + i ? targetColour : '#191919'}
                  fillOpacity={j <= 4 + i ? 0.25 : 1}
                  stroke={i === selected ? '#fff' : '#666'}
                  strokeWidth={i === selected ? 2 : 1}
                />
                <text x={220 + j * 64} y={98 + i * 62} textAnchor="middle" fontSize="14">
                  {j <= 4 + i ? 'read' : '×'}
                </text>
              </g>
            ))}
          </g>
        ))}
        <text x="20" y="355" fontSize="16">
          Selected row {4 + selected}: legal keys 0–{4 + selected}; later positions are masked.
        </text>
      </Drawing>
      <Readout>
        {k} known candidate IDs supply {k + 1} score rows including the saved prefix-tail score.{' '}
        {k === 0
          ? 'No candidates: one ordinary target choice remains.'
          : 'The candidate chunk groups target computation; every candidate position still does work.'}
      </Readout>
      <Controls
        reset={() => {
          setK(3);
          setRow(1);
        }}
      >
        <Slider label="Candidate count K" value={k} min={0} max={3} step={1} onChange={setK} />
        <Slider
          label="Selected score row"
          value={selected}
          min={0}
          max={k}
          step={1}
          onChange={setRow}
          disabled={k === 0}
        />
      </Controls>
    </Figure>
  );
}
export function ShiftedScores() {
  const [prefix, setPrefix] = useState(5);
  return (
    <Figure id="D04" label="Input and next-token score alignment">
      <Drawing
        width={860}
        height={265}
        label="Each processed input row predicts the next absolute position"
      >
        <text x="20" y="30" fontSize="16">
          Processed input
        </text>
        <text x="20" y="166" fontSize="16">
          Score predicts
        </text>
        {Array.from({ length: 4 }, (_, i) => (
          <g key={i}>
            <Box
              x={210 + i * 150}
              y={15}
              w={130}
              label={i === 0 ? (prefix ? 'prefix tail' : 'no context') : `candidate ${i}`}
              colour={i === 0 ? targetColour : tokenColours[(i - 1) % 3]}
            />
            <text x={275 + i * 150} y="78" textAnchor="middle" fontSize="15">
              {prefix ? `position ${prefix - 1 + i}` : 'context required'}
            </text>
            <Wire
              x1={275 + i * 150}
              y1={88}
              x2={275 + i * 150}
              y2={133}
              colour={prefix ? targetColour : '#777'}
              dashed={!prefix}
            />
            <Box
              x={210 + i * 150}
              y={145}
              w={130}
              label={prefix ? (i === 3 ? 'bonus' : 'candidate ' + (i + 1)) : 'unavailable'}
              colour={targetColour}
            />
            <text x={275 + i * 150} y="211" textAnchor="middle" fontSize="15">
              {prefix ? `position ${prefix + i}` : 'provide BOS/prefix'}
            </text>
          </g>
        ))}
      </Drawing>
      <Readout>
        {prefix
          ? `Candidate 1 is tested by input row ${prefix - 1}, before that candidate is fed. The last candidate row scores the bonus.`
          : 'No score exists before a supplied context. Provide a nonempty prompt or explicit beginning-of-sequence input.'}
      </Readout>
      <Controls reset={() => setPrefix(5)}>
        <Slider
          label="Computed prefix length"
          value={prefix}
          min={0}
          max={8}
          step={1}
          onChange={setPrefix}
        />
      </Controls>
    </Figure>
  );
}
export function RejectionTrace() {
  const [u, setU] = useState(0.6);
  const result = firstRejection(u);
  return (
    <Figure id="D05" label="First rejection and discarded suffix">
      <p>Draft path: B → A → C. Fixed first/third acceptance uniforms: 0.2 and 0.1.</p>
      <Tokens
        ids={[1, 0, 2]}
        states={result.rows.map((r) =>
          !r.tested ? 'discarded' : r.accepted ? 'accepted' : 'rejected',
        )}
      />
      <Table
        headers={['Position', 'q(proposed)', 'p(proposed)', 'Threshold', 'Uniform', 'Action']}
        rows={result.rows.map((r, i) => [
          i + 1,
          fmt(r.q),
          fmt(r.p),
          fmt(r.alpha),
          fmt(r.uniform),
          !r.tested ? 'discard without testing' : r.accepted ? 'accept' : 'first rejection',
        ])}
      />
      <Drawing width={720} height={135} label="Commit an accepted prefix and one repair or bonus">
        <Box x={15} y={35} w={180} label="accepted prefix" colour={targetColour} />
        <Wire x1={195} y1={53} x2={280} y2={53} />
        <Box x={285} y={35} w={190} label={result.ending} colour={tokenColours[2]} />
        <Wire x1={475} y1={53} x2={530} y2={53} />
        <text x="540" y="60" fontSize="16">
          commit outputs
        </text>
        <text x="20" y="115" fontSize="15">
          Repair uses r = (0, 2/3, 1/3), repair uniform 0.8 → C; bonus choice is fixed C.
        </text>
      </Drawing>
      <Tokens ids={result.emitted} />
      <Readout>
        {result.acceptanceDraws} acceptance draws consumed.{' '}
        {result.rejectedAt < 0
          ? 'All proposals accepted; take the target-only bonus.'
          : `Stop at candidate ${result.rejectedAt + 1}; later proposal context is invalid.`}{' '}
        Equality u = 0.4 rejects under the strict rule.
      </Readout>
      <Controls reset={() => setU(0.6)}>
        <Slider
          label="Second acceptance uniform"
          value={u}
          min={0}
          max={0.99}
          step={0.01}
          onChange={setU}
        />
      </Controls>
    </Figure>
  );
}
export function BonusAndStop() {
  const [mode, setMode] = useState('bonus'),
    [budget, setBudget] = useState('4');
  const result = stopRound(mode, Number(budget));
  return (
    <Figure id="D06" label="Bonus, EOS and output budget">
      <p>Drafted candidates</p>
      <Tokens
        ids={result.candidates}
        names={['A', 'B', 'EOS']}
        states={result.candidates.map((_, i) => (i < result.accepted ? 'accepted' : 'discarded'))}
      />
      <Drawing width={700} height={120} label="Acceptance chooses the repair or bonus branch">
        <Box x={10} y={30} w={190} label={`${result.accepted} accepted`} colour={targetColour} />
        <Wire x1={200} y1={48} x2={285} y2={48} />
        <Box
          x={290}
          y={30}
          w={220}
          label={result.end}
          colour={result.end.includes('EOS') ? tokenColours[2] : targetColour}
        />
        <text x="540" y="56" fontSize="17">
          {result.end.includes('EOS') ? 'STOP' : 'emit'}
        </text>
      </Drawing>
      <p>Emitted outputs</p>
      <Tokens ids={result.emitted} names={['A', 'B', 'EOS']} />
      <Table
        headers={['Proposed', 'Accepted', 'Emitted', 'Target score rows', 'Remaining budget']}
        rows={[
          [result.proposed, result.accepted, result.emitted.length, result.targetScoreRows, budget],
        ]}
      />
      <Readout>
        The scratch convention reserves one slot for repair/bonus.{' '}
        {Number(budget) === 1
          ? 'No candidate is drafted; the selected stop scenario is inactive.'
          : 'EOS ends the round immediately; no bonus follows an accepted or repaired EOS.'}
      </Readout>
      <Controls
        reset={() => {
          setMode('bonus');
          setBudget('4');
        }}
      >
        <Select
          label="Stop scenario"
          value={mode}
          onChange={setMode}
          disabled={budget === '1'}
          options={[
            ['bonus', 'All accepted + bonus'],
            ['acceptedEos', 'Accepted EOS'],
            ['repairEos', 'Repaired EOS'],
          ]}
        />
        <Select
          label="Remaining output budget"
          value={budget}
          onChange={setBudget}
          options={['1', '2', '4'].map((x) => [x, x])}
        />
      </Controls>
    </Figure>
  );
}

export function SharedMass() {
  const [preset, setPreset] = useState('overlap');
  const m = mass(policies[preset].p, policies[preset].q);
  return (
    <Figure id="D07" label="Common, excess and missing probability">
      <Drawing
        width={820}
        height={345}
        label="Per-token draft and target columns show shared and unmatched probability mass"
      >
        <text x="20" y="23" fontSize="16">
          Probability mass · common base; dashed top is unmatched
        </text>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1="65" y1={285 - 220 * v} x2="770" y2={285 - 220 * v} stroke="#333" />
            <text x="52" y={290 - 220 * v} fontSize="14" textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {m.p.map((_, i) => (
          <g key={i}>
            {[
              ['q', m.q[i], m.excess[i]],
              ['p', m.p[i], m.deficit[i]],
            ].map(([name, total, extra], j) => (
              <g key={name}>
                <rect
                  x={120 + i * 215 + j * 78}
                  y={285 - m.common[i] * 220}
                  width="58"
                  height={m.common[i] * 220}
                  fill={tokenColours[i]}
                  fillOpacity=".6"
                />
                <rect
                  x={120 + i * 215 + j * 78}
                  y={285 - total * 220}
                  width="58"
                  height={extra * 220}
                  fill="none"
                  stroke={tokenColours[i]}
                  strokeWidth="2"
                  strokeDasharray="5 3"
                />
                <text
                  x={149 + i * 215 + j * 78}
                  y={272 - total * 220}
                  textAnchor="middle"
                  fontSize="15"
                >
                  {fmt(total)}
                </text>
                <text
                  x={149 + i * 215 + j * 78}
                  y="313"
                  textAnchor="middle"
                  fontSize="16"
                  style={{ fill: tokenColours[i] }}
                >
                  {name}({tokenNames[i]})
                </text>
              </g>
            ))}
          </g>
        ))}
      </Drawing>
      <Table
        headers={['Token', 'Common min(p,q)', 'q-only rejected', 'p-only deficit']}
        rows={tokenNames.map((n, i) => [n, fmt(m.common[i]), fmt(m.excess[i]), fmt(m.deficit[i])])}
      />
      <Readout>
        Kept {fmt(m.overlap)} + rejected {fmt(m.rejected)} = 1. The deficit total is also{' '}
        {fmt(m.rejected)}.
      </Readout>
      <Controls reset={() => setPreset('overlap')}>
        <Preset value={preset} onChange={setPreset} />
      </Controls>
    </Figure>
  );
}
export function AcceptanceInterval() {
  const [preset, setPreset] = useState('overlap'),
    [id, setId] = useState('0'),
    [u, setU] = useState(0.3);
  const { p, q } = policies[preset],
    a = threshold(p, q, Number(id));
  return (
    <Figure id="D08" label="Uniform acceptance interval">
      <Drawing
        width={740}
        height={180}
        label="Unit acceptance interval, strict boundary and current uniform"
      >
        <text x="20" y="25" fontSize="16">
          Proposed {tokenNames[id]}: p = {fmt(p[id])}; q = {fmt(q[id])}
        </text>
        <rect x="60" y="65" width="600" height="40" fill="#222" stroke="#aaa" />
        {a !== null && (
          <>
            <rect
              x="60"
              y="65"
              width={600 * a}
              height="40"
              fill={tokenColours[id]}
              fillOpacity=".6"
            />
            <line x1={60 + 600 * a} y1="55" x2={60 + 600 * a} y2="115" stroke="#fff" />
            <text
              x={Math.min(595, Math.max(105, 60 + 600 * a))}
              y="45"
              textAnchor="middle"
              fontSize="15"
            >
              a = {fmt(a)}
            </text>
            <path d={`M${60 + 600 * u} 145v-10`} stroke="#fff" strokeWidth="3" />
            <text
              x={Math.min(620, Math.max(95, 60 + 600 * u))}
              y="163"
              textAnchor="middle"
              fontSize="15"
            >
              u = {fmt(u)}
            </text>
          </>
        )}
        <text x="53" y="128" fontSize="15">
          0
        </text>
        <text x="658" y="128" fontSize="15">
          1
        </text>
      </Drawing>
      <Readout>
        {a === null
          ? 'Unavailable proposal: q is zero, so a valid categorical sampler cannot propose this ID.'
          : u < a
            ? 'Accept: u is strictly below the threshold.'
            : 'Reject: u is at or above the threshold.'}{' '}
        {a === 0 ? 'Even u = 0 rejects.' : ''}
      </Readout>
      <Controls
        reset={() => {
          setPreset('overlap');
          setId('0');
          setU(0.3);
        }}
      >
        <Preset value={preset} onChange={setPreset} />
        <Select
          label="Proposed token"
          value={id}
          onChange={setId}
          options={tokenNames.map((n, i) => [String(i), n])}
        />
        <Slider
          label="Acceptance uniform"
          value={u}
          max={0.99}
          onChange={setU}
          disabled={a === null}
        />
      </Controls>
    </Figure>
  );
}
export function ResidualRouting() {
  const [preset, setPreset] = useState('overlap');
  const m = mass(policies[preset].p, policies[preset].q);
  return (
    <Figure id="D09" label="Route rejected mass into target deficits">
      <Drawing
        width={840}
        height={300}
        label="Rejected event branches into each positive deficit, then normalizes"
      >
        <Box
          x={20}
          y={117}
          w={175}
          h={55}
          label={`rejected ${fmt(m.rejected)}`}
          colour={draftColour}
        />
        {m.deficit.map((v, i) => (
          <g key={i}>
            <Wire
              x1={195}
              y1={144}
              x2={355}
              y2={60 + i * 86}
              colour={tokenColours[i]}
              dashed={v === 0}
            />
            <Box
              x={360}
              y={42 + i * 86}
              w={185}
              label={`${tokenNames[i]} deficit ${fmt(v)}`}
              colour={tokenColours[i]}
            />
            <Wire
              x1={545}
              y1={60 + i * 86}
              x2={620}
              y2={60 + i * 86}
              colour={tokenColours[i]}
              dashed={m.repair === null}
            />
            <text x="635" y={65 + i * 86} fontSize="16">
              {m.repair ? `r = ${fmt(m.repair[i])}` : 'unreachable'}
            </text>
          </g>
        ))}
      </Drawing>
      <Readout>
        {m.repair
          ? `Conditional repair r = ${vector(m.repair)}. Multiplying by rejection mass ${fmt(m.rejected)} returns the unconditional deficits.`
          : 'p = q: no rejection can occur. The zero-denominator residual is an unreachable branch, not a uniform distribution.'}
      </Readout>
      <Controls reset={() => setPreset('overlap')}>
        <Preset value={preset} onChange={setPreset} />
      </Controls>
    </Figure>
  );
}
export function MassRecovery() {
  const [preset, setPreset] = useState('overlap'),
    [selected, setSelected] = useState('1');
  const m = mass(policies[preset].p, policies[preset].q);
  return (
    <Figure id="D10" label="Accepted and repaired mass recover the target">
      <Drawing
        width={800}
        height={280}
        label="Stacked unconditional masses share a probability axis"
      >
        <text x="130" y="25" fontSize="16">
          Solid: accepted mass · outline: repaired mass · sum = target p
        </text>
        {tokenNames.map((n, i) => (
          <g key={i}>
            <text x="25" y={78 + i * 65} fontSize="18" style={{ fill: tokenColours[i] }}>
              {n}
            </text>
            <rect
              x="90"
              y={55 + i * 65}
              width={560 * m.common[i]}
              height="32"
              fill={tokenColours[i]}
              fillOpacity=".65"
            />
            <rect
              x={90 + 560 * m.common[i]}
              y={55 + i * 65}
              width={560 * m.deficit[i]}
              height="32"
              fill="none"
              stroke={tokenColours[i]}
              strokeWidth="2"
            />
            <text x="670" y={78 + i * 65} fontSize="16">
              p = {fmt(m.p[i])}
            </text>
            {Number(selected) === i && (
              <rect x="15" y={47 + i * 65} width="770" height="49" fill="none" stroke="#fff" />
            )}
          </g>
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <text key={v} x={90 + 560 * v} y="265" fontSize="14" textAnchor="middle">
            {v}
          </text>
        ))}
      </Drawing>
      <Readout>
        {tokenNames[selected]}: accepted {fmt(m.common[selected])} + unconditional repaired{' '}
        {fmt(m.deficit[selected])} = target {fmt(m.p[selected])}. The proof includes target-only
        support.
      </Readout>
      <Controls
        reset={() => {
          setPreset('overlap');
          setSelected('1');
        }}
      >
        <Preset value={preset} onChange={setPreset} />
        <Select
          label="Track token"
          value={selected}
          onChange={setSelected}
          options={tokenNames.map((n, i) => [String(i), n])}
        />
      </Controls>
    </Figure>
  );
}
export function PrefixFork() {
  const [depth, setDepth] = useState('1');
  const rejected = Number(depth) < 3;
  return (
    <Figure id="D11" label="Rejection changes the subsequent conditional prefix">
      <Drawing
        width={840}
        height={300}
        label="Old draft continuation and repaired branch remain visibly distinct"
      >
        <Box x={20} y={125} w={180} label={`committed h + ${depth} kept`} colour={targetColour} />
        <Wire x1={200} y1={143} x2={330} y2={70} colour={tokenColours[1]} />
        <Box x={335} y={50} w={120} label="proposal B" colour={tokenColours[1]} dashed={rejected} />
        <Wire x1={455} y1={68} x2={570} y2={68} colour={draftColour} dashed={rejected} />
        <Box
          x={575}
          y={50}
          w={220}
          label="old A: q(A | h, B)"
          colour={tokenColours[0]}
          dashed={rejected}
        />
        <text x="335" y="115" fontSize="16">
          {rejected ? 'Rejected history: discard later A' : 'No rejection: this path remains valid'}
        </text>
        {rejected && (
          <>
            <Wire x1={200} y1={143} x2={330} y2={222} colour={tokenColours[2]} />
            <Box x={335} y={203} w={120} label="repair C" colour={tokenColours[2]} />
            <Wire x1={455} y1={221} x2={570} y2={221} colour={targetColour} />
            <Box x={575} y={203} w={220} label="new q(· | h, C)" colour={targetColour} />
            <text x="335" y="270" fontSize="16">
              Recompute from C; the old A probability belongs to B.
            </text>
          </>
        )}
      </Drawing>
      <Readout>
        {rejected
          ? `After ${depth} accepted candidates, the next proposal fails. A later score must be conditioned on the repaired branch.`
          : 'All three candidates pass; no history fork is introduced. The target may supply a bonus.'}
      </Readout>
      <Controls reset={() => setDepth('1')}>
        <Select
          label="Accepted before rejection"
          value={depth}
          onChange={setDepth}
          options={[
            ['0', '0 kept'],
            ['1', '1 kept'],
            ['2', '2 kept'],
            ['3', 'All 3 accepted'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function SequenceLaw() {
  const [k, setK] = useState('2'),
    [chosen, setChosen] = useState('0,1,2');
  const baseline = terminalLaw(),
    actual = terminalLaw(Number(k));
  const row = actual.find((r) => r.ids.join(',') === chosen);
  const prefixes = chosen.split(',').map(Number),
    contexts = prefixes.map((id, i) => ({ id, p: conditional(prefixes.slice(0, i))[id] }));
  const contributions = [];
  const firstRound = [...roundLaw([], 3, Number(k), contributions)].filter(([suffix]) =>
    chosen.startsWith(suffix),
  );
  const contributing = contributions
    .filter((r) => r.ids.every((id, i) => prefixes[i] === id))
    .map((r) => {
      const continuation = prefixes
        .slice(r.ids.length)
        .reduce((value, id, i) => value * conditional(prefixes.slice(0, r.ids.length + i))[id], 1);
      return { ...r, continuation, terminalMass: r.probability * continuation };
    });
  return (
    <Figure id="D12" label="Complete finite terminal sequence law">
      <Drawing
        width={810}
        height={225}
        label="Selected terminal path multiplies actual context probabilities"
      >
        <Box x={10} y={75} w={100} label="prefix ∅" />
        {contexts.map((c, i) => (
          <g key={i}>
            <Wire
              x1={110 + i * 220}
              y1={93}
              x2={185 + i * 220}
              y2={93}
              colour={tokenColours[c.id]}
            />
            <text x={145 + i * 220} y="62" fontSize="15" textAnchor="middle">
              p = {fmt(c.p)}
            </text>
            <Box
              x={190 + i * 220}
              y={75}
              w={140}
              label={['A', 'B', 'EOS'][c.id]}
              colour={tokenColours[c.id]}
            />
          </g>
        ))}
        <text x="20" y="173" fontSize="16">
          Terminal mass: {contexts.map((c) => fmt(c.p)).join(' × ')} = {fmt(row?.probability)}
        </text>
        <text x="20" y="207" fontSize="15">
          EOS ends a path immediately. All other paths stop at three outputs.
        </text>
      </Drawing>
      <Table
        headers={['Terminal IDs', 'Direct target', 'Speculative', 'Difference']}
        rows={actual.map((r, i) => [
          r.ids.map((id) => ['A', 'B', 'EOS'][id]).join(' → '),
          fmt(baseline[i].probability),
          fmt(r.probability),
          fmt(r.probability - baseline[i].probability),
        ])}
      />
      <Readout>
        Current K = {k}; all 15 terminal paths are displayed. Browser arithmetic is floating point;
        the complete Python program enumerates exact fractions. Compatible first-round emissions for
        this path:{' '}
        {firstRound
          .map(
            ([s, p]) =>
              `${s
                .split(',')
                .map((i) => ['A', 'B', 'EOS'][i])
                .join('→')} (${fmt(p)})`,
          )
          .join('; ')}
        .
      </Readout>
      <Table
        label="Every first-round event contributing to the selected terminal path"
        headers={[
          'Proposed IDs',
          'Proposal probability',
          'Acceptance / repair event',
          'Round emission',
          'Round mass',
          'Target continuation',
          'Terminal contribution',
        ]}
        rows={contributing.map((r) => [
          r.proposal.map((i) => ['A', 'B', 'EOS'][i]).join(' → ') || 'none',
          fmt(r.proposalMass),
          r.event,
          r.ids.map((i) => ['A', 'B', 'EOS'][i]).join(' → '),
          fmt(r.probability),
          fmt(r.continuation),
          fmt(r.terminalMass),
        ])}
      />
      <Readout>
        Each row multiplies its round-event mass by the remaining target conditional probabilities.
        Their sum is {fmt(contributing.reduce((sum, r) => sum + r.terminalMass, 0))}. Later rounds
        preserve those same conditionals.
      </Readout>
      <Table
        label="Separate deliberately stale-history witness, horizon two"
        headers={['Path', 'Correct mass', 'Wrong stale-target mass']}
        rows={[
          ['A A', 0.1, 0.16],
          ['A B', 0.25, 0.13],
          ['A EOS', 0.15, 0.21],
        ]}
      />
      <Controls
        reset={() => {
          setK('2');
          setChosen('0,1,2');
        }}
      >
        <Select
          label="Lookahead K"
          value={k}
          onChange={setK}
          options={['0', '1', '2'].map((x) => [x, x])}
        />
        <Select
          label="Trace terminal path"
          value={chosen}
          onChange={setChosen}
          options={actual.map((r) => [
            r.ids.join(','),
            r.ids.map((id) => ['A', 'B', 'EOS'][id]).join(' → '),
          ])}
        />
      </Controls>
    </Figure>
  );
}
export function SupportCases() {
  const [choice, setChoice] = useState('targetOnly');
  const invalid = choice === 'invalid';
  const pair = invalid ? null : policies[choice];
  return (
    <Figure id="D13" label="Target and proposal support">
      <Drawing
        width={760}
        height={250}
        label="Support membership separates proposal acceptance and repair"
      >
        <rect
          x="50"
          y="50"
          width="300"
          height="135"
          rx="55"
          fill="none"
          stroke={targetColour}
          strokeWidth="2"
        />
        <rect
          x="260"
          y="50"
          width="300"
          height="135"
          rx="55"
          fill="none"
          stroke={draftColour}
          strokeWidth="2"
        />
        <text x="80" y="30" fontSize="17" style={{ fill: targetColour }}>
          target support p &gt; 0
        </text>
        <text x="385" y="30" fontSize="17" style={{ fill: draftColour }}>
          proposal q &gt; 0
        </text>
        {pair &&
          tokenNames.map((n, i) => {
            const x =
              pair.p[i] > 0 && pair.q[i] > 0
                ? 305
                : pair.p[i] > 0
                  ? 160
                  : pair.q[i] > 0
                    ? 440
                    : 650;
            return (
              <text key={i} x={x} y={92 + i * 31} fontSize="20" style={{ fill: tokenColours[i] }}>
                {n}
              </text>
            );
          })}
        <text x="610" y="190" fontSize="15">
          absent from both
        </text>
        <text x="35" y="228" fontSize="15">
          p-only → repair · q-only → reject · common → accept some/all · absent → no mass
        </text>
      </Drawing>
      {invalid ? (
        <Readout role="alert">
          Invalid all-zero rows: no probability distribution exists. Normalization is refused.
        </Readout>
      ) : (
        <Table
          headers={['Token', 'p', 'q', 'Role']}
          rows={tokenNames.map((n, i) => [
            n,
            pair.p[i],
            pair.q[i],
            pair.p[i] && pair.q[i]
              ? 'common'
              : pair.p[i]
                ? 'target only'
                : pair.q[i]
                  ? 'proposal only'
                  : 'absent',
          ])}
        />
      )}
      <Controls reset={() => setChoice('targetOnly')}>
        <Select
          label="Support case"
          value={choice}
          onChange={setChoice}
          options={[...presetOptions, ['invalid', 'Invalid all-zero rows']]}
        />
      </Controls>
    </Figure>
  );
}
export function ProcessedPolicy() {
  const [temperature, setTemperature] = useState('1'),
    [cut, setCut] = useState('2');
  const p = processed([6, 3, 1], Number(temperature), Number(cut)),
    q = [0.2, 0.3, 0.5],
    correct = mass(p, q);
  const stale = [0.6, 0.3, 0.1];
  const accepted = q.map((v, i) => v * Math.min(1, p[i] / stale[i]));
  const reject = 1 - accepted.reduce((a, b) => a + b, 0);
  const wrongRepair = mass(p, stale).repair;
  const wrong = wrongRepair ? accepted.map((v, i) => v + reject * wrongRepair[i]) : accepted;
  return (
    <Figure id="D14" label="Use actual processed probability rows">
      <Drawing
        width={820}
        height={175}
        label="Raw scores become declared sampling probabilities before verification"
      >
        <Box x={10} y={50} w={155} label="log 6, log 3, log 1" />
        <Wire x1={165} y1={68} x2={220} y2={68} />
        <Box x={225} y={50} w={140} label={`temperature ${temperature}`} />
        <Wire x1={365} y1={68} x2={420} y2={68} />
        <Box x={425} y={50} w={135} label={`keep top ${cut}`} />
        <Wire x1={560} y1={68} x2={610} y2={68} />
        <Box x={615} y={50} w={180} label="normalize → target p" colour={targetColour} />
        <text x="20" y="133" fontSize="15">
          Draft actually samples q = (0.2, 0.3, 0.5); the ratio must use that exact row.
        </text>
      </Drawing>
      <div className="speculative-columns">
        <Bars label="Processed desired p" values={p} />
        <Bars label="Correct repaired output law" values={correct.final} />
      </div>
      <Table
        headers={['Token', 'Actual q', 'Wrong stale q', 'Wrong output mass']}
        rows={tokenNames.map((n, i) => [n, q[i], stale[i], fmt(wrong[i])])}
      />
      <Readout>
        Correct repair r = {vector(correct.repair)}. The wrong branch divides by stale q and
        constructs its residual from that same wrong row while proposals actually follow q; total
        variation error = {fmt(wrong.reduce((sum, v, i) => sum + Math.abs(v - p[i]), 0) / 2)}.
      </Readout>
      <Controls
        reset={() => {
          setTemperature('1');
          setCut('2');
        }}
      >
        <Select
          label="Target temperature"
          value={temperature}
          onChange={setTemperature}
          options={[
            ['.5', '0.5'],
            ['1', '1'],
            ['2', '2'],
          ]}
        />
        <Select
          label="Target top-k"
          value={cut}
          onChange={setCut}
          options={['1', '2', '3'].map((x) => [x, x])}
        />
      </Controls>
    </Figure>
  );
}
