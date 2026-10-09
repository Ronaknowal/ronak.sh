import React, { useState } from 'react';
import {
  Figure,
  Controls,
  Select,
  Slider,
  Readout,
  Table,
  Tokens,
  Drawing,
  Wire,
  Box,
  tokenColours,
  targetColour,
  draftColour,
  fmt,
} from './SpeculativeElements.jsx';
import { lengthModel, costModel } from '../../data/speculative-decoding-models.js';

export function RollbackGrid() {
  const [keep, setKeep] = useState(1),
    [poison, setPoison] = useState('123');
  const length = 5 + keep;
  return (
    <Figure id="D15" label="Logical cache rollback across layers and heads">
      <Drawing
        width={900}
        height={365}
        label="Constructed K/V backing values and a separately marked logical visibility boundary"
      >
        <text x="190" y="24" fontSize="16">
          Absolute token position
        </text>
        {Array.from({ length: 8 }, (_, p) => (
          <text key={p} x={222 + p * 78} y="50" textAnchor="middle" fontSize="15">
            {p}
          </text>
        ))}
        {Array.from({ length: 4 }, (_, r) => (
          <g key={r}>
            <text x="10" y={92 + r * 60} fontSize="15">
              layer {Math.floor(r / 2)}, head {r % 2}
            </text>
            {Array.from({ length: 8 }, (_, p) => (
              <g key={p}>
                <rect
                  x={188 + p * 78}
                  y={65 + r * 60}
                  width="68"
                  height="48"
                  fill={p < 5 ? '#252525' : p < length ? '#213334' : '#191919'}
                  stroke={p < 5 ? '#aaa' : tokenColours[(p - 5) % 3]}
                  strokeDasharray={p >= length ? '5 3' : undefined}
                />
                <text x={222 + p * 78} y={85 + r * 60} textAnchor="middle" fontSize="13">
                  K:{p < length ? r * 100 + p : poison}
                </text>
                <text x={222 + p * 78} y={104 + r * 60} textAnchor="middle" fontSize="13">
                  V:{p < length ? -(r * 100 + p) : '-77'}
                </text>
              </g>
            ))}
          </g>
        ))}
        <line
          x1={183 + length * 78}
          y1="53"
          x2={183 + length * 78}
          y2="306"
          stroke="#fff"
          strokeWidth="3"
        />
        <text x="20" y="337" fontSize="16">
          Visible positions 0–{length - 1}. Dashed suffix bytes exist but attention must not read
          them.
        </text>
      </Drawing>
      <Readout>
        Computed length = {length}. {3 - keep} speculative rows are logically discarded. K/V numbers
        here are constructed address markers; the recorded neural poison test follows in section 8.
      </Readout>
      <Controls
        reset={() => {
          setKeep(1);
          setPoison('123');
        }}
      >
        <Slider
          label="Accepted candidate rows"
          value={keep}
          min={0}
          max={3}
          step={1}
          onChange={setKeep}
        />
        <Select
          label="Unused key poison"
          value={poison}
          onChange={setPoison}
          disabled={keep === 3}
          options={[
            ['123', '123'],
            ['999', '999'],
            ['-321', '−321'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function PendingToken() {
  const [stage, setStage] = useState('2'),
    [mode, setMode] = useState('repair');
  const n = Number(stage),
    refused = mode === 'capacity' && n > 0;
  const computed = refused ? 5 : [5, 8, 6, 7][n],
    committed = refused ? 5 : [5, 5, 7, 7][n];
  return (
    <Figure id="D16" label="Committed output versus computed cache state">
      <Drawing
        width={910}
        height={335}
        label="Both scratch caches crop before the pending repair is processed"
      >
        {['Committed IDs', 'Target cache', 'Draft cache'].map((label, r) => (
          <g key={label}>
            <text
              x="15"
              y={80 + r * 78}
              fontSize="16"
              style={{ fill: r === 1 ? targetColour : r === 2 ? draftColour : '#ddd' }}
            >
              {label}
            </text>
            {Array.from({ length: 8 }, (_, p) => {
              const filled = r === 0 ? p < committed : p < computed;
              const pending = r === 0 && p === 6 && n === 2 && !refused;
              const identity =
                p < 5 ? '#aaa' : tokenColours[p === 5 ? 0 : p === 6 && n === 1 && r > 0 ? 1 : 2];
              return (
                <g key={p}>
                  <rect
                    x={210 + p * 80}
                    y={50 + r * 78}
                    width="65"
                    height="50"
                    fill="#191919"
                    stroke={filled ? identity : '#555'}
                    strokeDasharray={pending || !filled ? '4 3' : undefined}
                  />
                  <text
                    x={242 + p * 80}
                    y={74 + r * 78}
                    textAnchor="middle"
                    fontSize="16"
                    style={{ fill: filled ? identity : '#ccc' }}
                  >
                    {filled
                      ? p < 5
                        ? `h${p}`
                        : p === 5
                          ? 'A'
                          : p === 6
                            ? n === 1 && r > 0
                              ? 'B'
                              : mode === 'eos'
                                ? 'EOS'
                                : 'C'
                            : 'draft C'
                      : '—'}
                  </text>
                  <text x={242 + p * 80} y={94 + r * 78} textAnchor="middle" fontSize="12">
                    pos {p}
                  </text>
                </g>
              );
            })}
          </g>
        ))}
        <text x="20" y="319" fontSize="16">
          Committed length {committed}; each computed cache length {computed}.
        </text>
      </Drawing>
      <Readout>
        {refused
          ? 'Capacity 5 cannot hold candidate positions through 7. Refuse before any layer writes; both caches remain at length 5.'
          : n === 0
            ? 'Start with five committed, computed positions.'
            : n === 1
              ? 'Both scratch caches computed all three candidate positions; no candidate is committed yet.'
              : n === 2
                ? mode === 'eos'
                  ? 'The selected repair EOS is committed and generation stops. Its K/V stays uncomputed.'
                  : 'One candidate passes; repair C is committed at position 6 but pending. Both caches crop to length 6.'
                : 'Append precisely repair C into both caches. Its new K/V now agrees with the committed history.'}
      </Readout>
      <Controls
        reset={() => {
          setStage('2');
          setMode('repair');
        }}
      >
        <Select
          label="Round condition"
          value={mode}
          onChange={(v) => {
            setMode(v);
            if (v === 'eos' && stage === '3') setStage('2');
          }}
          options={[
            ['repair', 'Continuing repair'],
            ['eos', 'Terminal repair EOS'],
            ['capacity', 'Insufficient capacity'],
          ]}
        />
        <Select
          label="Current operation"
          value={stage}
          onChange={setStage}
          options={[
            ['0', 'Before drafting'],
            ['1', 'After candidate forwards'],
            ['2', 'After commit and crop'],
            ...(mode === 'eos' ? [] : [['3', 'After pending-token append']]),
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function ScratchAnatomy() {
  const [layer, setLayer] = useState('1'),
    [head, setHead] = useState('0');
  return (
    <Figure id="D17" label="Actual TinyLM scratch architecture">
      <Drawing
        width={1040}
        height={480}
        label="Three sequential TinyLM blocks with sequential residual operations and per-layer K/V arrays"
      >
        <Box x={20} y={40} w={190} label="token + learned position" colour={targetColour} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <Wire x1={210 + i * 190} y1={58} x2={245 + i * 190} y2={58} />
            <Box
              x={250 + i * 190}
              y={40}
              w={145}
              label={`block ${i}`}
              colour={targetColour}
              selected={String(i) === layer}
            />
            <Wire x1={322 + i * 190} y1={77} x2={322 + i * 190} y2={120} />
            <Box
              x={250 + i * 190}
              y={126}
              w={145}
              label={`K/V layer ${i}`}
              colour={tokenColours[i]}
            />
          </g>
        ))}
        <Wire x1={790} y1={58} x2={835} y2={58} />
        <Box x={840} y={40} w={180} label="norm → 17 logits" colour={targetColour} />
        <text x="20" y="205" fontSize="17">
          Expanded block {layer}: width 16, four heads, MLP width 64
        </text>
        <Box x={20} y={260} w={70} label="h" />
        <Wire x1={90} y1={278} x2={125} y2={278} />
        <Box x={130} y={260} w={105} label="norm 1" />
        <Wire x1={235} y1={278} x2={270} y2={278} />
        <Box x={275} y={260} w={125} label="attention" colour={targetColour} />
        <Wire x1={400} y1={278} x2={435} y2={278} />
        <circle cx="455" cy="278" r="18" fill="#222" stroke="#ddd" />
        <text x="455" y="285" textAnchor="middle" fontSize="22">
          +
        </text>
        <path d="M55 260V231H455V260" fill="none" stroke="#aaa" />
        <Wire x1={475} y1={278} x2={525} y2={278} />
        <Box x={530} y={260} w={100} label="norm 2" />
        <Wire x1={630} y1={278} x2={665} y2={278} />
        <Box x={670} y={260} w={125} label="MLP 16/64/16" colour={draftColour} />
        <Wire x1={795} y1={278} x2={835} y2={278} />
        <circle cx="855" cy="278" r="18" fill="#222" stroke="#ddd" />
        <text x="855" y="285" textAnchor="middle" fontSize="22">
          +
        </text>
        <path d="M497 278V324H855V297" fill="none" stroke="#aaa" />
        <Wire x1={875} y1={278} x2={950} y2={278} />
        <text x="960" y="284" fontSize="16">
          h′
        </text>
        <text x="30" y="375" fontSize="16">
          Selected head {head}, layer {layer}: K and V each [batch 1, heads 4, capacity 24, features
          4]
        </text>
        {[0, 1, 2, 3].map((h) => (
          <g key={h}>
            {Array.from({ length: 12 }, (_, p) => (
              <rect
                key={p}
                x={45 + p * 45 + h * 3}
                y={407 + h * 9}
                width="38"
                height="22"
                fill={h === Number(head) ? tokenColours[Number(layer)] : '#222'}
                stroke={h === Number(head) ? '#fff' : '#777'}
              />
            ))}
            <text x="640" y={419 + h * 15} fontSize="13">
              head {h}
            </text>
          </g>
        ))}
      </Drawing>
      <Readout>
        The draft keeps block 0 from identical initialized weights. The target has three blocks.
        Unlike Pythia's parallel branches, norm 2 here reads the attention-updated residual. No
        corpus fit is implied.
      </Readout>
      <Controls
        reset={() => {
          setLayer('1');
          setHead('0');
        }}
      >
        <Select
          label="Expanded layer"
          value={layer}
          onChange={setLayer}
          options={['0', '1', '2'].map((x) => [x, x])}
        />
        <Select
          label="K/V head"
          value={head}
          onChange={setHead}
          options={['0', '1', '2', '3'].map((x) => [x, x])}
        />
      </Controls>
    </Figure>
  );
}
export function TailSum() {
  const [alpha, setAlpha] = useState(0.7),
    [k, setK] = useState(4);
  const result = lengthModel(alpha, k);
  return (
    <Figure id="D19" label="Expected accepted and emitted counts">
      <Drawing
        width={800}
        height={350}
        label="Tail probabilities of reaching and accepting each draft position"
      >
        <path d="M70 45V270H755" stroke="#bbb" fill="none" />
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1="70" y1={270 - v * 210} x2="750" y2={270 - v * 210} stroke="#333" />
            <text x="58" y={275 - v * 210} textAnchor="end" fontSize="14">
              {v}
            </text>
          </g>
        ))}
        <text x="70" y="26" fontSize="16">
          Probability of ≥j accepted proposals
        </text>
        {result.tails.map((p, i) => (
          <g key={i}>
            <rect
              x={100 + i * 78}
              y={270 - 210 * p}
              width="48"
              height={210 * p}
              fill={tokenColours[i % 3]}
            />
            <text x={124 + i * 78} y={258 - 210 * p} fontSize="14" textAnchor="middle">
              {fmt(p, 4)}
            </text>
            <text x={124 + i * 78} y="295" textAnchor="middle" fontSize="15">
              {i + 1}
            </text>
          </g>
        ))}
        <text x="370" y="335" textAnchor="middle" fontSize="16">
          Accepted-position index j
        </text>
      </Drawing>
      <Readout>
        Accepted expectation {fmt(result.accepted)} + one guaranteed repair/bonus ={' '}
        {fmt(result.emitted)} emitted. Independent common α, no EOS, enough budget.{' '}
        {k === 0
          ? 'K = 0 leaves only the target step.'
          : alpha === 1
            ? 'At α = 1, every proposal passes; the finite sum is K + 1.'
            : ''}
      </Readout>
      <Controls
        reset={() => {
          setAlpha(0.7);
          setK(4);
        }}
      >
        <Slider label="Common acceptance α" value={alpha} onChange={setAlpha} />
        <Slider label="Lookahead K" value={k} min={0} max={8} step={1} onChange={setK} />
      </Controls>
    </Figure>
  );
}
export function CostTimeline() {
  const [draft, setDraft] = useState(2),
    [growth, setGrowth] = useState(1),
    [k, setK] = useState(3);
  const result = costModel(0.7, k, draft, growth);
  const maximum = Math.max(result.total, result.baseline, 10),
    scale = 600 / maximum;
  return (
    <Figure id="D20" label="Constructed cost and speedup">
      <Drawing
        width={840}
        height={265}
        label="Same time axis compares expected baseline and a complete speculative round"
      >
        <text x="15" y="77" fontSize="15">
          Baseline
        </text>
        <rect
          x="160"
          y="52"
          width={result.baseline * scale}
          height="42"
          fill={targetColour}
          fillOpacity=".55"
        />
        <text x="165" y="80" fontSize="16">
          {fmt(result.baseline, 2)} ms
        </text>
        <text x="15" y="163" fontSize="15">
          Speculative
        </text>
        {[
          ['draft', result.draftTotal, draftColour],
          ['verify', result.verification, targetColour],
          ['overhead', result.overhead, '#ccc'],
        ].map(([label, value, colour], i, all) => {
          const offset = all.slice(0, i).reduce((s, x) => s + x[1], 0);
          return (
            <g key={label}>
              <rect
                x={160 + offset * scale}
                y="140"
                width={value * scale}
                height="42"
                fill={colour}
                fillOpacity=".55"
                stroke={colour}
              />
              <text
                x={160 + (offset + value / 2) * scale}
                y={i === 2 ? 125 : 205}
                fontSize="14"
                textAnchor="middle"
              >
                {label}: {fmt(value, 2)}
              </text>
            </g>
          );
        })}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={160 + 600 * t} y1="215" x2={160 + 600 * t} y2="222" stroke="#aaa" />
            <text x={160 + 600 * t} y="244" textAnchor="middle" fontSize="14">
              {fmt(t * maximum, 1)}
            </text>
          </g>
        ))}
        <text x="15" y="244" fontSize="15">
          milliseconds
        </text>
      </Drawing>
      <Readout>
        At α = 0.7, expected outputs = {fmt(result.emitted)}. Speedup = {fmt(result.baseline)} /{' '}
        {fmt(result.total)} = {fmt(result.speedup)};{' '}
        {result.speedup > 1
          ? 'the constructed model predicts a saving.'
          : result.speedup === 1
            ? 'break-even.'
            : 'the constructed model predicts a slowdown.'}{' '}
        Target step 10 ms, overhead 1 ms; these are illustrative costs.
      </Readout>
      <Controls
        reset={() => {
          setDraft(2);
          setGrowth(1);
          setK(3);
        }}
      >
        <Slider
          label="Draft ms per proposal"
          value={draft}
          min={0}
          max={10}
          step={0.25}
          onChange={setDraft}
        />
        <Slider
          label="Verification growth ms per candidate"
          value={growth}
          min={0}
          max={5}
          step={0.25}
          onChange={setGrowth}
        />
        <Slider label="Lookahead K" value={k} min={0} max={6} step={1} onChange={setK} />
      </Controls>
    </Figure>
  );
}
export function WorkMemory() {
  const [k, setK] = useState(3),
    [batch, setBatch] = useState(1);
  const bytes = 2 * 3 * 4 * (8 + k) * 4 * 8 * batch,
    draftBytes = bytes / 3;
  return (
    <Figure id="D21" label="Separate weight reuse, row work and cache memory">
      <Drawing
        width={850}
        height={320}
        label="Weight matrices feed multiple query rows; target and draft cache allocations remain separate"
      >
        <rect x="40" y="60" width="130" height="140" fill="#18242d" stroke={targetColour} />
        {[0, 1, 2, 3].map((i) => (
          <React.Fragment key={i}>
            <line x1={40 + i * 32} y1="60" x2={40 + i * 32} y2="200" stroke={targetColour} />
            <line x1="40" y1={60 + i * 35} x2="170" y2={60 + i * 35} stroke={targetColour} />
          </React.Fragment>
        ))}
        <text x="40" y="35" fontSize="16">
          target weights
        </text>
        <Wire x1={172} y1={130} x2={260} y2={130} />
        {Array.from({ length: k + 1 }, (_, i) => (
          <rect
            key={i}
            x="270"
            y={45 + i * 22}
            width="160"
            height="17"
            fill={tokenColours[i % 3]}
            fillOpacity=".6"
            stroke={tokenColours[i % 3]}
          />
        ))}
        <text x="265" y="260" fontSize="16">
          {batch * (k + 1)} target query rows
        </text>
        <Wire x1={440} y1={130} x2={535} y2={130} />
        <Box x={545} y={45} w={245} h={65} label={`target K/V: ${bytes} B`} colour={targetColour} />
        <Box
          x={545}
          y={155}
          w={245}
          h={65}
          label={`draft K/V: ${draftBytes} B`}
          colour={draftColour}
        />
        <text x="20" y="301" fontSize="15">
          Constructed shape: FP64, 4 heads × 4 features, history 8 + K, target 3 layers / draft 1.
        </text>
      </Drawing>
      <Readout>
        In this simple grouped-call model, one weight load serves multiple rows, but row operations
        and two cache payloads remain. Concurrency {batch} multiplies per-request K/V. No bandwidth,
        wall-time or production batch threshold follows.
      </Readout>
      <Controls
        reset={() => {
          setK(3);
          setBatch(1);
        }}
      >
        <Slider label="Lookahead K" value={k} min={0} max={6} step={1} onChange={setK} />
        <Slider
          label="Concurrent requests"
          value={batch}
          min={1}
          max={8}
          step={1}
          onChange={setBatch}
        />
      </Controls>
    </Figure>
  );
}
export function LookaheadPolicies() {
  const [cut, setCut] = useState(0.5),
    [trace, setTrace] = useState('mixed');
  const confidence = trace === 'mixed' ? [0.95, 0.8, 0.45, 0.9, 0.2] : [0.2, 0.15, 0.1, 0.12, 0.05],
    passes =
      trace === 'mixed' ? [true, true, false, true, false] : [false, true, false, false, false];
  const firstLow = confidence.findIndex((x) => x < cut),
    dynamic = firstLow < 0 ? 5 : firstLow,
    firstFail = passes.findIndex((x) => !x),
    oracle = firstFail < 0 ? 5 : firstFail;
  const rows = [
    ['Fixed cap', 5],
    ['Confidence stop', dynamic],
    ['Retrospective oracle', oracle],
  ];
  return (
    <Figure id="D22" label="Lookahead policies on the same constructed trace">
      <Drawing
        width={890}
        height={310}
        label="Proposal effort and accepted prefix differ for fixed, confidence and oracle policies"
      >
        {confidence.map((c, i) => (
          <g key={i}>
            <text x={290 + i * 108} y="30" textAnchor="middle" fontSize="15">
              q = {fmt(c)}
            </text>
            <text x={290 + i * 108} y="58" textAnchor="middle" fontSize="14">
              target: {passes[i] ? 'pass' : 'fail'}
            </text>
          </g>
        ))}
        {rows.map(([name, count], r) => (
          <g key={name}>
            <text x="10" y={119 + r * 67} fontSize="15">
              {name}
            </text>
            {confidence.map((c, i) => (
              <g key={i}>
                <rect
                  x={250 + i * 108}
                  y={90 + r * 67}
                  width="82"
                  height="40"
                  fill={i < count ? '#333' : '#181818'}
                  stroke={tokenColours[i % 3]}
                  strokeDasharray={i < count ? undefined : '4 4'}
                />
                <text x={290 + i * 108} y={115 + r * 67} textAnchor="middle" fontSize="14">
                  {i < count ? 'draft ' + (i + 1) : 'skip'}
                </text>
              </g>
            ))}
          </g>
        ))}
      </Drawing>
      <Table
        headers={['Policy', 'Drafted', 'Accepted prefix', 'Target verification calls']}
        rows={rows.map(([name, count]) => [name, count, Math.min(count, oracle), 1])}
      />
      <Readout>
        This constructed confidence policy checks its row before drawing the next candidate. Zero
        candidates falls back to one target step. The oracle sees future target tests; it is not an
        available free predictor. Native measurements use fixed caps and confidence threshold zero.
      </Readout>
      <Controls
        reset={() => {
          setCut(0.5);
          setTrace('mixed');
        }}
      >
        <Slider
          label="Minimum draft confidence"
          value={cut}
          min={0}
          max={1}
          step={0.05}
          onChange={setCut}
        />
        <Select
          label="Constructed trace"
          value={trace}
          onChange={setTrace}
          options={[
            ['mixed', 'Mixed confidence'],
            ['low', 'All low confidence'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
