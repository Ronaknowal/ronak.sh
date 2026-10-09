# Dynamical Systems Theory & Chaos — visual and interaction specifications r1

Complete content specification accompanying `manuscript-r1.md`; implementation has not started. Each D marker names an inline teaching placement. It is preceded by the actual manuscript lead and followed by its explanation. The drawing renders before its controls; controls appear only after every quantity they expose has been taught. The accepted design/research are bound in the content packet; the present contracts supply the concrete construction and state behavior.

## Shared visual grammar and reader behavior

Use the existing charcoal surface with actual-theme contrast verification at runtime. Amber #efb95f identifies q/input/reference; blue #76b9ed identifies p/second coordinate/comparison; violet #bb9be8 identifies derived radius/tangent; coral #ec8f82 identifies correction or forward Euler error. Neutral #e4e1db gives exact/reference outlines, muted #9aa1ab gives guides. No green or olive decoration. Local legends make reassigned method identities explicit: exact neutral dashed, Euler coral squares, symplectic blue circles. Colour never carries information alone. Label curves directly; use filled/open/half-filled equilibrium markers, a start ring and a selected solid point with explicit role text.

Draw the actual quantities specified below, not decorative panels of sentences. Prefer topic-local responsive SVG with exterior HTML labels and ordinary prose, no card around the entire explanation. Text inherits the actual reader font size, including SVG labels. At 16→32→16 root text size, labels must change their measured size and return without clipping. Measure the available lesson column, not the viewport: a 768 px viewport may provide only about 386 px of content before inner padding. Stack linked planes/operation rows, wrap exterior labels, prune optional ticks and increase height; never shrink text or make the main mechanism horizontally scroll. Equal coordinate units stay equal after reflow. Only complete code and inherently wide optional tables may scroll locally.

Every figure has a short visible caption plus an accessible name and text summary describing the actual operation and selected/default outcome. Screen-reader output includes current equation, initial state, units, selected time/state, exceptional cases and relevant bounds. Decorative paths are hidden from accessibility trees when an equivalent structured description is present. Focus rings remain visible. Range controls have explicit labels and keyboard step behavior; direct editors are available wherever the contract promises arbitrary allowed values. Controls use actual button/input semantics. Validation messages attach to their editor and do not repeatedly announce unchanged results. No automatic animation is required; any added playback starts paused, has a pause control, stops on interaction and respects reduced motion.

Numeric drafts accept complete finite tokens. Valid values commit immediately; incomplete or invalid tokens keep the last valid computation visible and explain the constraint locally. Coupled validation checks the entire proposed state. Reset restores all values, selections, cursor, drafts and errors even when committed values already equal defaults. Shared resets are explicitly scoped; an independent later family never replaces an earlier model or changes its exposed controls. Static mathematical drawings and a useful reading fallback remain visible during lazy loading or a failed interactive chunk. A retry must not duplicate content or reset unrelated investigations.

## Fifty-six inline drawing contracts

All scalar coordinates and sample values below come from exact declared equations or preserved bounded models. No observed dataset is implied. Analytic previews do not require a new scientific execution. Derived numeric marks must use the model’s full precision and only format at display; exceptions, zero and infinities retain their mathematical meaning.

### D01 — Complete state

**Construction and default.** Two carts occupy q=0 on a horizontal position ruler [−2,2]. Give the upper cart velocity +1 and lower cart −1, equal-length opposite arrowheads. Their next positions after .25 time are +.25 and −.25, ghosted distinctly. Label velocity as state information, not a second position.

**Provenance.** Constructed constant-velocity fixture q(t)=q0+vt.

**Narrow/enlarged composition.** Stack the two complete rulers; wrap the common-state question outside the drawing.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D02 — Rate and finite increment

**Construction and default.** Cooling k=2,x0=8. Plot t in [0,.5], x in [0,9]; tangent at (0,8) has slope −16, and its h=.25 endpoint is ( .25,4). Exact endpoint is 8e^−.5≈4.852245. Draw h as horizontal width and the tangent increment −4 as vertical height.

**Provenance.** Exact exponential and left-endpoint Euler construction, C01.

**Narrow/enlarged composition.** One plot with exterior slope and finite-increment labels; keep the two endpoints and their gap visible.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D03 — Exact samples and Euler samples

**Construction and default.** Use k=2,x0=8,h=.25 at t=0,.25,.5,.75. Exact states 8e^−2t; Euler states 8,4,2,1. Join the exact curve smoothly and Euler sample squares by thin dotted segments labeled update, not true flow. Below it compose widths .25+.25 and mark Φ.5(x)=Φ.25(Φ.25(x)).

**Provenance.** C01 rule and exact cooling semigroup. Programme horizon 3 remains separately labeled.

**Narrow/enlarged composition.** Plot above a two-row time strip; retain equal physical-time alignments and avoid cramped formula text inside the plot.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D04 — Local lifetime

**Construction and default.** Draw x=1/(1−t) for t∈[0,.95], clip visible x at 10 with continuation arrow, y range [0,10]. Dashed vertical pole at t=1. Mark a short locally valid segment near t=0 and label maximal future interval [0,1). Do not draw the negative branch as a continuation.

**Provenance.** Exact solution of x′=x²,x0=1.

**Narrow/enlarged composition.** One plot; exterior interval statement and pole label wrap beneath.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D05 — Stability tube

**Construction and default.** Equilibrium 0, ε=.5, δ=.25, x0=.2. On t∈[0,2], x∈[−.6,.6], compare .2e^−t and .2e^t. Shade ±ε as a light guide region, show the smaller initial δ segment, and mark unstable exit at ln(2.5). Curve beyond upper range gets an arrow. State the stable inequality for all |x0|<δ, not just the pictured start.

**Provenance.** Accepted DY2 exact fixture.

**Narrow/enlarged composition.** Two plots with identical rulers if labels crowd; inequality and quantifiers stay outside.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D06 — Four equal linearizations do not tell the whole story

