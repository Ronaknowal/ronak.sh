import { Prose, H2, H3, CodeBlock } from "../../components/content";
import {
  LessonIntro,
  LessonTable,
  Sources,
} from "../../components/lesson-labs/LessonElements.jsx";
import RemoteCodeBlock from "../../components/content/RemoteCodeBlock.jsx";
import {
  TensorContractFigure,
  TensorBroadcastLab,
  TensorBoundaryLab,
} from "../../components/lesson-labs/TensorBoundaryLabs.jsx";

export default {
  title: "Tensor Shapes, Autograd Graphs & Device Boundaries",
  readTime: "~45 min read + diagnostic programs and practice",
  content: () => (
    <div className="neural-lesson neural-lesson-neutral tensor-boundary-lesson">
      <LessonIntro
        prerequisites="NumPy broadcasting, matrix multiplication, a scalar loss and the chain rule. The PyTorch and Backpropagation lessons supply the tensor API and complete autodiff engine."
        exampleKind="NumPy + PyTorch"
      >
        Follow a batch from named axes to a scalar loss and back to its
        parameters. Then separate three questions often confused in debugging:
        are values numerically equal, do they share storage, and can gradients
        cross the operation? The two live investigations expose silent
        broadcasting and deliberate graph boundaries. Complete programs compare
        manual gradients with PyTorch and audit the memory/dtype/device
        contracts.
      </LessonIntro>
      <Prose>
        Your code runs, the loss is finite, and the optimizer takes steps. Yet
        each prediction is being compared with every target in the batch instead
        of its own target. The array operation is legal; the experiment is
        wrong. In another program the forward values look identical after a
        small refactor, but a parameter stops receiving gradients. These bugs
        live in contracts that numbers alone do not reveal.
      </Prose>
      <Prose>
        A tensor carries values plus a shape, element type, device and memory
        layout. During differentiation it may also connect to operations that
        created it. We will inspect those contracts separately, then combine
        them in a small complete training loop. The aim is to explain why a
        particular loss updates particular parameters, and to preserve that
        meaning when code is reshaped, copied or moved.
      </Prose>

      <H2>1. Name the axes before changing the shape</H2>
      <Prose>
        Suppose each row describes one sensor observation with F measured
        features, and the model returns O calibrated outputs. A batch contains B
        observations. Write X[B,F], W[F,O], b[O] and target Y[B,O]. The product
        XW sums over features, giving one vector of O outputs for each
        observation. Adding b reuses the same output bias for every row.
      </Prose>
      <TensorContractFigure />
      <Prose>
        A shape is a count of positions on each axis; an axis meaning is your
        modeling decision. Two arrays of shape [32,32] can represent
        observation×feature or query×key. Their shapes match while their
        meanings differ. Keep names next to equations and assert the intended
        shape at boundaries such as a model output and its target. Library
        dimension compatibility is a useful check, but it cannot infer your
        experimental pairing.
      </Prose>
      <LessonTable
        caption="Choose the operation by its semantic effect"
        headers={["Operation", "What changes", "Question to ask"]}
        rows={[
          [
            "unsqueeze / squeeze(dim)",
            "Insert/remove a length-one axis",
            "Am I expressing an output axis or accidentally removing the batch axis when B=1?",
          ],
          [
            "transpose / permute",
            "Reorder existing axes",
            "Where did the feature, sequence and batch axes go?",
          ],
          [
            "reshape",
            "Regroup elements into a compatible shape, with a view or copy as needed",
            "Does regrouping preserve which values belong together?",
          ],
          [
            "stack",
            "Create a new axis from equal-shaped tensors",
            "What does the new index identify?",
          ],
          [
            "concatenate",
            "Join along an existing axis",
            "Are the other axes compatible and still semantically aligned?",
          ],
        ]}
      />
      <Prose>
        A permutation and a reshape solve different problems. Converting
        [batch,time,feature] to [time,batch,feature] requires an axis
        permutation; merely requesting the latter shape reinterprets the element
        sequence and can mix observations. After a permutation, storage may be
        noncontiguous. <code>reshape</code> may make a copy, while{" "}
        <code>view</code> requires a compatible layout. The earlier{" "}
        <a href="/learn/topic/pytorch">PyTorch storage lab</a> shows strides and
        transposed aliases; here we use that distinction to protect the learning
        computation.
      </Prose>

      <H2>2. Broadcasting can silently change the question</H2>
      <Prose>
        Broadcasting aligns dimensions from the right. Equal lengths align; a
        length-one dimension can be reused across the other length; missing
        leading dimensions behave like length one. This is exactly what makes
        bias [O] work with predictions [B,O]. It also makes predictions [B,1]
        subtract legally from targets [B], producing a [B,B] result: every
        prediction is compared with every target.
      </Prose>
      <TensorBroadcastLab />
      <Prose>
        With predictions [1,3] and paired targets [2,4], the correct residual
        column is [−1,−1]. Half the mean squared residual is 0.5. If targets
        lose their output axis, the residual matrix becomes [[−1,−3],[1,−1]],
        giving loss 1.5. Each row now measures one prediction against both
        targets. The optimizer is solving a different objective, even though
        both losses are scalar and differentiable.
      </Prose>
      <Prose>
        The gradients reveal the consequence. For the correct pairing, the
        derivative with respect to each prediction is [−0.5,−0.5]. For the
        cross-comparison it is [−1,0]: prediction 3 is already at the mean of
        targets 2 and 4, so that incorrect objective gives it no local push.
        Changing the second target in the lab affects only the second paired
        gradient, but affects both cross-comparison gradients. That is an
        observable test of which observation depends on which target.
      </Prose>
      <Prose>
        A batch of one hides this bug because [1,1] and [1] broadcast to the
        intended one comparison. Test a batch of one to catch accidental axis
        removal, and a batch with distinct targets to catch accidental
        cross-pairing. Use <code>target[:, None]</code> when the target contract
        is a vector that needs one output axis; use a strict shape check when
        the caller should already supply [B,O]. Do not reshape blindly to
        silence a warning.
      </Prose>

      <H2>3. Reduce the loss deliberately, then reverse each operation</H2>
      <Prose>
        Let R = XW+b−Y, and use L = ½ mean(R²) over all B×O entries. The
        incoming derivative at every residual is its own value divided by B×O.
        Name that matrix G = R/(B×O). Once that scaling is explicit, the
        remaining gradients follow the operations that produced R.
      </Prose>
      <LessonTable
        caption="The pullback keeps each parameter’s original shape"
        headers={["Quantity", "Gradient", "Why that axis operation appears"]}
        rows={[
          [
            "X [B,F]",
            "G @ W.T → [B,F]",
            "Each feature contributes to each output through its weight.",
          ],
          [
            "W [F,O]",
            "X.T @ G → [F,O]",
            "The same weight contributed across all batch rows; sum their contributions.",
          ],
          [
            "b [O]",
            "G.sum(axis=0) → [O]",
            "Broadcasting reused one bias across B rows; reverse it by adding the B uses.",
          ],
        ]}
      />
      <Prose>
        Bias broadcasting is like using the same dial in several calculations.
        Turning that dial affects all of them, so its derivative is the sum of
        those effects. You do not average a second time when undoing
        broadcasting: the mean-loss factor is already inside G. The complete
        autodiff engine in{" "}
        <a href="/learn/topic/backpropagation-automatic-differentiation">
          Backpropagation &amp; Automatic Differentiation
        </a>{" "}
        implements this generally through{" "}
        <a href="/learn-assets/backpropagation/teaching-autodiff.py">
          reduce_to_shape
        </a>
        , which sums added axes and expanded singleton dimensions. We reuse that
        mechanism conceptually instead of creating another competing engine.
      </Prose>
      <Prose>
        Changing a reduction changes the objective scale. A sum loss scales with
        how many entries contributed; a mean over all outputs averages across
        B×O. A masked sequence loss might divide by the number of valid tokens
        rather than padded length or number of sequences. First declare the
        observation unit, mask and denominator; then derive its gradient. When
        weights, missing values or variable lengths enter, a convenient{" "}
        <code>mean()</code> may stop matching the scientific question.
      </Prose>
      <RemoteCodeBlock
        source="/learn-code/tensor-shapes-autograd-graphs-device-boundaries/tensor_shape_gradients.py"
        filename="tensor_shape_gradients.py"
        title="Explicit affine pullbacks, broadcasting counterexample and matched training loop"
      />
      <Prose>
        <code>affine_gradients</code> owns the local derivative formulas and
        shape validation; NumPy owns efficient matrix and elementwise
        operations. It computes forward residuals once and uses matrix products
        plus one reduction, avoiding loops over examples or an explicit giant
        Jacobian. For B rows, F features and O outputs, the matrix work is
        O(BFO); the derivative arrays have the same shapes as X, W and b. The
        program compares every manual gradient with PyTorch on a two-output
        fixture.
      </Prose>
      <Prose>
        The ordinary route uses <code>nn.Linear</code> and SGD. Its weight is
        stored as [O,F], so the program transposes our W when copying the
        initial state and comparing gradients. Both routes then use identical
        initial values, learning rate and loss reduction for 30 steps. The
        reported loss is for a controlled training fixture, not a held-out
        accuracy result. The earlier PyTorch Wine workflow supplies the
        real-data split/evaluation pattern; this fixture makes a tensor-contract
        failure individually traceable.
      </Prose>
      <CodeBlock language="bash" filename="run_tensor_contracts.sh">
        {[
          "python -m pip install numpy torch",
          "python tensor_shape_gradients.py",
          "python tensor_boundary_audit.py",
        ].join("\n")}
      </CodeBlock>

      <H2>
        4. A computation graph records dependencies, not storage ownership
      </H2>
      <Prose>
        Now isolate a scalar path: product = w×x; output = product+b; L =
        ½(output−target)². At w=2, x=3, b=1, target=0, output is 7 and loss is
        24.5. The residual 7 flows backward through addition; the bias receives
        7, and multiplication sends 7×3=21 to w. A clone preserves that
        dependency even though it copies the product's storage.
      </Prose>
      <TensorBoundaryLab />
      <Prose>
        <code>detach()</code> changes a different relation: later operations
        treat the routed product as a constant for differentiation back to its
        origin. The forward value is still 6, output still 7, and loss still
        24.5, but there is no recorded route from this loss back to w. The
        separate bias route still receives 7. A stopped route and an active
        route can coexist in the same loss.
      </Prose>
      <Prose>
        This can be intentional. In a teacher/student calculation, a target
        produced by the teacher may need to stay fixed while the student learns.
        In a diagnostic plot, you may want a snapshot without retaining every
        operation that created it. It can also be a mistake: rebuilding a tensor
        from a Python list of intermediate values loses the original operations;
        using <code>torch.stack</code> on tensors preserves their differentiable
        construction. Choose the boundary explicitly.
      </Prose>
      <LessonTable
        caption="Two independent questions: memory and derivative connectivity"
        headers={[
          "Operation on a tracked tensor",
          "Shares its storage?",
          "Gradient route to its origin?",
        ]}
        rows={[
          ["Use the original tensor", "Yes", "Yes"],
          ["clone()", "No", "Yes"],
          ["detach()", "Yes", "No through the detached result"],
          ["detach().clone()", "No", "No through the copied result"],
        ]}
      />
      <Prose>
        Detaching does not create an isolated snapshot. Mutating a detached
        alias can change the original storage. If that value was saved for
        backward, PyTorch can detect the version change and reject the gradient
        computation. The audit program demonstrates this on a separate tiny
        case. For a stored independent snapshot, a detached clone separates both
        the dependency and the storage; for a differentiable copy, use clone
        alone.
      </Prose>
      <Prose>
        The lab's storage labels describe the product and its routed scalar
        without mutating them. They are independent of the forward-value
        display: two distinct buffers can hold the same number, and two views
        can share a buffer with different shapes/offsets. Comparing a pointer is
        sufficient for the exact same-offset examples in the program; arbitrary
        views require considering shared storage and offsets, not assuming
        unequal starting pointers prove independence.
      </Prose>

      <H2>5. Explain a missing gradient before changing flags</H2>
      <Prose>
        A leaf is a tensor that begins a tracked path rather than the result of
        a tracked operation. Parameters are normally leaves; outputs and
        intermediate activations are normally non-leaves. PyTorch usually
        accumulates <code>.grad</code> on leaves that require gradients. A
        non-leaf can participate in a perfectly valid derivative computation
        while its <code>.grad</code> field remains empty unless you request
        retention.
      </Prose>
      <LessonTable
        caption="Different observations demand different diagnoses"
        headers={["Observation", "Possible meaning", "Discriminating check"]}
        rows={[
          [
            "Parameter gradient is None",
            "No route used it, gradient buffers were cleared, or tracking was disabled",
            "Use a fresh forward; inspect requires_grad/grad_fn and request autograd.grad with allow_unused when auditing.",
          ],
          [
            "Gradient is numerically zero",
            "A recorded path has zero derivative or contributing paths cancel",
            "Change the input/target, inspect local derivatives, and compare a hand calculation.",
          ],
          [
            "Non-leaf .grad is None",
            "Intermediate gradients were not retained in that field",
            "Use autograd.grad for the derivative, or retain_grad before backward if the stored field is needed.",
          ],
          [
            "Gradient doubles across steps",
            "Backward accumulated into an uncleared buffer",
            "Clear deliberately or account for intentional accumulation.",
          ],
        ]}
      />
      <Prose>
        At output=target in our scalar lab, the connected path has a zero
        gradient because the residual is zero. In detach mode, the weight route
        is absent even at that same output. The display keeps “None” and zero
        distinct. Calling <code>requires_grad_()</code> on a detached tensor
        creates a new differentiation starting point; it does not reconstruct
        the discarded connection to the original parameter.
      </Prose>
      <Prose>
        A scalar loss can start backward with derivative 1. For a vector output,
        supply a vector of incoming weights to request a vector–Jacobian
        product, or deliberately reduce to a scalar. A retained graph lets you
        traverse saved operations again; creating a derivative graph enables
        differentiating the derivative. Those are separate options. The earlier{" "}
        <a href="/learn-code/pytorch/pytorch_state_and_gradients.py">
          PyTorch gradient program
        </a>{" "}
        supplies VJP and Hessian-vector examples. Reuse those when exploring
        higher-order derivatives instead of casually enabling retention on every
        training iteration.
      </Prose>
      <Prose>
        <code>model.eval()</code> changes modules with training-dependent
        behavior, such as dropout. It does not turn off differentiation.{" "}
        <code>no_grad()</code> prevents recording ordinary operations inside its
        region and is appropriate for standard parameter updates or untracked
        evaluation. Inference mode is a stronger optimization with additional
        tensor-use restrictions. Decide whether the result will later enter a
        differentiated computation before choosing that stronger mode.
      </Prose>

      <H2>
        6. Moving values can preserve a graph; changing type can remove it
      </H2>
      <Prose>
        A tensor's device says where its storage is accessible, while dtype says
        how its elements are represented. Operations usually need compatible
        operands on the same device; constants created accidentally on CPU can
        break a CUDA computation. Create matching temporaries with operations
        such as <code>x.new_zeros(...)</code> or{" "}
        <code>torch.zeros_like(x)</code>, and move model state and batches
        deliberately. Registered buffers move with a module; an arbitrary Python
        attribute containing a tensor does not acquire that contract
        automatically.
      </Prose>
      <Prose>
        <code>x.to(...)</code> returns the converted tensor. When the requested
        device and dtype already match and a copy was not requested, it may
        return x itself. Assign or use its result instead of expecting a tensor
        conversion to mutate x in place. A floating-point conversion is
        differentiable: converting a tracked float32 value to float64, squaring
        it, and taking a sum can send gradients back to the original float32
        leaf. The converted value is then a non-leaf, while the original remains
        the starting parameter.
      </Prose>
      <Prose>
        An integer conversion makes a different contract. Integers represent
        discrete indices or counts, and PyTorch does not attach ordinary
        floating-point gradients to an integer result. Rounding a differentiable
        intermediate into an index discards that differentiable path; merely
        requesting gradients later cannot restore it. This distinction matters
        in quantization, hard routing and discrete decisions, where a
        surrogate-gradient or estimation method must be chosen explicitly rather
        than assumed.
      </Prose>
      <RemoteCodeBlock
        source="/learn-code/tensor-shapes-autograd-graphs-device-boundaries/tensor_boundary_audit.py"
        filename="tensor_boundary_audit.py"
        title="Execute the graph, storage, leaf and conversion distinctions"
      />
      <Prose>
        The audit checks the four routing cases, isolated alias mutation, a
        floating conversion, an integer conversion, a newly created detached
        leaf and a saved-value mutation error. On a CUDA-capable installation it
        also checks a CPU leaf copied to CUDA and a gradient returned to that
        CPU leaf. The retained evidence for this lesson uses PyTorch 2.14 on
        CPU; that optional device-copy branch is identified as unexecuted here.
        The previous GPU lesson owns transfer timing and stream synchronization.
      </Prose>
      <Prose>
        NumPy interoperability is another boundary. A suitable CPU tensor and a
        NumPy array can share storage; a conversion to a Python scalar or NumPy
        operation is not a replacement for a tracked PyTorch operation. For
        logging, <code>loss.item()</code> intentionally extracts a value; use
        the original loss for backward. For a plot, make the intended detached
        CPU snapshot. Avoid retaining whole loss tensors in a long-lived history
        when a scalar summary is all that is needed.
      </Prose>

      <H2>7. Debug a small contract before a large model</H2>
      <Prose>
        Start with a batch whose values differ enough to reveal crossed axes.
        Write the expected shapes and reduction denominator. Inspect one forward
        result by hand, then compare a manual derivative or central finite
        difference with the library derivative. Only after the tiny case agrees
        should you add a complex module, an accelerator or compilation. This
        makes the first failing boundary informative.
      </Prose>
      <Prose>
        The supplied shape program is already a repaired loop: strict target
        shape, scalar declared loss, explicit initial-state mapping, fresh
        zeroed gradients and an optimizer update. To extend it, test B=1 and
        B&gt;1, multiple outputs, a noncontiguous input accepted by the library,
        changed values and a mismatched target that must reject. Use float64 for
        small finite-difference checks; a step too small can drown in rounding,
        while a step too large measures curvature instead of a local derivative.
      </Prose>
      <Prose>
        Two particularly revealing questions are “which other values should
        change when I edit this target?” and “which parameters should this loss
        be able to update?” The broadcast lab answers the first. The
        graph-boundary lab answers the second. They turn a mysterious training
        curve into a specific dependency you can test.
      </Prose>

      <section
        className="lesson-ending lesson-ending--practice"
        data-lesson-ending="practice"
      >
        <H2>8. Practice: preserve meaning across a boundary</H2>
        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>1. A valid shape, the wrong pairs</H3>
          <Prose>
            Predictions [0,4] are shaped [2,1]; targets [1,3] are shaped [2].
            Compute correct paired and accidental cross-comparison losses and
            gradients with half mean squared error.
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              The correct residuals are −1 and 1. The cross matrix has two
              columns, one per target.
            </Prose>
          </details>
          <details>
            <summary>Solution</summary>
            <Prose>
              Paired loss is 0.5 with gradients [−0.5,0.5]. Cross residuals
              [[−1,−3],[3,1]] give loss 2.5 and gradients [−1,1]. Averaging four
              comparisons instead of two changes the dependency and result.
            </Prose>
          </details>
        </div>
        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>2. Reverse a reused bias</H3>
          <Prose>
            A bias [2] is broadcast over three rows. The incoming derivative
            after all loss scaling is [[1,2],[3,4],[5,6]]. What is the bias
            derivative? What would an extra mean incorrectly produce?
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              One bias element contributed to every row of its output column.
            </Prose>
          </details>
          <details>
            <summary>Solution</summary>
            <Prose>
              Sum rows to get [9,12]. An extra mean gives [3,4], reducing the
              derivative by three even though the incoming matrix already
              contains the loss reduction's scaling.
            </Prose>
          </details>
        </div>
        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>3. Choose the intended boundary</H3>
          <Prose>
            You need (a) a differentiable copy that can be stored separately and
            (b) an independent logging snapshot. Which operations fit, and why
            is detach alone insufficient for (b)?
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>Answer storage and derivative questions separately.</Prose>
          </details>
          <details>
            <summary>Solution</summary>
            <Prose>
              (a) clone preserves the graph and copies storage. (b)
              detach().clone() removes the route and copies storage; move the
              result to CPU too if the consumer needs CPU data. detach alone
              still aliases the original storage. The logging snapshot is
              deliberately outside the training graph.
            </Prose>
          </details>
        </div>
        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>4. Change the output dimension</H3>
          <Prose>
            Extend the shape program to three outputs with distinct targets.
            Verify all manual/library gradients, B=1, a wrong target shape, and
            at least one finite-difference weight derivative. Explain the
            denominator and the nn.Linear weight orientation.
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              G uses B×3 for a mean over every output entry. Perturb exactly one
              W entry by ±h while keeping the others fixed.
            </Prose>
          </details>
          <details>
            <summary>Acceptance criteria</summary>
            <Prose>
              The output is [B,3], W is [F,3], bias is [3], and library weight
              is [3,F]. The finite difference agrees within a stated tolerance;
              invalid targets reject instead of broadcasting. Matched initial
              values and updates keep manual and library trajectories aligned.
            </Prose>
          </details>
        </div>
      </section>
      <section
        className="lesson-ending lesson-ending--next"
        data-lesson-ending="next"
      >
        <H2>9. Carry the contract across time</H2>
        <Prose>
          You can now inspect shape meaning, derive the local pullbacks,
          distinguish graph connectivity from memory aliasing, and audit
          dtype/device changes. Next,{" "}
          <a href="/learn/path/full-curriculum/dataset-loaders-checkpoints-exact-resume-contracts?module=core-frameworks">
            Dataset Loaders, Checkpoints &amp; Exact Resume Contracts
          </a>{" "}
          asks how to preserve the computation across batches and restarts:
          which data were next, which state changed, and whether a resumed
          update is the same update.
        </Prose>
      </section>
      <Sources
        alternatives={
          <ul>
            <li>
              <a href="https://docs.pytorch.org/tutorials/beginner/introyt/tensors_deeper_tutorial.html">
                PyTorch: introduction to tensors
              </a>{" "}
              — official detailed tutorial on shape operations, copying, devices
              and interoperability; read its clone/detach examples alongside
              section 4.
            </li>
            <li>
              <a href="https://docs.pytorch.org/tutorials/beginner/understanding_leaf_vs_nonleaf_tutorial.html">
                PyTorch: leaf and non-leaf tensors
              </a>{" "}
              — worked graph examples explaining requires_grad, retained
              gradients and missing fields after section 5.
            </li>
            <li>
              <a href="https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html">
                PyTorch: automatic differentiation
              </a>{" "}
              — a shorter second route through graph construction and gradient
              control, useful before the full boundary audit.
            </li>
          </ul>
        }
      >
        <li>
          <a href="https://docs.pytorch.org/docs/stable/notes/broadcasting.html">
            Broadcasting semantics
          </a>{" "}
          and{" "}
          <a href="https://docs.pytorch.org/docs/stable/tensor_view.html">
            Tensor views
          </a>{" "}
          — axis compatibility and when an operation aliases or copies.
        </li>
        <li>
          <a href="https://docs.pytorch.org/docs/stable/notes/autograd.html">
            Autograd mechanics
          </a>{" "}
          — recording, gradient modes, saved values and in-place correctness
          checks.
        </li>
        <li>
          <a href="https://docs.pytorch.org/docs/stable/generated/torch.Tensor.detach.html">
            detach
          </a>
          ,{" "}
          <a href="https://docs.pytorch.org/docs/stable/generated/torch.clone.html">
            clone
          </a>{" "}
          and{" "}
          <a href="https://docs.pytorch.org/docs/stable/generated/torch.Tensor.to.html">
            to
          </a>{" "}
          — the distinct memory, derivative and conversion contracts.
        </li>
        <li>
          <a href="https://docs.pytorch.org/docs/stable/generated/torch.autograd.grad.html">
            autograd.grad
          </a>{" "}
          — incoming derivative weights, unused inputs and derivative graph
          options. Official current documentation inspected 28 September 2026;
          native evidence records its tested runtime.
        </li>
      </Sources>
    </div>
  ),
};
