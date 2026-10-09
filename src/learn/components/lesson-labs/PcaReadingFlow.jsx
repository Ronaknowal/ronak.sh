import { foundationDrawings } from './PcaReadingFlowFoundation.jsx';
import { wineDrawings } from './PcaReadingFlowWine.jsx';
import { interpretationDrawings } from './PcaReadingFlowInterpretation.jsx';
import { spectralDrawings } from './PcaReadingFlowSpectral.jsx';
import { computationDrawings } from './PcaReadingFlowComputation.jsx';
import { variantDrawings } from './PcaReadingFlowVariants.jsx';

const drawings = { ...foundationDrawings, ...wineDrawings, ...interpretationDrawings,
  ...spectralDrawings, ...computationDrawings, ...variantDrawings };

// Every placement names its actual mechanism owner; counts alone are not review.
export function PcaReadingFlowFigure({ job }) {
  const Component = drawings[job];
  if (!Component) throw new Error(`PCA mechanism not implemented yet: ${job}`);
  return <Component />;
}
