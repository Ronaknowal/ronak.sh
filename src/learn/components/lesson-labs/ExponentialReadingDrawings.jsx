import { FoundationDrawing } from './ExponentialFoundationDrawings.jsx';
import { FamilyDrawing } from './ExponentialFamilyDrawings.jsx';
import { InferenceDrawing } from './ExponentialInferenceDrawings.jsx';
import { GaussianDrawing } from './ExponentialGaussianDrawings.jsx';
import { StructuredDrawing } from './ExponentialStructuredDrawings.jsx';
import { ConditionalLab, SummaryLab, NormalizerLab, CountFitLab, MergeLab, CoordinatesLab } from './ExponentialReadingLabs.jsx';

const live={E07:ConditionalLab,E14:SummaryLab,E26:NormalizerLab,E32:CountFitLab,E41:MergeLab,E55:CoordinatesLab};
export default function ExponentialReadingDrawing({ id }) {
  const Lab=live[id];
  if(Lab)return <Lab />;
  const number=Number(id.slice(1));
  if(!/^E\d{2}$/.test(id)||number<1||number>60)throw new Error('Unknown exponential mechanism '+id);
  const Owner=number<=15 ? FoundationDrawing : number<=28 ? FamilyDrawing : number<=35 ? InferenceDrawing : number<=46 ? GaussianDrawing : StructuredDrawing;
  return <Owner id={id} />;
}
