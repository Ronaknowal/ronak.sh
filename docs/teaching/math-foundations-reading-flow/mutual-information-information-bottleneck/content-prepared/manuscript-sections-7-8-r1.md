## 7. Distinguish a training bound from information

A high-dimensional encoder may be easy to sample but hard to average over all inputs. Its marginal p(z)=Eₓq(z|x) and its true label conditional p(y|z) can then be inaccessible. A variational method substitutes tractable distributions and tracks how those substitutions change the objective. Keep the encoder q(z|x), codeword reference r(z), and predictive decoder s(y|z) as three distinct objects.

First consider the cost U=EₓD_KL(q(z|x)‖r(z)). Adding and subtracting log p(z) separates it into true input information and marginal mismatch:

$$
U=I(X;Z)+D_{\rm KL}(p(z)\Vert r(z))\geq I(X;Z).
$$

For prediction let C=E_(Y,Z)[−log s(Y|Z)] be the decoder cross-entropy. Subtracting conditional entropy leaves G_s=E_zD_KL(p(y|z)‖s(y|z)). Therefore the relevance surrogate is

$$
L=H(Y)-C=I(Y;Z)-G_s\leq I(Y;Z).
$$

The first substitution gives an upper bound on rate; the second gives a lower bound on relevance. The following picture fixes the true information coordinates and changes only the two auxiliary choices.

[[M35]]

The fixed noisy encoder has R=.278071905 and T=.173253628 bits. Matching the reference to the true marginal closes the rate gap. Matching the decoder to the true conditional closes the relevance gap. A poor decoder can make L negative even though true MI cannot be negative. A zero decoder probability on a positive-mass event gives infinite cross-entropy; compatible support is a mathematical requirement, not an optional plotting adjustment. The live controls alter these auxiliaries while the encoder and its true dots remain fixed on the same axes.

Combining the two bounds gives an upper objective. The next ruler labels each piece of its gap and shows the coefficient conversion used by many training losses.

[[M36]]

Writing G_r=D_KL(p(z)‖r(z)), we have

$$
\begin{aligned}
J&=R-\beta T,\\
\widetilde J&=U-\beta L=U+\beta C-\beta H(Y),\\
\widetilde J-J&=G_r+\beta G_s\geq0.
\end{aligned}
$$

For a fixed data law H(Y) is constant, so minimizing U+βC minimizes the same upper objective. For β>0, dividing the entire expression by beta gives C+λU with λ=1/β. A larger compression weight lambda thus corresponds to a smaller relevance weight beta in the earlier convention. At beta0 this division is invalid; the original objective simply minimizes rate. Tightening an auxiliary mismatch can lower the upper objective while both true information values remain unchanged.

{{PROGRAM:bounds}}

The finite programme computes the true encoder laws first, then separately evaluates the reference and decoder replacements. It checks the two exact gap identities rather than calling either bound an MI estimate. With matched auxiliaries the reported upper objective equals the true objective; with mismatched auxiliaries their difference is the sum of the declared nonnegative gaps. This finite example makes quantities visible that a large neural model may not permit us to evaluate exactly.

### Compute a small Gaussian bottleneck step

A neural encoder can output a mean μ(x) and a positive standard deviation σ(x), defining a diagonal Gaussian q(z|x). Draw independent standard-normal noise epsilon and use z=μ(x)+σ(x)⊙epsilon. The actual mechanism is an affine transformation of independent noise, followed by a label decoder.

[[M37]]

