import { MoeScene, MoeText, MoeCells, MoeMatrix, MoeWire, MoeOperation } from './MoeFlowFigures.jsx';
import { MoeAffineDrawing } from './MoeMechanismFigures.jsx';

export function MoeNormalizationDrawing({ trace }) {
  return <MoeScene width={850} height={760} title="LayerNorm reduces within one actual sixteen-coordinate row"
    description={`The complete input row is shown. Its population mean is ${trace.mean}; the mean squared centered coordinate is ${trace.variance}. Every centered coordinate divides by sqrt(variance plus 1e-5), then its own learned gain multiplies it and its own learned offset is added. No other token is included in this reduction.`}>
    <MoeCells x={18} y={50} values={trace.input} width={100} columns={8} label="all 16 current row coordinates"/>
    <MoeWire path="M415 126V155"/><MoeOperation x={415} y={180} symbol="μ" radius={25}/><MoeText x={470} y={185}>Σ of 16 entries ÷ 16</MoeText>
    <MoeWire path="M415 205V230"/><MoeCells x={365} y={230} values={[trace.mean]} width={100} label="mean"/>
    <MoeWire path="M18 70H8V296H370"/><MoeWire path="M415 268V276H390"/><MoeOperation x={390} y={296} symbol="−"/>
    <MoeWire path="M390 316V345"/><MoeCells x={18} y={345} values={trace.centered} width={100} columns={8} label="all 16 centered coordinates"/>
    <MoeWire path="M415 421V450"/><MoeOperation x={415} y={480} radius={30} symbol="rms"/><MoeText x={470} y={484}>sqrt(Σ centered² / 16 + 1e−5)</MoeText>
    <MoeCells x={18} y={520} values={[trace.divisor]} width={120} label="shared divisor"/><MoeWire path="M415 510V538H138"/>
    <MoeWire path="M18 364H8V613H330"/><MoeWire path="M78 558V613H330"/><MoeOperation x={350} y={613} symbol="÷"/>
    <MoeWire path="M370 613H430"/><MoeCells x={430} y={595} values={trace.standardized.slice(0,4)} width={100} label="first four standardized coordinates"/>
    <MoeText x={18} y={688}>Each coordinate then uses its own amber gain and offset.</MoeText>
    <MoeText x={18} y={725}>Complete standardized/gain/offset/output ledger follows this reduction.</MoeText>
  </MoeScene>;
}

export function MoeAffineNormCoordinate({trace,coordinate=0}) {
  return <MoeScene width={740} height={360} title="The learned affine part of normalization acts on matching coordinates"
    description={`Coordinate ${coordinate}: standardized value ${trace.standardized[coordinate]} times learned gain ${trace.gain[coordinate]}, plus learned offset ${trace.offset[coordinate]}, gives ${trace.output[coordinate]}. The preceding reduction uses all sixteen coordinates.`}>
    <MoeCells x={18} y={60} values={[trace.standardized[coordinate]]} width={130} label="standardized coordinate"/>
    <MoeCells x={240} y={60} values={[trace.gain[coordinate]]} width={130} role="parameter" label="matching learned gain"/>
    <MoeWire path="M145 78H180V140H210"/><MoeWire path="M305 98V140H250"/><MoeOperation x={230} y={140} symbol="×"/>
    <MoeCells x={450} y={60} values={[trace.offset[coordinate]]} width={130} role="parameter" label="matching learned offset"/>
    <MoeWire path="M250 140H400V195H440"/><MoeWire path="M515 98V195H480"/><MoeOperation x={460} y={195} symbol="+"/>
    <MoeWire path="M460 215V260"/><MoeCells x={400} y={260} values={[trace.output[coordinate]]} width={130} label="actual normalized output"/>
    <MoeText x={18} y={336}>The data reduction is computed; gain and offset are trained parameters.</MoeText>
  </MoeScene>;
}

export function MoePixelPatchDrawing({pixels,patch=0}) {
  const row=Math.floor(patch/4)*2,col=(patch%4)*2,indices=[row*8+col,row*8+col+1,(row+1)*8+col,(row+1)*8+col+1];
  return <MoeScene width={700} height={480} title="A patch is four actual neighboring pixels, not an arbitrary row label"
    description={`The eight-by-eight bitmap contains all sixty-four raw counts. Patch ${patch} uses indices ${indices}. Those counts divide by sixteen to form one four-feature patch row. There are sixteen nonoverlapping two-by-two patches.`}>
    <MoeCells x={18} y={45} values={pixels.map(v=>Math.round(v*16))} role="input" columns={8} width={38} height={38}/>
    <rect x={18+col*38-2} y={45+row*38-2} width={76} height={76} fill="none" stroke="#fff" strokeWidth="3"/>
    <MoeWire path={`M${18+(col+2)*38} ${45+(row+1)*38}H360V225H380`}/>
    <MoeOperation x={400} y={225} symbol="÷"/><MoeCells x={340} y={365} values={[16]} role="operation" label="raw count maximum"/>
    <MoeWire path="M373 365V310H400V245"/><MoeWire path="M420 225H470V270"/>
    <MoeCells x={470} y={270} values={indices.map(i=>pixels[i])} columns={2} width={92} role="computed" label={`patch ${patch}: four normalized inputs`}/>
    <MoeText x={18} y={455}>White outline marks the selected 2 × 2 footprint; position ID stays separate.</MoeText>
  </MoeScene>;
}

