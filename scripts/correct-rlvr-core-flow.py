"""Original-author closure of preliminary flow findings; no scientific edits."""
import re
from pathlib import Path

path = Path('src/learn/components/lesson-labs/RLVRCoreFigures.jsx')
source = path.read_text(encoding='utf-8')


def replace_function(name, successor, next_name):
    global source
    pattern = rf'export function {name}\(\) \{{.*?(?=export function {next_name}\(\))'
    source, count = re.subn(pattern, lambda _: successor + '\n', source, flags=re.S)
    assert count == 1


start = source.index('export function ResponseProbabilitySimplex')
end = source.index('export function CausalSampleAndGather')
region = source[start:end].replace('palette[i]', 'palette[[0, 2, 3][i]]')
region = region.replace("values={masses}", "values={masses} colors={[palette[0],palette[2],palette[3]]}")
region = region.replace("values={result.gradient}", "values={result.gradient} colors={[palette[0],palette[2],palette[3]]}")
source = source[:start] + region + source[end:]
start = source.index('export function SupportAndEntropy')
end = source.index('export function PromptSelectionAndContrast')
region = source[start:end].replace('palette[i]', 'palette[[0, 2, 3][i]]')
region = region.replace('values={result.probabilities}', 'values={result.probabilities} colors={[palette[0],palette[2],palette[3]]}')
region = region.replace('label="Top-k token support"', 'label="Top-k response support"')
source = source[:start] + region + source[end:]
source = source.replace('<Arrow x1={120} y1={40} x2={220} y2={80} />', '<Arrow x1={120} y1={40} x2={220} y2={80} color={M.roles.parameter} /><Arrow x1={120} y1={40} x2={415} y2={80} color={M.roles.parameter} /><Text x={250} y={57} halo>p enters both comparisons</Text>')
source = source.replace('label="Response B token length"\n          value={length}', 'label="Response B token length"\n          disabled={zero}\n          value={length}')
replace_function('CausalSampleAndGather', r'''export function CausalSampleAndGather() {
  const [eos,setEOS]=useState(true),[selected,setSelected]=useState(2);
  const ids=[258,65,259,35,...(eos?[257]:[]),256], probabilities=eos?[.25,.5]:[.25];
  const target=Math.min(selected+1,ids.length-1),included=target>=3&&ids[target]!==256;
  const probability=included?probabilities[target-3]:null;
  const sum=probabilities.reduce((value,p)=>value+Math.log(p),0);
  return <Figure id="D08" label="Selected predictor and probability gather, included log-sum and detached reward route">
    <Svg height={425} label="Actual target address selects a probability cell before summing response scores">
      <Text x={45} y={28}>Constructed IDs · selected target {target}, predictor {target-1}</Text>
      {ids.map((id,i)=><g key={i}><Text x={50+i*96} y={60} anchor="middle">{i}</Text><rect x={22+i*96} y={80} width={56} height={35} fill="none" stroke={i<3?M.roles.input:id===256?M.roles.frozen:M.roles.score} strokeWidth={i===target||i===target-1?3:1}/><Text x={50+i*96} y={103} anchor="middle">{{258:'BOS',259:'SEP',257:'EOS',256:'PAD'}[id]||id}</Text>{i<ids.length-1&&<Arrow x1={50+i*96} y1={127} x2={146+i*96} y2={158} color={i+1===target?M.roles.parameter:i>=2&&ids[i+1]!==256?M.roles.score:M.roles.frozen}/>}</g>)}
      <Text x={45} y={191}>Gather from predictor {target-1} softmax at target ID {ids[target]}</Text>
      <rect x={45} y={210} width={210} height={40} fill="none" stroke={included?M.roles.score:M.roles.frozen}/><Text x={150} y={235} anchor="middle">{included?`Selected p = ${probability}`:'Excluded context / PAD'}</Text>
      <Text x={380} y={234} color={M.roles.frozen}>Terminal reward R = 1 · detached</Text>
      <Arrow x1={150} y1={252} x2={150} y2={287} color={M.roles.score} dashed={!included}/><Text x={150} y={311} anchor="middle">Σ included log p = {f(sum)}</Text>
      <Arrow x1={480} y1={252} x2={300} y2={335} dashed/><Arrow x1={150} y1={322} x2={300} y2={335} color={M.roles.score}/><Text x={300} y={359} anchor="middle">R × ∇ log π(response | prompt)</Text>
      <Arrow x1={300} y1={369} x2={300} y2={392} color={M.roles.parameter}/><Text x={300} y={417} anchor="middle" color={M.roles.parameter}>Shared trainable parameter θ</Text>
    </Svg>
    <Tokens ids={ids.slice(1)} mask={M.responseMask(3,probabilities.length,ids.length)} selected={target-1} onSelect={setSelected} offset={1}/>
    <p>Selected target {target}: {included?`included, log p = ${f(Math.log(probability))}`:'excluded, no response-score contribution'}. Product {probabilities.join(' × ')} = {f(probabilities.reduce((a,b)=>a*b,1))}; log of product = sum of included logs = {f(sum)}.</p>
    <Controls><Check label="Include genuine generated EOS" value={eos} onChange={value=>{setEOS(value);setSelected(2);}}/><Reset onClick={()=>{setEOS(true);setSelected(2);}}/></Controls>
  </Figure>;
}''', 'GroupSamplingTree')
replace_function('PromptSelectionAndContrast', r'''export function PromptSelectionAndContrast() {
  const [strategy,setStrategy]=useState('uniform'),[step,setStep]=useState(1),[theta,setTheta]=useState(0),[difficulty,setDifficulty]=useState(-2);
  return <Figure id="D19" label="Editable finite shared-parameter simulator with fixed original random tape"><DataView file="mechanisms.json">{data=>{
    const simulation=M.finiteScheduler(strategy,data.finiteUniformTape,theta,[difficulty,1]),row=simulation.history[step-1],counts=[0,0];
    simulation.history.slice(0,step).forEach(item=>counts[item.task]++);
    return <><Svg height={235} label="One shared theta feeding two task-conditioned probabilities"><circle cx={320} cy={50} r="23" fill="none" stroke={M.roles.parameter}/><Text x={320} y={54} anchor="middle">θ</Text><Text x={365} y={55} color={M.roles.parameter}>{f(row.theta_before)}</Text>{[0,1].map(i=><g key={i}><Arrow x1={320} y1={76} x2={160+i*320} y2={118}/><Text x={160+i*320} y={145} anchor="middle" color={palette[i]}>Task {i+1}: offset {simulation.task_offsets[i]}</Text><Text x={160+i*320} y={180} anchor="middle">p = {f(row.probabilities[i])}</Text><Text x={160+i*320} y={212} anchor="middle">Selected {counts[i]} times so far</Text></g>)}</Svg><Bars labels={['Task 1 sampling share','Task 2 sampling share']} values={row.proposed_weights} maximum={1}/><RLVRTable headers={['Task','Pass probability','Mixed-group probability','Selected now']} rows={[0,1].map(i=>[i+1,f(row.probabilities[i]),f(row.mixed_probabilities[i]),row.task===i?'yes':'no'])}/><p>Sampled outcomes {row.outcomes.join(' ')}; same-group gradient {f(row.same_group_logit_gradient)}; θ after {f(row.theta_after)}. Final task counts {simulation.task_counts.join(' / ')}.</p><Controls><Select label="Finite strategy" value={strategy} onChange={setStrategy} options={['uniform','easy-first','mixed-rate']}/><Range label="Finite step" value={step} onChange={setStep} min={1} max={24} step={1}/><Range label="Starting shared theta" value={theta} onChange={setTheta} min={-2} max={2} step={.25}/><Range label="Task 1 logit offset" value={difficulty} onChange={setDifficulty} min={-4} max={0} step={.25}/><Reset onClick={()=>{setStrategy('uniform');setStep(1);setTheta(0);setDifficulty(-2);}}/></Controls><p className="rlvr-note">Finite Bernoulli calculation, same 120 uniforms from original Python seed 11. Defaults reproduce the retained finite histories; edited parameters construct a new finite illustration, not neural or GSM8K training.</p></>;
  }}</DataView></Figure>;
}''', 'VerifiedSelectionLineage')
replace_function('VerifiedSelectionLineage', r'''export function VerifiedSelectionLineage() {
  const [mode,setMode]=useState('mixed');
  const texts=M.exampleResponses.map(text=>mode==='none'?text.replace(/#### 72/g,'#### 24'):text), rewards=texts.map(text=>M.verdict(text,'72').reward),coeff=M.groupStatistics(rewards,{scaled:false}).advantages;
  const kept=rewards.flatMap((r,i)=>r?[i]:[]);
  return <Figure id="D20" label="Complete supplied responses, exact retained target IDs and explicit constructed provenance">
    <p style={{color:M.roles.input}}>{M.taskQuestion}</p><p>Constructed lineage: checkpoint W_demo · prompt Natalia · candidates A–D supplied as examples · sampling seed not applicable · strict final-marker numeric contract, gold 72.</p>
    <div className="rlvr-columns">{texts.map((text,i)=><div className="rlvr-entity" key={i} style={{'--entity':palette[i]}}><p style={{color:palette[i]}}>Response {'ABCD'[i]} · {rewards[i]?'retained':'discarded'}</p><div className="rlvr-raw">{text}</div><p>Reward {rewards[i]}; centred PG coefficient {f(coeff[i])}.</p></div>)}</div>
    <Svg height={290} label="Identity-preserving accepted response wires into actual selected SFT rows">{rewards.map((r,i)=><g key={i}><Text x={90} y={35+i*58} color={palette[i]}>W_demo / Natalia / {'ABCD'[i]}</Text><Arrow x1={295} y1={30+i*58} x2={470} y2={30+i*58} color={palette[i]} dashed={!r}/><Text x={490} y={35+i*58}>{r?'target kept':'no target'}</Text></g>)}<Text x={90} y={280}>Solid retained sequence; dashed rejected sequence.</Text></Svg>
    {kept.map(i=><div key={i} className="rlvr-entity" style={{'--entity':palette[i]}}><p>Exact response target {'ABCD'[i]} plus EOS; prompt and PAD excluded</p><div className="rlvr-raw">{[...new TextEncoder().encode(texts[i]),257].join(', ')}</div></div>)}
    <p>{kept.length?`${kept.length} retained responses: one selected-set likelihood update. B's full wrong derivation becomes a target because its final 72 passes.`:'No accepted response: no response targets and no optimizer update.'}</p>
    <Controls><Select label="Selection case" value={mode} onChange={setMode} options={['mixed',['none','All numeric answers wrong']]}/><Reset onClick={()=>setMode('mixed')}/></Controls>
  </Figure>;
}''', 'AcceptanceConfusionMatrix')
path.write_text(source, encoding='utf-8')
