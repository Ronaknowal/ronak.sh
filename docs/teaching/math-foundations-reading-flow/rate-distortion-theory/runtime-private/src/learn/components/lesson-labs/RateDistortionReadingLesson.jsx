import {Prose,H2,H3,CodeBlock} from '../content';
import {Math as InlineMath,MathBlock} from '../content/Math.jsx';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import {NeuralTable} from './NeuralLessonElements.jsx';
import Drawing from './RateDistortionReadingDrawings.jsx';
import {RateDistortionProvider} from './RateDistortionReadingState.jsx';
import './rate-distortion-reading.css';
function Payload({file,output}){return <section data-payload={file}><RemoteCodeBlock source={'/learn-assets/rate-distortion/'+file} filename={file} language={output?'output':'python'}/></section>;}
export default function RateDistortionReadingLesson(){return <RateDistortionProvider><div className="lesson-pilot lesson-flow rate-distortion-reading"><Prose opening="summary">{"A remote sensor has more readings than it can transmit. Discarding readings saves bits, but a useful compressor must preserve the distinctions its receiver needs. We will first send an actual message, then ask how close its error and rate are to a mathematical limit. The last step is to count complete bytes and compare reconstructed measurements with their originals."}</Prose>

<Prose opening="prerequisites">{"The prerequisites are weighted averages, logarithms, probability tables, "}<a href={"/learn/path/full-curriculum/entropy-cross-entropy-kl-divergence?module=math-foundations"}>{"entropy"}</a>{" and "}<a href={"/learn/path/full-curriculum/mutual-information-information-bottleneck?module=math-foundations"}>{"mutual information"}</a>{". We refresh conditional tables and teach the optimization steps here. The Gaussian extension also uses the orthogonal eigenvectors from "}<a href={"/learn/path/full-curriculum/eigenvalues-eigenvectors?module=math-foundations"}>{"Eigenvalues and Eigenvectors"}</a>{". No compression library or prior codec implementation is assumed."}</Prose>

<Prose>{"The reading route follows nine questions: send an index; define the error budget; derive a binary limit; interpret long-block coding; compute a finite reconstruction rule; allocate Gaussian error; choose what must survive; create a bitstream; and practise the decision. Sections marked Deeper remain visible and supply proofs or extensions after the basic mechanism."}</Prose>

<H2>{"1. Send an index and reconstruct a block"}</H2>

<Prose>{"A sensor reports three bits, "}<code>{"011"}</code>{". Suppose the receiver has agreed to reconstruct only "}<code>{"000"}</code>{" or "}<code>{"111"}</code>{". Follow the source positions through the choice and the transmitted message."}</Prose>

<Drawing id="D01"/>

<Prose>{"These two allowed outputs form a "}<strong>{"codebook"}</strong>{". The encoder compares the input with each output: "}<code>{"000"}</code>{" changes two positions, whereas "}<code>{"111"}</code>{" changes one. It sends index "}<code>{"1"}</code>{", meaning the second entry. The decoder looks up that entry and produces three bits, "}<code>{"111"}</code>{". The one-bit index and the three reconstructed bits are different objects, even though both contain the character "}<code>{"1"}</code>{"."}</Prose>

<Prose>{"The receiver cannot recover the first source bit. That distinction was deliberately lost. Which other inputs become indistinguishable at the receiver?"}</Prose>

<Drawing id="D02"/>

<Prose>{"Inputs "}<code>{"000"}</code>{", "}<code>{"001"}</code>{", "}<code>{"010"}</code>{" and "}<code>{"100"}</code>{" choose index 0. Inputs "}<code>{"011"}</code>{", "}<code>{"101"}</code>{", "}<code>{"110"}</code>{" and "}<code>{"111"}</code>{" choose index 1. Each group is a "}<strong>{"preimage"}</strong>{" of the selected reconstruction: several originals share the same transmitted description. The grouping diagram is a list of assignments, not a distance-preserving map of binary strings. Bit 0 stays amber and bit 1 stays blue; outlined destination markers identify codebook entries independently of bit values. A white outline selects a row. Error ticks identify changed positions without recolouring every 1 as an error."}</Prose>

<Prose>{"Now count mistakes using the probability of each source word."}</Prose>

<Drawing id="D03"/>

<Prose>{"For independent fair source bits, all eight words have probability 1/8. Two words have no mistakes and six have one. The expected fraction of wrong source positions is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"D_{\\rm code}=\\frac{2\\cdot0+6\\cdot1}{8\\cdot3}=\\frac14."}</MathBlock></div>

<Prose>{"An individual block has error 0 or 1/3, so the worst block error is 1/3. The average .25 is not a promise about each block. If each bit is 1 with probability p, a word containing k ones instead has probability pᵏ(1−p)³⁻ᵏ. The investigation uses those weights after you edit p. At p=0 or p=1, only one source word has positive probability; impossible words do not determine the worst error under that source."}</Prose>

<Prose>{"Codebook size determines the width of a fixed binary index."}</Prose>

<Drawing id="D04"/>

<Prose>{"With M allowed reconstructions, a fixed binary index needs ⌈log₂M⌉ bits. Two entries need one bit; three entries need two bits, leaving one of the four binary addresses unused. For a block of n source symbols, the transmitted fixed-width rate is ⌈log₂M⌉/n bits per source symbol. Information-theoretic block-code statements often use log₂M/n as their cardinality rate. These coincide for powers of two; the rounding difference is less than one bit per block."}</Prose>

<Prose>{"Our two-entry, three-bit code has rate 1/3 bit per source bit. This count assumes that the codebook and block boundaries are shared. Section 8 adds an explicit file header and shows how it changes the count."}</Prose>

<Prose>{"Now change the allowed codebook and inspect both the assignments and required index width. Emptying the codebook is invalid: a decoder needs an allowed reconstruction. The last valid experiment remains visible with an explanation. Reset restores "}<code>{"000"}</code>{"/"}<code>{"111"}</code>{", fair bits and selected word "}<code>{"011"}</code>{"."}</Prose>

<Prose>{"The following complete programme enumerates the eight inputs. "}<code>{"min"}</code>{" compares mismatch counts and resolves a tie by the first index in the fixed order. "}<code>{"decode"}</code>{" is a lookup: it does not have access to the original word. The printed rows are the entire fair-source experiment, not a random sample."}</Prose>

<Prose>{"File: "}<code>{"rd_blockCode.py"}</code>{""}</Prose>

<Payload file="rd_blockCode.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="rd_blockCode.stdout.txt" output={true}/>

<Prose>{"For a known length-n binary source, enumerating all words and M reconstructions costs O(2ⁿMn) comparisons. This tiny exact calculation is easy to inspect, but its exponential source enumeration cannot be the implementation strategy for large blocks. Python's iteration, strings and integers are sufficient tools here; a numerical library would not remove that growth."}</Prose>

<H2>{"2. Define the budget before the bound"}</H2>

<Prose>{"The same pair of values can count as a small error under one criterion and a serious error under another. First specify what the reconstruction is supposed to preserve."}</Prose>

<Drawing id="D05"/>

<Prose>{"A "}<strong>{"source"}</strong>{" X is the random object being represented; X̂, pronounced “X hat,” is its reconstruction. A "}<strong>{"distortion function"}</strong>{" d(x,x̂) assigns a nonnegative cost to that pair. Binary Hamming distortion gives 0 for a match and 1 for a mismatch. Squared error gives (x−x̂)², so an error of 2 costs four times an error of 1. An alarm criterion can give a missed alarm a much larger cost than a false alarm. Such a cost need not be symmetric or satisfy the triangle inequality. Calling it distortion does not make it a mathematical distance."}</Prose>

<Prose>{"The probability of a pair determines how much its cost contributes to an average."}</Prose>

<Drawing id="D06"/>

<Prose>{"Write pᵢ for source probability, qⱼ|ᵢ for the probability of reconstruction j conditional on source i, and dᵢⱼ for their cost. The pair has probability pᵢqⱼ|ᵢ and contributes pᵢqⱼ|ᵢdᵢⱼ to expected distortion. Summing all cells gives D(q). The cost table is not a probability table: its rows need not sum to one."}</Prose>

<Prose>{"If alarms occur with probability .01 and the decoder always emits 0, ordinary Hamming distortion is .01. Conditional on an alarm, however, it misses with probability 1. Assigning each missed alarm cost 100 changes expected cost to 1 without changing any reconstruction. The original average criterion did not preserve rare alarms; changing a cost explicitly changes the question."}</Prose>

<Prose>{""}<strong>{"Check your interpretation."}</strong>{" Does overall Hamming error below 2% certify that those alarms survive? No. The zero-message rule meets the average budget and misses every alarm. An essential conditional or worst-case guarantee needs its own constraint and evaluation."}</Prose>

<Prose>{"To search for a limit, allow every possible reconstruction distribution for each source value."}</Prose>

<Drawing id="D07"/>

<Prose>{"This row-normalized table q is a "}<strong>{"test channel"}</strong>{". It describes which source distinctions survive; it need not be a physical noisy link. It is also not yet an encoder emitting bytes. For p(X=1)=.2, the symmetric forward-flip rule has rows (.9,.1) and (.1,.9). Multiplying them by source probabilities .8/.2 gives joint rows (.72,.08) and (.02,.18). Column sums are .74/.26 and the off-diagonal distortion is .1. We have constructed one feasible rule, without asserting it is best."}</Prose>

<Prose>{"In general,"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"P_{ij}=p_iq_{j|i},\\qquad r_j=\\sum_i p_iq_{j|i},\\qquad D(q)=\\sum_{i,j}p_iq_{j|i}d_{ij}."}</MathBlock></div>

<Prose>{"The previous lesson expressed "}<strong>{"mutual information"}</strong>{" as the KL divergence between a joint law and the product of its marginals. Cancelling pᵢ inside that ratio gives"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"I(q)=\\sum_{i,j}p_iq_{j|i}\\log_2\\frac{q_{j|i}}{r_j}."}</MathBlock></div>

<Prose>{"A zero-probability pair contributes zero. Whenever pᵢqⱼ|ᵢ is positive, its column marginal rⱼ is positive too, so that cell does not divide by zero. Source rows with pᵢ=0 have no effect on the objective."}</Prose>

<Prose>{"Hold the source and cost fixed, then admit only channels inside the error budget."}</Prose>

<Drawing id="D08"/>

<Prose>{"The "}<strong>{"information rate-distortion function"}</strong>{" is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"R(D)=\\min_{q:\\,D(q)\\le D} I(q)."}</MathBlock></div>

<Prose>{"For finite alphabets it chooses the least retained information among the feasible reconstruction rules. Raising D moves the budget boundary right and admits more channels. A minimum over that larger set cannot rise. R(D) is also nonnegative. Unlike the fixed-marginal problem in "}<a href={"/learn/path/full-curriculum/optimal-transport-wasserstein-distance-sinkhorn?module=math-foundations"}>{"Optimal Transport"}</a>{", the output marginal r is generally chosen here along with the pairing."}</Prose>

<Prose>{"The information minimum becomes an operational coding limit under the assumptions in section 4. First identify the easy endpoints: impossible distortion and reconstruction without a message."}</Prose>

<Drawing id="D09"/>

<Prose>{"Even with complete source knowledge, the least expected cost on the declared reconstruction alphabet is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"D_{\\min}=\\sum_i p_i\\min_j d_{ij}."}</MathBlock></div>

<Prose>{"Below that floor there is no feasible channel. At the other end, no message means that the output law is independent of X: every positive-probability source row uses the same law. An independent mixture of constant outputs has a cost equal to the corresponding mixture of their costs, so it cannot improve on the cheapest constant. Thus"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"D_{\\rm zero}=\\min_j\\sum_i p_i d_{ij}."}</MathBlock></div>

<Prose>{"For D≥D_zero, R(D)=0. Fair binary Hamming error has threshold .5; if ones occur with probability .1, always outputting 0 reaches zero rate at distortion .1. This is a result about expected cost, not a promise to retain every event. These two endpoints also show why the source law, reconstruction alphabet and distortion criterion must be stated together."}</Prose>

<H2>{"3. Derive the binary frontier"}</H2>

<Prose>{"For a binary source with P(X=1)=p, let H_b(p)=−p "}{"log₂p−(1−p)log₂(1−p),"}{" using the limit 0 log 0=0. Let E=X xor X̂ identify a mismatch. Knowing the reconstruction and the error bit recovers the source bit."}</Prose>

<Drawing id="D10"/>

<Prose>{"Given X̂, describing X is equivalent to describing E. If the actual mismatch probability is d, then"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"H(X\\mid\\hat X)=H(E\\mid\\hat X)\\le H(E)=H_b(d)."}</MathBlock></div>

<Prose>{"Consequently "}{"I(X;"}<wbr/>{"X̂)≥H_"}<wbr/>{"b(p)−H_"}<wbr/>{"b(d)."}{" For a budget 0≤D≤min(p,1−p), every feasible d≤D lies in [0,.5], where H_b is increasing. Replacing H_b(d) by H_b(D) gives a bound valid for all feasible channels. A bound alone does not establish the minimum; we need a channel attaining it."}</Prose>

<Prose>{"Construct the variables in the reverse direction: choose a reconstruction first, add independent binary error, and check that the resulting source has the right probability."}</Prose>

<Drawing id="D11"/>

<Prose>{"Draw X̂∼Bernoulli(r), independently draw E∼Bernoulli(D), and set X=X̂ xor E. Now H(E|X̂)=H(E), making the uncertainty bound tight. To get P(X=1)=p, solve"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"p=r(1-D)+(1-r)D,\\qquad r=\\frac{p-D}{1-2D}."}</MathBlock></div>

<Prose>{"For 0≤D<min(p,1−p), the denominator is positive and r lies in [0,1]. At or beyond the zero-rate threshold, use the most-probable constant directly. This avoids the undefined expression at p=D=.5; deterministic p=0 or 1 sources are also handled by their constant. A budget beyond the threshold permits that constant's smaller actual error; the budget need not be spent exactly."}</Prose>

<Prose>{"Turn the backward branches into a joint table before reading forward errors."}</Prose>

<Drawing id="D12"/>

<Prose>{"With p=.2 and D=.1, r=.125. The joint table, with source rows 0/1 and reconstruction columns 0/1, is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"P=\\begin{pmatrix}.7875&.0125\\\\.0875&.1125\\end{pmatrix}."}</MathBlock></div>

<Prose>{"Its row sums are .8/.2; its column sums are .875/.125. The mismatch cells add to .1. To condition forward, divide each cell by its source row sum. The false-positive probability is .0125/.8=.015625, while the false-negative probability is .0875/.2=.4375. They are not equal. Section 2's symmetric forward-flip table had the same source and total distortion but a different retained-information cost. “Independent error” must say independent of which variable. These arrows describe probability constructions, not causes."}</Prose>

<Prose>{"The live table highlights one branch, joint cell and conditional normalization together. Edit p and the budget to compare the fair-source symmetry with a biased source. A zero-mass source row has no defined conditional error under the observed law and is labelled unavailable, rather than displaying 0/0."}</Prose>

<Prose>{"The complete programme below deliberately computes the interior fixture p=.2, D=.1. Its divisions are valid for that fixture. It is not a general endpoint-handling API; the preceding construction and investigation supply those cases."}</Prose>

<Prose>{"File: "}<code>{""}{"rd_"}<wbr/>{"biasedChannel.py"}{""}</code>{""}</Prose>

<Payload file="rd_biasedChannel.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="rd_biasedChannel.stdout.txt" output={true}/>

<Prose>{"The bound and attaining construction determine the complete binary frontier."}</Prose>

<Drawing id="D13"/>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"R(D)=\\begin{cases}H_b(p)-H_b(D),&0\\le D<\\min(p,1-p),\\\\0,&D\\ge\\min(p,1-p).\\end{cases}"}</MathBlock></div>

<Prose>{"For fair bits, D=.1 requires approximately .531 bits per source bit; D=.25 gives approximately .189. Our finite three-bit code sits at (.25,1/3), above the asymptotic frontier. The gap concerns that particular code, not a failure of the bound. Both degenerate sources p=0 and p=1 need zero rate at any nonnegative budget."}</Prose>

<Prose>{"This small original programme evaluates the fair curved branch only at budgets between 0 and .5. Keep that domain when using it: beyond .5, binary entropy decreases again and "}<code>{"max(0, 1-H_b(D))"}</code>{" would incorrectly rise. The feasible constant still exists, so the true rate stays zero. Practice 2 implements the full piecewise rule."}</Prose>

<Prose>{"File: "}<code>{""}{"rd_"}<wbr/>{"originalBinary.py"}{""}</code>{""}</Prose>

<Payload file="rd_originalBinary.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="rd_originalBinary.stdout.txt" output={true}/>

<Prose>{"An engineer can choose a price λ for distortion instead of choosing a hard budget first. λ has units bits per distortion unit; larger λ makes mistakes more expensive. Geometrically, the objective I+λD fixes a line in the distortion–information plane."}</Prose>

<Drawing id="D14"/>

<Prose>{"A line I+λD=c has slope −λ. Slide it down until it supports the convex frontier. For an interior binary point,"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"H_b'(D)=\\log_2\\frac{1-D}{D},\\qquad D_\\lambda=\\min\\left\\{\\min(p,1-p),\\frac1{1+2^\\lambda}\\right\\}."}</MathBlock></div>

<Prose>{"Fair bits at λ=2 give D=.2. The selected budget and the optimizing distortion have separate labelled markers: editing a budget does not make that choice automatically optimal for the current λ. At λ=0, every feasible zero-rate point minimizes the objective; the display chooses the smallest distortion reaching zero rate. Corners can have an interval of supporting slopes, and a straight frontier segment can have several minimizing operating points. A derivative alone does not identify one unique channel in those cases."}</Prose>

<Prose>{"Changing the distortion unit to D_new=100D requires λ_new=λ/100 to preserve the same objective. This rescaling is separate from converting natural logarithms to bits."}</Prose>

<H2>{"4. Explain what long blocks can achieve"}</H2>

<Prose>{"The information minimum describes a limit. To see why its endpoint needs care, consider biased bits with p=.1 and an exact, fixed-width code for ten source bits."}</Prose>

<Drawing id="D15"/>

<Prose>{"All 2¹⁰=1024 strings have positive probability, even though most ones are rare. Exact zero Hamming error requires a distinct reconstruction for each string, so a finite fixed-width description still needs at least ten bits. Yet H_b(.1)<1. There is no contradiction: the limiting boundary R(0)=H_b(.1) can be approached by fixed-rate codes whose permitted error tends to zero as block length grows. It is not the finite exact-zero-error requirement. Variable-length lossless coding instead approaches entropy in expected length by using longer descriptions for rare strings. Rate convention, error criterion and order of limits all matter."}</Prose>

<Prose>{"For a general finite block code, trace every route by which source information can reach the receiver."}</Prose>

<Drawing id="D16"/>

<Prose>{"An encoder maps Xⁿ to an index J among M possibilities; a deterministic decoder maps J to X̂ⁿ. Data processing and index entropy give"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"\\log_2M\\ge H(J)\\ge I(X^n;J)\\ge I(X^n;\\hat X^n)."}</MathBlock></div>

<Prose>{"For independent source symbols, H(Xⁿ)=ΣH(Xᵢ). Conditional entropy satisfies "}{"H(Xⁿ|"}<wbr/>{"X̂ⁿ)≤ΣH(Xᵢ|"}<wbr/>{"X̂ᵢ),"}{" because each term can discard some conditioning information to increase entropy. Subtracting yields"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"I(X^n;\\hat X^n)\\ge\\sum_i I(X_i;\\hat X_i)\\ge\\sum_iR(D_i)."}</MathBlock></div>

<Prose>{"Here Dᵢ is the expected distortion at coordinate i. Its actual joint distribution is one feasible candidate in the corresponding minimum. To combine the coordinates' different budgets, we also need convexity."}</Prose>

<Prose>{"Mixing channels and time-sharing block codes are related operations with different equalities."}</Prose>

<Drawing id="D17"/>

<Prose>{"With a fixed source, mutual information is convex in the conditional table. One proof writes it as KL(P_Xq || P_Xr_q); joint convexity of KL applies because both the joint and product-reference arrays mix linearly when q mixes. A rowwise mixture q=αq₁+(1−α)q₂ therefore has exactly the weighted average distortion and at most the weighted average information. Minimizing gives convexity of R(D)."}</Prose>

<Prose>{"Operationally, a known schedule can use code 1 on one fraction of blocks and code 2 on the rest. Their total message lengths and total distortions add; their rates and errors approach the corresponding weighted averages. This is "}<strong>{"time-sharing"}</strong>{". It does not say the mutual information of a randomly mixed single-letter channel equals the average of the two channel informations."}</Prose>

<Prose>{"Jensen's inequality for convex R now gives ΣR(Dᵢ)≥nR(D̄), where D̄=ΣDᵢ/n. If D̄≤D, monotonicity gives R(D̄)≥R(D). Combining the steps proves"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"\\frac{\\log_2 M}{n}\\ge R(D)."}</MathBlock></div>

<Prose>{"This is the "}<strong>{"converse"}</strong>{": under the stated iid, additive-cost and block-code assumptions, no code beats the bound. A fixed binary index's ceiling width is at least log₂M. Expected-length coding needs its corresponding entropy argument rather than silently using the same physical-length convention."}</Prose>

<H3>{"Deeper: why a sufficiently large codebook can approach the limit"}</H3>

<Prose>{"A converse rules out impossible compression. "}<strong>{"Achievability"}</strong>{" must also show that codes can approach the remaining boundary. Draw many candidate reconstruction blocks from the marginal law of a good test channel, then let the encoder find one compatible with the source block."}</Prose>

<Drawing id="D18"/>

<Prose>{"For finite iid alphabets, a typical source block and an independently generated reconstruction are jointly typical with a probability whose exponential scale is 2⁻ⁿᴵ. Joint typicality means their empirical pair frequencies are close to the chosen joint law; it controls average distortion as well as frequency. The drawn covering regions are conceptual sets, not Euclidean balls with measured volumes."}</Prose>

<Prose>{"If one candidate succeeds with probability aₙ, M independent candidates all fail with probability"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"(1-a_n)^M\\le \\exp(-Ma_n)."}</MathBlock></div>

<Prose>{"Take M about 2ⁿᴿ with R>I and allow small typicality slack. Then Maₙ grows, and the failure probability tends to zero. The encoder sends the index of a compatible candidate. This probability argument shows that some fixed codebooks work, because their average performance is good. It does not provide a computationally cheap search through an exponentially large book."}</Prose>

<Prose>{"Rare source blocks and failed searches still contribute to expected error."}</Prose>

<Drawing id="D19"/>

<Prose>{"For finite alphabets with bounded distortion d_max, exceptional probability ε contributes at most εd_max. On typical covered blocks, empirical pair frequencies make the mean cost close to the chosen test-channel cost. In "}<strong>{"strong typicality"}</strong>{", zero-probability joint cells must remain empty; allowing arbitrary rare counts in those cells would contradict the specified support. These two controls complete the intuition behind the finite-alphabet achievability proof."}</Prose>

<Prose>{"Unbounded distortion needs additional integrability or tail control. Tiny failure probability alone cannot bound the expectation if failures can have arbitrarily large cost. Standard memoryless source-coding statements assume an appropriate finite expected cost for some reconstruction and treat attainable interior budgets before taking limits. With those qualifications, the operational asymptotic rate equals the information minimum: sufficiently long blocks approach the frontier with arbitrarily small slack. Neither the theorem nor the drawings promise that every finite block attains the exact limiting pair."}</Prose>

<H2>{"5. Compute a finite reconstruction rule"}</H2>

<Prose>{"The binary answer had a closed form. Most source and distortion choices do not. Start instead with a finite list of source values, a finite reconstruction list, their pair costs and a nonnegative distortion price λ."}</Prose>

<Drawing id="D20"/>

<Prose>{"The source vector p and cost array d are fixed. We choose each probability row of q; its induced output vector is r_q=pq. The objective is "}{"J(q)="}<wbr/>{"I_"}<wbr/>{"bits(q)+"}<wbr/>{"λD(q)."}{" With the source, costs and alphabets fixed, this is convex in the full conditional table q. A neural parameterization need not preserve that convex optimization structure. The general "}{"information-bottleneck"}{" problem also differs: its predictive distortion depends on other changing distributions, rather than this one fixed cost matrix."}</Prose>

<Prose>{"A useful iteration begins from an output guess r. A reconstruction should receive more probability when it is already common and when its distortion for the current source value is low. Trace those two factors before normalizing."}</Prose>

<Drawing id="D21"/>

<Prose>{"For fair bits, Hamming costs and λ=2, start with r=(.5,.5). On source row 0, the unnormalized weights are "}{"(.5×"}<wbr/>{"2⁰,"}<wbr/>{".5×"}<wbr/>{"2⁻²)="}<wbr/>{"(.5,"}<wbr/>{".125)."}{" Their sum is .625, giving row (.8,.2). Source row 1 gives (.2,.8). In general,"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"q_{j|i}^{t+1}=\\frac{r_j^t2^{-\\lambda d_{ij}}}{\\sum_k r_k^t2^{-\\lambda d_{ik}}}."}</MathBlock></div>

<Prose>{"Each row is a distribution over reconstructions, not a distribution over source values. The source weights enter the second operation: rebuild the output marginal from all rows."}</Prose>

<Drawing id="D22"/>

<Prose>{"Multiply row i by pᵢ and sum each column. For the fair example, r¹=(.5,.5) again. Label the timing explicitly: old rᵗ generated qᵗ⁺¹, while new rᵗ⁺¹ is the marginal induced by that q. The current mutual information must use the new induced marginal. Using the old guess in its denominator adds an extra KL term and changes the reported objective."}</Prose>

<Prose>{"Repeating row normalization and marginal rebuilding is the rate-distortion form of the "}<strong>{"Blahut–Arimoto algorithm"}</strong>{". The investigation lets you inspect successive cached states, go back, and change the declared initialization or problem. Its starting panel distinguishes the initial marginal from the first resulting channel; an iteration number is not a convergence proof."}</Prose>

<H3>{"Deeper: derive the updates and the objective decrease"}</H3>

<Prose>{"An auxiliary distribution r separates the coupled channel problem into operations that each have an exact minimizer."}</Prose>

<Drawing id="D23"/>

<Prose>{"Use natural logarithms inside the calculation, with s=λ ln 2. Define"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"\\mathcal J(q,r)=\\sum_{i,j}p_iq_{j|i}\\left(\\ln\\frac{q_{j|i}}{r_j}+s d_{ij}\\right)."}</MathBlock></div>

<Prose>{"Insert and subtract ln r_q,j inside the ratio. Summing over source rows gives"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"\\mathcal J(q,r)=I_{\\rm nats}(q)+sD(q)+D_{\\rm KL}(r_q\\Vert r)."}</MathBlock></div>

<Prose>{"For fixed q, the best r is its induced marginal, making the last term zero. For fixed positive r, minimize one row with a multiplier enforcing Σⱼqⱼ|ᵢ=1. Differentiating gives "}{"ln(qⱼ|"}<wbr/>{"ᵢ/rⱼ)+"}<wbr/>{"1+"}<wbr/>{"sdᵢⱼ+"}<wbr/>{"constant="}<wbr/>{"0."}{" Exponentiating and normalizing yields "}{"qⱼ|"}<wbr/>{"ᵢ="}<wbr/>{"rⱼexp(−sdᵢⱼ)/Zᵢ,"}{" with "}{"Zᵢ="}<wbr/>{"Σⱼrⱼexp(−sdᵢⱼ)."}{" This is the earlier base-2 formula. Each operation minimizes the same auxiliary objective over one argument, explaining descent. At zero source weight a row is irrelevant; the examples use strictly positive source probabilities."}</Prose>

<Prose>{"An exact zero in the output guess removes an entire reconstruction from every row."}</Prose>

<Drawing id="D24"/>

<Prose>{"If rⱼ=0, the numerator stays zero and marginal rebuilding cannot revive that column. For fair bits and λ=2, a start r=(1,0) gives a constant output: D=.5, I=0 and J=1. The positive start gives D=.2, I≈.278072 and J≈.678072. The zero-supported state is perfectly still and still worse. Use a positive start when all reconstructions are meant to participate. An explicit restart can change support; silently inserting an epsilon changes the experiment."}</Prose>

<Prose>{"Finite positive weights can also become numerically tiny. Compute normalization through logarithms so that small scale does not turn all weights into zero."}</Prose>

<Drawing id="D25"/>

<Prose>{"The row logits are ℓⱼ=ln rⱼ−sdᵢⱼ. If m=maxⱼℓⱼ, then log Σexp ℓ = m+log Σexp(ℓ−m). Subtracting m keeps at least one exponent equal to 1 while preserving ratios. Subtract the log normalizer to get log q, and rebuild marginals using another log-sum-exp. Keep exact absent columns at −∞. A stored log probability and an underflowed display probability can represent different numerical information; calculations should not unnecessarily turn the latter back into a log."}</Prose>

<Prose>{"To assess optimality on the whole declared alphabet, examine every reconstruction column, including absent ones."}</Prose>

<Drawing id="D26"/>

<Prose>{"Substituting the minimizing q rows into the auxiliary objective gives f(r)=−Σᵢpᵢln Zᵢ. Its derivative with respect to rⱼ is −gⱼ, where"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"g_j=\\sum_i\\frac{p_i e^{-s d_{ij}}}{Z_i}."}</MathBlock></div>

<Prose>{"Since Σⱼrⱼgⱼ=1, simplex optimality implies gⱼ=1 on active columns and gⱼ≤1 on inactive columns. An absent column with gⱼ>1 offers a direction that can reduce f. Omitting that column from the diagnostic would hide the initialization trap. These conditions refer to this finite convex problem, not to an arbitrary neural model."}</Prose>

<Prose>{"The same scores produce a bound on how far the current objective can lie above the best possible objective."}</Prose>

<Drawing id="D27"/>

<Prose>{"For any other output law u, Jensen's inequality for the convex function −ln gives"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"\\begin{aligned}\nf(u)-f(r)&=-\\sum_i p_i\\ln\\frac{Z_i(u)}{Z_i(r)}\\\\\n&\\ge-\\ln\\left(\\sum_j u_jg_j\\right)\\\\\n&\\ge-\\ln\\max_jg_j.\n\\end{aligned}"}</MathBlock></div>

<Prose>{"The first average uses source probabilities pᵢ. The sum inside the logarithm becomes Σⱼuⱼgⱼ by swapping the finite sums. Since u is a probability law, that sum cannot exceed max g. Therefore the global optimum J* in bits lies between"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"\\frac{f(r)-\\ln\\max_jg_j}{\\ln2}\\ \\le\\ J^*\\ \\le\\ I_{\\rm bits}(q)+\\lambda D(q)."}</MathBlock></div>

<Prose>{"The upper endpoint comes from a feasible achieved channel; the lower endpoint covers every output law, even ones using columns absent in r. A negative lower endpoint is allowed and merely loose. The gap brackets the combined objective, not separate uncertainties in I and D. The implementation evaluates this algebra in floating point, so its numerical certificate is not a rigorous interval-arithmetic proof. Positive-support BA converges in the ordinary finite-cost setup, but a finite iteration cap still needs a recorded achieved gap."}</Prose>

<Prose>{"The complete scratch implementation keeps log marginals and calculates the all-column bound. Each iteration costs O(AB) for A source values and B reconstructions; working arrays use O(AB) space. Saving T full states adds O(TAB), so the live investigation uses a bounded history. Its two printed experiments expose the positive-start solution and missing-column failure directly."}</Prose>

<Prose>{"File: "}<code>{""}{"rd_"}<wbr/>{"finiteOptimizer.py"}{""}</code>{""}</Prose>

<Payload file="rd_finiteOptimizer.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="rd_finiteOptimizer.stdout.txt" output={true}/>

<Prose>{"Now express the same operations as array reductions. The axis is part of the mathematics."}</Prose>

<Drawing id="D28"/>

<Prose>{"In the library programme, p has shape (A,), costs and q have shape (A,B), and r has shape (B,). "}<code>{"p[:, None] * q"}</code>{" forms the joint table; summing axis 0 produces the output marginal. "}<code>{"logsumexp(..., axis=1)"}</code>{" normalizes each source row over reconstructions. The independent constrained-solver objective uses H(r)−ΣᵢpᵢH(qᵢ), with "}<code>{"xlogy"}</code>{" preserving the limit 0 log 0=0."}</Prose>

<Prose>{"The new fixture has source values and reconstruction values 0,1,3, source probabilities (.7,.2,.1), squared cost, λ=1 and a uniform initial marginal. The scalar reference and array route use the same inputs and update timing. A separate SLSQP call minimizes the same convex objective over nine channel entries with three row-sum constraints. Its success flag is checked together with row feasibility and the objective bracket. We compare objective values, not a claim that every minimizing table must be identical."}</Prose>

<Prose>{"Save "}<code>{""}{"finite_"}<wbr/>{"rd_"}<wbr/>{"library.py"}{""}</code>{" beside the supplied "}<code>{""}{"rd_"}<wbr/>{"scalar_"}<wbr/>{"helpers.py"}{""}</code>{". That helper contains exactly the three function definitions taught in the scratch programmes, plus "}<code>{"import math"}</code>{"; it has no demonstration loop. Install NumPy and SciPy in your chosen environment, then run "}<code>{"python "}{"finite_"}<wbr/>{"rd_"}<wbr/>{"library.py"}{""}</code>{". The recorded execution used Python 3.12.14, NumPy 2.3.5 and SciPy 1.18.1."}</Prose>

<Prose>{"The complete imported helper is shown first. It defines the same scalar operations without running their original demonstration loops."}</Prose>

<Prose>{"File: "}<code>{""}{"rd_"}<wbr/>{"scalar_"}<wbr/>{"helpers.py"}{""}</code>{""}</Prose>

<Payload file="rd_scalar_helpers.py" output={false}/>

<Prose>{"File: "}<code>{""}{"finite_"}<wbr/>{"rd_"}<wbr/>{"library.py"}{""}</code>{""}</Prose>

<Payload file="finite_rd_library.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="finite_rd_library.stdout.txt" output={true}/>

<Prose>{"The first source row is approximately "}{"(.665799740,"}<wbr/>{".332899870,"}<wbr/>{".001300390)."}{" The source-weighted new marginal is "}{"(.530243304,"}<wbr/>{".366901469,"}<wbr/>{".102855227),"}{" not the unweighted average of the three rows. After 168 marginal updates, the achieved D is .225056645858 and I is .437214546306 bits. The objective bracket is "}{"[.662271192075,"}<wbr/>{".662271192164],"}{" with computed gap about 8.9×10⁻¹¹. SLSQP reports success after 53 iterations, row residual 0 at the displayed precision, and objective .662271192078 inside that bracket. These are results for the stated fixture, rather than universal agreement between solvers."}</Prose>

<Prose>{"Varying λ explores supported frontier points. Enlarging the reconstruction alphabet can improve the optimum, but a chosen finite grid does not establish optimality over all possible continuous reconstructions. The quality of the cost function remains an application question after numerical convergence."}</Prose>

<H2>{"6. Allocate error for Gaussian data"}</H2>

<Prose>{"Now change the source: X is a Gaussian numerical measurement with mean μ and variance v. Variance is an average squared deviation; the visible width of a normal density scales with its standard deviation √v. Begin with v=9, squared-error budget D=2.25 and mean 0."}</Prose>

<Drawing id="D29"/>

<Prose>{"The backward construction has independent X̂∼N(0,6.75) and E∼N(0,2.25), then X=X̂+E. Their variances add to 9; their horizontal density widths do not add. The plotted source, reproduction and error have standard deviations 3, √6.75 and 1.5 respectively, and each density has total area one. This is a new numerical source, not the preceding three-level example."}</Prose>

<Prose>{"Why does this construction give the best information rate? First bound the uncertainty that remains after reconstruction."}</Prose>

<Drawing id="D30"/>

<Prose>{"Let E=X−X̂. Given X̂, translating X by that known amount preserves conditional differential entropy, so "}{"h(X|"}<wbr/>{"X̂)="}<wbr/>{"h(E|"}<wbr/>{"X̂)≤h(E)."}{" Among densities with fixed mean and positive variance, the Gaussian maximizes entropy. To check that step, compare an error density with the Gaussian sharing its mean and variance. The Gaussian's negative log density is a constant plus a squared deviation, so its cross-entropy depends only on those moments and equals the Gaussian's entropy. Nonnegative KL then bounds the error density's entropy by that value. Finally Var(E)≤E[E²]≤D."}</Prose>

<Prose>{"For 0<D<v, these facts give"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"I(X;\\hat X)\\ge h(X)-h(E)\\ge\\frac12\\log_2\\frac{v}{D}."}</MathBlock></div>

<Prose>{"The entropy derivation applies when its densities and quantities are well-defined; the KL information formulation supplies the corresponding limit interpretation. The backward construction makes both inequalities tight: independent Gaussian error has variance D, and independent reproduction variance v−D gives the required source law. Thus"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"R(D)=\\begin{cases}\\frac12\\log_2(v/D),&0<D<v,\\\\0,&D\\ge v.\\end{cases}"}</MathBlock></div>

<Prose>{"The ratio uses matching squared units. If v>0, D=0 has infinite ideal information rate for the non-atomic Gaussian source. A computer file already holding finite-precision measurements is a discrete representation and does not have infinite file size. If v=0, the source is constant and its rate is zero even at zero error."}</Prose>

<Prose>{"A decoder acts forward from source information, so convert the attaining backward joint law into a forward conditional law."}</Prose>

<Drawing id="D31"/>

<Prose>{"The covariance of X̂ and X is v−D. Gaussian conditioning therefore gives"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"\\mathbb E[\\hat X\\mid X=x]=\\mu+\\left(1-\\frac Dv\\right)(x-\\mu),\\qquad\n\\operatorname{Var}(\\hat X\\mid X)=D\\left(1-\\frac Dv\\right)."}</MathBlock></div>

<Prose>{"At v=9,D=2.25, the rate is 1 bit per measurement and the conditional-mean slope is .75. Selecting x=3 gives mean 2.25 and conditional variance 1.6875; its standard deviation is √1.6875. The complete live investigation appears here, after these quantities have been taught. Edit v, D or x to connect the selected source value with its reconstruction distribution. The earlier three-density picture remains the fixed worked example."}</Prose>

<Prose>{"At D=0 the forward reconstruction equals the source; at D=v it is the constant μ. Variance-zero cases use their constant branch. For budgets beyond v the optimal zero-rate channel uses actual error v rather than manufacturing extra noise to spend the entire budget. Adding arbitrary independent noise to X is not this attaining channel: independent error was defined backward with respect to X̂."}</Prose>

<Prose>{"A simple scalar compressor need not attain the Gaussian limit. Try sending only the sign of a centred measurement."}</Prose>

<Drawing id="D32"/>

<Prose>{"For X∼N(0,v), the best two reconstruction levels for sign groups are their conditional means ±√v√(2/π). The positive conditional mean follows by integrating x times the positive half of the Gaussian density and dividing by probability 1/2. With those levels the remaining MSE is v(1−2/π). At v=9 it is approximately 3.2704, whereas the one-bit Gaussian limit is D=v/4=2.25. The former is an actual scalar rule; the latter is a long-block information limit."}</Prose>

<Prose>{"For a finite sample, a related scalar quantizer alternates assignments and means."}</Prose>

<Drawing id="D33"/>

<Prose>{"For points 0,1,4,5 and centres 0,4, the initial midpoint is 2. Nearest-centre groups are {0,1} and {4,5}; their means are .5 and 4.5. Updating those representatives moves the boundary to 2.5. This is the one-dimensional Lloyd operation already implemented in "}<a href={"/learn/path/full-curriculum/k-means-hierarchical-clustering?module=classical-ml"}>{"K-Means and Hierarchical Clustering"}</a>{", including its complete "}<code>{""}{"clustering_"}<wbr/>{"lloyd.py"}{""}</code>{" and palette/index example "}<code>{""}{"clustering_"}<wbr/>{"quantization.py"}{""}</code>{". The method decreases its sample squared-error objective but can stop at a local optimum. Its centroids and payload indices do not establish the Shannon frontier."}</Prose>

<H3>{"Spend a total error budget across components"}</H3>

<Prose>{"Suppose one source sample is a vector of independent Gaussian components with variances 9 and 1. We can spend total squared error 3 across both. Visualize the variance of each component as its maximum useful error allowance."}</Prose>

<Drawing id="D34"/>

<Prose>{"Once a component's allowed error reaches its variance, reconstructing its mean already uses zero rate. Further error buys no reduction. An unconstrained equal split 1.5/1.5 would waste .5 on the second component. Instead use D₁=2,D₂=1, leaving rate .5 log₂(9/2)≈1.084963 bits per vector."}</Prose>

<Prose>{"The hatch represents allocated error, the outlined cap is the component variance, and the unfilled remainder is retained variance. These labels matter: “water” here represents tolerated error, not allocated signal power. A common level capped at each variance gives "}<strong>{"reverse water-filling"}</strong>{","}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"D_i=\\min(v_i,\\theta),\\qquad \\sum_iD_i=D_{\\rm total}."}</MathBlock></div>

<Prose>{"If D_total is at least Σvᵢ, every component is capped and the rate is zero; extra budget remains unused. Total distortion here is the sum over a vector, not its average per coordinate. Total rate is in bits per vector."}</Prose>

<Prose>{"The common level follows from equal marginal rate savings among uncapped components."}</Prose>

<Drawing id="D35"/>

<Prose>{"Minimize Σᵢ(.5 log₂(vᵢ/Dᵢ)) over positive-rate components, subject to the sum constraint. The derivative is −1/(2 ln 2 Dᵢ). A multiplier for total error therefore makes all uncapped Dᵢ equal. Low-variance components hit their caps first. Zero-variance components are already known and require no bits. At zero total error, any positive-variance continuous component has infinite rate."}</Prose>

<Prose>{"The scratch programme sorts variance caps and solves for the active common level algebraically. Computing log₂v−log₂D avoids an unnecessary overflow in v/D. It also checks that a tiny positive budget is represented accurately; silently returning all-zero errors would change a finite rate into infinity. For variances 9/1, the recorded budgets .5,2,3,10 give allocations "}{".25/.25,"}<wbr/>{"1/1,"}<wbr/>{"2/1,"}<wbr/>{"9/1"}{" respectively."}</Prose>

<Prose>{"File: "}<code>{""}{"rd_"}<wbr/>{"gaussianAllocation.py"}{""}</code>{""}</Prose>

<Payload file="rd_gaussianAllocation.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="rd_gaussianAllocation.stdout.txt" output={true}/>

<H3>{"Deeper: rotate correlated Gaussian coordinates"}</H3>

<Prose>{"Independence was useful for adding component rates. A jointly Gaussian vector can have correlated original coordinates; an orthogonal covariance eigenbasis gives independent transformed Gaussian coordinates."}</Prose>

<Drawing id="D36"/>

<Prose>{"For covariance Σ=[[5,4],[4,5]], the directions (1,1)/√2 and (1,−1)/√2 have variances 9 and 1. Write Σ=Q diag(v)Qᵀ and transform a centred sample to Qᵀx. Orthogonal Q preserves summed squared error, so the total budget is unchanged. Apply scalar allocation in those coordinates, then rotate the reconstruction back. A sign reversal of an eigenvector changes coordinate orientation but not the covariance or rate."}</Prose>

<Prose>{"Track the error covariance through the same rotation."}</Prose>

<Drawing id="D37"/>

<Prose>{"In the high-variance/low-variance ordering, error variances 2/1 give"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"\\Sigma_E=Q\\operatorname{diag}(2,1)Q^T=\\begin{pmatrix}1.5&.5\\\\.5&1.5\\end{pmatrix},\\qquad\\operatorname{tr}(\\Sigma_E)=3."}</MathBlock></div>

<Prose>{""}<code>{"numpy.linalg.eigh"}</code>{" returns eigenvalues in ascending order and matching eigenvectors as columns. Its arrays therefore pair values 1/9 with errors 1/2. Keeping those pairs together produces the same matrix. The programme checks orthogonality, the eigenpair equation, back-rotated covariance and trace instead of depending on arbitrary eigenvector signs."}</Prose>

<Prose>{"For ordinary scales, "}<code>{"brentq"}</code>{" solves "}{"Σmin(vᵢ,"}<wbr/>{"θ)−D_"}<wbr/>{"total="}<wbr/>{"0"}{" on a bracket where the signs differ. The library helper first rescales by the largest variance and declares absolute and relative tolerances. Very small relative budgets use the scratch active-set algebra: an ordinary absolute root tolerance can be larger than the whole budget. Both routes are compared on explicitly declared inputs, including a zero component and a tiny positive budget."}</Prose>

<Prose>{"Run this complete programme beside "}<code>{""}{"rd_"}<wbr/>{"scalar_"}<wbr/>{"helpers.py"}{""}</code>{", using the same Python/NumPy/SciPy environment as above."}</Prose>

<Prose>{"File: "}<code>{""}{"gaussian_"}<wbr/>{"rd_"}<wbr/>{"library.py"}{""}</code>{""}</Prose>

<Payload file="gaussian_rd_library.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="gaussian_rd_library.stdout.txt" output={true}/>

<Prose>{"The covariance example has error trace 3 and total rate 1.084962501 bits per vector. The changed variances 4/1 at total budget 1.5 allocate .75/.75 and need 1.415037499 bits per vector. A budget 10⁻³⁰⁰ remains positive and produces the finite rate shown in the output. These computations describe Gaussian model assumptions. For non-Gaussian data, uncorrelated coordinates need not be independent; covariance alone does not determine its exact rate-distortion function. A weighted, non-Euclidean distortion also need not survive this rotation unchanged."}</Prose>

<H2>{"7. Choose what must survive"}</H2>

<Prose>{"An accurate optimizer cannot repair an inappropriate distortion criterion. To understand why MSE can average away a detail, suppose a message Z leaves the receiver uncertain between source values −1 and +1."}</Prose>

<Drawing id="D38"/>

<Prose>{"Given Z, let m=E[X|Z]. Expand X−a=(X−m)+(m−a). The cross-term has conditional expectation zero because E[X−m|Z]=0. Therefore"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"\\mathbb E[(X-a)^2\\mid Z]=\\operatorname{Var}(X\\mid Z)+(m-a)^2."}</MathBlock></div>

<Prose>{"Only the second term depends on the decoder's choice, so the conditional mean minimizes MSE. For equally likely −1/+1, it returns 0 with MSE 1, although 0 was never an original value. The same argument applies coordinate by coordinate to summed vector squared error; averaging possible images can remove texture."}</Prose>

<Prose>{"A decoder can instead produce plausible-looking values with the correct marginal distribution, while pairing them badly with the actual inputs."}</Prose>

<Drawing id="D39"/>

<Prose>{"An independent fair-sign reconstruction has four input/output pairs, each with probability 1/4. Two matching pairs cost 0 and two mismatches cost 4, giving MSE 2. Its output histogram exactly matches the source, but its paired error is worse than constant 0. Both schemes have I(X;X̂)=0 because neither uses a source-dependent message. Copying the source gives zero distortion and one bit of information; that is a different communication rule."}</Prose>

<Prose>{"The live investigation highlights the joint pair and its marginal contribution together. Changing the prevalence of independently generated output signs does not lower this fair source's MSE below 2. Matching histograms alone cannot tell whether a particular reconstruction preserves its own source."}</Prose>

<Prose>{"The next exact calculation enumerates these possibilities rather than estimating them by Monte Carlo. Its independent output law is multiplied by each source probability to form pair weights. Knowing an input-dependent sign would require additional information."}</Prose>

<Prose>{"File: "}<code>{"rd_fidelity.py"}</code>{""}</Prose>

<Payload file="rd_fidelity.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="rd_fidelity.stdout.txt" output={true}/>

<Prose>{"The rate-distortion-perception literature adds a distribution discrepancy as another criterion. That sharpens one aspect of realism, but distribution equality is not a universal model of human judgment. Operational guarantees depend on the precise formulation and available randomness; the elementary independent-sign example does not establish a general coding theorem for arbitrary perception constraints."}</Prose>

<Prose>{"Now hold event frequencies fixed and change the consequence assigned to a rare error."}</Prose>

<Drawing id="D40"/>

<Prose>{"Use source values 0,1,3 with probabilities .7,.2,.1. The default cost is squared error. Multiplying the entire high-source row by 10 changes its miss consequences while leaving the source law fixed. Inspect both the conditional cost on that row and its probability-weighted contribution to the overall mean: they answer different questions."}</Prose>

<Prose>{"The investigation starts at λ=.1, uniform output initialization and a fixed budget of 500 BA updates. It reports that count and its actual objective gap. Editing the high-row multiplier or λ recomputes from the same initialization and budget; a small-looking change is not labelled convergence. The all-zero-cost case is explicitly a different null experiment. Reset restores the ordinary squared cost, λ=.1 and selected high row."}</Prose>

<Prose>{"The chosen weight is an illustration, not a measured recommendation for a sensor. If a rare-event guarantee is essential, impose the actual conditional or worst-case constraint and evaluate it separately. A weighted mean can encourage preservation without proving the guarantee."}</Prose>

<Prose>{""}<strong>{"Check your evaluation."}</strong>{" Overall error falls after deployment, but every rare high-category reading is missed. What separates within-category improvement from a changed input mix? Report category frequencies and conditional error for each category with the same definitions and held-out protocol. Reweight those conditional errors to one fixed reference mixture, and evaluate the application's actual miss constraint. The aggregate alone cannot identify either change."}</Prose>

<H2>{"8. Turn a representation into a bitstream"}</H2>

<Prose>{"So far a codebook index had a declared ideal width. A file also needs enough information for the receiver to parse and reconstruct it. Return to the original "}<code>{"000"}</code>{"/"}<code>{"111"}</code>{" codebook and send all eight three-bit inputs in order."}</Prose>

<Drawing id="D41"/>

<Prose>{"The 24 source bits become eight one-bit indices: "}<code>{"00010111"}</code>{", hexadecimal "}<code>{"17"}</code>{". Our protocol stores the original source-bit count in a four-byte unsigned big-endian header: "}<code>{"00 00 00 18"}</code>{", since hexadecimal 18 means decimal 24. The complete message is "}<code>{"00 00 00 18 17"}</code>{", five bytes. Raw packed source bits would occupy three bytes. The payload rate is 8/24=1/3 bit per source bit, while the complete-message rate is 40/24=5/3. This tiny file grows once its declared header is counted."}</Prose>

<Prose>{"Follow the receiver's parsing steps, including an incomplete last source block."}</Prose>

<Drawing id="D42"/>

<Prose>{"Read the count n, infer ⌈n/3⌉ code indices, check the corresponding payload byte count, then expand each index to its three-bit codeword. Remove reconstruction positions beyond n. The encoder zero-pads a partial source block before choosing its nearest codeword and zero-pads the final payload byte. Those are two different padding operations. The decoder checks unused payload bits and rejects malformed lengths. Empty input has a valid four-byte header but no meaningful per-source-symbol rate."}</Prose>

<Prose>{"Python's "}<code>{"struct"}</code>{", integers and bytes provide the actual file operations. Save and run this complete programme; the decoder needs only the message and the fixed shared codebook, not the original input. Encoding and decoding are O(n) for the fixed block size and codebook."}</Prose>

<Prose>{"File: "}<code>{"rd_bitstream.py"}</code>{""}</Prose>

<Payload file="rd_bitstream.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="rd_bitstream.stdout.txt" output={true}/>

<Prose>{"This format has no corruption checksum or high-performance entropy coder. A long stream amortizes its fixed header; changing a codebook would need prior agreement or additional transmitted description. The point is to specify those costs rather than infer a file size from a tensor shape."}</Prose>

<H3>{"Compress an observed measurement sequence"}</H3>

<Prose>{"The Palmer penguins dataset contains measured bill lengths in millimetres. We will store the retained numeric sequence, then compare each decoded value with its recorded value. This is a storage experiment, separate from the study's ecological questions. Missing bill lengths are omitted; species, original row numbers and omitted-row positions are not transmitted."}</Prose>

<Prose>{"First isolate the only lossy step: choosing a reconstruction grid."}</Prose>

<Drawing id="D43"/>

<Prose>{"Parse each decimal measurement into an exact integer u in units of 0.1 mm. For a positive integer step s in those same units, choose index k=⌊(2u+s)/(2s)⌋ and reconstruct ks. For nonnegative values this rounds to the nearest grid point, with exact halfway cases going upward. For example u=5 at step 10 becomes index 1 and reconstruction 10, meaning .5 mm becomes 1.0 mm. Integer arithmetic makes that tie rule explicit; a binary floating-point "}<code>{"round"}</code>{" with a different convention is not interchangeable."}</Prose>

<Prose>{"Losslessly compress the indices after quantization. The format's 11-byte header stores four magic bytes "}<code>{"PQL1"}</code>{", version 1, a four-byte retained count and a two-byte step. Version 1 fixes the unit at 0.1 mm, big-endian unsigned 16-bit indices and a zlib stream. The decoder reads the header, decompresses exactly twice the count in bytes, unpacks the indices and multiplies by the stored step. It has no need for the original CSV or a fitted model. zlib's own header/trailer is included inside the counted payload."}</Prose>

<Prose>{"Compare only measured errors and complete message lengths from that declared implementation."}</Prose>

<Drawing id="D44"/>

<Prose>{"There are 344 CSV records; bill length is missing at original data rows 4 and 272, leaving 342 measurements. Each observation has equal weight in this empirical storage calculation. The raw unsigned-16-bit baseline for that sequence is 684 bytes before any extra metadata. Using zlib level 6, "}<code>{"wbits=15"}</code>{", and zlib build/runtime 1.3.2, the recorded results are:"}</Prose>

<NeuralTable caption={"Compress an observed measurement sequence"} headers={[<>{"Step in 0.1 mm"}</>,<>{"MSE in mm²"}</>,<>{"Maximum absolute error in mm"}</>,<>{"zlib payload bytes"}</>,<>{"Complete bytes"}</>,<>{"Bits per retained value"}</>]} rows={[[<>{"1"}</>,<>{"0"}</>,<>{"0"}</>,<>{"502"}</>,<>{"513"}</>,<>{"12"}</>],[<>{"5"}</>,<>{".019269006"}</>,<>{".2"}</>,<>{"357"}</>,<>{"368"}</>,<>{"8.608187135"}</>],[<>{"10"}</>,<>{".092660819"}</>,<>{".5"}</>,<>{"285"}</>,<>{"296"}</>,<>{"6.923976608"}</>],[<>{"20"}</>,<>{".335350877"}</>,<>{"1"}</>,<>{"220"}</>,<>{"231"}</>,<>{"5.403508772"}</>]]} />

<Prose>{"At step 1 the stored tenth-millimetre values are unchanged. At step 20, the first observation 39.1 mm reconstructs as 40.0 mm. Across these four tested settings, larger steps save bytes while increasing measured error. This is an empirical result for the sequence and codec version, not a theorem that every coarser step compresses better or that the observed source is iid Gaussian. Recorded measurement resolution and quantization error do not establish error relative to true anatomy."}</Prose>

<Prose>{"Save the supplied "}<code>{"penguins.csv"}</code>{" beside the programme. "}<code>{"Decimal"}</code>{" checks the tenth-millimetre representation before conversion. NumPy independently checks the integer quantization, while the actual codec uses standard-library struct and zlib. The decoder rejects truncated, extra and oversized data against its declared count. Header count is bounded to avoid allocating an unrestricted output from an untrusted header; this remains a small teaching format rather than a general archival format."}</Prose>

<Prose>{"File: "}<code>{""}{"penguins_"}<wbr/>{"quantization.py"}{""}</code>{""}</Prose>

<Payload file="penguins_quantization.py" output={false}/>

<Prose>{"Output:"}</Prose>

<Payload file="penguins_quantization.stdout.txt" output={true}/>

<Prose>{"Only the retained numeric sequence can be decoded. To reconstruct the original CSV's ordering with missing entries, row identities, species and other fields, a different format would have to transmit or otherwise provide them. The table therefore does not claim to compress the entire dataset. The supplied provenance identifies the original collectors and CC0 dataset release, and the file index includes the exact data used."}</Prose>

<H3>{"Deeper: connect learned representations to coding operations"}</H3>

<Prose>{"An autoencoder with eight latent numbers has eight coordinates, not a declared eight-bit message. Trace the operations that turn one latent coefficient into transmitted bits and a reconstruction."}</Prose>

<Drawing id="D45"/>

<Prose>{"An analysis transform maps the source to real-valued latents y. Quantization maps y to discrete indices q. A probability model supplies masses for those indices; a lossless entropy coder converts them to bits. The receiver uses the agreed model and syntax to recover indices, then a synthesis transform produces X̂. Each arrow performs a different job. An entropy model does not itself reconstruct the image, and a synthesis transform does not specify how its inputs were transmitted."}</Prose>

<Prose>{"Rounding is locally constant almost everywhere, so its ordinary derivative does not train the transform usefully. Ballé, Laparra and Simoncelli's 2017 formulation used additive uniform noise as a differentiable training relaxation, then evaluated quantized and entropy-coded bitstreams. The separate training branch draws noisy continuous latents; it does not label those samples as the deployed message. That paper is a mechanism example, not a current codec ranking."}</Prose>

<Prose>{"Several commonly reported “rates” describe different random objects or costs."}</Prose>

<Drawing id="D46"/>

<Prose>{"For discrete indices with actual law P and coding law Q, expected ideal log price is H(P)+KL(P||Q). Model mismatch adds cost even if the representation itself is unchanged. A complete finite file also includes integer coding overhead, framing, metadata and any model description that is not already shared. For deterministic discrete indices q=f(X), I(X;q)=H(q); a continuous noisy training latent is a different variable."}</Prose>

<Prose>{"The preceding Information Bottleneck lesson derived, under the relevant finite-information assumptions,"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll horizontally when needed"><MathBlock>{"\\mathbb E_X D_{\\rm KL}(q(z\\mid X)\\Vert r(z))=I(X;Z)+D_{\\rm KL}(q(z)\\Vert r(z))."}</MathBlock></div>

<Prose>{"This is an upper bound on information, not an actual file format. Interpreting it as coding requires a construction and its overheads. A target-preserving bottleneck can also deliberately discard detail that reconstruction distortion would retain. Practice 15 compares two actual prefix-coded payloads with their complete headers before discussing that separate variational objective."}</Prose>

<Prose>{"The planned "}<a href={"/learn/path/full-curriculum/sampling-aliasing-and-quantization-in-neural-recordings?module=computational-neuroscience"}>{"Sampling, Aliasing and Quantization in Neural Recordings"}</a>{" lesson owns instrument sample timing, value resolution, clipping and noise assumptions. Here a practical comparison starts with the source and receiver's task, states the error criterion, counts the complete encoded message, and evaluates paired reconstruction error on held-out representative and rare inputs. Latency must be measured on stated hardware rather than inferred from the rate-distortion curve. A theoretical frontier is a model-dependent comparison for that evaluation."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"9. Practise the compression decision"}</H2>

<Prose>{"Attempt each prompt before opening its hint or solution. A satisfactory answer identifies the source law, transmitted representation, distortion units and applicable limit. The final repair file collects all new small implementations and their focused changed examples; it imports only the already supplied guarded helpers."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. A different four-word code"}</H3>

<Prose>{"For fair three-bit inputs, use the codebook 000,001,110,111. Choose a nearest reconstruction, breaking ties by codebook order. Find the fixed rate, average distortion and worst distortion."}</Prose>

<Prose>{"Implement the nearest-index calculation for all eight words, preserving the declared tie order. Report each assignment, not only the final average."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Four inputs are codewords. For each of the other four, determine whether one changed bit suffices."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"Each index uses 2 bits, so the fixed rate is 2/3 bit per source bit. The four codewords have no error; each other word has a nearest codeword one bit away. Expected error is 4/(8×3)=1/6, and worst block error is 1/3. This is a finite operating point, not proof that its rate equals R(1/6)."}</Prose>

<Prose>{""}<code>{"nearest_index"}</code>{" in the complete repair file below selects the first minimizing codebook index. In ascending source-word order the indices "}{"are[0,"}<wbr/>{"1,"}<wbr/>{"0,"}<wbr/>{"1,"}<wbr/>{"0,"}<wbr/>{"1,"}<wbr/>{"2,"}<wbr/>{"3]"}{" and changed-position "}{"counts[0,"}<wbr/>{"0,"}<wbr/>{"1,"}<wbr/>{"1,"}<wbr/>{"1,"}<wbr/>{"1,"}<wbr/>{"0,"}<wbr/>{"0]."}{" Their weighted average is 1/6 per source bit. A geometric grouping picture must show these same assignments."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Repair a curve that rises again"}</H3>

<Prose>{"Someone evaluates 1-Hb(D) for a fair source all the way to D=.9 and reports a positive required rate there. Identify the violated principle and supply the correct value."}</Prose>

<Prose>{"Implement a validated general binary-rate helper. Include p=0 or 1, a budget beyond the zero-rate threshold and rejection of a negative or nonfinite budget."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Which reconstruction was already feasible at D=.5?"}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"The feasible set only expands when D increases. A constant reconstruction with actual error .5 remains feasible at D=.9, so the minimum is 0. The entropy formula's curved branch ends at .5; applying it beyond that point violates monotonicity and ignores the constant-output feasible choice."}</Prose>

<Prose>{"Test the branch before subtracting entropies. A deterministic source has threshold zero and therefore always returns zero at valid nonnegative budgets. Do not use a positive part of the curved branch beyond its domain."}</Prose>

<CodeBlock language={"python"}>{"import math\n\ndef binary_entropy(p):\n    return -sum(v*math.log2(v) for v in (p,1-p) if v > 0)\n\n\ndef binary_rate(p, budget):\n    if not math.isfinite(p) or not 0 <= p <= 1:\n        raise ValueError('source probability must be in [0,1]')\n    if not math.isfinite(budget) or budget < 0:\n        raise ValueError('budget must be finite and nonnegative')\n    if budget >= min(p,1-p):\n        return 0.\n    return binary_entropy(p)-binary_entropy(budget)"}</CodeBlock>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Change the biased source"}</H3>

<Prose>{"Use p=.3 and budget D=.1. Construct the attaining joint table, find both forward conditional error probabilities and calculate the information rate."}</Prose>

<Prose>{"Verify the entire joint table before calculating its forward errors: both source marginals, both reconstruction marginals and total mismatch probability."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"First obtain output probability r=(p-D)/(1-2D), then generate X backward by an independent error bit."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"r=.25. The joint table, with input rows and output columns, is "}{"[[.675,"}<wbr/>{".025],"}<wbr/>{"[.075,"}<wbr/>{".225]]."}{" Its rows sum to .7/.3 and its off-diagonal mass is .1. False-positive probability is .025/.7≈.035714; false-negative probability is .075/.3=.25. The rate is "}{"Hᵦ(.3)−Hᵦ(.1)≈.412295"}{" bits. A forward channel that flips each source bit with probability .1 would be a different joint law."}</Prose>

<Prose>{"The output marginal is(.75,.25). Multiplying the backward output probabilities by independent error probabilities produces the four joint entries. Dividing by(.7,.3) is a separate conditioning operation. Substituting symmetric forward errors .1/.1 would preserve total error but construct a different information cost."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Diagnose the exact-zero-error claim"}</H3>

<Prose>{"For p=.1 and a fixed block length n=10, a designer says source entropy below 1 bit proves that a fixed-width exact zero-error code can use fewer than 10 bits per block. What went wrong?"}</Prose>

<Prose>{"State whether the error requirement is exact at this finite block length or only tends to zero over a sequence of increasing lengths."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"How many length-ten strings have positive probability?"}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"All 1024 strings have positive probability. Exact zero error requires 1024 distinct reconstructions, so a fixed-width index needs 10 bits. Source entropy constrains expected-length lossless coding and the asymptotic vanishing-error boundary, not this finite exact fixed-width requirement. Rare strings can be long in a variable-length code; a fixed-width code cannot hide their length in an average."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Convert the distortion units"}</H3>

<Prose>{"A solver minimizes I+2D, with D in squared metres. You change the reported error to Dnew=100D but want exactly the same objective and optimizer. What weight should the new solver use?"}</Prose>

<Prose>{"Check the objective numerically on any one declared feasible channel, after changing the whole cost matrix to 100 times its old values."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Set the new weighted distortion term equal to2D."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"Use λnew=.02, because .02×100D=2D. The multiplier has inverse distortion units. Keeping it at 2 would make the same physical error 100 times as expensive and generally select a different operating point."}</Prose>

<Prose>{"The information term and channel remain unchanged. The changed distortion is 100D and the inverse weight preserves lambdaD. In the new weighted exercise below, .1 becomes .001 when costs are multiplied by 100. Bit-to-nat conversion is another rescaling: lambda in bits becomes s=lambda ln 2 inside natural-log Gibbs calculations."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. A stationary but bad optimizer"}</H3>

<Prose>{"The fair-binary solver at λ=2 starts with r=(1,0). After 100 iterations its conditional table is unchanged. Is it optimal? Give a feasible rule that improves its objective."}</Prose>

<Prose>{"Name the diagnostic that must include absent reconstruction columns. Explain why its bound gap need not equal the difference from one chosen comparison encoder."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The zero column cannot reappear. Compare the actual zero-rate error with the binary operating point D=.2."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"The constant output has I=0, D=.5 and objective 1. The valid binary channel with D=.2 has "}{"I="}<wbr/>{"1−Hᵦ(.2)≈.278072"}{" and "}{"objective≈.678072."}{" Its improvement is about .321928. Positive initialization admits that channel; an unchanged support-limited table is insufficient evidence. The reported gap need not equal the actual improvement, because a lower bound can be loose."}</Prose>

<Prose>{"The scores g_j include every column, even one with r_j=0. An inactive g_j>1 exposes a profitable direction. Upper minus lower is a certificate gap for the combined objective; it is not an uncertainty bound for I and D separately. A larger iteration count cannot revive an exactly excluded column."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Allocate a new Gaussian budget"}</H3>

<Prose>{"Two independent Gaussian components have variances4 and1. Allocate total squared error1.5 and calculate the total rate. Then describe what happens when the budget reaches3."}</Prose>

<Prose>{"Return component errors and component rates separately, and label the total as bits per vector."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Try a common error level and check whether either component would exceed its variance."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"At total 1.5, θ=.75 lies below both variances, so the errors are (.75,.75). The component rates are about 1.207519 and .207519 bits, adding to 1.415037 bits per vector before rounding. At budget 3, the smaller component caps at 1 and the other gets 2; rate becomes .5 bit per vector. Dividing the total by 2 gives average rate per component, not either component's individual rate."}</Prose>

<Prose>{"Reuse the complete "}<code>{"allocate"}</code>{" helper supplied above; importing it does not execute a demonstration. Zero variance requires no bits, whereas zero error on a positive-variance Gaussian requires infinite ideal rate."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. A plausible output that is not faithful"}</H3>

<Prose>{"With an unknown fair sign X∈{−1,+1}, compare reconstructing0 with sampling an independent fair sign. Can the second scheme prove that the original sign was preserved because its output histogram matches?"}</Prose>

<Prose>{"Add a source-copying decoder to the joint comparison and explain where its information comes from."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Enumerate the four equally likely input/output pairs of the random scheme."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"No. Constant 0 has MSE 1. Independent signs agree on two pairs and differ by 2 on two pairs, giving MSE 2. The output marginal matches, but independence means I=0. Preserving the actual sign would require an input-dependent message or other informative side information. Marginal similarity and paired fidelity measure different properties."}</Prose>

<Prose>{"Copying X has only the two matching pairs, each probability .5, so its MSE is 0 and I(X;Xhat)=1 bit. Unlike the other two schemes, it uses the source-dependent sign. Matching an output histogram alone neither produces that pairing nor supplies the missing message."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Build and validate a changed byte format"}</H3>

<Prose>{"Adapt the complete serializer to the four-word codebook from task1, using two index bits per block and the same four-byte source-length header. Encode 001011101111. Define tests for partial blocks and malformed data."}</Prose>

<Prose>{"Implement the whole revised encoder and decoder, including count header, two-bit indices, source padding, payload padding and truncation. Add focused empty, partial and malformed cases before any larger campaign."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Select the nearest codeword, emit its index as exactly two bits, concatenate indices, and pad only the final byte. The decoder derives the index count from the original length."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"The indices are 1,1,1,3, so the payload bits are 01010111, hex 57. The complete five-byte message is hex 0000000c 57. Decoding reconstructs 001001001111, with two wrong positions out of 12. The padding and length protocol must state that a partial source block is zero-padded before encoding and truncated after reconstruction. Acceptance tests: exhaust all binary strings of lengths 0 through 10; preserve the original decoded length; emit only the declared index width; check the expected payload byte count; reject a truncated header, missing/extra payload bytes and nonzero unused bits. For full fair three-bit blocks, verify average error 1/6 and at most one changed bit per block. Report both payload and full-message bits per original bit; an empty input has a valid header but no meaningful per-symbol rate. These tests verify the declared toy protocol, not resilience to arbitrary bit corruption."}</Prose>

<Prose>{"The functions below are the complete changed format. Nearest reconstruction uses ascending codebook order to break ties. The decoder derives the exact number of used index bits from the source length; all remaining payload bits must be zero. It requires neither the original source nor its errors."}</Prose>

<CodeBlock language={"python"}>{"import struct\n\nCODEBOOK = ('000', '001', '110', '111')\n\ndef nearest_index(word, codebook=CODEBOOK):\n    if len(word) != 3 or any(bit not in '01' for bit in word):\n        raise ValueError('one complete three-bit word required')\n    return min(range(len(codebook)),\n               key=lambda j:sum(a!=b for a,b in zip(word,codebook[j])))\n\n\ndef compress_four(source):\n    if any(bit not in '01' for bit in source) or len(source) >= 2**32:\n        raise ValueError('binary source fitting the four-byte length required')\n    padded = source+'0'*((-len(source))%3)\n    indices = [nearest_index(padded[i:i+3]) for i in range(0,len(padded),3)]\n    bits = ''.join(f'{j:02b}' for j in indices)\n    packed = bits+'0'*((-len(bits))%8)\n    payload = bytes(int(packed[i:i+8],2) for i in range(0,len(packed),8))\n    return struct.pack('>I',len(source))+payload\n\n\ndef decompress_four(message):\n    if len(message)<4:\n        raise ValueError('missing source-length header')\n    count, = struct.unpack('>I',message[:4])\n    blocks = (count+2)//3\n    used = 2*blocks\n    if len(message)!=4+(used+7)//8:\n        raise ValueError('payload length disagrees with header')\n    bits = ''.join(f'{byte:08b}' for byte in message[4:])\n    if '1' in bits[used:]:\n        raise ValueError('nonzero unused payload bits')\n    indices = [int(bits[i:i+2],2) for i in range(0,used,2)]\n    return ''.join(CODEBOOK[j] for j in indices)[:count]"}</CodeBlock>

<Prose>{"The exercise file includes focused empty, partial-block and malformed-message checks for this changed two-bit protocol. The exhaustive lengths 0 through 10 campaign requested above remains a further learner task; the recorded focused run does not establish its completion."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"10. Choose a useful audio operating point"}</H3>

<Prose>{"You must compress 30-second call recordings. Propose a cheap distortion check, a more task-relevant check and an evaluation process that does not let a good average conceal lost critical words."}</Prose>

<Prose>{"Give one acceptable evaluation plan, including a decision threshold for critical content before selecting an operating point. Do not invent recordings, measured latency or a winning codec."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Distinguish paired waveform fidelity, intelligibility of words and the actual encoded bytes. State what would make a candidate fail."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"One defensible starting answer uses aligned waveform MSE as a cheap paired signal check, while acknowledging its sensitivity to small timing changes and its incomplete relationship to intelligibility. A task-relevant evaluation uses blinded listening/transcription of held-out calls, checking important words or numbers separately. Include realistic noise and speaker conditions with category-level results. A specific intelligibility metric could supplement these checks if its validity for the conditions is established. Encode and decode every candidate setting through the real format; count complete bytes, measure latency on stated hardware and evaluate the same held-out recordings. Specify an acceptable error criterion before comparing settings, including a separate critical-word requirement. A candidate fails when it violates that requirement even if aggregate MSE improves. Document the chosen bitrate range and what source changes would trigger reevaluation. The theory organizes the tradeoff; it cannot decide which lost words are acceptable."}</Prose>

<Prose>{"This is an open design task. An answer succeeds when its stated byte convention, held-out conditions, paired or task-specific loss, critical-event requirement and hardware timing procedure could be independently applied. A lower aggregate MSE cannot excuse a failed critical-word requirement."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"11. Distinguish channel mixing from time-sharing"}</H3>

<Prose>{"Mix two fair-binary channels with flip probabilities .1 and .3, choosing either with probability 1/2 independently for each source symbol. Calculate the mixed distortion and MI, and compare with the average of the two original MIs. Explain how a known schedule of finite block codes differs. Finish the converse’s Jensen step and bound exceptional error mass epsilon for bounded distortion dmax."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The mixed channel has flip probability .2. Conditional entropy is nonlinear in the error probability. A known block schedule adds lengths and errors."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"The mixed channel has D=.2 and "}{"I="}<wbr/>{"1−Hb(.2)="}<wbr/>{".278071905"}{" bits. The mean of the two channel informations is .324856754 bits, strictly larger. Distortion mixes linearly, while MI is convex in the channel. Time-sharing actual block codes adds their actual transmitted lengths and distortions, giving their weighted rates rather than assigning that rate to the mixed channel’s MI. In the converse, convexity gives (1/n)sum R(Di)≥R((1/n)sum Di); monotonicity then gives R(Dbar)≥R(D) if Dbar≤D. Exceptional source mass epsilon contributes at most epsilon dmax. Without bounded cost or suitable tail control, small failure probability alone does not control expected distortion."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"12. Repair one weighted BA step"}</H3>

<Prose>{"Use source values and reconstructions 0,1,3, probabilities (.7,.2,.1), initial output law (.2,.3,.5), lambda .1 and squared cost with the source 3 row multiplied by 10. Implement one Gibbs row update, rebuild the induced marginal and calculate the all-column bound. Repair code that sums the wrong array axis or uses the old output law in the reported MI. Check a cost-unit change multiplying all costs by 100."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Costs are fixed for this step. Row normalization sums over reconstruction columns; the new output law averages rows using source probabilities. Distortion changes under a unit conversion, while lambdaD should not."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"The first channel is "}{"[[.267432142,"}<wbr/>{".374284517,"}<wbr/>{".358283341],"}<wbr/>{"[.215596641,"}<wbr/>{".346606138,"}<wbr/>{".437797221],"}<wbr/>{"[.000752445,"}<wbr/>{".036117381,"}<wbr/>{".963130173]]."}{" Its induced marginal "}{"is(.230397072,"}<wbr/>{".334932128,"}<wbr/>{".434670800),"}{" not the unweighted mean of rows or the old(.2,.3,.5). The scores g "}{"are(1.151985361,"}<wbr/>{"1.116440426,"}<wbr/>{".869341600)."}{" The achieved distortion is 3.063782850 cost units, MI .110843557 bits and objective .417221842 bits; the lower bound .225545836 gives gap .191676005. The scalar and array solutions below expose different implementation routes to those same operations. Multiplying cost by 100 and changing lambda to .001 preserves q,r,I and both objective bounds; D itself multiplies by 100."}</Prose>

<CodeBlock language={"python"}>{"import math\nimport numpy as np\nfrom scipy.special import logsumexp\n\ndef one_ba_scalar(p, costs, weight, initial):\n    # This task uses positive finite p and r and finite nonnegative costs.\n    s = weight*math.log(2)\n    logits = [[math.log(r)-s*d for r,d in zip(initial,row)] for row in costs]\n    normalizers=[]\n    q=[]\n    for row in logits:\n        largest=max(row)\n        log_z=largest+math.log(sum(math.exp(v-largest) for v in row))\n        normalizers.append(log_z)\n        q.append([math.exp(v-log_z) for v in row])\n    marginal=[sum(p[i]*q[i][j] for i in range(len(p))) for j in range(len(initial))]\n    information=sum(p[i]*q[i][j]*(math.log(q[i][j])-math.log(marginal[j]))/math.log(2)\n                    for i in range(len(p)) for j in range(len(initial)))\n    distortion=sum(p[i]*q[i][j]*costs[i][j] for i in range(len(p)) for j in range(len(initial)))\n    g=[sum(p[i]*math.exp(-s*costs[i][j]-normalizers[i]) for i in range(len(p)))\n       for j in range(len(initial))]\n    f=-sum(pi*z for pi,z in zip(p,normalizers))\n    lower=(f-math.log(max(g)))/math.log(2)\n    upper=information+weight*distortion\n    return q,marginal,[distortion,information,lower,upper,upper-lower],g\n\n\ndef one_ba_array(p, costs, weight, initial):\n    p,d,r=map(lambda v:np.asarray(v,dtype=np.float64),(p,costs,initial))\n    scaled=weight*math.log(2)*d\n    log_z=logsumexp(np.log(r)[None,:]-scaled,axis=1)\n    log_q=np.log(r)[None,:]-scaled-log_z[:,None]\n    q=np.exp(log_q)\n    induced=p@q\n    joint=p[:,None]*q\n    information=float((joint*(log_q-np.log(induced)[None,:])).sum()/math.log(2))\n    distortion=float((joint*d).sum())\n    log_g=logsumexp(np.log(p)[:,None]-scaled-log_z[:,None],axis=0)\n    lower=float((-p@log_z-log_g.max())/math.log(2))\n    upper=information+weight*distortion\n    return q,induced,[distortion,information,lower,upper,upper-lower],np.exp(log_g)"}</CodeBlock>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"13. Rotate, allocate and rotate back"}</H3>

<Prose>{"For a jointly Gaussian source with "}{"covariance[[2.5,"}<wbr/>{"1.5],"}<wbr/>{"[1.5,"}<wbr/>{"2.5]],"}{" allocate total squared error 1.5. Implement the "}{"eigendecomposition,"}{" match eigenvalues and error variances, reconstruct the "}{"original-coordinate"}{" error covariance and check its trace. Separately compare a scalar sign quantizer at variance 4 with the one-bit Gaussian limit."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The covariance has eigenvalues 1 and 4. Orthogonal rotation preserves summed squared error; Gaussianity is what turns uncorrelated transformed coordinates into independent ones."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"Both components receive error .75, so the rotated-back error covariance is .75 times the identity and its trace is 1.5. Total rate is 1.415037499 bits per vector. The scalar sign quantizer at variance 4 has MSE "}{"4(1−2/pi)="}<wbr/>{"1.453520911,"}{" above the one-bit long-block limit 4/4=1. The covariance calculation assumes a jointly Gaussian vector and ordinary summed squared error. The finite sign rule is a specified scalar codec, not the asymptotic optimizer. The complete implementation reuses the supplied active-set helper and validates the covariance before eigh."}</Prose>

<CodeBlock language={"python"}>{"import math\nimport numpy as np\nfrom rd_scalar_helpers import allocate\n\ndef rotated_error(covariance,budget):\n    covariance=np.asarray(covariance,dtype=np.float64)\n    if covariance.ndim!=2 or covariance.shape[0]!=covariance.shape[1]:\n        raise ValueError('square covariance required')\n    if not np.all(np.isfinite(covariance)) or not np.allclose(covariance,covariance.T,atol=1e-12,rtol=0):\n        raise ValueError('finite symmetric covariance required')\n    values,basis=np.linalg.eigh(covariance)\n    if np.any(values<0):\n        raise ValueError('nonnegative eigenvalues required')\n    errors,rates=allocate(values.tolist(),budget)\n    return values,errors,basis@np.diag(errors)@basis.T,sum(rates)"}</CodeBlock>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"14. Extend the measured-byte experiment"}</H3>

<Prose>{"Use the same offline retained bill-length sequence and version 1 format at steps 7 and 15 tenths of a millimetre. Report paired MSE in mm², maximum error in mm, complete bytes and bits per retained value. Verify a new halfway case using step 14, reject a truncated payload, and state what information cannot be reconstructed from this message."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The quantizer’s step and input integers have the same tenth-millimetre unit. Reuse the actual guarded encoder/decoder; no model or original CSV is available to the decoder."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"The recorded changed-step experiment retains 342 values and omits original data rows 4 and 272. Step 7 gives MSE .041929825 mm², maximum .3 mm,339 complete bytes and 7.929824561 bits/value. Step 15 gives .178187135 mm², maximum .7 mm,265 complete bytes and 6.198830409 bits/value. At step 14, values 7 and 21 reconstruct to 14 and 28: exact ties go upward. Truncating the final stream is rejected. These bytes use the same zlib environment as the main example; they are observed results, not guaranteed monotone sizes for arbitrary steps. Original missing-row positions, species and other CSV fields are not transmitted. The complete repair file below contains the exact additional calls and assertions."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"15. Audit ideal prices and complete bytes"}</H3>

<Prose>{"For exact text AAAABBCD, use truthful "}{"Q1="}<wbr/>{"(.5,"}<wbr/>{".25,"}<wbr/>{".125,"}<wbr/>{".125)"}{" with codes A0/B10/C110/D111, and "}{"Q2="}<wbr/>{"(.125,"}<wbr/>{".125,"}<wbr/>{".25,"}<wbr/>{".5)"}{" with codes A110/B111/C10/D0. Calculate empirical entropy, the second model’s cross-entropy and mismatch excess. Encode both payloads with a four-byte "}{"original-symbol-count"}{" header and zero padding to a full byte. Explain why neither byte count is a noisy-latent variational MI upper bound."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"These are dyadic probabilities, so each given prefix length equals its model’s negative base 2 log probability. The decoder is assumed to know which fixed book was chosen."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"Counts(4,2,1,1) give H=1.75 bits/symbol. Under Q2 the average price is 2.625, so mismatch costs .875 bits/symbol. The first actual payload has 14 bits and complete hex "}<code>{"000000080adc"}</code>{",6 bytes. The second has 21 bits and complete hex "}<code>{"00000008db6fe0"}</code>{",7 bytes. The original count lets the decoder ignore final byte padding; the fixed codebook is shared by prior agreement, with no claim that a transmitted model is free. A variational encoder/reference KL concerns separately defined random variables and a surrogate objective. Converting it into a file requires a coding construction and its overheads."}</Prose>

<Prose>{"The complete exercise file follows. It includes the small functions shown above, the direct changed cases, and imports the already supplied "}<code>{""}{"rd_"}<wbr/>{"scalar_"}<wbr/>{"helpers.py"}{""}</code>{" and "}<code>{""}{"penguins_"}<wbr/>{"quantization.py"}{""}</code>{" without running their mains. Keep the pinned CSV beside those files."}</Prose>

<Payload file="rd_practice.py" output={false}/>

<Prose>{"Recorded output of this one bounded exercise run:"}</Prose>

<Payload file="rd_practice.stdout.txt" output={true}/>

</details>

<Prose>{"You are ready to move on when you can construct a decodable code, state its full message cost, distinguish its finite result from a model-dependent information frontier, trace a stable Gibbs update, diagnose missing support, allocate Gaussian error and explain what the chosen distortion can miss. The next topic, "}<a href={"/learn/path/full-curriculum/f-divergences-integral-probability-metrics?module=math-foundations"}>{"f-Divergences & Integral Probability Metrics"}</a>{", compares probability laws in other ways. The independent-sign example shows why a distributional comparison and paired reconstruction fidelity answer different questions."}</Prose></div></section>

<section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning" data-lesson-resource-list=""><H2>{"Further learning"}</H2>

<ul><li>{""}<a href={"https://static.ias.edu/pitp/archive/2012files/Cover_and_Thomas_Chptr13.pdf"}>{"Cover and Thomas, chapter 13"}</a>{" develops the binary and Gaussian constructions, converse, achievability and finite computation in one canonical treatment. The chapter numbering here is from the 1991 edition. Start with its backward-channel example after tracing the joint table in section 3."}</li><li>{""}<a href={"https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/resources/mit6_441s16_chapter_23/"}>{"MIT 6.441, chapter 23"}</a>{" connects scalar and vector quantization with rate-distortion theory. It is useful for seeing why a finite quantizer and an asymptotic information bound are different objects. "}<a href={"https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/aaa8d18ddecde45f97134d3f3dcee4a3_MIT6_441S16_chapter_24.pdf"}>{"Chapter 24"}</a>{", especially theorem 24.2, supplies a formal continuation of the random-codebook argument and its assumptions."}</li><li>{""}<a href={"https://www.cs.cmu.edu/~aarti/Class/10704_Spring15/lecs/lec16.pdf"}>{"CMU 10-704, lecture 16, sections 16.3–16.4"}</a>{" is a compact supplementary route through the Gaussian result and finite BA calculation. These are course scribe notes; use the explicit source, multiplier and logarithm conventions when comparing equations."}</li><li>{"For a lecture-based second pass, "}<a href={"https://www.youtube.com/watch?v=qmCTnAoMSc8"}>{"S. N. Merchant's NPTEL lecture 31: Introduction to Rate-Distortion Theory"}</a>{", from "}<a href={"https://nptel.ac.in/courses/117101053"}>{"IIT Bombay's Information Theory and Coding course"}</a>{", is an older foundational alternative after entropy and mutual information. The creator and title were verified, but this revision did not review full playback or a transcript."}</li></ul></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references" data-lesson-resource-list=""><H2>{"Technical references"}</H2>

<ul><li>{""}<a href={"https://gwern.net/doc/cs/algorithm/information/1959-shannon.pdf"}>{"Shannon, Coding Theorems for a Discrete Source With a Fidelity Criterion"}</a>{" introduces the fidelity-criterion formulation. Its distinction between error frequency and application consequences is relevant to the alarm example; the local numerical weights are illustrative, not measurements from that paper."}</li><li>{""}<a href={"https://doi.org/10.1109/TIT.1972.1054855"}>{"Blahut's original algorithm paper"}</a>{" is the historical computational reference. "}<a href={"https://sites.ecse.rpi.edu/~pearlman/lec_notes/blahut_2.pdf"}>{"Pearlman's lecture notes"}</a>{" provide an accessible auxiliary-optimization derivation. Multiplier signs and log bases vary between treatments; the complete derivation and all-column bound in section 5 state the conventions used here. The original Blahut full text was not retrieved for this revision."}</li><li>{""}<a href={"https://www.cns.nyu.edu/pub/lcv/balle17a-final.pdf"}>{"Ballé, Laparra and Simoncelli, End-to-End Optimized Image Compression"}</a>{", sections 2–3 and the entropy-code appendix, connects transform learning, the continuous training relaxation and actual encoded rates. It is a mechanism reference, not a current performance recommendation."}</li><li>{""}<a href={"https://proceedings.mlr.press/v97/blau19a.html"}>{"Blau and Michaeli, Rethinking Lossy Compression"}</a>{" formulates paired distortion and output-distribution discrepancy as different constraints. Read its operational qualifications: an information formulation alone does not establish general coding achievability. "}<a href={"https://www.comm.utoronto.ca/~weiyu/2024_ISITW_Sadaf.pdf"}>{"Qian and colleagues, Gaussian Vector Rate-Distortion-Perception"}</a>{", section III, reviews classical reverse water-filling before a more advanced extension with additional assumptions."}</li><li>{"The ordinary numerical contracts are documented by "}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.special.logsumexp.html"}>{"SciPy logsumexp"}</a>{", "}<a href={"https://docs.scipy.org/doc/scipy/reference/optimize.minimize-slsqp.html"}>{"SLSQP"}</a>{", "}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.brentq.html"}>{"brentq"}</a>{" and "}<a href={"https://numpy.org/doc/stable/reference/generated/numpy.linalg.eigh.html"}>{"NumPy eigh"}</a>{". The local programmes expose array axes, tolerances, constraints and eigenvector ordering so those tools can be used deliberately."}</li><li>{""}<a href={"https://docs.python.org/3.12/library/zlib.html"}>{"Python zlib"}</a>{" documents the stream format controls and decompression checks. "}<a href={"https://allisonhorst.github.io/palmerpenguins/"}>{"Palmer penguins"}</a>{" documents the CC0 dataset, and "}<a href={"https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0090081"}>{"Gorman, Williams and Fraser"}</a>{" describes the field study. The storage exercise compares recorded measurements with their reconstructions; it does not reproduce the ecological analysis."}</li></ul></section>

<H2>{"Files and setup"}</H2>

<Prose>{"The original small examples use Python's standard library. The array and root-finding comparisons use NumPy 2.3.5 and SciPy 1.18.1; their recorded environment used Python 3.12.14. The measurement codec uses standard-library "}<code>{"Decimal"}</code>{", "}<code>{"struct"}</code>{" and zlib, with NumPy as a separate quantization check. Exact compressed sizes refer to the stated zlib build/runtime 1.3.2."}</Prose>

<NeuralTable caption={"Files and setup"} headers={[<>{"File"}</>,<>{"Purpose and required companion"}</>]} rows={[[<>{""}<code>{"rd_blockCode.py"}</code>{""}</>,<>{"Enumerate the complete three-bit code and its errors."}</>],[<>{""}<code>{""}{"rd_"}<wbr/>{"biasedChannel.py"}{""}</code>{""}</>,<>{"Construct the fixed interior binary joint law and forward errors."}</>],[<>{""}<code>{""}{"rd_"}<wbr/>{"originalBinary.py"}{""}</code>{""}</>,<>{"Evaluate the original fair curved branch within its declared domain."}</>],[<>{""}<code>{""}{"rd_"}<wbr/>{"finiteOptimizer.py"}{""}</code>{""}</>,<>{"Stable scalar BA calculation and all-column objective bounds."}</>],[<>{""}<code>{""}{"rd_"}<wbr/>{"scalar_"}<wbr/>{"helpers.py"}{""}</code>{""}</>,<>{"Importable exact scalar function definitions, with no demonstration loop."}</>],[<>{""}<code>{""}{"finite_"}<wbr/>{"rd_"}<wbr/>{"library.py"}{""}</code>{""}</>,<>{"Same-fixture array comparison and constrained solver; keep the scalar helper beside it."}</>],[<>{""}<code>{""}{"rd_"}<wbr/>{"gaussianAllocation.py"}{""}</code>{""}</>,<>{"Scalar Gaussian rate and capped active-set allocation."}</>],[<>{""}<code>{""}{"gaussian_"}<wbr/>{"rd_"}<wbr/>{"library.py"}{""}</code>{""}</>,<>{"Root finding and covariance rotation; keep the scalar helper beside it."}</>],[<>{""}<code>{"rd_fidelity.py"}</code>{""}</>,<>{"Enumerate paired errors for constant and independent reconstructions."}</>],[<>{""}<code>{"rd_bitstream.py"}</code>{""}</>,<>{"The original complete one-bit-index protocol."}</>],[<>{""}<code>{""}{"penguins_"}<wbr/>{"quantization.py"}{""}</code>{""}</>,<>{"Quantize and store the retained numeric sequence; requires "}<code>{"penguins.csv"}</code>{"."}</>],[<>{""}<code>{"rd_practice.py"}</code>{""}</>,<>{"Complete new exercise functions and changed cases; requires both guarded numerical/codec helpers and the data."}</>],[<>{""}<code>{"penguins.csv"}</code>{" and "}<code>{"DATA-PROVENANCE.md"}</code>{""}</>,<>{"Exact offline measurements and their attribution/selection rule."}</>]]} />

<Prose>{"Save the complete sources under their shown filenames and keep companions together. Each main example runs with "}<code>{"python filename.py"}</code>{"; importing the helper files does not execute the original demonstrations. The common file controls provide the whole source, including imports and checks."}</Prose><Prose><a href="/learn-assets/rate-distortion/penguins.csv" download>Download penguins.csv</a>{' · '}<a href="/learn-assets/rate-distortion/DATA-PROVENANCE.md" download>Data source and attribution</a></Prose></div></RateDistortionProvider>;}
