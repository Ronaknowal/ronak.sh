import { createContext, useContext, useMemo, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber } from './LessonFlow.jsx';
import { LessonTable } from './LessonElements.jsx';
import { inspectionRows, xorRows, growTree, treePrediction, splitCandidates, pruningReport, forestReport, ensembleVariance, permutationRows } from '../../data/decision-tree-models.js';
import { BranchingTreeDrawing, TreeRegionDrawing, SplitOperandDrawing, BootstrapDrawDrawing, RegressionLeafDrawing, TreeDrawing, TreeLabel, TreeValue, TreeOperation, TreeWire, treeColors, ProbabilityMeanDrawing, OobMaskDrawing, CovarianceDrawing } from './DecisionTreeFlowDrawings.jsx';

const number = (value, digits = 6) => flowNumber(value, digits);
const TreeCase = createContext(null);
export function TreeCaseProvider({ children }) {
  const [query, setQuery] = useState([4, 3]);
  const [depth, setDepth] = useState(2);
  const [minimum, setMinimum] = useState(1);
  const [members, setMembers] = useState(6);
  const [sampleFeatures, setSampleFeatures] = useState(true);
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedMember, setSelectedMember] = useState(0);
  const tree = useMemo(() => growTree(inspectionRows, { maxDepth: depth, minimumLeaf: minimum }), [depth, minimum]);
  const forest = useMemo(() => forestReport({ trees: members, selectedRow, featureSampling: sampleFeatures }), [members, selectedRow, sampleFeatures]);
  return <TreeCase.Provider value={{ query, setQuery, depth, setDepth, minimum, setMinimum, tree, members, setMembers, sampleFeatures, setSampleFeatures, selectedRow, setSelectedRow, selectedMember, setSelectedMember, forest }}>{children}</TreeCase.Provider>;
}

export function TreeSelect({ name, value, onChange, options }) {
  return <label className="decision-tree-select">
    <span>{name}</span>
    <select aria-label={name} value={String(value)} onChange={event => onChange(event.target.value)}>
      {options.map(([key, label]) => <option key={String(key)} value={String(key)}>{label}</option>)}
    </select>
  </label>;
}
export function TreeReset({ onReset }) {
  return <div className="decision-tree-actions"><button type="button" onClick={onReset}>Reset this example</button></div>;
}

export function TreePartitionLab() {
  const { query, setQuery, tree } = useContext(TreeCase);
  const result = treePrediction(tree, query);
  return <FlowLab id="tree-partitions" label="Move the supplied query through the current saved tree">
    <div className="decision-tree-pair">
      <TreeRegionDrawing tree={tree} query={query} />
      <BranchingTreeDrawing tree={tree} selectedPath={result.leafPath} />
    </div>
    <FlowControls>
      <FlowSlider name="Query x₁" value={query[0]} onChange={value => setQuery([value, query[1]])} min={0} max={6} step={0.1} />
      <FlowSlider name="Query x₂" value={query[1]} onChange={value => setQuery([query[0], value])} min={0} max={4} step={0.1} />
    </FlowControls>
    <TreeReset onReset={() => setQuery([4, 3])} />
    <FlowReadout>The same saved tree routes ({number(query[0])}, {number(query[1])}) to {result.rows.join(', ')}. Its positive frequency is <strong>{number(result.probability)}</strong>, giving class {result.label}; moving inside this leaf leaves that answer unchanged.</FlowReadout>
    <LessonTable caption="Every question on this query's route" headers={['Question', 'Query measurement', 'Taken edge']} rows={result.path.map(step => [`x${step.feature + 1} ≤ ${step.threshold}`, number(step.value), step.direction === 'left' ? 'Yes; equality goes here' : 'No'])} />
  </FlowLab>;
}

export function TreeGrowthLab() {
  const { query, tree, depth, setDepth, minimum, setMinimum } = useContext(TreeCase);
  const result = treePrediction(tree, query);
  const correct = inspectionRows.filter(row => treePrediction(tree, row.features).label === row.label).length;
  return <FlowLab id="tree-growth" label="Change the saved tree's growth limits while retaining the same query">
    <div className="decision-tree-pair"><TreeRegionDrawing tree={tree} query={query} name="tree-growth-regions" /><BranchingTreeDrawing tree={tree} selectedPath={result.leafPath} name="tree-growth-branches" /></div>
    <FlowControls>
      <TreeSelect name="Maximum depth in edges" value={depth} onChange={value => setDepth(Number(value))} options={[0, 1, 2, 3].map(value => [value, value])} />
      <TreeSelect name="Minimum rows in each child" value={minimum} onChange={value => setMinimum(Number(value))} options={[1, 2, 3].map(value => [value, value])} />
    </FlowControls>
    <TreeReset onReset={() => { setDepth(2); setMinimum(1); }} />
    <FlowReadout>Rebuilding under depth {depth} and minimum {minimum} fits <strong>{correct}/8</strong> training labels. The retained query ({number(query[0])}, {number(query[1])}) now receives {number(result.probability)}; this training count does not measure future accuracy.</FlowReadout>
  </FlowLab>;
}

