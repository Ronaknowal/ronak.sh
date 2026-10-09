// Static source-bound projection of the accepted complete-r3 manuscript.
import { Prose, H2, H3, CodeBlock } from '../content';
import { Math as InlineMath, MathBlock } from '../content/Math.jsx';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import { NeuralTable } from './NeuralLessonElements.jsx';
import Drawing from './EntropyReadingDrawings.jsx';
import { EntropyStudy } from './EntropyDrawingElements.jsx';
function Payload({
  file,
  output = false
}) {
  return <section className="en-programme" data-payload={file}><RemoteCodeBlock source={'/learn-assets/entropy-information/' + file} filename={file} language={output ? 'output' : 'python'} /></section>;
}
export default function EntropyReadingLesson() {
  return <EntropyStudy><div className="lesson-pilot lesson-flow entropy-reading"><Prose opening="summary">{"A device sends status symbols. Some occur often; others rarely. Can short binary messages exploit that pattern? A prediction model has a related problem: what does it cost to believe the wrong pattern? Follow the same four outcomes through their probabilities, codewords and prediction costs, then use that accounting to compare models and certify a constrained distribution."}</Prose>

<Prose opening="prerequisites">{"Prerequisites: "}<a href={"/learn/path/full-curriculum/probability-distributions-bayes-theorem?module=math-foundations"}>{"Probability Distributions & Bayes' Theorem"}</a>{" supplies probabilities, conditional slices and weighted averages. "}<a href={"/learn/path/full-curriculum/algebra-functions-exponentials-logarithms?module=math-foundations"}>{"Algebra, Functions, Exponentials & Logarithms"}</a>{" explains logarithms as inverse powers. We refresh both operations. The continuous branch introduces density and integration locally; "}<a href={"/learn/path/full-curriculum/measure-theory-probability-spaces?module=math-foundations"}>{"Measure Theory"}</a>{" supplies further foundations."}</Prose>

<Prose opening="route">{"On a first pass, read sections 1–4, the basic bound and direction in 5, then conditional prediction and practical scoring in 6–7. Try the related practice before returning to the deeper coding proof and sections 8–9. The drawings and live investigations work here; complete Python files run in your own environment. Most use the standard library. The explicitly named comparisons use NumPy/SciPy or PyTorch. Printed decimals are rounded and their tested environments are stated beside the programmes."}</Prose>

<H2>{"1. Start with a message and its surprise"}</H2>

<Prose>{"Our device can send A, B, C or D. The source describes how frequently each would occur over repeated draws."}</Prose>

<Drawing id="E01" />

<Prose>{"A occupies half the probability strip, B a quarter, and C and D an eighth each. Together the masses sum to one. A "}<strong>{"distribution"}</strong>{" assigns such probabilities to the possible outcomes. We write P(x) for the mass of outcome x under source P. The letters name categories; A is not numerically closer to B than to D. The strip describes the law, not a promise that every eight-symbol message will contain exactly four As."}</Prose>

<Prose>{"Each time we halve a probability, we need one more equally weighted binary choice to identify that outcome."}</Prose>

<Drawing id="E02" />

<Prose>{"Probability 1/2 corresponds to one such choice,1/4 to two and 1/8 to three. A logarithm reverses the power: because 2⁻³=1/8, −log₂(1/8)=3. We call −log₂P(x) the outcome's "}<strong>{"surprisal"}</strong>{", measured in "}<strong>{"bits"}</strong>{". At this point “bit” names an information unit; it does not yet guarantee an integer number of transmitted digits."}</Prose>

<NeuralTable caption={"1. Start with a message and its surprise"} headers={[<>{"Outcome"}</>, <>{"P(x)"}</>, <>{"−log₂P(x)"}</>]} rows={[[<>{"A"}</>, <>{"1/2"}</>, <>{"1 bit"}</>], [<>{"B"}</>, <>{"1/4"}</>, <>{"2 bits"}</>], [<>{"C"}</>, <>{"1/8"}</>, <>{"3 bits"}</>], [<>{"D"}</>, <>{"1/8"}</>, <>{"3 bits"}</>]]} />

<Prose>{"Why should information use a logarithm? Follow two choices along one path."}</Prose>

<Drawing id="E03" />

<Prose>{"An independent first event has probability 1/2 and the second 1/4. Their joint probability is 1/8; their information adds as 1+2=3 bits. The product rule and logarithm rule agree:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally if needed" tabIndex={0}><MathBlock>{"I_P(x)=-\\log_bP(x),\\qquad -\\log_b(pq)=-\\log_bp-\\log_bq."}</MathBlock></div>

<Prose>{"The log identity holds for positive p and q. Using pq as a joint probability needs independence. In a dependent process, the second branch instead has its probability conditional on the first: P(x,y)=P(x)P(y|x). A second copy of an already known bit supplies no new information; its conditional probability is one."}</Prose>

<Prose>{"Information has a unit because we choose the logarithm's base."}</Prose>

<Drawing id="E04" />

<Prose>{"Base 2 gives bits. The natural logarithm, ln with base e, gives "}<strong>{"nats"}</strong>{". One bit equals ln 2≈.693147 nats; divide nats by ln 2 to express the same amount in bits. The two rulers identify the same probability with different numerical units. Keep the base consistent within a sum or comparison."}</Prose>

<Prose>{"An outcome assigned probability 1 has zero surprise. As a positive probability approaches zero its surprise grows without bound. Observing something the model assigned probability 0 contradicts that exclusion and has infinite model surprise. “Surprising” here means improbable under a stated model. It does not measure emotional significance, usefulness, truth or how random a string looks."}</Prose>

<Prose>{""}<strong>{"Checkpoint."}</strong>{" A model assigns probability 1 to A and 0 to B. What does observing each one reveal?"}</Prose>

<details><summary>Compare your reasoning</summary>

<Prose>{"Observing A supplies −log₂1=0 bits under this model: it was completely predicted. Observing B exposes a support error and gives infinite model surprise. The model's exclusion does not prove B impossible in reality."}</Prose>

</details>

<H2>{"2. Average over what actually happens"}</H2>

<Prose>{"One rare outcome can be very surprising while making only a small contribution to an average. Weight its price by how often it occurs."}</Prose>

<Drawing id="E05" />

<Prose>{"Each rectangle has width P(x), height −log₂P(x), and area equal to their product. A contributes .5×1=.5 bit per draw; B contributes .25×2=.5; C and D each contribute .125×3=.375. The four areas sum to "}<strong>{"1.75 bits per symbol"}</strong>{". Giving every category equal weight would incorrectly produce(1+2+3+3)/4=2.25."}</Prose>

<Prose>{""}<strong>{"Shannon entropy"}</strong>{" is this expected surprisal when the same distribution supplies both frequencies and prices:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally if needed" tabIndex={0}><MathBlock>{"H_b(P)=\\mathbb E_{X\\sim P}[-\\log_bP(X)]=-\\sum_xP(x)\\log_bP(x)."}</MathBlock></div>

<Prose>{"Expectation means multiply by the probability and add. Entropy concerns uncertainty before the draw, rather than the surprise of one particular outcome."}</Prose>

<Prose>{"A biased coin makes the distinction particularly clear."}</Prose>

<Drawing id="E06" />

<Prose>{"At heads probability .9, a rare tail has about 3.322 bits of surprise but occurs only .1 of the time. Its weighted contribution is about .3322. Heads contributes about .1368, giving entropy .468996 bits. Change the heads probability in the investigation: the picture separates each outcome's price from its contribution, then locates their total on the entropy curve. Swapping .9 and .1 changes which outcome is rare but leaves the total unchanged. A fair coin has one bit."}</Prose>

<Prose>{"The following complete standard-library programme computes that average. Save it as "}<code>{"entropy_coin.py"}</code>{" and run "}<code>{"python entropy_coin.py"}</code>{". It was executed in the retained Python 3.12 verification; this lesson preserves that source and rounded result."}</Prose>

<Prose>{""}<strong>{"entropy_coin.py"}</strong>{""}</Prose>

<Prose>{"Standard-library Python example; the output is retained from its earlier verified execution."}</Prose>

<Payload file="entropy_coin.py" />

<Prose>{"Output:"}</Prose>

<Payload file="entropy_coin.py.stdout.txt" output />

<Prose>{"The two terms directly match the two contribution rectangles. This small fixture uses positive probabilities. At a boundary, the entropy sum uses the limit 0log0=0; it does not evaluate log0 or pretend that the excluded event's surprise is zero. A distribution certain of one outcome has entropy 0. For m equally likely outcomes every price is log_b m, so the weighted average is also log_b m. Section 5 will prove that no finite distribution on those m labels has greater entropy."}</Prose>

<H3>{"Deeper: why mixing laws can create uncertainty"}</H3>

<Prose>{"Compare two certain but different outcomes with a random choice between their laws."}</Prose>

<Drawing id="E07" />

<Prose>{"Each certain law has entropy 0, but an equal mixture of them is a fair bit with entropy 1. The curve lies above the chord joining the component entropies. More generally entropy is "}<strong>{"concave"}</strong>{" in a finite probability vector. The summand g(p)=−p ln p has second derivative−1/p for p>0; summing these concave terms preserves concavity, and the continuous endpoint limit handles zero masses. Mixing laws and averaging their separate uncertainty are different operations."}</Prose>

<H2>{"3. Turn information into actual binary words"}</H2>

<Prose>{"We now need an actual message the receiver can decode. Assign a binary string to each status symbol."}</Prose>

<Drawing id="E08" />

<Prose>{"The root is the start of a word. A0-edge or 1-edge chooses a branch. The leaves name A=0, B=10, C=110 and D=111. A "}<strong>{"codeword"}</strong>{" is the complete bit string from root to its leaf. This code is "}<strong>{"prefix-free"}</strong>{": no complete word is the beginning of another complete word. An internal node therefore cannot also be a symbol leaf. The receiver must know this same codebook."}</Prose>

<Prose>{"Follow a full stream and see where the receiver can emit a symbol."}</Prose>

<Drawing id="E09" />

<Prose>{"After each leaf, decoding returns to the root. The boundaries in the displayed stream are obtained by this rule; separators are not transmitted. The constructed message "}<code>{"AAAABBCD"}</code>{" contains the source proportions exactly. Its stream "}<code>{"00001010110111"}</code>{" uses 14 bits for 8 symbols, or 1.75 bits per symbol. Fixed two-bit words would use 16 bits."}</Prose>

<Prose>{"The live investigation starts with the complete decoded result visible. Edit the message, then inspect any bit's path and output. A changed message changes the realized length; it does not change the source's expected length. The complete small codec shows the same operation:"}</Prose>

<Prose>{""}<strong>{"entropy_prefix.py"}</strong>{""}</Prose>

<Prose>{"Standard-library Python example; the output is retained from its earlier verified execution."}</Prose>

<Payload file="entropy_prefix.py" />

<Prose>{"Output:"}</Prose>

<Payload file="entropy_prefix.py.stdout.txt" output />

<Prose>{"Read the decoder from its codebook check to its loop. It accumulates an unfinished prefix, emits only when that prefix equals a complete word, and rejects an impossible continuation or an unfinished ending. The final "}<code>{"11"}</code>{" has reached an internal node and cannot yet identify C or D. The printed error is the actual failed operation's result."}</Prose>

<Prose>{"This fixed A–D implementation scans possible prefixes for clarity. For a larger alphabet, a tree decoder consumes each received bit once, O(B) visits for B stream bits plus output storage. The actual heap construction, sibling-exchange proof and tree decoder are taught in "}<a href={"/learn/path/full-curriculum/greedy-algorithms-exchange-arguments#6-merge-small-parts-into-a-code"}>{"Greedy Algorithms, section6"}</a>{". A Huffman tree is built in O(KlogK) heap operations for K symbols. Reuse that implementation when constructing a codebook; our small codec explains the information accounting rather than a general file format. Framing, metadata and a deterministic single-symbol alphabet need their own conventions."}</Prose>

<Prose>{"Compare code assignments using the same source probabilities."}</Prose>

<Drawing id="E10" />

<Prose>{"The matched leaf depths 1,2,3,3 give expected length .5×1+.25×2+.125×3+.125×3=1.75. This equals entropy because each probability is exactly 2 to a negative integer. Reassigning long words to common symbols raises the expectation. A specific message can still favour another assignment: a single D uses 3 bits under the matched code and 2 under a fixed-width code. Expected cost is not a guarantee for every realized string."}</Prose>

<Prose>{"Ideal information lengths are usually not integers."}</Prose>

<Drawing id="E11" />

<Prose>{"For probability .9 the ideal price is about .152 bits. A nontrivial two-symbol binary prefix code nevertheless needs at least one digit per individual symbol. For a finite alphabet, an optimal expected prefix-code length L* obeys"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally if needed" tabIndex={0}><MathBlock>{"H_2(P)\\le L^*<H_2(P)+1,"}</MathBlock></div>

<Prose>{"allowing the empty word for a deterministic single-outcome source. The upper construction rounds each positive outcome's ideal length upward: ℓ_x=⌈−log₂P(x)⌉. These lengths satisfy the prefix-capacity budget Σ2⁻ˡ≤1. Rounding adds less than one bit on average. This is a feasible bound construction; it need not be the optimal Huffman code. We will prove the lower bound after developing KL in section 5."}</Prose>

<H3>{"Deeper: share the rounding overhead across a block"}</H3>

<Prose>{"Group n independent source symbols and give the entire block one codeword."}</Prose>

<Drawing id="E12" />

<Prose>{"The ideal information of an independent block adds to nH(P). Applying the same prefix bound gives nH≤L_n<nH+1, hence H≤L_n/n<H+1/n. The less-than-one-bit overhead belongs to the entire block; dividing by n spreads it across the symbols. This can approach entropy without assigning a fraction of a physical digit to one isolated symbol."}</Prose>

<Prose>{""}<strong>{"entropy_blocks.py"}</strong>{""}</Prose>

<Prose>{"Standard-library Python example; the output is retained from its earlier verified execution."}</Prose>

<Payload file="entropy_blocks.py" />

<Prose>{"Output:"}</Prose>

<Payload file="entropy_blocks.py.stdout.txt" output />

<Prose>{"The programme enumerates each block, computes its exact rational probability, and finds the first integer length whose capacity 2⁻ˡ is no greater than that probability. It checks the Kraft budget using fractions. For this .9 source, the n=1 ceiling construction costs 1.3 bits per symbol, worse than the optimal one-bit binary code. At n=8 its rate is .550054 against entropy .468996; the stated upper bound is .593996. The bound does not require every particular sequence of block sizes to improve monotonically."}</Prose>

<Prose>{"Enumeration here takes 2ⁿ block visits, deliberately limited to n≤8 to inspect the theorem. It is not a scalable compressor. Dependent sequences use their joint/conditional probabilities; nH for independent draws cannot be substituted merely to simplify a calculation. Actual compression also includes framing, metadata, finite precision and any cost of learning an unknown source."}</Prose>

<H2>{"4. Let one distribution supply outcomes and another supply prices"}</H2>

<Prose>{"Keep the device's source P, but let a model Q believe the statuses occur in almost the opposite pattern."}</Prose>

<Drawing id="E13" />

<Prose>{"The category identities and order remain A,B,C,D. Source weights are P=(.5,.25,.125,.125); model probabilities are Q=(.125,.125,.25,.5). Each P width now pays the corresponding −log₂Q price. A becomes expensive because Q wrongly calls it rare. These prices 3,3,2,1 produce total .5×3+.25×3+.125×2+.125×1="}<strong>{"2.625 bits per symbol"}</strong>{"."}</Prose>

<Prose>{"This expected model price is "}<strong>{"cross-entropy"}</strong>{":"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally if needed" tabIndex={0}><MathBlock>{"H_b(P,Q)=\\mathbb E_{X\\sim P}[-\\log_bQ(X)]=-\\sum_xP(x)\\log_bQ(x)."}</MathBlock></div>

<Prose>{"The first argument supplies the expectation. Comparing probabilities in mismatched category orders would charge the wrong events. In our dyadic example the prices are actual prefix lengths; for a general Q they are ideal logarithmic costs, approached through suitable coding with overhead."}</Prose>

<Prose>{"Place that 2.625-bit cost beside P's own 1.75-bit entropy."}</Prose>

<Drawing id="E14" />

<Prose>{"The difference is .875 bits. We call it "}<strong>{"Kullback–Leibler divergence"}</strong>{", or KL:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally if needed" tabIndex={0}><MathBlock>{"D_{\\rm KL}(P\\Vert Q)=\\sum_xP(x)\\log_b\\frac{P(x)}{Q(x)}=H_b(P,Q)-H_b(P)."}</MathBlock></div>

<Prose>{"Each row compares two prices for the same outcome. A contributes .5log₂4=1; B contributes .25; C contributes−.125; D contributes−.25. Individual contributions can be negative: Q prices some outcomes more cheaply. The sum is nonnegative, as section 5 proves. The signed ruler shows those terms on opposite sides of zero; they are not another probability distribution or four mistake probabilities."}</Prose>

<Prose>{"The investigation lets you change the source weights and model weights separately. Matching Q to P removes every price difference. Swapping their roles changes which law supplies the frequencies. A unit switch rescales all three totals consistently. For a second finite example, this complete Bernoulli programme uses natural logarithms:"}</Prose>

<Prose>{""}<strong>{"entropy_bernoulli.py"}</strong>{""}</Prose>

<Prose>{"Standard-library Python example; the output is retained from its earlier verified execution."}</Prose>

<Payload file="entropy_bernoulli.py" />

<Prose>{"Output:"}</Prose>

<Payload file="entropy_bernoulli.py.stdout.txt" output />

<Prose>{"The printed .611,.765,.154 are entropy, cross-entropy and KL in nats for P(1)=.7,Q(1)=.9. Divide all three by ln 2 to obtain bits. No model changes merely because its information unit changes."}</Prose>

<Prose>{"Now consider an outcome that the model excludes."}</Prose>

<Drawing id="E15" />

<Prose>{"At P=(.5,.5,0,0),Q=(1,0,0,0), positive source mass on B has no model probability. Cross-entropy and KL are infinite. The picture leaves an unbounded cost rather than drawing a finite-height bar labelled infinity. If the source mass on B becomes zero, that requirement disappears. A small positive Q(B) gives a large finite price instead; zero and very small positive probability are different mathematical cases."}</Prose>

<NeuralTable caption={"4. Let one distribution supply outcomes and another supply prices"} headers={[<>{"One outcome"}</>, <>{"Entropy term"}</>, <>{"Cross-entropy and KL terms"}</>]} rows={[[<>{"P=0,Q≥0"}</>, <>{"0 by its limit"}</>, <>{"0; no draw under P charges this row"}</>], [<>{"P>0,Q=0"}</>, <>{"Finite for this fixed P"}</>, <>{"+∞"}</>], [<>{"P>0,Q>0"}</>, <>{"Ordinary formula"}</>, <>{"Ordinary formula; KL term may have either sign"}</>]]} />

<Prose>{"The "}<strong>{"support"}</strong>{" is the set of positive-probability outcomes. Finite KL on a finite alphabet requires P's support to lie inside Q's. A probability floor or smoothing distribution changes Q. That may be a sensible modeling choice, but it is not a finite report of the original infinite score. Normalize the new model and name the change."}</Prose>

<Prose>{"Inputs have their own contract."}</Prose>

<Drawing id="E16" />

<Prose>{"The browser accepts explicit weights, normalizes them and shows the active probabilities. A malformed draft leaves its last valid experiment in place. The Python helper below instead requires normalized distributions. It rejects malformed input rather than silently changing its meaning."}</Prose>

<Prose>{""}<strong>{"entropy_support.py"}</strong>{""}</Prose>

<Prose>{"Standard-library Python example; the output is retained from its earlier verified execution."}</Prose>

<Payload file="entropy_support.py" />

<Prose>{"Output:"}</Prose>

<Payload file="entropy_support.py.stdout.txt" output />

<Prose>{"The helper skips P=0 before taking logs, handles positive-P/zero-Q explicitly, and computes weighted sums. Its four outputs cover the status mismatch, a one-supported-outcome case, missing support and a certain matching law. Reading a browser's normalized weights as though a strict probability API had accepted them would mix two different contracts. An entered positive weight too small to represent numerically must not silently become an intended mathematical zero."}</Prose>

<H3>{"Use a library while keeping the same question"}</H3>

<Prose>{"SciPy's "}<code>{"entropy(pk,base=2)"}</code>{" computes entropy; with "}<code>{"qk"}</code>{" supplied it computes KL, not cross-entropy. It also normalizes non-unit sums. For the four-outcome vectors already defined, the calls are "}<code>{"h = entropy(p, base=2)"}</code>{" and "}<code>{"d = entropy(p, q, base=2)"}</code>{" after importing "}<code>{"entropy"}</code>{" from "}<code>{"scipy.stats"}</code>{". The direct helper above supplies a strict validation contract. The "}<a href={"#information-library-py"}>{"complete library programme in section6"}</a>{" validates inputs, compares the finite sums and then applies the same API to conditional rows once we have learned that operation."}</Prose>

<Prose>{"For the four statuses, these two routes give H=1.75,CE=2.625,KL=.875 bits. The code forms CE=H+KL only in this finite case; it never uses an undefined infinity-minus-infinity subtraction. Its missing-support case remains infinite. Passing weights[2,1] directly to SciPy gives entropy .918295834 bits after normalization, while the strict wrapper rejects them as probabilities. Choose the intended interface rather than treating those outcomes as a contradiction. The comparison was executed with NumPy 2.3.5 and SciPy 1.18.1; the displayed scalar formatting preserves those computed values."}</Prose>

<Prose>{"Work is linear in the number of categories for these finite sums. For huge or sparse alphabets, retain only occupied source entries and the required model lookups rather than allocating an enormous dense table. The core operation remains the same weighted price calculation."}</Prose>

<H2>{"5. Prove the bound and respect the direction"}</H2>

<Prose>{"The negative contributions in section 4 can reduce the total, but they cannot make it negative. Start with one ordinary logarithm inequality."}</Prose>

<Drawing id="E17" />

<Prose>{"For t>0, ln t≤t−1, with equality only at 1. The difference t−1−ln t has derivative 1−1/t: it decreases up to 1, increases afterwards and equals zero there. The straight tangent touches the log curve at 1 and stays above it."}</Prose>

<Prose>{"Apply that inequality to each supported source outcome."}</Prose>

<Drawing id="E18" />

<Prose>{"Let S be P's support and assume Q>0 on S; otherwise KL is already infinite. Substitute t=Q(x)/P(x), multiply by P(x), and sum over S. In nats,"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally if needed" tabIndex={0}><MathBlock>{"\\begin{aligned}\nD_{\\rm KL}(P\\Vert Q)\n&=-\\sum_{x\\in S}P(x)\\ln\\frac{Q(x)}{P(x)}\\\\\n&\\ge\\sum_{x\\in S}(P(x)-Q(x))\\\\\n&=1-Q(S)\\ge0.\n\\end{aligned}"}</MathBlock></div>

<Prose>{"Equality requires equality in every supported row, Q(x)=P(x), and no Q mass left outside S. Thus the whole finite distributions must agree. A positive log-base conversion preserves the inequality."}</Prose>

<Prose>{"Hold the source fixed and let the reporting model move."}</Prose>

<Drawing id="E19" />

<Prose>{"The expected logarithmic loss reaches its unique minimum at Q=P. This is the "}<strong>{"strictly proper scoring"}</strong>{" property: truthful probabilities minimize the population expectation over all possible reports. It does not promise that the truthful model wins on every finite sample, or that a restricted fitted family can represent P."}</Prose>

<Prose>{"The same gap proves the entropy maximum on a fixed alphabet."}</Prose>

<Drawing id="E20" />

<Prose>{"For uniform U on m labels, every event costs log_b m. Hence H(P,U)=log_b m and"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally if needed" tabIndex={0}><MathBlock>{"H_b(P)=\\log_bm-D_{\\rm KL}(P\\Vert U)\\le\\log_bm."}</MathBlock></div>

<Prose>{"Only uniform P removes the gap. The alphabet is fixed: changing the number or resolution of outcomes changes the question."}</Prose>

<H3>{"Deeper: return to the prefix-code lower bound"}</H3>

<Prose>{"A prefix code uses disjoint portions of a binary tree's capacity."}</Prose>

<Drawing id="E21" />

<Prose>{"At a common depth d, a word of length ℓ occupies 2^(d−ℓ) descendant slots. Distinct prefix-free words cannot overlap those slots. Dividing their total by 2ᵈ gives the "}<strong>{"Kraft inequality"}</strong>{", K=Σ2⁻ˡ≤1. Choose d at least as large as every finite word length."}</Prose>

<Prose>{"The matched code A=0, B=10, C=110, D=111 fills the entire capacity: K=1. To see unused capacity as well as mismatch, keep the same source P but choose A=0110, B=0111, C=010, D=00. No word prefixes another. Their lengths are (4,4,3,2), with capacities (1/16,1/16,1/8,1/4), summing to K=1/2. The four prefix intervals occupy the left half of the unit interval; the right half is unused. The source-weighted expected length is .5×4+.25×4+.125×3+.125×2=3.625 bits per symbol."}</Prose>

<Prose>{"Normalize those capacities to another distribution R(x)=2⁻ˡˣ/K. Its price is −log₂R(x)=ℓ_x+log₂K. Average using the actual source P, then subtract its entropy."}</Prose>

<Drawing id="E22" />

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally if needed" tabIndex={0}><MathBlock>{"L-H_2(P)=D_{\\rm KL}(P\\Vert R)-\\log_2K\\ge0."}</MathBlock></div>

<Prose>{"For the incomplete code, normalization gives R=(1/8,1/8,1/4,1/2), exactly the mismatched law already calculated in section4. Its KL cost is .875 bits. The unused-capacity cost is −log₂(1/2)=1 bit. Together they explain the full excess: L−H=3.625−1.75=1.875=.875+1 bits per symbol. For the matched complete code, R=P and K=1, so both pieces are zero."}</Prose>

<Prose>{"Both pieces are nonnegative: mismatching the normalized capacity distribution incurs KL, and unfilled capacity has −log₂K≥0. This proves why every such prefix code pays at least the entropy. Section 3's ceiling construction supplies the other bound. No theorem about an average implies that each short realized message uses exactly its source entropy."}</Prose>

<H3>{"Direction answers a different question"}</H3>

<Prose>{"Exchange the law supplying the expectation."}</Prose>

<Drawing id="E23" />

<Prose>{"KL(P∥Q) weights the log ratio by P; KL(Q∥P) weights the reversed log ratio by Q. If P=(1,0) and Q=(.5,.5), the forward direction is 1 bit because Q covers P's one possible outcome. The reverse is infinite because Q draws an outcome P excludes. Different supports alone do not tell us both directions; support inclusion has a direction."}</Prose>

<Prose>{""}<strong>{"Checkpoint."}</strong>{" Repair the claim “these supports differ, so both divergences are infinite.”"}</Prose>

<details><summary>Compare your reasoning</summary>

<Prose>{"Check which law supplies the expectation. For the displayed pair, every P-positive event has positive Q, giving KL(P∥Q)=log₂2=1. Q has positive mass on the second event while P has none, giving KL(Q∥P)=∞."}</Prose>

</details>

<Prose>{"In a restricted variational family, reverse-KL minimization can favour concentration in one region of a multimodal target. This depends on the target, family and optimizer; it does not invariably choose one mode. "}<a href={"/learn/path/full-curriculum/variational-inference?module=math-foundations"}>{"Variational Inference"}</a>{" contains the actual finite-family and Gaussian comparisons."}</Prose>

<Prose>{"Nor is KL an ordinary metric."}</Prose>

<Drawing id="E24" />

<Prose>{"For Bernoulli probabilities .1,.5,.9, in nats, D(.1∥.9)≈1.757780 while D(.1∥.5)+D(.5∥.9)≈.878890. The triangle inequality fails. Labels on the connecting arrows give computed directed costs; drawn segment lengths do not encode those costs. Relabelling categories preserves KL; moving mass between numerically near or far labels has no built-in transport distance. "}<a href={"/learn/path/full-curriculum/optimal-transport-wasserstein-distance-sinkhorn?module=math-foundations"}>{"Optimal Transport"}</a>{" supplies a geometry-aware comparison."}</Prose>

<Prose>{"A finite symmetric alternative is Jensen–Shannon divergence: M=(P+Q)/2, then average KL(P∥M) and KL(Q∥M). The mixture covers both supports, avoiding direct mismatch infinities. It still does not add geometric distances between labels. "}<a href={"/learn/path/full-curriculum/f-divergences-integral-probability-metrics?module=math-foundations"}>{"f-Divergences & Integral Probability Metrics"}</a>{" examines how the comparison depends on the intended question."}</Prose>

<H3>{"Deeper: when subtraction is undefined"}</H3>

<Prose>{"Finite probability mass can be spread over infinitely many outcomes in a way that has infinite entropy."}</Prose>

<Drawing id="E25" />

<Prose>{"Normalize p_k proportional to 1/[k(ln k)²], k≥2. The probability series converges by the integral test, while its entropy diverges like Σ1/(k ln k). Partial sums in a drawing only illustrate the different tails; they are not a numerical proof of convergence or divergence."}</Prose>

<Prose>{"For Q=P, every supported ratioP/Q is 1 and KL=0. Yet H(P,Q)−H(P) would be∞−∞, an undefined subtraction. The ratio definition is primary. On general spaces, KL uses the expected log density ratio when P is absolutely continuous with respect to Q—every Q-null measurable set is also P-null—and is infinite otherwise, with the required integrability conventions. Do not turn two divergent quantities into a claimed finite difference."}</Prose>

<H2>{"6. Predict with the information you have"}</H2>

<Prose>{"A classifier sees features X before predicting a label Y. Its report Q(y|x) is a distribution over labels for that context. Begin with one observed label."}</Prose>

<Drawing id="E26" />

<Prose>{"The "}<strong>{"one-hot target"}</strong>{" puts probability 1 on the observed correct class and 0 on the others. Multiplying model log prices by those target weights selects just one price, −log Q(y|x). A soft target instead distributes its weights across classes; its loss is the weighted sum of those same prices. Neither target vector is a second set of logits."}</Prose>

<Prose>{"To ask about expected prediction cost, we must also account for how frequently each context occurs."}</Prose>

<Drawing id="E27" />

<Prose>{"The initial joint table uses a fair context bit X. The label agrees with X with probability .9, while the model reports agreement probability .8. Select either row: divide its joint masses by its context mass. Price the resulting label probabilities using that row's model, then multiply its row cost by the context mass before adding the rows."}</Prose>

<Prose>{"With label-flip probability .1, each true row has entropy h₂(.1)≈.468996 bits. Each model row costs −.9log₂.8−.1log₂.2≈.521928 bits, an excess .052933. The label histogram is balanced, H(Y)=1 bit; knowing X improves the relevant baseline to H(Y|X). If Y always equalled X, that remaining uncertainty would be zero even though the marginal labels stayed balanced."}</Prose>

<Prose>{"For each positive-probability context, cross-entropy equals entropy plus KL. Weight those identities by P_X(x):"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally if needed" tabIndex={0}><MathBlock>{"\\mathbb E_{(X,Y)\\sim P}[-\\log Q(Y|X)]\n=H_P(Y|X)+\\mathbb E_{X\\sim P_X}D_{\\rm KL}(P(\\cdot|X)\\Vert Q(\\cdot|X))."}</MathBlock></div>

<Prose>{""}<strong>{"Conditional entropy"}</strong>{" is that context-weighted average remaining uncertainty. It is generally different from entropy of the overall label histogram. A context of probability zero contributes nothing to the expectation; its conditional distribution is not defined by dividing zero by zero."}</Prose>

<Prose>{""}<strong>{"entropy_conditional.py"}</strong>{""}</Prose>

<Prose>{"Standard-library Python example; the output is retained from its earlier verified execution."}</Prose>

<Payload file="entropy_conditional.py" />

<Prose>{"Output:"}</Prose>

<Payload file="entropy_conditional.py.stdout.txt" output />

<Prose>{"This complete standard-library programme visits all four joint outcomes and directly weights their losses. Its initial symmetric rows have the same cost. Changing only their frequency therefore leaves their correctly weighted average unchanged. That is a useful null result, but it can conceal an incorrect routine that averages the row costs equally."}</Prose>

<Prose>{"Switch the investigation to "}<strong>{"unequal row costs"}</strong>{". Context masses are now(.75,.25), with P(Y=1|X=0)=.1 and P(Y=1|X=1)=.5. Let the model report those truthful conditionals. The joint rows are(.675,.075) and(.125,.125). Their entropies are .468995594 and 1 bit, so the correct average is"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally if needed" tabIndex={0}><MathBlock>{".75(.468995594)+.25(1)=.601746695\\text{ bits}."}</MathBlock></div>

<Prose>{"An incorrect uniform average gives(.468995594+1)/2=.734497797. The drawing shows both row costs and both context multipliers before joining the contributions. Change the second context mass to .5: the two averages then agree. At mass 0, the answer is just .468995594 and the absent context is explicitly unavailable. The complete "}<code>{"information_library.py"}</code>{" below performs both the direct joint sum and SciPy row entropies with "}<code>{"axis=1"}</code>{", followed by the actual context weights. The axis chooses what is summed; it does not supply the correct context frequencies by itself."}</Prose>

<Prose>{"Conditioning helps on average, but one observed context can make the remaining uncertainty larger."}</Prose>

<Drawing id="E28" />

<Prose>{"Let independent fair bits A and B produce Y=A OR B. Before seeing A, Y=1 has probability .75 and H(Y)≈.811278 bits. If A=0, Y=B is a fair bit with entropy 1; if A=1, Y is certain with entropy 0. The contexts occur equally often, giving average .5. The increase in the first slice does not contradict the average reduction. "}<a href={"/learn/path/full-curriculum/mutual-information-information-bottleneck?module=math-foundations"}>{"Mutual Information & Information Bottleneck"}</a>{" develops that reduction as a measure of dependence."}</Prose>

<Prose>{"The same multiplication rule explains the entropy "}<strong>{"chain rule"}</strong>{". Start from P(x,y)=P(x)P(y|x), take negative logs and average over the joint law:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally if needed" tabIndex={0}><MathBlock>{"H(X,Y)=H(X)+H(Y|X)."}</MathBlock></div>

<Prose>{"Identifying the pair costs the information in X plus the average remaining information in Y once X is known. We have not assumed X and Y independent."}</Prose>

<Prose>{"For observed data, connect these prices to the probability assigned to the whole record. The first trace below uses two labelled rows, with inputs x₁,x₂ held fixed and observed labels y₁=0,y₂=1. A model with fixed shared parameters θ supplies one correct-label probability for each row."}</Prose>

<Prose>{"The second trace is a different experiment: an ordered sequence A,B,A. Its next-token distribution uses the prefix already observed, so its conditioning inputs are start, A and A,B. Keep those past-context factors distinct from the separate fixed-input rows."}</Prose>

<Drawing id="E29" />

<Prose>{"In the first trace, Qθ(0|x₁)=.8 and Qθ(1|x₂)=.25. Under the conditionally independent row model, their joint conditional likelihood is .8×.25=.2. Their negative log prices add to −ln(.2)=1.609437912 nats, with mean .804718956 nats per observed row."}</Prose>

<Prose>{"If observations are modeled as conditionally independent given their inputs and shared parameters θ, their conditional likelihood is ∏ᵢQ_θ(yᵢ|xᵢ). Negative log turns that product into a sum. Dividing by fixed positive n changes the scale but not the minimizing parameter:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally if needed" tabIndex={0}><MathBlock>{"\\operatorname*{argmax}_{\\theta}\\prod_{i=1}^{n}Q_\\theta(y_i|x_i)\n=\\operatorname*{argmin}_{\\theta}\\frac1n\\sum_{i=1}^{n}-\\log Q_\\theta(y_i|x_i)."}</MathBlock></div>

<Prose>{"This is the connection to "}<a href={"/learn/path/full-curriculum/maximum-likelihood-map-estimation?module=math-foundations"}>{"Maximum Likelihood"}</a>{". In the separately labelled sequence trace, use Q(A|start)=.5, Q(B|A)=.25 and Q(A|A,B)=.8. The probability of that ordered sequence is .5×.25×.8=.1, and its negative log likelihood is −ln(.1)=2.302585093 nats. These are past-context factors, not three independent marginal token probabilities. An autoregressive sequence handles dependence with conditional factors Q(y_t|earlier context); tokens need not be independent. Omitting dependence without modeling it gives the objective a different statistical meaning. A lucky finite observed sample may have lower average loss than population conditional entropy; the entropy-plus-KL inequality concerns the full expected risk."}</Prose>

<Prose>{"The full library comparison below now joins the two calculations. Its first part compares the four-status H, CE and KL from section 4. Its "}<code>{"conditional"}</code>{" array has two rows, each summing to one; "}<code>{"axis=1"}</code>{" computes one entropy for each row. The context vector then weights those two values. Multiplying "}<code>{"context[:, None]"}</code>{" by the row matrix reconstructs the joint table, so a direct joint-weighted sum checks the same operation through a different arrangement. The three context settings expose the unequal-cost case, the equal-context null and the zero-context limit."}</Prose>

<Prose>{"<a id=\"information-library-py\"></a>"}</Prose>

<Prose>{""}<strong>{"information_library.py"}</strong>{""}</Prose>

<Prose>{"Python 3.12.14, NumPy 2.3.5 and SciPy 1.18.1. The numerical calculation was executed once; scalar display formatting was subsequently simplified without changing the computed values."}</Prose>

<Payload file="information_library.py" />

<Prose>{"Output:"}</Prose>

<Payload file="information_library.py.stdout.txt" output />

<Prose>{"The validator rejects weights before an automatic API normalization can change their meaning. Boolean selection keeps zero source probabilities out of logarithms. The direct KL uses separate logs; it does not first divide two tiny probabilities. This finite calculation takes linear work in the number of joint cells; array broadcasting changes the arrangement of the arithmetic, not the probability law."}</Prose>

<H2>{"7. Compute and interpret log loss"}</H2>

<Prose>{"A neural classifier often supplies one real-valued score per class. These "}<strong>{"logits"}</strong>{" must become probabilities, but computing enormous exponentials is unnecessary."}</Prose>

<Drawing id="E30" />

<Prose>{"For z=(1000,998,996), subtract the largest score 1000 from every entry, producing(0,−2,−4). Exponentiate those shifted scores and add them. The sum is 1+e⁻²+e⁻⁴; its logarithm is about .142932. Each log probability is its shifted score minus that common log sum. The last class therefore has log probability−4.142932 and loss 4.142932 nats."}</Prose>

<Prose>{"Softmax is Q_j=e^(z_j)/Σ_ke^(z_k). A common added constant multiplies numerator and denominator by the same factor and cancels. With m=max_jz_j and s=Σ_je^(z_j−m), compute"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally if needed" tabIndex={0}><MathBlock>{"\\log Q_j=(z_j-m)-\\ln s,\\qquad \\ell(z,y)=(m-z_y)+\\ln s."}</MathBlock></div>

<Prose>{"Keep these grouped subtractions. Computing a huge common log normalizer and subtracting it afterwards can lose precision. The investigation preserves the class identities through logits, exponentials, normalization and target selection. Change a score, add a common shift or change the target; the last operation chooses a price rather than changing the model."}</Prose>

<Prose>{"Even a stable probability can underflow when converted out of log space."}</Prose>

<Drawing id="E31" />

<Prose>{"For logits(0,−1000,−2000), the last probability rounds to zero in floating arithmetic. Its log probability can still be represented as−2000, and its loss is 2000 nats. Taking log of the separately rounded zero would incorrectly turn this finite-logit result into infinity."}</Prose>

<Prose>{""}<strong>{"entropy_logits.py"}</strong>{""}</Prose>

<Prose>{"Standard-library Python example; the output is retained from its earlier verified execution."}</Prose>

<Payload file="entropy_logits.py" />

<Prose>{"Output:"}</Prose>

<Payload file="entropy_logits.py.stdout.txt" output />

<Prose>{"The first two score vectors differ by a common 1000 and have the same printed log probabilities. The last vector follows the log path directly. Work is O(C) per row for C classes. Stable evaluation does not repair NaN inputs, unrepresentable differences between finite extremes, or a truly excluded class. Those are distinct from ordinary small positive probabilities whose logs remain representable."}</Prose>

<Prose>{"The framework interface must describe the same arrays."}</Prose>

<Drawing id="E32" />

<Prose>{"For N examples and C classes, PyTorch "}<code>{"cross_entropy"}</code>{" receives raw logits of shape(N,C). Class-index targets have shape(N,) and dtype"}<code>{"torch.long"}</code>{". Soft targets are valid probability rows of shape(N,C) with floating dtype. The library does not completely validate their normalization and nonnegativity, so the caller must supply a meaningful target. Applying softmax first feeds probabilities into an API that expects logits and changes the resulting model loss."}</Prose>

<Prose>{""}<strong>{"entropy_torch.py"}</strong>{""}</Prose>

<Prose>{"Retained tested PyTorch 2.14 CPU example with float64 logits. Install PyTorch using its official platform instructions."}</Prose>

<Payload file="entropy_torch.py" />

<Prose>{"Output:"}</Prose>

<Payload file="entropy_torch.py.stdout.txt" output />

<Prose>{"This preserved programme was executed with PyTorch 2.14 CPU. It uses float64, no class weights, no ignored labels and no smoothing. Thus its mean is the ordinary mean of its two class-index losses. The first row changes from hard-target loss .142932 to soft-target loss .942932 because the target now assigns weight to other class prices. The second row keeps its 2000-nat cost. "}<code>{"reduction='none'"}</code>{" exposes each example before averaging."}</Prose>

<Prose>{"Weights, ignored labels and smoothing alter the scoring or reduction contract; inspect the documented denominator before transferring a hand calculation. For a binary one-logit model the stable interface is "}<code>{"binary_cross_entropy_with_logits"}</code>{". Names that contain “cross entropy” do not guarantee interchangeable input conventions. Install PyTorch using its "}<a href={"https://pytorch.org/get-started/locally/"}>{"official platform instructions"}</a>{"; the optional SciPy programme needs NumPy and SciPy. Python files include their own imports and data except the explicitly supplied CSV beside the observed-data programme."}</Prose>

<H3>{"Confidence changes what accuracy cannot see"}</H3>

<Prose>{"Give two models exactly the same ten binary test cases."}</Prose>

<Drawing id="E33" />

<Prose>{"Model A assigns correct-label probability .6 on cases 1–8 and .4 on 9–10. Model B gives .99 on 1–8 and .01 on 9–10. With threshold .5 and no ties, both get 8/10 correct. Their log prices differ sharply: B saves a little on eight already-correct cases and pays about 4.605 nats on each confidently wrong one."}</Prose>

<Prose>{"The mean losses are −[8ln.6+2ln.4]/10≈.591919 nats for A and −[8ln.99+2ln.01]/10≈.929074 for B. The drawing uses actual heights and numeric prices, including small positive costs; it does not impose a misleading minimum visible bar height."}</Prose>

<Prose>{""}<strong>{"entropy_evaluation.py"}</strong>{""}</Prose>

<Prose>{"Standard-library Python example; the output is retained from its earlier verified execution."}</Prose>

<Payload file="entropy_evaluation.py" />

<Prose>{"Output:"}</Prose>

<Payload file="entropy_evaluation.py.stdout.txt" output />

<Prose>{"The programme stores all ten probabilities and uses the same denominator for both models. Its threshold-based accuracy is appropriate for this binary, no-ties fixture. In a multiclass problem compare the predicted argmax with the correct label; correct-label probability need not exceed .5 to be the largest class probability."}</Prose>

<Prose>{"Turn the average log price back into a probability-like scale."}</Prose>

<Drawing id="E34" />

<Prose>{""}<strong>{"Perplexity"}</strong>{" is b raised to the average base-b log loss. For natural logs,"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally if needed" tabIndex={0}><MathBlock>{"\\operatorname{PP}=\\exp\\left(-\\frac1n\\sum_i\\ln Q(y_i|x_i)\\right)\n=\\left(\\prod_iQ(y_i|x_i)\\right)^{-1/n}."}</MathBlock></div>

<Prose>{"It is the reciprocal geometric mean probability assigned to the actual outcomes. A uniform m-way model has perplexity m. A general value 20 is an equivalent uniform cost, not a claim that every context presents exactly 20 candidates. The programme gives A about 1.807453 and B about 2.532164."}</Prose>

<Prose>{"For language models, compare like tokenization, text, context rules and averaging. A different number of tokens changes the unit “per token.” Aggregate total negative log likelihood and total scored-token count for a token-weighted mean; averaging sentence perplexities does not perform that operation. A zero-probability observed event gives infinite perplexity."}</Prose>

<H3>{"Score a small observed dataset"}</H3>

<Prose>{"We can use actual field records to inspect context-aware prediction costs. The Palmer penguin data describe penguins observed in a study of body size, sex and foraging-related ecological differences. The collectors' scientific question was not our classification exercise; this small example asks only how island information affects species prediction on a declared year split."}</Prose>

<Drawing id="E35" />

<Prose>{"The supplied "}<code>{"penguins.csv"}</code>{" contains 344 rows. We use species, island and year, which are complete in these records. Missing body measurements do not justify dropping rows for this question. Use 2007–2008 for training,224 rows, and 2009 for the held-out comparison,120 rows. The fixed three species are Adelie, Chinstrap and Gentoo; islands are Biscoe, Dream and Torgersen."}</Prose>

<Prose><a href="/learn-assets/entropy-information/penguins.csv" download="penguins.csv">Download penguins.csv</a> beside the programme file.</Prose>

<Prose>{"Training species counts are(100,44,80). A global model adds one count to each species and divides by 227. A context model adds one to every species within each island and divides by that island's training count plus 3. Its training counts are Biscoe(28,0,80), Dream(36,44,0), Torgersen(36,0,0). Additive smoothing is an explicit model change that gives all three species positive predicted probability; its strength is fixed at 1 before using the test labels."}</Prose>

<Prose>{"Select the predicted probability for each held-out record, then sum its loss."}</Prose>

<Drawing id="E36" />

<Prose>{"The test island counts are Biscoe(16,0,44), Dream(20,24,0), Torgersen(16,0,0):60,44and16 rows. The global model's mean loss is 1.518341224 bits, accuracy .433333333 and perplexity 2.864614937. The island model's mean loss is .805893591 bits, accuracy .7 and perplexity 1.748228292. These are results for these records and this specified split, not universal rankings of methods or a random census of Antarctic penguins."}</Prose>

<Prose>{""}<strong>{"penguins_log_loss.py"}</strong>{""}</Prose>

<Prose>{"Executed with Python 3.12.14, NumPy 2.3.5 and SciPy 1.18.1. Save the supplied penguins.csv beside this file before running it."}</Prose>

<Payload file="penguins_log_loss.py" />

<Prose>{"Output:"}</Prose>

<Payload file="penguins_log_loss.py.stdout.txt" output />

<Prose>{"Place the supplied CSV beside the programme and run "}<code>{"python penguins_log_loss.py"}</code>{". Python's "}<code>{"csv"}</code>{" reader and "}<code>{"Counter"}</code>{" expose the training counts; no hidden fitting API is needed for this categorical model. NumPy/SciPy calculate the same finite entropy and KL quantities per held-out island. The measured run used Python 3.12.14, NumPy 2.3.5 and SciPy 1.18.1."}</Prose>

<Prose>{"The final check forms a "}<strong>{"descriptive empirical distribution"}</strong>{" from the test labels. It does not use that distribution to fit either prediction model. Its context-weighted entropy is .782798115 bits, the island model's cross-entropy .805893591, and their KL gap .023095476. Each island's entropy uses its test histogram, then the average uses actual test weights 60/120,44/120,16/120. An unweighted average of island costs would answer a different sampling question."}</Prose>

<Prose>{"The programme fits counts in O(number of training records) and scores each held-out row with one lookup. Dense storage is the small island-by-species table. For a future island absent from training, a prediction rule would need an explicit fallback; the provided split has every test island represented in training. Changing smoothing after looking at test scores turns that set into development information. Field-study selection, pairs and other dependence also limit what this one year split can establish about another population. Keep the collectors' sampling question separate from the didactic prediction task."}</Prose>

<Prose>{"The offline CSV is the CC 0 Palmer penguins simplified dataset maintained by "}<a href={"https://allisonhorst.github.io/palmerpenguins/"}>{"Allison Horst and colleagues"}</a>{". The underlying study is "}<a href={"https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0090081"}>{"Gorman, Williams and Fraser2014"}</a>{". Its retrieved bytes and selected fields are recorded with the supplied file; no network request occurs when running the programme."}</Prose>

<Prose>{"Lower held-out log loss means a higher geometric mean probability on the same observed outcomes. It does not alone guarantee better accuracy, subgroup calibration, fairness, robustness after shift or decisions under asymmetric costs. A log-loss anomaly score is not automatically a p-value or a diagnosis of a cause."}</Prose>

<H3>{"Deeper: price differences accumulate as evidence"}</H3>

<Prose>{"Follow the actual signed model-price differences along a sequence."}</Prose>

<Drawing id="E37" />

<Prose>{"For specified models P and Q, the log likelihood ratio is Σ_tlog[P(event_t|past)/Q(event_t|past)]. In an independent finite source P, its expectation after n draws is nKL(P∥Q). The expected price gap therefore accumulates between those models. A realized sequence can include negative increments or have a negative total; an expectation is not a guarantee of a monotone trace. Dependence must be represented in the conditional factors rather than ignored."}</Prose>

<H2>{"8. Change continuous units without changing the experiment"}</H2>

<Prose>{"For a numerical measurement, a density describes probability per unit coordinate. It is not the probability assigned to one exact value."}</Prose>

<Drawing id="E38" />

<Prose>{"Take X uniform over[0,.25]metres. Its density is 4per metre, and the middle-half interval has width .125metres, giving probability 4×.125=.5. A density can exceed 1 while every event probability remains valid. Under a continuous density law, a singleton has zero probability even where the density is positive."}</Prose>

<Prose>{"For a density f relative to the chosen Lebesgue coordinate measure, "}<strong>{"differential entropy"}</strong>{" is h(f)=−∫f(x)log f(x)dx when that integral is defined. Lower-case h distinguishes it from discrete H. It can be negative, infinite or undefined; the finite-alphabet bounds do not transfer unchanged. A uniform interval of width w has h₂=log₂w, so the present coordinate convention gives−2. This is not “negative digits to transmit an exact real number.”"}</Prose>

<Prose>{"In centimetres, the same physical interval is[0,25], with density .04per centimetre. Let Y=aX,a>0. Since dy=a dx, preservation of interval probability requires f_Y(y)=f_X(y/a)/a. Substituting into the entropy integral gives h(Y)=h(X)+log a under the needed existence and finiteness conditions. At a=100, h₂ changes from−2 to 4.643856 while the same physical event still has probability .5. The live investigation keeps both the coordinate unit and density unit beside their rulers."}</Prose>

<Prose>{"Now change what is recorded, rather than just its numerical unit."}</Prose>

<Drawing id="E39" />

<Prose>{"Split the physical interval into four equal bins. Each bin label has probability .25, so its discrete entropy is 2 bits. For N equal aligned bins, Δ=w/N and"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally if needed" tabIndex={0}><MathBlock>{"H_2(\\text{bin})=\\log_2N=h_2(X)+\\log_2(1/\\Delta)."}</MathBlock></div>

<Prose>{"This equality is exact for the displayed uniform case. Doubling the number of bins adds one bit of bin-label entropy. Merely converting metres to centimetres scales both w and Δ and does not change the bins or their probabilities. A related fine-binning approximation can hold for suitably regular densities, but not universally for atoms, irregular bins or divergent integrals."}</Prose>

<Prose>{"KL behaves differently from the two density entropies taken separately."}</Prose>

<Drawing id="E40" />

<Prose>{"Compare P and Q using densities f and g relative to the same coordinate measure:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally if needed" tabIndex={0}><MathBlock>{"D_{\\rm KL}(P\\Vert Q)=\\int f(x)\\ln\\frac{f(x)}{g(x)}\\,dx."}</MathBlock></div>

<Prose>{"Under the same invertible smooth coordinate change, both density heights acquire the same inverse Jacobian factor. Those factors cancel in the ratio, and the probability element f(x)dx is preserved. Hence KL stays invariant. Differential entropy and differential cross-entropy separately change. For a general invertible smooth map, h gains the expected log absolute Jacobian determinant when the change-of-variable and integrability hypotheses hold."}</Prose>

<Prose>{""}<strong>{"entropy_continuous.py"}</strong>{""}</Prose>

<Prose>{"Standard-library Python example; the output is retained from its earlier verified execution."}</Prose>

<Payload file="entropy_continuous.py" />

<Prose>{"Output:"}</Prose>

<Payload file="entropy_continuous.py.stdout.txt" output />

<Prose>{"The complete programme keeps four physical bins and reports H(bin)=2 bits in both units. It also compares P=Normal(0,1²) with Q=Normal(1,2²). KL is .443147 nats before and after multiplying both means and standard deviations by 100. Scaling only one distribution would be a different comparison."}</Prose>

<H3>{"Deeper: derive Normal KL and compare measures honestly"}</H3>

<Prose>{"Expand the two nondegenerate Normal log densities. Under P, E[(X−μ_P)²]=σ_P² and E[(X−μ_Q)²]=σ_P²+(μ_P−μ_Q)². Their normalizing constants give ln(σ_Q/σ_P); the averaged quadratic terms give"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally if needed" tabIndex={0}><MathBlock>{"D_{\\rm KL}(P\\Vert Q)=\\ln\\frac{\\sigma_Q}{\\sigma_P}-\\frac12+\n\\frac{\\sigma_P^2+(\\mu_P-\\mu_Q)^2}{2\\sigma_Q^2}."}</MathBlock></div>

<Prose>{"Both standard deviations must be strictly positive. A degenerate point mass is not handled by substituting zero into this formula. Nor does one isolated zero of a density establish a support mismatch: the measure question is whether a Q-null measurable set has positive P probability."}</Prose>

<Prose>{"Compare a finite empirical dataset with a smooth continuous model."}</Prose>

<Drawing id="E41" />

<Prose>{"The empirical distribution puts positive mass on its observed points; together that finite set has empirical probability 1. A continuous density model gives the same finite set probability 0. Thus KL from the empirical point-mass measure to that continuous law is infinite. Empirical average negative log density can still be a useful likelihood objective, but it is not a finite KL for those two measures."}</Prose>

<Prose>{"A common fixed binning or smoothing changes the model and can supply a meaningful discrete comparison. For an underlying continuous density P with suitable finite entropy and cross-entropy, its population expected log density still obeys the valid entropy-plus-KL identity. "}<a href={"/learn/path/full-curriculum/measure-theory-probability-spaces?module=math-foundations"}>{"Measure Theory"}</a>{" explains densities relative to a reference and mixed or singular laws."}</Prose>

<H2>{"9. Use KL to certify a maximum-entropy model"}</H2>

<Prose>{"Suppose a count can be 0,1or2. We know its mean but do not know all three probabilities."}</Prose>

<Drawing id="E42" />

<Prose>{"A point in the triangle represents(q0,q1,q2), three nonnegative coordinates summing to one. The vertex labelled 0 is the certain count 0 law; the other vertices are certain 1 and certain 2. The interior distributes probability among all three outcomes. The triangle is a map of probability laws, not the physical location of a count."}</Prose>

<Prose>{"First hold the mean constraint fixed at E[X]=10/7. This first view lets you move among feasible probability laws; it does not yet introduce an optimizer or an entropy-gap display."}</Prose>

<Drawing id="E43" />

<Prose>{"The admissible laws lie on a line through the triangle. Let t=q2. Solving q0+q1+q2=1 and q1+2q2=10/7 gives q=(t−3/7,10/7−2t,t). Nonnegativity restricts t to[3/7,5/7]. The constraint leaves a real choice; it does not already determine the distribution."}</Prose>

<Prose>{""}<strong>{"Maximum entropy"}</strong>{" chooses the feasible distribution with the largest Shannon entropy on this specified alphabet. This is a modeling rule relative to stated outcomes and constraints, not proof of the physical process. Try p*=(1,2,4)/7. Its masses sum to one and its mean is(2+8)/7=10/7."}</Prose>

<Prose>{"We can now compare a feasible q with the candidate p*. The entropy difference H(p*)−H(q) is their vertical separation on an entropy plot; a plot alone does not establish its sign for every feasible law. The linked view below adds the candidate, both entropies and their difference. Selecting p* moves q onto that candidate."}</Prose>

<Prose>{"Compare the same feasible point in probability space and on the entropy curve."}</Prose>

<Drawing id="E44" />

<Prose>{"The live parameter t means q2, not Euclidean distance along the line. The linked views locate one law and its entropy. At t=3/7, q=(0,4/7,3/7), entropy .985228 bits. At t=5/7, q=(2/7,0,5/7), entropy .863121. The interior candidate p* has 1.378783. A sampled plot suggests a maximum, but a proof must cover every feasible law."}</Prose>

<Prose>{"Here p*(x)=2ˣ/7, so log₂p*(x)=x−log₂7. Every feasible q has the same expected x,10/7. Its cross-entropy against p* is therefore fixed at log₂7−10/7. Hence"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally if needed" tabIndex={0}><MathBlock>{"D_{\\rm KL}(q\\Vert p^*)=\\log_27-\\frac{10}{7}-H_2(q)\n=H_2(p^*)-H_2(q)\\ge0."}</MathBlock></div>

<Prose>{"This certifies the "}<strong>{"global maximum"}</strong>{" and identifies its gap for every feasible q. Equality occurs only at p*. We did not merely find a stationary point or inspect a dense grid."}</Prose>

<Prose>{"The general connection comes from "}<a href={"/learn/path/full-curriculum/exponential-families-sufficient-statistics?module=math-foundations"}>{"Exponential Families"}</a>{". With equal base weights on a finite support, p_η(x)=exp(ηT(x)−A(η)). If a positive member has the desired mean E[T]=m, then E_q log p_η=ηm−A(η) is fixed over every feasible q. The same KL identity certifies that member's entropy maximum. Our three-count example uses T(x)=x and η=ln 2."}</Prose>

<H3>{"Deeper: feasible boundaries and reference weights"}</H3>

<Prose>{"The earlier two views share the current feasible law. We now add a mean editor, after explaining how a changed constraint changes the feasible set and candidate. Change the required mean and watch that same line move in every linked view."}</Prose>

<Drawing id="E45" />

<Prose>{"For any mean m∈[0,2], q=(1−m+t,m−2t,t) with max(0,m−1)≤t≤m/2. The investigation preserves your relative position along this feasible t interval when m changes: if a=max(0,m−1), b=m/2 and τ∈[0,1], set t=a+τ(b−a). This is a coordinate fraction, not distance along the drawn line. All linked displays update to the same m and q. The numeric interface supports exact endpoint means0,2 and interior means from10⁻⁶ to2−10⁻⁶; unsupported or invalid drafts leave the last valid experiment visible with an explanation. A mathematical feasible mean outside that numerical interior is not thereby impossible. Reset in any view restores m=10/7 and the first endpoint τ=0. The means 0and2 leave only their corresponding vertices. Interior means have positive maximizers; endpoint point masses require η→−∞ or+∞, not finite η. On a nonempty finite simplex slice, continuity and compactness give an attained maximum, while strict concavity gives uniqueness. This does not establish existence of a finite optimizer for every unbounded continuous moment problem."}</Prose>

<Prose>{"The base weights in an exponential-family model matter as well."}</Prose>

<Drawing id="E46" />

<Prose>{"For p_η(x)=h(x)exp(ηT(x)−A(η)) with positive nonuniform h, log p includes log h. With a fixed moment m,"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally if needed" tabIndex={0}><MathBlock>{"D_{\\rm KL}(q\\Vert p_\\eta)=A-\\eta m-[H(q)+\\mathbb E_q\\log h]."}</MathBlock></div>

<Prose>{"Thus the certified objective is H(q)+E_qlog h. If r=h/Σh, that objective equals−KL(q∥r)+logΣh; it is entropy relative to those base weights, generally not ordinary Shannon entropy."}</Prose>

<Prose>{"For count outcomes 0,1,2 and h=(1,2,1), η=0 gives p=(.25,.5,.25), mean 1 and entropy 1.5 bits. The uniform distribution has the same mean and greater ordinary entropy log₂3≈1.584963. But the base-relative objective is 2 for p and log₂3+1/3≈1.918296 for uniform. The programme's final two lines expose the ordinary-entropy counterexample, while the drawn base slots explain the extra weighting."}</Prose>

<Prose>{""}<strong>{"entropy_maximum.py"}</strong>{""}</Prose>

<Prose>{"Standard-library Python example; the output is retained from its earlier verified execution."}</Prose>

<Payload file="entropy_maximum.py" />

<Prose>{"Output:"}</Prose>

<Payload file="entropy_maximum.py.stdout.txt" output />

<Prose>{"The programme visits the two endpoints and the proposed optimum and verifies the same identity numerically. A small cleanup handles floating subtraction near an exact zero in this fixed fixture. Such cleanup is not a replacement for feasibility checks in an arbitrary solver: normalization and the specified mean must both hold."}</Prose>

<Prose>{"A moment constraint fixes the expected log price of the matching exponential-family candidate; nonnegative KL turns that fact into a certificate. This mathematical conclusion does not require an additional slogan about making the “fewest assumptions.”"}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"10. Practise with new distributions and decisions"}</H2>

<Prose>{"Try the prompts before opening a hint or solution. Name the alphabet, weighting distribution, units and required support or sampling assumptions. For implementation repairs, first write a small function and a changed input that would expose the wrong operation."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Information and code length are different quantities"}</H3>

<Prose>{"A source has five labels with probabilities (1/2,1/8,1/8,1/8,1/8). Calculate its entropy and construct a prefix code attaining it. Compare fixed-width coding and the actual message AEEE. Explain why a 2.5-bit message average would not contradict the 2-bit source entropy."}</Prose>

<Prose>{"Also express the source entropy in nats and compare the surprise of E with its contribution to entropy."}</Prose>

<details><summary>Optional hint</summary>

<Prose>{"Use the five masses 1/2,1/8,1/8,1/8,1/8. A code may finish at one leaf while the other branch contains a complete two-level subtree."}</Prose>

</details>

<details><summary>Worked solution and reasoning</summary>

<Prose>{"The entropy is (1/2)×1+4×(1/8)×3=2 bits per symbol. One optimal prefix code is A=0, B=100, C=101, D=110, E=111, with average 2. Fixed-width coding needs three bits for five labels. Message AEEE uses 1+3+3+3=10 bits, or 2.5 per symbol, exceeding the source entropy on that message. Entropy predicts a source-weighted average, not a per-message guarantee."}</Prose>

<Prose>{"Two bits equal 2 ln 2 nats. E has 3 bits of surprise but contributes only(1/8)×3=3/8 bit to the source average. A category's price and the weighted contribution are different."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Compute a changed mismatch and diagnose the signed terms"}</H3>

<Prose>{"For P=(3/4,1/4) and Q=(1/2,1/2), compute entropy, cross-entropy, both signed KL contributions and the reverse KL. Explain why taking the absolute value of each contribution would define a different quantity."}</Prose>

<details><summary>Optional hint</summary>

<Prose>{"The uniform model charges one bit per outcome. Keep P=(3/4,1/4) as the weighting distribution."}</Prose>

</details>

<details><summary>Worked solution and reasoning</summary>

<Prose>{"Compute H₂(P) as −(3/4)log₂(3/4) − (1/4)log₂(1/4), obtaining about 0.811278 bits. H₂(P,Q)=1, so KL≈0.188722 bits. The terms are (3/4)log₂(3/2)≈0.438722 and (1/4)log₂(1/2)=−0.25. The negative term says the rarer outcome is priced more cheaply by Q; it is not a negative divergence on its own. Reversing gives about 0.207519 bits, so the direction matters."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Decode a changed stream and reject an ambiguous code"}</H3>

<Prose>{"Decode 110010111 using the lesson's matched code. Then inspect A=0, B=00, C=1. Give a concrete ambiguous bitstream and explain why “always choose the shortest matching word” is not a repair."}</Prose>

<Prose>{"Independently implement a prefix-tree decoder. It must reject a word that prefixes another in either insertion order, reject an unfinished stream, and decode 101100. Use a tree so each received bit is visited once."}</Prose>

<details><summary>Optional hint</summary>

<Prose>{"Start again at the root each time 0,10,110 or 111 is complete. For the proposed code, ask whether 00 could mean more than one message."}</Prose>

</details>

<details><summary>Worked solution and reasoning</summary>

<Prose>{"Using A=0, B=10, C=110, D=111, the stream 110010111 decodes C A B D: 110|0|10|111. The alternative A=0, B=00, C=1 is not prefix-free and is not uniquely decodable: 00 could mean B or AA. A decoder that simply chooses the shortest match loses B. A correct changed implementation must reject that code and also reject a final unfinished 11 under the original code."}</Prose>

<Prose>{"One valid solution keeps symbol leaves distinct from internal nodes. Codebook validation is performed once; the bit loop then traverses existing edges."}</Prose>

<CodeBlock language={"python"}>{"def make_tree(code):\n    root = {}\n    for symbol, word in code.items():\n        if not word or set(word) - {\"0\", \"1\"}:\n            raise ValueError(\"Expected a nonempty binary word.\")\n        node = root\n        for bit in word:\n            if \"symbol\" in node:\n                raise ValueError(\"An earlier word prefixes this word.\")\n            node = node.setdefault(bit, {})\n        if node:\n            raise ValueError(\"Duplicate word or prefix collision.\")\n        node[\"symbol\"] = symbol\n    return root\n\n\ndef decode_tree(bits, root):\n    node, output = root, []\n    for bit in bits:\n        if bit not in {\"0\", \"1\"} or bit not in node:\n            raise ValueError(\"Invalid bit or impossible continuation.\")\n        node = node[bit]\n        if \"symbol\" in node:\n            output.append(node[\"symbol\"])\n            node = root\n    if node is not root:\n        raise ValueError(\"Unfinished codeword.\")\n    return \"\".join(output)"}</CodeBlock>

<Prose>{"For A=0,B=10,C=110,D=111,101100 becomes BCA. An empty stream becomes empty text;11 is unfinished. Both insertion orders of A=0,B=01 must fail. The changed message DAB encodes 111010 and decodes back. Construction uses one visit per codebook bit; decoding is O(B) for B stream bits, plus the emitted output. The early codebook check and end-of-stream check solve different failures."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Repair a support and clipping claim"}</H3>

<Prose>{"For P=(0.8,0.2,0) and Q=(1,0,0), classify both KL directions. A colleague replaces log 0 with log 10⁻⁶ and reports “the exact original KL.” Explain the error and give one valid explicitly smoothed model."}</Prose>

<Prose>{"Write a finite H/CE/KL helper for already normalized vectors. Repair code that takes every log before checking P=0. Check P=(.5,.5,0),Q=(.25,.75,0), then Q=(1,0,0); reject P=(.5,.5,.1)."}</Prose>

<details><summary>Optional hint</summary>

<Prose>{"Check the support inclusion separately in each direction. A probability floor must come with a defined normalized model."}</Prose>

</details>

<details><summary>Worked solution and reasoning</summary>

<Prose>{"For P=(0.8,0.2,0) and Q=(1,0,0), KL(P∥Q)=∞ because the second outcome occurs under P but is excluded by Q. KL(Q∥P)=−log₂0.8≈0.321928 bits. Reporting a finite clipped loss does not establish finite KL for the original Q. One explicit replacement is Q_ε=(1−2ε,ε,ε), 0<ε<1/2; it is a new normalized distribution, and its score should be identified as such. No contribution is charged for P's zero third coordinate."}</Prose>

<Prose>{"Here normalization is a requirement, not a request to rescale input."}</Prose>

<CodeBlock language={"python"}>{"import math\n\n\ndef probability_vector(values):\n    values = tuple(values)\n    if (not values or any(not math.isfinite(x) or x < 0 for x in values)\n            or not math.isclose(math.fsum(values), 1, rel_tol=0, abs_tol=1e-12)):\n        raise ValueError(\"Expected normalized finite probabilities.\")\n    return values\n\n\ndef information_costs(p, q):\n    p, q = probability_vector(p), probability_vector(q)\n    if len(p) != len(q):\n        raise ValueError(\"Outcome alphabets must agree.\")\n    active = [(a, b) for a, b in zip(p, q) if a > 0]\n    h = -math.fsum(a * math.log2(a) for a, _ in active)\n    if any(b == 0 for _, b in active):\n        return h, math.inf, math.inf\n    ce = -math.fsum(a * math.log2(b) for a, b in active)\n    kl = math.fsum(a * (math.log2(a) - math.log2(b)) for a, b in active)\n    return h, ce, kl"}</CodeBlock>

<Prose>{"The first pair gives(1,1.207518749639422,.207518749639422) bits. The zero-zero third row never reaches a logarithm. The missing-support pair returns(1,infinity,infinity). The malformed P sums to 1.1 and is rejected. Matching certain laws(1,0,0) give all zeros, not NaN. Separate logarithms avoid overflow/underflow in a direct P/Q ratio. Adding epsilon would change Q and needs a separately named, normalized model."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Use unequal context frequencies"}</H3>

<Prose>{"P(X=0)=0.75, P(Y=1|X=0)=0.2 and P(Y=1|X=1)=0.8. Calculate H(Y), H(Y|X), and the ideal expected losses with and without X. Explain which probabilities would need changing if the context frequencies shifted."}</Prose>

<Prose>{"Now use joint rows(.675,.075),(.125,.125). Implement conditional entropy from the joint table, and repair an equal-row-average bug. Repeat after changing only context masses to(.5,.5) and(1,0), preserving conditional Y1 probabilities(.1,.5)."}</Prose>

<details><summary>Optional hint</summary>

<Prose>{"Average the two conditional entropies with 0.75 and 0.25. First calculate the marginal probability of Y=1."}</Prose>

</details>

<details><summary>Worked solution and reasoning</summary>

<Prose>{"P(Y=1)=0.75×0.2+0.25×0.8=0.35, so H(Y)=h₂(0.35)≈0.934068 bits. Both contexts have entropy h₂(0.2)=h₂(0.8)≈0.721928, hence H(Y|X)=0.721928. A model that uses the true conditional achieves that expected loss. A model using the true marginal in both contexts has expected loss 0.934068. The context's average reduction is about 0.212140 bits. Weighting the contexts equally would generally be wrong, even though this symmetric pair happens to have equal conditional entropies."}</Prose>

<Prose>{"The old .2/.8 row pair has identical entropies, so its equal average accidentally agrees. The new rows have costs .4689955935892812 and 1."}</Prose>

<CodeBlock language={"python"}>{"import math\n\n\ndef conditional_entropy(joint):\n    if not joint or not joint[0] or any(len(row) != len(joint[0]) for row in joint):\n        raise ValueError(\"Expected a nonempty rectangular table.\")\n    cells = [x for row in joint for x in row]\n    if (any(not math.isfinite(x) or x < 0 for x in cells)\n            or not math.isclose(math.fsum(cells), 1, rel_tol=0, abs_tol=1e-12)):\n        raise ValueError(\"Expected a normalized joint law.\")\n    result = 0.0\n    for row in joint:\n        mass = math.fsum(row)\n        if mass == 0:\n            continue\n        row_entropy = -math.fsum((x / mass) * math.log2(x / mass)\n                                 for x in row if x > 0)\n        result += mass * row_entropy\n    return result"}</CodeBlock>

<Prose>{"The correct result is .75×.4689955935892812+.25×1=.6017466951919609 bits. Uniform averaging incorrectly gives .7344977967946407. At context masses(.5,.5), the joint becomes(.45,.05),(.25,.25), so the correct answer really is .7344977967946407. At(1,0), use(.9,.1),(0,0), giving .4689955935892812. A zero row has no conditional distribution; skipping its zero contribution avoids dividing by zero. Reconstructing each original cell as context mass times its conditional value checks the normalization step."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Evaluate confidence with a consistent denominator"}</H3>

<Prose>{"On six shared binary test cases, C's correct-label probabilities are (0.9,0.9,0.9,0.9,0.4,0.4). D's are (0.6,0.6,0.6,0.6,0.6,0.01). Calculate accuracy and mean log loss. Which wins each measure, and what additional claim would this small test not justify?"}</Prose>

<Prose>{"A separate language example has one scored token with total loss 0 nats and nine scored tokens with total loss 9 nats. Find the token-weighted mean and perplexity; explain why averaging the two sentence perplexities differs."}</Prose>

<details><summary>Optional hint</summary>

<Prose>{"Use all six correct-label probabilities. Model C has four probabilities above 0.5, while D has five."}</Prose>

</details>

<details><summary>Worked solution and reasoning</summary>

<Prose>{"C has accuracy 4/6 and mean loss −[4ln0.9+2ln0.4]/6≈0.375671 nats. D has accuracy 5/6 and mean loss −[5ln0.6+ln0.01]/6≈1.193216 nats. D wins accuracy but loses log loss because its lone error is extremely confident. The difference does not certify fairness, calibration or performance after distribution shift. A defensible comparison states the same six cases, binary threshold/no ties, arithmetic mean over cases and the decision objective."}</Prose>

<Prose>{"The total loss is 9 over 10 tokens, so the mean is .9 nats and perplexity exp(.9). Sentence perplexities are 1 and e. Their mean(1+e)/2 weights sentences equally and applies a nonlinear transformation before aggregation. The intended token-weighted score must pool total loss and count first. Different tokenization would change the unit and require a new comparison."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Compute an extreme but finite log loss"}</H3>

<Prose>{"Scores are (800,0,−800), and the last class occurs. Calculate the stable loss and explain why adding −700 to every score changes nothing. Give both an ordinary-score acceptance case and an underflow case for an implementation test."}</Prose>

<Prose>{"Write stable_loss(logits,target) without taking log of a separately computed softmax. Check(0,−1000,−2000), target 2 and a common+1000 shift. Repair wrong class-axis and unnormalized-soft-target use separately."}</Prose>

<details><summary>Optional hint</summary>

<Prose>{"Subtract the maximum first. The normalizer's log is approximately zero when the remaining exponentials underflow."}</Prose>

</details>

<details><summary>Worked solution and reasoning</summary>

<Prose>{"For scores (800,0,−800), shifted scores are (0,−800,−1600). The observed last-class loss is 1600+ln(1+e⁻⁸⁰⁰+e⁻¹⁶⁰⁰), numerically 1600 nats in the displayed precision. Adding −700 to every score leaves it unchanged. Taking log of a separately underflowed zero probability gives ∞ and destroys a finite-logit result. At ordinary scores (1,0,−1), direct and stable calculations should agree within tolerance; that is a useful independent implementation check."}</Prose>

<Prose>{"Compute the loss from shifted logits directly."}</Prose>

<CodeBlock language={"python"}>{"import math\n\n\ndef stable_loss(logits, target):\n    if not logits or any(not math.isfinite(x) for x in logits):\n        raise ValueError(\"Expected finite logits.\")\n    if not isinstance(target, int) or not 0 <= target < len(logits):\n        raise ValueError(\"Invalid class index.\")\n    maximum = max(logits)\n    shifted = [x - maximum for x in logits]\n    log_sum = math.log(math.fsum(math.exp(x) for x in shifted))\n    return log_sum - shifted[target]"}</CodeBlock>

<Prose>{"Both extreme cases give 2000 nats. The ordinary vector(1000,998,996),target 2 gives 4.142931628499899. The result avoids log of a rounded zero. This compact helper assumes the shifted differences are representable; arbitrary opposing floating extremes need a separately defined numerical range. For a batch(N,C), normalize across classes, not examples. A soft-target row must be finite, nonnegative and sum to one; passing(2,1,0) as though already normalized changes the score. A library that silently accepts it does not validate the intended statistical meaning."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Preserve the physical experiment when changing units"}</H3>

<Prose>{"X is uniform on [0,2] metres. Express its differential entropy in metres and millimetres; quantize it into four equal bins and compare bin-label entropy. Then explain why finite negative log density on observed samples does not establish finite KL from their empirical point-mass distribution."}</Prose>

<details><summary>Optional hint</summary>

<Prose>{"Uniform width w has differential entropy log₂w. An aligned bin label has entropy log₂N."}</Prose>

</details>

<details><summary>Worked solution and reasoning</summary>

<Prose>{"For a uniform interval of width 2 metres, h₂=1. In millimetres the numerical width is 2000, so h₂=log₂2000≈10.965784; the change is log₂1000. Four equal bins have H=2 bits in both units. Their widths are 0.5 m and 500 mm, so h−log₂Δ=2 either way. The probability of the first physical metre is 1/2 in both coordinates. For a continuous Q, the empirical finite set remains Q-null despite positive density at observed points; empirical-to-Q measure KL is ∞, while average negative log density can be finite."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Certify a new constrained maximum"}</H3>

<Prose>{"On outcomes 0,1,2, replace the required mean with 1/2. Derive the feasible slice, find the positive exponential-family candidate and prove it maximizes entropy. State what changes if the base weights become (1,2,1)."}</Prose>

<Prose>{"Independently implement the feasible three-count slice for a general mean. Use mean 6/5 and both exact endpoints; reject t=.1 and mean 2.1. Explain why normalizing an arbitrary vector is insufficient."}</Prose>

<details><summary>Optional hint</summary>

<Prose>{"For mean 1/2, q=(1/2+t,1/2−2t,t), 0≤t≤1/4. Put candidate probabilities proportional to 1,r,r² and solve their mean equation."}</Prose>

</details>

<details><summary>Worked solution and reasoning</summary>

<Prose>{"The equation (r+2r²)/(1+r+r²)=1/2 gives 3r²+r−1=0, with positive root r=(√13−1)/6. Normalize (1,r,r²) to get approximately (0.616204,0.267592,0.116204). Its mean is 1/2. The candidate's log probability is x ln r−ln(1+r+r²); every feasible q has the same expected log price. Thus KL(q∥p*)=H(p*)−H(q)≥0 and equality requires q=p*. Checking only the derivative or only a sampled plot would not by itself supply this global certificate. A base h=(1,2,1) would add E_q log h to the certified objective."}</Prose>

<Prose>{"Solve both linear equalities before choosing t. Exact fractions make boundary checks transparent."}</Prose>

<CodeBlock language={"python"}>{"from fractions import Fraction\n\n\ndef feasible_three_count(mean, t):\n    mean, t = Fraction(str(mean)), Fraction(str(t))\n    if not 0 <= mean <= 2:\n        raise ValueError(\"Mean outside the count alphabet.\")\n    lower, upper = max(Fraction(0), mean - 1), mean / 2\n    if not lower <= t <= upper:\n        raise ValueError(\"Infeasible probability parameter.\")\n    return 1 - mean + t, mean - 2 * t, t"}</CodeBlock>

<Prose>{"For mean 6/5, the interval is[1/5,3/5]. Its endpoints are(0,4/5,1/5) and(2/5,0,3/5); both sum to one and have mean 6/5. Use strings or Fraction values for intended rational/decimal input. At mean 0 or 2 the interval collapses to one vertex. At 10/7 it reproduces[3/7,5/7]. Normalization alone enforces only the sum; it can change the mean. Feasibility is still not optimality: the earlier KL certificate establishes the entropy comparison."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"10. Distinguish independent choices from a copied bit"}</H3>

<Prose>{"Let X be a fair bit. In one experiment Y is an independent fair bit; in another Y=X. Find the probability and surprise of the pair(1,1), using the correct conditional factor in each experiment. Is adding the two marginal surprises always correct?"}</Prose>

<details><summary>Optional hint</summary>

<Prose>{"The first factor P(X=1) is .5 in both experiments; the second factor is P(Y=1|X=1)."}</Prose>

</details>

<details><summary>Worked solution and reasoning</summary>

<Prose>{"Independence gives .5×.5=.25 and 2 bits. Copying gives .5×1=.5 and 1 bit. Marginal Y is fair in both cases, but its conditional surprise after observing X changes from 1 to 0. Adding marginal surprises implicitly assumes the independent factorization. The logarithm product identity is unchanged; the probability supplied to it must match the process."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"11. Repair a block-length construction"}</H3>

<Prose>{"A routine floors the ideal information of each block and divides lengths by n before checking prefix feasibility. For Bernoulli P(1)=1/4 and n=2, repair the construction, find the expected per-symbol length, and expose the floor bug. Use an exact dyadic probability as an additional boundary check."}</Prose>

<details><summary>Optional hint</summary>

<Prose>{"The four block probabilities are(9/16,3/16,3/16,1/16). Integer lengths belong to whole codewords. The capacity sum isΣ2⁻ˡ."}</Prose>

</details>

<details><summary>Worked solution and reasoning</summary>

<Prose>{"Ceiling lengths are(1,3,3,4), with Kraft sum 13/16. Their source-weighted expected block length is 31/16 bits, so the per-symbol rate is 31/32. Floored lengths(0,2,2,4) have Kraft sum 25/16>1 and cannot form a prefix code. Divide the expected block cost by 2 after constructing integer lengths."}</Prose>

<CodeBlock language={"python"}>{"from fractions import Fraction\n\n\ndef ceiling_information_length(probability):\n    probability = Fraction(probability)\n    if not 0 < probability <= 1:\n        raise ValueError(\"Expected a positive probability at most one.\")\n    length = 0\n    while Fraction(1, 2**length) > probability:\n        length += 1\n    return length"}</CodeBlock>

<Prose>{"The strict comparison means probability 1/8 returns exactly 3, not 4. A fair one-bit source gives one-bit lengths. This simple exact loop makes the rounding boundary inspectable; it is not a claim of scalable block compression. The original programme's enumeration cost grows exponentially with block length."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"12. Decide which KL argument is valid"}</H3>

<Prose>{"Prove the equality condition in the finite KL bound when P has zero entries. Then assess three claims: “uniform entropy is largest even when the alphabet changes”; “a symmetric divergence must use distance between labels”; and “if P=Q has infinite entropy, KL is infinity minus infinity.” Give a correction for each."}</Prose>

<details><summary>Optional hint</summary>

<Prose>{"Track both the rowwise log inequality and any Q mass outside P's support. The ratio definition is more fundamental than subtracting separately divergent quantities."}</Prose>

</details>

<details><summary>Worked solution and reasoning</summary>

<Prose>{"Equality in every positive-P row requires Q=P there, and equality in 1−Q(S)≥0 requires no Q mass outside S. Hence the entire distributions agree. Uniform maximizes entropy on a fixed finite alphabet; log m changes when m changes. Symmetry concerns exchanging arguments, not geometric distances between category labels: Jensen–Shannon is a counterexample to that inference. For P=Q, the supported log ratio is zero and KL=0 even if both separate entropies diverge. The tail law proportional to 1/[k(ln k)²] shows that finite total mass can coexist with infinite entropy. Neither an undefined subtraction nor a finite truncation proves the general ratio result."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"13. Repair the library boundary"}</H3>

<Prose>{"An array has shape(2,3), with rows(1000,998,996) and(0,−1000,−2000). The observed classes are 0and2. A routine applies softmax across the two examples, passes those results into cross_entropy, and uses target array(2,1,0) as a soft row. Identify each change needed. Explain which mean formula would have to be reconsidered if class weights or ignored labels were added."}</Prose>

<details><summary>Optional hint</summary>

<Prose>{"Classes occupy the second axis. The loss expects raw logits. A valid probability target is different from an arbitrary weight vector."}</Prose>

</details>

<details><summary>Worked solution and reasoning</summary>

<Prose>{"Supply the original logits directly with class indices of shape(2,) and integer dtype. The correct class-index losses are approximately(.142932,2000), giving arithmetic mean 1000.071466 for this unweighted, unignored fixture. To inspect log probabilities separately use log_softmax with class dimension 1. The malformed soft row sums 3; if it was meant as explicit weights, deliberately normalize to(2/3,1/3,0) and state that target, otherwise reject it. Do not normalize examples against one another. Class weights and ignored labels change the loss/reduction contract; derive the denominator from the chosen API rather than retaining the ordinary two-row mean blindly."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"14. Trace an observed prediction without refitting on test labels"}</H3>

<Prose>{"Using the supplied penguin counts, find the island model's probability for an Adelie record on Biscoe, trained on 2007–2008 with additive count 1. Explain why its test-island loss uses 60 records and the final mean uses 120. Reconstruct the conditional entropy-plus-KL total. Then consider changing the smoothing strength to .5 after choosing it by the 2009score: what role does that score now play?"}</Prose>

<details><summary>Optional hint</summary>

<Prose>{"Biscoe training counts are(28,0,80). Its held-out counts are(16,0,44). The other held-out island sizes are 44and16."}</Prose>

</details>

<details><summary>Worked solution and reasoning</summary>

<Prose>{"The Biscoe model is(29,1,81)/111, so Adelie probability is 29/111 and its bit loss is−log₂(29/111). The mean within Biscoe averages its 16 Adelie and 44 Gentoo rows over 60. That mean then receives weight 60/120, while Dream and Torgersen receive 44/120and16/120. With the declared fitted model, the final descriptive empirical H,CE,KL are(.782798115,.805893591,.023095476) bits. These quantities use the same 120 records and sum correctly. A model fitted to the test histograms would answer a different question."}</Prose>

<Prose>{"After selecting alpha using 2009scores, that year is development information; it is no longer an untouched comparison for that selection procedure. Refitting with alpha .5would change the Biscoe probabilities to(28.5,.5,80.5)/109.5. Its new score should be computed and identified as a new selected model, not called the previous held-out result. The sampling design still does not establish a random Antarctic population or a causal effect of island."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H2>{"What you should now be able to do"}</H2>

<Prose>{"Choose a fresh four-outcome law and explain each weighted entropy contribution, then trace a new message through a prefix tree. Compare the cost under a different prediction law, diagnose a missing-support state and prove why the total KL cannot be negative. These are the core checks behind practice 1–4 and 10–12."}</Prose>

<Prose>{"For conditional predictions, reconstruct joint probabilities from context masses and normalized rows, and show why unequal row costs need the actual context weights. Compute a stable log loss from raw logits and explain the library's class axis and reduction. Use the same observations and denominator when comparing log scores or perplexity. Practice 5–7 and 13–14 ask you to repair those operations independently."}</Prose>

<Prose>{"For the deeper branch, keep a physical event fixed while changing measurement units, distinguish an atomic empirical law from a density model, and use a feasible moment slice plus a KL certificate to establish a global entropy maximum. Practice 8–9 test those distinctions. If a step is unclear, return to its drawing and trace one row, branch or probability point before repeating the equation."}</Prose></section>

<section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning" data-lesson-resource-list=""><H2>{"Further learning"}</H2>

<ul><li>{""}<a href={"https://sites.stat.columbia.edu/liam/teaching/neurostat-spr11/papers/EM/Cover%26Thomas-Ch2.pdf"}>{"Cover and Thomas, chapter2"}</a>{" offers another sustained written explanation. Start with §§2.1–2.3 for entropy, conditioning and divergence, then §2.6 for inequalities. Its binary-question example connects directly to the four symbols here."}</li><li>{""}<a href={"https://ocw.mit.edu/courses/6-02-introduction-to-eecs-ii-digital-communication-systems-fall-2012/resources/lecture-1-overview-information-and-entropy/"}>{"MIT6.02: Overview, information and entropy"}</a>{" supplies George Verghese's lecture and companion material. Use it for a slower spoken route through surprise and coding. The companion slides were assessed for fit; the entire recording has not been reviewed for this lesson."}</li><li>{""}<a href={"https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/2243edffb30f57181ed97dcb77691580_MIT6_441S16_chapter_1.pdf"}>{"MIT6.441, chapter1"}</a>{" is a more compressed graduate treatment. Read §§1.1–1.3 after the examples to connect finite sums, general measures and differential entropy."}</li><li>{""}<a href={"/learn/path/full-curriculum/greedy-algorithms-exchange-arguments#6-merge-small-parts-into-a-code"}>{"The earlier Greedy Algorithms lesson"}</a>{" develops the actual efficient Huffman heap/tree construction and exchange argument. It complements the fixed codebook here; a ceiling-length bound is not a Huffman implementation."}</li></ul></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references" data-lesson-resource-list=""><H2>{"Technical references"}</H2>

<ul><li>{""}<a href={"https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/67d8e68cd8fda55366e3f9f0a9465c17_MIT6_441S16_chapter_6.pdf"}>{"MIT6.441, chapter6"}</a>{": prefix versus uniquely decodable codes, Kraft capacity and the entropy coding bound."}</li><li>{""}<a href={"https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf"}>{"Shannon, A Mathematical Theory of Communication"}</a>{": the original source/communication formulation; §6 develops weighted grouping of choices. It measures probabilistic alternatives rather than the semantic importance of a message."}</li><li>{""}<a href={"https://cs229.stanford.edu/notes-spring2019/MaxEnt.pdf"}>{"Stanford CS229, Maximum Entropy and Exponential Families"}</a>{": the finite interior exponential form. Keep nonnegative probabilities and boundary means explicit; an affine constraint alone does not make every parameter feasible."}</li><li>{""}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.entropy.html"}>{"SciPy entropy"}</a>{": base, axis and automatic normalization, including the distinction between entropy and KL. The new programmes above identify their actual SciPy 1.18.1 execution environment."}</li><li>{""}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.CrossEntropyLoss.html"}>{"PyTorch CrossEntropyLoss"}</a>{": raw logits, class indices and probability targets, shapes and reduction. "}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.BCEWithLogitsLoss.html"}>{"BCEWithLogitsLoss"}</a>{" is the corresponding stable single-logit binary interface, with a different input contract."}</li><li>{""}<a href={"https://allisonhorst.github.io/palmerpenguins/"}>{"Palmerpenguins documentation"}</a>{" identifies the CC 0 dataset maintained by Allison Horst, Alison Hill and Kristen Gorman, with original collection by Gorman and PalmerStationLTER. "}<a href={"https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0090081"}>{"Gorman, Williams and Fraser's ecological study"}</a>{" explains the sampling and scientific question. The local CSV is pinned to the supplied 344 records; our year-split prediction exercise answers a different question from that study."}</li></ul></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H2>{"Next: what does an observation tell us about another variable?"}</H2>

<Prose>{"Conditional entropy already compares uncertainty before and after a context is known. "}<a href={"/learn/path/full-curriculum/mutual-information-information-bottleneck?module=math-foundations"}>{"Mutual Information & Information Bottleneck"}</a>{" turns that reduction into a measure of dependence, then asks which details a representation can discard while retaining information relevant to a task. Keep the joint table, its normalized conditional rows and their actual weights in view: they are the objects behind the next formulas."}</Prose></section></div></EntropyStudy>;
}
