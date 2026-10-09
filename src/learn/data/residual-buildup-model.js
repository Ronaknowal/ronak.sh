// Small exact calculations behind the residual block anatomy, stack and contrast figures.
import { correctionModel, correctionFixture, matvec } from './residual-connections-model.js';

export const anatomyInput = [2, -1];

// One block y = x + Wx. `zeroBranch` swaps in W = 0 to show the do-nothing setting.
export function anatomyState(zeroBranch = false) {
  const weight = zeroBranch ? [[0, 0], [0, 0]] : correctionFixture();
  const state = correctionModel(weight);
  return { ...state, weight };
}

// What each block form outputs for x = [2, −1] under a chosen branch and weight setting.
// Linear branch: F(x) = Wx. Tanh branch: F(x) = W₂ tanh(W₁x) with W₁ = I.
export function identityRequirement(branch, setting) {
  const x = anatomyInput;
  const weight = setting === 'zero' ? [[0, 0], [0, 0]] : setting === 'identity' ? [[1, 0], [0, 1]] : correctionFixture();
  const hidden = branch === 'tanh' ? x.map(Math.tanh) : x;
  const correction = matvec(weight, hidden);
  const plain = correction;
  const residual = x.map((value, i) => value + correction[i]);
  const same = values => values.every((value, i) => Math.abs(value - x[i]) < 1e-12);
  return { x, hidden, weight, correction, plain, residual, plainKeepsX: same(plain), residualKeepsX: same(residual) };
}

// Three scalar blocks with branch F(x) = a·x and skip multiplier λ (He et al. 2016, Eq. 6:
// x_{k+1} = λ x_k + F(x_k)). λ = 1 is the identity skip; withSkips = false removes the skip.
export function scalarChain(slope, withSkips, blocks = 3, input = 1, skipScale = 1) {
  const lambda = withSkips ? skipScale : 0;
  const multiplier = lambda + slope;
  const values = [input];
  const corrections = [];
  for (let k = 0; k < blocks; k++) {
    const correction = slope * values[k];
    corrections.push(correction);
    values.push(lambda * values[k] + correction);
  }
  // Derivative of the final value with respect to each intermediate value, from the output back.
  const sensitivities = values.map((_, k) => multiplier ** (blocks - k));
  // The purely direct term of Eq. 8: what reaches the start through the skips alone.
  return { lambda, multiplier, values, corrections, sensitivities, total: multiplier ** blocks, directTerm: lambda ** blocks };
}

// He et al. 2015, Table 2: ImageNet validation top-1 error (%, 10-crop). Plain nets used BatchNorm.
export const degradationTable = [
  { depth: 18, plain: 27.94, residual: 27.88 },
  { depth: 34, plain: 28.54, residual: 25.03 },
];

// He et al. 2016, Table 1: CIFAR-10 test error of ResNet-110 with the shortcut modified in every unit.
export const shortcutTable = [
  { variant: 'Identity shortcut (original)', shortcut: '1', branch: '1', error: '6.61' },
  { variant: 'Constant scaling', shortcut: '0.5', branch: '1', error: 'fail' },
  { variant: 'Constant scaling', shortcut: '0.5', branch: '0.5', error: '12.35' },
  { variant: '1×1 convolution shortcut', shortcut: '1×1 conv', branch: '1', error: '12.22' },
  { variant: 'Dropout shortcut', shortcut: 'dropout 0.5', branch: '1', error: 'fail' },
];

// Addition keeps two aligned coordinates; concatenation keeps four separate ones.
export function joinBoth(x = [2, -1], correction = [0, 0.5]) {
  return { added: x.map((value, i) => value + correction[i]), concatenated: [...x, ...correction] };
}

// Projection skip used in the shape section: P maps two features to three.
export function projectionBlock() {
  const input = [2, -1];
  const projection = [[1, 0], [0, 1], [1, 1]];
  const skip = matvec(projection, input);
  const correction = [0.1, -0.2, 0.3];
  return { input, projection, skip, correction, output: skip.map((value, i) => value + correction[i]) };
}

// Highway block at scalar x with H(x) = 2x and gate T(x) = sigmoid(w_T x + b_T).
export function highwayBlock(x = 1, gateBias = 0, gateWeight = 1) {
  const transform = 2 * x;
  const gate = 1 / (1 + Math.exp(-(gateWeight * x + gateBias)));
  return { x, transform, gate, carry: (1 - gate) * x, carried: gate * transform, output: (1 - gate) * x + gate * transform };
}
