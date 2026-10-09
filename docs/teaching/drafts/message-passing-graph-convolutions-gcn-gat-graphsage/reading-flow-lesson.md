# Message Passing & Graph Convolutions (GCN, GAT, GraphSAGE)

<!-- Revision-4 complete manuscript, author reading corrections saved: all eleven sections, four complete instructional programs and thirteen solved practices. Independent complete-content review and runtime remain pending. Figure markers refer to the accepted design/F1–F3 amendment plus the documented D33-renormalization clarification; they are not implemented drawings. No phase-completion claim. -->

**Explore as you read.** Change a paper's numbers or one permitted relationship and follow the information into its neighbors' new representations. Later, inspect the same operations inside a real saved graph model.

**First pass:** read §§1–6, try practice 1–5, then follow the next-study route. Return to the visible deeper branches in §§4 and 7–9 for aggregation variants, spectral reasoning, structural limits and sampling. You need vectors, matrix multiplication, an affine neural layer, activation, supervised loss and one gradient update. The relevant graph objects and notation are introduced here.

The preceding [Cross-Attention lesson](/learn/path/full-curriculum/interleaved-cross-attention-architectures?module=deep-learning-fundamentals) describes a receiver reading from allowed sources. Here relationships specify the allowed sources, and every source can acquire a new representation too. That connection will help with graph attention; the first neighborhood calculation requires only addition.

## 1. Decide what the graph represents

### How can relationships help us understand a paper?

Read the picture from its three papers to their number rows, then along the relationships that permit an exchange.

<!-- figure: D01 -->

Paper 0 has the row `(1, 0)`, paper 1 has `(2, 1)`, and paper 2 has `(4, −1)`. Each circle is one paper, called a **node**. Each entry in its row is a **feature**: a number available as input. A row with two entries has two **channels**, so every paper has the same kind of two-number description. These constructed numbers make the arithmetic inspectable; they are not measured word counts or class labels.

The line between papers 0 and 1 is an **edge**. In this example its label permits messages in both directions. Paper 1 can use paper 0's information, and paper 0 can use paper 1's information. The other edge permits the same exchange between 1 and 2. There is no direct edge between 0 and 2. The collection of nodes and relationships is a **graph**.

A model that reads each row independently has no way to use those relationships. A graph layer can form a new row for each paper from its own row and the rows it is allowed to read. That new row is its **representation**: a numerical description computed from the available context. A later prediction layer can turn the representation into scores for paper subjects.

The larger route in the picture separates those jobs: supplied rows and relationships → updated node representations → task outputs. The graph layer learns how to combine information; it does not receive the desired subject as an input. A citation might help resolve an ambiguous paper, but a relationship can also connect opposing arguments. **Homophily** means connected nodes tend to share the particular property of interest. It is a pattern to assess, not an assumption built into the definition of an edge.

In structure drawings, supplied rows are cyan, learned parameters amber, computed rows violet, and operations neutral. Solid arrows carry values forward; later orange dashed arrows carry gradients backward. A numeric grid uses a separate labelled sign rule: warm positive cells, blue negative cells and neutral zeros. The written values and labels carry the meaning as well as colour.

### Which way does a message travel?

Follow the arrow's source to its receiver, then find the same permission in the matrix and edge list.

<!-- figure: D02 -->

In the directed example, the arrow `0 → 1` permits paper 1 to read paper 0. Its source is 0 and its receiver is 1. The arrowhead is at the receiver. Reversing it changes the allowed computation, even though the same papers remain present.

The matrix expresses that permission as a cell. **Rows name receivers; columns name sources.** Therefore `A[1, 0] = 1` permits `0 → 1`. The reversed permission is a different cell, `A[0, 1]`. A zero cell means that source does not send to that receiver in this operation. The symbol `A` names this **adjacency matrix**: a stored table of permitted relationships.

An edge list stores the same information without all the zero cells. Its first row holds source IDs and its second row receiver IDs. The column `(0, 1)` therefore matches `A[1, 0]`, not `A[0, 1]`. For the original undirected path, store four directed columns: `0 → 1`, `1 → 0`, `1 → 2`, `2 → 1`.

\[
A=\begin{bmatrix}0&1&0\\1&0&1\\0&1&0\end{bmatrix},\qquad
\texttt{edge\_index}=\begin{bmatrix}0&1&1&2\\1&0&2&1\end{bmatrix}.
\]

The matrix has three rows and three columns because there are three nodes. The edge list has two rows and four columns because there are four permitted directed messages. IDs select stored objects; they are not node features.

```python
import torch

features = torch.tensor([[1., 0.], [2., 1.], [4., -1.]],
                        dtype=torch.float64)
edge_index = torch.tensor([[0, 1, 1, 2], [1, 0, 2, 1]],
                          dtype=torch.long)
source, target = edge_index
adjacency = features.new_zeros((3, 3))
adjacency[target, source] = 1
```

`features` has one row per paper. Each edge-list column becomes one receiver-row/source-column cell. This construction uses unique, unweighted edges. Later sparse programs keep that contract; a weighted editor deliberately uses numerical edge strengths instead.

### What changes when a graph has more papers?

The same storage rule applies to every node; new rows do not require a new kind of layer.

<!-- figure: D02a -->

Increase the constructed graph from three nodes to six and inspect its node IDs and number rows. Existing rows retain their values. New rows begin at zero and have no off-diagonal permission until you add one. Shrinking the graph removes the corresponding rows and both adjacency axes. Selecting the node count changes storage size, not the meaning of a feature channel.

### What does an edge strength change?

Trace one selected source–receiver cell and its matching arrow while changing the amount sent along it.

<!-- figure: D02b -->

Select a source and a different receiver, then set that edge's weight between 0 and 4. Weight 0 removes its contribution. Weight 2 sends twice the value sent by weight 1 under the coming weighted-sum operation. This is a fixed relationship weight, distinct from the learned channel weights introduced in §3. Every permitted pair can be edited independently.

### When should the reverse permission change too?

Compare the two directional cells before linking their edits.

<!-- figure: D02c -->

The paired-edit option represents an undirected strength: an edit updates both `A[v, u]` and `A[u, v]`. If the two existing strengths differ, enabling paired editing first assigns their maximum to both cells. The picture displays the reconciled values so that this state change is visible. A directed problem keeps the two permissions independent. Removing all nonself edges leaves the node rows available for the own-state operation taught next.

### What is one prediction about?

Follow the same node table into three different output routes.

<!-- figure: D03 -->

A **node task** places a prediction layer on each requested node row: three nodes can produce three rows of class scores. An **edge task** selects two endpoint representations and scores a candidate relationship. Scoring the candidate `0 → 2` does not add that relationship to the message graph; its possible existence is the question being asked. A **graph task** first combines all node rows into one graph row, then predicts one quantity for the whole example.

The graph-task merge in the picture is a sum. A merge that produces a graph-level representation is called a **readout**. Here it adds the input rows to `(7, 0)`. A sum readout is appropriate when the following computation needs additive information; a mean or a more elaborate readout expresses another choice. These are output units, not three incompatible ways of storing the graph.

### Does moving a row change which paper it represents?

Follow semantic paper IDs through a reordered table and its correspondingly reordered relationships.

<!-- figure: D04 -->

Take only the first channel, so the rows are `1, 2, 4`. Use the small operation “own value plus incoming values.” Paper 0 becomes `1 + 2 = 3`; paper 1 becomes `2 + 1 + 4 = 7`; paper 2 becomes `4 + 2 = 6`.

Now store papers in the order `[2, 0, 1]`. Their input rows are `[4, 1, 2]`. Reorder both axes of the adjacency to keep each relationship attached to the same semantic IDs. The computed rows become `[6, 3, 7]`: paper 2 still has 6, paper 0 still has 3, and paper 1 still has 7. The outputs moved with their objects. This is **permutation equivariance**.

The graph sum remains `3 + 7 + 6 = 16` in either order. A graph output that stays unchanged under this reordering is **permutation invariant**. Node outputs and graph outputs require different statements because the former still have identities.

To write that same check compactly, call the node feature table `H`: each row belongs to one node, and each column is a feature channel. Let `Q` be the matrix that reorders those rows. A superscript `ᵀ` means **transpose**: interchange a matrix's rows and columns. For this permutation matrix, `Qᵀ` also undoes the reorder. Input features become `QH`. Adjacency becomes `QAQᵀ`: multiplication on the left reorders receiver rows, and multiplication on the right reorders source columns, keeping both endpoints attached to their papers. If `F` is the node update, equivariance means

\[
F(QH,QAQ^\mathsf T)=QF(H,A).
\]

Reordering only the feature rows fails to preserve the original graph. That bug attaches a relationship to the wrong paper. The independent batch and storage-order checks later in the lesson use this same principle.

## 2. One synchronized message-passing round

### How does one neighbor change a receiver?

Trace paper 1's two incoming values through the sum and its own-state addition.

<!-- figure: D05 -->

From §1, paper 1 may read papers 0 and 2. Their first-channel values are 1 and 4. The two **messages** in this first example simply carry those values unchanged. Combining the incoming messages gives `1 + 4 = 5`; this combination is the **aggregation**. Adding paper 1's own value 2 produces its new state `2 + 5 = 7`; that final rule is the **update**.

The picture separates the operations so that one contribution can be followed end to end. Sender 0's row supplies 1, the identity-message operation sends 1, the aggregation receives 1, and the update adds it to the other message and the own state. A nonneighbor has no message wire into this receiver.

Let `h_v` name node `v`'s current state and `h'_v` its next state. For this first scalar rule,

\[
h'_v=h_v+\sum_u A_{vu}h_u.
\]

The summation collects the incoming contributions. With the weighted graph from §1, each contribution is `A[v,u] × h[u]`; a zero cell contributes zero. The own-state term is separate. We will say explicitly when a later operator instead adds self-loop entries inside its aggregate.

```python
current = features[:, :1]  # First channel, shape (nodes, 1).
next_state = current + adjacency @ current
```

Matrix multiplication performs the same row-by-row calculation as the drawing: receiver row 1 multiplies source column 0 by 1 and source column 2 by 4, then adds the products. With the original path, the complete next table is `[3, 7, 6]`.

### Which input can I change without changing the rule?

Follow any selected node's current value into every receiver permitted to read it.

<!-- figure: D05a -->

Select a semantic node and change its scalar feature between −8 and 8. The graph permissions stay fixed. Changing paper 2 from 4 to −1 changes paper 1's result from 7 to `2 + 1 − 1 = 2`. Paper 0 still becomes 3 after this one round, because it cannot read paper 2 directly. A negative message is a numerical contribution, not a negative class label.

The general **message-passing neural network** separates three choices. A function `M` constructs a message using the sender, receiver and any edge features. A reducer `AGG` combines that receiver's incoming messages. A function `U` combines the aggregate with the receiver's previous state. To label those stages, `ℓ` counts computation rounds, `e` holds any supplied edge description, and `𝒩(v)` is the list of sources allowed to send to `v`. Write a message as `m`, its receiving aggregate as `a`, and a node state as `h`; their superscripts identify the round:

\[
m_{u\to v}^{(\ell)}=M_\ell(h_u^{(\ell)},h_v^{(\ell)},e_{u\to v}),\qquad
a_v^{(\ell)}=\operatorname{AGG}_{u\in\mathcal N(v)}m_{u\to v}^{(\ell)},\qquad
h_v^{(\ell+1)}=U_\ell(h_v^{(\ell)},a_v^{(\ell)}).
\]

Our first example uses the sender unchanged, sums messages, and adds the own state. Learned maps will make `M` and `U` richer. Shared functions let the same layer operate on different node counts; sum, mean and max do not require a fixed neighborhood size.

### Why must every node read the old table?

Compare a separate next-state buffer with overwriting a value while another receiver still needs it.

<!-- figure: D06 -->

Use a two-node example here because it isolates the storage error. The current values are `[1, 3]`, and each node takes the mean of itself and its neighbor. Both receivers should read exactly those old values. Both means are `(1 + 3) / 2 = 2`, so the correct next table is `[2, 2]`.

The faulty route updates node 0 first and writes 2 into the old table. Node 1 then reads the changed 2 alongside its own 3, producing 2.5. Its result depends on the processing order rather than just the stated layer. Processing node 1 first instead gives `[1.5, 2]`.

```python
old = torch.tensor([1., 3.], dtype=torch.float64)
new = torch.empty_like(old)
new[0] = (old[0] + old[1]) / 2
new[1] = (old[1] + old[0]) / 2
old = new
```

The new buffer may be filled in either order because every expression reads the unchanged old buffer. A **synchronous** round has this dependency structure; it does not mean every CPU instruction literally executes at the same instant.

### What exactly changes when I reverse the processing order?

Follow the same old inputs into the correct branch and the deliberately faulty branch.

<!-- figure: D06a -->

The order control changes which node is overwritten first in the faulty calculation. The correct calculation stays present and has the same semantic result. Equal old values provide a useful null case: an overwrite may accidentally preserve the correct answer, so passing that one case does not establish correct buffering.

### What happens if the overwrite is repeated for several rounds?

Compare the complete correct and faulty trajectories under the same current graph, values and round count.

<!-- figure: D06b -->

This view returns to the constructed graph editor. Its in-place comparison changes only the named update algorithm; the synchronous branch remains visible. Rounds range from 0 to 4. At round 0 both branches are the initial state, and at later rounds the picture identifies which old or overwritten value each message used. Comparing algorithms should preserve the other inputs.

### How far can two rounds carry information?

Follow paper 2's initial feature through separate copies of the path at successive rounds.

<!-- figure: D07 -->

Return to the original three-paper path and own-plus-incoming-sum rule. At round 0 the table is `[1, 2, 4]`. At round 1 it is `[3, 7, 6]`. At round 2 it is `[10, 16, 13]`. Paper 0 now receives paper 1's updated value 7, which includes paper 2's original 4. The unfolded picture keeps the same semantic IDs while showing distinct round-specific states.

Change paper 2's original value by `δ`. Paper 0 changes by zero after one round and by `δ` after two. Information travels through the chain `2 at round 0 → 1 at round 1 → 0 at round 2`. For a purely local layer with fixed graph and parameters, `ℓ` rounds have support within at most `ℓ` graph hops. A **hop** is one traversed edge.

Being reachable does not ensure an effect: a zero message weight can erase that route. Graph-wide feature normalization or a learned graph construction can also create dependencies outside this fixed local-update argument. We return to those boundaries when defining data access and batching.

### Can I compare the new trajectory with one I already inspected?

Keep a copied graph, initial table and computed states alongside the current trajectory.

<!-- figure: D07b -->

Pinning captures the current inputs, round count, loop/order/algorithm settings and outputs. A later edit changes the current branch without mutating that copy. The labels retain the pin's semantic node IDs and settings. Resizing clears the pin because its node set no longer describes the same editor context. This comparison distinguishes changing one input from accidentally changing the computation or the reference itself.

## 3. GCN: a normalized weighted sum

### What changes when every node also reads itself?

Count the incoming permissions before and after adding one self read at every node.

<!-- figure: D08 -->

The first sum rule kept the own-state addition separate. For the next operator, add a **self-loop**: a permission from a node to itself. Each of the three papers now appears once in its own incoming list. The path's closed incoming counts are 2, 3 and 2: node 0 reads 0 and 1; node 1 reads 0, 1 and 2; node 2 reads 1 and 2.

These counts are the **closed degrees**. They describe the graph after adding the self reads, not the numerical magnitudes of the features. Write the resulting adjacency as `B = A + I`, where the identity matrix `I` adds one to each diagonal entry. Multiplying `B` by a column of ones, written `1`, adds each row's entries. Let `d = B1` be those row sums and `D` the diagonal matrix containing them:

\[
B=\begin{bmatrix}1&1&0\\1&1&1\\0&1&1\end{bmatrix},\qquad
d=(2,3,2),\qquad D=\operatorname{diag}(2,3,2).
\]

The loop toggle acts on this taught permission. For an otherwise empty graph, enabled loops give degree 1 and an own-value read. Without loops a zero-degree receiver has no incoming contribution. Our editor uses a zero aggregate there; the invertible coordinate argument below requires positive degrees.

### How much does each sender contribute to paper 1?

Trace each source's feature, both endpoint degrees, its normalization factor and the resulting product.

<!-- figure: D09 -->

We want a connected high-degree node's aggregate to have a controlled scale. A **graph convolutional network**, or **GCN**, uses one normalization factor for each endpoint of a message. For source `u` and receiver `v`, the factor is `1 / √(d_u d_v)` on an unweighted permitted edge.

Paper 1 has degree 3. Sources 0 and 2 have degree 2, so their factors are `1/√6`. Paper 1's own factor is `1/√(3×3) = 1/3`. Its incoming products are `1/√6`, `2/3`, and `4/√6`. Their sum is

\[
\frac1{\sqrt6}+\frac23+\frac4{\sqrt6}=2.707908118985982.
\]

Applying the same rule at all three receivers produces `[1.3164965809, 2.7079081190, 2.8164965809]`. The picture shows those three rows and their actual source products. Collect the factors into a matrix `S`. The diagonal matrix `D⁻¹/²` has entries `1/√d_v`: it divides each associated coordinate by the square root of its degree. Its position on both sides of `B` supplies the source and receiver factors. With the current first-channel column called `x` and the next-state column called `h'`, the complete operation is

\[
S=D^{-1/2}BD^{-1/2}
=\begin{bmatrix}
1/2&1/\sqrt6&0\\
1/\sqrt6&1/3&1/\sqrt6\\
0&1/\sqrt6&1/2
\end{bmatrix},\qquad h'=Sx.
\]

For weighted nonnegative relationships, `B[v,u] / √(d_v d_u)` is the coefficient and degrees are current sums of edge strengths.

These coefficients are not probabilities: the rows sum to approximately `0.908248`, `1.149830`, and `0.908248`. Feeding all ones therefore does not return all ones. This differs from simply averaging a receiver's incoming list.

### What changes when I edit a value or a relationship?

Keep the current scalar values separate from the current degree-weight calculation.

<!-- figure: D09a -->

Select any of the three nodes and edit its feature between −8 and 8. The normalizing coefficients do not change, because the relationships did not change. Only the products that use that feature change.

<!-- figure: D09b -->

Select any of the three undirected pairs and edit its strength between 0 and 4. Now the endpoint degrees change, so every affected normalization factor is recomputed. Adding the previously absent `0—2` relationship changes more than the newly added product. This is why a cached operator must be invalidated when the graph changes.

<!-- figure: D09c -->

Removing the automatic loops changes the degrees and permitted self contributions. Each zero-degree row uses the stated zero-aggregate arithmetic policy, and the picture marks degree-divided coordinates unavailable at that row.

### How is receiver averaging related to symmetric normalization?

Compare the same raw input, then follow two complete routes that convert its coordinates.

<!-- figure: D09d -->

An ordinary receiver average divides every incoming edge by the receiver's degree. Its matrix is `P = D⁻¹B`. On our path it produces `[1.5, 7/3, 3]` from `[1, 2, 4]`. Those values differ from `Sx`, so exchanging the two operators while keeping the raw input fixed changes the computation.

The second pair of routes explains their relationship. First change the input to `f = D⁻¹/²x`: `[0.70710678, 1.15470054, 2.82842712]`. Receiver averaging of this converted input gives approximately `[0.93090366, 1.56341148, 1.99156383]`. Alternatively, compute `Sx` first and divide that result by the corresponding square-root degrees. The same three values emerge.

For a fixed undirected graph with nonnegative edge strengths and positive degrees,

\[
P=D^{-1/2}SD^{1/2},\qquad
Pf=D^{-1/2}Sx\quad\text{when }f=D^{-1/2}x.
\]

The conversion changes the input as well as the output. Because every degree is positive, the diagonal conversion can be reversed. This is **similarity** of the two linear operators: they describe the same linear action in differently scaled coordinates. On a regular graph, all degrees equal one another and `P = S`. General directed graphs and zero-degree conversions require different reasoning. In §7, we will introduce the patterns preserved by an operator and use this same conversion to compare their propagation gains.

The operator choice compares two already taught rules. Both current results remain visible; it does not hide one behind an investigation mode. In §7 we reuse these coordinate routes to explain which values become equal under repeated propagation.

### Which operation mixes channels, and which mixes nodes?

Follow each paper's two-channel row through a shared learned map, then follow projected source rows into receivers.

<!-- figure: D10 -->

Return to the two-channel table from §1. The learned matrix has two output rows:

\[
W=\begin{bmatrix}1&0.5\\-1&2\end{bmatrix}.
\]

Its first output is `channel 1 + 0.5 × channel 2`; its second is `−channel 1 + 2 × channel 2`. It turns the three rows into `(1, −1)`, `(2.5, 0)`, and `(3.5, −6)`. The same matrix acts on every paper. Its entries are learned parameters; the node IDs never select different copies of them.

`S` then mixes rows along graph permissions. For receiver 1, the first projected channel becomes `1/√6 + 2.5/3 + 3.5/√6 ≈ 2.6704506404`; the second becomes `−1/√6 − 6/√6 ≈ −2.8577380332`. Applying ReLU replaces that negative second result by zero.

As in §1, `H` stores node rows. Each row multiplies `Wᵀ` to produce its output channels; this is the row-table form of applying the output-by-input map `W` to a column vector. Let `b` be one learned output-channel bias shared across nodes. The product `1bᵀ` repeats that bias as one row per node. With `H'` naming the next table, the layer is

\[
H'=\operatorname{ReLU}(SHW^\mathsf T+\mathbf1b^\mathsf T).
\]

`S` mixes nodes; `Wᵀ` mixes channels. Before bias and activation, `S(HWᵀ) = (SH)Wᵀ` by associativity. Moving an activation between those multiplications generally changes the result. The downloadable dense study stores its weight in input-by-output form; its matrix is `W_old = Wᵀ`. That transpose changes storage convention, not the intended layer.

The shared-entry control edits `W[0,1]`. The corresponding term changes at every node, and the gradient contributions from all supervised uses accumulate into that one parameter. §6's sparse implementation projects rows once and gathers them along edges rather than allocating a dense node-by-node message table.

### Why does the bias position matter?

Follow the same bias through two circuits and compare their receiver rows.

<!-- figure: D11 -->

Use the scalar path again and bias `b = 1`. Adding the bias before graph mixing produces `S(x + 1b) ≈ [2.224745, 3.857738, 3.724745]`. Adding it afterward produces `Sx + 1b ≈ [2.316497, 3.707908, 3.816497]`.

The difference is visible in the route: a pre-mixing bias is sent through every allowed message coefficient, so receiver `v` gets `b × rowSum_v`. A post-mixing bias is added exactly once. Their difference is

