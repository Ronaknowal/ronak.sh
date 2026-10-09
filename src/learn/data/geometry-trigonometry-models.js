// Finite educational controls, not arbitrary-range geometric software.
function grid(value, low, high, step, name) {
  if (!Number.isFinite(value) || value < low || value > high || !Number.isInteger(value / step) || Math.round(value / step) * step !== value) {
    throw new RangeError(`${name} must be ${low} to ${high}, in steps of ${step}.`);
  }
  return value;
}
export function formatGeometry(value, digits = 4) {
  if (value === null) return 'undefined';
  if (!Number.isFinite(value)) throw new RangeError('A finite readout is required.');
  if (value === 0) return '0';
  return Math.abs(value) < 10 ** -digits ? value.toExponential(2) : String(Number(value.toFixed(digits)));
}
export function circleComponents(degrees) {
  grid(degrees, -360, 360, 15, 'Angle');
  const radians = degrees * Math.PI / 180;
  const wrapped = (degrees % 360 + 360) % 360;
  let cosine = Math.cos(radians);
  let sine = Math.sin(radians);
  // These are exact known cardinal values, not a small-number clamp.
  if (wrapped % 90 === 0) {
    [cosine, sine] = [[1, 0], [0, 1], [-1, 0], [0, -1]][wrapped / 90];
  }
  return {
    degrees,
    radians,
    wrapped,
    cosine,
    sine,
    tangent: cosine === 0 ? null : sine / cosine
  };
}
export function arcState(radius, degrees) {
  grid(radius, 1, 3, 0.5, 'Radius');
  grid(degrees, 15, 330, 15, 'Sweep');
  const components = circleComponents(degrees);
  return {
    ...components,
    radius,
    arc: radius * components.radians,
    area: radius * radius * components.radians / 2
  };
}
export function similarityState(shape, scale) {
  grid(scale, 0.5, 3, 0.25, 'Scale');
  const shapes = {
    '3-4-5': [4, 3],
    '5-12-13': [12, 5],
    'equal-legs': [3, 3]
  };
  if (!Object.hasOwn(shapes, shape)) throw new RangeError('Choose a listed triangle.');
  const [adjacent, opposite] = shapes[shape];
  const hypotenuse = Math.hypot(adjacent, opposite);
  return {
    shape,
    scale,
    adjacent,
    opposite,
    hypotenuse,
    angle: Math.atan2(opposite, adjacent),
    sine: opposite / hypotenuse,
    cosine: adjacent / hypotenuse,
    tangent: opposite / adjacent,
    originalArea: adjacent * opposite / 2,
    scaledArea: adjacent * opposite * scale * scale / 2
  };
}
export function bearingState(x, y) {
  grid(x, -6, 6, 1, 'x');
  grid(y, -6, 6, 1, 'y');
  const radius = Math.hypot(x, y);
  let angle = radius === 0 ? null : Math.atan2(y, x);
  if (angle === -Math.PI) angle = Math.PI;
  const naive = x === 0 ? null : Math.atan(y / x);
  return {
    x,
    y,
    radius,
    angle,
    degrees: angle === null ? null : angle * 180 / Math.PI,
    naive,
    quadrant: radius === 0 ? 'origin: no direction' : x === 0 || y === 0 ? 'on an axis' : x > 0 ? y > 0 ? 'quadrant I' : 'quadrant IV' : y > 0 ? 'quadrant II' : 'quadrant III'
  };
}
export function frameState(px, py, ox, oy, degrees, mode) {
  grid(px, -4, 4, 1, 'Point x');
  grid(py, -4, 4, 1, 'Point y');
  grid(ox, -2, 2, 1, 'Origin x');
  grid(oy, -2, 2, 1, 'Origin y');
  grid(degrees, -180, 180, 15, 'Frame angle');
  if (!['passive', 'active'].includes(mode)) throw new RangeError('Choose active or passive.');
  const {
    cosine: c,
    sine: s
  } = circleComponents(degrees);
  const dx = px - ox;
  const dy = py - oy;
  const local = [c * dx + s * dy, -s * dx + c * dy];
  const reconstructed = [ox + c * local[0] - s * local[1], oy + s * local[0] + c * local[1]];
  const rotated = [ox + c * dx - s * dy, oy + s * dx + c * dy];
  return {
    point: [px, py],
    origin: [ox, oy],
    degrees,
    mode,
    cosine: c,
    sine: s,
    displacement: [dx, dy],
    local,
    reconstructed,
    rotated,
    radius: Math.hypot(dx, dy),
    result: mode === 'passive' ? local : rotated
  };
}
export function dissectionState(a = 3, b = 4) {
  grid(a, 1, 20, 1, 'Leg a');
  grid(b, 1, 20, 1, 'Leg b');
  return {
    a,
    b,
    side: a + b,
    central: [[a, 0], [a + b, a], [b, a + b], [0, b]],
    triangleArea: a * b / 2,
    squareArea: a * a + b * b,
    hypotenuse: Math.hypot(a, b)
  };
}
export function ambiguousTriangleState() {
  // A=30 degrees, a=7, b=10. C=(5√3,5); ray-circle intersections are exact radicals.
  const cx = 5 * Math.sqrt(3);
  const cy = 5;
  return {
    A: Math.PI / 6,
    a: 7,
    b: 10,
    C: [cx, cy],
    candidates: [-1, 1].map(sign => {
      const c = cx + sign * Math.sqrt(24);
      const B = Math.atan2(cy, c - cx);
      return {
        c,
        B,
        Cangle: Math.PI - Math.PI / 6 - B,
        area: c * cy / 2
      };
    })
  };
}

export function ssaState(a) {
  grid(a, 4, 12, 1, 'Opposite side');
  const cx = 5 * Math.sqrt(3), cy = 5;
  const discriminant = a * a - cy * cy;
  // At a=b=10 the near intersection is exactly the source, not a small positive root.
  const roots = a === 10 ? [0, 2*cx] : discriminant < 0 ? [] : discriminant === 0 ? [cx] : [cx - Math.sqrt(discriminant), cx + Math.sqrt(discriminant)];
  const candidates = roots.filter(c => c > 0).map(c => {
    const B = Math.atan2(cy, c - cx);
    return { c, B, Cangle: Math.PI - Math.PI / 6 - B, area: c * cy / 2 };
  });
  return { a, b: 10, A: Math.PI / 6, C: [cx, cy], roots, candidates, collapsed: roots.filter(c => c === 0) };
}

export function originDisplacementState(ox, oy) {
  grid(ox, -2, 2, 1, 'Origin x');
  grid(oy, -2, 2, 1, 'Origin y');
  const c = Math.sqrt(3) / 2, s = 0.5;
  const local = ([x,y]) => [c * (x-ox) + s * (y-oy), -s * (x-ox) + c * (y-oy)];
  const p = local([1,2]), q = local([4,6]);
  return { origin: [ox,oy], p, q, difference: [q[0]-p[0],q[1]-p[1]], worldDifference: [3,4], length: 5 };
}

export function twoLinkState(theta, phi) {
  grid(theta, -180, 180, 15, 'Shoulder angle');
  grid(phi, -180, 180, 15, 'Relative elbow angle');
  const first = circleComponents(theta), second = circleComponents(theta + phi);
  const elbow = [2 * first.cosine, 2 * first.sine];
  const endpoint = [elbow[0] + second.cosine, elbow[1] + second.sine];
  return { theta, phi, elbow, endpoint, radius: Math.hypot(...endpoint), radiusSquared: 5 + 4 * circleComponents(phi).cosine, minRadius: 1, maxRadius: 3 };
}
