import { useId, useState } from 'react';
import {
  angleDirection, centered, diagonal, dot, formatNumber, leadingDirection,
  originalRows, paddedExtent, perpendicular, projection, queryProjection,
  recordColors, recordNames, thinSvdFixture
} from "../../data/pca-geometry.js";
import {
  Arrow, Controls, Drawing, Figure, Matrix, NumberField, Pair, Point,
  Records, useNumericDrafts
} from './PcaReadingFlowPrimitives.jsx';

const displayPair = values => `(${values.map(value => formatNumber(value)).join(', ')})`;

export function CoordinatePlane({ rows, mean, direction, feet, centeredView = false,
  extent, title = 'Record coordinates', query = false, rulerLabel = 'Unit ruler',
  showGuides = false, showDisplacements = false, spreadLabels = false,
  rowLabels = recordNames, labelOffsets, cornerLabels = false, referenceCaption = false }) {
  const clipId = useId().replaceAll(':', '');
  const domains = extent ?? (centeredView ? [[-4, 4], [-4, 4]] : [[-1, 7], [-2, 6]]);
  const left = 45;
  const top = 42;
  const size = 245;
  const x = value => left + (value - domains[0][0]) / (domains[0][1] - domains[0][0]) * size;
  const y = value => top + size - (value - domains[1][0]) / (domains[1][1] - domains[1][0]) * size;
  const origin = mean ?? [0, 0];
  const coincident = rows.length > 1 && rows.every(row => row.every((value, column) => value === rows[0][column]));
  const half = Math.max(domains[0][1] - domains[0][0], domains[1][1] - domains[1][0]) * 0.48;
  const lineEndpoints = direction?.map(value => value * half);
  return <Drawing width={340} height={referenceCaption ? 388 : 355} title={title}
    description="Equal measurement scales. Labelled record identities follow each point; dashed segments run to the perpendicular feet.">
    <rect x={left} y={top} width={size} height={size} fill="none" stroke="#555" />
    <defs><clipPath id={clipId}>
      <rect x={left} y={top} width={size} height={size} />
    </clipPath></defs>
    {Array.from({ length: 5 }, (_, tick) => {
      const vx = domains[0][0] + tick * (domains[0][1] - domains[0][0]) / 4;
      const vy = domains[1][0] + tick * (domains[1][1] - domains[1][0]) / 4;
      return <g key={tick}>
        <line x1={x(vx)} y1={top} x2={x(vx)} y2={top + size} stroke="#333" />
        <line x1={left} y1={y(vy)} x2={left + size} y2={y(vy)} stroke="#333" />
        <text x={x(vx)} y={top + size + 23} textAnchor="middle">{formatNumber(vx, 4)}</text>
        <text x={left - 9} y={y(vy) + 4} textAnchor="end">{formatNumber(vy, 4)}</text>
      </g>;
    })}
    <text x={left + size / 2} y={348} textAnchor="middle" fill="#4EA3D8">
      {centeredView ? 'Centered x measurement' : 'First measurement x'}
    </text>
    <text x={left} y={22} fill="#AB83D8">
      {centeredView ? 'Centered y measurement' : 'Second measurement y'}
    </text>
    {direction && <g clipPath={`url(#${clipId})`}>
      <line x1={x(origin[0] - lineEndpoints[0])} y1={y(origin[1] - lineEndpoints[1])}
        x2={x(origin[0] + lineEndpoints[0])} y2={y(origin[1] + lineEndpoints[1])}
        stroke="#efbd6d" strokeWidth={2} />
      <Arrow x1={x(origin[0])} y1={y(origin[1])}
        x2={x(origin[0] + direction[0])} y2={y(origin[1] + direction[1])}
        color="#efbd6d" />
    </g>}
    {direction && <text x={left + size - 8} y={36} textAnchor="end" fill="#efbd6d">{rulerLabel}</text>}
    {mean && <Point x={x(mean[0])} y={y(mean[1])} label={referenceCaption ? '' : 'Reference'}
      color="#e0e0e0" hollow dx={8} dy={21} />}
    {mean && referenceCaption && <text x={left} y={379}>Hollow circle = reference {displayPair(mean)}</text>}
    {rows.map((row, index) => {
      if (coincident && index > 0) return null;
      const dx = labelOffsets?.[index]?.[0] ?? (cornerLabels ?
        left + (index < 2 ? 25 : size - 25) - x(row[0]) :
        spreadLabels ? index < 2 ? -31 : 25 : index % 2 ? -18 : 9);
      const dy = labelOffsets?.[index]?.[1] ?? (cornerLabels ?
        top + (index % 2 ? 35 : size - 35) - y(row[1]) :
        spreadLabels ? index % 2 ? -32 : 38 : index % 2 ? 17 : -10);
      return <g key={index}>
      {showGuides && index === 0 && <path
        d={`M${x(row[0])},${top + size} V${y(row[1])} H${left}`}
        stroke={recordColors[0]} fill="none" strokeDasharray="3 3" />}
      {showDisplacements && <Arrow x1={x(mean[0])} y1={y(mean[1])}
        x2={x(row[0])} y2={y(row[1])} color={recordColors[index]} />}
      {feet && <>
        <line x1={x(row[0])} y1={y(row[1])} x2={x(feet[index][0])}
          y2={y(feet[index][1])} stroke={recordColors[index % 4]}
          strokeDasharray="4 3" />
        <Point x={x(feet[index][0])} y={y(feet[index][1])} label=""
          shape={index % 4} color={recordColors[index % 4]} hollow />
      </>}
      {(spreadLabels || labelOffsets || cornerLabels) && <line x1={x(row[0])} y1={y(row[1])}
        x2={x(row[0]) + dx}
        y2={y(row[1]) + dy - 8}
        stroke={recordColors[index % 4]} strokeDasharray="2 3" />}
      <Point x={x(row[0])} y={y(row[1])} label={coincident ? '' : query ? 'Query' : rowLabels[index]}
        shape={index % 4} color={recordColors[index % 4]}
        dx={dx} dy={dy} />
      {coincident && <text x={x(row[0]) - 32} y={y(row[1]) - 20}>
        {rows.map((_, identity) => <tspan key={identity} fill={recordColors[identity]}>{identity ? '/' : ''}{rowLabels[identity]}</tspan>)}
        <tspan fill="#ddd"> coincident</tspan>
      </text>}
    </g>;
    })}
  </Drawing>;
}

