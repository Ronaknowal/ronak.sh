import { MathBlock as SharedMathBlock } from '../content/Math.jsx';

export function MathBlock({ children, caption }) {
  return <div>
    <div className="rv-equation-region" role="region" tabIndex={0} aria-label="Mathematical formula. Use left and right arrow keys to scroll when needed.">
      <SharedMathBlock>{children}</SharedMathBlock>
    </div>
    {caption && <p className="rv-equation-caption">{caption}</p>}
  </div>;
}
