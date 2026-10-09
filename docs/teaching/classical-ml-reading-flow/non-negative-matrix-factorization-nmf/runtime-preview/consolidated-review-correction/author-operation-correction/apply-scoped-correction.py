"""Original runtime author: bounded F2/F3/F4 successor, no scientific execution."""
from pathlib import Path
import re, json, hashlib
OWNER = Path(__file__).resolve().parent
SOURCE = OWNER.parent
CHANGES = {}
def put(file, name, body):
    CHANGES.setdefault(file, {})[name] = body.strip() + '\n'

put('GeometryFigures.jsx', 'Alternation', r'''
export function Alternation() {
  const [step, setStep] = useState(0), s = cdSweep(X0, onesW, H0),
    w = step === 0 ? onesW : s.w, h = step < 2 ? H0 : s.h,
    prediction = matmul(w, h), newWG = matmul(transpose(s.w), s.w), newWP = matmul(transpose(s.w), X0);
  return <Figure id="D20" caption="This complete CD sweep changes W first, then changes H using the new W. Its operand order differs from the historical H-first multiplicative route.">
    <Operation label="W block holds H0 fixed, constructs caches, then updates W">
      <Matrix label="Held H0 · never changed by W block" values={H0} rows={['C0','C1']} componentRows />
      <Port label="H0 H0ᵀ and X0 H0ᵀ" />
      <div><Matrix label="W-block G" values={matmul(H0, transpose(H0))} rows={['C0','C1']} columns={['C0','C1']} /><Matrix label="W-block P" values={matmul(X0, transpose(H0))} columns={['C0','C1']} /></div>
      <Port label="cyclic CD from W start; publish new W" />
      <Matrix label={step === 0 ? 'W start · block not yet applied' : 'New W · H-block operand'} values={w} columns={['C0','C1']} componentColumns />
    </Operation>
    {step > 0 && <Operation label="H block rebuilds its operands from new W, not the old W">
      <Matrix label="New W · held for H block" values={s.w} columns={['C0','C1']} componentColumns />
      <Port label="new Wᵀ new W and new Wᵀ X0" />
      <div><Matrix label="H-block G · rebuilt from new W" values={newWG} rows={['C0','C1']} columns={['C0','C1']} /><Matrix label="H-block P · rebuilt from new W" values={newWP} rows={['C0','C1']} /></div>
      <Port label="cyclic CD from H0; publish new H" />
      <Matrix label={step === 1 ? 'H0 · H block not yet applied' : 'New H · from new W'} values={h} rows={['C0','C1']} componentRows />
    </Operation>}
    <Operation label="Current factor state reconstructs the full table"><Matrix label="Current W" values={w} componentColumns /><Port label="× current H" /><Matrix label="Current H" values={h} componentRows /><Port label="reconstruct" /><Matrix label="Current prediction" values={prediction} /></Operation>
    <Controls onReset={() => setStep(0)}><button disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button><button disabled={step === 2} onClick={() => setStep(step + 1)}>Step</button></Controls>
    <Result>{['Initial factors', 'W block complete; H remains H0', 'H block complete using new W'][step]}; whole-table half-loss {fmt(halfLoss(X0, prediction))}. Expected checkpoints6 → 15/16 → 11733/26620.</Result>
  </Figure>;
}
''')
put('GeometryFigures.jsx', 'Storage', r'''
export function Storage() {
  return <Figure id="D23" caption="Actual shapes make the storage terms concrete. X exists as input; training W may be returned, H and metadata support later queries, and Gram/cross/row diagnostics are workspace. A changed factor requires cache rebuilding.">
    <div className="nmf-lifetime"><h4>Caller input · not learned state</h4><Matrix label="Input X · nd=9 cells" values={X0} /></div>
    <div className="nmf-lifetime"><h4>Returned training result · caller lifetime</h4><Matrix label="Returned training W · nk=6" values={W0} columns={['C0','C1']} /><p>Returning W does not require keeping all training rows inside the fitted object for later queries.</p></div>
    <div className="nmf-lifetime nmf-lifetime--retained"><h4>Retained fitted state · later query lifetime</h4><Panels><Matrix label="Retained fitted H · kd=6" values={H0} rows={['C0','C1']} /><Matrix label="Retained metadata slots" values={[[2,'F0/F1/F2','stored objective','stored stop reason']]} columns={['Fitted k','Ordered features','Diagnostic','Diagnostic']} /></Panels></div>
    <div className="nmf-lifetime"><h4>Transient solver workspace · rebuild after operand changes</h4><Operation label="A changed H invalidates G and P"><Matrix label="Current H" values={H0} /><Port label="H changes → rebuild H Hᵀ and X Hᵀ" /><div><Matrix label="Workspace G · k²=4" values={matmul(H0, transpose(H0))} columns={['C0','C1']} rows={['C0','C1']} /><Matrix label="Workspace P · nk=6" values={matmul(X0, transpose(H0))} columns={['C0','C1']} /></div></Operation><p>For the H block, new W similarly replaces WᵀW and WᵀX. Caches belong to their exact current operands.</p></div>
    <div className="nmf-lifetime"><h4>Temporary row diagnostics · release after reduction</h4><Matrix label="One diagnostic row block · bd=3" values={[X0[0]]} /><p>A block reduces into diagnostic totals; explicitly requested history has its own retained lifetime.</p></div>
    <p>Cache construction O(ndk+(n+d)k²); q cyclic sweeps O(q(n+d)k²); reconstruction diagnostics O(ndk). Transient caches O(k²+max(nk,kd)), plus block diagnostics and explicitly retained history. These are operation/storage counts, not measured timings.</p>
  </Figure>;
}
''')
put('OptimizationFigures.jsx', 'Ratio', r'''
export function Ratio() {
  const s = muSweep(X0, onesW, H0), gram = matmul(transpose(onesW), onesW);
  return <Figure id="D24" caption="Each elementwise ratio multiplies the old H cell. The selected C0/F2 cell is1×9/6=1.5; an old zero remains zero. No matrix inverse is involved.">
    <Operation label="Selected numerator contracts observation identities"><Matrix label="Wᵀ · component by observation" values={transpose(onesW)} rows={['C0','C1']} columns={['R0','R1','R2']} selectedCells={[[0,0],[0,1],[0,2]]} /><Port label="contract R0/R1/R2 with X F2" /><Matrix label="X · selected feature F2" values={X0} selectedCells={[[0,2],[1,2],[2,2]]} /><Port label="Wᵀ X" /><Matrix label="Numerator Wᵀ X" values={s.hn} rows={['C0','C1']} selected={[0,2]} /></Operation>
    <DotProduct left={[1,1,1]} right={[3,4,2]} ids={['R0','R1','R2']} leftLabel="W[R,C0]" rightLabel="X[R,F2]" resultLabel="Numerator[C0,F2]=9" />
    <Operation label="Selected denominator contracts component identities"><Matrix label="Wᵀ W" values={gram} rows={['C0','C1']} columns={['C0','C1']} selectedCells={[[0,0],[0,1]]} /><Port label="contract C0/C1 with old H F2" /><Matrix label="Old H" values={H0} rows={['C0','C1']} componentRows selectedCells={[[0,2],[1,2]]} /><Port label="Wᵀ W H" /><Matrix label="Denominator" values={s.hd} rows={['C0','C1']} selected={[0,2]} /></Operation>
    <DotProduct left={gram[0]} right={[H0[0][2],H0[1][2]]} ids={['C0','C1']} leftLabel="Gram[C0,C]" rightLabel="Old H[C,F2]" resultLabel="Denominator[C0,F2]=6" componentTerms />
    <Operation label="Elementwise multiplication updates the selected cell"><Matrix label="Selected old H[C0,F2]" values={[[1]]} color={colors[0]} /><Port label="× numerator9 / denominator6" /><Matrix label="Selected new H[C0,F2]" values={[[s.h[0][2]]]} color={colors[0]} /><Port label="same rule for every cell" /><Matrix label="New H" values={s.h} rows={['C0','C1']} componentRows selected={[0,2]} /></Operation>
    <Operation label="Zero-lock consequence uses the same positive denominator"><Matrix label="Old H[C0,F1]=0" values={[[0]]} color={colors[0]} /><Port label={`× ${fmt(s.hn[0][1])} / ${fmt(s.hd[0][1])}`} /><Matrix label="New H[C0,F1]=0" values={[[s.h[0][1]]]} color={colors[0]} /></Operation>
  </Figure>;
}
''')
put('OptimizationFigures.jsx', 'HistoricalMU', r'''
export function HistoricalMU() {
  const [step,setStep]=useState(0), x=[[2,1,3],[1,2,3],[3,3,6]], w0=[[1,.5],[.5,1],[1,1]], h0=[[1,.2,.8],[.2,1,.8]], s=muSweep(x,w0,h0), w=step<2?w0:s.w, h=step===0?h0:s.h;
  return <Figure id="D25" caption="This direct one-step calculation uses the original supplied operands. H updates first; its new values feed W's Gram/cross products. It does not rerun the preserved forty-sweep program.">
    <Operation label="H-first update holds original W fixed"><Matrix label="Held original W" values={w0} columns={['C0','C1']} componentColumns /><Port label="WᵀX / ((WᵀW)H old)" /><div><Matrix label="H numerator" values={s.hn} /><Matrix label="H denominator · old H" values={s.hd} /></div><Port label="old H ⊙ ratio → new H" /><Matrix label={step===0?'Original H · update not yet applied':'New H · next W-block operand'} values={h} rows={['C0','C1']} componentRows /></Operation>
    {step>0 && <Operation label="W update consumes new H, with original W as the multiplicative amount"><Matrix label="Fresh new H" values={s.h} rows={['C0','C1']} componentRows /><Port label="rebuild new H Hᵀ and X new Hᵀ" /><div><Matrix label="New H Hᵀ · W Gram cache" values={matmul(s.h,transpose(s.h))} rows={['C0','C1']} columns={['C0','C1']} /><Matrix label="W numerator · X new Hᵀ" values={s.wn} /><Matrix label="W denominator · original W × new Gram" values={s.wd} /></div><Port label="original W ⊙ ratio → new W" /><Matrix label={step===1?'Original W · update not yet applied':'New W · from new H'} values={w} columns={['C0','C1']} componentColumns /></Operation>}
    <Matrix label="Current prediction · current W × current H" values={matmul(w,h)} />
    <Controls onReset={()=>setStep(0)}><button disabled={step===0} onClick={()=>setStep(step-1)}>Back</button><button disabled={step===2} onClick={()=>setStep(step+1)}>Step</button></Controls><Result>{['Initial supplied factors','H-first update complete','W update using new H complete'][step]}; half-loss {fmt(halfLoss(x,matmul(w,h)))}. Original rounded endpoints17.06 → .03944744.</Result>
  </Figure>;
}
''')
put('OptimizationFigures.jsx', 'Majorizer', r'''
export function Majorizer() {
  const [a,setA]=useState(1), f=z=>(z-2)**2, q=z=>(a-2)**2+(2*a-4)*(z-a)+.5*(2+1/a)*(z-a)**2, z=5*a/(2*a+1), fixed=a===2;
  return <Figure id="D28" caption="The two exact curves touch at a. Their difference (z−a)²/(2a) is nonnegative; minimizing the upper curve gives a safe restricted-coordinate step, rather than a universal beta proof.">
    <Operation label="One amount changes a three-bin reconstruction"><Matrix label="Held C1 amount1; changing C0=z" values={[[z,1]]} columns={['C0','C1']} /><Port label="× fixed H0" /><Matrix label="Actual reconstructed row at new z" values={[[z,1,z+1]]} columns={['F0','F1','F2']} /></Operation>
    <Plot label="Touching objective and auxiliary · visible gap at new z" xmax={3} ymax={18} xlabel="candidate z" ylabel="cost">{map=>{const upper=map([z,q(z)]),lower=map([z,f(z)]);return <><Curve map={map} xmax={3} fn={f}/><Curve map={map} xmax={3} fn={q} color={colors[1]}/><Point at={map([a,f(a)])} open/>{fixed?<><Point at={lower} diamond open color="#f2c276"/><text x="140" y="225">touch = q min = f new</text></>:<><path d={`M${upper.join(' ')}L${lower.join(' ')}`} stroke="#f2c276" strokeWidth="3"/><Point at={upper} color={colors[1]}/><Point at={lower} diamond open color="#f2c276"/><path d={`M${upper.join(' ')}L80 190M${lower.join(' ')}L175 225`} stroke="currentColor" fill="none"/><text x="62" y="185">q min</text><text x="175" y="242">f new</text></>}</>;}}</Plot>
    <Controls onReset={()=>setA(1)}><Range label="Current positive coordinate a" value={a} onChange={setA} min={.25} max={2} step={.25}/></Controls><Result>Blue f, rose q; open circle is the touching point, rose circle is q minimum, amber diamond is f(new). Amber vertical segment is q(new)−f(new); at a2 its length is0 and the points coincide. New z={fmt(z)}; f(new)={fmt(f(z))} ≤ q(new)={fmt(q(z))} ≤ q(a)=f(a)={fmt(f(a))}. Gap at new {fmt(q(z)-f(z))}.</Result>
  </Figure>;
}
''')
put('OptimizationFigures.jsx', 'BetaPower', r'''
export function BetaPower() {
  const [b,setB]=useState(0),g=gamma(b),next=4**g;
  return <Figure id="D30" caption="The positive ratio4 is deliberately fixed to isolate the MM power. A beta-dependent exponent changes the step; the exponent-one heuristic agrees only on beta∈[1,2]. The persistent Jensen and tangent insets expose their separate assumptions.">
    <Bars label="Live updated coordinate · old coordinate1" values={[4,next]} ids={['Heuristic','MM']} max={4}/>
    <Operation label="Separate fixed Jensen example · contributions give normalized shares"><Matrix label="Positive contributions" values={[[1,3]]} columns={['C0','C1']} componentColumns/><Port label="sum4; divide each by4"/><Matrix label="Shares · sum1" values={[[.25,.75]]} columns={['C0','C1']} componentColumns/><Port label="apply to arguments2 and6"/><Matrix label="Weighted mean and heights" values={[[.25,2,4],[.75,6,36]]} rows={['C0','C1']} columns={['Share','Argument','Square']}/></Operation>
    <Panels><Plot label="Fixed convex t² · Jensen gap3 at mean5" xmax={6} ymax={36} xlabel="t" ylabel="φ(t)">{map=><><Curve map={map} xmax={6} fn={t=>t*t}/><path d={`M${map([2,4]).join(' ')}L${map([6,36]).join(' ')}`} stroke={colors[1]} strokeWidth="2"/><path d={`M${map([5,25]).join(' ')}L${map([5,28]).join(' ')}`} stroke="#f2c276" strokeWidth="4"/><Point at={map([5,25])}/><Point at={map([5,28])} color={colors[1]}/><text x="75" y="35">heights28</text><path d={`M145 40L${map([5,28]).join(' ')}`} stroke={colors[1]}/><text x="75" y="120">φ(mean)25</text><path d={`M150 115L${map([5,25]).join(' ')}`} stroke={colors[0]}/></>}</Plot><Plot label="Fixed concave log · tangent touches at4" xmin={1} xmax={6} ymin={0} ymax={2} xlabel="t" ylabel="log(t)">{map=><><Curve map={map} xmin={1} xmax={6} fn={Math.log}/><Curve map={map} xmin={1} xmax={6} fn={t=>Math.log(4)+(t-4)/4} color={colors[1]}/><Point at={map([4,Math.log(4)])} label="touch4" open/></>}</Plot></Panels>
    <Controls onReset={()=>setB(0)}><Range label="Beta" value={b} onChange={setB} max={3} step={.1}/></Controls><Result>Live gamma={fmt(g)}, MM1×4^gamma={fmt(next)} versus heuristic4. Separate fixed Jensen example: .25×2+.75×6=5; .25×4+.75×36=28; φ(5)=25; amber gap3. The log tangent is an upper bound touching at4. These fixed illustrations are not recalculated beta objectives.</Result>
  </Figure>;
}
''')
put('OptimizationFigures.jsx', 'Centering', r'''
export function Centering() {
  return <Figure id="D31" caption="Subtracting means[1,2,3] introduces signed entries. NMF initialization uses the uncentred nonnegative input, rather than silently importing PCA's centred fitted model.">
    <Operation label="Column-mean subtraction creates a negative cell"><Matrix label="Original X0 · selected R0/F1=1" values={X0} selected={[0,1]}/><Port label="subtract column means[1,2,3]"/><Matrix label="Column means · selected F1=2" values={[[1,2,3]]} rows={['Mean']} selected={[0,1]}/><Port label="R0/F1: 1−2=−1"/><Matrix label="X0 − means · signed" values={[[1,-1,0],[0,1,1],[-1,0,-1]]} signed selected={[0,1]}/></Operation>
    <Panels><Plot label="Selected R0/F1 · common zero before and after" xmin={-2} xmax={2} ymax={1} xlabel="signed cell value" ylabel="same selected cell">{map=><><path d={`M${map([0,0]).join(' ')}L${map([0,1]).join(' ')}`} stroke="currentColor" strokeDasharray="4 3"/><Arrow from={map([1,.5])} to={map([-1,.5])} color="#f2c276"/><Point at={map([1,.5])} label="before1"/><Point at={map([-1,.5])} label="after−1" color={colors[1]}/></>}</Plot><Bars label="Original nonnegative intensities · unchanged input for NMF" values={X0[0]} ids={['F0','F1','F2']} max={4}/></Panels>
  </Figure>;
}
''')
put('OptimizationFigures.jsx', 'SignedTriplet', r'''
export function SignedTriplet() {
  return <Figure id="D32" caption="The known supplied Xt has a signed second singular term. Its positive part has two disjoint support rectangles; retaining one positive rank-one rectangle requires a paired-sign choice.">
    <Panels><Matrix label="Xt · known supplied matrix" values={[[8.2,2.4],[2.4,6.8]]} max={10}/><Matrix label="First term · σ10 u=v[.8,.6]" values={[[6.4,4.8],[4.8,3.6]]} color={colors[0]} max={10}/></Panels>
    <Panels>{['u · observation direction','v · feature direction'].map(label=><Plot key={label} label={`C1 ${label}`} xmin={-1} xmax={1} ymin={-1} ymax={1} xlabel="entry0" ylabel="entry1" equalUnits>{map=><><Arrow from={map([0,0])} to={map([.6,-.8])} color={colors[1]}/><Point at={map([.6,-.8])} label="(.6,−.8)" color={colors[1]}/></>}</Plot>)}</Panels>
    <Operation label="Signed column-by-row outer product builds C1 term"><Matrix label="C1 σ5 u · observation column" values={[[3],[-4]]} rows={['R0','R1']} color={colors[1]} hatchedCells={[[1,0]]}/><Port label="outer product × vᵀ"/><Matrix label="C1 vᵀ · feature row" values={[[.6,-.8]]} columns={['F0','F1']} color={colors[1]} hatchedCells={[[0,1]]}/><Port label="σ5 u vᵀ"/><Matrix label="C1 signed term · signs remain literal" values={[[1.8,-2.4],[-2.4,3.2]]} color={colors[1]} hatchedCells={[[0,1],[1,0],[1,1]]} signed max={4}/></Operation>
    <Panels><Matrix label="C1 positive-origin rectangle · u+ v+" values={[[1.8,0],[0,0]]} color={colors[1]} selected={[0,0]}/><Matrix label="C1 negative-origin rectangle · u− v−" values={[[0,0],[0,3.2]]} color={colors[1]} hatchedCells={[[1,1]]} selected={[1,1]}/><Matrix label="C1 positive part · both disjoint rectangles" values={[[1.8,0],[0,3.2]]} color={colors[1]} hatchedCells={[[1,1]]}/></Panels><p>Rose always identifies C1. Literal signs mark signed coordinates; a solid support is the positive-origin pair and hatching is the negative-origin pair. Neither sign changes the component identity.</p>
  </Figure>;
}
''')
put('OptimizationFigures.jsx', 'PairedSigns', r'''
export function PairedSigns() {
  const [a,setA]=useState(.6),s=signPair(a),up=[a,0],un=[0,-s.u[1]],vp=[.6,0],vn=[0,.8];
  return <Figure id="D33" caption="Compare the products of paired sign-part norms before selecting and normalizing. Both candidates stay visible. Editing u gives a supplied triplet illustration, not another SVD of the original Xt.">
    <Matrix label="C1 current supplied singular vectors · signs literal" values={[s.u,s.v]} rows={['u','v']} columns={['entry0','entry1']} color={colors[1]} hatchedCells={[[0,1],[1,1]]} signed max={1}/>
    <Operation label="Positive-origin sign parts give one support candidate"><Matrix label="u+ and v+ · nonnegative sign parts" values={[up,vp]} rows={['u+','v+']} color={colors[1]} max={1}/><Port label={`norms ${fmt(a)} × .6 = ${fmt(s.positive)}`}/><Matrix label="σ5 × norm product · solid positive-origin rectangle" values={[[5*s.positive,0],[0,0]]} color={colors[1]} selected={[0,0]}/></Operation>
    <Operation label="Negative-origin sign parts give the other support candidate"><Matrix label="u− and v− · magnitudes, not negative entries" values={[un,vn]} rows={['u−','v−']} color={colors[1]} hatchedCells={[[0,1],[1,1]]} max={1}/><Port label={`norms ${fmt(-s.u[1])} × .8 = ${fmt(s.negative)}`}/><Matrix label="σ5 × norm product · hatched negative-origin rectangle" values={[[0,0],[0,5*s.negative]]} color={colors[1]} hatchedCells={[[1,1]]} selected={[1,1]}/></Operation>
    <Operation label="Compare norms, choose support, normalize only nonzero chosen parts"><Matrix label="Norm products before selection" values={[[s.positive,s.negative]]} columns={['Positive pair','Negative pair']} color={colors[1]}/><Port label={s.choosePositive?'positive ≥ negative · choose positive':'negative > positive · choose negative'}/><Matrix label="Selected nonnegative rank-one term · still C1" values={s.term} color={colors[1]} hatchedCells={s.choosePositive?[]:[[1,1]]} selected={s.choosePositive?[0,0]:[1,1]}/></Operation>
    <Controls onReset={()=>setA(.6)}><Range label="u positive entry a" value={a} onChange={setA} max={1} step={.1}/></Controls><Result>Norm products positive {fmt(s.positive)}, negative {fmt(s.negative)}; {s.choosePositive?'positive':'negative'} pair selected. At a.8 the declared positive-pair tie applies. Zero-norm endpoints are never divided. Rose is C1 throughout; solid/hatching tracks sign-part origin after normalization.</Result>
  </Figure>;
}
''')
put('OptimizationFigures.jsx', 'FilledZeros', r'''
export function FilledZeros() {
  const [d,setD]=useState(0),x=[[8.2,2.4],[2.4,6.8]],original=[[.8*Math.sqrt(10),0],[.6*Math.sqrt(10),4/Math.sqrt(5)]],w=original.map(r=>r.map(v=>v===0?d:v)),h=transpose(w),s=muSweep(x,w,h);
  return <Figure id="D34" caption="Only the original zeros receive δ. Filled and unfilled factors, initial product and one complete H-first/new-H W result remain visible. This edit is not guaranteed to improve the fit; the matrix mean4.95 is a separate nndsvda value outside the live range.">
    <Operation label="Fill only the original zero support"><div><Matrix label="Original W · outlined original zero[0,1]" values={original} componentColumns originalZeros={[[0,1]]}/><Matrix label="Original H=Wᵀ · outlined original zero[1,0]" values={transpose(original)} componentRows originalZeros={[[1,0]]}/></div><Port label={`original zeros only → δ=${fmt(d)}`}/><div><Matrix label="Filled initial W" values={w} componentColumns originalZeros={[[0,1]]}/><Matrix label="Filled initial H" values={h} componentRows originalZeros={[[1,0]]}/></div></Operation>
    <Operation label="H-first multiplicative update then W update from fresh H"><Matrix label="Filled initial H · W held fixed" values={h} componentRows originalZeros={[[1,0]]}/><Port label="H ⊙ (WᵀX)/(WᵀWH)"/><Matrix label="One-step new H · feeds W block" values={s.h} componentRows originalZeros={[[1,0]]}/><Port label="fresh new H → W numerator and denominator"/><Matrix label="One-step new W" values={s.w} componentColumns originalZeros={[[0,1]]}/></Operation>
    <Matrix label="Initial / updated predictions" values={[...matmul(w,h),...matmul(s.w,s.h)]} rows={['Initial R0','Initial R1','Updated R0','Updated R1']} max={12}/><p>Dashed amber cell outlines preserve original-zero identity through filling and both update results; component color remains C0 blue/C1 rose.</p>
    <Controls onReset={()=>setD(0)}><Range label="Fill original zeros δ" value={d} onChange={setD} max={2} step={.1}/></Controls><Result>Initial half-loss {fmt(halfLoss(x,matmul(w,h)))}; after one complete update {fmt(halfLoss(x,matmul(s.w,s.h)))}. New H[1,0]={fmt(s.h[1][0])}, W[0,1]={fmt(s.w[0][1])}.</Result>
  </Figure>;
}
''')
put('OptimizationFigures.jsx', 'PublicAnatomy', r'''
export function PublicAnatomy() {
  const learnedW=[['w00','w01'],['w10','w11'],['w20','w21']],learnedH=[['h00','h01','h02'],['h10','h11','h12']];
  return <Figure id="D35" caption="The numerical lane is a supplied hand decomposition, not invented sklearn factors. Public fit_transform learns new arrays; later transform uses its fitted dictionary. The shown query calculation explicitly uses supplied H0.">
    <h4>Supplied hand decomposition · numerical lane</h4><Operation label="Hand W times hand H0 equals hand X0"><Matrix label="Hand W · 3×2" values={W0} columns={['C0','C1']} componentColumns/><Port label="× supplied H0"/><Matrix label="Hand H0 · 2×3" values={H0} rows={['C0','C1']} componentRows/><Port label="exact product"/><Matrix label="Hand X0 · 3×3" values={X0}/></Operation>
    <h4>Public fitted object · symbolic learned-state lane</h4><Operation label="fit_transform learns returned W and stores fitted H"><Matrix label="Training input X0 · ordered F0/F1/F2" values={X0}/><Port label="fit_transform · learn new arrays"/><Matrix label="Returned learned W · shape only · outside fitted state" values={learnedW} columns={['C0','C1']}/><div className="nmf-lifetime nmf-lifetime--retained"><h4>Fitted-state boundary</h4><Matrix label="Stored components_ · learned H · shape only" values={learnedH} rows={['C0','C1']}/><Matrix label="Stored feature IDs and fitted rank" values={[[ 'F0/F1/F2',2 ]]} columns={['Ordered features','Fitted k']}/></div></Operation>
    <Operation label="Later transform reads the same fitted H; inverse reads it again"><Matrix label="Later query · ordered F0/F1/F2" values={[[1.5,.5,2]]}/><Port label="transform with stored learned H · no refit"/><Matrix label="New query amounts · symbolic learned-H solution" values={[['query w0','query w1']]} columns={['C0','C1']}/><Port label="inverse_transform with that same stored H"/><Matrix label="Predicted query · symbolic" values={[[ 'prediction F0','prediction F1','prediction F2' ]]}/></Operation>
    <h4>Separate supplied-H0 query arithmetic · numerical lane</h4><Operation label="Supplied H0 query amounts reconstruct the shown query"><Matrix label="Query · supplied H0 gives amounts[1.5,.5]" values={[[1.5,.5,2]]}/><Port label="fixed supplied H0 → amounts[1.5,.5]"/><Matrix label="Complete component addends" values={[[1.5,0,1.5],[0,.5,.5]]} rows={['C0','C1']} componentRows/><Port label="sum addends"/><Matrix label="Supplied-H0 prediction" values={[[1.5,.5,2]]}/></Operation>
    <p>Refused: query feature order[F1,F0,F2] differs from fitted[F0,F1,F2]; query[−1,0,1] contains a negative value. Neither request changes the fitted state. Symbolic learned arrays above are not asserted equal to the hand factors.</p>
  </Figure>;
}
''')
put('OptimizationFigures.jsx', 'SameBlock', r'''
export function SameBlock() {
  const [a,setA]=useState(1),cd=[2,2.5],mu=[5*a/(2*a+1),7/(a+2)],lanes=[['Cyclic CD',cd],['Simultaneous MU',mu]];
  return <Figure id="D36" caption="Both routes start from[a,1] with fixed H0. CD sends its new C0=2 into C1=(7−2)/2; MU sends old operands into both denominators2a+1 and a+2. One block is not a stationary coupled solution.">
    <Matrix label="Fixed G and p · component axes" values={[[2,1],[1,2],[5,7]]} rows={['G C0','G C1','p R1']} columns={['C0','C1']}/>
    <Operation label="Cyclic CD wires fresh C0 into the C1 update"><Matrix label="Old amounts" values={[[a,1]]} columns={['C0','C1']} componentColumns/><Port label="C0=(5−old C1)/2=2"/><Matrix label="Fresh C0 with held old C1" values={[[2,1]]} componentColumns/><Port label="C1=(7−fresh C0)/2=2.5"/><Matrix label="CD amounts" values={[cd]} componentColumns/></Operation>
    <Operation label="Simultaneous MU uses old amounts in both contractions"><Matrix label="Old amounts · held for both denominators" values={[[a,1]]} componentColumns/><Port label="C0: a×5/(2a+1); C1: 1×7/(a+2)"/><Matrix label="MU amounts · published together" values={[mu]} componentColumns/></Operation>
    {lanes.map(([name,w])=>{const pred=matmul([w],H0)[0],g=[2*w[0]+w[1]-5,w[0]+2*w[1]-7],arrowScale=.25/Math.max(1,...g.map(Math.abs));return <div key={name}><h4>{name} · resulting coupled slopes</h4><Panels>{[1,-1].map(direction=><Plot key={direction} label={`${name} · ${direction===1?'slope +gradient':'improving −gradient'} directions`} xmax={4} ymax={4} xlabel="C0 amount" ylabel="C1 amount" equalUnits>{map=><>{g.map((v,c)=><Arrow key={c} from={map(w)} to={map(w.map((x,j)=>x+(j===c?direction*v*arrowScale:0)))} color={colors[c]}/>)}<Point at={map(w)} label="amounts" open/></>}</Plot>)}</Panels><Matrix label={`${name} amounts and complete addends`} values={[[...w,'—'],[w[0],0,w[0]],[0,w[1],w[1]],pred,[1-pred[0],3-pred[1],4-pred[2]]]} rows={['C0/C1 amounts','C0 addend','C1 addend','Prediction','Residual']} signed/><p>Blue arrow is C0, rose arrow is C1. Left arrows follow positive coordinate slope; right arrows reverse it to improve this positive-coordinate point. Both drawings use one common scale {fmt(arrowScale)} per gradient unit; a zero slope has no arrow. Half-loss {fmt(halfLoss([[1,3,4]],[pred]))}; gradient [{g.map(fmt).join(', ')}]; PG² {fmt(g[0]**2+g[1]**2)}.</p></div>;})}
    <Controls onReset={()=>setA(1)}><Range label="Initial C0 amount; initial C1=1" value={a} onChange={setA} min={.5} max={2}/></Controls><Result>Start [{fmt(a)},1]: CD loss.75; MU loss {fmt(halfLoss([[1,3,4]],matmul([mu],H0)))}. {halfLoss([[1,3,4]],matmul([mu],H0))<.75?'MU':'CD'} has lower loss at this selected block; neither has zero projected gradient.</Result>
  </Figure>;
}
''')
put('OptimizationFigures.jsx', 'Publication', r'''
export function Publication() {
  return <Figure id="D37" caption="A complete fitted snapshot is published together only after supported validation and arithmetic succeed. Rejected candidates do not partially replace its H, features, fitted rank or diagnostics. Next-fit configuration and returned copies remain outside it.">
    <div className="nmf-lifetime nmf-lifetime--retained"><h4>Existing fitted snapshot · one coherent published state</h4><Panels><Matrix label="Old fitted H0 · unchanged after refusal" values={H0} rows={['C0','C1']}/><Matrix label="Old ordered feature identities" values={[['F0','F1','F2']]} rows={['Order']}/><Matrix label="Old fitted metadata slots" values={[[2,'stored objective','stored stop reason']]} columns={['Fitted k','Diagnostic','Diagnostic']}/></Panels></div>
    <Operation label="Invalid candidates stop before any fitted slot is published"><div><Matrix label="Negative candidate" values={[[-1,0,1]]} signed/><Matrix label="Nonfinite candidate" values={[[ 'NaN',0,1 ]]}/><Matrix label="Actual width2 candidate · only two cells" values={[[1,2]]} columns={['F0','F1']}/></div><Port label="STOP · negative / nonfinite / expected width3" symbol="⊣"/><p>Validation refuses these candidates. No path transfers any of their cells into the existing fitted snapshot.</p></Operation>
    <Operation label="Valid complete candidate transfers all fitted slots together"><div><Matrix label="Valid new H · indexed values only" values={[['new h00','new h01','new h02'],['new h10','new h11','new h12']]} rows={['new C0','new C1']}/><Matrix label="Candidate metadata · complete" values={[[ 'F0/F1/F2',2,'new objective','new stop reason' ]]} columns={['Ordered features','Fitted k','Diagnostic','Diagnostic']}/></div><Port label="validation + arithmetic succeed → atomic publication"/><div className="nmf-lifetime nmf-lifetime--retained"><h4>Replacement fitted snapshot</h4><p>All new H cells, ordered feature IDs, fitted k, objective and stop reason cross the boundary together. No partial candidate is visible to queries.</p></div></Operation>
    <Operation label="Refusal leaves old query behavior attached to old fitted state"><Matrix label="Old query · ordered F0/F1/F2" values={[[1.5,.5,2]]}/><Port label="read unchanged fitted k2 and H0"/><Matrix label="Old query amounts · still two components" values={[[1.5,.5]]} columns={['C0','C1']}/></Operation>
    <Panels><div className="nmf-lifetime"><h4>Future configuration · outside fitted snapshot</h4><Matrix label="Next-fit requested k1" values={[[1]]}/><p>It cannot resize the old two-component query.</p></div><div className="nmf-lifetime"><h4>Returned copy · outside fitted snapshot</h4><Matrix label="Edited returned copy · no backward mutation" values={[[-99,0,1],[0,1,1]]} signed/><p>Editing this copy does not cross back into stored H.</p></div></Panels><p>Valid publication is a state-consistency operation; it does not certify global optimality.</p>
  </Figure>;
}
''')
put('OptimizationFigures.jsx', 'MaskGram', r'''
export function MaskGram() {
  const [m,setM]=useState(1),root=Math.sqrt(m),g=[[1+m,m],[m,1+m]],p=[[2+3*m,1+3*m]],A=[[1,0],[0,1],[root,root]],b=[[2],[1],[3*root]];
  return <Figure id="D40" caption="Weights change the local Gram and cross product. F2 remains measured3 even when excluded from the objective. Square-root weighting produces the same G=AᵀA and p=Aᵀb; different masks require different caches.">
    <Operation label="Square-root weights act on features, not on measured values"><div><Matrix label="Measured R0 · unchanged" values={[[2,1,3]]} selected={[0,2]}/><Matrix label="Separate weights [1,1,m]" values={[[1,1,m]]} selected={[0,2]}/><Matrix label="Fixed H0" values={H0} rows={['C0','C1']} componentRows selectedCells={[[0,2],[1,2]]}/></div><Port label="each feature row × sqrt(weight)"/><div><Matrix label="A = sqrt(weights) Hᵀ" values={A} rows={['F0','F1','F2']} columns={['C0','C1']} selectedCells={[[2,0],[2,1]]}/><Matrix label="b = sqrt(weights) x" values={b} rows={['F0','F1','F2']} columns={['Target']} selected={[2,0]}/></div></Operation>
    <Operation label="Contract the same feature identities into weighted caches"><div><DotProduct left={[1,0,root]} right={[0,1,root]} ids={['F0','F1','F2']} leftLabel="A[F,C0]" rightLabel="A[F,C1]" resultLabel="G[C0,C1] · F2 contributes m"/><DotProduct left={[1,0,root]} right={[2,1,3*root]} ids={['F0','F1','F2']} leftLabel="A[F,C0]" rightLabel="b[F]" resultLabel="p[C0] · F2 contributes3m"/></div><Port label="AᵀA and Aᵀb"/><div><Matrix label="Current local G" values={g} rows={['C0','C1']} columns={['C0','C1']} selected={[0,1]}/><Matrix label="Current local p" values={p} columns={['C0','C1']} selected={[0,0]}/></div></Operation>
    <Panels><Matrix label="All-observed comparison G / p" values={[[2,1],[1,2],[5,4]]} rows={['G C0','G C1','p']} columns={['C0','C1']}/><Matrix label="Second observation pattern · mask[1,0,0]" values={[[1,0,0]]}/><Matrix label="Second mask requires G=diag(1,0), p=[2,0]" values={[[1,0],[0,0],[2,0]]} rows={['G C0','G C1','p']} columns={['C0','C1']}/></Panels><Controls onReset={()=>setM(1)}><Range label="F2 observation weight m" value={m} onChange={setM} max={1}/></Controls><Result>m={fmt(m)}; offdiagonal contribution {fmt(m)}, each F2 cross contribution {fmt(3*m)}. A third row [{fmt(root)},{fmt(root)}], target {fmt(3*root)}. {m===0?'F2 is excluded.':m===1?'All three cells observed equally.':'Fractional weighting differs from a binary observation mask.'}</Result>
  </Figure>;
}
''')
put('TransferFigures.jsx', 'OnlineStatistics', r'''
export function OnlineStatistics() {
  return <Figure id="D61" caption="Each historical encoding contributes an outer product to A and a code×observation product to B. These exact products expose the compact surrogate without implying that all earlier rows are retained or freshly re-encoded.">
    {[{name:'Historical',x:[2,1,3],w:[2,1],a:oldA,b:oldB},{name:'Incoming fixed-H',x:[0,2,2],w:[0,2],a:deltaA,b:deltaB}].map(({name,x,w,a,b})=><div key={name}><h4>{name} row contribution</h4><Operation label={`${name} code column outer code row produces A`}><Matrix label={`${name} code column wᵀ`} values={w.map(v=>[v])} rows={['C0','C1']} componentRows selected={[0,0]}/><Port label="outer product × code row w"/><Matrix label={`${name} code row w`} values={[w]} columns={['C0','C1']} componentColumns selected={[0,1]}/><Port label={`A01 = ${w[0]}×${w[1]} = ${a[0][1]}`}/><Matrix label={`${name} A contribution`} values={a} rows={['C0','C1']} columns={['C0','C1']} selected={[0,1]}/></Operation><Operation label={`${name} code column outer observation row produces B`}><Matrix label={`${name} code column wᵀ`} values={w.map(v=>[v])} rows={['C0','C1']} componentRows selected={[0,0]}/><Port label="outer product × observation x"/><Matrix label={`${name} observation row x`} values={[x]} columns={['F0','F1','F2']} selected={[0,2]}/><Port label={`B02 = ${w[0]}×${x[2]} = ${b[0][2]}`}/><Matrix label={`${name} B contribution`} values={b} rows={['C0','C1']} columns={['F0','F1','F2']} selected={[0,2]}/></Operation></div>)}
  </Figure>;
}
''')
put('TransferFigures.jsx', 'Retention', r'''
export function Retention() {
  const [rho,setRho]=useState(1),a=add(scale(oldA,rho),deltaA),b=add(scale(oldB,rho),deltaB);
  return <Figure id="D62" caption="For this nonempty batch, old statistics receive retentionρ and the incoming products enter once. Empty batch is a no-op. Atρ0 the old statistics vanish while the existing dictionary is not reset.">
    <Operation label="Retain old A, add incoming A once, publish new A"><Matrix label="Old A" values={oldA} rows={['C0','C1']} columns={['C0','C1']} selected={[1,1]}/><Port label={`× ρ=${fmt(rho)}`}/><Matrix label="Retained old A · ρ Aold" values={scale(oldA,rho)} selected={[1,1]}/><Port label="+ incoming ΔA" symbol="+"/><Matrix label="Incoming ΔA · unscaled" values={deltaA} selected={[1,1]}/><Port label={`A11: ${fmt(rho)}×1+4=${fmt(a[1][1])}`}/><Matrix label="New A" values={a} selected={[1,1]}/></Operation>
    <Operation label="Retain old B, add incoming B once, publish new B"><Matrix label="Old B" values={oldB} rows={['C0','C1']} selected={[1,1]}/><Port label={`× ρ=${fmt(rho)}`}/><Matrix label="Retained old B · ρ Bold" values={scale(oldB,rho)} selected={[1,1]}/><Port label="+ incoming ΔB" symbol="+"/><Matrix label="Incoming ΔB · unscaled" values={deltaB} selected={[1,1]}/><Port label={`B11: ${fmt(rho)}×1+4=${fmt(b[1][1])}`}/><Matrix label="New B" values={b} selected={[1,1]}/></Operation>
    <div className="nmf-lifetime nmf-lifetime--retained"><h4>Dictionary lifetime is separate from old-statistic retention</h4><Matrix label="Existing dictionary · retained even atρ0" values={H0} rows={['C0','C1']} componentRows/><p>Empty batch bypasses both operations above: Aold → Aold, Bold → Bold, H → H. It does not apply retention without incoming data.</p></div>
    <Controls onReset={()=>setRho(1)}><Range label="Old-statistic retention ρ" value={rho} onChange={setRho} max={1}/></Controls><Result>ρ={fmt(rho)}. A11={fmt(rho+4)}, B[1,F1]={fmt(rho+4)}. Empty batch leaves A/B/H unchanged. Atρ0 an unused C0 surrogate coordinate is flat and its dictionary row is retained.</Result>
  </Figure>;
}
''')
put('TransferFigures.jsx', 'TensorAddress', r'''
export function TensorAddress() {
  return <Figure id="D64" caption="Named axes are observation i, feature j and time t. A complete rank-one tensor retains its zero feature plane. The declared j-major/t-minor unfolding uses column2j+t, so its inverse maps each cell back without loss.">
    <Operation label="Selected three-mode factor cells multiply into voxel (1,0,1)"><Matrix label="Observation factor a_i · selected i1" values={[[1],[2]]} rows={['i0','i1']} selected={[1,0]}/><Port label="a1=2 × b0=1" symbol="×"/><Matrix label="Feature factor b_j · selected j0" values={[[1],[0]]} rows={['j0','j1']} selected={[0,0]}/><Port label="× c1=3" symbol="×"/><Matrix label="Time factor c_t · selected t1" values={[[1],[3]]} rows={['t0','t1']} selected={[1,0]}/><Port label="2×1×3=6 at (i1,j0,t1)"/><Matrix label="Tensor time t1 · i×j slice" values={[[3,0],[6,0]]} rows={['i0','i1']} columns={['j0','j1']} selected={[1,0]}/></Operation>
    <Operation label="Voxel address maps to the declared unfolding address"><Matrix label="Selected voxel T[1,0,1]" values={[[6]]}/><Port label="row i=1; column2j+t=1"/><Matrix label="Unfolding · j-major/t-minor" values={[[1,3,0,0],[2,6,0,0]]} rows={['i0','i1']} columns={['j0t0','j0t1','j1t0','j1t1']} selected={[1,1]}/><Port label="inverse: j=floor(1/2)=0; t=1 mod2=1"/><Matrix label="Recovered address and value" values={[[1,0,1,6]]} columns={['i','j','t','T value']}/></Operation>
    <Matrix label="Tensor time t0 · entire companion slice retained" values={[[1,0],[2,0]]} rows={['i0','i1']} columns={['j0','j1']}/><p>The entire j1 feature plane remains zero, rather than disappearing.</p>
  </Figure>;
}
''')
put('TransferFigures.jsx', 'TensorAnatomy', r'''
export function TensorAnatomy() {
  return <Figure id="D65" caption="CP rank1 and Tucker rank(1,1,1) with scalar core1 reconstruct the same rank-one example. A separate identity-factor core example isolates a single core interaction; it is a different anatomy example, without a fitted tensor optimizer.">
    <Operation label="CP rank1 connects one common component across three named modes"><Matrix label="Observation mode factor a · i×C0" values={[[1],[2]]} rows={['i0','i1']} columns={['C0']}/><Port label="same CP component C0"/><Matrix label="Feature mode factor b · j×C0" values={[[1],[0]]} rows={['j0','j1']} columns={['C0']}/><Port label="outer product across i/j/t"/><Matrix label="Time mode factor c · t×C0" values={[[1],[3]]} rows={['t0','t1']} columns={['C0']}/></Operation>
    <Operation label="Tucker scalar core connects three distinct latent mode ports"><Matrix label="Core G000=1 · latent p0/q0/r0" values={[[1]]}/><Port label="p0 → observation a_i0; q0 → feature b_j0; r0 → time c_t0"/><div><Matrix label="Observation mode · i×p0" values={[[1],[2]]} columns={['p0']}/><Matrix label="Feature mode · j×q0" values={[[1],[0]]} columns={['q0']}/><Matrix label="Time mode · t×r0" values={[[1],[3]]} columns={['r0']}/></div><Port label="sum core-weighted mode products"/><div><Matrix label="CP and Tucker time0 slice · same product" values={[[1,0],[2,0]]}/><Matrix label="CP and Tucker time1 slice · same product" values={[[3,0],[6,0]]}/></div></Operation>
    <h4>Separate identity-factor core interaction · different example</h4><Operation label="One core address connects through one cell in each identity mode factor"><Matrix label="Core time r0 · sole G[0,1,0]=2" values={[[0,2],[0,0]]} rows={['p0','p1']} columns={['q0','q1']} selected={[0,1]}/><Port label="core value2 × three addressed factors"/><div><Matrix label="Observation factor · i×p · use I[0,0]=1" values={[[1,0],[0,1]]} rows={['i0','i1']} columns={['p0','p1']} selected={[0,0]}/><Matrix label="Feature factor · j×q · use I[1,1]=1" values={[[1,0],[0,1]]} rows={['j0','j1']} columns={['q0','q1']} selected={[1,1]}/><Matrix label="Time factor · t×r · use I[0,0]=1" values={[[1,0],[0,1]]} rows={['t0','t1']} columns={['r0','r1']} selected={[0,0]}/></div><Port label="2×1×1×1=2 at (i0,j1,t0)"/><Matrix label="Tensor time t0 · sole T[0,1,0]=2" values={[[0,2],[0,0]]} rows={['i0','i1']} columns={['j0','j1']} selected={[0,1]}/></Operation>
    <Panels><Matrix label="Separate core time r1 slice · all zero" values={[[0,0],[0,0]]}/><Matrix label="Separate tensor time t1 slice · all zero" values={[[0,0],[0,0]]}/></Panels><p>General core dimensions and cross-component interactions require their own decomposition scope.</p>
  </Figure>;
}
''')

