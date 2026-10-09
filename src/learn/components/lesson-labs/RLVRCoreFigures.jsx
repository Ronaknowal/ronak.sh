import React, { useId, useState } from 'react';
import * as M from '../../data/rlvr-models.js';
import {
  Figure,
  Controls,
  Select,
  Range,
  Check,
  Reset,
  Svg,
  Text,
  Line,
  Arrow,
  Bars,
  Tokens,
  RLVRTable,
  DataView,
  Plot,
  palette,
  f,
} from './RLVRFlow.jsx';

const state = (value) => (value === null ? 'unknown' : value ? 'accepted' : 'rejected');
function Editable({ label, value, onChange }) {
  const id = useId();
  return (
    <label htmlFor={id}>
      {label}
      <textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
function Cells({ values, labels, columns = 2, colors = palette }) {
  return (
    <div className="rlvr-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
      {values.map((value, i) => (
        <div
          className="rlvr-cell"
          style={{
            borderColor: colors[i % colors.length],
            background: Number.isFinite(value)
              ? `${colors[i % colors.length]}${Math.round(Math.min(1, Math.abs(value)) * 65 + 10)
                  .toString(16)
                  .padStart(2, '0')}`
              : 'transparent',
          }}
          key={i}
        >
          {labels && <span>{labels[i]}</span>}
          <strong>{f(value)}</strong>
        </div>
      ))}
    </div>
  );
}
export function FullTaskAndVerdict() {
  const [caseIndex, setCase] = useState('original');
  const responses =
    caseIndex === 'missing'
      ? M.exampleResponses.map((text) => text.replace('####', 'answer:'))
      : caseIndex === 'wrong'
        ? M.exampleResponses.map((text) => text.replace(/#### 72/g, '#### 24'))
        : M.exampleResponses;
  return (
    <Figure
      id="D01"
      label="Full task, four response identities and separate answer/reasoning verdicts"
    >
      <p style={{ color: M.roles.input }}>{M.taskQuestion}</p>
      <p>
        External gold: <strong>72</strong>. Independent constructed reasoning annotations are
        separate.
      </p>
      <div className="rlvr-columns">
        {responses.map((text, i) => (
          <div className="rlvr-entity" style={{ '--entity': palette[i] }} key={i}>
            <p style={{ color: palette[i] }}>Response {'ABCD'[i]}</p>
            <div className="rlvr-raw">{text}</div>
            <p>
              Numeric: {state(M.verdict(text, '72').accepted)} · reward{' '}
              {f(M.verdict(text, '72').reward)}
            </p>
            <p>
              Supplied reasoning:{' '}
              {i === 0
                ? 'valid displayed calculation'
                : i === 1
                  ? 'invalid displayed calculation'
                  : 'no derivation supplied'}
            </p>
          </div>
        ))}
      </div>
      <Controls>
        <Select
          label="Response edit"
          value={caseIndex}
          onChange={setCase}
          options={[
            'original',
            ['missing', 'Remove final markers'],
            ['wrong', 'Replace final 72 with 24'],
          ]}
        />
        <Reset onClick={() => setCase('original')} />
      </Controls>
    </Figure>
  );
}
export function FeedbackAndUpdateAxes() {
  const [selected, setSelected] = useState('R1-Zero');
  const recipes = [
    ['Tülu PPO', 170, 90, 'Programmatic rewards; policy update with a value model'],
    ['R1-Zero', 170, 145, 'Accuracy/format rules; group policy update'],
    ['DeepSeekMath', 170, 270, 'Learned reward model; group policy update'],
    ['Verified SFT', 480, 110, 'Programmatic acceptance; imitate retained response targets'],
  ];
  return (
    <Figure id="D02" label="Categorical feedback source versus learning rule axes">
      <Svg height={360} label="Recipe placements on feedback and update axes">
        <Line x1={75} y1={55} x2={75} y2={310} />
        <Line x1={75} y1={310} x2={575} y2={310} />
        <Text x={75} y={30}>
          Feedback source
        </Text>
        <Text x={180} y={342} anchor="middle">
          Policy update
        </Text>
        <Text x={480} y={342} anchor="middle">
          Selected SFT
        </Text>
        <Text x={390} y={45}>
          Programmatic checks
        </Text>
        <Text x={390} y={268}>
          Learned judgments
        </Text>
        {recipes.map(([name, x, y], i) => (
          <g key={name}>
            <circle
              cx={x}
              cy={y}
              r={selected === name ? 9 : 6}
              fill={palette[i]}
              stroke={selected === name ? '#fff' : 'none'}
              strokeWidth="2"
            />
            <Text x={x + 16} y={y + 4} color={palette[i]}>
              {name}
            </Text>
          </g>
        ))}
      </Svg>
      <p>{recipes.find((row) => row[0] === selected)[3]}.</p>
      <p className="rlvr-note">
        Categories, not numeric distances; the two rule-based policy recipes are separated within
        one category for legibility.
      </p>
      <Controls>
        <Select
          label="Recipe"
          value={selected}
          onChange={setSelected}
          options={recipes.map((row) => row[0])}
        />
        <Reset onClick={() => setSelected('R1-Zero')} />
      </Controls>
    </Figure>
  );
}
export function ExtractionSpanAnatomy() {
  const [text, setText] = useState('48+24=72.\n#### 72'),
    [boxed, setBoxed] = useState(false);
  const result = M.extractNumber(text, boxed);
  return (
    <Figure id="D03" label="Literal response characters, chosen span and parsed rational">
      <div className="rlvr-tokens">
        {Array.from(text).map((character, index) => (
          <span
            className="rlvr-token"
            key={index}
            style={{
              '--entity':
                result.span && index >= result.span[0] && index < result.span[1]
                  ? M.roles.score
                  : M.roles.input,
            }}
          >
            <small>{index}</small>
            <b>{character === '\n' ? '↵' : character === ' ' ? '␠' : character}</b>
          </span>
        ))}
      </div>
      <p>
        Selected span: {result.span ? `[${result.span.join(', ')})` : 'none'} · rational object:{' '}
        <strong>{result.parsed || 'unknown'}</strong> · {result.reason}
      </p>
      <Controls>
        <Editable label="Raw response" value={text} onChange={setText} />
        <Check label="Use narrow boxed-number extractor" value={boxed} onChange={setBoxed} />
        <button
          onClick={() => {
            setText('\\boxed{\\frac{1}{2}}');
            setBoxed(true);
          }}
        >
          Nested fraction
        </button>
        <button
          onClick={() => {
            setText('#### 24\n#### 72');
            setBoxed(false);
          }}
        >
          Two markers
        </button>
        <Reset
          onClick={() => {
            setText('48+24=72.\n#### 72');
            setBoxed(false);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function VerifierOutcomeMatrix() {
  const [index, setIndex] = useState('0');
  return (
    <Figure id="D04" label="Actual parser/verifier outcomes on complete raw cases">
      <DataView file="mechanisms.json">
        {(data) => {
          const rows = data.math.rows,
            row = rows[Number(index)] || rows[0];
          return (
            <>
              <p style={{ color: M.roles.input }}>Gold source</p>
              <div className="rlvr-raw">{row.gold === null ? 'Gold unavailable' : row.gold}</div>
              <p>Raw prediction</p>
              <div className="rlvr-raw">{row.prediction}</div>
              <RLVRTable
                caption="Recorded Math-Verify and TRL 1.14.2; strict scratch contract shown separately"
                headers={['Operation', 'Gold object', 'Prediction object', 'Verdict / reward']}
                rows={[
                  [
                    'Direct Math-Verify',
                    row.gold_extracted.join(' ; ') || 'none',
                    row.prediction_extracted.join(' ; ') || 'none',
                    state(row.direct_accepted),
                  ],
                  [
                    'Strict final marker',
                    row.strict_final_marker.gold_parsed || 'unknown',
                    row.strict_final_marker.parsed || 'none',
                    `${state(row.strict_final_marker.accepted)}; ${row.strict_final_marker.reason}`,
                  ],
                  [
                    'TRL accuracy reward',
                    'Pinned extraction configuration',
                    'Anchored LaTeX configuration',
                    f(row.TRL_accuracy_reward),
                  ],
                ]}
              />
              <Controls>
                <Select
                  label="Recorded parser case"
                  value={index}
                  onChange={setIndex}
                  options={rows.map((item, i) => [String(i), item.name])}
                />
                <Reset onClick={() => setIndex('0')} />
              </Controls>
            </>
          );
        }}
      </DataView>
    </Figure>
  );
}
function ExpressionDrawing({ tree, x = 2, y = 3 }) {
  const nodes = [],
    edges = [];
  let leaf = 0;
  function place(node, depth) {
    const childNodes = node.left
      ? [place(node.left, depth + 1), place(node.right, depth + 1)]
      : node.child
        ? [place(node.child, depth + 1)]
        : [];
    const px = childNodes.length
      ? childNodes.reduce((sum, child) => sum + child.x, 0) / childNodes.length
      : 100 + leaf++ * 140;
    const item = { node, x: px, y: 50 + depth * 85, value: M.evaluateTree(node, x, y) };
    nodes.push(item);
    childNodes.forEach((child) => edges.push([item, child]));
    return item;
  }
  if (tree) place(tree, 0);
  return (
    <Svg height={360} label="Actual restricted expression tree and evaluated node values">
      {edges.map(([a, b], i) => (
        <Arrow key={i} x1={b.x} y1={b.y - 25} x2={a.x} y2={a.y + 25} />
      ))}
      {nodes.map((node, i) => (
        <g key={i}>
          <circle
            cx={node.x}
            cy={node.y}
            r="23"
            fill="#1c2029"
            stroke={node.node.kind === 'name' ? M.roles.input : M.roles.score}
          />
          <Text x={node.x} y={node.y + 4} anchor="middle">
            {node.node.value ??
              (node.node.kind === '*' ? '×' : node.node.kind === 'negate' ? '−' : node.node.kind)}
          </Text>
          <Text x={node.x + 32} y={node.y + 5} color={M.roles.score}>
            {node.value}
          </Text>
        </g>
      ))}
      {!tree && (
        <Text x={70} y={80}>
          No allowed AST: expression rejected.
        </Text>
      )}
    </Svg>
  );
}
export function FiniteTestsAndCounterexample() {
  const [expression, setExpression] = useState('x'),
    [strong, setStrong] = useState(false);
  const result = M.checkExpression(expression, strong);
  return (
    <Figure id="D05" label="Arithmetic AST, finite tests and new counterexample">
      <ExpressionDrawing tree={result.tree} />
      <p>Trace uses x=2,y=3. Required function: x+y.</p>
      <RLVRTable
        headers={['x', 'y', 'Expected', 'Candidate output', 'Test verdict']}
        rows={result.rows.map((row) => [
          row.x,
          row.y,
          row.expected,
          f(row.actual),
          row.passed ? 'pass' : 'fail',
        ])}
      />
      <p>
        Suite: {state(result.accepted)} · {result.reason}
      </p>
      <Controls>
        <Select
          label="Candidate expression"
          value={expression}
          onChange={setExpression}
          options={['x', 'x+y', 'x-y', 'x*y', ['call()', 'Unsupported call()']]}
        />
        <Check label="Add (2,3) → 5 counterexample test" value={strong} onChange={setStrong} />
        <Reset
          onClick={() => {
            setExpression('x');
            setStrong(false);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function ProofDerivationTree() {
  const [mode, setMode] = useState('valid');
  const left = mode === 'left' ? 'P' : 'Q',
    valid = mode === 'valid',
    result = M.proofCase(mode);
  return (
    <Figure id="D06" label="Actual conjunction elimination, introduction and assumption discharge">
      <Svg height={390} label="Proof tree with explicit binder scope">
        {mode !== 'scope' && (
          <path
            d="M70,75L70,295L560,295L560,75"
            fill="none"
            stroke={M.roles.input}
            strokeDasharray="5 4"
          />
        )}
        <Text x={80} y={50}>
          {mode === 'scope' ? 'No assumption binder' : 'Binder h : P ∧ Q'}
        </Text>
        <Text x={85} y={318}>
          {mode === 'scope'
            ? 'Binder removed: h lookup fails'
            : 'h is valid only inside this scope'}
        </Text>
        {[170, 450].map((x, i) => (
          <g key={x}>
            <Text x={x} y={95} anchor="middle" color={M.roles.input}>
              {mode === 'scope' ? 'h missing' : 'h : P ∧ Q'}
            </Text>
            <Arrow x1={x} y1={110} x2={x} y2={153} />
            <Text x={x} y={178} anchor="middle">
              {mode === 'scope' ? 'unknown' : i === 0 ? left : 'P'}
            </Text>
            <Text x={x} y={207} anchor="middle">
              {i === 0 && mode !== 'left' ? 'right elimination' : 'left elimination'}
            </Text>
            <Arrow x1={x} y1={223} x2={310} y2={250} />
          </g>
        ))}
        <Text x={310} y={275} anchor="middle" color={M.roles.score}>
          {mode === 'scope' ? 'unknown · lookup failed' : `${left} ∧ P · introduction`}
        </Text>
        <Arrow x1={310} y1={330} x2={310} y2={349} />
        <Text x={310} y={375} anchor="middle">
          {mode === 'scope' ? 'No derived implication' : `(P ∧ Q) → (${left} ∧ P)`}
        </Text>
      </Svg>
      <p>
        Required goal: (P∧Q)→(Q∧P). {result.accepted ? 'Accepted' : 'Rejected'}: {result.reason}.
      </p>
      <Controls>
        <Select
          label="Proof edit"
          value={mode}
          onChange={setMode}
          options={[
            ['valid', 'Right then left'],
            ['left', 'Left twice'],
            ['scope', 'Remove assumption binder'],
          ]}
        />
        <Reset onClick={() => setMode('valid')} />
      </Controls>
    </Figure>
  );
}
export function ResponseProbabilitySimplex() {
  const [a, setA] = useState(0.2),
    [b, setB] = useState(0.5);
  const p = [a, b, Math.max(0, 1 - a - b)],
    result = M.objective(p);
  const masses = result.probabilities,
    point = [
      100 * masses[0] + 520 * masses[1] + 310 * masses[2],
      250 * masses[0] + 250 * masses[1] + 55 * masses[2],
    ];
  return (
    <Figure id="D07" label="Three-response probability simplex and exact logit gradient">
      <Svg height={315} label="Probability simplex: A correct, C wrong, D malformed">
        <path d="M100,250L520,250L310,55Z" fill="none" stroke="#9aa1b0" />
        {[
          [100, 250, 'A: correct'],
          [520, 250, 'C: wrong'],
          [310, 55, 'D: malformed'],
        ].map(([x, y, label], i) => (
          <g key={label}>
            <circle cx={x} cy={y} r="6" fill={palette[[0, 2, 3][i]]} />
            <Text x={x} y={y === 55 ? 30 : 280} anchor="middle" color={palette[[0, 2, 3][i]]}>
              {label}
            </Text>
          </g>
        ))}
        <circle cx={point[0]} cy={point[1]} r="7" fill={M.roles.parameter} stroke="#fff" />
      </Svg>
      <Bars
        labels={['A probability', 'C probability', 'D probability']}
        values={masses}
        colors={[palette[0], palette[2], palette[3]]}
        maximum={1}
      />
      <p>Expected reward J = {f(result.value)}.</p>
      <Bars
        labels={['A logit derivative', 'C logit derivative', 'D logit derivative']}
        values={result.gradient}
        colors={[palette[0], palette[2], palette[3]]}
        signed
        maximum={0.3}
      />
      <Controls>
        <Range label="A raw mass" value={a} onChange={setA} />
        <Range label="C raw mass" value={b} onChange={setB} />
        <Reset
          onClick={() => {
            setA(0.2);
            setB(0.5);
          }}
        />
      </Controls>
      <p className="rlvr-note">
        If A+C exceed 1, D gets zero raw mass and all masses are renormalized; displayed
        probabilities are the actual simplex coordinates.
      </p>
    </Figure>
  );
}
export function CausalSampleAndGather() {
  const [eos, setEOS] = useState(true),
    [selected, setSelected] = useState(2);
  const ids = [258, 65, 259, 35, ...(eos ? [257] : []), 256],
    probabilities = eos ? [0.25, 0.5] : [0.25];
  const target = Math.min(selected + 1, ids.length - 1),
    included = target >= 3 && ids[target] !== 256;
  const probability = included ? probabilities[target - 3] : null;
  const sum = probabilities.reduce((value, p) => value + Math.log(p), 0);
  return (
    <Figure
      id="D08"
      label="Selected predictor and probability gather, included log-sum and detached reward route"
    >
      <Svg
        height={425}
        label="Actual target address selects a probability cell before summing response scores"
      >
        <Text x={45} y={28}>
          Constructed IDs · selected target {target}, predictor {target - 1}
        </Text>
        {ids.map((id, i) => (
          <g key={i}>
            <Text x={50 + i * 96} y={60} anchor="middle">
              {i}
            </Text>
            <rect
              x={22 + i * 96}
              y={80}
              width={56}
              height={35}
              fill="none"
              stroke={i < 3 ? M.roles.input : id === 256 ? M.roles.frozen : M.roles.score}
              strokeWidth={i === target || i === target - 1 ? 3 : 1}
            />
            <Text x={50 + i * 96} y={103} anchor="middle">
              {{ 258: 'BOS', 259: 'SEP', 257: 'EOS', 256: 'PAD' }[id] || id}
            </Text>
            {i < ids.length - 1 && (
              <Arrow
                x1={50 + i * 96}
                y1={127}
                x2={146 + i * 96}
                y2={158}
                color={
                  i + 1 === target
                    ? M.roles.parameter
                    : i >= 2 && ids[i + 1] !== 256
                      ? M.roles.score
                      : M.roles.frozen
                }
              />
            )}
          </g>
        ))}
        <Text x={45} y={191}>
          Gather from predictor {target - 1} softmax at target ID {ids[target]}
        </Text>
        <rect
          x={45}
          y={210}
          width={210}
          height={40}
          fill="none"
          stroke={included ? M.roles.score : M.roles.frozen}
        />
        <Text x={150} y={235} anchor="middle">
          {included ? `Selected p = ${probability}` : 'Excluded context / PAD'}
        </Text>
        <Text x={380} y={234} color={M.roles.frozen}>
          Terminal reward R = 1 · detached
        </Text>
        <Arrow x1={150} y1={252} x2={150} y2={287} color={M.roles.score} dashed={!included} />
        <Text x={150} y={311} anchor="middle">
          Σ included log p = {f(sum)}
        </Text>
        <Arrow x1={480} y1={252} x2={300} y2={335} dashed />
        <Arrow x1={150} y1={322} x2={300} y2={335} color={M.roles.score} />
        <Text x={300} y={359} anchor="middle">
          R × ∇ log π(response | prompt)
        </Text>
        <Arrow x1={300} y1={369} x2={300} y2={392} color={M.roles.parameter} />
        <Text x={300} y={417} anchor="middle" color={M.roles.parameter}>
          Shared trainable parameter θ
        </Text>
      </Svg>
      <Tokens
        ids={ids.slice(1)}
        mask={M.responseMask(3, probabilities.length, ids.length)}
        selected={target - 1}
        onSelect={setSelected}
        offset={1}
      />
      <p>
        Selected target {target}:{' '}
        {included
          ? `included, log p = ${f(Math.log(probability))}`
          : 'excluded, no response-score contribution'}
        . Product {probabilities.join(' × ')} = {f(probabilities.reduce((a, b) => a * b, 1))}; log
        of product = sum of included logs = {f(sum)}.
      </p>
      <Controls>
        <Check
          label="Include genuine generated EOS"
          value={eos}
          onChange={(value) => {
            setEOS(value);
            setSelected(2);
          }}
        />
        <Reset
          onClick={() => {
            setEOS(true);
            setSelected(2);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function GroupSamplingTree() {
  const [caseName, setCase] = useState('mixed');
  const rewards =
    caseName === 'mixed' ? [1, 0, 1, 0] : caseName === 'pass' ? [1, 1, 1, 1] : [0, 0, 0, 0];
  return (
    <Figure id="D09" label="One prompt and four independently sampled response branches">
      <Svg height={250} label="Prompt-local group ancestry">
        <Text x={320} y={32} anchor="middle" color={M.roles.input}>
          Same complete Natalia prompt x
        </Text>
        {rewards.map((r, i) => (
          <g key={i}>
            <Arrow x1={320} y1={48} x2={80 + i * 160} y2={111} color={palette[i]} />
            <Text x={80 + i * 160} y={138} anchor="middle" color={palette[i]}>
              Response {'ABCD'[i]}
            </Text>
            <Text x={80 + i * 160} y={169} anchor="middle">
              {r ? '#### 72' : '#### 24'}
            </Text>
            <Text x={80 + i * 160} y={205} anchor="middle">
              reward {r}
            </Text>
          </g>
        ))}
      </Svg>
      <p>
        Prompt-local mean: {f(rewards.reduce((a, b) => a + b, 0) / 4)}. These displayed responses
        are a constructed group, separate from the measured study.
      </p>
      <Controls>
        <Select
          label="Constructed group"
          value={caseName}
          onChange={setCase}
          options={['mixed', ['pass', 'All pass'], ['fail', 'All fail']]}
        />
        <Reset onClick={() => setCase('mixed')} />
      </Controls>
    </Figure>
  );
}
export function CenteredAndScaledContributions() {
  const [mode, setMode] = useState('mixed'),
    [sample, setSample] = useState(false),
    [epsilon, setEpsilon] = useState(0);
  const rewards = {
    mixed: [1, 0, 1, 0],
    fail: [0, 0, 0, 0],
    pass: [1, 1, 1, 1],
    missing: [1, 0, null, 0],
    one: [1, null, null, null],
    none: [null, null, null, null],
  }[mode];
  const result = M.groupStatistics(rewards, { sample, epsilon });
  return (
    <Figure
      id="D10"
      label="Same reward rows through mean, centered values and normalized coefficients"
    >
      <RLVRTable
        headers={['Response', 'Reward', 'Subtract mean', 'Divide by scale', 'Coefficient']}
        rows={rewards.map((r, i) => [
          <span style={{ color: palette[i] }}>{'ABCD'[i]}</span>,
          f(r),
          f(result.centered[i]),
          `${f(result.std)} + ${epsilon}`,
          f(result.advantages[i]),
        ])}
      />
      <p>
        Available rows {result.count}; mean {f(result.mean)}; {sample ? 'sample' : 'population'} SD{' '}
        {f(result.std)}. Missing rows receive coefficient 0, not a false-failure label.
      </p>
      <Bars labels={['A', 'B', 'C', 'D']} values={result.advantages} signed maximum={2} />
      <Controls>
        <Select
          label="Reward pattern"
          value={mode}
          onChange={setMode}
          options={[
            'mixed',
            ['fail', 'All fail'],
            ['pass', 'All pass'],
            ['missing', 'One missing'],
            ['one', 'One available'],
            ['none', 'No available rewards'],
          ]}
        />
        <Check label="Sample standard deviation (G−1)" value={sample} onChange={setSample} />
        <Check
          label="Add .0001 to scale"
          value={epsilon > 0}
          onChange={(value) => setEpsilon(value ? 0.0001 : 0)}
        />
        <Reset
          onClick={() => {
            setMode('mixed');
            setSample(false);
            setEpsilon(0);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function BaselineEnumeration() {
  const [p, setP] = useState(0.25),
    [size, setSize] = useState('4');
  const result = M.enumerateBaselines(p, Number(size));
  return (
    <Figure
      id="D11"
      label="Every binary outcome group with its probability and actual score estimator"
    >
      <RLVRTable
        headers={['All outcomes', 'IID mass', 'Raw', 'Same-group', 'Leave-one-out', 'Standardized']}
        rows={result.rows.map((row) => [
          row.outcomes.join(' '),
          f(row.probability),
          f(row.raw),
          f(row.same),
          f(row.loo),
          f(row.standardized),
        ])}
      />
      <RLVRTable
        headers={['Estimator', 'Expected logit gradient', 'Estimator variance']}
        rows={Object.entries(result.moments).map(([name, value]) => [
          name,
          f(value.mean),
          f(value.variance),
        ])}
      />
      <p>
        Exact return derivative p(1−p) = {f(p * (1 - p))}; same-group factor ={' '}
        {f(1 - 1 / Number(size))}.
      </p>
      <Controls>
        <Range label="Success probability p" value={p} onChange={setP} min={0.05} max={0.95} />
        <Select
          label="Group size G"
          value={size}
          onChange={setSize}
          options={['2', '3', '4', '5']}
        />
        <Reset
          onClick={() => {
            setP(0.25);
            setSize('4');
          }}
        />
      </Controls>
    </Figure>
  );
}
export function PolicySnapshotAddresses() {
  const [current, setCurrent] = useState(0.4),
    [old, setOld] = useState(0.4),
    [reference, setReference] = useState(0.5);
  return (
    <Figure id="D12" label="Three separate policy distributions at one identical sampled target">
      <div className="rlvr-three">
        {[
          ['Current', current, M.roles.parameter],
          ['Old rollout', old, palette[0]],
          ['Reference', reference, M.roles.frozen],
        ].map(([name, value, color]) => (
          <div key={name} className="rlvr-entity" style={{ '--entity': color }}>
            <p style={{ color }}>{name}</p>
            <Bars
              labels={['Sampled ID', 'Other ID']}
              values={[value, 1 - value]}
              colors={[color, color]}
              maximum={1}
            />
            <p>Sampled log p = {f(Math.log(value))}</p>
            <p>{name === 'Current' ? 'Trainable derivative path' : 'Detached values'}</p>
          </div>
        ))}
      </div>
      <Svg height={125} label="Current-over-old ratio with separate reference comparison">
        <Text x={95} y={28} color={M.roles.parameter}>
          current p
        </Text>
        <Text x={300} y={28} color={palette[0]}>
          old p
        </Text>
        <Text x={530} y={28} color={M.roles.frozen}>
          reference q
        </Text>
        <Arrow x1={120} y1={40} x2={220} y2={80} color={M.roles.parameter} />
        <Arrow x1={120} y1={40} x2={415} y2={80} color={M.roles.parameter} />
        <Arrow x1={310} y1={40} x2={220} y2={80} dashed />
        <Arrow x1={520} y1={40} x2={415} y2={80} dashed />
        <Text x={200} y={110} anchor="middle">
          ρ = {f(current / old)}
        </Text>
        <Text x={425} y={110} anchor="middle">
          q/p = {f(reference / current)}
        </Text>
      </Svg>
      <p>
        ρ uses current p / stored old p. The reference comparison uses fixed q / current p; current
        p enters both objects through its trainable path.
      </p>
      <Controls>
        <Range
          label="Current sampled probability"
          value={current}
          onChange={setCurrent}
          min={0.05}
          max={0.95}
        />
        <Range label="Stored old probability" value={old} onChange={setOld} min={0.05} max={0.95} />
        <Range
          label="Reference probability"
          value={reference}
          onChange={setReference}
          min={0.05}
          max={0.95}
        />
        <Reset
          onClick={() => {
            setCurrent(0.4);
            setOld(0.4);
            setReference(0.5);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function SignedClipGeometry() {
  const [ratio, setRatio] = useState(1.4),
    [advantage, setAdvantage] = useState('1');
  const a = Number(advantage),
    result = M.clippedTerm(ratio, a);
  const xs = Array.from({ length: 81 }, (_, i) => i / 40);
  return (
    <Figure id="D13" label="Positive and negative signed clipping curves with live ratio">
      <PlotPair ratio={ratio} xs={xs} />
      <p>
        A={a}; ratio={f(ratio)}; surrogate={f(result.value)}; loss={f(-result.value)}. Ratio
        derivative of this loss:{' '}
        {result.boundary ? 'kink; depends on chosen subgradient' : f(-result.derivative)}.
      </p>
      <RLVRTable
        headers={['ρ', 'A', 'Term', 'Mean-surrogate derivative']}
        rows={[
          [1.4, 1],
          [0.6, -1],
          [0.9, 1],
          [1.1, -1],
        ].map(([r, a]) => [
          r,
          a,
          f(M.clippedTerm(r, a).value),
          f(M.clippedTerm(r, a).derivative / 4),
        ])}
      />
      <Controls>
        <Range label="Ratio ρ" value={ratio} onChange={setRatio} min={0} max={2} step={0.1} />
        <Select
          label="Coefficient A"
          value={advantage}
          onChange={setAdvantage}
          options={['1', '-1']}
        />
        <Reset
          onClick={() => {
            setRatio(1.4);
            setAdvantage('1');
          }}
        />
      </Controls>
    </Figure>
  );
}
function PlotPair({ ratio, xs }) {
  return (
    <Svg
      height={320}
      label="Two signed surrogates; plateau starts at 1.2 for positive A and .8 for negative A"
    >
      {[1, -1].map((a, i) => {
        const x = (value) => 70 + value * 235,
          y = (value) => (i === 0 ? 140 - value * 65 : 190 - value * 50);
        return (
          <g key={a}>
            <Line x1={70} y1={i === 0 ? 140 : 190} x2={540} y2={i === 0 ? 140 : 190} />
            <rect
              x={x(0.8)}
              y={i === 0 ? 35 : 175}
              width={x(1.2) - x(0.8)}
              height={100}
              fill="#edbc6918"
            />
            <polyline
              points={xs.map((r) => `${x(r)},${y(M.clippedTerm(r, a).value)}`).join(' ')}
              fill="none"
              stroke={palette[i]}
              strokeWidth="2.5"
            />
            <circle
              cx={x(ratio)}
              cy={y(M.clippedTerm(ratio, a).value)}
              r="5"
              fill={palette[i]}
              stroke="#fff"
            />
            <Text x={70} y={i === 0 ? 25 : 167} color={palette[i]}>
              A={a}: surrogate s(ρ,A)
            </Text>
          </g>
        );
      })}
      <Text x={70} y={305}>
        ρ=0
      </Text>
      <Text x={258} y={305}>
        .8
      </Text>
      <Text x={352} y={305}>
        1.2
      </Text>
      <Text x={535} y={305}>
        2
      </Text>
    </Svg>
  );
}
export function TokenReductionGeometry() {
  const [length, setLength] = useState(6),
    [zero, setZero] = useState(false);
  const lengths = zero ? [0, 0] : [2, length],
    values = [1, 3],
    result = M.tokenReduction(lengths, values, 6);
  return (
    <Figure id="D14" label="Two literal token meshes and three distinct reduction denominators">
      <div className="rlvr-columns">
        {lengths.map((n, i) => (
          <div key={i} className="rlvr-entity" style={{ '--entity': palette[i] }}>
            <p>
              Response {'AB'[i]} · {n} included tokens
            </p>
            <div className="rlvr-tokens">
              {Array.from({ length: n }, (_, j) => (
                <span className="rlvr-token" key={j} style={{ '--entity': palette[i] }}>
                  <small>t={j + 1}</small>
                  <b>{values[i]}</b>
                </span>
              ))}
            </div>
            {n === 0 && <p>No included targets.</p>}
          </div>
        ))}
      </div>
      <RLVRTable
        headers={['Reduction', 'Numerator', 'Denominator', 'Value']}
        rows={[
          [
            'Equal response means',
            zero ? 'no response means' : '1 + 3',
            zero ? '0 available responses' : '2 responses',
            f(result.response),
          ],
          ['Pooled tokens', result.numerator, `${result.tokens} included tokens`, f(result.pooled)],
          ['Fixed cap', result.numerator, '2 responses × 6 positions', f(result.fixed)],
        ]}
      />
      <Controls>
        <Range
          label="Response B token length"
          disabled={zero}
          value={length}
          onChange={setLength}
          min={1}
          max={6}
          step={1}
        />
        <Check label="Exclude every target" value={zero} onChange={setZero} />
        <Reset
          onClick={() => {
            setLength(6);
            setZero(false);
          }}
        />
      </Controls>
    </Figure>
  );
}

export function ExactFiniteKL() {
  const [p, setP] = useState(0.8),
    [q, setQ] = useState(0.5),
    result = M.klRoutes(p, q);
  return (
    <Figure id="D15" label="Directed finite policy-to-reference KL with signed terms">
      <div className="rlvr-columns">
        <Bars labels={['Policy action 1', 'Policy action 2']} values={result.masses} maximum={1} />
        <Bars
          labels={['Reference action 1', 'Reference action 2']}
          values={result.reference}
          maximum={1}
          colors={[M.roles.frozen, M.roles.frozen]}
        />
      </div>
      <Bars
        labels={['p₁ log(p₁/q₁)', 'p₂ log(p₂/q₂)']}
        values={result.terms}
        signed
        maximum={Math.max(1, ...result.terms.filter(Number.isFinite).map(Math.abs))}
      />
      <p>
        Policy ∥ reference KL = <strong>{f(result.value)}</strong> nats; exact derivative with
        respect to the policy logit = {f(result.exactDerivative)}.
      </p>
      <p>
        {Number.isFinite(result.value)
          ? 'Zero policy mass contributes zero; individual terms may be negative.'
          : 'Positive policy mass outside reference support: divergence is infinite.'}
      </p>
      <Controls>
        <Range label="Policy first-action mass p" value={p} onChange={setP} />
        <Range label="Reference first-action mass q" value={q} onChange={setQ} />
        <button onClick={() => setQ(p)}>Match distributions</button>
        <button
          onClick={() => {
            setP(1);
            setQ(0);
          }}
        >
          Missing reference support
        </button>
        <Reset
          onClick={() => {
            setP(0.8);
            setQ(0.5);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function SampledK3AndGradientRoutes() {
  const [p, setP] = useState(0.8),
    [q, setQ] = useState(0.5),
    result = M.klRoutes(p, q);
  return (
    <Figure id="D16" label="Three derivative graphs with the same matched forward expectation">
      <Svg height={430} label="Exact weights, detached weights and differentiable importance ratio">
        {['Exact expectation', 'Detached sample', 'Ratio weighted'].map((name, i) => {
          const y = 70 + i * 125;
          return (
            <g key={name}>
              <Text x={30} y={y - 35}>
                {name}
              </Text>
              <circle cx={90} cy={y} r="19" fill="none" stroke={M.roles.parameter} />
              <Text x={90} y={y + 4} anchor="middle" color={M.roles.parameter}>
                p
              </Text>
              <circle cx={285} cy={y} r="22" fill="none" stroke={M.roles.score} />
              <Text x={285} y={y + 4} anchor="middle">
                {i === 0 ? 'log' : 'k₃'}
              </Text>
              <circle cx={490} cy={y} r="23" fill="none" stroke={M.roles.score} />
              <Text x={490} y={y + 4} anchor="middle">
                Σ
              </Text>
              <Arrow x1={110} y1={y} x2={261} y2={y} />
              <Arrow x1={310} y1={y} x2={465} y2={y} />
              <path
                d={`M90,${y + 22}V${y + 40}H490V${y + 24}`}
                fill="none"
                stroke={M.roles.parameter}
                strokeDasharray={i === 1 ? '4 5' : undefined}
              />
              <Text
                x={285}
                y={y + 62}
                anchor="middle"
                color={i === 1 ? M.roles.frozen : M.roles.parameter}
              >
                {i === 1
                  ? 'p weights detached'
                  : i === 2
                    ? 'pold × (p / pold) weights'
                    : 'p weights differentiate'}
              </Text>
            </g>
          );
        })}
      </Svg>
      <RLVRTable
        headers={['Action', 'p mass', 'q/p', 'k₃', 'Weighted contribution']}
        rows={result.masses.map((mass, i) => [
          i + 1,
          f(mass),
          f(result.reference[i] / mass),
          f(result.k3[i]),
          f(mass === 0 ? 0 : mass * result.k3[i]),
        ])}
      />
      <RLVRTable
        headers={['Derivative route', 'Forward value', 'Policy-logit derivative']}
        rows={[
          ['Exact expectation', f(result.value), f(result.exactDerivative)],
          [
            'Fixed samples; p weights detached',
            f(result.sampledValue),
            f(result.partialDerivative),
          ],
          ['Differentiable ratio, old=current', f(result.sampledValue), f(result.exactDerivative)],
        ]}
      />
      <p>
        Reference q is fixed. Solid amber weight route differentiates; dashed amber route is
        detached. Values agree under matched sampling/support, derivatives need not.
      </p>
      <Controls>
        <Range label="Current probability p" value={p} onChange={setP} min={0.05} max={0.95} />
        <Range label="Reference probability q" value={q} onChange={setQ} min={0.05} max={0.95} />
        <Reset
          onClick={() => {
            setP(0.8);
            setQ(0.5);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function AnySuccessVersusMixedGroup() {
  const [p, setP] = useState(0.25),
    [size, setSize] = useState('4'),
    g = Number(size),
    result = M.samplingEvents(p, g);
  const points = Array.from({ length: 101 }, (_, i) => i / 100),
    rows = M.enumerateBaselines(p, g).rows;
  return (
    <Figure
      id="D17"
      label="Literal outcome groups and distinct any-success/mixed event probabilities"
    >
      <Plot
        series={[
          { color: palette[0], points: points.map((x) => [x, M.samplingEvents(x, g).any]) },
          { color: palette[1], points: points.map((x) => [x, M.samplingEvents(x, g).mixed]) },
        ]}
        xLabel="Per-response pass probability p"
        yLabel="IID group event probability"
        point={{ x: p }}
      />
      <p>
        <span style={{ color: palette[0] }}>Blue: any success</span> ·{' '}
        <span style={{ color: palette[1] }}>Rose: mixed rewards</span>
      </p>
      <Cells
        values={[result.failure, result.mixed, result.success, result.any]}
        labels={['All fail', 'Mixed', 'All pass', 'Any pass']}
      />
      <RLVRTable
        headers={['Binary group', 'Event membership', 'IID probability']}
        rows={rows.map((row) => [
          row.outcomes.join(' '),
          row.outcomes.every((r) => r === 0)
            ? 'All fail'
            : row.outcomes.every((r) => r === 1)
              ? 'All pass; any pass'
              : 'Mixed; any pass',
          f(row.probability),
        ])}
      />
      <Controls>
        <Range label="Success probability p" value={p} onChange={setP} />
        <Select
          label="Group size G"
          value={size}
          onChange={setSize}
          options={['2', '3', '4', '5']}
        />
        <button onClick={() => setP(0.9)}>High success .9</button>
        <Reset
          onClick={() => {
            setP(0.25);
            setSize('4');
          }}
        />
      </Controls>
    </Figure>
  );
}
export function SupportAndEntropy() {
  const [temperature, setTemperature] = useState(1),
    [topK, setTopK] = useState('0'),
    result = M.samplingDistribution(temperature, Number(topK));
  return (
    <Figure id="D18" label="Temperature-scaled response masses and support deletion">
      <Bars
        labels={['A: correct 72', 'C: wrong 24', 'D: malformed']}
        values={result.probabilities}
        colors={[palette[0], palette[2], palette[3]]}
        maximum={1}
      />
      <div className="rlvr-tokens">
        {result.probabilities.map((p, i) => (
          <span key={i} className="rlvr-token" style={{ '--entity': palette[[0, 2, 3][i]] }}>
            <b>{'ACD'[i]}</b>
            <small>{p > 0 ? 'in support' : 'zero support'}</small>
          </span>
        ))}
      </div>
      <p>
        Entropy = {f(result.entropy)} nats; expected answer reward = {f(result.expectedReward)}.
        Reward is attached only to A.
      </p>
      <Controls>
        <Range
          label="Temperature T"
          value={temperature}
          onChange={setTemperature}
          min={0.1}
          max={3}
          step={0.1}
        />
        <Select
          label="Top-k response support"
          value={topK}
          onChange={setTopK}
          options={[['0', 'No truncation'], '1', '2', '3']}
        />
        <Reset
          onClick={() => {
            setTemperature(1);
            setTopK('0');
          }}
        />
      </Controls>
      <p className="rlvr-note">
        This three-action response illustration opens the support operation; the real program
        samples token distributions over 260 addresses.
      </p>
    </Figure>
  );
}
export function PromptSelectionAndContrast() {
  const [strategy, setStrategy] = useState('uniform'),
    [step, setStep] = useState(1),
    [theta, setTheta] = useState(0),
    [difficulty, setDifficulty] = useState(-2);
  return (
    <Figure
      id="D19"
      label="Editable finite shared-parameter simulator with fixed original random tape"
    >
      <DataView file="mechanisms.json">
        {(data) => {
          const simulation = M.finiteScheduler(strategy, data.finiteUniformTape, theta, [
              difficulty,
              1,
            ]),
            row = simulation.history[step - 1],
            counts = [0, 0];
          simulation.history.slice(0, step).forEach((item) => counts[item.task]++);
          return (
            <>
              <Svg height={235} label="One shared theta feeding two task-conditioned probabilities">
                <circle cx={320} cy={50} r="23" fill="none" stroke={M.roles.parameter} />
                <Text x={320} y={54} anchor="middle">
                  θ
                </Text>
                <Text x={365} y={55} color={M.roles.parameter}>
                  {f(row.theta_before)}
                </Text>
                {[0, 1].map((i) => (
                  <g key={i}>
                    <Arrow x1={320} y1={76} x2={160 + i * 320} y2={118} />
                    <Text x={160 + i * 320} y={145} anchor="middle" color={palette[i]}>
                      Task {i + 1}: offset {simulation.task_offsets[i]}
                    </Text>
                    <Text x={160 + i * 320} y={180} anchor="middle">
                      p = {f(row.probabilities[i])}
                    </Text>
                    <Text x={160 + i * 320} y={212} anchor="middle">
                      Selected {counts[i]} times so far
                    </Text>
                  </g>
                ))}
              </Svg>
              <Bars
                labels={['Task 1 sampling share', 'Task 2 sampling share']}
                values={row.proposed_weights}
                maximum={1}
              />
              <RLVRTable
                headers={['Task', 'Pass probability', 'Mixed-group probability', 'Selected now']}
                rows={[0, 1].map((i) => [
                  i + 1,
                  f(row.probabilities[i]),
                  f(row.mixed_probabilities[i]),
                  row.task === i ? 'yes' : 'no',
                ])}
              />
              <p>
                Sampled outcomes {row.outcomes.join(' ')}; same-group gradient{' '}
                {f(row.same_group_logit_gradient)}; θ after {f(row.theta_after)}. Final task counts{' '}
                {simulation.task_counts.join(' / ')}.
              </p>
              <p>
                After all 24 finite steps: θ = {f(simulation.history.at(-1).theta_after)}; task
                probabilities ={' '}
                {simulation.task_offsets
                  .map((offset) =>
                    f(1 / (1 + Math.exp(-simulation.history.at(-1).theta_after - offset))),
                  )
                  .join(' / ')}
                .
              </p>
              <Controls>
                <Select
                  label="Finite strategy"
                  value={strategy}
                  onChange={setStrategy}
                  options={['uniform', 'easy-first', 'mixed-rate']}
                />
                <Range
                  label="Finite step"
                  value={step}
                  onChange={setStep}
                  min={1}
                  max={24}
                  step={1}
                />
                <Range
                  label="Starting shared theta"
                  value={theta}
                  onChange={setTheta}
                  min={-2}
                  max={2}
                  step={0.25}
                />
                <Range
                  label="Task 1 logit offset"
                  value={difficulty}
                  onChange={setDifficulty}
                  min={-4}
                  max={0}
                  step={0.25}
                />
                <Reset
                  onClick={() => {
                    setStrategy('uniform');
                    setStep(1);
                    setTheta(0);
                    setDifficulty(-2);
                  }}
                />
              </Controls>
              <p className="rlvr-note">
                Finite Bernoulli calculation, same 120 uniforms from original Python seed 11.
                Defaults reproduce the retained finite histories; edited parameters construct a new
                finite illustration, not neural or GSM8K training.
              </p>
            </>
          );
        }}
      </DataView>
    </Figure>
  );
}
export function VerifiedSelectionLineage() {
  const [mode, setMode] = useState('mixed');
  const texts = M.exampleResponses.map((text) =>
      mode === 'none' ? text.replace(/#### 72/g, '#### 24') : text,
    ),
    rewards = texts.map((text) => M.verdict(text, '72').reward),
    coeff = M.groupStatistics(rewards, { scaled: false }).advantages;
  const kept = rewards.flatMap((r, i) => (r ? [i] : []));
  return (
    <Figure
      id="D20"
      label="Complete supplied responses, exact retained target IDs and explicit constructed provenance"
    >
      <p style={{ color: M.roles.input }}>{M.taskQuestion}</p>
      <p>
        Constructed lineage: checkpoint W_demo · prompt Natalia · candidates A–D supplied as
        examples · sampling seed not applicable · strict final-marker numeric contract, gold 72.
      </p>
      <div className="rlvr-columns">
        {texts.map((text, i) => (
          <div className="rlvr-entity" key={i} style={{ '--entity': palette[i] }}>
            <p style={{ color: palette[i] }}>
              Response {'ABCD'[i]} · {rewards[i] ? 'retained' : 'discarded'}
            </p>
            <div className="rlvr-raw">{text}</div>
            <p>
              Reward {rewards[i]}; centred PG coefficient {f(coeff[i])}.
            </p>
          </div>
        ))}
      </div>
      <Svg
        height={290}
        label="Identity-preserving accepted response wires into actual selected SFT rows"
      >
        {rewards.map((r, i) => (
          <g key={i}>
            <Text x={90} y={35 + i * 58} color={palette[i]}>
              W_demo / Natalia / {'ABCD'[i]}
            </Text>
            <Arrow
              x1={295}
              y1={30 + i * 58}
              x2={470}
              y2={30 + i * 58}
              color={palette[i]}
              dashed={!r}
            />
            <Text x={490} y={35 + i * 58}>
              {r ? 'target kept' : 'no target'}
            </Text>
          </g>
        ))}
        <Text x={90} y={280}>
          Solid retained sequence; dashed rejected sequence.
        </Text>
      </Svg>
      {kept.map((i) => (
        <div key={i} className="rlvr-entity" style={{ '--entity': palette[i] }}>
          <p>Exact response target {'ABCD'[i]} plus EOS; prompt and PAD excluded</p>
          <div className="rlvr-raw">{[...new TextEncoder().encode(texts[i]), 257].join(', ')}</div>
        </div>
      ))}
      <p>
        {kept.length
          ? `${kept.length} retained responses: one selected-set likelihood update. B's full wrong derivation becomes a target because its final 72 passes.`
          : 'No accepted response: no response targets and no optimizer update.'}
      </p>
      <Controls>
        <Select
          label="Selection case"
          value={mode}
          onChange={setMode}
          options={['mixed', ['none', 'All numeric answers wrong']]}
        />
        <Reset onClick={() => setMode('mixed')} />
      </Controls>
    </Figure>
  );
}
export function AcceptanceConfusionMatrix() {
  const [p, setP] = useState(0.2),
    [fp, setFP] = useState(0.1),
    [fn, setFN] = useState(0.2),
    result = M.confusion(p, fp, fn);
  return (
    <Figure id="D21" label="Constructed truth by acceptance mass and precision denominator">
      <div className="rlvr-grid" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>
        {[
          ['True success / accepted', result.cells[0][0]],
          ['True success / rejected', result.cells[0][1]],
          ['True failure / accepted', result.cells[1][0]],
          ['True failure / rejected', result.cells[1][1]],
        ].map(([name, mass], i) => (
          <div
            className="rlvr-cell"
            key={name}
            style={{
              borderColor: palette[Math.floor(i / 2)],
              background: `${palette[Math.floor(i / 2)]}22`,
            }}
          >
            <span>{name}</span>
            <strong>
              {f(mass)} mass · {f(mass * 100)} of 100
            </strong>
          </div>
        ))}
      </div>
      <p>
        Accepted mass {f(result.accepted)}; precision = true-success accepted / all accepted ={' '}
        {f(result.precision)}.
      </p>
      <p>
        FP denominator: true failures; FN denominator: true successes. Truth is supplied for this
        construction.
      </p>
      <Controls>
        <Range label="True-success prevalence" value={p} onChange={setP} />
        <Range label="False-positive rate" value={fp} onChange={setFP} />
        <Range label="False-negative rate" value={fn} onChange={setFN} />
        <Reset
          onClick={() => {
            setP(0.2);
            setFP(0.1);
            setFN(0.2);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function AffineRewardCorrection() {
  const [fp, setFP] = useState(0.1),
    [fn, setFN] = useState(0.2),
    [epsilon, setEpsilon] = useState(0),
    result = M.correctedRewards([1, 0, 1, 0], fp, fn, epsilon);
  return (
    <Figure
      id="D22"
      label="Observed rewards, oracle affine correction and exact normalized coefficients"
    >
      <RLVRTable
        headers={[
          'Response',
          'Observed reward',
          'Corrected reward',
          'Raw normalized',
          'Corrected normalized',
        ]}
        rows={[1, 0, 1, 0].map((r, i) => [
          'ABCD'[i],
          r,
          f(result.corrected?.[i]),
          f(result.raw.advantages[i]),
          f(result.transformed?.advantages[i]),
        ])}
      />
      <div className="rlvr-columns">
        <Bars
          labels={['A raw', 'B raw', 'C raw', 'D raw']}
          values={result.raw.advantages}
          signed
          maximum={2}
        />
        <Bars
          labels={['A corrected', 'B corrected', 'C corrected', 'D corrected']}
          values={result.transformed?.advantages || [null, null, null, null]}
          signed
          maximum={2}
        />
      </div>
      <p>
        Scale 1−FP−FN = {f(result.scale)}.{' '}
        {result.corrected
          ? `Raw SD ${f(result.raw.std)}; corrected SD ${f(result.transformed.std)}; fixed epsilon ${epsilon}.`
          : 'Nonpositive scale: this positive-affine normalization comparison is unavailable.'}
      </p>
      <Controls>
        <Range label="Known FP rate" value={fp} onChange={setFP} />
        <Range label="Known FN rate" value={fn} onChange={setFN} />
        <Check
          label="Fixed epsilon .0001"
          value={epsilon > 0}
          onChange={(value) => setEpsilon(value ? 0.0001 : 0)}
        />
        <Reset
          onClick={() => {
            setFP(0.1);
            setFN(0.2);
            setEpsilon(0);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function CorrelatedTestOutcomeGrid() {
  const [mode, setMode] = useState('none'),
    result = M.corruptionGrid(mode);
  return (
    <Figure id="D23" label="Four response identities by three tests with literal corruption masks">
      <div className="rlvr-columns">
        {[
          ['Clean tests', result.clean],
          ['Edited tests', result.edited],
        ].map(([name, grid]) => (
          <div key={name}>
            <p>{name} · test columns 1,2,3</p>
            <div className="rlvr-grid" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
              {grid.flatMap((row, i) =>
                row.map((value, j) => (
                  <div
                    className="rlvr-cell"
                    key={`${i}-${j}`}
                    style={{
                      borderColor: palette[i],
                      outline:
                        name === 'Edited tests' && result.mask[i][j] ? '2px solid #fff' : 'none',
                      background: value ? `${palette[i]}44` : 'transparent',
                    }}
                  >
                    <small>
                      {'ABCD'[i]} / T{j + 1}
                    </small>
                    <strong>{value}</strong>
                  </div>
                )),
              )}
            </div>
          </div>
        ))}
      </div>
      <RLVRTable
        headers={['Response', 'Mean test reward', 'Centered reward', 'Normalized coefficient']}
        rows={result.rewards.map((r, i) => [
          'ABCD'[i],
          f(r),
          f(result.centered[i]),
          f(result.advantages[i]),
        ])}
      />
      <Controls>
        <Select
          label="Corruption pattern"
          value={mode}
          onChange={setMode}
          options={[
            ['none', 'No corruption'],
            ['cell', 'One cell'],
            ['row', 'Whole first response'],
            ['column', 'Middle test column'],
            ['all', 'Whole-group complement'],
          ]}
        />
        <Reset onClick={() => setMode('none')} />
      </Controls>
      <p className="rlvr-note">
        White outline identifies flipped cells while row hues preserve response identity. Rewards
        and coefficients come from this exact edited grid.
      </p>
    </Figure>
  );
}
export function SpecificationCounterexampleTrace() {
  const [kind, setKind] = useState('answer'),
    [strong, setStrong] = useState(false);
  const cases = {
    answer: [
      '48/2=20; 48+20=68.\n#### 72',
      'Final number equals 72',
      'Correct derivation plus final answer',
    ],
    tests: [
      'Candidate x, checked only at y=0',
      'Pass the two supplied tests',
      'Also pass (2,3) → 5',
    ],
    format: [
      '<answer></answer>',
      'Opening and closing answer delimiters',
      'Nonempty numeric answer to the task',
    ],
  };
  const row = cases[kind];
  return (
    <Figure id="D24" label="Concrete accepted property and first differing stronger specification">
      <div className="rlvr-raw">{row[0]}</div>
      <RLVRTable
        headers={['Declared property', 'Verdict', 'What established it']}
        rows={[
          [
            row[1],
            'accepted',
            kind === 'answer'
              ? 'Exact final numeric comparison'
              : kind === 'tests'
                ? 'Supplied y=0 tests'
                : 'Delimiter pattern',
          ],
          [
            row[2],
            strong ? 'rejected' : 'not checked',
            strong
              ? 'Constructed explicit counterexample or supplied reasoning annotation'
              : 'Outside the weak contract',
          ],
        ]}
      />
      <p>
        {strong
          ? 'The stronger intended property exposes the gap.'
          : 'High weak-contract reward does not establish the stronger intended property.'}{' '}
        This supplied counterexample does not infer a model's intent.
      </p>
      <Controls>
        <Select
          label="Counterexample object"
          value={kind}
          onChange={setKind}
          options={[
            ['answer', 'Final answer / derivation'],
            ['tests', 'Finite program tests'],
            ['format', 'Empty answer pattern'],
          ]}
        />
        <Check label="Apply the stronger stated contract" value={strong} onChange={setStrong} />
        <Reset
          onClick={() => {
            setKind('answer');
            setStrong(false);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function ReasoningAnswerJointMass() {
  const [pc, setPC] = useState(0.25),
    [alpha, setAlpha] = useState(0.8),
    [b, setB] = useState(0.2),
    result = M.reasoningMass(pc, alpha, b);
  const rows = [
    { height: 200 * pc, y: 50, probability: alpha, colors: [palette[0], palette[1]] },
    { height: 200 * (1 - pc), y: 50 + 200 * pc, probability: b, colors: [palette[2], palette[3]] },
  ];
  return (
    <Figure id="D25" label="Area-proportional joint reasoning and answer masses">
      <Svg
        height={300}
        label="Unit probability rectangle split by reasoning class and answer success"
      >
        <Text x={130} y={25}>
          Correct answer left; wrong answer right
        </Text>
        {rows.map((row, i) => (
          <g key={i}>
            <rect
              x={130}
              y={row.y}
              width={320 * row.probability}
              height={row.height}
              fill={`${row.colors[0]}66`}
              stroke={row.colors[0]}
            />
            <rect
              x={130 + 320 * row.probability}
              y={row.y}
              width={320 * (1 - row.probability)}
              height={row.height}
              fill={`${row.colors[1]}55`}
              stroke={row.colors[1]}
            />
            <Text x={475} y={row.y + Math.max(15, row.height / 2)}>
              {i === 0 ? 'Correct reasoning' : 'Wrong reasoning'}
            </Text>
          </g>
        ))}
        <Text x={130} y={280}>
          Whole rectangle mass = 1; cell areas follow joint probability.
        </Text>
      </Svg>
      <Cells
        values={result.cells.flat()}
        labels={[
          'Correct reasoning, answer',
          'Correct reasoning, wrong answer',
          'Wrong reasoning, answer',
          'Neither',
        ]}
      />
      <p>
        Answer mean {f(result.mean)}; population SD {f(result.std)}. Conditional expected
        coefficient: correct reasoning {f(result.correct)}, wrong reasoning {f(result.incorrect)}.
      </p>
      <Controls>
        <Range
          label="Correct-reasoning prevalence p_c"
          value={pc}
          onChange={setPC}
          min={0.05}
          max={0.95}
        />
        <Range label="Answer success given correct reasoning α" value={alpha} onChange={setAlpha} />
        <Range label="Answer success given wrong reasoning b" value={b} onChange={setB} />
        <button
          onClick={() => {
            setAlpha(b);
            setB(alpha);
          }}
        >
          Reverse dependency
        </button>
        <Reset
          onClick={() => {
            setPC(0.25);
            setAlpha(0.8);
            setB(0.2);
          }}
        />
      </Controls>
    </Figure>
  );
}
export function AnswerAndReasoningEvaluation() {
  const [none, setNone] = useState(false),
    [unknown, setUnknown] = useState(false);
  const answers = Array.from({ length: 8 }, (_, i) => !none && i < 2),
    reasoning = Array.from({ length: 8 }, (_, i) => (unknown ? null : i === 0)),
    count = answers.filter(Boolean).length,
    joint = unknown ? null : answers.filter((a, i) => a && reasoning[i]).length;
  return (
    <Figure id="D26" label="Eight annotated responses with answer and reasoning denominators">
      <RLVRTable
        headers={['Response identity', 'Answer passes', 'Independently supplied reasoning check']}
        rows={answers.map((a, i) => [
          <span style={{ color: palette[i % 4] }}>Response {i + 1}</span>,
          a ? 'yes' : 'no',
          reasoning[i] === null ? 'unknown' : reasoning[i] ? 'yes' : 'no',
        ])}
      />
      <RLVRTable
        headers={['Quantity', 'Numerator / denominator', 'Value']}
        rows={[
          ['Answer fraction', `${count} / 8`, f(count / 8)],
          [
            'Joint correct answer and reasoning',
            `${f(joint)} / 8`,
            f(joint === null ? null : joint / 8),
          ],
          [
            'Reasoning among answer passes',
            `${f(joint)} / ${count}`,
            f(count && joint !== null ? joint / count : null),
          ],
        ]}
      />
      <Controls>
        <Check label="No answer passes" value={none} onChange={setNone} />
        <Check label="Reasoning annotations unavailable" value={unknown} onChange={setUnknown} />
        <Reset
          onClick={() => {
            setNone(false);
            setUnknown(false);
          }}
        />
      </Controls>
      <p className="rlvr-note">
        Constructed independent annotations, not a learned judge or measured policy. A conditional
        sample with no answer passes has no measured reasoning fraction.
      </p>
    </Figure>
  );
}
