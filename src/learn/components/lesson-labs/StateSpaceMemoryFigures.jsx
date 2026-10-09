import { NeuralTable } from './NeuralLessonElements.jsx';
import { flowNumber as number } from './LessonFlow.jsx';
import StateSpaceLinePlot from './StateSpaceLinePlot.jsx';

export function StateMemoryRatesDrawing() {
  const rates = [.2, .8, .99];
  return <>
    <div className="state-flow-columns">
      {[100, 8].map(length => <StateSpaceLinePlot key={length}
        title={length === 8 ? 'The first eight updates' : 'The same three modes over 100 updates'}
        xLabel="empty updates k" yLabel="retained fraction aᵏ"
        xDomain={[0, length]} yDomain={[0, 1]}
        series={rates.map((rate, i) => ({
          label: `Retention a = ${rate}`,
          color: '#baa1e3',
          dasharray: [undefined, '6 4', '2 4'][i],
          values: Array.from({ length: length + 1 }, (_, k) => [k, rate ** k]),
        }))}
      />)}
    </div>
    <NeuralTable caption="Half-life of one mode" headers={['Decay a', 'Half-life in steps']}
      rows={rates.map(rate => [rate, number(Math.log(.5) / Math.log(rate))])}
    />
  </>;
}

export function StatePolynomialDrawing() {
  const positions = Array.from({ length: 21 }, (_, i) => i / 10);
  return <>
    <div className="state-flow-columns">
      <StateSpaceLinePlot title="Two orthonormal basis functions"
        xLabel="history coordinate s" yLabel="basis value"
        xDomain={[0, 2]} yDomain={[-2, 2]}
        series={[
          { label: 'Basis 0: 1', color: '#dedede', values: positions.map(s => [s, 1]) },
          { label: 'Basis 1: √3(s−1)', color: '#baa1e3', values: positions.map(s => [s, Math.sqrt(3) * (s - 1)]) },
        ]}
      />
      <StateSpaceLinePlot title="Reconstruct the supplied history f(s)=s"
        xLabel="history coordinate s" yLabel="function value"
        xDomain={[0, 2]} yDomain={[0, 2]}
        series={[
          { label: 'Supplied f(s)=s', color: '#79c5d8', values: positions.map(s => [s, s]) },
          { label: 'One coefficient: 1', color: '#dedede', dashed: true, values: positions.map(s => [s, 1]) },
          { label: 'Two: 1+(s−1)=s', color: '#baa1e3', dashed: true, values: positions.map(s => [s, s]) },
        ]}
      />
    </div>
    <p>Use the normalized measure ds/2 on [0,2]. Coefficients 1 and √3/3 multiply the two bases. The first keeps the level; the second restores the trend. The supplied cyan history and its violet two-coefficient reconstruction coincide exactly and retain separate connected labels.</p>
  </>;
}
