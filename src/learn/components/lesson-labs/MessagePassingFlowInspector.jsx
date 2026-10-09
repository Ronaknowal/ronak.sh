import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber as number } from './LessonFlow.jsx';
import { Drawing, Arrow, Cells } from './MessagePassingFlowElements.jsx';
import { MemberMark } from './MessagePassingFlowObserved.jsx';
import { useSavedGraphInspector, InspectorResourceStatus } from './MessagePassingInspectorState.jsx';
import { inspectorFamilies, inspectorFamilyNames, inspectorFeatures, inspectorAdjacency, inspectorEdges,
  inspectorFeatureNames, inspectorOrder } from '../../data/message-inspector-flow-models.js';
import { InspectorSelect, inspectorMemberChoices, InspectorInputIdentity, InspectorClassLegend, InspectorGraph,
  InspectorProjection, InspectorLayerTerms, InspectorProbabilityFigure, InspectorParameterTables,
  InspectorProbabilityTable, InspectorFeatureTable, InspectorAdjacencyFigure } from './MessagePassingInspectorElements.jsx';

const sourceWeight = (family, a, receiver) => family === 'mlp' ? 0 : a[receiver].reduce((sum, value) => sum + value, 0) + (family === 'sage' ? 0 : 1);
const canonicalOrder = inspectorOrder(false), reversedOrder = inspectorOrder(true);

function SavedLayerRoute({ model, inputs, trace }) {
  const hidden = trace.result.hidden[trace.row], firstWeights = model.state['first.linear.weight'][inputs.hiddenChannel];
  return <Drawing label="Copied two-layer dimensions and actual selected member values" height={740}>
    <text x={24} y={28}>Member {inputs.receiver}: three current input coordinates</text>
    <Cells x={124} y={50} values={[inputs.features[inputs.receiver]]} cellWidth={166} digits={5} />
    <text x={124} y={114}>constant</text><text x={290} y={114}>original degree/33</text><text x={456} y={114}>original clustering</text>
    <Arrow x1={358} y1={134} x2={358} y2={164} />
    <text x={24} y={194}>Copied first weight row: projected channel {inputs.hiddenChannel}</text>
    <Cells x={124} y={214} values={[firstWeights]} cellWidth={166} digits={5} />
    <text x={24} y={280}>Full first weight: 16 outputs × 3 inputs; bias has 16 entries.</text>
    <text x={24} y={308}>{model.model === 'sage' ? 'Mean-SAGE adds a separate copied self projection.' : model.model === 'mlp' ? 'MLP uses only this member; there is no graph-message path.' : `${model.model.toUpperCase()} combines its allowed projected member rows.`}</text>
    <Arrow x1={358} y1={330} x2={358} y2={362} />
    <text x={24} y={390}>After the first combination, bias and ReLU: 16 hidden channels</text>
    <Cells x={170} y={414} values={Array.from({ length: 4 }, (_, row) => hidden.slice(row * 4, row * 4 + 4))}
      labels={['0–3', '4–7', '8–11', '12–15']} cellWidth={122} digits={4} />
    <Arrow x1={358} y1={612} x2={358} y2={638} />
    <text x={24} y={674}>Copied last weight: 2 × 16; last bias: 2 → two class logits.</text>
    <text x={24} y={712}>Cell fill: amber positive, blue negative, charcoal zero.</text>
  </Drawing>;
}

