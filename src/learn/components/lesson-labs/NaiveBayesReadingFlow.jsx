import * as Discrete from './NaiveBayesReadingFlowDiscrete.jsx';
import * as Continuous from './NaiveBayesReadingFlowContinuous.jsx';
import * as Workflow from './NaiveBayesReadingFlowWorkflow.jsx';
import * as Probabilities from './NaiveBayesReadingFlowProbabilities.jsx';
import './naive-bayes-reading-flow.css';
import { useCallback } from 'react';
import { useCodeDownload } from '../content/LessonCodeDownloads.jsx';
function SupportingFile({
  filename
}) {
  const source = '/learn-code/naive-bayes-probabilistic-classifiers/' + filename;
  const getText = useCallback(() => '', []);
  const inPractice = useCallback(() => false, []);
  useCodeDownload({
    filename,
    language: 'text',
    kind: 'asset',
    downloadUrl: source,
    title: 'Retained offline data, schema, provenance or frozen study record',
    getText,
    inPractice
  });
  return null;
}
const jobs = {
  D01: Discrete.Representation,
  D02: Discrete.TwoRoutes,
  D03: Discrete.DataRoles,
  D04: Discrete.ConditionalGraph,
  D05: Discrete.PoolingAreas,
  D06: Discrete.BayesAreas,
  D07: Discrete.Normalization,
  D08: Discrete.OddsBars,
  D09: Discrete.ZeroSupport,
  D10: Discrete.TokenPools,
  D11: Discrete.CountEvent,
  D12: Discrete.Smoothing,
  D13: Discrete.Simplex,
  D14: Discrete.Presence,
  D15: Discrete.Missing,
  D16: Discrete.Categories,
  D17: Continuous.Density,
  D18: Continuous.Residuals,
  D19: Continuous.Floor,
  D20: Continuous.Covariance,
  D21: Continuous.Boundary,
  D22: Continuous.Copies,
  D23: Continuous.Xor,
  D24: Workflow.ComplementPooling,
  D25: Workflow.ComplementScores,
  D26: Workflow.Rarity,
  D27: Workflow.Sparse,
  D28: Workflow.FoldPorts,
  D29: Workflow.Selection,
  D30: Workflow.Packets,
  D31: Continuous.Merging,
  D32: Workflow.PriorShift,
  D33: Workflow.Study,
  D34: Probabilities.Reliability,
  D35: Probabilities.ProperLoss,
  D36: Probabilities.CalibrationPorts,
  D37: Probabilities.Mapping,
  D38: Probabilities.Costs,
  D39: Probabilities.LinearOdds,
  D40: Probabilities.Integration,
  D41: Probabilities.Mixed
};
export function NaiveBayesReadingFlowFigure({
  job,
  phase = 'live'
}) {
  const Component = jobs[job];
  if (!Component) throw Error('Unknown Naive Bayes drawing ' + job);
  return <div data-nb-drawing={job} data-nb-phase={phase}>
    <Component staticOnly={phase === 'static'} />
  </div>;
}
export function NaiveBayesReadingFlowAssets() {
  const filenames = ['spambase.data', 'spambase.names', 'spambase.DOCUMENTATION', 'spambase-provenance.md',
    'SPAMBASE-LICENSE.txt', 'spambase-validation-lock.json', 'spambase-frozen-state.json', 'spambase-study-results.json'];
  return <>
    {filenames.map(filename => <SupportingFile key={filename} filename={filename} />)}
    <p>Offline data, licence, provenance and the unchanged study records are in the common file index. Save the three Python companions with nb-spambase-study.py for a clean declared study. Inspect the supplied selection, state and outcomes to reproduce this report without running another study.</p>
  </>;
}
