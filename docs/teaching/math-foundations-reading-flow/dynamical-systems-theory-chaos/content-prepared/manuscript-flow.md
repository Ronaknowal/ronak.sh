# Dynamical Systems Theory & Chaos

A rule can be completely deterministic and still be difficult to predict far ahead. Learn to follow a state, recognize where it settles, explain why that behavior changes, and judge what a simulation actually establishes. The central question throughout is: which conclusion follows from the rule, and which is only evidence from a finite run?

Prerequisites: Read a derivative as a local rate, multiply a small matrix by a vector, and interpret an eigenvalue or Jacobian. A short rate-to-trajectory bridge is included; you do not need a prior differential-equations course. Probability density is refreshed where the statistical view begins.

On a first pass, follow the state, phase line, phase portrait and update pictures through section 7. Section 8 supplies an exact mathematical chaos mechanism; sections 9–10 explain what numerical trajectories can establish. The deeper arguments remain visible beside their motivating examples.

For earlier mathematical tools, revisit [matrix–vector multiplication](/learn/path/full-curriculum/vectors-matrices-tensor-operations?module=math-foundations) and [eigenvalues and eigenvectors](/learn/path/full-curriculum/eigenvalues-eigenvectors?module=math-foundations). A derivative here means the local change per unit input, and the chain rule multiplies the local effects of successive operations. Those meanings are refreshed before use; a prior ODE course is not assumed.

## 1. Choose a state and a clock

Two carts occupy the same position. Their velocity arrows point in opposite directions. Which one moves right next?

[[D01]]

Position alone cannot answer; velocity supplies the missing information. A **state** is the collection of quantities needed to determine how your chosen model evolves, given any specified external inputs. For this cart it might be the pair (position, velocity). For an iterative algorithm it might include its current estimate and its momentum, not only the estimate.

A **dynamical system** combines a state space, a rule for change and a time convention. A state space is the set of permitted states, such as all position–velocity pairs or a population fraction between 0 and 1. A **trajectory** is the sequence or curve obtained by starting at one state and following the rule. Parameters, such as a drag coefficient, belong to the rule; the initial state selects a trajectory under that rule.

$$
\begin{aligned}
x_{n+1}&=F(x_n) &&\text{discrete update},\\
\dot x(t)&=f(x(t)) &&\text{continuous rate}.
\end{aligned}
$$

Here n counts updates and t measures continuous time. F returns a new state. In contrast, f returns a *rate*, with units “state units per time unit.” The dot means a time derivative. For a vector state, f returns one rate for each coordinate. Knowing the rate at one instant is not the same as knowing the full change over the next second.

Use excess temperature as a single state. At 8 degrees above room temperature, a decay rate of 2 per minute gives an instantaneous slope of −16 degrees per minute. A quarter-minute interval is a horizontal width, not another rate.

[[D02]]

Consider a warm object cooling toward a fixed room temperature. Let x be its excess temperature, measured in degrees, and let k>0 be a decay rate measured in inverse minutes. The rule x′=−kx says the object loses excess temperature at a rate proportional to what remains. The trajectory from x₀ is x(t)=x₀e⁻ᵏᵗ: differentiate it and you recover the stated rate and initial value.

$$
\begin{aligned}
\Delta x&=x(t+h)-x(t),\\
\Delta x&=\int_t^{t+h}f(x(s))\,ds,\\
\Delta x&\approx h f(x(t)).
\end{aligned}
$$

The integral adds the changing rate over the interval. Replacing the whole rate curve by its value at the left endpoint gives **forward Euler**, a numerical approximation. Cooling then has Euler multiplier 1−kh, while the exact multiplier over the interval is e⁻ᵏʰ. A numerical update is a new discrete dynamical system, and its behavior can differ from the continuous system it approximates.

Follow three equal intervals using the exact curve and the left-endpoint approximation. The same interval widths let us compare complete states at the same physical times.

[[D03]]

Write the exact cooling flow as Φₜ(x)=e⁻²ᵗx. Advancing for s minutes and then t minutes gives e⁻²ᵗe⁻²ˢx=e⁻²⁽ˢ⁺ᵗ⁾x, so Φₜ(Φₛ(x))=Φₜ₊ₛ(x). This composition property describes the autonomous flow while its solutions exist. Euler instead repeatedly multiplies by 1−2h. Reducing h changes the approximation, even when the endpoint time is fixed.

The complete programme below accepts a horizon divisible by its step, applies that many Euler updates and compares their final value with the exact formula. Its three runs all end at time 3; they use 12, 4 and 2 updates. The number of updates and the common final time answer different questions.

{{CODE:cooling}}

The smallest listed step decays to 0.001953 rather than the exact 0.019830. It is stable but not especially accurate at this horizon. At h=.75 the multiplier is −.5, so the sign alternates while the magnitude decays; at h=1.5 the multiplier is −2 and the approximation grows. These calculations concern the numerical rule, not a change in the cooling law.

### When is the next state actually determined?

The autonomous rule f(x) has no explicit clock dependence. A driven cart may instead obey x′=f(x,t,u(t)), where u is a specified control or external force. If you omit a changing input, two apparently identical recorded states may evolve differently. Adding a clock coordinate τ′=1 makes explicit time dependence autonomous in an enlarged state space; it does not make the unknown forcing known.

For ordinary differential equations, a continuously differentiable vector field near the initial state supplies local existence and uniqueness. More generally, continuity with local Lipschitz dependence on the state is a standard sufficient condition. Local existence leaves a separate question: how long does the solution remain finite?

[[D04]]

For x′=x² from x(0)=1, separation or direct differentiation gives x(t)=1/(1−t). The solution becomes unbounded as t approaches 1 from below. The original initial-value solution cannot be continued through that pole as a finite trajectory. Smoothness does not promise existence for all future time, and an algebraically permitted coordinate need not be physically meaningful.

**Check the distinction.** A recurrent predictor uses both its current output and an internal memory vector. Two runs have the same output but different memory. Must their next outputs agree?

No. The output alone is not the full state of that rule. A valid comparison must include the memory and the same next external input. This is a state-modeling issue, not automatically randomness or numerical error.

**Reproduce the examples.** Save each complete Python program below in its own file. Most use the standard library. The matrix-exponential and Lorenz examples need NumPy and SciPy; the Jacobian example needs NumPy. They were run with Python 3.12.14, NumPy 2.3.5 and SciPy 1.18.1. The browser labs use their declared bounded models and do not execute Python. All unqualified coordinates and times in the mathematical examples below are dimensionless.

## 2. Ask what a disturbance does

A state that stays unchanged is an **equilibrium** of a continuous rule, or a **fixed point** of an update map. Solve f(x*)=0 for the former and F(x*)=x* for the latter. The star marks the special state; it is not multiplication. Finding a resting state is only the first question. The more useful question is what happens if the system starts a little away from it.

The outer tube below asks whether a trajectory stays within distance ε=1/2 of zero. The narrower starting band has δ=1/4. From x₀=1/5, exponential decay remains in the tube; positive linear growth eventually leaves it.

[[D05]]

The picture illustrates the quantifiers. For x′=−x, |x(t)|=|x₀|e⁻ᵗ≤|x₀|<δ<ε for every future time, so the argument works for every start in the chosen band. For x′=x, the displayed start crosses ε at t=ln(5/2). Two plotted trajectories alone would not establish a statement about every permitted start.

Three different promises about nearby starts

| Property | What it says | What it does not say |
| --- | --- | --- |
| Lyapunov stability | For every permitted small distance ε, some sufficiently small starting distance δ keeps the entire future trajectory inside ε. | The trajectory need not return to the equilibrium. |
| Attraction | Starts in a neighborhood approach the equilibrium as time goes to infinity. | This definition alone does not supply the stays-near condition. |
| Asymptotic stability | The equilibrium is both stable and attracting. | The rate need not be exponential, and the basin need not be the entire state space. |
| Exponential stability | Distance is bounded by C e⁻ᵅᵗ times initial distance, for positive C and α in the stated neighborhood. | C may exceed 1, so a temporary increase in a chosen norm can still occur. |

Start four scalar rules at x₀=1/4 and compare them on the same interval 0≤t≤4. The zero field stays still; the two negative fields return at different rates; the positive cubic departs.

[[D06]]

For x′=0, every nearby initial point stays exactly where it started. The origin is stable but not attracting. For x′=−x, the distance decays exponentially. For x′=−x³, the origin also attracts, but the exact solution is x₀/√(1+2x₀²t), so the decay is algebraic rather than exponential. If the chosen neighborhood can be the entire permitted state space, the corresponding attraction or stability result is called global; otherwise it is local.

The positive cubic has x(t)=x₀/√(1−2x₀²t), only before the denominator reaches zero. With x₀=1/4 its pole is at time 8, outside the displayed window. The negative cubic's formula gives algebraic return, but no constants C and α can bound its nonzero trajectory by C e⁻ᵅᵗ|x₀| for all time: algebraic decay eventually exceeds any such exponential bound.

