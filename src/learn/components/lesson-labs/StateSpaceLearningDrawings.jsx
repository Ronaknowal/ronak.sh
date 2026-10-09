import { StateDrawing as Drawing, StateLabel as Label, StateWire as Wire, StateCells as Cells, StateOperation as Operation, StateValue as Value } from './StateSpaceDrawings.jsx';
export function StateDataRolesDrawing() {
  return <Drawing name="data-roles" height={668} label="Exact duplicate trajectories are removed before classwise shuffling and partitioning. Three hundred sixty measured rows become three hundred thirty unique trajectories, then disjoint fitting, validation and assessment roles. The bars use one pixel per trajectory; performer and session identities are unavailable.">
    <Label x={12} y={22}>Deduplicate paths before splitting</Label>
    <Cells x={12} y={61} cell={52} values={[["x1", "y1"], ["x2", "y2"]]} role="input" />
    <Cells x={215} y={61} cell={52} values={[["x1", "y1"], ["x2", "y2"]]} role="input" />
    <Label x={105} y={199}>Same path and label</Label>
    <Wire points={[[64, 165], [64, 242], [136, 242]]} /><Wire points={[[267, 165], [267, 242], [224, 242]]} />
    <Operation x={136} y={226} width={88} text="retain one" />
    <Wire points={[[180, 258], [180, 300]]} /><Cells x={104} y={300} cell={51} values={[["330", "unique", "rows"]]} />
    <Label x={12} y={380}>360 − 30 duplicates</Label>
    <Wire points={[[180, 351], [180, 408]]} /><Operation x={108} y={408} width={144} text="shuffle: seed 73" />
    {[['fit', 220, 484], ['validation', 50, 544], ['assessment', 60, 604]].map(([name, count, y]) => <g key={name}>
      <rect x={112} y={y} width={count} height="23" fill="#baa1e3" fillOpacity=".2" stroke="#baa1e3" />
      <Label x={12} y={y + 17}>{name}</Label><Label x={117} y={y + 17}>{count}</Label>
      <Wire points={[[108, 424], [93, 424], [93, y + 12], [112, y + 12]]} />
    </g>)}
    <Label x={12} y={659}>Bar scale: 1 pixel per trajectory.</Label>
  </Drawing>;
}
function FeatureCutaway({
  y,
  caption
}) {
  return <><Label x={12} y={y - 15}>{caption}</Label><Cells x={74} y={y} cell={49} values={[["f0", "f1", "f2", "f3"], ["f0", "f1", "f2", "f3"], ["f0", "f1", "f2", "f3"]]} />
    <Label x={281} y={y + 28}>t0</Label><Label x={281} y={y + 78}>t1</Label><Label x={281} y={y + 127}>t2</Label></>;
}
export function StateClassifierDrawing() {
  return <Drawing name="fitted-classifier" height={1644} label="A full path has forty-five coordinate pairs. Fixed centering and an input affine produce sixteen features per position. Two residual blocks contain normalization, temporal mixing, GELU and an affine projection, with the whole input bypassing to addition. The mean of all forty-five output feature vectors enters a fifteen-score classifier. The true label enters only the cross-entropy loss, never the feature encoder.">
    <Label x={12} y={22}>One path becomes 15 probabilities</Label>
    <Cells x={126} y={59} cell={49} values={[["x0", "y0"], ["x1", "y1"], ["x2", "y2"]]} role="input" />
    <Label x={12} y={241}>45×2; first 3 shown</Label>
    <Wire points={[[175, 206], [175, 276]]} /><Operation x={97} y={276} width={156} text="2x−1; affine 2→16" />
    <Wire points={[[175, 308], [175, 357]]} /><FeatureCutaway y={357} caption="45×16 features" />
    <Wire points={[[172, 504], [172, 557]]} /><Operation x={109} y={557} width={126} text="LayerNorm" />
    <Wire points={[[74, 430], [24, 430], [24, 908], [147, 908]]} />
    <Wire points={[[172, 589], [172, 634]]} /><Operation x={95} y={634} width={154} text="temporal mixer" />
    <Cells x={260} y={640} cell={35} values={[["h0", "h1"], ["h2", "h3"]]} />
    <Wire points={[[249, 650], [260, 650]]} /><Label x={45} y={697}>carry memory</Label>
    <Wire points={[[172, 666], [172, 744]]} /><Operation x={130} y={744} width={84} text="GELU" />
    <Wire points={[[172, 776], [172, 822]]} /><Operation x={107} y={822} width={130} text="affine 16→16" />
    <Wire points={[[172, 854], [172, 883]]} /><Value x={172} y={908} value="⊕" role="ink" />
    <Label x={32} y={794}>full input</Label><Label x={12} y={966}>Repeat twice</Label>
    <Wire points={[[172, 933], [172, 1000]]} /><Operation x={103} y={1000} width={138} text="mean over 45" />
    <Wire points={[[172, 1032], [172, 1081]]} /><Cells x={74} y={1081} cell={49} values={[["f0", "f1", "f2", "f3"]]} />
    <Label x={12} y={1180}>16-vector; 4 shown</Label>
    <Wire points={[[172, 1130], [172, 1218]]} /><Operation x={105} y={1218} width={134} text="classifier 16→15" />
    <Wire points={[[172, 1250], [172, 1298]]} /><Cells x={37} y={1298} cell={54} values={Array.from({
      length: 3
    }, (_, row) => Array.from({
      length: 5
    }, (_, i) => `ℓ${row * 5 + i + 1}`))} />
    <Label x={203} y={1495}>15-vector</Label>
    <Wire points={[[172, 1460], [172, 1530]]} /><Operation x={127} y={1530} width={90} text="softmax" />
    <Wire points={[[172, 1562], [172, 1600]]} /><Label x={172} y={1628} role="computed" anchor="middle">15 class probabilities</Label>
  </Drawing>;
}
export function StateLossDrawing() {
  return <Drawing name="class-loss" height={569} label="The predicted class probability and separately supplied true class meet in the negative log probability loss. Backward loss credit reaches the classifier, temporal read, retention and write coefficients. The label has no route into the forward input features.">
    <Label x={12} y={22}>Label enters only the objective</Label>
    <Cells x={12} y={65} cell={53} values={[["p1", "p2", "p3"]]} />
    <Label x={12} y={162}>3 of 15</Label>
    <Value x={300} y={91} value="k" role="input" /><Label x={195} y={177} role="input">true class</Label>
    <Wire points={[[92, 118], [92, 222], [131, 222]]} /><Wire points={[[300, 116], [300, 222], [231, 222]]} />
    <Operation x={131} y={206} width={100} text="select pₖ" />
    <Wire points={[[181, 238], [181, 278]]} /><Operation x={131} y={278} width={100} text="−log(pₖ)" />
    <Wire points={[[181, 310], [181, 355]]} /><Value x={181} y={380} value="loss" />
    <Wire points={[[156, 380], [64, 380], [64, 467]]} credit />
    <Cells x={12} y={467} cell={59} role="parameter" values={[["read C", "write B", "rates A", "projs"]]} />
    <Label x={12} y={557}>Orange dashes: backward loss credit.</Label>
  </Drawing>;
}
export function StateLearnedModesDrawing() {
  return <Drawing name="fitted-mixers" height={632} label="The fitted diagonal classifier stores four complex coordinates per channel, with four implicit conjugate partners. The selective classifier stores eight real coordinates per channel. Both occupy the same normalized residual scaffold, but their temporal computations and parameter counts differ.">
    <Label x={12} y={22}>What is actually inside the temporal mixer?</Label>
    <Label x={12} y={65}>Diagonal: 4 stored complex coordinates</Label>
    <Cells x={12} y={90} cell={73} values={[["z0", "z1", "z2", "z3"]]} />
    <Label x={12} y={219}>Conjugates use no extra storage.</Label>
    <Cells x={12} y={244} cell={73} values={[["z̄0", "z̄1", "z̄2", "z̄3"]]} />
    <Label x={12} y={375}>Selective: 8 real coordinates</Label>
    <Cells x={12} y={400} cell={73} values={[["h0", "h1", "h2", "h3"], ["h4", "h5", "h6", "h7"]]} />
    <Label x={12} y={597}>Both: 16 channels, 2 residual blocks.</Label>
    <Label x={12} y={625}>Selective fit: no gate or local conv.</Label>
  </Drawing>;
}
