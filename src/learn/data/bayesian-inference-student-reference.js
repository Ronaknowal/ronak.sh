// Fixed-degree Student reference for the lesson degrees 8 and 14.
// Numerical code is identical to the independently checked preparation.
// Scale is horizontal scale; probabilities integrate a standardized t variable.
const degrees = {
  8: { power: 3, coefficient: 35 / 32 },
  14: { power: 6, coefficient: 3003 / 2048 },
};
const choose = (n, k) => {
  let result = 1;
  for (let i = 1; i <= k; i += 1) result *= (n - i + 1) / i;
  return result;
};
function parameters(df) {
  if (!Object.hasOwn(degrees, df)) throw new Error('Use the lesson degrees 8 or 14.');
  return degrees[df];
}
export function studentDensity(x, df) {
  const { coefficient } = parameters(df);
  if (!Number.isFinite(x)) throw new Error('Use a finite standardized coordinate.');
  return coefficient / Math.sqrt(df) * (1 + x * x / df) ** (-(df + 1) / 2);
}
export function studentSurvival(x, df) {
  const { power, coefficient } = parameters(df);
  if (!Number.isFinite(x)) throw new Error('Use a finite standardized coordinate.');
  if (x === 0) return 0.5;
  if (x < 0) return 1 - studentSurvival(-x, df);
  // x/sqrt(df+x^2)=sin(theta). The finite even-degree tail integrates
  // (1-u^2)^power from u=sin(theta) to 1. Use w=1-u without subtracting
  // two nearly equal floating-point numbers: w=df/(h*(h+x)).
  const h = Math.hypot(Math.sqrt(df), x);
  const w = df / h / (h + x);
  let integral = 0;
  for (let k = 0; k <= power; k += 1) {
    integral += (-1) ** k * choose(power, k) * 2 ** (power - k)
      * w ** (power + k + 1) / (power + k + 1);
  }
  return coefficient * integral;
}
export const studentCdf = (x, df) => studentSurvival(-x, df);
export function studentQuantile(probability, df) {
  parameters(df);
  // These endpoints cover the lesson's 90–99% equal-tailed intervals.
  if (!Number.isFinite(probability) || probability < 0.005 || probability > 0.995) {
    throw new Error('This reference inverts probabilities from .005 through .995.');
  }
  if (probability === 0.5) return 0;
  const upper = Math.min(probability, 1 - probability);
  let low = 0;
  let high = 1;
  while (studentSurvival(high, df) > upper) high *= 2;
  for (let step = 0; step < 70; step += 1) {
    const middle = (low + high) / 2;
    if (studentSurvival(middle, df) > upper) low = middle;
    else high = middle;
  }
  return (probability < 0.5 ? -1 : 1) * (low + high) / 2;
}