### Linearize, then check the correct boundary

A linearization should first be read as an operation on a disturbance. For the constructed field F(q,p)=(−q+q²,−2p) near (0,0), compare the actual rate change at displacement η=(.1,.1) with its linear prediction.

[[D07]]

Here J=diag(−1,−2), so Jη=(−.1,−.2). The actual rate change is (−.09,−.2); the remainder is (.01,0). In general that remainder is (ηq²,0), whose norm is at most ‖η‖². The Jacobian maps a **state disturbance to a rate disturbance** for this flow. It does not directly give the new state one time unit later.

Write a small disturbance as δ=x−x*. A first-order expansion gives δ′≈Jδ for a flow and δₙ₊₁≈Aδₙ for a map. J and A are the Jacobians of f and F at the special state. In one dimension they are ordinary derivatives. The linear flow repeatedly applies eᴶᵗ; the linear map repeatedly applies A. That difference explains why their stability boundaries differ.

$$
\begin{aligned}
\delta'&=\lambda\delta
&&\Rightarrow \delta(t)=e^{\lambda t}\delta(0),\\
\delta_{n+1}&=m\delta_n
&&\Rightarrow \delta_n=m^n\delta_0.
\end{aligned}
$$

A complex eigenvalue has a real coordinate and an imaginary coordinate. Compare the region where its exponential decays with the region where repeated powers shrink.

[[D08]]

The flow matrix [[−1,−1],[1,−1]] has eigenvalues −1±i, in the strict left half-plane. The map matrix [[.5,−.5],[.5,.5]] has multipliers .5±.5i, of magnitude √.5 inside the unit disc. The first eigenvalues have inverse-time units; the second are dimensionless per-update multipliers. Boundary points are intentionally marked separately.

For a continuously differentiable finite-dimensional autonomous flow, all Jacobian eigenvalues having negative real part is a sufficient local exponential stability condition. A positive real part implies instability. For a continuously differentiable map, all eigenvalue magnitudes below 1 give local exponential stability; an eigenvalue outside the unit circle implies instability. These statements concern an appropriate neighborhood of the equilibrium and the stated smooth model.

The unresolved boundaries are real part zero for a flow, and magnitude one for a map. They require further analysis. Both x′=−x³ and x′=x³ have derivative zero at the origin; one attracts and the other repels. A derivative test with equality cannot decide between them. For a constrained state space, also specify from which admissible side a perturbation is allowed.



**Check the distinction.** A scalar continuous flow has rate derivative −2. A discrete map has derivative −2. Are both locally attracting?

The flow's linear disturbance decays as e⁻²ᵗ. The map's disturbance flips sign and doubles in magnitude at each update. The same printed number has a different role: a rate in the first case, a multiplier in the second.

## 3. Read the landscape and its basins

In one dimension, the sign of f(x) gives the direction of motion. Draw the x-axis, mark zeros of f, and put arrows right where f>0 and left where f<0. This **phase line** makes the qualitative future visible without solving the equation. With a locally unique autonomous solution, trajectories cannot pass through an equilibrium and continue to the other side: that would conflict with the solution that stays there.

Read one rate curve and its aligned direction arrows before solving trajectories. The roots divide the line into intervals where the direction cannot change.

[[D09]]

Use x′=a x−x³. At a=1 the equilibria are −1, 0 and 1. On the positive side, motion points right below 1 and left above 1. Every positive start approaches 1; every negative start approaches −1; the exact zero start remains zero. The **basin of attraction** of an attractor is the set of initial states that approach it. Here the positive and negative half-lines are different basins, separated by the unstable equilibrium at zero.

The same rate can be pictured as motion down a potential. Keep the state coordinate aligned between the rate curve, the landscape and the time trace.

[[D10]]

There is also a useful landscape. Define V(x)=x⁴/4−a x²/2. Its negative derivative is the rate, so motion travels downhill in V. This function is not necessarily a physical energy, and its zero level is arbitrary.

