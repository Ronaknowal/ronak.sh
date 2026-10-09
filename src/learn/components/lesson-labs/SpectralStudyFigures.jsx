import example from '../../data/spectral-study-example.json';
import { SpectralFigure, f, spectralColors as C } from './SpectralPrimitives.jsx';
export function SpectralDataFigure() {
 const sums=[0,1].map(half=>example.pixels.reduce((n,v,i)=>n+(Math.floor((i%8)/4)===half?v:0),0));
 return <SpectralFigure title="A recorded digit becomes a measurement pair" height={386} description={'Real source '+example.sourceId+', digit '+example.digit+'. Each half has 32 integer pixels, each from zero to sixteen. The brackets select the actual left and right halves. Grey-to-white paint is recorded ink intensity, not a decorative gradient.'}>
  {example.pixels.map((v,i)=><rect key={i} x={55+(i%8)*25} y={25+Math.floor(i/8)*25} width="25" height="25" fill={'rgb('+Array(3).fill(Math.round(v/16*255)).join(',')+')'}/>)}
  <path d="M155 22V227 M55 234V244H151V234 M159 234V244H255V234" fill="none" stroke={C.parameter} strokeWidth="2"/>
  <text x="102" y="266" textAnchor="middle">left half</text><text x="208" y="266" textAnchor="middle">right half</text>
  <path d="M102 276V293 M208 276V293" stroke="#888"/><text x="20" y="315">left: {sums[0]} / 512 = {f(sums[0]/512,6)}</text><text x="20" y="339">right: {sums[1]} / 512 = {f(sums[1]/512,6)}</text><text x="20" y="372" fill={C.computed}>one point: [{f(example.profile[0],4)}, {f(example.profile[1],4)}]</text>
 </SpectralFigure>;
}
export function SpectralArchitectureFigure() {
 const hidden=Array.from({length:24},(_,i)=>({x:40+(i%8)*31,y:Math.floor(i/8)*15}));
 return <>{[[2,'Generator','ReLU','sigmoid'],[1,'Critic','leaky ReLU .2','no output activation']].map(([outputs,name,activation,last])=><SpectralFigure key={name} title={name+' anatomy'} height={356} description={name+': top-to-bottom dense computation. Each dot is one actual component; all 24 dots appear in each hidden layer. Grey fans represent full dense connectivity; no extra units are implied. Weights and biases supply the parameter counts.'}>
  <text x="20" y="22">{name}: input 2</text>{[118,180].map(x=><circle key={x} cx={x} cy="49" r="5" fill={C.input}/>)}
  {[118,180].flatMap(x=>hidden.map((p,i)=><line key={x+'-'+i} x1={x} y1="55" x2={p.x} y2={101+p.y} stroke="#555" opacity=".3"/>))}
  {hidden.map((p,i)=><circle key={i} cx={p.x} cy={101+p.y} r="3.5" fill={C.computed}/>)}<text x="20" y="162">24 components; {activation}</text>
  <path d="M40 171L40 188 M258 171L258 188 M40 171L258 188 M258 171L40 188" stroke="#777"/><text x="85" y="186">all-to-all</text>
  {hidden.map((p,i)=><circle key={i} cx={p.x} cy={209+p.y} r="3.5" fill={C.computed}/>)}<text x="20" y="271">24 components; {activation}</text>
  {hidden.flatMap((p,i)=>Array.from({length:outputs},(_,j)=><line key={i+'-'+j} x1={p.x} y1={215+p.y} x2={outputs===1?150:118+j*62} y2="309" stroke="#555" opacity=".3"/>))}
  {Array.from({length:outputs},(_,j)=><circle key={j} cx={outputs===1?150:118+j*62} cy="315" r="6" fill={C.computed}/>)}<text x="20" y="351">output {outputs}: {last}</text>
 </SpectralFigure>)}</>;
}
export function SpectralMetricFigure() {
 return <SpectralFigure title="One directional empirical transport calculation" height={260} description="This constructed one-dimensional example isolates the metric operation. Two equal-mass recorded projections sit at 0 and .5; two generated projections at 0 and .75. Pair their sorted locations. The first pair moves zero; the second moves .25, each with mass one-half. The actual experiment uses 64 directions and allows unequal counts through empirical cumulative distributions.">
  <text x="20" y="24">recorded projected values</text><path d="M50 65H280" stroke="#888"/><circle cx="50" cy="65" r="7" fill={C.input}/><circle cx="165" cy="65" r="7" fill={C.input}/><text x="50" y="91" textAnchor="middle">0</text><text x="165" y="91" textAnchor="middle">.5</text>
  <text x="20" y="127">generated projected values</text><path d="M50 168H280" stroke="#888"/><circle cx="50" cy="168" r="7" fill={C.computed}/><circle cx="222.5" cy="168" r="7" fill={C.computed}/><text x="50" y="194" textAnchor="middle">0</text><text x="222.5" y="194" textAnchor="middle">.75</text><path d="M165 65L222.5 168" stroke={C.parameter} strokeDasharray="5 4"/><text x="20" y="233">cost: ½×0 + ½×.25 = .125</text><text x="20" y="257">one direction; then average 64</text>
 </SpectralFigure>;
}
