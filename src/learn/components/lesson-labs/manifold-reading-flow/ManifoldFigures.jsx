import React from 'react';
import { affinityFigures } from './AffinityFigures.jsx';
import { geometryFigures } from './GeometryFigures.jsx';
export const figures = { ...geometryFigures, ...affinityFigures };
export function ManifoldFigure({ id }) {
  const Figure = figures[id];
  if (!Figure) throw new Error(`Missing manifold drawing ${id}`);
  return <section className="manifold-figure" data-drawing={id} aria-label={`Mechanism ${id}`}><Figure /></section>;
}
