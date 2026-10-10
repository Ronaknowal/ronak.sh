// The site's noise-to-signal motif, shared by Home and Portfolio.
export const NOISE_GLYPHS = "▓▒░#%&*01<>/{}=+";
export const noiseGlyph = (glyphs = NOISE_GLYPHS) => glyphs[Math.floor(Math.random() * glyphs.length)];
// Earlier letters tend to resolve first, with a fixed per-letter jitter. Always below 1.
export const resolveThreshold = (index, length) => (index / length) * 0.5 + ((index * 7919) % 13) / 13 * 0.5;
export const easeOut = progress => 1 - Math.pow(1 - progress, 2.2);
