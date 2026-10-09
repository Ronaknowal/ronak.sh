import { FlowLab, FlowControls, FlowReadout, flowNumber as number } from './LessonFlow.jsx';
import { Drawing, Arrow, Cells } from './MessagePassingFlowElements.jsx';
import { MemberMark, clubHues } from './MessagePassingFlowObserved.jsx';
import { useSavedGraphInspector, InspectorResourceStatus } from './MessagePassingInspectorState.jsx';
import { inspectorFamilyNames, inspectorFeatures, inspectorEdges, inspectorInputSummary, inspectorLabelTrace } from '../../data/message-inspector-flow-models.js';
import examples from '../../data/message-passing-examples.json';
import { InspectorInputIdentity, InspectorFeatureTable, InspectorGraph, InspectorClassLegend, inspectorClassNames } from './MessagePassingInspectorElements.jsx';

const handLabels = inspectorLabelTrace([[0, 1, 0], [1, 0, 1], [0, 1, 0]], [0, 0, 1], [0, 2], 2);

function KnownLabelsHandFigure() {
  return <Drawing label="A separate three-member hand example of synchronous label propagation" width={624} height={402}>
    <text x={24} y={28}>Hand example: known 0 = class 0; known 2 = class 1.</text>
    <line x1={148} y1={88} x2={278} y2={88} stroke="#aaa" strokeWidth={2} />
    <line x1={334} y1={88} x2={464} y2={88} stroke="#aaa" strokeWidth={2} />
    {[0, 1, 2].map((id, i) => <g key={id}>
      <circle cx={120 + i * 186} cy={88} r={26} fill="#101010" stroke={id === 0 ? clubHues[0] : id === 2 ? clubHues[1] : '#eee'} strokeWidth={2} />
      <text x={120 + i * 186} y={94} textAnchor="middle">{id}</text><text x={120 + i * 186} y={142} textAnchor="middle">{id === 1 ? 'unknown' : 'clamped'}</text>
    </g>)}
    <text x={24} y={184}>Middle reads old scores from 0, 1 and 2, including itself.</text>
    <text x={24} y={224}>Round 0: [0, 0]</text><text x={24} y={262}>Round 1: [(1+0+0)/3, (0+0+1)/3] = [1/3, 1/3]</text>
    <text x={24} y={300}>Round 2: [(1+1/3+0)/3, (0+1/3+1)/3] = [4/9, 4/9]</text>
    <text x={24} y={338}>Known endpoint scores are restored after every round.</text>
    <text x={24} y={380}>Actual round-2 middle: [{handLabels.scores[1].map(value => number(value)).join(', ')}]</text>
  </Drawing>;
}

function CurrentKnownLabelFigure({ labels, receiver }) {
  const fit = new Set(labels.fit), before = labels.snapshots.find(value => value.round === 199), after = labels.snapshots.at(-1);
  const donors = labels.transition[receiver].flatMap((value, id) => value ? [id] : []), sumY = 100 + donors.length * 70;
  return <Drawing label={`Current label-propagation routes into member ${receiver}`} width={1008} height={sumY + 278}>
    <text x={24} y={28}>Back to the observed graph: only ten fitting labels are sources.</text>
    <text x={24} y={58}>Member {receiver} reads the complete round-199 scores before anyone writes round 200.</text>
    <text x={24} y={90}>sender ID</text><text x={164} y={90}>closed-row coefficient</text><text x={412} y={90}>old scores: class 0 / 1</text><text x={742} y={90}>weighted scores: 0 / 1</text>
    {donors.map((id, r) => <g key={id}>
      <text x={24} y={134 + r * 70}>{id}{fit.has(id) ? ' · fit' : ''}</text>
      <Cells x={180} y={106 + r * 70} values={[[labels.transition[receiver][id]]]} cellWidth={150} digits={5} />
      <text x={350} y={134 + r * 70}>×</text>
      <Cells x={398} y={106 + r * 70} values={[before.scores[id]]} cellWidth={136} digits={5} />
      <Arrow x1={690} y1={126 + r * 70} x2={726} y2={126 + r * 70} />
      <Cells x={748} y={106 + r * 70} values={[before.scores[id].map(value => value * labels.transition[receiver][id])]} cellWidth={116} digits={5} />
    </g>)}
    <text x={24} y={sumY + 32}>Sum the current receiving row’s products: before clamping</text>
    <Cells x={398} y={sumY + 50} values={[after.averaged[receiver]]} cellWidth={136} digits={6} />
    <Arrow x1={534} y1={sumY + 106} x2={534} y2={sumY + 134} />
    <text x={24} y={sumY + 168}>{fit.has(receiver) ? `Member ${receiver} is a fitting source: restore its known one-hot label.` : `Member ${receiver} is not a fitting source: keep the averaged scores.`}</text>
    <Cells x={398} y={sumY + 186} values={[labels.scores[receiver]]} cellWidth={136} digits={6} />
    <text x={24} y={sumY + 258}>Left score = Mr. Hi/class 0. Right score = Officer/class 1.</text>
  </Drawing>;
}

