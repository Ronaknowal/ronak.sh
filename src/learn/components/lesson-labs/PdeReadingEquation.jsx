import { useEffect, useId, useRef, useState } from 'react';
import { MathBlock } from '../content/Math.jsx';
import './pde-reading-flow.css';

export function PdeReadingEquation({ children, ...props }) {
  const ref = useRef(null), hint = useId();
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const node = ref.current;
    const measure = () => setOverflow(node.scrollWidth > node.clientWidth + 2);
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    measure();
    return () => observer.disconnect();
  }, [children]);
  return <div className="pde-equation">
    <div ref={ref} className="pde-equation-region" role="region" tabIndex={0}
      aria-label="Complete PDE equation" aria-describedby={overflow ? hint : undefined}>
      <div className="pde-equation-inner"><MathBlock {...props}>{children}</MathBlock></div>
    </div>
    {overflow && <p id={hint} className="pde-reading-scroll-note">Focus this equation and use Left/Right to read its full width.</p>}
  </div>;
}
