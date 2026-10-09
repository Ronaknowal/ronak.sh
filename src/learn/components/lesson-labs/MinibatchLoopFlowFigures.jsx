import { useEffect, useId, useRef, useState } from 'react';
import { minibatchNumber as f, scalarRowObjects, meanBatch, sumBatch, constructedDropout } from '../../data/minibatch-loop-flow-models.js';
import './minibatch-loop-flow.css';

export const mbColors = { input: '#82cbd0', parameter: '#e4b752', value: '#c0a0e0', credit: '#e29b72', neutral: '#ddd' };

export function MinibatchDrawing({ label, width = 300, height, children }) {
  const marker = useId().replaceAll(':', ''), container = useRef(null), [panning, setPanning] = useState(false);
  useEffect(() => {
    const element = container.current;
    const measure = () => setPanning(element.scrollWidth > element.clientWidth + 1);
    const observer = new ResizeObserver(measure); observer.observe(element); measure();
    return () => observer.disconnect();
  }, [width, height]);
  return <figure className="mb-drawing" data-mb-drawing={label}>
    {panning && <p className="mb-pan-hint">This connected drawing is wider than this view. Scroll within it, or focus it and use the arrow keys; all labelled parts remain available.</p>}
    <div ref={container} className="mb-drawing-scroll" tabIndex={0} role="region" aria-label={label}>
      <svg className="mb-drawing-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ width: `${width / 16}rem`, minWidth: `${width / 16}rem` }} role="img" aria-label={label}>
        <defs><marker id={marker} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#aaa" /></marker><marker id={`${marker}credit`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill={mbColors.credit} /></marker></defs>
        <g data-marker={marker}>{typeof children === 'function' ? children(marker) : children}</g>
      </svg>
    </div>
  </figure>;
}
export function MbWire({ d, marker, reverse = false }) { return <path d={d} fill="none" stroke={reverse ? mbColors.credit : '#aaa'} strokeWidth="1.8" strokeDasharray={reverse ? '6 4' : undefined} markerEnd={`url(#${marker}${reverse ? 'credit' : ''})`} />; }
export function MbOperand({ x, y, label, value, width = 125, role = 'value' }) {
  return <g><text x={x} y={y - 10} className="mb-small" style={{ fill: mbColors[role] }}>{label}</text><rect x={x} y={y} width={width} height="40" fill="#090909" stroke={mbColors[role]} /><text x={x + width / 2} y={y + 26} textAnchor="middle">{typeof value === 'number' ? f(value) : value}</text></g>;
}
export function MbOperation({ x, y, label, width = 72 }) { return <g><rect x={x - width / 2} y={y} width={width} height="40" fill="#090909" stroke="#ddd" /><text x={x} y={y + 26} textAnchor="middle">{label}</text></g>; }
export function MbArray({ x, y, label, values, columns = values.length, role = 'value', cellWidth = 116 }) {
  return <g><text x={x} y={y - 12} className="mb-small" style={{ fill: mbColors[role] }}>{label}</text>{values.map((value, i) => <g key={i}><rect x={x + i % columns * cellWidth} y={y + Math.floor(i / columns) * 44} width={cellWidth - 4} height="40" fill="#090909" stroke={mbColors[role]} /><text x={x + i % columns * cellWidth + (cellWidth - 4) / 2} y={y + Math.floor(i / columns) * 44 + 26} textAnchor="middle">{typeof value === 'number' ? f(value, 5) : value}</text></g>)}</g>;
}
export function MinibatchTable({ caption, headers, rows }) { return <div className="mb-table-scroll" tabIndex={0} role="region" aria-label={caption}><table className="mb-table"><caption>{caption}</caption><thead><tr>{headers.map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{typeof cell === 'number' ? f(cell, 9) : cell}</td>)}</tr>)}</tbody></table></div>; }

