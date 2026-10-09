import { useState } from 'react';
import { NeuralLab, NeuralNumber, NeuralSelect, NeuralTable } from './NeuralLessonElements.jsx';
import './neural-lesson-neutral.css';
import { retrieveEvidence, packEvidence } from '../../data/application-framework-models.js';
const flow = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '.7rem',
  marginBlock: '1rem'
};
const card = {
  flex: '1 1 200px',
  padding: '.75rem',
  border: '1px solid #65532e',
  background: '#171512',
  borderRadius: 4,
  minWidth: 0
};
const queries = [['file exception', 'File + exception'], ['dictionary key', 'Dictionary + key'], ['resource cleanup', 'Resource + cleanup'], ['quantum banana', 'No matching terms']];
export function RetrievalBoundaryFigure() {
  return (
    <figure aria-label="Evidence and answer boundaries">
    <figcaption>Carry identity through every transformation</figcaption>
    <div style={flow}>{['Source + version → identified chunks', 'Question + access policy → ranked candidates', 'Budget + candidates → admitted evidence', 'Evidence + question → generated answer', 'Answer + admitted IDs → support checks'].map(label => <div style={card} key={label}>{label}</div>)}</div>
    <p>Each arrow can fail independently. Preserve the intermediate records so a wrong answer can be traced to its cause.</p>
    </figure>
  );
}
export function EvidenceRetrievalLab() {
  const [query, setQuery] = useState('file exception'),
    [k1, setK1] = useState(1.5),
    [b, setB] = useState(.75);
  const results = retrieveEvidence(query, k1, b),
    terms = results[0].contributions.map(c => c.term);
  return <NeuralLab id="evidence-retrieval" title="See exactly why a passage rises in the ranking">
    <p>Exact lexical scoring over four authored Python-documentation summaries. This ASCII investigation lowercases words; it does not infer synonyms. Every term contribution is visible.</p>
    <div className="neural-controls">
    <label>Question words<input value={query} maxLength={120} onChange={e => setQuery(e.target.value)} />
    </label>
    <NeuralNumber label="Frequency saturation k1" value={k1} onChange={setK1} min={.1} max={3} step={.1} />
    <NeuralNumber label="Length correction b" value={b} onChange={setB} min={0} max={1} step={.05} />
    </div>
    <div style={flow}>{queries.map(([q, label]) => <button key={q} type="button" onClick={() => setQuery(q)}>{label}</button>)}</div>
    <p>{results[0].score > 0 ? `Top matching passage: ${results[0].id}.` : 'No matching passage. An evidence-only application should abstain.'} Query terms: {terms.join(', ') || 'none'}.</p>
    <div style={flow}>{results.map(doc => <article key={doc.id} style={card}>
    <h4>{doc.id} · score {doc.score.toFixed(6)}</h4>
    <p>{doc.text}</p>
    <p>{doc.words.length} lexical words · <a href={doc.url}>Source documentation</a>
    </p>{doc.contributions.map(c => <p key={c.term}>
    <code>{c.term}</code>: count {c.frequency}, in {c.df}/4 documents, contribution <strong>{c.score.toFixed(4)}</strong>
    </p>)}<div aria-hidden="true" style={{
          height: 6,
          width: `${results[0].score ? 100 * doc.score / results[0].score : 0}%`,
          background: '#e9b949'
        }} />
    </article>)}</div>
    <p>Scores are not answer probabilities. Set b to zero to remove length correction; change the words to expose lexical mismatch. Bars share the current highest score as their maximum.</p>
    <button type="button" onClick={() => {
      setQuery('file exception');
      setK1(1.5);
      setB(.75);
    }}>Reset retrieval</button>
  </NeuralLab>;
}
export function ContextPackingLab() {
  const [query, setQuery] = useState('file exception'),
    [total, setTotal] = useState(60),
    [instructions, setInstructions] = useState(10),
    [reserve, setReserve] = useState(20),
    [topK, setTopK] = useState(3);
  const result = packEvidence(query, total, instructions, reserve, topK);
  return <NeuralLab id="context-packing" title="Follow whole passages into a limited context">
    <p>Constructed lexical-word accounting. Real model tokens, chat-template overhead and generation capacity need the deployed tokenizer. Evidence is immediately shown; no model call occurs.</p>
    <div className="neural-controls">
    <NeuralSelect label="Retrieval query" value={query} onChange={setQuery} options={queries} />
    <NeuralNumber label="Total word-unit capacity" value={total} onChange={setTotal} min={20} max={140} step={1} integer />
    <NeuralNumber label="Instruction word reservation" value={instructions} onChange={setInstructions} min={0} max={40} step={1} integer />
    <NeuralNumber label="Output word reservation" value={reserve} onChange={setReserve} min={0} max={60} step={1} integer />
    <NeuralNumber label="Candidate limit" value={topK} onChange={setTopK} min={1} max={4} step={1} integer />
    </div>
    <p>
    <strong>{result.feasible ? `${result.budget} evidence words available; ${result.used} used.` : 'Infeasible: reservations exceed total capacity. No prompt can be admitted.'}</strong>
    </p>
    {result.feasible && <figure aria-label="Shared scale context allocation">
    <figcaption>Every segment uses the same word-unit scale</figcaption>
    <div style={{
        display: 'flex',
        height: 22,
        border: '1px solid #74644a'
      }}>{[[instructions, '#5b5141'], [reserve, '#ad7e28'], [result.used, '#e9b949'], [result.unused, '#202020']].map(([amount, color], i) => <div key={i} style={{
          width: `${100 * amount / total}%`,
          background: color
        }} />)}</div>
    <p>Left to right: instructions {instructions} · output reserve {reserve} · admitted evidence {result.used} · unused evidence allowance {result.unused}.</p>
    </figure>}
    <NeuralTable caption="Greedy whole-passage decisions in rank order" headers={['Passage', 'Words', 'Decision']} rows={result.candidates.map(d => [d.id, d.words.length, d.reason])} />
    {!result.candidates.length && <p>No candidates match this query.</p>}
    <div style={flow}>{result.candidates.filter(d => d.admitted).map(d => <article style={card} key={d.id}>
    <h4>Admitted evidence [{d.id}]</h4>
    <p>{d.text}</p>
    <a href={d.url}>Source</a>
    </article>)}</div>
    <p>Increase the output reservation and watch evidence disappear even though retrieval scores stay unchanged. Skipping a long passage can admit a later shorter one; this policy does not optimize semantic coverage.</p>
    <button type="button" onClick={() => {
      setQuery('file exception');
      setTotal(60);
      setInstructions(10);
      setReserve(20);
      setTopK(3);
    }}>Reset context budget</button>
  </NeuralLab>;
}
