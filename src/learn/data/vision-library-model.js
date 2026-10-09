export const initialPixels = Array.from({ length: 16 }, (_, index) => index);
export const imageKernels = { mean: Array(9).fill(1 / 9), difference: [-1,0,1,-1,0,1,-1,0,1] };
export function validPixelFilter(pixels, kernelName = 'mean') {
  if (pixels.length !== 16 || pixels.some(value => !Number.isFinite(value))) throw new Error('Expected 16 finite pixels');
  const kernel = imageKernels[kernelName];
  if (!kernel) throw new Error('Unknown kernel');
  return Array.from({ length: 4 }, (_, index) => {
    const y = Math.floor(index / 2), x = index % 2;
    const indices = Array.from({ length: 9 }, (_, offset) => (y + Math.floor(offset / 3)) * 4 + x + offset % 3);
    const products = indices.map((source, i) => pixels[source] * kernel[i]);
    return { x, y, indices, products, value: products.reduce((sum, value) => sum + value, 0) };
  });
}
export function cropFlipRectangle(left, width, flip = false, box = [1,1,4,3]) {
  if (!Number.isInteger(left) || !Number.isInteger(width) || left < 0 || width < 1 || left + width > 6) throw new Error('Crop must fit the six-column image');
  let x1 = Math.max(0, Math.min(width, box[0] - left));
  let x2 = Math.max(0, Math.min(width, box[2] - left));
  if (x2 <= x1) return null;
  if (flip) [x1, x2] = [width - x2, width - x1];
  return [x1, box[1], x2, box[3]];
}
