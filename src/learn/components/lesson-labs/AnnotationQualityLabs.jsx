import { useState } from 'react';
import { NeuralLab, NeuralNumber, NeuralSelect, NeuralTable, formatNeural as f } from './NeuralLessonElements.jsx';
import { annotationEvidence, weightedAnnotationAudit } from '../../data/annotation-quality-models.js';
import './neural-lesson-neutral.css';
import './annotation-quality-labs.css';
export function AnnotationQualityFigure() {
  return <figure className="annotation-quality-flow"><figcaption>One release, three different evidence questions</figcaption><div><section><h4>Aggregate</h4><p>Independent judgments → plausible target</p><small>Model assumptions and worker overlap</small></section><section><h4>Improve</h4><p>Selected boundary cases → review queue</p><small>Useful corrections, not a population sample</small></section><section><h4>Estimate quality</h4><p>Independent sample → weighted error</p><small>Sampling design and reference validity</small></section></div><p>Approved release IDs remain separate from every automatic proposal.</p></figure>;
}
const initialRaters = () => [{
  name: 'A',
  vote: '1',
  sensitivity: .9,
  specificity: .9
}, {
  name: 'B',
  vote: '0',
  sensitivity: .6,
  specificity: .6
}];
export function AnnotationEvidenceLab() {
  const [prior, setPrior] = useState(.5),
    [raters, setRaters] = useState(initialRaters),
    [copy, setCopy] = useState('no');
  const result = annotationEvidence(prior, raters, copy === 'yes');
  const update = (index, field, value) => setRaters(old => old.map((r, i) => i === index ? {
    ...r,
    [field]: value
  } : r));
  return <NeuralLab id="annotation-worker-evidence" title="Follow each judgment into two competing explanations"><NeuralNumber label="Prior probability of class 1" value={prior} onChange={setPrior} min={.05} max={.95} step={.05} /><div className="annotation-rater-grid">{raters.map((rater, index) => <div key={rater.name} className="annotation-rater"><h4>Worker {rater.name}</h4><NeuralSelect label={`Worker ${rater.name} judgment`} value={rater.vote} onChange={v => update(index, 'vote', v)} options={[['0', '0'], ['1', '1'], ['', 'Abstain']]} /><NeuralNumber label={`${rater.name} sensitivity`} value={rater.sensitivity} onChange={v => update(index, 'sensitivity', v)} min={.05} max={.95} step={.05} /><NeuralNumber label={`${rater.name} specificity`} value={rater.specificity} onChange={v => update(index, 'specificity', v)} min={.05} max={.95} step={.05} /><div className="annotation-confusion"><span>Observed / true</span><span>0</span><span>1</span>{['0', '1'].map(v => <div className={rater.vote === v ? 'annotation-active' : ''} key={v}><strong>{v}</strong><span>{f(v === '0' ? rater.specificity : 1 - rater.specificity, 2)}</span><span>{f(v === '1' ? rater.sensitivity : 1 - rater.sensitivity, 2)}</span></div>)}</div></div>)}</div>
    <NeuralSelect label="Count a copied B judgment again" value={copy} onChange={setCopy} options={[['no', 'No copy'], ['yes', 'Count copy as if independent']]} />{copy === 'yes' && <p className="annotation-warning">This is a deliberately violated independence assumption. The copy adds no new observation of the item.</p>}
    <NeuralTable caption="Unnormalized masses after each observed judgment" headers={['Stage', 'True 0 mass', 'True 1 mass']} rows={result.stages.map(s => [s.name, f(s.zero, 6), f(s.one, 6)])} />
    <div className="annotation-posterior"><p>Normalized P(true=1 | judgments): <strong>{f(result.posterior, 6)}</strong></p><div className="annotation-probability-bar" role="img" aria-label={`Class 0 probability ${f(1 - result.posterior)}, class 1 probability ${f(result.posterior)}`}><span style={{
          width: `${100 * (1 - result.posterior)}%`
        }} /><span style={{
          width: `${100 * result.posterior}%`
        }} /></div><p>Grey = class 0 ({f(1 - result.posterior, 4)}); amber = class 1 ({f(result.posterior, 4)}). These are model-conditioned probabilities, not audited correctness.</p></div>
    <div className="neural-actions"><button type="button" onClick={() => {
        setPrior(.5);
        setRaters(initialRaters());
        setCopy('no');
      }}>Reset worker evidence</button></div>
  </NeuralLab>;
}
export function AnnotationAuditLab() {
  const [share, setShare] = useState(20),
    [counts, setCounts] = useState([20, 20]),
    [errors, setErrors] = useState([2, 8]);
  const result = weightedAnnotationAudit(share / 100, counts, errors);
  const editCount = (index, value) => {
    setCounts(old => old.map((n, i) => i === index ? value : n));
    setErrors(old => old.map((e, i) => i === index ? Math.min(e, value) : e));
  };
  const percent = value => value === null ? 'unmeasured' : `${f(value * 100, 2)}%`;
  return <NeuralLab id="annotation-stratified-audit" title="Separate the review sample from the release population"><p>Constructed independent audit counts. Amber × = error; grey ✓ = passed the stated reference check. Adjust counts directly; this is not a random sampling simulation.</p><NeuralNumber label="Difficult cases in population (%)" value={share} onChange={setShare} min={0} max={100} step={1} integer /><div className="annotation-rater-grid">{['Easy', 'Difficult'].map((name, index) => <div key={name} className="annotation-rater"><h4>{name}: {f(result.weights[index] * 100)}% of population</h4><div className="annotation-population-track"><span style={{
            width: `${100 * result.weights[index]}%`
          }} /></div><NeuralNumber label={`${name} audited count`} value={counts[index]} onChange={v => editCount(index, v)} min={0} max={40} step={1} integer /><NeuralNumber label={`${name} error count`} value={errors[index]} onChange={v => setErrors(old => old.map((e, i) => i === index ? v : e))} min={0} max={counts[index]} step={1} integer /><div className="annotation-audit-cells" aria-label={`${errors[index]} errors out of ${counts[index]} audited ${name.toLowerCase()} cases`}>{Array.from({
            length: counts[index]
          }, (_, i) => <span key={i} className={i < errors[index] ? 'annotation-error' : ''} aria-hidden="true">{i < errors[index] ? '×' : '✓'}</span>)}</div><p>Error rate: <strong>{percent(result.rates[index])}</strong></p></div>)}</div>
    <div className="annotation-estimates"><p>Pooled audit rate<strong>{percent(result.pooled)}</strong><small>Every audited item gets equal weight</small></p><p>Population-weighted rate<strong>{percent(result.weighted)}</strong><small>Stratum rates × population shares</small></p></div>
    <p>{result.weighted === null ? 'A stratum with positive population share has no audit observations. Its error rate is unmeasured.' : `${f(result.weights[0], 2)} × ${percent(result.rates[0])}${result.rates[0] === null ? ' (zero weight)' : ''} + ${f(result.weights[1], 2)} × ${percent(result.rates[1])}${result.rates[1] === null ? ' (zero weight)' : ''} = ${percent(result.weighted)}. Representative sampling within each stratum is still required.`}</p>
    <div className="neural-actions"><button type="button" onClick={() => {
        setShare(20);
        setCounts([20, 20]);
        setErrors([2, 8]);
      }}>Reset audit design</button></div>
  </NeuralLab>;
}
