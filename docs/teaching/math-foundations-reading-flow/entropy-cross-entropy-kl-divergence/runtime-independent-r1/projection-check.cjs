const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
(async()=>{
const repo=process.cwd(),root='docs/teaching/math-foundations-reading-flow/entropy-cross-entropy-kl-divergence',virtual=new Map();
const script=fs.readFileSync(root+'/runtime-frozen-r1/scripts/generate-entropy-private.mjs','utf8').split('\n').slice(1).join('\n');
const proxy={...fs,writeFileSync(p,s){virtual.set(path.resolve(p),String(s));},mkdirSync(){},readFileSync(p,encoding){return virtual.has(path.resolve(p))?virtual.get(path.resolve(p)):fs.readFileSync(p,encoding);}};
const {parse}=require(path.join(repo,'node_modules/@babel/parser'));
const generate=require(path.join(repo,'node_modules/@babel/generator'));
const {renderPreparedLesson}=await import(require('url').pathToFileURL(path.join(repo,'scripts/lib/prepared-lesson-renderer.mjs')));
new Function('fs','assert','parse','generate','renderPreparedLesson',script)(proxy,assert,parse,generate,renderPreparedLesson);
function canonical(t){return generate.default(parse(t,{sourceType:'module',plugins:['jsx']}),{compact:true}).code;}
const checks=[...virtual].map(([p,s])=>({path:path.relative(repo,p),exact:fs.readFileSync(p,'utf8')===s,lineEndingNormalizedEqual:fs.readFileSync(p,'utf8').replaceAll('\r\n','\n')===s.replaceAll('\r\n','\n'),formatterIdempotent:p.endsWith('.jsx')?canonical(fs.readFileSync(p,'utf8'))===canonical(s):null,expectedSha256:crypto.createHash('sha256').update(s).digest('hex')}));
fs.writeFileSync(__dirname+'/projection-check.json',JSON.stringify({scope:'Exact in-memory reconstruction from accepted entire manuscript, 13 programme/output pairs and six practice snippets; no reviewed source writes or main executions',checks},null,2));console.log(checks);
})().catch(e=>{console.error(e);process.exit(1)});
