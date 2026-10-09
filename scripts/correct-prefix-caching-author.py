"""Bounded corrections from the complete first desktop paint reading."""
from pathlib import Path
import hashlib
import json

topic = Path('docs/teaching/llm-architecture-training/prefix-caching-prompt-caching')
out = topic / 'runtime-author-correction'
out.mkdir(exist_ok=True)
owners = ['Foundations', 'Shared', 'Storage', 'Policy']
files = [Path(f'src/learn/components/lesson-labs/PrefixCaching{x}.jsx') for x in owners]
files += [Path('scripts/render-prefix-caching-lesson.mjs')]
for file in files:
    before = out / (file.name + '.before')
    if before.exists():
        raise SystemExit('Correction already started; do not overwrite predecessors')
    before.write_bytes(file.read_bytes())

def edit(file, before, after):
    text = file.read_text(encoding='utf8')
    assert text.count(before) == 1, before[:80]
    file.write_text(text.replace(before, after), encoding='utf8')

f = files[0]
s = f.read_text(encoding='utf8')
start = s.index('export function AliasGraph(')
end = s.index('export function PcAliasing()', start)
s = s[:start] + '''export function AliasGraph({a,b,pages,label='Logical request tables and shared physical K/V pages'}){
  const second=65+a.length*55+55;
  const height=Math.max(second+b.length*55+30,pages.length*68+45);
  return <Graph label={label} width={750} height={height}>
    <text x="10" y="20">Logical references</text><text x="425" y="20">Physical page contents (token IDs)</text>
    {[['A',a,65,'#6daeff'],['B',b,second,'#ff91b4']].map(([name,table,y,tone])=><g key={name}>
      <text x="10" y={y-15} fill={tone}>Request {name}</text>
      {table.map((n,i)=><g key={i}><Node x={10} y={y+i*55} width={170} height={40} label={`slot ${i} → p${n}`} tone={tone}/><Edge x1={182} y1={y+i*55+20} x2={415} y2={64+pages.findIndex(p=>p.id===n)*68} tone={tone}/></g>)}
    </g>)}
    {pages.map((p,i)=><g key={p.id}><text x="425" y={39+i*68}>p{p.id} · {p.shared?'shared A+B':'private '+p.owner}</text>{Array.from({length:4},(_,j)=>{const t=p.tokens[j];return <g key={j}><rect x={425+j*67} y={44+i*68} width="64" height="35" fill={t===undefined?'#222630':`${color(t)}22`} stroke={t===undefined?'#7c8495':color(t)} strokeDasharray={t===undefined?'3 3':undefined}/><text x={457+j*67} y={67+i*68} textAnchor="middle" fill={t===undefined?'#bfc4d0':color(t)}>{t??'—'}</text></g>;})}</g>)}
  </Graph>;
}
''' + s[end:]
f.write_text(s, encoding='utf8')
edit(files[1], 'x={(x1+x2)/2} y={(y1+y2)/2-10} textAnchor="middle" fill={tone}', 'x={(x1+x2)/2+(Math.abs(x2-x1)<20?12:0)} y={(y1+y2)/2-10} textAnchor={Math.abs(x2-x1)<20?"start":"middle"} fill={tone}')
edit(files[2], 'unique pages × 512 = {pages.length*512} payload bytes. Retained inactive allocations would be additional.', 'unique pages × 512 = {pages.length*512} allocated data-block bytes. Only {1024+tails*512} bytes contain valid rows: two full shared pages plus two occupied positions in each private tail. Dashed slots are reserved but unused. Metadata and retained inactive allocations are additional.')
f = files[3]
edit(f, 'height={365}><circle', 'height={365}><circle') if False else None
edit(f, '<Table label="Computed edges at each leaf"', '''<Graph label="Current path stack at each completed visit" width={750} height={305}>{[...order].map((name,i)=>{const frames=name==='C'?['1–4','20–25']:['1–4','5–8',name==='A'?'9,10':'11,12'];const reused=i===0?0:order==='ABC'&&name==='B'?2:1;return <g key={name}><text x={30+i*250} y="25">Visit {i+1}: {name}</text>{frames.map((frame,j)=><Node key={frame} x={20+i*250} y={220-j*67} width={220} height={55} label={frame} sub={j<reused?'retained from previous path':'computed for this visit'} tone={j<reused?'#62d7e2':'#ffc266'}/>)}<text x={30+i*250} y="298">bottom → earlier prefix</text></g>;})}</Graph><Table label="Computed edges at each leaf"''')
edit(f, '<circle cx="665" cy="515"', '<circle cx="673" cy="515"')
edit(f, '<Tokens label="Request order; white ring selects the admission below" items={labels.map(x=>({A:1,B:2,C:3})[x])} selected={step}/><p>Request identities: {labels.map((x,i)=>`${i}:${x}`).join(\' → \')}. The token strip above encodes A=1, B=2, C=3 as request identities only.</p>', '''<Graph label="Eight sequential requests and the selected admission" width={740} height={130}>{labels.map((name,i)=><g key={i}><Node x={10+i*90} y={25} width={78} height={60} label={name} sub={`request ${i}`} tone={{A:'#6daeff',B:'#ff91b4',C:'#ffc266'}[name]} selected={i===step}/>{i<7&&<Edge x1={89+i*90} y1={55} x2={99+i*90} y2={55}/>}</g>)}</Graph>''')
f = files[4]
edit(f, "body+='</section>';", '''body+='</section>';
const helpers=['prefix_study.py','observations.py','tiny_causal_lm.py','cached_decoder.py','native_cache.py','acquire_model.py'];
body=body.replace('<H2>{"16. Technical references and runnable files"}</H2>', '<H2>{"16. Technical references and runnable files"}</H2><Prose>Complete orchestration and prerequisite files:</Prose><ul>'+helpers.map(file=>`<li><a href="/learn-code/prefix-caching/${file}" download>${file}</a></li>`).join('')+'</ul>');''')
record = {
    'reading': 'All 29 native two-tile desktop sheets personally read, covering 57 tiles, all 29 defaults and 23 changed figures. Oversized drawing right edges await explicit pan captures.',
    'findings': ['D02/D13 reference lines crossed slot labels: vertical logical tables leave a clear connector corridor.', 'D10 vertical edge label crossed its line: side-offset vertical labels.', 'D13 allocated blocks and valid-row payload separated; unused tail slots drawn.', 'D24 explicit path stacks added to the existing tree/traces.', 'D28 request IDs no longer masquerade as token IDs.', 'D26 89-second tick aligned to the stated scale.', 'Six orchestration/prerequisite downloads added to the shared file index.'],
    'checker_diagnostics': ['Initial finite verifier indexed initial event as admit; corrected event offset.', 'Initial hash verifier used fixed-v1 namespace against fixed workload records; corrected comparison input. No runtime hash defect.'],
    'inputs': {str(f): hashlib.sha256(f.read_bytes()).hexdigest() for f in files},
    'science': 'No manuscript/program/model/study edit or replay.'
}
(out / 'author-reading.json').write_text(json.dumps(record, indent=2)+'\n',encoding='utf8')
print(json.dumps(record))
