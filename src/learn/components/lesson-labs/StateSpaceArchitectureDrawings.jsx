import { StateDrawing as Drawing, StateLabel as Label, StateWire as Wire, StateCells as Cells, StateOperation as Operation, StateValue as Value } from './StateSpaceDrawings.jsx';

// Cutaways always retain the array axes. Three displayed channels are a
// representative slice, not an assertion that the model width is three.
function Features({
  x = 114,
  y,
  name,
  role = 'computed',
  width = 3
}) {
  return <><Label x={12} y={y - 14} role={role}>{name}</Label>
    <Cells x={x} y={y} cell={44} role={role} values={[Array.from({
      length: width
    }, (_, i) => `f${i}`)]} />
  </>;
}
export function StateScanDrawing() {
  return <Drawing name="affine-scan" height={626} label="Two successive affine memory updates are combined without knowing their incoming state. Advance coefficients multiply, and the first write advances before the second is added. Prefixes can be grouped in a tree without changing temporal order.">
    <Label x={12} y={22}>Combine updates; keep their temporal order</Label>
    <Value x={54} y={83} value="h" role="input" /><Wire points={[[79, 83], [112, 83]]} />
    <Operation x={112} y={67} width={116} text="× .5 + 1" />
    <Wire points={[[228, 83], [247, 83]]} /><Value x={272} y={83} value="h′" />
    <Wire points={[[272, 108], [272, 162]]} /><Operation x={222} y={162} width={102} text="× .2, then + 3" />
    <Wire points={[[272, 194], [272, 233]]} /><Value x={272} y={258} value="h″" />
    <Label x={12} y={181}>first write 1</Label><Label x={12} y={210}>advances by .2</Label>
    <Label x={12} y={305}>One summary: × .1, then + 3.2</Label>
    <Cells x={12} y={351} cell={72} values={[[".5, 1", ".2, 3", ".8, 2", ".3, 4"]]} role="parameter" />
    <Label x={105} y={448}>Ordered pairs</Label>
    <Wire points={[[84, 423], [84, 490]]} /><Wire points={[[228, 423], [228, 490]]} />
    <Operation x={36} y={490} width={96} text="first pair" /><Operation x={180} y={490} width={96} text="second pair" />
    <Wire points={[[84, 522], [84, 557], [131, 557]]} /><Wire points={[[228, 522], [228, 557], [229, 557]]} />
    <Operation x={131} y={541} width={98} text="combine" />
    <Label x={12} y={612}>Retain every ordered prefix.</Label>
  </Drawing>;
}
export function StateSSDFactorDrawing({
  write,
  read,
  decay,
  influence
}) {
  const full = influence || [[1, 0, 0, 0], [.5, 1, 0, 0], [0, .25, 1, 0], [.2, .4, -.8, -1]];
  const values = full.slice(0, 4).map(row => row.slice(0, 4));
  return <Drawing name="ssd-influence" height={697} label="A causal influence matrix has output positions down its rows and input arrival positions across its columns. Each allowed entry combines a signed read-write inner product and all subsequent decays. Future inputs have no edges; diagonal decay is one.">
    <Label x={12} y={22}>Write at j; advance; read at i</Label>
    <Cells x={12} y={64} cell={56} values={[["bⱼ0"], ["bⱼ1"]]} role="input" />
    <Cells x={273} y={64} cell={56} values={[["cᵢ0"], ["cᵢ1"]]} role="input" />
    <Wire points={[[68, 120], [135, 120]]} /><Wire points={[[273, 120], [225, 120]]} />
    <Operation x={135} y={104} width={90} text="c · b" />
    <Label x={12} y={215}>Signed influence</Label>
    <Wire points={[[180, 136], [180, 242]]} /><Operation x={107} y={242} width={146} text="× later-decay product" />
    <Wire points={[[180, 274], [180, 350]]} />
    <Label x={12} y={332}>arrival j →</Label>
    <Cells x={73} y={350} cell={57} values={values} />
    <Label x={12} y={620}>First {values.length} positions; full matrix in the table.</Label>
    <Label x={12} y={649}>Diagonal: no later decay, empty product = 1.</Label>
    <Label x={12} y={682}>Multiply each column by its arriving value.</Label>
  </Drawing>;
}
export function StateSSDChunkDrawing({
  chunk
}) {
  const local = (chunk?.local || [[1, 2], [4.4, 3.8]]).slice(0, 2);
  const incoming = (chunk?.incoming || [[.75, -.25], [1.4, -.3]]).slice(0, 2);
  const total = local.map((row, i) => row.map((value, j) => value + incoming[i][j]));
  return <Drawing name="ssd-chunk" height={1034} caption="These are the first two output rows of the selected chunk. The next drawing separately computes its outgoing boundary state." label="Incoming memory contributes output rows after advancing and reading. Independently, writes inside this chunk contribute local output rows. The two arrays add by corresponding row and value coordinate; this is an output calculation, distinct from the persisted boundary state.">
    <Label x={12} y={22}>Two output rows: incoming + local</Label>
    <Cells x={12} y={68} cell={56} values={[["old S"]]} role="input" />
    <Wire points={[[68, 96], [132, 96]]} /><Operation x={132} y={80} width={152} text="advance / read" />
    <Wire points={[[208, 112], [208, 175]]} /><Cells x={128} y={175} cell={80} values={incoming} />
    <Label x={12} y={159}>incoming outputs</Label>
    <Wire points={[[288, 255], [344, 255], [344, 740], [205, 740]]} />
    <Cells x={12} y={410} cell={72} values={[["writes"]]} role="input" />
    <Wire points={[[84, 446], [132, 446]]} /><Operation x={132} y={430} width={152} text="local read" />
    <Wire points={[[208, 462], [208, 525]]} /><Cells x={128} y={525} cell={80} values={local} />
    <Label x={12} y={509}>local outputs</Label>
    <Wire points={[[208, 685], [208, 713], [180, 713]]} /><Value x={180} y={740} value="⊕" role="ink" />
    <Wire points={[[180, 765], [180, 825]]} /><Cells x={100} y={825} cell={80} values={total} />
  </Drawing>;
}
export function StateCacheDrawing() {
  return <Drawing name="cache-continuation" height={525} label="A full Mamba1 or Mamba2 continuation carries both short-convolution history and recurrent state to the next token. Resetting a new sequence clears both. State-only continuation omits the local convolution boundary.">
    <Label x={12} y={22}>Carry the whole block boundary</Label>
    <Cells x={16} y={59} cell={51} values={[["t−2", "t−1"], ["x0", "x0"], ["x1", "x1"]]} />
    <Label x={146} y={86}>local convolution history</Label><Label x={146} y={117}>per channel</Label>
    <Cells x={16} y={253} cell={51} values={[["s00", "s01"], ["s10", "s11"]]} />
    <Label x={146} y={274}>recurrent state</Label><Label x={187} y={334}>channel / head</Label>
    <Wire points={[[118, 135], [335, 135], [335, 416], [249, 416]]} /><Wire points={[[118, 304], [180, 304], [180, 400]]} />
    <Operation x={111} y={400} width={138} text="next-token block" />
    <Wire points={[[180, 432], [180, 472]]} /><Label x={12} y={504}>A new sequence resets BOTH arrays.</Label>
  </Drawing>;
}
export function StateLayerDrawing() {
  return <Drawing name="layer-residual-width" height={883} label="A representative two-feature input is saved in full and separately normalized. The state-space block expands two features into four, mixes them through time, and projects four back to two. Its returned two-feature update is added to the saved original two features, not to the normalized input.">
    <Label x={12} y={22}>Save input; return to its width</Label>
    <Cells x={104} y={60} cell={52} values={[["x₀", "x₁"]]} role="input" />
    <Wire points={[[156, 112], [156, 155]]} /><Operation x={100} y={155} width={112} text="normalize" />
    <Wire points={[[208, 86], [337, 86], [337, 765], [205, 765]]} />
    <Label x={220} y={140}>saved input</Label>
    <Wire points={[[156, 187], [156, 234]]} /><Operation x={100} y={234} width={112} text="expand ×2" />
    <Wire points={[[156, 266], [156, 309]]} /><Cells x={52} y={309} cell={52} values={[["u₀", "u₁", "u₂", "u₃"]]} />
    <Label x={12} y={401}>Four channels</Label>
    <Wire points={[[156, 361], [156, 440]]} /><Operation x={72} y={440} width={168} text="state-space block core" />
    <Wire points={[[156, 472], [156, 521]]} /><Cells x={52} y={521} cell={52} values={[["m₀", "m₁", "m₂", "m₃"]]} />
    <Wire points={[[156, 573], [156, 616]]} /><Operation x={100} y={616} width={112} text="project 4 → 2" />
    <Wire points={[[156, 648], [156, 681]]} /><Cells x={104} y={681} cell={52} values={[["δ₀", "δ₁"]]} />
    <Wire points={[[156, 733], [156, 765], [155, 765]]} /><Value x={180} y={765} value="⊕" role="ink" />
    <Wire points={[[180, 790], [180, 823]]} /><Cells x={128} y={823} cell={52} values={[["x′₀", "x′₁"]]} />
  </Drawing>;
}
export function StateSSDCarryDrawing({
  chunk
}) {
  const old = chunk?.carry || [[1, .5], [3, -1]],
    own = chunk?.ownFinal || [[-1.2, 2.6], [2.8, .6]];
  const decay = chunk?.totalDecay ?? .2;
  const advanced = old.map(row => row.map(value => value * decay));
  const next = own.map((row, i) => row.map((value, j) => value + advanced[i][j]));
  return <Drawing name="ssd-boundary" height={821} label="The incoming matrix advances through every decay in the chunk. Independently, all writes born inside the chunk advance to its endpoint. Their two matrices add cell by cell and become the next chunk's incoming state.">
    <Label x={12} y={22}>Carry every write to the chunk boundary</Label>
    <Label x={12} y={58}>incoming state</Label><Cells x={12} y={78} cell={72} values={old} role="input" />
    <Wire points={[[84, 222], [84, 260]]} /><Operation x={25} y={260} width={118} text={`× ${Number(decay.toFixed(4))}`} />
    <Label x={179} y={167}>all chunk decays</Label><Label x={179} y={198}>multiply in order</Label>
    <Wire points={[[84, 292], [84, 346]]} /><Cells x={12} y={346} cell={72} values={advanced} />
    <Label x={12} y={330}>advanced</Label>
    <Cells x={204} y={346} cell={72} values={own} /><Label x={204} y={330}>own final writes</Label>
    <Wire points={[[84, 490], [84, 544], [155, 544]]} /><Wire points={[[276, 490], [276, 544], [205, 544]]} /><Value x={180} y={544} value="⊕" role="ink" />
    <Wire points={[[180, 569], [180, 615]]} /><Cells x={108} y={615} cell={72} values={next} />
    <Label x={12} y={791}>Carry full state to the next chunk.</Label>
  </Drawing>;
}
export function StateSystemLedgerDrawing({
  system,
  result,
  selected
}) {
  const start = Math.floor(selected / 4) * 4;
  const rows = result.contributions.slice(start, start + 4).map(row => row.slice(start, start + 4));
  const columnSum = result.contributions.reduce((sum, row) => sum + row[selected], 0);
  return <Drawing name="system-contributions" height={178 + rows.length * 67 + 293} label={`Input births form rows and output positions form columns. The displayed four-position cutaway belongs to the complete contribution table. Output ${selected} adds all input birth contributions ${columnSum}, the independent initial response ${result.initialResponse[selected]} and direct current input ${system.direct * system.inputs[selected]}.`}>
    <Label x={12} y={22}>Follow a birth row; add an output column</Label>
    <Label x={79} y={60}>output position →</Label>
    <Cells x={79} y={86} cell={67} values={rows} selected={[selected - start, selected - start]} />
    {rows.map((_, i) => <Label key={i} x={12} y={127 + i * 67}>in {start + i}</Label>)}
    <Label x={12} y={122 + rows.length * 67}>Cutaway positions {start}–{start + rows.length - 1}</Label>
    <Label x={12} y={158 + rows.length * 67}>All births for output {selected}:</Label>
    <Cells x={12} y={197 + rows.length * 67} cell={72} values={[[columnSum]]} />
    <Cells x={140} y={197 + rows.length * 67} cell={72} values={[[result.initialResponse[selected]]]} />
    <Cells x={268} y={197 + rows.length * 67} cell={72} values={[[system.direct * system.inputs[selected]]]} />
    <Label x={12} y={185 + rows.length * 67}>writes</Label><Label x={140} y={185 + rows.length * 67}>initial</Label><Label x={268} y={185 + rows.length * 67}>direct</Label>
    <Wire points={[[48, 269 + rows.length * 67], [48, 324 + rows.length * 67], [155, 324 + rows.length * 67]]} />
    <Wire points={[[176, 269 + rows.length * 67], [176, 296 + rows.length * 67], [180, 296 + rows.length * 67], [180, 299 + rows.length * 67]]} />
    <Wire points={[[304, 269 + rows.length * 67], [304, 324 + rows.length * 67], [205, 324 + rows.length * 67]]} />
    <Value x={180} y={324 + rows.length * 67} value="⊕" role="ink" />
    <Wire points={[[180, 349 + rows.length * 67], [180, 394 + rows.length * 67]]} />
    <Label x={180} y={426 + rows.length * 67} anchor="middle" role="computed">output {selected}: {Number(result.recurrent[selected].toFixed(4))}</Label>
  </Drawing>;
}
export function StateEventDrawing({
  settings,
  trace,
  selected = 1
}) {
  const start = Math.floor(selected / 4) * 4,
    rows = trace.slice(start, start + 4);
  return <Drawing name="marked-events" height={100 + rows.length * 139} label="Chronological events have supplied values and marker flags. The desired output carries the latest marked value across distractions, while an absent earlier marked event has no target yet.">
    <Label x={12} y={22}>Which value should survive a distraction?</Label>
    {rows.map((row, offset) => {
      const i = start + offset,
        y = 62 + offset * 139;
      return <g key={i}>
        <Label x={12} y={y + 26}>event {i}</Label>
        <rect x={103} y={y} width={74} height={53} fill="none" stroke={selected === i ? '#dedede' : '#79c5d8'} strokeWidth={selected === i ? 2.5 : 1} />
        <Label x={140} y={y + 33} anchor="middle" role="input">{row.input}</Label>
        <Label x={192} y={y + 25} role="input">{settings.marked[i] ? '◆ marked' : '○ distraction'}</Label>
        <Label x={103} y={y + 84} role="computed">target: {row.target === null ? 'none yet' : row.target}</Label>
        {offset < rows.length - 1 && <Wire points={[[140, y + 94], [140, y + 139]]} />}
      </g>;
    })}
    <Label x={12} y={86 + rows.length * 139}>Window {start}–{start + rows.length - 1}; supplied marker ≠ learned gate.</Label>
  </Drawing>;
}