**Construction and default.** Start .25; t∈[0,4], x∈[0,.5]. Draw .25e^−t, .25/sqrt(1+.125t), constant .25, and .25/sqrt(1−.125t). Label exponential return, algebraic return, unchanged, departure. Positive cubic pole at t=8 is stated outside the displayed safe interval.

**Provenance.** C02 exact formulas; x′=−x adds the exponential comparison.

**Narrow/enlarged composition.** Two pairs with equal axes rather than four colliding inline labels; all t=4 values remain readable.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D07 — Jacobian acts on a disturbance

**Construction and default.** Construct F(q,p)=(−q+q²,−2p) at zero. Input η=(.1,.1); rate-plane Jη=(−.1,−.2), actual difference=(−.09,−.2), connecting remainder=(.01,0). Both planes use equal units and axes [−.25,.15]. Show remainder squared scaling ||R||≤||η||².

**Provenance.** Accepted DY2 analytic Taylor fixture.

**Narrow/enlarged composition.** Stack the state-disturbance plane above the rate-difference plane; retain separate axis titles so a rate is not called a next state.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D08 — Flow and map stability regions

**Construction and default.** Two complex planes, axes [−1.5,1.5], equal units. Flow shades Re λ<0 and marks −1±i,0,1; map shades |μ|<1 and marks .5±.5i,1,1.2. Dashed strict boundaries. Labels distinguish inverse-time λ from per-update dimensionless μ, and say boundary test inconclusive.

**Provenance.** Accepted matrices J=[[-1,-1],[1,-1]], M=[[.5,-.5],[.5,.5]].

**Narrow/enlarged composition.** Stack flow then map; matrices and point coordinates appear in exterior text, not tiny plot labels.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D09 — Cubic rate and phase line

**Construction and default.** Default a=1, x0=.2 for f=ax−x³. Rate plot x∈[−1.8,1.8], f∈[−8,8]; align root marks and sign arrows on an x phase line below. Fill attracting ±1, open repelling zero; arrows point to correct attractor. Other a values retain axes and exact zero-root multiplicity classification.

**Provenance.** Existing scalar model, analytic roots/signs; L1 pitchfork.

**Narrow/enlarged composition.** Rate plot above phase line; controls follow the sign explanation. No potential or time output yet.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D10 — Potential supplies the same arrows

**Construction and default.** Same L1 pitchfork state as D09. Plot V=x⁴/4−ax²/2 over x∈[−1.8,1.8], y∈[−.3,4.5]; show selected x on V, negative slope arrow and aligned time trace over [0,8]. Vdot=−f² appears beside the actual selected rate.

**Provenance.** C02 and retained scalarFlowState RK4 h=.02,T=8.

**Narrow/enlarged composition.** Stack potential, phase position and time; exterior readouts use the same state identity. No earlier D09 control gains untaught output.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D11 — Basins separate close starts

**Construction and default.** At a=1 compare exact phase-line flow starts −.2,+.2,0; x extent [−1.5,1.5], time [0,8]. Show left and right basin strips (−∞,0),(0,∞) with boundary 0; trajectories end toward −1,+1,0 respectively. Infinity ends use arrows, not false finite basin endpoints.

**Provenance.** Analytic sign flow, retained scalar model may supply trace samples.

**Narrow/enlarged composition.** Phase line above three small aligned time traces, with direct start/end labels rather than three sentence cards.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D12 — Local Lyapunov confinement

**Construction and default.** W=(x²−1)²/4 near +1. x∈[.7,1.3], W∈[0,.08]; horizontal level 1/64, positive component endpoints sqrt(3)/2 and sqrt(5)/2. Mark containment inside |x−1|<.25 and both arrows toward 1. Beneath, mark Wdot=0 within this component only at 1.

**Provenance.** Accepted DY2 local sublevel calculation.

**Narrow/enlarged composition.** Potential plot, phase interval, and set statement stack; retain true sublevel endpoints and level height.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D13 — Parameter branches

**Construction and default.** Pitchfork parameter a∈[−1,1], equilibrium x∈[−1.2,1.2]. Root branch x=0 filled/solid for a<0, boundary ring at a=0 labeled nonlinear attraction, open/dashed for a>0. Branches ±sqrt(a) solid for positive a. Direct parameter label says not time.

**Provenance.** Analytic roots and derivative, including −x³ at a=0.

**Narrow/enlarged composition.** One branch plot with sparse ticks and exterior line-style key. No animation that implies trajectories move along a parameter curve.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D14 — Tilted wells and folds

**Construction and default.** Independent L1 tilted model f=x−x³+b. Default b=0; options −.6,−2/(3sqrt3),0,+2/(3sqrt3),+.6. Rate/phase x∈[−1.8,1.8], potential V=x⁴/4−x²/2−bx. At exact folds mark the double root ±1/sqrt3 with half-filled symbol and opposing-side arrow behavior; do not misclassify by a near-zero derivative threshold.

**Provenance.** Analytic fold solutions and retained scalar solver.

**Narrow/enlarged composition.** Rate/phase and potential stack; b controls and initial editor are separate from D09/D10.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D15 — Quasistatic hysteresis

**Construction and default.** Use b horizontally [−.65,.65], equilibria x vertically [−1.5,1.5]; derive branches parametrically b=x³−x. Mark folds ±2/(3sqrt3), solid outer stable and dashed inner unstable branch. Two arrow paths follow opposite quasistatic sweeps and jump after loss of a well. Exact fold jump targets at the threshold are ±2/sqrt3 with the appropriate opposite sign.

**Provenance.** Analytic branch curve; schematic quasistatic continuation, not a finite-rate ODE run.

**Narrow/enlarged composition.** One branch plot; arrows carry sweep direction and label quasistatic. Place speed caveat in caption, never imply this is measured timing.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D16 — Phase plane and clock

