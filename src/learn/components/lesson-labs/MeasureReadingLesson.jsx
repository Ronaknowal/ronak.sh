import { Children, Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Code, CodeBlock } from '../content/Code.jsx';
import { H2, H3 } from '../content/Headings.jsx';
import { Prose } from '../content/Prose.jsx';
import { LessonIntro } from './LessonElements.jsx';
import { LessonOpeningNote } from '../LessonOpening.jsx';
import { MRegion } from './MeasureReadingPrimitives.jsx';
import Drawing from './MeasureReadingDrawings.jsx';
import text from '../../data/measure-reading-flow-text.js';

function Programme({ file, output = false }) {
  const p = text.programmes[file];
  if (!p) throw new Error('Missing complete measure programme ' + file);
  return output ? (
    <CodeBlock filename={file.replace(/\.py$/, '') + '-output.txt'} language="output">
      {p.output}
    </CodeBlock>
  ) : (
    <div className="mt-programme" id={'mt-file-' + file.replace(/\.py$/, '')}>
      <CodeBlock filename={file} language="python">
        {p.code}
      </CodeBlock>
    </div>
  );
}
function Paragraph({ children }) {
  const rendered = [];
  let pieces = [];
  const flush = () => {
    if (pieces.length) {
      rendered.push(<Prose key={'p' + rendered.length}>{pieces}</Prose>);
      pieces = [];
    }
  };
  for (const child of Children.toArray(children)) {
    if (typeof child !== 'string') {
      pieces.push(child);
      continue;
    }
    let offset = 0;
    for (const m of child.matchAll(/\[MT_(DRAW_(MT\d{2})|(CODE|OUTPUT)_([^\]]+))\]/g)) {
      const before = child.slice(offset, m.index);
      if (before.trim()) pieces.push(before);
      flush();
      rendered.push(
        m[2] ? (
          <Drawing key={'o' + rendered.length} id={m[2]} />
        ) : (
          <Programme key={'o' + rendered.length} file={m[4]} output={m[3] === 'OUTPUT'} />
        ),
      );
      offset = m.index + m[0].length;
    }
    const rest = child.slice(offset);
    if (rest.trim()) pieces.push(rest);
  }
  flush();
  return <Fragment>{rendered}</Fragment>;
}
const components = {
  p: Paragraph,
  h2: ({ children }) => <H2>{Children.toArray(children).join('')}</H2>,
  h3: ({ children }) => <H3>{children}</H3>,
  code: ({ children }) => <Code>{children}</Code>,
  table: ({ children }) => (
    <MRegion label="Complete measure-theory table" kind="table" className="mt-table-region">
      <table className="mt-manuscript-table">{children}</table>
    </MRegion>
  ),
};
function Markdown({ children }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
}
function Inline({ children }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children: p }) => <Fragment>{p}</Fragment>,
        code: ({ children: p }) => <Code>{p}</Code>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
export default function MeasureReadingLesson() {
  const index = text.manuscript.indexOf('## Practice with changed spaces');
  if (index < 0) throw new Error('Missing complete measure practice');
  return (
    <div className="lesson-pilot lesson-flow measure-reading-lesson">
      <LessonIntro prerequisites={<Inline>{text.prerequisites}</Inline>}>
        {text.summary}
      </LessonIntro>
      <LessonOpeningNote kind="route">
        <Markdown>{text.route}</Markdown>
      </LessonOpeningNote>
      <Markdown>{text.codeGuide}</Markdown>
      <Markdown>{text.manuscript.slice(0, index)}</Markdown>
      <H3>Complete programme files</H3>
      <ul>
        {text.programmeOrder.map((file) => (
          <li key={file}>
            <a href={'#mt-file-' + file.replace(/\.py$/, '')}>{file}</a>
          </li>
        ))}
      </ul>
      <Markdown>{text.manuscript.slice(index)}</Markdown>
    </div>
  );
}
