import React from 'react';
import { foundationDrawings } from './DbscanFoundationFigures.jsx';
import { geometryDrawings } from './DbscanGeometryFigures.jsx';
import { observedDrawings } from './DbscanObservedFigures.jsx';
import { supportDrawings } from './DbscanSupportFigures.jsx';
import { opticsDrawings } from './DbscanOpticsFigures.jsx';
import { treeDrawings } from './DbscanTreeFigures.jsx';
import { condensationDrawings } from './DbscanCondensationFigures.jsx';
import { validityDrawings } from './DbscanValidityFigures.jsx';
import { extensionDrawings } from './DbscanExtensionFigures.jsx';
const drawings = {
  ...foundationDrawings,
  ...geometryDrawings,
  ...observedDrawings,
  ...supportDrawings,
  ...opticsDrawings,
  ...treeDrawings,
  ...condensationDrawings,
  ...validityDrawings,
  ...extensionDrawings
};
export const implementedDrawingIds = Object.freeze(Object.keys(drawings));
export function Mechanism({
  id
}) {
  const Drawing = drawings[id];
  if (!Drawing) throw Error(`Unimplemented mechanism ${id}`);
  return <Drawing />;
}
