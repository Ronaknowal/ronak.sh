# Titans: a memory that learns while a sequence arrives

**Explore as you read.** Write a new association and watch how it changes a later query. Then follow the same tokens through attention and neural memory, compare two update schedules, and inspect when real rental observations become available for adaptation.


Imagine reading a long maintenance log. You need the last few entries to understand what is happening now, an impression of older recurring faults, and general knowledge about how maintenance reports are written. Keeping every entry immediately accessible costs space. Compressing everything into one small summary risks losing a detail you will need later.

Titans explores a combination: attention over recent context, a small neural network whose weights change as it processes the sequence, and learned vectors that carry information shared across sequences. The unusual part is the second one. Reading this memory means running a neural network. Writing to it means taking a gradient step on that network.

**What you will understand.** Follow one arrival through the recent rows, an addressed neural read and a parameter write. Then trace the same state through attention, an outer derivative, a real forecast and a chunk boundary. The first four sections build the mechanism; the visible deeper branches explain its training, resource costs and research alternatives.

**Before starting.** Know how a weighted sum, a gradient and attention’s query/key/value roles work. The worked arrays below make their shapes explicit. For a refresher, revisit [Backpropagation](/learn/path/full-curriculum/backpropagation?module=deep-learning-fundamentals) and [Attention](/learn/path/full-curriculum/attention-mechanisms?module=deep-learning-fundamentals); the preceding Jamba lesson provides the shared-state versus addressable-row comparison.

This is an architecture lesson, so a little neural-network background helps. A **weight** is a number used by a model; a **loss** measures an error; a **gradient** tells us how changing the weights changes that loss. A **query** asks for a representation, a **key** identifies an association, and a **value** is the representation associated with that key. We will make those roles concrete before using large tensors. The previous [Jamba lesson](/learn/path/full-curriculum/hybrid-ssm-transformer-architectures-jamba?module=deep-learning-fundamentals) combines attention and recurrence. Here, the recurrent state becomes the parameters of a learner.

## 1. Three places information can live

Where is an earlier observation available when a new one arrives? Read the storage drawing from top to bottom: cyan recent rows remain individually addressable; the amber parameter bank compresses earlier associations. A separate amber prefix begins with shared learned values. Violet marks computations throughout this lesson.

[Titans drawing places]

The recent-row grid names the last two sequence positions. The fast grid compresses earlier associations into shared numbers; its matching update state is S. The prefix has no incoming write from this request. These are three storage objects with different lifetimes, rather than three names for the same cache.

Think of a workbench, an adjustable prediction rule, and a shared instruction card. The workbench keeps recent items available; the rule changes with experience; the instruction card begins the same for each new job. The analogy describes roles. It does not establish that these components implement human memory or keep reliable copies of arbitrary facts.

| Component | What is stored? | What changes during one sequence? | How is it used? |
| --- | --- | --- | --- |
| Recent attention context | Representations of recent positions, often cached as projected keys and values | Positions enter and leave the permitted window | A query forms a weighted combination of accessible values |
| Contextual neural memory | Fast weights and their update state | Gradient-based writes change the weights and momentum | A query passes through the current memory network |
| Persistent memory | Learned input-independent vectors | Their shared parameter values stay fixed at inference | The core can attend to these prefix representations |

**Follow one sequence.** The six-entry strip has a bracket under its last two entries: the recent window. Earlier observations lead into a small weight grid. A separate prefix row enters from above with no incoming arrow from this session. When the seventh entry arrives, the bracket moves, the grid can change, and the prefix parameter row remains the same. These three paths show the different lifetimes of the stored information.

An attention cache also stores transformed representations, not a literal database of original text. Its advantage is that separate positions remain addressable inside its permitted context. Neural memory compresses associations into shared parameters: a later write can alter more than one earlier answer. Its storage can stay bounded while sequence length grows; its information capacity remains finite.

Persistent vectors are not the same as the initial fast weights. A memory can start from nonzero, learned or otherwise specified initial weights even when no persistent prefix is present. Removing the prefix therefore does not logically imply that the model starts with no useful prior. What a trained prefix learns must be assessed through the task, not inferred from its name.

## 2. Write a rule instead of appending a record

How can two weights remember an association? Read each opening circuit from top to bottom: multiply two pairs, add their products, then follow the residual and key into each backward product. The fixed opening calculation starts from zero; the controls replay the actual retained arrival history.

[Titans drawing association-first]

With key [1,0], only the first weight receives a nonzero gradient. The rate .5 moves its output halfway toward target 2. A read evaluates the current rule; a write changes that rule. The equations below name the operations already drawn.

Start with a memory that accepts a two-number key and returns one number:

\[
M_w(k)=w_1 k_1+w_2 k_2.
\]

The key might represent two features of an event. For the arithmetic example, the numbers are deliberately constructed. Our first desired association is key \((1,0)\) → value 2. Starting from \(w=(0,0)\), the memory answers 0. Define the residual as prediction minus desired value, so it is −2.

We use **half-squared error** throughout the calculations:

\[
\ell(w;k,v)=\tfrac12(M_w(k)-v)^2,
\qquad g=\nabla_w\ell=(M_w(k)-v)k.
\]

The one-half cancels the factor 2 when differentiating a square. The main Titans objective writes squared error without the half; its appendix uses the half convention. To obtain the same step when switching to the unhalved loss, halve the learning rate. Loss reduction and learning rate belong together.

Here \(g=(-2,0)\). A gradient step with rate \(\theta=0.5\) gives

\[
w_{\mathrm{new}}=w-\theta g=(0,0)-0.5(-2,0)=(1,0).
\]

Querying \((1,0)\) again now returns 1. One update moved the answer toward 2. It did not create a perfect database entry.

**The write direction.** The key arrow points along the first coordinate axis. Each key coordinate connects to the weight it changes. Beside the before/after grid, the answer marker moves from 0 to 1 on a ruler whose target is 2. The zero second coordinate explains why the second weight stays 0.

### The second write reveals interference

Will the second association alter an old answer? The current parameter bank feeds a proposed write using card 2. The two key controls change its direction; the target editor follows below.

[Titans drawing association-second]

Set the second key to [1,1] to compare a shared direction with the default perpendicular direction. The next figure queries both the current and proposed banks with the same query. Query edits never write to the bank.

[Titans drawing association-query]

Keep the same weights \((1,0)\), rate 0.5 and a new target 4. First use the key \((0,1)\). The prediction is 0, residual −4, gradient \((0,-4)\), and new weights \((1,2)\). The original query \((1,0)\) still returns 1.

Now restart from \((1,0)\) and use \((1,1)\) as the second key. The prediction is 1, residual −3, gradient \((-3,-3)\), and new weights \((2.5,1.5)\). The original query now returns 2.5. The new association changed an old answer because the keys share a direction in parameter space.

| Second key | New weights | Answer to original key | Interpretation |
| --- | --- | --- | --- |
| \((0,1)\) | \((1,2)\) | 1 | Orthogonal direction leaves this old read unchanged |
| \((1,1)\) | \((2.5,1.5)\) | 2.5 | Correlated direction changes the old read |

You can predict this without recalculating every weight. Let \(q\) be the old query and \(r=M_w(k)-v\) the new residual. For one linear update without decay or momentum,

\[
\Delta M(q)=-\theta r\,k^\top q.
\]

The change is governed by the overlap \(k^\top q\). This is the same old-read difference seen in the table, reached by an algebraic route. Orthogonal keys give zero overlap; other keys may reinforce or disrupt an old answer. In a nonlinear memory, local parameter sensitivities replace this simple key-overlap calculation.

**Investigation — which answer does the write disturb?** Change the key, value or write rate and watch the old query's output and its signed change update immediately. Change the second key's coordinates and target, then make the write. Watch the key arrow, weight cells and old-query answer together. Try a key perpendicular to your chosen query as a control case. Explain the sign using the residual and the dot product, then choose a different query that gives the opposite direction of change.

The core trace used simple keys. Now change either actual association’s coordinates without changing which arrival comes next. Every completed card ID remains in its original order and is replayed from the same zero initial bank.

[Titans drawing association-keys]

Change the targets separately: both belong to this same case, as do the query and rate above. Reset restores the original operands, one completed card 1 arrival and the next card 2 arrival.

[Titans drawing association-targets]

The next question is whether a large error necessarily makes a large parameter change.

## 3. Error, gradient, momentum and forgetting are different quantities

Which wires carry an error into a parameter? A zero key blocks both backward products, even with a residual of −10. A Jacobian records the corresponding output-to-parameter sensitivities in a more general memory.

[Titans drawing zero-key]

[Titans drawing sensitivity]

In the second drawing, the first output depends on a parameter and the second does not. Residual [1,0] produces gradient [1,0]. Residual [0,2] has four times the half-loss yet produces zero gradient. The matrix cells determine where the residual can travel; its magnitude alone does not.

With many output coordinates, write \(M_\phi(k)\in\mathbb R^{d_v}\), where \(\phi\) contains all memory weights. The residual is \(r=M_\phi(k)-v\). If \(J\) is the matrix of derivatives of the memory output with respect to its parameters, the half-squared-loss gradient is

\[
g=J^\top r.
\]

A large residual can produce a large gradient, but the parameter sensitivity matters. In our bias-free linear memory, the key \((0,0)\) gives zero gradient even if the target is 10 and the loss is 50: multiplying any weights by that key still gives 0. Changing those weights cannot fix this example. A bias or different key representation changes the situation.

The Titans paper motivates writes through “surprise.” For implementation, keep the following measurements separate: loss, parameter-gradient norm, momentum, actual parameter change and later task performance. None is a direct measurement of a fact's semantic importance. In particular, a factor 4 difference in squared loss implies a factor 2 difference in residual norm; it does not generally imply a factor 2 gradient norm, even for a fixed Jacobian, because residual directions can differ.

### Add a memory of recent updates

What should survive from the previous write? Keep old weight 1, old momentum .2 and today’s gradient −2 separate. Retaining half the momentum contributes +.1; today’s rate .1 contributes +.2; shrinking the old weight by .1 contributes −.1.

[Titans drawing signed-update]

The carried and fresh increments give S′=.3; shrinkage plus S′ gives Δw=.2 and w′=1.2. The segments share a zero and a unit scale, so adding their signed lengths agrees with adding their numbers.

Let \(S\) have the same shapes as the memory weights. One update is

\[
g_t=\nabla_{\phi}\ell(\phi_{t-1};k_t,v_t),\qquad
S_t=\eta_t S_{t-1}-\theta_t g_t,
\]
\[
\phi_t=(1-\alpha_t)\phi_{t-1}+S_t.
\]

Read the equations in this order: compute today's gradient at the old weights; retain a fraction of the previous update; add today's gradient step; shrink the old weights; add the resulting update. \(\theta_t\) controls the new gradient, \(\eta_t\) retains momentum, and \(\alpha_t\) controls direct shrinkage. Titans makes these quantities data-dependent through learned mappings. Fixed values in our calculations let us isolate the mechanism.

