import BinaryDrawing from './RateDistortionBinaryDrawings.jsx';
import TheoryDrawing from './RateDistortionTheoryDrawings.jsx';
import GaussianDrawing from './RateDistortionGaussianDrawings.jsx';
import CodecDrawing from './RateDistortionCodecDrawings.jsx';
import{Figure}from'./RateDistortionPrimitives.jsx';
export default function Drawing({id}){const n=Number(id.slice(1));return <Figure id={id}>{n<=14?<BinaryDrawing id={id}/>:n<=28?<TheoryDrawing id={id}/>:n<=37?<GaussianDrawing id={id}/>:<CodecDrawing id={id}/>}</Figure>}