export function MessagePassingSavedFamilyLab() {
  const { family, setFamily, model, inputs, trace, summary, resource } = useSavedGraphInspector();
  return <FlowLab label="Choose the saved family without fitting or resetting current inputs">
    <div ref={resource.anchor} className="mp-inspector-state">
      {model && trace ? <SavedLayerRoute model={model} inputs={inputs} trace={trace} /> : <InspectorResourceStatus primary />}
      <FlowControls><InspectorSelect label="Saved family, seed 11" numeric={false} value={family}
        choices={inspectorFamilies.map(key => [key, inspectorFamilyNames[key]])} onChange={setFamily} /></FlowControls>
      <InspectorInputIdentity family={family} inputs={inputs} summary={summary} />
      {model && trace && <>
        <FlowReadout>The current member {inputs.receiver} has probabilities {number(trace.probabilities[0])} for Mr. Hi
          {' '}and {number(trace.probabilities[1])} for Officer under saved {inspectorFamilyNames[family]} seed 11.
          Changing this selector copies another saved computation; it performs no fitting.</FlowReadout>
        <p>Numeric cells are rounded for display; a displayed zero can represent a small nonzero value.
          The input row has three positions. Each row of the first weight builds one projected channel;
          the family’s already-taught message rule combines permitted member projections, then the copied bias
          is added and ReLU keeps positive entries. Read the hidden array left to right, then top to bottom.
          The last layer uses all sixteen hidden coordinates to produce two logits. The next investigation
          follows the actual incoming terms instead of treating these shape arrows as a numerical shortcut.</p>
        <p>Here is the complete copied parameter state. Matrix entries are stored as output rows × input columns;
          bias and attention-score arrays are vectors. A separate <code>self_linear</code> matrix is the
          Mean-SAGE self branch, not an extra edge. These values stay fixed while you edit inputs.</p>
        <InspectorParameterTables model={model} />
      </>}
    </div>
  </FlowLab>;
}

export function MessagePassingSavedReceiverLab() {
  const { family, model, inputs, dispatch, trace } = useSavedGraphInspector();
  return <FlowLab label="Follow one semantic receiver and projected channel">
    {trace ? <InspectorLayerTerms layer={trace.first} label="First-layer incoming products for the selected channel"
      kind={family} outputCoordinate={inputs.hiddenChannel} rectified /> : <InspectorResourceStatus />}
    <FlowControls>
      <InspectorSelect label="Receiving member" value={inputs.receiver} choices={inspectorMemberChoices} onChange={value => dispatch({ type: 'receiver', value })} />
      <InspectorSelect label="Projected channel" value={inputs.hiddenChannel} choices={Array.from({ length: 16 }, (_, c) => [c, `Channel ${c}`])}
        onChange={value => dispatch({ type: 'hiddenChannel', value })} />
    </FlowControls>
    {model && trace && <>
      <FlowReadout>Member {inputs.receiver} is stored at row {trace.row}. Channel {inputs.hiddenChannel} receives
        {' '}{trace.first.incoming.length} message terms; the preactivation is {number(trace.first.preactivation)}
        {' '}and ReLU produces {number(trace.activation)}.</FlowReadout>
      <p>Read one line from left to right: the sender’s semantic ID and storage row, its projected value,
        the family’s coefficient, then their product. Sum the products before adding the independent self
        projection where present and the copied bias. A storage address locates a value; it does not rename a member.</p>
      {family === 'gcn' ? <p>Each displayed GCN coefficient is 1/√(sender closed degree × receiver closed degree).
        Its incoming coefficients need not sum to one; the current sum is {number(trace.first.coefficientSum)}.</p>
        : family === 'sage' ? <p>Mean-SAGE divides by the current open-neighbor count, then adds the separate self
          projection. With no open neighbors the message term is zero; the self projection and bias remain.</p>
          : family === 'gat' ? <p>GAT first adds copied sender and receiver scores, applies LeakyReLU with negative
            slope 0.2, then normalizes shifted exponential masses within this receiver’s closed neighborhood.
            The first-layer receiver score is {number(trace.first.receiverScore)}; incoming coefficients sum to {number(trace.first.coefficientSum)}.</p>
            : <p>The MLP has no incoming message terms. Its own projection and bias alone form this preactivation,
              so topology-only edits cannot change its output when features are held fixed.</p>}
      <InspectorProjection title={`Member ${inputs.receiver}, stored row ${trace.row}: one copied first projection`}
        input={trace.first.input} weights={trace.first.weights} coordinate={inputs.hiddenChannel} />
      <p>The three products above explain this member’s projection before graph mixing. The other permitted
        senders use the same copied weight row with their own input rows. In the last layer, each source
        instead projects all sixteen hidden coordinates. Follow both resulting class paths below.</p>
      {trace.last.map((layer, c) => <InspectorLayerTerms key={c} layer={layer} kind={family} outputCoordinate={c}
        label={`Last-layer incoming products for class ${c}`} />)}
      <InspectorProbabilityFigure trace={trace} />
      <p>Subtract the same maximum from both logits, exponentiate, then divide each mass by their shared total.
        This changes numerical scale without changing the softmax probabilities. A probability is the model’s
        output here; the true club is a separate answer annotation.</p>
      <InspectorClassLegend /><InspectorProbabilityTable trace={trace} />
    </>}
  </FlowLab>;
}