For one weight, take \(w=1\), old \(S=0.2\), \(g=-2\), rate 0.1, momentum retention 0.5 and decay 0.1. Then \(S'=0.5(0.2)-0.1(-2)=0.3\), and \(w'=0.9(1)+0.3=1.2\). The weight changed by 0.2, while the momentum is 0.3. Decay accounts for the difference.

**Add the actual vectors.** Separate arrows represent retained momentum, the new gradient step and weight shrinkage. Their signed sum is the change in the weight grid. Inspect the components separately before interpreting the combined change.

If the new gradient is zero, existing momentum can still move the weights. If \(\alpha=1\), the retained old-weight term vanishes, but \(S_t\) can remain nonzero. A full sequence reset therefore restores the specified initial weights and clears momentum, recent context, convolution history and position/chunk state. Setting one forget gate to 1 is not a complete reset.

With no writes and no momentum, repeated constant decay gives \(\phi_t=(1-\alpha)^t\phi_0\). For \(\alpha=0.01\), half the initial amplitude remains after about 68.97 steps. This is a decay calculation, not a measured lifetime for stored facts: continued writes and nonlinear readouts change actual recall.

Apply those operations to the actual associative history from §2. Its new gradient comes from the selected next card and current replayed W, rather than a fixed illustrative gradient.

[Titans drawing association-update]

The next inquiry appends that selected card ID or removes the last arrival. Try card 2 key [0,1] with target 0 after the default card 1 write: with retention .5 the new gradient is zero but S′=[.5,0] and W′=[1.5,0]. Setting decay 1 leaves W′=[.5,0], because carried momentum still enters.

[Titans drawing association-history]

The rate is global: setting it to 0 replays all these zero-initialized writes at rate 0, giving zero W and S. This edit does not preserve past states generated at a different rate. Repeated key [2,2] with target 5 and rate .5 can grow rapidly; twelve arrivals and their next preview remain readable without changing the key-axis scale.

[Titans drawing reset]

A full new request restores its configured initial parameters and clears the matching velocity, recent rows, convolution history, position and chunk anchor. This is a different operation from one shrinkage gate.

### When can a simple write diverge?

What happens when we repeatedly fit one fixed association? Start with residual 1. The four curves isolate a shrinking residual, alternating shrinkage, exact alternating boundary and growth; the growth panel explicitly uses a different vertical extent.

[Titans drawing fixed-factors]

Use the live rate trace to reach the unchanged, exact-fit, boundary and growing cases. Its signed values stay visible beside the curve.

[Titans drawing stability]

**Deeper branch.** For one fixed key in linear memory, with no momentum or decay, the residual after a step is

\[
r'=r(1-\theta\|k\|^2).
\]

Thus repeated updates reduce the residual magnitude when \(0<\theta\|k\|^2<2\). At 1, this particular association is fitted in one step. At 2, the residual alternates sign without shrinking. Above 2, its magnitude grows. This explains why key scale and learning rate must be considered together. It also explains why the zero-key example cannot improve.

A nonlinear network, changing keys and momentum add further dependencies. Decay is neither necessary for every stable sequence nor sufficient to rescue every unstable one. Monitor finite values, gradients and updates; inspect their cause before changing a rate. Clipping is an explicit modification to the update rule, with a specified norm and threshold, rather than a universal default supplied by the architecture's name.

## 4. Make the memory nonlinear

What if the desired key/value relationship cannot be represented by one weighted sum? The next memory contains every weight and bias of a two-input, three-hidden-unit, one-output network. Zero-weight connections are still part of its topology.

[Titans drawing nonlinear]

At key [1,1], the first preactivation is 1−1=0. SiLU(0)=0 and its derivative is .5. With target 1, the residual −1 gives output-bias gradient −1. The first hidden unit receives credit 2×(−1), then the SiLU derivative produces −1. Multiplying by each input gives the first W₁ row gradient [−1,−1]; its bias gradient is −1. The other units receive zero credit and W₂’s gradients are zero because the hidden activations were zero.

Rate .1 gives first W₁ row [1.1,−.9], first bias .1 and output bias .1. The new preactivation is .3, hidden activation .3 sigmoid(.3), and read .1+.6 sigmoid(.3)≈.44466551. The separate query [1,−1] reads 3.523188 before and 3.841793 after the same write. Target 0 or rate 0 gives no change in this fixture; a zero key alone would not necessarily block bias updates.

A two-layer memory can map a key through hidden features:

\[
M_\phi(k)=W_2\,\operatorname{SiLU}(W_1k+b_1)+b_2.
\]

Here \(W_1\) has shape \(H\times d_k\), \(b_1\) has \(H\) entries, \(W_2\) has shape \(d_v\times H\), and \(b_2\) has \(d_v\) entries. SiLU maps a scalar \(a\) to \(a\sigma(a)\), where \(\sigma\) is the logistic sigmoid. The intermediate \(H\)-vector contains nonlinear combinations of the key coordinates. We can still compute a residual, backpropagate it and update every parameter.

One straight affine rule faces a concrete contradiction at four corners.

[Titans drawing xor]

The diagram shows desired signs, not a fitted decision boundary.

Why add depth? A linear rule cannot express every relationship between keys and values. For example, a single affine function cannot map both \((1,1)\) and \((-1,-1)\) to 1 while mapping \((1,-1)\) and \((-1,1)\) to −1. Adding the two positive-case equations fixes twice the bias at 2; adding the negative-case equations fixes it at −2, a contradiction. Nonlinear hidden features can distinguish these patterns.

More expressive functions are useful, but there is no general law saying “H hidden units store H independent facts.” Capacity also depends on precision, key geometry, objectives, training and the tolerated retrieval error. Repeatedly rehearsing the same examples and processing each example once are different experiments.

### From the circuit to manual gradients

The scratch route keeps parameters ordered as(W₁,b₁,W₂,b₂). Its forward pass forms z, uses a stable sigmoid to form SiLU, and forms the output weighted sum. Its reverse pass multiplies the residual by W₂, then the SiLU derivative, and uses an outer product for W₁. Bias gradients sum over their contributing examples. For multiple output elements, the half-mean loss divides the residual by the output count; the scalar examples need no extra division.

The write computes matching S arrays and new parameters out of place, so another request’s arrays cannot be changed by an in-place write. The runnable fixture below is the actual hand calculation, including the changed negative target and query.


### Read and run memory_write_walkthrough.py

The following is the complete downloadable program. Run it beside its named imports; its displayed file and download contain the same source.

```python
"""Manual nonlinear associative-memory derivatives; NumPy primitives only."""
import numpy as np


def sigmoid(x):
    x = np.asarray(x, dtype=np.float64)
    result = np.empty_like(x)
    positive = x >= 0
    result[positive] = 1 / (1 + np.exp(-x[positive]))
    exponential = np.exp(x[~positive])
    result[~positive] = exponential / (1 + exponential)
    return result


def fixture():
    return (np.array([[1., -1.], [0., 0.], [0., 0.]]),
            np.zeros(3), np.array([[2., 0., 0.]]), np.zeros(1))


def forward(parameters, key):
    W1, b1, W2, b2 = parameters
    z = W1 @ key + b1
    sig = sigmoid(z)
    hidden = z * sig
    output = W2 @ hidden + b2
    if not np.isfinite(output).all():
        raise FloatingPointError('The first nonfinite forward result cannot be used for a write.')
    return output, (z, sig, hidden)


def loss_and_gradients(parameters, key, target):
    """One key, possibly several outputs; mean of half-squared residuals."""
    W1, b1, W2, b2 = parameters
    output, (z, sig, hidden) = forward(parameters, key)
    residual = output - np.asarray(target)
    output_credit = residual / residual.size
    hidden_credit = W2.T @ output_credit
    pre_credit = hidden_credit * sig * (1 + z * (1 - sig))
    gradients = (np.outer(pre_credit, key), pre_credit,
                 np.outer(output_credit, hidden), output_credit)
    return float(.5 * np.mean(residual**2)), gradients


def write(parameters, momentum, key, target, rate=.1, retention=0., decay=0.):
    loss, gradients = loss_and_gradients(parameters, key, target)
    next_momentum = tuple(retention*s-rate*g for s, g in zip(momentum, gradients))
    next_parameters = tuple((1-decay)*w+s for w, s in zip(parameters, next_momentum))
    if not all(np.isfinite(value).all() for value in (*next_parameters, *next_momentum)):
        raise FloatingPointError('The write produced nonfinite parameter or momentum state.')
    return next_parameters, next_momentum, loss, gradients


def linear_write(weight, momentum, key, target, rate=.5, retention=0., decay=0.):
    residual = weight @ key - target
    gradient = np.outer(np.atleast_1d(residual), key)
    next_momentum = retention*momentum-rate*gradient
    return (1-decay)*weight+next_momentum, next_momentum, gradient


if __name__ == '__main__':
    np.set_printoptions(precision=8, suppress=True)
    parameters = fixture()
    momentum = tuple(np.zeros_like(w) for w in parameters)
    key, target = np.array([1., 1.]), np.array([1.])
    updated, state, loss, gradients = write(parameters, momentum, key, target)
    print('prewrite loss:', loss)
    for name, gradient in zip(['W1', 'b1', 'W2', 'b2'], gradients):
        print(name, 'gradient:', gradient)
    print('read after write:', forward(updated, key)[0])
    query = np.array([1., -1.])
    print('other query before/after:', forward(parameters, query)[0], forward(updated, query)[0])
    changed, _, _, _ = write(parameters, momentum, key, np.array([-1.]))
    print('negative target read:', forward(changed, key)[0])
```


### The same write with ordinary modules

The library route uses ordinary nn.Linear and nn.SiLU modules, then supplies fast parameter dictionaries through torch.func.functional_call. The module parameters `0.weight`, `0.bias`, `2.weight` and `2.bias` map directly to the four manual arrays. autograd.grad returns their derivatives; the explicit update owns fast state. An ordinary optimizer can train slow shared parameters, while replacing a module’s global weights in place would mix up request ownership.

The program compares manual and library gradients at identical initial values, and actually takes one outer step on a scalar rate. Detaching produces identical forward values with an absent derivative. The scalar rate result at .25 is prediction 1.5/loss.125; slow step .01 raises the rate to .28 and lowers loss to .0512.


### Read and run titans_learning_routes.py

The following is the complete downloadable program. Run it beside its named imports; its displayed file and download contain the same source.

