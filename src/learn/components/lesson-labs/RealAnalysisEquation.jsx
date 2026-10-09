import { useEffect, useRef, useState } from 'react';
import { MathBlock as SharedMathBlock } from '../content/Math.jsx';
import './real-analysis-figures.css';

export function MathBlock({children,caption}) {
  const ref=useRef(null), [overflows,setOverflows]=useState(false);
  useEffect(()=>{const node=ref.current,measure=()=>setOverflows(node.scrollWidth>node.clientWidth+1);measure();const observer=new ResizeObserver(measure);observer.observe(node);observer.observe(node.firstElementChild);document.fonts?.ready.then(measure);return()=>observer.disconnect();},[children]);
  return <><div className="analysis-equation-scroll" role="region" tabIndex={0} aria-label="Complete displayed equation" ref={ref}><SharedMathBlock>{children}</SharedMathBlock></div>{overflows&&<p className="ra-scroll-hint">Equation continues horizontally. Focus it and use Left or Right to read the full expression.</p>}{caption&&<p>{caption}</p>}</>;
}