export function MessagePassingSavedFeatureLab() {
  const { family, model, inputs, dispatch, trace, originalFeaturesResult } = useSavedGraphInspector();
  const selected = inputs.features[inputs.featureNode], original = inspectorFeatures[inputs.featureNode];
  return <FlowLab label="Edit any coordinate of any observed feature row">
    {model ? <InspectorProjection title={`Feature member ${inputs.featureNode}: original versus current inputs`}
      input={selected} original={original} weights={model.state['first.linear.weight'][inputs.hiddenChannel]} coordinate={inputs.hiddenChannel} /> : <InspectorResourceStatus />}
    <FlowControls>
      <InspectorSelect label="Feature member" value={inputs.featureNode} choices={inspectorMemberChoices} onChange={value => dispatch({ type: 'featureNode', value })} />
      <InspectorSelect label="Feature coordinate" value={inputs.featureCoordinate} choices={inspectorFeatureNames.map((name, c) => [c, name])}
        onChange={value => dispatch({ type: 'featureCoordinate', value })} />
      <FlowSlider name="Diagnostic input value" value={selected[inputs.featureCoordinate]} min={-2} max={2} step="any" onChange={value => dispatch({ type: 'feature', value })} />
      <button type="button" onClick={() => dispatch({ type: 'restore-features' })}>Restore original feature rows only</button>
    </FlowControls>
    <FlowReadout>Member {inputs.featureNode}, {inspectorFeatureNames[inputs.featureCoordinate]}:
      {' '}{number(original[inputs.featureCoordinate])} originally → {number(selected[inputs.featureCoordinate])} now.
      {trace && originalFeaturesResult && <> With the current graph held fixed, member {inputs.receiver} has
        {' '}P(Officer) {number(originalFeaturesResult.probabilities[inputs.receiver][1])} using all original
        feature rows and {number(trace.probabilities[1])} using all current feature rows.</>}</FlowReadout>
    <p>The selected cell changes the input before its copied weight is applied. The three products show its
      first projection; graph mixing and the second layer determine which receiver outputs are affected.
      An edit can have no effect when the necessary path or active computation is absent. The comparison
      retains every current feature edit, so it is not an attribution to just the most recent slider move.</p>
    <p>Original values describe the observed graph: x0 = 1, x1 = degree/33, x2 = clustering. The slider is a
      diagnostic intervention, including negative inputs; it does not assert that a negative graph degree
      or clustering was observed. Removing relationships later leaves these feature rows fixed.
      Feature-only restoration preserves the current graph, selected receiver, storage order and pin.</p>
    <InspectorFeatureTable features={inputs.features} order={inputs.reversed ? reversedOrder : canonicalOrder} receiver={inputs.receiver} />
  </FlowLab>;
}

