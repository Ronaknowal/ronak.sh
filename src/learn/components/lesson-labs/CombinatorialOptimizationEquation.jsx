import { MathBlock as BaseMathBlock } from "../content/Math.jsx";
function MathBlock(props) {
  return <div className="co-equation-window" role="region" tabIndex={0} aria-label="Mathematical equation: use arrow keys to read its full width"><BaseMathBlock {...props} /></div>;
}
export {
  MathBlock
};
