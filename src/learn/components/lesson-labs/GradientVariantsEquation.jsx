import { MathBlock as SharedMathBlock } from '../content/Math.jsx';
import { Scroll } from './GradientVariantsDrawings.jsx';
export function MathBlock({children,caption}){return <div className="gv-equation"><Scroll title="Complete optimizer equation" kind="formula"><SharedMathBlock>{children}</SharedMathBlock></Scroll>{caption&&<p>{caption}</p>}</div>;}
