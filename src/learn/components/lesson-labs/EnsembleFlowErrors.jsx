import { useId } from 'react';
import { ensembleProductNumber, residualCombination } from '../../data/ensemble-combination-flow-models.js';
import { errorBlendPresets, ensembleNumber } from '../../data/ensemble-methods-models.js';
import { EnsembleQuantity, EnsembleVectorEntry, useEnsembleResiduals } from './EnsembleFlowControls.jsx';
import { EnsembleFlowCanvas, EnsembleFlowFigure } from './EnsembleFlowCombination.jsx';

const colors = { a: '#7fc9ba', b: '#b2b7e1', mixture: '#e8bb60' };
const number = value => ensembleNumber(value, 7);

export function ResidualRowsFigure() {
  const context = useEnsembleResiduals();
  const state = residualCombination(context.a, context.b, context.weight);
  const maximum = Math.max(...state.rows.flatMap(row => [Math.abs(row.a), Math.abs(row.b), Math.abs(row.mixture)]));
  const extent = maximum === 0 ? 1 : maximum;
  const selectorId = useId();
  return <EnsembleFlowFigure job="D07" title="Signed residuals keep their side of each target">
    <EnsembleFlowCanvas title="Four rows compare A, B and mixed residual distances from their target origin" width={940} height={580}>
      <text x={110} y={25}>{number(-extent)} h</text>
      <text x={370} y={25}>0 · target origin</text>
      <text x={620} y={25}>{number(extent)} h</text>
      {state.rows.map((row, index) => <g key={row.id}>
        <text x={16} y={61 + index * 130}>Row {row.id}</text>
        <text x={685} y={61 + index * 130}>Row {row.id}</text>
        <path d={`M390,${58 + index * 130} V${154 + index * 130}`} stroke="#777782" strokeDasharray="4 4" />
        {['a', 'b', 'mixture'].map((member, memberIndex) => {
          const y = 76 + index * 130 + memberIndex * 32;
          const value = row[member];
          const scaledValue = row[member === 'a' ? 'scaledA' : member === 'b' ? 'scaledB' : 'scaledMixture'];
          const x = 390 + scaledValue * 270;
          return <g key={member}>
            <text x={78} y={y + 5} fill={colors[member]}>{member === 'mixture' ? 'mix' : member.toUpperCase()}</text>
            <path d={`M390,${y} H${x}`} stroke={colors[member]} fill="none" />
            {scaledValue !== 0 && <path d={`M${x - Math.sign(scaledValue) * 7},${y - 4} L${x},${y} L${x - Math.sign(scaledValue) * 7},${y + 4}`} fill="none" stroke={colors[member]} />}
            <circle cx={x} cy={y} r={3} fill={colors[member]} />
            <text x={685} y={y + 5} fill={colors[member]}>{member === 'mixture' ? 'mix' : member.toUpperCase()} {member === 'mixture' ? ensembleProductNumber([state.lossScale, scaledValue]) : number(value)} h</text>
          </g>;
        })}
      </g>)}
      <text x={16} y={570}>One shared distance scale · residual = forecast − outcome</text>
    </EnsembleFlowCanvas>
    <div className="ensemble-flow-controls">
      <EnsembleQuantity label="Residual mixture: weight on A" value={context.weight} min={0} max={1}
        onChange={weight => context.setResiduals(old => ({ ...old, weight }))} revision={context.revision} />
      <label htmlFor={selectorId}>Residual pattern
        <select id={selectorId} value={context.preset} onChange={event => {
          const preset = event.target.value;
          const selected = errorBlendPresets[preset];
          context.setResiduals(old => ({ ...old, preset, a: [...selected.a], b: [...selected.b] }));
        }}>
          {Object.entries(errorBlendPresets).map(([id, preset]) => <option value={id} key={id}>{preset.label}</option>)}
          {context.preset === 'custom' && <option value="custom" disabled>Edited vectors</option>}
        </select>
      </label>
      <button type="button" onClick={context.reset}>Reset residuals and weight</button>
    </div>
    <p aria-live="polite">At weight A={number(context.weight)}, row residuals of the mix are [{state.rows.map(row => ensembleProductNumber([state.lossScale, row.scaledMixture])).join(', ')}] hours. Their mean square is {ensembleProductNumber([state.lossScale, state.lossScale, state.scaledMixtureLoss])} hours².</p>
  </EnsembleFlowFigure>;
}

