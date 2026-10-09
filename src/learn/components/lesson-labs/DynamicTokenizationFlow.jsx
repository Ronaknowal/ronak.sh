import { useEffect, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout, flowNumber } from './LessonFlow.jsx';
import { PIECE_COLORS, HAND_RULES, DELETE_RULES, LATTICE_PIECES, LATTICE_WEIGHTS, INPUT_ROWS, OUTPUT_ROWS, OUTPUT_BIAS, HIDDEN, INCLUD_RULES, pieceColour, pieceLabel, byteString, rankedTrace, mergeCompetition, unigramLattice, seededSample, lossStatistics, adaptivePriority, residueDecision, entropyBits, bpeTrees, cleanupTrace, compactModel, prefixState, tokenMetrics, rowBudget } from '../../data/dynamic-tokenization-models.js';
import './dynamic-tokenization-flow.css';

const number = (value,digits=4) => value===null||value===undefined?'unknown':value===Infinity?'∞':value===-Infinity?'−∞':flowNumber(value,digits);
const vector = values => `[${values.map(v=>number(v)).join(', ')}]`;
const style = piece => ({'--dt-piece':pieceColour(piece)});
const Reset = ({onClick}) => <button type="button" onClick={onClick}>Reset</button>;
function Drawing({name,label,children,caption}) {return <figure className="dt-drawing" data-dt-figure={name} aria-label={label}>{children}{caption&&<figcaption>{caption}</figcaption>}</figure>;}
function Arrow({label}) {return <div className="dt-arrow">{label&&<span>{label}</span>}<svg width="30" height="28" viewBox="0 0 30 28" aria-hidden="true"><path d="M15 2V24M9 18L15 24L21 18" fill="none" stroke="currentColor"/></svg></div>;}
function Piece({piece,selected=false,excluded=false,note,onClick}) {
  const Tag=onClick?'button':'span';
  return <Tag type={onClick?'button':undefined} className={`dt-piece${selected?' is-selected':''}${excluded?' is-excluded':''}`} style={style(piece)} data-piece-raw={piece} data-piece-label={pieceLabel(piece)} onClick={onClick} aria-pressed={onClick?selected:undefined}>
    <span>{pieceLabel(piece)||'∅'}</span>{note!==undefined&&<small>{note}</small>}
  </Tag>;
}
function Strip({pieces,label,selected,excluded=[],positions=false}) {
  let offset=0;
  return <div className="dt-strip-object">{label&&<p className="dt-label">{label}</p>}<div className="dt-strip">{pieces.length?pieces.map((value,i)=>{
    const piece=typeof value==='string'?value:value.piece,start=offset;offset+=piece.length;
    return <Piece key={`${i}-${piece}`} piece={piece} selected={piece===selected} excluded={excluded.includes(piece)} note={positions?`${start}–${offset} bytes`:undefined}/>;
  }):<span className="dt-empty">∅ no ordinary pieces</span>}</div></div>;
}
function AlignedStrip({nodes,label,excluded=[],bytes}) {
  return <div className="dt-aligned-strip"><p className="dt-label">{label}</p><div className="dt-byte-lane" style={{width:`${Math.max(1,bytes)*2.3}rem`}}>{nodes.length?nodes.map((node,i)=><div key={i} style={{width:`${node.piece.length*2.3}rem`}}><Piece piece={node.piece} excluded={excluded.includes(node.piece)} note={`${node.start}–${node.end}`}/></div>):<span>∅ empty path</span>}</div></div>;
}
function Groups({groups,label,selected}) {
  return <div>{label&&<p className="dt-label">{label}</p>}<div className="dt-groups">{groups.length?groups.map((group,i)=><div className="dt-group" key={i}><span className="dt-group-label">group {i+1}</span><Strip pieces={group} selected={selected}/></div>):<span>∅ no pretokens</span>}</div></div>;
}
function Matrix({rows,label,identities,selected,excluded=[]}) {
  return <div className="dt-matrix-object"><p className="dt-label">{label}</p><div className="dt-matrix">{rows.map((row,i)=><div key={i} className={`dt-matrix-row${selected===i?' is-selected':''}${excluded.includes(i)?' is-excluded':''}`} data-row-id={i} style={style(identities?.[i]??String(i))}>
    <span className="dt-row-address">{i}</span>{row.map((value,j)=><span key={j} className="dt-cell">{number(value)}</span>)}
  </div>)}</div></div>;
}
function Bars({rows,label,unit='count',maximum}) {
  const max=maximum??Math.max(1,...rows.map(row=>row.value??0));
  return <div className="dt-bars"><p className="dt-label">{label}</p>{rows.map((row,i)=><div className="dt-bar-row" key={i} style={style(row.identity??row.label)}>
    <span>{row.label}</span><div className="dt-bar-track"><span style={{width:`${100*(row.value??0)/max}%`}}/></div><span>{row.value===null?'n/a':`${number(row.value)} ${unit}`}</span>
  </div>)}</div>;
}
function TextInput({label,value,onChange,maxLength=40}) {return <label className="dt-text-input"><span>{label}</span><input type="text" value={value} maxLength={maxLength} onChange={event=>onChange(event.target.value)}/></label>;}
function useStudy() {
  const [data,setData]=useState(null),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
  useEffect(()=>{const controller=new AbortController();setError(false);fetch('/learn/examples/dynamic-tokenization/measured-study.json',{signal:controller.signal}).then(response=>{if(!response.ok)throw Error('Study unavailable');return response.json();}).then(setData).catch(()=>{if(!controller.signal.aborted)setError(true);});return()=>controller.abort();},[attempt]);
  return {data,error,retry:()=>setAttempt(value=>value+1)};
}
function StudyStatus({study}) {return study.data?null:study.error?<p role="alert">Measured study could not load. <button type="button" onClick={study.retry}>Retry measured study</button></p>:<p role="status">Loading measured study…</p>;}