function RecordTable({ values = originalRows, caption = 'Four paired instrument records' }) {
  return <Matrix values={values} label={caption} rowLabels={recordNames}
    columnLabels={['x measurement', 'y measurement']} />;
}

export function InstrumentRecords() {
  return <Figure job="D01" title="Four records become a four-by-two measurement table"
    description="Each labelled instrument has two distinct measurement rails. A's first value connects to row A, column x."
    caption="The record letter and hue stay attached to both measurements. The selected correspondence is A → row A, x → first column. n = 4 observations; d = 2 features.">
    <Drawing width={540} height={430} title="Paired instrument readings and matching table cells"
      description="Four instrument outlines, each with an x dial and a y dial; solid blue x and dashed violet y rails retain feature identity.">
      <text x={20} y={22}>Instrument records</text>
      <text x={324} y={22}>Record</text>
      <text x={411} y={22} fill="#4EA3D8">x</text>
      <text x={473} y={22} fill="#AB83D8">y</text>
      {originalRows.map((row, index) => <g key={index} transform={`translate(20,${38 + index * 88})`}>
        <rect width={192} height={76} rx={5} fill="none" stroke={recordColors[index]} strokeWidth={2} />
        <text x={12} y={42} fill={recordColors[index]}>{recordNames[index]}</text>
        {row.map((value, column) => <g key={column} transform={`translate(42,${24 + column * 32})`}>
          <line x1={0} x2={80} y1={0} y2={0} stroke={column ? '#AB83D8' : '#4EA3D8'}
            strokeDasharray={column ? '5 3' : undefined} strokeWidth={2} />
          {[0, 1, 2, 3, 4, 5].map(tick => <line key={tick} x1={tick * 16} x2={tick * 16} y1={-5} y2={5} stroke="#999" />)}
          <circle cx={value * 16} cy={0} r={5} fill={recordColors[index]} />
          <text x={94} y={5}>{column ? 'y' : 'x'} = {value}</text>
        </g>)}
        <text x={304} y={43} fill={recordColors[index]}>{recordNames[index]}</text>
        {row.map((value, column) => <g key={column}>
          <rect x={363 + column * 62} y={15} width={57} height={44} fill="none"
            stroke={index === 0 && column === 0 ? '#efbd6d' : recordColors[index]}
            strokeWidth={index === 0 && column === 0 ? 3 : 1} />
          <text x={392 + column * 62} y={44} textAnchor="middle">{value}</text>
        </g>)}
      </g>)}
      <path d="M78,62 V119 H350 V75" stroke="#4EA3D8" fill="none" strokeWidth={1.7} />
      <Arrow x1={350} y1={75} x2={381} y2={75} color="#4EA3D8" />
      <text x={220} y={106} fill="#4EA3D8">A's x = 1</text>
      <text x={323} y={409}>n = 4 rows; d = 2 columns</text>
    </Drawing>
    <RecordTable />
  </Figure>;
}

