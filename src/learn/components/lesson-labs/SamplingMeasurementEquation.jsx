import { MathBlock } from '../content/Math.jsx';
export function SamplingMeasurementEquation({
  children,
  caption
}) {
  return <div className="sm-equation"><div className="sm-scroll" role="region" tabIndex={0} aria-label="Sampling formula; use arrow keys to scroll"><MathBlock>{children}</MathBlock></div>{caption && <p className="sm-caption">{caption}</p>}</div>;
}
