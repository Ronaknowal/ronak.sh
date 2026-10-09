// Small, explicit languages for the inline investigations; no model runs in the browser.
export const tokenColors = ['#83baff', '#bd9aff', '#ffc46d', '#69d2df', '#ff91b5'];
export const tokens = ['abc', '42', '7', '3x', 'EOS'];
export const originalMass = [.5, .25, .125, .0625, .0625];
export const inputBytes = text => Array.from(new TextEncoder().encode(text), byte => String.fromCharCode(byte));
export const describeBytes = bytes => bytes.every(byte => byte.charCodeAt(0)<128) ? JSON.stringify(bytes.join('')) : bytes.map(byte=>byte.charCodeAt(0).toString(16).toUpperCase().padStart(2,'0')).join(' ')+' (raw bytes)';
export const accepting = state => state === 'integer' || state === 'fraction';
export function transition(state, byte) {
  if (state === 'dead') return 'dead';
  if (/^[0-9]$/.test(byte)) return state === 'start' || state === 'integer' ? 'integer' : 'fraction';
  return byte === '.' && state === 'integer' ? 'dot' : 'dead';
}
export function decimalTrace(text) {
  const states = ['start'];
  for (const byte of inputBytes(text)) states.push(transition(states.at(-1), byte));
  return states;
}
export function tokenTrace(prefix, id) {
  const state = decimalTrace(prefix).at(-1);
  if (id === 4) return {states:[state], allowed:accepting(state), destination:accepting(state)?'terminated':'dead'};
  const states=[state];
  for(const b of tokens[id]) states.push(transition(states.at(-1),b));
  return {states,allowed:states.at(-1)!=='dead',destination:states.at(-1)};
}
export function masked(prefix, k=5, grammarFirst=true) {
  const legal=tokens.map((_,i)=>tokenTrace(prefix,i).allowed);
  const eligible=originalMass.map((p,i)=>({p,i})).filter(v=>!grammarFirst||legal[v.i]).slice(0,k).filter(v=>legal[v.i]);
  const total=eligible.reduce((s,v)=>s+v.p,0);
  return {legal,total,q:originalMass.map((p,i)=>eligible.some(v=>v.i===i)?p/total:0)};
}
export function literalPrefix(text, language=['cat','car']) {
  return {viable:language.some(word=>word.startsWith(text)),accepting:language.includes(text)};
}
export function utf8Literal(hex) {
  const expected=['E2','82','AC'];
  const parts=hex.trim()?hex.trim().toUpperCase().split(/\s+/):[];
  const wrong=parts.findIndex((v,i)=>v!==expected[i]);
  return {parts,wrong,viable:wrong===-1&&parts.length<=3,complete:wrong===-1&&parts.length===3};
}
export function nestedTrace(text,maxDepth=8) {
  let state='value',stack=null,error=null;
  const rows=[{byte:'start',state,stack}];
  for(const byte of inputBytes(text)){
    if(error){rows.push({byte,state:'dead',stack,error});continue;}
    if(state==='value'){
      if(byte==='['){
        let depth=0;for(let n=stack;n;n=n.parent)depth++;
        if(depth>=maxDepth)error='Depth guard reached';
        else stack={id:rows.length,returnTo:'after value',parent:stack};
      } else if(/^[0-9]$/.test(byte))state=stack?'after value':'complete';
      else error='Expected a digit or an opening bracket';
    } else if(state==='after value'){
      if(byte===',')state='value';
      else if(byte===']'){stack=stack.parent;state=stack?'after value':'complete';}
      else error='Expected a comma or closing bracket';
    } else error='Trailing byte after a complete value';
    rows.push({byte,state:error?'dead':state,stack,error});
  }
  return rows;
}
export function futureMass(a,b){
  const total=(a+b)/2;
  return {global:total?[a/(a+b),b/(a+b)]:null,local:[a>0?.5:0,b>0?.5:0],failed:(a===0?.5:0)+(b===0?.5:0),total};
}
export function stopFixture(kind,cap,cancel=false){
  const seq=kind==='euro'?['E2','82 AC','EOS']:kind==='fraction'?['3','.','2','EOS']:['42','EOS'];
  const used=seq.slice(0,Math.min(cap,seq.length));
  const eos=used.includes('EOS');
  const bytes=used.filter(x=>x!=='EOS');
  const raw=kind==='euro'?bytes.join(' '):Array.from(bytes.join('')).map(c=>c.charCodeAt(0).toString(16)).join(' ');
  const complete=kind==='euro'?bytes.length===2:accepting(decimalTrace(bytes.join('')).at(-1));
  return {used,raw,text:kind==='euro'?(bytes.length===2?'€':bytes.length===0?'':null):bytes.join(''),complete,eos,status:cancel&&!eos?'canceled':eos?'eos':'token cap',utf8:kind==='euro'&&bytes.length===1?'incomplete prefix':'complete'};
}
export function compileCost(requests,failure){return {constrained:12+21*requests,retries:20*requests/(1-failure),cross:20/(1-failure)>21?12/(20/(1-failure)-21):null};}
export function overlap(model,mask,transfer=1){return {serial:model+mask+transfer,overlapped:Math.max(model,mask)+transfer};}
