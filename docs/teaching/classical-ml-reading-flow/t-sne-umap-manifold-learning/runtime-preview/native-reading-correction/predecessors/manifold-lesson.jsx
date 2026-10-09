import React from 'react';
import { H2, H3 } from '../../../../../src/learn/components/content/Headings.jsx';
import { Prose } from '../../../../../src/learn/components/content/Prose.jsx';
import { CodeBlock } from '../../../../../src/learn/components/content/Code.jsx';
import RemoteCodeBlock from '../../../../../src/learn/components/content/RemoteCodeBlock.jsx';
import { Math as InlineMath, MathBlock } from '../../../../../src/learn/components/content/Math.jsx';
import { Table as NeuralTable } from './ManifoldDrawing.jsx';
import { ManifoldFigure } from './ManifoldFigures.jsx';
import { ManifoldInvestigation } from './ManifoldInvestigations.jsx';
import PrivateFiles from './PrivateFiles.jsx';
import './manifold-reader.css';
function ManifoldLesson() { return <div className="lesson-flow manifold-reader">
<PrivateFiles />
<Prose>{"You have 300 small pictures of handwritten digits. A person can compare two pictures; a computer can compare their 64 recorded cells. We want a two-coordinate map that helps us inspect this collection. A useful map keeps some relationships visible. Understanding which relationships it tries to keep is the difference between using it to explore and reading a story into an attractive scatterplot."}</Prose>

<Prose>{"The names describe two constructions: t-SNE is t-distributed stochastic neighbor embedding, and UMAP is uniform manifold approximation and projection. We will build their neighborhood objects before using the names to interpret a map."}</Prose>

<Prose opening="summary">{"By the end, you can trace a neighbor graph, calculate t-SNE affinities and one force step, build UMAP's local memberships, explain its sampled updates, audit actual saved digit maps, and choose a route for future observations. The deeper sections implement distance, reconstruction, graph and tangent alternatives, then connect their objectives to research on sampling."}</Prose>

<Prose opening="prerequisites">{"Read "}<a href={"/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#4-fit-once-project-and-reconstruct-in-python"}>{"principal component analysis (PCA): rotate the ruler, then keep its readings"}</a>{" first for centering, coordinates and fitting a reusable projection. We refresh each new probability and graph operation here. "}<a href={"/learn/path/full-curriculum/clustering-evaluation-validation-silhouette-ari-nmi?module=classical-ml#4-a-score-evaluates-a-geometry-as-well-as-a-partition"}>{"Clustering evaluation"}</a>{" helps when the later question becomes whether a proposed grouping is stable or useful; a map by itself supplies no group assignments."}</Prose>

<Prose opening="route">{"On a first pass, follow the pictures and worked operations in §§1–8, attempt a few tasks in §11, and finish with §13. The complete code is beside the mechanism it implements; you can inspect its inputs and output before reading every loop. Return to the visible deeper sections 9–10 for distance reconstruction, local recipes, spectral methods, tangent patches and the force derivation. These sections answer different preservation questions rather than introducing a single winning method. "}<a href={"#setup-and-complete-files"}>{"Setup and complete files"}</a>{" distinguish the deterministic examples from optional library fits; all measurements and saved maps are supplied for offline inspection."}</Prose>

<H2>{"1. Follow one picture from recorded cells to a map"}</H2>

<ManifoldFigure id="D01" />

<Prose>{"The picture at source row 30 is a zero. Its eight rows and eight columns contain block counts from 0 to 16. These are downsampled optical measurements, not 64 categorical symbols. Count across the top row: cell 0 is 0, cell 2 is 10 and cell 3 is 14. Flattening puts cell 2 in feature column 2; it does not move the original source identity. Dividing every count by 16 gives feature values0, .625 and .875 respectively. The record now has 64 comparable numbers, while its ID stays30."}</Prose>

<Prose>{"Stacking 300 records makes "}<InlineMath>{"X\\in\\mathbb R^{300\\times64}"}</InlineMath>{". A two-dimensional embedding makes "}<InlineMath>{"Y\\in\\mathbb R^{300\\times2}"}</InlineMath>{". Row "}<InlineMath>{"i"}</InlineMath>{" means the same observation in both arrays. Feature index "}<InlineMath>{"a"}</InlineMath>{" and map coordinate index "}<InlineMath>{"b"}</InlineMath>{" mean different things: the two map axes are not two selected image cells. We use "}<InlineMath>{"n"}</InlineMath>{" for observations, "}<InlineMath>{"D"}</InlineMath>{" for input features and "}<InlineMath>{"q"}</InlineMath>{" for map coordinates. Here "}<InlineMath>{"n=300,D=64,q=2"}</InlineMath>{"."}</Prose>

<Prose>{"The data come from the UCI optical digit recognition collection, distributed in scikit-learn's "}<code>{"load_digits"}</code>{". Our offline CSV takes the first 30 original rows of each digit class and retains their original IDs. Thus source306 can be in this 300-row subset; ID306 does not mean array position306. Class labels select this balanced inspection collection and can colour the finished plot. They are not fitted inputs to the unsupervised maps below. The "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_digits.html"}>{"dataset description"}</a>{" and supplied "}<code>{"data-provenance.md"}</code>{" describe the measurements and selection."}</Prose>

<ManifoldFigure id="D02" />

<Prose>{"The two strips follow source30. The first contains its ten nearest images under Euclidean distance in all 64 normalized features. The second contains the ten nearest images in the saved PCA map. The printed IDs, not resemblance of the colours, join these two strips. Their common records are 0,79,166,229,266 and276: six of ten. Four original neighbors disappear, and four replacements arrive. A scatterplot can look coherent while changing this local answer."}</Prose>

<Prose>{"Input distance is "}<InlineMath>{"d_{ij}=\\sqrt{\\sum_{a=1}^D(X_{ia}-X_{ja})^2}"}</InlineMath>{"; map distance is "}<InlineMath>{"r_{ij}=\\sqrt{\\sum_{b=1}^q(Y_{ib}-Y_{jb})^2}"}</InlineMath>{". Dividing every feature by the same16 scales all "}<InlineMath>{"d_{ij}"}</InlineMath>{" equally and leaves their ordering unchanged. Per-feature standardization, or PCA whitening, can change the ordering: those choices change what “similar” means. We keep the stated pixel metric throughout this comparison."}</Prose>

<ManifoldFigure id="D03" />

<Prose>{"PCA uses fixed perpendicular rulers through the centered cloud. A point's score is its projection on a ruler, and the projection foot shows what was discarded. Keeping two rulers is a linear operation: the same matrix acts on every row. A nonlinear neighbor map instead chooses coordinates jointly so that selected relationships remain easy to see. It need not have a single ruler, an interpretable axis, or an inverse that reconstructs an image. This is the reason to inspect the relationships directly."}</Prose>

<Prose>{"The "}<a href={"/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#5-scaling-changes-which-differences-matter"}>{"PCA scaling section"}</a>{" and "}<a href={"/learn/path/full-curriculum/k-means-hierarchical-clustering?module=classical-ml#2-make-the-geometry-explicit"}>{"KMeans geometry section"}</a>{" explain why a ruler belongs to the question. In "}<a href={"/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#10-deeper-branches"}>{"PCA's whitening branch"}</a>{", retained score coordinate "}<InlineMath>{"z_a"}</InlineMath>{" is divided by "}<InlineMath>{"\\sqrt{\\lambda_a}"}</InlineMath>{", its positive standard-deviation scale. Consequently squared distance becomes "}<InlineMath>{"\\sum_a(\\Delta z_a)^2/\\lambda_a"}</InlineMath>{": low-variance directions receive more weight. With eigenvalues(9,1), differences(2,0) and(0,1) have ordinary lengths 2 and1, but whitened lengths 2/3 and1. The nearest choice switches. Discard a zero-eigenvalue direction or declare a regularization rule before dividing; do not silently divide by zero. Our saved maps keep the original stated pixel ruler."}</Prose>

<Prose>{"Download "}<code>{"digits-300.csv"}</code>{" and "}<code>{"calculated-inputs.json"}</code>{" together. The JSON holds ten full-precision maps, source IDs, software context and the CSV hash. "}<code>{"load_saved"}</code>{" below checks that hash and joins every coordinate by source ID. It refuses a mismatched collection rather than pairing unrelated rows. We will open its distance/rank work in §3; the same complete file also powers the later saved-map investigation."}</Prose>

<H2>{"2. A short route can be long on the surface"}</H2>

<ManifoldFigure id="D04" />

<Prose>{"Imagine measurements on a rolled sheet. The surface has two directions locally, although it sits in three-dimensional space. A small tangent patch is nearly flat. Two points on separate turns may be close through empty air and far along the sheet. A manifold model assumes local neighborhoods are sampled densely enough to reveal those surface relationships. It does not establish that every high-dimensional dataset has a smooth low-dimensional surface. Noise, branches, boundaries and undersampling can defeat that assumption."}</Prose>

<ManifoldFigure id="D05" />

<Prose>{"We can trace this problem without a three-dimensional optimizer. Put seven vertices on a U: A(0,0), B(0,1), C(0,2), D(1,2), E(2,2), F(2,1), G(2,0). At radius 1, join points whose input distance is at most1 and label each edge with that distance. A to G is 2 through the air, but the graph route A–B–C–D–E–F–G has six unit edges."}</Prose>

<Prose>{"The frontier begins at A with distance 0; all other tentative distances are infinity. Relaxing A–B replaces B's infinity by 1. Processing B similarly gives C2, then D3, E4, F5 and G6. Relaxation means replacing a known distance by a shorter candidate: "}<InlineMath>{"s_j\\leftarrow\\min(s_j,s_i+d_{ij})"}</InlineMath>{". With nonnegative edge lengths, Dijkstra can settle the smallest unsettled distance. The all-pairs implementation below uses the same principle with each vertex as a possible intermediate."}</Prose>

<ManifoldFigure id="D06" />

<Prose>{"Changing the radius changes the graph before any embedding happens. At .75, no unit edges exist, so A and G have no path. At1, their route is 6. At1.5, diagonal shortcuts A–B–D–F–G give "}<InlineMath>{"1+\\sqrt2+\\sqrt2+1=2+2\\sqrt2\\approx4.828427"}</InlineMath>{". At2, the direct A–G edge gives 2. The short route is mathematically correct for that graph and a poor description of traveling around the intended U. A separate noisy-bridge drawing shows why an accidental close pair can create the same problem in data."}</Prose>

<Prose>{"Change the radius in the first investigation and watch the new edges and route together. The next investigation moves D while keeping radius 1 fixed; a disconnected vertex is shown as disconnected, not mapped to a convenient replacement coordinate. The endpoint investigation traces a route between two selected IDs. Reset restores the exact seven vertices, endpoints A/G and radius 1. These are graph edits, not animation of an unseen fit."}</Prose>

<Prose>{"In code, radius graphs contain finite edge weights and infinity for absent edges. A k-neighbor graph instead selects "}<InlineMath>{"k"}</InlineMath>{" nearest nonself records per row. A union graph keeps an edge if either endpoint selected it; a mutual graph requires both. That difference can join or disconnect components. Duplicate observations can have a genuine zero-length nonself edge, so zero cannot mean “absent.”"}</Prose>

<Prose>{""}<code>{"graph"}</code>{" computes one row of distances at a time and uses distance/row-ID ordering for the constructed fixtures. "}<code>{"floyd_warshall"}</code>{" permits each vertex "}<code>{"via"}</code>{" in turn and compares the direct route with the two-leg route through it. For small graphs, its dense "}<InlineMath>{"O(n^3)"}</InlineMath>{" work is easy to inspect. A large sparse graph normally uses sparse adjacency and repeated Dijkstra; the resulting all-pairs distance matrix is still "}<InlineMath>{"O(n^2)"}</InlineMath>{". In §9 we will turn a finite route matrix into coordinates. The ordinary "}<code>{"Isomap"}</code>{" call uses a k-neighbor union graph; its handling of disconnected components may repair them, whereas "}<code>{"finite_embedding"}</code>{" refuses them. These calls therefore agree only after matching graph semantics and connectivity."}</Prose>

<ManifoldInvestigation id="L1" />
<ManifoldInvestigation id="L2" />
<ManifoldInvestigation id="L3" />

<p className="manifold-source-role">Recorded deterministic source; deterministic main executed; ordinary fits source-only</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/programs/isomap_routes.py"} filename={"isomap_routes.py"} language="python" />

<Prose>{"The new deterministic stream is:"}</Prose>

<p className="manifold-source-role">Recorded deterministic scratch/saved-array stream</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/outputs/isomap_routes.txt"} filename={"isomap_routes.txt"} language="output" />

<Prose>{"Read the first infinity as a missing path. The other three lengths expose the precise neighborhood tradeoff. The final map distances from A are 0 through6 because this radius 1 graph is a path. Its straight-line map is an unfolding of graph routes, not a claim that the original U's chord distances were preserved."}</Prose>

<H2>{"3. Name the relationship before scoring the picture"}</H2>

<ManifoldFigure id="D07" />

<Prose>{"Different methods carry different objects into the map. PCA carries projections and reconstruction error. Multidimensional scaling (MDS) carries a table of dissimilarities; isometric mapping (Isomap) first measures graph-route lengths. Locally linear embedding (LLE) carries local affine recipes: one point is reconstructed from its neighbors. Graph spectral methods carry weighted edges and smoothness. t-SNE carries normalized pair probabilities. UMAP carries local fuzzy memberships and an edge-sampling procedure. The diagrams follow the same observation IDs through these six objects; they are six questions, rather than six grades on one universal contest."}</Prose>

<Prose>{"For the digit map our first question is concrete: did the same nearby records stay nearby? Define "}<InlineMath>{"N_X^k(i)"}</InlineMath>{" and "}<InlineMath>{"N_Y^k(i)"}</InlineMath>{" as the "}<InlineMath>{"k"}</InlineMath>{" nearest nonself neighbors of observation "}<InlineMath>{"i"}</InlineMath>{" in input and map space. Its retained fraction is "}<InlineMath>{"|N_X^k(i)\\cap N_Y^k(i)|/k"}</InlineMath>{", and the collection average is"}</Prose>

<div className="neural-equation"><MathBlock>{"R_k=\\frac1n\\sum_i\\frac{|N_X^k(i)\\cap N_Y^k(i)|}{k}."}</MathBlock></div>

<ManifoldFigure id="D08" />

<Prose>{"Take four input positions A0, B1, C3, D7 and proposed map positions A0, B5, C1, D11. With "}<InlineMath>{"k=1"}</InlineMath>{", input arrows are A→B, B→A, C→B, D→C. Map arrows are A→C, B→C, C→A, D→B. None agrees, so "}<InlineMath>{"R_1=0"}</InlineMath>{". But replacing a nearest neighbor by the second-nearest is less severe than replacing it by the last. Input ranks of the four intruders are 2,2,2,2. Each contributes rank minus "}<InlineMath>{"k=1"}</InlineMath>{", giving total penalty4. Trustworthiness applies a normalization:"}</Prose>

<div className="neural-equation"><MathBlock>{"T_k=1-\\frac{2}{nk(2n-3k-1)}\\sum_i\\sum_{j\\in N_Y^k(i)\\setminus N_X^k(i)}(r_X(i,j)-k)."}</MathBlock></div>

<Prose>{"Here the coefficient is "}<InlineMath>{"2/(4\\cdot1\\cdot4)=1/8"}</InlineMath>{", so "}<InlineMath>{"T_1=1-4/8=.5"}</InlineMath>{". Trustworthiness penalizes neighbors introduced by the map. Continuity reverses the spaces and penalizes original neighbors omitted from it; the ranks then come from the map. Neither is the same as the retained fraction. Even a high average can coexist with a poor local query."}</Prose>

<Prose>{"For continuity, replace introduced IDs by omitted IDs and price them with their map ranks: "}<InlineMath>{"C_k=1-\\frac{2}{nk(2n-3k-1)}\\sum_i\\sum_{j\\in N_X^k(i)\\setminus N_Y^k(i)}(r_Y(i,j)-k)"}</InlineMath>{". In this four-point example the omitted neighbors also have map rank2, so "}<InlineMath>{"C_1=.5"}</InlineMath>{". That equality belongs to this fixture; the two penalties need not agree on another map."}</Prose>

<ManifoldFigure id="D09" />

<Prose>{"The ranking ladder removes the record itself, orders by distance and breaks exact ties by original ID. Rank1 is the closest remaining record. Duplicates retain different IDs and can occupy tied ranks. For the normalization used here, require "}<InlineMath>{"1\\le k<n/2"}</InlineMath>{", matching the ordinary trustworthiness API's domain. Our audit values "}<InlineMath>{"k=5,10,20"}</InlineMath>{" are questions asked of a map; they are separate from UMAP's graph neighbor count or t-SNE's perplexity."}</Prose>

<Prose>{"The complete audit file reads one input-distance row and one map-distance row at a time. "}<code>{"input_rank"}</code>{" and "}<code>{"map_rank"}</code>{" invert the neighbor permutations so a set difference can be priced by rank. This avoids an "}<InlineMath>{"n\\times n\\times D"}</InlineMath>{" offset tensor. Exact full ranking still costs "}<InlineMath>{"O(n^2D+n^2\\log n)"}</InlineMath>{", plus map-distance work; working storage beyond the data and coordinates is "}<InlineMath>{"O(n)"}</InlineMath>{". Nearest-neighbor search suffices for "}<InlineMath>{"R_k"}</InlineMath>{", but the intrusion and omission penalties need the relevant full ranks."}</Prose>

<p className="manifold-source-role">Recorded deterministic source; deterministic main executed; ordinary fits source-only</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/programs/audit_saved_neighbors.py"} filename={"audit_saved_neighbors.py"} language="python" />

<Prose>{"Run it with the supplied data directory:"}</Prose>

<CodeBlock language={"sh"}>{"python audit_saved_neighbors.py --assets ./manifold-learning"}</CodeBlock>

<Prose>{"Its newly computed saved-array stream is:"}</Prose>

<p className="manifold-source-role">Recorded deterministic scratch/saved-array stream</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/outputs/audit_saved_neighbors.txt"} filename={"audit_saved_neighbors.txt"} language="output" />

<Prose>{"This audit uses row-wise SciPy squared distances and an explicit source-ID tie rule. The historical digit programs used scikit-learn distance/rank routines. Their rounded and full-precision "}<InlineMath>{"T_k/C_k"}</InlineMath>{" values remain separately identified later; tiny differences arise from tied distances and numerical ordering, while these "}<InlineMath>{"R_{10}"}</InlineMath>{" values and source30 lists agree. That is why a comparison should disclose its convention instead of silently changing a metric column. No new embedding was fitted to produce this stream."}</Prose>

<Prose>{""}<code>{"ordinary_audit"}</code>{" exposes "}<code>{"NearestNeighbors"}</code>{" and "}<code>{"trustworthiness"}</code>{" on the same rows. It removes self explicitly, including when duplicate ties place self unexpectedly. It does not promise the library will choose our source-ID tie order. A rigid translation or rotation preserves exact Euclidean distances, whereas rounding coordinates or changing the input metric can change tied rankings. We now have a way to judge a map; next we build the objects it tries to preserve."}</Prose>

<H2>{"4. t-SNE turns each distance row into an effective neighborhood"}</H2>

<ManifoldFigure id="D10" />

<Prose>{"Stand at one selected input record and draw arrows to three candidates at distances 1,2,3. A Gaussian gives nearby candidates more weight. With width "}<InlineMath>{"\\sigma=1"}</InlineMath>{", the unnormalized weights are "}<InlineMath>{"e^{-1/2},e^{-2},e^{-9/2}"}</InlineMath>{". Dividing by their sum gives approximately .805512, .179734 and .014753. The widest arrow ends at the nearest candidate. These are probabilities of selecting a neighbor conditioned on standing at this record, not probabilities of a digit class."}</Prose>

<div className="neural-equation"><MathBlock>{"p_{j\\mid i}=\\frac{e^{-d_{ij}^2/(2\\sigma_i^2)}}{\\sum_{l\\ne i}e^{-d_{il}^2/(2\\sigma_i^2)}},\\qquad p_{i\\mid i}=0."}</MathBlock></div>

<Prose>{"Each row totals 1; different rows can have different widths. This adapts the neighborhood to local distance scale instead of forcing one width on both sparse and crowded regions."}</Prose>

<Prose>{"The "}<a href={"/learn/path/full-curriculum/support-vector-machines-svm?module=classical-ml#5-change-similarity-with-a-valid-kernel"}>{"SVM kernel section"}</a>{" introduced a Gaussian shape "}<InlineMath>{"e^{-\\gamma d^2}"}</InlineMath>{"; here "}<InlineMath>{"\\gamma=1/(2\\sigma^2)"}</InlineMath>{". We now remove self and normalize separately in each row. That changes the object: these conditional affinities need not be symmetric or be a positive-semidefinite kernel Gram. The later symmetric "}<InlineMath>{"P"}</InlineMath>{" is a joint probability table, not kernel PCA's inner-product matrix."}</Prose>

<ManifoldFigure id="D11" />

<Prose>{"At width .5 the nearest candidate almost monopolizes the row. At width 2 the three arrows are more even. To measure the row's effective number of candidates, first calculate entropy "}<InlineMath>{"H_i=-\\sum_jp_{j\\mid i}\\log_2p_{j\\mid i}"}</InlineMath>{", then perplexity "}<InlineMath>{"2^{H_i}"}</InlineMath>{". Equivalently, natural-log entropy "}<InlineMath>{"h_i"}</InlineMath>{" gives "}<InlineMath>{"e^{h_i}"}</InlineMath>{". Our three widths yield perplexities 1.017464,1.724422 and2.786447. A uniform row over "}<InlineMath>{"m"}</InlineMath>{" candidates has entropy "}<InlineMath>{"\\log_2m"}</InlineMath>{" and perplexity "}<InlineMath>{"m"}</InlineMath>{"; a concentrated row has smaller effective count."}</Prose>

<Prose>{"A chosen perplexity is a target for each row's width search, not exactly a selected number of neighbors. If two candidates tie for the nearest distance, shrinking the width cannot select one of them: the limiting distribution gives each1/2. That row's lower perplexity limit is 2. Its upper limit is the candidate count. Target1.5 is then infeasible, even if it satisfies the estimator's global "}<code>{"perplexity < n"}</code>{" check. Our local solver returns explicit uniform and nearest-tie limits, and refuses targets outside the feasible interval."}</Prose>

<Prose>{"The first investigation varies only width. The distance-edit investigation lets you select one candidate and alter its distance as well as width; the probabilities and entropy change immediately. The code's target search reports achieved entropy and boundary/convergence status. Do not infer that a finite search has found a mathematically exact root merely because it stopped."}</Prose>

<ManifoldInvestigation id="L4" />
<ManifoldInvestigation id="L5" />

<ManifoldFigure id="D12" />

<Prose>{"Conditioning is directional. An illustrative pair with "}<InlineMath>{"p_{B\\mid A}=.8"}</InlineMath>{" and "}<InlineMath>{"p_{A\\mid B}=.6"}</InlineMath>{", in a four-record collection, becomes "}<InlineMath>{"P_{AB}=(.8+.6)/(2\\cdot4)=.175"}</InlineMath>{". The arrows merge into one symmetric pair weight. This pair is a simple normalization example; it is not the next fixture's fitted pair."}</Prose>

<ManifoldFigure id="D13" />

<Prose>{"Now use all four actual input positions0,1,3,7 and perplexity 2. The full conditional matrix places zero on its diagonal. Add it to its transpose and divide by "}<InlineMath>{"2n=8"}</InlineMath>{":"}</Prose>

<div className="neural-equation"><MathBlock>{"P_{ij}=\\frac{p_{j\\mid i}+p_{i\\mid j}}{2n}."}</MathBlock></div>

<Prose>{"Every "}<InlineMath>{"P_{ij}=P_{ji}"}</InlineMath>{", and the total over ordered nonself pairs is 1. A→B's conditional value .655887 and B→A's .604118 produce "}<InlineMath>{"P_{AB}\\approx.157500626"}</InlineMath>{". Each unordered pair appears twice in that total; its combined mass is "}<InlineMath>{"2P_{AB}"}</InlineMath>{". Keeping this convention now prevents a factor-of-two mistake in the later gradient."}</Prose>

<Prose>{"The code calls "}<InlineMath>{"\\beta=1/(2\\sigma^2)"}</InlineMath>{". Increasing beta narrows the row and lowers entropy. "}<code>{"row_at_beta"}</code>{" subtracts the smallest squared distance before exponentiating; this common shift cancels in normalization and stops all weights from underflowing together. "}<code>{"solve_row"}</code>{" brackets beta, bisects once an upper bound exists and reports a status after a positive integer iteration budget. At "}<code>{"iteration-limit"}</code>{", the returned probabilities and beta describe the last evaluated row, even though its entropy has not met the tolerance. For example, distances[1,2,3], target perplexity2 and one iteration return the row at beta1, not the proposed next beta.5. A nonpositive budget is rejected before any boundary return. Entropy evaluation ignores zero-probability terms when evaluating "}<InlineMath>{"p\\log p"}</InlineMath>{", whose limiting value is 0. Uniform input scaling by "}<InlineMath>{"c>0"}</InlineMath>{" divides beta by "}<InlineMath>{"c^2"}</InlineMath>{" at the same target and preserves the row."}</Prose>

<p className="manifold-source-role">corrected complete source; bounded solver-callable checks only; main not rerun</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/programs/gaussian_rows.py"} filename={"gaussian_rows.py"} language="python" />

<Prose>{"The recorded deterministic stream below belongs to the preceding solver version; all four searches returned "}<code>{"converged"}</code>{". The current source keeps that path and corrects the "}<code>{"iteration-limit"}</code>{" tuple. The stream includes all four rows and the entire joint matrix:"}</Prose>

<p className="manifold-source-role">unchanged historical main stream of exact predecessor; all searches converged; not current-main execution</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/outputs/gaussian_rows.txt"} filename={"gaussian_rows.txt"} language="output" />

<Prose>{""}<code>{"conditional_and_joint"}</code>{" retains the "}<InlineMath>{"n\\times n"}</InlineMath>{" joint object because the exact small t-SNE objective needs it; row work avoids a larger feature-offset tensor. This route costs "}<InlineMath>{"O(n^2D+I n^2)"}</InlineMath>{" for at most "}<InlineMath>{"I"}</InlineMath>{" search steps per row and uses "}<InlineMath>{"O(n^2+nD)"}</InlineMath>{" storage. Large implementations restrict or approximate affinity work. The ordinary "}<code>{"TSNE"}</code>{" route in §7 accepts the complete feature matrix and the perplexity; it does not expose a stable public “fit this row's bandwidth” method. The inspected local function is our teaching implementation, not a private package API."}</Prose>

<Prose>{"The Gaussian construction and symmetric normalization follow the "}<a href={"https://jmlr.org/papers/volume9/vandermaaten08a/vandermaaten08a.pdf"}>{"original t-SNE paper"}</a>{". We have established what the input wants. Next we need a probability model in the map that can compete with it."}</Prose>

<H2>{"5. Give distant points room, then follow one force"}</H2>

<ManifoldFigure id="D14" />

<Prose>{"A patch in a high-dimensional neighborhood can have many moderately distant neighbors surrounding a point. Putting them all in a plane asks that plane to provide enough room at similar radii. The shell drawing contrasts this geometric shortage with a two-dimensional ring. This is the crowding problem: preserving every moderate separation can force points toward the center or distort other separations. In the constructed picture, eight cube corners "}<InlineMath>{"(\\pm1,\\pm1,\\pm1)"}</InlineMath>{" are all "}<InlineMath>{"\\sqrt3"}</InlineMath>{" from the center, and their smallest mutual separation is 2. Put the same eight IDs evenly on a planar circle of radius "}<InlineMath>{"\\sqrt3"}</InlineMath>{": adjacent IDs are only "}<InlineMath>{"2\\sqrt3\\sin(\\pi/8)<2"}</InlineMath>{" apart. Keeping each center-to-neighbor radius has compressed some neighbor-to-neighbor separations. Several overlapping neighborhoods compete for the same coordinates. This concrete conflict motivates the higher-dimensional shell picture; it is not measured digit density or a proof that a heavy tail preserves every requested distance."}</Prose>

<ManifoldFigure id="D15" />

<Prose>{"t-SNE uses a heavier-tailed map kernel. At distance 3, the Student kernel is "}<InlineMath>{"1/(1+3^2)=.1"}</InlineMath>{", while a Gaussian of width 1 gives "}<InlineMath>{"e^{-9/2}\\approx.011109"}</InlineMath>{". A distant pair can therefore carry meaningful map weight without being compressed as close as a Gaussian map would demand. The heavy tail changes the map's competition; it does not make every global distance correct."}</Prose>

<Prose>{"For map coordinates "}<InlineMath>{"y_i\\in\\mathbb R^q"}</InlineMath>{", define"}</Prose>

<div className="neural-equation"><MathBlock>{"t_{ij}=(1+\\|y_i-y_j\\|^2)^{-1},\\quad\nZ=\\sum_{a\\ne b}t_{ab},\\quad Q_{ij}=t_{ij}/Z,\\quad Q_{ii}=0."}</MathBlock></div>

<Prose>{"Like "}<InlineMath>{"P"}</InlineMath>{", "}<InlineMath>{"Q"}</InlineMath>{" is a symmetric probability distribution over ordered nonself pairs. The normalization joins all pairs, including ones whose endpoints did not move."}</Prose>

<ManifoldFigure id="D16" />

<Prose>{"Three points illustrate the effect. Change Y=(0,1,3) to Y=(0,1,2). A and B stay fixed, so their unnormalized kernel remains1/2. Initially the three unordered kernels are 1/2,1/10,1/5, giving ordered total "}<InlineMath>{"Z=2(.5+.1+.2)=1.6"}</InlineMath>{". After moving C, they are 1/2,1/5,1/2, giving "}<InlineMath>{"Z=2.4"}</InlineMath>{". Thus "}<InlineMath>{"Q_{AB}"}</InlineMath>{" changes from 5/16 to 5/24 even though distance AB is unchanged. Move C in the investigation and read the pair numerator alongside the complete denominator."}</Prose>

<Prose>{"To match the input distribution, t-SNE minimizes"}</Prose>

<div className="neural-equation"><MathBlock>{"C(Y)=\\operatorname{KL}(P\\|Q)=\\sum_{i\\ne j}P_{ij}\\log\\frac{P_{ij}}{Q_{ij}}."}</MathBlock></div>

<Prose>{"A large input probability with a tiny map probability makes a large contribution. This direction of KL emphasizes keeping highly weighted input neighbors represented; reversing KL would pose a different problem. The objective is nonconvex: different starts can reach different configurations, and an individual step need not decrease the cost if its learning rate is too large."}</Prose>

<ManifoldInvestigation id="L6" />

<ManifoldFigure id="D17" />

<Prose>{"For the four-point input from §4, start the map at(−1.5,−.5,.5,1.5). Select A. Each pair supplies a negative-gradient arrow "}<InlineMath>{"-4(P_{Aj}-Q_{Aj})t_{Aj}(y_A-y_j)"}</InlineMath>{". When "}<InlineMath>{"P>Q"}</InlineMath>{", negative gradient points toward that neighbor; when "}<InlineMath>{"P<Q"}</InlineMath>{", it points away. The arrows sum before any endpoint is updated. The total negative gradient for A is approximately+.0777846, so a learning rate .5 moves it right by+.0388923 before centering."}</Prose>

<Prose>{"At this start the ordered denominator is "}<InlineMath>{"Z=4"}</InlineMath>{". For A→B, "}<InlineMath>{"(P,Q,t,\\Delta)=(.157500626,.125,.5,-1)"}</InlineMath>{" gives a rightward contribution .065001252. A→C gives .031117664; A→D gives −.018334306, a leftward repulsion. Adding the three signed contributions gives .077784611. Updating all four from that same old state at rate .5 gives approximately[−1.461108,−.538805,.443699,1.556214] after centering. The arrows share one signed coordinate ruler; a negative contribution is not a negative probability."}</Prose>

<Prose>{"The gradient, under our ordered-pair convention, is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\nabla_{y_i}C=4\\sum_{j\\ne i}(P_{ij}-Q_{ij})t_{ij}(y_i-y_j)."}</MathBlock></div>

<Prose>{"The four-point step investigation keeps the input "}<InlineMath>{"P"}</InlineMath>{" fixed. Select an ID, edit only its current coordinate and choose a learning rate. A positive-rate Step updates every row from the same old state and then subtracts the new centroid; it reports that common shift. The current-coordinate editor starts with bounds−4 to4. After a Step, its labelled bounds expand symmetrically to contain every computed coordinate, and remain fixed while you edit or select another ID. The editor, point and live value always use that ID's same current coordinate. Reset returns the original four coordinates, selected A, rate.5 and bounds−4 to4. Learning rate 0 leaves all current coordinates unchanged, including after an edit. Centroid removal chooses a plotting origin, since translating all coordinates leaves every distance and the cost unchanged. An exactly coincident symmetric start can have zero forces; that stationary state does not establish a good minimum."}</Prose>

<ManifoldInvestigation id="L7" />

<ManifoldFigure id="D18" />

<Prose>{"Practical t-SNE uses a separate early phase: multiplying attractive input weights by an exaggeration factor "}<InlineMath>{"\\alpha"}</InlineMath>{". The drawing keeps "}<InlineMath>{"Q"}</InlineMath>{"'s total 1 beside "}<InlineMath>{"\\alpha P"}</InlineMath>{"'s total "}<InlineMath>{"\\alpha"}</InlineMath>{". Those attractive weights are not a newly normalized probability distribution. Renormalizing them would undo exaggeration. Momentum adds part of an earlier displacement; learning-rate schedules, initialization and stopping criteria also change the trajectory. Our full small optimizer in §10 has no momentum or exaggeration, so it cannot claim byte-for-byte agreement with a package's final digit map."}</Prose>

<Prose>{"The ordinary scikit-learn route specifies "}<code>{"early_exaggeration=12"}</code>{" through the default used in the retained snapshot and "}<code>{"learning_rate='auto'"}</code>{". That auto rule depends on sample count and exaggeration; different packages can use differently scaled learning-rate conventions. Treat a numeric rate as belonging to a particular update equation. In the four-point lab, .5 is the scalar multiplying the gradient just displayed. A large failed step remains a visible result, followed by Reset or a smaller step, rather than a hidden correction."}</Prose>

<Prose>{"An explicit oversized step makes the limitation concrete. From the same four-point start and fixed "}<InlineMath>{"P"}</InlineMath>{", a single rate 100 update gives approximately[6.278461,−8.261085,−10.760275,12.742899], and KL rises from .053522403 to 1.360383966. This is one constructed update, not another saved optimizer trajectory. The editor's bounds now read−13 to13, with A still selected at its actual coordinate6.278461…; selecting C loads−10.760275… on the same ruler and in the exact-entry field. Editing C to−10 changes that coordinate and its forces immediately while retaining these bounds. The next positive-rate Step starts from those edited coordinates and expands the bounds again if needed. Reset restores the original state. A smaller step or a line-search rule addresses step size; it does not make the nonconvex objective globally solved."}</Prose>

<H2>{"6. UMAP builds local memberships and samples their edges"}</H2>

<Prose>{"The t-SNE row is normalized as a probability distribution. UMAP begins with a different object: how strongly a local neighborhood connects to each candidate. Its graph construction and ordinary sampled optimizer are distinct stages. We will trace each before comparing their behavior."}</Prose>

<ManifoldFigure id="D19" />

<Prose>{"Use six scalar observations0,.7,1.9,4.2,8.6,11.3. Each exact neighbor row includes self first and then the nearest three others, so the array width is "}<InlineMath>{"k_{graph}=4"}</InlineMath>{". The self entry has distance 0 and is excluded from the membership sum. A selected row shows neighbor IDs and their distances separately: an absent neighbor is represented by ID−1 and infinite distance, not a phantom vertex at distance 0."}</Prose>

<Prose>{"UMAP gives each row a nearest-positive-distance offset "}<InlineMath>{"\\rho_i"}</InlineMath>{" and a scale "}<InlineMath>{"\\sigma_i>0"}</InlineMath>{". For this taught "}<code>{"local_connectivity=1"}</code>{" route,"}</Prose>

<div className="neural-equation"><MathBlock>{"v_{i\\to j}=\\exp\\!\\left[-\\frac{\\max(0,d_{ij}-\\rho_i)}{\\sigma_i}\\right],\n\\quad \\sum_{j\\ne i\\text{ in row}}v_{i\\to j}\\approx\\log_2(k_{graph})."}</MathBlock></div>

<Prose>{"Distances up to the offset get membership1. Memberships in a row need not total 1, and they do not describe class probabilities. The logarithmic target calibrates local scales; it is not the perplexity entropy equation from t-SNE."}</Prose>

<ManifoldFigure id="D20" />

<Prose>{"For a separate calibration row, use distances[0,1,1+ln2,1+ln2]. With "}<InlineMath>{"\\rho=1,\\sigma=1"}</InlineMath>{", the three nonself memberships are 1,1/2,1/2 and total 2=log₂4. This row makes the arithmetic transparent. It is not the six-observation dataset's first row. In that dataset, the retained first scale is approximately3.0883 and its memberships to the next three records are 1,.678,.322."}</Prose>

<ManifoldFigure id="D21" />

<Prose>{"Repeated zero distances, clamping by rho and missing neighbors alter the scale search. If enough memberships are pinned to 1, the target can be a boundary rather than an attainable finite root. The package also applies a small distance-scale floor to sigma. The complete teaching graph source retains that floor and its fixed64-step search. Read its result as an approximate package-style calibration, not a proof that every row reaches the target exactly. For explicit constructed nonself-distance examples, compare the self-first rows [0,1,2,3], [0,0,1,2] and [0,1,2,∞], all with array width 4. In the duplicate row, rho is 1 and both nonself distances 0 and 1 are pinned to membership 1, already reaching the target 2 before the third positive term. No positive finite scale makes that total exactly 2. In the removed-neighbor row, the absent slot has ID −1 and contributes no membership; target 2 is only its large-scale limit. The finite search still returns its bounded result. In this retained teaching source, the floor is .001 times the finite row mean when rho is positive, and .001 times the global finite-distance mean otherwise; the final scale is the larger of the search result and that floor. A floor does not establish root attainment."}</Prose>

<ManifoldFigure id="D22" />

<Prose>{"Local membership is directional because the two rows have different offsets and scales. At physical distance 2, two rows with rho1 and sigma 1/ln2 or1/ln4 give strengths.5 and.25. Their fuzzy union is"}</Prose>

<div className="neural-equation"><MathBlock>{"w_{ij}=v_{i\\to j}+v_{j\\to i}-v_{i\\to j}v_{j\\to i}=.625."}</MathBlock></div>

<Prose>{"It behaves like “at least one connection” under an algebraic independence analogy; it is not an empirical probability that two records belong to the same class. The arithmetic mean would be.375, a different graph. Directly edit the two strengths in the investigation and see both union and mean. Those controls describe the combination rule, while the preceding rows explain how memberships arise from distances."}</Prose>

<Prose>{"The retained graph program finds exact neighbors without a feature-broadcast tensor, solves scales, stores directed memberships in compressed sparse row (CSR) form and combines the sparse matrix with its transpose. CSR stores each row's nonzero column indices and values, with an offset array locating the start of each row; missing entries need no stored value. Its "}<code>{"main"}</code>{" also compares the graph with "}<code>{"fuzzy_simplicial_set"}</code>{", then fits a small ordinary UMAP model. The stream below belongs to that earlier full run; it has not been executed again here. The source deliberately uses package internals for a version-bound mechanism comparison, while ordinary application uses the public "}<code>{"UMAP"}</code>{" API in §7."}</Prose>

<ManifoldInvestigation id="L8" />

<p className="manifold-source-role">unchanged original programme; retained stream, not executed</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/programs/umap-mechanism.py"} filename={"umap-mechanism.py"} language="python" />

<p className="manifold-source-role">unchanged retained historical stream</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/outputs/retained-umap-mechanism.txt"} filename={"retained-umap-mechanism.txt"} language="output" />

<Prose>{"The maximum graph discrepancy3.34e−08 is for this six-row fixture under the recorded package version. It is evidence about the graph, not about every optimized coordinate. The ideal pair loss and sampled-head line refer to the separate layout calculations that we now open."}</Prose>

<ManifoldFigure id="D23" />

<Prose>{"In the map, UMAP uses a curve "}<InlineMath>{"\\nu(r)=1/(1+a r^{2b})"}</InlineMath>{". The ordinary package fits "}<InlineMath>{"a,b"}</InlineMath>{" from "}<code>{"min_dist"}</code>{" and "}<code>{"spread"}</code>{"; it does not simply substitute "}<code>{"min_dist"}</code>{" into an edge-length constraint. Small map distances have high membership. The fit uses a target curve that stays at 1 up to "}<code>{"min_dist"}</code>{", then decays as "}<InlineMath>{"\\exp[-(r-\\mathrm{min\\_dist})/\\mathrm{spread}]"}</InlineMath>{". It approximates this target with the two-parameter map curve; it does not forbid a pair from falling below "}<code>{"min_dist"}</code>{". The transparent teaching curve fixes "}<InlineMath>{"a=b=1"}</InlineMath>{", so "}<InlineMath>{"\\nu=1/(1+r^2)"}</InlineMath>{". It is marked as that curve, rather than advertised as the ordinary default fit."}</Prose>

<ManifoldFigure id="D24" />

<Prose>{"For one unordered pair with graph membership "}<InlineMath>{"w=.625"}</InlineMath>{", the ideal Bernoulli pair cost is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\mathrm{CE}(w,\\nu)=-w\\log\\nu-(1-w)\\log(1-\\nu)."}</MathBlock></div>

<Prose>{"At "}<InlineMath>{"r=1,\\nu=.5"}</InlineMath>{", the cost isln2. At "}<InlineMath>{"r=2,\\nu=.2"}</InlineMath>{", it is approximately1.0895775. Differentiate with respect to the membership: the minimum has "}<InlineMath>{"\\nu=w"}</InlineMath>{". With "}<InlineMath>{"a=b=1"}</InlineMath>{", that would require "}<InlineMath>{"r=\\sqrt{(1-w)/w}=\\sqrt{.6}"}</InlineMath>{". This is the isolated pair's optimum; other edges share its endpoints and prevent every pair from choosing its own radius. Subtracting the constant Bernoulli entropy "}<InlineMath>{"H(w)"}</InlineMath>{" turns this cross-entropy into KL between Bernoulli distributions, without changing its coordinate gradient."}</Prose>

<Prose>{"The two contributions show the tradeoff: at radius 1 they are .433216988 attractive and .259930193 repulsive; at radius 2 they are 1.005898695 and .083678832. The sum at radius 2 is 1.089577527. For graph weight0, the absent-pair term prefers arbitrarily large separation; for weight1, the present-pair term prefers radius 0. For "}<InlineMath>{"0<w<1"}</InlineMath>{", exact radius 0 has infinite absent-pair cost. Interpret endpoints by their limits instead of evaluating "}<InlineMath>{"0\\log0"}</InlineMath>{" directly."}</Prose>

<Prose>{"Vary only this pair's radius in the investigation. Keep the attraction and repulsion terms visible together. The complete "}<code>{"full_pair_loss_gradient"}</code>{" in the retained graph source sums each unordered pair once, including pairs with zero graph membership. It uses row-wise offsets and "}<InlineMath>{"O(n^2q)"}</InlineMath>{" work, without retaining a full coordinate-offset tensor. It refuses near-coincident pairs for this smooth reference calculation. Its7.991337→7.883388 stream is one exact full-pair gradient step on six declared coordinates, not an ordinary UMAP epoch."}</Prose>

<ManifoldInvestigation id="L9" />

<ManifoldFigure id="D25" />

<Prose>{"The ordinary optimizer does not evaluate all absent pairs each epoch. It schedules positive graph edges and samples negative vertices. In the retained sampled function, a positive edge moves both endpoints; a negative event moves only its head. An event with the head as its own negative is skipped, a coincident negative contributes no displacement in this taught branch, repulsion uses a .001 stabilizer and each coordinate update is clipped. Later negative events see the head after its preceding updates. These operations matter as much as a name for the loss."}</Prose>

<Prose>{"Consider a constructed edge occurring once per four elementary schedule slots. If a positive event displaces endpoints by "}<InlineMath>{"\\delta"}</InlineMath>{", its expected displacement is "}<InlineMath>{"\\delta/4"}</InlineMath>{". Multiplying the event by its weight .25 again gives "}<InlineMath>{"\\delta/16"}</InlineMath>{": double weighting. The finite enumeration below supplies a noise distribution explicitly. In this experiment one independent negative event happens per elementary slot; the ordinary UMAP negative schedule is tied to positive events, so their frequencies must be matched before comparing an expected field."}</Prose>

<p className="manifold-source-role">Recorded deterministic source; deterministic main executed; ordinary fits source-only</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/programs/sampled_pair_events.py"} filename={"sampled_pair_events.py"} language="python" />

<p className="manifold-source-role">Recorded deterministic scratch/saved-array stream</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/outputs/sampled_pair_events.txt"} filename={"sampled_pair_events.txt"} language="output" />

<Prose>{""}<code>{"positive_event"}</code>{" conserves the pair's total coordinate. "}<code>{"negative_event"}</code>{" does not move the sampled negative endpoint, so its field can move the centroid. The displayed expected vector averages events from one fixed starting state; a realized sequence updates that state between events. The "}<code>{"rate=0"}</code>{" case is exactly unchanged. A directed, asymmetric expected field need not be the gradient of one scalar objective. That is why the "}<a href={"https://arxiv.org/abs/2103.14608"}>{"True Loss analysis"}</a>{" studies the actual sampling procedure instead of treating the full-pair idealization as the complete implementation."}</Prose>

<ManifoldFigure id="D26" />

<Prose>{"Local scale also helps explain what an ordinary UMAP map may fail to show. Compute a graph-weighted squared radius using two neighbors at distances 1 and3 with weights1 and.5. The weighted products are 1 and4.5; dividing their sum by 1.5 gives 11/3. Doubling both distances with weights fixed gives 44/3 and changes the log squared radius byln4, apart from a declared epsilon. This local graph-weighted scale is not a calibrated global probability density."}</Prose>

<Prose>{"The densMAP extension attempts to retain local density information alongside neighborhood structure. The following scratch file exposes the radius calculation and supplies the complete ordinary densMAP call, including density weight, active fraction, variance shift and output radii. Its fitting function is source-only here; no new density map or stream is claimed."}</Prose>

<p className="manifold-source-role">Recorded deterministic source; deterministic main executed; ordinary fits source-only</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/programs/local_density_radius.py"} filename={"local_density_radius.py"} language="python" />

<p className="manifold-source-role">Recorded deterministic scratch/saved-array stream</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/outputs/local_density_radius.txt"} filename={"local_density_radius.txt"} language="output" />

<Prose>{"The scratch stream calculates only two local radius cases. "}<code>{"densmap_route"}</code>{" would return a model, an "}<InlineMath>{"n\\times2"}</InlineMath>{" coordinate array and two length-"}<InlineMath>{"n"}</InlineMath>{" log-radius arrays. Package code also uses graph orientation, neighbor distances and epsilon, so the simple two-neighbor calculation teaches the quantity rather than claiming every stored package value is identical. "}<code>{"dens_lambda"}</code>{" changes the density term's weight, "}<code>{"dens_frac"}</code>{" its active optimization fraction and "}<code>{"dens_var_shift"}</code>{" its variance stabilizer. A larger "}<code>{"min_dist"}</code>{" changes the map curve and appearance; it does not alone guarantee faithful density."}</Prose>

<Prose>{"The inspected "}<a href={"https://umap-learn.readthedocs.io/en/latest/_modules/umap/umap_.html"}>{"UMAP source"}</a>{" returns cached results when the input matches its training data before reaching the densMAP new-input refusal. Thus "}<code>{"transform(training_rows)"}</code>{" can succeed while "}<code>{"transform(new_rows)"}</code>{" is unsupported. This is an API boundary, not a contradiction. The density radius/API explanation is supported by implementation and creator descriptions; the full densMAP paper's inaccessible derivation and biomedical conclusions are outside this lesson's established proof scope."}</Prose>

<H2>{"7. Compare real maps through the same records"}</H2>

<Prose>{"The constructed rows exposed each method's operations. Return now to the optical digits: do those operations keep useful relationships in a measured collection?"}</Prose>

<ManifoldFigure id="D27" />

<Prose>{"The paired plots show all 300 source IDs in input-informed inspection and in saved PCA, t-SNE and UMAP maps. Coordinate axes keep equal aspect ratio within each map. Map scale and orientation can differ between methods; the plots do not use inter-map distances as a statistic. A label overlay identifies the recorded digits only after fitting. Local styles can mix or separate without proving a clustering, classification or density result."}</Prose>

<Prose>{"The first ordinary program loads all 64 features, divides by 16, excludes self in its neighbor lists and computes mean retention. PCA fits two components using a full singular value decomposition (SVD). Each t-SNE call uses PCA initialization, automatic learning rate,1000 iterations, Barnes–Hut forces, angle.5 and seed 7. The returned coordinate CSV keeps ID and label columns next to the map coordinates. "}<code>{"n_jobs=1"}</code>{" governs the neighbor operation; the retained execution also records its BLAS/OpenMP thread context. A seed alone does not standardize every floating-point implementation."}</Prose>

<p className="manifold-source-role">unchanged original programme; retained stream, not executed</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/programs/inspect_digits.py"} filename={"inspect_digits.py"} language="python" />

<p className="manifold-source-role">unchanged retained historical stream</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/outputs/retained-inspect_digits.txt"} filename={"retained-inspect_digits.txt"} language="output" />

<Prose>{"These are retained results for these exact data and settings: PCA "}<InlineMath>{"R_{10}=.376333"}</InlineMath>{", t-SNE perplexity 5 .710333,30 .770333 and80 .762333. They establish a comparison within this audit, rather than a universal preferred perplexity. The library trustworthiness values in the stream use its own ranking convention. The new source-ID audit in §3 preserves retention but reports tiny rank differences separately."}</Prose>

<Prose>{"The ordinary UMAP program constructs a15-neighbor graph with "}<code>{"min_dist=.1"}</code>{", "}<code>{"spread=1"}</code>{", Euclidean metric, spectral initialization, seed 7 and transform seed 7. It returns300×2 coordinates. Its fit remains unsupervised: labels do not appear in the call."}</Prose>

<p className="manifold-source-role">unchanged original programme; retained stream, not executed</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/programs/inspect_umap.py"} filename={"inspect_umap.py"} language="python" />

<p className="manifold-source-role">unchanged retained historical stream</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/outputs/retained-inspect_umap.txt"} filename={"retained-inspect_umap.txt"} language="output" />

<Prose>{"Its retained "}<InlineMath>{"R_{10}=.714333"}</InlineMath>{" falls between the PCA and t-SNE30 values, but the average is only the beginning of an inspection."}</Prose>

<ManifoldFigure id="D28" />

<Prose>{"Source30 demonstrates why. Its input list is[0,166,229,160,36,276,140,266,178,79]. PCA's map list is[78,229,79,306,276,0,130,266,132,166]; six records agree. The t-SNE30 map list is[0,276,266,286,256,130,48,166,229,10]; five agree. For this query, PCA's .6 exceeds t-SNE's .5 despite the reverse collection averages. Read the missing and newly introduced IDs beside their images, then inspect whether the pixel metric itself fits your question about handwriting."}</Prose>

<Prose>{"The saved-map investigation offers a map selector, an existing source ID and audit "}<InlineMath>{"k"}</InlineMath>{". It displays the current map, input/map image strips, common/missing/new edges, local fraction and collection scores simultaneously. It loads the saved full-precision arrays and recomputes the chosen audit; it does not fit a new map when a control changes. Reset returns source30, "}<InlineMath>{"k=10"}</InlineMath>{" and the stated initial pair. Invalid source IDs leave the last valid view visible with a precise message. No rounded scatter coordinates enter the ranking."}</Prose>

<ManifoldInvestigation id="L10" />

<ManifoldFigure id="D29" />

<Prose>{"Sensitivity deserves an actual changed case. For this dataset, PCA-initialized t-SNE seed 7 and19 produced identical saved coordinates at each of perplexities 5,30,80. That is a null seed comparison, not a general invariance theorem. The retained random-initialized perplexity 30 maps differ: their "}<InlineMath>{"R_{10}"}</InlineMath>{" values are .772000 and.769667. Show the identical and changed pairs side by side. Translating, rotating or reflecting one map leaves its Euclidean neighbor relationships unchanged, even though its coordinate table changes. Changing initialization can alter those relationships."}</Prose>

<Prose>{"Practical inspection therefore starts with a stated input metric and several scales, examines individual records, repeats justified settings and compares with a linear baseline. Cluster area, separation and placement on a t-SNE/UMAP plot are consequences of its construction and sampling as well as the input. Use original-space evidence and the "}<a href={"/learn/path/full-curriculum/clustering-evaluation-validation-silhouette-ari-nmi?module=classical-ml#4-a-score-evaluates-a-geometry-as-well-as-a-partition"}>{"clustering evaluation lesson"}</a>{" when the question is whether named groups are supported. The "}<a href={"https://distill.pub/2016/misread-tsne/"}>{"Distill guide"}</a>{" provides additional visual examples of parameter sensitivity and misleading area/gap interpretations."}</Prose>

<H2>{"8. Decide whether the next observation needs a fixed map"}</H2>

<ManifoldFigure id="D30" />

<Prose>{"A map of one collection answers an inspection question. Prediction on future rows adds a state question: which fitted transformation will those rows use? Split the300 digit records into225 training and75 validation observations before fitting a representation. Fit a reducer on training features, transform validation features using that reducer, train a classifier in the training coordinate system and evaluate it in the same system. The diagram keeps training and validation IDs distinct through the entire route."}</Prose>

<Prose>{"The retained programme compares raw normalized pixels, ten PCA coordinates and ten UMAP coordinates, each followed by five-neighbor classification. The reduction to ten coordinates is for this prediction experiment; it is separate from the two-dimensional inspection map."}</Prose>

<p className="manifold-source-role">unchanged original programme; retained stream, not executed</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/programs/compare_transforms.py"} filename={"compare_transforms.py"} language="python" />

<p className="manifold-source-role">unchanged retained historical stream</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/outputs/retained-compare_transforms.txt"} filename={"retained-compare_transforms.txt"} language="output" />

<Prose>{"The denominators matter: .9733 represents 73 correct of 75 for pixels and PCA, while .9467 represents 71 of 75 for UMAP. This validation result does not support a claim that the nonlinear representation improves classification here. If validation chooses settings, keep an untouched final test for the final generalization claim. If scaling estimates per-feature means or variances, fit that scaler on training rows too; the common division by 16 is a fixed measurement conversion."}</Prose>

<ManifoldFigure id="D31" />

<Prose>{"PCA has a fitted mean and component matrix: new coordinates are "}<InlineMath>{"(x-\\mu)V_q"}</InlineMath>{". Ordinary UMAP instead searches the fixed reference's input neighbors, constructs query-to-reference memberships, initializes query coordinates near reference coordinates and optimizes their placement relative to that reference. It need not train a neural function. The scratch interpolation below makes the initialization idea visible: input query1 between references0 and3 gets inverse-distance weights2/3 and1/3, so reference map coordinates 0 and6 give initial coordinate2. This interpolation is not the complete UMAP transform algorithm."}</Prose>

<Prose>{"scikit-learn's "}<code>{"TSNE"}</code>{" produces coordinates for the supplied collection and has no general "}<code>{".transform"}</code>{" method. The optional openTSNE route fits a reference embedding and places future observations against it; this extension has its own affinity and optimization choices and is not the same API as fitting all rows together. The shown optional call is source-only and needs openTSNE installed. A supervised UMAP call supplies training labels to alter the graph, making it a different construction. A parametric UMAP encoder learns a function from input rows to coordinates. The "}<a href={"/learn/track/deep-learning-fundamentals"}>{"Deep Learning Fundamentals module"}</a>{" develops neural functions, backpropagation and training objectives needed to train an encoder; ordinary graph-based transform does not imply that an encoder was trained."}</Prose>

<p className="manifold-source-role">Recorded deterministic source; deterministic main executed; ordinary fits source-only</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/programs/reference_map_routes.py"} filename={"reference_map_routes.py"} language="python" />

<p className="manifold-source-role">Recorded deterministic scratch/saved-array stream</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/outputs/reference_map_routes.txt"} filename={"reference_map_routes.txt"} language="output" />

<Prose>{""}<code>{"data_split"}</code>{" splits row indices so IDs, labels and features remain joined. "}<code>{"ordinary_pipeline"}</code>{" stores fitted reducers and predictions with an integer correct count and denominator. Its fitting functions are complete source-only routes; the stream here runs only scratch interpolation. Rebuilding an independent validation map does not preserve a shared coordinate system, even with the same seed. Save and reuse preprocessing and reducer state when that is the task."}</Prose>

<Prose>{"In the optional "}<a href={"https://opentsne.readthedocs.io/en/stable/api/index.html"}>{"openTSNE1.0.0 API"}</a>{", "}<code>{"fit"}</code>{" returns a reference embedding and its "}<code>{"transform"}</code>{" supports the shown perplexity 5 and median initialization. Each new point is optimized against that reference, independently of the other new points. Initialization's neighbor count and optimization perplexity have different roles. This source-only route does not establish matched installed dependencies, returned coordinates or predictive quality."}</Prose>

<ManifoldFigure id="D32" />

<Prose>{"The scale diagram opens actual allocations. A dense float64 "}<InlineMath>{"n\\times n"}</InlineMath>{" matrix occupies "}<InlineMath>{"8n^2"}</InlineMath>{" bytes:800 MB at 10,000 observations,80 GB at 100,000 and2 TB at 500,000, all decimal units and before additional matrices. An "}<InlineMath>{"n\\times n\\times D"}</InlineMath>{" offset tensor multiplies that burden by feature count. A sparse graph with "}<InlineMath>{"k"}</InlineMath>{" edges per row can keep adjacency proportional to "}<InlineMath>{"nk"}</InlineMath>{"; later dense shortest-path or eigen matrices can still dominate. The row-wise audit in §3 trades time for "}<InlineMath>{"O(n)"}</InlineMath>{" distance workspace."}</Prose>

<ManifoldFigure id="D33" />

<Prose>{"Three approximations act on different objects. Approximate nearest-neighbor search proposes input neighbors for graph or affinity construction. Barnes–Hut groups distant map points in a tree to approximate repulsive forces. Fast Fourier transform (FFT) based t-SNE interpolates force-related quantities onto a grid and accelerates their convolution. Neither a tree nor a grid replaces the definition of the input metric. A schematic box is labelled as a spatial cell, with contained point IDs and its summary; it is not presented as a measured runtime benchmark. Choose approximation accuracy against the relationship you need to retain, and disclose settings. No universal timing or accuracy advantage follows from naming one method."}</Prose>

<Prose>{"We now know the practical boundaries of the two nonlinear maps. The next section opens the alternative objects introduced in §3, so you can recognize when a different preservation question is a better fit."}</Prose>

<H2>{"9. Deeper branch: distances, recipes, smoothness and tangent patches"}</H2>

<H3>{"Recover coordinates from distances"}</H3>

<ManifoldFigure id="D34" />

<Prose>{"Put A0, B2 and C5 on a line. Their distance table is symmetric, has zero diagonal and contains AB2, BC3, AC5. We can recover centered coordinates without being given the original line: square the distances, subtract row and column means, add the grand mean and multiply by −1/2. The diagram follows one table entry through these operations into a centered inner-product table."}</Prose>

<Prose>{"Why does this work? Squared Euclidean distance satisfies "}<InlineMath>{"d_{ij}^2=\\|x_i\\|^2+\\|x_j\\|^2-2x_i^Tx_j"}</InlineMath>{". Multiplying on both sides by the centering matrix "}<InlineMath>{"J=I-\\mathbf1\\mathbf1^T/n"}</InlineMath>{" removes terms that are constant across a row or column. The remaining matrix is"}</Prose>

<div className="neural-equation"><MathBlock>{"B=-\\tfrac12 J D^{\\circ2}J=X_cX_c^T\n=\\frac19\\begin{bmatrix}49&7&-56\\\\7&1&-8\\\\-56&-8&64\\end{bmatrix}."}</MathBlock></div>

<Prose>{"Here "}<InlineMath>{"D^{\\circ2}"}</InlineMath>{" means entrywise squared dissimilarities, while feature count "}<InlineMath>{"D"}</InlineMath>{" earlier was a scalar; the table's superscript and surrounding context distinguish them. An eigenfactorization "}<InlineMath>{"B=U\\Lambda U^T"}</InlineMath>{" gives coordinates "}<InlineMath>{"Y=U_q\\Lambda_q^{1/2}"}</InlineMath>{" from the positive eigenvalues. The three centered line coordinates are[−7/3,−1/3,8/3] up to a common reflection, and the one positive eigenvalue is 38/3. Comparing signed coordinates would falsely reject a reflected but equivalent answer; compare pair distances or "}<InlineMath>{"YY^T"}</InlineMath>{"."}</Prose>

<Prose>{"For a concrete double-centering entry, the squared-distance row means are 29/3,13/3,34/3 and the grand mean is 76/9. Entry AB becomes "}<InlineMath>{"-\\frac12(4-29/3-13/3+76/9)=7/9"}</InlineMath>{". The centered coordinate product "}<InlineMath>{"(−7/3)(−1/3)=7/9"}</InlineMath>{" agrees. This links one measured length to one inner product before the eigensolver is called."}</Prose>

<Prose>{"The connection to PCA is exact for Euclidean input distances. If centered features have singular value decomposition "}<InlineMath>{"X_c=U\\Sigma V^T"}</InlineMath>{", then "}<InlineMath>{"B=X_cX_c^T=U\\Sigma^2U^T"}</InlineMath>{". Classical MDS coordinates "}<InlineMath>{"U_q\\Sigma_q"}</InlineMath>{" are therefore the PCA scores "}<InlineMath>{"X_cV_q"}</InlineMath>{", up to choices of signs and bases within tied modes. A non-Euclidean dissimilarity table need not have that feature-matrix interpretation."}</Prose>

<ManifoldFigure id="D35" />

<Prose>{"Not every symmetric nonnegative table is Euclidean. Distances AB1, BC1, AC3 violate the triangle inequality. Their centered Gram has eigenvalues4.5,0,−5/6; no exact real Euclidean factor can keep the negative mode. Keeping only positive modes gives an approximation. Even a Euclidean table may need more than the requested "}<InlineMath>{"q"}</InlineMath>{" positive directions. Classical MDS minimizes a Gram-matrix approximation, commonly called strain; it is not the same criterion as raw distance stress."}</Prose>

<Prose>{"Metric MDS instead adjusts coordinates to reduce raw stress "}<InlineMath>{"\\sigma(Y)=\\sum_{i<j}(\\|y_i-y_j\\|-d_{ij})^2"}</InlineMath>{". Each unordered pair appears once. The small SMACOF route computes current distances, forms off-diagonal coefficients "}<InlineMath>{"B_{ij}(Y)=-d_{ij}/\\|y_i-y_j\\|"}</InlineMath>{", balances each diagonal to make row sums zero, then updates "}<InlineMath>{"Y\\leftarrow B(Y)Y/n"}</InlineMath>{" for equal complete-pair weights. This majorization step bounds the objective by a simpler function whose minimum can be computed; descending that bound does not increase the original stress under the standard complete metric setting. Zero current distances get ratio0 in this reference, keeping it finite but potentially trapping a coincident start. Start with separated coordinates when positive targets need separation."}</Prose>

<Prose>{"Stress squares a residual of "}<strong>{"lengths"}</strong>{": first compute "}<InlineMath>{"r_{ij}=\\|y_i-y_j\\|"}</InlineMath>{", subtract the supplied length "}<InlineMath>{"d_{ij}"}</InlineMath>{", then square "}<InlineMath>{"r_{ij}-d_{ij}"}</InlineMath>{". It is not "}<InlineMath>{"(r_{ij}^2-d_{ij}^2)^2"}</InlineMath>{". Classical strain instead compares the centered Gram entries through "}<InlineMath>{"\\|B-YY^T\\|_F^2"}</InlineMath>{". Stress-1 further divides the length-residual sum by a declared squared-map-length sum before taking a square root; these are three separately named quantities."}</Prose>

<Prose>{"Nonmetric MDS has another unknown: monotone fitted disparities in place of the numeric dissimilarities. For ordered dissimilarities1,2,5, fitted disparities may preserve their order without preserving those exact gaps. For example1,3,4 preserves the ordering while changing relative spacings. An ordinary nonmetric optimizer alternates monotone regression with coordinate updates under its normalization. It is useful when only ordering is defensible; it does not make an arbitrary triangle table Euclidean or prove a good two-dimensional solution."}</Prose>

<Prose>{"We provide full classical and metric scratch implementations. The ordinary branch uses current scikit-learn1.9.1: "}<code>{"ClassicalMDS(metric='precomputed')"}</code>{" does double-centering, while "}<code>{"MDS(metric_mds=True, metric='precomputed')"}</code>{" runs metric stress optimization. Pass exactly the same[[-1],[0],[1]] starting array to scratch and to "}<code>{"fit_transform(..., init=initial)"}</code>{" before comparing stress. The array overrides the constructor's random start and reduces the comparison to one trajectory. Library stopping tolerances differ from our relative raw-stress stopping rule, so compare attained distances/stress and status, not identical iteration counts."}</Prose>

<p className="manifold-source-role">unchanged complete current source; numeric main stream belongs to exact checked predecessor; ordinary-only return completion remains source-only</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/programs/classical_geometry.py"} filename={"classical_geometry.py"} language="python" />

<p className="manifold-source-role">retained scratch main stream of exact checked predecessor; current ordinary-only completion source-only; not rerun</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/outputs/classical_geometry.txt"} filename={"classical_geometry.txt"} language="output" />

<Prose>{"The newly executed scratch example attains raw stress0 for the0,2,5 line. The ordinary functions in this file are source-only, not an executed parity claim. In this complete-table convention, Stress-1 is "}<InlineMath>{"\\sqrt{\\sigma/\\sum_{i<j}\\|y_i-y_j\\|^2}"}</InlineMath>{" when its denominator is positive; the package reports raw stress with "}<code>{"normalized_stress=False"}</code>{" and normalized stress with "}<code>{"True"}</code>{". Nonmetric normalization is tied to fitted disparities and its implementation. Do not compare raw stress and Stress-1 as if they shared units."}</Prose>

<Prose>{"Duplicate A0, B0, C2 are a revealing boundary: zero AB is an observed distance for classical or metric MDS. In the ordinary nonmetric route, zero dissimilarities are treated as missing. The same table therefore means something different. Current "}<code>{"metric_mds"}</code>{" chooses metric/nonmetric behavior; "}<code>{"metric"}</code>{" describes input distance handling. Older boolean "}<code>{"metric"}</code>{" and "}<code>{"dissimilarity"}</code>{" spellings remain deprecated compatibility paths in 1.9, with removal planned for 1.10. Their existence does not establish a historical failure. The optional "}<code>{"init='classical_mds'"}</code>{" deliberately chooses a different starting policy. See the "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.manifold.MDS.html"}>{"current MDS documentation"}</a>{"."}</Prose>

<Prose>{"Double-centering stores "}<InlineMath>{"O(n^2)"}</InlineMath>{" entries, and a dense full eigendecomposition takes "}<InlineMath>{"O(n^3)"}</InlineMath>{" work. Our function returns all eigenvalues so approximation and unresolved rank are inspectable; it may return fewer than "}<InlineMath>{"q"}</InlineMath>{" columns when fewer positive modes exist. The full dense eigenroute belongs to these small fixtures. Large solvers select modes iteratively and still need a justified distance representation."}</Prose>

<ManifoldFigure id="D36" />

<Prose>{"Isomap feeds graph-route distances to that coordinate recovery. The radius 1 U graph's route table has "}<InlineMath>{"d_{ij}=|i-j|"}</InlineMath>{". Its one-dimensional centered coordinates are −3,−2,−1,0,1,2,3 up to reflection. This is why the U unfolds into a line. The complete "}<code>{"isomap_routes.py"}</code>{" in §2 performs this composition only when every route is finite. Infinity is neither an ordinary distance nor a zero edge. A repaired disconnected ordinary graph answers a modified question; inspect its components and repair before interpreting its output. Dense all-pairs routes and dense MDS remain costs even when the initial graph is sparse."}</Prose>

<H3>{"Keep a local recipe instead of every distance"}</H3>

<ManifoldFigure id="D37" />

<Prose>{"LLE starts with a recipe. Put a query at 1 between neighbors0 and3. If weights sum1 and reconstruct the query, "}<InlineMath>{"0w_L+3w_R=1"}</InlineMath>{", so "}<InlineMath>{"w_L=2/3,w_R=1/3"}</InlineMath>{". Move those neighbors to map positions0 and6; the same recipe places the query at 2. In the investigation, change only its map coordinate and see the squared reconstruction error;2 is its minimum. The adjacent static extrapolation case changes the input query to 4 and shows how the recipe itself changes; it is separate from the live map-coordinate control."}</Prose>

<Prose>{"An affine recipe permits negative weights. Query4 with neighbors0 and3 has weights−1/3 and4/3. It lies beyond its neighbors; clipping those weights would replace the optimization with a different rule. Sum1 is essential: adding the same translation to every coordinate then preserves the recipe. Unlike fuzzy memberships or conditional probabilities, these weights are not constrained to[0,1]."}</Prose>

<ManifoldInvestigation id="L11" />

<ManifoldFigure id="D38" />

<Prose>{"For one general query "}<InlineMath>{"x_i"}</InlineMath>{", make rows "}<InlineMath>{"z_j=x_j-x_i"}</InlineMath>{" for its "}<InlineMath>{"k"}</InlineMath>{" neighbors and form the small local Gram "}<InlineMath>{"C=ZZ^T\\in\\mathbb R^{k\\times k}"}</InlineMath>{". Minimizing reconstruction error under "}<InlineMath>{"\\sum_jw_j=1"}</InlineMath>{" gives "}<InlineMath>{"Cu=\\mathbf1"}</InlineMath>{", then "}<InlineMath>{"w=u/(\\mathbf1^Tu)"}</InlineMath>{". A trace-relative diagonal ridge stabilizes a singular or nearly singular Gram. Our explicit zero-trace policy gives equal weights to coincident neighbors; it is a stated fallback, not an inverse of a zero matrix."}</Prose>

<Prose>{"Store all rows of recipes in sparse "}<InlineMath>{"W\\in\\mathbb R^{n\\times n}"}</InlineMath>{". A proposed map has total reconstruction error"}</Prose>

<div className="neural-equation"><MathBlock>{"\\sum_i\\|y_i-\\sum_jW_{ij}y_j\\|^2\n=\\operatorname{tr}(Y^T M Y),\\qquad M=(I-W)^T(I-W)."}</MathBlock></div>

<Prose>{"Without constraints every "}<InlineMath>{"y_i=0"}</InlineMath>{" wins. LLE excludes that collapse by requiring zero mean and "}<InlineMath>{"Y^TY/n=I_q"}</InlineMath>{". The implementation first projects out the constant direction, then chooses the lowest remaining eigenmodes in that centered subspace. If extra zero modes remain because the recipes separate components, they carry component ambiguity; do not label them a unique global reconstruction."}</Prose>

<p className="manifold-source-role">Recorded deterministic source; deterministic main executed; ordinary fits source-only</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/programs/lle_recipes.py"} filename={"lle_recipes.py"} language="python" />

<p className="manifold-source-role">Recorded deterministic scratch/saved-array stream</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/outputs/lle_recipes.txt"} filename={"lle_recipes.txt"} language="output" />

<Prose>{"The printed row sums, centroid and covariance check three distinct constraints. The curved five-point fixture's local residuals are not all zero; the ridge and finite neighborhoods change exact reconstruction. The ordinary "}<code>{"LocallyLinearEmbedding(method='standard', reg=..., eigen_solver='dense')"}</code>{" uses the same general local-recipe/global-eigen strategy, but neighbor ties, ridge details and eigen normalizations must match before comparing numerical answers. Repeated eigenvalues permit different basis vectors for the same subspace; compare projection matrices or reconstruction objectives instead of signed columns. "}<code>{"affine_line"}</code>{" gives the exact unregularized two-neighbor line example separately from the ridge solver."}</Prose>

<Prose>{"Local Gram formation costs "}<InlineMath>{"O(nDk^2)"}</InlineMath>{", local solves "}<InlineMath>{"O(nk^3)"}</InlineMath>{", plus neighbor search. Storing "}<InlineMath>{"W"}</InlineMath>{" costs "}<InlineMath>{"O(nk)"}</InlineMath>{", while this small dense global solve costs "}<InlineMath>{"O(n^2)"}</InlineMath>{" storage and "}<InlineMath>{"O(n^3)"}</InlineMath>{" work. Sparse low-mode solvers are the scaling continuation; the method's name does not remove the eigenproblem. The "}<a href={"https://cs.nyu.edu/~roweis/lle/papers/lleintro.pdf"}>{"creator's LLE introduction"}</a>{" explains the local reconstruction and constrained eigen formulation."}</Prose>

<H3>{"Make graph coordinates smooth"}</H3>

<ManifoldFigure id="D39" />

<Prose>{"A different graph question asks connected records to have similar coordinates. For the unit chain A–B–C, set map coordinate "}<InlineMath>{"y=(0,1,3)"}</InlineMath>{". The two unordered edges contribute "}<InlineMath>{"(0-1)^2+(1-3)^2=5"}</InlineMath>{". Let "}<InlineMath>{"A"}</InlineMath>{" be the symmetric weighted adjacency, "}<InlineMath>{"D_g"}</InlineMath>{" its diagonal degree matrix and "}<InlineMath>{"L=D_g-A"}</InlineMath>{". Expanding the quadratic gives"}</Prose>

<div className="neural-equation"><MathBlock>{"y^TLy=\\tfrac12\\sum_{i,j}A_{ij}(y_i-y_j)^2\n=\\sum_{i<j}A_{ij}(y_i-y_j)^2."}</MathBlock></div>

<Prose>{"The ordered sum is 10; the quadratic energy is 5. Change only the middle coordinate in the live chain and watch both edge contributions and their sum. A constant coordinate has zero energy. Disconnected components each admit their own constant, so the number of zero modes equals the number of connected components. Removing just one constant mode is insufficient when there are several components."}</Prose>

<Prose>{"Normalization poses another question. The unnormalized eigenproblem is "}<InlineMath>{"Lf=\\lambda f"}</InlineMath>{". A degree-weighted formulation is "}<InlineMath>{"Lf=\\lambda D_gf"}</InlineMath>{". The symmetric-normalized matrix is "}<InlineMath>{"D_g^{-1/2}LD_g^{-1/2}"}</InlineMath>{"; its eigenvectors become generalized vectors after multiplying by "}<InlineMath>{"D_g^{-1/2}"}</InlineMath>{". Degree-zero vertices must be separated before that division. Our ordinary spectral call uses the package's normalized convention, rather than claiming equality to the unnormalized chain coordinates."}</Prose>

<ManifoldInvestigation id="L12" />

<p className="manifold-source-role">Recorded deterministic source; deterministic main executed; ordinary fits source-only</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/programs/graph_spectrum.py"} filename={"graph_spectrum.py"} language="python" />

<p className="manifold-source-role">Recorded deterministic scratch/saved-array stream</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/outputs/graph_spectrum.txt"} filename={"graph_spectrum.txt"} language="output" />

<Prose>{"The complete file exposes adjacency construction, degrees, each matrix, its eigenproblem and the random-walk transition below. SciPy's "}<code>{"eigh(L,D_g)"}</code>{" supplies a numerical primitive; it does not build the graph for us. "}<code>{"SpectralEmbedding(affinity='precomputed')"}</code>{" accepts that declared adjacency and uses its documented normalized route. These ordinary calls are source-only here. Choosing graph support, weights, components and normalization is part of the method, not incidental plotting configuration."}</Prose>

<H3>{"Estimate a local plane and align its neighbors"}</H3>

<ManifoldFigure id="D40" />

<Prose>{"Return to the curved sheet's small patch. Subtract its mean from a neighborhood matrix "}<InlineMath>{"Z\\in\\mathbb R^{m\\times D}"}</InlineMath>{" and compute a thin SVD "}<InlineMath>{"Z=U\\Sigma V^T"}</InlineMath>{". Its first "}<InlineMath>{"q"}</InlineMath>{" right singular vectors are tangent directions in input feature space; "}<InlineMath>{"ZV_q\\in\\mathbb R^{m\\times q}"}</InlineMath>{" gives local tangent coordinates. A planar patch has near-zero residual after reconstruction; a curved patch has nonzero normal residual. This is a local approximation, not proof of a globally flat manifold."}</Prose>

<Prose>{"Our five-point surface is "}<InlineMath>{"(u,v,.1(u^2+v^2))"}</InlineMath>{". Four corners have height.2 and the center has height0. The mean height is .16, so the two-axis tangent reconstruction leaves corner residual.04 and center residual.16. Its singular values are 2,2,.178885. Because the two leading values tie, any orthonormal basis of that tangent plane is equally valid. Compare the plane's projector, not one axis sign or rotation."}</Prose>

<Prose>{""}<code>{"patch"}</code>{" requests "}<code>{"full_matrices=False"}</code>{", preserving only economy factors. If "}<InlineMath>{"m<D"}</InlineMath>{", a full-right-factor request would materialize a "}<InlineMath>{"D\\times D"}</InlineMath>{" completion even though only a few tangent columns are useful. Economy SVD work depends on shape, approximately "}<InlineMath>{"O(mD\\min(m,D))"}</InlineMath>{"; the full-right completion adds at least "}<InlineMath>{"\\Omega(D^2)"}</InlineMath>{" writes. Projection on "}<InlineMath>{"q"}</InlineMath>{" chosen axes costs "}<InlineMath>{"O(mDq)"}</InlineMath>{", not "}<InlineMath>{"O(mD^2)"}</InlineMath>{" unless projecting onto a full feature basis. This distinction matters for wide data."}</Prose>

<p className="manifold-source-role">Recorded deterministic source; deterministic main executed; ordinary fits source-only</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/programs/local_tangent_patch.py"} filename={"local_tangent_patch.py"} language="python" />

<p className="manifold-source-role">Recorded deterministic scratch/saved-array stream</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/outputs/local_tangent_patch.txt"} filename={"local_tangent_patch.txt"} language="output" />

<Prose>{""}<code>{"overlap"}</code>{" joins two patch coordinates by common source IDs, centers the shared records and finds an orthogonal alignment using the cross-product SVD. If overlap lacks independent directions, the alignment is underdetermined; singular values expose that boundary. Local tangent space alignment (LTSA) uses local tangent coordinates and globally aligns overlapping neighborhoods, rather than performing one isolated alignment. Hessian eigenmaps use second-order local structure; the stencil "}<InlineMath>{"(h(-1)-2h(0)+h(1))/1^2=.2"}</InlineMath>{" shows what curvature contributes for our quadratic height. Modified LLE uses multiple local weights to address particular local reconstruction degeneracies. These are related local alternatives with different global constructions, not aliases for standard LLE."}</Prose>

<Prose>{"For a runnable ordinary variant, supply the full300×64 feature matrix from the data loader and choose eight neighbors for requested dimension2. Hessian's necessary bound is "}<InlineMath>{"k>q(q+3)/2=5"}</InlineMath>{", while8 also exceeds2 for LTSA/modified routes. The five-point patch above is the scratch tangent example and is deliberately too small for that eight-neighbor ordinary call. No variant fit is executed to produce its patch stream."}</Prose>

<Prose>{"The ordinary "}<code>{"LocallyLinearEmbedding"}</code>{" variant call supplies method, neighborhood size, requested dimension and eigen solver. Hessian mode requires "}<InlineMath>{"k>q(q+3)/2"}</InlineMath>{" for its local polynomial basis; LTSA and modified routes also need enough neighbors and rank. These necessary conditions do not guarantee a well-conditioned sampled manifold. The full local patch mechanism is taught here; complete scratch clones of every variant's global optimizer are not claimed. Their original-paper proof coverage is distinguished in the references below."}</Prose>

<H3>{"Follow a walk, or preserve a hole"}</H3>

<ManifoldFigure id="D41" />

<Prose>{"A graph route finds the shortest way to one destination. A random walk distributes probability across possible next steps. On the three-node unit chain, the transition matrix "}<InlineMath>{"P_{walk}=D_g^{-1}A"}</InlineMath>{" sends A to B with probability 1, B to A/C with probability 1/2 each and C to B with probability 1. Starting at A, one step gives(0,1,0), then(.5,0,.5). No shortest-path distance table alone is this distribution."}</Prose>

<Prose>{"Diffusion coordinates weight walk eigenmodes by "}<InlineMath>{"\\lambda_l^t"}</InlineMath>{" at a chosen time "}<InlineMath>{"t"}</InlineMath>{". For an undirected positive-degree graph, the symmetric-normalized operator provides real modes that can be converted to right eigenvectors of the walk. The complete "}<code>{"diffusion_coordinates"}</code>{" function above removes stationary modes and ranks other modes by absolute eigenvalue. The chain has a−1 mode: without self loops the walk is periodic. A lazy transition "}<InlineMath>{"(I+P_{walk})/2"}</InlineMath>{" would remove that particular alternation, but it is a changed walk and must be named. The computational route here uses the exact tiny walk and a numerical eigensolver, rather than a scikit-learn diffusion-map estimator."}</Prose>

<ManifoldFigure id="D42" />

<Prose>{"Distances can also define a topological question. Put four distinct IDs at the corners of a unit square. A Vietoris–Rips complex at threshold "}<InlineMath>{"\\epsilon"}</InlineMath>{" includes edges for all pairs at distance at most "}<InlineMath>{"\\epsilon"}</InlineMath>{", and fills a simplex whenever all its pairwise edges are present. At1≤ε<√2 the four sides form an unfilled loop. At√2 the diagonals appear, the triangles and tetrahedron are filled, and that loop is gone. The drawing shows the faces, not just a cyclic wireframe."}</Prose>

<Prose>{"Project onto the first coordinate. Two pairs of distinct IDs now coincide and the corresponding square loop is lost. This is a constructed linear projection counterexample, not a measured t-SNE or UMAP result. Neighborhood retention, graph connectivity, geodesic distances, density and topology are different preservation questions. A single attractive map or scalar neighbor score does not answer them all. Persistent-homology software and full proofs belong to a topology treatment; this finite complex establishes the limitation without implying that we ran one."}</Prose>

<H2>{"10. Deeper branch: derive the force and distinguish sampled objectives"}</H2>

<ManifoldFigure id="D43" />

<Prose>{"Open the t-SNE objective's dependency graph. Input "}<InlineMath>{"P"}</InlineMath>{" stays fixed. Coordinates determine squared separations, Student kernels "}<InlineMath>{"t_{ij}"}</InlineMath>{", their ordered total "}<InlineMath>{"Z"}</InlineMath>{", then "}<InlineMath>{"Q_{ij}=t_{ij}/Z"}</InlineMath>{". Substituting into KL separates terms:"}</Prose>

<div className="neural-equation"><MathBlock>{"C=\\underbrace{\\sum P_{ij}\\log P_{ij}}_{\\text{constant}}\n-\\sum P_{ij}\\log t_{ij}+\\log Z,"}</MathBlock></div>

<Prose>{"because the ordered "}<InlineMath>{"P"}</InlineMath>{" total is 1. For one endpoint, differentiating both orientations of a pair doubles its contribution. Also "}<InlineMath>{"\\partial\\log t_{ij}/\\partial y_i=-2t_{ij}(y_i-y_j)"}</InlineMath>{". The attractive term becomes "}<InlineMath>{"4\\sum_jP_{ij}t_{ij}(y_i-y_j)"}</InlineMath>{". Differentiating "}<InlineMath>{"\\log Z"}</InlineMath>{" gives the repulsive "}<InlineMath>{"−4\\sum_jQ_{ij}t_{ij}(y_i-y_j)"}</InlineMath>{". Adding them yields the gradient in §5. The factor4 therefore comes from the squared-distance derivative and the two ordered orientations; it is not a tunable learning rate."}</Prose>

<Prose>{"Every pair's force on its two endpoints sums to zero, so the complete gradient has zero total over rows. Translating coordinates gives a null direction. A finite-difference probe of a coordinate should evaluate both perturbed costs with the same fixed "}<InlineMath>{"P"}</InlineMath>{", and compare against this gradient at the original state. Testing only a lower final loss would not isolate the derivative's sign or normalization. The derivative tests one local operation; the final cost answers a separate question about a complete trajectory."}</Prose>

<ManifoldFigure id="D44" />

<Prose>{"The complete small optimizer follows the four-point example to 200 updates. It searches each input row's beta for perplexity 2, symmetrizes the conditional matrix, computes all Student probabilities and KL, takes a gradient step of .5 and recenters. Its exact small scope makes each matrix inspectable. It allocates an "}<InlineMath>{"n\\times n\\times q"}</InlineMath>{" map-offset tensor, so it is a tiny fixture implementation; the larger graph/audit routes above show how row-wise and sparse representations avoid analogous feature-sized allocations. Do not apply this full pair programme to a100,000-row collection."}</Prose>

<p className="manifold-source-role">unchanged original programme; retained stream, not executed</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/programs/tiny_tsne.py"} filename={"tiny_tsne.py"} language="python" />

<p className="manifold-source-role">unchanged retained historical stream</p><RemoteCodeBlock source={"/learn-assets/t-sne-umap-private/outputs/retained-tiny_tsne.txt"} filename={"retained-tiny_tsne.txt"} language="output" />

<Prose>{"The retained initial KL .053522 becomes.018227 after 200 steps, with coordinates[−1.775811,−.759392,.422370,2.112833]. Cost decreased for that run; it is not a certificate of the global minimum. Its row solver has a bounded80-step tolerance search, while the new row file in §4 reports tie and limit status more explicitly. Keep the original source and its output paired. A modified solver, momentum term or initialization is a new experiment with its own result, not a replacement provenance for the old stream."}</Prose>

<ManifoldFigure id="D45" />

<Prose>{"There is a useful connection to contrastive learning. An edge-sampling experiment can ask a classifier to distinguish selected neighbor pairs from pairs drawn from a noise distribution. With a declared positive/negative ratio, noise law and score normalization, its optimum and expected updates can be derived. Noise-contrastive and normalized contrastive formulations make different choices about which pairs share a denominator. The drawing keeps positive pairs, sampled negative pairs, a score and the normalization set as distinct objects."}</Prose>

<Prose>{"One declared calculation separates these choices. Query A at 0 has candidates B1 and C3, with Student scores .5 and .1. Normalizing over these two candidates gives B probability "}<InlineMath>{"5/6"}</InlineMath>{" and negative log score "}<InlineMath>{"\\log(6/5)\\approx.182322"}</InlineMath>{"; adding a candidate changes that denominator. For a separate binary neighbor-versus-noise experiment, declare positive probabilities(A,B,C)=(0,5/6,1/6), noise probabilities(.25,.25,.5) and equal prior chances of a positive or noise event. Observing pair A/B then gives positive-class posterior "}<InlineMath>{"(5/6)/(5/6+.25)=10/13"}</InlineMath>{" and loss "}<InlineMath>{"\\log(13/10)\\approx.262364"}</InlineMath>{". Noise-contrastive estimation fits a model against an explicit noise law; normalized contrastive objectives such as InfoNCE compare a selected positive against a stated candidate set. The two computations need their own normalizer/noise law; neither number is asserted to be the ordinary UMAP trainer's loss."}</Prose>

<Prose>{"The finite "}<code>{"sampled_pair_events.py"}</code>{" example from §6 exposes why the convention matters: the expected positive displacement is frequency-weighted, and head-only negatives are asymmetric. Research can derive a scalar surrogate under a specified symmetric convention; that does not make every asymmetric implementation field an exact gradient of that surrogate. The "}<a href={"https://arxiv.org/abs/2007.08902"}>{"attraction–repulsion analysis"}</a>{" compares regimes of neighbor embeddings, while "}<a href={"https://arxiv.org/abs/2206.01816"}>{"contrastive neighbor embeddings"}</a>{" studies objectives with explicit normalization choices. These links help explain implementation behavior. They do not establish an unconditional identity “UMAP equals t-SNE,” or transfer a performance claim to our digit collection without an experiment."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">
<H2>{"11. Practice: calculate, diagnose and transfer"}</H2>

<Prose>{"Try a changed case before reading its hint and solution. Every answer states the relationship being preserved; a visually pleasing layout is not the success criterion."}</Prose>

<H3>{"1. A sparsely sampled sensor corridor"}</H3>

<Prose>{"Points are(0,0),(0,2),(1,2),(2,2),(2,0). Build radius graphs at 1,2 and√5. What is the endpoint route, and does increasing radius recover the intended corridor?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"inspect the direct endpoint chord before tracing the top of the corridor."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"at 1 the two endpoints are isolated from the top, so no endpoint route exists. At2 the endpoints are connected directly with length 2; that edge remains at√5. No route can be shorter than the Euclidean endpoint distance 2, so2 is the shortest length at both larger radii. Sparse sampling failed to encode the intended corridor; increasing radius supplied a shortcut rather than proof of the physical route. Success means drawing the actual edges and distinguishing their graph from the intended surface."}</Prose>

</details>

<H3>{"2. Merge two events before measuring effective count"}</H3>

<Prose>{"Compute perplexity for probabilities(1/2,1/4,1/8,1/8), then merge the last two events."}</Prose>

<details><summary>Hint</summary>

<Prose>{"add the probabilities before computing the merged event's logarithm."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"entropy is "}<InlineMath>{"1/2+1/2+3/8+3/8=1.75"}</InlineMath>{" bits and perplexity "}<InlineMath>{"2^{1.75}\\approx3.363586"}</InlineMath>{". Merging gives(1/2,1/4,1/4), entropy 1.5 bits and perplexity√8≈2.828427. An effective count belongs to an actual event space; it is not preserved by merging distinct events."}</Prose>

</details>

<H3>{"3. Repair a misleading map report"}</H3>

<Prose>{"A report says “six of eight neighbors survived, so trustworthiness is 99%.” Correct the statement and say what is missing."}</Prose>

<details><summary>Hint</summary>

<Prose>{"retained fraction and intrusion rank penalty use different information."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"six of eight gives a local retained fraction.75. It does not calculate "}<InlineMath>{"T_k"}</InlineMath>{". To calculate trustworthiness you need "}<InlineMath>{"n,k"}</InlineMath>{", each introduced neighbor's input rank and the stated tie convention, then the normalization. A collection average also leaves the distribution of local failures open. Show a poor local query alongside the average before making a practical claim."}</Prose>

</details>

<H3>{"4. Change a fuzzy edge"}</H3>

<Prose>{"Two directed memberships are .2 and.6. Compute their union and the isolated "}<InlineMath>{"a=b=1"}</InlineMath>{" pair optimum. Repeat after changing.6 to .9."}</Prose>

<details><summary>Hint</summary>

<Prose>{"first combine memberships, then solve "}<InlineMath>{"1/(1+r^2)=w"}</InlineMath>{"."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"unions are .2+.6−.12=.68 and.2+.9−.18=.92. Radii are√(8/17)≈.685994 and√(2/23)≈.294884. Stronger membership prefers a shorter isolated pair. These are ideal isolated optima, not coordinates from the ordinary sampled optimizer, where endpoints participate in many pairs."}</Prose>

</details>

<H3>{"5. Compare global distances with a local recipe"}</H3>

<Prose>{"Input line positions are 0,3,7. Recover centered MDS coordinates. Find the middle point's affine weights and place it when the two neighbors move to −2 and12."}</Prose>

<details><summary>Hint</summary>

<Prose>{"the middle coordinate is determined by sum1 and the input reconstruction."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"the mean is 10/3, giving centered[−10/3,−1/3,11/3] up to reflection. Weights are 4/7 and3/7 because "}<InlineMath>{"7(3/7)=3"}</InlineMath>{". The mapped middle is "}<InlineMath>{"−2(4/7)+12(3/7)=4"}</InlineMath>{". On this exact line the descriptions agree; globally preserving all distances and preserving local recipes remain different objectives."}</Prose>

</details>

<H3>{"6. Repair future-data evaluation"}</H3>

<Prose>{"A pipeline fits one scaler and UMAP on training rows, another scaler and UMAP on validation rows, then sends validation coordinates to the training classifier. Repair it."}</Prose>

<details><summary>Hint</summary>

<Prose>{"identify which fitted state defines the classifier's coordinate system."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"fit preprocessing and reducer on training rows only. Apply those fitted objects to validation rows, then evaluate the classifier fitted on the training representation. Two independent maps are not aligned merely by using the same seed. Compare raw-feature and PCA baselines. Choose settings on validation and reserve a final untouched test if a final generalization claim is needed."}</Prose>

</details>

<H3>{"7. Inspect an actual local reversal"}</H3>

<Prose>{"For source30 and "}<InlineMath>{"k=10"}</InlineMath>{", compare the printed input list with PCA and t-SNE30 lists. Calculate common, missing and introduced IDs, then repeat on another style of digit as an independent project."}</Prose>

<details><summary>Hint</summary>

<Prose>{"use source-ID set differences, not class-label overlap."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"PCA common{0,79,166,229,266,276}; missing{36,140,160,178}; new{78,130,132,306}. t-SNE common{0,166,229,266,276}; missing{36,79,140,160,178}; new{10,48,130,256,286}. Fractions are .6 and.5, reversing the global .376333/.770333 ranking. For the independent continuation, choose another existing source ID, two saved settings and "}<InlineMath>{"k\\in\\{5,10,20\\}"}</InlineMath>{", print both sets and inspect actual images. Success means an ID-joined explanation of changed neighbors under the unchanged pixel metric, including a local case that agrees with or contradicts the global order. A label-coloured plot alone is insufficient."}</Prose>

</details>

<H3>{"8. Modify the UMAP graph reference"}</H3>

<Prose>{"In the six-point graph source, change "}<InlineMath>{"k=4"}</InlineMath>{" to 3, then restore4. Predict which quantities must be recalculated. Separately multiply every input coordinate by 5. What stays unchanged, and what does learning rate 0 do?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"separate support/target changes from common distance-scale changes."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"changing "}<InlineMath>{"k"}</InlineMath>{" changes selected support and target "}<InlineMath>{"\\log_2k"}</InlineMath>{", so rerun neighbor selection and scale calibration; a previously printed k4 graph is not a numeric answer for k3. Common scaling by 5 multiplies distances, rho, sigma and the distance-scale floor by 5, preserving memberships/union within search and floating-point tolerance when the same neighbors/ties remain. Given the same graph, map coordinates and negative IDs, the sampled update is unchanged; rate 0 preserves every coordinate. Verify with a newly modified programme when practising, retaining its own output rather than replacing the k4 stream."}</Prose>

</details>

<H3>{"9. Whitening can switch a neighbor"}</H3>

<Prose>{"Query is the origin; PCA score vectors B=(2,0), C=(0,1), with retained eigenvalues(9,1). Which is closer before and after whitening?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"squared whitened distance is "}<InlineMath>{"\\sum_a\\Delta z_a^2/\\lambda_a"}</InlineMath>{"."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"ordinary distances 2 and1 choose C. Whitened distances 2/3 and1 choose B. Whitening is feature-dependent scaling, unlike common division by 16. Positive retained eigenvalues are required; dividing by a zero mode is not meaningful."}</Prose>

</details>

<H3>{"10. Diagnose a bandwidth target"}</H3>

<Prose>{"Distances are(1,1,3) and target perplexity 1.5. Is a positive finite width available?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"take the narrow-width limit while preserving the tie."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"the two nearest candidates share mass1/2 each, so the lower limiting perplexity is 2. The upper limit is 3. Target1.5 is infeasible. Return a domain message while preserving a last valid view; do not label an iteration limit a converged bandwidth."}</Prose>

</details>

<H3>{"11. An unmoved pair has a changed probability"}</H3>

<Prose>{"Change map(0,1,3) to(0,1,2). Calculate the AB kernel, ordered total and probability in each state."}</Prose>

<details><summary>Hint</summary>

<Prose>{"include AC/CA and BC/CB in the denominator."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"AB kernel remains.5. Ordered totals are 1.6 and2.4, so probabilities are 5/16 and5/24. Normalization creates competition through all pairs, not just the selected pair."}</Prose>

</details>

<H3>{"12. Catch a double-weighted event"}</H3>

<Prose>{"An edge of weight.25 occurs once per four elementary slots. Its per-event displacement is "}<InlineMath>{"\\delta"}</InlineMath>{". What expectation results from multiplying each event by .25 again?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"frequency already supplies one factor.25."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"correct positive expectation is "}<InlineMath>{"\\delta/4"}</InlineMath>{"; extra event weighting makes "}<InlineMath>{"\\delta/16"}</InlineMath>{". The finite schedule is declared, not a universal ordinary UMAP frequency. To transfer the fix, locate whether an edge weight controls event timing, event magnitude or both in the actual implementation before changing it."}</Prose>

</details>

<H3>{"13. Test whether a distance table is Euclidean"}</H3>

<Prose>{"AB1, BC1, AC3 define a symmetric zero-diagonal table. Can classical MDS realize it exactly?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"inspect a triangle inequality before an eigensolver."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"3>1+1, so no Euclidean realization exists. The centered Gram spectrum4.5,0,−5/6 confirms a negative direction. Clipping it gives approximate coordinates with changed distances; it is not a repair that makes the original table exact."}</Prose>

</details>

<H3>{"14. Use a negative recipe deliberately"}</H3>

<Prose>{"Query4 has neighbors0 and3. Move those neighbors to −2 and7. Find weights and the query's new coordinate."}</Prose>

<details><summary>Hint</summary>

<Prose>{"do not clip an affine coefficient just because it is negative."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"weights−1/3 and4/3 sum1 and reconstruct4. The map coordinate is "}<InlineMath>{"−2(−1/3)+7(4/3)=10"}</InlineMath>{". It extrapolates beyond7. Clipping and renormalizing would place it somewhere else and change the objective; common translation preserves the original recipe."}</Prose>

</details>

<H3>{"15. Count energy and null directions"}</H3>

<Prose>{"For the unit chain and coordinates(0,1,3), compute unordered and ordered edge energy. Add a separate two-node component: how many constant null modes remain?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"the quadratic includes a half of the ordered sum."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"unordered energy1+4=5=yᵀLy; ordered sum10. Two components give two linearly independent component-constant null modes. Removing only one zero eigenvector leaves an arbitrary relative component direction."}</Prose>

</details>

<H3>{"16. Follow two diffusion steps"}</H3>

<Prose>{"Start at A on the unit chain A–B–C with no self loops. Compute one-step and two-step probability distributions."}</Prose>

<details><summary>Hint</summary>

<Prose>{"B splits its outgoing probability equally."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"one step(0,1,0), two steps(.5,0,.5). The walk alternates parity and is periodic. Shortest paths do not directly give this distribution; adding a lazy self-loop changes the transition and should be stated."}</Prose>

</details>

<H3>{"17. Explain a density radius and an API boundary"}</H3>

<Prose>{"Weights(1,.5) connect neighbors at distances(1,3). Calculate weighted squared radius, then double the distances. Does densMAP returning training coordinates establish new-row transform support?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"separate a log-scale calculation from cached fitted state."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"radius squared is(1+4.5)/1.5=11/3; doubled distances give44/3. The log change isln4 apart from the epsilon. It describes graph-weighted local scale, not a calibrated global density. Returning cached training coordinates is a different branch from placing a new row; the inspected implementation refuses the latter for densMAP."}</Prose>

</details>

<H3>{"18. Preserve faces, not just a wireframe"}</H3>

<Prose>{"Draw the unit square's Rips complex below1, from 1 to√2 and at√2. Then project all vertices onto their first coordinate."}</Prose>

<details><summary>Hint</summary>

<Prose>{"when all triangle edges appear, include the filled triangle."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"below1 there are isolated corners; for 1≤ε<√2 the sides give one unfilled loop; at√2 filled triangles and the tetrahedron eliminate it. The projection creates duplicate coordinate pairs and loses that square loop. Preserve the distinct IDs in the drawing. This is a constructed projection example, not an empirical t-SNE result."}</Prose>

</details>

<H3>{"19. Price the next allocation"}</H3>

<Prose>{"How much storage does one100,000×100,000 float64 matrix need? Does a sparse neighbor graph eliminate that cost from every later method?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"count entries before looking at an algorithm's name."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{""}<InlineMath>{"10^{10}\\cdot8=80\\times10^9"}</InlineMath>{" bytes, or80 GB decimal, before additional arrays. Sparse adjacency costs roughly "}<InlineMath>{"O(nk)"}</InlineMath>{", but an all-pairs route matrix or dense global eigen matrix can still be "}<InlineMath>{"O(n^2)"}</InlineMath>{". A row-wise exact audit uses "}<InlineMath>{"O(n)"}</InlineMath>{" working distances while keeping the input/output records. Choose the representation at each operation."}</Prose>

</details>


</section>
<H2>{"12. Further learning and technical references"}</H2>

<Prose>{"Use these resources for specific next questions. The lesson's implemented finite mechanisms, retained runs and source-only API branches have different evidence roles; a link to a paper is not a claim that all of its proofs or figures were consumed."}</Prose>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="further-learning"><Prose>{"For intuition, "}<a href={"https://distill.pub/2016/misread-tsne/"}>{"How to Use t-SNE Effectively"}</a>{" walks through changed perplexities and interpretations of area, gaps and cluster sizes. Recreate its questions with the saved digit maps before generalizing the pictures. The "}<a href={"https://scikit-learn.org/stable/modules/manifold.html"}>{"scikit-learn manifold guide"}</a>{" compares the global-distance, local-reconstruction and graph routes and explains estimator parameters. Its currently inspected1.9.1 API differs from older tutorials, especially for MDS."}</Prose></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="references"><Prose>{"For the t-SNE derivation, "}<a href={"https://jmlr.org/papers/volume9/vandermaaten08a/vandermaaten08a.pdf"}>{"van der Maaten and Hinton,2008"}</a>{" supplies Gaussian affinities, crowding, symmetrization and the gradient; those selected parts and AppendixA support §§4–5/10. The "}<a href={"https://lvdmaaten.github.io/publications/papers/TR_Dimensionality_Reduction_Review_2009.pdf"}>{"van der Maaten, Postma and van den Herik comparison"}</a>{" provides a broad canonical treatment of PCA, MDS, Isomap, LLE and local variants; the selected algorithm sections support the object comparison and alternatives here. It is not a license to compare unreported benchmark results as if they were ours."}</Prose></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="references"><Prose>{"For UMAP, "}<a href={"https://arxiv.org/abs/1802.03426"}>{"McInnes, Healy and Melville"}</a>{" introduces the finite neighborhood construction and layout procedure. The selected finite-graph and algorithm sections support the mechanism taught here; the full categorical and topological proofs are not reconstructed. The "}<a href={"https://umap-learn.readthedocs.io/en/latest/basic_usage.html"}>{"creator's basic-use guide"}</a>{" and "}<a href={"https://umap-learn.readthedocs.io/en/latest/transform.html"}>{"transform guide"}</a>{" explain ordinary workflows. Their documentation header is 0.5.8, while the retained teaching runs use0.5.12; match installed source when reproducing an internal comparison."}</Prose></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="references"><Prose>{"For sampling, "}<a href={"https://arxiv.org/abs/2103.14608"}>{"Damrich and Hamprecht,2021"}</a>{" distinguishes UMAP's implemented expected updates from a literal all-pair reading of its advertised loss. "}<a href={"https://arxiv.org/abs/2007.08902"}>{"Böhm, Berens and Kobak"}</a>{" studies an attraction–repulsion spectrum; "}<a href={"https://arxiv.org/abs/2206.01816"}>{"Damrich and colleagues"}</a>{" develops contrastive neighbor objectives with explicit normalization. The selected sections motivate our finite event reasoning, not universal algorithm equivalence or new empirical claims."}</Prose></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="references"><Prose>{"For local alternatives, "}<a href={"https://cs.nyu.edu/~roweis/lle/papers/lleintro.pdf"}>{"Saul and Roweis's LLE introduction"}</a>{" explains local recipes and the constrained eigenproblem. Some extracted mathematical glyphs in the retrieved document were garbled; equations here are verified through the finite construction and canonical treatment rather than copied from malformed text. Isomap's original Science article and several original Laplacian/Hessian/LTSA proofs were identified but not fully accessed in this source scope. Their mechanisms here rely on the actually read canonical comparison and official APIs, without claiming original-proof consumption."}</Prose></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="references"><Prose>{"For extensions, the "}<a href={"https://github.com/hhcho/densmap"}>{"densMAP creator project"}</a>{" identifies the density-preserving aim. Complete original-paper access failed in the retained research scope; this lesson confines its supported teaching to local radii, implementation/API branches and labelled extension intent. It makes no biological validation claim. The "}<a href={"https://opentsne.readthedocs.io/en/stable/examples/02_advanced_usage/02_advanced_usage.html"}>{"openTSNE reference-placement guide"}</a>{" explains a fixed-reference extension distinct from scikit-learn's "}<code>{"TSNE"}</code>{"; the optional source route needs a matching package before an execution claim. "}<a href={"https://arxiv.org/abs/2009.12981"}>{"Parametric UMAP"}</a>{" motivates the encoder distinction, with neural training routed to the deep learning module."}</Prose></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="further-learning"><Prose>{"For books, the official "}<a href={"https://hastie.su.domains/ElemStatLearn/"}>{"Elements of Statistical Learning page"}</a>{" offers a broader statistical context and the publisher's "}<a href={"https://www.microsoft.com/en-us/research/publication/pattern-recognition-machine-learning/"}>{"Pattern Recognition and Machine Learning page"}</a>{" identifies Bishop's text. Book PDF access was not established here, so these are annotated further-learning recommendations rather than sources for unread page-specific claims. No video is required for this route. Previously discovered video metadata is retained in the research history; it is not promoted here as a technically checked explanation or a viewing claim."}</Prose></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next">
<H2>{"13. What you can now do, and what question comes next"}</H2>

<Prose>{"You can follow one observation through an image vector and a coordinate map, explain why its neighbors changed, calculate effective Gaussian neighborhoods and symmetric "}<InlineMath>{"P"}</InlineMath>{", derive the Student force and trace a bounded update. You can also construct UMAP's local graph, distinguish memberships from probabilities and affine weights, and explain why scheduling and asymmetric negative events matter. Use the saved-array audit to replace a general impression with an ID-joined local and collection comparison."}</Prose>

<Prose>{"For implementation practice, run a deterministic file, alter a declared small fixture and inspect the intermediate object before interpreting the final coordinates. The common file index lists every complete programme, data file and recorded stream. Use the setup guide to choose the dependencies and distinguish a recorded result from a new fitting experiment; retain the modified source and settings with your new results."}</Prose>

<Prose>{"The next topic, "}<a href={"/learn/path/full-curriculum/independent-component-analysis-ica?module=classical-ml"}>{"Independent Component Analysis"}</a>{", asks another reduction question: can observed mixtures be separated into statistically independent sources? A map that preserves neighbors does not answer it. Bring centering, linear transformations and the habit of naming the target relationship; ICA will add its own assumptions and objective."}</Prose>
</section>

<section className="manifold-setup"><h3 id="setup-and-complete-files">{"Setup and complete files"}</h3>

<Prose>{"Use the supplied files to inspect a fixed collection offline, then change a small constructed mechanism deliberately. The real data are300 selected UCI optical-digit observations, each with a source ID, recorded label and64 block-count features. Labels selected the first30 records per class; labels were not fitted inputs to the saved unsupervised maps. Keep the supplied provenance and CSV/JSON pair together."}</Prose>

<Prose>{"Download all fifteen scripts and the five supporting data files listed in the file index. Put the scripts together in one working "}<code>{"programs"}</code>{" directory: "}<code>{"isomap_routes.py"}</code>{" imports "}<code>{"classical_geometry.py"}</code>{". The full source is also visible beside its teaching; use the file index to find each complete payload. An output file records an execution; copying it does not run its program."}</Prose>

<CodeBlock language={"text"}>{"manifold-learning/\n  programs/             all fifteen .py files\n  data/\n    digits-300.csv\n    calculated-inputs.json\n    umap-digits.csv\n    data-provenance.md\n    runtime-versions.json\n  outputs/              ten deterministic and five retained streams"}</CodeBlock>

<Prose>{"The recorded deterministic examples were executed under Python3.12.14,NumPy2.3.5,SciPy1.18.1. The Gaussian solver now returns its last evaluated beta when its iteration budget is exhausted and rejects nonpositive budgets. Its corrected callables have separate bounded checks; the displayed historical main stream remains attached to its preceding source. The retained environment also records scikit-learn1.9.1,umap-learn.5.12,numba.67.0 and related versions. These are attributed snapshots, not a promise of bitwise output on every platform. Use a separate virtual environment for reproduction; the minimum scratch routes need NumPy/SciPy. The MDS ordinary code specifically uses the inspected1.9.1 API. Optional openTSNE source was checked against its1.0.0 documentation; no matched installed openTSNE execution is claimed."}</Prose>

<CodeBlock language={"sh"}>{"python -m venv .venv\n# Activate .venv using the command appropriate to your shell.\npython -m pip install numpy==2.3.5 scipy==1.18.1\npython programs/gaussian_rows.py\npython programs/classical_geometry.py\npython programs/isomap_routes.py\npython programs/lle_recipes.py\npython programs/graph_spectrum.py\npython programs/local_tangent_patch.py\npython programs/sampled_pair_events.py\npython programs/local_density_radius.py\npython programs/reference_map_routes.py\npython programs/audit_saved_neighbors.py --assets data"}</CodeBlock>

<Prose>{"These ten main blocks run deterministic constructed/saved-array work. None fits a new t-SNE/UMAP digit map or calls the source-only ordinary fitting functions. "}<code>{"local_density_radius.py"}</code>{" prints two local radii; it does not call densMAP. "}<code>{"reference_map_routes.py"}</code>{" prints one interpolation; it does not fit its ordinary, supervised or openTSNE routes. "}<code>{"classical_geometry.py"}</code>{" executes scratch classical/metric calculations; its callable ordinary function is source-only here."}</Prose>

<Prose>{"For an intentional ordinary experiment, install the appropriate declared packages in that environment:"}</Prose>

<CodeBlock language={"sh"}>{"python -m pip install scikit-learn==1.9.1 umap-learn==0.5.12\n# Only for the optional reference-embedding branch:\npython -m pip install openTSNE==1.0.0"}</CodeBlock>

<Prose>{"No installation or fit was performed by this content handoff. Read the corresponding function and call it explicitly on your chosen input. For example:"}</Prose>

<CodeBlock language={"python"}>{"from programs.reference_map_routes import ordinary_pipeline\ntrain_ids, valid_ids, fitted_reducers, results = ordinary_pipeline(\"data/digits-300.csv\")\nfor name, result in results.items():\n    print(name, result[\"correct\"], result[\"denominator\"])"}</CodeBlock>

<Prose>{"This is a new experiment if you run it; its counts may differ from retained streams. It uses the train-only split/state contract and returns actual predictions. The optional openTSNE function returns reference and placed coordinates, while the supervised UMAP function uses training labels explicitly. Neither inherits the retained unsupervised map's outputs. Pinning package names alone does not establish identical threads, numerical libraries or hardware."}</Prose>

<Prose>{"The five preserved scripts are full original programs, with the original result streams beside them. "}<code>{"inspect_digits.py"}</code>{" and "}<code>{"inspect_umap.py"}</code>{" fit maps and write coordinate CSVs; "}<code>{"compare_transforms.py"}</code>{" fits the train-only comparison; "}<code>{"tiny_tsne.py"}</code>{" executes200 small updates; "}<code>{"umap-mechanism.py"}</code>{" compares internals and runs a small ordinary fit. If deliberately reproducing or modifying them, copy the measurement CSV into a separate experiment working directory and run there so generated outputs cannot be confused with saved reference data. Do not replace a retained coordinate/stream file with a fresh run that happens to share its filename."}</Prose>

<NeuralTable caption={"Setup and complete files"} headers={[<>{"Complete file"}</>,<>{"What to inspect or change"}</>,<>{"Result role"}</>]} rows={[[<>{""}<code>{"audit_saved_neighbors.py"}</code>{""}</>,<>{"ID join, row-wise distances, self exclusion, rank penalties, changed source/k"}</>,<>{"Recorded saved-array audit; no fit"}</>],[<>{""}<code>{"gaussian_rows.py"}</code>{""}</>,<>{"Shifted weights, entropy targets, nearest ties and consistent last-evaluated iteration-limit status"}</>,<>{"Corrected callable checks; the recorded main stream belongs to the exact preceding source"}</>],[<>{""}<code>{"classical_geometry.py"}</code>{""}</>,<>{"Double centering, eigenmodes, metric majorization and shared start"}</>,<>{"Executed scratch predecessor, unchanged numeric body; completed ordinary nonmetric return is source-only"}</>],[<>{""}<code>{"isomap_routes.py"}</code>{""}</>,<>{"Radius/union graph, relaxation, infinity and finite embedding"}</>,<>{"Recorded U-chain routes; ordinary estimator source-only"}</>],[<>{""}<code>{"lle_recipes.py"}</code>{""}</>,<>{"Offset Gram, ridge, affine weights, centered eigenproblem"}</>,<>{"Recorded curved five-point recipe example"}</>],[<>{""}<code>{"graph_spectrum.py"}</code>{""}</>,<>{"Degrees, three Laplacians, random walk and diffusion modes"}</>,<>{"Recorded chain energy/walk; ordinary spectral call source-only"}</>],[<>{""}<code>{"local_tangent_patch.py"}</code>{""}</>,<>{"Thin SVD, shared-ID alignment, curvature stencil"}</>,<>{"Recorded five-point patch; global variants source-only"}</>],[<>{""}<code>{"sampled_pair_events.py"}</code>{""}</>,<>{"Positive/negative endpoints, explicit frequencies/noise law"}</>,<>{"Recorded finite expected-event enumeration"}</>],[<>{""}<code>{"local_density_radius.py"}</code>{""}</>,<>{"Weight×distance² products, log radius and densMAP call"}</>,<>{"Executed radius only; density optimizer source-only"}</>],[<>{""}<code>{"reference_map_routes.py"}</code>{""}</>,<>{"Fixed-state interpolation, ID split and future-data routes"}</>,<>{"Executed interpolation only; all fits/extensions source-only"}</>],[<>{""}<code>{"inspect_digits.py"}</code>{""}</>,<>{"Ordinary PCA/t-SNE fixed-collection settings and audits"}</>,<>{"Preserved full original program/stream; not rerun"}</>],[<>{""}<code>{"inspect_umap.py"}</code>{""}</>,<>{"Ordinary graph/layout settings and coordinate export"}</>,<>{"Preserved full original program/stream; not rerun"}</>],[<>{""}<code>{"compare_transforms.py"}</code>{""}</>,<>{"225/75 split, fixed transform and KNN baseline"}</>,<>{"Preserved73/75 versus71/75 result; not rerun"}</>],[<>{""}<code>{"tiny_tsne.py"}</code>{""}</>,<>{"Entire tiny exact optimizer and fixed-P gradient"}</>,<>{"Preserved200-step trajectory endpoints; not rerun"}</>],[<>{""}<code>{"umap-mechanism.py"}</code>{""}</>,<>{"Six-row graph, ideal pair gradient and supplied sampled step"}</>,<>{"Preserved version-bound internal comparison; not rerun"}</>]]} />

<Prose>{""}<code>{"digits-300.csv"}</code>{" contains integer source IDs,labels and raw0–16 cells. "}<code>{"calculated-inputs.json"}</code>{" binds its hash, the same300 IDs, all ten full-precision coordinate arrays and all90 historical R/T/C values. "}<code>{"umap-digits.csv"}</code>{" is the retained coordinate export. "}<code>{"runtime-versions.json"}</code>{" and "}<code>{"data-provenance.md"}</code>{" retain execution/source context. "}<code>{"file-index.json"}</code>{" gives each exact path, byte count, hash and display role, including the fifteen full streams. Historical and new rank conventions remain separate. Never reconstruct distances from a rounded picture."}</Prose></section>
</div>; }
export default { title: 't-SNE, UMAP & Manifold Learning', readTime: '~100 min read + 120 min practice', content: ManifoldLesson };
