import { Children, Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Code, CodeBlock } from '../content/Code.jsx';
import { H2, H3 } from '../content/Headings.jsx';
import { Prose } from '../content/Prose.jsx';
import { LessonIntro } from './LessonElements.jsx';
import { LessonOpeningNote } from '../LessonOpening.jsx';
import { ERegion } from './ExponentialReadingPrimitives.jsx';
import Drawing from './ExponentialReadingDrawings.jsx';
import text from '../../data/exponential-reading-flow-text.js';

function Programme({ file, output = false }) {
  const programme=text.programmes[file];
  if(!programme)throw new Error('Missing complete exponential programme '+file);
  return output ? <CodeBlock filename={file.replace(/\.py$/,'')+'-output.txt'} language="output">{programme.output}</CodeBlock> : <div className="ef-programme" id={'ef-file-'+file.replace(/\.py$/,'')}><CodeBlock filename={file} title={programme.title} language="python" downloadUrl={programme.downloadUrl}>{programme.code}</CodeBlock></div>;
}
function Files() {
  return <><ul>{text.programmeOrder.map(name=><li key={name}><a href={'#ef-file-'+name.replace(/\.py$/,'')}>{name}</a> — {text.programmes[name].title}</li>)}</ul><ul>{text.assets.map(a=><li key={a.filename}><a href={a.url} download>{a.filename}</a> — {a.role}</li>)}</ul></>;
}
function Paragraph({ children }) {
  const rendered=[];let pieces=[];
  const flush=()=>{if(pieces.length){rendered.push(<Prose key={'p'+rendered.length}>{pieces}</Prose>);pieces=[];}};
  for(const child of Children.toArray(children)){
    if(typeof child!=='string'){pieces.push(child);continue;}
    let offset=0;
    for(const match of child.matchAll(/\[EF_(DRAW_(E\d{2})|(CODE|OUTPUT)_([^\]]+))\]/g)){
      const before=child.slice(offset,match.index);if(before.trim())pieces.push(before);flush();
      const key='o'+rendered.length;
      rendered.push(match[2] ? <Drawing key={key} id={match[2]} /> : <Programme key={key} file={match[4]} output={match[3]==='OUTPUT'} />);
      offset=match.index+match[0].length;
    }
    const remaining=child.slice(offset);if(remaining.trim())pieces.push(remaining);
  }
  flush();return <Fragment>{rendered}</Fragment>;
}
const components={p:Paragraph,h2:({children})=><H2>{Children.toArray(children).join('')}</H2>,h3:({children})=><H3>{children}</H3>,code:({children})=><Code>{children}</Code>,table:({children})=><ERegion label="Complete exponential-family lesson table" kind="table" className="ef-table-region"><table className="ef-manuscript-table">{children}</table></ERegion>};
function Markdown({ children }) {return <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{children}</ReactMarkdown>;}
function InlineMarkdown({ children }) {return <ReactMarkdown components={{p:({children:parts})=><Fragment>{parts}</Fragment>,code:({children:parts})=><Code>{parts}</Code>}}>{children}</ReactMarkdown>;}
export default function ExponentialReadingLesson() {
  const index=text.manuscript.indexOf('### Independent transfer');
  if(index<0)throw new Error('Missing complete exponential transfer section');
  return <div className="lesson-pilot lesson-flow exponential-family-lesson exponential-reading-lesson"><LessonIntro prerequisites={<InlineMarkdown>{text.prerequisites}</InlineMarkdown>}>{text.summary}</LessonIntro><LessonOpeningNote kind="route"><Markdown>{text.route}</Markdown></LessonOpeningNote><Markdown>{text.manuscript.slice(0,index)}</Markdown><H3>Complete files and observed-data assets</H3><Files /><Markdown>{text.manuscript.slice(index)}</Markdown></div>;
}