\[
S(x+\mathbf1b)-(Sx+\mathbf1b)=(S\mathbf1-\mathbf1)b.
\]

The unequal row sums from D09 explain the unequal results. Bias zero makes the circuits coincide; an operator whose rows sum to one also makes them coincide. The ordinary `GCNConv` comparison below uses post-aggregation bias. A declared pre-mixing affine rule is a different operator, not a universally invalid one.

### Which shared parameter does a training error change?

Trace one receiver's aggregate through its prediction and loss, then follow the gradient back to the same weight.

<!-- figure: D12 -->

Receiver 0's aggregate is `a = 1.3164965809`. A shared scalar weight `w = 0.5` gives prediction `aw = 0.6582482905`. Its supervised target is 1. The half-squared loss is `L = (aw − 1)²/2 ≈ 0.0583971155`.

Changing `w` changes the prediction by `a` per unit weight. Changing the prediction changes the loss by its residual `aw − 1`. Multiplying these two local effects gives the derivative with respect to the shared weight:

\[
\frac{\partial L}{\partial w}=a(aw-1)\approx-0.4499149571.
\]

With step size `η = 0.1`, gradient descent subtracts `η × derivative`, giving `w_new = 0.5449914957`. The new prediction is `0.7174794407`, closer to 1. The target enters the loss route; it is never sent through graph edges as a feature.

```python
aggregate = torch.tensor(1.3164965809277258, dtype=torch.float64)
weight = torch.tensor(.5, dtype=torch.float64, requires_grad=True)
loss = .5 * (aggregate * weight - 1).square()
derivative, = torch.autograd.grad(loss, weight)
new_weight = weight.detach() - .1 * derivative
```

The complete `message-passing-operators.py` program computes the aggregate using sparse messages before tracing this update. It reuses tensor arithmetic and autograd; it writes the graph normalization, gather and receiving sum explicitly.

### Do all receivers teach the shared weight the same lesson?

Follow the selected receiver, target and current weight into one complete supervised route.

<!-- figure: D12a -->

Select receiver 0, 1 or 2, set its target between −8 and 8, and set `w` between −4 and 4. The graph and feature context remains the one edited in D09. The displayed aggregate, prediction, residual and derivative all come from that same current context. With multiple supervised receivers the shared weight receives the sum, or the explicitly chosen mean, of their loss contributions.

### How large a step should be applied?

Compare the current loss with the loss at the exact proposed weight before applying the change.

<!-- figure: D12b -->

The step-size control ranges from 0 to 1. At receiver 1 on the original path, with `w = 0.5`, target 1 and `η = 0.5`, the exact proposal is approximately `0.0207624643`. The loss increases from `0.0626417381` to `0.4453576586`: this step overshoots the minimum.

For this scalar quadratic with aggregate `a ≠ 0`, the residual after a step is `(1 − ηa²)` times the old residual. A nonzero residual decreases in magnitude when `0 < η < 2/a²`; rate zero leaves it unchanged, and `η = 2/a²` preserves its magnitude with reversed sign. If `a = 0`, this loss has no weight gradient. This exact argument concerns the fixed scalar loss; an arbitrary nonlinear training objective needs its own step-size assessment.

Applying the proposal uses its full precision, not its displayed rounded value. If it lies outside the editor's supported weight range, the Apply action explains the proposed value and leaves the current weight unchanged. Reducing the step size remains available. Clipping a weight would implement a different update.

GCN gives us a shared learned channel map and fixed graph-derived mixing factors. The next question is which part of that combination we want to change: the treatment of the own state, the incoming summary, or the coefficients assigned to different senders.

## 4. GraphSAGE and GAT change the aggregation decision

### Why keep myself separate from my neighbors?

Follow the own-state branch and the neighbor-mean branch to their distinct learned coefficients.

<!-- figure: D13 -->

GCN included the own state among normalized messages. **GraphSAGE** can instead summarize neighbors and apply a separate map to the own state. Use a new small neighborhood here because three donors make the summary and its alternatives easier to inspect. The receiver's own value is 4; its three neighbors carry 1, 3 and 5. The neighbor mean is `(1 + 3 + 5) / 3 = 3`.

Give the own branch coefficient 2 and the neighbor branch coefficient 1. The new scalar state before activation is `2 × 4 + 1 × 3 = 11`. Each learned coefficient has a distinct job: retain or transform the own information, and retain or transform the summary. A zero-neighbor receiver keeps its own branch; in this layer an empty incoming list supplies the explicit zero summary.

With vectors, let `W_self` map the own state, `W_neighbors` map the mean, and `b` be the shared post-map bias. Write the neighbor mean as `h̄_v` and the number of incoming occurrences as `|𝒩(v)|`. The mean-SAGE layer we implement is

\[
\bar h_v=\begin{cases}
\frac1{|\mathcal N(v)|}\sum_{u\in\mathcal N(v)}h_u,&|\mathcal N(v)|>0,\\
0,&|\mathcal N(v)|=0,
\end{cases}\qquad
h'_v=W_{\mathrm{self}}h_v+W_{\mathrm{neighbors}}\bar h_v+b.
\]

No automatic SAGE self-loop is added here, because the own state already has its separate branch. Another common form concatenates `[h_v, mean_v]` and multiplies by one larger matrix. Splitting that matrix into its two input blocks yields the two maps above. An activation can follow the combined result; the particular variant must state whether a subsequent row normalization is used.

The ordinary route `SAGEConv(..., aggr='mean', project=False, root_weight=True, normalize=False)` implements these choices. Its `lin_l` maps the neighbor mean and supplies the bias; `lin_r` maps the own state without another bias. The scratch `SparseMeanSage` names these branches explicitly rather than importing a graph layer.

### What if a receiver has no neighbors, or several copies of a value?

Keep individual incoming occurrences visible while changing their count and values.

<!-- figure: D13a -->

The own-value control and neighbor-count control preserve this SAGE context. At count 0 the mean summary is zero and the own branch still acts. Increasing the count retains old entries and adds zeros; shrinking drops the removed occurrences. Each incoming occurrence is one entry in the summary, even when two entries carry equal values.

<!-- figure: D13b -->

Select an occurrence and edit its value between −8 and 8. The three values need not stay symmetric or have the same mean. With `[1, 3, 5]`, repeating the entire list gives `[1, 3, 5, 1, 3, 5]` and the same mean 3; repeating only the value 5 gives mean 3.5. This distinction will motivate the sum/mean/max comparison in §8.

<!-- figure: D13c -->

Edit the own and neighbor coefficients independently between −4 and 4. A zero neighbor coefficient deliberately ignores the incoming summary; a negative coefficient reverses its signed contribution. The live products, sum and sentence use the current own value and occurrence list, rather than reverting to the introductory numbers.

### Does max pooling happen before or after a learned transform?

**Deeper branch: alternative neighborhood readers.** Mean-SAGE already gives us the core own/neighbor split. The following questions explore pre-transform pooling, row normalization, ordered reading and gated memory. Their diagrams stay visible; on a first pass you can continue directly to “What information creates a GAT edge score?” and return here when you want to implement a different reader.

Follow each donor into two transformed channels, then select the largest value in each channel.

<!-- figure: D14 -->

A mean reduces all donors to one summary before the next map. Sometimes we want each donor to produce a useful feature first. To see the difference, use scalar donors `−2, 1, 3`. Give each donor the same one-input/two-output map `x → [x, −x]`, then ReLU. The resulting rows are `[0, 2]`, `[1, 0]` and `[3, 0]`.

Now take the maximum separately in each channel. Channel 1 gets 3 from donor 3; channel 2 gets 2 from donor −2. The summary is `[3, 2]`: it retains the strongest positive and negative magnitudes from different donors. If we had taken raw max first, only 3 would remain, and transforming it would produce `[3, 0]`. The negative donor's information would already be lost.

For a shared donor transform `φ`, let `j` name an output channel and `a_{v,j}` the receiving summary in that channel. Pooling means

\[
a_{v,j}=\max_{u\in\mathcal N(v)}\phi(h_u)_j.
\]

The maximizing donor can differ between channels. The original GraphSAGE pooling variant uses a learned per-neighbor map before the maximum. A deeper local MLP can be used too. A finite two-channel example explains the order; it does not make every multiset distinguishable.

```python
def max_after_transform(donors, weight, bias):
    transformed = torch.nn.functional.linear(donors, weight, bias).relu()
    if len(donors) == 0:
        return transformed.new_zeros(weight.shape[0])
    return transformed.amax(dim=0)
```

The declared empty-list result is zero, the useful layer/editor convention; a mathematical maximum of an empty set is not an ordinary real number. The complete `graph-aggregation-variants.py` supplies the learned `NeighborPool` module. Away from ties it sends max-pool gradient through the winning donor in each channel. At ties a chosen subgradient can distribute or assign credit differently across reducers; there is no unique classical derivative to assert.

Change donor −2 to −3: the second pooled channel becomes 3 while raw max remains 3. Change it to zero: the negative-magnitude channel becomes zero. Both cases make the lost information visible.

### How can that expanding pool be mapped to an ordinary library layer?

Follow the declared extra zero input channel through the library's pre-pool map, reduction and fixed output map.

<!-- figure: D14-library -->

The installed `SAGEConv(..., project=True)` pre-pool projection preserves the input width. Thus `SAGEConv(1, 2, aggr='max', project=True)` maps 1→1 before max, then 1→2 afterward. Its output width does not create our two-channel donor features before the reduction.

For an exact comparison, explicitly encode scalar `x` as `[x, 0]`. Use `SAGEConv(2, 2, aggr='max', project=True, root_weight=False, bias=False)`. Set the pre-pool map to `[[1, 0], [−1, 0]]`, its bias to zero, and the post-pool map to the identity. The own branch is absent in this controlled pooling comparison. The three projected/ReLU rows and pooled `[3, 2]` then match the scalar scratch operation exactly.

```python
from torch_geometric.nn import SAGEConv

pool = SAGEConv(2, 2, aggr='max', project=True,
                root_weight=False, bias=False).double()
with torch.no_grad():
    pool.lin.weight.copy_(pool.lin.weight.new_tensor([[1., 0.], [-1., 0.]]))
    pool.lin.bias.zero_()
    pool.lin_l.weight.copy_(torch.eye(2, dtype=torch.float64))
pool.lin_l.weight.requires_grad_(False)
```

The larger library parameter space can also respond to arbitrary nonzero second input channels; our declared encoded dataset cannot. For the matched gradient/update comparison, the second input column remains zero, its weight gradient is zero, the post-map remains fixed, and corresponding pre-map weights and biases are updated identically. The comparison includes changed non-tied donors and the isolated-target zero reduction in the installed version. Adding an ordinary own-state branch afterward uses the receiver's declared two-channel row and its own mapped parameters.

### What does normalizing a row keep, and what does it discard?

Follow the state `(3, 4)` to its length and its unit-direction row.

<!-- figure: D15a -->

The length of `(3, 4)` is `√(3² + 4²) = 5`. Dividing by 5 gives `(0.6, 0.8)`, which has length 1 and points in the same direction. This **L2 row normalization** removes the overall size of a nonzero row while preserving its direction.

If the row is multiplied by a positive magnitude, its normalized direction stays `(0.6, 0.8)`. At magnitude zero there is no defined unit direction; the implementation deliberately returns the zero row. The denominator is 1 only for that exact zero case, not an arbitrary epsilon added to all nonzero lengths. Write the Euclidean length just calculated as `‖h‖₂`; the subscript 2 identifies the sum-of-squares length:

\[
\operatorname{unit}(h)=h/\|h\|_2\quad\text{for }h\ne0.
\]

`exact_unit_rows` writes this guarded division. It first divides by the largest absolute row entry, then normalizes the scaled row: this preserves direction while avoiding overflow or underflow when squaring finite entries. An ordinary SAGE layer's `normalize=True` applies the library's L2 normalization after aggregation and own-state combination. Its numerical epsilon floor is a distinct small-norm policy; set and examine that policy when exact unit length at tiny nonzero magnitudes matters. Both the policy and the placement affect what the next layer can use.

### What does an ordered neighbor reader remember?

Trace the three occurrence values through an LSTM's successive positions and final summary.

<!-- figure: D15b -->

