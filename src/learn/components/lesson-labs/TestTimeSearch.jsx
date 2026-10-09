import { useState } from 'react';
import {
  tree,
  beam,
  revisions,
  select,
  hybrid,
  controller,
} from '../../data/test-time-compute-models.js';
import { Figure, Drawing, Controls, Range, Table, Status, colors, fmt } from './TestTimeShared.jsx';

function TreeDrawing({ width = 1, depth = 2, family = 'product' }) {
  const value = beam(width, depth, family);
  const frontier = depth === 0 ? ['root'] : value.kept.slice(-width);
  return (
    <>
      <Drawing label={`${family} search tree, width ${width}, depth ${depth}`} height={325}>
        {tree.slice(1).map((n) => {
          const parent = tree.find((p) => p.id === n.parent),
            active = value.scored.includes(n.id);
          return (
            <path
              key={n.id}
              d={`M${parent.x} ${parent.y + 15}L${n.x} ${n.y - 20}`}
              fill="none"
              stroke={n.id.startsWith('A') ? colors[0] : colors[1]}
              opacity={active ? 1 : 0.25}
              strokeDasharray={active ? undefined : '5 5'}
            />
          );
        })}
        {tree.map((n) => {
          const active = n.id === 'root' || value.scored.includes(n.id),
            keep = value.kept.includes(n.id);
          return (
            <g key={n.id} data-node={n.id} data-scored={active}>
              {frontier.includes(n.id) && (
                <path
                  data-current-frontier={n.id}
                  d={`M${n.x - 18} ${n.y - 25}h-7v7 M${n.x + 18} ${n.y - 25}h7v7 M${n.x - 18} ${n.y + 25}h-7v-7 M${n.x + 18} ${n.y + 25}h7v-7`}
                  fill="none"
                  stroke="#fff"
                />
              )}
              <circle
                cx={n.x}
                cy={n.y}
                r="19"
                fill={
                  n.id.startsWith('A') ? colors[0] : n.id.startsWith('B') ? colors[1] : '#747d90'
                }
                fillOpacity={active ? 0.3 : 0.08}
                strokeDasharray={active ? undefined : '4 3'}
                stroke={n.id === value.selected ? '#fff' : keep ? '#d3d6e0' : '#737a87'}
                strokeWidth={n.id === value.selected ? 3 : 1}
              />
              <text x={n.x} y={n.y + 5} textAnchor="middle">
                {n.id}
              </text>
              <text x={n.x} y={n.y + 38} textAnchor="middle">
                {n.step}
              </text>
              {n.id !== 'root' && (
                <text x={n.x} y={n.y + 57} textAnchor="middle">
                  {fmt(n.local)} → {fmt(n[family])}
                </text>
              )}
            </g>
          );
        })}
      </Drawing>
      <Status>
        {value.scored.length} nodes scored. Completed selection: {value.selected || 'none'}. Current{' '}
        {depth === 2 ? 'terminal frontier' : 'frontier'}: {frontier.join(', ')}.{' '}
        {depth === 2 && width === 1 && family === 'product'
          ? 'A1 was unreachable after pruning A.'
          : ''}
      </Status>
    </>
  );
}
export function SearchTree() {
  const [width, setWidth] = useState(1),
    [depth, setDepth] = useState(2);
  return (
    <Figure
      id="D09"
      caption="Each node shows local score → cumulative product. Dashed nodes and edges are unscored counterfactuals, not charged as generated. Their labels remain visible for comparison. White corners mark the current frontier; the white ring marks the selected completed leaf."
    >
      <TreeDrawing width={width} depth={depth} />
      <Controls
        reset={() => {
          setWidth(1);
          setDepth(2);
        }}
      >
        <Range label="Beam width" value={width} min={1} max={2} onChange={setWidth} />
        <Range label="Expansion depth" value={depth} min={0} max={2} onChange={setDepth} />
      </Controls>
    </Figure>
  );
}
export function SearchWork() {
  return (
    <Figure
      id="D10"
      caption="Finite scoring-policy comparison, not independently generated DVTS responses. The extra rollout accounting below is a separate hypothetical plan."
    >
      <p>Shared beam: a single frontier can keep both surviving prefixes from one region.</p>
      <Drawing label="One shared frontier versus two separately budgeted roots" height={180}>
        <path
          d="M95 35L45 85M95 35L145 85M45 85L25 130M45 85L70 130M145 85L120 130M145 85L170 130"
          stroke={colors[0]}
          fill="none"
        />
        <path d="M15 90H180" stroke="#fff" strokeDasharray="3 3" />
        <text x="15" y="165">
          Shared frontier
        </text>
        {[320, 490].map((x, i) => (
          <g key={x}>
            <path
              d={`M${x} 35L${x - 45} 100M${x} 35L${x + 45} 100`}
              fill="none"
              stroke={colors[i]}
            />
            <circle cx={x} cy="35" r="7" fill={colors[i]} />
            <path d={`M${x - 55} 115H${x + 55}`} stroke={colors[i]} strokeWidth="2" />
            <text x={x} y="145" textAnchor="middle">
              Root budget {i + 1}
            </text>
          </g>
        ))}
      </Drawing>
      <p>Independent root 1: product policy (local → product).</p>
      <TreeDrawing family="product" />
      <p>Independent root 2: value policy (local → predicted value).</p>
      <TreeDrawing family="value" />
      <Drawing label="Four candidate steps each incur two extra rollout steps" height={145}>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <circle cx={40 + i * 150} cy="35" r="8" fill={colors[i]} />
            <path
              d={`M${40 + i * 150} 45v35l25 25`}
              fill="none"
              stroke={colors[i]}
              strokeDasharray="4 4"
            />
            <text x={20 + i * 150} y="135">
              1 + 2 units
            </text>
          </g>
        ))}
      </Drawing>
      <p>
        Four candidates × (one candidate step + two lookahead steps) = 12 step units. The two finite
        policy trees above score eight nodes in total.
      </p>
    </Figure>
  );
}
export function Revisions() {
  const [count, setCount] = useState(3),
    rows = revisions.slice(0, count),
    last = rows.at(-1).answer,
    best = select(rows, 'best'),
    vote = select(rows);
  return (
    <Figure
      id="D11"
      caption="Supplied dependent revisions. Retaining a correct earlier answer does not guarantee that a score or vote will choose it."
    >
      <Drawing label="Dependent revisions connected to a retained answer pool" height={200}>
        {revisions.map((r, i) => (
          <g key={r.id} data-revision={r.id} data-retained={i < count}>
            <circle
              cx={100 + i * 205}
              cy="50"
              r="22"
              fill={colors[i]}
              fillOpacity={i < count ? 0.25 : 0.06}
              strokeDasharray={i < count ? undefined : '4 3'}
              stroke={colors[i]}
            />
            <text x={100 + i * 205} y="55" textAnchor="middle">
              {r.id}
            </text>
            <text x={100 + i * 205} y="95" textAnchor="middle">
              {r.text} · score {r.score}
            </text>
            {i < count ? (
              <path d={`M${100 + i * 205} 110V150`} stroke={colors[i]} />
            ) : (
              <text x={100 + i * 205} y="130" textAnchor="middle">
                outside pool
              </text>
            )}
            {i < 2 && (
              <path d={`M${128 + i * 205} 50h145l-9 -5m9 5l-9 5`} fill="none" stroke="#c6ccd7" />
            )}
          </g>
        ))}
        <path d={`M100 150H${100 + (count - 1) * 205}`} stroke="#fff" strokeWidth="2" />
        <text x="95" y="183">
          Retained pool after {count} response{count > 1 ? 's' : ''}
        </text>
      </Drawing>
      <Table
        headers={['Policy', 'Answer', 'Evaluation, gold 11/2']}
        rows={[
          ['Last response', last],
          ['Retained best score', best],
          ['Retained plurality', vote],
        ].map(([name, answer]) => [name, answer, answer === '11/2' ? '✓ correct' : '× wrong'])}
      />
      <Controls reset={() => setCount(3)}>
        <Range label="Responses retained" value={count} min={1} max={3} onChange={setCount} />
      </Controls>
    </Figure>
  );
}
export function HybridSchedule() {
  const [b, setB] = useState(2),
    [d, setD] = useState(3),
    value = hybrid(b, d);
  return (
    <Figure
      id="D12"
      caption="Each coloured block emits ten tokens. Arrows impose a dependency within a row; different rows may run concurrently with enough workers."
    >
      <Drawing
        label={`${b} branches with ${d} sequential calls each`}
        width={690}
        height={b * 75 + 45}
      >
        {Array.from({ length: b }, (_, i) => (
          <g key={i}>
            <text x="5" y={35 + i * 75}>
              Chain {'ABCD'[i]}
            </text>
            {Array.from({ length: d }, (_, j) => (
              <g key={j}>
                <rect
                  x={100 + j * 145}
                  y={10 + i * 75}
                  width="110"
                  height="38"
                  fill={colors[i]}
                  fillOpacity=".25"
                  stroke={colors[i]}
                />
                <text x={112 + j * 145} y={34 + i * 75}>
                  10 emitted
                </text>
                <text x={110 + j * 145} y={68 + i * 75}>
                  prompt {20 + j * 10}
                </text>
                {j < d - 1 && (
                  <path
                    d={`M${215 + j * 145} ${28 + i * 75}h24l-5 -4m5 4l-5 4`}
                    fill="none"
                    stroke="#d3d7e0"
                  />
                )}
              </g>
            ))}
          </g>
        ))}
      </Drawing>
      <Status>
        {value.calls} calls · {value.generated} generated tokens · {value.promptWork} prompt
        positions · ideal critical path {value.critical} calls.
      </Status>
      <Controls
        reset={() => {
          setB(2);
          setD(3);
        }}
      >
        <Range label="Breadth" value={b} min={1} max={4} onChange={setB} />
        <Range label="Depth" value={d} min={1} max={4} onChange={setD} />
      </Controls>
    </Figure>
  );
}
export function BudgetController() {
  const [cap, setCap] = useState(4),
    [context, setContext] = useState(5),
    result = controller(cap, context);
  const phaseColor = {
    think: colors[0],
    continue: colors[2],
    boundary: '#aeb4c0',
    final: colors[1],
  };
  return (
    <Figure
      id="D13"
      caption="Blue = emitted thinking, amber diamond = injected Wait, violet = final tokens. A dashed boundary is a control event, not an emitted delimiter. This supplied token source is not a neural reasoning model."
    >
      <Drawing
        label="Thinking controller with continuation and finalization transitions"
        height={150}
      >
        <text x="20" y="65">
          THINK
        </text>
        <path d="M80 60H170l-8 -5m8 5l-8 5" stroke={colors[0]} fill="none" />
        <path d="M235 30l55 30 -55 30 -55 -30Z" fill="none" stroke="#bec5d2" />
        <text x="202" y="65">
          boundary
        </text>
        <path d="M235 30V10H50V40" fill="none" stroke={colors[2]} />
        <text x="83" y="30">
          continue + Wait
        </text>
        <path d="M290 60H410l-8 -5m8 5l-8 5" fill="none" stroke={colors[1]} />
        <text x="330" y="45">
          stop
        </text>
        <text x="430" y="65">
          FINAL
        </text>
        <text x="20" y="125">
          Reserve two final positions before spending thinking allowance.
        </text>
      </Drawing>
      <div className="ttc-token-row">
        {result.trace.map((t, i) => (
          <span
            className="ttc-token"
            style={{
              '--token-color': phaseColor[t.phase],
              borderBottomStyle: t.charged ? 'solid' : 'dashed',
            }}
            key={i}
          >
            {t.phase === 'continue' ? '◇ ' : ''}
            {t.token}
            <br />
            <small>{t.charged ? '1 position' : '0 positions'}</small>
          </span>
        ))}
      </div>
      <Status>
        Thinking + injected: {result.used}; final: 2; context charged: {result.charged}/{context}.
        Stop: {result.stop}. Final complete: yes.
      </Status>
      <Controls
        reset={() => {
          setCap(4);
          setContext(5);
        }}
      >
        <Range label="Thinking cap" value={cap} min={0} max={6} onChange={setCap} />
        <Range
          label="Available context positions"
          value={context}
          min={2}
          max={10}
          onChange={setContext}
        />
      </Controls>
    </Figure>
  );
}
