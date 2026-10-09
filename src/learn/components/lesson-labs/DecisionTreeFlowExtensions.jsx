import { TreeDrawing, TreeLabel, TreeValue, TreeWire, treeColors } from './DecisionTreeFlowDrawings.jsx';

export function ProtocolDrawing() {
  return <TreeDrawing name="tree-held-out-protocol" width={600} height={360} description="Training alone fits four candidates; validation chooses one; test evaluates that saved choice">
    {[['train: 341',80],['validation: 114',300],['test: 114',520]].map(([label,x])=><TreeValue key={label} x={x} y={48} width={150} role="input">{label}</TreeValue>)}
    <TreeWire points={[[80,71],[80,128]]}/><TreeWire points={[[300,71],[300,128]]}/><TreeWire points={[[520,71],[520,239]]}/>
    <TreeValue x={80} y={151} width={150} role="parameter">4 fitted models</TreeValue>
    <TreeValue x={300} y={151} width={150}>4 loss scores</TreeValue>
    <TreeWire points={[[155,151],[225,151]]}/><TreeWire points={[[300,174],[300,216],[220,216],[220,239]]}/>
    <TreeWire points={[[80,174],[80,262],[145,262]]}/><TreeWire points={[[295,262],[445,262]]}/>
    <TreeValue x={220} y={262} width={150} role="parameter">chosen model</TreeValue>
    <TreeValue x={520} y={262} width={150}>final report</TreeValue>
    <TreeLabel x={300} y={344}>No training-plus-validation refit in this experiment</TreeLabel>
  </TreeDrawing>;
}

export function CategoryDrawing() {
  const names=['red','green','blue'];
  return <TreeDrawing name="tree-category-encoding" width={510} height={350} description="Ordered numeric codes allow prefix cuts; one-hot columns allow a single named category question">
    <TreeLabel x={255} y={27}>ordered code → three one-hot columns</TreeLabel>
    {names.map((name,i)=><g key={name}>
      <TreeLabel x={61} y={97+i*83}>{name}: {i}</TreeLabel>
      <TreeWire points={[[126,91+i*83],[194,91+i*83]]}/>
      {names.map((column,j)=><g key={column}><rect x={216+j*80} y={65+i*83} width={60} height={52} fill={i===j?'#253940':'#111'} stroke={treeColors.wire}/><TreeLabel x={246+j*80} y={99+i*83} role="input">{Number(i===j)}</TreeLabel></g>)}
    </g>)}
    {names.map((name,i)=><TreeLabel key={name} x={246+i*80} y={53}>{name}</TreeLabel>)}
    <TreeLabel x={255} y={344}>green ≤ 0.5 separates green from the other two</TreeLabel>
  </TreeDrawing>;
}

export function MissingSurrogateDrawing() {
  const rows=[[1,1,0],[2,2,0],[4,4,1],[5,1,1]];
  return <TreeDrawing name="tree-primary-surrogate-routes" width={470} height={440} description="A surrogate is evaluated against the primary split's left/right route, not against the target label">
    <TreeLabel x={235} y={30}>primary: x₁ ≤ 3 | surrogate: x₂ ≤ 3</TreeLabel>
    {rows.map(([a,b,label],i)=><g key={i}>
      <TreeValue x={68} y={80+i*74} width={126} role="input">{String.fromCharCode(65+i)}: [{a},{b}]</TreeValue>
      <TreeWire points={[[131,80+i*74],[186,80+i*74]]}/>
      <TreeLabel x={240} y={86+i*74}>{a<=3?'left':'right'} / {b<=3?'left':'right'}</TreeLabel>
      <TreeLabel x={394} y={86+i*74}>y={label}</TreeLabel>
    </g>)}
    <TreeLabel x={235} y={391} role="computed">agreement: 3 / 4 primary routes</TreeLabel>
    <TreeLabel x={235} y={427}>[missing, 4] uses surrogate → right</TreeLabel>
  </TreeDrawing>;
}

export function WeightedLeafDrawing() {
  return <TreeDrawing name="tree-weighted-leaf-mass" height={345} description="Three class-zero rows carry unit mass; one class-one row carries six units, so probabilities use mass rather than row frequency">
    <TreeLabel x={160} y={27}>class 0: three rows, weights 1 each</TreeLabel>
    {[0,1,2].map(i=><rect key={i} x={42+i*29} y={52} width={26} height={36} fill={treeColors.target}/>)}
    <TreeLabel x={160} y={123}>class 1: one row, weight 6</TreeLabel>
    {[0,1,2,3,4,5].map(i=><rect key={i} x={42+i*29} y={148} width={26} height={36} fill={treeColors.target}/>)}
    <TreeWire points={[[129,89],[15,89],[15,220],[160,220],[160,242]]}/><TreeWire points={[[216,184],[216,220],[160,220],[160,242]]}/>
    <TreeValue x={160} y={265} width={210}>p(1) = 6 / 9 = 2 / 3</TreeValue>
    <TreeLabel x={160} y={329}>unit rectangles encode weight mass</TreeLabel>
  </TreeDrawing>;
}

