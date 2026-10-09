import { MathBlock as SharedMathBlock } from "../content/Math.jsx";
function MathBlock({ children, caption }) {
  return <div><div className="cx-equation-region" role="region" tabIndex={0} aria-label="Mathematical formula. Use left and right arrow keys to scroll when needed."><SharedMathBlock>{children}</SharedMathBlock></div>{caption && <p className="cx-equation-caption">{caption}</p>}</div>;
}
export {
  MathBlock
};
