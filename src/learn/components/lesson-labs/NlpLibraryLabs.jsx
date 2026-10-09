import { useId, useState } from 'react';
import { NeuralLab, NeuralNumber, NeuralSelect } from './NeuralLessonElements.jsx';
import { anchorText, inspectTextSpan } from '../../data/text-alignment-model.js';
import './neural-lesson-neutral.css';
import './framework-data-contracts.css';

export function TextOffsetLab() {
  const id = useId();
  const [text, setText] = useState(anchorText), [start, setStart] = useState(14), [end, setEnd] = useState(22), [policy, setPolicy] = useState('punctuation');
  const view = inspectTextSpan(text, start, end, policy), length = view.chars.length;
  const editText = value => { const next = Array.from(value).slice(0,200).join(''); const n = Array.from(next).length; setText(next); setStart(previous => Math.min(previous,n)); setEnd(previous => Math.min(previous,n)); };
  const reset = () => { setText(anchorText); setStart(14); setEnd(22); setPolicy('punctuation'); };
  return <NeuralLab id="text-offsets" title="Inspect source characters, token boundaries and a PLACE span">
    <label htmlFor={id}>Source text (up to 200 Unicode code points)</label><textarea id={id} className="contract-text" value={text} onChange={event => editText(event.target.value)} />
    <div className="neural-controls"><NeuralNumber label="Span start (included)" value={start} onChange={setStart} min={0} max={length} step={1} integer /><NeuralNumber label="Span end (excluded)" value={end} onChange={setEnd} min={0} max={length} step={1} integer /><NeuralSelect label="Teaching tokenizer" value={policy} onChange={setPolicy} options={[["punctuation","Group letters/numbers; separate punctuation"],["whitespace","Whitespace-only split"]]} /></div>
    <h4>Original code-point positions</h4><div className="contract-characters" aria-label="Characters with source indices">{view.chars.map((character,index) => <span className="contract-character" data-selected={index >= start && index < end} key={index}><small>{index}</small>{/\s/u.test(character) ? '·' : character}</span>)}</div>
    <p>Selected source slice: <strong>{view.validRange ? `“${view.substring}”` : 'empty or invalid interval'}</strong>. Spaces appear as dots above; the source remains unchanged.</p>
    <h4>Tokens and strict labels</h4><div className="contract-tokens">{view.tokens.map((token,index) => <div className="contract-token" data-selected={view.aligned && view.tags[index] !== 'O'} key={`${token.start}-${token.end}`}><strong>{token.text}</strong><small>[{token.start},{token.end})</small><span>{view.tags[index]}</span></div>)}</div>
    <p className="contract-result">{view.aligned ? 'Aligned: both span boundaries coincide with token boundaries. B starts the place and I continues it.' : 'No aligned PLACE label is produced: use a nonempty range whose start and end both match token boundaries. O labels here mean the proposed span was rejected, not that an independent annotator certified no entity.'}</p>
    <button type="button" onClick={reset}>Reset sentence and span</button><p>This transparent tokenizer is not spaCy or a general word segmenter. Choosing a span edits the modeled annotation; it is never graded.</p>
  </NeuralLab>;
}

export function SubwordLabelFigure() {
  const pieces = [['[CLS]','none','−100'],['play','0','0'],['##ing','0','−100'],['[SEP]','none','−100']];
  return <figure className="contract-figure"><figcaption>One annotated word, two pieces, one supervised position</figcaption><p>Original word 0: <strong>playing</strong> · class label 0. The first-piece policy supervises play.</p><div className="contract-subword">{pieces.map(([piece,owner,label]) => <div key={piece}><strong>{piece}</strong><p>Word owner: {owner}</p><p>Attention: 1</p><p>Loss label: {label}</p></div>)}</div><p>−100 is the chosen loss ignore index. A position can remain visible to attention while contributing no direct token-label loss.</p></figure>;
}
