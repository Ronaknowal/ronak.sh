// Inspect the existing file format directly; no tensor runtime or model call.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const model='scratch/inference-engines-research/study/conversion-hf457/pythia-14m-f16.gguf';
const inventory='scratch/inference-engines-research/preflight/gguf-inventory.json';
const data=fs.readFileSync(model); let pos=0;
const uint=()=>{const n=data.readUInt32LE(pos);pos+=4;return n;};
const large=()=>{const n=data.readBigUInt64LE(pos);pos+=8;assert.ok(n<=BigInt(Number.MAX_SAFE_INTEGER));return Number(n);};
const str=()=>{const n=large();assert.ok(pos+n<=data.length);const s=data.toString('utf8',pos,pos+n);pos+=n;return s;};
function value(type,retain=false){
  if(type===8)return str();
  if(type===9){const item=uint(),n=large();for(let i=0;i<n;i++)value(item);return undefined;}
  const sizes=[1,1,2,2,4,4,4,1,null,null,8,8,8];
  const size=sizes[type];assert.ok(size,'Known GGUF value type');
  let n;
  if(retain){assert.ok([4,7,10].includes(type));n=type===4?data.readUInt32LE(pos):type===7?data.readUInt8(pos):Number(data.readBigUInt64LE(pos));}
  pos+=size;assert.ok(pos<=data.length);return n;
}
assert.equal(data.toString('ascii',0,4),'GGUF');pos=4;
assert.equal(uint(),3);
const tensorCount=large(),metadataCount=large(),fields={};
for(let i=0;i<metadataCount;i++){
  const key=str(),type=uint(),retain=/^(general\.(architecture|file_type|alignment)|gptneox\.(block_count|embedding_length|attention.head_count|rope.dimension_count))$/.test(key);
  const result=value(type,retain);if(retain)fields[key]=result;
}
const tensors=[];
for(let i=0;i<tensorCount;i++){
  const name=str(),rank=uint(),shape=Array.from({length:rank},large),type=uint(),offset=large();
  assert.ok(type===0||type===1,'This observed file contains only F32 and F16');
  tensors.push({name,type:type===0?'F32':'F16',shape,bytes:shape.reduce((a,b)=>a*b,1)*(type===0?4:2),offset});
}
const alignment=fields['general.alignment']??32,dataStart=Math.ceil(pos/alignment)*alignment;
for(const t of tensors)assert.ok(dataStart+t.offset+t.bytes<=data.length);
const observed=JSON.parse(fs.readFileSync(inventory));
const byName=new Map(observed.tensors.map(t=>[t.name,t]));
for(const {offset,...t}of tensors)assert.deepEqual(t,byName.get(t.name));
assert.equal(tensors.length,76);
assert.equal(fields['general.file_type'],undefined);
assert.equal(fields['general.architecture'],'gptneox');
const counts=Object.fromEntries(['F16','F32'].map(type=>[type,tensors.filter(t=>t.type===type).length]));
assert.deepEqual(counts,{F16:26,F32:50});
const totalBytes=tensors.reduce((n,t)=>n+t.bytes,0);assert.equal(totalBytes,28155904);
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(data),'8977255964083cdf425026d13e1af3595c97e94e93ae123baa4412853bf682bf');
const report={passed:true,reviewer:'/root',method:'Independent GGUF v3 binary header/tensor parsing; no model execution',
  fields,counts,totalBytes,fileBytes:data.length,
  bytesByType:Object.fromEntries(['F16','F32'].map(type=>[type,tensors.filter(t=>t.type===type).reduce((n,t)=>n+t.bytes,0)])),
  files:{[model]:sha(data),[inventory]:sha(fs.readFileSync(inventory))}};
fs.writeFileSync('docs/teaching/llm-architecture-training/inference-engines-serving/content-review-root/gguf-reconstruction.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(report));
