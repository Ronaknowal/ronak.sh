import { useId } from 'react';
import { formatGraphNumber, graphEnergy, graphMatrices, graphWalks } from '../../data/graph-fundamentals-models.js';
import './graph-fundamentals-labs.css';

export const graphNumber = (value, digits = 6) => value === null ? '?' : typeof value === 'number'
  ? formatGraphNumber(value, digits).replaceAll('-', '−') : String(value);
export const stationLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
const positions = [[42, 60], [158, 60], [274, 60], [92, 164], [226, 164], [274, 246]];

export function GraphFigure({ label, children, caption, name }) {
  return <figure className="gf-figure" aria-label={label} data-graph-figure={name}>
    {children}{caption && <figcaption>{caption}</figcaption>}
  </figure>;
}

/** Circles are vertices, connections are edges, square outlines are fixed values.
 * Positions have no physical meaning. Edge labels, never lengths, encode weights. */
export function StationNetwork({ edges, labels = stationLabels.slice(0, 5), values, selected = [], anchors = [], directed = false, edgeLabels, groups = [], title, positions: suppliedPositions }) {
  const id = `gf-arrow-${useId().replaceAll(':', '')}`;
  const points = suppliedPositions || positions.slice(0, labels.length);
  const height = Math.max(...points.map(p => p[1])) + (values ? (values.some(Array.isArray) ? 84 : 62) : 40);
  const top = edges.some(([u,v,w]) => u === v && w > 0) ? -24 : 0;
  const reverse = (u, v) => directed && edges.some(([a, b, w]) => w > 0 && a === v && b === u);
  return <svg className="gf-scene" viewBox={`0 ${top} 320 ${Math.max(height, 130)-top}`} role="img" aria-label={title}>
    <title>{title}</title>
    <defs><marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="context-stroke" /></marker></defs>
    {groups.map((group, i) => <ellipse key={i} className={`gf-enclosure ${group.kind || ''}`} cx={group.x} cy={group.y} rx={group.rx} ry={group.ry} />)}
    {edges.map(([u, v, weight], i) => {
      if (weight <= 0) return null;
      const [x, y] = points[u], [xx, yy] = points[v];
      if (u === v) return <g key={i}><path className="gf-selected-line" d={`M${x-12} ${y-18}C${x-46} ${y-62} ${x+46} ${y-62} ${x+12} ${y-18}`} fill="none" markerEnd={directed ? `url(#${id})` : undefined}/><text className="gf-label" x={x} y={y-63} textAnchor="middle">loop {graphNumber(weight)}</text></g>;
      const length=Math.hypot(xx-x,yy-y), dx=(xx-x)/length, dy=(yy-y)/length;
      const offset=reverse(u,v) ? 24 : 0;
      const mx=(x+xx)/2-dy*offset, my=(y+yy)/2+dx*offset;
      return <g key={i}><path className={selected.includes(u) && selected.includes(v) ? 'gf-selected-line' : 'gf-edge-line'} d={`M${x+dx*21} ${y+dy*21}Q${mx} ${my} ${xx-dx*25} ${yy-dy*25}`} fill="none" markerEnd={directed ? `url(#${id})` : undefined}/>
        <text className="gf-label gf-halo" x={mx} y={my-11} textAnchor="middle">{edgeLabels?.[i] ?? graphNumber(weight)}</text></g>;
    })}
    {labels.map((label,i) => <g key={label}>
      {anchors.includes(i) && <rect className="gf-fixed-outline" x={points[i][0]-25} y={points[i][1]-25} width="50" height="50"/>}
      <circle className={selected.includes(i) ? 'gf-vertex is-selected' : 'gf-vertex'} cx={points[i][0]} cy={points[i][1]} r="19"/>
      <text className="gf-label" x={points[i][0]} y={points[i][1]+6} textAnchor="middle">{label}</text>
      {values && (Array.isArray(values[i]) ? values[i].map((value,j)=><text key={j} className="gf-label gf-result-label" x={points[i][0]} y={points[i][1]+47+23*j} textAnchor="middle">{graphNumber(value,4)}</text>) : <text className="gf-label gf-result-label" x={points[i][0]} y={points[i][1]+47} textAnchor="middle">{graphNumber(values[i], 4)}</text>)}
    </g>)}
  </svg>;
}