**Construction and default.** Center q′=−p,p′=q, initial(1,0). L2 center-only state: T=4π,320 intervals,cursor160. Phase plane axes ±2 equal units; linked q(t),p(t) on time [0,4π], selected point and vertical time cursor share identity. Arrows show counterclockwise motion.

**Provenance.** Exact center solution and existing planar model.

**Narrow/enlarged composition.** Phase plane above aligned coordinate traces; selected q,p,time exterior. Preserve equal axis units in all widths.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D17 — Nullclines are component-zero sets

**Construction and default.** Same center-only L2 state. q′=0 on p=0, p′=0 on q=0. Draw horizontal and vertical nullclines with distinct dash patterns, intersection equilibrium, and small field arrows: on p=0 vertical motion, on q=0 horizontal motion. Selected point is shared with D16.

**Provenance.** Component equations, no new numerical evidence.

**Narrow/enlarged composition.** One equal-scale plane with exterior legend and two short component statements. Avoid labeling the entire nullcline stationary.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D18 — Center, spiral, saddle

**Construction and default.** Separate L2 comparison mount. Center (−p,q), spiral (−.4q−p,q−.4p), saddle (.4q,−.5p), start (1,0) by default; direct starts within [−1,1]². Center/spiral T=4π axes±2; saddle T=4 axes±5.5 with explicit clipping arrows if the growing q exceeds frame. Coordinate/radius traces distinguish recurrence, decay and escape.

**Provenance.** Retained exact planar functions; all three fields taught before their selector.

**Narrow/enlarged composition.** Selector above one equal-scale plane and stacked traces. Axis/horizon change is visibly announced; never silently compare different clock spans.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D19 — Nonnormal coordinate transfer

**Construction and default.** L3 exact triangular flow, default(0,1). On t∈[0,4π], show p0e^−2t, direct q0e^−t, transferred 6p0e^−t(1−e^−t), total q. Separate horizontal transfer arrow p→q at the matrix off-diagonal. Plane extent±2.5. Signed components retain their sign for negative starts.

**Provenance.** C03 and analytic linear solution.

**Narrow/enlarged composition.** Stack the component time plot and equal-scale state plane; use direct labels and do not encode transfer as a paragraph in a box.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D20 — Transient norm is not monotone

**Construction and default.** Share L3 state; add norm plot [0,2.5]. An exact-time action marks t=ln2 and actual analytic selected state, independent of the uniform-grid cursor. Default state(1.5,.25), norm1.520691; comparison start(1,0) gives(.5,0). Dashed initial-norm baseline makes amplification visible.

**Provenance.** C03 output and direct exact formula.

**Narrow/enlarged composition.** Plane above norm curve with aligned selected-state summary; exact-time badge clears on cursor change/reset.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D21 — Radial and tangential velocity

**Construction and default.** At a=1,(q,p)=(.3,.4), r=.5. Draw radial(.225,.3), tangential(−.4,.3), total(−.175,.6) as head-to-tail rate vectors anchored at the point. State ray and radius differ visually from rate arrows. Equal coordinate units, q[−.2,.7],p[−.1,1.1].

**Provenance.** Accepted DY2 exact decomposition; r′=.375, θ′=1.

**Narrow/enlarged composition.** Stack state/radius view and rate decomposition, with preserved scales and component labels. State that this a differs from L4 default.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D22 — Attracting radius

**Construction and default.** L4 default a=.25,r0=.3,phase0, T=4π,320 intervals,cursor160. Plot q,p axes±1.6 and r(t)∈[0,1.6], plus radial phase line. Mark origin and positive radius sqrt(a) only for a>0. Choices −.25,0,.25,1; direct r0[0,1.5].

**Provenance.** C04 exact radius evaluator; no Cartesian integration needed.

**Narrow/enlarged composition.** Plane then radial time plot then radial phase line. Controls expose radius and parameter only; no phase-offset or return quantities yet.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D23 — Squared radius reduces the equation

**Construction and default.** On a symbolic operation strip, take r→u=r², then udot=2u(a−u), solve the separated equation, return r=sqrt(u). Pair a=.25,r0=.3 curves on t[0,4π]: u scale[0,.3], r scale[0,.6]. Show a=0 limit u0/(1+2u0t) in exterior math; label different vertical units.

**Provenance.** C04 stable expm1 formula and analytic derivation.

**Narrow/enlarged composition.** Stack actual u/r curves and their conversion arrows; no pretend equal-height encoding of squared and unsquared radius.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D24 — Orbital attraction preserves phase

**Construction and default.** Share L4 a/r0/reference; add independent comparison offset φ=π/4. Two radius-matched paths have phase gap φ and Euclidean distance 2r(t)|sin(φ/2)|. For default a=.25 limit sin(π/8), not zero. φ=0 coincides; r0=0 has undefined phase and no rotating arrow.

**Provenance.** Analytic polar solution and geometric chord.

**Narrow/enlarged composition.** One plane with chord and two rays, then distance trace; direct phase editor is mounted here only.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D25 — Return section and map

**Construction and default.** Share L4 reference, section p=0,q>0 crossed upward. Mark initial section point separately and subsequent returns at2π,4π; show r0→P(r0)→P²(r0) beside section. At a=.25 fixed .5 and radial multiplier e^−π. Origin has no nontrivial crossing; a≤0 has no attracting-cycle multiplier.

**Provenance.** C04 exact radius_at and analytic P derivative.

**Narrow/enlarged composition.** Section plane above return-map plot; full period/return labels wrap outside. Do not call time0 a completed return.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D26 — Trapping annulus

**Construction and default.** For a=.25 use inner r=.25, outer r=.75. Draw annulus to equal scale in plane±.9, radial arrows inward relative to annulus on both boundaries, and moving tangent arrows. Origin lies in excluded hole. Print radial rates .046875 and −.234375 beside respective boundaries.

**Provenance.** Analytic r(a−r²), compact forward-invariance argument.

**Narrow/enlarged composition.** Single annulus with exterior boundary-rate rows; keep the hole visible and distinguish radial from tangential arrows.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D27 — Feedback cobweb

