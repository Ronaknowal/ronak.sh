import { Fragment, useId, useMemo, useState } from 'react';
import { defaultFoundationMask, encodeFoundationCollections, foundationMaskTargets, groupedTextMembership, labelIdentities, labelOrders, multilabelAllocationTrace, observedFoundationTerms } from '../../data/multilabel-reading-flow-foundation-models.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelQuantity, MultiLabelTable, multilabelNumber } from './MultiLabelReadingFlowControls.jsx';

const labels = labelIdentities.slice(0, 3);

function Bit({ label, value, unknown = false, selected = false }) {
  return <span className="mlf-bit" style={{ '--label-color': label.color }}
    data-positive={!unknown && value === 1} data-unknown={unknown} data-selected={selected}
    aria-label={`${label.name}: ${unknown ? 'unobserved' : value === 1 ? 'present' : 'known absent'}`}>
    {unknown ? '?' : value}
  </span>;
}

function MessageCircuit({ row, features, outputs }) {
  return <MultiLabelCanvas width={600} height={265} title={`${row}: two named feature coordinates reach three independent binary output sockets`}>
    {['sign_in', 'bill'].map((name, index) => <g key={name}>
      <text x={16} y={50 + index * 95}>{name} = {features[index]}</text>
      <circle cx={185} cy={44 + index * 95} r={10} fill={features[index] ? '#eee8f1' : '#111114'} stroke="#eee8f1" />
      <path d={`M195,${44 + index * 95} H245 V132 H278`} fill="none" stroke="#aca5b4" />
    </g>)}
    <path d="M277,92 V170 M277,132 H319" fill="none" stroke="#eee8f1" />
    <text x={211} y={225}>one input row</text>
    {labels.map((label, index) => <g key={label.id} style={{ color: label.color }}>
      <path d={`M319,132 V${43 + index * 85} H396`} fill="none" stroke={label.color} />
      <circle cx={411} cy={43 + index * 85} r={15} fill={outputs[index] ? label.color : '#111114'} stroke={label.color} />
      <text x={445} y={50 + index * 85}>{label.name} {outputs[index]}</text>
    </g>)}
  </MultiLabelCanvas>;
}

export function MessageOutputFigure() {
  return <MultiLabelFigure job="D01" description="Two literal messages each keep one input and three simultaneous answers">
    <p><strong>M1</strong> “I cannot sign in to pay my bill”</p>
    <MessageCircuit row="M1" features={[1, 1]} outputs={[1, 1, 0]} />
    <p><strong>M2</strong> “Please explain my bill”</p>
    <MessageCircuit row="M2" features={[0, 1]} outputs={[1, 0, 0]} />
    <figcaption>These constructed feature/answer rows expose an output interface. Each named socket has its own bit; the three answers do not compete for one slot.</figcaption>
  </MultiLabelFigure>;
}

export function VocabularyMatrixFigure() {
  const [order, setOrder] = useState('ABC');
  const [selected, setSelected] = useState(0);
  const state = encodeFoundationCollections(order);
  return <MultiLabelFigure job="D02" description="Map named label collections into an ordered binary matrix without changing identities">
    <MultiLabelTable caption={`Vocabulary order [${state.columns.map(label => label.name).join(', ')}]`}>
      <thead><tr><th>Observation</th><th>Known collection</th><th>Encoding</th>{state.columns.map(label => <th key={label.id} style={{ color: label.color }}>{label.name}</th>)}</tr></thead>
      <tbody>{state.rows.map((row, index) => <tr key={row.id} aria-current={selected === index ? 'true' : undefined}>
        <th scope="row">{row.id}{selected === index ? ' · selected' : ''}</th>
        <td>{`{${row.names.join(', ')}}`}</td><td aria-hidden="true">→</td>
        {row.values.map((value, column) => <td key={state.columns[column].id}><Bit label={state.columns[column]} value={value} selected={selected === index} /></td>)}
      </tr>)}</tbody>
    </MultiLabelTable>
    <div className="mlf-row-object">Separate unreviewed Access answer: <Bit label={labels[1]} unknown /></div>
    <FlowControls>
      <label>Vocabulary order<select aria-label="Vocabulary order" value={order} onChange={event => setOrder(event.target.value)}>
        {labelOrders.map(value => <option key={value} value={value}>{[...value].map(id => labels.find(label => label.id === id).name).join(', ')}</option>)}
      </select></label>
      <label>Inspect observation<select aria-label="Inspect vocabulary observation" value={selected} onChange={event => setSelected(Number(event.target.value))}>
        {state.rows.map((row, index) => <option key={row.id} value={index}>{row.id}</option>)}
      </select></label>
      <button type="button" onClick={() => { setOrder('ABC'); setSelected(0); }}>Reset vocabulary and observation</button>
    </FlowControls>
    <FlowReadout>{state.rows[selected].id} becomes [{state.rows[selected].values.join(', ')}] in the shown named order. Across the three complete rows, mean cardinality is 1 and density is 1/3. The separate question mark is not a known negative.</FlowReadout>
  </MultiLabelFigure>;
}

