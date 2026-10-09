import React from 'react';
import IcaFoundations from './IcaFoundations.jsx';
import IcaContrastAndFit from './IcaContrastAndFit.jsx';
import IcaRecordingAndRemoval from './IcaRecordingAndRemoval.jsx';
import IcaObjectivesAndModels from './IcaObjectivesAndModels.jsx';
export default function IcaDrawing({id}) {
  const n=Number(id.slice(1));
  const Group=n<=15?IcaFoundations:n<=28?IcaContrastAndFit:n<=36?IcaRecordingAndRemoval:IcaObjectivesAndModels;
  return <Group id={id}/>;
}
