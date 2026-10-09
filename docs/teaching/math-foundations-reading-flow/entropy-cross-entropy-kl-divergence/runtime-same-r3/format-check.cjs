const fs=require('fs'),path=require('path'),parser=require('../../../../../node_modules/@babel/parser');
const topic=path.resolve(__dirname,'..');
const names=['EntropyCodingDrawings.jsx','EntropyDivergenceDrawings.jsx','EntropyDrawingElements.jsx','EntropyMaximumDrawings.jsx','EntropyPredictionDrawings.jsx','EntropyProbabilityDrawings.jsx'];
const remove=new Set(['start','end','loc','extra','leadingComments','trailingComments','innerComments','comments','tokens']);
function clean(x){if(Array.isArray(x))return x.map(clean);if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).filter(([k])=>!remove.has(k)).map(([k,v])=>[k,clean(v)]));return x;}
const checks=names.map(name=>{const prefix='src/learn/components/lesson-labs';const before=fs.readFileSync(path.join(topic,'runtime-frozen-r2',prefix,name),'utf8');const after=fs.readFileSync(path.join(topic,'runtime-frozen-r3',prefix,name),'utf8');const ast=s=>clean(parser.parse(s,{sourceType:'module',plugins:['jsx']}));return{name,pass:JSON.stringify(ast(before))===JSON.stringify(ast(after))};});
fs.writeFileSync(path.join(__dirname,'format-check.json'),JSON.stringify({scope:'Independent complete JSX syntax equivalence excluding location/literal/comment metadata; JSX text preserved',checks},null,2));console.log(JSON.stringify(checks));
