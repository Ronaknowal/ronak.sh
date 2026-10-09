import { useEffect, useId, useRef, useState } from 'react';
import { inspectionRows, leafRegions, forestReport, growTree, treePrediction } from '../../data/decision-tree-models.js';
import { flowNumber } from './LessonFlow.jsx';
import './decision-tree-flow.css';

export const treeColors = {
  input: '#67cbd9',
  parameter: '#efbb53',
  computed: '#bb9aec',
  target: '#eeeae3',
  wire: '#969b9f',
};
const number = (value, digits = 3) => flowNumber(value, digits);

export function TreeLabel({ x, y, children, role = 'target', anchor = 'middle' }) {
  return <text x={x} y={y} textAnchor={anchor} fill={treeColors[role]}
    stroke="#050505" strokeWidth={5} paintOrder="stroke fill">{children}</text>;
}

export function TreeWire({ points, selected = false }) {
  const end = points.at(-1);
  const before = points.at(-2);
  const angle = Math.atan2(end[1] - before[1], end[0] - before[0]);
  const sides = [-1, 1].map(sign => [
    end[0] - 8 * Math.cos(angle) + sign * 4 * Math.sin(angle),
    end[1] - 8 * Math.sin(angle) - sign * 4 * Math.cos(angle),
  ]);
  return <g fill="none" stroke={selected ? treeColors.target : treeColors.wire} strokeWidth={selected ? 3 : 1.5}>
    <polyline points={points.map(point => point.join(',')).join(' ')} />
    <polyline points={[sides[0], end, sides[1]].map(point => point.join(',')).join(' ')} />
  </g>;
}

export function TreeOperation({ x, y, children, radius = 24 }) {
  return <g>
    <circle cx={x} cy={y} r={radius} fill="#050505" stroke={treeColors.target} />
    <TreeLabel x={x} y={y + 6}>{children}</TreeLabel>
  </g>;
}

export function TreeValue({ x, y, children, role = 'computed', width = 94 }) {
  return <g>
    <rect x={x - width / 2} y={y - 23} width={width} height={46} fill="#050505" stroke={treeColors[role]} />
    <TreeLabel x={x} y={y + 6} role={role}>{children}</TreeLabel>
  </g>;
}

export function TreeDrawing({ name, description, width = 320, height, children, caption }) {
  const titleId = useId();
  const surface = useRef(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const measure = () => setOverflow(surface.current.scrollWidth > surface.current.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(surface.current);
    measure();
    return () => observer.disconnect();
  }, []);
  return <figure className="decision-tree-drawing" data-figure={name}>
    {overflow && <p className="decision-tree-pan-cue">Scroll sideways to follow the complete drawing →</p>}
    <div ref={surface} className="decision-tree-surface" tabIndex={0} role="region" aria-label={`${description}; pan when the drawing is wider than this column`}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: `${width / 16}rem` }} role="img" aria-labelledby={titleId}>
        <title id={titleId}>{description}</title>
        {children}
      </svg>
    </div>
    {caption && <figcaption>{caption}</figcaption>}
  </figure>;
}

function treeLayout(tree) {
  const positions = new Map();
  let leaves = 0;
  let depth = 0;
  function visit(node) {
    depth = Math.max(depth, node.depth);
    const left = node.left ? visit(node.left) : 105 + 210 * leaves++;
    const right = node.right ? visit(node.right) : left;
    const position = { x: (left + right) / 2, y: 62 + 188 * node.depth };
    positions.set(node.path, position);
    return position.x;
  }
  visit(tree);
  return { positions, width: Math.max(320, leaves * 210), height: 158 + depth * 188 };
}

