import { useEffect, useRef, useState } from "react";
import { easeOut, noiseGlyph, resolveThreshold } from "./noise.js";
import { useReducedMotion } from "./useReducedMotion.js";

// Only "training it" resolves. Noise is drawn over each real letter, so the layout never moves.
function ResolvingPhrase({ text }) {
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(reduced ? 1 : 0);
  const frame = useRef(0);

  const play = duration => {
    cancelAnimationFrame(frame.current);
    const start = performance.now();
    const step = now => {
      const elapsed = Math.min(1, (now - start) / duration);
      setProgress(easeOut(elapsed));
      if (elapsed < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    if (reduced) { setProgress(1); return undefined; }
    const timer = setTimeout(() => play(1100), 250);
    return () => { clearTimeout(timer); cancelAnimationFrame(frame.current); };
  }, [reduced]);

  return (
    <span className="home-motto__phrase" onPointerEnter={reduced ? undefined : () => play(450)}>
      {[...text].map((character, index) => character === " " ? " " : progress > resolveThreshold(index, text.length)
        ? <span key={index} className="home-glyph">{character}</span>
        : <span key={index} className="home-glyph home-glyph--noise" data-noise={noiseGlyph()}>{character}</span>)}
    </span>
  );
}

export default function HeroMotto() {
  return (
    <p className="home-motto">
      <span className="sr-only">I learn by training it from scratch.</span>
      <span aria-hidden="true">I learn by <ResolvingPhrase text="training it" /> from scratch.</span>
    </p>
  );
}
