# Mini-Batches, Training Loops & Gradient Accumulation

**Explore as you read.** Change examples and their microbatch boundaries, then follow the loss derivatives into a shared gradient buffer and one optimizer update. Compare unequal target weights and physical normalization groups to discover when the same rows no longer define the same computation.

Your model can process twelve examples at a time, but you want one update to use thirty-two. Can you run three forward/backward passes and obtain the same update as a batch of thirty-two? Yes, for an appropriate computation—but the last eight examples must receive the same per-example influence as the first twenty-four. Calling every microbatch's loss `.mean()` and averaging those three numbers gives a different objective.

This lesson makes a training loop inspectable. You will follow examples, predictions, losses, gradients, parameters and optimizer memory as separate objects, then build an offline flower classifier whose full-batch and accumulated updates agree. The central question is: **which examples contribute to this update, with what weight, evaluated at which parameters?**

**First pass:** read §§1–6, run the scalar trace in §4 and the Iris program in §6, and attempt practices 1–4. Use the state and denominator investigations as you encounter them. You should finish able to write a correct accumulation loop and explain its final partial group. §§7–9 are deeper branches on batch-dependent computation, numerical precision and distributed training; return to these before applying accumulation to such models. Practice 5 tests that transfer. 

You need to read a two-dimensional array, recognize a scalar derivative, and know that a gradient tells an optimizer how a local change affects loss. Review [NumPy: Arrays, Broadcasting & Vectorization](/learn/topic/numpy-arrays-broadcasting-vectorization) for shapes and reductions, and [Backpropagation & Automatic Differentiation](/learn/topic/backpropagation-automatic-differentiation) for the chain rule. We refresh the particular derivative needed below. No GPU is required for the programs.

## 1. How can 32 examples share one update if only 12 fit?

One record is an input paired with the answer used to judge it. The first drawing keeps all 32 records in one update, delivered twelve at a time. Its second scene separates delivery from updates on a ten-record traversal.

@@ MinibatchDeliveryDrawing

An **example** is one input and its target. A **mini-batch** groups examples for a computation. An **epoch** is a pass through a specified training sampling procedure, commonly one shuffled traversal of the training rows. An **optimizer step** applies an update to parameters and, when present, optimizer state. A **microbatch** is a smaller chunk whose gradient contributes to an update shared with other chunks. The examples combined for that update form its **effective batch**.

For ten examples, microbatch size four, and two microbatches per update, the sequence is:

```text
examples:       [a b c d] [e f g h] | [i j]
microbatch:         1         2     |   3
effective batch: [------- 8 ------]|[-- 2 --]
optimizer step:                   1          2
epoch:          [------------ one traversal ------------]
```

With a finite ordinary map-style dataset of size $N$, microbatch limit $b$, and $K$ chunks per update, keeping all rows and flushing at each epoch end gives $C_{\text{chunks}}=\lceil N/b\rceil$ microbatches and $U=\lceil C_{\text{chunks}}/K\rceil$ updates. Write down the sampling and remainder policy before using this formula. Sampling with replacement can revisit a row and omit another within an epoch; a streaming dataset may instead define an epoch by a fixed number of draws.

