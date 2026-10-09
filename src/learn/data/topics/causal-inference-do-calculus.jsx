import { H2, H3, Prose, CodeBlock } from '../../components/content';
import { MathBlock, Math as InlineMath } from '../../components/content/Math.jsx';
import { LessonTable as NeuralTable } from '../../components/lesson-labs/LessonElements.jsx';
import '../../components/lesson-labs/lesson-flow.css';
import '../../components/lesson-labs/causal-reading-flow.css';
import { C01, C02, C03, C04, C05, C06, C07 } from '../../components/lesson-labs/CausalPopulationDrawings.jsx';
import { C08, C09, C10, C11, C12, C13 } from '../../components/lesson-labs/CausalSeparationDrawings.jsx';
import { C14, C15, C16, C17, C18 } from '../../components/lesson-labs/CausalAdjustmentDrawings.jsx';
import { C19, C20, C21, C22, C23, C24, C25, C26, C27 } from '../../components/lesson-labs/CausalIdentificationDrawings.jsx';
import { C28, C29, C30, C31, C32, C33, C34, C35 } from '../../components/lesson-labs/CausalMediationDrawings.jsx';
import { C36, C37, C38, C39, C40, C41, C42, C43 } from '../../components/lesson-labs/CausalEstimationDrawings.jsx';
import { C44, C45, C46, C47 } from '../../components/lesson-labs/CausalObservedDrawings.jsx';
import { C48, C49, C50, C51, C52, C53 } from '../../components/lesson-labs/CausalDesignDrawings.jsx';
export default {
 title: 'Causal Inference & Do-Calculus',
 readTime: '~150 min first pass + extended code and practice',
 hasIntegratedGuide: true,
 content: () => <div className="lesson-flow causal-reading-flow">
<Prose opening="summary">{"Users who receive an offer buy more often. Would giving the offer to everyone increase purchases? We will first make the selection visible, then build a small system whose assignments we can change. That lets us distinguish three jobs: defining the change we care about, showing whether observations determine its result, and estimating that result from a sample."}</Prose>

<Prose opening="prerequisites">{"You need conditional probability, weighted means and the distinction between a population and a sample. The maintained "}<a href={"/learn/topic/probability-distributions-bayes-theorem"}>{"Probability Distributions & Bayes’ Theorem"}</a>{" lesson supplies conditional-count reasoning; "}<a href={"/learn/topic/random-variables-expectation-covariance"}>{"Random Variables, Expectation & Covariance"}</a>{" supplies weighted expectations; "}<a href={"/learn/topic/hypothesis-testing-confidence-intervals"}>{"Hypothesis Testing & Confidence Intervals"}</a>{" supplies sampling uncertainty. We introduce graphs, potential outcomes and intervention notation here. Bayesian Networks & Causal Graphical Models is a later complementary route, not an assumed prerequisite."}</Prose>

<Prose opening="route">{"For a first pass, follow sections 1–4, the two explanations in section 5, the mediator example in section 7, and the estimation and observed-data examples in sections 9–10. Return to the graph algorithm, formal rule tests, paired-world calculation and augmented-estimator derivation with those concrete objects in mind. Deeper explanations remain visible. The investigations show their answers immediately and allow changes and Reset; independent practice follows the teaching."}</Prose>

<H2>{"1. Observe a pattern, ask about a change"}</H2>

<C01 />

<Prose>{"The picture describes a "}<strong>{"constructed example of 200 eligible users"}</strong>{", each observed for seven days. A filled square means the specified offer was shown, "}<InlineMath>{"X=1"}</InlineMath>{"; an open square means it was not, "}<InlineMath>{"X=0"}</InlineMath>{". A purchase is "}<InlineMath>{"Y=1"}</InlineMath>{", and no purchase is "}<InlineMath>{"Y=0"}</InlineMath>{". Prior activity divides the population into 100 low-activity and 100 high-activity users. Low activity stays lavender and high activity stays rose throughout this example; treatment is an additional square symbol, so changing assignment does not change a user’s activity identity."}</Prose>

<Prose>{"In the low-activity group, 4 of 20 treated users purchase, compared with 8 of 80 untreated users. In the high-activity group the corresponding counts are 32 of 80 and 6 of 20. Pool the two treated cells: "}<InlineMath>{"4+32=36"}</InlineMath>{" purchases among "}<InlineMath>{"20+80=100"}</InlineMath>{" treated users. Pool the untreated cells: "}<InlineMath>{"8+6=14"}</InlineMath>{" among "}<InlineMath>{"80+20=100"}</InlineMath>{". The observed difference is therefore .36−.14=.22, or "}<strong>{"22 percentage points"}</strong>{"."}</Prose>

<Prose>{"That comparison uses different mixtures of users. High-activity users make up 80% of the treated group but only 20% of the untreated group. Both groups really have their displayed purchase rates; the issue is which question their difference answers. It describes the people who happened to receive each treatment. It does not yet describe the result of changing treatment for the same target population."}</Prose>

<C02 />

<Prose>{"For a particular user, write "}<InlineMath>{"Y(1)"}</InlineMath>{" for the purchase outcome under the specified offer and "}<InlineMath>{"Y(0)"}</InlineMath>{" for the outcome without it. These are "}<strong>{"potential outcomes for the same unit"}</strong>{". If the user actually receives the offer, we see the entry corresponding to "}<InlineMath>{"Y(1)"}</InlineMath>{"; the other slot remains unobserved. A missing slot is not a zero. Measuring more ordinary features does not reveal both treatment outcomes for that same occasion."}</Prose>

<Prose>{"Specify “show this offer once at login to eligible users; count purchases within seven days.” Different offer designs, delivery times, eligibility rules or outcome windows can define different potential outcomes. "}<strong>{"Consistency"}</strong>{" connects the observed outcome with the potential outcome for the treatment version actually received: "}<InlineMath>{"Y=Y(X)"}</InlineMath>{". Treating a user’s outcome as depending only on that user’s treatment also assumes away interference between users. If an offer changes a friend’s behaviour, the intervention must instead specify the relevant assignments across users."}</Prose>

<Prose>{"The population question is the average of the paired differences, whether or not we can observe those pairs:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\tau=\\mathbb E[Y(1)-Y(0)]\n     =\\mathbb E[Y(1)]-\\mathbb E[Y(0)]."}</MathBlock></div>

<Prose>{"This is the "}<strong>{"average treatment effect"}</strong>{", or ATE. For binary outcomes, each expectation is a purchase probability, so the ATE is a risk difference. Linearity of expectation gives the second equality; independence of "}<InlineMath>{"Y(1)"}</InlineMath>{" and "}<InlineMath>{"Y(0)"}</InlineMath>{" is neither needed nor assumed. ATE zero would not imply that every individual effect is zero: positive and negative effects could average out."}</Prose>

<Prose>{"The same population intervention risk can be written "}<InlineMath>{"P(Y=1\\mid\\operatorname{do}(X=x))"}</InlineMath>{". The symbol "}<strong>{"do"}</strong>{" says “set the treatment to this value.” In contrast, "}<InlineMath>{"P(Y=1\\mid X=x)"}</InlineMath>{" says “select the units whose observed treatment has this value.” We will make the difference operational by replacing the rule that generates "}<InlineMath>{"X"}</InlineMath>{"."}</Prose>

<NeuralTable caption={"1. Observe a pattern, ask about a change"} headers={[<>{"Job"}</>,<>{"Concrete question here"}</>]} rows={[[<>{"Define the estimand"}</>,<>{"Which population, offer, comparison and seven-day outcome does τ describe?"}</>],[<>{"Establish identification"}</>,<>{"Would the available population distribution and our causal assumptions uniquely determine τ, even with unlimited observations?"}</>],[<>{"Choose an estimator"}</>,<>{"Which calculation on a finite dataset estimates that identified quantity?"}</>],[<>{"Interpret the realized estimate"}</>,<>{"What number did this dataset produce, with what sampling and modeling uncertainty?"}</>]]} />

<Prose>{"A precisely measured .22 can still answer the wrong population question. Conversely, a valid identification formula can have a noisy finite-sample estimate. We keep these distinctions through the examples instead of asking a regression score to settle all four jobs."}</Prose>

<H2>{"2. Replace one mechanism"}</H2>

<C03 />

<Prose>{"Prior activity "}<InlineMath>{"Z"}</InlineMath>{" can influence both offer assignment and purchases. Draw "}<InlineMath>{"Z\\to X"}</InlineMath>{", "}<InlineMath>{"Z\\to Y"}</InlineMath>{", and "}<InlineMath>{"X\\to Y"}</InlineMath>{". Each arrow points from an input to the mechanism that uses it. A "}<strong>{"directed acyclic graph"}</strong>{", or DAG, has no route that follows arrows back to its starting point. Here the order is activity, then assignment, then outcome. A parent is a node with an arrow into the current node; a descendant is a node reachable by following arrows out."}</Prose>

<Prose>{"The arrows are causal assumptions. A strong association does not by itself establish their direction, and a missing common-cause arrow is a substantive claim. Feedback can be represented by separate variables at successive times; it should not be silently squeezed into this single-treatment graph."}</Prose>

<Prose>{"Behind each assignment is background variation. Let "}<InlineMath>{"U_Z,U_X,U_Y"}</InlineMath>{" be independent Uniform(0,1) variables for this illustrative model. Each unit gets one value of each. Write “1 if the statement holds, otherwise 0” as the indicator "}<InlineMath>{"\\mathbf 1\\{\\cdot\\}"}</InlineMath>{". The actual assignments are"}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{aligned}\nZ&=\\mathbf1\\{U_Z<.5\\},\\\\\nX&=\\mathbf1\\{U_X<e_Z\\},\\qquad (e_0,e_1)=(.2,.8),\\\\\nY&=\\mathbf1\\{U_Y<m_{Z,X}\\},\\qquad\nm=\\begin{pmatrix}.10&.20\\\\.30&.40\\end{pmatrix}.\n\\end{aligned}"}</MathBlock></div>

<Prose>{"The outcome matrix uses activity "}<InlineMath>{"Z"}</InlineMath>{" for rows and treatment "}<InlineMath>{"X"}</InlineMath>{" for columns. Thus "}<InlineMath>{"m_{1,0}=.30"}</InlineMath>{" is a high-activity untreated risk. Each independent background input enters only its own assignment. This graph plus its functions and background distribution is a "}<strong>{"structural causal model"}</strong>{". The functions specify much more than the graph: they define actual thresholds, effect sizes, and paired outcomes under changed assignments."}</Prose>

<C04 />

<Prose>{"Trace one unit. Because .30<.50, it has "}<InlineMath>{"Z=1"}</InlineMath>{". Because .60<.80, it receives the offer, "}<InlineMath>{"X=1"}</InlineMath>{". Its outcome threshold is then "}<InlineMath>{"m_{1,1}=.40"}</InlineMath>{"; .35<.40, so it purchases. Keep this unit’s background inputs fixed and set "}<InlineMath>{"X=0"}</InlineMath>{": its outcome threshold becomes .30, and .35 is no longer below it. This model produces "}<InlineMath>{"Y(0)=0,Y(1)=1"}</InlineMath>{" for that unit. That pairing comes from the stated structural model; the observational table alone did not reveal it."}</Prose>

<C05 />

<Prose>{""}<strong>{"Conditioning"}</strong>{" on "}<InlineMath>{"X=1"}</InlineMath>{" keeps the original assignment and selects the units it treated. The low-activity treated population mass is .5×.2=.1; the high-activity treated mass is .5×.8=.4. The selected total is .5. Divide each retained mass by .5 to obtain the treated activity mixture .2/.8. Its purchase risk is .2×.2+.8×.4=.36."}</Prose>

<Prose>{"An "}<strong>{"intervention"}</strong>{" "}<InlineMath>{"\\operatorname{do}(X=1)"}</InlineMath>{" replaces "}<InlineMath>{"X=\\mathbf1\\{U_X<e_Z\\}"}</InlineMath>{" with "}<InlineMath>{"X=1"}</InlineMath>{". The low/high population masses remain .5/.5 because neither the activity mechanism nor its background distribution changed. The new purchase risk is .5×.2+.5×.4=.30. Graphically, cut the incoming "}<InlineMath>{"Z\\to X"}</InlineMath>{" arrow and retain "}<InlineMath>{"X\\to Y"}</InlineMath>{". Cutting the outgoing arrow would remove the very effect being studied."}</Prose>

<Prose>{"The same reasoning for "}<InlineMath>{"X=0"}</InlineMath>{" gives observed risk .8×.1+.2×.3=.14, compared with intervention risk .5×.1+.5×.3=.20. In this model the intervention difference is .10. The extra .12 in the observed .22 comes from the different activity mixtures, not an additional treatment mechanism."}</Prose>

<C06 />

<Prose>{"Change how offers are assigned while keeping the population and outcome mechanisms fixed. At "}<InlineMath>{"e_0=e_1=.5"}</InlineMath>{", assignment is randomized with respect to activity in this model, and the observed risks equal .20 and .30. At the original .2/.8 settings, selection produces .14 and .36 again. The intervention risks remain fixed because that calculation replaces the edited assignment mechanism."}</Prose>

<Prose>{"Try an endpoint such as "}<InlineMath>{"e_0=0,e_1=1"}</InlineMath>{". The simulator still knows every outcome threshold, so it can calculate both intervention risks. Observed data contain no low-activity treated cases and no high-activity untreated cases; those conditional cells are "}<strong>{"unavailable"}</strong>{", not zero. If "}<InlineMath>{"e_0=e_1=0"}</InlineMath>{", there is no treated group at all, so even the pooled treated observational risk is unavailable. The picture explicitly separates the model-known answer from what the observed support can supply. Reset restores .2/.8."}</Prose>

<C07 />

<Prose>{"We can now express the branch calculation compactly. Lowercase "}<InlineMath>{"p(z,x,y)"}</InlineMath>{" means "}<InlineMath>{"P(Z=z,X=x,Y=y)"}</InlineMath>{". In an acyclic causal model with independent background inputs and all the relevant common causes represented, the joint law factors into the conditional mechanisms:"}</Prose>

<div className="neural-equation"><MathBlock>{"p(z,x,y)=p(z)p(x\\mid z)p(y\\mid x,z)."}</MathBlock></div>

<Prose>{"Setting "}<InlineMath>{"X=x"}</InlineMath>{" replaces its conditional mechanism by a point mass at the chosen value. The remaining joint law over activity and outcome is"}</Prose>

<div className="neural-equation"><MathBlock>{"p(z,y\\mid\\operatorname{do}(X=x))=p(z)p(y\\mid x,z)."}</MathBlock></div>

<Prose>{"This is the "}<strong>{"truncated factorization"}</strong>{". The dropped factor is specifically the replaced assignment mechanism. It is not valid to take an arbitrary factorization of observed variables, delete a convenient factor, and call the result causal. Hidden common causes can make the displayed background variables dependent. Later we will include such a hidden cause explicitly, intervene in the full model, and only then sum it out."}</Prose>

<Prose>{"For example, the observed cell "}<InlineMath>{"Z=1,X=1,Y=1"}</InlineMath>{" has mass .5×.8×.4=.16. Adding the other treated-success cell gives .16+.02=.18. Divide by the total treated mass .5 to get .36. Under forced treatment the same high-activity success branch has mass .5×1×.4=.20; the low-activity success branch has mass .5×1×.2=.10. They sum directly to .30 because the forced joint law already totals one. Conditioning needs the selected-group denominator; intervention needs the changed probability law."}</Prose>

<Prose>{"The complete programme below enumerates the eight binary cells rather than drawing random samples. "}<code>{"Fraction"}</code>{" retains exact rational arithmetic. "}<code>{"joint()"}</code>{" uses the natural assignment; "}<code>{"joint(forced=x)"}</code>{" replaces only the treatment probability with either zero or one. The normalization assertion protects the probability-law invariant. The observed calculation filters rows and divides by their mass, while the intervention calculation sums success mass over the full forced law."}</Prose>

<Prose>{"Use Python 3; this route requires only the standard library. Save the complete source as "}<code>{"causal_mechanisms.py"}</code>{" and run "}<code>{"python causal_mechanisms.py"}</code>{" (or "}<code>{"py causal_mechanisms.py"}</code>{" on Windows). Python executes in your environment; the browser investigation uses the same stated finite model."}</Prose>

<Prose>{""}<strong>{"Complete file: causal_mechanisms.py."}</strong>{" Save this listing and run "}<code>{"python causal_mechanisms.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"causal_mechanisms.py"} downloadUrl={"/learn-assets/causal-inference/causal_mechanisms.py"}>{"from fractions import Fraction as F\nfrom itertools import product\n\npopulation = [F(1, 2), F(1, 2)]\nassignment = [F(1, 5), F(4, 5)]\noutcome = [[F(1, 10), F(1, 5)], [F(3, 10), F(2, 5)]]\n\ndef joint(forced=None):\n    rows = []\n    for z, x, y in product([0, 1], repeat=3):\n        # Intervention replaces just the probability of X with a point mass.\n        px = (assignment[z] if x else 1 - assignment[z])\n        if forced is not None:\n            px = F(x == forced)\n        py = outcome[z][x] if y else 1 - outcome[z][x]\n        rows.append((z, x, y, population[z] * px * py))\n    assert sum(row[3] for row in rows) == 1\n    return rows\n\nobserved = joint()\nfor x in [0, 1]:\n    selected = [row for row in observed if row[1] == x]\n    observational_risk = sum(y * mass for _, _, y, mass in selected) / sum(r[3] for r in selected)\n    intervention_risk = sum(y * mass for _, _, y, mass in joint(forced=x))\n    print('X =', x, '| observed risk =', observational_risk,\n          '| intervention risk =', intervention_risk)\n"}</CodeBlock>

<Prose>{"Observed output:"}</Prose>

<CodeBlock language={"output"} kind={"output"} filename={"causal_mechanisms.py.stdout.txt"} downloadUrl={"/learn-assets/causal-inference/causal_mechanisms.py.stdout.txt"}>{"X = 0 | observed risk = 7/50 | intervention risk = 1/5\nX = 1 | observed risk = 9/25 | intervention risk = 3/10"}</CodeBlock>

<Prose>{"The exact output distinguishes "}<InlineMath>{"7/50=.14"}</InlineMath>{" from "}<InlineMath>{"1/5=.20"}</InlineMath>{" and "}<InlineMath>{"9/25=.36"}</InlineMath>{" from "}<InlineMath>{"3/10=.30"}</InlineMath>{". As a code experiment, replace the assignment list by two "}<code>{"F(1,2)"}</code>{" entries. The predicted consequence follows from the preceding mixture calculation: observed and intervened risks agree for both treatment values. This constant-size example uses eight rows; direct enumeration grows exponentially with the number of binary variables. Later graphical inference methods avoid enumerating every joint assignment when structure permits."}</Prose>

<Prose>{""}<strong>{"Checkpoint."}</strong>{" Under "}<InlineMath>{"\\operatorname{do}(X=1)"}</InlineMath>{", do we also delete "}<InlineMath>{"X\\to Y"}</InlineMath>{"? No: we replace the rule generating "}<InlineMath>{"X"}</InlineMath>{", and keep its downstream consequences. Ordinary conditioning leaves the generating rule intact and instead selects units."}</Prose>

<H2>{"3. Find which paths stay open"}</H2>

<C08 />

<Prose>{"The assignment example had a second route from "}<InlineMath>{"X"}</InlineMath>{" to "}<InlineMath>{"Y"}</InlineMath>{": "}<InlineMath>{"X\\leftarrow Z\\to Y"}</InlineMath>{". A "}<strong>{"path"}</strong>{" walks along neighbouring edges, temporarily ignoring arrow direction for the walk. Arrowheads still decide what each interior node does. In this fork, "}<InlineMath>{"Z"}</InlineMath>{" is a shared cause. Comparing within a fixed "}<InlineMath>{"Z"}</InlineMath>{" blocks that route. In a chain "}<InlineMath>{"X\\to M\\to Y"}</InlineMath>{", the middle variable is instead a mediator: fixing "}<InlineMath>{"M"}</InlineMath>{" blocks a route along which an effect could travel. Blocking a path is useful only in relation to the target question; removing part of the total effect is not automatically the desired adjustment."}</Prose>

<C09 />

<Prose>{"A "}<strong>{"collider"}</strong>{" has both neighbouring arrows pointing into it on the path. The path "}<InlineMath>{"X\\to C\\leftarrow Y"}</InlineMath>{" is closed when neither "}<InlineMath>{"C"}</InlineMath>{" nor any descendant of "}<InlineMath>{"C"}</InlineMath>{" is conditioned on. Conditioning on "}<InlineMath>{"C"}</InlineMath>{", or on a descendant such as "}<InlineMath>{"D"}</InlineMath>{", can open it. This role belongs to the node "}<strong>{"on this particular path"}</strong>{"; the same node can be a noncollider on another path. The white observation ring records selection, while the node’s colour and label preserve its identity."}</Prose>

<C10 />

<Prose>{"Take independent binary causes "}<InlineMath>{"X"}</InlineMath>{" and "}<InlineMath>{"Y"}</InlineMath>{", each with probability .5. Let an alarm "}<InlineMath>{"C"}</InlineMath>{" be one whenever either cause is present. The four pairs 00, 01, 10 and 11 each have probability .25. Keeping alarm cases removes only 00. Among selected cases with "}<InlineMath>{"X=0"}</InlineMath>{", the sole remaining pair is 01, so "}<InlineMath>{"P(Y=1\\mid X=0,C=1)=1"}</InlineMath>{". Among selected cases with "}<InlineMath>{"X=1"}</InlineMath>{", pairs 10 and 11 both remain, so that risk is .5. Before selection both risks were .5."}</Prose>

<Prose>{"Learning that one cause was absent makes the other necessary to explain the alarm. This is selection-induced association; setting "}<InlineMath>{"X"}</InlineMath>{" still does not change the independent mechanism generating "}<InlineMath>{"Y"}</InlineMath>{". If a reporting field "}<InlineMath>{"D"}</InlineMath>{" simply copies the alarm, selecting "}<InlineMath>{"D=1"}</InlineMath>{" selects the same records. This is how restricting an analysis to admitted, logged or completed cases can matter even if the selection variable comes after the measured variables."}</Prose>

<Prose>{"The following complete standard-library programme gives each pair exact mass "}<InlineMath>{"1/4"}</InlineMath>{". "}<code>{"risk"}</code>{" first chooses the required treatment and optional alarm cases, then divides their success mass by their total mass. It computes conditional risks, not an intervention. The final explanation about changing "}<InlineMath>{"X"}</InlineMath>{" follows from the independent structural assignment of "}<InlineMath>{"Y"}</InlineMath>{", not from that selected comparison."}</Prose>

<Prose>{""}<strong>{"Complete file: causal_selection.py."}</strong>{" Save this listing and run "}<code>{"python causal_selection.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"causal_selection.py"} downloadUrl={"/learn-assets/causal-inference/causal_selection.py"}>{"from fractions import Fraction as F\nfrom itertools import product\n\n# Independent causes; C is their common effect and D is a copy of C.\nrows = [(x, y, int(x or y), F(1, 4)) for x, y in product([0, 1], repeat=2)]\n\ndef risk(x, selected=False):\n    keep = [(y, mass) for tx, y, c, mass in rows if tx == x and (not selected or c == 1)]\n    return sum(y * mass for y, mass in keep) / sum(mass for _, mass in keep)\n\nprint('unselected Y risks:', risk(0), risk(1))\nprint('given C=1, Y risks:', risk(0, True), risk(1, True))\nprint('selected association:', risk(1, True) - risk(0, True))\n"}</CodeBlock>

<Prose>{"Observed output:"}</Prose>

<CodeBlock language={"output"} kind={"output"} filename={"causal_selection.py.stdout.txt"} downloadUrl={"/learn-assets/causal-inference/causal_selection.py.stdout.txt"}>{"unselected Y risks: 1/2 1/2\ngiven C=1, Y risks: 1 1/2\nselected association: -1/2"}</CodeBlock>

<Prose>{"The observed selected difference is −1/2. Selecting D=1 gives the same set because D=C. Changing X does not change the independent mechanism of Y. A useful changed case is an AND alarm, active only for pair 11: the selected "}<InlineMath>{"X=0"}</InlineMath>{" group would then be empty, so its conditional risk must be unavailable rather than computed by dividing by zero. The original programme intentionally answers its stated OR-alarm question; changing the selection rule requires handling that support check too."}</Prose>

<C12 />

<Prose>{"Explore the fork, chain, collider and collider-with-descendant. First leave the observed set empty, then observe the middle node. For the last graph, observe its descendant instead. The display marks the actual local reason: an observed noncollider blocks; a collider lacking an observed descendant blocks; otherwise this route is active. It does not infer a numerical effect from the graph. Reset returns to the unobserved fork. The two endpoints are not selectable conditioning nodes in this investigation."}</Prose>

<Prose>{"For a conditioning set "}<InlineMath>{"S"}</InlineMath>{", a path is "}<strong>{"active"}</strong>{" when every interior noncollider is outside "}<InlineMath>{"S"}</InlineMath>{", and every collider either belongs to "}<InlineMath>{"S"}</InlineMath>{" or has a descendant in "}<InlineMath>{"S"}</InlineMath>{". If there is no active path between two node sets, "}<InlineMath>{"S"}</InlineMath>{" "}<strong>{"d-separates"}</strong>{" them. Under the distributional Markov assumptions encoded by the graph, d-separation implies conditional independence."}</Prose>

<Prose>{"An active path permits dependence; it does not guarantee a nonzero numerical association. Different contributions can cancel, and a function may ignore an input permitted by the graph. The extra "}<strong>{"faithfulness"}</strong>{" assumption rules out such additional independences. Applying a valid d-separation implication does not require assuming the reverse implication. Likewise, selecting a mediator is not automatically a direct-effect estimator: in "}<InlineMath>{"X\\to M\\leftarrow U\\to Y"}</InlineMath>{", conditioning on "}<InlineMath>{"M"}</InlineMath>{" opens the hidden-cause path. A controlled direct effect compares the explicitly joint actions "}<InlineMath>{"\\operatorname{do}(X=1,M=m)"}</InlineMath>{" and "}<InlineMath>{"\\operatorname{do}(X=0,M=m)"}</InlineMath>{", whose identification needs its own assumptions."}</Prose>

<C11 />

<Prose>{"Checking every possible path can become expensive. There is another exact graph procedure for a declared DAG. Keep the query endpoints, the conditioned nodes, and "}<strong>{"all their ancestors"}</strong>{". On this restricted graph, join every pair of parents of a common child, then forget arrow direction. The result is called the "}<strong>{"moral graph"}</strong>{"; the word names this parent-joining operation, not a causal judgment. Delete the conditioned nodes and their incident edges. Finally search for an undirected route from a left endpoint to a right endpoint. No route means the original query is d-separated."}</Prose>

<Prose>{"The order is essential. For "}<InlineMath>{"X\\to C\\leftarrow Y,C\\to D"}</InlineMath>{" with no observations, the ancestors of the query “"}<InlineMath>{"X"}</InlineMath>{" versus "}<InlineMath>{"Y"}</InlineMath>{"” are only "}<InlineMath>{"X,Y"}</InlineMath>{". The collider disappears "}<strong>{"before"}</strong>{" its parents could be joined, so no route remains. Given "}<InlineMath>{"D"}</InlineMath>{", all four nodes belong to the ancestor set. Parent marriage adds "}<InlineMath>{"X-Y"}</InlineMath>{"; removing conditioned "}<InlineMath>{"D"}</InlineMath>{" leaves that edge, so the query is not separated. Given "}<InlineMath>{"C"}</InlineMath>{", the ancestor set is "}<InlineMath>{"X,C,Y"}</InlineMath>{"; after adding "}<InlineMath>{"X-Y"}</InlineMath>{" and deleting "}<InlineMath>{"C"}</InlineMath>{", the same connection survives."}</Prose>

<Prose>{"The scratch implementation exposes every intermediate graph. It validates node labels, directed edges, disjoint query sets and acyclicity before answering. Its first queue implements a topological ordering: a node enters when all its parents have been processed. If fewer nodes can be processed than exist, a cycle remains. The next queue follows parent links to collect ancestors. The final queue performs breadth-first reachability on the surviving undirected edges. A queue is a first-in, first-out list; each reached vertex is added only once."}</Prose>

<Prose>{""}<strong>{"Complete file: causal_graph_separation.py."}</strong>{" Save this listing and run "}<code>{"python causal_graph_separation.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"causal_graph_separation.py"} downloadUrl={"/learn-assets/causal-inference/causal_graph_separation.py"}>{"\"\"\"Decide d-separation by ancestral restriction, moralization and reachability.\n\nPython 3.12; standard library only. This tests a declared DAG. It does not learn\na causal graph from data or establish that its causal assumptions are true.\n\"\"\"\nfrom collections import deque\nfrom itertools import combinations\n\n\ndef separation_trace(nodes, edges, left, right, given=()):\n    \"\"\"Return the separation decision and every graph used to compute it.\n\n    All labels are distinct strings. Query sets must be nonempty at their two\n    endpoints and pairwise disjoint. The conditioning set may be empty.\n    Moralization can add quadratically many edges; unlike enumerating every\n    simple path, this method does not have an exponential path-count cost.\n    \"\"\"\n    labels = list(nodes)\n    if not labels or any(not isinstance(v, str) or not v for v in labels):\n        raise ValueError('Use nonempty string node labels.')\n    vertices = set(labels)\n    if len(vertices) != len(labels):\n        raise ValueError('Node labels must be distinct.')\n    arcs = []\n    for edge in edges:\n        if not isinstance(edge, (tuple, list)) or len(edge) != 2:\n            raise ValueError('Each directed edge needs two node labels.')\n        a, b = edge\n        if a not in vertices or b not in vertices or a == b:\n            raise ValueError('Each edge must join two different declared nodes.')\n        arcs.append((a, b))\n    if len(set(arcs)) != len(arcs):\n        raise ValueError('Do not repeat directed edges.')\n    x, y, z = set(left), set(right), set(given)\n    if not x or not y or (x | y | z) - vertices:\n        raise ValueError('Query endpoints must exist and be nonempty.')\n    if x & y or x & z or y & z:\n        raise ValueError('The three query sets must be disjoint.')\n    parents = {v: set() for v in vertices}\n    children = {v: set() for v in vertices}\n    for a, b in arcs:\n        parents[b].add(a)\n        children[a].add(b)\n    pending = {v: len(parents[v]) for v in vertices}\n    queue = deque(sorted(v for v in vertices if pending[v] == 0))\n    order = []\n    while queue:\n        v = queue.popleft()\n        order.append(v)\n        for child in sorted(children[v]):\n            pending[child] -= 1\n            if pending[child] == 0:\n                queue.append(child)\n    if len(order) != len(vertices):\n        raise ValueError('The graph must be acyclic.')\n\n    ancestors = x | y | z\n    queue = deque(sorted(ancestors))\n    while queue:\n        v = queue.popleft()\n        for parent in sorted(parents[v] - ancestors):\n            ancestors.add(parent)\n            queue.append(parent)\n    # Restrict first. Moralizing a collider outside this ancestral set would\n    # create a false connection between its parents.\n    retained = [(a, b) for a, b in arcs if a in ancestors and b in ancestors]\n    undirected = {tuple(sorted((a, b))) for a, b in retained}\n    joins = set()\n    for child in sorted(ancestors):\n        for a, b in combinations(sorted(parents[child] & ancestors), 2):\n            edge = (a, b)\n            if edge not in undirected:\n                joins.add(edge)\n            undirected.add(edge)\n    surviving = {edge for edge in undirected if not (set(edge) & z)}\n    neighbors = {v: set() for v in ancestors - z}\n    for a, b in surviving:\n        neighbors[a].add(b)\n        neighbors[b].add(a)\n    reached = set(x)\n    queue = deque(sorted(x))\n    while queue:\n        v = queue.popleft()\n        for nxt in sorted(neighbors[v] - reached):\n            reached.add(nxt)\n            queue.append(nxt)\n    return {\n        'separated': not bool(reached & y),\n        'ancestors': sorted(ancestors),\n        'retained_arrows': sorted(retained),\n        'added_parent_links': sorted(joins),\n        'moral_edges': sorted(undirected),\n        'surviving_edges': sorted(surviving),\n        'reachable_from_left': sorted(reached),\n    }\n\n\ndef main():\n    nodes = ['X', 'C', 'Y', 'D']\n    edges = [('X', 'C'), ('Y', 'C'), ('C', 'D')]\n    for given in [[], ['C'], ['D']]:\n        trace = separation_trace(nodes, edges, ['X'], ['Y'], given)\n        print('given', given, 'separated', trace['separated'])\n        print('ancestors', trace['ancestors'])\n        print('parent links', trace['added_parent_links'])\n        print('remaining edges', trace['surviving_edges'])\n\n\nif __name__ == '__main__':\n    main()\n"}</CodeBlock>

<Prose>{"Observed output:"}</Prose>

<CodeBlock language={"output"} kind={"output"} filename={"causal_graph_separation.py.stdout.txt"} downloadUrl={"/learn-assets/causal-inference/causal_graph_separation.py.stdout.txt"}>{"given [] separated True\nancestors ['X', 'Y']\nparent links []\nremaining edges []\ngiven ['C'] separated False\nancestors ['C', 'X', 'Y']\nparent links [('X', 'Y')]\nremaining edges [('X', 'Y')]\ngiven ['D'] separated False\nancestors ['C', 'D', 'X', 'Y']\nparent links [('X', 'Y')]\nremaining edges [('C', 'X'), ('C', 'Y'), ('X', 'Y')]\n"}</CodeBlock>

<Prose>{"Sets remove duplicate discoveries, and sorted labels make the trace reproducible without affecting the separation result. Pass query collections such as "}<code>{"{'temperature'}"}</code>{", not a bare string that could be split into characters. The implementation returns "}<code>{"separated"}</code>{", the ancestors, retained arrows, new parent links, moral edges, surviving edges and reachable vertices. These are diagnostic graph objects, not estimates of an effect or evidence that the assumed graph is true."}</Prose>

<Prose>{"Ancestor search and reachability take linear work in their respective graph sizes. Parent marriage can add up to quadratically many edges in the number of retained vertices, and this implementation also sorts sets for stable output. It avoids the exponential number of simple paths that an explicit path-listing approach can encounter. It is designed to teach and inspect the transformation; an ordinary library can answer the same declared-graph query directly."}</Prose>

<C13 />

<Prose>{"Install the recorded library version with "}<code>{"python -m pip install networkx==3.6.1"}</code>{". "}<code>{"DiGraph"}</code>{" stores directed edges; "}<code>{"add_nodes_from"}</code>{" preserves isolated nodes; "}<code>{"is_d_separator(graph, left, right, given)"}</code>{" returns "}<strong>{"True when separated"}</strong>{". It validates a DAG and disjoint node sets. NetworkX uses a directed traversal rather than constructing our moral graph, so agreement is a useful algorithm comparison, not two calls to the same implementation."}</Prose>

<Prose>{""}<strong>{"Complete file: causal_graph_library.py."}</strong>{" Save this listing and run "}<code>{"python causal_graph_library.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"causal_graph_library.py"} downloadUrl={"/learn-assets/causal-inference/causal_graph_library.py"}>{"\"\"\"The same declared-graph queries through NetworkX 3.6.1.\n\nInstall networkx==3.6.1. NetworkX uses a directed traversal rather than building\nour moral graph. Pass sets so a multi-character node is not mistaken for a list\nof characters. True means separated, not a detected association.\n\"\"\"\nimport networkx as nx\n\n\ndef main():\n    graph = nx.DiGraph()\n    graph.add_nodes_from(['X', 'C', 'Y', 'D'])\n    graph.add_edges_from([('X', 'C'), ('Y', 'C'), ('C', 'D')])\n    for given in [set(), {'C'}, {'D'}]:\n        print('given', sorted(given), 'separated',\n              nx.is_d_separator(graph, {'X'}, {'Y'}, given))\n    # A relevant changed case: remove the descendant link, preserving node D.\n    graph.remove_edge('C', 'D')\n    print('D disconnected; given D; separated',\n          nx.is_d_separator(graph, {'X'}, {'Y'}, {'D'}))\n\n\nif __name__ == '__main__':\n    main()\n"}</CodeBlock>

<Prose>{"Observed output:"}</Prose>

<CodeBlock language={"output"} kind={"output"} filename={"causal_graph_library.py.stdout.txt"} downloadUrl={"/learn-assets/causal-inference/causal_graph_library.py.stdout.txt"}>{"given [] separated True\ngiven ['C'] separated False\ngiven ['D'] separated False\nD disconnected; given D; separated True\n"}</CodeBlock>

<Prose>{"Both routes give True with no conditioning and False given either "}<InlineMath>{"C"}</InlineMath>{" or "}<InlineMath>{"D"}</InlineMath>{". The final library case removes "}<InlineMath>{"C\\to D"}</InlineMath>{" but keeps node "}<InlineMath>{"D"}</InlineMath>{". Now observing isolated "}<InlineMath>{"D"}</InlineMath>{" no longer activates the collider; the result returns to True. In the scratch procedure, "}<InlineMath>{"D"}</InlineMath>{" remains in the ancestor set because it is conditioned on, but its former parents and collider ancestors do not enter through it. The exact graph edit, not the name “descendant,” determines the answer."}</Prose>

<Prose>{"We have learned how to block a selection route. Next we need to turn that graph argument into the population average our offer question requested."}</Prose>

<H2>{"4. Standardize the comparison"}</H2>

<C14 />

<Prose>{"In the offer graph, the route "}<InlineMath>{"X\\leftarrow Z\\to Y"}</InlineMath>{" begins with an arrow "}<strong>{"into"}</strong>{" treatment. Such a route is a "}<strong>{"backdoor path"}</strong>{". A sufficient classical adjustment rule is to choose variables that are not descendants of "}<InlineMath>{"X"}</InlineMath>{" and block every backdoor path from "}<InlineMath>{"X"}</InlineMath>{" to "}<InlineMath>{"Y"}</InlineMath>{". Here "}<InlineMath>{"Z"}</InlineMath>{" meets the rule. We need not include every ancestor or every variable that predicts purchases; an unnecessary selection variable could instead open a collider path."}</Prose>

<Prose>{"Inside each activity stratum, the displayed treated-minus-untreated difference is .10. The target contains equal activity shares, so use those same shares for "}<strong>{"both"}</strong>{" treatment risks. This operation is "}<strong>{"standardization"}</strong>{": compare within strata, then restore the target population’s mixture."}</Prose>

<C15 />

<Prose>{"The standardized treated risk is .5×.20+.5×.40=.30; the untreated risk is .5×.10+.5×.30=.20. Subtract to obtain .10, or ten percentage points. We have not reduced anyone’s within-stratum risk. We changed the composition used for the comparison. Using the observed treated weights .2/.8 for one arm and observed untreated weights .8/.2 for the other would reconstruct the original selected comparison."}</Prose>

<Prose>{"The complete programme starts from the four original counts. The raw calculation pools successes and denominators. The adjusted calculation first forms each within-stratum difference and then uses the common .5 target weight. Averaging differences equals subtracting the two common-weight averages by distributivity; either route uses the same target."}</Prose>

<Prose>{""}<strong>{"Complete file: causal_offer_adjustment.py."}</strong>{" Save this listing and run "}<code>{"python causal_offer_adjustment.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"causal_offer_adjustment.py"} downloadUrl={"/learn-assets/causal-inference/causal_offer_adjustment.py"}>{"# group, treated users, treated conversions, control users, control conversions\ngroups = [\n    (\"low activity\", 20, 4, 80, 8),\n    (\"high activity\", 80, 32, 20, 6),\n]\n\ntreated_rate = sum(row[2] for row in groups) / sum(row[1] for row in groups)\ncontrol_rate = sum(row[4] for row in groups) / sum(row[3] for row in groups)\nnaive_difference = treated_rate - control_rate\n\nadjusted_difference = sum(\n    ((treated_success / treated_n) - (control_success / control_n)) * 0.5\n    for _, treated_n, treated_success, control_n, control_success in groups\n)\n\nprint(round(naive_difference, 2))\nprint(round(adjusted_difference, 2))\n"}</CodeBlock>

<Prose>{"Observed output:"}</Prose>

<CodeBlock language={"output"} kind={"output"} filename={"causal_offer_adjustment.py.stdout.txt"} downloadUrl={"/learn-assets/causal-inference/causal_offer_adjustment.py.stdout.txt"}>{"0.22\n0.1"}</CodeBlock>

<Prose>{"The output .22 and .10 concerns the constructed finite table. It becomes a causal estimate only with the assumptions that connect those observed stratum risks to potential outcomes. To see that connection, let "}<InlineMath>{"z"}</InlineMath>{" after a conditioning bar stand for "}<InlineMath>{"Z=z"}</InlineMath>{". Total expectation first decomposes the target population:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\mathbb E[Y(x)]\n=\\sum_z \\mathbb E[Y(x)\\mid Z=z]p(z)."}</MathBlock></div>

<Prose>{""}<strong>{"Conditional exchangeability"}</strong>{" says "}<InlineMath>{"Y(x)\\perp X\\mid Z"}</InlineMath>{": within a stratum, knowing actual treatment conveys no further information about the potential outcome under "}<InlineMath>{"x"}</InlineMath>{". It allows inserting "}<InlineMath>{"X=x"}</InlineMath>{" into the conditional mean. Consistency then replaces "}<InlineMath>{"Y(x)"}</InlineMath>{" by the observed "}<InlineMath>{"Y"}</InlineMath>{" among those who actually received "}<InlineMath>{"x"}</InlineMath>{":"}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{aligned}\n\\mathbb E[Y(x)]\n&=\\sum_z \\mathbb E[Y(x)\\mid X=x,Z=z]p(z)\\\\\n&=\\sum_z \\mathbb E[Y\\mid X=x,Z=z]p(z).\n\\end{aligned}"}</MathBlock></div>

<Prose>{""}<strong>{"Positivity"}</strong>{" requires "}<InlineMath>{"P(X=x\\mid Z=z)>0"}</InlineMath>{" for every target stratum needing that comparison. It makes the required observed conditional mean available. A causal graph satisfying the backdoor criterion can provide a reason for exchangeability; measured covariate balance or a good predictive fit alone does not prove it. These conditions address different links in the argument and should not be compressed into the phrase “adjusted for activity.”"}</Prose>

<C16 />

<Prose>{"The same average can be expressed as inverse-probability weighting. In the finite table the treated fractions within low/high activity are .2/.8. Give each treated record weights "}<InlineMath>{"1/.2=5"}</InlineMath>{" or "}<InlineMath>{"1/.8=1.25"}</InlineMath>{". For the untreated arm, the probabilities are .8/.2, giving weights 1.25/5. Low-activity treated users carry total weight 20×5=100, and high-activity treated users carry 80×1.25=100. Each arm now represents the same 200-user target composition. These are weighted contributions, not 200 newly observed people in each arm."}</Prose>

<Prose>{"For successes, the treated weighted sum is 4×5+32×1.25=60, and the untreated weighted sum is 8×1.25+6×5=40. Dividing each by the original target size 200 gives .30 and .20. This exact finite equality uses the stratum treatment fractions and target composition from this table. In general, a sample average with a population propensity model and a self-normalized weighted average need not coincide exactly; we distinguish those estimators in section 9."}</Prose>

<Prose>{"To see the population identity, write "}<InlineMath>{"e(z)=P(X=1\\mid Z=z)"}</InlineMath>{". Conditional on "}<InlineMath>{"Z=z"}</InlineMath>{", the indicator "}<InlineMath>{"X"}</InlineMath>{" selects treated outcomes, so"}</Prose>

<div className="neural-equation"><MathBlock>{"\\mathbb E\\!\\left[\\frac{XY}{e(Z)}\\mid Z=z\\right]\n=\\frac{P(X=1\\mid z)\\mathbb E[Y\\mid X=1,z]}{e(z)}\n=\\mathbb E[Y\\mid X=1,z]."}</MathBlock></div>

<Prose>{"Average this equality over the same "}<InlineMath>{"p(z)"}</InlineMath>{". The conditional treatment probability cancels, restoring the standardized treated mean. For the untreated mean, use "}<InlineMath>{"(1-X)Y/(1-e(Z))"}</InlineMath>{". Positivity makes the divisions meaningful; extreme weights explain why near-zero assignment probabilities can cause instability even before an exact zero occurs."}</Prose>

<C17 />

<Prose>{"Change the target high-activity share from .5 to .8. The model’s standardized risks become .2×.2+.8×.4=.36 and .2×.1+.8×.3=.26. Their difference remains .10 because this particular model gives the same effect in both strata. That invariance is a feature of this example, not a rule about target populations. With heterogeneous effects, changing target weights can change ATE. The investigation also edits assignment to reveal which observed cells support the target average; it keeps target weights separate from the selected-group compositions."}</Prose>

<C18 />

<Prose>{"If no low-activity users receive treatment but the target includes low-activity users, their observed treated conditional risk is unavailable. A fitted regression can still print a prediction there, but it is using an extrapolation assumption; it has not created treatment support. If the target gives that stratum zero weight, its unavailable risk is not required for that target mean. The support check therefore inspects "}<strong>{"positive-weight target strata"}</strong>{", rather than declaring every absent cell fatal for every question."}</Prose>

<Prose>{"A subgroup effect "}<InlineMath>{"\\mathbb E[Y(1)-Y(0)\\mid Z=z]"}</InlineMath>{" asks about that stratum. An effect among those actually treated uses their target composition under the relevant identification assumptions. The population ATE uses the original target composition. Changing the population distribution is also different from transporting effects into a setting where the outcome mechanism changes. A new weight vector does not establish that the old conditional causal effects still apply there."}</Prose>

<Prose>{"We have obtained an answer by making explicit causal and support assumptions. The next section asks the harder question: what if two systems satisfy our available observations but give different intervention answers?"}</Prose>

<H2>{"5. Ask what the observations determine"}</H2>

<C19 />

<Prose>{"Suppose sampling error disappeared and we knew every observed probability exactly. Could we then answer the offer question? Only if the causal assumptions and that observed law determine a unique answer. A query is "}<strong>{"identified"}</strong>{" when every compatible causal model gives the same answer. To prove a failure of identification, it is enough to construct two compatible models with the same observations and different intervention results."}</Prose>

<Prose>{"Here a hidden binary variable U is equally likely 0 or 1, and natural treatment is X=U. An independent uniform background V determines Y by comparing it with the displayed outcome risk. Both models have arrows U→X,U→Y,X→Y and use Y=1[V<risk(U,X)]. The risks differ only where natural assignment never takes us:"}</Prose>

<NeuralTable caption={"5. Ask what the observations determine"} headers={[<>{"Hidden U"}</>,<>{"X"}</>,<>{"Model A risk"}</>,<>{"Model B risk"}</>,<>{"Observed naturally?"}</>]} rows={[[<>{"0"}</>,<>{"0"}</>,<>{".20"}</>,<>{".20"}</>,<>{"Yes: X=U"}</>],[<>{"0"}</>,<>{"1"}</>,<>{".90"}</>,<>{".10"}</>,<>{"No"}</>],[<>{"1"}</>,<>{"0"}</>,<>{".10"}</>,<>{".90"}</>,<>{"No"}</>],[<>{"1"}</>,<>{"1"}</>,<>{".80"}</>,<>{".80"}</>,<>{"Yes: X=U"}</>]]} />

<Prose>{"Observation sees only the diagonal U=X. Both systems therefore produce the same measured joint probabilities: P(X0,Y0)=.40, P(X0,Y1)=.10, P(X1,Y0)=.10 and P(X1,Y1)=.40. Every measured X,Y cell is positive. Nevertheless, forcing X breaks its equality with U and uses the two formerly unobserved off-diagonal mechanisms."}</Prose>

<Prose>{"For model A, the forced untreated risk is (.20+.10)/2=.15 and forced treated risk is (.90+.80)/2=.85, giving ATE .70. For model B the risks are .55 and .45, giving ATE−.10. A more accurate predictor of the same observed X,Y law cannot choose between them. Measured overlap does not remove hidden confounding; it only says that the measured cells occur."}</Prose>

<Prose>{"The exact programme constructs the same observed law in both models, checks every cell is positive, and then averages the forced outcomes over hidden U. The intervention calculation is possible because the programme has the full model. An analyst observing only X and Y does not get those off-diagonal thresholds from the data."}</Prose>

<Prose>{"Save as "}<code>{"causal_nonidentification.py"}</code>{" and run "}<code>{"python causal_nonidentification.py"}</code>{" in the Python 3.12 standard-library environment introduced earlier."}</Prose>

<Prose>{""}<strong>{"Complete file: causal_nonidentification.py."}</strong>{" Save this listing and run "}<code>{"python causal_nonidentification.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"causal_nonidentification.py"} downloadUrl={"/learn-assets/causal-inference/causal_nonidentification.py"}>{"from fractions import Fraction as F\n\n# U is equally likely zero/one and X=U. Y=1[V < risk(U,X)] with independent V~Uniform(0,1).\n# Both models agree whenever X=U, the cells that observation can reveal.\nmodels = {\n    'A': [[F(1, 5), F(9, 10)], [F(1, 10), F(4, 5)]],\n    'B': [[F(1, 5), F(1, 10)], [F(9, 10), F(4, 5)]],\n}\nobserved_tables = []\nfor name, risk in models.items():\n    observed = {(x, y): F(1, 2) * (risk[x][x] if y else 1-risk[x][x])\n                for x in [0, 1] for y in [0, 1]}\n    observed_tables.append(observed)\n    do_risks = [sum(risk[u][x] for u in [0, 1]) / 2 for x in [0, 1]]\n    print(name, 'observed:', {key: str(value) for key, value in observed.items()})\n    print(name, 'do risks:', list(map(str, do_risks)), 'ATE:', do_risks[1]-do_risks[0])\nassert observed_tables[0] == observed_tables[1]\nassert all(value > 0 for value in observed_tables[0].values())\n"}</CodeBlock>

<CodeBlock language={"output"} kind={"output"} filename={"causal_nonidentification.py.stdout.txt"} downloadUrl={"/learn-assets/causal-inference/causal_nonidentification.py.stdout.txt"}>{"A observed: {(0, 0): '2/5', (0, 1): '1/10', (1, 0): '1/10', (1, 1): '2/5'}\nA do risks: ['3/20', '17/20'] ATE: 7/10\nB observed: {(0, 0): '2/5', (0, 1): '1/10', (1, 0): '1/10', (1, 1): '2/5'}\nB do risks: ['11/20', '9/20'] ATE: -1/10"}</CodeBlock>

<Prose>{"The output shows an identification failure, not a wide confidence interval. More observations of the same kind do not resolve it. Additional measurements, an intervention, or defensible mechanism restrictions could. Failure to find an adjustment set by itself is weaker evidence: another identification strategy might work. The next two sections give such a strategy, but first we can say exactly how much freedom remains without it."}</Prose>

<C20 />

<Prose>{"Binary outcomes and consistency alone already bound the ATE. Define p_xy=P(X=x,Y=y), where the first index is observed treatment. Treated successes contribute a known mass p_11 to E[Y(1)]. The untreated population, of mass P(X=0), has unobserved Y(1), each between 0 and 1. Therefore"}</Prose>

<div className="neural-equation"><MathBlock>{"p_{11}\\le E[Y(1)]\\le p_{11}+P(X=0)."}</MathBlock></div>

<Prose>{"Likewise, untreated successes contribute p_01 to E[Y(0)], and the treated population supplies an unknown contribution between 0 and P(X=1):"}</Prose>

<div className="neural-equation"><MathBlock>{"p_{01}\\le E[Y(0)]\\le p_{01}+P(X=1)."}</MathBlock></div>

<Prose>{"To minimize the difference, make the missing treated outcomes for untreated units 0 and the missing untreated outcomes for treated units 1. Reverse those assignments to maximize it:"}</Prose>

<div className="neural-equation"><MathBlock>{"p_{11}-p_{01}-P(X=1)\n\\;\\le\\; \\tau \\;\\le\\;\np_{11}+P(X=0)-p_{01}."}</MathBlock></div>

<C21 />

<Prose>{"For the positive observed law above, p_11=.40,p_01=.10 and P(X=1)=.50. The bounds are −.20 and .80. Both model effects .70 and −.10 lie inside. These endpoints are "}<strong>{"sharp"}</strong>{" under the stated assumptions: we can actually complete every missing binary potential outcome as described and attain either end while preserving all observed cells. Mixing compatible endpoint populations attains intermediate values too."}</Prose>

<Prose>{"The width is exactly 1: subtracting the two endpoints gives P(X=0)+P(X=1)=1. This does not mean every binary ATE is between these same endpoints; the location depends on the observed law. It also does not use conditional exchangeability, a graph-based adjustment restriction, monotonicity or randomization. Adding justified assumptions can narrow the compatible set."}</Prose>

<Prose>{"The original 200-user counts supply different empirical masses: p_11=36/200=.18,p_01=14/200=.07, with both treatment arms mass .50. Substituting those proportions gives a "}<strong>{"plug-in identification region"}</strong>{" [−.39,.61]. It is not a confidence interval for population endpoints. Sampling uncertainty about the masses is a separate statistical problem."}</Prose>

<Prose>{"The following standard-library implementation checks that all four cell probabilities are present, nonnegative and sum exactly to one. It uses Fraction for the endpoint arithmetic. The witness function explicitly fills the missing outcome for each observed cell and averages the completed individual effects; its agreement with an endpoint is a constructive check, not merely a second spelling of the same formula."}</Prose>

<Prose>{"Save as "}<code>{"causal_identification_bounds.py"}</code>{" and run "}<code>{"python causal_identification_bounds.py"}</code>{" in the Python 3.12 standard-library environment introduced earlier."}</Prose>

<Prose>{""}<strong>{"Complete file: causal_identification_bounds.py."}</strong>{" Save this listing and run "}<code>{"python causal_identification_bounds.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"causal_identification_bounds.py"} downloadUrl={"/learn-assets/causal-inference/causal_identification_bounds.py"}>{"\"\"\"Sharp binary-outcome bounds from observed masses and consistency alone.\n\nStandard library; exact fractions. These are population identification bounds,\nnot sampling-confidence limits. Treating sample proportions as masses gives\nplug-in endpoints and does not, by itself, quantify their sampling uncertainty.\n\"\"\"\nfrom fractions import Fraction as F\n\n\ndef bounds(joint):\n    if set(joint) != {(0, 0), (0, 1), (1, 0), (1, 1)}:\n        raise ValueError('Supply all four (treatment, observed outcome) cells.')\n    masses = {cell: F(value) for cell, value in joint.items()}\n    if any(p < 0 for p in masses.values()) or sum(masses.values()) != 1:\n        raise ValueError('Cell masses must be nonnegative and sum to one.')\n    treated = masses[1, 0] + masses[1, 1]\n    untreated = 1 - treated\n    known_y1 = masses[1, 1]\n    known_y0 = masses[0, 1]\n    return (known_y1 - known_y0 - treated,\n            known_y1 + untreated - known_y0)\n\n\ndef witness(joint, endpoint):\n    \"\"\"Complete each observed unit's missing outcome at a chosen endpoint.\"\"\"\n    if endpoint not in ('lower', 'upper'):\n        raise ValueError('Choose lower or upper.')\n    bounds(joint)  # Validate before constructing a consistent joint model.\n    total = F(0)\n    for (x, observed), mass in joint.items():\n        # Lower bound: missing Y(1)=0 and missing Y(0)=1. Reverse for upper.\n        y1 = observed if x == 1 else int(endpoint == 'upper')\n        y0 = observed if x == 0 else int(endpoint == 'lower')\n        total += F(mass) * (y1 - y0)\n    return total\n\n\ndef main():\n    examples = {\n        'positive observed law': {(0, 0): F(2, 5), (0, 1): F(1, 10),\n                                 (1, 0): F(1, 10), (1, 1): F(2, 5)},\n        '200-user empirical masses': {(0, 0): F(86, 200), (0, 1): F(14, 200),\n                                     (1, 0): F(64, 200), (1, 1): F(36, 200)},\n    }\n    for label, joint in examples.items():\n        lo, hi = bounds(joint)\n        print(label, 'bounds', str(lo), str(hi), 'width', str(hi - lo))\n        print('attained', str(witness(joint, 'lower')),\n              str(witness(joint, 'upper')))\n\n\nif __name__ == '__main__':\n    main()\n"}</CodeBlock>

<CodeBlock language={"output"} kind={"output"} filename={"causal_identification_bounds.py.stdout.txt"} downloadUrl={"/learn-assets/causal-inference/causal_identification_bounds.py.stdout.txt"}>{"positive observed law bounds -1/5 4/5 width 1\nattained -1/5 4/5\n200-user empirical masses bounds -39/100 61/100 width 1\nattained -39/100 61/100\n"}</CodeBlock>

<Prose>{"The first pair of printed endpoints concerns the exact declared population law; the second concerns empirical plug-in masses. Try another valid four-cell law and reconstruct its endpoint completions before using the function. All four keys are required even when a mass is zero. This binary four-cell problem has constant size; general partial-identification problems may require larger optimization models rather than this small formula."}</Prose>

<C22 />

<Prose>{"Choose model A or B and force X0 or X1. The measured joint table stays unchanged, while the forced outcome columns and ATE respond to the model. A third choice shows each sharp endpoint completion only after the preceding derivation has introduced it. Endpoint completions are separately labelled compatible potential-outcome populations; they are not silently presented as the particular threshold assignments of model A or B. Reset returns to model A and forced X1."}</Prose>

<Prose>{"The unchanged observations alongside changed answers are the mechanism of nonidentification. A lab that only changed a number labelled “bias” would hide the missing information we need to understand."}</Prose>

<H2>{"6. Transform an expression after testing its graph"}</H2>

<Prose>{"We now want to replace an intervention expression by quantities we can observe. "}<strong>{"Do-calculus"}</strong>{" gives three rules for changing an expression when a specific modified graph implies a conditional independence. The graph test and the actual intervention must remain distinct: a real action cuts incoming arrows, while one rule deliberately removes outgoing arrows only to diagnose whether action and observation can be exchanged."}</Prose>

<Prose>{"For these rules, X,Y,Z,W denote pairwise disjoint "}<strong>{"sets of nodes"}</strong>{", not necessarily single binary variables. X is the set of actions already in the expression; Z is the observation or additional action being changed; W is the observation retained; Y is the outcome query. Lowercase letters specify their values. A set can be empty. This local rule notation gives Z a different role from the earlier baseline-activity example; node names and role labels in each drawing make that explicit."}</Prose>

<C23 />

<Prose>{"Consider W→Z,W→Y,Z→X,X→Y. If X is already set, remove Z→X. Among units with W fixed, the remaining route Z←W→Y is blocked, so observing Z adds no information about Y in that intervention distribution. Adding Z→Y would leave an unblocked route and defeat this particular test."}</Prose>

<Prose>{"Write "}<InlineMath>{"G_{\\overline X}"}</InlineMath>{" for the graph after deleting arrows into X. A separation statement subscripted by a graph means apply the path rule in that graph. "}<strong>{"Rule 1"}</strong>{" inserts or deletes an observation:"}</Prose>

<div className="neural-equation"><MathBlock>{"p(y\\mid\\operatorname{do}(x),z,w)\n=p(y\\mid\\operatorname{do}(x),w)\n\\quad\\text{if}\\quad\n(Y\\perp Z\\mid X,W)_{G_{\\overline X}}."}</MathBlock></div>

<Prose>{"The condition concerns independence after the existing actions and retained observations; it does not say that Z is causally irrelevant in every expression. Every conditional event used must have positive probability for the values being compared."}</Prose>

<C24 />

<Prose>{"For Z→Y with common observed cause W→Z,W→Y, conditioning on W blocks the backdoor fork. To test whether setting Z can be replaced by observing it, remove Z's outgoing edge Z→Y temporarily. That removes its downstream influence from the independence test, leaving the question of association through other routes. A hidden fork Z←U→Y would remain open if no conditioned variable blocks it."}</Prose>

<Prose>{"Write "}<InlineMath>{"G_{\\underline Z}"}</InlineMath>{" for deletion of arrows out of Z. "}<strong>{"Rule 2"}</strong>{" exchanges action and observation:"}</Prose>

<div className="neural-equation"><MathBlock>{"p(y\\mid\\operatorname{do}(x),\\operatorname{do}(z),w)\n=p(y\\mid\\operatorname{do}(x),z,w)\n\\quad\\text{if}\\quad\n(Y\\perp Z\\mid X,W)_{G_{\\overline X,\\underline Z}}."}</MathBlock></div>

<Prose>{"There are two operations in the test graph: incoming X arrows disappear because of the existing action, and outgoing Z arrows disappear for the exchange test. The right-hand observational expression does not mean we physically removed Z's effect on Y."}</Prose>

<C25 />

<Prose>{"Deleting an action needs another careful qualification. First make "}<InlineMath>{"G_{\\overline X}"}</InlineMath>{". Of the proposed Z action nodes, keep in the set "}<InlineMath>{"Z(W)"}</InlineMath>{" only those that are "}<strong>{"not ancestors of any conditioned W node in that graph"}</strong>{". Only these eligible nodes have their incoming arrows removed for the next test. "}<strong>{"Rule 3"}</strong>{" inserts or deletes an action:"}</Prose>

<div className="neural-equation"><MathBlock>{"p(y\\mid\\operatorname{do}(x),\\operatorname{do}(z),w)\n=p(y\\mid\\operatorname{do}(x),w)\n\\quad\\text{if}\\quad\n(Y\\perp Z\\mid X,W)_{G_{\\overline X,\\overline{Z(W)}}}."}</MathBlock></div>

<Prose>{"If W is empty, every member of Z is eligible. If W is present, cutting every incoming Z edge could erase an association created by selecting W and incorrectly license the equality."}</Prose>

<Prose>{"The concrete witness is Y→Z→W with Y~Bernoulli(.5), Z=Y and W=Z. Setting downstream Z to 1 does not change the unconditional distribution of Y. But naturally W=1 selects exactly the Y=1 units; under do(Z=1), every unit has W=1, so selected Y has its population risk .5. The two conditional quantities are 1 and .5. Since Z is an ancestor of W, the correct test retains Y→Z and does not incorrectly declare separation."}</Prose>

<Prose>{"Save as "}<code>{"causal_rule_three.py"}</code>{" and run "}<code>{"python causal_rule_three.py"}</code>{" in the Python 3.12 standard-library environment introduced earlier."}</Prose>

<Prose>{""}<strong>{"Complete file: causal_rule_three.py."}</strong>{" Save this listing and run "}<code>{"python causal_rule_three.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"causal_rule_three.py"} downloadUrl={"/learn-assets/causal-inference/causal_rule_three.py"}>{"from fractions import Fraction as F\n\n# Y~Bernoulli(1/2), Z=Y, W=Z: graph Y -> Z -> W.\ndef distribution(forced_z=None):\n    return [(y, y if forced_z is None else forced_z, F(1, 2)) for y in [0, 1]]\n\ndef risk_given_w_one(rows):\n    selected = [(y, mass) for y, w, mass in rows if w == 1]\n    return sum(y*mass for y, mass in selected) / sum(mass for _, mass in selected)\n\nprint('unconditional P(Y=1):', F(1, 2))\nprint('unconditional P(Y=1 | do(Z=1)):', F(1, 2))\nprint('P(Y=1 | W=1):', risk_given_w_one(distribution()))\nprint('P(Y=1 | do(Z=1), W=1):', risk_given_w_one(distribution(1)))\n"}</CodeBlock>

<CodeBlock language={"output"} kind={"output"} filename={"causal_rule_three.py.stdout.txt"} downloadUrl={"/learn-assets/causal-inference/causal_rule_three.py.stdout.txt"}>{"unconditional P(Y=1): 1/2\nunconditional P(Y=1 | do(Z=1)): 1/2\nP(Y=1 | W=1): 1\nP(Y=1 | do(Z=1), W=1): 1/2"}</CodeBlock>

<Prose>{"The programme keeps a row for each Y value, then either passes it through the natural downstream copies or replaces Z. The filtering step uses the resulting W, so it explicitly exposes why the selected population changes. Its unconditional equalities and conditional inequalities are compatible: they answer different questions."}</Prose>

<C26 />

<Prose>{"Choose a complete rule fixture. The primary view shows the original and test graphs, actual removed edges, retained conditioning set and proposed equality. The selector and Reset are immediately below; an exact path/ancestor ledger follows. A valid graph test says the displayed equality is licensed under that graph. A failed test says this sufficient transformation failed, not that the whole causal query is unidentifiable. No arbitrary graph editor pretends to be a complete identification algorithm."}</Prose>

<C27 />

<Prose>{"Rule 1 changes an observation using the existing-action graph. Rule 2 exchanges action and observation using an additional outgoing-edge deletion. Rule 3 changes an action using its ancestor-qualified incoming-edge deletion. The purpose of the bar, underline and ancestor computation is to distinguish these actual operations, not to decorate an expression with notation."}</Prose>

<Prose>{""}<strong>{"Checkpoint."}</strong>{" In Y→Z→W while retaining W=1, may we cut Y→Z simply because the action we hope to delete is do(Z=1)? No. Z is an ancestor of conditioned W, so it is excluded from Z(W). The counterexample above would otherwise turn a false 1=.5 statement into a purported rule."}</Prose>

<Prose>{"These rules combine with ordinary probability operations such as marginalization. They are complete for standard nonparametric causal-effect identification in the appropriate causal DAG/latent-variable framework: when an effect is identifiable there, a suitable derivation exists. That does not make an unsuccessful hand derivation a proof of failure, or identify every counterfactual, selection or transport question under arbitrary extra functional assumptions. Complete ID algorithms and their graphical failure witnesses are a deeper route than this six-query investigation."}</Prose>

<H2>{"7. Identify through a measured mediator"}</H2>

<C28 />

<Prose>{"Return to treatment X and outcome Y. Hidden U affects both, so we cannot directly adjust for it. Now suppose an observed mediator M intercepts every causal route from X to Y: U→X,U→Y,X→M→Y. The question is whether measurements of X,M,Y can still determine the intervention."}</Prose>

<Prose>{"Three "}<strong>{"frontdoor conditions"}</strong>{" make the answer yes for the usual formula. First, every directed X→Y path passes through M; there is no extra direct X→Y edge. Second, every backdoor path from X to M is blocked without conditioning. Third, X blocks every backdoor path from M to Y. In this graph that last path is M←X←U→Y. The observed conditional factors also need support. Calling a measured variable a mediator does not establish these conditions."}</Prose>

<C29 />

<Prose>{"There is no unblocked backdoor path from X to M, so p(m|do(x))=p(m|x). For the effect of M on Y, adjust for X. Define the inner outcome mixture"}</Prose>

<div className="neural-equation"><MathBlock>{"r_m(y)=\\sum_{x'}p(y\\mid m,x')p(x')."}</MathBlock></div>

<Prose>{"The prime marks a dummy summation value: x' ranges over the original population treatment distribution. It is not held equal to the outer intervention x. The common population weights remove the selected X mixture behind the mediator-outcome comparison; substituting p(x'|m) would generally restore that selection."}</Prose>

<Prose>{"Use the stated finite model: U has equal shares; P(X=1|U)=.2/.8; P(M=1|X)=.1/.8; and outcome risk is .1+.5M+.2U. The observed treatment shares are .5/.5. For M0, the observed conditional risks within X0/X1 are .14/.26, so the inner mixture is .5×.14+.5×.26=.20. For M1 they are .64/.76, giving .70. These numbers come from P(U=1|X0)=.2 and P(U=1|X1)=.8; conditioning additionally on M does not change U within a fixed X in this declared model."}</Prose>

<C30 />

<Prose>{"Because X reaches Y only through M, mix those adjusted mediator outcomes using the mediator distribution induced by setting X:"}</Prose>

<div className="neural-equation"><MathBlock>{"p(y\\mid\\operatorname{do}(x))\n=\\sum_m p(m\\mid x)\\,r_m(y)."}</MathBlock></div>

<Prose>{"Forced X0 produces M1 with probability .1, so the risk is .9×.20+.1×.70=.25. Forced X1 produces M1 with probability .8, giving .2×.20+.8×.70=.60. The causal difference is .35. The raw observed risks are instead .19/.66, a difference .47; simply measuring a mediator has not made the original selected comparison causal."}</Prose>

<H3>{"Follow the graph transformations behind the two sums"}</H3>

<Prose>{"First marginalize over the mediator under the action:"}</Prose>

<div className="neural-equation"><MathBlock>{"p(y\\mid do(x))=\\sum_m p(y\\mid do(x),m)p(m\\mid do(x))."}</MathBlock></div>

<Prose>{"In the first factor, rule 2 exchanges observation of m for action do(m). Its test removes incoming X and outgoing M arrows; M and Y are separated given X. Next rule 3 deletes do(x) from p(y|do(x),do(m)). After M is set, X has no remaining directed route to Y; the test's incoming X cut also blocks the hidden fork. Thus"}</Prose>

<div className="neural-equation"><MathBlock>{"p(y\\mid do(x),m)\n=p(y\\mid do(x),do(m))\n=p(y\\mid do(m))."}</MathBlock></div>

<Prose>{"For the second factor, rule 2 gives p(m|do(x))=p(m|x), since deleting outgoing X arrows leaves no active X–M backdoor path. Finally expand p(y|do(m)) over X:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{aligned}\np(y\\mid do(m))\n&=\\sum_{x'}p(y\\mid do(m),x')p(x'\\mid do(m))\\\\\n&=\\sum_{x'}p(y\\mid m,x')p(x').\n\\end{aligned}"}</MathBlock></div>

<Prose>{"The last line uses two facts. Rule 3 removes the downstream action from p(x'|do(m)), because changing M does not affect X. Rule 2 exchanges action m for observation m in the outcome factor, because conditioning on X blocks the mediator's backdoor path. Substitution gives the two-sum formula with measured factors only. Each step depends on the stated graph, not just plausible algebra."}</Prose>

<C31 />

<Prose>{"The investigation shows the graph, the two actual sums, and the full model's intervention result together. Change the mediator probabilities to see which part of the outer mixture changes. Then add direct outcome contribution .1×X. The direct arrow violates the interception condition. The observed-data formula now gives .30/.65, while the full structural model gives .25/.70. The formula has not become a slightly less accurate estimator of the same identified effect; its identification argument has failed."}</Prose>

<Prose>{"The complete exact programme enumerates U,X,M,Y, forms observed conditional risks by numerator/denominator sums, computes the nested observed formula, and separately intervenes in the known model. Its two runs keep the same assignment and mediator mechanisms while changing only the direct path."}</Prose>

<Prose>{"Save as "}<code>{"causal_frontdoor.py"}</code>{" and run "}<code>{"python causal_frontdoor.py"}</code>{" in the Python 3.12 standard-library environment introduced earlier."}</Prose>

<Prose>{""}<strong>{"Complete file: causal_frontdoor.py."}</strong>{" Save this listing and run "}<code>{"python causal_frontdoor.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"causal_frontdoor.py"} downloadUrl={"/learn-assets/causal-inference/causal_frontdoor.py"}>{"from fractions import Fraction as F\nfrom itertools import product\n\nassignment, mediator = [F(1, 5), F(4, 5)], [F(1, 10), F(4, 5)]\n\ndef compare(direct):\n    def risk(u, m, x):\n        return F(1, 10) + F(1, 2)*m + F(1, 5)*u + direct*x\n    rows = []\n    for u, x, m, y in product([0, 1], repeat=4):\n        mass = F(1, 2) * (assignment[u] if x else 1-assignment[u])\n        mass *= mediator[x] if m else 1-mediator[x]\n        mass *= risk(u, m, x) if y else 1-risk(u, m, x)\n        rows.append((u, x, m, y, mass))\n    def conditional_y(m, x):\n        selected = [row for row in rows if row[1] == x and row[2] == m]\n        return sum(row[3]*row[4] for row in selected) / sum(row[4] for row in selected)\n    # Only observed X,M,Y probabilities occur in this calculation.\n    inner = [sum(conditional_y(m, x) * F(1, 2) for x in [0, 1]) for m in [0, 1]]\n    proposed = [(1-mediator[x])*inner[0] + mediator[x]*inner[1] for x in [0, 1]]\n    truth = [sum(F(1, 2)*((1-mediator[x])*risk(u, 0, x) + mediator[x]*risk(u, 1, x))\n                 for u in [0, 1]) for x in [0, 1]]\n    print('direct =', direct, '| inner =', list(map(str, inner)))\n    print('formula:', list(map(str, proposed)), '| true do:', list(map(str, truth)))\n    if direct == 0:\n        assert proposed == truth\n    else:\n        assert proposed != truth\n\ncompare(F(0))\ncompare(F(1, 10))\n"}</CodeBlock>

<CodeBlock language={"output"} kind={"output"} filename={"causal_frontdoor.py.stdout.txt"} downloadUrl={"/learn-assets/causal-inference/causal_frontdoor.py.stdout.txt"}>{"direct = 0 | inner = ['1/5', '7/10']\nformula: ['1/4', '3/5'] | true do: ['1/4', '3/5']\ndirect = 1/10 | inner = ['1/4', '3/4']\nformula: ['3/10', '13/20'] | true do: ['1/4', '7/10']"}</CodeBlock>

<Prose>{"At direct contribution 0, the programme checks exact agreement. At .1 it checks disagreement. The simulator can reveal the failure because its hidden mechanism is supplied; ordinary observational data cannot generally perform that truth comparison. Zero-probability conditioning cells require an unavailable result, not fabricated outcome risk 0."}</Prose>

<Prose>{"A delivered service, actuator response or biological measurement can be a useful intermediate mechanism. Accurate measurement alone does not establish frontdoor identification: an off-target path or hidden mediator-outcome common cause can invalidate the argument. Conversely, when the actual path conditions hold, a hidden X–Y confounder need not prevent this particular effect from being identified."}</Prose>

<H2>{"8. Keep the same unit in both worlds"}</H2>

<C32 />

<Prose>{"A population intervention asks what would happen under a policy. Now ask about a treated user who actually purchased: would that same user have failed to purchase without the offer? The observed evidence concerns an already selected unit, so replacing that unit by a fresh random person would answer a different question."}</Prose>

<Prose>{"For binary outcomes, the pair (Y(0),Y(1)) has four possible "}<strong>{"response types"}</strong>{": 00 fails in either condition; 01 succeeds only with treatment; 10 succeeds only without it; 11 succeeds in either. Give these types persistent labels and colours: 00 lavender,01 cyan,10 rose,11 amber. Their identity persists when we filter evidence or change treatment."}</Prose>

<C33 />

<Prose>{"Suppose randomized treatment identifies P(Y(0)=1)=.25 and P(Y(1)=1)=.75. Let r be the population mass of type11. The two marginal constraints then give type 10 mass .25−r and type 01 mass .75−r; the remaining type00 mass is r. Nonnegative masses require 0≤r≤.25. Every r in that interval gives the same marginal risks and ATE .50, while the pairing differs."}</Prose>

<Prose>{"For r=.125, all four masses are .125,.625,.125,.125. At r=.25, masses are .25,.50,0,.25. Both populations have 25% untreated successes and 75% treated successes. A randomized experiment can reveal those marginals without revealing which individual entries are paired across unobserved worlds."}</Prose>

<C34 />

<Prose>{"Because assignment is randomized in this example, observing X1 does not alter the prior type proportions. Observing success Y1 then retains only types 01 and 11, total mass .75. Renormalize: their posterior masses are (.75−r)/.75 and r/.75. To ask what would happen without treatment, keep that same posterior type and read its Y(0) column. Failure occurs only for type 01, so"}</Prose>

<div className="neural-equation"><MathBlock>{"P(Y(0)=0\\mid X=1,Y=1)=\\frac{.75-r}{.75}."}</MathBlock></div>

<Prose>{"At r=.125 this is .625/.75=5/6. At r=0 it is 1; at r=.25 it is 2/3. The answer varies even though the experimental marginal risks do not."}</Prose>

<Prose>{"This is "}<strong>{"abduction, action, prediction"}</strong>{" in a structural model. Abduction updates background types using the evidence. Action replaces the treatment assignment. Prediction evaluates the changed assignment with the same updated background distribution. Redrawing a fresh type after seeing the evidence discards what was learned about the particular unit."}</Prose>

<C35 />

<Prose>{"The only parameter here is r∈[0,.25], default .125. The four type masses, both marginal totals and the conditional counterfactual update together. The primary pair/filter picture precedes the r control and Reset; the posterior ledger follows. The displayed evidence stays X1,Y1 so the effect of changing the coupling remains visible without unrelated controls."}</Prose>

<Prose>{"Save as "}<code>{"causal_counterfactual.py"}</code>{" and run "}<code>{"python causal_counterfactual.py"}</code>{" in the Python 3.12 standard-library environment introduced earlier."}</Prose>

<Prose>{""}<strong>{"Complete file: causal_counterfactual.py."}</strong>{" Save this listing and run "}<code>{"python causal_counterfactual.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"causal_counterfactual.py"} downloadUrl={"/learn-assets/causal-inference/causal_counterfactual.py"}>{"from fractions import Fraction as F\n\nfor overlap in [F(0), F(1, 8), F(1, 4)]:\n    # Keys are the paired outcomes (Y(0),Y(1)), not independently redrawn outcomes.\n    types = {(0, 0): overlap, (0, 1): F(3, 4)-overlap,\n             (1, 0): F(1, 4)-overlap, (1, 1): overlap}\n    marginals = [sum(pair[x]*mass for pair, mass in types.items()) for x in [0, 1]]\n    # X was randomized. Evidence X=1,Y=1 therefore selects types with Y(1)=1.\n    compatible = {pair: mass for pair, mass in types.items() if pair[1] == 1}\n    evidence = sum(compatible.values())\n    posterior = {pair: mass/evidence for pair, mass in compatible.items()}\n    failure_without = sum(mass for pair, mass in posterior.items() if pair[0] == 0)\n    print('overlap', overlap, '| do risks', list(map(str, marginals)),\n          '| would fail without', failure_without)\n    assert marginals == [F(1, 4), F(3, 4)]\n    assert sum(posterior.values()) == 1\n"}</CodeBlock>

<CodeBlock language={"output"} kind={"output"} filename={"causal_counterfactual.py.stdout.txt"} downloadUrl={"/learn-assets/causal-inference/causal_counterfactual.py.stdout.txt"}>{"overlap 0 | do risks ['1/4', '3/4'] | would fail without 1\noverlap 1/8 | do risks ['1/4', '3/4'] | would fail without 5/6\noverlap 1/4 | do risks ['1/4', '3/4'] | would fail without 2/3"}</CodeBlock>

<Prose>{"The programme indexes the same pair by the treatment value; it never independently redraws the two outcomes. It retains compatible types, divides by their total mass, then reads the untreated entry. Its assertions check that both marginal risks stay .25/.75 and posterior masses sum to 1 for each chosen r. These are complete model calculations, not a discovery of individual effects from the experiment."}</Prose>

<Prose>{"If we additionally assume treatment never harms any unit, type 10 must have zero mass. This "}<strong>{"outcome monotonicity"}</strong>{" forces r=.25 and gives 2/3. A positive average effect does not imply that restriction: at r=.125, the average is positive while 12.5% of units are harmed. Later, instrumental variables use a different monotonicity statement about treatment receipt under encouragement; the two should not be conflated."}</Prose>

<Prose>{"The same distinction appears in diagnosing whether a particular component failure would have occurred under a different action. Population intervention risks and evidence-conditioned counterfactuals have different information requirements. Some counterfactuals are identifiable under additional assumptions, but a marginal intervention result alone does not identify every same-unit query."}</Prose>

<Prose>{"We have now separated the causal target from identification and from cross-world assumptions. Next we return to a target whose adjustment formula is justified and ask how to estimate it, correct imperfect models, and quantify sampling variation."}</Prose>

<H2>{"9. Estimate an identified quantity"}</H2>

<Prose>{"The adjustment argument tells us which population averages would answer the question. A dataset supplies noisy estimates of the factors in those averages. Return to the four constructed offer cells, where the sufficient baseline variable Z and the needed support are explicitly assumed. We will compare estimators of that same target before discussing what an interval can cover."}</Prose>

<C36 />

<Prose>{"The raw treated and untreated risks are 36/100 and 14/100, a difference .22. Standardization instead gives each activity stratum its target weight .5, producing treated .30, untreated .20 and difference .10. On individual records, inverse weighting computes"}</Prose>

<div className="neural-equation"><MathBlock>{"\\widehat\\tau_{\\rm IPW}\n=\\frac1n\\sum_{i=1}^n\\left[\n\\frac{X_iY_i}{\\widehat e(Z_i)}\n-\\frac{(1-X_i)Y_i}{1-\\widehat e(Z_i)}\n\\right]."}</MathBlock></div>

<Prose>{"Here e(z)=P(X=1|Z=z) is the "}<strong>{"propensity score"}</strong>{", the conditional probability of treatment. The denominator outside the sum is all 200 records, not the treated-arm size. The four successful-outcome contributions are treated low 4/.2=20, treated high 32/.8=40, untreated low 8/.8=10 and untreated high 6/.2=30. Thus the two weighted means are 60/200=.30 and 40/200=.20. Nonsuccesses contribute zero to these outcome totals but remain in the population denominator."}</Prose>

<Prose>{"This equality with standardization holds for this complete cell calculation. Different fitted models or finite samples need not give identical estimates. A treatment probability .05 creates weight 20, whereas .5 creates weight 2. A few surprising assignments can dominate a weighted estimate. Inspect the supported populations and weighted covariate balance. Clipping weights modifies the estimator; excluding poorly supported strata can change the target. Neither operation proves the identifying assumptions."}</Prose>

<H3>{"Correct an outcome prediction with its observed error"}</H3>

<Prose>{"Let "}<InlineMath>{"\\mu_x(z)=E[Y\\mid X=x,Z=z]"}</InlineMath>{" denote the true observed conditional mean. Write "}<InlineMath>{"m_x(z)"}</InlineMath>{" for a candidate prediction and "}<InlineMath>{"g(z)"}</InlineMath>{" for a candidate propensity, keeping the true propensity e distinct. These auxiliary models are called "}<strong>{"nuisance models"}</strong>{" because they help estimate the effect without being the final target."}</Prose>

<C37 />

<Prose>{"For a low-activity treated user who purchased, take the correct candidate values "}<InlineMath>{"m_0=.1,m_1=.2,g=.2"}</InlineMath>{". The predicted contrast is .1. That user's treated residual is "}<InlineMath>{"1-.2=.8"}</InlineMath>{", weighted by "}<InlineMath>{"1/.2"}</InlineMath>{", so their augmented contribution is "}<InlineMath>{".1+4=4.1"}</InlineMath>{". The untreated residual term is inactive because X=1. A contribution larger than one is possible: this is a correction score whose population average estimates a risk difference, not that user's outcome probability."}</Prose>

<Prose>{"For a low-activity untreated nonsuccess, the contribution is instead "}<InlineMath>{".1-(0-.1)/.8=.225"}</InlineMath>{". Only the observed treatment arm supplies an error; the other arm remains a prediction. Written together, the "}<strong>{"augmented inverse-propensity weighted score"}</strong>{", or AIPW score, is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\psi=m_1(Z)-m_0(Z)\n+\\frac{X\\{Y-m_1(Z)\\}}{g(Z)}\n-\\frac{(1-X)\\{Y-m_0(Z)\\}}{1-g(Z)}."}</MathBlock></div>

<Prose>{"Average this score over the target records. Require "}<InlineMath>{"0<g(z)<1"}</InlineMath>{" wherever the score is evaluated. A numerical denominator check is necessary but is not evidence that the real population has treatment support."}</Prose>

<C38 />

<Prose>{"If "}<InlineMath>{"m_x(z)=\\mu_x(z)"}</InlineMath>{", the observed residual has conditional mean zero within each treatment and baseline stratum. Multiplying that zero mean by a finite stratum weight still gives zero. The expected score then reduces to "}<InlineMath>{"\\mu_1(z)-\\mu_0(z)"}</InlineMath>{", even if g is wrong. This is a population expectation; an individual residual or small sample average does not have to be zero."}</Prose>

<C39 />

<Prose>{"The treated part alone has conditional expectation"}</Prose>

<div className="neural-equation"><MathBlock>{"E\\!\\left[m_1+\\frac{X(Y-m_1)}g\\middle|Z=z\\right]\n=m_1+\\frac e g(\\mu_1-m_1)."}</MathBlock></div>

<Prose>{"If g=e, the weighting removes the prediction error and leaves "}<InlineMath>{"\\mu_1"}</InlineMath>{". More generally, subtracting "}<InlineMath>{"\\mu_1"}</InlineMath>{" leaves"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{g-e}{g}(m_1-\\mu_1)."}</MathBlock></div>

<Prose>{"For the untreated mean, the discrepancy is "}<InlineMath>{"(e-g)(m_0-\\mu_0)/(1-g)"}</InlineMath>{". Subtracting the two means therefore gives a stratum effect discrepancy"}</Prose>

<div className="neural-equation"><MathBlock>{"(g-e)\\left[\\frac{m_1-\\mu_1}{g}\n+\\frac{m_0-\\mu_0}{1-g}\\right]."}</MathBlock></div>

<Prose>{"Correct propensities make the first factor zero; correct outcome means make the bracket zero. This "}<strong>{"double robustness"}</strong>{" offers two nuisance-model routes under the same identification assumptions. It cannot fix an unmeasured common cause or an ill-defined intervention."}</Prose>

<Prose>{"The exact programme enumerates all eight Z,X,Y population cells and weights each score by its actual probability. Its deliberately wrong propensity is .5 in both strata; its wrong outcome means are .15/.15 for low activity and .20/.20 for high activity. The population expected scores are .10 when both models are correct or either one alone is correct. With both wrong they give .19. These are population expectations; a finite-sample estimate need not equal them."}</Prose>

<Prose>{""}<strong>{"Complete file: causal_estimators.py."}</strong>{" Save this listing and run "}<code>{"python causal_estimators.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"causal_estimators.py"} downloadUrl={"/learn-assets/causal-inference/causal_estimators.py"}>{"from fractions import Fraction as F\nfrom itertools import product\n\ne = [F(1, 5), F(4, 5)]\nmu = [[F(1, 10), F(1, 5)], [F(3, 10), F(2, 5)]]\n\ndef expected_score(estimated_e, estimated_mu):\n    total = F(0)\n    for z, x, y in product([0, 1], repeat=3):\n        mass = F(1, 2) * (e[z] if x else 1-e[z]) * (mu[z][x] if y else 1-mu[z][x])\n        m0, m1 = estimated_mu[z]\n        value = m1-m0 + x*(y-m1)/estimated_e[z] - (1-x)*(y-m0)/(1-estimated_e[z])\n        total += mass*value\n    return total\n\nwrong_e = [F(1, 2), F(1, 2)]\nwrong_mu = [[F(3, 20), F(3, 20)], [F(1, 5), F(1, 5)]]\nfor label, propensity, outcome in [('both correct', e, mu), ('only propensity correct', e, wrong_mu),\n                                  ('only outcomes correct', wrong_e, mu), ('both wrong', wrong_e, wrong_mu)]:\n    value = expected_score(propensity, outcome)\n    print(label + ':', value)\n    if label != 'both wrong':\n        assert value == F(1, 10)\n"}</CodeBlock>

<CodeBlock language={"output"} kind={"output"} filename={"causal_estimators.py.stdout.txt"} downloadUrl={"/learn-assets/causal-inference/causal_estimators.py.stdout.txt"}>{"both correct: 1/10\nonly propensity correct: 1/10\nonly outcomes correct: 1/10\nboth wrong: 19/100"}</CodeBlock>

<C40 />

<Prose>{"Choose correct or wrong propensities and correct or wrong outcome means. The actual population remains fixed, so these choices isolate the candidate models. The initial state has both correct. The score components, IPW and regression-only estimates update together; Reset restores the correct pair. For the deliberately wrong pair, the stratum biases are 0 and .18, averaging to .09, so the augmented effect is .10+.09=.19. The full decomposition explains where the error enters."}</Prose>

<Prose>{"With fitted models, the same outcomes can be used both to train predictions and to evaluate corrections, causing overfitting problems. "}<strong>{"Cross-fitting"}</strong>{" splits records into folds: fit nuisance models on the other folds, score each held-out fold, then combine the scores. Appropriate overlap, nuisance estimation rates and uncertainty methods still matter. Cross-fitting is a procedure for separating fit and evaluation, not a substitute for the causal graph. The "}<a href={"https://www.pywhy.org/EconML/spec/estimation/dr.html"}>{"EconML doubly robust learning guide"}</a>{" develops this route beyond our exact population calculation."}</Prose>

<Prose>{""}<strong>{"Checkpoint."}</strong>{" Does an augmented estimate near .10 identify why a particular treated purchaser succeeded? No. The score estimates a population contrast under identification and estimation assumptions. Section 8 showed that same-unit counterfactual answers can differ while that population contrast remains fixed."}</Prose>

<H3>{"Quantify sampling variation under a stated design"}</H3>

<C41 />

<Prose>{"The original table has only 20 records in two of its cells. Suppose the four cell sizes are fixed and outcomes are independent within and between cells. A bootstrap replicate resamples the observed binary outcomes inside each cell, then recalculates the same standardized contrast. Resampling a cell with k successes among n records is equivalent to drawing n independent Bernoulli(k/n) outcomes. The replicate changes the success count; it does not redraw stratum membership, treatment membership or the .5/.5 target weights."}</Prose>

<C42 />

<Prose>{"The standard-library programme uses seed 18 and 5,000 replicates. It sorts the resulting estimates and linearly interpolates the 2.5th and 97.5th percentiles at positions "}<InlineMath>{"(B-1)p"}</InlineMath>{", where B is the number of draws. Its saved interval is [−.05, .2439], around an estimate .10."}</Prose>

<Prose>{""}<strong>{"Complete file: causal_uncertainty.py."}</strong>{" Save this listing and run "}<code>{"python causal_uncertainty.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"causal_uncertainty.py"} downloadUrl={"/learn-assets/causal-inference/causal_uncertainty.py"}>{"import math\nimport random\n\n# Fixed cell sizes and target population weights; outcomes are independent within/between cells.\ncells = [(20, 4), (80, 8), (80, 32), (20, 6)]  # low treated/control, high treated/control\nweights = [0.5, -0.5, 0.5, -0.5]\nobserved = sum(w*k/n for w, (n, k) in zip(weights, cells))\nrng = random.Random(18)\ndraws = []\nfor _ in range(5000):\n    # Resampling binary empirical outcomes in a fixed cell equals Bernoulli(k/n) draws.\n    estimates = [sum(rng.random() < k/n for _ in range(n))/n for n, k in cells]\n    draws.append(sum(w*rate for w, rate in zip(weights, estimates)))\ndraws.sort()\n\ndef percentile(p):\n    position = (len(draws)-1)*p\n    lower = math.floor(position)\n    upper = min(lower+1, len(draws)-1)\n    return draws[lower] + (position-lower)*(draws[upper]-draws[lower])\n\nprint('adjusted estimate:', round(observed, 4))\nprint('bootstrap 2.5% and 97.5%:', round(percentile(.025), 4), round(percentile(.975), 4))\nprint('Resamples:', len(draws))\n"}</CodeBlock>

<CodeBlock language={"output"} kind={"output"} filename={"causal_uncertainty.py.stdout.txt"} downloadUrl={"/learn-assets/causal-inference/causal_uncertainty.py.stdout.txt"}>{"adjusted estimate: 0.1\nbootstrap 2.5% and 97.5%: -0.05 0.2439\nResamples: 5000"}</CodeBlock>

<Prose>{"This is a percentile approximation for the specified fixed-cell sampling design, not an exact 95% coverage guarantee. It includes zero even though the point estimate is positive. It says nothing by itself about the bias from a missing confounder. Clustered records, estimated target weights, changing cell membership or a different sampling design require a corresponding resampling or inferential argument. We show only saved endpoints and the percentile construction here; no invented histogram stands in for unsaved replicates."}</Prose>

<H3>{"Fit the same four cells with an ordinary library"}</H3>

<C43 />

<Prose>{"The cell route estimates means directly. A fitted model gives another route to those same quantities. Expand the four cells in order (Z,X)=(0,0),(0,1),(1,0),(1,1), with sizes (80,20,20,80) and successes (8,4,6,32). Their records are a constructed teaching dataset, not an observed study."}</Prose>

<Prose>{"A binomial GLM for treatment uses intercept and Z. It has enough parameters for the two propensity values. A second binomial GLM for outcome uses the four columns "}<InlineMath>{"(1,X,Z,XZ)"}</InlineMath>{". The interaction XZ allows the treatment contrast to differ by stratum; with these four cells it is a saturated model. Both successes and failures occur in every cell, avoiding the infinite-logit estimates that perfect outcome separation can produce."}</Prose>

<Prose>{"To predict the untreated and treated means for every record, preserve its Z and replace X by 0 or 1 in the whole design, including XZ. For a high-activity record, the two outcome-design rows are "}<InlineMath>{"(1,0,1,0)"}</InlineMath>{" and "}<InlineMath>{"(1,1,1,1)"}</InlineMath>{". A prediction then uses the fitted logistic model. Average the two predicted means over the same 200 records, or combine them with the fitted propensity and observed residuals. All three fitted routes give .10 and agree with the manual counts to the programme's tolerance."}</Prose>

<Prose>{"The "}<a href={"https://www.statsmodels.org/stable/generated/statsmodels.genmod.generalized_linear_model.GLM.html"}>{"statsmodels GLM documentation"}</a>{" describes the response, design and family arguments. This programme supplies the intercept explicitly and selects the binomial family. Use Python 3.12 and install the recorded package versions before the complete listing: run "}<strong>{"python -m pip install numpy==2.3.5 statsmodels==0.15.0"}</strong>{" with that interpreter. Save the programme as "}<strong>{"causal-estimation-bridge.py"}</strong>{", then run "}<strong>{"python causal-estimation-bridge.py"}</strong>{"."}</Prose>

<Prose>{""}<strong>{"Complete file: causal-estimation-bridge.py."}</strong>{" Save this listing and run "}<code>{"python causal-estimation-bridge.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"causal-estimation-bridge.py"} downloadUrl={"/learn-assets/causal-inference/causal-estimation-bridge.py"}>{"\"\"\"From identifiable cell contrasts to fitted GLMs and the AIPW score.\r\n\r\nRun: python causal-estimation-bridge.py\r\nDependencies: numpy==2.3.5, statsmodels==0.15.0 (with its normal dependencies).\r\nThis constructed table illustrates estimation under a supplied valid backdoor\r\nset; a fitted regression cannot establish the causal assumptions. The saturated\r\nfour-cell model is small enough to check exactly. Flexible nuisance models need\r\nappropriate sample splitting/cross-fitting, not this in-sample demonstration.\r\n\"\"\"\r\nimport numpy as np\r\nimport statsmodels.api as sm\r\n\r\n\r\ndef expand_cells(sizes, successes):\r\n    \"\"\"Order: (Z,T)=(0,0),(0,1),(1,0),(1,1); binary outcomes.\"\"\"\r\n    sizes, successes = np.asarray(sizes), np.asarray(successes)\r\n    if (sizes.shape != (4,) or successes.shape != (4,)\r\n            or not np.issubdtype(sizes.dtype, np.integer)\r\n            or not np.issubdtype(successes.dtype, np.integer)\r\n            or np.any(sizes <= 0) or np.any(successes <= 0)\r\n            or np.any(successes >= sizes)):\r\n        raise ValueError(\"Use positive integer cell sizes with both outcomes in every cell\")\r\n    z = np.repeat([0., 0., 1., 1.], sizes)\r\n    treatment = np.repeat([0., 1., 0., 1.], sizes)\r\n    outcome = np.concatenate([np.r_[np.ones(y), np.zeros(n-y)]\r\n                              for n, y in zip(sizes, successes)])\r\n    return z, treatment, outcome\r\n\r\n\r\ndef scores(treatment, outcome, propensity, m0, m1):\r\n    \"\"\"Empirical target population; ordinary ATE weights, without clipping.\"\"\"\r\n    if np.any(propensity <= 0) or np.any(propensity >= 1):\r\n        raise ValueError(\"Overlap is required; clipping would change the estimator\")\r\n    regression = m1 - m0\r\n    weighted = treatment * outcome / propensity - (1-treatment) * outcome / (1-propensity)\r\n    augmented = regression + treatment * (outcome-m1) / propensity - (1-treatment) * (outcome-m0) / (1-propensity)\r\n    return np.array([regression.mean(), weighted.mean(), augmented.mean()])\r\n\r\n\r\ndef design(z, treatment):\r\n    return np.column_stack((np.ones(len(z)), treatment, z, treatment*z))\r\n\r\n\r\ndef estimate(sizes, successes):\r\n    z, treatment, outcome = expand_cells(sizes, successes)\r\n    cell = (2*z + treatment).astype(int)\r\n    counts = np.bincount(cell, minlength=4).reshape(2, 2)\r\n    means = (np.bincount(cell, weights=outcome, minlength=4) / counts.ravel()).reshape(2, 2)\r\n    strata = z.astype(int)\r\n    propensity = (counts[:, 1] / counts.sum(axis=1))[strata]\r\n    manual = scores(treatment, outcome, propensity, means[strata, 0], means[strata, 1])\r\n\r\n    propensity_fit = sm.GLM(treatment, sm.add_constant(z), family=sm.families.Binomial()).fit(tol=1e-12)\r\n    outcome_fit = sm.GLM(outcome, design(z, treatment), family=sm.families.Binomial()).fit(tol=1e-12)\r\n    if not propensity_fit.converged or not outcome_fit.converged:\r\n        raise RuntimeError(\"The GLM iteration did not converge\")\r\n    fitted_e = propensity_fit.predict(sm.add_constant(z))\r\n    fitted_m0 = outcome_fit.predict(design(z, np.zeros_like(z)))\r\n    fitted_m1 = outcome_fit.predict(design(z, np.ones_like(z)))\r\n    fitted = scores(treatment, outcome, fitted_e, fitted_m0, fitted_m1)\r\n    np.testing.assert_allclose(fitted_e, propensity, atol=1e-10)\r\n    np.testing.assert_allclose(fitted_m0, means[strata, 0], atol=1e-10)\r\n    np.testing.assert_allclose(fitted_m1, means[strata, 1], atol=1e-10)\r\n    return manual, fitted, float(outcome[treatment == 1].mean() - outcome[treatment == 0].mean())\r\n\r\n\r\ndef cell_bootstrap(sizes, successes, repetitions=2000, seed=41):\r\n    \"\"\"Conditional on four fixed cell sizes; not an unconditional cohort bootstrap.\"\"\"\r\n    sizes, successes = np.asarray(sizes), np.asarray(successes)\r\n    means = successes / sizes\r\n    z_weights = sizes.reshape(2, 2).sum(axis=1) / sizes.sum()\r\n    draws = np.random.default_rng(seed).binomial(sizes, means, size=(repetitions, 4)) / sizes\r\n    contrasts = (draws[:, [1, 3]] - draws[:, [0, 2]]) @ z_weights\r\n    return np.quantile(contrasts, [.025, .975])\r\n\r\n\r\ndef main():\r\n    sizes, successes = [80, 20, 20, 80], [8, 4, 6, 32]\r\n    manual, fitted, raw = estimate(sizes, successes)\r\n    np.testing.assert_allclose(manual, [.1, .1, .1], atol=1e-12)\r\n    np.testing.assert_allclose(fitted, manual, atol=1e-10)\r\n    print(\"unadjusted difference\", round(raw, 6))\r\n    print(\"manual g-computation/IPW/AIPW\", np.round(manual, 6).tolist())\r\n    print(\"fitted GLM g-computation/IPW/AIPW\", np.round(fitted, 6).tolist())\r\n    print(\"conditional cell-bootstrap 95% interval\", np.round(cell_bootstrap(sizes, successes), 6).tolist())\r\n    changed, library, _ = estimate([60, 30, 40, 70], [6, 9, 12, 35])\r\n    np.testing.assert_allclose(changed, library, atol=1e-10)\r\n    print(\"changed target-population estimates\", np.round(changed, 6).tolist())\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()\r\n"}</CodeBlock>

<CodeBlock language={"output"} kind={"output"} filename={"causal-estimation-bridge.py.stdout.txt"} downloadUrl={"/learn-assets/causal-inference/causal-estimation-bridge.py.stdout.txt"}>{"unadjusted difference 0.22\nmanual g-computation/IPW/AIPW [0.1, 0.1, 0.1]\nfitted GLM g-computation/IPW/AIPW [0.1, 0.1, 0.1]\nconditional cell-bootstrap 95% interval [-0.05625, 0.25]\nchanged target-population estimates [0.2, 0.2, 0.2]"}</CodeBlock>

<Prose>{"The first output is the selected raw difference .22. The next two arrays are, in order, g-computation, IPW and AIPW. The bridge's separate seed-41, 2,000-replicate binomial bootstrap produces [−.05625,.25]. It targets the same fixed-cell design but is a different finite Monte Carlo calculation from the earlier seed-18 result; the endpoints need not coincide exactly."}</Prose>

<Prose>{"The last result changes cell sizes to (60,30,40,70) and successes to (6,9,12,35). Its empirical stratum shares become .45/.55 and its two within-stratum contrasts are both .20. Thus all three estimates are .20. The supplied input checks require positive cell sizes and both outcomes in every cell for this saturated GLM demonstration. The score also rejects candidate propensities at 0 or 1 rather than silently clipping them. Removing a treatment cell prevents the nonparametric adjustment; removing only one outcome type is a different problem for this finite-logit fitting route."}</Prose>

<Prose>{"Cell aggregation and score evaluation take linear work in the number of records. Regression adds fitting and matrix-conditioning costs; this four-column example is deliberately small. A flexible high-dimensional model requires a fuller design for nuisance fitting, sample separation and inference. Agreement between two software routes validates their arithmetic on this fixture, not its causal assumptions."}</Prose>

<Prose>{"We have followed a fully declared teaching population. Next we apply the same standardization idea to historical measurements, where time, missing outcomes, model choices and the target population must be stated explicitly."}</Prose>

<H2>{"10. Follow an actual observed-data workflow"}</H2>

<Prose>{"The offer examples let us inspect a small set of known probabilities or constructed counts. With observed data, the arithmetic can still be transparent even when the causal assumptions cannot be verified from a table. We will follow one analysis from recorded variables to fitted means, population averaging and sampling variation."}</Prose>

<Prose>{"The question is how weight change differs under quitting versus not quitting smoking before follow-up. The public teaching file comes from the NHANES I Epidemiologic Follow-up Study, or "}<strong>{"NHEFS"}</strong>{", collected by the US National Center for Health Statistics and provided as a subset with Hernán and Robins's *Causal Inference: What If*. Baseline examinations occurred in 1971–75; the file's variable names use 1971 and 1982 for baseline and follow-up. Weight change is follow-up weight minus baseline weight, in kilograms. These are historical observational records. The "}<a href={"https://wwwn.cdc.gov/nchs/nhanes/nhefs/"}>{"CDC study description"}</a>{" and the "}<a href={"https://miguelhernan.org/whatifbook"}>{"book's data and codebook links"}</a>{" document their origin."}</Prose>

<H3>{"First locate treatment, outcome and selection in time"}</H3>

<Prose>{"Call the recorded quitting indicator "}<strong>{"A"}</strong>{", using A=1 for "}<code>{"qsmk=1"}</code>{" and A=0 for "}<code>{"qsmk=0"}</code>{". This is the treatment role previously denoted X; the letter changes to match this analysis. Write "}<strong>{"Y"}</strong>{" for "}<code>{"wt82_71"}</code>{", the weight change. Let "}<strong>{"L"}</strong>{" collect nine measured baseline covariates. Finally, let "}<strong>{"R=1"}</strong>{" mean that this file contains a finite observed weight-change outcome, and R=0 mean it is missing. R describes observation, not zero weight gain."}</Prose>

<Prose>{"Follow the timing and record counts before fitting anything."}</Prose>

<C44 />

<Prose>{"The file has 1,629 records with the required treatment and baseline fields. Of these, 1,566 have observed outcomes and 63 do not. Among the 1,201 non-quitters, 1,163 outcomes are observed and 38 are missing. Among the 428 quitters, 403 are observed and 25 are missing. Both treatment groups contribute covariate records to the population we will average over; only observed outcomes can contribute a squared-error term to the fit."}</Prose>

<Prose>{"There is another selection before these 63 missing outcomes. The teaching file already selects people with the follow-up information needed to classify quitting. Reporting quitting by follow-up depends on surviving and responding to that follow-up. People also quit at different times. Coding all of those histories as A=1 does not turn them into assignment to one clearly timed intervention at baseline. An analysis of an actual intervention would have to align eligibility, treatment strategies, follow-up and outcome definitions. Averaging over all 1,629 available rows cannot restore people who were excluded before this file was formed."}</Prose>

<Prose>{"We therefore begin with an explicit statistical calculation: estimate the conditional mean among observed outcomes, then average that fitted mean over the baseline covariates of all 1,629 records. This empirical covariate distribution is the "}<strong>{"target"}</strong>{" for our calculation. It is not the full original NHEFS cohort or the US population."}</Prose>

<H3>{"State the assumptions before interpreting an adjusted difference"}</H3>

<Prose>{"For each treatment value a, define the observed-outcome regression function"}</Prose>

<div className="neural-equation"><MathBlock>{"m(a,l)=E[Y\\mid A=a,R=1,L=l]."}</MathBlock></div>

<Prose>{"The conditioning on R=1 matters: this is the mean the outcome data directly inform. To relate it to the potential outcome Yᵃ for the selected target, we would need the following assumptions, with all probabilities understood within that target:"}</Prose>

<ul><li>{""}<strong>{"Treatment exchangeability:"}</strong>{" Yᵃ is independent of A given L. Within a baseline stratum, treatment selection must not retain information about that potential outcome."}</li><li>{""}<strong>{"Outcome-observation exchangeability:"}</strong>{" Yᵃ is independent of R given A=a and L. Among records with the same treatment and covariates, observed outcomes must represent the mean of the outcomes that are missing as well."}</li><li>{""}<strong>{"Support:"}</strong>{" at target covariate values, both P(A=a | L=l)>0 and P(R=1 | A=a,L=l)>0 are needed for each treatment arm. A fitted regression can print a number outside observed support; that extrapolation does not create the missing comparison."}</li><li>{""}<strong>{"Consistency and the specified intervention:"}</strong>{" observed Y equals the corresponding Yᵃ, with treatment versions and interference handled as required by the question. The timing and selected-cohort limitations just described remain substantive obstacles, not something a regression diagnostic checks."}</li></ul>

<Prose>{"Here is the mean-level reasoning, one equality at a time:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{aligned}\nE[Y^a\\mid L=l]\n&=E[Y^a\\mid A=a,L=l] \\\\\n&=E[Y^a\\mid A=a,R=1,L=l] \\\\\n&=E[Y\\mid A=a,R=1,L=l].\n\\end{aligned}"}</MathBlock></div>

<Prose>{"The first step uses treatment exchangeability, the second observation exchangeability, and the last consistency. Support makes the observed conditional quantity available. Averaging over the target distribution of L then gives the standardization formula. Our finite-sample implementation also assumes that its chosen regression form adequately describes this conditional mean. Neither a good numerical fit nor agreement between two software packages establishes these causal and observation assumptions."}</Prose>

<H3>{"Turn nine covariates into the actual regression columns"}</H3>

<Prose>{"The nine baseline covariates are sex, race, age, weight, daily smoking intensity, years of smoking, education, recreational exercise and usual daily activity. They play different roles as recorded variables and must be decoded before numbers become columns."}</Prose>

<Prose>{"The accompanying codebook uses the following category labels. They are quoted as recorded coding conventions: "}<code>{"sex"}</code>{" is 0 “MALE”, 1 “FEMALE”; "}<code>{"race"}</code>{" is 0 “WHITE”, 1 “BLACK OR OTHER”. These historical categories are coarse measurement labels, not a biological explanation of an outcome difference. We retain their coding to reproduce this analysis rather than silently assigning the codes different meanings."}</Prose>

<Prose>{"For "}<code>{"education"}</code>{", the original categories are 1 “8TH GRADE OR LESS”, 2 “HS DROPOUT”, 3 “HS”, 4 “COLLEGE DROPOUT”, and 5 “COLLEGE OR MORE”. Recreational "}<code>{"exercise"}</code>{" is 0 “much exercise”, 1 “moderate exercise”, 2 “little or no exercise”. Usual "}<code>{"active"}</code>{" is 0 “very active”, 1 “moderately active”, 2 “inactive”. These definitions come from the "}<a href={"https://miguelhernan.org/s/NHEFS_Codebook.xls"}>{"NHEFS teaching codebook"}</a>{". A category code is not a claim that adjacent categories are equally far apart."}</Prose>

<Prose>{"The design uses indicators for categories rather than treating education code 5 as five times code 1. For example, the education=3 column is 1 for that category and 0 otherwise. Education=1 is the reference: its four nonreference indicator columns are all zero. Exercise=0 and active=0 are their corresponding references. With an intercept, adding every category indicator would create a redundant column."}</Prose>

<Prose>{"The four continuous variables are age in years, baseline weight in kg, cigarettes per day and years of smoking. Each is divided by 10 and then squared to provide both a linear and quadratic term. These are fixed unit scalings; the programme does not learn a mean or standard deviation from the data. Scaling changes coefficient units while retaining the same class of quadratic response surfaces."}</Prose>

<Prose>{"Read one recorded covariate row through all three design rows: actual treatment for fitting, then forced treatment 0 and forced treatment 1 for prediction."}</Prose>

<C45 />

<Prose>{"The 21 columns appear in this exact order:"}</Prose>

<NeuralTable caption={"Turn nine covariates into the actual regression columns"} headers={[<>{"Columns"}</>,<>{"Entries"}</>,<>{"Count"}</>]} rows={[[<>{"1–4"}</>,<>{"intercept, A, sex, race"}</>,<>{"4"}</>],[<>{"5–12"}</>,<>{"age/10 and its square; weight/10 and its square; smoking intensity/10 and its square; smoking years/10 and its square"}</>,<>{"8"}</>],[<>{"13–16"}</>,<>{"education=2, =3, =4, =5"}</>,<>{"4"}</>],[<>{"17–18"}</>,<>{"exercise=1, =2"}</>,<>{"2"}</>],[<>{"19–20"}</>,<>{"active=1, =2"}</>,<>{"2"}</>],[<>{"21"}</>,<>{"A × smoking intensity/10"}</>,<>{"1"}</>]]} />

<Prose>{"The last column allows the fitted quitting contrast to vary with baseline smoking intensity. It is an "}<strong>{"interaction"}</strong>{" because its contribution depends on both treatment and another input. If the coefficient of A is βA and the interaction coefficient is βAS, then, holding the other columns fixed,"}</Prose>

<div className="neural-equation"><MathBlock>{"\\widehat m(1,L_i)-\\widehat m(0,L_i)\n=\\widehat\\beta_A+\\widehat\\beta_{AS}\\,\\frac{s_i}{10},"}</MathBlock></div>

<Prose>{"where sᵢ is cigarettes per day at baseline. Under this particular model all the non-treatment terms cancel in that row's contrast. The model imposes this form; it does not discover unrestricted individual treatment effects."}</Prose>

<Prose>{"For the first stored row, age is 42, baseline weight 79.04 kg, smoking intensity 30 cigarettes/day and smoking duration 29 years. Its scaled continuous entries are 4.2, 7.904, 3 and 2.9; the squared entries are 17.64, 62.473216, 9 and 8.41. Its recorded A=0, sex=0, race=1, education=1, exercise=2 and active=0. In the forced-0 row, A and the interaction are 0 and 0. In the forced-1 row, they become 1 and 3. Every other entry stays fixed. Changing only A while leaving its interaction at zero would ask the fitted model an inconsistent question."}</Prose>

<H3>{"Fit once, predict twice, average over one common target"}</H3>

<Prose>{"Let Z be the matrix of actual 21-column rows. Least squares chooses coefficients to minimize the sum of squared differences between observed weight changes and Zᵢβ, using only Rᵢ=1 rows:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\widehat\\beta\n=\\mathop{\\arg\\min}_{\\beta}\n\\sum_{i:R_i=1}(Y_i-Z_i\\beta)^2."}</MathBlock></div>

<Prose>{"The programme uses NumPy's "}<code>{"lstsq"}</code>{" to solve this existing linear-algebra problem, checks that the returned rank is 21, and rejects a rank-deficient design. It then evaluates two new matrices, Z⁰ and Z¹, whose rows contain the same covariates with the consistent forced-treatment entries. The products Z⁰β̂ and Z¹β̂ supply two fitted conditional means per target row. The full-rank result checks the numerical design, not the completeness of confounding control."}</Prose>

<Prose>{"The first row's fitted means are 4.143747 kg and 8.103226 kg. Their difference is about 3.959479 kg. These two predictions are conditional means for that covariate pattern. They are not the person's two observed outcomes, and they do not recover the same-unit pairing discussed in section 8."}</Prose>

<Prose>{"Average each prediction column over the same 1,629 rows:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\widehat\\psi_a\n=\\frac{1}{1629}\\sum_{i=1}^{1629}\\widehat m(a,L_i),\n\\qquad\n\\widehat\\Delta=\\widehat\\psi_1-\\widehat\\psi_0."}</MathBlock></div>

<Prose>{"The 63 records with missing outcomes contribute their L values to this average. They do not receive fabricated observed Y values, and they were not used in the fitted squared-error sum. The fitted function supplies mean predictions for their covariate patterns under the same observation/model assumptions as for the other rows."}</Prose>

<C46 />

<Prose>{"The stored calculation gives 1.660267 kg for forced non-quitting and 5.178841 kg for forced quitting, hence a model-standardized contrast of 3.518574 kg. The raw observed-group means were 1.984498 and 4.525079 kg, a difference of about 2.540581 kg. The raw comparison averages different covariate distributions among observed outcomes. Standardization averages both fitted treatment means over one common distribution. The increase in the adjusted contrast is a result of this fitted model and target, not a general rule that adjustment must increase an effect."}</Prose>

<H3>{"Change the target separately from changing the model"}</H3>

<Prose>{"Keep the same fitted coefficients but average only over the 1,566 complete-outcome rows. The two means become 1.756213 and 5.273587 kg, giving a contrast of approximately 3.517374 kg. This changes the target covariate distribution; it does not refit the outcome model. Here both arm means move while their difference changes little. In a more heterogeneous model or a differently selected target, the contrast can change substantially. Similar numbers do not make the targets interchangeable."}</Prose>

<Prose>{"Now return to all 1,629 target rows, remove the four squared continuous terms and refit. The indicator columns and treatment×smoking-intensity interaction remain. This linear-only specification has 17 columns and gives a contrast of 3.434108 kg. Here the target is fixed while the regression family changes. It is a model-sensitivity comparison, not a test that certifies either family. The response surface still includes categorical effects and an interaction; “linear-only” refers to omitting those four continuous-variable squares."}</Prose>

<H3>{"Follow the complete implementation through an ordinary tool"}</H3>

<Prose>Download the <a href="/learn-assets/causal-inference/nhefs.csv">unchanged NHEFS teaching CSV</a>, its <a href="/learn-assets/causal-inference/nhefs-provenance.json">source and licence record</a>, and the <a href="/learn-assets/causal-inference/nhefs-standardization-result.json">stored numerical results and bootstrap estimates</a>.</Prose>

<Prose>{"Save the complete programme as "}<code>{"causal_nhefs_standardization.py"}</code>{" and the supplied unchanged CSV as "}<code>{"nhefs.csv"}</code>{". Use Python 3.12 and install the recorded versions with "}<code>{"python -m pip install numpy==2.3.5 scikit-learn==1.9.1"}</code>{", then run "}<code>{"python causal_nhefs_standardization.py nhefs.csv"}</code>{". Add "}<code>{"--json-output results.json"}</code>{" to retain the complete numerical result and all bootstrap estimates. The recorded run used NumPy 2.3.5 and scikit-learn 1.9.1. Last digits and numerical diagnostics can depend on the environment."}</Prose>

<Prose>{""}<strong>{"Complete file: causal_nhefs_standardization.py."}</strong>{" Save this listing and run "}<code>{"python causal_nhefs_standardization.py nhefs.csv"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"causal_nhefs_standardization.py"} downloadUrl={"/learn-assets/causal-inference/causal_nhefs_standardization.py"}>{"\"\"\"Standardize a fitted outcome model over the public NHEFS teaching cohort.\n\nDownload nhefs.csv from https://miguelhernan.org/s/nhefs.csv.\nRun: python causal_nhefs_standardization.py nhefs.csv\nDependencies: NumPy and scikit-learn. See the lesson for identification,\ncensoring, target-population and working iid bootstrap assumptions.\n\"\"\"\n\nimport argparse\nimport csv\nimport hashlib\nimport json\nfrom pathlib import Path\n\nimport numpy as np\nfrom sklearn.linear_model import LinearRegression\n\n\nCONTINUOUS = (\"age\", \"wt71\", \"smokeintensity\", \"smokeyrs\")\nCATEGORIES = {\"education\": (1, 2, 3, 4, 5),\n              \"exercise\": (0, 1, 2), \"active\": (0, 1, 2)}\nREQUIRED = (\"qsmk\", \"sex\", \"race\", *CONTINUOUS, *CATEGORIES)\n\n\ndef read_cohort(path):\n    with Path(path).open(newline=\"\", encoding=\"utf-8-sig\") as stream:\n        rows = list(csv.DictReader(stream))\n    if not rows:\n        raise ValueError(\"The cohort must contain records.\")\n    columns = {key: np.array([float(row[key]) for row in rows])\n               for key in REQUIRED}\n    outcome = np.array([float(row[\"wt82_71\"]) if row[\"wt82_71\"] else np.nan\n                        for row in rows])\n    if not all(np.isfinite(values).all() for values in columns.values()):\n        raise ValueError(\"Baseline covariates and treatment must be observed.\")\n    for key in (\"qsmk\", \"sex\", \"race\"):\n        if not np.isin(columns[key], (0, 1)).all():\n            raise ValueError(f\"Unexpected binary code in {key}.\")\n    for key, levels in CATEGORIES.items():\n        if not np.isin(columns[key], levels).all():\n            raise ValueError(f\"Unexpected category in {key}.\")\n    if np.isinf(outcome).any():\n        raise ValueError(\"An observed outcome must be finite.\")\n    return columns, outcome\n\n\ndef design(columns, treatment=None, quadratic=True):\n    \"\"\"Keep the same covariates; replace only treatment and its interaction.\"\"\"\n    a = columns[\"qsmk\"] if treatment is None else np.full_like(\n        columns[\"qsmk\"], float(treatment))\n    values = [np.ones(len(a)), a, columns[\"sex\"], columns[\"race\"]]\n    names = [\"intercept\", \"qsmk\", \"sex\", \"race\"]\n    for key in CONTINUOUS:\n        # Fixed units improve conditioning; this is not a learned transformation.\n        scaled = columns[key] / 10\n        values.append(scaled)\n        names.append(key + \"/10\")\n        if quadratic:\n            values.append(scaled ** 2)\n            names.append(\"(\" + key + \"/10)^2\")\n    for key, levels in CATEGORIES.items():\n        for level in levels[1:]:\n            values.append((columns[key] == level).astype(float))\n            names.append(f\"{key}={level}\")\n    values.append(a * columns[\"smokeintensity\"] / 10)\n    names.append(\"qsmk * smokeintensity/10\")\n    return np.column_stack(values), names\n\n\ndef fit_and_standardize(actual, zero, one, outcome, target_rows=None):\n    \"\"\"Fit observed outcomes, then average two fitted means over the target.\"\"\"\n    observed = np.isfinite(outcome)\n    if observed.sum() <= actual.shape[1]:\n        raise ValueError(\"Too few observed outcomes for this design.\")\n    beta, _, rank, singular = np.linalg.lstsq(\n        actual[observed], outcome[observed], rcond=None)\n    if rank != actual.shape[1]:\n        raise ValueError(\"The outcome design is not full column rank.\")\n    predictions = np.column_stack((zero @ beta, one @ beta))\n    target = predictions if target_rows is None else predictions[target_rows]\n    means = target.mean(axis=0)\n    return {\"beta\": beta, \"predictions\": predictions, \"means\": means,\n            \"difference\": float(means[1] - means[0]), \"rank\": int(rank),\n            \"condition\": float(singular[0] / singular[-1])}\n\n\ndef bootstrap(actual, zero, one, outcome, repetitions=1000, seed=20261009):\n    \"\"\"Resample complete records, refit, and average over each resampled cohort.\"\"\"\n    rng = np.random.default_rng(seed)\n    estimates = np.empty(repetitions)\n    for b in range(repetitions):\n        ids = rng.integers(0, len(outcome), size=len(outcome))\n        estimates[b] = fit_and_standardize(\n            actual[ids], zero[ids], one[ids], outcome[ids])[\"difference\"]\n    return estimates\n\n\ndef analyze(path):\n    columns, outcome = read_cohort(path)\n    observed = np.isfinite(outcome)\n    actual, names = design(columns)\n    zero, _ = design(columns, treatment=0)\n    one, _ = design(columns, treatment=1)\n    fitted = fit_and_standardize(actual, zero, one, outcome)\n    library = LinearRegression(fit_intercept=False).fit(\n        actual[observed], outcome[observed])\n    library_predictions = np.column_stack((library.predict(zero), library.predict(one)))\n    difference = float(np.max(np.abs(library_predictions - fitted[\"predictions\"])))\n    if difference > 1e-8:\n        raise ArithmeticError(\"The two regression routes disagree.\")\n    linear, _ = design(columns, quadratic=False)\n    linear_zero, _ = design(columns, treatment=0, quadratic=False)\n    linear_one, _ = design(columns, treatment=1, quadratic=False)\n    changed = fit_and_standardize(linear, linear_zero, linear_one, outcome)\n    estimates = bootstrap(actual, zero, one, outcome)\n    by_treatment = []\n    for a in (0, 1):\n        group = columns[\"qsmk\"] == a\n        measured = group & observed\n        by_treatment.append({\"qsmk\": a, \"records\": int(group.sum()),\n                             \"observed\": int(measured.sum()),\n                             \"missing\": int((group & ~observed).sum()),\n                             \"observed_mean\": float(outcome[measured].mean())})\n    # These are model means for a selected covariate row, not two observed outcomes.\n    row = 0\n    return {\n        \"data_sha256\": hashlib.sha256(Path(path).read_bytes()).hexdigest(),\n        \"records\": len(outcome), \"observed_outcomes\": int(observed.sum()),\n        \"missing_outcomes\": int((~observed).sum()), \"by_treatment\": by_treatment,\n        \"features\": names, \"rank\": fitted[\"rank\"], \"condition\": fitted[\"condition\"],\n        \"standardized_means_all_rows\": fitted[\"means\"].tolist(),\n        \"standardized_difference\": fitted[\"difference\"],\n        \"standardized_means_complete_rows\": fitted[\"predictions\"][observed].mean(axis=0).tolist(),\n        \"linear_only_difference\": changed[\"difference\"],\n        \"library_max_prediction_error\": difference,\n        \"first_row\": {key: float(columns[key][row]) for key in REQUIRED},\n        \"first_row_model_means\": fitted[\"predictions\"][row].tolist(),\n        \"bootstrap\": {\"seed\": 20261009, \"repetitions\": len(estimates),\n                      \"standard_error\": float(estimates.std(ddof=1)),\n                      \"percentile_95\": np.quantile(estimates, [.025, .975]).tolist(),\n                      \"estimates\": estimates.tolist()},\n    }\n\n\ndef main():\n    parser = argparse.ArgumentParser()\n    parser.add_argument(\"csv\", type=Path)\n    parser.add_argument(\"--json-output\", type=Path)\n    args = parser.parse_args()\n    result = analyze(args.csv)\n    print(\"records / observed / missing:\", result[\"records\"],\n          result[\"observed_outcomes\"], result[\"missing_outcomes\"])\n    for group in result[\"by_treatment\"]:\n        print(\"qsmk\", group[\"qsmk\"], \"records\", group[\"records\"],\n              \"observed\", group[\"observed\"], \"missing\", group[\"missing\"],\n              \"observed mean\", round(group[\"observed_mean\"], 6))\n    print(\"design columns / rank:\", len(result[\"features\"]), result[\"rank\"])\n    print(\"standardized means:\", np.round(result[\"standardized_means_all_rows\"], 6).tolist())\n    print(\"standardized difference:\", round(result[\"standardized_difference\"], 6))\n    print(\"complete-row target means:\", np.round(result[\"standardized_means_complete_rows\"], 6).tolist())\n    print(\"linear-only difference:\", round(result[\"linear_only_difference\"], 6))\n    print(\"first-row model means:\", np.round(result[\"first_row_model_means\"], 6).tolist())\n    print(\"NumPy/sklearn predictions agree:\", result[\"library_max_prediction_error\"] < 1e-8)\n    print(\"bootstrap seed / refits:\", result[\"bootstrap\"][\"seed\"], result[\"bootstrap\"][\"repetitions\"])\n    print(\"bootstrap SE:\", round(result[\"bootstrap\"][\"standard_error\"], 6))\n    print(\"percentile interval:\", np.round(result[\"bootstrap\"][\"percentile_95\"], 6).tolist())\n    if args.json_output:\n        args.json_output.write_text(json.dumps(result, indent=2) + \"\\n\", encoding=\"utf-8\")\n\n\nif __name__ == \"__main__\":\n    main()\n"}</CodeBlock>

<CodeBlock language={"output"} kind={"output"} filename={"causal_nhefs_standardization.py.stdout.txt"} downloadUrl={"/learn-assets/causal-inference/causal_nhefs_standardization.py.stdout.txt"}>{"records / observed / missing: 1629 1566 63\r\nqsmk 0 records 1201 observed 1163 missing 38 observed mean 1.984498\r\nqsmk 1 records 428 observed 403 missing 25 observed mean 4.525079\r\ndesign columns / rank: 21 21\r\nstandardized means: [1.660267, 5.178841]\r\nstandardized difference: 3.518574\r\ncomplete-row target means: [1.756213, 5.273587]\r\nlinear-only difference: 3.434108\r\nfirst-row model means: [4.143747, 8.103226]\r\nNumPy/sklearn predictions agree: True\r\nbootstrap seed / refits: 20261009 1000\r\nbootstrap SE: 0.48537\r\npercentile interval: [2.587609, 4.441855]\r\n"}</CodeBlock>

<Prose>{""}<code>{"read_cohort"}</code>{" checks the required numerical fields and category codes, while retaining a missing outcome as "}<code>{"NaN"}</code>{". "}<code>{"design"}</code>{" constructs the actual rows or the two forced copies. "}<code>{"fit_and_standardize"}</code>{" applies the observed-outcome mask only to fitting, then predicts for the target rows. These three operations correspond to the branches and rows in the drawings. A missing outcome never becomes a zero response."}</Prose>

<Prose>{"The ordinary-tool comparison is "}<code>{"LinearRegression(fit_intercept=False)"}</code>{" on the same observed rows and targets. The intercept is already the first design column, so adding another fitted intercept would change the representation. The scikit-learn predictions and NumPy predictions agreed to the stated 10⁻⁸ tolerance; the recorded maximum difference was zero. This checks consistent numerical inputs and operations across two APIs. They share the same statistical model and data, so it is not an independent test of causal validity."}</Prose>

<Prose>{"For n records and p design columns, a dense least-squares fit has the usual O(np²+p³) arithmetic scale; predicting two columns of means costs O(np). The bootstrap repeats the fit. Those are operation counts, not measured runtime claims. The programme avoids a hand-written matrix inverse and reuses the linear-solver machinery developed in "}<a href={"/learn/topic/matrix-decompositions-svd-qr-cholesky-lu#3-qr-separate-directions-and-fit-data"}>{"Matrix Decompositions: QR and least squares"}</a>{"."}</Prose>

<H3>{"What the stored record bootstrap varies"}</H3>

<Prose>{"The earlier fixed-cell bootstrap kept group sizes fixed. Here one bootstrap draw samples 1,629 record indices with replacement from the whole file. Each selected index carries its treatment, covariates and observed or missing outcome together. Duplicates have repeated weight. The model is refitted on the draw's observed outcomes; both forced-treatment predictions are then averaged over that same resampled cohort. Thus the fitted coefficients and the empirical target distribution both change."}</Prose>

<C47 />

<Prose>{"The stored run contains 1,000 such refits, using seed 20261009. Their sample standard deviation, with denominator 999, is 0.485370 kg. Their 2.5th and 97.5th percentiles are 2.587609 and 4.441855 kg. The histogram counts those actual saved estimates; it is not a normal curve generated from the reported standard error. The original estimate 3.518574 kg is marked separately from the distribution of resampled estimates."}</Prose>

<Prose>{"This is a working "}<strong>{"iid record bootstrap"}</strong>{": it treats the rows as independent draws from a common population for the purpose of illustrating sampling variation. It is not an analysis of the original survey's sampling design. The interval does not include uncertainty from hidden confounding, unsupported covariate combinations, incorrect treatment timing, model misspecification or the earlier survivor/response selection. Repeated refitting answers a sampling question under its model of the data; it does not establish the identification assumptions."}</Prose>

<Prose>{"We can now report exactly what was done: fit observed outcomes with the stated 21-column regression, predict both treatment conditions consistently, average over all 1,629 available covariate rows, and describe iid sampling variation with the stored record bootstrap. Calling the contrast causal would require the additional assumptions and study-design work already identified. Next we examine a different design argument—an encouragement that changes treatment receipt—when ordinary measured-covariate adjustment is not the route we can justify."}</Prose>

<H2>{"11. Match the design to the question"}</H2>

<Prose>{"The historical-data example required an argument about treatment assignment and outcome observation. A well-run randomized assignment changes the first part of that argument by making assignment independent of pre-treatment potential outcomes. If assigned treatment is delivered as defined, outcomes are observed appropriately and the relevant interference conditions hold, an assignment-group comparison can identify its effect. Random sampling answers a different question: which population the sample represents. An internally valid randomized study need not represent every population."}</Prose>

<Prose>{"Randomizing an invitation or encouragement does not necessarily randomize the treatment received. Some people would receive treatment either way, some never would, and others change their receipt because of the invitation. Restricting analysis to those who complied generally loses the original randomized comparison."}</Prose>

<C48 />

<Prose>{"Use Z for randomized encouragement and X for actual treatment. Here Z is not the earlier baseline-activity variable: its role is now assignment. Draw Z→X→Y, with possible hidden common causes of X and Y. An "}<strong>{"instrumental variable"}</strong>{" can identify a particular effect under extra conditions. For this binary example require:"}</Prose>

<ul><li>{"Random encouragement: Z is independent of the relevant potential receipt and outcome quantities."}</li><li>{"Relevance: encouragement changes treatment receipt on average."}</li><li>{"Exclusion: encouragement affects the outcome only through receipt, with no direct Z→Y effect."}</li><li>{"Consistency and the stated absence of interference: the observed receipt and outcome agree with their corresponding interventions, and another unit's encouragement does not change this unit's outcome in the model."}</li><li>{"Receipt monotonicity: "}<InlineMath>{"X(1)\\ge X(0)"}</InlineMath>{" for every unit, where these two entries are receipt under encouragement 1 and 0."}</li></ul>

<Prose>{"Monotonicity here concerns "}<strong>{"receipt"}</strong>{", not whether treatment helps every outcome. It excludes defiers who would receive treatment only without encouragement. It allows three types: always-takers with pair (1,1), compliers with (0,1), and never-takers with (0,0)."}</Prose>

<C49 />

<Prose>{"Our finite population is 20% always-takers, 60% compliers and 20% never-takers. The untreated/treated outcome risks within those types are respectively (.10,.10), (.10,.40) and (.10,.90). Randomization preserves these type shares in both encouragement groups. With Z=0 only always-takers receive treatment, so the receipt rate is .20. With Z=1 always-takers and compliers receive it, so the rate is .80."}</Prose>

<Prose>{"Under exclusion, always-takers use the same treated mechanism under either Z, and never-takers use the same untreated mechanism. Their contributions cancel in the difference between assignment groups. Without encouragement every type's actual outcome risk is .10. With encouragement the average is "}<InlineMath>{".2(.10)+.6(.40)+.2(.10)=.28"}</InlineMath>{". The assignment effect is therefore .18, all contributed by the compliers."}</Prose>

<C50 />

<Prose>{"The receipt difference, called the "}<strong>{"first stage"}</strong>{", is .80−.20=.60. The "}<strong>{"Wald ratio"}</strong>{" is .18/.60=.30. Why divide? Compliers contribute their fraction times their mean treatment effect to the numerator, while their fraction is the denominator. Thus"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{E[Y\\mid Z=1]-E[Y\\mid Z=0]}\n{E[X\\mid Z=1]-E[X\\mid Z=0]}\n=E[Y(1)-Y(0)\\mid \\text{complier}]."}</MathBlock></div>

<Prose>{"On the right Y(x) refers to outcome under treatment receipt x, whereas the compliance types used X(z) for receipt under encouragement z. This is the "}<strong>{"local average treatment effect"}</strong>{", or LATE, for compliers with respect to this particular encouragement."}</Prose>

<Prose>{"The fully specified population's ATE is "}<InlineMath>{".2(0)+.6(.30)+.2(.80)=.34"}</InlineMath>{". It differs from .30 because never-takers have a different treatment effect. The observed instrument experiment never treats those never-takers, so their treated outcome risk is known only because our illustrative model explicitly supplied it. The ratio does not recover that missing information."}</Prose>

<Prose>{""}<strong>{"Complete file: causal_instrument.py."}</strong>{" Save this listing and run "}<code>{"python causal_instrument.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"causal_instrument.py"} downloadUrl={"/learn-assets/causal-inference/causal_instrument.py"}>{"from fractions import Fraction as F\n\n# name, population share, treatment under encouragement0/1, outcome risk under treatment0/1\ntypes = [\n    ('always', F(1, 5), [1, 1], [F(1, 10), F(1, 10)]),\n    ('complier', F(3, 5), [0, 1], [F(1, 10), F(2, 5)]),\n    ('never', F(1, 5), [0, 0], [F(1, 10), F(9, 10)]),\n]\n# Encouragement Z is randomized, so each Z group retains these type proportions.\ntreatment_rates = [sum(share*received[z] for _, share, received, _ in types) for z in [0, 1]]\noutcome_rates = [sum(share*risk[received[z]] for _, share, received, risk in types) for z in [0, 1]]\nfirst_stage = treatment_rates[1]-treatment_rates[0]\nassignment_effect = outcome_rates[1]-outcome_rates[0]\npopulation_ate = sum(share*(risk[1]-risk[0]) for _, share, _, risk in types)\nprint('treatment rates:', list(map(str, treatment_rates)))\nprint('outcome rates:', list(map(str, outcome_rates)))\nprint('assignment effect:', assignment_effect, '| first stage:', first_stage)\nprint('Wald ratio / complier effect:', assignment_effect / first_stage)\nprint('population ATE in this fully known model:', population_ate)\nassert assignment_effect / first_stage == F(3, 10)\nassert population_ate == F(17, 50)\n"}</CodeBlock>

<CodeBlock language={"output"} kind={"output"} filename={"causal_instrument.py.stdout.txt"} downloadUrl={"/learn-assets/causal-inference/causal_instrument.py.stdout.txt"}>{"treatment rates: ['1/5', '4/5']\noutcome rates: ['1/10', '7/25']\nassignment effect: 9/50 | first stage: 3/5\nWald ratio / complier effect: 3/10\npopulation ATE in this fully known model: 17/50"}</CodeBlock>

<Prose>{"The exact programme stores one pair of receipt values and one pair of outcome risks for each type. For each encouragement value, it selects receipt from the first pair, then uses that receipt to select the outcome risk. It computes the assignment contrasts and, separately, the all-type treatment contrast. The two-step indexing is how exclusion enters this model: Z has no separate outcome term."}</Prose>

<C51 />

<Prose>{"Keep always-takers at .20 and change the complier share c from 0 to .80. The remaining never-taker share is "}<InlineMath>{".80-c"}</InlineMath>{". Receipt rates are .20 and "}<InlineMath>{".20+c"}</InlineMath>{"; outcome rates are .10 and "}<InlineMath>{".10+.30c"}</InlineMath>{". For c>0 their ratio remains .30, but the model-known population ATE is "}<InlineMath>{".30c+.80(.80-c)=.64-.50c"}</InlineMath>{". Reset restores c=.60 and ATE=.34. At c=0 the numerator and first stage are both zero, so the ratio is unavailable, not zero."}</Prose>

<Prose>{"A weak first stage also makes sample ratios sensitive to noise and to assumption violations. If encouragement itself changes the outcome, always- and never-taker contributions need not cancel. If defiers exist, the difference can combine complier and defier effects with opposite signs. Correlation with treatment alone does not make a variable a valid instrument. The graph encodes exclusion and causal relations; the complier interpretation also uses the potential-receipt monotonicity assumption."}</Prose>

<H3>{"When treatment changes later confounders"}</H3>

<C52 />

<Prose>{"Suppose baseline L0 influences initial treatment A0 and future outcome Y. Later health L1 is affected by A0, predicts both the second treatment A1 and Y, and may carry part of A0's effect. A1 also affects Y. Now the target could be the outcome under the policy setting A0=a0 and A1=a1."}</Prose>

<Prose>{"Ignoring L1 can leave the A1–Y comparison confounded. Simply holding L1 fixed in a regression coefficient for A0 can remove part of the A0 effect the policy target intends to include. There is no single “include all variables” instruction that resolves both roles."}</Prose>

<Prose>{"For a discrete two-time setting, a longitudinal g-formula instead follows the covariate distribution induced by the earlier action:"}</Prose>

<div className="neural-equation"><MathBlock>{"E[Y^{a_0,a_1}]\n=\\sum_{l_0,l_1}\nE[Y\\mid l_0,a_0,l_1,a_1]\\,\np(l_1\\mid l_0,a_0)\\,p(l_0)."}</MathBlock></div>

<Prose>{"This expression requires consistency, sequential exchangeability of each treatment given its measured past, and support for the treatment history under consideration. First weight baseline states by their population frequency, then intermediate states by their distribution after a0, and finally average the outcome mean under a1. It does not fix L1 to one common arbitrary value. Continuous variables replace sums by the appropriate integration."}</Prose>

<Prose>{"The "}<a href={"https://miguelhernan.org/whatifbook"}>{"longitudinal chapters of What If"}</a>{" develop estimation and weighting for such policies, including time-varying confounding. This is a new design and assumption structure, not permission to reuse the point-treatment programme without changing it."}</Prose>

<H3>{"Thresholds, trends and the scope of the target"}</H3>

<C53 />

<Prose>{"In a sharp "}<strong>{"regression discontinuity design"}</strong>{", a known rule assigns treatment at a running-variable cutoff c. The comparison uses outcome behaviour immediately on the two sides of c. Under appropriate continuity of untreated and treated potential-outcome expectations at c, support near the cutoff and a credible assignment rule, the outcome jump identifies a local effect at the cutoff. A fitted line far away from c is not the identifying contrast. Manipulation or another discontinuous policy at the same cutoff can invalidate the interpretation. When crossing the cutoff changes treatment probability without determining receipt, a fuzzy design needs additional instrument-style conditions."}</Prose>

<Prose>{"In a simple two-group, two-period "}<strong>{"difference-in-differences"}</strong>{" design, compute"}</Prose>

<div className="neural-equation"><MathBlock>{"\\bigl(\\overline Y_{\\text{treated,post}}-\\overline Y_{\\text{treated,pre}}\\bigr)\n-\\bigl(\\overline Y_{\\text{comparison,post}}-\\overline Y_{\\text{comparison,pre}}\\bigr)."}</MathBlock></div>

<Prose>{"The comparison group's change supplies a counterfactual untreated trend for the treated group. That step needs a credible parallel-trends assumption for untreated outcomes, together with the relevant no-anticipation, composition and interference conditions. Similar pre-treatment trends can be useful evidence but do not prove what would have happened after treatment. Multiple treatment times and heterogeneous effects require more careful estimators and target definitions than this simple contrast."}</Prose>

<Prose>{"Both designs obtain leverage from a specific assignment or time structure. Neither is an interchangeable fallback to apply until an answer looks persuasive. With spillovers, a single Y(x) may be insufficient because outcomes also depend on others' assignments; define a policy or exposure and an appropriate design, possibly cluster randomization. To transport an effect to another population, specify which conditional mechanisms and selection relationships remain valid. Internal validity alone does not establish that portability."}</Prose>

<Prose>{"A practical analysis should now be able to state its intervention, population and horizon; draw and challenge the graph; derive an identified expression or show a nonidentification witness; choose an estimator and sampling design; examine support, measurement and selection; and say what evidence would change the conclusion. The practice below asks you to change those ingredients rather than repeat a familiar number."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"12. Practise changing the assumptions"}</H2>

<Prose>{"State the target and assumptions before calculating. The hints and complete solutions can be read separately from your attempt. Distinguish a graph implication, a numerical coincidence and a claim requiring additional information."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Change the target weights"}</H3><Prose>{""}<strong>{"Task."}</strong>{" Change the population to 30% low activity and 70% high. Low-group risks without/with treatment are .10/.30; high-group risks are .40/.45. Find the do risks and ATE. Why is equal weighting incorrect?"}</Prose><details><summary>Hint</summary><Prose>{"Average each treatment-specific risk with .3/.7; compare those two averages."}</Prose></details><details><summary>Worked solution</summary><Prose>{"The untreated risk is .3×.10+.7×.40=.31; the treated risk is .3×.30+.7×.45=.405. ATE=.095. Equal weighting gives .125 and targets a different population. If the treatment propensities are .8 in the low group and .2 in the high group, the raw treated risk is .135/.38≈.355263 and the untreated risk .230/.62≈.370968: a negative observed difference despite positive within-group effects. Assignment changes composition; it does not change the target weights."}</Prose></details></section>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Change the OR alarm"}</H3><Prose>{""}<strong>{"Task."}</strong>{" Let independent X and Y have probabilities .25 and .75. An alarm C turns on when either is 1. Compute P(Y=1|X=0,C=1) and P(Y=1|X=1,C=1). Does their difference identify an X effect?"}</Prose><details><summary>Hint</summary><Prose>{"With X=0, the alarm needs Y=1. With X=1, the alarm is already explained."}</Prose></details><details><summary>Worked solution</summary><Prose>{"The risks are 1 and .75, so the selected association is −.25. Y’s mechanism is independent of X, so its intervention risk remains .75 under either X. The common effect creates the selected comparison. Conditioning on an exact copy of C would select the same cases; adding more rows cannot remove this design-induced discrepancy."}</Prose></details></section>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Choose a valid adjustment set"}</H3><Prose>{""}<strong>{"Task."}</strong>{" A graph has S→E, S→Y, E→T and T→Y. For the total effect of T on Y, is adjusting for E valid, or must you always adjust farther upstream for S?"}</Prose><details><summary>Hint</summary><Prose>{"Enumerate backdoor paths beginning with an arrow into T. Check whether E is a collider or a descendant of T."}</Prose></details><details><summary>Worked solution</summary><Prose>{"The only backdoor path is T←E←S→Y. E is a non-collider and is not a descendant of T, so the set containing E is a valid backdoor set, as is the set containing S, with the required support. Conditioning on E creates no other path in this graph. An upstream location alone does not establish a universal precision or validity preference. Adding new arrows could change the answer and requires a new path check."}</Prose></details></section>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Construct a third compatible model"}</H3><Prose>{""}<strong>{"Task."}</strong>{" In the hidden-U observational-equivalence example, retain diagonal Y risks .2/.8 but set risk(U=0,X=1)=.4 and risk(U=1,X=0)=.6. Does the observed table change? What is the new ATE?"}</Prose><details><summary>Hint</summary><Prose>{"Observation still uses X=U. An intervention averages the relevant column over the two equally likely U values."}</Prose></details><details><summary>Worked solution</summary><Prose>{"The observed table is unchanged. The do risks are (.2+.6)/2=.4 and (.4+.8)/2=.6, so ATE=.2. This is a third compatible answer from the same observed law. The causal quantity is not identified under these unrestricted hidden-mechanism assumptions."}</Prose></details></section>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Test the hidden fork"}</H3><Prose>{""}<strong>{"Task."}</strong>{" For U→Z, U→Y, Z→Y with U hidden, can rule 2 replace do(Z=z) by observing Z=z without an adjustment? Which arrows are cut for the test?"}</Prose><details><summary>Hint</summary><Prose>{"Rule 2 deletes outgoing Z arrows; inspect what remains between Z and Y."}</Prose></details><details><summary>Worked solution</summary><Prose>{"Delete Z→Y. The path Z←U→Y remains active, so the graphical condition fails. Cutting U→Z instead would perform a different operation and could wrongly suggest that the observational association is an intervention. A failed condition means this rule does not justify the exchange; particular parameter choices can still coincide numerically."}</Prose></details></section>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Retain the selected descendant"}</H3><Prose>{""}<strong>{"Task."}</strong>{" Use Y~Bernoulli(.3), Z=Y and W=Z. Compare P(Y=1|W=1) with P(Y=1|do(Z=1),W=1). Explain rule 3's decision without relying only on the computed numbers."}</Prose><details><summary>Hint</summary><Prose>{"Z is an ancestor of W. The eligible Z(W) set is therefore empty when W is conditioned on."}</Prose></details><details><summary>Worked solution</summary><Prose>{"The first probability is 1; the second is .3 because forcing Z=1 makes W=1 for everyone. With W observed, Z(W) is empty and Y→Z stays in the test graph. Y and Z are not separated given W. Unconditionally, the downstream action leaves P(Y=1)=.3, so retaining the selection event is the crucial change."}</Prose></details></section>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Change the mediator and direct path"}</H3><Prose>{""}<strong>{"Task."}</strong>{" In the frontdoor model, change mediator probabilities to .2 and .6. Calculate the valid do risks, then add a direct X→Y effect of .1. Compare the unchanged-form frontdoor calculation with the true intervention."}</Prose><details><summary>Hint</summary><Prose>{"Without the direct path, the inner risks are .2/.7. With it, the inner population average includes .1×P(X=1)=.05."}</Prose></details><details><summary>Worked solution</summary><Prose>{"Without the direct path, do risks are .2+.5×.2=.3 and .2+.5×.6=.5, giving effect .2. With the direct path, actual risks are .3 and .6, giving effect .3. The invalid frontdoor calculation uses inner risks .25/.75 and returns .35/.55, still effect .2. It misses the direct causal pathway; the error is not repaired by estimating its observed factors more precisely."}</Prose></details></section>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Change the coupling and evidence"}</H3><Prose>{""}<strong>{"Task."}</strong>{" In the paired-outcome model choose r=.20. A randomized treated user succeeds. What is the probability they would have failed without treatment? Can the same marginal treatment risks establish your chosen r?"}</Prose><details><summary>Hint</summary><Prose>{"Compatible types are 01 and 11, with total probability .75."}</Prose></details><details><summary>Worked solution</summary><Prose>{"The answer under that coupling is (.75−.20)/.75=11/15≈.733333. ATE remains .50 for every allowed r, so the marginal treatment risks do not establish r=.20. If the observed user were instead an untreated success, the posterior weight of type 11 would be .20/.25=.8, giving an 80% treated-success counterfactual. Reusing the wrong evidence group gives the wrong answer."}</Prose></details></section>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Check one augmented score"}</H3><Prose>{""}<strong>{"Task."}</strong>{" In one stratum the true propensity is .25 and treated outcome mean .8. An analyst uses g=.5 and m1=.4 in the augmented treated-arm score. Find its expectation, and show how correcting either nuisance value changes it."}</Prose><details><summary>Hint</summary><Prose>{"Condition on the stratum: expected score is m1+(e/g)(mu1−m1)."}</Prose></details><details><summary>Worked solution</summary><Prose>{"The expectation is .4+(.25/.5)(.8−.4)=.6, not .8. Correcting g to .25 gives .4+1×.4=.8. Correcting m1 to .8 makes the residual mean zero and also gives .8. This is a population nuisance-model identity; if exchangeability itself fails, the observed mean μ1 need not equal the desired potential-outcome mean."}</Prose></details></section>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"10. Change encouragement and exclusion"}</H3><Prose>{""}<strong>{"Task."}</strong>{" A valid binary encouragement model has 40% compliers, 30% always-takers and 30% never-takers. Their treatment effects are .5, 0 and .2 respectively. Find first stage, assignment effect, Wald ratio and population ATE. What if encouragement also raises everybody's outcome risk directly by .02?"}</Prose><details><summary>Hint</summary><Prose>{"Only compliers change treatment under encouragement. A direct encouragement effect contributes to the numerator but not treatment receipt."}</Prose></details><details><summary>Worked solution</summary><Prose>{"First stage=.4, assignment effect=.4×.5=.2, and Wald ratio=.5. Population ATE=.4×.5+.3×0+.3×.2=.26. Adding a direct encouragement effect .02 changes the ratio to .22/.4=.55 while the treatment effects are unchanged. Exclusion has failed; calling the .55 result a complier treatment effect is no longer justified."}</Prose></details></section>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"11. Plan an independent offer analysis"}</H3><Prose>{""}<strong>{"Task."}</strong>{" Plan an offer analysis from a log containing prior activity, offer receipt, purchases and a post-offer 'completed checkout' field. State a target, graph, identification strategy, estimator, diagnostics and a useful experiment."}</Prose><details><summary>Hint</summary><Prose>{"Decide when each measurement is taken. Completion can be an effect of both treatment and other causes of purchase; more predictive information is not automatically a valid adjustment."}</Prose></details><details><summary>Worked solution</summary><Prose>{"A defensible example target is the seven-day purchase risk difference from showing a specified offer once to the eligible population versus not showing it. Start with prior activity→receipt, prior activity→purchase and receipt→purchase, then challenge whether intent or eligibility remains unmeasured. Do not automatically restrict to completed checkout: it can select on a post-treatment effect. If sufficient pre-treatment controls and overlap are defensible, estimate treatment-specific outcome risks and standardize to the target population, or use a justified weighting/augmented approach."}</Prose>

<Prose>{"Check timing, support, missing outcomes, repeated-user/clustering structure and sensitivity to plausible omitted causes. Quantify sampling uncertainty under the actual design separately from those identification limitations. A randomized offer-assignment experiment can identify the assignment policy effect when its delivery, outcome measurement and interference assumptions hold. If receipt differs from assignment, report the assignment effect first and justify any stronger treatment-receipt claim. An acceptable plan can conclude that the available log does not identify the target and name the information needed."}</Prose></details></section>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"12. Change the fitted table and break overlap"}</H3><Prose>{""}<strong>{"Task."}</strong>{" In the complete cell-estimation bridge, use sizes (60,30,40,70) and successes (6,9,12,35), in the existing (Z,X) cell order. Compare manual and fitted estimates. Then remove all treated observations in one stratum and explain which claim fails."}</Prose><details><summary>Hint</summary><Prose>{"Compute each stratum contrast before changing its population weight. Distinguish a missing treatment cell from a cell containing only one outcome type."}</Prose></details><details><summary>Worked solution</summary><Prose>{"Low-activity risks are .10/.30 and high-activity risks .30/.50, so both stratum contrasts are .20. The new empirical stratum shares .45/.55 still average to .20. The complete programme checks agreement of manual and fitted g-computation, IPW and AIPW to its tolerance. With no treated observations in a required stratum, the treated conditional outcome mean is unsupported. The count route rejects the missing cell; regression extrapolation is an additional assumption, not restored nonparametric overlap. The original bridge also requires both outcome types in each observed cell for its finite saturated-binomial fit; this numerical fitting boundary is separate from causal treatment support."}</Prose></details></section>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"13. Change the graph before running separation"}</H3><Prose>{""}<strong>{"Task."}</strong>{" In X→C←Y, C→D, the endpoints are X and Y and the observed set is {D}. Delete C→D. Are X and Y now d-separated? Explain the changes to ancestor restriction, moralization and the local collider criterion."}</Prose><details><summary>Hint</summary><Prose>{"The relevant ancestor set is computed from X, Y and the observed D in the changed graph. Do not reuse the previous moral graph after editing an edge."}</Prose></details><details><summary>Worked solution</summary><Prose>{"With C→D present, C is an ancestor of observed D. The ancestor-restricted graph contains X,Y,C,D, so moralization joins C's parents X and Y. Removing observed D leaves the X–Y connection. The local explanation is that observing a descendant of the collider C opens X→C←Y."}</Prose>

<Prose>{"After removing C→D, D is isolated and C is no longer an ancestor of any query or observed node. The restricted node set is {X,Y,D}. C is removed before moralization, so its parents are not joined. Removing D leaves isolated X and Y; they are separated. The original collider is still unobserved and now has no observed descendant. Both routes therefore agree."}</Prose>

<Prose>{""}<strong>{"Checks."}</strong>{" The query changes from not separated to separated. Permuting the stored edge order cannot change the result. Moralizing the full graph first and only then deleting C would leave a spurious X–Y edge; the order of operations matters."}</Prose></details></section>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"14. Construct the endpoints instead of naming a bound"}</H3><Prose>{""}<strong>{"Task."}</strong>{" A binary population has joint masses p00=.30,p01=.20,p10=.10,p11=.40. Under binary outcomes and consistency alone, derive the ATE bounds, construct a compatible population at each endpoint, and explain what changes if these masses are sample proportions."}</Prose><details><summary>Hint</summary><Prose>{"Each observed row fixes one potential outcome and leaves the other in {0,1}. To minimize Y1−Y0, choose the missing entry differently for untreated and treated records."}</Prose></details><details><summary>Worked solution</summary><Prose>{"Both treatment groups have mass .50. The lower endpoint is .40−.20−.50=−.30; the upper is .40+.50−.20=.70."}</Prose>

<NeuralTable caption={"Two endpoint completions of the same observed distribution"} headers={[<>{"Observed X,Y"}</>,<>{"Mass"}</>,<>{"Lower completion (Y0,Y1)"}</>,<>{"Upper completion (Y0,Y1)"}</>]} rows={[[<>{"0,0"}</>,<>{".30"}</>,<>{"(0,0)"}</>,<>{"(0,1)"}</>],[<>{"0,1"}</>,<>{".20"}</>,<>{"(1,0)"}</>,<>{"(1,1)"}</>],[<>{"1,0"}</>,<>{".10"}</>,<>{"(1,0)"}</>,<>{"(0,0)"}</>],[<>{"1,1"}</>,<>{".40"}</>,<>{"(1,1)"}</>,<>{"(0,1)"}</>]]} />

<Prose>{"At the lower completion, E[Y1]=.40 and E[Y0]=.70, giving −.30. At the upper, E[Y1]=.90 and E[Y0]=.20, giving .70. Each completed row retains its actually observed outcome, and each population has total mass one. Mixtures of the endpoint populations retain the observed law and attain the intermediate effects, establishing sharpness."}</Prose>

<Prose>{""}<strong>{"Checks."}</strong>{" The width is one. These statements are about compatibility with an exact population law. If the four inputs are empirical proportions, the same arithmetic gives a plug-in identification region; uncertainty about the population cell probabilities remains. It is not automatically a 95% confidence interval, and adding more observations does not supply the missing causal restriction."}</Prose></details></section>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"15. Change the target and the treatment interaction deliberately"}</H3><Prose>{""}<strong>{"Task."}</strong>{" In the NHEFS programme, why do averaging predictions over all 1,629 records and averaging over the 1,566 records with observed outcomes answer different questions? Which design entries must change when treatment is forced? Could you leave the treatment–smoking-intensity interaction at its observed value?"}</Prose><details><summary>Hint</summary><Prose>{"Separate the rows used to fit the conditional mean from the rows whose baseline distribution defines the target. The interaction is part of that same conditional-mean function."}</Prose></details><details><summary>Worked solution</summary><Prose>{"Fitting uses the 1,566 observed outcomes in both comparisons. The all-row calculation averages the fitted untreated and treated means over every available baseline record, including the 63 with missing outcomes. Its means are 1.660267 and 5.178841, a difference 3.518574 kg. The complete-outcome calculation uses the same fitted model but weights only those with observed outcomes. Its means are 1.756213 and 5.273587, a difference 3.517374 kg at the shown precision. The closeness of these particular results does not make the target distributions identical."}</Prose>

<Prose>{"For each record, preserve baseline L and replace both the qsmk treatment entry and qsmk×smokeintensity/10. Under forced zero they are 0 and 0; under forced one they are 1 and smokeintensity/10. Keeping the old interaction would combine two incompatible treatment assignments in one prediction row. These are predicted conditional means, not recovered individual potential outcomes."}</Prose>

<Prose>{""}<strong>{"Checks."}</strong>{" Outcome-observation exchangeability and support are needed to interpret predictions for the missing-outcome rows. Changing the averaging target does not test those assumptions. The working iid bootstrap resamples complete records, refits on observed outcomes in each sample and averages over the resampled target; it does not turn this selected historical cohort into a nationally representative survey analysis."}</Prose></details></section></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H3>{"Reflect on a changed case"}</H3>

<Prose>{"Choose one example where the arithmetic stays correct but the causal interpretation fails: a direct frontdoor bypass, a hidden common cause, a zero-support stratum or an encouragement effect that violates exclusion. State the target first, identify the exact failed condition, and name one kind of additional evidence that could help. A clear nonidentification conclusion is a useful analysis outcome."}</Prose></section>

<section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning" data-lesson-resource-list=""><H3>{"Further learning"}</H3>

<ul><li>{""}<a href={"https://miguelhernan.org/whatifbook"}>{"Causal Inference: What If — Hernán and Robins"}</a>{" develops progressively richer study designs, standardization, weighting and longitudinal treatment. Use the first part to revisit exchangeability and positivity, then follow the public NHEFS worked examples in the modelling chapters. The book, data and analysis programmes play different roles: matching a worked estimate is not a test of causal validity."}</li><li>{""}<a href={"https://www.bradyneal.com/causal-inference-course"}>{"Brady Neal's causal inference course"}</a>{" offers a second route through graphical models, backdoor adjustment and frontdoor/do-calculus, with linked notes and video lectures. Use a fresh graph to compare its derivation with the path-by-path approach here. This recommendation concerns the course and notes; it does not claim every video was watched."}</li><li>{""}<a href={"https://www.pywhy.org/EconML/spec/estimation/dr.html"}>{"EconML's doubly robust learning guide"}</a>{" extends the nuisance-model idea to practical estimation and effect heterogeneity. Read it after you can explain the two cancellation arguments and why cross-fitting does not establish exchangeability."}</li></ul></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references" data-lesson-resource-list=""><H3>{"Technical references and tools"}</H3>

<ul><li>{""}<a href={"https://ftp.cs.ucla.edu/pub/stat_ser/r416-reprint.pdf"}>{"Pearl, The Mathematics of Causal Inference"}</a>{": structural models, counterfactuals, graphical separation and the formal rules. Use the rule statements to check which graph is modified, especially the ancestor qualification in rule 3."}</li><li>{""}<a href={"https://users.nber.org/~rdehejia/%21%40%24AEM/Topic%2004%20IV/readings/angrist_imbens_rubin_JASA_1996.pdf"}>{"Angrist, Imbens and Rubin, Identification of Causal Effects Using Instrumental Variables"}</a>{": the original local-effect argument, including monotonicity and how identification depends on the assumptions. Compare its target with the finite compliance-type calculation."}</li><li>{""}<a href={"https://networkx.org/documentation/stable/reference/algorithms/d_separation.html"}>{"NetworkX d-separation documentation"}</a>{": the ordinary DAG separation interface used alongside our explicit ancestor/moralization route. A separation function checks the supplied graph; it cannot certify that the graph is causally correct."}</li><li>{""}<a href={"https://www.statsmodels.org/stable/generated/statsmodels.genmod.generalized_linear_model.GLM.html"}>{"statsmodels GLM reference"}</a>{": response/design shapes, family selection and explicit intercept handling for the saturated constructed example."}</li><li>{""}<a href={"https://numpy.org/doc/stable/reference/generated/numpy.linalg.lstsq.html"}>{"NumPy least-squares reference"}</a>{" and "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LinearRegression.html"}>{"scikit-learn LinearRegression"}</a>{": the numerical regression interfaces used in the NHEFS comparison. Their agreement checks model fitting, not identification."}</li></ul></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H3>{"Where to go next"}</H3>

<Prose>{"You are ready to continue when you can distinguish observation, intervention and a same-unit counterfactual; trace the graph condition behind a formula; calculate its observed factors; and state what remains unidentified or uncertain. Change the graph or the support pattern before treating a familiar output as mastery."}</Prose>

<Prose>{"Bayesian Networks and Causal Graphical Models later develops broader graphical inference and causal-discovery machinery. The next mathematics topic, "}<a href={"/learn/path/full-curriculum/entropy-cross-entropy-kl-divergence?module=math-foundations"}>{"Entropy, Cross-Entropy and KL Divergence"}</a>{", studies information and predictive discrepancy. Those quantities can help model data, but predictive agreement alone does not decide between the observationally equivalent causal systems we constructed."}</Prose></section>
</div>
};