export function BranchingTreeDrawing({ tree = growTree(inspectionRows, { maxDepth: 2 }), selectedPath = '', name = 'tree-branching-object' }) {
  const layout = treeLayout(tree);
  const nodes = [];
  const edges = [];
  function visit(node) {
    const { x, y } = layout.positions.get(node.path);
    if (node.left) {
      for (const [child, direction] of [[node.left, 'yes: ≤'], [node.right, 'no: >']]) {
        const next = layout.positions.get(child.path);
        edges.push(<g key={child.path}>
          <TreeWire points={[[x, y + 41], [x, y + 85], [next.x, y + 85], [next.x, next.y - 41]]} selected={selectedPath.startsWith(child.path)} />
          <TreeLabel x={(x + next.x) / 2} y={y + 111}>{direction}</TreeLabel>
        </g>);
        visit(child);
      }
    }
    nodes.push(<g key={node.path}>
      <rect x={x - 91} y={y - 41} width={182} height={82} fill="#050505"
        stroke={selectedPath === node.path ? treeColors.target : treeColors[node.left ? 'parameter' : 'computed']}
        strokeWidth={selectedPath === node.path ? 3 : 1.5} />
      <TreeLabel x={x} y={y - 13} role={node.left ? 'parameter' : 'computed'}>
        {node.left ? `x${node.feature + 1} ≤ ${number(node.threshold)}?` : `p(1) = ${number(node.probability)}`}
      </TreeLabel>
      <TreeLabel x={x} y={y + 14}>{node.count} rows{node.left ? '' : `; class ${node.label}`}</TreeLabel>
      {!node.left && <TreeLabel x={x} y={y + 35} role="computed">[0,1]: [{number(1-node.probability)}, {number(node.probability)}]</TreeLabel>}
      <TreeLabel x={x} y={y + 66}>{node.rows.join(' ')}</TreeLabel>
    </g>);
  }
  visit(tree);
  return <TreeDrawing name={name} width={layout.width} height={layout.height}
    description="Saved questions form a branching tree; yes and no routes end in counted leaf answers"
    caption={`Amber nodes are learned questions. Violet leaves contain counted answers. Each branch states its condition; equality follows yes. Row IDs name the observations reaching each node.${selectedPath ? ' The white route and leaf follow the current query.' : ''}`}>
    {edges}{nodes}
  </TreeDrawing>;
}

export function FitRouteDrawing() {
  return <TreeDrawing name="tree-fit-versus-route" height={480} description="Training labels determine saved questions and leaf frequencies; a new query reads that saved state">
    <TreeWire points={[[80,80],[80,134],[160,134],[160,181]]} />
    <TreeWire points={[[240,80],[240,134],[160,134],[160,181]]} />
    <TreeWire points={[[160,229],[160,280]]} />
    <TreeWire points={[[52,326],[112,326]]} />
    <TreeWire points={[[208,326],[265,326],[265,379],[160,379],[160,414]]} />
    <TreeValue x={80} y={57} role="input">X: 8 × 2</TreeValue>
    <TreeValue x={240} y={57} role="target">y: 8 labels</TreeValue>
    <TreeOperation x={160} y={205} radius={42}>fit</TreeOperation>
    <TreeValue x={160} y={326} role="parameter">saved tree</TreeValue>
    <TreeLabel x={46} y={300} role="input">new x</TreeLabel>
    <TreeLabel x={160} y={445} role="computed">leaf [p(0), p(1)] → class</TreeLabel>
    <TreeLabel x={160} y={475}>new y enters later evaluation</TreeLabel>
  </TreeDrawing>;
}

export function GiniPairDrawing() {
  const labels = [0,0,0,1];
  return <TreeDrawing name="tree-gini-pairs" height={365} description="Four labels with replacement give sixteen ordered pairs; six disagree">
    <TreeLabel x={180} y={25}>Second draw →</TreeLabel>
    {labels.map((value, i) => <TreeLabel key={i} x={101+i*53} y={61}>{String.fromCharCode(65+i)}: {value}</TreeLabel>)}
    {labels.map((first,i) => <g key={i}>
      <TreeLabel x={36} y={108+i*53}>{String.fromCharCode(65+i)}: {first}</TreeLabel>
      {labels.map((second,j) => <g key={j}>
        <rect x={77+j*53} y={78+i*53} width={48} height={48} fill={first===second?'#111':'#40354e'} stroke={treeColors.wire} />
        <TreeLabel x={101+j*53} y={108+i*53} role="computed">{first===second?'=':'≠'}</TreeLabel>
      </g>)}
    </g>)}
    <TreeLabel x={160} y={324} role="computed">6 / 16 = 0.375</TreeLabel>
    <TreeLabel x={160} y={355}>First draw is the row ↓</TreeLabel>
  </TreeDrawing>;
}

