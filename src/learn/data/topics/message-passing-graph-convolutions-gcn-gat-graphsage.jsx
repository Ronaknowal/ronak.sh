// Continuous reading-flow lesson; the previous published revision is preserved in its teaching record.
import React from 'react';
import { Prose, H2, H3, CodeBlock } from "../../components/content/index.js";
import { Math as InlineMath, MathBlock } from "../../components/content/Math.jsx";
import { LessonIntro } from "../../components/lesson-labs/LessonElements.jsx";
import { NeuralTable } from "../../components/lesson-labs/NeuralLessonElements.jsx";
import RemoteCodeBlock from "../../components/content/RemoteCodeBlock.jsx";
import "../../components/lesson-labs/neural-lesson-neutral.css";
import "../../components/lesson-labs/lesson-flow.css";
import { MessagePassingPaperAnatomy, MessagePassingDirectionLab as MessagePassingTopologyDirectionLab, MessagePassingStorageLab, MessagePassingContributionLab, MessagePassingSynchronizationLab } from "../../components/lesson-labs/MessagePassingFlowFoundation.jsx";
import { MessagePassingGraphSizeExtension, MessagePassingEdgeStrengthExtension, MessagePassingPairedEdgesExtension, MessagePassingFeatureExtension, MessagePassingOrderExtension, MessagePassingInPlaceExtension, MessagePassingReachExtension, MessagePassingPinExtension, MessagePassingSelfReadsExtension, MessagePassingGcnFeatureExtension, MessagePassingGcnEdgeExtension, MessagePassingGcnLoopsExtension, MessagePassingGcnCoordinatesExtension, MessagePassingBiasExtension, MessagePassingSupervisionExtension, MessagePassingApplyExtension, MessagePassingBasicsExtensionsProvider } from "../../components/lesson-labs/MessagePassingFlowBasicsExtensions.jsx";
import { MessagePassingTaskUnits, MessagePassingNormalizedSumLab, MessagePassingChannelLab, MessagePassingScalarUpdateLab } from "../../components/lesson-labs/MessagePassingFlowConvolution.jsx";
import { MessagePassingSageIntro, MessagePassingSageOwnLab, MessagePassingSageOccurrenceLab, MessagePassingSageWeightsLab, MessagePassingPoolLab, MessagePassingPoolLibraryLab, MessagePassingDirectionLab as MessagePassingAggregationDirectionLab, MessagePassingOrderedLab, MessagePassingMemoryLab, MessagePassingAggregationProvider } from "../../components/lesson-labs/MessagePassingFlowAggregation.jsx";
import { MessagePassingPaperAttentionLab, MessagePassingSenderTermLab, MessagePassingReceiverTermLab, MessagePassingNormalizedReadLab, MessagePassingPaperRead, MessagePassingReturnedValueLab, MessagePassingPermissionLab, MessagePassingHeadsLab, MessagePassingDynamicAttentionLab, MessagePassingContextObjectiveLab, MessagePassingAttentionProvider } from "../../components/lesson-labs/MessagePassingFlowAttention.jsx";
import { MessagePassingTransductiveBoundaryLab, MessagePassingInductiveBoundaryFigure, MessagePassingTemporalBoundaryLab } from "../../components/lesson-labs/MessagePassingFlowBoundaries.jsx";
import { MessagePassingObservedGraphFigure, MessagePassingObservedFeaturesLab } from "../../components/lesson-labs/MessagePassingFlowObserved.jsx";
import { MessagePassingSavedPipelineFigure, MessagePassingRecordedStudyLab } from "../../components/lesson-labs/MessagePassingFlowStudy.jsx";
import { MessagePassingSparseGcnLab, MessagePassingSparseSageFigure, MessagePassingSparseGatFigure, MessagePassingSparseDirectedFigure } from "../../components/lesson-labs/MessagePassingFlowSparse.jsx";
import { MessagePassingSavedFamilyLab, MessagePassingSavedReceiverLab, MessagePassingSavedFeatureLab, MessagePassingSavedEdgeLab, MessagePassingSavedNoEdgesLab, MessagePassingSavedStorageLab } from "../../components/lesson-labs/MessagePassingFlowInspector.jsx";
import { MessagePassingSavedPinLab, MessagePassingSavedResetLab, MessagePassingSavedKnownLabelsFigure } from "../../components/lesson-labs/MessagePassingFlowInspectorComparisons.jsx";
import { MessagePassingPropagationModesLab, MessagePassingPropagationFeatureLab, MessagePassingPropagationEdgeLab, MessagePassingPropagationCoordinates, MessagePassingPropagationRoundsLab, MessagePassingPropagationCoordinateLab, MessagePassingPropagationCounterexamplesLab, MessagePassingFrequencyLab, MessagePassingPolynomialLab, MessagePassingChebyshev, MessagePassingRenormalization, MessagePassingBottleneckLab, MessagePassingInitialResidualLab, MessagePassingOrdinaryResidual, MessagePassingJumpingKnowledge, MessagePassingCompensationLab, MessagePassingScaleLab, MessagePassingWhiteningLab, MessagePassingRoutingLab, MessagePassingDepthReadoutLab, MessagePassingPropagationProvider } from "../../components/lesson-labs/MessagePassingFlowPropagation.jsx";
import { MessagePassingMultisetWorkedLab, MessagePassingMultisetSizeLab, MessagePassingMultisetValueLab, MessagePassingMultisetPermutationLab, MessagePassingDuplicateWorkedLab, MessagePassingSageReductionLab, MessagePassingMultisetReductionLab, MessagePassingGinScalarLab, MessagePassingGinLibraryFigure, MessagePassingRefinementLab, MessagePassingStructuralLimitLab } from "../../components/lesson-labs/MessagePassingFlowExpressiveness.jsx";
import { MessagePassingSamplingDepthLab, MessagePassingSamplingFanoutLab, MessagePassingSamplingReplacementLab, MessagePassingSeededBlocksLab, MessagePassingSamplingBiasLab, MessagePassingIndependentBatchLab, MessagePassingRetainedBatchLab, MessagePassingTypedMessageLab, MessagePassingTypedLibraryFigure, MessagePassingProgramTransportLab, MessagePassingTrafficBoundaryLab } from "../../components/lesson-labs/MessagePassingFlowApplications.jsx";
import { MessagePassingSparseProvider } from "../../components/lesson-labs/MessagePassingSparseState.jsx";
import { MessagePassingExpressivenessProvider } from "../../components/lesson-labs/MessagePassingFlowExpressivenessState.jsx";
import { MessagePassingApplicationsProvider } from "../../components/lesson-labs/MessagePassingFlowApplicationsState.jsx";
import { MessagePassingInspectorProvider } from "../../components/lesson-labs/MessagePassingInspectorState.jsx";
export const sections = [["1-decide-what-the-graph-represents", "1. Decide what the graph represents"], ["2-one-synchronized-message-passing-round", "2. One synchronized message-passing round"], ["3-gcn-a-normalized-weighted-sum", "3. GCN: a normalized weighted sum"], ["4-graphsage-and-gat-change-the-aggregation-decision", "4. GraphSAGE and GAT change the aggregation decision"], ["5-the-data-split-is-part-of-the-graph-model", "5. The data split is part of the graph model"], ["6-a-complete-experiment-on-an-observed-network", "6. A complete experiment on an observed network"], ["7-why-repeated-propagation-can-blur-distinctions", "7. Why repeated propagation can blur distinctions"], ["8-what-aggregation-can-distinguish", "8. What aggregation can distinguish"], ["9-sampling-batching-and-useful-applications", "9. Sampling, batching and useful applications"], ["10-practice-with-changed-examples", "10. Practice with changed examples"], ["11-references-and-another-way-to-learn", "11. References and another way to learn"]];
export default {
  title: 'Message Passing & Graph Convolutions (GCN, GAT, GraphSAGE)',
  readTime: '~150 min read + investigations, programs and practice',
  hasIntegratedGuide: true,
  content: () => <div className="neural-lesson neural-lesson-neutral message-passing-flow-lesson lesson-flow">
    <MessagePassingBasicsExtensionsProvider>
      <MessagePassingAggregationProvider>
        <MessagePassingAttentionProvider>
          <MessagePassingPropagationProvider>
            <MessagePassingSparseProvider>
              <MessagePassingExpressivenessProvider>
                <MessagePassingApplicationsProvider>
                  <MessagePassingInspectorProvider>
                    <LessonIntro prerequisites="Vectors, matrix multiplication, an affine neural layer, activation, supervised loss and one gradient update. The graph objects are introduced here." sections={sections}>Trace permitted information from a paper row through a shared graph layer, then inspect a saved network model.</LessonIntro>
                    <Prose opening="exploration">
                      {""}
                      <strong>
                        {"Explore as you read."}
                      </strong>
                      {" Change a paper's numbers or one permitted relationship and follow the information into its neighbors' new representations. Later, inspect the same operations inside a real saved graph model."}
                    </Prose>
                    <Prose opening="route">
                      {""}
                      <strong>
                        {"First pass:"}
                      </strong>
                      {" read §§1–6, try practice 1–5, then follow the next-study route. Return to the visible deeper branches in §§4 and 7–9 for aggregation variants, spectral reasoning, structural limits and sampling. You need vectors, matrix multiplication, an affine neural layer, activation, supervised loss and one gradient update. The relevant graph objects and notation are introduced here."}
                    </Prose>
                    <Prose>
                      {"The preceding "}
                      <a href={"/learn/path/full-curriculum/interleaved-cross-attention-architectures?module=deep-learning-fundamentals"}>
                        {"Cross-Attention lesson"}
                      </a>
                      {" describes a receiver reading from allowed sources. Here relationships specify the allowed sources, and every source can acquire a new representation too. That connection will help with graph attention; the first neighborhood calculation requires only addition."}
                    </Prose>
                    <H2>
                      {"1. Decide what the graph represents"}
                    </H2>
                    <H3>
                      {"How can relationships help us understand a paper?"}
                    </H3>
                    <Prose>
                      {"Read the picture from its three papers to their number rows, then along the relationships that permit an exchange."}
                    </Prose>
                    <div data-flow-view="D01">
                      <MessagePassingPaperAnatomy />
                    </div>
                    <Prose>
                      {"Paper 0 has the row "}
                      <code>
                        {"(1, 0)"}
                      </code>
                      {", paper 1 has "}
                      <code>
                        {"(2, 1)"}
                      </code>
                      {", and paper 2 has "}
                      <code>
                        {"(4, −1)"}
                      </code>
                      {". Each circle is one paper, called a "}
                      <strong>
                        {"node"}
                      </strong>
                      {". Each entry in its row is a "}
                      <strong>
                        {"feature"}
                      </strong>
                      {": a number available as input. A row with two entries has two "}
                      <strong>
                        {"channels"}
                      </strong>
                      {", so every paper has the same kind of two-number description. These constructed numbers make the arithmetic inspectable; they are not measured word counts or class labels."}
                    </Prose>
                    <Prose>
                      {"The line between papers 0 and 1 is an "}
                      <strong>
                        {"edge"}
                      </strong>
                      {". In this example its label permits messages in both directions. Paper 1 can use paper 0's information, and paper 0 can use paper 1's information. The other edge permits the same exchange between 1 and 2. There is no direct edge between 0 and 2. The collection of nodes and relationships is a "}
                      <strong>
                        {"graph"}
                      </strong>
                      {"."}
                    </Prose>
                    <Prose>
                      {"A model that reads each row independently has no way to use those relationships. A graph layer can form a new row for each paper from its own row and the rows it is allowed to read. That new row is its "}
                      <strong>
                        {"representation"}
                      </strong>
                      {": a numerical description computed from the available context. A later prediction layer can turn the representation into scores for paper subjects."}
                    </Prose>
                    <Prose>
                      {"The larger route in the picture separates those jobs: supplied rows and relationships → updated node representations → task outputs. The graph layer learns how to combine information; it does not receive the desired subject as an input. A citation might help resolve an ambiguous paper, but a relationship can also connect opposing arguments. "}
                      <strong>
                        {"Homophily"}
                      </strong>
                      {" means connected nodes tend to share the particular property of interest. It is a pattern to assess, not an assumption built into the definition of an edge."}
                    </Prose>
                    <Prose>
                      {"In structure drawings, supplied rows are cyan, learned parameters amber, computed rows violet, and operations neutral. Solid arrows carry values forward; later orange dashed arrows carry gradients backward. A numeric grid uses a separate labelled sign rule: warm positive cells, blue negative cells and neutral zeros. The written values and labels carry the meaning as well as colour."}
                    </Prose>
                    <H3>
                      {"Which way does a message travel?"}
                    </H3>
                    <Prose>
                      {"Follow the arrow's source to its receiver, then find the same permission in the matrix and edge list."}
                    </Prose>
                    <div data-flow-view="D02">
                      <MessagePassingTopologyDirectionLab />
                    </div>
                    <Prose>
                      {"In the directed example, the arrow "}
                      <code>
                        {"0 → 1"}
                      </code>
                      {" permits paper 1 to read paper 0. Its source is 0 and its receiver is 1. The arrowhead is at the receiver. Reversing it changes the allowed computation, even though the same papers remain present."}
                    </Prose>
                    <Prose>
                      {"The matrix expresses that permission as a cell. "}
                      <strong>
                        {"Rows name receivers; columns name sources."}
                      </strong>
                      {" Therefore "}
                      <code>
                        {"A[1, 0] = 1"}
                      </code>
                      {" permits "}
                      <code>
                        {"0 → 1"}
                      </code>
                      {". The reversed permission is a different cell, "}
                      <code>
                        {"A[0, 1]"}
                      </code>
                      {". A zero cell means that source does not send to that receiver in this operation. The symbol "}
                      <code>
                        {"A"}
                      </code>
                      {" names this "}
                      <strong>
                        {"adjacency matrix"}
                      </strong>
                      {": a stored table of permitted relationships."}
                    </Prose>
                    <Prose>
                      {"An edge list stores the same information without all the zero cells. Its first row holds source IDs and its second row receiver IDs. The column "}
                      <code>
                        {"(0, 1)"}
                      </code>
                      {" therefore matches "}
                      <code>
                        {"A[1, 0]"}
                      </code>
                      {", not "}
                      <code>
                        {"A[0, 1]"}
                      </code>
                      {". For the original undirected path, store four directed columns: "}
                      <code>
                        {"0 → 1"}
                      </code>
                      {", "}
                      <code>
                        {"1 → 0"}
                      </code>
                      {", "}
                      <code>
                        {"1 → 2"}
                      </code>
                      {", "}
                      <code>
                        {"2 → 1"}
                      </code>
                      {"."}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"A=\\begin{bmatrix}0&1&0\\\\1&0&1\\\\0&1&0\\end{bmatrix},\\qquad\n\\texttt{edge\\_index}=\\begin{bmatrix}0&1&1&2\\\\1&0&2&1\\end{bmatrix}."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"The matrix has three rows and three columns because there are three nodes. The edge list has two rows and four columns because there are four permitted directed messages. IDs select stored objects; they are not node features."}
                    </Prose>
                    <CodeBlock language="python" filename="receiver-row-edge-index.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"import torch\n\nfeatures = torch.tensor([[1., 0.], [2., 1.], [4., -1.]],\n                        dtype=torch.float64)\nedge_index = torch.tensor([[0, 1, 1, 2], [1, 0, 2, 1]],\n                          dtype=torch.long)\nsource, target = edge_index\nadjacency = features.new_zeros((3, 3))\nadjacency[target, source] = 1"}
                    </CodeBlock>
                    <Prose>
                      {""}
                      <code>
                        {"features"}
                      </code>
                      {" has one row per paper. Each edge-list column becomes one receiver-row/source-column cell. This construction uses unique, unweighted edges. Later sparse programs keep that contract; a weighted editor deliberately uses numerical edge strengths instead."}
                    </Prose>
                    <H3>
                      {"What changes when a graph has more papers?"}
                    </H3>
                    <Prose>
                      {"The same storage rule applies to every node; new rows do not require a new kind of layer."}
                    </Prose>
                    <div data-flow-view="D02a">
                      <MessagePassingGraphSizeExtension />
                    </div>
                    <Prose>
                      {"Increase the constructed graph from three nodes to six and inspect its node IDs and number rows. Existing rows retain their values. New rows begin at zero and have no off-diagonal permission until you add one. Shrinking the graph removes the corresponding rows and both adjacency axes. Selecting the node count changes storage size, not the meaning of a feature channel."}
                    </Prose>
                    <H3>
                      {"What does an edge strength change?"}
                    </H3>
                    <Prose>
                      {"Trace one selected source–receiver cell and its matching arrow while changing the amount sent along it."}
                    </Prose>
                    <div data-flow-view="D02b">
                      <MessagePassingEdgeStrengthExtension />
                    </div>
                    <Prose>
                      {"Select a source and a different receiver, then set that edge's weight between 0 and 4. Weight 0 removes its contribution. Weight 2 sends twice the value sent by weight 1 under the coming weighted-sum operation. This is a fixed relationship weight, distinct from the learned channel weights introduced in §3. Every permitted pair can be edited independently."}
                    </Prose>
                    <H3>
                      {"When should the reverse permission change too?"}
                    </H3>
                    <Prose>
                      {"Compare the two directional cells before linking their edits."}
                    </Prose>
                    <div data-flow-view="D02c">
                      <MessagePassingPairedEdgesExtension />
                    </div>
                    <Prose>
                      {"The paired-edit option represents an undirected strength: an edit updates both "}
                      <code>
                        {"A[v, u]"}
                      </code>
                      {" and "}
                      <code>
                        {"A[u, v]"}
                      </code>
                      {". If the two existing strengths differ, enabling paired editing first assigns their maximum to both cells. The picture displays the reconciled values so that this state change is visible. A directed problem keeps the two permissions independent. Removing all nonself edges leaves the node rows available for the own-state operation taught next."}
                    </Prose>
                    <H3>
                      {"What is one prediction about?"}
                    </H3>
                    <Prose>
                      {"Follow the same node table into three different output routes."}
                    </Prose>
                    <div data-flow-view="D03">
                      <MessagePassingTaskUnits />
                    </div>
                    <Prose>
                      {"A "}
                      <strong>
                        {"node task"}
                      </strong>
                      {" places a prediction layer on each requested node row: three nodes can produce three rows of class scores. An "}
                      <strong>
                        {"edge task"}
                      </strong>
                      {" selects two endpoint representations and scores a candidate relationship. Scoring the candidate "}
                      <code>
                        {"0 → 2"}
                      </code>
                      {" does not add that relationship to the message graph; its possible existence is the question being asked. A "}
                      <strong>
                        {"graph task"}
                      </strong>
                      {" first combines all node rows into one graph row, then predicts one quantity for the whole example."}
                    </Prose>
                    <Prose>
                      {"The graph-task merge in the picture is a sum. A merge that produces a graph-level representation is called a "}
                      <strong>
                        {"readout"}
                      </strong>
                      {". Here it adds the input rows to "}
                      <code>
                        {"(7, 0)"}
                      </code>
                      {". A sum readout is appropriate when the following computation needs additive information; a mean or a more elaborate readout expresses another choice. These are output units, not three incompatible ways of storing the graph."}
                    </Prose>
                    <H3>
                      {"Does moving a row change which paper it represents?"}
                    </H3>
                    <Prose>
                      {"Follow semantic paper IDs through a reordered table and its correspondingly reordered relationships."}
                    </Prose>
                    <div data-flow-view="D04">
                      <MessagePassingStorageLab />
                    </div>
                    <Prose>
                      {"Take only the first channel, so the rows are "}
                      <code>
                        {"1, 2, 4"}
                      </code>
                      {". Use the small operation “own value plus incoming values.” Paper 0 becomes "}
                      <code>
                        {"1 + 2 = 3"}
                      </code>
                      {"; paper 1 becomes "}
                      <code>
                        {"2 + 1 + 4 = 7"}
                      </code>
                      {"; paper 2 becomes "}
                      <code>
                        {"4 + 2 = 6"}
                      </code>
                      {"."}
                    </Prose>
                    <Prose>
                      {"Now store papers in the order "}
                      <code>
                        {"[2, 0, 1]"}
                      </code>
                      {". Their input rows are "}
                      <code>
                        {"[4, 1, 2]"}
                      </code>
                      {". Reorder both axes of the adjacency to keep each relationship attached to the same semantic IDs. The computed rows become "}
                      <code>
                        {"[6, 3, 7]"}
                      </code>
                      {": paper 2 still has 6, paper 0 still has 3, and paper 1 still has 7. The outputs moved with their objects. This is "}
                      <strong>
                        {"permutation equivariance"}
                      </strong>
                      {"."}
                    </Prose>
                    <Prose>
                      {"The graph sum remains "}
                      <code>
                        {"3 + 7 + 6 = 16"}
                      </code>
                      {" in either order. A graph output that stays unchanged under this reordering is "}
                      <strong>
                        {"permutation invariant"}
                      </strong>
                      {". Node outputs and graph outputs require different statements because the former still have identities."}
                    </Prose>
                    <Prose>
                      {"To write that same check compactly, call the node feature table "}
                      <code>
                        {"H"}
                      </code>
                      {": each row belongs to one node, and each column is a feature channel. Let "}
                      <code>
                        {"Q"}
                      </code>
                      {" be the matrix that reorders those rows. A superscript "}
                      <code>
                        {"ᵀ"}
                      </code>
                      {" means "}
                      <strong>
                        {"transpose"}
                      </strong>
                      {": interchange a matrix's rows and columns. For this permutation matrix, "}
                      <code>
                        {"Qᵀ"}
                      </code>
                      {" also undoes the reorder. Input features become "}
                      <code>
                        {"QH"}
                      </code>
                      {". Adjacency becomes "}
                      <code>
                        {"QAQᵀ"}
                      </code>
                      {": multiplication on the left reorders receiver rows, and multiplication on the right reorders source columns, keeping both endpoints attached to their papers. If "}
                      <code>
                        {"F"}
                      </code>
                      {" is the node update, equivariance means"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"F(QH,QAQ^\\mathsf T)=QF(H,A)."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"Reordering only the feature rows fails to preserve the original graph. That bug attaches a relationship to the wrong paper. The independent batch and storage-order checks later in the lesson use this same principle."}
                    </Prose>
                    <H2>
                      {"2. One synchronized message-passing round"}
                    </H2>
                    <H3>
                      {"How does one neighbor change a receiver?"}
                    </H3>
                    <Prose>
                      {"Trace paper 1's two incoming values through the sum and its own-state addition."}
                    </Prose>
                    <div data-flow-view="D05">
                      <MessagePassingContributionLab />
                    </div>
                    <Prose>
                      {"From §1, paper 1 may read papers 0 and 2. Their first-channel values are 1 and 4. The two "}
                      <strong>
                        {"messages"}
                      </strong>
                      {" in this first example simply carry those values unchanged. Combining the incoming messages gives "}
                      <code>
                        {"1 + 4 = 5"}
                      </code>
                      {"; this combination is the "}
                      <strong>
                        {"aggregation"}
                      </strong>
                      {". Adding paper 1's own value 2 produces its new state "}
                      <code>
                        {"2 + 5 = 7"}
                      </code>
                      {"; that final rule is the "}
                      <strong>
                        {"update"}
                      </strong>
                      {"."}
                    </Prose>
                    <Prose>
                      {"The picture separates the operations so that one contribution can be followed end to end. Sender 0's row supplies 1, the identity-message operation sends 1, the aggregation receives 1, and the update adds it to the other message and the own state. A nonneighbor has no message wire into this receiver."}
                    </Prose>
                    <Prose>
                      {"Let "}
                      <code>
                        {"h_v"}
                      </code>
                      {" name node "}
                      <code>
                        {"v"}
                      </code>
                      {"'s current state and "}
                      <code>
                        {"h'_v"}
                      </code>
                      {" its next state. For this first scalar rule,"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"h'_v=h_v+\\sum_u A_{vu}h_u."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"The summation collects the incoming contributions. With the weighted graph from §1, each contribution is "}
                      <code>
                        {"A[v,u] × h[u]"}
                      </code>
                      {"; a zero cell contributes zero. The own-state term is separate. We will say explicitly when a later operator instead adds self-loop entries inside its aggregate."}
                    </Prose>
                    <CodeBlock language="python" filename="own-incoming-sum.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"current = features[:, :1]  # First channel, shape (nodes, 1).\nnext_state = current + adjacency @ current"}
                    </CodeBlock>
                    <Prose>
                      {"Matrix multiplication performs the same row-by-row calculation as the drawing: receiver row 1 multiplies source column 0 by 1 and source column 2 by 4, then adds the products. With the original path, the complete next table is "}
                      <code>
                        {"[3, 7, 6]"}
                      </code>
                      {"."}
                    </Prose>
                    <H3>
                      {"Which input can I change without changing the rule?"}
                    </H3>
                    <Prose>
                      {"Follow any selected node's current value into every receiver permitted to read it."}
                    </Prose>
                    <div data-flow-view="D05a">
                      <MessagePassingFeatureExtension />
                    </div>
                    <Prose>
                      {"Select a semantic node and change its scalar feature between −8 and 8. The graph permissions stay fixed. Changing paper 2 from 4 to −1 changes paper 1's result from 7 to "}
                      <code>
                        {"2 + 1 − 1 = 2"}
                      </code>
                      {". Paper 0 still becomes 3 after this one round, because it cannot read paper 2 directly. A negative message is a numerical contribution, not a negative class label."}
                    </Prose>
                    <Prose>
                      {"The general "}
                      <strong>
                        {"message-passing neural network"}
                      </strong>
                      {" separates three choices. A function "}
                      <code>
                        {"M"}
                      </code>
                      {" constructs a message using the sender, receiver and any edge features. A reducer "}
                      <code>
                        {"AGG"}
                      </code>
                      {" combines that receiver's incoming messages. A function "}
                      <code>
                        {"U"}
                      </code>
                      {" combines the aggregate with the receiver's previous state. To label those stages, "}
                      <code>
                        {"ℓ"}
                      </code>
                      {" counts computation rounds, "}
                      <code>
                        {"e"}
                      </code>
                      {" holds any supplied edge description, and "}
                      <code>
                        {"𝒩(v)"}
                      </code>
                      {" is the list of sources allowed to send to "}
                      <code>
                        {"v"}
                      </code>
                      {". Write a message as "}
                      <code>
                        {"m"}
                      </code>
                      {", its receiving aggregate as "}
                      <code>
                        {"a"}
                      </code>
                      {", and a node state as "}
                      <code>
                        {"h"}
                      </code>
                      {"; their superscripts identify the round:"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"m_{u\\to v}^{(\\ell)}=M_\\ell(h_u^{(\\ell)},h_v^{(\\ell)},e_{u\\to v}),\\qquad\na_v^{(\\ell)}=\\operatorname{AGG}_{u\\in\\mathcal N(v)}m_{u\\to v}^{(\\ell)},\\qquad\nh_v^{(\\ell+1)}=U_\\ell(h_v^{(\\ell)},a_v^{(\\ell)})."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"Our first example uses the sender unchanged, sums messages, and adds the own state. Learned maps will make "}
                      <code>
                        {"M"}
                      </code>
                      {" and "}
                      <code>
                        {"U"}
                      </code>
                      {" richer. Shared functions let the same layer operate on different node counts; sum, mean and max do not require a fixed neighborhood size."}
                    </Prose>
                    <H3>
                      {"Why must every node read the old table?"}
                    </H3>
                    <Prose>
                      {"Compare a separate next-state buffer with overwriting a value while another receiver still needs it."}
                    </Prose>
                    <div data-flow-view="D06">
                      <MessagePassingSynchronizationLab />
                    </div>
                    <Prose>
                      {"Use a two-node example here because it isolates the storage error. The current values are "}
                      <code>
                        {"[1, 3]"}
                      </code>
                      {", and each node takes the mean of itself and its neighbor. Both receivers should read exactly those old values. Both means are "}
                      <code>
                        {"(1 + 3) / 2 = 2"}
                      </code>
                      {", so the correct next table is "}
                      <code>
                        {"[2, 2]"}
                      </code>
                      {"."}
                    </Prose>
                    <Prose>
                      {"The faulty route updates node 0 first and writes 2 into the old table. Node 1 then reads the changed 2 alongside its own 3, producing 2.5. Its result depends on the processing order rather than just the stated layer. Processing node 1 first instead gives "}
                      <code>
                        {"[1.5, 2]"}
                      </code>
                      {"."}
                    </Prose>
                    <CodeBlock language="python" filename="synchronous-buffering.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"old = torch.tensor([1., 3.], dtype=torch.float64)\nnew = torch.empty_like(old)\nnew[0] = (old[0] + old[1]) / 2\nnew[1] = (old[1] + old[0]) / 2\nold = new"}
                    </CodeBlock>
                    <Prose>
                      {"The new buffer may be filled in either order because every expression reads the unchanged old buffer. A "}
                      <strong>
                        {"synchronous"}
                      </strong>
                      {" round has this dependency structure; it does not mean every CPU instruction literally executes at the same instant."}
                    </Prose>
                    <H3>
                      {"What exactly changes when I reverse the processing order?"}
                    </H3>
                    <Prose>
                      {"Follow the same old inputs into the correct branch and the deliberately faulty branch."}
                    </Prose>
                    <div data-flow-view="D06a">
                      <MessagePassingOrderExtension />
                    </div>
                    <Prose>
                      {"The order control changes which node is overwritten first in the faulty calculation. The correct calculation stays present and has the same semantic result. Equal old values provide a useful null case: an overwrite may accidentally preserve the correct answer, so passing that one case does not establish correct buffering."}
                    </Prose>
                    <H3>
                      {"What happens if the overwrite is repeated for several rounds?"}
                    </H3>
                    <Prose>
                      {"Compare the complete correct and faulty trajectories under the same current graph, values and round count."}
                    </Prose>
                    <div data-flow-view="D06b">
                      <MessagePassingInPlaceExtension />
                    </div>
                    <Prose>
                      {"This view returns to the constructed graph editor. Its in-place comparison changes only the named update algorithm; the synchronous branch remains visible. Rounds range from 0 to 4. At round 0 both branches are the initial state, and at later rounds the picture identifies which old or overwritten value each message used. Comparing algorithms should preserve the other inputs."}
                    </Prose>
                    <H3>
                      {"How far can two rounds carry information?"}
                    </H3>
                    <Prose>
                      {"Follow paper 2's initial feature through separate copies of the path at successive rounds."}
                    </Prose>
                    <div data-flow-view="D07">
                      <MessagePassingReachExtension />
                    </div>
                    <Prose>
                      {"Return to the original three-paper path and own-plus-incoming-sum rule. At round 0 the table is "}
                      <code>
                        {"[1, 2, 4]"}
                      </code>
                      {". At round 1 it is "}
                      <code>
                        {"[3, 7, 6]"}
                      </code>
                      {". At round 2 it is "}
                      <code>
                        {"[10, 16, 13]"}
                      </code>
                      {". Paper 0 now receives paper 1's updated value 7, which includes paper 2's original 4. The unfolded picture keeps the same semantic IDs while showing distinct round-specific states."}
                    </Prose>
                    <Prose>
                      {"Change paper 2's original value by "}
                      <code>
                        {"δ"}
                      </code>
                      {". Paper 0 changes by zero after one round and by "}
                      <code>
                        {"δ"}
                      </code>
                      {" after two. Information travels through the chain "}
                      <code>
                        {"2 at round 0 → 1 at round 1 → 0 at round 2"}
                      </code>
                      {". For a purely local layer with fixed graph and parameters, "}
                      <code>
                        {"ℓ"}
                      </code>
                      {" rounds have support within at most "}
                      <code>
                        {"ℓ"}
                      </code>
                      {" graph hops. A "}
                      <strong>
                        {"hop"}
                      </strong>
                      {" is one traversed edge."}
                    </Prose>
                    <Prose>
                      {"Being reachable does not ensure an effect: a zero message weight can erase that route. Graph-wide feature normalization or a learned graph construction can also create dependencies outside this fixed local-update argument. We return to those boundaries when defining data access and batching."}
                    </Prose>
                    <H3>
                      {"Can I compare the new trajectory with one I already inspected?"}
                    </H3>
                    <Prose>
                      {"Keep a copied graph, initial table and computed states alongside the current trajectory."}
                    </Prose>
                    <div data-flow-view="D07b">
                      <MessagePassingPinExtension />
                    </div>
                    <Prose>
                      {"Pinning captures the current inputs, round count, loop/order/algorithm settings and outputs. A later edit changes the current branch without mutating that copy. The labels retain the pin's semantic node IDs and settings. Resizing clears the pin because its node set no longer describes the same editor context. This comparison distinguishes changing one input from accidentally changing the computation or the reference itself."}
                    </Prose>
                    <H2>
                      {"3. GCN: a normalized weighted sum"}
                    </H2>
                    <H3>
                      {"What changes when every node also reads itself?"}
                    </H3>
                    <Prose>
                      {"Count the incoming permissions before and after adding one self read at every node."}
                    </Prose>
                    <div data-flow-view="D08">
                      <MessagePassingSelfReadsExtension />
                    </div>
                    <Prose>
                      {"The first sum rule kept the own-state addition separate. For the next operator, add a "}
                      <strong>
                        {"self-loop"}
                      </strong>
                      {": a permission from a node to itself. Each of the three papers now appears once in its own incoming list. The path's closed incoming counts are 2, 3 and 2: node 0 reads 0 and 1; node 1 reads 0, 1 and 2; node 2 reads 1 and 2."}
                    </Prose>
                    <Prose>
                      {"These counts are the "}
                      <strong>
                        {"closed degrees"}
                      </strong>
                      {". They describe the graph after adding the self reads, not the numerical magnitudes of the features. Write the resulting adjacency as "}
                      <code>
                        {"B = A + I"}
                      </code>
                      {", where the identity matrix "}
                      <code>
                        {"I"}
                      </code>
                      {" adds one to each diagonal entry. Multiplying "}
                      <code>
                        {"B"}
                      </code>
                      {" by a column of ones, written "}
                      <code>
                        {"1"}
                      </code>
                      {", adds each row's entries. Let "}
                      <code>
                        {"d = B1"}
                      </code>
                      {" be those row sums and "}
                      <code>
                        {"D"}
                      </code>
                      {" the diagonal matrix containing them:"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"B=\\begin{bmatrix}1&1&0\\\\1&1&1\\\\0&1&1\\end{bmatrix},\\qquad\nd=(2,3,2),\\qquad D=\\operatorname{diag}(2,3,2)."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"The loop toggle acts on this taught permission. For an otherwise empty graph, enabled loops give degree 1 and an own-value read. Without loops a zero-degree receiver has no incoming contribution. Our editor uses a zero aggregate there; the invertible coordinate argument below requires positive degrees."}
                    </Prose>
                    <H3>
                      {"How much does each sender contribute to paper 1?"}
                    </H3>
                    <Prose>
                      {"Trace each source's feature, both endpoint degrees, its normalization factor and the resulting product."}
                    </Prose>
                    <div data-flow-view="D09">
                      <MessagePassingNormalizedSumLab />
                    </div>
                    <Prose>
                      {"We want a connected high-degree node's aggregate to have a controlled scale. A "}
                      <strong>
                        {"graph convolutional network"}
                      </strong>
                      {", or "}
                      <strong>
                        {"GCN"}
                      </strong>
                      {", uses one normalization factor for each endpoint of a message. For source "}
                      <code>
                        {"u"}
                      </code>
                      {" and receiver "}
                      <code>
                        {"v"}
                      </code>
                      {", the factor is "}
                      <code>
                        {"1 / √(d_u d_v)"}
                      </code>
                      {" on an unweighted permitted edge."}
                    </Prose>
                    <Prose>
                      {"Paper 1 has degree 3. Sources 0 and 2 have degree 2, so their factors are "}
                      <code>
                        {"1/√6"}
                      </code>
                      {". Paper 1's own factor is "}
                      <code>
                        {"1/√(3×3) = 1/3"}
                      </code>
                      {". Its incoming products are "}
                      <code>
                        {"1/√6"}
                      </code>
                      {", "}
                      <code>
                        {"2/3"}
                      </code>
                      {", and "}
                      <code>
                        {"4/√6"}
                      </code>
                      {". Their sum is"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"\\frac1{\\sqrt6}+\\frac23+\\frac4{\\sqrt6}=2.707908118985982."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"Applying the same rule at all three receivers produces "}
                      <code>
                        {"[1.3164965809, 2.7079081190, 2.8164965809]"}
                      </code>
                      {". The picture shows those three rows and their actual source products. Collect the factors into a matrix "}
                      <code>
                        {"S"}
                      </code>
                      {". The diagonal matrix "}
                      <code>
                        {"D⁻¹/²"}
                      </code>
                      {" has entries "}
                      <code>
                        {"1/√d_v"}
                      </code>
                      {": it divides each associated coordinate by the square root of its degree. Its position on both sides of "}
                      <code>
                        {"B"}
                      </code>
                      {" supplies the source and receiver factors. With the current first-channel column called "}
                      <code>
                        {"x"}
                      </code>
                      {" and the next-state column called "}
                      <code>
                        {"h'"}
                      </code>
                      {", the complete operation is"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"S=D^{-1/2}BD^{-1/2}\n=\\begin{bmatrix}\n1/2&1/\\sqrt6&0\\\\\n1/\\sqrt6&1/3&1/\\sqrt6\\\\\n0&1/\\sqrt6&1/2\n\\end{bmatrix},\\qquad h'=Sx."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"For weighted nonnegative relationships, "}
                      <code>
                        {"B[v,u] / √(d_v d_u)"}
                      </code>
                      {" is the coefficient and degrees are current sums of edge strengths."}
                    </Prose>
                    <Prose>
                      {"These coefficients are not probabilities: the rows sum to approximately "}
                      <code>
                        {"0.908248"}
                      </code>
                      {", "}
                      <code>
                        {"1.149830"}
                      </code>
                      {", and "}
                      <code>
                        {"0.908248"}
                      </code>
                      {". Feeding all ones therefore does not return all ones. This differs from simply averaging a receiver's incoming list."}
                    </Prose>
                    <H3>
                      {"What changes when I edit a value or a relationship?"}
                    </H3>
                    <Prose>
                      {"Keep the current scalar values separate from the current degree-weight calculation."}
                    </Prose>
                    <div data-flow-view="D09a">
                      <MessagePassingGcnFeatureExtension />
                    </div>
                    <Prose>
                      {"Select any of the three nodes and edit its feature between −8 and 8. The normalizing coefficients do not change, because the relationships did not change. Only the products that use that feature change."}
                    </Prose>
                    <div data-flow-view="D09b">
                      <MessagePassingGcnEdgeExtension />
                    </div>
                    <Prose>
                      {"Select any of the three undirected pairs and edit its strength between 0 and 4. Now the endpoint degrees change, so every affected normalization factor is recomputed. Adding the previously absent "}
                      <code>
                        {"0—2"}
                      </code>
                      {" relationship changes more than the newly added product. This is why a cached operator must be invalidated when the graph changes."}
                    </Prose>
                    <div data-flow-view="D09c">
                      <MessagePassingGcnLoopsExtension />
                    </div>
                    <Prose>
                      {"Removing the automatic loops changes the degrees and permitted self contributions. Each zero-degree row uses the stated zero-aggregate arithmetic policy, and the picture marks degree-divided coordinates unavailable at that row."}
                    </Prose>
                    <H3>
                      {"How is receiver averaging related to symmetric normalization?"}
                    </H3>
                    <Prose>
                      {"Compare the same raw input, then follow two complete routes that convert its coordinates."}
                    </Prose>
                    <div data-flow-view="D09d">
                      <MessagePassingGcnCoordinatesExtension />
                    </div>
                    <Prose>
                      {"An ordinary receiver average divides every incoming edge by the receiver's degree. Its matrix is "}
                      <code>
                        {"P = D⁻¹B"}
                      </code>
                      {". On our path it produces "}
                      <code>
                        {"[1.5, 7/3, 3]"}
                      </code>
                      {" from "}
                      <code>
                        {"[1, 2, 4]"}
                      </code>
                      {". Those values differ from "}
                      <code>
                        {"Sx"}
                      </code>
                      {", so exchanging the two operators while keeping the raw input fixed changes the computation."}
                    </Prose>
                    <Prose>
                      {"The second pair of routes explains their relationship. First change the input to "}
                      <code>
                        {"f = D⁻¹/²x"}
                      </code>
                      {": "}
                      <code>
                        {"[0.70710678, 1.15470054, 2.82842712]"}
                      </code>
                      {". Receiver averaging of this converted input gives approximately "}
                      <code>
                        {"[0.93090366, 1.56341148, 1.99156383]"}
                      </code>
                      {". Alternatively, compute "}
                      <code>
                        {"Sx"}
                      </code>
                      {" first and divide that result by the corresponding square-root degrees. The same three values emerge."}
                    </Prose>
                    <Prose>
                      {"For a fixed undirected graph with nonnegative edge strengths and positive degrees,"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"P=D^{-1/2}SD^{1/2},\\qquad\nPf=D^{-1/2}Sx\\quad\\text{when }f=D^{-1/2}x."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"The conversion changes the input as well as the output. Because every degree is positive, the diagonal conversion can be reversed. This is "}
                      <strong>
                        {"similarity"}
                      </strong>
                      {" of the two linear operators: they describe the same linear action in differently scaled coordinates. On a regular graph, all degrees equal one another and "}
                      <code>
                        {"P = S"}
                      </code>
                      {". General directed graphs and zero-degree conversions require different reasoning. In §7, we will introduce the patterns preserved by an operator and use this same conversion to compare their propagation gains."}
                    </Prose>
                    <Prose>
                      {"The operator choice compares two already taught rules. Both current results remain visible; it does not hide one behind an investigation mode. In §7 we reuse these coordinate routes to explain which values become equal under repeated propagation."}
                    </Prose>
                    <H3>
                      {"Which operation mixes channels, and which mixes nodes?"}
                    </H3>
                    <Prose>
                      {"Follow each paper's two-channel row through a shared learned map, then follow projected source rows into receivers."}
                    </Prose>
                    <div data-flow-view="D10">
                      <MessagePassingChannelLab />
                    </div>
                    <Prose>
                      {"Return to the two-channel table from §1. The learned matrix has two output rows:"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"W=\\begin{bmatrix}1&0.5\\\\-1&2\\end{bmatrix}."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"Its first output is "}
                      <code>
                        {"channel 1 + 0.5 × channel 2"}
                      </code>
                      {"; its second is "}
                      <code>
                        {"−channel 1 + 2 × channel 2"}
                      </code>
                      {". It turns the three rows into "}
                      <code>
                        {"(1, −1)"}
                      </code>
                      {", "}
                      <code>
                        {"(2.5, 0)"}
                      </code>
                      {", and "}
                      <code>
                        {"(3.5, −6)"}
                      </code>
                      {". The same matrix acts on every paper. Its entries are learned parameters; the node IDs never select different copies of them."}
                    </Prose>
                    <Prose>
                      {""}
                      <code>
                        {"S"}
                      </code>
                      {" then mixes rows along graph permissions. For receiver 1, the first projected channel becomes "}
                      <code>
                        {"1/√6 + 2.5/3 + 3.5/√6 ≈ 2.6704506404"}
                      </code>
                      {"; the second becomes "}
                      <code>
                        {"−1/√6 − 6/√6 ≈ −2.8577380332"}
                      </code>
                      {". Applying ReLU replaces that negative second result by zero."}
                    </Prose>
                    <Prose>
                      {"As in §1, "}
                      <code>
                        {"H"}
                      </code>
                      {" stores node rows. Each row multiplies "}
                      <code>
                        {"Wᵀ"}
                      </code>
                      {" to produce its output channels; this is the row-table form of applying the output-by-input map "}
                      <code>
                        {"W"}
                      </code>
                      {" to a column vector. Let "}
                      <code>
                        {"b"}
                      </code>
                      {" be one learned output-channel bias shared across nodes. The product "}
                      <code>
                        {"1bᵀ"}
                      </code>
                      {" repeats that bias as one row per node. With "}
                      <code>
                        {"H'"}
                      </code>
                      {" naming the next table, the layer is"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"H'=\\operatorname{ReLU}(SHW^\\mathsf T+\\mathbf1b^\\mathsf T)."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {""}
                      <code>
                        {"S"}
                      </code>
                      {" mixes nodes; "}
                      <code>
                        {"Wᵀ"}
                      </code>
                      {" mixes channels. Before bias and activation, "}
                      <code>
                        {"S(HWᵀ) = (SH)Wᵀ"}
                      </code>
                      {" by associativity. Moving an activation between those multiplications generally changes the result. The downloadable dense study stores its weight in input-by-output form; its matrix is "}
                      <code>
                        {"W_old = Wᵀ"}
                      </code>
                      {". That transpose changes storage convention, not the intended layer."}
                    </Prose>
                    <Prose>
                      {"The shared-entry control edits "}
                      <code>
                        {"W[0,1]"}
                      </code>
                      {". The corresponding term changes at every node, and the gradient contributions from all supervised uses accumulate into that one parameter. §6's sparse implementation projects rows once and gathers them along edges rather than allocating a dense node-by-node message table."}
                    </Prose>
                    <H3>
                      {"Why does the bias position matter?"}
                    </H3>
                    <Prose>
                      {"Follow the same bias through two circuits and compare their receiver rows."}
                    </Prose>
                    <div data-flow-view="D11">
                      <MessagePassingBiasExtension />
                    </div>
                    <Prose>
                      {"Use the scalar path again and bias "}
                      <code>
                        {"b = 1"}
                      </code>
                      {". Adding the bias before graph mixing produces "}
                      <code>
                        {"S(x + 1b) ≈ [2.224745, 3.857738, 3.724745]"}
                      </code>
                      {". Adding it afterward produces "}
                      <code>
                        {"Sx + 1b ≈ [2.316497, 3.707908, 3.816497]"}
                      </code>
                      {"."}
                    </Prose>
                    <Prose>
                      {"The difference is visible in the route: a pre-mixing bias is sent through every allowed message coefficient, so receiver "}
                      <code>
                        {"v"}
                      </code>
                      {" gets "}
                      <code>
                        {"b × rowSum_v"}
                      </code>
                      {". A post-mixing bias is added exactly once. Their difference is"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"S(x+\\mathbf1b)-(Sx+\\mathbf1b)=(S\\mathbf1-\\mathbf1)b."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"The unequal row sums from D09 explain the unequal results. Bias zero makes the circuits coincide; an operator whose rows sum to one also makes them coincide. The ordinary "}
                      <code>
                        {"GCNConv"}
                      </code>
                      {" comparison below uses post-aggregation bias. A declared pre-mixing affine rule is a different operator, not a universally invalid one."}
                    </Prose>
                    <H3>
                      {"Which shared parameter does a training error change?"}
                    </H3>
                    <Prose>
                      {"Trace one receiver's aggregate through its prediction and loss, then follow the gradient back to the same weight."}
                    </Prose>
                    <div data-flow-view="D12">
                      <MessagePassingScalarUpdateLab />
                    </div>
                    <Prose>
                      {"Receiver 0's aggregate is "}
                      <code>
                        {"a = 1.3164965809"}
                      </code>
                      {". A shared scalar weight "}
                      <code>
                        {"w = 0.5"}
                      </code>
                      {" gives prediction "}
                      <code>
                        {"aw = 0.6582482905"}
                      </code>
                      {". Its supervised target is 1. The half-squared loss is "}
                      <code>
                        {"L = (aw − 1)²/2 ≈ 0.0583971155"}
                      </code>
                      {"."}
                    </Prose>
                    <Prose>
                      {"Changing "}
                      <code>
                        {"w"}
                      </code>
                      {" changes the prediction by "}
                      <code>
                        {"a"}
                      </code>
                      {" per unit weight. Changing the prediction changes the loss by its residual "}
                      <code>
                        {"aw − 1"}
                      </code>
                      {". Multiplying these two local effects gives the derivative with respect to the shared weight:"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"\\frac{\\partial L}{\\partial w}=a(aw-1)\\approx-0.4499149571."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"With step size "}
                      <code>
                        {"η = 0.1"}
                      </code>
                      {", gradient descent subtracts "}
                      <code>
                        {"η × derivative"}
                      </code>
                      {", giving "}
                      <code>
                        {"w_new = 0.5449914957"}
                      </code>
                      {". The new prediction is "}
                      <code>
                        {"0.7174794407"}
                      </code>
                      {", closer to 1. The target enters the loss route; it is never sent through graph edges as a feature."}
                    </Prose>
                    <CodeBlock language="python" filename="shared-scalar-gradient.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"aggregate = torch.tensor(1.3164965809277258, dtype=torch.float64)\nweight = torch.tensor(.5, dtype=torch.float64, requires_grad=True)\nloss = .5 * (aggregate * weight - 1).square()\nderivative, = torch.autograd.grad(loss, weight)\nnew_weight = weight.detach() - .1 * derivative"}
                    </CodeBlock>
                    <Prose>
                      {"The complete "}
                      <code>
                        {"message-passing-operators.py"}
                      </code>
                      {" program computes the aggregate using sparse messages before tracing this update. It reuses tensor arithmetic and autograd; it writes the graph normalization, gather and receiving sum explicitly."}
                    </Prose>
                    <H3>
                      {"Do all receivers teach the shared weight the same lesson?"}
                    </H3>
                    <Prose>
                      {"Follow the selected receiver, target and current weight into one complete supervised route."}
                    </Prose>
                    <div data-flow-view="D12a">
                      <MessagePassingSupervisionExtension />
                    </div>
                    <Prose>
                      {"Select receiver 0, 1 or 2, set its target between −8 and 8, and set "}
                      <code>
                        {"w"}
                      </code>
                      {" between −4 and 4. The graph and feature context remains the one edited in D09. The displayed aggregate, prediction, residual and derivative all come from that same current context. With multiple supervised receivers the shared weight receives the sum, or the explicitly chosen mean, of their loss contributions."}
                    </Prose>
                    <H3>
                      {"How large a step should be applied?"}
                    </H3>
                    <Prose>
                      {"Compare the current loss with the loss at the exact proposed weight before applying the change."}
                    </Prose>
                    <div data-flow-view="D12b">
                      <MessagePassingApplyExtension />
                    </div>
                    <Prose>
                      {"The step-size control ranges from 0 to 1. At receiver 1 on the original path, with "}
                      <code>
                        {"w = 0.5"}
                      </code>
                      {", target 1 and "}
                      <code>
                        {"η = 0.5"}
                      </code>
                      {", the exact proposal is approximately "}
                      <code>
                        {"0.0207624643"}
                      </code>
                      {". The loss increases from "}
                      <code>
                        {"0.0626417381"}
                      </code>
                      {" to "}
                      <code>
                        {"0.4453576586"}
                      </code>
                      {": this step overshoots the minimum."}
                    </Prose>
                    <Prose>
                      {"For this scalar quadratic with aggregate "}
                      <code>
                        {"a ≠ 0"}
                      </code>
                      {", the residual after a step is "}
                      <code>
                        {"(1 − ηa²)"}
                      </code>
                      {" times the old residual. A nonzero residual decreases in magnitude when "}
                      <code>
                        {"0 < η < 2/a²"}
                      </code>
                      {"; rate zero leaves it unchanged, and "}
                      <code>
                        {"η = 2/a²"}
                      </code>
                      {" preserves its magnitude with reversed sign. If "}
                      <code>
                        {"a = 0"}
                      </code>
                      {", this loss has no weight gradient. This exact argument concerns the fixed scalar loss; an arbitrary nonlinear training objective needs its own step-size assessment."}
                    </Prose>
                    <Prose>
                      {"Applying the proposal uses its full precision, not its displayed rounded value. If it lies outside the editor's supported weight range, the Apply action explains the proposed value and leaves the current weight unchanged. Reducing the step size remains available. Clipping a weight would implement a different update."}
                    </Prose>
                    <Prose>
                      {"GCN gives us a shared learned channel map and fixed graph-derived mixing factors. The next question is which part of that combination we want to change: the treatment of the own state, the incoming summary, or the coefficients assigned to different senders."}
                    </Prose>
                    <H2>
                      {"4. GraphSAGE and GAT change the aggregation decision"}
                    </H2>
                    <H3>
                      {"Why keep myself separate from my neighbors?"}
                    </H3>
                    <Prose>
                      {"Follow the own-state branch and the neighbor-mean branch to their distinct learned coefficients."}
                    </Prose>
                    <div data-flow-view="D13">
                      <MessagePassingSageIntro />
                    </div>
                    <Prose>
                      {"GCN included the own state among normalized messages. "}
                      <strong>
                        {"GraphSAGE"}
                      </strong>
                      {" can instead summarize neighbors and apply a separate map to the own state. Use a new small neighborhood here because three donors make the summary and its alternatives easier to inspect. The receiver's own value is 4; its three neighbors carry 1, 3 and 5. The neighbor mean is "}
                      <code>
                        {"(1 + 3 + 5) / 3 = 3"}
                      </code>
                      {"."}
                    </Prose>
                    <Prose>
                      {"Give the own branch coefficient 2 and the neighbor branch coefficient 1. The new scalar state before activation is "}
                      <code>
                        {"2 × 4 + 1 × 3 = 11"}
                      </code>
                      {". Each learned coefficient has a distinct job: retain or transform the own information, and retain or transform the summary. A zero-neighbor receiver keeps its own branch; in this layer an empty incoming list supplies the explicit zero summary."}
                    </Prose>
                    <Prose>
                      {"With vectors, let "}
                      <code>
                        {"W_self"}
                      </code>
                      {" map the own state, "}
                      <code>
                        {"W_neighbors"}
                      </code>
                      {" map the mean, and "}
                      <code>
                        {"b"}
                      </code>
                      {" be the shared post-map bias. Write the neighbor mean as "}
                      <code>
                        {"h̄_v"}
                      </code>
                      {" and the number of incoming occurrences as "}
                      <code>
                        {"|𝒩(v)|"}
                      </code>
                      {". The mean-SAGE layer we implement is"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"\\bar h_v=\\begin{cases}\n\\frac1{|\\mathcal N(v)|}\\sum_{u\\in\\mathcal N(v)}h_u,&|\\mathcal N(v)|>0,\\\\\n0,&|\\mathcal N(v)|=0,\n\\end{cases}\\qquad\nh'_v=W_{\\mathrm{self}}h_v+W_{\\mathrm{neighbors}}\\bar h_v+b."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"No automatic SAGE self-loop is added here, because the own state already has its separate branch. Another common form concatenates "}
                      <code>
                        {"[h_v, mean_v]"}
                      </code>
                      {" and multiplies by one larger matrix. Splitting that matrix into its two input blocks yields the two maps above. An activation can follow the combined result; the particular variant must state whether a subsequent row normalization is used."}
                    </Prose>
                    <Prose>
                      {"The ordinary route "}
                      <code>
                        {"SAGEConv(..., aggr='mean', project=False, root_weight=True, normalize=False)"}
                      </code>
                      {" implements these choices. Its "}
                      <code>
                        {"lin_l"}
                      </code>
                      {" maps the neighbor mean and supplies the bias; "}
                      <code>
                        {"lin_r"}
                      </code>
                      {" maps the own state without another bias. The scratch "}
                      <code>
                        {"SparseMeanSage"}
                      </code>
                      {" names these branches explicitly rather than importing a graph layer."}
                    </Prose>
                    <H3>
                      {"What if a receiver has no neighbors, or several copies of a value?"}
                    </H3>
                    <Prose>
                      {"Keep individual incoming occurrences visible while changing their count and values."}
                    </Prose>
                    <div data-flow-view="D13a">
                      <MessagePassingSageOwnLab />
                    </div>
                    <Prose>
                      {"The own-value control and neighbor-count control preserve this SAGE context. At count 0 the mean summary is zero and the own branch still acts. Increasing the count retains old entries and adds zeros; shrinking drops the removed occurrences. Each incoming occurrence is one entry in the summary, even when two entries carry equal values."}
                    </Prose>
                    <div data-flow-view="D13b">
                      <MessagePassingSageOccurrenceLab />
                    </div>
                    <Prose>
                      {"Select an occurrence and edit its value between −8 and 8. The three values need not stay symmetric or have the same mean. With "}
                      <code>
                        {"[1, 3, 5]"}
                      </code>
                      {", repeating the entire list gives "}
                      <code>
                        {"[1, 3, 5, 1, 3, 5]"}
                      </code>
                      {" and the same mean 3; repeating only the value 5 gives mean 3.5. This distinction will motivate the sum/mean/max comparison in §8."}
                    </Prose>
                    <div data-flow-view="D13c">
                      <MessagePassingSageWeightsLab />
                    </div>
                    <Prose>
                      {"Edit the own and neighbor coefficients independently between −4 and 4. A zero neighbor coefficient deliberately ignores the incoming summary; a negative coefficient reverses its signed contribution. The live products, sum and sentence use the current own value and occurrence list, rather than reverting to the introductory numbers."}
                    </Prose>
                    <H3>
                      {"Does max pooling happen before or after a learned transform?"}
                    </H3>
                    <Prose>
                      {""}
                      <strong>
                        {"Deeper branch: alternative neighborhood readers."}
                      </strong>
                      {" Mean-SAGE already gives us the core own/neighbor split. The following questions explore pre-transform pooling, row normalization, ordered reading and gated memory. Their diagrams stay visible; on a first pass you can continue directly to “What information creates a GAT edge score?” and return here when you want to implement a different reader."}
                    </Prose>
                    <Prose>
                      {"Follow each donor into two transformed channels, then select the largest value in each channel."}
                    </Prose>
                    <div data-flow-view="D14">
                      <MessagePassingPoolLab />
                    </div>
                    <Prose>
                      {"A mean reduces all donors to one summary before the next map. Sometimes we want each donor to produce a useful feature first. To see the difference, use scalar donors "}
                      <code>
                        {"−2, 1, 3"}
                      </code>
                      {". Give each donor the same one-input/two-output map "}
                      <code>
                        {"x → [x, −x]"}
                      </code>
                      {", then ReLU. The resulting rows are "}
                      <code>
                        {"[0, 2]"}
                      </code>
                      {", "}
                      <code>
                        {"[1, 0]"}
                      </code>
                      {" and "}
                      <code>
                        {"[3, 0]"}
                      </code>
                      {"."}
                    </Prose>
                    <Prose>
                      {"Now take the maximum separately in each channel. Channel 1 gets 3 from donor 3; channel 2 gets 2 from donor −2. The summary is "}
                      <code>
                        {"[3, 2]"}
                      </code>
                      {": it retains the strongest positive and negative magnitudes from different donors. If we had taken raw max first, only 3 would remain, and transforming it would produce "}
                      <code>
                        {"[3, 0]"}
                      </code>
                      {". The negative donor's information would already be lost."}
                    </Prose>
                    <Prose>
                      {"For a shared donor transform "}
                      <code>
                        {"φ"}
                      </code>
                      {", let "}
                      <code>
                        {"j"}
                      </code>
                      {" name an output channel and "}
                      <code>
                        {"a_{v,j}"}
                      </code>
                      {" the receiving summary in that channel. Pooling means"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"a_{v,j}=\\max_{u\\in\\mathcal N(v)}\\phi(h_u)_j."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"The maximizing donor can differ between channels. The original GraphSAGE pooling variant uses a learned per-neighbor map before the maximum. A deeper local MLP can be used too. A finite two-channel example explains the order; it does not make every multiset distinguishable."}
                    </Prose>
                    <CodeBlock language="python" filename="pre-transform-neighbor-pooling.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"def max_after_transform(donors, weight, bias):\n    transformed = torch.nn.functional.linear(donors, weight, bias).relu()\n    if len(donors) == 0:\n        return transformed.new_zeros(weight.shape[0])\n    return transformed.amax(dim=0)"}
                    </CodeBlock>
                    <Prose>
                      {"The declared empty-list result is zero, the useful layer/editor convention; a mathematical maximum of an empty set is not an ordinary real number. The complete "}
                      <code>
                        {"graph-aggregation-variants.py"}
                      </code>
                      {" supplies the learned "}
                      <code>
                        {"NeighborPool"}
                      </code>
                      {" module. Away from ties it sends max-pool gradient through the winning donor in each channel. At ties a chosen subgradient can distribute or assign credit differently across reducers; there is no unique classical derivative to assert."}
                    </Prose>
                    <Prose>
                      {"Change donor −2 to −3: the second pooled channel becomes 3 while raw max remains 3. Change it to zero: the negative-magnitude channel becomes zero. Both cases make the lost information visible."}
                    </Prose>
                    <H3>
                      {"How can that expanding pool be mapped to an ordinary library layer?"}
                    </H3>
                    <Prose>
                      {"Follow the declared extra zero input channel through the library's pre-pool map, reduction and fixed output map."}
                    </Prose>
                    <div data-flow-view="D14-library">
                      <MessagePassingPoolLibraryLab />
                    </div>
                    <Prose>
                      {"The installed "}
                      <code>
                        {"SAGEConv(..., project=True)"}
                      </code>
                      {" pre-pool projection preserves the input width. Thus "}
                      <code>
                        {"SAGEConv(1, 2, aggr='max', project=True)"}
                      </code>
                      {" maps 1→1 before max, then 1→2 afterward. Its output width does not create our two-channel donor features before the reduction."}
                    </Prose>
                    <Prose>
                      {"For an exact comparison, explicitly encode scalar "}
                      <code>
                        {"x"}
                      </code>
                      {" as "}
                      <code>
                        {"[x, 0]"}
                      </code>
                      {". Use "}
                      <code>
                        {"SAGEConv(2, 2, aggr='max', project=True, root_weight=False, bias=False)"}
                      </code>
                      {". Set the pre-pool map to "}
                      <code>
                        {"[[1, 0], [−1, 0]]"}
                      </code>
                      {", its bias to zero, and the post-pool map to the identity. The own branch is absent in this controlled pooling comparison. The three projected/ReLU rows and pooled "}
                      <code>
                        {"[3, 2]"}
                      </code>
                      {" then match the scalar scratch operation exactly."}
                    </Prose>
                    <CodeBlock language="python" filename="mapped-two-channel-sage-pool.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"from torch_geometric.nn import SAGEConv\n\npool = SAGEConv(2, 2, aggr='max', project=True,\n                root_weight=False, bias=False).double()\nwith torch.no_grad():\n    pool.lin.weight.copy_(pool.lin.weight.new_tensor([[1., 0.], [-1., 0.]]))\n    pool.lin.bias.zero_()\n    pool.lin_l.weight.copy_(torch.eye(2, dtype=torch.float64))\npool.lin_l.weight.requires_grad_(False)"}
                    </CodeBlock>
                    <Prose>
                      {"The larger library parameter space can also respond to arbitrary nonzero second input channels; our declared encoded dataset cannot. For the matched gradient/update comparison, the second input column remains zero, its weight gradient is zero, the post-map remains fixed, and corresponding pre-map weights and biases are updated identically. The comparison includes changed non-tied donors and the isolated-target zero reduction in the installed version. Adding an ordinary own-state branch afterward uses the receiver's declared two-channel row and its own mapped parameters."}
                    </Prose>
                    <H3>
                      {"What does normalizing a row keep, and what does it discard?"}
                    </H3>
                    <Prose>
                      {"Follow the state "}
                      <code>
                        {"(3, 4)"}
                      </code>
                      {" to its length and its unit-direction row."}
                    </Prose>
                    <div data-flow-view="D15a">
                      <MessagePassingAggregationDirectionLab />
                    </div>
                    <Prose>
                      {"The length of "}
                      <code>
                        {"(3, 4)"}
                      </code>
                      {" is "}
                      <code>
                        {"√(3² + 4²) = 5"}
                      </code>
                      {". Dividing by 5 gives "}
                      <code>
                        {"(0.6, 0.8)"}
                      </code>
                      {", which has length 1 and points in the same direction. This "}
                      <strong>
                        {"L2 row normalization"}
                      </strong>
                      {" removes the overall size of a nonzero row while preserving its direction."}
                    </Prose>
                    <Prose>
                      {"If the row is multiplied by a positive magnitude, its normalized direction stays "}
                      <code>
                        {"(0.6, 0.8)"}
                      </code>
                      {". At magnitude zero there is no defined unit direction; the implementation deliberately returns the zero row. The denominator is 1 only for that exact zero case, not an arbitrary epsilon added to all nonzero lengths. Write the Euclidean length just calculated as "}
                      <code>
                        {"‖h‖₂"}
                      </code>
                      {"; the subscript 2 identifies the sum-of-squares length:"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"\\operatorname{unit}(h)=h/\\|h\\|_2\\quad\\text{for }h\\ne0."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {""}
                      <code>
                        {"exact_unit_rows"}
                      </code>
                      {" writes this guarded division. It first divides by the largest absolute row entry, then normalizes the scaled row: this preserves direction while avoiding overflow or underflow when squaring finite entries. An ordinary SAGE layer's "}
                      <code>
                        {"normalize=True"}
                      </code>
                      {" applies the library's L2 normalization after aggregation and own-state combination. Its numerical epsilon floor is a distinct small-norm policy; set and examine that policy when exact unit length at tiny nonzero magnitudes matters. Both the policy and the placement affect what the next layer can use."}
                    </Prose>
                    <H3>
                      {"What does an ordered neighbor reader remember?"}
                    </H3>
                    <Prose>
                      {"Trace the three occurrence values through an LSTM's successive positions and final summary."}
                    </Prose>
                    <div data-flow-view="D15b">
                      <MessagePassingOrderedLab />
                    </div>
                    <Prose>
                      {"Mean and max do not depend on the list order. The GraphSAGE LSTM variant deliberately treats neighbors as a sequence. Reuse the earlier "}
                      <a href={"/learn/path/full-curriculum/rnns-lstms-grus?module=deep-learning-fundamentals#3-lstm-retain-write-then-expose"}>
                        {"LSTM explanation"}
                      </a>
                      {" and its "}
                      <a href={"/learn/path/full-curriculum/rnns-lstms-grus?module=deep-learning-fundamentals#translate-gate-equations-into-a-reusable-recurrent-implementation"}>
                        {"recurrent-cell implementation"}
                      </a>
                      {": the new work is gathering the neighbor list and interpreting its final hidden row as the summary. An LSTM carries both hidden and cell rows between positions; they are not the receiver's graph state."}
                    </Prose>
                    <Prose>
                      {"In the fully declared one-channel fixture in "}
                      <code>
                        {"ordered_example"}
                      </code>
                      {", reading "}
                      <code>
                        {"[1, 3, 5]"}
                      </code>
                      {" gives final hidden value approximately "}
                      <code>
                        {"0.6763694651"}
                      </code>
                      {"; reading "}
                      <code>
                        {"[5, 3, 1]"}
                      </code>
                      {" gives "}
                      <code>
                        {"0.4666702850"}
                      </code>
                      {". Every parameter is fixed explicitly in that function. The only change is the order. The ascending/descending choice and first-occurrence value control expose those contributions without switching the aggregation method."}
                    </Prose>
                    <Prose>
                      {"Randomizing neighbor order can provide a distribution of summaries; it does not make one evaluated LSTM exactly permutation invariant. For a variable-size neighborhood, the summary must also specify how an empty list and padding behave. Our "}
                      <code>
                        {"ordered_neighbors"}
                      </code>
                      {" batches lists of equal true length, so padded zeros never become additional neighbors. An empty neighborhood has the declared zero summary."}
                    </Prose>
                    <Prose>
                      {"The ordinary "}
                      <code>
                        {"nn.LSTM"}
                      </code>
                      {" route matches the reused recurrent class when its parameters and actual sequence lengths match. The installed PyG "}
                      <code>
                        {"LSTMAggregation"}
                      </code>
                      {" requires edges sorted by destination and uses a dense padded batch, taking the final padded position. On mixed degrees, that can process extra zero positions and give nonzero states to isolates through its biases. Our actual checked example matches that padded native route but differs from true-length summaries. Use packed/length-aware native sequences or a custom aggregation when true-length semantics are required; do not call the unqualified "}
                      <code>
                        {"aggr='lstm'"}
                      </code>
                      {" setting identical to a different padding policy."}
                    </Prose>
                    <Prose>
                      {"The complete program supplies the shared recurrent file locator, equal-length batching and matched ordinary route. The earlier cell equations are reused; each graph-specific input/state/length decision is taught here."}
                    </Prose>
                    <H3>
                      {"How can a node keep useful old information?"}
                    </H3>
                    <Prose>
                      {"Follow old sender rows into a gathered message table, then into a one-position GRU beside each receiver's old state."}
                    </Prose>
                    <div data-flow-view="D16">
                      <MessagePassingMemoryLab />
                    </div>
                    <Prose>
                      {"A "}
                      <strong>
                        {"gated update"}
                      </strong>
                      {" can blend a proposed change with information already present. The graph wiring in the picture first sums each node's incoming old rows. Each node's gathered row becomes the GRU input; that node's old row becomes the GRU hidden-state input. There is one recurrent position for this one graph round, with nodes as batch rows. No node reads a freshly updated neighbor."}
                    </Prose>
                    <Prose>
                      {"Reuse the earlier "}
                      <a href={"/learn/path/full-curriculum/rnns-lstms-grus?module=deep-learning-fundamentals#4-gru-blend-old-state-with-a-new-proposal"}>
                        {"GRU gate explanation"}
                      </a>
                      {". Its reset gate controls a recurrent contribution to the candidate, and its retain gate blends old and candidate states. In that PyTorch-matched convention, reset acts after the recurrent affine candidate map, including its recurrent bias."}
                    </Prose>
                    <Prose>
                      {"For one scalar receiver, choose old state 2, gathered message 5, reset and retain gates each 0.5, candidate input coefficient 0.1 and candidate recurrent coefficient 0.2 with zero candidate biases. The candidate is "}
                      <code>
                        {"tanh(0.1×5 + 0.5×(0.2×2)) = tanh(0.7) ≈ 0.6043677771"}
                      </code>
                      {". The new state is "}
                      <code>
                        {"0.5×2 + 0.5×0.6043677771 ≈ 1.3021838886"}
                      </code>
                      {". The candidate is computed before the final blend."}
                    </Prose>
                    <Prose>
                      {"The local retain-gate investigation holds that old state and candidate fixed. Moving retain "}
                      <code>
                        {"z"}
                      </code>
                      {" from 0 to 1 changes "}
                      <code>
                        {"(1−z)×candidate + z×old"}
                      </code>
                      {" from the candidate to the old state. It is explicitly a gate-stage intervention; the full GRU recomputes its coupled gates from input and previous state."}
                    </Prose>
                    <CodeBlock language="python" filename="graph-wired-recurrent-update.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"# RecurrentSequence is the supplied earlier implementation, loaded by the program.\nsource, target = edge_index\naggregate = old_states.new_zeros(old_states.shape)\naggregate.index_add_(0, target, old_states[source])\n_, new_states = recurrent(aggregate[:, None, :], old_states,\n                          return_sequence=False)"}
                    </CodeBlock>
                    <Prose>
                      {"The inserted axis creates shape "}
                      <code>
                        {"(nodes, one_position, input_width)"}
                      </code>
                      {". "}
                      <code>
                        {"graph_gated_round"}
                      </code>
                      {" supplies this wiring, and "}
                      <code>
                        {"ordinary_gru_cell"}
                      </code>
                      {" maps the exact reused weights and separate biases to "}
                      <code>
                        {"nn.GRUCell"}
                      </code>
                      {". Checked values, input/parameter gradients and one update agree. Preserving distinct old and next tables remains essential even though the update now has gates."}
                    </Prose>
                    <H3>
                      {"What information creates a GAT edge score?"}
                    </H3>
                    <Prose>
                      {"Follow a receiver and each permitted sender through their shared projection and endpoint contributions."}
                    </Prose>
                    <div data-flow-view="D17">
                      <MessagePassingPaperAttentionLab />
                    </div>
                    <Prose>
                      {"GCN's factors come from degrees. A "}
                      <strong>
                        {"graph attention network"}
                      </strong>
                      {", or "}
                      <strong>
                        {"GAT"}
                      </strong>
                      {", instead computes coefficients from the current node representations. Return to the original paper graph and two-channel rows. First a shared learned map "}
                      <code>
                        {"W"}
                      </code>
                      {" projects each row to "}
                      <code>
                        {"z"}
                      </code>
                      {". Two learned vectors, "}
                      <code>
                        {"a_receiver"}
                      </code>
                      {" and "}
                      <code>
                        {"a_sender"}
                      </code>
                      {", then turn a receiver row and a sender row into scalar contributions by dot products. Their sum passes through LeakyReLU to produce the edge score, written "}
                      <code>
                        {"e_{vu}"}
                      </code>
                      {" for receiver "}
                      <code>
                        {"v"}
                      </code>
                      {" reading source "}
                      <code>
                        {"u"}
                      </code>
                      {". The vectors are learned parameters; scores and the eventual attention probabilities are computed from them."}
                    </Prose>
                    <Prose>
                      {"To isolate scoring, set "}
                      <code>
                        {"W = I₂"}
                      </code>
                      {", the two-channel identity map, and both score vectors to "}
                      <code>
                        {"(1, 0)"}
                      </code>
                      {". These are explicit parameter values, rather than §3's different learned-map example. Add one self-loop at each paper, so receiver 1 reads sources 0, 1 and 2. The projected rows stay "}
                      <code>
                        {"(1, 0)"}
                      </code>
                      {", "}
                      <code>
                        {"(2, 1)"}
                      </code>
                      {" and "}
                      <code>
                        {"(4, −1)"}
                      </code>
                      {". Dotting with "}
                      <code>
                        {"(1, 0)"}
                      </code>
                      {" selects the first channel: receiver 1 contributes 2, and the senders contribute 1, 2 and 4."}
                    </Prose>
                    <Prose>
                      {"LeakyReLU keeps a positive score unchanged and multiplies a negative score by a stated slope, here 0.2. The three raw endpoint sums are therefore 3, 4 and 6; those are also the post-activation scores. If the receiver's projected feature changes, every permitted pair must be recomputed from its new endpoint contribution. A second-channel edit has no effect on these scores under the fixed "}
                      <code>
                        {"(1, 0)"}
                      </code>
                      {" score vectors, but it can still change the returned value row. That separates a parameter's actual choice from the layer's broader ability to use both channels."}
                    </Prose>
                    <Prose>
                      {"After those paths are visible, the single-head rule is"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"z_u=Wh_u,\\qquad\ne_{vu}=\\operatorname{LeakyReLU}(a_{\\mathrm{receiver}}^\\mathsf Tz_v\n                                    +a_{\\mathrm{sender}}^\\mathsf Tz_u)."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"The full-layer feature controls recompute projection and score together. The graph still determines which pairs are permitted; a large score cannot create an absent edge. Below we turn these scores into coefficients and use each coefficient to weight its sender's projected row."}
                    </Prose>
                    <H3>
                      {"What changes when only an intermediate score contribution is edited?"}
                    </H3>
                    <Prose>
                      {"Keep both receivers' endpoint sums visible while editing one already identified term."}
                    </Prose>
                    <div data-flow-view="D17b">
                      <MessagePassingSenderTermLab />
                    </div>
                    <Prose>
                      {"This separate score-stage experiment uses two sender terms 1 and 2 and two receiver terms 0 and −3. It isolates the components of the score rule rather than pretending those arbitrary scalars are a whole trained layer. Select a sender and edit its term between −8 and 8."}
                    </Prose>
                    <div data-flow-view="D17c">
                      <MessagePassingReceiverTermLab />
                    </div>
                    <Prose>
                      {"Select a receiver, edit its endpoint term, and change the LeakyReLU slope between 0 and 1. At slope 0.2 the original receiver scores are "}
                      <code>
                        {"[1, 2]"}
                      </code>
                      {" and "}
                      <code>
                        {"[−0.4, −0.2]"}
                      </code>
                      {". Both rank sender 2 above sender 1. The second pair has a smaller difference, so its normalized coefficients will differ even though the ranking is the same."}
                    </Prose>
                    <Prose>
                      {"For a strictly positive slope, this original GAT score rule is increasing in each sender term. With a common candidate set and fixed sender representations, adding a different receiver term cannot reverse their ordering. This is its "}
                      <strong>
                        {"static-ranking limitation"}
                      </strong>
                      {". It does not say a receiver can never change coefficient values. At slope zero, negative sums can tie. Different allowed candidate sets also constitute a different comparison. If a receiver is also a candidate sender, editing its whole feature row can change that sender's term too; that is not a receiver-term-only comparison."}
                    </Prose>
                    <H3>
                      {"How does a score become a mixture of values?"}
                    </H3>
                    <Prose>
                      {"Trace allowed scores through shifted exponentials, their total, shares and weighted value products."}
                    </Prose>
                    <div data-flow-view="D18">
                      <MessagePassingNormalizedReadLab />
                    </div>
                    <Prose>
                      {"We temporarily switch to two supplied scores "}
                      <code>
                        {"0"}
                      </code>
                      {" and "}
                      <code>
                        {"ln 3"}
                      </code>
                      {" to make the normalization arithmetic exact; they are not the three scores from the full-layer example. Here "}
                      <code>
                        {"ln 3"}
                      </code>
                      {" is the number whose exponential is 3. Exponentiating the scores produces masses 1 and 3; dividing by their total 4 produces shares 1/4 and 3/4. These computed shares are the "}
                      <strong>
                        {"attention coefficients"}
                      </strong>
                      {", written "}
                      <code>
                        {"α_{vu}"}
                      </code>
                      {" for receiver "}
                      <code>
                        {"v"}
                      </code>
                      {" reading source "}
                      <code>
                        {"u"}
                      </code>
                      {"."}
                    </Prose>
                    <Prose>
                      {"For returned values 1 and 5, the weighted products are "}
                      <code>
                        {"1/4 × 1"}
                      </code>
                      {" and "}
                      <code>
                        {"3/4 × 5"}
                      </code>
                      {". Their sum is 4. Scores decide how strongly a sender is read; values are the information returned. They are different quantities even when a layer's shared projection contributes to both."}
                    </Prose>
                    <Prose>
                      {"For numerical stability, subtract the largest allowed score for each receiver, calling it "}
                      <code>
                        {"c_v"}
                      </code>
                      {", before exponentiating. In this two-score example, shifted masses are "}
                      <code>
                        {"exp(−ln 3) = 1/3"}
                      </code>
                      {" and "}
                      <code>
                        {"exp(0) = 1"}
                      </code>
                      {"; dividing by their total "}
                      <code>
                        {"4/3"}
                      </code>
                      {" still gives 1/4 and 3/4. In the full layer, the returned value is "}
                      <code>
                        {"z_u"}
                      </code>
                      {", the sender's projected row, and the receiving output is "}
                      <code>
                        {"h'_v"}
                      </code>
                      {". Those steps give"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"\\alpha_{vu}=\\frac{\\exp(e_{vu}-c_v)}{\\sum_{k\\in\\mathcal N(v)}\\exp(e_{vk}-c_v)},\\qquad\nc_v=\\max_{k\\in\\mathcal N(v)}e_{vk},\\qquad\nh'_v=\\sum_{u\\in\\mathcal N(v)}\\alpha_{vu}z_u."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"The common factor "}
                      <code>
                        {"exp(−c_v)"}
                      </code>
                      {" cancels between numerator and denominator, which proves why the shift preserves shares. It avoids exponentiating unnecessarily large numbers. Subtract separately for each receiver and head: a global softmax would let unrelated receivers compete for one probability total."}
                    </Prose>
                    <Prose>
                      {"Place the computed shares beside the paper rows they actually multiply."}
                    </Prose>
                    <div data-flow-view="D18-paper-read">
                      <MessagePassingPaperRead />
                    </div>
                    <Prose>
                      {"Return now to receiver 1's complete paper-graph example. Scores "}
                      <code>
                        {"[3, 4, 6]"}
                      </code>
                      {" become masses "}
                      <code>
                        {"[exp(−3), exp(−2), 1]"}
                      </code>
                      {" after subtracting 6. Their shares are approximately "}
                      <code>
                        {"[0.042010066, 0.114195199, 0.843794734]"}
                      </code>
                      {", paired with the projected rows "}
                      <code>
                        {"(1, 0)"}
                      </code>
                      {", "}
                      <code>
                        {"(2, 1)"}
                      </code>
                      {" and "}
                      <code>
                        {"(4, −1)"}
                      </code>
                      {". The first output channel is "}
                      <code>
                        {"0.042010066 × 1 + 0.114195199 × 2 + 0.843794734 × 4 ≈ 3.645579403"}
                      </code>
                      {". The second is "}
                      <code>
                        {"0 + 0.114195199 − 0.843794734 ≈ −0.729599535"}
                      </code>
                      {". Thus the same input rows and declared parameters lead all the way to a two-channel receiving state, rather than ending at three unexplained scores."}
                    </Prose>
                    <Prose>
                      {""}
                      <code>
                        {"segment_softmax"}
                      </code>
                      {" in "}
                      <code>
                        {"message-passing-operators.py"}
                      </code>
                      {" writes the per-receiver maximum, shifted exponentials and receiving sum explicitly. Its maximum is detached for numerical centering; derivatives through the scores and normalized coefficients remain connected. "}
                      <code>
                        {"incoming_sum"}
                      </code>
                      {" then accumulates each coefficient-times-value at its actual receiver."}
                    </Prose>
                    <H3>
                      {"Which returned value or permission changes the current read?"}
                    </H3>
                    <Prose>
                      {"Follow one selected value, then the allowed pair, without changing the meaning of the score-stage fixture."}
                    </Prose>
                    <div data-flow-view="D18a">
                      <MessagePassingReturnedValueLab />
                    </div>
                    <Prose>
                      {"The score-stage context retains its two returned scalar values, initially 1 and 3. Selecting a sender and editing its value between −8 and 8 changes both permitted receivers' products and outputs. It does not directly change the independently supplied endpoint terms in this isolated stage."}
                    </Prose>
                    <div data-flow-view="D18b">
                      <MessagePassingPermissionLab />
                    </div>
                    <Prose>
                      {"Select a receiver and sender, then toggle that pair's permission. A forbidden extreme-valued sender contributes nothing to the read. A receiver with exactly one permitted sender returns that sender's value with share 1. With no permitted senders, this normalized-distribution experiment has an undefined distribution and output; its labels say so. The separate complete graph layer has a declared zero aggregate for an empty incoming set, before its bias. That software convention is a different statement from having an attention distribution over an empty set."}
                    </Prose>
                    <H3>
                      {"Where do multiple graph-attention heads sit?"}
                    </H3>
                    <Prose>
                      {"Follow separate projections and coefficient calculations into both concatenated and averaged output routes."}
                    </Prose>
                    <div data-flow-view="D19">
                      <MessagePassingHeadsLab />
                    </div>
                    <Prose>
                      {"One head has its own projected values and score parameters. Another head can read the same neighborhood differently. If each head produces two channels, two heads yield two distinct two-channel outputs per node. Concatenating them creates four channels; averaging corresponding channels creates two. Neither operation changes the number of nodes."}
                    </Prose>
                    <Prose>
                      {"Call the number of heads "}
                      <code>
                        {"n_heads"}
                      </code>
                      {", keeping "}
                      <code>
                        {"H"}
                      </code>
                      {" for the node-state table introduced in §1. With per-head width "}
                      <code>
                        {"d_out"}
                      </code>
                      {", concatenation yields width "}
                      <code>
                        {"n_heads × d_out"}
                      </code>
                      {"; averaging yields width "}
                      <code>
                        {"d_out"}
                      </code>
                      {". The head-count control changes those labelled branches and both output shapes. Each head's coefficients still normalize only over that receiver's allowed sources."}
                    </Prose>
                    <Prose>
                      {"The complete scratch "}
                      <code>
                        {"SparseGraphAttention"}
                      </code>
                      {" projects into "}
                      <code>
                        {"(nodes, heads, channels)"}
                      </code>
                      {", computes "}
                      <code>
                        {"(edges, heads)"}
                      </code>
                      {" coefficients, sums "}
                      <code>
                        {"(edges, heads, channels)"}
                      </code>
                      {" messages, then concatenates or averages. Its ordinary "}
                      <code>
                        {"GATConv"}
                      </code>
                      {" mapping declares heads, concatenation, slope, zero attention dropout, loop insertion, no residual route and the output bias. The checked comparison covers both merges and empty/changed directed supports. During ordinary training dropout would change the realization, so it is disabled for the matched deterministic calculation."}
                    </Prose>
                    <H3>
                      {"Can the same candidates reverse rank for different receivers?"}
                    </H3>
                    <Prose>
                      {"Follow each receiver–sender pair's two-dimensional sum through the nonlinearity before its final score."}
                    </Prose>
                    <div data-flow-view="D20">
                      <MessagePassingDynamicAttentionLab />
                    </div>
                    <Prose>
                      {"Original GAT's receiver enters the scalar sum too late to reverse a common sender ordering. "}
                      <strong>
                        {"GATv2"}
                      </strong>
                      {" changes that order: apply the nonlinearity to the sum of the projected vectors before reducing to one score. Use a new two-receiver/two-sender fixture because its controlled reversal is easier to follow than the original path."}
                    </Prose>
                    <Prose>
                      {"The scalar receivers are "}
                      <code>
                        {"r = −1, +1"}
                      </code>
                      {", and both may read scalar senders "}
                      <code>
                        {"k = −1, +1"}
                      </code>
                      {". Project a receiver to "}
                      <code>
                        {"[r, −r]"}
                      </code>
                      {" and a sender to "}
                      <code>
                        {"[−k, k]"}
                      </code>
                      {". The pair sum is "}
                      <code>
                        {"[r−k, k−r]"}
                      </code>
                      {". Apply LeakyReLU with slope 0.2 to each coordinate, then dot with "}
                      <code>
                        {"a = [−1.25, −1.25]"}
                      </code>
                      {". Its result is "}
                      <code>
                        {"−|r−k|"}
                      </code>
                      {": equal receiver/sender values score 0, opposite values score −2."}
                    </Prose>
                    <Prose>
                      {"For receiver −1, scores are "}
                      <code>
                        {"[0, −2]"}
                      </code>
                      {"; for receiver +1, they are "}
                      <code>
                        {"[−2, 0]"}
                      </code>
                      {". Softmax gives "}
                      <code>
                        {"[0.880797078, 0.119202922]"}
                      </code>
                      {" and its reverse. Returning the projected sender values "}
                      <code>
                        {"[1, −1]"}
                      </code>
                      {" and "}
                      <code>
                        {"[−1, 1]"}
                      </code>
                      {" gives receiver outputs "}
                      <code>
                        {"[0.761594156, −0.761594156]"}
                      </code>
                      {" and the opposite. The ranking really changes while support and candidates stay fixed."}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"e_{vu}=a^\\mathsf T\\operatorname{LeakyReLU}(W_{\\mathrm{receiver}}h_v+\n                                         W_{\\mathrm{sender}}h_u)."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"Receiver 0 ties the candidates, so its mixture is "}
                      <code>
                        {"[0, 0]"}
                      </code>
                      {". Receiver "}
                      <code>
                        {"+0.5"}
                      </code>
                      {" scores them "}
                      <code>
                        {"−1.5"}
                      </code>
                      {" and "}
                      <code>
                        {"−0.5"}
                      </code>
                      {", producing shares "}
                      <code>
                        {"[0.268941421, 0.731058579]"}
                      </code>
                      {" and mixture "}
                      <code>
                        {"[−0.462117157, 0.462117157]"}
                      </code>
                      {". Each changed score follows the whole projection/nonlinearity route, not a free rank selector."}
                    </Prose>
                    <Prose>
                      {"The new sparse program implements this coupled calculation. Its mapped "}
                      <code>
                        {"GATv2Conv"}
                      </code>
                      {" uses "}
                      <code>
                        {"share_weights=False"}
                      </code>
                      {": in the installed implementation "}
                      <code>
                        {"lin_l"}
                      </code>
                      {" is the source projection and "}
                      <code>
                        {"lin_r"}
                      </code>
                      {" the receiver projection. Projection biases, attention vector, output bias, loops, heads and merge are all mapped. A no-loop empty receiver keeps the zero-aggregate policy plus output bias. Checked forward values, gradients and an update agree with the ordinary layer; the reversal example is a constructed mechanism, not a claim of superior performance on every graph."}
                    </Prose>
                    <H3>
                      {"Can useful rows be learned without class labels?"}
                    </H3>
                    <Prose>
                      {"Trace an anchor's positive and negative context scores into their two loss contributions."}
                    </Prose>
                    <div data-flow-view="D21">
                      <MessagePassingContextObjectiveLab />
                    </div>
                    <Prose>
                      {"So far a target entered a supervised loss. A GraphSAGE-style unsupervised objective can instead make an anchor representation compatible with sampled nearby context and less compatible with sampled negatives. The sampling rule defines the task: nearby context can come from random walks, and a sampled noncontext is not guaranteed to be a true semantic negative."}
                    </Prose>
                    <Prose>
                      {"Use scalar anchor 1, positive context 2 and negative context −1. Their dot scores are 2 and −1. A logistic positive loss is "}
                      <code>
                        {"softplus(−2) ≈ 0.126928"}
                      </code>
                      {"; a logistic negative loss is "}
                      <code>
                        {"softplus(−1) ≈ 0.313262"}
                      </code>
                      {". Their total is approximately "}
                      <code>
                        {"0.440189699"}
                      </code>
                      {". Here "}
                      <code>
                        {"softplus(s) = log(1 + exp(s))"}
                      </code>
                      {"; the ordinary stable primitive avoids directly overflowing that exponential."}
                    </Prose>
                    <Prose>
                      {"For one anchor row "}
                      <code>
                        {"z"}
                      </code>
                      {", supplied positive rows "}
                      <code>
                        {"p_i"}
                      </code>
                      {" and negative rows "}
                      <code>
                        {"n_j"}
                      </code>
                      {", the program writes"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"L(z)=\\sum_i\\operatorname{softplus}(-p_i^\\mathsf Tz)\n       +\\sum_j\\operatorname{softplus}(n_j^\\mathsf Tz)."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"The derivative of softplus at a score "}
                      <code>
                        {"s"}
                      </code>
                      {" is "}
                      <code>
                        {"exp(s)/(1 + exp(s))"}
                      </code>
                      {", equivalently "}
                      <code>
                        {"1/(1 + exp(−s))"}
                      </code>
                      {". This number between zero and one is the "}
                      <strong>
                        {"sigmoid"}
                      </strong>
                      {", written "}
                      <code>
                        {"sigmoid(s)"}
                      </code>
                      {". Each dot score also has a derivative with respect to the anchor: −2 for the positive-loss argument and −1 for the negative-loss argument here. Multiplying those local derivatives gives the anchor derivative "}
                      <code>
                        {"−2 sigmoid(−2) − sigmoid(−1) ≈ −0.5073472654"}
                      </code>
                      {". Increasing the anchor slightly lowers these two sampled losses. If the negative context becomes positive and similar to the anchor, its negative term increases instead. The negative-value control updates the score, loss and derivative together."}
                    </Prose>
                    <Prose>
                      {"The complete program supplies "}
                      <code>
                        {"sampled_context_loss"}
                      </code>
                      {" using matrix–vector scores and stable softplus. Changing how contexts and negatives are sampled changes the objective's interpretation. It does not automatically supply a class decision or a legal evaluation protocol. That brings us to the next question: which graph information and labels were allowed to be visible when these rows were fitted?"}
                    </Prose>
                    <H2>
                      {"5. The data split is part of the graph model"}
                    </H2>
                    <H3>
                      {"Which information may be visible when only some labels are known?"}
                    </H3>
                    <Prose>
                      {"Follow feature-to-message arrows separately from label-to-loss arrows."}
                    </Prose>
                    <div data-flow-view="D22">
                      <MessagePassingTransductiveBoundaryLab />
                    </div>
                    <Prose>
                      {"Return to the three papers. Suppose their relationships and features are available, but only paper 1's subject label is revealed for fitting. Papers 0 and 2 still have rows that paper 1 can read. Their hidden subject labels have no wire into those rows, the update, or the fitting loss. A label drawn for later assessment is an annotation, not an input."}
                    </Prose>
                    <Prose>
                      {"For this task, the model is asked to classify unlabeled papers in a graph already available during fitting. That protocol is "}
                      <strong>
                        {"transductive node prediction"}
                      </strong>
                      {". The available unlabeled context is part of the stated input. A training-label mask selects which predictions enter the fitting loss; it does not remove the other nodes from the computation."}
                    </Prose>
                    <Prose>
                      {"Let "}
                      <code>
                        {"logits"}
                      </code>
                      {" hold the complete table of unnormalized class scores, one row per node. A Boolean "}
                      <code>
                        {"fit_mask"}
                      </code>
                      {" selects the rows whose labels are available for fitting. The cross-entropy loss therefore reads only these paired score and label rows:"}
                    </Prose>
                    <CodeBlock language="python" filename="fit-only-supervised-loss.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"loss = torch.nn.functional.cross_entropy(logits[fit_mask], labels[fit_mask])"}
                    </CodeBlock>
                    <Prose>
                      {"This classifier-loss excerpt selects fit labels only after computing node outputs. It is valid when the full feature/relationship context was explicitly available for the task. It would be a leak if those supposedly available rows had already encoded withheld labels or future events."}
                    </Prose>
                    <Prose>
                      {"The context control includes or excludes unlabeled paper 2 under two explicitly different input contracts. Changing paper 2's feature can change paper 1's state while the fitting-label mask remains identical. The picture shows that dependency rather than calling all unlabeled information forbidden. Assessment labels never change the representation when their annotation is edited."}
                    </Prose>
                    <H3>
                      {"What changes when a node or graph was unavailable during fitting?"}
                    </H3>
                    <Prose>
                      {"Keep unseen objects outside the fitting computation, then attach them only at the declared evaluation boundary."}
                    </Prose>
                    <div data-flow-view="D23-inductive">
                      <MessagePassingInductiveBoundaryFigure />
                    </div>
                    <Prose>
                      {"If the fitted rule must work on newly arriving papers or an entirely new network, the protocol is "}
                      <strong>
                        {"inductive evaluation"}
                      </strong>
                      {". A held-out label mask alone is not enough to establish it: a supposedly unseen node must not have participated in fitting through its features, edges or graph-derived preprocessing. For held-out whole graphs, fit the shared functions on the available graphs and apply them to the later graph."}
                    </Prose>
                    <Prose>
                      {"The layer can transfer because its learned channel maps are shared rather than indexed by training-node identity. GCN, SAGE and GAT can all be applied to a new graph with compatible input channels. Sampling is a computation strategy, not the definition of inductive learning. Likewise, a feature column that is merely a lookup of training-node IDs cannot acquire useful features for arbitrary new IDs by switching a layer name."}
                    </Prose>
                    <Prose>
                      {"An arriving graph has its own current degrees and neighborhoods. Recompute any graph-dependent normalizer from that graph. A cached operator for the old node set represents the wrong input, even when the learned weights have stayed unchanged."}
                    </Prose>
                    <H3>
                      {"What if an edge belongs to the future?"}
                    </H3>
                    <Prose>
                      {"Follow the observation cutoff through available edges, derived features and the separately scored target pair."}
                    </Prose>
                    <div data-flow-view="D23">
                      <MessagePassingTemporalBoundaryLab />
                    </div>
                    <Prose>
                      {"At time "}
                      <code>
                        {"t₀"}
                      </code>
                      {", the available path is "}
                      <code>
                        {"0—1"}
                      </code>
                      {"; paper 2 exists, but the future "}
                      <code>
                        {"1—2"}
                      </code>
                      {" relationship has not been observed. The task is to score that candidate relationship using information available at "}
                      <code>
                        {"t₀"}
                      </code>
                      {". Its pair head can read representations of the two endpoints; it must not insert the future relationship into the message adjacency to obtain those representations."}
                    </Prose>
                    <Prose>
                      {"At time "}
                      <code>
                        {"t₁"}
                      </code>
                      {", the relationship is known. Adding it earlier would create a direct future message route and change the graph's degrees. Even if the target label is excluded from the loss, a degree feature computed from the future graph can carry that information into the earlier model. The denied route in the picture therefore includes both the target edge and its derived-feature path."}
                    </Prose>
                    <Prose>
                      {"The cutoff control compares the two information states. The available node rows, edges, degrees and normalizer change together, and the readout identifies the later state as unavailable for the original earlier prediction. If there is no post-cutoff relationship, this particular difference disappears. The timeline is about information access, not a graph-layer failure."}
                    </Prose>
                    <Prose>
                      {"For a temporal task, define the cutoff before building features, adjacency, contexts and labels. Fit any learned preprocessing on the legal fitting information and apply it to later examples without using their answers. A static transductive classroom experiment and a future-time forecast answer different questions; their scores should not be interpreted as the same evidence."}
                    </Prose>
                    <H3>
                      {"How can I decide whether a cached operator is still valid?"}
                    </H3>
                    <Prose>
                      {"Match the cached graph identity to the graph actually feeding the next computation."}
                    </Prose>
                    <Prose>
                      {"The normalizing matrix "}
                      <code>
                        {"S"}
                      </code>
                      {" is determined by adjacency, edge strengths, loop policy and receiving degrees. It can be reused while those inputs are unchanged. Editing only a raw node value leaves this fixed operator valid. Editing an edge, adding a node or changing the loop policy requires a new operator. If attention values or scores depend on changing node states, those state-dependent coefficients also need recomputation even on a fixed topology."}
                    </Prose>
                    <Prose>
                      {"This distinction is practical: caching a fixed GCN normalizer can save work in a suitable fixed-graph task, while reusing a stale one silently evaluates another graph. The ordinary comparison uses "}
                      <code>
                        {"cached=False"}
                      </code>
                      {" when edges may change. The saved-model inspector will keep model, input and graph identities separate so that a diagnostic edit cannot masquerade as an untouched recorded assessment."}
                    </Prose>
                    <Prose>
                      {"We now have explicit message rules, parameter updates and information boundaries. The next section switches from the constructed paper graph to one observed network, keeping those choices visible through a complete fit and its actual results."}
                    </Prose>
                    <H2>
                      {"6. A complete experiment on an observed network"}
                    </H2>
                    <H3>
                      {"Can these rules learn anything from a network that people actually observed?"}
                    </H3>
                    <Prose>
                      {"Replace the three constructed papers with a recorded social network, and keep its observations separate from the answers we want to predict."}
                    </Prose>
                    <div data-flow-view="D24">
                      <MessagePassingObservedGraphFigure />
                    </div>
                    <Prose>
                      {"Each numbered node in this picture is a member of the karate club recorded in Wayne Zachary's study. An edge records an observed relationship. There are 34 members and 78 unique undirected relationships; a drawn line connects both endpoints. The positions help us read those relationships. They are not measured physical locations and do not enter the classifier."}
                    </Prose>
                    <Prose>
                      {"The small class annotation describes which of two clubs the member joined after the historical split: class 0 is NetworkX's “Mr.Hi” group and class 1 its “Officer” group. This is the answer column. It is drawn so we can inspect the experiment, but it is not supplied as an input feature. A different shape or role label identifies whether a member's answer is used for fitting, development or assessment. Class and experimental role answer different questions."}
                    </Prose>
                    <Prose>
                      {"The distributed source also records positive integer edge weights representing interaction contexts. Our declared classroom experiment uses a "}
                      <strong>
                        {"binary relationship graph"}
                      </strong>
                      {": each observed relationship has strength 1, irrespective of that original context count. The original weights remain in the downloadable source data. We are teaching and testing this explicitly simpler operator, not claiming to have fitted the weighted source graph."}
                    </Prose>
                    <Prose>
                      {"We chose this small network because we can inspect the complete input and replay a fitted model without special hardware. It is one historical network. Its 34 connected members are not 34 independent population samples. The task is to classify member groups under a declared transductive protocol, not forecast a future social conflict or explain its causes."}
                    </Prose>
                    <H3>
                      {"What does the model actually know about a member?"}
                    </H3>
                    <Prose>
                      {"Read three numbers from the original available graph, before applying any message layer."}
                    </Prose>
                    <div data-flow-view="D25">
                      <MessagePassingObservedFeaturesLab />
                    </div>
                    <Prose>
                      {"The selected member appears with its immediate neighbors and the observed relationships among those neighbors. The input row has three channels:"}
                    </Prose>
                    <ol start={1}>
                      <li>
                        {"A constant 1, allowing a shared learned map to use an offset-like input signal."}
                      </li>
                      <li>
                        {"The member's binary degree divided by 33. There are at most 33 other members to connect to in this graph."}
                      </li>
                      <li>
                        {"The fraction of possible neighbor pairs that are connected to one another. This is the "}
                        <strong>
                          {"local clustering coefficient"}
                        </strong>
                        {": it measures how often two neighbors also have their own relationship."}
                      </li>
                    </ol>
                    <Prose>
                      {"For member 0, there are 16 neighbors. Those neighbors form 18 connected pairs out of "}
                      <code>
                        {"16×15/2=120"}
                      </code>
                      {" possible pairs. Its clustering coefficient is therefore "}
                      <code>
                        {"18/120=.15"}
                      </code>
                      {", and its row is "}
                      <code>
                        {"[1, 16/33, .15]"}
                      </code>
                      {". In the picture, each counted triangle has member 0 at one corner and a connected neighbor pair at the other two. A relationship joining two unrelated nodes elsewhere in the graph does not contribute to this member's count."}
                    </Prose>
                    <Prose>
                      {"Choose another member to see its actual neighbor IDs, closed triangles and denominators. At degree 0 or 1, no pair of neighbors exists; the declared clustering value is 0, rather than dividing by a zero denominator. These feature channels describe structure already visible in the known graph. They are not club labels and are not fitted from assessment answers."}
                    </Prose>
                    <Prose>
                      {"For member "}
                      <code>
                        {"i"}
                      </code>
                      {", let "}
                      <code>
                        {"k_i"}
                      </code>
                      {" be its degree and "}
                      <code>
                        {"t_i"}
                      </code>
                      {" the number of connected neighbor pairs. The number of possible unordered pairs is "}
                      <code>
                        {"k_i(k_i−1)/2"}
                      </code>
                      {", also written "}
                      <code>
                        {"\\binom{k_i}{2}"}
                      </code>
                      {". Write its clustering fraction as "}
                      <code>
                        {"c_i"}
                      </code>
                      {" and its three-channel feature row as "}
                      <code>
                        {"x_i"}
                      </code>
                      {". Then"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"x_i=\\left[1,\\frac{k_i}{33},c_i\\right],\\qquad\nc_i=\\begin{cases}t_i/\\binom{k_i}{2},&k_i\\ge2,\\\\0,&k_i<2.\\end{cases}"}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"The download includes these source-derived values. We can load them directly without asking the learner to install a graph package merely to reproduce the lesson. NetworkX's documented generator and BSD license provide the provenance of this distributed representation; the source notes explain its relationship to Zachary's original paper."}
                    </Prose>
                    <CodeBlock language="python" filename="observed-graph-feature-rows.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"import json\nfrom pathlib import Path\nimport torch\n\ndata = json.loads(Path(\"karate-club.json\").read_text(encoding=\"utf-8\"))\nfeatures = torch.tensor([\n    [1.0, node[\"degree\"] / 33.0, node[\"clustering\"]]\n    for node in data[\"nodes\"]\n])\ntargets = torch.tensor([node[\"club\"] for node in data[\"nodes\"]])\nadjacency = torch.zeros(len(data[\"nodes\"]), len(data[\"nodes\"]))\nfor left, right, source_context_count in data[\"edges\"]:\n    adjacency[left, right] = adjacency[right, left] = 1.0"}
                    </CodeBlock>
                    <Prose>
                      {"The final assignment deliberately uses "}
                      <code>
                        {"1.0"}
                      </code>
                      {", not "}
                      <code>
                        {"source_context_count"}
                      </code>
                      {". The target tensor is separate from the three-column feature tensor. The nodes are stored in their declared zero-based ID order; "}
                      <code>
                        {"paper_id"}
                      </code>
                      {" in the data preserves the paper's one-based numbering. An ID is an address for a row, not a numeric feature to classify."}
                    </Prose>
                    <H3>
                      {"How do two layers turn these rows into a training signal?"}
                    </H3>
                    <Prose>
                      {"Follow the complete computation from three input channels to two class scores, then follow only the allowed answers into the loss."}
                    </Prose>
                    <div data-flow-view="D26">
                      <MessagePassingSavedPipelineFigure />
                    </div>
                    <Prose>
                      {"The first layer reads the "}
                      <code>
                        {"34×3"}
                      </code>
                      {" input matrix and computes 16 channels for each of the 34 members. Its weights are shared across members. ReLU then replaces negative computed entries with zero. The second layer reads those "}
                      <code>
                        {"34×16"}
                      </code>
                      {" hidden rows and computes two scores per member, giving a "}
                      <code>
                        {"34×2"}
                      </code>
                      {" result. The two scores are "}
                      <strong>
                        {"logits"}
                      </strong>
                      {", the unnormalized class scores introduced in the split diagram in section 5. We do not apply a final ReLU: class scores may be negative."}
                    </Prose>
                    <Prose>
                      {"In the GCN branch, each layer uses the normalized graph operator "}
                      <code>
                        {"S"}
                      </code>
                      {" from “GCN: a normalized weighted sum.” Call the input table "}
                      <code>
                        {"X"}
                      </code>
                      {", the first hidden table "}
                      <code>
                        {"H⁽¹⁾"}
                      </code>
                      {", and the final logit table "}
                      <code>
                        {"Z"}
                      </code>
                      {". "}
                      <code>
                        {"X"}
                      </code>
                      {" has 3 channels, "}
                      <code>
                        {"W₁"}
                      </code>
                      {" has shape "}
                      <code>
                        {"16×3"}
                      </code>
                      {", "}
                      <code>
                        {"b₁"}
                      </code>
                      {" has 16 entries, "}
                      <code>
                        {"W₂"}
                      </code>
                      {" has shape "}
                      <code>
                        {"2×16"}
                      </code>
                      {", and "}
                      <code>
                        {"b₂"}
                      </code>
                      {" has 2 entries. Each bias row is repeated, or "}
                      <strong>
                        {"broadcast"}
                      </strong>
                      {", to all 34 members after its aggregation. With PyTorch's "}
                      <code>
                        {"(output,input)"}
                      </code>
                      {" weight storage, the complete forward pass is"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"H^{(1)}=\\operatorname{ReLU}(SXW_1^{\\mathsf T}+b_1),\\qquad\nZ=SH^{(1)}W_2^{\\mathsf T}+b_2."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"The corresponding SAGE and GAT branches replace the layer's aggregation decision with their own already traced rules; they do not change the meaning of the two class-score columns."}
                    </Prose>
                    <Prose>
                      {"The selected member's displayed intermediates come from the actual saved seed-11 model, not an imagined optimizer trajectory. Read its gathered or normalized first-layer contributions, the computed pre-ReLU row, its nonnegative hidden row and finally its two class scores. The drawn routes say which members supplied values and which shared channel weights acted on them. A message route can pass through an assessment member's allowed features in this transductive protocol. Its withheld answer still does not enter the fitting loss."}
                    </Prose>
                    <Prose>
                      {"To turn logits into class probabilities, exponentiate the two scores and divide by their sum. This is a softmax "}
                      <strong>
                        {"across the two class columns"}
                      </strong>
                      {", unlike GAT's softmax across a receiver's allowed senders. Implement it stably by subtracting the larger class logit first; the probabilities are unchanged by that common subtraction. The class with the larger probability is the predicted class."}
                    </Prose>
                    <Prose>
                      {"For a member whose observed target is "}
                      <code>
                        {"y_i"}
                      </code>
                      {", cross entropy penalizes low probability assigned to that target. Averaging over the fitting IDs "}
                      <code>
                        {"T"}
                      </code>
                      {" gives"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"\\mathcal L=-\\frac1{|T|}\\sum_{i\\in T}\\log\n\\frac{\\exp Z_{i,y_i}}{\\exp Z_{i,0}+\\exp Z_{i,1}}."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"Only the fitting IDs appear in this sum. The development and assessment IDs can have computed logits without contributing label terms. Gradients propagate backward through the second layer, ReLU and first layer into the shared parameters. PyTorch records those operations; the explicit graph-message operators still define what is differentiated. Refer back to "}
                      <a href={"/learn/path/full-curriculum/backpropagation-automatic-differentiation?module=deep-learning-fundamentals"}>
                        {"Backpropagation & Automatic Differentiation"}
                      </a>
                      {" for the local derivative/chain-rule mechanism and "}
                      <a href={"/learn/path/full-curriculum/gradient-descent-variants-sgd-adam-adagrad-rmsprop-lamb-lars?module=math-foundations"}>
                        {"Gradient Descent Variants"}
                      </a>
                      {" for the optimizer state and decoupled weight-decay mechanism."}
                    </Prose>
                    <Prose>
                      {"The full downloadable "}
                      <code>
                        {"message-passing-study.py"}
                      </code>
                      {" defines "}
                      <code>
                        {"GraphLayer"}
                      </code>
                      {", "}
                      <code>
                        {"NodeClassifier"}
                      </code>
                      {", the graph operators, split construction, baseline and training loop. Its dense matrices are appropriate for an inspectable 34-node experiment. The core fitting step is"}
                    </Prose>
                    <RemoteCodeBlock source="/learn-code/message-passing-graph-convolutions-gcn-gat-graphsage/message-passing-study.py" filename="message-passing-study.py" language="python" />
                    <CodeBlock language="python" filename="two-layer-training-step.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"operators = graph_operators(adjacency)\nfit_ids = roles[\"fit\"]  # The complete program constructs this partition first.\nmodel = NodeClassifier(\"gcn\")\noptimizer = torch.optim.AdamW(model.parameters(), lr=0.02, weight_decay=0.01)\nfor epoch in range(300):\n    logits, hidden, attention = model(features, operators)\n    loss = torch.nn.functional.cross_entropy(logits[fit_ids], targets[fit_ids])\n    optimizer.zero_grad()\n    loss.backward()\n    optimizer.step()"}
                    </CodeBlock>
                    <Prose>
                      {""}
                      <code>
                        {"optimizer.zero_grad()"}
                      </code>
                      {" clears accumulated parameter gradients for this step. "}
                      <code>
                        {"backward()"}
                      </code>
                      {" computes the current fitting loss's gradients; "}
                      <code>
                        {"step()"}
                      </code>
                      {" applies AdamW's parameter/state update. The displayed result records a completed fit. Moving an input control in the inspector later runs a new forward pass through those "}
                      <strong>
                        {"frozen weights"}
                      </strong>
                      {"; it does not execute this optimizer loop or create a newly fitted model."}
                    </Prose>
                    <H3>
                      {"Which choices were fixed before these results were inspected?"}
                    </H3>
                    <Prose>
                      {"Keep the information boundary and fitting protocol beside the measured comparison."}
                    </Prose>
                    <div data-flow-view="D27">
                      <MessagePassingRecordedStudyLab />
                    </div>
                    <Prose>
                      {"The experiment uses the known graph and all three feature channels for transductive computation. Its answer partition was constructed with NumPy generator seed 133, taking 5 fitting, 3 development and 9 assessment IDs per class: 10 fitting, 6 development and 18 assessment members. The exact IDs are included with the calculations. Deterministic degree and clustering extraction uses the permitted known graph; no learned preprocessing uses held-out answers."}
                    </Prose>
                    <Prose>
                      {"Four model families were each fitted with seeds 11, 29 and 47. Every fit used 3 input channels, 16 hidden channels, 2 output channels, ReLU, 300 epochs and AdamW with learning rate "}
                      <code>
                        {".02"}
                      </code>
                      {" and weight decay "}
                      <code>
                        {".01"}
                      </code>
                      {". There was no early stopping, dropout or neighborhood sampling. Development scores were recorded for inspection, not used to select an epoch or tune the reported architecture. The saved epoch observations are 1, 10, 50, 100 and 300; connecting these observations in a plot does not supply unmeasured intermediate observations."}
                    </Prose>
                    <Prose>
                      {"The names in the comparison refer to precise implementations:"}
                    </Prose>
                    <NeuralTable caption={"Which choices were fixed before these results were inspected?"} headers={[<>
                        {"Model"}
                      </>, <>
                        {"What each layer does"}
                      </>, <>
                        {"Trainable parameters"}
                      </>]} rows={[[<>
                        {"Structural MLP"}
                      </>, <>
                        {"Shared channel map of each member's existing three features, without a message aggregation"}
                      </>, <>
                        {"98"}
                      </>], [<>
                        {"GCN"}
                      </>, <>
                        {"Symmetric closed-neighborhood normalization, shared channel map, then bias"}
                      </>, <>
                        {"98"}
                      </>], [<>
                        {"Mean-SAGE"}
                      </>, <>
                        {"Full open-neighborhood mean plus a separate own-row map; output row normalization disabled in this declared variant"}
                      </>, <>
                        {"178"}
                      </>], [<>
                        {"GAT"}
                      </>, <>
                        {"One original additive-attention head with slope "}
                        <code>
                          {".2"}
                        </code>
                        {" and self messages"}
                      </>, <>
                        {"134"}
                      </>]]} />
                    <Prose>
                      {"For the MLP and GCN, count "}
                      <code>
                        {"3×16+16+16×2+2=98"}
                      </code>
                      {" parameters. Mean-SAGE adds a second weight map at both layers, contributing "}
                      <code>
                        {"3×16+16×2=80"}
                      </code>
                      {" more. GAT instead adds sender/receiver score vectors of lengths 16 and 2, contributing "}
                      <code>
                        {"2×16+2×2=36"}
                      </code>
                      {" more. Thus a performance comparison also changes the model's parameterization; equal hidden width does not imply equal capacity."}
                    </Prose>
                    <Prose>
                      {"The answer axis has 18 assessment members. The actual counts were"}
                    </Prose>
                    <NeuralTable caption={"Which choices were fixed before these results were inspected?"} headers={[<>
                        {"Model"}
                      </>, <>
                        {"Seed 11"}
                      </>, <>
                        {"Seed 29"}
                      </>, <>
                        {"Seed 47"}
                      </>]} rows={[[<>
                        {"Structural MLP"}
                      </>, <>
                        {"10/18"}
                      </>, <>
                        {"10/18"}
                      </>, <>
                        {"10/18"}
                      </>], [<>
                        {"GCN"}
                      </>, <>
                        {"8/18"}
                      </>, <>
                        {"8/18"}
                      </>, <>
                        {"8/18"}
                      </>], [<>
                        {"Mean-SAGE"}
                      </>, <>
                        {"10/18"}
                      </>, <>
                        {"11/18"}
                      </>, <>
                        {"9/18"}
                      </>], [<>
                        {"GAT"}
                      </>, <>
                        {"9/18"}
                      </>, <>
                        {"9/18"}
                      </>, <>
                        {"9/18"}
                      </>]]} />
                    <Prose>
                      {"The simple majority baseline gets 9/18. A separate "}
                      <strong>
                        {"label-propagation baseline"}
                      </strong>
                      {" gets 16/18: start from one-hot fitting labels, repeatedly average them over closed neighborhoods and clamp the fitting rows back to their known labels after each round, for 200 rounds. Assessment answers are used only to count correctness afterward. This baseline uses fitting-label information in its graph signal; the neural model uses fitting labels through its loss. It is a useful alternative with a different mechanism, not an architecture hidden inside the MLP."}
                    </Prose>
                    <Prose>
                      {"These are weak neural outcomes, especially for this GCN. All twelve fits, their losses/probabilities and the stronger simple baseline remain visible. Nothing in message passing guarantees that the chosen features, fit size, model, optimization and task will work well. The result teaches us to inspect the comparison and its information contract before declaring a sophisticated method superior. This single small, socially dependent graph does not establish a reliable ranking of model families or a population confidence interval."}
                    </Prose>
                    <Prose>
                      {"The complete program runs from the supplied graph file and saves the declared calculations. Keep "}
                      <code>
                        {"message-passing-study.py"}
                      </code>
                      {", "}
                      <code>
                        {"karate-club.json"}
                      </code>
                      {" and the retained provenance/license files together. The library comparison is a separate mechanism program, "}
                      <code>
                        {"graph_library_bridge.py"}
                      </code>
                      {": it compares sparse scratch layers with mapped PyG layers, values, gradients and an identical SGD step. It does not replace this observed-network study with library-generated accuracy numbers."}
                    </Prose>
                    <RemoteCodeBlock source="/learn-code/message-passing-graph-convolutions-gcn-gat-graphsage/graph_library_bridge.py" filename="graph_library_bridge.py" language="python" />
                    <H3>
                      {"How can we compute the same messages without storing a whole square matrix?"}
                    </H3>
                    <Prose>
                      {"Store only actual sender-to-receiver routes, then accumulate their contributions at the destination."}
                    </Prose>
                    <div data-flow-view="D28-gcn">
                      <MessagePassingSparseGcnLab />
                    </div>
                    <div data-flow-view="D28-sage">
                      <MessagePassingSparseSageFigure />
                    </div>
                    <div data-flow-view="D28-gat">
                      <MessagePassingSparseGatFigure />
                    </div>
                    <Prose>
                      {"For an undirected edge "}
                      <code>
                        {"0—1"}
                      </code>
                      {", the edge list has both routes "}
                      <code>
                        {"0→1"}
                      </code>
                      {" and "}
                      <code>
                        {"1→0"}
                      </code>
                      {". Its first row stores sender IDs; its second row stores receiver IDs. Gather each sender's projected feature row, multiply by that edge's coefficient, and add the resulting row to its receiver. This operation is usually called "}
                      <strong>
                        {"gather and scatter"}
                      </strong>
                      {": gathering reads addressed rows; scattering collects contributions at addressed destinations."}
                    </Prose>
                    <Prose>
                      {"For GCN, add one self route per node and count each receiver's closed incoming degree. The route "}
                      <code>
                        {"j→i"}
                      </code>
                      {" receives coefficient "}
                      <code>
                        {"1/√(d_i d_j)"}
                      </code>
                      {" under this lesson's declared receiving-degree convention. For undirected graphs, incoming and outgoing degrees coincide. For a directed graph, choosing another degree convention defines another operator. The sparse bridge and its ordinary PyG mapping use the same declared convention; a comparison is not meaningful if the two sides silently normalize different directed graphs."}
                    </Prose>
                    <Prose>
                      {"The scalar three-node path from section 3 is still a useful hand check. In receiver 1's segment, its self coefficient is "}
                      <code>
                        {"1/3"}
                      </code>
                      {"; its two endpoint coefficients are each "}
                      <code>
                        {"1/√6"}
                      </code>
                      {". The sparse list therefore yields the same sum "}
                      <code>
                        {"1/√6 + 2/3 + 4/√6"}
                      </code>
                      {" that the dense row multiplication gave. A feature edit changes the gathered value; an edge edit changes both the available routes and their current degrees."}
                    </Prose>
                    <Prose>
                      {"With node matrix "}
                      <code>
                        {"X"}
                      </code>
                      {", weight matrix "}
                      <code>
                        {"W"}
                      </code>
                      {" and edge routes, the mechanism is"}
                    </Prose>
                    <CodeBlock language="python" filename="receiving-gather-scatter.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"projected = features @ weight.T\nmessages = projected[source] * coefficients[:, None]\noutput = torch.zeros(\n    features.shape[0], projected.shape[1],\n    dtype=projected.dtype, device=projected.device,\n)\noutput.index_add_(0, target, messages)\noutput = output + bias"}
                    </CodeBlock>
                    <Prose>
                      {""}
                      <code>
                        {"index_add_(0, target, messages)"}
                      </code>
                      {" sums rows with equal target IDs along the node dimension. It does not concatenate donors into a sequence or pick the last donor. Node ordering can change while semantic IDs and all associated rows/routes change together; the output then reorders with them, just as section 1's storage permutation showed."}
                    </Prose>
                    <Prose>
                      {"The downloadable "}
                      <code>
                        {"message-passing-operators.py"}
                      </code>
                      {" supplies complete "}
                      <code>
                        {"SparseGcn"}
                      </code>
                      {", "}
                      <code>
                        {"SparseMeanSage"}
                      </code>
                      {" and "}
                      <code>
                        {"SparseGraphAttention"}
                      </code>
                      {" implementations, including empty neighborhoods, stable segmented softmax, loop policy, head layout and explicit ordinary-library mappings. The implementation projects each source row once rather than repeating a channel matrix multiplication per edge. It uses memory proportional to the projected node rows and explicit edge messages, instead of a dense "}
                      <code>
                        {"N×N"}
                      </code>
                      {" matrix. For this project-then-aggregate GCN, the principal work is "}
                      <code>
                        {"O(N d_in d_out + E d_out)"}
                      </code>
                      {"; the exact memory/work differs for sampled, fused or multi-head implementations. There is no claim that materializing edge messages is universally the best kernel."}
                    </Prose>
                    <RemoteCodeBlock source="/learn-code/message-passing-graph-convolutions-gcn-gat-graphsage/message-passing-operators.py" filename="message-passing-operators.py" language="python" />
                    <Prose>
                      {"Mean-SAGE has a different sparse reduction: count "}
                      <strong>
                        {"open-neighborhood"}
                      </strong>
                      {" incoming routes, sum the raw donor rows, and divide by the receiver's count. Apply the neighbor projection and its bias to that summary, then add the independent own-row projection. An isolate has a zero neighbor summary; its own branch and shared output bias still act. For a nonempty list a shared linear map can commute with its mean, but moving the bias inside an empty reduction would wrongly remove that bias. The actual order is the §4 rule. GAT uses a maximum and exponential sum "}
                      <strong>
                        {"per receiving segment and head"}
                      </strong>
                      {". A global softmax over all edges would make one member's unrelated donors consume another member's attention mass."}
                    </Prose>
                    <Prose>
                      {"The two controls under this drawing edit one taught path edge and one node value. Both the dense and sparse results use the current graph, including its current degrees. A changed edge invalidates the old normalized cache; changed values alone do not invalidate a fixed GCN normalizer. The displayed comparison distinguishes a deliberately stale cache from the freshly rebuilt operator instead of quietly presenting mismatched computations as equivalent."}
                    </Prose>
                    <Prose>
                      {"These scratch implementations accept simple unweighted graphs with unique edge routes and no input self loops; they add self loops explicitly when requested. Parallel or weighted relationships require a declared different input/operator contract. Do not silently coalesce duplicate routes, erase weights, and then claim to have preserved the original graph. PyG's installed layer signatures, flags and parameter layout are shown alongside the exact mappings. For the earlier scalar pooling and ordered aggregation branches, "}
                      <code>
                        {"graph-aggregation-variants.py"}
                      </code>
                      {" supplies their separate ordinary-tool bridges and explains the padding/normalization boundaries established in section 4."}
                    </Prose>
                    <H3>
                      {"Can an outgoing edge change a coefficient on another receiver's route?"}
                    </H3>
                    <Prose>
                      {"Take control of the sparse path: change its routes, rebuild its degrees, then give two GAT heads independent parameters."}
                    </Prose>
                    <div data-flow-view="D28-customization">
                      <MessagePassingSparseDirectedFigure />
                    </div>
                    <Prose>
                      {"For this exercise, switch explicitly from the 34-member study to the four-node "}
                      <code>
                        {"path_and_isolate"}
                      </code>
                      {" fixture in "}
                      <code>
                        {"graph_library_bridge.py"}
                      </code>
                      {": nodes 0—1—2 form a path and node 3 has no neighbors. Keep its two-channel feature rows "}
                      <code>
                        {"[[1,2],[-1,.3],[.4,-2],[3,.1]]"}
                      </code>
                      {". Remove "}
                      <strong>
                        {"both"}
                      </strong>
                      {" stored routes for 1—2. Compare that graph with the graph obtained by adding "}
                      <strong>
                        {"only"}
                      </strong>
                      {" 3→1. Keep all layer weights and biases fixed for this input comparison; rebuild any degree normalization."}
                    </Prose>
                    <Prose>
                      {"Implement those two edge lists with "}
                      <code>
                        {"message-passing-operators.py"}
                      </code>
                      {" and its ordinary "}
                      <code>
                        {"matched_library"}
                      </code>
                      {" route. Inspect node 3's own output as well as node 1's incoming products and node 0's output. Then use "}
                      <code>
                        {"SparseGraphAttention(2, d, heads=2, concat=True)"}
                      </code>
                      {" with two genuinely different head projections and score vectors. Repeat with "}
                      <code>
                        {"concat=False"}
                      </code>
                      {", keeping the per-head parameters matched and using an appropriately sized output bias. Compare each head's coefficients, final outputs, input and parameter derivatives, and an equal gradient step with the mapped PyG layer. The symbol "}
                      <code>
                        {"d"}
                      </code>
                      {" here is each head's output-channel width, not a node degree."}
                    </Prose>
                    <details>
                      <summary>Hint</summary>
                      <Prose>
                        {"Draw receiving degrees after each edit, including the own loops used by GCN/GAT. For coefficient "}
                        <code>
                          {"1/√(d_i d_j)"}
                        </code>
                        {", a change to either endpoint's receiving degree matters even if the route itself remains. SAGE's explicit own branch has a different empty-neighbor policy."}
                      </Prose>
                    </details>
                    <details>
                      <summary>Solution and success criteria</summary>
                      <Prose>
                        {"After removing 1—2, closed receiving degrees are "}
                        <code>
                          {"[2,2,1,1]"}
                        </code>
                        {". Adding only 3→1 changes them to "}
                        <code>
                          {"[2,3,1,1]"}
                        </code>
                        {": node 1 gains an incoming route, while node 3 does not. Node 1's self coefficient changes from "}
                        <code>
                          {"1/2"}
                        </code>
                        {" to "}
                        <code>
                          {"1/3"}
                        </code>
                        {"; its 0→1 coefficient changes from "}
                        <code>
                          {"1/2"}
                        </code>
                        {" to "}
                        <code>
                          {"1/√6"}
                        </code>
                        {", and its new 3→1 coefficient is "}
                        <code>
                          {"1/√3"}
                        </code>
                        {". The existing 1→0 route also changes from "}
                        <code>
                          {"1/2"}
                        </code>
                        {" to "}
                        <code>
                          {"1/√6"}
                        </code>
                        {", because "}
                        <strong>
                          {"sender 1's receiving degree"}
                        </strong>
                        {" participates in that coefficient. Node 0 can therefore change even though no new incoming route reaches it. This is this declared directed normalization, not an assertion that all directed GCN definitions coincide."}
                      </Prose>
                      <Prose>
                        {"Node 3's GCN own coefficient stays 1, so its own output stays "}
                        <code>
                          {"W x₃ + b"}
                        </code>
                        {" during this topology edit. For mean-SAGE, node 3 still has no incoming neighbors: its output stays the own projection plus the neighbor-map bias applied to the zero summary. Its new outgoing route contributes to node 1's mean. For GAT with an own loop, node 3 still normalizes its one allowed own message to weight 1. Node 1 has a new sender and a new attention denominator. An unchanged output at node 3 does not imply its input has zero gradient for a loss involving other nodes: its outgoing message can affect their loss."}
                      </Prose>
                      <Prose>
                        {"Two heads each have their own projection and sender/receiver score vectors. Concatenation produces "}
                        <code>
                          {"2d"}
                        </code>
                        {" output channels; the mean produces "}
                        <code>
                          {"d"}
                        </code>
                        {". Map the packed projection rows and both score-vector rows separately, with the same loop, slope, dropout and bias choices. Per-head weights sum to 1 over each receiver's current allowed senders. Repeating one head twice tests packing equality but does not test independent attention. A successful solution checks a changed directed case, the isolate and both merge choices, and verifies matched derivatives and one update away from score/activation boundaries. Return to the saved 34-member network below after this constructed operator exercise."}
                      </Prose>
                    </details>
                    <H3>
                      {"What changes when a frozen model receives a different input?"}
                    </H3>
                    <Prose>
                      {"Keep the fitted weights fixed, inspect one message path at a time, and name every diagnostic edit."}
                    </Prose>
                    <div data-flow-view="D29-family">
                      <MessagePassingSavedFamilyLab />
                    </div>
                    <Prose>
                      {"The inspector loads the retained seed-11 model for the selected family. Its current member selector ranges over all 34 semantic IDs. The first investigation shows a chosen hidden channel's actual first-layer messages: donor input, the family's coefficient or score/normalizer, channel projection and receiver contribution. Another follows that receiver's pre-ReLU value through the activation. A third traces a selected class logit through the output layer and class softmax. These are different questions about the same persistent model/input state, rather than one panel with many competing modes."}
                    </Prose>
                    <H3>
                      {"Which incoming products form this member’s hidden channel?"}
                    </H3>
                    <Prose>
                      {"Follow the current saved rule from every permitted donor into the selected receiver."}
                    </Prose>
                    <div data-flow-view="D29-receiver">
                      <MessagePassingSavedReceiverLab />
                    </div>
                    <Prose>
                      {"Start with a donor’s three input cells and the selected row of the copied first weight matrix. Their dot product is the projected channel value. The incoming table multiplies that projection by this family’s current receiver coefficient, then sums the permitted products. Follow the separate own branch where present and the copied bias into the preactivation; ReLU keeps its positive part. The final two paths read all sixteen hidden channels, not only the channel selected for inspection, and their softmax gives the two displayed class probabilities. Change the receiving member or hidden channel to trace another part of this same saved computation."}
                    </Prose>
                    <H3>
                      {"What happens when one observed feature changes?"}
                    </H3>
                    <Prose>
                      {"Hold the fitted rule and message graph fixed while changing a supplied input cell."}
                    </Prose>
                    <div data-flow-view="D29-feature">
                      <MessagePassingSavedFeatureLab />
                    </div>
                    <Prose>
                      {"To change an observation, select its member and one of the three already introduced feature channels, then edit that value between −2 and 2. An edited degree/clustering channel is an artificial input intervention, not a new measured graph feature. All other observations and weights stay fixed. The live result states which member/field changed and gives the resulting output. Resetting features restores the original measured feature rows."}
                    </Prose>
                    <H3>
                      {"What happens when one relationship is unavailable?"}
                    </H3>
                    <Prose>
                      {"Keep every current feature row and change only this undirected pair’s two permissions."}
                    </Prose>
                    <div data-flow-view="D29-edge">
                      <MessagePassingSavedEdgeLab />
                    </div>
                    <Prose>
                      {"To change message access, select an observed relationship and remove or restore it. Both directions of this undirected edge change together. "}
                    </Prose>
                    <H3>
                      {"What remains when all message edges are removed?"}
                    </H3>
                    <Prose>
                      {"Compare the original and current graph using identical current feature rows and saved weights."}
                    </Prose>
                    <div data-flow-view="D29-empty">
                      <MessagePassingSavedNoEdgesLab />
                    </div>
                    <Prose>
                      {"Read the two drawings as two adjacencies applied to the same current feature table. The left retains the original relationships; the right shows the current relationships, including any removals. Their probability readout compares the selected semantic member under the same saved rule. Removing every message edge changes this comparison without replacing the input feature rows."}
                    </Prose>
                    <Prose>
                      {"A separate investigation removes all original message edges at once and permits restoration. In these message-edge diagnostics, the original three feature columns remain fixed. Thus removing message propagation "}
                      <strong>
                        {"does not remove all graph information"}
                      </strong>
                      {": degree and clustering already encoded the original graph in the input. The displayed difference answers the narrower question “What does this frozen model do when this message graph changes while these inputs stay fixed?”"}
                    </Prose>
                    <H3>
                      {"Can I keep an earlier result while making another change?"}
                    </H3>
                    <Prose>
                      {"Retain the exact earlier model and input state beside the current one."}
                    </Prose>
                    <div data-flow-view="D29-pin">
                      <MessagePassingSavedPinLab />
                    </div>
                    <Prose>
                      {"Pinning a current result saves a full copy of its model/input/graph identity and displayed intermediates for comparison. Further edits must not mutate that pinned result. "}
                    </Prose>
                    <H3>
                      {"How do I restore the original experiment inputs?"}
                    </H3>
                    <Prose>
                      {"Follow the current feature and graph state into the named original reset target."}
                    </Prose>
                    <div data-flow-view="D29-reset">
                      <MessagePassingSavedResetLab />
                    </div>
                    <Prose>
                      {"Resetting graph edits retains feature edits; resetting all inputs clears the comparison and restores the original graph/features, while keeping the selected fitted family. A family switch selects another saved set of weights, not a fit of the edited data. Loading/retry must preserve the learner's intended input edits and associate any displayed output with the family that actually produced it."}
                    </Prose>
                    <Prose>
                      {"The original twelve-model results and recorded interventions remain a separate evidence table. Current edited output is labelled diagnostic output; it is not substituted into an old assessment row. Comparing a frozen model on edited inputs can help identify sensitivity, but it does not establish a causal effect on the historical club split, a successful retraining strategy or future deployment performance."}
                    </Prose>
                    <H3>
                      {"Does reversing storage change this same member's current prediction?"}
                    </H3>
                    <Prose>
                      {"Reorder the current edited inputs and both graph axes together, then compare the same semantic member's output."}
                    </Prose>
                    <div data-flow-view="D29-storage">
                      <MessagePassingSavedStorageLab />
                    </div>
                    <Prose>
                      {"The member selector identifies a person, not a row number. Initially member 2 sits at row 2; after reversing all 34 rows it sits at row 31. In both computations its current feature row and its current permitted relationships must travel with that identity. Reverse feature rows, "}
                      <strong>
                        {"both"}
                      </strong>
                      {" adjacency axes and the corresponding label/role annotations. Changing only rows or only one adjacency axis attaches information to the wrong people."}
                    </Prose>
                    <Prose>
                      {"Section 1's “Does moving a row change which paper it represents?” established this rule on a small constructed table. Here we apply it to the actual saved two-layer model and the current edited inputs. Keep the selected semantic member, fitted family and edited feature/edge values unchanged. Match the two output tables back by semantic ID before comparing their two class logits and probabilities. The storage toggle changes addresses, not features or topology. Outputs should agree up to floating-point summation order, using an explicit absolute tolerance of "}
                      <code>
                        {"1e−4"}
                      </code>
                      {" for this retained float32 model; report the actual maximum absolute difference rather than round it to an unexplained zero. A larger discrepancy is a mapping or numerical issue to inspect, not a newly learned prediction."}
                    </Prose>
                    <Prose>
                      {"The displayed current row and selected member remain side by side. A pin keeps its own copied storage order and semantic mapping, so reversal cannot silently compare two different people. Resetting the graph alone leaves the storage choice and feature edits intact; resetting all inputs restores original storage and clears the pin while retaining the chosen model family. Loading another saved family or retrying its fetch retains these current input choices."}
                    </Prose>
                    <H3>
                      {"How do known labels travel through the current edited graph?"}
                    </H3>
                    <Prose>
                      {"Reuse the fit-only label-propagation rule on the current adjacency and follow its two scores into the selected member."}
                    </Prose>
                    <div data-flow-view="D29-labels">
                      <MessagePassingSavedKnownLabelsFigure />
                    </div>
                    <Prose>
                      {"The recorded "}
                      <code>
                        {"16/18"}
                      </code>
                      {" baseline used the original graph. The view here asks a different question: "}
                      <strong>
                        {"what does that same finite algorithm do on the graph I have now edited?"}
                      </strong>
                      {" Start every non-fitting member at "}
                      <code>
                        {"[0,0]"}
                      </code>
                      {". Give each of the ten fitting members its known one-hot label: "}
                      <code>
                        {"[1,0]"}
                      </code>
                      {" for class 0 or "}
                      <code>
                        {"[0,1]"}
                      </code>
                      {" for class 1. Development and assessment labels never initialize or clamp a row."}
                    </Prose>
                    <Prose>
                      {"At each round every member averages the "}
                      <strong>
                        {"old"}
                      </strong>
                      {" two-score rows over its current neighbors and itself, using the closed-neighborhood receiver average from section 3. Then restore fitting rows to their original one-hot labels. Repeat exactly 200 rounds, as in the original baseline; this is the retained finite rule, not a claim to have solved an equilibrium. Display the selected member's current two scores and choose the larger one; the declared tie rule chooses class 0. A disconnected non-fitting component with no known-label source retains "}
                      <code>
                        {"[0,0]"}
                      </code>
                      {", so that default decision contains no propagated label evidence. These scores need not sum to 1 at finite depth: the initially empty rows have not been supplied normalized class probabilities."}
                    </Prose>
                    <Prose>
                      {"For a tiny hand check, temporarily use the already taught path 0—1—2 with fitting member 0 in class 0 and member 2 in class 1. The first average at member 1 is "}
                      <code>
                        {"[1/3,1/3]"}
                      </code>
                      {"; fitting rows are restored to "}
                      <code>
                        {"[1,0]"}
                      </code>
                      {" and "}
                      <code>
                        {"[0,1]"}
                      </code>
                      {". At the next round its old own row also participates, giving "}
                      <code>
                        {"[4/9,4/9]"}
                      </code>
                      {". The same synchronous/clamp mechanism acts on the larger edited network, without using its withheld answers."}
                    </Prose>
                    <Prose>
                      {"An edge edit recomputes the current adjacency, row divisors and all 200 rounds. A structural-feature edit by itself does "}
                      <strong>
                        {"not"}
                      </strong>
                      {" change this baseline: it consumes known fitting labels and adjacency, not the neural model's three feature columns. Switching MLP/GCN/SAGE/GAT changes the neural route but not these fixed label sources. Storage reversal carries the sources and result mapping together and preserves semantic scores. The selected receiver comes from the preceding D29 view, so no new controls are needed here. Keep the original measured baseline identity and its "}
                      <code>
                        {"16/18"}
                      </code>
                      {" count separate from this current diagnostic, including after removing all message edges, graph-only reset, pinning or retry. With all message edges removed, own averaging leaves each fitting row clamped and all other rows zero."}
                    </Prose>
                    <Prose>
                      {"We have now followed a legal complete fit and a sparse/library implementation, and inspected its actual unfavorable results. The next question is about depth: if a single round helps members share information, why can many rounds make useful differences harder to retain?"}
                    </Prose>
                    <H2>
                      {"7. Why repeated propagation can blur distinctions"}
                    </H2>
                    <H3>
                      {"What does another round actually do to the papers' numbers?"}
                    </H3>
                    <Prose>
                      {"Return to the three-paper path and follow the same scalar row through two complete rounds before trying to explain an indefinitely deep network."}
                    </Prose>
                    <div data-flow-view="D30">
                      <MessagePassingPropagationModesLab />
                    </div>
                    <div data-flow-view="D30a">
                      <MessagePassingPropagationFeatureLab />
                    </div>
                    <div data-flow-view="D30b">
                      <MessagePassingPropagationEdgeLab />
                    </div>
                    <Prose>
                      {"The top row is the familiar input, "}
                      <code>
                        {"(1, 2, 4)"}
                      </code>
                      {". Each number belongs to its paper; this is one channel across three nodes, not three channels at one node. The next row is the GCN weighted sum from §3, without learned channel weights or an activation. Its entries are approximately "}
                      <code>
                        {"(1.316497, 2.707908, 2.816497)"}
                      </code>
                      {". The third row applies exactly the same operation to that newly computed row: "}
                      <code>
                        {"(1.763747, 2.589923, 2.513747)"}
                      </code>
                      {". Paper 0 can now depend on paper 2, because paper 1 carried information during the first round."}
                    </Prose>
                    <Prose>
                      {"The round control performs another synchronized multiplication: every receiver reads the preceding complete row. It does not refit a classifier. Two other rows show why the numbers change. One node pattern is left unchanged by a round; another becomes half as large; a third reverses sign and becomes one sixth as large. Trace a pattern's values at nodes 0, 1 and 2 before reading its gain. A negative gain flips the whole pattern, rather than representing a negative probability."}
                    </Prose>
                    <Prose>
                      {"To make those pictures precise, let "}
                      <code>
                        {"S"}
                      </code>
                      {" denote the symmetric closed-degree matrix already constructed in §3. A "}
                      <strong>
                        {"mode"}
                      </strong>
                      {" here is a node-valued pattern that "}
                      <code>
                        {"S"}
                      </code>
                      {" only rescales. The unchanged pattern is proportional to "}
                      <code>
                        {"(√2, √3, √2)"}
                      </code>
                      {". The half-gain pattern is proportional to "}
                      <code>
                        {"(1, 0, −1)"}
                      </code>
                      {". The sign-changing pattern is proportional to "}
                      <code>
                        {"(√3, −2√2, √3)"}
                      </code>
                      {". Choose each pattern to have squared length one; call them "}
                      <code>
                        {"u₀"}
                      </code>
                      {", "}
                      <code>
                        {"u₁"}
                      </code>
                      {", and "}
                      <code>
                        {"u₂"}
                      </code>
                      {". They are mutually perpendicular. Reversing the sign of any whole pattern describes the same direction, so the pictures keep one orientation consistently."}
                    </Prose>
                    <Prose>
                      {"These are "}
                      <strong>
                        {"eigenvectors"}
                      </strong>
                      {" of "}
                      <code>
                        {"S"}
                      </code>
                      {"; the respective scaling factors "}
                      <code>
                        {"1"}
                      </code>
                      {", "}
                      <code>
                        {"1/2"}
                      </code>
                      {", and "}
                      <code>
                        {"−1/6"}
                      </code>
                      {" are its "}
                      <strong>
                        {"eigenvalues"}
                      </strong>
                      {". The names now label a transformation you can see. They do not introduce an additional message mechanism."}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"S=\\begin{bmatrix}\n1/2&1/\\sqrt6&0\\\\\n1/\\sqrt6&1/3&1/\\sqrt6\\\\\n0&1/\\sqrt6&1/2\n\\end{bmatrix},\\qquad\nSu_0=u_0,\\quad Su_1=\\tfrac12u_1,\\quad Su_2=-\\tfrac16u_2."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"Any three-number input can be built from these three patterns. Its coefficient on a unit pattern is the dot product "}
                      <code>
                        {"uᵀx"}
                      </code>
                      {": multiply matching entries and add. That coefficient can be negative; it tells us which orientation and how much of the pattern is present. For example, the coefficient on the half-gain pattern is "}
                      <code>
                        {"(1 − 4)/√2 = −3/√2"}
                      </code>
                      {". After one round this coefficient halves; after two rounds it is one quarter of its original value. The other patterns follow their own gains independently. Label a pattern by "}
                      <code>
                        {"k = 0, 1, 2"}
                      </code>
                      {", write its gain as "}
                      <code>
                        {"g_k"}
                      </code>
                      {", and let "}
                      <code>
                        {"ℓ"}
                      </code>
                      {" count rounds, as in §2. Repeated application raises each pattern's gain to the round count:"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"x=\\sum_{k=0}^{2}(u_k^Tx)u_k,\n\\qquad S^\\ell x=\\sum_{k=0}^{2}g_k^\\ell(u_k^Tx)u_k,\n\\quad (g_0,g_1,g_2)=(1,\\tfrac12,-\\tfrac16)."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"The expression explains the visible sequence: repeated multiplication attenuates the two changing patterns, leaving mainly the unchanged one. The gains are real because "}
                      <code>
                        {"S"}
                      </code>
                      {" is symmetric. The coordinate conversion to "}
                      <code>
                        {"P"}
                      </code>
                      {" from §3 preserves these gains: if "}
                      <code>
                        {"Su = gu"}
                      </code>
                      {", then "}
                      <code>
                        {"P(D⁻¹ᐟ²u) = g(D⁻¹ᐟ²u)"}
                      </code>
                      {". It is not necessary to compute eigenvectors to run a graph layer. We use them on this tiny graph to explain what the repeated local sum is doing."}
                    </Prose>
                    <Prose>
                      {"The complete companion program "}
                      <code>
                        {"graph-propagation-limits.py"}
                      </code>
                      {" constructs the sparse operator once and uses the same receiving-node accumulation taught in §6. Its "}
                      <code>
                        {"propagation_states"}
                      </code>
                      {" function keeps the original input and each new state:"}
                    </Prose>
                    <CodeBlock language="python" filename="fixed-propagation-history.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"def propagation_states(operator, features, rounds):\n    states = [features]\n    for _ in range(rounds):\n        states.append(operator.apply(states[-1]))\n    return states"}
                    </CodeBlock>
                    <Prose>
                      {""}
                      <code>
                        {"operator.apply"}
                      </code>
                      {" gathers each sender row, scales it by the closed-degree coefficient, and accumulates into the receiver. "}
                      <code>
                        {"operator.library_apply"}
                      </code>
                      {" performs the identical multiplication with an ordinary "}
                      <code>
                        {"torch.sparse.mm"}
                      </code>
                      {" call. Neither route allocates a dense node-by-node matrix. The program's "}
                      <code>
                        {"fixed_mode_table"}
                      </code>
                      {" deliberately does allocate one small diagnostic matrix for "}
                      <code>
                        {"torch.linalg.eigh"}
                      </code>
                      {"; that inspection route is separate from the sparse execution route. When an eigenvalue repeats, individual eigenvectors within its subspace are not uniquely determined. Read the retained subspace, rather than attributing meaning to an arbitrary solver-selected basis vector."}
                    </Prose>
                    <H3>
                      {"Does “becoming similar” mean that every raw node value becomes equal?"}
                    </H3>
                    <Prose>
                      {"Compare the raw limiting row with the row divided by each paper's square-root degree."}
                    </Prose>
                    <div data-flow-view="D31">
                      <MessagePassingPropagationCoordinates />
                    </div>
                    <div data-flow-view="D31a">
                      <MessagePassingPropagationRoundsLab />
                    </div>
                    <div data-flow-view="D31b">
                      <MessagePassingPropagationCoordinateLab />
                    </div>
                    <div data-flow-view="D31c">
                      <MessagePassingPropagationCounterexamplesLab />
                    </div>
                    <Prose>
                      {"Paper 1 has closed degree 3, whereas papers 0 and 2 have degree 2. The unchanged unit pattern is therefore "}
                      <code>
                        {"u₀ = (√2, √3, √2)/√7"}
                      </code>
                      {". Its middle value is larger. After many rounds, the raw numbers approach approximately "}
                      <code>
                        {"(2.128426, 2.606778, 2.128426)"}
                      </code>
                      {". They do "}
                      <strong>
                        {"not"}
                      </strong>
                      {" all approach the same raw value. Dividing by "}
                      <code>
                        {"(√2, √3, √2)"}
                      </code>
                      {" produces the same value at every node, approximately "}
                      <code>
                        {"1.505024"}
                      </code>
                      {"."}
                    </Prose>
                    <Prose>
                      {"The two panels explain two coordinate systems. Raw rows are the actual output of the symmetric operator "}
                      <code>
                        {"S"}
                      </code>
                      {". Degree-divided rows describe that same state relative to the graph's stationary pattern. The slider advances both panels together, so it cannot hide their difference by changing the displayed convention."}
                    </Prose>
                    <Prose>
                      {"For a finite connected undirected graph with nonnegative edge weights, positive degree and a positive self-loop at every node, this fixed linear operation has one stationary direction and all other gains have magnitude less than one. Call its unit-length stationary pattern "}
                      <code>
                        {"u"}
                      </code>
                      {": take the square root of each node degree and divide the resulting vector by "}
                      <code>
                        {"√(sum of degrees)"}
                      </code>
                      {". Under "}
                      <strong>
                        {"these assumptions"}
                      </strong>
                      {", and with no learned channel maps or nonlinearities, the limiting state is the projection onto that direction:"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"u=\\frac{\\sqrt d}{\\sqrt{\\sum_i d_i}},\\qquad\n\\lim_{\\ell\\to\\infty}S^\\ell x=u(u^Tx),\\qquad\n\\frac{\\left[u(u^Tx)\\right]_i}{\\sqrt{d_i}}\n=\\frac{\\sum_j\\sqrt{d_j}x_j}{\\sum_jd_j}."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"The square root of the degree vector is taken entry by entry. The scalar on the right is independent of node "}
                      <code>
                        {"i"}
                      </code>
                      {"; that is the common value in the degree-divided panel. With multiple feature channels, the same projection applies to each column. Useful distinctions between nodes can disappear relative to this stationary pattern even while the raw rows differ because their degrees differ. This is one precise version of "}
                      <strong>
                        {"oversmoothing"}
                      </strong>
                      {": repeated mixing removes distinctions the task might need."}
                    </Prose>
                    <Prose>
                      {"The earlier §3 comparison between "}
                      <code>
                        {"S"}
                      </code>
                      {" and the row-normalized average "}
                      <code>
                        {"P"}
                      </code>
                      {" becomes clearer here. They are related by "}
                      <code>
                        {"P = D⁻¹ᐟ² S D¹ᐟ²"}
                      </code>
                      {", where "}
                      <code>
                        {"D"}
                      </code>
                      {" is the diagonal degree matrix. If "}
                      <code>
                        {"f = D⁻¹ᐟ²x"}
                      </code>
                      {", then applying "}
                      <code>
                        {"P"}
                      </code>
                      {" to "}
                      <code>
                        {"f"}
                      </code>
                      {" gives "}
                      <code>
                        {"D⁻¹ᐟ²Sx"}
                      </code>
                      {". Changing the operator "}
                      <strong>
                        {"and"}
                      </strong>
                      {" the coordinates preserves this relation; applying both operators to the same unconverted row generally gives different outputs. In a regular graph all degrees agree and "}
                      <code>
                        {"P = S"}
                      </code>
                      {". The degree-divided route is not a new activation or a separate normalization of the total feature-table size."}
                    </Prose>
                    <Prose>
                      {"The small comparisons below the path show where the limiting statement changes. With two connected nodes and "}
                      <strong>
                        {"no"}
                      </strong>
                      {" self-loops, the normalized matrix simply swaps their values: "}
                      <code>
                        {"(1, 4) → (4, 1) → (1, 4)"}
                      </code>
                      {". The alternating mode has gain "}
                      <code>
                        {"−1"}
                      </code>
                      {"; it does not shrink. With two disconnected two-node components and loops, "}
                      <code>
                        {"(1, 3, 4, 8)"}
                      </code>
                      {" becomes "}
                      <code>
                        {"(2, 2, 6, 6)"}
                      </code>
                      {": each component retains its own stationary projection. A zero-degree node without a loop has no incoming contributions. Our implementation assigns it a zero inverse-degree factor, giving a zero propagated row; dividing that row by its degree's square root is still undefined and must be labelled so. It cannot be silently inserted into the positive-degree formula."}
                    </Prose>
                    <Prose>
                      {"Try changing a relationship weight and inspect the new degree row before the output. The graph editor retains the supported two-, three- and four-node fixtures, arbitrary permitted weights from 0 to 4, values from −8 to 8, the self-loop choice and rounds 0–40 through adjacent focused views. The displayed modes and component limits must be recomputed for the actual edited operator. A stationary value calculated for the default path cannot describe a graph whose connectivity you just changed."}
                    </Prose>
                    <H3>
                      {"Is graph mixing always a filter that steadily suppresses higher frequencies?"}
                    </H3>
                    <Prose>
                      {"Start with the sign-changing node pattern, then follow its location on the frequency and gain axes."}
                    </Prose>
                    <div data-flow-view="D32">
                      <MessagePassingFrequencyLab />
                    </div>
                    <Prose>
                      {"The sign-changing pattern loses magnitude under our path's "}
                      <code>
                        {"S"}
                      </code>
                      {", but it also changes sign. To describe the pattern's variation, subtract the mixing operator from the identity: "}
                      <code>
                        {"L = I − S"}
                      </code>
                      {". The identity "}
                      <code>
                        {"I"}
                      </code>
                      {" leaves a row unchanged. Therefore "}
                      <code>
                        {"Lx = x − Sx"}
                      </code>
                      {" measures the discrepancy between a state and its mixed version. This is the graph's normalized "}
                      <strong>
                        {"Laplacian"}
                      </strong>
                      {" under the positive-degree convention above."}
                    </Prose>
                    <Prose>
                      {"A mode with "}
                      <code>
                        {"S"}
                      </code>
                      {" gain "}
                      <code>
                        {"g"}
                      </code>
                      {" has "}
                      <code>
                        {"L"}
                      </code>
                      {" eigenvalue "}
                      <code>
                        {"λ = 1 − g"}
                      </code>
                      {". These Laplacian eigenvalues are called graph "}
                      <strong>
                        {"frequencies"}
                      </strong>
                      {". They measure variation across this graph, rather than cycles per second. The path's three values are "}
                      <code>
                        {"0"}
                      </code>
                      {", "}
                      <code>
                        {"1/2"}
                      </code>
                      {", and "}
                      <code>
                        {"7/6"}
                      </code>
                      {". Its stationary pattern has zero variation; the sign-changing pattern has greater variation."}
                    </Prose>
                    <Prose>
                      {"For the stated symmetric positive-degree graph, the quadratic quantity "}
                      <code>
                        {"xᵀLx"}
                      </code>
                      {" is a sum of nonnegative edge differences in degree-divided coordinates. Use "}
                      <code>
                        {"B"}
                      </code>
                      {", the adjacency including self-loops introduced in §3, to weight each squared difference:"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"x^TLx=\\frac12\\sum_{i,j}B_{ij}\n\\left(\\frac{x_i}{\\sqrt{d_i}}-\\frac{x_j}{\\sqrt{d_j}}\\right)^2."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"Each undirected relationship occurs twice in the sum, so the factor one half removes double counting. A loop contributes zero difference. For a unit mode this quantity equals its "}
                      <code>
                        {"λ"}
                      </code>
                      {", which connects the formal frequency to the visible neighboring values. This equation is for positive degrees; the earlier zero-degree convention is not an invitation to divide by zero."}
                    </Prose>
                    <Prose>
                      {"On the graph-frequency axis, applying "}
                      <code>
                        {"S"}
                      </code>
                      {" once has "}
                      <strong>
                        {"signed"}
                      </strong>
                      {" gain "}
                      <code>
                        {"1 − λ"}
                      </code>
                      {". Its "}
                      <strong>
                        {"magnitude"}
                      </strong>
                      {" is "}
                      <code>
                        {"|1 − λ|"}
                      </code>
                      {". The signed line falls through zero at "}
                      <code>
                        {"λ = 1"}
                      </code>
                      {", but the magnitude is V-shaped over "}
                      <code>
                        {"[0, 2]"}
                      </code>
                      {": it falls to zero and then rises again. Thus “higher graph frequency always means less magnitude” is false over the whole allowed interval. At "}
                      <code>
                        {"λ = 2"}
                      </code>
                      {", the gain is "}
                      <code>
                        {"−1"}
                      </code>
                      {", matching the loop-free two-node swap. After "}
                      <code>
                        {"ℓ"}
                      </code>
                      {" rounds the gains are "}
                      <code>
                        {"(1 − λ)ᶩ"}
                      </code>
                      {", with magnitude "}
                      <code>
                        {"|1 − λ|ᶩ"}
                      </code>
                      {". An odd number of rounds retains a negative sign on a negative-gain mode; an even number makes that gain positive."}
                    </Prose>
                    <Prose>
                      {"The power control changes rounds 1–6, not a claimed trained model. Watch the path's "}
                      <code>
                        {"λ = 7/6"}
                      </code>
                      {" mode shrink and alternate while the boundary example does not shrink. This gives a useful design question: which graph patterns should the task retain, and does the chosen operator actually retain them? Similarity between neighbors is helpful for some signals and destructive for others."}
                    </Prose>
                    <H3>
                      {"Can we mix several neighborhood ranges without computing every eigenvector?"}
                    </H3>
                    <Prose>
                      {"Follow the original state, one-round state and two-round state into three weighted branches of the same receiver."}
                    </Prose>
                    <div data-flow-view="D33">
                      <MessagePassingPolynomialLab />
                    </div>
                    <Prose>
                      {"The first branch contributes the original value. The second contributes half of the one-round value. The third contributes one quarter of the two-round value. At paper 0 this gives "}
                      <code>
                        {"1 + 0.5 × 1.316497 + 0.25 × 1.763747 ≈ 2.099185"}
                      </code>
                      {". The whole output is approximately "}
                      <code>
                        {"(2.099185, 4.001435, 6.036685)"}
                      </code>
                      {". We combined different ranges; we did not choose a single deepest state and discard the earlier ones."}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"p(S)x=x+\\tfrac12Sx+\\tfrac14S^2x,\n\\qquad p(g)=1+\\tfrac12g+\\tfrac14g^2."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"This is a "}
                      <strong>
                        {"polynomial filter"}
                      </strong>
                      {". Its coefficients decide the contribution from each propagation power. On a mode of gain "}
                      <code>
                        {"g"}
                      </code>
                      {", the output gain is the scalar polynomial "}
                      <code>
                        {"p(g)"}
                      </code>
                      {". In node space, the computation stays local: one "}
                      <code>
                        {"S"}
                      </code>
                      {" application crosses at most one edge, so a degree-"}
                      <code>
                        {"r"}
                      </code>
                      {" polynomial crosses at most "}
                      <code>
                        {"r"}
                      </code>
                      {" edges. A self-loop can retain a value at the same node; it cannot create a shortcut between distant nodes. Cancellation may make the actual support smaller than this upper bound."}
                    </Prose>
                    <Prose>
                      {"The original path has no pair more than two edges apart. The second drawing deliberately changes to a four-node chain "}
                      <code>
                        {"0–1–2–3"}
                      </code>
                      {" so that a genuine third-hop dependency can be seen. With an input only at node 3, node 0 cannot receive it from "}
                      <code>
                        {"I"}
                      </code>
                      {", "}
                      <code>
                        {"S"}
                      </code>
                      {", or "}
                      <code>
                        {"S²"}
                      </code>
                      {"; it can receive it from "}
                      <code>
                        {"S³"}
                      </code>
                      {". The degree control uses the declared coefficient family "}
                      <code>
                        {"1, 1/2, 1/4, 1/8"}
                      </code>
                      {", truncated at degrees 0–3. It is not an unexplained selector among unrelated filters. A filter with "}
                      <code>
                        {"K"}
                      </code>
                      {" terms indexed "}
                      <code>
                        {"0,…,K−1"}
                      </code>
                      {" has maximum degree "}
                      <code>
                        {"K−1"}
                      </code>
                      {"; “three terms” and “three hops” are different claims."}
                    </Prose>
                    <Prose>
                      {"The complete program accumulates powers by repeated sparse products, storing only the current power and accumulated result:"}
                    </Prose>
                    <CodeBlock language="python" filename="sparse-polynomial-filter.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"def polynomial_filter(operator, features, coefficients):\n    power = features\n    result = torch.zeros_like(features)\n    for index, coefficient in enumerate(coefficients):\n        if index:\n            power = operator.apply(power)\n        result = result + coefficient * power\n    return result"}
                    </CodeBlock>
                    <Prose>
                      {"For "}
                      <code>
                        {"K"}
                      </code>
                      {" scalar coefficients and "}
                      <code>
                        {"d"}
                      </code>
                      {" channels, this costs approximately "}
                      <code>
                        {"O(K E d)"}
                      </code>
                      {" with the stored sparse edge count "}
                      <code>
                        {"E"}
                      </code>
                      {", plus the output operations. It avoids dense "}
                      <code>
                        {"N²"}
                      </code>
                      {" adjacency storage and a full graph eigendecomposition. Autograd follows the accumulation, so coefficients can be learned. Replacing each scalar coefficient by an appropriate channel matrix gives a richer filter, with additional projection costs that should be counted explicitly."}
                    </Prose>
                    <H3>
                      {"Deeper: why use Chebyshev polynomials?"}
                    </H3>
                    <Prose>
                      {"Trace another basis for the same three polynomial branches."}
                    </Prose>
                    <div data-flow-view="D33-chebyshev">
                      <MessagePassingChebyshev />
                    </div>
                    <Prose>
                      {"The same filter can be expressed in a different polynomial basis. Scale Laplacian frequencies into "}
                      <code>
                        {"[-1, 1]"}
                      </code>
                      {" using "}
                      <code>
                        {"L̃ = 2L/b − I"}
                      </code>
                      {", with a valid spectral upper bound "}
                      <code>
                        {"b"}
                      </code>
                      {". For our normalized undirected operator, "}
                      <code>
                        {"b = 2"}
                      </code>
                      {" is valid; it does "}
                      <strong>
                        {"not"}
                      </strong>
                      {" say the path's largest frequency equals 2. Chebyshev polynomials start with "}
                      <code>
                        {"T₀(t) = 1"}
                      </code>
                      {", "}
                      <code>
                        {"T₁(t) = t"}
                      </code>
                      {", and satisfy "}
                      <code>
                        {"Tₖ(t) = 2tTₖ₋₁(t) − Tₖ₋₂(t)"}
                      </code>
                      {". Apply that recurrence to a node table using sparse multiplication in place of scalar multiplication. Here "}
                      <code>
                        {"Z_k = T_k(L̃)X"}
                      </code>
                      {" is the node table at basis term "}
                      <code>
                        {"k"}
                      </code>
                      {", "}
                      <code>
                        {"c_k"}
                      </code>
                      {" is that term's learned scalar coefficient, "}
                      <code>
                        {"K"}
                      </code>
                      {" is the number of terms, and "}
                      <code>
                        {"Y"}
                      </code>
                      {" is their weighted output:"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"Z_0=X,\\qquad Z_1=\\widetilde LX,\\qquad\nZ_k=2\\widetilde LZ_{k-1}-Z_{k-2},\\qquad\nY=\\sum_{k=0}^{K-1}c_kZ_k."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"For "}
                      <code>
                        {"b = 2"}
                      </code>
                      {", our "}
                      <code>
                        {"L̃ = −S"}
                      </code>
                      {". Consequently "}
                      <code>
                        {"T₁(L̃)X = −SX"}
                      </code>
                      {" and "}
                      <code>
                        {"T₂(L̃)X = (2S² − I)X"}
                      </code>
                      {". Coefficients "}
                      <code>
                        {"(1.125, −0.5, 0.125)"}
                      </code>
                      {" recover the same filter "}
                      <code>
                        {"I + 0.5S + 0.25S²"}
                      </code>
                      {". This is a changed basis for a calculation already traced by hand. "}
                      <code>
                        {"chebyshev_filter"}
                      </code>
                      {" in the complete program implements the recurrence with two preceding states and one accumulated output. A bound that is too small can move eigenvalues outside the intended interval and harm the recurrence's numerical behavior; high degree still requires stability checks."}
                    </Prose>
                    <Prose>
                      {"The "}
                      <a href={"https://arxiv.org/html/1606.09375v3"}>
                        {"localized spectral-filter paper"}
                      </a>
                      {" develops this route. A library Chebyshev layer may construct a different Laplacian from its supplied edges. Match that operator and its scaling before comparing coefficients; our ordinary sparse PyTorch route uses the exact same "}
                      <code>
                        {"S"}
                      </code>
                      {" as the scratch route."}
                    </Prose>
                    <H3>
                      {"Why is GCN's self-loop normalization a choice rather than an algebraic identity?"}
                    </H3>
                    <Prose>
                      {"Compare adding an own-state branch with adding self-edges before recalculating degrees."}
                    </Prose>
                    <div data-flow-view="D33-renormalization">
                      <MessagePassingRenormalization />
                    </div>
                    <Prose>
                      {"Temporarily remove loops. Call its degree matrix "}
                      <code>
                        {"D_open"}
                      </code>
                      {", normalized adjacency "}
                      <code>
                        {"R"}
                      </code>
                      {", and Laplacian "}
                      <code>
                        {"L_open = I−R"}
                      </code>
                      {". With spectral scaling bound 2, the first two Chebyshev terms give "}
                      <code>
                        {"c₀I−c₁R"}
                      </code>
                      {". Tying "}
                      <code>
                        {"c₀ = θ"}
                      </code>
                      {" and "}
                      <code>
                        {"c₁ = −θ"}
                      </code>
                      {" gives an own branch plus normalized neighbors:"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"R=D_{\\rm open}^{-1/2}AD_{\\rm open}^{-1/2},\\qquad\nc_0I+c_1(L_{\\rm open}-I)=\\theta(I+R)."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"On our path, "}
                      <code>
                        {"(I+R)x ≈ (2.414214, 5.535534, 5.414214)"}
                      </code>
                      {". "}
                      <code>
                        {"R"}
                      </code>
                      {" preserves its degree-square-root pattern; "}
                      <code>
                        {"I+R"}
                      </code>
                      {" doubles that pattern each round. "}
                      <a href={"https://arxiv.org/html/1609.02907v4"}>
                        {"Kipf and Welling, §2.2"}
                      </a>
                      {" replace "}
                      <code>
                        {"I+R"}
                      </code>
                      {" with §3's closed-degree "}
                      <code>
                        {"S"}
                      </code>
                      {". Its output is instead "}
                      <code>
                        {"(1.316497, 2.707908, 2.816497)"}
                      </code>
                      {". The own coefficient changes from 1 to "}
                      <code>
                        {"1/d_closed"}
                      </code>
                      {"; edge coefficients use closed degrees too. This "}
                      <strong>
                        {"renormalization"}
                      </strong>
                      {" changes the operator while retaining local reads. Bounded fixed mixing gains do not bound arbitrary learned channel maps or guarantee stable training."}
                    </Prose>
                    <CodeBlock language="python" filename="open-versus-closed-renormalization.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"open_path = SymmetricPropagation.from_edges(3, [(0, 1), (1, 2)], loops=False)\nclosed_path = SymmetricPropagation.from_edges(3, [(0, 1), (1, 2)], loops=True)\nfeatures = torch.tensor([[1.], [2.], [4.]], dtype=torch.float64)\nown_plus_open = features + open_path.apply(features)\nclosed_normalized = closed_path.apply(features)"}
                    </CodeBlock>
                    <Prose>
                      {"Both calls reuse "}
                      <code>
                        {"graph-propagation-limits.py"}
                      </code>
                      {". They differ in the taught graph/degree choice, rather than in a hidden library setting."}
                    </Prose>
                    <H3>
                      {"Why can a distant input matter very little even when it has arrived?"}
                    </H3>
                    <Prose>
                      {"Replace the path with a small branching tree and trace one leaf's change through the two receiving coefficients."}
                    </Prose>
                    <div data-flow-view="D34">
                      <MessagePassingBottleneckLab />
                    </div>
                    <Prose>
                      {"The root is node 0. Its children are 1 and 2; their children are leaves 3, 4, 5 and 6. With self-loops, the closed degrees are "}
                      <code>
                        {"(3, 4, 4, 2, 2, 2, 2)"}
                      </code>
                      {". All initial values are zero except a controllable value "}
                      <code>
                        {"δ"}
                      </code>
                      {" at leaf 3. After one round the root still receives no contribution from that leaf. After two rounds the route "}
                      <code>
                        {"3 → 1 → 0"}
                      </code>
                      {" contributes "}
                      <code>
                        {"δ / (√8 √12)"}
                      </code>
                      {", approximately "}
                      <code>
                        {"0.102062 × δ"}
                      </code>
                      {"."}
                    </Prose>
                    <Prose>
                      {"The first factor belongs to the edge from degree-2 leaf 3 into degree-4 node 1. The second belongs to degree-4 node 1 into degree-3 root 0. No alternative two-edge route from that leaf reaches the root. Each of the other leaves follows its own equally weighted route. The root has only one number in this example, so their four contributions are added into one value. It cannot tell which leaf supplied which amount from that sum alone."}
                    </Prose>
                    <Prose>
                      {""}
                      <strong>
                        {"Sensitivity"}
                      </strong>
                      {" means how much an output changes when a particular input changes. In this linear example the ratio is constant, so the derivative notation is simply another way to describe the traced coefficient:"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"\\frac{\\partial h_0^{(2)}}{\\partial x_3}\n=(S^2)_{0,3}=\\frac1{\\sqrt8\\sqrt{12}}\n=\\frac1{4\\sqrt6}\\approx0.102062."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"Move the leaf value between −2 and 2. The live root sentence changes with this exact product. At "}
                      <code>
                        {"δ = 2"}
                      </code>
                      {", its contribution is about "}
                      <code>
                        {"0.204124"}
                      </code>
                      {". All other inputs stay zero, so the picture separates this route's attenuation from a simultaneous change in other sources. The complete program also differentiates the operation with autograd; the gradient and the hand product agree."}
                    </Prose>
                    <Prose>
                      {""}
                      <strong>
                        {"Oversquashing"}
                      </strong>
                      {" concerns many potentially relevant dependencies being compressed through limited-width states and bottlenecks. It differs from oversmoothing, which concerned node distinctions disappearing under mixing. Too few rounds create a third issue, "}
                      <strong>
                        {"underreaching"}
                      </strong>
                      {": the required source has not reached the receiver at all. In the tree, one round underreaches the leaf; two rounds reaches it with a small coefficient and merges several leaves into one number. These questions require different diagnostics."}
                    </Prose>
                    <Prose>
                      {"The "}
                      <a href={"https://arxiv.org/html/2111.14522v3"}>
                        {"sensitivity and curvature analysis"}
                      </a>
                      {" bounds remote derivatives using powers of normalized adjacency under specified derivative assumptions. Our coefficient is an exact instance of a simple linear route, not a universal exponential law for all GNNs. Channel weights can amplify a route; activations can suppress it; attention can reroute it. Wider states, additional edges or a global reading mechanism may help a bottleneck, but each changes costs and the accessible information. A graph need not have exponentially growing neighborhoods, and adding an edge does not automatically preserve the task's legal data boundary from §5."}
                    </Prose>
                    <H3>
                      {"What can an earlier-state shortcut preserve?"}
                    </H3>
                    <Prose>
                      {"Trace the original paper row around the mixing stages and see exactly where it joins the new row."}
                    </Prose>
                    <div data-flow-view="D35">
                      <MessagePassingInitialResidualLab />
                    </div>
                    <div data-flow-view="D35-ordinary">
                      <MessagePassingOrdinaryResidual />
                    </div>
                    <div data-flow-view="D35-JK">
                      <MessagePassingJumpingKnowledge />
                    </div>
                    <Prose>
                      {"The first drawing sends two things into the next state: a mixed version of the current row and a direct copy of the original input. The original is retained at every round, rather than replaced by the most recently mixed row. The control "}
                      <code>
                        {"α"}
                      </code>
                      {" sets how much of that original is injected:"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"h^{(0)}=x,\\qquad h^{(\\ell+1)}=(1-\\alpha)Sh^{(\\ell)}+\\alpha x,\n\\qquad 0\\leq\\alpha\\leq1."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"At "}
                      <code>
                        {"α = 0"}
                      </code>
                      {" this is our plain fixed mixing. At "}
                      <code>
                        {"α = 1"}
                      </code>
                      {" every next state is the original input. For an intermediate value, a source's local input remains available alongside context. A mode with gain "}
                      <code>
                        {"g"}
                      </code>
                      {" has coefficient multiplied by "}
                      <code>
                        {"(1−α)g"}
                      </code>
                      {" on the previous-state branch and receives the original coefficient through the "}
                      <code>
                        {"α"}
                      </code>
                      {" branch. For "}
                      <code>
                        {"0 < α ≤ 1"}
                      </code>
                      {", its limiting factor is "}
                      <code>
                        {"α / [1 − (1−α)g]"}
                      </code>
                      {" under this fixed linear recurrence. That explains what is retained; it does not select the best amount of context for a supervised task."}
                    </Prose>
                    <Prose>
                      {"The next drawing is an "}
                      <strong>
                        {"ordinary layer residual"}
                      </strong>
                      {", "}
                      <code>
                        {"h_next = h + Sh"}
                      </code>
                      {". It bypasses the present mixing with the present state, just like the addition primitive in the earlier residual-network lesson. Its mode gain is "}
                      <code>
                        {"1 + g"}
                      </code>
                      {", so its scale can grow. It is not the same recurrence as repeatedly injecting "}
                      <code>
                        {"x"}
                      </code>
                      {". A residual branch supplies another value route and another derivative route, but it does not make every deep optimization problem easy."}
                    </Prose>
                    <Prose>
                      {"The final drawing keeps "}
                      <code>
                        {"h⁰"}
                      </code>
                      {", "}
                      <code>
                        {"h¹"}
                      </code>
                      {", and "}
                      <code>
                        {"h²"}
                      </code>
                      {" until the output reads them. "}
                      <strong>
                        {"Jumping Knowledge"}
                      </strong>
                      {" refers to using representations from different depths; the pictured version concatenates them. For "}
                      <code>
                        {"d"}
                      </code>
                      {" channels, three states make "}
                      <code>
                        {"3d"}
                      </code>
                      {" channels per node. The output can inspect a node's original information, short-range context and longer-range context together instead of depending solely on "}
                      <code>
                        {"h²"}
                      </code>
                      {". The original "}
                      <a href={"https://arxiv.org/abs/1806.03536"}>
                        {"Jumping Knowledge work"}
                      </a>
                      {" also studies ways to combine depths. Here concatenation is a concrete route, not a claim that every JK network uses it."}
                    </Prose>
                    <CodeBlock language="python" filename="retained-state-readouts.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"states = propagation_states(operator, features, rounds=2)\nall_ranges = torch.cat(states, dim=1)  # (nodes, 3 * channels)\ninitial_route = initial_residual_states(operator, features, 2, alpha=.2)\nordinary_route = features + operator.apply(features)"}
                    </CodeBlock>
                    <Prose>
                      {"These routes answer different questions. Initial injection retains a fixed reference; ordinary residual adds the current representation; a depth readout exposes several already computed representations to the final decision. Decide which information is missing before choosing the route. Concatenation increases output width and storage, and a useful original channel must actually contain the needed information."}
                    </Prose>
                    <H3>
                      {"Does fixed mixing prove that learned graph networks must lose the same distinctions?"}
                    </H3>
                    <Prose>
                      {"Use two channels carrying two already introduced patterns, then follow the channel map after the node-mixing step."}
                    </Prose>
                    <div data-flow-view="D36">
                      <MessagePassingCompensationLab />
                    </div>
                    <div data-flow-view="D36-scale">
                      <MessagePassingScaleLab />
                    </div>
                    <Prose>
                      {"We deliberately change the input from scalar "}
                      <code>
                        {"x"}
                      </code>
                      {" to the two-column table "}
                      <code>
                        {"X = [u₀, u₁]"}
                      </code>
                      {". The first column is the stationary node pattern; the second is the half-gain pattern. Two columns are needed because the learned channel map can now act differently on the two patterns. Multiplying on the left by "}
                      <code>
                        {"S"}
                      </code>
                      {" gives "}
                      <code>
                        {"[u₀, 0.5u₁]"}
                      </code>
                      {". Multiplying this result on the right by "}
                      <code>
                        {"diag(1, 2)"}
                      </code>
                      {" restores "}
                      <code>
                        {"[u₀, u₁]"}
                      </code>
                      {"."}
                    </Prose>
                    <Prose>
                      {"The drawing labels the axes of both operations. "}
                      <code>
                        {"S"}
                      </code>
                      {" mixes "}
                      <strong>
                        {"nodes"}
                      </strong>
                      {" within each column; the right-hand matrix mixes or rescales "}
                      <strong>
                        {"channels"}
                      </strong>
                      {" within each row. They do not share a dimension just because both are matrices. The second-channel gain control acts on the channel map only. A value 2 compensates this particular gain exactly in real arithmetic; 0 erases the second channel, and 3 amplifies it."}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"SX=\\left[u_0,\\tfrac12u_1\\right],\\qquad\n(SX)\\begin{bmatrix}1&0\\\\0&2\\end{bmatrix}=X."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"The construction needs an invariant feature span aligned with nonzero modes. If "}
                      <code>
                        {"S"}
                      </code>
                      {" annihilates a mode, multiplying its zero output by a channel gain cannot recover it. If another unwanted pattern contaminates the columns, the compensating channel map may amplify that contamination too. Even this constructed finite-depth example drifts in floating-point arithmetic: the new float64 sparse program's thirty repeated compensation steps differed from its initial table by about "}
                      <code>
                        {"4.24 × 10⁻⁸"}
                      </code>
                      {" in the largest entry. That measured error belongs to this implementation and execution, not an invariant mathematical constant or the result of fitting weights."}
                    </Prose>
                    <Prose>
                      {"The "}
                      <a href={"https://proceedings.mlr.press/v260/zhuo25a.html"}>
                        {"WeightRep study"}
                      </a>
                      {" motivates examining learned weights rather than concluding from propagation alone. Our demonstration is narrower: suitable channel maps exist for this retained nonzero span. It does not show that an optimizer finds them, that nonlinear training preserves the span, or that every graph admits this inverse construction."}
                    </Prose>
                    <Prose>
                      {""}
                      <strong>
                        {"Deeper: can a normalized smoothing score hide the scale of the state?"}
                      </strong>
                      {" Compare a second route that applies "}
                      <code>
                        {"2S"}
                      </code>
                      {" uniformly to both columns. It produces "}
                      <code>
                        {"Hᶩ = [2ᶩu₀, u₁]"}
                      </code>
                      {". Both directions remain present at finite depth, but the stationary column grows. The figure keeps four diagnostics separate: total squared size, raw variation, variation relative to size, and independent channel directions."}
                    </Prose>
                    <Prose>
                      {"Total squared size is the sum of squares of all entries, written "}
                      <code>
                        {"‖H‖²_F"}
                      </code>
                      {". Raw graph variation sums each column's Laplacian energy, written "}
                      <code>
                        {"tr(HᵀLH)"}
                      </code>
                      {": "}
                      <code>
                        {"tr"}
                      </code>
                      {" adds diagonal entries of that small channel-by-channel matrix. Dividing this energy by total size asks a different question. "}
                      <strong>
                        {"Singular values"}
                      </strong>
                      {" describe the strengths of independent column directions; their nonzero count is the matrix's "}
                      <strong>
                        {"rank"}
                      </strong>
                      {". In this orthogonal example they are "}
                      <code>
                        {"2ᶩ"}
                      </code>
                      {" and "}
                      <code>
                        {"1"}
                      </code>
                      {"."}
                    </Prose>
                    <NeuralTable caption={"Does fixed mixing prove that learned graph networks must lose the same distinctions?"} headers={[<>
                        {"Depth "}
                        <code>
                          {"ℓ"}
                        </code>
                        {""}
                      </>, <>
                        {"Total squared size"}
                      </>, <>
                        {"Raw variation"}
                      </>, <>
                        {"Variation / size"}
                      </>, <>
                        {"Singular values"}
                      </>, <>
                        {"Rank at absolute tolerance "}
                        <code>
                          {"10⁻¹²"}
                        </code>
                        {""}
                      </>]} rows={[[<>
                        {"0"}
                      </>, <>
                        {"2"}
                      </>, <>
                        {"0.5"}
                      </>, <>
                        {"0.25"}
                      </>, <>
                        {"1, 1"}
                      </>, <>
                        {"2"}
                      </>], [<>
                        {"1"}
                      </>, <>
                        {"5"}
                      </>, <>
                        {"0.5"}
                      </>, <>
                        {"0.1"}
                      </>, <>
                        {"2, 1"}
                      </>, <>
                        {"2"}
                      </>], [<>
                        {"6"}
                      </>, <>
                        {"4097"}
                      </>, <>
                        {"0.5"}
                      </>, <>
                        {"approximately 0.0001220405"}
                      </>, <>
                        {"64, 1"}
                      </>, <>
                        {"2"}
                      </>]]} />
                    <Prose>
                      {"The normalized variation falls, while raw variation stays 0.5 and both directions remain nonzero. The smaller-to-larger singular-value ratio is "}
                      <code>
                        {"2⁻ᶩ"}
                      </code>
                      {", so the small direction becomes harder to resolve relative to the growing one without being mathematically erased. An absolute tolerance and a tolerance relative to the largest singular value answer different numerical-rank questions. For an all-zero state, variation divided by total size is undefined; adding an unexplained epsilon and calling that result exact would change the diagnostic."}
                    </Prose>
                    <Prose>
                      {"The "}
                      <a href={"https://arxiv.org/html/2308.16800v3"}>
                        {"rank-collapse analysis"}
                      </a>
                      {" examines distinct structural and scaling assumptions. This finite table illustrates why a single score is insufficient. It is not a trained accuracy comparison or a universal immunity to smoothing. For a real experiment, inspect retained directions, scale, useful task signal and the legal assessment result together."}
                    </Prose>
                    <H3>
                      {"Can channel normalization recover a direction that mixing erased?"}
                    </H3>
                    <Prose>
                      {"Compare equalizing two retained columns with trying to equalize a table that has only one independent column direction left."}
                    </Prose>
                    <div data-flow-view="D37">
                      <MessagePassingWhiteningLab />
                    </div>
                    <Prose>
                      {"The first table is "}
                      <code>
                        {"Y = SX = [u₀, 0.5u₁]"}
                      </code>
                      {". Its columns are perpendicular, with squared lengths 1 and 0.25. Form "}
                      <code>
                        {"YᵀY"}
                      </code>
                      {": each entry is the dot product of two columns. This "}
                      <strong>
                        {"Gram matrix"}
                      </strong>
                      {" is "}
                      <code>
                        {"diag(1, 0.25)"}
                      </code>
                      {". It describes the columns' uncentered size and alignment, not their covariance after subtracting a feature mean."}
                    </Prose>
                    <Prose>
                      {"A channel map "}
                      <code>
                        {"diag(1, 2)"}
                      </code>
                      {" equalizes their lengths. In general, diagonalizing a positive-definite Gram matrix lets us divide each retained direction by its square-root eigenvalue. Call the Gram matrix "}
                      <code>
                        {"G = YᵀY"}
                      </code>
                      {", its orthonormal channel-direction columns "}
                      <code>
                        {"V"}
                      </code>
                      {", and their positive eigenvalues "}
                      <code>
                        {"γ"}
                      </code>
                      {". Then "}
                      <code>
                        {"G = V diag(γ) Vᵀ"}
                      </code>
                      {" and "}
                      <code>
                        {"G⁻¹ᐟ² = V diag(1/√γ) Vᵀ"}
                      </code>
                      {". The directions change channel coordinates, the diagonal rescales them, and the transpose changes back. Call the transformed table "}
                      <code>
                        {"Z"}
                      </code>
                      {". Applying the map on the right gives a table whose Gram matrix is the identity. This operation is called "}
                      <strong>
                        {"whitening"}
                      </strong>
                      {" in the stated uncentered sense:"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"Z=Y(Y^TY)^{-1/2},\\qquad Z^TZ=I\n\\quad\\text{when }Y\\text{ has full column rank}."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"The ridge control uses "}
                      <code>
                        {"G + ρI"}
                      </code>
                      {" instead. A positive "}
                      <strong>
                        {"ridge"}
                      </strong>
                      {" "}
                      <code>
                        {"ρ"}
                      </code>
                      {" reduces amplification of a very small direction, but its output Gram matrix is no longer exactly "}
                      <code>
                        {"I"}
                      </code>
                      {". At "}
                      <code>
                        {"ρ = 0.001"}
                      </code>
                      {", this example gives diagonals "}
                      <code>
                        {"1/1.001 ≈ 0.999001"}
                      </code>
                      {" and "}
                      <code>
                        {"0.25/0.251 ≈ 0.996016"}
                      </code>
                      {". Smaller eigenvalues are relatively more affected. This is a stability choice, not an identity-preserving exact normalization."}
                    </Prose>
                    <Prose>
                      {"The always-visible comparison uses a complete three-node graph with unit closed adjacency. Its "}
                      <code>
                        {"S"}
                      </code>
                      {" is the matrix with every entry "}
                      <code>
                        {"1/3"}
                      </code>
                      {". Every output node receives the same average. A zero-mean pattern such as "}
                      <code>
                        {"u₁"}
                      </code>
                      {" is sent to zero, so our two-column table drops from rank 2 to rank 1. Right multiplication can change which channel expresses a retained direction; it cannot create a node-valued direction outside the table's column span:"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"\\operatorname{rank}(YW)\\leq\\operatorname{rank}(Y)."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"Exact inversion of a zero Gram eigenvalue is undefined. The code explicitly leaves absent directions uninverted, giving a projection on the retained channel subspace rather than falsely reporting an identity Gram matrix. An earlier-state shortcut could supply a direction that "}
                      <code>
                        {"Y"}
                      </code>
                      {" lacks, but that is extra information through another route—not recovery by a channel map alone."}
                    </Prose>
                    <Prose>
                      {"The complete "}
                      <code>
                        {"gram_whiten"}
                      </code>
                      {" function derives its rule from the Gram matrix but computes the map from a singular value decomposition of "}
                      <code>
                        {"Y"}
                      </code>
                      {". The SVD writes "}
                      <code>
                        {"Y = U diag(σ) Vᵀ"}
                      </code>
                      {", with "}
                      <code>
                        {"γ = σ²"}
                      </code>
                      {". Directly forming the Gram matrix squares the condition number; working with singular values avoids that unnecessary numerical step. For positive ridge, "}
                      <code>
                        {"torch.hypot(σ, √ρ)"}
                      </code>
                      {" forms the regularized denominator. For exact subspace whitening, singular values below the declared absolute tolerance are left uninverted. That numerical threshold is part of the reported result, not a proof that a small mathematical direction is absent."}
                    </Prose>
                    <CodeBlock language="python" filename="retained-subspace-whitening.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"_, singular, right = torch.linalg.svd(features, full_matrices=False)\nbasis = right.T\ninverse = torch.zeros_like(singular)\nretained = singular > tolerance\ninverse[retained] = singular[retained].reciprocal()\nchannel_map = (basis * inverse[None, :]) @ basis.T\nwhitened = features @ channel_map"}
                    </CodeBlock>
                    <Prose>
                      {"This excerpt is the exact zero-ridge branch of "}
                      <code>
                        {"gram_whiten"}
                      </code>
                      {"; the complete file also contains the ridge branch. Channel whitening has decomposition costs and changes representation scaling. It should not be confused with dividing each node by its square-root degree, or with dividing the whole table's variation by total size. Each changes a different object for a different purpose."}
                    </Prose>
                    <Prose>
                      {"If a table has more channels than rows, the reduced SVD omits some channel directions in which that table is exactly zero. The returned map acts only within its supplied SVD span. Multiplying this same table by it gives the stated regularized whitening result, because omitted directions contribute zero. The returned map is therefore not the full inverse-square-root regularizer on an arbitrary future table: such a table could have a nonzero component along an omitted direction. To reuse a fitted transform on new rows, specify the missing-direction policy as part of that transform rather than assume this current-table diagnostic makes the choice for you."}
                    </Prose>
                    <H3>
                      {"Can rejecting messages improve the useful route instead of merely weakening it?"}
                    </H3>
                    <Prose>
                      {"Follow the desired source and the distracting source into a shared intermediate node, with each gate drawn on its sender's wire."}
                    </Prose>
                    <div data-flow-view="D38">
                      <MessagePassingRoutingLab />
                    </div>
                    <div data-flow-view="D38-depth">
                      <MessagePassingDepthReadoutLab />
                    </div>
                    <Prose>
                      {"We switch from the undirected paper graph to the explicitly directed toy "}
                      <code>
                        {"0 → 1 → 2"}
                      </code>
                      {", with an additional "}
                      <code>
                        {"3 → 1"}
                      </code>
                      {". Node 0 carries the useful value 2; node 3 carries the distraction 7; nodes 1 and 2 start at zero. Two ordinary sum rounds deliver 9 to node 2. This is not wrong arithmetic: the operation has no instruction saying which source is useful."}
                    </Prose>
                    <Prose>
                      {"For the stated task, a first-round sender gate can retain node 0 and reject node 3. A second-round gate retains node 1 so its useful message reaches node 2. Gates multiply a sender's current row before accumulation. They belong to the selected round and sender; a single static mask of receiver outputs would describe a different operation."}
                    </Prose>
                    <Prose>
                      {"The ideal gates are exactly 0 or 1. A finite sigmoid gate approaches those endpoints but cannot equal them. The control therefore uses a small "}
                      <code>
                        {"ε"}
                      </code>
                      {": desired gates are "}
                      <code>
                        {"1−ε"}
                      </code>
                      {" and denied gates are "}
                      <code>
                        {"ε"}
                      </code>
                      {". Round one gives node 1 the value "}
                      <code>
                        {"2(1−ε) + 7ε"}
                      </code>
                      {". Round two sends the fraction "}
                      <code>
                        {"1−ε"}
                      </code>
                      {" of that row to node 2:"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"h_2^{(2)}=2(1-\\varepsilon)^2+7\\varepsilon(1-\\varepsilon)."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"At "}
                      <code>
                        {"ε = 0"}
                      </code>
                      {" the constructed binary limit delivers exactly 2. At "}
                      <code>
                        {"ε = 0.001"}
                      </code>
                      {" the result is 2.002995, so the finite near-binary route is close but not exact. Rejecting the desired first wire would instead remove the useful signal. The picture makes both distinctions explicit: reachability is necessary, and the route must carry the right information."}
                    </Prose>
                    <CodeBlock language="python" filename="sender-gated-reduction.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"def sender_gated_sum(features, edge_index, gates):\n    source, receiver = edge_index\n    return torch.zeros_like(features).index_add(\n        0, receiver, features[source] * gates[source, None])"}
                    </CodeBlock>
                    <Prose>
                      {""}
                      <code>
                        {"routed_two_rounds"}
                      </code>
                      {" in the complete program supplies the exact graph, values and two gate rows. It has no optimizer and does not claim that a trained gate network discovers this route. The example shows why a smaller sensitivity to "}
                      <strong>
                        {"irrelevant"}
                      </strong>
                      {" inputs can be beneficial; interpreting every smaller derivative bound as worse task performance would miss the question being answered."}
                    </Prose>
                    <Prose>
                      {"A separate readout can combine outputs from several depths. If "}
                      <code>
                        {"q₀"}
                      </code>
                      {", "}
                      <code>
                        {"q₁"}
                      </code>
                      {", and "}
                      <code>
                        {"q₂"}
                      </code>
                      {" are nonnegative and add to one, "}
                      <code>
                        {"q₀h⁰ + q₁h¹ + q₂h²"}
                      </code>
                      {" is a depth-weighted state. First identify those three existing rows, then change their weight. It is a mixture of computation depths, not a concatenation and not a per-edge attention weight. The "}
                      <a href={"https://arxiv.org/html/2312.16560v3"}>
                        {"Adaptive Message Passing paper"}
                      </a>
                      {" learns message filtering and depth within a variational framework. The complete variational objective belongs with variational inference; this local route teaches the filtering mechanism rather than pretending to reproduce the paper's trained system."}
                    </Prose>
                    <Prose>
                      {"Depth now has several distinct questions: has useful information arrived, has it been compressed, has fixed mixing attenuated a required pattern, can earlier states supply it, and can channel operations act on the information still present? Even one round can also lose a distinction immediately if aggregation sends two different neighborhoods to the same value. That is the next section's question."}
                    </Prose>
                    <RemoteCodeBlock source="/learn-code/message-passing-graph-convolutions-gcn-gat-graphsage/graph-propagation-limits.py" filename="graph-propagation-limits.py" language="python" />
                    <H2>
                      {"8. What aggregation can distinguish"}
                    </H2>
                    <H3>
                      {"If two neighborhoods have the same sum, can a later neural layer tell them apart?"}
                    </H3>
                    <Prose>
                      {"Keep each neighbor occurrence visible, then follow the two different lists into the same aggregate value."}
                    </Prose>
                    <div data-flow-view="D39">
                      <MessagePassingMultisetWorkedLab />
                    </div>
                    <div data-flow-view="D39a">
                      <MessagePassingMultisetSizeLab />
                    </div>
                    <div data-flow-view="D39b">
                      <MessagePassingMultisetValueLab />
                    </div>
                    <div data-flow-view="D39c">
                      <MessagePassingMultisetPermutationLab />
                    </div>
                    <Prose>
                      {"We leave the three-paper path temporarily to isolate an aggregation decision. The first receiver has two neighbor values, "}
                      <code>
                        {"1"}
                      </code>
                      {" and "}
                      <code>
                        {"3"}
                      </code>
                      {"; the second has "}
                      <code>
                        {"2"}
                      </code>
                      {" and "}
                      <code>
                        {"2"}
                      </code>
                      {". The second list contains "}
                      <strong>
                        {"two occurrences"}
                      </strong>
                      {" of value 2, not one occurrence drawn twice for decoration. Both sums are 4. If an MLP sees only that scalar 4, its input is identical for the two cases. Regardless of its hidden width or training, a deterministic MLP cannot return different outputs for identical inputs."}
                    </Prose>
                    <Prose>
                      {"The drawing's lower route changes what happens "}
                      <strong>
                        {"before"}
                      </strong>
                      {" the sum. Transform every occurrence "}
                      <code>
                        {"v"}
                      </code>
                      {" into the two coordinates "}
                      <code>
                        {"φ(v) = (v, v²)"}
                      </code>
                      {". The first list becomes "}
                      <code>
                        {"(1, 1)"}
                      </code>
                      {" and "}
                      <code>
                        {"(3, 9)"}
                      </code>
                      {", whose sum is "}
                      <code>
                        {"(4, 10)"}
                      </code>
                      {". The second becomes two copies of "}
                      <code>
                        {"(2, 4)"}
                      </code>
                      {", whose sum is "}
                      <code>
                        {"(4, 8)"}
                      </code>
                      {". A later MLP now receives distinguishable rows. The second coordinate retained information about spread that the raw sum discarded."}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"\\sum_{v\\in\\{1,3\\}}v=\\sum_{v\\in\\{2,2\\}}v=4,\n\\qquad\n\\sum_{v\\in\\{1,3\\}}\\phi(v)=(4,10),\\quad\n\\sum_{v\\in\\{2,2\\}}\\phi(v)=(4,8)."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"The lesson is about operation order. A transform applied to each neighbor can preserve a distinction; the same transform applied only to the already-collided sum cannot recover it. This is why §4's pooling aggregator transformed donors before reducing them. A useful transformation still has to preserve the distinctions the target task requires."}
                    </Prose>
                    <Prose>
                      {"The independent list editor is a separate experiment from the single-node graph editor. First set the sizes of lists A and B from 1 to 6. Then select a list, an occurrence, and its value between −8 and 8. Both raw and transformed routes remain visible. Copying A into reversed B checks order invariance without sharing a mutable list: future edits in A must not alter B. If you choose mean or max for the raw route, the transformed route remains explicitly labelled "}
                      <strong>
                        {"sum of transformed occurrences"}
                      </strong>
                      {". It is not silently changed into transformed mean or max."}
                    </Prose>
                    <Prose>
                      {"Try "}
                      <code>
                        {"(0, 4)"}
                      </code>
                      {" versus "}
                      <code>
                        {"(1, 3)"}
                      </code>
                      {": equal raw sums, but transformed sums "}
                      <code>
                        {"(4, 16)"}
                      </code>
                      {" and "}
                      <code>
                        {"(4, 10)"}
                      </code>
                      {". Then try three occurrences, "}
                      <code>
                        {"(1, 1, 4)"}
                      </code>
                      {" versus "}
                      <code>
                        {"(0, 3, 3)"}
                      </code>
                      {". Both raw sums are 6 and both squared-value sums are 18. This particular two-coordinate lift also collides. Distinguishing one counterexample does not establish that an aggregator distinguishes every possible neighborhood."}
                    </Prose>
                    <CodeBlock language="python" filename="lifted-occurrence-sum.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"def lifted_sum(values):\n    occurrences = torch.as_tensor(values, dtype=torch.float64)\n    transformed = torch.stack((occurrences, occurrences.square()), dim=1)\n    return transformed.sum(dim=0)"}
                    </CodeBlock>
                    <Prose>
                      {"Here the first tensor axis holds occurrences, and the second holds the two transformed coordinates. "}
                      <code>
                        {"sum(dim=0)"}
                      </code>
                      {" reduces occurrences while keeping channels. Reversing occurrences changes neither output coordinate; deleting an occurrence generally does. For learned transforms, replace the displayed polynomial "}
                      <code>
                        {"φ"}
                      </code>
                      {" with a shared network on each donor, rather than assuming a post-sum network has the same information."}
                    </Prose>
                    <H3>
                      {"Which reducers notice that a neighbor value occurred twice?"}
                    </H3>
                    <Prose>
                      {"Compare a list with a duplicated whole list through three permanently visible reduction paths."}
                    </Prose>
                    <div data-flow-view="D40">
                      <MessagePassingDuplicateWorkedLab />
                    </div>
                    <div data-flow-view="D40a">
                      <MessagePassingSageReductionLab />
                    </div>
                    <div data-flow-view="D40b">
                      <MessagePassingMultisetReductionLab />
                    </div>
                    <Prose>
                      {"The original list "}
                      <code>
                        {"(1, 3)"}
                      </code>
                      {" has sum 4, mean 2 and maximum 3. Duplicating the entire list gives "}
                      <code>
                        {"(1, 3, 1, 3)"}
                      </code>
                      {": sum 8, mean 2 and maximum 3. "}
                      <strong>
                        {"Sum"}
                      </strong>
                      {" retains the total contribution and is sensitive to multiplicity. "}
                      <strong>
                        {"Mean"}
                      </strong>
                      {" divides by the occurrence count; duplicating every occurrence equally preserves it. "}
                      <strong>
                        {"Max"}
                      </strong>
                      {" retains the largest value and ignores how often smaller values occur."}
                    </Prose>
                    <Prose>
                      {"Unequal duplication is different. "}
                      <code>
                        {"(1, 3, 3)"}
                      </code>
                      {" has mean "}
                      <code>
                        {"7/3"}
                      </code>
                      {", not 2. Therefore “mean ignores duplicates” is too broad; it ignores proportional duplication of the whole multiset. Max can miss both counts and the values below its largest entry. A mean can be useful when the target needs a typical neighbor; a sum can be useful when the target depends on total quantity. Neither is always more useful, because the task defines what information matters."}
                    </Prose>
                    <Prose>
                      {"A "}
                      <strong>
                        {"multiset"}
                      </strong>
                      {" is a collection that ignores order but retains occurrence counts. It is the appropriate object for these neighborhood reducers: a relabeling or reordering should not change a shared aggregation, while two equal-valued neighbors can still be two distinct contributions. The already introduced SAGE editor supports 0–6 occurrences with independent values; duplicating its whole list is enabled only when it fits the same six-occurrence domain. Counts are not replaced by a fixed menu of examples."}
                    </Prose>
                    <Prose>
                      {"At an empty neighborhood, sum has the natural value zero. A mathematical mean of zero items and a maximum of an empty set are not ordinary finite numbers. The local SAGE editor uses the previously stated zero-aggregate convention so the own-node branch survives. A library reducer may use its own neutral-fill convention. Report that convention explicitly, especially with negative values, rather than accidentally treating a zero fill as a genuine maximum supplied by a neighbor."}
                    </Prose>
                    <Prose>
                      {"This gives an engineering decision rule. If count matters, preserve it through the reducer or add it as an explicit feature. If scale should not vary with count, a mean may be appropriate, while another channel retains the count needed by the output. Compare each route on a changed case before treating an abstract “expressiveness” claim as a task recommendation."}
                    </Prose>
                    <H3>
                      {"How does GIN keep a node's own contribution and its neighbor multiset?"}
                    </H3>
                    <Prose>
                      {"Trace the separate own-node branch and neighbor-sum branch into one MLP input, without inserting a second self-loop message."}
                    </Prose>
                    <div data-flow-view="D41a">
                      <MessagePassingGinScalarLab />
                    </div>
                    <Prose>
                      {"The center value is 2 and its neighbor values are 1 and 3. Sum the neighbors to obtain 4. Multiply the own value by "}
                      <code>
                        {"1 + ε"}
                      </code>
                      {", add the two branches, and send the result into a shared MLP. Initially "}
                      <code>
                        {"ε = 0"}
                      </code>
                      {", so its input is "}
                      <code>
                        {"2 + 4 = 6"}
                      </code>
                      {". For this worked scalar picture, use a specified MLP: hidden values "}
                      <code>
                        {"ReLU((t, −t))"}
                      </code>
                      {", followed by the difference of its two hidden entries. This tiny MLP returns "}
                      <code>
                        {"t"}
                      </code>
                      {" for both positive and negative "}
                      <code>
                        {"t"}
                      </code>
                      {"; it makes the numerical route inspectable rather than claiming to learn a rich task."}
                    </Prose>
                    <Prose>
                      {"Changing "}
                      <code>
                        {"ε"}
                      </code>
                      {" changes the own contribution while retaining the neighbor sum. At "}
                      <code>
                        {"ε = 0.5"}
                      </code>
                      {", the own contribution is 3 and the MLP input is 7. The neighbor-value control acts on an already labelled donor. A zero neighbor count still leaves "}
                      <code>
                        {"(1 + ε) × own"}
                      </code>
                      {"; its behavior is not the closed-neighborhood GCN formula."}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"h_i^{\\mathrm{new}}=\n\\operatorname{MLP}\\!\\left((1+\\varepsilon)h_i+\n\\sum_{j\\in\\mathcal N(i)}h_j\\right)."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"This is the update used by a "}
                      <strong>
                        {"Graph Isomorphism Network"}
                      </strong>
                      {", or "}
                      <strong>
                        {"GIN"}
                      </strong>
                      {". The name concerns what graph structures its aggregation can distinguish under assumptions; it does not promise a solution to arbitrary graph-isomorphism instances. The neighbor sum here excludes the explicit own branch. Adding stored self-loop edges without adjusting the formula would count the own row again."}
                    </Prose>
                    <Prose>
                      {"The complete "}
                      <code>
                        {"SparseGin"}
                      </code>
                      {" implementation is in "}
                      <code>
                        {"graph-aggregation-variants.py"}
                      </code>
                      {". It sums incoming non-self edges, adds the scaled own row, and invokes its supplied MLP. A trainable "}
                      <code>
                        {"ε"}
                      </code>
                      {" is a parameter; a fixed "}
                      <code>
                        {"ε"}
                      </code>
                      {" is a buffer. The epsilon tensor starts on the MLP's device and in its dtype, so constructing a float64 layer does not first round that value through a float32 tensor. The default fixed epsilon is not an assertion that every theoretical discriminative choice or trained configuration has the same strength."}
                    </Prose>
                    <RemoteCodeBlock source="/learn-code/message-passing-graph-convolutions-gcn-gat-graphsage/graph-aggregation-variants.py" filename="graph-aggregation-variants.py" language="python" />
                    <CodeBlock language="python" filename="gin-own-neighbor-merge.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"return self.transform((1 + self.epsilon) * features + neighbors)"}
                    </CodeBlock>
                    <Prose>
                      {"This excerpt is the implemented update; the complete supplied class defines the edge reduction and fixed/trainable state. Next match that exact computation to an ordinary library layer, rather than infer equivalence from its name."}
                    </Prose>
                    <div data-flow-view="D41-library">
                      <MessagePassingGinLibraryFigure />
                    </div>
                    <Prose>
                      {"The ordinary "}
                      <a href={"https://pytorch-geometric.readthedocs.io/en/latest/_modules/torch_geometric/nn/conv/gin_conv.html"}>
                        {"PyG "}
                        <code>
                          {"GINConv"}
                        </code>
                        {" source"}
                      </a>
                      {" constructs its layer by "}
                      <strong>
                        {"resetting the supplied MLP"}
                      </strong>
                      {". Merely passing a copied MLP therefore does not preserve its learned values. "}
                      <code>
                        {"ordinary_gin_layer"}
                      </code>
                      {" first constructs the ordinary layer, then loads the scratch MLP's state into "}
                      <code>
                        {"other.nn"}
                      </code>
                      {" and copies the current epsilon into "}
                      <code>
                        {"other.eps"}
                      </code>
                      {". It uses "}
                      <code>
                        {"train_eps=True"}
                      </code>
                      {" only when the scratch epsilon is a parameter. A fixed buffer still travels with the state but does not receive an optimizer step."}
                    </Prose>
                    <Prose>
                      {"The mapping's core, with "}
                      <code>
                        {"layer"}
                      </code>
                      {" a complete "}
                      <code>
                        {"SparseGin"}
                      </code>
                      {" instance, is"}
                    </Prose>
                    <CodeBlock language="python" filename="gin-constructor-parameter-copy.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"import copy\nimport torch\nfrom torch_geometric.nn import GINConv\n\nparameter = next(layer.transform.parameters())\ntrain_epsilon = isinstance(layer.epsilon, torch.nn.Parameter)\nother = GINConv(copy.deepcopy(layer.transform),\n                eps=float(layer.epsilon.detach()[0]),\n                train_eps=train_epsilon).to(device=parameter.device,\n                                            dtype=parameter.dtype)\nother.nn.load_state_dict(layer.transform.state_dict())\nwith torch.no_grad():\n    other.eps.copy_(layer.epsilon)"}
                    </CodeBlock>
                    <Prose>
                      {"The complete helper also returns corresponding trainable parameter pairs: the MLP's named weights and biases map to the same names in "}
                      <code>
                        {"other.nn"}
                      </code>
                      {", and trainable "}
                      <code>
                        {"epsilon"}
                      </code>
                      {" maps to "}
                      <code>
                        {"other.eps"}
                      </code>
                      {". These are separate tensors with equal initial values; updating one must not mutate the other through accidental shared storage. Both routes consume the same "}
                      <code>
                        {"features"}
                      </code>
                      {" and source/target "}
                      <code>
                        {"edge_index"}
                      </code>
                      {", with no stored self loops because the own branch is already explicit."}
                    </Prose>
                    <Prose>
                      {"For a concrete comparison, the supplied "}
                      <code>
                        {"matched_gin_example"}
                      </code>
                      {" switches to four nodes with two input channels and an explicit 2→3→2 MLP. Node 3 is isolated and has feature "}
                      <code>
                        {"[1.8,.5]"}
                      </code>
                      {". At epsilon "}
                      <code>
                        {".17"}
                      </code>
                      {", its MLP input is "}
                      <code>
                        {"[2.106,.585]"}
                      </code>
                      {"; the defined first map and ReLU produce "}
                      <code>
                        {"[.9254,0,1.0137]"}
                      </code>
                      {", and the second map produces "}
                      <code>
                        {"[.53036,.22177]"}
                      </code>
                      {". The other nodes have explicit directed donor lists; the complete function supplies their rows, maps, biases and imports. No weights are fitted in this example."}
                    </Prose>
                    <Prose>
                      {"Its scalar comparison objective multiplies the output cells by the stated probe table "}
                      <code>
                        {"arange(1,9).reshape(4,2)/7"}
                      </code>
                      {" and sums them. That choice exposes input, MLP and epsilon derivatives without pretending to be a task accuracy loss. Both layers differentiate the same scalar, compare every mapped derivative, take an equal "}
                      <code>
                        {".03"}
                      </code>
                      {" SGD step on their trainable tensors, and compare the new outputs. Calling "}
                      <code>
                        {"matched_gin_example(train_epsilon=False)"}
                      </code>
                      {" repeats the same route with fixed epsilon; it remains "}
                      <code>
                        {".17"}
                      </code>
                      {" while MLP parameters update. The file's main calls both examples and prints their actual before/after values and mapping counts. Both forward/derivative/update routes were executed in the stated Torch/PyG environment. Matching one layer does not establish that a trained classifier reaches the strongest possible discriminator."}
                    </Prose>
                    <Prose>
                      {""}
                      <strong>
                        {"Deeper: what does the injectivity claim actually require?"}
                      </strong>
                      {" A function is "}
                      <strong>
                        {"injective"}
                      </strong>
                      {" when distinct permitted inputs always have distinct outputs. The GIN theory uses a countable feature domain and bounded-size multisets, with sufficiently expressive shared transformations and readouts. A raw sum of arbitrary real values is not injective, as the first picture showed."}
                    </Prose>
                    <Prose>
                      {"One existence argument is easier to see as digit counting. Enumerate permitted labels as "}
                      <code>
                        {"1, 2, …"}
                      </code>
                      {", assume no multiset contains more than "}
                      <code>
                        {"M"}
                      </code>
                      {" occurrences, and choose an integer base "}
                      <code>
                        {"B > M"}
                      </code>
                      {". Map label "}
                      <code>
                        {"k"}
                      </code>
                      {" to "}
                      <code>
                        {"B⁻ᵏ"}
                      </code>
                      {". A finite multiset's sum places its count for each label in a separate base-"}
                      <code>
                        {"B"}
                      </code>
                      {" fractional position. Because each count is smaller than "}
                      <code>
                        {"B"}
                      </code>
                      {", it cannot carry into another label's position. Distinct bounded finite multisets then have distinct sums in exact arithmetic. This explains how a suitable "}
                      <strong>
                        {"pre-sum"}
                      </strong>
                      {" representation can preserve multiplicity. It is not an efficient floating-point encoding for unrestricted data: late positions can become numerically unresolved."}
                    </Prose>
                    <Prose>
                      {"Distinguishing the center from its neighborhood is an additional requirement. For suitable encodings, a choice such as an irrational "}
                      <code>
                        {"ε"}
                      </code>
                      {" can separate that own-node contribution from the rational multiset code in the theoretical construction. This explains why the coefficient matters; it does not prescribe storing an exact irrational number in a computer or claim that the default "}
                      <code>
                        {"ε = 0"}
                      </code>
                      {" is injective for all center/multiset pairs. For instance, swapping own value 1/neighbor 2 with own value 2/neighbor 1 collides at "}
                      <code>
                        {"ε = 0"}
                      </code>
                      {" if both are encoded directly as scalars."}
                    </Prose>
                    <Prose>
                      {"The "}
                      <a href={"https://arxiv.org/html/1810.00826v3"}>
                        {"GIN paper"}
                      </a>
                      {" connects such injective aggregation to neighborhood refinement. A finite-width MLP, finite precision, optimization and the actual input distribution remain separate issues. For an engineer, the useful consequence is to inspect what the aggregation discards and choose a representation adequate for the task; for a researcher, it is to state the permitted input domain and readout assumptions before making a discrimination theorem."}
                    </Prose>
                    <H3>
                      {"How does neighborhood refinement compare structures without relying on their drawing positions?"}
                    </H3>
                    <Prose>
                      {"Follow old categorical labels into a center-and-neighbor tuple and assign new labels using one shared dictionary."}
                    </Prose>
                    <div data-flow-view="D41b">
                      <MessagePassingRefinementLab />
                    </div>
                    <Prose>
                      {"Start each node with a categorical label such as "}
                      <code>
                        {"A"}
                      </code>
                      {". For one node, record its own old label separately from the "}
                      <strong>
                        {"multiset"}
                      </strong>
                      {" of its neighbors' old labels. Sort that neighbor list only to obtain a reproducible tuple; sorting does not remove duplicates. A node with own label "}
                      <code>
                        {"A"}
                      </code>
                      {" and two neighbors labelled "}
                      <code>
                        {"A"}
                      </code>
                      {" has the tuple "}
                      <code>
                        {"(A, (A, A))"}
                      </code>
                      {". Another with three such neighbors has "}
                      <code>
                        {"(A, (A, A, A))"}
                      </code>
                      {", which is different."}
                    </Prose>
                    <Prose>
                      {"Assign a new label to each distinct tuple. The two graphs must use the "}
                      <strong>
                        {"same dictionary"}
                      </strong>
                      {", so equal tuples receive the same new label across graphs. All tuples are built from the old labels before any node is updated. This is the same synchronous-old/new distinction taught in §2; updating labels in place would make the result depend on processing order."}
                    </Prose>
                    <Prose>
                      {"Repeating this operation is "}
                      <strong>
                        {"one-dimensional Weisfeiler–Lehman refinement"}
                      </strong>
                      {", usually written "}
                      <strong>
                        {"1-WL"}
                      </strong>
                      {". After a round, the counts of new labels summarize which neighborhoods occurred. If two graphs have different label counts, this refinement distinguishes them. If the counts remain identical, it has not established that the graphs are isomorphic; it has merely failed to distinguish them with this procedure."}
                    </Prose>
                    <CodeBlock language="python" filename="shared-wl-neighborhood-key.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"key = (old_labels[node], tuple(sorted(old_labels[j] for j in neighbors[node])))"}
                    </CodeBlock>
                    <Prose>
                      {""}
                      <code>
                        {"refinement_round"}
                      </code>
                      {" in the supplied aggregation program accepts one flat old-label list and its incoming-neighbor lists, makes the shared tuple dictionary, and returns one flat new-label list. To compare two graphs, join their label lists, offset the second graph's neighbor indices, and call it "}
                      <strong>
                        {"once"}
                      </strong>
                      {". Then split the returned labels at the first graph's size. Calling the function separately on two graphs can assign dictionary integers differently and is not the shared-dictionary comparison described here."}
                    </Prose>
                    <CodeBlock language="python" filename="shared-wl-dictionary.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"offset = len(labels_a)\njoint_labels = labels_a + labels_b\njoint_incoming = incoming_a + [[offset + node for node in donors]\n                               for donors in incoming_b]\njoint_next = refinement_round(joint_labels, joint_incoming)\nnext_a, next_b = joint_next[:offset], joint_next[offset:]"}
                    </CodeBlock>
                    <Prose>
                      {"This construction never adds edges between the graphs. It shares the label-assignment rule, not their messages. The comparison uses categorical tuples for exact matching rather than floating neural outputs. A node renaming permutes the result without changing its graph-level label counts. Coordinates used to lay out circles never enter those tuples."}
                    </Prose>
                    <Prose>
                      {"Under the GIN theorem's suitable injective aggregation/update and graph-readout assumptions, a message-passing model can match the distinguishing power of this refinement on its allowed inputs. A graph-level readout that discards necessary counts can weaken that correspondence. A node-level prediction and a graph-level discriminator are different tasks, as §1 established. A shared local network also cannot extract a structural distinction that none of its permitted messages reveals."}
                    </Prose>
                    <H3>
                      {"Can two visibly different graphs remain identical to every one of these local rounds?"}
                    </H3>
                    <Prose>
                      {"Compare one six-node cycle with two disconnected triangles, retaining the same initial feature and degree at every node."}
                    </Prose>
                    <div data-flow-view="D42">
                      <MessagePassingStructuralLimitLab />
                    </div>
                    <Prose>
                      {"The left drawing is a ring with six nodes. The right drawing is two triangles with no edge between them. Both graphs have six nodes, each with two neighbors and initial feature 1. In the cycle, a node receives two ones; in a triangle, a node also receives two ones. Adding its own one gives 3. The next round adds three copies of 3, giving 9. After "}
                      <code>
                        {"ℓ"}
                      </code>
                      {" rounds of this specified self-plus-neighbor sum, every node in either graph has "}
                      <code>
                        {"3ᶩ"}
                      </code>
                      {", and both graph sums are "}
                      <code>
                        {"6 × 3ᶩ"}
                      </code>
                      {"."}
                    </Prose>
                    <Prose>
                      {"The integer-round control changes both graphs together. At round zero they have the same node values; no number of these symmetric local rounds reveals which graph is disconnected. Under 1-WL, all nodes also retain equal labels at every round because their own labels and neighbor-label multisets remain equal. Adding the same shared MLP or the same epsilon coefficient cannot create a distinction from identical local inputs in these regular graphs."}
                    </Prose>
                    <Prose>
                      {"The circles' positions make the structures obvious to "}
                      <strong>
                        {"you"}
                      </strong>
                      {", but positions are not features here. Giving a node a distinctive input value can break the symmetry; that deliberately changes the input problem. Unique node IDs can also introduce distinctions while changing the desired relabeling symmetry. Higher-order structural methods, explicit component information or suitable positional features are different model choices, not proof that the local update secretly saw the missing structure. The next Graph Transformers lesson will examine additional structural and geometric information with that distinction intact."}
                    </Prose>
                    <Prose>
                      {"This is why expressiveness and prediction quality need separate experiments. A structural counterexample identifies a limitation of a stated model family. It does not say the family is useless on a practical dataset, nor that a more expressive alternative generalizes better. The unfavorable Karate results in §6 remain empirical results under their recorded protocol. This six-node pair is a controlled representational limit."}
                    </Prose>
                    <Prose>
                      {"We now know what one aggregation can retain and lose. A large graph adds another practical issue: even a legally defined neighborhood may be too expensive to materialize for every seed and every layer. Next we separate sampling occurrence paths, actual node identities and the computation order so a scalable implementation does not accidentally change its objective or leak information between examples."}
                    </Prose>
                    <H2>
                      {"9. Sampling, batching and useful applications"}
                    </H2>
                    <H3>
                      {"How much context must one seed read?"}
                    </H3>
                    <Prose>
                      {"Begin at the output you need, expand its dependencies outward, then compute the required representations inward."}
                    </Prose>
                    <div data-flow-view="D43a">
                      <MessagePassingSamplingDepthLab />
                    </div>
                    <div data-flow-view="D43b">
                      <MessagePassingSamplingFanoutLab />
                    </div>
                    <div data-flow-view="D43c">
                      <MessagePassingSamplingReplacementLab />
                    </div>
                    <Prose>
                      {"The "}
                      <strong>
                        {"seed"}
                      </strong>
                      {" is a node whose output or loss we currently need. A "}
                      <strong>
                        {"fanout"}
                      </strong>
                      {" is the number of neighbor reads requested for a receiver at one expansion step. A two-layer output needs its immediate neighbors' first-layer states; those states may need another set of initial neighbors. The tree starts with the seed at hop zero. Each child records a dependency of the parent. A downward dependency arrow therefore means “the parent needs this child's state”; actual information travels from that child back toward the parent. This is a diagram of computation, rather than a new graph with extra real nodes."}
                    </Prose>
                    <Prose>
                      {"We switch from the three-paper path to a four-ID graph to make repeated dependencies visible. IDs 0, 1, 2 and 3 each have the other three IDs as incoming donors. Seed 0 requests four donor occurrences, then each occurrence requests three more. In the illustrated "}
                      <strong>
                        {"cyclic"}
                      </strong>
                      {" ordering, seed 0 reads "}
                      <code>
                        {"[1, 2, 3, 1]"}
                      </code>
                      {" when replacement is allowed. Two positions have ID 1, but they are two requested message occurrences from the same underlying node. The next level has twelve positions. Counting the root gives "}
                      <code>
                        {"1 + 4 + 4 × 3 = 17"}
                      </code>
                      {" occurrences, while only four underlying IDs appear."}
                    </Prose>
                    <Prose>
                      {"Replacement means a donor may occupy more than one slot in the same sample. Without replacement, the first request for four is capped at the three available donors; the level counts become 1, 3 and 9, totaling 13. Changing depth retains the existing fanouts; a newly added hop begins at fanout 2. A zero fanout leaves that dependency level and all subsequent levels empty. At three fanouts of 8 with replacement, the counts are 1, 8, 64 and 512: 585 occurrences, still only four unique IDs. The figure then uses readable level counts and a traced path instead of squeezing hundreds of labels together."}
                    </Prose>
                    <Prose>
                      {"For "}
                      <code>
                        {"L"}
                      </code>
                      {" outward expansion steps with fanouts "}
                      <code>
                        {"f₁, …, f_L"}
                      </code>
                      {", the uncapped neighbor-tree count is"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"1+\\sum_{k=1}^{L}\\prod_{j=1}^{k}f_j."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"This counts the specified neighbor occurrence tree. It is not a claim that all implementations allocate that many unique nodes, or that every full model's own-state branches and intermediate buffers fit that count. A self/root map, such as mean GraphSAGE's own projection, also needs the receiver's earlier state. A block implementation must retain that row even when no neighbors are sampled. For an outward 25/10 example, the tree bound is 276 including the root, not 250 unique nodes. Sharing, available degree and a chosen computation schedule determine actual storage and work."}
                    </Prose>
                    <Prose>
                      {"The unchanged cyclic illustration is deliberately predictable: it exposes identities, multiplicity and count limits. It does "}
                      <strong>
                        {"not"}
                      </strong>
                      {" draw donors uniformly at random. An unbiased-estimator claim needs a separate probability model, which we introduce next. Coalescing storage for two equal IDs is also different from discarding one of their edge occurrences: the latter changes a sum and can change a mean when only some donors are duplicated, as §8 showed."}
                    </Prose>
                    <H3>
                      {"What does “unbiased” guarantee—and what does it leave out?"}
                    </H3>
                    <Prose>
                      {"Average every equally likely sample before deciding whether sampling preserves an operation."}
                    </Prose>
                    <div data-flow-view="D44">
                      <MessagePassingSamplingBiasLab />
                    </div>
                    <Prose>
                      {"This example switches to four donor values "}
                      <code>
                        {"[1, 3, 5, 9]"}
                      </code>
                      {", with no claim that they are the cyclic graph's samples. Choose two distinct donors uniformly: all six unordered pairs have probability "}
                      <code>
                        {"1/6"}
                      </code>
                      {". The six pair means are 2, 3, 5, 4, 6 and 7. Their average is "}
                      <code>
                        {"27/6 = 4.5"}
                      </code>
                      {", exactly the full four-donor mean. Here "}
                      <strong>
                        {"expectation"}
                      </strong>
                      {" means an average of outcomes weighted by their probabilities. Equal probabilities let us simply average the six rows."}
                    </Prose>
                    <Prose>
                      {"An "}
                      <strong>
                        {"unbiased"}
                      </strong>
                      {" sampled mean has expectation equal to the quantity it estimates. It need not equal that quantity on a particular draw. For example, selecting values 1 and 3 gives mean 2 rather than 4.5. The seed control in the separate random-sampler view makes a draw reproducible; it does not remove the difference between one draw and the expectation over all draws."}
                    </Prose>
                    <Prose>
                      {"Now square each sampled mean. The six squares are 4, 9, 25, 16, 36 and 49. Their average is "}
                      <code>
                        {"139/6 ≈ 23.1667"}
                      </code>
                      {". Squaring the full mean gives "}
                      <code>
                        {"4.5² = 20.25"}
                      </code>
                      {". The two routes disagree because a square is nonlinear: moving the average across that operation changes the result. The gap is the sampled mean's variance, "}
                      <code>
                        {"35/12 ≈ 2.9167"}
                      </code>
                      {"."}
                    </Prose>
                    <Prose>
                      {"Let "}
                      <code>
                        {"M"}
                      </code>
                      {" name the random sample mean and "}
                      <code>
                        {"μ"}
                      </code>
                      {" the full mean. For this unbiased scheme,"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"\\mathbb E[M]=\\mu,\\qquad\n\\mathbb E[M^2]=\\mu^2+\\operatorname{Var}(M)."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"Variance is the average squared distance from the mean. Expanding "}
                      <code>
                        {"(M − μ)²"}
                      </code>
                      {" and using "}
                      <code>
                        {"E[M] = μ"}
                      </code>
                      {" gives the second identity. It explains the visible gap without a noisy Monte Carlo approximation. Change the final donor from 9 to another value and the six routes recompute. If all donors are equal, every sample mean is the same; variance and the gap are zero."}
                    </Prose>
                    <Prose>
                      {"The same issue can occur at a neural activation. With donors "}
                      <code>
                        {"[-3, −1, 1, 3]"}
                      </code>
                      {", the six means are "}
                      <code>
                        {"[-2, −1, 0, 0, 1, 2]"}
                      </code>
                      {". Applying ReLU first and averaging gives 0.5. Applying ReLU to the full mean of zero gives zero. This is a second worked nonlinear example, not an assertion that every activation produces a gap in every case."}
                    </Prose>
                    <Prose>
                      {"Sampling therefore changes more than a memory budget. A nonlinear layer, loss or gradient can depend on the sampled computation's distribution. It is possible to estimate gradients of a "}
                      <strong>
                        {"sampled objective"}
                      </strong>
                      {" while not matching the corresponding full-neighborhood objective. State which objective is intended; do not conclude that every sampler's gradient is biased from this one mean example. A nonuniform sampler also needs an appropriate estimator if the target is a uniform neighbor mean. Duplicate edge occurrences, sampling with replacement, sampling sums and temporal eligibility each define different distributions or quantities."}
                    </Prose>
                    <Prose>
                      {""}
                      <code>
                        {"pair_sample_statistics"}
                      </code>
                      {" in "}
                      <code>
                        {"graph-sampling-batching.py"}
                      </code>
                      {" enumerates every pair. It computes the full mean, expected sample mean, expected square and variance directly. The exact enumeration is the reference for this four-donor picture; it is separate from both the cyclic trace and the seeded implementation below."}
                    </Prose>
                    <H3>
                      {"How do global nodes become local layer blocks?"}
                    </H3>
                    <Prose>
                      {"Keep the identity map, sampled edges and layer order explicit, so one row never silently becomes another node."}
                    </Prose>
                    <div data-flow-view="D43d">
                      <MessagePassingSeededBlocksLab />
                    </div>
                    <Prose>
                      {"A "}
                      <strong>
                        {"global ID"}
                      </strong>
                      {" identifies a node in the whole legal graph. A "}
                      <strong>
                        {"local index"}
                      </strong>
                      {" identifies its row in one smaller table used for a calculation. Those numbers need not be equal. If a source table contains global IDs "}
                      <code>
                        {"[1, 2, 0, 3]"}
                      </code>
                      {", local source row 0 is global node 1, and row 2 is global node 0. A separate target table "}
                      <code>
                        {"[1, 2]"}
                      </code>
                      {" contains two receiver rows. The local edge "}
                      <code>
                        {"2 → 0"}
                      </code>
                      {" means “global node 0 supplies global node 1,” not “global node 2 supplies global node 0.”"}
                    </Prose>
                    <Prose>
                      {"The new sampler first builds incoming lists from the original source/receiver edge list in one "}
                      <code>
                        {"O(N + E)"}
                      </code>
                      {" preprocessing pass. For each required receiver, it chooses incoming "}
                      <strong>
                        {"edge occurrences"}
                      </strong>
                      {" uniformly, retaining repeated occurrences if the input has duplicates or sampling permits replacement. No outgoing edge becomes incoming merely because both endpoints were selected. Sampling never grants access to an otherwise forbidden relationship."}
                    </Prose>
                    <Prose>
                      {"We use "}
                      <strong>
                        {"per-layer bipartite blocks"}
                      </strong>
                      {": each block has a source table, a target table and local source-to-target indices. “Bipartite” here describes those two computational tables; a global node may occur in both. Equal global IDs share storage within a block, but repeated sampled edges remain in its reduction. The target IDs are placed first in the source table so the own-state rows are readily available."}
                    </Prose>
                    <Prose>
                      {"Our chosen block sampler samples a receiver's context once per required layer and shares that computed state. An independently sampled unfolded tree could sample different contexts for two occurrences of the same global node. Coalescing those two independently sampled computations would change that stochastic model. Thus the cyclic occurrence count, our shared layer blocks and an ordinary loader's union subgraph are three explicit representations; their identity bookkeeping connects them, but we do not assert that their random computations are interchangeable."}
                    </Prose>
                    <Prose>
                      {"Suppose two forward layers use fanouts "}
                      <code>
                        {"[2, 1]"}
                      </code>
                      {". The last layer needs one donor per seed. After finding those donors, the first layer needs two donors for each row required by that last-layer block, including the seed's own earlier state. Construct dependencies backwards, using "}
                      <code>
                        {"[1, 2]"}
                      </code>
                      {", then reverse the constructed block list to compute forwards. A list described as "}
                      <strong>
                        {"outward hops"}
                      </strong>
                      {" and a list described as "}
                      <strong>
                        {"forward layers"}
                      </strong>
                      {" have opposite conventions here; always name the convention."}
                    </Prose>
                    <Prose>
                      {"The complete program's fixed example has global scalar features "}
                      <code>
                        {"[1, 3, 5, 9]"}
                      </code>
                      {" and directed edges "}
                      <code>
                        {"0→1, 1→2, 2→1, 3→2, 1→0, 2→3"}
                      </code>
                      {". With seed ID 1, forward-layer fanouts "}
                      <code>
                        {"[2, 1]"}
                      </code>
                      {" and random seed 7, the first block's source IDs are "}
                      <code>
                        {"[1, 2, 0, 3]"}
                      </code>
                      {", its target IDs are "}
                      <code>
                        {"[1, 2]"}
                      </code>
                      {", and its local edges are "}
                      <code>
                        {"2→0, 1→0, 0→1, 3→1"}
                      </code>
                      {". The second block has source IDs "}
                      <code>
                        {"[1, 2]"}
                      </code>
                      {", target IDs "}
                      <code>
                        {"[1]"}
                      </code>
                      {" and edge "}
                      <code>
                        {"1→0"}
                      </code>
                      {"."}
                    </Prose>
                    <Prose>
                      {"In the first layer, both output channels use own coefficient 0.5, neighbor coefficient 0.25 and zero bias. Global node 1 reads donor values 1 and 5: its own contribution is "}
                      <code>
                        {"0.5 × 3 = 1.5"}
                      </code>
                      {", its neighbor contribution is "}
                      <code>
                        {"0.25 × 3 = 0.75"}
                      </code>
                      {", and each hidden channel becomes 2.25. Global node 2 reads 3 and 9, giving "}
                      <code>
                        {"0.5 × 5 + 0.25 × 6 = 4"}
                      </code>
                      {" per channel. ReLU leaves these positive values unchanged. In the second layer, summing the two own channels with coefficient 0.5 gives 2.25, and reading the two donor channels with coefficient 0.25 gives 2. The seed's final scalar is 4.25."}
                    </Prose>
                    <Prose>
                      {"The reduction is the same mean GraphSAGE operation taught in §4. Only the indexing domain and required rows change:"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"\\bar h_i=\\frac{\\sum_{(j\\to i)\\in E_{\\rm sampled}}h_j}\n{\\max(1,\\text{number of sampled incoming occurrences for }i)},\n\\qquad\nh'_i=W_{\\rm neighbor}\\bar h_i+b+W_{\\rm own}h_i."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"The declared empty-neighbor summary is zero. It does not erase the own projection or bias. Self-loops are not silently inserted into the neighbor mean. For a fixed sampled block, gather and reduction cost "}
                      <code>
                        {"O(E_block × d_in)"}
                      </code>
                      {", plus the two projections' costs. Source tables are built once per sampled calculation rather than repeatedly constructing a dense "}
                      <code>
                        {"N × N"}
                      </code>
                      {" adjacency. This small Python sampler makes the mechanism inspectable; a compiled sampler and fused kernels may be preferable for a large real graph."}
                    </Prose>
                    <Prose>
                      {"Save "}
                      <code>
                        {"message-passing-operators.py"}
                      </code>
                      {" beside "}
                      <code>
                        {"graph-sampling-batching.py"}
                      </code>
                      {": the latter imports the exact earlier "}
                      <code>
                        {"SparseMeanSage"}
                      </code>
                      {" parameters and changes their scheduling rather than rewriting the learned layer. The core forward route is:"}
                    </Prose>
                    <CodeBlock language="python" filename="sampled-block-forward.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"blocks = sample_blocks(incoming_index(edge_index, len(features)),\n                       seeds=[1], layer_fanouts=[2, 1], seed=7)\nseed_logits = run_sampled_sage(features, blocks, layers)\n# This constructed binary target belongs to seed global ID 1 only.\nseed_targets = features.new_tensor([[1.]])\nloss = F.binary_cross_entropy_with_logits(seed_logits, seed_targets)\nloss.backward()"}
                    </CodeBlock>
                    <Prose>
                      {"The loss is "}
                      <code>
                        {"softplus(−4.25) ≈ 0.01416346"}
                      </code>
                      {". Only seed labels enter this loss. Context nodes provide permitted inputs and intermediates, not extra labeled targets. The complete file includes all sampler, block, reduction and batching functions and a runnable "}
                      <code>
                        {"main"}
                      </code>
                      {"; no hidden dataset download or fitting step supplies this example."}
                    </Prose>
                    <Prose>
                      {"For the "}
                      <strong>
                        {"same fixed blocks"}
                      </strong>
                      {", ordinary PyG "}
                      <code>
                        {"SAGEConv"}
                      </code>
                      {" accepts "}
                      <code>
                        {"(source_features, target_features)"}
                      </code>
                      {" and explicit "}
                      <code>
                        {"(source_count, target_count)"}
                      </code>
                      {". "}
                      <code>
                        {"matched_library"}
                      </code>
                      {" from the earlier operator file returns "}
                      <code>
                        {"(layer, parameter_pairs)"}
                      </code>
                      {"; use its first item as the callable layer. Map its "}
                      <code>
                        {"lin_l"}
                      </code>
                      {" weight/bias to the neighbor projection and "}
                      <code>
                        {"lin_r"}
                      </code>
                      {" weight to the own projection. "}
                      <code>
                        {"run_sampled_sage(..., library=True)"}
                      </code>
                      {" invokes these actual bipartite library layers. Forward outputs, input and all mapped parameter gradients, and one SGD update agree on the checked fixed blocks, including empty and repeated incoming lists."}
                    </Prose>
                    <Prose>
                      {"For ordinary large-graph sampling, use PyG's "}
                      <a href={"https://pytorch-geometric.readthedocs.io/en/latest/modules/loader.html#torch_geometric.loader.NeighborLoader"}>
                        {""}
                        <code>
                          {"NeighborLoader"}
                        </code>
                        {""}
                      </a>
                      {" with legal input nodes and outward-hop fanouts. Its returned graph includes a "}
                      <code>
                        {"n_id"}
                      </code>
                      {" local-to-global map and starts with "}
                      <code>
                        {"batch_size"}
                      </code>
                      {" seed rows; apply the supervised loss to those rows. Its union-subgraph representation is not identical to our separate per-layer blocks. Do not claim that both random routes sample the same realization merely because their fanout numbers look alike. The complete file constructs and attempts the actual loader, reporting the missing "}
                      <code>
                        {"pyg-lib"}
                      </code>
                      {"/"}
                      <code>
                        {"torch-sparse"}
                      </code>
                      {" backend in the current executed environment. The offline sampler remains a separately named scratch route, not a silently substituted successful "}
                      <code>
                        {"NeighborLoader"}
                      </code>
                      {" run."}
                    </Prose>
                    <Prose>
                      {"Cache sampled results only under the identity of the graph, legal cutoff, ordered seeds, distribution, fanout convention, random state and feature/model versions that they use. The cache question in §5 applies here too. A cached sample from another prediction time or altered edge list is a different computation. More scalable choices—cluster-based batches, layer-wise or importance sampling, and shared sampled contexts—trade different work and estimator properties; compare their actual target, normalization and eligibility rules rather than treating “sampling” as one interchangeable operation."}
                    </Prose>
                    <H3>
                      {"How can two graphs share a tensor without sharing information?"}
                    </H3>
                    <Prose>
                      {"Concatenate their rows, offset their edges, and retain graph membership for separate readouts."}
                    </Prose>
                    <div data-flow-view="D45">
                      <MessagePassingIndependentBatchLab />
                    </div>
                    <div data-flow-view="D45-retained">
                      <MessagePassingRetainedBatchLab />
                    </div>
                    <Prose>
                      {"Return to the three-paper path, now with features "}
                      <code>
                        {"[1, 3, 5]"}
                      </code>
                      {". Alongside it put an independent two-node graph with features "}
                      <code>
                        {"[8, 2]"}
                      </code>
                      {". The first graph occupies global batch rows 0, 1 and 2; the second occupies rows 3 and 4. Its local edge "}
                      <code>
                        {"0→1"}
                      </code>
                      {" must become "}
                      <code>
                        {"3→4"}
                      </code>
                      {", and its reverse must become "}
                      <code>
                        {"4→3"}
                      </code>
                      {". Add the first graph's node count, 3, to "}
                      <strong>
                        {"both"}
                      </strong>
                      {" endpoints. Membership is "}
                      <code>
                        {"[0, 0, 0, 1, 1]"}
                      </code>
                      {": each row's graph ID, not an input feature learned by the model."}
                    </Prose>
                    <Prose>
                      {"The 5-by-5 adjacency has two diagonal blocks and zero off-block cells. No path can carry graph B's feature into graph A. With own coefficient 1, open-neighbor mean coefficient 1 and bias zero, the path outputs are "}
                      <code>
                        {"[4, 6, 8]"}
                      </code>
                      {" and graph B outputs are "}
                      <code>
                        {"[10, 10]"}
                      </code>
                      {", whether calculated separately or in the correctly offset batch. Graph A's middle receiver adds its own 3 to the mean of 1 and 5, giving 6."}
                    </Prose>
                    <Prose>
                      {"Change graph B's first feature from 8 to 12. Its outputs become "}
                      <code>
                        {"[14, 14]"}
                      </code>
                      {"; graph A stays "}
                      <code>
                        {"[4, 6, 8]"}
                      </code>
                      {". A bad offset of 2 instead of 3 creates a cross-graph edge between batch rows 2 and 3. The declared membership vector cannot repair that wrong message permission. The highlighted off-block cells explain why B can then affect A. A separate adjacent view preserves the earlier two-plus-two-node case and its full feature domain, where a bad offset of 1 instead of 2 crosses the boundary."}
                    </Prose>
                    <Prose>
                      {""}
                      <strong>
                        {"Readout"}
                      </strong>
                      {" converts node states into a graph-level state. A per-graph sum groups rows by the membership vector. Here it gives "}
                      <code>
                        {"[18, 20]"}
                      </code>
                      {"; a per-graph mean gives "}
                      <code>
                        {"[6, 10]"}
                      </code>
                      {". One global mean, "}
                      <code>
                        {"(4 + 6 + 8 + 10 + 10)/5 = 7.6"}
                      </code>
                      {", merges two examples and loses their individual outputs. Empty graphs can retain an explicit slot with zero sum; their mean needs a stated empty-set convention rather than division by zero."}
                    </Prose>
                    <Prose>
                      {"With graph-local layers, the batched operators have the form"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"A_{\\rm batch}=\\operatorname{diag}(A_A,A_B),\\qquad\nX_{\\rm batch}=\\begin{bmatrix}X_A\\\\X_B\\end{bmatrix}."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"“Diagonal” means the two matrices occupy separate blocks, not that only self-loops remain. Local messages never cross blocks. This independence can fail if another operation mixes the examples, such as normalization using statistics over all batch rows. It is a property of the entire computation, not just a correctly drawn adjacency."}
                    </Prose>
                    <Prose>
                      {""}
                      <code>
                        {"batch_independent_graphs"}
                      </code>
                      {" concatenates features once, adds each graph's cumulative offset to its indices, and creates "}
                      <code>
                        {"graph_id"}
                      </code>
                      {" and "}
                      <code>
                        {"ptr"}
                      </code>
                      {". The pointer array stores graph boundaries; for sizes 3 and 2 it is "}
                      <code>
                        {"[0, 3, 5]"}
                      </code>
                      {". "}
                      <code>
                        {"graph_sum_readout"}
                      </code>
                      {" uses "}
                      <code>
                        {"index_add_"}
                      </code>
                      {" to reduce the already calculated node states into one row per graph. The construction costs linear work in the stored rows/edges, avoids padding to the largest graph and leaves original inputs unmodified."}
                    </Prose>
                    <Prose>
                      {"The ordinary route is "}
                      <code>
                        {"Batch.from_data_list([Data(x=..., edge_index=...), ...])"}
                      </code>
                      {". PyG performs the same concatenation and endpoint offsets for these ordinary "}
                      <code>
                        {"Data"}
                      </code>
                      {" objects. Compare the actual "}
                      <code>
                        {"edge_index"}
                      </code>
                      {", "}
                      <code>
                        {"batch"}
                      </code>
                      {" membership and "}
                      <code>
                        {"ptr"}
                      </code>
                      {", not just final predictions. Custom index-like attributes need their own batching rules; never assume a new field inherits the intended meaning from its name. The full program's comparisons exercise unequal sizes, empty slots, separate-versus-batch equality and the deliberate off-by-one bug."}
                    </Prose>
                    <H3>
                      {"Why must a bond stay paired with its atom's message?"}
                    </H3>
                    <Prose>
                      {"Transform each donor using the relationship on its own edge before combining messages."}
                    </Prose>
                    <div data-flow-view="D46">
                      <MessagePassingTypedMessageLab />
                    </div>
                    <div data-flow-view="D46-library">
                      <MessagePassingTypedLibraryFigure />
                    </div>
                    <Prose>
                      {"We now switch applications: papers gave us node features and permissions; a molecular graph additionally has bond information on those permissions. This small arithmetic example uses atom values 1 and 3 and two named bond categories. They are invented scalar features and maps to expose the mechanism, not chemical energies or a fitted molecular predictor."}
                    </Prose>
                    <Prose>
                      {"The first edge's map multiplies its donor by +2. The second edge's map multiplies its donor by −1. Their messages are "}
                      <code>
                        {"2 × 1 = 2"}
                      </code>
                      {" and "}
                      <code>
                        {"−1 × 3 = −3"}
                      </code>
                      {", so the receiver's sum is −1. Swap the category assignments while leaving atom values in place: messages become "}
                      <code>
                        {"−1 × 1 = −1"}
                      </code>
                      {" and "}
                      <code>
                        {"2 × 3 = 6"}
                      </code>
                      {", summing to 5. The atom-value multiset and bond-category multiset are separately unchanged. What changed was their "}
                      <strong>
                        {"association"}
                      </strong>
                      {". Separately summing atom values and bond categories would erase that association before it could be used."}
                    </Prose>
                    <Prose>
                      {"Give every relation category "}
                      <code>
                        {"r"}
                      </code>
                      {" a matrix "}
                      <code>
                        {"W_r"}
                      </code>
                      {". For donor vector "}
                      <code>
                        {"h_j"}
                      </code>
                      {" and edge category "}
                      <code>
                        {"r_{ji}"}
                      </code>
                      {", the paired message and sum are"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"m_{j\\to i}=W_{r_{ji}}h_j,\\qquad\n\\bar m_i=\\sum_{j\\to i}m_{j\\to i}."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {"The edge chooses a map; the donor supplies its input. Matrix dimensions are "}
                      <code>
                        {"output_channels × input_channels"}
                      </code>
                      {". The sum is invariant to reordering the paired edges, but swapping edge categories across unequal donors can change it. Missing input edges supply no message. A model can also condition a message on both endpoints or generate a matrix from a continuous edge feature instead of using a finite category lookup. That is the wider message/aggregate/update formulation introduced by "}
                      <a href={"https://arxiv.org/html/1704.01212v2"}>
                        {"Gilmer and colleagues"}
                      </a>
                      {"; it does not make every chosen molecular representation scientifically adequate."}
                    </Prose>
                    <Prose>
                      {""}
                      <code>
                        {"typed_message_sum"}
                      </code>
                      {" gathers the map for each edge's "}
                      <code>
                        {"relation_ids"}
                      </code>
                      {", multiplies it by that edge's donor feature with "}
                      <code>
                        {"bmm"}
                      </code>
                      {", then reduces by receiver. Autograd updates the selected maps and donor features through the paired products. The gathered-map implementation uses "}
                      <code>
                        {"O(E × d_out × d_in)"}
                      </code>
                      {" temporary map storage; grouping edges by relation can reuse a map and reduce that storage for large finite-relation graphs. The complete file states this cost rather than calling every explicit implementation universally optimal."}
                    </Prose>
                    <Prose>
                      {"The ordinary "}
                      <a href={"https://pytorch-geometric.readthedocs.io/en/latest/generated/torch_geometric.nn.conv.NNConv.html"}>
                        {""}
                        <code>
                          {"NNConv"}
                        </code>
                        {""}
                      </a>
                      {" route uses an edge network to generate each message matrix. Our "}
                      <code>
                        {"ordinary_typed_layer"}
                      </code>
                      {" generates exactly these finite maps from one-hot relation attributes, with add aggregation, no automatic own map and no bias. PyG stores the generated matrix as "}
                      <code>
                        {"input × output"}
                      </code>
                      {", so we transpose the scratch map's channel convention when assigning the edge-network weights. Assign those weights "}
                      <strong>
                        {"after"}
                      </strong>
                      {" constructing NNConv: its constructor resets the supplied edge network. A non-square map comparison is important: scalar maps hide a transposition error. The matched forward, gradient, update and node-renaming checks cover that actual library route and empty edge support."}
                    </Prose>
                    <Prose>
                      {"The "}
                      <strong>
                        {"readout target"}
                      </strong>
                      {" also matters. Summing per-atom contributions can represent an "}
                      <strong>
                        {"extensive"}
                      </strong>
                      {" quantity, meaning one that adds over independent copies under the model's stated assumption. Duplicating a disconnected molecule then doubles its sum. A per-atom mean stays the same under whole duplication and fits a different kind of target. Physical energy additivity requires that neglected interactions really are negligible; a disconnected drawing does not prove that. Coordinates, distances, rotations, directional quantities and force consistency add further constraints. The next geometric lesson will draw and implement those constraints rather than attach unexplained coordinates to this scalar toy."}
                    </Prose>
                    <H3>
                      {"Which program edge represents syntax, and which represents a value dependency?"}
                    </H3>
                    <Prose>
                      {"Separate the written expression's tree from the path along which an earlier definition supplies a later use."}
                    </Prose>
                    <div data-flow-view="D47">
                      <MessagePassingProgramTransportLab />
                    </div>
                    <Prose>
                      {"The next application changes what a node means. Consider this four-assignment program:"}
                    </Prose>
                    <CodeBlock language="python" filename="typed-program-example.py" title="Explained excerpt; use the linked complete program for the runnable context">
                      {"a = 2\nb = 3\nc = a + b\nd = 2 * c"}
                    </CodeBlock>
                    <Prose>
                      {"A "}
                      <strong>
                        {"syntax tree"}
                      </strong>
                      {" describes how an expression is written. The "}
                      <code>
                        {"+"}
                      </code>
                      {" operator has operand uses "}
                      <code>
                        {"a"}
                      </code>
                      {" and "}
                      <code>
                        {"b"}
                      </code>
                      {"; the "}
                      <code>
                        {"*"}
                      </code>
                      {" operator has a literal 2 and a use of "}
                      <code>
                        {"c"}
                      </code>
                      {". A "}
                      <strong>
                        {"definition-use edge"}
                      </strong>
                      {" connects the assignment that defines a value to a later expression that uses it. Definitions of "}
                      <code>
                        {"a"}
                      </code>
                      {" and "}
                      <code>
                        {"b"}
                      </code>
                      {" supply "}
                      <code>
                        {"c"}
                      </code>
                      {"; the definition of "}
                      <code>
                        {"c"}
                      </code>
                      {" supplies "}
                      <code>
                        {"d"}
                      </code>
                      {". These are different relations. Text positions alone do not say which earlier definition a use refers to."}
                    </Prose>
                    <Prose>
                      {"Execute the arithmetic by hand first: "}
                      <code>
                        {"a = 2"}
                      </code>
                      {", "}
                      <code>
                        {"b = 3"}
                      </code>
                      {", then "}
                      <code>
                        {"c = 2 + 3 = 5"}
                      </code>
                      {", then "}
                      <code>
                        {"d = 2 × 5 = 10"}
                      </code>
                      {". Changing "}
                      <code>
                        {"a"}
                      </code>
                      {" to −2 gives "}
                      <code>
                        {"c = 1"}
                      </code>
                      {" and "}
                      <code>
                        {"d = 2"}
                      </code>
                      {"; changing it to 5 gives "}
                      <code>
                        {"c = 8"}
                      </code>
                      {" and "}
                      <code>
                        {"d = 16"}
                      </code>
                      {". An unrelated comment or unused literal has no value-dependency path into "}
                      <code>
                        {"d"}
                      </code>
                      {". Reversing "}
                      <code>
                        {"a→c"}
                      </code>
                      {" would permit "}
                      <code>
                        {"a"}
                      </code>
                      {" to read "}
                      <code>
                        {"c"}
                      </code>
                      {", which is a different graph computation; a position-independent relation still needs the correct direction."}
                    </Prose>
                    <Prose>
                      {"We can transport these particular additions and scalings with the typed message primitive just taught. Initialize definition-node states "}
                      <code>
                        {"[a, b, 0, 0]"}
                      </code>
                      {". Give "}
                      <code>
                        {"a→c"}
                      </code>
                      {" and "}
                      <code>
                        {"b→c"}
                      </code>
                      {" map +1 and "}
                      <code>
                        {"c→d"}
                      </code>
                      {" map +2. Clamp the supplied input definitions "}
                      <code>
                        {"a"}
                      </code>
                      {" and "}
                      <code>
                        {"b"}
                      </code>
                      {" at each round. After one synchronous round, the states are "}
                      <code>
                        {"[2, 3, 5, 0]"}
                      </code>
                      {": "}
                      <code>
                        {"d"}
                      </code>
                      {" still reads the "}
                      <strong>
                        {"old"}
                      </strong>
                      {" zero at "}
                      <code>
                        {"c"}
                      </code>
                      {". After two, they are "}
                      <code>
                        {"[2, 3, 5, 10]"}
                      </code>
                      {". This is the buffer distinction from §2 in another setting."}
                    </Prose>
                    <Prose>
                      {"For this declared calculation,"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"c^{(\\ell+1)}=a+b,\\qquad d^{(\\ell+1)}=2c^{(\\ell)}."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {""}
                      <code>
                        {"execute_four_assignments"}
                      </code>
                      {" implements the actual stated arithmetic directly. "}
                      <code>
                        {"transport_four_assignments"}
                      </code>
                      {" implements the two-round typed graph schedule using "}
                      <code>
                        {"typed_message_sum"}
                      </code>
                      {" and clamped input rows. They agree on the changed cases above; the derivative of "}
                      <code>
                        {"d"}
                      </code>
                      {" with respect to either input is 2. The two functions teach different responsibilities: an interpreter applies operations with their semantics, while the transport schedule follows explicitly supplied graph relations and coefficients."}
                    </Prose>
                    <Prose>
                      {"A general program adds scope, aliasing, control flow, loops, calls and potentially undecidable static questions. Finding correct relations may require compiler or static-analysis machinery, and a learned graph representation is not automatically an interpreter or proof engine. In a learning task, say whether the target is variable misuse, a program property, similarity or another prediction; preserve legal targets and evaluate on suitable held-out programs. Distinct relation maps can keep syntax, definition-use and control-flow roles separate. Collapsing all those edges into one mean discards a modeling choice before the learner can inspect it."}
                    </Prose>
                    <H3>
                      {"Which road reading is available at the prediction time?"}
                    </H3>
                    <Prose>
                      {"Draw spatial permission and time permission separately, then compose only the permitted readings."}
                    </Prose>
                    <div data-flow-view="D48">
                      <MessagePassingTrafficBoundaryLab />
                    </div>
                    <Prose>
                      {"Finally we switch to traffic sensors. A, B and C are sensor identities, and "}
                      <code>
                        {"A→B→C"}
                      </code>
                      {" denotes the allowed downstream message direction. Time is a separate axis: each sensor has readings at "}
                      <code>
                        {"t₀"}
                      </code>
                      {" and "}
                      <code>
                        {"t₁"}
                      </code>
                      {", and we issue a prediction after "}
                      <code>
                        {"t₁"}
                      </code>
                      {" for a target at "}
                      <code>
                        {"t₂"}
                      </code>
                      {". Arrows on the road say "}
                      <strong>
                        {"which sensor"}
                      </strong>
                      {" may supply information; a time arrow says "}
                      <strong>
                        {"when a reading exists"}
                      </strong>
                      {". Reversing one does not reverse the other."}
                    </Prose>
                    <Prose>
                      {"Use constructed readings in vehicles per minute: A has "}
                      <code>
                        {"[4, 6]"}
                      </code>
                      {", B has "}
                      <code>
                        {"[8, 10]"}
                      </code>
                      {", and C has "}
                      <code>
                        {"[12, 14]"}
                      </code>
                      {" at "}
                      <code>
                        {"t₀/t₁"}
                      </code>
                      {". A deliberately simple local rule for B combines B's current reading 10 with A's lagged reading 4, each with weight 0.5. Its output is "}
                      <code>
                        {"0.5 × 10 + 0.5 × 4 = 7"}
                      </code>
                      {" vehicles per minute. The rule is specified by us, not learned from observed traffic. Changing A's lagged reading to 12 moves the output to 11. Changing a future target does not change the legal output, because that target is not an input."}
                    </Prose>
                    <Prose>
                      {"In the reversed chain "}
                      <code>
                        {"C→B→A"}
                      </code>
                      {", the upstream source for B is C. Its lagged reading 12 gives "}
                      <code>
                        {"0.5 × 10 + 0.5 × 12 = 11"}
                      </code>
                      {". The direction control changes the permitted source explicitly; it does not take a symmetric normalized average over both road neighbors. In notation, with upstream source "}
                      <code>
                        {"u"}
                      </code>
                      {", the declared rule is"}
                    </Prose>
                    <div className="neural-equation">
                      <MathBlock>
                        {"\\widehat y_{B,t_2}=\\tfrac12 x_{B,t_1}+\\tfrac12 x_{u,t_0}."}
                      </MathBlock>
                    </div>
                    <Prose>
                      {""}
                      <code>
                        {"traffic_rule"}
                      </code>
                      {" receives only a sensor-by-two-time history table. The future target has no argument through which to enter. A real pipeline must also fit preprocessing on the permitted training history, respect delayed availability and evaluate on later time intervals, as §5 explained. Excluding a future-label column while using a degree, normalization statistic or lag that was computed with future information still leaks."}
                    </Prose>
                    <Prose>
                      {"A trainable spatiotemporal model can first encode each sensor's history with the exact recurrent cell from "}
                      <a href={"/learn/path/full-curriculum/rnns-lstms-grus?module=deep-learning-fundamentals"}>
                        {"RNNs, LSTMs & GRUs"}
                      </a>
                      {", then propagate those history states along the legal directed graph—or interleave temporal and spatial updates under an explicit schedule. Reuse its explained recurrence rather than introduce a second unexplained implementation. What changes here is the sensor graph, history alignment, message permission and forecasting target. Such a composition needs its own fitted experiment; this two-time arithmetic example does not supply one."}
                    </Prose>
                    <Prose>
                      {"Across papers, molecules, programs and sensors, the common operation remains a receiver reading permitted messages, aggregating them and updating a representation. The application determines what the nodes and edges mean, which information is available, what must stay paired, and what the output should preserve. Practice now asks you to change those decisions and explain their consequences, rather than merely reproduce a favorable graph plot."}
                    </Prose>
                    <RemoteCodeBlock source="/learn-code/message-passing-graph-convolutions-gcn-gat-graphsage/graph-sampling-batching.py" filename="graph-sampling-batching.py" language="python" />
                    <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">
                      <H2>
                        {"10. Practice with changed examples"}
                      </H2>
                      <Prose>
                        {"Use the first five tasks to check the core route. The later tasks exercise variants and deeper limits. Each prompt is visible; hints and worked feedback are separate so you can attempt the task independently. The labs remain live throughout and require no submitted guess."}
                      </Prose>
                      <div className="lesson-exercise" data-lesson-exercise="">
                        <H3>
                          {"1. Compute a new GCN read — core"}
                        </H3>
                        <Prose>
                          {"Keep the self-loop three-node path, degrees "}
                          <code>
                            {"[2, 3, 2]"}
                          </code>
                          {", scalar projection 1 and bias zero, but change the features to "}
                          <code>
                            {"[2, 0, 3]"}
                          </code>
                          {". Calculate all three outputs. Can node 2's input affect node 0 after this one round? Explain the smallest change of depth that permits that influence."}
                        </Prose>
                        <details>
                          <summary>Hint</summary>
                          <Prose>
                            {"The endpoint's own coefficient is 1/2, the middle's own coefficient is 1/3, and each path-edge coefficient is 1/√6. Follow permissions before multiplying."}
                          </Prose>
                        </details>
                        <details>
                          <summary>Solution and reasoning</summary>
                          <Prose>
                            {"Node 0 receives "}
                            <code>
                              {"2/2 + 0/√6 = 1"}
                            </code>
                            {". Node 1 receives "}
                            <code>
                              {"2/√6 + 0/3 + 3/√6 = 5/√6 ≈ 2.041241"}
                            </code>
                            {". Node 2 receives "}
                            <code>
                              {"0/√6 + 3/2 = 1.5"}
                            </code>
                            {". A change at node 2 has no permitted one-round route into node 0. Two rounds allow the path "}
                            <code>
                              {"2→1→0"}
                            </code>
                            {", with coefficient "}
                            <code>
                              {"(1/√6)² = 1/6"}
                            </code>
                            {" for this fixed scalar linear operator. That second-round influence does not mean the first-round diagram had a hidden direct edge. With a nonlinear update, trace its local derivatives too rather than automatically reusing the linear coefficient."}
                          </Prose>
                        </details>
                      </div>
                      <div className="lesson-exercise" data-lesson-exercise="">
                        <H3>
                          {"2. Find an order-dependent bug — core"}
                        </H3>
                        <Prose>
                          {"Two connected nodes start at "}
                          <code>
                            {"[1, 3]"}
                          </code>
                          {". Each new state should average its old own value and its old neighbor's value. Calculate one synchronized round and an in-place loop that updates node 0 first. Reverse the faulty loop and repair the algorithm."}
                        </Prose>
                        <details>
                          <summary>Hint</summary>
                          <Prose>
                            {"Write a separate old-state row next to every read. Ask whether either row has already changed."}
                          </Prose>
                        </details>
                        <details>
                          <summary>Solution and reasoning</summary>
                          <Prose>
                            {"The synchronized result is "}
                            <code>
                              {"[2, 2]"}
                            </code>
                            {". Updating node 0 in place first makes it 2, then node 1 reads that new 2 and becomes "}
                            <code>
                              {"(3 + 2)/2 = 2.5"}
                            </code>
                            {". The faulty result is "}
                            <code>
                              {"[2, 2.5]"}
                            </code>
                            {". Reversing the loop first makes node 1 equal 2, then node 0 becomes "}
                            <code>
                              {"(1 + 2)/2 = 1.5"}
                            </code>
                            {", giving "}
                            <code>
                              {"[1.5, 2]"}
                            </code>
                            {". Use an unchanged source tensor and a separate next-state tensor or a single gather/reduction expression. Merely choosing a repeatable node order hides the defect without restoring the intended operation."}
                          </Prose>
                        </details>
                      </div>
                      <div className="lesson-exercise" data-lesson-exercise="">
                        <H3>
                          {"3. Separate own and neighbor information — core"}
                        </H3>
                        <Prose>
                          {"A mean GraphSAGE receiver has own value 2, neighbors "}
                          <code>
                            {"[0, 4, 8]"}
                          </code>
                          {", own coefficient 3 and neighbor coefficient −1, with no bias or activation. Find its output. Duplicate every neighbor once; then duplicate only the donor with value 8. Compare with sum aggregation for whole duplication."}
                        </Prose>
                        <details>
                          <summary>Hint</summary>
                          <Prose>
                            {"Keep the own branch at "}
                            <code>
                              {"3 × 2"}
                            </code>
                            {". Count all occurrences in the neighbor mean."}
                          </Prose>
                        </details>
                        <details>
                          <summary>Solution and reasoning</summary>
                          <Prose>
                            {"The original neighbor mean is 4, so the output is "}
                            <code>
                              {"6 − 4 = 2"}
                            </code>
                            {". Whole duplication preserves the mean and output. Duplicating only 8 gives "}
                            <code>
                              {"[0, 4, 8, 8]"}
                            </code>
                            {", mean 5 and output 1. Sum aggregation gives "}
                            <code>
                              {"6 − 12 = −6"}
                            </code>
                            {" originally and "}
                            <code>
                              {"6 − 24 = −18"}
                            </code>
                            {" after whole duplication. Decide whether counts, proportions or the strongest message matter for the target before choosing a reducer. “Mean ignores duplicates” is too broad: it ignores a uniform whole-multiset repetition, not every multiplicity change."}
                          </Prose>
                        </details>
                      </div>
                      <div className="lesson-exercise" data-lesson-exercise="">
                        <H3>
                          {"4. Describe a valid information boundary — core"}
                        </H3>
                        <Prose>
                          {"You predict tomorrow's citations. A colleague builds message edges and degree features from the graph after tomorrow, then masks tomorrow's labels out of the loss. Identify both leakage routes and describe a valid graph, feature, cache and evaluation policy."}
                        </Prose>
                        <details>
                          <summary>Hint</summary>
                          <Prose>
                            {"An edge can enter through a message permission or a graph-derived number even when its label never enters the loss."}
                          </Prose>
                        </details>
                        <details>
                          <summary>Solution and reasoning</summary>
                          <Prose>
                            {"Tomorrow's relationships leak through the message graph and through degree features. Construct both from information actually available at the issue time. Fit any preprocessing using the permitted training information, and key graph normalizers/samples by that same cutoff and graph identity. Hold target edges out of message and graph-feature construction; define eligible negative candidates and availability consistently. Evaluate on later time intervals under the same availability rule. A loss mask controls which labels are scored; it does not control how inputs were made. If publication or sensor readings arrive late, their actual availability may lag their nominal timestamps."}
                          </Prose>
                        </details>
                      </div>
                      <div className="lesson-exercise" data-lesson-exercise="">
                        <H3>
                          {"5. Interpret the real study — core"}
                        </H3>
                        <Prose>
                          {"The displayed GCN fits 10/10 fit labels but scores 8/18 on assessment; label propagation scores 16/18. Does this prove that graphs are useless, GCN is always worse, or the code must be broken? State one supported conclusion and a disciplined next experiment. Would deleting message edges while keeping degree/clustering features remove all graph information?"}
                        </Prose>
                        <details>
                          <summary>Hint</summary>
                          <Prose>
                            {"Separate this model, features, graph and small split from a claim about a whole method family."}
                          </Prose>
                        </details>
                        <details>
                          <summary>Solution and reasoning</summary>
                          <Prose>
                            {"This fitted GCN under this fixed structural-feature protocol generalizes poorly to the shown held-out labels. Label propagation is a graph-based alternative that performed better here, so “graphs are useless” does not follow. Fitting every training label is not evidence of generalization; poor assessment accuracy alone is not proof of a numerical bug. Inspect errors, verify the exact operator on an independent small case, and formulate a changed hypothesis about useful features or information flow. Evaluate it on suitable new independent data or a predeclared repeated-split protocol, rather than repeatedly selecting against these already inspected assessment labels. Keeping degree/clustering features after deleting message edges retains graph-derived information. That intervention isolates a changed propagation path under fixed features, not the removal of every structural signal."}
                          </Prose>
                        </details>
                      </div>
                      <div className="lesson-exercise" data-lesson-exercise="">
                        <H3>
                          {"6. Fix a misleading sum claim — deeper"}
                        </H3>
                        <Prose>
                          {"The donor lists "}
                          <code>
                            {"[0, 4]"}
                          </code>
                          {" and "}
                          <code>
                            {"[1, 3]"}
                          </code>
                          {" both sum to 4. Can any deterministic MLP that sees only that sum distinguish them? Apply the per-donor map "}
                          <code>
                            {"φ(x) = [x, x²]"}
                          </code>
                          {" and find the new summed rows. Then check "}
                          <code>
                            {"[1, 1, 4]"}
                          </code>
                          {" against "}
                          <code>
                            {"[0, 3, 3]"}
                          </code>
                          {" before claiming universal injectivity."}
                        </Prose>
                        <details>
                          <summary>Hint</summary>
                          <Prose>
                            {"Make the distinction before reduction. A richer representation can fix one collision and still have another."}
                          </Prose>
                        </details>
                        <details>
                          <summary>Solution and reasoning</summary>
                          <Prose>
                            {"An MLP of the same raw input 4 returns the same result. The lifted pair sums are "}
                            <code>
                              {"[4, 16]"}
                            </code>
                            {" and "}
                            <code>
                              {"[4, 10]"}
                            </code>
                            {", so this two-coordinate map distinguishes the first two lists. For the second pair, both lifted sums are "}
                            <code>
                              {"[6, 18]"}
                            </code>
                            {": "}
                            <code>
                              {"1² + 1² + 4² = 18"}
                            </code>
                            {" and "}
                            <code>
                              {"0² + 3² + 3² = 18"}
                            </code>
                            {". Thus this particular lift is not injective over all allowed multisets. The GIN correspondence needs its stated suitable encoding, bounded/countable-domain and readout assumptions; it is not a theorem that every learned real-valued raw sum retains every distinction."}
                          </Prose>
                        </details>
                      </div>
                      <div className="lesson-exercise" data-lesson-exercise="">
                        <H3>
                          {"7. Which coordinates become constant? — deeper"}
                        </H3>
                        <Prose>
                          {"The connected self-loop path has degrees "}
                          <code>
                            {"[2, 3, 2]"}
                          </code>
                          {". A report says repeated fixed symmetric propagation makes its raw values equal. Correct the claim. Give a two-node counterexample without loops, and explain why neither result automatically predicts a trained nonlinear network."}
                        </Prose>
                        <details>
                          <summary>Hint</summary>
                          <Prose>
                            {"The eigenvector fixed by "}
                            <code>
                              {"S"}
                            </code>
                            {" is "}
                            <code>
                              {"√d"}
                            </code>
                            {". Contrast it with a matrix that swaps two entries."}
                          </Prose>
                        </details>
                        <details>
                          <summary>Solution and reasoning</summary>
                          <Prose>
                            {"Under the connected fixed operator and convergence conditions in §7, the limiting row is proportional to "}
                            <code>
                              {"[√2, √3, √2]"}
                            </code>
                            {", with scale set by the input's projection onto that mode. Divide by "}
                            <code>
                              {"√d"}
                            </code>
                            {" to obtain a constant in the converted random-walk coordinate. Raw endpoints and middle need not agree. A two-node loop-free edge has operator "}
                            <code>
                              {"[[0,1],[1,0]]"}
                            </code>
                            {"; it alternates "}
                            <code>
                              {"[1,0]"}
                            </code>
                            {" and "}
                            <code>
                              {"[0,1]"}
                            </code>
                            {" instead of converging. Its −1 mode preserves magnitude while changing sign. Learned channel maps, activations and graph-dependent gates change the evolution; an argument about fixed "}
                            <code>
                              {"S^ℓ"}
                            </code>
                            {" cannot silently replace analysis of those operations."}
                          </Prose>
                        </details>
                      </div>
                      <div className="lesson-exercise" data-lesson-exercise="">
                        <H3>
                          {"8. Count sampling and test batch independence — deeper"}
                        </H3>
                        <Prose>
                          {"A seed requests four first-hop neighbor occurrences and each requests three more. Give the uncapped occurrence count including the seed. On the four-ID cyclic graph, what changes without replacement? Describe a two-graph mutation check that detects accidental cross-graph edges."}
                        </Prose>
                        <details>
                          <summary>Hint</summary>
                          <Prose>
                            {"Count levels separately, then distinguish requested occurrences from unique IDs and available donors."}
                          </Prose>
                        </details>
                        <details>
                          <summary>Solution and reasoning</summary>
                          <Prose>
                            {"The bound is "}
                            <code>
                              {"1 + 4 + 4 × 3 = 17"}
                            </code>
                            {". There may be far fewer distinct nodes. Without replacement on this particular four-ID no-self graph, each parent has only three candidates, giving "}
                            <code>
                              {"1 + 3 + 3 × 3 = 13"}
                            </code>
                            {". This neighbor-tree count is not automatically the full block implementation's storage, because own-state dependencies also have to be retained. For batching, compare each graph's standalone output with its batch slice, then change only graph B's features and check that graph A remains fixed under a local graph-independent model. Verify both endpoint offsets, membership/readout and any normalization that could couple the examples. A membership label alone cannot stop a wrongly stored edge from carrying a message."}
                          </Prose>
                        </details>
                      </div>
                      <div className="lesson-exercise" data-lesson-exercise="">
                        <H3>
                          {"9. Find where pooling must occur — deeper"}
                        </H3>
                        <Prose>
                          {"Donors are "}
                          <code>
                            {"[-3, 2]"}
                          </code>
                          {". Transform each donor to "}
                          <code>
                            {"[ReLU(x), ReLU(−x)]"}
                          </code>
                          {", then take coordinatewise max. Compare with taking raw max first and transforming only that result. Give a changed example where those two routes happen to agree, and explain why it does not justify swapping them generally."}
                        </Prose>
                        <details>
                          <summary>Hint</summary>
                          <Prose>
                            {"Draw one row per donor and two transformed columns before selecting maxima."}
                          </Prose>
                        </details>
                        <details>
                          <summary>Solution and reasoning</summary>
                          <Prose>
                            {"The transformed rows are "}
                            <code>
                              {"[0,3]"}
                            </code>
                            {" and "}
                            <code>
                              {"[2,0]"}
                            </code>
                            {", so the correct pooled row is "}
                            <code>
                              {"[2,3]"}
                            </code>
                            {". Raw max first gives 2, which transforms to "}
                            <code>
                              {"[2,0]"}
                            </code>
                            {"; it has lost the negative donor's contribution to the second channel. With donors "}
                            <code>
                              {"[1,4]"}
                            </code>
                            {", the rows are "}
                            <code>
                              {"[1,0]"}
                            </code>
                            {" and "}
                            <code>
                              {"[4,0]"}
                            </code>
                            {", and both routes give "}
                            <code>
                              {"[4,0]"}
                            </code>
                            {". Agreement in that restricted positive case does not establish equality for mixed signs. In the original mixed-sign calculation, the first channel's non-tied selected derivative reaches donor 2 and the second reaches donor −3. This is why both forward values and the routing of gradients need checking when changing aggregation order."}
                          </Prose>
                        </details>
                      </div>
                      <div className="lesson-exercise" data-lesson-exercise="">
                        <H3>
                          {"10. Recompute a coupled GATv2 receiver — deeper"}
                        </H3>
                        <Prose>
                          {"Use §4's scalar receiver "}
                          <code>
                            {"r"}
                          </code>
                          {", senders "}
                          <code>
                            {"k = −1, +1"}
                          </code>
                          {", receiver projection "}
                          <code>
                            {"[r,−r]"}
                          </code>
                          {", sender projection "}
                          <code>
                            {"[−k,k]"}
                          </code>
                          {", LeakyReLU slope 0.2 and score vector "}
                          <code>
                            {"[−1.25,−1.25]"}
                          </code>
                          {", with no loops or output bias. First calculate receiver 0. Then change it to +0.5 and compute scores, shares and the two-channel weighted output. Why is changing just the displayed softmax share insufficient as a model edit?"}
                        </Prose>
                        <details>
                          <summary>Hint</summary>
                          <Prose>
                            {"The stated projections give score "}
                            <code>
                              {"−|r−k|"}
                            </code>
                            {". Keep each sender's projected value paired with its share."}
                          </Prose>
                        </details>
                        <details>
                          <summary>Solution and reasoning</summary>
                          <Prose>
                            {"At receiver 0 both scores are −1, both shares are 0.5, and projected sender values "}
                            <code>
                              {"[1,−1]"}
                            </code>
                            {" and "}
                            <code>
                              {"[−1,1]"}
                            </code>
                            {" average to "}
                            <code>
                              {"[0,0]"}
                            </code>
                            {". At receiver +0.5, scores are "}
                            <code>
                              {"[−1.5,−0.5]"}
                            </code>
                            {"; their softmax is approximately "}
                            <code>
                              {"[0.268941421,0.731058579]"}
                            </code>
                            {". The output is "}
                            <code>
                              {"[−0.462117157,0.462117157]"}
                            </code>
                            {". Every number follows from the changed receiver through projection, coordinate nonlinearity and final score. A free share edit can illustrate the weighted-sum stage, but it need not be attainable under the declared features and parameters. For receiver −0.5 the ranks and mixture reverse, giving "}
                            <code>
                              {"[+0.462117157,−0.462117157]"}
                            </code>
                            {"; this changed case contrasts with original GAT's fixed per-head ordering over a common candidate set."}
                          </Prose>
                        </details>
                      </div>
                      <div className="lesson-exercise" data-lesson-exercise="">
                        <H3>
                          {"11. Diagnose compensation and whitening limits — deeper"}
                        </H3>
                        <Prose>
                          {"Two orthonormal node modes are carried in separate feature channels. One propagation has gains 1 and 0.5. Find the right channel map that restores both after one round. What fails when the second gain is zero? For a mixed representation with singular values 1 and 0.5, compute the squared output singular values after ridge whitening with "}
                          <code>
                            {"ρ = 0.001"}
                          </code>
                          {"."}
                        </Prose>
                        <details>
                          <summary>Hint</summary>
                          <Prose>
                            {"Invert only a retained nonzero mode. Ridge whitening divides a singular value by "}
                            <code>
                              {"√(σ²+ρ)"}
                            </code>
                            {"."}
                          </Prose>
                        </details>
                        <details>
                          <summary>Solution and reasoning</summary>
                          <Prose>
                            {"The propagating channel amplitudes become "}
                            <code>
                              {"[1,0.5]"}
                            </code>
                            {", so right multiplication by "}
                            <code>
                              {"diag(1,2)"}
                            </code>
                            {" restores them in this separated two-mode representation. At zero gain, that mode is absent; right multiplication cannot increase matrix rank or infer its lost coefficient. For ridge whitening the squared amplitudes are "}
                            <code>
                              {"1/1.001 ≈ 0.999000999"}
                            </code>
                            {" and "}
                            <code>
                              {"0.25/0.251 ≈ 0.996015936"}
                            </code>
                            {", not exactly 1. A regularized Gram is invertible without making erased information reappear. Exact unregularized whitening reaches identity only on its retained full-rank supported subspace under the stated numerical threshold. Scaling, low variation and lost rank are different diagnoses, as the depth/energy table in §7 showed."}
                          </Prose>
                        </details>
                      </div>
                      <div className="lesson-exercise" data-lesson-exercise="">
                        <H3>
                          {"12. Trace a finite useful route — deeper"}
                        </H3>
                        <Prose>
                          {"In §7's two-round example, useful signal 2 takes two gates of "}
                          <code>
                            {"1−ε"}
                          </code>
                          {", and distraction 7 takes one gate "}
                          <code>
                            {"ε"}
                          </code>
                          {" followed by "}
                          <code>
                            {"1−ε"}
                          </code>
                          {". Compute the receiver's value at "}
                          <code>
                            {"ε = 0.01"}
                          </code>
                          {". Compare with perfect exclusion and explain why this is not a reproduced trained Adaptive Message Passing result."}
                        </Prose>
                        <details>
                          <summary>Hint</summary>
                          <Prose>
                            {"Multiply gate factors along each path before adding its contribution."}
                          </Prose>
                        </details>
                        <details>
                          <summary>Solution and reasoning</summary>
                          <Prose>
                            {"The output is "}
                            <code>
                              {"2(1−ε)² + 7ε(1−ε)"}
                            </code>
                            {". At 0.01 it is "}
                            <code>
                              {"2 × 0.9801 + 7 × 0.0099 = 1.9602 + 0.0693 = 2.0295"}
                            </code>
                            {". At zero it is exactly 2: the nuisance route is cut while the useful route remains. A gate that rejects the useful intermediate also loses signal; gate magnitude alone does not reveal whether filtering helps. This is a constructed finite-path calculation with supplied coefficients. The paper learns message filtering and depth under its variational objective; our arithmetic does not execute that training or establish its benchmark results."}
                          </Prose>
                        </details>
                      </div>
                      <div className="lesson-exercise" data-lesson-exercise="">
                        <H3>
                          {"13. Build and audit a new edge-conditioned operation — practical transfer"}
                        </H3>
                        <Prose>
                          {"Use scalar features "}
                          <code>
                            {"[2,−1,4]"}
                          </code>
                          {", directed edges "}
                          <code>
                            {"0→1, 2→1, 1→2"}
                          </code>
                          {", relation IDs "}
                          <code>
                            {"[0,1,0]"}
                          </code>
                          {", maps "}
                          <code>
                            {"W₀ = +2"}
                          </code>
                          {" and "}
                          <code>
                            {"W₁ = −1"}
                          </code>
                          {", and no own map or bias. Implement paired messages and receiver sums. Hand-check the outputs and a loss equal to their sum. Compare scratch and ordinary NNConv gradients, rename nodes, and define a legal information boundary for a real task using such relations."}
                        </Prose>
                        <details>
                          <summary>Hint</summary>
                          <Prose>
                            {"Do not sum relation categories independently of their donors. At an isolated receiver the declared aggregate is zero. Rename the feature rows and both edge endpoints together."}
                          </Prose>
                        </details>
                        <details>
                          <summary>Solution and evaluation criteria</summary>
                          <Prose>
                            {"Messages are "}
                            <code>
                              {"+2 × 2 = 4"}
                            </code>
                            {" into node 1, "}
                            <code>
                              {"−1 × 4 = −4"}
                            </code>
                            {" into node 1, and "}
                            <code>
                              {"+2 × (−1) = −2"}
                            </code>
                            {" into node 2. The output is "}
                            <code>
                              {"[0,0,−2]"}
                            </code>
                            {". For loss equal to the sum of output rows, input gradients are "}
                            <code>
                              {"[2,2,−1]"}
                            </code>
                            {": each sender's derivative uses its paired edge map. The derivative with respect to "}
                            <code>
                              {"W₀"}
                            </code>
                            {" is "}
                            <code>
                              {"2 + (−1) = 1"}
                            </code>
                            {", and with respect to "}
                            <code>
                              {"W₁"}
                            </code>
                            {" it is 4. "}
                            <code>
                              {"typed_message_sum"}
                            </code>
                            {" and "}
                            <code>
                              {"ordinary_typed_layer"}
                            </code>
                            {" supply two explained implementation routes. Assign mapped weights after constructing NNConv because its constructor resets the supplied edge network; with a multi-channel map also check the input/output transpose convention."}
                          </Prose>
                          <Prose>
                            {"A successful node-renaming test permutes the outputs in exactly the same way and preserves graph-sum readout, after features, endpoints and any node targets are renamed consistently. It does not insert IDs as numeric model inputs. Include an empty-edge case and a changed relation assignment; compare all relevant gradients and one mapped update rather than only a single output."}
                          </Prose>
                          <Prose>
                            {"For a real task, describe each relation's meaning and availability, the prediction unit and target, feature/preprocessing construction, eligible message graph and held-out evaluation protocol. A future program change or bond measurement cannot enter earlier inputs merely because its target label is masked. Many valid protocols are possible; assess their consistency with the intended deployment question. Success here is an exact inspectable operation and an explained legal boundary, not a promise to beat the already inspected Karate assessment."}
                          </Prose>
                        </details>
                      </div>
                    </section>
                    <H2>
                      {"11. References and another way to learn"}
                    </H2>
                    <section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning" data-lesson-resource-list="">
                      <H3>
                        {"Another way to learn"}
                      </H3>
                      <ul>
                        <li>
                          {""}
                          <a href={"https://distill.pub/2021/gnn-intro/"}>
                            {"Sanchez-Lengeling, Reif, Pearce and Wiltschko — A Gentle Introduction to Graph Neural Networks"}
                          </a>
                          {", interactive article. After §§1–2, use its graph/array views and gather-update illustrations to connect a relationship diagram to a neural computation. Its visual explanation is a useful alternate route; use our explicit GAT/GATv2 equations for those layers' particular attention rules."}
                        </li>
                        <li>
                          {""}
                          <a href={"https://www.cs.mcgill.ca/~wlh/grl_book/files/GRL_Book.pdf"}>
                            {"William L. Hamilton — Graph Representation Learning"}
                          </a>
                          {", free author-posted textbook draft. Chapters 5–6 broaden messages, aggregation, updates, graph readout and sampling after the core example. Chapter 7 is a theory route after §8; annotate its assumptions rather than replace them with “sum sees everything.” Basic linear algebra and probability help with the deeper chapters."}
                        </li>
                        <li>
                          {""}
                          <a href={"https://www.youtube.com/watch?v=6g9vtxUmfwM"}>
                            {"Stanford CS224W — Message Passing and Node Classification"}
                          </a>
                          {", recorded lecture, paired with "}
                          <a href={"https://ai.stanford.edu/~jure/teaching.html"}>
                            {"Jure Leskovec's course resource page"}
                          </a>
                          {". Use it as a spoken alternate route into neighborhood computation after §§1–4. The "}
                          <a href={"https://web.stanford.edu/class/cs224w/"}>
                            {"current public course page"}
                          </a>
                          {" also lists readings and public materials; enrolled students' current lecture videos require Canvas access. Earlier lecture APIs may differ from the explicit versions used here."}
                        </li>
                        <li>
                          {""}
                          <a href={"https://pytorch-geometric.readthedocs.io/en/latest/tutorial/neighbor_loader.html"}>
                            {"PyG — Neighbor Sampling tutorial"}
                          </a>
                          {", hands-on documentation. After §9, follow local/global IDs and seed-only training. Check optional sampling-backend installation for your environment before expecting a runnable NeighborLoader. The supplied offline block program exposes the same bookkeeping questions without pretending to execute that backend."}
                        </li>
                      </ul>
                    </section>
                    <section className="lesson-ending lesson-ending--references" data-lesson-ending="references">
                      <H3>
                        {"Technical references"}
                      </H3>
                      <Prose>
                        {""}
                        <strong>
                          {"Layer definitions and expressiveness."}
                        </strong>
                        {" "}
                        <a href={"https://arxiv.org/html/1609.02907v4"}>
                          {"Kipf & Welling, GCN"}
                        </a>
                        {", §§2.1–2.2 and 3.1, supports the normalization and approximation choices. "}
                        <a href={"https://arxiv.org/html/1706.02216v4"}>
                          {"Hamilton et al., GraphSAGE"}
                        </a>
                        {", §3/Algorithm 1, distinguishes mean, transformed pooling, ordered aggregation, sampling and original normalization/objectives. "}
                        <a href={"https://arxiv.org/html/1710.10903v3"}>
                          {"Veličković et al., GAT"}
                        </a>
                        {", §2, supports projection, endpoint scoring and multihead merging; "}
                        <a href={"https://arxiv.org/html/2105.14491v3"}>
                          {"Brody et al., GATv2"}
                        </a>
                        {", §§2–3, explains static versus dynamic ranking. "}
                        <a href={"https://arxiv.org/html/1704.01212v2"}>
                          {"Gilmer et al., Neural Message Passing for Quantum Chemistry"}
                        </a>
                        {", §2, supplies the message/aggregate/update/readout framework and motivates edge attributes. "}
                        <a href={"https://arxiv.org/html/1810.00826v3"}>
                          {"Xu et al., How Powerful Are Graph Neural Networks?"}
                        </a>
                        {", §§2–4.2, supplies the multiset/WL conditions behind §8."}
                      </Prose>
                      <Prose>
                        {""}
                        <strong>
                          {"Filters, depth and bottlenecks."}
                        </strong>
                        {" "}
                        <a href={"https://arxiv.org/html/1606.09375v3"}>
                          {"Defferrard et al., localized spectral filters"}
                        </a>
                        {", §2.1, supports the polynomial/Chebyshev recurrence and its locality conditions. "}
                        <a href={"https://arxiv.org/abs/1806.03536"}>
                          {"Xu et al., Jumping Knowledge Networks"}
                        </a>
                        {" motivates retaining information from several depths; our concatenation and fixed weighted-readout examples are explicit local calculations, not a reproduction of its learned selection. "}
                        <a href={"https://arxiv.org/html/2006.05205v4"}>
                          {"Alon & Yahav, bottleneck and over-squashing"}
                        </a>
                        {" and "}
                        <a href={"https://arxiv.org/html/2111.14522v3"}>
                          {"Topping et al., sensitivity and curvature"}
                        </a>
                        {" address distant dependencies; their bounds have assumptions about graph distance and derivatives. They do not imply that every shallow graph has an exponential bottleneck or that rewiring always improves a task."}
                      </Prose>
                      <Prose>
                        {""}
                        <strong>
                          {"Current qualifications and research directions."}
                        </strong>
                        {" "}
                        <a href={"https://proceedings.mlr.press/v260/zhuo25a.html"}>
                          {"Zhuo et al., WeightRep"}
                        </a>
                        {" motivates examining learned channel weights alongside graph mixing. Our inverse-mode demonstration requires retained nonzero modes; it does not show every trained network learns an inverse. "}
                        <a href={"https://arxiv.org/html/2312.16560v3"}>
                          {"Adaptive Message Passing"}
                        </a>
                        {" couples message filtering and depth under a variational framework; the local finite-gate arithmetic is only one mechanism within that larger method. "}
                        <a href={"https://arxiv.org/html/2302.11640v2"}>
                          {"Platonov et al., heterophily benchmarks"}
                        </a>
                        {", §3, helps distinguish a neighborhood assumption from protocol defects and benchmark-specific claims. Read these after the worked spectral/rank and split examples, not as replacements for their derivations."}
                      </Prose>
                      <Prose>
                        {""}
                        <strong>
                          {"Ordinary implementations."}
                        </strong>
                        {" The precise APIs are "}
                        <a href={"https://pytorch-geometric.readthedocs.io/en/latest/generated/torch_geometric.nn.conv.GCNConv.html"}>
                          {"GCNConv"}
                        </a>
                        {", "}
                        <a href={"https://pytorch-geometric.readthedocs.io/en/latest/generated/torch_geometric.nn.conv.SAGEConv.html"}>
                          {"SAGEConv"}
                        </a>
                        {", "}
                        <a href={"https://pytorch-geometric.readthedocs.io/en/latest/generated/torch_geometric.nn.conv.GATConv.html"}>
                          {"GATConv"}
                        </a>
                        {", "}
                        <a href={"https://pytorch-geometric.readthedocs.io/en/latest/generated/torch_geometric.nn.conv.GATv2Conv.html"}>
                          {"GATv2Conv"}
                        </a>
                        {", "}
                        <a href={"https://pytorch-geometric.readthedocs.io/en/latest/generated/torch_geometric.nn.conv.GINConv.html"}>
                          {"GINConv"}
                        </a>
                        {", "}
                        <a href={"https://pytorch-geometric.readthedocs.io/en/latest/generated/torch_geometric.nn.conv.NNConv.html"}>
                          {"NNConv"}
                        </a>
                        {", "}
                        <a href={"https://pytorch-geometric.readthedocs.io/en/latest/modules/loader.html#torch_geometric.loader.NeighborLoader"}>
                          {"neighbor loading"}
                        </a>
                        {" and "}
                        <a href={"https://pytorch-geometric.readthedocs.io/en/latest/advanced/batching.html"}>
                          {"independent graph batching"}
                        </a>
                        {". The current documentation identifies PyG 2.9.0; new executed comparisons used PyG 2.8.0.post1 with Torch 2.14.0+cpu. Defaults, returned attention weights, padding and optional backends are checked and described for their actual route rather than assumed interchangeable across versions."}
                      </Prose>
                      <Prose>
                        {""}
                        <strong>
                          {"Observed data."}
                        </strong>
                        {" "}
                        <a href={"https://networkx.org/documentation/stable/reference/generated/networkx.generators.social.karate_club_graph.html"}>
                          {"NetworkX's Karate Club documentation"}
                        </a>
                        {" describes the graph representation and original study attribution. The offline "}
                        <code>
                          {"data-provenance.md"}
                        </code>
                        {" and license file describe our exact input representation, zero-based IDs, retained context weights and binary fitted adjacency. The measured study keeps its original executions and saved outputs; new constructed calculations are not additional measured Karate experiments."}
                      </Prose>
                    </section>
                    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources">
                      <H3>
                        {"Code and data files"}
                      </H3>
                      <Prose>
                        {"Use each file at the section where its operation is explained. Code appears inline with shared Copy/Download controls; this index helps you collect the complete runnable files and their actual dependencies. The four companion programs form a connected set, with each primitive explained at its teaching home."}
                      </Prose>
                      <NeuralTable caption={"Code and data files"} headers={[<>
                          {"File"}
                        </>, <>
                          {"What it supplies and what it needs"}
                        </>]} rows={[[<>
                          {""}
                          <code>
                            {"message-passing-operators.py"}
                          </code>
                          {""}
                        </>, <>
                          {"Explicit sparse GCN, mean-SAGE, GAT/GATv2 and mapped ordinary layers; requires Torch, and PyG for the comparisons. Its small main computes a declared path/update without fitting."}
                        </>], [<>
                          {""}
                          <code>
                            {"graph-aggregation-variants.py"}
                          </code>
                          {""}
                        </>, <>
                          {"Pre-transform pooling, stable row normalization, ordered/gated reuse, GIN and context loss, including actual ordinary GIN mapping and fixed/trainable-epsilon forward/derivative/update examples. Torch is required; PyG is required for its main's GIN comparisons. Keep the exact "}
                          <code>
                            {"recurrent-cells.py"}
                          </code>
                          {" from the earlier RNN lesson alongside it, or run from the repository where its fallback locates that file."}
                        </>], [<>
                          {""}
                          <code>
                            {"graph-propagation-limits.py"}
                          </code>
                          {""}
                        </>, <>
                          {"Sparse fixed mixing, polynomial/Chebyshev filters, initial residuals, diagnostic modes, size/variation/rank, SVD-based subspace whitening and finite gated routes. Requires Torch; dense eigenanalysis is limited to the small diagnostic examples."}
                        </>], [<>
                          {""}
                          <code>
                            {"graph-sampling-batching.py"}
                          </code>
                          {""}
                        </>, <>
                          {"Cyclic occurrences, a distinct seeded block sampler, explicit bipartite scheduling, graph offsets/readout, paired relation maps and constructed applications. Keep "}
                          <code>
                            {"message-passing-operators.py"}
                          </code>
                          {" alongside it. PyG supplies ordinary block/batch/NNConv comparisons; NeighborLoader also needs its optional backend."}
                        </>], [<>
                          {""}
                          <a href={"/learn-code/message-passing-graph-convolutions-gcn-gat-graphsage/message-passing-study.py"}>
                            {"message-passing-study.py"}
                          </a>
                          {""}
                        </>, <>
                          {"Complete original dense real-data experiment with the retained split, fitting protocol and outputs; uses adjacent "}
                          <code>
                            {"karate-club.json"}
                          </code>
                          {". Running it fits models; the live page instead reads saved evidence."}
                        </>], [<>
                          {""}
                          <a href={"/learn-code/message-passing-graph-convolutions-gcn-gat-graphsage/graph_library_bridge.py"}>
                            {"graph_library_bridge.py"}
                          </a>
                          {""}
                        </>, <>
                          {"Self-contained sparse/library comparison with its own four-node fixtures; it does not read an adjacent graph file. Use "}
                          <code>
                            {"--scratch-only"}
                          </code>
                          {" for the dense-oracle route without PyG."}
                        </>], [<>
                          {""}
                          <a href={"/learn-code/message-passing-graph-convolutions-gcn-gat-graphsage/karate-club.json"}>
                            {"karate-club.json"}
                          </a>
                          {""}
                        </>, <>
                          {"Offline node labels, relationship pairs and context weights for the observed graph."}
                        </>], [<>
                          {""}
                          <a href={"/learn-code/message-passing-graph-convolutions-gcn-gat-graphsage/calculated-inputs.json"}>
                            {"calculated-inputs.json"}
                          </a>
                          {""}
                        </>, <>
                          {"Retained experiment outcomes and calculated inputs, with their separate roles explained in §6."}
                        </>], [<>
                          {""}
                          <a href={"/learn-code/message-passing-graph-convolutions-gcn-gat-graphsage/data-provenance.md"}>
                            {"data-provenance.md"}
                          </a>
                          {" and "}
                          <a href={"/learn-code/message-passing-graph-convolutions-gcn-gat-graphsage/NETWORKX-LICENSE.txt"}>
                            {"NETWORKX-LICENSE.txt"}
                          </a>
                          {""}
                        </>, <>
                          {"Input history, transformation, attribution and license."}
                        </>], [<>
                          {""}
                          <a href={"/learn-assets/message-passing-graph-convolutions-gcn-gat-graphsage/recorded-probabilities.json"}>
                            {"recorded-probabilities.json"}
                          </a>
                          {""}
                        </>, <>
                          {"All retained model/seed probabilities; an edited saved-model inference is not a newly assessed fit."}
                        </>], [<>
                          {""}
                          <a href={"/learn-assets/message-passing-graph-convolutions-gcn-gat-graphsage/mlp-11.json"}>
                            {"mlp-11.json"}
                          </a>
                          {", "}
                          <a href={"/learn-assets/message-passing-graph-convolutions-gcn-gat-graphsage/gcn-11.json"}>
                            {"gcn-11.json"}
                          </a>
                          {", "}
                          <a href={"/learn-assets/message-passing-graph-convolutions-gcn-gat-graphsage/sage-11.json"}>
                            {"sage-11.json"}
                          </a>
                          {", "}
                          <a href={"/learn-assets/message-passing-graph-convolutions-gcn-gat-graphsage/gat-11.json"}>
                            {"gat-11.json"}
                          </a>
                          {""}
                        </>, <>
                          {"Exact seed-11 fitted states consumed by the model inspector. Fetch the chosen family as needed instead of fitting in the browser."}
                        </>], [<>
                          {""}
                          <a href={"/learn-assets/rnns-lstms-grus/recurrent-cells.py"}>
                            {"recurrent-cells.py"}
                          </a>
                          {""}
                        </>, <>
                          {"Exact earlier recurrent implementation reused for the ordered neighborhood and graph-wired GRU routes. Its detailed gate teaching belongs to that earlier lesson."}
                        </>]]} />
                      <Prose>
                        {"For the four companion programs, use one Python environment with Torch and, for the ordinary comparisons, PyG. The comparisons here were executed with Python 3.12, Torch "}
                        <code>
                          {"2.14.0+cpu"}
                        </code>
                        {" and PyG "}
                        <code>
                          {"2.8.0.post1"}
                        </code>
                        {"; the cited current documentation may describe a newer version. Install a compatible Torch build for your device from its official instructions, then install the tested graph package with "}
                        <code>
                          {"python -m pip install torch-geometric==2.8.0.post1"}
                        </code>
                        {". A native NeighborLoader additionally requires the optional backend identified in §9; the supplied pure tensor/block routes do not pretend to install it."}
                      </Prose>
                      <Prose>
                        {"Save the four companion files together with "}
                        <code>
                          {"recurrent-cells.py"}
                        </code>
                        {", open a terminal in that directory, and run the exact file whose mechanism you are following:"}
                      </Prose>
                      <CodeBlock language="sh" filename="run-graph-companions.sh" title="Run the companion programs">
                        {"python message-passing-operators.py\npython graph-aggregation-variants.py\npython graph-propagation-limits.py\npython graph-sampling-batching.py"}
                      </CodeBlock>
                      <Prose>
                        {"The hyphenated standalone filenames are launched as files. Where one supplies another's primitive, the supplied loader resolves the exact adjacent file by path; these are not identifiers for an ordinary "}
                        <code>
                          {"import"}
                        </code>
                        {" statement. The original real-data fitting program is a separate route with its own adjacent data requirements, described above."}
                      </Prose>
                    </section>
                    <section className="lesson-ending lesson-ending--next" data-lesson-ending="next">
                      <H3>
                        {"Ready for the next question?"}
                      </H3>
                      <Prose>
                        {"Explain one permitted message from its original feature row through a weighted contribution, reduction, update and loss. Implement that same operation with explicit tensor primitives and an ordinary library, keeping dimensions, parameter maps and gradients consistent. Diagnose a changed graph, a multiset collision, a sampling objective or a time boundary without relying on a model name. For deeper readiness, separate coordinate limits, variation, scale and rank, and say which information a proposed remedy can actually recover."}
                      </Prose>
                      <Prose>
                        {"Continue to "}
                        <a href={"/learn/path/full-curriculum/graph-transformers-geometric-deep-learning?module=deep-learning-fundamentals"}>
                          {"Graph Transformers & Geometric Deep Learning"}
                        </a>
                        {". Local messages have now made both their useful inductive structure and their missing information visible. The next questions are how nodes read distant nodes, how structural positions become inputs, and how coordinate-dependent representations obey physical transformations. Those additions must preserve the identity, information-boundary and explained implementation contracts learned here."}
                      </Prose>
                    </section>
                  </MessagePassingInspectorProvider>
                </MessagePassingApplicationsProvider>
              </MessagePassingExpressivenessProvider>
            </MessagePassingSparseProvider>
          </MessagePassingPropagationProvider>
        </MessagePassingAttentionProvider>
      </MessagePassingAggregationProvider>
    </MessagePassingBasicsExtensionsProvider>
  </div>
};
