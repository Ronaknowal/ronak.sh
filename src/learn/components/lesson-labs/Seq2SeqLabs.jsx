import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import { NeuralTable, NeuralPlot, formatNeural as f } from './NeuralLessonElements.jsx';
import measurements from '../../data/seq2seq-measurements.json';
import './seq2seq-labs.css';
export const seq2seqAsset = '/learn-code/sequence-to-sequence-encoder-decoder/';
export function Seq2SeqEvidenceFigure() {
  const colors = ['#e4b752', '#ddd', '#a996ca'];
  return <figure className="seq-evidence" data-figure="seq2seq-recorded-development"><div className="neural-two">{[['teacher_forced_nll', 'Teacher-forced NLL', 'nats per valid target token'], ['exact', 'Generated exact match', 'correct / 447']].map(([key, title, units]) => <NeuralPlot key={key} title={title} xLabel="training updates" yLabel={units} xDomain={[0, 1200]} yDomain={[0, Math.max(...measurements.runs.flatMap(run => run.checkpoints.map(point => point[key])))]} series={measurements.runs.map((run, index) => ({ label: `Seed ${run.seed}`, color: colors[index], values: run.checkpoints.map(point => [point.update, point[key]]), dashed: index === 1 }))} />)}</div><p>Points are measured checkpoints; connecting lines guide the eye. There are no invented intermediate training-accuracy measurements.</p><section data-lesson-teaching="" className="lesson-teaching-section"><NeuralTable caption="All actual development checkpoints" headers={['Seed', 'Update', 'NLL', 'Exact / 447']} rows={measurements.runs.flatMap(run => run.checkpoints.map(point => [run.seed, point.update, f(point.teacher_forced_nll), point.exact]))} /><NeuralTable caption="Final development length groups; no causal memory threshold" headers={['Seed', '3–5 letters: exact / 168', '6–8 letters: exact / 279']} rows={measurements.runs.map(run => [run.seed, measurements.slices[run.seed].length3to5.exact, measurements.slices[run.seed].length6to8.exact])} /></section></figure>;
}


export function Seq2SeqProgram({ file, title }) {
  return <RemoteCodeBlock source={seq2seqAsset + file} language="python" filename={file} title={title} />;
}