export function MinibatchDeliveryDrawing() {
  return <div className="mb-scenes">{[[12, 12, 8], [4, 4, 2]].map((parts, scene) => <MinibatchDrawing key={scene} label={scene ? 'Ten examples, three physical chunks and two updates' : 'Thirty-two examples delivered in three chunks for one update'} height={scene?475:445}>{marker => <>
    <text x="10" y="24">{scene ? '10 examples: one epoch' : '32 examples: one update'}</text>
    {parts.map((size, i) => <g key={i}>
      <text x="10" y={60 + i * 88} className="mb-small">Physical chunk {i + 1}: {size} records</text>
      {Array.from({ length: size }, (_, j) => <g key={j}><rect x={10 + j % 6 * 45} y={70 + i * 88 + Math.floor(j / 6) * 29} width="39" height="25" fill="none" stroke={mbColors.input} /><text x={29 + j % 6 * 45} y={89 + i * 88 + Math.floor(j / 6) * 29} className="mb-small" textAnchor="middle">{parts.slice(0, i).reduce((a, b) => a + b, 0) + j + 1}</text></g>)}
    </g>)}
    <path d={scene?'M276 70 h8 v128 h-8 M276 246 h8 v28 h-8':'M276 70 h8 v234 h-8'} fill="none" stroke="#aaa"/>
    <MbWire marker={marker} d={scene?'M284 198 H272 V365 H270':'M284 304 V365 H270'}/>
    <MbOperand x={10} y={345} label={scene?'Optimizer step 1':'One optimizer step'} value={scene?'records 1…8':'records 1…32'} width={260} role="neutral"/>
    {scene&&<><MbWire marker={marker} d="M284 274 H298 V411 H271"/><MbOperand x={10} y={391} label="" value="step 2: records 9,10" width={260} role="neutral"/></>}
    <text x="10" y={scene?466:426} className="mb-small">{scene ? '3 backwards; 2 steps; 1 epoch' : '3 backwards; 1 step'}</text>
  </>}</MinibatchDrawing>)}</div>;
}

