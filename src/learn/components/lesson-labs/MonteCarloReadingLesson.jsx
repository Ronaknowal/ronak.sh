import { Children, Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Code, CodeBlock } from '../content/Code.jsx';
import { H2, H3 } from '../content/Headings.jsx';
import { Prose } from '../content/Prose.jsx';
import { LessonIntro } from './LessonElements.jsx';
import Draw from './MonteCarloReadingDrawings.jsx';
import text from '../../data/monte-carlo-reading-flow-text.js';

function CompleteProgramme({ file }) {
  const programme = text.programmes[file];
  if (!programme) throw new Error(`Missing complete programme ${file}`);
  return <section className="mc-programme" id={`mc-file-${file.replace(/\.py$/, '')}`} aria-label={`Complete ${file}`}>
    <Markdown excerptFile={`${file.replace(/\.py$/, '')}-excerpt.py`}>{programme.explanation}</Markdown>
    <Prose>Save the complete file as <Code>{file}</Code> and run <Code>python {file}</Code> in the environment described above.</Prose>
    <CodeBlock language="python" filename={file} title={file} downloadUrl={`/learn-assets/monte-carlo-mcmc/${file}`}>{programme.code}</CodeBlock>
    <Prose>Recorded output for this complete file</Prose>
    <CodeBlock language="output" filename={`${file.replace(/\.py$/, '')}-output.txt`}>{programme.output}</CodeBlock>
  </section>;
}

function ReadingParagraph({ children }) {
  const output = [];
  let current = [];
  const flush = () => { if (current.length) { output.push(<Prose key={`p${output.length}`}>{current}</Prose>); current = []; } };
  for (const child of Children.toArray(children)) {
    if (typeof child !== 'string') { current.push(child); continue; }
    const pattern = /\[MC_(DRAW_(M\d{2})|FILE_([^\]]+))\]/g;
    let start = 0;
    for (const match of child.matchAll(pattern)) {
      const before = child.slice(start, match.index);
      if (before.trim()) current.push(before);
      flush();
      output.push(match[2] ? <Draw key={`d${output.length}`} id={match[2]} /> : <CompleteProgramme key={`f${output.length}`} file={match[3]} />);
      start = match.index + match[0].length;
    }
    const remaining = child.slice(start);
    if (remaining.trim()) current.push(remaining);
  }
  flush();
  return <Fragment>{output}</Fragment>;
}
const components = {
  p: ReadingParagraph,
  h2: ({ children }) => <H2>{Children.toArray(children).join('')}</H2>,
  h3: ({ children }) => <H3>{children}</H3>,
  code: ({ className, children }) => className ? <code className={className}>{children}</code> : <Code>{children}</Code>,
  table: ({ children }) => <div className="mc-table-region" role="region" tabIndex={0} aria-label="Complete lesson table; scroll horizontally when needed"><table className="mc-manuscript-table">{children}</table></div>,
};
function Markdown({ children, excerptFile }) {
  const localComponents = { ...components, pre: ({ children: codeChildren }) => {
    const code = Children.toArray(codeChildren)[0];
    return <CodeBlock language="python" title="Exact excerpt; use the complete file below to run" filename={excerptFile}>{code.props.children}</CodeBlock>;
  } };
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={localComponents}>{children}</ReactMarkdown>;
}

export default function MonteCarloReadingLesson() {
  return <div className="lesson-pilot lesson-flow monte-carlo-mcmc-lesson">
    <LessonIntro prerequisites={text.prerequisites}>{text.summary}</LessonIntro>
    <Prose>{text.route}</Prose>
    <Markdown>{text.manuscript}</Markdown>
  </div>;
}
