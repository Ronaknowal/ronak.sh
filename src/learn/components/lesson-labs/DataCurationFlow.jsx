import { useEffect, useState } from 'react';
import { FlowControls, FlowSlider, FlowChoice, FlowReadout, flowNumber as n } from './LessonFlow.jsx';
import { CURATION_COLORS as C, comparisonKey, shingles, overlap, ORDERS, SET_A, SET_B, minHashTrace, signatureSE, candidateProbability, halfCrossing, bandMatches, retention, BLOOM_ADDRESSES, bloomTrace, bloomBudget, bloomRate, semanticTrace } from '../../data/data-curation-models.js';
import './data-curation-flow.css';

const letters = ['A','B','C','D'];
const colorOf = text => C[[...text].reduce((sum,c)=>sum+c.codePointAt(0),0)%C.length];
function Figure({name,label,children,caption}) { return <figure className="curation-figure" data-curation-figure={name} aria-label={label}>{children}{caption&&<figcaption>{caption}</figcaption>}</figure>; }
function Scroll({children,label}) { return <div className="curation-scroll" tabIndex={0} role="region" aria-label={label}>{children}</div>; }
function Piece({children,color,selected=false}) { return <span className={`curation-piece${selected?' is-selected':''}`} style={{'--piece-color':color||colorOf(String(children))}}>{children}</span>; }
function Bar({label,value,max=1,color=C[0],suffix=''}) { return <div className="curation-bar"><span>{label}</span><span className="curation-bar-track"><i style={{width:`${100*Math.min(1,Math.max(0,value/max))}%`,background:color}} /></span><output>{n(value,4)}{suffix}</output></div>; }
function Plot({series,point,xLabel,yLabel,xMin=0,xMax=1,yMax=1}) {
  const x=v=>50+(v-xMin)/(xMax-xMin)*460, y=v=>205-v/yMax*165;
  return <Scroll label={`${yLabel} against ${xLabel}`}><svg className="curation-chart" viewBox="0 0 560 260" role="img" aria-label={`${yLabel} against ${xLabel}`}>
    <path d="M50 35V205H520" fill="none" stroke="#8f8f8f" />
    {[0,.5,1].map(t=><g key={t}><path d={`M50 ${y(t*yMax)}H520`} stroke="#444" strokeDasharray="3 5"/><text x="42" y={y(t*yMax)+4} textAnchor="end">{n(t*yMax,3)}</text><text x={x(xMin+t*(xMax-xMin))} y="227" textAnchor="middle">{n(xMin+t*(xMax-xMin),3)}</text></g>)}
    <text x="50" y="22">{yLabel}</text><text x="280" y="251" textAnchor="middle">{xLabel}</text>
    {series.map(({values,color,label})=><polyline key={label} points={values.map(([a,b])=>`${x(a)},${y(b)}`).join(' ')} fill="none" stroke={color} strokeWidth="2.5"><title>{label}</title></polyline>)}
    {point&&<g><line x1={x(point[0])} x2={x(point[0])} y1="35" y2="205" stroke="#fff" strokeDasharray="4 4"/><circle cx={x(point[0])} cy={y(point[1])} r="5" fill="#202020" stroke="#fff" strokeWidth="2"/></g>}
  </svg></Scroll>;
}