export function PrefixScanDrawing() {
  return <TreeDrawing name="tree-prefix-counts" height={445} description="A sorted four-row array transfers one row at each distinct boundary; left and right counts always sum to the parent">
    {[1,2,3].map((cut, row) => <g key={cut}>
      {[0,0,1,1].map((label,index) => <g key={index}>
        <TreeValue x={44+index*77} y={50+row*125} width={68} role={index<cut?'computed':'input'}>{String.fromCharCode(65+index)}: {label}</TreeValue>
        <TreeLabel x={44+index*77} y={19+row*125}>x={index+1}</TreeLabel>
      </g>)}
      <line x1={82+(cut-1)*77} x2={82+(cut-1)*77} y1={25+row*125} y2={77+row*125} stroke={treeColors.parameter} strokeWidth={3} />
      <TreeLabel x={160} y={104+row*125} role="computed">L [{Math.min(cut,2)}, {Math.max(cut-2,0)}] + R [{Math.max(2-cut,0)}, {Math.min(4-cut,2)}]</TreeLabel>
    </g>)}
    <TreeLabel x={160} y={428}>Parent counts [2, 2]; class order [0,1]</TreeLabel>
  </TreeDrawing>;
}

export function EntropyLossDrawing() {
  const p = [.75,.25];
  return <TreeDrawing name="tree-proper-losses" height={360} description="Class frequencies weight the surprise of their own class and add to the average surprise">
    {p.map((mass,i) => <g key={i}>
      <rect x={48} y={48+i*118} width={mass*224} height={28} fill={treeColors.computed} />
      <TreeLabel x={160} y={35+i*118}>class {i}: frequency {mass}</TreeLabel>
      <TreeLabel x={160} y={108+i*118}>−log₂({mass}) = {number(-Math.log2(mass))} bits</TreeLabel>
      <TreeLabel x={160} y={135+i*118} role="computed">contribution {number(-mass*Math.log2(mass))}</TreeLabel>
    </g>)}
    <TreeLabel x={160} y={303} role="computed">average surprise = 0.811278 bits</TreeLabel>
  </TreeDrawing>;
}

export function BrierResidualDrawing() {
  return <TreeDrawing name="tree-brier-indicator-residuals" width={470} height={355} description="Two class-indicator coordinates compare observed values with the same leaf probability vector; residual segments square and add">
    {[{title:'class 0: [1,0]',values:[1,0],x:118},{title:'class 1: [0,1]',values:[0,1],x:353}].map(caseData=><g key={caseData.title}>
      <TreeLabel x={caseData.x} y={27}>{caseData.title}</TreeLabel>
      {caseData.values.map((observed,i)=>{
        const x=caseData.x-50+i*100, predicted=[.75,.25][i], y=value=>230-160*value;
        return <g key={i}><line x1={x} x2={x} y1={y(observed)} y2={y(predicted)} stroke={treeColors.computed} strokeWidth={3}/><circle cx={x} cy={y(observed)} r={6} fill={treeColors.target}/><rect x={x-7} y={y(predicted)-4} width={14} height={8} fill={treeColors.computed}/><TreeLabel x={x} y={263}>p({i})={predicted}</TreeLabel><TreeLabel x={x} y={y(observed)-17}>y={observed}</TreeLabel></g>;
      })}
      <TreeLabel x={caseData.x} y={315} role="computed">squared sum {caseData.values[0]===1?'.125':'1.125'}</TreeLabel>
    </g>)}
    <TreeLabel x={235} y={351}>White: observed; violet: predicted and residual</TreeLabel>
  </TreeDrawing>;
}

export function ThresholdTransformDrawing() {
  const lanes = [{y:90,max:2,t:1,q:1.2,label:'raw x'}, {y:255,max:4,t:2,q:1.44,label:'squared x²'}];
  return <TreeDrawing name="tree-midpoint-transform" height={365} description="Raw and squared axes keep their own fixed units; the same query changes side of a recomputed midpoint">
    {lanes.map(lane => <g key={lane.label}>
      <TreeLabel x={160} y={lane.y-53} role="input">{lane.label}</TreeLabel>
      <line x1={40} x2={280} y1={lane.y} y2={lane.y} stroke={treeColors.wire} />
      {[0,lane.max].map(value => <g key={value}><circle cx={40+240*value/lane.max} cy={lane.y} r={6} fill={treeColors.target} /><TreeLabel x={40+240*value/lane.max} y={lane.y+32}>{value}</TreeLabel></g>)}
      <line x1={160} x2={160} y1={lane.y-22} y2={lane.y+22} stroke={treeColors.parameter} strokeWidth={3} />
      <TreeLabel x={160} y={lane.y+62} role="parameter">midpoint {lane.t}</TreeLabel>
      <path d={`M${40+240*lane.q/lane.max},${lane.y-9}l9,9l-9,9l-9,-9Z`} fill={treeColors.input} />
      <TreeLabel x={40+240*lane.q/lane.max} y={lane.y-28} role="input">{lane.q}</TreeLabel>
    </g>)}
    <TreeLabel x={160} y={358}>Raw query right; squared query left</TreeLabel>
  </TreeDrawing>;
}