export function RowsToScatter() {
  return <Figure job="D02" title="Every table row locates one point"
    description="A maps to horizontal tick 1 and vertical tick 1; the other points keep their paired measurements."
    caption="Constructed records on equal measurement scales. A = (1, 1), B = (2, 0), C = (4, 4), D = (5, 3).">
    <div className="pca-comparison"><RecordTable /><CoordinatePlane rows={originalRows} showGuides /></div>
  </Figure>;
}

export function StoragePreview() {
  return <Figure job="D03" title="Four reading slots need one shared ruler and reference"
    description="The slots are unfilled. An illustrative ruler and approximate recovered scatter preview the storage problem without calculated coefficients."
    caption="Storage preview: four unfilled record readings, plus a shared direction and reference. The approximate locations are illustrative; calculations begin next.">
    <RecordTable caption="Original measurements: four records, two measurements each" />
    <Drawing width={540} height={305} title="One stored reading per record"
      description="Record-labelled empty slots feed a physical ruler through a reference mark. Two original points can share an approximate location.">
      {recordNames.map((name, index) => <g key={name}>
        <text x={20} y={42 + index * 55} fill={recordColors[index]}>{name}</text>
        <rect x={48} y={22 + index * 55} width={75} height={29}
          stroke={recordColors[index]} fill="none" />
        <text x={85} y={43 + index * 55} textAnchor="middle">unfilled</text>
        <Arrow x1={130} y1={36 + index * 55} x2={220} y2={125} color={recordColors[index]} />
      </g>)}
      <line x1={220} y1={216} x2={440} y2={55} stroke="#efbd6d" strokeWidth={4} />
      {Array.from({ length: 9 }, (_, i) => <line key={i}
        x1={230 + 24 * i} y1={204 - 17.5 * i}
        x2={238 + 24 * i} y2={214 - 17.5 * i} stroke="#efbd6d" />)}
      <circle cx={330} cy={135} r={6} fill="none" stroke="#eee" strokeWidth={2} />
      <text x={340} y={156}>Shared reference</text>
      <text x={258} y={35}>Shared direction</text>
      <Point x={244} y={171} label="A original" color={recordColors[0]} dx={-64} dy={-14} />
      <Point x={260} y={187} label="A/B approximate" color={recordColors[0]} hollow dx={12} dy={18} />
      <line x1={247} y1={174} x2={257} y2={184} stroke={recordColors[0]} strokeDasharray="3 3" />
      <Point x={405} y={80} label="C/D" color={recordColors[2]} hollow dx={9} dy={20} />
      <text x={220} y={267}>Illustrative recovered locations</text>
      <text x={20} y={293}>Shared direction and reference will be calculated next</text>
    </Drawing>
  </Figure>;
}

export function CenteringAnatomy() {
  const state = centered(originalRows);
  return <Figure job="D04" title="The shared reference is the mean"
    description="Coordinate averages feed one shared subtraction for each record. The reference sits at (3,2)."
    caption="Mean = ((1 + 2 + 4 + 5)/4, (1 + 0 + 4 + 3)/4) = (3, 2). Subtract this same reference from every record.">
    <div className="pca-comparison">
      <CoordinatePlane rows={originalRows} mean={state.mean} showDisplacements />
      <CoordinatePlane rows={state.rows} mean={[0, 0]} centeredView title="Centered displacements" />
    </div>
    <RecordTable values={state.rows} caption="Centered table: original − (3, 2)" />
  </Figure>;
}

function ScoreCircuit({ products, score, displacement, direction = diagonal, title }) {
  return <Drawing width={550} height={225} title={title}
    description="Each centered measurement multiplies the corresponding unit-direction coefficient, then the two products enter an adder yielding one scalar.">
    {[0, 1].map(column => <g key={column}>
      <text x={15} y={46 + column * 80}>{column ? 'y displacement' : 'x displacement'}</text>
      <text x={15} y={69 + column * 80}>{formatNumber(displacement[column])}</text>
      <Arrow x1={125} y1={60 + column * 80} x2={180} y2={60 + column * 80} />
      <circle cx={205} cy={60 + column * 80} r={20} fill="none" stroke="#ddd" />
      <text x={205} y={65 + column * 80} textAnchor="middle">×</text>
      <text x={182} y={26 + column * 80}>{formatNumber(direction[column])}</text>
      <Arrow x1={228} y1={60 + column * 80} x2={302} y2={60 + column * 80} />
      <text x={244} y={48 + column * 80}>{formatNumber(products[column])}</text>
      <Arrow x1={306} y1={60 + column * 80} x2={358} y2={100} />
    </g>)}
    <circle cx={382} cy={100} r={22} fill="none" stroke="#ddd" />
    <text x={382} y={105} textAnchor="middle">+</text>
    <Arrow x1={408} y1={100} x2={470} y2={100} />
    <text x={439} y={75}>Scalar score</text>
    <text x={439} y={129}>{formatNumber(score)}</text>
    <text x={15} y={202}>Two coordinate products → one signed ruler reading</text>
  </Drawing>;
}

