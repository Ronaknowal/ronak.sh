import { useState } from 'react';
import { angleDirection, diagonal, dot, formatNumber, originalRows, perpendicular, projection, recordColors, recordNames } from "../../data/pca-geometry.js";
import { covarianceEllipse, denoisePoint, ppcaQuery, rankOneTables, squareProjector, squareRows, whiteningState } from "../../data/pca-spectral.js";
import { wineState } from "../../data/pca-wine-state.js";
import { CoordinatePlane } from './PcaReadingFlowFoundation.jsx';
import { Arrow, Controls, Drawing, Figure, Matrix, NumberField, Point, useNumericDrafts } from './PcaReadingFlowPrimitives.jsx';

export function RayleighAnatomy() {
  const weights = [.8, .6];
  const direction = diagonal.map((value, index) => weights[0] * value + weights[1] * perpendicular[index]);
  return <Figure job="D36" title="A unit ruler divides one unit of squared weight between eigenaxes"
    description="A covariance ellipse and unit-weight circle show a1=.8 and a2=.6. The squares .64 and .36 feed weighted variance 6 and two-thirds."
    caption="Concrete unit combination: .8² + .6² = 1; variance 6×.64 + (2/3)×.36 = 4.08 ≤ 6. All weight on v1 reaches 6. This is an exact covariance comparison, not a sampled uncertainty contour.">
    <Drawing width={350} height={530} title="Ellipse axes, a unit vector and weighted squares"
      description="The two perpendicular eigenaxes have lengths square root of six and square root of two-thirds. The unit ruler has projections .8 and .6 onto those axes; its squared weights feed a two-term sum.">
      <g transform="translate(174,159)">
        <ellipse rx={Math.sqrt(6) * 47} ry={Math.sqrt(2 / 3) * 47} transform="rotate(-45)" fill="none" stroke="#888" strokeWidth={2} />
        <circle r={47} fill="none" stroke="#555" strokeDasharray="4 3" />
        <Arrow x1={0} y1={0} x2={diagonal[0] * 117} y2={-diagonal[1] * 117} color="#4EA3D8" />
        <Arrow x1={0} y1={0} x2={perpendicular[0] * 53} y2={-perpendicular[1] * 53} color="#AB83D8" />
        <Arrow x1={0} y1={0} x2={direction[0] * 47} y2={-direction[1] * 47} color="#efbd6d" />
        <path d={`M0,0 L${.8 * diagonal[0] * 47},${-.8 * diagonal[1] * 47} L${direction[0] * 47},${-direction[1] * 47}`}
          stroke="#4EA3D8" fill="none" strokeDasharray="3 3" />
        <text x={-90} y={-20} fill="#4EA3D8">a1 = .8</text>
        <text x={-90} y={21} fill="#AB83D8">a2 = .6</text>
        <text x={75} y={-86} fill="#4EA3D8">v1, λ1 = 6</text>
        <text x={36} y={66} fill="#AB83D8">v2, λ2 = 2/3</text>
        <text x={-110} y={-96}>Unit circle</text>
      </g>
      <text x={15} y={302}>a1 = .8; a2 = .6; a1² + a2² = 1</text>
      {[.64, .36].map((weight, index) => <g key={index} transform={`translate(${28 + index * 171},330)`}>
        <rect width={100 * Math.sqrt(weight)} height={100 * Math.sqrt(weight)} fill={index ? '#AB83D8' : '#4EA3D8'} fillOpacity={.25} stroke={index ? '#AB83D8' : '#4EA3D8'} />
        <text x={0} y={109}>Weight {weight}</text>
        <text x={0} y={139}>× {index ? '2/3' : '6'} = {index ? '.24' : '3.84'}</text>
      </g>)}
      <text x={15} y={511}>3.84 + .24 = 4.08; maximum = 6</text>
    </Drawing>
  </Figure>;
}