export function PerNodeFeatureDrawing() {
  const tree = forestReport().members[1].tree;
  return <TreeDrawing name="tree-fresh-per-node-features" width={470} height={365} description="Actual tiny member two receives a fresh feature choice at its root and again at its left child">
    <TreeWire points={[[90,112],[90,177],[160,177],[160,239]]} />
    <TreeWire points={[[328,76],[186,76]]} />
    <TreeWire points={[[328,278],[256,278]]} />
    <TreeValue x={90} y={76} width={182} role="parameter">x{tree.feature+1} ≤ {number(tree.threshold)}?</TreeValue>
    <TreeValue x={160} y={278} width={182} role="parameter">x{tree.left.feature+1} ≤ {number(tree.left.threshold)}?</TreeValue>
    <TreeValue x={392} y={76} width={124} role="input">sample: x₂</TreeValue>
    <TreeValue x={392} y={278} width={124} role="input">sample: x₁</TreeValue>
    <TreeLabel x={90} y={143}>root</TreeLabel>
    <TreeLabel x={160} y={338}>left child: a new random choice</TreeLabel>
  </TreeDrawing>;
}

export function ProbabilityMeanDrawing({ probabilities, name = 'tree-member-probability-mean', votes = false }) {
  const mean = probabilities.reduce((sum,p)=>sum+p,0)/probabilities.length;
  const hard = probabilities.filter(p=>p>.5).length;
  return <TreeDrawing name={name} width={Math.max(320,probabilities.length*110)} height={votes?475:350} description="Each member's positive probability enters addition, then division by member count">
    {probabilities.map((p,i) => <g key={i}>
      <TreeWire points={[[55+i*110,92],[55+i*110,138],[165,138],[165,177]]} />
      <TreeValue x={55+i*110} y={69} width={90}>{number(p)}</TreeValue>
      <TreeLabel x={55+i*110} y={32}>member {i+1}</TreeLabel>
    </g>)}
    <TreeWire points={[[165,225],[165,257]]} />
    <TreeOperation x={165} y={201}>Σ</TreeOperation>
    <TreeValue x={165} y={280} width={170}>{number(mean)} = sum/{probabilities.length}</TreeValue>
    <TreeLabel x={165} y={335} role="computed">mean decides class {Number(mean>.5)}</TreeLabel>
    {votes && <><TreeLabel x={165} y={392}>hard votes: {probabilities.map(p=>Number(p>.5)).join(', ')}</TreeLabel><TreeLabel x={165} y={431}>positive count {hard}/{probabilities.length}</TreeLabel><TreeLabel x={165} y={465} role="computed">hard majority class {Number(hard>probabilities.length/2)}</TreeLabel></>}
  </TreeDrawing>;
}

export function OobMaskDrawing({ forest }) {
  const eligible = forest.members.filter(member=>member.omitted);
  return <TreeDrawing name="tree-oob-mask" width={Math.max(320,forest.members.length*100)} height={400} description={`Row ${forest.query.id}'s absence enables only omitted members to enter its OOB sum`}>
    {forest.members.map((member,i) => <g key={i}>
      <TreeLabel x={50+i*100} y={31}>member {i+1}</TreeLabel>
      <TreeValue x={50+i*100} y={82} width={86} role="input">{forest.query.id}: {member.omitted?'absent':'in fit'}</TreeValue>
      <TreeLabel x={50+i*100} y={151}>{member.omitted?'include':'exclude'}</TreeLabel>
      <TreeValue x={50+i*100} y={199} width={86}>{number(member.prediction.probability)}</TreeValue>
      {member.omitted && <TreeWire points={[[50+i*100,222],[50+i*100,258],[160,258],[160,290]]} />}
    </g>)}
    {eligible.length ? <><TreeOperation x={160} y={314}>Σ</TreeOperation><TreeLabel x={160} y={377} role="computed">sum/{eligible.length} = {number(forest.oobProbability)}</TreeLabel></> : <TreeLabel x={160} y={336}>No eligible member: unavailable</TreeLabel>}
  </TreeDrawing>;
}

