// Generated from the frozen manuscript by render-moe-training-lesson.mjs.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock as SharedMathBlock } from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import {
  MoeTrainingTable as NeuralTable,
  MoeTrainingAnatomy,
  MoeTrainingRouting,
  MoeTrainingSwiGLU,
  MoeTrainingBackward,
  MoeTrainingCapacity,
  MoeTrainingRandomLoad,
  MoeTrainingBalance,
  MoeTrainingGradient,
  MoeTrainingZLoss,
  MoeTrainingScope,
  MoeTrainingReplicas,
  MoeTrainingBias,
  MoeTrainingCausality,
  MoeTrainingGranularity,
  MoeTrainingSavedModel,
  MoeTrainingNativeMap,
  MoeTrainingResults,
  MoeTrainingHistory,
  MoeTrainingDevices,
  MoeTrainingBlocks,
  MoeTrainingCosts,
} from '../../components/lesson-labs/MoeTrainingFlow.jsx';
import '../../components/lesson-labs/lesson-flow.css';

const MathBlock = ({ children }) => (
  <div className="moet-equation" role="region" tabIndex={0} aria-label="Mathematical expression">
    <SharedMathBlock>{children}</SharedMathBlock>
  </div>
);

const Program = ({ file }) => (
  <RemoteCodeBlock source={'/learn-code/moe-training/' + file}
    language="python" title={file} filename={file} />
);

const Old = ({ ids }) => ids.map(id => <span key={id} id={id} aria-hidden="true" />);

