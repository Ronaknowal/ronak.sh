import { asymmetricLaw, outcomeState, jointState, conditionalState, noiseRows, withoutReplacement, fourBitStrings, sampleResiduals, cauchyMomentCutoff, paretoMomentCutoff, squareDensity, mixedCdf, curveSamples } from '../../data/random-variable-visual-models.js';
import { Figure, Compare, Values, Table, Scene, Label, Arrow, Plane, Point, MappingDrawing, LawDrawing, MassRuler, ResidualSquares, JointGrid, MatrixDrawing, fmt } from './RandomVariableDrawings.jsx';
const fair = outcomeState(),
  asymmetricMean = .25;
function NumberLine({
  label,
  values,
  mean = null,
  range = [-3, 4],
  units = 'value'
}) {
  const X = x => 38 + (x - range[0]) / (range[1] - range[0]) * 264;
  return <Scene label={label} height={170}><line x1={38} x2={302} y1={90} y2={90} className="rv-axis" />{values.map((v, i) => <g key={i}><circle cx={X(v.value)} cy={90} r={5 + 12 * Math.sqrt(v.mass ?? 0)} className={`rv-area rv-${i % 2 ? 'blue' : 'gold'}`} /><Label x={X(v.value)} y={128}>{fmt(v.value)}</Label><Label x={X(v.value)} y={35}>p {v.massLabel ?? fmt(v.mass ?? 0)}</Label></g>)}{mean !== null && <><path d={`M${X(mean) - 8},85L${X(mean) + 8},85L${X(mean)},72Z`} className="rv-area rv-rose" /><Label x={X(mean)} y={61} tone="rose">μ {fmt(mean)}</Label></>}<Label x={170} y={165}>{units}</Label></Scene>;
}
function SignedTerms({
  terms,
  label,
  range = [-1, 1],
  units = 'signed contribution'
}) {
  const X = x => 170 + x / Math.max(Math.abs(range[0]), Math.abs(range[1])) * 130;
  return <Scene label={label} height={terms.length * 66 + 65}><Label x={170} y={25}>{units}</Label>{terms.map((term, i) => {
      const y = 65 + i * 66;
      return <g key={i}><line x1={40} x2={300} y1={y} y2={y} className="rv-grid" /><line x1={170} x2={170} y1={y - 15} y2={y + 15} className="rv-axis" /><Arrow x1={170} y1={y} x2={X(term.value)} y2={y} tone={term.value < 0 ? 'rose' : 'gold'} /><Label x={40} y={y - 23} anchor="start">{term.label}</Label><Label x={300} y={y + 27} anchor="end">{fmt(term.value)}</Label></g>;
    })}</Scene>;
}
export function PreimageFigure() {
  return <Figure job="C02" caption="Gold routes are the preimage of X≤1: TT, TH and HT. Their three masses sum to 3/4. The cyan HH route is excluded; the white ring selects the realized input TH."><MappingDrawing rows={fair.outcomes} threshold={1} selected="TH" /></Figure>;
}
export function FairCopiedFigure() {
  const copied = {
    xs: [0, 1],
    ys: [0, 1],
    rows: [{
      x: 0,
      y: 0,
      mass: .5
    }, {
      x: 1,
      y: 1,
      mass: .5
    }],
    cells: [{
      x: 0,
      y: 0,
      mass: .5
    }, {
      x: 0,
      y: 1,
      mass: 0
    }, {
      x: 1,
      y: 0,
      mass: 0
    }, {
      x: 1,
      y: 1,
      mass: .5
    }]
  };
  const independent = {
    ...copied,
    rows: copied.cells.map(c => ({
      ...c,
      mass: .25
    })),
    cells: copied.cells.map(c => ({
      ...c,
      mass: .25
    }))
  };
  return <Figure job="C03" caption="0 means tails and 1 heads. Independent coins assign 1/4 to every paired cell. A copied fair bit assigns 1/2 to TT and HH, zero to the two cross pairs. Both individual coins remain fair."><Compare><div><JointGrid state={independent} /><p>Independent fair coins</p></div><div><JointGrid state={copied} /><p>Copied fair coins</p></div></Compare></Figure>;
}
export function GroupingFigure() {
  return <Figure job="C04" caption="Each outcome keeps its original 1/4 strip. TH and HT are two separate routes into the same value 1; pooling their strips gives probability 1/2 without duplicating mass."><MassRuler rows={fair.outcomes.map(r => ({
      label: `${r.label} → ${r.value}`,
      mass: r.mass
    }))} /><MappingDrawing rows={fair.outcomes} /></Figure>;
}
export function PmfSupportFigure() {
  return <Figure job="C05" caption="The stems are masses at the numerical support points 0,1,2: 1/4,1/2,1/4. Their heights sum to one; widths and intervals do not encode probabilities here."><LawDrawing law={fair.distribution} /><Values><span>p(0)=1/4</span><span>p(1)=1/2</span><span>p(2)=1/4</span></Values></Figure>;
}
export function EndpointFigure() {
  return <Figure job="C07" caption="The first interval excludes the atom at 0 and includes 1: probability 1/2. Closing 0 includes its extra 1/4, making 3/4. The choice determines whether the lower CDF level is F(0) or F(0−)."><Scene label="Two actual number-line intervals, with excluded and included endpoint atoms" height={200}>{[0, 1].map(i => <g key={i}><line x1={65} x2={275} y1={65 + i * 90} y2={65 + i * 90} className="rv-axis" /><line x1={65} x2={170} y1={65 + i * 90} y2={65 + i * 90} className="rv-line rv-gold" /><circle cx={65} cy={65 + i * 90} r={6} className={`rv-dot rv-gold ${i === 0 ? 'open' : ''}`} /><circle cx={170} cy={65 + i * 90} r={6} className="rv-dot rv-gold" /><Label x={65} y={95 + i * 90}>0</Label><Label x={170} y={95 + i * 90}>1</Label><Label x={275} y={45 + i * 90}>p {i === 0 ? '1/2' : '3/4'}</Label><Label x={170} y={35 + i * 90}>{i === 0 ? '0 < X ≤ 1' : '0 ≤ X ≤ 1'}</Label></g>)}</Scene></Figure>;
}
export function ThresholdContributionFigure() {
  return <Figure job="C08" caption="The restricted event X≥1 keeps masses 1/2 and 1/8, totaling 5/8. Its weighted value contribution is 1/2+1/4=3/4. Dividing both surviving masses by 5/8 gives 4/5 and 1/5; their conditional average is 6/5."><LawDrawing law={[{
      value: 0,
      mass: 3 / 8
    }, {
      value: 1,
      mass: 1 / 2
    }, {
      value: 2,
      mass: 1 / 8
    }]} threshold={1} /><Compare><div><MassRuler label="Original probability mass" rows={[{
          label: 'Excluded X=0',
          mass: 3 / 8
        }, {
          label: 'Included X=1',
          mass: 1 / 2
        }, {
          label: 'Included X=2',
          mass: 1 / 8
        }]} /></div><div><MassRuler label="Conditional probability after division by 5/8" rows={[{
          label: 'X=1',
          mass: 4 / 5
        }, {
          label: 'X=2',
          mass: 1 / 5
        }]} /></div></Compare></Figure>;
}
export function WeightedBalanceFigure() {
  return <Figure job="C09" caption="Probability is the weight on this numerical lever. About μ=1/4 the weighted signed residuals are −9/16,−1/8,11/16 and sum to zero. Equal weights would answer a different question, with mean 1/3."><NumberLine label="Asymmetric probability-weighted lever with pivot 1/4" values={asymmetricLaw} mean={asymmetricMean} /><SignedTerms label="Weighted values determine the actual mean" range={[-.8, .8]} terms={[{
      label: '(1/4) × (−2)',
      value: -.5
    }, {
      label: '(1/2) × 0',
      value: 0
    }, {
      label: '(1/4) × 3',
      value: .75
    }]} /><Table label="Distances about the probability-weighted pivot" headers={['Value', 'p', 'x−1/4', 'p(x−1/4)']} rows={asymmetricLaw.map(r => [r.value, r.mass, fmt(r.value - .25), fmt(r.mass * (r.value - .25))])} /></Figure>;
}
export function NonlinearAverageFigure() {
  return <Figure job="C10" caption="Both −1 and 1 go to the same square 1, each carrying mass 1/2. Averaging inputs gives zero, whose square is zero; averaging their transformed values gives one."><MappingDrawing rows={[{
      label: '−1',
      value: 1,
      mass: .5
    }, {
      label: '+1',
      value: 1,
      mass: .5
    }]} label="Two preimages under squaring, one output value" /><Values><span>E[X]=0</span><span>E[X²]=1</span><span>(E[X])²=0</span></Values></Figure>;
}
export function LinearityFigure() {
  return <Figure job="C11" caption="Each row retains the same outcome. Adding its two weighted contributions before or after pooling gives the same 2/3. Here Y=X², so linearity does not require independent coordinates."><Table label="Literal distributivity in three equally likely outcomes" headers={['X', 'Y=X²', 'pX', 'pY', 'p(X+Y)']} rows={[[-1, 1, '−1/3', '1/3', 0], [0, 0, 0, 0, 0], [1, 1, '1/3', '1/3', '2/3']]} /><SignedTerms label="Three paired sums pool to 2/3" terms={[{
      label: 'Outcome X=−1: (X+Y)/3',
      value: 0
    }, {
      label: 'Outcome X=0: (X+Y)/3',
      value: 0
    }, {
      label: 'Outcome X=1: (X+Y)/3',
      value: 2 / 3
    }]} /></Figure>;
}
export function IndicatorCountFigure() {
  return <Figure job="C12" caption="The twelve nodes are actual ordered draws without replacement from M1,M2,U1,U2. Each position is marked in six of twelve outcomes, giving expected total one. Double-marked outcomes occur in only two of twelve, showing dependence."><Scene label="All twelve ordered distinct-ball arrangements" height={310}>{withoutReplacement.map((r, i) => {
        const x = 55 + i % 3 * 110,
          y = 50 + Math.floor(i / 3) * 70;
        return <g key={i}><circle cx={x - 17} cy={y} r={15} className={`rv-area rv-${r.firstMarked ? 'gold' : 'blue'}`} /><circle cx={x + 17} cy={y} r={15} className={`rv-area rv-${r.secondMarked ? 'gold' : 'blue'}`} /><Label x={x} y={y + 36}>{r.first},{r.second}</Label></g>;
      })}</Scene><Table label="Indicator outcomes, each with probability 1/12" headers={['First ball', 'Second ball', 'I₁', 'I₂', 'I₁+I₂']} rows={withoutReplacement.map(r => [r.first, r.second, r.firstMarked, r.secondMarked, r.firstMarked + r.secondMarked])} /></Figure>;
}
export function CenteredSquaresFigure() {
  return <Figure job="C13" caption="About mean 1/4, weighted squared residuals are 81/64,1/32,121/64, totaling variance 51/16. Squared units differ from the standard deviation √51/4 in the original units."><ResidualSquares pieces={asymmetricLaw} center={.25} centerName="μ" /><Table label="Every variance contribution" headers={['Value', 'p', 'Residual', 'p × residual²']} rows={asymmetricLaw.map(r => [r.value, r.mass, fmt(r.value - .25), fmt(r.mass * (r.value - .25) ** 2)])} /></Figure>;
}
export function AffineUnitsFigure() {
  return <Figure job="C14" caption="Y=−2X+10 maps −2,0,3 to 14,10,4 while preserving their masses. The negative scale reverses order and doubles distances; adding 10 translates the mean. Mean 19/2, variance 51/4, standard deviation √51/2."><NumberLine label="Original weighted support" values={asymmetricLaw} mean={.25} /><Scene label="Each same mass follows the reflected affine map" height={285}>{asymmetricLaw.map((r, i) => <g key={i}><Label x={35} y={50 + i * 85}>{r.value}</Label><Arrow x1={60} y1={45 + i * 85} x2={245} y2={45 + i * 85} /><Label x={150} y={30 + i * 85}>p={r.mass}</Label><Label x={285} y={50 + i * 85}>{-2 * r.value + 10}</Label></g>)}</Scene><NumberLine label="Reflected and shifted support, same probabilities" values={asymmetricLaw.map(r => ({
      ...r,
      value: -2 * r.value + 10
    }))} mean={9.5} range={[3, 15]} units="Y units" /></Figure>;
}
export function LossDecompositionFigure() {
  return <Figure job="C16" caption="For c=0, each residual splits into x−μ and μ−c. The weighted cross terms −9/32,−1/16,11/32 sum to zero; variance 51/16 plus squared offset 1/16 gives risk 13/4."><Scene label="Actual residual segments split about mean 1/4" height={270}>{asymmetricLaw.map((r, i) => {
        const X = x => 160 + x * 42,
          y = 50 + i * 85;
        return <g key={i}><Arrow x1={X(.25)} y1={y} x2={X(r.value)} y2={y} /><Arrow x1={X(0)} y1={y + 16} x2={X(.25)} y2={y + 16} tone="blue" /><Label x={25} y={y + 40} anchor="start">x={r.value}; centered {fmt(r.value - .25)} + offset 1/4</Label></g>;
      })}</Scene><SignedTerms label="Cross terms cancel after probability weighting" range={[-.4, .4]} terms={asymmetricLaw.map(r => ({
      label: `x=${r.value}: 2p(x−μ)(μ−c)`,
      value: 2 * r.mass * (r.value - .25) * .25
    }))} /></Figure>;
}
export function SameMomentsFigure() {
  return <Figure job="C17" caption="Both laws have mean zero and variance one on the same support/probability axes. The probability of |X|≥2 differs: zero versus 1/4. The first two moments therefore do not determine the complete law."><Compare><div><LawDrawing law={[{
          value: -1,
          mass: .5
        }, {
          value: 1,
          mass: .5
        }]} range={[-2.5, 2.5]} ticks={[-2, 0, 2]} /></div><div><LawDrawing law={[{
          value: -2,
          mass: .125
        }, {
          value: 0,
          mass: .75
        }, {
          value: 2,
          mass: .125
        }]} range={[-2.5, 2.5]} ticks={[-2, 0, 2]} tone="blue" /></div></Compare></Figure>;
}
export function ConditionalRowFigure() {
  const state = {
    xs: [0, 1],
    ys: [0, 1],
    rows: [{
      x: 0,
      y: 0,
      mass: .3
    }, {
      x: 0,
      y: 1,
      mass: .2
    }, {
      x: 1,
      y: 0,
      mass: .1
    }, {
      x: 1,
      y: 1,
      mass: .4
    }],
    cells: [{
      x: 0,
      y: 0,
      mass: .3
    }, {
      x: 0,
      y: 1,
      mass: .2
    }, {
      x: 1,
      y: 0,
      mass: .1
    }, {
      x: 1,
      y: 1,
      mass: .4
    }]
  };
  return <Figure job="C19" caption="The X=0 row has mass 1/2. Normalization gives conditional masses .6 and .4, while the marginal Y masses are .4 and .6. A separate added zero row would require dividing by zero: its conditional law is undefined."><JointGrid state={state} selectedX={0} /><MassRuler label="Conditional Y law given X=0" rows={[{
      label: 'Y=0',
      mass: .6
    }, {
      label: 'Y=1',
      mass: .4
    }]} /><Table label="Zero-probability extension" headers={['X row', 'Y=0 joint', 'Y=1 joint', 'Row mass', 'Conditional law']} rows={[[2, 0, 0, 0, 'undefined: 0/0']]} /></Figure>;
}
export function ProductFactorizationFigure() {
  return <Figure job="C20" caption="For independent coordinates, each of the nine cells is exactly (1/3)(1/3)=1/9. In the matching law the cell (−1,0) is zero, although its marginal product is 1/9: one failed cell disproves independence."><JointGrid state={jointState('independent')} /><Table label="Compare every independent cell with its marginal product" headers={['X', 'Y', 'Joint', 'pX pY']} rows={jointState('independent').cells.map(c => [c.x, c.y, '1/9', '1/9'])} /><Table label="One actual matching-law witness" headers={['Cell', 'Joint', 'Marginal product']} rows={[["X=−1,Y=0", 0, '1/9']]} /></Figure>;
}
export function CenteredProductFigure() {
  return <Figure job="C22" caption="Matching pairs contribute +1/3,0,+1/3, making covariance 2/3. Opposite pairs contribute −1/3,0,−1/3. These are signed products, with units equal to the product of the two channel units."><Compare><div><SignedTerms label="Matching centered products" terms={[{
          label: '(−1)(−1)/3',
          value: 1 / 3
        }, {
          label: '0 × 0 / 3',
          value: 0
        }, {
          label: '1 × 1 / 3',
          value: 1 / 3
        }]} /></div><div><SignedTerms label="Opposite centered products" terms={[{
          label: '(−1)(1)/3',
          value: -1 / 3
        }, {
          label: '0 × 0 / 3',
          value: 0
        }, {
          label: '1 × (−1) / 3',
          value: -1 / 3
        }]} /></div></Compare></Figure>;
}
export function CorrelationUnitsFigure() {
  return <Figure job="C23" caption="Replacing the matched Y by 100Y scales covariance and Y standard deviation by 100. Their ratio stays one. Constant Y has standard deviation zero, so its correlation is undefined rather than zero."><Scene label="Same paired outcomes under a unit conversion" height={260}>{[-1, 0, 1].map((x, i) => <g key={x}><circle cx={65} cy={50 + i * 80} r={18} className="rv-area rv-gold" /><Label x={65} y={55 + i * 80}>{x}</Label><Arrow x1={90} y1={50 + i * 80} x2={250} y2={50 + i * 80} tone="blue" /><Label x={286} y={55 + i * 80}>{100 * x}</Label></g>)}</Scene><Table label="Covariance versus normalized correlation" headers={['Y representation', 'Cov(X,Y)', 'σY', 'Correlation']} rows={[["Y=X", '2/3', '√(2/3)', 1], ["Y=100X", '200/3', '100√(2/3)', 1], ["Y=constant", 0, 0, 'undefined']]} /></Figure>;
}
export function WeightedCauchyFigure() {
  return <Figure job="C24" caption="These are three actual weighted residual coordinates. For matching Y, b=a and equality holds. For Y=X², b=(1,−2,1)/(3√3) is nonzero but orthogonal to a: zero dot product does not force independence."><Scene label="Three-component weighted residual vectors, actual coordinate heights" height={290}>{[-1, 0, 1].map((x, i) => {
        const ox = 60 + i * 110,
          a = x / Math.sqrt(3),
          b = (x * x - 2 / 3) / Math.sqrt(3),
          Y = v => 145 - v * 110;
        return <g key={i}><line x1={ox - 30} x2={ox + 30} y1={145} y2={145} className="rv-axis" /><Arrow x1={ox - 10} y1={145} x2={ox - 10} y2={Y(a)} /><Arrow x1={ox + 10} y1={145} x2={ox + 10} y2={Y(b)} tone="blue" /><Label x={ox} y={245}>coordinate {i + 1}</Label></g>;
      })}<Label x={170} y={25}>gold a; cyan nonlinear b</Label></Scene><Table label="Weighted-vector dot products and norms" headers={['Pair', 'a·b', '‖a‖²', '‖b‖²']} rows={[["matching", '2/3', '2/3', '2/3'], ["nonlinear", 0, '2/3', '2/9']]} /></Figure>;
}
export function NonlinearWitnessFigure() {
  return <Figure job="C25" caption="All three input values determine Y=X². The forbidden pair (0,1) has joint probability zero but marginal product 2/9. Centered contributions −1/9,0,+1/9 cancel; covariance zero coexists with dependence."><MappingDrawing rows={[-1, 0, 1].map(x => ({
      label: String(x),
      value: x * x,
      mass: 1 / 3
    }))} /><JointGrid state={jointState('nonlinear')} /><SignedTerms label="Cancellation of actual nonlinear centered products" range={[-.2, .2]} terms={[{
      label: 'X=−1',
      value: -1 / 9
    }, {
      label: 'X=0',
      value: 0
    }, {
      label: 'X=1',
      value: 1 / 9
    }]} /></Figure>;
}
export function CalibratedEstimandFigure() {
  return <Figure job="C27" caption="Both calibrated channels estimate the same θ and share S. Weights a and 1−a preserve θ and S; local variances 1 and 4 give the optimum a=4/5 and total risk 49/5. B−A cancels θ as well as S and has variance 5."><Scene label="Actual shared parameter and noise paths into calibrated channels" height={280}><Label x={170} y={25}>θ + S; Var(S)=9</Label><Arrow x1={150} y1={40} x2={70} y2={105} /><Arrow x1={190} y1={40} x2={270} y2={105} /><Label x={70} y={130}>A = θ+S+e</Label><Label x={270} y={130}>B = θ+S+f</Label><Label x={70} y={155}>Var(e)=1</Label><Label x={270} y={155}>Var(f)=4</Label><Arrow x1={70} y1={175} x2={150} y2={225} /><Arrow x1={270} y1={175} x2={190} y2={225} tone="blue" /><Label x={170} y={255}>(4/5) A + (1/5) B</Label></Scene><Plane label="Risk over the calibrated coefficient a" xRange={[0, 1]} yRange={[9, 13]} yTicks={[9, 11, 13]} xLabel="weight a; other weight 1−a" yLabel="variance (units²)" curves={[{
      fn: a => 9 + a * a + 4 * (1 - a) ** 2
    }]}>{({
        X,
        Y
      }) => <Point x={.8} y={9.8} X={X} Y={Y} />}</Plane></Figure>;
}
export function OuterProductPsdFigure() {
  return <Figure job="C28" caption="The eight actual centered vectors produce Σ=[[5,4],[4,5]]. Projection onto w=[1,−1] is e−f; four zero and four magnitude-two projections contribute weighted squares totaling 2. This is wᵀΣw, a nonnegative variance."><MatrixDrawing rows={noiseRows} /><Plane equalScale label="Each centered channel vector projects onto the difference direction" xRange={[-3.5, 3.5]} yRange={[-3.5, 3.5]} xTicks={[-3, 0, 3]} yTicks={[-3, 0, 3]} xLabel="centered A (mV)" yLabel="centered B (mV)">{({
        X,
        Y
      }) => noiseRows.map((r, i) => <Arrow key={i} x1={X(0)} y1={Y(0)} x2={X(r.x - 10)} y2={Y(r.y - 20)} tone={r.s < 0 ? 'gold' : 'blue'} />)}</Plane><Table label="Actual projected deviations and their weighted squares" headers={['s,e,f', 'w·z=e−f', 'p(w·z)²']} rows={noiseRows.map(r => [`${r.s},${r.e},${r.f}`, r.e - r.f, fmt((r.e - r.f) ** 2 / 8)])} /></Figure>;
}
export function LinearMapFigure() {
  return <Figure job="C29" caption="The 2×2 map takes each paired 2×1 channel vector into a 2×1 average/difference vector. The same eight outcomes give mean [15,10] and covariance [[4.5,0],[0,2]]. The covariance transformation is AΣAᵀ; raw means transform separately."><Compare><div><Plane equalScale label="Original eight paired channel outcomes" xRange={[6, 14]} yRange={[16, 24]} xTicks={[7, 10, 13]} yTicks={[17, 20, 23]} xLabel="A channel (mV)" yLabel="B channel (mV)">{({
            X,
            Y
          }) => noiseRows.map((r, i) => <Point key={i} x={r.x} y={r.y} X={X} Y={Y} tone={r.s < 0 ? 'gold' : 'blue'} />)}</Plane></div><div><Plane equalScale label="All eight outcomes after average and difference map" xRange={[11, 19]} yRange={[6, 14]} xTicks={[12, 15, 18]} yTicks={[7, 10, 13]} xLabel="average (A+B)/2 (mV)" yLabel="difference B−A (mV)">{({
            X,
            Y
          }) => noiseRows.map((r, i) => <Point key={i} x={(r.x + r.y) / 2} y={r.y - r.x} X={X} Y={Y} tone={r.s < 0 ? 'gold' : 'blue'} />)}</Plane></div></Compare><Table label="The actual matrix map, dimensions 2×2" headers={['Output', 'A coefficient', 'B coefficient']} rows={[["average", .5, .5], ["difference", -1, 1]]} /><Table label="Every transformed pair" headers={['A', 'B', 'Average', 'Difference']} rows={noiseRows.map(r => [r.x, r.y, (r.x + r.y) / 2, r.y - r.x])} /></Figure>;
}
export function InvalidPsdFigure() {
  return <Figure job="C30" caption="For direction [1,1,1], all nine ordered matrix entries contribute: three +1 and six −.8, totaling −1.8. A negative variance is impossible. Individually bounded correlations do not make a compatible covariance matrix."><Table label="Proposed covariance matrix, all nine contributions to wᵀΣw" headers={['', 'Coordinate 1', 'Coordinate 2', 'Coordinate 3']} rows={[["Coordinate 1", 1, -.8, -.8], ["Coordinate 2", -.8, 1, -.8], ["Coordinate 3", -.8, -.8, 1]]} /><SignedTerms label="Grouped actual quadratic-form terms reject the proposal" range={[-5, 5]} terms={[{
      label: 'Three diagonal contributions: 3 × 1',
      value: 3
    }, {
      label: 'Six ordered cross terms: 6 × (−.8)',
      value: -4.8
    }, {
      label: 'Projected variance: incompatible',
      value: -1.8
    }]} /></Figure>;
}
export function AffinePredictionFigure() {
  return <Figure job="C31" caption="For the three equally likely points Y=X², the best affine prediction is the horizontal 2/3: slope zero, risk 2/9. The conditional prediction follows all three points and has zero risk. Zero covariance does not force the best nonlinear predictor to be constant."><Plane label="Actual nonlinear outcomes and their best affine versus conditional predictions" xRange={[-1.5, 1.5]} yRange={[-.2, 1.3]} xTicks={[-1, 0, 1]} yTicks={[0, 2 / 3, 1]} xLabel="X" yLabel="Y and predictions" curves={[{
      fn: () => 2 / 3,
      tone: 'blue'
    }, {
      points: [[-1, 1], [0, 0], [1, 1]],
      tone: 'gold'
    }]}>{({
        X,
        Y
      }) => [-1, 0, 1].map(x => <g key={x}><line x1={X(x)} x2={X(x)} y1={Y(x * x)} y2={Y(2 / 3)} className="rv-reference" /><Point x={x} y={x * x} X={X} Y={Y} /></g>)}</Plane><Table label="Actual affine squared errors, versus exact conditional prediction" headers={['X', 'Y', 'Affine error', 'p × error²', 'Conditional error']} rows={[[-1, 1, '1/3', '1/27', 0], [0, 0, '−2/3', '4/27', 0], [1, 1, '1/3', '1/27', 0]]} /></Figure>;
}
export function TowerPartitionFigure() {
  return <Figure job="C33" caption="Each outcome has mass 1/4. Pooling within the two groups gives means −2 and 2, each carrying group mass 1/2. Their weighted contributions −1 and 1 pool to zero, agreeing with the direct four-outcome average."><Scene label="Four actual Y values pool through their group means into the same overall mean" height={340}>{conditionalState().rows.map((r, i) => {
        const y = 55 + i * 75,
          gy = r.g < 0 ? 93 : 243;
        return <g key={i}><Label x={35} y={y + 5}>{r.y}</Label><Arrow x1={53} y1={y} x2={145} y2={gy} tone={r.g < 0 ? 'gold' : 'blue'} /><Label x={78} y={y - 16}>p 1/4</Label></g>;
      })}{[-2, 2].map((g, i) => <g key={g}><circle cx={170} cy={93 + i * 150} r={22} className={`rv-area rv-${i ? 'blue' : 'gold'}`} /><Label x={170} y={98 + i * 150}>{g}</Label><Arrow x1={193} y1={93 + i * 150} x2={276} y2={168} tone={i ? 'blue' : 'gold'} /><Label x={250} y={60 + i * 220}>mass 1/2</Label></g>)}<circle cx={300} cy={168} r={20} className="rv-area rv-gold" /><Label x={300} y={173}>0</Label><Label x={170} y={328}>outcomes → groups → pooled mean</Label></Scene></Figure>;
}
export function ResidualOrthogonalityFigure() {
  return <Figure job="C34" caption="The within residual is −U, the between deviation G. Both are literal components of Y=G−U. Their weighted cross products +1/2,−1/2,−1/2,+1/2 cancel to zero; weighted within squares give 1 and between squares 4."><Scene label="Within and between segments for all four actual outcomes" height={350}>{conditionalState().rows.map((r, i) => {
        const X = x => 170 + x * 40,
          y = 45 + i * 80;
        return <g key={i}><Arrow x1={X(0)} y1={y} x2={X(r.g)} y2={y} tone="blue" /><Arrow x1={X(r.g)} y1={y + 14} x2={X(r.y)} y2={y + 14} /><Label x={25} y={y + 42} anchor="start">G={r.g}; −U={-r.u}; Y={r.y}</Label></g>;
      })}</Scene><SignedTerms label="Weighted within times between products" terms={conditionalState().rows.map(r => ({
      label: `G=${r.g}, U=${r.u}: (1/4)G(−U)`,
      value: -r.g * r.u / 4
    }))} /></Figure>;
}
export function InformationRefinementFigure() {
  return <Figure job="C36" caption="The same four outcomes form successively finer partitions: one pooled group, two G groups, then four individual outcomes. Population predictions 0,±2,Y have average squared risks 5,1,0. Refinement improves average risk, with the finite-L² assumptions stated in the proof."><Scene label="Actual nested partitions of the four outcomes, with their predictions" height={335}>{[['No information', [0, 0, 0, 0], 5], ['Known G', [-2, -2, 2, 2], 1], ['Known G,U', [-1, -3, 3, 1], 0]].map(([label, predictions, risk], i) => {
        const top = 45 + i * 100;
        return <g key={label}><Label x={20} y={top - 13} anchor="start">{label}; risk {risk}</Label>{predictions.map((value, j) => <g key={j}><circle cx={55 + j * 76} cy={top + 23} r={21} className={`rv-area rv-${j < 2 ? 'gold' : 'blue'}`} /><Label x={55 + j * 76} y={top + 28}>{value}</Label></g>)}{i < 2 && <path d={i === 0 ? `M30,${top + 54}H310` : `M30,${top + 54}H157 M182,${top + 54}H310`} className="rv-reference" />}</g>;
      })}</Scene><Table label="The same outcome errors under finer information" headers={['Y', 'No-info error²', 'Known-G error²', 'Full-info error²']} rows={conditionalState().rows.map(r => [r.y, r.y * r.y, 1, 0])} /></Figure>;
}
export function SubgroupCounterFigure() {
  return <Figure job="C37" caption="This separate model has group masses 3/4 and 1/4, means 2 and 6, variances 1 and 9. The pooled mean is 3, within variance 3, between variance 3, total 6. One subgroup's variance 9 exceeds the pooled 6."><Plane label="Actual subgroup versus pooled variances on a common 0..9 axis" xRange={[0, 3]} yRange={[0, 9]} xTicks={[.5, 1.5, 2.5]} yTicks={[0, 3, 6, 9]} xLabel="group A / group B / pooled" yLabel="variance (units²)">{({
        X,
        Y
      }) => [1, 9, 6].map((v, i) => <rect key={i} x={X(i + .25)} y={Y(v)} width={X(.75) - X(.25)} height={Y(0) - Y(v)} className={`rv-area rv-${i === 1 ? 'blue' : 'gold'}`} />)}</Plane><Table label="Distinct stipulated subgroup model" headers={['Group', 'Mass', 'Mean', 'Variance']} rows={[["A", .75, 2, 1], ["B", .25, 6, 9], ["Pooled", 1, 3, 6]]} /></Figure>;
}
export function DensityAreaFigure() {
  return <Figure job="C38" caption="Uniform on [0,.2] has density 5 per input unit. Height exceeds one, yet the whole area is 5×.2=1. The highlighted width .1 has probability .5; a singleton has width zero and probability zero."><Plane label="Actual density height and probability area for a narrow uniform law" xRange={[-.02, .22]} yRange={[0, 6]} xTicks={[0, .1, .2]} yTicks={[0, 3, 5]} xLabel="input (units)" yLabel="density (1/unit)" curves={[{
      points: [[0, 5], [.2, 5]]
    }]}>{({
        X,
        Y
      }) => <><rect x={X(0)} y={Y(5)} width={X(.1) - X(0)} height={Y(0) - Y(5)} className="rv-area rv-gold" /><line x1={X(.15)} x2={X(.15)} y1={Y(0)} y2={Y(5)} className="rv-reference" /></>}</Plane></Figure>;
}
export function MixedLawFigure() {
  return <Figure job="C39" caption="The atom at 0 carries probability 1/2, separately from the continuous density 1/2 on [0,1]. The CDF jumps from zero to 1/2 at zero, then rises continuously to one. A point mass is not an ordinary finite density height."><Compare><div><LawDrawing law={[{
          value: 0,
          mass: .5
        }]} range={[-.1, 1.1]} ticks={[0, .5, 1]} xLabel="atom location" /><Plane label="Continuous component of the mixed law" xRange={[-.1, 1.1]} yRange={[0, 1]} xTicks={[0, .5, 1]} xLabel="continuous value" yLabel="continuous density" curves={[{
          points: [[0, .5], [1, .5]],
          tone: 'blue'
        }]}>{({
            X,
            Y
          }) => <rect x={X(0)} y={Y(.5)} width={X(1) - X(0)} height={Y(0) - Y(.5)} className="rv-area rv-blue" />}</Plane></div><div><Plane label="CDF with the actual atom jump and continuous segment" xRange={[-.1, 1.1]} yRange={[0, 1]} xTicks={[0, .5, 1]} xLabel="threshold y" yLabel="F(y)" curves={[{
          points: [[-.1, 0], [0, 0]],
          tone: 'blue'
        }, {
          points: [[0, .5], [1, 1], [1.1, 1]],
          tone: 'blue'
        }]}>{({
            X,
            Y
          }) => <><Point x={0} y={0} X={X} Y={Y} tone="blue" open /><Point x={0} y={mixedCdf(0)} X={X} Y={Y} tone="blue" /></>}</Plane></div></Compare></Figure>;
}
export function DensityBranchesFigure() {
  return <Figure job="C41" caption="Each inverse branch ±√y contributes 1/(4√y); adding both gives 1/(2√y). The plotted portion starts at y=.04, where density is 2.5, and the arrow indicates unbounded continuation toward zero. No finite cap or atom is implied. Actual area on [.25,.81] is .4, and the full density integrates to one."><Scene label="Both true inverse branches under the square transformation" height={255}><Label x={170} y={28}>output y &gt; 0</Label><Arrow x1={150} y1={45} x2={75} y2={115} /><Arrow x1={190} y1={45} x2={265} y2={115} tone="blue" /><Label x={75} y={145}>U = −√y</Label><Label x={265} y={145}>U = +√y</Label><Label x={75} y={175}>density 1/(4√y)</Label><Label x={265} y={175}>density 1/(4√y)</Label><Arrow x1={75} y1={195} x2={150} y2={230} /><Arrow x1={265} y1={195} x2={190} y2={230} tone="blue" /></Scene><Plane label="Square density, explicitly truncated near the unbounded origin" xRange={[0, 1]} yRange={[0, 3]} xLabel="square y" yLabel="density per y unit" curves={[{
      fn: squareDensity,
      range: [.04, 1]
    }]}>{({
        X,
        Y
      }) => <><polygon points={`${X(.25)},${Y(0)} ${curveSamples(squareDensity, .25, .81).map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')} ${X(.81)},${Y(0)}`} className="rv-area rv-gold" /><Arrow x1={X(.04)} y1={Y(2.5)} x2={X(.015)} y2={Y(2.95)} /></>}</Plane><Values><span>E[Y]=1/3</span><span>Var(Y)=4/45</span></Values></Figure>;
}
export function CauchySidesFigure() {
  const integrand = x => x / (Math.PI * (1 + x * x));
  return <Figure job="C42" caption={`This is the truncated first-moment integrand, not the Cauchy density. The left cutoff −5 contributes −${fmt(cauchyMomentCutoff(5))}; the independent right cutoff 10 contributes +${fmt(cauchyMomentCutoff(10))}. Both magnitudes diverge logarithmically. Equal cutoffs cancel to a principal value zero, which does not define the expectation.`}><Plane label="Signed first-moment integrand with two independently chosen cutoffs" xRange={[-10, 10]} yRange={[-.2, .2]} xTicks={[-10, 0, 10]} yTicks={[-.2, 0, .2]} xLabel="x; finite displayed window" yLabel="x f(x)" curves={[{
      fn: integrand
    }]}>{({
        X,
        Y
      }) => <>{[[-5, 0, 'rose'], [0, 10, 'gold']].map(([a, b, tone]) => <polygon key={tone} points={`${X(a)},${Y(0)} ${curveSamples(integrand, a, b).map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')} ${X(b)},${Y(0)}`} className={`rv-area rv-${tone}`} />)}</>}</Plane><Table label="Independent cutoff magnitudes, not finite moments" headers={['Cutoff L', 'Positive side', 'Negative side at −L']} rows={[5, 10, 100].map(L => [L, fmt(cauchyMomentCutoff(L)), fmt(-cauchyMomentCutoff(L))])} /></Figure>;
}
export function ParetoThresholdFigure() {
  const alpha = 1.8,
    orders = [1, 1.8, 2.5];
  return <Figure job="C43" caption="For α=1.8 and x≥1, the k-th-moment tail integrand is αx^(k−α−1). The horizontal coordinate is log₁₀x, not x. Cutoff integrals alone are finite; the power derivation distinguishes a finite limit for k<α, logarithmic divergence at k=α and power divergence above α."><Plane label="Three true Pareto moment integrands on a log-x coordinate" xRange={[0, 2]} yRange={[0, 2]} xTicks={[0, 1, 2]} yTicks={[0, 1, 2]} xLabel="log₁₀ x: x = 1, 10, 100" yLabel="moment integrand per dx" curves={orders.map((k, i) => ({
      fn: z => alpha * (10 ** z) ** (k - alpha - 1),
      tone: ['gold', 'blue', 'rose'][i]
    }))} /><Table label="Exact analytic cutoff integrals, separate from improper limits" headers={['Moment order', 'At cutoff 10', 'At cutoff 100', 'Improper limit']} rows={orders.map(k => [k, fmt(paretoMomentCutoff(alpha, k, 10)), fmt(paretoMomentCutoff(alpha, k, 100)), k < alpha ? 'finite: 2.25' : k === alpha ? 'logarithmic ∞' : 'power ∞'])} /></Figure>;
}
export function DatasetStatisticFigure() {
  return <Figure job="C44" caption="The statistic takes a whole two-row dataset as input. Four independent fair-bit datasets each have probability 1/4; 01 and 10 map to the same average 1/2. The white ring selects one observed dataset. Copied bits retain only 00 and 11, each with probability 1/2."><MappingDrawing label="Four actual dataset inputs under the sample-average rule" rows={[{
      label: '00',
      value: 0,
      mass: .25
    }, {
      label: '01',
      value: .5,
      mass: .25
    }, {
      label: '10',
      value: .5,
      mass: .25
    }, {
      label: '11',
      value: 1,
      mass: .25
    }]} selected="01" /></Figure>;
}
export function PairCovarianceSumFigure() {
  return <Figure job="C46" caption="Every ordered pair of two readings contributes to the variance of their mean, then all four entries are divided by 4. Independent fair bits give 1/8; copied fair bits give 1/4. For n readings the full formula contains n² ordered cells, including both directions of each cross pair."><Compare><div><Table label="Independent two-reading covariance array" headers={['', 'Reading 1', 'Reading 2']} rows={[["Reading 1", '1/4', 0], ["Reading 2", 0, '1/4']]} /><p>Sum 1/2; divide by 2²: 1/8.</p></div><div><Table label="Copied two-reading covariance array" headers={['', 'Reading 1', 'Reading 2']} rows={[["Reading 1", '1/4', '1/4'], ["Reading 2", '1/4', '1/4']]} /><p>Sum 1; divide by 2²: 1/4.</p></div></Compare><Table label="General n×n ordered covariance array; ellipses represent actual omitted indices" headers={['', 'X₁', 'X₂', '…', 'Xₙ']} rows={[["X₁", 'Var(X₁)', 'Cov(X₁,X₂)', '…', 'Cov(X₁,Xₙ)'], ["X₂", 'Cov(X₂,X₁)', 'Var(X₂)', '…', 'Cov(X₂,Xₙ)'], ["…", '…', '…', '…', '…'], ["Xₙ", 'Cov(Xₙ,X₁)', 'Cov(Xₙ,X₂)', '…', 'Var(Xₙ)']]} /></Figure>;
}
export function BinomialArrangementsFigure() {
  return <Figure job="C47" caption="The sixteen literal four-bit arrangements group by their number of ones. Six contain two ones, each carrying mass 1/16, so their common average 1/2 has probability 6/16. This is the combinatorial factor in the binomial law."><Scene label="All sixteen four-bit arrangements grouped by actual success count" height={420}>{[0, 1, 2, 3, 4].map((k, i) => {
        const rows = fourBitStrings.filter(r => r.count === k),
          top = 45 + i * 78;
        return <g key={k}><Label x={18} y={top - 15} anchor="start">k={k}; mean {k / 4}; mass {rows.length}/16</Label>{rows.map((r, j) => <Label key={r.word} x={36 + j % 3 * 110} y={top + 10 + Math.floor(j / 3) * 27} tone={k === 2 ? 'gold' : 'blue'}>{r.word}</Label>)}</g>;
      })}</Scene></Figure>;
}
export function ChebyshevFigure() {
  const law = [{
    value: -2,
    mass: .125
  }, {
    value: 0,
    mass: .75
  }, {
    value: 2,
    mass: .125
  }];
  return <Figure job="C48" caption="Mean zero, variance one. At ε=2, the two bad outcomes have total probability 1/4 and each squared value is 4. Their weighted squared contribution is 1, attaining the bound 1/4. The zero outcome contributes no square."><LawDrawing law={law} range={[-2.5, 2.5]} ticks={[-2, 0, 2]} /><ResidualSquares pieces={law} center={0} /><Table label="Literal bad-event contribution" headers={['X', 'Bad: |X|≥2', 'p', 'pX²']} rows={law.map(r => [r.value, r.value === 0 ? 'no' : 'yes', r.mass, r.mass * r.value * r.value])} /></Figure>;
}
export function SampleCenteringFigure() {
  const state = sampleResiduals([1, 2, 4]);
  return <Figure job="C49" caption="The observed values [1,2,4] have mean 7/3. Their residuals −4/3,−1/3,5/3 sum to zero and squared sum is 14/3. This one linear constraint is visible; the unbiasedness proof additionally needs iid sampling and finite second moments."><NumberLine label="Actual observed positions and their sample mean" values={[1, 2, 4].map(value => ({
      value,
      mass: 1 / 3,
      massLabel: '1/3'
    }))} mean={state.mean} range={[0, 5]} units="observed value" /><SignedTerms label="Observed residuals sum to zero" range={[-2, 2]} terms={state.rows.map(r => ({
      label: `observation ${r.value} − mean 7/3`,
      value: r.residual
    }))} /><Table label="Every observed residual and square" headers={['Value', 'Residual', 'Residual²']} rows={state.rows.map(r => [r.value, fmt(r.residual), fmt(r.square)])} /></Figure>;
}
export function DenominatorTargetFigure() {
  return <Figure job="C50" caption="The same numerator 14/3 from the observed X values [1,2,4] enters two distinct targets. Division by 3 gives empirical-distribution variance 14/9. Division by 2 gives the iid population-variance estimator 7/3. The separately specified eight-outcome probability model uses population weights and ddof=0."><Scene label="Actual shared squared-residual numerator branches into two divisors" height={285}><Label x={170} y={30}>Σ(x−x̄)² = 14/3</Label><Arrow x1={150} y1={48} x2={75} y2={115} /><Arrow x1={190} y1={48} x2={265} y2={115} tone="blue" /><Label x={75} y={142}>divide by n=3</Label><Label x={265} y={142}>divide by n−1=2</Label><Label x={75} y={183}>14/9</Label><Label x={265} y={183}>7/3</Label><Label x={75} y={225}>empirical variance</Label><Label x={265} y={225}>iid estimator</Label><Label x={170} y={272}>different targets, same observed rows</Label></Scene><Table label="All three paired rows, retained together" headers={['Row', 'X', 'Y']} rows={[[1, 1, 2], [2, 2, 1], [3, 4, 3]]} /></Figure>;
}
export function StreamingRecenterFigure() {
  return <Figure job="C51" caption="After [1,2], old mean is 1.5 and M₂=.5. New value 4 gives δ=2.5, new mean 7/3, and new-point residual 5/3. The update adds δ×(5/3)=25/6, making M₂=14/3; the old residuals must be recentered too."><Compare><div><NumberLine label="Old centered prefix [1,2]" values={[{
          value: 1,
          mass: .5
        }, {
          value: 2,
          mass: .5
        }]} mean={1.5} range={[0, 5]} units="old mean 1.5" /></div><div><NumberLine label="All three values around the updated mean" values={[1, 2, 4].map(value => ({
          value,
          mass: 1 / 3,
          massLabel: '1/3'
        }))} mean={7 / 3} range={[0, 5]} units="new mean 7/3" /></div></Compare><Table label="Actual old-point recentering and new point" headers={['Value', 'Old residual', 'New residual', 'New square']} rows={[[1, '−1/2', '−4/3', '16/9'], [2, '1/2', '−1/3', '1/9'], [4, 'new point', '5/3', '25/9']]} /></Figure>;
}
export function CancellationFigure() {
  return <Figure job="C52" caption="The stored values are 10¹²−1,10¹²,10¹²+1. The numerical line displays offsets from 10¹² so the residuals −1,0,1 remain visible. Centered sum 2 gives population variance 2/3. Subtracting raw second moments near 10²⁴ can lose that small difference in floating point."><NumberLine label="Literal stored readings on an explicitly translated numerical axis" values={[-1, 0, 1].map(value => ({
      value,
      mass: 1 / 3
    }))} mean={0} range={[-2, 2]} units="offset from 10¹² (same original units)" /><Compare><div><Table label="Centered arithmetic" headers={['Stored value', 'Residual', 'Residual²']} rows={[["10¹²−1", -1, 1], ["10¹²", 0, 0], ["10¹²+1", 1, 1]]} /></div><div><Table label="Exact real arithmetic, before floating-point subtraction" headers={['Quantity', 'Exact value']} rows={[["E[X²]", '10²⁴ + 2/3'], ["E[X]²", '10²⁴'], ["Difference", '2/3']]} /></div></Compare></Figure>;
}