def sha(data): return hashlib.sha256(data).hexdigest()
rows=[]
for file, replacements in CHANGES.items():
    path=SOURCE/file
    before=path.read_bytes()
    backup=OWNER/'predecessors'/file
    backup.parent.mkdir(exist_ok=True)
    if backup.exists():
        raise RuntimeError('Refuse to overwrite preserved predecessor '+str(backup))
    backup.write_bytes(before)
    text=before.decode('utf-8').replace('\r\n','\n')
    spans=[]
    for name,body in replacements.items():
        pattern=r'export function '+re.escape(name)+r'\([^]*' if False else r'export function '+re.escape(name)+r'\('
        start=re.search(pattern,text)
        if not start: raise RuntimeError('Missing function '+name)
        nextfn=re.search(r'\n(?:export )?function ',text[start.end():])
        end=start.end()+nextfn.start()+1 if nextfn else len(text)
        old=text[start.start():end]
        spans.append({'function':name,'before':old,'after':body})
        text=text[:start.start()]+body+text[end:]
    if file!='GeometryFigures.jsx':
        text=text.replace(' Result, colors }',' Result, colors, Arrow }') if file=='OptimizationFigures.jsx' else text
        text=text.replace("from './Drawing.jsx';\n", "from './Drawing.jsx';\nimport { Operation, Port, DotProduct } from './Operations.jsx';\n",1)
    after=text.replace('\n','\r\n').encode('utf-8')
    path.write_bytes(after)
    rows.append({'path':str(path.relative_to(SOURCE)), 'before':{'bytes':len(before),'sha256':sha(before),'preserved':str(backup.relative_to(SOURCE))},'after':{'bytes':len(after),'sha256':sha(after)},'replacedFunctions':list(replacements),'exactFunctionAmendments':spans})
(OWNER/'scoped-delta.json').write_text(json.dumps({'scope':'Original NMF runtime author, assigned F2/F3/F4 functions only; no build/science/native','rows':rows},indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(json.dumps([{'path':r['path'],'after':r['after'],'functions':r['replacedFunctions']} for r in rows]))