export function MinibatchScalarDrawing({ x = 1, y = 2, weight = 0, reverse = true }) {
  const row = scalarRowObjects(x, y, weight);
  if(reverse) return <div className="mb-scenes"><MinibatchScalarDrawing x={x} y={y} weight={weight} reverse={false}/><MinibatchDrawing label="Reverse seed follows the residual and input factors to the learned weight" height={680}>{marker=><>
    <MbOperand x={60} y={35} label="Loss reverse seed" value={1} role="credit" width={180}/>
    <MbWire marker={marker} reverse d="M150 75 V124"/><MbOperation x={150} y={124} label={`× ${f(row.residual)}`} width={210}/><text x="8" y="203" className="mb-small">Half-square factor: residual r.</text>
    <MbWire marker={marker} reverse d="M150 164 V176 H0 V223 H150 V245"/><MbOperation x={150} y={245} label="× 1" width={100}/><text x="8" y="325" className="mb-small">p − y factor to p: 1.</text>
    <MbWire marker={marker} reverse d="M150 285 V296 H0 V345 H150 V367"/><MbOperation x={150} y={367} label={`× ${f(x)}`} width={210}/><text x="8" y="447" className="mb-small">w × x factor to w: supplied x.</text>
    <MbWire marker={marker} reverse d="M150 407 V419 H0 V512 H60"/><MbOperand x={60} y={492} label="Credit received by w" value={row.derivative} role="credit" width={180}/>
    <MbWire marker={marker} reverse d="M150 532 V548 H0 V615 H60"/><MbOperand x={60} y={595} label="Learned w is unchanged" value={weight} role="parameter" width={180}/>
    <text x="8" y="676" className="mb-small">Target y stays supplied.</text>
  </>}</MinibatchDrawing></div>;
  return <MinibatchDrawing label="One scalar prediction and half-squared loss" height={560}>{marker => <>
    <MbOperand x={8} y={34} label="Supplied x" value={x} role="input" width={132} />
    <MbOperand x={160} y={34} label="Learned w" value={weight} role="parameter" width={132} />
    <MbWire marker={marker} d="M74 74 V116 H114" /><MbWire marker={marker} d="M226 74 V116 H186" />
    <MbOperation x={150} y={96} label="×" />
    <MbWire marker={marker} d="M150 136 V156 H0 V201 H8" />
    <MbOperand x={8} y={181} label="Computed p" value={row.prediction} width={132} />
    <MbOperand x={160} y={181} label="Supplied y" value={y} role="input" width={132} />
    <MbWire marker={marker} d="M74 221 V265 H114" /><MbWire marker={marker} d="M226 221 V265 H186" />
    <MbOperation x={150} y={245} label="p − y" />
    <MbWire marker={marker} d="M150 285 V303 H258 V350 H225" />
    <MbOperand x={75} y={330} label="Residual r" value={row.residual} width={150} />
    <MbWire marker={marker} d="M150 370 V410" /><MbOperation x={150} y={410} label="½r²" />
    <MbWire marker={marker} d="M150 450 V472 H258 V515 H225" /><MbOperand x={75} y={495} label="Row loss" value={row.loss} width={150} />
    {reverse && <>
      <MbWire marker={marker} reverse d="M230 515 H282 V350 H227" /><text x="235" y="469" className="mb-small" style={{ fill: mbColors.credit }}>seed 1</text>
      <text x="234" y="400" className="mb-small" style={{ fill: mbColors.credit }}>×r</text>
      <MbWire marker={marker} reverse d="M75 350 H18 V148 H202 V74" /><text x="25" y="303" className="mb-small" style={{ fill: mbColors.credit }}>×1</text><text x="92" y="142" className="mb-small" style={{ fill: mbColors.credit }}>×x</text>
      <MbOperand x={75} y={595} label="Credit to w: r × x" value={row.derivative} width={150} role="credit" />
      <MbWire marker={marker} reverse d="M202 74 H296 V615 H225" />
    </>}
  </>}</MinibatchDrawing>;
}

export function MinibatchMeanDrawing({ rows = [{ x: 1, y: 2 }, { x: 2, y: 0 }, { x: 3, y: 1 }], weight = 0, rate = .1 }) {
  const values = rows.map(row => scalarRowObjects(row.x, row.y, weight));
  const lossSum = sumBatch(values.map(row => row.loss)), gradientSum = sumBatch(values.map(row => row.derivative));
  const gradient = gradientSum / rows.length;
  const sumY = 130 + Math.ceil(rows.length / 2) * 44;
  return <div className="mb-scenes">{[['loss', values.map(row => row.loss), lossSum, 'Mean loss'], ['credit', values.map(row => row.derivative), gradientSum, 'Mean credit g']].map(([kind, items, total, resultLabel]) => <MinibatchDrawing key={kind} label={`${resultLabel}: all rows use actual denominator ${rows.length}`} height={sumY + 328}>{marker => <>
    <MbArray x={8} y={35} label={kind === 'loss' ? 'Row losses at same w' : 'Row credits at same w'} values={items} columns={Math.min(2, rows.length)} role={kind === 'loss' ? 'value' : 'credit'} />
    <path d={`M8 ${80 + (Math.ceil(rows.length / 2) - 1) * 44} v12 h228 v-12`} fill="none" stroke="#aaa" />
    <MbWire marker={marker} d={`M122 ${92 + (Math.ceil(rows.length / 2) - 1) * 44} V${sumY}`} reverse={kind === 'credit'} /><MbOperation x={122} y={sumY} label="Σ" />
    <MbWire marker={marker} d={`M122 ${sumY + 40} V${sumY + 65} H0 V${sumY + 105} H8`} reverse={kind === 'credit'} /><MbOperand x={8} y={sumY + 85} label="Numerator total" value={total} width={140} role={kind === 'loss' ? 'value' : 'credit'} />
    <MbOperand x={177} y={sumY + 85} label="Count D" value={rows.length} width={115} role="neutral" />
    <MbWire marker={marker} d={`M78 ${sumY + 125} V${sumY + 171} H114`} reverse={kind === 'credit'} /><MbWire marker={marker} d={`M234 ${sumY + 125} V${sumY + 171} H186`} /><MbOperation x={150} y={sumY + 151} label="÷ D" />
    <MbWire marker={marker} d={`M150 ${sumY + 191} V${sumY + 214} H282 V${sumY + 257} H240`} reverse={kind === 'credit'} /><MbOperand x={60} y={sumY + 237} label={resultLabel} value={total / rows.length} width={180} role={kind === 'loss' ? 'value' : 'credit'} />
    <text x="8" y={sumY + 313} className="mb-small">Same {rows.length} rows; same count D.</text>
  </>}</MinibatchDrawing>)}</div>;
}

