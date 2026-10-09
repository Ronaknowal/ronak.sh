import { useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout, flowNumber as number } from './LessonFlow.jsx';
import { paperFeatures, incomingSumRound, paperRoundTrace, storedPaperGraph, synchronousMeanContrast } from '../../data/message-passing-flow-models.js';
import './message-passing-flow.css';

import { paperHues, Drawing, Arrow, Paper, Cells } from './MessagePassingFlowElements.jsx';

export function MessagePassingPaperAnatomy() {
  const next = incomingSumRound(paperFeatures);
  return <figure data-mp-drawing="D01">
    <Drawing height={480} label="Three papers and their two feature cells; a relationship permits messages in both directions">
      {[0, 1].map(id => <Arrow key={id} x1={124 + id * 228 + 31} y1={94} x2={124 + (id + 1) * 228 - 31} y2={94} both />)}
      {[0, 1, 2].map(id => <g key={id}><Paper id={id} x={124 + id * 228} y={94} />
        <text x={124 + id * 228} y="153" textAnchor="middle">feature 1 · feature 2</text>
        <Cells values={[paperFeatures[id]]} x={62 + id * 228} y={170} />
      </g>)}
      <text x="352" y="242" textAnchor="middle">Each line permits messages both ways; values belong to papers.</text>
      <text x="110" y="286" textAnchor="middle" fill="#82d3ed">Input feature rows</text>
      <Cells values={paperFeatures} x={80} y={305} labels={['0','1','2']} identities={[0,1,2]} />
      <Arrow x1={219} y1={365} x2={280} y2={365} />
      <rect x="285" y="337" width="166" height="60" rx="5" fill="none" stroke="#ddd" />
      <text x="368" y="361" textAnchor="middle">Read own and</text>
      <text x="368" y="383" textAnchor="middle">nearby features</text>
      <Arrow x1={457} y1={365} x2={495} y2={365} />
      <text x="566" y="286" textAnchor="middle" fill="#c1a4f5">New rows for a task</text>
      <Cells values={next} x={502} y={305} />
      {[0,1,2].map(id=><text key={id} x="650" y={333+id*48} fill={paperHues[id]}>paper {id}</text>)}
      <text x="352" y="470" textAnchor="middle">The next section traces this simple read-and-add operation.</text>
    </Drawing>
    <figcaption>Paper outlines keep their identity hues; numbers and IDs remain authoritative.
      In value cells, warm fill means positive, blue means negative, and neutral means zero;
      fill does not encode the size of the number. Each row has two feature channels.
      The path’s screen positions are a drawing layout, not input features.</figcaption>
  </figure>;
}

function DirectionPanel({ source, current }) {
  const target = 1 - source;
  const adjacency = Array.from({ length: 3 }, () => [0, 0, 0]);
  adjacency[target][source] = 1;
  return <div>
    <Drawing width={336} height={210} label={`${current ? 'Current' : 'Reversed'} permission: paper ${source} sends to paper ${target}`}>
      <text x="168" y="28" textAnchor="middle">{current ? 'Current permission' : 'Reversed comparison'}</text>
      <Paper id={0} x={64} y={110} /><Paper id={1} x={272} y={110} />
      <Arrow x1={source === 1 ? 238 : 98} y1={110} x2={source === 1 ? 98 : 238} y2={110} hue={paperHues[source]} />
      <text x="168" y="177" textAnchor="middle">source {source} → receiver {target}</text>
      <text x="168" y="204" textAnchor="middle">The reverse permission is absent.</text>
    </Drawing>
    <Drawing width={336} height={255} label={`Matching adjacency cell A[${target},${source}] is one; rows name receivers and columns name sources`}>
      <text x="168" y="28" textAnchor="middle">A: columns name source papers</text>
      {[0,1,2].map(id=><text key={id} x={150+id*64} y="60" textAnchor="middle" fill={paperHues[id]}>{id}</text>)}
      <Cells values={adjacency} x={120} y={70} labels={['receiver 0','receiver 1','receiver 2']} identities={[0,1,2]} highlight={[target,source]} />
      <text x="168" y="242" textAnchor="middle">A[{target}, {source}] = 1</text>
    </Drawing>
    <Drawing width={336} height={193} label={`The same directed edge-list column has source ID ${source} and receiver ID ${target}`}>
      <text x="168" y="28" textAnchor="middle">The same edge-list column</text>
      <Cells values={[[source],[target]]} x={216} y={57} labels={['source ID','receiver ID']} labelHues={[paperHues[source],paperHues[target]]} signFill={false} />
      <text x="168" y="185" textAnchor="middle">IDs select papers; they are not features.</text>
    </Drawing>
  </div>;
}

