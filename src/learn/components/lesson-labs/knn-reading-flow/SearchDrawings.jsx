import { useState } from 'react';
import { cases, kdBuild, kdSearch, candidates, volume } from "../../../data/knn-reading-flow-model.js";
import { Figure, Table, Numeric, Choices, Map, Scene, Legend, Steps, Matrix, Bars, num } from "./DrawingParts.jsx";
function Tree({
  active = null,
  visited = []
}) {
  const nodes = [],
    edges = [];
  function place(node, x, y, spread) {
    if (!node) return;
    nodes.push({
      ...node,
      x,
      y
    });
    for (const [child, sign] of [[node.left, -1], [node.right, 1]]) if (child) {
      edges.push([x, y, x + sign * spread, y + 90]);
      place(child, x + sign * spread, y + 90, spread / 2);
    }
  }
  place(kdBuild(), 300, 40, 150);
  return <Scene label="Actual median KD-tree: each node stores one row" width={600} height={365}>{edges.map(([x, y, xx, yy], i) => <path key={i} d={'M' + x + ',' + (y + 15) + 'V' + (y + yy) / 2 + 'H' + xx + 'V' + (yy - 15)} stroke="#777" fill="none" />)}{nodes.map(node => <g key={node.row.id}><circle cx={node.x} cy={node.y} r={15} fill={active === node.row.id ? '#59412a' : visited.includes(node.row.id) ? '#30445a' : '#222'} stroke={active === node.row.id ? '#e5ad52' : '#aaa'} /><text x={node.x} y={node.y + 5} textAnchor="middle">{node.row.id}</text><text x={node.x + 23} y={node.y + 5} textAnchor="start">x{node.axis + 1}={node.row.point[node.axis]}</text></g>)}</Scene>;
}
export function KdBuildFigure() {
  const tree = kdBuild();
  return <Figure id="D17" label="Median rows organize spatial partitions" caption="Rows sort by the current coordinate, then named ID. The upper median is stored; axes alternate. Root C2 partitions at x₁=3.2. Targets do not determine the split."><div className="knf-panels"><Tree /><Map split={{
        axis: tree.axis,
        split: tree.row.point[tree.axis]
      }} /></div><Table caption="Root partition membership" headers={['side', 'IDs']} rows={[['left', 'A1,A2,A3,C1'], ['stored root', tree.row.id], ['right', 'B1,B2,B3']]} /></Figure>;
}
export function KdSearchLab() {
  const [q, setQ] = useState([1.3, 2.1]),
    [cursor, setCursor] = useState(0),
    [resetKey, setResetKey] = useState(0),
    r = kdSearch(q),
    frame = r.frames[Math.min(cursor, r.frames.length - 1)],
    seen = r.frames.slice(0, cursor + 1).filter(f => f.kind === 'visit').map(f => f.node);
  function query(next) {
    setQ(next);
    setCursor(0);
  }
  function reset() {
    query([1.3, 2.1]);
    setResetKey(x => x + 1);
  }
  return <>
    <Figure id="D18-query" label="Choose the query for exact KD search" caption="These two coordinates feed the complete result and trace below. Editing either restarts the trace; reset also restores the initial query.">
      <span id="knn-kdtree" /><Map query={q} selected={[r.best]} />
      <div className="knf-controls"><Numeric label="KD query x₁" value={q[0]} min={0} max={6} onChange={v=>query([v,q[1]])} resetKey={resetKey} /><Numeric label="KD query x₂" value={q[1]} min={0} max={6} onChange={v=>query([q[0],v])} resetKey={resetKey} /><button type="button" onClick={reset}>Reset KD query</button></div>
      <p aria-live="polite">Complete result for ({q.map(v=>num(v)).join(', ')}): {r.best.id}, distance {num(r.best.distance)}; visited {r.visited.length}/8 ({r.visited.join(', ')}).</p>
    </Figure>
    <p>Follow that same query through the search. Back and Next move one actual operation; Restart returns to its first operation without changing the query.</p>
    <Figure id="D18" label="Near-first search with actual incumbent and plane bound" caption="The complete result above stays visible. Equality searches the far side to preserve an ID tie. The bound uses the incumbent after searching the near branch.">
      <Tree active={frame.node} visited={seen} /><Map query={q} selected={cases.filter(row=>seen.includes(row.id))} split={{axis:frame.axis,split:frame.split}} />
      <Table caption={'Current frame '+(cursor+1)+'/'+r.frames.length} headers={['operation','node','axis/split','value','incumbent / decision']} rows={[[frame.kind,frame.node,'x'+(frame.axis+1)+'='+frame.split,frame.kind==='visit'?'distance '+num(frame.distance):'plane bound '+num(frame.bound),frame.kind==='visit'?(frame.before?.id??'none')+' → '+frame.after.id+' ('+num(frame.after.distance)+')':'best '+frame.best.id+' ('+num(frame.best.distance)+'); '+(frame.far===null?'no far child':frame.prune?'prune '+frame.far:'search '+frame.far)]]} />
      <div className="knf-controls"><button type="button" disabled={cursor===0} onClick={()=>setCursor(v=>Math.max(0,v-1))}>Back</button><button type="button" disabled={cursor===r.frames.length-1} onClick={()=>setCursor(v=>Math.min(r.frames.length-1,v+1))}>Next</button><button type="button" onClick={()=>setCursor(0)}>Restart trace</button></div>
      <p aria-live="polite">Query ({q.map(v=>num(v)).join(', ')}); operation {cursor+1}/{r.frames.length}; complete nearest row {r.best.id}.</p>
    </Figure>
  </>;
}
export function BallBoundFigure() {
  return <Figure id="D19" label="Containing ball lower bound" caption="The group is enclosed by center6/radius2; its nearest possible position from query0 is4. This bound is not an actual nearest member. Best3 permits pruning; best5 or equality4 requires search."><Scene label="Query, containing ball and incumbents" width={480} height={260}><circle cx={340} cy={125} r={90} stroke="#91b4d8" fill="none" /><path d="M70,125H430M70,130l-7,-7m0,7l7,-7" stroke="#aaa" fill="none" /><circle cx={340} cy={125} r={4} fill="#91b4d8" /><circle cx={315} cy={90} r={5} fill="#91b4d8" /><circle cx={380} cy={140} r={5} fill="#91b4d8" /><path d="M70,205H250M250,205V185" stroke="#e5ad52" fill="none" /><text x={45} y={105}>q=0</text><text x={320} y={240}>c=6, r=2</text><text x={120} y={230}>d(q,c)−r=4</text><circle cx={205} cy={125} r={5} fill="#e5ad52" /><text x={155} y={70}>best=3</text><circle cx={295} cy={125} r={5} fill="white" /><text x={270} y={170}>best=5</text></Scene><Steps items={['d(q,p) ≥ d(q,c)−d(c,p)', 'd(c,p) ≤ r', 'lower bound=max(0,6−2)=4', '4>3: prune; 4<5: search; equality: search']} /></Figure>;
}
export function HeapFigure() {
  return <Figure id="D20" label="Max-heap kth-distance threshold" caption="The heap root is the worst retained candidate under distance/ID ordering. An unfilled heap has no kth threshold. This is an illustrated extension, not a full implemented k-neighbor tree query."><div className="knf-panels"><Scene label="Filled k3 heap and insertion" width={340} height={250}><path d="M170,50L75,145M170,50L265,145" stroke="#888" />{[[170, 50, 'J:3'], [75, 145, 'F:1'], [265, 145, 'H:2']].map(([x, y, label]) => <g key={label}><circle cx={x} cy={y} r={24} fill="#222" stroke="#aaa" /><text x={x} y={y + 5} textAnchor="middle">{label}</text></g>)}<text x={20} y={215}>incoming G:1.5 replaces J:3</text><text x={20} y={242}>new kth threshold2 (H)</text></Scene><Matrix label="Unfilled k3: no pruning threshold" rows={[['F:1'], ['empty'], ['empty']]} /></div><p>With full heap threshold3, plane distance3 retains equal-distance smaller-ID contenders. With empty slots, a large bound cannot exclude a needed row.</p></Figure>;
}
export function CostFigure() {
  return <Figure id="D21" label="Storage and distance workspace" caption="Persistent reference coordinates and temporary query-reference distances are separate arrays. Work and byte counts do not claim milliseconds."><div className="knf-panels"><Scene label="Reference row by coordinate cells" width={360} height={280}>{Array.from({
          length: 7
        }, (_, i) => Array.from({
          length: 6
        }, (_, j) => <rect key={i + '-' + j} x={50 + j * 35} y={35 + i * 25} width={35} height={25} fill={i === 2 ? '#59412a' : '#222'} stroke="#777" />))}<text x={50} y={245}>n=1,000,000 rows; d=128 columns</text><text x={50} y={275}>float32 coordinate:4 bytes</text></Scene><Matrix label="One query[d] → all reference rows" rows={[['q₁', 'q₂', '…', 'q_d'], ['n×d differences'], ['n distances → k selected']]} /></div><Matrix label="Accumulated batch workspace[b,n]" rows={[['d(q₁,row₁)', '…', 'd(q₁,row_n)'], ['⋮', '⋮', '⋮'], ['d(q_b,row₁)', '…', 'd(q_b,row_n)']]} /><p>4×1,000,000×128=512,000,000 bytes ≈488 MiB. Ten million rows:5.12 GB ≈4.77 GiB before labels/index/copies. One O(nd) query and O(n²d) all-pairs comparison are distinct workloads.</p></Figure>;
}
export function AnnStructureFigure() {
  return <Figure id="D22" label="IVF cells and HNSW layered graph" caption="Actual coarse cells and graph edges illustrate structure without measured index results. Upper HNSW nodes are a subset of lower nodes; unprobed IVF lists cannot supply candidates."><div className="knf-panels"><Scene label="IVF candidate lists" width={380} height={300}><rect x={25} y={30} width={155} height={225} fill="#59412a" stroke="#888" /><rect x={180} y={30} width={175} height={225} fill="#222" stroke="#888" />{[[65, 90, 'A1'], [130, 175, 'A2'], [205, 85, 'C1'], [305, 170, 'B1']].map(([x, y, id]) => <g key={id}><circle cx={x} cy={y} r={5} fill="#e5ad52" /><text x={x + 10} y={y - 8}>{id}</text></g>)}<path d="M100,55l12,12m-12,0l12,-12" stroke="white" /><path d="M95,210l9,15h-18Z M265,210l9,15h-18Z" fill="none" stroke="#91b4d8" /><text x={45} y={247}>center1</text><text x={240} y={247}>center2</text><text x={35} y={280}>probed list → candidates → rerank</text></Scene><Scene label="HNSW nested levels and edges" width={420} height={320}><text x={20} y={20}>upper: A1, C1</text><path d="M70,60H310M70,70V155M310,70V155" stroke="#aaa" strokeDasharray="4 4" />{[[70, 60, 'A1'], [310, 60, 'C1'], [70, 170, 'A1'], [170, 225, 'A2'], [310, 170, 'C1'], [365, 245, 'B1']].map(([x, y, id], i) => <g key={i}><circle cx={x} cy={y} r={17} fill="#222" stroke="#aaa" /><text x={x} y={y + 5} textAnchor="middle">{id}</text></g>)}<path d="M85,182L153,215M187,220L294,180M325,184L353,230" stroke="#e5ad52" fill="none" /><text x={20} y={300}>coarse navigation → lower expansion</text></Scene></div></Figure>;
}
export function CandidateLab() {
  const [eligible, setEligible] = useState(cases.map(r=>r.id)),
    [selectedId,setSelectedId] = useState('A1'),
    r = candidates(eligible);
  return <Figure id="D23" label="Editable candidates and exact reranking" caption="Choose one row ID, then edit its eligibility before exact reranking. All eight eligibility states persist when the inspected ID changes. Recall counts shared IDs; class decisions count targets. Fewer than k3 candidates is unavailable, never a silent k reduction."><span id="knn-candidates" /><Map query={[3.1, 2.9]} selected={cases.filter(row => eligible.includes(row.id))} /><Legend /><div className="knf-controls"><Choices label="Inspect candidate ID" value={selectedId} onChange={setSelectedId} options={cases.map(row=>[row.id,row.id])} /><label className="knf-eligibility"><input type="checkbox" checked={eligible.includes(selectedId)} onChange={e=>setEligible(current=>e.target.checked?[...current,selectedId]:current.filter(id=>id!==selectedId))} />{selectedId} eligible</label><button type="button" onClick={()=>{setEligible(cases.map(row=>row.id));setSelectedId('A1');}}>Reset candidates</button></div><p aria-live="polite">Eligible IDs: {cases.filter(row=>eligible.includes(row.id)).map(row=>row.id).join(', ')||'none'}. Changing the inspected ID keeps every other row's choice.</p><Table caption="Exact versus restricted top3" headers={['route', 'IDs', 'class / recall']} rows={[['exact', r.exact.selected.map(row => row.id).join(', '), r.exact.winner], ['candidate', r.available ? r.selected.map(row => row.id).join(', ') : r.count + ' eligible', r.available ? r.winner + '; recall ' + num(r.recall) : 'unavailable: need3 candidates']]} /><Table caption="Restricted rows: distance → share → class" headers={["ID", "distance", "share", "target"]} rows={r.selected.map(row => [row.id, num(row.distance), num(row.share), row.label])} />{r.available && <Bars rows={r.totals.map(row => [row.label, row.value])} />}<p aria-live="polite">{r.available ? 'Recall@3=' + num(r.recall) + '; class ' + r.winner : 'Unavailable: ' + r.count + '<3 eligible rows.'}</p><Matrix label="Separate all-A null: exact[2,4,7] versus approximate[2,4,9]" rows={[['2:A', '4:A', '7:A'], ['2:A', '4:A', '9:A']]} /><p>Recall2/3 with both decisions A: retrieval identity and target prediction are separate outcomes.</p></Figure>;
}
export function VolumeLab() {
  const [d, setD] = useState(10),
    [fraction, setFraction] = useState(.01),
    [resetKey, setResetKey] = useState(0),
    r = volume(d, fraction);
  function reset() {
    setD(10);
    setFraction(.01);
    setResetKey(x => x + 1);
  }
  const side = 200 * r.side;
  return <Figure id="D24" label="Subcube mass and coordinate width" caption="The contained-square inset shows two coordinate widths. The formula describes the d-dimensional uniform cube, not a measured kth-neighbor radius."><span id="knn-volume" /><Scene label="Contained subcube: two-axis inset" width={360} height={300}><rect x={55} y={35} width={200} height={200} fill="none" stroke="#aaa" /><rect x={55} y={235 - side} width={side} height={side} fill="#59412a" stroke="#e5ad52" /><text x={55} y={268}>axis width s={num(r.side)}</text><text x={55} y={296}>all d axes share that width</text></Scene><Steps items={[<span>f=sᵈ={num(fraction, 12)}</span>, <span>s=exp(log(f)/d)={num(r.side, 12)}</span>, <span>n=1000 → expected count nf={num(r.expected)}</span>]} /><div className="knf-controls"><Numeric label="Dimension d" value={d} min={1} max={100} integer step={1} onChange={setD} resetKey={resetKey} /><Numeric label="Volume fraction f" bounds="0<f≤1" value={fraction} min={Number.MIN_VALUE} max={1} step={.01} onChange={setFraction} resetKey={resetKey} /><button type="button" onClick={reset}>Reset volume</button></div><p aria-live="polite">d={d}, modeled width {num(r.side)}. A side0.1 cube needs n=10^{d + 1} for expected count10; fraction1 is the whole cube.</p></Figure>;
}
export function NuisanceFigure() {
  return <Figure id="D25" label="Noise projection collapses target differences" caption="The informative vertical axis is explicitly enlarged. Actual features are noise±10 and signal±0.01. Projection onto the noise direction retains variance but loses class information."><Scene label="Long noise axis and enlarged signal axis" width={500} height={320}><path d="M45,160H455M250,35V265" stroke="#777" />{[[65, 90, 'A'], [65, 230, 'B'], [435, 90, 'A'], [435, 230, 'B']].map(([x, y, label], i) => <g key={i}><circle cx={x} cy={y} r={6} fill={label === 'A' ? '#e5ad52' : '#91b4d8'} /><path d={'M' + x + ',' + y + 'V160'} stroke="#888" strokeDasharray="3 4" /><text x={x + 10} y={y - 10}>{label}</text></g>)}<text x={30} y={185}>−10</text><text x={425} y={185}>+10</text><text x={270} y={90}>signal +0.01</text><text x={270} y={235}>signal −0.01</text><text x={40} y={302}>Different display scales: signal enlarged</text></Scene><Matrix label="Projection gives opposite targets the same coordinate" rows={[['−10:A', '−10:B'], ['+10:A', '+10:B']]} /><p>For independent standard Gaussian coordinates, squared radius has mean d and variance2d; relative SD is √(2/d). Original4000-draw outputs are preserved separately below.</p></Figure>;
}
