import { useState } from 'react';
import { labelIdentities as labels } from '../../data/multilabel-reading-flow-foundation-models.js';
import { savedChainObservations as saved } from '../../data/multilabel-reading-flow-chain-observations.js';
import { serveSavedMember } from '../../data/multilabel-reading-flow-context-models.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelTable, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';
const shortID = id => id.replace('constructed-', 'r');
const orderName = order => order.map(column => labels[column].id).join('→');
export function StrictPrefixFigure() {
  const [fold, setFold] = useState(0);
  const [mode, setMode] = useState('strict');
  const states = saved.strictPrefixes.filter(state => state.fold === fold);
  const held = states[0].held_ids;
  const complement = states[0].prefix.scaler_training_ids;
  const rows = Array.from({
    length: 16
  }, (_, index) => `constructed-${index}`);
  return <MultiLabelFigure
    job="D28"
    description="Actual held-fold IDs are excluded from the entire saved prefix fit; a separately labelled stage-wise comparison exposes a possible indirect path"
  >
    <MultiLabelCanvas
      width={1160}
      height={790}
      title={`Fold ${fold + 1}: actual held rows and prefix-stage fit inputs; ${mode === 'strict' ? 'whole-prefix isolation' : 'possible stage-wise information path'}`}
    >
      <text x={16} y={31}>Original row identity</text>
      <text x={271} y={31}>C stage</text>
      <text x={435} y={31}>A stage</text>
      <text x={601} y={31}>B final targets</text>
      {rows.map((id, index) => {
        const y = 61 + index * 28;
        const isHeld = held.includes(id);
        return <g key={id}>
          <text x={16} y={y + 6}>{shortID(id)} · fold {index % 3 + 1}</text>
          {[2, 0, 1].map((column, stage) => <g key={column}>
            <circle
              cx={299 + stage * 165}
              cy={y}
              r={9}
              fill={isHeld && stage < 2 ? '#111114' : labels[column].color}
              stroke={isHeld && stage < 2 ? '#fff' : labels[column].color}
            />
            <text x={321 + stage * 165} y={y + 6}>
              {stage === 2 ? 'target used' : isHeld ? 'held' : 'fit input'}
            </text>
          </g>)}
        </g>;
      })}
      <text x={794} y={52}>Actual complement IDs</text>
      <path d="M786,68 V175 H800 M786,68 H800 M980,175 H1005 V207 H904 V229" fill="none" stroke="#dfd4e7" />
      {[0, 4, 8].map((start, index) => <text key={start} x={803} y={91 + index * 34}>
        {complement.slice(start, start + 4).map(shortID).join(', ')}
      </text>)}
      <circle cx={904} cy={256} r={27} fill="#111114" stroke="#e6dbea" />
      <text x={904} y={262} textAnchor="middle">σ</text>
      <text x={848} y={312}>scaled x + fitted prefix</text>
      <path d="M931,256 H1072 V371 H834" fill="none" stroke="#fff" />
      <circle cx={834} cy={371} r={12} fill="#111114" stroke="#fff" />
      <text x={854} y={400}>serve held IDs</text>
      {[0, 3].map((start, index) => <text key={start} x={854} y={440 + index * 34}>
        {held.slice(start, start + 3).map(shortID).join(', ')}
      </text>)}
      {mode === 'stagewise' ? <g>
        <text x={16} y={640} fill="#ef8ca4">Possible stage-wise dependency through another row's globally generated feature</text>
        <path
          d="M161,695 H306 M358,695 H515 M567,695 H740 M792,695 H976"
          stroke="#ef8ca4"
          strokeDasharray="7 5"
          fill="none"
        />
        {[140, 332, 541, 766, 1002].map((x, index) => <g key={x}>
          <circle cx={x} cy={695} r={26} fill="#111114" stroke="#ef8ca4" />
          <text x={x} y={701} textAnchor="middle">
            {index === 1 || index === 3 ? 'σ' : index === 2 ? 'ŷ' : 'h'}
          </text>
        </g>)}
        <text x={84} y={752}>held answer</text>
        <text x={267} y={664}>fit for other fold</text>
        <text x={475} y={752}>other-row OOF</text>
        <text x={709} y={664}>later fitted head</text>
        <text x={946} y={752}>served h</text>
      </g> : <g>
        <text x={16} y={646}>Strict construction: hold h out of the original-input scaler AND every fitted prefix stage.</text>
        <circle cx={124} cy={711} r={24} fill="#111114" stroke="#fff" />
        <text x={124} y={717} textAnchor="middle">h</text>
        <path d="M151,711 H285 M309,695 L340,727 M309,727 L340,695" stroke="#fff" fill="none" />
        <text x={371} y={717}>No held-answer input into the prefix fit serving h.</text>
      </g>}
      <text x={16} y={554}>C/A: filled = prefix-fit input, open = held. B: all final training targets.</text>
      <text x={16} y={590}>Final-stage fitting uses all training rows after fold-held prefixes are assembled; the grid concerns prefix construction.</text>
    </MultiLabelCanvas>
    <MultiLabelTable
      caption="Saved complete prefix states: every scaler and fitted stage has the same legal complement"
    >
      <thead>
        <tr>
          <th>Requested final stage</th>
          <th>Whole prefix order</th>
          <th>Scaler + every stage training IDs</th>
          <th>Served held IDs</th>
        </tr>
      </thead>
      <tbody>
        {states.map(row => <tr key={row.final_position}>
          <th>{labels[row.prefix.order[row.final_position]].id} · position {row.final_position + 1}</th>
          <td>
            {orderName(row.prefix.stages.map(stage => stage.column))}
          </td>
          <td>
            {row.prefix.scaler_training_ids.map(shortID).join(', ')}
            {row.prefix.stages.map((stage, index) => <span key={index} className="mlf-source-line"><br />{labels[stage.column].id}: {stage.training_ids.map(shortID).join(', ')}</span>)}
          </td>
          <td>
            {row.held_ids.map(shortID).join(', ')}
          </td>
        </tr>)}
      </tbody>
    </MultiLabelTable>
    <FlowControls>
      <label>Held fold<select
        aria-label="Strict prefix held fold"
        value={fold}
        onChange={event => setFold(Number(event.target.value))}
      >
        {[0, 1, 2].map(value => <option key={value} value={value}>Fold {value + 1}</option>)}
      </select></label>
      <label>Provenance comparison<select
        aria-label="Prefix isolation recipe"
        value={mode}
        onChange={event => setMode(event.target.value)}
      >
        <option value="strict">Whole-prefix isolation</option>
        <option value="stagewise">Stage-wise possible path</option>
      </select></label>
      <button
        type="button"
        onClick={() => {
          setFold(0);
          setMode('strict');
        }}
      >Reset prefix provenance</button>
    </FlowControls>
    <FlowReadout>Fold {fold + 1} serves [{held.map(shortID).join(', ')}] from prefix states fit only on [{complement.map(shortID).join(', ')}]. {mode === 'strict' ? 'Their answers enter neither the prefix scaler nor any fitted prefix head used to serve them.' : 'The dashed comparison names a possible indirect dependency of globally generated stage-wise OOF columns; it is not a measured bias claim or another saved strict fit.'} The final training head can use all training targets after its isolated prefix features are assembled.</FlowReadout>
    <figcaption>The source rows and all six prefix states come from the saved 16-row chain program. The displayed letters preserve original A/B/C identities; the fitted order is C→A→B. <a href="/learn-code/multi-label-multi-output-learning/chain-fit-and-decode.stdout.txt" download>Complete saved states</a>.</figcaption>
  </MultiLabelFigure>;
}
function MemberBranch({
  member,
  index,
  selected,
  query
}) {
  const trace = serveSavedMember(member.state, query);
  const y = 78 + index * 190;
  return <g>
    <text x={16} y={y - 29}>Member {index + 1} · {orderName(member.state.order)} · 16 draw IDs</text>
    <path
      d={`M28,${y - 12} V${y + 60} H70 M28,${y - 12} H440`}
      fill="none"
      stroke={selected ? '#fff' : '#8e819a'}
    />
    <text x={41} y={y + 38}>x</text>
    {trace.stages.map((stage, position) => <g key={stage.column}>
      <path
        d={`M${position ? 199 + (position - 1) * 155 : 70},${y + 35} H${106 + position * 155} M${130 + position * 155},${y - 12} V${y + 11} M${154 + position * 155},${y + 35} H${171 + position * 155}`}
        stroke={labels[stage.column].color}
        fill="none"
      />
      <circle
        cx={130 + position * 155}
        cy={y + 35}
        r={24}
        fill="#111114"
        stroke={selected ? '#fff' : labels[stage.column].color}
      />
      <text x={130 + position * 155} y={y + 41} textAnchor="middle">σ</text>
      <text
        x={96 + position * 155}
        y={y - 4}
        style={{
          fill: labels[stage.column].color
        }}
      >
        {labels[stage.column].id}
      </text>
      <text x={75 + position * 155} y={y + 86}>p={number(stage.positive, 4)}</text>
      <circle
        cx={185 + position * 155}
        cy={y + 35}
        r={14}
        fill={stage.bit ? labels[stage.column].color : '#111114'}
        stroke={labels[stage.column].color}
      />
      <text
        x={185 + position * 155}
        y={y + 41}
        textAnchor="middle"
        style={{
          fill: stage.bit ? '#141117' : labels[stage.column].color
        }}
      >
        {stage.bit}
      </text>
      <path
        d={`M${185 + position * 155},${y + 49} V${y + 112 + position * 9} H529 V${y + 51}`}
        fill="none"
        stroke={labels[stage.column].color}
      />
    </g>)}
    <path
      d={`M185,${y + 49} V${y + 104} H365 V${y + 45} H418`}
      fill="none"
      stroke={labels[trace.stages[0].column].color}
      strokeDasharray="5 4"
    />
    <circle cx={529} cy={y + 35} r={16} fill="#111114" stroke="#d9cddd" />
    <text x={529} y={y + 41} textAnchor="middle">↔</text>
    <text x={547} y={y - 11}>restore A/B/C</text>
    <path
      d={`M545,${y + 35} H558 M721,${y + 7} H734 V${y + 65} H721 M734,${y + 35} H745`}
      fill="none"
      stroke="#e4dce9"
    />
    {trace.restored.map((bit, output) => <g key={output}>
      <circle
        cx={576 + output * 63}
        cy={y + 35}
        r={18}
        fill={bit ? labels[output].color : '#111114'}
        stroke={labels[output].color}
      />
      <text
        x={576 + output * 63}
        y={y + 41}
        textAnchor="middle"
        style={{
          fill: bit ? '#141117' : labels[output].color
        }}
      >
        {bit}
      </text>
      <text
        x={567 + output * 63}
        y={y + 82}
        style={{
          fill: labels[output].color
        }}
      >
        {labels[output].id}
      </text>
    </g>)}
  </g>;
}
export function RecordedChainEnsembleFigure() {
  const [selected, setSelected] = useState(0);
  const [aggregation, setAggregation] = useState('hard');
  const member = saved.members[selected];
  const traces = saved.queries.map(query => serveSavedMember(member.state, query));
  return <MultiLabelFigure
    job="D29"
    description="Three saved fitted chains have distinct bags, orders, parameters and restored outputs; hard votes and own-path masses are separate aggregation objects"
  >
    {saved.queries.map((query, queryIndex) => <div key={queryIndex}>
      <MultiLabelCanvas
        width={760}
        height={850}
        title={`Recorded query ${queryIndex + 1} [${query.join(', ')}]: complete trained member branches restore A/B/C before pooling`}
      >
        <text x={16} y={30}>Query [{query.join(', ')}] · white head outlines select member {selected + 1}</text>
        {saved.members.map((row, index) => <MemberBranch key={index} member={row} index={index} selected={selected === index} query={query} />)}
        <path
          d="M745,113 V643 H390 M745,303 H749 V643 M745,493 H753 V643 H749"
          fill="none"
          stroke="#e1d9e7"
        />
        <text x={16} y={680}>
          {aggregation === 'hard' ? 'Restored bits → count positive votes for each output' : 'Each member scores its own chosen complete path.'}
        </text>
        {aggregation === 'hard' ? [0, 1, 2].map(output => <g key={output}>
          <text
            x={16 + output * 240}
            y={724}
            style={{
              fill: labels[output].color
            }}
          >{labels[output].id}: ({saved.memberBits.map(bits => bits[queryIndex][output]).join(' + ')}) / 3</text>
          <text x={16 + output * 240} y={765}>= {number(saved.hardVotes[queryIndex][output])}</text>
          <text x={16 + output * 240} y={809}>≥ .5 → {saved.hardPrediction[queryIndex][output]}</text>
        </g>) : <>
          <text x={16} y={724}>Mean own-path joint score = {number(saved.meanChosenPathProbability[queryIndex])}</text>
          <text x={16} y={765}>Members may score different leaves.</text>
          <text x={16} y={809}>This scalar is not an output marginal.</text>
        </>}
      </MultiLabelCanvas>
    </div>)}
    <FlowControls>
      <label>Inspect recorded member<select
        aria-label="Recorded chain member"
        value={selected}
        onChange={event => setSelected(Number(event.target.value))}
      >
        {saved.members.map((row, index) => <option key={index} value={index}>Member {index + 1} · {orderName(row.state.order)}</option>)}
      </select></label>
      <label>Aggregation object<select
        aria-label="Recorded chain aggregation"
        value={aggregation}
        onChange={event => setAggregation(event.target.value)}
      >
        <option value="hard">Hard-vote mean → decisions</option>
        <option value="path">Mean own chosen-path mass</option>
      </select></label>
      <button
        type="button"
        onClick={() => {
          setSelected(0);
          setAggregation('hard');
        }}
      >Reset fitted chain ensemble</button>
    </FlowControls>
    <FlowReadout>Member {selected + 1} restores the {orderName(member.state.order)} chain to A/B/C. {aggregation === 'hard' ? 'The three members vote 101 on query 1 and 110 on query 2; positive wins an exact .5 vote tie.' : `The own-path mass means are ${saved.meanChosenPathProbability.map(value => number(value)).join(' and ')}; they average each member’s complete chosen-path product, not per-output probabilities.`} All parameters and measurements come from the saved constructed experiment; selecting a member never fits another model.</FlowReadout>
    <MultiLabelTable
      caption={`Selected member ${selected + 1}: every bootstrap draw keeps its original source ID`}
    >
      <thead>
        <tr>
          <th>Draw identity</th>
          <th>Original source identity</th>
          <th>Original source row</th>
        </tr>
      </thead>
      <tbody>
        {member.draw_ids.map((id, index) => <tr key={id}>
          <th>
            {id}
          </th>
          <td>
            {member.source_ids[index]}
          </td>
          <td>
            {member.indices[index]}
          </td>
        </tr>)}
      </tbody>
    </MultiLabelTable>
    <MultiLabelTable caption={`Selected complete member ${selected + 1}: saved scaler and stage parameters`}>
      <thead>
        <tr>
          <th>Fitted object</th>
          <th>Input coordinates</th>
          <th>Saved parameters</th>
          <th>Query 1 / query 2 positive probability</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>Original-input scaler</th>
          <td>x1, x2; fit on all 16 unique draw IDs</td>
          <td>mean [{member.state.scaler_mean.map(value => number(value)).join(', ')}]; scale [{member.state.scaler_scale.map(value => number(value)).join(', ')}]</td>
          <td>Original source duplicates retain separate draw identities</td>
        </tr>
        {member.state.stages.map((stage, position) => <tr key={stage.column}>
          <th>{labels[stage.column].id} · width {stage.feature_width}</th>
          <td>scaled x1,x2{position ? ` + ${member.state.order.slice(0, position).map(column => labels[column].id).join(', ')} served bits` : ''}</td>
          <td>bias + weights [{stage.weights.map(value => number(value)).join(', ')}]</td>
          <td>
            {traces.map(trace => number(trace.stages[position].positive)).join(' / ')}
          </td>
        </tr>)}
      </tbody>
    </MultiLabelTable>
    <MultiLabelTable
      caption="Each selected member scores its own complete chosen leaf; the mean scalar is a distinct object from hard votes"
    >
      <thead>
        <tr>
          <th>Query</th>
          <th>Selected member restored bits</th>
          <th>Chosen branch factors</th>
          <th>Product</th>
          <th>All-member mean product</th>
        </tr>
      </thead>
      <tbody>
        {traces.map((trace, index) => <tr key={index}>
          <th>
            {index + 1}
          </th>
          <td>
            {trace.restored.join('')}
          </td>
          <td>
            {trace.stages.map(stage => number(stage.factor)).join(' × ')}
          </td>
          <td>
            {number(trace.pathProbability)}
          </td>
          <td>
            {number(saved.meanChosenPathProbability[index])}
          </td>
        </tr>)}
      </tbody>
    </MultiLabelTable>
    <MultiLabelTable
      caption="Deeper comparison: average the same complete leaf across all member laws, then derive ensemble MAP and marginals"
    >
      <thead>
        <tr>
          <th>Original-order leaf</th>
          <th>Query 1 mean complete mass</th>
          <th>Query 2 mean complete mass</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({
          length: 8
        }, (_, index) => <tr key={index}>
          <th>
            {index.toString(2).padStart(3, '0')}
          </th>
          <td>
            {number(saved.jointMean[0][index])}
          </td>
          <td>
            {number(saved.jointMean[1][index])}
          </td>
        </tr>)}
        <tr>
          <th>Mean-law MAP</th>
          {saved.jointMAP.map((vector, index) => <td key={index}>
            {vector.join('')}
          </td>)}
        </tr>
        <tr>
          <th>Mean-law integrated A/B/C marginals</th>
          {saved.jointMarginals.map((vector, index) => <td key={index}>
            {vector.map(value => number(value)).join(', ')}
          </td>)}
        </tr>
      </tbody>
    </MultiLabelTable>
    <figcaption>Saved 16-row constructed chain fit, two declared queries, three bootstrap member systems. The mean complete law gives MAP 100 for query 1 while hard voting gives 101. Saved-state forward arithmetic exposes intermediate probabilities; it does not rerun training. <a href="/learn-code/multi-label-multi-output-learning/chain-fit-and-decode.stdout.txt" download>Complete recorded program output</a>.</figcaption>
  </MultiLabelFigure>;
}