export function MessagePassingDirectionLab() {
  const [reversed, setReversed] = useState(false);
  const source = reversed ? 1 : 0;
  const target = 1 - source;
  return <FlowLab id="message-permission" label="Follow one directed message permission">
    <figure data-mp-drawing="D02"><div className="mp-flow-comparison">
      <DirectionPanel source={source} current /><DirectionPanel source={target} current={false} />
    </div><figcaption>In each named view follow graph → adjacency → edge list. Paper 2 has no messages here;
      its adjacency row and column are zero. Each graph shows a different one-way permission.</figcaption></figure>
    <FlowControls><FlowChoice label="Direction of the one permitted message"
      options={[[false,'0 → 1'],[true,'1 → 0']]} value={reversed} onChange={setReversed} />
      <button type="button" onClick={()=>setReversed(false)}>Reset</button></FlowControls>
    <FlowReadout>Paper {target} may read paper {source}: row {target}, column {source} is 1.
      The opposite cell is 0, so that reverse message is denied. The comparison shows that different, reversed permission.</FlowReadout>
  </FlowLab>;
}

export function MessagePassingContributionLab() {
  const [first, setFirst] = useState(1);
  const [last, setLast] = useState(4);
  const sum = first + last;
  return <FlowLab id="message-contributions" label="Trace two messages and the receiver's own value">
    <figure data-mp-drawing="D05"><Drawing height={365} label={`Paper 0 sends ${first}; paper 2 sends ${last}; receiver 1 adds their sum to its own 2`}>
      <Paper id={0} x={112} y={80} value={first} /><Paper id={2} x={592} y={80} value={last} />
      <Arrow x1={145} y1={80} x2={274} y2={190} hue={paperHues[0]} />
      <Arrow x1={559} y1={80} x2={430} y2={190} hue={paperHues[2]} />
      <text x="170" y="180" textAnchor="middle" fill={paperHues[0]}>message {number(first)}</text>
      <text x="534" y="180" textAnchor="middle" fill={paperHues[2]}>message {number(last)}</text>
      <rect x="270" y="186" width="164" height="58" rx="5" fill="none" stroke="#ddd" />
      <text x="352" y="210" textAnchor="middle">sum neighbors</text><text x="352" y="233" textAnchor="middle">{number(first)} + {number(last)} = {number(sum)}</text>
      <Arrow x1={352} y1={249} x2={352} y2={279} />
      <text x="490" y="280" fill={paperHues[1]}>own paper 1: 2</text>
      <Arrow x1={488} y1={293} x2={437} y2={307} hue={paperHues[1]} />
      <rect x="270" y="284" width="164" height="58" rx="5" fill="none" stroke="#ddd" />
      <text x="352" y="307" textAnchor="middle">add own value</text><text x="352" y="331" textAnchor="middle" fill="#c1a4f5">new value = {number(sum + 2)}</text>
    </Drawing></figure>
    <FlowControls><FlowSlider name="Paper 0 · feature 1" value={first} onChange={setFirst} min={-4} max={6} />
      <FlowSlider name="Paper 2 · feature 1" value={last} onChange={setLast} min={-4} max={6} />
      <button type="button" onClick={() => { setFirst(1); setLast(4); }}>Reset</button></FlowControls>
    <FlowReadout>The neighbor messages contribute {number(first)} and {number(last)};
      their aggregate is {number(sum)}. Adding paper 1’s own 2 gives {number(sum + 2)}.
      The wire hue follows its sender; the merged result is a computed value.</FlowReadout>
  </FlowLab>;
}