export function OutputKindsFigure() {
  return <MultiLabelFigure job="D03" description="One input can feed binary questions, separate categorical vocabularies or numerical outputs">
    <MultiLabelCanvas width={860} height={390} title="One feature-row interface branches into three different output objects; each illustrative task keeps its own answer type">
      {[0, 1].map(index => <g key={index}>
        <text x={15} y={142 + index * 92}>x{index + 1}</text>
        <circle cx={79} cy={136 + index * 92} r={14} fill="#111114" stroke="#eee8f1" />
        <path d={`M93,${136 + index * 92} H143 V182 H177`} stroke="#eee8f1" fill="none" />
      </g>)}
      <path d="M177,126 V238 M177,182 H222 V62 H267 M222,182 H267 M222,182 V302 H267" stroke="#aaa3b1" fill="none" />
      <text x={15} y={281}>same input interface</text>
      <text x={284} y={31}>Binary output vector · three named bits</text>
      {labels.map((label, index) => <g key={label.id} style={{ color: label.color }}>
        <circle cx={308 + 165 * index} cy={61} r={15} stroke={label.color} fill={index < 2 ? label.color : '#111114'} />
        <text x={331 + 165 * index} y={67}>{label.name} {index < 2 ? 1 : 0}</text>
      </g>)}
      <text x={284} y={133}>Categorical outputs · two separate class axes</text>
      {[['Fruit', ['apple', 'pear', 'orange']], ['Condition', ['fresh', 'damaged']]].map(([name, values], output) => <g key={name}>
        <text x={284} y={172 + 46 * output}>{name}</text>
        {values.map((value, index) => <g key={value}>
          <circle cx={414 + 141 * index} cy={166 + 46 * output} r={9} fill={index === 0 ? '#eee8f1' : '#111114'} stroke="#eee8f1" />
          <text x={429 + 141 * index} y={172 + 46 * output}>{value}</text>
        </g>)}
      </g>)}
      <text x={284} y={271}>Numerical output vector · two independent values</text>
      {['Heating', 'Cooling'].map((name, index) => <g key={name} style={{ color: labels[index].color }}>
        <circle cx={309 + 223 * index} cy={302} r={15} stroke={labels[index].color} fill="#111114" />
        <text x={333 + 223 * index} y={308}>{name} {index === 0 ? 20 : 24}</text>
      </g>)}
      <text x={284} y={359}>Illustrative tasks: output types differ; this is not one fitted model.</text>
    </MultiLabelCanvas>
    <div className="mlf-output-comparison">
      <div><p>Binary questions · one input row → three bits</p>
        {labels.map((label, index) => <div className="mlf-row-object" key={label.id}><span style={{ color: label.color }}>{label.name}</span><Bit label={label} value={index < 2 ? 1 : 0} /></div>)}
        <p>Shape (3,); independent binary probability slots</p>
      </div>
      <div><p>Categorical answers · one input row → two class choices</p>
        {[['Fruit', ['apple', 'pear', 'orange'], 0], ['Condition', ['fresh', 'damaged'], 0]].map(([name, vocabulary, selected]) => <div key={name}>
          <p><strong>{name}</strong> · own vocabulary</p>
          <div className="mlf-row-object">{vocabulary.map((value, index) => <span key={value}>{index === selected ? '●' : '○'} {value}</span>)}</div>
        </div>)}
        <p>Class axes have lengths 3 and 2; each axis has one chosen category</p>
      </div>
      <div><p>Numerical answers · one input row → two values</p>
        <MultiLabelCanvas width={330} height={170} title="Separate numerical Heating and Cooling ports, each measured in supplied load units">
          {['Heating', 'Cooling'].map((name, index) => <g key={name} style={{ color: labels[index].color }}>
            <path d={`M12,${40 + 80 * index} H58`} stroke={labels[index].color} fill="none" />
            <circle cx={74} cy={40 + 80 * index} r={16} fill="#111114" stroke={labels[index].color} />
            <text x={105} y={46 + 80 * index}>{name}: {index === 0 ? 20 : 24}</text>
          </g>)}
        </MultiLabelCanvas>
        <p>Constructed values 20 and 24 in supplied load units; shape (2,).</p>
      </div>
    </div>
  </MultiLabelFigure>;
}