export function MdiDrawing() {
  const nodes=[{mass:1,gain:3/32,f:'x₁'}, {mass:3/8,gain:4/9,f:'x₁'}, {mass:3/8,gain:4/9,f:'x₁'}, {mass:6/8,gain:1/18,f:'x₂'}];
  // Two depth-two child gains are 4/9; x2 at the left node has gain 1/18.
  const sums={x1:41/96,x2:1/24};
  return <TreeDrawing name="tree-mdi-credit" width={590} height={380} description="Root-mass-weighted split gains flow to feature bins before normalization">
    {nodes.map((node,i)=><g key={i}><TreeLabel x={75+i*145} y={35}>{node.f}</TreeLabel><TreeValue x={75+i*145} y={83} width={138}>{node.mass} × {Number(node.gain.toFixed(5))}</TreeValue><TreeWire points={[[75+i*145,106],[75+i*145,162],[node.f==='x₁'?155:435,162],[node.f==='x₁'?155:435,216]]}/></g>)}
    <TreeValue x={155} y={239} width={200}>x₁ credit: {Number(sums.x1.toFixed(6))}</TreeValue>
    <TreeValue x={435} y={239} width={200}>x₂ credit: {Number(sums.x2.toFixed(6))}</TreeValue>
    <TreeLabel x={295} y={310}>total reduction 15/32 = 0.46875</TreeLabel>
    <TreeLabel x={295} y={356} role="computed">normalized x₁: 41/45; x₂: 4/45</TreeLabel>
  </TreeDrawing>;
}

export function HonestyDrawing() {
  return <TreeDrawing name="tree-honesty-separate-label-routes" width={510} height={480} description="Split-selection labels choose a threshold; disjoint estimation labels populate the saved leaves">
    <TreeValue x={130} y={55} width={235} role="input">split x: 0,1,2,3; y: 0,0,1,1</TreeValue>
    <TreeWire points={[[130,78],[130,150]]}/>
    <TreeValue x={130} y={173} width={175} role="parameter">saved x ≤ 1.5</TreeValue>
    <TreeValue x={386} y={173} width={215} role="input">estimate x: .5,2.5</TreeValue>
    <TreeWire points={[[130,196],[130,272],[155,272],[155,316]]}/>
    <TreeWire points={[[386,196],[386,210],[495,210],[495,272],[155,272],[155,316]]}/>
    <TreeValue x={155} y={339} width={150}>left p(1) = 0</TreeValue><TreeValue x={365} y={339} width={150}>right p(1) = 1</TreeValue>
    <TreeWire points={[[130,196],[130,272],[365,272],[365,316]]}/>
    <TreeLabel x={386} y={236}>estimation y: 0,1</TreeLabel>
    <TreeLabel x={255} y={418}>Estimation y never chooses the threshold</TreeLabel>
    <TreeLabel x={255} y={455}>Empty estimation leaf: unavailable in this toy</TreeLabel>
  </TreeDrawing>;
}

export function MarginDrawing() {
  const fractions=[.6,.3,.1];
  return <TreeDrawing name="tree-vote-margin" height={300} description="An infinite vote calculation subtracts the largest wrong-class probability from the true-class probability">
    {fractions.map((p,i)=><g key={i}><TreeLabel x={93} y={57+i*66}>{i===0?'true class':`wrong ${i}`}</TreeLabel><rect x={170} y={33+i*66} width={p*190} height={30} fill={treeColors.computed}/><TreeLabel x={170+p*190+22} y={57+i*66}>{p}</TreeLabel></g>)}
    <TreeLabel x={160} y={272} role="computed">margin = 0.6 − 0.3 = 0.3</TreeLabel>
  </TreeDrawing>;
}

export function ThresholdSearchDrawing() {
  const x=v=>40+240*v/6;
  return <TreeDrawing name="tree-extra-threshold-search" height={295} description="Ordinary midpoint candidates and random threshold candidates both enter a label-scored choice">
    {[[1.5,3,4.5],[.8,2.7,4.1]].map((cuts,i)=><g key={i}><line x1={40} x2={280} y1={90+i*116} y2={90+i*116} stroke={treeColors.wire}/>{[1,2,4,5].map(v=><circle key={v} cx={x(v)} cy={90+i*116} r={5} fill={treeColors.input}/>)}{cuts.map(v=><g key={v}><line x1={x(v)} x2={x(v)} y1={73+i*116} y2={107+i*116} stroke={treeColors.parameter}/><TreeLabel x={x(v)} y={137+i*116} role="parameter">{v}</TreeLabel></g>)}<TreeLabel x={160} y={44+i*116}>{i?'stipulated random candidates':'all distinct midpoints'}</TreeLabel></g>)}
    <TreeLabel x={160} y={291}>Both score labels before selecting a split</TreeLabel>
  </TreeDrawing>;
}