export function MessagePassingSynchronizationLab() {
  const [first, setFirst] = useState(0);
  const state = synchronousMeanContrast(first);
  return <FlowLab id="message-synchronization" label="Compare old-buffer reads with accidental in-place reads">
    <figure data-mp-drawing="D06"><Drawing height={332} label="Both correct receivers read old values 1 and 3 and write 2; the faulty in-place route depends on write order">
      <text x="128" y="35" textAnchor="middle">Old buffer · read only</text>
      <Cells values={state.old.map(v => [v])} x={110} y={58} labels={['paper 0', 'paper 1']} identities={[0,1]} />
      <Arrow x1={176} y1={82} x2={277} y2={82} /><Arrow x1={176} y1={132} x2={277} y2={132} />
      <rect x="282" y="61" width="143" height="92" rx="5" fill="none" stroke="#ddd" />
      <text x="353" y="85" textAnchor="middle">Both receivers</text><text x="353" y="111" textAnchor="middle">read (1, 3)</text><text x="353" y="137" textAnchor="middle">mean = 2</text>
      <Arrow x1={430} y1={82} x2={492} y2={82} /><Arrow x1={430} y1={132} x2={492} y2={132} />
      <text x="568" y="35" textAnchor="middle">Separate next buffer</text>
      <Cells values={state.correct.map(v => [v])} x={500} y={58} />
      {[0,1].map(id=><text key={id} x="635" y={86+id*48} textAnchor="middle" fill={paperHues[id]}>paper {id}</text>)}
      <text x="352" y="204" textAnchor="middle">Faulty route: overwrite paper {first}, then read that changed buffer.</text>
      <Cells values={[state.old]} x={120} y={235} />
      <Arrow x1={253} y1={255} x2={324} y2={255} />
      <Cells values={[[2,3].map((v,id)=>id===first?2:state.old[id])]} x={335} y={235} />
      <Arrow x1={468} y1={255} x2={523} y2={255} />
      <Cells values={[state.inPlace]} x={532} y={235} />
      <text x="184" y="312" textAnchor="middle">before</text><text x="399" y="312" textAnchor="middle">after first write</text><text x="594" y="312" textAnchor="middle">after second write</text>
    </Drawing></figure>
    <FlowControls><FlowChoice label="Faulty write order" options={[[0,'0 first'],[1,'1 first']]} value={first} onChange={setFirst} />
      <button type="button" onClick={() => setFirst(0)}>Reset</button></FlowControls>
    <FlowReadout>Simultaneous reads always give [2, 2]. Writing paper {first} first
      in place instead gives [{state.inPlace.map(value => number(value)).join(', ')}], because the
      second read uses a value from this round rather than the old round.</FlowReadout>
  </FlowLab>;
}

export function MessagePassingReachLab() {
  const [last, setLast] = useState(4);
  const [rounds, setRounds] = useState(2);
  const states = paperRoundTrace(1, last, 2);
  return <FlowLab id="message-reach" label="Follow the same paper through zero, one and two local rounds">
    <figure data-mp-drawing="D07"><Drawing height={444} label="Three copies of the paper path at rounds zero, one and two; paper 2 reaches paper 0 only after two rounds">
      {[0,1,2].map(round => <g key={round}>
        <text x={122 + round * 230} y="34" textAnchor="middle">Round {round}{round===rounds?' · current':''}</text>
        <text x={122 + round * 230} y="61" textAnchor="middle">ID · value</text>
        {[0,1,2].map(id => <g key={id}>
          <circle cx={95+round*230} cy={92+id*130} r="24" fill="#101010" stroke={paperHues[id]} strokeWidth="2" />
          {round===rounds&&<circle cx={95+round*230} cy={92+id*130} r="29" fill="none" stroke="#fff" strokeWidth="2" />}
          <text x={95+round*230} y={98+id*130} textAnchor="middle" fill={paperHues[id]}>{id}</text>
          <text x={146+round*230} y={98+id*130} textAnchor="middle">{number(states[round][id][0])}</text>
          {round<2 && [id-1,id,id+1].filter(target=>target>=0&&target<3).map(target=><Arrow key={target}
            x1={166+round*230} y1={92+id*130} x2={65+(round+1)*230} y2={92+target*130}
            hue={id===2&&target===1&&round===0||id===1&&target===0&&round===1?'#dc9bdd':'#6a6a6a'} />)}
        </g>)}
      </g>)}
      <text x="352" y="430" textAnchor="middle">Named dependency: paper 2 in round 0 → paper 1 in round 1 → paper 0 in round 2.</text>
    </Drawing></figure>
    <FlowControls><FlowSlider name="Paper 2 · initial feature 1" value={last} onChange={setLast} min={-4} max={6} />
      <FlowSlider name="Current round" value={rounds} onChange={setRounds} min={0} max={2} step={1} />
      <button type="button" onClick={() => {setLast(4);setRounds(2);}}>Reset</button></FlowControls>
    <FlowReadout>Paper 0 has value {number(states[rounds][0][0])} after {rounds} rounds.
      {rounds<2?' Its value is independent of paper 2’s initial value at this depth.':' Paper 2 contributes its initial value once through paper 1.'} All three rounds stay visible so you can follow the dependency.</FlowReadout>
  </FlowLab>;
}