export function OuterProductAnatomy() {
  const tables = rankOneTables();
  return <Figure job="D37" title="Two rank-one tables add to the centered measurements"
    description="Each left singular column scales a feature-direction row into a four-by-two outer-product table. The two tables have squared lengths 18 and 2."
    caption="Keep the first table and discard the second: squared Frobenius loss 2; Frobenius norm √2; spectral norm √2. These norm names refer to different operations. A singular-value tie at the retained boundary can make a minimizing subspace nonunique.">
    <Drawing width={370} height={330} title="A singular column times a direction row"
      description="Four row scalars from U times the first singular value multiply a two-cell direction row. All eight resulting cells are shown with the original record hues.">
      <text x={15} y={28}>s1 u1 column × v1 row</text>
      <text x={189} y={64}>1/√2</text><text x={279} y={64}>1/√2</text>
      {tables[0].map((row, index) => <g key={index}>
        <text x={15} y={108 + index * 53} fill={recordColors[index]}>{recordNames[index]}: {formatNumber((index < 2 ? -.5 : .5) * Math.sqrt(18))}</text>
        <Arrow x1={130} y1={103 + index * 53} x2={161} y2={103 + index * 53} color={recordColors[index]} />
        {row.map((value, column) => <g key={column}>
          <rect x={178 + 90 * column} y={82 + index * 53} width={73} height={38} stroke={recordColors[index]} fill="none" />
          <text x={215 + 90 * column} y={108 + index * 53} textAnchor="middle">{formatNumber(value)}</text>
        </g>)}
      </g>)}
    </Drawing>
    <div className="pca-comparison">
      <Matrix values={tables[0]} rowLabels={recordNames} columnLabels={['x', 'y']} label="First outer product; squared Frobenius length 18" />
      <Matrix values={tables[1]} rowLabels={recordNames} columnLabels={['x', 'y']} label="Second outer product; squared Frobenius length 2" />
      <Matrix values={tables[0].map((row, index) => row.map((value, column) => value + tables[1][index][column]))}
        rowLabels={recordNames} columnLabels={['x', 'y']} label="Sum: original centered table" />
    </div>
  </Figure>;
}

export function DecorrelationAndDependence() {
  const fit = projection(originalRows, diagonal, 2);
  return <Figure job="D37a" title="Fitted score covariance zero does not establish independence"
    description="Four fitted score-product lanes cancel. A separate three-point joint distribution has zero covariance but a deterministic squared relationship."
    caption="Fitted cross-products +1.5−1.5−1.5+1.5 = 0, with sample variances 6 and 2/3. Separately U∈{−1,0,1}, W=U², each mass 1/3: covariance 0, but P(U=0|W=0)=1 rather than P(U=0)=1/3. The joint middle mass 1/3 differs from independent product 1/9.">
    <Matrix values={fit.records.map(record => [...record.scores, record.scores[0] * record.scores[1]])}
      rowLabels={recordNames} columnLabels={['Score 1', 'Score 2', 'Product']} label="Four fitting rows supply the actual cross-product sum" />
    <Drawing width={350} height={400} title="Three joint masses and a conditional slice"
      description="Three points follow W=U squared. The middle point is the only W0 record; its entire conditional mass is one. Separate marginal and independent-product rails expose the unequal probabilities.">
      <line x1={45} y1={184} x2={310} y2={184} stroke="#aaa" />
      <line x1={175} y1={40} x2={175} y2={200} stroke="#aaa" />
      {[-1, 0, 1].map(value => <g key={value}>
        <Point x={175 + value * 110} y={184 - value ** 2 * 110} color={value ? '#4EA3D8' : '#efbd6d'} />
        <text x={175 + value * 110} y={211} textAnchor="middle">{value}</text>
        <text x={175 + value * 110} y={value ? 50 : 164} textAnchor="middle">Mass 1/3</text>
      </g>)}
      <text x={15} y={30}>W = U²; horizontal U, vertical W</text>
      {[['Conditional middle', 1, '#efbd6d'], ['Marginal middle', 1 / 3, '#4EA3D8'], ['Independent product', 1 / 9, '#AB83D8']].map(([name, value, color], index) => <g key={name}>
        <text x={15} y={251 + index * 53}>{name}: {formatNumber(value)}</text>
        <line x1={15} y1={268 + index * 53} x2={325} y2={268 + index * 53} stroke="#444" />
        <line x1={15} y1={268 + index * 53} x2={15 + 310 * value} y2={268 + index * 53} stroke={color} strokeWidth={8} />
      </g>)}
    </Drawing>
  </Figure>;
}

