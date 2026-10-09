import * as retained from '../../../data/k-means-hierarchical-models.js';
export * from '../../../data/k-means-hierarchical-models.js';
export * from '../../../data/k-means-hierarchical-faithful.js';

export const sum = values => values.reduce((total, value) => total + value, 0);
export const squared = (left, right) => sum(left.map((value, i) => (value - right[i]) ** 2));
export const length = (left, right) => Math.sqrt(squared(left, right));
export function mean(points, weights = points.map(() => 1)) {
  const mass = sum(weights);
  return mass === 0 ? null : points[0].map((_, j) => sum(points.map((row, i) => row[j] * weights[i])) / mass);
}
export const scatter = (points, center = mean(points), weights = points.map(() => 1)) => center === null ? null : sum(points.map((row, i) => weights[i] * squared(row, center)));
export function closest(row, centers) {
  const distances = centers.map(center => squared(row, center));
  return { distances, label: distances.reduce((best, value, i) => value < distances[best] ? i : best, 0) };
}

/** A budget return includes fresh nearest labels. A movement frame separately
 * retains the labels which defined that movement; the two are never conflated. */
export function fitSmall(points, initial, budget = 30) {
  let centers = initial.map(row => [...row]);
  let labels = points.map(row => closest(row, centers).label), fixed = false;
  const states = [{ phase: 'initial', centers, labels: null, sse: null, fixed: false }];
  for (let i = 0; i < budget; i++) {
    states.push({ phase: 'assignment', centers, labels, sse: scatterAssigned(points, centers, labels), fixed: false });
    const moved = centers.map((previous, group) => {
      const members = points.filter((_, row) => labels[row] === group);
      return members.length ? mean(members) : [...previous];
    });
    states.push({ phase: 'mean movement', centers: moved, previousCenters: centers, labels, sse: scatterAssigned(points, moved, labels), fixed: false });
    const next = points.map(row => closest(row, moved).label);
    fixed = next.every((label, row) => label === labels[row]);
    centers = moved; labels = next;
    states.push({ phase: 'fresh assignment', centers, labels, sse: scatterAssigned(points, centers, labels), fixed });
    if (fixed) break;
  }
  return { centers, labels, sse: scatterAssigned(points, centers, labels), fixed, states };
}
export const scatterAssigned = (points, centers, labels) => sum(points.map((row, i) => squared(row, centers[labels[i]])));
export function activeGroups(tree, prefix) {
  const active = new Set(tree.points.map((_, i) => i));
  tree.merges.slice(0, prefix).forEach(row => { active.delete(row.left); active.delete(row.right); active.add(row.id); });
  return [...active].sort((a, b) => a - b).map(id => tree.nodes[id]);
}
export function groupDistance(points, first, second, method) {
  const distances = first.members.flatMap(a => second.members.map(b => length(points[a], points[b])));
  const increment = first.members.length * second.members.length / (first.members.length + second.members.length) * squared(first.mean, second.mean);
  return { distances, increment, value: method === 'single' ? Math.min(...distances)
    : method === 'complete' ? Math.max(...distances) : method === 'average' ? sum(distances) / distances.length : Math.sqrt(2 * increment) };
}
export function linkageTree(points, rows, prefix = rows.length) {
  const nodes = points.map((point, id) => ({ id, members: [id], mean: point, height: 0, sse: 0 }));
  const merges = rows.map(([left, right, height, count], i) => {
    const members = [...nodes[left].members, ...nodes[right].members];
    const row = { id: points.length + i, left, right, height, size: count, members, mean: mean(members.map(id => points[id])), sse: scatter(members.map(id => points[id])) };
    nodes.push(row); return row;
  });
  return { points, nodes, merges, root: nodes.at(-1), prefix };
}

