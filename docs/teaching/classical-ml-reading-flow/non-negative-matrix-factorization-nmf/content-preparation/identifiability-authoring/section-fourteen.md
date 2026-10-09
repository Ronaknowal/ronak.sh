## 14. Decide what a factorization can identify

The reserved comparison tells us how accurately a representation reconstructs new rows. Does a good reconstruction also tell us which patterns produced the observations? Return to a small exact example so we can separate this question from solver error.

### See two different dictionaries explain the same row

Can two genuinely different nonnegative explanations give exactly the same measurements? Watch the directions change while their sum stays fixed.

<!-- figure:D50 -->

The observed row is `[2,3,3]`. The first dictionary has C0=`[1,1,1]`, C1=`[0,1,1]`, with amounts `[2,1]`. This is the **separate shear example from Amount is not probability or identity**, section 2; it is not the earlier H0=`[[1,0,1],[0,1,1]]`. We changed the example because H0 contains a zero that would forbid the particular shear below.

Keep C1 fixed. As t rises from 0 to 1, replace C0 by `[1,1−t,1−t]` and increase C1's amount to `1+2t`. Two units of C0 lose `2t` from the second and third bins, while the added `2t` units of C1 return precisely that intensity. Every component and amount remains nonnegative. At t=0.5 the alternative factors are amounts `[2,2]`, patterns `[[1,0.5,0.5],[0,1,1]]`; both still produce `[2,3,3]`. At t=1 the first pattern has become `[1,0,0]`, and the amounts are `[2,3]`.

The first ray changes its direction, so this is more than rescaling or reordering component labels. In matrix form, write

\[
 T=\begin{bmatrix}1&t\\0&1\end{bmatrix},\qquad
 T^{-1}=\begin{bmatrix}1&-t\\0&1\end{bmatrix}.
\]

Then `(wT)(T⁻¹H) = wH`, with `wT=[2,1+2t]` and `T⁻¹H=[[1,1−t,1−t],[0,1,1]]`. T⁻¹ contains a negative entry, but its product with **this particular H** is nonnegative throughout the declared range. A transformation need not be nonnegative entrywise for its transformed factors to be feasible. Conversely, an arbitrary invertible transformation is not automatically allowed: it can create negative amounts or pattern cells. Substituting H0 would give a negative second cell in the first transformed pattern for any positive t, explaining the earlier warning concretely.

**Identifiability** asks whether the observations and stated assumptions determine the desired factors, allowing the unavoidable naming and unit conventions. This witness shows that nonnegativity and exact reconstruction alone do not always identify them. It does not prove all datasets are ambiguous. Additional structure can make recovery possible; the next section studies the particularly tangible assumption that some observed rows are pure patterns.

### Understand what one nonnegative rank-one term can cover

How many additive components can an exact matrix require? Start with the cells that one component is allowed to make positive.

<!-- figure:D51 -->

In the outer-product picture, a nonnegative column u selects some observation rows and a nonnegative row v selects some feature columns. Their term is `uv`: cell `(i,j)` receives `u_i v_j`. Wherever both selected entries are positive, that cell is positive. Its positive cells therefore form a row-set × column-set **rectangle**. Rectangle means this Cartesian product, not necessarily adjacent cells in the displayed matrix.

For example, u=`[1,0,2,0]ᵀ` and v=`[0,3,0,4]` make positive cells at rows0/2 and columns1/3, with values3/4 in row0 and6/8 in row2. The holes between these positions do not change the rectangle argument. This is the same component outer product introduced in **Build one observation from positive amounts**, now used to reason about support—the locations of nonzero entries.

Consider the exact binary matrix

\[
 X_\square=\begin{bmatrix}
 1&1&0&0\\
 0&1&1&0\\
 0&0&1&1\\
 1&0&0&1
 \end{bmatrix}.
\]

The four outlined diagonal cells are positive. Could a single nonnegative rank-one term contribute positively to two of them, `(i,i)` and `(j,j)`? That would require `u_i,v_i,u_j,v_j` all positive. Its cross cells `(i,j)` and `(j,i)` would then also be positive. But for every pair of distinct outlined diagonal cells in this matrix, at least one cross cell is an observed zero. For example, to cover `(0,0)` and `(1,1)`, the rectangle would make `(1,0)` positive even though X there is zero.

There is no negative component to cancel that forbidden positive entry. In an exact sum of nonnegative terms, every term must be zero at every zero of X. Thus no one term can cover two of the four chosen diagonal positives. Each chosen positive must be covered by at least one term, so at least four terms are needed. The diagonal selector only highlights one witness and its forbidden cross cells; it never changes X or performs a numerical factorization.

This is a **support lower bound**. A chosen set of positive entries with these pairwise forbidden cross cells is often called a fooling set in rectangle-cover arguments. We have proved the four-component lower bound directly; learning that name is not required to follow the proof. Different matrices require different lower-bound arguments, and a rectangle cover alone need not solve the numerical factorization problem because positive values also have to agree.

### Separate ordinary rank from nonnegative rank

Why not read the number of required components from ordinary matrix rank? The same four-by-four example makes the difference exact.

<!-- figure:D52 -->

The ordinary rank is 3. Its top-left 3×3 submatrix is upper triangular with all diagonal entries 1, so its determinant is 1 and the rank is at least 3. The four full rows satisfy `row0 − row1 + row2 − row3 = 0`, so the rank is at most 3. Together these facts give rank exactly 3, without a numerical tolerance or a fitted model.

The **nonnegative rank**, written rank₊(X), is the smallest k for which an exact product X=WH exists with both factors nonnegative and inner dimension k. The support proof requires at least 4 here. The product `I₄ X_square` is a valid nonnegative factorization with four components, so the lower and upper bounds meet: rank₊(X_square)=4.

In general,

\[
 \operatorname{rank}(X)\leq\operatorname{rank}_+(X)
 \leq\min(n,d),\qquad X\geq0.
\]

The first inequality follows because any n×k times k×d product has ordinary rank at most k, regardless of signs. For the second, `I_n X` uses n nonnegative terms and `X I_d` uses d; choose the smaller. These bounds concern exact algebraic representation. A requested rank in an approximate fitting routine is a model choice, not a computed certificate of nonnegative rank.

The positive-epsilon inset changes a premise: adding a small positive quantity to every cell removes all exact zeros. A component is no longer forbidden from covering a cross cell just because that cell used to be zero. The four-rectangle proof therefore no longer establishes the new matrix's nonnegative rank. This does not, by itself, prove that its nonnegative rank has dropped; the argument simply stopped applying. Similarly, allowing a nonzero approximation error weakens an exact support obstruction. A tiny cross-cell value or a small Frobenius error is not an exact zero.

The practical consequence is to keep three questions separate. **Representation:** how many nonnegative terms suffice to the required accuracy? **Optimization:** did this algorithm find a good solution for the chosen k? **Identification:** do the observations and external assumptions determine the scientifically intended patterns? A small error, a stationarity diagnostic and a rank claim answer different parts of that list.

A quick changed case checks the logic. If two observed features are exact copies, ordinary rank can decrease; that fact alone still does not specify which physical sources exist. If a known pure-pattern observation is added, it may constrain the feasible cone substantially. That is why the next section changes the information available, rather than merely asking the same optimizer to run longer.