The mean sets the centre of the conditional distribution; the standard deviation scales the random displacement. This is the pathwise derivative mechanism from [Variational Inference](/learn/path/full-curriculum/variational-inference#6-differentiate-an-expectation): hold the sampled epsilon fixed while differentiating through the transformation. Valid differentiation of the expected objective additionally requires the usual integrability and interchange conditions. The earlier programme applies this technique to an ELBO; here the task is supervised label prediction.

For a standard-normal reference, write v_j=σ_j². The per-input Gaussian KL is

$$
D_{\rm KL}(q(z\mid x)\Vert\mathcal N(0,I))
=\tfrac12\sum_j(\mu_j^2+v_j-1-\log v_j).
$$

This formula uses natural logarithms and gives nats. Use decoder cross-entropy in nats too. Averaging its analytic KL removes sampling noise from that term, but does not make it exact I(X;Z): the marginal mismatch gap remains.

To see every computational step, use a scalar encoder μ=aS+bN+c, shared standard deviation exp(d), and binary-decoder logit ℓ=uz+v. Declare four input rows(S,N)=00,01,10,11, targets(0,0,1,0), and fixed comparison noises(−1,.5,.5,−1). These are constructed batch and noise values for checking arithmetic, not a claim that this four-row batch exactly realizes the earlier population's .1 label-noise law. Initialize(a,b,c)=(.8,.3,−.4), d=ln(.7), and(u,v)=(1.1,−.2). Use compression weight λ=.2 and a single gradient step of size .01.

[[M38]]

In the first row μ=−.4, z=−.4+.7×(−1)=−1.1, and ℓ=1.1×(−1.1)−.2=−1.41. For target0 its stable logistic cross-entropy is .218447167 nats. The Gaussian KL is .5[(−.4)²+.7²−1−2ln(.7)]=.181674944 nats. Each row contributes to the mean objective C+λU; no batch-size-dependent sum is silently substituted.

For one row, the derivative of logistic cross-entropy with respect to its logit is g= sigmoid(ℓ)−y. The label path gives ∂CE/∂μ=ug and ∂CE/∂d=ug·σ·epsilon. The KL derivatives are μ and σ²−1, respectively. Thus the combined mean-gradient contributions before averaging are

$$
\begin{aligned}
g_\mu&=ug+\lambda\mu,\\
(g_a,g_b,g_c)&=(Sg_\mu,Ng_\mu,g_\mu),\\
g_d&=ug\sigma\epsilon+\lambda(\sigma^2-1),\\
(g_u,g_v)&=(gz,g).
\end{aligned}
$$

{{PROGRAM:gaussian_vib_step.py}}

The standard-library route evaluates stable softplus as max(ℓ,0)+log1p(exp(−|ℓ|)) and differentiates the same expression analytically. The Torch route uses CPU float64 tensors, `binary_cross_entropy_with_logits` with mean reduction, the analytic Gaussian KL, and `autograd.grad`. It does not apply sigmoid before the logits loss. All six gradients agree within the asserted tolerance on identical inputs and fixed noise.

The initial mean cross-entropy is .494159214, the mean KL .204174944, and their weighted objective .534994203 nats. The declared step produces .532473082 on that same fixed-noise batch. This is one bounded optimization calculation, not true MI, a converged learner or a generalization result. Intended stochastic training would draw fresh independent noise, average over data, and evaluate task performance, calibration and the declared surrogate on fresh held-out examples. The scalar-width calculation takes O(N) work for N rows; larger tensor widths introduce their own matrix costs.

A variational autoencoder reconstructs X under a generative model; this supervised bottleneck predicts Y. Similar Gaussian and KL operations can serve different objectives. A further distinction matters when the representation contains a sensitive attribute as well as task information.

[[M39]]

Exact population I(Z;A)=0 implies marginal independence from attribute A. It does not imply independence after another variable is known. Reuse XOR: if fair independent A,B produce Z=A XOR B, then Z is marginally independent of A, but knowing B and Z recovers A exactly. An estimated MI near zero is weaker still. An information-plane plot alone therefore does not establish fairness, privacy, causality, robustness or performance on a changed deployment law. Those questions require their own variables, threat or decision model, and evaluation.

## 8. Handle continuous values and measurement noise

The joint-versus-product definition extends beyond tables: I(X;Z)=D_KL(P_XZ‖P_XP_Z), with probability measures in place of finite masses. It remains nonnegative and can be infinite. To see what changes, draw a continuous joint distribution before trying to subtract entropy formulas.

[[M40]]

Let X and E be independent standard normals and let Z=X+σE for σ>0. The joint cloud has mean zero and covariance matrix [[1,1],[1,1+σ²]]. At a fixed X=x, its conditional slice in Z is normal with mean x and standard deviation sigma. The width is a standard deviation on the coordinate axis, not a probability mass or a variance drawn as a length. Narrower conditional slices make the observation more precise about X.

When joint densities exist and the required differential entropies are finite, one may write I(X;Z)=h(X)+h(Z)−h(X,Z), or h(Z)−h(Z|X). Differential entropy can be negative and depends on the coordinate units. Do not subtract undefined or infinite differential entropies. For jointly Gaussian scalars with correlation rho and |rho|<1, the finite result is−.5log(1−rho²) in the chosen log base.

For the additive-noise law, the observation variance is1+σ² and the conditional variance isσ². The noise enters a specific addition node; connect that operation to the information curve.

[[M41]]

Using h(N(0,v))=.5log₂(2πev), the shared constants cancel and give

$$
I(X;Z)=\tfrac12\log_2\left(1+\frac1{\sigma^2}\right).
$$

At sigma.5 this is .5log₂5=1.160964047 bits; at sigma1 it is .5 bit. Halving a standard deviation quarters its variance, which explains the squared scale. The investigation changes noise and coordinate scale separately. Small positive sigma still denotes a noisy, finite-information law; it must not be rounded into the exact zero-noise branch.

Now multiply the entire observation by10. Trace corresponding physical outcomes under the two coordinate rulers.

[[M42]]

The transformation Z′=10Z is invertible. Its density is stretched horizontally and scaled vertically by1/10 to preserve total probability. Both h(Z) and h(Z|X) increase by log₂10, so their finite difference stays unchanged. The covariance with X scales by10, and the observation variance by100. This is a change of units. Adding fresh noise or quantizing into bins instead changes the information-preserving relationship and cannot increase population MI under the processing assumption.

{{PROGRAM:continuous}}

The preserved numerical loop calculates the Gaussian determinant and repeats it after the coordinate transformation. Its equal results verify the declared positive-noise cases. The explanatory zero-noise sentence appears here in prose rather than being printed as if it were another measured numerical output. The loop is a closed-form Gaussian calculation, not a general continuous-data estimator.

At sigma0 the joint cloud collapses to an exact line. Compare that line with what the product of two continuous marginals assigns to it.

[[M43]]

The joint law places probability one on Z=X. Independent continuous draws put probability zero on that diagonal. The joint is therefore not absolutely continuous with respect to the product law, and its KL—and MI—is infinite. No finite-height bar represents this value. More generally, a deterministic output Z=f(X) with a nonatomic output law has infinite MI with X: exact real values preserve arbitrarily fine distinctions.

A deterministic finite-valued output is different. For the sign of standard-normal X, the zero event has probability zero and the two signs are equally likely. Its MI with X is the one-bit entropy of that sign. Thus a one-dimensional output can carry finite or infinite information depending on noise and precision. Any finite reported “MI of a deterministic neural layer” needs its quantization, injected noise, estimator or other measurement convention stated. A finite estimate does not refute the infinite exact-value conclusion.