export function FirstScore() {
  const query = queryProjection([1, 1]);
  return <Figure job="D05" title="A's two products make one signed reading"
    description="The scalar negative score is separated from its two-coordinate perpendicular foot."
    caption="A: (−2)/√2 + (−1)/√2 = −3/√2. The signed scalar reading is −2.1213203; the centered foot has two coordinates (−1.5, −1.5).">
    <ScoreCircuit {...query} title="A's dot product" />
    <Drawing width={370} height={100} title="One signed scalar score"
      description="A tick at negative three over root two is on a separate one-dimensional reading axis; it is not the two-coordinate foot.">
      <line x1={30} y1={38} x2={340} y2={38} stroke="#efbd6d" />
      {[-4, -2, 0, 2, 4].map(value => <g key={value}>
        <line x1={185 + value * 38.75} y1={33} x2={185 + value * 38.75} y2={43} stroke="#ccc" />
        <text x={185 + value * 38.75} y={68} textAnchor="middle">{value}</text>
      </g>)}
      <circle cx={185 + query.score * 38.75} cy={38} r={5} fill={recordColors[0]} />
      <text x={72} y={19} fill={recordColors[0]}>A: −3/√2</text>
      <text x={185} y={95} textAnchor="middle">Signed scalar ruler reading</text>
    </Drawing>
    <CoordinatePlane rows={[query.displacement]} mean={[0, 0]} direction={diagonal}
      feet={[query.foot]} centeredView title="A's negative scalar reading and foot" />
  </Figure>;
}

export function FirstDecode() {
  const state = projection(originalRows, diagonal);
  return <Figure job="D06" title="Reading times direction, then restore the reference"
    description="The decoder multiplies A's scalar into two direction entries, adds the two mean entries, and exposes the perpendicular residual."
    caption="A: (−3/√2)(1/√2, 1/√2) + (3, 2) = (1.5, .5). Residual (−.5, .5) has dot product 0 with the ruler. A and B share a reading; C and D share another.">
    <Drawing width={550} height={150} title="Scalar-to-vector decoder"
      description="One score branches into two coefficient multiplications; each product adds a mean coordinate.">
      <text x={15} y={75}>−3/√2</text>
      {[0, 1].map(column => <g key={column}>
        <Arrow x1={85} y1={72} x2={160} y2={42 + column * 65} />
        <text x={166} y={46 + column * 65}>× 1/√2 = −1.5</text>
        <Arrow x1={288} y1={42 + column * 65} x2={340} y2={42 + column * 65} />
        <text x={346} y={46 + column * 65}>+ {column ? 2 : 3} = {column ? '.5' : '1.5'}</text>
      </g>)}
    </Drawing>
    <CoordinatePlane rows={originalRows} mean={state.mean} direction={diagonal}
      feet={state.records.map(record => record.decoded)} title="Decoded feet and retained record identities" />
    <Records records={state.records} caption="All four filled reading slots and decoded rows"
      columns={[
        { label: 'Scalar reading', read: record => formatNumber(record.scores[0]) },
        { label: 'Decoded point', read: record => displayPair(record.decoded) },
        { label: 'Residual', read: record => displayPair(record.residual) }
      ]} />
  </Figure>;
}

export function RulerRotation() {
  const input = useNumericDrafts([45], [[0, 180]]);
  const state = projection(originalRows, angleDirection(input.values[0]));
  return <Figure job="D07" title="Rotate a fixed ruler"
    description="Only the angle changes. All four rows and the shared mean stay fixed; each foot and reading follows the same current ruler."
    caption={`Fixed centered total 20 = retained ${formatNumber(state.retained)} + lost ${formatNumber(state.loss)}. Dashed segments are perpendicular residuals.`}>
    <CoordinatePlane rows={originalRows} mean={state.mean} direction={state.direction}
      feet={state.records.map(record => record.decoded)} title="Fixed records, current ruler and feet" />
    <Controls onReset={input.reset}>
      <NumberField state={input} index={0} label="Ruler angle in degrees" min={0} max={180} />
    </Controls>
    <Records records={state.records} caption="Current signed readings and squared losses"
      columns={[
        { label: 'Reading', read: record => formatNumber(record.scores[0]) },
        { label: 'Foot', read: record => displayPair(record.decoded) },
        { label: 'Residual²', read: record => formatNumber(record.loss) }
      ]} />
  </Figure>;
}

