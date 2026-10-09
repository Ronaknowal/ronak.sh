import {MathBlock} from '../content/Math.jsx';
import {Region} from './RandomMatrixDrawings.jsx';
export function RandomMatrixEquation({children,...props}){return <Region label="Complete random matrix equation" kind="equation"><div className="rmt-equation-inner"><MathBlock {...props}>{children}</MathBlock></div></Region>;}