export function GraphMatrix({ values, label, rows = stationLabels.slice(0, values.length), columns, mark, block, digits = 4 }) {
  const names=columns || stationLabels.slice(0, values[0]?.length || 0);
  return <div className="gf-matrix-view"><p className="gf-matrix-label">{label}</p>
    <div className="gf-matrix-scroll" role="region" aria-label={label} tabIndex={0}>
    <table className="gf-value-matrix"><caption className="gf-matrix-caption">{label}</caption>
      <thead><tr><th scope="col" aria-label="row labels"/>{names.map((name,i)=><th scope="col" key={i}>{name}</th>)}</tr></thead>
      <tbody>{values.map((row,i)=><tr key={i}><th scope="row">{rows[i]}</th>{row.map((value,j)=><td key={j} className={[mark?.(i,j) && 'is-selected',block?.(i,j) && 'is-block'].filter(Boolean).join(' ')}>{typeof value==='boolean' ? Number(value) : graphNumber(value,digits)}</td>)}</tr>)}</tbody>
    </table>
    </div></div>;
}

/** Each lane repeats the graph vertices at one step; highlighted links are real
 * consecutive moves belonging to the requested walks, not direct new edges. */
export function WalkLayers({ start = 0, target = 2, steps = 2, edges = [[0,1,2],[1,2,1]], size = 3 }) {
  const id=`gf-walk-${useId().replaceAll(':','')}`;
  const result=graphWalks(graphMatrices(size,edges).adjacency,start,target,steps);
  const X=i=>32+i*256/Math.max(1,size-1), Y=s=>42+78*s;
  const used=(u,v,s)=>result.walks.some(walk=>walk.vertices[s]===u && walk.vertices[s+1]===v);
  return <div>
    <svg className="gf-scene gf-layers" viewBox={`0 0 320 ${80+78*steps}`} role="img" aria-label={`${stationLabels[start]} to ${stationLabels[target]} in ${steps} steps: weighted sum ${result.weightSum}. Each horizontal lane is one step.`}>
      <defs><marker id={id} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0L5 2.5L0 5z" fill="context-stroke"/></marker></defs>
      {Array.from({length:steps},(_,s)=>edges.flatMap(([u,v,w])=>[[u,v,w],[v,u,w]]).map(([u,v,w],i)=><g key={`${s}-${i}`}>
        <line className={used(u,v,s) ? 'gf-selected-line' : 'gf-construction'} x1={X(u)} y1={Y(s)+14} x2={X(v)} y2={Y(s+1)-16} markerEnd={`url(#${id})`}/>
        {used(u,v,s) && <text className="gf-label gf-halo" x={(X(u)+X(v))/2+(u<v ? -13 : 13)} y={(Y(s)+Y(s+1))/2+5} textAnchor="middle">×{w}</text>}
      </g>))}
      {Array.from({length:steps+1},(_,s)=><g key={s}><text className="gf-step-label" x="4" y={Y(s)-26}>step {s}</text>{Array.from({length:size},(_,v)=><g key={v}>
        <circle className={(s===0 && v===start)||(s===steps && v===target) ? 'gf-vertex is-selected' : 'gf-vertex'} cx={X(v)} cy={Y(s)} r="14"/>
        <text className="gf-label" x={X(v)} y={Y(s)+5} textAnchor="middle">{stationLabels[v]}</text>
      </g>)}</g>)}
    </svg>
    <p className="gf-exact">{result.walks.length ? result.walks.map((walk,i)=><span key={i}>{walk.vertices.map(v=>stationLabels[v]).join('→')}: product {graphNumber(walk.weight)}{i<result.walks.length-1 ? '; ' : ''}</span>) : 'No walk of this exact length.'} Sum {graphNumber(result.weightSum)}.</p>
  </div>;
}

/** A weighted square sum: the running graph's integer couplings are represented
 * as repeated equal-area squares. One coordinate unit has the same scale. */
