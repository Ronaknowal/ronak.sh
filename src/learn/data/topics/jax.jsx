import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { MathBlock } from '../../components/content/Math.jsx';
import { LessonIntro, LessonTable, Sources } from '../../components/lesson-labs/LessonElements.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { JaxGradientLab, JaxTraceLab, JaxStateFigure } from '../../components/lesson-labs/JaxLabs.jsx';

export default {
  title: 'JAX',
  readTime: '~55 min read + 60 min programs and practice',
  content: () => <div className="neural-lesson neural-lesson-neutral functional-framework-lesson">
    <LessonIntro prerequisites="Python functions, array broadcasting and a gradient-based update. The links below supply the exact refreshers." exampleKind="Python / JAX">
      Treat a numerical program as something you can transform: differentiate it, batch it, and compile it while keeping its state explicit.
    </LessonIntro>
    <Prose opening="route">First pass: follow sections 1–6 and run the functional training program. Then use sections 7–9 to diagnose a transformed program and complete the core exercises. Section 8's directional derivatives and section 9's scaling choices are deeper branches. The two live investigations calculate small examples; they do not run a Python compiler in your browser.</Prose>
    <Prose opening="prerequisites">Review <a href="/learn/path/full-curriculum/numpy-arrays-broadcasting-vectorization?module=programming-scientific-computing">NumPy shapes and broadcasting</a>, then <a href="/learn/path/full-curriculum/backpropagation-automatic-differentiation?module=deep-learning-fundamentals">Backpropagation</a> for local derivative rules and its complete <a href="/learn-assets/backpropagation/teaching-autodiff.py">NumPy teaching engine</a>. Here we reuse that chain-rule reasoning; our new implementations own explicit parameter/state updates and the transformation boundary.</Prose>

    <H2>1. One calculation, several questions</H2>
    <Prose>A sensor returns a raw reading x. You want a calibration rule ŷ = wx + b: w changes the scale, b shifts the zero. Four constructed measurements are x = [−2, −1, 1, 2] and y = [−3, −1, 3, 5]. A person can see that 2x + 1 fits them. We deliberately start at w = b = 0 so that every computational step is inspectable. This is a mechanism fixture, not a scientific evaluation of a sensor.</Prose>
    <Prose>Now ask four different questions about the same rule. What does it output? How does its error change with w and b? What happens on an entire batch? Can repeated updates execute without Python dispatching every arithmetic operation? In JAX these become transformations of functions. You write the relationship once, then request a gradient with <code>grad</code>, a mapped batch with <code>vmap</code>, or a compiled execution with <code>jit</code>.</Prose>
    <LessonTable caption="The object each transformation produces" headers={['Starting object', 'Transformation', 'Resulting object']} rows={[
      ['Scalar-valued loss function', 'jax.grad(loss)', 'A function returning derivatives with the same parameter-tree structure'],
      ['Single-example function', 'jax.vmap(f, in_axes=...)', 'A function with explicit mapped/shared input axes'],
      ['JAX-compatible function', 'jax.jit(f)', 'A callable that specializes and compiles compatible operations'],
    ]}/>
    <Prose>JAX is an array computation system, not a complete opinion about how to organize a neural network. Optimizers, neural-network modules and checkpoint tools can come from its ecosystem. Start with the numerical contract; add a framework when managing the model's structure becomes the larger problem.</Prose>

    <H2>2. Make inputs, state and shapes visible</H2>
    <Prose>A function is easy to transform when all information that affects its result comes through its inputs and all updates leave through its outputs. Put the parameters in a dictionary: <code>{'{"w": scalar, "b": scalar}'}</code>. Such nested containers are called <em>pytrees</em>. JAX treats their container structure separately from their array leaves. A gradient of this loss returns another dictionary with keys w and b: it has a place for the sensitivity of each adjustable leaf.</Prose>
    <JaxStateFigure/>
    <Prose>The arrows are the important part of that picture. Calling an update does not magically change an earlier dictionary; assign its returned state for the next iteration. Keep optimizer velocity and a random key in the state when the computation needs them. A Python object with hidden mutation may execute that mutation during tracing, then reuse compiled work without repeating it. Explicit state gives compilation and the reader the same account of what can change.</Prose>
    <CodeBlock language="python" filename="jax_array_example.py" title="Small array example — run after importing JAX">{`import jax.numpy as jnp
x = jnp.array([-2., -1., 1., 2.])
changed = x.at[0].set(9.)
# x still begins -2; changed begins 9.
params = {"w": jnp.array(0.), "b": jnp.array(0.)}
prediction = params["w"] * x + params["b"]  # shape (4,)`}</CodeBlock>
    <Prose>Array updates have value semantics: <code>.at[].set()</code> returns the updated value. That does not promise a separate physical buffer for every expression; compiled execution can optimize storage when doing so preserves observable behavior. Shape and dtype remain part of your algorithm. A scalar bias broadcasts over four predictions, while a target of shape (4, 1) against predictions of shape (4,) would broadcast to a (4, 4) comparison—valid arithmetic for the wrong task.</Prose>

    <H2>3. Read a gradient as contributions from examples</H2>
    <Prose>Measure error with half the mean squared residual. A residual r is prediction minus target, so a positive residual asks us to lower that prediction. The half cancels the square's factor of two; the mean says that duplicating every example should leave the objective unchanged.</Prose>
    <MathBlock>{String.raw`\begin{aligned}
r_i &= wx_i+b-y_i \\
L(w,b) &= \frac{1}{2n}\sum_i r_i^2 \\
\partial_w L &= \frac1n\sum_i r_i x_i \\
\partial_b L &= \frac1n\sum_i r_i
\end{aligned}`}</MathBlock>
    <Prose>At zero parameters the residuals are [3, 1, −3, −5]. Their w-contributions are [−6, −1, −3, −10], averaging −5; their b-contributions average −1. Loss is 5.5. SGD with rate 0.1 therefore moves to w = 0.5 and b = 0.1. Re-evaluating the same four measurements gives loss 3.2175. The gradient is a local sensitivity, and the update is a separately chosen move.</Prose>
    <JaxGradientLab/>
    <Prose>Move the weight and watch individual contributions cancel or reinforce. At w = 2 and b = 1 every residual is zero. Setting the learning rate to zero keeps the update fixed even when the derivative is nonzero; it does not make the derivative vanish. The exact row table explains each bar and the next-state readout.</Prose>
    <Prose><code>jax.value_and_grad(loss)</code> calculates the scalar loss and its parameter derivative in one transformed call. It differentiates executed mathematical operations through their registered rules; it is not perturbing every parameter as finite differences do. A scalar loss lets reverse-mode differentiation combine one output sensitivity back through many parameters. The earlier autodiff lesson owns that reverse graph mechanism.</Prose>

    <H2>4. Batch a function without confusing shared and mapped axes</H2>
    <Prose>The contribution from one measurement is useful for debugging and per-example analysis. Write a function accepting one x and one y. To apply it to all four rows, <code>vmap</code> tells JAX which axes represent independent applications. The parameters are shared, while the leading axes of x and y move together.</Prose>
    <CodeBlock language="python" filename="jax_per_example.py" title="Excerpt — imports and predict are in the complete program">{`single_loss = lambda p, x, y: (predict(p, x) - y) ** 2 / 2
per_example_grad = jax.vmap(jax.grad(single_loss), in_axes=(None, 0, 0))
contributions = per_example_grad(params, x, y)
mean_gradient = jax.tree.map(lambda g: g.mean(axis=0), contributions)`}</CodeBlock>
    <Prose><code>None</code> means “use this whole parameter tree for each example,” not “ignore the parameters.” The two zeros select the first axis of each data array. Each scalar derivative becomes a length-four leaf. Their means recover section 3's [−5, −1] batch gradient because differentiation and this finite mean are linear. That is the same result by two explicit routes.</Prose>
    <Prose>Vectorization changes how operations process a mapped axis; it does not automatically distribute across four devices or promise fourfold speed. Materializing every per-example parameter gradient can be large: n examples times p parameters. If all you need is a mean gradient, differentiate the mean loss directly. If you need per-example clipping or diagnostics, consider bounded batches. The representation should follow the question.</Prose>

    <H2>5. Compile the calculation, not your hidden Python history</H2>
    <Prose>Imagine handing an executor a recipe for arrays of a known layout. It can combine operations and choose kernels before the actual numbers arrive. During tracing, JAX runs your Python function with tracer objects that represent values and carry facts such as shape and dtype. The resulting intermediate program captures array operations; Python side effects are not ordinary operations in that program.</Prose>
    <Prose>A value-dependent Python branch such as <code>if x.sum() &gt; 0</code> asks Python for a concrete answer while it is building the recipe. A traced array does not supply that answer. Express elementwise selection with <code>jnp.where</code>, or scalar runtime branching with <code>jax.lax.cond</code>. Both branch outputs need compatible shape/dtype structure. Treat a genuinely configuration-like argument as static when it has only a small useful set of possibilities.</Prose>
    <JaxTraceLab/>
    <Prose>The lab is an explicit cache-key teaching model, not a timing benchmark or a dump of JAX internals. With one stable function identity and fixed device configuration, array shape, dtype and marked-static settings distinguish the signatures shown. Changing only the four numerical values reuses a matching signature. Real specialization also involves pytrees and other compilation options. Recreating a jitted lambda inside each iteration can lose useful reuse.</Prose>
    <Prose>Dynamic output size is a related hurdle. <code>x[x &gt; 1]</code> has a length that depends on x's values. For an ordinary jitted function that is a problem. If your actual goal is a sum, keep the shape fixed with <code>jnp.where(x &gt; 1, x, 0).sum()</code>. On [0, 1, 2, 3] the result is 5. Padding plus a mask is another option when you need selected records, but the mask must also enter subsequent reductions.</Prose>
    <Prose>Keep a long recurrence inside <code>lax.scan</code> when its state has fixed structure, shapes and dtypes. Each step returns a new carry and an optional recorded output. That preserves the recurrence without asking Python to unroll a large body into the compiled program. A fixed-length training example below uses it; variable stopping conditions need an appropriate control-flow primitive and an explicit differentiation contract.</Prose>

    <H2>6. Build the complete functional update, then use Optax</H2>
    <Prose>Momentum remembers previous gradients. In this program the velocity convention is v′ = μv + g and the parameter update is p′ = p − ηv′, with zero initial velocity. Other formulas absorb η into velocity or use Nesterov lookahead; matching the name “momentum” is insufficient for a parity check. The program writes this update over tree leaves, then compares forty steps with Optax's SGD under the same convention.</Prose>
    <Prose>Download the complete program. In a fresh Python environment, install <code>jax==0.11.2 optax==0.2.8 numpy==2.3.5</code> and run <code>python jax_functional_training.py</code>. These are the checked CPU versions, not a recommendation to upgrade an existing project blindly. GPU installation is platform-specific; use JAX's current installation guide.</Prose>
    <RemoteCodeBlock source="/learn-code/jax/jax_functional_training.py" filename="jax_functional_training.py" title="Complete scratch momentum, JAX differentiation and Optax comparison"/>
    <Prose>Follow <code>carry</code>: parameters and optimizer state enter a compiled step together, and both leave together. <code>value_and_grad</code> reads the pre-update parameters; every leaf is then updated from that same gradient state. <code>scan</code> returns the final carry plus the sequence of pre-update losses. Recompute the final loss after the loop when reporting the final model, rather than relabeling the last pre-update loss.</Prose>
    <Prose>The scratch update costs O(p) work and O(p) velocity storage for p parameter entries, in addition to the model's forward/backward work. The per-example gradient comparison is deliberately tiny. No dense parameter Jacobian is needed to train. A larger model can keep the same tree-shaped update while replacing the affine forward function with neural layers; Flax or Equinox can manage that structure. This lesson does not rebuild XLA or claim that the small update competes with every fused/distributed optimizer implementation.</Prose>

    <H2>7. Randomness is another input to the experiment</H2>
    <Prose>A random operation must still be reproducible and composable when execution is transformed. In the explicit-key interface, a key identifies a pseudorandom stream. The same key and sampling call produce the same result. To request distinct draws, split the key, keep one continuation key and consume another for the draw. Splitting is deterministic, so a recorded root key and the same sequence of operations can be replayed.</Prose>
    <CodeBlock language="python" filename="jax_random_keys.py" title="Explicit key flow — complete small example">{`import jax
key = jax.random.key(7)
key, dropout_key = jax.random.split(key)
mask = jax.random.bernoulli(dropout_key, p=0.8, shape=(4,))
key, next_dropout_key = jax.random.split(key)
next_mask = jax.random.bernoulli(next_dropout_key, p=0.8, shape=(4,))`}</CodeBlock>
    <Prose>Think of the split as two labeled branches, not advancing a hidden global counter. Never deliberately reuse a consumed key for independent stochastic effects. Different samples can coincidentally match; uniqueness of observed values is not the criterion. For a reproducibility test, compare identical operations with identical keys. Batched sampling from one key is also not guaranteed to equal many scalar samples from split keys. The exact random program is part of the experiment.</Prose>
    <Prose>Modern JAX also has evolving reference/stateful facilities; the explicit functional-key route taught here remains easy to inspect across transformations. The dedicated <a href="/learn/path/full-curriculum/jax-prng-keys-pytrees-reproducible-state">JAX keys, pytrees and reproducible state</a> topic is the place for deeper state partitioning and checkpoint policies. We do not treat an API survey as a requirement to mix state models in this first workflow.</Prose>

    <H2>8. Deeper: derivatives can be products, not giant matrices</H2>
    <Prose>A researcher often wants the effect of one perturbation, not every Jacobian entry. A Jacobian-vector product (JVP) pushes an input direction forward. A vector-Jacobian product (VJP) pulls an output weighting backward. For f(z) = z³ at z = 2, the derivative is 12. A direction of 0.5 therefore gives a first-order output change of 6 per unit step along that direction; it is not the finite change f(2.5) − f(2).</Prose>
    <Prose>The next program checks both products, the shape-preserving mask, and actual tracing behavior. The earlier Backpropagation lesson derives the chain rule and reverse accumulation; here the contribution is learning to request the needed product without constructing an unnecessarily large Jacobian. <code>jacfwd</code>, <code>jacrev</code>, Hessian-vector products and custom JVP/VJP rules extend this idea when the research question needs them. Custom rules require their own mathematical and numerical validation.</Prose>
    <RemoteCodeBlock source="/learn-code/jax/jax_transform_diagnostics.py" filename="jax_transform_diagnostics.py" title="Runnable tracing, directional-derivative and timing probes"/>

    <H2>9. Debug and measure the computation you actually ran</H2>
    <Prose>The diagnostic program deliberately appends to a Python list to count traces. That instrumentation runs while tracing, so it is a good probe of compilation and a bad implementation of training state. Use <code>jax.debug.print</code> for runtime values inside transformed code. First reproduce an error without <code>jit</code>, check shapes and finite values, then re-enable transformations one at a time. Enable x64 deliberately when a numerical problem needs it; requesting float64 while x64 is disabled can yield a warning and a lower-precision array.</Prose>
    <Prose>Device work may be asynchronous. Timing the return of a dispatch can miss the work you meant to measure. Warm the exact signature, call <code>block_until_ready()</code>, and time repeated synchronized completions. Report cold compilation separately; also state whether transfers and input construction were included. The diagnostic prints raw timings from your machine and makes no cross-framework speed ranking.</Prose>
    <LessonTable caption="Choose the next tool from the actual bottleneck" headers={['Observation', 'Investigate', 'Useful next action']} rows={[
      ['Repeated compile pauses', 'Shape/static-argument/function-identity changes', 'Stabilize shapes, cache function definitions, inspect compilation logs'],
      ['Large memory for per-example gradients', 'n × p materialization', 'Differentiate the reduced loss or process bounded chunks'],
      ['Host waits around every operation', 'Python/device transfers and synchronization', 'Compile a coherent step and measure transfer boundaries'],
      ['One device is insufficient', 'Array layout and collective cost', 'Learn sharding and multi-device execution; vmap alone is not placement'],
    ]}/>

    <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">
      <H2>10. Practice: modify the computation and defend its meaning</H2>
      <div className="lesson-exercise"><H3>A. Changed calibration</H3><Prose>Set x = [−1, 1], y = [0, 4], w = 1, b = 0. Calculate the mean half-squared loss and one SGD update with rate 0.2. Verify using both manual_gradient and value_and_grad.</Prose><details><summary>Hint</summary><p>Residuals are prediction minus target. The bias derivative is their mean.</p></details><details><summary>Solution</summary><p>Predictions [−1, 1] give residuals [−1, −3], loss 2.5, w-gradient (1 − 3)/2 = −1 and b-gradient −2. The new state is w = 1.2, b = 0.4. Its predictions are [−0.8, 1.6], loss 1.6. Match this before extending the model.</p></details></div>
      <div className="lesson-exercise"><H3>B. A plausible batching error</H3><Prose>A colleague maps axis zero of the parameter tree as well as the data. Explain what question that would ask if each parameter leaf had length four. What should the mapping be for one shared model?</Prose><details><summary>Hint</summary><p>Does each measurement see the same w and b?</p></details><details><summary>Solution</summary><p>Mapping all three arguments pairs measurement i with model i: it evaluates four different parameter sets. Shared-model per-example gradients use (None, 0, 0). Mapping parameter axis zero is useful for an ensemble only when that is the intended question and the data mapping is designed accordingly.</p></details></div>
      <div className="lesson-exercise"><H3>C. Repair a dynamic selection</H3><Prose>Implement the mean of positive entries for a jitted fixed-shape array, returning zero when no entries are positive. Do not count padded zeros in the denominator.</Prose><details><summary>Hint</summary><p>Keep a boolean mask, masked sum and count. Make the denominator safe before division.</p></details><details><summary>Solution</summary><CodeBlock language="python" filename="positive_mean.py">{`def positive_mean(x):
    keep = x > 0
    total = jnp.where(keep, x, 0).sum()
    count = keep.sum()
    return total / jnp.maximum(count, 1)`}</CodeBlock><p>For [−2, 2, 4], the answer is 3; for [−2, 0], it is 0 by the stated convention. Replacing count by the full array length changes the meaning.</p></details></div>
      <div className="lesson-exercise"><H3>D. Extend the state without hiding it</H3><Prose>Add a step counter and learning-rate decay to the complete program. Then interrupt after step 20 and compare the next update after restoring parameters, velocity and counter with an uninterrupted run.</Prose><details><summary>Hint</summary><p>The decay schedule reads the counter; both scratch and library routes must use the same rate at the same update.</p></details><details><summary>Solution and acceptance criteria</summary><p>Return counter + 1 with the new parameters and velocity. Save the whole carry and use the restored counter, rather than starting the schedule from zero. Require identical inputs and allclose agreement for every leaf of the next state. If randomness is added, save the continuation key and data-position state too. A parameters-only restart is a distinct experiment.</p></details></div>
    </section>
    <Sources alternatives={<ul><li><a href="https://docs.jax.dev/en/latest/notebooks/thinking_in_jax.html">JAX authors — How to think in JAX</a> · worked notebook; revisit after section 4 for array/transformation examples. The notebook text and code were reviewed; no video-viewing claim is made.</li><li><a href="https://docs.jax.dev/en/latest/autodidax.html">JAX authors — Autodidax</a> · advanced implementation tutorial; build a small transformation system after mastering this lesson and the earlier autodiff engine. It is a deeper route, not a prerequisite.</li></ul>}>
      <li><a href="https://docs.jax.dev/en/latest/pytrees.html">Pytrees</a> and <a href="https://docs.jax.dev/en/latest/stateful-computations.html">stateful computations</a> — tree structure and explicit state threading.</li>
      <li><a href="https://docs.jax.dev/en/latest/automatic-vectorization.html">Automatic vectorization</a> and <a href="https://docs.jax.dev/en/latest/jit-compilation.html">JIT compilation</a> — mapped axes, tracing and static arguments.</li>
      <li><a href="https://docs.jax.dev/en/latest/random-numbers.html">Pseudorandom numbers</a> — key reuse, splitting and lack of sequential equivalence.</li>
      <li><a href="https://optax.readthedocs.io/en/latest/api/optimizers.html#optax.sgd">Optax SGD</a> — momentum/Nesterov convention for the checked comparison.</li>
      <li><a href="https://docs.jax.dev/en/latest/benchmarking.html">Benchmarking JAX</a> and <a href="https://docs.jax.dev/en/latest/installation.html">installation</a> — synchronization, timing boundaries and platform-specific setup. API sources checked 28 September 2026.</li>
    </Sources>
    <section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H2>Ready to continue</H2><Prose>You are ready when you can expose a function's state, match a manual gradient/update, choose mapped axes, repair a traced shape/control-flow error and explain an honest timing boundary. Next, <a href="/learn/path/full-curriculum/tensorflow-keras?module=core-frameworks">TensorFlow &amp; Keras</a> provides the same training computation through tracked variables, a tape and progressively higher-level model interfaces.</Prose></section>
  </div>,
};