export function AmbiguityAreasFigure() {
  const context = useEnsembleResiduals();
  const state = residualCombination(context.a, context.b, context.weight);
  const terms = state.rows.map(row => [
    { id: 'A member', side: Math.sqrt(context.weight) * Math.abs(row.scaledA), color: colors.a },
    { id: 'B member', side: Math.sqrt(1 - context.weight) * Math.abs(row.scaledB), color: colors.b },
    { id: 'Mix error', side: Math.abs(row.scaledMixture), color: colors.mixture },
    { id: 'A disagreement', side: Math.sqrt(context.weight) * Math.abs(row.scaledA - row.scaledMixture), color: colors.a },
    { id: 'B disagreement', side: Math.sqrt(1 - context.weight) * Math.abs(row.scaledB - row.scaledMixture), color: colors.b }
  ]);
  const largest = Math.max(...terms.flatMap(row => row.map(term => term.side)));
  return <EnsembleFlowFigure job="D08" title="The same area scale exposes error and disagreement">
    <EnsembleFlowCanvas title="Four row identities each have five correctly weighted square contributions" width={1180} height={810}>
      {terms[0].map((term, index) => <text key={term.id} x={78 + index * 218} y={30} fill={term.color}>{term.id}</text>)}
      {terms.map((row, rowIndex) => <g key={state.rows[rowIndex].id}>
        <text x={16} y={74 + rowIndex * 180}>Row {state.rows[rowIndex].id}</text>
        {row.map((term, column) => {
          const side = largest === 0 ? 0 : term.side / largest * 80;
          const x = 78 + column * 218;
          const y = 76 + rowIndex * 180;
          return <g key={term.id}>
            <text x={x} y={y - 12}>Row {state.rows[rowIndex].id}</text>
            <path d={`M${x},${y} V${y + 80} H${x + 80}`} stroke="#666671" fill="none" />
            <rect x={x} y={y + 80 - side} width={side} height={side} fill={term.color} fillOpacity={.55} stroke={side === 0 ? 'none' : term.color} />
            <text x={x} y={y + 110}>area {ensembleProductNumber([state.lossScale, state.lossScale, term.side, term.side])} h²</text>
            <text x={x} y={y + 138}>side {ensembleProductNumber([state.lossScale, term.side])} h</text>
          </g>;
        })}
      </g>)}
      <text x={16} y={802}>Shared scale: largest side {ensembleProductNumber([state.lossScale, largest])} h spans 80 pixels at 100% text. Zero stays zero.</text>
    </EnsembleFlowCanvas>
    <div className="ensemble-flow-controls">
      <EnsembleVectorEntry label="Member A residuals" values={context.a} revision={context.revision}
        onChange={a => context.setResiduals(old => ({ ...old, a, preset: 'custom' }))} />
      <EnsembleVectorEntry label="Member B residuals" values={context.b} revision={context.revision}
        onChange={b => context.setResiduals(old => ({ ...old, b, preset: 'custom' }))} />
      <button type="button" onClick={context.reset}>Reset residuals and weight</button>
    </div>
    <p aria-live="polite">Using the shared A weight {number(context.weight)}, mean member loss {ensembleProductNumber([state.lossScale, state.lossScale, state.scaledMemberLoss])} equals mix error {ensembleProductNumber([state.lossScale, state.lossScale, state.scaledMixtureLoss])} plus disagreement {ensembleProductNumber([state.lossScale, state.lossScale, state.scaledDisagreement])} hours².</p>
  </EnsembleFlowFigure>;
}

