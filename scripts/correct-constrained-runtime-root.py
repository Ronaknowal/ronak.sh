"""Preserve the exact reviewed predecessor and repair three figure contracts."""
from pathlib import Path
import hashlib
import json

root = Path(__file__).resolve().parents[1]
base = root / 'docs/teaching/llm-architecture-training/structured-output-constrained-decoding-outlines-xgrammar'
source = root / 'src/learn/components/lesson-labs/ConstrainedDecodingFoundations.jsx'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
packet = json.loads((base / 'runtime-inputs.json').read_text())
expected = packet['files'][str(source.relative_to(root)).replace('\\', '/')]
assert sha(source) == expected
out = base / 'runtime-training-correction'
out.mkdir(exist_ok=False)
before = out / 'ConstrainedDecodingFoundations.jsx.before'
before.write_bytes(source.read_bytes())
text = source.read_text(encoding='utf8')
def replace_function(name, next_name, replacement):
    global text
    start = text.index(name)
    end = text.index(next_name, start)
    text = text[:start] + replacement.strip() + '\n' + text[end:]

replace_function('function Bars(', 'export function FilterOrder', r'''
function Bars({mass,label,selected=-1}){return <div><p>{label} (scale 0–1)</p>{tokens.map((t,i)=><div className="cd-bars" key={t} data-selected-token={i===selected?'true':undefined} style={i===selected?{outline:'2px solid white',outlineOffset:'3px'}:undefined}><span style={{color:colors[i]}}>{i}: {t}</span><div className="cd-track"><i style={{width:`${mass[i]*100}%`,background:colors[i]}}/></div><output>{fmt(mass[i])}</output></div>)}</div>;}
export function MaskedMass(){
 const[p,setP]=useState(''),[choice,setChoice]=useState('1'),m=masked(p);
 const legalIds=m.legal.flatMap((legal,i)=>legal?[i]:[]),selected=legalIds.includes(+choice)?+choice:(legalIds[0]??-1);
 return <Figure id="D06" caption="Supplied probabilities remain fixed to isolate the grammar's effect. The white outline follows the legal token selected below; this control does not draw a random sample. A real model updates its scores after each emitted token.">
 <div className="cd-pair"><Bars mass={originalMass} label="Original p" selected={selected}/><Bars mass={m.q} label="Constrained q" selected={selected}/></div>
 <Status>Mask [{m.legal.map(Number).join(', ')}]; legal original mass {fmt(m.total)}. {m.total?`Normalize only the retained mass. Selected token: ID ${selected} (${tokens[selected]}).`:'Empty support: no probability distribution or selectable token.'}</Status>
 <Controls reset={()=>{setP('');setChoice('1');}}><Text label="Decimal prefix" value={p} onChange={setP}/>{legalIds.length>0&&<Select label="Selected legal token" value={String(selected)} onChange={setChoice} options={legalIds.map(i=>[String(i),`${i}: ${tokens[i]}`])}/>}</Controls></Figure>;
}
''')
replace_function('export function VocabularyTrie(', 'export function StateTokenIndex', r'''
export function VocabularyTrie(){
 const[p,setP]=useState(''),vocab=['a','ab','ac','b','ba'],lang=['ab','ac','ba'];
 const allowed=vocab.map(v=>literalPrefix(p+v,lang).viable);
 const edges=[['','a',97,145,223,85],['','b',97,165,223,225],['a','b',278,76,468,44],['a','c',278,86,468,130],['b','a',278,235,468,248]].map(([parent,byte,...xy])=>{
  const tested=parent===''||literalPrefix(p+parent,lang).viable;
  return {parent,byte,xy,state:!tested?'pruned':literalPrefix(p+parent+byte,lang).viable?'passed':'rejected'};
 });
 return <Figure id="D09" caption="The grammar accepts ab, ac or ba. Node colour identifies the token; an outer white ring means it is allowed. Edge marks separately show the byte tests and the work pruned after a failed parent.">
 <Drawing label="Vocabulary trie with tested and pruned byte edges" height={325}>
 <Node x={70} y={155} label="root"/>{[['a',250,80,0],['b',250,235,3],['ab',495,40,1],['ac',495,135,2],['ba',495,250,4]].map(([s,x,y,i])=><g key={s}><Node x={x} y={y} label={s} color={colors[i]}/>{allowed[i]&&<circle cx={x} cy={y} r={32} fill="none" stroke="white"/>}<text x={x} y={y+53} textAnchor="middle" style={{fill:colors[i]}}>ID {i}</text></g>)}
 {edges.map(({parent,byte,xy,state})=><g key={parent+byte} data-trie-edge={parent+byte} data-edge-state={state}><Edge x1={xy[0]} y1={xy[1]} x2={xy[2]} y2={xy[3]} label={`${byte} ${state==='passed'?'✓':state==='rejected'?'×':'· skip'}`} color={state==='passed'?'#e3e7ee':state==='rejected'?'#ff8ea5':'#808b9d'} dashed={state==='pruned'}/></g>)}
 </Drawing><p>Solid ✓: tested, viable. Solid ×: tested, rejected. Dashed: descendant pruned without a test.</p>
 <Status>Prefix {JSON.stringify(p)}. Allowed IDs: {allowed.flatMap((a,i)=>a?[i]:[]).join(', ')||'none'}. Trie tests {edges.filter(e=>e.state!=='pruned').length} byte edges; naive scan stops separately on each token's first dead byte.</Status>
 <Controls reset={()=>setP('')}><Text label="Grammar prefix" value={p} onChange={setP}/></Controls></Figure>;
}
''')
replace_function('export function Utf8Bytes(', 'export function CrossFieldToken', r'''
export function Utf8Bytes(){
 const[hex,setHex]=useState('E2 82 AC'),[step,setStep]=useState(1);
 const all=hex.trim()?hex.trim().split(/\s+/):[],n=Math.min(step,all.length),m=utf8Literal(all.slice(0,n).join(' '));
 return <Figure id="D11" caption="The reference compares two valid token segmentations. The separate input trace displays the selected raw bytes; rejection never produces a character or a replacement glyph.">
 <p>Valid reference only: E2 82 AC encodes €</p>
 <Drawing label="Reference: two token segmentations of the euro sign's UTF-8 bytes" height={220}>{[0,1].map(row=><g key={row}><text x="20" y={30+row*100}>{row?'One token':'Two tokens'}</text>{['E2','82','AC'].map((v,i)=><g key={v}><rect x={170+i*100} y={12+row*100} width="85" height="42" fill={colors[row?2:i===0?0:1]} fillOpacity=".18" stroke={colors[row?2:i===0?0:1]}/><text x={212+i*100} y={39+row*100} textAnchor="middle">{v}</text></g>)}<text x="505" y={39+row*100}>→ €</text>{(row?[[170,455,2,'token 0']]:[[170,255,0,'token 0'],[270,455,1,'token 1']]).map(([a,b,c,label])=><g key={label}><path d={`M${a} ${60+row*100} v8 H${b} v-8`} fill="none" stroke={colors[c]}/><text x={(a+b)/2} y={88+row*100} textAnchor="middle" style={{fill:colors[c]}}>{label}</text></g>)}</g>)}</Drawing>
 <p>Selected input — white outline: consumed; ×: first mismatch</p>
 <Drawing label="Actual selected bytes and recognizer result" height={165}>
 {all.map((byte,i)=><g key={i} data-input-byte={byte} data-consumed={i<n?'true':'false'} data-byte-mismatch={m.wrong===i?'true':undefined}><rect x={25+i*115} y="15" width="95" height="48" fill="#111318" stroke={i<n?'white':'#808b9d'} strokeWidth={i<n?2.5:1}/><text x={72+i*115} y="45" textAnchor="middle" style={{fill:m.wrong===i?'#ff8ea5':'#e3e7ee'}}>{byte}{m.wrong===i?' ×':''}</text><text x={72+i*115} y="89" textAnchor="middle">byte {i+1}</text></g>)}
 <text x="25" y="137" data-input-result>{m.complete?'Complete character: €':m.viable?'No complete character yet':`Rejected at byte ${m.wrong+1}; no character`}</text>
 </Drawing><Status>Raw bytes consumed: {m.parts.join(' ')||'(empty)'}. {m.complete?'Complete: €':m.viable?'Viable UTF-8 prefix; no complete character yet':`Rejected at byte ${m.wrong+1}`}. No replacement glyph is inserted.</Status>
 <Controls reset={()=>{setHex('E2 82 AC');setStep(1);}}><Select label="Byte sequence" value={hex} onChange={s=>{setHex(s);setStep(s.split(' ').length);}} options={[['E2 82 AC','E2 82 AC'],['82','82 first — invalid'],['E2 41','E2 41 — invalid']]}/><Range label="Bytes consumed" value={n} max={all.length} onChange={setStep}/></Controls></Figure>;
}
''')
source.write_text(text, encoding='utf8', newline='\r\n')
(out / 'predecessor.json').write_text(json.dumps([{'path':str(source.relative_to(root)).replace('\\','/'),'preserved':str(before.relative_to(root)).replace('\\','/'),'sha256':expected}],indent=2)+'\n',encoding='utf8')
print(json.dumps({'changed':str(source.relative_to(root)), 'sha256':sha(source)}))