Mean and max do not depend on the list order. The GraphSAGE LSTM variant deliberately treats neighbors as a sequence. Reuse the earlier [LSTM explanation](/learn/path/full-curriculum/rnns-lstms-grus?module=deep-learning-fundamentals#3-lstm-retain-write-then-expose) and its [recurrent-cell implementation](/learn/path/full-curriculum/rnns-lstms-grus?module=deep-learning-fundamentals#translate-gate-equations-into-a-reusable-recurrent-implementation): the new work is gathering the neighbor list and interpreting its final hidden row as the summary. An LSTM carries both hidden and cell rows between positions; they are not the receiver's graph state.

In the fully declared one-channel fixture in `ordered_example`, reading `[1, 3, 5]` gives final hidden value approximately `0.6763694651`; reading `[5, 3, 1]` gives `0.4666702850`. Every parameter is fixed explicitly in that function. The only change is the order. The ascending/descending choice and first-occurrence value control expose those contributions without switching the aggregation method.

Randomizing neighbor order can provide a distribution of summaries; it does not make one evaluated LSTM exactly permutation invariant. For a variable-size neighborhood, the summary must also specify how an empty list and padding behave. Our `ordered_neighbors` batches lists of equal true length, so padded zeros never become additional neighbors. An empty neighborhood has the declared zero summary.

The ordinary `nn.LSTM` route matches the reused recurrent class when its parameters and actual sequence lengths match. The installed PyG `LSTMAggregation` requires edges sorted by destination and uses a dense padded batch, taking the final padded position. On mixed degrees, that can process extra zero positions and give nonzero states to isolates through its biases. Our actual checked example matches that padded native route but differs from true-length summaries. Use packed/length-aware native sequences or a custom aggregation when true-length semantics are required; do not call the unqualified `aggr='lstm'` setting identical to a different padding policy.

The complete program supplies the shared recurrent file locator, equal-length batching and matched ordinary route. The earlier cell equations are reused; each graph-specific input/state/length decision is taught here.

### How can a node keep useful old information?

Follow old sender rows into a gathered message table, then into a one-position GRU beside each receiver's old state.

<!-- figure: D16 -->

A **gated update** can blend a proposed change with information already present. The graph wiring in the picture first sums each node's incoming old rows. Each node's gathered row becomes the GRU input; that node's old row becomes the GRU hidden-state input. There is one recurrent position for this one graph round, with nodes as batch rows. No node reads a freshly updated neighbor.

Reuse the earlier [GRU gate explanation](/learn/path/full-curriculum/rnns-lstms-grus?module=deep-learning-fundamentals#4-gru-blend-old-state-with-a-new-proposal). Its reset gate controls a recurrent contribution to the candidate, and its retain gate blends old and candidate states. In that PyTorch-matched convention, reset acts after the recurrent affine candidate map, including its recurrent bias.

For one scalar receiver, choose old state 2, gathered message 5, reset and retain gates each 0.5, candidate input coefficient 0.1 and candidate recurrent coefficient 0.2 with zero candidate biases. The candidate is `tanh(0.1×5 + 0.5×(0.2×2)) = tanh(0.7) ≈ 0.6043677771`. The new state is `0.5×2 + 0.5×0.6043677771 ≈ 1.3021838886`. The candidate is computed before the final blend.

The local retain-gate investigation holds that old state and candidate fixed. Moving retain `z` from 0 to 1 changes `(1−z)×candidate + z×old` from the candidate to the old state. It is explicitly a gate-stage intervention; the full GRU recomputes its coupled gates from input and previous state.

```python
# RecurrentSequence is the supplied earlier implementation, loaded by the program.
source, target = edge_index
aggregate = old_states.new_zeros(old_states.shape)
aggregate.index_add_(0, target, old_states[source])
_, new_states = recurrent(aggregate[:, None, :], old_states,
                          return_sequence=False)
```

The inserted axis creates shape `(nodes, one_position, input_width)`. `graph_gated_round` supplies this wiring, and `ordinary_gru_cell` maps the exact reused weights and separate biases to `nn.GRUCell`. Checked values, input/parameter gradients and one update agree. Preserving distinct old and next tables remains essential even though the update now has gates.

### What information creates a GAT edge score?

Follow a receiver and each permitted sender through their shared projection and endpoint contributions.

<!-- figure: D17 -->

GCN's factors come from degrees. A **graph attention network**, or **GAT**, instead computes coefficients from the current node representations. Return to the original paper graph and two-channel rows. First a shared learned map `W` projects each row to `z`. Two learned vectors, `a_receiver` and `a_sender`, then turn a receiver row and a sender row into scalar contributions by dot products. Their sum passes through LeakyReLU to produce the edge score, written `e_{vu}` for receiver `v` reading source `u`. The vectors are learned parameters; scores and the eventual attention probabilities are computed from them.

To isolate scoring, set `W = I₂`, the two-channel identity map, and both score vectors to `(1, 0)`. These are explicit parameter values, rather than §3's different learned-map example. Add one self-loop at each paper, so receiver 1 reads sources 0, 1 and 2. The projected rows stay `(1, 0)`, `(2, 1)` and `(4, −1)`. Dotting with `(1, 0)` selects the first channel: receiver 1 contributes 2, and the senders contribute 1, 2 and 4.

LeakyReLU keeps a positive score unchanged and multiplies a negative score by a stated slope, here 0.2. The three raw endpoint sums are therefore 3, 4 and 6; those are also the post-activation scores. If the receiver's projected feature changes, every permitted pair must be recomputed from its new endpoint contribution. A second-channel edit has no effect on these scores under the fixed `(1, 0)` score vectors, but it can still change the returned value row. That separates a parameter's actual choice from the layer's broader ability to use both channels.

After those paths are visible, the single-head rule is

\[
z_u=Wh_u,\qquad
e_{vu}=\operatorname{LeakyReLU}(a_{\mathrm{receiver}}^\mathsf Tz_v
                                    +a_{\mathrm{sender}}^\mathsf Tz_u).
\]

The full-layer feature controls recompute projection and score together. The graph still determines which pairs are permitted; a large score cannot create an absent edge. Below we turn these scores into coefficients and use each coefficient to weight its sender's projected row.

### What changes when only an intermediate score contribution is edited?

Keep both receivers' endpoint sums visible while editing one already identified term.

<!-- figure: D17b -->

This separate score-stage experiment uses two sender terms 1 and 2 and two receiver terms 0 and −3. It isolates the components of the score rule rather than pretending those arbitrary scalars are a whole trained layer. Select a sender and edit its term between −8 and 8.

<!-- figure: D17c -->

Select a receiver, edit its endpoint term, and change the LeakyReLU slope between 0 and 1. At slope 0.2 the original receiver scores are `[1, 2]` and `[−0.4, −0.2]`. Both rank sender 2 above sender 1. The second pair has a smaller difference, so its normalized coefficients will differ even though the ranking is the same.

For a strictly positive slope, this original GAT score rule is increasing in each sender term. With a common candidate set and fixed sender representations, adding a different receiver term cannot reverse their ordering. This is its **static-ranking limitation**. It does not say a receiver can never change coefficient values. At slope zero, negative sums can tie. Different allowed candidate sets also constitute a different comparison. If a receiver is also a candidate sender, editing its whole feature row can change that sender's term too; that is not a receiver-term-only comparison.

### How does a score become a mixture of values?

Trace allowed scores through shifted exponentials, their total, shares and weighted value products.

<!-- figure: D18 -->

We temporarily switch to two supplied scores `0` and `ln 3` to make the normalization arithmetic exact; they are not the three scores from the full-layer example. Here `ln 3` is the number whose exponential is 3. Exponentiating the scores produces masses 1 and 3; dividing by their total 4 produces shares 1/4 and 3/4. These computed shares are the **attention coefficients**, written `α_{vu}` for receiver `v` reading source `u`.

For returned values 1 and 5, the weighted products are `1/4 × 1` and `3/4 × 5`. Their sum is 4. Scores decide how strongly a sender is read; values are the information returned. They are different quantities even when a layer's shared projection contributes to both.

For numerical stability, subtract the largest allowed score for each receiver, calling it `c_v`, before exponentiating. In this two-score example, shifted masses are `exp(−ln 3) = 1/3` and `exp(0) = 1`; dividing by their total `4/3` still gives 1/4 and 3/4. In the full layer, the returned value is `z_u`, the sender's projected row, and the receiving output is `h'_v`. Those steps give

\[
\alpha_{vu}=\frac{\exp(e_{vu}-c_v)}{\sum_{k\in\mathcal N(v)}\exp(e_{vk}-c_v)},\qquad
c_v=\max_{k\in\mathcal N(v)}e_{vk},\qquad
h'_v=\sum_{u\in\mathcal N(v)}\alpha_{vu}z_u.
\]

The common factor `exp(−c_v)` cancels between numerator and denominator, which proves why the shift preserves shares. It avoids exponentiating unnecessarily large numbers. Subtract separately for each receiver and head: a global softmax would let unrelated receivers compete for one probability total.

Place the computed shares beside the paper rows they actually multiply.

<!-- figure: D18-paper-read; author clarification completing D17's running example. Draw receiver1 and its three permitted source rows, scores (3,4,6), shifted masses and actual shares, both labelled value channels, three coefficient-times-row contributions and receiving two-channel sum. Reuse the full-layer feature context, not the independent D17b/c score editor. Stack routes vertically on phones. No additional controls. -->

Return now to receiver 1's complete paper-graph example. Scores `[3, 4, 6]` become masses `[exp(−3), exp(−2), 1]` after subtracting 6. Their shares are approximately `[0.042010066, 0.114195199, 0.843794734]`, paired with the projected rows `(1, 0)`, `(2, 1)` and `(4, −1)`. The first output channel is `0.042010066 × 1 + 0.114195199 × 2 + 0.843794734 × 4 ≈ 3.645579403`. The second is `0 + 0.114195199 − 0.843794734 ≈ −0.729599535`. Thus the same input rows and declared parameters lead all the way to a two-channel receiving state, rather than ending at three unexplained scores.

`segment_softmax` in `message-passing-operators.py` writes the per-receiver maximum, shifted exponentials and receiving sum explicitly. Its maximum is detached for numerical centering; derivatives through the scores and normalized coefficients remain connected. `incoming_sum` then accumulates each coefficient-times-value at its actual receiver.

### Which returned value or permission changes the current read?

Follow one selected value, then the allowed pair, without changing the meaning of the score-stage fixture.

<!-- figure: D18a -->

The score-stage context retains its two returned scalar values, initially 1 and 3. Selecting a sender and editing its value between −8 and 8 changes both permitted receivers' products and outputs. It does not directly change the independently supplied endpoint terms in this isolated stage.

<!-- figure: D18b -->

Select a receiver and sender, then toggle that pair's permission. A forbidden extreme-valued sender contributes nothing to the read. A receiver with exactly one permitted sender returns that sender's value with share 1. With no permitted senders, this normalized-distribution experiment has an undefined distribution and output; its labels say so. The separate complete graph layer has a declared zero aggregate for an empty incoming set, before its bias. That software convention is a different statement from having an attention distribution over an empty set.

### Where do multiple graph-attention heads sit?

Follow separate projections and coefficient calculations into both concatenated and averaged output routes.

<!-- figure: D19 -->

One head has its own projected values and score parameters. Another head can read the same neighborhood differently. If each head produces two channels, two heads yield two distinct two-channel outputs per node. Concatenating them creates four channels; averaging corresponding channels creates two. Neither operation changes the number of nodes.

Call the number of heads `n_heads`, keeping `H` for the node-state table introduced in §1. With per-head width `d_out`, concatenation yields width `n_heads × d_out`; averaging yields width `d_out`. The head-count control changes those labelled branches and both output shapes. Each head's coefficients still normalize only over that receiver's allowed sources.

The complete scratch `SparseGraphAttention` projects into `(nodes, heads, channels)`, computes `(edges, heads)` coefficients, sums `(edges, heads, channels)` messages, then concatenates or averages. Its ordinary `GATConv` mapping declares heads, concatenation, slope, zero attention dropout, loop insertion, no residual route and the output bias. The checked comparison covers both merges and empty/changed directed supports. During ordinary training dropout would change the realization, so it is disabled for the matched deterministic calculation.

### Can the same candidates reverse rank for different receivers?

Follow each receiver–sender pair's two-dimensional sum through the nonlinearity before its final score.

<!-- figure: D20 -->

Original GAT's receiver enters the scalar sum too late to reverse a common sender ordering. **GATv2** changes that order: apply the nonlinearity to the sum of the projected vectors before reducing to one score. Use a new two-receiver/two-sender fixture because its controlled reversal is easier to follow than the original path.

The scalar receivers are `r = −1, +1`, and both may read scalar senders `k = −1, +1`. Project a receiver to `[r, −r]` and a sender to `[−k, k]`. The pair sum is `[r−k, k−r]`. Apply LeakyReLU with slope 0.2 to each coordinate, then dot with `a = [−1.25, −1.25]`. Its result is `−|r−k|`: equal receiver/sender values score 0, opposite values score −2.

For receiver −1, scores are `[0, −2]`; for receiver +1, they are `[−2, 0]`. Softmax gives `[0.880797078, 0.119202922]` and its reverse. Returning the projected sender values `[1, −1]` and `[−1, 1]` gives receiver outputs `[0.761594156, −0.761594156]` and the opposite. The ranking really changes while support and candidates stay fixed.

\[
e_{vu}=a^\mathsf T\operatorname{LeakyReLU}(W_{\mathrm{receiver}}h_v+
                                         W_{\mathrm{sender}}h_u).
\]

Receiver 0 ties the candidates, so its mixture is `[0, 0]`. Receiver `+0.5` scores them `−1.5` and `−0.5`, producing shares `[0.268941421, 0.731058579]` and mixture `[−0.462117157, 0.462117157]`. Each changed score follows the whole projection/nonlinearity route, not a free rank selector.

The new sparse program implements this coupled calculation. Its mapped `GATv2Conv` uses `share_weights=False`: in the installed implementation `lin_l` is the source projection and `lin_r` the receiver projection. Projection biases, attention vector, output bias, loops, heads and merge are all mapped. A no-loop empty receiver keeps the zero-aggregate policy plus output bias. Checked forward values, gradients and an update agree with the ordinary layer; the reversal example is a constructed mechanism, not a claim of superior performance on every graph.

### Can useful rows be learned without class labels?

Trace an anchor's positive and negative context scores into their two loss contributions.

<!-- figure: D21 -->

So far a target entered a supervised loss. A GraphSAGE-style unsupervised objective can instead make an anchor representation compatible with sampled nearby context and less compatible with sampled negatives. The sampling rule defines the task: nearby context can come from random walks, and a sampled noncontext is not guaranteed to be a true semantic negative.

Use scalar anchor 1, positive context 2 and negative context −1. Their dot scores are 2 and −1. A logistic positive loss is `softplus(−2) ≈ 0.126928`; a logistic negative loss is `softplus(−1) ≈ 0.313262`. Their total is approximately `0.440189699`. Here `softplus(s) = log(1 + exp(s))`; the ordinary stable primitive avoids directly overflowing that exponential.

For one anchor row `z`, supplied positive rows `p_i` and negative rows `n_j`, the program writes

\[
L(z)=\sum_i\operatorname{softplus}(-p_i^\mathsf Tz)
       +\sum_j\operatorname{softplus}(n_j^\mathsf Tz).
\]

The derivative of softplus at a score `s` is `exp(s)/(1 + exp(s))`, equivalently `1/(1 + exp(−s))`. This number between zero and one is the **sigmoid**, written `sigmoid(s)`. Each dot score also has a derivative with respect to the anchor: −2 for the positive-loss argument and −1 for the negative-loss argument here. Multiplying those local derivatives gives the anchor derivative `−2 sigmoid(−2) − sigmoid(−1) ≈ −0.5073472654`. Increasing the anchor slightly lowers these two sampled losses. If the negative context becomes positive and similar to the anchor, its negative term increases instead. The negative-value control updates the score, loss and derivative together.

The complete program supplies `sampled_context_loss` using matrix–vector scores and stable softplus. Changing how contexts and negatives are sampled changes the objective's interpretation. It does not automatically supply a class decision or a legal evaluation protocol. That brings us to the next question: which graph information and labels were allowed to be visible when these rows were fitted?

## 5. The data split is part of the graph model

### Which information may be visible when only some labels are known?

Follow feature-to-message arrows separately from label-to-loss arrows.

<!-- figure: D22 -->

Return to the three papers. Suppose their relationships and features are available, but only paper 1's subject label is revealed for fitting. Papers 0 and 2 still have rows that paper 1 can read. Their hidden subject labels have no wire into those rows, the update, or the fitting loss. A label drawn for later assessment is an annotation, not an input.

For this task, the model is asked to classify unlabeled papers in a graph already available during fitting. That protocol is **transductive node prediction**. The available unlabeled context is part of the stated input. A training-label mask selects which predictions enter the fitting loss; it does not remove the other nodes from the computation.

Let `logits` hold the complete table of unnormalized class scores, one row per node. A Boolean `fit_mask` selects the rows whose labels are available for fitting. The cross-entropy loss therefore reads only these paired score and label rows:

```python
loss = torch.nn.functional.cross_entropy(logits[fit_mask], labels[fit_mask])
```

This classifier-loss excerpt selects fit labels only after computing node outputs. It is valid when the full feature/relationship context was explicitly available for the task. It would be a leak if those supposedly available rows had already encoded withheld labels or future events.

The context control includes or excludes unlabeled paper 2 under two explicitly different input contracts. Changing paper 2's feature can change paper 1's state while the fitting-label mask remains identical. The picture shows that dependency rather than calling all unlabeled information forbidden. Assessment labels never change the representation when their annotation is edited.

### What changes when a node or graph was unavailable during fitting?

Keep unseen objects outside the fitting computation, then attach them only at the declared evaluation boundary.

<!-- figure: D23-inductive -->

If the fitted rule must work on newly arriving papers or an entirely new network, the protocol is **inductive evaluation**. A held-out label mask alone is not enough to establish it: a supposedly unseen node must not have participated in fitting through its features, edges or graph-derived preprocessing. For held-out whole graphs, fit the shared functions on the available graphs and apply them to the later graph.

The layer can transfer because its learned channel maps are shared rather than indexed by training-node identity. GCN, SAGE and GAT can all be applied to a new graph with compatible input channels. Sampling is a computation strategy, not the definition of inductive learning. Likewise, a feature column that is merely a lookup of training-node IDs cannot acquire useful features for arbitrary new IDs by switching a layer name.

An arriving graph has its own current degrees and neighborhoods. Recompute any graph-dependent normalizer from that graph. A cached operator for the old node set represents the wrong input, even when the learned weights have stayed unchanged.

### What if an edge belongs to the future?

Follow the observation cutoff through available edges, derived features and the separately scored target pair.

<!-- figure: D23 -->

At time `t₀`, the available path is `0—1`; paper 2 exists, but the future `1—2` relationship has not been observed. The task is to score that candidate relationship using information available at `t₀`. Its pair head can read representations of the two endpoints; it must not insert the future relationship into the message adjacency to obtain those representations.

At time `t₁`, the relationship is known. Adding it earlier would create a direct future message route and change the graph's degrees. Even if the target label is excluded from the loss, a degree feature computed from the future graph can carry that information into the earlier model. The denied route in the picture therefore includes both the target edge and its derived-feature path.

The cutoff control compares the two information states. The available node rows, edges, degrees and normalizer change together, and the readout identifies the later state as unavailable for the original earlier prediction. If there is no post-cutoff relationship, this particular difference disappears. The timeline is about information access, not a graph-layer failure.

For a temporal task, define the cutoff before building features, adjacency, contexts and labels. Fit any learned preprocessing on the legal fitting information and apply it to later examples without using their answers. A static transductive classroom experiment and a future-time forecast answer different questions; their scores should not be interpreted as the same evidence.

### How can I decide whether a cached operator is still valid?

Match the cached graph identity to the graph actually feeding the next computation.

The normalizing matrix `S` is determined by adjacency, edge strengths, loop policy and receiving degrees. It can be reused while those inputs are unchanged. Editing only a raw node value leaves this fixed operator valid. Editing an edge, adding a node or changing the loop policy requires a new operator. If attention values or scores depend on changing node states, those state-dependent coefficients also need recomputation even on a fixed topology.

This distinction is practical: caching a fixed GCN normalizer can save work in a suitable fixed-graph task, while reusing a stale one silently evaluates another graph. The ordinary comparison uses `cached=False` when edges may change. The saved-model inspector will keep model, input and graph identities separate so that a diagnostic edit cannot masquerade as an untouched recorded assessment.

We now have explicit message rules, parameter updates and information boundaries. The next section switches from the constructed paper graph to one observed network, keeping those choices visible through a complete fit and its actual results.

## 6. A complete experiment on an observed network

### Can these rules learn anything from a network that people actually observed?

Replace the three constructed papers with a recorded social network, and keep its observations separate from the answers we want to predict.

<!-- figure: D24 -->

Each numbered node in this picture is a member of the karate club recorded in Wayne Zachary's study. An edge records an observed relationship. There are 34 members and 78 unique undirected relationships; a drawn line connects both endpoints. The positions help us read those relationships. They are not measured physical locations and do not enter the classifier.

The small class annotation describes which of two clubs the member joined after the historical split: class 0 is NetworkX's “Mr.Hi” group and class 1 its “Officer” group. This is the answer column. It is drawn so we can inspect the experiment, but it is not supplied as an input feature. A different shape or role label identifies whether a member's answer is used for fitting, development or assessment. Class and experimental role answer different questions.

The distributed source also records positive integer edge weights representing interaction contexts. Our declared classroom experiment uses a **binary relationship graph**: each observed relationship has strength 1, irrespective of that original context count. The original weights remain in the downloadable source data. We are teaching and testing this explicitly simpler operator, not claiming to have fitted the weighted source graph.

We chose this small network because we can inspect the complete input and replay a fitted model without special hardware. It is one historical network. Its 34 connected members are not 34 independent population samples. The task is to classify member groups under a declared transductive protocol, not forecast a future social conflict or explain its causes.

### What does the model actually know about a member?

Read three numbers from the original available graph, before applying any message layer.

<!-- figure: D25 -->

The selected member appears with its immediate neighbors and the observed relationships among those neighbors. The input row has three channels:

1. A constant 1, allowing a shared learned map to use an offset-like input signal.
2. The member's binary degree divided by 33. There are at most 33 other members to connect to in this graph.
3. The fraction of possible neighbor pairs that are connected to one another. This is the **local clustering coefficient**: it measures how often two neighbors also have their own relationship.

For member 0, there are 16 neighbors. Those neighbors form 18 connected pairs out of `16×15/2=120` possible pairs. Its clustering coefficient is therefore `18/120=.15`, and its row is `[1, 16/33, .15]`. In the picture, each counted triangle has member 0 at one corner and a connected neighbor pair at the other two. A relationship joining two unrelated nodes elsewhere in the graph does not contribute to this member's count.

Choose another member to see its actual neighbor IDs, closed triangles and denominators. At degree 0 or 1, no pair of neighbors exists; the declared clustering value is 0, rather than dividing by a zero denominator. These feature channels describe structure already visible in the known graph. They are not club labels and are not fitted from assessment answers.

For member `i`, let `k_i` be its degree and `t_i` the number of connected neighbor pairs. The number of possible unordered pairs is `k_i(k_i−1)/2`, also written `\binom{k_i}{2}`. Write its clustering fraction as `c_i` and its three-channel feature row as `x_i`. Then

\[
x_i=\left[1,\frac{k_i}{33},c_i\right],\qquad
c_i=\begin{cases}t_i/\binom{k_i}{2},&k_i\ge2,\\0,&k_i<2.\end{cases}
\]

The download includes these source-derived values. We can load them directly without asking the learner to install a graph package merely to reproduce the lesson. NetworkX's documented generator and BSD license provide the provenance of this distributed representation; the source notes explain its relationship to Zachary's original paper.

```python
import json
from pathlib import Path
import torch

data = json.loads(Path("karate-club.json").read_text(encoding="utf-8"))
features = torch.tensor([
    [1.0, node["degree"] / 33.0, node["clustering"]]
    for node in data["nodes"]
])
targets = torch.tensor([node["club"] for node in data["nodes"]])
adjacency = torch.zeros(len(data["nodes"]), len(data["nodes"]))
for left, right, source_context_count in data["edges"]:
    adjacency[left, right] = adjacency[right, left] = 1.0
```

The final assignment deliberately uses `1.0`, not `source_context_count`. The target tensor is separate from the three-column feature tensor. The nodes are stored in their declared zero-based ID order; `paper_id` in the data preserves the paper's one-based numbering. An ID is an address for a row, not a numeric feature to classify.

### How do two layers turn these rows into a training signal?

Follow the complete computation from three input channels to two class scores, then follow only the allowed answers into the loss.

<!-- figure: D26 -->

The first layer reads the `34×3` input matrix and computes 16 channels for each of the 34 members. Its weights are shared across members. ReLU then replaces negative computed entries with zero. The second layer reads those `34×16` hidden rows and computes two scores per member, giving a `34×2` result. The two scores are **logits**, the unnormalized class scores introduced in the split diagram in section 5. We do not apply a final ReLU: class scores may be negative.

In the GCN branch, each layer uses the normalized graph operator `S` from “GCN: a normalized weighted sum.” Call the input table `X`, the first hidden table `H⁽¹⁾`, and the final logit table `Z`. `X` has 3 channels, `W₁` has shape `16×3`, `b₁` has 16 entries, `W₂` has shape `2×16`, and `b₂` has 2 entries. Each bias row is repeated, or **broadcast**, to all 34 members after its aggregation. With PyTorch's `(output,input)` weight storage, the complete forward pass is

\[
H^{(1)}=\operatorname{ReLU}(SXW_1^{\mathsf T}+b_1),\qquad
Z=SH^{(1)}W_2^{\mathsf T}+b_2.
\]

The corresponding SAGE and GAT branches replace the layer's aggregation decision with their own already traced rules; they do not change the meaning of the two class-score columns.

The selected member's displayed intermediates come from the actual saved seed-11 model, not an imagined optimizer trajectory. Read its gathered or normalized first-layer contributions, the computed pre-ReLU row, its nonnegative hidden row and finally its two class scores. The drawn routes say which members supplied values and which shared channel weights acted on them. A message route can pass through an assessment member's allowed features in this transductive protocol. Its withheld answer still does not enter the fitting loss.

To turn logits into class probabilities, exponentiate the two scores and divide by their sum. This is a softmax **across the two class columns**, unlike GAT's softmax across a receiver's allowed senders. Implement it stably by subtracting the larger class logit first; the probabilities are unchanged by that common subtraction. The class with the larger probability is the predicted class.

For a member whose observed target is `y_i`, cross entropy penalizes low probability assigned to that target. Averaging over the fitting IDs `T` gives

\[
\mathcal L=-\frac1{|T|}\sum_{i\in T}\log
\frac{\exp Z_{i,y_i}}{\exp Z_{i,0}+\exp Z_{i,1}}.
\]

Only the fitting IDs appear in this sum. The development and assessment IDs can have computed logits without contributing label terms. Gradients propagate backward through the second layer, ReLU and first layer into the shared parameters. PyTorch records those operations; the explicit graph-message operators still define what is differentiated. Refer back to [Backpropagation & Automatic Differentiation](/learn/path/full-curriculum/backpropagation-automatic-differentiation?module=deep-learning-fundamentals) for the local derivative/chain-rule mechanism and [Gradient Descent Variants](/learn/path/full-curriculum/gradient-descent-variants-sgd-adam-adagrad-rmsprop-lamb-lars?module=math-foundations) for the optimizer state and decoupled weight-decay mechanism.

The full downloadable `message-passing-study.py` defines `GraphLayer`, `NodeClassifier`, the graph operators, split construction, baseline and training loop. Its dense matrices are appropriate for an inspectable 34-node experiment. The core fitting step is

```python
operators = graph_operators(adjacency)
fit_ids = roles["fit"]  # The complete program constructs this partition first.
model = NodeClassifier("gcn")
optimizer = torch.optim.AdamW(model.parameters(), lr=0.02, weight_decay=0.01)
for epoch in range(300):
    logits, hidden, attention = model(features, operators)
    loss = torch.nn.functional.cross_entropy(logits[fit_ids], targets[fit_ids])
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
```

`optimizer.zero_grad()` clears accumulated parameter gradients for this step. `backward()` computes the current fitting loss's gradients; `step()` applies AdamW's parameter/state update. The displayed result records a completed fit. Moving an input control in the inspector later runs a new forward pass through those **frozen weights**; it does not execute this optimizer loop or create a newly fitted model.

### Which choices were fixed before these results were inspected?

Keep the information boundary and fitting protocol beside the measured comparison.

<!-- figure: D27 -->

The experiment uses the known graph and all three feature channels for transductive computation. Its answer partition was constructed with NumPy generator seed 133, taking 5 fitting, 3 development and 9 assessment IDs per class: 10 fitting, 6 development and 18 assessment members. The exact IDs are included with the calculations. Deterministic degree and clustering extraction uses the permitted known graph; no learned preprocessing uses held-out answers.

Four model families were each fitted with seeds 11, 29 and 47. Every fit used 3 input channels, 16 hidden channels, 2 output channels, ReLU, 300 epochs and AdamW with learning rate `.02` and weight decay `.01`. There was no early stopping, dropout or neighborhood sampling. Development scores were recorded for inspection, not used to select an epoch or tune the reported architecture. The saved epoch observations are 1, 10, 50, 100 and 300; connecting these observations in a plot does not supply unmeasured intermediate observations.

The names in the comparison refer to precise implementations:

| Model | What each layer does | Trainable parameters |
| --- | --- | ---: |
| Structural MLP | Shared channel map of each member's existing three features, without a message aggregation | 98 |
| GCN | Symmetric closed-neighborhood normalization, shared channel map, then bias | 98 |
| Mean-SAGE | Full open-neighborhood mean plus a separate own-row map; output row normalization disabled in this declared variant | 178 |
| GAT | One original additive-attention head with slope `.2` and self messages | 134 |

For the MLP and GCN, count `3×16+16+16×2+2=98` parameters. Mean-SAGE adds a second weight map at both layers, contributing `3×16+16×2=80` more. GAT instead adds sender/receiver score vectors of lengths 16 and 2, contributing `2×16+2×2=36` more. Thus a performance comparison also changes the model's parameterization; equal hidden width does not imply equal capacity.

The answer axis has 18 assessment members. The actual counts were

| Model | Seed 11 | Seed 29 | Seed 47 |
| --- | ---: | ---: | ---: |
| Structural MLP | 10/18 | 10/18 | 10/18 |
| GCN | 8/18 | 8/18 | 8/18 |
| Mean-SAGE | 10/18 | 11/18 | 9/18 |
| GAT | 9/18 | 9/18 | 9/18 |

The simple majority baseline gets 9/18. A separate **label-propagation baseline** gets 16/18: start from one-hot fitting labels, repeatedly average them over closed neighborhoods and clamp the fitting rows back to their known labels after each round, for 200 rounds. Assessment answers are used only to count correctness afterward. This baseline uses fitting-label information in its graph signal; the neural model uses fitting labels through its loss. It is a useful alternative with a different mechanism, not an architecture hidden inside the MLP.

These are weak neural outcomes, especially for this GCN. All twelve fits, their losses/probabilities and the stronger simple baseline remain visible. Nothing in message passing guarantees that the chosen features, fit size, model, optimization and task will work well. The result teaches us to inspect the comparison and its information contract before declaring a sophisticated method superior. This single small, socially dependent graph does not establish a reliable ranking of model families or a population confidence interval.

The complete program runs from the supplied graph file and saves the declared calculations. Keep `message-passing-study.py`, `karate-club.json` and the retained provenance/license files together. The library comparison is a separate mechanism program, `graph_library_bridge.py`: it compares sparse scratch layers with mapped PyG layers, values, gradients and an identical SGD step. It does not replace this observed-network study with library-generated accuracy numbers.

### How can we compute the same messages without storing a whole square matrix?

Store only actual sender-to-receiver routes, then accumulate their contributions at the destination.

<!-- figure: D28 -->

For an undirected edge `0—1`, the edge list has both routes `0→1` and `1→0`. Its first row stores sender IDs; its second row stores receiver IDs. Gather each sender's projected feature row, multiply by that edge's coefficient, and add the resulting row to its receiver. This operation is usually called **gather and scatter**: gathering reads addressed rows; scattering collects contributions at addressed destinations.

For GCN, add one self route per node and count each receiver's closed incoming degree. The route `j→i` receives coefficient `1/√(d_i d_j)` under this lesson's declared receiving-degree convention. For undirected graphs, incoming and outgoing degrees coincide. For a directed graph, choosing another degree convention defines another operator. The sparse bridge and its ordinary PyG mapping use the same declared convention; a comparison is not meaningful if the two sides silently normalize different directed graphs.

The scalar three-node path from section 3 is still a useful hand check. In receiver 1's segment, its self coefficient is `1/3`; its two endpoint coefficients are each `1/√6`. The sparse list therefore yields the same sum `1/√6 + 2/3 + 4/√6` that the dense row multiplication gave. A feature edit changes the gathered value; an edge edit changes both the available routes and their current degrees.

With node matrix `X`, weight matrix `W` and edge routes, the mechanism is

```python
projected = features @ weight.T
messages = projected[source] * coefficients[:, None]
output = torch.zeros(
    features.shape[0], projected.shape[1],
    dtype=projected.dtype, device=projected.device,
)
output.index_add_(0, target, messages)
output = output + bias
```

`index_add_(0, target, messages)` sums rows with equal target IDs along the node dimension. It does not concatenate donors into a sequence or pick the last donor. Node ordering can change while semantic IDs and all associated rows/routes change together; the output then reorders with them, just as section 1's storage permutation showed.

The downloadable `message-passing-operators.py` supplies complete `SparseGcn`, `SparseMeanSage` and `SparseGraphAttention` implementations, including empty neighborhoods, stable segmented softmax, loop policy, head layout and explicit ordinary-library mappings. The implementation projects each source row once rather than repeating a channel matrix multiplication per edge. It uses memory proportional to the projected node rows and explicit edge messages, instead of a dense `N×N` matrix. For this project-then-aggregate GCN, the principal work is `O(N d_in d_out + E d_out)`; the exact memory/work differs for sampled, fused or multi-head implementations. There is no claim that materializing edge messages is universally the best kernel.

Mean-SAGE has a different sparse reduction: count **open-neighborhood** incoming routes, sum the raw donor rows, and divide by the receiver's count. Apply the neighbor projection and its bias to that summary, then add the independent own-row projection. An isolate has a zero neighbor summary; its own branch and shared output bias still act. For a nonempty list a shared linear map can commute with its mean, but moving the bias inside an empty reduction would wrongly remove that bias. The actual order is the §4 rule. GAT uses a maximum and exponential sum **per receiving segment and head**. A global softmax over all edges would make one member's unrelated donors consume another member's attention mass.

The two controls under this drawing edit one taught path edge and one node value. Both the dense and sparse results use the current graph, including its current degrees. A changed edge invalidates the old normalized cache; changed values alone do not invalidate a fixed GCN normalizer. The displayed comparison distinguishes a deliberately stale cache from the freshly rebuilt operator instead of quietly presenting mismatched computations as equivalent.

These scratch implementations accept simple unweighted graphs with unique edge routes and no input self loops; they add self loops explicitly when requested. Parallel or weighted relationships require a declared different input/operator contract. Do not silently coalesce duplicate routes, erase weights, and then claim to have preserved the original graph. PyG's installed layer signatures, flags and parameter layout are shown alongside the exact mappings. For the earlier scalar pooling and ordered aggregation branches, `graph-aggregation-variants.py` supplies their separate ordinary-tool bridges and explains the padding/normalization boundaries established in section 4.

### Can an outgoing edge change a coefficient on another receiver's route?

Take control of the sparse path: change its routes, rebuild its degrees, then give two GAT heads independent parameters.

<!-- figure: D28-customization; draw 0—1—2 and isolated 3, then removal of both 1→2 and 2→1, then only 3→1 added. Put receiving degrees including own loops [2,2,1,1] and [2,3,1,1] directly on the before/after nodes. Label 1→0 coefficients 1/2 and 1/√6, node-3 own coefficient 1 in both, and new 3→1 coefficient 1/√3. Static worked drawing, no controls; on phone stack the two actual directed supports and carry semantic IDs at every port. -->

For this exercise, switch explicitly from the 34-member study to the four-node `path_and_isolate` fixture in `graph_library_bridge.py`: nodes 0—1—2 form a path and node 3 has no neighbors. Keep its two-channel feature rows `[[1,2],[-1,.3],[.4,-2],[3,.1]]`. Remove **both** stored routes for 1—2. Compare that graph with the graph obtained by adding **only** 3→1. Keep all layer weights and biases fixed for this input comparison; rebuild any degree normalization.

Implement those two edge lists with `message-passing-operators.py` and its ordinary `matched_library` route. Inspect node 3's own output as well as node 1's incoming products and node 0's output. Then use `SparseGraphAttention(2, d, heads=2, concat=True)` with two genuinely different head projections and score vectors. Repeat with `concat=False`, keeping the per-head parameters matched and using an appropriately sized output bias. Compare each head's coefficients, final outputs, input and parameter derivatives, and an equal gradient step with the mapped PyG layer. The symbol `d` here is each head's output-channel width, not a node degree.

<details><summary>Hint</summary>
Draw receiving degrees after each edit, including the own loops used by GCN/GAT. For coefficient `1/√(d_i d_j)`, a change to either endpoint's receiving degree matters even if the route itself remains. SAGE's explicit own branch has a different empty-neighbor policy.
</details>

<details><summary>Solution and success criteria</summary>
After removing 1—2, closed receiving degrees are `[2,2,1,1]`. Adding only 3→1 changes them to `[2,3,1,1]`: node 1 gains an incoming route, while node 3 does not. Node 1's self coefficient changes from `1/2` to `1/3`; its 0→1 coefficient changes from `1/2` to `1/√6`, and its new 3→1 coefficient is `1/√3`. The existing 1→0 route also changes from `1/2` to `1/√6`, because **sender 1's receiving degree** participates in that coefficient. Node 0 can therefore change even though no new incoming route reaches it. This is this declared directed normalization, not an assertion that all directed GCN definitions coincide.

Node 3's GCN own coefficient stays 1, so its own output stays `W x₃ + b` during this topology edit. For mean-SAGE, node 3 still has no incoming neighbors: its output stays the own projection plus the neighbor-map bias applied to the zero summary. Its new outgoing route contributes to node 1's mean. For GAT with an own loop, node 3 still normalizes its one allowed own message to weight 1. Node 1 has a new sender and a new attention denominator. An unchanged output at node 3 does not imply its input has zero gradient for a loss involving other nodes: its outgoing message can affect their loss.

Two heads each have their own projection and sender/receiver score vectors. Concatenation produces `2d` output channels; the mean produces `d`. Map the packed projection rows and both score-vector rows separately, with the same loop, slope, dropout and bias choices. Per-head weights sum to 1 over each receiver's current allowed senders. Repeating one head twice tests packing equality but does not test independent attention. A successful solution checks a changed directed case, the isolate and both merge choices, and verifies matched derivatives and one update away from score/activation boundaries. Return to the saved 34-member network below after this constructed operator exercise.
</details>

### What changes when a frozen model receives a different input?

Keep the fitted weights fixed, inspect one message path at a time, and name every diagnostic edit.

<!-- figure: D29 -->

The inspector loads the retained seed-11 model for the selected family. Its current member selector ranges over all 34 semantic IDs. The first investigation shows a chosen hidden channel's actual first-layer messages: donor input, the family's coefficient or score/normalizer, channel projection and receiver contribution. Another follows that receiver's pre-ReLU value through the activation. A third traces a selected class logit through the output layer and class softmax. These are different questions about the same persistent model/input state, rather than one panel with many competing modes.

To change an observation, select its member and one of the three already introduced feature channels, then edit that value between −2 and 2. An edited degree/clustering channel is an artificial input intervention, not a new measured graph feature. All other observations and weights stay fixed. The live result states which member/field changed and gives the resulting output. Resetting features restores the original measured feature rows.

To change message access, select an observed relationship and remove or restore it. Both directions of this undirected edge change together. A separate investigation removes all original message edges at once and permits restoration. In these message-edge diagnostics, the original three feature columns remain fixed. Thus removing message propagation **does not remove all graph information**: degree and clustering already encoded the original graph in the input. The displayed difference answers the narrower question “What does this frozen model do when this message graph changes while these inputs stay fixed?”

Pinning a current result saves a full copy of its model/input/graph identity and displayed intermediates for comparison. Further edits must not mutate that pinned result. Resetting graph edits retains feature edits; resetting all inputs clears the comparison and restores the original graph/features, while keeping the selected fitted family. A family switch selects another saved set of weights, not a fit of the edited data. Loading/retry must preserve the learner's intended input edits and associate any displayed output with the family that actually produced it.

The original twelve-model results and recorded interventions remain a separate evidence table. Current edited output is labelled diagnostic output; it is not substituted into an old assessment row. Comparing a frozen model on edited inputs can help identify sensitivity, but it does not establish a causal effect on the historical club split, a successful retraining strategy or future deployment performance.

### Does reversing storage change this same member's current prediction?

Reorder the current edited inputs and both graph axes together, then compare the same semantic member's output.

<!-- figure: D29-storage; original and reversed 34-row feature grids and both adjacency axes with labelled semantic-ID/row mapping. Trace the selected member into both saved two-layer routes, then match its two logit/probability columns by semantic ID. Use the current edited feature/adjacency snapshot and saved family, not the original inputs. Draw selected rows/ports legibly; full grids may pan with bounded announced regions. One storage-reversal toggle below; live sentence reports semantic ID, both row addresses and maximum absolute semantic-output difference. -->

The member selector identifies a person, not a row number. Initially member 2 sits at row 2; after reversing all 34 rows it sits at row 31. In both computations its current feature row and its current permitted relationships must travel with that identity. Reverse feature rows, **both** adjacency axes and the corresponding label/role annotations. Changing only rows or only one adjacency axis attaches information to the wrong people.

Section 1's “Does moving a row change which paper it represents?” established this rule on a small constructed table. Here we apply it to the actual saved two-layer model and the current edited inputs. Keep the selected semantic member, fitted family and edited feature/edge values unchanged. Match the two output tables back by semantic ID before comparing their two class logits and probabilities. The storage toggle changes addresses, not features or topology. Outputs should agree up to floating-point summation order, using an explicit absolute tolerance of `1e−4` for this retained float32 model; report the actual maximum absolute difference rather than round it to an unexplained zero. A larger discrepancy is a mapping or numerical issue to inspect, not a newly learned prediction.

The displayed current row and selected member remain side by side. A pin keeps its own copied storage order and semantic mapping, so reversal cannot silently compare two different people. Resetting the graph alone leaves the storage choice and feature edits intact; resetting all inputs restores original storage and clears the pin while retaining the chosen model family. Loading another saved family or retrying its fetch retains these current input choices.

### How do known labels travel through the current edited graph?

Reuse the fit-only label-propagation rule on the current adjacency and follow its two scores into the selected member.

<!-- figure: D29-labels; current graph with only the ten fitting members drawn as clamped one-hot source rows, no development/assessment label-input wire. Trace old scores → closed-neighborhood row averaging → restore fitting rows for 200 synchronous rounds → selected semantic member's current two scores and decision. Keep graph edits from the shared D29 context; no additional parameter controls. Original recorded 16/18 baseline has separate unchanged input identity, not an overwritten comparison row. Live sentence names current graph identity, selected member, scores and class; zero-score tie chooses class 0 explicitly. -->

The recorded `16/18` baseline used the original graph. The view here asks a different question: **what does that same finite algorithm do on the graph I have now edited?** Start every non-fitting member at `[0,0]`. Give each of the ten fitting members its known one-hot label: `[1,0]` for class 0 or `[0,1]` for class 1. Development and assessment labels never initialize or clamp a row.

At each round every member averages the **old** two-score rows over its current neighbors and itself, using the closed-neighborhood receiver average from section 3. Then restore fitting rows to their original one-hot labels. Repeat exactly 200 rounds, as in the original baseline; this is the retained finite rule, not a claim to have solved an equilibrium. Display the selected member's current two scores and choose the larger one; the declared tie rule chooses class 0. A disconnected non-fitting component with no known-label source retains `[0,0]`, so that default decision contains no propagated label evidence. These scores need not sum to 1 at finite depth: the initially empty rows have not been supplied normalized class probabilities.

For a tiny hand check, temporarily use the already taught path 0—1—2 with fitting member 0 in class 0 and member 2 in class 1. The first average at member 1 is `[1/3,1/3]`; fitting rows are restored to `[1,0]` and `[0,1]`. At the next round its old own row also participates, giving `[4/9,4/9]`. The same synchronous/clamp mechanism acts on the larger edited network, without using its withheld answers.

An edge edit recomputes the current adjacency, row divisors and all 200 rounds. A structural-feature edit by itself does **not** change this baseline: it consumes known fitting labels and adjacency, not the neural model's three feature columns. Switching MLP/GCN/SAGE/GAT changes the neural route but not these fixed label sources. Storage reversal carries the sources and result mapping together and preserves semantic scores. The selected receiver comes from the preceding D29 view, so no new controls are needed here. Keep the original measured baseline identity and its `16/18` count separate from this current diagnostic, including after removing all message edges, graph-only reset, pinning or retry. With all message edges removed, own averaging leaves each fitting row clamped and all other rows zero.

We have now followed a legal complete fit and a sparse/library implementation, and inspected its actual unfavorable results. The next question is about depth: if a single round helps members share information, why can many rounds make useful differences harder to retain?

## 7. Why repeated propagation can blur distinctions

### What does another round actually do to the papers' numbers?

Return to the three-paper path and follow the same scalar row through two complete rounds before trying to explain an indefinitely deep network.

<!-- figure: D30; actual node rows first, then the three labelled node-valued patterns. -->

The top row is the familiar input, `(1, 2, 4)`. Each number belongs to its paper; this is one channel across three nodes, not three channels at one node. The next row is the GCN weighted sum from §3, without learned channel weights or an activation. Its entries are approximately `(1.316497, 2.707908, 2.816497)`. The third row applies exactly the same operation to that newly computed row: `(1.763747, 2.589923, 2.513747)`. Paper 0 can now depend on paper 2, because paper 1 carried information during the first round.

The round control performs another synchronized multiplication: every receiver reads the preceding complete row. It does not refit a classifier. Two other rows show why the numbers change. One node pattern is left unchanged by a round; another becomes half as large; a third reverses sign and becomes one sixth as large. Trace a pattern's values at nodes 0, 1 and 2 before reading its gain. A negative gain flips the whole pattern, rather than representing a negative probability.

To make those pictures precise, let `S` denote the symmetric closed-degree matrix already constructed in §3. A **mode** here is a node-valued pattern that `S` only rescales. The unchanged pattern is proportional to `(√2, √3, √2)`. The half-gain pattern is proportional to `(1, 0, −1)`. The sign-changing pattern is proportional to `(√3, −2√2, √3)`. Choose each pattern to have squared length one; call them `u₀`, `u₁`, and `u₂`. They are mutually perpendicular. Reversing the sign of any whole pattern describes the same direction, so the pictures keep one orientation consistently.

These are **eigenvectors** of `S`; the respective scaling factors `1`, `1/2`, and `−1/6` are its **eigenvalues**. The names now label a transformation you can see. They do not introduce an additional message mechanism.

\[
S=\begin{bmatrix}
1/2&1/\sqrt6&0\\
1/\sqrt6&1/3&1/\sqrt6\\
0&1/\sqrt6&1/2
\end{bmatrix},\qquad
Su_0=u_0,\quad Su_1=\tfrac12u_1,\quad Su_2=-\tfrac16u_2.
\]

Any three-number input can be built from these three patterns. Its coefficient on a unit pattern is the dot product `uᵀx`: multiply matching entries and add. That coefficient can be negative; it tells us which orientation and how much of the pattern is present. For example, the coefficient on the half-gain pattern is `(1 − 4)/√2 = −3/√2`. After one round this coefficient halves; after two rounds it is one quarter of its original value. The other patterns follow their own gains independently. Label a pattern by `k = 0, 1, 2`, write its gain as `g_k`, and let `ℓ` count rounds, as in §2. Repeated application raises each pattern's gain to the round count:

\[
x=\sum_{k=0}^{2}(u_k^Tx)u_k,
\qquad S^\ell x=\sum_{k=0}^{2}g_k^\ell(u_k^Tx)u_k,
\quad (g_0,g_1,g_2)=(1,\tfrac12,-\tfrac16).
\]

The expression explains the visible sequence: repeated multiplication attenuates the two changing patterns, leaving mainly the unchanged one. The gains are real because `S` is symmetric. The coordinate conversion to `P` from §3 preserves these gains: if `Su = gu`, then `P(D⁻¹ᐟ²u) = g(D⁻¹ᐟ²u)`. It is not necessary to compute eigenvectors to run a graph layer. We use them on this tiny graph to explain what the repeated local sum is doing.

The complete companion program `graph-propagation-limits.py` constructs the sparse operator once and uses the same receiving-node accumulation taught in §6. Its `propagation_states` function keeps the original input and each new state:

```python
def propagation_states(operator, features, rounds):
    states = [features]
    for _ in range(rounds):
        states.append(operator.apply(states[-1]))
    return states
```

`operator.apply` gathers each sender row, scales it by the closed-degree coefficient, and accumulates into the receiver. `operator.library_apply` performs the identical multiplication with an ordinary `torch.sparse.mm` call. Neither route allocates a dense node-by-node matrix. The program's `fixed_mode_table` deliberately does allocate one small diagnostic matrix for `torch.linalg.eigh`; that inspection route is separate from the sparse execution route. When an eigenvalue repeats, individual eigenvectors within its subspace are not uniquely determined. Read the retained subspace, rather than attributing meaning to an arbitrary solver-selected basis vector.

### Does “becoming similar” mean that every raw node value becomes equal?

Compare the raw limiting row with the row divided by each paper's square-root degree.

<!-- figure: D31; raw and degree-divided panels remain visible together. -->

Paper 1 has closed degree 3, whereas papers 0 and 2 have degree 2. The unchanged unit pattern is therefore `u₀ = (√2, √3, √2)/√7`. Its middle value is larger. After many rounds, the raw numbers approach approximately `(2.128426, 2.606778, 2.128426)`. They do **not** all approach the same raw value. Dividing by `(√2, √3, √2)` produces the same value at every node, approximately `1.505024`.

The two panels explain two coordinate systems. Raw rows are the actual output of the symmetric operator `S`. Degree-divided rows describe that same state relative to the graph's stationary pattern. The slider advances both panels together, so it cannot hide their difference by changing the displayed convention.

For a finite connected undirected graph with nonnegative edge weights, positive degree and a positive self-loop at every node, this fixed linear operation has one stationary direction and all other gains have magnitude less than one. Call its unit-length stationary pattern `u`: take the square root of each node degree and divide the resulting vector by `√(sum of degrees)`. Under **these assumptions**, and with no learned channel maps or nonlinearities, the limiting state is the projection onto that direction:

\[
u=\frac{\sqrt d}{\sqrt{\sum_i d_i}},\qquad
\lim_{\ell\to\infty}S^\ell x=u(u^Tx),\qquad
\frac{\left[u(u^Tx)\right]_i}{\sqrt{d_i}}
=\frac{\sum_j\sqrt{d_j}x_j}{\sum_jd_j}.
\]

The square root of the degree vector is taken entry by entry. The scalar on the right is independent of node `i`; that is the common value in the degree-divided panel. With multiple feature channels, the same projection applies to each column. Useful distinctions between nodes can disappear relative to this stationary pattern even while the raw rows differ because their degrees differ. This is one precise version of **oversmoothing**: repeated mixing removes distinctions the task might need.

The earlier §3 comparison between `S` and the row-normalized average `P` becomes clearer here. They are related by `P = D⁻¹ᐟ² S D¹ᐟ²`, where `D` is the diagonal degree matrix. If `f = D⁻¹ᐟ²x`, then applying `P` to `f` gives `D⁻¹ᐟ²Sx`. Changing the operator **and** the coordinates preserves this relation; applying both operators to the same unconverted row generally gives different outputs. In a regular graph all degrees agree and `P = S`. The degree-divided route is not a new activation or a separate normalization of the total feature-table size.

The small comparisons below the path show where the limiting statement changes. With two connected nodes and **no** self-loops, the normalized matrix simply swaps their values: `(1, 4) → (4, 1) → (1, 4)`. The alternating mode has gain `−1`; it does not shrink. With two disconnected two-node components and loops, `(1, 3, 4, 8)` becomes `(2, 2, 6, 6)`: each component retains its own stationary projection. A zero-degree node without a loop has no incoming contributions. Our implementation assigns it a zero inverse-degree factor, giving a zero propagated row; dividing that row by its degree's square root is still undefined and must be labelled so. It cannot be silently inserted into the positive-degree formula.

Try changing a relationship weight and inspect the new degree row before the output. The graph editor retains the supported two-, three- and four-node fixtures, arbitrary permitted weights from 0 to 4, values from −8 to 8, the self-loop choice and rounds 0–40 through adjacent focused views. The displayed modes and component limits must be recomputed for the actual edited operator. A stationary value calculated for the default path cannot describe a graph whose connectivity you just changed.

### Is graph mixing always a filter that steadily suppresses higher frequencies?

Start with the sign-changing node pattern, then follow its location on the frequency and gain axes.

<!-- figure: D32; node-valued pattern above directly labelled signed/magnitude gains. -->

The sign-changing pattern loses magnitude under our path's `S`, but it also changes sign. To describe the pattern's variation, subtract the mixing operator from the identity: `L = I − S`. The identity `I` leaves a row unchanged. Therefore `Lx = x − Sx` measures the discrepancy between a state and its mixed version. This is the graph's normalized **Laplacian** under the positive-degree convention above.

A mode with `S` gain `g` has `L` eigenvalue `λ = 1 − g`. These Laplacian eigenvalues are called graph **frequencies**. They measure variation across this graph, rather than cycles per second. The path's three values are `0`, `1/2`, and `7/6`. Its stationary pattern has zero variation; the sign-changing pattern has greater variation.

For the stated symmetric positive-degree graph, the quadratic quantity `xᵀLx` is a sum of nonnegative edge differences in degree-divided coordinates. Use `B`, the adjacency including self-loops introduced in §3, to weight each squared difference:

\[
x^TLx=\frac12\sum_{i,j}B_{ij}
\left(\frac{x_i}{\sqrt{d_i}}-\frac{x_j}{\sqrt{d_j}}\right)^2.
\]

Each undirected relationship occurs twice in the sum, so the factor one half removes double counting. A loop contributes zero difference. For a unit mode this quantity equals its `λ`, which connects the formal frequency to the visible neighboring values. This equation is for positive degrees; the earlier zero-degree convention is not an invitation to divide by zero.

On the graph-frequency axis, applying `S` once has **signed** gain `1 − λ`. Its **magnitude** is `|1 − λ|`. The signed line falls through zero at `λ = 1`, but the magnitude is V-shaped over `[0, 2]`: it falls to zero and then rises again. Thus “higher graph frequency always means less magnitude” is false over the whole allowed interval. At `λ = 2`, the gain is `−1`, matching the loop-free two-node swap. After `ℓ` rounds the gains are `(1 − λ)ᶩ`, with magnitude `|1 − λ|ᶩ`. An odd number of rounds retains a negative sign on a negative-gain mode; an even number makes that gain positive.

The power control changes rounds 1–6, not a claimed trained model. Watch the path's `λ = 7/6` mode shrink and alternate while the boundary example does not shrink. This gives a useful design question: which graph patterns should the task retain, and does the chosen operator actually retain them? Similarity between neighbors is helpful for some signals and destructive for others.

### Can we mix several neighborhood ranges without computing every eigenvector?

Follow the original state, one-round state and two-round state into three weighted branches of the same receiver.

<!-- figure: D33; actual I/S/S² routes, then the explicitly changed four-node chain. -->

The first branch contributes the original value. The second contributes half of the one-round value. The third contributes one quarter of the two-round value. At paper 0 this gives `1 + 0.5 × 1.316497 + 0.25 × 1.763747 ≈ 2.099185`. The whole output is approximately `(2.099185, 4.001435, 6.036685)`. We combined different ranges; we did not choose a single deepest state and discard the earlier ones.

\[
p(S)x=x+\tfrac12Sx+\tfrac14S^2x,
\qquad p(g)=1+\tfrac12g+\tfrac14g^2.
\]

This is a **polynomial filter**. Its coefficients decide the contribution from each propagation power. On a mode of gain `g`, the output gain is the scalar polynomial `p(g)`. In node space, the computation stays local: one `S` application crosses at most one edge, so a degree-`r` polynomial crosses at most `r` edges. A self-loop can retain a value at the same node; it cannot create a shortcut between distant nodes. Cancellation may make the actual support smaller than this upper bound.

The original path has no pair more than two edges apart. The second drawing deliberately changes to a four-node chain `0–1–2–3` so that a genuine third-hop dependency can be seen. With an input only at node 3, node 0 cannot receive it from `I`, `S`, or `S²`; it can receive it from `S³`. The degree control uses the declared coefficient family `1, 1/2, 1/4, 1/8`, truncated at degrees 0–3. It is not an unexplained selector among unrelated filters. A filter with `K` terms indexed `0,…,K−1` has maximum degree `K−1`; “three terms” and “three hops” are different claims.

The complete program accumulates powers by repeated sparse products, storing only the current power and accumulated result:

```python
def polynomial_filter(operator, features, coefficients):
    power = features
    result = torch.zeros_like(features)
    for index, coefficient in enumerate(coefficients):
        if index:
            power = operator.apply(power)
        result = result + coefficient * power
    return result
```

For `K` scalar coefficients and `d` channels, this costs approximately `O(K E d)` with the stored sparse edge count `E`, plus the output operations. It avoids dense `N²` adjacency storage and a full graph eigendecomposition. Autograd follows the accumulation, so coefficients can be learned. Replacing each scalar coefficient by an appropriate channel matrix gives a richer filter, with additional projection costs that should be counted explicitly.

**Deeper: why use Chebyshev polynomials?** The same filter can be expressed in a different polynomial basis. Scale Laplacian frequencies into `[-1, 1]` using `L̃ = 2L/b − I`, with a valid spectral upper bound `b`. For our normalized undirected operator, `b = 2` is valid; it does **not** say the path's largest frequency equals 2. Chebyshev polynomials start with `T₀(t) = 1`, `T₁(t) = t`, and satisfy `Tₖ(t) = 2tTₖ₋₁(t) − Tₖ₋₂(t)`. Apply that recurrence to a node table using sparse multiplication in place of scalar multiplication. Here `Z_k = T_k(L̃)X` is the node table at basis term `k`, `c_k` is that term's learned scalar coefficient, `K` is the number of terms, and `Y` is their weighted output:

\[
Z_0=X,\qquad Z_1=\widetilde LX,\qquad
Z_k=2\widetilde LZ_{k-1}-Z_{k-2},\qquad
Y=\sum_{k=0}^{K-1}c_kZ_k.
\]

For `b = 2`, our `L̃ = −S`. Consequently `T₁(L̃)X = −SX` and `T₂(L̃)X = (2S² − I)X`. Coefficients `(1.125, −0.5, 0.125)` recover the same filter `I + 0.5S + 0.25S²`. This is a changed basis for a calculation already traced by hand. `chebyshev_filter` in the complete program implements the recurrence with two preceding states and one accumulated output. A bound that is too small can move eigenvalues outside the intended interval and harm the recurrence's numerical behavior; high degree still requires stability checks.

The [localized spectral-filter paper](https://arxiv.org/html/1606.09375v3) develops this route. A library Chebyshev layer may construct a different Laplacian from its supplied edges. Match that operator and its scaling before comparing coefficients; our ordinary sparse PyTorch route uses the exact same `S` as the scratch route.

### Why is GCN's self-loop normalization a choice rather than an algebraic identity?

Compare adding an own-state branch with adding self-edges before recalculating degrees.

<!-- figure: D33-renormalization; author clarification of the accepted spectral/GCN boundary. Draw the same three-node path twice: open degrees (1,2,1), own branch plus open normalized messages on the left; closed degrees (2,3,2), single closed normalized sum on the right. Label every endpoint coefficient and actual output. No extra controls. At phone width stack the two complete routes; show distinct degrees before contributions. -->

Temporarily remove loops. Call its degree matrix `D_open`, normalized adjacency `R`, and Laplacian `L_open = I−R`. With spectral scaling bound 2, the first two Chebyshev terms give `c₀I−c₁R`. Tying `c₀ = θ` and `c₁ = −θ` gives an own branch plus normalized neighbors:

\[
R=D_{\rm open}^{-1/2}AD_{\rm open}^{-1/2},\qquad
c_0I+c_1(L_{\rm open}-I)=\theta(I+R).
\]

On our path, `(I+R)x ≈ (2.414214, 5.535534, 5.414214)`. `R` preserves its degree-square-root pattern; `I+R` doubles that pattern each round. [Kipf and Welling, §2.2](https://arxiv.org/html/1609.02907v4) replace `I+R` with §3's closed-degree `S`. Its output is instead `(1.316497, 2.707908, 2.816497)`. The own coefficient changes from 1 to `1/d_closed`; edge coefficients use closed degrees too. This **renormalization** changes the operator while retaining local reads. Bounded fixed mixing gains do not bound arbitrary learned channel maps or guarantee stable training.

```python
open_path = SymmetricPropagation.from_edges(3, [(0, 1), (1, 2)], loops=False)
closed_path = SymmetricPropagation.from_edges(3, [(0, 1), (1, 2)], loops=True)
features = torch.tensor([[1.], [2.], [4.]], dtype=torch.float64)
own_plus_open = features + open_path.apply(features)
closed_normalized = closed_path.apply(features)
```

Both calls reuse `graph-propagation-limits.py`. They differ in the taught graph/degree choice, rather than in a hidden library setting.

### Why can a distant input matter very little even when it has arrived?

Replace the path with a small branching tree and trace one leaf's change through the two receiving coefficients.

<!-- figure: D34; seven-node tree, four leaf routes and fixed-width root state. -->

The root is node 0. Its children are 1 and 2; their children are leaves 3, 4, 5 and 6. With self-loops, the closed degrees are `(3, 4, 4, 2, 2, 2, 2)`. All initial values are zero except a controllable value `δ` at leaf 3. After one round the root still receives no contribution from that leaf. After two rounds the route `3 → 1 → 0` contributes `δ / (√8 √12)`, approximately `0.102062 × δ`.

The first factor belongs to the edge from degree-2 leaf 3 into degree-4 node 1. The second belongs to degree-4 node 1 into degree-3 root 0. No alternative two-edge route from that leaf reaches the root. Each of the other leaves follows its own equally weighted route. The root has only one number in this example, so their four contributions are added into one value. It cannot tell which leaf supplied which amount from that sum alone.

**Sensitivity** means how much an output changes when a particular input changes. In this linear example the ratio is constant, so the derivative notation is simply another way to describe the traced coefficient:

\[
\frac{\partial h_0^{(2)}}{\partial x_3}
=(S^2)_{0,3}=\frac1{\sqrt8\sqrt{12}}
=\frac1{4\sqrt6}\approx0.102062.
\]

Move the leaf value between −2 and 2. The live root sentence changes with this exact product. At `δ = 2`, its contribution is about `0.204124`. All other inputs stay zero, so the picture separates this route's attenuation from a simultaneous change in other sources. The complete program also differentiates the operation with autograd; the gradient and the hand product agree.

**Oversquashing** concerns many potentially relevant dependencies being compressed through limited-width states and bottlenecks. It differs from oversmoothing, which concerned node distinctions disappearing under mixing. Too few rounds create a third issue, **underreaching**: the required source has not reached the receiver at all. In the tree, one round underreaches the leaf; two rounds reaches it with a small coefficient and merges several leaves into one number. These questions require different diagnostics.

The [sensitivity and curvature analysis](https://arxiv.org/html/2111.14522v3) bounds remote derivatives using powers of normalized adjacency under specified derivative assumptions. Our coefficient is an exact instance of a simple linear route, not a universal exponential law for all GNNs. Channel weights can amplify a route; activations can suppress it; attention can reroute it. Wider states, additional edges or a global reading mechanism may help a bottleneck, but each changes costs and the accessible information. A graph need not have exponentially growing neighborhoods, and adding an edge does not automatically preserve the task's legal data boundary from §5.

### What can an earlier-state shortcut preserve?

Trace the original paper row around the mixing stages and see exactly where it joins the new row.

<!-- figure: D35; initial-residual route, ordinary residual and separate JK readout. -->

The first drawing sends two things into the next state: a mixed version of the current row and a direct copy of the original input. The original is retained at every round, rather than replaced by the most recently mixed row. The control `α` sets how much of that original is injected:

\[
h^{(0)}=x,\qquad h^{(\ell+1)}=(1-\alpha)Sh^{(\ell)}+\alpha x,
\qquad 0\leq\alpha\leq1.
\]

At `α = 0` this is our plain fixed mixing. At `α = 1` every next state is the original input. For an intermediate value, a source's local input remains available alongside context. A mode with gain `g` has coefficient multiplied by `(1−α)g` on the previous-state branch and receives the original coefficient through the `α` branch. For `0 < α ≤ 1`, its limiting factor is `α / [1 − (1−α)g]` under this fixed linear recurrence. That explains what is retained; it does not select the best amount of context for a supervised task.

The next drawing is an **ordinary layer residual**, `h_next = h + Sh`. It bypasses the present mixing with the present state, just like the addition primitive in the earlier residual-network lesson. Its mode gain is `1 + g`, so its scale can grow. It is not the same recurrence as repeatedly injecting `x`. A residual branch supplies another value route and another derivative route, but it does not make every deep optimization problem easy.

The final drawing keeps `h⁰`, `h¹`, and `h²` until the output reads them. **Jumping Knowledge** refers to using representations from different depths; the pictured version concatenates them. For `d` channels, three states make `3d` channels per node. The output can inspect a node's original information, short-range context and longer-range context together instead of depending solely on `h²`. The original [Jumping Knowledge work](https://arxiv.org/abs/1806.03536) also studies ways to combine depths. Here concatenation is a concrete route, not a claim that every JK network uses it.

```python
states = propagation_states(operator, features, rounds=2)
all_ranges = torch.cat(states, dim=1)  # (nodes, 3 * channels)
initial_route = initial_residual_states(operator, features, 2, alpha=.2)
ordinary_route = features + operator.apply(features)
```

These routes answer different questions. Initial injection retains a fixed reference; ordinary residual adds the current representation; a depth readout exposes several already computed representations to the final decision. Decide which information is missing before choosing the route. Concatenation increases output width and storage, and a useful original channel must actually contain the needed information.

### Does fixed mixing prove that learned graph networks must lose the same distinctions?

Use two channels carrying two already introduced patterns, then follow the channel map after the node-mixing step.

<!-- figure: D36; two-channel mode table, S then right-hand map; scale diagnostics separate. -->

We deliberately change the input from scalar `x` to the two-column table `X = [u₀, u₁]`. The first column is the stationary node pattern; the second is the half-gain pattern. Two columns are needed because the learned channel map can now act differently on the two patterns. Multiplying on the left by `S` gives `[u₀, 0.5u₁]`. Multiplying this result on the right by `diag(1, 2)` restores `[u₀, u₁]`.

The drawing labels the axes of both operations. `S` mixes **nodes** within each column; the right-hand matrix mixes or rescales **channels** within each row. They do not share a dimension just because both are matrices. The second-channel gain control acts on the channel map only. A value 2 compensates this particular gain exactly in real arithmetic; 0 erases the second channel, and 3 amplifies it.

\[
SX=\left[u_0,\tfrac12u_1\right],\qquad
(SX)\begin{bmatrix}1&0\\0&2\end{bmatrix}=X.
\]

The construction needs an invariant feature span aligned with nonzero modes. If `S` annihilates a mode, multiplying its zero output by a channel gain cannot recover it. If another unwanted pattern contaminates the columns, the compensating channel map may amplify that contamination too. Even this constructed finite-depth example drifts in floating-point arithmetic: the new float64 sparse program's thirty repeated compensation steps differed from its initial table by about `4.24 × 10⁻⁸` in the largest entry. That measured error belongs to this implementation and execution, not an invariant mathematical constant or the result of fitting weights.

The [WeightRep study](https://proceedings.mlr.press/v260/zhuo25a.html) motivates examining learned weights rather than concluding from propagation alone. Our demonstration is narrower: suitable channel maps exist for this retained nonzero span. It does not show that an optimizer finds them, that nonlinear training preserves the span, or that every graph admits this inverse construction.

**Deeper: can a normalized smoothing score hide the scale of the state?** Compare a second route that applies `2S` uniformly to both columns. It produces `Hᶩ = [2ᶩu₀, u₁]`. Both directions remain present at finite depth, but the stationary column grows. The figure keeps four diagnostics separate: total squared size, raw variation, variation relative to size, and independent channel directions.

Total squared size is the sum of squares of all entries, written `‖H‖²_F`. Raw graph variation sums each column's Laplacian energy, written `tr(HᵀLH)`: `tr` adds diagonal entries of that small channel-by-channel matrix. Dividing this energy by total size asks a different question. **Singular values** describe the strengths of independent column directions; their nonzero count is the matrix's **rank**. In this orthogonal example they are `2ᶩ` and `1`.

| Depth `ℓ` | Total squared size | Raw variation | Variation / size | Singular values | Rank at absolute tolerance `10⁻¹²` |
| --- | ---: | ---: | ---: | --- | ---: |
| 0 | 2 | 0.5 | 0.25 | 1, 1 | 2 |
| 1 | 5 | 0.5 | 0.1 | 2, 1 | 2 |
| 6 | 4097 | 0.5 | approximately 0.0001220405 | 64, 1 | 2 |

The normalized variation falls, while raw variation stays 0.5 and both directions remain nonzero. The smaller-to-larger singular-value ratio is `2⁻ᶩ`, so the small direction becomes harder to resolve relative to the growing one without being mathematically erased. An absolute tolerance and a tolerance relative to the largest singular value answer different numerical-rank questions. For an all-zero state, variation divided by total size is undefined; adding an unexplained epsilon and calling that result exact would change the diagnostic.

The [rank-collapse analysis](https://arxiv.org/html/2308.16800v3) examines distinct structural and scaling assumptions. This finite table illustrates why a single score is insufficient. It is not a trained accuracy comparison or a universal immunity to smoothing. For a real experiment, inspect retained directions, scale, useful task signal and the legal assessment result together.

### Can channel normalization recover a direction that mixing erased?

Compare equalizing two retained columns with trying to equalize a table that has only one independent column direction left.

<!-- figure: D37; node-column patterns and four actual matrix stages; singular contrast always visible. -->

The first table is `Y = SX = [u₀, 0.5u₁]`. Its columns are perpendicular, with squared lengths 1 and 0.25. Form `YᵀY`: each entry is the dot product of two columns. This **Gram matrix** is `diag(1, 0.25)`. It describes the columns' uncentered size and alignment, not their covariance after subtracting a feature mean.

A channel map `diag(1, 2)` equalizes their lengths. In general, diagonalizing a positive-definite Gram matrix lets us divide each retained direction by its square-root eigenvalue. Call the Gram matrix `G = YᵀY`, its orthonormal channel-direction columns `V`, and their positive eigenvalues `γ`. Then `G = V diag(γ) Vᵀ` and `G⁻¹ᐟ² = V diag(1/√γ) Vᵀ`. The directions change channel coordinates, the diagonal rescales them, and the transpose changes back. Call the transformed table `Z`. Applying the map on the right gives a table whose Gram matrix is the identity. This operation is called **whitening** in the stated uncentered sense:

\[
Z=Y(Y^TY)^{-1/2},\qquad Z^TZ=I
\quad\text{when }Y\text{ has full column rank}.
\]

The ridge control uses `G + ρI` instead. A positive **ridge** `ρ` reduces amplification of a very small direction, but its output Gram matrix is no longer exactly `I`. At `ρ = 0.001`, this example gives diagonals `1/1.001 ≈ 0.999001` and `0.25/0.251 ≈ 0.996016`. Smaller eigenvalues are relatively more affected. This is a stability choice, not an identity-preserving exact normalization.

The always-visible comparison uses a complete three-node graph with unit closed adjacency. Its `S` is the matrix with every entry `1/3`. Every output node receives the same average. A zero-mean pattern such as `u₁` is sent to zero, so our two-column table drops from rank 2 to rank 1. Right multiplication can change which channel expresses a retained direction; it cannot create a node-valued direction outside the table's column span:

\[
\operatorname{rank}(YW)\leq\operatorname{rank}(Y).
\]

Exact inversion of a zero Gram eigenvalue is undefined. The code explicitly leaves absent directions uninverted, giving a projection on the retained channel subspace rather than falsely reporting an identity Gram matrix. An earlier-state shortcut could supply a direction that `Y` lacks, but that is extra information through another route—not recovery by a channel map alone.

The complete `gram_whiten` function derives its rule from the Gram matrix but computes the map from a singular value decomposition of `Y`. The SVD writes `Y = U diag(σ) Vᵀ`, with `γ = σ²`. Directly forming the Gram matrix squares the condition number; working with singular values avoids that unnecessary numerical step. For positive ridge, `torch.hypot(σ, √ρ)` forms the regularized denominator. For exact subspace whitening, singular values below the declared absolute tolerance are left uninverted. That numerical threshold is part of the reported result, not a proof that a small mathematical direction is absent.

```python
_, singular, right = torch.linalg.svd(features, full_matrices=False)
basis = right.T
inverse = torch.zeros_like(singular)
retained = singular > tolerance
inverse[retained] = singular[retained].reciprocal()
channel_map = (basis * inverse[None, :]) @ basis.T
whitened = features @ channel_map
```

This excerpt is the exact zero-ridge branch of `gram_whiten`; the complete file also contains the ridge branch. Channel whitening has decomposition costs and changes representation scaling. It should not be confused with dividing each node by its square-root degree, or with dividing the whole table's variation by total size. Each changes a different object for a different purpose.

If a table has more channels than rows, the reduced SVD omits some channel directions in which that table is exactly zero. The returned map acts only within its supplied SVD span. Multiplying this same table by it gives the stated regularized whitening result, because omitted directions contribute zero. The returned map is therefore not the full inverse-square-root regularizer on an arbitrary future table: such a table could have a nonzero component along an omitted direction. To reuse a fitted transform on new rows, specify the missing-direction policy as part of that transform rather than assume this current-table diagnostic makes the choice for you.

### Can rejecting messages improve the useful route instead of merely weakening it?

Follow the desired source and the distracting source into a shared intermediate node, with each gate drawn on its sender's wire.

<!-- figure: D38; directed source/intermediate/target routes and two synchronous gated rounds. -->

We switch from the undirected paper graph to the explicitly directed toy `0 → 1 → 2`, with an additional `3 → 1`. Node 0 carries the useful value 2; node 3 carries the distraction 7; nodes 1 and 2 start at zero. Two ordinary sum rounds deliver 9 to node 2. This is not wrong arithmetic: the operation has no instruction saying which source is useful.

For the stated task, a first-round sender gate can retain node 0 and reject node 3. A second-round gate retains node 1 so its useful message reaches node 2. Gates multiply a sender's current row before accumulation. They belong to the selected round and sender; a single static mask of receiver outputs would describe a different operation.

The ideal gates are exactly 0 or 1. A finite sigmoid gate approaches those endpoints but cannot equal them. The control therefore uses a small `ε`: desired gates are `1−ε` and denied gates are `ε`. Round one gives node 1 the value `2(1−ε) + 7ε`. Round two sends the fraction `1−ε` of that row to node 2:

\[
h_2^{(2)}=2(1-\varepsilon)^2+7\varepsilon(1-\varepsilon).
\]

At `ε = 0` the constructed binary limit delivers exactly 2. At `ε = 0.001` the result is 2.002995, so the finite near-binary route is close but not exact. Rejecting the desired first wire would instead remove the useful signal. The picture makes both distinctions explicit: reachability is necessary, and the route must carry the right information.

```python
def sender_gated_sum(features, edge_index, gates):
    source, receiver = edge_index
    return torch.zeros_like(features).index_add(
        0, receiver, features[source] * gates[source, None])
```

`routed_two_rounds` in the complete program supplies the exact graph, values and two gate rows. It has no optimizer and does not claim that a trained gate network discovers this route. The example shows why a smaller sensitivity to **irrelevant** inputs can be beneficial; interpreting every smaller derivative bound as worse task performance would miss the question being answered.

A separate readout can combine outputs from several depths. If `q₀`, `q₁`, and `q₂` are nonnegative and add to one, `q₀h⁰ + q₁h¹ + q₂h²` is a depth-weighted state. First identify those three existing rows, then change their weight. It is a mixture of computation depths, not a concatenation and not a per-edge attention weight. The [Adaptive Message Passing paper](https://arxiv.org/html/2312.16560v3) learns message filtering and depth within a variational framework. The complete variational objective belongs with variational inference; this local route teaches the filtering mechanism rather than pretending to reproduce the paper's trained system.

Depth now has several distinct questions: has useful information arrived, has it been compressed, has fixed mixing attenuated a required pattern, can earlier states supply it, and can channel operations act on the information still present? Even one round can also lose a distinction immediately if aggregation sends two different neighborhoods to the same value. That is the next section's question.

## 8. What aggregation can distinguish

### If two neighborhoods have the same sum, can a later neural layer tell them apart?

Keep each neighbor occurrence visible, then follow the two different lists into the same aggregate value.

<!-- figure: D39; separate occurrences, raw merge and pre-aggregation lifted coordinates. -->

We leave the three-paper path temporarily to isolate an aggregation decision. The first receiver has two neighbor values, `1` and `3`; the second has `2` and `2`. The second list contains **two occurrences** of value 2, not one occurrence drawn twice for decoration. Both sums are 4. If an MLP sees only that scalar 4, its input is identical for the two cases. Regardless of its hidden width or training, a deterministic MLP cannot return different outputs for identical inputs.

The drawing's lower route changes what happens **before** the sum. Transform every occurrence `v` into the two coordinates `φ(v) = (v, v²)`. The first list becomes `(1, 1)` and `(3, 9)`, whose sum is `(4, 10)`. The second becomes two copies of `(2, 4)`, whose sum is `(4, 8)`. A later MLP now receives distinguishable rows. The second coordinate retained information about spread that the raw sum discarded.

\[
\sum_{v\in\{1,3\}}v=\sum_{v\in\{2,2\}}v=4,
\qquad
\sum_{v\in\{1,3\}}\phi(v)=(4,10),\quad
\sum_{v\in\{2,2\}}\phi(v)=(4,8).
\]

The lesson is about operation order. A transform applied to each neighbor can preserve a distinction; the same transform applied only to the already-collided sum cannot recover it. This is why §4's pooling aggregator transformed donors before reducing them. A useful transformation still has to preserve the distinctions the target task requires.

The independent list editor is a separate experiment from the single-node graph editor. First set the sizes of lists A and B from 1 to 6. Then select a list, an occurrence, and its value between −8 and 8. Both raw and transformed routes remain visible. Copying A into reversed B checks order invariance without sharing a mutable list: future edits in A must not alter B. If you choose mean or max for the raw route, the transformed route remains explicitly labelled **sum of transformed occurrences**. It is not silently changed into transformed mean or max.

Try `(0, 4)` versus `(1, 3)`: equal raw sums, but transformed sums `(4, 16)` and `(4, 10)`. Then try three occurrences, `(1, 1, 4)` versus `(0, 3, 3)`. Both raw sums are 6 and both squared-value sums are 18. This particular two-coordinate lift also collides. Distinguishing one counterexample does not establish that an aggregator distinguishes every possible neighborhood.

```python
def lifted_sum(values):
    occurrences = torch.as_tensor(values, dtype=torch.float64)
    transformed = torch.stack((occurrences, occurrences.square()), dim=1)
    return transformed.sum(dim=0)
```

Here the first tensor axis holds occurrences, and the second holds the two transformed coordinates. `sum(dim=0)` reduces occurrences while keeping channels. Reversing occurrences changes neither output coordinate; deleting an occurrence generally does. For learned transforms, replace the displayed polynomial `φ` with a shared network on each donor, rather than assuming a post-sum network has the same information.

### Which reducers notice that a neighbor value occurred twice?

Compare a list with a duplicated whole list through three permanently visible reduction paths.

<!-- figure: D40; count-labelled occurrence groups feeding sum, mean and max separately. -->

The original list `(1, 3)` has sum 4, mean 2 and maximum 3. Duplicating the entire list gives `(1, 3, 1, 3)`: sum 8, mean 2 and maximum 3. **Sum** retains the total contribution and is sensitive to multiplicity. **Mean** divides by the occurrence count; duplicating every occurrence equally preserves it. **Max** retains the largest value and ignores how often smaller values occur.

Unequal duplication is different. `(1, 3, 3)` has mean `7/3`, not 2. Therefore “mean ignores duplicates” is too broad; it ignores proportional duplication of the whole multiset. Max can miss both counts and the values below its largest entry. A mean can be useful when the target needs a typical neighbor; a sum can be useful when the target depends on total quantity. Neither is always more useful, because the task defines what information matters.

A **multiset** is a collection that ignores order but retains occurrence counts. It is the appropriate object for these neighborhood reducers: a relabeling or reordering should not change a shared aggregation, while two equal-valued neighbors can still be two distinct contributions. The already introduced SAGE editor supports 0–6 occurrences with independent values; duplicating its whole list is enabled only when it fits the same six-occurrence domain. Counts are not replaced by a fixed menu of examples.

At an empty neighborhood, sum has the natural value zero. A mathematical mean of zero items and a maximum of an empty set are not ordinary finite numbers. The local SAGE editor uses the previously stated zero-aggregate convention so the own-node branch survives. A library reducer may use its own neutral-fill convention. Report that convention explicitly, especially with negative values, rather than accidentally treating a zero fill as a genuine maximum supplied by a neighbor.

This gives an engineering decision rule. If count matters, preserve it through the reducer or add it as an explicit feature. If scale should not vary with count, a mean may be appropriate, while another channel retains the count needed by the output. Compare each route on a changed case before treating an abstract “expressiveness” claim as a task recommendation.

### How does GIN keep a node's own contribution and its neighbor multiset?

Trace the separate own-node branch and neighbor-sum branch into one MLP input, without inserting a second self-loop message.

<!-- figure: D41a; self/neighbor branches, actual scalar input and explicit shared MLP. -->

The center value is 2 and its neighbor values are 1 and 3. Sum the neighbors to obtain 4. Multiply the own value by `1 + ε`, add the two branches, and send the result into a shared MLP. Initially `ε = 0`, so its input is `2 + 4 = 6`. For this worked scalar picture, use a specified MLP: hidden values `ReLU((t, −t))`, followed by the difference of its two hidden entries. This tiny MLP returns `t` for both positive and negative `t`; it makes the numerical route inspectable rather than claiming to learn a rich task.

Changing `ε` changes the own contribution while retaining the neighbor sum. At `ε = 0.5`, the own contribution is 3 and the MLP input is 7. The neighbor-value control acts on an already labelled donor. A zero neighbor count still leaves `(1 + ε) × own`; its behavior is not the closed-neighborhood GCN formula.

\[
h_i^{\mathrm{new}}=
\operatorname{MLP}\!\left((1+\varepsilon)h_i+
\sum_{j\in\mathcal N(i)}h_j\right).
\]

This is the update used by a **Graph Isomorphism Network**, or **GIN**. The name concerns what graph structures its aggregation can distinguish under assumptions; it does not promise a solution to arbitrary graph-isomorphism instances. The neighbor sum here excludes the explicit own branch. Adding stored self-loop edges without adjusting the formula would count the own row again.

The complete `SparseGin` implementation is in `graph-aggregation-variants.py`. It sums incoming non-self edges, adds the scaled own row, and invokes its supplied MLP. A trainable `ε` is a parameter; a fixed `ε` is a buffer. The epsilon tensor starts on the MLP's device and in its dtype, so constructing a float64 layer does not first round that value through a float32 tensor. The default fixed epsilon is not an assertion that every theoretical discriminative choice or trained configuration has the same strength.

```python
return self.transform((1 + self.epsilon) * features + neighbors)
```

This excerpt is the implemented update; the complete supplied class defines the edge reduction and fixed/trainable state. Next match that exact computation to an ordinary library layer, rather than infer equivalence from its name.

<!-- figure: D41-library; two parallel actual tensor routes on the declared four-node two-channel fixture: gather neighbors plus scaled own row → 4×2 MLP input → Linear 2→3 → ReLU → Linear 3→2. Label scratch transform/epsilon and PyG nn/eps at their matching ports. Between parameter tables draw construct GINConv (reset) → copy MLP state and epsilon → compare; copying before construction is explicitly crossed out. Show node 3 has no neighbor wire, input [2.106,.585], hidden [.9254,0,1.0137], output [.53036,.22177]. Below the figure show the same .03 SGD update acting on matched trainable tensors; fixed epsilon stays a buffer, with no update arrow. Static drawing, no controls; stack routes/parameter transfer on phone with legible labelled widths. -->

The ordinary [PyG `GINConv` source](https://pytorch-geometric.readthedocs.io/en/latest/_modules/torch_geometric/nn/conv/gin_conv.html) constructs its layer by **resetting the supplied MLP**. Merely passing a copied MLP therefore does not preserve its learned values. `ordinary_gin_layer` first constructs the ordinary layer, then loads the scratch MLP's state into `other.nn` and copies the current epsilon into `other.eps`. It uses `train_eps=True` only when the scratch epsilon is a parameter. A fixed buffer still travels with the state but does not receive an optimizer step.

The mapping's core, with `layer` a complete `SparseGin` instance, is

```python
import copy
import torch
from torch_geometric.nn import GINConv

parameter = next(layer.transform.parameters())
train_epsilon = isinstance(layer.epsilon, torch.nn.Parameter)
other = GINConv(copy.deepcopy(layer.transform),
                eps=float(layer.epsilon.detach()[0]),
                train_eps=train_epsilon).to(device=parameter.device,
                                            dtype=parameter.dtype)
other.nn.load_state_dict(layer.transform.state_dict())
with torch.no_grad():
    other.eps.copy_(layer.epsilon)
```

The complete helper also returns corresponding trainable parameter pairs: the MLP's named weights and biases map to the same names in `other.nn`, and trainable `epsilon` maps to `other.eps`. These are separate tensors with equal initial values; updating one must not mutate the other through accidental shared storage. Both routes consume the same `features` and source/target `edge_index`, with no stored self loops because the own branch is already explicit.

For a concrete comparison, the supplied `matched_gin_example` switches to four nodes with two input channels and an explicit 2→3→2 MLP. Node 3 is isolated and has feature `[1.8,.5]`. At epsilon `.17`, its MLP input is `[2.106,.585]`; the defined first map and ReLU produce `[.9254,0,1.0137]`, and the second map produces `[.53036,.22177]`. The other nodes have explicit directed donor lists; the complete function supplies their rows, maps, biases and imports. No weights are fitted in this example.

Its scalar comparison objective multiplies the output cells by the stated probe table `arange(1,9).reshape(4,2)/7` and sums them. That choice exposes input, MLP and epsilon derivatives without pretending to be a task accuracy loss. Both layers differentiate the same scalar, compare every mapped derivative, take an equal `.03` SGD step on their trainable tensors, and compare the new outputs. Calling `matched_gin_example(train_epsilon=False)` repeats the same route with fixed epsilon; it remains `.17` while MLP parameters update. The file's main calls both examples and prints their actual before/after values and mapping counts. Both forward/derivative/update routes were executed in the stated Torch/PyG environment. Matching one layer does not establish that a trained classifier reaches the strongest possible discriminator.

**Deeper: what does the injectivity claim actually require?** A function is **injective** when distinct permitted inputs always have distinct outputs. The GIN theory uses a countable feature domain and bounded-size multisets, with sufficiently expressive shared transformations and readouts. A raw sum of arbitrary real values is not injective, as the first picture showed.

One existence argument is easier to see as digit counting. Enumerate permitted labels as `1, 2, …`, assume no multiset contains more than `M` occurrences, and choose an integer base `B > M`. Map label `k` to `B⁻ᵏ`. A finite multiset's sum places its count for each label in a separate base-`B` fractional position. Because each count is smaller than `B`, it cannot carry into another label's position. Distinct bounded finite multisets then have distinct sums in exact arithmetic. This explains how a suitable **pre-sum** representation can preserve multiplicity. It is not an efficient floating-point encoding for unrestricted data: late positions can become numerically unresolved.

Distinguishing the center from its neighborhood is an additional requirement. For suitable encodings, a choice such as an irrational `ε` can separate that own-node contribution from the rational multiset code in the theoretical construction. This explains why the coefficient matters; it does not prescribe storing an exact irrational number in a computer or claim that the default `ε = 0` is injective for all center/multiset pairs. For instance, swapping own value 1/neighbor 2 with own value 2/neighbor 1 collides at `ε = 0` if both are encoded directly as scalars.

The [GIN paper](https://arxiv.org/html/1810.00826v3) connects such injective aggregation to neighborhood refinement. A finite-width MLP, finite precision, optimization and the actual input distribution remain separate issues. For an engineer, the useful consequence is to inspect what the aggregation discards and choose a representation adequate for the task; for a researcher, it is to state the permitted input domain and readout assumptions before making a discrimination theorem.

### How does neighborhood refinement compare structures without relying on their drawing positions?

Follow old categorical labels into a center-and-neighbor tuple and assign new labels using one shared dictionary.

<!-- figure: D41b; old labelled graphs, sorted occurrence tuples, shared dictionary and next-state graphs. -->

Start each node with a categorical label such as `A`. For one node, record its own old label separately from the **multiset** of its neighbors' old labels. Sort that neighbor list only to obtain a reproducible tuple; sorting does not remove duplicates. A node with own label `A` and two neighbors labelled `A` has the tuple `(A, (A, A))`. Another with three such neighbors has `(A, (A, A, A))`, which is different.

Assign a new label to each distinct tuple. The two graphs must use the **same dictionary**, so equal tuples receive the same new label across graphs. All tuples are built from the old labels before any node is updated. This is the same synchronous-old/new distinction taught in §2; updating labels in place would make the result depend on processing order.

Repeating this operation is **one-dimensional Weisfeiler–Lehman refinement**, usually written **1-WL**. After a round, the counts of new labels summarize which neighborhoods occurred. If two graphs have different label counts, this refinement distinguishes them. If the counts remain identical, it has not established that the graphs are isomorphic; it has merely failed to distinguish them with this procedure.

```python
key = (old_labels[node], tuple(sorted(old_labels[j] for j in neighbors[node])))
```

`refinement_round` in the supplied aggregation program accepts one flat old-label list and its incoming-neighbor lists, makes the shared tuple dictionary, and returns one flat new-label list. To compare two graphs, join their label lists, offset the second graph's neighbor indices, and call it **once**. Then split the returned labels at the first graph's size. Calling the function separately on two graphs can assign dictionary integers differently and is not the shared-dictionary comparison described here.

```python
offset = len(labels_a)
joint_labels = labels_a + labels_b
joint_incoming = incoming_a + [[offset + node for node in donors]
                               for donors in incoming_b]
joint_next = refinement_round(joint_labels, joint_incoming)
next_a, next_b = joint_next[:offset], joint_next[offset:]
```

This construction never adds edges between the graphs. It shares the label-assignment rule, not their messages. The comparison uses categorical tuples for exact matching rather than floating neural outputs. A node renaming permutes the result without changing its graph-level label counts. Coordinates used to lay out circles never enter those tuples.

Under the GIN theorem's suitable injective aggregation/update and graph-readout assumptions, a message-passing model can match the distinguishing power of this refinement on its allowed inputs. A graph-level readout that discards necessary counts can weaken that correspondence. A node-level prediction and a graph-level discriminator are different tasks, as §1 established. A shared local network also cannot extract a structural distinction that none of its permitted messages reveals.

### Can two visibly different graphs remain identical to every one of these local rounds?

Compare one six-node cycle with two disconnected triangles, retaining the same initial feature and degree at every node.

<!-- figure: D42; explicit C6 and two separate triangles, no connecting edge; matched node/graph readouts. -->

The left drawing is a ring with six nodes. The right drawing is two triangles with no edge between them. Both graphs have six nodes, each with two neighbors and initial feature 1. In the cycle, a node receives two ones; in a triangle, a node also receives two ones. Adding its own one gives 3. The next round adds three copies of 3, giving 9. After `ℓ` rounds of this specified self-plus-neighbor sum, every node in either graph has `3ᶩ`, and both graph sums are `6 × 3ᶩ`.

The integer-round control changes both graphs together. At round zero they have the same node values; no number of these symmetric local rounds reveals which graph is disconnected. Under 1-WL, all nodes also retain equal labels at every round because their own labels and neighbor-label multisets remain equal. Adding the same shared MLP or the same epsilon coefficient cannot create a distinction from identical local inputs in these regular graphs.

The circles' positions make the structures obvious to **you**, but positions are not features here. Giving a node a distinctive input value can break the symmetry; that deliberately changes the input problem. Unique node IDs can also introduce distinctions while changing the desired relabeling symmetry. Higher-order structural methods, explicit component information or suitable positional features are different model choices, not proof that the local update secretly saw the missing structure. The next Graph Transformers lesson will examine additional structural and geometric information with that distinction intact.

This is why expressiveness and prediction quality need separate experiments. A structural counterexample identifies a limitation of a stated model family. It does not say the family is useless on a practical dataset, nor that a more expressive alternative generalizes better. The unfavorable Karate results in §6 remain empirical results under their recorded protocol. This six-node pair is a controlled representational limit.

We now know what one aggregation can retain and lose. A large graph adds another practical issue: even a legally defined neighborhood may be too expensive to materialize for every seed and every layer. Next we separate sampling occurrence paths, actual node identities and the computation order so a scalable implementation does not accidentally change its objective or leak information between examples.

## 9. Sampling, batching and useful applications

### How much context must one seed read?

Begin at the output you need, expand its dependencies outward, then compute the required representations inward.

<!-- figure: D43a–c; four-ID complete directed no-self graph and its separate cyclic occurrence tree. Expansion arrows say “needs”; inward message arrows say “supplies”. Show depth/fanout/replacement in adjacent focused views, all original domains preserved. Compact large trees into exact level counts with accessible occurrence records, not 585 tiny circles. -->

The **seed** is a node whose output or loss we currently need. A **fanout** is the number of neighbor reads requested for a receiver at one expansion step. A two-layer output needs its immediate neighbors' first-layer states; those states may need another set of initial neighbors. The tree starts with the seed at hop zero. Each child records a dependency of the parent. A downward dependency arrow therefore means “the parent needs this child's state”; actual information travels from that child back toward the parent. This is a diagram of computation, rather than a new graph with extra real nodes.

We switch from the three-paper path to a four-ID graph to make repeated dependencies visible. IDs 0, 1, 2 and 3 each have the other three IDs as incoming donors. Seed 0 requests four donor occurrences, then each occurrence requests three more. In the illustrated **cyclic** ordering, seed 0 reads `[1, 2, 3, 1]` when replacement is allowed. Two positions have ID 1, but they are two requested message occurrences from the same underlying node. The next level has twelve positions. Counting the root gives `1 + 4 + 4 × 3 = 17` occurrences, while only four underlying IDs appear.

Replacement means a donor may occupy more than one slot in the same sample. Without replacement, the first request for four is capped at the three available donors; the level counts become 1, 3 and 9, totaling 13. Changing depth retains the existing fanouts; a newly added hop begins at fanout 2. A zero fanout leaves that dependency level and all subsequent levels empty. At three fanouts of 8 with replacement, the counts are 1, 8, 64 and 512: 585 occurrences, still only four unique IDs. The figure then uses readable level counts and a traced path instead of squeezing hundreds of labels together.

For `L` outward expansion steps with fanouts `f₁, …, f_L`, the uncapped neighbor-tree count is

\[
1+\sum_{k=1}^{L}\prod_{j=1}^{k}f_j.
\]

This counts the specified neighbor occurrence tree. It is not a claim that all implementations allocate that many unique nodes, or that every full model's own-state branches and intermediate buffers fit that count. A self/root map, such as mean GraphSAGE's own projection, also needs the receiver's earlier state. A block implementation must retain that row even when no neighbors are sampled. For an outward 25/10 example, the tree bound is 276 including the root, not 250 unique nodes. Sharing, available degree and a chosen computation schedule determine actual storage and work.

The unchanged cyclic illustration is deliberately predictable: it exposes identities, multiplicity and count limits. It does **not** draw donors uniformly at random. An unbiased-estimator claim needs a separate probability model, which we introduce next. Coalescing storage for two equal IDs is also different from discarding one of their edge occurrences: the latter changes a sum and can change a mean when only some donors are duplicated, as §8 showed.

### What does “unbiased” guarantee—and what does it leave out?

Average every equally likely sample before deciding whether sampling preserves an operation.

<!-- figure: D44; four donor values, all six unordered two-donor samples, each pair→mean→square, then two distinct expectation routes. One last-donor control; show exact fractions and all-equal zero-variance countercase. -->

This example switches to four donor values `[1, 3, 5, 9]`, with no claim that they are the cyclic graph's samples. Choose two distinct donors uniformly: all six unordered pairs have probability `1/6`. The six pair means are 2, 3, 5, 4, 6 and 7. Their average is `27/6 = 4.5`, exactly the full four-donor mean. Here **expectation** means an average of outcomes weighted by their probabilities. Equal probabilities let us simply average the six rows.

An **unbiased** sampled mean has expectation equal to the quantity it estimates. It need not equal that quantity on a particular draw. For example, selecting values 1 and 3 gives mean 2 rather than 4.5. The seed control in the separate random-sampler view makes a draw reproducible; it does not remove the difference between one draw and the expectation over all draws.

Now square each sampled mean. The six squares are 4, 9, 25, 16, 36 and 49. Their average is `139/6 ≈ 23.1667`. Squaring the full mean gives `4.5² = 20.25`. The two routes disagree because a square is nonlinear: moving the average across that operation changes the result. The gap is the sampled mean's variance, `35/12 ≈ 2.9167`.

Let `M` name the random sample mean and `μ` the full mean. For this unbiased scheme,

\[
\mathbb E[M]=\mu,\qquad
\mathbb E[M^2]=\mu^2+\operatorname{Var}(M).
\]

Variance is the average squared distance from the mean. Expanding `(M − μ)²` and using `E[M] = μ` gives the second identity. It explains the visible gap without a noisy Monte Carlo approximation. Change the final donor from 9 to another value and the six routes recompute. If all donors are equal, every sample mean is the same; variance and the gap are zero.

The same issue can occur at a neural activation. With donors `[-3, −1, 1, 3]`, the six means are `[-2, −1, 0, 0, 1, 2]`. Applying ReLU first and averaging gives 0.5. Applying ReLU to the full mean of zero gives zero. This is a second worked nonlinear example, not an assertion that every activation produces a gap in every case.

Sampling therefore changes more than a memory budget. A nonlinear layer, loss or gradient can depend on the sampled computation's distribution. It is possible to estimate gradients of a **sampled objective** while not matching the corresponding full-neighborhood objective. State which objective is intended; do not conclude that every sampler's gradient is biased from this one mean example. A nonuniform sampler also needs an appropriate estimator if the target is a uniform neighbor mean. Duplicate edge occurrences, sampling with replacement, sampling sums and temporal eligibility each define different distributions or quantities.

`pair_sample_statistics` in `graph-sampling-batching.py` enumerates every pair. It computes the full mean, expected sample mean, expected square and variance directly. The exact enumeration is the reference for this four-donor picture; it is separate from both the cyclic trace and the seeded implementation below.

### How do global nodes become local layer blocks?

Keep the identity map, sampled edges and layer order explicit, so one row never silently becomes another node.

<!-- figure: D43d; separate seeded incoming sampler with ≤3 controls. Draw original global source→receiver edges, outward block construction, local source/target row maps and reversed computation. Label seed rows and loss; include own-state row at zero fanout. -->

A **global ID** identifies a node in the whole legal graph. A **local index** identifies its row in one smaller table used for a calculation. Those numbers need not be equal. If a source table contains global IDs `[1, 2, 0, 3]`, local source row 0 is global node 1, and row 2 is global node 0. A separate target table `[1, 2]` contains two receiver rows. The local edge `2 → 0` means “global node 0 supplies global node 1,” not “global node 2 supplies global node 0.”

The new sampler first builds incoming lists from the original source/receiver edge list in one `O(N + E)` preprocessing pass. For each required receiver, it chooses incoming **edge occurrences** uniformly, retaining repeated occurrences if the input has duplicates or sampling permits replacement. No outgoing edge becomes incoming merely because both endpoints were selected. Sampling never grants access to an otherwise forbidden relationship.

We use **per-layer bipartite blocks**: each block has a source table, a target table and local source-to-target indices. “Bipartite” here describes those two computational tables; a global node may occur in both. Equal global IDs share storage within a block, but repeated sampled edges remain in its reduction. The target IDs are placed first in the source table so the own-state rows are readily available.

Our chosen block sampler samples a receiver's context once per required layer and shares that computed state. An independently sampled unfolded tree could sample different contexts for two occurrences of the same global node. Coalescing those two independently sampled computations would change that stochastic model. Thus the cyclic occurrence count, our shared layer blocks and an ordinary loader's union subgraph are three explicit representations; their identity bookkeeping connects them, but we do not assert that their random computations are interchangeable.

Suppose two forward layers use fanouts `[2, 1]`. The last layer needs one donor per seed. After finding those donors, the first layer needs two donors for each row required by that last-layer block, including the seed's own earlier state. Construct dependencies backwards, using `[1, 2]`, then reverse the constructed block list to compute forwards. A list described as **outward hops** and a list described as **forward layers** have opposite conventions here; always name the convention.

The complete program's fixed example has global scalar features `[1, 3, 5, 9]` and directed edges `0→1, 1→2, 2→1, 3→2, 1→0, 2→3`. With seed ID 1, forward-layer fanouts `[2, 1]` and random seed 7, the first block's source IDs are `[1, 2, 0, 3]`, its target IDs are `[1, 2]`, and its local edges are `2→0, 1→0, 0→1, 3→1`. The second block has source IDs `[1, 2]`, target IDs `[1]` and edge `1→0`.

In the first layer, both output channels use own coefficient 0.5, neighbor coefficient 0.25 and zero bias. Global node 1 reads donor values 1 and 5: its own contribution is `0.5 × 3 = 1.5`, its neighbor contribution is `0.25 × 3 = 0.75`, and each hidden channel becomes 2.25. Global node 2 reads 3 and 9, giving `0.5 × 5 + 0.25 × 6 = 4` per channel. ReLU leaves these positive values unchanged. In the second layer, summing the two own channels with coefficient 0.5 gives 2.25, and reading the two donor channels with coefficient 0.25 gives 2. The seed's final scalar is 4.25.

The reduction is the same mean GraphSAGE operation taught in §4. Only the indexing domain and required rows change:

\[
\bar h_i=\frac{\sum_{(j\to i)\in E_{\rm sampled}}h_j}
{\max(1,\text{number of sampled incoming occurrences for }i)},
\qquad
h'_i=W_{\rm neighbor}\bar h_i+b+W_{\rm own}h_i.
\]

The declared empty-neighbor summary is zero. It does not erase the own projection or bias. Self-loops are not silently inserted into the neighbor mean. For a fixed sampled block, gather and reduction cost `O(E_block × d_in)`, plus the two projections' costs. Source tables are built once per sampled calculation rather than repeatedly constructing a dense `N × N` adjacency. This small Python sampler makes the mechanism inspectable; a compiled sampler and fused kernels may be preferable for a large real graph.

Save `message-passing-operators.py` beside `graph-sampling-batching.py`: the latter imports the exact earlier `SparseMeanSage` parameters and changes their scheduling rather than rewriting the learned layer. The core forward route is:

```python
blocks = sample_blocks(incoming_index(edge_index, len(features)),
                       seeds=[1], layer_fanouts=[2, 1], seed=7)
seed_logits = run_sampled_sage(features, blocks, layers)
# This constructed binary target belongs to seed global ID 1 only.
seed_targets = features.new_tensor([[1.]])
loss = F.binary_cross_entropy_with_logits(seed_logits, seed_targets)
loss.backward()
```

The loss is `softplus(−4.25) ≈ 0.01416346`. Only seed labels enter this loss. Context nodes provide permitted inputs and intermediates, not extra labeled targets. The complete file includes all sampler, block, reduction and batching functions and a runnable `main`; no hidden dataset download or fitting step supplies this example.

For the **same fixed blocks**, ordinary PyG `SAGEConv` accepts `(source_features, target_features)` and explicit `(source_count, target_count)`. `matched_library` from the earlier operator file returns `(layer, parameter_pairs)`; use its first item as the callable layer. Map its `lin_l` weight/bias to the neighbor projection and `lin_r` weight to the own projection. `run_sampled_sage(..., library=True)` invokes these actual bipartite library layers. Forward outputs, input and all mapped parameter gradients, and one SGD update agree on the checked fixed blocks, including empty and repeated incoming lists.

For ordinary large-graph sampling, use PyG's [`NeighborLoader`](https://pytorch-geometric.readthedocs.io/en/latest/modules/loader.html#torch_geometric.loader.NeighborLoader) with legal input nodes and outward-hop fanouts. Its returned graph includes a `n_id` local-to-global map and starts with `batch_size` seed rows; apply the supervised loss to those rows. Its union-subgraph representation is not identical to our separate per-layer blocks. Do not claim that both random routes sample the same realization merely because their fanout numbers look alike. The complete file constructs and attempts the actual loader, reporting the missing `pyg-lib`/`torch-sparse` backend in the current executed environment. The offline sampler remains a separately named scratch route, not a silently substituted successful `NeighborLoader` run.

Cache sampled results only under the identity of the graph, legal cutoff, ordered seeds, distribution, fanout convention, random state and feature/model versions that they use. The cache question in §5 applies here too. A cached sample from another prediction time or altered edge list is a different computation. More scalable choices—cluster-based batches, layer-wise or importance sampling, and shared sampled contexts—trade different work and estimator properties; compare their actual target, normalization and eligibility rules rather than treating “sampling” as one interchangeable operation.

### How can two graphs share a tensor without sharing information?

Concatenate their rows, offset their edges, and retain graph membership for separate readouts.

<!-- figure: D45; three-paper path plus a distinct two-node graph, actual source/receiver offsets, 5×5 block adjacency, separate/batched results and forbidden cross cells. Retain the old 2+2 batch case in a separate focused view. One second-graph feature and one faulty-offset control per view. -->

Return to the three-paper path, now with features `[1, 3, 5]`. Alongside it put an independent two-node graph with features `[8, 2]`. The first graph occupies global batch rows 0, 1 and 2; the second occupies rows 3 and 4. Its local edge `0→1` must become `3→4`, and its reverse must become `4→3`. Add the first graph's node count, 3, to **both** endpoints. Membership is `[0, 0, 0, 1, 1]`: each row's graph ID, not an input feature learned by the model.

The 5-by-5 adjacency has two diagonal blocks and zero off-block cells. No path can carry graph B's feature into graph A. With own coefficient 1, open-neighbor mean coefficient 1 and bias zero, the path outputs are `[4, 6, 8]` and graph B outputs are `[10, 10]`, whether calculated separately or in the correctly offset batch. Graph A's middle receiver adds its own 3 to the mean of 1 and 5, giving 6.

Change graph B's first feature from 8 to 12. Its outputs become `[14, 14]`; graph A stays `[4, 6, 8]`. A bad offset of 2 instead of 3 creates a cross-graph edge between batch rows 2 and 3. The declared membership vector cannot repair that wrong message permission. The highlighted off-block cells explain why B can then affect A. A separate adjacent view preserves the earlier two-plus-two-node case and its full feature domain, where a bad offset of 1 instead of 2 crosses the boundary.

**Readout** converts node states into a graph-level state. A per-graph sum groups rows by the membership vector. Here it gives `[18, 20]`; a per-graph mean gives `[6, 10]`. One global mean, `(4 + 6 + 8 + 10 + 10)/5 = 7.6`, merges two examples and loses their individual outputs. Empty graphs can retain an explicit slot with zero sum; their mean needs a stated empty-set convention rather than division by zero.

With graph-local layers, the batched operators have the form

\[
A_{\rm batch}=\operatorname{diag}(A_A,A_B),\qquad
X_{\rm batch}=\begin{bmatrix}X_A\\X_B\end{bmatrix}.
\]

“Diagonal” means the two matrices occupy separate blocks, not that only self-loops remain. Local messages never cross blocks. This independence can fail if another operation mixes the examples, such as normalization using statistics over all batch rows. It is a property of the entire computation, not just a correctly drawn adjacency.

`batch_independent_graphs` concatenates features once, adds each graph's cumulative offset to its indices, and creates `graph_id` and `ptr`. The pointer array stores graph boundaries; for sizes 3 and 2 it is `[0, 3, 5]`. `graph_sum_readout` uses `index_add_` to reduce the already calculated node states into one row per graph. The construction costs linear work in the stored rows/edges, avoids padding to the largest graph and leaves original inputs unmodified.

The ordinary route is `Batch.from_data_list([Data(x=..., edge_index=...), ...])`. PyG performs the same concatenation and endpoint offsets for these ordinary `Data` objects. Compare the actual `edge_index`, `batch` membership and `ptr`, not just final predictions. Custom index-like attributes need their own batching rules; never assume a new field inherits the intended meaning from its name. The full program's comparisons exercise unequal sizes, empty slots, separate-versus-batch equality and the deliberate off-by-one bug.

### Why must a bond stay paired with its atom's message?

Transform each donor using the relationship on its own edge before combining messages.

<!-- figure: D46; actual receiver/two donor atoms with numeric feature badges, edge-local bond labels and paired maps/products. Swap bond assignment without moving atoms. Sum-vs-mean readout drawn on duplicated disconnected copies. -->

We now switch applications: papers gave us node features and permissions; a molecular graph additionally has bond information on those permissions. This small arithmetic example uses atom values 1 and 3 and two named bond categories. They are invented scalar features and maps to expose the mechanism, not chemical energies or a fitted molecular predictor.

The first edge's map multiplies its donor by +2. The second edge's map multiplies its donor by −1. Their messages are `2 × 1 = 2` and `−1 × 3 = −3`, so the receiver's sum is −1. Swap the category assignments while leaving atom values in place: messages become `−1 × 1 = −1` and `2 × 3 = 6`, summing to 5. The atom-value multiset and bond-category multiset are separately unchanged. What changed was their **association**. Separately summing atom values and bond categories would erase that association before it could be used.

Give every relation category `r` a matrix `W_r`. For donor vector `h_j` and edge category `r_{ji}`, the paired message and sum are

\[
m_{j\to i}=W_{r_{ji}}h_j,\qquad
\bar m_i=\sum_{j\to i}m_{j\to i}.
\]

The edge chooses a map; the donor supplies its input. Matrix dimensions are `output_channels × input_channels`. The sum is invariant to reordering the paired edges, but swapping edge categories across unequal donors can change it. Missing input edges supply no message. A model can also condition a message on both endpoints or generate a matrix from a continuous edge feature instead of using a finite category lookup. That is the wider message/aggregate/update formulation introduced by [Gilmer and colleagues](https://arxiv.org/html/1704.01212v2); it does not make every chosen molecular representation scientifically adequate.

`typed_message_sum` gathers the map for each edge's `relation_ids`, multiplies it by that edge's donor feature with `bmm`, then reduces by receiver. Autograd updates the selected maps and donor features through the paired products. The gathered-map implementation uses `O(E × d_out × d_in)` temporary map storage; grouping edges by relation can reuse a map and reduce that storage for large finite-relation graphs. The complete file states this cost rather than calling every explicit implementation universally optimal.

The ordinary [`NNConv`](https://pytorch-geometric.readthedocs.io/en/latest/generated/torch_geometric.nn.conv.NNConv.html) route uses an edge network to generate each message matrix. Our `ordinary_typed_layer` generates exactly these finite maps from one-hot relation attributes, with add aggregation, no automatic own map and no bias. PyG stores the generated matrix as `input × output`, so we transpose the scratch map's channel convention when assigning the edge-network weights. Assign those weights **after** constructing NNConv: its constructor resets the supplied edge network. A non-square map comparison is important: scalar maps hide a transposition error. The matched forward, gradient, update and node-renaming checks cover that actual library route and empty edge support.

The **readout target** also matters. Summing per-atom contributions can represent an **extensive** quantity, meaning one that adds over independent copies under the model's stated assumption. Duplicating a disconnected molecule then doubles its sum. A per-atom mean stays the same under whole duplication and fits a different kind of target. Physical energy additivity requires that neglected interactions really are negligible; a disconnected drawing does not prove that. Coordinates, distances, rotations, directional quantities and force consistency add further constraints. The next geometric lesson will draw and implement those constraints rather than attach unexplained coordinates to this scalar toy.

### Which program edge represents syntax, and which represents a value dependency?

Separate the written expression's tree from the path along which an earlier definition supplies a later use.

<!-- figure: D47; code followed by actual syntax operator/operand tree and separate definition-use a,b→c→d graph. Show clamped input definitions, two synchronous typed rounds, changed-unused-token null. One a control; labels distinguish syntax and supplies-value arrows. -->

The next application changes what a node means. Consider this four-assignment program:

```python
a = 2
b = 3
c = a + b
d = 2 * c
```

A **syntax tree** describes how an expression is written. The `+` operator has operand uses `a` and `b`; the `*` operator has a literal 2 and a use of `c`. A **definition-use edge** connects the assignment that defines a value to a later expression that uses it. Definitions of `a` and `b` supply `c`; the definition of `c` supplies `d`. These are different relations. Text positions alone do not say which earlier definition a use refers to.

Execute the arithmetic by hand first: `a = 2`, `b = 3`, then `c = 2 + 3 = 5`, then `d = 2 × 5 = 10`. Changing `a` to −2 gives `c = 1` and `d = 2`; changing it to 5 gives `c = 8` and `d = 16`. An unrelated comment or unused literal has no value-dependency path into `d`. Reversing `a→c` would permit `a` to read `c`, which is a different graph computation; a position-independent relation still needs the correct direction.

We can transport these particular additions and scalings with the typed message primitive just taught. Initialize definition-node states `[a, b, 0, 0]`. Give `a→c` and `b→c` map +1 and `c→d` map +2. Clamp the supplied input definitions `a` and `b` at each round. After one synchronous round, the states are `[2, 3, 5, 0]`: `d` still reads the **old** zero at `c`. After two, they are `[2, 3, 5, 10]`. This is the buffer distinction from §2 in another setting.

For this declared calculation,

\[
c^{(\ell+1)}=a+b,\qquad d^{(\ell+1)}=2c^{(\ell)}.
\]

`execute_four_assignments` implements the actual stated arithmetic directly. `transport_four_assignments` implements the two-round typed graph schedule using `typed_message_sum` and clamped input rows. They agree on the changed cases above; the derivative of `d` with respect to either input is 2. The two functions teach different responsibilities: an interpreter applies operations with their semantics, while the transport schedule follows explicitly supplied graph relations and coefficients.

A general program adds scope, aliasing, control flow, loops, calls and potentially undecidable static questions. Finding correct relations may require compiler or static-analysis machinery, and a learned graph representation is not automatically an interpreter or proof engine. In a learning task, say whether the target is variable misuse, a program property, similarity or another prediction; preserve legal targets and evaluate on suitable held-out programs. Distinct relation maps can keep syntax, definition-use and control-flow roles separate. Collapsing all those edges into one mean discards a modeling choice before the learner can inspect it.

### Which road reading is available at the prediction time?

Draw spatial permission and time permission separately, then compose only the permitted readings.

<!-- figure: D48; directed sensor chain A→B→C and separate t0/t1 history columns, t2 target denied as an input. Values/units on sensors, labelled .5 current/.5 lag routes, two controls: upstream lag and reverse direction. -->

Finally we switch to traffic sensors. A, B and C are sensor identities, and `A→B→C` denotes the allowed downstream message direction. Time is a separate axis: each sensor has readings at `t₀` and `t₁`, and we issue a prediction after `t₁` for a target at `t₂`. Arrows on the road say **which sensor** may supply information; a time arrow says **when a reading exists**. Reversing one does not reverse the other.

Use constructed readings in vehicles per minute: A has `[4, 6]`, B has `[8, 10]`, and C has `[12, 14]` at `t₀/t₁`. A deliberately simple local rule for B combines B's current reading 10 with A's lagged reading 4, each with weight 0.5. Its output is `0.5 × 10 + 0.5 × 4 = 7` vehicles per minute. The rule is specified by us, not learned from observed traffic. Changing A's lagged reading to 12 moves the output to 11. Changing a future target does not change the legal output, because that target is not an input.

In the reversed chain `C→B→A`, the upstream source for B is C. Its lagged reading 12 gives `0.5 × 10 + 0.5 × 12 = 11`. The direction control changes the permitted source explicitly; it does not take a symmetric normalized average over both road neighbors. In notation, with upstream source `u`, the declared rule is

\[
\widehat y_{B,t_2}=\tfrac12 x_{B,t_1}+\tfrac12 x_{u,t_0}.
\]

`traffic_rule` receives only a sensor-by-two-time history table. The future target has no argument through which to enter. A real pipeline must also fit preprocessing on the permitted training history, respect delayed availability and evaluate on later time intervals, as §5 explained. Excluding a future-label column while using a degree, normalization statistic or lag that was computed with future information still leaks.

A trainable spatiotemporal model can first encode each sensor's history with the exact recurrent cell from [RNNs, LSTMs & GRUs](/learn/path/full-curriculum/rnns-lstms-grus?module=deep-learning-fundamentals), then propagate those history states along the legal directed graph—or interleave temporal and spatial updates under an explicit schedule. Reuse its explained recurrence rather than introduce a second unexplained implementation. What changes here is the sensor graph, history alignment, message permission and forecasting target. Such a composition needs its own fitted experiment; this two-time arithmetic example does not supply one.

Across papers, molecules, programs and sensors, the common operation remains a receiver reading permitted messages, aggregating them and updating a representation. The application determines what the nodes and edges mean, which information is available, what must stay paired, and what the output should preserve. Practice now asks you to change those decisions and explain their consequences, rather than merely reproduce a favorable graph plot.

## 10. Practice with changed examples

Use the first five tasks to check the core route. The later tasks exercise variants and deeper limits. Each prompt is visible; hints and worked feedback are separate so you can attempt the task independently. The labs remain live throughout and require no submitted guess.

### 1. Compute a new GCN read — core

Keep the self-loop three-node path, degrees `[2, 3, 2]`, scalar projection 1 and bias zero, but change the features to `[2, 0, 3]`. Calculate all three outputs. Can node 2's input affect node 0 after this one round? Explain the smallest change of depth that permits that influence.

<details><summary>Hint</summary>
The endpoint's own coefficient is 1/2, the middle's own coefficient is 1/3, and each path-edge coefficient is 1/√6. Follow permissions before multiplying.
</details>

<details><summary>Solution and reasoning</summary>
Node 0 receives `2/2 + 0/√6 = 1`. Node 1 receives `2/√6 + 0/3 + 3/√6 = 5/√6 ≈ 2.041241`. Node 2 receives `0/√6 + 3/2 = 1.5`. A change at node 2 has no permitted one-round route into node 0. Two rounds allow the path `2→1→0`, with coefficient `(1/√6)² = 1/6` for this fixed scalar linear operator. That second-round influence does not mean the first-round diagram had a hidden direct edge. With a nonlinear update, trace its local derivatives too rather than automatically reusing the linear coefficient.
</details>

### 2. Find an order-dependent bug — core

Two connected nodes start at `[1, 3]`. Each new state should average its old own value and its old neighbor's value. Calculate one synchronized round and an in-place loop that updates node 0 first. Reverse the faulty loop and repair the algorithm.

<details><summary>Hint</summary>
Write a separate old-state row next to every read. Ask whether either row has already changed.
</details>

<details><summary>Solution and reasoning</summary>
The synchronized result is `[2, 2]`. Updating node 0 in place first makes it 2, then node 1 reads that new 2 and becomes `(3 + 2)/2 = 2.5`. The faulty result is `[2, 2.5]`. Reversing the loop first makes node 1 equal 2, then node 0 becomes `(1 + 2)/2 = 1.5`, giving `[1.5, 2]`. Use an unchanged source tensor and a separate next-state tensor or a single gather/reduction expression. Merely choosing a repeatable node order hides the defect without restoring the intended operation.
</details>

### 3. Separate own and neighbor information — core

A mean GraphSAGE receiver has own value 2, neighbors `[0, 4, 8]`, own coefficient 3 and neighbor coefficient −1, with no bias or activation. Find its output. Duplicate every neighbor once; then duplicate only the donor with value 8. Compare with sum aggregation for whole duplication.

<details><summary>Hint</summary>
Keep the own branch at `3 × 2`. Count all occurrences in the neighbor mean.
</details>

<details><summary>Solution and reasoning</summary>
The original neighbor mean is 4, so the output is `6 − 4 = 2`. Whole duplication preserves the mean and output. Duplicating only 8 gives `[0, 4, 8, 8]`, mean 5 and output 1. Sum aggregation gives `6 − 12 = −6` originally and `6 − 24 = −18` after whole duplication. Decide whether counts, proportions or the strongest message matter for the target before choosing a reducer. “Mean ignores duplicates” is too broad: it ignores a uniform whole-multiset repetition, not every multiplicity change.
</details>

### 4. Describe a valid information boundary — core

You predict tomorrow's citations. A colleague builds message edges and degree features from the graph after tomorrow, then masks tomorrow's labels out of the loss. Identify both leakage routes and describe a valid graph, feature, cache and evaluation policy.

<details><summary>Hint</summary>
An edge can enter through a message permission or a graph-derived number even when its label never enters the loss.
</details>

<details><summary>Solution and reasoning</summary>
Tomorrow's relationships leak through the message graph and through degree features. Construct both from information actually available at the issue time. Fit any preprocessing using the permitted training information, and key graph normalizers/samples by that same cutoff and graph identity. Hold target edges out of message and graph-feature construction; define eligible negative candidates and availability consistently. Evaluate on later time intervals under the same availability rule. A loss mask controls which labels are scored; it does not control how inputs were made. If publication or sensor readings arrive late, their actual availability may lag their nominal timestamps.
</details>

### 5. Interpret the real study — core

The displayed GCN fits 10/10 fit labels but scores 8/18 on assessment; label propagation scores 16/18. Does this prove that graphs are useless, GCN is always worse, or the code must be broken? State one supported conclusion and a disciplined next experiment. Would deleting message edges while keeping degree/clustering features remove all graph information?

<details><summary>Hint</summary>
Separate this model, features, graph and small split from a claim about a whole method family.
</details>

<details><summary>Solution and reasoning</summary>
This fitted GCN under this fixed structural-feature protocol generalizes poorly to the shown held-out labels. Label propagation is a graph-based alternative that performed better here, so “graphs are useless” does not follow. Fitting every training label is not evidence of generalization; poor assessment accuracy alone is not proof of a numerical bug. Inspect errors, verify the exact operator on an independent small case, and formulate a changed hypothesis about useful features or information flow. Evaluate it on suitable new independent data or a predeclared repeated-split protocol, rather than repeatedly selecting against these already inspected assessment labels. Keeping degree/clustering features after deleting message edges retains graph-derived information. That intervention isolates a changed propagation path under fixed features, not the removal of every structural signal.
</details>

### 6. Fix a misleading sum claim — deeper

The donor lists `[0, 4]` and `[1, 3]` both sum to 4. Can any deterministic MLP that sees only that sum distinguish them? Apply the per-donor map `φ(x) = [x, x²]` and find the new summed rows. Then check `[1, 1, 4]` against `[0, 3, 3]` before claiming universal injectivity.

<details><summary>Hint</summary>
Make the distinction before reduction. A richer representation can fix one collision and still have another.
</details>

<details><summary>Solution and reasoning</summary>
An MLP of the same raw input 4 returns the same result. The lifted pair sums are `[4, 16]` and `[4, 10]`, so this two-coordinate map distinguishes the first two lists. For the second pair, both lifted sums are `[6, 18]`: `1² + 1² + 4² = 18` and `0² + 3² + 3² = 18`. Thus this particular lift is not injective over all allowed multisets. The GIN correspondence needs its stated suitable encoding, bounded/countable-domain and readout assumptions; it is not a theorem that every learned real-valued raw sum retains every distinction.
</details>

### 7. Which coordinates become constant? — deeper

The connected self-loop path has degrees `[2, 3, 2]`. A report says repeated fixed symmetric propagation makes its raw values equal. Correct the claim. Give a two-node counterexample without loops, and explain why neither result automatically predicts a trained nonlinear network.

<details><summary>Hint</summary>
The eigenvector fixed by `S` is `√d`. Contrast it with a matrix that swaps two entries.
</details>

<details><summary>Solution and reasoning</summary>
Under the connected fixed operator and convergence conditions in §7, the limiting row is proportional to `[√2, √3, √2]`, with scale set by the input's projection onto that mode. Divide by `√d` to obtain a constant in the converted random-walk coordinate. Raw endpoints and middle need not agree. A two-node loop-free edge has operator `[[0,1],[1,0]]`; it alternates `[1,0]` and `[0,1]` instead of converging. Its −1 mode preserves magnitude while changing sign. Learned channel maps, activations and graph-dependent gates change the evolution; an argument about fixed `S^ℓ` cannot silently replace analysis of those operations.
</details>

### 8. Count sampling and test batch independence — deeper

A seed requests four first-hop neighbor occurrences and each requests three more. Give the uncapped occurrence count including the seed. On the four-ID cyclic graph, what changes without replacement? Describe a two-graph mutation check that detects accidental cross-graph edges.

<details><summary>Hint</summary>
Count levels separately, then distinguish requested occurrences from unique IDs and available donors.
</details>

<details><summary>Solution and reasoning</summary>
The bound is `1 + 4 + 4 × 3 = 17`. There may be far fewer distinct nodes. Without replacement on this particular four-ID no-self graph, each parent has only three candidates, giving `1 + 3 + 3 × 3 = 13`. This neighbor-tree count is not automatically the full block implementation's storage, because own-state dependencies also have to be retained. For batching, compare each graph's standalone output with its batch slice, then change only graph B's features and check that graph A remains fixed under a local graph-independent model. Verify both endpoint offsets, membership/readout and any normalization that could couple the examples. A membership label alone cannot stop a wrongly stored edge from carrying a message.
</details>

### 9. Find where pooling must occur — deeper

Donors are `[-3, 2]`. Transform each donor to `[ReLU(x), ReLU(−x)]`, then take coordinatewise max. Compare with taking raw max first and transforming only that result. Give a changed example where those two routes happen to agree, and explain why it does not justify swapping them generally.

<details><summary>Hint</summary>
Draw one row per donor and two transformed columns before selecting maxima.
</details>

<details><summary>Solution and reasoning</summary>
The transformed rows are `[0,3]` and `[2,0]`, so the correct pooled row is `[2,3]`. Raw max first gives 2, which transforms to `[2,0]`; it has lost the negative donor's contribution to the second channel. With donors `[1,4]`, the rows are `[1,0]` and `[4,0]`, and both routes give `[4,0]`. Agreement in that restricted positive case does not establish equality for mixed signs. In the original mixed-sign calculation, the first channel's non-tied selected derivative reaches donor 2 and the second reaches donor −3. This is why both forward values and the routing of gradients need checking when changing aggregation order.
</details>

### 10. Recompute a coupled GATv2 receiver — deeper

Use §4's scalar receiver `r`, senders `k = −1, +1`, receiver projection `[r,−r]`, sender projection `[−k,k]`, LeakyReLU slope 0.2 and score vector `[−1.25,−1.25]`, with no loops or output bias. First calculate receiver 0. Then change it to +0.5 and compute scores, shares and the two-channel weighted output. Why is changing just the displayed softmax share insufficient as a model edit?

<details><summary>Hint</summary>
The stated projections give score `−|r−k|`. Keep each sender's projected value paired with its share.
</details>

<details><summary>Solution and reasoning</summary>
At receiver 0 both scores are −1, both shares are 0.5, and projected sender values `[1,−1]` and `[−1,1]` average to `[0,0]`. At receiver +0.5, scores are `[−1.5,−0.5]`; their softmax is approximately `[0.268941421,0.731058579]`. The output is `[−0.462117157,0.462117157]`. Every number follows from the changed receiver through projection, coordinate nonlinearity and final score. A free share edit can illustrate the weighted-sum stage, but it need not be attainable under the declared features and parameters. For receiver −0.5 the ranks and mixture reverse, giving `[+0.462117157,−0.462117157]`; this changed case contrasts with original GAT's fixed per-head ordering over a common candidate set.
</details>

### 11. Diagnose compensation and whitening limits — deeper

Two orthonormal node modes are carried in separate feature channels. One propagation has gains 1 and 0.5. Find the right channel map that restores both after one round. What fails when the second gain is zero? For a mixed representation with singular values 1 and 0.5, compute the squared output singular values after ridge whitening with `ρ = 0.001`.

<details><summary>Hint</summary>
Invert only a retained nonzero mode. Ridge whitening divides a singular value by `√(σ²+ρ)`.
</details>

<details><summary>Solution and reasoning</summary>
The propagating channel amplitudes become `[1,0.5]`, so right multiplication by `diag(1,2)` restores them in this separated two-mode representation. At zero gain, that mode is absent; right multiplication cannot increase matrix rank or infer its lost coefficient. For ridge whitening the squared amplitudes are `1/1.001 ≈ 0.999000999` and `0.25/0.251 ≈ 0.996015936`, not exactly 1. A regularized Gram is invertible without making erased information reappear. Exact unregularized whitening reaches identity only on its retained full-rank supported subspace under the stated numerical threshold. Scaling, low variation and lost rank are different diagnoses, as the depth/energy table in §7 showed.
</details>

### 12. Trace a finite useful route — deeper

In §7's two-round example, useful signal 2 takes two gates of `1−ε`, and distraction 7 takes one gate `ε` followed by `1−ε`. Compute the receiver's value at `ε = 0.01`. Compare with perfect exclusion and explain why this is not a reproduced trained Adaptive Message Passing result.

<details><summary>Hint</summary>
Multiply gate factors along each path before adding its contribution.
</details>

<details><summary>Solution and reasoning</summary>
The output is `2(1−ε)² + 7ε(1−ε)`. At 0.01 it is `2 × 0.9801 + 7 × 0.0099 = 1.9602 + 0.0693 = 2.0295`. At zero it is exactly 2: the nuisance route is cut while the useful route remains. A gate that rejects the useful intermediate also loses signal; gate magnitude alone does not reveal whether filtering helps. This is a constructed finite-path calculation with supplied coefficients. The paper learns message filtering and depth under its variational objective; our arithmetic does not execute that training or establish its benchmark results.
</details>

### 13. Build and audit a new edge-conditioned operation — practical transfer

Use scalar features `[2,−1,4]`, directed edges `0→1, 2→1, 1→2`, relation IDs `[0,1,0]`, maps `W₀ = +2` and `W₁ = −1`, and no own map or bias. Implement paired messages and receiver sums. Hand-check the outputs and a loss equal to their sum. Compare scratch and ordinary NNConv gradients, rename nodes, and define a legal information boundary for a real task using such relations.

<details><summary>Hint</summary>
Do not sum relation categories independently of their donors. At an isolated receiver the declared aggregate is zero. Rename the feature rows and both edge endpoints together.
</details>

<details><summary>Solution and evaluation criteria</summary>
Messages are `+2 × 2 = 4` into node 1, `−1 × 4 = −4` into node 1, and `+2 × (−1) = −2` into node 2. The output is `[0,0,−2]`. For loss equal to the sum of output rows, input gradients are `[2,2,−1]`: each sender's derivative uses its paired edge map. The derivative with respect to `W₀` is `2 + (−1) = 1`, and with respect to `W₁` it is 4. `typed_message_sum` and `ordinary_typed_layer` supply two explained implementation routes. Assign mapped weights after constructing NNConv because its constructor resets the supplied edge network; with a multi-channel map also check the input/output transpose convention.

A successful node-renaming test permutes the outputs in exactly the same way and preserves graph-sum readout, after features, endpoints and any node targets are renamed consistently. It does not insert IDs as numeric model inputs. Include an empty-edge case and a changed relation assignment; compare all relevant gradients and one mapped update rather than only a single output.

For a real task, describe each relation's meaning and availability, the prediction unit and target, feature/preprocessing construction, eligible message graph and held-out evaluation protocol. A future program change or bond measurement cannot enter earlier inputs merely because its target label is masked. Many valid protocols are possible; assess their consistency with the intended deployment question. Success here is an exact inspectable operation and an explained legal boundary, not a promise to beat the already inspected Karate assessment.
</details>

## 11. References and another way to learn

### Another way to learn

- [Sanchez-Lengeling, Reif, Pearce and Wiltschko — A Gentle Introduction to Graph Neural Networks](https://distill.pub/2021/gnn-intro/), interactive article. After §§1–2, use its graph/array views and gather-update illustrations to connect a relationship diagram to a neural computation. Its visual explanation is a useful alternate route; use our explicit GAT/GATv2 equations for those layers' particular attention rules.
- [William L. Hamilton — Graph Representation Learning](https://www.cs.mcgill.ca/~wlh/grl_book/files/GRL_Book.pdf), free author-posted textbook draft. Chapters 5–6 broaden messages, aggregation, updates, graph readout and sampling after the core example. Chapter 7 is a theory route after §8; annotate its assumptions rather than replace them with “sum sees everything.” Basic linear algebra and probability help with the deeper chapters.
- [Stanford CS224W — Message Passing and Node Classification](https://www.youtube.com/watch?v=6g9vtxUmfwM), recorded lecture, paired with [Jure Leskovec's course resource page](https://ai.stanford.edu/~jure/teaching.html). Use it as a spoken alternate route into neighborhood computation after §§1–4. The [current public course page](https://web.stanford.edu/class/cs224w/) also lists readings and public materials; enrolled students' current lecture videos require Canvas access. Earlier lecture APIs may differ from the explicit versions used here.
- [PyG — Neighbor Sampling tutorial](https://pytorch-geometric.readthedocs.io/en/latest/tutorial/neighbor_loader.html), hands-on documentation. After §9, follow local/global IDs and seed-only training. Check optional sampling-backend installation for your environment before expecting a runnable NeighborLoader. The supplied offline block program exposes the same bookkeeping questions without pretending to execute that backend.

### Technical references

**Layer definitions and expressiveness.** [Kipf & Welling, GCN](https://arxiv.org/html/1609.02907v4), §§2.1–2.2 and 3.1, supports the normalization and approximation choices. [Hamilton et al., GraphSAGE](https://arxiv.org/html/1706.02216v4), §3/Algorithm 1, distinguishes mean, transformed pooling, ordered aggregation, sampling and original normalization/objectives. [Veličković et al., GAT](https://arxiv.org/html/1710.10903v3), §2, supports projection, endpoint scoring and multihead merging; [Brody et al., GATv2](https://arxiv.org/html/2105.14491v3), §§2–3, explains static versus dynamic ranking. [Gilmer et al., Neural Message Passing for Quantum Chemistry](https://arxiv.org/html/1704.01212v2), §2, supplies the message/aggregate/update/readout framework and motivates edge attributes. [Xu et al., How Powerful Are Graph Neural Networks?](https://arxiv.org/html/1810.00826v3), §§2–4.2, supplies the multiset/WL conditions behind §8.

**Filters, depth and bottlenecks.** [Defferrard et al., localized spectral filters](https://arxiv.org/html/1606.09375v3), §2.1, supports the polynomial/Chebyshev recurrence and its locality conditions. [Xu et al., Jumping Knowledge Networks](https://arxiv.org/abs/1806.03536) motivates retaining information from several depths; our concatenation and fixed weighted-readout examples are explicit local calculations, not a reproduction of its learned selection. [Alon & Yahav, bottleneck and over-squashing](https://arxiv.org/html/2006.05205v4) and [Topping et al., sensitivity and curvature](https://arxiv.org/html/2111.14522v3) address distant dependencies; their bounds have assumptions about graph distance and derivatives. They do not imply that every shallow graph has an exponential bottleneck or that rewiring always improves a task.

**Current qualifications and research directions.** [Zhuo et al., WeightRep](https://proceedings.mlr.press/v260/zhuo25a.html) motivates examining learned channel weights alongside graph mixing. Our inverse-mode demonstration requires retained nonzero modes; it does not show every trained network learns an inverse. [Adaptive Message Passing](https://arxiv.org/html/2312.16560v3) couples message filtering and depth under a variational framework; the local finite-gate arithmetic is only one mechanism within that larger method. [Platonov et al., heterophily benchmarks](https://arxiv.org/html/2302.11640v2), §3, helps distinguish a neighborhood assumption from protocol defects and benchmark-specific claims. Read these after the worked spectral/rank and split examples, not as replacements for their derivations.

**Ordinary implementations.** The precise APIs are [GCNConv](https://pytorch-geometric.readthedocs.io/en/latest/generated/torch_geometric.nn.conv.GCNConv.html), [SAGEConv](https://pytorch-geometric.readthedocs.io/en/latest/generated/torch_geometric.nn.conv.SAGEConv.html), [GATConv](https://pytorch-geometric.readthedocs.io/en/latest/generated/torch_geometric.nn.conv.GATConv.html), [GATv2Conv](https://pytorch-geometric.readthedocs.io/en/latest/generated/torch_geometric.nn.conv.GATv2Conv.html), [GINConv](https://pytorch-geometric.readthedocs.io/en/latest/generated/torch_geometric.nn.conv.GINConv.html), [NNConv](https://pytorch-geometric.readthedocs.io/en/latest/generated/torch_geometric.nn.conv.NNConv.html), [neighbor loading](https://pytorch-geometric.readthedocs.io/en/latest/modules/loader.html#torch_geometric.loader.NeighborLoader) and [independent graph batching](https://pytorch-geometric.readthedocs.io/en/latest/advanced/batching.html). The current documentation identifies PyG 2.9.0; new executed comparisons used PyG 2.8.0.post1 with Torch 2.14.0+cpu. Defaults, returned attention weights, padding and optional backends are checked and described for their actual route rather than assumed interchangeable across versions.

**Observed data.** [NetworkX's Karate Club documentation](https://networkx.org/documentation/stable/reference/generated/networkx.generators.social.karate_club_graph.html) describes the graph representation and original study attribution. The offline `data-provenance.md` and license file describe our exact input representation, zero-based IDs, retained context weights and binary fitted adjacency. The measured study keeps its original executions and saved outputs; new constructed calculations are not additional measured Karate experiments.

### Code and data files

Use each file at the section where its operation is explained. Code appears inline with shared Copy/Download controls; this index helps you collect the complete runnable files and their actual dependencies. The four companion programs form a connected set, with each primitive explained at its teaching home.

| File | What it supplies and what it needs |
| --- | --- |
| `message-passing-operators.py` | Explicit sparse GCN, mean-SAGE, GAT/GATv2 and mapped ordinary layers; requires Torch, and PyG for the comparisons. Its small main computes a declared path/update without fitting. |
| `graph-aggregation-variants.py` | Pre-transform pooling, stable row normalization, ordered/gated reuse, GIN and context loss, including actual ordinary GIN mapping and fixed/trainable-epsilon forward/derivative/update examples. Torch is required; PyG is required for its main's GIN comparisons. Keep the exact `recurrent-cells.py` from the earlier RNN lesson alongside it, or run from the repository where its fallback locates that file. |
| `graph-propagation-limits.py` | Sparse fixed mixing, polynomial/Chebyshev filters, initial residuals, diagnostic modes, size/variation/rank, SVD-based subspace whitening and finite gated routes. Requires Torch; dense eigenanalysis is limited to the small diagnostic examples. |
| `graph-sampling-batching.py` | Cyclic occurrences, a distinct seeded block sampler, explicit bipartite scheduling, graph offsets/readout, paired relation maps and constructed applications. Keep `message-passing-operators.py` alongside it. PyG supplies ordinary block/batch/NNConv comparisons; NeighborLoader also needs its optional backend. |
| [message-passing-study.py](/learn-code/message-passing-graph-convolutions-gcn-gat-graphsage/message-passing-study.py) | Complete original dense real-data experiment with the retained split, fitting protocol and outputs; uses adjacent `karate-club.json`. Running it fits models; the live page instead reads saved evidence. |
| [graph_library_bridge.py](/learn-code/message-passing-graph-convolutions-gcn-gat-graphsage/graph_library_bridge.py) | Self-contained sparse/library comparison with its own four-node fixtures; it does not read an adjacent graph file. Use `--scratch-only` for the dense-oracle route without PyG. |
| [karate-club.json](/learn-code/message-passing-graph-convolutions-gcn-gat-graphsage/karate-club.json) | Offline node labels, relationship pairs and context weights for the observed graph. |
| [calculated-inputs.json](/learn-code/message-passing-graph-convolutions-gcn-gat-graphsage/calculated-inputs.json) | Retained experiment outcomes and calculated inputs, with their separate roles explained in §6. |
| [data-provenance.md](/learn-code/message-passing-graph-convolutions-gcn-gat-graphsage/data-provenance.md) and [NETWORKX-LICENSE.txt](/learn-code/message-passing-graph-convolutions-gcn-gat-graphsage/NETWORKX-LICENSE.txt) | Input history, transformation, attribution and license. |
| [recorded-probabilities.json](/learn-assets/message-passing-graph-convolutions-gcn-gat-graphsage/recorded-probabilities.json) | All retained model/seed probabilities; an edited saved-model inference is not a newly assessed fit. |
| [mlp-11.json](/learn-assets/message-passing-graph-convolutions-gcn-gat-graphsage/mlp-11.json), [gcn-11.json](/learn-assets/message-passing-graph-convolutions-gcn-gat-graphsage/gcn-11.json), [sage-11.json](/learn-assets/message-passing-graph-convolutions-gcn-gat-graphsage/sage-11.json), [gat-11.json](/learn-assets/message-passing-graph-convolutions-gcn-gat-graphsage/gat-11.json) | Exact seed-11 fitted states consumed by the model inspector. Fetch the chosen family as needed instead of fitting in the browser. |
| [recurrent-cells.py](/learn-assets/rnns-lstms-grus/recurrent-cells.py) | Exact earlier recurrent implementation reused for the ordered neighborhood and graph-wired GRU routes. Its detailed gate teaching belongs to that earlier lesson. |

For the four companion programs, use one Python environment with Torch and, for the ordinary comparisons, PyG. The comparisons here were executed with Python 3.12, Torch `2.14.0+cpu` and PyG `2.8.0.post1`; the cited current documentation may describe a newer version. Install a compatible Torch build for your device from its official instructions, then install the tested graph package with `python -m pip install torch-geometric==2.8.0.post1`. A native NeighborLoader additionally requires the optional backend identified in §9; the supplied pure tensor/block routes do not pretend to install it.

Save the four companion files together with `recurrent-cells.py`, open a terminal in that directory, and run the exact file whose mechanism you are following:

```sh
python message-passing-operators.py
python graph-aggregation-variants.py
python graph-propagation-limits.py
python graph-sampling-batching.py
```

The hyphenated standalone filenames are launched as files. Where one supplies another's primitive, the supplied loader resolves the exact adjacent file by path; these are not identifiers for an ordinary `import` statement. The original real-data fitting program is a separate route with its own adjacent data requirements, described above.

### Ready for the next question?

Explain one permitted message from its original feature row through a weighted contribution, reduction, update and loss. Implement that same operation with explicit tensor primitives and an ordinary library, keeping dimensions, parameter maps and gradients consistent. Diagnose a changed graph, a multiset collision, a sampling objective or a time boundary without relying on a model name. For deeper readiness, separate coordinate limits, variation, scale and rank, and say which information a proposed remedy can actually recover.

Continue to [Graph Transformers & Geometric Deep Learning](/learn/path/full-curriculum/graph-transformers-geometric-deep-learning?module=deep-learning-fundamentals). Local messages have now made both their useful inductive structure and their missing information visible. The next questions are how nodes read distant nodes, how structural positions become inputs, and how coordinate-dependent representations obey physical transformations. Those additions must preserve the identity, information-boundary and explained implementation contracts learned here.