```python
"""Ordinary functional PyTorch routes for fast writes and slow rate learning."""
from collections import OrderedDict
import numpy as np
import torch
from torch import nn
from torch.func import functional_call
from memory_write_walkthrough import fixture, forward, write


def memory_module():
    return nn.Sequential(nn.Linear(2, 3), nn.SiLU(), nn.Linear(3, 1)).double()


def fast_fixture():
    names = ['0.weight', '0.bias', '2.weight', '2.bias']
    return OrderedDict((name, torch.tensor(value, dtype=torch.float64, requires_grad=True))
                       for name, value in zip(names, fixture()))


def functional_write(model, parameters, momentum, key, target,
                     rate=.1, retention=0., decay=0., differentiable=True):
    prediction = functional_call(model, parameters, (key,))
    loss = .5 * (prediction-target).square().mean()
    gradients = torch.autograd.grad(loss, tuple(parameters.values()),
                                    create_graph=differentiable)
    next_state = OrderedDict((name, retention*momentum[name]-rate*gradient)
                             for name, gradient in zip(parameters, gradients))
    updated = OrderedDict((name, (1-decay)*value+next_state[name])
                          for name, value in parameters.items())
    if not all(torch.isfinite(value).all() for value in (*updated.values(), *next_state.values())):
        raise FloatingPointError('The write produced nonfinite fast state.')
    if not differentiable:
        updated = OrderedDict((name, value.detach().requires_grad_()) for name, value in updated.items())
        next_state = OrderedDict((name, value.detach()) for name, value in next_state.items())
    return updated, next_state, loss, gradients


def learn_scalar_rate(rate=.25, outer_rate=.01, connected=True):
    theta = torch.tensor(rate, dtype=torch.float64, requires_grad=True)
    weight = torch.zeros((), dtype=torch.float64, requires_grad=True)
    inner = .5 * (2*weight-1).square()
    gradient, = torch.autograd.grad(inner, weight, create_graph=True)
    updated = weight-theta*gradient
    if not connected:
        updated = updated.detach().requires_grad_()
    prediction = 3*updated
    outer = .5 * (prediction-2).square()
    derivative, = torch.autograd.grad(outer, theta, allow_unused=True)
    next_rate = None if derivative is None else theta-outer_rate*derivative
    return {'weight': float(updated.detach()), 'prediction': float(prediction.detach()),
            'loss': float(outer.detach()),
            'derivative': None if derivative is None else float(derivative),
            'next_rate': None if next_rate is None else float(next_rate.detach()),
            'next_loss': None if next_rate is None else float(.5*(6*next_rate.detach()-2).square())}


if __name__ == '__main__':
    model = memory_module()
    parameters = fast_fixture()
    momentum = OrderedDict((name, torch.zeros_like(value)) for name, value in parameters.items())
    key = torch.tensor([1., 1.], dtype=torch.float64)
    target = torch.tensor([1.], dtype=torch.float64)
    updated, state, loss, gradients = functional_write(model, parameters, momentum, key, target)
    manual, _, _, manual_gradients = write(fixture(), tuple(np.zeros_like(w) for w in fixture()),
                                         key.numpy(), target.numpy())
    print('manual/functional read:', forward(manual, key.numpy())[0],
          functional_call(model, updated, (key,)).detach().numpy())
    print('gradient maximum difference:', max(np.max(np.abs(a-b.detach().numpy()))
                                              for a, b in zip(manual_gradients, gradients)))
    print('connected rate:', learn_scalar_rate())
    print('detached rate:', learn_scalar_rate(connected=False))
```


### A complete memory cell you can inspect

The supplied [neural_memory.py](neural_memory.py) contains the forward function, initialization, parameter copying and this update. It uses a scalar value per key; a batch averages the half-squared scalar losses. Each request owns its parameter and momentum tuples. The update returns new tensors instead of silently changing a shared global model.

```python
import torch
from neural_memory import initialize_memory, read_memory, write_memory

parameters = initialize_memory(seed=3, input_size=2, hidden_size=3)
momentum = tuple(torch.zeros_like(weight) for weight in parameters)
key = torch.tensor([1.0, -0.5], dtype=torch.float64)
value = torch.tensor(0.8, dtype=torch.float64)

parameters, momentum, loss, gradients = write_memory(
    parameters, momentum, key, value,
    rate=0.1, retention=0.0, decay=0.0,
    differentiable=True,
)
query = torch.tensor([-0.25, 0.75], dtype=torch.float64)
retrieved = read_memory(parameters, query)
```

The query differs from the write key. This matters: making the training association easier does not mean every possible query becomes more useful. The next section gives attention another path to the information it needs; § 6 explains why the outer task trains the system to make the paths useful together.

The original functional tuple route below owns the saved rental-model format. It remains a complete ordinary PyTorch implementation, alongside the manual and module routes above.


### Read and run neural_memory.py

The following is the complete downloadable program. Run it beside its named imports; its displayed file and download contain the same source.

```python
"""Inspectable fast weights; no global mutable model or request state."""
import torch
from torch.nn import functional as F


def read_memory(parameters, key):
    input_weight, input_bias, output_weight, output_bias = parameters
    hidden = F.silu(key @ input_weight.T + input_bias)
    return (hidden @ output_weight.T + output_bias).squeeze(-1)


def write_memory(parameters, momentum, key, value, rate, retention,
                 decay, differentiable=False):
    loss = 0.5 * (read_memory(parameters, key) - value).square().mean()
    gradients = torch.autograd.grad(loss, parameters, create_graph=differentiable)
    next_momentum = tuple(retention * old - rate * gradient
                          for old, gradient in zip(momentum, gradients))
    next_parameters = tuple((1 - decay) * weight + change
                            for weight, change in zip(parameters, next_momentum))
    if not differentiable:
        next_parameters = tuple(weight.detach().requires_grad_()
                                for weight in next_parameters)
        next_momentum = tuple(change.detach() for change in next_momentum)
    return next_parameters, next_momentum, loss, gradients


def initialize_memory(seed, input_size=9, hidden_size=8):
    torch.manual_seed(seed)
    model = torch.nn.Sequential(torch.nn.Linear(input_size, hidden_size),
                                torch.nn.SiLU(), torch.nn.Linear(hidden_size, 1))
    return tuple(model.double().parameters())


def copy_parameters(parameters):
    return tuple(weight.detach().clone().requires_grad_() for weight in parameters)
```


We can now ask where the write key, value and later query come from.

## 5. Connect memory to attention

Which features does each branch receive, and in what order? Follow three separate projected histories into channel-specific causal filters. Each branch owns its own kernel; the equal numeric kernel fixtures here isolate the order. These operations are linear with identity activation in this illustration.

[Titans drawing projection]

Rows are time positions, oldest first; columns are projected channels. At the newest row, the query products sum to [.75,1], with norm 1.25; dividing both coordinates gives [.6,.8]. The key sums to [2,0], giving unit key [1,0]. The value sums to [1.5,.5] and does not receive q/k unit normalization. With local(out,in) matrices, projecting row vectors is XWᵀ.

The mixing Wk and unequal channel taps expose why order matters: filtering the raw channels first gives [.75,.5], then Wk gives [1.25,.25], a different construction from the paper’s [2,0]. If every channel uses equal scalar taps [.25,.25,.5], these linear operations commute; that special null does not establish equivalence for learned unequal channel filters. Paper§4.4 also specifies SiLU, residual and output gates. This operand fixture and the identity-projection tiny MAG below are separate from a reproduced trained paper block.

[Titans drawing junctions]

MAC adds retrieved rows to attention; MAG keeps two lanes until coordinate multiplication; MAL feeds the memory’s transformed rows into attention. The receiver mask and exact state version belong to each route.

Titans describes three wiring choices. The distinction is where a memory read enters the computation, not a fixed mapping from task names to a universally best variant. The paper's equations omit some residual and normalization detail, so these diagrams describe their main data paths.

In a full model, the input representation \(x_t\in\mathbb R^{d_{in}}\) supplies learned views. With our column-vector convention, \(k_t=W_Kx_t\), \(v_t=W_Vx_t\), and \(q_t=W_Qx_t\). The projection shapes are \(d_k\times d_{in}\), \(d_v\times d_{in}\), and \(d_k\times d_{in}\), respectively. The write learns to associate the key view with the value view; the query view chooses what to read. The projection weights belong to the outer training loop, while the contextual memory changes within a sequence. Input-conditioned rate and retention mappings can also learn which updates are useful.

The paper's fuller blocks use residual connections, normalized queries/keys, nonlinear projections and short depthwise convolutions. A causal convolution mixes a channel's recent positions with learned coefficients, giving a key some local history before the memory sees it. That history is another piece of sequence state to carry across a boundary. Normalizing a nonzero key controls its length, which connects directly to the key-scale effect derived in § 3. Our unnormalized linear investigation keeps the zero key valid so you can inspect that boundary explicitly.

| Variant | Main path | What attention receives |
| --- | --- | --- |
| Memory as Context, MAC | Read historical memory for a segment → append retrieved context and persistent prefix → attention → update memory from the resulting representation → gated output | The segment plus retrieved historical representations and persistent prefix |
| Memory as Gate, MAG | Persistent prefix and sequence feed a local attention branch and a neural-memory branch → combine their outputs through a nonlinear gate | Prefix and accessible recent input representations |
| Memory as Layer, MAL | Prefix and input → memory layer → attention layer | The memory layer's transformed sequence |

**Three different junctions.** MAC supplies extra rows to attention. MAG has two parallel lanes meeting at a gate. MAL has two blocks in series, memory first. In each, the state arrow crosses to the next segment or position. Follow where the read enters: attention input, a parallel output junction, or an earlier layer.

In MAC, current input queries the historical state before the segment update. The attention result then supplies information for writing. In the paper's schematic, the final output also uses a read from the updated memory. A write followed by a read is consequently not automatically a causality error. The question is which observations were available to produce that write.

For autoregressive prediction at position t, every dependency must originate in tokens already observed at that position. A retrieved vector depends on its query as well as on the old memory. Moving vectors queried by future tokens into an apparently “historical” prefix does not make them safe. Similarly, masking attention cannot repair a memory read that already includes a future write. A faithful implementation must spell out segment retrieval, token availability and prefix masks, then verify that changing a future token leaves earlier outputs unchanged. Treat the paper's segment-level notation as a design description, not a complete indexing specification.

An old parameter bank does not make a future query available. The following invalid retrieval-prefix construction changes an earlier answer when only a future query changes; its token mask cannot repair that path.

[Titans drawing causal]

For receiver q₁ = 1, the old memory M(q) = q and values/scores [1, 3, 1] give 2.573972. Changing only the future query to −3 gives .963701. A proper prefix must restrict retrieved query rows as well as token rows.

### Walk a small gated block all the way through

How do the two actual computations meet at one output? Select any stream position and change its input coordinates. The drawing shows each permitted attention score, softmax denominator, weighted-value sum, written matrix read and corresponding gate product.

[Titans drawing gated-token]

Our executable example specializes the MAG topology so every number is inspectable. Inputs are two-vectors. Query, key and value projections are identities. Local attention includes the current token and one previous token, plus an optional persistent vector \(p=(1,0)\). The fast memory is a two-by-two linear matrix, initially zero, with rate 0.5, momentum retention 0.5 and no decay. It writes the observed association \(x_t\to x_t\), then reads at query \(x_t\). Finally,

\[
o_t=a_t\odot\tanh(m_t),
\]

where \(a_t\) is the attention result, \(m_t\) the memory read, and \(\odot\) multiplies corresponding coordinates. This gate can attenuate or reverse a coordinate; it is not a convex probability mixture. These are declared teaching choices, not claimed trained-model defaults. We omit residuals, learned projections, convolution and additional normalization here so the three paths remain visible.

At the first token \((1,0)\), the prefix and current token are identical. Attention returns \((1,0)\). The write sets the first diagonal memory weight to 0.5, so the read is \((0.5,0)\). Output: \((\tanh(0.5),0)\approx(0.462117,0)\).

