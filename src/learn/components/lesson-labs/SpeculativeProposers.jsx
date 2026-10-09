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
  Evidence,
  tokenColours,
  targetColour,
  draftColour,
  fmt,
  vector,
} from './SpeculativeElements.jsx';
import { mass, threshold } from '../../data/speculative-decoding-models.js';

const treeTokens = [2, 5, 8, 9],
  paths = [[0], [1], [0, 2], [1, 3]],
  coordinates = [
    [275, 75],
    [530, 75],
    [275, 190],
    [530, 190],
  ];
export function TreeAttention() {
  const [node, setNode] = useState('2');
  const selected = Number(node),
    allowed = [0, 1, 2, ...paths[selected].map((i) => i + 3)];
  return (
    <Figure id="D23" label="Packed tree attention preserves each ancestor path">
      <Drawing
        width={800}
        height={320}
        label="Four candidate nodes share a prefix but siblings cannot attend to each other"
      >
        <Box x={330} y={5} w={170} label="prompt [1, 4, 7]" colour={targetColour} />
        {coordinates.map(([x, y], i) => (
          <g key={i}>
            <Wire
              x1={i < 2 ? 415 : coordinates[i - 2][0] + 55}
              y1={i < 2 ? 41 : 111}
              x2={x + 55}
              y2={y}
              colour={tokenColours[i % 3]}
            />
            <Box
              x={x}
              y={y}
              w={110}
              label={`node ${i}: ${treeTokens[i]}`}
              colour={tokenColours[i % 3]}
              selected={selected === i}
            />
            <text x={x - 15} y={y + 26} fontSize="14" textAnchor="end">
              absolute pos {i < 2 ? 3 : 4}
            </text>
          </g>
        ))}
        <text x="30" y="289" fontSize="16">
          Selected path: prompt → {paths[selected].map((i) => treeTokens[i]).join(' → ')}
        </text>
      </Drawing>
      <Table
        label="Packed query/key attention mask: 1 permitted, × masked"
        headers={[
          'Query',
          'prompt 0',
          'prompt 1',
          'prompt 2',
          'node 0',
          'node 1',
          'node 2',
          'node 3',
          'position',
        ]}
        rows={paths.map((path, i) => [
          <strong key="q">{`node ${i}${i === selected ? ' ← selected' : ''}`}</strong>,
          ...Array.from({ length: 7 }, (_, j) => (j < 3 || path.includes(j - 3) ? 1 : '×')),
          i < 2 ? 3 : 4,
        ])}
      />
      <Readout>
        Selected node {selected} can read packed keys {allowed.join(', ')}. Packed array index is
        not logical depth; sibling roots both occupy absolute position 3.
      </Readout>
      <Evidence>
        {(data) => {
          const record = data.journal_evidence.tree.find((r) => r.event === 'packed-tree');
          // The packed tensor starts with three prompt rows, then four tree nodes.
          const logits = record?.logits?.[3 + selected];
          return logits ? (
            <Table
              label="Retained FP64 target score row after this node's actual path"
              headers={['Vocabulary ID', 'Next-token logit']}
              rows={logits.map((v, i) => [i, fmt(v, 7)])}
            />
          ) : (
            <p>The retained node-score record is unavailable.</p>
          );
        }}
      </Evidence>
      <Controls reset={() => setNode('2')}>
        <Select
          label="Select node/path"
          value={node}
          onChange={setNode}
          options={treeTokens.map((t, i) => [String(i), `node ${i}, token ${t}`])}
        />
      </Controls>
    </Figure>
  );
}
export function GreedyTraversal() {
  const [mode, setMode] = useState('match');
  const firstPresent = mode !== 'missing',
    emitted = firstPresent ? [0, 1, 2] : [0];
  return (
    <Figure id="D24" label="Greedy target traversal through a candidate tree">
      <Drawing
        width={840}
        height={360}
        label="Target argmax follows matching children and stops when the selected ID is absent"
      >
        <Box x={20} y={130} w={110} label="prefix h" />
        <Wire x1={130} y1={148} x2={270} y2={70} colour={tokenColours[0]} dashed={!firstPresent} />
        <Wire x1={130} y1={148} x2={270} y2={250} colour={tokenColours[1]} />
        <Box
          x={275}
          y={52}
          w={120}
          label={firstPresent ? 'child A' : 'A absent'}
          colour={tokenColours[0]}
          selected={firstPresent}
          dashed={!firstPresent}
        />
        <Box x={275} y={232} w={120} label="child B" colour={tokenColours[1]} />
        <Wire x1={395} y1={70} x2={500} y2={70} colour={tokenColours[1]} dashed={!firstPresent} />
        <Box
          x={505}
          y={52}
          w={120}
          label="child B"
          colour={tokenColours[1]}
          selected={firstPresent}
        />
        <Wire x1={625} y1={70} x2={700} y2={70} colour={tokenColours[2]} />
        <Box x={705} y={52} w={115} label="C absent" colour={tokenColours[2]} dashed />
        <text x="260" y="134" fontSize="15">
          Target chooses A
        </text>
        <text x="490" y="134" fontSize="15">
          then B
        </text>
        <text x="675" y="134" fontSize="15">
          then C: emit, stop
        </text>
        <text x="250" y="302" fontSize="15">
          The unused B branch stays visible; its depth does not override target choice.
        </text>
      </Drawing>
      <Tokens ids={emitted} />
      <Readout>
        {mode === 'tie' ? 'Target scores tie A and B; the stated lowest-ID rule selects A. ' : ''}
        {firstPresent
          ? 'A and B are verified child matches. Emit C at the first absent child and finish the round.'
          : 'No A child exists: emit target A and finish immediately.'}{' '}
        This constructed greedy path is not beam search or stochastic longest-path selection.
      </Readout>
      <Controls reset={() => setMode('match')}>
        <Select
          label="Tree/target case"
          value={mode}
          onChange={setMode}
          options={[
            ['match', 'Matching first child'],
            ['missing', 'First argmax child absent'],
            ['tie', 'A/B target tie, lowest ID'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function TwoProposals() {
  const [first, setFirst] = useState('1'),
    [second, setSecond] = useState('1'),
    [u, setU] = useState(0.8);
  const p = [0.7, 0.3],
    q = [0.4, 0.6],
    a = threshold(p, q, Number(first)),
    accepted = u < a,
    residual = mass(p, q).repair;
  const secondAlpha = threshold(residual, q, Number(second)),
    secondAccepted = 0.8 < secondAlpha;
  const output = accepted ? Number(first) : secondAccepted ? Number(second) : 0;
  return (
    <Figure id="D25" label="Update the residual between stochastic proposals">
      <Drawing
        width={920}
        height={320}
        label="A rejected first q draw changes the desired row before the second q draw"
      >
        <Box x={20} y={65} w={190} label="desired p = (0.7, 0.3)" colour={targetColour} />
        <Wire x1={210} y1={83} x2={265} y2={83} />
        <Box
          x={270}
          y={65}
          w={185}
          label={`q draw 1: ${['A', 'B'][first]}`}
          colour={tokenColours[first]}
        />
        <text x="485" y="130" fontSize="15">
          a₁ = {fmt(a)}; u₁ = {fmt(u)}
        </text>
        {accepted ? (
          <>
            <Wire x1={455} y1={83} x2={590} y2={83} colour={targetColour} />
            <Box
              x={595}
              y={65}
              w={230}
              label={`accept ${['A', 'B'][first]}; stop`}
              colour={tokenColours[first]}
            />
          </>
        ) : (
          <>
            <Wire x1={360} y1={102} x2={360} y2={177} colour={draftColour} />
            <Box x={265} y={185} w={210} label="new desired r₁ = (1, 0)" colour={targetColour} />
            <Wire x1={475} y1={203} x2={530} y2={203} />
            <Box
              x={535}
              y={185}
              w={170}
              label={`q draw 2: ${['A', 'B'][second]}`}
              colour={tokenColours[second]}
            />
            <Wire x1={705} y1={203} x2={770} y2={203} />
            <text x="780" y="210" fontSize="16">
              {secondAccepted ? 'accept A' : 'repair A'}
            </text>
            <text x="530" y="255" fontSize="15">
              a₂ = {fmt(secondAlpha)}; fixed u₂ = 0.8
            </text>
          </>
        )}
      </Drawing>
      <Readout>
        Emitted {['A', 'B'][output]}.{' '}
        {accepted
          ? 'First acceptance short-circuits the second proposal.'
          : `After first rejection, the second desired row is ${vector(residual)}, not the original p.`}
      </Readout>
      <Table
        label="Exact binary mass comparison retained from the finite enumeration"
        headers={['Output', 'Correct sequential residual law', 'Biased preferred accepted ID']}
        rows={[
          ['A', 0.7, 0.703],
          ['B', 0.3, 0.297],
        ]}
      />
      <Controls
        reset={() => {
          setFirst('1');
          setSecond('1');
          setU(0.8);
        }}
      >
        <Select
          label="First q proposal"
          value={first}
          onChange={setFirst}
          options={[
            ['0', 'A'],
            ['1', 'B'],
          ]}
        />
        <Slider
          label="First acceptance uniform"
          value={u}
          max={0.99}
          onChange={setU}
          disabled={first === '0'}
        />
        <Select
          label="Second q proposal"
          value={second}
          onChange={setSecond}
          options={[
            ['0', 'A'],
            ['1', 'B'],
          ]}
          disabled={accepted}
        />
      </Controls>
    </Figure>
  );
}
export function MedusaHeads() {
  const [mode, setMode] = useState('frozen');
  return (
    <Figure id="D26" label="Residual proposal heads and gradient ownership">
      <Drawing
        width={1020}
        height={440}
        label="One backbone state branches into three independent residual heads and shifted losses"
      >
        <Box x={15} y={175} w={160} label="backbone state hₜ" colour={targetColour} />
        {[1, 2, 3].map((offset, i) => (
          <g key={offset}>
            <Wire x1={175} y1={193} x2={300} y2={60 + i * 125} colour={draftColour} />
            <Box
              x={305}
              y={42 + i * 125}
              w={225}
              label={`head ${offset}: h + SiLU(W${offset}h)`}
              colour={draftColour}
            />
            <Wire x1={530} y1={60 + i * 125} x2={585} y2={60 + i * 125} />
            <Box
              x={590}
              y={42 + i * 125}
              w={150}
              label={`logits for t + ${offset}`}
              colour={tokenColours[i]}
            />
            <Wire x1={740} y1={60 + i * 125} x2={800} y2={60 + i * 125} />
            <Box
              x={805}
              y={42 + i * 125}
              w={180}
              label={`CE vs token xₜ₊${offset}`}
              colour={tokenColours[i]}
            />
            <Wire
              x1={900}
              y1={82 + i * 125}
              x2={420}
              y2={103 + i * 125}
              colour={tokenColours[2]}
              dashed
            />
            <text x="570" y={120 + i * 125} fontSize="13">
              loss gradient into head parameters
            </text>
          </g>
        ))}
        <path
          d="M305 193H175"
          fill="none"
          stroke={tokenColours[2]}
          strokeWidth="3"
          strokeDasharray={mode === 'frozen' ? '2 5' : undefined}
        />
        <text x="15" y="270" fontSize="15">
          {mode === 'frozen' ? 'detach h: no backbone grad' : 'joint: gradient reaches h'}
        </text>
        <text x="15" y="420" fontSize="15">
          The three heads receive the same hₜ; they do not consume one another’s proposed token.
        </text>
      </Drawing>
      <Evidence>
        {(data) => {
          const row = data.stages.heads.outcomes.find(
            (r) => r.frozen_backbone === (mode === 'frozen'),
          );
          return (
            <>
              <Table
                label="Actual constructed one-update diagnostic"
                headers={['Head offset', 'Supervised positions', 'Mean CE']}
                rows={row.heads.map((h) => [h.offset, h.positions, fmt(h.mean_ce, 8)])}
              />
              <Readout>
                Total initial loss {fmt(row.loss, 9)}. Backbone weight changed:{' '}
                {String(row.changed['backbone.weight'])}; embedding changed:{' '}
                {String(row.changed['embedding.weight'])}. One constructed SGD update, not trained
                Medusa quality.
              </Readout>
            </>
          );
        }}
      </Evidence>
      <p>
        Exact verification is separate. Medusa typical acceptance deliberately relaxes the policy
        and is approximate.
      </p>
      <Controls reset={() => setMode('frozen')}>
        <Select
          label="Training gradient route"
          value={mode}
          onChange={setMode}
          options={[
            ['frozen', 'Frozen backbone'],
            ['joint', 'Joint backbone + heads'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function EagleOne() {
  const [token, setToken] = useState('0');
  return (
    <Figure id="D27" label="EAGLE-1 feature and advanced-token dependency">
      <Drawing
        width={1040}
        height={375}
        label="The advanced token distinguishes continuations sharing the same prior target feature"
      >
        <Box x={20} y={45} w={210} label="target feature hₜ" colour={targetColour} />
        <Box
          x={20}
          y={190}
          w={210}
          label={`embedding of selected ${['A', 'B', 'C'][token]}`}
          colour={tokenColours[token]}
        />
        <Wire x1={230} y1={63} x2={310} y2={120} />
        <Wire x1={230} y1={208} x2={310} y2={143} />
        <rect x="315" y="92" width="72" height="100" fill="none" stroke="#ddd" />
        {[0, 1].map((i) => (
          <rect
            key={i}
            x="322"
            y={100 + i * 42}
            width="58"
            height="35"
            fill={i === 0 ? targetColour : tokenColours[token]}
            fillOpacity=".5"
          />
        ))}
        <text x="295" y="224" fontSize="15">
          concatenate
        </text>
        <Wire x1={387} y1={142} x2={440} y2={142} />
        <Box x={445} y={124} w={200} label="projection + draft decoder" colour={draftColour} />
        <Wire x1={645} y1={142} x2={695} y2={142} />
        <Box x={700} y={124} w={145} label="predicted hₜ₊₁" colour={draftColour} />
        <Wire x1={845} y1={142} x2={880} y2={142} />
        <Box x={885} y={124} w={135} label="frozen LM head" colour={targetColour} />
        <Wire x1={770} y1={161} x2={770} y2={255} />
        <text x="620" y="283" fontSize="15">
          feature loss against target hₜ₊₁
        </text>
        <Wire x1={950} y1={161} x2={950} y2={305} />
        <text x="790" y="337" fontSize="15">
          token loss against xₜ₊₂
        </text>
        <text x="20" y="316" fontSize="15">
          Feature-only comparison removes the selected-token input.
        </text>
      </Drawing>
      <Readout>
        Changing the advanced token to {['A', 'B', 'C'][token]} changes which conditional future the
        proposer must represent, even with the same hₜ. This is a structural dependency
        illustration; no fitted local EAGLE feature accuracy is assigned.
      </Readout>
      <Controls reset={() => setToken('0')}>
        <Select
          label="Advanced selected token"
          value={token}
          onChange={setToken}
          options={['A', 'B', 'C'].map((t, i) => [String(i), t])}
        />
      </Controls>
    </Figure>
  );
}
export function EagleThree() {
  const [state, setState] = useState('own');
  return (
    <Figure id="D28" label="EAGLE-3 feature fusion and own-state training">
      <Drawing
        width={1090}
        height={490}
        label="Three feature taps fuse before two unrolled proposer training steps"
      >
        {[1, 2, 3, 4, 5, 6].map((n, i) => (
          <g key={n}>
            <Box x={20 + i * 120} y={35} w={95} label={`layer ${n}`} colour={targetColour} />
            {i < 5 && <Wire x1={115 + i * 120} y1={53} x2={140 + i * 120} y2={53} />}
          </g>
        ))}
        {[0, 2, 5].map((i, j) => (
          <g key={i}>
            <Wire x1={67 + i * 120} y1={71} x2={805} y2={105 + j * 40} colour={tokenColours[j]} />
            <rect
              x="810"
              y={88 + j * 40}
              width="125"
              height="30"
              fill={tokenColours[j]}
              fillOpacity=".5"
            />
            <text x="950" y={110 + j * 40} fontSize="15">
              {['low', 'middle', 'high'][j]}
            </text>
          </g>
        ))}
        <text x="795" y="235" fontSize="15">
          concatenate → project
        </text>
        <Wire x1={870} y1={210} x2={365} y2={290} colour={draftColour} />
        <Box x={25} y={290} w={175} label="advanced token e(xₜ₊₁)" colour={tokenColours[0]} />
        <Wire x1={200} y1={308} x2={250} y2={308} />
        <Box x={255} y={290} w={220} label="draft step 1 → head → CE" colour={draftColour} />
        <Wire
          x1={475}
          y1={308}
          x2={555}
          y2={308}
          colour={state === 'own' ? draftColour : targetColour}
          dashed={state !== 'own'}
        />
        <Box x={560} y={290} w={245} label="draft step 2 → head → CE" colour={draftColour} />
        <text x="20" y="370" fontSize="15">
          {state === 'own'
            ? 'own generated state feeds step 2'
            : 'comparison: fresh target state at step 2'}
        </text>
        <Box x={560} y={399} w={245} label="advanced token e(xₜ₊₂)" colour={tokenColours[1]} />
        <Wire x1={683} y1={398} x2={683} y2={327} colour={tokenColours[1]} />
        {state === 'teacher' && (
          <>
            <Box x={850} y={290} w={210} label="fresh target state" colour={targetColour} />
            <Wire x1={850} y1={308} x2={806} y2={308} colour={targetColour} />
          </>
        )}
        <text x="220" y="474" fontSize="15">
          Each step also receives its advanced token. Token objective; no feature-regression target.
        </text>
      </Drawing>
      <Readout>
        All three target feature taps remain part of the proposer.{' '}
        {state === 'own'
          ? 'Training exposes the draft to its own recursively produced state.'
          : 'Replacing feedback by fresh target state removes the own-state training exposure, despite retaining all three taps.'}{' '}
        Proposal training and exact verification remain separate claims.
      </Readout>
      <Controls reset={() => setState('own')}>
        <Select
          label="Second training-step state"
          value={state}
          onChange={setState}
          options={[
            ['own', 'Own draft-state feedback'],
            ['teacher', 'Teacher-state comparison'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function PromptLookup() {
  const [match, setMatch] = useState('yes'),
    [budget, setBudget] = useState('4');
  const ids = match === 'yes' ? [0, 1, 2, 3, 0, 1] : [0, 1, 2, 3, 4, 5],
    proposes = match === 'yes' && budget !== '1';
  return (
    <Figure id="D34" label="Copy a prompt continuation and verify it">
      <Drawing
        width={860}
        height={300}
        label="Current suffix matches an earlier token span; only its following IDs are proposed"
      >
        {ids.map((id, i) => (
          <g key={i}>
            <Box
              x={40 + i * 125}
              y={65}
              w={95}
              label={String.fromCharCode(65 + id)}
              colour={tokenColours[id % 3]}
              selected={i >= 4}
            />
            <text x={87 + i * 125} y="131" textAnchor="middle" fontSize="14">
              position {i}
            </text>
          </g>
        ))}
        {match === 'yes' && (
          <>
            <path d="M680 65V25H145V65" fill="none" stroke="#fff" />
            <text x="300" y="20" fontSize="15">
              suffix AB matches earlier AB
            </text>
          </>
        )}
        <Wire x1={353} y1={145} x2={353} y2={195} colour={draftColour} dashed={!proposes} />
        <Box
          x={235}
          y={205}
          w={250}
          label={proposes ? 'copied candidates: C, D' : 'no candidate IDs'}
          colour={draftColour}
        />
        <Wire x1={485} y1={223} x2={560} y2={223} />
        <Box
          x={565}
          y={205}
          w={260}
          label={proposes ? 'target verifies candidate rows' : 'one ordinary target step'}
          colour={targetColour}
        />
      </Drawing>
      <Readout>
        {proposes
          ? 'The proposed C,D IDs come from the earlier continuation. The target still verifies them.'
          : budget === '1'
            ? 'With one output slot left, the reserve-a-bonus convention proposes nothing.'
            : 'No matching suffix: proposal lane is empty.'}{' '}
        Native prompt lookup supplies no learned q-score tensor; it uses target-choice matching, not
        an invented proposal probability.
      </Readout>
      <Controls
        reset={() => {
          setMatch('yes');
          setBudget('4');
        }}
      >
        <Select
          label="Prompt row"
          value={match}
          onChange={setMatch}
          options={[
            ['yes', 'A B C D A B'],
            ['no', 'A B C D E F'],
          ]}
        />
        <Select
          label="Remaining output slots"
          value={budget}
          onChange={setBudget}
          options={[
            ['1', '1'],
            ['4', '4'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function EarlyExit() {
  const [exit, setExit] = useState('4'),
    [trained, setTrained] = useState('yes');
  return (
    <Figure id="D35" label="A trained early exit uses one model">
      <Drawing
        width={1060}
        height={340}
        label="One sequential decoder retains full-depth verification and lower/upper cache state"
      >
        <Box x={15} y={65} w={125} label="embedding" colour={targetColour} />
        {Array.from({ length: 8 }, (_, i) => (
          <g key={i}>
            <Wire x1={140 + i * 105} y1={83} x2={158 + i * 105} y2={83} />
            <Box
              x={163 + i * 105}
              y={65}
              w={85}
              label={`layer ${i + 1}`}
              colour={i < Number(exit) ? draftColour : targetColour}
              selected={i + 1 === Number(exit)}
            />
          </g>
        ))}
        <Wire
          x1={205 + (Number(exit) - 1) * 105}
          y1={102}
          x2={205 + (Number(exit) - 1) * 105}
          y2={170}
          colour={draftColour}
        />
        <Box
          x={Math.min(760, 145 + (Number(exit) - 1) * 105)}
          y={180}
          w={220}
          label="shared output head → ID"
          colour={draftColour}
        />
        <text x="20" y="159" fontSize="15">
          lower-layer K/V
        </text>
        <text x="780" y="159" fontSize="15">
          remaining-layer K/V
        </text>
        <path
          d={`M${255 + (Number(exit) - 1) * 105} 216V255H55V103`}
          fill="none"
          stroke={draftColour}
        />
        <text x="170" y="249" fontSize="15">
          draft ID → next lower-depth candidate step
        </text>
        <path d="M935 103V293H55V103" fill="none" stroke={targetColour} />
        <text x="200" y="318" fontSize="15">
          restore full active depth → target verification of the known candidate IDs
        </text>
      </Drawing>
      <Readout>
        {trained === 'yes'
          ? `Illustrated trained exit e = ${exit}. The ordinary optional call uses assistant_early_exit; a qualified LayerSkip checkpoint is required.`
          : 'Unavailable: arbitrary intermediate layers do not supply qualified trained exit logits.'}{' '}
        One model shares weights; this diagram does not claim the pinned library avoids every
        repeated activation or byte. The local Pythia experiment uses a separate draft instead.
      </Readout>
      <Controls
        reset={() => {
          setExit('4');
          setTrained('yes');
        }}
      >
        <Select
          label="Illustrated exit boundary"
          value={exit}
          onChange={setExit}
          options={['2', '4', '6'].map((x) => [x, x])}
        />
        <Select
          label="Checkpoint condition"
          value={trained}
          onChange={setTrained}
          options={[
            ['yes', 'Trained early-exit checkpoint'],
            ['no', 'Unqualified arbitrary checkpoint'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function CheckpointMtp() {
  const [selected, setSelected] = useState('1'),
    [supported, setSupported] = useState('yes');
  return (
    <Figure id="D36" label="Sequential checkpoint-trained MTP modules">
      <Drawing
        width={1030}
        height={435}
        label="Each trained module consumes both the previous state and the advanced token embedding"
      >
        <Box x={15} y={100} w={150} label="main state hₜ" colour={targetColour} />
        {[0, 1].map((i) => (
          <g key={i}>
            <Box
              x={240 + i * 425}
              y={35}
              w={260}
              label={`shared embedding of xₜ₊${i + 1}`}
              colour={tokenColours[i]}
            />
            <Wire x1={370 + i * 425} y1={71} x2={370 + i * 425} y2={108} />
            <Box
              x={240 + i * 425}
              y={115}
              w={260}
              label="norms → concat → projection"
              colour={draftColour}
            />
            <Wire x1={370 + i * 425} y1={151} x2={370 + i * 425} y2={180} />
            <Box
              x={240 + i * 425}
              y={187}
              w={260}
              label={`trained MTP module ${i + 1}`}
              colour={draftColour}
              selected={Number(selected) === i + 1}
            />
            <Wire x1={370 + i * 425} y1={223} x2={370 + i * 425} y2={255} />
            <Box
              x={270 + i * 425}
              y={262}
              w={200}
              label={`shared head → xₜ₊${i + 2}`}
              colour={targetColour}
            />
          </g>
        ))}
        <Wire x1={165} y1={118} x2={235} y2={133} colour={targetColour} />
        <path d="M500 205H570V133H665" fill="none" stroke={draftColour} />
        <text x="535" y="183" fontSize="15">
          new state
        </text>
        <path d="M470 280H620V52H665" fill="none" stroke={tokenColours[1]} />
        <text x="525" y="319" fontSize="15">
          selected token
        </text>
        <Wire x1={800} y1={298} x2={800} y2={350} />
        <Box
          x={510}
          y={355}
          w={470}
          label="main verifier: accept prefix / crop and rebuild after rejection"
          colour={targetColour}
        />
      </Drawing>
      <Readout>
        {supported === 'yes'
          ? 'The checkpoint must contain supported trained MTP weights and its resolved num_mtp_layers configuration.'
          : 'Unavailable: a positive layer count or random extra heads cannot substitute for trained supported MTP weights.'}{' '}
        Module {selected} is selected; every dependency remains visible. Unlike independent Medusa
        heads, module 2 consumes the previous module state and advanced token. No large-checkpoint
        MTP run was performed.
      </Readout>
      <Controls
        reset={() => {
          setSelected('1');
          setSupported('yes');
        }}
      >
        <Select
          label="Highlight module"
          value={selected}
          onChange={setSelected}
          options={[
            ['1', '1'],
            ['2', '2'],
          ]}
        />
        <Select
          label="Checkpoint support"
          value={supported}
          onChange={setSupported}
          options={[
            ['yes', 'Supported trained MTP'],
            ['no', 'No trained MTP weights'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
