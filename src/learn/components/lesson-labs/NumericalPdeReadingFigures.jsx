import { FoundationFigure } from './NumericalPdeFoundationFigures.jsx';
import { EvolutionFigure } from './NumericalPdeEvolutionFigures.jsx';
import { ElementFigure } from './NumericalPdeElementFigures.jsx';
import { PoissonBudgetLab, RefinementLab, DiffusionGridLab, InterfaceFluxLab, FluxCompatibilityLab, TransportCellsLab, GodunovFaceLab, HatAssemblyLab, RectangleIndexLab, TriangleElementLab, CoarseCorrectionLab } from './NumericalPdeReadingLabs.jsx';
import './numerical-pde-reading.css';

const live = {
  N18: PoissonBudgetLab,
  N20: RefinementLab,
  N27: DiffusionGridLab,
  N35: InterfaceFluxLab,
  N37: FluxCompatibilityLab,
  N39: TransportCellsLab,
  N43: GodunovFaceLab,
  N49: HatAssemblyLab,
  N57: RectangleIndexLab,
  N61: TriangleElementLab,
  N65: CoarseCorrectionLab,
};

export function NumericalPdeReadingFigure({ id }) {
  if (!/^N(?:0[1-9]|[1-6]\d|70)$/.test(id)) throw new Error(`Unknown numerical PDE mechanism ${id}`);
  const Lab = live[id];
  const index = Number(id.slice(1));
  return <div className="npde-mechanism" data-mechanism={id}>
    {Lab ? <Lab /> : index <= 23 ? <FoundationFigure id={id} /> : index <= 43 ? <EvolutionFigure id={id} /> : <ElementFigure id={id} />}
  </div>;
}
