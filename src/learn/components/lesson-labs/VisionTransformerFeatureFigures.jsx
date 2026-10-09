import {flowNumber} from './LessonFlow.jsx';
import {VisionFlowCells,VisionFlowDrawing,VisionFlowWire,visionFlowColors as colors} from './VisionTransformerFlowFigures.jsx';

export function visionPCColor(coordinates, ranges) {
  return `rgb(${coordinates.map((value,index)=>Math.round(255*Math.max(0,Math.min(1,(value-ranges.training_min[index])/(ranges.training_max[index]-ranges.training_min[index]))))).join(',')})`;
}

export function VisionFeatureAtlasDrawing({ trace, mean, basis, ranges, selected, axis=0 }) {
  const slot=trace.order.indexOf(selected);
  const feature=trace.features[slot+1];
  const centered=feature.map((value,index)=>value-mean[index]);
  const rgb=visionPCColor(trace.patchPCA[slot],ranges).slice(4,-1).split(',').map(Number);
  const byOriginal=[];
  trace.order.forEach((original,index)=>{byOriginal[original]=trace.patchPCA[index];});
  return <VisionFlowDrawing width={340} height={1470} label={`Current original patch ${selected}, now at sequence slot ${slot+1}, is projected using the fixed training PCA mean and basis. Its actual three coordinates become RGB under fixed training ranges; the final four-by-four map is placed by original physical patch identity, including after a listing swap.`}>
    {arrowId=><>
      <text x="20" y="24">Original patch {selected}, sequence row {slot+1}</text>
      <VisionFlowCells x={20} y={79} rows={[feature.slice(0,3)]} cellWidth={96} label="Final feature: first 3 of 32" />
      <VisionFlowCells x={20} y={177} rows={[mean.slice(0,3)]} cellWidth={96} label="Fixed training mean: first 3 of 32" role="operation" />
      <VisionFlowWire path="M308 96 H324 V260 H203" arrowId={arrowId}/>
      <VisionFlowWire path="M164 211 V243" arrowId={arrowId}/>
      <rect x="125" y="243" width="78" height="34" fill="none" stroke={colors.operation}/>
      <text x="164" y="266" textAnchor="middle">− mean</text>
      <VisionFlowWire path="M164 277 H7 V344 H20" arrowId={arrowId}/>
      <VisionFlowCells x={20} y={327} rows={[centered.slice(0,3)]} cellWidth={96} label="Centered coordinates: 3 of 32" />
      <VisionFlowCells x={20} y={424} rows={basis.slice(0,3)} cellWidth={96} label="Fixed PCA basis: first 3 of 32 rows" role="operation" />
      <text x="20" y="563">Columns: PC1, PC2, PC3</text>
      <VisionFlowWire path="M308 344 H334 V632 H308" arrowId={arrowId}/>
      <VisionFlowWire path="M308 475 H332 V632 H308" arrowId={arrowId}/>
      <rect x="20" y="613" width="288" height="38" fill="none" stroke={colors.operation}/>
      <text x="164" y="638" textAnchor="middle">All 32 terms × each PCA column</text>
      <VisionFlowWire path="M164 651 H7 V721 H20" arrowId={arrowId}/>
      <VisionFlowCells x={20} y={704} rows={[trace.patchPCA[slot]]} cellWidth={96} label="Actual three PCA coordinates" />
      <rect x={20+axis*96} y="704" width="96" height="34" fill="none" stroke="white" strokeWidth="3"/>
      <VisionFlowCells x={20} y={805} rows={[ranges.training_min,ranges.training_max]} cellWidth={96} label="Fixed training minima, maxima" role="operation" />
      <VisionFlowWire path="M308 721 H324 V925 H308" arrowId={arrowId}/>
      <VisionFlowWire path="M164 873 V906" arrowId={arrowId}/>
      <rect x="20" y="906" width="288" height="38" fill="none" stroke={colors.operation}/>
      <text x="164" y="931" textAnchor="middle">Map to 0–255; clamp color only</text>
      <VisionFlowWire path="M164 944 H7 V1000 H20" arrowId={arrowId}/>
      <VisionFlowCells x={20} y={983} rows={[rgb]} cellWidth={96} label="Selected patch: red, green, blue"/>
      <VisionFlowWire path="M308 1000 H332 V1059 H308" arrowId={arrowId}/>
      <rect x="20" y="1042" width="288" height="34" fill="none" stroke={colors.operation}/>
      <text x="164" y="1065" textAnchor="middle">Place by original patch ID {selected}</text>
      <VisionFlowWire path="M164 1076 V1130" arrowId={arrowId}/>
      {byOriginal.map((coordinate,index)=><g key={index}>
        <rect x={62+index%4*54} y={1130+Math.floor(index/4)*54} width="54" height="54"
          fill={visionPCColor(coordinate,ranges)} stroke={selected===index?'white':colors.forward} strokeWidth={selected===index?3:1}/>
        <text x={89+index%4*54} y={1162+Math.floor(index/4)*54} textAnchor="middle" fill="white" stroke="#080808" strokeWidth=".5" paintOrder="stroke">{index}</text>
      </g>)}
      <text x="20" y="1390">White outline: original patch {selected}</text>
      <text x="20" y="1415">PC1→red; PC2→green; PC3→blue</text>
      <text x="20" y="1440">Color is an encoding, not a label.</text>
    </>}
  </VisionFlowDrawing>;
}

