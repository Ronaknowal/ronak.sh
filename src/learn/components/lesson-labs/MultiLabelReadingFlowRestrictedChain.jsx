import { useState } from 'react';
import { restrictedCorners, restrictedChainTrace } from '../../data/multilabel-reading-flow-chain-models.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelTable, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';
const roles = {
  OR: '#f0b45b',
  AND: '#75adff',
  XOR: '#bc9aff'
};
function CornerGeometry({
  state,
  transformed = false
}) {
  const x = value => 90 + 255 * value;
  const y = value => 299 - 255 * value;
  return <MultiLabelCanvas
    width={540}
    height={410}
    title={transformed ? 'Transformed OR/AND coordinates: two distinct observations share exactly (1,0)' : 'Raw a/b corners: opposite truth convex hulls intersect at the same midpoint'}
  >
    <path d="M90,24 V299 H383" stroke="#eee8f1" fill="none" />
    {[0, 1].map(value => <g key={value}>
      <text x={x(value)} y={330} textAnchor="middle">
        {value}
      </text>
      <text x={57} y={y(value) + 6}>
        {value}
      </text>
    </g>)}
    <text
      x={195}
      y={366}
      style={{
        color: transformed ? roles.OR : '#eee8f1'
      }}
    >{transformed ? 'OR_hat' : 'a'} →</text>
    <text
      x={12}
      y={24}
      style={{
        color: transformed ? roles.AND : '#eee8f1'
      }}
    >
      {transformed ? 'AND_hat' : 'b'}
    </text>
    {transformed ? <>
      <path d={`M${x(.5)},${y(0)} L${x(1)},${y(.5)}`} stroke="#eee8f1" strokeDasharray="6 4" />
      <text x={194} y={196}>XOR_hat 0</text>
      <text x={274} y={272}>XOR_hat 1</text>
      <text x={119} y={399}>boundary OR_hat−AND_hat=.5</text>
    </> : <>
      <path
        d={`M${x(0)},${y(0)} L${x(1)},${y(1)} M${x(0)},${y(1)} L${x(1)},${y(0)}`}
        stroke={roles.XOR}
        strokeDasharray="6 4"
      />
      <circle cx={x(.5)} cy={y(.5)} r={5} fill="#eee8f1" />
      <text x={113} y={399}>Both convex hulls contain (.5,.5).</text>
    </>}
    {(transformed ? [0, 1, 3] : [0, 1, 2, 3]).map(corner => {
      const row = restrictedChainTrace(corner);
      const px = x(transformed ? row.originalOR : row.a);
      const py = y(transformed ? row.originalAND : row.b);
      const selected = corner === state.corner || transformed && corner === 1 && state.corner === 2;
      return <g key={corner}>
        <circle cx={px} cy={py} r={11} stroke={roles.XOR} fill={row.truth ? roles.XOR : '#111114'} />
        {transformed && corner === 1 && <circle cx={px} cy={py} r={16} stroke={roles.XOR} fill="none" />}
        {selected && <circle cx={px} cy={py} r={21} stroke="#fff" strokeWidth={2} fill="none" />}
        <text x={px + (corner === 1 || corner === 0 ? 27 : 24)} y={py + (corner === 0 ? -13 : 5)}>
          {transformed && corner === 1 ? '01,10 · y=1' : `${row.a}${row.b} · y=${row.truth}`}
        </text>
      </g>;
    })}
    {transformed && state.flip !== 'none' && <g>
      <path
        d={`M${x(state.servedOR) - 8},${y(state.servedAND) - 8} l16,16 m-16,0 l16,-16`}
        stroke="#fff"
        strokeWidth={3}
      />
      <text x={110} y={23}>white ×: perturbed served coordinate</text>
    </g>}
  </MultiLabelCanvas>;
}
function RestrictedCircuit({
  state
}) {
  return <MultiLabelCanvas
    width={1160}
    height={445}
    title="Two input bits feed OR and AND threshold heads; their served output ports feed a final XOR threshold head"
  >
    {[['a', state.a, 82], ['b', state.b, 270]].map(([name, value, y]) => <g key={name}>
      <text x={15} y={y - 34}>{name}={value}</text>
      <circle cx={76} cy={y} r={17} stroke="#eee8f1" fill={value ? '#eee8f1' : '#111114'} />
    </g>)}
    <path d="M93,82 H145 V63 H278 L289,73 M93,82 H185 V251 H278 L289,261" stroke="#aaa3b1" fill="none" />
    <path d="M93,270 H224 V117 H278 L289,107 M93,270 H247 V305 H278 L289,295" stroke="#aaa3b1" fill="none" />
    {[['OR', 90, state.orScore, -.5, state.servedOR], ['AND', 278, state.andScore, -1.5, state.servedAND]].map(([name, y, score, bias, served]) => <g
      key={name}
      style={{
        color: roles[name]
      }}
    >
      <text x={171} y={y - 42}>a × +1</text>
      <text x={171} y={y + 57}>b × +1</text>
      <path d={`M309,${y - 28} V${y - 65}`} stroke="#aaa3b1" />
      <text x={330} y={y - 58}>bias {number(bias)}</text>
      <circle cx={309} cy={y} r={28} stroke={roles[name]} fill="#111114" />
      <text x={309} y={y + 6} textAnchor="middle">Σ</text>
      <path d={`M337,${y} H414`} stroke={roles[name]} />
      <text x={360} y={y - 16}>
        {number(score)}
      </text>
      <circle cx={437} cy={y} r={23} stroke={roles[name]} fill="#111114" />
      <text x={437} y={y + 6} textAnchor="middle">q</text>
      <path d={`M460,${y} H512`} stroke={roles[name]} />
      <circle
        cx={529}
        cy={y}
        r={16}
        stroke={state.flip === name ? '#fff' : roles[name]}
        strokeWidth={state.flip === name ? 3 : 1}
        fill={served ? roles[name] : '#111114'}
      />
      <text x={385} y={y + 71}>{name}/{name === 'OR' ? 'A' : 'B'} served {served}{state.flip === name ? ' · flipped' : ''}</text>
      <path d={`M545,${y} H626 V${171 + (name === 'OR' ? -24 : 24)} H714`} stroke={roles[name]} fill="none" />
      <text x={604} y={name === 'OR' ? 64 : 320}>× {name === 'OR' ? '+1' : '−1'}</text>
    </g>)}
    <circle cx={744} cy={171} r={30} stroke={roles.XOR} fill="#111114" />
    <text x={744} y={177} textAnchor="middle">Σ</text>
    <path d="M744,141 V95" stroke="#aaa3b1" />
    <text x={776} y={102}>bias −.5</text>
    <path d="M774,171 H883" stroke={roles.XOR} />
    <text x={797} y={147}>score {number(state.xorScore)}</text>
    <circle cx={907} cy={171} r={24} stroke={roles.XOR} fill="#111114" />
    <text x={907} y={177} textAnchor="middle">q</text>
    <path d="M931,171 H986" stroke={roles.XOR} />
    <circle cx={1003} cy={171} r={16} stroke={roles.XOR} fill={state.prediction ? roles.XOR : '#111114'} />
    <text
      x={968}
      y={222}
      style={{
        color: roles.XOR
      }}
    >XOR/C {state.prediction}</text>
    <text x={15} y={421}>q(z)=1 when z≥0. A deliberate flip changes one served earlier bit; the displayed head scores and coefficients remain fixed.</text>
  </MultiLabelCanvas>;
}
function PrefixRow({
  state,
  training
}) {
  const a = training ? state.originalOR : state.servedOR;
  const b = training ? state.originalAND : state.servedAND;
  return <MultiLabelCanvas
    width={970}
    height={260}
    title={training ? 'Teacher-forced training row copies two true labels into final-stage slots' : 'Serving row copies two predictions into final-stage slots; query truth is absent'}
  >
    <text x={15} y={28}>
      {training ? 'training truth: dashed prefix wires' : 'served predictions: solid prefix wires'}
    </text>
    {[['a', state.a, 0, '#eee8f1'], ['b', state.b, 0, '#eee8f1'], [training ? 'true OR' : 'OR_hat', a, 1, roles.OR], [training ? 'true AND' : 'AND_hat', b, -1, roles.AND]].map(([name, value, weight, color], index) => <g key={name}>
      <circle cx={52 + index * 167} cy={85} r={14} stroke={color} fill={value ? color : '#111114'} />
      <text
        x={16 + index * 167}
        y={128}
        style={{
          color
        }}
      >{name}={value}</text>
      <path
        d={`M${52 + index * 167},99 V${160 + index * 10} H738 V114`}
        stroke={color}
        strokeDasharray={training && index >= 2 ? '5 4' : undefined}
        fill="none"
      />
      <text x={22 + index * 167} y={224}>weight {weight === -1 ? '−1' : weight}</text>
    </g>)}
    <circle cx={738} cy={85} r={29} stroke={roles.XOR} fill="#111114" />
    <text x={738} y={91} textAnchor="middle">Σ</text>
    <text x={777} y={62}>bias −.5</text>
    <path d="M767,85 H842" stroke={roles.XOR} />
    <circle cx={865} cy={85} r={23} fill="#111114" stroke={roles.XOR} />
    <text x={865} y={91} textAnchor="middle">q</text>
    <text x={15} y={257}>Original-input bypass weights are zero in this explicit restricted-class construction.</text>
  </MultiLabelCanvas>;
}
export function RestrictedClassBridgeFigure() {
  const [corner, setCorner] = useState(1);
  const [flip, setFlip] = useState('none');
  const state = restrictedChainTrace(corner, flip);
  return <MultiLabelFigure
    job="D25a"
    description="OR and AND supply nonlinear features that make XOR linearly separable; a served predecessor error propagates into the final answer"
  >
    <p>Constructed outputs here are A/OR (amber), B/AND (blue), C/XOR (violet), distinct from the earlier service-label names. Filled/open violet points encode XOR truth 1/0; a white outline marks the inspected observation.</p>
    <div className="mlf-geometry-comparison">
      <CornerGeometry state={state} />
      <CornerGeometry state={state} transformed />
    </div>
    <RestrictedCircuit state={state} />
    <PrefixRow state={state} training />
    <PrefixRow state={state} training={false} />
    <MultiLabelTable
      caption="All four unperturbed constructed rows remain intact; a selected served-bit intervention is separate"
    >
      <thead>
        <tr>
          <th>Raw corner</th>
          <th>OR score / bit</th>
          <th>AND score / bit</th>
          <th>XOR score / answer</th>
          <th>Separate XOR truth</th>
        </tr>
      </thead>
      <tbody>
        {restrictedCorners.map((_, index) => {
          const row = restrictedChainTrace(index);
          return <tr key={index}>
            <th>
              {row.a}
              {row.b}
            </th>
            <td>{number(row.orScore)} / {row.originalOR}</td>
            <td>{number(row.andScore)} / {row.originalAND}</td>
            <td>{number(row.xorScore)} / {row.prediction}</td>
            <td>
              {row.truth}
            </td>
          </tr>;
        })}
        {flip !== 'none' && <tr>
          <th>{state.a}{state.b} · {flip} served-bit flip</th>
          <td>served OR {state.servedOR}</td>
          <td>served AND {state.servedAND}</td>
          <td>{number(state.xorScore)} / {state.prediction}</td>
          <td>{state.truth} · {state.matches ? 'matches' : 'disagrees'}</td>
        </tr>}
      </tbody>
    </MultiLabelTable>
    <FlowControls>
      <label>Raw input corner<select
        aria-label="Restricted chain corner"
        value={corner}
        onChange={event => setCorner(Number(event.target.value))}
      >
        {restrictedCorners.map((row, index) => <option key={index} value={index}>
          {row.join('')}
        </option>)}
      </select></label>
      <label>Deliberately flipped earlier prediction<select
        aria-label="Restricted served-bit flip"
        value={flip}
        onChange={event => setFlip(event.target.value)}
      >
        <option value="none">none</option>
        <option>OR</option>
        <option>AND</option>
      </select></label>
      <button
        type="button"
        onClick={() => {
          setCorner(1);
          setFlip('none');
        }}
      >Reset corner and served bits</button>
    </FlowControls>
    <FlowReadout>At {state.a}{state.b}, served OR is {state.servedOR} and AND is {state.servedAND}{flip === 'none' ? '' : ` after the ${flip} flip`}; score {number(state.xorScore)} selects XOR {state.prediction}, while this corner’s separate XOR truth is {state.truth}. {state.matches ? 'They agree.' : 'The predecessor error changes the final answer.'} The flip affects only this query’s served prefix, never training labels or fitted coefficients.</FlowReadout>
  </MultiLabelFigure>;
}
