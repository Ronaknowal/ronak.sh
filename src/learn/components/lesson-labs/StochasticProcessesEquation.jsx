import { MathBlock as SharedMathBlock } from "../content/Math.jsx";
import { ScrollRegion } from "./StochasticProcessesDrawings.jsx";
function MathBlock({ children, caption }) {
  return <div><ScrollRegion title="Complete mathematical formula" kind="formula" className="sp-equation"><SharedMathBlock>{children}</SharedMathBlock></ScrollRegion>{caption && <p>{caption}</p>}</div>;
}
export {
  MathBlock
};
