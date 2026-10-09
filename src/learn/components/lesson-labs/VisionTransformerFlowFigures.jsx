import { useEffect, useId, useRef, useState } from 'react';
import { flowNumber } from './LessonFlow.jsx';
import './vision-transformer-flow.css';

export const visionFlowColors = {
  input: '#73cbd5', parameter: '#e0b660', computed: '#b69ae8',
  text: '#e6e6e6', operation: '#d2d2d2', forward: '#969696', gradient: '#ef9969',
};

// These primitives represent actual data/operations; they are not lesson cards.
export function VisionFlowDrawing({ label, width = 400, height, children }) {
  const identifier = useId().replace(/:/g, '');
  const arrowId = `vision-arrow-${identifier}`;
  const viewport = useRef(null);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const region = viewport.current;
    if (!region) return undefined;
    const measure = () => setOverflows(region.scrollWidth > region.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(region);
    observer.observe(region.querySelector('svg'));
    return () => observer.disconnect();
  }, [width]);
  return <div className="vision-flow-figure">
    <div ref={viewport} className="vision-flow-drawing-scroll" tabIndex={0} role="region" aria-label={label}
      aria-describedby={overflows ? `${identifier}-pan-hint` : undefined}>
    <svg className="vision-flow-drawing" viewBox={`0 0 ${width} ${height}`}
      style={{ minWidth: `${width/16}rem`, maxWidth: `${width/16}rem` }} role="img" aria-labelledby={`${identifier}-title`}>
      <title id={`${identifier}-title`}>{label}</title>
      <defs><marker id={arrowId} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path d="M0 0 L7 3.5 L0 7" fill={visionFlowColors.forward} />
      </marker><marker id={`${arrowId}-gradient`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path d="M0 0 L7 3.5 L0 7" fill={visionFlowColors.gradient} />
      </marker></defs>
      {typeof children === 'function' ? children(arrowId) : children}
    </svg>
    </div>
    {overflows && <p id={`${identifier}-pan-hint`} className="vision-flow-pan-hint">
      Scroll horizontally to see the complete diagram. Focus it and use the arrow keys, or swipe sideways.
    </p>}
  </div>;
}

export function VisionFlowWire({ path, arrowId, color = visionFlowColors.forward, dashed = false }) {
  return <path d={path} fill="none" stroke={color} strokeWidth="1.5"
    strokeDasharray={dashed ? '5 4' : undefined} markerEnd={`url(#${color===visionFlowColors.gradient?`${arrowId}-gradient`:arrowId})`} />;
}

export function VisionFlowCells({ x, y, rows, label, role = 'computed', cellWidth = 76, cellHeight = 34, digits = 4 }) {
  return <g>
    <text x={x} y={y - 14} fill={visionFlowColors[role]}>{label}</text>
    {rows.map((row, rowIndex) => row.map((value, coordinate) => (
      <g key={`${rowIndex}-${coordinate}`}>
        <rect x={x + coordinate * cellWidth} y={y + rowIndex * cellHeight}
          width={cellWidth} height={cellHeight} fill="#0a0a0a" stroke={visionFlowColors[role]} />
        <text x={x + (coordinate + .5) * cellWidth} y={y + (rowIndex + .5) * cellHeight + 5}
          textAnchor="middle" fill={role==='gradient'?visionFlowColors.gradient:visionFlowColors.text}>
          {typeof value === 'number' ? flowNumber(value, digits) : value}
        </text>
      </g>
    )))}
  </g>;
}

export function VisionImagePatchDrawing() {
  const image = Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, column) => row * 4 + column));
  const origins = [[0,0],[0,2],[2,0],[2,2]];
  return <VisionFlowDrawing width={340} height={910}
    label="A four-by-four grayscale image split into four physical two-by-two patches, then raster-ordered into four pixel vectors. All original row and column identities stay visible.">
    {arrowId => <>
      <text x="20" y="24" fill={visionFlowColors.input}>Image: row and column coordinates</text>
      <text x="20" y="48" fill={visionFlowColors.text}>Grayscale: 0 dark → 15 light</text>
      {image.map((row, r) => row.map((value, c) => (
        <g key={`${r}-${c}`}>
          <rect x={62 + c * 54} y={90 + r * 54} width="54" height="54"
            fill={`rgb(${30 + value * 11},${30 + value * 11},${30 + value * 11})`}
            stroke={visionFlowColors.input} />
          <text x={89 + c * 54} y={122 + r * 54} textAnchor="middle" fill={value > 8 ? '#080808' : '#eeeeee'}>{value}</text>
        </g>
      )))}
      {[0,1,2,3].map(coordinate => <g key={coordinate}>
        <text x={89 + coordinate * 54} y="77" textAnchor="middle">c{coordinate}</text>
        <text x="37" y={122 + coordinate * 54} textAnchor="middle">r{coordinate}</text>
      </g>)}
      {origins.map(([row,column], patch) => <rect key={patch} x={62 + column * 54} y={90 + row * 54}
        width="108" height="108" fill="none" stroke="#eeeeee" strokeWidth="3" />)}
      <VisionFlowWire path="M170 307 V348" arrowId={arrowId} />
      <text x="20" y="377">Patch order: top row → bottom row</text>
      {origins.map(([row,column], patch) => {
        const y = 412 + patch * 121;
        const values = [image[row][column],image[row][column+1],image[row+1][column],image[row+1][column+1]];
        return <g key={patch}>
          <text x="20" y={y - 12} fill={visionFlowColors.input}>Patch {patch}: rows {row}–{row+1}, columns {column}–{column+1}</text>
          {values.map((value, index) => <g key={index}>
            <rect x={20 + index % 2 * 34} y={y + Math.floor(index/2) * 34} width="34" height="34"
              fill={`rgb(${30 + value * 11},${30 + value * 11},${30 + value * 11})`} stroke={visionFlowColors.input} />
            <text x={37 + index % 2 * 34} y={y + Math.floor(index/2) * 34 + 22} textAnchor="middle"
              fill={value > 8 ? '#080808' : '#eeeeee'}>{value}</text>
          </g>)}
          <VisionFlowWire path={`M88 ${y+34} H120`} arrowId={arrowId} />
          <VisionFlowCells x={130} y={y+17} rows={[values]} label={`Pixel vector ${patch}`} role="input" cellWidth={48} />
        </g>;
      })}
    </>}
  </VisionFlowDrawing>;
}