The loader decides which examples arrive and how they are collated into tensors. The loop decides when to update. For example, PyTorch's `DataLoader(..., batch_size=4, shuffle=True, drop_last=False)` provides batches, but does not create accumulation boundaries for you. `drop_last=True` discards a loader's short final batch; it does not repair an incorrectly scaled accumulation group. Keep it a deliberate data policy. [PyTorch data loading reference](https://docs.pytorch.org/docs/2.14/data.html#loading-batched-and-non-batched-data).

Why group examples at all? Matrix operations can reuse data and amortize framework overhead across rows. Meanwhile, averaging gradients makes the update depend less on any one sampled example. Batch size therefore affects memory, computation and the statistical path taken through training. Gradient accumulation primarily changes how an effective batch fits into working memory. It still performs the microbatches' work; it is not a promise of faster training. [Dive into Deep Learning, §12.5](https://d2l.ai/chapter_optimization/minibatch-sgd.html).

**Pause:** If you change microbatch size but preserve each effective group and its one optimizer step, which clock can change? The number of forward/backward calls can change while the number of examples and updates stays fixed. If instead you step after every newly sized batch, you change the update clock too.

## 2. What does one example ask the parameter to change?

Delivery alone says nothing about which value should change. Zoom into one supplied input x=1 and target y=2, with an adjustable weight w=0. The solid arrows compute a prediction and loss; the dashed arrows carry the effect of a small weight change backward.

@@ MinibatchScalarDrawing

Read the left circuit from the top: x×w gives prediction p=0; subtracting the supplied target2 gives residual r=−2, the signed prediction error. Squaring r and multiplying by one-half gives row loss2. The right circuit begins with reverse seed1 at the loss, then multiplies by residual−2, subtraction factor1 and supplied x=1. It delivers credit−2 to w without changing w=0. The target stays supplied rather than receiving an optimizer update.

Use a single adjustable weight $w$ and prediction $\hat y_i=w x_i$. These three constructed rows keep the arithmetic visible:

| Row | Input $x_i$ | Target $y_i$ | Prediction at $w=0$ | Half-squared loss $\ell_i=\frac12(wx_i-y_i)^2$ | Derivative $(wx_i-y_i)x_i$ |
| --- | ---: | ---: | ---: | ---: | ---: |
| a | 1 | 2 | 0 | 2 | −2 |
| b | 2 | 0 | 0 | 0 | 0 |
| c | 3 | 1 | 0 | 0.5 | −3 |

The derivative follows the chain rule: changing $w$ changes the prediction by $x_i$ times as much, while changing the prediction changes half-squared loss at rate $wx_i-y_i$. Multiplying those local effects gives the last column. The half factor cancels the derivative of the square. PyTorch's ordinary MSE loss has no half factor; our scalar examples explicitly include it.

The three losses and three parameter credits now enter parallel reductions. Both divide by the same actual count D=3.

@@ MinibatchMeanDrawing

The objective is the **mean per example**:

$$
L(w)=\frac{1}{3}\sum_{i=1}^{3}\ell_i(w),\qquad
L(0)=\frac{2+0+0.5}{3}=\frac56,
\qquad g=\frac{-2+0-3}{3}=-\frac53.
$$

The completed credit reaches a separate update junction. Set the optimizer memory to zero for this first step.

@@ MinibatchUpdateDrawing

A gradient is not a parameter change. Plain stochastic gradient descent (SGD) makes the separate decision $w_{\text{new}}=w-\eta g$. With learning rate $\eta=0.1$, the new weight is $1/6$. Its predictions are now $[1/6,1/3,1/2]$. On the same three rows the mean loss is $67/108\approx0.620370$, down from $5/6\approx0.833333$. The update reduced the combined loss even though row b became less accurate. A mean objective negotiates among examples.

## 3. How can separate backward calls build the same update?

The forward circuit is unchanged. Split the same three records into [a,b] and [c], while retaining the original w in both circuits.

@@ MinibatchAccumulationDrawing

Return to rows a, b, c and split them into microbatches `[a,b]` and `[c]`. Hold $w=0$ throughout both forward/backward passes. The first chunk contributes the derivative of $(\ell_a+\ell_b)/3$, which is $-2/3$. The second contributes the derivative of $\ell_c/3$, which is $-1$. Adding them gives $-5/3$, exactly the derivative of the full objective from §2.

Let θ collect all adjustable model parameters; in the scalar case it contains only w. The mathematical reason is linearity of differentiation. If $S_j(\theta)$ is the sum of losses in chunk $j$ and $D$ is the total number of contributing examples, then

$$
\nabla_\theta \left(\frac{\sum_j S_j(\theta)}{D}\right)
=\sum_j\nabla_\theta\left(\frac{S_j(\theta)}{D}\right).
$$

The denominator is fixed by the data in this group, not learned. Each call to `.backward()` adds another derivative to the existing gradient slots. Fresh forwards produce fresh computation graphs, so ordinary accumulation does not require `retain_graph=True`. After each backward pass, that chunk's saved activations can be released; the gradient tensors survive.

### Parameters, gradients and optimizer memory have different lifetimes

The parameter persists across training. A gradient slot holds contributions for the next update. Optimizer state can retain information from earlier updates. For example, a simple momentum convention is

$$
v_t=\mu v_{t-1}+g_t,\qquad w_{t+1}=w_t-\eta v_t.
$$

The second update keeps the preceding group's gradient in optimizer memory. Here g=+1 is newly supplied, while the previous v=−5/3 still enters the multiplication.

@@ MinibatchUpdateDrawing weight={1/6} gradient={1} rate={.1} momentum={.9} previousBuffer={-5/3} showMemory

The coefficient $\mu$ controls memory. Starting with $v_0=0$, the first update agrees with plain SGD. Suppose the next effective group has gradient $+1$, with $\mu=0.9$. Then $v=0.9(-5/3)+1=-0.5$ and the weight moves from $1/6$ to $13/60\approx0.216667$. It still moves upward because stored momentum outweighs the current gradient. PyTorch SGD agrees with this convention for our zero dampening, no Nesterov, no weight decay setup. Its broader parameter choices have additional semantics. [SGD reference](https://docs.pytorch.org/docs/2.14/generated/torch.optim.SGD.html).

`optimizer.zero_grad(set_to_none=True)` resets gradient slots, not weights or momentum. `None` means no gradient has been supplied; it is distinct from a tensor of zeros. PyTorch optimizers skip parameters with `grad=None`, whereas a zero gradient can still allow an update through existing optimizer state or weight decay. This distinction is useful when a branch uses only some parameters. [zero_grad reference](https://docs.pytorch.org/docs/2.14/generated/torch.optim.Optimizer.zero_grad.html).

The normal lifecycle is: **clear → forward → loss → backward → optional gradient processing → step**. Clearing immediately after the preceding step also works if the first group's gradients start clear. `model.train()` selects training behavior; it does not start this lifecycle or change weights by itself. [PyTorch optimization tutorial](https://docs.pytorch.org/tutorials/beginner/basics/optimization_tutorial.html).

Each chunk owns fresh prediction and residual values; their reverse path has already copied the parameter credit into an independent surviving slot.

@@ MinibatchLifetimeDrawing

The equality concerns a particular objective evaluated at the same parameters with the same per-example computation. Use it when examples do not interact across chunks, randomness is absent or aligned, and optimizer state advances once after the complete sum. Batch-dependent layers and cross-example losses are examined in §7. Floating-point summation order can cause small differences even when the mathematical update is identical.

### Why averaging microbatch means can change the question

Before differentiating, compare how much objective mass reaches each stable row.

@@ MinibatchInfluenceDrawing

Our first chunk's mean loss has gradient $(-2+0)/2=-1$. The second chunk's mean has gradient $-3$. Averaging those means gives $(-1-3)/2=-2$, leading to weight $0.2$ instead of $1/6$.

The error is visible before calculus. Under an equal average of chunk means, rows a and b each get coefficient $1/4$, while c gets $1/2$. Under the intended example mean, all three coefficients are $1/3$.

If chunk $j$ contains $n_j$ examples and its mean loss is $\bar L_j$, the correct combination is

$$
L=\sum_j\frac{n_j}{\sum_k n_k}\bar L_j.
$$

Dividing each mean by the number of chunks is the special case where all their denominators are equal. Count what the loss averages; do not assume every tensor called a batch contains the same amount of supervision.

### Change the rows while keeping one shared case

The editable case now changes deliberately to a=(1,1), b=(2,2), c=(4,1), original w=0 and [a,b] then [c]. Its correct derivative is −3 and plain-SGD update is .3. Every following scalar question shares those rows and settings. Direct editors accept every finite in-range decimal; invalid drafts retain the last valid case.

@@ MinibatchScalarInvestigation question="row"

The selected row's product gives its raw credit. Change one target and check the residual, then move to a different stable row.

@@ MinibatchScalarInvestigation question="records"

Adding a record changes both the sum and actual count. Removing it keeps the identities of surviving records.

@@ MinibatchScalarInvestigation question="boundary"

Move a physical boundary: the separate sums change but the completed derivative at the old w stays fixed.

@@ MinibatchScalarInvestigation question="rate"

The rate η scales the parameter change. Momentum μ=.9 retains an earlier update's credit; a zero rate leaves the parameter unchanged even though backward and memory operations still occur.

Clearing before each chunk keeps only the last chunk's credit. In this fresh case it changes the final weight from .3 to 2/15.

@@ MinibatchScalarInvestigation question="clear"

Stepping after each chunk instead sends the newly changed weight into the next forward. It yields 19/90 with plain SGD and 13/36 with μ=.9 in this fresh case. The next toggle selects that alternative policy; the two fault choices do not combine.

@@ MinibatchScalarInvestigation question="early"

Use the operation cursor to follow the actual weight, credit and memory stores. A forward's retained table belongs to the weight used at that forward.

@@ MinibatchScalarInvestigation question="cursor"

Pin a whole case before editing several fields. The saved comparison includes rows, boundaries, rate, momentum and policy; a combined edit cannot isolate one cause. Reset restores the stated fresh case and clears invalid drafts.

@@ MinibatchScalarInvestigation question="pin"

## 4. How does this become an actual training loop?

The surviving gradient slot now defines the loop boundary. Clear it once, process each physical chunk, step once, and repeat with the actual tail count.

@@ MinibatchLoopDrawing

This complete program implements the scalar calculation. Save it as `trace_update.py`, or use the supplied file. Run `python -B trace_update.py` with PyTorch installed. The recorded execution used Python 3.12.14 and PyTorch 2.14.0 on CPU in float64.

@@ MinibatchFlowProgram file="trace_update.py"

Executed output, rounded to six decimals:

```text
start w=0.000000 grad=None
backward [0, 1] grad=-0.666667 w=0.000000
backward [2] grad=-1.666667 w=0.000000
step w=0.166667 momentum=-1.666667
clear grad=None w=0.166667
```

The two lines labeled `backward` recover the separate contributions in §3. The final clear preserves both the learned weight and momentum. Logging uses scalar values; accumulating graph-connected losses into a list and calling backward only at the end would retain the chunks' graphs and undermine the activation-memory purpose.

### The final partial group is an actual update

For the ten-row example in §1, the effective groups have sizes eight and two. Divide the first group's summed losses by eight and the last group's summed losses by two. If you keep dividing each microbatch mean by the nominal $K=2$, the last group contains only one mean and receives half the intended gradient. If you step only when a microbatch index is divisible by two, the final two examples never produce an update.

If the mass arrives late, preserve raw numerator and mass separately until the boundary.

@@ MinibatchLateMassDrawing

A clear implementation first defines an effective group, counts its actual denominator, then iterates through that group's microbatches. You can buffer its indices or input tensors without keeping their forward graphs. The Iris program uses precisely this layout. Another approach accumulates derivatives of unnormalized loss sums and divides each populated gradient by the final denominator before clipping and stepping. That approach is useful when the denominator becomes known while streaming; it needs extra care with mixed precision as described in §9.

Keeping a small final group is an explicit optimization choice: each completed group produces one update of its own mean loss, so individual examples in a smaller final group receive a larger coefficient in that update. Matching a large-batch reference means matching this same sequence of groups. You can instead drop or carry the tail into the next epoch, but then you have chosen a different data/update schedule and should count it accordingly.

### Implement the new buffer directly

The scalar chain rule already supplied each row's credit. For a feature vector X[i], prediction is the dot product X[i]·w and its half-square derivative is (X[i]·w−y[i])X[i]. One explicitly supplied constant feature column acts as a bias. Each coordinate gets its own persistent slot. With fixed nonnegative mass q[i], multiply that derivative by q[i], add across chunks, then divide by positive total D. Zero-mass rows contribute nothing.

For one row X=[2,−1,1], w=[.2,−.1,.3], y=1, the prediction is .8 and residual −.2; its credit vector is [−.4,.2,−.2]. This is the scalar circuit repeated over feature coordinates, with the sum replacing one multiplication.

`manual-gradient-accumulation.py` implements those products and the external buffer in NumPy. `group_inputs` validates complete, unique partition coverage before computation. `accumulate` allocates one parameter-sized G outside the chunk loop; known-mass mode adds raw_credit/D, while late-mass mode divides the completed raw G only once. Workspace for active features and residuals is bounded by one supplied chunk; parameters and the persistent buffer cost O(feature count). Partition coverage validation stores O(row count) indices; the returned teaching trace retains O(chunk count × feature count) buffer copies and all supplied indices. Finite validation scans bounded blocks. Float64 input arrays are read without writes; coercing lists or another dtype can allocate input storage. Returned parameter and memory arrays are independent, and rejected arithmetic cannot mutate the inputs.

@@ MinibatchFlowProgram file="manual-gradient-accumulation.py"

The library route uses the same float64 vectors, row masses, old parameters and exact previous momentum buffer. A sum reduction plus actual D supplies each PyTorch backward; one optimizer step follows the complete sum. The program compares every derivative and returned parameter/memory coordinate, including an uneven vector case with one zero-mass chunk. It also distinguishes an absent gradient from a supplied zero vector and rejects dropped, duplicated, out-of-range, noninteger, zero-total-mass and overflowing cases. Run `python -B manual-gradient-accumulation.py`; the worked scalar credit is −5/3, the off-quarter scalar credit is 1/75, and weights [.3,.1,.7] in that changed case give −1/110. No training or file writing occurs.

The accepted [scratch reverse-mode engine](/learn-assets/backpropagation/teaching-autodiff.py) clears all reachable gradients on every backward call. To compose it with this loop, allocate external parameter-sized buffers, run a fresh chunk's backward, copy/add each parameter's fresh gradient into those buffers, and release that chunk's graph. After the final chunk, pass the external buffers into the optimizer. PyTorch leaves already populated leaf gradients in place and adds; the scratch engine requires the explicit external add. Their shared chain rule does not imply identical gradient-lifetime defaults.

Keep the exact downloaded `teaching-autodiff.py` beside the following script. Importing it defines the engine without running its example training functions. The external slot survives its two fresh backwards:

```python
import importlib.util
import numpy as np

spec = importlib.util.spec_from_file_location("teaching", "teaching-autodiff.py")
engine = importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine)
Tensor = engine.Tensor
x, y = np.array([1., 2., 3.]), np.array([2., 0., 1.])
w = Tensor(0., requires_grad=True)
G = np.zeros_like(w.data)
for rows in ([0, 1], [2]):
    error = w * Tensor(x[rows]) - Tensor(y[rows])
    loss = (error * error).sum() * (.5 / len(x))
    loss.backward()                   # clears reachable engine grads first
    G += w.grad.copy()                # external addition preserves old credit
w_new = Tensor(w.data - .1 * G, requires_grad=True)
print("group gradient", float(G), "new weight", float(w_new.data))
```

It prints gradient −5/3 and new weight1/6 up to float64 rounding. Each engine backward supplies only its current chunk's derivative; the explicitly copied G is what matches PyTorch's leaf accumulation. This is a composition of the reused differentiation engine and plain SGD, while the complete manual program handles weighted vector data and momentum.

The [full optimizer bridge](/learn-assets/gradient-variants/optimizer_library_bridge.py) returns new state and uses its own fixed hyperparameters. Our local recurrence is v_new=μv_old+g, w_new=w−ηv_new, with no dampening, Nesterov or decay. Goodfellow's book often stores velocity in parameter-change units instead: u_new=μu_old−ηg and w_new=w+u_new. With a fixed rate, u=−ηv connects the two conventions; changing the rate requires care with that correspondence.

## 5. What is one unit of influence?

So far every row owned one equal share. Now supply an importance weight and an inclusion decision for each row. Their product q is that row's objective mass: a=(1,1,weight1), b=(2,1,weight1), c=(3,2,weight3), d=(1,4,weight0,ignored). At w=0, chunk [a,b] has numerator −3 and mass2; [c,d] has numerator −18 and mass3.

@@ MinibatchMassInvestigation question="row"

For a scalar prediction per example, example count was the denominator. Other losses can average over pixels, tokens, output coordinates or target weights. Write the group objective as

$$
L=\frac{\sum_i a_i m_i\ell_i}{\sum_i a_i m_i},
$$

where $a_i\ge0$ is a fixed importance weight and $m_i\in\{0,1\}$ indicates whether item $i$ contributes. Its numerator and denominator add across chunks. This weighted-mean convention is a declared objective; some library losses implement other normalizations.

Changing supplied importance or inclusion changes both rails; regrouping a fixed set of rows leaves the global numerator/mass alone.

@@ MinibatchMassInvestigation question="mass"

@@ MinibatchMassInvestigation question="group"

@@ MinibatchMassInvestigation question="records"

With total mass5, the derivative is −21/5=−4.2. Equal positive-mass chunk means give −3.75; division by three included rows gives −7, and division by all four slots gives −5.25. These coefficients define different objectives. Ignore empty-mass chunks when averaging positive-mass chunk means.

@@ MinibatchMassInvestigation question="rule"

Switch now to two variable-length sequences, rather than the weighted scalar rows. Padding makes the tensor rectangular but adds no eligible target.

@@ MinibatchTargetDrawing

For a concrete unequal case, suppose chunk A has two contributing targets with loss sum 2 and chunk B has six with loss sum 18. Their means are 1 and 3. The target-level mean is $(2+18)/(2+6)=2.5$, whereas the equal mean of chunk means is 2. The same arithmetic applies to derivatives because both routes differentiate these differently weighted objectives.

In language modeling, a batch can contain two sequences of different lengths. If one has two eligible next-token targets and the other six, a token mean gives the longer sequence three times the total mass. A sequence mean first averages each sequence's tokens, then weights the two sequences equally. Both can be intentional objectives; they answer different questions. Padding that carries no target must not increase either one's target count. Target shifting and causal attention are developed in [Language-Model Batches, Attention Masks & Loss Alignment](/learn/topic/language-model-batches-attention-masks-loss-alignment), a later curriculum entry.

The library numerator and denominator must match the declared target kind. Here integer targets [0,1,1,ignore] with class weights [1,3] contribute mass7; a separate causal example shifts the target one position ahead.

@@ MinibatchLossAlignmentDrawing

Common PyTorch conventions need separate attention:

| Loss setup | What to sum | Denominator for the stated mean |
| --- | --- | --- |
| Unweighted class-index cross-entropy | Loss for each eligible target | Number of nonignored targets |
| Class-index cross-entropy with class weights, no label smoothing here | Class-weighted target losses | Sum of the eligible targets' class weights |
| Cross-entropy with probability targets and class weights | Class-weighted cross-entropy per target distribution | Number of target positions; it does not use the preceding class-weight denominator |
| MSE over a tensor with multiple output coordinates | All squared coordinate errors | Number of error elements, unless you explicitly construct another reduction |
| Our half-squared scalar regression | Half-squared error per row | Number of rows, or declared weight sum |

The cross-entropy distinction and `ignore_index` semantics come from the current [loss reference](https://docs.pytorch.org/docs/2.14/generated/torch.nn.CrossEntropyLoss.html); MSE's element reduction is documented in [MSELoss](https://docs.pytorch.org/docs/2.14/generated/torch.nn.MSELoss.html). Use `reduction="sum"` and an explicitly computed group denominator when implementing these objectives across uneven chunks. Do not divide once in the loss and again in the gradient unless the second factor is the intended chunk weight.

If a whole group has no eligible target mass, its mean is undefined. Skip that group's update and its update-based scheduler tick, or reject it as an input-construction error. Avoid evaluating an empty mean and then multiplying NaN by zero. A zero-loss sum from an all-ignored microbatch can contribute zero while other chunks make the group's denominator positive; batch-dependent layers may still change state during that forward.

@@ MinibatchMassInvestigation question="equal-mass"

Equal positive group masses give the same row coefficients under chunk and global means. Identical row derivatives can also produce agreement accidentally despite unequal coefficients; inspect the exact row table before inferring an invariant. All-ignored mass is undefined.

@@ MinibatchMassInvestigation question="nulls"

### Target counting in a current trainer

Transformers 5.17.0's custom-loss contract supplies `num_items_in_batch` for prediction targets across the effective group. In a causal LM the prediction at position i targets label i+1, so count eligible labels in `labels[...,1:]`; when the collator supplies aligned `shift_labels`, count those instead. This caller-supplied denominator controls influence across chunks; it cannot undo the coupled-forward cases in §7.

The following is an API correspondence excerpt for ordinary padded causal labels, not a complete pretrained-model trainer. The caller validates a positive group count and supplies it unchanged to every call. No model download or Trainer execution is part of this CPU lesson.

```python
import torch.nn.functional as F

def grouped_causal_loss(outputs, labels, num_items_in_batch):
    scores = outputs["logits"][..., :-1, :].contiguous()
    shifted = labels[..., 1:].contiguous()
    numerator = F.cross_entropy(
        scores.view(-1, scores.size(-1)), shifted.view(-1),
        ignore_index=-100, reduction="sum",
    )
    return numerator / num_items_in_batch
```

For directly supplied `shift_labels`, use the collator's matching prediction alignment instead of applying this shift again. [Versioned accumulation contract](https://huggingface.co/docs/transformers/v5.17.0/grad_accumulation). Fixed q and D were assumed above: learned masses or a learned denominator require their own product/quotient derivatives, not the fixed-coefficient shortcut.

The same accounting governs evaluation logs. Add detached loss numerators and their denominators over the evaluation dataset, then divide once. Averaging batch means during validation reproduces the small-batch weighting error even when no gradients are computed. Accuracies similarly use total correct divided by total eligible targets. A training loss accumulated while the model changes is an online summary across different parameter states; an evaluation pass at epoch end measures one fixed state. Label those differently.

## 6. Does the same rule work for a real neural network?

The manual vector derivative is enough to accumulate any correctly computed parameter credit. Switch from constructed scalar rows to real flower measurements; the learned model now contains two connected neuron layers.

@@ MinibatchFlowerAnatomy

Fisher's Iris data records sepal and petal length and width for three species. The classification question is whether these measurements help distinguish the species. We use a small neural classifier to ask a narrower training-mechanics question: **can different microbatch partitions produce the same sequence of learned parameters and momentum buffers?**

The packet supplies all 150 observations in [iris.csv](iris.csv). Features are centimeters and class IDs 0, 1, 2 denote setosa, versicolor and virginica. The data is attributed to Fisher through [UCI Iris](https://archive.ics.uci.edu/dataset/53/iris), CC BY 4.0. This CSV is exported from scikit-learn 1.9.1's bundled, corrected variant; scikit-learn documents two corrections relative to the older UCI copy. Row IDs and a header were added, with original row order preserved. See [data-provenance.md](data-provenance.md) for the exact version and checksum.

Before fitting, the program chooses forty rows per species for training and ten per species for validation, using split seed 17. Only training rows determine feature centering and scaling. The validation rows are inspected at epoch ends and are never differentiated. We keep twenty epochs and the stated hyperparameters fixed, with no search or early stopping. A uniform-probability baseline has mean cross-entropy $\log 3\approx1.098612$; predicting one constant species is correct on ten of thirty validation rows. There is no separate final test set in this compact teaching experiment.

The network has shapes `B×4 → B×8 → B×3`: a linear layer, tanh, then a linear output layer. It has no dropout or batch normalization. Both runs clone the same initial model, use the same precomputed shuffled row orders, and use SGD with learning rate 0.05 and momentum 0.9. Their effective groups are `32,32,32,24` each epoch. One run processes each entire group; the other partitions thirty-two as `12+12+8`, and twenty-four as `12+12`. Both make four updates per epoch. Float64 makes the equivalence comparison easy to inspect on CPU.

Real networks have many parameters, and their gradients have matching shapes. For a batch with $B$ rows and $F$ input features, a linear classifier in PyTorch computes

$$
X_{B\times F}W^\top_{F\times C}+b_{C}\longrightarrow
\text{logits}_{B\times C}.
$$

Here $C$ is the number of classes; logits are raw scores. One integer target per row has shape $(B,)$. Cross-entropy combines each row's logits and target into a scalar loss after reduction. `backward()` computes a gradient of shape $(C,F)$ for `nn.Linear.weight` and $(C,)$ for its bias. Averaging the loss does not average the parameter dimensions away. [CrossEntropyLoss shapes and target conventions](https://docs.pytorch.org/docs/2.14/generated/torch.nn.CrossEntropyLoss.html).

The four inputs are centered/scaled by training-only statistics. W₁ multiplies those four coordinates into eight preactivations, b₁ adds eight biases, and tanh forms h. W₂ then multiplies h into three logits z; b₂ adds three output biases. Stable softmax subtracts the largest logit before exponentiating and divides by their sum; −log p[y] judges the supplied class. The ordinary class-index mean here uses one unit of mass per flower.

@@ MinibatchIrisStatus

Inspect the current four coordinate transformations and one hidden/output neuron's actual products. No supplied row ID is a feature.

@@ MinibatchIrisInvestigation question="measurement"

Change the target independently of the measurements: the same p now pays −log of a different class probability.

@@ MinibatchIrisInvestigation question="target"

Reverse starts with δ₂=p−onehot(y). The outer product δ₂⊗h supplies all 3×8 W₂ derivatives; δ₂ directly supplies three b₂ derivatives. Propagating through W₂ᵀ and tanh's factor (1−h²) gives eight hidden credits δ₁. Their outer product with scaled x supplies the 8×4 W₁ derivatives, and δ₁ supplies eight b₁ derivatives: 24+3+32+8=67. Each row's entire set divides by the same actual group D.

@@ MinibatchIrisInvestigation question="coordinate"

The dashed paths land on every coordinate, not just the selected W₂ cell. Changing the class/hidden coordinate draws its actual (p−target)×h credit. Now compare the complete fixed-state group under physical capacities 4/7/12/32 and saved initial/epoch20 states.

@@ MinibatchIrisInvestigation question="group"

All 67 derivatives are compared before one hypothetical update consumes the saved momentum. A new prefix count changes which observations enter this group. Restore a single flower or reset every edit; the named petal action uses original petal length+.5 capped at10, while direct measurement entry accepts any in-range decimal.

@@ MinibatchIrisInvestigation question="restore"

The full runnable program is [train_iris.py](train_iris.py). Keep it beside `iris.csv`; it needs NumPy and PyTorch and performs no downloads. Run:

@@ MinibatchFlowProgram file="train_iris.py"

```text
python -B train_iris.py
```

Read the following central loop with the complete file open. The full file supplies imports, split, normalization, model, fixed orders, evaluation, both training runs and printed results; this excerpt focuses on the update boundary.

```python
for start in range(0, len(order), 32):
    group = order[start:start + 32]
    optimizer.zero_grad(set_to_none=True)
    for offset in range(0, len(group), microbatch_size):
        rows = group[offset:offset + microbatch_size]
        logits = model(features[rows])
        loss_sum = F.cross_entropy(logits, targets[rows], reduction="sum")
        (loss_sum / len(group)).backward()
    optimizer.step()
```

`len(group)` is 24 in the final update, not the nominal 32. No optimizer state changes while a group's chunks are being processed. Consequently, the same aggregated gradient reaches the same optimizer state, which produces the same next state. Repeating that argument explains why equivalence extends beyond the first update.

The completed experiment supplies every epoch rather than only a favorable final score. Loss and accuracy use separate scales, with direct series identities and distinct coincident markers.

@@ MinibatchMeasuredHistory

Recorded CPU results from the supplied program, rounded as printed:

```text
epoch updates train_loss train_correct validation_loss validation_correct
0 0 1.037300 56/120 1.050925 15/30
1 4 0.806121 79/120 0.823158 20/30
5 20 0.340418 101/120 0.324301 27/30
20 80 0.097719 116/120 0.069435 30/30
full_forward_backward_calls 80
accumulated_forward_backward_calls 220
max_parameter_gap 2.914e-16
max_momentum_gap 8.327e-17
uniform_probability_loss 1.098612
constant_class_validation_correct 10/30
```

The accumulated model learns useful structure on this split, and its final parameters and momentum agree with the full-group run within roundoff. The evidence for accumulation is the paired state comparison, not the classification score. The final validation score describes thirty particular rows in one split; it is not a species-recognition guarantee. No runtime or memory benchmark was collected.

### Evaluation selects behavior and suppresses gradient recording separately

Before a training epoch, call `model.train()`. For validation, call `model.eval()` and evaluate within `torch.no_grad()`. The first selects behavior for mode-sensitive layers; the second disables ordinary reverse-mode graph recording for the forward computation. Neither call updates weights. `eval()` alone still permits derivatives; `no_grad()` alone leaves dropout and batch-normalization training behavior active. The supplied model has neither layer, but spelling out both operations makes the loop's intent explicit. [no_grad reference](https://docs.pytorch.org/docs/2.14/generated/torch.no_grad.html), [BatchNorm1d reference](https://docs.pytorch.org/docs/2.14/generated/torch.nn.BatchNorm1d.html).

**Try a direct comparison:** change only `train(12)` to `train(7)`, run it and inspect the number of forward/backward calls together with the final parameter and momentum agreement. Keep effective groups, initialization, optimizer and orders fixed. Practice 4 gives the closed reasoning and a second, stronger variation.

### Own the accumulation rule; reuse the derivative and optimizer engines

The mechanism here is the boundary between losses, accumulated derivatives and one update. The complete [train_iris.py](train_iris.py) owns that boundary in `train`: define actual effective-group rows, clear once, divide each chunk's summed loss by the same real group count, call backward per chunk, and step once. `trace_update.py` makes the gradient slot, parameter and momentum lifetimes visible. These are ordinary PyTorch loops, with the accumulation algorithm expressed explicitly rather than delegated to an opaque trainer.

If you want to reopen the two reused engines, the [Backpropagation lesson](/learn/path/full-curriculum/backpropagation-automatic-differentiation?module=deep-learning-fundamentals) supplies its [scratch differentiation engine](/learn-assets/backpropagation/teaching-autodiff.py) and [matched engine/library bridge](/learn-assets/backpropagation/engine-library-bridge.py). The [Gradient Descent Variants lesson](/learn/path/full-curriculum/gradient-descent-variants-sgd-adam-adagrad-rmsprop-lamb-lars?module=math-foundations) supplies [manual_step and optimizer-state comparisons](/learn-assets/gradient-variants/optimizer_library_bridge.py). The external-buffer composition in §4 explains how their different gradient lifetimes connect to this loop.

The correspondence matters: the scratch sum of per-example derivatives becomes repeated `.backward()` additions into `.grad`; the scratch momentum array becomes SGD's `momentum_buffer`; the scratch update clock becomes exactly one `optimizer.step()` per effective group. Actual state comparisons in the Iris experiment check parameters **and** momentum, so similar accuracy cannot conceal a wrong update schedule. Microbatching reduces simultaneously retained activation graphs, while parameter, gradient and optimizer storage remain. Retaining graph-connected losses until the end would lose that intended memory benefit.

**Changed-constraint exercise.** Keep groups of 32 and change the physical microbatch size to seven. Inspect the final group of 24 as well, preserving all input rows. State the denominator at every backward call, including the short last physical chunk.

<details><summary>Hint and reasoned solution</summary>

A 32-row group has physical sizes 7,7,7,7,4, and each summed loss divides by 32. A 24-row group has sizes 7,7,7,3, and each divides by 24. Each group still advances momentum once. With the existing 120 fitting rows, one epoch has groups 32,32,32,24: nineteen physical forward/backward calls and four optimizer updates. The full-group and accumulated parameter/momentum paths should match to floating-point tolerance because the model has no cross-example operation or stochastic forward layer. An equal average of the five or four physical means changes row weights; a step after each physical chunk changes both parameters and momentum between derivatives.

</details>

## 7. When does the physical partition change the computation?

The arithmetic proof in §3 assumes that partitioning leaves each loss term's computation unchanged. It can fail before gradients are added.

### Batch normalization sees the physical forward batch

The flower network was separable across rows. A shared statistic makes one row depend on the others. In this hand case, x=[0,2,10,12], y=[0,0,1,1], downstream scale θ=1; a divide reads both a centered coordinate and a group-wide variance.

@@ MinibatchNormalizationWorkedDrawing

Suppose a layer receives scalar activations $[0,2,10,12]$. Normalization using their full mean 6 and population variance 26 yields approximately

$$
[-1.176697,-0.784464,0.784464,1.176697]
$$

using $\epsilon=10^{-5}$. If instead `[0,2]` and `[10,12]` are normalized independently, each pair becomes approximately `[-0.999995,+0.999995]`. The third example changes sign: its value 10 is above the full-group mean but below its own pair's mean.

For a downstream trainable scale $\theta$, predict $\theta z_i$ and use half-squared loss against targets $[0,0,1,1]$. At $\theta=1$, the full-group mean gradient is approximately 0.509709, while correctly weighted local-normalization chunks give 0.999990. The denominator is correct in both; the normalized inputs differ. Gradient accumulation has no way to retroactively replace those forward statistics.

A running mean follows the forward clock, separately from the optimizer clock.

@@ MinibatchRunningDrawing

Running statistics also update on forwards. With initial running mean zero and update coefficient 0.1, one full forward stores 0.6. Two local forwards store $0.9(0.1)+0.1(11)=1.19$. Even when microbatches have identical means and variances, their training outputs can agree while their repeated running-statistic updates differ. PyTorch uses a population variance for the current normalization and an unbiased estimate for its running variance; the example above traces only its running mean. [BatchNorm1d semantics](https://docs.pytorch.org/docs/2.14/generated/torch.nn.BatchNorm1d.html).

The live fixture now changes deliberately to x=[1,3,7,9], targets [0,1,0,2], paired physical groups, θ=1 and copied statistics μ=5, variance10. These are different from the hand case above. The lab differentiates only the downstream θ; full upstream normalization derivatives are taught in [Normalization](/learn/topic/batch-layer-group-rms-normalization).

@@ MinibatchNormalizationInvestigation question="row"

Every supplied activation and target remains editable; the selected original input and actual shared divisor both appear before θ multiplies the result.

@@ MinibatchNormalizationInvestigation question="group"

Group assignments need not be contiguous. A one-row local training group violates this lab's declared support, so repair it rather than interpreting a fabricated derivative.

@@ MinibatchNormalizationInvestigation question="records"

Four to eight records can share the case. Change only the downstream scale to see its effect on predictions and θ credits.

@@ MinibatchNormalizationInvestigation question="scale"

Training local statistics, copied frozen statistics and no normalization are distinct forwards. Frozen evaluation statistics define their own fixed computation; they do not replace a training BatchNorm layer universally.

@@ MinibatchNormalizationInvestigation question="rule"

Copy the current full mean/variance into the frozen operands, then edit a row. The copied values stay fixed until you explicitly copy again.

@@ MinibatchNormalizationInvestigation question="frozen"

Identical-statistic pairs x=[0,2,0,2], y=[0,1,0,1] give the same downstream gradient .4999925001, but running mean .1 after one forward and .19 after two. Constant inputs retain ε=1e−5 and give zero normalized activation.

@@ MinibatchNormalizationInvestigation question="nulls"

Layer normalization over features within each independent example does not couple the example axis in this way. A contrastive loss whose negatives come from other batch rows, a batchwise ranking loss, or any operation that explicitly compares examples can have the same partition problem as batch normalization. Choose an implementation that preserves the needed cross-example information; simply adding gradients is insufficient.

### Dropout changes the realized computation

Training dropout samples a mask and scales surviving activations. At drop probability 1/2, the survivors are multiplied by two. If the full and chunked computations use the same realized mask for each example, an otherwise separable loss still accumulates correctly. Separate calls can consume random numbers differently; setting the same seed does not by itself guarantee those masks align across different call shapes.

Hold an explicit realized keep mask fixed before considering randomness. The prior [Dropout lesson](/learn/topic/dropout-droppath-stochastic-depth) explains why surviving activations scale by the inverse keep probability.

@@ MinibatchDropoutInvestigation

For a constructed check, take $x=[1,2,3,4]$, targets $[1,0,1,0]$, prediction $\theta z$ at $\theta=1$, and the half-squared mean loss. A keep-mask `[1,0,1,0]` produces $z=[2,0,6,0]$ and gradient 8. The different mask `[0,1,0,1]` produces gradient 20. Partitioning the first fixed masked array preserves gradient 8. Disabling dropout gives another computation with gradient 6.5. These are exact mask calculations, not sampled learning curves. [Dropout reference](https://docs.pytorch.org/docs/2.14/generated/torch.nn.Dropout.html).

Stochastic equivalence in distribution and equality of one realized update are different claims. The Iris experiment intentionally uses a deterministic, example-separable network so its state comparison isolates the accumulation rule.

## 8. What changes when we draw more examples instead of merely repartitioning them?

The fixed-mask comparison changes no sampling distribution. Return to the original a,b,c gradients [−2,0,−3], and now draw a new subset. Moving a chunk boundary inside a fixed subset is different from sampling a different subset.

@@ MinibatchSampleInvestigation

You can see the finite case exactly using our three row gradients [−2,0,−3]. Uniform single-row sampling has mean −5/3 and variance 14/9. The three equally likely two-row subsets have means [−1,−2.5,−1.5], with the same expectation but variance 7/18. Taking all three rows has no sampling variability at this fixed weight. These are enumerated possibilities, not a fitted learning curve.

At fixed parameters, suppose independently drawn examples yield one gradient component with variance $\sigma^2$. Averaging $B$ such draws gives variance $\sigma^2/B$: the variance of their sum is $B\sigma^2$, and division by $B$ scales variance by $1/B^2$. Its standard deviation therefore shrinks as $1/\sqrt B$. Sampling without replacement from a finite dataset adds a finite-population correction; correlations between examples also change the calculation.

Repartitioning the same effective group into microbatches leaves that group's intended gradient unchanged. Increasing the effective group itself changes how gradients are averaged and how many updates fit into an epoch. A learning-rate scaling rule is therefore a separate optimization choice; it does not follow from the accumulation identity. This is the statistical side of the batching tradeoff introduced in §1. [Dive into Deep Learning, §12.5.2](https://d2l.ai/chapter_optimization/minibatch-sgd.html#minibatches).

### Covariance, curvature and the useful size of a sample

A network gradient is a vector, so a covariance matrix Σ records variation in each coordinate and how pairs of coordinates vary together. Write a sampled row gradient as μ_g+noise with mean-zero noise. Independence makes cross-row covariance terms zero, giving Cov(mean)=Σ/n for n draws. In the finite population of M fixed rows, distinct draws without replacement have covariance −Σ/(M−1) when Σ uses denominator M. Expanding the covariance of their sum then gives

$$
\operatorname{Cov}(\bar g_n)=\frac{\Sigma}{n}\frac{M-n}{M-1}.
$$

For the three reference rows (M=3), take a two-row sample (n=2). First divide the scalar gradient variance 14/9 by 2 to get 7/9. The finite-population factor is 1/2, so multiplying gives 7/18. At n=3 the sample includes the entire finite population and its variance is zero.

With correlated draws, the cross-row terms need not vanish. Sum the covariance of every pair of row gradients, including each row with itself, and divide by the square of the number of draws:

$$
\operatorname{Cov}(\bar g_n)=\frac{1}{n^2}\sum_{i=1}^{n}\sum_{j=1}^{n}\operatorname{Cov}(g_i,g_j).
$$

Nearby correlated examples can provide less independent information than their count suggests.

Lower variance matters through the geometry of the loss. In our half-square model, the slope changes at rate H=(1²+2²+3²)/3=14/3. A curvature matrix H generalizes this local bending to multiple directions.

@@ MinibatchCurvatureDrawing

For a locally quadratic loss at the old parameters, a step −ηg has expected loss

$$
\mathbb E[L_{\mathrm{new}}]\approx L-\eta\|\mu_g\|^2+\frac{\eta^2}{2}\left(\mu_g^\top H\mu_g+\frac{\operatorname{tr}(H\Sigma)}n\right).
$$

The linear term rewards motion along the mean gradient. The quadratic term charges for both its curvature and the sampled noise. The trace sums the noise's curvature-weighted cost over coordinates. When the parenthesized coefficient is positive, differentiating this quadratic in η gives η*=||μ_g||²/(μ_gᵀHμ_g+tr(HΣ)/n). A zero signal offers no positive linear improvement, indefinite curvature need not give a finite minimum, and a large step may leave the local quadratic region. This is a local approximation, not a measured best hardware batch.

The isotropic scalar noise/signal ratio here is (14/9)/(25/9)=14/25. For independent with-replacement sampling the exact quadratic gives E[L_new]=5/6−(25/9)η+η²(14/3)(25/9+14/(9n))/2. Substituting n=1 versus3 isolates sampling variability; repartitioning all a,b,c leaves it unchanged. [McCandlish et al.](https://arxiv.org/pdf/1812.06162) develop the curvature-weighted argument and its empirical limits.

### The optimizer's memory also has a clock

More frequent updates also apply the memory factor more often. With old history1 and β=.9 once per ten supplied items, two five-item transitions require β_new=√.9≈.948683298 to give the same final old-history factor .9. Here supplied items can mean examples or, for a token objective, processed tokens.

@@ MinibatchMemoryInvestigation

After t updates covering c items apiece, old-history weight is β^t. Solving β^(h/c)=1/2 gives item half-life h=−c ln2/lnβ. Keeping it fixed gives β_new=β_old^(c_new/c_old). This equates decay of old history; newly injected gradients and resulting trajectories can still differ.

[Goyal et al.](https://arxiv.org/pdf/1706.02677) motivate linear learning-rate scaling by approximating nearby small steps as using nearly stationary gradients; warmup protects the early period where that approximation is weak. The changed-w early-step example in §3 shows why this is an approximation rather than the exact fixed-w accumulation proof. [Smith et al.](https://arxiv.org/pdf/1711.00489) study changing batch size as a schedule choice, also with a changed trajectory.

[Marek et al., v4, 15 December 2025](https://arxiv.org/html/2507.07101v4) investigate smaller language-model batches while preserving Adam second-moment half-life in processed tokens. Their experiments motivate comparing smaller effective batches and tuning memory consistently with the data clock. The 1.3B comparison used unequal tuning effort between configurations; treat it as evidence in those model/training settings, rather than a universal best-batch rule.

## 9. What else must wait for the group boundary?

### Clipping and schedules

The statistical branch changed which rows are sampled. Return now to a fixed completed group: an operation applied before its contributions join can change the result. Credits3 and−2.5 make that difference visible.

@@ MinibatchClippingDrawing

Gradient clipping limits the norm of a vector. Because it is nonlinear, clipping each chunk and adding differs from clipping the complete gradient. For scalar contributions 3 and −2.5 and a bound of 1, clipping their sum gives 0.5; adding their separately clipped values gives $1+(-1)=0$. To match a clipped full-batch update, first complete the correctly normalized gradient and then clip it once before the optimizer step.

A learning-rate schedule needs a declared clock. An update-based schedule advances after a successful optimizer update, not after each microbatch. An epoch-based schedule advances after the epoch; a metric-driven schedule receives the prescribed validation metric. PyTorch's ordinary scheduler order places the optimizer step first. If four chunks form one update, four scheduler ticks would accelerate an update-based schedule by four. [Optimizer and scheduler reference](https://docs.pytorch.org/docs/2.14/optim.html#how-to-adjust-learning-rate).

For a separate constructed regularization example, stipulate completed data credit .5 at w=2 and R(w)=½w², with fixed coefficient λ=.1. Its derivative λw=.2 joins once, giving total .7.

@@ MinibatchRegularizerDrawing

Regularization has a boundary too. If the objective includes $\lambda R(\theta)$ once per effective update, add its derivative once, or distribute coefficients across chunks that sum to one. Adding the entire regularizer to every chunk's already normalized data loss multiplies its influence. Decoupled optimizer weight decay happens when that optimizer steps; stepping more often changes its application frequency. Detailed optimizer choices belong to the optimization lessons.

### Automatic mixed precision

Mixed precision can compute selected operations at lower precision; loss scaling multiplies the loss and resulting gradients by a scale factor to help represent small gradients. The accumulation contract still begins with the correctly normalized objective.

The accumulated slot has scaled units until one boundary unscale. A known-D gradient is already normalized; the late-D route adds one division before clipping.

@@ MinibatchAmpDrawing

For an AMP update group, use this order:

1. Clear gradients and know the group's target denominator.
2. For each chunk, compute its loss numerator under the appropriate autocast context, divide by the group denominator, and call backward on the scaled result.
3. Keep that scale fixed across the whole group. After the last backward, unscale the optimizer's gradients once.
4. Clip the complete unscaled gradient if requested, then let the scaler attempt the optimizer step and update its scale.
5. Advance an update-based schedule only if the optimizer update actually occurred; clear for the next group.

The scaler can skip an update when gradients contain infinities or NaNs. A skipped attempt still consumed data, so the example clock can advance while the successful-update clock does not. If you accumulate unnormalized sums because the denominator arrives late, normalize the complete unscaled gradient before clipping. The ordering is the same reasoning with normalization moved to the boundary. [AMP accumulation and clipping examples](https://docs.pytorch.org/docs/2.14/notes/amp_examples.html#gradient-accumulation).

### The same denominator problem appears across devices

The same three original scalar records can arrive from two replicas instead of two chunks. Their raw numerator credits still need one shared target mass before the default rank average.

@@ MinibatchDdpDrawing

Under default distributed data parallelism, replicas synchronize gradients and average across ranks. If each of $W$ ranks processes $b$ examples in each of $K$ chunks, the ordinary effective example count is $WbK$. The equality depends on all those contributions receiving the intended weight.

For unequal target masses, let rank $r$ supply numerator $S_r$ and mass $D_r$, with global $D=\sum_r D_r$. The desired gradient is $\nabla\sum_r S_r/D$. Default rank averaging of local means instead gives $\frac1W\sum_r\nabla S_r/D_r$. To recover the global weighted mean under this default averaging convention, each rank differentiates $W S_r/D$; averaging cancels $W$.

For two ranks holding our scalar rows `[a,b]` and `[c]`, the local means have gradients −1 and −3. Their rank average is −2. Scaling local summed gradients as $2(-2)/3$ and $2(-3)/3$ yields a rank average of $-5/3$, recovering the same objective as §3.

DDP's `no_sync()` can defer synchronization during early chunks, but it must surround their forwards as well as backwards. Every rank must follow compatible synchronization boundaries and establish the shared denominator; a rank with zero local mass still participates in the distributed protocol when other ranks have data. Custom communication hooks and uneven-rank termination need their own contract. Continue with [Data Parallelism (DDP)](/learn/topic/data-parallelism-ddp) for that implementation. [PyTorch DDP reference](https://docs.pytorch.org/docs/2.14/generated/torch.nn.parallel.DistributedDataParallel.html).

## 10. Can you change the group and still justify the result?

Attempt each before opening its hint or solution. Exact arithmetic is welcome; compare executed float64 results with a small tolerance rather than requiring byte identity across libraries.

### 1. Count work without hiding the remainder

You have 23 training examples, microbatch size five, and three microbatches per update. Keep every example and flush at epoch end. Give the microbatch sizes, effective group sizes, backward-call count and update count for one epoch. What changes if you turn on loader `drop_last`?

<details><summary>Hint</summary>
List the actual chunks before grouping them. Dropping a short loader chunk is different from dropping an incomplete accumulation group.
</details>

<details><summary>Solution</summary>
Chunks are 5,5,5,5,3. The effective groups are 15 and 8, giving five backward calls and two updates. Their denominators are 15 and 8. With loader drop-last, the last three examples disappear: chunks become 5,5,5,5 and groups 15 and 5, with four backward calls and two updates if the remaining group is flushed. A loop that steps only on multiples of three would incorrectly leave the final five processed examples unapplied.
</details>

### 2. Reconstruct a changed scalar update

Use inputs `[1,2,4]`, targets `[0,1,2]`, initial $w=0$, half-squared mean loss, and SGD learning rate 0.1. Partition as a one-row chunk and a two-row chunk. Compute the correct gradient and weight, then the equal average of chunk-mean gradients. Explain which row the naive rule overweights. Next put all rows in one chunk and predict whether the disagreement remains.

<details><summary>Hint</summary>
The per-row derivative is $(wx-y)x$. First write one derivative per row, then write the coefficient assigned to each.
</details>

<details><summary>Solution</summary>
Derivatives are 0,−2,−8. The correct gradient is −10/3, so the weight becomes 1/3. Chunk means have gradients 0 and −5; their equal average is −2.5, giving weight 0.25. The one-row chunk receives half the objective's total mass, so its first row gets weight 1/2 instead of 1/3. It happens to have zero gradient, which reduces the other rows' combined influence. In one chunk, its mean is already the full mean, so both rules agree. Agreement on that null case does not validate the uneven-chunk rule.
</details>

### 3. Pick the objective for variable-length sequences

Sequence A has three eligible targets with loss sum 6. Sequence B has one eligible target with loss sum 5. Each is padded to length five. Compute the token mean, sequence mean and incorrect padding-count mean. If A's loss numerator has derivative 9 and B's has derivative −1, give the corresponding token-mean and sequence-mean gradients. What should happen if all positions are ignored?

<details><summary>Hint</summary>
The ten tensor slots are not ten targets. For the sequence mean, average within each sequence before averaging across sequences.
</details>

<details><summary>Solution</summary>
The token mean is 11/4=2.75. The sequence mean is (6/3+5/1)/2=3.5. Dividing by ten gives 1.1, incorrectly counting padding. The token-mean gradient is (9−1)/4=2. The sequence-mean gradient is (9/3−1)/2=1. Neither legitimate objective can be selected purely by the number of rectangular tensor slots. With no eligible target mass, the mean is undefined and there should be no optimizer or update-scheduler step for that group.
</details>

### 4. Transfer the Iris loop

First change only the accumulated microbatch size from 12 to 7, keeping the thirty-two-example effective groups and final twenty-four-example group. Predict the twenty-epoch call count and the relationship between the two models' states. Then change the effective-group size in both runs from 32 to 25 and use microbatch limits 25 and 6. State the new group sizes, denominators, update count, and the state comparison you would use. Do not predict a new classification score from the old one.

<details><summary>Hint</summary>
A thirty-two-row group needs five chunks of at most seven; a twenty-four-row group needs four. For the second task, partition 120 into groups of at most 25 before splitting those groups into chunks.
</details>

<details><summary>Solution and success criteria</summary>
The first change gives 3×5+4=19 calls per epoch, or 380 in twenty epochs. There are still 80 updates, with the same effective data and optimizer schedule; float64 parameter and momentum differences should remain close to rounding error. The recorded physical-seven comparison has maximum parameter gap 4.441e−16 and momentum gap 5.551e−17.

With effective limit 25, groups are 25,25,25,25,20, so each epoch has five updates and twenty epochs have 100. The microbatch limit six produces 6+6+6+6+1 for each group of 25 and 6+6+6+2 for the final 20. The denominators are 25 or 20, never the nominal number of chunks. Compare the two new runs' parameters and momentum after the same 100 updates, with identical initialization and row orders. These new runs need not match the old 32-example runs because gradients are evaluated at different intermediate parameter states. This second changed-group experiment is an independent exercise; its classification outcome is not supplied or preselected. Success is a correctly explained and checked paired-state agreement, not beating the earlier score.
</details>

### 5. An exact match breaks after adding a layer

A deterministic classifier's full-group and accumulated updates agreed. You add training-mode batch normalization, preserve the example-weighted denominator, and the gradients now differ. A colleague suggests dividing by one more factor of $K$. Explain why that is the wrong repair. Propose a discriminating check and explain a case where outputs agree yet some model state still differs. Then place unscale, clipping, optimizer step and an update-based scheduler around two AMP microbatches.

<details><summary>Hint</summary>
Compare the activations used to compute each loss before changing a coefficient. Track forward-updated buffers separately from trainable weights.
</details>

<details><summary>Solution</summary>
Batch normalization changes each example's normalized activation according to the examples in the physical forward. An extra factor changes gradient size without restoring those activations. First compare full versus local means, variances and normalized outputs on the same fixed inputs; then repeat with one frozen shared set of statistics. The frozen computation should be partition-invariant in the otherwise separable model. If both chunks have the same mean and variance, current normalized outputs can agree with the full batch, while two running-statistic updates differ from one. For example, mean 1, coefficient 0.1 and initial running mean 0 gives 0.1 after one update and 0.19 after two.

For AMP, keep one scale across both normalized chunk losses and their backwards. Unscale once after both; clip the complete unscaled gradient; attempt the optimizer step; update the scaler; advance the update-based scheduler only for an accepted optimizer update. Clearing between the backwards discards the first chunk. Changing the scale between them mixes incompatible gradient units.
</details>

### Implementation files

@@ MinibatchFlowFiles

### References & another way to learn it

**Alternate explanations and practice**

- [PyTorch, Optimizing Model Parameters](https://docs.pytorch.org/tutorials/beginner/basics/optimization_tutorial.html) — beginner article and runnable tutorial connecting loss, backward and optimizer steps. Read after §2. Its simple batch-mean reporting should be adapted using §5 when batch sizes differ; its FashionMNIST setup downloads data, while this lesson's Iris route is offline.
- [Zhang, Lipton, Li and Smola, Dive into Deep Learning §12.5: Minibatch Stochastic Gradient Descent](https://d2l.ai/chapter_optimization/minibatch-sgd.html) — free textbook chapter linking vectorized computation, gradient variability and mini-batch optimization. Read after §4 for the systems/statistics connection. Its vectorization, variance and scratch/library routes extend the core loop; hardware timings belong to the book's environment.
- [PyTorch, Training with PyTorch — video and companion notebook](https://docs.pytorch.org/tutorials/beginner/introyt/trainingyt.html) — a guided alternate walkthrough from datasets to a training/validation loop, suitable after the first scalar trace. Use its companion article and training/validation code as an alternate route; the embedded video was not watched for this lesson. It assumes the preceding PyTorch video-series material and uses FashionMNIST and TensorBoard. Keep this lesson's explicit accumulation boundary when adapting its one-batch-per-step loop.

**Precise API and data references**

- [CrossEntropyLoss](https://docs.pytorch.org/docs/2.14/generated/torch.nn.CrossEntropyLoss.html), [MSELoss](https://docs.pytorch.org/docs/2.14/generated/torch.nn.MSELoss.html), and [zero_grad](https://docs.pytorch.org/docs/2.14/generated/torch.optim.Optimizer.zero_grad.html) — inspect the reduction, target-type and missing-gradient semantics when adapting the programs. These annotations refer to the reviewed PyTorch 2.14 snapshot.
- [BatchNorm1d](https://docs.pytorch.org/docs/2.14/generated/torch.nn.BatchNorm1d.html) and [Dropout](https://docs.pytorch.org/docs/2.14/generated/torch.nn.Dropout.html) — reference contracts behind §7's physical-batch and realized-mask examples.
- [AMP examples](https://docs.pytorch.org/docs/2.14/notes/amp_examples.html#gradient-accumulation) and [DDP](https://docs.pytorch.org/docs/2.14/generated/torch.nn.parallel.DistributedDataParallel.html#torch.nn.parallel.DistributedDataParallel.no_sync) — intermediate execution references after §9. Their CUDA/distributed examples were read, not run in this CPU packet.
- [Fisher, Iris, UCI Machine Learning Repository](https://archive.ics.uci.edu/dataset/53/iris) and [scikit-learn load_iris](https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_iris.html) — attribution, feature meanings and the corrected bundled variant. The packet's provenance record distinguishes its offline export from the older UCI file.

- [Goodfellow, Bengio and Courville, Deep Learning chapter 8](https://www.deeplearningbook.org/contents/optimization.html) — second canonical treatment of sampled objectives, SGD and momentum. Reconcile its velocity units with §4 before comparing code.
- [McCandlish et al., An Empirical Model of Large-Batch Training](https://arxiv.org/pdf/1812.06162) — original local curvature/noise-scale derivation; read after §8 and retain its assumptions.
- [Goyal et al., Accurate, Large Minibatch SGD](https://arxiv.org/pdf/1706.02677) and [Smith et al., Don’t Decay the Learning Rate, Increase the Batch Size](https://arxiv.org/pdf/1711.00489) — original conditional scaling and schedule studies, rather than guarantees of identical state.
- [Marek et al., Small Batch Size Training for Language Models, v4](https://arxiv.org/html/2507.07101v4) — dated modern research connecting processed-token memory to batch choice. Compare the tuning protocol before transferring its recommendation.
- [Transformers 5.17.0 accumulation](https://huggingface.co/docs/transformers/v5.17.0/grad_accumulation) — current caller-supplied target count, causal shift and custom-loss contract behind §5.

### Check readiness and continue

Without looking back, identify the examples and denominator belonging to one update, explain why backward leaves weights unchanged, distinguish gradient clearing from optimizer memory, and handle a partial final group. Then explain why a correct accumulation sum can still differ from a physical large batch with training-mode batch normalization. If these are clear, you have a useful contract against which to judge a real training run.

The next topic in this module is [Neural Training Diagnostics & Reproducible Experiments](/learn/topic/neural-training-diagnostics-reproducible-experiments). It uses this correct-loop contract to isolate faults, design controlled comparisons and decide what training evidence supports. Later [Mixed Precision Training (FP16, BF16, TF32)](/learn/topic/mixed-precision-training-fp16-bf16-tf32) and [Data Parallelism (DDP)](/learn/topic/data-parallelism-ddp) develop the specialized execution branches introduced here.

