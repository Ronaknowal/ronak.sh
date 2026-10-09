import { useState } from 'react';
import { FlowLab, FlowControls, FlowReadout, flowNumber as number } from './LessonFlow.jsx';
import { NeuralPlot, NeuralTable } from './NeuralLessonElements.jsx';
import { StateMatrix } from './StateSpaceLabs.jsx';
import measurements from '../../data/state-space-measurements.json';
import StateSpaceLinePlot from './StateSpaceLinePlot.jsx';
const yMaximum = Math.ceil(Math.max(...measurements.models.flatMap(model => model.history.flatMap(row => row.slice(1)))) * 2) / 2;
export function StateLearningCurves() {
  return <div className="ssm-two">{measurements.models.map(run => <StateSpaceLinePlot key={`${run.kind}${run.seed}`} title={`${run.kind}, seed ${run.seed}; selected epoch ${run.selected_epoch}`} xLabel="epoch" yLabel="cross-entropy, nats" xDomain={[1, 100]} yDomain={[0, yMaximum]} series={[{
      label: 'Fitting before update',
      color: '#dedede',
      values: run.history.map(row => [row[0], row[1]])
    }, {
      label: 'Validation after update',
      color: '#baa1e3',
      dashed: true,
      values: run.history.map(row => [row[0], row[2]])
    }]} points={[{
      x: run.selected_epoch,
      y: run.history[run.selected_epoch - 1][2],
      label: 'Selected validation checkpoint',
      color: '#e2b55a'
    }]} />)}</div>;
}
export function StateLearningConfusionFlow() {
  const [selected, setSelected] = useState(0),
    [recall, setRecall] = useState(false);
  const model = measurements.models[selected];
  const confusion = model.confusion.map(row => row.map(value => recall ? value / row.reduce((a, b) => a + b, 0) : value));
  const errors = model.confusion.reduce((total, row, i) => total + row.reduce((a, b) => a + b, 0) - row[i], 0);
  return <FlowLab id="ssm-recorded-confusion" label="Inspect actual assessment errors at the selected checkpoint">
    <StateMatrix title={recall ? 'Row recall: true class rows / predicted class columns' : 'Counts: true class rows / predicted class columns'} matrix={confusion} axes="True / predicted" />
    <FlowControls><label className="state-flow-select"><span>Recorded fit</span><select aria-label="Recorded fit" value={selected} onChange={event => setSelected(Number(event.target.value))}>{measurements.models.map((run, i) => <option value={i} key={i}>{run.kind}, seed {run.seed}</option>)}</select></label><button type="button" aria-pressed={recall} onClick={() => setRecall(value => !value)}>{recall ? 'Show counts' : 'Show row recall'}</button></FlowControls>
    <FlowReadout>The {model.kind} seed-{model.seed} checkpoint has {errors} errors in sixty assessment rows. Each true class has four rows: one changed count changes its recall by .25. Class-axis indices 0…14 correspond to dataset classes 1…15. Amber intensity represents a nonnegative count or recall on the printed scale, not a learned parameter.</FlowReadout>
    <NeuralTable caption={`${model.kind}, seed ${model.seed}: all recorded epoch losses`} headers={['Epoch', 'Fitting before update', 'Validation after update']} rows={model.history.map(row => row.map(value => number(value, 7)))} />
  </FlowLab>;
}