export function CovarianceDrawing({ correlation, members }) {
  return <TreeDrawing name="tree-covariance-terms" height={370} description="A three-by-three cutaway identifies diagonal variances and off-diagonal covariances before general counting">
    <TreeLabel x={160} y={27}>3 × 3 cutaway of the B × B sum</TreeLabel>
    {[0,1,2].map(i=>[0,1,2].map(j=><g key={`${i}-${j}`}><rect x={63+j*67} y={53+i*67} width={62} height={62} fill={i===j?'#40354e':'#111'} stroke={treeColors.wire}/><TreeLabel x={94+j*67} y={91+i*67} role="computed">{i===j?'1':number(correlation)}</TreeLabel></g>))}
    <TreeLabel x={160} y={297}>B diagonal terms: {members} × 1</TreeLabel>
    <TreeLabel x={160} y={329}>B(B−1) other terms: {members*(members-1)} × {number(correlation)}</TreeLabel>
    <TreeLabel x={160} y={362} role="computed">divide their sum by B²</TreeLabel>
  </TreeDrawing>;
}

export function LeafWeightDrawing({ duplicate = false }) {
  const counts = duplicate ? [[2,1,0],[0,0,1]] : [[1,1,0],[0,1,1]];
  const weights = duplicate ? [1/3,1/6,1/2] : [1/4,1/2,1/4];
  return <TreeDrawing name={duplicate?'tree-bootstrap-leaf-weights':'tree-normalized-leaf-weights'} width={420} height={480} description="Occurrence counts normalize inside each query leaf, then equal member averaging produces weights on original target rows">
    {counts.map((member,i)=><g key={i}>
      <TreeLabel x={108+i*202} y={29}>member {i+1} query leaf</TreeLabel>
      {member.map((count,j)=><g key={j}><TreeValue x={47+j*62+i*202} y={78} width={54} role="input">{count}</TreeValue><TreeLabel x={47+j*62+i*202} y={124}>{String.fromCharCode(65+j)}</TreeLabel></g>)}
      <TreeLabel x={108+i*202} y={175}>divide by {member.reduce((a,b)=>a+b,0)} occurrences</TreeLabel>
      <TreeWire points={[[108+i*202,194],[108+i*202,224],[210,224],[210,253]]}/>
    </g>)}
    <TreeOperation x={210} y={277}>÷2</TreeOperation>
    {weights.map((w,i)=><g key={i}><TreeValue x={70+i*140} y={353} width={112}>{number(w)}</TreeValue><TreeLabel x={70+i*140} y={400}>target {[1,2,5][i]}</TreeLabel></g>)}
    <TreeLabel x={210} y={450} role="computed">weighted sum = {duplicate?'19/6 = 3.166667':'2.5'}</TreeLabel>
  </TreeDrawing>;
}

export function ProximityDrawing() {
  const vectors = [[1,0,1,0],[1,0,0,1],[0,1,0,1]];
  const gram = [[1,.5,0],[.5,1,.5],[0,.5,1]];
  return <TreeDrawing name="tree-leaf-one-hot-proximity" width={440} height={460} description="One-hot slots for two different trees yield dot products and a symmetric shared-leaf Gram matrix">
    <TreeLabel x={225} y={27}>tree 1 slots | tree 2 slots</TreeLabel>
    {vectors.map((row,i)=><g key={i}><TreeLabel x={29} y={80+i*60}>{String.fromCharCode(65+i)}</TreeLabel>{row.map((v,j)=><g key={j}><rect x={75+j*78} y={47+i*60} width={58} height={46} fill={v?'#40354e':'#111'} stroke={treeColors.wire}/><TreeLabel x={104+j*78} y={77+i*60} role="computed">{v}</TreeLabel></g>)}</g>)}
    <TreeLabel x={220} y={254}>dot product / 2 → shared-leaf fraction</TreeLabel>
    {gram.map((row,i)=>row.map((v,j)=><g key={`${i}-${j}`}><rect x={130+j*62} y={283+i*53} width={57} height={48} fill={`rgba(230,230,230,${.05+v*.17})`} stroke={treeColors.wire}/><TreeLabel x={158+j*62} y={313+i*53}>{v}</TreeLabel></g>))}
    {['A','B','C'].map((id,i)=><g key={id}><TreeLabel x={158+i*62} y={278}>{id}</TreeLabel><TreeLabel x={111} y={313+i*53}>{id}</TreeLabel></g>)}
  </TreeDrawing>;
}