export function RecordEditing() {
  const [rows, setRows] = useState(originalRows.map(row => [...row]));
  const [selected, setSelected] = useState(0);
  const input = useNumericDrafts(originalRows[0], [[-10, 10], [-10, 10]], (column, value) => {
    setRows(previous => previous.map((row, index) => index === selected ?
      row.map((oldValue, i) => i === column ? value : oldValue) : row));
  });
  const fit = leadingDirection(rows);
  const state = fit.direction ? projection(rows, fit.direction) : null;
  const mean = centered(rows).mean;
  const extent = paddedExtent([...originalRows, ...rows, mean,
    ...(state ? state.records.map(record => record.decoded) : [])]);

  function reset() {
    setRows(originalRows.map(row => [...row]));
    setSelected(0);
    input.restore(originalRows[0]);
  }

  function select(value) {
    setSelected(value);
    input.restore(rows[value]);
  }

  return <Figure job="D08" title="Change one record, then recalculate this miniature fit"
    description="The original and edited clouds share the same current equal-axis extent. Record selection changes the editing address, without relabelling any row."
    caption={`Constructed four-record fit only. Mean ${displayPair(mean)}; ${fit.status}. ${state ? `Retained fraction ${formatNumber(state.retained / state.total)}.` : fit.total === 0 ? 'Variance fraction undefined: total spread is zero. No ruler is drawn.' : 'No preferred leading ruler is drawn for the tie.'}`}>
    <div className="pca-comparison">
      <CoordinatePlane rows={originalRows} mean={[3, 2]} direction={diagonal}
        extent={extent} title="Original four-record baseline" />
      <CoordinatePlane rows={rows} mean={mean} direction={fit.direction}
        feet={state?.records.map(record => record.decoded)} extent={extent}
        title="Current edited records and recalculated ruler" />
    </div>
    <Controls onReset={reset}>
      <label className="pca-number-field">Record to edit
        <select aria-label="Record to edit" value={selected} onChange={event => select(Number(event.target.value))}>
          {recordNames.map((name, index) => <option key={name} value={index}>{name}</option>)}
        </select>
      </label>
      <NumberField state={input} index={0} label={`Record ${recordNames[selected]} x measurement`} min={-10} max={10} />
      <NumberField state={input} index={1} label={`Record ${recordNames[selected]} y measurement`} min={-10} max={10} />
    </Controls>
    <RecordTable values={rows} caption="Current measurements; identities preserved" />
  </Figure>;
}

export function RetainedCoordinates() {
  const input = useNumericDrafts([1], [[0, 2, true]]);
  const k = input.values[0];
  const state = projection(originalRows, diagonal, k);
  return <Figure job="D09" title="Keep zero, one or two orthogonal readings"
    description="Both coordinate tracks remain visible. The decoder omits only the crossed-out tracks, rather than hiding their numerical values."
    caption={`k = ${k}: retained ${formatNumber(state.retained)}, lost ${formatNumber(state.loss)}. With no readings, every decoded record returns to the mean.`}>
    <Drawing width={550} height={295} title="Kept and dropped decoder tracks"
      description="All first and second scores are shown in their record hues. A diagonal strike marks an omitted decoder track without crossing its numeric readouts.">
      {[0, 1].map(component => <g key={component}>
        <text x={15} y={29 + component * 125}>{component ? 'Second perpendicular reading' : 'First diagonal reading'}</text>
        <line x1={80} x2={470} y1={60 + component * 125} y2={60 + component * 125}
          stroke={component ? '#AB83D8' : '#efbd6d'} strokeDasharray={component ? '6 4' : undefined} />
        {state.records.map((record, index) => <g key={record.id}>
          <text x={90 + index * 105} y={91 + component * 125} fill={recordColors[index]}>
            {record.id}: {formatNumber(record.scores[component], 5)}
          </text>
          <circle cx={275 + record.scores[component] * 58} cy={60 + component * 125}
            r={5} fill={recordColors[index]} />
        </g>)}
        {k <= component && <>
          <line x1={35} y1={45 + component * 125} x2={510} y2={75 + component * 125} stroke="#bcbcbc" strokeWidth={2} />
          <text x={15} y={115 + component * 125}>Dropped from the decoder; readings remain visible</text>
        </>}
      </g>)}
      <text x={15} y={280}>Multiply each kept reading by its direction, add, then restore (3, 2)</text>
    </Drawing>
    <Controls onReset={input.reset}>
      <NumberField state={input} index={0} label="Number of retained coordinates k" min={0} max={2} step={1} />
    </Controls>
    <Records records={state.records} caption="Decoded points under the current kept count"
      columns={[
        { label: 'First reading', read: record => formatNumber(record.scores[0]) },
        { label: 'Second reading', read: record => formatNumber(record.scores[1]) },
        { label: 'Decoded', read: record => displayPair(record.decoded) },
        { label: 'Residual²', read: record => formatNumber(record.loss) }
      ]} />
  </Figure>;
}