export function RankCases() {
  const cases = [
    { name: 'Original', rows: originalRows, mean: [3, 2], singular: '√18, √2', rank: 2, direction: diagonal, note: 'k = 1 loss 2; unique leading projector' },
    { name: 'Collinear', rows: [[-2, -2], [-1, -1], [1, 1], [2, 2]], mean: [0, 0], singular: '√20, 0', rank: 1, direction: diagonal, note: 'k = 1 training loss 0; query(1,−1) loss 2' },
    { name: 'Constant', rows: [[3, 2], [3, 2], [3, 2], [3, 2]], mean: [3, 2], singular: '0, 0', rank: 0, direction: null, note: 'k = 0 loss 0; no preferred axis; share undefined' },
    { name: 'Square', rows: squareRows, mean: [0, 0], singular: '2, 2', rank: 2, direction: [1, 0], note: 'k = 1 loss 4; every line minimizes' }
  ];
  return <Figure job="D38" title="Four fixed geometries separate rank and uniqueness"
    description="Original, collinear, constant and tied-square point sets remain visible together with their own spectra, projectors and meanings."
    caption="Centered rank ≤ min(n−1,d). Exact zero in these constructed cases is distinct from a numerical threshold. The full square projector is I, even though individual tied basis directions are arbitrary; the constant fitted range is the zero space.">
    <div className="pca-comparison">{cases.map(state => <div key={state.name}>
      <CoordinatePlane rows={state.rows} mean={state.mean} direction={state.direction} title={`${state.name} geometry`} extent={[[-3, 7], [-3, 7]]} spreadLabels
        referenceCaption labelOffsets={state.name === 'Collinear' ? [[-16, -10], [-31, -32], [25, 38], [25, -32]] : undefined} />
      <p>{state.name}: singular values {state.singular}; rank {state.rank}. {state.note}.</p>
      <Matrix values={state.rank === 0 ? [[0, 0], [0, 0]] : state.name === 'Square' ? [[1, 0], [0, 0]] : [[.5, .5], [.5, .5]]}
        columnLabels={['Column 1', 'Column 2']} label={`${state.name}: ${state.rank === 0 ? 'fitted-range projector P0' : 'shown k1 projector'}`} />
    </div>)}</div>
  </Figure>;
}

export function TiedSquare() {
  const input = useNumericDrafts([0, 1], [[0, 180], [0, 2, true]]);
  const [angle, kept] = input.values;
  const state = squareProjector(angle, kept);
  return <Figure job="D38a" title="Different tied axes can have the same optimal loss"
    description="Angle changes a ruler through the fixed square. Kept count 0,1,2 selects zero, the current line projector or the full identity operator."
    caption={`Fixed square, angle ${angle}°, k ${kept}. Computed SSE ${state.loss}. Exact expected SSE is ${[8, 4, 0][kept]}; tiny residual arithmetic is not a new scientific difference. k = 0 and k = 2 operators are invariant; k = 1 feet can move without changing optimal loss.`}>
    <CoordinatePlane rows={squareRows} mean={[0, 0]} direction={state.direction}
      feet={state.records.map(record => record.decoded)} extent={[[-2, 2], [-2, 2]]} title="Tied square and current decoded feet" />
    <Controls onReset={input.reset}>
      <NumberField state={input} index={0} label="Tied square ruler angle" min={0} max={180} />
      <NumberField state={input} index={1} label="Tied square kept count" min={0} max={2} step={1} />
    </Controls>
    <Matrix values={state.projector} columnLabels={['x column', 'y column']} label="Actual current projector; fixed range −1 to 1" />
    <Matrix values={state.records.map(record => [...record.scores, ...record.decoded, record.loss])}
      rowLabels={recordNames} columnLabels={['Score 1', 'Score 2', 'Decoded x', 'Decoded y', 'Loss']}
      label="The same record identities address scores, feet and dropped squared lengths" />
  </Figure>;
}

