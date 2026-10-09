import { useEffect, useRef, useState } from 'react';
import { energyObservations as saved } from '../../data/multilabel-reading-flow-energy-observations.js';
import { energyForestForward, energyLinearForward } from '../../data/multilabel-reading-flow-energy-models.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelQuantity, MultiLabelTable, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';
const colors = ['#f0b45b', '#75adff'];
const names = ['Heating', 'Cooling'];
const shortFeatures = ['X1 compactness', 'X2 surface', 'X3 wall', 'X4 roof', 'X5 height', 'X7 glazing', 'X6=2', 'X6=3', 'X6=4', 'X6=5', 'X8=0', 'X8=1', 'X8=2', 'X8=3', 'X8=4', 'X8=5'];
const sha256 = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('');
function useSavedForest(ref, attempt) {
  const [near, setNear] = useState(false),
    [model, setModel] = useState(null),
    [error, setError] = useState('');
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setNear(true);
        observer.disconnect();
      }
    }, {
      rootMargin: '600px'
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  useEffect(() => {
    if (!near) return;
    const controller = new AbortController();
    setError('');
    async function load() {
      const response = await fetch('/learn-code/multi-label-multi-output-learning/energy-multioutput-models.json', {
        signal: controller.signal
      });
      if (!response.ok || /text\/html/i.test(response.headers.get('content-type') || '')) throw Error('The saved forest could not load.');
      const bytes = await response.arrayBuffer();
      if ((await sha256(bytes)) !== saved.provenance['energy-multioutput-models.json']) throw Error('The saved model file differs from this recorded experiment.');
      const state = JSON.parse(new TextDecoder('utf-8', {
        fatal: true
      }).decode(bytes));
      if (state.models.S2?.forests?.[0]?.trees?.length !== 300 || state.models.S2.training_rows !== 512) throw Error('The complete recorded S2 forest is required.');
      if (!controller.signal.aborted) setModel(state.models.S2);
    }
    load().catch(failure => {
      if (!controller.signal.aborted) setError(failure.message);
    });
    return () => controller.abort();
  }, [near, attempt]);
  return {
    model,
    error,
    near
  };
}
function LinearCircuit({
  point,
  forward
}) {
  return <MultiLabelCanvas
    width={1420}
    height={1720}
    title="Actual G3 linear fitted state: eight original inputs, sixteen encoded/scaled coordinates, two coefficient products per coordinate, connected sum and target inverse operations"
  >
    <text x={16} y={30}>Saved G3 · output Heating amber / Cooling blue · original CSV input has eight coordinates</text>
    <text x={16} y={85}>Feature assembly: 6 numeric + 4 orientation indicators + 6 distribution indicators = 16</text>
    <text x={16} y={141}>Original X1…X8</text>
    <text x={314} y={141}>Encoded, training-scaled</text>
    <text x={671} y={141}>Output coefficient × coordinate</text>
    {point.map((value, j) => {
      const destinations = j < 5 ? [j] : j === 5 ? [6, 7, 8, 9] : j === 6 ? [5] : [10, 11, 12, 13, 14, 15];
      return <g key={j}>
        <circle cx={39} cy={191 + j * 81} r={17} fill="#111114" stroke="#d5c3df" />
        <text x={39} y={198 + j * 81} textAnchor="middle">
          {j + 1}
        </text>
        <text x={69} y={198 + j * 81}>X{j + 1} = {number(value)}</text>
        {destinations.map(i => <path
          key={i}
          d={`M253,${191 + j * 81} H${270 + j * 4} V${192 + i * 65} H309`}
          stroke="#d5c3df"
          fill="none"
        />)}
      </g>;
    })}
    {forward.encoded.map((value, i) => {
      const y = 192 + i * 65;
      return <g key={i}>
        <text x={316} y={y + 7}>
          {shortFeatures[i]}
        </text>
        <rect x={501} y={y - 19} width={110} height={38} fill="#111114" stroke="#d5c3df" />
        <text x={556} y={y + 7} textAnchor="middle">
          {number(value)}
        </text>
        {[0, 1].map(j => <g key={j}>
          <path d={`M611,${y} H${642 + j * 293}`} fill="none" stroke={colors[j]} />
          <text
            x={674 + j * 293}
            y={y - 5}
            style={{
              fill: colors[j]
            }}
          >{number(saved.savedLinear.coef_output_by_feature[j][i])} × {number(value)}</text>
          <text
            x={674 + j * 293}
            y={y + 18}
            style={{
              fill: colors[j]
            }}
          >→ {number(forward.contributions[i][j])}</text>
          <circle cx={907 + j * 413} cy={y + 18} r={3} fill={colors[j]} />
          <path d={`M${907 + j * 413},${y + 18} H${920 + j * 413}`} stroke={colors[j]} fill="none" />
        </g>)}
      </g>;
    })}
    <text x={16} y={893}>Orientation X6 makes 4 indicators.</text>
    <text x={16} y={933}>Distribution X8 makes 6 indicators.</text>
    <text x={16} y={988}>Numeric order: X1–5, then X7.</text>
    <text x={16} y={1034}>Every fitted zero is an actual 0,</text>
    <text x={16} y={1074}>not an unavailable score.</text>
    {[0, 1].map(j => {
      const x = 738 + j * 293;
      return <g key={j}>
        <path d={`M${920 + j * 413},210 V1248 H${x} V1282`} stroke={colors[j]} fill="none" />
        <circle cx={x} cy={1306} r={24} fill="#111114" stroke={colors[j]} />
        <text
          x={x}
          y={1313}
          textAnchor="middle"
          style={{
            fill: colors[j]
          }}
        >Σ</text>
        <path
          d={`M${x},1330 V1356 M${x},1398 V1451 M${x},1493 V1537 M${x},1579 V1623`}
          stroke={colors[j]}
          fill="none"
        />
        <circle cx={x} cy={1377} r={21} fill="#111114" stroke={colors[j]} />
        <text x={x} y={1384} textAnchor="middle">+</text>
        <text
          x={x + 35}
          y={1384}
          style={{
            fill: colors[j]
          }}
        >bias {number(saved.savedLinear.intercept[j])}</text>
        <text
          x={x - 120}
          y={1429}
          style={{
            fill: colors[j]
          }}
        >standardized {number(forward.standardized[j])}</text>
        <circle cx={x} cy={1472} r={21} fill="#111114" stroke={colors[j]} />
        <text x={x} y={1479} textAnchor="middle">×</text>
        <text
          x={x + 35}
          y={1479}
          style={{
            fill: colors[j]
          }}
        >σ {number(saved.savedLinear.target_scale[j])}</text>
        <circle cx={x} cy={1558} r={21} fill="#111114" stroke={colors[j]} />
        <text x={x} y={1565} textAnchor="middle">+</text>
        <text
          x={x + 35}
          y={1565}
          style={{
            fill: colors[j]
          }}
        >μ {number(saved.savedLinear.target_mean[j])}</text>
        <text
          x={x - 110}
          y={1658}
          style={{
            fill: colors[j]
          }}
        >{names[j]} prediction {number(forward.prediction[j])}</text>
      </g>;
    })}
    <text x={16} y={1370}>Only height has a nonzero coefficient row.</text>
    <text x={16} y={1412}>Height mean 5.25 / scale 1.75 were</text>
    <text x={16} y={1454}>fitted on training, not this query.</text>
    <text x={16} y={1699}>Observed truth enters only the residual table below.</text>
  </MultiLabelCanvas>;
}
function ForestCircuit({
  model,
  forward,
  member
}) {
  const pathHeight = 140 + forward.selected.path.length * 100;
  const leafY = pathHeight + 55,
    meanY = leafY + 343;
  return <MultiLabelCanvas
    width={1114}
    height={meanY + 432}
    title={`Actual S2 member ${member} complete query path into a two-output leaf, followed by all 300 standardized member leaves, their mean and connected target inverse`}
  >
    <text x={16} y={30}>Different saved family: S2 shared forest · member {member} of 300</text>
    <text x={16} y={70}>Encoded query → float32 inputs ≤ saved float64 thresholds. This is the real member path.</text>
    {forward.selected.path.map((step, i) => {
      const y = 139 + i * 100;
      return <g key={step.node}>
        <path d={`M483,${y - 41} L795,${y} L483,${y + 41} L171,${y} Z`} fill="#111114" stroke="#d5c3df" />
        <text x={483} y={y - 8} textAnchor="middle">node {step.node} · {shortFeatures[step.feature]}</text>
        <text x={483} y={y + 20} textAnchor="middle">{number(step.value, 12)} ≤ {number(step.threshold, 12)}</text>
        <path d={`M483,${y + 41} V${y + 59}`} fill="none" stroke="#eee8f0" />
        <text x={515} y={y + 56}>taken: {step.left ? 'true → left' : 'false → right'} {step.next}</text>
        <path d={`M${step.left ? 795 : 171},${y} H${step.left ? 816 : 125}`} fill="none" stroke="#655f6c" />
      </g>;
    })}
    <path d={`M483,${pathHeight - 42} V${leafY - 29}`} stroke="#d5c3df" fill="none" />
    <rect x={208} y={leafY - 29} width={550} height={78} fill="#111114" stroke="#d5c3df" />
    <text x={232} y={leafY - 6}>leaf node {forward.selected.node} · one vector</text>
    {[0, 1].map(j => <text
      key={j}
      x={232 + j * 276}
      y={leafY + 29}
      style={{
        fill: colors[j]
      }}
    >{names[j]} {number(forward.selected.leaf[j])}</text>)}
    <text x={16} y={leafY + 101}>All 300 actual member leaves contribute; white outline is member {member}.</text>
    {forward.leaves.map((row, i) => <g key={i}>
      <rect
        x={16 + i % 30 * 35}
        y={leafY + 134 + Math.floor(i / 30) * 15}
        width={31}
        height={11}
        fill="#151519"
        stroke={i === member ? '#fff' : '#655f6c'}
        strokeWidth={i === member ? 3 : 1}
      />
      <path
        d={`M${17 + i % 30 * 35},${leafY + 137 + Math.floor(i / 30) * 15} h12 M${33 + i % 30 * 35},${leafY + 142 + Math.floor(i / 30) * 15} h12`}
        stroke={colors[0]}
      />
      <circle cx={40 + i % 30 * 35} cy={leafY + 142 + Math.floor(i / 30) * 15} r={2} fill={colors[1]} />
    </g>)}
    <path d={`M542,${leafY + 280} V${meanY - 25}`} fill="none" stroke="#d5c3df" />
    <circle cx={542} cy={meanY} r={25} fill="#111114" stroke="#d5c3df" />
    <text x={542} y={meanY + 7} textAnchor="middle">Σ</text>
    <path d={`M567,${meanY} H673`} stroke="#d5c3df" fill="none" />
    <circle cx={706} cy={meanY} r={33} fill="#111114" stroke="#d5c3df" />
    <text x={706} y={meanY + 7} textAnchor="middle">÷300</text>
    {[0, 1].map(j => {
      const x = 225 + j * 549;
      return <g key={j}>
        <path
          d={`M739,${meanY} H${795 + j * 30} V${meanY + 38} H${x} V${meanY + 69} M${x},${meanY + 111} V${meanY + 141} M${x},${meanY + 183} V${meanY + 213} M${x},${meanY + 255} V${meanY + 280}`}
          stroke={colors[j]}
          fill="none"
        />
        <text
          x={16 + j * 549}
          y={meanY + 58}
          style={{
            fill: colors[j]
          }}
        >{names[j]} standardized mean</text>
        <rect x={x - 80} y={meanY + 69} width={160} height={42} fill="#111114" stroke={colors[j]} />
        <text
          x={x}
          y={meanY + 98}
          textAnchor="middle"
          style={{
            fill: colors[j]
          }}
        >
          {number(forward.standardized[j])}
        </text>
        <circle cx={x} cy={meanY + 162} r={21} fill="#111114" stroke={colors[j]} />
        <text x={x} y={meanY + 169} textAnchor="middle">×</text>
        <text
          x={x + 35}
          y={meanY + 169}
          style={{
            fill: colors[j]
          }}
        >σ {number(model.target_scale[j])}</text>
        <circle cx={x} cy={meanY + 234} r={21} fill="#111114" stroke={colors[j]} />
        <text x={x} y={meanY + 241} textAnchor="middle">+</text>
        <text
          x={x + 35}
          y={meanY + 241}
          style={{
            fill: colors[j]
          }}
        >μ {number(model.target_mean[j])}</text>
        <text
          x={16 + j * 549}
          y={meanY + 307}
          style={{
            fill: colors[j]
          }}
        >Forest prediction {number(forward.prediction[j])}</text>
        <text
          x={16 + j * 549}
          y={meanY + 355}
          style={{
            fill: colors[j]
          }}
        >Selected member raw leaf {number(forward.selectedPrediction[j])}</text>
      </g>;
    })}
    <text x={16} y={meanY + 411}>Short side stubs are untaken branches. A member leaf and the mean of 300 members are different outputs.</text>
  </MultiLabelCanvas>;
}
export function EnergySavedForwardFigure() {
  const [rowId, setRowId] = useState(4),
    [member, setMember] = useState(0),
    [revision, setRevision] = useState(0),
    [attempt, setAttempt] = useState(0);
  const forestRef = useRef(null),
    loading = useSavedForest(forestRef, attempt);
  const row = saved.rows[rowId],
    point = row.slice(0, 8),
    truth = row.slice(8);
  const linear = energyLinearForward(saved.savedLinear, point);
  const forest = loading.model ? energyForestForward(loading.model, point, member) : null;
  const split = Object.keys(saved.rowIds).find(name => saved.rowIds[name].includes(rowId));
  return <MultiLabelFigure
    job="D64"
    description="Actual G3 coefficient contributions and a separately saved S2 forest both reconstruct one named source row; truth stays outside both prediction paths"
  >
    <LinearCircuit point={point} forward={linear} />
    <FlowControls>
      <MultiLabelQuantity
        label="Recorded CSV row ID"
        value={rowId}
        min={0}
        max={767}
        integer
        revision={revision}
        onChange={setRowId}
      />
    </FlowControls>
    <FlowReadout>CSV row {rowId}, worksheet row {saved.sourceWorksheetRows[rowId]}, geometry G{String(saved.ranks[rowId]).padStart(2, '0')} is {split}. Saved overall G3 predicts [{linear.prediction.map(value => number(value)).join(', ')}]. Truth [{truth.join(', ')}] and prediction-minus-truth [{linear.prediction.map((value, j) => number(value - truth[j])).join(', ')}] are post-prediction diagnostics.</FlowReadout>
    <MultiLabelTable caption="Every actual G3 encoded feature, fitted coefficient and contribution">
      <thead>
        <tr>
          <th>Feature</th>
          <th>Training mean</th>
          <th>Training scale</th>
          <th>Scaled query</th>
          <th>Heating coefficient</th>
          <th>Heating product</th>
          <th>Cooling coefficient</th>
          <th>Cooling product</th>
        </tr>
      </thead>
      <tbody>
        {linear.encoded.map((value, i) => <tr key={i}>
          <th>
            {saved.savedLinear.feature_names[i]}
          </th>
          <td>
            {number(saved.savedLinear.input_mean[i])}
          </td>
          <td>
            {number(saved.savedLinear.input_scale[i])}
          </td>
          <td>
            {number(value)}
          </td>
          {[0, 1].flatMap(j => [<td
            key={j + 'coef'}
            style={{
              color: colors[j]
            }}
          >
            {number(saved.savedLinear.coef_output_by_feature[j][i])}
          </td>, <td
            key={j + 'product'}
            style={{
              color: colors[j]
            }}
          >
            {number(linear.contributions[i][j])}
          </td>])}
        </tr>)}
      </tbody>
    </MultiLabelTable>
    <div ref={forestRef} data-saved-energy-forest="">
      {loading.error ? <p role="alert">{loading.error} <button type="button" onClick={() => setAttempt(value => value + 1)}>Retry saved forest</button></p> : forest ? <ForestCircuit model={loading.model} forward={forest} member={member} /> : <p role="status">
        {loading.near ? 'Loading and checking the complete saved forest…' : 'The complete saved forest loads as you approach its actual path.'}
      </p>}
    </div>
    <FlowControls>
      <MultiLabelQuantity
        label="Recorded S2 member ID"
        value={member}
        min={0}
        max={299}
        integer
        revision={revision}
        onChange={setMember}
      />
      <button
        type="button"
        onClick={() => {
          setRowId(4);
          setMember(0);
          setRevision(value => value + 1);
        }}
      >Reset recorded row and member</button>
    </FlowControls>
    {forest && <>
      <FlowReadout>S2 member {member} reaches node {forest.selected.node}, standardized vector [{forest.selected.leaf.map(value => number(value)).join(', ')}], raw leaf [{forest.selectedPrediction.map(value => number(value)).join(', ')}]. All {forest.members} members give forest mean [{forest.prediction.map(value => number(value)).join(', ')}]. This different saved family was its validation-selected family winner; it does not replace overall G3 or change the lock.</FlowReadout>
      <MultiLabelTable
        caption={`All 300 actual S2 leaf vectors for CSV row ${rowId}, before their standardized mean and raw-target inverse`}
      >
        <thead>
          <tr>
            <th>Member ID</th>
            <th>Heating standardized leaf</th>
            <th>Cooling standardized leaf</th>
          </tr>
        </thead>
        <tbody>
          {forest.leaves.map((leaf, id) => <tr key={id} aria-current={id === member ? 'true' : undefined}>
            <th>
              {id}
              {id === member ? ' · inspected' : ''}
            </th>
            {leaf.map((value, j) => <td
              key={j}
              style={{
                color: colors[j]
              }}
            >
              {number(value)}
            </td>)}
          </tr>)}
        </tbody>
      </MultiLabelTable>
    </>}
  </MultiLabelFigure>;
}
