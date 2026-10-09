import React from 'react';
import { CoreFigure } from './CoreFigures.jsx';
import { DeeperFigure } from './DeeperFigures.jsx';
export function PreparationFigure({
  id
}) {
  return Number(id.slice(1)) <= 23 ? <CoreFigure id={id} /> : <DeeperFigure id={id} />;
}
