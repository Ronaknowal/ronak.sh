import { GaussianTableRegion } from "./GaussianTableRegion.jsx";
import { useState } from 'react';
import { FlowLab, FlowControls, FlowReadout, FlowChoice, flowNumber } from "../LessonFlow.jsx";
import { GaussianDrawing, GaussianQuantity } from "./GaussianScalarFigures.jsx";
import { MixtureArrow, gaussianMixtureColours } from "./GaussianMixtureFigures.jsx";
import { gaussianDetails } from "./gaussian-geometry-models.mjs";
import { covarianceFamilies, covarianceContour, permutationWitness, covarianceFamilyFixtures, suppliedFamilyUpdate,
  covarianceParameterCount, diagonalMixtureMoments, constructedBlockRows, constructedBlockState, twoPassCovarianceUpdate } from "./gaussian-covariance-family-models.mjs";
import "./covariance-family-runtime.css";

const C = gaussianMixtureColours, hues = [C.left, '#c4adcf', C.right], componentHues = [C.left, C.right];
const n = value => flowNumber(value, 6), exact = value => flowNumber(value, 12);
const path = (points, sx, sy) => points.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x)},${sy(y)}`).join(' ');
const pair = values => `(${values.map(n).join(', ')})`;
const familyOptions = covarianceFamilies.map(f => [f, f === 'diag' ? 'Diagonal' : f[0].toUpperCase() + f.slice(1)]);
const Cross = ({ x, y, colour = C.ink }) => <path d={`M${x-5},${y-5} L${x+5},${y+5} M${x-5},${y+5} L${x+5},${y-5}`} stroke={colour} strokeWidth="2" />;

function MatrixCells({ values, x = 20, y = 30, label = 'Σ', colour = C.ink, cellWidth = 110 }) {
  x = Number(x); y = Number(y);
  return <g data-matrix={label}>
    <text x={x} y={y}>{label}</text>
    <text x={x+cellWidth/2} y={y+29} textAnchor="middle">x₁</text><text x={x+cellWidth*1.5} y={y+29} textAnchor="middle">x₂</text>
    <path d={`M${x-3},${y+37} h-7 v79 h7 M${x+cellWidth*2+3},${y+37} h7 v79 h-7`} fill="none" stroke={colour} />
    {[0,1].map(i=><text key={`row${i}`} x={x-14} y={y+64+i*37} textAnchor="end">{i+1}</text>)}
    {[0,1].map(i => [0,1].map(j => <g key={`${i}-${j}`}>
      <rect x={x+j*cellWidth} y={y+39+i*37} width={cellWidth} height="37" fill="none" stroke={C.reference} strokeOpacity=".35" />
      <text x={x+(j+.5)*cellWidth} y={y+64+i*37} textAnchor="middle" fill={colour}>{typeof values[i][j] === 'string' ? values[i][j] : n(values[i][j])}</text>
    </g>))}
  </g>;
}
function Plane({ width, y = 0, means, covariances, total, offsets = false, domain = [-4,4,-2,2], observations = [] }) {
  const [xmin,xmax,ymin,ymax] = domain, scale = (width-90)/(xmax-xmin), left = 55, top = y+25;
  const sx = x => left+(x-xmin)*scale, sy = v => top+(ymax-v)*scale, base = sy(ymin), h = (ymax-ymin)*scale;
  return <g data-plane-scale={scale} data-plane-domain={domain.join(',')}>
    <line x1={sx(xmin)} x2={sx(xmax)} y1={sy(0)} y2={sy(0)} stroke={C.reference}/>
    <line x1={sx(0)} x2={sx(0)} y1={sy(ymin)} y2={sy(ymax)} stroke={C.reference}/>
    {[xmin,0,xmax].map(v => <g key={`x${v}`}><line x1={sx(v)} x2={sx(v)} y1={base} y2={base+5} stroke={C.reference}/><text x={sx(v)} y={base+25} textAnchor="middle">{v}</text></g>)}
    {[ymin,0,ymax].map(v => <text key={`y${v}`} x="35" y={sy(v)+5} textAnchor="end">{v}</text>)}
    <text x={(sx(xmin)+sx(xmax))/2} y={base+52} textAnchor="middle">x₁ · coordinate units</text><text x="45" y={top-6}>x₂</text>
    {total && <path data-contour="moment-matching" d={path(covarianceContour(total),sx,sy)} fill="none" stroke={C.sum} strokeWidth="2" strokeDasharray="3 5"/>}
    {means.map((mean,k) => <g key={k} data-component-contour={k}>
      <path d={path(covarianceContour(covariances[k],mean),sx,sy)} fill="none" stroke={componentHues[k]} strokeWidth="2" strokeDasharray={k ? '8 4' : undefined}/>
      {offsets && <MixtureArrow points={[[sx(0),sy(0)],[sx(mean[0]),sy(mean[1])]]} color={componentHues[k]}/>}
      <Cross x={sx(mean[0])} y={sy(mean[1])} colour={componentHues[k]}/>
    </g>)}
    {observations.map((p,i) => <g key={i}><circle cx={sx(p[0])} cy={sy(p[1])} r="4" fill={C.ink}/><text x={sx(p[0])+9} y={sy(p[1])-9}>{String.fromCharCode(65+i)}</text></g>)}
    <text x="20" y={y+h+108} fill={C.left}>Left: solid contour, × centre</text><text x="20" y={y+h+136} fill={C.right}>Right: dashed contour, × centre</text>
  </g>;
}
function ExactMatrices({ label, matrices, ids = ['Left','Right'] }) {
  return <div className="gmm-family-tables">{matrices.map((m,k) => <GaussianTableRegion key={k}><table key={k}><caption>{label} · {ids[k]}</caption><thead><tr><th>row / column</th><th>x₁</th><th>x₂</th></tr></thead><tbody>{m.map((row,i) => <tr key={i}><th>x{i+1}</th>{row.map((v,j)=><td key={j}>{exact(v)}</td>)}</tr>)}</tbody></table></GaussianTableRegion>)}</div>;
}

function PermutationCurves({ parameters }) {
  return <GaussianDrawing id="D37-curves" title="Physical component curves stay fixed while array columns exchange" width={760} adaptive height={330}
    description={`Current array order ${parameters.ids.join(', ')}. Each complete weight, mean and variance travels together. Physical Left remains at minus two, Right at two. Their summed density is unchanged.`}>
    {w => {
      const sx=x=>45+(x+5)*(w-80)/10,sy=p=>225-p*680;
      return <><line x1={sx(-5)} x2={sx(5)} y1="225" y2="225" stroke={C.reference}/>
        {[-5,-2,0,2,5].map(x=><text key={x} x={sx(x)} y="254" textAnchor="middle">{x}</text>)}
        {parameters.ids.map((id,k)=><g key={id}><text x="20" y={25+k*28} fill={id==='Left'?C.left:C.right}>position {k}: {id} · π {parameters.weights[k]} · μ {parameters.means[k]} · v {parameters.variances[k]}</text>
          <path d={path(Array.from({length:201},(_,i)=>{const x=-5+i/20;return[x,parameters.weights[k]*gaussianDetails(x,parameters.means[k],1).density];}),sx,sy)} fill="none" stroke={id==='Left'?C.left:C.right} strokeWidth="2" strokeDasharray={id==='Right'?'8 4':undefined}/></g>)}
        <path d={path(Array.from({length:201},(_,i)=>{const x=-5+i/20;return[x,parameters.means.reduce((s,m,k)=>s+parameters.weights[k]*gaussianDetails(x,m,1).density,0)];}),sx,sy)} fill="none" stroke={C.sum} strokeWidth="2"/>
        <text x="20" y="79" fill={C.sum}>Amber: sum of weighted heights</text><text x={w/2} y="288" textAnchor="middle">x · coordinate units</text><text x="20" y="316">Height · 1 / coordinate unit</text>
      </>;
    }}
  </GaussianDrawing>;
}
function MembershipTable({ title, result }) {
  return <GaussianTableRegion><table><caption>{title}</caption><thead><tr><th>observed ID</th><th>x</th>{result.rows[0].components.map((c,i)=><th key={i}>position {i}: {c.id} share</th>)}<th>first-position argmax</th><th>log density</th></tr></thead><tbody>{result.rows.map((r,i)=><tr key={r.id}><th>{r.id}</th><td>{r.x}</td>{r.components.map(c=><td key={c.id}>{exact(c.share)}</td>)}<td>{result.labels[i]}</td><td>{exact(r.logDensity)}</td></tr>)}</tbody></table></GaussianTableRegion>;
}
export function GaussianComponentPermutation() {
  const [swapped,setSwapped]=useState(false), result=permutationWitness(swapped);
  return <FlowLab id="gmm-component-permutation" label="D37 complete component permutation and positional tie exception">
    <PermutationCurves parameters={result.parameters}/>
    <div><MembershipTable title="Untied U batch: same physical grouping, renamed positions" result={result.untied}/><MembershipTable title="Exact-tie T batch: T2 at zero follows array position 0" result={result.tied}/></div>
    <FlowControls><FlowChoice label="Complete component array order" options={[[false,'Left, Right'],[true,'Right, Left']]} value={swapped} onChange={setSwapped}/><button type="button" onClick={()=>setSwapped(false)}>Reset</button></FlowControls>
    <FlowReadout data-permutation={swapped?'swapped':'original'}>Untied labels: {result.untied.labels.join(', ')}. Exact-tie labels: {result.tied.labels.join(', ')}. Density and share-column identity survive the complete permutation; T2's chosen physical group can change.</FlowReadout>
    <p>The following curves share x from −4 to 4 coordinate units and heights in 1/unit. Solid white is the original unequal-weight sum; dotted grey swaps only means. Amber is the coincident-component sum for either displayed prior split.</p>
    <GaussianDrawing id="D37-contrasts" title="Partial swapping and coincident component descriptions" width={760} adaptive height={460} description={`Both common coordinate rulers extend from minus four to four, heights in inverse coordinate units. White solid is original, grey dotted means-only swap. At query .25, unequal priors .25/.75 give density ${result.unequalBefore}; swapping means alone gives ${result.unequalMeansOnly}. Identical means zero and variance one keep density ${result.coincident[0].density} at query one for either prior split .2/.8 or .8/.2.`}>
      {w=>{
        const sx=x=>40+(x+4)*(w-75)/8,sy=(p,y)=>y-p*220;
        return <><text x="20" y="25">Means-only swap · π = .25 / .75</text>
          {[[[-2,2],C.ink],[[2,-2],C.reference]].map(([means,c],idx)=><path key={idx} d={path(Array.from({length:161},(_,i)=>{const x=-4+i/20;return[x,.25*gaussianDetails(x,means[0],1).density+.75*gaussianDetails(x,means[1],1).density];}),sx,p=>sy(p,145))} fill="none" stroke={c} strokeWidth="2" strokeDasharray={idx?'4 5':undefined}/>)}
          <line x1={sx(-4)} x2={sx(4)} y1="145" y2="145" stroke={C.reference}/><line x1={sx(.25)} x2={sx(.25)} y1="70" y2="150" stroke={C.sum}/><text x="20" y="178">query .25: original {n(result.unequalBefore)}</text><text x="20" y="207">means only: {n(result.unequalMeansOnly)}</text>
          <text x="20" y="250">Coincident means 0 / 0 · variances 1 / 1</text>
          <path d={path(Array.from({length:161},(_,i)=>{const x=-4+i/20;return[x,gaussianDetails(x,0,1).density];}),sx,p=>sy(p,375))} fill="none" stroke={C.sum} strokeWidth="2"/>
          <line x1={sx(-4)} x2={sx(4)} y1="375" y2="375" stroke={C.reference}/><text x="20" y="407">π .2/.8 or .8/.2 → same density</text><text x="20" y="437">at x = 1: {n(result.coincident[0].density)}</text>
        </>;
      }}
    </GaussianDrawing>
    <p>Equal priors and identical variances are a means-only swap exception. Unequal priors expose why moving means alone generally changes the density. Coincident components have another nonunique description; both IDs remain present without moving either curve.</p>
  </FlowLab>;
}

export function GaussianCovarianceFamilies() {
  const fixtures=covarianceFamilyFixtures();
  return <FlowLab id="gmm-covariance-families" label="D38 four actual covariance contour families">
    {covarianceFamilies.map(f=><div key={f} className="gmm-family-lane"><p className="gmm-family-key">{f==='diag'?'Diagonal':f} · same means (−2,0)/(2,0), D² = 1 contours</p>
      <GaussianDrawing id={`D38-${f}`} title={`${f} covariance cells and their actual contours`} width={760} adaptive height={w=>(w-90)/2+(w<550?550:380)} description={`${f} matrices ${JSON.stringify(fixtures[f])}. Both axes use the same physical coordinate scale. Tied shares one full matrix, diagonal has explicit zero cross cells, spherical has different per-component radii.`}>
        {w=>{const py=(w-90)/2+180,stack=w<550;return <><Plane width={w} means={[[-2,0],[2,0]]} covariances={fixtures[f]}/>
          {f==='tied'?<><MatrixCells values={fixtures[f][0]} x={w/2-110} y={py} label="ONE shared Σ" colour={C.ink}/><path d={`M35,${py-18} H${w-35} M35,${py-18} v-12 M${w-35},${py-18} v-12`} stroke={C.ink} fill="none"/><text x="20" y={py+151}>Shared shape AND orientation</text></>: fixtures[f].map((m,k)=><g key={k}><MixtureArrow points={[[stack?w/2:w*(k?.75:.25),py+(stack?k*155:0)-27],[stack?w/2:w*(k?.75:.25),py+(stack?k*155:0)-10]]} color={componentHues[k]}/><MatrixCells values={m} x={stack?w/2-110:k?w/2+20:25} y={py+(stack?k*155:0)} label={`${k?'Right':'Left'} Σ`} colour={componentHues[k]}/></g>)}
        </>;}}
      </GaussianDrawing><ExactMatrices label={`${f} covariance`} matrices={fixtures[f]}/>
    </div>)}
  </FlowLab>;
}

export function GaussianScatterRestrictions() {
  const [family,setFamily]=useState('full'), [reset,setReset]=useState(0), r=suppliedFamilyUpdate(family);
  return <FlowLab id="gmm-scatter-restrictions" label="D39 one supplied allocation restricted four ways">
    <GaussianDrawing id="D39-points" title="Same observed points and new means in every covariance restriction" width={650} adaptive height={w=>(w-90)+180} description={`A (0,0), B (2,0), C (0,2). Left count 1.3 and centre ${pair(r.components[0].mean)}, Right count 1.7 and centre ${pair(r.components[1].mean)}. Ellipses show raw full covariances before restriction.`}>
      {w=><Plane width={w} means={r.components.map(c=>c.mean)} covariances={r.rawFull} domain={[-1,3,-1,3]} observations={r.points}/>}
    </GaussianDrawing>
    <GaussianTableRegion><table><caption>Supplied allocations, unchanged observations</caption><thead><tr><th>ID</th><th>(x₁,x₂)</th><th>Left r</th><th>Right r</th></tr></thead><tbody>{r.points.map((p,i)=><tr key={i}><th>{String.fromCharCode(65+i)}</th><td>{pair(p)}</td><td>{r.shares[i][0]}</td><td>{n(r.shares[i][1])}</td></tr>)}</tbody></table></GaussianTableRegion>
    {r.components.map((c,k)=><GaussianDrawing key={k} id={`D39-${k}`} title={`${k?'Right':'Left'} scatter numerator, restriction, then addition`} width={850} adaptive height={w=>w<800?690:270} description={`Effective count ${c.count}, new mean ${pair(c.mean)}. Full scatter numerator ${JSON.stringify(c.scatter)}; divide by its own count, restrict as ${family}, then add .05 on the diagonal.`}>
      {w=>{const stacked=w<800;return <>
        <MatrixCells values={c.scatter} x="25" y="30" label={`${k?'Right':'Left'} numerator`} colour={componentHues[k]}/><text x="25" y="179">N = {n(c.count)} · μ′ = {pair(c.mean)}</text>
        <MixtureArrow points={stacked?[[130,195],[130,222]]:[[263,104],[274,104]]}/>
        <MatrixCells values={r.restricted[k]} x={stacked?25:290} y={stacked?255:30} label={`Restricted · ${family}`} colour={componentHues[k]}/>
        <text x={stacked?25:290} y={stacked?407:179}>{family==='tied'?'Σ numerators ÷ n = 3':family==='spherical'?'trace(full covariance) ÷ 2':family==='diag'?'keep diagonal; cross cells 0':'numerator ÷ its N'}</text>
        <MixtureArrow points={stacked?[[130,430],[130,457]]:[[523,104],[544,104]]}/>
        <MatrixCells values={r.used[k]} x={stacked?25:560} y={stacked?490:30} label="Used Σ · + .05 I" colour={componentHues[k]}/>
      </>;}}
    </GaussianDrawing>)}
    <FlowControls key={reset}><FlowChoice label="Covariance restriction" options={familyOptions} value={family} onChange={setFamily}/><button type="button" onClick={()=>{setFamily('full');setReset(reset+1);}}>Reset</button></FlowControls>
    <FlowReadout data-restriction={family}>The means and masses remain fixed. {family==='tied'?'Tied pools numerator matrices and divides by total mass 3; it does not average two covariance matrices equally.':'Restriction changes covariance freedom, then the named .05 addition acts on its diagonal.'}</FlowReadout>
    <ExactMatrices label="Full scatter numerator" matrices={r.components.map(c=>c.scatter)}/><ExactMatrices label={`Restricted ${family}, before addition`} matrices={r.restricted}/><ExactMatrices label="Used covariance after .05 addition" matrices={r.used}/>
  </FlowLab>;
}

function ParameterGrid({ rows, columns, x, y, kind, colour=C.ink }) {
  const cell=58;
  return <g><text x={x} y={y}>{kind}</text>{Array.from({length:columns},(_,j)=><text key={j} x={x+(j+.5)*cell} y={y+31} textAnchor="middle">x{j+1}</text>)}
    {Array.from({length:rows},(_,i)=><text key={`row${i}`} x={x-12} y={y+79+i*cell} textAnchor="end">{kind.startsWith('Σ')?'x':'k'}{i+1}</text>)}
    {Array.from({length:rows},(_,i)=>Array.from({length:columns},(_,j)=>{
      const covariance=kind.startsWith('Σ'), independent=!covariance||j>=i, symbol=covariance?`s${Math.min(i,j)+1}${Math.max(i,j)+1}`:`μ${i+1}${j+1}`;
      return <g key={`${i}${j}`}><rect x={x+j*cell} y={y+44+i*cell} width={cell} height={cell} fill={independent?'none':C.reference} fillOpacity=".13" stroke={colour} strokeDasharray={independent?undefined:'3 4'}/><text x={x+(j+.5)*cell} y={y+79+i*cell} textAnchor="middle" fill={independent?colour:C.reference}>{symbol}</text></g>;
    }))}
  </g>;
}
export function GaussianParameterCounts() {
  const [K,setK]=useState(3),[d,setD]=useState(2),[family,setFamily]=useState('full'),[reset,setReset]=useState(0),r=covarianceParameterCount(K,d,family);
  const groups=family==='tied'?1:K, covHeight=family==='full'||family==='tied'?d*58+120:170;
  const drawingWidth=Math.max(650,d*58+120,K*90+80), groupWidth=family==='spherical'?300:d*58+55, perRow=Math.max(1,Math.floor((drawingWidth-80)/groupWidth)), groupRows=Math.ceil(groups/perRow);
  return <FlowLab id="gmm-parameter-counts" label="D40 independent parameter cells">
    <GaussianDrawing id="D40" title="Weights, mean coordinates and independent covariance values" width={drawingWidth} height={230+K*58+120+groupRows*covHeight+80}
      description={`${K} components and ${d} coordinates. ${r.weights} free weights after one sum constraint, ${r.means} means, ${r.covariance} covariance values; total ${r.total}. Solid covariance cells are independently adjustable; dashed mirrored cells reuse the same symbol.`}>
      <text x="30" y="28">K = {K} · d = {d} · {family}</text>
      {Array.from({length:K},(_,k)=><g key={k}><rect x={40+k*90} y="62" width="80" height="42" fill="none" stroke={C.sum}/><text x={80+k*90} y="89" textAnchor="middle">π{k+1}</text></g>)}
      <path d={`M40,118 v10 H${40+K*90-10} v-10`} stroke={C.sum} fill="none"/><text x="40" y="156">Σ π = 1 → {r.weights} free weight{r.weights===1?'':'s'}</text>
      <ParameterGrid rows={K} columns={d} x={40} y={207} kind="Mean matrix · K×d"/>
      <text x="40" y={207+K*58+84}>Mean coordinates: {r.means}</text>
      {Array.from({length:groups},(_,k)=>{
        const y=207+K*58+160+Math.floor(k/perRow)*covHeight,x=40+(k%perRow)*groupWidth,colour=hues[k%hues.length];
        if(family==='full'||family==='tied')return <g key={k}><ParameterGrid rows={d} columns={d} x={x} y={y} kind={family==='tied'?'Σ shared by every component':`Σ component ${k+1}`} colour={colour}/></g>;
        if(family==='diag')return <g key={k}><text x={x} y={y}>Component {k+1} · diagonal</text>{Array.from({length:d},(_,j)=><g key={j}><rect x={x+j*58} y={y+25} width="58" height="58" fill="none" stroke={colour}/><text x={x+29+j*58} y={y+60} textAnchor="middle">s{j+1}{j+1}</text></g>)}<text x={x} y={y+113}>Cross cells 0</text></g>;
        return <g key={k}><text x={x} y={y}>Component {k+1}: one variance</text><rect x={x} y={y+25} width="58" height="58" fill="none" stroke={colour}/><text x={x+29} y={y+60} textAnchor="middle">v{k+1}</text><text x={x+90} y={y+60}>× I{d} · equal spread</text></g>;
      })}
      <text x="40" y={230+K*58+120+groupRows*covHeight+45}>Free total: {r.weights} + {r.means} + {r.covariance} = {r.total}</text>
    </GaussianDrawing>
    <FlowControls key={reset}><GaussianQuantity name="Components K" value={K} onChange={setK} min={1} max={5} step={1} validate={v=>Number.isInteger(v)?null:'Use an integer component count.'}/><GaussianQuantity name="Coordinates d" value={d} onChange={setD} min={1} max={5} step={1} validate={v=>Number.isInteger(v)?null:'Use an integer coordinate count.'}/><FlowChoice label="Counted covariance family" options={familyOptions} value={family} onChange={setFamily}/><button type="button" onClick={()=>{setK(3);setD(2);setFamily('full');setReset(reset+1);}}>Reset</button></FlowControls>
    <FlowReadout data-count-total={r.total}>{r.weights} + {r.means} + {r.covariance} = <strong>{r.total}</strong> independent values. Mirrored cross cells repeat the same value; K=1 has zero free weights.</FlowReadout>
    <GaussianTableRegion><table><caption>All four families for the current K and d</caption><thead><tr><th>family</th><th>weights</th><th>means</th><th>covariance</th><th>total</th></tr></thead><tbody>{covarianceFamilies.map(f=>{const s=covarianceParameterCount(K,d,f);return <tr key={f}><th>{f}</th><td>{s.weights}</td><td>{s.means}</td><td>{s.covariance}</td><td>{s.total}</td></tr>;})}</tbody></table></GaussianTableRegion>
    <p>For K=2,d=3, tied and diagonal both have 13 free values but admit different shapes: a shared full matrix can have cross entry .5; separate diagonal matrices can have diagonals (1,2,3)/(3,2,1). Equal counts do not identify the same family.</p>
  </FlowLab>;
}

export function GaussianDiagonalDependence() {
  const r=diagonalMixtureMoments();
  return <FlowLab id="gmm-diagonal-dependence" label="D41 within and between covariance produce dependence">
    <GaussianDrawing id="D41-geometry" title="Diagonal components and a separate aggregate moment ellipse" width={700} adaptive height={w=>(w-90)+275} description="Identity circles at minus two/minus two and two/two. Arrows are mean offsets from aggregate mean zero. Dotted amber ellipse has covariance [[5,4],[4,5]]: a moment-matching Gaussian, not the mixture's exact isodensity contour.">
      {w=><><Plane width={w} means={r.means} covariances={[r.within,r.within]} total={r.total} offsets domain={[-4,4,-4,4]}/><text x="20" y={(w-90)+184} fill={C.sum}>Dotted amber: matched moments</text><text x="20" y={(w-90)+213} fill={C.sum}>under a Gaussian</text><text x="20" y={(w-90)+246}>Not an exact mixture contour</text></>}
    </GaussianDrawing>
    {r.offsets.map((o,k)=><GaussianDrawing key={k} id={`D41-offset-${k}`} title={`${k?'Right':'Left'} mean offset outer product`} width={640} adaptive height={310} description={`Offset ${pair(o)} forms outer product [[4,4],[4,4]], multiplied by .5. Both components have identity within covariance.`}>
      {w=><><text x="20" y="28" fill={componentHues[k]}>{k?'Right':'Left'} offset Δμ = {pair(o)}</text><text x="20" y="63">Δμ Δμᵀ · each pair of coordinates</text><MatrixCells values={r.outers[k]} x={Math.max(25,w/2-110)} y="102" label="Outer product" colour={componentHues[k]}/><text x="20" y="280">Weight .5 → half of every outer cell</text></>}
    </GaussianDrawing>)}
    <GaussianDrawing id="D41-sum" title="Within plus between equals aggregate covariance" width={850} adaptive height={w=>w<800?600:245} description="Within identity plus mean-offset covariance [[4,4],[4,4]] equals [[5,4],[4,5]]. Cross covariance 4 is nonzero, so the coordinates are marginally dependent although independent conditional on each source.">
      {w=>{const s=w<800;return <><MatrixCells values={r.within} x="25" y="25" label="Within · I" cellWidth={105}/><text x={s?130:250} y={s?190:104} textAnchor="middle" fill={C.sum}>+</text><MatrixCells values={r.between} x={s?25:280} y={s?235:25} label="Between · Σ π Δμ Δμᵀ" cellWidth={105}/><text x={s?130:510} y={s?400:104} textAnchor="middle" fill={C.sum}>=</text><MatrixCells values={r.total} x={s?25:540} y={s?445:25} label="Total" colour={C.sum} cellWidth={105}/></>;}}
    </GaussianDrawing>
    <ExactMatrices label="Within / between / total" matrices={[r.within,r.between,r.total]} ids={['within','between','total']}/>
    <p>Each source gives independent coordinates, but the shared selector moves both coordinates together. Cross covariance 4 proves marginal dependence. Zero covariance alone would not prove independence; the linked PCA example covers that converse misconception.</p>
  </FlowLab>;
}

function Buffer({ x, y, rows, columns, label, colour=C.ink, cell=12, mark }) {
  return <g data-buffer-shape={`${rows}x${columns}`}><text x={x} y={y-12}>{label}</text>{Array.from({length:rows},(_,i)=>Array.from({length:columns},(_,j)=><rect key={`${i}-${j}`} x={x+j*cell} y={y+i*cell} width={cell} height={cell} stroke={colour} strokeOpacity=".7" fill={i<mark?colour:'none'} fillOpacity=".15"/>))}<text x={x} y={y+rows*cell+27}>{rows} × {columns}</text></g>;
}
export function GaussianTwoPassBuffers() {
  const [B,setB]=useState(8),[reset,setReset]=useState(0), rows=constructedBlockRows(), old=constructedBlockState(), r=twoPassCovarianceUpdate(rows,old,B);
  const empty=twoPassCovarianceUpdate(rows,{...old,weights:[.5,0,.5]},8);
  const bufferHeight=Math.max(64*8,B*10), first=r.passOne[0], second=r.passTwo[0];
  return <FlowLab id="gmm-two-pass-buffers" label="D42 frozen old state, two passes, bounded working buffers">
    <GaussianDrawing id="D42-buffers" title="Input rows and two working responsibility blocks" width={850} adaptive height={w=>w<720?bufferHeight+B*10+740:bufferHeight+640} description={`Constructed 64×2 grid input; old means (-2,0),(0,0),(2,0), identity covariances, equal thirds. Block B=${B}, responsibility buffer ${B}×3. Pass one accumulates counts and stable means; pass two recomputes from the same old state and accumulates new-centred scatter. Atomic update only after both full passes.`}>
      {w=>{const stacked=w<720,p1x=stacked?110:250,p1y=125,p2x=stacked?110:520,p2y=stacked?bufferHeight+350:125, commitY=stacked?bufferHeight+B*10+540:bufferHeight+390;return <>
        <text x="20" y="25">OLD θ₀ frozen through both passes</text><text x="20" y="56">K=3 · d=2 · equal weights · Σ=I</text>
        <MixtureArrow points={[[70,80],[p1x+15,80],[p1x+15,107]]} color={C.left}/>
        <MixtureArrow points={stacked?[[70,80],[w-25,80],[w-25,p2y-34],[p2x+15,p2y-34],[p2x+15,p2y-12]]:[[70,80],[p2x+15,80],[p2x+15,107]]} color={C.right}/>
        <Buffer x={20} y={125} rows={64} columns={2} cell={8} label="X input" colour={C.reference} mark={B}/>
        <Buffer x={p1x} y={p1y} rows={B} columns={3} cell={10} label="Pass 1 · r₀" colour={C.left}/>
        <MixtureArrow points={[[55,155],[p1x-14,155]]} color={C.reference}/><text x={p1x} y={p1y+B*10+58}>B×K shares</text>
        <text x={p1x} y={bufferHeight+220}>Σ r₀ → counts N</text><text x={p1x} y={bufferHeight+251}>local centres → merged μ′</text>
        <MixtureArrow points={[[p1x+18,p1y+B*10+78],[p1x+18,bufferHeight+185]]} color={C.left}/>
        <Buffer x={p2x} y={p2y} rows={B} columns={3} cell={10} label="Pass 2 · SAME r₀" colour={C.right}/>
        <text x={p2x} y={p2y+B*10+58}>recompute under θ₀</text>
        <MixtureArrow points={stacked?[[p1x,bufferHeight+280],[75,bufferHeight+280],[75,p2y-35],[p2x,p2y-35]]:[[p1x+180,bufferHeight+250],[p2x,bufferHeight+250]]}/>
        <text x={p2x} y={stacked?p2y+B*10+113:bufferHeight+310}>r₀ × (x−μ′)(x−μ′)ᵀ</text>
        <text x="20" y={commitY}>Both passes complete → θ₁ together</text>
        <MixtureArrow points={[[p2x+16,stacked?p2y+B*10+140:bufferHeight+340],[p2x+16,commitY-35],[75,commitY-35],[75,commitY-8]]} color={C.sum}/>
        <text x="20" y={commitY+40}>Input: 64×2 = 128 scalar values</text><text x="20" y={commitY+71}>Working block: B(d+K) = {B*5}</text><text x="20" y={commitY+102}>State: Kd²+Kd+K = 21</text><text x="20" y={commitY+133}>Working total: {r.storage.working} scalars</text><text x="20" y={commitY+165}>No n×K×d residual array</text>
      </>;}}
    </GaussianDrawing>
    <FlowControls key={reset}><GaussianQuantity name="Block rows B" value={B} onChange={setB} min={1} max={64} step={1} validate={v=>Number.isInteger(v)?null:'Use an integer block size.'}/><button type="button" onClick={()=>{setB(8);setReset(reset+1);}}>Reset</button></FlowControls>
    <FlowReadout data-block-size={B}>{r.passOne.length} blocks in each pass. Old θ₀ stays fixed while both passes produce one update. Working storage {r.storage.working} scalar slots excludes X and the requested inspection tables below. These shape counts are not measured memory or timing.</FlowReadout>
    <div className="gmm-family-table-region" role="region" tabIndex={0} aria-label="First block, same old-state responsibilities in both passes"><table><caption>First block operands: recomputed shares match pass 1 exactly</caption><thead><tr><th>observed ID</th><th>(x₁,x₂)</th>{old.ids.map(id=><th key={id}>{id} r₀</th>)}<th>pass 2 difference</th></tr></thead><tbody>{first.rows.map((row,i)=><tr key={row.id}><th>{row.id}</th><td>{pair(row.point)}</td>{row.shares.map((v,k)=><td key={k}>{exact(v)}</td>)}<td>{exact(Math.max(...row.shares.map((v,k)=>Math.abs(v-second.rows[i].shares[k]))))}</td></tr>)}</tbody></table></div>
    <GaussianTableRegion><table><caption>Full pass 1 accumulator after all 64 observed rows</caption><thead><tr><th>component ID</th><th>effective N</th><th>new μ′</th><th>new weight N/64</th></tr></thead><tbody>{old.ids.map((id,k)=><tr key={id}><th>{id}</th><td>{exact(r.counts[k])}</td><td>{pair(r.means[k])}</td><td>{exact(r.updated.weights[k])}</td></tr>)}</tbody></table></GaussianTableRegion>
    <ExactMatrices label="Full pass 2 scatter numerator" matrices={r.scatters} ids={old.ids}/><ExactMatrices label="Atomic new covariance · divide by N then +.05 I" matrices={r.updated.covariances} ids={old.ids}/>
    <p>The first pass merges count c/centre m with block count b/centre u using m ← m + b/(c+b)(u−m). The second pass uses the resulting means but still evaluates θ₀. A zero-mass block changes nothing; N ≤ 10⁻¹²n refuses that component and preserves the old state. No unrecorded reseed is inserted.</p>
    <GaussianTableRegion><table><caption>Separate empty-mass witness · fixed inference weights .5/0/.5</caption><thead><tr><th>component ID</th><th>effective N</th><th>next state</th></tr></thead><tbody>{old.ids.map((id,k)=><tr key={id}><th>{id}</th><td>{exact(empty.counts[k])}</td><td>{k===1?'Unidentified mean; no division by zero':'Old state retained'}</td></tr>)}</tbody></table></GaussianTableRegion>
    <FlowReadout data-empty-refusal="Middle">{empty.reason} This separately supplied inference state is outside the positive-active-weight fitting-start domain.</FlowReadout>
    <p>Full work is O(nKd²+Kd³). Diagonal and spherical dispatch through coordinate variances with O(nKd+Kd) work. Tied scoring can whiten once in O(nd²+nKd+d³); the transparent centred tied M step still uses O(nKd²). These are algorithmic costs.</p>
    <details><summary>All 64 declared constructed input rows</summary><GaussianTableRegion><table><caption>8×8 coordinate grid, original ID order</caption><thead><tr><th>ID</th><th>x₁</th><th>x₂</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><th>{row.id}</th><td>{row.point[0]}</td><td>{row.point[1]}</td></tr>)}</tbody></table></GaussianTableRegion></details>
  </FlowLab>;
}
