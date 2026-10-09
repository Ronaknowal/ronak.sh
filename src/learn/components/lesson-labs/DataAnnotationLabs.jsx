import { useState } from 'react';
import { NeuralLab, NeuralSelect, formatNeural } from './NeuralLessonElements.jsx';
import { annotationMessages, initialAnnotations, annotationAgreement } from '../../data/annotation-agreement-model.js';
import './neural-lesson-neutral.css';
import './framework-data-contracts.css';

export function AnnotationReleaseFigure() {
  return <figure className="contract-figure"><figcaption>Keep the judgments behind a released target</figcaption><div className="contract-flow">
    <div><strong>Message 17</strong><p>Payments fail for all users.</p><small>Original evidence + rubric version</small></div>
    <div><strong>Independent judgments</strong><p>A: U · B: R · C: U</p><small>Two agree with U; B disagrees</small></div>
    <div><strong>Proposal → review</strong><p>Majority proposes U</p><small>Reviewer checks the evidence and records the reason</small></div>
    <div><strong>Released target: U</strong><p>Approved annotation 71</p><small>Original judgments remain in the audit record</small></div>
  </div></figure>;
}

export function AnnotationAgreementLab() {
  const [rows, setRows] = useState(() => initialAnnotations.map(row => [...row]));
  const result = annotationAgreement(rows);
  const edit = (item, rater, value) => setRows(previous => previous.map((row, i) => i === item ? row.map((v, j) => j === rater ? value : v) : row));
  const show = value => value === null ? 'undefined' : formatNeural(value, 4);
  return <NeuralLab id="annotation-agreement" title="Change judgments; inspect agreement and release proposals">
    <p>U = Urgent · R = Routine. These are counterfactual rater judgments, not a quiz. The statistics below compare A with B; C only affects the majority proposal.</p>
    {rows.map((labels, item) => <div className="contract-annotation-row" key={item}><p><strong>{item + 1}.</strong> {annotationMessages[item]}</p><div className="contract-annotations">
      {labels.map((value, rater) => <NeuralSelect key={rater} label={`Message ${item + 1}, rater ${'ABC'[rater]}`} value={value} options={[['U','U · Urgent'],['R','R · Routine'],['','Abstain']]} onChange={value => edit(item, rater, value)} />)}
      <p>Proposal: <strong>{result.proposals[item] || 'unresolved'}</strong></p>
    </div></div>)}
    <div className="contract-grid"><div><h4>A rows × B columns</h4><div className="contract-matrix" aria-label="Agreement counts"><span>A / B</span><span>U</span><span>R</span>{result.matrix.flatMap((row, i) => [<span key={`label-${i}`}>{i === 0 ? 'U' : 'R'}</span>, ...row.map((count,j) => <span key={`${i}-${j}`} className={i === j ? 'contract-agree' : ''}>{count}{i === j ? ' agree' : ' differ'}</span>)])}</div></div>
      <div><h4>Same current judgments</h4><div className="contract-metrics"><p>Paired<strong>{result.paired}/6</strong></p><p>Observed pₒ<strong>{show(result.observed)}</strong></p><p>Baseline pₑ<strong>{show(result.expected)}</strong></p><p>κ<strong>{show(result.kappa)}</strong></p></div><p>{result.paired === 0 ? 'No paired judgments: there is no agreement denominator.' : result.expected === 1 ? 'Both raters use only one identical category. Agreement is 1, but κ divides by 0.' : 'κ compares the diagonal agreement with the baseline calculated from these raters’ category proportions.'}</p></div>
    </div>
    <div className="neural-actions"><button type="button" onClick={() => setRows(rows.map(() => ['R','R','R']))}>All Routine: inspect the null denominator</button><button type="button" onClick={() => setRows(rows.map(() => ['','','']))}>All abstain</button><button type="button" onClick={() => setRows(initialAnnotations.map(row => [...row]))}>Reset judgments</button></div>
    <p className="contract-result">Initial comparison: four of six pairs agree, pₑ=0.5 and κ=1/3. Review the messages behind disagreements before choosing a labeling change.</p>
  </NeuralLab>;
}