export function SplitLedgerLab() {
  const [criterion, setCriterion] = useState('gini');
  const [minimum, setMinimum] = useState(1);
  const [selected, setSelected] = useState(2);
  const candidates = splitCandidates(inspectionRows, { criterion, minimumLeaf: minimum });
  const current = candidates[selected];
  const best = candidates.filter(candidate => candidate.allowed).reduce((winner, candidate) => !winner || candidate.gain > winner.gain + 1e-12 ? candidate : winner, null);
  return <FlowLab id="tree-split-ledger" label="Account for both children of a fixed-original candidate">
    <SplitOperandDrawing candidate={current} />
    <FlowControls>
      <TreeSelect name="Impurity criterion" value={criterion} onChange={setCriterion} options={[["gini", 'Gini'], ['entropy', 'Entropy in bits']]} />
      <TreeSelect name="Minimum rows in each child" value={minimum} onChange={value => setMinimum(Number(value))} options={[1, 2, 3].map(value => [value, value])} />
      <TreeSelect name="Candidate to inspect" value={selected} onChange={value => setSelected(Number(value))} options={candidates.map((candidate, index) => [index, `x${candidate.feature + 1} ≤ ${candidate.threshold}`])} />
    </FlowControls>
    <TreeReset onReset={() => { setCriterion('gini'); setMinimum(1); setSelected(2); }} />
    <FlowReadout>Gain is {number(current.parentImpurity)} − {number(current.weighted)} = <strong>{number(current.gain)}</strong>. {current.allowed ? 'Both children are legal.' : 'A child is too small; this candidate cannot be chosen.'} The best legal question is x{best.feature + 1} ≤ {best.threshold}.</FlowReadout>
    <LessonTable caption="All four original candidate partitions" headers={['Question', 'Child rows', 'Weighted impurity', 'Gain', 'Allowed']} rows={candidates.map(candidate => [`x${candidate.feature + 1} ≤ ${candidate.threshold}`, `${candidate.left.length}/${candidate.right.length}`, number(candidate.weighted), number(candidate.gain), candidate.allowed ? 'Yes' : 'No'])} />
  </FlowLab>;
}

export function XorTreeLab() {
  const [allowZero, setAllowZero] = useState(false);
  const tree = growTree(xorRows, { maxDepth: 2, allowZero });
  const correct = xorRows.filter(row => treePrediction(tree, row.features).label === row.label).length;
  return <FlowLab id="tree-xor" label="Allow or refuse the zero-gain first question of XOR">
    <div className="decision-tree-pair"><TreeRegionDrawing tree={tree} query={[0, 1]} rows={xorRows} bounds={[-0.3, 1.3, -0.3, 1.3]} name="tree-xor-regions" /><BranchingTreeDrawing tree={tree} name="tree-xor-branches" /></div>
    <FlowControls><TreeSelect name="Zero-gain stopping rule" value={allowZero} onChange={value => setAllowZero(value === 'true')} options={[[false, 'Stop at zero gain'], [true, 'Allow zero gain; continue to depth 2']]} /></FlowControls>
    <TreeReset onReset={() => setAllowZero(false)} />
    <FlowReadout>The same four XOR rows have <strong>{correct}/4</strong> correct fitted labels. {allowZero ? 'The second questions expose pure leaves.' : 'Both first questions have zero gain, so the builder returns one half-positive leaf.'}</FlowReadout>
  </FlowLab>;
}

