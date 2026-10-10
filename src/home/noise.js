export const NOISE_GLYPHS = "▓▒░#%&*01<>/{}=+";
export const noiseGlyph = () => NOISE_GLYPHS[Math.floor(Math.random() * NOISE_GLYPHS.length)];
// Earlier letters tend to resolve first, with a fixed per-letter jitter. Always below 1.
export const resolveThreshold = (index, length) => (index / length) * 0.5 + ((index * 7919) % 13) / 13 * 0.5;
export const easeOut = progress => 1 - Math.pow(1 - progress, 2.2);