function VisionFeatureRoute({ feature, pixels, weights, bias, selectedPixel }) {
  const products = pixels.map((value, coordinate) => value * weights[coordinate]);
  const output = products.reduce((total, value) => total + value, 0) + bias;
  return <VisionFlowDrawing width={340} height={510}
    label={`Feature ${feature}: the same four patch pixels multiply four learned coefficients. Sum all coordinate products, add bias ${bias}, and obtain ${output}.`}>
    {arrowId => <>
      <VisionFlowCells x={20} y={55} rows={[pixels]} cellWidth={68} label="Same supplied pixel vector" role="input" />
      <rect x={20 + selectedPixel * 68} y="55" width="68" height="34" fill="none" stroke="white" strokeWidth="3" />
      <VisionFlowCells x={20} y={148} rows={[weights]} cellWidth={68} label={`Learned W row ${feature}: four coefficients`} role="parameter" />
      <VisionFlowWire path="M292 72 H332 V213 H194" arrowId={arrowId} />
      <VisionFlowWire path="M156 182 H160 V196" arrowId={arrowId} />
      <rect x="126" y="196" width="68" height="34" rx="5" fill="none" stroke={visionFlowColors.operation} />
      <text x="160" y="219" textAnchor="middle">×</text>
      <VisionFlowWire path="M160 230 H316 V289 H292" arrowId={arrowId} />
      <VisionFlowCells x={20} y={272} rows={[products]} cellWidth={68} label="Four coordinate products" />
      <VisionFlowWire path="M156 306 H160 V338" arrowId={arrowId} />
      <rect x="126" y="338" width="68" height="34" rx="5" fill="none" stroke={visionFlowColors.operation} />
      <text x="160" y="361" textAnchor="middle">Σ + b</text>
      <VisionFlowCells x={248} y={338} rows={[[bias]]} label={`Bias ${feature}`} role="parameter" cellWidth={64} />
      <VisionFlowWire path="M248 355 H194" arrowId={arrowId} />
      <VisionFlowWire path="M160 372 V438" arrowId={arrowId} />
      <text x="25" y="461" fill={visionFlowColors.computed}>Feature {feature}</text>
      <rect x="117" y="438" width="86" height="40" fill="#0a0a0a" stroke={visionFlowColors.computed} />
      <text x="160" y="464" textAnchor="middle">{flowNumber(output, 4)}</text>
    </>}
  </VisionFlowDrawing>;
}

export function VisionPatchProjectionDrawing({ pixels, weights, biases, selectedPixel = 2 }) {
  return <div className="vision-flow-parallel">
    {weights.map((row, feature) => <VisionFeatureRoute key={feature} feature={feature}
      pixels={pixels} weights={row} bias={biases[feature]} selectedPixel={selectedPixel} />)}
  </div>;
}

export function VisionPatchCoordinateDrawing({ pixels, weights, biases, selectedPixel, selectedFeature }) {
  const products = weights.map(row => row.map((value, index) => value * pixels[index]));
  const output = products.map((row, feature) => row.reduce((total, value) => total + value, 0) + biases[feature]);
  return <VisionFlowDrawing width={340} height={448}
    label="The current selected coefficient, complete two-row parameter map and every coordinate product; both feature outputs remain visible.">
    {arrowId => <>
      <VisionFlowCells x={20} y={52} rows={weights} cellWidth={68} label="W: two features × four pixels" role="parameter" />
      <rect x={20 + selectedPixel * 68} y={52 + selectedFeature * 34} width="68" height="34"
        fill="none" stroke="white" strokeWidth="3" />
      <text x="20" y="144">White: selected coefficient</text>
      <VisionFlowCells x={20} y={202} rows={products} cellWidth={68} label="Each coefficient × its pixel" />
      <VisionFlowWire path="M156 270 H158 V306" arrowId={arrowId} />
      <rect x="100" y="306" width="116" height="40" rx="5" fill="none" stroke={visionFlowColors.operation} />
      <text x="158" y="332" textAnchor="middle">Σ row + b</text>
      <VisionFlowCells x={248} y={290} rows={biases.map(value => [value])} label="Biases b" role="parameter" cellWidth={64} />
      <VisionFlowWire path="M248 324 H216" arrowId={arrowId} />
      <VisionFlowWire path="M158 346 H184 V392" arrowId={arrowId} />
      <text x="20" y="414" fill={visionFlowColors.computed}>Results</text>
      <VisionFlowCells x={116} y={392} rows={[output]} cellWidth={68} label="" />
    </>}
  </VisionFlowDrawing>;
}
