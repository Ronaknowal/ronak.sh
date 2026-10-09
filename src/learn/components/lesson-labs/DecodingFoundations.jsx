import React, { useState } from 'react';
import {
  base,
  peaked,
  flat,
  tied,
  tokens,
  temperature,
  entropyDerivative,
  categorical,
  sum,
} from '../../data/decoding-strategies-models.js';
import {
  Figure,
  Controls,
  Select,
  Slider,
  Local,
  Bars,
  Strip,
  Readout,
  AxisPlot,
  Table,
  colours,
  fmt,
  vector,
} from './DecodingElements.jsx';
const presets = [
  ['base', 'Recurring row'],
  ['peaked', 'Peaked'],
  ['flat', 'Flat'],
  ['empty', 'All masked'],
];
export function OutputFeedback() {
  const [choice, setChoice] = useState('door');
  return (
    <Figure id="D01" label="Output head and prefix feedback">
      <Local label="Model output is selected and fed back">
        <svg
          viewBox="0 0 720 340"
          role="img"
          aria-label="Prefix to model to hidden vector to vocabulary projection, then a selected token returns to the prefix"
        >
          <text x="20" y="30" fontSize="17">
            prefix IDs: Alice | reached | the
          </text>
          <path
            d="M130 45V95H235M288 120H340M435 120H510"
            stroke="#aaa"
            fill="none"
            strokeWidth="2"
          />
          <rect x="55" y="95" width="150" height="60" fill="#222" stroke="#aaa" />
          <text x="130" y="130" textAnchor="middle" fontSize="18">
            model
          </text>
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x="240"
              y={83 + i * 20}
              width="42"
              height="16"
              fill={colours[i]}
              fillOpacity=".5"
              stroke={colours[i]}
            />
          ))}
          <text x="260" y="192" textAnchor="middle" fontSize="14">
            last hidden vector
          </text>
          <text x="260" y="213" textAnchor="middle" fontSize="14">
            schematic
          </text>
          {Array.from({ length: 4 }, (_, r) =>
            Array.from({ length: 5 }, (_, c) => (
              <rect
                key={`${r}-${c}`}
                x={348 + c * 15}
                y={83 + r * 20}
                width="11"
                height="16"
                fill={colours[c]}
                fillOpacity=".4"
              />
            )),
          )}
          <text x="385" y="192" textAnchor="middle" fontSize="14">
            projection W
          </text>
          {tokens.map((name, i) => (
            <g key={name}>
              <path d={`M435 120L520 ${40 + i * 43}`} stroke={colours[i]} fill="none" />
              <rect
                x="520"
                y={24 + i * 43}
                width="180"
                height="32"
                fill="#191919"
                stroke={choice === name ? 'white' : colours[i]}
                strokeWidth={choice === name ? 3 : 1}
              />
              <text x="530" y={46 + i * 43} fontSize="17" style={{ fill: colours[i] }}>
                {name} · ID {i}
              </text>
            </g>
          ))}
          <path
            d={`M700 ${40 + tokens.indexOf(choice) * 43}H713V278H130V160`}
            stroke={colours[tokens.indexOf(choice)]}
            strokeWidth="2"
            fill="none"
          />
          <text x="355" y="307" textAnchor="middle" fontSize="17">
            append {choice} → next call: Alice reached the {choice}
          </text>
        </svg>
      </Local>
      <Controls reset={() => setChoice('door')}>
        <Select
          label="Selected output"
          value={choice}
          onChange={setChoice}
          options={['door', 'window'].map((x) => [x, x])}
        />
      </Controls>
      <Readout>
        Old prefix: “Alice reached the”. New prefix: “Alice reached the {choice}”. Its new scores
        are computed on the next call.
      </Readout>
    </Figure>
  );
}
export function ProbabilityStrip({ p, u = null }) {
  let offset = 0;
  const crowded = Math.min(...p) < 0.05;
  return (
    <Local label="Unit probability interval, left-inclusive boundaries">
      <svg viewBox="0 0 660 155" role="img" aria-label="Probability intervals between zero and one">
        {p.map((value, i) => {
          const start = offset;
          offset += value;
          return (
            <g key={i}>
              <rect
                x={30 + 600 * start}
                y="35"
                width={600 * value}
                height="45"
                fill={colours[i]}
                fillOpacity=".38"
                stroke={colours[i]}
              />
              <text x={30 + 600 * (start + value / 2)} y="63" textAnchor="middle" fontSize="14">
                {value >= 0.05 ? i : ''}
              </text>
              <text x={30 + 600 * start} y={i % 2 ? 119 : 99} textAnchor="middle" fontSize="13">
                {!crowded || i === 0 ? fmt(start, 4) : ''}
              </text>
            </g>
          );
        })}
        <text x="630" y="99" textAnchor="middle" fontSize="13">
          1
        </text>
        {u !== null && (
          <>
            <path d={`M${30 + 600 * u} 5V83`} stroke="white" strokeWidth="3" />
            <text
              x={Math.min(570, Math.max(80, 30 + 600 * u))}
              y="146"
              textAnchor="middle"
              fontSize="16"
            >
              u={fmt(u)} → {tokens[categorical(p, u)]}
            </text>
          </>
        )}
      </svg>
      {crowded && (
        <div className="decoding-token-row" aria-label="Exact probability intervals">
          {p.map((value, i) => {
            const start = sum(p.slice(0, i));
            return (
              <span key={i} style={{ color: colours[i] }}>
                {tokens[i]}: [{fmt(start)}, {fmt(start + value)})
              </span>
            );
          })}
        </div>
      )}
    </Local>
  );
}
export function ProbabilityMass() {
  const [preset, setPreset] = useState('base'),
    [selected, setSelected] = useState(0);
  const p = { base, peaked, flat, empty: null }[preset];
  return (
    <Figure id="D02" label="Probability mass and intervals">
      <Bars p={p} selected={selected} />
      {p && <ProbabilityStrip p={p} />}
      <Controls
        reset={() => {
          setPreset('base');
          setSelected(0);
        }}
      >
        <Select label="Distribution" value={preset} onChange={setPreset} options={presets} />
        <Select
          label="Inspect candidate"
          value={selected}
          onChange={(x) => setSelected(Number(x))}
          options={tokens.map((x, i) => [i, `${i}: ${x}`])}
          disabled={!p}
        />
      </Controls>
      <Readout>
        {p
          ? `ID ${selected}: ${tokens[selected]}, p=${fmt(p[selected])}, log p=${fmt(Math.log(p[selected]))}; total mass ${fmt(sum(p))}.`
          : 'Every score is excluded. There is no valid next-token distribution or selected token.'}
      </Readout>
    </Figure>
  );
}
export function CategoricalDraw() {
  const [u, setU] = useState(0.72),
    [seed, setSeed] = useState(17),
    [draws, setDraws] = useState([]);
  const selected = categorical(base, u);
  function advance() {
    const next = (1664525 * seed + 1013904223) >>> 0;
    const draw = next / 4294967296;
    setSeed(next);
    setU(draw);
    setDraws([...draws, draw]);
  }
  return (
    <Figure id="D03" label="Categorical draw">
      <ProbabilityStrip p={base} u={u} />
      <Bars p={base} selected={selected} />
      <Controls
        reset={() => {
          setU(0.72);
          setSeed(17);
          setDraws([]);
        }}
      >
        <Slider label="Uniform draw" value={u} onChange={setU} max={0.999} step={0.001} />
        <button onClick={advance}>Advance seeded draw</button>
        <button onClick={() => setU(0.5)}>Boundary 0.5</button>
        <button onClick={() => setU(0.999)}>EOS interval</button>
      </Controls>
      <Readout>
        Current draw chooses ID {selected}, {tokens[selected]}. {draws.length} generated draws have
        counts {vector(base.map((_, i) => draws.filter((d) => categorical(base, d) === i).length))};
        finite frequencies need not equal the exact proportions. This browser uses an explicit
        32-bit LCG stream.
      </Readout>
    </Figure>
  );
}
export function PrefixBranch() {
  const [first, setFirst] = useState('door'),
    [step, setStep] = useState(1),
    [second, setSecond] = useState(0);
  const p = first === 'door' ? [0.2, 0.5, 0.2, 0.05, 0.05] : [0.1, 0.2, 0.5, 0.1, 0.1];
  return (
    <Figure id="D04" label="Conditional prefix branch">
      <Local label="Selected first token changes the second row">
        <svg viewBox="0 0 680 270" role="img" aria-label="A branching prefix tree">
          <text x="15" y="130" fontSize="18">
            prompt
          </text>
          {['door', 'window', 'EOS'].map((name, i) => (
            <g key={name}>
              <path
                d={`M95 125L240 ${40 + i * 87}`}
                stroke={colours[i === 2 ? 4 : i]}
                strokeWidth={first === name ? 3 : 1}
                fill="none"
              />
              <text
                x="248"
                y={45 + i * 87}
                fontSize="17"
                style={{ fill: colours[i === 2 ? 4 : i] }}
              >
                {name} · {fmt(base[tokens.indexOf(name)])}
              </text>
              {first === name &&
                name !== 'EOS' &&
                tokens.map((next, j) => (
                  <g key={next}>
                    <path
                      d={`M380 ${40 + i * 87}L510 ${25 + j * 48}`}
                      stroke={colours[j]}
                      strokeWidth={step === 2 && second === j ? 3 : 1}
                      fill="none"
                    />
                    <text x="518" y={30 + j * 48} fontSize="16" style={{ fill: colours[j] }}>
                      {next} · {fmt(p[j])}
                    </text>
                  </g>
                ))}
            </g>
          ))}
        </svg>
      </Local>
      <Controls
        reset={() => {
          setFirst('door');
          setStep(1);
          setSecond(0);
        }}
      >
        <Select
          label="First token"
          value={first}
          onChange={setFirst}
          options={['door', 'window', 'EOS'].map((x) => [x, x])}
        />
        <Select
          label="Second token"
          value={second}
          onChange={(x) => setSecond(Number(x))}
          options={tokens.map((x, i) => [i, x])}
          disabled={first === 'EOS'}
        />
        <Slider
          label="Emitted steps"
          min={1}
          max={2}
          step={1}
          value={step}
          onChange={setStep}
          disabled={first === 'EOS'}
        />
      </Controls>
      <Readout>
        {first === 'EOS'
          ? 'Terminated after EOS: empty printed continuation; path probability 0.0625.'
          : step === 1
            ? `Active prefix: Alice reached the ${first}. Next call uses this branch's row.`
            : `Prefix: Alice reached the ${first}${second === 4 ? '' : ` ${tokens[second]}`}. Path probability ${fmt(base[tokens.indexOf(first)])} × ${fmt(p[second])} = ${fmt(base[tokens.indexOf(first)] * p[second])}. ${second === 4 ? 'EOS terminated.' : 'Active; no EOS yet.'}`}
      </Readout>
    </Figure>
  );
}
export function GreedyTree() {
  const [mode, setMode] = useState('greedy'),
    [step, setStep] = useState(3);
  const leaves = [
    ['A X EOS', 0.6, 0.45, 0.27],
    ['A Y EOS', 0.6, 0.4, 0.24],
    ['A EOS', 0.6, 0.15, 0.09],
    ['B X EOS', 0.35, 0.9, 0.315],
    ['B EOS', 0.35, 0.1, 0.035],
    ['EOS', 0.05, 1, 0.05],
  ];
  return (
    <Figure id="D05" label="Greedy and globally best paths">
      <Local label="All six completed paths with genuine shared ancestors">
        <svg viewBox="0 0 760 370" role="img" aria-label="Complete probability tree">
          <text x="12" y="185" fontSize="17">
            root
          </text>
          {[
            ['A', 0.6, 100],
            ['B', 0.35, 265],
            ['EOS', 0.05, 345],
          ].map(([name, p, y], i) => (
            <g key={name}>
              <path
                d={`M60 180L230 ${y}`}
                stroke={colours[i]}
                fill="none"
                strokeWidth={(mode === 'greedy' && i === 0) || (mode === 'best' && i === 1) ? 3 : 1}
              />
              <text x="235" y={y + 5} fontSize="17" style={{ fill: colours[i] }}>
                {name} {p}
              </text>
            </g>
          ))}
          {leaves.map((r, i) => {
            const y = 30 + i * 60;
            const parentY = i < 3 ? 100 : i < 5 ? 265 : 345;
            const active = mode === 'greedy' ? i === 0 : i === 3;
            return (
              <g key={r[0]}>
                {i < 5 && (
                  <path
                    d={`M305 ${parentY}L470 ${y}`}
                    fill="none"
                    stroke={colours[i % 5]}
                    strokeWidth={active && step >= 2 ? 3 : 1}
                  />
                )}
                <text x="475" y={y + 5} fontSize="17" style={{ fill: colours[i % 5] }}>
                  {r[0]} · {fmt(r[3])}
                </text>
                {active && step === 3 && (
                  <rect
                    x="465"
                    y={y - 19}
                    width="270"
                    height="33"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  />
                )}
                <text x="350" y={(parentY + y) / 2 - 12} fontSize="13">
                  {i < 5 ? fmt(r[2]) : ''}
                </text>
              </g>
            );
          })}
        </svg>
      </Local>
      <Controls
        reset={() => {
          setMode('greedy');
          setStep(3);
        }}
      >
        <Select
          label="Highlighted route"
          value={mode}
          onChange={setMode}
          options={[
            ['greedy', 'Local greedy'],
            ['best', 'Best completed path'],
          ]}
        />
        <Slider label="Trace depth" min={1} max={3} step={1} value={step} onChange={setStep} />
      </Controls>
      <Readout>
        Greedy A→X→EOS: 0.6 × 0.45 = 0.27. Best B→X→EOS: 0.35 × 0.9 = 0.315. All six terminal masses
        sum to 1; the tree is a constructed exact oracle.
      </Readout>
    </Figure>
  );
}
export function TemperatureColumns() {
  const [t, setT] = useState(1),
    [preset, setPreset] = useState('base'),
    [mode, setMode] = useState('sample');
  const p = preset === 'base' ? base : tied;
  return (
    <Figure id="D06" label="Temperature and fixed candidate identities">
      <div className="decoding-columns">
        {[0.5, 1, 2].map((temp) => (
          <Bars key={temp} p={temperature(p, temp)} label={`T=${temp}`} />
        ))}
      </div>
      <Bars
        p={mode === 'sample' ? temperature(p, t) : p.map((_, i) => (i === 0 ? 1 : 0))}
        label={mode === 'sample' ? `Current T=${t}` : 'Greedy decision q'}
      />
      <Controls
        reset={() => {
          setT(1);
          setPreset('base');
          setMode('sample');
        }}
      >
        <Slider
          label="Temperature"
          min={0.1}
          max={3}
          step={0.1}
          value={t}
          onChange={setT}
          disabled={mode === 'greedy'}
        />
        <Select
          label="Maximum"
          value={preset}
          onChange={setPreset}
          options={[
            ['base', 'Unique'],
            ['tied', 'Two tied maxima'],
          ]}
        />
        <Select
          label="Decision"
          value={mode}
          onChange={setMode}
          options={[
            ['sample', 'Sample'],
            ['greedy', 'Greedy'],
          ]}
        />
      </Controls>
      <Readout>
        {mode === 'greedy'
          ? 'Positive rescaling cannot change the argmax; temperature is inactive. Smallest-ID tie rule chooses door.'
          : `Door/window odds = ${fmt(temperature(p, t)[0] / temperature(p, t)[1])}. Candidate ranking remains unchanged.`}
      </Readout>
    </Figure>
  );
}
export function EntropyCurve() {
  const [t, setT] = useState(1),
    [preset, setPreset] = useState('base');
  const p = preset === 'base' ? base : tied;
  const result = entropyDerivative(p, t);
  const points = Array.from({ length: 100 }, (_, i) => {
    const temp = 0.03 + i * 0.03;
    return [temp, entropyDerivative(p, temp).entropy];
  });
  return (
    <Figure id="D07" label="Entropy versus positive temperature">
      <AxisPlot
        points={points}
        xmax={3}
        ymax={Math.log(5)}
        xlabel="temperature T"
        ylabel="entropy H, nats"
        marker={[t, result.entropy]}
      />
      <Bars p={temperature(p, t)} label="Current q" />
      <Controls
        reset={() => {
          setT(1);
          setPreset('base');
        }}
      >
        <Slider label="Temperature" min={0.1} max={3} step={0.1} value={t} onChange={setT} />
        <Select
          label="Maximum"
          value={preset}
          onChange={setPreset}
          options={[
            ['base', 'Unique'],
            ['tied', 'Two tied maxima'],
          ]}
        />
      </Controls>
      <Readout>
        Variance of logits: {fmt(result.variance)}; dH/dT = {fmt(result.derivative)} ≥ 0. As T→0, H→
        {preset === 'base' ? '0' : 'log 2 ≈ 0.693147'} nats. These logits remain fixed across the
        curve.
      </Readout>
    </Figure>
  );
}
