import React from 'react';
import { nativeEvidenceFigures } from './InferenceEngineNativeEvidence.jsx';
import { lifecycleTransportFigures } from './InferenceEngineLifecycleTransport.jsx';
import { memoryMetricsFigures } from './InferenceEngineMemoryMetrics.jsx';

const figures = { ...nativeEvidenceFigures, ...lifecycleTransportFigures, ...memoryMetricsFigures };
export function EngineFigure({ id }) {
  const Component = figures[id];
  if (!Component) throw new Error(`Unknown engine mechanism ${id}`);
  return <Component />;
}
