import { MathBlock } from '../content/Math';
import './convex-optimization-flow.css';
export function ConvexOptimizationEquation({children}){return <div className="cvx-equation" role="region" tabIndex={0} aria-label="Complete convex optimization equation; arrow keys scroll"><MathBlock>{children}</MathBlock></div>;}