function EllipseComparison({ gap }) {
  const original = covarianceEllipse([[1 + gap, 0], [0, 1]]);
  const changed = covarianceEllipse([[1 + gap, .01], [.01, 1]]);
  return <Drawing width={350} height={310} title={`Covariance sensitivity at gap ${gap}`}
    description="Both ellipses use identical unit scales. Gray zero-off-diagonal covariance is compared with the blue covariance whose off-diagonal is .01; an arrow shows the actual leading rotation.">
    <g transform="translate(175,151)">
      <ellipse rx={70 * original.radii[0]} ry={70 * original.radii[1]} stroke="#999" strokeDasharray="4 3" fill="none" />
      <ellipse rx={70 * changed.radii[0]} ry={70 * changed.radii[1]} transform={`rotate(${-changed.degrees})`} stroke="#4EA3D8" fill="none" strokeWidth={2} />
      <Arrow x1={0} y1={0} x2={100 * Math.cos(changed.degrees * Math.PI / 180)} y2={-100 * Math.sin(changed.degrees * Math.PI / 180)} color="#efbd6d" />
    </g>
    <text x={15} y={26}>C = [[1+{gap}, .01], [.01, 1]]</text>
    <text x={15} y={284}>Rotation {formatNumber(changed.degrees)}°; baseline 0°</text>
    <text x={15} y={307}>Equal units; exact finite covariance comparison</text>
  </Drawing>;
}

export function NumericalPolicies() {
  return <Figure job="D39" title="Conditioning, orthogonality and rank are separate decisions"
    description="Singular scales1 and ten-to-minus-eight become squared scales1 and ten-to-minus-sixteen. Two vector pairs distinguish normalized dot from tiny length. Two covariance ellipses distinguish eigengap sensitivity."
    caption="Forming AᵀA squares the condition number. The Jacobi stop test bounds |dot|/(norm 1×norm 2); relative numerical rank and relative eigenvalue tie use different policies. This does not assert that a small value disappears on every machine or provide an uncertainty band.">
    <Drawing width={370} height={350} title="Three explicitly distinct numerical comparisons"
      description="Dimensioned singular and squared-scale lanes are followed by parallel and perpendicular tiny-vector fixtures. A magnified tiny length is explicitly labelled rather than drawn to physical scale.">
      <text x={15} y={29}>A singular values: 1, 10⁻⁸</text>
      <Arrow x1={171} y1={44} x2={171} y2={74} />
      <text x={15} y={102}>AᵀA scales: 1, 10⁻¹⁶</text>
      <text x={15} y={139}>Condition number: 10⁸ → 10¹⁶</text>
      <Arrow x1={50} y1={200} x2={174} y2={200} color="#4EA3D8" />
      <Arrow x1={50} y1={207} x2={104} y2={207} color="#AB83D8" />
      <text x={191} y={203}>Parallel: normalized dot 1</text>
      <Arrow x1={50} y1={290} x2={174} y2={290} color="#4EA3D8" />
      <Arrow x1={50} y1={290} x2={50} y2={239} color="#AB83D8" />
      <text x={191} y={269}>Perpendicular: dot 0</text>
      <text x={15} y={337}>Violet length 10⁻¹³ magnified for direction only</text>
    </Drawing>
    <div className="pca-comparison"><EllipseComparison gap={1} /><EllipseComparison gap={.001} /></div>
  </Figure>;
}