export function FamilyGeometryDrawing() {
  return <TreeDrawing name="tree-axis-oblique-categorical" width={670} height={470} description="An axis-aligned staircase uses successive questions; an oblique question cuts on a sum; a categorical question can have three branches">
    {['axis questions','oblique: x₁+x₂ ≤ 1'].map((title,i)=><g key={title}>
      <TreeLabel x={163+i*335} y={30}>{title}</TreeLabel>
      <rect x={40+i*335} y={60} width={240} height={240} fill="none" stroke={treeColors.wire}/>
      {i===0?<><path d="M40,180H160V60M160,240H280M160,180V300" stroke={treeColors.parameter} fill="none" strokeWidth={3}/><TreeLabel x={106} y={164} role="parameter">x₂ ≤ .5</TreeLabel><TreeLabel x={220} y={220} role="parameter">x₂ ≤ .25</TreeLabel><TreeLabel x={207} y={92} role="parameter">x₁ ≤ .5</TreeLabel></>:<line x1={375} x2={615} y1={60} y2={300} stroke={treeColors.parameter} strokeWidth={3}/>}
      <TreeLabel x={163+i*335} y={330} role="input">x₁ →; x₂ ↑; [0,1] × [0,1]</TreeLabel>
    </g>)}
    <TreeValue x={335} y={383} width={160} role="parameter">category?</TreeValue>
    {[['red',145],['green',335],['blue',525]].map(([name,x])=><g key={name}><TreeWire points={[[335,406],[335,420],[x,420],[x,436]]}/><TreeLabel x={x} y={462}>{name}</TreeLabel></g>)}
  </TreeDrawing>;
}

export function MissingCandidateDrawing() {
  return <TreeDrawing name="tree-missing-candidate-routes" width={470} height={370} description="At threshold three point five, both possible routes for the missing positive row are scored, and right has lower weighted Gini">
    <TreeLabel x={235} y={28}>x=[0,1,6,missing], y=[0,0,1,1]</TreeLabel>
    <TreeValue x={235} y={86} width={200} role="parameter">candidate x ≤ 3.5</TreeValue>
    {[['missing left',118,'[0,0,1] | [1]','1/3'],['missing right',353,'[0,0] | [1,1]','0']].map(([label,x,groups,risk])=><g key={label}>
      <TreeWire points={[[235,109],[235,140],[x,140],[x,171]]}/>
      <TreeLabel x={x} y={198}>{label}</TreeLabel><TreeLabel x={x} y={246}>{groups}</TreeLabel>
      <TreeValue x={x} y={300} width={216}>weighted Gini {risk}</TreeValue>
    </g>)}
    <TreeLabel x={235} y={366} role="computed">learn missing → right at this split</TreeLabel>
  </TreeDrawing>;
}

export function NumericalObjectiveDrawing() {
  const x=value=>42+23*value;
  return <TreeDrawing name="tree-mean-median-objectives" height={355} description="The same three targets have different optimal constant answers under squared and absolute loss">
    {[[11/3,'mean: squared loss',90],[1,'median: absolute loss',235]].map(([answer,title,y])=><g key={title}>
      <TreeLabel x={160} y={y-54}>{title}</TreeLabel><line x1={42} x2={272} y1={y} y2={y} stroke={treeColors.wire}/>
      {[0,1,10].map((value,i)=><g key={value}><line x1={x(value)} x2={x(answer)} y1={y-13-i*7} y2={y-13-i*7} stroke={treeColors.computed}/><circle cx={x(value)} cy={y} r={5} fill={treeColors.target}/><TreeLabel x={x(value)} y={y+35}>{value}</TreeLabel></g>)}
      <line x1={x(answer)} x2={x(answer)} y1={y-40} y2={y+9} stroke={treeColors.computed} strokeWidth={3}/>
      <TreeLabel x={160} y={y+69} role="computed">answer {answer===1?'1':'11/3'}</TreeLabel>
    </g>)}
    <TreeLabel x={160} y={350}>Each horizontal segment is a target deviation</TreeLabel>
  </TreeDrawing>;
}

export function MonotonicDrawing() {
  const ys=[[0,1,0,1,1],[0,.5,.5,1,1]];
  return <TreeDrawing name="tree-monotonic-actual-outputs" width={450} height={380} description="Executed library outputs on one-dimensional ordered queries show the constrained probability never decreases">
    {[0,1].map(i=><g key={i}>
      <TreeLabel x={225} y={24+i*177}>{i?'nondecreasing constraint':'unconstrained fit'}</TreeLabel>
      <polyline points={ys[i].map((v,j)=>`${60+j*80},${132+i*177-v*65}`).join(' ')} fill="none" stroke={treeColors.computed} strokeWidth={2}/>
      {ys[i].map((v,j)=><g key={j}><circle cx={60+j*80} cy={132+i*177-v*65} r={5} fill={treeColors.computed}/><TreeLabel x={60+j*80} y={164+i*177} role="input">{j}</TreeLabel><TreeLabel x={60+j*80} y={117+i*177-v*65}>{v}</TreeLabel></g>)}
    </g>)}
    <TreeLabel x={225} y={376}>Query x →; outputs are p(1), not labels</TreeLabel>
  </TreeDrawing>;
}