export function primTrace(points) {
  const visited = new Set(), best = points.map(() => Infinity), parent = points.map(() => null), edges = [], trace = [];
  best[0] = 0;
  for (let step = 0; step < points.length; step++) {
    const available = points.map((_, i) => i).filter(i => !visited.has(i));
    const vertex = available.reduce((a, b) => best[b] < best[a] ? b : a);
    visited.add(vertex);
    if (parent[vertex] !== null) edges.push([parent[vertex], vertex, best[vertex]]);
    trace.push({ phase: 'commit', vertex, visited: [...visited], best: [...best], parent: [...parent], edges: [...edges] });
    for (const other of available.filter(i => i !== vertex)) {
      const distance = length(points[vertex], points[other]);
      if (distance < best[other] || (distance === best[other] && vertex < parent[other])) {
        best[other] = distance; parent[other] = vertex;
      }
    }
    trace.push({ phase: 'refresh candidates', vertex, visited: [...visited], best: [...best], parent: [...parent], edges: [...edges] });
  }
  return { edges, trace };
}
export function components(points, edges, threshold) {
  const parents = points.map((_, i) => i);
  const find = i => parents[i] === i ? i : (parents[i] = find(parents[i]));
  edges.filter(edge => edge[2] <= threshold).forEach(([a, b]) => {
    const left = find(a), right = find(b); parents[Math.max(left, right)] = Math.min(left, right);
  });
  return points.map((_, i) => find(i));
}

/** Real reciprocal-pointer states over the four-row teaching fixture. The
 * retained all-pair hierarchy is a reference, not secretly relabelled NN-chain. */
export function chainTrace(points, method) {
  const nodes = points.map((point, id) => ({ id, members: [id], mean: point, height: 0 }));
  let active = nodes.map(row => row.id), chain = [], trace = [], discovered = [];
  const stored=new Map(),key=(a,b)=>`${Math.min(a,b)}/${Math.max(a,b)}`;
  const get=(a,b)=>a===b?0:stored.get(key(a,b));
  for(let a=0;a<points.length;a++)for(let b=a+1;b<points.length;b++){
    const d=length(points[a],points[b]);stored.set(key(a,b),method==='ward'?d*d:d);
  }
  const matrixFor=ids=>ids.map(a=>ids.map(b=>method==='ward'?Math.sqrt(get(a,b)):get(a,b)));
  while (active.length > 1) {
    if (!chain.length) chain = [active[0]];
    const a = chain.at(-1), preceding = chain.at(-2);
    const candidates = active.filter(id => id !== a).map(id => ({ id, value: method==='ward'?Math.sqrt(get(a,id)):get(a,id) }));
    const minimum = Math.min(...candidates.map(row => row.value));
    const nearest = candidates.find(row => row.id === preceding && row.value === minimum) || candidates.find(row => row.value === minimum);
    const matrix = matrixFor(active);
    trace.push({ phase: 'nearest pointer', chain: [...chain, nearest.id], active: [...active], matrix, candidates, from: a, to: nearest.id, nodes: [...nodes] });
    if (nearest.id === preceding) {
      const b = preceding, members = [...nodes[a].members, ...nodes[b].members];
      const newNode = { id: nodes.length, left: Math.min(a, b), right: Math.max(a, b), members, mean: mean(members.map(id => points[id])), size: members.length, height: nearest.value };
      const updates=active.filter(c=>c!==a&&c!==b).map(c=>{
        const nA=nodes[a].members.length,nB=nodes[b].members.length,nC=nodes[c].members.length;
        const ac=get(a,c),bc=get(b,c),ab=get(a,b);
        const value=method==='complete'?Math.max(ac,bc):method==='average'?(nA*ac+nB*bc)/(nA+nB)
          :((nA+nC)*ac+(nB+nC)*bc-nC*ab)/(nA+nB+nC);
        if(value < -1e-10)throw Error('Negative Ward squared-height update');
        stored.set(key(newNode.id,c),Math.max(0,value));
        return {c,nA,nB,nC,ac,bc,ab,value:Math.max(0,value)};
      });
      nodes.push(newNode); discovered.push(newNode);
      active = [...active.filter(id => id !== a && id !== b), newNode.id].sort((a, b) => a - b);
      trace.push({ phase: 'merge and repair', merged: newNode, updates, chain: chain.slice(0, -2), active: [...active], matrix:matrixFor(active), from: a, to: b, nodes: [...nodes] });
      chain = chain.slice(0, -2).filter(id => active.includes(id));
    } else chain.push(nearest.id);
  }
  return { trace, discovered, nodes };
}

