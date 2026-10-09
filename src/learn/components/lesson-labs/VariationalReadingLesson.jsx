import { Children, Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Code, CodeBlock } from '../content/Code.jsx';
import { H2, H3 } from '../content/Headings.jsx';
import { Prose } from '../content/Prose.jsx';
import { LessonIntro } from './LessonElements.jsx';
import { LessonOpeningNote } from '../LessonOpening.jsx';
import { VRegion } from './VariationalReadingPrimitives.jsx';
import Drawing from './VariationalReadingDrawings.jsx';
import text from '../../data/variational-inference-reading-flow-text.js';

function Programme({ file }) {
  const programme=text.programmes[file];
  if(!programme)throw new Error(`Missing complete VI programme ${file}`);
  return <section className="vi-programme" id={`vi-file-${file.replace(/\.py$/,'')}`} aria-label={programme.title}>
    <H3>{programme.title}</H3>
    <Prose>Save the complete file as <Code>{file}</Code> and run <Code>python {file}</Code> using the setup described beside this programme.</Prose>
    <CodeBlock filename={file} title={programme.title} language="python" downloadUrl={programme.downloadUrl}>{programme.code}</CodeBlock>
    <Prose>Recorded numerical output for this complete calculation</Prose>
    <CodeBlock filename={`${file.replace(/\.py$/,'')}-output.txt`} language="output">{programme.output}</CodeBlock>
  </section>;
}
function Practice({ added }) {
  const rows=added ? text.practices.slice(8) : text.practices.slice(0,8);
  return rows.map(row=><div className="vi-practice" data-lesson-exercise="" key={row.id}>
    <Prose><strong>Practice {row.id}.</strong> {row.prompt}</Prose>
    <details><summary>Hint</summary><Markdown>{row.hint}</Markdown></details>
    <details><summary>Show explained solution</summary><Markdown>{row.solution}</Markdown></details>
  </div>);
}
function Files() {
  return <><ul>{Object.values(text.programmes).map(p=><li key={p.filename}><a href={`#vi-file-${p.filename.replace(/\.py$/,'')}`}>{p.filename}</a> — {p.title}</li>)}</ul>
    <Prose>For the four NumPy/SciPy investigations, install <Code>python -m pip install numpy==2.3.5 scipy==1.18.1</Code>. Python3.12.14 produced their recorded numerical outputs. The PyMC programme supplies its separate pinned installation command.</Prose>
    <ul>{text.assets.map(a=><li key={a.filename}><a href={a.url} download>{a.filename}</a> — {a.role}</li>)}</ul>
  </>;
}
function Paragraph({ children }) {
  const rendered=[];let pieces=[];
  const flush=()=>{if(pieces.length){rendered.push(<Prose key={`p${rendered.length}`}>{pieces}</Prose>);pieces=[];}};
  for(const child of Children.toArray(children)){
    if(typeof child!=='string'){pieces.push(child);continue;}
    let offset=0;
    const pattern=/\[VI_(DRAW_(V\d{2})|FILE_([^\]]+)|PRACTICE_(OLD|NEW)|FILES_ALL|RESOURCES_ALL)\]/g;
    for(const match of child.matchAll(pattern)){
      const before=child.slice(offset,match.index);if(before.trim())pieces.push(before);flush();
      const key=`o${rendered.length}`;
      if(match[2])rendered.push(<Drawing key={key} id={match[2]} />);
      else if(match[3])rendered.push(<Programme key={key} file={match[3]} />);
      else if(match[4])rendered.push(<Practice key={key} added={match[4]==='NEW'} />);
      else if(match[1]==='FILES_ALL')rendered.push(<Files key={key} />);
      else rendered.push(<Markdown key={key}>{text.resources}</Markdown>);
      offset=match.index+match[0].length;
    }
    const remaining=child.slice(offset);if(remaining.trim())pieces.push(remaining);
  }
  flush();return <Fragment>{rendered}</Fragment>;
}
const components={p:Paragraph,h2:({children})=><H2>{Children.toArray(children).join('')}</H2>,h3:({children})=><H3>{children}</H3>,code:({className,children})=>className ? <code className={className}>{children}</code> : <Code>{children}</Code>,table:({children})=><VRegion label="Complete VI lesson table" kind="table" className="vi-table-region"><table className="vi-manuscript-table">{children}</table></VRegion>};
function Markdown({children}) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={{...components,pre:({children:codeChildren})=>{
    const code=Children.toArray(codeChildren)[0];
    return <CodeBlock language="python" filename="vi-exact-excerpt.py" title="Exact excerpt; use the complete programme to run">{code.props.children}</CodeBlock>;
  }}}>{children}</ReactMarkdown>;
}
export default function VariationalReadingLesson() {
  return <div className="lesson-pilot lesson-flow variational-inference-lesson variational-reading-lesson"><LessonIntro prerequisites={text.prerequisites}>{text.summary}</LessonIntro><LessonOpeningNote kind="route"><p>For a first pass, follow sections1–5 from the finite objective to covariance, factor updates and the two-mode comparison; change their four labs and run <Code>finite_elbo.py</Code>, <Code>gaussian_decisions.py</Code>, <Code>gaussian_cavi.py</Code> and <Code>mixture_projection.py</Code>. Then use section11 and <Code>finite_vi_importance.py</Code> to check the quantity you will report. Return to sections6–10 for stochastic gradient estimators, structured minibatches, amortized inference, constrained coordinates and the complete paired-data posterior comparison.</p></LessonOpeningNote><Markdown>{text.manuscript}</Markdown></div>;
}