**Construction and default.** L5 early r=2.5,x0=.2,40updates,cursor1. Axes[0,1] equal scales; graph F and diagonal y=x. Vertical evaluation leg then horizontal feedback leg, selected state in an aligned sequence. First path .2→.4→.6→.6. No later-regime selector in initial mount.

**Provenance.** Retained logistic values; exact initial three values.

**Narrow/enlarged composition.** Plot above compact sequence. Use arrowheads and numbered operations; never require horizontal pan.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D28 — Fixed-point multiplier

**Construction and default.** Same r2.5 nonzero fixed .6; draw graph/diagonal intersection and tangent slope−.5. Magnified local disturbance .02 maps linearly to−.01; label tangent approximation. Also mark zero fixed point with derivative2.5. Scale local inset x/y[.55,.65] and label zoom.

**Provenance.** F′=r(1−2x), derived local test.

**Narrow/enlarged composition.** Main intersection plot followed by separate labeled zoom; no unlabeled inflated disturbance.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D29 — Full two-cycle derivative

**Construction and default.** Independent later L5 initial r3.2. Mark exact x−,x+ from formula and both F arrows, then derivative factors r(1−2x−),r(1−2x+) multiplying to .16. Cycle points displayed to six decimals, but calculations use full precision.

**Provenance.** C05 two_cycle and multiplier.

**Narrow/enlarged composition.** Stack two local operations and product row; return arrow spans both. Advanced regimes appear only after D30 and their introduction.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D30 — Finite parameter atlas

**Construction and default.** 151 columns r2.5..4 with spacing .01, burn1000,keep48,start.217;7248 marks in fixed x-axis parameter/y-axis state[0,1]. Always mounted. Select real column default2.5; highlight corresponding tail with true r. Column3.83 exists exactly as an index even if binary representation is approximate.

**Provenance.** Retained atlas function and cached path; no new full recomputation per cursor.

**Narrow/enlarged composition.** Single plot with enough height to see branches; selected tail below. Sparse parameter ticks, visible limits and sampling statement. Do not hide behind a reveal.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D31 — Tangent product

**Construction and default.** r2.5 reference .2,.4,.6,.6; derivative factors1.5,.5,−.5. Show d0=.001→.0015→.00075→−.000375, signed direction. Separate true-state rulers[0,1] and a labeled disturbance magnification. Total multiplier−3/8, log magnitude sum ln(3/8).

**Provenance.** Accepted DY2 exact finite chain.

**Narrow/enlarged composition.** Three operations stack, then product and log row; preserve negative factor arrow flip and no saturated pair claim.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D32 — Pair versus tangent diagnostic

**Construction and default.** L7 ordinary r3.9,x0=.2,δ1e−6,70updates,cursor20; alternate stable r2.5. Pair plot state[0,1]; log10 separation plot[−18,1] with explicit zero/below-range markers. Natural-log exponent starts at current reference, burn1000,count2000. Requested and actual initial difference are distinct readouts.

**Provenance.** Existing pair/model and exponent computation, no scientific replay.

**Narrow/enlarged composition.** State plot, separation, then diagnostic window. Avoid sharing y-axis units or four overlaid traces.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D33 — Critical zero derivative

**Construction and default.** Independent L7 r3.9,x0=.5,δ1e−6,burn0,count2000. Plot local F around .5; exact derivative0 and finite one-step difference−rδ². Tangent log is−∞ while pair may later separate. Point/curve local scales explicitly state magnification.

**Provenance.** Algebraic expansion and preserved original example; actual representable δ shown.

**Narrow/enlarged composition.** Curve above tangent-versus-pair two-row values. Never draw a fake epsilon bar for zero.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D34 — Unstable fixed reference

**Construction and default.** Independent L7 r4,x0=.75,δ1e−6,burn0,count2000. Reference sequence remains .75; tangent multiplier−2 per step, λln2. Nearby pair is distinct and can leave. Draw fixed dot plus alternating growing tangent arrows, labeled magnification.

**Provenance.** Exact fixed equation and derivative.

**Narrow/enlarged composition.** Reference strip above tangent strip and pair plot; label positive rate and period1 together.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D35 — Renormalization and budget

**Construction and default.** Constructed e(n)=1e−5exp(.4n), n[0,25], log10e[−5,−1], tolerance.02; mark n*=ln2000/.4 between19/20 and crop above plot explicitly. Separate arrow operation d1e−5→e^.4d, record gain.4, rescale to1e−5. Ordinary L7 diagnostics may appear below, visibly separate from this constructed curve.

**Provenance.** Accepted DY2 growth-model fixture and tangent measurement explanation.

**Narrow/enlarged composition.** Budget plot then rescaling operation. No claim that this straight line fits the observed logistic pair.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D36 — Stretch and fold

**Construction and default.** Tent graph on equal[0,1] axes, left amber/right blue with L/R labels. Draw input halves and oriented images each onto entire output[0,1]. Right output arrow reverses. Endpoint .5 can receive both symbolic labels.

**Provenance.** Exact T(y)=2y or2(1−y).

**Narrow/enlarged composition.** Graph above two interval-image rows; all endpoints direct labels, no prose boxes.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D37 — Inverse branch composition

**Construction and default.** L8 wordLR default. Target[0,1]→R target[.5,1] with reversed orientation→L result[.25,.5]. Show formula L(R(u))=.5−u/4 and forward two-step check as separate direction.

**Provenance.** C08 inverse_word, exact fractions.

**Narrow/enlarged composition.** Vertical sequence of actual intervals with shared full[0,1] ruler. Distinguish backward construction from forward time arrows.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D38 — Nested cylinder and periodic point

**Construction and default.** StartLR, appendL/R to length10,remove to1. Draw parent/child intervals with exact endpoints and width2^−n, fixed point of inverse affine map. LR point2/5 maps4/5 then2/5. Mark separate local magnification when interval width is under24 CSS pixels.

