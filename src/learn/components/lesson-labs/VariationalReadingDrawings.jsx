import FoundationDrawing from './VariationalFoundationDrawings.jsx';
import GradientDrawing from './VariationalGradientDrawings.jsx';
import StructuredDrawing from './VariationalStructuredDrawings.jsx';
import { FiniteLab, CovarianceLab, CoordinateLab, MixtureLab, GradientLab, HierarchyLab, SleepLab, ImportanceLab } from './VariationalReadingLabs.jsx';
import { VFigure } from './VariationalReadingPrimitives.jsx';
const live={V06:FiniteLab,V15:CovarianceLab,V22:CoordinateLab,V25:MixtureLab,V30:GradientLab,V42:HierarchyLab,V52:SleepLab,V55:ImportanceLab};
export default function Drawing({id}) {
  if(!/^V(0[1-9]|[1-5][0-9]|60)$/.test(id))throw new Error('Unknown complete VI mechanism '+id);
  const Live=live[id];if(Live)return <Live/>;
  const number=Number(id.slice(1));
  return <VFigure id={id}>{number<=20 ? <FoundationDrawing id={id}/> : number<=39 ? <GradientDrawing id={id}/> : <StructuredDrawing id={id}/>}</VFigure>;
}
