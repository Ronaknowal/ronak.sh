import { useCallback, useEffect, useRef, useState } from 'react';
import { useCodeDownload } from '../content/LessonCodeDownloads.jsx';
import '../content/lesson-code.css';

const hexadecimal = bytes => [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
async function sha256(bytes) {
  return hexadecimal(await crypto.subtle.digest('SHA-256', bytes));
}

// Contextual display and full-file copy intentionally have distinct sources.
// All display ranges come from the accepted strict canonical slice map.
export function MultiLabelProgramSource({ context }) {
  const container = useRef(null);
  const [near, setNear] = useState(false);
  const [source, setSource] = useState(null);
  const [focused, setFocused] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState('');
  const timer = useRef(null);
  const request = useRef(0);
  const getText = useCallback(() => source || '', [source]);
  const inPractice = useCallback(() => container.current?.closest('details,[data-lesson-exercise],[data-lesson-ending="practice"],.neural-practice'), []);
  const url = `/learn-code/multi-label-multi-output-learning/${context.filename}`;
  useCodeDownload({ filename: context.filename, language: 'python', downloadUrl: url, title: context.title, getText, inPractice });
  useEffect(() => {
    if (!('IntersectionObserver' in window)) { setNear(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setNear(true); observer.disconnect(); }
    }, { rootMargin: '600px' });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!near) return;
    const controller = new AbortController();
    setError('');
    async function load() {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok || /text\/html/i.test(response.headers.get('content-type') || '')) throw new Error('The complete program could not load.');
      const bytes = await response.arrayBuffer();
      if (await sha256(bytes) !== context.sha256) throw new Error('The downloaded program does not match this teaching view.');
      const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      const lines = text.replaceAll('\r\n', '\n').split('\n');
      const pieces = [];
      if (context.fullDisplay) pieces.push({ name: 'Complete program', text });
      else for (const range of context.ranges) {
        const excerpt = `${lines.slice(range.start - 1, range.end).join('\n')}\n`;
        if (await sha256(new TextEncoder().encode(excerpt)) !== range.sha256) throw new Error('A displayed function does not match its complete source.');
        pieces.push({ name: range.name, text: excerpt });
      }
      if (!controller.signal.aborted) { setSource(text); setFocused(pieces); }
    }
    load().catch(failure => { if (!controller.signal.aborted) setError(failure.message); });
    return () => controller.abort();
  }, [near, url, context, attempt]);
  useEffect(() => () => { request.current += 1; window.clearTimeout(timer.current); }, []);
  async function copy() {
    const current = ++request.current;
    window.clearTimeout(timer.current);
    setMessage('');
    try {
      await navigator.clipboard.writeText(source);
      if (current !== request.current) return;
      setMessage('Copied complete program');
      timer.current = window.setTimeout(() => setMessage(''), 2200);
    } catch {
      if (current === request.current) setMessage('Copy unavailable. Download the complete program or select the visible function manually.');
    }
  }
  return <div ref={container} className="lesson-code-source mlf-program" data-multilabel-program={context.filename} data-multilabel-context={context.key}>
    <div className="lesson-code" data-code-kind="code">
      <div className="lesson-code__toolbar">
        <div className="lesson-code__identity"><span>{context.title}</span><span className="lesson-code__filename">{context.filename}</span></div>
        <div className="lesson-code__actions">
          <button type="button" className="lesson-code__copy" disabled={!source || Boolean(error)} data-copied={message === 'Copied complete program' ? '' : undefined} onClick={copy} aria-label={`Copy complete ${context.filename}`}>{message === 'Copied complete program' ? '✓ Copied' : 'Copy complete file'}</button>
          <a href={url} download={context.filename} aria-label={`Download ${context.filename}`}>Download</a>
        </div>
        <span className={`lesson-code__status${message === 'Copied complete program' ? ' lesson-code__status--success' : ''}`} role="status" aria-live="polite">{message}</span>
      </div>
      {error ? <p role="alert">{error} <button type="button" onClick={() => setAttempt(value => value + 1)}>Retry program</button></p>
        : focused ? focused.map(piece => <div key={piece.name}><p>{piece.name}</p><pre tabIndex={0} aria-label={`${context.filename}, ${piece.name}; scroll horizontally when needed`}><code>{piece.text}</code></pre></div>)
          : <p role="status">{near ? 'Loading the complete program and checking these exact functions…' : 'The exact program loads automatically as you approach this part.'}</p>}
    </div>
    {!context.fullDisplay && <p>These complete functions are shown where used. Copy and Download supply the entire {context.filename} file{context.dependencies.length ? `; put ${context.dependencies.join(', ')} beside it` : ''}.</p>}
  </div>;
}