**Provenance.** C08 exact Fraction identity mirrored deterministically for browser.

**Narrow/enlarged composition.** Full interval above zoom; retain parent bounds and zoom factor. Never enlarge the full strip silently.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D39 — Whole cylinder covers the target

**Construction and default.** Use LR input[.25,.5], after first[.5,1], after second[0,1], oriented endpoints. Then n-letter schematic shows width2^−n and full target, with a chosen open start interval containing a sufficiently fine cylinder. Unique inverse fixed point belongs to cylinder; minimum period may divide n.

**Provenance.** Tent affine branches and contraction proof in manuscript.

**Narrow/enlarged composition.** Three interval rows followed by general containment sketch; title says proof mechanism, not finite simulation.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D40 — Conjugate operations commute

**Construction and default.** Defaulty=.2, h(y)=sin²πy/2; square paths T thenh versus h thenlogistic4. Each corner is an actual point on its y or x ruler, with numeric value and rule. Both endpoints coincide. Direct y editor[0,1] starts here only.

**Provenance.** Exact double-angle identity and retained model.

**Narrow/enlarged composition.** Vertical two-path layout ending at one common x ruler; retain both intermediate values without intersecting labels.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D41 — Two preimages conserve mass

**Construction and default.** Target tent interval[.2,.6], inverse strips[.1,.3],[.7,.9], eachwidth.2, combinedmass.4. Shade real intervals on full[0,1] axes and show two arrows feeding the target. Uniform density baseline1 gives areas matching widths.

**Provenance.** Analytic inverse-image probability.

**Narrow/enlarged composition.** Two input strips stack above target; a sum bracket adds probabilities, never merges the separated locations.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D42 — Push uniform probability into logistic coordinates

**Construction and default.** L8 later presets x[0,.25],[.25,.75],[0,1]. Show y=h^−1(x) endpoints, corresponding uniform-width mass, logistic x interval, CDF difference and density shading. Default middleinterval gives1/3. Density sample excludes exact endpoints; annotate integrable divergence/no atoms, CDF endpoints exact0/1.

**Provenance.** C08 exact CDF; density1/(πsqrt(x(1−x))) derived.

**Narrow/enlarged composition.** Stack uniform strip, x strip, CDF then density; density can crop with explicit divergence arrows but selected probability remains exact.

**Text alternative.** State the named operation using its current values and conclusion; include the exact exceptional/boundary distinction specified above. Preserve the same figure identity and caption at this exact manuscript marker.

### D43 — Finite representation exception

**Construction and default.** Use the exact Fraction path 51/256, 51/128, 51/64, 13/32, 13/16, 3/8, 3/4, 1/2, 1, 0. Render ten rational values paired with binary fraction strips and update arrows; zero remains fixed afterward. The initial denominator is an eight-bit binary grid, not a claim of eight-bit floating-point arithmetic.

**Provenance.** C08 preserved exact dyadic output.

**Narrow/enlarged composition.** Wrap into vertical rows with explicit continuation arrows. Fractions stay at full reader size. The finite path does not contradict the continuum theorem.

**Text alternative.** Describe the stated operation, its named inputs and outcome; include the exceptional or boundary distinction above. Retain the current values in the selected-state summary.

### D44 — One full Lorenz state, two projections

**Construction and default.** L9 uses ρ=28, h=.005, 4,800 steps, horizon 24 and initial state (1,1,1). The cursor defaults to 2,400 and advances by 20. Match x–z and x–y projections of the same finite trace, drawing every third sample plus the selected endpoint. Keep selected x,y,z,t readable. Retain fixed x extent [−25,25], y extent [−35,35] and z extent [0,55]. The two projection axes therefore have explicit different spans.

**Provenance.** Existing bounded Lorenz RK4 model; C12 explains the vector construction.

**Narrow/enlarged composition.** Stack both projections with shared selected-state identity. Keep projection choice as a focus control if useful, but never hide the full coordinate readout. Clipping must be explicit if any permitted state exceeds its bounds.

**Text alternative.** Describe the stated operation, its named inputs and outcome; include the exceptional or boundary distinction above. Retain the current values in the selected-state summary.

### D45 — Equilibria and contracting volume

**Construction and default.** Mark the origin and matched-sign equilibrium pair at ρ=28: x=y=±sqrt(72), z=27. A separate schematic small volume contracts by exp(−41t/3) while one axis may stretch. Label that deformation schematic; do not give an arbitrary ellipsoid an invented quantitative scale.

**Provenance.** Exact Lorenz roots and divergence −41/3; this is not a boundedness proof.

**Narrow/enlarged composition.** Equilibrium view above the volume operation. All three equilibrium coordinates remain readable. Nonzero branches disappear for ρ≤1.

**Text alternative.** Describe the stated operation, its named inputs and outcome; include the exceptional or boundary distinction above. Retain the current values in the selected-state summary.

### D46 — Four vector probes form one RK4 endpoint

**Construction and default.** Use exact rational trial states and slopes from design-rk4-trial-r2.json, initial (1,1,1), h=1/200 and ρ=28. Four complete state/rate rows occur at times 0,h/2,h/2,h. Every trial is built from the original state. The endpoint uses weights 1,2,2,1 divided by 6. Project q,p with q extent [.999,1.005] and p extent [.99,1.14]; label the unequal scales.

**Provenance.** Accepted rational fixture and the matching C12 formula; no repeated main execution.

**Narrow/enlarged composition.** Stack rows at full font, followed by projection and time strip. The middle trials remain distinct at the same time. Retain z in every state row.

**Text alternative.** Describe the stated operation, its named inputs and outcome; include the exceptional or boundary distinction above. Retain the current values in the selected-state summary.

### D47 — Solver mesh, reports, events

**Construction and default.** Use a time ruler [0,1]. A schematic irregular solver mesh differs from 101 requested t_eval times; label only selected report ticks 0,.5,1. A separate oriented p-zero bracket excludes the initial point and accepts upward crossing with q>0. Show an interpolated event location, explicitly schematic rather than an observed Lorenz event.

