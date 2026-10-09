import React, { useState } from 'react';
import { Figure, Panels, Matrix, Bars, Plot, Curve, Controls, Range, Result, colors } from './Drawing.jsx';
import { X0, H0, W0, matmul, subtract, divergence, fmt } from './nmf-model.js';
import {Operation,Port,DotProduct} from './Operations.jsx';
export function Observation() {
  return <Figure id="D01" caption="R0 is one measured observation. Its three bins share the same0–4 intensity ruler; the row identity is not a feature."><Bars label="R0 · measured intensity" values={X0[0]} /></Figure>;
}
export function Addends() {
  const [a, setA] = useState(2),
    [b, setB] = useState(1),
    parts = [[a, 0, a], [0, b, b]],
    prediction = [a, b, a + b];
  return <Figure id="D02" caption="Amounts multiply entire patterns. Matching feature bins then add; neither amount is normalized into a probability."><Panels><Matrix label="Fixed H · component × feature" values={H0} rows={['C0', 'C1']} componentRows /><Bars label={`C0 contribution · ${fmt(a)} × H[C0]`} values={parts[0]} max={6} color={colors[0]} /><Bars label={`C1 contribution · ${fmt(b)} × H[C1]`} values={parts[1]} max={6} color={colors[1]} /><Bars label="Their sum · reconstructed R0" values={prediction} max={6} /></Panels><Controls onReset={() => {
      setA(2);
      setB(1);
    }}><Range label="C0 amount" value={a} onChange={setA} max={3} /><Range label="C1 amount" value={b} onChange={setB} max={3} /></Controls><Result>{fmt(a)}[1,0,1] + {fmt(b)}[0,1,1] = [{prediction.map(fmt).join(', ')}].</Result></Figure>;
}
export function Shapes() {
  return <Figure id="D03" caption="R1/F2 contracts the component dimension: W[R1,C0]H[C0,F2]+W[R1,C1]H[C1,F2]=1×1+3×1=4. R/C/F IDs are zero-based. White outlines mark every operand used for this output."><Operation label="Contract the two matching component axes"><Matrix label="W · select observation R1" values={W0} columns={['C0', 'C1']} componentColumns selectedCells={[[1,0],[1,1]]} /><Port label="match C0/C1" symbol="×" /><Matrix label="H · select feature F2" values={H0} rows={['C0', 'C1']} componentRows selectedCells={[[0,2],[1,2]]} /><Port label="sum both paths" /><Matrix label="WH = X0 · output R1/F2" values={X0} selected={[1,2]} /></Operation><DotProduct left={W0[1]} right={H0.map(row=>row[2])} ids={['C0','C1']} leftLabel="W[R1,c]" rightLabel="H[c,F2]" resultLabel="Trace both component paths to reconstructed R1/F2" componentTerms /></Figure>;
}
export function OuterProducts() {
  const parts=[0,1].map(c=>W0.map(w=>H0[c].map(h=>w[c]*h)));
  return <Figure id="D04" caption="Each component contributes a complete row-by-feature outer product. A zero amount removes a row; a zero pattern bin removes a column. Cell size does not encode magnitude.">{[0,1].map(c=><Operation key={c} label={`C${c} column times row makes its complete addend`}><Matrix label={`W[:,C${c}] · one amount per observation`} values={W0.map(w=>[w[c]])} columns={[`C${c}`]} color={colors[c]} /><Port label="column × row" symbol="×" /><Matrix label={`H[C${c},:] · one whole pattern`} values={[H0[c]]} rows={[`C${c}`]} color={colors[c]} /><Port label="outer product" /><Matrix label={`Complete C${c} addend`} values={parts[c]} color={colors[c]} /></Operation>)}<Operation label="Add matching cells of the two complete addends"><Matrix label="C0 addend" values={parts[0]} color={colors[0]} /><Port label="matching R/F cells" symbol="+" /><Matrix label="C1 addend" values={parts[1]} color={colors[1]} /><Port label="cellwise sum" /><Matrix label="Reconstructed X0" values={X0} /></Operation></Figure>;
}
export function AmountFraction() {
  return <Figure id="D05" caption="Dividing amounts by their total3 changes this product. Fractions sum1; measured amounts do not carry that constraint."><Panels><Bars label="Original amounts · amount units" values={[2, 1]} ids={['C0', 'C1']} component max={3} /><Bars label="Fractions · dimensionless" values={[2 / 3, 1 / 3]} ids={['C0', 'C1']} component max={1} /><Matrix label="Original reconstruction" values={[[2, 1, 3]]} /><Matrix label="Reconstruction using fractions with unchanged H" values={[[2 / 3, 1 / 3, 1]]} /></Panels></Figure>;
}
export function Compensation() {
  const [s, setS] = useState(1),
    w = W0.map(r => [r[0] / s, r[1]]),
    h = [H0[0].map(v => v * s), H0[1]];
  return <Figure id="D06" caption="The pattern and amount use reciprocal units. Every complete contribution and the product remain unchanged; s=0 cannot be inverted."><Panels><Matrix label="Original W" values={W0} columns={['C0', 'C1']} componentColumns /><Matrix label="Original H" values={H0} rows={['C0', 'C1']} componentRows /><Matrix label="Compensated W" values={w} columns={['C0', 'C1']} componentColumns /><Matrix label="Rescaled H" values={h} rows={['C0', 'C1']} componentRows /><Matrix label="Current product · unchanged X0" values={matmul(w, h)} /></Panels><Controls onReset={() => setS(1)}><Range label="C0 pattern scale s" value={s} onChange={setS} min={.5} max={3} /></Controls><Result>R0 C0 amount {fmt(2 / s)}, pattern [{h[0].map(fmt).join(', ')}], contribution [2,0,2]. Scale0 is outside this invertible operation.</Result></Figure>;
}
export function ContributionRanking() {
  const [s, setS] = useState(1);
  return <Figure id="D08" caption="A coefficient ranking can reverse under a harmless unit change. Total contributed intensity is unchanged, and still does not establish a physical cause."><Panels><Bars label="Amounts · current factor units" values={[2 / s, 1]} ids={['C0', 'C1']} component max={4} /><Bars label="Total contributed intensity" values={[4, 2]} ids={['C0', 'C1']} component max={4} /></Panels><Controls onReset={() => setS(1)}><Range label="C0 pattern scale s" value={s} onChange={setS} min={.5} max={3} /></Controls><Result>Amounts [{fmt(2 / s)},1]; contributions [4,2]. Largest raw amount: {2 / s >= 1 ? 'C0' : 'C1'}{s === 2 ? ' (tie)' : ''}.</Result></Figure>;
}
export function Residual() {
  const [a, setA] = useState(1),
    prediction = [a, 1, a + 1],
    residual = X0[0].map((v, j) => v - prediction[j]);
  return <Figure id="D09" caption="Residual means observed minus reconstructed. Blue positive bins need reconstructed mass; rose negative bins have excess. Factor amounts remain nonnegative."><Panels><Bars label="Observed R0" values={X0[0]} max={4} /><Bars label="Current prediction" values={prediction} max={4} /><Bars label="Signed residual · separate −3…3 ruler" values={residual} max={3} signed /></Panels><Controls onReset={() => setA(1)}><Range label="C0 amount; C1 fixed1" value={a} onChange={setA} max={3} /></Controls><Result>Prediction [{prediction.map(fmt).join(', ')}]; residual [{residual.map(fmt).join(', ')}]. At amount2 every residual is zero.</Result></Figure>;
}
export function SquaredCells() {
  return <Figure id="D10" caption="R1−[1,1,2]=[0,2,2]. The nonzero residual side lengths2 become square areas4 each: half-loss4. Whole-table initial squared residual norm12 gives half-loss6 and MSE12/9."><Panels><Matrix label="Observed, predicted, signed residual" rows={['R1', 'Prediction', 'Residual']} values={[[1, 3, 4], [1, 1, 2], [0, 2, 2]]} /><div className="nmf-plot"><p className="nmf-object-label">Residual squares · squared intensity units</p><svg viewBox="0 0 300 150" role="img" aria-label="F0 square area0; F1 and F2 squares side2 area4 each"><text x="15" y="30">F0: area0</text>{[110, 210].map((x, i) => <g key={x}><rect x={x} y="48" width="70" height="70" fill={colors[0]} opacity=".5" /><text x={x} y="30">F{i + 1}: area4</text><text x={x + 10} y="140">side2</text></g>)}</svg></div></Panels></Figure>;
}
export function Missing() {
  const [x, setX] = useState(2);
  return <Figure id="D11" caption="An omitted measurement is no information, rather than an observed0. Included loss0 does not assess the missing bin."><Panels><Matrix label="Measured zero · both cells observed" rows={['Observation', 'Prediction']} values={[[x, 0], [x / 2, x / 2]]} /><Matrix label="Omitted second bin · mask[1,0]" rows={['Observation', 'Prediction']} values={[[x, 'missing'], [x, x]]} /></Panels><Controls onReset={() => setX(2)}><Range label="First measured value" value={x} onChange={setX} max={4} /></Controls><Result>H=[1,1]. Measured-zero optimum amount {fmt(x / 2)}, half-loss {fmt(x * x / 4)}. Omitted-bin optimum amount {fmt(x)}, included half-loss0; missing-bin quality unknown.</Result></Figure>;
}
export function LossDomains() {
  const [x, setX] = useState(2);
  return <Figure id="D12" caption="These scalar objectives measure different disagreements. All live values are positive. KL(0,y)=y; positive observation with y=0 has infinite KL. IS excludes observed0."><Panels>{[[2, 'Half squared error'], [1, 'Generalized KL'], [0, 'Itakura–Saito']].map(([beta, label]) => <Plot key={beta} label={label} xmin={.5} xmax={4} ymax={8} xlabel="prediction y" ylabel="entrywise cost">{map => <><Curve map={map} xmin={.5} xmax={4} fn={y => divergence(x, y, beta)} /><circle cx={map([x, 0])[0]} cy={map([x, 0])[1]} r="5" fill={colors[1]} /></>}</Plot>)}</Panels><Controls onReset={() => setX(2)}><Range label="Observed x" value={x} onChange={setX} min={.5} max={4} /></Controls><Result>At y1: squared {fmt(divergence(x, 1, 2))}, KL {fmt(divergence(x, 1, 1))}, IS {fmt(divergence(x, 1, 0))}. At y3: {fmt(divergence(x, 3, 2))}, {fmt(divergence(x, 3, 1))}, {fmt(divergence(x, 3, 0))}. Each cost is zero at y={fmt(x)}.</Result></Figure>;
}