export function GroupBoundaryFigure() {
  const [selected, setSelected] = useState(1);
  const [intact, setIntact] = useState(true);
  const [revision, setRevision] = useState(0);
  const state = groupedTextMembership(selected, intact);
  return <MultiLabelFigure job="D04" description="Each real constructed message group carries its two paraphrases across one fitting boundary">
    {['train', 'validation', 'test'].map(role => <div key={role}>
      <p><strong>{role}</strong> · {state.groups.filter(group => group.role === role).length} source groups</p>
      <div className="mlf-group-strip">{state.groups.filter(group => group.role === role).map(group => <div key={group.id} className="mlf-group-object" data-selected={selected === group.id}>
        <strong>G{group.id}</strong>
        {group.rows.map(row => <div className="mlf-member-row" key={row.id}>M{row.id} → {row.role}{group.split ? ' · split comparison' : ''}</div>)}
      </div>)}</div>
    </div>)}
    <MultiLabelCanvas width={770} height={220} title="Only training rows teach the text vocabulary; held messages use its frozen feature slots">
      <text x={16} y={29}>training rows</text><path d="M162,23 H250 V60" fill="none" stroke="#aaa3b1" />
      <text x={170} y={52}>fit only here ↓</text>
      <path d="M223,76 H432 M223,68 V98 M432,68 V98" fill="none" stroke="#eee8f1" />
      <text x={239} y={91}>word₁ · word₂ · …</text>
      <text x={449} y={91}>frozen vocabulary</text>
      <text x={16} y={162}>held message</text><path d="M166,156 H327 V112" fill="none" stroke="#aaa3b1" />
      <text x={185} y={193}>look up fixed slots ↑</text>
      <path d="M432,83 H700 M691,76 L700,83 L691,90" fill="none" stroke="#eee8f1" />
      <text x={540} y={61}>features [0, 1, …]</text>
    </MultiLabelCanvas>
    <FlowControls>
      <MultiLabelQuantity label="Inspected source group" value={selected} onChange={setSelected} min={0} max={15} integer revision={revision} />
      <label>Partition comparison<select aria-label="Partition comparison" value={intact ? 'intact' : 'split'} onChange={event => setIntact(event.target.value === 'intact')}>
        <option value="intact">Keep both paraphrases in one partition</option>
        <option value="split">Illustrate an independent-row leak</option>
      </select></label>
      <button type="button" onClick={() => { setSelected(1); setIntact(true); setRevision(value => value + 1); }}>Reset group boundary</button>
    </FlowControls>
    <FlowReadout>G{selected} carries M{2 * selected} and M{2 * selected + 1} to {state.selected.rows.map(row => row.role).join(' / ')}. {intact ? 'Both paraphrases stay together: train 16, validation 8, test 8.' : 'This labelled comparison moves only the second paraphrase and exposes related wording across the boundary; it is not a new measured split.'}</FlowReadout>
  </MultiLabelFigure>;
}