export function WhiteningComparison() {
  const input = useNumericDrafts([1], [[1, 2, true]]);
  const kept = input.values[0];
  const state = whiteningState(kept);
  return <Figure job="D40" title="Whitening changes score units and preserves the paired inverse"
    description="Original and whitened score lanes remain visible together. Every retained coordinate divides by its own fitted square-root sample variance and multiplies back before decoding."
    caption={`k ${kept}: sample variances after whitening ${state.sampleVariances.map(value => formatNumber(value)).join(', ')}; population variances ${state.populationVariances.map(value => formatNumber(value)).join(', ')}. Paired inverse whitening leaves the raw retained reconstruction unchanged. A zero-variance retained direction cannot supply a reciprocal scale; this control uses only the two positive directions.`}>
    <Drawing width={370} height={70 + 132 * kept} title="Two permanently visible score and inverse lanes"
      description="A's original scores and divided scores travel through separate paths. The whitened path multiplies the same square-root factors back before the shared decoder.">
      <text x={15} y={26}>A's retained coordinate paths</text>
      {state.scores[0].map((value, index) => <g key={index} transform={`translate(0,${47 + index * 132})`}>
        <text x={15} y={20}>PC{index + 1} original {formatNumber(value)}</text>
        <Arrow x1={15} y1={35} x2={118} y2={35} color="#4EA3D8" />
        <text x={135} y={41}>Unwhitened decoder input</text>
        <text x={15} y={76}>Divide by {formatNumber(state.factors[index])} → {formatNumber(state.white[0][index])}</text>
        <Arrow x1={15} y1={91} x2={118} y2={91} color="#AB83D8" />
        <text x={135} y={97}>× same factor → {formatNumber(state.restored[0][index])}</text>
      </g>)}
    </Drawing>
    <Controls onReset={input.reset}><NumberField state={input} index={0} label="Whitened kept count" min={1} max={2} step={1} /></Controls>
    <div className="pca-comparison">
      <Matrix values={state.scores} rowLabels={recordNames} label="Unwhitened score lanes" />
      <Matrix values={state.white} rowLabels={recordNames} label="Whitened score lanes; same four rows" />
      <Matrix values={state.unwhitenedDecoded} rowLabels={recordNames} columnLabels={['Centered x', 'Centered y']} label="Unwhitened inverse" />
      <Matrix values={state.decoded} rowLabels={recordNames} columnLabels={['Centered x', 'Centered y']} label="Whitened paired inverse; same retained raw geometry" />
    </div>
  </Figure>;
}

export function ProbabilisticAnatomy() {
  return <Figure job="D41" title="A latent coordinate plus independent noise creates observed covariance"
    description="One latent scalar multiplies two loading coefficients, adds the shared mean and then separate isotropic-noise inputs. An ellipse shows the resulting exact covariance."
    caption="t∼N(0,1), W=2v1, noise covariance .5I. WWᵀ+.5I = [[2.5,2],[2,2.5]], spectrum 4.5/.5. The ellipse is model covariance, not a random sample. Latent value, noise values and observed measurements are distinct objects.">
    <Drawing width={370} height={330} title="One latent port, two loadings and two noise ports"
      description="A shared scalar fans out to two products. Each product adds its own mean coordinate and noise input before producing the corresponding observed x or y.">
      <circle cx={57} cy={154} r={27} stroke="#efbd6d" fill="none" />
      <text x={57} y={160} textAnchor="middle">t</text>
      {[0, 1].map(column => <g key={column}>
        <Arrow x1={85} y1={154} x2={140} y2={77 + column * 158} color="#efbd6d" />
        <text x={151} y={82 + column * 158}>× √2</text>
        <Arrow x1={204} y1={77 + column * 158} x2={236} y2={77 + column * 158} />
        <circle cx={259} cy={77 + column * 158} r={18} stroke="#ddd" fill="none" />
        <text x={259} y={83 + column * 158} textAnchor="middle">+</text>
        <text x={211} y={37 + column * 158}>Mean {column ? 2 : 3}</text>
        <Arrow x1={259} y1={43 + column * 158} x2={259} y2={56 + column * 158} />
        <text x={172} y={125 + column * 158}>Noise ε{column + 1}: variance .5</text>
        <Arrow x1={259} y1={108 + column * 158} x2={259} y2={99 + column * 158} color="#AB83D8" />
        <Arrow x1={280} y1={77 + column * 158} x2={315} y2={77 + column * 158} />
        <text x={324} y={83 + column * 158} fill={column ? '#AB83D8' : '#4EA3D8'}>{column ? 'y' : 'x'}</text>
      </g>)}
      <text x={15} y={30}>Latent prior variance 1</text>
    </Drawing>
    <Drawing width={350} height={315} title="Exact probabilistic covariance ellipse"
      description="An ellipse on equal unit scales has semiaxes square root of4.5 and square root of.5, rotated45 degrees.">
      <g transform="translate(175,151)">
        <line x1={-125} y1={0} x2={125} y2={0} stroke="#444" />
        <line x1={0} y1={-125} x2={0} y2={125} stroke="#444" />
        <ellipse rx={Math.sqrt(4.5) * 49} ry={Math.sqrt(.5) * 49} transform="rotate(-45)" stroke="#4EA3D8" fill="none" strokeWidth={2} />
        <Arrow x1={0} y1={0} x2={Math.sqrt(4.5) * 49 / Math.sqrt(2)} y2={-Math.sqrt(4.5) * 49 / Math.sqrt(2)} color="#efbd6d" />
      </g>
      <text x={15} y={27}>Observed covariance; equal x/y scales</text>
      <text x={15} y={288}>Semiaxes √4.5, √.5; same physical unit</text>
      <text x={15} y={312}>Noise adds .5 to both covariance eigenvalues</text>
    </Drawing>
  </Figure>;
}