export function EnergySquares() {
  return <Figure job="D10" title="Perpendicular lengths make additive square areas"
    description="A's triangle has hypotenuse from the origin to (−2,−1), retained leg to (−1.5,−1.5) and residual leg. The three area squares use the same length-to-pixel scale."
    caption="A: total square area 5 = retained area 4.5 + residual area .5. Side lengths are √5, √4.5 and √.5. All four records: 20 = 18 + 2.">
    <Drawing width={320} height={610} title="A's right triangle and squared lengths"
      description="Triangle legs meet at the perpendicular foot. Three separate squares use side length 54 times the square root of their labelled area.">
      <path d="M170,50 L89,131 L62,104 Z" fill="none" stroke="#ddd" strokeWidth={2} />
      <path d="M95,125 L89,119 L83,125" fill="none" stroke="#ddd" />
      <text x={165} y={35}>Origin</text>
      <text x={43} y={97} fill={recordColors[0]}>A</text>
      <text x={72} y={160}>Foot</text>
      {[5, 4.5, 0.5].map((area, index) => {
        const side = 54 * Math.sqrt(area);
        const tops = [190, 350, 510];
        return <g key={area}>
          <rect x={30} y={tops[index]} width={side} height={side}
            fill={index === 0 ? '#333' : index === 1 ? '#ab83d833' : '#dd8c7833'}
            stroke={index === 1 ? '#AB83D8' : index === 2 ? '#DD8C78' : '#ddd'} />
          <text x={172} y={tops[index] + 24}>{['Total', 'Retained', 'Residual'][index]}</text>
          <text x={172} y={tops[index] + 48}>Area {area}</text>
          <text x={172} y={tops[index] + 72}>Side √{area}</text>
        </g>;
      })}
      <text x={20} y={603}>Every square: 1 unit = 54 pixels</text>
    </Drawing>
  </Figure>;
}

export function DenominatorAnatomy() {
  return <Figure job="D11" title="Keep the numerator and denominator visible"
    description="Retained and lost energies flow to explicit divide operations for sample variance, population variance and reconstruction averages."
    caption="Sample score variances: 18/3 = 6 and 2/3. Population variances: 18/4 = 4.5 and 2/4 = .5. SSE 2 → per row .5 → per entry .25. Energy fraction 18/20 = .9.">
    <Drawing width={550} height={300} title="Named denominators"
      description="Separate rails show energy to score variance and loss to per-record or per-entry squared error.">
      {[
        ['First score energy 18', '÷ 3 (n − 1)', 'Sample variance 6'],
        ['First score energy 18', '÷ 4 (n)', 'Population variance 4.5'],
        ['Residual SSE 2', '÷ 4 (n)', 'Per-record distance² .5'],
        ['Residual SSE 2', '÷ 8 (n × d)', 'Per-entry MSE .25'],
        ['Retained energy 18', '÷ total 20', 'Fraction .9']
      ].map((row, index) => <g key={row[2]}>
        <text x={10} y={30 + index * 54}>{row[0]}</text>
        <Arrow x1={159} y1={26 + index * 54} x2={195} y2={26 + index * 54} />
        <text x={200} y={30 + index * 54}>{row[1]}</text>
        <Arrow x1={348} y1={26 + index * 54} x2={375} y2={26 + index * 54} />
        <text x={380} y={30 + index * 54}>{row[2]}</text>
      </g>)}
    </Drawing>
  </Figure>;
}

export function CovarianceProducts() {
  const rows = centered(originalRows).rows;
  return <Figure job="D12" title="Matching record products build feature covariance"
    description="Each record contributes its own x-times-y product; the four values add before dividing by n minus one."
    caption="Off-diagonal: (−2)(−1) + (−1)(−2) + (1)(2) + (2)(1) = 8; divide by 3. Each diagonal square sum is 10. The resulting relation has feature rows and columns, not record rows.">
    <Drawing width={550} height={235} title="Same-record product lanes"
      description="Four independently coloured record lanes feed the shared cross-product sum.">
      {rows.map((row, index) => <g key={index}>
        <text x={15} y={35 + index * 45} fill={recordColors[index]}>
          {recordNames[index]}: {row[0]} × {row[1]} = {row[0] * row[1]}
        </text>
        <Arrow x1={180} y1={30 + index * 45} x2={280} y2={105} color={recordColors[index]} />
      </g>)}
      <circle cx={303} cy={105} r={20} fill="none" stroke="#ddd" />
      <text x={303} y={110} textAnchor="middle">+</text>
      <Arrow x1={329} y1={105} x2={370} y2={105} />
      <text x={380} y={100}>8 ÷ 3</text>
      <text x={380} y={124}>Feature covariance</text>
      <text x={15} y={221}>All products match x and y from the same record.</text>
    </Drawing>
    <Matrix values={[[10 / 3, 8 / 3], [8 / 3, 10 / 3]]}
      label="Feature covariance C; sample denominator 3"
      rowLabels={['x feature', 'y feature']} columnLabels={['x feature', 'y feature']} />
  </Figure>;
}