export function MoeModelCircuit({trace,patch=0,label=0}) {
  const t=trace,r=t.reference;
  const rows=[['projected + learned position',t.positioned[patch]],['LN before attention',t.attentionNorm[patch].output],
    ['all two-head reads then W_O',t.attentionProjection[patch].output],['first residual sum',t.afterAttention[patch]],
    ['LN before router / experts',t.expertNorm[patch].output],['weighted selected expert update',r.combined[patch]],
    ['second residual sum',t.afterExperts[patch]],['final within-row LN',t.finalNorm[patch].output]];
  return <MoeScene width={880} height={1210} title="The actual fitted block keeps two independent saved residual rows"
    description={`The complete sixteen-coordinate row at patch ${patch} is shown at every boundary. The first residual adds the original projected-and-positioned row to the attention output. The second adds that updated row to the full selected expert sum. Final normalization is per row, then all sixteen final rows are averaged before ten-class affine classification. The supplied label ${label} reaches only the loss.`}>
    {rows.map(([name,values],i)=>{const y=55+i*115;return <g key={name}>
      <MoeCells x={50} y={y} values={values} columns={8} width={100} label={name}/>
      {i<rows.length-1&&<MoeWire path={`M450 ${y+76}V${y+105}`}/>}
      {[3,6].includes(i)&&<MoeOperation x={22} y={y+18} symbol="+" radius={15}/>}
    </g>;})}
    <MoeWire path="M50 75H8V418H7"/><MoeWire path="M50 418H2V763H7"/>
    <MoeText x={50} y={1015}>16 final rows → coordinate mean → classifier W (10 × 16) + bias (10).</MoeText>
    <MoeCells x={50} y={1060} values={r.classProbabilities} columns={5} width={100} label="all ten predicted class probabilities"/>
    <MoeWire path="M547 1078H610V1150H630"/><MoeOperation x={650} y={1150} symbol="J"/>
    <MoeCells x={740} y={1132} values={[label]} role="input" label="supplied class y" width={100}/><MoeWire path="M740 1150H670"/>
    <MoeText x={50} y={1195}>These are exact boundary arrays; the following map and read cutaways show operations.</MoeText>
  </MoeScene>;
}

export function MoeMeanDrawing({ trace }) {
  const sums=trace.mean.map(x=>x*16);
  return <MoeScene width={810} height={540} title="Pooling sums the same coordinate across all sixteen final rows"
    description="All sixteen values for coordinate zero are displayed and enter a sum. The sum divides by sixteen. The same operation is independently applied to each other coordinate; the full sixteen-coordinate mean is shown rather than falsely wiring one coordinate into the full vector.">
    <MoeCells x={18} y={50} values={trace.finalNorm.map(row=>row.output[0])} width={95} columns={8} label="coordinate 0 from every final row"/>
    <MoeWire path="M400 126V167"/><MoeOperation x={400} y={187} symbol="Σ"/>
    <MoeWire path="M400 207V245"/><MoeCells x={340} y={245} values={[sums[0]]} width={120} label="complete coordinate-0 sum"/>
    <MoeCells x={18} y={340} values={[16]} role="operation" label="number of final rows"/><MoeWire path="M81 358H370"/>
    <MoeWire path="M400 283V338"/><MoeOperation x={400} y={358} symbol="÷"/><MoeWire path="M420 358H500"/>
    <MoeCells x={500} y={340} values={[trace.mean[0]]} width={120} label="coordinate-0 mean"/>
    <MoeCells x={18} y={440} values={trace.mean} width={95} columns={8} label="all 16 independently computed coordinate means"/>
  </MoeScene>;
}

