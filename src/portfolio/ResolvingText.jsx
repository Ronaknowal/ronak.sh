import { useEffect, useRef, useState } from "react";
import { easeOut, noiseGlyph, resolveThreshold } from "../shared/noise.js";
import { useReducedMotion } from "../shared/useReducedMotion.js";

// The portfolio's own blocky noise, distinct from Home's.
const GLYPHS = "█▓▒░╬╫╪┼╳※¤◊◈⬡⬢⎔⏣";

// Text that resolves from noise. `clarity` runs from 0 (all noise) to 1 (clean).
// Noise is drawn over each real letter, so the layout never shifts, and screen
// readers always get the real text.
export function ResolvingText({ text, clarity, as: Tag = "span", style, className }) {
  let index = 0;
  const words = text.split(" ");
  return (
    <Tag style={style} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, w) => {
          const letters = [...word].map(character => {
            const i = index++;
            return clarity > resolveThreshold(i, text.length)
              ? <span key={i} className="pf-glyph">{character}</span>
              : <span key={i} className="pf-glyph pf-glyph--noise" data-noise={noiseGlyph(GLYPHS)}>{character}</span>;
          });
          index++; // the space after the word
          // Words stay whole; lines may break only between them.
          return <span key={w}><span style={{ whiteSpace: "nowrap" }}>{letters}</span>{w < words.length - 1 ? " " : null}</span>;
        })}
      </span>
    </Tag>
  );
}

// Animates 0 → 1 once `active` turns true. Reduced motion skips straight to 1.
export function useResolve(active, { duration = 900, delay = 0 } = {}) {
  const reduced = useReducedMotion();
  const [clarity, setClarity] = useState(reduced ? 1 : 0);
  const frame = useRef(0);
  useEffect(() => {
    if (reduced) { setClarity(1); return undefined; }
    if (!active) return undefined;
    let start;
    const timer = setTimeout(() => {
      const step = now => {
        start ??= now;
        const progress = Math.min(1, (now - start) / duration);
        setClarity(easeOut(progress));
        if (progress < 1) frame.current = requestAnimationFrame(step);
      };
      frame.current = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(frame.current); };
  }, [active, reduced, duration, delay]);
  return clarity;
}

// A section heading that resolves the first time it scrolls into view.
export function SectionTitle({ children, style }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || seen) return undefined;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setSeen(true); }, { threshold: 0.6 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [seen]);
  // Wait for the section's own fade-in so the noise phase is actually visible.
  const clarity = useResolve(seen, { duration: 800, delay: 400 });
  return (
    <div ref={ref}>
      <ResolvingText as="h2" text={String(children).trim()} clarity={clarity} style={style} />
    </div>
  );
}