export function CovarianceAction() {
  return <Figure job="D13" title="Covariance preserves the diagonal direction"
    description="Each covariance row multiplies the two direction coefficients; the outputs are six times those same coefficients. Ellipse radii are square roots of variances."
    caption="C v₁ = (6/√2, 6/√2) = 6 v₁. Following with v₁'s dot product gives 6. A horizontal direction gives 10/3. Ellipse radii use √6 and √(2/3), rather than 6 and 2/3.">
    <Drawing width={550} height={220} title="Covariance row products and preserved direction"
      description="Two coordinate sums preserve direction. The covariance ellipse has correctly squared-unit to length conversion.">
      {[0, 1].map(column => <g key={column}>
        <text x={15} y={40 + column * 70}>
          ({column ? 8 : 10}/3)(1/√2) + ({column ? 10 : 8}/3)(1/√2)
        </text>
        <Arrow x1={255} y1={36 + column * 70} x2={297} y2={36 + column * 70} />
        <text x={305} y={40 + column * 70}>6/√2 = 6 × 1/√2</text>
      </g>)}
      <ellipse cx={155} cy={173} rx={49} ry={16.3299} transform="rotate(-45 155 173)"
        fill="none" stroke="#efbd6d" strokeWidth={2} />
      <line x1={120.35} y1={207.65} x2={189.65} y2={138.35} stroke="#efbd6d" />
      <text x={220} y={177}>Radii √6 and √(2/3)</text>
      <text x={220} y={201}>Length scale: 20 pixels per unit</text>
    </Drawing>
  </Figure>;
}

export function TraceLedger() {
  return <Figure job="D14" title="Covariance and geometric loss share one ledger"
    description="Two diagonal entries add to trace, the retained sample variance is subtracted, and multiplying by three restores squared residual energy."
    caption="10/3 + 10/3 = trace 20/3; subtract retained 6 → discarded variance 2/3; multiply by (n − 1) = 3 → discarded SSE 2.">
    <Drawing width={550} height={245} title="Trace-to-loss conservation"
      description="Two feature-square rails meet at an adder. The same discarded variance then converts back to discarded energy.">
      {[0, 1].map(index => <g key={index}>
        <rect x={15} y={25 + index * 75} width={50} height={50}
          fill={index ? '#ab83d833' : '#4ea3d833'} stroke={index ? '#AB83D8' : '#4EA3D8'} />
        <text x={75} y={55 + index * 75}>{index ? 'y' : 'x'} variance 10/3</text>
        <Arrow x1={200} y1={50 + index * 75} x2={245} y2={86} />
      </g>)}
      <circle cx={269} cy={86} r={20} stroke="#ddd" fill="none" />
      <text x={269} y={91} textAnchor="middle">+</text>
      <Arrow x1={292} y1={86} x2={340} y2={86} />
      <text x={350} y={79}>Trace 20/3</text>
      <text x={350} y={109}>− retained 6</text>
      <Arrow x1={395} y1={119} x2={395} y2={154} />
      <text x={290} y={179}>Discarded 2/3 × 3 = SSE 2</text>
      <text x={15} y={225}>Same rows, same ruler, same measurement weighting</text>
    </Drawing>
  </Figure>;
}

export function FittedQueryPorts() {
  return <Figure job="D15" title="Training writes state; a query only reads it"
    description="A four-by-two training table supplies a one-by-two mean and a one-by-two decoder. A separate one-by-two query becomes a scalar and returns as a two-coordinate reconstruction."
    caption="Training: X (4 × 2) → μ (1 × 2), D (1 × 2). Query: x (1 × 2) − μ → centered row (1 × 2); multiply Dᵀ (2 × 1) → z (1 × 1); multiply D (1 × 2), add μ → decoded row (1 × 2). No query enters the fitting arrow.">
    <Drawing width={550} height={300} title="Fitted boundary and query decoder dimensions"
      description="Array cells make widths visible. Dashed boundary separates fitted shared state from current-query calculation.">
      <text x={15} y={25}>Training X: four rows, two columns</text>
      {originalRows.map((row, index) => row.map((value, column) => <g key={`${index}-${column}`}>
        <rect x={20 + column * 38} y={40 + index * 30} width={35} height={27}
          fill="none" stroke={recordColors[index]} />
        <text x={37 + column * 38} y={59 + index * 30} textAnchor="middle">{value}</text>
      </g>))}
      <Arrow x1={115} y1={93} x2={210} y2={93} />
      <text x={150} y={76}>Fit</text>
      <rect x={221} y={45} width={285} height={112} stroke="#aaa" strokeDasharray="6 4" fill="none" />
      <text x={234} y={71}>Stored μ (1 × 2): [3, 2]</text>
      <text x={234} y={99}>Stored D (1 × 2): [1/√2, 1/√2]</text>
      <text x={234} y={127}>Shared state stays fixed for queries</text>
      <text x={15} y={210}>Query 1 × 2</text>
      <Arrow x1={110} y1={207} x2={158} y2={207} />
      <text x={166} y={211}>− μ</text>
      <Arrow x1={203} y1={207} x2={235} y2={207} />
      <text x={242} y={211}>× Dᵀ</text>
      <Arrow x1={290} y1={207} x2={325} y2={207} />
      <text x={331} y={211}>z: 1 × 1</text>
      <Arrow x1={398} y1={207} x2={430} y2={207} />
      <text x={438} y={211}>× D + μ</text>
      <text x={344} y={253}>Decoded row: 1 × 2</text>
      <path d="M460,218 V241 H424" stroke="#ddd" fill="none" />
    </Drawing>
  </Figure>;
}