export function WeightLab() {
  const [copies,setCopies]=useState(4);
  return <Figure name="weights" label="Repeated records change equal-record sampling weight" caption="Document hue tracks content family; labels distinguish copies. Equal-size, equal-record sampling is assumed here.">
    <div className="curation-records">{Array.from({length:copies},(_,i)=><div className="curation-document" style={{'--piece-color':C[0]}} key={i}><strong>A{i+1}</strong><i/><i/><i/><span>same article</span></div>)}{['B','C'].map((id,i)=><div className="curation-document" style={{'--piece-color':C[i+1]}} key={id}><strong>{id}1</strong><i/><i/><span>different article</span></div>)}</div>
    <Bar label="A · before" value={copies/(copies+2)} color={C[0]}/><Bar label="A · one per family" value={1/3} color={C[0]}/>
    <FlowControls><FlowSlider name="Copies of article A" value={copies} onChange={setCopies} min={1} max={8} step={1}/><button onClick={()=>setCopies(4)}>Reset</button></FlowControls>
    <FlowReadout>A receives <strong>{copies}/{copies+2}</strong> of original draws; after retaining one per family it receives <strong>1/3</strong>. {copies===1?'No duplicate changes this distribution.':''}</FlowReadout>
  </Figure>;
}
export function ExtractionFigure() {
  return <Figure name="extraction" label="HTML branches and retained article text" caption="This controlled tree has a known article element. Retained spans correspond to its paragraph children.">
    <div className="curation-extraction"><svg viewBox="0 0 340 265" role="img" aria-label="Body branches to navigation, article and footer; article branches to two paragraphs and a script">
      <g fill="none" stroke="#777"><path d="M170 34V63H46V87M170 63V87M170 63H294V87M170 112V142H62V172M170 142V172M170 142H280V172"/></g>
      <g textAnchor="middle"><text x="170" y="28">body</text><text x="46" y="105" fill="#aaa">nav</text><text x="170" y="105" fill={C[0]}>article</text><text x="294" y="105" fill="#aaa">footer</text><text x="62" y="194" fill={C[1]}>p · Alice…</text><text x="170" y="194" fill={C[2]}>p · So she…</text><text x="280" y="194" fill="#aaa">script</text></g>
      <path d="M28 214H205" stroke="#fff" strokeWidth="2"/><text x="116" y="246" textAnchor="middle">retained paragraph spans</text>
    </svg><div className="curation-excerpt"><p><span style={{color:C[1]}}>Alice was beginning to get very tired…</span></p><p><span style={{color:C[2]}}>So she was considering in her own mind…</span></p><p className="curation-muted">Raw source and metadata remain available beside this derived text.</p></div></div>
  </Figure>;
}
export function ExactKeyLab() {
  const [fold,setFold]=useState(false),[text,setText]=useState('US  news');
  const keys=[comparisonKey(text,fold),comparisonKey('US news',fold),comparisonKey('us news',fold)];
  const [digests,setDigests]=useState([]);
  useEffect(()=>{let active=true; Promise.all(keys.map(async key=>{const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');})).then(values=>{if(active)setDigests(values);}).catch(()=>{if(active)setDigests(['Unavailable','Unavailable','Unavailable']);});return()=>{active=false;};},[text,fold]);
  return <Figure name="exact" label="Normalize keys, group actual digests, then compare full text" caption="The prefix is displayed for readability; the computation uses the full SHA-256 digest and full key equality. English case comparison in this browser example.">
    <div className="curation-keyrows">{[text,'US news','us news'].map((raw,i)=><div className="curation-keyrow" key={i}><strong style={{color:C[i]}}>record {letters[i]}</strong><code>{JSON.stringify(raw)}</code><span aria-hidden="true">→</span><code>{JSON.stringify(keys[i])}</code><code className="curation-digest" title={digests[i]}>{digests[i]?.slice(0,12)||'Hashing…'}</code></div>)}</div>
    <FlowControls><label className="curation-field">Record A text<input value={text} maxLength={80} onChange={e=>setText(e.target.value)}/></label><FlowChoice label="Case policy" options={[[false,'Preserve case'],[true,'Fold case']]} value={fold} onChange={setFold}/><button onClick={()=>{setText('US  news');setFold(false);}}>Reset</button></FlowControls>
    <FlowReadout>Full-key equality: A–B <strong>{keys[0]===keys[1]?'equal':'different'}</strong>; B–C <strong>{keys[1]===keys[2]?'equal':'different'}</strong>. {fold?'The US/us distinction has been removed by policy.':'Whitespace normalization preserves the case distinction.'}</FlowReadout>
  </Figure>;
}
export function ShingleLab() {
  const [text,setText]=useState('the dog sat down'),[width,setWidth]=useState(2);
  const a=shingles('the cat sat down',width),b=shingles(text,width),result=overlap(a.set,b.set);
  return <Figure name="shingles" label="Consecutive word windows become sets and overlap counts" caption="Identical labelled shingles keep their hue across both rows. Set membership collapses repeated windows.">
    <div className="curation-windowrows">{[['A','the cat sat down',a],['B',text,b]].map(([name,raw,data])=><div key={name}><p><strong>{name}</strong> · {raw||'(empty text)'}</p><div className="curation-windows">{data.windows.length?data.windows.map((piece,i)=><div className="curation-window" key={i}><small>positions {i}–{i+width-1}</small><Piece>{piece}</Piece></div>):<span>No complete windows</span>}</div></div>)}</div>
    <Scroll label="Shingle membership in each document"><table className="curation-table"><thead><tr><th>Shingle</th><th>A</th><th>B</th></tr></thead><tbody>{result.union.map(piece=><tr key={piece}><th><Piece>{piece}</Piece></th><td>{a.set.has(piece)?'1':'—'}</td><td>{b.set.has(piece)?'1':'—'}</td></tr>)}</tbody></table></Scroll>
    <FlowControls><label className="curation-field">Document B<input value={text} maxLength={70} onChange={e=>setText(e.target.value)}/></label><FlowSlider name="Words per shingle" min={1} max={4} step={1} value={width} onChange={setWidth}/><button onClick={()=>{setText('the dog sat down');setWidth(2);}}>Reset</button></FlowControls>
    <FlowReadout>Intersection <strong>{result.intersection.length}</strong>; union <strong>{result.union.length}</strong>; Jaccard <strong>{n(result.jaccard)}</strong>. Containment A→B <strong>{n(result.containmentA)}</strong>, B→A <strong>{n(result.containmentB)}</strong>. {!a.set.size||!b.set.size?'An empty shingle set needs a separate short-text policy.':''}</FlowReadout>
  </Figure>;
}
export function MinHashLab() {
  const [index,setIndex]=useState(0); const order=ORDERS[index],trace=minHashTrace(order);
  return <Figure name="minhash" label="One shared order produces first-present MinHash values" caption="The same shingle identity moves with the ordering. White outlines mark the first occupied row in each column.">
    <p>A = {'{a,b,c}'} · B = {'{b,c,d}'}</p><table className="curation-table curation-permutation"><thead><tr><th>Rank</th><th>Shingle</th><th>In A</th><th>In B</th></tr></thead><tbody>{order.map((item,i)=><tr key={item}><td>{i+1}</td><th><Piece color={C['abcd'.indexOf(item)]}>{item}</Piece></th><td className={item===trace.firstA?'curation-selected-cell':''}>{SET_A.has(item)?'1':'—'}</td><td className={item===trace.firstB?'curation-selected-cell':''}>{SET_B.has(item)?'1':'—'}</td></tr>)}</tbody></table>
    <div className="curation-signatures"><span>h(A) <Piece color={C['abcd'.indexOf(trace.firstA)]}>{trace.firstA}</Piece></span><span>h(B) <Piece color={C['abcd'.indexOf(trace.firstB)]}>{trace.firstB}</Piece></span></div>
    <FlowControls><FlowSlider name="Shared ordering" value={index} onChange={setIndex} min={0} max={23} step={1} format={v=>`${v+1} of 24`}/><button onClick={()=>setIndex(0)}>Reset</button></FlowControls>
    <FlowReadout>This ordering <strong>{trace.match?'matches':'does not match'}</strong>. Across all 24 orderings, <strong>{ORDERS.filter(p=>minHashTrace(p).match).length}</strong> match: exact probability 1/2.</FlowReadout>
  </Figure>;
}
export function SignatureLab() {
  const [count,setCount]=useState(128); const error=signatureSE(.5,count);
  const values=Array.from({length:64},(_,i)=>[(i+1)*8,signatureSE(.5,(i+1)*8)]);
  return <Figure name="signature-error" label="Ideal signature uncertainty falls with the square root of length" caption="This is the standard-error formula for independent ideal trials at J=.5, not a confidence guarantee for a particular hash family.">
    <div className="curation-trial-tally">{ORDERS.map((p,i)=><span key={i} data-match={minHashTrace(p).match} title={p.join(' → ')}>{i+1}{minHashTrace(p).match?' ✓':' ×'}</span>)}</div>
    <Plot series={[{values,color:C[2],label:'Ideal standard error'}]} point={[count,error]} xMin={8} xMax={512} yMax={.2} xLabel="Signature positions k" yLabel="Standard error at J=.5"/>
    <FlowControls><FlowSlider name="Signature positions" value={count} onChange={setCount} min={8} max={512} step={8}/><button onClick={()=>setCount(128)}>Reset</button></FlowControls>
    <FlowReadout>SE = √(.25/{count}) = <strong>{n(error)}</strong>. Quadrupling k halves this ideal standard error.</FlowReadout>
  </Figure>;
}
export function BandLab() {
  const [rows,setRows]=useState(4),[similarity,setSimilarity]=useState(.5);
  const bands=12/rows,groups=bandMatches(rows),p=candidateProbability(similarity,bands,rows);
  return <Figure name="bands" label="Band tuple equality creates candidates; the probability curve is separate" caption="Twelve constructed signature rows expose the buckets. The curve uses the ideal independent-row probability model; it is not a probability inferred from this one pair.">
    <div className="curation-bands">{groups.map(group=><div className="curation-band" key={group.band}><strong>band {group.band}</strong><div>A <code>{group.first.join(' · ')}</code></div><div>B <code>{group.second.join(' · ')}</code></div><div className={group.match?'curation-match':'curation-muted'}>{group.match?'↳ same bucket · candidate':'↳ different buckets'}</div></div>)}</div>
    <Plot series={[{label:'Candidate probability',color:C[2],values:Array.from({length:101},(_,i)=>[i/100,candidateProbability(i/100,bands,rows)])}]} point={[similarity,p]} xLabel="True Jaccard s" yLabel="Probability of candidate"/>
    <FlowControls><FlowChoice label="Twelve-row layout" options={[[4,'3 bands × 4 rows'],[2,'6 × 2'],[6,'2 × 6']]} value={rows} onChange={setRows}/><FlowSlider name="True similarity for curve" value={similarity} onChange={setSimilarity} min={0} max={1} step={.05}/><button onClick={()=>{setRows(4);setSimilarity(.5);}}>Reset</button></FlowControls>
    <FlowReadout>Literal pair: <strong>{groups.some(g=>g.match)?'candidate':'not retrieved'}</strong>. Ideal probability at s={n(similarity)}: <strong>{n(p)}</strong>; exact 50% crossing <strong>{n(halfCrossing(bands,rows))}</strong>.</FlowReadout>
  </Figure>;
}
export function ClusterLab() {
  const [threshold,setThreshold]=useState(.6),[policy,setPolicy]=useState('component');const result=retention(threshold,policy);
  const points=[[55,65],[170,180],[285,65]];
  return <Figure name="clusters" label="A chain of verified similarities is not a clique" caption="Solid violet edges pass the exact threshold. Dashed grey edges fail it. White outlines show retained records under the selected policy.">
    <svg className="curation-small-svg" viewBox="0 0 340 270" role="img" aria-label={`Retain ${result.kept.map(i=>letters[i]).join(', ')} at threshold ${threshold}`}>
      {result.edges.map(e=><g key={`${e.i}-${e.j}`}><line x1={points[e.i][0]} y1={points[e.i][1]} x2={points[e.j][0]} y2={points[e.j][1]} stroke={e.pass?C[2]:'#888'} strokeWidth={e.pass?3:1.5} strokeDasharray={e.pass?'':'5 5'}/><text x={(points[e.i][0]+points[e.j][0])/2+(e.i===0&&e.j===1?-28:e.i===1?28:0)} y={(points[e.i][1]+points[e.j][1])/2+(e.i===0&&e.j===2?-12:24)} textAnchor="middle">{e.score===1/3?'1/3':'2/3'}</text></g>)}
      {points.map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="24" fill="#202020" stroke={result.kept.includes(i)?'#fff':C[i]} strokeWidth={result.kept.includes(i)?3:1}/><text x={x} y={y+5} textAnchor="middle" fill={C[i]}>{letters[i]}</text><text x={x} y={y+49} textAnchor="middle">{['{1,2}','{1,2,3}','{2,3}'][i]}</text></g>)}
    </svg>
    <FlowControls><FlowSlider name="Jaccard threshold" value={threshold} onChange={setThreshold} min={.2} max={.9} step={.1}/><FlowChoice label="Keep policy · first ID wins" options={[['component','One per component'],['direct','Directly match a kept record']]} value={policy} onChange={setPolicy}/><button onClick={()=>{setThreshold(.6);setPolicy('component');}}>Reset</button></FlowControls>
    <FlowReadout><strong>{result.edges.filter(e=>e.pass).length}</strong> accepted edges; retain <strong>{result.kept.map(i=>letters[i]).join(', ')}</strong>. {policy==='component'?'Connectivity follows paths, not every pair.':'Every removal has a direct match to an already retained record.'}</FlowReadout>
  </Figure>;
}
export function BloomLab() {
  const [inserted,setInserted]=useState(['oak','elm','ash']),[query,setQuery]=useState('query-49'),[clear,setClear]=useState(false);
  const trace=bloomTrace(inserted,query,clear),addresses=BLOOM_ADDRESSES[query];
  return <Figure name="bloom-bits" label="Actual Bloom addresses, shared bits and a confirmed false positive" caption="Small colour ticks identify which inserted keys address a bit. Bit values are neutral 0/1; white query outlines preserve those identities.">
    <div className="curation-bitarray">{trace.bits.map((bit,i)=><div key={i} className={`curation-bit${addresses.includes(i)?' is-query':''}`}><small>{i}</small><strong>{bit?1:0}</strong><span className="curation-contributors">{['oak','elm','ash'].map((key,j)=>inserted.includes(key)&&BLOOM_ADDRESSES[key].includes(i)?<i key={key} style={{background:C[j]}} title={key}/>:null)}</span></div>)}</div>
    <div className="curation-hashroutes">{['oak','elm','ash'].map((key,i)=><p key={key}><Piece color={C[i]}>{key}</Piece> → {BLOOM_ADDRESSES[key].join(', ')} {inserted.includes(key)?'(inserted)':'(not inserted)'}</p>)}</div>
    <p>query <strong>{query}</strong> → {addresses.join(', ')} → <strong>{trace.positive?'all addressed bits are 1':'at least one addressed bit is 0'}</strong></p>
    <FlowControls><div className="curation-checkboxes" role="group" aria-label="Inserted keys">{['oak','elm','ash'].map(key=><label key={key}><input type="checkbox" checked={inserted.includes(key)} onChange={()=>setInserted(values=>values.includes(key)?values.filter(x=>x!==key):[...values,key])}/>{key}</label>)}</div><FlowChoice label="Query key" options={['query-49','query-0','oak','elm'].map(k=>[k,k])} value={query} onChange={setQuery}/><label className="curation-check"><input type="checkbox" checked={clear} onChange={e=>setClear(e.target.checked)}/>Clear oak's bits (unsafe deletion)</label><button onClick={()=>{setInserted(['oak','elm','ash']);setQuery('query-49');setClear(false);}}>Reset</button></FlowControls>
    <FlowReadout>Filter says <strong>{trace.positive?'possibly present':'absent'}</strong>. Exact insertion record: <strong>{trace.actuallyPresent?'present':'absent'}</strong>. {trace.positive&&!trace.actuallyPresent?'This is a false positive; exact confirmation prevents discarding a new key.':''} {trace.falseNegatives.length?`Unsafe clearing now makes inserted ${trace.falseNegatives.join(', ')} falsely absent.`:''}</FlowReadout>
  </Figure>;
}
export function BloomBudgetLab() {
  const [factor,setFactor]=useState(1),[target,setTarget]=useState(.01);const population=Math.round(1000*factor),budget=bloomBudget(1000,target,population);
  return <Figure name="bloom-budget" label="A fixed-capacity filter fills as the actual population rises" caption="Capacity remains 1,000 distinct keys. The curve is a hashing approximation, while the occupied fraction uses the same declared model.">
    <Bar label="Occupied fraction" value={budget.occupancy} color={C[1]}/><Plot series={[{label:'Approximate false-positive rate',color:C[3],values:Array.from({length:61},(_,i)=>[i*50,bloomRate(budget.bits,budget.hashes,i*50)])}]} point={[population,budget.rate]} xMax={3000} xLabel="Distinct inserted keys" yLabel="False-positive rate"/>
    <FlowControls><FlowSlider name="Population / designed capacity" value={factor} onChange={setFactor} min={0} max={3} step={.1}/><FlowChoice label="Target rate at capacity" options={[[.1,'10%'],[.01,'1%'],[.001,'0.1%']]} value={target} onChange={setTarget}/><button onClick={()=>{setFactor(1);setTarget(.01);}}>Reset</button></FlowControls>
    <FlowReadout><strong>{budget.bits.toLocaleString('en-US')}</strong> bits = <strong>{budget.bytes.toLocaleString('en-US')}</strong> allocated bytes; <strong>{budget.hashes}</strong> hashes. At {population} distinct keys, estimated false-positive rate <strong>{n(100*budget.rate,4)}%</strong>.</FlowReadout>
  </Figure>;
}
export function AuditFigure() {
  const [attempt,setAttempt]=useState(0),[data,setData]=useState(null),[error,setError]=useState(false),[selected,setSelected]=useState('train-00-original / train-00-local-edit');
  useEffect(()=>{let active=true;setData(null);setError(false);Promise.all(['audit-results.json','audit-inspector.json'].map(file=>fetch('/learn-code/data-curation-deduplication/'+file).then(r=>{if(!r.ok)throw Error(r.status);return r.json();}))).then(([audit,inspector])=>{if(!Array.isArray(audit.kept_ids)||!Array.isArray(inspector.pairs))throw Error('Invalid audit result');if(active)setData({...audit,details:inspector.pairs});}).catch(()=>{if(active)setError(true);});return()=>{active=false;};},[attempt]);
  return <Figure name="audit" label="Saved actual corpus audit and retained records" caption="One fixed, reproducible lexical audit. These counts are measured outputs, not an interactive approximation of a web corpus.">
    {!data?<p role="status">{error?'The saved audit could not be loaded.':'Loading the saved audit…'} {error&&<button onClick={()=>setAttempt(x=>x+1)}>Retry audit</button>}</p>:<>
      <div className="curation-audit-stages">{[['Inputs',data.record_count],['Exact representatives',data.exact_representatives],['Candidates',data.candidate_pairs],['Verified pairs',data.verified_pairs],['Retained documents',data.kept_ids.length]].map(([label,value],i)=><div key={label}><strong style={{color:C[i%C.length]}}>{value}</strong><span>{label}</span></div>)}</div>
      <p>Candidate precision <strong>{n(data.candidate_precision)}</strong> · recall <strong>{n(data.candidate_recall)}</strong> against {data.exhaustive_positive_pairs} exact above-threshold pairs.</p>
      <div className="curation-survivors"><strong>Actual survivors (first eight IDs)</strong><ol>{data.kept_ids.slice(0,8).map(id=><li key={id}>{id}</li>)}</ol></div>
      <p>Short records: {data.short_ids.join(', ')}. Cross-split exact groups: <strong>{data.cross_split_exact_groups.length}</strong>.</p>
      <AuditPair pair={data.details.find(pair=>pair.id===selected)||data.details[0]}/>
      <FlowControls><label className="curation-field">Actual pair<select value={selected} onChange={event=>setSelected(event.target.value)}>{data.details.map(pair=><option key={pair.id} value={pair.id}>{pair.id}</option>)}</select></label></FlowControls>

    </>}
  </Figure>;
}
function AuditPair({pair}) {
  return <div className="curation-pair-inspector">
    <div className="curation-pair-records">{[pair.a,pair.b].map((record,i)=><div key={record.id}>
      <p><strong style={{color:C[i]}}>{record.id}</strong></p>
      <div className="curation-source-text" tabIndex={0} role="region" aria-label={`${record.id} full source text`}>{record.text}</div>
      <p><strong>{record.disposition}</strong> → retained representative <code>{record.retained_representative}</code></p>
    </div>)}</div>
    <p>Distinct 3-word shingles: A <strong>{pair.shingles_a}</strong>, B <strong>{pair.shingles_b}</strong>; intersection <strong>{pair.intersection}</strong>, union <strong>{pair.union}</strong>.</p>
    {pair.jaccard!==null&&<Bar label="Exact Jaccard" value={pair.jaccard} color={C[2]}/>}
    {pair.jaccard===null&&<p>No union: Jaccard is undefined.</p>}
    <p>Containment A→B <strong>{n(pair.containment_a_in_b)}</strong>; B→A <strong>{n(pair.containment_b_in_a)}</strong>.</p>
    <FlowReadout>{pair.collapsed_exact?'The full normalized keys match: exact deduplication collapses this pair before LSH.':pair.candidate?`LSH retrieved this actual pair. Exact Jaccard ${pair.verified?'passes':'fails'} the 0.8 threshold.`:'LSH did not retrieve this pair. The exact score is computed for this small audit; the retrieval pipeline would not verify an absent candidate.'} Family membership and lexical overlap do not decide semantic equivalence.</FlowReadout>
  </div>;
}
export function ShardFigure() {
  return <Figure name="shards" label="Two shard records rendezvous at one band owner before the original input is replayed" caption="The same bucket key routes records together across shards. Original record order returns at the filtering stage.">
    <Scroll label="Cross-shard bucket routing"><svg className="curation-routing" viewBox="0 0 480 460" role="img" aria-label="A from shard0 and B from shard1 share band2 tuple7,4; their cluster removal is applied to the same original record order">
      <g fill="none" stroke="#aaa" strokeWidth="1.5"><path d="M95 75V92M95 122L240 180M385 75V92M385 122L240 180M240 208V220M240 251V280M240 307V355H95V388M240 355H385V388"/></g>
      <g textAnchor="middle"><text x="95" y="24">input shard 0</text><text x="385" y="24">input shard 1</text><text x="95" y="64" fill={C[0]}>A · row 17</text><text x="385" y="64" fill={C[1]}>B · row 9</text><text x="95" y="112">band 2: (7,4)</text><text x="385" y="112">band 2: (7,4)</text><text x="240" y="197" fill={C[2]}>bucket (2,7,4): A, B</text><text x="240" y="238">equal-band candidate edge A–B</text><text x="240" y="296">cluster → keep A, remove B</text><text x="95" y="414" fill={C[0]}>replay shard 0 · keep row 17</text><text x="385" y="414" fill={C[1]}>replay shard 1 · remove row 9</text><text x="240" y="451">same input partition and record order</text></g>
    </svg></Scroll>
  </Figure>;
}
export function ContainmentFigure() {
  const [size,setSize]=useState(10);const a=new Set(['a','b']),b=new Set('abcdefghij'.slice(0,size)),result=overlap(a,b);
  return <Figure name="containment" label="A completely copied short excerpt can have low whole-document Jaccard" caption="Each labelled cell is one distinct shingle. White brackets identify the evaluation excerpt inside the longer training article.">
    <p>evaluation excerpt</p><div className="curation-setrow">{[...a].map(x=><Piece selected key={x}>{x}</Piece>)}</div><p>training article</p><div className="curation-setrow">{[...b].map(x=><Piece selected={a.has(x)} key={x}>{x}</Piece>)}</div>
    <FlowControls><FlowSlider name="Training article shingles" min={2} max={10} step={1} value={size} onChange={setSize}/><button onClick={()=>setSize(10)}>Reset</button></FlowControls>
    <FlowReadout>Jaccard <strong>{n(result.jaccard)}</strong>; excerpt→article containment <strong>{n(result.containmentA)}</strong>. {size===2?'The sets are identical.':'Growing only the article lowers Jaccard while full excerpt containment remains.'}</FlowReadout>
  </Figure>;
}
export function SemanticLab() {
  const [angle,setAngle]=useState(40),[threshold,setThreshold]=useState(.9);const result=semanticTrace(angle,threshold);
  const x=v=>170+v*110,y=v=>155-v*110;
  return <Figure name="semantic" label="Cosine proximity and direct representative retention on constructed unit vectors" caption="Arrow direction is the supplied vector; labelled hues track records. White endpoints are retained. No text encoder produced these vectors.">
    <svg className="curation-small-svg" viewBox="0 0 340 315" role="img" aria-label={`Unit vectors at 0,20,${angle},110 degrees; keep ${result.kept.map(i=>letters[i]).join(', ')}`}>
      <circle cx="170" cy="155" r="110" fill="none" stroke="#666"/><path d="M35 155H310M170 20V285" stroke="#777"/>
      {result.vectors.map(([a,b],i)=><g key={i}><line x1="170" y1="155" x2={x(a)} y2={y(b)} stroke={C[i]} strokeWidth="2.5"/><circle cx={x(a)} cy={y(b)} r="4" fill={C[i]} stroke={result.kept.includes(i)?'#fff':C[i]} strokeWidth="2"/><text x={x(a)+12} y={y(b)+(i===0?19:-9)} fill={C[i]}>{letters[i]}</text></g>)}
      <text x="321" y="159">x</text><text x="183" y="28">y</text><text x="170" y="309" textAnchor="middle">unit length · cosine is normalized dot product</text>
    </svg>
    <div className="curation-cosines">{[[0,1],[1,2],[0,2]].map(([a,b])=><Bar key={`${a}${b}`} label={`${letters[a]}–${letters[b]}`} value={result.cosine[a][b]} color={C[2]}/>)}</div>
    <FlowControls><FlowSlider name="Direction of C (degrees)" value={angle} onChange={setAngle} min={30} max={70} step={5}/><FlowSlider name="Cosine threshold" value={threshold} onChange={setThreshold} min={.5} max={1} step={.05}/><button onClick={()=>{setAngle(40);setThreshold(.9);}}>Reset</button></FlowControls>
    <FlowReadout>Stable-ID direct policy keeps <strong>{result.kept.map(i=>letters[i]).join(', ')}</strong>. {result.matches.map(({i,representative})=>`${letters[i]} directly matches kept ${letters[representative]}.`).join(' ')}</FlowReadout>
  </Figure>;
}
