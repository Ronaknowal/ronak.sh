import React, { useState } from 'react';
import { files } from './file-index-data.js';
function FileActions({
  file
}) {
  const [message, setMessage] = useState('');
  async function copy() {
    setMessage('');
    try {
      const response = await fetch(file.url);
      if (!response.ok || /text\/html/.test(response.headers.get('content-type') || '')) throw Error();
      const text = await response.text();
      await navigator.clipboard.writeText(text);
      setMessage('Copied complete file');
    } catch {
      setMessage('Copy unavailable. Open or download the complete file to copy it manually.');
    }
  }
  return <div className="nmf-file-actions"><button type="button" aria-label={`Copy complete ${file.filename}`} onClick={copy}>Copy</button><a href={file.url} download={file.filename} aria-label={`Download complete ${file.filename}`}>Download</a><a href={file.url} target="_blank" rel="noreferrer">Open complete file</a><span role="status" aria-live="polite">{message}</span></div>;
}
export function FileIndex() {
  return <div className="nmf-files"><p>Save these files together with their supplied filenames. The programs beside their explanations have the same complete-source Copy and Download actions.</p><ul>{files.map(file => <li key={file.filename}><strong>{file.filename}</strong> · {file.role}<FileActions file={file} /></li>)}</ul></div>;
}