export function WeakestLinkDrawing() {
  const tree=growTree(); const positions=new Map(); let leaves=0;
  function summary(node) {
    const collapsed=node.count/8*node.impurity;
    if(!node.left){const result={x:105+210*leaves++,y:70+228*node.depth,risk:collapsed,leaves:1,collapsed};positions.set(node.path,result);return result;}
    const left=summary(node.left),right=summary(node.right);
    const result={x:(left.x+right.x)/2,y:70+228*node.depth,risk:left.risk+right.risk,leaves:left.leaves+right.leaves,collapsed};
    result.alpha=(result.collapsed-result.risk)/(result.leaves-1);positions.set(node.path,result);return result;
  }
  summary(tree);const wires=[],nodes=[];
  function visit(node){
    const s=positions.get(node.path);
    if(node.left)for(const child of [node.left,node.right]){const next=positions.get(child.path);wires.push(<TreeWire key={child.path} points={[[s.x,s.y+61],[s.x,s.y+102],[next.x,s.y+102],[next.x,next.y-61]]}/>);visit(child);}
    nodes.push(<g key={node.path}><rect x={s.x-96} y={s.y-61} width={192} height={122} fill="#050505" stroke={treeColors[node.left?'parameter':'computed']}/><TreeLabel x={s.x} y={s.y-35}>{node.left?`x${node.feature+1} ≤ ${node.threshold}`:node.rows.join(',')}</TreeLabel><TreeLabel x={s.x} y={s.y-7} role="computed">collapse R={number(s.collapsed)}</TreeLabel><TreeLabel x={s.x} y={s.y+20} role="computed">keep R={number(s.risk)}; L={s.leaves}</TreeLabel><TreeLabel x={s.x} y={s.y+47} role="computed">{node.left?`α=${number(s.alpha)}`:'terminal leaf'}</TreeLabel></g>);
  }
  visit(tree);
  return <TreeDrawing name="tree-postorder-weakest-link" width={leaves*210} height={850} description="Each actual branch's postorder descendant risk and leaf count feed its effective alpha; root has the smallest value" caption="Read from leaves upward. R is normalized to the original eight-row root. Every internal alpha is (collapse risk − keep risk)/(leaves − 1). The root's 15/128 wins before any child collapse, so the path jumps directly to one leaf.">
    {wires}{nodes}
  </TreeDrawing>;
}