export function QueryEditing() {
  const input = useNumericDrafts([6, 4], [[-10, 10], [-10, 10]]);
  const state = queryProjection(input.values);
  return <Figure job="D16" title="Change the query without changing fitted state"
    description="Each current-query coordinate subtracts the stored mean. Two coefficient products sum to a scalar, which decodes through the same stored direction."
    caption={`Current query ${displayPair(state.query)}; centered ${displayPair(state.displacement)}; score ${formatNumber(state.score)}; decoded ${displayPair(state.decoded)}; residual ${displayPair(state.residual)}, squared length ${formatNumber(state.loss)}. μ = (3, 2) and direction (1/√2, 1/√2) stay fixed.`}>
    <ScoreCircuit {...state} title="Current query dot product" />
    <CoordinatePlane rows={[state.query]} mean={[3, 2]} direction={diagonal}
      feet={[state.decoded]} extent={[[-12, 12], [-12, 12]]} title="Query and fixed fitted ruler" query />
    <Controls onReset={input.reset}>
      <NumberField state={input} index={0} label="Query x measurement" min={-10} max={10} />
      <NumberField state={input} index={1} label="Query y measurement" min={-10} max={10} />
    </Controls>
  </Figure>;
}

export function SingularFactorAnatomy() {
  const rows = centered(originalRows).rows;
  return <Figure job="D17" title="The thin SVD separates observation patterns, stretches and feature directions"
    description="The four-by-two centered table factors into U with four rows, two singular values and Vh with two direction rows. The first observation pattern stretches to the four scores."
    caption="A = U S Vᵀ. First normalized observation pattern (−.5, −.5, .5, .5), multiplied by √18, gives (−3/√2, −3/√2, 3/√2, 3/√2). Feature directions are rows of Vh. The second stretch is √2.">
    <div className="pca-comparison">
      <Matrix values={rows} label="Centered A: 4 × 2" rowLabels={recordNames}
        columnLabels={['x', 'y']} />
      <Matrix values={thinSvdFixture.u} label="Normalized observation patterns U: 4 × 2"
        rowLabels={recordNames} columnLabels={['Pattern 1', 'Pattern 2']} />
      <Matrix values={thinSvdFixture.singular}
        label="Singular stretches S: 2 × 2" />
      <Matrix values={[diagonal, perpendicular]} label="Feature directions Vh: 2 × 2"
        columnLabels={['x coefficient', 'y coefficient']} />
    </div>
    <Drawing width={550} height={150} title="One column of A V becomes a stretched U column"
      description="Four row-direction dot products equal one singular stretch times four normalized observation entries.">
      <text x={15} y={35}>A (4 × 2)</text>
      <Arrow x1={110} y1={31} x2={152} y2={31} />
      <text x={160} y={35}>× v₁ (2 × 1)</text>
      <Arrow x1={270} y1={31} x2={316} y2={31} />
      <text x={324} y={35}>√18 × u₁ (4 × 1)</text>
      {[-3, -3, 3, 3].map((value, index) => <text key={index}
        x={25 + index * 128} y={94} fill={recordColors[index]}>
        {recordNames[index]}: {value}/√2
      </text>)}
    </Drawing>
  </Figure>;
}

export const foundationDrawings = {
  D01: InstrumentRecords,
  D02: RowsToScatter,
  D03: StoragePreview,
  D04: CenteringAnatomy,
  D05: FirstScore,
  D06: FirstDecode,
  D07: RulerRotation,
  D08: RecordEditing,
  D09: RetainedCoordinates,
  D10: EnergySquares,
  D11: DenominatorAnatomy,
  D12: CovarianceProducts,
  D13: CovarianceAction,
  D14: TraceLedger,
  D15: FittedQueryPorts,
  D16: QueryEditing,
  D17: SingularFactorAnatomy
};
