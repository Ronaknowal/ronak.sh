import { MathBlock as SharedMathBlock } from '../content/Math.jsx';

export function MathBlock({ children }) {
  return <div className="rla-equation-scroll" role="region" tabIndex={0} aria-label="Mathematical formula. Use left and right arrow keys to scroll when needed."><SharedMathBlock>{children}</SharedMathBlock></div>;
}