export function TreeRegionDrawing({ tree, query = [4, 3], rows = inspectionRows, bounds = [0, 6, 0, 4], name = 'tree-query-regions' }) {
  const x = value => 46 + 244 * (value - bounds[0]) / (bounds[1] - bounds[0]);
  const y = value => 280 - 230 * (value - bounds[2]) / (bounds[3] - bounds[2]);
  const result = treePrediction(tree, query);
  return <TreeDrawing name={name} height={390} description="The same saved tree divides measurement space into leaf rectangles; the diamond is the supplied query"
    caption="White circles are observed class 0; white squares are observed class 1. The cyan diamond is the new query, outlined white. Rectangle boundaries are saved questions; their fill intensity reflects the computed positive frequency, not a class or parameter color.">
    {leafRegions(tree, bounds).map(leaf => <rect key={leaf.path}
      x={x(leaf.bounds[0])} y={y(leaf.bounds[3])} width={x(leaf.bounds[1]) - x(leaf.bounds[0])} height={y(leaf.bounds[2]) - y(leaf.bounds[3])}
      fill={`rgba(230,230,230,${0.03 + 0.16 * leaf.probability})`} stroke={leaf.path === result.leafPath ? treeColors.target : treeColors.parameter}
      strokeWidth={leaf.path === result.leafPath ? 3 : 1} />)}
    <TreeLabel x={170} y={27} role="input">Measurement x₂ ↑</TreeLabel>
    <TreeLabel x={170} y={342} role="input">Measurement x₁ →</TreeLabel>
    {[bounds[0], (bounds[0] + bounds[1]) / 2, bounds[1]].map(tick => <TreeLabel key={tick} x={x(tick)} y={306}>{number(tick)}</TreeLabel>)}
    {[bounds[2], (bounds[2] + bounds[3]) / 2, bounds[3]].map(tick => <TreeLabel key={tick} x={27} y={y(tick) + 6}>{number(tick)}</TreeLabel>)}
    {rows.map(row => <g key={row.id}>
      {row.label ? <rect x={x(row.features[0]) - 5} y={y(row.features[1]) - 5} width={10} height={10} fill={treeColors.target} />
        : <circle cx={x(row.features[0])} cy={y(row.features[1])} r={5} fill={treeColors.target} />}
      <TreeLabel x={x(row.features[0])} y={y(row.features[1]) - 16}>{row.id}</TreeLabel>
    </g>)}
    <path d={`M${x(query[0])},${y(query[1]) - 10}l10,10l-10,10l-10,-10Z`} fill="none" stroke={treeColors.target} strokeWidth={5} />
    <path d={`M${x(query[0])},${y(query[1]) - 10}l10,10l-10,10l-10,-10Z`} fill="none" stroke={treeColors.input} strokeWidth={3} />
    <TreeLabel x={170} y={377} role="input">Query ({number(query[0])}, {number(query[1])})</TreeLabel>
  </TreeDrawing>;
}

export function SplitOperandDrawing({ candidate }) {
  const sides = [[candidate.left, candidate.leftImpurity, 76], [candidate.right, candidate.rightImpurity, 244]];
  return <TreeDrawing name="tree-split-operands" height={810} description="Both child counts multiply their impurities; the sum is subtracted from parent impurity"
    caption="The two child weights sum to one. Violet values are computed; the amber question determines which original row IDs enter each child. Both multiplication inputs are drawn separately.">
    <TreeWire points={[[160, 63], [160, 94], [76, 94], [76, 117]]} />
    <TreeWire points={[[160, 63], [160, 94], [244, 94], [244, 117]]} />
    {sides.map(([rows, score, center]) => <g key={center}>
      <TreeWire points={[[center - 33, 373], [center - 33, 403], [center - 21, 419]]} />
      <TreeWire points={[[center + 33, 373], [center + 33, 403], [center + 21, 419]]} />
      <TreeWire points={[[center, 457], [center, 482]]} />
      <TreeWire points={[[center, 528], [center, 557], [center === 76 ? 136 : 184, 557], [center === 76 ? 136 : 184, 566]]} />
      <TreeLabel x={center} y={145}>{center === 76 ? 'yes: left' : 'no: right'}</TreeLabel>
      {rows.map((row, index) => <TreeLabel key={row.id} x={center} y={173 + index * 20}>{row.id}: class {row.label}</TreeLabel>)}
      <TreeValue x={center - 33} y={350} width={64}>{rows.length}/8</TreeValue>
      <TreeValue x={center + 33} y={350} width={64}>{number(score)}</TreeValue>
      <TreeLabel x={center} y={316}>weight / impurity</TreeLabel>
      <TreeOperation x={center} y={433}>×</TreeOperation>
      <TreeValue x={center} y={505}>{number(rows.length / 8 * score)}</TreeValue>
    </g>)}
    <TreeWire points={[[160, 602], [160, 627], [229, 627], [229, 658]]} />
    <TreeWire points={[[55, 632], [55, 682], [136, 682]]} />
    <TreeWire points={[[229, 658], [229, 682], [184, 682]]} />
    <TreeWire points={[[160, 706], [160, 743]]} />
    <TreeLabel x={160} y={40} role="parameter">x{candidate.feature + 1} ≤ {candidate.threshold}</TreeLabel>
    <TreeOperation x={160} y={578}>+</TreeOperation>
    <TreeValue x={55} y={609}>{number(candidate.parentImpurity)}</TreeValue>
    <TreeLabel x={55} y={571}>parent I</TreeLabel>
    <TreeLabel x={237} y={648}>child sum</TreeLabel>
    <TreeOperation x={160} y={682}>−</TreeOperation>
    <TreeValue x={160} y={766}>{number(candidate.gain)}</TreeValue>
    <TreeLabel x={244} y={772} role="computed">gain</TreeLabel>
  </TreeDrawing>;
}