At the second token \((0,1)\), attention sees \((1,0),(1,0),(0,1)\). Dot each row with the query and divide by the square root of its dimension, giving scores \((0,0,1/\sqrt2)\). Softmax exponentiates the scores and divides by their sum: the resulting weights are approximately \((0.248255,0.248255,0.503490)\). Their weighted sum of the three rows gives \(a=(0.496510,0.503490)\). The memory becomes

\[
W=\begin{bmatrix}0.75&0\\0&0.5\end{bmatrix}.
\]

The first diagonal changed from 0.5 to 0.75 because of retained momentum, even though the new key points along the second axis. The new memory read is \((0,0.5)\), and the output is approximately \((0,0.232671)\).

Remove the prefix, replaying from the same initial state. At the second token the memory is unchanged, but attention has only two rows. Its second coordinate is now 0.669762, and the gated output's second coordinate becomes 0.309508. This intervention reveals the prefix's route through attention. At the first token, removing that duplicate prefix leaves the output unchanged: a useful control case.

Change the prefix or turn all writes off while preserving the edited tokens. With the zero initial bank and zero rate, the memory read and tanh gate are zero, so the product output is zero; removing the prefix alone changes attention without changing the fast write.

[Titans drawing gated-flags]

Extend the same stream to eight positions or reverse only its final token. Earlier outputs should remain unchanged by the latter edit because they did not receive it. Every position remains independently editable above.

[Titans drawing gated-extent]

The boundary must carry W, S and actual recent rows. In the carried mode, all legal splits reproduce the whole call; a fresh suffix changes the state available to its first query. Request B owns a separate tuple.

[Titans drawing gated-continuity]

**Investigation — what belongs to one request?** Edit a token, record which earlier outputs should stay fixed, and replay the two lanes. Continue a sequence across a saved boundary, then compare with a fresh sequence that starts at the same suffix. Finally, run a separate request and verify that it cannot change the fresh request's result. Track fast weights, momentum and the two-token window together. The supplied [memory_mechanisms.py](memory_mechanisms.py) implements the complete specialization, and [mechanism-results.json](mechanism-results.json) retains its actual arrays.

The complete native program uses these same residuals, matrices, masks and state tuples, then separately compares nonlinear rate derivatives and chunk schedules. Follow each function’s named operands rather than treating its final arrays as an unexplained result.


### Read and run memory_mechanisms.py

The following is the complete downloadable program. Run it beside its named imports; its displayed file and download contain the same source.

```python
"""Small exact mechanisms and a declared MAG-topology teaching specialization."""
import json
from pathlib import Path
import numpy as np
import torch
from neural_memory import initialize_memory, read_memory, write_memory


def linear_write(weight, momentum, key, value, rate=0.5, retention=0.0, decay=0.0):
    residual = weight @ key - value
    gradient = np.outer(residual, key)
    next_momentum = retention * momentum - rate * gradient
    return (1-decay) * weight + next_momentum, next_momentum, gradient


def associative_trace(keys, values, rate=0.5, retention=0.0, decay=0.0):
    weight = np.zeros((len(values[0]), len(keys[0])))
    momentum = np.zeros_like(weight)
    records = []
    for key, value in zip(np.array(keys), np.array(values)):
        residual = weight @ key - value
        new_weight, new_momentum, gradient = linear_write(
            weight, momentum, key, value, rate, retention, decay)
        records.append({'key': key.tolist(), 'value': value.tolist(),
            'before': weight.tolist(), 'loss': float(0.5 * residual @ residual),
            'gradient': gradient.tolist(), 'momentum': new_momentum.tolist(),
            'after': new_weight.tolist(), 'read_first': (new_weight @ keys[0]).tolist()})
        weight, momentum = new_weight, new_momentum
    return records


def gated_sequence(tokens, prefix=True, rate=0.5, state=None):
    # Identity Q/K/V; two-token causal window, including current observed token.
    weight, momentum, recent = ((np.zeros((2, 2)), np.zeros((2, 2)), [])
                               if state is None else (state[0].copy(), state[1].copy(),
                                                      [value.copy() for value in state[2]]))
    records = []
    for token in np.array(tokens, dtype=float):
        recent = (recent + [token])[-2:]
        context = np.array(([np.array([1.0, 0.0])] if prefix else []) + recent)
        logits = context @ token / np.sqrt(2)
        probabilities = np.exp(logits - logits.max())
        probabilities /= probabilities.sum()
        short = probabilities @ context
        weight, momentum, _ = linear_write(weight, momentum, token, token, rate, 0.5, 0.0)
        long = weight @ token
        output = short * np.tanh(long)
        records.append({'input': token.tolist(), 'context': context.tolist(),
            'attention': probabilities.tolist(), 'short': short.tolist(),
            'weight': weight.tolist(), 'momentum': momentum.tolist(),
            'long': long.tolist(), 'output': output.tolist()})
    return records, (weight, momentum, recent)


def chunk_trace(anchor=False, chunk_size=2, rate=0.5):
    weight = 0.0
    anchor_weight = 0.0
    records = []
    for index, target in enumerate([1.0, 2.0]):
        if index % chunk_size == 0:
            anchor_weight = weight
        gradient = (anchor_weight if anchor else weight) - target
        weight -= rate * gradient
        records.append({'gradient': gradient, 'weight': weight})
    return records


def scalar_outer(rate_value=0.25):
    rate = torch.tensor(rate_value, dtype=torch.float64, requires_grad=True)
    weight = torch.tensor(0.0, dtype=torch.float64, requires_grad=True)
    inner_loss = 0.5 * (weight * 2 - 1).square()
    gradient, = torch.autograd.grad(inner_loss, weight, create_graph=True)
    next_weight = weight - rate * gradient
    outer_loss = 0.5 * (next_weight * 3 - 2).square()
    derivative, = torch.autograd.grad(outer_loss, rate)
    return {'weight': float(next_weight.detach()), 'prediction': float((next_weight*3).detach()),
            'loss': float(outer_loss.detach()), 'derivative': float(derivative)}


def nonlinear_outer(rate_value, derivative=False):
    weights = initialize_memory(3, input_size=2, hidden_size=3)
    state = tuple(torch.zeros_like(weight) for weight in weights)
    rate = torch.tensor(rate_value, dtype=torch.float64, requires_grad=True)
    key = torch.tensor([1.0, -0.5], dtype=torch.float64)
    target = torch.tensor(0.8, dtype=torch.float64)
    new_weights, _, _, _ = write_memory(weights, state, key, target, rate, 0.0, 0.0, True)
    query = torch.tensor([-0.25, 0.75], dtype=torch.float64)
    loss = 0.5 * (read_memory(new_weights, query) + 0.3).square()
    if derivative:
        gradient, = torch.autograd.grad(loss, rate)
        return float(loss.detach()), float(gradient)
    return float(loss.detach())


def calculations():
    orthogonal = associative_trace([[1, 0], [0, 1]], [[2], [4]])
    correlated = associative_trace([[1, 0], [1, 1]], [[2], [4]])
    loss, gradient = nonlinear_outer(0.1, True)
    epsilon = 1e-6
    finite_difference = (nonlinear_outer(0.1+epsilon) - nonlinear_outer(0.1-epsilon)) / (2*epsilon)
    tokens = [[1, 0], [0, 1], [1, 1], [1, -1]]
    full, final = gated_sequence(tokens)
    prefixless, _ = gated_sequence(tokens, prefix=False)
    disabled, _ = gated_sequence(tokens, rate=0.0)
    first, checkpoint = gated_sequence(tokens[:2])
    rest, _ = gated_sequence(tokens[2:], state=checkpoint)
    fresh, _ = gated_sequence(tokens[2:])
    perturbed, _ = gated_sequence(tokens[:3] + [[-2, 1]])
    state_parameter_count = 2*2048*512  # Bias-free two-layer memory, d -> H -> d.
    result = {'orthogonal': orthogonal, 'correlated': correlated,
        'sequential': chunk_trace(), 'anchor': chunk_trace(True),
        'anchor_size_one': chunk_trace(True, 1), 'scalar_outer': scalar_outer(),
        'nonlinear_outer': {'loss': loss, 'autograd': gradient, 'finite_difference': finite_difference},
        'gated': full, 'prefixless': prefixless, 'writes_disabled': disabled,
        'continuation': first + rest, 'fresh_tail': fresh, 'future_changed': perturbed,
        'memory_bytes': {'parameters_per_layer': state_parameter_count,
            'fast_weights_plus_momentum_fp32_per_layer': 2*state_parameter_count*4,
            'layers_24_batch_4_GiB': 24*4*2*state_parameter_count*4/2**30,
            'window_2048_layers_24_batch_4_kv_heads_8_head_dim_128_fp16_GiB':
                2*4*24*2048*8*128*2/2**30,
            'full_131072_layers_24_batch_4_kv_heads_8_head_dim_128_fp16_GiB':
                2*4*24*131072*8*128*2/2**30},
        'decay_half_life_steps_alpha_001': float(np.log(0.5)/np.log(0.99)),
        'momentum_reversal_steps_eta_09': int(np.floor(np.log(0.5)/np.log(0.9)) + 1)}
    (Path(__file__).resolve().parent / 'mechanism-results.json').write_text(
        json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: result[key] for key in ['scalar_outer', 'nonlinear_outer', 'memory_bytes']}, indent=2))
    return result


if __name__ == '__main__':
    calculations()
```


## 6. Two learning loops, with two different jobs

Can the final task teach the model how strongly to write? The amber rate controls a fast parameter update, which changes a later query and its outer task loss. The reverse arrow must traverse that dependency.

[Titans drawing outer-scalar]

The inner association has k = 2 and v = 1; the later query is q = 3 with task target 2. Keeping the differentiable write makes its rate path available. Detaching makes the same fast value a new leaf, so no reverse path reaches θ through it. These are different graph contracts with identical forward values.

**Deeper branch.** The inner loop writes associations into fast weights for the current sequence. The outer loop learns the projections, gates, initial conditions and other model parameters that make those writes useful for the final task. A language-model outer objective can still be next-token cross-entropy. The inner target is a learned representation derived from available input, not the withheld answer token that the model is supposed to predict.

**A gradient through a gradient.** Follow old fast weights → inner gradient → new fast weights → query output → outer task loss along the time axis. Slow parameters feed the key, value and rate from above. The outer-gradient arrow travels backward through this whole path. In the inference view, slow parameters stay fixed while new fast-weight states continue to be created.