$$
\begin{aligned}
\dot x&=-V'(x),\\
\frac{dV}{dt}&=V'(x)\dot x
=-[V'(x)]^2\le 0.
\end{aligned}
$$

The scalar programme combines two explicit calculations: `cubic_solution` evaluates the exact positive/negative cubic solutions from section 2, and `potential_rate` substitutes the current rate into V′(x) x′ for the present two-well system. They are different equations, so the output labels distinguish them. The lifetime guard rejects time 8 for the positive cubic rather than evaluating past its pole.

{{CODE:scalar}}

The negative potential-rate values are direct substitutions at five named points, not a sampled proof for all x. The identity −[V′(x)]² supplies the all-state sign argument. An **attracting invariant set** is a set preserved by the dynamics that nearby trajectories approach in distance; an equilibrium and an attracting periodic orbit are two possible examples. Its basin specifies which starts approach it.

Now place two starts on opposite sides of the dividing equilibrium.

[[D11]]

At a=1 there are two valleys and a hill between them. Starting near the hill on different sides leads to different destinations even without chaos. The basin boundary, rather than persistent expansion within one attractor, explains that final difference. A nonincreasing function is useful evidence, but alone it does not say that every trajectory converges to your favorite point.

Choose the right well at x*=1 and a small closed landscape contour around it. This makes the domain of a convergence claim visible.

[[D12]]

Shift the potential by its minimum: W(x)=V(x)−V(1)=(x²−1)²/4. The positive-well component of W≤1/64 is C=[√3/2,√5/2], contained in |x−1|<1/4. Both endpoints point inward. Within this compact set W≥0, W=0 only at 1 and Ẇ=−(x−x³)². Its zero-derivative set is just {1}, which is invariant. Thus this local certificate singles out the right well; it does not send a negative start across the basin boundary.

### Deeper: when does a Lyapunov function establish convergence?

Near a chosen equilibrium, a positive-definite V means V(x*) = 0 and V>0 elsewhere nearby. A negative-definite derivative along solutions gives a local asymptotic stability argument under the usual smoothness conditions. For a global result, suitable properness or radial unboundedness is also needed to stop level sets from permitting escape. In the two-well example, shift V by its value at a chosen minimum and restrict to a neighborhood of that minimum; the raw two-well polynomial is not positive-definite about zero.

If V̇≤0 only, the invariance principle asks for the largest invariant set inside V̇=0 within an appropriate compact positively invariant set. That set may contain more than one equilibrium or an entire orbit. “Energy never increases” is not a proof that all states return to a selected equilibrium. The dedicated nonlinear-control lesson extends this into regional certificates and control design.

### Change the rule and watch a bifurcation

Change the parameter along the horizontal axis while keeping equilibrium position on the vertical axis. Each point describes a different fixed rule, not a later time in one trajectory.

[[D13]]

A **bifurcation** is a qualitative change in the dynamics as a parameter varies. In this example, a<0 gives one attracting equilibrium at zero. At a=0, the cubic still attracts but its linearization is zero. For a>0, zero repels and two attracting states appear at ±√a. This symmetric branching is the supercritical pitchfork normal form. “Normal form” means a simple representative local equation; it is not a claim that every physical system is exactly this polynomial.

Add a constant tilt b to x−x³. Intersections with zero now move and can merge; the phase arrows reveal which side of a double root attracts.

[[D14]]

Break the symmetry with the tilted rule x′=b+x−x³. A fold occurs when an equilibrium also has zero derivative. Solve b+x−x³=0 together with 1−3x²=0: the turning states are ±1/√3 and the parameter thresholds are ∓2/(3√3). Between those thresholds there are three equilibria, including two attracting ones. At a threshold two meet in a saddle-node bifurcation; the double root attracts from only one side. Beyond it only one attracting root remains.

Follow an attracting branch while the tilt changes extremely slowly, then reverse the sweep. The two branch endings occur at different parameter values.

[[D15]]

This is a mechanism for **hysteresis**: in an ideal sufficiently slow parameter sweep, a system tracking one attracting branch may remain there until that branch disappears, then move to the other. Reversing the sweep can switch it back at a different threshold. Actual finite-speed dynamics can add delayed switching, while noise can induce earlier transitions. The lab solves each fixed parameter separately; it does not simulate those sweep rates or noise.

## 4. See time through a phase portrait

One rotating state can produce both a circle in the state plane and two oscillating traces against time. A shared time marker identifies the same (q,p) in all three views.

[[D16]]

A time plot shows a coordinate against t. A **phase portrait** plots state coordinates against each other: every point is a complete two-coordinate state, and an arrow shows the current rate there. For q′=−p, p′=q, the radius squared q²+p² stays constant because its derivative is 2q(−p)+2p(q)=0. A time trace oscillates; the phase trace is a circle.

A component-zero line tells us where one arrow component vanishes. For q′=−p,p′=q, the horizontal axis p=0 has q′=0 and therefore purely vertical rates; the vertical axis q=0 has p′=0 and purely horizontal rates.

[[D17]]

These are the **nullclines**. Their intersection is an equilibrium because both components vanish there. A nullcline itself need not be a trajectory: at a nonzero point on an axis the other component immediately carries the state away from that axis. This planar reading tool complements the earlier Jacobian calculation.

Compare the center with the fields (q′,p′)=(−.4q−p,q−.4p) and (.4q,−.5p). Their arrows show rotation with decay and a split between decay and growth.

[[D18]]

The origin of that system is a **center**. Nearby circles remain nearby but do not spiral into the origin or into one special circle. Adding −0.4 times each coordinate gives an attracting spiral: q′=−0.4q−p, p′=q−0.4p. Its radius decays as e⁻⁰·⁴ᵗ while its angle increases at one radian per time unit. A saddle such as q′=0.4q, p′=−0.5p has one decaying direction and one growing direction. Exact starts on q=0 approach zero; a nonzero q eventually grows.

These examples connect eigenvalues to geometry. A complex pair with real part −0.4 and imaginary parts ±1 gives decay plus rotation. A positive and negative real pair gives a saddle. The stable and unstable directions of a nonlinear saddle can become curved **manifolds**: sets of states that approach the equilibrium in forward or backward time. Local linearization describes their tangent directions, not their entire global shapes.

### A stable system can initially amplify an error

Watch a decaying second coordinate feed a first coordinate through a coupling term. The two contributions to q remain separate so a temporary increase has a visible cause.

[[D19]]

It is tempting to think that negative eigenvalues mean every distance shrinks at every instant. Consider q′=−q+6p, p′=−2p. Both eigenvalues are negative, but starting at (0,1) gives p=e⁻²ᵗ and q=6(e⁻ᵗ−e⁻²ᵗ). At t=ln2 the state is (1.5,0.25), whose distance from the origin is about 1.52, larger than its initial distance 1. Eventually both coordinates vanish.

The reason is transfer: while p decays, it drives q through the coefficient 6. This is an example of **nonnormal transient growth**; the matrix does not commute with its transpose, and its eigenvectors do not provide an orthogonal decomposition that makes Euclidean decay obvious. The effect matters when a brief amplification can overflow an actuator or computation before eventual decay arrives. The norm and units must also be meaningful: mixing meters and meters per second in an unscaled Euclidean norm can hide an arbitrary weighting choice.

Place the norm curve beside the state plane and mark the exact time ln 2 in both. Compare (0,1), which initially supplies the coupling, with (1,0), which does not.

[[D20]]

For any chosen q₀,p₀ the exact solution is p=p₀e⁻²ᵗ and q=q₀e⁻ᵗ+6p₀(e⁻ᵗ−e⁻²ᵗ). This also shows why setting p₀=0 removes transfer. In the investigation, edit either initial component in [−1,1], choose the exact ln 2 marker, or use (0,0) as a null case. The norm has meaning only after the coordinate scales have been chosen.

The programme uses `scipy.linalg.expm(t*A) @ initial`. A matrix exponential is the sum I+tA+t²A²/2!+⋯ of matrix powers; applying the ordinary exponential separately to each entry is a different operation. The two-by-two shape and finite-input checks make that library contract explicit. The library result below agrees with the derived transfer at ln 2.

{{CODE:transient}}

Both eigenvalues are negative, yet the norm first exceeds its initial value. Eventual exponential decay permits a prefactor C greater than one; it never promised monotonic decay in every coordinate norm.

**Check the distinction.** Two phase curves cross in a picture of x against z from a three-dimensional model. Does uniqueness fail?

Not necessarily. Their omitted y coordinates may differ. Uniqueness applies to the full state of the same deterministic rule. Projected crossings can be artifacts of discarding a coordinate, and a time-varying rule also needs its clock/input context.

## 5. Build an attracting oscillation

Many systems settle into repeated motion instead of a resting point. A **periodic orbit** returns to the same full state after a positive period. A **limit cycle** is an isolated periodic orbit: nearby curves are not all periodic orbits of the same family as they are at a center. An attracting limit cycle draws nearby trajectories toward the orbit as a set.

At the point (q,p)=(.3,.4), separate the rate into a radial arrow and an arrow tangent to its circle. For this decomposition only, use a=1; the later cycle investigation uses a=.25 by default.

[[D21]]

We can build one by controlling radius and angle separately. Let r=√(q²+p²), and let θ be the angle. Choose θ′=1, so the state rotates once every 2π time units, and r′=a r−r³. In Cartesian coordinates this gives the following smooth system, including at r=0 where angle itself is undefined.

$$
\begin{aligned}
\dot q&=a q-p-(q^2+p^2)q,\\
\dot p&=q+a p-(q^2+p^2)p.
\end{aligned}
$$

For r>0, differentiate r²=q²+p² to obtain 2r r′=2q q′+2p p′. Substituting cancels the rotational cross terms and gives r′=ar−r³. Similarly θ′=(q p′−p q′)/r²=1. At (.3,.4), r=.5: the radial rate vector is (.225,.3), the tangential vector is (−.4,.3), and their sum is (−.175,.6). Thus r′=.375 while the angle advances at one radian per time unit. At the origin use the smooth Cartesian rule, because θ is undefined.

Inspect the signs of the radius rule before following the spiral.

[[D22]]

For a<0 all nonzero radii decrease to zero. At a=0 they still decrease, but algebraically. For a>0, small positive radii increase and large radii decrease toward √a. The origin remains a fixed state but is unstable; the circle r=√a is attracting. This is a supercritical Hopf normal form: a pair of eigenvalues a±i crosses the imaginary axis as the cycle is born. For a general system, additional nondegeneracy and nonlinear coefficients decide whether a Hopf bifurcation occurs and which type it is.

The radius can also be solved exactly. Let u=r² so that u′=2au−2u². Compare its finite-time curves across a=0 rather than dividing by a and losing that case.

[[D23]]

For u₀=r₀² and a≠0,

$$
u(t)=\frac{u_0 e^{2at}}{1+(u_0/a)(e^{2at}-1)}.
$$

At a=0 the continuous limit is u(t)=u₀/(1+2u₀t); r₀=0 remains zero in every case. For numerical evaluation near zero, `(exp(z)-1)/z` should be evaluated with `expm1` or a short series. The complete return-map programme below uses this stable expression instead of selecting an arbitrary almost-zero parameter threshold.

Keep the radius shared, but rotate a comparison start through π/4. The two arrows remain separated even after their radii approach the same circle.

[[D24]]

At a=.25 the target radius is .5. A point starting at the default radius .3 spirals outward; one starting at radius 1 spirals inward. Edit the starting radius or use radius zero to expose the stationary-origin exception. They approach the same circle, but two different angles need not synchronize. **Orbital attraction** concerns distance to the cycle; convergence to the same position at the same clock time is a stronger claim.

With an initial phase offset φ, both angles advance by t, so the offset remains φ. For the same positive radius r(t), their equal-time distance is 2r(t)|sin(φ/2)|. At a=.25 and φ=π/4 its limit is sin(π/8), not zero. Setting φ=0 gives the coincident null case. Changing this comparison phase does not rotate the reference orbit used for the return section.

### Turn one revolution into an update map

A **Poincaré section** samples repeated crossings of a surface through state space. Choose the positive q-axis and record a crossing only when the orbit crosses in the chosen direction. In our radial example each nonzero start returns after 2π, so the return map sends one radius to the radius one turn later. In a general flow the return time varies with the starting point; simply sampling every fixed second is a different construction.

Sample the positive q-axis only when p crosses upward through zero with q>0. One crossing radius is the input; the next crossing radius is the output of the return map P.

[[D25]]

For the present constant angular rate, P(r₀)=r(2π;r₀). Its fixed radius is a periodic orbit of the full flow, not a stationary full state. The initial point at time zero is the starting section point, not a completed return. Radius zero has no nontrivial crossing; a≤0 has no attracting positive-radius cycle.

Linearize the radial equation at r*=√a. Its derivative is a−3r*²=−2a. A small radial error therefore gets multiplier e⁻⁴πᵃ after one turn. For a=0.25 that is e⁻π≈0.0432, a strong radial contraction. The full continuous orbit has a neutral phase direction: shifting a point along the same cycle does not disappear under repeated flow. The section removes that direction and reveals transverse stability.

`radius_at` evaluates the solved radius rather than integrating the Cartesian field. It uses `expm1` and the series 1+z/2+z²/6 to evaluate `(eᶻ−1)/z` near zero. It then compares the symmetric finite difference of P at radius .5 with the analytic e⁻π multiplier. This is a transverse radial check: angles advance by 2π per turn, and attraction does not reset phase.

{{CODE:hopf}}

### Deeper: why ordinary planar flows have a special restriction

A region can trap a trajectory without solving it. At a=.25, draw the annulus with inner radius .25 and outer radius .75.

[[D26]]

On its inner boundary r′=.25(.25−.25²)>0, so the arrow enters the annulus. On the outer boundary r′=.75(.25−.75²)<0, so it also points inward. The origin is excluded, and θ′=1 prevents any other equilibrium there. This is a compact positively invariant region: every trajectory starting in it stays in it for future times.

For a continuously differentiable autonomous planar vector field, a trajectory trapped in an appropriate compact positively invariant region, whose omega-limit set contains no equilibrium, has a periodic orbit as that limit set. The omega-limit set contains states approached along arbitrarily late times. This is a useful form of the Poincaré–Bendixson theorem, not a guarantee that every two-dimensional trajectory is periodic. Escape, equilibria and connections between them require separate treatment.

The familiar strange-attractor mechanism of the Lorenz flow needs more than this planar autonomous setting. A periodically forced two-coordinate model gains a third coordinate when the forcing phase is included. A discrete one-dimensional noninvertible map also avoids the planar-flow restriction because iteration is not a unique continuous-time planar flow.

## 6. Feed an output back into the rule

Now switch time conventions: one update is one generation. The logistic map xₙ₊₁=r xₙ(1−xₙ) treats x as a scaled population and r as a growth parameter. The factor 1−x reduces growth as the current state approaches its upper scale. This is a deliberately simple feedback model, not a universal population law. For 0≤r≤4 and 0≤x≤1, the output remains in [0,1] because x(1−x) lies between 0 and 1/4. Outside this parameter range that state-space promise fails.

How does an output become the next input? Start at x=.2 on the horizontal axis, rise to the graph, then move horizontally to the diagonal where input equals output.

[[D27]]

The vertical move evaluates F; the horizontal move feeds its result back. The first investigation starts at r=2.5, x=.2. Advance one step at a time before editing the starting state. The highlighted point on the sequence shares its identity with the current cobweb corner.

At r=2.5, starting from 0.2 gives 0.4, then 0.6, then 0.6 again. The long-run state can be found by solving x=r x(1−x): zero is always a fixed point; when r>0 the other algebraic root is 1−1/r. That second root is inside the population interval only when r≥1, and it coincides with zero at r=1.

Zoom around the nonzero intersection of the graph and diagonal. A displacement to one side returns on the other side with half its size at r=2.5.

[[D28]]

The derivative is F′(x)=r(1−2x). At zero its value is r. At the nonzero root it is 2−r, whose magnitude is below 1 for 1<r<3. A negative multiplier means alternate-side corrections; magnitude below 1 means those corrections shrink. The cobweb exposes both steps of feedback: evaluate the rule, then use that output as the next input.

### When the fixed point loses stability, inspect a whole cycle

A two-cycle consists of distinct points x₋ and x₊ with F(x₋)=x₊ and F(x₊)=x₋. Solve F(F(x))=x, factor out the fixed-point roots, and the remaining roots are:

$$
x_\pm=\frac{r+1\pm\sqrt{(r-3)(r+1)}}{2r}.
$$

Follow both local derivative factors around one return, rather than treating either point as a fixed point of F.

[[D29]]

The first tangent factor carries a disturbance to the other point; the second carries it back. Their product decides local stability of the cycle. The later two-cycle investigation begins at r=3.2, after this distinction has a meaning.

For r>3 these are distinct real points in the invariant interval for the displayed range. Stability depends on the derivative of a full return: multiply F′ at both points. The result is 4+2r−r². Its magnitude is below 1 for 3<r<1+√6, about 3.44949. At r=3.2 the points are approximately 0.513045 and 0.799455, and one full two-step cycle has multiplier 0.16.

This produces the first **period doubling**: an attracting fixed point gives way to an attracting two-cycle. Later doublings produce four, eight and further periods. The classical sequence accumulates near r=3.56995, but this is not a dividing line after which every parameter has identical chaotic behavior. There are periodic windows, including an attracting period-three regime near r=3.83. A finite atlas also misses windows narrower than its parameter grid.

A parameter atlas now holds the update rule fixed within each column and changes r between columns. It is always visible; selecting a column links its parameter to a local orbit without replacing the earlier fixed-point investigation.

[[D30]]

The construction uses 151 equally spaced r values from 2.5 to 4, starts each at .217, discards 1,000 updates and draws the next 48. Those 7,248 marks are a finite sample of parameter and time. Select the actual r=3.83 grid column to see the window; a nearby column must not be relabeled as 3.83. Dark vertical concentration means repeated sampled values, not an estimated probability density.

The full programme below independently evaluates the exact two-cycle formula and full multiplier at 3.2. It then uses the same logistic function to print eight tail states at several declared parameters. Those tails expose the four original regimes and the period-three contrast. It does not prove that every later iterate shares the observed pattern.

{{CODE:cycles}}

### Deeper: equality at r=1 or r=3 needs nonlinear terms

At r=1, every 0<x<1 decreases under x↦x−x² and is bounded below by zero. Its limit must satisfy L=L−L², so L=0. The boundary fixed point attracts from the admissible right side even though its derivative equals 1. At r=3, write x=2/3+δ. One step gives δ↦−δ−3δ². Two steps give δ↦δ−18δ³−27δ⁴. For sufficiently small nonzero δ, the leading cubic correction reduces its magnitude after two steps. Thus the marginal case needs nonlinear reasoning; the strict derivative test was inconclusive rather than false.

## 7. Measure sensitivity without overclaiming

Deterministic means the rule and full initial state specify the evolution. It does not mean that an initial measurement with finite precision permits accurate predictions indefinitely. To examine sensitivity, run the same rule from x₀ and x₀+δ₀. Their actual separation δₙ is a finite difference. For a sufficiently small difference, linearization instead predicts a tangent disturbance that is multiplied by the derivative at each point of the reference orbit.

$$
\begin{aligned}
\delta_{n+1}&\approx F'(x_n)\delta_n,\\
\log\left|\frac{\delta_n}{\delta_0}\right|
&\approx\sum_{j=0}^{n-1}\log|F'(x_j)|.
\end{aligned}
$$

First inspect a chain short enough to calculate by hand. At r=2.5 the reference path .2→.4→.6→.6 has derivatives 1.5, .5 and −.5.

[[D31]]

An initial tangent displacement .001 becomes .0015, .00075 and −.000375. Its signed total multiplier is −3/8; the logarithmic magnitude is log(3/8), the sum of the three log magnitudes. The sign records direction, while the logarithm records size. These are linearized displacements, not another independently evolved nonlinear orbit.

A **Lyapunov exponent**, when this limit exists for the stated orbit, is the long-run average logarithmic tangent expansion per update. In a multidimensional system there can be several directional rates. A finite estimate uses a declared number of terms, often after discarding a transient. It is evidence about that chosen orbit and window; it is not automatically the limiting exponent of every initial state.

$$
\lambda(x_0)=
\lim_{n\to\infty}\frac1n
\sum_{j=0}^{n-1}\log|F'(x_j)|.
$$

Now compare a true pair with the tangent diagnostic beside it. Start the ordinary experiment at r=3.9, x=.2 and δ=.000001, then switch to r=2.5 without changing the question.

[[D32]]

The two curves share one update index. The separation plot uses log₁₀|x′ₙ−xₙ| and labels a zero separation separately rather than adding an arbitrary floor. The finite exponent uses natural logs along the reference orbit after 1,000 discarded updates and 2,000 retained derivative terms. It is a different measurement, so its window and units stay visible. Edit the signed disturbance directly to see the distinction; an invalid or unrepresentable second start keeps the last valid pair and explains why.

The logarithm converts products into sums and makes exponential growth appear linear. Use natural logarithms for λ in these equations; the lab labels its separation chart with base-10 logs for readability. If a derivative is exactly zero, its log is −∞. Replacing it by an arbitrary small number manufactures a different exponent. Higher-order finite perturbations may still move away after such a zero tangent derivative.

There is a special input where the ordinary first-order story stops. The graph is horizontal at x=.5, so the first tangent derivative is exactly zero.

[[D33]]

The critical-state investigation starts at r=3.9, x=.5 and δ=.000001 with no discarded derivative terms. Its true pair still follows the nonlinear rule. Expanding one step gives a difference −3.9×10⁻¹², while the first tangent displacement is zero. These are compatible results for different quantities.

The original short pure-Python programme below fixes r=3.9 and both nearby initial states. Its loop overwrites each state with its next value 50 times, then prints the rounded endpoints and their absolute difference. It prints no trajectory, derivative product or chaos classification. Read the final difference in light of the critical first step just derived.

{{CODE:original}}

The preserved nearby-start program illustrates a large eventual difference. Notice its special initial state x₀=0.5: the logistic derivative is zero there. Expanding exactly gives F(0.5+δ)−F(0.5)=−rδ². The first difference is quadratic and shrinks dramatically before later updates amplify it. That is a useful example of why a dramatic final number should not replace analysis of the intermediate mechanism.

### What does a positive rate establish?

Can a positive tangent rate coexist with a completely repeating reference state? Compare the state path and its derivative chain on separate aligned rows.

[[D34]]

Positive tangent expansion is a hallmark of many chaotic regimes, but it is insufficient by itself to classify an orbit as chaotic. At r=4, the exact state x=0.75 is fixed forever, while |F′(0.75)|=2 and its exponent is ln2>0. The orbit is an unstable periodic orbit. Unbounded simple expansion, such as x↦2x on the real line, also has a positive rate without the bounded recurrent stretching-and-folding behavior we want to explain.

There are several formal definitions of chaos, suited to different settings. Sensitive dependence, recurrence, aperiodicity of typical trajectories, topological mixing and measure-theoretic properties are related but are not interchangeable one-line tests. In the next section, we will use an exact bounded map where stretching, folding, dense periodic points and mixing can be justified directly. A finite jagged plot alone proves none of those infinite-time statements.

One more distinction matters: measuring a tangent gain, resetting its size and continuing along the same reference orbit is not evolving an unrestricted second orbit.

[[D35]]

The upper sketch propagates a tiny arrow, records its gain and renormalizes it before the next multiplication. The lower constructed curve eₙ=10⁻⁵ exp(.4n) crosses the tolerance .02 at n=log(2000)/.4≈19.0023, between integer updates 19 and 20. Its axes are update count and base-10 error; it is an illustrative growth model, not a fitted logistic output. Keep that example separate from the programme's 10⁻⁶, .01 and .5 parameters below.

Actual pair separation in [0,1] cannot grow beyond 1. Once it reaches the scale of the attractor, the tangent approximation no longer predicts that pair. Estimating λ by fitting a straight line across the saturated region understates expansion. Tangent propagation or repeated renormalization addresses that measurement issue; it does not remove finite-sample, roundoff or model errors.

$$
n_{\mathrm{horizon}}\approx
\frac{\log(\varepsilon/|\delta_0|)}{\lambda},
\qquad \lambda>0.
$$

This forecast horizon assumes a roughly representative positive rate, a small initial error and a tolerance ε within the regime where local growth remains useful. With δ₀=10⁻⁶, ε=0.01 and λ=0.5 per update, it is about 18.4 updates. It is an approximation under that growth model, not a guaranteed forecast deadline. Uncertain parameters, hidden forcing or numerical error can invalidate its assumptions sooner.

`finite_exponent` discards the requested transient, evaluates the derivative at each current reference state, accumulates natural-log magnitudes, and only then advances that state. It returns negative infinity for an exactly zero derivative instead of silently regularizing it. The earlier programme propagates a pair, whereas this one computes tangent averages; the ordinary browser investigation displays a 70-update pair. The final formula evaluates the stated approximate forecast horizon; it is not a test asserting how long the observed pair stays accurate.

{{CODE:exponent}}

## 8. See why stretching and folding matter

To see the mechanism without a complicated simulator, use the **tent map** T(y)=2y on the left half of [0,1], and T(y)=2(1−y) on the right half. Each half stretches to the full interval, and the right half folds back. Expansion separates nearby inputs until they encounter different branches; folding keeps the outputs bounded. The graph's two straight segments make that mechanism explicit.

See what each branch does to an entire interval, rather than only to a point.

[[D36]]

The left half [0,.5] covers [0,1] in its original orientation. The right half [.5,1] covers the same output interval in reversed orientation. Label the halves L and R in addition to their different colours. Both branches expand distances locally by a factor of two; the reversal keeps the combined rule within the state space.

An L/R word records which half an orbit visits at each step. To find inputs with a chosen itinerary, work backward: the inverse left branch is u↦u/2 and the inverse right branch is u↦1−u/2. Compose those inverse branches in the itinerary's order. For LR, the result is u↦1/2−u/4, giving initial interval [1/4,1/2]. Two forward steps carry that whole interval across [0,1]. Endpoints can admit more than one branch label.

Apply the inverse operations in the order dictated by the desired itinerary. For LR, the later R inverse acts first on the target interval; the earlier L inverse then locates the initial interval.

[[D37]]

Thus L(R(u))=.5−u/4. A forward check sends [1/4,1/2] to [1/2,1] and then to [0,1], with the endpoint orientation retained by arrows. Reversing the word produces a different initial interval; do not reverse the word merely because the function calls are evaluated from the inside.

[[D38]]

The default word LR also contains its repeating point 2/5: it maps to 4/5 and back. Append or remove a letter to see a nested itinerary interval, with a magnified local axis beside the full [0,1] strip. The magnification is labeled; a two-pixel sliver must not become an apparently unchanged interval.

### From the picture to actual dynamical statements

To pass from a finite drawing to the theorem, track the whole itinerary interval through all n steps.

[[D39]]

A word of length n defines an interval of width 2⁻ⁿ, with Tⁿ mapping it onto the entire unit interval. These intervals partition [0,1] apart from shared endpoints, and their maximum width tends to zero. Therefore any open interval of starting states contains a sufficiently small full itinerary interval. After enough updates its image covers [0,1], and every later image still does. That proves a strong mixing property: any initial open region eventually reaches any target open region.

The inverse composition for that itinerary has slope ±2⁻ⁿ and maps [0,1] into the itinerary interval. It is a contraction, so it has a unique fixed point. That point returns under n forward steps, although its smallest period may divide n. Every open interval therefore contains a periodic point. These dense periodic points coexist with sensitive dependence; they do not mean that every orbit is periodic. Together with the mixing argument, they establish the familiar topological chaos criteria for this map.

The same dynamics can be written in a different coordinate. The square of operations below begins with one y and ends at the same x by either path.

[[D40]]

Now relate this exact picture to the logistic map at r=4. Make the monotone coordinate change h(y)=sin²(πy/2), a continuous one-to-one mapping of [0,1] onto itself. The double-angle identity gives 4h(y)(1−h(y))=h(T(y)). Updating the tent coordinate and then changing coordinates produces exactly the same result as changing coordinates first and applying the logistic rule. This is a **conjugacy**: the two maps describe the same topological dynamics using different coordinates.

At the default y=.2, first applying T gives .4, then h gives sin²(.2π). Applying h first gives sin²(.1π), and the logistic-4 update gives the same result by the double-angle identity. The later coordinate control changes both paths together. It is introduced only after h has been explained; it does not appear in the earlier inverse-word investigation.

### Individual uncertainty can coexist with stable statistics

Follow incoming probability through the two inverse branches. Use the target interval [.2,.6] as a checkable width .4.

[[D41]]

Its inverse intervals are [.1,.3] and [.7,.9]. Each has width .2 and uniform probability .2, so their combined mass equals the target's .4. The intervals remain visibly separated; adding their probabilities does not join them into a new geometric interval.

Under a uniform distribution of tent inputs, a target interval of width w has two inverse intervals each of width w/2. Its total incoming probability is w, so the uniform law is **invariant**: one update leaves that probability distribution unchanged. Invariance is a statement about a distribution of states, not a claim that an individual state stays fixed.

Changing coordinates also changes interval widths and therefore density. Carry the selected probability strip from the uniform y axis to the x axis before drawing its CDF and density.

[[D42]]

Changing from y to x=h(y) transforms that invariant law. Since h is increasing, the probability of being below x is h⁻¹(x)=2 arcsin(√x)/π. Differentiate to obtain the density on 0<x<1:

$$
\begin{aligned}
H(x)&=\frac2\pi\arcsin\sqrt{x},\\
p(x)&=\frac{1}{\pi\sqrt{x(1-x)}}.
\end{aligned}
$$

The density is high near the two ends but integrable: total probability is H(1)−H(0)=1. A high density at an endpoint does not mean an atom of positive probability sits exactly there. The probability below 0.25 is 1/3; between 0.25 and 0.75 it is also 1/3. The invariant mean is 1/2 by symmetry. Thus an irregular individual trajectory can belong to a system with precisely specified long-run statistical laws.

The ergodic theorem for this map gives those time frequencies for almost every initial point under the invariant law, and its typical Lyapunov exponent is ln2. “Almost every” permits exceptional measure-zero initial states, such as exact periodic orbits and critical preimages. Invariance alone, for an arbitrary dynamical system, would not guarantee that one trajectory samples the full invariant distribution. That additional ergodic qualification matters.

A finite binary grid is a different object from the continuum theorem. For the exact rational start 51/256, repeated tent updates eventually reach zero.

[[D43]]

The programme keeps that example exact with `Fraction`. `inverse_word` builds an affine inverse composition and solves its fixed-point equation; the printed interval and two-step return check validate the short itinerary construction. Its final loop evaluates the analytic invariant CDF at .25, .75 and 1. It does not estimate that distribution by sampling a trajectory. The final rational path exposes how a finite representation can land in an exceptional orbit.

{{CODE:tent}}

A deterministic computation with finitely many representable states must eventually repeat if it continues indefinitely. That eventual periodicity is compatible with a real-number model having chaotic typical dynamics. In the exact dyadic tent example, repeated doubling shifts out all fractional bits and the orbit reaches zero. Do not infer either “chaos is impossible” or “my numerical orbit proves aperiodicity” from the finite computation.

## 9. Keep the full state behind a projection

The Lorenz system is a classic three-dimensional autonomous flow. It arose from a severe reduction of a convection model; its three dimensionless variables represent modes of that model, not a direct map of three geographical coordinates. We use it here to connect local equilibria, volume contraction, projections and finite numerical evidence.

$$
\begin{aligned}
\dot x&=\sigma(y-x),\\
\dot y&=x(\rho-z)-y,\\
\dot z&=xy-\beta z.
\end{aligned}
$$

A projection drops information. Follow one selected three-coordinate state into the x–y and x–z views, keeping the selected point and time linked.

[[D44]]

The displayed path uses fixed-step vector RK4 with h=.005, 4,800 updates and horizon 24 from (1,1,1). Those are declared numerical choices, not properties of the differential equation. The cursor initially selects update 2,400; decimating the drawn curve never changes the selected full state. Later comparisons use ρ=.5, 10 and 28. A crossing in one projection need not be a meeting of full states.

Fix σ=10 and β=8/3 and vary ρ. Solving the three zero-rate equations gives the origin, plus two nonzero equilibria when ρ>1: x=y=±√(β(ρ−1)), z=ρ−1. The plus/minus signs must match in x and y. At ρ=1 the branches coincide with the origin. Finding these equilibria does not establish that they attract.

Set all three rates to zero and compare those stationary states with a small volume carried by the flow.

[[D45]]

The sum of the diagonal Jacobian entries is −σ−1−β=−41/3. This **divergence** gives the instantaneous logarithmic contraction rate of infinitesimal phase-space volume. A small volume carried by the flow contracts by e⁻⁴¹ᵗ⁄³ while the flow exists. This does not mean every direction contracts: stretching in one direction can coexist with stronger contraction in others. Nor does negative divergence by itself prove bounded trajectories or chaos.

At the familiar parameter ρ=28, generic numerical starts show the well-known repeated excursions between two regions. The two projection choices expose different parts of the same finite three-coordinate path. A return close in x and z may remain far away in y. A visually dense loop is also not proof of an exact periodic orbit: a periodic orbit must repeat the full state, with appropriate numerical or analytical evidence.

### Build the vector step before asking a solver to do it

A Runge–Kutta step evaluates the field at trial states. These trials are probes used to form one accepted endpoint; they are not four successive accepted time steps.

[[D46]]

For an initial state (1,1,1), the first rate is (0,26,−5/3). RK4 samples that field at time t, twice at t+h/2 with different trial states, and at t+h. Each trial is constructed from the same original state plus its indicated increment. The endpoint uses the weighted average (k₁+2k₂+2k₃+k₄)/6. Every rate and trial retains three coordinates even when the diagram magnifies only x and y; its two axes explicitly use different scales.

In the complete implementation below, `rk4_step` performs those four vector operations. It assumes the field returns one rate per state coordinate. `fixed_grid` checks the finite, positive horizon and step, requires an integer number of at most 10,000 updates, and rejects a nonfinite initial state or trajectory. It returns every accepted time and state so a selected projection cannot silently lose the third coordinate.

{{CODE:rk4}}

At t=.5, the coarse step differs from the preserved rounded reference by about 1.64×10⁻⁵ in the largest coordinate; halving h reduces this to about 1.06×10⁻⁶. The reference is rounded to six decimal places, with up to .5×10⁻⁶ uncertainty in each coordinate. Therefore those differences are not exact integration errors, and their ratios do not establish convergence order. At t=1 the finer comparison is already below that rounding scale. This is a short-horizon consistency check with an independently obtained stored result.

Now separate requested output times from an adaptive solver's own integration mesh.

[[D47]]

`t_eval` asks where to report the computed solution; it does not prescribe the solver's internal step size. A directed event instead seeks a zero of a supplied function along the interpolated path. For a Poincaré section, exclude the initial section point and select the crossing direction. These distinct clocks and choices remain explicit.

The preserved SciPy programme now has a concrete role. It uses `solve_ivp` with DOP853 at relative/absolute tolerances 10⁻⁹/10⁻¹¹ and 10⁻¹²/10⁻¹⁴ and compares requested states at .5 and 1. Its Lorenz function computes the three rates from the full state. The printed Boolean tests whether the maximum difference between those two numerical solutions is below 10⁻⁶; it does not compare either solution with an exact trajectory. The surrounding prose carries that interpretation instead of printing an explanatory sentence from the program.

{{CODE:lorenz}}

A sound numerical investigation first checks short trajectories against an independent solver or refinement, confirms equilibria satisfy the equations, and tests invariants or balance laws where available. For longer sensitive trajectories, two accurate approximations can separate pointwise; then assess the quantities relevant to the question, such as finite-time statistics, with their own convergence and uncertainty checks. A theorem about this idealized system remains different from validation of a weather forecast or measured physical device.

When using an adaptive solver, relative and absolute tolerances control its local error estimate. They are not a universal bound on total global error. An event detector based on sign changes can miss multiple crossings within one integration step; a return-map experiment needs a suitable event direction, step control and validation. The complete Lorenz program deliberately makes only a short-horizon agreement claim.

## 10. Check the dynamics of the numerical method

Which orbit belongs to the physical model and which belongs to its numerical update? Keep the exact curve and update points at the same physical times.

[[D48]]

Return to cooling x′=−kx. Forward Euler gives xₙ₊₁=(1−kh)xₙ, so its strict attraction condition is |1−kh|<1, or 0<kh<2. At kh=2 it alternates without shrinking; beyond 2 it amplifies alternating signs. The exact cooling solution still decays for every positive k. A large step has created instability that the original system does not have. Even a stable step can be inaccurate.

### For an oscillator, inspect the quantity that should be preserved

Use q′=p and p′=−q, with initial state (1,0). The earlier center used q′=−p, p′=q and followed (cos t,sin t), counterclockwise from (1,0). This section uses q′=p, p′=−q and follows (cos t,−sin t), clockwise. Reflecting the p coordinate changes one convention into the other. Their period 2π and energy E=(q²+p²)/2 agree; their direction does not. Forward Euler updates both coordinates from their old values: qₙ₊₁=qₙ+h pₙ and pₙ₊₁=pₙ−h qₙ. Squaring and adding cancels the cross terms, leaving Eₙ₊₁=(1+h²)Eₙ. It injects energy at every nonzero step.

Draw the two old-state increments before summing them. At (1,0), forward Euler ends at (1,−h), outside the original unit circle.

[[D49]]

Now kick p by −hq, then use that new p to drift q. At (1,0), the intermediate state is (1,−h) and the final state is (1−h²,−h).

[[D50]]

The kinked path describes the order of arithmetic, not an exact physical trajectory during the step. Reusing old p for the drift changes the algorithm back to forward Euler.

A simple **symplectic Euler** variant first kicks the momentum and then drifts the position using the new momentum. It respects a geometric structure of Hamiltonian dynamics, but that does not mean it exactly conserves the original energy.

$$
\begin{aligned}
p_{n+1}&=p_n-hq_n,\\
q_{n+1}&=q_n+h p_{n+1},\\
\widetilde E(q,p)&=
\tfrac12(q^2+p^2-hqp).
\end{aligned}
$$

Apply each linear update to the corners of one unit square.

[[D51]]

Forward Euler has matrix [[1,h],[−h,1]] with determinant 1+h², so it expands area. Kick–drift has matrix [[1−h²,h],[−h,1]] with determinant 1, so the transformed parallelogram has the same area. In this two-dimensional canonical setting, this is the symplectic area condition. Area preservation alone says nothing about the ordinary radius of every point.

[[D52]]

Compare the physical circle with the modified-energy contour through (1,0). For |h|<2 the latter is an ellipse. At h=2 it becomes the two parallel lines (q−p)²=1, which cannot contain the state inside a bounded region.

Substitution shows that this update preserves the displayed modified energy in exact arithmetic. For |h|<2 that quadratic form is positive-definite, so its bounded level curves constrain the numerical orbit. The ordinary energy oscillates. At |h|=2 the form becomes degenerate and the update is generally not bounded; outside that interval the useful boundedness argument fails. The browser's oscillator choices stay inside the strict range, while the independent practice examines the boundary.

Use the same endpoint time 20 for every step-size choice and show both energy functions on the same computed states.

[[D53]]

`integrate_oscillator` advances both rules in the same loop. The Euler tuple assignment forms both new coordinates from the old pair; the symplectic assignment updates momentum before position. It returns final ordinary energy for each rule and final modified energy for the symplectic state. The programme does not retain intermediate states or print a maximum error. Those fuller curves belong to the separately labeled browser investigation. The printed growing Euler energy and bounded symplectic oscillation therefore test the mechanisms just drawn, without treating either method as an exact physical path.

{{CODE:energy}}

Compare methods over the same physical time. At h=0.1, reaching t=20 requires 200 steps; at h=0.5 it requires 40. Comparing 40 steps of each would mix different horizons with different accuracy. Choose errors that reflect the task: short-time state error, phase error over many revolutions, conservation drift, an event time, or a statistical quantity. A method with an attractive-looking trace can still get the quantity of interest wrong.

**Check the distinction.** The symplectic run reports modified energy 0.5 at every step. A teammate says it conserves the physical energy exactly. How do you check?

Compute both E=(q²+p²)/2 and Ẽ=(q²+p²−hqp)/2 on the same numerical states. They agree at this chosen initial state because qp=0, but generally differ later. The preserved modified function does not establish exact conservation of the original one.

## 11. Transfer the reasoning and practise

### Useful connections that carry the mechanism with them

A gradient step on a scalar quadratic is another version of the cooling multiplier. The loss curve shows what decreases while the state axis shows where the update lands.

[[D54]]

**Optimization.** Gradient flow x′=−∇L(x) decreases a smooth objective because dL/dt=−‖∇L‖². Its discrete counterpart xₙ₊₁=xₙ−η∇L(xₙ) can overshoot when the learning rate η is too large. For the scalar quadratic L(x)=kx²/2, its multiplier is 1−ηk, exactly the same stability calculation as Euler cooling. Decreasing a nonconvex objective does not certify a global minimum; basins and stationary points still matter.

**Recurrent models and gradients.** A recurrent state update has a Jacobian at each step. Small forward disturbances and reverse gradient propagation involve ordered products of those matrices. In a fixed linear system, spectral analysis is a powerful first tool. For changing matrices, averaging their individual eigenvalues loses how one step redirects the next one's input.

Trace one vector through two different Jacobians before looking at their spectra.

[[D55]]

Let A=[[0,2],[0,0]] and B=[[0,0],[2,0]]. Applied to e₂, A produces 2e₁; B then produces 4e₂. Both matrices individually have only zero eigenvalues, yet the ordered product BA has eigenvalue 4. The programme constructs exactly those matrices, prints their individual and product spectra and applies BA repeatedly. It demonstrates why a list of individual eigenvalues cannot replace the ordered product. Reverse-mode derivatives use transposes in the corresponding reversed composition order; the dependence on how steps align remains.

{{CODE:products}}

A small one-step defect can also be fed back by the rollout itself. Compare the true rule F(x)=.5x with the deliberately biased predictor G(x)=.5x+.1, both starting from 1.

[[D56]]

The true states through update 4 are 1,.5,.25,.125,.0625; the predicted states are 1,.6,.4,.3,.25. Their signed errors are 0,.1,.15,.175,.1875. Each new error equals .5 times the previous error plus the fresh .1 defect. The limiting error is .2 even though the true state tends to zero. This is a constructed example, not a trained model or dataset result. It makes repeated local bias visible without requiring exponential instability.

**Learned dynamics and control.** A neural ordinary differential equation learns a rate field, while a one-step predictor learns an update map. Low one-step training error does not ensure accurate rollouts: the model feeds its own errors back and can reach states absent from training. Model-predictive control repeatedly replans actions using a dynamics model; reinforcement learning also depends on the transition model or sampled transitions. Evaluate multi-step behavior, relevant constraints, uncertainty and conservation or stability features, rather than only one-step loss.

**Switching and oscillation in applications.** The two-well example gives a concrete model of bistability and switching thresholds. An attracting cycle instead describes self-sustained repetition. Excitable systems can make one large excursion after a threshold crossing and then return to rest without having a stable repeating cycle. That distinction is useful for neuron models, where the dedicated neural-modeling lesson supplies the biological variables and assumptions. The pictures here teach the mathematical mechanisms, not a diagnosis of a particular device or neuron.

Claims to repair before trusting a dynamical explanation

| Tempting claim | What to check instead |
| --- | --- |
| “The curve is irregular, so it is chaotic.” | Rule, full state, finite versus asymptotic evidence, numerical accuracy and an appropriate chaos criterion. |
| “All eigenvalues are negative, so every error shrinks immediately.” | Continuous versus discrete convention, the relevant norm, nonnormal transfer and transient growth. |
| “A multiplier of magnitude one means unstable.” | Nonlinear terms or a separate boundary analysis. |
| “The two starts end far apart, so they share one chaotic attractor.” | They may be on opposite sides of a basin boundary or under different forcing. |
| “Negative divergence proves a strange attractor.” | Volume contraction is not boundedness, recurrence or a chaos proof. |
| “The solver tolerance is my long-term forecast error.” | Local error estimates, global sensitivity, parameter uncertainty and the desired observable. |
| “An invariant distribution describes every initial orbit.” | Ergodicity, almost-everywhere qualifications and exceptional orbits. |

### Independent practice

Work out a prediction before opening a hint. Use a sketch or small calculation to explain the mechanism, then use code as a check. A numerical match is not a substitute for stating the assumptions behind the conclusion.

### 1. Find the missing state

A controller records only a pendulum's angle. Two visits to angle zero are followed by different next angles. Give two deterministic explanations and propose the state/input data needed to distinguish them.

<details><summary>Hint</summary>

A crossing can have a different direction or speed; the same mechanical state can also receive a different input.

</details>

<details><summary>Solution</summary>

The angular velocities may differ, so angle alone is incomplete. Alternatively, angle and velocity may agree but the torque, forcing phase or controller memory may differ. Record angle, angular velocity and relevant controller state, together with the applied input and clock/forcing phase. Do not label the mismatch stochastic until those deterministic omissions and measurement error have been examined.

</details>

### 2. Keep rates and multipliers separate

Analyze x′=−3x and the Euler update with h=0.2, 0.5 and 0.8. Which cases decay monotonically, decay with alternating signs, or grow? What happens at h=2/3?

<details><summary>Hint</summary>

Calculate 1−3h and compare its magnitude with 1.

</details>

<details><summary>Solution</summary>

The continuous solution is x₀e⁻³ᵗ. Euler multipliers are 0.4, −0.5 and −1.4. They give same-sign decay, alternating decay and alternating growth respectively. At h=2/3 the multiplier is −1: nonzero iterates alternate without decay. Strict stability does not imply a sufficiently accurate approximation.

</details>

### 3. Resolve a marginal linearization

Classify the origin for x′=0, x′=−x³ and x′=x³. Explain why their equal derivative at zero does not give them equal behavior.

<details><summary>Hint</summary>

Inspect the rate's sign on both sides and distinguish staying near from returning.

</details>

<details><summary>Solution</summary>

The zero field is stable but not attracting. The negative cubic is asymptotically stable with algebraic decay. The positive cubic repels on both sides and is unstable; every nonzero initial solution has a finite-time pole. All three linearizations are zero, so the missing nonlinear or exact information decides the result.

</details>

### 4. Change the basin landscape

For x′=4x−x³, find equilibria, their stability, the basins of the attracting ones and a decreasing potential. Do close starts always end close?

<details><summary>Hint</summary>

Factor x(4−x²), then integrate its negative to obtain V.

</details>

<details><summary>Solution</summary>

The equilibria are −2,0,2. The derivative 4−3x² is −8 at ±2 and +4 at zero, so ±2 attract and zero repels. Positive starts tend to 2; negative starts tend to −2; zero stays zero. V=x⁴/4−2x² has V̇=−(4x−x³)². Two arbitrarily close starts on opposite sides of zero end in different wells, separated by 4. This is a basin-boundary effect, not proof of chaos.

</details>

### 5. Explain transient amplification

For q′=−q+6p, p′=−2p, compare initial states (1,0) and (0,1) at t=ln2. Why does an eigenvalue list alone hide the contrast?

<details><summary>Hint</summary>

Use the exact expressions q=q₀e⁻ᵗ+6p₀(e⁻ᵗ−e⁻²ᵗ), p=p₀e⁻²ᵗ.

</details>

<details><summary>Solution</summary>

The first becomes (0.5,0), norm 0.5. The second becomes (1.5,0.25), norm √2.3125≈1.52069. The off-diagonal coupling transfers p into q for the second start. Both eventually decay; their finite-time norms differ because initial directions and the nonorthogonal eigenstructure matter.

</details>

### 6. A cycle is not a center

For r′=r/4−r³, θ′=1, predict the future of radii 0, 0.3 and 1. If two starts have the same radius but angles differing by π/4, does their phase difference vanish?

<details><summary>Hint</summary>

The positive radial equilibrium is 0.5, and both angles advance at the same speed.

</details>

<details><summary>Solution</summary>

Radius zero stays at the unstable origin. Radius 0.3 rises toward 0.5; radius 1 decreases toward 0.5. The angle difference remains π/4, so their positions do not converge at equal times even though both approach the attracting circle. A center would preserve every starting radius instead of attracting nearby radii to one isolated cycle. The radial return multiplier is e⁻π.

</details>

### 7. Recover the original four regimes

From x₀=0.217, compare logistic r=2.5, 3.2, 3.5 and 3.9. Discard 1,000 updates and inspect a longer retained sequence. Add r=3.83 and several nearby initial states. Which conclusions are numerical evidence, and which can you derive?

<details><summary>Hint</summary>

For 2.5 use the fixed-point multiplier. For 3.2 use both points and the full two-step derivative. Do not identify a period from only two similar rounded values.

</details>

<details><summary>Solution</summary>

At 2.5, the nonzero fixed point is 0.6 with multiplier −0.5, a derived local attraction result. At 3.2, the exact two-cycle is about 0.513045↔0.799455 with full-cycle multiplier 0.16, also a derived local result. The displayed finite runs at 3.5 settle to four rounded values; at 3.83 they settle to three. At 3.9 the tested tail is irregular and the finite exponent is positive for the tested generic start. Compare longer windows, starts, arithmetic and repeated-cycle residuals; these finite observations alone do not prove infinite-time aperiodicity. A start exactly at an unstable fixed point is an important exception.

</details>

### 8. Repair a chaos classifier

A classifier declares chaos whenever its finite exponent is positive. What does it return for r=4,x₀=0.75? What goes wrong when it replaces a zero derivative by 10⁻¹²?

<details><summary>Hint</summary>

Evaluate the map and derivative exactly at 0.75 and 0.5.

</details>

<details><summary>Solution</summary>

It misclassifies the fixed orbit 0.75, which has derivative −2 and exponent ln2 but period one. At a critical derivative zero, the actual log term is −∞. Substituting 10⁻¹² makes it a finite arbitrary negative term that can later be averaged away. That changes the quantity being estimated. Report the singular case, the orbit, window and definition rather than forcing a binary chaos label.

</details>

### 9. Use and qualify a forecast horizon

Assume a local growth rate 0.4 per update, initial error 10⁻⁵ and useful tolerance 0.02. Estimate the horizon, then name three reasons a real prediction may fail sooner.

<details><summary>Hint</summary>

Solve 10⁻⁵ exp(0.4n)=0.02.

</details>

<details><summary>Solution</summary>

The estimate is ln(2000)/0.4≈19.0 updates. It assumes a representative rate and a small-error regime. Time-varying expansion, parameter/model bias, hidden forcing, measurement error in another state direction or numerical error can shorten the useful horizon. Error saturation also makes the exponential model inappropriate for large tolerances.

</details>

### 10. Work backward through the tent

Find the starting interval and repeating point for itinerary RL. Then compute the logistic-4 invariant probability of 0.25≤x≤0.75. Why do neither results imply that every starting point has the same trajectory statistics?

<details><summary>Hint</summary>

Compose the inverse maps R(u)=1−u/2 and L(u)=u/2. Use the invariant CDF for the probability.

</details>

<details><summary>Solution</summary>

R(L(u))=1−u/4 maps [0,1] to [3/4,1]. Its fixed point solves y=1−y/4, giving y=4/5. It follows 4/5→2/5→4/5. The invariant probability is H(0.75)−H(0.25)=2/3−1/3=1/3. Exact periodic points can have exceptional frequencies; the stated typical time-frequency theorem holds almost everywhere under the invariant law, not at every point.

</details>

### 11. Inspect the integration boundary

Apply kick-then-drift symplectic Euler to (q,p)=(1,0) with h=2 for three steps. Does a conserved modified energy guarantee bounded motion at this step?

<details><summary>Hint</summary>

The modified form becomes (q−p)²/2 and no longer bounds q and p separately.

</details>

<details><summary>Solution</summary>

The states are (−3,−2), (5,4), then (−7,−6). Their norms grow while (q−p)²/2 stays 0.5. At h=2 the form is degenerate, and a constant value permits arbitrarily large q and p together. The positive-definite condition |h|<2 was essential to the boundedness argument.

</details>

### 12. Design an evidence plan

A learned simulator produces a butterfly-shaped phase plot and small one-step validation error. Propose a test plan before claiming it accurately models a chaotic physical system.

<details><summary>Hint</summary>

Separate the numerical method, the learned rule, the observed physical system and the particular prediction task.

</details>

<details><summary>Solution</summary>

Verify the implemented rule against independent short-time calculations and step/tolerance refinement. Inspect full states and inputs rather than only projections; check units, constraints and relevant balance laws. Evaluate held-out multi-step trajectories over declared horizons and initial/parameter uncertainty. Examine finite sensitivity and statistics with their assumptions and convergence checks, while distinguishing them from an infinite-time chaos theorem. Validate the quantities needed by the physical task against suitable measurements, including uncertainty and unobserved inputs. A pleasing shape and one-step loss alone establish none of these separate claims.

</details>

**Readiness check.** You should now be able to choose a state, distinguish a flow from a numerical update, analyze a new fixed point or short cycle, read a phase portrait, explain a basin or transient, and repair an overconfident conclusion from a finite simulation. If the explanation depends on a hidden coordinate, an unqualified equality case or an unexplained plotted number, return to that mechanism before proceeding.

**Next in this module:** [Itô Calculus & Stochastic Differential Equations](/learn/path/full-curriculum/it-calculus-stochastic-differential-equations?module=math-foundations) adds explicitly stochastic forcing to continuous evolution. Review the Brownian-increment and quadratic-variation reasoning in Stochastic Processes first. Numerical Methods later extends the integration tools, and Ordinary Differential Equations & Linear Systems provides a broader solution-method route. These links support the declared module sequence rather than replacing it with a publication-based jump.

## Further learning

- [Huang, Manchester: the logistic map, section 6.3](https://personalpages.manchester.ac.uk/staff/yanghong.huang/ads/html/maps-log.html) — fixed points, two-cycle factorization and bifurcation structure. Selected derivations were read and independently checked; marginal stability needs the separate reasoning given here.

- [Huang: nonlinear linearization](https://personalpages.manchester.ac.uk/staff/yanghong.huang/ads/html/equi-nl.html) and [existence of periodic orbits](https://personalpages.manchester.ac.uk/staff/yanghong.huang/ads/html/period-exist.html) — local manifold geometry and the conditions behind the planar limit-set theorem. These are deeper mathematical notes, not a shortcut around the conditions.

- [MIT Rothman: two-dimensional bifurcations](https://ocw.mit.edu/courses/12-006j-nonlinear-dynamics-chaos-fall-2022/mit12_006jf22_lec10-11.pdf) — inspected normal forms and Hopf/excitability discussion, pages 1–11. The lesson's equations and figures are independently derived; printed normal-form signs and powers should always be checked against the stated rule.

- [MIT Rothman: Lyapunov exponents](https://ocw.mit.edu/courses/12-006j-nonlinear-dynamics-chaos-fall-2022/mit12_006jf22_lec24.pdf) — sections 1.2–1.6 on perturbation evolution and renormalization. Useful after the scalar chain-rule example; general changing Jacobians require ordered products.

- [MIT Rothman: Poincaré sections](https://ocw.mit.edu/courses/12-006j-nonlinear-dynamics-chaos-fall-2022/mit12_006jf22_lec15-16.pdf) and [Lorenz equations](https://ocw.mit.edu/courses/12-006j-nonlinear-dynamics-chaos-fall-2022/mit12_006jf22_lec20-21.pdf) — inspected sections 1.1–1.2 and 1.3–1.4 respectively for oriented returns, varying return time and the physical-model reduction. The notes include a loop-model parameter variant; this lesson explicitly uses β=8/3.

- [Romik, UC Davis: mathematical chaos notes](https://www.math.ucdavis.edu/~romik/teaching-pages/mat119b/lecturenotes-119B.pdf) — Example 29 and sections 2.9–2.12 on invariant laws and ergodic qualifications; Exercise 26 gives the inverse coordinate correspondence. Read after the tent-map construction. Measure-preserving and ergodic are distinct properties.

- [Menon, Brown: dynamical systems notes](https://www.dam.brown.edu/people/menon/publications/ds-2020-1.pdf) — section 6.1–6.2 was inspected for Jacobian products, map/flow stability and transverse return maps. The broader graduate text offers additional depth in differential equations, Hamiltonian systems and numerical algorithms.

- [MIT Underactuated: Lyapunov analysis](https://underactuated.mit.edu/lyapunov.html) — direct-method, global and invariance-principle sections for why signs, level-set bounds and invariant sets matter. Follow with the dedicated nonlinear-control lesson for control-specific certificates.

- [SciPy: solve_ivp](https://docs.scipy.org/doc/scipy/reference/generated/scipy.integrate.solve_ivp.html) — solver methods, local error tolerances, maximum step and event limitations. The inspected documentation page identifies version 1.18.0; the native examples here were tested with SciPy 1.18.1. This is an implementation reference, not a guarantee of long-time accuracy.

For a spoken route, the [Strogatz/Cornell nonlinear dynamics course](https://www.youtube.com/playlist?list=PLbN57C5Zdl6j_qJA-pARJnKsmROzPnO9V) progresses through phase lines, oscillations, bifurcations and chaos. The playlist identity was checked through the instructor-linked course page; it was not watched end to end. Pair it with the written derivations and experiments here rather than expecting every convention to match.
