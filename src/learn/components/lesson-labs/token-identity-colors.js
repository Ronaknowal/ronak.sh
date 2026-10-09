// Identity hues help follow labelled pieces across a transformation. The finite
// palette is not a vocabulary/ID assignment or a measure of semantic similarity.
const identityColors = ["#e2b55a", "#60a5fa", "#c084fc", "#f472b6"];
const workedExampleHues = {
  low: 0, est: 3, e: 0, s: 1, es: 2,
  a: 0, b: 1, ab: 2, c: 3,
  cat: 0, cats: 2, t: 2, "猫": 1, "猫猫": 2,
  solar: 0, panel: 1, cost: 3, photovoltaic: 2,
  ca: 0, "byte:195": 1, "byte:169": 3,
  "corpus:english": 0, "corpus:hindi": 1, "corpus:chinese": 2,
  "corpus:A": 0, "corpus:B": 1,
};

export function tokenIdentityStyle(identity) {
  const key = String(identity);
  let index = Object.hasOwn(workedExampleHues, key) ? workedExampleHues[key] : undefined;
  if (index === undefined) {
    let value = 0;
    for (const character of key) value = (Math.imul(value, 31) + character.codePointAt(0)) >>> 0;
    index = value % identityColors.length;
  }
  const color = identityColors[index];
  return {
    "--token-identity-color": color,
    "--token-identity-background": `${color}26`,
    "--token-identity-border": `${color}b3`,
    color,
    backgroundColor: `${color}26`,
    borderColor: `${color}b3`,
  };
}
