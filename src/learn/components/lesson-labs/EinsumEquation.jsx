import { MathBlock as SharedMathBlock } from '../content/Math.jsx';

export function MathBlock({ children, caption }) {
  return <div className="ef-equation-owner">
    <div className="ef-equation-scroll" role="region" tabIndex={0} aria-label="Tensor formula; use left and right arrow keys to scroll when needed.">
      <SharedMathBlock>{children}</SharedMathBlock>
    </div>
    {caption && <p className="ef-equation-caption">{caption}</p>}
  </div>;
}
