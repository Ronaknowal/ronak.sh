// Exact complete content-r3 projection; see runtime-manuscript-projection-r1.json.
import {Prose,H2,H3,CodeBlock} from '../content';
import {Math as InlineMath,MathBlock} from '../content/Math.jsx';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import {NeuralTable} from './NeuralLessonElements.jsx';
import Drawing from './InformationReadingDrawings.jsx';
import {InformationProvider} from './InformationReadingState.jsx';
import './information-reading.css';
function Payload({file,output}){return <section data-payload={file}><RemoteCodeBlock source={'/learn-assets/mutual-information/'+file} filename={file} language={output?'output':'python'}/></section>;}
export default function InformationReadingLesson(){return <InformationProvider><div className="lesson-pilot lesson-flow information-reading"><Prose opening="summary">{"Two sensors can produce equally long streams while answering very different questions. One may reveal a fault; another may mostly record an irrelevant lighting change. We first measure how an observation changes a probability law. Then we design a representation that preserves the distinctions useful for a chosen task."}</Prose>

<Prose opening="prerequisites">{"Use joint and conditional probability, weighted averages and logarithms from Probability and Entropy. We reconstruct the necessary table operations here. The finite optimization section later uses a derivative under a normalization constraint; the neural computation reconnects the Gaussian pathwise derivative from Variational Inference. The first five sections establish the central ideas. The later sections retain the algorithms, derivations, continuous cases and estimation limits, with complete code beside the mechanism it implements."}</Prose>

<H2>{"1. Measure the value of an observation"}</H2>

<Prose>{"In the preceding Entropy example, two bits agreed 90% of the time. Here we deliberately choose a noisier observation: a binary feature X agrees with a fair target bit Y 80% of the time. X names the observation; Y names the label we want to infer. The picture describes the complete declared probability law, not four collected samples."}</Prose>

<Drawing id="M01"/>

<Prose>{"The pair (X=0,Y=0) has probability .4, as does (1,1). Each disagreement has probability .1. These four possibilities exhaust the experiment, since their probabilities sum to one. Adding the two cells with Y=0 gives .5; adding the Y=1 cells also gives .5. Before looking at X, either label is equally likely and H(Y)=1 bit."}</Prose>

<Prose>{"An observation retains one row of this joint table. To turn its remaining masses into probabilities, divide by that row's total."}</Prose>

<Drawing id="M02"/>

<Prose>{"For X=0, the retained masses are .4 and .1, with total .5. Dividing each by .5 gives P(Y=0|X=0)=.8 and P(Y=1|X=0)=.2. For X=1, the conditional probabilities are (.2,.8). The vertical bar means “given”; it changes the reference population to the selected row. A row with zero probability has no conditional distribution determined by this law, so the display labels it unavailable rather than inventing an all-zero probability vector."}</Prose>

<Prose>{"Each conditional label distribution has entropy h₂(.2), where h₂(p)=−p log₂p−(1−p)log₂(1−p). As before, a zero-mass term contributes zero by its limit. We must weight the row entropies by the probability of encountering each observation."}</Prose>

<Drawing id="M03"/>

<Prose>{"Here both row weights are .5 and both row entropies are .721928095 bits. The weighted contributions are .360964047 bits each, giving H(Y|X)=.721928095 bits. The bracket between the initial one bit and this conditional total is .278071905 bits. This average reduction is "}<strong>{"mutual information"}</strong>{", abbreviated MI:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"I(X;Y)=H(Y)-H(Y\\mid X),\\qquad\nH(Y\\mid X)=\\sum_x p(x)H(Y\\mid X=x)."}</MathBlock></div>

<Prose>{"MI is a property of the joint probability law. It is not the success rate of one classifier, the number of input features, or evidence that one variable caused the other. The .278 bits describes expected uncertainty removed; it does not say that 27.8% of labels are correct."}</Prose>

<Prose>{"Equal row entropies can hide an incorrect implementation. The later practice table (.45,.15; .10,.30) has unequal row masses (.6,.4), but both normalized rows have entropy .811278124 bits. A wrong uniform average happens to agree there. To expose the error, use joint rows (.675,.075) and (.125,.125). Their masses are .75 and .25, and their conditional label laws are (.9,.1) and (.5,.5). The correct remaining uncertainty is "}{".75×"}<wbr/>{".468995594+"}<wbr/>{".25×"}<wbr/>{"1="}<wbr/>{".601746695"}{" bits. A uniform average gives .734497797 bits because it overweights the rarer, more uncertain context. The unequal-entropy preset draws both actual multipliers; it keeps its whole table fixed while you select a row."}</Prose>

<Prose>{"The binary-channel preset allows source prevalence and channel error to change. Every joint cell, row weight and conditional entropy follows that new law. Reset returns to the fair 80%-agreement law. The later product-law view shares this state; scrolling to it does not create a second experiment."}</Prose>

<Prose>{"“Observation reduces uncertainty” is an average statement. Consider independent fair bits U,V and let Y=U OR V: Y is one unless both inputs are zero. The following partition shows why an individual observation can do the opposite."}</Prose>

<Drawing id="M04"/>

<Prose>{"Three of the four equally likely pairs give Y=1, so the initial entropy is "}{"h₂(.75)="}<wbr/>{".811278124"}{" bits. If U=0, the label is exactly the still-fair V, with entropy one bit: this observation increases uncertainty. If U=1, Y is certainly one, with entropy zero. Each U case occurs half the time, so H(Y|U)=.5 bits and I(U;Y)=.311278124 bits. Averaging over the declared observation law is essential."}</Prose>

<Prose>{"A feature can also be perfectly informative while a particular decision rule is always wrong. Set the binary channel's error to one and follow the two crossed paths."}</Prose>

<Drawing id="M05"/>

<Prose>{"Now X=0 means Y=1 and X=1 means Y=0. Copying X as the predicted label has zero accuracy; inverting X is perfect. The conditional entropy is zero and MI is one bit. Information concerns the distinctions a suitable decoder could exploit, not whether a chosen decoder uses the right correspondence. At error .5 the two rows are identical, so observing X changes nothing and MI is zero. At errors zero and one, the correspondence differs but the information is equally complete."}</Prose>

<H2>{"2. Compare the pairing with independence"}</H2>

<Prose>{"The conditional calculation starts with one row at a time. A second view asks how the whole pairing differs from a law in which X and Y are independent while keeping their marginal distributions unchanged."}</Prose>

<Drawing id="M06"/>

<Prose>{"For the fair 80%-agreement example, both marginals are (.5,.5). Multiplying a row mass by a column mass gives .25 in every independent-reference cell. The actual joint law has .4 on the agreement cells and .1 on the disagreement cells. Its dependence lives in which values occur together, even though its row and column totals match the reference exactly."}</Prose>

<Prose>{"Take one positive joint cell and compare its probability with that independent-reference probability. A logarithm measures the relative change on the same additive scale used for information prices."}</Prose>

<Drawing id="M07"/>

<Prose>{"For an agreement cell, .4/.25=1.6 and "}{"log₂(1.6)="}<wbr/>{".678071905"}{" bits. For a disagreement cell, .1/.25=.4 and "}{"log₂(.4)="}<wbr/>{"−1.321928095"}{" bits. The signed quantity is "}<strong>{"pointwise mutual information"}</strong>{":"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"\\imath(x;y)=\\log_2 p(x,y)-\\log_2 p(x)-\\log_2 p(y)."}</MathBlock></div>

<Prose>{"A negative value says this particular pair occurs less often than the independent reference predicts. It does not contradict nonnegative average MI. Weight the two positive values by .4 each and the two negative values by .1 each: "}<span className="ir-inline-calculation"><wbr/>{"2"}<wbr/>{"×.4"}<wbr/>{"×.678071905"}<wbr/>{"+2"}<wbr/>{"×.1"}<wbr/>{"×(−1.321928095)"}<wbr/>{"=.278071905"}</span>{" bits. In the linked investigation, selecting a cell traces exactly one of these contributions. Changing the common law updates both this product comparison and the earlier conditional calculation."}</Prose>

<Prose>{"The two calculations agree because the same terms regroup. The next drawing aligns the joint, marginal and conditional contributions before cancellation."}</Prose>

<Drawing id="M08"/>

<Prose>{"For an occupied cell, "}{"p(x,"}<wbr/>{"y)="}<wbr/>{"p(x)p(y|"}<wbr/>{"x)."}{" Substituting this factorization leaves "}{"log₂p(y|"}<wbr/>{"x)−log₂p(y)."}{" Averaging the negative second term gives H(Y); averaging the negative conditional term gives H(Y|X). Thus"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"\\begin{aligned}\nI(X;Y)\n&=\\sum_{x,y}p(x,y)\\log_2\\frac{p(x,y)}{p(x)p(y)}\\\\\n&=H(Y)-H(Y\\mid X)\\\\\n&=D_{\\rm KL}(P_{XY}\\Vert P_XP_Y).\n\\end{aligned}"}</MathBlock></div>

<Prose>{"This is also the improvement in expected log loss when predictions use the true conditional label distribution instead of the true marginal label distribution. The KL interpretation supplies nonnegativity and its equality condition: MI is zero exactly when the joint law equals the product law, which is independence."}</Prose>

<Prose>{"Support matters when implementing the sum. A zero joint cell contributes zero; skip it before evaluating a logarithm. A positive joint cell necessarily has positive row and column marginals. Their product can nevertheless underflow in floating-point arithmetic if both are tiny. The difference of three logarithms avoids forming that product. Do not “repair” a valid tiny probability by adding an arbitrary epsilon: that changes the law being measured. A general helper should reject negative, nonfinite, nonrectangular and nonnormalized inputs before calculation; the compact preserved example below instead starts with a declared valid table."}</Prose>

<Prose>{"Swapping the table's axes or consistently renaming its categories cannot change these weighted ratios. The correspondence, not the category name, carries the information."}</Prose>

<Drawing id="M09"/>

<Prose>{"Transposition makes the symmetry I(X;Y)=I(Y;X) visible. This does not make predicting X from Y and predicting Y from X equally easy for a particular model or loss. For finite discrete laws, nonnegative conditional entropy also gives "}{"0≤I(X;"}<wbr/>{"Y)≤min(H(X),"}<wbr/>{"H(Y))."}{" Seeing the exact value X removes all its discrete uncertainty, so I(X;X)=H(X). If Y=f(X), then I(X;Y)=H(Y); X may still distinguish many inputs with the same Y. The continuous case requires a different treatment, developed in section8."}</Prose>

<Prose>{"File: "}<code>{"mi_original.py"}</code>{""}</Prose>

<Payload file="mi_original.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="mi_original.stdout.txt" output={true}/>

<Prose>{"The programme first sums rows and columns, then calculates each occupied cell's log contribution. It separately calculates H(Y), and prints MI, H(Y) and the difference H(Y)−MI. That last number uses the identity just derived; this compact file does not independently calculate the conditional row entropies or assert their agreement. The validated practice helper later performs that additional calculation. The finite-table operations take time proportional to the number of cells; storing the two marginals needs space proportional to the number of rows plus columns. The input table itself remains the dominant stored object."}</Prose>

<Prose>{"Change a cell only as part of a complete valid law, then recompute both marginals. Reusing the old marginals would compare the new joint with the wrong reference. The independent practice later supplies a validated helper and a zero-row/tiny-cell debugging case. Bits use log₂; natural logarithms give nats, and one bit equals ln2 nats. We state the units whenever a later implementation changes its log base."}</Prose>

<H2>{"3. Find information that single features miss"}</H2>

<Prose>{"Mutual information compares complete probability laws. It can therefore detect dependence that a summary of linear association misses. Take X equally likely to be −1,0,1 and Y=X². The picture puts each possible observation at its actual coordinates."}</Prose>

<Drawing id="M10"/>

<Prose>{"The points are "}{"(−1,"}<wbr/>{"1),"}<wbr/>{"(0,"}<wbr/>{"0),"}<wbr/>{"(1,"}<wbr/>{"1),"}{" each with mass1/3. Their symmetry makes E[X]=0 and E[XY]=0, hence covariance zero. Yet X determines Y exactly. The label is zero with probability1/3 and one with probability2/3, so "}{"I(X;"}<wbr/>{"Y)="}<wbr/>{"H(Y)="}<wbr/>{"h₂(1/3)="}<wbr/>{".918295834"}{" bits. Zero covariance has not made the variables independent."}</Prose>

<Prose>{"Now compress X in two different ways. Follow the actual inputs merged into each output group."}</Prose>

<Drawing id="M11"/>

<Prose>{"The magnitude map Z₁=|X| merges −1 and1; both have Y=1. Its other group contains only0, with Y=0. Each group has a single label, so it preserves all the label information. The sign-threshold map Z₂=1[X>0] instead merges −1 with0. This group has probability2/3 and a fair conditional label, while Z₂=1 determines Y=1. Its remaining label entropy is2/3 bit, and its MI is "}{".918295834−2/3="}<wbr/>{".251629167"}{" bits. A grouping preserves the task when it merges inputs with the same conditional label law, not merely when it has few output values."}</Prose>

<Prose>{"File: "}<code>{"mi_nonlinear.py"}</code>{""}</Prose>

<Payload file="mi_nonlinear.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="mi_nonlinear.stdout.txt" output={true}/>

<Prose>{"The code enumerates the three equally likely states rather than estimating a curve from a sample. Its first two moments check the covariance cancellation. Its joint tables then compare the full observation and the sign-threshold grouping through the same MI function. The magnitude grouping is established by the preceding label-pure groups and revisited in practice; this file does not compute a separate magnitude table. This is linear work in the listed states, followed by the finite table sums. Changing the map means moving each state's probability to its new group; keeping an old marginal would mix two experiments."}</Prose>

<Prose>{"A useful combination can also have individually uninformative parts. Let independent fair bits A,B determine Y=A XOR B, which is one when the bits differ. Draw all four pairs and then group them by what has been revealed."}</Prose>

<Drawing id="M12"/>

<Prose>{"Every row at fixed A contains one Y=0 and one Y=1, each with equal conditional probability. Every column at fixed B does too. Thus I(A;Y)=I(B;Y)=0, although the pair identifies a single cell and determines Y, giving I((A,B);Y)=1 bit. Rejecting every feature with zero individual MI would discard both ingredients. The investigation's A/B/both selection changes the grouping of this same law; it does not fabricate additional data."}</Prose>

<Prose>{"To measure what A adds after B is already known, work inside each B slice and then weight those calculations by the slice probability."}</Prose>

<Drawing id="M13"/>

<Prose>{"When B=0, Y=A; when B=1, Y is the inverted A. Each slice has one bit of MI. With slice masses .5 and .5, their average is one bit. This "}<strong>{"conditional mutual information"}</strong>{" is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"I(A;Y\\mid B)=\\sum_b p(b)D_{\\rm KL}\\bigl(P_{AY\\mid b}\\Vert P_{A\\mid b}P_{Y\\mid b}\\bigr)."}</MathBlock></div>

<Prose>{"The joint table inside each KL is normalized within its B slice. A zero-mass slice contributes nothing and has no determined conditional law. Adding and subtracting H(Y|B) gives the chain rule"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"I((A,B);Y)=I(B;Y)+I(A;Y\\mid B)."}</MathBlock></div>

<Prose>{"Revealing B first and A second removes the same total uncertainty as revealing the pair. The incremental term need not equal the unconditional I(A;Y). In XOR it is larger. To see the opposite direction, use a different declared law: X=Y=C, all the same fair bit."}</Prose>

<Drawing id="M14"/>

<Prose>{"Before C is revealed, X and Y share one bit. Inside C=0, both are fixed zero; inside C=1, both are fixed one. Consequently I(X;Y|C)=0. Conditioning can reveal or remove dependence. An ordinary three-circle diagram with only nonnegative overlap regions cannot express all these interaction patterns; the actual conditional tables can."}</Prose>

<Prose>{"File: "}<code>{"mi_conditional.py"}</code>{""}</Prose>

<Payload file="mi_conditional.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="mi_conditional.stdout.txt" output={true}/>

<Prose>{"The programme changes the XOR fixture to P(B=1)=.25 while keeping A fair and independent. Y remains fair, but A now has "}{"1−h₂(.25)="}<wbr/>{".188721876"}{" bits about it; B still has zero and the pair still has one. The code constructs each marginal joint from the same enumerated law. For the conditional calculation it directly constructs the known normalized XOR table for each fixed B: each A value has mass .5 and its label is A XOR B. It computes that table's MI and weights it by the declared context probability, .75 or .25. It does not gather arbitrary context slices or perform a general normalization step; the practice helper later implements those operations for joint-mass layers. This final weighting is the same operation that mattered for conditional entropy in section1."}</Prose>

<Prose>{"For sensor pairs, genetic markers or image channels, the practical question is often what another feature adds to the current set. Conditional information asks that question about a specified probability law. Selecting or estimating it from data adds validation requirements, developed in section9. Observational dependence by itself still does not identify the effect of an intervention."}</Prose>

<H2>{"4. Follow information through a processing step"}</H2>

<Prose>{"We have compared a full observation with deterministic groupings. A representation can also randomize. Let an encoder q(z|x) assign probabilities to output states Z for each observed X. The next picture shows the branching operation itself."}</Prose>

<Drawing id="M15"/>

<Prose>{"For each X, the outgoing probabilities q(z|x) sum to one. The label Y follows its own conditional law p(y|x). Our restriction is that the encoder's random draw does not additionally consult Y after X is known. Thus"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"p(x,y,z)=p(x,y)q(z\\mid x)=p(x)p(y\\mid x)q(z\\mid x)."}</MathBlock></div>

<Prose>{"This is the Markov condition Y–X–Z. The drawn branches describe conditional probability structure; they do not establish causal directions from observational data. In a deterministic encoder one branch per row has probability one. In a randomized encoder several branches may remain possible, even for exactly the same input."}</Prose>

<Prose>{"Take fair X, with Y flipping X with probability .1 and Z independently flipping X with probability .2. Trace the paths that make Y and Z disagree."}</Prose>

<Drawing id="M16"/>

<Prose>{"Exactly one flip produces disagreement: label flip without encoder flip has probability .1×.8=.08, and encoder flip without label flip has probability .9×.2=.18. Adding gives .26. No flip or two flips gives agreement. The original label information "}{"is1−h₂(.1)="}<wbr/>{".531004406"}{" bits; after encoding it "}{"is1−h₂(.26)="}<wbr/>{".173253628"}{" bits. Their difference is .357750778 bits. The processing investigation changes the two named noise channels while preserving conditional independence. Encoder error zero preserves the original information; error .5 makes Z independent of the task. Label error .5 leaves no original task information to preserve."}</Prose>

<Prose>{"The general statement is the "}<strong>{"data-processing inequality"}</strong>{" I(Y;Z)≤I(Y;X). We can locate its exact gap by decomposing the same joint information in two orders."}</Prose>

<Drawing id="M17"/>

<Prose>{"First reveal X, then Z. The Markov condition makes the second revelation uninformative about Y: I(Y;Z|X)=0. Instead reveal Z, then X; the extra information is I(Y;X|Z). The two totals agree:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"\\begin{aligned}\nI(Y;X,Z)&=I(Y;X)+I(Y;Z\\mid X)=I(Y;X),\\\\\nI(Y;X,Z)&=I(Y;Z)+I(Y;X\\mid Z),\\\\\nI(Y;X)-I(Y;Z)&=I(Y;X\\mid Z)\\geq0.\n\\end{aligned}"}</MathBlock></div>

<Prose>{"The lost .357750778 bits in the example is therefore an actual conditional dependence, not just a visual distance between bars. Processing can make an existing pattern easier for a limited classifier to exploit, but under this factorization it cannot increase the population information about Y."}</Prose>

<Prose>{"Equality asks whether X can still help after Z is known. Compare the conditional label mixtures of the inputs within one representation group."}</Prose>

<Drawing id="M18"/>

<Prose>{"If every input merged into a group has the same label distribution, retaining the original input adds no label information within that group. More generally, equality holds exactly when I(Y;X|Z)=0. Such a representation is sufficient for predicting Y under the specified law. It need not reconstruct X. The earlier magnitude map was sufficient for Y=X², although it discarded the sign of X."}</Prose>

<Prose>{"Now change the construction by appending the true label to the representation. The new input edge changes the probability model."}</Prose>

<Drawing id="M19"/>

<Prose>{"Z can now depend on Y beyond X, violating p(x,y)q(z|x). Observing information above the earlier bound would not refute data processing; its premise no longer applies. With a learned encoder, evaluate fresh pairs with fitted parameters fixed, or explicitly include training-data and parameter randomness in the joint model. Treating a map trained on labels and those same training observations as an independent fresh experiment can conceal leakage."}</Prose>

<Prose>{"File: "}<code>{"mi_processing.py"}</code>{""}</Prose>

<Payload file="mi_processing.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="mi_processing.stdout.txt" output={true}/>

<Prose>{"The programme enumerates all eight (X,Y,Z) combinations using the two independent conditional noise factors. Summing over X yields the Y,Z table. It then calculates the original information, processed information and lost conditional information independently from that full law. The cost is proportional to |X||Y||Z| for this direct enumeration. Its result verifies this declared finite experiment; it does not infer the factorization from an observed correlation."}</Prose>

<H3>{"Connect remaining information to a decision error"}</H3>

<Prose>{"Information measures distributions; classification asks for a label decision. A useful bridge is to choose, for every observed Z, the most probable label. This is the Bayes decoder for zero-one error under a known law. The next picture divides each Z row into correct and incorrect mass for that chosen label."}</Prose>

<Drawing id="M20"/>

<Prose>{"For the fair binary table (.4,.1; .1,.4), choose label0 in row0 and label1 in row1. The two discarded cells sum to error probability Pₑ=.2. For the three-label joint with Z rows (.30,.10,.10) and (.05,.25,.20), choose labels0 and1. Correct mass is .30+.25=.55 and Pₑ=.45. Ties use the lowest label index consistently. No decision at a zero-probability observation affects the expected error."}</Prose>

<Prose>{"Introduce the error flag E, equal to one when the chosen decision is wrong. Knowing Z and E=0 identifies Y. Knowing Z and E=1 leaves at most K−1 labels, where K≥2 is the number of possible labels. The drawing separates the uncertainty of the flag from the remaining wrong-label choice."}</Prose>

<Drawing id="M21"/>

<Prose>{"Because E is determined by (Y,Z), the chain rule gives "}{"H(Y|"}<wbr/>{"Z)="}<wbr/>{"H(E|"}<wbr/>{"Z)+"}<wbr/>{"H(Y|"}<wbr/>{"E,"}<wbr/>{"Z)."}{" The first term is at most H(E)=h₂(Pₑ); the second is at most Pₑ log₂(K−1). This yields "}<strong>{"Fano's inequality"}</strong>{":"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"H(Y\\mid Z)\\leq h_2(P_e)+P_e\\log_2(K-1)."}</MathBlock></div>

<Prose>{"This form holds for any deterministic decoder; the Bayes choice makes its error minimal. The fair binary symmetric example reaches equality: both sides are .721928095 bits. In the three-label example, remaining "}{"entropy1.365957321"}{" is below the bound1.442774454 bits. The term is log₂(K−1), not log₂K, because an error already excludes the guessed label. Using h₂(Pₑ)≤1 and log₂(K−1)≤log₂K gives the weaker "}{"Pₑ≥(H(Y|"}<wbr/>{"Z)−1)/log₂K,"}{" which may be negative and therefore uninformative. High remaining uncertainty can force errors; this is a "}{"distribution-specific"}{" relation, not an identity between MI and accuracy."}</Prose>

<Prose>{"File: "}<code>{"finite_fano.py"}</code>{""}</Prose>

<Payload file="finite_fano.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="finite_fano.stdout.txt" output={true}/>

<Prose>{"The scalar implementation validates a finite normalized joint, chooses a row maximum, sums error mass, and computes conditional entropy with the actual row weights. Its NumPy counterpart applies the same operations to active rows and writes logarithms only where probabilities are positive. Both take O(|Z|K) work. The extra perfect and tied cases expose zero-error and tie conventions. This is an exact known-law calculation; learning those conditional probabilities from data is a separate statistical problem."}</Prose>

<H2>{"5. Keep the signal without the nuisance"}</H2>

<Prose>{"Data processing describes what an encoder loses. We now choose what it should keep. Declare a new input X=(S,N), containing two independent fair bits. The target Y is S flipped with probability .1. The picture separates the two coordinates before we decide which one matters."}</Prose>

<Drawing id="M22"/>

<Prose>{"The four input records 00,01,10,11 each have probability .25. Their conditional label laws are "}{"(.9,"}<wbr/>{".1),"}<wbr/>{"(.9,"}<wbr/>{".1),"}<wbr/>{"(.1,"}<wbr/>{".9),"}<wbr/>{"(.1,"}<wbr/>{".9)."}{" S is useful for this task; N could represent an irrelevant acquisition setting. The words signal and nuisance are task-relative. If we instead ask for the label N, their roles change."}</Prose>

<Prose>{"Compare five actual representation operations on these same four inputs."}</Prose>

<Drawing id="M23"/>

<Prose>{"A constant encoder merges all inputs. A signal encoder merges 00 with01 and10 with11. A nuisance encoder groups by the second coordinate. Keeping both coordinates assigns a different codeword to each input. A noisy-signal encoder flips S with probability .2, so each input splits between two codewords rather than entering one fixed group. The small label mixtures inside each codeword show what remains predictable there."}</Prose>

<Prose>{"We need two quantities to compare these operations. One asks how many input distinctions survive; the other asks how many task distinctions survive."}</Prose>

<Drawing id="M24"/>

<Prose>{"Call R=I(X;Z) the "}<strong>{"rate"}</strong>{" and T=I(Y;Z) the "}<strong>{"relevance"}</strong>{". The constant has (R,T)=(0,0). Keeping S gives (1,.531004406); keeping N gives (1,0); keeping both gives (2,.531004406). The noisy signal gives "}{"(.278071905,"}<wbr/>{".173253628)."}{" Its codeword entropy is still one bit, but part of that entropy is encoder randomness. For a deterministic finite encoder R=H(Z); for a randomized encoder R=H(Z)−H(Z|X). A random fair codeword independent of X has one bit of entropy and zero input information."}</Prose>

<Prose>{"The "}<strong>{"information bottleneck"}</strong>{" trades these two quantities by minimizing"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"J(q)=I(X;Z)-\\beta I(Y;Z),\\qquad \\beta\\geq0,\n\\qquad p(x,y,z)=p(x,y)q(z\\mid x)."}</MathBlock></div>

<Prose>{"Beta is the relevance weight: increasing it makes task information worth more relative to retained input information. Some papers instead put a coefficient on compression. Check the actual objective rather than inferring the convention from the letter. Now place the candidates on axes for R and T, and draw one line of constant objective."}</Prose>

<Drawing id="M25"/>

<Prose>{"With R horizontal and T vertical, J=R−βT rearranges to T=R/β−J/β when β>0. Equal-objective lines therefore have slope1/β. For β=0, J=R and equal-objective lines are vertical. At β=3, signal gives J=−.593013219, both gives .406986781 and constant gives zero. The extra nuisance bit costs one without increasing relevance. The noisy-signal family is drawn as a labelled set of feasible candidates; it is not a certified frontier over every possible encoder."}</Prose>

<Prose>{"The investigation changes the selected encoder and the tradeoff weight separately. Changing beta alters the objective assigned to a fixed point; it does not move that encoder's R,T coordinates. A noise control appears only for the noisy encoder whose operation it changes. Selecting a candidate is a comparison, not a claim that a hidden solver found a global optimum."}</Prose>

<Prose>{"File: "}<code>{""}{"mi_"}<wbr/>{"representations.py"}{""}</code>{""}</Prose>

<Payload file="mi_representations.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="mi_representations.stdout.txt" output={true}/>

<Prose>{"The code constructs each encoder as rows of conditional probabilities, builds p(x,z) and p(y,z), and applies the same finite MI calculation to both. The number of codewords differs between candidates and is explicit in each array. To change the target to N, change its conditional label law and recompute relevance; the encoder's rate stays the same because p(x) and q(z|x) have not changed. The complete source is small enough to audit each assignment against the picture."}</Prose>

<Prose>{"Two limits clarify what the objective rewards. The nonnegative region implied by data processing is an inequality constraint, not an algorithm's fitted curve."}</Prose>

<Drawing id="M26"/>

<Prose>{"The encoder's Markov condition gives T≤R, so for0≤β≤1,"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"J=R-\\beta T\\geq(1-\\beta)R\\geq0."}</MathBlock></div>

<Prose>{"An input-independent representation achieves zero and is globally optimal in this range. At β=1, informative equality cases may tie, so the optimum need not be uniquely constant. For larger beta an informative encoder can beat zero. Even a very large beta need not memorize all of X: among equally relevant candidates the positive rate term still favours the one retaining less irrelevant detail."}</Prose>

<Prose>{"Neither latent dimension nor MI alone equals a file's serialized bytes, its memory traffic or the length of a single physical message. Operational compression requires additional assumptions about repeated source draws, coding and allowed error. The next lesson makes that question precise. Here the immediate goal is an encoder with useful information under a chosen law and objective."}</Prose>

<H2>{"6. Compute a finite bottleneck"}</H2>

<Prose>{"The comparison suggests what a good representation could do; we still need to construct one. Keep the four equiprobable inputs and their label laws from section5, and allow two codewords. An encoder is a four-by-two table q(z|x), with each row summing to one. Begin with positive rows "}{"(.8,"}<wbr/>{".2),"}<wbr/>{"(.6,"}<wbr/>{".4),"}<wbr/>{"(.3,"}<wbr/>{".7),"}<wbr/>{"(.2,"}<wbr/>{".8)."}{" The drawing carries the actual assigned probability mass into each codeword."}</Prose>

<Drawing id="M27"/>

<Prose>{"Multiply every encoder row by its source mass .25. Summing these assigned masses down the first column gives p(Z=0)=.475; the second column gives .525. In general "}{"p(z)="}<wbr/>{"Σₓp(x)q(z|"}<wbr/>{"x)."}{" These are codeword frequencies implied by the encoder, not new free parameters. Their sum stays one because each source row contributes its entire probability mass."}</Prose>

<Prose>{"To obtain a label predictor inside one codeword, retain the identities of the input fragments that reached it and normalize by the codeword mass."}</Prose>

<Drawing id="M28"/>

<Prose>{"For z=0, the assigned source fragments are "}{"(.2,"}<wbr/>{".15,"}<wbr/>{".075,"}<wbr/>{".05),"}{" with total .475. Multiply these unnormalized fragments by their corresponding conditional label laws, (.9,.1), (.9,.1), (.1,.9), (.1,.9), and add by label. This gives joint masses p(Y=0,z=0)=.3275 and p(Y=1,z=0)=.1475. Divide these two masses by .475 exactly once to obtain "}{"p(Y|"}<wbr/>{"z="}<wbr/>{"0)="}<wbr/>{"(.689473684,"}<wbr/>{".310526316)."}{" Equivalently, divide the source fragments by .475 first and mix the label laws with those conditional input weights; that sum is already the conditional decoder and needs no further normalization. For z=1 the joint label masses are (.1725,.3525), so dividing by .525 gives "}{"(.328571429,"}<wbr/>{".671428571)."}{" The general operations are"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"p(x\\mid z)=\\frac{p(x)q(z\\mid x)}{p(z)},\\qquad\np(y\\mid z)=\\sum_x p(x\\mid z)p(y\\mid x)."}</MathBlock></div>

<Prose>{"The denominator is necessary: without it, the sum remains a joint mass rather than a probability law within that codeword. A codeword with zero mass has no determined decoder. The demonstrated algorithm uses positive starts and this positive label fixture; it is not presented as a general solver with arbitrary support deletion and revival."}</Prose>

<Prose>{"Next compare the label law of one input with the label mixture currently represented by each codeword."}</Prose>

<Drawing id="M29"/>

<Prose>{"Their KL divergence "}{"d(x,"}<wbr/>{"z)="}<wbr/>{"D_"}<wbr/>{"KL(p(y|"}<wbr/>{"x)‖p(y|"}<wbr/>{"z))"}{" is the "}<strong>{"predictive distortion"}</strong>{". It measures a mismatch in label distributions, not Euclidean distance between the numeric input labels. Assigning an input to a codeword whose label mixture differs from its own can discard task detail. Common codewords also make a compact description attractive. The update combines those two considerations."}</Prose>

<Prose>{"Use the small row example r=(.25,.75), beta2, and predictive distortions (0,ln2) nats to trace one update before returning to the full four-input law."}</Prose>

<Drawing id="M30"/>

<Prose>{"The unnormalized weights are .25×exp(0)=.25 and "}{".75×"}<wbr/>{"exp(−2ln2)="}<wbr/>{".1875."}{" Dividing by their sum .4375 gives the new row (4/7,3/7). In the full update r is the current codeword marginal:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"a_z(x)=p(z)\\exp[-\\beta d(x,z)],\\qquad\nq_{\\rm new}(z\\mid x)=\\frac{a_z(x)}{\\sum_j a_j(x)}."}</MathBlock></div>

<Prose>{"The exponential requires d in nats. With bit-valued distortion, use 2^(−βd) instead. Feeding a displayed one bit directly into exp(−βd) changes the encoder, not just its units. For numerical stability form log weights log p(z)−βd, subtract their row maximum, then exponentiate. Subtracting a common constant multiplies every weight by the same factor and leaves the normalized row unchanged."}</Prose>

<Prose>{"The live investigation returns to the complete four-input fixture. Its proposed row uses the current decoder. Applying the update creates a new encoder, which implies a new marginal and a new decoder. Keep those times distinct."}</Prose>

<Drawing id="M31"/>

<Prose>{"The distortion table labelled t prices assignments for the transition from q_t to q_(t+1). After that transition, the current assignment bars and objective belong to q_(t+1), while its recomputed decoder is the one used for the next step. Previous/next and the step selector navigate one coherent sequence. Changing beta, label error or initialization regenerates the sequence from its named initial state. Both later mounts share that state; scrolling does not reset it."}</Prose>

<H3>{"Derive the update and understand its guarantee"}</H3>

<Prose>{"Introduce an auxiliary codeword law r(z) and auxiliary label decoder w(y|z). They temporarily stand apart from the distributions implied by q. In nats, define"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"D_w(x,z)=D_{\\rm KL}(p(y\\mid x)\\Vert w(y\\mid z)),\\qquad\nF(q,r,w)=\\mathbb E_{p(x)q(z\\mid x)}\\left[\\log\\frac{q(z\\mid x)}{r(z)}+\\beta D_w(x,z)\\right]."}</MathBlock></div>

<Prose>{"The next ruler decomposes this auxiliary objective into the bottleneck objective, a source-law constant and two nonnegative mismatches."}</Prose>

<Drawing id="M32"/>

<Prose>{"Add and subtract log p(z) in the first expectation. It becomes "}{"I(X;"}<wbr/>{"Z)+"}<wbr/>{"D_"}<wbr/>{"KL(p(z)‖r(z))."}{" In the distortion term, add and subtract log p(y|z). The remaining average difference between input-specific and codeword-specific label laws is I(X;Y)−I(Z;Y), using the Markov condition. Therefore"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"\\begin{aligned}\nF(q,r,w)={}&J(q)+\\beta I(X;Y)\\\\\n&+D_{\\rm KL}(p(z)\\Vert r(z))\\\\\n&+\\beta\\sum_zp(z)D_{\\rm KL}(p(y\\mid z)\\Vert w(y\\mid z)).\n\\end{aligned}"}</MathBlock></div>

<Prose>{"All terms here use one common log base. For fixed q, choose r=p(z) and w=p(y|z) on positive-mass codewords to remove both mismatch terms. At beta0 the decoder term is absent and its minimizer is not unique."}</Prose>

<Prose>{"For fixed r,w, each positive-source row of q minimizes Σ_z q_z[log q_z−log r_z+βD_w(x,z)] subject to Σ_zq_z=1. Its derivative is log q_z−log "}{"r_"}<wbr/>{"z+"}<wbr/>{"1+"}<wbr/>{"βD_"}<wbr/>{"w(x,"}<wbr/>{"z)+"}<wbr/>{"λₓ."}{" Setting it to zero and normalizing produces the exponential row update. This is a separate block minimization, not a rule to deterministically pick the nearest codeword."}</Prose>

<Prose>{"Each exact block minimization cannot increase F. After recomputing r and w from q, both mismatch terms vanish, so F=J+βI(X;Y). The final term is fixed by the original input/label law; consequently complete updates cannot increase J, apart from roundoff. The blocks are not jointly convex. Monotone objective values can stabilize at an inferior stationary encoder."}</Prose>

<Prose>{"Compare two initializations on the same scale and inspect the encoders they reach."}</Prose>

<Drawing id="M33"/>

<Prose>{"At beta3, the informative start reaches J=−.600834647 after40 updates, slightly better than the deterministic signal encoder's −.593013219. Its rate .948950829 is below one, and its relevance .516595159 is below the deterministic .531004406: the reduction in rate compensates for the relevance loss at this beta. A perfectly symmetric start keeps both codewords identical and stays at R=T=J=0. “Nothing changed” is not a certificate that a better encoder is impossible. These are finite iteration results, not a proof of convergence to a global optimum."}</Prose>

<Prose>{"File: "}<code>{"mi_iteration.py"}</code>{""}</Prose>

<Payload file="mi_iteration.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="mi_iteration.stdout.txt" output={true}/>

<Prose>{"The original scratch programme makes the entire sequence explicit: assigned mass, codeword label mixture, KL distances, shifted row weights and normalized new rows. The assertions check finite descent for its positive fixture. They do not certify every possible input support or every initialization. Preserve the distinction between this local optimization problem and the convex rate-distortion problem in the next lesson; its stronger certificates do not transfer automatically."}</Prose>

<Prose>{"The same calculation can use ordinary array operations. Keep the axes visible before reading the broadcasting code."}</Prose>

<Drawing id="M34"/>

<Prose>{"Let A be the input alphabet size, K the codeword count and B the label count. q has shape(A,K), the label conditional has shape(A,B), and multiplying q by p(x) gives assigned mass of shape(A,K). Transposing that mass and multiplying by the label table gives p(z,y) of shape(K,B). Its row sums give p(z), and row normalization gives the decoder. For distortions, an(A,1,B) input-label view and a(1,K,B) decoder view broadcast to(A,K,B); summing over the label axis leaves(A,K). The dense update costs O(ABK) arithmetic. The explicit broadcast temporary costs O(ABK) memory, while a looped implementation can avoid storing that temporary and retain the smaller tables."}</Prose>

<Prose>{"File: "}<code>{""}{"finite_"}<wbr/>{"ib_"}<wbr/>{"reference.py"}{""}</code>{""}</Prose>

<Payload file="finite_ib_reference.py" output={false}/>

<Prose>{"This helper contains the exact complete function definitions and fixture constants from the original scratch programme before its demonstration loop. Keeping the executable example outside this helper means importing it does not repeat an unrelated programme. The array programme calls these functions only as the declared comparison route for its new matched run."}</Prose>

<Prose>{"File: "}<code>{""}{"finite_"}<wbr/>{"ib_"}<wbr/>{"numpy.py"}{""}</code>{""}</Prose>

<Payload file="finite_ib_numpy.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="finite_ib_numpy.stdout.txt" output={true}/>

<Prose>{"At steps0,1,4,40 the code compares the entire encoder, marginal and decoder, as well as R,T,J, against the scalar route. It also calculates F with matched auxiliaries and checks F−J=βI(X;Y). Natural-log distortions drive the update; division by ln2 converts the reported information and free energy to bits. The informative and symmetric outputs preserve the earlier finite-run interpretation."}</Prose>

<Prose>{"The final SciPy call solves just the two-entry row with fixed r=(.25,.75), "}{"distortions(0,"}<wbr/>{"ln2)"}{" and beta2. SLSQP enforces a unit sum and positive numerical bounds. Its "}{"row(.571428570,"}<wbr/>{".428571430)"}{" agrees with the exact Gibbs row(4/7,3/7) within the stated tolerance. This comparison verifies an ordinary "}{"constrained-optimizer"}{" route for that fixed convex row problem. It is not a SciPy implementation or global certificate for the entire nonconvex bottleneck problem. A solver's success flag must be interpreted within the objective and constraints actually supplied."}</Prose>

<Prose>{"For huge input alphabets, estimating and storing the necessary laws is itself difficult. We next replace the inaccessible marginal and decoder with tractable distributions, while keeping track of the price of those replacements."}</Prose>

<H2>{"7. Distinguish a training bound from information"}</H2>

<Prose>{"A high-dimensional encoder may be easy to sample but hard to average over all inputs. Its marginal p(z)=Eₓq(z|x) and its true label conditional p(y|z) can then be inaccessible. A variational method substitutes tractable distributions and tracks how those substitutions change the objective. Keep the encoder q(z|x), codeword reference r(z), and predictive decoder s(y|z) as three distinct objects."}</Prose>

<Prose>{"First consider the cost "}{"U="}<wbr/>{"EₓD_"}<wbr/>{"KL(q(z|"}<wbr/>{"x)‖r(z))."}{" Adding and subtracting log p(z) separates it into true input information and marginal mismatch:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"U=I(X;Z)+D_{\\rm KL}(p(z)\\Vert r(z))\\geq I(X;Z)."}</MathBlock></div>

<Prose>{"For prediction let C=E_(Y,Z)[−log s(Y|Z)] be the decoder cross-entropy. Subtracting conditional entropy leaves "}{"G_"}<wbr/>{"s="}<wbr/>{"E_"}<wbr/>{"zD_"}<wbr/>{"KL(p(y|"}<wbr/>{"z)‖s(y|"}<wbr/>{"z))."}{" Therefore the relevance surrogate is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"L=H(Y)-C=I(Y;Z)-G_s\\leq I(Y;Z)."}</MathBlock></div>

<Prose>{"The first substitution gives an upper bound on rate; the second gives a lower bound on relevance. The following picture fixes the true information coordinates and changes only the two auxiliary choices."}</Prose>

<Drawing id="M35"/>

<Prose>{"The fixed noisy encoder has R=.278071905 and T=.173253628 bits. Matching the reference to the true marginal closes the rate gap. Matching the decoder to the true conditional closes the relevance gap. A poor decoder can make L negative even though true MI cannot be negative. A zero decoder probability on a positive-mass event gives infinite cross-entropy; compatible support is a mathematical requirement, not an optional plotting adjustment. The live controls alter these auxiliaries while the encoder and its true dots remain fixed on the same axes."}</Prose>

<Prose>{"Combining the two bounds gives an upper objective. The next ruler labels each piece of its gap and shows the coefficient conversion used by many training losses."}</Prose>

<Drawing id="M36"/>

<Prose>{"Writing "}{"G_"}<wbr/>{"r="}<wbr/>{"D_"}<wbr/>{"KL(p(z)‖r(z)),"}{" we have"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"\\begin{aligned}\nJ&=R-\\beta T,\\\\\n\\widetilde J&=U-\\beta L=U+\\beta C-\\beta H(Y),\\\\\n\\widetilde J-J&=G_r+\\beta G_s\\geq0.\n\\end{aligned}"}</MathBlock></div>

<Prose>{"For a fixed data law H(Y) is constant, so minimizing U+βC minimizes the same upper objective. For β>0, dividing the entire expression by beta gives C+λU with λ=1/β. A larger compression weight lambda thus corresponds to a smaller relevance weight beta in the earlier convention. At beta0 this division is invalid; the original objective simply minimizes rate. Tightening an auxiliary mismatch can lower the upper objective while both true information values remain unchanged."}</Prose>

<Prose>{"File: "}<code>{"mi_bounds.py"}</code>{""}</Prose>

<Payload file="mi_bounds.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="mi_bounds.stdout.txt" output={true}/>

<Prose>{"The finite programme computes the true encoder laws first, then separately evaluates the reference and decoder replacements. It checks the two exact gap identities rather than calling either bound an MI estimate. With matched auxiliaries the reported upper objective equals the true objective; with mismatched auxiliaries their difference is the sum of the declared nonnegative gaps. This finite example makes quantities visible that a large neural model may not permit us to evaluate exactly."}</Prose>

<H3>{"Compute a small Gaussian bottleneck step"}</H3>

<Prose>{"A neural encoder can output a mean μ(x) and a positive standard deviation σ(x), defining a diagonal Gaussian q(z|x). Draw independent standard-normal noise epsilon and use "}{"z="}<wbr/>{"μ(x)+"}<wbr/>{"σ(x)⊙epsilon."}{" The actual mechanism is an affine transformation of independent noise, followed by a label decoder."}</Prose>

<Drawing id="M37"/>

<Prose>{"The mean sets the centre of the conditional distribution; the standard deviation scales the random displacement. This is the pathwise derivative mechanism from "}<a href={"/learn/path/full-curriculum/variational-inference#6-differentiate-an-expectation"}>{"Variational Inference"}</a>{": hold the sampled epsilon fixed while differentiating through the transformation. Valid differentiation of the expected objective additionally requires the usual integrability and interchange conditions. The earlier programme applies this technique to an ELBO; here the task is supervised label prediction."}</Prose>

<Prose>{"For a standard-normal reference, write v_j=σ_j². The per-input Gaussian KL is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"D_{\\rm KL}(q(z\\mid x)\\Vert\\mathcal N(0,I))\n=\\tfrac12\\sum_j(\\mu_j^2+v_j-1-\\log v_j)."}</MathBlock></div>

<Prose>{"This formula uses natural logarithms and gives nats. Use decoder cross-entropy in nats too. Averaging its analytic KL removes sampling noise from that term, but does not make it exact I(X;Z): the marginal mismatch gap remains."}</Prose>

<Prose>{"To see every computational step, use a scalar encoder μ=aS+bN+c, shared standard deviation exp(d), and binary-decoder logit ℓ=uz+v. Declare four input "}{"rows(S,"}<wbr/>{"N)="}<wbr/>{"00,"}<wbr/>{"01,"}<wbr/>{"10,"}<wbr/>{"11,"}{" targets(0,0,1,0), and fixed comparison "}{"noises(−1,"}<wbr/>{".5,"}<wbr/>{".5,"}<wbr/>{"−1)."}{" These are constructed batch and noise values for checking arithmetic, not a claim that this four-row batch exactly realizes the earlier population's .1 label-noise law. "}{"Initialize(a,"}<wbr/>{"b,"}<wbr/>{"c)="}<wbr/>{"(.8,"}<wbr/>{".3,"}<wbr/>{"−.4),"}{" d=ln(.7), "}{"and(u,"}<wbr/>{"v)="}<wbr/>{"(1.1,"}<wbr/>{"−.2)."}{" Use compression weight λ=.2 and a single gradient step of size .01."}</Prose>

<Drawing id="M38"/>

<Prose>{"In the first row μ=−.4, "}{"z="}<wbr/>{"−.4+"}<wbr/>{".7×"}<wbr/>{"(−1)="}<wbr/>{"−1.1,"}{" and "}{"ℓ="}<wbr/>{"1.1×"}<wbr/>{"(−1.1)−.2="}<wbr/>{"−1.41."}{" For target0 its stable logistic cross-entropy is .218447167 nats. The Gaussian KL is "}{".5[(−.4)²+"}<wbr/>{".7²−1−2ln(.7)]="}<wbr/>{".181674944"}{" nats. Each row contributes to the mean objective C+λU; no "}{"batch-size-dependent"}{" sum is silently substituted."}</Prose>

<Prose>{"For one row, the derivative of logistic cross-entropy with respect to its logit is g= sigmoid(ℓ)−y. The label path gives ∂CE/∂μ=ug and "}{"∂CE/∂d="}<wbr/>{"ug·σ·epsilon."}{" The KL derivatives are μ and σ²−1, respectively. Thus the combined mean-gradient contributions before averaging are"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"\\begin{aligned}\ng_\\mu&=ug+\\lambda\\mu,\\\\\n(g_a,g_b,g_c)&=(Sg_\\mu,Ng_\\mu,g_\\mu),\\\\\ng_d&=ug\\sigma\\epsilon+\\lambda(\\sigma^2-1),\\\\\n(g_u,g_v)&=(gz,g).\n\\end{aligned}"}</MathBlock></div>

<Prose>{"File: "}<code>{""}{"gaussian_"}<wbr/>{"vib_"}<wbr/>{"step.py"}{""}</code>{""}</Prose>

<Payload file="gaussian_vib_step.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="gaussian_vib_step.stdout.txt" output={true}/>

<Prose>{"The standard-library route evaluates stable softplus as "}{"max(ℓ,"}<wbr/>{"0)+"}<wbr/>{"log1p(exp(−|"}<wbr/>{"ℓ|"}<wbr/>{"))"}{" and differentiates the same expression analytically. The Torch route uses CPU float64 tensors, "}<code>{""}{"binary_"}<wbr/>{"cross_"}<wbr/>{"entropy_"}<wbr/>{"with_"}<wbr/>{"logits"}{""}</code>{" with mean reduction, the analytic Gaussian KL, and "}<code>{"autograd.grad"}</code>{". It does not apply sigmoid before the logits loss. All six gradients agree within the asserted tolerance on identical inputs and fixed noise."}</Prose>

<Prose>{"The initial mean cross-entropy is .494159214, the mean KL .204174944, and their weighted objective .534994203 nats. The declared step produces .532473082 on that same fixed-noise batch. This is one bounded optimization calculation, not true MI, a converged learner or a generalization result. Intended stochastic training would draw fresh independent noise, average over data, and evaluate task performance, calibration and the declared surrogate on fresh held-out examples. The scalar-width calculation takes O(N) work for N rows; larger tensor widths introduce their own matrix costs."}</Prose>

<Prose>{"A variational autoencoder reconstructs X under a generative model; this supervised bottleneck predicts Y. Similar Gaussian and KL operations can serve different objectives. A further distinction matters when the representation contains a sensitive attribute as well as task information."}</Prose>

<Drawing id="M39"/>

<Prose>{"Exact population I(Z;A)=0 implies marginal independence from attribute A. It does not imply independence after another variable is known. Reuse XOR: if fair independent A,B produce Z=A XOR B, then Z is marginally independent of A, but knowing B and Z recovers A exactly. An estimated MI near zero is weaker still. An information-plane plot alone therefore does not establish fairness, privacy, causality, robustness or performance on a changed deployment law. Those questions require their own variables, threat or decision model, and evaluation."}</Prose>

<H2>{"8. Handle continuous values and measurement noise"}</H2>

<Prose>{"The "}{"joint-versus-product"}{" definition extends beyond tables: "}{"I(X;"}<wbr/>{"Z)="}<wbr/>{"D_"}<wbr/>{"KL(P_"}<wbr/>{"XZ‖P_"}<wbr/>{"XP_"}<wbr/>{"Z),"}{" with probability measures in place of finite masses. It remains nonnegative and can be infinite. To see what changes, draw a continuous joint distribution before trying to subtract entropy formulas."}</Prose>

<Drawing id="M40"/>

<Prose>{"Let X and E be independent standard normals and let Z=X+σE for σ>0. The joint cloud has mean zero and covariance matrix [[1,1],[1,1+σ²]]. At a fixed X=x, its conditional slice in Z is normal with mean x and standard deviation sigma. The width is a standard deviation on the coordinate axis, not a probability mass or a variance drawn as a length. Narrower conditional slices make the observation more precise about X."}</Prose>

<Prose>{"When joint densities exist and the required differential entropies are finite, one may write "}{"I(X;"}<wbr/>{"Z)="}<wbr/>{"h(X)+"}<wbr/>{"h(Z)−h(X,"}<wbr/>{"Z),"}{" or h(Z)−h(Z|X). Differential entropy can be negative and depends on the coordinate units. Do not subtract undefined or infinite differential entropies. For jointly Gaussian scalars with correlation rho and |rho|<1, the finite result is−.5log(1−rho²) in the chosen log base."}</Prose>

<Prose>{"For the additive-noise law, the observation variance is1+σ² and the conditional variance isσ². The noise enters a specific addition node; connect that operation to the information curve."}</Prose>

<Drawing id="M41"/>

<Prose>{"Using "}{"h(N(0,"}<wbr/>{"v))="}<wbr/>{".5log₂(2πev),"}{" the shared constants cancel and give"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"I(X;Z)=\\tfrac12\\log_2\\left(1+\\frac1{\\sigma^2}\\right)."}</MathBlock></div>

<Prose>{"At sigma.5 this is "}{".5log₂5="}<wbr/>{"1.160964047"}{" bits; at sigma1 it is .5 bit. Halving a standard deviation quarters its variance, which explains the squared scale. The investigation changes noise and coordinate scale separately. Small positive sigma still denotes a noisy, "}{"finite-information"}{" law; it must not be rounded into the exact zero-noise branch."}</Prose>

<Prose>{"Now multiply the entire observation by10. Trace corresponding physical outcomes under the two coordinate rulers."}</Prose>

<Drawing id="M42"/>

<Prose>{"The transformation Z′=10Z is invertible. Its density is stretched horizontally and scaled vertically by1/10 to preserve total probability. Both h(Z) and h(Z|X) increase by log₂10, so their finite difference stays unchanged. The covariance with X scales by10, and the observation variance by100. This is a change of units. Adding fresh noise or quantizing into bins instead changes the information-preserving relationship and cannot increase population MI under the processing assumption."}</Prose>

<Prose>{"File: "}<code>{"mi_continuous.py"}</code>{""}</Prose>

<Payload file="mi_continuous.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="mi_continuous.stdout.txt" output={true}/>

<Prose>{"The preserved numerical loop calculates the Gaussian determinant and repeats it after the coordinate transformation. Its equal results verify the declared positive-noise cases. The explanatory zero-noise sentence appears here in prose rather than being printed as if it were another measured numerical output. The loop is a closed-form Gaussian calculation, not a general continuous-data estimator."}</Prose>

<Prose>{"At sigma0 the joint cloud collapses to an exact line. Compare that line with what the product of two continuous marginals assigns to it."}</Prose>

<Drawing id="M43"/>

<Prose>{"The joint law places probability one on Z=X. Independent continuous draws put probability zero on that diagonal. The joint is therefore not absolutely continuous with respect to the product law, and its KL—and MI—is infinite. No finite-height bar represents this value. More generally, a deterministic output Z=f(X) with a nonatomic output law has infinite MI with X: exact real values preserve arbitrarily fine distinctions."}</Prose>

<Prose>{"A deterministic finite-valued output is different. For the sign of standard-normal X, the zero event has probability zero and the two signs are equally likely. Its MI with X is the one-bit entropy of that sign. Thus a one-dimensional output can carry finite or infinite information depending on noise and precision. Any finite reported “MI of a deterministic neural layer” needs its quantization, injected noise, estimator or other measurement convention stated. A finite estimate does not refute the infinite exact-value conclusion."}</Prose>

<H2>{"9. Check what a sample can support"}</H2>

<Prose>{"Until now we knew a complete probability law. With observed data, a simple "}<strong>{"plug-in estimator"}</strong>{" counts paired values, divides by the sample size, and computes MI of that empirical table. The drawing distinguishes a declared population law from the particular rows it generated."}</Prose>

<Drawing id="M44"/>

<Prose>{"An independent population has MI zero. Its finite sample need not contain exactly the proportions that factor into independent row and column marginals. The empirical MI can therefore be positive. An8×8 table has many more cells to estimate than a2×2 table at the same sample size, making sparse counts consequential. This independence example does not prove a universal sign for estimation error under every dependent law. An individual estimate can also move in either direction when more observations are added."}</Prose>

<Prose>{"The simulation exposes its sample count, alphabet, law and seed. Within one setting, increasing the count uses a coherent prefix of the same seeded stream. The browser's xorshift generator and Python's "}<code>{"random.Random"}</code>{" are different declared generators; a matching seed number would not make their streams identical. The plotted quantity is always the MI of the current empirical table, with the known population value as a separate reference."}</Prose>

<Prose>{"Now keep the actual observed X and Y values, but permute the donor rows supplying Y. Follow one permutation before inspecting a collection of shuffled scores."}</Prose>

<Drawing id="M45"/>

<Prose>{"Every original Y appears exactly once in the new paired rows, so its marginal count is unchanged; X's marginal is unchanged because its rows stayed in place. The joint pairing changes. A particular shuffled table is not guaranteed to factor exactly or have MI zero. Twenty shuffled values illustrate the variability of this diagnostic under the observed marginals; they are not a confidence interval or a calibrated significance test. A formal permutation test needs an exchangeability argument, a statistic and a stated decision rule. Temporal, grouped or repeated observations may not permit unrestricted shuffling."}</Prose>

<Prose>{"File: "}<code>{"mi_estimation.py"}</code>{""}</Prose>

<Payload file="mi_estimation.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="mi_estimation.stdout.txt" output={true}/>

<Prose>{"The programme constructs a count table from a specified independent generator and evaluates its empirical law. Its seeded examples expose how a small alphabet and a larger sample can change the apparent dependence; they do not assert monotonicity for every realized sequence. Direct counting costs O(N+AB) for N records and an A-by-B table; making twenty complete permutations adds O(20N) work. Exact table probabilities, sample estimates and shuffled diagnostics remain separate objects."}</Prose>

<Prose>{"The final programme example assigns every observed row a unique ID. Draw its singleton groups next to an ID that was never observed."}</Prose>

<Drawing id="M46"/>

<Prose>{"Each training ID determines its one recorded label, so the empirical conditional entropy is zero and the empirical MI equals the one-bit label entropy. No rule for a new ID follows. Finer measurement bins can create a similar sparse-table effect. Storage as an integer does not make a continuous measurement a categorical variable. Choose an estimator according to the variable's meaning and sampling assumptions, not its array dtype."}</Prose>

<Prose>{"Fit feature selection, binning and estimator tuning inside the training portion of each evaluation fold. For deployment to new participants, keep whole participants out of training. Splitting only after choosing features using all labels leaks evaluation information. "}<a href={"/learn/topic/feature-selection-importance-shap-permutation-mutual-info"}>{"Feature Selection & Importance"}</a>{" owns the full train-only selection and held-out workflow; the information statistic by itself is not that validation procedure."}</Prose>

<H3>{"Use the same counts in the ordinary API"}</H3>

<Prose>{"The next comparison carries one integer contingency table into both a manual sum and library calls. The row/column labels and units remain explicit."}</Prose>

<Drawing id="M47"/>

<Prose>{"The table [[30,10],[10,30]] has80 observations. Its agreement fraction is .75, deliberately different from section1's .8 law. Its MI is .130812036 nats, or .188721876 bits. "}<code>{""}{"mutual_"}<wbr/>{"info_"}<wbr/>{"score(contingency="}<wbr/>{"counts)"}{""}</code>{" takes actual counts rather than a normalized probability table. "}<code>{""}{"mutual_"}<wbr/>{"info_"}<wbr/>{"classif"}{""}</code>{" on the expanded80 rows uses "}<code>{""}{"discrete_"}<wbr/>{"features="}<wbr/>{"True"}{""}</code>{" because these values are categories. Both return nats, so divide by ln2 for bits."}</Prose>

<Prose>{"File: "}<code>{"mutual-information-library-bridge.py"}</code>{""}</Prose>

<Payload file="mutual-information-library-bridge.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="mutual-information-library-bridge.stdout.txt" output={true}/>

<Prose>{"The bridge validates nonnegative integer counts and masks empty cells before taking logs. Duplicating all counts or consistently relabelling categories preserves the plug-in MI. The replacement table [[2,4],[3,6]] factors into its marginals and gives zero up to roundoff. Adding an all-zero category changes no occupied contribution. The unique-ID example again gives empirical one-bit information without establishing population usefulness; that interpretation belongs to the text rather than a printed pseudo-measurement."}</Prose>

<Prose>{"The dense table route needs O(rc) time and storage for r-by-c categories. Expanding N rows here makes the feature-estimator API visible; a large sparse contingency table should remain sparse. Continuous nearest-neighbour estimators use different assumptions and tuning. The discrete-feature flag changes the statistical treatment, not just storage. Some estimated MI outputs are clipped at zero by the API; a returned zero does not certify population independence. An MI feature score is also not an information-bottleneck optimizer: the latter requires the encoder, relevance objective and iterative construction from section6."}</Prose>

<H3>{"Inspect an observed law and a deliberate coarsening"}</H3>

<Prose>{"Use the offline Palmer penguins records from the preceding Entropy example. This time the question is descriptive association, not held-out prediction cost. Species, island and year are present in all344 records; missing body measurements do not remove rows from this calculation. The actual table and a specified grouping make the change visible."}</Prose>

<Drawing id="M48"/>

<Prose>{"With species rows "}{"Adelie,"}<wbr/>{"Chinstrap,"}<wbr/>{"Gentoo"}{" and island columns "}{"Biscoe,"}<wbr/>{"Dream,"}<wbr/>{"Torgersen,"}{" the observed counts are "}{"[[44,"}<wbr/>{"56,"}<wbr/>{"52],"}<wbr/>{"[0,"}<wbr/>{"68,"}<wbr/>{"0],"}<wbr/>{"[124,"}<wbr/>{"0,"}<wbr/>{"0]]."}{" Computing MI of this empirical law gives .750428171 bits. Merge Dream and Torgersen into “other,” retaining Biscoe separately. The new table is "}{"[[44,"}<wbr/>{"108],"}<wbr/>{"[0,"}<wbr/>{"68],"}<wbr/>{"[124,"}<wbr/>{"0]],"}{" with MI .616057102 bits. The .134371069-bit loss is a deterministic coarsening under the same empirical law, so it obeys data processing exactly. This does not establish that island causes species or that the study is a random census of all Antarctic penguins."}</Prose>

<Prose>{"Year selection asks a different question: it changes which observations define the law. There are110 records from2007,114 from2008 and120 from2009. Conditional information "}{"I(species;"}<wbr/>{"island|"}<wbr/>{"year)"}{" weights the within-year MI values by these actual frequencies. It is .744684498 bits; the unweighted average .745617934 is different. Switching years is not an encoder operation on one fixed source law. The live view labels the year and denominator beside every table; grouping within that selected table then compares like with like."}</Prose>

<Prose>{"File: "}<code>{""}{"penguins_"}<wbr/>{"information.py"}{""}</code>{""}</Prose>

<Payload file="penguins_information.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="penguins_information.stdout.txt" output={true}/>

<Prose>{"The CSV reader validates the selected categorical fields and checks the declared file hash. The scalar sum uses integer counts and log differences; scikit-learn receives the same contingency. Assertions compare their units, verify coarsening does not increase empirical MI, and check that merging every island into one group gives zero. Counting costs O(N); the tiny fixed tables cost O(rc). There is no fitted predictive model or train/test estimate in this descriptive experiment. Keep the file's CC0 provenance with it: "}<a href={"https://allisonhorst.github.io/palmerpenguins/"}>{"Palmer penguins documentation"}</a>{" describes the dataset, and "}<a href={"https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0090081"}>{"Gorman, Williams and Fraser"}</a>{" describes the field study."}</Prose>

<H3>{"Distinguish a critic objective from exact information"}</H3>

<Prose>{"An information-based training objective can avoid an explicit density estimate while still depending on a precise sampling law. InfoNCE asks which candidate belongs with a context. Draw how the candidate set is made before interpreting a score."}</Prose>

<Drawing id="M49"/>

<Prose>{"For context X, one candidate Y⁺ comes from the conditional law p(y|X). The other K−1 candidates come independently from the target marginal p(y). A fixed positive critic f(x,y) scores all candidates, and the selected positive receives normalized score "}{"f(X,"}<wbr/>{"Y⁺)/Σ_"}<wbr/>{"jf(X,"}<wbr/>{"Y_"}<wbr/>{"j)."}{" Its negative log is a classification loss. Averaging over this population sampling experiment gives L_K. Negatives drawn from a different law, dependent selection rules or an adaptive critic require rechecking the argument."}</Prose>

<Prose>{"The population bound and one finite observed score are distinct quantities. The next scale shows the bound's own ceiling without turning that ceiling into a claim about true MI."}</Prose>

<Drawing id="M50"/>

<Prose>{"Under the stated sampling setup, I(X;Y)≥log K−L_K in the same log units. Since L_K≥0, this displayed lower bound cannot exceed log K. True MI can be larger. An observed minibatch loss is a random estimate of the population expectation; optimizing a critic on those same observations creates an additional selection issue. A good classification loss is therefore not automatically a trustworthy measurement of true MI."}</Prose>

<Prose>{"Another variational route uses a real-valued critic T and the population functional E_joint[T]−log "}{"E_"}<wbr/>{"product[exp(T)],"}{" under conditions making these expectations meaningful. Its value is at most "}{"joint-versus-product"}{" KL. The exponential term is sensitive to events that a finite sample can miss."}</Prose>

<Drawing id="M51"/>

<Prose>{"The product-law picture contains a rare region with large critic score. If a sample misses it, its empirical mean of exp(T) can underestimate the population denominator, making the empirical functional look too large. This explains a risk; it is not by itself a proof of every estimator's finite-sample error. MINE parameterizes a critic and optimizes such variational objectives, with its own gradient and estimation choices. Distribution-free high-confidence lower bounds from finite data have formal limitations of order log(sample size). That statement has a particular distribution-free confidence setting; it does not impose one universal ceiling on exact known-law calculations or every estimator using additional structural assumptions."}</Prose>

<Prose>{"The contrastive-learning destination develops augmentation, negative sampling and full training. Here the owned outcome is to identify the population sampling law, distinguish the bound from a batch score, and state what a reported number measures. Original papers provide deeper derivations: "}<a href={"https://proceedings.mlr.press/v97/poole19a/poole19a.pdf"}>{"Poole and colleagues"}</a>{" compare variational bounds, "}<a href={"https://proceedings.mlr.press/v80/belghazi18a/belghazi18a.pdf"}>{"MINE"}</a>{" develops the neural critic route, and "}<a href={"https://proceedings.mlr.press/v108/mcallester20a/mcallester20a.pdf"}>{"McAllester and Stratos"}</a>{" state the distribution-free limitation precisely."}</Prose>

<Prose>{"Before trusting an information claim, identify the variables and population, whether the number is exact information or a bound or an empirical estimate, its log units and measurement resolution, the assumed factorization and support, and how fitting was separated from evaluation. These are different parts of the experiment, not interchangeable caveats."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"10. Practise and connect the next question"}</H2>

<Prose>{"Try each prompt before opening its hint or solution. The tasks ask for operations and changed cases, not only remembered definitions. The code files remain complete and runnable; the small repair file collects reusable exercise functions."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Weight the contexts"}</H3>

<Prose>{"Start with joint rows (.45,.15) and (.10,.30). Compute both marginals, I(X;Y), H(Y|X), and one negative pointwise information value. Explain why this table cannot expose a helper that uniformly averages row entropies. Repair that helper using joint rows (.675,.075), (.125,.125); then change only the context masses to (.5,.5) and finally (1,0), preserving both conditional rows."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Normalize each positive row, but weight its entropy by the original row mass. For the first table, the row totals are (.6,.4) and column totals (.55,.45). Compare the two row entropies before deciding whether a uniform mean is a useful test."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{""}{"H(Y)="}<wbr/>{"h₂(.45)≈.992774"}{" bits. Each row, after normalization, has probabilities (.75,.25) or (.25,.75), so "}{"H(Y|"}<wbr/>{"X)="}<wbr/>{"h₂(.25)≈.811278."}{" MI≈.181496 bits. For cell (0,1), "}{"log₂(.15/(.6·.45))="}<wbr/>{"log₂(5/9)≈−.847997"}{" bits; its weighted contribution is about −.127200. Negative local contributions do not make the total negative."}</Prose>

<Prose>{"Because the first table has equal row entropies, uniform averaging accidentally agrees. The repair fixture has conditional rows (.9,.1) and (.5,.5), with entropies .468995594 and 1. Their actual weights (.75,.25) give .601746695, while the incorrect uniform mean gives .734497797. Equal context masses produce joint rows (.45,.05), (.25,.25) and make the latter value correct. With masses (1,0), the joint rows are (.9,.1), (0,0), so the total is .468995594 and the empty conditional is skipped. "}<code>{""}{"checked_"}<wbr/>{"information"}{""}</code>{" returns the weighted total as its second result."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Separate average information from a decision"}</H3>

<Prose>{"For independent fair U,V and Y=U OR V, identify which U observation increases uncertainty, compute the weighted average, and design the correct decoder when a fair observed bit always disagrees with its label."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"List the four equally likely pairs first; keep the observation-specific and average entropies separate."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"Y has entropy "}{"h₂(.75)="}<wbr/>{".811278124."}{" U=0 leaves a fair label and entropy1, while U=1 fixes the label and entropy0. The average is .5, so MI is .311278124 bits. An always-wrong feature should be inverted: it has one bit of information even when the copying decoder has zero accuracy. The two crossed paths, not the accuracy of that mistaken rule, determine the information."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Repair a finite-law implementation"}</H3>

<Prose>{"Write a validated rectangular-joint helper. Diagnose "}<code>{"p*log2(p/(px*py))"}</code>{" on "}{"[[1-2e-200,"}<wbr/>{"1e-200],"}<wbr/>{"[1e-200,"}<wbr/>{"1e-200],"}<wbr/>{"[0,"}<wbr/>{"0]],"}{" and diagnose a uniform row-entropy mean. Reject negative, nonfinite and nonnormalized inputs. Check transposition, relabelling and splitting one row into two proportional subrows."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Skip zero cells and zero rows before logarithms. Use a difference of logs to avoid an underflowed product. A proportional row split adds an independent refinement inside that row."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"The tiny positive bottom-right occupied cell can have a positive joint mass while its product marginal underflows. Log differences stay finite. The displayed "}<code>{"1-2e-200"}</code>{" rounds to1 in ordinary float64; this fixture specifically tests arithmetic representation and the helper accepts the normalized total within its declared tolerance. It does not pretend to retain a decimal subtraction smaller than machine precision. Transposition and relabelling preserve MI. Splitting a row into proportional copies preserves its conditional law and leaves MI unchanged. The complete repair file below supplies the validated calculation and the later small exercise helpers; it defines functions without running a demonstration."}</Prose>

<Payload file="practice-solutions.py" output={false}/>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Build the preimage groups"}</H3>

<Prose>{"For X uniform on {−1,0,1} and Y=X², draw every source-to-group edge for Z₁=|X| and Z₂=1[X>0]. Compute each group’s label mixture and MI, identify the sufficient representation, and calculate the conditional information lost by Z₂."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Write each source member beside its output group. Z₂=0 contains equally likely X=−1 and X=0; Z₂=1 determines Y."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"The magnitude groups {−1,1} and {0} are label-pure. Thus Z₁ determines Y and "}{"I(Y;"}<wbr/>{"Z₁)="}<wbr/>{"H(Y)≈.918296"}{" bits. The threshold groups are {−1,0} and {1}; the first has mass 2/3 and a fair label, while the second has mass 1/3 and a fixed label. Consequently H(Y|Z₂)=2/3 bit, I(Y;Z₂)≈.251629 bits and I(Y;X|Z₂)=2/3 bit. Z₁ is sufficient for this task; Z₂ discards magnitude information. The cancellation of positive and negative covariance contributions does not erase this dependence."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Compute conditional information"}</H3>

<Prose>{"Implement conditional MI from joint context layers. Use context 0 table (.375,0;0,.375), context 1 table "}{"(.0625,"}<wbr/>{".0625;"}<wbr/>{".0625,"}<wbr/>{".0625),"}{" and an optional zero layer. Compare with an unweighted mean and the copied common-bit example X=Y=C. Then apply the chain rule to a different law: A is fair, B is independent with P(B=1)=.1, and Y=A XOR B. Find I(A;Y), I(B;Y), I((A,B);Y) and I(A;Y|B); explain why adding the first two misses information."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Normalize each positive-mass layer, calculate its MI, then weight by the layer’s original mass. In the XOR law, Y is fair, B is the uncertainty remaining after A, and A determines Y once B is known."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"The first context masses are .75 and .25; their conditional MIs are 1 and 0, giving .75 bit. A uniform mean incorrectly gives .5. A zero layer contributes nothing. "}<code>{""}{"conditional_"}<wbr/>{"information"}{""}</code>{" implements these operations. For X=Y=C, unconditional MI is 1 but every conditional slice is constant, so conditional MI is 0."}</Prose>

<Prose>{"The answers are 1−h₂(.1)≈.531004, zero, one and one bit. Adding individual MI gives only .531004. The correct chain decomposition is "}{"I(B;"}<wbr/>{"Y)+"}<wbr/>{"I(A;"}<wbr/>{"Y|"}<wbr/>{"B)="}<wbr/>{"0+"}<wbr/>{"1."}{" The extra value of A after B is known differs from its value alone."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Audit a processing claim"}</H3>

<Prose>{"Compose the label-error .1 and encoder-error .2 channels from their conditional factors. Compute the remaining information and the exact loss, then explain what changes if the encoder is allowed to append the true label."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Disagreement requires exactly one flip. The proof uses the same triple law in two chain-rule orders."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"The effective disagreement is .1×.8+.9×.2=.26. Original MI is .531004406, remaining MI .173253628, and loss .357750778 bits, equal to I(Y;X|Z). Appending Y violates the assumed factorization p(x,y)q(z|x). The apparent contradiction concerns a changed premise, not an invalid inequality. A fitted encoder must be evaluated on fresh observations with its fitting randomness handled explicitly."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Implement the error partition"}</H3>

<Prose>{"For Z "}{"rows(.30,"}<wbr/>{".10,"}<wbr/>{".10),"}<wbr/>{"(.05,"}<wbr/>{".25,"}<wbr/>{".20),"}{" implement a Bayes decoder with lowest-index ties and construct the wrong-label mass table. Compute Pe,H(Y|Z), and the Fano upper bound. Replace the second row by(.05,.20,.25) and state what changes."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The two rows have equal mass .5. Exclude the guessed label when counting the remaining error alternatives."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{""}<code>{"bayes_error"}</code>{" returns decisions[0,1], wrong-mass "}{"rows(0,"}<wbr/>{".10,"}<wbr/>{".10),"}<wbr/>{"(.05,"}<wbr/>{"0,"}<wbr/>{".20),"}{" and Pe=.45. "}{"H(Y|"}<wbr/>{"Z)="}<wbr/>{"1.365957321"}{" and the bound "}{"h₂(.45)+"}<wbr/>{".45log₂2="}<wbr/>{"1.442774454"}{" bits. Replacing the second row swaps its final two label identities: the decision becomes2, but its maximum, entropy, total error and bound are unchanged. Using log₂3 would give a weaker expression, not the stated Fano term. For a binary Bayes decoder Pe≤.5, which matters before inverting binary entropy on its increasing branch."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Change the task before choosing the encoder"}</H3>

<Prose>{"For the signal/nuisance law, compare constant, signal and both at β=.5 and β=4. Add a signal encoder corrupted by an independent fair coin: write its rows and compare output entropy with input information. Finally change the target to the noiseless label Y=N and compare retaining S, N and both at β=4."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Use the original (rate,relevance) pairs (0,0), (1,.531004) and (2,.531004). Rate is H(Z)−H(Z|X), so encoder randomness matters. Recompute relevance under the changed label law."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"At β=.5 the original objectives are 0, .734498 and 1.734498; at β=4 they are 0, −1.124018 and −.124018. Signal is best among those three, without proving optimality among every stochastic encoder. Each fair-coin-corrupted row is (.5,.5), so H(Z)=H(Z|X)=1 and both rate and relevance are 0. With target Y=N, retaining N gives (R,T)=(1,1), hence J=−3; retaining S gives J=1, and retaining both gives J=−2. Nuisance status belongs to the task, so the label change requires recomputing the joint law."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Repair an update"}</H3>

<Prose>{"Implement a two-codeword Gibbs update for r=(.25,.75), β=2 and predictive distortions (0,ln 2) nats. Calculate the row, compare common log-weight offsets 0 and −1000, and diagnose substituting the displayed bit value 1 inside exp. Explain why zero reference support requires an explicit policy."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Form r(z)exp(−βd), then subtract the maximum log weight before exponentiating. A common additive log offset changes no normalized ratio; a change of logarithm base needs a corresponding exponential base."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"The weights are "}{"(.25,"}<wbr/>{".75/4)="}<wbr/>{"(.25,"}<wbr/>{".1875),"}{" giving (4/7,3/7). "}<code>{""}{"gibbs_"}<wbr/>{"row([.25,"}<wbr/>{".75],"}<wbr/>{"[0,"}<wbr/>{"log(2)],"}<wbr/>{"2)"}{""}</code>{" produces that row, and offset −1000 preserves it within roundoff. Unshifted exponentials can both underflow and produce 0/0. Substituting exp(−2·1) wrongly treats a bit as a nat; the equivalent base-2 weight is .75·2⁻². Zero reference probability excludes a codeword from this positive-support formula. The helper rejects it explicitly; adding epsilon would change the optimization problem."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"10. Diagnose an optimization result"}</H3>

<Prose>{"For a fixed nonuniform source and encoder, verify the free-energy identity with mismatched r and w and identify each block-minimizing update. Then build the changed-task experiment with fair independent X=(S,N), label flip .2 and β=4: compare constant, signal and both, and run 40 updates from informative and symmetric starts. Explain why an unchanged constant encoder need not be optimal."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Calculate every term from the same joint law and log base. Use two LABEL rows (.8,.2) followed by two (.2,.8), validate encoder row sums and check finite objective descent. Compare explicit candidates before interpreting the optimizer."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"Form p(z), p(y|z), R, T and I(X;Y) from p(x,y)q(z|x). Directly evaluate F and compare it with "}{"J+"}<wbr/>{"βI(X;"}<wbr/>{"Y)+"}<wbr/>{"KL(pz|"}<wbr/>{"|"}<wbr/>{"r)+"}<wbr/>{"βΣz"}{" pz KL(py|z||w). Matching r and w removes their respective KL terms; holding them fixed gives the row Gibbs update. These are block minimizations, not a proof of joint convexity. Identical codeword predictors can keep symmetric rows unchanged."}</Prose>

<Prose>{"The constant, signal and both objectives are 0, −.112288 and .887712. The informative start after 40 updates gives rate .698380, relevance .218212 and J=−.174466. Its first two encoder rows have P(Z=1|X)≈.053630 and the last two ≈.946370. The symmetric start remains at "}{"rate="}<wbr/>{"relevance="}<wbr/>{"J="}<wbr/>{"0."}{" These are independently checked results for the declared initialization and finite run; verify them to about 10⁻⁵, row sums within 10⁻¹², and no objective increase beyond roundoff. They demonstrate an improved feasible stochastic encoder and an inferior stationary initialization. They do not establish the global optimum of every encoder family or performance on a different deployment distribution."}</Prose>

<Prose>{"The complete solution below includes both initializations. Its output belongs to the original finite 40-step run."}</Prose>

<Prose>{"File: "}<code>{""}{"mi_"}<wbr/>{"changed_"}<wbr/>{"task.py"}{""}</code>{""}</Prose>

<Payload file="mi_changed_task.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="mi_changed_task.stdout.txt" output={true}/>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"11. Interpret a variational improvement"}</H3>

<Prose>{"Suppose true rate is .6 bits, relevance .4 bits, reference mismatch .2 bits and decoder mismatch .1 bits. Find the variational bounds and objective gap at β=3. Hold the encoder and decoder fixed while moving only the reference toward its true marginal: identify what can change and whether a lower bound-objective proves lower true MI. Rewrite U+βC in prediction-plus-penalty form and handle β=0."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Reference mismatch adds to rate; decoder mismatch subtracts from relevance. The true joint law stays fixed under an auxiliary-only edit. Dividing by β is valid only for positive β."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"The upper rate is .8 and lower relevance .3. True J=.6−3·.4=−.6, while its upper bound is .8−3·.3=−.1; the gap is .5=.2+3·.1. Moving only the reference changes its rate gap and U, but leaves R, T and the unchanged decoder gap fixed. A tighter objective therefore need not indicate any change in true MI. For β>0, dividing U+βC by β gives C+(1/β)U; comparison with J also accounts for the fixed H(Y) term. At β=0 division is invalid and the original objective is rate-only."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"12. Differentiate one VIB row"}</H3>

<Prose>{"Implement the row0 contribution to the six-parameter gradient using the declared batch, then average all four rows. Diagnose using sigma where sigma² belongs in Gaussian KL, a negative KL penalty, and a sum instead of mean. Recompute row0 at lambda0 and at lambda.4; then change its signal input from0 to1 while keeping its label/noise fixed."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Use "}{"g="}<wbr/>{"sigmoid(logit)−y,"}{" "}{"g_"}<wbr/>{"mu="}<wbr/>{"u*g+"}<wbr/>{"lambda*mu,"}{" and the separate noise path through log_sd. Recompute mu,z,logit after changing an input."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"The complete "}<code>{"hand"}</code>{" function in "}{"gaussian_"}<wbr/>{"vib_"}<wbr/>{"step.py"}{" is the executable solution: call it with a single-row list to obtain that row’s contribution, or with all ROWS for the mean. For row0, "}{"mu="}<wbr/>{"−.4,"}<wbr/>{"z="}<wbr/>{"−1.1,"}<wbr/>{"logit="}<wbr/>{"−1.41"}{" and g=sigmoid(−1.41). At lambda0 the mu derivative is1.1g; at lambda.4 it is1.1g−.16, while the log_sd KL contribution changes from0 "}{"to.4(.49−1)="}<wbr/>{"−.204."}{" Signal/nuisance gradients are zero for this original row because both inputs are0. With signal1, recompute "}{"mu="}<wbr/>{".4,"}<wbr/>{"z="}<wbr/>{"−.3,"}<wbr/>{"logit="}<wbr/>{"−.53,"}{" and the a derivative now equals the mu derivative. A negative penalty rewards departure from the reference; replacing variance by standard deviation is a different incorrect formula. Summing instead of averaging multiplies all row contributions by4 and changes the effective step unless other factors are adjusted. A finite objective decrease on these fixed noises is not a change in exact MI."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"13. State the random variables and resolution"}</H3>

<Prose>{"Let X and E be independent standard normals and Z=X+.5E. Compare Z with Z′=10Z, tracing the event Z∈[0,1] into the new units. Then remove the noise and compare exact X with sign(X). Finally use fair independent A,B and Z=A XOR B to compare marginal and conditional information about A."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The same physical event becomes Z′∈[0,10]. Separate invertible unit conversion, exact real observation, quantization and fresh noise. In XOR, knowing B changes what Z reveals."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"Both noisy observations have ½log₂5≈1.160964 bits. Density rescales by 1/10, preserving the event probability, while both finite differential entropies shift by log₂10. Exact X has infinite MI with itself; sign(X) is a fair binary variable up to a zero-probability event and has one bit. Dimension alone does not determine information. In XOR, I(Z;A)=0 but I(Z;A|B)=1: marginal independence does not establish conditional privacy, and an estimated near-zero value is weaker than exact independence."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"14. Keep counting and validation distinct"}</H3>

<Prose>{"Write a paired-row count helper, shuffle Y with an explicit permutation, and verify both marginals. For categorical integer features, choose the estimator flag and convert units; repeat relabelling, duplicate-count and zero-category checks, and explain the independent replacement [[2,4],[3,6]]. Next compare the declared independent eight-category experiment at 20 and 2000 observations, recording the experiment rather than assuming monotonic estimates. Finally design feature selection for a neural sensor model with repeated recordings per participant, identifying leakage and the validation split required for new-participant deployment."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"A permutation uses every donor exactly once; integer storage does not determine whether a variable is categorical. Record the population, seed, table, estimator and sample size. Repeated participant rows are not independent evidence about a new participant, and feature selection uses labels."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{""}<code>{"paired_counts"}</code>{" constructs the count table. A donor permutation preserves row and column sums, but can change the joint and MI. Use "}{"discrete_"}<wbr/>{"features="}<wbr/>{"True"}{" for categorical inputs and divide the nat result by ln2 for bits. Relabelling, duplicating every count and appending an empty category preserve empirical MI; the replacement table factors into its marginals and has zero MI up to roundoff."}</Prose>

<Prose>{"Record both sample sizes, their empirical tables and MI values, seed, population, estimator and any shuffle diagnostics. The known independent population has MI zero at both sizes. Sparse pairings can give positive estimates, and a particular larger sample can fluctuate either way. One positive estimate does not prove population dependence, causality or a calibrated rejection of independence."}</Prose>

<Prose>{"Participant or session identity may correlate with training labels, and global channel selection can leak held-out labels. Split by participant first. Within each fold, fit preprocessing, binning and MI selection on training participants only, then evaluate on held-out participants. Report task performance and uncertainty and inspect changed acquisition conditions. Neither a small representation nor low estimated identity MI replaces this validation."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"15. Coarsen the observed table"}</H3>

<Prose>{"From the offline records construct species/island counts, then merge Dream and Torgersen. Compute discarded information using the same denominator. Merge all islands next; then select2009 and explain why the comparison with all years has a different interpretation. Compute the year-weighted conditional MI."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Grouping merges table columns. Year filtering selects a different set of rows before any grouping."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"For all344 records, full MI .750428171 becomes .616057102 after Biscoe/other grouping, losing .134371069 bits. Merging all islands yields one column and exactly zero MI up to roundoff. Selecting2009 leaves120 rows with full MI .735117842; this is another empirical law, not data processing of the all-year law. Actual year "}{"weights110/344,"}<wbr/>{"114/344,"}<wbr/>{"120/344"}{" give conditional MI .744684498; the uniform-year average .745617934 answers a different weighted question. The complete "}<code>{"count_table"}</code>{" and "}<code>{"information"}</code>{" functions supply the implementation, with labels and provenance retained."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"16. Audit a critic-based claim"}</H3>

<Prose>{"Draw an InfoNCE candidate set with K=4. Identify the positive and three negative sampling laws. Explain what can be concluded from a population loss L4 and from one trained minibatch score. Diagnose replacing marginal negatives with deliberately easy alternatives."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The inequality concerns an expectation under one specified candidate-generation experiment."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"The positive is conditional on the context; the other three are independent marginal draws. With base2 units, the population lower bound is2−L4 and cannot exceed2bits. True MI can exceed2. A minibatch score is a random estimate, and fitting a critic on those same samples introduces selection. Easy negatives change the population experiment, so the old bound interpretation does not follow automatically. Distribution-free high-confidence limitations do not prohibit exact calculations or estimation under additional assumptions."}</Prose>

</details>

<Prose>{"Before moving on, explain one joint-to-conditional calculation, draw a task-preserving grouping, implement a stable finite update, and distinguish a true information value from an auxiliary bound and an empirical estimate. Then change the question from preserving a label to reconstructing the observation itself."}</Prose>

<Drawing id="M52"/>

<Prose>{"In the squared-sensor example, inputs−1 and1 have the same label Y=X² and can be merged without losing label information. A decoder asked to reconstruct the signed input cannot recover both from that one group. The next topic, "}<a href={"/learn/path/full-curriculum/rate-distortion-theory"}>{"Rate-Distortion Theory"}</a>{", fixes a reconstruction cost d(x,xhat) and asks what rate supports an acceptable expected distortion. Here the predictive distortion emerged from conditional label distributions. The new criterion and coding assumptions make a different question; an information penalty alone is not a serialized bitstream."}</Prose></div></section>

<section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning" data-lesson-resource-list=""><H2>{"Further learning"}</H2>

<ul><li>{""}<a href={"https://sites.stat.columbia.edu/liam/teaching/neurostat-spr11/papers/EM/Cover%26Thomas-Ch2.pdf"}>{"Cover and Thomas, chapter2"}</a>{": the finite identities, data-processing proof, sufficiency and Fano error-flag argument. Work through the conditional tables here before reading its compact proofs."}</li><li>{""}<a href={"https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/184197ca5d5418da2415d37e929860b9_MIT6_441S16_chapter_2.pdf"}>{"MIT6.441, Mutual Information"}</a>{": a second treatment organized around channels and probability measures, useful for connecting the finite diagrams to Gaussian and singular examples."}</li><li>{""}<a href={"https://arxiv.org/html/physics/0004057"}>{"The Information Bottleneck Method"}</a>{", section3: the predictive distortion and alternating equations. Read its annealing and solution discussion with the distinction between block minimization and joint global optimization in mind."}</li><li>{""}<a href={"https://arxiv.org/html/1612.00410v7"}>{"Deep Variational Information Bottleneck"}</a>{", section3: the two surrogate bounds and Gaussian training objective. Translate its compression coefficient to this lesson’s reciprocal relevance convention before comparing formulas."}</li><li>{""}<a href={"https://proceedings.mlr.press/v97/poole19a/poole19a.pdf"}>{"On Variational Bounds of Mutual Information"}</a>{", sections2.1–2.3: population variational and multisample bounds, with their sampling assumptions. "}<a href={"https://arxiv.org/html/1807.03748"}>{"CPC"}</a>{" explains the candidate-classification motivation; the rigorous bound treatment above avoids relying on the approximation in its original appendix."}</li></ul></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references" data-lesson-resource-list=""><H2>{"Technical references"}</H2>

<ul><li>{""}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.metrics.mutual_info_score.html"}>{"Scikit-learn mutual_info_score"}</a>{" and "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.feature_selection.mutual_info_classif.html"}>{""}{"mutual_"}<wbr/>{"info_"}<wbr/>{"classif"}{""}</a>{": count inputs, nat outputs, categorical/continuous distinctions and estimator controls. Use the full local bridge to compare the same fixture before choosing an estimator for new data."}</li><li>{""}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.BCEWithLogitsLoss.html"}>{"Torch BCEWithLogitsLoss"}</a>{", "}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.autograd.grad.html"}>{"autograd.grad"}</a>{" and "}<a href={"https://docs.scipy.org/doc/scipy/reference/optimize.minimize-slsqp.html"}>{"SciPy SLSQP"}</a>{": the ordinary operations used by the bounded comparisons, including reduction, gradient and termination contracts."}</li></ul>

<Prose>{"The original small programmes use Python’s standard library. The array and observed-data routes additionally use NumPy2.3.5, SciPy1.18.1 and "}{"scikit-learn1.9.1;"}{" the Gaussian comparison uses Torch2.14.0 on CPU. Save each complete source under its shown filename. Keep "}<code>{""}{"finite_"}<wbr/>{"ib_"}<wbr/>{"reference.py"}{""}</code>{" beside "}<code>{""}{"finite_"}<wbr/>{"ib_"}<wbr/>{"numpy.py"}{""}</code>{", and the attributed "}<code>{"penguins.csv"}</code>{" beside "}<code>{""}{"penguins_"}<wbr/>{"information.py"}{""}</code>{". Each executable file has its own stated example; the helper and exercise files define reusable functions."}</Prose></section><Prose><a href="/learn-assets/mutual-information/penguins.csv" download>Download penguins.csv</a>{' · '}<a href="/learn-assets/mutual-information/DATA-PROVENANCE.md" download>Data source and attribution</a></Prose></div></InformationProvider>;}