export function BootstrapDrawDrawing({ member = forestReport().members[0] }) {
  const occurrence = inspectionRows.map((row, index) => member.sampleIndices.filter(draw => draw === index).length);
  return <TreeDrawing name="tree-bootstrap-occurrences" width={640} height={345}
    description="Eight original row IDs feed eight replacement draw slots; repeated occurrences enter fitting repeatedly"
    caption={`Cyan draw slots are supplied to member ${member.index + 1}'s fit. Occurrences, including duplicates, are counted. It has eight draws and ${new Set(member.sampleIndices).size} distinct rows; these actual tiny seeded draws need not match another implementation's random stream.`}>
    {member.sampleIndices.map((index, draw) => <TreeWire key={draw} points={[[40 + index * 80, 74], [40 + index * 80, 104 + draw * 4], [40 + draw * 80, 104 + draw * 4], [40 + draw * 80, 159]]} />)}
    {inspectionRows.map((row, index) => <g key={row.id}>
      <TreeValue x={40 + index * 80} y={51} width={62} role="input">{row.id}</TreeValue>
      <TreeValue x={40 + index * 80} y={182} width={62} role="input">{inspectionRows[member.sampleIndices[index]].id}</TreeValue>
      <TreeLabel x={40 + index * 80} y={244}>draw {index + 1}</TreeLabel>
      <TreeLabel x={40 + index * 80} y={300} role="computed">{row.id}: {occurrence[index]}</TreeLabel>
    </g>)}
    <TreeLabel x={320} y={329}>Multiplicity per original row</TreeLabel>
  </TreeDrawing>;
}

export function RegressionLeafDrawing({ query = 4 }) {
  const x = value => 58 + (value + 10) * 8;
  const y = value => 292 - value * 38;
  const answer = query <= 2.5 ? 1.5 : 4.5;
  return <TreeDrawing name="tree-regression-staircase" height={390}
    description="Six observed numerical targets define two mean leaves; a fixed x scale also shows queries outside the data"
    caption="Observed targets are white circles, computed mean answers are violet horizontal segments. Amber marks the saved split at 2.5. Dashed vertical residuals connect each observed value to its own leaf mean. Axes stay fixed as the cyan query moves.">
    <line x1={x(-10)} x2={x(20)} y1={292} y2={292} stroke={treeColors.wire} />
    <line x1={58} x2={58} y1={64} y2={292} stroke={treeColors.wire} />
    <line x1={x(2.5)} x2={x(2.5)} y1={70} y2={292} stroke={treeColors.parameter} strokeDasharray="5 5" />
    <line x1={x(-10)} x2={x(2.5)} y1={y(1.5)} y2={y(1.5)} stroke={treeColors.computed} strokeWidth={3} />
    <line x1={x(2.5)} x2={x(20)} y1={y(4.5)} y2={y(4.5)} stroke={treeColors.computed} strokeWidth={3} />
    {[1, 1.5, 2, 4, 4.5, 5].map((value, index) => <g key={index}>
      <line x1={x(index)} x2={x(index)} y1={y(value)} y2={y(index <= 2 ? 1.5 : 4.5)} stroke={treeColors.wire} strokeDasharray="3 3" />
      <circle cx={x(index)} cy={y(value)} r={4} fill={treeColors.target} />
    </g>)}
    {[-10, 0, 10, 20].map(value => <TreeLabel key={value} x={x(value)} y={321}>{value}</TreeLabel>)}
    {[0, 2, 4, 6].map(value => <TreeLabel key={value} x={36} y={y(value) + 6}>{value}</TreeLabel>)}
    <circle cx={x(query)} cy={y(answer)} r={8} fill={treeColors.input} stroke={treeColors.target} strokeWidth={2} />
    <TreeLabel x={130} y={224} role="computed">mean 1.5</TreeLabel>
    <TreeLabel x={240} y={91} role="computed">mean 4.5</TreeLabel>
    <TreeLabel x={160} y={30}>Numerical target y ↑</TreeLabel>
    <TreeLabel x={175} y={366} role="input">Query x →</TreeLabel>
  </TreeDrawing>;
}
