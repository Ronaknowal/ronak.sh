import {useLayoutEffect,useRef,useState} from 'react';
import {ink,Plot,Panels,Steps,Operation,Strip} from './RateDistortionPrimitives.jsx';

function CoordinateVector({reconstruction=false}){
 return <div className="rd-coordinate-vector" aria-label={reconstruction?'Reconstruction block with matching positions':'Source block with indexed positions'}>{['1','2','…','n'].map((i,j)=><span key={i} style={{borderColor:[ink.amber,ink.blue,ink.neutral,ink.lavender][j],color:[ink.amber,ink.blue,ink.neutral,ink.lavender][j]}}>{i==='…'?'…':<>{reconstruction?'X̂':'X'}<sub>{i}</sub></>}</span>)}</div>;
}
export function MessageChain(){
 return <Steps label="Source block through a finite message to its decoded block" items={[
  <><p>Source block Xⁿ: n coordinates</p><CoordinateVector/></>,
  <><p>Encoder chooses one message J from the agreed set</p><div className="rd-coordinate-vector rd-message-slots">{['1','2','…','M'].map(v=><span key={v}>{v}</span>)}</div><p>At most M alternatives; J carries the source-dependent choice.</p></>,
  <><p>Deterministic decoder looks up J → reconstruction block X̂ⁿ</p><CoordinateVector reconstruction/><p>Matching colour and index pair Xᵢ with X̂ᵢ; the expected cost of that pair is Dᵢ.</p></>
 ]}/>;
}

function SetSketch(){
 const ref=useRef(null),probe=useRef(null),[size,setSize]=useState({w:500,f:16});
 useLayoutEffect(()=>{const read=()=>setSize({w:ref.current.clientWidth,f:parseFloat(getComputedStyle(document.documentElement).fontSize)}),o=new ResizeObserver(read);o.observe(ref.current);o.observe(probe.current);read();return()=>o.disconnect()},[]);
 const {w,f}=size,h=15*f,px=v=>w*v;
 return <div ref={ref} className="rd-set-sketch"><span className="rd-rem-probe" ref={probe}/><svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Conceptual typical source set containing three compatibility regions; selected star lies in region 2 only" style={{fontSize:f}}>
  <rect x={.3*f} y={.3*f} width={Math.max(10,w-.6*f)} height={h-.6*f} rx={1.5*f} fill="none" stroke={ink.neutral} strokeDasharray="5 5"/>
  <ellipse cx={px(.25)} cy={5*f} rx={px(.17)} ry={3*f} fill={ink.amber} fillOpacity=".08" stroke={ink.amber}/>
  <ellipse cx={px(.60)} cy={7*f} rx={px(.22)} ry={4*f} fill={ink.blue} fillOpacity=".08" stroke={ink.blue}/>
  <ellipse cx={px(.28)} cy={11*f} rx={px(.15)} ry={2.4*f} fill={ink.lavender} fillOpacity=".08" stroke={ink.lavender}/>
  {[[.25,4,'1',ink.amber],[.63,5,'2',ink.blue],[.28,11,'3',ink.lavender],[.60,8,'★',ink.neutral]].map(([x,y,v,c])=><text key={v} x={px(x)} y={y*f} fill={c} textAnchor="middle">{v}</text>)}
 </svg></div>;
}
export function TypicalCover(){
 return <><p>Dashed boundary: typical source set. ★ is the selected source block xⁿ.</p><SetSketch/><div className="rd-key"><span style={{color:ink.amber}}>Region 1 excludes ★</span><span style={{color:ink.blue}}>Region 2 includes ★</span><span style={{color:ink.lavender}}>Region 3 excludes ★</span></div><p>Each numbered region contains source blocks compatible with one candidate reconstruction. These are conceptual typicality sets; shape and area are not distances or probabilities.</p><div className="rd-independent-trials">{['1','2','… M'].map(v=><div key={v}><p>Independent candidate {v}</p><div className="rd-trial-fork"><span style={{color:ink.blue}}>↙ hit: aₙ</span><span style={{color:ink.coral}}>miss: 1−aₙ ↘</span></div></div>)}</div><Operation>All M miss = miss₁ ∩ miss₂ ∩ … ∩ miss_M</Operation><p>The independent draws are from the reconstruction marginal, conditional on this fixed typical xⁿ. All misses require every miss branch; a single hit is enough for a compatible codeword.</p></>;
}