export function PosteriorVersusFoot() {
  const input = useNumericDrafts([6, 4], [[-10, 10], [-10, 10]]);
  const state = ppcaQuery(input.values);
  return <Figure job="D42" title="The posterior mean shrinks toward the fitted mean"
    description="The query score forms the right-hand side 2z; the stored scalar M = 4.5 gives the latent posterior mean. Loading times that mean gives a decoded point distinct from the orthogonal foot."
    caption={`Query (${input.values.join(', ')}): z ${state.score}; RHS 2z ${state.rhs}; M = 4.5; latent mean ${state.latentMean}; posterior variance 1/9. PCA decode (${state.decoded.join(', ')}); posterior decode (${state.posteriorDecoded.join(', ')}). Posterior variance is distinct from squared reconstruction loss.`}>
    <CoordinatePlane rows={[input.values, state.decoded, state.posteriorDecoded]} mean={[3, 2]} direction={diagonal}
      extent={[[-12, 12], [-12, 12]]} title="Query A, orthogonal foot B and posterior decode C"
      rowLabels={['A: query', 'B: PCA foot', 'C: posterior']}
      labelOffsets={[[12, -42], [27, -9], [-99, 41]]} />
    <Drawing width={370} height={300} title="Current posterior scalar solve"
      description="Actual centered query products form z. Twice z divides by M = 4.5; the posterior mean multiplies W and adds the stored mean. The unchanged orthogonal baseline remains beside it.">
      <text x={15} y={29}>z = ({formatNumber(state.displacement[0])} + {formatNumber(state.displacement[1])}) / √2</text>
      <text x={15} y={66}>2z = {formatNumber(state.rhs)}</text>
      <Arrow x1={198} y1={61} x2={233} y2={61} />
      <text x={245} y={66}>÷ 4.5</text>
      <text x={15} y={107}>Posterior latent m = {formatNumber(state.latentMean)}</text>
      <text x={15} y={153}>Wm displacement = ({state.posteriorDisplacement.map(value => formatNumber(value)).join(', ')})</text>
      <text x={15} y={197}>+ mean → ({state.posteriorDecoded.map(value => formatNumber(value)).join(', ')})</text>
      <line x1={15} y1={216} x2={350} y2={216} stroke="#555" />
      <text x={15} y={251}>Baseline zv1 + mean remains</text>
      <text x={15} y={284}>({state.decoded.map(value => formatNumber(value)).join(', ')})</text>
    </Drawing>
    <Controls onReset={input.reset}>
      <NumberField state={input} index={0} label="Posterior query x" min={-10} max={10} />
      <NumberField state={input} index={1} label="Posterior query y" min={-10} max={10} />
    </Controls>
  </Figure>;
}

