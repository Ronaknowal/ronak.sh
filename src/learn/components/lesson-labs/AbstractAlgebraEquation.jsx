import { useEffect, useRef, useState } from "react";
import { MathBlock as SharedMathBlock } from "../content/Math.jsx";
function MathBlock({ children, caption }) {
  const host = useRef(null), [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const node = host.current;
    const measure = () => setOverflow(node.scrollWidth > node.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    for (const child of node.children) observer.observe(child);
    document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [children]);
  return <div className="aa-equation"><div ref={host} className="aa-equation-scroll" role="region" tabIndex={0} aria-label="Complete algebra equation; keyboard-scrollable horizontally"><div className="aa-equation-inner"><SharedMathBlock>{children}</SharedMathBlock></div></div>{overflow && <p className="aa-scroll-hint">Focus the equation and use Left/Right to inspect every term.</p>}{caption && <p>{caption}</p>}</div>;
}
export {
  MathBlock
};
