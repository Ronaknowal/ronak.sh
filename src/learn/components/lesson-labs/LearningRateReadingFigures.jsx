import { FoundationFigure } from './LearningRateFoundationFigures.jsx';
import { NoiseFigure } from './LearningRateNoiseFigures.jsx';
import { CycleFigure } from './LearningRateCycleFigures.jsx';
import { StateFigure } from './LearningRateStateFigures.jsx';

export function LearningRateFigure({id}) {
  const number=Number(id.slice(1));
  if(number>=1&&number<=13)return <FoundationFigure id={id}/>;
  if(number<=21)return <NoiseFigure id={id}/>;
  if(number<=34)return <CycleFigure id={id}/>;
  if(number<=48)return <StateFigure id={id}/>;
  throw new RangeError(`Unknown learning-rate placement: ${id}`);
}
