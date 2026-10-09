import { MlaDrawing, MlaCells, MlaText, MlaArrow, MlaJunction, MlaNonlinearDrawing } from './LatentAttentionFlowFigures.jsx';
import { latentManualCase, latentOpeningDownMap } from '../../data/latent-attention-reading-fixtures.js';
import { matvec, multiply } from '../../data/latent-attention-models.js';

export function MlaScalarNonlinearDrawing(){
  const row={linearValues:[[-1],[1]],values:[[0],[1]],weights:[.5,.5]};
  return <MlaNonlinearDrawing read={{defined:true,heads:[row]}}/>;
}

export function MlaJointFactorDrawing() {
  const fixture=latentManualCase(), joint=[...fixture.keyUp.flat(),...fixture.valueUp.flat()], effective=multiply(joint,latentOpeningDownMap);
  return <MlaDrawing label="Stack the actual two heads' key and value maps into an eight-by-two map; its product with the two-by-three down-map has no more than two independent directions" width={880} height={840}>
    <MlaCells x={30} y={62} values={[1,0,2]} role="input" label="Original input x, three coordinates"/>
    <MlaCells x={440} y={62} values={latentOpeningDownMap} role="parameter" label="W_DKV, two output rows × three inputs"/>
    <MlaArrow path="M156 100 V195 H373"/><MlaArrow path="M566 138 V195 H409"/><MlaJunction x={391} y={195} symbol="×"/>
    <MlaArrow x1={391} y1={213} x2={391} y2={275}/><MlaCells x={307} y={275} values={[1,0]} label="c: only two intermediate directions"/>
    <MlaText x={215} y={350}>M: stacked key/value rows</MlaText><MlaCells x={130} y={388} values={joint} role="parameter" rowLabels={['K0 row0','K0 row1','K1 row0','K1 row1','V0 row0','V0 row1','V1 row0','V1 row1']}/>
    <MlaArrow path="M391 313 V360 H378 V427"/><MlaArrow x1={298} y1={445} x2={360} y2={445}/><MlaJunction x={378} y={445} symbol="×"/>
    <MlaArrow x1={396} y1={445} x2={460} y2={445}/><MlaText x={502} y={395}>Eight outputs</MlaText><MlaCells x={460} y={426} values={joint.map(row=>[matvec([row],[1,0])[0]])}/>
    <MlaText x={737} y={375}>Equivalent M W_DKV</MlaText><MlaText x={737} y={397}>Shape 8×3</MlaText><MlaCells x={620} y={426} values={effective} width={78} role="parameter"/>
    <MlaText x={440} y={787}>Third input column is zero; eight outputs do not create eight independent inputs.</MlaText>
    <MlaText x={440} y={817}>With RMSNorm inserted, M still writes into the same at-most-two-dimensional column space.</MlaText>
  </MlaDrawing>;
}

export function MlaSvdFactorDrawing() {
  const root=Math.sqrt(3);
  return <MlaDrawing label="A new diagonal map has singular values three and two; its rank-one SVD factors both carry square-root-three and reconstruct only the first direction" width={720} height={630}>
    <MlaCells x={30} y={62} values={[[3,0],[0,2]]} role="parameter" label="New original joint map M"/>
    <MlaCells x={410} y={62} values={[[3,0],[0,0]]} role="parameter" label="Rank-one approximation M_1"/>
    <MlaText x={360} y={197}>Keep σ₁=3; discard σ₂=2. Squared Frobenius error: 2²=4.</MlaText>
    <MlaCells x={30} y={267} values={[[root,0]]} width={120} role="parameter" label="Down-map: √Σ₁ V₁ᵀ, shape 1×2" digits={6}/>
    <MlaCells x={410} y={267} values={[[root],[0]]} width={120} role="parameter" label="Joint up-map: U₁ √Σ₁, shape 2×1" digits={6}/>
    <MlaArrow path="M150 305 V405 H317"/><MlaArrow path="M470 343 V405 H353"/><MlaJunction x={335} y={405} symbol="×"/>
    <MlaArrow x1={335} y1={423} x2={335} y2={501}/><MlaCells x={215} y={501} values={[[3,0],[0,0]]} width={120} label="Product equals M_1; it cannot restore the discarded direction"/>
  </MlaDrawing>;
}

export function MlaPartialRotaryDrawing() {
  return <><MlaDrawing label="An illustrative projected four-coordinate key splits into a retained rotary pair and unturned content pair; these activations are separate from the checkpoint weight selection below" width={840} height={440}>
    <MlaCells x={30} y={62} values={[1,2,3,4]} role="input" label="New illustrative four-coordinate projected key"/>
    <MlaArrow path="M114 100 V175 H180 V234"/><MlaArrow path="M282 100 V175 H590 V234"/>
    <MlaCells x={60} y={234} values={[1,2]} width={120} label="Pair selected to keep rotary position"/>
    <MlaCells x={470} y={234} values={[3,4]} width={120} label="Other coordinates: content branch"/>
    <MlaText x={180} y={323}>Position-specific R_s acts here.</MlaText><MlaArrow x1={180} y1={272} x2={180} y2={367}/>
    <MlaCells x={60} y={367} values={[-2,1]} width={120} label="Quarter turn for this illustration"/>
    <MlaText x={590} y={337}>These content activations remain unturned.</MlaText>
    <MlaText x={420} y={425}>Activations do not generate the checkpoint's weight maps.</MlaText>
  </MlaDrawing>
  <MlaDrawing label="A separate illustrative checkpoint parameter route selects the last two rows of an identity key map, stacks them with two value-map rows, and factorizes that joint weight matrix" width={1040} height={710}>
    <MlaCells x={30} y={62} values={[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]} role="parameter" label="Illustrative original key map, four output rows"/>
    <MlaCells x={630} y={62} values={[[1,0,0,0],[0,1,0,0]]} role="parameter" label="Illustrative value map, two output rows"/>
    <MlaText x={198} y={257}>Select key rows 2 and 3, the content pair.</MlaText>
    <MlaArrow path="M198 214 V290 H470 V337"/><MlaArrow path="M798 138 V290 H806 V337"/>
    <MlaCells x={470} y={337} values={[[0,0,1,0],[0,0,0,1],[1,0,0,0],[0,1,0,0]]} role="parameter" label="Joint M: two selected key rows, then two value rows"/>
    <MlaArrow x1={638} y1={489} x2={638} y2={575}/><MlaText x={638} y={610}>Joint SVD supplies down/up factors.</MlaText>
    <MlaText x={520} y={661}>Pair selection, retained rank, normalization and adaptation are separate decisions.</MlaText>
    <MlaText x={520} y={691}>This illustrative map is not a claim about a particular pretrained checkpoint.</MlaText>
  </MlaDrawing></>;
}