export function TwoMemberLossFigure() {
  const context = useEnsembleResiduals();
  const state = residualCombination(context.a, context.b, context.weight);
  const samples = Array.from({ length: 61 }, (_, index) => {
    const weight = index / 60;
    return { weight, loss: residualCombination(context.a, context.b, weight).scaledMixtureLoss };
  });
  const optimum = state.constrainedOptimum;
  const best = optimum === null ? null : residualCombination(context.a, context.b, optimum).scaledMixtureLoss;
  const maximum = Math.max(...samples.map(sample => sample.loss));
  const extent = maximum === 0 ? 1 : maximum;
  const x = weight => 80 + weight * 460;
  const y = loss => 308 - loss / extent * 230;
  const actualLoss = normalized => ensembleProductNumber([state.lossScale, state.lossScale, normalized], 4);
  const axisLoss = normalized => {
    const value = state.lossScale * state.lossScale * normalized;
    return value === 0 && normalized > 0 && state.lossScale > 0 ? ensembleProductNumber([state.lossScale, state.lossScale, normalized], 1) :
      value === 0 ? '0' : value >= 1e5 || value < 1e-4 ? value.toExponential(1) : number(value);
  };
  return <EnsembleFlowFigure job="D09" title="The current four rows define this fitted-weight question">
    <EnsembleFlowCanvas title="Mean squared residual versus A weight, with the current choice and permitted minimum" height={420}>
      <path d="M80,64 V308 H556" stroke="#a0a0aa" fill="none" />
      <text x={16} y={34}>Mean squared residual · hours²</text>
      {[0, .25, .5, .75, 1].map(tick => <g key={tick}>
        <path d={`M${x(tick)},308 v8`} stroke="#a0a0aa" />
        <text x={x(tick) - 10} y={342}>{number(tick)}</text>
      </g>)}
      {[0, .5, 1].map(fraction => <g key={fraction}>
        <path d={`M74,${y(fraction * extent)} H80`} stroke="#a0a0aa" />
        <text x={4} y={y(fraction * extent) + 5}>{maximum === 0 ? number(fraction) : axisLoss(fraction * extent)}</text>
      </g>)}
      <path d={samples.map((sample, index) => `${index === 0 ? 'M' : 'L'}${x(sample.weight)},${y(sample.loss)}`).join(' ')} stroke={colors.mixture} fill="none" strokeWidth={2} />
      <path d={`M80,${y(samples[0].loss)} H540`} stroke={colors.b} strokeDasharray="5 5" />
      <path d={`M80,${y(samples.at(-1).loss)} H540`} stroke={colors.a} strokeDasharray="3 5" />
      <circle cx={x(context.weight)} cy={y(state.scaledMixtureLoss)} r={5} fill={colors.mixture} />
      {optimum !== null && <circle cx={x(optimum)} cy={y(best)} r={7} stroke="#ededf0" fill="none" />}
      <text x={80} y={374}>Weight on A: 0 = B only; 1 = A only</text>
      <text x={80} y={404}>{optimum === null ? 'Identical row forecasts: all weights minimize this loss.' : `Minimum at w=${number(optimum)}; loss=${actualLoss(best)} h²`}</text>
    </EnsembleFlowCanvas>
    <p><span style={{ color: colors.a }}>A-only dashed baseline: {actualLoss(samples.at(-1).loss)} h².</span>{' '}
      <span style={{ color: colors.b }}>B-only dashed baseline: {actualLoss(samples[0].loss)} h².</span>{' '}
      {maximum === 0 && 'Every residual is zero; the display axis reserves 0–1 h² and the curve stays at zero.'}</p>
    <div className="ensemble-flow-controls">
      <EnsembleQuantity label="Loss curve: weight on A" value={context.weight} min={0} max={1} revision={context.revision}
        onChange={weight => context.setResiduals(old => ({ ...old, weight }))} />
      <button type="button" onClick={context.reset}>Reset residuals and weight</button>
    </div>
    <p aria-live="polite">{state.denominator === 0 && state.differenceScale !== 0 ?
      `The direct squared difference is below floating-point range. Scaled numerator ${number(state.scaledNumerator)} and curvature ${number(state.scaledCurvature)}, with B scale on changed rows ${number(state.secondScale)} and difference scale ${number(state.differenceScale)}, retain a nonflat problem.` :
      `Derivative numerator ${number(state.numerator)} and curvature sum ${number(state.denominator)}.`}{' '}
      {optimum === null ? 'All four member pairs coincide: every weight minimizes the same loss.' :
        `${Number.isFinite(state.unrestrictedOptimum) ? `Unrestricted weight ${number(state.unrestrictedOptimum)}` : 'The unrestricted weight lies beyond floating-point range'}; permitted weight ${number(optimum)}.`}{' '}
      The current weight has loss {actualLoss(state.scaledMixtureLoss)} hours².</p>
  </EnsembleFlowFigure>;
}
