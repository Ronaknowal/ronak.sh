import {Prose,CodeBlock} from '../../content';
import RemoteCodeBlock from '../../content/RemoteCodeBlock.jsx';
import old from '../../../data/gbt-reading-flow-original-examples.json';
import fresh from '../../../data/gbt-reading-flow-examples.json';
const base='/learn-assets/gbt-reading-flow/';
export function GbtProgram({name}){
 const item=old[name];if(!item)throw new Error('Missing preserved program '+name);
 return <section data-gbt-program={name}><Prose><strong>{item.title}.</strong> {item.question}</Prose><RemoteCodeBlock source={base+'original/'+name+'.py'} filename={name+'.py'} title={'Complete original program: '+name}/><CodeBlock language="output" kind="output" filename={name+'.txt'} title="Saved output from the original declared execution">{item.expected}</CodeBlock></section>;
}
export function GbtNewProgram({name}){
 const item=fresh[name];if(!item)throw new Error('Missing new executed program '+name);
 return <section data-gbt-new-program={name}><Prose><strong>Complete source: {name}.</strong> {item.dependencies}</Prose><RemoteCodeBlock source={base+name} filename={name} title={'Complete program: '+name}/><CodeBlock language={item.artifact?'json':'output'} kind="output" filename={name.replace(/\.py$/,item.artifact?'.saved-summary.json':'.txt')} title={item.artifact?'Summary read from the saved measured artifact':'Actual output from the new declared execution'}>{item.output}</CodeBlock></section>;
}
export function SupportingFiles(){return <Prose>Save the exact <a href={base+'regression-tree.py'}>Decision Trees regression-tree.py dependency</a> beside residual-ensemble.py. The real-data workflow also needs the offline <a href={base+'concrete-data.csv'}>Concrete CSV</a>. Its <a href={base+'protocol.json'}>protocol and attribution</a>, <a href={base+'selection-lock.json'}>pre-test selection lock</a>, and <a href={base+'study.json'}>full saved study with198 error rows</a> allow inspection without fitting again. The shared file index gathers these files and every program.</Prose>;}
