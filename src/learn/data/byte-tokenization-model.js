const encoder = new TextEncoder();
const segmenter = typeof Intl.Segmenter === "function"
  ? new Intl.Segmenter("und", { granularity: "grapheme" })
  : null;

export const hexByte = value => value.toString(16).toUpperCase().padStart(2, "0");

export function validateScalarText(text) {
  const characters = Array.from(text);
  if (characters.length > 48) {
    throw new Error("Keep this inspector to at most 48 Unicode scalars.");
  }
  if (characters.some(character => {
    const value = character.codePointAt(0);
    return value >= 0xD800 && value <= 0xDFFF;
  })) {
    throw new Error("This input has an unpaired UTF-16 surrogate. Supply well-formed Unicode text.");
  }
  return characters;
}

export function inspectByteText(text, normalization = "none") {
  validateScalarText(text);
  const normalized = normalization === "none" ? text : text.normalize(normalization);
  const scalars = Array.from(normalized).map(character => ({
    character,
    codePoint: `U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`,
    bytes: Array.from(encoder.encode(character)),
  }));
  const graphemes = segmenter
    ? Array.from(segmenter.segment(normalized), entry => entry.segment)
    : null;
  return {
    text: normalized,
    scalars,
    graphemes,
    bytes: Array.from(encoder.encode(normalized)),
    originalBytes: Array.from(encoder.encode(text)),
    changed: normalized !== text,
    utf16Units: normalized.length,
  };
}

function pendingCount(prefix) {
  let needed = 0;
  for (const byte of prefix) {
    if (needed) needed -= 1;
    else if (byte >= 0xF0) needed = 3;
    else if (byte >= 0xE0) needed = 2;
    else if (byte >= 0xC0) needed = 1;
  }
  return needed;
}

export function streamingByteTrace(text, split, truncate = false) {
  const { bytes: original } = inspectByteText(text);
  const bytes = truncate ? original.slice(0, -1) : original;
  const boundary = Math.max(0, Math.min(bytes.length, split));
  const chunks = [bytes.slice(0, boundary), bytes.slice(boundary)];
  const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
  const trace = [];
  let output = "";
  let error = null;
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    try {
      const emitted = decoder.decode(Uint8Array.from(chunk), { stream: true });
      output += emitted;
      trace.push({
        chunk,
        emitted,
        output,
        needed: pendingCount(bytes.slice(0, index ? bytes.length : boundary)),
      });
    } catch {
      error = "Malformed UTF-8 byte sequence";
    }
  }
  try {
    output += decoder.decode();
  } catch {
    error = "Final flush rejected an incomplete scalar";
  }
  const separately = chunks.map(chunk => new TextDecoder("utf-8", { ignoreBOM: true })
    .decode(Uint8Array.from(chunk))).join("");
  return {
    bytes,
    chunks,
    trace,
    output,
    error,
    separately,
    agrees: !error && separately === output,
    originalLength: original.length,
  };
}

export const patchText = "cafe abc";
export const initialByteProbabilities = [0.5, 0.99, 0.99, 0.5, 0.9, 0.99, 0.5, 0.99];

export function binaryEntropy(probability) {
  if (!(probability >= 0 && probability <= 1)) {
    throw new Error("Probability must lie in [0,1]");
  }
  if (probability === 0 || probability === 1) return 0;
  return -probability * Math.log2(probability) - (1 - probability) * Math.log2(1 - probability);
}

export function bytePatchTrace(probabilities, threshold) {
  if (probabilities.length !== patchText.length || !Number.isFinite(threshold)
    || threshold < 0 || threshold > 1) {
    throw new Error("Invalid patch configuration");
  }
  const entropies = probabilities.map(binaryEntropy);
  const patches = [];
  const ids = [];
  entropies.forEach((entropy, index) => {
    if (index === 0 || entropy > threshold) patches.push([]);
    patches.at(-1).push(index);
    ids.push(patches.length - 1);
  });
  const count = probabilities.length;
  return {
    entropies,
    patches,
    ids,
    bytePairs: count * (count + 1) / 2,
    patchPairs: patches.length * (patches.length + 1) / 2,
  };
}
