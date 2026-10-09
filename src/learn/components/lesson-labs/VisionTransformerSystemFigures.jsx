import { flowNumber } from './LessonFlow.jsx';
import { VisionFlowCells as Cells, VisionFlowDrawing as Drawing, VisionFlowWire as Wire, visionFlowColors as colors } from './VisionTransformerFlowFigures.jsx';

function Operation({y,children}) {
  return <g><rect x="40" y={y} width="260" height="38" fill="none" stroke={colors.operation}/>
    <text x="170" y={y+25} textAnchor="middle">{children}</text></g>;
}

// This is a shape cutaway, rather than fictitious numbers for a trained encoder.
export function VisionEncoderAnatomyDrawing() {
  const rows=(name,count=3)=>Array.from({length:count},(_,row)=>Array.from({length:3},(_,col)=>`${name}${row},${col}`));
  return <Drawing width={340} height={1590} label="The complete image-classification encoder: sixteen patch records and one learned class record, two pre-normalized attention/feed-forward blocks with both saved bypasses, final class normalization and ten class scores. Arrays are symbolic cutaways, with full dimensions named.">
    {id=><>
      <text x="20" y="24">8×8 image → sixteen 2×2 patches</text>
      <Cells x={20} y={75} rows={rows('e')} cellWidth={96} label="Patch vectors: 3 of 16 rows; 3 of 32"/>
      <Cells x={20} y={224} rows={[["c0","c1","c2"]]} cellWidth={96} label="Learned CLS: 3 of 32 coordinates" role="parameter"/>
      <Wire path="M164 177 H326 V302 H300" arrowId={id}/>
      <Wire path="M164 258 V283" arrowId={id}/>
      <Operation y={283}>Prepend CLS; add positions</Operation>
      <Wire path="M170 321 H7 V394 H20" arrowId={id}/>
      <Cells x={20} y={377} rows={rows('z')} cellWidth={96} label="17×32 workspace: 3×3 cutaway"/>
      <Wire path="M164 479 V527" arrowId={id}/>
      <Operation y={527}>Normalize all 32 coordinates</Operation>
      <Wire path="M170 565 V610" arrowId={id}/>
      <Operation y={610}>4 heads: each row reads 17</Operation>
      <Wire path="M170 648 H7 V725 H20" arrowId={id}/>
      <Cells x={20} y={708} rows={rows('a')} cellWidth={96} label="Mapped attention writes: 17×32"/>
      <Wire path="M164 810 V849" arrowId={id}/>
      <Wire path="M20 428 H7 V868 H153" arrowId={id}/>
      <circle cx="170" cy="868" r="17" fill="none" stroke={colors.operation}/><text x="170" y="873" textAnchor="middle">+</text>
      <text x="20" y="914">First saved input + attention write</text>
      <Wire path="M170 885 H7 V969 H40" arrowId={id}/>
      <Operation y={950}>LN; row-wise 32→64→32 FFN</Operation>
      <Wire path="M170 988 H7 V1061 H20" arrowId={id}/>
      <Cells x={20} y={1044} rows={rows('f')} cellWidth={96} label="Feed-forward writes: 17×32"/>
      <Wire path="M164 1146 V1181" arrowId={id}/>
      <Wire path="M170 885 H7 V1200 H153" arrowId={id}/>
      <circle cx="170" cy="1200" r="17" fill="none" stroke={colors.operation}/><text x="170" y="1205" textAnchor="middle">+</text>
      <text x="20" y="1245">Second saved input + FFN write</text>
      <Wire path="M170 1217 H326 V1287 H300" arrowId={id}/>
      <Operation y={1268}>Repeat block; final LN → CLS</Operation>
      <Wire path="M170 1306 H7 V1377 H20" arrowId={id}/>
      <Cells x={20} y={1360} rows={[["h0","h1","h2"]]} cellWidth={96} label="Final CLS: 3 of 32 coordinates"/>
      <Wire path="M164 1394 V1430" arrowId={id}/>
      <Operation y={1430}>10×32 map + ten biases</Operation>
      <Wire path="M170 1468 H7 V1537 H20" arrowId={id}/>
      <Cells x={20} y={1520} rows={[["ℓ0","ℓ1","ℓ2"]]} cellWidth={96} label="Class scores: 3 of 10"/>
    </>}
  </Drawing>;
}

export function VisionPositionResizeDrawing() {
  const grids=[{r:2,c:3,y:160,label:'Old patch-position grid: 2×3'}, {r:3,c:4,y:472,label:'New patch-position grid: 3×4'}];
  return <Drawing width={340} height={820} label="Rectangular spatial position vectors are reshaped into a two-by-three grid and interpolated into three-by-four. The two nonspatial prefix position vectors bypass interpolation unchanged. Each cell represents a complete vector, not a pixel value.">
    {id=><>
      <Cells x={20} y={65} rows={[["Prefix 0","Prefix 1"]]} cellWidth={142} label="Two prefix vectors: keep exactly" role="parameter"/>
      {grids.map(({r,c,y,label})=><g key={label}>
        <text x="20" y={y-20} fill={colors.parameter}>{label}</text>
        {Array.from({length:r},(_,row)=>Array.from({length:c},(_,column)=><g key={`${row}-${column}`}>
          <rect x={20+column*68} y={y+row*58} width="68" height="58" fill="#0a0a0a" stroke={colors.parameter}/>
          <text x={54+column*68} y={y+row*58+23} textAnchor="middle">p{row},{column}</text>
          <text x={54+column*68} y={y+row*58+45} textAnchor="middle">d coords</text>
        </g>))}
      </g>)}
      <Wire path="M122 276 V329" arrowId={id}/>
      <Operation y={329}>Bicubic grid interpolation</Operation>
      <Wire path="M170 367 H7 V501 H20" arrowId={id}/>
      <Wire path="M304 82 H326 V743 H300" arrowId={id}/>
      <Wire path="M156 646 V724" arrowId={id}/>
      <Operation y={724}>Join prefixes + flat grid</Operation>
      <text x="20" y="798">8×d rows become 14×d rows.</text>
    </>}
  </Drawing>;
}

