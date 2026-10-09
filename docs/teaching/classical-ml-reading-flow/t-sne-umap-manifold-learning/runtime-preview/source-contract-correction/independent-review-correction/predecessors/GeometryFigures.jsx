import React from 'react';
import { Drawing, Plot, Line, Matrix, Bars, Table, Digit, hues, number } from './ManifoldDrawing.jsx';
import { GraphView, SavedMapView, RecipeView, EnergyView } from './ManifoldInvestigations.jsx';
import { ids, uPoints, radiusGraph, shortestPath, fixedP, studentState, initialY } from './manifold-models.mjs';
import { digitRows, savedLayouts, layoutNames, sourceRow, sourceIdScores } from './manifold-data.js';
import { DimensionedArray, DirectedLine, IdentityRulers, RankLadders, EncoderLayers, LengthResidual, FilledTetrahedron, RecordTrace, AffineOffsets, MappedExtrapolation } from './ManifoldObjects.jsx';
import { sheetPoint, sheetTangents, orthographic, residualObjects, recipeObjects, patchObjects, ripsSquare } from './manifold-geometry.mjs';
export function RecordAnatomy() {
  const row = sourceRow(30);
  return <Drawing caption="One real observation retains source ID30 through all64 measured cells and its two jointly chosen map coordinates.">
  <RecordTrace row={row} mapped={savedLayouts.pca.coordinates[digitRows.findIndex(r => r[0] === 30)]} />
  <Table caption="All64 features of source30: raw and normalized" headers={['feature a', 'row,col', 'count', 'count/16']} rows={row.slice(2).map((v, i) => [i, `${Math.floor(i / 8)},${i % 8}`, v, number(v / 16)])} />
</Drawing>;
}
export function FirstNeighborhood() {
  return <SavedMapView sourceId={30} k={10} layout="pca" />;
}
export function ProjectionVersusLayout() {
  return <Drawing caption="Constructed A/B/C: a shared linear ruler versus coordinates jointly chosen to keep graph relations.">
  <Plot points={[{
      x: -2,
      y: 0,
      id: 'A'
    }, {
      x: 0,
      y: 1,
      id: 'B'
    }, {
      x: 2,
      y: 0,
      id: 'C'
    }, {
      x: 0,
      y: 1 / 3,
      id: 'mean',
      color: '#fff'
    }]} arrows={[[-2, 0, -2, 1 / 3], [0, 1, 0, 1 / 3], [2, 0, 2, 1 / 3]]} caption="Perpendicular feet onto horizontal PCA ruler y=1/3" domain={[-3, 3, -2, 2]}>
    {({
        x,
        y
      }) => <><line x1={x(-3)} x2={x(3)} y1={y(1 / 3)} y2={y(1 / 3)} stroke={hues[1]} /><line x1={x(0)} x2={x(0)} y1={y(-2)} y2={y(2)} stroke={hues[2]} /></>}
  </Plot>
  <Plot points={[{
      x: -1,
      y: .4,
      id: 'A'
    }, {
      x: 0,
      y: -.7,
      id: 'B'
    }, {
      x: 1,
      y: .5,
      id: 'C'
    }]} edges={[[0, 1], [1, 2]]} caption="Constructed joint graph layout; no projection ruler or supplied inverse" />
  <Table caption="Whitening changes the ruler" headers={['candidate', 'ordinary distance', 'whitened distance, λ=(9,1)']} rows={[['B=(2,0)', 2, '2/3 (now nearer)'], ['C=(0,1)', '1 (nearer)', 1], ['zero retained eigenvalue', '—', 'division undefined: choose policy']]} />
</Drawing>;
}
export function RolledSheet() {
  const grid = Array.from({
    length: 37
  }, (_, i) => 3 * Math.PI * i / 36);
  const points = grid.flatMap(u => [-1, 0, 1].map(v => {
    const [x, y] = orthographic(sheetPoint(u, v));
    return {
      x,
      y,
      label: false
    };
  }));
  const edges = grid.flatMap((_, i) => [0, 1, 2].flatMap(j => [...(i < grid.length - 1 ? [[i * 3 + j, (i + 1) * 3 + j]] : []), ...(j < 2 ? [[i * 3 + j, i * 3 + j + 1]] : [])]));
  const endpoints = [orthographic(sheetPoint(Math.PI, 0)), orthographic(sheetPoint(3 * Math.PI, 0))];
  const tangents = sheetTangents(Math.PI).map(orthographic);
  const patch = [11 * 3, 13 * 3, 13 * 3 + 2, 11 * 3 + 2].map(i => points[i]);
  return <Drawing caption="Declared rolled sheet F(u,v); orthographic display is schematic, not a planar distance measurement.">
  <Plot points={[...points, ...endpoints.map(([x, y], i) => ({
      x,
      y,
      id: i ? '3π' : 'π',
      selected: true
    }))]} edges={[...edges, [points.length, points.length + 1, 0, 'missing']]} path={Array.from({
      length: 25
    }, (_, i) => (i + 12) * 3 + 1)} arrows={tangents.map(([dx, dy], i) => [endpoints[0][0], endpoints[0][1], endpoints[0][0] + .4 * dx, endpoints[0][1] + .4 * dy, hues[i + 1]])} caption="Ambient3: amber surface route, dashed through-air chord, blue/pink local tangent arrows">
    {({
        x,
        y
      }) => <polygon points={patch.map(p => `${x(p.x)},${y(p.y)}`).join(' ')} fill={hues[1]} fillOpacity=".2" stroke={hues[1]} strokeWidth="2" />}
  </Plot>
  <Plot points={[{
      x: Math.PI,
      y: 0,
      id: 'patch'
    }, {
      x: Math.PI + .4,
      y: 0,
      id: 'u'
    }, {
      x: Math.PI,
      y: .4,
      id: 'v'
    }]} arrows={[[Math.PI, 0, Math.PI + .4, 0, hues[1]], [Math.PI, 0, Math.PI, .4, hues[2]]]} domain={[Math.PI - .7, Math.PI + .7, -1.25, 1.25]} caption="Intrinsic2 local(u,v) patch with tangent directions">
    {({
        x,
        y
      }) => <rect x={x(Math.PI - Math.PI / 12)} y={y(1)} width={x(Math.PI + Math.PI / 12) - x(Math.PI - Math.PI / 12)} height={y(-1) - y(1)} stroke={hues[1]} fill="none" />}
  </Plot>
  <Table caption="Joined sheet and patch coordinates" headers={['selected point', 'u,v', 'ambient x,y,z']} rows={[['first turn', 'π,0', sheetPoint(Math.PI, 0).map(v => number(v)).join(', ')], ['next turn', '3π,0', sheetPoint(3 * Math.PI, 0).map(v => number(v)).join(', ')], ['highlighted patch', 'u=π±π/12,v∈[−1,1]', 'two local tangent directions; not global isometry']]} />
</Drawing>;
}
export function UGraphRelaxation() {
  return <GraphView traceCount={3} showRouteAnnotations />;
}
export function ConnectivityShortcuts() {
  return <><div className="manifold-sequence">
  {[.75, 1, 1.5, 2].map(radius => <GraphView key={radius} radius={radius} />)}
</div><Drawing caption="Separate constructed noisy bridge: this point is never inserted into the seven-node source.">
  <Plot points={[{
        x: 0,
        y: 0,
        id: 'left'
      }, {
        x: .9,
        y: 0,
        id: 'noise'
      }, {
        x: 1.8,
        y: 0,
        id: 'right'
      }]} edges={[[0, 1], [1, 2]]} caption="Radius1 can connect through a spurious observation" />
</Drawing></>;
}
export function PreservationQuestions() {
  const q = studentState(initialY).q[0][1];
  return <div className="manifold-sequence">
  <Drawing caption="PCA carries shared linear readings; the perpendicular foot supplies the coordinate.">
    <Plot points={[{
        x: 0,
        y: 1,
        id: 'A'
      }, {
        x: 0,
        y: 0,
        id: 'foot'
      }]} arrows={[[0, 1, 0, 0]]} caption="Projection onto horizontal ruler">
      {({
          x,
          y
        }) => <line x1={x(-.5)} x2={x(.5)} y1={y(0)} y2={y(0)} stroke={hues[1]} strokeWidth="2" />}
    </Plot>
  </Drawing>
  <p>PCA reads the same horizontal ruler for every row: A's perpendicular foot has coordinate0. The shared linear ruler is the carried object.</p>
  <Drawing caption="MDS carries pair distances into a centered Gram product.">
    <Line values={[0, 2, 5]} labels={['A', 'B', 'C']} caption="AB2,BC3,AC5 → centered AB product7/9" />
  </Drawing>
  <p>MDS starts with measured pair lengths2,3,5. Squaring and centering gives the AB product7/9; pair geometry supplies the centered Gram object.</p>
  <Drawing caption="Isomap carries a weighted route length, not the through-air chord.">
    <Plot points={uPoints.map(([x, y], i) => ({
        x,
        y,
        id: ids[i]
      }))} edges={radiusGraph().edges} path={[0, 1, 2, 3, 4, 5, 6]} caption="A→G graph route6" />
  </Drawing>
  <p>Isomap sums six admitted unit edges from A to G. The carried distance is6 along this weighted route, while the through-air AG chord is2.</p>
  <Drawing caption="LLE carries a local affine recipe with weights summing1.">
    <Line values={[0, 2, 6]} labels={['L(2/3)', 'i', 'R(1/3)']} caption="Mapped recipe:0·2/3+6·1/3=2" />
  </Drawing>
  <p>LLE carries weights2/3 and1/3, whose sum is1. Applying the same affine recipe to mapped endpoints0 and6 reconstructs query2.</p>
  <Drawing caption="t-SNE carries an ordered joint pair probability into a globally normalized Student map.">
    <Plot points={[{
        x: 0,
        y: 0,
        id: 'A'
      }, {
        x: 1,
        y: 0,
        id: 'B'
      }]} caption="Input pair: actual fixed P_AB=P_BA=.157500626245">
      {({
          x,
          y
        }) => <><line x1={x(0)} x2={x(1)} y1={y(0)} y2={y(0)} stroke={hues[1]} strokeWidth={2 + 20 * fixedP[0][1]} /><text x={x(.5)} y={y(0) + 28} textAnchor="middle">P_AB {number(fixedP[0][1])}</text></>}
    </Plot>
    <Plot points={initialY.map((x, i) => ({
        x,
        y: 0,
        id: ids[i]
      }))} caption="Map pair AB shares the denominator with all six unordered pairs">
      {({
          x,
          y
        }) => <><line x1={x(initialY[0])} x2={x(initialY[1])} y1={y(0)} y2={y(0)} stroke={hues[2]} strokeWidth={2 + 20 * q} /><text x={x(-1)} y={y(0) + 28} textAnchor="middle">Q_AB {number(q)}</text></>}
    </Plot>
  </Drawing>
  <p>t-SNE keeps the ordered target mass P_AB fixed and changes the normalized Student mass Q_AB. Both highlighted widths use2+20 times their mass; the map denominator includes every off-diagonal pair.</p>
  <Drawing caption="UMAP carries directed local support into a fuzzy union and map membership.">
    <Plot points={[{
        x: 0,
        y: 0,
        id: 'i'
      }, {
        x: 2,
        y: 0,
        id: 'j'
      }]} arrows={[[0, .2, 2, .2, hues[1]], [2, -.2, 0, -.2, hues[2]]]} caption="Input distance2; opposite row strengths .5/.25" />
    <Plot points={[{
        x: 0,
        y: 0,
        id: 'i'
      }, {
        x: 1,
        y: 0,
        id: 'j'
      }]} caption="Map separation1: teaching membership ν=.5">
      {({
          x,
          y
        }) => <><line x1={x(0)} x2={x(1)} y1={y(0)} y2={y(0)} stroke={hues[0]} strokeWidth="7" /><text x={x(.5)} y={y(0) + 28} textAnchor="middle">target union .625; ν .5</text></>}
    </Plot>
  </Drawing>
  <p>UMAP combines directed strengths .5 and .25 into union .625. For the declared a=b=1 map curve, separation1 gives membership .5; the input edge and map edge are different objects.</p>
</div>;
}
export function DirectedNeighbors() {
  return <Drawing caption="Complete directed k1 neighborhoods on exact coordinate rulers; every ID remains joined across the two states.">
  <DirectedLine values={[0, 1, 3, 7]} labels={['A', 'B', 'C', 'D']} targets={[1, 0, 1, 2]} caption="Input line: A→B,B→A,C→B,D→C" />
  <DirectedLine values={[0, 5, 1, 11]} labels={['A', 'B', 'C', 'D']} targets={[2, 2, 0, 1]} caption="Map line: A→C,B→C,C→A,D→B" />
  <IdentityRulers input={[0, 1, 3, 7]} mapped={[0, 5, 1, 11]} labels={['A', 'B', 'C', 'D']} />
  <Table caption="Every directed edge and rank penalty" headers={['query', 'input edge length', 'map edge length', 'intruder input rank', 'omission map rank']} rows={[['A', 'AB1', 'AC1', 2, 2], ['B', 'BA1', 'BC4', 2, 2], ['C', 'CB2', 'CA1', 2, 2], ['D', 'DC4', 'DB6', 2, 2]]} />
  <p>All four selected input neighbors disappear, so R1=0. Every intrusion and omission has rank2 in the opposite geometry; T1=C1=.5 for this fixture.</p>
</Drawing>;
}
export function RankBeforeScore() {
  return <Drawing caption="Separate rank ladders establish the penalties before any collection score.">
  <RankLadders />
  <Table caption="All four query contributions" headers={['query', 'common count', 'intrusion penalty', 'omission penalty']} rows={[['A', 0, '2−1=1', '2−1=1'], ['B', 0, '2−1=1', '2−1=1'], ['C', 0, '2−1=1', '2−1=1'], ['D', 0, '2−1=1', '2−1=1']]} />
  <Table caption="Complete normalization and domains" headers={['object', 'calculation']} rows={[['retention', '0 common/4 =0'], ['T1', '1−[2/(4·1·(8−3−1))]·4=.5'], ['C1', 'reverse ranks, same fixture result .5'], ['rank-penalty normalizer', '2/[n k(2n−3k−1)]=1/8 for n4,k1'], ['valid domain', '1≤k<n/2; exclude self; ties by source ID'], ['historical T/C', 'original library sorting/numerical convention retained separately']]} />
</Drawing>;
}
export function SavedLayoutsScores() {
  return <><Drawing caption="Actual representative saved two-coordinate maps; within each map both axis scales match. Across-map coordinate distances have no physical meaning.">
  {['pca', 'tsne-p30-s7', 'umap-n15-d01-s7'].map(name => <Plot key={name} points={savedLayouts[name].coordinates.map(([x, y], i) => ({
        x,
        y,
        id: digitRows[i][0],
        label: false,
        color: '#9a9fa8'
      }))} caption={name} />)}
</Drawing><Table caption="All90 historical scores:10 maps ×3 scales ×3 metrics" headers={['saved map', 'k', 'R', 'T', 'C']} rows={layoutNames.flatMap(name => [5, 10, 20].map(k => {
      const m = savedLayouts[name].metrics[k];
      return [name, k, number(m.retention, 9), number(m.trustworthiness, 9), number(m.continuity, 9)];
    }))} /><Table caption="Separate recorded source-ID convention: three already-executed k10 collection audits" headers={['saved map', 'k', 'R', 'T', 'C']} rows={Object.entries(sourceIdScores).map(([name, m]) => [name, m.k, String(m.retention), String(m.trustworthiness), String(m.continuity)])} /><p>These three source-ID collection audits reuse the retained saved-array stream. Other map/scale combinations have historical collection scores above and live local neighbor lists; no additional collection campaign is claimed.</p></>;
}
export function LocalReversal() {
  return <><SavedMapView sourceId={30} layout="pca" /><SavedMapView sourceId={30} layout="tsne-p30-s7" /></>;
}
export function SeedNullAndChange() {
  return <><Drawing caption="PCA-initialized seed7/19 views coincide exactly for all three perplexities; no jitter is added.">
  {[5, 30, 80].map(p => <div key={p}>
    <Plot points={savedLayouts[`tsne-p${p}-s7`].coordinates.map(([x, y], i) => ({
          x,
          y,
          id: digitRows[i][0],
          label: false,
          color: hues[1]
        }))} caption={`p${p}: seed7 = seed19, exact saved coordinate equality`} />
    <p>seed7/seed19 equality: {String(JSON.stringify(savedLayouts[`tsne-p${p}-s7`].coordinates) === JSON.stringify(savedLayouts[`tsne-p${p}-s19`].coordinates))}</p>
  </div>)}
</Drawing><Drawing caption="The actual random-initialized p30 pair changes; collection R10=.772000/.769667.">
  {[7, 19].map(seed => <Plot key={seed} points={savedLayouts[`tsne-p30-random-s${seed}`].coordinates.map(([x, y], i) => ({
        x,
        y,
        id: digitRows[i][0],
        label: false,
        color: hues[seed === 7 ? 1 : 2]
      }))} caption={`Random initialization, seed${seed}`} />)}
</Drawing></>;
}
export function TrainOnlyState() {
  return <Drawing caption="The300 measured rows split225/75 before fitting. Numeric fitted parameters and split IDs were not retained; these are dimensioned symbolic objects.">
  <DimensionedArray name="X_train" rows={225} columns={64} entries={[['x₁₁', 'x₁₂', 'x₁₃', '…'], ['x₂₁', 'x₂₂', 'x₂₃', '…']]} caption="Training measurements: the only rows that fit the reducer and classifier" />
  <DimensionedArray name="X_valid" rows={75} columns={64} entries={[['xᵥ₁₁', 'xᵥ₁₂', 'xᵥ₁₃', '…'], ['xᵥ₂₁', 'xᵥ₂₂', 'xᵥ₂₃', '…']]} caption="Held-out measurements: transformed with fixed training state" />
  <DimensionedArray name="μ_train" rows={1} columns={64} entries={[['μ₁', 'μ₂', 'μ₃', '…']]} caption="PCA fitted mean, learned only from225 training rows" />
  <DimensionedArray name="V_train" rows={64} columns={10} entries={[['v₁₁', 'v₁₂', 'v₁₃', '…'], ['v₂₁', 'v₂₂', 'v₂₃', '…']]} caption="One fixed PCA projection operator for both splits: Z=(X−μ_train)V_train" />
  <DimensionedArray name="Z_train" rows={225} columns={10} entries={[['z₁₁', 'z₁₂', 'z₁₃', '…'], ['z₂₁', 'z₂₂', 'z₂₃', '…']]} caption="Training coordinates in the fitted ten-coordinate system" />
  <DimensionedArray name="Z_valid" rows={75} columns={10} entries={[['zᵥ₁₁', 'zᵥ₁₂', 'zᵥ₁₃', '…'], ['zᵥ₂₁', 'zᵥ₂₂', 'zᵥ₂₃', '…']]} caption="Validation coordinates in the same fitted system; no validation reducer is fitted" />
  <DimensionedArray name="UMAP reference" rows={225} columns={10} entries={[['y₁₁', 'y₁₂', 'y₁₃', '…'], ['y₂₁', 'y₂₂', 'y₂₃', '…']]} caption="UMAP fixed training reference plus its225×64 input records defines future placement" />
  <DimensionedArray name="One held-out row x_valid,r" rows={1} columns={64} entries={[['xᵣ₁', 'xᵣ₂', 'xᵣ₃', '…']]} caption="One symbolic validation observation follows the fixed transform into a1×10 representation" />
  <Plot points={[{
      x: 0,
      y: 0,
      id: 'query r'
    }, {
      x: -1,
      y: 1,
      id: 'T₁'
    }, {
      x: 1,
      y: 1,
      id: 'T₂'
    }, {
      x: 1,
      y: -1,
      id: 'T₃'
    }, {
      x: -1,
      y: -1,
      id: 'T₄'
    }, {
      x: 0,
      y: 1.5,
      id: 'T₅'
    }]} edges={[[0, 1], [0, 2], [0, 3], [0, 4], [0, 5]]} caption="Schematic five training-neighbor support; labels and distances symbolic because individual predictions were not saved" />
  <p>Five-neighbor prediction reads the training labels y_T₁…y_T₅ and takes their majority. No label or prediction is invented for this symbolic held-out row; the measured collection counts follow.</p>
  <Bars values={[73, 73, 71]} labels={['pixels →5-NN', 'PCA10 →5-NN', 'UMAP10 →5-NN']} max={75} caption="Retained correct validation predictions out of75" />
  <p>Train5-NN on225 training representations; send75 transformed validation rows to that same classifier. Two-coordinate inspection is separate from these ten-coordinate prediction routes. Validation is separate from an untouched final test.</p>
</Drawing>;
}
export function FixedReferenceRoutes() {
  return <Drawing caption="A projection operator, a fixed reference and a trained neural function are distinct fitted objects.">
  <DimensionedArray name="PCA V_q" rows={64} columns={2} entries={[['v₁₁', 'v₁₂'], ['v₂₁', 'v₂₂'], ['v₃₁', 'v₃₂']]} caption="Projection route: subtract fitted mean64 from a new1×64 row, then multiply by this64×2 operator" />
  <Plot points={[{
      x: 0,
      y: 0,
      id: 'μ'
    }, {
      x: 1,
      y: 1,
      id: 'new x'
    }, {
      x: 1,
      y: 0,
      id: 'foot'
    }]} arrows={[[1, 1, 1, 0]]} domain={[-.5, 2.5, -.5, 2.5]} caption="Constructed projection foot onto a fitted horizontal ruler">
    {({
        x,
        y
      }) => <line x1={x(-.5)} x2={x(2.5)} y1={y(0)} y2={y(0)} stroke={hues[1]} strokeWidth="2" />}
  </Plot>
  <Plot points={[{
      x: 0,
      y: 0,
      id: 'L'
    }, {
      x: 1,
      y: 0,
      id: 'query'
    }, {
      x: 3,
      y: 0,
      id: 'R'
    }]} arrows={[[1, .2, 0, .2, hues[1]], [1, -.2, 3, -.2, hues[2]]]} caption="Reference input0/3; query1 searches both fixed neighbors" />
  <Line values={[0, 2, 6]} labels={['fixed L', 'query', 'fixed R']} caption="Fixed reference map0/6: weights2/3,1/3 initialize query at2" />
  <EncoderLayers />
  <Table caption="Operations and API branches" headers={['route', 'state / boundary']} rows={[['ordinary UMAP', 'search input neighbors→query memberships→reference-weighted initialization→optimize query against fixed reference'], ['openTSNE', 'fit→reference embedding→transform future; new points do not interact with each other'], ['supervised UMAP', 'training labels enter and alter the training graph'], ['parametric UMAP', 'fit neural weights, then evaluate a learned function on a new row'], ['sklearn TSNE', 'no general transform method'], ['densMAP', 'training-cache return differs from unsupported new-row transform']]} />
</Drawing>;
}
export function AllocationObjects() {
  return <Drawing caption="Allocation counts in decimal bytes, before additional arrays; no measured timing/process-memory claim.">
  <div className="manifold-allocation">
    <div>
      <span>Exact row buffer</span>
      <div className="manifold-buffer">d_i0 | d_i1 | … | d_i,n−1</div>
      <span>n scalars:O(n) workspace</span>
    </div>
    <div>
      <span>Full pair matrix</span>
      <div className="manifold-matrix-stripes">
        n columns
        <br />
        d_00 … d_0,n−1
        <br />
        ⋮
        <br />
        d_n−1,0 … d_n−1,n−1
      </div>
      <span>n rows:8n² bytes</span>
    </div>
    <div>
      <span>Sparse graph</span>
      <div className="manifold-buffer">
        (sourceID,neighborID,weight)
        <br />
        n×k edges
      </div>
      <span>O(nk), before later dense operations</span>
    </div>
    <div className="manifold-scene">
      <svg viewBox="0 0 360 230" role="img" aria-label="Avoided n by n by D offset tensor: stacked feature planes, dashed because this workspace is not allocated by the row-wise audit">
        {[36, 18, 0].map(offset => <g key={offset}>
          <rect x={50 + offset} y={65 - offset} width="220" height="110" fill="none" stroke={hues[2]} strokeDasharray="5 4" />
          <path d={`M${50 + offset} ${100 - offset} h220 M${120 + offset} ${65 - offset} v110 M${195 + offset} ${65 - offset} v110`} fill="none" stroke="#777" strokeDasharray="3 4" />
        </g>)}
        <path d="M50 185 v8 h220 v-8 M38 65 h-8 v110 h8 M280 65 l36 -36" fill="none" stroke={hues[0]} />
        <text x="160" y="220" textAnchor="middle">n columns · n rows · D feature planes</text>
        <text x="328" y="29" textAnchor="middle">D</text>
        <text x="180" y="18" textAnchor="middle">Avoided offset tensor: 8n²D bytes</text>
      </svg>
      <p>Dashed planes denote the extra feature dimension avoided by a row-wise exact distance calculation. Input/output storage is retained separately; a sparse graph does not prevent later dense matrices.</p>
    </div>
  </div>
  <Table caption="One dense float64 matrix" headers={['n', 'bytes', 'decimal storage']} rows={[['10,000', '800,000,000', '800 MB'], ['100,000', '80,000,000,000', '80 GB'], ['500,000', '2,000,000,000,000', '2 TB'], ['offset tensor', '8n²D', 'extra feature dimension D avoided by row-wise audit']]} />
</Drawing>;
}
export function ApproximationTargets() {
  const pts = [[0, 0], [0, 1], [1, 0], [1, 1], [4, 4], [4, 5], [5, 4], [5, 5]];
  return <Drawing caption="Three different approximation targets: input neighbors, map tree forces and map grid convolution.">
  <Plot points={pts.map(([x, y], i) => ({
      x,
      y,
      id: `ID${i}`
    }))} edges={[[0, 1], [0, 2, 0, 'missing'], [0, 3, 0, 'new']]} caption="Constructed ANN proposal: missed0–2, false0–3" />
  <Plot points={pts.map(([x, y], i) => ({
      x,
      y,
      id: i
    }))} caption="True quadtree: root[0,8]² → [4,8]² → far[4,6]²; mass4, center(4.5,4.5)" domain={[-.5, 8.5, -.5, 8.5]}>
    {({
        x,
        y
      }) => <>{[[0, 0, 8], [0, 0, 4], [4, 0, 4], [0, 4, 4], [4, 4, 4], [4, 4, 2], [6, 4, 2], [4, 6, 2], [6, 6, 2]].map(([a, b, size], i) => <rect key={i} x={x(a)} y={y(b + size)} width={size * (x(1) - x(0))} height={size * (x(1) - x(0))} fill="none" stroke={i === 5 ? hues[0] : '#666'} />)}<circle cx={x(4.5)} cy={y(4.5)} r="7" stroke={hues[0]} fill="none" /><text x={x(0)} y={y(0) + 18}>query ID0</text><text x={x(5)} y={y(6) - 8} textAnchor="middle" fill={hues[0]}>mass4</text></>}
  </Plot>
  <Plot points={[{
      x: 4,
      y: 4,
      id: '.32'
    }, {
      x: 5,
      y: 4,
      id: '.08'
    }, {
      x: 4,
      y: 5,
      id: '.48'
    }, {
      x: 5,
      y: 5,
      id: '.12'
    }, {
      x: 4.2,
      y: 4.6,
      id: 'charge'
    }]} edges={[[4, 0], [4, 1], [4, 2], [4, 3]]} caption="Grid: charge(4.2,4.6) bilinear weights sum1" />
  <p>Grid charges → convolution of force-related quantities → interpolation back to query. PCA preprocessing changes representation; ANN changes graph proposals; tree/grid approximate map repulsion. Cells are spatial objects, not benchmark bars.</p>
</Drawing>;
}
export function CenteredGram() {
  const d = [[0, 2, 5], [2, 0, 3], [5, 3, 0]],
    b = [[49, 7, -56], [7, 1, -8], [-56, -8, 64]].map(r => r.map(v => v / 9));
  return <Drawing caption="Measurements precede double-centering; AB follows an actual table entry into a coordinate product.">
  <Line values={[0, 2, 5]} labels={['A', 'B', 'C']} caption="Pair lengths2,3,5" />
  <Matrix values={d.map(r => r.map(v => v * v))} labels={['A', 'B', 'C']} caption="Squared-distance table; row means29/3,13/3,34/3; grand76/9" />
  <Matrix values={b} labels={['A', 'B', 'C']} caption="B=−½JD²J:AB=−.5(4−29/3−13/3+76/9)=7/9" />
  <Line values={[-7 / 3, -1 / 3, 8 / 3]} labels={['A', 'B', 'C']} caption="Centered coordinates; product A·B=7/9" />
</Drawing>;
}
export function StrainStressDisparities() {
  const residual = residualObjects();
  return <Drawing caption="Gram-entry strain, length-residual stress and monotone disparities operate on different objects.">
  <Bars values={[38 / 3, 0, 0]} labels={['positive eigenvalue', 'zero mode', 'zero mode']} max={13} caption="Euclidean line Gram spectrum" />
  <Line values={[-7, -1, 8].map(v => v / Math.sqrt(114))} labels={['u_A', 'u_B', 'u_C']} caption="Actual retained unit eigenvector(−7,−1,8)/√114 before the stretch" />
  <Line values={[-7 / 3, -1 / 3, 8 / 3]} labels={['A', 'B', 'C']} caption="Stretch retained eigenvector by√(38/3) to recover the centered line" />
  <Matrix values={[[49 / 9, 7 / 9], [7 / 9, 1 / 9]]} labels={['A', 'B']} caption="Actual target Gram submatrix B from D34" />
  <Matrix values={[[1, 0], [0, 0]]} labels={['A', 'B']} caption="Constructed candidate YYᵀ for y_A=−1,y_B=0; no library fit" />
  <Table caption="One traced Gram-entry residual" headers={['target AB', 'candidate AB', 'residual', 'squared entry contribution']} rows={[[number(residual.targetGramAB), number(residual.mappedGramAB), number(residual.gramResidual), number(residual.gramSquared)]]} />
  <LengthResidual />
  <Plot points={[{
      x: 1,
      y: 1,
      id: 'd1→δ1'
    }, {
      x: 2,
      y: 3,
      id: 'd2→δ3'
    }, {
      x: 5,
      y: 4,
      id: 'd5→δ4'
    }]} edges={[[0, 1], [1, 2]]} caption="Constructed monotone disparities: horizontal dissimilarity d, vertical fitted disparity δ" />
  <Line values={[0, 1, 2]} labels={['A', 'B', 'C']} caption="AB1 and BC1 imply AC≤2; target AC3 is impossible" />
  <Line values={[4.5, 0, -5 / 6]} labels={['λ1', 'λ2', 'λ3']} caption="Non-Euclidean target Gram spectrum: the negative mode cannot have a real square-root stretch" />
  <Line values={[4.5, 0, 0]} labels={['λ1 kept', 'λ2 zero', 'λ3 clipped']} caption="Positive-mode approximation discards−5/6; it changes the requested distances" />
  <Table caption="Separate objective/API boundaries" headers={['object', 'operation / boundary']} rows={[['classical strain', 'sum every squared Gram residual ||B−YYᵀ||²_F'], ['metric stress', 'sum unordered squared length residuals(r_ij−d_ij)²'], ['Stress-1', 'sqrt(raw stress / declared squared-length sum)'], ['nonmetric', 'fit monotone disparities with separately declared normalization'], ['non-Euclidean spectrum', '4.5,0,−5/6; clipping changes the requested distances'], ['shared scratch/library start', '[−1,0,1]; ordinary estimator outputs unexecuted']]} />
  <Line values={[0, 0, 2]} labels={['A', 'B', 'C']} caption="Distinct coincident A/B: observed zero classical/metric; missing nonmetric API" />
</Drawing>;
}
export function RoutesBecomeCoordinates() {
  const matrix = uPoints.map((_, i) => shortestPath(radiusGraph().graph, i, 0).distance);
  return <Drawing caption="Only a complete finite route matrix enters scratch MDS. Infinity is a refusal, never zero.">
  <Matrix values={matrix} labels={ids} caption="Full radius1 route matrix d_ij=|i−j|" />
  <Line values={[-3, -2, -1, 0, 1, 2, 3]} labels={ids} caption="Centered1D coordinates; A/G separation6" />
  <Table caption="Changing the graph changes the coordinate question" headers={['radius', 'AG', 'next operation']} rows={[[1, 6, 'finite double-centering'], [1.5, '2+2√2', 'different route matrix'], [.75, '∞', 'refuse before MDS'], ['ordinary disconnected repair', 'modified graph', 'inspect repair; not scratch success']]} />
</Drawing>;
}
export function AffineRecipe() {
  return <><Drawing caption="Input offsets cancel with weights2/3,1/3. Negative weights deliberately extrapolate.">
  <AffineOffsets />
  <AffineOffsets extrapolate />
  <MappedExtrapolation />
</Drawing><RecipeView /></>;
}
export function LocalSolveAndCollapse() {
  const object = recipeObjects(),
    x = [0, 1, 3, 7],
    mean = 2.75;
  const normalized = x.map(v => (v - mean) / Math.sqrt(7.1875));
  return <Drawing caption="Numeric local ridge solve precedes a separate exact-affine global matrix example. Neither is a newly fitted ordinary LLE run.">
  <Matrix values={object.offsets} labels={['L', 'R']} columnLabels={['a0', 'a1']} caption="Z: neighbor−query offsets for input query1,neighbors0/3" />
  <Matrix values={object.gram} labels={['L', 'R']} caption="C=ZZᵀ; trace5, singular before ridge" />
  <Matrix values={object.regularized} labels={['L', 'R']} caption="C+.001·trace(C)I: diagonal ridge.005" />
  <Table caption="Complete local solve and normalization" headers={['neighbor', 'u from regularized Cu=1', 'w=u/(1ᵀu)']} rows={object.u.map((v, i) => [i ? 'R' : 'L', number(v, 9), number(object.weights[i], 9)])} />
  <p>The ridge weights slightly differ from exact affine2/3,1/3. Zero-trace coincident neighbors use the explicitly stated uniform fallback.</p>
  <Line values={x} labels={['A', 'B', 'C', 'D']} caption="Separate declared exact-affine line0,1,3,7 for sparse global correspondence" />
  <Matrix values={object.w} labels={['A', 'B', 'C', 'D']} caption="Complete W:two nonzero neighbor coefficients per row, diagonal0" />
  <Plot points={x.map((value, i) => ({
      x: value,
      y: 0,
      id: ['A', 'B', 'C', 'D'][i]
    }))} arrows={[[0, .2, 1, .2, hues[1]], [0, -.2, 3, -.2, hues[2]]]} caption="Sparse row A owns A→B coefficient1.5 and A→C coefficient−.5; its input reconstruction is1.5·1−.5·3=0" />
  <Matrix values={object.difference} labels={['A', 'B', 'C', 'D']} caption="I−W: each row forms its reconstruction residual" />
  <Matrix values={object.m} labels={['A', 'B', 'C', 'D']} caption="M=(I−W)ᵀ(I−W): every entry computed from the displayed difference" />
  <Line values={[0, 0, 0, 0]} labels={['A', 'B', 'C', 'D']} caption="Collapsed zero-cost map violates YᵀY/n=I" />
  <Line values={normalized} labels={['A', 'B', 'C', 'D']} caption="Same exact-affine line centered/scaled: mean0,covariance1 and zero reconstruction residual" />
  <Table caption="Global selection and original curved fixture" headers={['object', 'meaning']} rows={[['centered basis', 'QR of a nonredundant centered basis projects out the constant mode'], ['global eigen selection', 'lowest remaining modes of basisᵀ M basis under YᵀY/n=I'], ['disconnected/repeated zero modes', 'extra component ambiguity; not a unique global reconstruction'], ['retained curved five-point residuals', '.065553874,.000634876,.000608301,.001084197,.081670810'], ['costs', 'local Gram/solves and sparse W separate from the small dense global eigenproblem']]} />
</Drawing>;
}
export function GraphEnergy() {
  return <><EnergyView /><Drawing caption="Degree and normalization choose distinct eigenproblems; isolated vertices must precede division.">
  <Matrix values={[[0, 1, 0], [1, 0, 1], [0, 1, 0]]} labels={['A', 'B', 'C']} caption="Unit symmetric adjacency; degree(1,2,1)" />
  <Matrix values={[[1, -1, 0], [-1, 2, -1], [0, -1, 1]]} labels={['A', 'B', 'C']} caption="L=D−A; yᵀLy5, ordered edge sum10" />
  <Plot points={[{
        x: 0,
        y: 0,
        id: 'A'
      }, {
        x: 1,
        y: 0,
        id: 'B'
      }, {
        x: 3,
        y: 0,
        id: 'D'
      }, {
        x: 4,
        y: 0,
        id: 'E'
      }]} edges={[[0, 1], [2, 3]]} caption="Two components→two component-constant null modes" />
  <Table caption="Three conventions" headers={['matrix', 'eigenproblem / conversion']} rows={[['plain L', 'Lf=λf'], ['generalized', 'Lf=λD_g f'], ['symmetric normalized', 'D_g^−1/2 L D_g^−1/2; multiply vector by D_g^−1/2'], ['ordinary spectral', 'normalized convention; not equality of raw plain coordinates']]} />
</Drawing></>;
}
export function TangentPatch() {
  const patch = patchObjects();
  const display = ([u, v, z]) => ({
    x: u + .3 * v,
    y: z + .25 * v
  });
  return <Drawing caption="Actual five-point quadratic patch: every normal residual joins a measured point to the fitted z.16 tangent plane.">
  <Plot points={patch.points.map((p, i) => ({
      ...display(p),
      id: i
    }))} arrows={patch.points.map((p, i) => {
      const a = display(patch.projected[i]),
        b = display(p);
      return [a.x, a.y, b.x, b.y, hues[i]];
    }).concat([[0, .16, 1, .16, hues[1]], [0, .16, .3, .41, hues[2]]])} caption="Orthographic patch: normal residuals and two blue/pink tangent axes at mean z.16">
    {({
        x,
        y
      }) => <polygon points={[[-1, -1, .16], [-1, 1, .16], [1, 1, .16], [1, -1, .16]].map(p => {
        const d = display(p);
        return `${x(d.x)},${y(d.y)}`;
      }).join(' ')} fill={hues[1]} fillOpacity=".12" stroke={hues[1]} />}
  </Plot>
  <Table caption="Every patch row, projection and residual" headers={['ID', 'u,v,z', 'tangent projection z', 'normal residual']} rows={patch.points.map((p, i) => [i, p.map(v => number(v)).join(','), '.16', number(patch.residuals[i])])} />
  <Bars values={[2, 2, .17888543819998318]} labels={['σ1', 'σ2 (tie)', 'σ3']} max={2} caption="Economy singular values; tangent-axis orientation not unique" />
  <Table caption="Center shared coordinates before orthogonal alignment" headers={['patch', 'shared-coordinate mean']} rows={[['first', '(0,1/3)'], ['second', '(−1/3,0)']]} />
  <Plot points={patch.firstCentered.map(([x, y], i) => ({
      x,
      y,
      id: `shared${i}`
    }))} edges={[[0, 1], [1, 2], [0, 2]]} domain={[-1.5, 1.5, -1.5, 1.5]} caption="Constructed shared-ID overlap in centered patch1" />
  <Plot points={patch.secondCentered.map(([x, y], i) => ({
      x,
      y,
      id: `shared${i}`
    }))} edges={[[0, 1], [1, 2], [0, 2]]} domain={[-1.5, 1.5, -1.5, 1.5]} caption="Same shared IDs in centered patch2,rotated90°" />
  <Matrix values={patch.crossProduct} labels={['first x', 'first y']} columnLabels={['second x', 'second y']} caption="Centered firstᵀsecond cross-product; singular values2,2/3 expose two resolved directions" />
  <Plot points={patch.alignedCentered.map(([x, y], i) => ({
      x,
      y,
      id: `shared${i}`
    }))} edges={[[0, 1], [1, 2], [0, 2]]} domain={[-1.5, 1.5, -1.5, 1.5]} caption="Orthogonal90° inverse rotation restores centered shared coordinates" />
  <Line values={[.1, 0, .1]} labels={['h(−1)', 'h(0)', 'h(1)']} caption="Quadratic height stencil: (.1−2·0+.1)/1²=.2" />
  <Table caption="Tangent axes and distinct global variants" headers={['route', 'mechanism / boundary']} rows={[['local plane', 'two horizontal tangent axes span z=.16; compare projector under tied leading modes'], ['LTSA', 'align overlapping local tangent coordinates globally'], ['Hessian', 'second-order structure;q2 needs k>5'], ['modified LLE', 'multiple local weights'], ['ordinary variant source-only', 'supplied300 rows,q2,k8; five-row patch too small'], ['economy factors', 'Z m×D; axes D×q; no full D×D right completion'], ['rank/overlap failure', 'unresolved tangent direction or deficient shared directions remains ambiguous']]} />
</Drawing>;
}
export function DiffusionWalk() {
  const p = [[0, 1, 0], [.5, 0, .5], [0, 1, 0]];
  return <Drawing caption="Actual unit chain transition: one and two steps distribute probability; they are not shortest routes.">
  <Plot points={[{
      x: 0,
      y: 0,
      id: 'A'
    }, {
      x: 1,
      y: 0,
      id: 'B'
    }, {
      x: 2,
      y: 0,
      id: 'C'
    }]} arrows={[[0, .2, 1, .2], [1, -.2, 0, -.2], [1, .2, 2, .2], [2, -.2, 1, -.2]]} caption="A→B1,B→A/C.5,C→B1" />
  <Matrix values={p} labels={['A', 'B', 'C']} caption="P_walk: each row sums1" />
  {[[1, 0, 0], [0, 1, 0], [.5, 0, .5]].map((values, t) => <Bars key={t} values={values} labels={['A', 'B', 'C']} caption={`Start at A, time${t}`} />)}
  <Table caption="Time-weighted modes and periodicity" headers={['walk eigenvalue', 't0', 't1', 't2']} rows={[[1, 1, 1, 1], [0, 1, 0, 0], [-1, 1, -1, 1], ['stationary mode', 'removed from coordinate route', 'components remain separate', 'isolates separated'], ['lazy comparison', '(I+P)/2', 'changed transition', 'removes this alternation']]} />
</Drawing>;
}
export function FilledComplex() {
  const labels = ['A', 'B', 'C', 'D'];
  return <Drawing caption="The square loop lasts[1,√2); all triangles and the abstract tetrahedron are filled at√2.">
  {[.9, 1, Math.sqrt(2)].map((threshold, state) => {
      const complex = ripsSquare(threshold),
        points = complex.vertices.map(([x, y], i) => ({
          x,
          y,
          id: labels[i]
        }));
      return <Plot key={state} points={points} edges={complex.edges} caption={['ε<1:four isolated vertices', '1≤ε<√2:unfilled side loop', 'ε=√2:all diagonals and four filled triangular faces'][state]}>
    {({
          x,
          y
        }) => complex.faces.map((face, i) => <polygon key={i} points={face.map(j => `${x(points[j].x)},${y(points[j].y)}`).join(' ')} fill={hues[i + 1]} fillOpacity=".14" stroke={hues[i + 1]} strokeWidth="1" />)}
  </Plot>;
    })}
  <FilledTetrahedron />
  <Line values={[0, 1, Math.sqrt(2), 1.8]} labels={['0', 'loop born1', 'filled√2', 'ε']} caption="Actual threshold ruler: loop interval[1,√2)" />
  <Line values={[0, 1, 1, 0]} labels={labels} caption="Projection to first coordinate: A/D and B/C coincide,with genuine zero edges" />
  <Table caption="Distinct identity, geometry and topology" headers={['object', 'state']} rows={[['input square', 'A(0,0),B(1,0),C(1,1),D(0,1)'], ['at√2', 'all six edges,four filled triangle faces and the3-simplex; loop gone'], ['projection', 'two coincident ID pairs; original square-loop interval lost'], ['evidence', 'constructed linear projection; no topology software or nonlinear fit']]} />
</Drawing>;
}
export const geometryFigures = {
  D01: RecordAnatomy,
  D02: FirstNeighborhood,
  D03: ProjectionVersusLayout,
  D04: RolledSheet,
  D05: UGraphRelaxation,
  D06: ConnectivityShortcuts,
  D07: PreservationQuestions,
  D08: DirectedNeighbors,
  D09: RankBeforeScore,
  D27: SavedLayoutsScores,
  D28: LocalReversal,
  D29: SeedNullAndChange,
  D30: TrainOnlyState,
  D31: FixedReferenceRoutes,
  D32: AllocationObjects,
  D33: ApproximationTargets,
  D34: CenteredGram,
  D35: StrainStressDisparities,
  D36: RoutesBecomeCoordinates,
  D37: AffineRecipe,
  D38: LocalSolveAndCollapse,
  D39: GraphEnergy,
  D40: TangentPatch,
  D41: DiffusionWalk,
  D42: FilledComplex
};
