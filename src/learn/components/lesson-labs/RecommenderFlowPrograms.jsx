import { useCallback, useEffect, useRef, useState } from 'react';
import { CodeBlock } from '../content/Code.jsx';
import { useCodeDownload } from '../content/LessonCodeDownloads.jsx';

export function RecCanonicalProgram({ filename, source, language='python', decodedSHA256 }) {
  const container=useRef(null);
  const [near,setNear]=useState(false),[code,setCode]=useState(null),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
  const getText=useCallback(()=>code??'',[code]);
  const inPractice=useCallback(()=>container.current?.closest('details,[data-lesson-ending="practice"]'),[]);
  useCodeDownload({filename,language,downloadUrl:source,getText,inPractice});
  useEffect(()=>{
    if(!('IntersectionObserver' in window)){setNear(true);return;}
    const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setNear(true);observer.disconnect();}},{rootMargin:'800px'});
    observer.observe(container.current);return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if(!near)return;
    const controller=new AbortController();setError(false);
    fetch(source,{signal:controller.signal}).then(async response=>{
      if(!response.ok||/text\/html/i.test(response.headers.get('content-type')??''))throw new Error('Program unavailable.');
      const text=(await response.text()).replaceAll('\r\n','\n');
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
      const actual=[...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
      if(actual!==decodedSHA256)throw new Error('The complete program does not match this lesson.');
      if(!controller.signal.aborted)setCode(text);
    }).catch(()=>{if(!controller.signal.aborted)setError(true);});
    return()=>controller.abort();
  },[near,source,decodedSHA256,attempt]);
  return <div ref={container} className="lesson-code-source">{code!==null?<CodeBlock filename={filename} language={language} downloadUrl={source}>{code}</CodeBlock>
    :<div className="lesson-code-source__pending"><p>{filename}</p>{error?<p role="alert">The complete program could not load. <button type="button" onClick={()=>setAttempt(value=>value+1)}>Retry</button></p>
      :<p role="status">{near?'Loading the complete program…':'The complete program loads here as you reach it.'}</p>}<a href={source} download={filename}>Download {filename}</a></div>}</div>;
}
