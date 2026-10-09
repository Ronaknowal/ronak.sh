# Dynamical Systems Theory & Chaos

A rule can be completely deterministic and still be difficult to predict far ahead. Learn to follow a state, recognize where it settles, explain why that behavior changes, and judge what a simulation actually establishes. The central question throughout is: which conclusion follows from the rule, and which is only evidence from a finite run?

Prerequisites: Read a derivative as a local rate, multiply a small matrix by a vector, and interpret an eigenvalue or Jacobian. A short rate-to-trajectory bridge is included; you do not need a prior differential-equations course. Probability density is refreshed where the statistical view begins.

On a first pass, follow the state, phase line, phase portrait and update pictures through section 7. Section 8 supplies an exact mathematical chaos mechanism; sections 9–10 explain what numerical trajectories can establish. The deeper arguments remain visible beside their motivating examples.

For earlier mathematical tools, revisit [matrix–vector multiplication](/learn/path/full-curriculum/vectors-matrices-tensor-operations?module=math-foundations) and [eigenvalues and eigenvectors](/learn/path/full-curriculum/eigenvalues-eigenvectors?module=math-foundations). A derivative here means the local change per unit input, and the chain rule multiplies the local effects of successive operations. Those meanings are refreshed before use; a prior ODE course is not assumed.

Follow the lesson in order, or return to a specific mechanism:

1. [Choose a state and a clock](#choose-a-state-and-a-clock)
2. [Ask what a disturbance does](#ask-what-a-disturbance-does)
3. [Read the landscape and its basins](#read-the-landscape-and-its-basins)
4. [See time through a phase portrait](#see-time-through-a-phase-portrait)
5. [Build an attracting oscillation](#build-an-attracting-oscillation)
6. [Feed an output back into the rule](#feed-an-output-back-into-the-rule)
7. [Measure sensitivity without overclaiming](#measure-sensitivity-without-overclaiming)
8. [See why stretching and folding matter](#see-why-stretching-and-folding-matter)
9. [Keep the full state behind a projection](#keep-the-full-state-behind-a-projection)
10. [Check the dynamics of the numerical method](#check-the-dynamics-of-the-numerical-method)
11. [Transfer the reasoning and practise](#transfer-the-reasoning-and-practise)

<a id="choose-a-state-and-a-clock"></a>

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

**Complete file: [dynamics_cooling.py](content-prepared/programmes/dynamics_cooling.py)**

```python
import math


def cooling_comparison(decay, initial, horizon, step):
    if not all(math.isfinite(value) for value in (decay, initial, horizon, step)):
        raise ValueError("Use finite inputs.")
    if (
        not 0 <= decay <= 4
        or abs(initial) > 100
        or not 0 <= horizon <= 30
        or not 1e-4 <= step <= 30
    ):
        raise ValueError(
            "Use decay in [0,4], |initial| <= 100, horizon in [0,30] and step in [1e-4,30]."
        )
    count = round(horizon / step)
    if not math.isclose(count * step, horizon, rel_tol=1e-12, abs_tol=1e-12):
        raise ValueError("Choose a step that divides the stated horizon.")
    if count > 10000:
        raise ValueError("This example supports at most 10000 updates.")
    value = initial
    for _ in range(count):
        value += step * (-decay * value)
        if not math.isfinite(value):
            raise ValueError("The numerical update exceeded the arithmetic range.")
    exact = initial * math.exp(-decay * horizon)
    return count, value, exact


for step in (0.25, 0.75, 1.5):
    count, numerical, exact = cooling_comparison(2, 8, 3, step)
    print(f"h={step:.2f}: {count} steps, Euler={numerical:.6f}, exact={exact:.6f}")
```

**Recorded output**

```text
h=0.25: 12 steps, Euler=0.001953, exact=0.019830
h=0.75: 4 steps, Euler=0.500000, exact=0.019830
h=1.50: 2 steps, Euler=32.000000, exact=0.019830
```

The smallest listed step decays to 0.001953 rather than the exact 0.019830. It is stable but not especially accurate at this horizon. At h=.75 the multiplier is −.5, so the sign alternates while the magnitude decays; at h=1.5 the multiplier is −2 and the approximation grows. These calculations concern the numerical rule, not a change in the cooling law.

### When is the next state actually determined?

The autonomous rule f(x) has no explicit clock dependence. A driven cart may instead obey x′=f(x,t,u(t)), where u is a specified control or external force. If you omit a changing input, two apparently identical recorded states may evolve differently. Adding a clock coordinate τ′=1 makes explicit time dependence autonomous in an enlarged state space; it does not make the unknown forcing known.

For ordinary differential equations, a continuously differentiable vector field near the initial state supplies local existence and uniqueness. More generally, continuity with local Lipschitz dependence on the state is a standard sufficient condition. Local existence leaves a separate question: how long does the solution remain finite?

[[D04]]

For x′=x² from x(0)=1, separation or direct differentiation gives x(t)=1/(1−t). The solution becomes unbounded as t approaches 1 from below. The original initial-value solution cannot be continued through that pole as a finite trajectory. Smoothness does not promise existence for all future time, and an algebraically permitted coordinate need not be physically meaningful.

**Check the distinction.** A recurrent predictor uses both its current output and an internal memory vector. Two runs have the same output but different memory. Must their next outputs agree?

No. The output alone is not the full state of that rule. A valid comparison must include the memory and the same next external input. This is a state-modeling issue, not automatically randomness or numerical error.

**Reproduce the examples.** Save each complete Python program below in its own file. Most use the standard library. The matrix-exponential and Lorenz examples need NumPy and SciPy; the Jacobian example needs NumPy. The eleven original programmes were run with Python 3.12.14, NumPy 2.3.5 and SciPy 1.18.1. The added vector RK4 and practice programmes were run with Python 3.12.8 and use only its standard library. The browser labs use their declared bounded models and do not execute Python. All unqualified coordinates and times in the mathematical examples below are dimensionless.

<a id="ask-what-a-disturbance-does"></a>

## 2. Ask what a disturbance does

A state that stays unchanged is an **equilibrium** of a continuous rule, or a **fixed point** of an update map. Solve f(x*)=0 for the former and F(x*)=x* for the latter. The star marks the special state; it is not multiplication. Finding a resting state is only the first question. The more useful question is what happens if the system starts a little away from it.

The outer tube below asks whether a trajectory stays within distance ε=1/2 of zero. The narrower starting band has δ=1/4. From x₀=1/5, exponential decay remains in the tube; positive linear growth eventually leaves it.

[[D05]]

The picture illustrates the quantifiers. For x′=−x, |x(t)|=|x₀|e⁻ᵗ≤|x₀|<δ<ε for every future time, so the argument works for every start in the chosen band. For x′=x, the displayed start crosses ε at t=ln(5/2). Two plotted trajectories alone would not establish a statement about every permitted start.

Four different promises about nearby starts

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

<a id="read-the-landscape-and-its-basins"></a>

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

**Complete file: [dynamics_scalar.py](content-prepared/programmes/dynamics_scalar.py)**

```python
import math


def cubic_solution(initial, time, attracting=True):
    if (
        not math.isfinite(initial)
        or not abs(initial) <= 2
        or not math.isfinite(time)
        or not 0 <= time <= 30
    ):
        raise ValueError("Use an initial state in [-2,2] and time in [0,30].")
    denominator = 1 + (1 if attracting else -1) * 2 * initial**2 * time
    if denominator <= 0:
        raise ValueError("The repelling solution has reached its finite-time pole.")
    return initial / math.sqrt(denominator)


def potential(value, parameter):
    return value**4 / 4 - parameter * value**2 / 2


def potential_rate(value, parameter):
    velocity = parameter * value - value**3
    return (value**3 - parameter * value) * velocity


for time in (0, 1, 4):
    stable = cubic_solution(0.25, time, True)
    unstable = cubic_solution(0.25, time, False)
    print(f"t={time}: -x^3 gives {stable:.6f}; +x^3 gives {unstable:.6f}")
for value in (-1.5, -0.5, 0, 0.5, 1.5):
    print(
        f"x={value:.1f}: V={potential(value, 1):.6f}, dV/dt={potential_rate(value, 1):.6f}"
    )
try:
    cubic_solution(0.25, 8, False)
except ValueError as error:
    print(error)
```

**Recorded output**

```text
t=0: -x^3 gives 0.250000; +x^3 gives 0.250000
t=1: -x^3 gives 0.235702; +x^3 gives 0.267261
t=4: -x^3 gives 0.204124; +x^3 gives 0.353553
x=-1.5: V=0.140625, dV/dt=-3.515625
x=-0.5: V=-0.109375, dV/dt=-0.140625
x=0.0: V=0.000000, dV/dt=0.000000
x=0.5: V=-0.109375, dV/dt=-0.140625
x=1.5: V=0.140625, dV/dt=-3.515625
The repelling solution has reached its finite-time pole.
```

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

<a id="see-time-through-a-phase-portrait"></a>

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

**Complete file: [dynamics_transient.py](content-prepared/programmes/dynamics_transient.py)**

```python
import numpy as np
from scipy.linalg import expm


def linear_state(matrix, initial, time):
    matrix = np.asarray(matrix, dtype=float)
    initial = np.asarray(initial, dtype=float)
    if matrix.shape != (2, 2) or initial.shape != (2,):
        raise ValueError("Use a 2 by 2 matrix and a two-component initial state.")
    if not np.isfinite(matrix).all() or not np.isfinite(initial).all():
        raise ValueError("Use finite entries.")
    if np.max(np.abs(matrix)) > 8 or np.max(np.abs(initial)) > 2:
        raise ValueError(
            "Use matrix entries of magnitude at most 8 and initial entries at most 2."
        )
    if not np.isfinite(time) or not 0 <= time <= 20:
        raise ValueError("This example supports time from zero to twenty.")
    result = expm(time * matrix) @ initial
    if not np.isfinite(result).all():
        raise ValueError("The result exceeded the supported arithmetic range.")
    return result


matrix = np.array([[-1.0, 6.0], [0.0, -2.0]])
print("eigenvalues", np.linalg.eigvals(matrix).tolist())
for time in (0, np.log(2), 6):
    state = linear_state(matrix, [0, 1], time)
    print(
        f"t={time:.6f}: ({state[0]:.6f}, {state[1]:.6f}), norm={np.linalg.norm(state):.6f}"
    )
```

**Recorded output**

```text
eigenvalues [-1.0, -2.0]
t=0.000000: (0.000000, 1.000000), norm=1.000000
t=0.693147: (1.500000, 0.250000), norm=1.520691
t=6.000000: (0.014836, 0.000006), norm=0.014836
```

Both eigenvalues are negative, yet the norm first exceeds its initial value. Eventual exponential decay permits a prefactor C greater than one; it never promised monotonic decay in every coordinate norm.

**Check the distinction.** Two phase curves cross in a picture of x against z from a three-dimensional model. Does uniqueness fail?

Not necessarily. Their omitted y coordinates may differ. Uniqueness applies to the full state of the same deterministic rule. Projected crossings can be artifacts of discarding a coordinate, and a time-varying rule also needs its clock/input context.

<a id="build-an-attracting-oscillation"></a>

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

**Complete file: [dynamics_hopf.py](content-prepared/programmes/dynamics_hopf.py)**

```python
import math


def radius_at(parameter, initial_radius, time):
    if not all(math.isfinite(value) for value in (parameter, initial_radius, time)):
        raise ValueError("Use finite values.")
    if not -1 <= parameter <= 1 or not 0 <= initial_radius <= 2 or not 0 <= time <= 30:
        raise ValueError("Use the stated parameter, radius and time ranges.")
    squared = initial_radius**2
    exponent = 2 * parameter * time
    # expm1(z)/z has continuous value 1 at zero. The series also handles
    # a nonzero parameter whose product with time rounds to zero.
    relative = (
        1 + exponent / 2 + exponent**2 / 6
        if abs(exponent) < 1e-7
        else math.expm1(exponent) / exponent
    )
    growth = math.exp(exponent)
    denominator = 1 + 2 * squared * time * relative
    return initial_radius * math.sqrt(growth / denominator)


period = 2 * math.pi
for parameter in (-0.25, 0, 0.25):
    returns = [radius_at(parameter, 0.3, count * period) for count in range(3)]
    print(f"a={parameter}: radii after turns", [round(value, 6) for value in returns])
parameter = 0.25
fixed_radius = math.sqrt(parameter)
epsilon = 1e-6
measured_multiplier = (
    radius_at(parameter, fixed_radius + epsilon, period)
    - radius_at(parameter, fixed_radius - epsilon, period)
) / (2 * epsilon)
print(f"radial return multiplier: {measured_multiplier:.6f}")
print(f"analytic multiplier: {math.exp(-4 * math.pi * parameter):.6f}")
```

**Recorded output**

```text
a=-0.25: radii after turns [0.3, 0.053785, 0.011119]
a=0: radii after turns [0.3, 0.20551, 0.166105]
a=0.25: radii after turns [0.3, 0.481834, 0.499172]
radial return multiplier: 0.043214
analytic multiplier: 0.043214
```

### Deeper: why ordinary planar flows have a special restriction

A region can trap a trajectory without solving it. At a=.25, draw the annulus with inner radius .25 and outer radius .75.

[[D26]]

On its inner boundary r′=.25(.25−.25²)>0, so the arrow enters the annulus. On the outer boundary r′=.75(.25−.75²)<0, so it also points inward. The origin is excluded, and θ′=1 prevents any other equilibrium there. This is a compact positively invariant region: every trajectory starting in it stays in it for future times.

For a continuously differentiable autonomous planar vector field, a trajectory trapped in an appropriate compact positively invariant region, whose omega-limit set contains no equilibrium, has a periodic orbit as that limit set. The omega-limit set contains states approached along arbitrarily late times. This is a useful form of the Poincaré–Bendixson theorem, not a guarantee that every two-dimensional trajectory is periodic. Escape, equilibria and connections between them require separate treatment.

The familiar strange-attractor mechanism of the Lorenz flow needs more than this planar autonomous setting. A periodically forced two-coordinate model gains a third coordinate when the forcing phase is included. A discrete one-dimensional noninvertible map also avoids the planar-flow restriction because iteration is not a unique continuous-time planar flow.

<a id="feed-an-output-back-into-the-rule"></a>

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

The construction uses 151 equally spaced r values from 2.5 to 4, starts each at .217, discards 1,000 updates and draws the next 48. Those 7,248 marks are a finite sample of parameter and time. Select r=3.83 to see a sampled column in the period-three window; its label identifies the parameter actually used. Dark vertical concentration means repeated sampled values, not an estimated probability density.

The full programme below independently evaluates the exact two-cycle formula and full multiplier at 3.2. It then uses the same logistic function to print eight tail states at several declared parameters. Those tails expose the four original regimes and the period-three contrast. It does not prove that every later iterate shares the observed pattern.

**Complete file: [dynamics_cycles.py](content-prepared/programmes/dynamics_cycles.py)**

```python
import math


def logistic_values(growth, initial, count):
    if not math.isfinite(growth) or not 0 <= growth <= 4:
        raise ValueError("Use growth from zero to four.")
    if not math.isfinite(initial) or not 0 <= initial <= 1:
        raise ValueError("Use an initial state in [0,1].")
    if type(count) is not int or not 0 <= count <= 10000:
        raise ValueError("Use an integer count from zero to 10000.")
    values = [initial]
    for _ in range(count):
        values.append(growth * values[-1] * (1 - values[-1]))
    return values


def two_cycle(growth):
    if not math.isfinite(growth) or not 3 < growth <= 4:
        raise ValueError("Distinct two-cycle points here require 3 < growth <= 4.")
    radical = math.sqrt((growth - 3) * (growth + 1))
    return (
        (growth + 1 - radical) / (2 * growth),
        (growth + 1 + radical) / (2 * growth),
    )


growth = 3.2
left, right = two_cycle(growth)
multiplier = growth**2 * (1 - 2 * left) * (1 - 2 * right)
print(f"two-cycle: {left:.6f}, {right:.6f}; multiplier={multiplier:.6f}")
for growth in (2.5, 3.2, 3.5, 3.83, 3.9):
    tail = logistic_values(growth, 0.217, 1008)[-8:]
    print(f"r={growth}: eight retained values", [round(value, 5) for value in tail])
```

**Recorded output**

```text
two-cycle: 0.513045, 0.799455; multiplier=0.160000
r=2.5: eight retained values [0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6]
r=3.2: eight retained values [0.51304, 0.79946, 0.51304, 0.79946, 0.51304, 0.79946, 0.51304, 0.79946]
r=3.5: eight retained values [0.38282, 0.82694, 0.50088, 0.875, 0.38282, 0.82694, 0.50088, 0.875]
r=3.83: eight retained values [0.15615, 0.50467, 0.95742, 0.15615, 0.50467, 0.95742, 0.15615, 0.50467]
r=3.9: eight retained values [0.35268, 0.89036, 0.38072, 0.91952, 0.28862, 0.80075, 0.62224, 0.91672]
```

### Deeper: equality at r=1 or r=3 needs nonlinear terms

At r=1, every 0<x<1 decreases under x↦x−x² and is bounded below by zero. Its limit must satisfy L=L−L², so L=0. The boundary fixed point attracts from the admissible right side even though its derivative equals 1. At r=3, write x=2/3+δ. One step gives δ↦−δ−3δ². Two steps give δ↦δ−18δ³−27δ⁴. For sufficiently small nonzero δ, the leading cubic correction reduces its magnitude after two steps. Thus the marginal case needs nonlinear reasoning; the strict derivative test was inconclusive rather than false.

<a id="measure-sensitivity-without-overclaiming"></a>

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

**Complete file: [dynamics_original.py](content-prepared/programmes/dynamics_original.py)**

```python
def logistic(x, r):
    return r * x * (1 - x)

r = 3.9
x, y = 0.5, 0.500001  # initial states differ by one millionth
for _ in range(50):
    x = logistic(x, r)
    y = logistic(y, r)

print(round(x, 6), round(y, 6), round(abs(x - y), 6))
```

**Recorded output**

```text
0.241355 0.800844 0.559489
```

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

**Complete file: [dynamics_exponent.py](content-prepared/programmes/dynamics_exponent.py)**

```python
import math


def finite_exponent(growth, initial, burn, count):
    if not math.isfinite(growth) or not 0 <= growth <= 4:
        raise ValueError("Use growth in [0,4].")
    if not math.isfinite(initial) or not 0 <= initial <= 1:
        raise ValueError("Use an initial state in [0,1].")
    if (
        type(burn) is not int
        or type(count) is not int
        or not 0 <= burn <= 10000
        or not 1 <= count <= 10000
    ):
        raise ValueError("Use bounded integer discard/average counts.")
    value = initial
    for _ in range(burn):
        value = growth * value * (1 - value)
    log_sum = 0.0
    for _ in range(count):
        derivative = growth * (1 - 2 * value)
        if derivative == 0:
            return -math.inf
        log_sum += math.log(abs(derivative))
        value = growth * value * (1 - value)
    return log_sum / count


for growth in (2.5, 3.2, 3.83, 3.9):
    print(
        f"r={growth}: finite average {finite_exponent(growth, 0.217, 1000, 2000):.6f}"
    )
print(f"fixed x=.75 at r=4: {finite_exponent(4, 0.75, 0, 20):.6f}")
print("critical x=.5 at r=4:", finite_exponent(4, 0.5, 0, 20))
error, tolerance, assumed_rate = 1e-6, 0.01, 0.5
print(
    f"local growth-model horizon: {math.log(tolerance / error) / assumed_rate:.3f} iterations"
)
```

**Recorded output**

```text
r=2.5: finite average -0.693147
r=3.2: finite average -0.916291
r=3.83: finite average -0.368193
r=3.9: finite average 0.518440
fixed x=.75 at r=4: 0.693147
critical x=.5 at r=4: -inf
local growth-model horizon: 18.421 iterations
```

<a id="see-why-stretching-and-folding-matter"></a>

## 8. See why stretching and folding matter

To see the mechanism without a complicated simulator, use the **tent map** T(y)=2y on the left half of [0,1], and T(y)=2(1−y) on the right half. Each half stretches to the full interval, and the right half folds back. Expansion separates nearby inputs until they encounter different branches; folding keeps the outputs bounded. The graph's two straight segments make that mechanism explicit.

See what each branch does to an entire interval, rather than only to a point.

[[D36]]

The left half [0,.5] covers [0,1] in its original orientation. The right half [.5,1] covers the same output interval in reversed orientation. The L and R labels identify the halves as well as their different colours. Both branches expand distances locally by a factor of two; the reversal keeps the combined rule within the state space.

An L/R word records which half an orbit visits at each step. To find inputs with a chosen itinerary, work backward: the inverse left branch is u↦u/2 and the inverse right branch is u↦1−u/2. Compose those inverse branches in the itinerary's order. For LR, the result is u↦1/2−u/4, giving initial interval [1/4,1/2]. Two forward steps carry that whole interval across [0,1]. Endpoints can admit more than one branch label.

Apply the inverse operations in the order dictated by the desired itinerary. For LR, the later R inverse acts first on the target interval; the earlier L inverse then locates the initial interval.

[[D37]]

Thus L(R(u))=.5−u/4. A forward check sends [1/4,1/2] to [1/2,1] and then to [0,1], with the endpoint orientation retained by arrows. Reversing the word produces a different initial interval; do not reverse the word merely because the function calls are evaluated from the inside.

Zoom into the itinerary interval and locate the point that repeats the same word.

[[D38]]

The default word LR also contains its repeating point 2/5: it maps to 4/5 and back. Append or remove a letter to see a nested itinerary interval, with a magnified local axis beside the full [0,1] strip. The magnification label lets you compare the local detail with the shrinking interval on the full ruler.

### From the picture to actual dynamical statements

To pass from a finite drawing to the theorem, track the whole itinerary interval through all n steps.

[[D39]]

A word of length n defines an interval of width 2⁻ⁿ, with Tⁿ mapping it onto the entire unit interval. These intervals partition [0,1] apart from shared endpoints, and their maximum width tends to zero. Therefore any open interval of starting states contains a sufficiently small full itinerary interval. After enough updates its image covers [0,1], and every later image still does. That proves a strong mixing property: any initial open region eventually reaches any target open region.

The inverse composition for that itinerary has slope ±2⁻ⁿ and maps [0,1] into the itinerary interval. It is a contraction, so it has a unique fixed point. That point returns under n forward steps, although its smallest period may divide n. Every open interval therefore contains a periodic point. The same covering argument explains sensitive dependence. Any arbitrarily small starting neighborhood contains a cylinder whose image is the entire unit interval after n steps. At that time choose an image endpoint at least 1/2 away from the reference image; its preimage is a nearby start that has separated. The fixed separation scale can therefore be reached from arbitrarily close starts. The dense periodic points do not mean that every orbit is periodic. Together with the mixing argument, they establish the familiar topological chaos criteria for this map.

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

**Complete file: [dynamics_tent.py](content-prepared/programmes/dynamics_tent.py)**

```python
from fractions import Fraction
import math


def tent(value):
    if not 0 <= value <= 1:
        raise ValueError("Use a coordinate in [0,1].")
    return 2 * value if value <= Fraction(1, 2) else 2 * (1 - value)


def inverse_word(word):
    if not 1 <= len(word) <= 10 or any(symbol not in "LR" for symbol in word):
        raise ValueError("Use one to ten L/R symbols.")
    slope, intercept = Fraction(1), Fraction(0)
    for branch in word:
        if branch == "R":
            intercept += slope
        slope *= Fraction(1 if branch == "L" else -1, 2)
    point = intercept / (1 - slope)
    return sorted((intercept, intercept + slope)), point


interval, periodic = inverse_word("LR")
print(
    "LR interval", [str(value) for value in interval], "periodic point", str(periodic)
)
print("two tent steps:", str(tent(tent(periodic))))
value = Fraction(51, 256)
quantized = []
for _ in range(10):
    quantized.append(str(value))
    value = tent(value)
print("finite binary-grid orbit:", quantized)
for boundary in (0.25, 0.75, 1):
    probability = 2 / math.pi * math.asin(math.sqrt(boundary))
    print(f"logistic-4 invariant mass below {boundary}: {probability:.6f}")
```

**Recorded output**

```text
LR interval ['1/4', '1/2'] periodic point 2/5
two tent steps: 2/5
finite binary-grid orbit: ['51/256', '51/128', '51/64', '13/32', '13/16', '3/8', '3/4', '1/2', '1', '0']
logistic-4 invariant mass below 0.25: 0.333333
logistic-4 invariant mass below 0.75: 0.666667
logistic-4 invariant mass below 1: 1.000000
```

A deterministic computation with finitely many representable states must eventually repeat if it continues indefinitely. That eventual periodicity is compatible with a real-number model having chaotic typical dynamics. In the exact dyadic tent example, repeated doubling shifts out all fractional bits and the orbit reaches zero. Do not infer either “chaos is impossible” or “my numerical orbit proves aperiodicity” from the finite computation.

<a id="keep-the-full-state-behind-a-projection"></a>

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

**Complete file: [lorenz_rk4_scratch.py](content-prepared/programmes/lorenz_rk4_scratch.py)**

```python
import math


def lorenz(time, state):
    q, p, z = state
    return (10 * (p - q), q * (28 - z) - p, q * p - (8 / 3) * z)


def rk4_step(field, time, state, step):
    def trial(slope, fraction):
        return tuple(y + fraction * step * k for y, k in zip(state, slope))

    k1 = field(time, state)
    k2 = field(time + step / 2, trial(k1, 1 / 2))
    k3 = field(time + step / 2, trial(k2, 1 / 2))
    k4 = field(time + step, trial(k3, 1))
    return tuple(y + step * (a + 2 * b + 2 * c + d) / 6
                 for y, a, b, c, d in zip(state, k1, k2, k3, k4))


def fixed_grid(field, initial, horizon, step):
    if not (math.isfinite(horizon) and math.isfinite(step)
            and horizon > 0 and step > 0):
        raise ValueError('Use a positive finite horizon and step.')
    count = round(horizon / step)
    if not 1 <= count <= 10000 or not math.isclose(count * step, horizon):
        raise ValueError('The step must divide the horizon into 1 to 10000 steps.')
    state = tuple(float(value) for value in initial)
    if not state or not all(math.isfinite(value) for value in state):
        raise ValueError('Use a nonempty finite state.')
    rows = [(0.0, state)]
    for index in range(count):
        state = rk4_step(field, index * step, state, step)
        if not all(math.isfinite(value) for value in state):
            raise ArithmeticError('A computed state is not finite.')
        rows.append(((index + 1) * step, state))
    return rows


if __name__ == '__main__':
    # These six-decimal reference states are retained DOP853 outputs.
    reference = {0.5: (1.198273, -8.867198, 32.454740),
                 1.0: (-9.378570, -8.357034, 29.362325)}
    for step in (0.005, 0.0025):
        rows = fixed_grid(lorenz, (1, 1, 1), 1, step)
        for time, target in reference.items():
            state = rows[round(time / step)][1]
            difference = max(abs(a - b) for a, b in zip(state, target))
            print(f'h={step:.4f}, t={time:.1f}:',
                  [round(value, 9) for value in state],
                  f'max difference to rounded reference={difference:.9g}')
        print('steps', len(rows) - 1, 'finite states',
              all(math.isfinite(value) for _, state in rows for value in state))
```

**Recorded output**

```text
h=0.0050, t=0.5: [1.198289424, -8.867197347, 32.454753257] max difference to rounded reference=1.6424484e-05
h=0.0050, t=1.0: [-9.37857129, -8.357035869, 29.362326013] max difference to rounded reference=1.86856753e-06
steps 200 finite states True
h=0.0025, t=0.5: [1.198273937, -8.867197809, 32.454741055] max difference to rounded reference=1.05525787e-06
h=0.0025, t=1.0: [-9.378570041, -8.357033931, 29.362325247] max difference to rounded reference=2.47189881e-07
steps 400 finite states True
```

At t=.5, the coarse step differs from the preserved rounded reference by about 1.64×10⁻⁵ in the largest coordinate; halving h reduces this to about 1.06×10⁻⁶. The reference is rounded to six decimal places, with up to .5×10⁻⁶ uncertainty in each coordinate. Therefore those differences are not exact integration errors, and their ratios do not establish convergence order. At t=1 the finer comparison is already below that rounding scale. This is a short-horizon consistency check with an independently obtained stored result.

Now separate requested output times from an adaptive solver's own integration mesh.

[[D47]]

`t_eval` asks where to report the computed solution; it does not prescribe the solver's internal step size. A directed event instead seeks a zero of a supplied function along the interpolated path. For a Poincaré section, exclude the initial section point and select the crossing direction. These distinct clocks and choices remain explicit.

The preserved SciPy programme now has a concrete role. It uses `solve_ivp` with DOP853 at relative/absolute tolerances 10⁻⁹/10⁻¹¹ and 10⁻¹²/10⁻¹⁴ and compares requested states at .5 and 1. Its Lorenz function computes the three rates from the full state. The printed Boolean tests whether the maximum difference between those two numerical solutions is below 10⁻⁶; it does not compare either solution with an exact trajectory. That short-time agreement answers a narrower question than long-term forecast accuracy.

**Complete file: [dynamics_lorenz.py](content-prepared/programmes/dynamics_lorenz.py)**

```python
import numpy as np
from scipy.integrate import solve_ivp


def lorenz(time, state, rho):
    first, second, third = state
    return [
        10 * (second - first),
        first * (rho - third) - second,
        first * second - 8 * third / 3,
    ]


def solve_lorenz(initial, rho, horizon, tolerance):
    initial = np.asarray(initial, dtype=float)
    if (
        initial.shape != (3,)
        or not np.isfinite(initial).all()
        or np.max(np.abs(initial)) > 20
    ):
        raise ValueError(
            "Use three finite initial components of magnitude at most twenty."
        )
    if (
        not np.isfinite(rho)
        or not 0.5 <= rho <= 28
        or not np.isfinite(horizon)
        or not 0 < horizon <= 30
    ):
        raise ValueError("Use rho in [.5,28] and horizon in (0,30].")
    if not np.isfinite(tolerance) or not 1e-12 <= tolerance <= 1e-6:
        raise ValueError("Use a tolerance in [1e-12,1e-6].")
    result = solve_ivp(
        lorenz,
        (0, horizon),
        initial,
        args=(rho,),
        method="DOP853",
        t_eval=np.linspace(0, horizon, 101),
        max_step=0.01,
        rtol=tolerance,
        atol=tolerance / 100,
    )
    if not result.success:
        raise RuntimeError(result.message)
    return result


first = solve_lorenz([1, 1, 1], 28, 1, 1e-9)
refined = solve_lorenz([1, 1, 1], 28, 1, 1e-12)
for index in (0, 50, 100):
    print(
        f"t={refined.t[index]:.2f}:",
        [round(value, 6) for value in refined.y[:, index].tolist()],
    )
print(
    "short-horizon disagreement below 1e-6:",
    bool(np.max(np.abs(first.y - refined.y)) < 1e-6),
)
```

**Recorded output**

```text
t=0.00: [1.0, 1.0, 1.0]
t=0.50: [1.198273, -8.867198, 32.45474]
t=1.00: [-9.37857, -8.357034, 29.362325]
short-horizon disagreement below 1e-6: True
```

A sound numerical investigation first checks short trajectories against an independent solver or refinement, confirms equilibria satisfy the equations, and tests invariants or balance laws where available. For longer sensitive trajectories, two accurate approximations can separate pointwise; then assess the quantities relevant to the question, such as finite-time statistics, with their own convergence and uncertainty checks. A theorem about this idealized system remains different from validation of a weather forecast or measured physical device.

When using an adaptive solver, relative and absolute tolerances control its local error estimate. They are not a universal bound on total global error. An event detector based on sign changes can miss multiple crossings within one integration step; a return-map experiment needs a suitable event direction, step control and validation. The complete Lorenz program deliberately makes only a short-horizon agreement claim.

<a id="check-the-dynamics-of-the-numerical-method"></a>

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

Now compare the shape of the original energy level with the one preserved by the update.

[[D52]]

Compare the physical circle with the modified-energy contour through (1,0). For |h|<2 the latter is an ellipse. At h=2 it becomes the two parallel lines (q−p)²=1, which cannot contain the state inside a bounded region.

Substitution shows that this update preserves the displayed modified energy in exact arithmetic. For |h|<2 that quadratic form is positive-definite, so its bounded level curves constrain the numerical orbit. The ordinary energy oscillates. At |h|=2 the form becomes degenerate and the update is generally not bounded; outside that interval the useful boundedness argument fails. The browser's oscillator choices stay inside the strict range, while the independent practice examines the boundary.

Use the same endpoint time 20 for every step-size choice and show both energy functions on the same computed states.

[[D53]]

`integrate_oscillator` advances both rules in the same loop. The Euler tuple assignment forms both new coordinates from the old pair; the symplectic assignment updates momentum before position. It returns final ordinary energy for each rule and final modified energy for the symplectic state. The programme does not retain intermediate states or print a maximum error. Those fuller curves belong to the separately labeled browser investigation. The printed endpoint energies are consistent with the mechanisms just drawn. The time plots, rather than the endpoint list alone, reveal the symplectic energy oscillation; neither method gives an exact physical path.

**Complete file: [dynamics_energy.py](content-prepared/programmes/dynamics_energy.py)**

```python
import math


def integrate_oscillator(step, count, initial=(1.0, 0.0)):
    if (
        not math.isfinite(step)
        or not 0 < step <= 0.5
        or type(count) is not int
        or not 0 <= count <= 2000
    ):
        raise ValueError("Use step in (0,.5] and at most 2000 integer steps.")
    if len(initial) != 2 or not all(
        math.isfinite(value) and abs(value) <= 2 for value in initial
    ):
        raise ValueError("Use two finite initial components of magnitude at most two.")
    position, momentum = initial
    forward_position, forward_momentum = initial
    for _ in range(count):
        forward_position, forward_momentum = (
            forward_position + step * forward_momentum,
            forward_momentum - step * forward_position,
        )
        momentum -= step * position
        position += step * momentum
    forward_energy = (forward_position**2 + forward_momentum**2) / 2
    symplectic_energy = (position**2 + momentum**2) / 2
    modified_energy = (position**2 + momentum**2 - step * position * momentum) / 2
    return forward_energy, symplectic_energy, modified_energy


for step in (0.5, 0.25, 0.2, 0.1):
    count = round(20 / step)
    forward, symplectic, modified = integrate_oscillator(step, count)
    print(
        f"h={step:.2f}, t=20: Euler E={forward:.6f}, symplectic E={symplectic:.6f}, modified E={modified:.6f}"
    )
```

**Recorded output**

```text
h=0.50, t=20: Euler E=3761.581923, symplectic E=0.512198, modified E=0.500000
h=0.25, t=20: Euler E=63.868263, symplectic E=0.471539, modified E=0.500000
h=0.20, t=20: Euler E=25.252474, symplectic E=0.473547, modified E=0.500000
h=0.10, t=20: Euler E=3.658009, symplectic E=0.483734, modified E=0.500000
```

Compare methods over the same physical time. At h=0.1, reaching t=20 requires 200 steps; at h=0.5 it requires 40. Comparing 40 steps of each would mix different horizons with different accuracy. Choose errors that reflect the task: short-time state error, phase error over many revolutions, conservation drift, an event time, or a statistical quantity. A method with an attractive-looking trace can still get the quantity of interest wrong.

**Check the distinction.** The browser’s symplectic trace reports modified energy 0.5 at every step. A teammate says it conserves the physical energy exactly. How do you check?

Compute both E=(q²+p²)/2 and Ẽ=(q²+p²−hqp)/2 on the same numerical states. They agree at this chosen initial state because qp=0, but generally differ later. The preserved modified function does not establish exact conservation of the original one.

<a id="transfer-the-reasoning-and-practise"></a>

## 11. Transfer the reasoning and practise

### Useful connections that carry the mechanism with them

A gradient step on a scalar quadratic is another version of the cooling multiplier. The loss curve shows what decreases while the state axis shows where the update lands.

[[D54]]

**Optimization.** Gradient flow x′=−∇L(x) decreases a smooth objective because dL/dt=−‖∇L‖². Its discrete counterpart xₙ₊₁=xₙ−η∇L(xₙ) can overshoot when the learning rate η is too large. For the scalar quadratic L(x)=kx²/2, its multiplier is 1−ηk, exactly the same stability calculation as Euler cooling. Decreasing a nonconvex objective does not certify a global minimum; basins and stationary points still matter.

**Recurrent models and gradients.** A recurrent state update has a Jacobian at each step. Small forward disturbances and reverse gradient propagation involve ordered products of those matrices. In a fixed linear system, spectral analysis is a powerful first tool. For changing matrices, averaging their individual eigenvalues loses how one step redirects the next one's input.

Trace one vector through two different Jacobians before looking at their spectra.

[[D55]]

Let A=[[0,2],[0,0]] and B=[[0,0],[2,0]]. Applied to e₂, A produces 2e₁; B then produces 4e₂. Both matrices individually have only zero eigenvalues, yet the ordered product BA has eigenvalue 4. The programme constructs exactly those matrices, prints their individual and product spectra and applies BA repeatedly. It demonstrates why a list of individual eigenvalues cannot replace the ordered product. Reverse-mode derivatives use transposes in the corresponding reversed composition order; the dependence on how steps align remains.

**Complete file: [dynamics_products.py](content-prepared/programmes/dynamics_products.py)**

```python
import numpy as np

first_step = np.array([[0.0, 2.0], [0.0, 0.0]])
second_step = np.array([[0.0, 0.0], [2.0, 0.0]])
two_step = second_step @ first_step
print(
    "each step's eigenvalues:",
    np.linalg.eigvals(first_step).tolist(),
    np.linalg.eigvals(second_step).tolist(),
)
print("two-step eigenvalues:", np.linalg.eigvals(two_step).tolist())
state = np.array([0.0, 1.0])
for cycle in range(4):
    print("cycle", cycle, "state", state.tolist(), "norm", float(np.linalg.norm(state)))
    state = two_step @ state
```

**Recorded output**

```text
each step's eigenvalues: [0.0, 0.0] [0.0, 0.0]
two-step eigenvalues: [0.0, 4.0]
cycle 0 state [0.0, 1.0] norm 1.0
cycle 1 state [0.0, 4.0] norm 4.0
cycle 2 state [0.0, 16.0] norm 16.0
cycle 3 state [0.0, 64.0] norm 64.0
```

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

Implement `cooling_multiplier(k,h)` returning the multiplier, its qualitative behavior and the absolute difference from the exact one-step multiplier e⁻ᵏʰ. Reject negative or nonfinite inputs. Keep a boundary return separate from strict attraction, and keep multiplier error separate from the stability label.

<details><summary>Hint</summary>

Calculate 1−3h and compare its magnitude with 1.

</details>

<details><summary>Solution</summary>

The continuous solution is x₀e⁻³ᵗ. Euler multipliers are 0.4, −0.5 and −1.4. They give same-sign decay, alternating decay and alternating growth respectively. At h=2/3 the multiplier is −1: nonzero iterates alternate without decay. Strict stability does not imply a sufficiently accurate approximation.

The complete solution classifies |1−kh| before its sign and reports |1−kh−e⁻ᵏʰ| separately. For the four requested steps the latter is approximately .148812, .723130, 1.490718 and 1.135335. Zero k or h yields a neutral multiplier 1. A stable label therefore supplies no accuracy tolerance; multiply the multiplier error by |x₀| to obtain this scalar one-step state error.

</details>

### 3. Resolve a marginal linearization

Classify the origin for x′=0, x′=−x³ and x′=x³. Explain why their equal derivative at zero does not give them equal behavior.

Repair a function for the positive cubic that takes a square root without checking its denominator. Use x₀=.5 at t=1 and t=2; reject any request at or beyond its pole rather than returning a complex or NaN state.

<details><summary>Hint</summary>

Inspect the rate's sign on both sides and distinguish staying near from returning.

</details>

<details><summary>Solution</summary>

The zero field is stable but not attracting. The negative cubic is asymptotically stable with algebraic decay. The positive cubic repels on both sides and is unstable; every nonzero initial solution has a finite-time pole. All three linearizations are zero, so the missing nonlinear or exact information decides the result.

The exact formula is x₀/√(1−2x₀²t). At x₀=.5,t=1 it is √.5≈.707107; t=2 reaches the pole. `positive_cubic` tests the denominator before evaluating the square root. At x₀=0 the state stays zero for every finite nonnegative time. This is a check on the maximal solution domain, not evidence of numerical instability.

</details>

### 4. Change the basin landscape

For x′=4x−x³, find equilibria, their stability, the basins of the attracting ones and a decreasing potential. Do close starts always end close?

For attraction to +2, shift the potential to a nonnegative local certificate and explain which component of a small sublevel contains the desired equilibrium.

<details><summary>Hint</summary>

Factor x(4−x²), then integrate its negative to obtain V.

</details>

<details><summary>Solution</summary>

The equilibria are −2,0,2. The derivative 4−3x² is −8 at ±2 and +4 at zero, so ±2 attract and zero repels. Positive starts tend to 2; negative starts tend to −2; zero stays zero. V=x⁴/4−2x² has V̇=−(4x−x³)². Two arbitrarily close starts on opposite sides of zero end in different wells, separated by 4. This is a basin-boundary effect, not proof of chaos.

Use W=V+4=(x²−4)²/4. A sufficiently small sublevel has two disconnected components near ±2. Select the positive component; there W=0 only at +2 and Ẇ=−(4x−x³)² vanishes only there. A certificate on that component cannot claim that all real initial states converge to +2.

</details>

### 5. Explain transient amplification

For q′=−q+6p, p′=−2p, compare initial states (1,0) and (0,1) at t=ln2. Why does an eigenvalue list alone hide the contrast?

An implementation uses `np.exp(t*A) @ x0`. Explain the bug and supply a from-scratch function for this triangular fixture, then identify the matching library operation.

<details><summary>Hint</summary>

Use the exact expressions q=q₀e⁻ᵗ+6p₀(e⁻ᵗ−e⁻²ᵗ), p=p₀e⁻²ᵗ.

</details>

<details><summary>Solution</summary>

The first becomes (0.5,0), norm 0.5. The second becomes (1.5,0.25), norm √2.3125≈1.52069. The off-diagonal coupling transfers p into q for the second start. Both eventually decay; their finite-time norms differ because initial directions and the nonorthogonal eigenstructure matter.

`np.exp` exponentiates entries; the required object is the matrix exponential, which includes the accumulated transfer. `transient_state` uses the analytic expressions directly, and `scipy.linalg.expm(t*A) @ x0` is the matching library operation. The changed-start fixture in the complete practice programme prints (.5,0) and (1.5,.25). The direct formula makes the transfer visible; the library handles the more general square-matrix exponential.

</details>

### 6. A cycle is not a center

For r′=r/4−r³, θ′=1, predict the future of radii 0, 0.3 and 1. If two starts have the same radius but angles differing by π/4, does their phase difference vanish?

Implement an oriented section detector for sampled (time,(q,p)) pairs. Use the sampled fixture below. Its initial point lies on the section; later samples include crossings in both directions and on both halves of the q-axis. Count only later upward p=0 crossings with q>0, interpolating linearly. Predict how many survive before opening the code.

| Time | q | p |
| --- | --- | --- |
| 0 | 1 | 0 |
| .5 | .8 | .3 |
| 1 | −1 | .2 |
| 1.5 | −1 | −.2 |
| 2 | .8 | −.3 |
| 2.5 | 1 | 0 |
| 3 | .8 | .3 |
| 3.5 | .8 | −.3 |
| 4 | .8 | .3 |
| 5 | −1 | −.1 |
| 6 | −1 | .1 |

<details><summary>Hint</summary>

The positive radial equilibrium is 0.5, and both angles advance at the same speed.

</details>

<details><summary>Solution</summary>

Radius zero stays at the unstable origin. Radius 0.3 rises toward 0.5; radius 1 decreases toward 0.5. The angle difference remains π/4, so their positions do not converge at equal times even though both approach the attracting circle. A center would preserve every starting radius instead of attracting nearby radii to one isolated cycle. The radial return multiplier is e⁻π.

`upward_positive_section` accepts p₀<0≤p₁, computes the fraction −p₀/(p₁−p₀), interpolates q and time, then requires q>0. This excludes the initial point and prevents double-counting a sample exactly on the section. The fixture returns (2.5,1) and (3.75,.8). Linear interpolation is an approximation between samples, not proof that there were no additional crossings between them; a coarse mesh can still miss events. For the analytic Hopf flow the period remains 2π and radial multiplier e⁻π.

</details>

### 7. Recover the original four regimes

From x₀=0.217, compare logistic r=2.5, 3.2, 3.5 and 3.9. Discard 1,000 updates and inspect a longer retained sequence. Add r=3.83 and several nearby initial states. Which conclusions are numerical evidence, and which can you derive?

Implement `cycle_residual(r, points)` as the largest one-step mismatch around a proposed cycle, including the final point back to the first. Compare the analytic r=3.2 pair with the pair rounded to six decimals. Explain why a small residual is useful but does not prove its minimal period or attraction.

<details><summary>Hint</summary>

For 2.5 use the fixed-point multiplier. For 3.2 use both points and the full two-step derivative. Do not identify a period from only two similar rounded values.

</details>

<details><summary>Solution</summary>

At 2.5, the nonzero fixed point is 0.6 with multiplier −0.5, a derived local attraction result. At 3.2, the exact two-cycle is about 0.513045↔0.799455 with full-cycle multiplier 0.16, also a derived local result. The displayed finite runs at 3.5 settle to four rounded values; at 3.83 they settle to three. At 3.9 the tested tail is irregular and the finite exponent is positive for the tested generic start. Compare longer windows, starts, arithmetic and repeated-cycle residuals; these finite observations alone do not prove infinite-time aperiodicity. A start exactly at an unstable fixed point is an important exception.

The closure residual is maxᵢ|F(xᵢ)−xᵢ₊₁| with indices wrapping. The preserved new fixture gives about 1.11×10⁻¹⁶ for the analytic pair evaluated in floats and 4.4952×10⁻⁷ for the rounded pair. That is arithmetic agreement with a candidate cycle, not a proof of exact equality, distinct points or stability. Those claims use the factorization and full derivative product already taught. The function assumes a nonempty finite numeric candidate in the logistic state interval.

</details>

### 8. Repair a chaos classifier

A classifier declares chaos whenever its finite exponent is positive. What does it return for r=4,x₀=0.75? What goes wrong when it replaces a zero derivative by 10⁻¹²?

Write a finite log-derivative diagnostic that returns the average, the index of an exact zero derivative if encountered, and whether the supplied reference is exactly fixed. Do not return a Boolean “chaos” label. Test the two exact r=4 states .75 and .5 for 20 terms.

<details><summary>Hint</summary>

Evaluate the map and derivative exactly at 0.75 and 0.5.

</details>

<details><summary>Solution</summary>

It misclassifies the fixed orbit 0.75, which has derivative −2 and exponent ln2 but period one. At a critical derivative zero, the actual log term is −∞. Substituting 10⁻¹² makes it a finite arbitrary negative term that can later be averaged away. That changes the quantity being estimated. Report the singular case, the orbit, window and definition rather than forcing a binary chaos label.

`log_derivative_average` returns (ln2,None,True) for .75 and (−∞,0,False) for .5. It checks the derivative before advancing the state, so the critical term cannot be lost through burn-in. Exact fixed equality is meaningful for these exactly representable fixtures; it is not a general tolerance-based orbit detector. The return fields keep mathematical facts separate rather than blending them into one unjustified classifier.

</details>

### 9. Use and qualify a forecast horizon

Assume a local growth rate 0.4 per update, initial error 10⁻⁵ and useful tolerance 0.02. Estimate the horizon, then name three reasons a real prediction may fail sooner.

<details><summary>Hint</summary>

Solve 10⁻⁵ exp(0.4n)=0.02.

</details>

<details><summary>Solution</summary>

The estimate is ln(2000)/0.4≈19.0023 updates, so this idealized error is still just below .02 at integer update 19 and first exceeds it at update 20. It assumes a representative rate and a small-error regime. Time-varying expansion, parameter/model bias, hidden forcing, measurement error in another state direction or numerical error can shorten the useful horizon. Error saturation also makes the exponential model inappropriate for large tolerances.

</details>

### 10. Work backward through the tent

Find the starting interval and repeating point for itinerary RL. Then compute the logistic-4 invariant probability of 0.25≤x≤0.75. Why do neither results imply that every starting point has the same trajectory statistics?

Repair a backward-itinerary function that treats LR as R(L(u)). Use exact fractions for LR and RL, return both interval endpoints and the inverse composition’s fixed point, and check the direction of composition explicitly.

<details><summary>Hint</summary>

Compose the inverse maps R(u)=1−u/2 and L(u)=u/2. Use the invariant CDF for the probability.

</details>

<details><summary>Solution</summary>

R(L(u))=1−u/4 maps [0,1] to [3/4,1]. Its fixed point solves y=1−y/4, giving y=4/5. It follows 4/5→2/5→4/5. The invariant probability is H(0.75)−H(0.25)=2/3−1/3=1/3. Exact periodic points can have exceptional frequencies; the stated typical time-frequency theorem holds almost everywhere under the invariant law, not at every point.

`cylinder` loops over the word in reverse while prepending each inverse operation: LR becomes L(R(u)). It returns [1/4,1/2],2/5 for LR and [3/4,1],4/5 for RL. This differs from `inverse_word` in the earlier programme, which accumulates an affine composition in forward symbolic order; both implement the same mathematical composition. The code is a complete independent implementation, not a call to the earlier helper.

</details>

### 11. Inspect the integration boundary

Apply kick-then-drift symplectic Euler to (q,p)=(1,0) with h=2 for three steps. Does a conserved modified energy guarantee bounded motion at this step?

Repair a step that computes the new momentum but still drifts using the old momentum. For the changed fixture h=.25,(q,p)=(1,0), return the new state and both energy functions.

<details><summary>Hint</summary>

The modified form becomes (q−p)²/2 and no longer bounds q and p separately.

</details>

<details><summary>Solution</summary>

The states are (−3,−2), (5,4), then (−7,−6). Their norms grow while (q−p)²/2 stays 0.5. At h=2 the form is degenerate, and a constant value permits arbitrarily large q and p together. The positive-definite condition |h|<2 was essential to the boundedness argument.

The corrected `kick_drift` uses `next_p` in the position update. The new state is (.9375,−.25), ordinary energy .470703125 and modified energy .5. `energies` reports both explicitly. These changed-step results are independent of the h=2 escape argument and do not assert exact ordinary-energy conservation.

</details>

### 12. Design an evidence plan

A learned simulator produces a butterfly-shaped phase plot and small one-step validation error. Propose a test plan before claiming it accurately models a chaotic physical system.

<details><summary>Hint</summary>

Separate the numerical method, the learned rule, the observed physical system and the particular prediction task.

</details>

<details><summary>Solution</summary>

Verify the implemented rule against independent short-time calculations and step/tolerance refinement. Inspect full states and inputs rather than only projections; check units, constraints and relevant balance laws. Evaluate held-out multi-step trajectories over declared horizons and initial/parameter uncertainty. Examine finite sensitivity and statistics with their assumptions and convergence checks, while distinguishing them from an infinite-time chaos theorem. Validate the quantities needed by the physical task against suitable measurements, including uncertainty and unobserved inputs. A pleasing shape and one-step loss alone establish none of these separate claims.

</details>

### 13. Build a trapping region

Change the radial equation to r′=r−r³, θ′=1. Can the annulus .5≤r≤1.5 trap every trajectory that starts inside it? Which hypotheses let a planar limit-set theorem establish a periodic orbit, and which claims would still need more work?

<details><summary>Hint</summary>

Compute the radial rates on each boundary and check whether a stationary state can lie inside the annulus.

</details>

<details><summary>Solution</summary>

At .5 the radial rate is .375, directed outward from the inner hole and into the annulus. At 1.5 it is −1.875, directed inward from the outer edge. The smooth autonomous field therefore gives a compact positively invariant annulus. The origin is excluded, and θ′=1 rules out another stationary state there. An omega-limit set inside this compact equilibrium-free planar region is a periodic orbit. The theorem alone does not prove uniqueness or that every trajectory in the entire plane tends to that orbit. Here the explicit radial sign calculation supplies the additional convergence to radius 1 for every positive radius.

</details>

### 14. Transfer probability through inverse branches

Under uniform tent input, find both preimages of the target interval [.2,.6] and their combined probability. Then use x=h(y) to find the invariant logistic-4 probability of x≤.5. Does a finite histogram from one specially chosen orbit have to reproduce these values?

<details><summary>Hint</summary>

Apply L and R to both interval endpoints, restore their order, and use the increasing inverse coordinate h⁻¹ for the second part.

</details>

<details><summary>Solution</summary>

The inverse intervals are [.1,.3] and [.7,.9], each of length .2 and total uniform probability .4. Since h(.5)=.5, the event x≤.5 corresponds to y≤.5 and has probability .5. These distribution calculations are exact. A finite histogram has sampling and arithmetic effects; an exceptional periodic orbit need not have the invariant law’s frequencies even in an infinite time average. Almost-everywhere ergodic behavior is a separate qualification.

</details>

### 15. Change the ordered Jacobians

Let A=[[0,3],[0,0]] and B=[[0,0],[.5,0]]. Show that each squared matrix is zero, compute BA and AB, then follow e₂ through three repeated BA cycles. Implement ordinary two-by-two multiplication and matrix–vector application without NumPy. Why does swapping the order change the relevant direction?

<details><summary>Hint</summary>

A transfers the second coordinate to the first, while B transfers the first to the second. A full cycle is the composition B after A.

</details>

<details><summary>Solution</summary>

A²=B²=0, so each has only zero eigenvalues. BA=diag(0,1.5), while AB=diag(1.5,0). Starting from e₂, repeated BA gives (0,1.5), (0,2.25), (0,3.375). AB instead kills this initial direction immediately and amplifies e₁. The complete `multiply` and `apply` functions below preserve left/right order. The changed .5 and 3 factors make this an independent task rather than a restatement of the earlier 2-by-2 witness.

</details>

### Complete implementation solutions

The functions in this file solve the implementation parts of tasks 2, 3, 5, 6, 7, 8, 10, 11 and 15. The direct algebra and evidence-plan tasks have their complete prose solutions above. The section detector assumes finite, ordered samples; the cycle and small matrix helpers assume the stated numeric shapes and ranges. These teaching helpers do not promise a general-purpose input-validation library. All code and the observed changed-fixture output are available together after you have attempted the visible prompts.

<details><summary>Show the complete practice programme and recorded output</summary>

**Complete file: [dynamics_practice.py](content-prepared/programmes/dynamics_practice.py)**

```python
from fractions import Fraction
import math


def cooling_multiplier(decay, step):
    if not all(math.isfinite(x) and x >= 0 for x in (decay, step)):
        raise ValueError('Use finite nonnegative decay and step.')
    multiplier = 1 - decay * step
    if abs(multiplier) == 1:
        behavior = 'boundary: nondecaying'
    elif abs(multiplier) > 1:
        behavior = 'growth'
    elif multiplier == 0:
        behavior = 'zero after one update'
    elif multiplier < 0:
        behavior = 'alternating decay'
    else:
        behavior = 'same-sign decay'
    return multiplier, behavior, abs(multiplier - math.exp(-decay * step))


def positive_cubic(initial, time):
    if not all(math.isfinite(x) for x in (initial, time)) or time < 0:
        raise ValueError('Use a finite initial state and nonnegative finite time.')
    denominator = 1 - 2 * initial * initial * time
    if denominator <= 0:
        raise ValueError('The requested time reaches or exceeds the pole.')
    return initial / math.sqrt(denominator)


def transient_state(initial, time):
    q, p = initial
    decay = math.exp(-time)
    return q * decay + 6 * p * decay * (1 - decay), p * decay * decay


def upward_positive_section(samples):
    crossings = []
    for (t0, (q0, p0)), (t1, (q1, p1)) in zip(samples, samples[1:]):
        if t1 <= t0:
            raise ValueError('Sample times must increase.')
        if p0 < 0 <= p1:
            fraction = -p0 / (p1 - p0)
            q = q0 + fraction * (q1 - q0)
            if q > 0:
                crossings.append((t0 + fraction * (t1 - t0), q))
    return crossings


def cycle_residual(growth, points):
    if not points:
        raise ValueError('Supply a candidate cycle.')
    return max(abs(growth * x * (1 - x) - y)
               for x, y in zip(points, points[1:] + points[:1]))


def log_derivative_average(growth, initial, count):
    if not (0 <= growth <= 4 and 0 <= initial <= 1
            and type(count) is int and 1 <= count <= 10000):
        raise ValueError('Use a bounded logistic rule and positive bounded count.')
    value, total = initial, 0.0
    reference_fixed = growth * initial * (1 - initial) == initial
    for index in range(count):
        derivative = growth * (1 - 2 * value)
        if derivative == 0:
            return -math.inf, index, reference_fixed
        total += math.log(abs(derivative))
        value = growth * value * (1 - value)
    return total / count, None, reference_fixed


def cylinder(word):
    if not 1 <= len(word) <= 10 or any(letter not in 'LR' for letter in word):
        raise ValueError('Use one to ten L/R letters.')
    slope, intercept = Fraction(1), Fraction(0)
    # Build the outer inverse last: LR means L(R(u)).
    for letter in reversed(word):
        if letter == 'L':
            slope, intercept = slope / 2, intercept / 2
        else:
            slope, intercept = -slope / 2, 1 - intercept / 2
    return tuple(sorted((intercept, intercept + slope))), intercept / (1 - slope)


def kick_drift(state, step):
    q, p = state
    next_p = p - step * q
    return q + step * next_p, next_p


def energies(state, step):
    q, p = state
    return (q * q + p * p) / 2, (q * q + p * p - step * q * p) / 2


def multiply(left, right):
    return tuple(tuple(sum(left[i][k] * right[k][j] for k in range(2))
                       for j in range(2)) for i in range(2))


def apply(matrix, vector):
    return tuple(sum(row[j] * vector[j] for j in range(2)) for row in matrix)


if __name__ == '__main__':
    for step in (0.2, 0.5, 0.8, 2 / 3):
        multiplier, behavior, error = cooling_multiplier(3, step)
        print('cooling', round(step, 6), round(multiplier, 6), behavior,
              'one-step multiplier error', round(error, 6))
    print('positive cubic at t=1', round(positive_cubic(0.5, 1), 6))
    try:
        positive_cubic(0.5, 2)
    except ValueError as error:
        print(error)
    print('transient starts', transient_state((1, 0), math.log(2)),
          transient_state((0, 1), math.log(2)))
    fixture = [(0, (1, 0)), (0.5, (0.8, 0.3)), (1, (-1, 0.2)),
               (1.5, (-1, -0.2)), (2, (0.8, -0.3)), (2.5, (1, 0)),
               (3, (0.8, 0.3)), (3.5, (0.8, -0.3)), (4, (0.8, 0.3)),
               (5, (-1, -0.1)), (6, (-1, 0.1))]
    print('section crossings', upward_positive_section(fixture))
    root = math.sqrt((3.2 - 3) * (3.2 + 1))
    exact_pair = [(4.2 - root) / 6.4, (4.2 + root) / 6.4]
    rounded_pair = [0.513045, 0.799455]
    print('cycle residuals', f'{cycle_residual(3.2, exact_pair):.3g}',
          f'{cycle_residual(3.2, rounded_pair):.9g}')
    print('fixed reference diagnostic', log_derivative_average(4, 0.75, 20))
    print('critical reference diagnostic', log_derivative_average(4, 0.5, 20))
    for word in ('LR', 'RL'):
        interval, point = cylinder(word)
        print(word, [str(value) for value in interval], str(point))
    state = kick_drift((1, 0), 0.25)
    print('kick-drift h=.25', state, 'energies', energies(state, 0.25))
    first, second = ((0, 3), (0, 0)), ((0, 0), (0.5, 0))
    product = multiply(second, first)
    print('BA', product, 'AB', multiply(first, second))
    state = (0, 1)
    for index in range(4):
        print('changed product cycle', index, state)
        state = apply(product, state)
```

**Recorded output**

```text
cooling 0.2 0.4 same-sign decay one-step multiplier error 0.148812
cooling 0.5 -0.5 alternating decay one-step multiplier error 0.72313
cooling 0.8 -1.4 growth one-step multiplier error 1.490718
cooling 0.666667 -1.0 boundary: nondecaying one-step multiplier error 1.135335
positive cubic at t=1 0.707107
The requested time reaches or exceeds the pole.
transient starts (0.5, 0.0) (1.5, 0.25)
section crossings [(2.5, 1.0), (3.75, 0.8)]
cycle residuals 1.11e-16 4.4952e-07
fixed reference diagnostic (0.6931471805599453, None, True)
critical reference diagnostic (-inf, 0, False)
LR ['1/4', '1/2'] 2/5
RL ['3/4', '1'] 4/5
kick-drift h=.25 (0.9375, -0.25) energies (0.470703125, 0.5)
BA ((0, 0), (0.0, 1.5)) AB ((1.5, 0), (0.0, 0))
changed product cycle 0 (0, 1)
changed product cycle 1 (0, 1.5)
changed product cycle 2 (0.0, 2.25)
changed product cycle 3 (0.0, 3.375)
```

</details>

**Readiness check.** You should now be able to choose a state, distinguish a flow from a numerical update, analyze a new fixed point or short cycle, read a phase portrait, explain a basin or transient, and repair an overconfident conclusion from a finite simulation. If the explanation depends on a hidden coordinate, an unqualified equality case or an unexplained plotted number, return to that mechanism before proceeding.

**Next in this module:** [Itô Calculus & Stochastic Differential Equations](/learn/path/full-curriculum/it-calculus-stochastic-differential-equations?module=math-foundations) adds explicitly stochastic forcing to continuous evolution. Review the Brownian-increment and quadratic-variation reasoning in [Stochastic Processes](/learn/path/full-curriculum/stochastic-processes-markov-chains-brownian-motion-poisson?module=math-foundations) first. [Numerical Methods](/learn/path/full-curriculum/numerical-methods-finite-differences-quadrature-root-finding?module=math-foundations) extends the integration tools, and [Ordinary Differential Equations & Linear Systems](/learn/path/full-curriculum/ordinary-differential-equations-linear-systems?module=math-foundations) provides a broader solution-method route. 

## Further learning

- Start with [Menon’s dynamical systems notes](https://www.dam.brown.edu/people/menon/publications/ds-2020-1.pdf), the local-existence and phase-portrait chapters, then the gradient-flow and return-map sections. They deepen the flow and geometry route. Later center-manifold and Hamiltonian material needs more analysis than this first lesson assumes.
- For the discrete and probabilistic continuation, [Romik’s MAT119B notes](https://www.math.ucdavis.edu/~romik/teaching-pages/mat119b/lecturenotes-119B.pdf), §§2.7–2.12, develop invariant measures and ergodicity. Keep the direction of the coordinate map explicit: our h maps the uniform tent coordinate to the logistic coordinate, while h⁻¹ is the CDF.
- [Huang’s logistic-map notes](https://personalpages.manchester.ac.uk/staff/yanghong.huang/ads/html/maps-log.html) supply the two-cycle factorization; [the planar limit-set notes](https://personalpages.manchester.ac.uk/staff/yanghong.huang/ads/html/period-exist.html) develop trapping-region arguments. Check boundary cases by substitution instead of extending strict inequalities to equality.
- [Rothman’s Hopf lectures](https://ocw.mit.edu/courses/12-006j-nonlinear-dynamics-chaos-fall-2022/mit12_006jf22_lec10-11.pdf) and [Poincaré-section lectures](https://ocw.mit.edu/courses/12-006j-nonlinear-dynamics-chaos-fall-2022/mit12_006jf22_lec15-16.pdf) extend the solved constant-angular-speed example to broader oscillation mechanisms. [The Lyapunov-exponent lecture](https://ocw.mit.edu/courses/12-006j-nonlinear-dynamics-chaos-fall-2022/mit12_006jf22_lec24.pdf) introduces tangent renormalization; varying Jacobians still require ordered products.
- [Lorenz’s original paper](https://cdanfort.w3.uvm.edu/research/lorenz-1963.pdf), especially printed pp.130–131 and 134–137, connects model reduction, full state and projected trajectories. Our starting state, solver and output are a teaching experiment, not a replication of his original computation or validation against weather data.
- [Hairer’s geometric-integration lecture](https://unige.ch/~hairer/poly_geoint/week2.pdf), pp.1–9, explains symplectic Euler and composition methods. It is the next step after the area and modified-energy drawings; structure preservation and ordinary-energy conservation remain different claims.
- [Tedrake’s Lyapunov analysis](https://underactuated.mit.edu/lyapunov.html) extends local certificates to control and invariant-set reasoning. Norm-comparison bounds and the region where inequalities hold matter. A sampled decrease curve does not establish a global certificate.
- For deeper period-doubling structure, [Feigenbaum’s original universality article](https://sites.math.rutgers.edu/~zeilberg/Bio21/MF78.pdf) motivates scaling and renormalization. Its heuristic development and numerical ratios are a further route; this lesson has not supplied a general universality proof. Homoclinic bifurcations, horseshoes, fractal dimension and inference of chaos from measured data likewise require additional tools, beyond recognizing an irregular plot.

For a spoken route, the [Strogatz/Cornell nonlinear dynamics course](https://www.youtube.com/playlist?list=PLbN57C5Zdl6j_qJA-pARJnKsmROzPnO9V) follows phase lines, oscillations, bifurcations and chaos. Its course identity was checked through the instructor-linked page; the entire playlist was not watched. Pair it with the written calculations and independent tasks here.

## Technical references and runnable files

[SciPy `expm`](https://docs.scipy.org/doc/scipy/reference/generated/scipy.linalg.expm.html) documents the square-matrix exponential used in the transient example. [SciPy `solve_ivp`](https://docs.scipy.org/doc/scipy/reference/generated/scipy.integrate.solve_ivp.html) documents method selection, requested output times, tolerances, events and termination. The inspected documentation identifies version 1.18.0; the retained original execution used SciPy 1.18.1. Refer to the documented signature and your installed version rather than assuming a copied output establishes compatibility everywhere.

All examples use specified mathematical fixtures. There is no external empirical dataset, no trained model and no claim that a simulated state is an observation. The recorded outputs use the declared mathematical fixtures and execution environments. Numerical assertions and input errors remain part of the complete runnable examples. The final practice file uses only the Python standard library; NumPy/SciPy are needed only by the indicated library examples.

| File | Role and dependencies |
| --- | --- |
| [dynamics_cooling.py](content-prepared/programmes/dynamics_cooling.py) | Exact versus Euler endpoint; Python standard library. |
| [dynamics_scalar.py](content-prepared/programmes/dynamics_scalar.py) | Exact nonlinear marginal flows and potential derivative; standard library. |
| [dynamics_transient.py](content-prepared/programmes/dynamics_transient.py) | Matrix exponential and norm transfer; NumPy and SciPy. |
| [dynamics_hopf.py](content-prepared/programmes/dynamics_hopf.py) | Exact radius and return multiplier; standard library. |
| [dynamics_cycles.py](content-prepared/programmes/dynamics_cycles.py) | Logistic tails and exact two-cycle; standard library. |
| [dynamics_original.py](content-prepared/programmes/dynamics_original.py) | Preserved 50-update nearby-pair example; standard library. |
| [dynamics_exponent.py](content-prepared/programmes/dynamics_exponent.py) | Finite tangent averages and declared growth-model horizon; standard library. |
| [dynamics_tent.py](content-prepared/programmes/dynamics_tent.py) | Exact inverse word, dyadic orbit and invariant CDF; standard library. |
| [lorenz_rk4_scratch.py](content-prepared/programmes/lorenz_rk4_scratch.py) | Complete vector RK4 and short-time refinement comparison; standard library. |
| [dynamics_lorenz.py](content-prepared/programmes/dynamics_lorenz.py) | Adaptive DOP853 comparison; NumPy and SciPy. |
| [dynamics_energy.py](content-prepared/programmes/dynamics_energy.py) | Equal-horizon endpoint energies for two methods; standard library. |
| [dynamics_products.py](content-prepared/programmes/dynamics_products.py) | Ordered Jacobian witness; NumPy. |
| [dynamics_practice.py](content-prepared/programmes/dynamics_practice.py) | Complete changed-task implementation solutions; standard library. |

Each file has full source and recorded output at its teaching point. Use its source to change a fixture yourself; the recorded output describes the stated run and its assumptions.