export function SupportAllocationFigure() {
  const [step, setStep] = useState(0);
  const [seed, setSeed] = useState(0);
  const [revision, setRevision] = useState(0);
  const frames = useMemo(() => multilabelAllocationTrace(seed), [seed]);
  const state = frames[step];
  return <MultiLabelFigure job="D05" description="Allocate complete labelled rows while carrying each fold's capacities and all label deficits">
    <div className="mlf-columns">
      <div><p>Not yet assigned</p><div className="mlf-fold-slots">
        {state.rows.filter(row => row.fold === null).map(row => <div className="mlf-row-object" key={row.id}>R{row.id}{row.values.map((value, column) => <Bit key={column} label={labels[column]} value={value} selected={state.move?.row === row.id} />)}</div>)}
        {!state.rows.some(row => row.fold === null) && <p>Every complete row has one destination.</p>}
      </div></div>
      {[0, 1].map(fold => <div key={fold}><p>Fold {fold + 1} · {state.capacity[fold]} empty slots</p><div className="mlf-fold-slots">
        {state.rows.filter(row => row.fold === fold).map(row => <div className="mlf-row-object" key={row.id}>R{row.id}{row.values.map((value, column) => <Bit key={column} label={labels[column]} value={value} selected={state.move?.row === row.id} />)}</div>)}
        {!state.rows.some(row => row.fold === fold) && <p>Three available row slots</p>}
      </div></div>)}
    </div>
    <MultiLabelTable caption="Remaining positives and fractional deficits after the displayed row movements">
      <thead><tr><th>State</th>{labels.map(label => <th key={label.id} style={{ color: label.color }}>{label.id}</th>)}</tr></thead>
      <tbody><tr><th scope="row">Remaining positives</th>{state.remainingCounts.map((value, index) => <td key={index}>{value}</td>)}</tr>
        {state.deficits.map((row, fold) => <tr key={fold}><th scope="row">Fold {fold + 1} deficit</th>{row.map((value, index) => <td key={index}>{multilabelNumber(value)}</td>)}</tr>)}
      </tbody>
    </MultiLabelTable>
    <FlowControls>
      <MultiLabelQuantity label="Allocation step" value={step} onChange={setStep} min={0} max={6} integer revision={revision} />
      <MultiLabelQuantity label="Allocation tie seed" value={seed} onChange={setSeed} min={0} max={100} integer revision={revision} />
      <button type="button" onClick={() => { setStep(0); setSeed(0); setRevision(value => value + 1); }}>Reset row allocation</button>
    </FlowControls>
    <FlowReadout>{state.move ? `Step ${step} moved R${state.move.row} into fold ${state.move.fold + 1}, ${state.move.label === null ? 'using remaining capacity for an all-negative row' : `starting from rare label ${labels[state.move.label].id} and updating every positive label on that row`}.` : 'No row has moved. Desired support per fold is [1.5, 1, .5], with three whole-row slots.'} One C-positive row cannot supply a C-positive in both folds. This two-fold tie ordering is constructed; the separate program's recorded three-fold result remains a different fixture.</FlowReadout>
  </MultiLabelFigure>;
}