export function MoeExpertPathDrawing({trace,coordinate=0}) {
  return <>
    <MoeAffineDrawing trace={trace.gatePath} row={coordinate} title="Actual expert gate projection: all input products plus the full sum"/>
    <MoeAffineDrawing trace={trace.upPath} row={coordinate} title="Actual expert value projection: a separate learned map"/>
    <MoeScene width={740} height={360} title="SiLU modulates the separate value projection coordinate"
      description={`At coordinate ${coordinate}, SiLU of ${trace.gatePath.output[coordinate]} is ${trace.activated[coordinate]}. It multiplies value projection ${trace.upPath.output[coordinate]} to yield ${trace.product[coordinate]}; the down map reads all such products.`}>
      <MoeCells x={18} y={55} values={[trace.gatePath.output[coordinate]]} width={120} label="gate preactivation"/>
      <MoeWire path="M135 73H178"/><MoeOperation x={214} y={73} radius={36} symbol="SiLU"/>
      <MoeWire path="M250 73H298"/><MoeCells x={298} y={55} values={[trace.activated[coordinate]]} width={120} label="activated gate"/>
      <MoeCells x={18} y={205} values={[trace.upPath.output[coordinate]]} width={120} label="value projection"/><MoeWire path="M135 223H470"/>
      <MoeWire path="M415 73H490V203"/><MoeOperation x={490} y={223} symbol="×"/><MoeWire path="M510 223H570"/>
      <MoeCells x={570} y={205} values={[trace.product[coordinate]]} width={120} label="product"/>
      <MoeText x={18} y={325}>The subsequent down projection sums all sixteen product coordinates.</MoeText>
    </MoeScene>
    <MoeAffineDrawing trace={trace.downPath} row={coordinate} title="Actual expert down projection reads all sixteen modulated values"/>
  </>;
}

export function MoeAttentionReturnDrawing({trace,patch=0,head=0}) {
  const context=trace.contexts[patch].slice(head*8,head*8+8),products=trace.queries[head][patch].map((v,i)=>v*trace.keys[head][0][i]);
  return <>
    <MoeScene width={1000} height={760} title="A query reads a donor key, then every weighted donor adds into the head context"
      description={`Receiving patch ${patch}, head ${head}: all eight query times donor-zero key products sum and divide by sqrt(8), producing the shown score. Separately, all sixteen weighted donor coordinates sum into each context coordinate; this is not one donor's output. Both head contexts concatenate before the learned attention output map.`}>
      <MoeCells x={18} y={60} values={trace.queries[head][patch]} width={100} label="actual 8-coordinate receiver query"/>
      <MoeCells x={18} y={200} values={trace.keys[head][0]} width={100}/>
      <MoeCells x={18} y={285} values={products} width={100}/>
      {products.map((_,i)=><g key={i}><MoeWire path={`M${68+i*100} 98V123`}/>
        <MoeWire path={`M${68+i*100} 200V147`}/><MoeOperation x={68+i*100} y={135} radius={12} symbol="×"/>
        <MoeWire path={`M${80+i*100} 135H${116.5+i*100}V260H${68+i*100}V285`}/></g>)}
      <MoeText x={840} y={185}>donor 0 key</MoeText><MoeText x={840} y={270}>eight matching</MoeText><MoeText x={840} y={294}>products</MoeText>
      <MoeOperation x={840} y={325} symbol="Σ"/><MoeWire path="M815 304H840V305"/>
      <MoeWire path="M840 345V413H460V385"/><MoeOperation x={460} y={365} symbol="÷"/>
      <MoeCells x={18} y={347} values={[Math.sqrt(8)]} width={120} label="head width square root"/><MoeWire path="M135 365H440"/>
      <MoeWire path="M480 365H560"/><MoeCells x={560} y={347} values={[trace.attentionScores[head][patch][0]]} width={120} label="donor 0 score"/>
      <MoeCells x={18} y={460} values={trace.values[head].map((row,donor)=>row[0]*trace.reference.attention[head][patch][donor])} columns={8} width={100} label="coordinate 0: all sixteen weighted donor writes"/>
      <MoeWire path="M415 536V562"/><MoeOperation x={415} y={582} symbol="Σ"/><MoeWire path="M435 582H560"/>
      <MoeCells x={560} y={564} values={[context[0]]} width={120} label="full coordinate 0 context"/>
      <MoeCells x={18} y={665} values={context} width={100} label="all eight complete head context coordinates"/>
      <MoeText x={18} y={742}>Each of the other seven coordinates uses all sixteen donors too.</MoeText>
    </MoeScene>
    <MoeAffineDrawing trace={trace.attentionProjection[patch]} row={0} title="Both head contexts concatenate into the actual learned output projection"/>
    <MoeScene width={860} height={370} title="The complete attention output adds to the saved positioned row"
      description="The saved projected-and-positioned row is added coordinate by coordinate to the complete output-projected attention row. This is the first residual. All sixteen coordinates are retained; the next normalization and router read this sum.">
      <MoeCells x={18} y={55} values={trace.positioned[patch]} columns={8} width={100} label="saved positioned row"/>
      <MoeCells x={18} y={160} values={trace.attentionProjection[patch].output} columns={8} width={100} label="complete output-projected attention row"/>
      <MoeWire path="M415 131H842V250H470"/><MoeWire path="M415 236V250H430"/><MoeOperation x={450} y={250} symbol="+"/>
      <MoeWire path="M450 270V295"/><MoeCells x={18} y={295} values={trace.afterAttention[patch]} columns={8} width={100} label="all sixteen coordinates after first residual"/>
    </MoeScene>
  </>;
}