function MoeTrainingLesson() {
  return <div className="lesson-flow moe-training-flow">
    <section>
    <Prose opening="summary">{
      "Follow one causal prediction through selected expert networks, its training gradients and " +
      "the queues that execute it. Then train a complete small language model and judge usefulness " +
      "and load separately."
    }</Prose>
    
    <Prose opening="route">{
      "First pass: sections 1–8, then 10–11 and the diagnosis/practice ending. Sections 9 and 12 " +
      "deepen architecture and execution. The examples run on a CPU. The diagrams use blue E0, " +
      "amber E1, violet E2 and rose E3 consistently; written IDs and selection outlines make the " +
      "correspondence independent of colour."
    }</Prose>
    
    <Prose opening="prerequisites">{"Prerequisites: "}<a href={
      "/learn/path/full-curriculum/causal-language-modeling-next-token-prediction?module=large-language-models#2-let-the-text-provide-its-targets"
    }>{"next-token targets and log loss"}</a>{", "}<a href={
      "/learn/path/full-curriculum/mixture-of-experts-transformers-moe?module=deep-learning-fundamentals#1-an-expert-is-a-network-not-a-named-profession"
    }>{"the sparse FFN architecture"}</a>{" and matrix-product gradients. We refresh the local computations below. The "}<a href={
      "/learn/path/full-curriculum/fp8-training-low-precision-pre-training?module=large-language-models#7-train-with-three-products-not-one"
    }>{"FP8 lesson"}</a>{" explains why forward, backward and parameter updates can use different precision."}</Prose>
    
    <Old ids={["1-start-with-the-problem","1-why-it-exists"]} />
    <H2>{"1. Spend work on selected transformations"}</H2>
    
    <Prose>{
      "At the prefix “Alice was”, a causal decoder must predict what follows. Attention has already " +
      "assembled a contextual row of numbers for the current position. A feed-forward network then " +
      "transforms that row. Attention exchanges information between permitted positions; this " +
      "feed-forward operation acts separately on each row with the same learned maps."
    }</Prose>
    
    <MoeTrainingAnatomy />
    
    <Prose>{
      "Read the drawing from the saved residual row. One path keeps that row. The other normalizes " +
      "it and sends it into a learned map that expands width d to width m, an activation, then a " +
      "second map that returns to d. The paths add coordinate by coordinate. The residual provides " +
      "a route through the block even if the new transformation is small."
    }</Prose>
    
    <Prose>{"A "}<strong>{"mixture of experts"}</strong>{
      ", or MoE, replaces that single FFN with a bank of separately learned FFNs. A router selects " +
      "a few for the current row. An expert is one set of parameter matrices, not a complete " +
      "language model and not a profession assigned by the programmer. Its output is another hidden " +
      "row; a later output head turns hidden rows into next-token probabilities."
    }</Prose>
    
    <Prose>{
      "Let E count the stored routed experts and k count the distinct experts selected for a row. E " +
      "= 4 and k = 2 stores four transforms but requests only two. Those extra stored maps need " +
      "memory and training opportunities. Their presence does not establish useful knowledge, " +
      "better loss or lower elapsed time. Router work, small matrix multiplications and " +
      "communication also consume resources. We will count those separately and measure a real " +
      "prediction task."
    }</Prose>
    
    <Old ids={["2-build-the-intuition","2-core-intuition"]} />
    <H2>{"2. Select IDs, then weight actual returns"}</H2>
    
    <Prose>{
      "The bank needs two decisions: which expert IDs should run, and how much of each returned row " +
      "should be added. Start with three router scores and two requested experts. A "
    }<strong>{"logit"}</strong>{" is an unrestricted score, not a probability."}</Prose>
    
    <MoeTrainingRouting />
    
    <Prose>{
      "For a contextual row x of width d, the router stores E rows of weights in W. Expert i " +
      "receives logit z_i = W_i x in column-vector notation. The programs hold input examples as " +
      "rows, so a batch X computes "
    }<code>{"X @ W.T"}</code>{". The shape changes from T × d to T × E; T is the number of routed rows in the stated group."}</Prose>
    
    <Prose>{
      "Our hand example has z = log[4, 2, 1]. Exponentiating and dividing by their sum 7 gives p = " +
      "[4/7, 2/7, 1/7]. The two largest probabilities select IDs [0, 1]. Softmax subtracts the row " +
      "maximum before exponentiation in code; the common factor cancels, preserving probabilities " +
      "while avoiding unnecessary overflow."
    }</Prose>
    
    <Prose>{"There are two useful weighting conventions. "}<strong>{"Selected normalization"}</strong>{" divides the selected scores by their own total: [4/7, 2/7] / (6/7) = [2/3, 1/3]. "}<strong>{"Retained full-softmax weights"}</strong>{
      " keep [4/7, 2/7]. The first set sums to one; the second preserves only 6/7 of the full " +
      "probability mass."
    }</Prose>
    
    <Prose>{
      "The selected experts return F0(x) = [2, 0] and F1(x) = [0, 3]. These are chosen arithmetic " +
      "values, not trained outputs. The selected-normalized update is (2/3)[2, 0] + (1/3)[0, 3] = " +
      "[4/3, 1]. Retaining full-softmax weights instead gives [8/7, 6/7]. Add either update to the " +
      "same saved residual x afterward."
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{
      "p_i=\\frac{e^{z_i}}{\\sum_j e^{z_j}},\\qquad\n" +
      "S=\\operatorname{topk}(p),\\qquad\n" +
      "g_i=\\frac{p_i}{\\sum_{j\\in S}p_j}\\ (i\\in S),\\qquad\n" +
      "Y=\\sum_{i\\in S}g_iF_i(x)."
    }</MathBlock>
    </div>
    
    <Prose>{
      "S contains IDs, g contains applied scalar weights and Y is the new expert contribution. " +
      "Change a logit slightly without crossing another selected score: the same experts run with " +
      "different weights. Cross the selection boundary and a different map can enter. With k = E " +
      "the two conventions agree. With k = 1, selected normalization makes the one surviving gate " +
      "exactly one. That special case will matter in backward propagation."
    }</Prose>
    
    <H3>{"What happens inside a modern expert?"}</H3>
    
    <Prose>{"The introductory two-map/ReLU picture explains expansion and contraction. The complete programs use "}<strong>{"SwiGLU"}</strong>{
      ", a gated FFN with three maps. Keep the same input/output widths while splitting the " +
      "expansion into two branches."
    }</Prose>
    
    <MoeTrainingSwiGLU />
    
    <Prose>{
      "The gate map G and value map U each produce m coordinates. SiLU transforms a gate coordinate " +
      "a into a × sigmoid(a); elementwise multiplication combines that with the corresponding U " +
      "coordinate. The down map D returns the product to d."
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{
      "a=Gx,\\quad b=Ux,\\quad h=\\operatorname{SiLU}(a)\\odot b,\n" +
      "\\quad F(x)=Dh,\\qquad \\operatorname{SiLU}(a)=a\\,\\sigma(a)."
    }</MathBlock>
    </div>
    
    <Prose>{
      "Here σ(a) = 1/(1 + exp(−a)); its output lies between zero and one. With x = [1, 2] and " +
      "identity maps, a = b = x and the returned coordinates are approximately [0.731059, " +
      "3.523188]. Each coordinate is a × sigmoid(a) × a. The diagonal maps make the multiplication " +
      "visible; learned maps generally mix coordinates. This elementwise gate inside an expert is " +
      "different from the router gate that weights an entire expert return."
    }</Prose>
    
    <Old ids={["3-make-the-idea-precise","3-mathematical-foundation"]} />
    <H2>{"3. Follow task credit through the executed graph"}</H2>
    
    <Prose>{
      "Selection picks discrete IDs, but a training loss also depends continuously on the selected " +
      "weights and expert matrices. Backward propagation follows those continuous paths while " +
      "holding the current selected set fixed."
    }</Prose>
    
    <MoeTrainingBackward />
    
    <Prose>{
      "Suppose r = ∂L/∂Y is the loss derivative arriving at the expert sum. It has the same width " +
      "as a returned row. The derivative reaching expert i's return is g_i r. The derivative " +
      "reaching its gate is rᵀF_i(x): a dot product measuring how that return changes the loss in " +
      "the direction r. A positive derivative means increasing the corresponding value would " +
      "increase the loss locally; gradient descent moves in the opposite direction."
    }</Prose>
    
    <Prose>{
      "For selected-softmax gates, differentiating the shared denominator gives ∂g_i/∂z_j = g_i(1(i " +
      "= j) − g_j) for selected j. Therefore"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{
      "\\frac{\\partial L}{\\partial z_j}\n" +
      "=\\sum_{i\\in S}r^TF_i\\,g_i(\\mathbf1_{i=j}-g_j)\n" +
      "=g_jr^T\\left(F_j-Y\\right),\\qquad j\\in S."
    }</MathBlock>
    </div>
    
    <Prose>{
      "The last step replaces Σ_i g_iF_i by Y. The formula compares an individual return with the " +
      "current mixture, rather than rewarding an expert merely for being selected. Unselected " +
      "logits have zero local task derivative for this selected-normalized convention, because " +
      "their full-softmax denominator cancels out when the selected scores are renormalized."
    }</Prose>
    
    <Prose>{
      "Use r = [1, 1] in our example. The returned values along this direction are 2 and 3, while " +
      "rᵀY = 7/3. The two selected logit derivatives are (2/3)(2 − 7/3) = −2/9 and (1/3)(3 − 7/3) = " +
      "2/9. Reducing this diagnostic loss therefore increases E0's logit relative to E1's. These " +
      "are derivatives of the chosen local direction, not an assertion that E0 is universally " +
      "better."
    }</Prose>
    
    <Prose>{"For retained full-softmax gates the same differentiation includes every logit:"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"\\frac{\\partial L}{\\partial z_j}\n=p_j\\left[\\mathbf1_{j\\in S}r^TF_j-r^TY\\right]."}</MathBlock>
    </div>
    
    <Prose>{
      "An unselected expert does not run, yet its logit can receive a derivative through the " +
      "denominator. This is why retained full-softmax top-1 can receive task routing credit while " +
      "selected-normalized top-1 cannot. For normalized top-1, Y = F_j and F_j − Y = 0. Equal " +
      "selected returns give the same zero router task derivative even with larger k. Expert " +
      "matrices can still receive nonzero derivatives."
    }</Prose>
    
    <Prose>{
      "A router parameter gradient collects the row derivatives: dW = dZᵀX. The input receives dZ W " +
      "from the router plus the paths through executed experts and the separate residual. For a " +
      "linear map H = X Aᵀ, dA = dHᵀX and dX = dH A. Those same two matrix products recur for G, U " +
      "and D. Inside SwiGLU, SiLU′(a) = σ(a)[1 + a(1 − σ(a))]; each multiplication sends its " +
      "derivative through the other operand."
    }</Prose>
    
    <Prose>{
      "At a top-k boundary the selected identity can jump. A finite difference crossing that jump " +
      "is not a check of the fixed-set derivative above. The programs use strict selection margins " +
      "for gradient comparisons and show boundary behavior separately. A zero task gradient also " +
      "does not promise an unchanged parameter: momentum, weight decay or another objective can " +
      "still update it."
    }</Prose>
    
    <Old ids={["4-from-scratch-implementation"]} />
    <H2>{"4. Give every request a slot and a return address"}</H2>
    
    <Prose>{"The single-row calculus now becomes a batch of work. Each selected pair creates an assignment "}<code>{"(token ID, selected slot, expert ID)"}</code>{
      ". The token and slot form the return address. Grouping assignments by expert allows its " +
      "matrix to process several rows together; the results must be scattered back by those " +
      "addresses."
    }</Prose>
    
    <MoeTrainingCapacity />
    
    <Prose>{
      "Take four rows with routes [0,1], [0,1], [0,2], [0,2]. Requested expert loads are [4,2,2], " +
      "totaling eight assignments. A capacity C = 2 gives each expert two slots. The declared " +
      "priority is original token order and then slot order. E0 keeps t0 and t1, rejecting its " +
      "requests from t2 and t3. E1 and E2 keep both of their requests. Two assignments are " +
      "rejected; no token loses both branches."
    }</Prose>
    
    <Prose>{
      "If expert returns are the scalars [1,2,3] and both gates are 1/2, dropless expert updates " +
      "are [1.5,1.5,2,2]. With the cap they become [1.5,1.5,1.5,1.5]. A rejected branch contributes " +
      "zero. "
    }<strong>{"Keep the original requested gate denominator; do not renormalize the surviving branches."}</strong>{
      " The residual is added afterward. C = 0 removes all expert contributions while preserving " +
      "that residual; C = 4 makes this fixture's capped and dropless results identical. Moving a " +
      "token earlier changes who gets a slot, so allocation priority is part of the model contract."
    }</Prose>
    
    <Prose>{
      "Let a_ti be one for an accepted requested branch and zero for a rejected branch. Then Y_t = " +
      "Σ_i a_ti g_ti F_i(x_t). Holding requested IDs and acceptance fixed, the selected-softmax " +
      "logit derivative becomes"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"\\frac{\\partial L}{\\partial z_{tj}}\n=g_{tj}\\left[a_{tj}r_t^TF_j-r_t^TY_t\\right]."}</MathBlock>
    </div>
    
    <Prose>{
      "The denominator still contains rejected selected branches. Reject E0 in the earlier " +
      "[2/3,1/3] example and keep E1. Y becomes [0,1]; with r = [1,1], the two router derivatives " +
      "are [−2/3,+2/3]. E0's expert parameter derivative is zero, but its router logit still " +
      "influences the denominator of the accepted branch. Reject both and Y = 0, making both task " +
      "logit derivatives zero. This distinction prevents the tempting but incorrect rule “every " +
      "dropped branch has no gradient.”"
    }</Prose>
    
    <H3>{"How much capacity does a random load need?"}</H3>
    
    <Prose>{
      "Capacity planning asks a different question from the observed four-row trace. Use a " +
      "deliberately stated probability model: each token independently chooses a uniformly random " +
      "subset of k distinct experts out of E. For one particular expert, a token requests it with " +
      "probability k/E and can request it at most once. Its request count N_i therefore follows " +
      "Binomial(T, k/E), not Binomial(Tk, 1/E)."
    }</Prose>
    
    <MoeTrainingRandomLoad />
    
    <Prose>{
      "With T = 512, E = 8 and k = 2, the mean is 128 and variance is 512 × 1/4 × 3/4 = 96. " +
      "Capacity factor c sets C = ceil(cTk/E). At c = 1, C = 128. The chance a particular expert " +
      "exceeds its capacity is approximately 0.476272, yet the expected rejected-assignment " +
      "fraction is only 0.0305161."
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{
      "\\Pr(N_i>C)=\\sum_{n=C+1}^{T}\\Pr(N_i=n),\\qquad\n" +
      "\\text{expected rejected fraction}\n" +
      "=\\frac{E\\,\\mathbb E[(N_i-C)_+]}{Tk}."
    }</MathBlock>
    </div>
    
    <Prose>{
      "The first quantity counts the event “at least one extra request”; the second counts how many " +
      "requests are extra. An overload of one and an overload of fifty contribute equally to the " +
      "event but differently to lost work. Neither quantity is the fraction of tokens losing every " +
      "branch. Real routing can be correlated across tokens, so this model supplies a reference " +
      "calculation, not a capacity guarantee for trained routes. Measure those actual requests as " +
      "well."
    }</Prose>
    
    <H3>{"The complete scratch operator"}</H3>
    
    <Prose>{"Download "}<a href={"/learn-code/moe-training/moe_mechanisms.py"}>{"moe_mechanisms.py"}</a>{" and run "}<code>{"python moe_mechanisms.py"}</code>{
      " with Python 3.12 and NumPy 2.3 or later. Its complete source is displayed here in the " +
      "implemented reader."
    }</Prose>
    
    <Program file="moe_mechanisms.py" />
    
    <Prose>{""}<code>{"routes"}</code>{" separates score calculation, deterministic lower-ID tie resolution and applied weights. "}<code>{"assignment_groups"}</code>{" makes one stable expert grouping, retaining token/slot priority before capacity truncation. "}<code>{"forward"}</code>{" evaluates only accepted expert groups, records intermediates and uses "}<code>{"np.add.at"}</code>{
      " for additive returns. Plain indexed assignment would overwrite an earlier branch for the " +
      "same token."
    }</Prose>
    
    <Prose>{""}<code>{"backward"}</code>{" reverses those stored operations. "}<code>{"dgate"}</code>{" starts at zero, so a rejected branch has no numerator contribution; "}<code>{"gate_backward"}</code>{
      " still centers it with all requested gates, producing the denominator derivative just " +
      "derived. The input gradient includes both expert and router paths. Its returned expert " +
      "contribution does not include the residual; the enclosing model adds that derivative " +
      "explicitly."
    }</Prose>
    
    <Prose>{
      "The main prints the [4/3,1] return, [−2/9,2/9,0] no-drop derivative and [−2/3,2/3,0] " +
      "partial-drop derivative, followed by the objective and one real parameter update. Router " +
      "multiplication costs O(TdE), sorting assignments costs O(Tk log(Tk)), and selected expert " +
      "matrix products cost O(Tkdm). It stores the T × E scores and selected activations, not all E " +
      "expert returns for every row. These costs describe the algorithm; they do not predict a GPU " +
      "speedup."
    }</Prose>
    
    <H2>{"5. Measure hard load and soft mass separately"}</H2>
    
    <Prose>{
      "Task gradients reward useful prediction, which can concentrate requests on a few experts. " +
      "Concentration leaves others with fewer examples and can overload queues. A load-balancing " +
      "objective supplies another training signal."
    }</Prose>
    
    <MoeTrainingBalance />
    
    <Prose>{
      "For each expert, first count how often it was requested before capacity rejection. Divide by " +
      "Tk to obtain f_i, its fraction of all requested assignments. Separately average the full " +
      "softmax probability for that expert over the T routing-valid rows to obtain P_i. f is a hard " +
      "allocation statistic; P retains smooth dependence on the router scores. Both sum to one " +
      "under this convention."
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{
      "f_i=\\frac{1}{Tk}\\sum_t\\mathbf1(i\\in S_t),\\qquad\n" +
      "P_i=\\frac1T\\sum_t p_{ti},\\qquad\n" +
      "L_{bal}=E\\sum_i\\operatorname{stopgrad}(f_i)P_i."
    }</MathBlock>
    </div>
    
    <Prose>{
      "The stop-gradient label means ordinary differentiation does not try to move the integer " +
      "top-k choices. Their current counts weight a smooth penalty on probability mass. More " +
      "probability assigned to a heavily requested expert increases this weighted sum locally, " +
      "encouraging movement away from it."
    }</Prose>
    
    <Prose>{
      "Use four top-1 probability rows [.6,.3,.1], [.5,.4,.1], [.2,.7,.1], [.1,.2,.7]. The hard " +
      "counts are [2,1,1], so f = [.5,.25,.25]. Column means are P = [.35,.4,.25]. The loss is " +
      "3(.5×.35 + .25×.4 + .25×.25) = 1.0125. The two branches of the drawing explain why it is " +
      "neither a dropped-token percentage nor a distance between f and P."
    }</Prose>
    
    <Prose>{"Differentiate through P and each row's softmax. Since ∂p_ti/∂z_tj = p_ti(1(i=j) − p_tj),"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"\\frac{\\partial L_{bal}}{\\partial z_{tj}}\n=\\frac ET p_{tj}\\left(f_j-\\sum_i f_i p_{ti}\\right)."}</MathBlock>
    </div>
    
    <Prose>{
      "The term in parentheses compares expert j's hard fraction with the current row's " +
      "probability-weighted fraction. When f is exactly uniform, every term vanishes. The scalar " +
      "value is then one regardless of P. Uniform routing is a useful reference, but "
    }<strong>{"one is not a universal minimum"}</strong>{" of this coupled hard/soft expression."}</Prose>
    
    <Prose>{"The "}<a href={
      "/learn/path/full-curriculum/mixture-of-experts-transformers-moe?module=deep-learning-fundamentals#5-train-useful-routes-not-just-attractive-load-bars"
    }>{"earlier architecture lesson"}</a>{
      " gives a concrete counterexample. Three rows [.51,.49] select E0 and one row [.001,.999] " +
      "selects E1. Hence f = [.75,.25], P = [.38275,.61725], and 2(.75×.38275 + .25×.61725) = " +
      "0.88275. The counts are unequal despite a value below one. If every row instead has equal " +
      "soft probabilities, a deterministic tie rule can concentrate hard choices while P stays " +
      "uniform and the scalar is one. Inspect counts as well as the surrogate."
    }</Prose>
    
    <Prose>{
      "Two direct count diagnostics are maximum load divided by mean load, E max_i f_i, and squared " +
      "coefficient of variation, CV² = EΣ_i f_i² − 1. Uniform counts give one and zero " +
      "respectively. With distinct top-k, any expert's f_i is at most 1/k; the largest possible CV² " +
      "is E/k − 1, attained when every token selects the same k experts. “All tokens choose one " +
      "expert” is a complete-route collapse only for k = 1. Gate mass is yet another quantity: a " +
      "selected branch with a tiny gate still occupies an assignment slot."
    }</Prose>
    
    <Prose>{"The scratch "}<code>{"balance"}</code>{
      " routine returns the scalar, its manual logit derivative and these diagnostics. A group with " +
      "no valid routed rows contributes zero to an objective sum, but has no defined mean " +
      "statistic; the returned "
    }<code>{"mean"}</code>{" is "}<code>{"None"}</code>{". Treating an empty group as perfectly balanced would invent evidence."}</Prose>
    
    <H2>{"6. Keep task, balance and numerical scale distinct"}</H2>
    
    <Prose>{
      "Balancing load and predicting the target are different goals. Combine their derivatives " +
      "explicitly rather than interpreting a smaller auxiliary loss as better language modeling."
    }</Prose>
    
    <MoeTrainingGradient />
    
    <Prose>{
      "The training objective is L = L_task + αL_bal + βL_z. α and β are chosen coefficients, not " +
      "probabilities. Each term produces a gradient vector in the same router parameter space; the " +
      "optimizer receives their sum. If a task derivative points toward an expert that the load " +
      "term wants to discourage, increasing α can reduce or reverse that component of task " +
      "progress. In other coordinates the directions may agree. The lab computes all components " +
      "from the same real scratch operator before showing their norms and cosine. A zero vector has " +
      "no defined angle; it does not mean orthogonality."
    }</Prose>
    
    <H3>{"A common score shift leaves routing unchanged but moves z-loss"}</H3>
    
    <Prose>{
      "Softmax depends on score differences. Add a common a to every logit in a row: the factor " +
      "exp(a) cancels, leaving p and top-k unchanged. The log of the total exponential mass does " +
      "not cancel; it increases by a. ST-MoE uses its squared value as a separate numerical-scale " +
      "objective."
    }</Prose>
    
    <MoeTrainingZLoss />
    
    <div className="neural-equation">
    <MathBlock>{
      "\\ell_t=\\log\\sum_i e^{z_{ti}},\\qquad\n" +
      "L_z=\\frac1T\\sum_t\\ell_t^2,\\qquad\n" +
      "\\frac{\\partial L_z}{\\partial z_{tj}}=\\frac2T\\ell_t p_{tj}."
    }</MathBlock>
    </div>
    
    <Prose>{
      "The derivative follows from the outer square, 2ℓ, and the log-sum-exp derivative, p. For z = " +
      "log[4,2,1], ℓ = log 7. Subtracting log 7 from every score makes ℓ = 0 without changing " +
      "probabilities. Even z = log[.99,.01] has ℓ = 0 while routing is strongly concentrated. Thus " +
      "z-loss regulates a logit scale, not load balance or entropy."
    }</Prose>
    
    <Prose>{
      "Compute ℓ stably as max(z) + log Σ_i exp(z_i − max(z)). Stable arithmetic and FP32 router " +
      "reductions help avoid avoidable overflow and rounding, but cannot restore differences " +
      "already lost in an earlier low-precision representation. The "
    }<a href={
      "/learn/path/full-curriculum/fp8-training-low-precision-pre-training?module=large-language-models#8-preserve-an-update-smaller-than-a-gap"
    }>{"precision lesson"}</a>{
      " explains that information boundary. A z penalty acts on the current logits; it is not a " +
      "decoder for vanished bits."
    }</Prose>
    
    <H3>{"Use ordinary Torch and compare the entire update"}</H3>
    
    <Prose>{"Download "}<a href={"/learn-code/moe-training/moe_torch.py"}>{"moe_torch.py"}</a>{" beside "}<code>{"moe_mechanisms.py"}</code>{", install Torch and NumPy, then run "}<code>{"python moe_torch.py"}</code>{". "}<code>{"TorchMoE"}</code>{" stores the same output-by-input maps in an "}<code>{"nn.ParameterDict"}</code>{". "}<code>{"F.linear"}</code>{", "}<code>{"F.silu"}</code>{", "}<code>{"topk"}</code>{" and "}<code>{"index_add"}</code>{" express the same operations; autograd supplies their derivatives. "}<code>{"auxiliary"}</code>{" keeps counts detached and routes valid rows through the smooth probability mean."}</Prose>
    
    <Program file="moe_torch.py" />
    
    <Prose>{
      "The comparison copies the maps and rows before calculating either route. It compares " +
      "outputs, every input/parameter gradient and one SGD update. Actual float64 comparisons " +
      "passed 54 combinations of softmax/full-softmax/sigmoid, k = 1/2/4, uncapped/C = 1/C = 0, and " +
      "grouped versus selected-weight "
    }<code>{"bmm"}</code>{
      " execution. The latter gathers a weight copy per assignment; it is easy to batch but can " +
      "consume much more memory than grouping rows against one expert map. These are ordinary CPU " +
      "routes, not a claim of equivalence in speed to fused GPU kernels. Torch tie order need not " +
      "match our lower-ID convention, so comparisons use strict margins where selecting the same " +
      "IDs is unambiguous."
    }</Prose>
    
    <H2>{"7. Choose the population you want to balance"}</H2>
    
    <Prose>{
      "So far T described one group. A training system may divide rows into sequences, " +
      "microbatches, replicas or layers. The grouping changes the loss because it multiplies two " +
      "averages. Averaging already-multiplied local values generally does not reproduce multiplying " +
      "pooled averages."
    }</Prose>
    
    <MoeTrainingScope />
    
    <Prose>{
      "Let group A contain two rows [.9,.1] and group B two rows [.1,.9], with top-1. A always " +
      "selects E0 and B always selects E1. Each local loss is 2×.9 = 1.8. Pooling the four rows " +
      "gives f = [.5,.5] and P = [.5,.5], hence loss one and zero balancing derivative. Local " +
      "balance asks each group to use both experts; global balance permits complementary " +
      "specialization between groups. Neither question is automatically the correct one for every " +
      "training system."
    }</Prose>
    
    <Prose>{
      "For group g with T_g rows, let f_g and P_g be its fractions. The token-weighted local " +
      "objective is Σ_g (T_g/T) E f_g·P_g. The pooled objective is " +
      "E[Σ_g(T_g/T)f_g]·[Σ_g(T_g/T)P_g]. Expanding the latter creates cross-group terms absent from " +
      "the former. Unequal group sizes also make a plain average of group means wrong for a " +
      "token-weighted objective."
    }</Prose>
    
    <Prose>{""}<code>{"scope_comparison"}</code>{" in "}<code>{"moe_torch.py"}</code>{
      " uses an unequal two-row/one-row split and calculates local, exact global and prefix-count " +
      "objectives and gradients. A running count buffer sees only earlier microbatches when " +
      "computing an earlier gradient. It therefore implements an approximation, not the exact " +
      "full-group loss. Merely accumulating gradients does not make their statistical group global. " +
      "Exact grouped counts require observing the declared group's routes before all relevant " +
      "gradients, through retained graphs or a controlled second pass with matching model/noise " +
      "state."
    }</Prose>
    
    <H3>{"Replicas, reduction and the factor that averaging removes"}</H3>
    
    <Prose>{
      "An expert-parallel destination and a data-parallel replica are different roles. For the next " +
      "calculation, imagine W replicas of the same router, each holding different rows. First sum " +
      "detached assignment counts across replicas. That gives a global f. Each replica can then " +
      "compute differentiable probability sums for its own rows using that f."
    }</Prose>
    
    <MoeTrainingReplicas />
    
    <Prose>{"If the distributed optimizer "}<strong>{"averages"}</strong>{
      " replica gradients, multiply replica r's local mean loss by W T_r/T before backward. The " +
      "subsequent average then gives (1/W)Σ_r(W T_r/T)∇L_r = Σ_r(T_r/T)∇L_r, matching the pooled " +
      "token objective. An unscaled local mean works only under the appropriate equal-size and " +
      "reduction conventions. The complete Torch program simulates two replicas in one process and " +
      "compares their averaged, scaled shared-parameter gradient with the full combined objective. " +
      "It does not perform a network collective."
    }</Prose>
    
    <Prose>{
      "Keep layer identity separate too. E0 in layer 1 and E0 in layer 2 are different matrices. " +
      "Pooling their counts by ID can hide a layer that always selects its E0 with another layer " +
      "that always selects its E1. A layer-wise objective exposes that concentration; a " +
      "pooled-layer helper answers a different question."
    }</Prose>
    
    <Prose>{
      "Finally, routing-valid and target-valid masks differ. A real final context row may pass " +
      "through the model even when no next-token label is scored. Padding should not enter the " +
      "balancing population. Setting a padding label to −100 only removes it from the task loss; " +
      "the auxiliary helper also needs the attention or routing mask. We will inspect both " +
      "denominators in the actual Mixtral program."
    }</Prose>
    
    <H2>{"8. Regulate future choices using past load"}</H2>
    
    <Prose>{
      "An auxiliary loss changes the router through a differentiable probability path. Another " +
      "strategy changes which experts are selected using a small per-expert bias, updated from past " +
      "load. The bias is a control variable, distinct from the trained router matrix."
    }</Prose>
    
    <MoeTrainingBias />
    
    <Prose>{"We now deliberately change the score convention. A "}<strong>{"sigmoid affinity"}</strong>{
      " s_i = σ(z_i) is an independent positive score for expert i; all E affinities do not need to " +
      "sum to one. Select IDs using s_i + b_i, where b is the current control bias. Then normalize " +
      "the "
    }<strong>{"original selected affinities"}</strong>{" to form the mixture. The bias changes selection, not the numerator of the applied gate:"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"S_t=\\operatorname{topk}_i(s_{ti}+b_i),\\qquad\ng_{ti}=\\frac{s_{ti}}{\\sum_{j\\in S_t}s_{tj}}."}</MathBlock>
    </div>
    
    <Prose>{
      "For affinities [.8,.2,.1], top-2 initially uses E0/E1 with gates [.8,.2]. If a historical " +
      "bias makes E2 replace E1, the gates become [.8,.1]/.9 = [8/9,1/9]. Adding b to those gate " +
      "numerators would implement a different algorithm."
    }</Prose>
    
    <Prose>{
      "The task derivative changes because ds_j/dz_j = s_j(1 − s_j). Differentiate the selected " +
      "normalization first, obtaining (rᵀF_j − rᵀY)/Σ_selected s, then multiply by s_j(1 − s_j). " +
      "Thus"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"\\frac{\\partial L_{task}}{\\partial z_{tj}}\n=g_{tj}(1-s_{tj})\\left[a_{tj}r_t^TF_j-r_t^TY_t\\right]."}</MathBlock>
    </div>
    
    <Prose>{
      "The extra 1 − s factor distinguishes it from selected softmax. The capacity mask a retains " +
      "section 4's convention. For the study's sigmoid balance surrogate, first normalize all " +
      "affinities v_ti = s_ti/Σ_j s_tj, then use L_bal = EΣ_i f_i mean_t(v_ti). Its derivative is " +
      "(E/T)v_tj(1 − s_tj)[f_j − Σ_i f_i v_ti]. The scratch program implements both chain rules " +
      "explicitly, so switching scoring families is not silently treated as the same experiment."
    }</Prose>
    
    <Prose>{
      "For a batch with counts n_i, use target count mean(n) = Tk/E and speed u ≥ 0: b_i,new = " +
      "b_i,old + u sign(mean(n) − n_i). Overloaded experts lose bias; underloaded experts gain " +
      "bias; exactly on-target experts keep it. Six top-2 rows with counts [5,5,2] have target " +
      "four, giving changes [−u,−u,+u]. Compute those counts using batch n and apply the new bias " +
      "to batch n+1. u = 0 leaves selection unchanged; a large speed can overshoot and oscillate."
    }</Prose>
    
    <Prose>{
      "The replay lab repeats a stated synthetic affinity batch. It is a controller trace, not a " +
      "measured learning curve. If every row has identical affinities, an expert-only deterministic " +
      "bias cannot split identical rows across different sets within that batch. The controller may " +
      "alternate overloaded experts instead of achieving perfect within-batch balance."
    }</Prose>
    
    <H3>{"Keep future rows out of a current causal decision"}</H3>
    
    <MoeTrainingCausality />
    
    <Prose>{"Ordinary token choice selects experts separately for each row from its permitted context. In "}<strong>{"expert choice"}</strong>{
      ", an expert instead picks its favorite token rows from a group, so the number of branches " +
      "per token can vary. This directly constrains expert load, but introduces competition between " +
      "rows. Suppose an expert has one slot, the current row scores .7, and a future row scores .6 " +
      "in one sequence but .9 in another. The same current prefix receives the expert in the first " +
      "case and loses it in the second. If this affects its next-token prediction, future content " +
      "has influenced the result."
    }</Prose>
    
    <Prose>{
      "Historical-batch bias is fixed while the current group is predicted and avoids that " +
      "particular dependence. Updating a current token's selection using counts that include its " +
      "own future suffix would reintroduce the issue. Causal validity depends on the actual " +
      "dependency graph, not a method name."
    }</Prose>
    
    <Prose>{
      "Noise is another exploration mechanism: add sampled score perturbations to let nearby routes " +
      "sometimes exchange order. It does not impose the same deterministic load feedback. This " +
      "complete small NumPy example keeps the base logits fixed and draws four separate " +
      "perturbations; the selected ID is the observable result."
    }</Prose>
    
    <CodeBlock language={"python"}>{"import numpy as np\n\nrng = np.random.default_rng(23)\nlogits = np.array([1.0, 0.99, 0.0])\nnoise = rng.normal(0.0, 0.05, size=(4, 3))\nselected = np.argmax(logits + noise, axis=1)\nprint(selected.tolist())"}</CodeBlock>
    
    <Prose>{"The executed NumPy 2.3.5 output is "}<code>{"[0, 1, 0, 0]"}</code>{
      ". The second draw makes the nearly tied E1 win; the zero-noise case always chooses E0. This " +
      "illustrates stochastic exploration with a fixed supplied scale, without fitting a router. " +
      "The original sparse-MoE treatment learns a noise scale and an expected-load objective; " +
      "arbitrary noise decay is not a universal training rule. The "
    }<a href={
      "/learn/path/full-curriculum/mixture-of-experts-transformers-moe?module=deep-learning-fundamentals#7-several-ways-to-decide-who-does-the-work"
    }>{"architecture lesson's noise and allocation branch"}</a>{
      " develops those alternatives. DeepSeek-V3 combines sigmoid/bias selection with a small " +
      "complementary sequence auxiliary term; “loss-free balancing” does not mean its full training " +
      "objective contains no auxiliary loss at all."
    }</Prose>
    
    <H2>{"9. Deeper: change the size and sharing of the experts"}</H2>
    
    <Prose>{
      "Load depends on the pieces we ask the router to select. A wider expert performs more work " +
      "per request than a narrow one. To compare "
    }<strong>{"fine-grained experts"}</strong>{", change the number and width together under an explicit budget."}</Prose>
    
    <MoeTrainingGranularity />
    
    <Prose>{
      "A bias-free SwiGLU expert has G and U with md parameters each and D with dm: 3dm total. Its " +
      "matrix products use 3dm multiply-adds per token. Here a multiply-add is counted as one pair " +
      "of operations; a convention counting multiplication and addition as separate FLOPs doubles " +
      "this number. Activation, routing and memory movement remain separate."
    }</Prose>
    
    <Prose>{
      "Start with E = 4, k = 2, d = 32 and m = 16. Stored expert parameters are 4×3×32×16 = 6,144; " +
      "selected expert matrix work is 2×3×32×16 = 3,072 multiply-adds. The router stores 4×32 = 128 " +
      "parameters. Refine by r = 2: eight experts of width eight, selecting four. Stored expert " +
      "parameters and selected matrix work remain 6,144 and 3,072, but the router grows to 256 " +
      "parameters and every token creates four assignments instead of two. Equal expert arithmetic " +
      "has not made the complete execution equal."
    }</Prose>
    
    <Prose>{"In symbols, (E,k,m) becomes (rE,rk,m/r), for divisible m. Carve s always-on "}<strong>{"shared experts"}</strong>{
      " from that same refined bank, leaving rE − s routed experts and rk − s selected routed " +
      "experts. A shared branch runs for every token; it does not occupy a choice the router may " +
      "skip. In the example with s = 1, one shared plus three selected routed branches still runs " +
      "four width-eight experts. The router now scores seven candidates, with 224 parameters. " +
      "Adding a shared expert on top instead of carving it out increases active work; say which " +
      "construction is being compared."
    }</Prose>
    
    <Prose>{
      "Shared transformations can provide a common path while routed transforms learn more " +
      "conditional changes. That is an architectural opportunity, not proof that a particular " +
      "branch learns a human semantic category. The count ledger tells us how much work executes; " +
      "controlled prediction and intervention tests tell us what that work contributes."
    }</Prose>
    
    <H3>{"Initialize from an existing dense map"}</H3>
    
    <Prose>{""}<strong>{"Upcycling"}</strong>{
      " starts from a trained dense FFN and copies it into multiple expert slots. If every selected " +
      "expert returns exactly F(x), no branch is dropped and the selected gates sum to one, their " +
      "mixture is Σ_i g_iF(x) = F(x). The initial function is preserved under those conditions. " +
      "Retained full-softmax mass below one or capacity rejection breaks the equality."
    }</Prose>
    
    <Prose>{
      "The same equality also makes the local selected-normalized task router derivative zero: " +
      "every F_j − Y vanishes. Distinct routing/data exposure, noise or deliberately different maps " +
      "can break the symmetry later; copying itself is not immediate specialization. The "
    }<a href={
      "/learn/path/full-curriculum/mixture-of-experts-transformers-moe?module=deep-learning-fundamentals#9-reuse-an-existing-model-and-choose-the-right-granularity"
    }>{"architectural upcycling treatment"}</a>{" develops initialization choices. Our program's "}<code>{"expert_budget"}</code>{" makes the parameter/selected-work accounting executable without claiming a trained benefit."}</Prose>
    
    <Old ids={["5-production-implementation"]} />
    <H2>{"10. Build a complete small causal language model"}</H2>
    
    <Prose>{
      "The chosen arithmetic established the mechanism. Now ask whether learned expert " +
      "transformations help predict held-out text, and what happens to load while they learn. We " +
      "use the sigmoid affinities and selected-original normalization taught in section 8 for "
    }<strong>{"all three"}</strong>{
      " sparse policies. This keeps the score family fixed while comparing no balance, an auxiliary " +
      "term and delayed bias feedback."
    }</Prose>
    
    <MoeTrainingSavedModel />
    
    <Prose>{
      "The text is a small offline excerpt of Lewis Carroll's *Alice's Adventures in Wonderland*, " +
      "Chapter I, from Project Gutenberg ebook 11. Its original purpose is literary publication. " +
      "This educational next-byte task uses eighteen paragraphs for training and six later " +
      "paragraphs for held-out assessment; it is not a standard language-model benchmark. The files " +
      "and provenance are the exact paragraph split already used in the earlier tokenization " +
      "lesson. No new split was selected from the results."
    }</Prose>
    
    <Prose>{
      "For every paragraph byte, form a context of its four preceding UTF-8 bytes. At a paragraph " +
      "start, fill missing positions with input-only ID 256, our beginning sentinel. An ordinary " +
      "byte ranges from 0 to 255. File line separators do not become targets, and a paragraph never " +
      "uses the previous paragraph as its context. For the start “Alice”, the target "
    }<code>{"A"}</code>{" sees [256,256,256,256]; target "}<code>{"l"}</code>{" sees [256,256,256,65]. Once four bytes exist, the window slides without a sentinel."}</Prose>
    
    <Prose>{
      "There are 8,679 training targets and 1,949 held-out targets. Every actual held-out byte is " +
      "assessed once. The sentinel is an input embedding, never one of the 256 output classes. The " +
      "fixed byte vocabulary requires no fitting on held-out text."
    }</Prose>
    
    <Prose>{
      "The model stores a 257 × 8 embedding matrix. Four looked-up rows concatenate to width 32. A " +
      "router chooses two of four width-16 SwiGLU experts, combines their returns and adds the " +
      "width-32 residual. A 256 × 32 head plus 256 biases produces byte logits. Their softmax " +
      "probability for the observed byte gives the task negative log likelihood. This is a causal " +
      "fixed-context model with no attention layer; it isolates expert training in a complete, " +
      "inspectable prediction system."
    }</Prose>
    
    <H3>{"Propagate the task through every parameter bank"}</H3>
    
    <Prose>{"Download "}<a href={"/learn-code/moe-training/moe_language_study.py"}>{"moe_language_study.py"}</a>{", "}<code>{"moe_mechanisms.py"}</code>{", "}<a href={"/learn-code/moe-training/alice-train.txt"}>{"alice-train.txt"}</a>{", "}<a href={"/learn-code/moe-training/alice-heldout.txt"}>{"alice-heldout.txt"}</a>{" and "}<a href={"/learn-code/moe-training/alice-provenance.json"}>{"alice-provenance.json"}</a>{" into one directory. Run "}<code>{"python moe_language_study.py --output my-moe-results"}</code>{" for a fresh complete study. The outputs are "}<code>{"study.json"}</code>{" and one predetermined "}<code>{"model.json"}</code>{". Use a new output folder to retain earlier experiments."}</Prose>
    
    <Program file="moe_language_study.py" />
    
    <Prose>{""}<code>{"examples"}</code>{" creates context rows, target IDs and paragraph/position addresses. "}<code>{"predict"}</code>{" gathers embeddings, calls the sparse operator, adds its residual and computes head logits. "}<code>{"train_gradient"}</code>{" evaluates a stable mean cross-entropy and starts with the familiar derivative "}<code>{"(probabilities − one_hot_target)/batch_size"}</code>{
      ". The head gradient is that derivative transposed times the hidden rows. Its backward matrix " +
      "product supplies the derivative reaching the residual and expert sum. The residual " +
      "contributes that derivative directly; the sparse backward adds its own input derivative. " +
      "Finally "
    }<code>{"np.add.at"}</code>{
      " accumulates repeated byte IDs into the embedding matrix rather than overwriting their " +
      "contributions."
    }</Prose>
    
    <Prose>{
      "The optimizer is complete Adam, with first moment m ← β1m + (1−β1)g and second moment v ← " +
      "β2v + (1−β2)g². Starting from zero biases the first moments toward zero, so at step t divide " +
      "by 1−β1^t and 1−β2^t. Update the parameter by −η m_hat/(sqrt(v_hat)+ε). The program fixes η " +
      "= .003, β1 = .9, β2 = .999 and ε = 10⁻⁸. It has no weight decay, gradient clipping, capacity " +
      "drops, injected noise or z term in this study. Those are controlled exclusions, not " +
      "recommended defaults for every MoE."
    }</Prose>
    
    <H3>{"Freeze the comparison before observing outcomes"}</H3>
    
    <Prose>{
      "Seeds 17, 29 and 43 each create a fixed schedule of 400 updates × 64 sampled training " +
      "targets with replacement: 25,600 target presentations per run. All four policies within a " +
      "seed use the exact same target-index schedule. The three MoE policies also start with " +
      "identical maps. The auxiliary policy uses α = .05; the bias policy uses u = .01, updating " +
      "its bias after the parameter update from that batch's old-parameter counts. The no-balance " +
      "policy uses neither."
    }</Prose>
    
    <Prose>{
      "The dense reference is one width-32 SwiGLU expert, selected with gate one. Its matrix work " +
      "matches two width-16 experts at 3,072 multiply-adds per row. It has 13,576 learned " +
      "parameters versus 16,776 in each sparse model; its fixed unused zero-router buffer is not " +
      "counted or optimized. All policies share the embedding and head initialization within a " +
      "seed. Equal selected FFN work does not mean equal stored parameters, routing overhead or " +
      "wall time."
    }</Prose>
    
    <Prose>{
      "Assess the complete held-out split at steps 0, 100, 200, 300 and 400. Keep the final " +
      "checkpoint fixed instead of selecting a favorable held-out checkpoint. The program computes " +
      "global held-out count/probability sums before its balance scalar; it does not average " +
      "products from arbitrary evaluation chunks. Training trace entries use pre-update loss/counts " +
      "and post-update bias, while held-out checkpoints use the updated parameters. Those time " +
      "labels matter when inspecting a feedback loop."
    }</Prose>
    
    <Prose>{
      "The saved browser model is specified in advance: auxiliary policy, seed 17, step 400. The " +
      "inspector changes its context or zeros one expert return while keeping its router, gates and " +
      "all other weights fixed. It immediately shows the target's original and changed " +
      "probability/NLL. Disabling an unselected expert changes nothing; disabling a selected one " +
      "may help or hurt this individual prediction. This is inference on a saved model, not hidden " +
      "retraining."
    }</Prose>
    
    <H3>{"Inspect an actual ordinary Mixtral model"}</H3>
    
    <MoeTrainingNativeMap />
    
    <Prose>{
      "The ordinary architecture route uses a complete decoder, with attention and two sparse FFN " +
      "layers. It serves a different purpose from the fitted fixed-context study: inspect real " +
      "library shapes, objectives, backward and persistence with a tiny random model. Download "
    }<a href={"/learn-code/moe-training/moe_transformers.py"}>{"moe_transformers.py"}</a>{" beside "}<code>{"moe_torch.py"}</code>{" and "}<code>{"moe_mechanisms.py"}</code>{". With Transformers 5.17.0, Torch and NumPy installed, run "}<code>{"python moe_transformers.py --output my-mixtral-example"}</code>{". It instantiates "}<code>{"MixtralConfig"}</code>{" directly and downloads no pretrained weights."}</Prose>
    
    <Program file="moe_transformers.py" />
    
    <Prose>{
      "The configuration has vocabulary 257, hidden width 16, expert width 16, two layers, four " +
      "experts and top-2, four attention heads and two KV heads. Jitter is zero and training cache " +
      "is off. The 257th class is the padding ID in this API example; padding targets are ignored. " +
      "This deliberately differs from the fixed-context study's 256-class output and input-only " +
      "sentinel."
    }</Prose>
    
    <Prose>{
      "Two supplied text prefixes form a padded 2 × 37 input. Their attention mask contains 60 real " +
      "positions, while shifted labels supply 58 next-byte targets. The model returns logits " +
      "[2,37,257] and one [74,4] router-logit tensor per layer; the raw router arrays include the " +
      "padded positions. The auxiliary helper masks those positions and pools 120 real routed rows " +
      "across the two layers."
    }</Prose>
    
    <Prose>{
      "The installed helper uses count/T rather than count/(Tk). Its auxiliary loss is therefore k " +
      "times our normalized convention when every valid row requests k experts. The actual example " +
      "returns task NLL 5.561856, helper auxiliary 2.001345 and normalized auxiliary 1.000672. With " +
      "coefficient .01, total loss is 5.581869. The program reconstructs task and auxiliary " +
      "separately, then checks the sum. Copying .01 between helper conventions without accounting " +
      "for k changes the effective balance strength."
    }</Prose>
    
    <Prose>{""}<code>{"output_router_logits=True"}</code>{
      " requests the router outputs and auxiliary path. The program performs one SGD update, saves " +
      "the model locally and reloads it without network access; its evaluated output logits match " +
      "exactly in this run. It also copies one real packed sparse block into "
    }<code>{"TorchMoE"}</code>{
      ". Gate/up maps are stored together as [E,2m,d], split along the middle dimension; down maps " +
      "are [E,d,m]. With strict-margin inputs, outputs and every task input/map gradient agree " +
      "within the stated float32 tolerances. This checks the transformation itself, beyond matching " +
      "a final scalar loss."
    }</Prose>
    
    <Old ids={["6-visual-walkthrough"]} />
    <H2>{"11. Read the experiment without inventing a winner"}</H2>
    
    <Prose>{
      "The fixed experiment executed all twelve runs. The table shows final held-out NLL in " +
      "natural-log nats per target and the largest expert's request count divided by the mean " +
      "expert count. Lower NLL means more probability assigned to the observed text. A load ratio " +
      "closer to one means more even assignment counts. These quantities answer different " +
      "questions."
    }</Prose>
    
    <MoeTrainingResults />
    
    <NeuralTable caption={"11. Read the experiment without inventing a winner"} headers={[<>{"Seed"}</>,<>{"Policy"}</>,<>{"Held-out NLL"}</>,<>{"Maximum / mean load"}</>,<>{"Balance surrogate"}</>]} rows={[[<>{"17"}</>,<>{"None"}</>,<>{"2.248477"}</>,<>{"1.566957"}</>,<>{"1.098889"}</>],[<>{"17"}</>,<>{"Auxiliary"}</>,<>{"2.257948"}</>,<>{"1.319651"}</>,<>{"1.007478"}</>],[<>{"17"}</>,<>{"Bias"}</>,<>{"2.226801"}</>,<>{"1.226270"}</>,<>{"0.984843"}</>],[<>{"17"}</>,<>{"Dense"}</>,<>{"2.235356"}</>,<>{"1.000000"}</>,<>{"1.000000"}</>],[<>{"29"}</>,<>{"None"}</>,<>{"2.224507"}</>,<>{"1.478707"}</>,<>{"1.036146"}</>],[<>{"29"}</>,<>{"Auxiliary"}</>,<>{"2.209628"}</>,<>{"1.314520"}</>,<>{"1.013719"}</>],[<>{"29"}</>,<>{"Bias"}</>,<>{"2.247984"}</>,<>{"1.159569"}</>,<>{"1.000735"}</>],[<>{"29"}</>,<>{"Dense"}</>,<>{"2.193948"}</>,<>{"1.000000"}</>,<>{"1.000000"}</>],[<>{"43"}</>,<>{"None"}</>,<>{"2.247558"}</>,<>{"1.993843"}</>,<>{"1.303629"}</>],[<>{"43"}</>,<>{"Auxiliary"}</>,<>{"2.296872"}</>,<>{"1.220113"}</>,<>{"1.005665"}</>],[<>{"43"}</>,<>{"Bias"}</>,<>{"2.328361"}</>,<>{"1.083633"}</>,<>{"0.992140"}</>],[<>{"43"}</>,<>{"Dense"}</>,<>{"2.237825"}</>,<>{"1.000000"}</>,<>{"1.000000"}</>]]} />
    
    <Prose>{
      "Both balancing policies reduce peak/mean load relative to no balance for these three seeds. " +
      "Their task effects differ. Seed 29's auxiliary run improves NLL, while seed 43's auxiliary " +
      "and bias runs worsen it. Seed 17's bias run improves NLL, while its auxiliary run is " +
      "slightly worse than no balance. These are three individual observations under one tiny fixed " +
      "recipe, not a statistical confidence claim or a universal ranking of methods. The dense " +
      "model's load ratio is one by construction because it has one expert, which is not evidence " +
      "of better sparse resource use."
    }</Prose>
    
    <MoeTrainingHistory />
    
    <Prose>{
      "The training trace keeps actual counts, router gradient norms and feedback bias at the " +
      "recorded steps. Expert identity retains its hue across steps and policies; intensity or " +
      "numeric labels encode magnitude separately. Compare counts and gate mass: an assignment " +
      "counts equally regardless of its mixture weight. A hot expert may be frequently selected but " +
      "weakly weighted. No bar chart alone proves that a branch knows a particular kind of " +
      "language."
    }</Prose>
    
    <Prose>{
      "For a direct usefulness check, zero each expert's return in the predetermined " +
      "auxiliary/seed-17 model and score all 1,949 held-out targets again. The baseline NLL is " +
      "2.257948. Zeroing E0 gives 2.380502; E1 gives 2.479697; E2 gives 2.399355; E3 gives " +
      "2.469151. The gates are not renormalized and the router is unchanged. Each intervention " +
      "worsens aggregate held-out loss here, showing that each return contributes under this saved " +
      "computation. It does not isolate a named semantic skill: the interventions can disrupt " +
      "interactions and hidden scaling as well."
    }</Prose>
    
    <Prose>{
      "The experiment answers a bounded question: these controls change actual load and learned " +
      "prediction under a matched schedule. A stronger hardware claim needs timed execution on " +
      "stated devices, shapes and kernels. A stronger modeling claim needs broader data and " +
      "controlled comparisons. The next section explains which systems measurements would make the " +
      "former test meaningful."
    }</Prose>
    
    <Old ids={["8-what-scales-and-what-doesn-t"]} />
    <H2>{"12. Deeper: put the requests on actual device partitions"}</H2>
    
    <Prose>{
      "The operator computes a mathematical sum. A machine must place each expert's matrices " +
      "somewhere and move the requested rows to them. "
    }<strong>{"Expert parallelism"}</strong>{
      " places different experts on different ranks, where a rank is one participating " +
      "worker/device process. "
    }<strong>{"Data parallelism"}</strong>{
      " instead replicates a parameter set and combines its gradients. The two can be composed, but " +
      "their communication has different purposes."
    }</Prose>
    
    <MoeTrainingDevices />
    
    <Prose>{
      "Put E0/E1 on rank 0 and E2/E3 on rank 1. Tokens t0/t1 originate on rank 0; t2/t3 originate " +
      "on rank 1. Routes [0,1], [0,2], [1,3], [0,3] create eight assignments. Three are remote: " +
      "t1→E2, t2→E1 and t3→E0. The source/destination count matrix is [[3,1],[2,2]], including the " +
      "local assignments on its diagonal. Exchanging counts tells workers how many vectors to " +
      "receive before the payload exchange. An all-to-all pattern lets each source send to each " +
      "relevant destination."
    }</Prose>
    
    <Prose>{
      "The destination groups rows for its own experts, runs the matrices and sends the outputs " +
      "back with token/slot addresses. The source applies gate weights and adds all returned " +
      "contributions to the correct token. Backward reverses the activation path: the destination " +
      "receives a gradient for an expert output and returns the expert input derivative. It also " +
      "accumulates local expert-weight gradients. If another data-parallel replica holds those same " +
      "weights, a separate replica reduction combines their parameter gradients."
    }</Prose>
    
    <Prose>{"For an explicitly "}<strong>{"uncoalesced per-assignment"}</strong>{
      " protocol, each remote assignment sends d values out and d back in forward. At q bytes per " +
      "value, payload is 2 R d q for R remote assignments. Here R = 3, d = 2 and q = 4 gives 48 " +
      "bytes. The reverse gradient vectors require another 48 under the same convention. This " +
      "excludes IDs/count metadata, synchronization and parameter-gradient exchange. Coalescing " +
      "multiple requests to the same destination can change the payload account; use the protocol " +
      "actually implemented."
    }</Prose>
    
    <Prose>{
      "Moving E0 to rank 1 changes remote requests from three to four while keeping the same " +
      "mathematical outputs. Placing all tokens and experts together removes these activation " +
      "transfers. Neither placement change proves an elapsed-time improvement: work can become more " +
      "concentrated, and communication can overlap with computation. Per-expert counts and per-rank " +
      "sums reveal different bottlenecks."
    }</Prose>
    
    <H3>{"Padded, ragged and block-aligned multiplication"}</H3>
    
    <MoeTrainingBlocks />
    
    <Prose>{
      "Our four experts receive [3,2,1,2] rows. Padding every expert to the maximum requires " +
      "[3,3,3,3], or twelve rows of matrix work for eight actual assignments. A ragged grouped " +
      "representation holds only [3,2,1,2]. A block-row size of four rounds each positive group up " +
      "independently to [4,4,4,4], or sixteen allocated rows. A zero-row expert allocates zero " +
      "blocks. At block size one, alignment overhead vanishes."
    }</Prose>
    
    <Prose>{
      "MegaBlocks uses block-sparse layouts to support variable expert loads without dropping " +
      "requests just to force equal row counts. Actual kernels still have tile, alignment and " +
      "hardware constraints. “Dropless” describes accepted assignments, not zero padding or " +
      "identical rank completion time. FP8-oriented grouped kernels may pad groups to their " +
      "required alignments; the earlier precision recipe and this execution layout must agree."
    }</Prose>
    
    <MoeTrainingCosts />
    
    <Prose>{
      "Keep four budgets distinct: stored parameters, activated matrix arithmetic, " +
      "activation/weight memory traffic and measured elapsed time. A bank can keep selected expert " +
      "arithmetic fixed while growing router work, optimizer storage and network traffic. Small " +
      "expert batches can also reduce matrix hardware utilization. A real profile should identify " +
      "where the waiting or arithmetic occurs before increasing experts or changing placement."
    }</Prose>
    
    <H3>{"Run the address ledger on a CPU"}</H3>
    
    <Prose>{"Download "}<a href={"/learn-code/moe-training/moe_systems.py"}>{"moe_systems.py"}</a>{" and run "}<code>{"python moe_systems.py"}</code>{
      " with NumPy and Torch. It uses small linear expert maps to expose dispatch and return " +
      "addresses; the actual training programs use SwiGLU. Here "
    }<code>{"dispatch"}</code>{
      " builds source/destination packets, forms destination expert groups and returns every result " +
      "to its original token/slot. The linear maps make a hand calculation simple: expert i scales " +
      "the two-coordinate input by i+1. Token t1 = [3,4] uses E0/E2 with gates [.6,.4], giving " +
      ".6[3,4] + .4[9,12] = [5.4,7.2]. Its placement changes no value."
    }</Prose>
    
    <Program file="moe_systems.py" />
    
    <Prose>{"The ordinary comparison independently gathers selected matrices, uses "}<code>{"torch.bmm"}</code>{" and scatters with "}<code>{"index_add"}</code>{
      ". Manual backward reverses the returned ledger; both input and expert-map gradients agree " +
      "with autograd. The program prints the changed placement, all-local null, block-one null and " +
      "exact refined expert budgets. Its ranks are Python data structures, not network processes. " +
      "Use "
    }<a href={"https://docs.nvidia.com/megatron-core/developer-guide/0.15.0/api-guide/moe.html"}>{"Megatron-Core 0.15's MoE guide"}</a>{
      " for actual expert-parallel sizes, all-to-all dispatch, grouped GEMM, balance settings and " +
      "capacity/alignment choices on supported GPU systems. Those settings control different " +
      "mechanisms; a list of flags without a model/data/runtime configuration is not a complete " +
      "training experiment."
    }</Prose>
    
    <Old ids={["7-decision-matrix","9-failure-modes-and-gotchas"]} />
    <H2>{"13. Choose an intervention from the evidence"}</H2>
    
    <Prose>{
      "Return to the opening question: storing a bank is useful only if the training and execution " +
      "make its transformations worth their cost. Diagnose the measured symptom before choosing the " +
      "control."
    }</Prose>
    
    <NeuralTable caption={"13. Choose an intervention from the evidence"} headers={[<>{"Observation"}</>,<>{"A useful hypothesis and discriminating check"}</>]} rows={[[<>{"Even counts, worse held-out task loss"}</>,<>{
      "Balance may compete with useful task directions. Compare task/aux gradient components, then " +
      "change one coefficient under a fresh fixed protocol while holding data budget constant."
    }</>],[<>{"Normalized top-1 has zero router task gradient"}</>,<>{
      "The derivative is structurally zero. Check gate convention before diagnosing broken " +
      "autograd; retained full-softmax weights change that derivative and mixture scale."
    }</>],[<>{"Auxiliary scalar near one, hot expert"}</>,<>{
      "Inspect hard counts, soft means and ties. The scalar is not a distance with a guaranteed " +
      "minimum; count/rank diagnostics are necessary."
    }</>],[<>{"Batch loss changes when padding length changes"}</>,<>{
      "Check routing masks and denominator separately from ignored LM labels. Compare the same real " +
      "rows with extra padding."
    }</>],[<>{"Local batches are concentrated, pooled batch balanced"}</>,<>{
      "Decide whether sequence, microbatch, global group or device balance answers the intended " +
      "question. Match both counts and differentiable reduction scope."
    }</>],[<>{"Many rejected assignments"}</>,<>{
      "Inspect capacity factor, priority and complete-token loss separately. A larger buffer, " +
      "dropless path or different allocation has different memory/work consequences."
    }</>],[<>{"Small expert gradients"}</>,<>{
      "Check selection counts, gate mass, saturated affinities and actual task credit. No local " +
      "gradient does not exclude optimizer-state movement."
    }</>],[<>{"One rank finishes late despite moderate per-expert imbalance"}</>,<>{
      "Sum all its expert work and remote traffic. Expert placement, tile sizes or overlap may " +
      "matter more than a scalar balance coefficient."
    }</>],[<>{"A current prediction changes when future text changes"}</>,<>{
      "Trace batch competition or same-sequence feedback. A causal attention mask cannot repair a " +
      "future-dependent routing allocation elsewhere."
    }</>]]} />
    
    <Prose>{
      "There is no universal coefficient, load threshold or pause rule that follows from these " +
      "observations alone. The useful outcome is a falsifiable hypothesis: which exact computation " +
      "should change, which evidence would confirm the cause, and what must remain fixed to " +
      "interpret the result?"
    }</Prose>
    <Old ids={["11-self-check-exercises"]} />
    <H2>{"14. Practice with changed inputs"}</H2>
    <Prose>{
      "Each prompt is independent of the live lab. Attempt it before opening its hint and worked " +
      "solution. Use the supplied complete programs to check arithmetic and then explain the " +
      "mechanism in your own terms."
    }</Prose>
    <section className="moet-practice" data-lesson-exercise>
    <H3>{"A. Change the returns and the gate convention"}</H3>
    
    <Prose>{
      "Scores are log[3,2,1], k = 2, and returned vectors are F0 = [1,2], F1 = [4,0], F2 = [0,5]. " +
      "Compute selected-normalized and retained-full outputs. For r = [1,1], compute the " +
      "selected-normalized logit derivatives. What changes for normalized k = 1?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Distinguish the full denominator six from the selected denominator five."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Full probabilities are [1/2,1/3,1/6]. Selected gates [3/5,2/5] give Y = [11/5,6/5], with " +
      "directional value 17/5. Gate derivatives are (3/5)(3−17/5) = −6/25 and (2/5)(4−17/5) = 6/25, " +
      "with zero for E2. Retained full weights give [11/6,1]. Normalized k = 1 returns F0 exactly " +
      "and has zero fixed-set router task derivative; expert gradients need not be zero."
    }</Prose>
    </details>
    </section>
    
    <section className="moet-practice" data-lesson-exercise>
    <H3>{"B. Distinguish assignments from tokens"}</H3>
    
    <Prose>{
      "Five rows request [0,1], [0,2], [0,1], [1,2], [0,2]. Every gate is 1/2, expert scalar " +
      "returns are [2,4,6], and C = 2 with original-token priority. Give requested counts, accepted " +
      "assignments, expert updates and completely dropped token IDs. Then add a residual of 10 to " +
      "every row."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Make a separate queue for each expert before scattering to tokens."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Counts are [4,3,3]. E0 accepts t0/t1; E1 accepts t0/t2; E2 accepts t1/t3. Six of ten " +
      "assignments remain. Updates are [3,4,2,3,0]; only t4 loses both branches. Residual outputs " +
      "are [13,14,12,13,10]. Four rejected assignments are 40% of requests, but one fully dropped " +
      "token is 20% of tokens. Do not renormalize t2 or t3 to a gate of one."
    }</Prose>
    </details>
    </section>
    
    <section className="moet-practice" data-lesson-exercise>
    <H3>{"C. Size a random-load buffer"}</H3>
    
    <Prose>{
      "Under independent uniform top-2 subsets with T = 512 and E = 8, derive the mean and variance " +
      "of one expert's load. Find the smallest integer capacity whose overload probability is below " +
      "5%, then below 1%. Explain why these are not the same constraints as limiting the fraction " +
      "of lost requests."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Each token contributes a Bernoulli variable with probability 1/4."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " N is Binomial(512,1/4), with mean 128 and variance 96. Summing the exact finite PMF gives " +
      "minimum capacities 144 and 151 respectively. The overload event weights all excesses " +
      "equally; a lost-request constraint weights an excess of n−C by that amount. At C = 128 the " +
      "overload chance is about .476272 but expected rejected assignment share is .0305161. Real " +
      "correlated routes can depart from both calculations."
    }</Prose>
    </details>
    </section>
    
    <section className="moet-practice" data-lesson-exercise>
    <H3>{"D. Refute a false minimum with a new example"}</H3>
    
    <Prose>{
      "Three top-1 rows have probabilities [.51,.49]; a fourth has [.1,.9]. Compute f, P and E f·P. " +
      "Which claim does the result disprove?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Hard choices need not match the average soft mass."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " f = [.75,.25], P = [.4075,.5925], giving 2(.75×.4075 + .25×.5925) = .9075. It disproves the " +
      "assertion that one is the guaranteed minimum. It does not disprove that a smooth surrogate " +
      "can be a useful training control; usefulness requires a task/load comparison."
    }</Prose>
    </details>
    </section>
    
    <section className="moet-practice" data-lesson-exercise>
    <H3>{"E. Combine task and balance derivatives"}</H3>
    
    <Prose>{
      "For one top-1 row using retained full-softmax gates [.8,.2], f = [1,0]. Compute the balance " +
      "logit derivative. A separately calculated task derivative is [−.16,.16]. Choose α that " +
      "cancels it at this row. Why is this not an optimal α for training?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Use E/T = 2 and the probability-weighted f value .8."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Balance derivative is [2×.8×.2, 2×.2×(−.8)] = [.32,−.32]. α = .5 cancels the supplied task " +
      "vector. With selected-normalized top-1 instead, the single selected gate would be one and " +
      "its task logit derivative would be zero. The supplied nonzero task derivative belongs to " +
      "retained full-softmax gating. That only cancels one current derivative; it says nothing " +
      "about desired loss, other rows, subsequent route changes or held-out prediction. A zero " +
      "combined derivative can stop useful progress as readily as solve a problem."
    }</Prose>
    </details>
    </section>
    
    <section className="moet-practice" data-lesson-exercise>
    <H3>{"F. Keep unequal groups and layers honest"}</H3>
    
    <Prose>{
      "Group A has two rows [.9,.1] and [.8,.2]; group B one row [.1,.9], top-1. Calculate the " +
      "token-weighted local and pooled losses. State the scaling needed if two replica gradients " +
      "are averaged. Would pooling two independently parameterized layers by expert ID answer the " +
      "same question as averaging their losses?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Global f is [2/3,1/3]; global P is [.6,.4]."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " A's loss is 1.7 and B's 1.8. Token weighting gives (2/3)1.7 + (1/3)1.8 = 1.733333. Pooled " +
      "loss is 2[(2/3).6 + (1/3).4] = 1.066667. The actual program's prefix-count approximation is " +
      "1.377778, a third objective. For replica averaging, use W T_A/T = 4/3 and W T_B/T = 2/3 with " +
      "fixed global counts. Layer pooling is different because same-numbered expert parameters are " +
      "unrelated; complementary layer collapse can appear balanced when pooled."
    }</Prose>
    </details>
    </section>
    
    <section className="moet-practice" data-lesson-exercise>
    <H3>{"G. Separate logit scale from route shape"}</H3>
    
    <Prose>{
      "Take z = log[.99,.01]. Compute z-loss before and after adding 2 to both logits. What happens " +
      "to probabilities, choices and entropy?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" The original exponentials sum to one."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Original log-sum-exp is zero and squared z-loss zero. The shift makes log-sum-exp two and " +
      "its square four. Probabilities, ordering and entropy are unchanged because the softmax " +
      "common factor cancels. Zero z-loss did not make the distribution uniform."
    }</Prose>
    </details>
    </section>
    
    <section className="moet-practice" data-lesson-exercise>
    <H3>{"H. Use bias for selection only"}</H3>
    
    <Prose>{
      "A row has sigmoid affinities [.8,.4,.3], bias [−.2,−.2,.2] and k = 2. Select its experts and " +
      "compute their applied gates. For batch counts [6,3,3] and speed .02, give the bias update. " +
      "Explain when using those counts could leak future information."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Corrected selection scores and original gate numerators are different arrays."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Corrected scores [.6,.2,.5] select E0/E2. Original affinities normalize to [8/11,3/11]. " +
      "Target count is four, so the bias change is [−.02,+.02,+.02]. Applying a bias based on " +
      "completed earlier batches is a historical controller. Allowing the current token's own " +
      "future suffix to change its route introduces a future-dependent prediction path."
    }</Prose>
    </details>
    </section>
    
    <section className="moet-practice" data-lesson-exercise>
    <H3>{"I. Refine under an explicit work budget"}</H3>
    
    <Prose>{
      "Start with d = 24, E = 6, k = 2, m = 12. Refine by r = 3, then carve out two always-on " +
      "experts. Calculate stored expert parameters, selected expert multiply-adds, routed candidate " +
      "count, selected routed count and router parameters."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Keep rE, rk and m/r together; the shared branches are inside that bank."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Original and refined stored expert parameters are 6×3×24×12 = 5,184. Selected expert work " +
      "remains 2×3×24×12 = 1,728. After refinement there are 18 width-four experts, six active. " +
      "Carving two shared leaves 16 routed and four selected routed. The router has 24×16 = 384 " +
      "parameters, compared with 144 originally. Equal selected expert arithmetic does not conserve " +
      "routing/dispatch work."
    }</Prose>
    </details>
    </section>
    
    <section className="moet-practice" data-lesson-exercise>
    <H3>{"J. Move a map without changing the function"}</H3>
    
    <Prose>{
      "Use the systems program's four-token fixture, but move E0 from rank 0 to rank 1. Count " +
      "remote assignments and forward payload at d = 2, q = 4. Compute block-allocated rows for " +
      "[3,2,1,2] at block size two. Which costs are still absent?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Re-evaluate every source→expert destination, then round each group separately."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " t0→E0 and t1→E0 become remote, while t3→E0 becomes local; net remote requests increase from " +
      "three to four. Forward request+return payload is 2×4×2×4 = 64 bytes. Block allocation is " +
      "[4,2,2,2], ten rows for eight assignments. Metadata, optimizer/replica reductions, actual " +
      "latency, bandwidth and overlap remain outside this payload model. The function is conserved " +
      "because maps, gates and addressed return sums are unchanged."
    }</Prose>
    </details>
    </section>
    
    <section className="moet-practice" data-lesson-exercise>
    <H3>{"K. Modify and verify a real route"}</H3>
    
    <Prose>{
      "Change the ordinary/scratch comparison to k = 1 with retained full-softmax weights, then to " +
      "selected-normalized weights. Identify the expected router task gradient difference, preserve " +
      "strict margins and compare every gradient and one update. For a new study, change context " +
      "width or one coefficient under a new fixed protocol and a fresh output folder. Specify what " +
      "constitutes success without promising a better NLL."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Separate mechanism parity from scientific benefit."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " The existing comparison already supports both kinds. With full weights, the selected " +
      "probability generally carries a task gradient through all logit denominators; " +
      "selected-normalized top-1 has none away from route changes. Hold auxiliary/z coefficients at " +
      "zero to isolate that statement, then add them back and name their gradients. Matching " +
      "scratch/ordinary outputs, all map/input gradients and update within tolerance is the " +
      "mechanism criterion. The new study must fix data/schedule/evaluation before outcomes, report " +
      "all runs and compare task and load separately. A reproducible worse result still satisfies " +
      "an honest scientific demonstration; an unexplained mismatch does not."
    }</Prose>
    </details>
    </section>
    
    <section className="moet-practice" data-lesson-exercise>
    <H3>{"L. Diagnose a low auxiliary loss and a slow rank"}</H3>
    
    <Prose>{
      "A run has balanced global expert counts but worse held-out NLL than its matched baseline. " +
      "Another has auxiliary value .99 while one rank finishes much later. For each, propose a " +
      "measurement and one controlled intervention with held-fixed quantities. Give criteria for " +
      "interpreting the result."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" The scalar objective, useful prediction and physical worker queues are different objects."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " For the first, measure task/aux gradient alignment and per-seed task loss, then vary one " +
      "coefficient with the same architecture, data budget and predeclared evaluation. Reduced load " +
      "with worse task loss indicates a tradeoff, not automatic progress. For the second, inspect " +
      "requested/accepted counts, gate mass, per-rank summed work, tile allocation and measured " +
      "transfers. A placement-only change keeps maps and predictions fixed while testing a rank " +
      "bottleneck. Alternatively a mask/scope correction tests an objective error. Several answers " +
      "are valid if they identify a causal mechanism, preserve a comparison and state what result " +
      "would falsify the hypothesis."
    }</Prose>
    </details>
    </section>
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="further-learning">
    <H2>{"Further learning"}</H2>
    
    <ul>
    <li>{""}<a href={
      "https://github.com/stanford-cs336/spring2025-lectures/blob/98455ec198c9a88ec1ab2b1c4058662431b54ce3/nonexecutable/2025%20Lecture%204%20-%20MoEs.pdf"
    }>{"Stanford CS336, 2025 Lecture 4: MoEs"}</a>{
      " is a slide-based second route through routing, granularity, control and systems. Use after " +
      "sections 1–8; its compressed diagrams benefit from knowing the local quantities first. These " +
      "lecture notes were inspected, not the lecture video."
    }</li>
    <li>{""}<a href={"https://huggingface.co/blog/moe"}>{"Hugging Face, Mixture of Experts Explained"}</a>{
      " is an illustrated article for revisiting sparse FFNs, capacity and training tradeoffs. Its " +
      "historical model comparisons need their original conditions; use the current pinned code " +
      "here for exact APIs."
    }</li>
    <li>{""}<a href={"https://huggingface.co/blog/moe-transformers"}>{"Hugging Face, MoEs in Transformers"}</a>{
      " develops implementation layouts from expert loops to packed/grouped execution. Read after " +
      "the Torch and systems programs. GPU backend availability and selected-weight memory costs " +
      "are separate from the mathematical sum."
    }</li>
    </ul>
    
    <Old ids={["10-primary-sources"]} />
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="references">
    <H2>{"Technical references"}</H2>
    
    <ul>
    <li>{""}<a href={"https://arxiv.org/abs/1701.06538"}>{"Shazeer et al., 2017"}</a>{
      ": original sparse selected routing, noise and expected-load mechanisms; its loss conventions " +
      "differ from the Switch-style hard/soft surrogate used here."
    }</li>
    <li>{""}<a href={"https://arxiv.org/abs/2006.16668"}>{"GShard"}</a>{
      ": group-level top-2 assignment and capacity policies. Its stochastic second route is a " +
      "particular algorithm; our deterministic queue convention is stated separately."
    }</li>
    <li>{""}<a href={"https://www.jmlr.org/papers/volume23/21-0998/21-0998.pdf"}>{"Switch Transformers"}</a>{
      ": retained full-softmax top-1, capacity and hard/soft balancing, especially sections " +
      "2.1–2.3. Figures 2–3 are useful architecture/capacity references."
    }</li>
    <li>{""}<a href={"https://arxiv.org/abs/2202.08906"}>{"ST-MoE"}</a>{": router z-loss and stability studies. Its numerical-scale objective does not prove uniform routing."}</li>
    <li>{""}<a href={"https://arxiv.org/abs/2401.04088"}>{"Mixtral"}</a>{" and the "}<a href={
      "https://github.com/huggingface/transformers/blob/v5.17.0/src/transformers/models/mixtral/modeling_mixtral.py"
    }>{"Transformers 5.17 source"}</a>{": architecture and the exact packed-map/helper/causal-loss API inspected here."}</li>
    <li>{""}<a href={"https://arxiv.org/abs/2401.06066"}>{"DeepSeekMoE"}</a>{": fine-grained and shared experts under explicit active-work constructions."}</li>
    <li>{""}<a href={"https://arxiv.org/abs/2408.15664"}>{"Auxiliary-Loss-Free Load Balancing"}</a>{" and "}<a href={"https://arxiv.org/abs/2412.19437"}>{"DeepSeek-V3"}</a>{
      ": selection bias, original-affinity weighting and the actual combined objective. The V3 " +
      "version discussed here also includes a small complementary sequence term."
    }</li>
    <li>{""}<a href={"https://arxiv.org/abs/2501.11873"}>{"Demons in the Detail"}</a>{
      ": statistical group choice, global-count synchronization and the difference between exact " +
      "global objectives and accumulation approximations."
    }</li>
    <li>{""}<a href={"https://arxiv.org/abs/2202.09368"}>{"Expert Choice"}</a>{": experts selecting token rows and the resulting different allocation constraint."}</li>
    <li>{""}<a href={
      "https://proceedings.mlsys.org/paper_files/paper/2023/file/5a54f79333768effe7e8927bcccffe40-Paper-mlsys2023.pdf"
    }>{"MegaBlocks"}</a>{": permutation and block-sparse execution, especially Figures 1 and 3."}</li>
    <li>{""}<a href={"https://docs.nvidia.com/megatron-core/developer-guide/0.15.0/api-guide/moe.html"}>{"Megatron-Core 0.15 MoE guide"}</a>{
      ": supported distributed router/dispatcher/GEMM and alignment configuration. The CPU " +
      "emulation does not verify GPU throughput."
    }</li>
    </ul>
    
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="readiness">
    <H2>{"Readiness and the next question"}</H2>
    
    <Prose>{
      "Explain why normalized top-1 lacks local router task credit, trace a rejected branch's " +
      "denominator derivative, calculate a scoped balance loss and use the complete programs to " +
      "compare a changed case. Then distinguish an expert's load, its contribution to held-out " +
      "prediction and the worker cost of executing it. Those are the decisions this lesson equips " +
      "you to make."
    }</Prose>
    
    <Prose>{"Next, "}<a href={
      "/learn/path/full-curriculum/multimodal-pre-training-vision-encoders-cross-modal-alignment?module=large-language-models"
    }>{"Multimodal Pre-Training"}</a>{
      " asks how rows from vision and language are learned and aligned. Such rows can also enter " +
      "sparse expert banks; their representation and objective must be understood before " +
      "interpreting modality-dependent routing as useful specialization."
    }</Prose>
    </section>
  </div>;
}

export default {
  title: 'MoE Training & Expert Load Balancing',
  slug: 'moe-training-expert-load-balancing',
  readTime: '~70 min read + 100 min practice',
  content: MoeTrainingLesson,
};