export function ExceptionalPartition(){
 return <><div className="rd-symbolic-mass" role="img" aria-label="Probability one is partitioned into covered mass one minus epsilon and exceptional mass epsilon, schematic widths"><span>Covered mass<br/>1−ε</span><span>Exceptional mass<br/>ε</span></div><p>Symbolic partition of total probability 1; widths are schematic. The exceptional part contributes at most ε × d_max.</p></>;
}

export function ArrayReduction(){
 const q=[[.66579974,.33289987,.00130039],[.32,.64,.04],[.001834862,.058715596,.939449541]],p=[.7,.2,.1],colours=[ink.amber,ink.blue,ink.lavender];
 return <><p>Three source rows i and three reconstruction columns j. Keep each column’s identity during the reduction.</p><p className="rd-scroll-cue">The array keeps its columns aligned. Focus this region and scroll horizontally when needed.</p><div className="rd-array-reduction" role="region" tabIndex={0} aria-label="Each source probability scales one three-entry channel row; column sums produce three output probabilities"><div className="rd-array-head"><span>pᵢ</span>{['0','1','3'].map((v,j)=><span key={v} style={{color:colours[j]}}>j: {v}</span>)}</div>{q.map((r,i)=><div className="rd-array-row" key={i}><span>{p[i]} ×</span>{r.map((v,j)=><span key={j} style={{borderColor:colours[j],color:colours[j]}}>q<sub>{i}{j}</sub><small>{v}</small></span>)}</div>)}<div className="rd-array-row rd-array-sums"><span>Σᵢ ↓</span>{['.530243304','.366901469','.102855227'].map((v,j)=><span key={j} style={{borderColor:colours[j],color:colours[j]}}>↓ r<sub>{j}</sub><small>{v}</small></span>)}</div></div><Panels><div><p>axis=0: reduce down source rows</p><Operation>jointᵢⱼ = pᵢqᵢⱼ → rⱼ = Σᵢjointᵢⱼ</Operation></div><div><p>axis=1: reduce across a Gibbs row</p><div className="rd-coordinate-vector">{['ℓᵢ₀','ℓᵢ₁','ℓᵢ₂'].map((v,j)=><span key={v} style={{color:colours[j]}}>{v}</span>)}</div><Operation>logsumexp → one ln Zᵢ per row</Operation></div></Panels><p>The small row entries are rounded labels from the recorded first iterate. The complete programme uses full-precision arrays.</p></>;
}

export function LearnedCodec(){
 return <><p>Trace one illustrative latent coefficient y₁=1.3. This example specifies the rounding operation; a bitword needs an agreed mass model and coding syntax.</p><Panels><div><p>Actual encoder and decoder</p><Steps items={[
  <>Analysis transform: source x → real latent y₁<Plot domain={[0,2]} range={[0,1]} xLabel="Latent coordinate" yLabel="Selected coefficient" description="Real latent value 1.3">{({mark})=>mark([1.3,.4],{color:'amber',selected:true})}</Plot></>,
  <>Round: y₁=1.3 → integer q₁=1<div className="rd-coordinate-vector"><span style={{color:ink.blue}}>q₁ = 1</span></div></>,
  <>Entropy coder reads q₁ and the agreed Q(1)<div className="rd-coordinate-vector rd-message-slots">{['b₁','b₂','…'].map(v=><span key={v}>{v}</span>)}</div><p>Actual framed bitstream; symbols bᵢ denote bits whose values depend on that coder.</p></>,
  <>Entropy decoder + agreed model/syntax → exactly q₁=1<div className="rd-coordinate-vector"><span style={{color:ink.blue}}>q₁ = 1</span></div></>,
  <>Synthesis transform uses the recovered indices → reconstruction X̂</>
 ]}/></div><div><p>Separate training-only branch from the same y₁</p><Plot domain={[0,2]} range={[0,1.2]} xLabel="Noisy coefficient y₁ + U" yLabel="Uniform density" description="Training noise uniform from minus one half to one half makes coefficient uniform on .8 to1.8">{({path,line,mark})=><>{path([[.8,0],[.8,1],[1.8,1],[1.8,0]],'lavender')}{line([1.3,0],[1.3,1],'neutral',{strokeDasharray:'3 3'})}{mark([1.3,0],{color:'amber'})}</>}</Plot><p>U is uniform on [−.5,.5]; y₁+U lies in [.8,1.8]. This continuous random variable differs from q₁=1.</p><Steps items={['Continuous density proxy plus paired reconstruction distortion','Differentiable expectation used as the training objective']}/><p>The branch ends at the objective. No noisy sample enters the transmitted bitstream, and no observed bit count is assigned to this density.</p></div></Panels></>;
}
