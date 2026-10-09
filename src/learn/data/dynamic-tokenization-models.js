// Topic-owned supplied mechanisms. Trained measurements live in measured-study.json.
export const PIECE_COLORS = Object.freeze(['#e2b55a', '#60a5fa', '#c084fc', '#f472b6']);
export const HAND_RULES = Object.freeze([
  ['regular',' ','t'],['regular','h','e'],['regular',' t','he'],['regular',' ','o'],
  ['regular',' o','f'],['super',' of',' the'],['regular','T','i'],['regular','Ti','p'],
  ['regular',' ','h'],['regular',' h','a'],['regular',' ha','t'],
].map(([kind,left,right],rank)=>Object.freeze({rank,kind,left,right})));
export const DELETE_RULES = Object.freeze([
  {rank:0,kind:'regular',left:'a',right:'b'}, {rank:1,kind:'delete',left:'ab'},
  {rank:2,kind:'regular',left:'b',right:'c'},
].map(Object.freeze));
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8',{fatal:true});
export const byteString = text => Array.from(encoder.encode(text), value=>String.fromCharCode(value)).join('');
export function pieceLabel(piece) {
  try { return decoder.decode(Uint8Array.from(piece, character=>character.charCodeAt(0))).replaceAll(' ','␠').replaceAll('\n','↵'); }
  catch { return Array.from(piece, character=>`\\x${character.charCodeAt(0).toString(16).padStart(2,'0')}`).join(''); }
}
export function pieceColour(piece) {
  // Same literal bytes keep the same hue across all connected views and edits.
  let hash=2166136261;
  for(const character of piece)hash=Math.imul(hash^character.charCodeAt(0),16777619)>>>0;
  return PIECE_COLORS[hash%PIECE_COLORS.length];
}
export const utf8Length = text => encoder.encode(text).length;
export function pretokenGroups(text) {
  return [...text.matchAll(/ ?(?:\p{L}\p{M}*)+|\p{N}{1,3}| ?[^\s\p{L}\p{N}]+|\s+/gu)]
    .map(match=>Array.from(byteString(match[0])));
}
export function mergePieces(pieces,left,right) {
  const result=[];
  for(let i=0;i<pieces.length;i++) {
    if(pieces[i]===left&&pieces[i+1]===right){result.push(left+right);i++;}
    else result.push(pieces[i]);
  }
  return result;
}
export function applySavedRule(groups,rule) {
  if(rule.kind==='regular')return groups.map(pieces=>mergePieces(pieces,rule.left,rule.right));
  if(rule.kind==='delete')return groups.map(pieces=>pieces.flatMap(piece=>piece===rule.left?Array.from(piece):[piece]));
  const result=[];
  for(let i=0;i<groups.length;i++) {
    if(groups[i].length===1&&groups[i+1]?.length===1&&groups[i][0]===rule.left&&groups[i+1][0]===rule.right){result.push([rule.left+rule.right]);i++;}
    else result.push([...groups[i]]);
  }
  return result;
}
export function rankedTrace(text,rules=HAND_RULES) {
  let groups=pretokenGroups(text);
  const history=[{rank:-1,kind:'bytes',groups,rule:null}];
  for(const rule of rules) {
    const updated=applySavedRule(groups,rule);
    if(JSON.stringify(updated)!==JSON.stringify(groups))history.push({rank:rule.rank,kind:rule.kind,groups:updated,rule});
    groups=updated;
  }
  return {initial:history[0].groups,groups,history,bytes:utf8Length(text),pieces:groups.flat().length};
}
export function mergeCompetition(regular,superCount,pairCount,leftCount,rightCount,tau,base=false,kind='regular') {
  const leftIoS=leftCount>0?pairCount/leftCount:null;
  const rightIoS=rightCount>0?pairCount/rightCount:null;
  const winner=regular===0&&superCount===0?null:superCount>=regular?'super':'regular';
  return {winner,tie:winner!==null&&superCount===regular,
    leftIoS,rightIoS,deleteLeft:winner!==null&&kind==='regular'&&!base&&leftIoS!==null&&leftIoS>tau,
    deleteRight:winner!==null&&kind==='regular'&&!base&&rightIoS!==null&&rightIoS>tau};
}
export const LATTICE_PIECES = Object.freeze(['a','b','ab','aba','bab','abab']);
export const LATTICE_WEIGHTS = Object.freeze([.1,.1,.4,.2,.19,.01]);
const logsumexp=values=>{
  if(!values.length)return-Infinity;
  const maximum=Math.max(...values);
  return maximum===-Infinity?-Infinity:maximum+Math.log(values.reduce((sum,v)=>sum+Math.exp(v-maximum),0));
};
export function unigramLattice(text='abab',weights=LATTICE_WEIGHTS,excluded=[]) {
  const total=weights.reduce((sum,v)=>sum+v,0);
  if(!(total>0)||weights.some(v=>!Number.isFinite(v)||v<=0))throw new RangeError('Positive finite piece weights required');
  const probabilities=weights.map(v=>v/total);
  const raw=byteString(text),n=raw.length;
  const edges=Array.from({length:n+1},()=>[]);
  for(let i=0;i<n;i++)LATTICE_PIECES.forEach((piece,k)=>{
    if(!excluded.includes(piece)&&raw.startsWith(piece,i))edges[i].push({start:i,end:i+piece.length,piece,probability:probabilities[k],log:Math.log(probabilities[k])});
  });
  const forward=Array(n+1).fill(-Infinity),backward=Array(n+1).fill(-Infinity);
  const best=Array(n+1).fill(-Infinity),fewest=Array(n+1).fill(Infinity),parent=Array(n+1).fill(null),countParent=Array(n+1).fill(null);
  forward[0]=best[0]=0;fewest[0]=0;backward[n]=0;
  for(let i=0;i<n;i++)for(const edge of edges[i]) {
    forward[edge.end]=logsumexp([forward[edge.end],forward[i]+edge.log]);
    if(best[i]+edge.log>best[edge.end]){best[edge.end]=best[i]+edge.log;parent[edge.end]=edge;}
    if(fewest[i]+1<fewest[edge.end]){fewest[edge.end]=fewest[i]+1;countParent[edge.end]=edge;}
  }
  for(let i=n-1;i>=0;i--)backward[i]=logsumexp(edges[i].map(edge=>edge.log+backward[edge.end]));
  const reconstruct=parents=>{
    if(n&&!parents[n])return null;
    const result=[];let position=n;
    while(position){const edge=parents[position];result.unshift(edge);position=edge.start;}
    return result;
  };
  const paths=[];
  function enumerate(i,path,log){if(i===n){paths.push({edges:path,pieces:path.map(e=>e.piece),log,weight:Math.exp(log)});return;}for(const edge of edges[i])enumerate(edge.end,[...path,edge],log+edge.log);}
  // The browser lab deliberately bounds input to the small lattice alphabet.
  if(n<=8)enumerate(0,[],0);
  paths.forEach(path=>{path.posterior=Math.exp(path.log-forward[n]);});
  const expected={};
  if(forward[n]!==-Infinity)for(const row of edges)for(const edge of row)expected[edge.piece]=(expected[edge.piece]||0)+Math.exp(forward[edge.start]+edge.log+backward[edge.end]-forward[n]);
  return {raw,edges,probabilities,forward,backward,paths,best:reconstruct(parent),minimum:reconstruct(countParent),
    marginal:Math.exp(forward[n]),logMarginal:forward[n],covered:forward[n]!==-Infinity,expected};
}
export function seededSample(paths,alpha=1,seed=13) {
  if(!paths.length)return null;
  let state=seed>>>0;for(let i=0;i<4;i++)state=(Math.imul(state,1664525)+1013904223)>>>0;
  const weights=paths.map(path=>Math.exp(alpha*path.log)),total=weights.reduce((sum,v)=>sum+v,0);
  let target=(state/4294967296)*total;
  for(let i=0;i<paths.length;i++){target-=weights[i];if(target<=0)return paths[i];}
  return paths.at(-1);
}
export function lossStatistics(probability,count) {
  if(count===0)return{count:0,one:null,sum:null,mean:null,priority:null};
  const one=probability>0?-Math.log(probability):Infinity;
  return{count,one,sum:count*one,mean:one,priority:count/Math.log1p(count*one)};
}
export function adaptivePriority(count,lossSum,previous=0,beta=.5) {
  if(count===0)return{score:null,momentum:null,mean:null};
  const score=lossSum===0?Infinity:count/Math.log1p(lossSum);
  return{score,momentum:beta*previous+score,mean:lossSum/count};
}
export function entropyBits(counts) {
  const total=counts.reduce((sum,v)=>sum+v,0);
  return total?Math.max(0,-counts.reduce((sum,count)=>count>0?sum+(count/total)*Math.log2(count/total):sum,0)):null;
}
export function residueDecision(final,descendant,left,right,r=.2,s=1.5,protectedPiece=false) {
  const ratio=final+descendant?final/(final+descendant):null;
  const leftEntropy=entropyBits(left),rightEntropy=entropyBits(right);
  const minimum=leftEntropy===null||rightEntropy===null?null:Math.min(leftEntropy,rightEntropy);
  return{ratio,leftEntropy,rightEntropy,minimum,excluded:!protectedPiece&&ratio!==null&&minimum!==null&&ratio<=r&&minimum<=s};
}
export const CORRUPTION_RULES = Object.freeze([
  ['c','o'],['co','r'],['r','u'],['p','t'],['pt','i'],['pti','o'],['ptio','n'],
  ['ru','ption'],['ruption','s'],['cor','ru'],['corru','ption'],
].map(([left,right],rank)=>Object.freeze({rank,left,right})));
export const INCLUD_RULES = Object.freeze([
  ['i','n'],['in','c'],['inc','l'],['incl','u'],['inclu','d'],['includ','e'],
  ['include','s'],['includ','in'],['includin','g'],
].map(([left,right],rank)=>Object.freeze({rank,left,right})));
export function bpeTrees(raw,rules=CORRUPTION_RULES,excluded=[]) {
  let nodes=typeof raw==='string'?Array.from(byteString(raw),piece=>({piece,left:null,right:null})):raw.map(node=>node);
  for(;;){let chosen=null;
    for(let i=0;i<nodes.length-1;i++)for(const rule of rules)if(nodes[i].piece===rule.left&&nodes[i+1].piece===rule.right&&!excluded.includes(rule.left+rule.right)){
      if(!chosen||rule.rank<chosen.rank){chosen={rank:rule.rank,i};}
    }
    if(!chosen)break;
    const i=chosen.i;nodes.splice(i,2,{piece:nodes[i].piece+nodes[i+1].piece,left:nodes[i],right:nodes[i+1]});
  }
  return nodes;
}
export function splitTree(node,excluded) {
  if(!excluded.includes(node.piece)||!node.left)return[node];
  return[...splitTree(node.left,excluded),...splitTree(node.right,excluded)];
}
export function cleanupTrace(text='corruptions',excluded=['ruption','ruptions']) {
  const original=bpeTrees(text),split=original.flatMap(node=>splitTree(node,excluded)),remerged=bpeTrees(split,CORRUPTION_RULES,excluded);
  const ranges=nodes=>{let start=0;return nodes.map(node=>{const result={...node,start,end:start+node.piece.length};start=result.end;return result;});};
  return{original:ranges(original),split:ranges(split),remerged:ranges(remerged),bytes:utf8Length(text)};
}
export const INPUT_ROWS = Object.freeze([[1,0,0],[0,1,0],[0,0,1],[1,1,0],[1,0,1]].map(Object.freeze));
export const OUTPUT_ROWS = Object.freeze([[.2,.1,0],[0,.3,.1],[.1,0,.4],[.4,.2,.1],[.1,.3,.2]].map(Object.freeze));
export const OUTPUT_BIAS = Object.freeze([0,.1,-.1,.2,0]);
export const HIDDEN = Object.freeze([.5,1,-.5]);
export const softmax=values=>{
  if(!values.length)return[];const max=Math.max(...values),weights=values.map(v=>Math.exp(v-max)),sum=weights.reduce((a,b)=>a+b,0);return weights.map(v=>v/sum);
};
export function compactModel(retained=[0,2,4],tied=false) {
  if(!retained.length||new Set(retained).size!==retained.length||retained.some(id=>!Number.isInteger(id)||id<0||id>4))throw new RangeError('Nonempty distinct valid IDs required');
  const output=tied?INPUT_ROWS:OUTPUT_ROWS;
  const logits=output.map((row,i)=>row.reduce((sum,v,j)=>sum+v*HIDDEN[j],OUTPUT_BIAS[i]));
  const selected=retained.map(id=>logits[id]),probabilities=softmax(logits),compacted=softmax(selected);
  return{retained,input:retained.map(id=>INPUT_ROWS[id]),output:retained.map(id=>output[id]),bias:retained.map(id=>OUTPUT_BIAS[id]),
    map:Object.fromEntries(retained.map((id,i)=>[id,i])),logits,selected,probabilities,compacted,
    parametersBefore:(tied?1:2)*5*3+5,parametersAfter:(tied?1:2)*retained.length*3+retained.length};
}
export function prefixState(oldIds,newIds,oldVersion='v1',newVersion='v1') {
  let reusable=0;if(oldVersion===newVersion)for(let i=0;i<Math.min(oldIds.length,newIds.length);i++){if(oldIds[i]!==newIds[i])break;reusable++;}
  const states=ids=>{const sum=[0,0,0];return ids.map((id,position)=>{INPUT_ROWS[id].forEach((v,j)=>{sum[j]+=v;});return{position,id,key:sum.map(v=>v+position),value:sum.map(v=>v-position)};});};
  return{reusable,old:states(oldIds),next:states(newIds)};
}
export function tokenMetrics(bytes,nll,targets) {
  return{bpt:targets?bytes/targets:null,perplexity:targets?Math.exp(nll/targets):null,bitsPerByte:bytes?nll/(bytes*Math.LN2):null};
}
export function rowBudget(added=3,width=4,capacity=8,base=5,tied=false) {
  const available=Math.max(0,capacity-base),accepted=Math.min(added,available);
  return{accepted,requested:added,available,exhausted:added>available,parameters:(tied?1:2)*accepted*width+accepted,
    rows:Array.from({length:base+accepted},(_,id)=>({id,status:id<base?'existing trained row':'untrained appended row'}))};
}