export function MinibatchAccumulationDrawing({ rows = [{ id: 'a', x: 1, y: 2 }, { id: 'b', x: 2, y: 0 }, { id: 'c', x: 3, y: 1 }], groups = [[0, 1], [2]], weight = 0, denominator = rows.length, raw = false }) {
  const contributions = groups.map(group => sumBatch(group.map(i => scalarRowObjects(rows[i].x, rows[i].y, weight).derivative)) / (raw ? 1 : denominator));
  const positions=[];let after=119;for(const indices of groups){positions.push(after);after+=Math.ceil(indices.length/2)*44+118;}const totalY=after+10;
  return <MinibatchDrawing label="Fresh chunk graphs share one old weight and one persistent gradient" width={640} height={totalY + 190}>{marker => <>
    <MbOperand x={20} y={30} label="One old parameter w" value={weight} role="parameter" width={190} />
    {groups.map((indices, i) => <g key={i}>
      <MbWire marker={marker} d={`M210 50 H246 V${positions[i]+20} H275`} />
      <MbArray x={280} y={positions[i]} label={`Chunk ${i + 1}: raw row credits`} values={indices.map(index => scalarRowObjects(rows[index].x, rows[index].y, weight).derivative)} columns={2} role="credit" />
      <MbWire marker={marker} reverse d={`M392 ${positions[i]+Math.ceil(indices.length/2)*44-4} V${positions[i]+Math.ceil(indices.length/2)*44+55} H530`} />
      <MbOperation x={564} y={positions[i]+Math.ceil(indices.length/2)*44+35} label={raw ? 'Σ' : `Σ/${denominator}`} />
      <text x="20" y={positions[i]+60} className="mb-small">Rows {indices.map(index => rows[index].id).join(', ')}</text>
      <text x="20" y={positions[i]+89} className="mb-small" style={{ fill: mbColors.credit }}>Add {f(contributions[i], 9)}</text>
      <MbWire marker={marker} reverse d={`M564 ${positions[i]+Math.ceil(indices.length/2)*44+75} V${totalY} H345`} />
    </g>)}
    <MbOperation x={310} y={totalY - 20} label="+" />
    <MbWire marker={marker} reverse d={`M310 ${totalY + 20} V${totalY + 38} H0 V${totalY + 82} H200`} />
    <MbOperand x={200} y={totalY + 62} label="One persistent G slot" value={sumBatch(contributions)} role="credit" width={220} />
    <text x="20" y={totalY + 144} className="mb-small">{raw ? `Divide once at boundary by actual D=${denominator}.` : 'Every credit uses the same original w and D.'}</text>
    <text x="20" y={totalY + 174} className="mb-small">{groups.length} backward calls → one completed gradient → one optimizer step.</text>
  </>}</MinibatchDrawing>;
}

