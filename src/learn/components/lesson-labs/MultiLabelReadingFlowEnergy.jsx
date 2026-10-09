import { useState } from 'react';
import { energyObservations as saved } from '../../data/multilabel-reading-flow-energy-observations.js';
import { energyGroup, lockedEnergyRole } from '../../data/multilabel-reading-flow-energy-models.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelTable, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';
const colors = ['#f0b45b', '#75adff'];
const names = ['Heating', 'Cooling'];
const groupColors = {
  train: '#bba4d9',
  validation: '#f3adb9',
  test: '#c1d3d3'
};
const familyNames = {
  R: 'Independent Ridge',
  S: 'Shared forest',
  I: 'Separate forests',
  G: 'Grouped feature rows'
};
export function EnergyConfigurationFigure() {
  return <MultiLabelFigure
    job="D60"
    description="The simulation configuration has eight named metadata inputs and two numerical load targets; its envelope is schematic rather than a reconstruction"
  >
    <MultiLabelCanvas
      width={1072}
      height={703}
      title="UCI Energy metadata on a schematic envelope, orientation and glazing, with Heating and Cooling numerical output ports"
    >
      <text x={16} y={30}>Ecotect simulation configuration · schematic metadata, not reconstructed building geometry</text>
      <path
        d="M248,260 L495,185 L696,295 L449,374 Z M248,260 V472 L449,585 V374 M696,295 V508 L449,585"
        fill="#18161b"
        stroke="#d5c3df"
        strokeWidth={2}
      />
      <path
        d="M302,335 L368,372 V462 L302,425 Z M496,393 L620,354 V438 L496,478 Z"
        fill="#25364b"
        stroke="#75adff"
        strokeWidth={2}
      />
      <path d="M224,260 V472 M216,260 H232 M216,472 H232" fill="none" stroke="#d5c3df" />
      <text x={16} y={386}>X5 overall height</text>
      <text x={16} y={100}>X1 relative compactness</text>
      <path d="M274,107 H343 V175" fill="none" stroke="#d5c3df" />
      <text x={16} y={153}>X2 surface area</text>
      <path d="M208,160 H272 V238" fill="none" stroke="#d5c3df" />
      <text x={16} y={630}>X3 wall area</text>
      <path d="M175,625 H317 V503" fill="none" stroke="#d5c3df" />
      <text x={727} y={192}>X4 roof area</text>
      <path d="M716,197 H636 V263" fill="none" stroke="#d5c3df" />
      <text x={728} y={399}>X7 glazing area</text>
      <path d="M719,403 H624" fill="none" stroke="#75adff" />
      <text x={727} y={460}>X8 glazing distribution</text>
      <path d="M716,466 H657 V428" fill="none" stroke="#75adff" />
      <circle cx={782} cy={574} r={38} fill="none" stroke="#d5c3df" />
      <path d="M782,604 V545 L774,559 M782,545 L790,559" fill="none" stroke="#d5c3df" />
      <text x={838} y={580}>X6 orientation code</text>
      <path d="M696,312 H764 V277 H913 M764,312 V336 H913" fill="none" stroke="#d5c3df" />
      {names.map((name, j) => <g key={name}>
        <circle cx={928} cy={277 + j * 59} r={15} fill="#111114" stroke={colors[j]} />
        <text
          x={953}
          y={284 + j * 59}
          style={{
            fill: colors[j]
          }}
        >Y{j + 1}</text>
      </g>)}
      <text
        x={727}
        y={102}
        style={{
          fill: colors[0]
        }}
      >Y1 Heating · supplied load units</text>
      <text
        x={727}
        y={145}
        style={{
          fill: colors[1]
        }}
      >Y2 Cooling · supplied load units</text>
      <text x={16} y={685}>Tsanas &amp; Xifara (2012), UCI Energy Efficiency · 768 configurations · CC BY 4.0</text>
    </MultiLabelCanvas>
    <figcaption>The envelope locates the variable meanings. It supplies no invented area, weather or physical-unit conversion. Numeric X1–5/X7 and fixed category codes X6/X8 are the actual model inputs.</figcaption>
  </MultiLabelFigure>;
}
export function EnergyGeometrySplitFigure() {
  const [rank, setRank] = useState(10);
  const group = energyGroup(saved, rank);
  return <MultiLabelFigure
    job="D61"
    description="Each of twelve actual geometry groups carries all sixty-four row identities into one fixed partition; only training fits transforms"
  >
    <MultiLabelCanvas
      width={1072}
      height={816}
      title="Twelve indivisible sixty-four-row geometry groups inside their fixed training, validation and test partitions; training alone feeds transform fitting"
    >
      <text x={16} y={30}>One group = exact tuple (X1…X5). White outline selects G{String(rank).padStart(2, '0')}.</text>
      {['train', 'validation', 'test'].map((split, j) => {
        const x = [16, 614, 840][j],
          width = [576, 204, 216][j];
        return <g key={split}>
          <path d={`M${x},150 V540 H${x + width} V150`} stroke={groupColors[split]} fill="none" />
          <text
            x={x + 14}
            y={91}
            style={{
              fill: groupColors[split]
            }}
          >{split}: {saved.rowIds[split].length} rows</text>
          <text x={x + 14} y={132}>{saved.splitRanks[split].length} whole groups</text>
          {saved.splitRanks[split].map((g, i) => {
            const gx = x + (j === 0 ? 20 + i % 4 * 138 : 36),
              gy = 208 + (j === 0 ? Math.floor(i / 4) : i) * 170;
            return <g key={g}>
              <text
                x={gx}
                y={gy - 25}
                style={{
                  fill: groupColors[split]
                }}
              >G{String(g).padStart(2, '0')} · 64</text>
              {Array.from({
                length: 64
              }, (_, row) => <rect
                key={row}
                x={gx + row % 8 * 15}
                y={gy + Math.floor(row / 8) * 10}
                width={11}
                height={6}
                fill={groupColors[split]}
              />)}
              <path
                d={`M${gx - 5},${gy - 6} H${gx + 119} V${gy + 80} H${gx - 5} Z`}
                fill="none"
                stroke={g === rank ? '#fff' : groupColors[split]}
                strokeWidth={g === rank ? 3 : 1}
              />
            </g>;
          })}
        </g>;
      })}
      <path d="M304,540 V611 H348" fill="none" stroke={groupColors.train} />
      <circle cx={375} cy={611} r={27} fill="#111114" stroke={groupColors.train} />
      <text x={375} y={618} textAnchor="middle">fit</text>
      <path d="M402,611 H425" fill="none" stroke={groupColors.train} />
      <text x={442} y={618}>input scaler and target mean/scale: TRAIN only</text>
      <text x={16} y={717}>Held geometries test transfer within this simulation regime, not new climate or field meters.</text>
      <text x={16} y={786}>Every source row keeps its CSV ID and worksheet row. No random re-split occurs here.</text>
    </MultiLabelCanvas>
    <FlowControls>
      <label>Inspect recorded geometry <select
        aria-label="Inspect recorded geometry"
        value={rank}
        onChange={event => setRank(Number(event.target.value))}
      >
        {saved.geometryTuples.map((_, g) => <option value={g} key={g}>G{String(g).padStart(2, '0')}</option>)}
      </select></label>
      <button type="button" onClick={() => setRank(10)}>Reset geometry inspector</button>
    </FlowControls>
    <FlowReadout>G{String(rank).padStart(2, '0')} is {group.split}, with tuple [{group.tuple.join(', ')}] and {group.ids.length} indivisible rows. Training target means [{saved.targetMean.map(v => number(v)).join(', ')}] and scales [{saved.targetScale.map(v => number(v)).join(', ')}] are frozen. The source CSV SHA-256 is {saved.provenance['energy-efficiency.csv']}.</FlowReadout>
    <MultiLabelTable
      caption={`All actual G${String(rank).padStart(2, '0')} source identities, inputs and observed loads`}
    >
      <thead>
        <tr>
          <th>CSV row ID</th>
          <th>Worksheet row</th>
          {Array.from({
            length: 8
          }, (_, i) => <th key={i}>X{i + 1}</th>)}
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
        {group.ids.map(id => <tr key={id}>
          <th>
            {id}
          </th>
          <td>
            {saved.sourceWorksheetRows[id]}
          </td>
          {saved.rows[id].map((value, j) => <td
            key={j}
            style={j >= 8 ? {
              color: colors[j - 8]
            } : undefined}
          >
            {number(value)}
          </td>)}
        </tr>)}
      </tbody>
    </MultiLabelTable>
  </MultiLabelFigure>;
}
function ErrorBars({
  outcomes,
  split,
  metric,
  selected,
  normalized = false
}) {
  const maximum = normalized ? 1 : 12;
  const height = 169 + outcomes.length * 83;
  return <MultiLabelCanvas
    width={1084}
    height={height}
    title={`${split} ${metric} per output on a shared ${normalized ? 'training-standard-deviation-normalized' : 'raw supplied-unit'} axis; locked role labels differ from selected inspection`}
  >
    <text x={16} y={30}>
      {normalized ? 'RMSE / own output training σ · common dimensionless scale' : `${metric.toUpperCase()} · supplied load units · common scale`}
    </text>
    {[0, .25, .5, .75, 1].map(fraction => <g key={fraction}>
      <path d={`M${202 + fraction * 580},65 V${height - 72}`} fill="none" stroke="#443e4b" />
      <text x={202 + fraction * 580} y={60} textAnchor="middle">
        {number(fraction * maximum)}
      </text>
    </g>)}
    {outcomes.map((row, i) => {
      const y = 98 + i * 83,
        report = row[split];
      return <g key={row.id}>
        <text x={16} y={y + 16}>
          {row.id}
          {row.id === selected ? ' ◀' : ''}
        </text>
        {!report ? <text x={203} y={y + 16}>Unavailable · {row.status}</text> : [0, 1].map(j => {
          const value = report[metric][j] / (normalized ? saved.targetScale[j] : 1);
          return <g key={j}>
            <rect
              x={202}
              y={y - 2 + j * 28}
              width={value / maximum * 580}
              height={15}
              fill={row.id === 'dummy' ? '#bab3c2' : colors[j]}
            />
            <text
              x={803}
              y={y + 11 + j * 28}
              style={{
                fill: row.id === 'dummy' ? '#bab3c2' : colors[j]
              }}
            >{names[j]} {number(value)}</text>
          </g>;
        })}
        <text x={202} y={y + 66}>
          {lockedEnergyRole(saved, row.id)}
        </text>
      </g>;
    })}
    <text x={16} y={height - 23}>◀ = current inspector only; overall G3 and strongest independent I2 stay locked by validation.</text>
  </MultiLabelCanvas>;
}
function OutcomesTable({
  split
}) {
  return <MultiLabelTable caption={`Complete recorded ${split} outcomes, failures and warnings remain listed`}>
    <thead>
      <tr>
        <th>ID / family</th>
        <th>Status / warnings</th>
        <th>Heating RMSE</th>
        <th>Cooling RMSE</th>
        <th>Heating MAE</th>
        <th>Cooling MAE</th>
        <th>Combined RMSE/σ</th>
        <th>Locked role</th>
        <th>Parameters</th>
      </tr>
    </thead>
    <tbody>
      {saved.outcomes.map(row => <tr key={row.id}>
        <th>{row.id} / {familyNames[row.family] || 'mean baseline'}</th>
        <td>{row.status}; {row.warnings?.length ? row.warnings.join('; ') : 'no warnings'}{row.failure ? '; ' + JSON.stringify(row.failure) : ''}</td>
        {['rmse', 'mae'].flatMap(metric => [0, 1].map(j => <td
          key={metric + j}
          style={{
            color: colors[j]
          }}
        >
          {number(row[split]?.[metric]?.[j])}
        </td>))}
        <td>
          {number(row[split]?.mean_training_std_normalized_rmse)}
        </td>
        <td>
          {lockedEnergyRole(saved, row.id)}
        </td>
        <td>
          {row.parameters ? JSON.stringify(row.parameters) : 'raw training target means'}
        </td>
      </tr>)}
    </tbody>
  </MultiLabelTable>;
}
export function EnergyValidationLockFigure() {
  const [family, setFamily] = useState('all'),
    [selected, setSelected] = useState('G3');
  const outcomes = saved.outcomes.filter(row => row.id === 'dummy' || family === 'all' || row.family === family);
  const row = saved.outcomes.find(item => item.id === selected);
  return <MultiLabelFigure
    job="D62"
    description="The twelve actual candidates and separate training mean baseline compare only validation output errors; original role lock remains fixed"
  >
    <ErrorBars outcomes={outcomes} split="validation" metric="rmse" selected={selected} normalized />
    <FlowControls>
      <label>Inspect validation family <select
        aria-label="Inspect validation family"
        value={family}
        onChange={event => setFamily(event.target.value)}
      >
        <option value="all">All four families</option>
        {Object.entries(familyNames).map(([key, name]) => <option key={key} value={key}>
          {name}
        </option>)}
      </select></label>
      <label>Inspect recorded validation candidate <select
        aria-label="Inspect recorded validation candidate"
        value={selected}
        onChange={event => setSelected(event.target.value)}
      >
        {saved.outcomes.map(row => <option key={row.id}>
          {row.id}
        </option>)}
      </select></label>
      <button
        type="button"
        onClick={() => {
          setFamily('all');
          setSelected('G3');
        }}
      >Reset validation inspector</button>
    </FlowControls>
    <FlowReadout>{selected} has validation combined RMSE/σ {number(row.validation?.mean_training_std_normalized_rmse)}; role: {lockedEnergyRole(saved, selected)}. Frozen overall G3; family R3/S2/I2/G3; strongest independent I2. Global minimum first, then earliest declared row within 10⁻¹². Training 512 rows/8 groups; validation 128 rows/2 groups. No test target enters this selection object, and no refit occurs.</FlowReadout>
    <OutcomesTable split="validation" />
  </MultiLabelFigure>;
}
export function EnergyFrozenTestFigure() {
  const [metric, setMetric] = useState('rmse'),
    [selected, setSelected] = useState('G3');
  const row = saved.outcomes.find(item => item.id === selected);
  return <MultiLabelFigure
    job="D63"
    description="All twelve descriptive test rows plus baseline retain their validation-selected role labels; metric/inspection changes never reselect a model"
  >
    <ErrorBars outcomes={saved.outcomes} split="test" metric={metric} selected={selected} />
    <FlowControls>
      <label>Recorded test metric <select
        aria-label="Recorded test metric"
        value={metric}
        onChange={event => setMetric(event.target.value)}
      >
        <option value="rmse">RMSE</option>
        <option value="mae">MAE</option>
      </select></label>
      <label>Inspect descriptive test candidate <select
        aria-label="Inspect descriptive test candidate"
        value={selected}
        onChange={event => setSelected(event.target.value)}
      >
        {saved.outcomes.map(row => <option key={row.id}>
          {row.id}
        </option>)}
      </select></label>
      <button
        type="button"
        onClick={() => {
          setMetric('rmse');
          setSelected('G3');
        }}
      >Reset frozen test inspector</button>
    </FlowControls>
    <FlowReadout>{selected} test {metric.toUpperCase()} is [{row.test[metric].map(v => number(v)).join(', ')}] in supplied load units; combined RMSE/σ is {number(row.test.mean_training_std_normalized_rmse)}. These are descriptive outcomes after the validation lock: overall G3, independent I2. Unselected G2/R1 have much smaller test errors, which cannot replace the locked choice. Test contains 128 rows from only G05/G10; this is held-geometry simulation transfer, not a broad coupling guarantee.</FlowReadout>
    <OutcomesTable split="test" />
    <MultiLabelTable
      caption={`${selected}: both actual test geometry residual summaries, prediction minus truth`}
    >
      <thead>
        <tr>
          <th>Group</th>
          <th>Rows</th>
          <th>Heating mean residual</th>
          <th>Cooling mean residual</th>
          <th>Heating RMSE</th>
          <th>Cooling RMSE</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(row.test.geometry_errors).map(([name, group]) => <tr key={name}>
          <th>
            {name}
          </th>
          <td>
            {group.rows}
          </td>
          {[...group.mean_residual, ...group.rmse].map((value, j) => <td
            key={j}
            style={{
              color: colors[j % 2]
            }}
          >
            {number(value)}
          </td>)}
        </tr>)}
      </tbody>
    </MultiLabelTable>
  </MultiLabelFigure>;
}
