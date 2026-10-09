export const odeProgrammeExplanations = {
  "thermal_balance.py": {
    "before": [
      "The complete thermal program uses the standard library’s exp and log. capacity and conductance encode the object in the drawing; multiplying conductance/capacity by 60 converts a per-second loss into a per-minute rate. first_rate is the derivative at the initial state. after_one_minute applies the exact exponential, while initial+first_rate applies one minute of the initial tangent. These are two different calculations with the same units.",
      "The second case changes power to 20 W. equilibrium=power/conductance is 10 K, and the final expression propagates only the initial displacement from that equilibrium. All work and storage here are constant for one requested time. The formula assumes constant capacity, conductance, room temperature and power on the interval."
    ],
    "after": [
      "The observed tangent estimate is 32.000000 K and the exact state is 32.749230 K. Their difference comes from the decreasing loss rate. log(2)/rate_per_minute gives the half-time 3.465736 minutes; its dimension is time. The heater case returns 21.036383 K at five minutes, above its 10 K equilibrium.",
      "Change initial to 24 and conductance to 3 with the same capacity. The initial rate becomes −7.2 K/min and the rate constant 0.3/min. Explain which output changes and which time ratio stays independent of the initial value before comparing the changed-system file."
    ]
  },
  "solution_domains.py": {
    "before": [
      "waiting_solution builds the piecewise history from elapsed=max(0,time−departure), then squares elapsed. Its derivative is twice elapsed, including zero at departure. The assertion checks the rate along that candidate. The loop compares three departure times at the same four physical times, keeping initial data identical.",
      "growing_solution is the separate x′=x² branch for a positive initial value. Its denominator is 1−initial×time. The domain guard rejects a denominator at or below zero because the branch through time zero ends there. Each sample takes constant work; the two small finite lists store only the requested observations."
    ],
    "after": [
      "The waiting outputs show different histories from the same initial zero: departure 1 has values 0,0,1,4 at times 0,1,2,3. The growing samples are 1,2,10. The attempted time 1.1 is explicitly rejected, preserving the domain instead of evaluating a disconnected formula branch.",
      "Change the positive initial value to 2: the denominator vanishes at time 0.5. Separately change departure to 2: that candidate remains zero until 2. These changes alter lifetime and history selection respectively; they do not express the same failure mechanism."
    ]
  },
  "integrating_factor.py": {
    "before": [
      "The scalar file evaluates the derived y=(1+t)²/4+3/[4(1+t)²] and its analytical derivative. shifted names the same 1+t that appears in the integrating factor. solution checks t>−1 before evaluating the denominator. The residual adds y′+2y/(1+t)−(1+t), using the original equation rather than another copy of the explicit formula.",
      "The initial assertion checks y(0)=1, and four observations pair values with their equation residuals. This is constant work per observation. To solve a changed coefficient analytically, derive the new integrating factor first; editing only the coefficient in the residual leaves the candidate formula unchanged."
    ],
    "after": [
      "At t=1 the program reports 1.187500, exactly 19/16 from the worked calculation. The sampled residuals round to zero at the displayed precision. The full interval and derivation supply the solution claim; these samples make its implementation correspondence concrete.",
      "For y′+y=2t,y(0)=3, a particular solution is 2t−2 and the homogeneous correction is 5e⁻ᵗ. The changed practice derives that result and checks what forcing a sum or difference carries."
    ]
  },
  "spring_motion_scipy.py": {
    "before": [
      "motion converts the physical parameters into the first-order matrix [[0,1],[−stiffness/mass,−damping/mass]]. scipy.linalg.expm(time×matrix) maps the complete initial column to position and velocity. The function then computes mechanical energy and −damping×velocity², the energy derivative for this unforced case.",
      "The parameter check requires positive mass and stiffness and nonnegative damping. The four calls compare zero, under-, critical and overdamping with the same initial (1,0) and time 1. For these fixed two-by-two matrices each call has bounded work and storage; a large dense system requires a different resource assessment. The final assertion independently checks the repeated-root formula 3e⁻²."
    ],
    "after": [
      "The returned columns are q, v, E and E′, so a negative velocity is motion direction rather than negative energy. Zero damping makes E′ zero. At critical damping, q agrees with (1+2t)e⁻²ᵗ at t=1. Greater damping changes both exponential rates, not merely the amplitude of the underdamped sinusoid.",
      "Change the initial velocity to −1 and keep m=1,c=2,k=4: the sine coefficient vanishes and q=e⁻ᵗcos(√3t). The changed-system file evaluates that branch, while the independent energy identity still supplies E′=−2v² for these parameters."
    ]
  },
  "matrix_flows_scipy.py": {
    "before": [
      "The first matrix has a repeated rate −1 with an upper coupling 3. expm returns its full transition without assuming a diagonal eigenbasis. transition[:,0] and transition[:,1] are the evolved coordinate columns; multiplying by initial=(0,1) selects the second. The independent formula (3/e,1/e) checks the coupling-created time factor at time 1.",
      "The semigroup assertion compares two intervals, 0.4 and 0.6, with the full unit interval for this constant matrix. The transfer case uses the conserved two-compartment generator and prints both amounts and their total. Dense matrix exponentiation has roughly cubic matrix work at this scale and quadratic storage, with algorithm details depending on the matrix; forming a full exponential is unnecessary when a large sparse problem only needs its action on one vector."
    ],
    "after": [
      "The shear state at t=1 is [1.103638,0.367879], matching the displayed second column. For transfer, the two amounts change while every printed total remains 9. Reading rows as coordinate-column solutions would swap the intended interpretation.",
      "Set the transfer rates to a=2,b=1 and start from (0,12). Conservation fixes equilibrium (4,8), and the decaying imbalance has rate 3. The independent task derives x₁=4(1−e⁻³ᵗ), letting you check the matrix output through a scalar route."
    ]
  },
  "timed_heating.py": {
    "before": [
      "heated_interval implements the exact constant-power transition. exp(−rate×duration) propagates the initial response; −expm1(−rate×duration) computes 1−exp(−rate×duration) accurately for short durations. equilibrium=power/conductance turns power into a temperature target. schedule passes each ending state directly into the next interval.",
      "The early and late schedules each supply 20 W for three minutes over the same six-minute horizon. The assertion separates the initial response from the early input response. With m intervals, schedule takes O(m) work and constant state storage. Known power switches are explicit interval boundaries, rather than hidden inside a smooth-step approximation."
    ],
    "after": [
      "Both schedules supply 3600 J, but their final states differ because heat arriving earlier has longer to escape. The printed initial contribution belongs to both schedules; the separately aged input contribution determines the difference. Adding raw heater energies without their decay factors would miss the mechanism.",
      "For the final task, change the initial excess to 24 K and the power to 30 W for two minutes. Its equilibrium is 15 K. Passing the switch state forward yields (15+9e⁻⁰·⁴)e⁻⁰·⁸ at the end, and delaying that same two-minute input produces a warmer ending state."
    ]
  },
  "held_input_scipy.py": {
    "before": [
      "held_input_matrices builds the augmented generator [[A,B],[0,0]]. Its size is state dimension plus input dimension. The exponential’s upper-left block is the state transition, and its upper-right block is the integrated held-input response. Extracting these blocks avoids requiring an inverse of the possibly singular A.",
      "For the double integrator and duration 3, the function returns [[1,3],[0,1]] and [4.5,3]ᵀ. Multiplying the first by initial (1,−1) and the second by held input 2 gives the final state. The shape/duration check catches common caller mistakes. Forming a dense augmented exponential requires quadratic storage in the augmented size and roughly cubic matrix work; large sparse inputs often call for action or structured methods."
    ],
    "after": [
      "The final [position,velocity] is [7,5]. The output for C=[1,0],D=0.5 is 7+0.5×2=8. The D term is immediate output feedthrough, added once; it is not another contribution to the internal state.",
      "Change duration to 0.5 and initial to zero. The input column is [0.125,0.5]ᵀ, so input 2 gives [0.25,1]. These coefficients also follow by integrating constant acceleration, an independent route that verifies the block semantics."
    ]
  },
  "ordered_shears_scipy.py": {
    "before": [
      "upper and lower are nilpotent generators. expm(upper)=I+upper is the horizontal unit shear, and expm(lower)=I+lower is the vertical one. upper_then_lower multiplies the later transition on the left. The initial column in this file is (1,0); the live drawing uses (1,1) to make both first-stage effects visible.",
      "tempting_shortcut instead exponentiates the summed generator. The two assertions compare full final vectors from this declared fixture. These are fixed two-by-two calculations; more chronological intervals require one transition action per interval, or a variable-coefficient integration route. The matrix sum stores total coefficients but loses their order."
    ],
    "after": [
      "From (1,0), upper then lower returns [1,1], while lower then upper returns [2,1]. exp(upper+lower) returns approximately [1.543081,1.175201], matching neither. The explicit intermediate states explain the difference, rather than treating noncommutation as a label alone.",
      "Change the start to (0,1). Upper then lower traces (1,1) to (1,2); lower then upper traces (0,1) to (1,1). Alternatively use scalar multiples of the same generator: those commute, so the integrated exponential shortcut has a stated sufficient basis."
    ]
  },
  "fixed_steps_scratch.py": {
    "before": [
      "step names the slope probes for Euler, midpoint and RK4 and returns one accepted candidate. integrate stores accepted time/state pairs, limits the last width to end−time and reports explicit failure reasons. It never moves the horizon to suit the requested width. The finite-input check guards widths and horizons a learner could accidentally enter.",
      "The comparison uses cooling from 40 K to time 5 with widths 0.7 and 0.35. The exact reference is evaluated at the attained time, and status tells you whether that is the requested horizon. For n steps, derivative-call work is n,2n or 4n for these three methods, and retaining the history costs O(n) storage. A streaming final-state-only variant could use constant storage."
    ],
    "after": [
      "Each ordinary run ends at 5.0, including its shortened last step. Printed errors decrease much faster for midpoint and RK4 at these widths. The limited run ends at 0.3 with a budget-exhausted status; that attained state is deliberately separated from the uncomputed horizon 2.",
      "Change the rate to −4y and inspect the Euler amplification factor 1−4h. Widths 0.4,0.5 and 0.6 give −0.6,−1 and −1.4. Sign, decay and accuracy have different thresholds. The analytical error and stability arguments above specify which comparison each output supports."
    ]
  },
  "stiff_modes_scipy.py": {
    "before": [
      "run defines the stated stiff equation and asks solve_ivp to return values at 301 times over [0,3]. Subtracting cos t shows that the exact correction is (initial−1)e⁻⁸⁰ᵗ; including it prevents a real initial transient from being counted as solver error. The loop compares RK45 and Radau at both initial 1 and initial 2 with fixed rtol and atol.",
      "A failed result raises its reported message before error comparison. nfev counts derivative calls; Radau also performs linear-system and Jacobian work. Both returning arrays have the same 301 requested locations, not the same internal accepted mesh. Cost depends on tolerances, stiffness and method; equal derivative counts alone would not mean equal total work."
    ],
    "after": [
      "At initial 1, the recorded RK45 run uses 1766 derivative calls and Radau 280. At initial 2 the counts are 1874 and 747. Each status is 0 and each last time is 3.0. The sampled maximum errors compare the chosen returned grid with the correct exact branch; these settings provide a concrete controlled comparison.",
      "t_eval requests output locations; it is not a list of the solver’s accepted internal steps. The new cooling contract file returns its actual natural mesh with t_eval absent, then separately queries its dense interpolant. Changing λ or tolerances changes the method’s work and error tradeoff, so report the settings with any new comparison."
    ]
  },
  "solver_events_scipy.py": {
    "before": [
      "threshold returns state−10, marks the event terminal and requests downward crossings. The cooling run therefore stops at the first detected qualifying root rather than the horizon 20. The independent logarithmic time checks that event. The returned success flag, status, message and time describe different parts of the result.",
      "The second construction holds the state constant and puts two roots inside the artificial event function. first_step=max_step=1 permits one step with positive event values at both ends. A separate max_step=0.1 run exposes sign-change brackets. Events add evaluations and bracket refinement to an adaptive solve; root detection depends on the declared event structure and step locations."
    ],
    "after": [
      "The observed terminal time is 6.93147181, with status 1 and success true. The one-step artificial case detects no roots; the smaller-step case detects [0.25,0.75]. Reducing max_step exposes these roots; it is not a universal event-detection proof. A tangential root can remain invisible to a sign-change test.",
      "Change the thermal threshold to 20 K: the analytical time becomes ln2/0.2. Keep the event direction meaningful. If a known switch occurs, split the integration at that time and pass its state forward rather than expecting event machinery to repair an undisclosed discontinuity."
    ]
  },
  "ordinary_series.py": {
    "before": [
      "coefficients stores exact Fraction values, seeds a₀ and a₁ and propagates aₙ₊₂=aₙ₋₁/[(n+2)(n+1)], using zero for the missing negative index. The two initial choices construct independent branches. evaluate converts those exact coefficients into a finite floating-point polynomial at a requested time.",
      "The DOP853 solve independently integrates the full two-coordinate system (y,y′) with tight tolerances. The program compares each degree-15 polynomial at time 1 with that numerical reference. Building and storing d coefficients costs O(d) work and space; Horner evaluation or sparse residue-class chains can reduce evaluation overhead for larger degrees. The theorem about the infinite series and the truncation comparison have different roles."
    ],
    "after": [
      "The first branch begins 1+t³/6+t⁶/180, and the second begins t+t⁴/12+t⁷/504. Their degree-15 values at 1 are 1.1722999700 and 1.0853396475. The independently integrated differences are about 9.176×10⁻¹² and 5.907×10⁻¹⁰. A small differential residual alone is not a general error bound; controlling its propagation is an additional requirement.",
      "Change the initial coefficients to (1,1). Linearity combines the two branches with the same coefficients. Moving to an equation whose leading coefficient vanishes at the expansion point needs singular-point analysis rather than division that erases the domain issue."
    ]
  },
  "changed_systems.py": {
    "before": [
      "This complete file gathers the changed tasks after their separate derivations: cooling at rate 0.3; spring initial (1,−1); transfer rates 2 and 1; stable couplings 4 and 8; resonant forcing amplitude 3; and a switched heater schedule. Each reference uses the changed parameters, not the original fixture’s answer.",
      "Matrix exponentials independently check the spring and compartments, while DOP853 checks the resonant second-order state. The last schedule is exact constant-input algebra, passing its switch state forward. These are bounded examples with standard-library, NumPy and SciPy routes; larger data or many states require explicit work and storage choices."
    ],
    "after": [
      "The changed resonance gives q(2)≈−1.135204, agreeing with (3/4)×2 sin4. Coupling 4 under decay −2 never increases this starting norm, while coupling 8 gives √17/e≈1.516806 at time 0.5. The category ‘nonnormal’ did not determine the individual trajectory by itself.",
      "For heating, the same 3600 J arrives at different times. Read the switch and final states as one chronology. To extend the exercise, alter only one parameter at a time, derive a reference or invariant, and explain the changed result with the mechanism that generated it."
    ]
  },
  "adaptive_pair_scratch.py": {
    "before": [
      "pair evaluates the left slope, makes an Euler predictor, evaluates its endpoint slope and averages the two rates into a Heun corrector. error is their difference, and scale uses the old state and candidate. ratio≤1 selects acceptance. This is an educational order-1/order-2 embedded pair; SciPy RK45 uses a different higher-order pair and its own controller.",
      "integrate keeps separate accepted and attempted histories. A rejected row is recorded but does not change time or state. The next width uses 0.9/√ratio because this pair’s difference scales like h². Clipping that factor between 0.2 and 5 limits abrupt changes; rejection cannot enlarge the retry. Zero estimated error permits a bounded increase. The last width is shortened to the horizon, and budget or arithmetic failure returns an explicit status. With A attempts, work and retained history are O(A); a final-state-only loop could avoid storing both histories. The attempt budget is a built-in integer at least one, excluding booleans; fractional, nonfinite, zero and negative counts raise ValueError before iteration."
    ],
    "after": [
      "The first trial at h=0.4 rejects with ratio 29.090909. The next at h=0.08 still rejects with ratio 1.163636. Both rows start at time zero and state 1. The third at h≈0.066745786 passes with ratio 0.81. The observed full run has 17 attempts, 15 accepted steps and 2 rejections; it reaches time 1 with state 0.136353636. Its exact reference is e⁻²≈0.135335283, so the final error is about 0.001018353.",
      "A one-attempt budget ends at the original time zero and state 1, because its only trial rejected. The changed −3y case prints predictor 1.4, corrector 1.49 and ratio 15/7, also requiring rejection. The tolerance test is local estimated error, while the separately printed analytical difference measures this run’s actual final error."
    ]
  },
  "solver_contracts_scipy.py": {
    "before": [
      "The cooling call deliberately omits requested output times and enables dense_output. cooling.t therefore records its accepted mesh, while cooling.sol(queries) evaluates the saved interpolants at 25 separately chosen uniform times. Compare accepted mesh states and interpolated queries with 12e⁻⁰·³ᵗ using their own time arrays. The record writes settings, versions, arrays, work and termination to solver_contracts_record.json in the working directory.",
      "The second solve attempts x′=x²,x₀=1 up to time 2. The analytical solution ends at time 1, so the programme handles and records the unsuccessful result instead of treating its final sample as the requested answer. Producing the record is a successful diagnostic programme even when that solve has success=false. Adaptive work depends on the equation and requested tolerances; saved mesh storage follows the actual accepted-step count, and dense interpolants add per-interval storage."
    ],
    "after": [
      "With NumPy 2.3.5 and SciPy 1.18.1, cooling uses eight accepted intervals and 50 derivative calls. Its largest observed mesh error is 8.319967826×10⁻⁹, while its largest error at the 25 dense queries is 2.751404260×10⁻⁸. The queries can have a different error from the mesh; neither maximum bounds all unsampled times.",
      "The blow-up attempt records status −1, success=false and ‘Required step size is less than spacing between numbers.’ Its attained time is 1.000000000834 after 3002 derivative calls. That slight numerical displacement beyond the exact boundary does not extend the classical solution. Reproduce the settings and inspect the saved record when comparing another installed version; a solver failure’s message must be interpreted together with the equation and its interval."
    ]
  }
};