export function ObservedMaskFigure() {
  const [mask, setMask] = useState(defaultFoundationMask);
  const [selected, setSelected] = useState(4);
  const pattern = useId().replaceAll(':', '_');
  const state = observedFoundationTerms(mask);
  const row = Math.floor(selected / 3), column = selected % 3;
  return <MultiLabelFigure job="D06" description="Each observation mask cell gates one binary loss and contributes only to its output's observed count">
    <div className="mlf-table-scroll" tabIndex={0} role="region" aria-label="Aligned target and observation mask cells; pan if needed">
      <div className="mlf-mask-grid"><span>Row</span>{labels.map(label => <strong key={label.id} style={{ color: label.color }}>{label.name}</strong>)}
        {foundationMaskTargets.map((values, index) => <Fragment key={index}><strong>M{index + 1}</strong>{values.map((value, output) => <div key={output}><Bit label={labels[output]} value={value} unknown={!mask[index][output]} selected={index * 3 + output === selected} /><span>M={Number(mask[index][output])}</span></div>)}</Fragment>)}
      </div>
    </div>
    <MultiLabelCanvas width={830} height={470} title="Three rows pass through explicit zero-or-one mask gates into three separate output loss sums and counts">
      <defs><pattern id={pattern} width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0,7 L7,0" stroke="#a8a0b2" /></pattern></defs>
      {labels.map((label, output) => <g key={label.id} style={{ color: label.color }}>
        <text x={18 + output * 275} y={27}>{label.name} loss column</text>
        {state.columns[output].terms.map((term, index) => <g key={index}>
          <text x={18 + output * 275} y={70 + index * 80}>M{index + 1}: ℓ={multilabelNumber(term.loss, 4)}</text>
          <path d={`M${122 + output * 275},${89 + index * 80} H${174 + output * 275}`} stroke={label.color} fill="none" />
          <circle cx={188 + output * 275} cy={89 + index * 80} r={16} fill={term.observed ? '#111114' : `url(#${pattern})`} stroke={label.color} />
          <text x={188 + output * 275} y={95 + index * 80} textAnchor="middle">{Number(term.observed)}</text>
          <path d={`M${204 + output * 275},${89 + index * 80} H${240 + output * 275} V336 H${174 + output * 275}`} stroke={label.color} strokeDasharray={term.observed ? undefined : '4 4'} fill="none" />
        </g>)}
        <circle cx={158 + output * 275} cy={336} r={16} fill="#111114" stroke={label.color} /><text x={158 + output * 275} y={342} textAnchor="middle">Σ</text>
        <text x={18 + output * 275} y={385}>loss sum {multilabelNumber(state.columns[output].sum)}</text>
        <text x={18 + output * 275} y={423}>observed n={state.columns[output].count}</text>
        <text x={18 + output * 275} y={458}>{state.columns[output].count ? `mean ${multilabelNumber(state.columns[output].mean)}` : 'no supervised fit'}</text>
      </g>)}
    </MultiLabelCanvas>
    <figcaption>The literal probabilities [.8,.7,.2], [.2,.3,.8], [.1,.2,.1] supply this constructed BCE gate trace. A hatched unknown cell contributes neither loss nor count.</figcaption>
    <FlowControls>
      <label>Mask cell<select aria-label="Observed mask cell" value={selected} onChange={event => setSelected(Number(event.target.value))}>
        {Array.from({ length: 9 }, (_, index) => <option key={index} value={index}>M{Math.floor(index / 3) + 1}, {labels[index % 3].name}</option>)}
      </select></label>
      <label><input type="checkbox" checked={mask[row][column]} onChange={event => {
        const next = mask.map(values => [...values]);
        next[row][column] = event.target.checked;
        setMask(next);
      }} />This answer was observed</label>
      <button type="button" onClick={() => { setMask(defaultFoundationMask()); setSelected(4); }}>Reset observed cells</button>
    </FlowControls>
    <FlowReadout>M{row + 1}/{labels[column].name} is {mask[row][column] ? 'observed' : 'unknown'}. Counts are [{state.columns.map(output => output.count).join(', ')}]; observed-cell mean is {multilabelNumber(state.globalMean)}, while the sum of per-output means is {multilabelNumber(state.outputMeanSum)}. {state.columns.some(output => !output.count) ? 'An empty output column has no observed supervised fitting support, so that complete per-output reduction is unsupported.' : 'These two reductions assign different weights to the labels.'}</FlowReadout>
  </MultiLabelFigure>;
}
