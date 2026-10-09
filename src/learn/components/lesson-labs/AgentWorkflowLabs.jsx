import { useState } from 'react';
import { NeuralLab, NeuralNumber, NeuralSelect, NeuralTable } from './NeuralLessonElements.jsx';
import './neural-lesson-neutral.css';
import { workflowRoute, replayEffect } from '../../data/agent-workflow-models.js';
const flow = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '.7rem',
  marginBlock: '1rem'
};
const card = {
  flex: '1 1 180px',
  padding: '.75rem',
  border: '1px solid #65532e',
  background: '#171512',
  borderRadius: 4
};
export function WorkflowBoundaryFigure() {
  return (
    <figure aria-label="State and tool effect are separate records">
    <figcaption>A run has both a control path and an effect boundary</figcaption>
    <div style={flow}>{['Plan → structured proposal', 'Review → approve or reject', 'Apply → atomic effect + receipt', 'Save completion → workflow checkpoint'].map(t => <div style={card} key={t}>{t}</div>)}</div>
    <p>The effect can commit before the workflow checkpoint is saved. Recovery must handle that gap.</p>
    </figure>
  );
}
export function WorkflowRouteLab() {
  const [approval, setApproval] = useState('allow'),
    [failures, setFailures] = useState(1),
    [limit, setLimit] = useState(3);
  const result = workflowRoute(approval === 'allow', failures, limit);
  return <NeuralLab id="workflow-route" title="Follow a bounded action through approval and retries">
    <p>A deterministic workflow, not a language-model run. These injected transient failures occur before any effect; the next investigation moves the failure after commit. Approval is the example system's state, not a learner prediction.</p>
    <div className="neural-controls">
    <NeuralSelect label="Proposal disposition" value={approval} onChange={setApproval} options={[['allow', 'Approve exact proposal'], ['reject', 'Reject proposal']]} />
    <NeuralNumber label="Transient failures before success" value={failures} onChange={setFailures} min={0} max={3} step={1} integer />
    <NeuralNumber label="Maximum attempts" value={limit} onChange={setLimit} min={1} max={4} step={1} integer />
    </div>
    <p>
    <strong>Final state: {result.status} · attempts {result.attempts} · committed effects {result.effects}</strong>
    </p>
    <ol style={{
      paddingLeft: '1.4rem'
    }}>{result.events.map((event, index) => <li key={index} style={{
        padding: '.6rem 0',
        borderBottom: '1px solid #403a2b'
      }}>
    <strong>{event.stage}</strong> → {event.detail}</li>)}</ol>
    <p>Changing approval bypasses execution entirely. Increasing the attempt limit helps only if the allowed attempts reach a successful try; a permanent validation or authorization error should not use this retry policy.</p>
    <button type="button" onClick={() => {
      setApproval('allow');
      setFailures(1);
      setLimit(3);
    }}>Reset workflow route</button>
  </NeuralLab>;
}
export function EffectReplayLab() {
  const [window, setWindow] = useState('after-effect'),
    [deliveries, setDeliveries] = useState(2),
    [mode, setMode] = useState('receipt');
  const result = replayEffect(window, deliveries, mode === 'receipt');
  return <NeuralLab id="effect-replay" title="Separate a saved checkpoint from a committed effect">
    <p>One intended increment. Only delivery 1 crashes at the selected boundary; later deliveries retry pending work. A complete checkpoint skips execution. Receipt mode assumes the effect and receipt commit atomically in the same store.</p>
    <div className="neural-controls">
    <NeuralSelect label="First-delivery crash boundary" value={window} onChange={setWindow} options={[['before-effect', 'Before effect'], ['after-effect', 'After effect, before checkpoint'], ['after-checkpoint', 'After checkpoint']]} />
    <NeuralNumber label="Total delivery attempts" value={deliveries} onChange={setDeliveries} min={1} max={4} step={1} integer />
    <NeuralSelect label="Effect protection" value={mode} onChange={setMode} options={[['receipt', 'Stable key + atomic receipt'], ['none', 'No receipt deduplication']]} />
    </div>
    <div style={flow}>
    <div style={card}>
    <strong>Intended effects</strong>
    <p>1 increment</p>
    </div>
    <div style={card}>
    <strong>Committed counter</strong>
    <p>{result.counter}</p>
    </div>
    <div style={card}>
    <strong>Latest checkpoint</strong>
    <p>{result.checkpoint}</p>
    </div>
    </div>
    <NeuralTable caption="Delivery-by-delivery state, effect and checkpoint" headers={['Delivery', 'Start state', 'Effect operation', 'Outcome', 'Saved state', 'Counter']} rows={result.events.map(e => [e.delivery, e.start, e.effect, e.outcome, e.checkpoint, e.counter])} />
    <p>{result.counter > 1 ? 'The workflow appears complete, but the side effect happened twice. A checkpoint alone did not protect it.' : result.checkpoint === 'ready' ? 'Work remains pending. A committed counter can already exist even though completion was not saved.' : 'The run is complete. Compare the after-effect gap with receipt protection disabled to see what the receipt prevents.'}</p>
    <button type="button" onClick={() => {
      setWindow('after-effect');
      setDeliveries(2);
      setMode('receipt');
    }}>Reset replay study</button>
  </NeuralLab>;
}