export function RegressionLeafLab() {
  const [query, setQuery] = useState(4);
  return <FlowLab id="tree-regression-leaves" label="Move a numerical query within and beyond two constant leaves">
    <RegressionLeafDrawing query={query} />
    <FlowControls><FlowSlider name="Numerical query x" value={query} onChange={setQuery} min={-10} max={20} step={0.5} /></FlowControls>
    <TreeReset onReset={() => setQuery(4)} />
    <FlowReadout>At x = {number(query)}, the saved split routes {query <= 2.5 ? 'left' : 'right'} and returns <strong>{query <= 2.5 ? 1.5 : 4.5}</strong>. {query > 5 ? 'The query is past every observed input, but its leaf still returns the same mean.' : 'Changing the query inside the same leaf changes no target mean.'}</FlowReadout>
  </FlowLab>;
}

export function TreeTrainingFigure() {
  return <BranchingTreeDrawing name="tree-basic-anatomy" />;
}

export function BootstrapForestLab() {
  const { forest, members, setMembers, sampleFeatures, setSampleFeatures, selectedMember, setSelectedMember } = useContext(TreeCase);
  const member = forest.members[Math.min(selectedMember, members - 1)];
  return <FlowLab id="tree-forest-configuration" label="Change member count and fresh candidate features in the same tiny forest">
    <BootstrapDrawDrawing member={member} />
    <BranchingTreeDrawing tree={member.tree} name="tree-current-forest-member" />
    <FlowControls>
      <FlowSlider name="Number of members" value={members} onChange={value => { setMembers(value); setSelectedMember(Math.min(selectedMember, value - 1)); }} min={1} max={12} step={1} />
      <TreeSelect name="Candidate features at each node" value={sampleFeatures} onChange={value => setSampleFeatures(value === 'true')} options={[[true, 'One freshly sampled feature'], [false, 'Both features']]} />
    </FlowControls>
    <TreeReset onReset={() => { setMembers(6); setSampleFeatures(true); setSelectedMember(Math.min(selectedMember, 5)); }} />
    <FlowReadout>Member {member.index + 1} keeps {member.sampleIndices.length} replacement draws; {members} fitted members give mean p(1) = <strong>{number(forest.probability)}</strong> for the retained selected observation. Changing the member count keeps earlier members' draws unchanged.</FlowReadout>
  </FlowLab>;
}

export function ForestOobLab() {
  const { forest, selectedRow, setSelectedRow, selectedMember, setSelectedMember } = useContext(TreeCase);
  const member = forest.members[selectedMember];
  return <FlowLab id="tree-bootstrap" label="Which saved members may evaluate the selected omitted observation?">
    <OobMaskDrawing forest={forest} />
    <LessonTable caption="Membership determines permission before averaging" headers={['Member', 'Eight replacement draws', 'Selected row absent?', 'Returned p(1)']} rows={forest.members.map(item => [item.index + 1, item.sampleIndices.map(index => inspectionRows[index].id).join(' '), item.omitted ? 'Yes; eligible' : 'No; exclude', number(item.prediction.probability)])} />
    <BootstrapDrawDrawing member={member} />
    <FlowControls>
      <TreeSelect name="Observation to evaluate" value={selectedRow} onChange={value => setSelectedRow(Number(value))} options={inspectionRows.map((row, index) => [index, row.id])} />
      <TreeSelect name="Member to inspect" value={selectedMember} onChange={value => setSelectedMember(Number(value))} options={forest.members.map(item => [item.index, item.index + 1])} />
    </FlowControls>
    <TreeReset onReset={() => { setSelectedRow(0); setSelectedMember(0); }} />
    <FlowReadout>Row {forest.query.id} has <strong>{forest.oobCount}</strong> eligible members. {forest.oobProbability === null ? 'No eligible member means the OOB answer is unavailable.' : `Their mean positive probability is ${number(forest.oobProbability)}, while the observed class is ${forest.query.label}.`} Member {member.index + 1} {member.omitted ? 'may contribute' : 'contains this row and cannot contribute'}.</FlowReadout>
  </FlowLab>;
}