**Provenance.** Actual C09 settings and solve_ivp documentation; event mechanism is a separate illustration.

**Narrow/enlarged composition.** Stack accepted-step, requested-report and event rows. Put labels outside. Never invent stored internal mesh values or call illustrative times observed.

**Text alternative.** Describe the stated operation, its named inputs and outcome; include the exceptional or boundary distinction above. Retain the current values in the selected-state summary.

### D48 — Numerical cooling changes stability

**Construction and default.** L10 fixes k=2, initial excess temperature 8 and horizon 6. Step choices are .25,.5,1,1.5, default .5. Draw exact dashed cooling and square Euler samples at actual times. The vertical range includes every iterate and zero, and announces its extent when it rescales. At h=.5 the update reaches zero immediately; h=1 alternates ±8; h=1.5 gives 8,−16,32,−64,128.

**Provenance.** Retained cooling model. C01 uses horizon 3 and must keep that separate label.

**Narrow/enlarged composition.** One plot with exterior multiplier and state text. Method labels use distinct shapes. The main plot must not require horizontal panning.

**Text alternative.** Describe the stated operation, its named inputs and outcome; include the exceptional or boundary distinction above. Retain the current values in the selected-state summary.

### D49 — Forward Euler simultaneous increments

**Construction and default.** Use clockwise q′=p,p′=−q, initial (1,0), h=.5. Show both old-state increments and the endpoint (1,−.5), with the exact unit circle as reference. Energy changes from .5 to .625. Coordinate axes have equal units over [−1.5,1.5]. Both increments depend on the old pair.

**Provenance.** Exact forward Euler algebra; the manuscript states the rotation convention change.

**Narrow/enlarged composition.** One plane with numbered operations and equations below in reader-size text. Arrows follow the clockwise equation.

**Text alternative.** Describe the stated operation, its named inputs and outcome; include the exceptional or boundary distinction above. Retain the current values in the selected-state summary.

### D50 — Kick then drift

**Construction and default.** Use the same h=.5 and initial pair. The kick gives (1,−.5); the drift using new momentum gives (.75,−.5). Number the vertical kick and subsequent horizontal drift. The kinked arithmetic path is distinct from the dashed exact physical circle.

**Provenance.** C10 sequential arithmetic.

**Narrow/enlarged composition.** One plane with update equations beneath it. Preserve the dependency of drift on the new momentum.

**Text alternative.** Describe the stated operation, its named inputs and outcome; include the exceptional or boundary distinction above. Retain the current values in the selected-state summary.

### D51 — Area under the update

**Construction and default.** Map unit-square corners (0,0),(1,0),(1,1),(0,1) by Euler matrix [[1,.5],[−.5,1]] and kick–drift matrix [[.75,.5],[−.5,1]]. Draw resulting parallelograms at the same equal coordinate scale. Their areas are 1.25 and 1; put determinant labels beside the actual polygons.

**Provenance.** Analytic determinants at h=.5.

**Narrow/enlarged composition.** Stack the original square and transformed planes when necessary. Keep the same units; area preservation is not radius preservation.

**Text alternative.** Describe the stated operation, its named inputs and outcome; include the exceptional or boundary distinction above. Retain the current values in the selected-state summary.

### D52 — Ordinary and modified level sets

**Construction and default.** At h=.5, show the modified contour (q²+p²−.5qp)/2=.5 as an ellipse beside the ordinary-energy unit circle, equal axes [−1.8,1.8]. A separate h=2 view shows q−p=±1 and states (−3,−2),(5,4),(−7,−6), with equal axes [−8,8]. Announce the changed scale.

**Provenance.** C10 invariant and the analytic T11 boundary witness.

**Narrow/enlarged composition.** Ellipse view above the degenerate-line view, both fully visible. Keep h=2 outside the bounded-energy L11 selector.

**Text alternative.** Describe the stated operation, its named inputs and outcome; include the exceptional or boundary distinction above. Retain the current values in the selected-state summary.

### D53 — Equal-horizon energy comparison

**Construction and default.** L11 fixes horizon 20 and initial state (1,0), with h=.1,.2,.25,.5, default .2. Ordinary energy uses a labeled log scale and distinct Euler/symplectic styles; modified energy uses a linear [0,1] scale with baseline .5. Update counts are 200,100,80,40 respectively. Label final energies as endpoints rather than maximum errors.

**Provenance.** Retained oscillator states and C10 final output.

**Narrow/enlarged composition.** Stack ordinary and modified plots. All methods use the clockwise equation. Readouts retain method identity, horizon and scale.

**Text alternative.** Describe the stated operation, its named inputs and outcome; include the exceptional or boundary distinction above. Retain the current values in the selected-state summary.

### D54 — Gradient update is the same multiplier

**Construction and default.** Use L(x)=kx²/2, k=2, initial x=1. Draw the negative-gradient arrow and two updates: η=.25 gives multiplier .5 and loss .25; η=1.25 gives multiplier −1.5 and loss 2.25. Plot x in [−1.8,1.8], loss in [0,3.3]. Continuous loss derivative is −4x².

**Provenance.** Constructed quadratic fixture and the Euler multiplier identity.

**Narrow/enlarged composition.** Loss curve above an aligned state axis. Step symbols and η labels distinguish the two updates; this is not a nonconvex global guarantee.

**Text alternative.** Describe the stated operation, its named inputs and outcome; include the exceptional or boundary distinction above. Retain the current values in the selected-state summary.

### D55 — Ordered Jacobian transfer

**Construction and default.** Let A=[[0,2],[0,0]], B=[[0,0],[2,0]]. Draw e₂→2e₁→4e₂ on three equal-unit planes with extent [−4.5,4.5]. Matrix action labels sit between actual vectors. Individual spectra contain only zero; BA has eigenvalues 0 and 4.

**Provenance.** C11 exact matrix witness and preserved NumPy output.

