import { useId, useLayoutEffect, useRef, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber } from "../LessonFlow.jsx";
import { gaussianDetails, normalInterval, gaussianUnitComparison } from "./gaussian-geometry-models.mjs";
import "./gaussian-runtime.css";

const INK = '#deded8', AMBER = '#e9b94c', REFERENCE = '#85858b';
const number = value => value !== 0 && Math.abs(value) < 1e-7
  ? value.toExponential(6).replace(/-/g, '−') : flowNumber(value, 9);
const densityPath = (mean, sd, scaleX, scaleY, lower = -6, upper = 6) =>
  Array.from({ length: 241 }, (_, index) => {
    const x = lower + (upper - lower) * index / 240;
    return `${index ? 'L' : 'M'}${scaleX(x)},${scaleY(gaussianDetails(x, mean, sd).density)}`;
  }).join(' ');

export function GaussianDrawing({ id, title, description, width = 700, height = 410, adaptive = false, children }) {
  const unique = useId();
  const region = useRef(null), fontProbe = useRef(null);
  const [available, setAvailable] = useState(width);
  useLayoutEffect(() => {
    if (!adaptive) return undefined;
    const measure = () => {
      const rem = fontProbe.current?.getBoundingClientRect().width || 16;
      const next = Math.max(300, Math.min(width, Math.floor(region.current.clientWidth * 16 / rem)));
      setAvailable(prior => prior === next ? prior : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(region.current); observer.observe(fontProbe.current);
    return () => observer.disconnect();
  }, [adaptive, width]);
  const extent = adaptive ? available : width;
  const drawingHeight = typeof height === 'function' ? height(extent) : height;
  return <div ref={region} className="gmm-drawing-region" role="region" tabIndex={0} aria-label={`${id}: ${title}; scroll horizontally when needed`}>
    {adaptive && <span ref={fontProbe} className="gmm-font-probe" aria-hidden="true" />}
    <svg className="gmm-drawing" data-drawing={id} viewBox={`0 0 ${extent} ${drawingHeight}`}
      style={{ width: `${extent / 16}rem`, height: `${drawingHeight / 16}rem` }} role="img" aria-labelledby={`${unique}-title ${unique}-description`}>
      <title id={`${unique}-title`}>{title}</title><desc id={`${unique}-description`}>{description}</desc>
      <g fontSize="16" fill={INK}>{typeof children === 'function' ? children(extent) : children}</g>
    </svg>
  </div>;
}

// One taught quantity has a range control and an immediately applied decimal
// entry. Invalid drafts retain the named last-valid model instead of coercing
// empty strings to zero. The parent's Reset key clears every draft and error.
export function GaussianQuantity({ name, value, onChange, min, max, step = 0.25, validate = () => null }) {
  const unique = useId();
  const [draft, setDraft] = useState(String(value));
  const parsed = draft.trim() === '' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(draft.trim()) ? NaN : Number(draft);
  const error = !Number.isFinite(parsed) || parsed < min || parsed > max
    ? `Enter a finite value from ${min} to ${max}; the picture keeps ${number(value)}.`
    : validate(parsed) || (parsed !== value ? `This draft has not been applied; the picture keeps ${number(value)}. Edit it to apply a valid value.` : null);
  const update = text => {
    setDraft(text);
    const validSyntax = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text.trim());
    const next = validSyntax ? Number(text) : NaN;
    if (Number.isFinite(next) && next >= min && next <= max && !validate(next)) onChange(next);
  };
  return <div className="gmm-quantity">
    <FlowSlider name={name} value={value} min={min} max={max} step={step}
      onChange={next => { setDraft(String(next)); if (!validate(next)) onChange(next); }} />
    <label htmlFor={`${unique}-decimal`}>Exact {name}
      <input id={`${unique}-decimal`} type="text" inputMode="decimal" value={draft}
        onChange={event => update(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${unique}-error` : undefined} />
    </label>
    {error && <p id={`${unique}-error`} className="gmm-input-error" role="status">{error}</p>}
  </div>;
}

function Ruler({ scaleX, y, lower = -6, upper = 6, unit = 'arbitrary coordinate units', step = 1 }) {
  return <g stroke={REFERENCE}>
    <line x1={scaleX(lower)} x2={scaleX(upper)} y1={y} y2={y} />
    {Array.from({ length: Math.floor((upper - lower) / step) + 1 }, (_, index) => lower + index * step).map(x =>
      <g key={x}><line x1={scaleX(x)} x2={scaleX(x)} y1={y} y2={y + 5} />
        <text x={scaleX(x)} y={y + 25} textAnchor="middle" stroke="none">{number(x)}</text></g>)}
    <text x={(scaleX(lower) + scaleX(upper)) / 2} y={y + 49} textAnchor="middle" stroke="none">{unit}</text>
  </g>;
}

export function GaussianCentreSpread() {
  const [state, setState] = useState({ mean: 0, sd: 1, query: 1 });
  const [reset, setReset] = useState(0);
  const details = gaussianDetails(state.query, state.mean, state.sd);
  const scaleY = density => 250 - density * 120;
  const update = key => value => setState(prior => ({ ...prior, [key]: value }));
  return <FlowLab id="gmm-d03" label="Move one Gaussian's mean, standard deviation and query">
    <GaussianDrawing id="D03" title="A centre, a spread and one query" height={480} adaptive
      description={`Constructed arbitrary units. Mean ${number(state.mean)}, standard deviation ${number(state.sd)}, query ${number(state.query)}. Displacement ${number(details.displacement)}, density ${number(details.density)}. Dashed reference has mean zero and standard deviation one. Only a finite part of both tails is drawn.`}>
      {width => {
        const scaleX = x => 55 + (x + 6) * (width - 85) / 12;
        const meanX = scaleX(state.mean), queryX = scaleX(state.query);
        const lowerX = scaleX(state.mean - state.sd), upperX = scaleX(state.mean + state.sd);
        const arrowLength = Math.min(10, Math.abs(queryX - meanX));
        return <>
      <text x="55" y="24">Density per unit</text>
      <text x="55" y="47" fill={REFERENCE}>Dashed: μ 0, SD 1</text>
      {[0, 0.5, 1, 1.5].map(value => <g key={value}><line x1="50" x2="55" y1={scaleY(value)} y2={scaleY(value)} stroke={REFERENCE} /><text x="43" y={scaleY(value) + 5} textAnchor="end">{number(value)}</text></g>)}
      <line x1="55" x2="55" y1="55" y2="250" stroke={REFERENCE} />
      <path d={densityPath(0, 1, scaleX, scaleY)} fill="none" stroke={REFERENCE} strokeDasharray="5 5" />
      <path d={densityPath(state.mean, state.sd, scaleX, scaleY)} fill="none" stroke={AMBER} strokeWidth="2" />
      <line x1={queryX} x2={queryX} y1={scaleY(details.density)} y2="250" stroke={INK} strokeDasharray="3 3" />
      <path d={`M${queryX},${scaleY(details.density) - 6} l6,6 l-6,6 l-6,-6 Z`} fill={INK} />
      <Ruler scaleX={scaleX} y={250} step={width < 500 ? 2 : 1} unit="constructed coordinate units" />
      <line x1={meanX} x2={meanX} y1="315" y2="338" stroke={AMBER} strokeWidth="2" />
      <text x={meanX} y="359" textAnchor="middle" fill={AMBER}>μ</text>
      <line x1={meanX} x2={queryX} y1="382" y2="382" stroke={INK} />
      {details.displacement !== 0 && <path d={`M${queryX - Math.sign(details.displacement) * arrowLength},377 L${queryX},382 L${queryX - Math.sign(details.displacement) * arrowLength},387`} fill="none" stroke={INK} />}
      <text x={queryX} y="409" textAnchor="middle">x</text>
      <path d={`M${lowerX},434 v10 H${upperX} v-10`} fill="none" stroke={AMBER} />
      <text x={lowerX} y="430" textAnchor="end" fill={AMBER}>μ − SD</text>
      <text x={upperX} y="471" textAnchor="start" fill={AMBER}>μ + SD</text>
        </>;
      }}
    </GaussianDrawing>
    <FlowControls key={reset}>
      <GaussianQuantity name="Mean μ" value={state.mean} onChange={update('mean')} min={-2} max={2} />
      <GaussianQuantity name="Standard deviation" value={state.sd} onChange={update('sd')} min={0.25} max={2} />
      <GaussianQuantity name="Query x" value={state.query} onChange={update('query')} min={-4} max={4} />
      <button type="button" onClick={() => { setState({ mean: 0, sd: 1, query: 1 }); setReset(prior => prior + 1); }}>Reset</button>
    </FlowControls>
    <FlowReadout>The query is <strong>{number(details.displacement)}</strong> coordinate units from the mean, or <strong>{number(details.standardized)}</strong> standard deviations. Its density is <strong>{number(details.density)}</strong> per unit; the variance is <strong>{number(details.variance)}</strong> square units. The displayed window truncates the tails.</FlowReadout>
  </FlowLab>;
}

export function GaussianDensityCircuit() {
  const stages = [
    { glyph: '−', label: 'subtract mean', calculate: x => x },
    { glyph: '²', label: 'square', calculate: x => x * x },
    { glyph: '÷', label: 'divide by variance', calculate: x => x * x },
    { glyph: '× −½', label: 'scale by −½', calculate: x => -0.5 * x * x },
    { glyph: 'exp', label: 'exponentiate', calculate: x => Math.exp(-0.5 * x * x) },
    { glyph: '×', label: 'multiply by c', calculate: x => gaussianDetails(x).density },
  ];
  const layout = width => ({
    stacked: width < 700,
    paths: [1, 2].map((query, index) => ({ query,
      x: width < 700 ? 140 : width / 4 + index * width / 2,
      firstOperationY: 245 + (width < 700 ? index * 620 : 0),
    })),
    height: width < 700 ? 1410 : 790,
  });
  const parameters = [
    { name: 'mean', x: 20, y: 32, operation: 0, label: 'Mean μ = 0' },
    { name: 'variance', x: 40, y: 69, operation: 2, label: 'Variance v = 1' },
    { name: 'normalizer', x: 60, y: 106, operation: 5, label: `c = ${number(gaussianDetails(0).density)} / unit` },
  ];
  return <GaussianDrawing id="D04" title="Compute two heights from the same Gaussian" width={880} height={width => layout(width).height} adaptive
    description="Mean zero and variance one enter both arithmetic rows. Query one gives residual one, square one, divided square one, exponent minus one half, exponential 0.60653066 and density 0.241970725. Query two gives square four, exponent minus two, exponential 0.135335283 and density 0.053990967. Both multiply by the same normalizer 0.398942280 per unit.">
    {width => {
      const geometry = layout(width);
      return <>
        {parameters.map(parameter => <g key={parameter.name} data-common-operand={parameter.name}>
          <text x="85" y={parameter.y - 8}>{parameter.label}</text>
          <circle cx={parameter.x} cy={parameter.y} r="3" fill={REFERENCE} />
          {geometry.paths.map((path, index) => {
            const trunk = geometry.stacked || index === 0 ? parameter.x : width / 2 + parameter.x;
            const destinationY = path.firstOperationY + parameter.operation * 90;
            return <g key={path.query}>
              <path d={`M${parameter.x},${parameter.y} H${trunk} V${destinationY} H${path.x - 24}`} fill="none" stroke={REFERENCE} strokeDasharray="3 4" />
              <circle cx={trunk} cy={destinationY} r="3" fill={REFERENCE} />
              <path data-operand-port={`${parameter.name}-${path.query}`} d={`M${path.x - 32},${destinationY - 5} L${path.x - 24},${destinationY} L${path.x - 32},${destinationY + 5}`} fill="none" stroke={REFERENCE} />
            </g>;
          })}
        </g>)}
        <text x="85" y="137">c = 1 / √(2πv)</text>
        {geometry.paths.map(path => <g key={path.query} data-query-path={path.query}>
          <text x={path.x} y={path.firstOperationY - 80} textAnchor="middle">Query</text>
          <circle cx={path.x} cy={path.firstOperationY - 55} r="4" fill={INK} />
          <text x={path.x + 30} y={path.firstOperationY - 49}>x = {path.query}</text>
          <path d={`M${path.x},${path.firstOperationY - 51} V${path.firstOperationY - 24} M${path.x - 5},${path.firstOperationY - 32} L${path.x},${path.firstOperationY - 24} L${path.x + 5},${path.firstOperationY - 32}`} fill="none" stroke={INK} />
          {stages.map((stage, index) => {
            const y = path.firstOperationY + index * 90;
            return <g key={stage.label} data-arithmetic-stage={index}>
              <text x={path.x + 32} y={y - 6}>{index === 2 ? 'divide by' : stage.label}</text>
              {index === 2 && <text x={path.x + 32} y={y + 18}>variance</text>}
              <circle cx={path.x} cy={y} r="24" fill="#070707" stroke={index === 5 ? AMBER : INK} />
              <text x={path.x} y={y + 5} textAnchor="middle">{stage.glyph}</text>
              <path d={`M${path.x},${y + 24} V${y + (index === 5 ? 48 : 66)}`} fill="none" stroke={INK} />
              {index < 5 && <path d={`M${path.x - 5},${y + 58} L${path.x},${y + 66} L${path.x + 5},${y + 58}`} fill="none" stroke={INK} />}
              <text data-computed-value={stage.calculate(path.query)} x={path.x + 30} y={y + 46} fill={index === 5 ? AMBER : INK}>{number(stage.calculate(path.query))}</text>
            </g>;
          })}
          <text x={path.x - 24} y={path.firstOperationY + 519} fill={AMBER}>Density / unit</text>
        </g>)}
      </>;
    }}
  </GaussianDrawing>;
}

export function GaussianIntervalArea() {
  const [bounds, setBounds] = useState([-1, 1]);
  const [reset, setReset] = useState(0);
  const [lower, upper] = bounds;
  const area = normalInterval(lower, upper);
  const update = index => value => {
    if ((index === 0 && value > upper) || (index === 1 && value < lower)) return;
    setBounds(prior => prior.map((entry, slot) => slot === index ? value : entry));
  };
  return <FlowLab id="gmm-d05" label="Distinguish density height from interval probability">
    <GaussianDrawing id="D05" title="Height is different from shaded area" width={700} height={835} adaptive
      description={`Standard normal interval [${number(lower)}, ${number(upper)}] has probability ${number(area)}. Density at zero is ${number(gaussianDetails(0).density)} per unit. Below, a narrow normal with standard deviation one quarter has peak ${number(gaussianDetails(0, 0, 0.25).density)} per unit and full real-line area one. Its solid curve and dashed standard-normal reference share the same [-4,4] coordinate ruler and density scale. Coincident endpoints have zero interval area.`}>
      {width => {
      const scaleX = x => 60 + (x + 4) * (width - 90) / 8;
      const scaleY = density => 245 - density * 400;
      const narrowY = density => 672 - density * 100;
      const areaCurve = densityPath(0, 1, scaleX, scaleY, lower, upper);
      return <>
      <text x="60" y="26">Standard normal · SD 1</text>
      <text x="60" y="52">Density per coordinate unit</text>
      <line x1="60" x2="60" y1="74" y2="245" stroke={REFERENCE} />
      {[0, 0.2, 0.4].map(value => <g key={value}>
        <line x1="55" x2="60" y1={scaleY(value)} y2={scaleY(value)} stroke={REFERENCE} />
        <text x="49" y={scaleY(value) + 5} textAnchor="end">{value}</text>
      </g>)}
      {lower !== upper && <path data-interval-area="true" d={`${areaCurve} L${scaleX(upper)},245 L${scaleX(lower)},245 Z`} fill={AMBER} fillOpacity="0.22" />}
      <path d={densityPath(0, 1, scaleX, scaleY, -4, 4)} fill="none" stroke={AMBER} strokeWidth="2" />
      {[lower, upper].map((x, index) => <line key={index} data-interval-endpoint={index ? 'upper' : 'lower'} x1={scaleX(x)} x2={scaleX(x)} y1={scaleY(gaussianDetails(x).density)} y2="245" stroke={INK} strokeDasharray={index ? '4 3' : undefined} />)}
      <line x1={scaleX(0)} x2={scaleX(0)} y1={scaleY(gaussianDetails(0).density)} y2="245" stroke={INK} />
      <Ruler scaleX={scaleX} y={245} lower={-4} upper={4} step={width < 500 ? 2 : 1} unit="constructed coordinate units" />
      <text x="20" y="325">Solid: lower; dashed: upper</text>
      <text x="20" y="354">Lower: {number(lower)}; upper: {number(upper)}</text>
      <text x="20" y="382">Height at 0: {number(gaussianDetails(0).density)}</text>
      <text x="20" y="410">Area: {number(area)} (no units)</text>
      <text x="60" y="468">Narrow normal · SD 0.25</text>
      <text x="60" y="494">Density per coordinate unit</text>
      <line x1="60" x2="60" y1="512" y2="672" stroke={REFERENCE} />
      {[0, 1, 1.6].map(value => <g key={value}>
        <line x1="55" x2="60" y1={narrowY(value)} y2={narrowY(value)} stroke={REFERENCE} />
        <text x="49" y={narrowY(value) + 5} textAnchor="end">{value}</text>
      </g>)}
      <path data-width-reference="true" d={densityPath(0, 1, scaleX, narrowY, -4, 4)} fill="none" stroke={REFERENCE} strokeDasharray="5 5" />
      <path data-narrow-density="true" d={densityPath(0, 0.25, scaleX, narrowY, -4, 4)} fill="none" stroke={INK} />
      <Ruler scaleX={scaleX} y={672} lower={-4} upper={4} step={width < 500 ? 2 : 1} unit="constructed coordinate units" />
      <text x="20" y="751">Solid: SD 0.25; dashed: SD 1</text>
      <text x="20" y="779">Peak: {number(gaussianDetails(0, 0, 0.25).density)}</text>
      <text x="20" y="807">Full real-line area = 1</text>
      </>;
      }}
    </GaussianDrawing>
    <FlowControls key={reset}>
      <GaussianQuantity name="Lower endpoint" value={lower} onChange={update(0)} min={-3} max={3}
        validate={value => value > upper ? `Lower must not exceed upper; picture keeps [${number(lower)}, ${number(upper)}].` : null} />
      <GaussianQuantity name="Upper endpoint" value={upper} onChange={update(1)} min={-3} max={3}
        validate={value => value < lower ? `Upper must not be below lower; picture keeps [${number(lower)}, ${number(upper)}].` : null} />
      <button type="button" onClick={() => { setBounds([-1, 1]); setReset(prior => prior + 1); }}>Reset</button>
    </FlowControls>
    <FlowReadout>The interval probability is <strong>{number(area)}</strong>. The density at zero stays <strong>{number(gaussianDetails(0).density)}</strong> per unit because moving interval boundaries does not change the Gaussian.</FlowReadout>
  </FlowLab>;
}

export function GaussianUnitRulers() {
  const [factor, setFactor] = useState(1);
  const comparison = gaussianUnitComparison(factor);
  const baseline = gaussianUnitComparison(1);
  return <FlowLab id="gmm-d06" label="Convert the same physical Gaussian from centimetres to millimetres">
    <GaussianDrawing id="D06" title="The same physical interval in two unit systems" width={700} height={675} adaptive
      description={`Reference centimetres and selected ${comparison.unit} share physical ticks. The same query is one centimetre or ${comparison.query} ${comparison.unit}. Standard deviation ${comparison.standardDeviation} ${comparison.unit}, density ${number(comparison.density)} per ${comparison.unit}, interval [${comparison.lower}, ${comparison.upper}], probability ${number(comparison.probability)} unchanged.`}>
      {width => {
      const scaleX = x => 55 + (x + 3) * (width - 85) / 6;
      return <>
      {[baseline, comparison].map((state, index) => <g key={index} data-unit-ruler={index ? 'selected' : 'reference'}>
        <text x="20" y={28 + index * 265}>{index ? 'Selected units' : 'Fixed reference'}: {state.unit}</text>
        <text x="20" y={53 + index * 265}>◇ query: {state.query} {state.unit}</text>
        <Ruler scaleX={value => scaleX(value / state.factor)} y={90 + index * 265} lower={-3 * state.factor} upper={3 * state.factor} step={state.factor * (width < 500 ? 1.5 : 1)} unit={state.unit} />
        <path data-unit-query={index ? 'selected' : 'reference'} d={`M${scaleX(1)},${78 + index * 265} l7,7 l-7,7 l-7,-7 Z`} fill={INK} />
        <path d={`M${scaleX(-1)},${151 + index * 265} v10 H${scaleX(1)} v-10`} fill="none" stroke={AMBER} />
        <text x="20" y={184 + index * 265}>Interval: [{state.lower}, {state.upper}] {state.unit}</text>
        <text x="20" y={210 + index * 265}>SD: {state.standardDeviation} {state.unit}</text>
        <text x="20" y={236 + index * 265}>Height: {number(state.density)} / {state.unit}</text>
      </g>)}
      <text x="20" y="559">Same area: {number(comparison.probability)}</text>
      <line data-unit-probability="true" x1="55" x2={55 + comparison.probability * (width - 85)} y1="588" y2="588" stroke={AMBER} strokeWidth="6" />
      <line x1="55" x2={width - 30} y1="600" y2="600" stroke={REFERENCE} />
      <text x="55" y="630">0</text><text x={width - 30} y="630" textAnchor="end">1</text>
      <text x="20" y="661">Probability (no units)</text>
      </>;
      }}
    </GaussianDrawing>
    <FlowControls>
      <label>Coordinate unit <select aria-label="Coordinate unit" value={factor} onChange={event => setFactor(Number(event.target.value))}><option value="1">Centimetres (cm)</option><option value="10">Millimetres (mm)</option></select></label>
      <button type="button" onClick={() => setFactor(1)}>Reset</button>
    </FlowControls>
    <FlowReadout>The coordinate scale multiplies by <strong>{factor}</strong>, variance by <strong>{factor * factor}</strong>, and density divides by <strong>{factor}</strong>. The same physical interval keeps probability <strong>{number(comparison.probability)}</strong>.</FlowReadout>
  </FlowLab>;
}
