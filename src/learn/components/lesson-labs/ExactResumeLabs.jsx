import { useState } from 'react';
import { NeuralLab, NeuralNumber, NeuralSelect, NeuralTable, NeuralPlot, formatNeural as f } from './NeuralLessonElements.jsx';
import { scalarResume, prefetchResume } from '../../data/exact-resume-models.js';
import './neural-lesson-neutral.css';
import './exact-resume-labs.css';
export function CheckpointBoundaryFigure() {
  return <figure className="resume-boundary"><figcaption>Publish a checkpoint at a consistent update boundary</figcaption><ol>{['Fetch the next batch', 'Forward → loss → backward', 'Apply optimizer update', 'Advance scheduler', 'Clear gradient slots', 'Snapshot all continuation state'].map((text, i) => <li key={text} className={i === 5 ? 'resume-checkpoint' : ''}>{text}</li>)}</ol><p>At the snapshot: consumed examples have affected the model; no accumulation is unfinished. The next step has not started.</p></figure>;
}
export function ResumeStateLab() {
  const [interrupt, setInterrupt] = useState(3),
    [momentum, setMomentum] = useState(.8),
    [omitted, setOmitted] = useState('none');
  const result = scalarResume(interrupt, omitted, momentum);
  const ys = [...result.baseline, ...result.resumed].map(r => r.w);
  const lo = Math.min(...ys, result.checkpoint.w),
    hi = Math.max(...ys, result.checkpoint.w),
    pad = Math.max(.05, (hi - lo) * .15);
  const series = [result.baseline, result.resumed].map((rows, index) => ({
    label: index ? 'Resumed' : 'Uninterrupted',
    color: index ? '#e4b752' : '#dedede',
    dashed: index === 1,
    values: [[interrupt, result.checkpoint.w], ...rows.map((r, i) => [interrupt + i + 1, r.w])]
  }));
  return <NeuralLab id="exact-resume-state" title="Remove one piece of state; inspect the next update"><p>Constructed scalar training, not a neural framework running in the browser. All effects are recomputed immediately.</p><div className="neural-controls"><NeuralNumber label="Interrupt after update" value={interrupt} onChange={setInterrupt} min={1} max={7} step={1} integer /><NeuralNumber label="Momentum coefficient" value={momentum} onChange={setMomentum} min={0} max={.9} step={.1} /><NeuralSelect label="State omitted on restart" value={omitted} onChange={setOmitted} options={[['none', 'Nothing: complete state'], ['momentum', 'Momentum buffer'], ['cursor', 'Data cursor'], ['rng', 'Random-generator state'], ['schedule', 'Scheduler clock']]} /></div>
    <div className="resume-snapshot"><h4>Checkpoint after update {interrupt}</h4><dl>{Object.entries(result.checkpoint).map(([key, value]) => <div key={key}><dt>{{
              w: 'Weight w',
              v: 'Momentum v',
              cursor: 'Data cursor',
              rng: 'Generator state',
              clock: 'Schedule clock'
            }[key]}</dt><dd>{Number.isInteger(value) ? value : f(value, 6)}</dd></div>)}</dl></div>
    <NeuralPlot title="The same checkpoint, two continuations" xLabel="completed update" yLabel="weight w" xDomain={[interrupt, interrupt + 6]} yDomain={[lo - pad, hi + pad]} series={series} />
    <p className="resume-result">{result.firstDifference < 0 ? 'All displayed next-step quantities match. Try a missing field or a different checkpoint.' : `First difference: update ${interrupt + result.firstDifference + 1}. Inspect its row, noise, learning rate and weight below.`}</p>
    <NeuralTable caption="Uninterrupted / resumed values for the next six updates" headers={['Update', 'Row IDs', 'Noise', 'Learning rate', 'Loss', 'New weight']} rows={result.baseline.map((row, i) => [interrupt + i + 1, `${row.row} / ${result.resumed[i].row}`, `${f(row.noise, 4)} / ${f(result.resumed[i].noise, 4)}`, `${f(row.lr, 4)} / ${f(result.resumed[i].lr, 4)}`, `${f(row.loss, 5)} / ${f(result.resumed[i].loss, 5)}`, `${f(row.w, 6)} / ${f(result.resumed[i].w, 6)}`])} />
    <p>{omitted === 'none' ? 'A seed, model weight or batch counter alone would not restore this complete state.' : omitted === 'momentum' && momentum === 0 ? 'Here μ=0, so the previous buffer has no influence. This special case cannot prove momentum state is generally unnecessary.' : omitted === 'cursor' && interrupt % 4 === 0 ? 'The fixed data order repeats every four rows, so this cursor reset happens to preserve the next rows. Epoch shuffling would need more state.' : 'Resetting the selected field changes its future inputs or dynamics; it does not necessarily change every displayed quantity at the first step.'}</p><div className="neural-actions"><button type="button" onClick={() => {
        setInterrupt(3);
        setMomentum(.8);
        setOmitted('none');
      }}>Reset restart comparison</button></div>
  </NeuralLab>;
}
export function PrefetchResumeLab() {
  const [completed, setCompleted] = useState(3),
    [prefetch, setPrefetch] = useState(2),
    [strategy, setStrategy] = useState('issued');
  const result = prefetchResume(completed, prefetch, strategy);
  return <NeuralLab id="exact-resume-prefetch" title="Locate the records between issued and committed work"><p>Twelve constructed IDs; two per update. “Issued” means fetched ahead, not applied to the saved model.</p><div className="neural-controls"><NeuralNumber label="Completed updates" value={completed} onChange={setCompleted} min={0} max={5} step={1} integer /><NeuralNumber label="Prefetched batches" value={prefetch} onChange={setPrefetch} min={0} max={3} step={1} integer /><NeuralSelect label="Restart strategy" value={strategy} onChange={setStrategy} options={[['issued', 'Issued cursor only; discard queue'], ['committed', 'Replay from committed cursor'], ['queue', 'Restore pending queue and issued cursor']]} /></div>
    <div className="resume-queue">{[['Committed to model', result.consumed, 'committed'], ['Pending in queue', result.pending, 'pending'], ['Not yet issued', result.unissued, 'unissued']].map(([label, ids, kind]) => <section key={kind}><h4>{label}</h4><div className={`resume-records resume-records-${kind}`}>{ids.length ? ids.map(id => <span key={id}>{id}</span>) : <em>None</em>}</div></section>)}</div>
    <div className="resume-cursors"><p>Committed cursor<strong>{result.committed}</strong></p><p>Issued cursor<strong>{result.issued}</strong></p><p>Next resumed ID<strong>{result.next ?? 'end'}</strong></p></div><p className="resume-result">{result.skipped.length ? `Skipped IDs: ${result.skipped.join(', ')}. Their effects are absent from the saved model.` : 'No IDs skipped under this strategy.'}</p>
    <p>{strategy === 'committed' ? 'Replay requires the same source and reproducible transforms. A row offset alone does not restore random augmentation.' : strategy === 'queue' ? 'The queue contents and order are part of the saved state. Consume that queue before reading again from the issued cursor.' : 'An issued-only cursor is safe here only when the pending queue is empty. It is not a general mid-epoch checkpoint.'}</p><div className="neural-actions"><button type="button" onClick={() => {
        setCompleted(3);
        setPrefetch(2);
        setStrategy('issued');
      }}>Reset prefetch queue</button></div>
  </NeuralLab>;
}