export function visionOperationCounts(side=224,patch=16,width=768,blocks=12) {
  const patches=(side/patch)**2,sequence=patches+1;
  const qkvOutput=4*sequence*width**2,pair=2*sequence**2*width,ffn=8*sequence*width**2;
  const stem=patches*patch**2*3*width,head=width*1000;
  return {patches,sequence,qkvOutput,pair,ffn,stem,head,total:stem+blocks*(qkvOutput+pair+ffn)+head};
}

export function VisionOperationCountDrawing({side=224}) {
  const read=visionOperationCounts(side);
  const groups=[['Patch map (once)',read.stem],['Q/K/V + output (12 blocks)',12*read.qkvOutput],
    ['Two pair products (12 blocks)',12*read.pair],['FFN maps (12 blocks)',12*read.ffn],['Class map (once)',read.head]];
  const max=Math.max(...groups.map(([,value])=>value));
  return <Drawing width={340} height={740} label={`Exact dense-matmul counting at side ${side}, patch 16, width 768 and twelve blocks. Sequence ${read.sequence}. One multiply–accumulate is the unit; the bars are computed operation counts, not measured speed or memory.`}>
    {id=><>
      <text x="20" y="24">Input {side}×{side}, RGB; patch 16</text>
      <Cells x={20} y={78} rows={[[read.patches,read.sequence]]} cellWidth={142} label="Patch rows; rows including CLS" role="input"/>
      <Wire path="M162 112 V151" arrowId={id}/>
      <Operation y={151}>Count products for this shape</Operation>
      {groups.map(([label,value],index)=><g key={label}>
        <text x="20" y={233+index*83}>{label}</text>
        <rect x="20" y={245+index*83} width={Math.max(1,value/max*220)} height="18" fill={colors.computed}/>
        <text x="20" y={286+index*83}>{flowNumber(value/1e9,6)} billion MACs</text>
      </g>)}
      <text x="20" y="687">Total: {flowNumber(read.total/1e9,6)} billion MACs</text>
      <text x="20" y="714">No timing or accuracy is implied.</text>
    </>}
  </Drawing>;
}

export function VisionDistillationOwnershipDrawing() {
  return <Drawing width={340} height={1120} label="A supervised teacher and a student see the image. The student's class record learns the dataset label while its distillation record learns the teacher's detached decision. Both records communicate with image patches in the shared encoder. Teacher target and dataset label feed separate losses, not the image encoder inputs.">
    {id=><>
      <Cells x={20} y={65} rows={[["pixels"]]} cellWidth={136} label="Same image" role="input"/>
      <Wire path="M88 99 V146" arrowId={id}/>
      <Operation y={146}>Student patch projection</Operation>
      <Wire path="M170 184 H7 V257 H20" arrowId={id}/>
      <Cells x={20} y={240} rows={[["CLS","DIST","patches"]]} cellWidth={96} label="Two special rows + image rows"/>
      <Wire path="M164 274 V320" arrowId={id}/>
      <Operation y={320}>Shared student image encoder</Operation>
      <Wire path="M170 358 H7 V433 H20" arrowId={id}/>
      <Cells x={20} y={416} rows={[["hCLS","hDIST"]]} cellWidth={142} label="Final normalized special vectors"/>
      <Wire path="M91 450 V502" arrowId={id}/><Wire path="M233 450 V502" arrowId={id}/>
      <rect x="20" y="502" width="142" height="38" fill="none" stroke={colors.parameter}/><text x="91" y="527" textAnchor="middle">CLS map + bias</text>
      <rect x="174" y="502" width="142" height="38" fill="none" stroke={colors.parameter}/><text x="245" y="527" textAnchor="middle">DIST map + bias</text>
      <Wire path="M91 540 H7 V608 H20" arrowId={id}/><Wire path="M245 540 H333 V608 H304" arrowId={id}/>
      <Cells x={20} y={591} rows={[["ℓCLS","ℓDIST"]]} cellWidth={142} label="Two complete class-score vectors"/>
      <Wire path="M156 82 H328 V712 H300" arrowId={id}/>
      <Operation y={693}>Frozen teacher → label ŷ</Operation>
      <Cells x={20} y={783} rows={[["label y","teacher ŷ"]]} cellWidth={142} label="Two supervision targets" role="input"/>
      <Wire path="M91 625 H7 V885 H40" arrowId={id}/><Wire path="M233 625 H326 V938 H300" arrowId={id}/>
      <Wire path="M91 817 V866 H40" arrowId={id}/><Wire path="M233 817 V919 H300" arrowId={id}/>
      <Wire path="M170 731 H326 V800 H304" arrowId={id}/>
      <Operation y={866}>CE(CLS scores, dataset label)</Operation>
      <Operation y={919}>CE(DIST, teacher label)</Operation>
      <Wire path="M170 904 H7 V1026 H40" arrowId={id}/><Wire path="M170 957 V1007" arrowId={id}/>
      <Operation y={1007}>Half of each loss; add</Operation>
      <Wire path="M170 1007 H334 V339 H300" arrowId={id} color={colors.gradient} dashed/>
      <text x="20" y="1081" fill={colors.gradient}>Credit trains only the student.</text>
    </>}
  </Drawing>;
}