**Narrow/enlarged composition.** Stack the planes and operation arrows. Keep direction and order BA visible rather than replacing the picture with a list of eigenvalues.

**Text alternative.** Describe the stated operation, its named inputs and outcome; include the exceptional or boundary distinction above. Retain the current values in the selected-state summary.

### D56 — Local defect feeds rollout error

**Construction and default.** Use constructed rules F(x)=x/2 and G(x)=x/2+.1 with common initial state 1. At updates 0–4, true states are 1,.5,.25,.125,.0625 and predicted states 1,.6,.4,.3,.25. On common state scale [0,1.1], draw gaps 0,.1,.15,.175,.1875 and feedback arrows to each rule’s own next input. A separate .1 local-defect mark explains e_next=.5e+.1.

**Provenance.** Accepted DY2 exact analytic fixture; no data or training claim.

**Narrow/enlarged composition.** Paired traces above one feedback operation and an error row. Preserve actual gap lengths and the common initial point.

**Text alternative.** Describe the stated operation, its named inputs and outcome; include the exceptional or boundary distinction above. Retain the current values in the selected-state summary.

## Eleven staged investigations

### L1 — scalar destinations, D09/D10 and D14

D09 and D10 share only pitchfork parameter a and initial x. Defaults a=1,x=.2; choices a=−1,0,.25,1; direct initial editor and range [−1.8,1.8] with range step .1. Reuse the existing scalar RK4 model, h=.02,T=8. D09 shows only rate and phase line. D10 adds potential and time after their meanings are taught. D14 owns a separate tilted family, default b=0,x=.2, choices b=−.6,−2/(3√3),0,+2/(3√3),+.6. It has its own initial editor and reset. Test ±.2 opposite basins, x=0 null at b=0, a=0 nonlinear attraction and both exact fold states. Invalid drafts and reset must work at the default as well as after a committed change. No family selector leaks to earlier mounts.

### L2 — center first, comparison later, D16–D18

D16/D17 share center-only initial (1,0), T=4π, 320 intervals and cursor 160. Direct q0,p0 editors each allow [−1,1], with named start shortcuts. D18 owns a separate initial state and comparison family, default center/(1,0), exposing center/spiral/saddle only after all equations are explained. Center and spiral have coordinate extent ±2 and T=4π; saddle uses extent ±5.5 and T=4 with explicit clipping and horizon labels. Verify zero stays fixed, (0,1) changes the starting direction, direct negative coordinates work, and reset affects only its stated family. Neither mount offers Hopf or transient dynamics.

### L3 — exact transient transfer, D19/D20

Share only the exact triangular model q′=−q+6p,p′=−2p, default (0,1), T=4π, 320 intervals and cursor 160. Direct q0,p0 editors each allow [−1,1]. Equal plane extent ±2.5 and norm range [0,2.5] are fixed across these bounded starts. Display direct and transferred q terms separately. The exact-time action evaluates ln2 analytically rather than relabeling a nearby grid point. Check default (1.5,.25), changed (1,0)→(.5,0), zero start, and a negative p start. Reset restores defaults, cursor, drafts and errors and clears exact-time selection; changing the ordinary cursor also clears that selection.

### L4 — radius, phase, return, D22/D24/D25

One reference family shares a=.25,r0=.3, base phase 0,T=4π, 320 intervals,cursor160. Parameter choices −.25,0,.25,1; direct radius [0,1.5], range step .05, shortcuts 0,.3,1. D22 shows the reference orbit and radius only. D24 adds an independent comparison phase offset, direct [−π,π], default π/4 and exact shortcuts 0,π/4. This offset never rotates D22’s reference or D25’s section start. D25 alone shows return radii at 0,2π,4π, with time0 labeled initial rather than a completed return. Null r0=0 has undefined phase/no nontrivial crossing; a≤0 has no attracting-cycle multiplier; r0=.5,a=.25 is the exact periodic reference. The family reset explicitly restores a,r0,cursor,offset and all drafts/errors across its mounts. Test reset from invalid default-valued text in either editor.

### L5 — fixed-point feedback before later regimes, D27/D29

D27 starts at fixed r=2.5,x0=.2,40 updates,cursor1. Direct x0 [0,1], range step .01 and next/previous controls. The small fixed-point extension offering r=1,2.5,3 must be placed after the marginal-boundary analysis; until then its parameter is fixed. D29 starts an independent later family at r=3.2,x0=.2 with the same bounded editor/cursor. Initially expose only 3.2. After period doubling, windows and D30 have been taught, a following extension may offer 3.5,3.83,3.9,4 while sharing only that later state. Later changes never replace D27’s equation. Test zero, .2/.5 transients, boundary fixed states and reset for both families. Cycle markers occur only where their cycle is taught; axes stay [0,1].

### L6 — visible finite atlas, D30

Mount the atlas unconditionally within the reached lesson section. Use 151 columns from 2.5 to 4, burn 1,000, keep 48 and initial .217. Cache the 7,248 marks once per required model definition; selecting a column must not recompute the full atlas. Default/reset chooses the first stable column r=2.5. Keyboard and pointer selection identify the true sampled r and matching tail; r=3.83 is an actual grid column. If an implementation adds an exact preset between sampled columns, it must remain a separate labeled calculation. No modal, reveal gate or hidden explanatory atlas.

### L7 — ordinary pair and two independent exceptions, D32–D35

D32 and the ordinary diagnostic extension at D35 share r=3.9,x0=.2,δ=10⁻⁶,cursor20,70 updates. The stable comparison is r=2.5. D33 owns a separate critical family fixed at r=3.9,x0=.5,δ=10⁻⁶; D34 owns a separate fixed-reference family at r=4,x0=.75,δ=10⁻⁶. Each provides direct x0 in [0,1] and δ in [−.01,.01], allowing exact zero or magnitude at least 10⁻¹². Require x0+δ within [0,1] and a distinct binary64 value for nonzero δ. Show requested and representable differences. Coupled-invalid edits keep the previous valid pair; zero is an explicit equal-start null. Ordinary exponent burn/count is 1,000/2,000; exceptions use 0/2,000 so the initial derivative is not discarded. Every diagnostic uses the current reference, not the perturbed start. The natural-log average and log10 separation plot [−18,1] keep their units/window labels. Test signed differences, zero, out-of-range partner, an incomplete exponent token and reset of invalid default-valued text. Resets affect only the declared family. The constructed D35 forecast curve and renormalization sketch do not inherit an empirical-fit label from these controls.

