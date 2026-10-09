import { createContext, useContext, useState, useId } from 'react';
import { AggregationQuantity } from './MessagePassingAggregationState.jsx';
import './message-aggregation-flow.css';

const PaperAttentionContext = createContext(null);
const ScoreStageContext = createContext(null);
export const initialPaperAttention = () => [[1, 0], [2, 1], [4, -1]];
const initialStage = () => ({ senders: [1, 2], receivers: [0, -3], values: [1, 3], allowed: [[true, true], [true, true]], slope: .2 });

// Full projected rows and the separate intermediate-score experiment have
// different owners. Editing an intermediate term never pretends to refit W.
export function MessagePassingAttentionProvider({ children }) {
  const [features, setFeatures] = useState(initialPaperAttention);
  const [paper, setPaper] = useState(1), [channel, setChannel] = useState(0);
  const [paperRevision, setPaperRevision] = useState(0);
  const [stage, setStage] = useState(initialStage);
  const [stageRevision, setStageRevision] = useState(0);
  const [sender, setSender] = useState(0), [receiver, setReceiver] = useState(0);
  const editFeature = value => setFeatures(rows => rows.map((row, i) => row.map((v, j) => i === paper && j === channel ? value : v)));
  const resetPaper = () => { setFeatures(initialPaperAttention()); setPaper(1); setChannel(0); setPaperRevision(r => r + 1); };
  const editStage = (kind, index, value) => setStage(old => ({ ...old, [kind]: old[kind].map((v, i) => i === index ? value : v) }));
  const editPermission = value => setStage(old => ({ ...old, allowed: old.allowed.map((row, i) => row.map((v, j) => i === receiver && j === sender ? value : v)) }));
  const resetStage = () => { setStage(initialStage()); setSender(0); setReceiver(0); setStageRevision(r => r + 1); };
  return <PaperAttentionContext.Provider value={{ features, paper, channel, setPaper, setChannel, editFeature, resetPaper, revision: paperRevision }}>
    <ScoreStageContext.Provider value={{ stage, sender, receiver, setSender, setReceiver, editStage, editPermission, setSlope: value => setStage(s => ({ ...s, slope: value })), resetStage, revision: stageRevision }}>{children}</ScoreStageContext.Provider>
  </PaperAttentionContext.Provider>;
}

export const AttentionQuantity = AggregationQuantity;
export function AttentionSelect({ label, value, choices, onChange }) {
  const id = useId();
  return <label className="mp-aggregation-select" htmlFor={id}>{label}
    <select id={id} aria-label={label} value={value} onChange={e => onChange(Number(e.target.value))}>
      {choices.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
    </select>
  </label>;
}
export function usePaperAttention() {
  const value = useContext(PaperAttentionContext);
  if (!value) throw new Error('Wrap connected GAT views in MessagePassingAttentionProvider.');
  return value;
}
export function useScoreStage() {
  const value = useContext(ScoreStageContext);
  if (!value) throw new Error('Wrap connected intermediate score views in MessagePassingAttentionProvider.');
  return value;
}