export function TreePruningLab() {
  const [alpha, setAlpha] = useState(.04);
  const report = pruningReport(alpha);
  const unique = report.candidates.filter((row,index,rows)=>rows.findIndex(other=>other.leaves===row.leaves&&Math.abs(other.risk-row.risk)<1e-12)===index);
  const x = value => 50 + 260*value/.3;
  const y = value => 278 - 215*value/1.6;
  return <FlowLab id="tree-pruning" label="Compare all six original subtree candidates by root-normalized training cost">
    <TreeDrawing name="tree-pruning-cost-lines" width={380} height={455} description="Calculated training cost lines cross at exact alpha fifteen over one hundred twenty-eight; coincident costs share a line">
      {[0,.1,.2,.3].map(value=><g key={value}><line x1={x(value)} x2={x(value)} y1={54} y2={278} stroke="#303030"/><TreeLabel x={x(value)} y={310}>{value}</TreeLabel></g>)}
      {[0,.8,1.6].map(value=><TreeLabel key={value} x={28} y={y(value)+6}>{value}</TreeLabel>)}
      {unique.map(row=><line key={row.index} x1={x(0)} x2={x(.3)} y1={y(row.risk)} y2={y(row.risk+.3*row.leaves)} stroke={row.leaves===report.best.leaves?treeColors.computed:treeColors.wire} strokeWidth={row.leaves===report.best.leaves?3:1.5}/>)}
      <line x1={x(15/128)} x2={x(15/128)} y1={57} y2={278} stroke={treeColors.parameter} strokeDasharray="5 5"/>
      <line x1={x(alpha)} x2={x(alpha)} y1={57} y2={278} stroke={treeColors.input}/>
      <circle cx={x(alpha)} cy={y(report.best.objective)} r={6} fill={treeColors.computed}/>
      <TreeLabel x={190} y={27}>Training risk + α × leaves ↑</TreeLabel>
      <TreeLabel x={190} y={351}>Complexity price α →</TreeLabel>
      <TreeLabel x={190} y={389} role="parameter">crossing: 15/128 = 0.1171875</TreeLabel>
      <TreeLabel x={190} y={430}>Two candidates share one cost line</TreeLabel>
    </TreeDrawing>
    <BranchingTreeDrawing tree={report.best.tree} name="tree-pruning-selected-branches" />
    <FlowControls><FlowSlider name="Complexity cost alpha" value={alpha} onChange={setAlpha} min={0} max={.3} step={.01}/></FlowControls>
    <TreeReset onReset={()=>setAlpha(.04)}/>
    <FlowReadout>Selected <strong>{report.best.leaves} leaves</strong>: risk {number(report.best.risk)} + {number(alpha)} × {report.best.leaves} = {number(report.best.objective)}. The exact tie prefers fewer leaves; the crossing lies between navigation increments.</FlowReadout>
    <LessonTable caption="All six candidates, including coincident costs" headers={['Candidate','Leaves','Training risk','Current cost']} rows={[...report.candidates].sort((a,b)=>a.index-b.index).map(row=>[row.index+1,row.leaves,number(row.risk),number(row.objective)])}/>
  </FlowLab>;
}

export function ForestAveragingLab() {
  const [probabilities,setProbabilities] = useState([.49,.49,.99]);
  const mean = probabilities.reduce((a,b)=>a+b,0)/3;
  const hard = probabilities.filter(p=>p>.5).length;
  return <FlowLab id="tree-averaging" label="Compare decisions after probability averaging and after hard voting">
    <ProbabilityMeanDrawing probabilities={probabilities} name="tree-probabilities-versus-votes" votes/>
    <FlowControls>{probabilities.map((p,i)=><FlowSlider key={i} name={`Supplied member ${i+1} positive probability`} value={p} onChange={value=>setProbabilities(old=>old.map((item,index)=>index===i?value:item))} min={0} max={1} step={.01}/>)}</FlowControls>
    <TreeReset onReset={()=>setProbabilities([.49,.49,.99])}/>
    <FlowReadout>Mean probability <strong>{number(mean)}</strong> chooses class {Number(mean>.5)}. Hard votes have {hard} positives and choose class {Number(hard>1.5)}. At an individual probability of .5 the hard class is 0.</FlowReadout>
  </FlowLab>;
}

