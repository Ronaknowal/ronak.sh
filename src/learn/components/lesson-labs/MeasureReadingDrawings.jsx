import Foundation from './MeasureFoundationDrawings.jsx';
import Integral from './MeasureIntegralDrawings.jsx';
import Product from './MeasureProductDrawings.jsx';
import Conditional from './MeasureConditionalDrawings.jsx';
import Transfer from './MeasureTransferDrawings.jsx';
import {
  EventInformationLab,
  PreimageLab,
  MixedLab,
  SimpleLab,
  LimitLab,
  CoordinateLab,
  ConditionalLab,
  TransferLab,
} from './MeasureReadingLabs.jsx';
const live = {
  MT06: EventInformationLab,
  MT12: PreimageLab,
  MT21: MixedLab,
  MT27: SimpleLab,
  MT35: LimitLab,
  MT40: CoordinateLab,
  MT50: ConditionalLab,
  MT59: TransferLab,
};
export default function MeasureDrawing({ id }) {
  const Lab = live[id];
  if (Lab) return <Lab />;
  const n = Number(id.slice(2)),
    Component =
      n <= 18
        ? Foundation
        : n <= 34
          ? Integral
          : n <= 46
            ? Product
            : n <= 56
              ? Conditional
              : Transfer;
  return <Component id={id} />;
}