export function silhouetteRows(points, labels) {
  const groups = [...new Set(labels)];
  if (groups.length < 2 || groups.length >= points.length) return null;
  return points.map((point, i) => {
    const own = points.map((_, j) => j).filter(j => labels[j] === labels[i] && j !== i);
    const others = groups.filter(label => label !== labels[i]).map(label => points.map((_, j) => j).filter(j => labels[j] === label));
    const a = own.length ? sum(own.map(j => length(point, points[j]))) / own.length : 0;
    const means = others.map(members => sum(members.map(j => length(point, points[j]))) / members.length);
    const b = Math.min(...means), other = others[means.indexOf(b)];
    return { own, other, a, b, score: own.length === 0 || Math.max(a, b) === 0 ? 0 : (b - a) / Math.max(a, b) };
  });
}
const choose2 = n => n * (n - 1) / 2;
export function pairComparison(left, right) {
  if (left.length !== right.length) throw Error('Compare the same objects');
  const pairs = left.flatMap((_, i) => left.slice(i + 1).map((_, j) => {
    const b = i + j + 1;
    return { a: i, b, left: left[i] === left[b], right: right[i] === right[b] };
  }));
  const leftIds = [...new Set(left)], rightIds = [...new Set(right)];
  const cells = leftIds.map(a => rightIds.map(b => left.filter((label, i) => label === a && right[i] === b).length));
  const tp = sum(cells.flat().map(choose2));
  const a = sum(cells.map(row => choose2(sum(row))));
  const b = sum(rightIds.map((_, i) => choose2(sum(cells.map(row => row[i])))));
  const expected = a * b / pairs.length, denominator = (a + b) / 2 - expected;
  return { pairs, cells, leftIds, rightIds, tp, a, b, expected, ari: denominator === 0 ? 1 : (tp - expected) / denominator };
}
export const unitReferences = [
  [[.1,.2],[.3,.7],[.7,.4],[.9,.9]], [[.2,.1],[.4,.6],[.6,.8],[.8,.3]],
  [[.05,.8],[.35,.2],[.65,.9],[.95,.4]], [[.15,.35],[.45,.85],[.55,.15],[.85,.65]],
  [[.25,.25],[.3,.9],[.75,.1],[.9,.75]],
];
export const gapObserved = [[-2,0],[-1,1],[1,3],[2,4]];
export const pairDispersion = points => scatter(points.slice(0,2)) + scatter(points.slice(2));
export function gapWitness(basis, realization) {
  const references = unitReferences.map(rows => rows.map(([u,v]) => basis === 'original' ? [-2 + 4*u, 4*v] : {
    // First axis (1,1)/√2, zero second extent: inverse has no artificial width.
    value: -2*Math.SQRT2 + 4*Math.SQRT2*u,
  }).map(row => Array.isArray(row) ? row : [row.value/Math.SQRT2, 2+row.value/Math.SQRT2]));
  const dispersions = references.map(pairDispersion), observed = pairDispersion(gapObserved);
  return { references, points: references[realization], dispersions, observed, logs: dispersions.map(Math.log), gap: sum(dispersions.map(Math.log))/5 - Math.log(observed) };
}
export function gapSimulationSpread(logs) {
 const count=logs.length;if(count<2||logs.some(value=>!Number.isFinite(value)))throw Error('Use at least two finite reference log values');
 const average=sum(logs)/count,deviations=logs.map(value=>value-average),squares=deviations.map(value=>value*value),variance=sum(squares)/count,sd=Math.sqrt(variance),factor=Math.sqrt(1+1/count);
 return {count,average,deviations,squares,variance,sd,factor,error:sd*factor};
}
export function centroidWitness(apex) {
  const points = [[-1,0],[1,0],[0,apex]];
  const pairs = [[0,1],[0,2],[1,2]].map(([a,b]) => ({a,b,distance:length(points[a],points[b])}));
  const first = pairs.reduce((best,row) => row.distance < best.distance ? row : best);
  const merged = mean([points[first.a],points[first.b]]), third = 3-first.a-first.b;
  return { points, pairs, first, merged, third, second: length(merged, points[third]) };
}
export function runningHistory(rows, prefix, thirdMass = 1) {
  let mass = 0, center = null;
  return rows.slice(0,prefix).map((value,i) => {
    const weight = i === 2 ? thirdMass : 1;
    const previous = { mass, center };
    center = mass === 0 ? value : center + weight/(mass+weight)*(value-center); mass += weight;
    return { value, weight, mass, center, previous };
  });
}
export function cachedBatch(reverse = false) {
  const rows = reverse ? [6,4] : [4,6], incoming = [0,10], mass = [1,1];
  const labels = rows.map(row => closest([row],incoming.map(value => [value])).label);
  const centers = incoming.map((value,id) => (value+sum(rows.filter((_,i)=>labels[i]===id)))/(1+labels.filter(label=>label===id).length));
  const online = [...incoming], onlineMass = [...mass], onlineLabels = [];
  rows.forEach(row => { const id=closest([row],online.map(value=>[value])).label; onlineLabels.push(id); online[id] += (row-online[id])/(onlineMass[id]+1); onlineMass[id]++; });
  return { rows, labels, centers, masses: [2,2], online, onlineMass, onlineLabels };
}
export function softRule(query, sigma, ratio) {
  const distances = [query**2,(query-2)**2], minimum=Math.min(...distances);
  const logits = distances.map((distance,i) => Math.log(i===0?ratio:1) - ((distance-minimum)/sigma)/sigma/2);
  const maximum=Math.max(...logits), weights=logits.map(value=>Math.exp(value-maximum)), total=sum(weights);
  return { distances, logits, weights, responsibilities:weights.map(value=>value/total) };
}
/** Reassign to rounded byte entries. The retained palette helper's pre-byte
 * memberships stay historical; the accepted current live operation requires
 * closest stored entries, so this successor performs that explicit pass. */