const DICTIONARY = ['a','b','ab','aba','abab'];
export function DictionaryContract() {
  const [piece,setPiece]=useState('ab'),[mapping,setMapping]=useState('correct');
  const id=DICTIONARY.indexOf(piece),newPiece=piece==='new',empty=piece==='empty';
  const actual=id<0?null:mapping==='mistaken'?(id+1)%5:id;
  return <FlowLab id="dt-dictionary" label="Follow a piece through dictionary and model rows">
    <Drawing name="dictionary" label="Literal pieces, named IDs and matching embedding/output rows">
      <div className="dt-columns-3"><div><p className="dt-label">Dictionary: literal piece → ID</p><div className="dt-dictionary-list">{DICTIONARY.map((value,i)=><Piece key={value} piece={value} selected={piece===value} note={`ID ${i}`} onClick={()=>setPiece(value)}/>)}</div></div>
      <Matrix rows={INPUT_ROWS} identities={DICTIONARY} selected={actual} label="E: input rows (3 numbers each)"/>
      <Matrix rows={OUTPUT_ROWS} identities={DICTIONARY} selected={id} label="W: output rows (one score per ID)"/></div>
      <Arrow label="Selected lookup"/><div className="dt-contract-path">{empty?<span>∅ no lookup</span>:newPiece?<><Piece piece="novel"/><span>new ID 5</span><span className="dt-untrained">? ? ? — untrained new row</span></>:<><Piece piece={piece}/><span>ID {id}</span><span>lookup row {actual}</span><span className={actual!==id?'dt-mismatch':''} style={style(DICTIONARY[actual])}>{vector(INPUT_ROWS[actual])}</span></>}</div>
    </Drawing>
    <FlowControls><FlowChoice label="Input" options={[["ab","ab"],["aba","aba"],["a","a"],["new","New piece"],["empty","Empty"]]} value={piece} onChange={setPiece}/><FlowChoice label="Row mapping" options={[["correct","Correct"],["mistaken","Mistaken"]]} value={mapping} onChange={setMapping}/><Reset onClick={()=>{setPiece('ab');setMapping('correct');}}/></FlowControls>
    <FlowReadout data-model="dictionary">{empty?'No ordinary input ID.':newPiece?'Appending the spelling creates an address; the illustrated new row has no learned meaning.':mapping==='correct'?`Piece ${piece} → ID ${id} → matching input/output rows ${id}.`:`Mismatch: ID ${id} names ${piece}, but retrieves row ${actual} for ${DICTIONARY[actual]}.`}</FlowReadout>
  </FlowLab>;
}
export function AdaptationTimeline() {
  return <Drawing name="timeline" label="Token dictionaries and model rows change at distinct stages">
    <div className="dt-timeline">
      <div className="dt-timeline-lane"><p>Boundless: tokenizer fitting</p><Strip pieces={[' of',' the']} label="complete pretokens"/><Arrow label="learn saved supermerge"/><Strip pieces={[' of the']} label="saved rule + dictionary"/><span className="dt-stage-dot">then downstream model training</span></div>
      <div className="dt-timeline-lane"><p>ADAT: before final training</p><Strip pieces={['a','b','ab','aba','abab']} label="candidate dictionary"/><div className="dt-probe-skeleton"><span>fresh probe</span><svg viewBox="0 0 150 70" aria-hidden="true"><path d="M15 15L70 25M15 35L70 25M15 55L70 45M15 35L70 45M70 25L135 15M70 25L135 35M70 45L135 35M70 45L135 55" stroke="#aaa" fill="none"/>{[[15,15],[15,35],[15,55],[70,25],[70,45],[135,15],[135,35],[135,55]].map(([x,y])=><circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill="#c084fc"/>)}</svg><span>measured losses → prune</span></div><Strip pieces={['a','b','ab']} label="selected dictionary"/><span className="dt-stage-dot">fresh next probe → final model</span></div>
      <div className="dt-timeline-lane"><p>LiteToken: existing trained model</p><Matrix rows={[[1,0,0],[0,1,0],[0,0,1]]} identities={['cor','ruptions','corruption']} excluded={[1]} label="trained rows; exclude residue"/><Arrow label="gather retained rows"/><Matrix rows={[[1,0,0],[0,0,1]]} identities={['cor','corruption']} label="compacted existing rows"/><span className="dt-stage-dot">clean input + restrict output</span></div>
    </div><figcaption>The row/piece specimens are constructed anatomy; this timeline is not a performance plot or an online vocabulary update.</figcaption>
  </Drawing>;
}
export function SupermergeGroups() {
  const [text,setText]=useState('Tip of the hat');const trace=rankedTrace(text);
  const superStep=trace.history.find(step=>step.kind==='super');
  return <FlowLab id="dt-supermerge" label="Trace legal whole-pretoken supermerges">
    <Drawing name="supermerge" label="Bytes nested inside pretoken brackets and complete merged groups">
      <Groups groups={trace.initial} label="Original bytes inside regex pretokens"/>
      <Arrow label="Saved regular merges collapse groups"/>
      {superStep&&<><Groups groups={trace.history[trace.history.indexOf(superStep)-1].groups} selected=" of" label="Just before supermerge rank 5: both partner groups are complete"/><Arrow label="Rank 5: ␠of + ␠the → ␠of␠the"/></>}
      <Groups groups={trace.groups} label="Final groups under the constructed saved rules"/>
    </Drawing>
    <FlowControls><TextInput label="Text to encode" value={text} onChange={setText}/><FlowChoice label="Changed case" options={[["Tip of the hat","Phrase"],["Tip 123 hat","Digits"],["Tip of, the hat","Punctuation"],["","Empty"]]} value={text} onChange={setText}/><Reset onClick={()=>setText('Tip of the hat')}/></FlowControls>
    <FlowReadout data-model="supermerge">{trace.bytes} original UTF-8 bytes → {trace.pieces} pieces. {superStep?'Whole eligible ␠of/␠the groups join at saved rank 5.':'No applicable saved supermerge; boundaries remain.'}</FlowReadout>
  </FlowLab>;
}
export function MergeCompetition() {
  const [regular,setRegular]=useState(12),[superCount,setSuper]=useState(14),[pair,setPair]=useState(90),[tau,setTau]=useState(.9),[constituent,setConstituent]=useState('piece');
  const kind=superCount>=regular?'super':'regular';
  const result=mergeCompetition(regular,superCount,pair,100,120,tau,constituent==='byte',kind);
  return <FlowLab id="dt-competition" label="Compare merge counts and constituent IoS">
    <Drawing name="competition" label="Frequency bars and consumed portions of two constituent occurrence sets">
      <Bars label="Legal candidate frequencies" rows={[{label:'regular pair',value:regular,identity:'ab'},{label:'superpair',value:superCount,identity:' of the'}]} unit="occurrences" maximum={30}/>
      <div className="dt-winner">Selected kind: <strong>{result.winner??'none'}</strong>{result.tie?' — declared supermerge tie-break':''}</div>
      <p className="dt-label">{result.winner===null?'Separate constituent-count specimen is inactive: no candidate selected':`Separate constituent-count specimen for the selected ${kind==='super'?'supermerge':'regular merge'} kind`}</p>
      <div className="dt-columns-2"><Bars label="u: 100 total occurrences" rows={[{label:'consumed',value:pair,identity:'u'},{label:'remaining',value:100-pair,identity:'u'}]} maximum={120}/><Bars label="v: 120 total occurrences" rows={[{label:'consumed',value:pair,identity:'v'},{label:'remaining',value:120-pair,identity:'v'}]} maximum={120}/></div>
      <div className="dt-decision-row"><Piece piece={constituent==='byte'?'u':'uv'} excluded={result.deleteLeft} note={result.deleteLeft?'delete to bytes':'retain'}/><span>IoS(u)={pair}/100={number(result.leftIoS)}</span><span>IoS(v)={pair}/120={number(result.rightIoS)}</span></div>
    </Drawing>
    <FlowControls><FlowSlider name="Regular pair count" value={regular} onChange={setRegular} min={0} max={30} step={1}/><FlowSlider name="Superpair count" value={superCount} onChange={setSuper} min={0} max={30} step={1}/><FlowSlider name="Consumed pair occurrences" value={pair} onChange={setPair} min={0} max={100} step={1}/><FlowSlider name="Strict deletion threshold τ" value={tau} onChange={setTau} min={0} max={1} step={.05}/><FlowChoice label="Constituent" options={[["piece","Non-base piece"],["byte","Base byte"]]} value={constituent} onChange={setConstituent}/><Reset onClick={()=>{setRegular(12);setSuper(14);setPair(90);setTau(.9);setConstituent('piece');}}/></FlowControls>
    <FlowReadout data-model="competition">{result.winner===null?'No observed candidate: no merge or deletion occurs.':<>Count competition chooses {result.winner}. The separate constituent fixture {kind==='super'?'does not delete after a supermerge':constituent==='byte'?'protects the base byte':result.deleteLeft?'deletes u because its IoS strictly exceeds τ':'retains u because its IoS does not strictly exceed τ'}. Equality uses retention in this strict reference.</>}</FlowReadout>
  </FlowLab>;
}
export function RankedReplay() {
  const [text,setText]=useState('Tip of the hat'),[fixture,setFixture]=useState('phrase'),[step,setStep]=useState(11);
  const trace=rankedTrace(text,fixture==='delete'?DELETE_RULES:HAND_RULES),index=Math.min(step,trace.history.length-1),active=trace.history[index];
  const changeFixture=value=>{setFixture(value);setText(value==='delete'?'ab':'Tip of the hat');setStep(value==='delete'?2:11);};
  return <FlowLab id="dt-ranked" label="Replay chronological saved operations">
    <Drawing name="ranked" label="Increasing operation ranks point to the exact changing byte groups">
      <ol className="dt-rank-rail">{trace.history.map((state,i)=><li key={state.rank}><button type="button" aria-pressed={i===index} onClick={()=>setStep(i)}>rank {state.rank<0?'start':state.rank}<span>{state.kind}</span></button></li>)}</ol>
      <Arrow label={active.rule?`${active.rule.kind}: ${pieceLabel(active.rule.left)}${active.rule.right?' + '+pieceLabel(active.rule.right):''}`:'Start with bytes'}/>
      <Groups groups={active.groups} label={`State after ${active.rank<0?'byte initialization':`rank ${active.rank}`}`}/>
      <p className="dt-floor">Future search: ranks &gt; {active.rank}. Earlier ranks stay behind the floor.</p>
    </Drawing>
    <FlowControls><FlowChoice label="Saved-rule fixture" options={[["phrase","Phrase"],["delete","Merge then delete"]]} value={fixture} onChange={changeFixture}/><TextInput label="Replay input" value={text} onChange={setText}/><FlowSlider name="Visible applied event" value={index} onChange={setStep} min={0} max={trace.history.length-1} step={1}/><Reset onClick={()=>changeFixture('phrase')}/></FlowControls>
    <FlowReadout data-model="ranked">{trace.history.length-1} applicable saved operations; final strip {trace.groups.flat().map(pieceLabel).join(' | ')||'∅'}. {fixture==='delete'?'Deleted ab returns to a|b; rank 0 is never reconsidered.':'All original bytes remain in order.'}</FlowReadout>
  </FlowLab>;
}
export function PathLattice() {
  const [text,setText]=useState('abab'),[abWeight,setAbWeight]=useState(.4),[objective,setObjective]=useState('best'),[alpha,setAlpha]=useState(1),[seed,setSeed]=useState(13),[coverage,setCoverage]=useState('complete');
  const weights=[...LATTICE_WEIGHTS];weights[2]=abWeight;
  const lattice=unigramLattice(text,weights,coverage==='missing'?['a','ab','aba','abab']:[]);
  const sampled=seededSample(lattice.paths,alpha,seed),chosen=objective==='minimum'?lattice.minimum:objective==='sample'?sampled?.edges:lattice.best;
  const selected=new Set((chosen||[]).map(edge=>`${edge.start}:${edge.end}:${edge.piece}`));
  const width=Math.max(340,(lattice.raw.length+1)*85),height=240;
  return <FlowLab id="dt-lattice" label="Inspect complete Unigram paths and their probabilities">
    <Drawing name="lattice" label="Position nodes and labelled piece/probability edges">
      <div className="dt-svg-scroll" tabIndex={0} aria-label="Segmentation lattice; horizontally scroll when needed"><svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Byte positions 0 to ${lattice.raw.length}; ${lattice.paths.length} complete paths`}>
        <defs><marker id="dt-lattice-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#a3a3a3"/></marker></defs>
        {lattice.edges.flat().map((edge,k)=>{const x1=30+edge.start*85,x2=30+edge.end*85,level=35+edge.piece.length*24,marked=selected.has(`${edge.start}:${edge.end}:${edge.piece}`);return <path key={k} data-lattice-edge={`${edge.start}-${edge.end}-${edge.piece}`} d={`M${x1} 195 Q${(x1+x2)/2} ${195-level*2} ${x2} 195`} fill="none" stroke={pieceColour(edge.piece)} strokeWidth={marked?3:1.4} opacity={marked?1:.7} markerEnd="url(#dt-lattice-arrow)"/>;})}
        {lattice.edges.flat().map((edge,k)=>{const x1=30+edge.start*85,x2=30+edge.end*85,level=35+edge.piece.length*24;return <text className="dt-edge-label" key={k} x={(x1+x2)/2} y={187-level} textAnchor="middle" fill={pieceColour(edge.piece)}>{pieceLabel(edge.piece)} · {number(edge.probability,3)}</text>;})}
        {Array.from({length:lattice.raw.length+1},(_,i)=><g key={i}><circle cx={30+i*85} cy="195" r="13" fill="#191919" stroke="#bbb"/><text x={30+i*85} y="200" textAnchor="middle" fill="#eee">{i}</text>{i<lattice.raw.length&&<text x={72+i*85} y="228" textAnchor="middle" fill="#ddd">{pieceLabel(lattice.raw[i])}</text>}</g>)}
      </svg></div>
      <Strip pieces={(chosen||[]).map(edge=>edge.piece)} label={objective==='best'?'Maximum-product path':objective==='minimum'?'Minimum-count path':'Seeded posterior-weight sample'}/>
      <div className="dt-path-list">{lattice.paths.map((path,i)=><div key={i}><Strip pieces={path.pieces}/><span>weight {number(path.weight,6)} · posterior {number(path.posterior,4)}</span></div>)}</div>
      <p className="dt-exact">Total weight Z={number(lattice.marginal,6)}; expected ab count={number(lattice.covered?(lattice.expected.ab??0):null)}.</p>
    </Drawing>
    <FlowControls><FlowChoice label="Input" options={[["abab","abab"],["aba","aba"],["ab","ab"],["","Empty"]]} value={text} onChange={setText}/><FlowSlider name="Unnormalized ab weight" value={abWeight} onChange={setAbWeight} min={.01} max={.8} step={.01}/><FlowChoice label="Objective" options={[["best","Maximum product"],["minimum","Fewest pieces"],["sample","Sample paths"]]} value={objective} onChange={setObjective}/><FlowSlider name="Sampling α" value={alpha} onChange={setAlpha} min={.1} max={2} step={.1}/><FlowSlider name="Sample seed" value={seed} onChange={setSeed} min={1} max={40} step={1}/><FlowChoice label="Coverage" options={[["complete","Complete"],["missing","Remove all a-starting pieces"]]} value={coverage} onChange={setCoverage}/><Reset onClick={()=>{setText('abab');setAbWeight(.4);setObjective('best');setAlpha(1);setSeed(13);setCoverage('complete');}}/></FlowControls>
    <FlowReadout data-model="lattice">{lattice.covered?`${lattice.paths.length} complete paths; ${chosen?.length??0} selected pieces. All positive weights are normalized across the dictionary before paths are scored.`:'No complete segmentation: the initial a cannot be covered. No best path or posterior exists.'} {text===''?'The empty path has weight 1.':''}</FlowReadout>
  </FlowLab>;
}
export function ProbeLoss() {
  const [probability,setProbability]=useState(.5),[count,setCount]=useState(4);const stats=lossStatistics(probability,count);
  return <FlowLab id="dt-loss" label="Trace causal targets and per-occurrence loss">
    <Drawing name="loss" label="Shifted input/targets, probability allocation and loss aggregation">
      <div className="dt-shift-grid"><span>input</span>{['BOS','ab','ab'].map((piece,i)=><Piece piece={piece} key={i} note={`position ${i}`}/>)}<span>next target</span>{['ab','ab','EOS'].map((piece,i)=><Piece piece={piece} key={i} note={`prediction ${i}`}/>)}</div>
      <Bars label="Selected prediction's probability mass" rows={[{label:'true ab',value:probability,identity:'ab'},{label:'other IDs',value:1-probability,identity:'other'}]} unit="probability" maximum={1}/>
      <div className="dt-loss-occurrences">{Array.from({length:count},(_,i)=><div key={i}><Piece piece="ab"/><span>−ln({number(probability)}) = {number(stats.one)} nats</span></div>)}</div>
      <div className="dt-equation">count {count} × loss {number(stats.one)} → sum {number(stats.sum)} nats → mean {number(stats.mean)} nats</div>
    </Drawing>
    <FlowControls><FlowSlider name="True-target probability" value={probability} onChange={setProbability} min={0} max={1} step={.05}/><FlowSlider name="Observed ab occurrences" value={count} onChange={setCount} min={0} max={8} step={1}/><Reset onClick={()=>{setProbability(.5);setCount(4);}}/></FlowControls>
    <FlowReadout data-model="loss">{count===0?'No observed ab targets: sum/mean difficulty are unknown in this feedback view.':probability===0?'Zero target probability has infinite mathematical loss.':`${count} targets contribute ${number(stats.sum)} nats; mean difficulty ${number(stats.mean)} nats. Doubling count at fixed probability doubles sum, not mean.`}</FlowReadout>
  </FlowLab>;
}
export function AdaptivePriority() {
  const [count,setCount]=useState(4),[sum,setSum]=useState(8),[beta,setBeta]=useState(.5);const current=adaptivePriority(count,sum,4,beta),other=adaptivePriority(2,8,0,beta),study=useStudy();
  return <FlowLab id="dt-priority" label="Compare feedback priority, unnormalized momentum and measured rounds">
    <Drawing name="priority" label="Counts/losses select survivors and fresh measured probe rounds">
      <div className="dt-priority-rows"><div style={style('A')}><Piece piece="A"/><span>count a={count}</span><span>sum b={sum}</span><span>mean {number(current.mean)}</span><span>score {number(current.score)}</span><span>m={number(beta)}×4+score={number(current.momentum)}</span></div><div style={style('B')}><Piece piece="B"/><span>count a=2</span><span>sum b=8</span><span>mean {number(other.mean)}</span><span>score {number(other.score)}</span><span>first-round m={number(other.momentum)}</span></div></div>
      <Arrow label="Retain high-priority candidates; protect base bytes"/>
      <Strip pieces={count===0||current.momentum<other.momentum?['B','a','b']:['A','a','b']} label="Constructed survivor specimen (a/b protected)"/>
      <StudyStatus study={study}/>{study.data&&<div className="dt-measured-rounds">{study.data.adaptive.rounds.map(round=><div key={round.round}><span>fresh probe {round.round} · vocabulary {round.vocab_before}</span><div className="dt-row-count"><span style={{width:`${100*round.vocab_before/384}%`}}/></div><span>test {number(round.test.bits_per_byte)} bits/byte · {round.test.targets_including_eos} targets</span></div>)}</div>}
    </Drawing>
    <FlowControls><FlowSlider name="Candidate A count" value={count} onChange={setCount} min={0} max={12} step={1}/><FlowSlider name="Candidate A loss sum" value={sum} onChange={setSum} min={0} max={24} step={.5}/><FlowSlider name="Previous-score coefficient β" value={beta} onChange={setBeta} min={0} max={.95} step={.05}/><Reset onClick={()=>{setCount(4);setSum(8);setBeta(.5);}}/></FlowControls>
    <FlowReadout data-model="priority">{count===0?'A is unobserved; its difficulty and current priority are unknown.':sum===0?'All observed A losses are zero; the stated frequency/log-loss priority has an infinite limit.':`A score ${number(current.score)}, prior-score contribution ${number(beta*4)}, momentum ${number(current.momentum)}. λ stays 1; any common positive rescaling cannot change ranking.`}</FlowReadout>
  </FlowLab>;
}

function TreeNode({node,selected,onSelect,excluded=[]}) {
  return <div className="dt-tree-node" data-tree-piece={node.piece}><Piece piece={node.piece} selected={selected===node.piece} excluded={excluded.includes(node.piece)} onClick={onSelect?()=>onSelect(node.piece):undefined}/>
    {node.left&&<div className="dt-tree-children"><TreeNode node={node.left} selected={selected} onSelect={onSelect} excluded={excluded}/><TreeNode node={node.right} selected={selected} onSelect={onSelect} excluded={excluded}/></div>}
  </div>;
}
export function ResidueTree() {
  const [word,setWord]=useState('includes'),[selected,setSelected]=useState('includ'),[final,setFinal]=useState(2),[descendant,setDescendant]=useState(30),[protectedPiece,setProtected]=useState(false);
  const tree=bpeTrees(word,INCLUD_RULES)[0],result=residueDecision(final,descendant,[1,1],[2],.2,1.5,protectedPiece);
  return <FlowLab id="dt-residue-tree" label="Inspect actual merge descendants and final-use ratio">
    <Drawing name="residue-tree" label="Branching actual includ-family occurrence ancestry with final/descendant counts">
      <div className="dt-tree-scroll" tabIndex={0} aria-label="Merge tree; scroll when needed"><TreeNode node={tree} selected={selected} onSelect={setSelected} excluded={result.excluded?['includ']:[]}/></div>
      <div className="dt-columns-2"><Bars label="Constructed includ use counts" rows={[{label:'final F₁',value:final,identity:'includ'},{label:'descendant F₂',value:descendant,identity:'includ'}]} unit="occurrences"/><div><p className="dt-label">Larger final roots consume this piece</p><Strip pieces={['include','includes','including']}/><p>Native fixture: 12 + 8 + 10 consumed includ occurrences; two final includ occurrences.</p><span className="dt-equation">R={final}/({final}+{descendant})={number(result.ratio)}</span></div></div>
    </Drawing>
    <FlowControls><FlowChoice label="Actual occurrence tree" options={[["include","include"],["includes","includes"],["including","including"]]} value={word} onChange={value=>{setWord(value);setSelected('includ');}}/><FlowSlider name="Final includ occurrences F₁" value={final} onChange={setFinal} min={0} max={16} step={1}/><FlowSlider name="Consumed includ occurrences F₂" value={descendant} onChange={setDescendant} min={0} max={40} step={1}/><FlowChoice label="Protection" options={[[false,"Ordinary piece"],[true,"Treat as protected"]]} value={protectedPiece} onChange={setProtected}/><Reset onClick={()=>{setWord('includes');setSelected('includ');setFinal(2);setDescendant(30);setProtected(false);}}/></FlowControls>
    <FlowReadout data-model="residue-tree">Selected actual node {pieceLabel(selected)}. {result.ratio===null?'No final or consumed observations: ratio unknown.':`includ ratio ${number(result.ratio)}; contextual specimen has Hleft=1, Hright=0 bits. ${result.excluded?'Candidate excluded at .2/1.5.':protectedPiece?'Protected: retain.':'Ratio exceeds .2: retain.'}`}</FlowReadout>
  </FlowLab>;
}
export function NeighborEntropy() {
  const [left,setLeft]=useState('two'),[right,setRight]=useState('fixed'),[r,setR]=useState(.2),[s,setS]=useState(1.5);
  const counts={fixed:[4,0,0,0],two:[2,2,0,0],diverse:[1,1,1,1],none:[0,0,0,0]};
  const result=residueDecision(2,30,counts[left],counts[right],r,s);
  return <FlowLab id="dt-entropy" label="Compare both final-neighbor entropies before exclusion">
    <Drawing name="entropy" label="Actual counted neighbor distributions and minimum-side entropy">
      <div className="dt-neighbor-anatomy"><Strip pieces={['left','includ','right']} selected="includ" label="Only final emitted neighbors supply these counts"/></div>
      <div className="dt-columns-2"><Bars label={`Left neighbors: H=${number(result.leftEntropy)} bits`} rows={counts[left].map((value,i)=>({label:['x','y','z','w'][i],value,identity:['x','y','z','w'][i]}))} maximum={4}/><Bars label={`Right neighbors: H=${number(result.rightEntropy)} bits`} rows={counts[right].map((value,i)=>({label:['?','!','.',';'][i],value,identity:['?','!','.',';'][i]}))} maximum={4}/></div>
      <div className="dt-decision-row"><Piece piece="includ" excluded={result.excluded} note={result.excluded?'exclude':'retain'}/><span>R=.0625</span><span>S=min(HL,HR)={number(result.minimum)} bits</span><span>R≤{number(r)} AND S≤{number(s)}</span></div>
    </Drawing>
    <FlowControls><FlowChoice label="Left counts" options={[["fixed","One neighbor"],["two","Two equal"],["diverse","Four equal"],["none","Unobserved"]]} value={left} onChange={setLeft}/><FlowChoice label="Right counts" options={[["fixed","One neighbor"],["two","Two equal"],["diverse","Four equal"],["none","Unobserved"]]} value={right} onChange={setRight}/><FlowSlider name="Final-use threshold r" value={r} onChange={setR} min={0} max={1} step={.025}/><FlowSlider name="Entropy threshold s (bits)" value={s} onChange={setS} min={0} max={2.5} step={.1}/><Reset onClick={()=>{setLeft('two');setRight('fixed');setR(.2);setS(1.5);}}/></FlowControls>
    <FlowReadout data-model="entropy">{result.minimum===null?'Missing final-neighbor observations: entropy unknown, so retain under the declared policy.':result.excluded?`Both exclusion comparisons pass. The lower-entropy side controls S=${number(result.minimum)} bits.`:`Retain: ${result.ratio>r?'the final-use ratio exceeds r':'contextual diversity exceeds s'}. Low frequency alone is insufficient.`}</FlowReadout>
  </FlowLab>;
}
export function SplitAndRemerge() {
  const [text,setText]=useState('corruptions'),[exclusions,setExclusions]=useState('both');
  const removed=exclusions==='both'?['ruption','ruptions']:exclusions==='outer'?['ruptions']:[];
  const trace=cleanupTrace(text,removed);
  return <FlowLab id="dt-cleanup" label="Split actual excluded roots and re-merge exposed boundaries">
    <Drawing name="cleanup" label="Byte-position-aligned original, split-only and re-merged strips">
      <div className="dt-aligned-scroll" tabIndex={0} aria-label="Byte-aligned cleanup strips; scroll all stages together">
        <div className="dt-byte-ruler" style={{width:`${Math.max(1,trace.bytes)*2.3}rem`}}>{Array.from(byteString(text),(byte,i)=><span key={i}>{pieceLabel(byte)}<small>{i}</small></span>)}</div>
        <AlignedStrip nodes={trace.original} label={`Original · ${trace.original.length} pieces`} excluded={removed} bytes={trace.bytes}/>
        <Arrow label="Recursively split only emitted excluded roots"/>
        <AlignedStrip nodes={trace.split} label={`Split-only · ${trace.split.length} pieces`} bytes={trace.bytes}/>
        <Arrow label="Surviving rules re-merge across exposed boundaries"/>
        <AlignedStrip nodes={trace.remerged} label={`Re-merged · ${trace.remerged.length} pieces`} bytes={trace.bytes}/>
      </div>
      <div className="dt-surviving-rules"><span>rank 9</span><Strip pieces={['cor','ru']}/><span>→</span><Piece piece="corru"/><span>rank 10</span><Strip pieces={['corru','ption']}/><span>→</span><Piece piece="corruption"/></div>
    </Drawing>
    <FlowControls><TextInput label="Cleanup text" value={text} onChange={setText} maxLength={24}/><FlowChoice label="Excluded pieces" options={[["both","ruptions + ruption"],["outer","Only ruptions"],["none","None"]]} value={exclusions} onChange={setExclusions}/><FlowChoice label="Text contrast" options={[["corruptions","corruptions"],["corruption","corruption"],["cor","cor"],["","Empty"]]} value={text} onChange={setText}/><Reset onClick={()=>{setText('corruptions');setExclusions('both');}}/></FlowControls>
    <FlowReadout data-model="cleanup">{trace.original.length} → {trace.split.length} → {trace.remerged.length} pieces over {trace.bytes} unchanged bytes. {exclusions==='none'?'No exclusions: all strips unchanged.':trace.remerged.length<trace.split.length?'Surviving ranks repair fragmentation at the exposed boundary.':'No additional surviving-rule repair is applicable.'}</FlowReadout>
  </FlowLab>;
}
export function RowCompaction() {
  const [retained,setRetained]=useState([0,2,4]),[tied,setTied]=useState(false),[error,setError]=useState('');
  const result=compactModel(retained,tied),removed=[0,1,2,3,4].filter(id=>!retained.includes(id));
  const toggle=id=>{if(id===0){setError('ID 0 is protected in this fixture.');return;}const next=retained.includes(id)?retained.filter(value=>value!==id):[...retained,id].sort((a,b)=>a-b);setRetained(next);setError('');};
  const output=tied?INPUT_ROWS:OUTPUT_ROWS;
  return <FlowLab id="dt-rows" label="Gather matching input/output rows and compare masked softmax">
    <Drawing name="rows" label="Original and compacted row matrices use one ordered ID map">
      <div className="dt-columns-2"><Matrix rows={INPUT_ROWS} identities={DICTIONARY} excluded={removed} label="Original E: five old IDs"/><Matrix rows={output} identities={DICTIONARY} excluded={removed} label={tied?'Original W shares E weights':'Original W: separate output rows'}/></div>
      <div className="dt-map-line">{retained.map((id,newId)=><span style={style(DICTIONARY[id])} key={id}>old {id} → new {newId}</span>)}</div>
      <Arrow label="Gather E, W and bias using the same old-ID order"/>
      <div className="dt-columns-2"><Matrix rows={result.input} identities={retained.map(id=>DICTIONARY[id])} label="E′: compact input IDs"/><Matrix rows={result.output} identities={retained.map(id=>DICTIONARY[id])} label={tied?'W′ shares the same compact Parameter':'W′: compact output rows'}/></div>
      <div className="dt-bias-line"><span>gathered bias</span>{result.bias.map((bias,i)=><span key={i} style={style(DICTIONARY[retained[i]])}>new {i}: {number(bias)}</span>)}<span>h={vector(HIDDEN)}</span></div>
      <Bars label="Original unrestricted probability" rows={result.probabilities.map((value,id)=>({label:`old ${id}`,value,identity:DICTIONARY[id]}))} unit="probability" maximum={1}/>
      <Bars label="Masked old rows = compacted probabilities" rows={result.compacted.map((value,i)=>({label:`old ${retained[i]} / new ${i}`,value,identity:DICTIONARY[retained[i]]}))} unit="probability" maximum={1}/>
    </Drawing>
    <FlowControls><FlowChoice label="Input/output weights" options={[[false,"Untied"],[true,"Tied"]]} value={tied} onChange={setTied}/><div className="dt-retained-controls"><span>Retain old IDs (0 protected)</span>{[0,1,2,3,4].map(id=><button type="button" key={id} aria-pressed={retained.includes(id)} onClick={()=>toggle(id)}>ID {id}</button>)}</div><Reset onClick={()=>{setRetained([0,2,4]);setTied(false);setError('');}}/></FlowControls>
    {error&&<p role="alert">{error}</p>}<FlowReadout data-model="rows">Keep [{retained.join(', ')}]: {result.parametersBefore} → {result.parametersAfter} actual row/bias parameters under this {tied?'shared':'separate'}-weight convention. Retained logits [{result.selected.map(value=>number(value)).join(', ')}] match gathering; probabilities renormalize.</FlowReadout>
  </FlowLab>;
}
export function PrefixState() {
  const [second,setSecond]=useState(1),[version,setVersion]=useState('v1');const oldIds=[0,2,4],newIds=[0,second,4],result=prefixState(oldIds,newIds,'v1',version);
  return <FlowLab id="dt-prefix" label="Check exact preceding ID/version dependencies of position state">
    <Drawing name="prefix" label="Old and changed token prefixes align with position-indexed state cells">
      <div className="dt-columns-2">{[['old v1',result.old],['new '+version,result.next]].map(([label,states])=><div key={label}><p className="dt-label">{label}</p><div className="dt-prefix-cells">{states.map(state=><div key={state.position} className={state.position<result.reusable?'is-reusable':'is-invalid'}><Piece piece={DICTIONARY[state.id]} note={`ID ${state.id} · position ${state.position}`}/><span>K {vector(state.key)}</span><span>V {vector(state.value)}</span><small>{state.position<result.reusable?'matching prefix':'recompute / incompatible'}</small></div>)}</div></div>)}</div>
      <div className="dt-prefix-dependency"><span>position 0</span><svg viewBox="0 0 100 18" aria-hidden="true"><path d="M2 9H98M91 3L98 9L91 15" fill="none" stroke="currentColor"/></svg><span>position 1</span><svg viewBox="0 0 100 18" aria-hidden="true"><path d="M2 9H98M91 3L98 9L91 15" fill="none" stroke="currentColor"/></svg><span>position 2 inherits earlier context</span></div>
    </Drawing>
    <FlowControls><FlowSlider name="New second ID" value={second} onChange={setSecond} min={0} max={4} step={1}/><FlowChoice label="New model/state version" options={[["v1","v1 compatible"],["v2","v2 incompatible"]]} value={version} onChange={setVersion}/><Reset onClick={()=>{setSecond(1);setVersion('v1');}}/></FlowControls>
    <FlowReadout data-model="prefix">{result.reusable} of 3 positions have an identical prefix under the compatible version. {version!=='v1'?'Changed version invalidates all reuse.':second===2?'All IDs match.':'The final ID 4 cannot recover old state after the earlier changed ID.'} K/V here are explicitly defined cumulative-vector analogies.</FlowReadout>
  </FlowLab>;
}
export function MetricsComparison() {
  const [bytes,setBytes]=useState(8),[nll,setNll]=useState(4),[targets,setTargets]=useState(4),study=useStudy();
  const baseline=tokenMetrics(bytes,nll,2),changed=tokenMetrics(bytes,nll,targets);
  return <FlowLab id="dt-metrics" label="Compare token denominators with the same byte-normalized loss">
    <Drawing name="metrics" label="Same bytes/likelihood yield different token PPL at different target counts">
      <p className="dt-label">Original byte event: {bytes} bytes</p><div className="dt-byte-ruler" data-byte-count={bytes}>{bytes?Array.from({length:bytes},(_,i)=><span key={i}>{String.fromCharCode(97+i)}<small>{i}</small></span>):<span>∅ no bytes</span>}</div>
      <div className="dt-columns-2"><div><p className="dt-label">Constructed baseline: 2 scored targets</p><div className="dt-position-count"><span>1</span><span>2</span></div><p>L={number(nll)} nats · B={bytes} bytes</p><p>exp(L/2)={number(baseline.perplexity)}</p><p>bits/byte={number(baseline.bitsPerByte)}</p></div><div><div className="dt-position-count">{Array.from({length:targets},(_,i)=><span key={i}>{i+1}</span>)}</div><p>{targets} scored targets (count comparison)</p><p>exp(L/T)={number(changed.perplexity)}</p><p>bits/byte={number(changed.bitsPerByte)}</p></div></div>
      <Bars label="Token perplexity changes with its denominator" rows={[{label:'T=2',value:baseline.perplexity,identity:'two'},{label:`T=${targets}`,value:changed.perplexity,identity:'changed'}]} unit="PPL"/>
      <StudyStatus study={study}/>{study.data&&<div className="dt-study-comparison"><p className="dt-label">Actual 4,996-byte held-out corpus; ordinary library pieces</p><Bars rows={[{label:'ByteLevel BPE',value:study.data.libraries.bytelevel_bpe.test.tokens,identity:'BPE'},{label:'SP Unigram',value:study.data.libraries.sentencepiece_unigram.test.tokens,identity:'Unigram'}]} label="Observed configuration-specific counts" unit="pieces"/></div>}
    </Drawing>
    <FlowControls><FlowSlider name="Original UTF-8 bytes B" value={bytes} onChange={setBytes} min={0} max={16} step={1}/><FlowSlider name="Total negative log-likelihood L (nats)" value={nll} onChange={setNll} min={0} max={8} step={.5}/><FlowSlider name="Changed scored targets T" value={targets} onChange={setTargets} min={0} max={8} step={1}/><Reset onClick={()=>{setBytes(8);setNll(4);setTargets(4);}}/></FlowControls>
    <FlowReadout data-model="metrics">Same L/B: {changed.bitsPerByte===null?'bits/byte is n/a at zero bytes':`${number(changed.bitsPerByte)} bits/byte in both comparisons`}. Changed token PPL {changed.perplexity===null?'is n/a at zero targets':`is ${number(changed.perplexity)}`}. A changed token denominator alone does not establish better byte prediction.</FlowReadout>
  </FlowLab>;
}
export function BudgetRows() {
  const [added,setAdded]=useState(3),[width,setWidth]=useState(4),[tied,setTied]=useState(false);const result=rowBudget(added,width,8,5,tied);
  return <FlowLab id="dt-budget" label="Allocate stable IDs inside a hypothetical bounded row budget">
    <Drawing name="budget" label="Existing trained rows, untrained appended rows and finite allocation boundary">
      <p className="dt-label">Capacity 8 rows; 5 existing IDs remain stable</p><div className="dt-budget-grid">{Array.from({length:8},(_,id)=><div key={id} className={id<5?'is-trained':id<5+result.accepted?'is-untrained':'is-free'} style={style(String(id))}><span>ID {id}</span><div>{Array.from({length:width},(_,j)=><span key={j}>{id<5?(id+j)%2:id<5+result.accepted?'?':'·'}</span>)}</div><small>{id<5?'existing trained':id<5+result.accepted?'appended untrained':'free capacity'}</small></div>)}</div>
      <div className="dt-equation">Accepted k={result.accepted}, d={width}: {tied?`${result.accepted}·${width} + ${result.accepted}`:`2·${result.accepted}·${width} + ${result.accepted}`} = {result.parameters} appended row/bias parameters</div>
    </Drawing>
    <FlowControls><FlowSlider name="Requested new pieces k" value={added} onChange={setAdded} min={0} max={6} step={1}/><FlowSlider name="Row width d" value={width} onChange={setWidth} min={2} max={8} step={1}/><FlowChoice label="Weight storage" options={[[false,"Untied"],[true,"Tied"]]} value={tied} onChange={setTied}/><Reset onClick={()=>{setAdded(3);setWidth(4);setTied(false);}}/></FlowControls>
    <FlowReadout data-model="budget">Requested {added}; {result.accepted} fit within {result.available} free rows. {result.exhausted?'Budget exhausted: extra requested IDs cannot be allocated.':added===0?'No append; IDs and row allocation stay unchanged.':'Appended rows are untrained, so spelling coverage does not imply learned probabilities.'} This is a hypothetical protocol, not a named paper's serving implementation.</FlowReadout>
  </FlowLab>;
}
