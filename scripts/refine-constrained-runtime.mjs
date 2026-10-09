import fs from 'node:fs';
const file='src/learn/components/lesson-labs/ConstrainedDecodingFoundations.jsx';
let source=fs.readFileSync(file,'utf8');
const start=source.indexOf('<text x="15" y="416">DFA</text>'),end=source.indexOf('</Drawing><Status>Consumed',start);
source=source.slice(0,start)+`<text x="15" y="416">Subset DFA</text>
<Node x={105} y={495} label="0,1,3" r={38} active={p===''} />
<Node x={335} y={445} label="2,5" r={32} active={p==='a'} />
<Node x={335} y={545} label="4,5" r={32} active={p==='b'} />
<Node x={580} y={495} label="6" r={32} accept active={p==='ac'||p==='bc'} />
<Edge x1={145} y1={484} x2={300} y2={451} label="a" />
<Edge x1={145} y1={506} x2={300} y2={539} label="b" />
<Edge x1={369} y1={451} x2={545} y2={484} label="c" />
<Edge x1={369} y1={539} x2={545} y2={506} label="c" />
<text x="20" y="615">Unknown byte → empty subset. Distinct closures can share a future language.</text>`+source.slice(end);
source=source.replace('height={565}','height={640}');
fs.writeFileSync(file,source);
const stateFile='src/learn/components/lesson-labs/ConstrainedDecodingState.jsx';
source=fs.readFileSync(stateFile,'utf8');
const a=source.indexOf('export function ForkRollback()'),z=source.indexOf('export function GenerationLoop()',a);
source=source.slice(0,a)+`export function ForkRollback(){
 const [shared]=useState(()=>nestedTrace('[2,').at(-1).stack);
 const [entered,setEntered]=useState(false),[digit,setDigit]=useState(false);
 const top=entered?{id:4,returnTo:'after value',parent:shared}:shared;
 return <Figure id="D15" caption="The branches keep the same immutable parent. Each action changes only its own branch; rollback restores A's fork checkpoint.">
 <Drawing label="Two parser branches sharing an immutable parent return frame" height={370}>
 <text x="95" y="35" style={{fill:colors[0]}}>Request A</text><text x="435" y="35" style={{fill:colors[1]}}>Request B</text>
 <Node x={150} y={100} label="value" r={45} color={colors[0]}/><Node x={480} y={100} label={digit?'after':'value'} r={45} color={colors[1]}/>
 {entered?<><Edge x1={150} y1={145} x2={150} y2={182}/><Node x={150} y={220} label="frame 4" r={40} color={colors[3]}/><Edge x1={175} y1={253} x2={300} y2={296}/></>:<Edge x1={170} y1={140} x2={300} y2={295}/>}
 <Edge x1={455} y1={140} x2={345} y2={295}/><Node x={320} y={310} label={'frame '+shared.id} r={40} color={colors[2]}/></Drawing>
 <Status>Shared parent identity: {top===shared||top.parent===shared?'same object':'different'}. A prefix: {entered?'[2,[':'[2,'}; B prefix: {digit?'[2,7':'[2,'}.</Status>
 <Controls reset={()=>{setEntered(false);setDigit(false);}}><button type="button" disabled={entered} onClick={()=>setEntered(true)}>A accepts [</button><button type="button" disabled={digit} onClick={()=>setDigit(true)}>B accepts 7</button><button type="button" disabled={!entered} onClick={()=>setEntered(false)}>A rollback</button></Controls></Figure>;
}
`+source.slice(z);
source=source.replace("policy==='empty'?'empty finite support':m.status","policy==='empty'&&!m.eos?'empty finite support':m.status");
fs.writeFileSync(stateFile,source);
const renderer='scripts/render-constrained-decoding-lesson.mjs';
source=fs.readFileSync(renderer,'utf8').replace("'3-mathematical-foundation'","'3-math-foundation'").replace("'9-failure-modes-and-gotchas'","'9-failure-modes-gotchas'");
fs.writeFileSync(renderer,source);