export function MessagePassingSavedEdgeLab() {
  const { family, inputs, dispatch, trace, model } = useSavedGraphInspector();
  const [left, right] = inspectorEdges[inputs.edgeIndex], present = Boolean(inputs.adjacency[left][right]);
  const open = id => inputs.adjacency[id].reduce((sum, value) => sum + value, 0);
  return <FlowLab label="Remove or restore one original observed relationship">
    <Drawing label={`Observed pair ${left}—${right} and its current receiving support`} width={624} height={318}>
      <text x={24} y={28}>One original undirected relationship: member {left}—member {right}</text>
      <MemberMark id={left} x={142} y={102} selected={left === inputs.receiver} />
      <MemberMark id={right} x={470} y={102} selected={right === inputs.receiver} />
      <line x1={166} y1={102} x2={446} y2={102} stroke="#e7a6da" strokeWidth={3} strokeDasharray={present ? undefined : '7 7'} />
      <text x={276} y={84} fill="#e7a6da">{present ? 'present' : 'absent'}</text>
      <text x={24} y={160}>Open degree: member {left} → {open(left)}; member {right} → {open(right)}</text>
      <text x={24} y={194}>Current {inspectorFamilyNames[family]} support counts:</text>
      <text x={24} y={224}>member {left} → {sourceWeight(family, inputs.adjacency, left)}; member {right} → {sourceWeight(family, inputs.adjacency, right)}</text>
      <text x={24} y={262}>Feature rows stay fixed; GCN/GAT include their own row.</text>
      <text x={24} y={296}>Mean-SAGE uses open neighbors; MLP has no message support.</text>
    </Drawing>
    <FlowControls>
      <InspectorSelect label="Original relationship" value={inputs.edgeIndex} choices={inspectorEdges.map(([a, b], index) => [index, `Member ${a} — member ${b}`])}
        onChange={value => dispatch({ type: 'edgeIndex', value })} />
      <label><input type="checkbox" checked={present} onChange={event => dispatch({ type: 'edge', value: event.target.checked })} /> Keep this relationship</label>
    </FlowControls>
    <FlowReadout>Relationship {left}—{right} is {present ? 'present in both directions' : 'absent in both directions'}.
      {trace && <> The selected receiver remains member {inputs.receiver}; P(Officer) is {number(trace.probabilities[1])}.</>}</FlowReadout>
    <p>The same toggle changes both off-diagonal entries of this undirected pair. Other removed pairs and
      feature edits remain as they were. GCN rebuilds closed degrees; Mean-SAGE rebuilds its open count;
      GAT rebuilds each affected local attention support. Inspect the focused product paths above to see
      the actual coefficients for the selected receiver.</p>
    <InspectorClassLegend /><InspectorGraph adjacency={inputs.adjacency} receiver={inputs.receiver} edgeIndex={inputs.edgeIndex} />
    {!model && <InspectorResourceStatus />}
  </FlowLab>;
}

export function MessagePassingSavedNoEdgesLab() {
  const { family, inputs, dispatch, trace, originalGraphResult, summary } = useSavedGraphInspector();
  return <FlowLab label="Compare current and original message graphs on the exact same feature rows">
    <div className="mp-inspector-pair">
      <InspectorGraph label="Original adjacency; current feature rows" adjacency={inspectorAdjacency} receiver={inputs.receiver} />
      <InspectorGraph label="Current adjacency; same feature rows" adjacency={inputs.adjacency} receiver={inputs.receiver} />
    </div>
    <FlowControls>
      <button type="button" onClick={() => dispatch({ type: 'remove-edges' })}>Remove all message edges only</button>
      <button type="button" onClick={() => dispatch({ type: 'restore-edges' })}>Restore original adjacency only</button>
    </FlowControls>
    <FlowReadout>{78 - summary.removedEdges.length} of 78 original relationships remain.
      {trace && originalGraphResult && <> Using the same current features and saved {inspectorFamilyNames[family]},
        {' '}member {inputs.receiver} has P(Officer) {number(originalGraphResult.probabilities[inputs.receiver][1])}
        {' '}on the original adjacency and {number(trace.probabilities[1])} on the current adjacency.</>}</FlowReadout>
    <p>The graph comparison holds the entire current feature matrix fixed, including your edits.
      Only adjacency changes. If the current graph is empty, GCN and GAT still have each member’s self path;
      Mean-SAGE has a zero open-neighbor summary plus its separate self branch. The MLP does not read
      adjacency, so its two results are identical. Original degree and clustering features still carry
      information about the original graph; this experiment removes message routes, not that information.</p>
    <InspectorClassLegend />
  </FlowLab>;
}