### L8 — word, coordinate, mass, finite grid, D37/D40/D42/D43

Word state begins LR; append L or R to length at most 10, remove to at least 1. D37/D38 show interval, width and repeating point with exact endpoint treatment. The coordinate editor y=.2 in [0,1], range step .01, mounts only at D40 after h is defined. D42 then exposes the mass presets [0,.25],[.25,.75],[0,1], default [.25,.75], and computes analytic CDF differences/preimages. D43 finally adds the exact initial 51/256 finite-grid path, not an arbitrary precision slider. A shared reset is labeled to restore word LR, y=.2 and middle mass preset and clear drafts. No early CDF, exponent or finite-grid control. Test LR/RL, shortest/longest words, endpoint coordinate 0/1, default mass1/3 and whole mass1.

### L9 — full Lorenz state and staged diagnostics, D44–D47

Default ρ=28, projection focus x–z,cursor2400; parameter choices .5,10,28. Reuse 4,800 RK4 steps at h=.005 over24 from(1,1,1), σ=10,β=8/3. Cache one trace per parameter. Cursor step20; draw every third sample up to cursor plus the selected endpoint, retaining all full states. Fixed x/y/z extents are [−25,25],[−35,35],[0,55]. Matched projections and all coordinates remain available at narrow size. At D44 show only the trace/state/equation; introduce equilibria and divergence in the later D45 mount after their definitions. D46 is the fixed four-probe teaching fixture; D47 is the mesh/report/event explanation, not an additional numerical run. Reset restores 28,x–z,2400. No nearby long-run agreement assertion. Check each ρ, first/final cursor, projection identity and exact selected full-state values against the existing model.

### L10 — cooling algorithm, D48

Fix k=2,x0=8,T=6 and offer h=.25,.5,1,1.5, reset .5. Include all Euler states and exact values at the same physical times. The vertical extent adapts to contain all iterates and announces rescaling. Expose multiplier, exact interval factor and strict-attraction status. The h=.5 zero state is not exact cooling, h=1 is a nondecaying boundary and h=1.5 grows. Reset and keyboard selection need no new scientific fixture or old-main replay.

### L11 — oscillator energies, D53

Fix T=20, initial(1,0), offer h=.1,.2,.25,.5, reset .2. Use whole integer step counts. Ordinary energy is log-scaled with distinct methods; modified energy has its own linear scale. Readouts name the relevant energy and horizon. The h=2 witness remains in the preceding exact drawing and practice; do not add it to a plot whose bounded-energy argument assumes |h|<2. Check each step’s final state/energy against the retained deterministic model and C10 endpoint precision. Preserve clockwise convention for both methods.

## Complete code, practice and shared endings

The manuscript contains all 13 whole source/output pairs, with a mathematical lead, operation walkthrough and result interpretation. C02 is placed after the potential derivative in section 3, rather than before its potential functions have been explained in section 2. This is a small content-flow adaptation of the design; source/output remain unchanged. C01/C03–C11 use the exact print-only successors where recorded. C06 and C02 are unchanged originals. C12 is the new vector RK4 file; C13 is the complete independent practice file. Do not substitute summaries or excerpts for whole files.

The runtime owner will choose topic-local public asset paths under the established learning-code convention and bind each source and stdout by hash. Each teaching placement offers Copy full file, Download full file and a separately labeled recorded-output link/panel. Copy includes exact complete source with normalized LF; Download must deliver the same source bytes and stated filename. Output delivery binds the prepared stdout, not a re-execution during build. The final file index links to exactly those assets. Full code may use local horizontal scrolling; file headings inherit reader font size and wrap. A copied confirmation is transient accessible status, not a persistent replacement of the filename.

Use the existing shared lesson introduction with title, deck, prerequisites and eleven section anchors from the manuscript. Preserve those exact anchors. Fifteen visible task prompts precede their hints/solutions; disclosures open independently and keep native keyboard behavior. The complete practice programme is in a solution disclosure after the task prompts. Do not duplicate old and implementation variants as separate nominal tasks. Preserve all twelve old conceptual outcomes and the three new transfer groups. Shared readiness and next-topic link remain ordinary teaching prose. Further Learning is annotated learning guidance; Technical References is a distinct API/file ending. No author status, test counts, internal receipt names or implementation instructions belong in the reader’s prose.

## Later runtime verification boundary

This packet is content-ready only after whole independent content review and author corrections; it makes no claim that these diagrams have been implemented. During runtime, personally inspect representative entire mechanisms at ordinary, narrow and enlarged sizes, especially stacked vector probes, same-scale planes, atlas labels, interval zoom, selected Lorenz coordinates and energy-scale distinction. Test mounted 16→32→16 styles and a real narrow content column, not only a viewport width. Verify all stated changed/null/invalid/reset cases and shared late-stage isolation. Check keyboard, reduced motion, local overflow, screen-reader names and actual Copy/Download identities. Exercise lazy loading, delayed data, chunk failure/retry and navigation without duplicating the main figure. Reuse source-matching scientific evidence; browser state verification does not authorize replaying old mains. Keep necessary representative native captures and compact records rather than full screenshot grids or duplicate public/build trees.

**Content link projection.** The manuscript’s relative programme links resolve to the real prepared source files during review. Runtime must map these 13 links to the source-matching topic assets, without changing filenames or full bodies. Its explicit HTML anchor declarations record the existing shared section IDs; use those IDs in the shared introduction and headings.
