import { useState } from 'react';
import { CrossFigure, CrossMatrix, CrossShape, CrossArrow, CrossBranches } from './CrossAttentionFlowFigures.jsx';
import { FlowLab, FlowControls, FlowChoice, FlowReadout } from './LessonFlow.jsx';

function TokenRows({ count, width, label, role = 'computed' }) {
  return <CrossShape rows={count} width={width} label={label} role={role} />;
}
function GatedInsertion({ index }) {
  return <div className="cross-flow-insertion">
    <div className="cross-flow-bypass" aria-label={`Language layer${index}: unchanged residual bypass`} />
    <div><TokenRows count={3} width={8} label={`Frozen language layer ${index} states (illustrative shape)`} role="input" />
      <CrossArrow>Separate visual read → tanh(αcross) × update → ⊕ bypass</CrossArrow>
      <TokenRows count={3} width={8} label="States after trained cross residual" />
      <CrossArrow>Trained dense branch → tanh(αdense) × update → ⊕ bypass</CrossArrow>
      <TokenRows count={3} width={8} label="States after trained dense residual" /></div>
  </div>;
}
export function CrossFlamingoDrawing() {
  return <CrossFigure job="D21" label="Flamingo adds trained gated branches to a frozen language model" caption="The64-entry resampler count is source-specific. Small grids below illustrate shape, not unknown checkpoint values. The resampler can use image features and its own latent entries as K/V. Both cross and dense added branches are gated; the surrounding vision/language backbones are frozen.">
    <CrossBranches><div><TokenRows count={16} width={8} label="Image encoder features: illustrative shape" role="input" />
      <CrossArrow>Frozen vision encoder supplies image features.</CrossArrow><TokenRows count={64} width={8} label="64 learned resampler queries (width schematic)" role="parameter" />
      <CrossArrow>Queries read K/V from image features + latent entries.</CrossArrow><TokenRows count={64} width={8} label="64 visual memory entries (width schematic)" />
      <div className="cross-flow-memory-bus" aria-label="Same visual memory bus reaches repeated visual cross reads">Visual K/V bus ↓ to each inserted cross branch</div></div>
      <div><GatedInsertion index={1} /><CrossArrow>Continue through frozen language layers.</CrossArrow><GatedInsertion index={2} /></div></CrossBranches>
  </CrossFigure>;
}
export function CrossBlipObjectives() {
  const [objective, setObjective] = useState('ITC'), queries = 2, texts = 3, labels = ['queryA', 'queryB', 'text0', 'text1', 'text2'];
  const grid = labels.map((_, i) => labels.map((_, j) => {
    if (objective === 'ITC') return (i < queries) === (j < queries);
    if (objective === 'ITM') return true;
    return i < queries ? j < queries : j < queries || (j >= queries && j <= i);
  }));
  return <FlowLab id="cross-blip-objectives" label="Inspect how BLIP-2 objectives change query/text permissions">
    <CrossFigure job="D22" label={`${objective} query/text self-attention permissions`} caption="Two representative learned query positions and three text positions make the block permissions visible. The real Q-Former uses32 learned queries. This grid governs query/text interaction; query-to-image cross-attention is a separate read.">
      <CrossMatrix values={grid} label={`${objective}: reader rows → donor columns`} rows={labels} columns={labels} binary />
      <CrossArrow>Query-to-image read remains a separate operation.</CrossArrow>
      <CrossMatrix values={Array.from({ length: queries }, () => [true, true, true])} label="Representative query→image cross-read" rows={labels.slice(0, queries)} columns={['image0', 'image1', 'image2']} binary />
    </CrossFigure><FlowControls><FlowChoice label="Q-Former objective" value={objective} options={[[ 'ITC', 'Contrastive (ITC)'], ['ITM', 'Matching (ITM)'], ['ITG', 'Generation (ITG)']]} onChange={setObjective} /></FlowControls>
    <FlowReadout>{objective === 'ITC' ? 'Query and text blocks are separated; their representations can be contrasted.' : objective === 'ITM' ? 'Full query/text interaction supports deciding whether the image and text match.' : 'Query rows cannot read text. Text rows read queries and earlier/current text inputs; shifted targets train image-grounded generation.'}</FlowReadout>
  </FlowLab>;
}
export function CrossBlipHandoff() {
  return <CrossFigure job="D23" label="BLIP-2 can hand query-read image information to a language prefix" caption="32×768 is the source Q-Former query shape. Output width is projected to the selected frozen language model. The OPT decoder-only route and Flan-T5 encoder-decoder route have different placements of text; an internal cross read can supply either visual prefix.">
    <TokenRows count={16} width={8} label="Frozen image encoder memory: schematic rows/width" role="input" />
    <CrossArrow>Q-Former queries cross-read the image memory.</CrossArrow><TokenRows count={32} width={768} label="32 learned query outputs" />
    <CrossArrow>Trained linear projection changes width for the language model.</CrossArrow>
    <CrossBranches><div><TokenRows count={32} width={8} label="OPT visual prefix (LM width schematic)" /><CrossArrow>Append question/shifted answer input to decoder stream.</CrossArrow>
      <CrossMatrix values={[[true, true, false], [true, true, true]]} label="Decoder answer positions read visual prefix and permitted text" rows={['answer0', 'answer1']} columns={['visual prefix', 'question', 'earlier answer']} binary /></div>
      <div><TokenRows count={32} width={8} label="Flan-T5 visual + text-prefix encoder input (LM width schematic)" /><CrossArrow>Frozen encoder output supplies memory to the text-suffix decoder.</CrossArrow>
        <CrossMatrix values={[[true, true], [true, true]]} label="Text-suffix decoder reads encoded prefix memory" rows={['suffix0', 'suffix1']} columns={['visual states', 'text-prefix states']} binary /></div></CrossBranches>
  </CrossFigure>;
}
export function CrossPrefixChoices() {
  const [crops, setCrops] = useState(false);
  return <FlowLab id="cross-prefix-choices" label="Distinguish width adaptation from token pooling">
    <CrossFigure job="D24" label="Original LLaVA linear prefix versus Idefics2 learned pooling" caption="These are dated model recipes, not accuracy rankings. Original LLaVA's linear map changes feature width while retaining row count. Idefics2 uses64 pooled entries per view; an optional original plus four crops gives5×64=320 entries.">
      <CrossBranches><div><TokenRows count={16} width={8} label="Original LLaVA image rows (schematic)" role="input" />
        <CrossArrow>Linear map: change width, retain rows.</CrossArrow><TokenRows count={16} width={12} label="Text-width visual prefix rows (schematic)" />
        <div className="cross-flow-stage-track"><span>Stage1: align connector with frozen backbones</span><CrossArrow>Then</CrossArrow><span>Stage2: instruction tuning includes the language model</span></div></div>
        <div>{Array.from({ length: crops ? 5 : 1 }, (_, i) => <div key={i}><TokenRows count={16} width={8} label={i === 0 ? 'Idefics2 original view: schematic source' : `Idefics2 crop ${i}: schematic source`} role="input" />
          <CrossArrow>Learned pooling to64 entries for this view.</CrossArrow><TokenRows count={64} width={8} label={`View ${i}:64 pooled entries (width schematic)`} /></div>)}
          <CrossArrow>Join entries from selected views.</CrossArrow><TokenRows count={crops ? 320 : 64} width={8} label="Idefics2 visual prefix: exact entry count, width schematic" /></div></CrossBranches>
    </CrossFigure><FlowControls><FlowChoice label="Idefics2 views" value={crops} options={[[false, 'Original image'], [true, 'Original + four crops']]} onChange={setCrops} /></FlowControls>
    <FlowReadout>{crops ? 'Five views ×64 entries =320 prefix entries.' : 'One view ×64 entries =64 prefix entries.'} Pooling changes row count; a width-only map does not.</FlowReadout>
  </FlowLab>;
}