export function MessagePassingSavedStorageLab() {
  const { family, inputs, dispatch, trace, forwards } = useSavedGraphInspector();
  const id = inputs.receiver;
  return <FlowLab label="Reverse storage while preserving semantic member identity and edited inputs">
    <Drawing label="The same selected member moves to a different storage row" height={352}>
      <text x={24} y={28}>Same member {id}; original row {id} → reversed row {33 - id}</text>
      <text x={24} y={62}>Original storage: its three current feature cells</text>
      <Cells x={148} y={80} values={[inputs.features[id]]} cellWidth={164} digits={5} />
      <Arrow x1={394} y1={142} x2={394} y2={178} />
      <text x={24} y={214}>Reversed storage: copied from that same member</text>
      <Cells x={148} y={232} values={[inputs.features[reversedOrder[33 - id]]]} cellWidth={164} digits={5} />
      <text x={24} y={312}>Permute both adjacency axes by the same ID order.</text>
    </Drawing>
    <FlowControls><label><input type="checkbox" checked={inputs.reversed} onChange={event => dispatch({ type: 'reversed', value: event.target.checked })} /> Reverse feature and adjacency storage</label></FlowControls>
    <FlowReadout>Member {id} is now read at stored row {inputs.reversed ? 33 - id : id}.
      {trace && forwards && <> Under saved {inspectorFamilyNames[family]}, the maximum semantic logit difference
        {' '}across all members/classes is {forwards.maximumLogitDifference.toExponential(3)};
        the maximum probability difference is {forwards.maximumProbabilityDifference.toExponential(3)}.</>}</FlowReadout>
    <p>The selected member did not change. Both inference routes use the same edited feature values and
      relationships, with the same copied weights. Compare outputs by member ID, not array position.
      Summation order may change floating-point rounding; the saved float32 comparison tolerance is
      absolute 10⁻⁴ for logits and probabilities. These current computations report their actual differences.</p>
    {forwards && <div className="mp-inspector-table-pan" tabIndex={0} role="region" aria-label="Matched semantic member logits and probabilities">
      <table className="mp-inspector-values"><caption>Matched outputs for member {id}, not two different rows mistaken for two people.</caption>
        <thead><tr>{['Route', 'Stored row', 'Logit0', 'Logit1', 'P0', 'P1'].map(text => <th scope="col" key={text}>{text}</th>)}</tr></thead>
        <tbody>{[['Original storage', id, forwards.canonical], ['Reversed storage', 33 - id, forwards.reversed]].map(([name, row, result]) => <tr key={name}>
          <th scope="row">{name}</th><td>{row}</td>{[...result.logits[row], ...result.probabilities[row]].map((value, c) => <td key={c}>{number(value, 8)}</td>)}
        </tr>)}</tbody>
      </table>
    </div>}
    <p>In the full matrices below, the column and row headings carry both storage addresses and member IDs.
      Follow the white outlines to the selected member. The feature table uses the currently chosen storage order.</p>
    <InspectorFeatureTable features={inputs.features} order={inputs.reversed ? reversedOrder : canonicalOrder} receiver={id} />
    <InspectorAdjacencyFigure adjacency={inputs.adjacency} order={canonicalOrder} receiver={id} label="Current adjacency in original storage" />
    <InspectorAdjacencyFigure adjacency={inputs.adjacency} order={reversedOrder} receiver={id} label="Exactly the same adjacency in reversed storage" />
  </FlowLab>;
}