export function bytePalette(count,imageId) {
  const fitted=retained.quantizePalette(count,imageId);
  const assigned=fitted.image.pixels.map(row=>closest(row,fitted.roundedCenters).label);
  const decoded=assigned.map(id=>fitted.roundedCenters[id]);
  const storedSSE=sum(fitted.image.pixels.map((row,i)=>squared(row,decoded[i])));
  const width=(count-1).toString(2).length-(count===1?1:0);
  return { ...fitted, assigned, decoded, storedSSE, floatingSSE:fitted.sse, width,
    bitstream:width===0?'':assigned.map(id=>id.toString(2).padStart(width,'0')).join(''),
    bits:24*count+fitted.image.pixels.length*width };
}

/** Stable centered summary; raw LS/SS are exposed separately as the CF's
 * additive textbook fields, not used for the cancellation-sensitive M2. */
export function cfSummary(rows) {
  let count=0,center=null,m2=0;
  for(const value of rows){count++;const delta=center===null?0:value-center;center=center===null?value:center+delta/count;m2+=delta*(value-center);}
  return {count,center,m2,ls:sum(rows),ss:sum(rows.map(value=>value*value)),radius:count?Math.sqrt(Math.max(m2,0)/count):null,members:[...rows]};
}
export function mergeCF(left,right){
 if(!left.count)return {...right};if(!right.count)return {...left};
 const count=left.count+right.count,delta=right.center-left.center,center=left.center+delta*right.count/count,m2=left.m2+right.m2+delta*delta*left.count*right.count/count;
 return {count,center,m2,ls:left.ls+right.ls,ss:left.ss+right.ss,radius:Math.sqrt(Math.max(m2,0)/count),members:[...left.members,...right.members]};
}
/** Only the four stated arrivals are this teaching tree's domain. The actual
 * insertion and farthest-entry split are computed, rather than painted as
 * a fixed successful tree for arbitrary input. */