export function MessagePassingSavedKnownLabelsFigure() {
  const { inputs, labels } = useSavedGraphInspector(), receiver = inputs.receiver;
  const scores = labels.scores[receiver], predicted = scores[1] > scores[0] ? 1 : 0, evidence = scores[0] + scores[1];
  return <FlowLab label="Known fitting labels propagate through the current graph without withheld-label inputs">
    <KnownLabelsHandFigure />
    <p>To work the averaging by hand, we temporarily used a three-member path. Only the two endpoints are
      known; the middle begins with two zeros. Closed-row averaging includes its old row, and each round
      restores the two known endpoints. The two equal scores show why these finite scores need not sum to one.</p>
    <p>Return now to the same edited thirty-four-member network. Its ten fitting sources are shown below;
      development and assessment clubs never initialize or clamp scores. Feature edits and neural family
      choice do not enter this separate graph-and-known-label algorithm.</p>
    <Drawing label="The ten fitting members and their only allowed initial known-label scores" height={328}>
      {examples.roles.fit.map((id, index) => {
        const x = 74 + index % 5 * 138, y = 50 + Math.floor(index / 5) * 148;
        return <g key={id}><MemberMark id={id} x={x} y={y} selected={id === receiver} />
          <Cells x={x - 48} y={y + 44} values={[labels.clamped[id]]} cellWidth={50} signFill={false} digits={0} />
          <text x={x} y={y + 110} textAnchor="middle">class 0 / 1</text>
        </g>;
      })}
    </Drawing>
    <CurrentKnownLabelFigure labels={labels} receiver={receiver} />
    <FlowReadout>After 200 synchronous rounds on the current adjacency, member {receiver} has scores
      {' '}[{number(scores[0], 8)}, {number(scores[1], 8)}]. {evidence === 0
        ? 'No known-label evidence reaches this member; class 0 is only the fixed tie convention.'
        : `The larger score chooses ${inspectorClassNames[predicted]}, class ${predicted}; equal scores use class 0.`}</FlowReadout>
    <p>Read all donors from the old round before calculating the next receiving row. Then restore a known
      one-hot row only if it belongs to the fitting set. Doing updates in place would use a mixture of old
      and new rounds and would be a different algorithm. An isolated unknown member stays [0, 0].</p>
    <p>The original baseline got {examples.baseline.assessment}/{examples.roles.assessment.length} assessment
      members correct on the original graph. That retained measurement has its original identity; these
      edited scores are current diagnostics, not a replacement independent assessment.</p>
    <div className="mp-inspector-table-pan" tabIndex={0} role="region" aria-label="Initial and current known-label scores for all members">
      <table className="mp-inspector-values"><caption>All members: only fitting rows begin with a label; all rounds are computed on current adjacency.</caption>
        <thead><tr>{['Member', 'Clamped source?', 'Initial score0', 'Initial score1', 'Round 200 score0', 'Round 200 score1'].map(text => <th key={text} scope="col">{text}</th>)}</tr></thead>
        <tbody>{labels.scores.map((row, id) => <tr key={id} data-selected={id === receiver}><th scope="row">{id}</th><td>{labels.fit.includes(id) ? 'yes' : 'no'}</td>
          {[...labels.clamped[id], ...row].map((value, c) => <td key={c}>{number(value, 8)}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
  </FlowLab>;
}

function PinLane({ snapshot, label, y }) {
  return <g>
    <text x={24} y={y}>{label}: {inspectorFamilyNames[snapshot.family]}, saved seed {snapshot.seed}</text>
    <text x={24} y={y + 28}>Member {snapshot.receiver}, row {snapshot.row}, projected channel {snapshot.hiddenChannel}</text>
    <Cells x={142} y={y + 48} values={[snapshot.inputs.features[snapshot.receiver]]} cellWidth={164} digits={5} />
    <text x={24} y={y + 106}>current input row in this snapshot</text>
    <Arrow x1={388} y1={y + 130} x2={388} y2={y + 158} />
    <text x={24} y={y + 196}>Hidden channel {snapshot.hiddenChannel}: {number(snapshot.hidden[snapshot.hiddenChannel])}; logits use all 16 channels</text>
    <Cells x={142} y={y + 214} values={[snapshot.logits]} cellWidth={246} digits={6} />
    <Arrow x1={388} y1={y + 270} x2={388} y2={y + 298} />
    <Cells x={142} y={y + 312} values={[snapshot.probabilities]} cellWidth={246} digits={8} />
    <text x={142} y={y + 374}>P(Mr. Hi)</text><text x={388} y={y + 374}>P(Officer)</text>
  </g>;
}

export function MessagePassingSavedPinLab() {
  const { family, model, inputs, trace, pinned, pin, setPinned, summary } = useSavedGraphInspector();
  const current = trace && { family, seed: model.seed, inputs, receiver: inputs.receiver, row: trace.row,
    hiddenChannel: inputs.hiddenChannel, hidden: trace.result.hidden[trace.row], logits: trace.logits, probabilities: trace.probabilities };
  return <FlowLab label="Keep a real copy of an earlier semantic model output">
    <Drawing label="Pinned and current semantic outputs have separate input and saved-model identities" height={pinned && current ? 876 : 440}>
      {pinned ? <PinLane snapshot={pinned} label="Pinned" y={28} />
        : <text x={24} y={28}>No pinned result yet. Pin the current output below.</text>}
      {current ? <PinLane snapshot={current} label="Current" y={pinned ? 466 : 54} />
        : <text x={24} y={pinned ? 426 : 74}>The current family is loading or unavailable; no older family output fills this lane.</text>}
    </Drawing>
    <FlowControls>
      <button type="button" disabled={!trace} onClick={pin}>Pin current semantic output</button>
      <button type="button" disabled={!pinned} onClick={() => setPinned(null)}>Clear pin</button>
    </FlowControls>
    {pinned && <InspectorInputIdentity pinned family={pinned.family} inputs={pinned.inputs} summary={inspectorInputSummary(pinned.inputs)} />}
    <InspectorInputIdentity family={family} inputs={inputs} summary={summary} />
    <FlowReadout>{pinned ? <>The pin keeps {inspectorFamilyNames[pinned.family]} seed {pinned.seed}, member {pinned.receiver}{' '}
      and P(Officer) {number(pinned.probabilities[1])}.{current && <> The current lane uses {inspectorFamilyNames[family]},
        member {inputs.receiver}, with P(Officer) {number(trace.probabilities[1])}.</>}</> : 'The current output is visible before pinning. Pinning makes a copy for later comparison.'}</FlowReadout>
    <p>A pin copies the saved parameters, full feature and adjacency arrays, semantic receiver, storage order,
      logits, probabilities and traced intermediate values. It is not re-inferred with a later family.
      Editing, changing family or retrying a download preserves it. Clear pin removes only this comparison.</p>
    {pinned && <>
      {current && (pinned.family !== family || pinned.receiver !== inputs.receiver) && <p>The two lanes now use
        different {pinned.family !== family && pinned.receiver !== inputs.receiver ? 'families and members' : pinned.family !== family ? 'families' : 'members'}.
        Read those identities before interpreting a numerical difference as a controlled input comparison.</p>}
      <InspectorClassLegend /><InspectorGraph adjacency={pinned.inputs.adjacency} receiver={pinned.receiver} label="Pinned adjacency; pinned receiver" />
      <InspectorFeatureTable features={pinned.inputs.features} order={pinned.order} receiver={pinned.receiver} />
    </>}
    {!current && <InspectorResourceStatus />}
  </FlowLab>;
}

export function MessagePassingSavedResetLab() {
  const { family, inputs, resetAll, pinned, summary } = useSavedGraphInspector();
  const currentPair = inspectorEdges[inputs.edgeIndex], defaultPair = inspectorEdges[1];
  return <FlowLab label="Restore all original saved-model inputs while keeping the selected family">
    <Drawing label="Current selected feature row and original reset target" height={432}>
      <text x={24} y={28}>Current feature selection: member {inputs.featureNode}, coordinate {inputs.featureCoordinate}</text>
      <Cells x={142} y={50} values={[inputs.features[inputs.featureNode]]} cellWidth={164} digits={5} />
      <text x={24} y={114}>Selected relationship: {currentPair[0]}—{currentPair[1]}; {inputs.reversed ? 'reversed' : 'original'} storage</text>
      <Arrow x1={388} y1={136} x2={388} y2={168} />
      <text x={24} y={204}>Reset target: feature member 2, degree/33 coordinate</text>
      <Cells x={142} y={226} values={[inspectorFeatures[2]]} cellWidth={164} digits={5} />
      <text x={24} y={294}>Original adjacency; selected pair {defaultPair[0]}—{defaultPair[1]} restored.</text>
      <text x={24} y={330}>Receiver 2; projected channel 0; original storage; no pin.</text>
      <text x={24} y={366}>Saved family stays {inspectorFamilyNames[family]}, seed 11.</text>
      <text x={24} y={404}>Every original feature row and all 78 relationships return.</text>
    </Drawing>
    <FlowControls><button type="button" onClick={resetAll}>Reset all inputs and clear pin</button></FlowControls>
    <FlowReadout>The current context has {summary.featureEdits.length} feature edits, {summary.removedEdges.length}
      {' '}absent relationships and {pinned ? 'a retained pin' : 'no pin'}. Receiver {inputs.receiver}, projected channel
      {' '}{inputs.hiddenChannel}, {inputs.reversed ? 'reversed' : 'original'} storage; saved family {inspectorFamilyNames[family]}.</FlowReadout>
    <p>This is the complete input reset. It also restores feature-selection member 2, degree/33 coordinate,
      and relationship 0—2. It keeps the chosen saved family. Graph-only and feature-only restoration above
      have smaller scopes; retrying unavailable parameters restores neither inputs nor pin.</p>
  </FlowLab>;
}