export function VisionCosineRetrievalDrawing({ query, candidates, similarities, top, queryID, targetLabel }) {
  const norm=row=>Math.hypot(...row);
  const qLength=norm(query),best=top[0];
  const qUnit=query.map(value=>value/qLength);
  const kLength=norm(candidates[best]);
  const kUnit=candidates[best].map(value=>value/kLength);
  return <VisionFlowDrawing width={340} height={1320} label={`Current query original patch ${queryID} is compared with all 16 patch vectors of ${targetLabel}. Both raw vectors are divided by their full 32 coordinate lengths before matching. The chosen best match's first 3 products and full cosine are shown; returning a maximum is not evidence that the match is meaningful.`}>
    {arrowId=><>
      <VisionFlowCells x={20} y={60} rows={[query.slice(0,3)]} cellWidth={96} label={`Query patch ${queryID}: 3 of 32`} />
      <VisionFlowWire path="M164 94 V143" arrowId={arrowId}/>
      <rect x="45" y="143" width="238" height="34" fill="none" stroke={colors.operation}/>
      <text x="164" y="166" textAnchor="middle">÷ full length {flowNumber(qLength,4)}</text>
      <VisionFlowWire path="M164 177 H7 V244 H20" arrowId={arrowId}/>
      <VisionFlowCells x={20} y={227} rows={[qUnit.slice(0,3)]} cellWidth={96} label="Unit query: 3 of 32" />
      <VisionFlowCells x={20} y={325} rows={[candidates[best].slice(0,3)]} cellWidth={96} label={`Candidate ${best}: raw 3 of 32`} />
      <VisionFlowWire path="M164 359 V408" arrowId={arrowId}/>
      <rect x="45" y="408" width="238" height="34" fill="none" stroke={colors.operation}/>
      <text x="164" y="431" textAnchor="middle">÷ full length {flowNumber(kLength,4)}</text>
      <VisionFlowWire path="M164 442 H7 V509 H20" arrowId={arrowId}/>
      <VisionFlowCells x={20} y={492} rows={[kUnit.slice(0,3)]} cellWidth={96} label="Unit candidate: 3 of 32" />
      <VisionFlowWire path="M308 244 H324 V590 H198" arrowId={arrowId}/>
      <VisionFlowWire path="M164 526 V573" arrowId={arrowId}/>
      <rect x="130" y="573" width="68" height="34" fill="none" stroke={colors.operation}/>
      <text x="164" y="596" textAnchor="middle">×</text>
      <VisionFlowWire path="M164 607 H324 V691 H308" arrowId={arrowId}/>
      <VisionFlowCells x={20} y={674} rows={[qUnit.slice(0,3).map((value,index)=>value*kUnit[index])]} cellWidth={96}
        label="First 3 of 32 coordinate products" />
      <VisionFlowWire path="M308 691 H332 V787 H284" arrowId={arrowId}/>
      <rect x="44" y="770" width="240" height="34" fill="none" stroke={colors.operation}/>
      <text x="164" y="793" textAnchor="middle">Σ all 32 products</text>
      <VisionFlowWire path="M164 804 H7 V877 H20" arrowId={arrowId}/>
      <VisionFlowCells x={20} y={860} rows={[[similarities[best]]]} cellWidth={96} label="Full cosine of this chosen pair"/>
      <VisionFlowCells x={20} y={976} rows={top.map(index=>[index,similarities[index]])} cellWidth={96}
        label="Top three original IDs and cosines" />
      <text x="20" y="1130">Candidate: {targetLabel}</text>
      <text x="20" y="1167">All 16 candidate scores follow.</text>
      <text x="20" y="1204">Test similarity on the actual task.</text>
    </>}
  </VisionFlowDrawing>;
}
