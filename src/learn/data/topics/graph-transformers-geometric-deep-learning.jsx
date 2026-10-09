// Source-reviewed Graph Transformers reading flow; programs load near their views.
import React from "react";
import {Prose,H2,H3,CodeBlock} from "../../components/content/index.js";
import {Math as InlineMath,MathBlock} from "../../components/content/Math.jsx";
import {LessonIntro} from "../../components/lesson-labs/LessonElements.jsx";
import {NeuralTable} from "../../components/lesson-labs/NeuralLessonElements.jsx";
import RemoteCodeBlock from "../../components/content/RemoteCodeBlock.jsx";
import {IdentityProvider,NeuronView,SharedLayerView,LayoutView,RelabelView,PhysicalInputView} from "../../components/lesson-labs/graph-transformers/GraphFlowIdentity.jsx";
import {ReadProvider,ProjectionView,StructuralRowView,DonorProductsView,PreferenceView,PermissionView,GraphormerInjectionView,ParallelRoutesView,EqualReadView} from "../../components/lesson-labs/graph-transformers/GraphFlowAttention.jsx";
import {WalkProvider,SpectrumProvider,SquareProvider,WalkReturnView,WalkEditView,WalkIsolateView,WalkProductsView,EigenPatternView,BasisView,ProjectorView,TruncatedView,SquareSitesView,SquareRoutesView,SquareProofView,SquareAverageView} from "../../components/lesson-labs/graph-transformers/GraphFlowStructure.jsx";
import {PhysicalProvider,UpdateProvider,ComponentsView,PhysicalTypeView,TranslationView,GateView,GeometricAnatomyView,DirectionView,StepRuleView,GeometricContractView,GeometricApplyView} from "../../components/lesson-labs/graph-transformers/GraphFlowGeometry.jsx";
import {StudyProvider,StudyAnatomyView,RecordedView,FittedInputView,FittedTopologyView,FittedReceiverView,FittedHeadView,FittedDonorView,FittedMatricesView,SupportingFiles} from "../../components/lesson-labs/graph-transformers/GraphFlowStudy.jsx";
import {GPSProvider,ChiralityProvider,ForceProvider,TensorProvider,TypedProvider,FrameProvider,BudgetProvider,GPSPackingView,GPSBoundaryView,GPSResidualView,ChiralityView,EnergyView,DifferenceView,TensorView,TypedScoreView,TypedValueView,TypedEdgeFilterView,FramePointsView,FrameMotionView,FieldView,PairBudgetView,PaddingBudgetView} from "../../components/lesson-labs/graph-transformers/GraphFlowApplications.jsx";
import "../../components/lesson-labs/lesson-flow.css";
import "../../components/lesson-labs/graph-transformers/graph-transformers-reading-flow.css";
function Program({file}){return <RemoteCodeBlock source={"/learn-code/graph-transformers-geometric-deep-learning/"+file} filename={file} language="python"/>;}
export const sections=[["1-three-things-a-graph-drawing-can-conceal","1. Three things a graph drawing can conceal"],["2-give-an-attention-read-structural-information","2. Give an attention read structural information"],["3-structural-encodings-are-measurements-of-a-graph","3. Structural encodings are measurements of a graph"],["4-more-global-access-has-limits","4. More global access has limits"],["5-state-the-symmetry-contract-before-choosing-a-network","5. State the symmetry contract before choosing a network"],["6-move-from-node-permutations-to-physical-rotations","6. Move from node permutations to physical rotations"],["7-build-an-equivariant-coordinate-update","7. Build an equivariant coordinate update"],["8-run-a-complete-experiment-with-real-graph-data","8. Run a complete experiment with real graph data"],["9-deeper-choose-outputs-that-match-geometry-and-physics","9. Deeper: choose outputs that match geometry and physics"],["10-applications-and-engineering-decisions","10. Applications and engineering decisions"],["11-practice-with-new-inputs","11. Practice with new inputs"],["further-learning","Further learning"],["technical-references","Technical references"],["readiness-and-next-study","Readiness and next study"]];
export default {title:"Graph Transformers & Geometric Deep Learning",readTime:"~120 min read + investigations, programs and practice",hasIntegratedGuide:true,content:()=> <div className="lesson-flow neural-lesson neural-lesson-neutral graph-reading-flow"><IdentityProvider><ReadProvider><WalkProvider><SpectrumProvider><SquareProvider><PhysicalProvider><UpdateProvider><StudyProvider><GPSProvider><ChiralityProvider><ForceProvider><TensorProvider><TypedProvider><FrameProvider><BudgetProvider><LessonIntro prerequisites="Weighted sums, a shared neural layer and receiver-row graph message passing; spatial actions are defined here.">Trace a graph-wide read, then choose the physical action an output must follow.</LessonIntro>
<Prose opening="exploration">{""}<strong>{"Explore as you read."}</strong>{" Change a graph connection and follow its effect on a global read. Then rotate a sensor array or a set of points and compare the two routes through the same rule. Edit the inputs to find what changes, what stays fixed, and which transformation belongs to the output."}</Prose>

<Prose>{"A molecular diagram tells you which atoms are bonded. A set of three-dimensional coordinates tells you where the atoms are. These are different kinds of information. Two conformations can have the same bonds and different shapes; rotating the entire molecule changes its coordinates without changing those internal distances."}</Prose>

<Prose>{"This lesson asks two connected questions: "}<strong>{"How can a node consult distant parts of a graph while retaining information about its structure? How should predictions change when we relabel nodes or transform physical coordinates?"}</strong>{" Graph transformers address the first. Geometric deep learning provides a framework for the second, including architectures that satisfy the required transformation rule by construction."}</Prose>

<Prose>{"In the previous "}<a href={"/learn/path/full-curriculum/message-passing-graph-convolutions-gcn-gat-graphsage?module=deep-learning-fundamentals"}>{"message-passing lesson"}</a>{", information traveled along local edges. Keep that mechanism: global attention is another information route, and geometric constraints can apply to either route. Neither attention nor symmetry alone guarantees that a model makes accurate predictions."}</Prose>

<Prose opening="route">{""}<strong>{"First pass:"}</strong>{" §§1–8 trace graph-wide information, graph measurements, transformation rules and the complete real-data comparison. In §3 follow the four-cycle projector; its general basis discussion is deeper. Attempt practice 1–5. Sections 9–10 and practice 6–8 extend physical outputs, tensor types and engineering; new practice 9–11 transfers typed products, frames and batching. Weighted sums, a shared learned layer and receiver-row message passing are prerequisites. The "}<a href={"/learn/path/full-curriculum/abstract-algebra-groups-symmetry-actions?module=math-foundations"}>{"groups and symmetry actions lesson"}</a>{" supplies the finite-action algebra; each spatial action is defined here. Pictures come first: follow their values, then connect them to notation and code."}</Prose>

<H2>{"1. Three things a graph drawing can conceal"}</H2>

<Prose>{"A distant read is still a neural operation on numerical channels. Start with one neuron so the later attention maps have recognizable parts: two supplied inputs multiply two learned weights, then a learned bias enters a sum and an activation changes that sum."}</Prose>

<div data-flow-view="D01"><NeuronView/></div>

<Prose>{"The inputs 1 and 2 multiply weights .5 and −1, giving .5 and −2. Bias 1 gives z=−.5; ReLU returns 0. Change bias to 2: the products stay fixed, z=.5 and the output is .5. Input values and learned parameters have different roles even when both can be edited. A zero gated output does not mean the inputs never affected the preactivation."}</Prose>

<Prose>{"A graph layer applies the same operation to each node row. Multiple feature channels are multiple numbers about one node; they are not additional nodes."}</Prose>

<div data-flow-view="D02"><SharedLayerView/></div>

<Prose>{"For W=[[.5,−1],[1,.5]], b=[1,−1] and H=[[1,2],[0,1],[2,−1]], the rowwise ReLU output is [[0,1],[0,0],[3,.5]]. There are four weights plus two biases, shared across all three rows. H[i,c] identifies node row i and feature channel c. This code's output-major stored W uses H Wᵀ+1bᵀ; a diagram labels both axes rather than relying on the word “vector.”"}</Prose>

<Prose>{"Separate "}<strong>{"node identity"}</strong>{", "}<strong>{"connectivity"}</strong>{" and "}<strong>{"physical position"}</strong>{". A graph-layout program might move nodes apart to make edges readable. That motion does not change the graph. An atom-coordinate measurement has a different meaning: moving one atom while holding the others fixed changes distances and potentially the predicted property."}</Prose>

<Prose>{"For N nodes, write H as an N×d table of node features and A as an N×N adjacency matrix. We use receiver rows: Aᵢⱼ indicates that i receives from j. A geometric graph additionally has X, an N×3 coordinate table. Features such as atom type can be scalars under spatial rotations even when their numerical encoding is a vector of several channels. “Vector of features” does not automatically mean “physical vector.”"}</Prose>

<Prose>{"Start with stable node IDs 0/1/2 and a path 0–1–2. Move only its display layout, then change storage order, then change one measured physical coordinate."}</Prose>

<div data-flow-view="D03"><LayoutView/></div>

<Prose>{"Moving the drawing's layout changes neither H nor A. The node labels travel with their disks, while the model tables and answer stay fixed. A node-layout offset is therefore an honest null experiment."}</Prose>

<div data-flow-view="D04"><RelabelView/></div>

<Prose>{"Reverse the storage order: each row of H and each row and column of A move together. An output must follow its semantic node. Replacing edge 0–1 with 0–2 is a different operation: connectivity changes and may change an answer. Reverse twice restores the exact input tables."}</Prose>

<div data-flow-view="D05"><PhysicalInputView/></div>

<Prose>{"For x0=(0,0,0), x1=(1,0,0), changing only x1's first coordinate to 2 changes their squared distance 1→4. This changes X, not the node's identity. Rotating or moving a display layout does not perform this physical edit."}</Prose>

<Prose>{"Let P be a permutation matrix: multiplying PH reorders node rows. For node outputs, the desired contract is"}</Prose>

<div className="neural-equation"><MathBlock>{"F(PH,PAP^T)=P F(H,A)."}</MathBlock></div>

<Prose>{"The output follows the node it describes. For a graph-level scalar, the output should instead be unchanged. A sum or mean of scalar node outputs can provide that invariance, although those choices preserve different information about graph size."}</Prose>

<H3>{"A transformer cannot use information it never receives"}</H3>

<Prose>{"Self-attention on H alone compares every node with every other node. If A is never used in features, masks, biases or another branch, changing only A cannot change the result. Such a model processes a set of node features. It can be useful, but it does not become aware of bonds or citations merely because its inputs are called nodes."}</Prose>

<Prose>{"If the features already contain degree, triangle counts or message-passing states, some graph structure is present even without an explicit attention bias. An ablation called “no graph information” must remove those paths too. In our real experiment, every model retains degree and clustering features; the comparison isolates additional routes into graph structure."}</Prose>

<H2>{"2. Give an attention read structural information"}</H2>

<Prose>{"A query is a receiver's learned search representation; a key describes a potential donor and a value is the information it contributes. Their matrices are made from the shared maps just traced."}</Prose>

<div data-flow-view="D06"><ProjectionView/></div>

<Prose>{"In the small nonzero example, Q/K/V each contain a learned two-output projection of three scalar input channels. A head is one selected slice of those channels; d_k counts its query/key coordinates (two here). Multiply receiver q_i by donor k_j, divide by √d_k, then normalize its scores. The value lane remains separate from the score lane: a high weight alone is not a large contribution. The complete program below compares explicit H Wᵀ+b and a stable row with ordinary Linear plus scaled_dot_product_attention, including both input and every parameter gradient. This is separate from the next hand example, which sets every qᵀk term to zero so only structure changes the masses."}</Prose>

<Prose>{"For receiver i and sender j, begin with a usual attention score, then add a structural bias:"}</Prose>

<div className="neural-equation"><MathBlock>{"s_{ij}=q_i^Tk_j/\\sqrt{d_k}+b_{ij},\\qquad\n\\alpha_{ij}=\\frac{e^{s_{ij}}}{\\sum_{u\\in\\mathcal A(i)}e^{s_{iu}}},\\qquad\ny_i=\\sum_{j\\in\\mathcal A(i)}\\alpha_{ij}v_j."}</MathBlock></div>

<Prose>{"Here q asks for relevant information, k determines a match, v supplies content and the allowed set A(i) determines which senders can participate. A "}<strong>{"bias"}</strong>{" changes relative preference; a "}<strong>{"mask"}</strong>{" removes access. A finite negative bias is not the same as forbidding a message."}</Prose>

<Prose>{"A path supplies a structural measurement before it supplies a preference."}</Prose>

<div data-flow-view="D07"><StructuralRowView/></div>

<Prose>{"Receiver 0 sees distances0,1,2 on0–1–2. Edge selection changes only the chosen adjacency bit; all three independent edge choices remain available. Disconnecting a donor gives a separate unreachable category rather than a large made-up distance. Receiver rows and donor columns stay labeled when storage changes."}</Prose>

<div data-flow-view="D08"><DonorProductsView/></div>

<Prose>{"At λ=1, distance masses 1,.5,.25 normalize to 4/7,2/7,1/7. Values [1,2,4] contribute4/7,4/7,4/7, giving 12/7. Edit donor 2 to 11 and only its product changes to 11/7, giving 19/7. Every donor value remains independently editable; equal 7 values return 7 for any normalized support."}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac47\\cdot1+\\frac27\\cdot2+\\frac17\\cdot4=\\frac{12}{7}."}</MathBlock></div>

<div data-flow-view="D09"><PreferenceView/></div>

<Prose>{"The reachable bias is−λd ln2 in this illustrative rule; the unreachable category has its own finite bias. λ=0 makes reachable masses equal. A finite bias still yields a positive mass: the donor has been discouraged, not forbidden. A real learned Graphormer lookup can have a different, nonmonotone pattern."}</Prose>

<div data-flow-view="D10"><PermissionView/></div>

<Prose>{"Closed one-hop scope at receiver 0 permits donors 0/1. Their two masses 1 and .5 renormalize to 2/3,1/3,0, so the result is 4/3 and donor 2's edit to 11 is a null. Independent permission bits can further restrict support. An all-forbidden row has no probability distribution or defined read; it is labeled undefined rather than a row of fake probabilities. The complete pin preserves graph, values, category bias, receiver, scope, permission and result."}</Prose>

<Prose>{"For the ordinary API route, a float mask adds to scores, while SDPA's boolean True means permitted. Dropout is explicitly 0 for the comparison. The program carries a defined-row flag; its zero storage buffer for an empty row is never interpreted as a mathematical output."}</Prose>

<Prose>{"The explicit implementation makes the projection, scalar products, stable masses, denominator and value sum visible. The ordinary route changes only the implementation of those operations. One scalar output probe differentiates through the inputs, supplied bias and all six projection parameter tensors; an identical SGD step then checks state update agreement."}</Prose>

<CodeBlock language="python" filename="structural_attention_bridge.py" downloadUrl="/learn-code/graph-transformers-geometric-deep-learning/structural_attention_bridge.py">{"\"\"\"Explicit projections and stable masked attention versus ordinary PyTorch.\n\nAn empty support row has valid=False; its zero buffer is not a probability.\n\"\"\"\nimport copy\nimport math\nimport torch\nfrom torch import nn\nfrom torch.nn import functional as F\n\n\nclass StructuralRead(nn.Module):\n    def __init__(self,channels=3,width=2):\n        super().__init__()\n        self.query=nn.Linear(channels,width)\n        self.key=nn.Linear(channels,width)\n        self.value=nn.Linear(channels,width)\n\n    def forward(self,features,bias,allowed,library=False):\n        if library:\n            q,k,v=self.query(features),self.key(features),self.value(features)\n        else:\n            q=features@self.query.weight.T+self.query.bias\n            k=features@self.key.weight.T+self.key.bias\n            v=features@self.value.weight.T+self.value.bias\n        valid=allowed.any(-1)\n        if library:\n            # The API receives a safe row for undefined cases. Its result is\n            # replaced by a zero storage buffer and accompanied by valid=False.\n            safe=allowed.clone()\n            safe[~valid,0]=True\n            mask=torch.where(safe,bias,-torch.inf)\n            output=F.scaled_dot_product_attention(q[None,None],k[None,None],\n                       v[None,None],attn_mask=mask,dropout_p=0.)[0,0]\n            output=torch.where(valid[:,None],output,0.)\n            return output,valid\n        scores=q@k.T/math.sqrt(q.shape[-1])+bias\n        masked=torch.where(allowed,scores,-torch.inf)\n        maximum=masked.max(-1,keepdim=True).values\n        maximum=torch.where(valid[:,None],maximum,0.)\n        masses=torch.where(allowed,torch.exp(scores-maximum),0.)\n        weights=masses/masses.sum(-1,keepdim=True).clamp_min(1)\n        return weights@v,valid\n\n\ndef main():\n    torch.manual_seed(23)\n    torch.set_num_threads(1)\n    features=torch.tensor([[1.,.2,-.3],[-.4,.7,.1],[.8,-.6,.4]],dtype=torch.float64)\n    bias=torch.tensor([[0.,-.7,-1.4],[-.7,0.,-.7],[-1.4,-.7,0.]],dtype=torch.float64)\n    allowed=torch.tensor([[True,True,False],[True,True,True],[False,True,True]])\n    scratch=StructuralRead().double()\n    library=copy.deepcopy(scratch)\n    left=[v.clone().requires_grad_() for v in (features,bias)]\n    right=[v.clone().requires_grad_() for v in (features,bias)]\n    actual,valid=scratch(*left,allowed)\n    expected,other_valid=library(*right,allowed,library=True)\n    torch.testing.assert_close(actual,expected,atol=1e-12,rtol=1e-12)\n    assert torch.equal(valid,other_valid)\n    actual.square().sum().backward()\n    expected.square().sum().backward()\n    maximum=0.\n    for a,b in zip(left+list(scratch.parameters()),right+list(library.parameters()),strict=True):\n        maximum=max(maximum,float((a.grad-b.grad).abs().max()))\n        torch.testing.assert_close(a.grad,b.grad,atol=1e-11,rtol=1e-11)\n    torch.optim.SGD(scratch.parameters(),lr=.03).step()\n    torch.optim.SGD(library.parameters(),lr=.03).step()\n    for a,b in zip(scratch.parameters(),library.parameters(),strict=True):\n        torch.testing.assert_close(a,b,atol=1e-12,rtol=1e-12)\n    print('explicit nonzero-content output:',actual.detach().tolist())\n    print('all input/bias/parameter gradients maximum error:',maximum)\n    print('one SGD step: matched')\n    empty=allowed.clone();empty[1]=False\n    output,defined=scratch(features,bias,empty)\n    print('empty receiver status:',defined.tolist(),'storage row:',output[1].tolist())\n\n\nif __name__=='__main__':\n    main()"}</CodeBlock>

<CodeBlock kind="output" language="text" filename="structural_attention_bridge.py.stdout.txt">{"explicit nonzero-content output: [[-0.4189013832465927, -0.35338024734206575], [-0.3111608553453777, -0.323957937750688], [-0.32971511368525935, -0.6035813363182821]]\nall input/bias/parameter gradients maximum error: 8.881784197001252e-16\none SGD step: matched\nempty receiver status: [True, False, True] storage row: [0.0, 0.0]"}</CodeBlock>

<H3>{"Graphormer and GPS make different design choices"}</H3>

<Prose>{""}<a href={"https://arxiv.org/pdf/2106.05234"}>{"Graphormer"}</a>{" uses degree embeddings on nodes, shortest-path-dependent attention bias and an edge-feature bias along a selected shortest path. A learnable distance table can favor or discourage particular distances; it need not decrease monotonically. Disconnected pairs need a separate category, rather than being confused with a long finite path. Its special graph-summary node also has a distinct role from physical edges."}</Prose>

<Prose>{"Shortest-path length is invariant to node names. Selecting one of several equally short paths can be more delicate: if their edge features differ, a tie-break based on node index can affect the resulting bias. A claim of exact relabeling consistency must include this preprocessing, not only the attention formula. Our teaching model uses distances and no path-edge aggregation."}</Prose>

<Prose>{""}<a href={"https://arxiv.org/pdf/2205.12454"}>{"GPS"}</a>{" combines structural or positional inputs, a local message-passing branch and a global attention branch. Its layer combines those routes with residual/normalization operations and an MLP. This is useful when local edges supply meaningful inductive structure and distant interactions also matter. The global branch can use different attention operators; their mathematical and computational tradeoffs remain relevant."}</Prose>

<div data-flow-view="D11"><GraphormerInjectionView/></div>

<Prose>{"Degree enters node channels; pair distance and path-edge features enter the score-bias port. A summary token is a separate learned node, not a physical bond. On the diamond0–1–3/0–2–3, the two equal-length path means are 1 and 3. Choosing the lexicographically first path can change1→3 when middle IDs swap. Averaging both means gives 2 in this bounded example and is a relabeling null; preprocessing policy matters independently of neural architecture."}</Prose>

<div data-flow-view="D12"><ParallelRoutesView/></div>

<Prose>{"The local branch has graph-edge support; the global branch has all within-graph pairs. Both receive H, then recombine their returned scalar channels. This is not local-before-global attention. Exact residual and normalization choices are developed with the ordinary GPS program in §8. Encodings can also strengthen message passing; they are not exclusive transformer property."}</Prose>

<H2>{"3. Structural encodings are measurements of a graph"}</H2>

<H3>{"Random-walk return probabilities"}</H3>

<Prose>{"Unfold the choices before taking matrix powers."}</Prose>

<div data-flow-view="D13"><WalkReturnView/></div>

<Prose>{"For a cycle, each first step has two choices of probability 1/2. A length-three route has probability 1/8. From a selected node, a six-cycle cannot return in three steps, but a triangle has two returning routes, total 2/8=.25. Both graphs have degree 2 at every node; return probabilities expose an additional local structural difference. Controls retain 3–8 nodes,1–5 steps and every start."}</Prose>

<div data-flow-view="D14"><WalkEditView/></div>

<Prose>{"The selected endpoints name one undirected edge; toggling it changes both adjacency entries. Two-triangles and clear-all actions are convenient examples, while arbitrary endpoint edits remain available. After resizing, the stated cycle reset keeps IDs and selectors valid."}</Prose>

<div data-flow-view="D15"><WalkIsolateView/></div>

<Prose>{"A zero transition row loses its outgoing mass: its positive-step return is 0. An explicitly absorbing self-loop instead has return 1. These are different models of an isolate, not two divide-by-zero fixes. The nonisolated rows remain unchanged."}</Prose>

<div data-flow-view="D16"><WalkProductsView/></div>

<Prose>{"For the three-node path, A² at the center is 2 because there are two two-edge returns. T² there is 1 because each route has probability 1/2×1. A displayed list may stop after 40 paths; the matrix arithmetic and exact total still include every route. Walk counts and probabilities use the same endpoints but different weights."}</Prose>

<Prose>{"On an unweighted undirected graph with positive degrees, define T=D⁻¹A. Row i is a probability distribution for one step from i to a uniformly selected neighbor. The entry (Tᵏ)ᵢᵢ is the probability of returning to i after k steps. A node can receive several such probabilities as additional features."}</Prose>

<Prose>{"The diagonal of Aᵏ instead counts walks on an unweighted graph. Counts and probabilities are different: each step of a random walk includes a degree-dependent denominator. For an isolated node, choose and document a policy. Our code uses a zero transition row, yielding zero positive-step return values; an absorbing self-loop would define a different walk."}</Prose>

<Prose>{"Consider a six-cycle and two disjoint triangles. Both have six nodes, all degree two. With identical initial features, plain local message passing cannot distinguish their nodes by repeated neighbor multisets. But a three-step return probability is zero on the six-cycle and 1/4 on a triangle. In a triangle there are two returning three-step routes, each with probability (1/2)³. This feature distinguishes the examples immediately."}</Prose>

<Prose>{"It does not follow that a trained model must use the feature successfully. Nor does it follow that a transformer is necessary: a small model reading that return probability can already separate this pair. A random output difference on two graphs is evidence of different representations at those weights, not an accuracy benchmark."}</Prose>

<H3>{"Laplacian modes"}</H3>

<Prose>{"A graph signal assigns a signed scalar to each node. Its pattern and the operator acting on it are visible before the spectrum is named."}</Prose>

<div data-flow-view="D17"><EigenPatternView/></div>

<Prose>{"For the four-cycle, L=D−A has spectrum 0,2,2,4. The constant pattern gives eigenvalue 0. Choose two normalized λ=2 patterns u=(1,0,−1,0)/√2 and v=(0,1,0,−1)/√2; every L-row product equals twice that node's signal. These are node-indexed pattern coordinates, not physical arrows. A numerical solver may return a different orthonormal pair, as the current figures do; the complete pair spans the same λ=2 space."}</Prose>

<div data-flow-view="D18"><BasisView/></div>

<Prose>{"Replace U=[u,v] by UQ(θ), with an orthogonal 2×2 angle matrix; sign reversal is another coordinate choice. Both columns remain λ=2 eigenvectors on this unchanged graph. The columns and each node's two coordinates can change even though their subspace is identical."}</Prose>

<div data-flow-view="D19"><ProjectorView/></div>

<Prose>{"The cell(i,j) of UUᵀ is u_i u_j+v_i v_j. It survives the change because UQQᵀUᵀ=UUᵀ. On the stated patterns the diagonal is .5, opposite-node entries are−.5 and adjacent entries0. Under node relabeling the projector itself follows PAPᵀ-style row/column permutation; the unchanged array in a fixed old ordering is not the action rule."}</Prose>

<div data-flow-view="D20"><TruncatedView/></div>

<Prose>{"The single-column projector uuᵀ does change under a rotation that mixes u and v; it kept only part of the repeated eigenspace. Deleting the actual0–1 edge gives a different graph with distinct middle eigenvalues. A rotated two-column span still has the same projector, but mixing its distinct eigenvectors generally produces columns with nonzero eigenpair residuals. The picture reports those residuals instead of calling mixed columns new eigenvectors."}</Prose>

<Prose>{"The combinatorial Laplacian L=D−A is a symmetric matrix for an undirected graph. Its eigenvectors are patterns on nodes: Lu=λu means the operator scales that pattern by λ. Low eigenvalues correspond to patterns that vary relatively little across edges under the associated quadratic form. The number of zero eigenvalues equals the number of connected components."}</Prose>

<Prose>{"For a connected graph, the zero mode is constant. For a disconnected graph there is an entire space of componentwise constant patterns. The symmetric normalized Laplacian uses degree-scaled coordinates instead; do not silently transfer the constant-vector convention. Isolated-node definitions require additional care. These distinctions were developed in "}<a href={"/learn/path/full-curriculum/spectral-graph-theory?module=math-foundations"}>{"Spectral Graph Theory"}</a>{"."}</Prose>

<Prose>{"Rows of selected eigenvectors can become positional features. Yet the numerical eigenvectors are not unique. A unit eigenvector and its negative represent the same mode. If an eigenvalue repeats, any orthonormal basis of its eigenspace is valid. This happens in connected graphs too: a four-cycle has eigenvalues (0,2,2,4), so its eigenvalue-2 space has a freely rotatable two-vector basis."}</Prose>

<Prose>{"Making the first nonzero entry positive does not solve the full problem. “First” depends on node order, and sign choices do not remove rotations inside a repeated eigenspace. Selecting only part of a repeated eigenspace creates another ambiguity. Sorting connected components by arbitrary IDs is not a general relabeling-safe repair."}</Prose>

<Prose>{"An instructive invariant is the "}<strong>{"projector"}</strong>{" UUᵀ for a complete orthonormal eigenspace basis U. Replacing U by UQ for an orthogonal Q gives UQQᵀUᵀ=UUᵀ. Relabeling nodes still permutes its two node axes. "}<a href={"https://arxiv.org/html/2202.13013v4"}>{"SignNet and BasisNet"}</a>{" explicitly address sign and basis symmetries; the projector calculation shows why the distinction matters. It is a conceptual route, not a claim that dense projectors are the cheapest encoding for every graph."}</Prose>

<H2>{"4. More global access has limits"}</H2>

<Prose>{"A read can have different routes and still return the same scalar."}</Prose>

<div data-flow-view="D21"><EqualReadView/></div>

<Prose>{"With every donor value7, global weights 4/7,2/7,1/7 and one-hop weights 2/3,1/3,0 both return 7. The support differs; the aggregation collides on this input. Change an actual donor to break that collision. This separates four questions: what information can enter, what the aggregation preserves, which graphs a representation distinguishes, and whether fitted parameters predict unseen labels accurately. The real study below tests the last question; the algebraic null does not answer it."}</Prose>

<Prose>{"Full attention reduces the number of layers needed for a distant node to be reachable. It does not guarantee that its information survives the weighted sum, that all structures become distinguishable, or that the model can be trained effectively with the available labels."}</Prose>

<Prose>{"For example, if every value vector equals v, then every normalized attention row returns v, regardless of its distance biases. Different weight matrices alone do not create distinct outputs in this case. A downstream bias or nonlinear layer receiving identical node states preserves that equality when its rule is shared. Node features, degree information, edge values or other routes may remove the collision."}</Prose>

<Prose>{"Graph spectra are also not complete graph fingerprints: different graphs can be cospectral. An encoding's conditions determine its expressiveness; the label “graph transformer” does not settle them. Separately measure access, distinguishability, fitting and held-out prediction."}</Prose>

<Prose>{""}<strong>{"Practice pause."}</strong>{" For the three-node path, replace all three values by 7. Calculate the global and locally masked outputs, despite their different weights."}</Prose>

<details><summary>Hint</summary>

<Prose>{"A weighted average of equal values has a simple result."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Both outputs equal 7 because each allowed row is normalized. The attention distributions differ; the supplied messages do not expose that difference. This is a useful null case for an implementation and an interpretation warning."}</Prose>

</details>

<H2>{"5. State the symmetry contract before choosing a network"}</H2>

<Prose>{"A transformation g can act differently on inputs and outputs. Write those actions as P_g and Q_g. The architectural requirement is"}</Prose>

<div className="neural-equation"><MathBlock>{"F(P_g x)=Q_g F(x)."}</MathBlock></div>

<Prose>{"Invariance is the special case where Q_g leaves the output unchanged. It is not a universal ranking in which one kind of prediction is “weaker” than another: a scalar energy and a vector force require different output actions. The "}<a href={"https://geometricdeeplearning.com/book/algebraicpriors.html"}>{"geometric deep learning text"}</a>{" develops this representation-based view."}</Prose>

<H3>{"Start with four sensors on a square"}</H3>

<div data-flow-view="D22"><SquareSitesView/></div>

<Prose>{"Name clockwise sites a,b,c,d and values 1,2,4,8. A quarter-turn R sends readings to(d,a,b,c); reflection S sends them to(a,d,c,b). Editing one site's scalar preserves the other three. A fixed calibration attached to a physical site can make this symmetry inappropriate for the target."}</Prose>

<div data-flow-view="D23"><SquareRoutesView/></div>

<Prose>{"Use the failing map W=R. On these readings, reflecting first then applying R differs from applying R then reflecting: R S and S R do not agree. A tied neighbor map(R+R⁻¹)/2 returns [5,2.5,5,2.5] and follows all eight square actions. Input and output actions are named on the two routes."}</Prose>

<div data-flow-view="D24"><SquareProofView/></div>

<Prose>{"On constant readings both failing routes happen to agree, although WP_g−Q_gW is not zero. Its largest entry defect is 1 for the specified reflection/map. Current-input defect and all-input matrix defect are different results; both remain visible."}</Prose>

<div data-flow-view="D25"><SquareAverageView/></div>

<Prose>{"For a linear layer, WP_g=Q_gW proves the contract for every input. The eight conjugates P_g⁻¹WP_g have an arithmetic mean. Transforming that mean permutes the same eight summands, so it commutes with every square action. For distinct input/output representations use Q_g⁻¹WP_g; dimensions and actions must match. Full matrices accompany the selected conjugate and mean, not only a slogan about symmetry. Reindexing the average by any group element h permutes its eight summands: h⁻¹ W̄ h=(1/8)Σ_g (gh)⁻¹W(gh)=W̄. These eight discrete square actions do not cover all continuous planar rotations."}</Prose>

<H2>{"6. Move from node permutations to physical rotations"}</H2>

<Prose>{"Discrete node reordering moves rows; physical rotation also mixes Cartesian components belonging to one object."}</Prose>

<div data-flow-view="D26"><ComponentsView/></div>

<Prose>{"A polar vector v=(1,−2,0) has three components in the same coordinate frame. An arbitrary three-channel node feature need not follow that frame's 3×3 action. Editing x/y/z addresses a component of this physical object, while its full triple remains visible."}</Prose>

<div data-flow-view="D27"><PhysicalTypeView/></div>

<Prose>{"A proper 90° z rotation sends v to (2,1,0). Under x-reflection, a polar vector follows Qv, while an axial vector follows det(Q)Qv and a scalar stays fixed. A position uses Qx+t. Proper-rotation agreement alone does not test the reflection contract."}</Prose>

<div data-flow-view="D28"><TranslationView/></div>

<Prose>{"A free vector is unchanged by pure translation; an origin-to-point coordinate is not. For charges 1 and −1 at (1,0,0)/(0,1,0), p=(1,−1,0) and total charge 0 make common translation a dipole null. Change the second charge to .5: p=(1,.5,0), total charge 1.5; t=(1,2,0) gives p′=(2.5,3.5,0). Charge×length units and the common transformed inputs explain the difference."}</Prose>

<Prose>{"A spatial rotation is an orthogonal matrix R with determinant +1. It preserves lengths and angles. Adding a translation t changes a point x to Rx+t. SE(3) includes these proper rotations and translations in three dimensions. E(3) also allows reflections, whose orthogonal matrices have determinant −1."}</Prose>

<NeuralTable caption={"6. Move from node permutations to physical rotations"} headers={[<>{"Quantity"}</>,<>{"Under a common rotation/reflection Q and translation t"}</>]} rows={[[<>{"Position"}</>,<>{"Qx+t"}</>],[<>{"Displacement, velocity or ordinary force"}</>,<>{"Qv; translation adds nothing"}</>],[<>{"Scalar energy of an isolated system with the assumed symmetries"}</>,<>{"Same scalar"}</>],[<>{"Axial vector such as a cross product of two polar vectors"}</>,<>{"det(Q)Qv"}</>],[<>{"Node label/order"}</>,<>{"Follows the corresponding node permutation"}</>]]} />

<Prose>{"Forces and electric dipole vectors are ordinary polar vectors, not generally pseudovectors. Angular momentum is an axial vector. They transform the same way under proper rotations but differently under reflections. A charged system's dipole also depends on origin: translating all charges adds total-charge×translation. Specify the physical setting rather than treating the table as permission to ignore external fields or boundaries."}</Prose>

<H3>{"Scalar channels and vector channels need different nonlinearities"}</H3>

<Prose>{"Applying the same scalar ReLU to each channel commutes with a permutation of scalar channels. It generally fails for the Cartesian components of a rotating vector. With v=(1,−2) and a 90° rotation, ReLU(Rv)=(2,1), while R ReLU(v)=(0,1). The discrepancy is 2 in the first component."}</Prose>

<Prose>{"Multiplying a vector by a scalar function of its norm is rotation-equivariant: the norm is unchanged, so the same multiplier accompanies the rotated vector. Summing or averaging vectors that share the same rotation action is also equivariant. Averaging force vectors does not magically turn them into a rotation-invariant scalar; it yields another rotating vector."}</Prose>

<div data-flow-view="D29"><GateView/></div>

<Prose>{"ReLU(Qv) for the 90° case is (2,1,0), while Q ReLU(v) is (0,1,0): discrepancy2. Multiplying the whole arrow by 1/(1+‖v‖) instead uses an invariant scalar, so its two routes agree. The norm wire and scalar multiplier are distinct from three unrelated component gates. A fixed pixel-grid inset contrasts a 90° exact permutation with a 17° rotation requiring resampling/padding; that qualitative illustration is not a measured raster benchmark."}</Prose>

<Prose>{"A finite image grid adds another distinction. A 90° rotation of a square array can permute pixels exactly; a 17° rotation usually needs interpolation and boundary handling. Repeated interpolation need not equal one resampling by the composed angle. A proof about continuous functions or exact point coordinates does not automatically prove exact equivariance for that raster pipeline. State the sampled domain, action, padding/cropping and error tolerance when applying the idea to images."}</Prose>

<H2>{"7. Build an equivariant coordinate update"}</H2>

<Prose>{"The compatible vector gate suggests a graph layer: compute a scalar from invariant pair information, then multiply a relative direction."}</Prose>

<div data-flow-view="D30"><GeometricAnatomyView/></div>

<Prose>{"For receiver i and source j, the learned input is [h_i,h_j,‖x_i−x_j‖²,a_ij]. h and edge attribute a are invariant scalar channels; x has a separate three-component Cartesian axis. An ordinary MLP returns a four-channel scalar message, a linear map returns one coordinate coefficient, and a node MLP updates h. Its weights act on scalar channels; they never treat x/y/z as independently learned scalar inputs. The fixed 1/(1+r²) hand rule remains a separate parameterization, not a trained version of this MLP."}</Prose>

<div data-flow-view="D31"><DirectionView/></div>

<Prose>{"For the original triangle (0,0,0),(1,0,0),(0,2,0), receiver 0 has relative vectors(−1,0,0)/(0,−2,0), squared distances1/4 and coefficients .5/.2. Products(−.5,0,0)/(0,−.4,0) sum to(−.5,−.4,0); c=.1 moves receiver 0 to(−.05,−.04,0). The contribution lanes show each complete relative vector entering its own scalar multiplication, then the sum, c and the separate old-position residual. Displacement arrows in this first projection use a labelled visual magnification ×10; the actual coordinate update still uses c=.1. A zero displacement has no directional head. All messages use the same old X, so this is a simultaneous update."}</Prose>

<div data-flow-view="D32"><StepRuleView/></div>

<Prose>{"Step zero keeps points fixed; it does not validate the rule. Changing c scales the displacement, whereas ReLU direction or axis-based neighborhoods changes the operation. A radial update can remain equivariant at a large c while iterating unstably. Keep numerical stability separate from the transformation identity."}</Prose>

<div data-flow-view="D33"><GeometricContractView/></div>

<Prose>{"Common translation cancels in x_i−x_j. Orthogonal Q preserves the squared norm, invariant scalar channels and the learned coefficient. Thus the displacement becomes Q times the old displacement, and the residual output becomes Qx_i′+t. Both parities and a compatible edge/attribute permutation are required. A neighborhood chosen from a fixed coordinate axis fails that assumption."}</Prose>

<div data-flow-view="D34"><GeometricApplyView/></div>

<Prose>{"One application replaces every input point with its simultaneously proposed point, then recomputes the next proposal. If any coordinate leaves the editor's[-4,4] domain, the proposal remains visible and Apply is disabled with its reason. A duplicate point has zero relative direction and finite 1/(1+r²), not division by a norm. Pin preserves all inputs, step, rule, action and output across the focused views; it is an inspection baseline rather than a physical integrator."}</Prose>

<Prose>{"Start with scalar node states hᵢ, positions xᵢ and invariant edge attributes aᵢⱼ. Construct messages from quantities that do not change under the intended rigid transformation:"}</Prose>

<div className="neural-equation"><MathBlock>{"m_{ij}=\\phi_e(h_i,h_j,\\|x_i-x_j\\|^2,a_{ij}),\\qquad\ns_{ij}=\\phi_x(m_{ij})."}</MathBlock></div>

<Prose>{"Each sᵢⱼ is a scalar. An EGNN-style coordinate update has the form"}</Prose>

<div className="neural-equation"><MathBlock>{"x'_i=x_i+c\\sum_{j\\in\\mathcal N(i)}(x_i-x_j)s_{ij},\\qquad\nh'_i=\\phi_h\\left(h_i,\\sum_jm_{ij}\\right)."}</MathBlock></div>

<Prose>{"The "}<a href={"https://proceedings.mlr.press/v139/satorras21a/satorras21a.pdf"}>{"EGNN paper"}</a>{" develops this construction and related velocity/edge variants. State the normalization c and neighbor rule for an actual implementation; the paper's all-pairs coordinate update uses c=1/(N−1). Our next hand calculation uses a separately declared step coefficient and a fixed scalar function so we can inspect every contribution."}</Prose>

<H3>{"The proof is a sequence of simple checks"}</H3>

<Prose>{"Under xᵢ→Qxᵢ+t, relative positions become Q(xᵢ−xⱼ): translation cancels. Their squared lengths stay unchanged because QᵀQ=I. Consequently messages and scalar multipliers stay unchanged. Each directional contribution rotates or reflects by Q, and their sum does too. Adding the transformed starting point gives Qx′ᵢ+t. Scalar hidden-state updates remain unchanged. Relabeling nodes simply relabels the same sums."}</Prose>

<Prose>{"This proof requires invariant initial scalar features, compatible edges and correctly transforming attributes. Building neighbors with an axis-specific rule such as “larger x-coordinate” can violate it. Radius neighbors are compatible in exact arithmetic, but cutoffs, ties and floating-point tolerances still need a defined implementation policy."}</Prose>

<H3>{"Calculate the arrows"}</H3>

<Prose>{"Use three constructed points (0,0,0), (1,0,0), (0,2,0). Connect every pair and set"}</Prose>

<div className="neural-equation"><MathBlock>{"x'_i=x_i+0.1\\sum_{j\\ne i}\\frac{x_i-x_j}{1+\\|x_i-x_j\\|^2}."}</MathBlock></div>

<Prose>{"For point 0, the two relative vectors are (−1,0,0) and (0,−2,0), with multipliers 1/2 and 1/5. The displacement is (−.05,−.04,0). The three updated points are"}</Prose>

<div className="neural-equation"><MathBlock>{"(-.05,-.04,0),\\quad(1.066667,-.033333,0),\\quad(-.016667,2.073333,0)."}</MathBlock></div>

<Prose>{"Now rotate 90° around z and translate by (3,−2,1). Updating after the transform gives (3.04,−2.05,1), (3.033333,−.933333,1) and (.926667,−2.016667,1). These are the transformed original outputs. The retained double-precision calculation agrees to about 10⁻¹⁶ for this case."}</Prose>

<Prose>{"This coordinate update is not automatically a stable physical simulator. Equivariance permits large coefficients, explosive repeated updates and inaccurate predictions. Replacing a relative vector by a norm-normalized direction preserves rigid-motion equivariance if done consistently, but does not bound unbounded learned scalars or guarantee stability. A degree normalization, residual scale or bounded gate changes numerical behavior and must be evaluated as part of the model. Applying arbitrary coordinatewise normalization can destroy the geometric contract."}</Prose>

<Prose>{"The complete "}<a href={"/learn-code/graph-transformers-geometric-deep-learning/geometry-calculations.py"}>{"geometry-calculations.py"}</a>{" reproduces the attention arithmetic, return walks, eigenspace projector, square action, coordinate update and changed-output checks. These are constructed mathematical examples. They are separate from the observed graph experiment below."}</Prose>

<Program file="geometry-calculations.py"/>

<H3>{"Implement the learned scalar-message layer"}</H3>

<Prose>{"The hand rule explained the action; now build a trainable coefficient. "}<code>{"GeometricLayer"}</code>{" spells out relative coordinates, squared distances, concatenated invariant inputs, scalar MLPs, fresh receiver accumulators and residual updates. Edges are unique directed(source,receiver) pairs without self edges. Scalar attributes travel with their edge. Its work is proportional to the edge count times the MLP work, and the edge-list route avoids an unnecessary full pair grid."}</Prose>

<Prose>{""}<code>{"dense_reference"}</code>{" evaluates the same copied maps on a small receiver×source grid and selects the actual support before summing. This is a bounded implementation oracle, not a second trained model. The displayed invocation compares output, feature/coordinate/attribute gradients and every parameter gradient, then one identical SGD step. The new seed 17 parameter example is a mechanism check; it does not replace the original Karate AdamW fits."}</Prose>

<Prose>{"Run the complete module with PyTorch 2.14 CPU. The feature shape is (3,2), position shape(3,3) and edge shape(2,6). The full vector coordinates and scalar feature outputs are printed rather than hidden behind a fit call. "}<code>{"frame_mix"}</code>{" at the end will be explained in §10; it is an ordinary matrix operation on supplied frames."}</Prose>

<CodeBlock language="python" filename="geometric_layer_bridge.py" downloadUrl="/learn-code/graph-transformers-geometric-deep-learning/geometric_layer_bridge.py">{"\"\"\"An invariant scalar-message network updates scalar features and 3D points.\n\nEdges are unique directed (source, receiver) pairs without self edges.\nRequires PyTorch; no dataset, pretrained weights or fitting is needed.\n\"\"\"\nimport copy\nimport math\nimport torch\nfrom torch import nn\n\n\nclass GeometricLayer(nn.Module):\n    def __init__(self, channels=2, message_width=4):\n        super().__init__()\n        self.edge = nn.Sequential(nn.Linear(2*channels+2, 8), nn.SiLU(),\n                                  nn.Linear(8, message_width), nn.SiLU())\n        self.coefficient = nn.Linear(message_width, 1)\n        self.node = nn.Sequential(nn.Linear(channels+message_width, 8), nn.SiLU(),\n                                  nn.Linear(8, channels))\n\n    def forward(self, features, positions, edges, attributes, step=.1):\n        source, receiver = edges\n        relative = positions[receiver] - positions[source]\n        squared_distance = relative.square().sum(-1, keepdim=True)\n        inputs = torch.cat((features[receiver], features[source],\n                            squared_distance, attributes[:, None]), -1)\n        messages = self.edge(inputs)\n        coefficients = self.coefficient(messages)\n        # Each fresh accumulator belongs to this call. index_add_ accumulates\n        # repeated receivers without copying the full output for every group.\n        message_sum = features.new_zeros((len(features), messages.shape[-1]))\n        message_sum.index_add_(0, receiver, messages)\n        displacement = torch.zeros_like(positions)\n        displacement.index_add_(0, receiver, relative*coefficients)\n        next_features = features + self.node(torch.cat((features, message_sum), -1))\n        next_positions = positions + step*displacement\n        return next_features, next_positions\n\n\ndef dense_reference(layer, features, positions, edges, attributes, step=.1):\n    source, receiver = edges\n    n, d = features.shape\n    allowed = torch.zeros((n, n), dtype=torch.bool, device=features.device)\n    allowed[receiver, source] = True\n    attribute_grid = features.new_zeros((n,n))\n    attribute_grid[receiver, source] = attributes\n    relative = positions[:, None] - positions[None, :]\n    squared_distance = relative.square().sum(-1, keepdim=True)\n    inputs = torch.cat((features[:, None].expand(n,n,d),\n                        features[None, :].expand(n,n,d), squared_distance,\n                        attribute_grid[..., None]), -1)\n    messages = layer.edge(inputs)\n    coefficients = layer.coefficient(messages)\n    active = allowed[..., None]\n    message_sum = torch.where(active, messages, 0.).sum(1)\n    displacement = torch.where(active, relative*coefficients, 0.).sum(1)\n    return (features + layer.node(torch.cat((features, message_sum), -1)),\n            positions + step*displacement)\n\n\ndef hand_rule(positions, step=.1):\n    relative = positions[:, None] - positions[None, :]\n    coefficient = 1/(1+relative.square().sum(-1))\n    coefficient = coefficient*(1-torch.eye(len(positions), dtype=positions.dtype))\n    return positions + step*(relative*coefficient[..., None]).sum(1)\n\n\ndef frame_mix(local_query, local_key, receiver_rotation, donor_rotation,\n              receiver_origin, donor_origin):\n    query = receiver_rotation@local_query + receiver_origin\n    key = donor_rotation@local_key + donor_origin\n    output = .25*query + .75*key\n    local_output = receiver_rotation.T@(output-receiver_origin)\n    return query, key, (query-key).square().sum(), output, local_output\n\n\ndef rotation_z(degrees):\n    angle = math.radians(degrees)\n    c,s = math.cos(angle), math.sin(angle)\n    return torch.tensor([[c,-s,0.],[s,c,0.],[0.,0.,1.]], dtype=torch.float64)\n\n\ndef main():\n    torch.manual_seed(17)\n    torch.set_num_threads(1)\n    features = torch.tensor([[1.,.2],[-.4,.7],[.3,-.6]], dtype=torch.float64)\n    positions = torch.tensor([[0.,0.,0.],[1.,0.,0.],[0.,1.,.5]], dtype=torch.float64)\n    edges = torch.tensor([[0,1,0,2,1,2],[1,0,2,0,2,1]])\n    attributes = torch.tensor([.2,.2,.5,.5,-.3,-.3], dtype=torch.float64)\n    layer = GeometricLayer().double()\n    other = copy.deepcopy(layer)\n    left = [v.clone().requires_grad_() for v in (features,positions,attributes)]\n    right = [v.clone().requires_grad_() for v in (features,positions,attributes)]\n    actual = layer(left[0],left[1],edges,left[2])\n    expected = dense_reference(other,right[0],right[1],edges,right[2])\n    for a,b in zip(actual, expected, strict=True):\n        torch.testing.assert_close(a,b,atol=1e-12,rtol=1e-12)\n    # One scalar probe tests all input/attribute and learned parameter routes.\n    sum(v.square().sum() for v in actual).backward()\n    sum(v.square().sum() for v in expected).backward()\n    for a,b in zip(left+list(layer.parameters()),right+list(other.parameters()),strict=True):\n        torch.testing.assert_close(a.grad,b.grad,atol=1e-11,rtol=1e-11)\n    torch.optim.SGD(layer.parameters(),lr=.02).step()\n    torch.optim.SGD(other.parameters(),lr=.02).step()\n    for a,b in zip(layer.parameters(),other.parameters(),strict=True):\n        torch.testing.assert_close(a,b,atol=1e-12,rtol=1e-12)\n    base = layer(features,positions,edges,attributes)\n    shift = torch.tensor([3.,-2.,1.],dtype=torch.float64)\n    proper = rotation_z(37)\n    for q in (proper,proper@torch.diag(torch.tensor([-1.,1.,1.],dtype=torch.float64))):\n        moved = layer(features,positions@q.T+shift,edges,attributes)\n        torch.testing.assert_close(moved[0],base[0],atol=1e-12,rtol=1e-12)\n        torch.testing.assert_close(moved[1],base[1]@q.T+shift,atol=1e-12,rtol=1e-12)\n    print('input shapes:', tuple(features.shape),tuple(positions.shape),tuple(edges.shape))\n    print('saved rule positions:', hand_rule(positions).tolist())\n    print('learned scalar output:', base[0].tolist())\n    print('learned point output:', base[1].tolist())\n    print('dense output, all gradients and one SGD step: matched')\n    print('proper/reflected common motion: matched')\n    r_i,r_j=rotation_z(90),rotation_z(-90)\n    frame=frame_mix(torch.tensor([1.,0.,0.],dtype=torch.float64),\n                    torch.tensor([0.,1.,0.],dtype=torch.float64),r_i,r_j,\n                    torch.tensor([2.,0.,0.],dtype=torch.float64),\n                    torch.tensor([0.,2.,0.],dtype=torch.float64))\n    print('frame query/key/distance/global/local:', [v.tolist() for v in frame])\n\n\nif __name__ == '__main__':\n    main()"}</CodeBlock>

<CodeBlock kind="output" language="text" filename="geometric_layer_bridge.py.stdout.txt">{"input shapes: (3, 2) (3, 3) (2, 6)\nsaved rule positions: [[-0.05, -0.044444444444444446, -0.022222222222222223], [1.0807692307692307, -0.03076923076923077, -0.015384615384615385], [-0.03076923076923077, 1.0752136752136752, 0.5376068376068376]]\nlearned scalar output: [[0.7734062828509527, 0.3640882632574986], [-0.7370178411446164, 0.7593329244937906], [-0.03687508592822197, -0.4512004951560059]]\nlearned point output: [[-0.0461256209854718, -0.0445468484797847, -0.02227342423989235], [1.087218140536172, -0.04477182979059389, -0.022385914895296944], [-0.04762263152334867, 1.0920235343529106, 0.5460117671764553]]\ndense output, all gradients and one SGD step: matched\nproper/reflected common motion: matched\nframe query/key/distance/global/local: [[2.0, 1.0, 0.0], [1.0, 2.0, 0.0], 2.0, [1.25, 1.75, 0.0], [1.75, 0.7500000000000001, 0.0]]"}</CodeBlock>

<H2>{"8. Run a complete experiment with real graph data"}</H2>

<Prose>{"A symmetry proof now has a practical boundary: compatible outputs can still predict labels poorly. Use the same real graph and report every run before judging an architecture."}</Prose>

<div data-flow-view="D35"><StudyAnatomyView/></div>

<Prose>{"The real graph has 34 nodes/78 edges. Input channels are constant 1, normalized degree and clustering; the walk variant adds four return probabilities. These are scalar structural channels, not physical xyz. Its attention pipeline is input 3 or 7→16, pre-norm→QKV48→2 heads×8→mix16→output16→residual, then pre-norm→16→32→GELU→16→residual; two such blocks precede 2 logits. The35×2 distance-bias table is shared across both blocks. The actual GCN is 3→16→2 with normalized propagation and bias-after-propagation. Fit/development/assessment are 10/6/18 nodes; labels enter only permitted training/evaluation operations."}</Prose>

<div data-flow-view="D36"><RecordedView/></div>

<Prose>{"The twelve family/seed observations remain separately selectable with an assessment semantic node ID and original/fixed-feature edge-removal condition. Five losses are pre-update measurements at epochs 1/10/50/100/300; they are five observations, not a continuous loss record. The 18-node denominator is common; separate run rows retain each identical 9/18 count and every exact measured value stays available. The loss plot labels epoch ticks and the selected run’s numeric cross-entropy range, including zero. Its vertical range changes with the selected family/seed, so compare numeric losses rather than uncalibrated heights across runs. This Recorded state is separate from live seed 11 inference."}</Prose>

<div data-flow-view="D37"><FittedInputView/></div>

<Prose>{"Select any of 34 node IDs and any of three scalar coordinates, then edit a finite value[-2,2]. Follow the selected input embedding's actual products into the saved model's logits and probabilities. No parameter is retrained. Manual edits persist when a different family is inspected or a resource retries; recomputation can make them inactive without deleting them."}</Prose>

<div data-flow-view="D38"><FittedTopologyView/></div>

<Prose>{"Each of 78 observed edges can be toggled. Removing0–1 with original features fixed is an exact set-model null because the set model receives no additional A-dependent route. Recomputing degree/clustering/walk features changes H as well as A and is a different intervention. The displayed feature status and restored manual state prevent those conditions from being conflated."}</Prose>

<div data-flow-view="D39"><FittedReceiverView/></div>

<Prose>{"Every node's output remains inspectable, including fit and development nodes. Wrong-node and greatest-assessment-change actions select a semantic ID using stated rules; they do not constitute independent scientific findings. A pin retains node/family/A/H/output while current input interventions continue."}</Prose>

<div data-flow-view="D40"><FittedHeadView/></div>

<Prose>{"The two blocks have different states; head 0/1 and channel 0…7 select an actual value coordinate. A family without attention displays an absent operator while still showing its own current prediction. It never borrows a stale head row from another family."}</Prose>

<div data-flow-view="D41"><FittedDonorView/></div>

<Prose>{"QK/√8, the selected distance lookup, allowed mass, normalized weight and selected V coordinate form one trace. A donor value is not its coefficient. Original recorded float32 observations and current browser-double inference are labeled separately; small nonzero deltas retain scientific notation."}</Prose>

<div data-flow-view="D42"><FittedMatricesView/></div>

<Prose>{"The selected trace does not replace either34×34 head matrix. Named receiver/donor controls and a local keyboard scroller provide exact access to every cell without shrinking glyphs. Pin/current tables include the full state relevant to a comparison; row reversal maps semantic IDs rather than changing the graph."}</Prose>

<Prose>{"We reuse the observed 34-node, 78-edge karate-club graph from the preceding lesson. This creates a useful controlled continuation: same source IDs, binary edges, affiliation labels and supervision split. The small offline "}<a href={"/learn-code/graph-transformers-geometric-deep-learning/karate-club.json"}>{"graph data"}</a>{" and "}<a href={"/learn-code/graph-transformers-geometric-deep-learning/data-provenance.md"}>{"provenance"}</a>{" retain the licensed NetworkX representation and explain the original interaction weights, which this experiment does not use."}</Prose>

<Prose>{"Each node receives three structural features: constant 1, degree/33 and clustering coefficient. A full known-graph transductive task permits those features and edges at all nodes. Only ten affiliation labels enter the fitting loss; six development and eighteen assessment labels are separate. The split is fixed before fitting. This is one historically observed dependent network, not a population study or a test on unseen graphs."}</Prose>

<Prose>{"Compare four deliberately small models:"}</Prose>

<ol start={1}><li>{"A two-layer GCN with 16 hidden units."}</li><li>{"A two-block set-attention model on the same structural features, with two heads of width 8."}</li><li>{"The same attention model with learned shortest-path-distance biases."}</li><li>{"Attention receiving four random-walk return features in addition to the original three."}</li></ol>

<Prose>{"The GCN has far fewer parameters. The comparison is a small learning investigation, not a parameter-matched benchmark or a reproduction of Graphormer/GPS. All fits use 300 epochs, AdamW learning rate .003, weight decay .01 and seeds 11,29,47. We keep every run, without choosing an epoch or tuning parameters from the assessment scores. This GCN's learning rate differs from the preceding lesson's .02; compare the variants within this table, not two lessons as if they were one matched experiment."}</Prose>

<Prose>{""}<strong>{"Compare the actual structural variants:"}</strong>{" inspect whether extra structural information improves the assessment score in this experiment. Follow one node from input features to q/k/v, two residual blocks, logits, supervised loss and a parameter update."}</Prose>

<H3>{"Complete offline program"}</H3>

<Prose>{"Save this program beside karate-club.json. It requires NumPy and CPU PyTorch; it downloads nothing and does not need a graph library. It computes shortest paths with an explicit unreachable category, return probabilities, normalized GCN propagation, attention blocks, fitting, assessment and node-relabeling checks."}</Prose>

<Program file="graph-transformer-study.py"/>

<H3>{"Read the actual result"}</H3>

<NeuralTable caption={"Read the actual result"} headers={[<>{"Model"}</>,<>{"Seed"}</>,<>{"Parameters"}</>,<>{"Fit /10"}</>,<>{"Development /6"}</>,<>{"Assessment /18"}</>]} rows={[[<>{"gcn"}</>,<>{"11"}</>,<>{"98"}</>,<>{"9"}</>,<>{"2"}</>,<>{"9"}</>],[<>{"gcn"}</>,<>{"29"}</>,<>{"98"}</>,<>{"9"}</>,<>{"2"}</>,<>{"9"}</>],[<>{"gcn"}</>,<>{"47"}</>,<>{"98"}</>,<>{"8"}</>,<>{"2"}</>,<>{"10"}</>],[<>{"set"}</>,<>{"11"}</>,<>{"4546"}</>,<>{"10"}</>,<>{"1"}</>,<>{"10"}</>],[<>{"set"}</>,<>{"29"}</>,<>{"4546"}</>,<>{"10"}</>,<>{"1"}</>,<>{"10"}</>],[<>{"set"}</>,<>{"47"}</>,<>{"4546"}</>,<>{"10"}</>,<>{"1"}</>,<>{"10"}</>],[<>{"distance"}</>,<>{"11"}</>,<>{"4616"}</>,<>{"10"}</>,<>{"1"}</>,<>{"9"}</>],[<>{"distance"}</>,<>{"29"}</>,<>{"4616"}</>,<>{"10"}</>,<>{"1"}</>,<>{"9"}</>],[<>{"distance"}</>,<>{"47"}</>,<>{"4616"}</>,<>{"10"}</>,<>{"1"}</>,<>{"9"}</>],[<>{"walk"}</>,<>{"11"}</>,<>{"4610"}</>,<>{"10"}</>,<>{"2"}</>,<>{"10"}</>],[<>{"walk"}</>,<>{"29"}</>,<>{"4610"}</>,<>{"10"}</>,<>{"2"}</>,<>{"9"}</>],[<>{"walk"}</>,<>{"47"}</>,<>{"4610"}</>,<>{"10"}</>,<>{"2"}</>,<>{"10"}</>]]} />

<Prose>{"Always predicting one affiliation scores 9/18 on this balanced assessment. Most models fit their ten supervised labels perfectly yet score only 9 or 10 on assessment. More parameters, global access and extra structural features do not establish improved generalization here. The preceding lesson's fixed label-propagation baseline scored 16/18 under the same graph/label split; it remains a useful practical comparison, not a reason to tune these networks against exposed assessment answers."}</Prose>

<Prose>{"The code also removes edge (0,1) after fitting, holds the original degree/clustering inputs fixed and recomputes each model's explicit graph operators. This isolates propagation, distances or return-feature paths without claiming to erase every trace of topology. The set-attention model is exactly unchanged because it receives the same feature table and no other graph input. The other changes can be small: for the seed-11 distance model, the largest assessment probability change is about .0001265. Sensitivity is not guaranteed to be large merely because a pathway exists."}</Prose>

<H3>{"Build the local/global composition, then use GPSConv"}</H3>

<Prose>{"Packing must keep graph boundaries even when edges already do."}</Prose>

<div data-flow-view="D43"><GPSPackingView/></div>

<Prose>{"Graphs A/B/C have3/2/1 nodes, with C an isolate. Four scalar features occupy each row; the fourth is a stored return probability, not a physical coordinate. Global attention must use the batch membership independently of local edge indices. Packed IDs and edge offsets identify source/receiver ownership."}</Prose>

<div data-flow-view="D44"><GPSBoundaryView/></div>

<Prose>{"With correct graph IDs, a feature edit in B cannot enter A/C's global support. Missing IDs permit cross-graph donation. A consistent within-graph permutation moves features, edge indices and row IDs together; a sorted dense-batch utility may require grouping before its call and an inverse permutation afterward."}</Prose>

<div data-flow-view="D45"><GPSResidualView/></div>

<Prose>{"PyG's local branch is x+local(x), and its global branch is x+global(x); their sum has 2x+local+global before the final MLP residual. Ports keep both x wires visible. This exact norm=None/dropout0 boundary can be compared between per-graph and batched evaluation; training BatchNorm would couple statistics and requires a different claim."}</Prose>

<Prose>{"The earlier real-data study deliberately isolates distance bias and random-walk features; it is not GPS. Now compose the two routes GPS makes explicit: one local graph update and one graph-wide attention read. Reuse "}<a href={"/learn/path/full-curriculum/message-passing-graph-convolutions-gcn-gat-graphsage?module=deep-learning-fundamentals#6-a-complete-experiment-on-an-observed-network"}>{"Message Passing's sparse GCN and edge convention"}</a>{". The preceding lesson develops and executes that sparse layer. Its "}<a href={"/learn-code/graph-transformers-geometric-deep-learning/graph_library_bridge.py"}>{"complete helper"}</a>{" is supplied with the "}<a href={"/learn-code/graph-transformers-geometric-deep-learning/gps_library_bridge.py"}>{"GPS composition program"}</a>{"; place both files in the same directory when running them."}</Prose>

<Prose>{"Our comparison holds normalization and dropout off to expose composition. The two branches each carry their own residual:"}</Prose>

<div className="neural-equation"><MathBlock>{"h=(x+\\operatorname{GCN}(x))+(x+\\operatorname{Attention}_{graph}(x)),\\qquad y=h+\\operatorname{MLP}(h)."}</MathBlock></div>

<Prose>{"There are "}<strong>{"two copies of x in the sum"}</strong>{", not one. Replacing this with "}<code>{"x + local + global"}</code>{" is a different function. "}<code>{"LocalGlobalBlock"}</code>{" writes these operations directly. Its global attention reuses the projections/mixing taught in "}<a href={"/learn/path/full-curriculum/self-attention-multi-head-attention?module=deep-learning-fundamentals#5-implement-the-operation-you-just-traced"}>{"Self-Attention §5"}</a>{"; rebuilding that primitive here would obscure the new graph-level boundary. The complete paired program copies every local, attention and MLP parameter into "}<code>{"GPSConv(norm=None, dropout=0, heads=2, attn_type=\"multihead\")"}</code>{". "}<a href={"https://pytorch-geometric.readthedocs.io/en/2.8.0/_modules/torch_geometric/nn/conv/gps_conv.html"}>{"The PyG source"}</a>{" is the contract for this concrete composition."}</Prose>

<Prose>{"Each node receives three declared scalar features plus its two-step return probability. These structural scalars move with a node under relabeling. They are "}<strong>{"not spatial vector coordinates"}</strong>{" and need no rotation matrix. "}<code>{"Batch.from_data_list"}</code>{" offsets each graph's edge indices and supplies its node-to-graph vector. The manual block reads one graph at a time; PyG pads graphs for its global attention and masks padding. A missing batch vector would let all five nodes communicate as one graph, even though local edge indices still contain no cross-graph edge."}</Prose>

<Prose>{"Run "}<code>{"python gps_library_bridge.py"}</code>{" with PyTorch and "}<code>{"torch-geometric==2.8.0.post1"}</code>{". This route was executed on 27 September 2026 with PyTorch 2.14.0 CPU and PyG 2.8.0.post1. The checks establish: manual and package outputs/gradients/one SGD update agree within the supplied tolerances; the three-node and two-node graph outputs agree whether evaluated separately or together; editing graph B cannot change graph A; consistently relabeling nodes, structural features and edges relabels outputs. An additional executed case adds a third, isolated graph: its output stays fixed when graph B changes with the proper batch vector, and changes when that vector is omitted. These are value, derivative and communication checks; no training-quality or runtime measurement is inferred."}</Prose>

<Program file="gps_library_bridge.py"/><Program file="graph_library_bridge.py"/><SupportingFiles/>

<Prose>{"Why disable normalization here? The package's default batch normalization shares batch statistics during training, so independently evaluating a graph and evaluating it in a batch need not produce the same answer. "}<code>{"norm=None"}</code>{" isolates the intended communication relation. Later choose per-node LayerNorm, per-graph normalization or BatchNorm deliberately and revise the corresponding invariance test. Dropout also changes the comparison unless modes and random masks match."}</Prose>

<Prose>{"The local route stores edges, while dense global attention still incurs pairwise work inside each graph. The manual per-graph loop avoids cross-graph N_total² storage; PyG's padded route can pay for the largest graph in a batch. Batch similarly sized graphs or choose a justified alternative attention backend when padding dominates. The small loop is a correctness composition, not an accelerator benchmark."}</Prose>

<Prose>{""}<strong>{"Take control."}</strong>{" Add a third graph containing one isolated node. Then intentionally omit the batch vector in the package call and compare that node's output after editing a feature in another graph."}</Prose>

<details><summary>Hint</summary>The self-looped local update works for an isolate. Global attention needs a graph boundary independently of edge boundaries.</details>

<details><summary>Solution and success criteria</summary>With the correct batch vector, all three separate outputs concatenate to the batched result. Without it, the global branch can read every node and the isolated graph's output can change. Restore the vector; then relabel nodes within each graph and verify output equivariance. Arbitrarily interleaving graph IDs may violate a dense-batching utility's sorted-ID contract, so group nodes by graph and keep the inverse permutation for restoring the application order.</details>

<H2>{"9. Deeper: choose outputs that match geometry and physics"}</H2>

<H3>{"Chirality and reflection"}</H3>

<Prose>{"An ordered geometric relation can carry information all pair distances omit."}</Prose>

<div data-flow-view="D46"><ChiralityView/></div>

<Prose>{"Keep x0=(0,0,0),x1=(1,0,0),x2=(0,1,0),x3=(0,0,h), with h∈[-2,2]. In role order01/02/03/12/13/23, squared distances are [1,1,h²,2,1+h²,1+h²]. Both x-reflection and swap 1/2 preserve every named entry here. Each alone changes χ=h to−h; both give h. At h=.7 the table is [1,1,.49,2,1.49,1.49], and h=0 gives a planar determinant0. Reset restores h 1/reflection on/swap off. A reflection moves fixed roles physically; swapping reassigns two roles on the same point set. The numerical null does not make these actions identical."}</Prose>

<Prose>{"A separate static asymmetric example uses x2=(0,2,0),h=.7. Its table [1,4,.49,5,1.49,4.49] becomes [4,1,.49,5,4.49,1.49] under swap, while χ goes1.4→−1.4. This is a changed fixture, not the old lab. A sorted distance multiset cannot reveal its reassigned named pairs."}</Prose>

<Prose>{"Distances alone cannot distinguish a configuration from its mirror image. For four ordered, distinguishable points define"}</Prose>

<div className="neural-equation"><MathBlock>{"\\chi=\\det[x_1-x_0,\\;x_2-x_0,\\;x_3-x_0]."}</MathBlock></div>

<Prose>{"Translation cancels; a proper rotation preserves χ; a reflection reverses its sign. The unit-axis tetrahedron gives +1 and its x-reflection gives −1. This is six times oriented volume, with cubed-length units. Swapping two of the ordered points also reverses the sign. A chirality feature therefore needs chemically meaningful roles or a suitable permutation-consistent construction, not arbitrary index ordering."}</Prose>

<Prose>{"A reflection-sensitive target may need information that an E(3)-invariant scalar model discards. But not every molecular property should distinguish enantiomers in every environment. A chiral environment must be represented when its interaction matters. Requiring a physically incorrect symmetry can make the target impossible to learn; omitting a useful symmetry can increase the burden on data. Evaluate the specific target and inputs."}</Prose>

<H3>{"An energy-derived force adds another contract"}</H3>

<Prose>{"A compatible vector output does not yet promise a conservative force. Build the energy first and follow its derivative."}</Prose>

<div data-flow-view="D47"><EnergyView/></div>

<Prose>{"The triangle (0,0,0),(1,0,0),(0,2,0) has three unordered pairs with squared distances1,4,5. At spring coefficient 1, pair energies .5/2/2.5 sum 5. For a pair, differentiating its relative-coordinate squared norm gives opposite endpoint forces; summing yields(1,2,0),(−2,2,0),(1,−4,0). The reverse wire carries a derivative, not another forward value."}</Prose>

<div data-flow-view="D48"><DifferenceView/></div>

<Prose>{"For a chosen coordinate, evaluate E(X+h e) and E(X−h e), subtract/divide by 2h, then negate. Compare against the analytic current coordinate result. h controls truncation and floating cancellation; no monotone error claim follows from making it smaller. Whole translation and proper rotation test different force-action consequences. The program below explicitly keeps the graph of differentiation for a force-target loss."}</Prose>

<Prose>{""}<code>{"energy"}</code>{" counts every unordered pair once. "}<code>{"analytic_force"}</code>{" sums relative vectors, "}<code>{"central_force"}</code>{" evaluates shifted energies and ordinary autograd forms the negative gradient. For this fixture the half-squared force loss is 15 and its spring derivative 30. Changing the spring coefficient to .4 scales the force; its units are energy/length², and force units are energy/length."}</Prose>

<CodeBlock language="python" filename="energy_force_bridge.py" downloadUrl="/learn-code/graph-transformers-geometric-deep-learning/energy_force_bridge.py">{"\"\"\"Pair energy, analytic force, central difference and differentiable force loss.\"\"\"\nimport torch\n\n\ndef energy(positions,spring):\n    edges=torch.triu_indices(len(positions),len(positions),offset=1)\n    relative=positions[edges[0]]-positions[edges[1]]\n    return .5*spring*relative.square().sum()\n\n\ndef analytic_force(positions,spring):\n    relative=positions[:,None]-positions[None,:]\n    return -spring*relative.sum(1)\n\n\ndef central_force(positions,spring,step):\n    result=torch.zeros_like(positions)\n    for point in range(len(positions)):\n        for coordinate in range(3):\n            offset=torch.zeros_like(positions)\n            offset[point,coordinate]=step\n            result[point,coordinate]=-(energy(positions+offset,spring)-\n                                      energy(positions-offset,spring))/(2*step)\n    return result\n\n\ndef main():\n    positions=torch.tensor([[0.,0.,0.],[1.,0.,0.],[0.,2.,0.]],dtype=torch.float64,requires_grad=True)\n    spring=torch.tensor(1.,dtype=torch.float64,requires_grad=True)\n    total=energy(positions,spring)\n    force=-torch.autograd.grad(total,positions,create_graph=True)[0]\n    expected=analytic_force(positions,spring)\n    torch.testing.assert_close(force,expected,atol=1e-12,rtol=1e-12)\n    difference=central_force(positions.detach(),spring.detach(),1e-5)\n    torch.testing.assert_close(force,difference,atol=1e-8,rtol=1e-8)\n    # create_graph keeps the force operation differentiable for a force target.\n    force_loss=.5*force.square().sum()\n    spring_gradient=torch.autograd.grad(force_loss,spring)[0]\n    print('energy:',float(total.detach()))\n    print('force:',force.detach().tolist())\n    print('net force:',force.sum(0).detach().tolist())\n    print('central difference maximum error:',float((force-difference).abs().max().detach()))\n    print('force loss and spring gradient:',float(force_loss.detach()),float(spring_gradient))\n    print('changed spring .4 force:',analytic_force(positions.detach(),.4).tolist())\n\n\nif __name__=='__main__':\n    main()"}</CodeBlock>

<CodeBlock kind="output" language="text" filename="energy_force_bridge.py.stdout.txt">{"energy: 5.0\nforce: [[1.0, 2.0, -0.0], [-2.0, 2.0, -0.0], [1.0, -4.0, -0.0]]\nnet force: [0.0, 0.0, 0.0]\ncentral difference maximum error: 3.78578279836006e-11\nforce loss and spring gradient: 15.0 30.0\nchanged spring .4 force: [[0.4, 0.8, -0.0], [-0.8, 0.8, -0.0], [0.4, -1.6, -0.0]]"}</CodeBlock>

<Prose>{"If a differentiable scalar energy E(X) is invariant under rigid motions, forces defined by Fᵢ=−∇ₓᵢE transform as polar vectors. The chain rule establishes their rotational behavior. Translation invariance additionally gives zero total internal force when all relevant positions are included. Rotational invariance similarly constrains total torque under the smooth isolated-system assumptions."}</Prose>

<Prose>{"Use a constructed spring-like energy E=½Σᵢ<ⱼ‖xᵢ−xⱼ‖², in declared arbitrary units. For our triangle E=5, and the forces are (1,2,0), (−2,2,0), (1,−4,0). They sum to zero. The program checks them against central finite differences, with maximum error about 3.8×10⁻¹¹ at its stated step. This is a mathematical force example, not a fitted molecular potential."}</Prose>

<Prose>{"A directly predicted equivariant vector field need not be the gradient of a scalar energy and need not conserve energy during simulation. Even exact energy gradients require an appropriate numerical integrator; equivariance is not a substitute for conservation, stability or empirical validation."}</Prose>

<H3>{"Beyond scalar and vector states"}</H3>

<Prose>{"The next output is a matrix, so do not call all its entries one vector type."}</Prose>

<div data-flow-view="D49"><TensorView/></div>

<Prose>{"For v=(1,2,0),u=(0,1,3), M=vuᵀ is [[0,1,3],[0,2,6],[0,0,0]]. Its trace 2 gives scalar (2/3)I. The antisymmetric part(M−Mᵀ)/2 has three independent entries, related to the axial vector v×u=(6,−3,1). The remaining symmetric traceless part(M+Mᵀ)/2−(2/3)I has five independent entries. Adding all three recovers every original entry:9=1+3+5. A symmetric matrix alone has 6=1+5; only its traceless part is the five-dimensional degree 2 block."}</Prose>

<Prose>{"Input vector/component/value editors retain all six finite coordinates[-3,3]. The following always-visible motion view has an action selector, and the following product-entry view has one nine-entry selector. They share inputs without hiding teaching or deleting unselected entries. Proper Q and reflection each give M′=QMQᵀ. The axial relation includes det(Q); scalar trace does not."}</Prose>

<Prose>{"e3nn's FullTensorProduct('1o','1o') returns 0e+1e+2e with nine coordinates and zero learned weights. Its coefficients use a normalized representation basis, not row-major matrix entries. Evaluate the nine Cartesian unit products to form a change-of-basis matrix C, then reconstruct vec(M)=coefficients C⁻¹. This explicit map also gives a gradient comparison for both input vectors. CartesianTensor('ij=ji') supplies the symmetry-aware six-coordinate route; converting back returns(M+Mᵀ)/2, not the original nonsymmetric matrix."}</Prose>

<div data-flow-view="D50"><TypedScoreView/><TypedValueView/><TypedEdgeFilterView/></div>

<Prose>{"Query(1,0,0) against keys(1,0,0)/(0,1,0) gives scores1/0 and weights e/(e+1),1/(e+1), approximately .7310586/.2689414. With polar values (1,0,0)/(0,2,0), the output is(.7310586,.5378828,0). With ST values diag(1,−1,0)/diag(0,1,−1), the output is diag(.7310586,−.4621172,−.2689414). A common orthogonal motion leaves the dot-product scores and weights invariant while carrying vector/tensor outputs through Q and Q(·)Qᵀ. Query(0,1,0) reverses the score ordering. Independent donor permission acts before the denominator; empty support is undefined."}</Prose>

<Prose>{"A directional filter supplies another representation: a radial invariant scalar times a relative unit direction. In the small drawing, r=(1,2,0), r²=5 and two chosen map values w=.5, b=−1 give z=w r²+b=1.5. Its sigmoid σ(1.5) multiplies all three components of r/√5 before the outer product with the current donor vector. The weight has inverse length² units; the bias and sigmoid are dimensionless. These are illustrative parameter values, not a fitted full SE(3)-Transformer. At r=0 that chosen unit-direction operation needs a stated zero/skip policy, unlike 1/(1+r²). Spherical harmonics and tensor-product rules combine transforming types; the bounded product/read here is not a full SE(3)-Transformer."}</Prose>

<Prose>{"The executed ordinary route uses e3nn 0.6.0 with PyTorch 2.14 CPU. It reconstructs the Cartesian product, verifies both input derivatives and proper/reflected actions, converts the symmetric part and computes the typed attention result. The basis conversion is printed so coefficient order and normalization stay inspectable. No trainable tensor-product weights are invented."}</Prose>

<CodeBlock language="python" filename="typed_geometric_bridge.py" downloadUrl="/learn-code/graph-transformers-geometric-deep-learning/typed_geometric_bridge.py">{"\"\"\"Cartesian tensor products, explicit e3nn basis conversion and typed attention.\n\nRequires torch and e3nn. The full tensor product has no learned weights.\n\"\"\"\nimport math\nimport torch\nimport e3nn\nfrom e3nn import o3\nfrom e3nn.io import CartesianTensor\n\n\ndef decompose(matrix):\n    scalar = matrix.diagonal(dim1=-2,dim2=-1).sum(-1)[...,None,None]/3\n    scalar = scalar*torch.eye(3,dtype=matrix.dtype,device=matrix.device)\n    axial = (matrix-matrix.transpose(-1,-2))/2\n    traceless = (matrix+matrix.transpose(-1,-2))/2-scalar\n    return scalar, axial, traceless\n\n\ndef cartesian_conversion(tensor_product):\n    # Nine Cartesian unit products make the coefficient convention explicit.\n    # A row c_ij contains TP(e_i,e_j). Thus vec(M) C = coefficients, and\n    # coefficients C^{-1} reconstructs Cartesian row-major entries.\n    eye=torch.eye(3,dtype=torch.float64)\n    coefficients=torch.stack([tensor_product(a,b) for a in eye for b in eye])\n    return torch.linalg.solve(coefficients,torch.eye(9,dtype=torch.float64))\n\n\ndef typed_read(query,keys,vector_values,tensor_values,permitted):\n    scores=keys@query\n    if not permitted.any():\n        return None\n    maximum=scores[permitted].max()\n    masses=torch.where(permitted,torch.exp(scores-maximum),0.)\n    weights=masses/masses.sum()\n    vector=(weights[:,None]*vector_values).sum(0)\n    tensor=(weights[:,None,None]*tensor_values).sum(0)\n    return weights,vector,tensor\n\n\ndef main():\n    torch.set_default_dtype(torch.float64)\n    torch.set_num_threads(1)\n    tp=o3.FullTensorProduct('1o','1o').double()\n    conversion=cartesian_conversion(tp)\n    v=torch.tensor([1.,2.,0.],requires_grad=True)\n    u=torch.tensor([0.,1.,3.],requires_grad=True)\n    matrix=v[:,None]*u[None,:]\n    reconstructed=(tp(v,u)@conversion).reshape(3,3)\n    torch.testing.assert_close(matrix,reconstructed,atol=1e-12,rtol=1e-12)\n    scalar,axial,traceless=decompose(matrix)\n    torch.testing.assert_close(scalar+axial+traceless,matrix,atol=1e-12,rtol=1e-12)\n    probe=torch.tensor([[.2,-.7,.3],[.4,.8,-.2],[.6,.1,-.5]])\n    a=torch.autograd.grad((matrix*probe).sum(),(v,u),retain_graph=True)\n    b=torch.autograd.grad((reconstructed*probe).sum(),(v,u),retain_graph=True)\n    for x,y in zip(a,b,strict=True):\n        torch.testing.assert_close(x,y,atol=1e-12,rtol=1e-12)\n    symmetric=CartesianTensor('ij=ji')\n    symmetric_coefficients=symmetric.from_cartesian(matrix)\n    symmetric_return=symmetric.to_cartesian(symmetric_coefficients)\n    torch.testing.assert_close(symmetric_return,(matrix+matrix.T)/2,atol=1e-12,rtol=1e-12)\n    angle=math.radians(37)\n    q=torch.tensor([[math.cos(angle),-math.sin(angle),0.],\n                    [math.sin(angle),math.cos(angle),0.],[0.,0.,1.]])\n    reflections=[q,q@torch.diag(torch.tensor([-1.,1.,1.]))]\n    query=torch.tensor([1.,0.,0.])\n    keys=torch.tensor([[1.,0.,0.],[0.,1.,0.]])\n    vectors=torch.tensor([[1.,0.,0.],[0.,2.,0.]])\n    tensors=torch.stack((torch.diag(torch.tensor([1.,-1.,0.])),\n                         torch.diag(torch.tensor([0.,1.,-1.]))))\n    allowed=torch.tensor([True,True])\n    weights,vector,tensor=typed_read(query,keys,vectors,tensors,allowed)\n    for motion in reflections:\n        moved=tp(motion@v,motion@u)\n        irreps_motion=tp.irreps_out.D_from_matrix(motion)\n        torch.testing.assert_close(moved,irreps_motion@tp(v,u),atol=1e-10,rtol=1e-10)\n        moved_cartesian=(moved@conversion).reshape(3,3)\n        torch.testing.assert_close(moved_cartesian,motion@matrix@motion.T,atol=1e-12,rtol=1e-12)\n        moved_read=typed_read(motion@query,keys@motion.T,vectors@motion.T,\n                              motion@tensors@motion.T,allowed)\n        torch.testing.assert_close(moved_read[0],weights,atol=1e-12,rtol=1e-12)\n        torch.testing.assert_close(moved_read[1],motion@vector,atol=1e-12,rtol=1e-12)\n        torch.testing.assert_close(moved_read[2],motion@tensor@motion.T,atol=1e-12,rtol=1e-12)\n    print('e3nn:',e3nn.__version__,'output:',str(tp.irreps_out),'weights:',tp.weight_numel)\n    print('outer product:',matrix.tolist())\n    print('scalar/antisymmetric/ST:',[x.tolist() for x in (scalar,axial,traceless)])\n    print('symmetric coordinates:',symmetric.dim,'ST coordinates:',5)\n    print('conversion matrix:',conversion.tolist())\n    print('both input gradients:',[x.tolist() for x in b])\n    print('reconstruction and proper/reflected actions: matched')\n    print('typed attention weights/vector/tensor:',weights.tolist(),vector.tolist(),tensor.tolist())\n\n\nif __name__=='__main__':\n    main()"}</CodeBlock>

<CodeBlock kind="output" language="text" filename="typed_geometric_bridge.py.stdout.txt">{"e3nn: 0.6.0 output: 1x0e+1x1e+1x2e weights: 0\nouter product: [[0.0, 1.0, 3.0], [0.0, 2.0, 6.0], [0.0, 0.0, 0.0]]\nscalar/antisymmetric/ST: [[[0.6666666666666666, 0.0, 0.0], [0.0, 0.6666666666666666, 0.0], [0.0, 0.0, 0.6666666666666666]], [[0.0, 0.5, 1.5], [-0.5, 0.0, 3.0], [-1.5, -3.0, 0.0]], [[-0.6666666666666666, 0.5, 1.5], [0.5, 1.3333333333333335, 3.0], [1.5, 3.0, -0.6666666666666666]]]\nsymmetric coordinates: 6 ST coordinates: 5\nconversion matrix: [[0.5773502691896258, 0.0, 0.0, 0.0, 0.5773502691896257, 0.0, 0.0, 0.0, 0.5773502691896258], [0.0, 0.0, 0.0, 0.0, 0.0, 0.7071067811865476, 0.0, -0.7071067811865476, 0.0], [-0.0, -0.0, -0.7071067811865476, -0.0, -0.0, -0.0, 0.7071067811865476, -0.0, -0.0], [-0.0, 0.7071067811865476, -0.0, -0.7071067811865476, -0.0, -0.0, -0.0, -0.0, -0.0], [0.0, 0.0, 0.7071067811865476, 0.0, 0.0, 0.0, 0.7071067811865476, 0.0, 0.0], [0.0, 0.7071067811865475, 0.0, 0.7071067811865475, 0.0, 0.0, 0.0, 0.0, 0.0], [-0.4082482904638631, -0.0, -0.0, -0.0, 0.8164965809277259, -0.0, -0.0, -0.0, -0.4082482904638631], [0.0, 0.0, 0.0, 0.0, 0.0, 0.7071067811865475, 0.0, 0.7071067811865475, 0.0], [-0.7071067811865476, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.7071067811865476]]\nboth input gradients: [[0.19999999999999996, 0.19999999999999996, -1.4], [0.9999999999999999, 0.9000000000000002, -0.10000000000000009]]\nreconstruction and proper/reflected actions: matched\ntyped attention weights/vector/tensor: [0.7310585786300049, 0.2689414213699951] [0.7310585786300049, 0.5378828427399902, 0.0] [[0.7310585786300049, 0.0, 0.0], [0.0, -0.4621171572600098, 0.0], [0.0, 0.0, -0.2689414213699951]]"}</CodeBlock>

<Prose>{"A three-component vector rotates through a 3×3 representation matrix. More general features can transform in irreducible blocks: for SO(3), a degree-ℓ block has 2ℓ+1 components. ℓ=0 is a scalar, ℓ=1 is vector-like and ℓ=2 can encode a symmetric traceless rank-two tensor with five independent components. A general 3×3 matrix has nine components and is not just one ℓ=2 block."}</Prose>

<Prose>{""}<a href={"https://arxiv.org/abs/2006.10503"}>{"SE(3)-Transformers"}</a>{" combine invariant attention weights with appropriately transforming features. Spherical harmonics encode directions; tensor-product rules combine representation types without treating arbitrary Cartesian components as unrelated scalars. "}<a href={"https://docs.e3nn.org/en/stable/api/o3/o3_irreps.html"}>{"e3nn's representation documentation"}</a>{" makes rotation degree and reflection parity explicit. These are additional representational tools, not a universal speed or accuracy ranking over EGNN."}</Prose>

<H2>{"10. Applications and engineering decisions"}</H2>

<Prose>{"The coordinate and typed-output rules become useful when the problem supplies frames or an anchored environment."}</Prose>

<div data-flow-view="D51"><FramePointsView/><FrameMotionView/></div>

<Prose>{"Use receiver R_i=90°z,t_i=(2,0,0), donor R_j=−90°z,t_j=(0,2,0). Local points q_i=(1,0,0),k_j=(0,1,0) become global q=(2,1,0),k=(1,2,0), distance²2. A supplied .25/.75 mixture is o=(1.25,1.75,0); the receiver inverse R_iᵀ(o−t_i)=(1.75,.75,0). The return wire belongs to the receiver frame, not the donor's. Under a common proper rigid motion, Q∈SO(3) and translation t, frames become Q R and Q t_origin+t; the global mixture moves consistently and inverse cancellation preserves the local output. This fixed mixture is an explained frame operation, not learned IPA or protein folding. "}<code>{"frame_mix"}</code>{" in the geometric module writes the ordinary matrix products."}</Prose>

<div data-flow-view="D52"><FieldView/></div>

<Prose>{"A target using downward world gravity g=(0,−1,0) can legitimately depend on it. The scene vector x=(1,0,0) is initially orthogonal to g: x·g=0. Rotate x by 90° while holding g fixed and x′·g=−1; carrying both x and g through that rotation keeps their dot product zero. A symmetric covariance has six independent entries: three variances and three mirrored off-diagonal covariances. Its trace part supplies one scalar coordinate, while the symmetric-traceless remainder supplies five. Here Σ=diag(4,1,.5), in length² units; QΣQᵀ rotates its principal directions while retaining eigenvalues 4,1,.5 and trace 5.5. The xy ellipse uses semiaxes √4 and √1; the separate z variance is .5. Transforming g with the scene is a different experiment. Neutral/charged dipoles, molecules, sensors and protein frames each require the relevant inputs and target action, not an architecture name as a guarantee."}</Prose>

<Prose>{""}<strong>{"Molecular property prediction:"}</strong>{" graph connectivity describes bonds; geometric inputs describe conformations. Hold out appropriate molecules or chemical families when the intended claim concerns new chemistry. Near-duplicate conformers across splits can exaggerate generalization. Record target units, whether coordinates are available at prediction time and whether the property is extensive or intensive. A model requiring optimized coordinates cannot silently be compared with one receiving only a bond graph."}</Prose>

<Prose>{""}<strong>{"Protein frames:"}</strong>{" a residue can carry a local coordinate frame. Invariant point attention compares points after placing them in a common global frame; applying one common rigid motion preserves their pairwise distances. Pulling a global weighted point back into a residue's local frame supplies a frame-consistent local quantity. This helps explain the structure module discussed in the "}<a href={"https://geometricdeeplearning.com/book/geometricgraphs.html"}>{"geometric-graphs chapter's AlphaFold 2 case study"}</a>{". It is a design principle, not a claim that this small lesson implements protein folding or that all folding architectures are interchangeable."}</Prose>

<Prose>{""}<strong>{"Sensor and robotic geometry:"}</strong>{" an output displacement should rotate when the entire sensor frame rotates. Yet gravity, walls, camera calibration and fixed world directions can be meaningful inputs. If those are held fixed while the scene rotates, the task may no longer have the same symmetry. Transform the whole relevant input representation or state exactly what remains anchored."}</Prose>

<H3>{"Count the resource, not a universal node cutoff"}</H3>

<div data-flow-view="D53"><PairBudgetView/></div>

<Prose>{"The actual indices are(batch,head,receiver,donor). The editors allow 1–20,000 nodes, 1–16 heads, batches of 1–4 identical graphs and either 2 or 4 bytes per score value. At the offered maximum the product is 102,400,000,000 bytes for this one tensor. This integer fits exactly in the browser number range; it is not measured peak memory or a claim that a machine can allocate it."}</Prose>

<div data-flow-view="D54"><PaddingBudgetView/></div>

<Prose>{"For graphs3/2/1, actual within-graph legal pairs total 9+4+1=14 per head, while padding all three to 3 gives 27 pair slots. Both are separate from the identical-size bound. Tiling can avoid retaining a full score tensor while dense interactions still cost arithmetic; a dense structural-bias tensor can remain quadratic. Edge-local MLP work depends on its width and filters as well as edge count. No universal cutoff or speed ratio follows."}</Prose>

<Prose>{"Materializing H attention heads for one N-node graph in b-byte precision requires HN²b bytes for that tensor. With eight heads and float32, N=1,000 gives 32,000,000 bytes; N=10,000 gives 3,200,000,000 bytes, before other activations or gradients. These are decimal MB/GB, not MiB/GiB. Multiple layers and a batch add more tensors, but exact peak memory depends on saved intermediates and execution strategy."}</Prose>

<Prose>{"Exact tiled attention can avoid retaining the entire score matrix while still performing dense pair interactions. Structural bias tensors and shortest-path preprocessing can remain quadratic even when the attention kernel is memory-efficient. Sparse masks change the allowed computation; kernel-feature methods change or approximate the attention operator; pooling changes the representations. Attention on a coarsened graph is not generally identical to attention on the original graph."}</Prose>

<Prose>{"For local geometric layers, costs depend on edge count, MLP widths, radial features and representation channels. An edge MLP can cost O(d²), so “O(E·d)” is not a complete universal layer estimate. There is no fixed node threshold or fixed EGNN-to-tensor-network speed ratio that settles all choices."}</Prose>

<Prose>{"The current "}<a href={"https://pytorch-geometric.readthedocs.io/en/latest/generated/torch_geometric.nn.conv.GPSConv.html"}>{"PyG GPSConv documentation"}</a>{" places positional/structural encodings in preprocessing and exposes local/global components. An API does not infer the intended encodings or certify the whole action contract for you. Check mask, graph batching, normalization, edge feature and representation conventions with small known examples before scaling."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"11. Practice with new inputs"}</H2>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. A changed remote message — core"}</H3>

<Prose>{"Use the path attention weights (4/7,2/7,1/7), but values (2,0,7). Compute the global output and the one-hop masked output for receiver 0. Explain the difference."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The local read renormalizes the first two weights; it does not simply discard a contribution without renormalizing."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Global output is 15/7. The local weights are (2/3,1/3,0), giving 4/3. The remote value enters globally in one layer; local access forbids that route."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Count walks and probabilities — core"}</H3>

<Prose>{"At the center of a three-node path, what are (A²)₁₁ and (T²)₁₁ without self-loops? Explain why they differ."}</Prose>

<details><summary>Hint</summary>

<Prose>{"There are two choices on the first step, but each endpoint has only one return neighbor."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"There are two length-two returning walks, so the count is 2. Each has probability 1/2×1, so total return probability is 1. A probability feature requires degree normalization."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Find a concealed symmetry failure — core"}</H3>

<Prose>{"Use square readings (1,0,0,0) and W=R from §5. Compare SRx and RSx. Why would the all-ones input have missed the bug?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Track the single nonzero reading through the two operations."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"SRx=(0,0,0,1), while RSx=(0,1,0,0). A constant reading vector is fixed by both permutations, so it supplies no distinguishing input. A matrix commutation identity, rather than that one passing input, establishes an all-input linear contract."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Choose the output action — core"}</H3>

<Prose>{"Rotate a point cloud by 90° around z and translate it by (3,4,0). How should a predicted point (1,0,0), a displacement (1,0,0) and an invariant scalar 5 transform?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Translations act on positions, not on free displacement vectors."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The point becomes (3,5,0), the displacement becomes (0,1,0), and the scalar stays 5. Applying the same numerical transformation to every output type would be wrong."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Interpret the real comparison — core"}</H3>

<Prose>{"A distance-biased model fits 10/10 labels and scores 9/18 on assessment. The set model scores 10/18. Does this establish that graph distances hurt learning? Propose one useful follow-up without tuning repeatedly on those assessment answers."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Separate this small fixed protocol from a general architectural claim."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"It establishes the displayed outcomes for these models, features, labels and training budget. Investigate fitting/development behavior, input features and errors, then evaluate a justified new comparison on fresh appropriate held-out data. Preserve a strong simple baseline. Neither one-point difference nor perfect fitting supports a universal ranking."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Repair an eigenspace claim — deeper"}</H3>

<Prose>{"A connected graph has a repeated nonzero Laplacian eigenvalue. A colleague flips each eigenvector so its first nonzero entry is positive and declares all ambiguity removed. Give the missing transformation and a basis-invariant representation of the entire eigenspace."}</Prose>

<details><summary>Hint</summary>

<Prose>{"An orthogonal rotation can mix the columns while preserving the same subspace."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"U and UQ are both valid orthonormal bases for any orthogonal Q within the repeated eigenspace. Sign fixing does not remove that freedom and an index-based sign rule can itself conflict with relabeling. UUᵀ is unchanged by U→UQ; under node permutation it becomes PUUᵀPᵀ. A truncated portion of a repeated eigenspace is not the same complete object."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Verify a force and its units — deeper"}</H3>

<Prose>{"For two points (0,0,0) and (2,0,0), use E=½‖x₀−x₁‖² with unit spring coefficient. Compute E and both forces. What happens under a common translation? What extra claim does a conservative energy-derived force make beyond equivariance?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Differentiate with respect to each point, with the force defined as the negative gradient."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"E=2; forces are (2,0,0) and (−2,0,0). Common translation changes neither differences, energy nor forces. A force derived from a smooth scalar potential has the corresponding conservative structure; a general equivariant vector predictor need not. For physical units, the spring coefficient carries energy/length² and force has energy/length units. Numerical time stepping still needs its own accuracy/stability analysis."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Build a complete action test — deeper"}</H3>

<Prose>{"Design a test for a geometric graph model with scalar node states, coordinates and vector outputs. Include a genuine null, a failing control and one independent prediction-quality test."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Transform input and output representations correctly, and do not confuse algebraic agreement with a useful prediction."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Permute nodes and both adjacency axes, and apply a valid orthogonal transformation plus translation to coordinates. Scalars follow nodes; vector outputs rotate without translation. Compare both routes with a scale-aware tolerance and check the transformation matrix itself. Identity is a null; a coordinatewise ReLU or axis-dependent edge rule supplies a controlled failing case on a non-symmetric input. Separately score appropriate held-out targets with declared units and split boundaries. A zero or constant predictor can pass a symmetry check while predicting poorly."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Reconstruct a typed product — deeper"}</H3>

<Prose>{"Use v=(1,2,0),u=(0,1,3), then change v to(−1,1,2). Form the outer product and its scalar/antisymmetric/ST parts, reconstruct all entries and reflect x. Explain why symmetric 6 differs from general 9."}</Prose>

<details><summary>Hint</summary>Use trace(M)I/3, then separate transpose-even and transpose-odd parts. Reflection acts on both vectors.</details>

<details><summary>Solution</summary>The changed matrix is [[0,−1,−3],[0,1,3],[0,2,6]], trace 7, scalar 7I/3. Its antisymmetric part is [[0,−.5,−1.5],[.5,0,.5],[1.5,−.5,0]]. The ST part is the symmetric average minus 7I/3; adding all parts exactly recovers M. Dot product 7 and cross(1,3,−1) encode the scalar/axial connections. Reflection preserves trace, carries cross through det(Q)Q and conjugates M by Q. A symmetric matrix removes the antisymmetric 3 dimensions, leaving 1+5. Convert representation coordinates before comparing an e3nn coefficient array with Cartesian entries.</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"10. Follow a frame inverse — deeper"}</H3>

<Prose>{"Use the displayed receiver/donor frames and supplied .25/.75 mixture. Apply common 37°z and translation(3,−2,1). Compute the original global points/distance/mixture/local return, then explain what changes and what stays fixed. What assumption changes if world gravity is held fixed?"}</Prose>

<details><summary>Hint</summary>Place both local points globally, mix them there, and subtract the receiver origin before its inverse rotation.</details>

<details><summary>Solution</summary>q=(2,1,0),k=(1,2,0),distance²2,o=(1.25,1.75,0),receiver local return (1.75,.75,0). Common motion sends each global point and o through Q(·)+t. Because the weights sum 1 and both origins/frames transform, R_iᵀQᵀ[Qo+t−(Qt_i+t)] equals the old local return. Holding gravity fixed does not perform this common transformation on every relevant input; scene symmetry alone may no longer match the target. The fixed mixture establishes this bounded arithmetic, not a learned IPA system.</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"11. Preserve a graph boundary — deeper"}</H3>

<Prose>{"Pack A/B/C with 3/2/1 nodes and copied norm=None/dropout0 GPS state. Edit a scalar in B; compare correct membership versus omitted membership, then consistently relabel within graphs. Count valid versus padded pairs per head."}</Prose>

<details><summary>Hint</summary>Local edge offsets and global attention membership are independent boundaries. Check every residual input rail.</details>

<details><summary>Solution</summary>Correct graph membership leaves A/C unchanged by the B edit, because each branch's communication stays inside its graph. Omitted membership permits the global branch to read B. Restoring sorted grouping and its inverse preserves semantic outputs after relabeling. The sum before the MLP is 2x+local+global; removing one x changes the tested function. There are 14 legal pairs but27 padded slots per head. Train BatchNorm can couple batch statistics even when attention support is correct; the stated normalization assumption is essential. Reproduce values/derivatives with the supplied complete program rather than claiming a new prediction-quality result.</details></div></section>

<section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning"><H2>{"Further learning"}</H2>

<ul><li>{""}<a href={"https://geometricdeeplearning.com/book/"}>{"Geometric Deep Learning book and free draft chapters"}</a>{": Chapters 3,5 and 8 connect actions, graphs and geometric graphs. Use the chapter route matching your current hurdle; the whole book is not a prerequisite for this lesson."}</li><li>{""}<a href={"https://geometricdeeplearning.com/lectures/"}>{"The authors' GDL lecture recordings and exercises"}</a>{": Geometric Priors I/II and Graphs & Sets I/II offer a spoken/visual alternative; the site links each YouTube recording and accompanying material."}</li></ul></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references"><H2>{"Technical references"}</H2>

<ul><li>{""}<a href={"https://arxiv.org/pdf/2106.05234"}>{"Graphormer"}</a>{", §3: compare the three structural inputs with our deliberately smaller distance-bias model. "}<a href={"https://arxiv.org/pdf/2205.12454"}>{"GPS"}</a>{", §3/Figure 1: trace local and global branches and note how its encoding choices also help message passing."}</li><li>{""}<a href={"https://arxiv.org/html/2202.13013v4"}>{"SignNet and BasisNet"}</a>{", §2: follow the sign-versus-basis distinction after reproducing the four-cycle projector."}</li><li>{""}<a href={"https://proceedings.mlr.press/v139/satorras21a/satorras21a.pdf"}>{"EGNN"}</a>{", §3 and Appendix A: read the invariant messages and coordinate proof together, then identify the assumptions in your own code."}</li><li>{""}<a href={"https://arxiv.org/abs/2006.10503"}>{"SE(3)-Transformers"}</a>{" and "}<a href={"https://docs.e3nn.org/en/stable/api/o3/o3_irreps.html"}>{"e3nn representations"}</a>{": a deeper route into feature types and reflection parity."}</li></ul>

<Prose>{""}<a href={"https://arxiv.org/pdf/2106.05234"}>{"Graphormer"}</a>{", "}<a href={"https://arxiv.org/pdf/2205.12454"}>{"GPS"}</a>{", "}<a href={"https://arxiv.org/pdf/2102.09844"}>{"EGNN"}</a>{", "}<a href={"https://arxiv.org/abs/2006.10503"}>{"SE(3)-Transformers"}</a>{" and "}<a href={"https://www.nature.com/articles/s41586-021-03819-2"}>{"AlphaFold2"}</a>{" are method sources for the separately scoped operations above. Official "}<a href={"https://pytorch-geometric.readthedocs.io/en/latest/_modules/torch_geometric/nn/conv/gps_conv.html"}>{"GPS forward source"}</a>{", "}<a href={"https://docs.e3nn.org/en/stable/api/o3/o3_tp.html"}>{"e3nn FullTensorProduct"}</a>{" and "}<a href={"https://docs.e3nn.org/en/stable/api/io/cartesian_tensor.html"}>{"CartesianTensor"}</a>{" define their API/convention boundaries. The e3nn API pages consulted describe 0.5.1 documentation; the actual executed module is 0.6.0, whose installed behavior is checked by the supplied program. Use the original papers for the full architecture, and the ordinary tool documentation for the executed API conventions."}</Prose></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H2>{"Readiness and next study"}</H2>

<Prose>{"You can trace a node's actual global read, distinguish its structural input from permission, relabel both graph axes, diagnose a false symmetry proof, transform the right physical output type and modify the scalar-message layer without dropping its action. You can also interpret the retained weak assessment honestly and protect GPS graph boundaries. The deeper transfers ask you to reconstruct a tensor, follow a force derivative and carry a local point through two frames."}</Prose>

<Prose>{"Next in this module is "}<a href={"/learn/path/full-curriculum/boltzmann-machines-restricted-boltzmann-machines-rbm?module=deep-learning-fundamentals"}>{"Boltzmann Machines & Restricted Boltzmann Machines (RBM)"}</a>{". An invariant physical energy is a scalar; using an energy to assign probabilities to configurations is another construction. Keep architectural properties, optimization and measured prediction evidence separate there too."}</Prose></section>
</BudgetProvider></FrameProvider></TypedProvider></TensorProvider></ForceProvider></ChiralityProvider></GPSProvider></StudyProvider></UpdateProvider></PhysicalProvider></SquareProvider></SpectrumProvider></WalkProvider></ReadProvider></IdentityProvider></div>};
