import { useEffect, useRef, useState } from "react";
import { noiseGlyph } from "./noise.js";
import { useReducedMotion } from "./useReducedMotion.js";

// A short echo of the hero: a name briefly re-resolves from noise on hover.
export function useScrambleOnHover(text, duration = 320) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(text);
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const scramble = () => {
    if (reduced) return;
    cancelAnimationFrame(frame.current);
    const start = performance.now();
    const step = now => {
      const progress = Math.min(1, (now - start) / duration);
      setDisplay([...text].map((character, index) => character === " " || progress > index / text.length ? character : noiseGlyph()).join(""));
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  };

  return { display, scramble };
}