export function MinibatchUpdateDrawing({ weight = 0, gradient = -5 / 3, rate = .1, momentum = 0, previousBuffer = 0, showMemory = false }) {
  const buffer = momentum * previousBuffer + gradient, next = weight - rate * buffer;
  if(!showMemory)return <MinibatchDrawing label="Plain SGD separately multiplies the complete credit by the learning rate" height={580}>{marker=><>
    <MbOperand x={8} y={35} label="Credit g" value={gradient} role="credit" width={132}/><MbOperand x={160} y={35} label="Rate η" value={rate} role="neutral" width={132}/><MbWire marker={marker} reverse d="M74 75 V127 H114"/><MbWire marker={marker} d="M226 75 V127 H186"/><MbOperation x={150} y={107} label="×"/>
    <MbWire marker={marker} d="M150 147 V175 H296 V236 H292"/><MbOperand x={8} y={216} label="Old learned w" value={weight} role="parameter" width={132}/><MbOperand x={160} y={216} label="Movement ηg" value={rate*gradient} role="neutral" width={132}/><MbWire marker={marker} d="M74 256 V310 H114"/><MbWire marker={marker} d="M226 256 V310 H186"/><MbOperation x={150} y={290} label="−"/>
    <MbWire marker={marker} d="M150 330 V350 H0 V411 H60"/><MbOperand x={60} y={391} label="New learned w − ηg" value={weight-rate*gradient} role="parameter" width={180}/><text x="8" y="512" className="mb-small">Backward computed the credit.</text><text x="8" y="550" className="mb-small">This separate step changes w.</text>
  </>}</MinibatchDrawing>;
  return <MinibatchDrawing label="Gradient, optimizer memory, learning rate and parameter update are separate operands" height={960}>{marker => <>
    <MbOperand x={8} y={35} label="Old memory v" value={previousBuffer} width={132} role="neutral" /><MbOperand x={160} y={35} label="Factor μ" value={momentum} width={132} role="neutral" />
    <MbWire marker={marker} d="M74 75 V126 H114"/><MbWire marker={marker} d="M226 75 V126 H186"/><MbOperation x={150} y={106} label="×"/>
    <MbWire marker={marker} d="M150 146 V169 H0 V218 H8"/><MbOperand x={8} y={198} label="Old part μv" value={momentum*previousBuffer} width={132} role="neutral"/><MbOperand x={160} y={198} label="Group g" value={gradient} width={132} role="credit"/>
    <MbWire marker={marker} d="M74 238 V290 H114"/><MbWire marker={marker} reverse d="M226 238 V290 H186"/><MbOperation x={150} y={270} label="+"/>
    <MbWire marker={marker} d="M150 310 V328 H0 V382 H60"/><MbOperand x={60} y={362} label="New memory μv + g" value={buffer} width={180} role="neutral"/>
    <MbWire marker={marker} d="M150 402 V425 H0 V471 H8"/><MbOperand x={8} y={451} label="New v" value={buffer} width={132} role="neutral"/><MbOperand x={160} y={451} label="Rate η" value={rate} width={132} role="neutral"/>
    <MbWire marker={marker} d="M74 491 V544 H114"/><MbWire marker={marker} d="M226 491 V544 H186"/><MbOperation x={150} y={524} label="×"/>
    <MbWire marker={marker} d="M150 564 V587 H296 V636 H292"/><MbOperand x={8} y={616} label="Old w" value={weight} width={132} role="parameter"/><MbOperand x={160} y={616} label="Movement ηv" value={rate*buffer} width={132} role="neutral"/>
    <MbWire marker={marker} d="M74 656 V710 H114"/><MbWire marker={marker} d="M226 656 V710 H186"/><MbOperation x={150} y={690} label="−"/>
    <MbWire marker={marker} d="M150 730 V750 H0 V811 H60"/><MbOperand x={60} y={791} label="New learned w − ηv" value={next} width={180} role="parameter"/>
    <text x="8" y="894" className="mb-small">Clear G after consuming it.</text><text x="8" y="930" className="mb-small">The new w and v survive.</text>
  </>}</MinibatchDrawing>;
}
