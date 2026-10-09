import { useState } from 'react';
import { NeuralLab, NeuralNumber, NeuralSelect, NeuralTable, formatNeural } from './NeuralLessonElements.jsx';
import './neural-lesson-neutral.css';
import { supervisedTokenTrace, lowRankUpdate } from '../../data/fine-tuning-platform-models.js';

const row = { display: 'flex', flexWrap: 'wrap', gap: '.6rem', marginBlock: '1rem' };
const tile = { padding: '.65rem', border: '1px solid #68542e', borderRadius: 4, flex: '1 1 125px', background: '#141311' };

export function FineTuningArtifactFigure() {
  return <figure><figcaption>A run is a chain of meaning, not just weights</figcaption><div style={row}>{['Records + split →', 'Template + tokens →', 'Labels + trainable state →', 'Updates →', 'Adapter + exact base + tokenizer'].map(text => <div style={tile} key={text}>{text}</div>)}</div><p>Changing an earlier contract can change what the later artifact does, even if its filename stays the same.</p></figure>;
}

export function FineTuningMaskLab() {
  const [answerCount, setAnswerCount] = useState(1), [maxLength, setMaxLength] = useState(7), [mode, setMode] = useState('answer');
  const trace = supervisedTokenTrace(answerCount, maxLength, mode === 'answer');
  return <NeuralLab id="fine-tuning-masks" title="Which token is actually teaching the model?">
    <p>Constructed token IDs represented by readable names. A filled amber tile is a supervised target, not a predicted answer. Position t uses logits from t−1.</p>
    <div className="neural-controls"><NeuralNumber label="Answer content tokens" value={answerCount} onChange={setAnswerCount} min={0} max={5} step={1} integer /><NeuralNumber label="Maximum sequence length" value={maxLength} onChange={setMaxLength} min={4} max={11} step={1} integer /><NeuralSelect label="Loss supervision" value={mode} onChange={setMode} options={[["answer", 'Answer and EOS only'], ['full', 'All non-padding next tokens']]} /></div>
    <div style={row}>{trace.rows.map(item => <div key={item.position} style={{ ...tile, background: item.active ? '#332814' : '#141311', borderColor: item.active ? '#e4b752' : '#555', flexBasis: 120 }}><strong>{item.position}: {item.token}</strong><br />{item.active ? `Target of logits ${item.source}` : item.attention ? 'Context only' : 'Padding'}</div>)}</div>
    <p><strong>{trace.activeCount} active targets.</strong> {trace.activeCount === 0 ? 'No mean loss is defined: truncation removed every supervised target.' : 'The loss divides by this count, not by padded length.'} {trace.truncated ? 'This length truncates the full record.' : 'The complete record fits.'}</p>
    <NeuralTable caption="Attention and loss labels do different jobs" headers={['Position / token', 'Attention', 'Loss label', 'Predicting logits']} rows={trace.rows.map(item => [`${item.position}: ${item.token}`, item.attention ? 1 : 0, item.label, item.source === null ? 'No direct loss' : item.source])} />
    <p>Set length to 4 to remove the answer; raise it to restore targets. Zero answer content can still supervise EOS. Context-only tokens remain visible to subsequent causal positions.</p>
    <button type="button" onClick={() => { setAnswerCount(1); setMaxLength(7); setMode('answer'); }}>Reset token trace</button>
  </NeuralLab>;
}

export function LowRankUpdateLab() {
  const [first, setFirst] = useState(.2), [second, setSecond] = useState(-.1), [alpha, setAlpha] = useState(2);
  const result = lowRankUpdate(first, second, alpha);
  return <NeuralLab id="low-rank-path" title="Follow a rank-one correction through its bottleneck">
    <p>Exact arithmetic for x=[1, 2, −1], A=[1, −1, .5], rank r=1 and fixed base output [.5, −.5]. Edit B or scaling and inspect both output channels.</p>
    <div className="neural-controls"><NeuralNumber label="B first output" value={first} onChange={setFirst} min={-1} max={1} step={.05} /><NeuralNumber label="B second output" value={second} onChange={setSecond} min={-1} max={1} step={.05} /><NeuralNumber label="Alpha" value={alpha} onChange={setAlpha} min={0} max={4} step={.25} /></div>
    <div style={row}><div style={tile}>Input<br />[1, 2, −1]</div><div style={tile}>Compress with A<br />1 − 2 − .5 = <strong>−1.5</strong></div><div style={tile}>Expand with B and α<br />[{result.correction.map(value => formatNeural(value)).join(', ')}]</div><div style={tile}>Add base output<br /><strong>[{result.output.map(value => formatNeural(value)).join(', ')}]</strong></div></div>
    <NeuralTable caption="Follow the two output channels" headers={['Output', 'Base', 'Correction', 'Result']} rows={result.output.map((value, index) => [index + 1, index === 0 ? .5 : -.5, formatNeural(result.correction[index]), formatNeural(value)])} />
    <p>Both channels receive the same compressed coordinate, scaled by their own B entry. They cannot independently depend on another direction in the input at rank one. Set α=0 for the unchanged-base case; change one B entry to affect only its output channel.</p>
    <button type="button" onClick={() => { setFirst(.2); setSecond(-.1); setAlpha(2); }}>Reset correction</button>
  </NeuralLab>;
}