function StoragePanel({ state, original }) {
  return <Drawing height={390} label={`${original ? 'Original' : 'Current'} storage order ${state.order.join(', ')}; feature rows and both adjacency axes correspond`}>
    <text x="352" y="28" textAnchor="middle">{original ? 'Original storage' : 'Current storage'}: [{state.order.join(', ')}]</text>
    <text x="192" y="68" textAnchor="middle">Feature 1 by row</text>
    <Cells values={state.rows} x={164} y={115} labels={state.order.map((id,row)=>`row ${row} · paper ${id}`)} identities={state.order} />
    <text x="502" y="68" textAnchor="middle">Source columns</text>
    {state.order.map((id,c)=><text key={id} x={437+c*64} y="102" textAnchor="middle" fill={paperHues[id]}>paper {id}</text>)}
    <Cells values={state.adjacency} x={407} y={115} labels={state.order.map(id=>`paper ${id}`)} identities={state.order} />
    <text x="352" y="298" textAnchor="middle">Own + incoming sum in this storage order</text>
    <Cells values={[state.output.map(row=>row[0])]} x={256} y={322} />
    {state.order.map((id,c)=><text key={id} x={286+c*64} y="386" textAnchor="middle" fill={paperHues[id]}>paper {id}</text>)}
  </Drawing>;
}

export function MessagePassingStorageLab() {
  const [reordered, setReordered] = useState(true);
  const [first, setFirst] = useState(1);
  const original = storedPaperGraph([0,1,2], first);
  const state = storedPaperGraph(reordered ? [2,0,1] : [0,1,2], first);
  const selector = state.order.map(id=>[0,1,2].map(source=>Number(id===source)));
  return <FlowLab id="paper-storage-order" label="Move storage rows while keeping paper identities and both adjacency axes together">
    <figure data-mp-drawing="D04">
      <StoragePanel state={original} original />
      <Drawing height={255} label="A one in each selector row chooses the original storage row for that current row">
        <text x="352" y="28" textAnchor="middle">Row selector: a 1 chooses the original row to copy</text>
        {[0,1,2].map(id=><text key={id} x={286+id*64} y="67" textAnchor="middle">old {id}</text>)}
        <Cells values={selector} x={256} y={80} labels={state.order.map((id,row)=>`new ${row} · paper ${id}`)} identities={state.order} />
        <text x="352" y="244" textAnchor="middle">Use this same selection for features, adjacency receiver rows and source columns.</text>
      </Drawing>
      <StoragePanel state={state} original={false} />
      <figcaption>The semantic paper hues move with their feature rows and both endpoints of each relationship.
        The node outputs move too. Matching them by paper ID gives [{state.byIdentity.map(value=>number(value)).join(', ')}]
        in both views, and the graph sum stays {number(state.sum)}.</figcaption>
    </figure>
    <FlowControls><FlowChoice label="Storage order" options={[[false,'[0, 1, 2]'],[true,'[2, 0, 1]']]} value={reordered} onChange={setReordered} />
      <FlowSlider name="Paper 0 · feature 1" value={first} onChange={setFirst} min={-4} max={6} />
      <button type="button" onClick={()=>{setReordered(true);setFirst(1);}}>Reset</button></FlowControls>
    <FlowReadout>The matched paper outputs are [{state.byIdentity.map(value => number(value)).join(', ')}],
      regardless of row order. If only features move and adjacency does not,
      the wrongly matched outputs are [{state.faultyByIdentity.map(value => number(value)).join(', ')}].
      Identity hues travel with papers, not row numbers.</FlowReadout>
  </FlowLab>;
}
