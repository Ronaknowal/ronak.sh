// Complete staged accepted manuscript. Root owns publication.
import { Prose,H2,H3,CodeBlock } from "../../components/content/index.js";
import { MathBlock,Math as InlineMath } from "../../components/content/Math.jsx";
import RemoteCodeBlock from "../../components/content/RemoteCodeBlock.jsx";
import { NeuralTable } from "../../components/lesson-labs/NeuralLessonElements.jsx";
import { NaiveBayesReadingFlowFigure,NaiveBayesReadingFlowAssets } from "../../components/lesson-labs/NaiveBayesReadingFlow.jsx";
export function NaiveBayesReadingFlowLesson(){return <div className="lesson-flow naive-bayes-reading-flow">
<Prose opening="summary">{"An incoming message says “free meeting.” Does “free” make it junk, or does “meeting” make it ordinary work? We will compare how each kind of mail would produce these words, combine that evidence with the prevalence of each class, and turn the comparison into a probability and then an action. Along the way, we will find cases where a confident number is the wrong number."}</Prose>

<Prose opening="route">{""}<strong>{"First pass."}</strong>{" Read sections 1–7 for the observation, the calculation and its failure cases; follow the sparse workflow and real email experiment in section 8; use section 9 to check probabilities and choose actions. The explicitly marked deeper branches derive estimators and gradients, merge streaming state, and integrate parameter uncertainty. Return to those branches and section 10 after one successful prediction. Section 11 supplies independent tasks with separate hints and explained solutions. Code is optional for the first reading."}</Prose>

<Prose opening="prerequisites">{""}<strong>{"Prerequisites."}</strong>{" Recall the actual "}<a href={"/learn/path/full-curriculum/probability-distributions-bayes-theorem#2-reverse-the-question-with-bayes"}>{"Bayes reversal"}</a>{", "}<a href={"/learn/path/full-curriculum/probability-distributions-bayes-theorem#3-check-whether-evidence-is-new"}>{"new versus repeated evidence"}</a>{", "}<a href={"/learn/path/full-curriculum/probability-distributions-bayes-theorem#5-summarize-without-losing-the-distribution"}>{"mean and variance"}</a>{" and "}<a href={"/learn/path/full-curriculum/probability-distributions-bayes-theorem#6-read-area-and-cumulative-probability"}>{"probability area versus density"}</a>{". We refresh their local use here. The published "}<a href={"/learn/path/full-curriculum/support-vector-machines-svm#1-a-score-a-boundary-and-a-real-distance"}>{"SVM score and boundary"}</a>{" is a useful comparison, but the first calculation needs no SVM knowledge."}</Prose>

<Prose opening="exploration">{""}<strong>{"Using the programs."}</strong>{" Reading and live investigations require no Python. For execution, use a virtual environment with NumPy, SciPy and scikit-learn. The saved executions use Python 3.12.14, NumPy 2.3.5, SciPy 1.18.1 and scikit-learn 1.9.1. Install with "}<code>{"python -m pip install numpy scipy scikit-learn"}</code>{". Each displayed complete file has Copy and Download controls. Save required companions together; the file index below names the exact sets. The browser's drawings compute their declared models; they do not execute arbitrary Python."}</Prose>

<H2>{"1. One message, one prediction"}</H2>

<Prose>{"What must a classifier know at the moment mail arrives? A "}<strong>{"row"}</strong>{" is one message; a "}<strong>{"feature"}</strong>{" is a property we can measure then; a "}<strong>{"label"}</strong>{" says whether the message is ham (ordinary mail, class 0) or spam (junk, class 1). Training rows include labels. An incoming row has measurable features and an unknown label. A feature saying “the user deleted this tomorrow” belongs to a later time and cannot be used for this arrival-time prediction."}</Prose>

<Prose>{"Look at how repeated words become indexed columns before they enter a model."}</Prose>

<NaiveBayesReadingFlowFigure job="D01" phase="live" />

<Prose>{"“Free free money” contains three token positions, but its five-word count vector is "}<code>{"[2,1,0,0,0]"}</code>{" in the fixed order "}<code>{"[free,money,win,meeting,agenda]"}</code>{". Both free tokens point to the same free column. A presence representation instead stores "}<code>{"[1,1,0,0,0]"}</code>{": it answers “did it occur?” rather than “how many?” An ordered token sequence keeps an additional fact—where each word appeared. Counts discard order; a learner cannot recover “money free free” versus “free money free” from the same count vector."}</Prose>

<Prose>{"We will keep a word's identity cue attached to that word when columns move. Free uses violet, money cyan, win coral, meeting blue and agenda gold; literal word labels remain authoritative. A white outline marks the current operation without changing a word's identity. Class marks are a labelled blue circle for ham and a labelled amber triangle for spam. Counts and probabilities have numeric labels; a brighter word is never a larger probability."}</Prose>

<Prose>{"How does a rule turn those features into a class? One route directly learns a score separating classes. Another learns what each class tends to generate."}</Prose>

<NaiveBayesReadingFlowFigure job="D02" phase="live" />

<Prose>{"The feature plane places each message at its two shown count coordinates. A discriminative boundary compares a score with zero. The other side of the drawing starts with ham or spam, follows each class's fitted word distribution, and asks which route better explains this query. We call that a "}<strong>{"generative classifier"}</strong>{" because it models "}<code>{"P(x | class)"}</code>{" together with class frequencies. Bayes' rule reverses these quantities to "}<code>{"P(class | x)"}</code>{". Logistic regression learns a conditional probability directly; SVM learns a margin score under a different objective. Similar-looking straight boundaries can come from different fitting problems."}</Prose>

<Prose>{"Keep the records that teach the distributions separate from the message being classified."}</Prose>

<NaiveBayesReadingFlowFigure job="D03" phase="live" />

<Prose>{"Labeled training rows enter count accumulators; the resulting parameter table then receives a new unlabeled query. The query does not enter a fitting arrow. A "}<strong>{"prior baseline"}</strong>{" skips word evidence and always reports the training class fractions. Under equal error costs its class decision chooses the commoner label. Later we compare whole fitted workflows with that baseline using held-out rows. The four roles have different jobs:"}</Prose>

<NeuralTable caption={"1. One message, one prediction"} headers={[<>{"Role"}</>,<>{"What it may teach"}</>,<>{"What it must keep separate"}</>]} rows={[[<>{"Training"}</>,<>{"Vocabulary, model parameters and fitted preprocessing"}</>,<>{"Future validation/test features and labels"}</>],[<>{"Validation or internal folds"}</>,<>{"Representation, smoothing and model choice"}</>,<>{"Final test decisions"}</>],[<>{"Calibration, if used"}</>,<>{"A probability mapping from unseen base predictions"}</>,<>{"Base fitting on that row's target"}</>],[<>{"Final test"}</>,<>{"The chosen workflow's evaluation"}</>,<>{"Any further tuning presented as untouched evaluation"}</>]]} />

<Prose>{"Choose the split unit for the intended task. Copies of an email should stay together; sender/campaign groups or chronological splits can be needed when those dependencies matter. Our tiny corpora first teach arithmetic. Section 8 then supplies an openly licensed historical email dataset with a declared group split and its limitations."}</Prose>

<Prose>{"What makes this classifier “naive”? Draw its actual conditional variables."}</Prose>

<NaiveBayesReadingFlowFigure job="D04" phase="live" />

<Prose>{"For binary presence features, the class node fans out to the free-present, money-present and win-present variables. Given a class, the fitted model multiplies their separate likelihoods. The graph declares a factorization of a probability law; its arrows are not a discovery that spam causally produces a word. In the token model introduced later, the children will be token positions, rather than independent count columns. Naming the random variables correctly matters."}</Prose>

<Prose>{"The assumption is "}<strong>{"joint conditional independence"}</strong>{":"}</Prose>

<div className="neural-equation"><MathBlock>{"P(x_1,\\ldots,x_d\\mid c)=\\prod_{j=1}^{d}P(x_j\\mid c)."}</MathBlock></div>

<Prose>{"The conditioning says “within this class.” It does not say the features are independent in the pooled mailbox. Pairwise independence alone also cannot justify a product over every feature. Here is a concrete class mixture."}</Prose>

<NaiveBayesReadingFlowFigure job="D05" phase="live" />

<Prose>{"Let two equally common classes have feature-presence rates "}<code>{".2,.2"}</code>{" and "}<code>{".8,.8"}</code>{". Within each class the two features are independent. The joint pooled probability of both present is "}<code>{".5×.2² + .5×.8² = .34"}</code>{". Each pooled marginal is "}<code>{".5"}</code>{", whose product is "}<code>{".25"}</code>{". Learning the class already explains part of their association; pooling the classes hides that information and creates dependence."}</Prose>

<Prose>{"The saving is a smaller table. An unrestricted law over "}<code>{"d"}</code>{" binary features needs "}<code>{"2^d−1"}</code>{" free probabilities per class, because it describes every binary pattern and their total must be one. A factored Bernoulli law needs "}<code>{"d"}</code>{" presence probabilities per class. This binary-event comparison explains the tradeoff: simpler estimation buys a restriction on which laws the model can express. It does not establish that a real corpus satisfies that restriction."}</Prose>

<H2>{"2. Turn likelihoods into class evidence"}</H2>

<Prose>{"We can now ask how much each class explains one observation. Before learning the tables in section 3, suppose two of three training messages are spam, and a fitted token table gives free probability "}<code>{"4/11"}</code>{" in spam and "}<code>{"1/7"}</code>{" in ham. The table's exact corpus is previewed in D10; here we trace its use once."}</Prose>

<Prose>{"Watch the two class weights share one normalizing denominator."}</Prose>

<NaiveBayesReadingFlowFigure job="D06" phase="live" />

<Prose>{"The spam prior is "}<code>{"2/3"}</code>{". Restrict that class partition by its free likelihood "}<code>{"4/11"}</code>{", leaving weight "}<code>{"8/33"}</code>{". Ham starts at "}<code>{"1/3"}</code>{" and leaves "}<code>{"(1/3)(1/7)=1/21"}</code>{". These are joint weights, not yet probabilities conditioned on free. Their sum is the mass assigned to the observed word. Dividing both weights by that same sum leaves posterior fractions "}<code>{"56/67"}</code>{" for spam and "}<code>{"11/67"}</code>{" for ham."}</Prose>

<Prose>{"Write "}<code>{"Y"}</code>{" for class, "}<code>{"x"}</code>{" for the observed vector, "}<code>{"π_c"}</code>{" for its prior and "}<code>{"L_c(x)"}</code>{" for its class likelihood. For a discrete event, "}<code>{"L"}</code>{" is mass; for a continuous measurement it is density in common coordinates. The rule is"}</Prose>

<div className="neural-equation"><MathBlock>{"w_c(x)=\\pi_cL_c(x),\\qquad\nP(Y=c\\mid x)=\\frac{w_c(x)}{\\sum_r w_r(x)},\\qquad\n\\widehat y=\\arg\\max_c w_c(x)."}</MathBlock></div>

<Prose>{"The denominator must be positive. It is common to every class, so it cancels when comparing classes; it remains essential when naming an output a probability. Here the fitted model reports spam probability "}<code>{"56/67≈.835821"}</code>{". Section 9 will ask whether held-out outcomes support interpreting numbers of that size as long-run frequencies. The equal-cost argmax rule chooses spam; different costs lead to a separate action rule."}</Prose>

<Prose>{"Long messages multiply many small numbers. A computer can round their products to zero even though their relative magnitudes remain meaningful. Natural logs replace multiplication with addition and preserve comparisons of positive weights. Follow the numerical scale change before its equation."}</Prose>

<NaiveBayesReadingFlowFigure job="D07" phase="live" />

<Prose>{"Scores "}<code>{"−1001,−1000"}</code>{" both exponentiate directly to zero in ordinary floating point. Subtract the maximum "}<code>{"−1000"}</code>{": the new scores are "}<code>{"−1,0"}</code>{", whose exponentials are "}<code>{".367879,1"}</code>{". Their sum is "}<code>{"1.367879"}</code>{"; normalized values are "}<code>{".268941,.731059"}</code>{". The common shift cancels from the ratio. It changes the arithmetic scale while leaving the model comparison intact."}</Prose>

<Prose>{"For factored likelihoods, define the unnormalized "}<strong>{"log joint score"}</strong>{" "}<code>{"s_c"}</code>{". The following equation names every operation just traced:"}</Prose>

<div className="neural-equation"><MathBlock>{"s_c=\\log\\pi_c+\\sum_j\\log P(x_j\\mid c),\\quad m=\\max_rs_r,\n\\quad \\ell=m+\\log\\sum_r e^{s_r-m},\\quad\n\\log P(c\\mid x)=s_c-\\ell."}</MathBlock></div>

<Prose>{"This is log-sum-exp normalization. Retain log probabilities when an extremely small final probability underflows on exponentiation. A partially unsupported class has score "}<code>{"−∞"}</code>{" and posterior zero. When every score is "}<code>{"−∞"}</code>{", the model has assigned the observation no support and conditioning is undefined. A uniform fallback would silently invent a different model. Invalid positive infinity or overflow in finite score differences is an arithmetic error, rather than a license to clip the model's scores."}</Prose>

<Prose>{"The complete first program implements this scale change and exact fractions."}</Prose>

<Prose>{""}<strong>{"normalized-scores.py — complete program."}</strong>{" If both exponentiated scores round to zero, does the evidence say that the classes are equally likely?"}</Prose>

<RemoteCodeBlock source="/learn-code/naive-bayes-probabilistic-classifiers/normalized-scores.py" filename="normalized-scores.py" title={"Normalize scores without losing their scale"} />

<Prose>{"Recorded original output (retained, not rerun):"}</Prose>

<CodeBlock language="text" kind="output" filename="normalized-scores-output.txt" title="Recorded output">{"free-token posterior [ham, spam]: ['11/67', '56/67']\ndirect exponentials: [0.0, 0.0]\nnormalized: [0.268941, 0.731059]\none possible class: [0.0, 1.0]\nzero-evidence response: Every class assigns zero likelihood: posterior undefined"}</CodeBlock>

<Prose>{"Its output distinguishes numerical product underflow from the unsupported-event case. "}<code>{"log(8/33)"}</code>{" and "}<code>{"log(1/21)"}</code>{" are unnormalized log weights: a method returning only those values should be named "}<code>{"log_joint"}</code>{" or "}<code>{"class_log_scores"}</code>{". "}<code>{"predict_log_proba"}</code>{" must subtract the shared normalizer."}</Prose>

<Prose>{"For two classes, subtraction is an even simpler view. "}<strong>{"Odds"}</strong>{" are "}<code>{"P(spam|x)/P(ham|x)"}</code>{"; "}<strong>{"log odds"}</strong>{" are "}<code>{"s_spam−s_ham"}</code>{". Zero is a tie, positive favors spam and negative favors ham. Track individual signed contributions."}</Prose>

<NaiveBayesReadingFlowFigure job="D08" phase="static" />

<Prose>{"The prior contributes "}<code>{"log 2≈.693147"}</code>{". Free contributes "}<code>{"log((4/11)/(1/7))=log(28/11)≈.934309"}</code>{". Together they give "}<code>{"1.627456"}</code>{" log odds. Adding meeting instead contributes "}<code>{"log(7/22)<0"}</code>{", because meeting is more likely under ham. Bars point to opposite sides of zero; hue follows each named word, while signed length encodes its log likelihood ratio."}</Prose>

<Prose>{"One final distinction prevents an important diagnostic mistake."}</Prose>

<NaiveBayesReadingFlowFigure job="D09" phase="live" />

<Prose>{"With no smoothing, a "}<strong>{"known"}</strong>{" free column can have zero ham probability: observing that word rules ham out under the fitted table. An "}<strong>{"unknown"}</strong>{" word has no column in this chosen vectorizer and is ignored. An all-OOV message therefore becomes an empty count row and returns the prior, whereas a row impossible under both classes has no posterior. Smoothing repairs support inside a declared vocabulary; it does not create new columns at inference."}</Prose>

<H2>{"3. Learn a token model"}</H2>

<Prose>{"We have used a probability table. Where do its entries come from? Keep the same five-word schema and count the actual training messages."}</Prose>

<Prose>{"Watch document counts and pooled token counts take different routes."}</Prose>

<NaiveBayesReadingFlowFigure job="D10" phase="live" />

<Prose>{"The three messages are spam “free free money,” spam “free money win” and ham “meeting agenda.” Their vectors are "}<code>{"[2,1,0,0,0]"}</code>{", "}<code>{"[1,1,1,0,0]"}</code>{" and "}<code>{"[0,0,0,1,1]"}</code>{". Two "}<strong>{"documents"}</strong>{" are spam, one is ham: priors are "}<code>{"2/3,1/3"}</code>{". Pooling "}<strong>{"tokens"}</strong>{" instead gives spam counts "}<code>{"[3,2,1,0,0]"}</code>{" with total 6 and ham "}<code>{"[0,0,0,1,1]"}</code>{" with total 2. Prior estimation counts rows; token estimation counts occurrences within their class. Exchanging those denominators changes the model."}</Prose>

<Prose>{"Let "}<code>{"C_cj"}</code>{" be class "}<code>{"c"}</code>{"'s pooled count for word "}<code>{"j"}</code>{", "}<code>{"T_c=Σ_j C_cj"}</code>{", and "}<code>{"V"}</code>{" the number of declared words. The relative-frequency estimate is "}<code>{"θ_cj=C_cj/T_c"}</code>{", when "}<code>{"T_c>0"}</code>{". Each class's word probabilities sum to one."}</Prose>

<Prose>{"What exactly is the event described by this word table? It first describes independent token positions, conditional on class and the observed in-vocabulary length "}<code>{"N"}</code>{". Counting those positions then combines equivalent orders."}</Prose>

<NaiveBayesReadingFlowFigure job="D11" phase="live" />

<Prose>{"For "}<code>{"θ(A)=4/5,θ(B)=1/5"}</code>{", AB has probability "}<code>{"4/25"}</code>{" and BA also has "}<code>{"4/25"}</code>{". Both arrows reach count vector "}<code>{"[1,1]"}</code>{", whose event has probability "}<code>{"8/25"}</code>{". The count event forgets order, so its mass adds every order giving that vector. With counts "}<code>{"x"}</code>{", the number of such orders is the multinomial coefficient."}</Prose>

<div className="neural-equation"><MathBlock>{"N=\\sum_jx_j,\\qquad\nP(x\\mid c,N)=\\frac{N!}{\\prod_jx_j!}\\prod_j\\theta_{cj}^{x_j},\\qquad\ns_c(x)=\\log\\pi_c+\\sum_{j:x_j>0}x_j\\log\\theta_{cj}."}</MathBlock></div>

<Prose>{"The coefficient depends on the fixed observation, not class, so it cancels in class normalization. It belongs in an actual count-event probability. The count columns themselves are dependent: with fixed length, all tokens being A forces every other count to zero. The independence concerns positions before aggregation. A separate class-dependent length distribution would add "}<code>{"log P(N|c)"}</code>{"; the usual score leaves that factor class independent. More tokens still add evidence without implying that a length model was learned."}</Prose>

<Prose>{"Tiny corpora give zero counts for words that may merely be unobserved so far. We can reserve probability throughout the declared vocabulary."}</Prose>

<NaiveBayesReadingFlowFigure job="D12" phase="live" />

<Prose>{"Attach the same "}<code>{"α"}</code>{" addition to every column, then add all "}<code>{"Vα"}</code>{" additions in the denominator. At "}<code>{"α=1"}</code>{", spam becomes "}<code>{"[4,3,2,1,1]/11"}</code>{"; ham becomes "}<code>{"[1,1,1,2,2]/7"}</code>{". Each row still sums to one. The two denominators "}<code>{"6+5=11"}</code>{" and "}<code>{"2+5=7"}</code>{" now explain the free likelihoods used in D06."}</Prose>

<div className="neural-equation"><MathBlock>{"\\widehat\\theta_{cj}=\\frac{C_{cj}+\\alpha}{T_c+V\\alpha}."}</MathBlock></div>

<NeuralTable caption={"3. Learn a token model"} headers={[<>{"Word"}</>,<>{"Spam θ"}</>,<>{"Ham θ"}</>,<>{"One-token spam/ham ratio"}</>]} rows={[[<>{"free"}</>,<>{"4/11"}</>,<>{"1/7"}</>,<>{"28/11"}</>],[<>{"money"}</>,<>{"3/11"}</>,<>{"1/7"}</>,<>{"21/11"}</>],[<>{"win"}</>,<>{"2/11"}</>,<>{"1/7"}</>,<>{"14/11"}</>],[<>{"meeting"}</>,<>{"1/11"}</>,<>{"2/7"}</>,<>{"7/22"}</>],[<>{"agenda"}</>,<>{"1/11"}</>,<>{"2/7"}</>,<>{"7/22"}</>]]} />

<Prose>{"The same fixed corpus now supports the token evidence investigation."}</Prose>

<NaiveBayesReadingFlowFigure job="D08" phase="live" />

<Prose>{"Edit the message and smoothing, then inspect the active words, log contributions and current posterior. The complete result is shown immediately. Prefix stepping traces the additions without concealing that result. A separate prior control changes prevalence while holding the word tables fixed. Empty and OOV messages are valid; at "}<code>{"α=0"}</code>{", “free meeting” makes both class weights zero. Compare that support failure with a message containing only zephyronic."}</Prose>

<Prose>{"The calculation can be reproduced without a fitting API:"}</Prose>

<CodeBlock language={"python"}>{"import numpy as np\nfrom scipy.special import logsumexp\n\ncounts = np.array([[0, 0, 0, 1, 1], [3, 2, 1, 0, 0]], dtype=float)  # ham, spam\nprior = np.array([1/3, 2/3])\ntheta = (counts + 1) / (counts.sum(axis=1, keepdims=True) + 5)\nx = np.array([1, 0, 0, 0, 0])\nscores = np.log(prior) + np.log(theta) @ x\nprint(np.exp(scores - logsumexp(scores)))  # [11/67, 56/67]"}</CodeBlock>

<Prose>{"Adding one to the matrix computes the smoothing law; summing on axis 1 gives one token denominator per class. The final matrix product adds query word contributions to each class. Section 8 develops the sparse version and persists its raw counts. The older complete integer-count implementation below uses an eight-word/eight-message fixture to show the same mechanism at a larger scale."}</Prose>

<Prose>{""}<strong>{"count-classifier.py — complete program."}</strong>{" Why does the money column receive a nonzero ham count before any smoothing?"}</Prose>

<RemoteCodeBlock source="/learn-code/naive-bayes-probabilistic-classifiers/count-classifier.py" filename="count-classifier.py" title={"Fit a complete count classifier on the retained eight-word corpus"} />

<Prose>{"Recorded original output (retained, not rerun):"}</Prose>

<CodeBlock language="text" kind="output" filename="count-classifier-output.txt" title="Recorded output">{"class order: [0, 1]\ntoken totals: [29, 28]\nclass word counts: [[0, 1, 0, 0, 8, 7, 7, 6], [10, 8, 6, 4, 0, 0, 0, 0]]\nlog word probabilities: [[-3.6109, -2.9178, -3.6109, -3.6109, -1.4137, -1.5315, -1.5315, -1.665], [-1.1856, -1.3863, -1.6376, -1.9741, -3.5835, -3.5835, -3.5835, -3.5835]]\nquery joint scores: [[-10.832754, -4.450689], [-0.693147, -0.693147]]\nquery probabilities: [[0.001689, 0.998311], [0.5, 0.5]]\ntraining accuracy: 1.0\nmatches sklearn: True"}</CodeBlock>

<Prose>{"Its ham and spam token totals are 29 and 28. Adding one over eight columns gives denominators 37 and 36. Ham also contains money once, so this corpus has overlap. "}<code>{"classes_"}</code>{" is "}<code>{"[0,1]"}</code>{"; each probability column follows that order. Its perfect training accuracy describes these eight invented fitting rows. The positive count mask is important at "}<code>{"α=0"}</code>{": multiplying a stored zero count by "}<code>{"−∞"}</code>{" would produce NaN. The later sparse reference keeps this exact support logic, and extends state handling without replaying this experiment."}</Prose>

<H3>{"Deeper: constrained estimation and what smoothing means"}</H3>

<Prose>{"Why is relative frequency the likelihood estimate? Hold one class fixed and ask which probability table best explains its accumulated tokens. The table must stay on a simplex: nonnegative entries whose total is one."}</Prose>

<NaiveBayesReadingFlowFigure job="D13" phase="live" />

<Prose>{"With counts "}<code>{"[2,1,1]"}</code>{", the triangle's three coordinates are probabilities. Moving a point changes those probabilities while preserving the total. The objective contours are "}<code>{"Σ C_j log θ_j"}</code>{"; their maximum is "}<code>{"[.5,.25,.25]"}</code>{". A zero-probability edge with a positive observed count has log likelihood "}<code>{"−∞"}</code>{". For a zero count, use the limiting contribution "}<code>{"0 log 0=0"}</code>{"."}</Prose>

<Prose>{"To derive the maximum, form "}<code>{"F(θ,λ)=Σ_j C_j log θ_j + λ(1−Σ_j θ_j)"}</code>{". At an interior optimum, "}<code>{"∂F/∂θ_j=C_j/θ_j−λ=0"}</code>{", giving "}<code>{"C_j=λθ_j"}</code>{". Sum over "}<code>{"j"}</code>{": "}<code>{"T=λΣ_jθ_j=λ"}</code>{". Hence "}<code>{"θ_j=C_j/T"}</code>{". Positive-count entries have positive fitted mass; zero-count entries can maximize at the boundary. The log likelihood is concave on the simplex, so an admissible stationary maximum is global. At total count zero it supplies no preferred composition."}</Prose>

<Prose>{"Now place a Dirichlet prior on the same simplex, with density proportional to "}<code>{"∏ θ_j^(α−1)"}</code>{" for positive "}<code>{"α"}</code>{". Multiplication by token likelihood "}<code>{"∏ θ_j^C_j"}</code>{" gives posterior shapes "}<code>{"A_j=C_j+α"}</code>{". Their posterior mean is "}<code>{"A_j/Σ A_j"}</code>{", exactly the additive formula. It is also the predictive probability of one future token. The interior posterior "}<strong>{"mode"}</strong>{" instead uses "}<code>{"(A_j−1)/(Σ A_j−V)"}</code>{" when every "}<code>{"A_j>1"}</code>{". Calling the mean MAP would confuse two different summaries. Using the mean in a whole-document product is a plug-in choice; section 10 integrates the entire product."}</Prose>

<Prose>{"The same five pseudo-counts affect a class with two observed tokens more than a class with two thousand. As "}<code>{"α"}</code>{" grows, composition moves toward "}<code>{"1/V"}</code>{"; as it approaches zero with positive "}<code>{"T"}</code>{", it approaches relative frequency. Smoothing acts on a declared table. A vocabulary OOV policy or a fitted unknown-token column remains a separate representation choice."}</Prose>

<H3>{"Deeper: inspect the likelihood in unconstrained coordinates"}</H3>

<Prose>{"A gradient calculation helps connect the closed form to numerical fitting. Let unrestricted logits "}<code>{"z_j"}</code>{" produce probabilities "}<code>{"θ_j=e^{z_j}/Σ_k e^{z_k}"}</code>{". Substituting into negative log likelihood gives"}</Prose>

<div className="neural-equation"><MathBlock>{"J(z)=T\\log\\sum_j e^{z_j}-\\sum_j C_jz_j,\\qquad\n\\frac{\\partial J}{\\partial z_j}=T\\theta_j-C_j."}</MathBlock></div>

<Prose>{"Differentiate the first term: the log derivative divides its exponential derivative by the exponential sum, giving "}<code>{"Tθ_j"}</code>{". The second differentiates to "}<code>{"−C_j"}</code>{". A zero gradient therefore gives the same "}<code>{"C/T"}</code>{" table. Adding a constant to every logit leaves probabilities and the objective unchanged; fix the last logit at zero to remove that redundant direction. A zero-count MLE can need an infinite negative logit, so a finite optimizer and an exact boundary solution have different numerical domains."}</Prose>

<Prose>{"The complete objective program, shown after its Gaussian counterpart in section 5, checks central differences and supplies "}<code>{"jac=True"}</code>{" to SciPy. Optimizing counts "}<code>{"C+α"}</code>{" would optimize a pseudo-count likelihood; label that objective explicitly instead of claiming it is automatically the MAP interpretation. Ordinary NB fitting uses the closed-form statistics; the optimizer here is a way to inspect the objective and its derivatives."}</Prose>

<H2>{"4. Decide what an observation means"}</H2>

<Prose>{"The token table counts repetition. What if we want to know whether a word occurred at all, including the words missing from a completely observed message? Change the observation, then change its likelihood."}</Prose>

<Prose>{"Look at the same message as counts and as measured presence slots."}</Prose>

<NaiveBayesReadingFlowFigure job="D14" phase="live" />

<Prose>{"“Free free” has count two in the free column, but presence one. Each other presence slot is an observed zero. A Bernoulli class table gives a probability "}<code>{"φ_cj"}</code>{" of presence for each slot, with absence probability "}<code>{"1−φ_cj"}</code>{". Unlike the multinomial composition, these "}<code>{"φ"}</code>{" values need not sum to one: each feature has its own two-outcome distribution. Repeating free adds count evidence but does not change any presence slot."}</Prose>

<div className="neural-equation"><MathBlock>{"P(b\\mid c)=\\prod_j\\phi_{cj}^{b_j}(1-\\phi_{cj})^{1-b_j},\\qquad\ns_c=\\log\\pi_c+\\sum_j\\begin{cases}\\log\\phi_{cj}&b_j=1\\\\\n\\log(1-\\phi_{cj})&b_j=0.\\end{cases}"}</MathBlock></div>

<Prose>{"To fit "}<code>{"φ"}</code>{", count class documents containing the feature. Let "}<code>{"D_c"}</code>{" be the class document count and "}<code>{"D_cj^+"}</code>{" its present count. A symmetric Beta prior adds "}<code>{"α"}</code>{" to presence and "}<code>{"α"}</code>{" to absence:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\widehat\\phi_{cj}=\\frac{D_{cj}^{+}+\\alpha}{D_c+2\\alpha}."}</MathBlock></div>

<Prose>{"Both spam messages contain free, giving "}<code>{"(2+1)/(2+2)=3/4"}</code>{"; no ham message does, giving "}<code>{"(0+1)/(1+2)=1/3"}</code>{". For “free,” the spam absence factors for money, win, meeting and agenda are "}<code>{"1/4,1/2,3/4,3/4"}</code>{". Multiplying all five factors with the prior and normalizing yields spam probability "}<code>{"6561/7585≈.864997"}</code>{". The token model's "}<code>{".835821"}</code>{" answers a different event question. In the presence investigation, edit one count or the full vector and compare repeated free with one free. The presence result stays fixed when no slot changes."}</Prose>

<Prose>{"But a sensor or parser can fail to measure a slot. A missing observation is different from an observed off event."}</Prose>

<NaiveBayesReadingFlowFigure job="D15" phase="live" />

<Prose>{"Consider prior fault "}<code>{".2"}</code>{", alarm-presence probabilities "}<code>{".8"}</code>{" in fault and "}<code>{".4"}</code>{" in normal. An observed off alarm contributes absence factors "}<code>{".2,.6"}</code>{". Weights "}<code>{".2×.2=.04"}</code>{" and "}<code>{".8×.6=.48"}</code>{" give fault posterior "}<code>{"1/13"}</code>{". If the alarm was genuinely unmeasured, summing over its possible values instead contributes "}<code>{".8+.2=1"}</code>{" and "}<code>{".4+.6=1"}</code>{", leaving the prior "}<code>{".2"}</code>{"."}</Prose>

<Prose>{"Omitting the factor assumes the observation process adds no additional class evidence under the stated conditioning. If missingness itself signals a fault, we must model that process. A Boolean mask in section 10 expresses “measured,” not a claim that every missing-data mechanism is harmless."}</Prose>

<Prose>{"What if a feature chooses a status instead of counting events? Give each feature its own category universe."}</Prose>

<NaiveBayesReadingFlowFigure job="D16" phase="live" />

<Prose>{"Status has labels idle, busy, offline and a reserved other; link has wired and radio. The status code 2 indexes offline's table entry. It is not twice as much status as code 1. Each feature "}<code>{"j"}</code>{" has "}<code>{"M_j"}</code>{" possibilities and per-class counts "}<code>{"D_cjt"}</code>{". Its estimate is"}</Prose>

<div className="neural-equation"><MathBlock>{"P(X_j=t\\mid c)=\\frac{D_{cjt}+\\alpha}{D_c+\\alpha M_j}."}</MathBlock></div>

<Prose>{"Each row/feature table sums to one. A reserved other label works only if the input mapping was declared during fitting. Positive smoothing does not validate a code outside its support. The complete library example holds the three-mail fixture fixed, then switches explicitly to six device records."}</Prose>

<Prose>{""}<strong>{"event-models.py — complete program."}</strong>{" Does repeating free change the Bernoulli observation? What does a reserved category buy you?"}</Prose>

<RemoteCodeBlock source="/learn-code/naive-bayes-probabilistic-classifiers/event-models.py" filename="event-models.py" title={"Count repetitions, observe absences, and declare category support"} />

<Prose>{"Recorded original output (retained, not rerun):"}</Prose>

<CodeBlock language="text" kind="output" filename="event-models-output.txt" title="Recorded output">{"MultinomialNB P(spam): [0.835821, 0.92836, 0.666667]\nBernoulliNB P(spam): [0.864997, 0.864997, 0.516411]\ncategory counts: [[[2.0, 1.0, 0.0, 0.0], [0.0, 1.0, 2.0, 0.0]], [[2.0, 1.0], [1.0, 2.0]]]\noffline/radio and other/wired: [[0.181818, 0.818182], [0.6, 0.4]]\ncategory 4: outside the declared/fitted support; reject or map by the fixed schema"}</CodeBlock>

<Prose>{"Its repeated free queries agree under Bernoulli and differ under Multinomial. The empty count query returns its prior; the all-absent Bernoulli query gives about "}<code>{"51.64%"}</code>{" spam because zeros supply factors. The categorical support reserves status code 3 using "}<code>{"min_categories=[4,2]"}</code>{"; code 4 is rejected. The scratch categorical route in section 8 stores category labels alongside counts, so restoring numeric arrays cannot silently change the code meanings."}</Prose>

<Prose>{"For the ordinary Bernoulli API, "}<code>{"binarize=None"}</code>{" means the caller has already supplied binary input. Passing arbitrary counts under that setting would change the scoring arithmetic away from this event model. The new reference validates binary inputs and requires positive "}<code>{"α"}</code>{" for its sparse absence formula. Exact zero smoothing can be implemented by event branches; it cannot safely reuse a formula containing infinite present/absent log ratios."}</Prose>

<H2>{"5. Measure continuous evidence"}</H2>

<Prose>{"Counts and categories have discrete mass. How can the same class comparison use a continuous sensor reading? Switch examples explicitly: one feature is a voltage in millivolts, and each class proposes a normal density for that voltage. The density's height and its probability area play different roles."}</Prose>

<Prose>{"Look at two directly labelled curves and the same-width interval under each."}</Prose>

<NaiveBayesReadingFlowFigure job="D17" phase="live" />

<Prose>{"Both curves have mean zero. The narrow class has standard deviation 1 mV and the wide class 2 mV, hence variances 1 and 4 mV². At the mean, the narrow density is twice as high, giving posterior "}<code>{"2/3"}</code>{" under equal priors. The interval area depends on its width, whereas the point-density comparison uses the height at the current reading. Moving the reading into either tail makes the wider distribution more plausible. Equal heights occur at both "}<code>{"±sqrt(8 log 2/3)≈±1.359556 mV"}</code>{"."}</Prose>

<Prose>{"For mean "}<code>{"μ_cj"}</code>{" and positive variance "}<code>{"v_cj=σ_cj²"}</code>{", write"}</Prose>

<div className="neural-equation"><MathBlock>{"z_{cj}=\\frac{x_j-\\mu_{cj}}{\\sigma_{cj}},\\qquad\nf(x_j\\mid c)=\\frac{e^{-z_{cj}^{2}/2}}{\\sqrt{2\\pi}\\sigma_{cj}}."}</MathBlock></div>

<Prose>{"The standardized residual "}<code>{"z"}</code>{" measures distance in standard deviations. The exponential lowers density far from the mean; division by "}<code>{"σ"}</code>{" keeps the total area one. Density has units "}<code>{"mV^−1"}</code>{" and can exceed one. A continuous exact point has probability zero; an interval probability integrates density over its width. In the investigation, change reading and interval width independently: width changes area without changing the point posterior."}</Prose>

<Prose>{"Consistently changing coordinates changes density units and multiplies every class density by the same Jacobian. Converting mV to V multiplies a one-dimensional density by 1000, so class posterior ratios stay the same. Transform observations, means, variances and floors together. Keeping a numeric variance floor while changing its physical unit changes the fitted model."}</Prose>

<Prose>{"How are the mean and spread learned? Trace actual deviations first."}</Prose>

<NaiveBayesReadingFlowFigure job="D18" phase="live" />

<Prose>{"Readings 1, 2 and 3 mV balance at their mean 2 mV. Their deviations are "}<code>{"−1,0,1"}</code>{" mV. Squared-area tiles have areas "}<code>{"1,0,1"}</code>{" mV²; dividing total area 2 by three readings yields variance "}<code>{"2/3"}</code>{" mV². The Gaussian likelihood estimate uses denominator "}<code>{"D"}</code>{", called "}<code>{"ddof=0"}</code>{" in NumPy. The unbiased sample estimator uses "}<code>{"D−1"}</code>{" for a different estimation question."}</Prose>

<div className="neural-equation"><MathBlock>{"\\widehat\\mu=\\frac1D\\sum_i x_i,\\qquad\n\\widehat v=\\frac1D\\sum_i(x_i-\\widehat\\mu)^2."}</MathBlock></div>

<H3>{"Deeper: derive these estimates and inspect their gradients"}</H3>

<Prose>{"For one class and feature, negative Gaussian log likelihood is"}</Prose>

<div className="neural-equation"><MathBlock>{"J(\\mu,v)=\\frac D2\\log(2\\pi v)+\\frac{\\sum_i(x_i-\\mu)^2}{2v},\\qquad v>0."}</MathBlock></div>

<Prose>{"Write "}<code>{"x̄"}</code>{" for the sample mean. Expanding "}<code>{"x_i−μ=(x_i−x̄)+(x̄−μ)"}</code>{" makes the cross term vanish because "}<code>{"Σ(x_i−x̄)=0"}</code>{". Therefore "}<code>{"Σ(x_i−μ)²=Σ(x_i−x̄)²+D(μ−x̄)²"}</code>{", minimized at "}<code>{"μ=x̄"}</code>{" for any positive "}<code>{"v"}</code>{". After substitution, differentiation gives "}<code>{"∂J/∂v=D/(2v)−S/(2v²)"}</code>{", where "}<code>{"S=Σ(x_i−x̄)²"}</code>{". Setting it to zero gives "}<code>{"v=S/D"}</code>{" when "}<code>{"S>0"}</code>{"."}</Prose>

<Prose>{"For an unconstrained positive variance, use "}<code>{"η=log v"}</code>{", so "}<code>{"v=e^η"}</code>{". Differentiating with respect to mean and log variance gives"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{\\partial J}{\\partial\\mu}=\\frac{\\sum_i(\\mu-x_i)}{v},\\qquad\n\\frac{\\partial J}{\\partial\\eta}=\\frac D2-\\frac{\\sum_i(x_i-\\mu)^2}{2v}."}</MathBlock></div>

<Prose>{"The complete new program now combines these derivatives with section 3's token-logit objective. Each function returns "}<code>{"(objective, gradient)"}</code>{"; SciPy's "}<code>{"jac=True"}</code>{" consumes that pair. Central differences perturb one parameter at a time to check the derivation independently."}</Prose>

<Prose>{""}<strong>{"nb-likelihood-gradients.py — complete file."}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/naive-bayes-probabilistic-classifiers/nb-likelihood-gradients.py" filename="nb-likelihood-gradients.py" title={"Manual and finite-difference likelihood gradients with honest optimizer status"} />

<Prose>{"Recorded new-program output:"}</Prose>

<CodeBlock language="json" kind="output" filename="nb-likelihood-gradients-output.txt" title="Recorded output">{"{\n  \"counts\": [\n    2.0,\n    1.0,\n    1.0\n  ],\n  \"token_start\": [\n    0.2,\n    -0.1\n  ],\n  \"token_gradient\": [\n    -0.43722466692073714,\n    0.15773244157705868\n  ],\n  \"token_finite_difference\": [\n    -0.43722466687157174,\n    0.15773244155248278\n  ],\n  \"common_shift_objective_difference\": 3.552713678800501e-15,\n  \"token_fit\": {\n    \"success\": false,\n    \"status\": 2,\n    \"iterations\": 9,\n    \"parameters\": [\n      0.6931471824056854,\n      5.248795953129256e-10\n    ],\n    \"objective\": 4.1588830833596715,\n    \"gradient_norm\": 1.669402402588808e-09,\n    \"message\": \"Desired error not necessarily achieved due to precision loss.\"\n  },\n  \"token_theta\": [\n    0.5000000003958252,\n    0.24999999986769741,\n    0.24999999973647752\n  ],\n  \"closed_form_theta\": [\n    0.5,\n    0.25,\n    0.25\n  ],\n  \"smoothed_mean_alpha_1\": [\n    0.42857142857142855,\n    0.2857142857142857,\n    0.2857142857142857\n  ],\n  \"gaussian_gradient\": [\n    -1.2280961296169728,\n    0.37424521451777504\n  ],\n  \"gaussian_finite_difference\": [\n    -1.2280961296351478,\n    0.3742452144628316\n  ],\n  \"gaussian_fit\": {\n    \"success\": true,\n    \"status\": 0,\n    \"iterations\": 9,\n    \"parameters\": [\n      2.000000000003881,\n      -0.40546510808162955\n    ],\n    \"objective\": 3.648617937451771,\n    \"gradient_norm\": 4.346518253398844e-11,\n    \"message\": \"CONVERGENCE: NORM OF PROJECTED GRADIENT <= PGTOL\"\n  },\n  \"closed_form_mean_variance\": [\n    2.0,\n    0.6666666666666666\n  ],\n  \"capped_token_fit\": {\n    \"success\": false,\n    \"status\": 1,\n    \"iterations\": 1,\n    \"parameters\": [\n      0.6372246669207371,\n      -0.25773244157705866\n    ],\n    \"objective\": 4.177534135440316,\n    \"gradient_norm\": 0.1691725309831286,\n    \"message\": \"Maximum number of iterations has been exceeded.\"\n  }\n}"}</CodeBlock>

<Prose>{"The token fixture "}<code>{"[2,1,1]"}</code>{" approaches "}<code>{"[.5,.25,.25]"}</code>{", matching its closed form. In this recorded BFGS run, the nine-iteration table is close to that optimum but the optimizer reports precision loss ("}<code>{"success=False"}</code>{", status 2) with gradient norm about "}<code>{"1.67×10^−9"}</code>{"; keep that status beside the accurate-looking parameters. The Gaussian fixture approaches mean 2 and variance "}<code>{"2/3"}</code>{". The program reports status, iterations, objective and gradient norm; its deliberately one-iteration capped optimizer retains failure status rather than treating an output vector as success. The printed smoothing mean "}<code>{"[3/7,2/7,2/7]"}</code>{" belongs to its declared Dirichlet summary, not the unsmoothed objective optimum. Use closed-form class statistics for ordinary NB fitting and the optimization route to investigate objectives or changed assumptions."}</Prose>

<Prose>{"If all readings are identical, "}<code>{"S=0"}</code>{"; decreasing "}<code>{"v"}</code>{" toward zero improves the likelihood without attaining a positive-variance optimum. A singleton has the same problem. An explicit positive additive floor keeps a supported density."}</Prose>

<NaiveBayesReadingFlowFigure job="D19" phase="live" />

<Prose>{"The coincident readings sit at one mean. The unfloored density collapses while the regularized density has a labelled positive width. Our scratch convention uses "}<code>{"variance = raw M2 / class mass + absolute floor"}</code>{". The floor is added to a derived variance, not accumulated into raw squares. A value "}<code>{"10^−9 mV²"}</code>{" is different from the library setting "}<code>{"var_smoothing=10^−9"}</code>{"."}</Prose>

<Prose>{"GaussianNB computes "}<code>{"epsilon_"}</code>{" as its setting times the largest feature variance, then adds that common epsilon. Inspect its units and scale. Constant data can make a relative epsilon zero; different feature units can make its global maximum inappropriate without representation/scaling choices. The incremental library can refresh epsilon from each current batch. Section 8 will demonstrate that raw merge identities and epsilon bookkeeping are different statements."}</Prose>

<Prose>{"The original complete Gaussian fit below keeps its RandomState(42) 200-row fixture and outputs unchanged."}</Prose>

<Prose>{""}<strong>{"gaussian-fit.py — complete program."}</strong>{" Does the 99.5% training result measure performance on unseen data?"}</Prose>

<RemoteCodeBlock source="/learn-code/naive-bayes-probabilistic-classifiers/gaussian-fit.py" filename="gaussian-fit.py" title={"Estimate Gaussian evidence and normalize the resulting scores"} />

<Prose>{"Recorded original output (retained, not rerun):"}</Prose>

<CodeBlock language="text" kind="output" filename="gaussian-fit-output.txt" title="Recorded output">{"priors: [0.5, 0.5]\nmeans: [[-2.1156, -1.966], [2.1282, 2.0435]]\nvariances: [[0.7259, 0.9877], [1.0699, 0.8651]]\ntraining accuracy: 0.9950\nP(class | origin): [[0.405819, 0.594181]]\nnormalization: [1.0]"}</CodeBlock>

<Prose>{"It normalizes class scores at the origin, giving roughly "}<code>{".5942"}</code>{" for class 1, and has "}<code>{".9950"}</code>{" training accuracy. These are recorded outcomes of that synthetic fit. The explicit absolute floor and "}<code>{"ddof=0"}</code>{" estimates are its state contract; its training result is separate from held-out usefulness."}</Prose>

<Prose>{"What does independence remove for several continuous features?"}</Prose>

<NaiveBayesReadingFlowFigure job="D20" phase="live" />

<Prose>{"A covariance matrix stores marginal variances on its diagonal and paired movement in its off-diagonal entries. Gaussian NB fixes off-diagonal entries to zero and draws axis-aligned contours. A full covariance with nonzero correlation rotates those contours. Both model pictures use equal feature scales and declared positive-definite matrices; they are calculated shapes, not samples from the old fit. Zero correlation makes the Gaussian comparison's contours align, while leaving their parameter-estimation objectives distinct."}</Prose>

<Prose>{"For diagonal Gaussians, subtract class scores feature by feature. Each standardized squared distance is "}<code>{"Q_cj=(x_j−μ_cj)²/v_cj"}</code>{". The log-odds equation is"}</Prose>

<div className="neural-equation"><MathBlock>{"s_1-s_0=\\log\\frac{\\pi_1}{\\pi_0}\n-\\frac12\\sum_j\\left[\\log\\frac{v_{1j}}{v_{0j}}+Q_{1j}-Q_{0j}\\right]."}</MathBlock></div>

<Prose>{"The log variance ratio penalizes spread, while "}<code>{"Q"}</code>{" measures distance from the mean relative to that spread. If the corresponding class variances are equal, each quadratic "}<code>{"x_j²"}</code>{" term cancels and leaves a linear comparison. Unequal variances generally give a quadratic boundary."}</Prose>

<NaiveBayesReadingFlowFigure job="D21" phase="live" />

<Prose>{"With means "}<code>{"(−2,−2),(2,2)"}</code>{", equal priors and common per-class variances "}<code>{".5,2"}</code>{" on both axes, expansion gives "}<code>{".75(x²+y²)+5(x+y)+6−log 4"}</code>{". Completing the squares gives a circle centered at "}<code>{"(−10/3,−10/3)"}</code>{" with radius approximately "}<code>{"4.008817"}</code>{". The equal-variance comparison instead gives line "}<code>{"x+y=0"}</code>{". The live query shows its exact score difference and the two distance/spread contributions, so the shaded region and class label have a common cause. Neither a coarse pixel region nor a colour legend replaces the analytic boundary."}</Prose>

<Prose>{""}<strong>{"gaussian-boundaries.py — complete program."}</strong>{" Will fitting a logistic model force its coefficients to equal the known Gaussian model's boundary?"}</Prose>

<RemoteCodeBlock source="/learn-code/naive-bayes-probabilistic-classifiers/gaussian-boundaries.py" filename="gaussian-boundaries.py" title={"Check an actual boundary and fit a separate comparison"} />

<Prose>{"Recorded original output (retained, not rerun):"}</Prose>

<CodeBlock language="text" kind="output" filename="gaussian-boundaries-output.txt" title="Recorded output">{"analytic circle center/radius: [-3.333333, -3.333333] 4.008817\nequal-score residual below 1e-12: True\ntest rows: 100 majority baseline: 0.5\nGaussianNB accuracy 0.8500 log loss 0.449564\nGaussianNB accuracy 0.8500 log loss 0.449564\nLogisticRegression accuracy 0.8200 log loss 0.372676"}</CodeBlock>

<Prose>{"The first part evaluates independent multivariate log densities on the calculated circle; its residual is below "}<code>{"10^−12"}</code>{". The second is the retained separate 500-row synthetic comparison: Gaussian NB has higher held-out accuracy, while logistic regression has lower log loss. They win different metrics on that split. Shared full-covariance Gaussian discriminant analysis can also induce a linear boundary; Gaussian NB restricts it to diagonal covariance. An identical functional form does not make separately fitted coefficients equal."}</Prose>

<Prose>{"Assess the conditional shape within each class. Two genuine class normals can have a bimodal pooled histogram; a class itself can be skewed, multimodal or heavy-tailed. A training-fitted transformation or richer likelihood addresses that question. A familiar-looking pooled plot cannot decide it by itself."}</Prose>

<H2>{"6. Test the independence assumption"}</H2>

<Prose>{"We can compute a posterior under any of these fitted likelihoods. What happens if separate columns repeat the same evidence? Specify an exact population so we can distinguish structural error from an unlucky small sample."}</Prose>

<Prose>{"Look at one measured alarm copied into several columns beside genuinely independent alarm measurements."}</Prose>

<NaiveBayesReadingFlowFigure job="D22" phase="live" />

<Prose>{"Fault prevalence is "}<code>{".2"}</code>{". A positive alarm occurs with probability "}<code>{".8"}</code>{" in fault and "}<code>{".4"}</code>{" in normal. The actual positive population masses are "}<code>{".2×.8=.16"}</code>{" and "}<code>{".8×.4=.32"}</code>{", so fault posterior is "}<code>{".16/.48=1/3"}</code>{". Copying the measured alarm three times creates three equal columns but one observation. The correct joint likelihood stays "}<code>{".8"}</code>{" or "}<code>{".4"}</code>{"; multiplying the copies as independent makes them "}<code>{".8³"}</code>{" and "}<code>{".4³"}</code>{"."}</Prose>

<div className="neural-equation"><MathBlock>{"P(\\mathrm{fault}\\mid +,+,+)=\\frac{.2\\times.8}{.2\\times.8+.8\\times.4}=\\frac13,\n\\qquad\n\\widehat P_{\\rm ind}=\\frac{.2\\times.8^3}{.2\\times.8^3+.8\\times.4^3}=\\frac23."}</MathBlock></div>

<Prose>{"The incorrect product now favors fault under equal costs. The actual optimal rule always chooses normal, even on a positive alarm, with accuracy "}<code>{".8"}</code>{". The copied rule chooses fault on positives and normal on negatives: its actual accuracy is "}<code>{".2×.8+.8×.6=.64"}</code>{". Evaluate both rules under the actual joint law, not the independent fiction used to produce the wrong score. At two positive copies the product posterior is exactly "}<code>{".5"}</code>{"; the stated tie policy chooses normal. More observations estimating the same wrong factorization do not remove this structural error."}</Prose>

<Prose>{"The lab lets you change copy count and alarm sign, then inspect actual and product likelihoods, posterior and population risk. A separate prior edit asks how prevalence interacts with the duplicated ratio. Copies are deterministic data-flow outputs. Independent sensors would instead be separate probabilistic children with an explicitly appropriate conditional law."}</Prose>

<Prose>{"We also want to penalize confidence errors, not only the final class. For one binary outcome "}<code>{"y"}</code>{" and predicted fault probability "}<code>{"p"}</code>{", take their displacement "}<code>{"p−y"}</code>{" and square it."}</Prose>

<NaiveBayesReadingFlowFigure job="D35" phase="static" />

<Prose>{"If a normal case has "}<code>{"y=0"}</code>{" and the model reports "}<code>{"p=2/3"}</code>{", its squared error is "}<code>{"4/9"}</code>{"; if a fault has "}<code>{"y=1"}</code>{", the same probability gives "}<code>{"1/9"}</code>{". Averaging these errors over the actual case masses is "}<strong>{"Brier loss"}</strong>{". Section 9 derives why truthful probabilities minimize its expectation; here the one square makes the name in the complete dependence program interpretable."}</Prose>

<Prose>{"Can useful signal disappear from every individual feature? Change from copied alarms to two fair switches whose relationship determines the label."}</Prose>

<NaiveBayesReadingFlowFigure job="D23" phase="live" />

<Prose>{"The four equally likely records are "}<code>{"(0,0)→0"}</code>{", "}<code>{"(0,1)→1"}</code>{", "}<code>{"(1,0)→1"}</code>{", "}<code>{"(1,1)→0"}</code>{". In either class, each switch has marginal presence probability one half. A Bernoulli model built from those marginals assigns every point the same class likelihood, although the pair determines the label exactly. The corner picture exposes the missing interaction: “same” versus “different.”"}</Prose>

<Prose>{"Add a feature "}<code>{"A≠B"}</code>{" if both switches are available at prediction, or use a tree/dependence model able to inspect the pair. Plain linear logistic regression on A and B also cannot separate XOR, so “replace it with a discriminative model” is an incomplete repair. State which relationship the alternative can express, then preserve its fitting/evaluation boundary."}</Prose>

<Prose>{""}<strong>{"dependence.py — complete program."}</strong>{" At two copies the model ties; at three it changes class. What actually changed in the observation?"}</Prose>

<RemoteCodeBlock source="/learn-code/naive-bayes-probabilistic-classifiers/dependence.py" filename="dependence.py" title={"Calculate the actual risk of counting copies as fresh evidence"} />

<Prose>{"Recorded original output (retained, not rerun):"}</Prose>

<CodeBlock language="text" kind="output" filename="dependence-output.txt" title="Recorded output">{"copies 1 P(fault | +/-) ['1/3', '1/13'] actual accuracy 4/5 Brier 0.143590\ncopies 2 P(fault | +/-) ['1/2', '1/37'] actual accuracy 4/5 Brier 0.158218\ncopies 3 P(fault | +/-) ['2/3', '1/109'] actual accuracy 16/25 Brier 0.199310\ncopies 5 P(fault | +/-) ['8/9', '1/973'] actual accuracy 16/25 Brier 0.294733\ntrue P(fault | +): 1/3\nXOR class 0 feature-positive rates: ['1/2', '1/2']\nXOR class 1 feature-positive rates: ['1/2', '1/2']\nXOR NB has identical marginal models; the pair still determines the class."}</CodeBlock>

<Prose>{"The program enumerates the actual law with fractions, reports positive and negative posteriors for 1, 2, 3 and 5 copies, and averages squared errors under the actual population. The XOR calculation inspects within-class marginals directly. These exact counterexamples show that ignored dependence can affect class decisions, probability quality or both; dependence does not promise the same failure on every dataset."}</Prose>

<H2>{"7. Understand what Complement NB changes"}</H2>

<Prose>{"The copied and XOR examples tell us to match the representation to informative structure. Another question arises in text when one class has few observations: can a class be recognized through what the other classes fail to explain? Complement NB changes the pool used to learn its weights."}</Prose>

<Prose>{"Watch only other-class rows reach the selected class's accumulator."}</Prose>

<NaiveBayesReadingFlowFigure job="D24" phase="live" />

<Prose>{"Three classes have aggregate counts "}<code>{"[8,2,0]"}</code>{", "}<code>{"[1,7,2]"}</code>{", "}<code>{"[0,2,8]"}</code>{". For class 0, exclude its own row and add rows 1 and 2: the complement is "}<code>{"[1,9,10]"}</code>{". With "}<code>{"α=1"}</code>{", its composition is "}<code>{"[2,10,11]/23"}</code>{". The three word columns retain their identity while crossing the pooling routes; choosing a different target excludes a different row. This is an accumulation diagram, not a graph claiming the classes are random causes of one another."}</Prose>

<div className="neural-equation"><MathBlock>{"\\bar C_{cj}=\\sum_{r\\ne c}C_{rj},\\qquad\n\\bar\\theta_{cj}=\\frac{\\bar C_{cj}+\\alpha}{\\sum_k\\bar C_{ck}+V\\alpha},\n\\qquad a_{cj}=-\\log\\bar\\theta_{cj},\\qquad s_c(x)=\\sum_jx_ja_{cj}."}</MathBlock></div>

<Prose>{"The minus sign makes poor complement fit a large class score. Inspect the query's actual multiplications and the optional row normalization."}</Prose>

<NaiveBayesReadingFlowFigure job="D25" phase="live" />

<Prose>{"For query "}<code>{"[2,0,1]"}</code>{", class 0 receives "}<code>{"−2 log(2/23)−log(11/23)≈5.622293"}</code>{". Classes 1 and 2 get about "}<code>{"2.814809"}</code>{" and "}<code>{"3.702700"}</code>{", so class 0 wins. A second normalization divides each weight row by its absolute sum. Positive smoothing makes these weights nonnegative, so this denominator is their ordinary sum. It rescales the whole row and can change comparisons; it does not alter the query's counts."}</Prose>

<Prose>{""}<strong>{"complement.py — complete program."}</strong>{" Does a larger negative log-complement score mean the document matches or contradicts that complement?"}</Prose>

<RemoteCodeBlock source="/learn-code/naive-bayes-probabilistic-classifiers/complement.py" filename="complement.py" title={"Pool the other classes and verify the sign of the decision"} />

<Prose>{"Recorded original output (retained, not rerun):"}</Prose>

<CodeBlock language="text" kind="output" filename="complement-output.txt" title="Recorded output">{"complement counts: [[1, 9, 10], [8, 4, 8], [9, 9, 2]]\ncomplement probabilities: [[0.086957, 0.434783, 0.478261], [0.391304, 0.217391, 0.391304], [0.434783, 0.434783, 0.130435]]\nnorm False scores: [[5.622293, 2.814809, 3.7027]] class: [0]\nweights match: True\nsoftmax matches: True\nnorm True scores: [[1.401071, 0.827253, 1.0]] class: [0]\nweights match: True\nsoftmax matches: True\nThese normalized scores are not a fitted generative P(class | document)."}</CodeBlock>

<Prose>{"The original complete program compares both variants with ordinary "}<code>{"ComplementNB(norm=...)"}</code>{". In the tested 1.9.1 implementation, the default is "}<code>{"norm=False"}</code>{". Its ordinary multiclass score omits the class prior; the single-class branch is an exception. Its attribute "}<code>{"feature_log_prob_"}</code>{" stores complement-derived weights, despite that familiar name. Softmax makes those scores sum to one, but that alone does not make them a literal posterior of the original class-generative multinomial fit. The new scratch reference uses the same explicit score convention and stores "}<code>{"norm"}</code>{" in its exported state. For one-word support, every negative log weight is zero; our normalized reference leaves the row zero rather than dividing zero by zero."}</Prose>

<Prose>{"Rare-class concerns are several different problems. Which one are we fixing?"}</Prose>

<NaiveBayesReadingFlowFigure job="D26" phase="live" />

<Prose>{"A deployment prior "}<code>{".02"}</code>{" and likelihood ratio 9 yield posterior odds "}<code>{"9/49"}</code>{" and probability "}<code>{"9/58≈.155172"}</code>{". Changing only the prior to "}<code>{".5"}</code>{" gives odds 9 and probability "}<code>{".9"}</code>{". More genuinely independent fault observations change estimation evidence; copying four fault rows does not create it. A different likelihood representation changes fitted feature evidence. A cost table changes the action threshold: false-positive cost 1 and missed-fault cost 20 give "}<code>{"1/21"}</code>{", so "}<code>{".155172"}</code>{" can justify a positive action while remaining a low probability. Prior, evidence volume, likelihood and action are separate levers."}</Prose>

<Prose>{"Multiplying all token counts in one class scales both its unsmoothed numerator and denominator, leaving composition unchanged. With smoothing, the relative pseudo-count influence changes; physical information still depends on independent observations. Complement estimation, weight normalization and text transformations are distinct empirical candidates introduced by Rennie and colleagues. None learns every word relationship or settles every imbalance issue."}</Prose>

<NeuralTable caption={"7. Understand what Complement NB changes"} headers={[<>{"Model"}</>,<>{"What its observation means"}</>,<>{"Parameter and diagnostic"}</>]} rows={[[<>{"Multinomial"}</>,<>{"Repeated token counts at a given in-vocabulary length"}</>,<>{"One composition table per class; token denominator and OOV policy"}</>],[<>{"Bernoulli"}</>,<>{"Completely observed binary slots"}</>,<>{"One presence rate per class/slot; absence and repetition policy"}</>],[<>{"Categorical"}</>,<>{"One named choice per column"}</>,<>{"One category table per class/column; declared support"}</>],[<>{"Gaussian"}</>,<>{"Continuous independent class normals"}</>,<>{"Means, variances and priors; units, tails and dependence"}</>],[<>{"Complement"}</>,<>{"Linear text score from other-class composition"}</>,<>{"Pool exclusion, minus sign, optional row norm and probability interpretation"}</>]]} />

<Prose>{"A restrictive law has fewer parameters to estimate. Its value depends on which information those restrictions preserve; no universal sample-count threshold guarantees an NB advantage over a regularized discriminative model."}</Prose>

<H2>{"8. Fit and update the whole workflow"}</H2>

<Prose>{"We can now choose a likelihood for an observation and diagnose several failures. How do we preserve that meaning when vocabulary grows, fitting uses folds, or messages arrive in batches? Start with the actual sparse object."}</Prose>

<Prose>{"Follow the two stored entries of one message through CSR indexing and scoring."}</Prose>

<NaiveBayesReadingFlowFigure job="D27" phase="live" />

<Prose>{"A compressed sparse row (CSR) matrix stores "}<code>{"data"}</code>{" values, their feature "}<code>{"indices"}</code>{", and "}<code>{"indptr"}</code>{" boundaries for each row. In the six-row new fixture, the first row "}<code>{"[2,0,1]"}</code>{" stores values "}<code>{"[2,1]"}</code>{" at columns "}<code>{"[0,2]"}</code>{"; "}<code>{"indptr[0:2]"}</code>{" is "}<code>{"[0,2]"}</code>{". Those two entries select just two parameter columns. An empty row has identical start and stop pointers and contributes only its prior in a token model. Repeated sparse indices must be summed and sorted before interpreting the row; storing the same token column twice does not create two different feature identities."}</Prose>

<H3>{"Construct and control the reusable discrete estimators"}</H3>

<Prose>{"The complete "}<code>{"nb_discrete_core.py"}</code>{" below contains the shared sufficient-count state and the four discrete scoring variants already taught. It uses NumPy arrays for the dense class parameter table and SciPy CSR for input rows. It delegates sparse storage and multiplication, while explicitly implementing class pooling, smoothing, likelihoods, normalization and serialization."}</Prose>

<Prose>{""}<code>{"partial_fit"}</code>{" maps labels to sorted classes, builds a class-by-row sparse membership matrix containing sample weights, and multiplies it by the input counts. This gives the class-by-feature increment without allocating a dense row-by-vocabulary matrix. Raw "}<code>{"class_count_"}</code>{" and "}<code>{"feature_count_"}</code>{" are accumulated; "}<code>{"_refresh"}</code>{" derives smoothed parameters afterward. Finite nonnegative sample weights change training mass, not the physical number of tokens in a new query. Fractional query inputs are allowed as an explicitly declared scoring extension; the integer multinomial event interpretation remains the one derived in section 3."}</Prose>

<Prose>{"Multinomial scoring uses sparse matrix multiplication when log probabilities are finite. At zero smoothing, it instead visits stored positive query entries to avoid "}<code>{"0×−∞"}</code>{", preserving the support distinction in D09. Bernoulli uses the all-absent bias described just below. Categorical accumulation uses "}<code>{"np.add.at"}</code>{" on each feature's differently sized category table. Complement subtracts each target class from global pooled counts and explicitly stores the norm policy."}</Prose>

<Prose>{"The shared schema is not a shape alone. It names words or fields in exact order; categorical state additionally names every category in code order. Export stores the convention version, sorted classes, raw counts, priors, smoothing and schema. Reload validates counts and recomputes derived arrays. It does not serialize unsafe pickle or turn "}<code>{"−∞"}</code>{" into silent JSON null. "}<code>{"predict_log_proba"}</code>{" normalizes each class row; "}<code>{"predict"}</code>{" chooses the first sorted class on an exact tie."}</Prose>

<Prose>{""}<strong>{"nb_discrete_core.py — complete file."}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/naive-bayes-probabilistic-classifiers/nb_discrete_core.py" filename="nb_discrete_core.py" title={"Reusable discrete estimators — quiet helper for nb_discrete_library.py and nb-mixed-record.py"} />

<Prose>{"This reusable file imports silently; run its adjacent comparison driver for the recorded outputs."}</Prose>

<Prose>{"The lower-level validation helpers keep rectangular finite inputs, feature identity, declared support and weights separate from the algorithm. Counts and weights are bounded at "}<code>{"10^6"}</code>{" per entry and smoothing at 100 in this reference. The sparse Bernoulli implementation requires positive smoothing so every presence probability remains strictly between zero and one. It is an inspectable implementation with declared ranges, rather than a clone of every sklearn estimator feature."}</Prose>

<Prose>{"Why does sparse Bernoulli prediction still include all absent words? Begin with the score of the all-absent row, then replace its terms only where a word is present:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\beta_c=\\log\\pi_c+\\sum_j\\log(1-\\phi_{cj}),\\qquad\nu_{cj}=\\log\\phi_{cj}-\\log(1-\\phi_{cj}),\\qquad\ns_c(b)=\\beta_c+\\sum_{j:b_j=1}u_{cj}."}</MathBlock></div>

<Prose>{"Each added ratio removes that slot's absence contribution and adds its presence contribution. "}<code>{"log1p(-φ)"}</code>{" computes small absence probabilities accurately. Precomputing "}<code>{"bias_"}</code>{" and "}<code>{"log_ratio_"}</code>{" costs "}<code>{"O(KV)"}</code>{"; a query visits its present entries in "}<code>{"O(Kq+K)"}</code>{". Sparsity skips zero storage, not zero evidence."}</Prose>

<Prose>{"The adjacent ordinary-library driver now maps exactly the same rows, weights, class order and query to each corresponding estimator. Save both files together and launch "}<code>{"python nb_discrete_library.py"}</code>{"."}</Prose>

<Prose>{""}<strong>{"nb_discrete_library.py — complete file."}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/naive-bayes-probabilistic-classifiers/nb_discrete_library.py" filename="nb_discrete_library.py" title={"Sparse batch, weighted, online and saved-state comparisons — save nb_discrete_core.py beside it"} />

<Prose>{"Recorded new-program output:"}</Prose>

<CodeBlock language="json" kind="output" filename="nb_discrete_library-output.txt" title="Recorded output">{"{\n  \"versions\": {\n    \"numpy\": \"2.3.5\",\n    \"scipy\": \"1.18.1\",\n    \"sklearn\": \"1.9.1\"\n  },\n  \"sparse_arrays\": {\n    \"data\": [\n      2,\n      1,\n      1,\n      1,\n      2,\n      1,\n      1,\n      1,\n      2\n    ],\n    \"indices\": [\n      0,\n      2,\n      1,\n      0,\n      1,\n      2,\n      0,\n      1,\n      2\n    ],\n    \"indptr\": [\n      0,\n      2,\n      3,\n      4,\n      6,\n      8,\n      9\n    ]\n  },\n  \"chunks\": [\n    2,\n    3,\n    1\n  ],\n  \"raw_counts\": [\n    [\n      4.0,\n      1.0,\n      1.0\n    ],\n    [\n      0.0,\n      3.0,\n      3.0\n    ]\n  ],\n  \"theta\": [\n    [\n      0.6,\n      0.2,\n      0.2\n    ],\n    [\n      0.06666666666666667,\n      0.4666666666666667,\n      0.4666666666666667\n    ]\n  ],\n  \"query_probabilities\": [\n    [\n      0.7941176470588235,\n      0.20588235294117646\n    ],\n    [\n      0.5,\n      0.5\n    ],\n    [\n      0.15517241379310345,\n      0.8448275862068966\n    ]\n  ],\n  \"batch_online_equal\": true,\n  \"comparisons\": [\n    {\n      \"family\": \"multinomial_unweighted\",\n      \"classes\": [\n        0,\n        1\n      ],\n      \"probabilities\": [\n        [\n          0.7941176470588235,\n          0.20588235294117646\n        ],\n        [\n          0.5,\n          0.5\n        ],\n        [\n          0.15517241379310345,\n          0.8448275862068966\n        ]\n      ],\n      \"max_library_log_difference\": 4.440892098500626e-16,\n      \"state_reload_equal\": true,\n      \"class_mass\": [\n        3.0,\n        3.0\n      ]\n    },\n    {\n      \"family\": \"bernoulli_unweighted\",\n      \"classes\": [\n        0,\n        1\n      ],\n      \"probabilities\": [\n        [\n          0.875,\n          0.12499999999999997\n        ],\n        [\n          0.28409090909090906,\n          0.7159090909090909\n        ],\n        [\n          0.12499999999999997,\n          0.875\n        ]\n      ],\n      \"max_library_log_difference\": 4.440892098500626e-16,\n      \"state_reload_equal\": true,\n      \"class_mass\": [\n        3.0,\n        3.0\n      ]\n    },\n    {\n      \"family\": \"complement_unweighted_norm_False\",\n      \"classes\": [\n        0,\n        1\n      ],\n      \"probabilities\": [\n        [\n          0.7941176470588235,\n          0.20588235294117646\n        ],\n        [\n          0.5,\n          0.5\n        ],\n        [\n          0.15517241379310348,\n          0.8448275862068966\n        ]\n      ],\n      \"max_library_log_difference\": 8.326672684688674e-17,\n      \"state_reload_equal\": true,\n      \"class_mass\": [\n        3.0,\n        3.0\n      ]\n    },\n    {\n      \"family\": \"complement_unweighted_norm_True\",\n      \"classes\": [\n        0,\n        1\n      ],\n      \"probabilities\": [\n        [\n          0.5625317596785206,\n          0.4374682403214793\n        ],\n        [\n          0.5,\n          0.5\n        ],\n        [\n          0.37686246059728284,\n          0.6231375394027172\n        ]\n      ],\n      \"max_library_log_difference\": 1.1102230246251565e-16,\n      \"state_reload_equal\": true,\n      \"class_mass\": [\n        3.0,\n        3.0\n      ]\n    },\n    {\n      \"family\": \"multinomial_weighted\",\n      \"classes\": [\n        0,\n        1\n      ],\n      \"probabilities\": [\n        [\n          0.6741837248629954,\n          0.3258162751370046\n        ],\n        [\n          0.3928571428571429,\n          0.6071428571428572\n        ],\n        [\n          0.18329633307395674,\n          0.8167036669260432\n        ]\n      ],\n      \"max_library_log_difference\": 2.220446049250313e-16,\n      \"state_reload_equal\": true,\n      \"class_mass\": [\n        2.75,\n        4.25\n      ]\n    },\n    {\n      \"family\": \"bernoulli_weighted\",\n      \"classes\": [\n        0,\n        1\n      ],\n      \"probabilities\": [\n        [\n          0.8075704065924115,\n          0.1924295934075886\n        ],\n        [\n          0.17052897139429196,\n          0.829471028605708\n        ],\n        [\n          0.09966770684099872,\n          0.9003322931590013\n        ]\n      ],\n      \"max_library_log_difference\": 4.440892098500626e-16,\n      \"state_reload_equal\": true,\n      \"class_mass\": [\n        2.75,\n        4.25\n      ]\n    },\n    {\n      \"family\": \"complement_weighted_norm_False\",\n      \"classes\": [\n        0,\n        1\n      ],\n      \"probabilities\": [\n        [\n          0.7617843372994487,\n          0.23821566270055133\n        ],\n        [\n          0.5,\n          0.5\n        ],\n        [\n          0.2575284986764258,\n          0.7424715013235742\n        ]\n      ],\n      \"max_library_log_difference\": 2.220446049250313e-16,\n      \"state_reload_equal\": true,\n      \"class_mass\": [\n        2.75,\n        4.25\n      ]\n    },\n    {\n      \"family\": \"complement_weighted_norm_True\",\n      \"classes\": [\n        0,\n        1\n      ],\n      \"probabilities\": [\n        [\n          0.5429370299781497,\n          0.45706297002185037\n        ],\n        [\n          0.5,\n          0.5\n        ],\n        [\n          0.41475457003591765,\n          0.5852454299640822\n        ]\n      ],\n      \"max_library_log_difference\": 2.220446049250313e-16,\n      \"state_reload_equal\": true,\n      \"class_mass\": [\n        2.75,\n        4.25\n      ]\n    },\n    {\n      \"family\": \"categorical_unweighted\",\n      \"classes\": [\n        0,\n        1\n      ],\n      \"probabilities\": [\n        [\n          0.6428571428571429,\n          0.35714285714285704\n        ],\n        [\n          0.8928571428571429,\n          0.1071428571428571\n        ]\n      ],\n      \"max_library_log_difference\": 6.661338147750939e-16,\n      \"state_reload_equal\": true,\n      \"class_mass\": [\n        3.0,\n        3.0\n      ]\n    },\n    {\n      \"family\": \"categorical_weighted\",\n      \"classes\": [\n        0,\n        1\n      ],\n      \"probabilities\": [\n        [\n          0.6166536784334533,\n          0.38334632156654674\n        ],\n        [\n          0.8982121976303519,\n          0.10178780236964816\n        ]\n      ],\n      \"max_library_log_difference\": 1.1102230246251565e-16,\n      \"state_reload_equal\": true,\n      \"class_mass\": [\n        2.75,\n        4.25\n      ]\n    }\n  ],\n  \"alpha_zero_empty\": [\n    [\n      0.5,\n      0.5\n    ]\n  ],\n  \"alpha_zero_supported\": [\n    [\n      0.0,\n      \"-inf\"\n    ]\n  ],\n  \"alpha_zero_unsupported\": \"undefined\",\n  \"alpha_zero_library\": {\n    \"finite\": [\n      [\n        false,\n        false\n      ],\n      [\n        false,\n        false\n      ]\n    ],\n    \"warnings\": [\n      \"divide by zero encountered in log\",\n      \"invalid value encountered in matmul\",\n      \"divide by zero encountered in log\"\n    ]\n  },\n  \"one_word_norm_policy\": {\n    \"weights\": [\n      [\n        0.0\n      ],\n      [\n        0.0\n      ]\n    ],\n    \"probabilities\": [\n      [\n        0.5,\n        0.5\n      ]\n    ]\n  },\n  \"changed_alpha_2\": [\n    [\n      0.6428571428571429,\n      0.3571428571428571\n    ],\n    [\n      0.5,\n      0.5\n    ],\n    [\n      0.2647058823529412,\n      0.7352941176470589\n    ]\n  ]\n}"}</CodeBlock>

<Prose>{"Its six rows have labels "}<code>{"[0,1,0,1,0,1]"}</code>{" and raw class counts "}<code>{"[3,3]"}</code>{". The class token rows are "}<code>{"[4,1,1]"}</code>{" and "}<code>{"[0,3,3]"}</code>{". At "}<code>{"α=.5"}</code>{", compositions are "}<code>{"[.6,.2,.2]"}</code>{" and "}<code>{"[1/15,7/15,7/15]"}</code>{". For query "}<code>{"[1,0,1]"}</code>{", class probabilities are "}<code>{"[27/34,7/34]≈[.794118,.205882]"}</code>{". The empty count row gives "}<code>{"[.5,.5]"}</code>{". Chunks of 2, 3 and 1 yield the same raw integer counts and probabilities as a single batch. JSON roundtrip keeps schema and scores."}</Prose>

<Prose>{"The ten matched comparisons cover weighted and unweighted Multinomial, Bernoulli, Categorical, and both Complement norms. The maximum differences in normalized log values are at floating-point rounding scale, with class arrays aligned. The weighted class masses "}<code>{"[2.75,4.25]"}</code>{" are not document counts; their interpretation is weighted evidence. "}<code>{"force_alpha=True"}</code>{", "}<code>{"binarize=None"}</code>{", "}<code>{"min_categories"}</code>{" and "}<code>{"norm"}</code>{" make the semantics explicit. Changing the driver's α to 2 changes the first query posterior to "}<code>{"[9/14,5/14]≈[.642857,.357143]"}</code>{"."}</Prose>

<Prose>{"At "}<code>{"α=0"}</code>{" the scratch route handles empty, supported and wholly unsupported events deliberately. The tested ordinary Multinomial implementation can instead produce nonfinite arithmetic from dense zero multiplication; the receipt retains its divide-by-zero/invalid-matmul warnings. This boundary comparison is a documented implementation difference, not approximate equivalence at every α."}</Prose>

<H3>{"Keep fitted transforms inside their allowed rows"}</H3>

<Prose>{"What if held-out words influence the vocabulary before fitting? Then the representation has already learned from its evaluation rows."}</Prose>

<NaiveBayesReadingFlowFigure job="D28" phase="live" />

<Prose>{"The retained twenty-message program first splits raw text into fourteen training and six test messages. Three internal training folds each fit their own CountVectorizer and class table inside a Pipeline, then score only that fold's held-out rows. Those folds choose α; the chosen pipeline finally fits all fourteen training messages and sees the six test messages only for evaluation. The diagram's blocked fit edges are the protocol, not extra runtime gates."}</Prose>

<Prose>{""}<strong>{"text-pipeline.py — complete program."}</strong>{" An unseen test word is ignored by this fitted vectorizer. How does that differ from a zero word likelihood inside its vocabulary?"}</Prose>

<RemoteCodeBlock source="/learn-code/naive-bayes-probabilistic-classifiers/text-pipeline.py" filename="text-pipeline.py" title={"Fit vocabulary only where training is allowed"} />

<Prose>{"Recorded original output (retained, not rerun):"}</Prose>

<CodeBlock language="text" kind="output" filename="text-pipeline-output.txt" title="Recorded output">{"training/test rows: 14 6\nselected alpha using training folds: 0.5\nfinal training-only vocabulary: 32\nprior baseline accuracy 0.5000 log loss 0.693147\nselected MNB accuracy 1.0000 log loss 0.029779\nfixed Bernoulli accuracy 1.0000 log loss 0.008339\nfixed Complement accuracy 1.0000 log loss 0.059149\nselected MNB confusion [true rows/predicted columns, ham/spam]: [[3, 0], [0, 3]]\nprobe nonzero feature counts: [4, 0, 0]\nprobe probabilities [ham, spam]: [[0.000165, 0.999835], [0.5, 0.5], [0.5, 0.5]]\nA six-message test is a workflow check, not evidence for deployment."}</CodeBlock>

<Prose>{"The original output selects "}<code>{"α=.5"}</code>{", has 32 training-vocabulary words and classifies all six test messages correctly for the three specified text candidates. Their log losses differ. MNB was selected by internal training folds; choosing a new winner from this test would use the test as validation. The unknown query “zephyronic qxz” and empty query both have zero nonzero features and return the MNB prior. Six invented test messages are a small workflow check, rather than a reliable model ranking."}</Prose>

<Prose>{"For any real report, show the confusion matrix: true classes index rows and predicted classes columns. Precision is correct positives divided by predicted positives; recall is detected positives divided by actual positives. Class support gives the denominator population. Balanced accuracy averages each class's recall, while total accuracy weights by prevalence. Explain the question a metric answers before choosing on it."}</Prose>

<H3>{"Deeper: rank features without borrowing test information"}</H3>

<Prose>{"The vocabulary may contain many weak or redundant columns. A ranking can select a smaller representation, but its fitted statistics must stay inside the same training lane. Open one document-presence contingency table first."}</Prose>

<NaiveBayesReadingFlowFigure job="D29" phase="live" />

<Prose>{"The two rows are classes; the two columns are absent and present. Cell counts sum to the training document count "}<code>{"n"}</code>{". The independent-reference expected count is "}<code>{"E_cb=(row total_c)(column total_b)/n"}</code>{". Comparing observed and expected cells supplies two useful but different statistics:"}</Prose>

<div className="neural-equation"><MathBlock>{"I(C;B)=\\sum_{c,b:N_{cb}>0}\\frac{N_{cb}}n\\log\\frac{N_{cb}}{E_{cb}},\n\\qquad \\chi^2_{\\rm Pearson}=\\sum_{c,b:E_{cb}>0}\\frac{(N_{cb}-E_{cb})^2}{E_{cb}}."}</MathBlock></div>

<Prose>{"Mutual information measures dependence in nats; a zero observed cell contributes zero. Pearson sums squared deviations relative to expected counts. A feature absent everywhere has no presence marginal: the corresponding zero-expected cells contribute no information/statistic. Neither statistic proves a feature will improve future predictions. Highly ranked duplicates can repeat evidence, as section 6 already showed."}</Prose>

<Prose>{""}<strong>{"nb-feature-selection.py — complete file."}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/naive-bayes-probabilistic-classifiers/nb-feature-selection.py" filename="nb-feature-selection.py" title={"Document-presence MI/Pearson versus count chi2 in a complete pipeline"} />

<Prose>{"Recorded new-program output:"}</Prose>

<CodeBlock language="json" kind="output" filename="nb-feature-selection-output.txt" title="Recorded output">{"{\n  \"training_rows\": 8,\n  \"feature_names\": [\n    \"alarm\",\n    \"inspection\",\n    \"meeting\",\n    \"repair\",\n    \"review\",\n    \"routine\",\n    \"urgent\"\n  ],\n  \"presence_definition\": {\n    \"tables_class_by_absent_present\": [\n      [\n        [\n          4,\n          0\n        ],\n        [\n          2,\n          2\n        ]\n      ],\n      [\n        [\n          3,\n          1\n        ],\n        [\n          3,\n          1\n        ]\n      ],\n      [\n        [\n          2,\n          2\n        ],\n        [\n          4,\n          0\n        ]\n      ],\n      [\n        [\n          4,\n          0\n        ],\n        [\n          2,\n          2\n        ]\n      ],\n      [\n        [\n          2,\n          2\n        ],\n        [\n          4,\n          0\n        ]\n      ],\n      [\n        [\n          1,\n          3\n        ],\n        [\n          4,\n          0\n        ]\n      ],\n      [\n        [\n          4,\n          0\n        ],\n        [\n          1,\n          3\n        ]\n      ]\n    ],\n    \"MI_nats\": [\n      0.21576155433883565,\n      0.0,\n      0.21576155433883565,\n      0.21576155433883565,\n      0.21576155433883565,\n      0.38039566584857787,\n      0.3803956658485779\n    ],\n    \"Pearson_chi2\": [\n      2.6666666666666665,\n      0.0,\n      2.6666666666666665,\n      2.6666666666666665,\n      2.6666666666666665,\n      4.8,\n      4.8\n    ]\n  },\n  \"sklearn_count_chi2\": [\n    3.0,\n    0.0,\n    2.0,\n    2.0,\n    2.0,\n    4.0,\n    4.0\n  ],\n  \"sklearn_count_chi2_pvalues\": [\n    0.08326451666355042,\n    1.0,\n    0.15729920705028105,\n    0.15729920705028105,\n    0.15729920705028105,\n    0.04550026389635857,\n    0.04550026389635857\n  ],\n  \"MI_selected_names\": [\n    \"alarm\",\n    \"routine\",\n    \"urgent\"\n  ],\n  \"count_chi2_selected_names\": [\n    \"alarm\",\n    \"routine\",\n    \"urgent\"\n  ],\n  \"query\": [\n    \"urgent alarm\",\n    \"newword meeting\",\n    \"\"\n  ],\n  \"MI_selected_probabilities\": [\n    [\n      0.09259259259259267,\n      0.9074074074074076\n    ],\n    [\n      0.5,\n      0.5\n    ],\n    [\n      0.5,\n      0.5\n    ]\n  ],\n  \"pipeline_probabilities\": [\n    [\n      0.09259259259259267,\n      0.9074074074074076\n    ],\n    [\n      0.5,\n      0.5\n    ],\n    [\n      0.5,\n      0.5\n    ]\n  ],\n  \"stored_transform\": {\n    \"vocabulary\": [\n      \"alarm\",\n      \"inspection\",\n      \"meeting\",\n      \"repair\",\n      \"review\",\n      \"routine\",\n      \"urgent\"\n    ],\n    \"MI_selected_indices\": [\n      0,\n      5,\n      6\n    ],\n    \"count_chi2_selected_indices\": [\n      0,\n      5,\n      6\n    ]\n  },\n  \"query_shape\": [\n    3,\n    3\n  ]\n}"}</CodeBlock>

<Prose>{"The new eight-document device-text fixture supplies a presence MI/Pearson implementation and a fixed-k stable selection rule. It separately runs ordinary "}<code>{"SelectKBest(chi2)"}</code>{" inside a CountVectorizer→selector→MNB pipeline. sklearn's "}<code>{"chi2"}</code>{" here compares "}<strong>{"feature count totals by class"}</strong>{", not the full document-present/absent 2×2 Pearson table. Their printed scores and chosen columns are therefore deliberately separate. "}<code>{"newword"}</code>{" in a query does not enter the fitted vocabulary. The selected indices are stored with feature names; a query must transform through that same fitted selection. Choose k inside development folds, never by inspecting test vocabulary or outcomes."}</Prose>

<Prose>{"The shown reference computes per-feature presence tables in "}<code>{"O(nd)"}</code>{" and stores four cells per feature; a sparse large-scale route would count class presence totals without densifying all rows. The dense conversion is bounded here to eight short messages to expose the table, and is not the recommended corpus storage strategy of D27. More complete feature selection and inferential testing belong to "}<a href={"/learn/path/full-curriculum/feature-selection-importance-shap-permutation-mutual-info"}>{"Feature Selection & Importance"}</a>{"."}</Prose>

<H3>{"Streaming preserves sufficient statistics"}</H3>

<Prose>{"Now suppose labeled messages arrive in batches. Which state must survive?"}</Prose>

<NaiveBayesReadingFlowFigure job="D30" phase="live" />

<Prose>{"For counts, raw class and class-word accumulators receive batches of 4, 4, 4 and 2 rows. Smoothing is a later parameter refresh; the raw store never gains a new α on each call. A loop using "}<code>{"len(rows)//4"}</code>{" discards the two-row remainder. The first "}<code>{"partial_fit"}</code>{" supplies the full intended class list, because an early batch can omit a class that appears later. Feature meanings and order remain fixed across every batch."}</Prose>

<Prose>{""}<strong>{"streaming.py — complete program."}</strong>{" Does updating in batches need to revisit earlier rows, and does accumulating old counts forget them?"}</Prose>

<RemoteCodeBlock source="/learn-code/naive-bayes-probabilistic-classifiers/streaming.py" filename="streaming.py" title={"Consume the remainder and compare sufficient statistics"} />

<Prose>{"Recorded original output (retained, not rerun):"}</Prose>

<CodeBlock language="text" kind="output" filename="streaming-output.txt" title="Recorded output">{"batch sizes: [4, 4, 4, 2]\nclass counts: [6, 8]\nsame sufficient counts: True\nsame probabilities: True\nfloor-based loop would consume: 12 of 14 rows\nThis model accumulates all fourteen rows; it does not apply a moving window."}</CodeBlock>

<Prose>{"Its retained fourteen-row output ends with six ham/eight spam, identical integer feature counts to a batch fit and matching probabilities. The floor-based loop would consume twelve rows. The new six-row companion demonstrates the same partition invariance on a different fixture and roundtrip state. Exact integer count equality and weighted floating-point close agreement are different numeric contracts."}</Prose>

<Prose>{"Gaussian state also has a compact merge, but storing uncentered "}<code>{"Σx²−(Σx)²/n"}</code>{" can subtract nearly equal large values. Store centered squared deviations "}<code>{"M2"}</code>{" with class mass and mean instead."}</Prose>

<NaiveBayesReadingFlowFigure job="D31" phase="live" />

<Prose>{"Group A contains "}<code>{"[1,2]"}</code>{": mass 2, mean 1.5, "}<code>{"M2=.5"}</code>{". Group B contains "}<code>{"[3]"}</code>{": mass 1, mean 3, "}<code>{"M2=0"}</code>{". Their mean separation is "}<code>{"δ=1.5"}</code>{"; merged mass is 3, mean 2, and between-group correction "}<code>{"δ² n_A n_B/(n_A+n_B)=1.5"}</code>{". Thus merged "}<code>{"M2=.5+0+1.5=2"}</code>{", giving raw variance "}<code>{"2/3"}</code>{"."}</Prose>

<div className="neural-equation"><MathBlock>{"n=n_A+n_B,\\quad \\delta=\\mu_B-\\mu_A,\\quad\n\\mu=\\mu_A+\\delta\\frac{n_B}{n},\\quad\nM2=M2_A+M2_B+\\delta^2\\frac{n_An_B}{n}."}</MathBlock></div>

<Prose>{"To derive the correction, write each group's deviation from the merged mean as its centered deviation plus its group-mean offset. Centered deviations sum to zero, removing cross terms. The two offset sums combine into the displayed "}<code>{"δ² n_A n_B/n"}</code>{". Empty groups contribute no mass; a singleton has zero centered squares. The same algebra works with finite nonnegative weights and mass "}<code>{"Σ weights"}</code>{", using weighted centered sums."}</Prose>

<Prose>{""}<strong>{"nb_gaussian_online.py — complete file."}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/naive-bayes-probabilistic-classifiers/nb_gaussian_online.py" filename="nb_gaussian_online.py" title={"Weighted centred-M2 state and variance-floor diagnostics — complete standalone file"} />

<Prose>{"Recorded new-program output:"}</Prose>

<CodeBlock language="json" kind="output" filename="nb_gaussian_online-output.txt" title="Recorded output">{"{\n  \"merged_n_mean_M2\": [\n    3.0,\n    [\n      2.0\n    ],\n    [\n      2.0\n    ]\n  ],\n  \"weighted_state\": {\n    \"format\": \"nb-gaussian-M2-v1\",\n    \"classes\": [\n      0,\n      1\n    ],\n    \"schema\": [\n      \"reading\",\n      \"offset\"\n    ],\n    \"units\": [\n      \"mV\",\n      \"mV\"\n    ],\n    \"variance_floor\": [\n      1e-09,\n      1e-09\n    ],\n    \"class_count\": [\n      3.0,\n      3.5\n    ],\n    \"mean\": [\n      [\n        2.1666666666666665,\n        -0.8333333333333334\n      ],\n      [\n        0.8571428571428571,\n        2.857142857142857\n      ]\n    ],\n    \"M2\": [\n      [\n        1.4166666666666665,\n        1.4166666666666665\n      ],\n      [\n        1.4285714285714284,\n        1.4285714285714286\n      ]\n    ],\n    \"priors\": null\n  },\n  \"chunks\": [\n    2,\n    3,\n    1\n  ],\n  \"probabilities\": [\n    [\n      0.9906188333548761,\n      0.00938116664512395\n    ],\n    [\n      0.9925656685809573,\n      0.007434331419042602\n    ]\n  ],\n  \"roundtrip_equal\": true,\n  \"library_epsilon_batch\": 4.666666666666667e-09,\n  \"library_epsilon_chunks\": [\n    2.5e-10,\n    1.5555555555555557e-09,\n    0.0\n  ],\n  \"library_variance_batch\": [\n    [\n      0.4722222268888888,\n      0.4722222268888888\n    ],\n    [\n      0.40816326997278907,\n      0.4081632699727891\n    ]\n  ],\n  \"library_variance_chunks\": [\n    [\n      0.4722222229074074,\n      0.4722222229074074\n    ],\n    [\n      0.40816326663945585,\n      0.40816326663945585\n    ]\n  ],\n  \"library_probability_batch\": [\n    [\n      0.9906188329255129,\n      0.00938116707448748\n    ],\n    [\n      0.99256566819433,\n      0.00743433180567009\n    ]\n  ],\n  \"library_probability_chunks\": [\n    [\n      0.9906188332985862,\n      0.009381166701414189\n    ],\n    [\n      0.9925656684981474,\n      0.007434331501852305\n    ]\n  ]\n}"}</CodeBlock>

<Prose>{"The complete file implements merge, class accumulation, diagonal likelihoods, per-feature observed masks, normalized probabilities and finite JSON state. Raw "}<code>{"M2_"}</code>{" remains unfloored. "}<code>{"_refresh"}</code>{" divides by class mass and adds the declared absolute squared-unit floor; missing likelihood factors contribute zero in log space under the stated ignorable-observation assumption. Schema and measurement units survive reload. An unobserved class has zero empirical prior until evidence arrives; externally supplied positive priors need fitted class statistics to represent a supported Gaussian class. The common "}<code>{"_refresh"}</code>{" check rejects any positive-prior class with zero fitted mass, including state restoration. A floor can stabilize a fitted singleton or constant class; it cannot supply an unobserved class's missing mean and distribution."}</Prose>

<Prose>{"The new six-row weighted comparison processes chunks 2,3,1 and checks mean/M2 against a batch's centered statistics, plus a JSON roundtrip. GaussianNB's "}<code>{"theta_"}</code>{" agrees with the weighted mean; "}<code>{"var_−epsilon_"}</code>{" matches the raw batch variance. Its displayed epsilon values refresh across chunks, so smoothed batch and chunked variances/probabilities can differ. This is an API diagnostic beside the same mathematical raw merge, not a claim that every smoothing policy has partition invariance."}</Prose>

<NeuralTable caption={"Streaming preserves sufficient statistics"} headers={[<>{"Operation"}</>,<>{"Work excluding tokenization"}</>,<>{"Stored model state"}</>]} rows={[[<>{"Sparse class-count fit"}</>,<>{""}<code>{"O(n+nnz+KV)"}</code>{""}</>,<>{""}<code>{"O(KV+K)"}</code>{""}</>],[<>{"One sparse count/presence query"}</>,<>{""}<code>{"O(Kq+K)"}</code>{" after parameter refresh"}</>,<>{"Parameters and current query"}</>],[<>{"Categorical fit/query"}</>,<>{""}<code>{"O(nd+Σ_j KM_j)"}</code>{" / "}<code>{"O(Kd)"}</code>{""}</>,<>{"Per-feature category tables"}</>],[<>{"Gaussian fit/query"}</>,<>{""}<code>{"O(nd+Kd)"}</code>{" / "}<code>{"O(Kd)"}</code>{""}</>,<>{"Means, centered squares, mass and floor"}</>],[<>{"Gaussian state merge"}</>,<>{""}<code>{"O(Kd)"}</code>{" after new batch statistics"}</>,<>{"Same fixed parameter dimensions"}</>]]} />

<Prose>{"These are operation counts, not measured timings or universal optimality claims. Libraries include allocation and parameter-refresh work. The useful streaming property is that previous rows need not be revisited. A cumulative model keeps all old evidence; it does not automatically forget stale language. A validated recent-data window or explicit decay/weighting changes that policy. Fixed hashing can bound dimensions, but collisions mix feature meanings; signed hashing also conflicts with nonnegative count inputs unless configured otherwise."}</Prose>

<H3>{"A changed prior is different from a changed likelihood"}</H3>

<Prose>{"What if spam becomes more prevalent while its language stays the same?"}</Prose>

<NaiveBayesReadingFlowFigure job="D32" phase="live" />

<Prose>{"Hold the fitted class likelihoods fixed and move only the prior log-odds contribution. For nonzero priors, deployment odds obey"}</Prose>

<div className="neural-equation"><MathBlock>{"\\log O_{\\rm new}(x)=\\log O_{\\rm old}(x)+\n\\log\\frac{\\pi_{{\\rm new},1}/\\pi_{{\\rm new},0}}{\\pi_{{\\rm old},1}/\\pi_{{\\rm old},0}}."}</MathBlock></div>

<Prose>{"The same likelihood ratio now starts from a different baseline odds. This is justified when "}<code>{"P(x|c)"}</code>{" remains stable in the same representation and we have appropriate prior information. The changed-conditional fixture moves a class likelihood instead: new spam vocabulary or a changed feature schema cannot be repaired by an intercept adjustment alone. Identify which relationship changed before deciding to retrain, revise representation or adjust prevalence."}</Prose>

<H3>{"Apply the workflow to official email features"}</H3>

<Prose>{"The tiny text corpora were designed for hand calculation. Does a declared model workflow find useful signal in collected mail? The UCI "}<strong>{"Spambase"}</strong>{" dataset by Hopkins, Reeber, Forman and Suermondt contains 4,601 historical email records, with 57 features and ham/spam labels. Its openly licensed official payload is included offline with names, original documentation, attribution and license."}</Prose>

<Prose>{"Look at the feature units before the split and comparison."}</Prose>

<NaiveBayesReadingFlowFigure job="D33" phase="live" />

<Prose>{"The first 48 features are word percentages; the next six are character percentages; the last three give average, longest and total uninterrupted capital-letter-run measurements. A percentage is not an integer token count. Without the original denominator, multiplying a percentage as though it were a count changes the event interpretation. We compare different legitimate representations: Gaussian on 57 raw or log1p features, Bernoulli on 54 positive-frequency indicators, and logistic regression on 57 scaled raw features. MNB and Complement remain the text-count experiments, rather than being given an invented physical count interpretation here."}</Prose>

<Prose>{"Group exact identical 57-feature vectors "}<strong>{"without labels"}</strong>{". There are 4,207 groups and three groups with conflicting labels; retain every row and conflict. Use GroupShuffleSplit seed 71 for development/test and seed 73 for train/validation inside development. The accepted role identities are:"}</Prose>

<NeuralTable caption={"Apply the workflow to official email features"} headers={[<>{"Role"}</>,<>{"Rows"}</>,<>{"Ham"}</>,<>{"Spam"}</>,<>{"Fitting allowed"}</>]} rows={[[<>{"Training"}</>,<>{"2811"}</>,<>{"1682"}</>,<>{"1129"}</>,<>{"Representation/scaler and estimator"}</>],[<>{"Validation"}</>,<>{"890"}</>,<>{"547"}</>,<>{"343"}</>,<>{"Candidate selection only"}</>],[<>{"Test"}</>,<>{"900"}</>,<>{"559"}</>,<>{"341"}</>,<>{"Prefrozen reports only"}</>]]} />

<Prose>{"These are group splits, not stratified splits. Both classes happen to be present in each. Group conservation prevents exact-vector overlap while retaining conflicting labels; it cannot guarantee independence of campaigns or near duplicates. The dataset includes personalized ham indicators such as george and 650 and lacks the sender/campaign/time information needed to establish modern deployment validity. The actual numeric file has no missing entries; UCI's webpage marks missingness “Yes” while the bundled documentation says “None.” The delivered payload and its identity determine this loader's contract; no undocumented cleanup is applied."}</Prose>

<Prose>{"We predeclared twelve candidates, with validation mean negative log probability as the primary selection metric and first-declared tie handling at tolerance "}<code>{"10^−12"}</code>{". StandardScaler fits training only. Gaussian settings are "}<code>{"10^−11,10^−9,10^−7"}</code>{" for raw57, then the same settings for log1p57. Bernoulli settings are α "}<code>{".1,1,10"}</code>{", with fixed positive-frequency indicators and "}<code>{"binarize=None"}</code>{". Logistic settings are C "}<code>{".1,1,10"}</code>{", L2/l1_ratio=0, lbfgs, max_iter 2000 and tolerance "}<code>{"10^−6"}</code>{". No calibration fit is added."}</Prose>

<Prose>{""}<strong>{"nb-spambase-study.py — complete file."}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/naive-bayes-probabilistic-classifiers/nb-spambase-study.py" filename="nb-spambase-study.py" title={"Declared offline email comparison — requires both helpers and the three delivered Spambase data/schema files; inspect the locked report for this measured run"} />

<Prose>{"Recorded fit outcomes and completed state-only report (the initial report failure and arithmetic correction are explained below):"}</Prose>

<CodeBlock language="json" kind="output" filename="nb-spambase-study-output.txt" title="Recorded output">{"{\n  \"all_validation_outcomes\": [\n    {\n      \"configuration\": {\n        \"id\": \"candidate_01\",\n        \"family\": \"Gaussian\",\n        \"representation\": \"raw57\",\n        \"var_smoothing\": 1e-11\n      },\n      \"warnings\": [],\n      \"eligible\": true,\n      \"validation\": {\n        \"log_loss\": 13.903475750371634,\n        \"accuracy\": 0.8235955056179776,\n        \"balanced_accuracy\": 0.8434423651936617,\n        \"Brier\": 0.1749022939307167,\n        \"confusion_ham_spam\": [\n          [\n            414,\n            133\n          ],\n          [\n            24,\n            319\n          ]\n        ],\n        \"precision\": [\n          0.9452054794520548,\n          0.7057522123893806\n        ],\n        \"recall\": [\n          0.7568555758683729,\n          0.9300291545189504\n        ],\n        \"f1\": [\n          0.8406091370558376,\n          0.8025157232704403\n        ],\n        \"support\": [\n          547,\n          343\n        ],\n        \"positive_actions_at_08\": 451,\n        \"cost_4_to_1_at_08\": 0.6202247191011236\n      },\n      \"iterations\": null\n    },\n    {\n      \"configuration\": {\n        \"id\": \"candidate_02\",\n        \"family\": \"Gaussian\",\n        \"representation\": \"raw57\",\n        \"var_smoothing\": 1e-09\n      },\n      \"warnings\": [],\n      \"eligible\": true,\n      \"validation\": {\n        \"log_loss\": 13.903417262231805,\n        \"accuracy\": 0.8235955056179776,\n        \"balanced_accuracy\": 0.8434423651936617,\n        \"Brier\": 0.1749021130801951,\n        \"confusion_ham_spam\": [\n          [\n            414,\n            133\n          ],\n          [\n            24,\n            319\n          ]\n        ],\n        \"precision\": [\n          0.9452054794520548,\n          0.7057522123893806\n        ],\n        \"recall\": [\n          0.7568555758683729,\n          0.9300291545189504\n        ],\n        \"f1\": [\n          0.8406091370558376,\n          0.8025157232704403\n        ],\n        \"support\": [\n          547,\n          343\n        ],\n        \"positive_actions_at_08\": 451,\n        \"cost_4_to_1_at_08\": 0.6202247191011236\n      },\n      \"iterations\": null\n    },\n    {\n      \"configuration\": {\n        \"id\": \"candidate_03\",\n        \"family\": \"Gaussian\",\n        \"representation\": \"raw57\",\n        \"var_smoothing\": 1e-07\n      },\n      \"warnings\": [],\n      \"eligible\": true,\n      \"validation\": {\n        \"log_loss\": 13.897576384637478,\n        \"accuracy\": 0.8235955056179776,\n        \"balanced_accuracy\": 0.8434423651936617,\n        \"Brier\": 0.1748837294978431,\n        \"confusion_ham_spam\": [\n          [\n            414,\n            133\n          ],\n          [\n            24,\n            319\n          ]\n        ],\n        \"precision\": [\n          0.9452054794520548,\n          0.7057522123893806\n        ],\n        \"recall\": [\n          0.7568555758683729,\n          0.9300291545189504\n        ],\n        \"f1\": [\n          0.8406091370558376,\n          0.8025157232704403\n        ],\n        \"support\": [\n          547,\n          343\n        ],\n        \"positive_actions_at_08\": 451,\n        \"cost_4_to_1_at_08\": 0.6202247191011236\n      },\n      \"iterations\": null\n    },\n    {\n      \"configuration\": {\n        \"id\": \"candidate_04\",\n        \"family\": \"Gaussian\",\n        \"representation\": \"log1p57\",\n        \"var_smoothing\": 1e-11\n      },\n      \"warnings\": [],\n      \"eligible\": true,\n      \"validation\": {\n        \"log_loss\": 10.041647954190767,\n        \"accuracy\": 0.8314606741573034,\n        \"balanced_accuracy\": 0.8487536043406655,\n        \"Brier\": 0.16709769313876374,\n        \"confusion_ham_spam\": [\n          [\n            423,\n            124\n          ],\n          [\n            26,\n            317\n          ]\n        ],\n        \"precision\": [\n          0.9420935412026726,\n          0.7188208616780045\n        ],\n        \"recall\": [\n          0.773308957952468,\n          0.924198250728863\n        ],\n        \"f1\": [\n          0.8493975903614458,\n          0.8086734693877551\n        ],\n        \"support\": [\n          547,\n          343\n        ],\n        \"positive_actions_at_08\": 440,\n        \"cost_4_to_1_at_08\": 0.5820224719101124\n      },\n      \"iterations\": null\n    },\n    {\n      \"configuration\": {\n        \"id\": \"candidate_05\",\n        \"family\": \"Gaussian\",\n        \"representation\": \"log1p57\",\n        \"var_smoothing\": 1e-09\n      },\n      \"warnings\": [],\n      \"eligible\": true,\n      \"validation\": {\n        \"log_loss\": 10.041641521860113,\n        \"accuracy\": 0.8314606741573034,\n        \"balanced_accuracy\": 0.8487536043406655,\n        \"Brier\": 0.1670976905004269,\n        \"confusion_ham_spam\": [\n          [\n            423,\n            124\n          ],\n          [\n            26,\n            317\n          ]\n        ],\n        \"precision\": [\n          0.9420935412026726,\n          0.7188208616780045\n        ],\n        \"recall\": [\n          0.773308957952468,\n          0.924198250728863\n        ],\n        \"f1\": [\n          0.8493975903614458,\n          0.8086734693877551\n        ],\n        \"support\": [\n          547,\n          343\n        ],\n        \"positive_actions_at_08\": 440,\n        \"cost_4_to_1_at_08\": 0.5820224719101124\n      },\n      \"iterations\": null\n    },\n    {\n      \"configuration\": {\n        \"id\": \"candidate_06\",\n        \"family\": \"Gaussian\",\n        \"representation\": \"log1p57\",\n        \"var_smoothing\": 1e-07\n      },\n      \"warnings\": [],\n      \"eligible\": true,\n      \"validation\": {\n        \"log_loss\": 10.040998402758792,\n        \"accuracy\": 0.8314606741573034,\n        \"balanced_accuracy\": 0.8487536043406655,\n        \"Brier\": 0.16709742669089414,\n        \"confusion_ham_spam\": [\n          [\n            423,\n            124\n          ],\n          [\n            26,\n            317\n          ]\n        ],\n        \"precision\": [\n          0.9420935412026726,\n          0.7188208616780045\n        ],\n        \"recall\": [\n          0.773308957952468,\n          0.924198250728863\n        ],\n        \"f1\": [\n          0.8493975903614458,\n          0.8086734693877551\n        ],\n        \"support\": [\n          547,\n          343\n        ],\n        \"positive_actions_at_08\": 440,\n        \"cost_4_to_1_at_08\": 0.5820224719101124\n      },\n      \"iterations\": null\n    },\n    {\n      \"configuration\": {\n        \"id\": \"candidate_07\",\n        \"family\": \"Bernoulli\",\n        \"representation\": \"presence54\",\n        \"alpha\": 0.1\n      },\n      \"warnings\": [],\n      \"eligible\": true,\n      \"validation\": {\n        \"log_loss\": 0.6360730474193523,\n        \"accuracy\": 0.8853932584269663,\n        \"balanced_accuracy\": 0.8708833232953668,\n        \"Brier\": 0.10257857485987074,\n        \"confusion_ham_spam\": [\n          [\n            511,\n            36\n          ],\n          [\n            66,\n            277\n          ]\n        ],\n        \"precision\": [\n          0.8856152512998267,\n          0.8849840255591054\n        ],\n        \"recall\": [\n          0.9341864716636198,\n          0.8075801749271136\n        ],\n        \"f1\": [\n          0.9092526690391459,\n          0.8445121951219512\n        ],\n        \"support\": [\n          547,\n          343\n        ],\n        \"positive_actions_at_08\": 294,\n        \"cost_4_to_1_at_08\": 0.21797752808988763\n      },\n      \"iterations\": null\n    },\n    {\n      \"configuration\": {\n        \"id\": \"candidate_08\",\n        \"family\": \"Bernoulli\",\n        \"representation\": \"presence54\",\n        \"alpha\": 1.0\n      },\n      \"warnings\": [],\n      \"eligible\": true,\n      \"validation\": {\n        \"log_loss\": 0.6383263068837718,\n        \"accuracy\": 0.8820224719101124,\n        \"balanced_accuracy\": 0.8675974437829455,\n        \"Brier\": 0.10332902369976638,\n        \"confusion_ham_spam\": [\n          [\n            509,\n            38\n          ],\n          [\n            67,\n            276\n          ]\n        ],\n        \"precision\": [\n          0.8836805555555556,\n          0.8789808917197452\n        ],\n        \"recall\": [\n          0.9305301645338209,\n          0.8046647230320699\n        ],\n        \"f1\": [\n          0.9065004452359751,\n          0.8401826484018264\n        ],\n        \"support\": [\n          547,\n          343\n        ],\n        \"positive_actions_at_08\": 296,\n        \"cost_4_to_1_at_08\": 0.22134831460674156\n      },\n      \"iterations\": null\n    },\n    {\n      \"configuration\": {\n        \"id\": \"candidate_09\",\n        \"family\": \"Bernoulli\",\n        \"representation\": \"presence54\",\n        \"alpha\": 10.0\n      },\n      \"warnings\": [],\n      \"eligible\": true,\n      \"validation\": {\n        \"log_loss\": 0.6497543634282107,\n        \"accuracy\": 0.8752808988764045,\n        \"balanced_accuracy\": 0.8610256847581028,\n        \"Brier\": 0.10773799076631817,\n        \"confusion_ham_spam\": [\n          [\n            505,\n            42\n          ],\n          [\n            69,\n            274\n          ]\n        ],\n        \"precision\": [\n          0.8797909407665505,\n          0.8670886075949367\n        ],\n        \"recall\": [\n          0.923217550274223,\n          0.7988338192419825\n        ],\n        \"f1\": [\n          0.9009812667261374,\n          0.8315629742033384\n        ],\n        \"support\": [\n          547,\n          343\n        ],\n        \"positive_actions_at_08\": 296,\n        \"cost_4_to_1_at_08\": 0.23258426966292134\n      },\n      \"iterations\": null\n    },\n    {\n      \"configuration\": {\n        \"id\": \"candidate_10\",\n        \"family\": \"logistic\",\n        \"representation\": \"raw57\",\n        \"C\": 0.1\n      },\n      \"warnings\": [],\n      \"eligible\": true,\n      \"validation\": {\n        \"log_loss\": 0.2359308883486588,\n        \"accuracy\": 0.9157303370786517,\n        \"balanced_accuracy\": 0.9031744847325193,\n        \"Brier\": 0.06564768410447097,\n        \"confusion_ham_spam\": [\n          [\n            524,\n            23\n          ],\n          [\n            52,\n            291\n          ]\n        ],\n        \"precision\": [\n          0.9097222222222222,\n          0.9267515923566879\n        ],\n        \"recall\": [\n          0.9579524680073126,\n          0.8483965014577259\n        ],\n        \"f1\": [\n          0.9332146037399822,\n          0.8858447488584474\n        ],\n        \"support\": [\n          547,\n          343\n        ],\n        \"positive_actions_at_08\": 247,\n        \"cost_4_to_1_at_08\": 0.16404494382022472\n      },\n      \"iterations\": [\n        32\n      ]\n    },\n    {\n      \"configuration\": {\n        \"id\": \"candidate_11\",\n        \"family\": \"logistic\",\n        \"representation\": \"raw57\",\n        \"C\": 1.0\n      },\n      \"warnings\": [],\n      \"eligible\": true,\n      \"validation\": {\n        \"log_loss\": 0.2344121299605018,\n        \"accuracy\": 0.9168539325842696,\n        \"balanced_accuracy\": 0.9073504565054018,\n        \"Brier\": 0.06175780013342721,\n        \"confusion_ham_spam\": [\n          [\n            519,\n            28\n          ],\n          [\n            46,\n            297\n          ]\n        ],\n        \"precision\": [\n          0.9185840707964602,\n          0.9138461538461539\n        ],\n        \"recall\": [\n          0.9488117001828154,\n          0.8658892128279884\n        ],\n        \"f1\": [\n          0.9334532374100719,\n          0.8892215568862275\n        ],\n        \"support\": [\n          547,\n          343\n        ],\n        \"positive_actions_at_08\": 258,\n        \"cost_4_to_1_at_08\": 0.15730337078651685\n      },\n      \"iterations\": [\n        71\n      ]\n    },\n    {\n      \"configuration\": {\n        \"id\": \"candidate_12\",\n        \"family\": \"logistic\",\n        \"representation\": \"raw57\",\n        \"C\": 10.0\n      },\n      \"warnings\": [\n        {\n          \"type\": \"RuntimeWarning\",\n          \"message\": \"divide by zero encountered in log\"\n        }\n      ],\n      \"eligible\": false,\n      \"failure\": {\n        \"type\": \"ValueError\",\n        \"message\": \"Use finite normalized log probabilities in [ham, spam] order\"\n      }\n    }\n  ],\n  \"overall_winner\": \"candidate_11\",\n  \"family_winners\": {\n    \"Gaussian\": \"candidate_06\",\n    \"Bernoulli\": \"candidate_07\",\n    \"logistic\": \"candidate_11\"\n  },\n  \"test_reports\": {\n    \"prior\": {\n      \"log_loss\": 0.6646012695366184,\n      \"accuracy\": 0.6211111111111111,\n      \"balanced_accuracy\": 0.5,\n      \"Brier\": 0.23584954931548038,\n      \"confusion_ham_spam\": [\n        [\n          559,\n          0\n        ],\n        [\n          341,\n          0\n        ]\n      ],\n      \"precision\": [\n        0.6211111111111111,\n        0.0\n      ],\n      \"recall\": [\n        1.0,\n        0.0\n      ],\n      \"f1\": [\n        0.7662782727895819,\n        0.0\n      ],\n      \"support\": [\n        559,\n        341\n      ],\n      \"positive_actions_at_08\": 0,\n      \"cost_4_to_1_at_08\": 0.3788888888888889\n    },\n    \"Gaussian\": {\n      \"candidate\": \"candidate_06\",\n      \"log_loss\": 10.677199312028879,\n      \"accuracy\": 0.8377777777777777,\n      \"balanced_accuracy\": 0.8591168771213783,\n      \"Brier\": 0.15920021736295575,\n      \"confusion_ham_spam\": [\n        [\n          431,\n          128\n        ],\n        [\n          18,\n          323\n        ]\n      ],\n      \"precision\": [\n        0.9599109131403119,\n        0.7161862527716186\n      ],\n      \"recall\": [\n        0.7710196779964222,\n        0.9472140762463344\n      ],\n      \"f1\": [\n        0.8551587301587301,\n        0.8156565656565656\n      ],\n      \"support\": [\n        559,\n        341\n      ],\n      \"positive_actions_at_08\": 446,\n      \"cost_4_to_1_at_08\": 0.5666666666666667\n    },\n    \"Bernoulli\": {\n      \"candidate\": \"candidate_07\",\n      \"log_loss\": 0.49429887447815796,\n      \"accuracy\": 0.8911111111111111,\n      \"balanced_accuracy\": 0.8780341938631511,\n      \"Brier\": 0.09421040277750808,\n      \"confusion_ham_spam\": [\n        [\n          521,\n          38\n        ],\n        [\n          60,\n          281\n        ]\n      ],\n      \"precision\": [\n        0.8967297762478486,\n        0.8808777429467085\n      ],\n      \"recall\": [\n        0.9320214669051878,\n        0.8240469208211144\n      ],\n      \"f1\": [\n        0.9140350877192982,\n        0.8515151515151516\n      ],\n      \"support\": [\n        559,\n        341\n      ],\n      \"positive_actions_at_08\": 299,\n      \"cost_4_to_1_at_08\": 0.21888888888888888\n    },\n    \"logistic\": {\n      \"candidate\": \"candidate_11\",\n      \"log_loss\": 0.22066538208005895,\n      \"accuracy\": 0.9277777777777778,\n      \"balanced_accuracy\": 0.9218467204213641,\n      \"Brier\": 0.05909118643146604,\n      \"confusion_ham_spam\": [\n        [\n          529,\n          30\n        ],\n        [\n          35,\n          306\n        ]\n      ],\n      \"precision\": [\n        0.9379432624113475,\n        0.9107142857142857\n      ],\n      \"recall\": [\n        0.9463327370304114,\n        0.8973607038123167\n      ],\n      \"f1\": [\n        0.9421193232413179,\n        0.9039881831610044\n      ],\n      \"support\": [\n        559,\n        341\n      ],\n      \"positive_actions_at_08\": 267,\n      \"cost_4_to_1_at_08\": 0.17666666666666667\n    }\n  },\n  \"reload_parity\": {\n    \"Gaussian\": {\n      \"max_test_log_difference\": 8.731149137020111e-11,\n      \"edited_raw_case\": [\n        1.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        2.0,\n        4.0,\n        8.0\n      ],\n      \"edited_probabilities\": [\n        [\n          1.0927845306514725e-09,\n          0.9999999989072155\n        ]\n      ]\n    },\n    \"Bernoulli\": {\n      \"max_test_log_difference\": 2.842170943040401e-14,\n      \"edited_raw_case\": [\n        1.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        2.0,\n        4.0,\n        8.0\n      ],\n      \"edited_probabilities\": [\n        [\n          0.9999233867762818,\n          7.661322371817038e-05\n        ]\n      ]\n    },\n    \"logistic\": {\n      \"max_test_log_difference\": 0.0,\n      \"edited_raw_case\": [\n        1.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        0.0,\n        2.0,\n        4.0,\n        8.0\n      ],\n      \"edited_probabilities\": [\n        [\n          0.7943067968579873,\n          0.2056932031420126\n        ]\n      ]\n    }\n  }\n}"}</CodeBlock>

<Prose>{"Save this file with "}<code>{"nb_discrete_core.py"}</code>{", "}<code>{"nb_gaussian_online.py"}</code>{", "}<code>{"spambase.data"}</code>{", "}<code>{"spambase.names"}</code>{", "}<code>{"spambase.DOCUMENTATION"}</code>{", "}<code>{"spambase-provenance.md"}</code>{" and "}<code>{"SPAMBASE-LICENSE.txt"}</code>{" in one directory and run "}<code>{"python nb-spambase-study.py"}</code>{". The loader validates official file hashes and exact role-index hashes before fitting. An exclusive output guard preserves an existing or interrupted run; use the retained results for inspection instead of overwriting them. The installed 1.9.1 logistic API uses "}<code>{"l1_ratio=0"}</code>{" for L2; its old penalty argument is deprecated. This is the executed API snapshot."}</Prose>

<Prose>{"All actual validation outcomes remain visible, including the failure:"}</Prose>

<NeuralTable caption={"Apply the workflow to official email features"} headers={[<>{"Candidate"}</>,<>{"Family and representation"}</>,<>{"Setting"}</>,<>{"Validation log loss"}</>,<>{"Eligibility"}</>]} rows={[[<>{"01"}</>,<>{"Gaussian raw57"}</>,<>{"1e−11"}</>,<>{"13.903476"}</>,<>{"yes"}</>],[<>{"02"}</>,<>{"Gaussian raw57"}</>,<>{"1e−9"}</>,<>{"13.903417"}</>,<>{"yes"}</>],[<>{"03"}</>,<>{"Gaussian raw57"}</>,<>{"1e−7"}</>,<>{"13.897576"}</>,<>{"yes"}</>],[<>{"04"}</>,<>{"Gaussian log1p57"}</>,<>{"1e−11"}</>,<>{"10.041648"}</>,<>{"yes"}</>],[<>{"05"}</>,<>{"Gaussian log1p57"}</>,<>{"1e−9"}</>,<>{"10.041642"}</>,<>{"yes"}</>],[<>{"06"}</>,<>{"Gaussian log1p57"}</>,<>{"1e−7"}</>,<>{"10.040998"}</>,<>{"family selected"}</>],[<>{"07"}</>,<>{"Bernoulli presence54"}</>,<>{"α=.1"}</>,<>{".636073"}</>,<>{"family selected"}</>],[<>{"08"}</>,<>{"Bernoulli presence54"}</>,<>{"α=1"}</>,<>{".638326"}</>,<>{"yes"}</>],[<>{"09"}</>,<>{"Bernoulli presence54"}</>,<>{"α=10"}</>,<>{".649754"}</>,<>{"yes"}</>],[<>{"10"}</>,<>{"Logistic raw57"}</>,<>{"C=.1"}</>,<>{".235931"}</>,<>{"yes"}</>],[<>{"11"}</>,<>{"Logistic raw57"}</>,<>{"C=1"}</>,<>{".234412"}</>,<>{"overall/family selected"}</>],[<>{"12"}</>,<>{"Logistic raw57"}</>,<>{"C=10"}</>,<>{"undefined under this API route"}</>,<>{"no: nonfinite log output"}</>]]} />

<Prose>{"Candidate 12's probability-before-log route emitted a divide-by-zero warning and failed the finite-log criterion. Its outcome remains failed; it was not retried with a new setting or rescued into the search. The overall winner 11 and family winners 06/07/11 were written to a validation lock before any test reporting, with every fitted model retained from the 2,811 training rows. No train-plus-validation refit occurs."}</Prose>

<Prose>{"The selected logistic model also exposed probability rounding during test reporting: its library "}<code>{"predict_log_proba"}</code>{" logs "}<code>{"predict_proba"}</code>{", which can round a saturated probability to zero. The finite decision score still defines valid log odds. Reporting from the already saved state uses "}<code>{"log p_0=−logaddexp(0,s)"}</code>{" and "}<code>{"log p_1=−logaddexp(0,−s)"}</code>{" without clipping or changing coefficients. The original failed invocation and its source are retained; a bounded state-only continuation completed the report with zero refits and zero candidate retries. Validation outcomes and selection remain exactly as locked. The displayed file incorporates this test-report arithmetic repair; its corrected report route is checked against reloaded state."}</Prose>

<NeuralTable caption={"Apply the workflow to official email features"} headers={[<>{"Prefrozen test route"}</>,<>{"Accuracy"}</>,<>{"Balanced accuracy"}</>,<>{"Log loss"}</>,<>{"Brier"}</>,<>{"Confusion "}<code>{"[ham row, spam row]"}</code>{""}</>]} rows={[[<>{"Training prior"}</>,<>{".621111"}</>,<>{".500000"}</>,<>{".664601"}</>,<>{".235850"}</>,<>{""}<code>{"[[559,0],[341,0]]"}</code>{""}</>],[<>{"Gaussian 06"}</>,<>{".837778"}</>,<>{".859117"}</>,<>{"10.677199"}</>,<>{".159200"}</>,<>{""}<code>{"[[431,128],[18,323]]"}</code>{""}</>],[<>{"Bernoulli 07"}</>,<>{".891111"}</>,<>{".878034"}</>,<>{".494299"}</>,<>{".094210"}</>,<>{""}<code>{"[[521,38],[60,281]]"}</code>{""}</>],[<>{"Logistic 11"}</>,<>{".927778"}</>,<>{".921847"}</>,<>{".220665"}</>,<>{".059091"}</>,<>{""}<code>{"[[529,30],[35,306]]"}</code>{""}</>]]} />

<Prose>{"The Gaussian model detects many spam cases—recall "}<code>{".947214"}</code>{"—but assigns extreme incorrect probabilities, producing far worse log loss than the prior baseline. Brier and classification accuracy expose different aspects of the same prediction records. Bernoulli discards frequencies/capital features, yet has a better probability score in this comparison. We therefore describe a family "}<strong>{"and representation"}</strong>{", rather than attributing all differences to one algorithm alone. Logistic is the prefrozen overall choice on validation; test observations report its generalization on this historical group split."}</Prose>

<Prose>{"At the separately declared "}<code>{"4:1"}</code>{" cost threshold "}<code>{".8"}</code>{", positive action counts are 0/446/299/267 for prior/Gaussian/Bernoulli/logistic and realized per-case costs "}<code>{".378889/.566667/.218889/.176667"}</code>{". The Gaussian threshold cost is also worse than the prior baseline. No model name certifies useful probabilities at an operational threshold."}</Prose>

<Prose>{"Frozen state stores scaler mean/scale, feature order, estimator parameters, class order and representation. Bernoulli and Gaussian state reconstruct scratch likelihoods without new fitting; logistic reconstructs its linear decision score. Their maximum test log-probability differences from the corresponding library report routes are approximately "}<code>{"8.73×10^−11"}</code>{", "}<code>{"2.84×10^−14"}</code>{" and zero. The supplied edited raw vector has make percentage 1, other percentages zero and capital fields "}<code>{"[2,4,8]"}</code>{": computed spam probabilities are "}<code>{".999999998907"}</code>{", "}<code>{".0000766132"}</code>{" and "}<code>{".205693203142"}</code>{". It has no observed label, does not change the test records and is not asserted to reconstruct an actual message. The huge disagreement is useful model inspection, not an extra evaluated test outcome."}</Prose>

<H2>{"9. Check probabilities before choosing actions"}</H2>

<Prose>{"The real-data comparison shows why class accuracy and probability quality need separate assessment. A number computed by Bayes' rule is a model posterior. "}<strong>{"Calibration"}</strong>{" asks whether cases assigned positive probability p have long-run positive frequency p. A classifier can rank cases well while reporting probabilities that are too extreme or moderate."}</Prose>

<Prose>{"Look at actual case IDs joining bins before any reliability point appears."}</Prose>

<NaiveBayesReadingFlowFigure job="D34" phase="live" />

<Prose>{"For each nonempty bin, calculate mean predicted probability and observed positive fraction, then plot that pair against the diagonal equality line. The case count matters: one case gives observed fraction zero or one regardless of whether its probability estimate was reasonable. An empty bin has no point. Changing two to six bins changes the grouping and curve, but not any individual prediction, Brier loss or log loss. The twelve-case investigation keeps every case's current prediction/outcome visible. The optional compression "}<code>{".15+.7p"}</code>{" changes predictions and therefore proper losses; it is a different operation from changing bins. Select a bin to trace its exact memberships."}</Prose>

<Prose>{"Finite bin points estimate reliability over ranges rather than proving exact conditional calibration. A curve can hide subgroup differences, and changing bin edges can make a small dataset appear more or less diagonal without improving its predictions. Use case counts and proper scores alongside it."}</Prose>

<H3>{"Proper losses reward truthful probabilities"}</H3>

<Prose>{"Section 6 introduced a single probability-error square. Why should the average square be smallest at the true probability? Hold a feature situation x fixed, with true positive frequency "}<code>{"q=P(Y=1|x)"}</code>{", and let the model choose p."}</Prose>

<NaiveBayesReadingFlowFigure job="D35" phase="live" />

<Prose>{"The expected Brier curve is a parabola whose minimum lies at q. With q "}<code>{".3"}</code>{", moving p away from "}<code>{".3"}</code>{" adds the squared distance "}<code>{"(p−q)²"}</code>{" to the fixed irreducible term "}<code>{"q(1−q)=.21"}</code>{". A separate outcome square still shows the realized "}<code>{"(p−y)²"}</code>{", so population expectation and one observation stay distinct."}</Prose>

<Prose>{"Expand the conditional expectation directly. Since binary "}<code>{"Y²=Y"}</code>{" and "}<code>{"E[Y|x]=q"}</code>{","}</Prose>

<div className="neural-equation"><MathBlock>{"E[(p-Y)^2\\mid x]=p^2-2pq+q=(p-q)^2+q(1-q)."}</MathBlock></div>

<Prose>{"The second term is fixed for this population. The first is nonnegative and vanishes exactly at "}<code>{"p=q"}</code>{", making Brier a "}<strong>{"proper probability score"}</strong>{". Binary log loss is "}<code>{"−y log p−(1−y)log(1−p)"}</code>{". Its conditional expectation is"}</Prose>

<div className="neural-equation"><MathBlock>{"-q\\log p-(1-q)\\log(1-p)\n=H(q)+D_{\\rm KL}(\\operatorname{Bern}(q)\\Vert\\operatorname{Bern}(p)),"}</MathBlock></div>

<Prose>{"where "}<code>{"H(q)=−q log q−(1−q)log(1−q)"}</code>{" is Bernoulli entropy and the remaining term is the sum of "}<code>{"q log(q/p)"}</code>{" and "}<code>{"(1−q)log((1−q)/(1−p))"}</code>{". KL is nonnegative, with equality when the Bernoulli laws agree; equivalently, differentiating expected log loss gives "}<code>{"(p−q)/(p(1−p))"}</code>{", negative below q and positive above it. The endpoints use limiting conventions: reporting zero for an event that occurs gives infinite mathematical loss. Clipping a reported probability is an explicit finite-report convention. The Spambase report instead uses stable log probabilities from score arithmetic, retaining finite extreme logs even when exponentiating them rounds a probability to zero."}</Prose>

<Prose>{"Proper loss includes information/resolution as well as reliability. A constant prior can be calibrated for the whole population but cannot distinguish cases. A useful ranking with imperfect probabilities can still have lower proper loss. Aggregate calibration does not imply subgroup calibration or equality with the posterior given every available feature. "}<a href={"/learn/path/full-curriculum/calibration-conformal-prediction"}>{"Calibration & Conformal Prediction"}</a>{" develops these distinct reliability and coverage questions."}</Prose>

<H3>{"Fit a mapping from predictions made on new rows"}</H3>

<Prose>{"Can we repair the relation between model scores and frequencies? A calibrator fits that mapping, and therefore needs its own honest input/target boundary."}</Prose>

<NaiveBayesReadingFlowFigure job="D36" phase="live" />

<Prose>{"The retained experiment has 800 base-fit rows, 800 separate calibration rows and 1,200 test rows. Fit the base on the first stack; freeze it; make predictions on the second stack to fit the mapping; compare both routes on the third. Targets enter only the corresponding fitting ports. For text, freeze the whole pipeline or keep preprocessing inside each calibration fold; freezing only the classifier while refitting vocabulary would change the base being calibrated."}</Prose>

<Prose>{"What kinds of mapping can those new predictions teach?"}</Prose>

<NaiveBayesReadingFlowFigure job="D37" phase="live" />

<Prose>{"A sigmoid fits a compact two-parameter curve of the "}<strong>{"supplied score"}</strong>{". An isotonic mapping sorts cases by score and pools adjacent groups when their estimated positive rates decrease. Two equally sized groups with rates "}<code>{".4"}</code>{" then "}<code>{".2"}</code>{" violate nondecreasing order; pooling produces "}<code>{".3"}</code>{" for both. A flexible step map can fit small calibration samples too closely. The curve picture is an illustrative mapping shape; the original reported sigmoid range comes from its saved experiment, rather than being asserted by the toy curve."}</Prose>

<Prose>{"Inspect the actual score interface. In the tested scikit-learn version, CalibratedClassifierCV uses "}<code>{"decision_function"}</code>{" when available, otherwise predicted probabilities. GaussianNB lacks a decision function, so the fitted sigmoid receives its probabilities. It is not automatically a sigmoid of the original log-odds difference. Saturated probabilities can discard distinctions still present in scores. The "}<a href={"/learn/path/full-curriculum/support-vector-machines-svm#8-scores-probabilities-classes-and-data-contracts"}>{"published SVM interface"}</a>{" is a contrasting margin route, whose numerical value is also not a probability."}</Prose>

<Prose>{""}<strong>{"calibrated-report.py — complete program."}</strong>{" Can calibration change an argmax, and does one lower Brier score establish calibration for every subgroup?"}</Prose>

<RemoteCodeBlock source="/learn-code/naive-bayes-probabilistic-classifiers/calibrated-report.py" filename="calibrated-report.py" title={"Separate base fitting, probability calibration and the final report"} />

<Prose>{"Recorded original output (retained, not rerun):"}</Prose>

<CodeBlock language="text" kind="output" filename="calibrated-report-output.txt" title="Recorded output">{"prior-only accuracy 0.7067 Brier 0.208372 log loss 0.607620\nraw duplicate GNB accuracy 0.8000 Brier 0.147984 log loss 0.506139\nsigmoid calibrated accuracy 0.8158 Brier 0.131472 log loss 0.416519\nchanged .5 decisions: 63\nmean prediction by nonempty bin: [0.1067, 0.2888, 0.5091, 0.7329]\nobserved positive fractions: [0.0861, 0.2727, 0.4356, 0.7138]\nbin sizes: [674, 121, 101, 304, 0]\ndeclared-cost threshold: 0.8 realized test cost per case: 0.293333\nFixed synthetic law and seed; finite test metrics do not guarantee future calibration."}</CodeBlock>

<Prose>{"This retained synthetic law draws one reading, shifted by 1.5 for class 1, then copies it into two identical columns. Rows are independent; columns in a row are copied evidence. "}<code>{"FrozenEstimator(base)"}</code>{" freezes the fitted Gaussian model, and the separate calibration targets fit only its sigmoid mapping. At seed 2026, the mapping changes 63 decisions at "}<code>{".5"}</code>{", raises accuracy "}<code>{".8000→.8158"}</code>{", and lowers Brier "}<code>{".147984→.131472"}</code>{". The full recorded output includes its losses, bin predictions/fractions/counts and operating threshold."}</Prose>

<Prose>{"Its sigmoid places no test predictions in "}<code>{"[.8,1]"}</code>{". At the separately declared "}<code>{".8"}</code>{" action threshold it therefore takes no positive actions, incurring the observed positive fraction as its per-case cost. Keep that operating limitation beside the improved global scores. Choosing a mapping using this final test would require a new untouched evaluation; calibration itself does not promise an improvement for every metric, group or distribution."}</Prose>

<Prose>{"Cross-validation calibration uses fresh complete base estimators in folds and their held-out predictions. An ensemble configuration averages calibrated fold-pair predictions; another configuration fits a mapping on out-of-fold predictions and refits a base on all development rows. Their outputs need not equal this simple three-way split. Class coverage and fitted preprocessing remain part of each route's contract."}</Prose>

<H3>{"Choose the action after identifying its costs"}</H3>

<Prose>{"We have a positive probability; what decision should it support? Suppose flagging ordinary mail costs "}<code>{"C_FP"}</code>{", allowing junk costs "}<code>{"C_FN"}</code>{", and correct decisions have zero cost. Draw the two expected costs before solving the threshold."}</Prose>

<NaiveBayesReadingFlowFigure job="D38" phase="live" />

<Prose>{"At probability p, flagging costs "}<code>{"C_FP(1−p)"}</code>{" and allowing costs "}<code>{"C_FN p"}</code>{". The lines cross when those quantities agree. With costs "}<code>{"4:1"}</code>{", their equality is at "}<code>{".8"}</code>{". At p "}<code>{".75"}</code>{", the preferred class is spam, but flagging's cost is "}<code>{"4×.25=1"}</code>{", larger than allowing's cost "}<code>{".75"}</code>{". The action is allow under this specified cost model. Identity marks for classes are separate from the action and from cost line labels."}</Prose>

<div className="neural-equation"><MathBlock>{"C_{\\rm FP}(1-p)<C_{\\rm FN}p\n\\ \\Longleftrightarrow\\ p>\\frac{C_{\\rm FP}}{C_{\\rm FP}+C_{\\rm FN}}."}</MathBlock></div>

<Prose>{"At equality our policy chooses the negative action. Change p and either positive cost in the lab; line heights, current costs and action update together. The rule minimizes expected cost relative to the probability/cost information actually supplied. If p is badly estimated, or costs depend on case details absent from the model, that information needs repair. A threshold does not calibrate a probability, and a monotone calibrator can move a case across a fixed threshold while preserving ranking."}</Prose>

<H2>{"10. Connect the model to deeper ideas"}</H2>

<Prose>{"We can now fit, preserve, diagnose and act on class evidence. Three connections help explain the structure beneath these variants: linear log odds, uncertainty shared across future tokens, and likelihoods of different measurement types."}</Prose>

<H3>{"The training objective is not determined by the boundary shape"}</H3>

<Prose>{"Return to the token counts of free and meeting. Where do their odds tie?"}</Prose>

<NaiveBayesReadingFlowFigure job="D39" phase="live" />

<Prose>{"The two axes are nonnegative token counts. With the five-word smoothed tables, each free adds "}<code>{"log(28/11)"}</code>{" and each meeting adds "}<code>{"log(7/22)"}</code>{" to prior log odds "}<code>{"log 2"}</code>{". The zero-odds line is the set of count pairs whose positive and negative contributions cancel. A probe's bar decomposition and coordinate position therefore use the same counts. Reordering columns moves their identity labels, not their assigned weights or the score."}</Prose>

<div className="neural-equation"><MathBlock>{"\\log\\frac{P(1\\mid x)}{P(0\\mid x)}\n=\\log\\frac{\\pi_1}{\\pi_0}+\\sum_jx_j\\log\\frac{\\theta_{1j}}{\\theta_{0j}}\n=b+w^Tx."}</MathBlock></div>

<Prose>{"MNB's fixed-table log odds are linear in count coordinates. Fitting still maximizes a joint likelihood through class statistics; logistic fits conditional log loss, and SVM fits a regularized margin objective. The same functional family does not identify the objective or force the coefficients to agree. Section 5's unequal Gaussian variances contrast this with quadratic score ratios."}</Prose>

<Prose>{"Using nonnegative fractional TF–IDF values in the same sum can be a useful validated scoring extension. A noninteger vector is not a literal multinomial count event: its factorial multiplicity and physical draw interpretation have changed. N-gram features restore some local order while overlapping n-grams also introduce dependencies. State the representation, compare it inside development folds and assess probability behavior after the change."}</Prose>

<H3>{"Deeper: integrate one shared uncertain composition"}</H3>

<Prose>{"Section 3's Dirichlet posterior mean predicts one token. Does multiplying that mean predict a whole future document? The future tokens share the same unknown composition, so average their complete likelihood together."}</Prose>

<NaiveBayesReadingFlowFigure job="D40" phase="live" />

<Prose>{"For posterior shapes "}<code>{"(4,1)"}</code>{", the composition axis describes uncertainty about the probability of A. The plug-in branch fixes it at mean "}<code>{"4/5"}</code>{", giving AA probability "}<code>{"(4/5)²=16/25=.64"}</code>{". The integrated branch shares the uncertain composition between both future positions and gives "}<code>{"(4/5)(5/6)=2/3"}</code>{". The second factor is a predictive factoring of the joint law, not a fit on an observed test label. At any fixed θ the two draws remain independent; averaging over that shared θ induces dependence."}</Prose>

<Prose>{"Let "}<code>{"A_j>0"}</code>{" be posterior Dirichlet shapes and "}<code>{"A_0=Σ A_j"}</code>{". Define the rising product "}<code>{"a^(overline m)=a(a+1)…(a+m−1)"}</code>{", with the zero-length product one. Integrating the count event gives"}</Prose>

<div className="neural-equation"><MathBlock>{"P(x\\mid\\mathrm{training})=\n\\frac{N!}{\\prod_jx_j!}\\frac{\\prod_jA_j^{\\overline{x_j}}}{A_0^{\\overline N}}."}</MathBlock></div>

<Prose>{"Here is why: the Dirichlet density has power exponents "}<code>{"A_j−1"}</code>{" and normalizer "}<code>{"B(A)=∏Γ(A_j)/Γ(A_0)"}</code>{". Multiplying by "}<code>{"∏θ_j^x_j"}</code>{" changes its exponents to "}<code>{"A_j+x_j−1"}</code>{"; integration over the simplex gives "}<code>{"B(A+x)/B(A)"}</code>{". The gamma identity "}<code>{"Γ(a+m)/Γ(a)=a^(overline m)"}</code>{" yields the rising products. Restore the multinomial coefficient to count all equivalent token orders. For one token, the ratio reduces to "}<code>{"A_j/A_0"}</code>{", exactly the posterior mean used earlier."}</Prose>

<Prose>{""}<strong>{"count-law.py — complete program."}</strong>{" Why can the multinomial coefficient be dropped for classification but not from an actual count probability?"}</Prose>

<RemoteCodeBlock source="/learn-code/naive-bayes-probabilistic-classifiers/count-law.py" filename="count-law.py" title={"Separate ordered tokens, count vectors and integrated prediction"} />

<Prose>{"Recorded original output (retained, not rerun):"}</Prose>

<CodeBlock language="text" kind="output" filename="count-law-output.txt" title="Recorded output">{"ordered AB: 4/25\none A and one B: 8/25\nthree-token masses: ['1/125', '12/125', '48/125', '64/125']\nsum: 1\ncounts [2, 0] plug-in: 16/25 integrated: 2/3\ncounts [1, 1] plug-in: 8/25 integrated: 4/15\nequal-prior class0 posterior, plug-in: 16/17\nequal-prior class0 posterior, integrated: 10/11"}</CodeBlock>

<Prose>{"The original exact integer-shape program distinguishes AB from its count event, checks all three-token count masses sum to one, and compares plug-in and integrated class normalization. Equal-prior class shapes "}<code>{"(4,1),(1,4)"}</code>{" give AA posterior "}<code>{"16/17"}</code>{" under plug-in tables and "}<code>{"10/11"}</code>{" under integration. Integration increases both classes' repeated-token mass differently; it does not simply increase every final class posterior."}</Prose>

<Prose>{"Larger counts and fractional positive shapes make gamma "}<strong>{"logs"}</strong>{" preferable to factorials. The complete new route implements"}</Prose>

<div className="neural-equation"><MathBlock>{"\\log P(x)=\\log N!-\\sum_j\\log x_j!+\\log\\Gamma(A_0)-\\log\\Gamma(A_0+N)\n+\\sum_j[\\log\\Gamma(A_j+x_j)-\\log\\Gamma(A_j)]."}</MathBlock></div>

<Prose>{""}<strong>{"nb-integrated-predictive.py — complete file."}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/naive-bayes-probabilistic-classifiers/nb-integrated-predictive.py" filename="nb-integrated-predictive.py" title={"Exact Fraction, log-gamma and ordinary integrated count prediction"} />

<Prose>{"Recorded new-program output:"}</Prose>

<CodeBlock language="json" kind="output" filename="nb-integrated-predictive-output.txt" title="Recorded output">{"{\n  \"cases\": [\n    {\n      \"counts\": [\n        2,\n        0\n      ],\n      \"shapes\": [\n        4,\n        1\n      ],\n      \"log_mass\": -0.4054651081081646,\n      \"library_log_mass\": -0.4054651081081646,\n      \"probability\": 0.6666666666666665,\n      \"exact_mass\": \"2/3\"\n    },\n    {\n      \"counts\": [\n        1,\n        1\n      ],\n      \"shapes\": [\n        4,\n        1\n      ],\n      \"log_mass\": -1.3217558399823193,\n      \"library_log_mass\": -1.3217558399823193,\n      \"probability\": 0.2666666666666667,\n      \"exact_mass\": \"4/15\"\n    },\n    {\n      \"counts\": [\n        3,\n        2\n      ],\n      \"shapes\": [\n        0.5,\n        1.25\n      ],\n      \"log_mass\": -2.235049492505072,\n      \"library_log_mass\": -2.2350494925050723,\n      \"probability\": 0.10698683467562194,\n      \"exact_mass\": \"3600/33649\"\n    },\n    {\n      \"counts\": [\n        100,\n        80,\n        20\n      ],\n      \"shapes\": [\n        0.5,\n        1.25,\n        2.75\n      ],\n      \"log_mass\": -12.926619105835016,\n      \"library_log_mass\": -12.926619105835094,\n      \"probability\": 2.4324316891863183e-06,\n      \"exact_mass\": \"13201541548135606298057344212329493589302475186689141942456799577534355815581732400025/5427302072581462425222917110461132092044507690213516114133834981354039371441196681513664512\"\n    },\n    {\n      \"counts\": [\n        1000,\n        2000,\n        3000\n      ],\n      \"shapes\": [\n        0.1,\n        0.2,\n        0.3\n      ],\n      \"log_mass\": -18.89679373659601,\n      \"library_log_mass\": -18.896793736590553,\n      \"probability\": 6.211932880099938e-09\n    }\n  ],\n  \"class_posterior_AA\": [\n    0.9090909090909092,\n    0.09090909090909094\n  ],\n  \"plugin_class0_posterior\": 0.9411764705882353,\n  \"one_token_mean\": 0.8,\n  \"one_token_integrated\": 0.8000000000000004,\n  \"state\": {\n    \"format\": \"nb-integrated-v1\",\n    \"classes\": [\n      0,\n      1\n    ],\n    \"schema\": [\n      \"A\",\n      \"B\"\n    ],\n    \"shapes\": [\n      [\n        4.0,\n        1.0\n      ],\n      [\n        1.0,\n        4.0\n      ]\n    ],\n    \"priors\": [\n      0.5,\n      0.5\n    ]\n  },\n  \"roundtrip_equal\": true\n}"}</CodeBlock>

<Prose>{""}<code>{"gammaln"}</code>{" keeps huge multiplicative terms in log space; its count validator still requires integers and its shapes remain positive real values. An exact small Fraction recurrence supplies a separate oracle. Ordinary "}<code>{"scipy.stats.dirichlet_multinomial.logpmf(x,a,n)"}</code>{" receives the same count event, shapes and length. For shapes "}<code>{"(.5,1.25)"}</code>{" and counts "}<code>{"[3,2]"}</code>{", the exact probability is "}<code>{"3600/33649≈.106986835"}</code>{"; the log-gamma and library routes agree. Long counts "}<code>{"[1000,2000,3000]"}</code>{" avoid factorial overflow and retain their small log mass. The class wrapper stores shapes, priors and ordered names, validates reload and normalizes across class scores. Work is "}<code>{"O(V)"}</code>{" for one count vector; the exact Fraction route is intentionally only for small inspectable fixtures."}</Prose>

<Prose>{"In the lab, edit a shape vector and a matching integer count vector, keeping their full active values visible. One-token equality, repeated-token difference and supported log output are useful changed cases. "}<a href={"/learn/path/full-curriculum/bayesian-inference-conjugate-priors"}>{"Bayesian Inference & Conjugate Priors"}</a>{" develops the posterior normalizers more broadly. A library name containing Bayes does not by itself mean parameters are integrated during prediction."}</Prose>

<H3>{"Combine different feature families with one class prior"}</H3>

<Prose>{"Mail and machine records often mix categories, binary events and continuous readings. We do not need to force all of them into one numeric event model. Each can contribute an appropriate class likelihood to one shared comparison."}</Prose>

<NaiveBayesReadingFlowFigure job="D41" phase="live" />

<Prose>{"The device fixture has four class-0 records "}<code>{"[(0,1,−1),(0,1,0),(1,0,1),(0,1,2)]"}</code>{" and four class-1 records "}<code>{"[(1,0,0),(1,0,1),(0,1,2),(1,0,3)]"}</code>{", with fields "}<code>{"(status code, alarm present, reading in mV)"}</code>{". Fit a categorical status table, a Bernoulli alarm table and a Gaussian reading table on the same labels and rows. Equal priors are shared. The default query is "}<code>{"(0,1,.5)"}</code>{"."}</Prose>

<Prose>{"The drawing keeps category, binary and continuous branches labelled with different stable family cues. Each sends a likelihood log term to an addition port; the class prior joins once, then normalization produces a class probability. A mask changes “measured” state separately from branch identity. Missing status, alarm or reading contributes factor one only under the same ignorable-observation assumption introduced in D15."}</Prose>

<div className="neural-equation"><MathBlock>{"s_c(x,m)=\\log\\pi_c+\\sum_{j:m_j=\\mathrm{observed}}\\log L_{cj}(x_j)."}</MathBlock></div>

<Prose>{"Every component must agree on class order. A useful trap is to add three component "}<strong>{"joint scores"}</strong>{": each already contains a prior, giving "}<code>{"π_c³"}</code>{" instead of "}<code>{"π_c"}</code>{". The safer construction extracts prior-free per-feature likelihoods, adds them and then inserts the common prior once. With all features missing, the result is that prior."}</Prose>

<Prose>{""}<strong>{"nb-mixed-record.py — complete file."}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/naive-bayes-probabilistic-classifiers/nb-mixed-record.py" filename="nb-mixed-record.py" title={"One prior and per-family missing masks — save nb_discrete_core.py and nb_gaussian_online.py beside it"} />

<Prose>{"Recorded new-program output:"}</Prose>

<CodeBlock language="json" kind="output" filename="nb-mixed-record-output.txt" title="Recorded output">{"{\n  \"fixture\": [\n    [\n      0.0,\n      1.0,\n      -1.0\n    ],\n    [\n      0.0,\n      1.0,\n      0.0\n    ],\n    [\n      1.0,\n      0.0,\n      1.0\n    ],\n    [\n      0.0,\n      1.0,\n      2.0\n    ],\n    [\n      1.0,\n      0.0,\n      0.0\n    ],\n    [\n      1.0,\n      0.0,\n      1.0\n    ],\n    [\n      0.0,\n      1.0,\n      2.0\n    ],\n    [\n      1.0,\n      0.0,\n      3.0\n    ]\n  ],\n  \"classes\": [\n    0,\n    1\n  ],\n  \"query\": [\n    [\n      0.0,\n      1.0,\n      0.5\n    ],\n    [\n      1.0,\n      0.0,\n      2.0\n    ],\n    [\n      0.0,\n      0.0,\n      -1.0\n    ]\n  ],\n  \"likelihood_terms\": [\n    [\n      [\n        -0.40546510810816444,\n        -1.0986122886681098\n      ],\n      [\n        -1.0986122886681098,\n        -0.40546510810816444\n      ],\n      [\n        -0.40546510810816444,\n        -1.0986122886681098\n      ]\n    ],\n    [\n      [\n        -0.40546510810816444,\n        -1.0986122886681098\n      ],\n      [\n        -1.0986122886681096,\n        -0.40546510810816433\n      ],\n      [\n        -1.0986122886681096,\n        -0.40546510810816433\n      ]\n    ],\n    [\n      [\n        -1.0305103092617776,\n        -1.4305103089417774\n      ],\n      [\n        -1.9305103085417774,\n        -1.1305103091817776\n      ],\n      [\n        -1.9305103085417774,\n        -3.5305103072617774\n      ]\n    ]\n  ],\n  \"mask_results\": [\n    {\n      \"mask\": [\n        true,\n        true,\n        true\n      ],\n      \"probabilities\": [\n        [\n          0.856472353155251,\n          0.1435276468447489\n        ],\n        [\n          0.10098802943083822,\n          0.8990119705691618\n        ],\n        [\n          0.8320183849550268,\n          0.16798161504497325\n        ]\n      ],\n      \"max_library_difference\": 5.551115123125783e-17\n    },\n    {\n      \"mask\": [\n        true,\n        false,\n        true\n      ],\n      \"probabilities\": [\n        [\n          0.7489738927768399,\n          0.25102610722316016\n        ],\n        [\n          0.18344982276155095,\n          0.8165501772384491\n        ],\n        [\n          0.9083078988592701,\n          0.09169210114072997\n        ]\n      ],\n      \"max_library_difference\": 2.220446049250313e-16\n    },\n    {\n      \"mask\": [\n        false,\n        false,\n        false\n      ],\n      \"probabilities\": [\n        [\n          0.5,\n          0.5\n        ],\n        [\n          0.5,\n          0.5\n        ],\n        [\n          0.5,\n          0.5\n        ]\n      ],\n      \"max_library_difference\": 0.0\n    }\n  ],\n  \"roundtrip_equal\": true,\n  \"state\": {\n    \"format\": \"nb-mixed-v1\",\n    \"feature_order\": [\n      \"status\",\n      \"alarm\",\n      \"reading\"\n    ],\n    \"mask_meaning\": \"observed Boolean; missing process assumed ignorable\",\n    \"category\": {\n      \"format\": \"nb-discrete-v1\",\n      \"family\": \"categorical\",\n      \"alpha\": 1.0,\n      \"schema\": [\n        \"status\"\n      ],\n      \"classes\": [\n        0,\n        1\n      ],\n      \"class_count\": [\n        4.0,\n        4.0\n      ],\n      \"priors\": null,\n      \"categories\": [\n        [\n          \"idle\",\n          \"busy\"\n        ]\n      ],\n      \"category_count\": [\n        [\n          [\n            3.0,\n            1.0\n          ],\n          [\n            1.0,\n            3.0\n          ]\n        ]\n      ]\n    },\n    \"binary\": {\n      \"format\": \"nb-discrete-v1\",\n      \"family\": \"bernoulli\",\n      \"alpha\": 1.0,\n      \"schema\": [\n        \"alarm\"\n      ],\n      \"classes\": [\n        0,\n        1\n      ],\n      \"class_count\": [\n        4.0,\n        4.0\n      ],\n      \"priors\": null,\n      \"feature_count\": [\n        [\n          3.0\n        ],\n        [\n          1.0\n        ]\n      ]\n    },\n    \"gaussian\": {\n      \"format\": \"nb-gaussian-M2-v1\",\n      \"classes\": [\n        0,\n        1\n      ],\n      \"schema\": [\n        \"reading\"\n      ],\n      \"units\": [\n        \"mV\"\n      ],\n      \"variance_floor\": [\n        1e-09\n      ],\n      \"class_count\": [\n        4.0,\n        4.0\n      ],\n      \"mean\": [\n        [\n          0.5\n        ],\n        [\n          1.5\n        ]\n      ],\n      \"M2\": [\n        [\n          5.0\n        ],\n        [\n          5.0\n        ]\n      ],\n      \"priors\": null\n    }\n  },\n  \"library_matched_var_smoothing\": 6.666666666666667e-10,\n  \"library_epsilon\": 1e-09,\n  \"changed_prior_probabilities\": [\n    [\n      0.6654510939464541,\n      0.3345489060535458\n    ],\n    [\n      0.03609262520811495,\n      0.9639073747918852\n    ],\n    [\n      0.62278539275292,\n      0.37721460724708\n    ]\n  ],\n  \"duplicated_prior_bug\": [\n    [\n      0.39868909366454675,\n      0.6013109063354531\n    ],\n    [\n      0.012327496202840712,\n      0.9876725037971594\n    ],\n    [\n      0.3549789228358708,\n      0.6450210771641292\n    ]\n  ]\n}"}</CodeBlock>

<Prose>{"Save it beside the two quiet helpers and run "}<code>{"python nb-mixed-record.py"}</code>{". "}<code>{"MixedModel.components"}</code>{" reads categorical log tables, selects present/absent binary logs and uses Gaussian "}<code>{"log_likelihood"}</code>{"; these pieces contain no prior. "}<code>{"log_joint"}</code>{" applies a Boolean mask per row and feature, then adds the common prior once. The ordinary route extracts the same class-aligned likelihoods from separate CategoricalNB/BernoulliNB/GaussianNB fits. For this batch it sets Gaussian "}<code>{"var_smoothing"}</code>{" to match the scratch absolute floor, rather than comparing unmatched defaults. The state stores family types, field order, units, tables and mask meaning; reload checks shared class order and priors."}</Prose>

<Prose>{"The output compares complete, alarm-missing and all-missing queries, with scratch/library agreement and JSON roundtrip. A second explicitly changed prior "}<code>{"[.25,.75]"}</code>{" compares proper scoring with the duplicated-prior bug. A mask does not permit NaN input into numerical arithmetic: placeholders remain finite and validated, while the mask says whether a likelihood is used. Status code relabeling must permute both mapping and table; changing units requires the Gaussian mean/variance/floor conversion. Families are not ordered by their numeric codes or by the position returned by an unrelated estimator."}</Prose>

<Prose>{"This additive log-likelihood view connects to richer graphical models. "}<a href={"/learn/path/full-curriculum/bayesian-networks-causal-graphical-models"}>{"Bayesian Networks & Causal Graphical Models"}</a>{" teaches factorization, including its tree-augmented NB branch; graph arrows require their own probabilistic assumptions. "}<a href={"/learn/path/full-curriculum/gaussian-mixture-models-gmm-em-algorithm"}>{"Gaussian Mixtures & EM"}</a>{" models latent components inside a class. Kernel-density/additive discriminant likelihoods and averaged one-dependence classifiers are specialist extensions to read in their sources, rather than new implementation promises here."}</Prose>

<Prose>{"We have now separated word likelihood, margin, probability, class and action. The next "}<a href={"/learn/path/full-curriculum/ensemble-methods-stacking"}>{"Ensemble Methods & Stacking"}</a>{" lesson combines model outputs and adds a new fitting boundary: a combiner should learn from predictions that respect each row's base-training boundary. Agreement among models is not independent evidence merely because their names differ."}</Prose>

<H2>{"11. Practise with new observations"}</H2>

<Prose>{"Try each task before opening its hint and solution. Keep the observation event, prior, units and fitted schema stated in the question. A correct computation under a silently substituted model answers a different question."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"1. New priors and opposing words"}</H3>

<Prose>{"Keep the five-word alpha=1 model, but set the spam prior to 1/3. Find the spam posterior for free meeting. Which term changes relative to the original prior?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Multiply the new prior odds by 28/11 for free and 7/22 for meeting, then convert odds to probability."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"The likelihood ratio is (28/11)(7/22)=98/121. New prior odds are (1/3)/(2/3)=1/2, so posterior odds are 49/121 and P(spam)=49/170≈0.288235. Only the prior log-odds term changes; the fixed class token tables do not. With the original prior 2/3, the probability would be 196/317≈0.618297. Changing prevalence can change the decision without changing token likelihoods, under the stated stable-likelihood assumption."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"2. Unseen in a class is not unknown to the vocabulary"}</H3>

<Prose>{"With alpha=0, submit free meeting to the three-document model. Then submit only zephyronic. Explain the different failures or fallbacks, and what positive alpha changes."}</Prose>

<details><summary>Hint</summary>

<Prose>{"One known word is impossible under each class; an unknown word contributes no column in this particular fitted representation."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"Ham assigns zero probability to free, and spam assigns zero probability to meeting. Both complete-message weights are zero, so Bayes normalization is undefined. Positive smoothing gives both classes support on the known words and repairs that specific issue. Zephyronic is absent from the entire vocabulary and is ignored by this stated tokenizer/vectorizer policy; its zero-feature row returns the class prior. Raising alpha does not create a zephyronic feature. Handling unknown words requires a representation policy, not just a probability-floor setting."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"3. Use the absent feature"}</H3>

<Prose>{"Two classes have equal priors. In class 1, two binary features have presence probabilities (.8,.2); in class 0 they are (.4,.6). For the complete observation (1, 0), calculate P(class 1). What if the second feature was genuinely unobserved rather than zero?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The observed zero contributes 1 minus its presence probability. An omitted factor requires an appropriate missingness assumption."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"Class 1 weight is .5×.8×.8=.32; class 0 weight is .5×.4×.4=.08. The posterior is .32/.40=.8. If feature 2 is unobserved and the observation process adds no class evidence, marginalizing it contributes one; the posterior becomes .8/(.8+.4)=2/3. Treating a missing measurement as an absent event would report a different answer without the corresponding observation."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"4. Find both Gaussian crossings"}</H3>

<Prose>{"Two equally common classes have mean 0 and standard deviations 1 and 3 in the same unit. Find their density crossings and the posterior of the wider class at x=0."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The wide-to-narrow log-density ratio is −log 3 + (4/9)x²."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"The crossings satisfy x²=(9/4)log 3, so x=±(3/2)√log 3≈±1.572221. Both signs matter: the wide class wins in both far tails. At the common mean its density is one third of the narrow density, so equal priors give the wide class posterior 1/4. This is a model calculation, not a statement that the point itself has probability 1/4 under a continuous distribution."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"5. Convert coordinates without changing the observation"}</H3>

<Prose>{"Convert every input, mean and standard deviation in a Gaussian classifier from millivolts to volts. What happens to each one-dimensional density and to the normalized class probabilities? What must happen to an absolute variance floor?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"One volt is 1000 millivolts. Density has reciprocal measurement units; variance has squared units."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"The numeric coordinate and standard deviation divide by 1000, while variance divides by 10⁶. Each one-dimensional density expressed per volt is 1000 times its value expressed per millivolt. The same factor applies to every class and cancels from the posterior. For d consistently converted dimensions the common factor is 1000ᵈ. An absolute variance floor must also divide by 10⁶; keeping its numeric value would change the model. A relative library smoothing rule based on a global largest variance should be reassessed when features have different scales or only some coordinates are converted."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"6. A changed copied-alarm population"}</H3>

<Prose>{"Fault prevalence is now .1, and a positive alarm has probabilities .9 in fault and .3 in normal. Find the true positive posterior, the posterior reported from three independent copies, and their actual equal-cost accuracies."}</Prose>

<details><summary>Hint</summary>

<Prose>{"One likelihood ratio is 3. The true positive mass is .09 + .27. For the copied decision, add actual correct joint masses."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"The true positive posterior is .09/.36=1/4. The mistaken three-copy odds are (1/9)×3³=3, giving posterior 3/4. The true equal-cost rule chooses normal for either alarm state, with accuracy .9. The copied rule chooses fault on positive and normal on negative, so its actual accuracy is .1×.9+.9×.7=.72. Those calculations use the actual joint law to evaluate the decision, not the fictional independent-copy law."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"7. Read a complement score in the correct direction"}</H3>

<Prose>{"Use the three-class complement example with query counts (0, 2, 1) and norm=False. Which class wins, and would adding a large class prior reproduce sklearn's ordinary multiclass ComplementNB behavior?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Negate two copies of the second column's log complement probability and one of the third."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"The score expressions are −2log(10/23)−log(11/23) for class 0, −2log(5/23)−log(9/23) for class 1, and −2log(10/23)−log(3/23) for class 2. Class 1 wins. A high score means poor fit to that class's complement. Adding class priors would be a different scoring rule from the tested ordinary multiclass sklearn implementation. This single query is not evidence that either normalization variant will outperform another model."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"8. Repair a streaming and drift claim"}</H3>

<Prose>{"A loop runs range(len(rows)//4) and takes four rows per iteration from fourteen rows. Its author says partial_fit both uses all observations and automatically adapts to new language. Diagnose both claims and propose distinct repairs."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Check the final index, then ask whether any accumulated count was removed or downweighted."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"The loop consumes three full batches, twelve rows. Iterate start indices from 0 to len(rows) in steps of 4, letting the final slice contain two rows; verify final class and feature counts. Cumulative partial_fit keeps all old evidence, so it has no automatic forgetting policy. If language changes, validate a recent-data retraining window or explicit weighting/forgetting strategy. Keep the feature schema consistent and monitor OOV and class-conditional changes. Fixing the loop repairs data loss; it does not solve distribution drift."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"9. Distinguish calibration from an action threshold"}</H3>

<Prose>{"A probability mapping changes a message from .6 to .45 while preserving the ordering of all scores. Can its predicted class change? If false-positive cost is 9 and false-negative cost is 1, which threshold follows from the stated loss model?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Monotonicity preserves order, not where a fixed threshold is crossed. Compare the two conditional expected costs."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"At threshold .5, the class changes from positive to negative even though the ranking is preserved. The declared cost threshold is 9/(9+1)=.9, so neither .6 nor .45 triggers a positive action under that rule. Calibration quality, ranking, class accuracy and performance under this cost are different questions. Evaluate the complete chosen probability/action pipeline on independent data; no one metric establishes all four."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"10. Predict a whole future count, not one token at a time"}</H3>

<Prose>{"A Dirichlet posterior has shapes(2, 2). Compare the plug-in and integrated probabilities of two A tokens. Why does integrating not mean that two fixed-parameter token draws stopped being conditionally independent?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The posterior mean is 1/2; the integrated rising-product probability is(2×3)/(4×5)."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"The plug-in probability is 1/4; the integrated probability is 3/10. At any fixed θ, the token draws remain independent. Their joint prediction averages over the same uncertain θ, creating dependence after θ is integrated out. A single-token prediction agrees with the mean table, but a whole-document likelihood need not. The result also distinguishes a model posterior from a claim about repeated real language use."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"11. Diagnose a rare-class remedy"}</H3>

<Prose>{"A training sample has 4 fault cases and 196 normal cases. Suppose the deployment fault prior is also .02 and the correct positive likelihood ratio for a new observation is 9. A team balances the training labels and uses .5 as its model prior. Compare the resulting posterior with the deployment posterior. Does balancing establish better fault likelihoods?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use prior odds 1/49 for deployment and 1 for the balanced sample. Separate frequency correction from the amount of independent fault information."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"Deployment posterior odds are 9/49, so the probability is 9/58≈0.155172. The balanced prior gives odds 9 and probability .9. If the class-conditional likelihoods truly stay fixed, restoring the deployment prior corrects this difference. Duplicating four fault examples does not create new independent observations of fault behavior. Smoothing, more representative labels, a different likelihood or Complement NB are separate candidates to validate; none follows automatically from balancing. Report class-specific recall and precision alongside a suitable baseline. If missing a fault costs 20 and a false alarm costs 1, the separately derived action threshold is 1/21, so even .155172 justifies a positive action under those probabilities and costs. A rare class, a probability and an action cannot be diagnosed from accuracy alone."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"12. Complete a changed probability report"}</H3>

<Prose>{"In the calibrated-report program, change the random seed to 2027, the class 1 reading shift from 1.5 to 1.0 and the calibration sample size from 800 to 400. Keep 800 base-fit rows, 1200 test rows and costs 4:1. Run it and report the data unit, split ownership, baseline, raw/calibrated losses, changed decisions, reliability evidence and action limitation."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Change only the seed, the coefficient in draw_cases and the calibration draw count. Keep the final test outside all fitting. Report the actual output even if an expected improvement fails."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"An acceptable report begins: “One row is one synthetic machine case; its two columns are exact copies of one reading. I fit the Gaussian base on 800 cases, the sigmoid on 400 separate cases and evaluated 1200 untouched cases under the same declared law. I compared both probability models with the prior-only baseline, retained bin counts and did not use test results to retune the mapping.” The fixed changed run gives baseline accuracy 0.7225, Brier 0.201183 and log loss 0.592234; raw GNB gives 0.7258, 0.181789 and 0.552812; sigmoid calibration gives 0.7492, 0.167991 and 0.510724. It changes 134 decisions at 0.5. These are measured finite-sample results under the stated seed, not promised improvements."}</Prose>

<Prose>{"The four nonempty bins have sizes 506, 364, 231 and 99, mean predictions 0.1538, 0.2859, 0.5042 and 0.6420, and observed positive fractions 0.1166, 0.2830, 0.4502 and 0.6768. The highest bin [0.8, 1] is empty. The declared threshold 0.8 again takes no positive actions, giving realized cost 0.277500 per test case. Report that operating limitation alongside the improved global losses. A different seed, distribution or sample size needs its own report; changing the mapping after reading this test requires another untouched evaluation."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"13. Relabel categories without inventing distance"}</H3>

<Prose>{"Two equally frequent classes each have four records. Class 0 status counts are "}<code>{"[3,1]"}</code>{" and link counts "}<code>{"[1,3]"}</code>{"; class 1 reverses both. Use α=1 and query status 0/link 1. Calculate class-0 posterior, then swap both status codes and their corresponding table columns. Score the renamed query. Explain what must happen to an unsupported code."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Each feature has two possible categories, so its denominator is "}<code>{"4+2α"}</code>{". The simultaneous relabeling changes lookup names, not likelihood values."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"Class-0 likelihood is "}<code>{"(4/6)(4/6)=4/9"}</code>{"; class-1 likelihood is "}<code>{"(2/6)(2/6)=1/9"}</code>{". Equal priors cancel, giving "}<code>{"4/(4+1)=4/5"}</code>{" for class 0. After swapping status 0 and 1 everywhere, the query's new status code is 1 and its selected probability is still 4/6 or 2/6. The posterior remains 4/5. A model that changed the answer used an inconsistent map/table or treated codes as numeric distance. An unsupported label must be rejected or mapped to a reserved other category declared in the fitted schema; smoothing alone cannot expand that support. Store the category labels with the table, and verify the restored schema before inference."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"14. Save, merge and reload sparse evidence"}</H3>

<Prose>{"Use count rows "}<code>{"[[2,0,1],[0,1,0],[1,0,0],[0,2,1],[1,1,0],[0,0,2]]"}</code>{", labels "}<code>{"[0,1,0,1,0,1]"}</code>{", α=.5 and query "}<code>{"[1,0,1]"}</code>{". Process chunks 2/3/1, calculate raw counters and smoothed tables, then export/reload. Explain the bug in a loop that adds α into the raw count state on every chunk."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Keep raw class-feature counts separate from the derived smoothed table. The complete new discrete file pair uses this fixture; inspect its actual state."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"Both classes have three rows and six total tokens. Their raw feature counts are "}<code>{"[4,1,1]"}</code>{" and "}<code>{"[0,3,3]"}</code>{". Add .5 once to each feature when deriving probabilities, giving "}<code>{"[4.5,1.5,1.5]/7.5=[3/5,1/5,1/5]"}</code>{" and "}<code>{"[.5,3.5,3.5]/7.5=[1/15,7/15,7/15]"}</code>{". The query weights are "}<code>{".5(3/5)(1/5)=3/50"}</code>{" and "}<code>{".5(1/15)(7/15)=7/450"}</code>{". Their ratio is "}<code>{"27:7"}</code>{", so posterior is "}<code>{"[27/34,7/34]"}</code>{". The recorded companion checks chunk/batch counter equality, library logs and reloaded probabilities."}</Prose>

<Prose>{"Adding .5 to each raw feature after each of three chunks would add 1.5 instead of .5 and falsely record pseudo-evidence as observed token mass. Its effective composition becomes "}<code>{"[5.5,2.5,2.5]/10.5"}</code>{" and "}<code>{"[1.5,4.5,4.5]/10.5"}</code>{"; query posterior becomes "}<code>{"55/82≈.670732"}</code>{" rather than "}<code>{"27/34≈.794118"}</code>{". If a later refresh also adds .5, the total artificial addition becomes 2 per column. Tables become "}<code>{"[6,3,3]/12"}</code>{" and "}<code>{"[2,5,5]/12"}</code>{", and the query posterior becomes "}<code>{"18/(18+10)=9/14≈.642857"}</code>{". Both bugs change the model, rather than merely its processing order. Export the actual raw counters, schema, class order and α separately, and recompute parameters after reload."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"15. A mixed missing record and a duplicated prior"}</H3>

<Prose>{"Given priors "}<code>{"1/4,3/4"}</code>{", categorical likelihoods "}<code>{".8,.4"}</code>{", binary presence rates "}<code>{".6,.2"}</code>{" and equal Gaussian likelihood for the chosen reading, calculate class-0 posterior when the binary feature is unobserved under an ignorable observation process. Then calculate it when the binary feature is observed positive. What would adding a second class prior do?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Strip prior-free likelihoods from each component. An unobserved factor sums to one; an observed positive uses its presence rate."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"Missing binary and equal Gaussian factors cancel, leaving weights "}<code>{"(1/4).8=.2"}</code>{" and "}<code>{"(3/4).4=.3"}</code>{": class-0 posterior is "}<code>{".2/.5=2/5"}</code>{". Observed positive gives weights "}<code>{".2×.6=.12"}</code>{" and "}<code>{".3×.2=.06"}</code>{", hence "}<code>{"2/3"}</code>{". A second prior multiplies odds by "}<code>{"(1/4)/(3/4)=1/3"}</code>{". It would wrongly give "}<code>{"2/11"}</code>{" for the missing case and "}<code>{"2/5"}</code>{" for the observed-positive case. The priors describe one class draw, not one draw per feature family. This is an explicitly supplied likelihood fixture; it is distinct from D41's eight-row equal-prior fit. If the missingness process carries class evidence, the omitted-factor assumption itself needs replacement."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"16. Report an honest legal-data comparison"}</H3>

<Prose>{"Use the delivered Spambase files and locked results. Write a reproducible report naming feature units, split group, fitted preprocessing, all validation outcomes including failures, prefrozen winner, test metrics and collection limitations. Inspect one edited raw vector with saved state, and say whether its model probability is an observed outcome. Do not run a new search to make the report's numbers more appealing."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use the candidate and test tables in section 8 and inspect the complete result JSON. Selection is by validation log loss, not a test metric or a family name."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"An acceptable report is: “One row is a historical email's 57 supplied statistics. The first 54 are percentages; capital-run features have different units. I grouped exact feature tuples before the seed71/73 split and retained all 4,601 rows, including three conflicting-label groups. Training has 2,811, validation 890 and test 900 rows. Scaling is fitted on training only; models remain trained on those 2,811 rows. I preserved all 12 validation outcomes, including logistic C=10's nonfinite probability-log failure. Candidate 11, raw-feature L2 logistic C=1, is the locked overall winner before test. Gaussian log1p/1e-7 and Bernoulli presence/.1 are the other locked family winners.”"}</Prose>

<Prose>{"“On test, prior/Gaussian/Bernoulli/logistic accuracy is "}<code>{".621111/.837778/.891111/.927778"}</code>{", log loss is "}<code>{".664601/10.677199/.494299/.220665"}</code>{", and Brier is "}<code>{".235850/.159200/.094210/.059091"}</code>{". Logistic confusion is "}<code>{"[[529,30],[35,306]]"}</code>{", with ham/spam supports 559/341. Gaussian's good spam recall and extreme mistakes make its log loss worse than the prior. At the fixed 4:1/.8 action rule, costs are "}<code>{".378889/.566667/.218889/.176667"}</code>{". The original selected-logistic test-report API underflow is retained, with the final logs computed stably from the same saved coefficients; no refit, candidate retry or selection change occurred.”"}</Prose>

<Prose>{"“For raw make percentage 1, other percentage features 0 and capital fields "}<code>{"[2,4,8]"}</code>{", saved-state spam probabilities are approximately "}<code>{".999999998907/.0000766132/.205693203142"}</code>{" for the three model families. This edited feature vector is unlabeled, changes no test metric and is not asserted to reconstruct an email. Grouping guards exact vectors, not every campaign or near duplicate. Personalized ham features and unavailable timing limit deployment interpretation.”"}</Prose>

<Prose>{"A complete answer includes the actual twelve-row outcome table and source/ data/split/state identity. Changing representations, seeds, convergence caps or eligibility policy would define a new study with a new untouched evaluation. An apparent best test score never retroactively chooses the locked winner."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources" data-lesson-resource-list=""><H3>{"Further learning"}</H3>

<ul><li>{""}<a href={"https://nlp.stanford.edu/IR-book/pdf/13bayes.pdf"}>{"Manning, Raghavan & Schütze — Introduction to Information Retrieval, chapter 13"}</a>{": freely readable book chapter with another token-count worked example, Bernoulli comparison, feature selection and computational costs. Use after sections 3–4; basic conditional probability is enough for its first route."}</li><li>{""}<a href={"https://cs229.stanford.edu/summer2023/cs229-notes2.pdf"}>{"Stanford CS229 — Generative Learning Algorithms"}</a>{": official course notes connecting Gaussian discriminant learning and Naive Bayes. Useful after section 5; probability and linear algebra help with full covariance; compare its contour picture with section 5's diagonal restriction."}</li><li>{""}<a href={"https://www.youtube.com/watch?v=nt63k3bfXS0"}>{"Stanford Online / Andrew Ng — CS229 Lecture 5: GDA & Naive Bayes"}</a>{": oral derivation alternative once the local Bayes calculation is familiar. Pair the recording with the official course notes above. Its older software context is not the executed API reference."}</li><li>{""}<a href={"https://scikit-learn.org/stable/modules/naive_bayes.html"}>{"scikit-learn — Naive Bayes user guide"}</a>{": concise family/API orientation after sections 4–8. Read its compact formulas with the event distinctions and explicit state settings taught here."}</li><li>{""}<a href={"https://hastie.su.domains/ElemStatLearn/"}>{"Hastie, Tibshirani & Friedman — The Elements of Statistical Learning"}</a>{": author-hosted book, §§6.6.2–6.6.3, for the additive likelihood-ratio connection after section 10. Full KDE/GAM fitting needs later statistical background."}</li></ul></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources" data-lesson-resource-list=""><H3>{"Technical references"}</H3>

<ul><li>{""}<a href={"https://cdn.aaai.org/Workshops/1998/WS-98-05/WS98-05-007.pdf"}>{"McCallum & Nigam — A Comparison of Event Models for Naive Bayes Text Classification"}</a>{": original 1998 token/presence distinction, estimation and feature-selection experiments. Its experiments are historical findings, not our measured results."}</li><li>{""}<a href={"https://people.csail.mit.edu/jrennie/papers/icml03-nb.pdf"}>{"Rennie, Shih, Teevan & Karger — Tackling the Poor Assumptions of Naive Bayes Text Classifiers"}</a>{": complement pooling, weight normalization and transformed text scores used to verify section 7's distinction from a literal generative posterior."}</li><li>{""}<a href={"https://cdn.aaai.org/Workshops/1998/WS-98-05/WS98-05-009.pdf"}>{"Sahami and colleagues — A Bayesian Approach to Filtering Junk E-Mail"}</a>{": historical application connecting feature design, dependence assumptions and asymmetric legitimate-mail errors; its chosen threshold is not a recommendation for a new system."}</li><li>{""}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.naive_bayes.MultinomialNB.html"}>{"MultinomialNB"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.naive_bayes.BernoulliNB.html"}>{"BernoulliNB"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.naive_bayes.CategoricalNB.html"}>{"CategoricalNB"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.naive_bayes.ComplementNB.html"}>{"ComplementNB"}</a>{" and "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.naive_bayes.GaussianNB.html"}>{"GaussianNB"}</a>{": exact setting/state/support/smoothing contracts for the executed 1.9.1 snapshot. Check the relevant attribute and explicit parameter when using another version."}</li><li>{""}<a href={"https://scikit-learn.org/stable/modules/calibration.html"}>{"scikit-learn — Probability calibration"}</a>{": score interface, independent fitting roles, reliability and proper losses; verify current defaults when reproducing with another version."}</li><li>{""}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.dirichlet_multinomial.html"}>{"SciPy — Dirichlet-multinomial"}</a>{": positive shape/count-event API used by the same-input integrated prediction bridge. The executable comparison supplements the mathematical derivation."}</li><li>{""}<a href={"https://archive.ics.uci.edu/dataset/94/spambase"}>{"UCI — Spambase"}</a>{", "}<a href={"https://doi.org/10.24432/C53G6X"}>{"dataset DOI"}</a>{": original schema, creators, official archive and CC BY 4.0 provenance for the offline historical experiment."}</li></ul></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H3>{"Ready to continue?"}</H3>

<Prose>{"You should be able to identify the observation event; estimate its class table; trace and normalize one score; distinguish absent, missing and unsupported features; preserve schema/state; diagnose a dependence or probability failure; and justify an action under declared costs with a separate evaluation protocol. Implement a changed-input case and explain which scratch variables correspond to the ordinary library's parameters. Use the solved tasks to check that ability instead of treating a completion button as mastery evidence."}</Prose>

<Prose>{"Continue to "}<a href={"/learn/path/full-curriculum/ensemble-methods-stacking"}>{"Ensemble Methods & Stacking"}</a>{": combining models introduces a new learning boundary as well as a scoring rule."}</Prose></section>
<NaiveBayesReadingFlowAssets />
</div>;}
export default {
  title: "Naive Bayes & Probabilistic Classifiers",
  readTime: "~90 min read + 2–3 hours practice",
  hasIntegratedGuide: true,
  content: NaiveBayesReadingFlowLesson
};
