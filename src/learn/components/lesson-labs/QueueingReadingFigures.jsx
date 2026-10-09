import React from 'react';
import { QueueingTimelineFigure, QueueingAreaProvider } from './QueueingTimelineFigures.jsx';
import { QueueingProbabilityFigure } from './QueueingProbabilityFigures.jsx';
import { QueueingServiceFigure } from './QueueingServiceFigures.jsx';
import { QueueingCapacityFigure } from './QueueingCapacityFigures.jsx';
import { QueueingEvidenceFigure } from './QueueingEvidenceFigures.jsx';

export { QueueingAreaProvider };

export function QueueingReadingFigure({ id }) {
  const number = Number(id.slice(1));
  if (number <= 11 || number === 34) return <QueueingTimelineFigure id={id} />;
  if (number <= 19) return <QueueingProbabilityFigure id={id} />;
  if (number <= 26) return <QueueingServiceFigure id={id} />;
  if (number <= 33) return <QueueingCapacityFigure id={id} />;
  return <QueueingEvidenceFigure id={id} />;
}