You can understand this with one scalar. Let the initial weight be 0. Write key 2 → value 1 with a learnable rate \(\theta\). The inner gradient is −2, so \(w'=2\theta\). Query at 3 and compare to outer target 2:

\[
\hat y=6\theta,\qquad L_{\text{outer}}=\tfrac12(6\theta-2)^2,
\qquad \frac{dL_{\text{outer}}}{d\theta}=6(6\theta-2).
\]

At \(\theta=0.25\), the new weight is 0.5, prediction 1.5, outer loss 0.125 and outer derivative −3. Gradient descent on the rate would increase it locally, making this subsequent query more accurate. The outer objective has taught something about how to write.

For a general parameter \(\psi\), differentiation through \(\phi'=\phi-\theta\nabla_\phi\ell(\phi;\psi)\) involves how the inner gradient changes with \(\psi\). With many steps it also includes how previous fast weights affect later writes. Automatic differentiation can evaluate these paths without materializing a dense Hessian. The [TTT paper's inner/outer discussion](https://arxiv.org/html/2407.04620v1#S2.SS2) is a useful companion.

In PyTorch, `autograd.grad(..., create_graph=True)` retains a graph for differentiating the computed gradient. For the nonlinear example in § 4, use outer target −0.3 at its query and half-squared outer loss. The resulting outer rate derivative agrees with a centered finite difference: −0.00249327930752 versus −0.00249327930749 at rate 0.1. That is the same differentiation idea as the hand scalar calculation, now through a SiLU network with a different query.

The next live view retains the original seed 3 nonlinear fixture: input [1,−.5]→.8, query [−.25,.75] and outer target −.3. Its separate rate controls the same complete numerical function in both graph modes.

[Titans drawing outer-nonlinear]

A centered finite difference rebuilds the original parameter tuple at each rate; it measures function sensitivity even when a particular detached graph has no rate path. The derivative agreement below belongs to this small fixture, not to training quality.

At inference we only need the current inner write, not an outer derivative through the entire session. The memory cell's ordinary mode detaches the new weights and momentum after each write, then enables gradients on the new weights for the next local write. Detachment at this point bounds retained autograd history. Using that mode during purported full outer training would remove paths from the objective and change what is being optimized.

`eval()` concerns module behavior such as dropout; it is separate from disabling automatic differentiation. A surrounding `no_grad()` would prevent the inner loss from recording the reverse-mode computation required for a write. Keep gradient recording active for that computation, even while avoiding a session-long outer graph. The [PyTorch gradient API](https://docs.pytorch.org/docs/2.14/generated/torch.autograd.grad.html) and [no_grad semantics](https://docs.pytorch.org/docs/2.14/generated/torch.no_grad.html) document the distinction.

## 7. A real stream: forecasting daily bike rentals

Which numbers actually reach this memory? Begin at the first 2012 forecast. The seven cyan arrived counts each use the mean and population standard deviation fitted only to 2011 counts. Concatenate them with the known weekday sine/cosine, then divide all nine coordinates by their vector norm.

[Titans drawing rental-seed]

Statistical standardization and unit-vector normalization are distinct operations. Weekday sine/cosine contribute squared length 1, so the whole-vector norm is nonzero. This nine-vector is the actual saved network input; it is separate from the query/key branch normalization in §5.

[Titans drawing rental-network]

The eight hidden rows multiply all nine coordinates, add their biases and apply SiLU. The output row combines the eight activations, adds b₂, then returns to rental units with prediction_z×σ2011+μ2011. For seed 3’s first 2012 key, the saved frozen/adaptive starting network produces 2609.616401 rentals. The later observed count 2294 has not yet entered that forecast.

The logbook question becomes concrete with [UCI's Bike Sharing dataset](https://archive.ics.uci.edu/dataset/275/bike+sharing+dataset): 731 daily totals from Washington, DC's Capital Bikeshare system in 2011–2012. Hadi Fanaee-T supplied this dataset for studying rentals and their relation to conditions and events. We use the daily observations, not the larger hourly file. The retained [CSV](bike-sharing-daily.csv), [provider description](source-description.txt) and [provenance](data-provenance.md) make the exercise usable offline; UCI licenses the data under CC BY 4.0.

Our question is: **after training a small prediction rule on 2011, does allowing it to update after each newly observed day improve its 2012 forecasts?** This isolates online neural adaptation on a real stream. The experiment uses observed count targets after they arrive, rather than Titans' learned latent self-supervised targets. It trains an ordinary initial predictor rather than a complete end-to-end Titans language model. The three-branch computation and outer-learning mechanism were exposed separately above so you can identify exactly which part this study exercises.

[Titans drawing rental-timeline]

A target count receives statistical standardization only after it arrives, for the write loss. It is not included in its own nine-coordinate key. Changing an arrival affects later input histories and fast parameters.

[Titans drawing rental-arrival]

The next inspection follows the same edit through any chosen date and the continuous fast state. Choosing another saved seed preserves the edit and inspected date; choosing another arrival date restores that date’s source observation.

[Titans drawing rental-inspect]

### Specify when a number becomes available

Assume a day's total is available at that day's end. Before tomorrow arrives, use the preceding seven totals and the weekday of the day being forecast. No future weather observations or components of tomorrow's total enter the input.

**Predict, observe, write.** At the boundary between two dates, seven already observed counts enter a key. The forecast is recorded before the target is revealed. When that target arrives, a separate downward arrow leads into the loss and weight update. The updated state feeds the following date. A reporting-window boundary changes the chart label, not the information-availability rule.

The count mean and population standard deviation are fitted on 2011 only: approximately 3405.762 and 1376.864. Standardize counts using those constants. A key contains seven past standardized counts, followed by sine and cosine of the target weekday; normalize the resulting nine-vector to unit length. The memory has shape 9→8→1 with SiLU and biases. Its output is a standardized count, transformed back to rentals for scoring. This preprocessing is a declared compact teaching representation, not a claim that it is an optimal forecasting feature set.

Fit 358 examples from 2011: the first seven days supply history and targets begin on day 8. Use full-batch Adam with rate 0.01 for 1000 updates. Repeat seeds 3, 7, 19 to show initialization variation. Make two copies of each fitted model: one stays frozen, while the other uses rate 0.005, momentum retention 0.5 and decay 0.0001 after each observed 2012 target. Those choices, the seeds and the simple baselines were fixed in the [experiment protocol](experiment-protocol.md) before running this comparison.

Record a forecast first. Observe the day's target second. Update the adaptive model third. Report the first 183 forecasts as a development window and the following 183 as assessment. No settings were selected from either report, and the adaptive state carries forward across their boundary. The first window ends on 1 July 2012 because 2012 is a leap year; the assessment begins on 2 July.

### One actual forecast and write

For seed 3, both copies forecast 2609.616 rentals for 1 January 2012. They agree because adaptation has not yet made a write. The observed total is 2294, so the count error is 315.616. Dividing by the fitted scale gives the standardized residual; its half-square is 0.02627285. The gradient norm is 0.67017273 and the parameter-change norm is 0.00352720. Those last two are measured in parameter space, not rentals.

For 2 July 2012, the frozen copy forecasts 4707.926 and the adaptive copy 5944.152. The actual count is 6227. The adaptive model has incorporated earlier 2012 outcomes. This is the same state-carrying principle as the continued gated sequence in § 5, now applied to dated observations and measured forecast error.

### Run and inspect the full experiment

Save the supplied files together. Python, NumPy and PyTorch are required. The recorded run used Python 3.12.14, NumPy 2.3.5 and PyTorch 2.14.0+cpu, float64 with one CPU thread. These are tested versions, not a requirement to install the latest release.

```sh
python -B memory_mechanisms.py
python -B rental_memory_study.py
python -B check_author_packet.py
```

The complete [study program](rental_memory_study.py) includes data loading, feature construction, fitting, replay, scoring and result export. Its central replay operation follows the three moments above:

```python
prediction = float(read_memory(weights, key).detach())
next_weights, next_momentum, loss, gradients = write_memory(
    weights, momentum, key, observed_value,
    rate=0.005, retention=0.5, decay=0.0001,
)
weights, momentum = next_weights, next_momentum
```

Here `observed_value` is supplied only after saving `prediction`. The complete program retains every date, forecast, residual, gradient norm and update norm in [rental-results.json](rental-results.json), along with initial/final weights and environment identity. The short excerpt shows the timing; use the full linked program to run it.

Mean absolute error, or **MAE**, averages the absolute difference between forecast and observation. Its units here are rentals per day. **RMSE** is the square root of the mean squared error; squaring gives large misses more influence. The complete result table retains both. For a readable first comparison, here is MAE, rounded to two decimals:

| Procedure | Development: 1 Jan–1 Jul | Assessment: 2 Jul–31 Dec |
| --- | ---: | ---: |
| Previous day's count | 896.54 | 843.81 |
| Count seven days earlier | 1092.26 | 1128.53 |
| Frozen network, seed 3 | 1334.04 | 1767.05 |
| Adaptive network, seed 3 | 925.34 | 823.54 |
| Frozen network, seed 7 | 1342.21 | 1781.81 |
| Adaptive network, seed 7 | 1007.78 | 867.34 |
| Frozen network, seed 19 | 1392.46 | 1813.87 |
| Adaptive network, seed 19 | 875.92 | 805.50 |

All three adaptive copies improve over their matched frozen networks. Yet the simple previous-day baseline beats two adaptive runs in development and one in assessment. The practical conclusion is to keep that baseline in the comparison. The extra computation provides an observed benefit over freezing this predictor, but initialization and the comparator affect whether the added complexity is useful.

The measured outcomes use one zero-to 2000 rental axis and include every retained frozen/adaptive seed and both baselines. Their complete MAE/RMSE values follow the drawing.

[Titans drawing rental-metrics]

Seed 7’s adaptive assessment error remains above the previous-day baseline. Seed variation is initialization sensitivity, not a confidence interval over new samples. The hypothetical arrival edit changes a causal sensitivity trace; it does not change these recorded original-history benchmark scores.

Try inspecting a date with a large error and its following write. A high error could reflect a poor representation, a real change, or an unusual event. The count alone cannot tell you which explanation caused it. State an additional measurement you would need before declaring that the model has detected a particular event.

### A one-line timing error can manufacture perfect performance

What exactly are we scoring? The two reads below lie on opposite sides of the target’s arrival and write.

[Titans drawing score-timing]

For a constructed scalar memory, let \(w=0\), key 1, observed target 4 and rate 1, with no momentum or decay. The forecast before observing the target is 0, an error of −4. After writing, the weight becomes 4. Evaluating against the same target at that point gives zero error. That measures fitting an already revealed target, not forecasting it.

Perturbing a later daily count leaves earlier forecasts unchanged under the dependency rule. The first affected forecast comes after the changed count becomes available. This is a direct check of the dependency rule, rather than trusting a label such as “causal” or “test set.”

### Build the write rule, then choose what stays differentiable

[memory_mechanisms.py](memory_mechanisms.py) owns the explicit linear residual/outer-product gradient, momentum and decay in `linear_write`, plus the small complete gated memory/attention composition in `gated_sequence`. [neural_memory.py](neural_memory.py) is the ordinary research implementation for a nonlinear memory: `read_memory` evaluates its two-layer network from explicit parameter tensors and `write_memory` obtains the write-loss derivatives with `torch.autograd.grad`. It returns new parameter and momentum tuples rather than silently mutating a globally shared model. Autograd is the reused derivative engine; the new mechanism is the loss-driven persistent memory update.

The `differentiable` switch is a learning decision. With `True`, `create_graph=True` retains the derivative graph through a write so an outer objective can learn a write rate or initializer. With `False`, the newly returned state is detached and made a new leaf for the next write; this bounds the retained history during ordinary online replay but removes earlier-write meta-gradients. `rental_memory_study.py::replay` chooses that causal online path, preserving the forecast-before-observation timeline. Both paths implement complete writes; they optimize different derivative contracts.

No one-call Titans package is necessary for this route. Standard tensors, functional layer evaluation, autograd and the explicit state tuple are ordinary tools for research on changing fast weights. The linear update's outer product costs O(d_key d_value), and a nonlinear write costs a memory-network forward/backward plus parameter-sized momentum/state. Differentiating through many writes also retains their graphs; constant-sized *carried values* do not imply constant training-memory cost.

**Take control.** In `memory_mechanisms.py::nonlinear_outer`, compare the derivative of the outer loss with respect to the write rate using central differences and `write_memory(..., differentiable=True)`. Then detach the new state and inspect which derivative disappears. Keep the initial weights, key, target and query fixed.

<details><summary>Hint and reasoned solution</summary>

Central differences must rebuild the same initial state for rates η+ε and η−ε. The differentiable path includes how changing η changes the written weights and the later query output. Detaching makes that written value an independent leaf, so the outer loss has no graph path to η through the write; asking for it may return unused/None or raise unless unused inputs are explicitly permitted. That does not mean the numerical function is insensitive to η. It means the chosen differentiation contract discarded that dependence. Restore `differentiable=True` for the meta-learning question, and use the detached mode for the intentionally bounded replay question. Compare a smaller ε to diagnose cancellation rather than assuming the smallest possible ε is best.

</details>

The full study program keeps the data split, immutable 2011 fit, forecast-before-observation loop and saved outputs together. Its fit function trains only on 2011; its replay detaches each new fast tuple for bounded online history. The two new programs explain the same manual and autograd operations on the small inspectable cell.


### Read and run rental_memory_study.py

The following is the complete downloadable program. Run it beside its named imports; its displayed file and download contain the same source.

```python
"""Predeclared, offline, predict-observe-write comparison on real daily counts."""
import csv
import hashlib
import json
import platform
from datetime import date
from pathlib import Path
import numpy as np
import torch
from neural_memory import (copy_parameters, initialize_memory,
                           read_memory, write_memory)

ROOT = Path(__file__).resolve().parent
SOURCE_HASH = 'a6bcf826782d3c0fbfdcbeead17cd0884185a0dafe8ff10cd48a874ee7ba18be'


def load_observations():
    source = ROOT / 'bike-sharing-daily.csv'
    assert hashlib.sha256(source.read_bytes()).hexdigest() == SOURCE_HASH
    with source.open(newline='') as stream:
        rows = list(csv.DictReader(stream))
    days = [date.fromisoformat(row['dteday']) for row in rows]
    counts = np.array([float(row['cnt']) for row in rows])
    assert len(rows) == 731 and all((b - a).days == 1 for a, b in zip(days, days[1:]))
    assert all(int(row['casual']) + int(row['registered']) == int(row['cnt']) for row in rows)
    return days, counts


def make_keys(days, counts, mean, scale):
    keys = []
    for target in range(7, len(counts)):
        phase = 2 * np.pi * days[target].weekday() / 7
        key = np.r_[(counts[target-7:target] - mean) / scale,
                    np.sin(phase), np.cos(phase)]
        keys.append(key / np.linalg.norm(key))
    return torch.tensor(np.array(keys), dtype=torch.float64)


def fit_initial(keys, targets, seed):
    parameters = initialize_memory(seed)
    optimizer = torch.optim.Adam(parameters, lr=0.01)
    for _ in range(1000):
        optimizer.zero_grad()
        loss = 0.5 * (read_memory(parameters, keys) - targets).square().mean()
        loss.backward()
        optimizer.step()
    return copy_parameters(parameters), float(loss.detach())


def replay(parameters, keys, targets, start=365, stop=731, momentum=None,
           rate=0.005, retention=0.5, decay=0.0001):
    weights = copy_parameters(parameters)
    state = (tuple(torch.zeros_like(weight) for weight in weights)
             if momentum is None else tuple(value.clone() for value in momentum))
    records = []
    for target_index in range(start, stop):
        key = keys[target_index - 7]
        prediction = float(read_memory(weights, key).detach())
        next_weights, next_state, loss, gradients = write_memory(
            weights, state, key, targets[target_index], rate, retention, decay)
        gradient_norm = torch.sqrt(sum(gradient.square().sum() for gradient in gradients))
        update_norm = torch.sqrt(sum((new-old).square().sum()
                                     for new, old in zip(next_weights, weights)))
        records.append({'index': target_index, 'prediction_z': prediction,
                        'loss_before_write': float(loss.detach()),
                        'gradient_norm': float(gradient_norm.detach()),
                        'update_norm': float(update_norm.detach())})
        weights, state = next_weights, next_state
    return records, weights, state


def score(predictions, observed):
    error = np.asarray(predictions) - observed
    return {'mae': float(np.abs(error).mean()),
            'rmse': float(np.sqrt(np.mean(error**2)))}


def run_study():
    torch.set_num_threads(1)
    torch.use_deterministic_algorithms(True)
    days, counts = load_observations()
    mean, scale = float(counts[:365].mean()), float(counts[:365].std())
    keys = make_keys(days, counts, mean, scale)
    targets = torch.tensor((counts - mean) / scale, dtype=torch.float64)
    result = {'environment': {'python': platform.python_version(),
                             'numpy': np.__version__, 'torch': torch.__version__,
                             'device': 'cpu', 'dtype': 'float64', 'threads': 1},
              'source_sha256': SOURCE_HASH, 'mean': mean, 'scale': scale,
              'fit_examples': 358, 'windows': {}, 'seeds': {}}
    for name, lower, upper in [('development', 365, 548), ('assessment', 548, 731)]:
        result['windows'][name] = {'first': str(days[lower]), 'last': str(days[upper-1]),
            'n': upper-lower,
            'previous_day': score(counts[lower-1:upper-1], counts[lower:upper]),
            'previous_week': score(counts[lower-7:upper-7], counts[lower:upper])}
    for seed in [3, 7, 19]:
        fitted, fit_loss = fit_initial(keys[:358], targets[7:365], seed)
        trace, final, state = replay(fitted, keys, targets)
        frozen = read_memory(fitted, keys[358:]).detach().numpy() * scale + mean
        adaptive = np.array([row['prediction_z'] for row in trace]) * scale + mean
        windows = {}
        for name, lower, upper in [('development', 0, 183), ('assessment', 183, 366)]:
            observed = counts[365+lower:365+upper]
            windows[name] = {'frozen': score(frozen[lower:upper], observed),
                             'adaptive': score(adaptive[lower:upper], observed)}
        for offset, row in enumerate(trace):
            row.update(date=str(days[row['index']]), observed=float(counts[row['index']]),
                       frozen=float(frozen[offset]), adaptive=float(adaptive[offset]))
        result['seeds'][str(seed)] = {'fit_loss': fit_loss, 'windows': windows,
            'initial_parameters': [value.detach().tolist() for value in fitted],
            'final_parameters': [value.detach().tolist() for value in final],
            'final_momentum': [value.tolist() for value in state], 'trace': trace}
        print(seed, 'development', windows['development'], 'assessment', windows['assessment'])
    (ROOT / 'rental-results.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    return result


if __name__ == '__main__':
    run_study()
```


Run the study to reproduce the retained protocol, rather than assuming a web edit is a new trained model. The web investigation replays saved fits; a hypothetical arrival changes that replay rather than training a new initial model.

## 8. Parallelize a declared update rule

If two writes are evaluated together, which weight creates each gradient? The solid path advances the applied weight; the anchor route reuses a declared gradient-source state. Both receive the same target arrivals.

[Titans drawing chunk-core]

Change the initial 1×1 matrix and both targets in the same shared case. Both targets and the starting weight belong to the same shared calculation.

[Titans drawing chunk-inputs]

Now change the anchor-refresh schedule and highlight a step without changing its arithmetic. Length 1 restores the current-state gradient source at every arrival.

[Titans drawing chunk-schedule]

**Deeper branch.** Each online step can depend on the previous fast weights twice: directly in the weight recurrence and inside the gradient calculation. The second dependency is expensive for a nonlinear memory. Calculating a chunk's gradients at one shared starting state removes that dependency inside the chunk. Prefix sums or scans can then combine the precomputed updates.

This changes the update convention. Take a scalar memory \(M_w(1)=w\), initial weight 0, target sequence 1 then 2, rate 0.5, and no momentum or decay:

| Method | First gradient → weight | Second gradient → weight |
| --- | --- | --- |
| Recompute at the current weights | −1 → 0.5 | \(0.5-2=-1.5\) → 1.25 |
| Both gradients at the chunk anchor 0 | −1 → 0.5 | \(0-2=-2\) → 1.5 |

The difference is where the second gradient is evaluated. Both calculations use a running weight state; one uses a stale anchor when determining the descent direction. Chunk size 1 recovers the sequential rule, and a zero rate makes both leave the weight unchanged.

**Investigation — move the gradient anchor.** Edit the two targets and learning rate, inspect the ordering of the final weights, then compare the two dependency diagrams. Change chunk size from 2 to 1 and explain which edge is restored. Equal outputs on a special fixture do not make the update rules identical: create a target pair that exposes their difference.

Once the gradients are declared, known affine updates can be composed. The concrete scalar operands below yield−.5 along either route; the coupled two-state example also exposes the carried momentum’s contribution to the new weight.

[Titans drawing scan]

With fixed gradient inputs \(u_t\), momentum obeys an affine recurrence \(S_t=\eta_t S_{t-1}-\theta_t u_t\). Two transformations \(F_1(s)=a_1s+b_1\) and \(F_2(s)=a_2s+b_2\) compose as

\[
F_2(F_1(s))=(a_2a_1)s+(a_2b_1+b_2).
\]

Function composition is associative, which permits a scan organized as a tree rather than a strictly serial chain. That identity explains the parallel opportunity. It does not make the original nonlinear gradient evaluations independent. The [Titans parallelization section](https://arxiv.org/html/2501.00663v1#S3.SS2) and [TTT mini-batch derivation](https://arxiv.org/html/2407.04620v1#S2.SS4) discuss this distinction.

Likewise, accumulating gradients over examples at fixed ordinary model weights is not the same operation as repeatedly changing those weights between examples. The next lesson makes that distinction operational in a conventional training loop, including uneven batch sizes and the last partial update.

## 9. Count the state you actually retain

What does each request physically retain? Count the two parameter matrices and matching momentum copies before multiplying by layers and requests. Attention’s K/V history has different axes and dtype.

[Titans drawing budget]

The partial sum below counts these named terms only. Parameter slabs stay bounded as the stream grows; they still replicate per request. Neither bytes nor a fixed state shape establishes recall quality or latency.

**Deeper branch.** Separate shared model parameters, state for each active sequence, temporary workspaces and the graph retained for outer training. Their scaling can differ.

Let a bias-free memory have dimensions \(d\to H\to d\). It contains \(2dH\) fast weights. If both weights and momentum use four-byte float32, their combined storage is \(2(2dH)4\) bytes per memory instance. With \(d=2048\) and \(H=512\), that is 16 MiB per layer. With 24 such layers and 4 independent sequences, it becomes 1.5 GiB.

For an attention cache with batch \(B\), attention layers \(L_a\), retained positions \(T_r\), KV heads \(h_{kv}\), head dimension \(d_h\) and \(b\) bytes per value,

\[
\text{KV bytes}=2B L_a T_r h_{kv}d_h b.
\]

The leading 2 accounts for keys and values. Use the number of KV heads, not automatically the number of query heads. A 2048-position window with batch 4, 24 attention layers, 8 KV heads, head dimension 128 and two-byte elements uses 0.75 GiB. Retaining 131072 positions under the same assumptions instead uses 48 GiB. These are exact payload calculations for a hypothetical configuration, not the memory footprint of a named released model.

**Separate storage bands.** The 1.5 GiB fast-weight/momentum band sits beside the 0.75 GiB local-KV band. Shared base weights, persistent parameters and workspace are separate categories with unspecified sizes. Increasing batch duplicates sequence state; increasing the window changes only the KV term in this calculation. The two calculated bands total 2.25 GiB; a complete device requirement also includes those other categories.

For fixed dimensions and a fixed window, a forward read and local write cost a bounded amount per position; total work grows with sequence length. A two-layer memory read has work proportional to \(dH\), and its gradient adds work on the same dimensions. Local attention adds a window-dependent term. Projection, feedforward, normalization and other architecture costs still exist. An outer training pass can retain activations or reconstruct them, so its peak memory does not follow solely from the inference-state formula.

Wall-clock latency also depends on chunking, tensor layout, batch size, precision, kernels, transfers and synchronization. Multiplying FLOPs by a peak hardware specification is not a measured runtime. Benchmark the actual causal update convention, context distribution and serving workload, including quality at the required retrieval distances.

## 10. Read the research without turning it into a promise

**Deeper branch.** The canonical source is [Behrouz, Zhong and Mirrokni, *Titans: Learning to Memorize at Test Time*](https://arxiv.org/html/2501.00663v1). Its arXiv submission is 31 December 2024; Google's publication entry labels it 2025. The paper studies memory design, integration, language modeling, retrieval/reasoning, forecasting, DNA modeling, efficiency and ablations. It is useful to read those as separate questions.

For example, the paper's Table 2 reports single-needle retrieval at 2K, 4K, 8K and 16K. Its longer-context BABILong results concern a different benchmark and include different fine-tuning/few-shot settings. Combining them into a smooth invented “accuracy up to 2M” curve would conceal those distinctions. A model that processes a long input has not thereby demonstrated that every fact in it remains recoverable.

Depth and component ablations ask whether changes help under the reported setup. They can motivate a new experiment, while the nonlinear-memory proof above explains a representational possibility independently of those scores. The paper also makes a theoretical expressivity claim about state tracking; this lesson does not supply its complexity-theory proof. It should not be recast as a guarantee that a trained model solves every difficult reasoning task.

The authors' [December 2025 Titans/MIRAS overview](https://research.google/blog/titans-miras-helping-ai-have-long-term-memory/) introduces a useful research lens: choose a memory structure, its learning objective, its retention rule and its update algorithm. This gives you a way to classify an experiment. Replacing squared loss with a robust loss changes what errors drive writes; changing retention alters what survives; changing the memory network alters the functions it can represent. Those are distinct interventions. The overview is a conceptual companion; the precise equations and experimental conditions should be checked in the underlying papers.

### Change one memory-design choice at a time

The MIRAS framework separates the memory architecture, association objective, retention and update algorithm. We have already drawn the parameter bank, arrived target/loss, carried velocity and explicit step. Changing squared loss to Huber changes the residual derivative before it reaches those parameter wires.

[Titans drawing objective]

At w0,key 1,target 4, rate .1, half-square gives gradient −4 and new weight .4. Huber threshold 1 clips that derivative to −1 and gives .1. Target .5 gives .05 in both. This clipping is an objective choice, not a reset of momentum. The [MIRAS paper](https://arxiv.org/html/2504.13173v1) also develops retention constraints and Yaad/Moneta/Memora variants; probability-domain/p-norm/KL details need their stated domain constraints and are visible primary-paper extensions, not an API promised here.

### Let an available window define the objective

ATLAS asks a different question: should a write fit only the newest association or a permitted local set? The following two arrived targets contribute their own residuals to a mean node.

[Titans drawing window-objective]

For w = 0 and two keys both equal to 1, targets 1 and 3 give mean half-loss gradient (−1−3)/2 = −2; rate .25 gives .5. Latest-only gives .75. Duplicating target 3 gives .75 in both. The [ATLAS paper](https://arxiv.org/html/2505.23735v1) also changes feature maps and optimizer choices. This directly derived scalar example isolates the objective/reduction, whereas §8 isolated the gradient anchor. This scalar example follows the stated gradient-descent convention and isolates the objective rather than reproducing an ATLAS training run. Retaining the permitted window also adds storage and work.

### Give different parameter banks different clocks

Which updates belong to which timescale? Each drawn bank is an actual parameter object; the fast bank receives a loss-driven update at every arrival and the slow bank only at the fourth.

[Titans drawing frequencies]

The [Nested Learning/HOPE paper](https://arxiv.org/html/2512.24695v1) develops multiple update frequencies, a continuum memory system and self-modifying learned views. Our four-position schedule teaches the frequency choice; it is not a HOPE checkpoint or a claim that every level reduces to this two-bank specialization. Declaring each bank’s objective, optimizer and reset policy matters as much as naming its frequency.

### Distill a longer permitted context into a shorter one

Where can an inner target come from without revealing a future answer? In context distillation, a teacher and student answer the same causal position with different amounts of already available context.

[Titans drawing distillation]

Teacher output 2 is held fixed as the target for student w = 0 with key 1. Half-loss gives gradient −2; rate .1 gives w′=.2. If both outputs are 0, the update is zero. [Test-Time Context Distillation](https://arxiv.org/html/2608.01672v1) adapts fast projections from a longer-context teacher; the context and stop-gradient contracts are part of its method. Reducing this auxiliary loss is separate from later retrieval or generation quality. The scoped [Beyond Perplexity](https://arxiv.org/html/2607.00368v1) study is a useful reminder that improving an adaptation loss can coexist with weak generated recall under its particular LoRA support-task setup. It does not show that every Titans/TTT model fails to recall. Full trained-model reproduction and benchmark comparisons remain outside these local arithmetic promises.

### A less obvious application: a changing visual stream

The next transformation gives a visible target without giving the class answer. Follow the asymmetric glyph through a known90° rotation, then the two separate heads.

[Titans drawing vision]

The TTT research line also explores adaptation for vision. In [Sun and colleagues' 2020 project](https://yueatsprograms.github.io/ttt/home.html), the visible test input supplies a self-supervised task such as predicting an applied image rotation. Shared features are updated using that auxiliary task before the main prediction, without revealing the main class label. It demonstrates why “learning at test time” need not mean looking at a test answer.

Map the roles carefully: the observed image provides the auxiliary target; feature weights adapt; the classification head then predicts the withheld class. For an online stream, carrying state forward additionally assumes that consecutive inputs have a relationship worth exploiting. A sudden camera change could make that assumption less helpful. The natural investigation is to compare reset and carry-forward policies under a declared sequence of shifts, with the same starting model and without using class labels for adaptation.

That application differs from our supervised rental replay and from a Titans key/value memory. Putting them next to each other helps isolate a general design question: **what target is available under the task protocol at the moment a model updates, and how does improving that target help the task we care about?**

### Choose an approach by the work it must do

For exact document provenance, an external retrieval system can retain text, source identifiers and dates. A fast-weight memory instead returns a learned compressed representation. For ordered streaming patterns, an adaptive state can incorporate each observation as it arrives. Recent attention helps address individual accessible positions. These approaches can be combined; “ordered input” is not a reason that retrieval is inherently impossible.

Before choosing a design, define the question, target availability, necessary evidence, tolerated error, reset boundary, expected sequence lengths and resource budget. Then compare an existing simple baseline with the proposed method. An architecture diagram alone cannot determine which released system satisfies those requirements. This lesson does not infer unpublished product internals or make current checkpoint-availability claims from a research paper.

## 11. Diagnose the mechanism you actually ran

| Observation | Useful next comparison | What it can distinguish |
| --- | --- | --- |
| High loss, tiny gradient | Inspect keys and parameter sensitivities; try the zero-key control | A mismatch can be large in output space yet hard to affect through the chosen parameters |
| Weights change despite zero new gradient | Log old/new momentum and decay separately | Carrying an earlier update versus a new gradient-driven write |
| Inner loss improves, task score worsens | Hold the sequence fixed and compare query/task outputs before and after writes | Fitting associations versus improving the outer task |
| Reading in chunks changes outputs | Compare complete state carry and the gradient-anchor convention | Lost state versus a different algorithm |
| A new request depends on an earlier one | Compare isolated initial states with deliberately shared state | An unintended cross-request dependency |
| Larger magnitudes or nonfinite values | Inspect the first offending input, residual, gradient and update | Scale, update, data or arithmetic problems that deserve different repairs |
| A forecast becomes perfect after adaptation | Check when the target first entered the computation | Forecasting versus scoring a fitted target |

Do not jump from a symptom to a unique cause. For example, reducing a rate may prevent an immediate numerical failure while leaving a target-leakage bug intact. A useful debugging record names the hypothesis, one controlled change, what was held fixed and the observation that would distinguish explanations.

## 12. Practice: carry the idea to a changed case

### 1. An old association moves

Start from \(w=(2,-1)\), write key \((1,2)\) → value 3 using half-squared loss, rate 0.1 and no momentum/decay. Compute the new weights and the change in the answer to query \((2,1)\). Verify the change once by direct readout and once by the overlap identity.

<details><summary>Hint</summary>

Compute the prediction at the write key first. The query is a separate vector; use it only when calculating the old and new reads or the overlap.

</details>
<details><summary>Solution</summary>

The write prediction is \(2-2=0\), residual −3 and gradient \((-3,-6)\). New weights are \((2.3,-0.4)\). The query read changes from \(4-1=3\) to \(4.6-0.4=4.2\), an increase of 1.2. The overlap is \((1,2)^\top(2,1)=4\), so \(-0.1(-3)(4)=1.2\) gives the same change. The key tells the memory what to fit; the query exposes a consequence elsewhere.

</details>

### 2. Is decay a reset?

For a scalar weight, let \(w=3\), old momentum 0.4, new gradient 0, momentum retention 0.5 and \(\alpha=1\). What is the new weight? Specify a true fresh-sequence reset when the chosen initial weight is 0.7.

<details><summary>Hint</summary>

Calculate momentum before applying the weight recurrence. Distinguish the zero vector from the configured initial state.

</details>
<details><summary>Solution</summary>

New momentum is 0.2; new weight is \(0\cdot3+0.2=0.2\). A fresh sequence restores the weight to 0.7, momentum to 0, and clears its local context and other sequence state. No claim about the content being forgotten follows solely from a single gate value.

</details>

### 3. Change the chunk rule

Use initial scalar weight 1, keys 1, targets 3 then −1, rate 0.25 and no momentum/decay. Calculate the final weight with current-state gradients and with both gradients at the starting anchor. What happens if the chunk size is 1?

<details><summary>Hint</summary>

The first step agrees. For the second gradient, explicitly write the weight at which the residual is evaluated.

</details>
<details><summary>Solution</summary>

First gradient is −2, giving 1.5. Sequentially the next gradient is \(1.5-(-1)=2.5\), giving \(1.5-0.25(2.5)=0.875\). With anchor 1, the next gradient is 2, giving 1.0. Chunk size 1 refreshes the anchor before each gradient and yields 0.875. Both methods received the same observations; their descent directions differed.

</details>

### 4. Judge the rental result

Use the assessment results to answer: did adaptation help the seed 7 network, and would you choose it over the previous-day baseline on MAE alone? Design a new comparison that could justify a more expensive predictor without reusing the same assessment interval for unlimited model selection.

<details><summary>Hint</summary>

Those are two different comparisons. State the decision criterion before proposing a tuning experiment.

</details>
<details><summary>Solution</summary>

Seed 7's adaptive MAE 867.34 improves greatly over its frozen MAE 1781.81, but remains above the previous-day baseline 843.81. On these assessment MAEs alone, select the simple baseline. A follow-up could predeclare a later dated holdout, choose features/rates on earlier rolling development intervals, and compare the locked procedure's MAE, large-error behavior and compute cost on the later interval. The retained data end in 2012, so a genuinely later real holdout would require additional data or an explicitly redesigned study; it cannot be invented by relabeling the already inspected results.

</details>

### 5. Learn the write rate

Start with scalar weight 0. Write key 1 → value 2 with rate \(\theta\), then query at 2 with outer target 3. Derive the outer loss and its rate derivative. Evaluate them at \(\theta=0.5\).

<details><summary>Hint</summary>

Express the new weight as a function of the rate before substituting the number. Otherwise you can accidentally discard the dependency you need to differentiate.

</details>
<details><summary>Solution</summary>

Inner gradient −2 gives \(w'=2\theta\); query output is \(4\theta\). Outer loss is \(\tfrac12(4\theta-3)^2\), derivative \(4(4\theta-3)\). At 0.5, prediction 2, loss 0.5 and derivative −4. A small increase in the write rate decreases this outer loss locally. A program that detaches the updated weight before computing the outer objective would lose this rate path.

</details>

### 6. A serving-state calculation

A hypothetical bias-free memory has dimensions 512→128→512. Its weights and momentum are float32. There are 12 memory layers and 8 independent requests. Calculate their combined payload, then name at least three missing categories before declaring whether the system fits on a device.

<details><summary>Hint</summary>

Count two weight matrices, a momentum copy, bytes per entry, layers and requests. Divide by \(2^{20}\) for MiB.

</details>
<details><summary>Solution</summary>

Each layer/request has \(2(512)(128)=131072\) weights. Weights plus momentum take \(131072\times2\times4=1048576\) bytes, exactly 1 MiB. Across 12 layers and 8 requests this is 96 MiB. Missing categories include shared base-model weights, attention K/V, convolution and position/chunk state, temporary workspace, and training activations if doing an outer training pass. Dtypes can differ between categories, so use the actual ones in a complete calculation.

</details>

### 7. Explain a delayed reversal

Momentum is at its steady state −0.5 under constant gradient 1, rate 0.05 and retention 0.9. The gradient becomes −1. After how many steps does momentum first become positive? Why is that different from reaching its new steady state?

<details><summary>Hint</summary>

The new steady state is 0.5. Solve the recurrence for the distance from that value.

</details>
<details><summary>Solution</summary>

After n new steps, \(S_n=0.5-0.9^n\). It becomes positive when \(0.9^n<0.5\), first at n=7. The distance to the new steady state is \(0.9^n\); it approaches zero asymptotically and requires a declared tolerance for an approximate stopping time. A timescale such as \(1/(1-0.9)=10\) is not the exact sign-reversal answer.

</details>

### 8. Repair a plausible architecture explanation

Someone says: “We computed every token's memory read from the initial weights, then wrote the whole sequence afterward. Our attention is causal, so the memory has learned the earlier tokens for every output.” Identify the error and propose a controlled check. Then explain the different error in reading every position from the final post-sequence weights.

<details><summary>Hint</summary>

Ask which exact memory version produced the read at position t, independently of the attention mask.

</details>
<details><summary>Solution</summary>

All initial-state reads miss the adaptation from earlier tokens in this call. Reads must use the state prescribed by the declared online or chunk update rule. Compare a whole-call run with a continuation run that carries identical state across a boundary; they should agree when the convention agrees. Using the final post-sequence weights for earlier positions creates the opposite problem: those states can contain future writes. Perturb a future input and check earlier outputs. The attention mask cannot repair either memory-path error.

</details>

### 9. Reverse the nonlinear target

Use §4’s complete fixed parameter tuple, key [1,1], target −1 and rate .1. Compute every nonzero gradient and parameter update, then read that key again. Explain why setting the key to zero would not generally eliminate the output-bias update. Verify the same changed target through the manual and functional-module routes.

<details><summary>Hint</summary>

The old read remains0. Reverse the residual sign and propagate it through W₂ and SiLU′(0).

</details>
<details><summary>Solution</summary>

Residual +1 gives first W₁ gradient [1,1], first b₁ gradient 1 and b₂ gradient 1; W₂ and all other hidden gradients are zero. New first W₁ row [.9,−1.1], b₁ first −.1 and b₂−.1 give z−.3. Read −.1−.6 sigmoid(−.3)≈−.35533449. The output-bias sensitivity is 1 even at a zero key, so a nonzero residual can still update that bias. Both routes must use the same half-loss and arrays before comparing.

</details>

### 10. Transfer the window objective

Use scalar w = 0, two already available keys both equal to 1, targets 2 and 6, and rate .125. Compare the mean half-loss window step with latest-only. What additional state and evaluation would you need before claiming better recall?

<details><summary>Hint</summary>

Average gradients, not final weights from two independent runs. Keep the loss reduction and rate together.

</details>
<details><summary>Solution</summary>

The window gradient is(−2−6)/2=−4, giving new weight .5. Latest-only gradient −6 gives .75. The window requires retaining its permitted associations or an equivalent sufficient computation; its cost depends on the chosen memory/features/optimizer. A later queried-task comparison needs a fixed causal protocol, held-out cases, suitable retrieval or generation metric and the same resource accounting. Neither this final scalar nor its smaller association loss demonstrates better future recall.

</details>

## Ready to move on?

Explain where the three memories store information; perform a write and predict a changed query; distinguish loss, gradient and actual update; identify the inner and outer targets; and justify when a target becomes available. Then reproduce one controlled state comparison and interpret a real result against its simple baseline. These are stronger signs of understanding than remembering the three architecture abbreviations.

Continue to [Mini-Batches, Training Loops & Gradient Accumulation](/learn/path/full-curriculum/mini-batches-training-loops-gradient-accumulation?module=deep-learning-fundamentals). It follows this topic in the module and turns the distinction between computing gradients and applying updates into a complete practical loop. The following diagnostics lesson then teaches how to test that loop's behavior.

## References and another way to learn it

### Two foundations and a runnable bridge

[Deep Learning, chapters 4 and 8](https://www.deeplearningbook.org/contents/optimization.html), Goodfellow, Bengio and Courville, explains numerical sensitivity and gradient-based optimization. Use it to separate the residual, local derivative and step length from the memory interpretation. [Dive into Deep Learning: momentum](https://d2l.ai/chapter_optimization/momentum.html) expands velocity as a decaying sum of earlier gradients; translate its velocity convention into our signed increment S before comparing. Its [query/key/value treatment](https://d2l.ai/chapter_attention-mechanisms-and-transformers/queries-keys-values.html) explains the addressable weighted-value route alongside the compressed parameter route here.

The [official TTT PyTorch implementation](https://github.com/test-time-training/ttt-lm-pytorch), especially ttt.py’s TTTCache and TTTMLP, is a concrete next implementation to read. It carries fast state, convolution history, sequence offset and mini-batch state; its LN/GELU objectives and cache/update policy differ from this SiLU half-loss cell. The runnable bridge here is the official TTT implementation; third-party Titans implementations have their own provenance and are not treated as official Titans checkpoints. [functional_call’s versioned API](https://docs.pytorch.org/docs/2.14/generated/torch.func.functional_call.html) explains supplied parameter mappings and mutation caveats used by the ordinary module route.

### Download the exact programs, data and protocol

[Titans downloads]

The complete instructional programs are visible in the sections where their mechanisms are taught. The file index includes the original packet checker as a reproduction supplement, alongside all unchanged scientific data/protocol/result assets. The available rental CSV is UCI Bike Sharing, CC BY 4.0; retain its source description/provenance and exact hash when reproducing. The saved fits and experiment receipts carry the dates and identities of their original experiments.

### Original papers and further formats

- [Behrouz, Zhong and Mirrokni: Titans](https://arxiv.org/html/2501.00663v1). Primary paper; begin with §§ 3.1 and 4 after the hand example, then read § 3.2 and Appendix C for update conventions. Continue to the experiment sections to see how the mechanisms were evaluated. Mathematical notation sometimes compresses implementation details; use the timing distinctions in this lesson when translating it to code.
- [Sun and colleagues: Learning to (Learn at Test Time)](https://arxiv.org/html/2407.04620v1). Primary paper with a helpful alternative inner/outer-loop explanation and mini-batch derivation. Read §§ 2.1–2.4 after § 6 here. Its mechanism, training-view and chunk sections extend the local examples here; the full language-model experiments require their separate reproduction setup.
- [Google Research: Titans + MIRAS](https://research.google/blog/titans-miras-helping-ai-have-long-term-memory/). An illustrated article by the researchers, dated 4 December 2025, for revisiting the high-level design choices. Use its illustrations to reconnect the design choices to the memory components. Read the precise paper equations for the update rather than interpreting every everyday “surprise” example literally.
- [Sun and colleagues' 2020 TTT project and companion explanation](https://yueatsprograms.github.io/ttt/home.html), with its [ICML talk](https://www.youtube.com/watch?v=NbuWxmMco30). A video alternative about test-time self-supervision and distribution shifts, not a Titans tutorial. Use the project introduction and method for the equations; the linked talk provides a separate video route without a timestamp guide. Useful after the target-availability discussion in § 7.
- [PyTorch autograd.grad](https://docs.pytorch.org/docs/2.14/generated/torch.autograd.grad.html) and [no_grad](https://docs.pytorch.org/docs/2.14/generated/torch.no_grad.html). Versioned API references for implementing the two graph-lifetime modes in § 6. Compare the create_graph and no_grad semantics with the supplied programs and their recorded execution environment.
- [UCI Bike Sharing](https://archive.ics.uci.edu/dataset/275/bike+sharing+dataset), Hadi Fanaee-T, 2013, [DOI 10.24432/C5W894](https://doi.org/10.24432/C5W894). Dataset and descriptive context for the real application. Use the supplied daily CSV and provenance to reproduce this lesson's exact data input.

The original experiment record is dated 13 September 2026. The supplied programs retain the complete experiment and its recorded results; the website investigations expose the same update equations and saved-data replay.
