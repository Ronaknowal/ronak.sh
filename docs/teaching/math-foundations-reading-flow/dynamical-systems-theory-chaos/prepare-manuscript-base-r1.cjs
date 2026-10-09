const fs=require('fs'),path=require('path');
const {parse}=require(path.join(process.cwd(),'node_modules/@babel/parser'));
const source=fs.readFileSync('src/learn/data/topics/dynamical-systems-theory-chaos.jsx','utf8');
const ast=parse(source,{sourceType:'module',plugins:['jsx']});
function value(n){if(n.type==='StringLiteral'||n.type==='NumericLiteral')return n.value;if(n.type==='ArrayExpression')return n.elements.map(value);if(n.type==='TaggedTemplateExpression')return n.quasi.quasis.map(q=>q.value.raw).join('');if(n.type==='JSXElement')return render(n);throw Error('Unsupported '+n.type);}
function attrs(n){return Object.fromEntries(n.openingElement.attributes.filter(a=>a.type==='JSXAttribute').map(a=>[a.name.name,a.value?.type==='StringLiteral'?a.value.value:a.value?.type==='JSXExpressionContainer'?a.value.expression:null]));}
function children(n){return n.children.map(render).join('').replace(/[ \t]+/g,' ');}
function render(n){if(n.type==='JSXText')return n.value.replace(/\s+/g,' ');if(n.type==='JSXExpressionContainer')return value(n.expression);if(n.type!=='JSXElement')return '';const tag=n.openingElement.name.name,a=attrs(n),inner=()=>children(n);
 if(tag==='Example')return `\n\n{{CODE:${a.example.property.name}}}\n\n`;
 if(tag==='LessonTable'){const headers=value(a.headers),rows=value(a.rows);return `\n\n${a.caption}\n\n| ${headers.join(' | ')} |\n| ${headers.map(()=> '---').join(' | ')} |\n`+rows.map(r=>'| '+r.join(' | ')+' |').join('\n')+'\n\n';}
 if(tag==='MathBlock')return '\n\n$$\n'+inner().trim()+'\n$$\n\n';
 if(tag==='H2')return '\n\n## '+inner().trim()+'\n\n';
 if(tag==='H3'||tag==='h3')return '\n\n### '+inner().trim()+'\n\n';
 if(tag==='Prose'||tag==='p'||tag==='Callout')return '\n\n'+inner().trim()+'\n\n';
 if(tag==='strong')return '**'+inner()+'**';if(tag==='em')return '*'+inner()+'*';if(tag==='Code'||tag==='code')return '`'+inner()+'`';
 if(tag==='a')return '['+inner()+']('+a.href+')';
 if(tag==='Checkpoint')return '\n\n**Check the distinction.** '+a.prompt+'\n\n'+inner();
 if(tag==='Practice')return '\n\n### '+a.title+'\n\n'+a.prompt+'\n\n<details><summary>Hint</summary>\n\n'+a.hint+'\n\n</details>\n\n<details><summary>Solution</summary>\n\n'+inner()+'\n\n</details>\n\n';
 if(tag==='Sources')return '\n\n## Further learning\n\n'+inner()+'\n\n'+(a.alternatives?value(a.alternatives):'');
 if(tag==='li')return '\n- '+inner().trim()+'\n';
 if(tag==='LessonIntro')return '# Dynamical Systems Theory & Chaos\n\n'+inner().trim()+'\n\nPrerequisites: '+a.prerequisites+'\n\n';
 if(n.openingElement.selfClosing)return '';
 return inner();
}
const exported=ast.program.body.find(n=>n.type==='ExportDefaultDeclaration').declaration;
const content=exported.properties.find(p=>p.key.name==='content').value.body;
let md=render(content).replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim()+'\n';
const output=path.join(__dirname,'content-prepared/manuscript-base.md');fs.writeFileSync(output,md);console.log({bytes:Buffer.byteLength(md),sections:(md.match(/^## /gm)||[]).length});