function NoiseLane({ amount, parallel }) {
  const state = denoisePoint(amount, parallel);
  const x = value => 45 + (value + 1) * 42;
  const y = value => 290 - (value + 1) * 42;
  return <Drawing width={350} height={370} title={`${parallel ? 'Parallel' : 'Perpendicular'} noise and its decode`}
    description="The clean point is gray, noisy point blue and decoded point amber. Dashed and solid role segments distinguish the noisy-input residual from the clean-target error, including coincident zero states.">
    <text x={15} y={25}>{parallel ? 'Parallel noise (a,a)' : 'Perpendicular noise (a,−a)'}</text>
    <rect x={45} y={38} width={252} height={252} stroke="#555" fill="none" />
    {[-1, 1, 3, 5].map(value => <g key={value}>
      <text x={x(value)} y={312} textAnchor="middle">{value}</text>
      <text x={33} y={y(value) + 4} textAnchor="end">{value}</text>
    </g>)}
    <line x1={x(state.noisy[0])} y1={y(state.noisy[1])} x2={x(state.decoded[0])} y2={y(state.decoded[1])} stroke="#4EA3D8" strokeDasharray="4 3" strokeWidth={2} />
    <line x1={x(state.clean[0])} y1={y(state.clean[1])} x2={x(state.decoded[0])} y2={y(state.decoded[1])} stroke="#efbd6d" strokeWidth={2} />
    <Point x={x(state.clean[0])} y={y(state.clean[1])} color="#ddd" hollow label="Clean" dx={-45} dy={-15} />
    <Point x={x(state.noisy[0])} y={y(state.noisy[1])} color="#4EA3D8" shape={1} label="Noisy" dx={9} dy={-12} />
    <Point x={x(state.decoded[0])} y={y(state.decoded[1])} color="#efbd6d" hollow shape={2} label="Decode" dx={8} dy={23} />
    <text x={15} y={339}>Clean-target squared error {formatNumber(state.cleanLoss)}</text>
    <text x={15} y={367}>Noisy-input squared residual {formatNumber(state.inputLoss)}</text>
  </Drawing>;
}

export function SampleNoiseAndDenoising() {
  const input = useNumericDrafts([1], [[0, 2]]);
  const ratios = wineState.gaussianSpectrum.ratios;
  return <Figure job="D43" title="An empirical leading spectrum and a fixed denoising geometry are different calculations"
    description="All twenty saved sample fractions appear against the uniform population reference. Separate permanently visible noise orientations test clean-target error versus noisy-input residual."
    caption={`Saved Gaussian spectrum: shape 40×20, seed 23; first two sample fractions sum ${ratios[0] + ratios[1]}, population fixed two-axis share .1. Raw sample rows were not retained. The live two-point calculation uses fixed projection, not a new Gaussian fit.`}>
    <Drawing width={570} height={345} title="Twenty measured sample fractions and uniform population reference"
      description="All bars use the same zero-to-one vertical scale. A dashed horizontal reference .05 represents the isotropic population fraction per fixed coordinate, not another fitted sample.">
      {[0, .25, .5, .75, 1].map(value => <g key={value}>
        <line x1={52} y1={282 - value * 240} x2={532} y2={282 - value * 240} stroke="#444" />
        <text x={42} y={287 - value * 240} textAnchor="end">{value}</text>
      </g>)}
      {ratios.map((value, index) => <g key={index}>
        <rect x={58 + index * 24} y={282 - value * 240} width={14} height={value * 240} fill="#4EA3D8" />
        <text x={65 + index * 24} y={307} textAnchor="middle">{index + 1}</text>
      </g>)}
      <line x1={52} y1={270} x2={532} y2={270} stroke="#efbd6d" strokeDasharray="5 3" />
      <text x={15} y={27}>Common fraction scale 0–1; amber population .05</text>
      <text x={290} y={339} textAnchor="middle">All twenty saved sample components</text>
    </Drawing>
    <Matrix values={ratios.map(value => [value, .05])} rowLabels={ratios.map((_, index) => `PC${index + 1}`)}
      columnLabels={['Saved sample fraction', 'Population fixed-axis fraction']}
      label="Exact saved spectrum and theoretical population reference" exactNumbers />
    <div className="pca-comparison"><NoiseLane amount={input.values[0]} parallel={false} /><NoiseLane amount={input.values[0]} parallel /></div>
    <Controls onReset={input.reset}><NumberField state={input} index={0} label="Noise amount a" min={0} max={2} /></Controls>
  </Figure>;
}

export const spectralDrawings = {
  D36: RayleighAnatomy,
  D37: OuterProductAnatomy,
  D37a: DecorrelationAndDependence,
  D38: RankCases,
  D38a: TiedSquare,
  D39: NumericalPolicies,
  D40: WhiteningComparison,
  D41: ProbabilisticAnatomy,
  D42: PosteriorVersusFoot,
  D43: SampleNoiseAndDenoising
};
