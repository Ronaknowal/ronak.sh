import { useState } from 'react';
import { textObservations as saved } from '../../data/multilabel-reading-flow-text-observations.js';
import { recordedTextCounts } from '../../data/multilabel-reading-flow-energy-models.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelTable, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';
const names = ['Code', 'Hardware', 'Energy'],
  colors = ['#f0b45b', '#75adff', '#bc9aff'];
const splitColors = {
  train: '#bba4d9',
  validation: '#f3adb9',
  test: '#c1d3d3'
};

// Root-effective D65 inventory and separately constructed training terms.
// Only the one retained original selected cell supplies a measured score.
export function RecordedTextInventoryFigure() {
  const [family, setFamily] = useState('chain 012'),
    [threshold, setThreshold] = useState(.6);
  const isRecorded = family === saved.selectedOriginal.family && threshold === saved.selectedOriginal.threshold;
  const test = saved.groups.filter(group => group.split === 'test').flatMap(group => [group.truth, group.truth]);
  const counts = recordedTextCounts(test, saved.selectedOriginal.predictions);
  return <MultiLabelFigure
    job="D65"
    description="Declared fifteen-choice inventory distinguishes one selected recorded result from unrecorded per-choice scores; deterministic training terms are a separate construction"
  >
    <MultiLabelCanvas
      width={1146}
      height={1130}
      title="Sixteen two-message groups with fixed 16/8/8 row membership and a three-family by five-threshold recipe inventory, one recorded selected validation outcome"
    >
      <text x={16} y={30}>32 constructed messages · 16 cases, 2 paraphrases each · fixed train 16 / validation 8 / test 8</text>
      {saved.groups.map((group, i) => {
        const x = 16 + i % 8 * 140,
          y = 105 + Math.floor(i / 8) * 155;
        return <g key={group.id}>
          <text
            x={x}
            y={y - 18}
            style={{
              fill: splitColors[group.split]
            }}
          >group {group.id}</text>
          <path
            d={`M${x - 3},${y - 4} V${y + 83} H${x + 16}`}
            stroke={splitColors[group.split]}
            fill="none"
          />
          {group.rowIds.map((id, j) => <g key={id}>
            <rect
              x={x + 21}
              y={y + j * 45}
              width={80}
              height={33}
              fill="#111114"
              stroke={splitColors[group.split]}
            />
            <text x={x + 61} y={y + j * 45 + 23} textAnchor="middle">row {id}</text>
          </g>)}
          <text x={x} y={y + 113}>
            {group.split}
          </text>
        </g>;
      })}
      <text x={16} y={448}>Declared choices: complete recipe inventory, not a recovered score table</text>
      {saved.thresholds.map((cutoff, j) => <text key={cutoff} x={416 + j * 146} y={513} textAnchor="middle">cutoff {cutoff}</text>)}
      {saved.families.map((candidate, i) => <g key={candidate}>
        <text x={16} y={580 + i * 146}>
          {candidate}
        </text>
        {saved.thresholds.map((cutoff, j) => {
          const recorded = candidate === saved.selectedOriginal.family && cutoff === saved.selectedOriginal.threshold;
          const selected = candidate === family && cutoff === threshold;
          return <g key={cutoff}>
            <rect
              x={347 + j * 146}
              y={535 + i * 146}
              width={138}
              height={104}
              fill="#111114"
              stroke={selected ? '#fff' : recorded ? '#f0b45b' : '#655f6c'}
              strokeWidth={selected ? 3 : 1}
            />
            {recorded ? <>
              <text x={416 + j * 146} y={568 + i * 146} textAnchor="middle">selected</text>
              <text x={416 + j * 146} y={600 + i * 146} textAnchor="middle">10/11</text>
            </> : <>
              <text x={416 + j * 146} y={572 + i * 146} textAnchor="middle">score not</text>
              <text x={416 + j * 146} y={604 + i * 146} textAnchor="middle">recorded</text>
            </>}
          </g>;
        })}
      </g>)}
      <text x={16} y={1017}>White outline inspects a declared recipe. Only chain012/.6 has the original recorded selection score.</text>
      <text x={16} y={1064}>No other fitted predictions, IDF values, coefficients or validation ranking are supplied.</text>
      <text x={16} y={1112}>The independent/.5 cost-selected report is a different objective, taught in the next drawing.</text>
    </MultiLabelCanvas>
    <FlowControls>
      <label>Inspect declared text candidate <select
        aria-label="Inspect declared text candidate"
        value={family}
        onChange={event => setFamily(event.target.value)}
      >
        {saved.families.map(name => <option key={name}>
          {name}
        </option>)}
      </select></label>
      <label>Inspect declared text cutoff <select
        aria-label="Inspect declared text cutoff"
        value={threshold}
        onChange={event => setThreshold(Number(event.target.value))}
      >
        {saved.thresholds.map(value => <option key={value}>
          {value}
        </option>)}
      </select></label>
      <button
        type="button"
        onClick={() => {
          setFamily('chain 012');
          setThreshold(.6);
        }}
      >Reset recorded text inventory</button>
    </FlowControls>
    <FlowReadout>Inspecting {family}/{threshold}: {isRecorded ? 'the recorded original selection has validation micro F1 10/11' : 'this declared recipe has no per-choice score retained'}. The recorded original selected test remains chain012/.6: TP {counts.tp}, FP {counts.fp}, FN {counts.fn}, micro F1 {number(counts.micro)}, exact {counts.exact}/8 and Hamming {counts.fp + counts.fn}/24. Inspecting another inventory cell does not generate a fitted outcome.</FlowReadout>
    <MultiLabelCanvas
      width={1060}
      height={610}
      title="A literal training message creates lowercase words; four separate two-input joins form only adjacent bigrams, then words and pairs enter the training-only term set"
    >
      <text x={16} y={30}>Separate deterministic training-term construction · not recovered fitted TF–IDF numerical state</text>
      <text x={16} y={92}>Training row 0: “Python loop raises an exception”</text>
      <path d="M309,110 V150" fill="none" stroke="#bba4d9" />
      {['python', 'loop', 'raises', 'an', 'exception'].map((term, i) => <g key={term}>
        <rect x={16 + i * 205} y={159} width={189} height={42} fill="#111114" stroke="#bba4d9" />
        <text x={111 + i * 205} y={187} textAnchor="middle">
          {term}
        </text>
      </g>)}
      {['python loop', 'loop raises', 'raises an', 'an exception'].map((term, i) => {
        const x = 213.5 + i * 205;
        return <g key={term}>
          <path
            d={`M${111 + i * 205},201 V226 H${x - 15} V254 M${316 + i * 205},201 V240 H${x + 15} V254 M${x},292 V322`}
            fill="none"
            stroke="#bba4d9"
          />
          <circle cx={x} cy={270} r={22} fill="#111114" stroke="#bba4d9" />
          <text x={x} y={276} textAnchor="middle" className="mlf-small-text">join</text>
          <rect x={x - 94.5} y={322} width={189} height={42} fill="#111114" stroke="#bba4d9" />
          <text x={x} y={350} textAnchor="middle">
            {term}
          </text>
          <path d={`M${x},364 V404 H531`} fill="none" stroke="#bba4d9" />
        </g>;
      })}
      <path d="M8,151 H1043 V209 H8 Z M8,180 V462 H504 M531,404 V435" fill="none" stroke="#bba4d9" />
      <text x={16} y={435}>Keep the five words too</text>
      <circle cx={531} cy={462} r={27} fill="#111114" stroke="#bba4d9" />
      <text x={531} y={469} textAnchor="middle">∪</text>
      <path d="M558,462 H727" fill="none" stroke="#bba4d9" />
      <text x={745} y={469}>this sentence: 5 words + 4 pairs</text>
      <text x={16} y={549}>Merge all 16 literal training messages → sorted {saved.constructedTrainingTerms.length} word/bigram terms.</text>
      <text x={16} y={591}>Validation/test queries may use this constructed set; they contribute no terms to its construction.</text>
    </MultiLabelCanvas>
    <MultiLabelTable
      caption="Complete deterministic training-term construction; no fitted IDF or coefficient values are asserted"
    >
      <thead>
        <tr>
          <th>Constructed index</th>
          <th>Word / adjacent bigram</th>
        </tr>
      </thead>
      <tbody>
        {saved.constructedTrainingTerms.map((term, i) => <tr key={term}>
          <th>
            {i}
          </th>
          <td>
            {term}
          </td>
        </tr>)}
      </tbody>
    </MultiLabelTable>
    <MultiLabelTable caption="All 32 literal source messages and their case membership">
      <thead>
        <tr>
          <th>Row / case</th>
          <th>Split</th>
          <th>Literal message</th>
          {names.map((name, j) => <th
            key={name}
            style={{
              color: colors[j]
            }}
          >
            {name}
          </th>)}
        </tr>
      </thead>
      <tbody>
        {saved.groups.flatMap(group => group.messages.map((text, i) => <tr key={group.rowIds[i]}>
          <th>{group.rowIds[i]} / {group.id}</th>
          <td>
            {group.split}
          </td>
          <td>
            {text}
          </td>
          {group.truth.map((value, j) => <td
            key={j}
            style={{
              color: colors[j]
            }}
          >
            {value}
          </td>)}
        </tr>))}
      </tbody>
    </MultiLabelTable>
  </MultiLabelFigure>;
}