export function ForestVarianceLab() {
  const [members,setMembers]=useState(20), [correlation,setCorrelation]=useState(.3);
  const x = value=>54+238*(value-1)/199, y=value=>267-213*value;
  return <FlowLab id="tree-variance" label="Investigate a stipulated equal-variance covariance model">
    <CovarianceDrawing members={members} correlation={correlation}/>
    <TreeDrawing name="tree-variance-curve" height={383} description="Exact variance-of-average curve on fixed axes; the dashed horizontal line is the stipulated shared floor">
      {[0,.5,1].map(value=><g key={value}><line x1={54} x2={292} y1={y(value)} y2={y(value)} stroke="#303030"/><TreeLabel x={30} y={y(value)+6}>{value}</TreeLabel></g>)}
      {[1,100,200].map(value=><TreeLabel key={value} x={x(value)} y={300}>{value}</TreeLabel>)}
      <polyline points={Array.from({length:200},(_,i)=>`${x(i+1)},${y(ensembleVariance(i+1,correlation))}`).join(' ')} fill="none" stroke={treeColors.computed} strokeWidth={3}/>
      <line x1={54} x2={292} y1={y(correlation)} y2={y(correlation)} stroke={treeColors.parameter} strokeDasharray="5 5"/>
      <circle cx={x(members)} cy={y(ensembleVariance(members,correlation))} r={6} fill={treeColors.input}/>
      <TreeLabel x={160} y={27}>Variance of the mean ↑; σ² = 1</TreeLabel><TreeLabel x={160} y={339}>Number of members B →</TreeLabel><TreeLabel x={160} y={374} role="parameter">floor = ρ = {number(correlation)}</TreeLabel>
    </TreeDrawing>
    <FlowControls><FlowSlider name="Member count B" value={members} onChange={setMembers} min={1} max={200} step={1}/><FlowSlider name="Common correlation rho" value={correlation} onChange={setCorrelation} min={0} max={1} step={.1}/></FlowControls>
    <TreeReset onReset={()=>{setMembers(20);setCorrelation(.3);}}/>
    <FlowReadout>Calculated variance = {number(correlation)} + (1 − {number(correlation)})/{members} = <strong>{number(ensembleVariance(members,correlation))}</strong>. These assumptions define the curve; no fitting occurs.</FlowReadout>
  </FlowLab>;
}

export function PermutationRelianceLab() {
  const [mode,setMode]=useState('copy'); const rows=permutationRows(mode);
  const accuracy=rows.filter(row=>row.label===row.predicted).length/4;
  return <FlowLab id="tree-permutation" label="Trace donor rows into a frozen predictor that reads only x₁">
    <TreeDrawing name="tree-permutation-donor-wires" width={800} height={425} description="Separate feature cells have their own donor-row wires; the frozen rule reads only the changed first coordinate">
      <TreeLabel x={135} y={27}>original x₁ | x₂</TreeLabel><TreeLabel x={535} y={27}>changed x₁ | x₂</TreeLabel><TreeLabel x={725} y={27}>frozen output</TreeLabel>
      {rows.map((row,i)=><g key={i}>
        <TreeLabel x={24} y={87+i*77}>ID {row.id}</TreeLabel>
        {[0,1].map(feature=>{
          const shuffled=mode==='group'||(mode==='used'?feature===0:feature===1);
          const donor=shuffled?[2,3,0,1][i]:i;
          const source=85+feature*100,target=485+feature*100;
          const points=feature===0?[[source,58+donor*77],[source,47+donor*77],[260+i*6,47+donor*77],[260+i*6,81+i*77],[target-30,81+i*77]]:[[source+30,81+donor*77],[345+i*6,81+donor*77],[345+i*6,112+i*77],[target,112+i*77],[target,104+i*77]];
          return <g key={feature}><TreeWire points={points}/><TreeValue x={source} y={81+i*77} width={60} role="input">{row.original[feature]}</TreeValue><TreeValue x={target} y={81+i*77} width={60} role="input">{row.transformed[feature]}</TreeValue></g>;
        })}
        <TreeWire points={[[485,104+i*77],[485,124+i*77],[635,124+i*77],[635,81+i*77],[660,81+i*77]]}/><TreeValue x={725} y={81+i*77} width={130}>{row.predicted}; y={row.label}</TreeValue>
      </g>)}
      <TreeLabel x={400} y={414}>Selected columns use donor IDs 3,4,1,2; the rule reads x₁</TreeLabel>
    </TreeDrawing>
    <FlowControls><TreeSelect name="Columns sharing the donor order" value={mode} onChange={setMode} options={[["copy",'Unused copy x₂'],['used','Used x₁'],['group','Both columns as a group']]}/></FlowControls>
    <TreeReset onReset={()=>setMode('copy')}/>
    <FlowReadout>Frozen rule predicts x₁. Original accuracy 1; changed accuracy <strong>{number(accuracy)}</strong>; score drop {number(1-accuracy)}. {rows.some(row=>row.impossiblePair)?'Separate shuffling breaks the observed duplicate relationship.':'The duplicate relationship is preserved.'}</FlowReadout>
    <LessonTable caption="Exact donors and results" headers={['Row','Original','Changed','Truth','Prediction']} rows={rows.map(row=>[row.id,row.original.join(','),row.transformed.join(','),row.label,row.predicted])}/>
  </FlowLab>;
}