export function EdgeSquares({ values = [3,1,0,2,2] }) {
  const result=graphEnergy(5,[[0,1,2],[1,2,1],[3,4,2]],values);
  return <div className="gf-square-row">{result.edgeTerms.map((edge,i)=>{
    const side=Math.abs(edge.drop)*18;
    return <div key={i}><p>{stationLabels[edge.source]}—{stationLabels[edge.target]}</p>
      <svg className="gf-square-scene" viewBox="0 0 220 132" role="img" aria-label={`${edge.weight} copies of a square with side ${Math.abs(edge.drop)}; weighted energy ${edge.energy}.`}>
        {Array.from({length:edge.weight},(_,k)=>edge.drop===0 ? <circle className="gf-zero-mark" key={k} cx={26+94*k} cy="112" r="2"/> : <rect className="gf-area-mark" key={k} x={8+102*k} y={112-side} width={side} height={side}/>)}
      </svg>
      <p className="gf-exact">{edge.weight} × ({graphNumber(edge.drop)})² = {graphNumber(edge.energy)}</p>
    </div>;
  })}</div>;
}

export function AnchorEnergyDrawing({ left = 6, right = 0 }) {
  const minimum=(2*left+right)/3;
  const E=x=>2*(left-x)**2+(right-x)**2;
  const X=x=>45+x*30, Y=y=>202-y*168/192;
  const points=Array.from({length:81},(_,i)=>i/10);
  return <svg className="gf-scene" viewBox="0 0 320 264" role="img" aria-label={`Boundary energy 2(${left}−B)²+(${right}−B)², minimized at B=${graphNumber(minimum)}. Fixed axes B0–8, energy0–192.`}>
    <path className="gf-axis" d="M45 28V202H292"/>
    {[0,96,192].map(y=><g key={y}><line className="gf-grid" x1="45" x2="285" y1={Y(y)} y2={Y(y)}/><text className="gf-tick" x="36" y={Y(y)+5} textAnchor="end">{y}</text></g>)}
    <path className="gf-selected-line" fill="none" d={points.map((x,i)=>`${i ? 'L':'M'}${X(x)} ${Y(E(x))}`).join(' ')}/>
    <line className="gf-construction" x1={X(minimum)} x2={X(minimum)} y1={Y(E(minimum))} y2="202"/>
    <circle className="gf-result-point" cx={X(minimum)} cy={Y(E(minimum))} r="5"/>
    {[0,4,8].map(x=><text className="gf-tick" key={x} x={X(x)} y="226" textAnchor="middle">{x}</text>)}
    <text className="gf-label" x="46" y="18">coupling energy</text><text className="gf-label" x="160" y="253" textAnchor="middle">unknown B value</text>
  </svg>;
}

export function SignalTrajectories({ states, domain, totalSteps = 24, selectedStep = states.length-1 }) {
  const [low,high]=domain, X=s=>52+s*230/totalSteps, Y=v=>194-(v-low)*148/(high-low);
  const dashes=['','7 4','2 4','10 4 2 4'];
  return <svg className="gf-scene" viewBox="0 0 320 263" role="img" aria-label={`Node signals through update ${states.length-1}; fixed step axis0–${totalSteps}, value axis ${graphNumber(low)}–${graphNumber(high)}. A solid amber, B dashed neutral, C dotted cyan, D dash-dot neutral.`}>
    <path className="gf-axis" d="M52 30V194H287"/>
    {[low,(low+high)/2,high].map((v,i)=><g key={i}><line className="gf-grid" x1="52" x2="282" y1={Y(v)} y2={Y(v)}/><text className="gf-tick" x="45" y={Y(v)+5} textAnchor="end">{graphNumber(v,1)}</text></g>)}
    {states[0].map((_,v)=><g key={v}><polyline className={`gf-trajectory gf-trace-${v}`} strokeDasharray={dashes[v]} fill="none" points={states.map((row,s)=>`${X(s)},${Y(row[v])}`).join(' ')}/>{states.map((row,s)=><circle className={`gf-trace-point gf-trace-${v}`} key={s} cx={X(s)} cy={Y(row[v])} r="2.5"/>)}</g>)}
    <line className="gf-cursor" x1={X(selectedStep)} x2={X(selectedStep)} y1="30" y2="194"/>
    {[0,12,24].map(s=><text className="gf-tick" key={s} x={X(s)} y="218" textAnchor="middle">{s}</text>)}
    <text className="gf-label" x="52" y="19">signal value</text><text className="gf-label" x="167" y="245" textAnchor="middle">update step</text>
  </svg>;
}