export function cfTreeWitness(prefix,stage='parent repair'){
 const arrivals=[0,2,5,9],entries=[],steps=[];
 for(const value of arrivals.slice(0,prefix)){
  const incoming=cfSummary([value]);
  const nearest=entries.length?entries.reduce((best,entry,i)=>Math.abs(value-entry.center)<Math.abs(value-entries[best].center)?i:best,0):null;
  const hypothetical=nearest===null?incoming:mergeCF(entries[nearest],incoming);
  const absorb=nearest!==null&&hypothetical.radius<=1;
  if(absorb)entries[nearest]=hypothetical;else entries.push(incoming);
  steps.push({value,nearest,hypothetical,absorb,entries:entries.map(entry=>({...entry,members:[...entry.members]}))});
 }
 const total=cfSummary(arrivals.slice(0,prefix)),overflow=entries.length>2;
 if(!overflow)return {arrivals:arrivals.slice(0,prefix),entries,total,steps,overflow,leaves:[entries],parent:total,leafPointers:[{id:'L0',previous:null,next:null}],parentPointers:[]};
 let first=0,second=1,best=-1;
 for(let a=0;a<entries.length;a++)for(let b=a+1;b<entries.length;b++){const distance=(entries[a].center-entries[b].center)**2;if(distance>best){first=a;second=b;best=distance;}}
 const leaves=[[],[]],assignments=entries.map((entry,i)=>{const distances=[(entry.center-entries[first].center)**2,(entry.center-entries[second].center)**2],label=distances[1]<distances[0]?1:0;leaves[label].push(entry);return{i,distances,label};});
 const children=leaves.map(leaf=>leaf.reduce(mergeCF,cfSummary([])));
 const materialized=['redistribution','parent repair'].includes(stage);
 return {arrivals:arrivals.slice(0,prefix),entries,total,steps,overflow,seeds:[first,second],seedDistanceSquared:best,leaves:materialized?leaves:[entries],assignments,children,parent:stage==='parent repair'?children.reduce(mergeCF,cfSummary([])):null,leafPointers:materialized?[{id:'L0',previous:null,next:'L1'},{id:'L1',previous:'L0',next:null}]:[{id:'L0',previous:null,next:null}],parentPointers:stage==='parent repair'?['L0','L1']:[],stage};
}

export function angularPoint(degrees){
 const angle=((degrees%360)+360)%360;
 if(angle===0)return [1,0];if(angle===90)return [0,1];if(angle===180)return [-1,0];if(angle===270)return [0,-1];
 return [Math.cos(degrees*Math.PI/180),Math.sin(degrees*Math.PI/180)];
}
export function sphericalWitness(memberAngle,queryAngle){
 const rows=[[1,0],angularPoint(memberAngle)],ordinaryA=mean(rows),norm=Math.hypot(...ordinaryA),sphericalA=norm<1e-12?[1,0]:ordinaryA.map(value=>value/norm),q=angularPoint(queryAngle),b=[1,0];
 const distances=[squared(q,ordinaryA),squared(q,b)],cosines=[sum(q.map((value,i)=>value*sphericalA[i])),q[0]];
 return {rows,ordinaryA,norm,sphericalA,q,b,distances,cosines,ordinaryChoice:distances[1]<distances[0]?1:0,sphericalChoice:cosines[1]>cosines[0]?1:0,zeroNorm:norm<1e-12};
}
