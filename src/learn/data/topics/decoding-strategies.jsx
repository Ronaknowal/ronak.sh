// Static projection of the accepted manuscript; no text parser ships in this lesson.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import {
  Math as InlineMath,
  MathBlock as SharedMathBlock,
} from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { Local, Table } from '../../components/lesson-labs/DecodingElements.jsx';
import {
  OutputFeedback,
  ProbabilityMass,
  CategoricalDraw,
  PrefixBranch,
  GreedyTree,
  TemperatureColumns,
  EntropyCurve,
  RankedCut,
  NucleusBoundary,
  PeakedFlat,
  RelativeCut,
  OperatorComposition,
  SurprisalGeometry,
  SignedPenalty,
  NgramLookup,
  StopBoundary,
  BeamExpansion,
  FinishedAlive,
  LengthScore,
  StoppingBound,
  CorpusCounts,
  ScratchTrace,
  NativeModel,
  NativePipeline,
  BeamAncestry,
  OutputComparison,
  MeasuredTradeoffs,
  UtilityDecision,
  LocalGlobal,
  DecoderWork,
} from '../../components/lesson-labs/DecodingStrategiesFlow.jsx';
import '../../components/lesson-labs/lesson-flow.css';
const MathBlock = ({ children }) => (
  <Local label="Mathematical relationship">
    <SharedMathBlock>{children}</SharedMathBlock>
  </Local>
);
const NeuralTable = ({ headers, rows, caption }) => (
  <Table headers={headers} rows={rows} label={caption} />
);
const Program = ({ file }) => (
  <RemoteCodeBlock
    source={'/learn-code/decoding-strategies/' + file}
    filename={file}
    title={file}
    language="python"
  />
);
function DecodingLesson() {
  return (
    <div className="lesson-flow decoding-flow">
      <Prose>
        {
          'A language model supplies scores for the next token. A decoder turns those scores into an action: emit one token, draw a random token, or keep several possible continuations. Changing that action can change the text without changing a single model weight.'
        }
      </Prose>

      <Prose>
        {
          'We will follow a small distribution by hand, build complete decoding programs, and inspect actual continuations from a count model and a pretrained Transformer. By the end, you should be able to explain which distribution a configuration samples, which prefixes a beam discards, and what a measured output comparison can establish.'
        }
      </Prose>

      <Prose opening="prerequisites">
        {'The prerequisite is the '}
        <a
          href={
            '/learn/path/full-curriculum/causal-language-modeling-next-token-prediction?module=large-language-models'
          }
        >
          {'causal language-model lesson'}
        </a>
        {
          ': a prefix produces a next-token distribution, and the selected token becomes part of the next prefix. We refresh that boundary first. The entropy derivative, alternative entropy filters and decision-theory bridge are deeper branches; the core path remains useful without deriving each one.'
        }
      </Prose>

      <span id="1-why-it-exists" aria-hidden="true" />
      <span id="1-start-with-the-problem" aria-hidden="true" />
      <H2>{'1. One model step still needs a decision'}</H2>

      <Prose>
        {
          'Suppose the prompt is “Alice reached the”. The model has processed its token IDs, but it has not yet decided which word to print. Its last-position representation is projected into one score per vocabulary entry. Those scores are called '
        }
        <strong>{'logits'}</strong>
        {
          '. They can be negative, positive or shifted together without being probabilities themselves.'
        }
      </Prose>

      <OutputFeedback />

      <Prose>
        {'If we select '}
        <strong>{'door'}</strong>
        {', the next call processes “Alice reached the door”. Selecting '}
        <strong>{'window'}</strong>
        {
          ' creates another prefix and can produce a different next distribution. A decoder therefore sits inside a feedback loop. It does not receive one fixed list of probabilities and draw the entire paragraph from it.'
        }
      </Prose>

      <Prose>
        {
          'For the next few examples, use five constructed candidates in this fixed order: door, window, garden, river and the end-of-sequence token '
        }
        <strong>{'EOS'}</strong>
        {
          '. Their probabilities are 0.5, 0.25, 0.125, 0.0625 and 0.0625. These numbers make the mechanism inspectable; they are not predictions measured from a pretrained model.'
        }
      </Prose>

      <ProbabilityMass />

      <Prose>
        {
          'Door owns half of the available mass, window one quarter, and the remaining entries share the last quarter. The bars sum to one because exactly one next token will be chosen. EOS is one of those choices: it ends this sequence without requiring an ordinary printed word.'
        }
      </Prose>

      <Prose>
        {'Softmax turns logits '}
        <InlineMath>{'z_i'}</InlineMath>
        {
          ' into probabilities. Subtracting their largest value changes neither relative odds nor the result, but prevents large positive exponentials:'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>{'p_i=\\frac{\\exp(z_i-z_{\\max})}{\\sum_j\\exp(z_j-z_{\\max})}.'}</MathBlock>
      </div>

      <Prose>
        {
          'Negative infinity is a useful score for an excluded entry: its exponential is zero. At least one score must remain finite. If every token is excluded, normalization has no valid answer; our implementation raises an error. Silently choosing an arbitrary token would conceal an invalid decoder state.'
        }
      </Prose>

      <Prose>
        {'We will use '}
        <strong>{'p'}</strong>
        {" for the model's original conditional distribution and "}
        <strong>{'q'}</strong>
        {
          ' for the distribution a sampling procedure actually uses. At first they are the same. Later we will change q by transforming or filtering the scores while retaining p for comparison.'
        }
      </Prose>

      <span id="2-core-intuition" aria-hidden="true" />
      <span id="2-build-the-intuition" aria-hidden="true" />
      <span id="4-from-scratch-implementation" aria-hidden="true" />
      <H2>{'2. Sampling means allocating an interval'}</H2>

      <Prose>
        {
          'The probability strip gives a direct sampling algorithm. Draw one uniform number between zero and one, then select the interval containing it.'
        }
      </Prose>

      <CategoricalDraw />

      <Prose>
        {
          'The number 0.72 lands between 0.5 and 0.75, so this draw chooses window. Exactly 0.5 also belongs to window: intervals include their left boundary and exclude their right boundary. The final interval reaches one, but the uniform generator never returns one. This convention gives each entry an interval of precisely its probability mass.'
        }
      </Prose>

      <Prose>
        {'The cumulative distribution is '}
        <InlineMath>{'C_i=\\sum_{j\\leq i}q_j'}</InlineMath>
        {'. Choose the first entry whose cumulative boundary is strictly greater than the draw '}
        <InlineMath>{'u'}</InlineMath>
        {':'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>{'i=\\min\\{j:C_j>u\\},\\qquad u\\in[0,1).'}</MathBlock>
      </div>

      <Prose>
        {
          'A seed makes a particular random-number stream reproducible within a specified implementation. It does not promise that NumPy, Torch and every hardware backend produce identical draws from the same integer seed. We will compare their probability contracts separately from repeatability within one stack.'
        }
      </Prose>

      <Prose>{'The selected token now changes the next problem.'}</Prose>

      <PrefixBranch />

      <Prose>
        {
          'Sampling door on the first step does not force door again. The model is called on the longer prefix; we transform its new scores and draw again. If the first edge has probability 0.5 and a particular next edge has probability 0.2, that two-edge path has probability 0.1. The second factor is conditional on the first choice.'
        }
      </Prose>

      <Prose>
        {'For a generated sequence '}
        <InlineMath>{'y=(y_1,\\ldots,y_L)'}</InlineMath>
        {' after prompt '}
        <InlineMath>{'x'}</InlineMath>
        {', its model probability is a product of those conditional edges:'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            'p(y\\mid x)=\\prod_{t=1}^{L}p(y_t\\mid x,y_{<t}),\\qquad\n\\log p(y\\mid x)=\\sum_{t=1}^{L}\\log p(y_t\\mid x,y_{<t}).'
          }
        </MathBlock>
      </div>

      <Prose>
        {
          "The same chain rule describes a sampling decoder's sequence distribution with q in place of p. If we later filter a row, these two products can differ. Logarithms turn multiplication into addition and avoid underflow on long sequences. All logarithms here are natural; information quantities use nats."
        }
      </Prose>

      <Prose>
        {'The complete programs are available individually and in the '}
        <a href={'/learn-code/decoding-strategies-examples.zip'}>{'example archive'}</a>
        {
          '. Extract it, open its README, and create an isolated environment before the first program:'
        }
      </Prose>

      <CodeBlock language={'sh'}>
        {
          'python -m venv .venv\n# Windows: .venv\\Scripts\\activate\n# macOS/Linux: source .venv/bin/activate\npython -m pip install -r requirements.txt\npython sampling.py'
        }
      </CodeBlock>

      <Program file="sampling.py" />

      <Prose>
        {''}
        <code>{'log_probabilities'}</code>
        {' subtracts the maximum, exponentiates and normalizes one score row. '}
        <code>{'categorical'}</code>
        {' searches cumulative interval endpoints using the strict upper-bound convention. '}
        <code>{'decode'}</code>
        {
          ' makes the full feedback loop explicit: obtain scores, transform them, choose a token, append it, and stop on EOS or the generation cap. Every step retains the prefix, choice, p, q and termination information. The callback supplies the conditional model; the loop does not assume a particular neural architecture.'
        }
      </Prose>

      <Prose>
        {
          'The default program prints the constructed 0.72 draw. It has not loaded or trained a language model. Later we use the same loop with actual learned counts.'
        }
      </Prose>

      <H2>{'3. A locally best token can lose globally'}</H2>

      <Prose>
        {'Randomness is optional. '}
        <strong>{'Greedy decoding'}</strong>
        {
          ' always selects a token with the highest current score. In a tie, our teaching implementation selects the smallest token ID. That rule is deterministic, but local confidence does not solve a sequence-level search problem.'
        }
      </Prose>

      <GreedyTree />

      <Prose>
        {
          "Greedy first chooses A because 0.6 exceeds 0.35 and 0.05. It then chooses X because 0.45 is A's largest next probability. The complete path has probability "
        }
        <InlineMath>{'0.6\\times0.45\\times1=0.27'}</InlineMath>
        {'.'}
      </Prose>

      <Prose>
        {'Starting with the less probable B leads to a much stronger second edge: '}
        <InlineMath>{'0.35\\times0.9\\times1=0.315'}</InlineMath>
        {
          '. The globally best completed sequence therefore starts with a token greedy rejects. Finding it requires comparing complete paths, not repeatedly selecting the largest coordinate of a changing row.'
        }
      </Prose>

      <Prose>
        {'Greedy implements '}
        <InlineMath>{'y_t=\\arg\\max_i p(i\\mid x,y_{<t})'}</InlineMath>
        {
          ". Its local decision distribution is a point mass on that chosen token, so its decision entropy is zero even when the model's p is uncertain. Greedy's determinism does not guarantee factuality, grammaticality or freedom from repetition. Those properties depend on the model, context and task."
        }
      </Prose>

      <Prose>
        {
          'We can enumerate every terminal path in this tiny tree as an exact oracle. A real vocabulary and a long continuation make exhaustive enumeration exponentially large. Later, beam search will keep only a bounded frontier of prefixes and accept that it may discard the best path.'
        }
      </Prose>

      <span id="3-math-foundation" aria-hidden="true" />
      <span id="3-make-the-idea-precise" aria-hidden="true" />
      <H2>{'4. Temperature changes odds, not rank'}</H2>

      <Prose>
        {
          'Before deciding which candidates are eligible, we can change how strongly sampling favors a high score. '
        }
        <strong>{'Temperature'}</strong>
        {' divides all logits by a positive number T before normalization.'}
      </Prose>

      <TemperatureColumns />

      <Prose>
        {
          'At T=0.5, the original probabilities are squared and renormalized. The five squared weights sum to 0.3359375; q becomes approximately (0.744186, 0.186047, 0.046512, 0.011628, 0.011628). Door/window odds rise from 2 to 4. At T=2, square roots make those odds '
        }
        <InlineMath>{'\\sqrt{2}'}</InlineMath>
        {', spreading mass more evenly.'}
      </Prose>

      <Prose>{'For fixed logits,'}</Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            'q_i(T)=\\frac{\\exp(z_i/T)}{\\sum_j\\exp(z_j/T)},\\qquad\n\\log\\frac{q_i(T)}{q_j(T)}=\\frac{z_i-z_j}{T}.'
          }
        </MathBlock>
      </div>

      <Prose>
        {
          "Positive T changes the size of an odds ratio, not its direction. A token ranked above another remains above it. Consequently temperature alone cannot change greedy's chosen token or the ranking used by top-k. It can change cumulative probability thresholds, which matters shortly."
        }
      </Prose>

      <Prose>
        {
          'As T approaches zero, probability concentrates on the maximum logits. With one maximum, the limit is a point mass. With two tied maxima, each retains half the mass; deterministic tie-breaking is an additional choice. As T grows without bound, q approaches uniformity over the finite eligible scores. Excluded negative-infinity entries remain excluded.'
        }
      </Prose>

      <Prose>
        {'To quantify spread, consider '}
        <strong>{'entropy'}</strong>
        {": the probability-weighted average of a token's surprisal, "}
        <InlineMath>{'-\\log q_i'}</InlineMath>
        {'.'}
      </Prose>

      <EntropyCurve />

      <Prose>
        {'A more predictable draw has lower entropy. For two equally likely outcomes it is '}
        <InlineMath>{'\\log2'}</InlineMath>
        {
          " nats; that is why the tied-max temperature limit need not have zero entropy. Entropy describes a distribution's spread, not whether its generated words are useful."
        }
      </Prose>

      <Prose>
        {'The deeper derivative makes the fixed-row claim precise. Write '}
        <InlineMath>{'Z(T)=\\sum_i e^{z_i/T}'}</InlineMath>
        {' and '}
        <InlineMath>{'\\mu(T)=\\sum_iq_i(T)z_i'}</InlineMath>
        {'. Then '}
        <InlineMath>{'H(T)=\\log Z(T)-\\mu(T)/T'}</InlineMath>
        {'. Differentiating gives '}
        <InlineMath>{"\\mu'(T)=-\\operatorname{Var}_{q(T)}(z)/T^2"}</InlineMath>
        {'; the remaining terms cancel:'}
      </Prose>

      <Prose>
        {
          'Here the variance is the probability-weighted squared spread of logits around their mean: '
        }
        <InlineMath>{'\\operatorname{Var}_{q(T)}(z)=\\sum_iq_i(T)(z_i-\\mu(T))^2'}</InlineMath>
        {'. It cannot be negative.'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>{'\\frac{dH}{dT}=\\frac{\\operatorname{Var}_{q(T)}(z)}{T^3}\\geq0.'}</MathBlock>
      </div>

      <Prose>
        {
          'This establishes nondecreasing entropy for fixed logits and positive T. It does not establish global concavity, nor does it describe entropy along a generated paragraph whose logits change at every step. Lowering temperature can repeatedly favor a bad continuation just as consistently as a good one.'
        }
      </Prose>

      <H2>{'5. Top-k fixes a rank threshold'}</H2>

      <Prose>
        {'Temperature still leaves every finite-score token eligible. '}
        <strong>{'Top-k'}</strong>
        {' removes candidates below a chosen rank boundary and renormalizes the remaining mass.'}
      </Prose>

      <RankedCut />

      <Prose>
        {'With k=3, door, window and garden survive. Their original mass is '}
        <InlineMath>{'0.5+0.25+0.125=0.875'}</InlineMath>
        {'. Dividing each surviving probability by 0.875 gives '}
        <InlineMath>{'(4/7,2/7,1/7)'}</InlineMath>
        {
          '. River and EOS receive zero sampling mass on this step. Removing EOS does not itself ensure the sequence ends later; the cap is still needed.'
        }
      </Prose>

      <Prose>
        {
          'There are two sensible tie conventions. A kth-score threshold retains every entry at least as large as the kth score. For k=4 here, river and EOS tie, so five entries survive. An exact-k implementation breaks that boundary tie, for example by token ID, and keeps exactly four. We show both and label which one is active. Current native top-k uses the threshold convention.'
        }
      </Prose>

      <Prose>
        {'For retained set '}
        <InlineMath>{'K'}</InlineMath>
        {', the general operation is'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {'q_i=\\begin{cases}p_i/\\sum_{j\\in K}p_j,&i\\in K,\\\\0,&i\\notin K.\\end{cases}'}
        </MathBlock>
      </div>

      <Prose>
        {
          'If k is at least the number of eligible entries, nothing is filtered. If the distribution is almost flat, a small k arbitrarily discards much of its mass. If it is extremely peaked, the same k can include a long tail relative to the strongest candidate. A fixed rank count does not adapt to distribution shape.'
        }
      </Prose>

      <H2>{'6. Top-p fixes cumulative mass'}</H2>

      <Prose>
        {''}
        <strong>{'Nucleus sampling'}</strong>
        {
          ', usually configured as top-p, changes the selection question: keep enough high-probability entries to reach a target mass. To avoid confusing the threshold with our model distribution p, call the requested mass '
        }
        <InlineMath>{'\\rho'}</InlineMath>
        {' in equations.'}
      </Prose>

      <NucleusBoundary />

      <Prose>
        {
          'Door alone reaches 0.5. Adding window reaches 0.75, still below 0.8. Garden takes the cumulative mass to 0.875, so it must be included. We retain the crossing entry; discarding it would leave less than the requested mass. Renormalization then gives the same q as top-k3 for this particular row.'
        }
      </Prose>

      <Prose>
        {'Sort token IDs so '}
        <InlineMath>{'p_{(1)}\\geq p_{(2)}\\geq\\cdots'}</InlineMath>
        {'. Choose the smallest m for which '}
        <InlineMath>{'\\sum_{j=1}^{m}p_{(j)}\\geq\\rho'}</InlineMath>
        {', retain those entries, and normalize. Our explicit '}
        <InlineMath>{'\\rho=1'}</InlineMath>
        {
          ' case returns all eligible entries. Stable tie ordering makes the teaching implementation deterministic when equal probabilities straddle the boundary.'
        }
      </Prose>

      <Prose>
        {
          'Floating arithmetic matters at exact equality. A descending cumulative implementation and a native ascending-tail implementation can accumulate slightly different values. We preserve and explain such boundary differences rather than treating every last-bit support difference as a different mathematical definition. Away from that boundary, the same probability rule should agree.'
        }
      </Prose>

      <PeakedFlat />

      <Prose>
        {
          'At mass 0.8, a peaked row with leading probability 0.9 needs one entry. A flat five-way row needs four. At mass 0.95, the peaked row needs its first three entries because the first two sum to 0.94; the flat row needs all five. The survivor count adapts to the row. That adaptivity is useful, but the threshold remains a decoder choice rather than a guarantee of good text.'
        }
      </Prose>

      <H2>{'7. Min-p and filter order'}</H2>

      <Prose>
        {'A third threshold compares each candidate with the strongest one. '}
        <strong>{'Min-p'}</strong>
        {" keeps probabilities at least a fraction m of the row's maximum probability."}
      </Prose>

      <RelativeCut />

      <Prose>
        {
          "The maximum is 0.5. With m=0.25, the cutoff is 0.125, so door, window and garden survive. On a flat row every candidate equals the peak and survives any m between zero and one. Unlike a fixed top-k count, min-p asks whether an entry is competitive with this row's best candidate:"
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>{'K=\\{i:p_i\\geq m\\max_jp_j\\},\\qquad 0\\leq m\\leq1.'}</MathBlock>
      </div>

      <Prose>
        {
          'The equality is intentional. At m=1, all tied maxima survive; at m=0, finite candidates are unfiltered. One maximum and a pointwise comparison suffice. Sorting is unnecessary for this rule.'
        }
      </Prose>

      <Prose>
        {'Combining controls raises another question: which row does a threshold inspect?'}
      </Prose>

      <OperatorComposition />

      <Prose>
        {
          'Applying min-p0.3 directly gives cutoff 0.15 and keeps door/window. Heating those two entries afterward cannot restore the removed tokens. Heating first to T=2 flattens the row: even the smallest probability is now more than 0.3 times the peak, so all five survive. The two operation orders therefore produce different supports and different q.'
        }
      </Prose>

      <Prose>
        {
          'Positive temperature preserves ranks, so top-k membership is unchanged by temperature alone. Top-p and min-p depend on probability mass or relative probability, which temperature changes. Once an entry is masked with negative infinity, subsequent finite rescaling does not restore it.'
        }
      </Prose>

      <Prose>
        {'Sequential filters also use the current normalized row. After top-k3, q is '}
        <InlineMath>{'(4/7,2/7,1/7)'}</InlineMath>
        {'; top-p0.8 keeps the first two because their current mass is '}
        <InlineMath>{'6/7'}</InlineMath>
        {
          '. It does not apply 0.8 to the discarded original mass. The pinned native core chain applies temperature, top-k, top-p and then min-p. Our reordered comparison is a deliberate experiment with another decoder, not a claim about that native order.'
        }
      </Prose>

      <Program file="filters.py" />

      <Prose>
        {
          'The program keeps arrays in original token-ID order even when it temporarily sorts indices. '
        }
        <code>{'mask_scores'}</code>
        {
          ' copies scores, excludes entries and checks that support remains. Each function returns a transformed score row; '
        }
        <code>{'pipeline'}</code>
        {
          ' composes them in the declared order. Its default output prints survivor masks and q for the examples above. Keeping transformation separate from random drawing lets us compare decoder distributions without confusing them with a particular random sample.'
        }
      </Prose>

      <H2>{'8. Other filters ask other questions'}</H2>

      <Prose>
        {
          "Top-p prefers the most probable tokens until it covers enough mass. A token can instead be judged by how surprising it is relative to the row's typical information content. This is a deeper branch; the core strategies do not depend on using it."
        }
      </Prose>

      <SurprisalGeometry />

      <Prose>
        {
          'The four surprisals are approximately 0.9163, 1.2040, 1.6094 and 2.3026 nats. Their probability-weighted mean is H≈1.2799. The second token is closest to that mean, even though the first token is more probable. A typical-mass target of 0.25 can therefore be satisfied by the second token alone, whose mass is 0.3.'
        }
      </Prose>

      <Prose>
        {''}
        <strong>{'Locally typical sampling'}</strong>
        {' ranks entries by '}
        <InlineMath>{'|-\\log p_i-H(p)|'}</InlineMath>
        {
          ", then accumulates probability in that distance order. Our threshold convention includes equal-distance entries at the boundary. This is the practical sorting rule; it is not a claim that greedy sorting solves every subset optimization one might formulate. The primary paper's corrected account distinguishes those statements."
        }
      </Prose>

      <Prose>
        {''}
        <strong>{'Epsilon sampling'}</strong>
        {' instead removes probabilities below an absolute cutoff '}
        <InlineMath>{'\\epsilon'}</InlineMath>
        {'. With '}
        <InlineMath>{'\\epsilon=0.15'}</InlineMath>
        {
          ', the first three entries survive. An absolute cutoff does not refer to the peak or a requested cumulative mass.'
        }
      </Prose>

      <Prose>
        {''}
        <strong>{'Eta sampling'}</strong>
        {' adapts that cutoff to entropy:'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {'\\eta=\\min\\left(\\epsilon,\\sqrt{\\epsilon}\\,e^{-H(p)}\\right).'}
        </MathBlock>
      </div>

      <Prose>
        {'For this row and '}
        <InlineMath>{'\\epsilon=0.15'}</InlineMath>
        {
          ', the entropy-dependent term is smaller than 0.15, so the rule uses that smaller cutoff. Epsilon and eta preserve the maximum-probability entries if their cutoff would otherwise remove every candidate. Typical sampling instead retains the candidate or tied candidates closest to the mean surprisal at its selected boundary; its surviving set need not contain the mode, as the second-token example shows. '
        }
        <code>{'filters.py'}</code>
        {
          ' includes the complete operators, and the native finite checks compare their actual masks and probabilities. Our real-text experiment keeps a fixed core set of strategies; it does not claim an empirical winner among every alternative.'
        }
      </Prose>

      <span id="9-failure-modes-and-gotchas" aria-hidden="true" />
      <H2>{'9. History can change the scores'}</H2>

      <Prose>
        {'So far we transformed one row without considering which tokens already appeared. A '}
        <strong>{'repetition penalty'}</strong>
        {
          ' changes scores for token IDs found in the history. It operates on tokens, not an understanding of whether repeating a phrase is appropriate.'
        }
      </Prose>

      <SignedPenalty />

      <Prose>
        {
          "For penalty r=1.2, a seen positive score is divided by 1.2, while a seen negative score is multiplied by 1.2. Both operations lower that token's score. The unseen middle token remains at 1. A token appearing twice is still adjusted once in this rule; it is not repeatedly penalized for every occurrence."
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            "z_i'=\\begin{cases}\nz_i/r,&i\\text{ seen and }z_i\\geq0,\\\\\nr z_i,&i\\text{ seen and }z_i<0,\\\\\nz_i,&i\\text{ unseen.}\n\\end{cases}"
          }
        </MathBlock>
      </div>

      <Prose>
        {
          'At r=1 the operation is neutral. For 0<r<1 it rewards seen tokens instead. A shared constant shift leaves softmax unchanged before this rule, but can change which sign branch is used and the resulting distribution. The signed penalty is therefore not invariant to the usual softmax score shift.'
        }
      </Prose>

      <Prose>
        {'A finite additive token bias is a different operation: '}
        <InlineMath>{"z_i'=z_i+b"}</InlineMath>
        {
          ' for a chosen ID. A sufficiently negative finite value can make a token unlikely, but does not mathematically exclude it. A negative-infinity mask excludes it. Neither method recognizes a semantic repetition such as two different phrasings of the same claim.'
        }
      </Prose>

      <Prose>
        {'A stricter rule prevents a previously observed token n-gram from being completed again.'}
      </Prose>

      <NgramLookup />

      <Prose>
        {
          'After “New York New”, the observed bigram New→York already exists. The current last token is New, so a no-repeat-bigram rule bans York. This may remove a perfectly legitimate repeated place name. For n=1 the history maps an empty prefix to every seen token, banning all of them; for longer n, look up the last n−1 tokens.'
        }
      </Prose>

      <Prose>
        {
          'The map is built from token IDs, including prompt IDs when they are passed to the processor. Subword tokenization can make these matches differ from visible word repetition. If combined constraints leave no eligible next token, the decoder must report that state; arbitrary fallback would violate the stated constraint.'
        }
      </Prose>

      <H2>{'10. Finish a sequence, or stop the machine'}</H2>

      <Prose>
        {
          'EOS, stop strings and length limits all stop work, but they do not mean the same thing. EOS is an emitted model token. A stop string is a pattern detected in decoded text. A cap is an external limit even when the output remains incomplete.'
        }
      </Prose>

      <StopBoundary />

      <Prose>
        {
          'The chunks “s”, “to” and “pped” decode to “stopped”. The stop string “stop” becomes complete only with the final token, and the same token also emits “ped”. A decoder cannot undo part of a token it already generated. It may return the full decoded text or trim the display before the stop; the record should distinguish those choices.'
        }
      </Prose>

      <Prose>
        {
          'An old occurrence alone is not enough. If “stop” was already present before the final token and the new token adds “ at”, that old substring does not newly complete a stop at the current generation boundary. Native stop criteria precompute tokenizer overlap information to recognize crossings and overhang efficiently. Our transparent string demonstration assumes the full decoded text grows monotonically; some tokenizers can revise trailing decoded characters, which is why the native tokenizer-aware operation matters.'
        }
      </Prose>

      <Program file="history_and_stops.py" />

      <Prose>
        {''}
        <code>{'repetition'}</code>
        {' applies the sign-aware operation once per seen ID. '}
        <code>{'ngram_bans'}</code>
        {' builds and queries the prefix map. '}
        <code>{'stop_overlap'}</code>
        {
          ' locates a newly completed substring and records both returned and optionally trimmed text. Its default trace makes the three token chunks inspectable without a model call. The native program later compares actual tokenizer boundaries and '
        }
        <code>{'StopStringCriteria'}</code>
        {'.'}
      </Prose>

      <Prose>
        {''}
        <code>{'max_new_tokens=32'}</code>
        {
          " limits generated tokens, excluding prompt length. The model's context limit counts prompt plus generated tokens. If a cap fires without EOS, label the output "
        }
        <strong>{'capped'}</strong>
        {
          ', not successfully completed. A generic stop string or token ban also does not guarantee valid JSON or satisfaction of a schema; that requires the parser-aware machinery in '
        }
        <a
          href={
            '/learn/path/full-curriculum/structured-output-constrained-decoding-outlines-xgrammar?module=large-language-models'
          }
        >
          {'Constrained Decoding'}
        </a>
        {'.'}
      </Prose>

      <H2>{'11. Keep a frontier of candidate prefixes'}</H2>

      <Prose>
        {'Greedy discarded B before seeing its strong second edge. '}
        <strong>{'Beam search'}</strong>
        {
          ' delays that commitment by keeping several prefixes at each step. Beam width B limits the live frontier, not the number of options examined within each prefix.'
        }
      </Prose>

      <BeamExpansion />

      <Prose>
        {
          'At width two, A and B both survive the first expansion. Their next candidates compete globally: B→X has probability 0.315, A→X has 0.27, and A→Y has 0.24. Keeping the best two extensions retains B→X and A→X. Selecting two tokens independently for each parent would instead create up to four prefixes and would not implement this beam width.'
        }
      </Prose>

      <Prose>
        {
          'We carry a prefix score S equal to its accumulated log probability. Extending it with token i adds the new conditional log probability:'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>{"S'=S+\\log p(i\\mid\\text{prefix})."}</MathBlock>
      </div>

      <Prose>
        {
          'Each chosen child also records its parent index. Those ancestry pointers are essential when a batched implementation reorders beam rows; a row number at the final step does not identify the same path at every earlier step.'
        }
      </Prose>

      <Prose>
        {
          'EOS needs separate treatment because a finished sequence should never be fed back for another continuation.'
        }
      </Prose>

      <FinishedAlive />

      <Prose>
        {
          'Our scratch implementation admits every EOS child to a separate finished pool and keeps at most B finished candidates. The live beam keeps at most B nonterminal children. That convention means width one need not equal greedy: an early EOS candidate can be saved even when it was not the current argmax. Greedy remains the explicit token-by-token algorithm from section 3.'
        }
      </Prose>

      <Prose>
        {
          'Native beam implementations can admit only leading-ranked completed candidates. At the horizon they can also compare capped hypotheses according to their own completion rules. Our scratch teaching search prefers a genuine finished sequence if one exists and otherwise returns a labelled capped prefix. We expose these conventions instead of calling different outputs an automatic bug.'
        }
      </Prose>

      <H2>{'12. The score determines when search can stop'}</H2>

      <Prose>
        {
          'Raw log probability makes longer sequences accumulate more nonpositive terms. Some applications use a length-normalized score to reduce that preference for short output. This changes the objective being searched.'
        }
      </Prose>

      <LengthScore />

      <Prose>
        {'Raw scoring prefers 0.5 over 0.4. With alpha=1, the scores are '}
        <InlineMath>{'\\log(0.5)/2\\approx-0.3466'}</InlineMath>
        {' and '}
        <InlineMath>{'\\log(0.4)/4\\approx-0.2291'}</InlineMath>
        {
          '; the longer second path wins because its normalized score is larger. Normalized score is not itself a sequence probability.'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            '\\operatorname{score}(y)=\\frac{S(y)}{L(y)^\\alpha},\\qquad S(y)=\\sum_t\\log p(y_t\\mid x,y_{<t}).'
          }
        </MathBlock>
      </div>

      <Prose>
        {
          'L counts generated tokens, including EOS when present. Adding prompt tokens must not change this denominator. Alpha 0 recovers raw scoring; positive alpha changes the preference. The code records the convention because a plausible number with the wrong length can silently rank candidates incorrectly.'
        }
      </Prose>

      <Prose>
        {
          "To decide whether more expansion could help, compare the best finished score with an upper bound on every surviving live prefix's descendants."
        }
      </Prose>

      <StoppingBound />

      <Prose>
        {
          "With raw scoring, every future conditional log probability is at most zero. An extension can only decrease or preserve a prefix's score, so the live S is an upper bound. If the best finished S is at least every live bound, no surviving prefix can beat it."
        }
      </Prose>

      <Prose>
        {'For alpha≥0 and a finite maximum generated length Lmax, use '}
        <InlineMath>{'S_{\\text{alive}}/L_{\\max}^{\\alpha}'}</InlineMath>
        {
          '. Every descendant has score numerator no larger than the current nonpositive S, and length no greater than Lmax. Dividing a negative number by a larger positive denominator makes it less negative, so this optimistic value is an upper bound:'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            '\\frac{S_{\\text{descendant}}}{L_{\\text{descendant}}^\\alpha}\n\\leq\\frac{S_{\\text{alive}}}{L_{\\max}^\\alpha}.'
          }
        </MathBlock>
      </div>

      <Prose>
        {
          'The bound certifies only prefixes still in the beam. A previously pruned path may have been better; the certificate cannot recover it. It also requires a completed candidate to compare against. Different native '
        }
        <code>{'early_stopping'}</code>
        {' settings encode different stopping policies; our native route chooses '}
        <code>{'"never"'}</code>
        {
          ' and inspects its actual returned scores rather than assuming a generic early-stop flag proves global optimality.'
        }
      </Prose>

      <Program file="beam_search.py" />

      <Prose>
        {
          'The complete implementation separates live, finished and capped hypotheses; expands all finite-score token edges; prunes globally; and applies the bound. '
        }
        <code>{'exhaustive'}</code>
        {
          " supplies an independent tiny-tree oracle. Default execution prints all six complete paths and the beam's retained ancestry. The model callback has the same prefix-to-logits boundary as sampling, so we can now use both algorithms with a model whose parameters we can inspect."
        }
      </Prose>

      <span id="6-visual-walkthrough" aria-hidden="true" />
      <H2>{'13. Decode from a complete model we can inspect'}</H2>

      <Prose>
        {
          "The tree was constructed by hand. We now estimate an actual conditional model from a short public-domain excerpt of *Alice's Adventures in Wonderland*. A word-bigram model counts which token follows which other token. It cannot remember an entire story, but every parameter and probability calculation is visible."
        }
      </Prose>

      <CorpusCounts />

      <Prose>
        {'The first sentence begins “Alice was beginning to get very tired”. Casefolding produces '}
        <code>{'alice'}</code>
        {', '}
        <code>{'was'}</code>
        {', '}
        <code>{'beginning'}</code>
        {', '}
        <code>{'to'}</code>
        {', '}
        <code>{'get'}</code>
        {', '}
        <code>{'very'}</code>
        {', '}
        <code>{'tired'}</code>
        {
          '; punctuation becomes separate tokens. Adjacent pairs contribute counts such as alice→was and was→beginning. We add EOS after each nonempty training line, and use a separate BOS context at its start.'
        }
      </Prose>

      <Prose>
        {'The fitted vocabulary contains 546 output entries, including UNK and EOS. The context '}
        <code>{'the'}</code>
        {' has 67 observed outgoing transitions; '}
        <code>{'rabbit'}</code>
        {
          " follows it four times. With additive smoothing alpha=0.1, every vocabulary entry receives a small positive count. Rabbit's probability becomes "
        }
        <InlineMath>{'4.1/(67+0.1\\times546)=4.1/121.6\\approx0.03372'}</InlineMath>
        {'.'}
      </Prose>

      <Prose>{'For context c and next token i,'}</Prose>

      <div className="neural-equation">
        <MathBlock>{'p(i\\mid c)=\\frac{N(c,i)+\\alpha}{\\sum_jN(c,j)+\\alpha V}.'}</MathBlock>
      </div>

      <Prose>
        {
          'Smoothing prevents an unseen transition from having zero probability. An unseen context has no counts, so this rule gives a uniform row over the vocabulary. Unknown words in evaluation prompts map to UNK; they never expand the training vocabulary. BOS is a context marker rather than an emitted token.'
        }
      </Prose>

      <Program file="corpus_model.py" />

      <Prose>
        {''}
        <code>{'read_data'}</code>
        {' verifies the exact training and held-out bytes. '}
        <code>{'CountModel.fit'}</code>
        {' uses only training lines to construct the vocabulary and count transitions. '}
        <code>{'logits'}</code>
        {' returns log smoothed counts; softmax supplies the row denominator. '}
        <code>{'save'}</code>
        {' and '}
        <code>{'load'}</code>
        {
          ' expose every learned count, and the study reloads those parameters without fitting again.'
        }
      </Prose>

      <Prose>
        {
          'This model accepts a full prefix through the common decoder interface, but internally consults only its last token. That Markov limitation matters when the output loops: changing a decoder cannot supply the missing long-range state.'
        }
      </Prose>

      <ScratchTrace />

      <Prose>
        {
          'For the first fixed prompt, greedy repeatedly emits “a little door , and she was not” until the 32-token cap. After eight tokens it returns to a context whose best next token restarts the same cycle. The model and local argmax explain this behavior together; calling greedy “precise” would not explain or repair it.'
        }
      </Prose>

      <Prose>
        {
          'The beam outputs behave differently: both widths return immediate EOS for all four count-model prompts. Their raw sequence objective can favor a short completed path over a long product of modest probabilities. An empty continuation is a real outcome to inspect, not a missing record to replace with a more attractive sample.'
        }
      </Prose>

      <Program file="scratch_study.py" />

      <Prose>
        {
          'The driver fits the count model once, saves it and generates a fixed matrix: four prompts; greedy and two beam widths once each; six sampling settings at seeds 17, 29 and 43. Each method sees the same prompt strings and a maximum of 32 new tokens. The source/data identity and immediate row hashes let analysis reuse those records. A started operation without a completed row blocks silent repetition after a failure.'
        }
      </Prose>

      <span id="5-production-implementation" aria-hidden="true" />
      <H2>{'14. Use an ordinary native generation API'}</H2>

      <Prose>
        {
          'A neural model supplies richer conditional scores through the same decoder boundary. The native example uses the actual Pythia-14M checkpoint through Transformers 5.19.0. Its weights remain unchanged; the experiment changes decoding configurations only.'
        }
      </Prose>

      <NativeModel />

      <Prose>
        {
          "Pythia uses subword IDs, so its token count differs from the count model's word-and-punctuation count. Six blocks successively transform the prefix representation. Within each selected block, the configured attention and MLP branches run in parallel around the residual stream. The final head produces 50,304 logits. Decoding starts from that row; it does not alter the six blocks' weights."
        }
      </Prose>

      <Prose>
        {
          'Download the exact checkpoint revision and run the complete native program in the environment prepared earlier:'
        }
      </Prose>

      <CodeBlock language={'sh'}>
        {
          'hf download EleutherAI/pythia-14m --revision cf967c0a9a04383db6f7b1108d86b2962634b4ac --local-dir pythia-14m\npython native_generation.py --model pythia-14m --output study-native --stage probes\npython native_generation.py --model pythia-14m --output study-native --stage study'
        }
      </CodeBlock>

      <Prose>
        {'The program loads local files with '}
        <code>{'AutoTokenizer'}</code>
        {' and '}
        <code>{'AutoModelForCausalLM'}</code>
        {', sets evaluation mode, constructs an explicit '}
        <code>{'GenerationConfig'}</code>
        {', and calls ordinary '}
        <code>{'model.generate'}</code>
        {'. There is no optimizer or neural training step. An explicit configuration matters: '}
        <code>{'do_sample=True'}</code>
        {
          ' alone can inherit an unwanted top-k setting, so untruncated sampling disables top-k and every other unused filter.'
        }
      </Prose>

      <NativePipeline />

      <Prose>
        {
          'The probes compare scratch and native masks and probabilities on all four real score rows. They also compare a manual full-prefix greedy loop with cached native greedy, repeat one sampled generation with the same seed, and verify unchanged weights and greedy IDs after save/reload. Those checks passed on this pinned stack. They do not imply that another library version, tokenizer or random-number implementation will return identical samples.'
        }
      </Prose>

      <Prose>
        {
          'Beam output needs one extra inspection because final tokens may come from different beam rows at earlier steps.'
        }
      </Prose>

      <BeamAncestry />

      <Prose>
        {''}
        <code>{'compute_transition_scores'}</code>
        {
          ' uses returned ancestry to recover the chosen path. In the eight-token beam probe, summing processed transition scores and dividing by generated length gives −1.211869303, agreeing with the returned score −1.211869359 within floating precision. Prompt length is excluded. The output is capped after eight tokens rather than EOS-completed.'
        }
      </Prose>

      <Prose>
        {
          "Raw model log probabilities and processed beam scores are saved separately. The API's FP32 log-softmax and the display's float64 reconstruction can differ slightly because of precision and tensor layout: among 36 retained probe selections, the largest observed difference was about 0.00022 nats. A saved-logit arithmetic check reproduced that scale without another model call. The figure labels native recorded scores and reconstructed display values instead of presenting them as bit-identical."
        }
      </Prose>

      <Program file="native_generation.py" />

      <Prose>
        {'The '}
        <code>{'operators'}</code>
        {' stage checks constructed filters and history rules without loading a model. The '}
        <code>{'probes'}</code>
        {' stage performs the declared native comparisons and stores actual score rows. The '}
        <code>{'study'}</code>
        {
          ' stage then writes the fixed 84 continuations. Greedy has delta q; beam has no categorical q; sampling stores its actual transformed q information. Record fields distinguish those meanings rather than assigning a convenient entropy to every method.'
        }
      </Prose>

      <Prose>
        {
          'The run also records two harmless API warnings: zero minimum-new-token length takes precedence over zero minimum length, and the BPE tokenizer ignores an inherited WordPiece cleanup option. The generated text is retained as returned; no cleanup or replacement was applied to improve the result.'
        }
      </Prose>

      <span id="7-decision-matrix" aria-hidden="true" />
      <H2>{'15. Read the actual experiment before recommending a knob'}</H2>

      <Prose>
        {
          "The two models saw four fixed prompts from the held-out Alice excerpt, each consisting of a paragraph's first twelve whitespace-separated words. These are small illustrative prefixes; the pretrained checkpoint may already have seen Alice. We chose every setting and seed before generating any continuation."
        }
      </Prose>

      <OutputComparison />

      <Prose>
        {
          'Each model contributed 84 outputs. All 84 native continuations reached the 32-token cap. The count model produced immediate EOS for the eight beam outputs, and four of its twelve T0.7 samples ended with EOS; its remaining outputs reached the cap. These outcomes follow the specified algorithms and model scores. We did not regenerate poor outputs or add a minimum-length rule afterward.'
        }
      </Prose>

      <Prose>
        {
          'For the first prompt, native greedy begins “ this.” and then repeats a form of “I’m going to be”. Native beam4 repeats “I must be shutting up like this.” The T1.3 sample at seed 17 contains no repeated token bigram, but its text is poorly connected. A repetition score alone would reward that sample without noticing the loss of coherence.'
        }
      </Prose>

      <Prose>
        {'We can measure these properties precisely while keeping their interpretation narrow.'}
      </Prose>

      <MeasuredTradeoffs />

      <Prose>
        {''}
        <strong>{'Distinct-2'}</strong>
        {
          ' is the number of different generated token bigrams divided by the number of generated token bigram positions. We exclude terminal EOS from this text statistic. An empty continuation or one content token has no bigram positions, so the ratio is undefined. For IDs (1,2,1,2), there are three positions and two distinct bigrams; distinct-2 is 2/3.'
        }
      </Prose>

      <Prose>
        {''}
        <strong>{'Mean model negative log-likelihood'}</strong>
        {' is '}
        <InlineMath>{'-\\log p(y\\mid x)/L'}</InlineMath>
        {
          ', including EOS when emitted. It measures how surprising the selected tokens were to that model, per generated token. It is not a human quality score. The two models use different vocabularies, so their per-token NLL values should not be directly compared.'
        }
      </Prose>

      <NeuralTable
        caption={'15. Read the actual experiment before recommending a knob'}
        headers={[
          <>{'Native setting'}</>,
          <>{'Outputs'}</>,
          <>{'Mean model NLL, nats/token'}</>,
          <>{'Mean distinct-2'}</>,
        ]}
        rows={[
          [<>{'Greedy'}</>, <>{'4'}</>, <>{'1.12387'}</>, <>{'0.62097'}</>],
          [<>{'Beam2'}</>, <>{'4'}</>, <>{'1.02881'}</>, <>{'0.56452'}</>],
          [<>{'Beam4'}</>, <>{'4'}</>, <>{'0.95327'}</>, <>{'0.52419'}</>],
          [<>{'Temperature 0.7'}</>, <>{'12'}</>, <>{'3.06376'}</>, <>{'0.97312'}</>],
          [<>{'Temperature 1.0'}</>, <>{'12'}</>, <>{'4.89172'}</>, <>{'0.99731'}</>],
          [<>{'Temperature 1.3'}</>, <>{'12'}</>, <>{'7.00438'}</>, <>{'1.00000'}</>],
          [<>{'Top-k20'}</>, <>{'12'}</>, <>{'2.69936'}</>, <>{'0.96505'}</>],
          [<>{'Top-p0.9'}</>, <>{'12'}</>, <>{'4.16219'}</>, <>{'0.98656'}</>],
          [<>{'Min-p0.05'}</>, <>{'12'}</>, <>{'2.67194'}</>, <>{'0.97043'}</>],
        ]}
      />

      <Prose>
        {
          'These means describe the actual fixed sample, not a universal ordering. Wider beams here have lower mean NLL and more repeated bigrams. Higher-temperature samples have larger distinct-2, but reading the text exposes incoherence that the metric cannot detect. The dataset is tiny, settings have different output counts, and no human preference or factuality labels were collected.'
        }
      </Prose>

      <Prose>
        {
          'The count model also illustrates the top-k tie convention in practice. Additive smoothing gives many unseen successors the same score. A requested k20 can therefore retain many more than twenty entries when the kth score lands on that tied tail. The stored support tells you what was actually eligible; the knob label alone does not.'
        }
      </Prose>

      <Program file="analyze_outputs.py" />

      <Prose>
        {
          'The analysis loads hash-bound completed records, reconstructs selected log p and computes metrics without a model. It preserves undefined values rather than filling them with favorable numbers. Its output contains every text row and per-method aggregates. To analyze the supplied run, use the retained records; a change to a plot does not require generation again.'
        }
      </Prose>

      <H2>{'16. Probability and utility answer different questions'}</H2>

      <Prose>
        {
          'The experiment showed that optimizing model likelihood and seeking useful text are different objectives. A small decision example makes the distinction explicit without pretending we possess a perfect language-quality metric.'
        }
      </Prose>

      <UtilityDecision />

      <Prose>
        {
          'Choosing the most probable candidate returns utility zero in this example. Sampling from p yields expected utility '
        }
        <InlineMath>{'0.5\\times0+0.3\\times1+0.2\\times1=0.5'}</InlineMath>
        {
          '. If the utilities were known and directly applicable, we would prefer one of the utility-one actions instead. Changing utility changes that decision without changing the model distribution.'
        }
      </Prose>

      <Prose>
        {
          'Real tasks rarely supply such a complete utility table. Candidate reranking, verifiers and minimum Bayes risk methods introduce a decision rule and an evaluation signal beyond local sampling. '
        }
        <a
          href={
            '/learn/path/full-curriculum/test-time-compute-scaling?module=large-language-models'
          }
        >
          {'Test-Time Compute Scaling'}
        </a>
        {
          ' develops that candidate/reference distinction and its computational cost. Probability remains useful evidence; it is not automatically the utility we want to maximize.'
        }
      </Prose>

      <Prose>
        {
          'There is also a subtler distribution question: does masking tokens locally sample the original model conditioned on the final output being accepted?'
        }
      </Prose>

      <LocalGlobal />

      <Prose>
        {
          'Local masking makes each allowed second-step child certain after its parent. It leaves the first-step probabilities at 0.6 and 0.4. Global conditioning instead weights each first branch by its chance of reaching an accepted leaf: '
        }
        <InlineMath>{'0.6\\times0.6=0.36'}</InlineMath>
        {' and '}
        <InlineMath>{'0.4\\times0.9=0.36'}</InlineMath>
        {'. Renormalizing those masses gives 0.5 and 0.5.'}
      </Prose>

      <Prose>
        {
          'If the accepted-child probabilities become (0,0.9), the local procedure reaches an empty allowed set on the first branch with probability 0.6. It must report that failure or abstention; it cannot normalize zero mass into a certain child. The other branch still succeeds with probability 0.4. Global conditioning remains defined because the original accepted mass is 0.4×0.9=0.36, and assigns all conditional mass to that second branch. If both accepted-child probabilities are zero, global conditioning is undefined and the local procedure fails on every branch. Removing a dead first branch and renormalizing the root would define another algorithm.'
        }
      </Prose>

      <Prose>
        {
          'The first procedure defines a locally constrained decoder. The second samples the original model conditional on a future event. They need not agree because future acceptance probabilities differ across prefixes. This distinction will matter when grammar masks and speculative proposals claim to preserve a particular distribution. Always identify the target distribution before asking whether an implementation preserves it.'
        }
      </Prose>

      <span id="8-what-scales-and-what-doesn-t" aria-hidden="true" />
      <H2>{'17. Count work before predicting latency'}</H2>

      <Prose>
        {
          'Keeping more candidates can require more work, but a mathematical count is not a timing measurement. Start by identifying which rows are actually evaluated.'
        }
      </Prose>

      <DecoderWork />

      <Prose>
        {
          'With four active prefixes and vocabulary size 1000, one step scores 4000 candidate cells. If two prefixes finish and are not replaced, the next two steps score 2000 each:8000 total. A replenishing beam can instead keep four live rows, so that count would change. The frontier policy is part of the calculation.'
        }
      </Prose>

      <Prose>
        {'For active row counts '}
        <InlineMath>{'B_t'}</InlineMath>
        {', the number of full-vocabulary score cells is '}
        <InlineMath>{'V\\sum_t B_t'}</InlineMath>
        {
          ". Top-k filtering does not reduce the model's full vocabulary projection in this implementation; it selects after those scores exist. A naive sorted nucleus implementation costs O(V log V) per row, while a min-p threshold needs O(V) work after normalization. A kth-threshold top-k implementation can use selection rather than a full sort; our transparent teaching code sorts to expose order and ties."
        }
      </Prose>

      <Prose>
        {
          'Actual latency also depends on cache reuse, batch shape, memory movement, kernels and hardware. '
        }
        <a
          href={
            '/learn/path/full-curriculum/kv-cache-memory-management?module=large-language-models'
          }
        >
          {'KV-Cache and Memory Management'}
        </a>
        {' explains retained model state; '}
        <a
          href={
            '/learn/path/full-curriculum/continuous-batching-pagedattention?module=large-language-models'
          }
        >
          {'Continuous Batching and PagedAttention'}
        </a>
        {' explains shared execution; '}
        <a href={'/learn/path/full-curriculum/speculative-decoding?module=large-language-models'}>
          {'Speculative Decoding'}
        </a>
        {
          ' investigates speeding a target distribution through proposal and verification. Decoder-cell counts help ask those questions, but cannot supply an unsourced latency multiplier.'
        }
      </Prose>

      <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">
        <span id="11-self-check-exercises" aria-hidden="true" />
        <H2>{'18. Practice'}</H2>

        <Prose>
          {
            'These inputs differ from the worked examples. Try the operation before opening the hint; each solution explains the result and its boundary convention.'
          }
        </Prose>

        <section className="lesson-exercise" data-lesson-exercise="1">
          <H3>{'1. Probability intervals'}</H3>

          <Prose>
            {'For p=(.4,.35,.15,.1), which token receives u=.74? What changes at u=.75?'}
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'Write every cumulative boundary and use left-inclusive intervals.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'Boundaries are 0,.4,.75,.9,1. The draw .74 belongs to the second token; exactly .75 belongs to the third. Using a strict greater-than cumulative lookup implements this convention. A boundary does not belong to both adjacent intervals.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="2">
          <H3>{'2. Temperature odds'}</H3>

          <Prose>
            {
              'For logits (log 4, log 2, log 1), calculate q at T=.5 and the odds of token 1 versus token 2.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'Dividing these logarithms by .5 squares their unnormalized weights.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'Weights become 16,4,1 and sum 21, so q=(16/21,4/21,1/21). The first/second odds are 4 rather than 2. Positive temperature preserves their ranking while changing their odds.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="3">
          <H3>{'3. A tied cold limit'}</H3>

          <Prose>
            {
              'Two logits tie for the maximum and a third is smaller. What are q and H as T approaches zero? Does greedy have to return both?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'Equal exponential weights remain equal at every positive T.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'The smaller score loses all limiting mass; q tends to (.5,.5,0), so H tends to log 2 ≈ .693147 nats. Greedy emits one token using a separate tie rule, such as the smallest token ID. Its point decision distribution is not the same as this two-way sampling limit.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="4">
          <H3>{'4. Top-k ties'}</H3>

          <Prose>
            {
              'For p=(.45,.2,.2,.1,.05) and k 2, compare a kth-score threshold with exact-k using ID order.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'The second and third entries share the boundary score.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'The threshold keeps three entries with mass .85 and q=(9/17,4/17,4/17,0,0). Exact-k keeps the first two, mass .65 and q=(9/13,4/13,0,0,0). Requested k alone does not identify the survivor count.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="5">
          <H3>{'5. Nucleus equality'}</H3>

          <Prose>
            {'For p=(.4,.3,.2,.1), compare target mass .70 and .71 in exact arithmetic.'}
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'The first two probabilities sum to .70.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'Target .70 keeps the first two; target .71 needs the third, reaching .90. The crossing token stays. Their q values are (4/7,3/7,0,0) and (4/9,3/9,2/9,0). Floating cumulative sums at an exact boundary can differ between implementations; record the convention and inspect neighboring thresholds before diagnosing a logic error.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="6">
          <H3>{'6. Relative cutoff'}</H3>

          <Prose>{'For p=(.6,.2,.15,.05), apply min-p .25. Compare m 0 and m 1.'}</Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'Multiply .25 by the peak .6, then include equality.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'The cutoff is .15. The first three survive with mass .95 and q=(12/19,4/19,3/19,0). At m 0 all four remain; at m 1 only the unique peak remains. Tied maxima would all survive m 1.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="7">
          <H3>{'7. Operation order'}</H3>

          <Prose>
            {'For p=(.8,.15,.05), compare T 2 then min-p .3 against min-p .3 then T 2.'}
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {'Compare each square-root weight with .3 times the largest square root.'}
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'Heating first produces weights (sqrt .8,sqrt .15,sqrt .05). The second/first ratio is sqrt(.15/.8)≈.433, so the second survives; the third ratio is .25, so it does not. Normalizing the first two gives approximately (.69783,.30217,0). Filtering first uses cutoff .24 and retains only the first entry. Heating that point mass leaves q=(1,0,0).'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="8">
          <H3>{'8. Typical does not mean modal'}</H3>

          <Prose>
            {
              'For p = (.5, .25, .15, .1), compute H, rank distances from surprisal to H, and find every survivor at typical mass .35. Compare nucleus mass .35.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                'Order by distance to mean surprisal, then accumulate the original probabilities until the requested mass is reached.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'Surprisals are approximately (.69315, 1.38629, 1.89712, 2.30259), H ≈ 1.20797, and distances are (.51483, .17832, .68915, 1.09461). The order is token 2, token 1, token 3, token 4. Token 2 contributes .25, which is below .35; adding token 1 reaches .75. Renormalizing gives q = (2/3, 1/3, 0, 0). Nucleus mass .35 instead retains only the modal token 1, because its mass .5 already crosses the target. Typical selection follows proximity to mean surprisal, not probability rank.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="9">
          <H3>{'9. Two penalty rules'}</H3>

          <Prose>
            {
              'Seen-token logits are [-2,2]. Apply repetition penalty 1.5, then compare applying additive bias −.5 to both entries.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {'Signed repetition uses different arithmetic on negative and positive scores.'}
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'Signed repetition gives [-3,4/3]. Additive bias gives [-2.5,1.5]. If these are the entire vocabulary, the shared additive shift leaves their softmax unchanged; if only these seen entries are shifted among other candidates, their probabilities relative to unshifted competitors decrease. Repeating an ID in the history does not repeatedly apply this penalty.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="10">
          <H3>{'10. Build a no-repeat map'}</H3>

          <Prose>
            {
              'History is “red blue red”. Build the no-repeat-bigram lookup and state the banned next token. Give a legitimate phrase this style of rule could damage.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'Store observed prefix→next pairs, then query the current suffix.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'The map contains red:{blue} and blue:{red}. Current suffix red bans blue. A repeated name such as “New York New York” can be damaged by the same rule. Matching token IDs is not a judgment of whether repetition is meaningful.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="11">
          <H3>{'11. Stop inside a token'}</H3>

          <Prose>
            {
              'Stop string is “end”; emitted chunks are “fr” then “iendship”. Identify the newly completed substring, overhang and text trimmed before the stop.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'Write character positions in “friendship”.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'Returned text is “friendship”. The stop occupies indices 3 through 5, with exclusive end 6. Overhang is “ship”; trimming before the stop leaves “fri”. The whole final token was generated. A stop already completed entirely before the latest token would not newly trigger this matching rule.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="12">
          <H3>{'12. Changed search tree'}</H3>

          <Prose>
            {
              'Root probabilities are A=.55,B=.4,EOS=.05. A leads to X=.4,Y=.35,EOS=.25; B leads to X=.8,EOS=.2; X/Y then emit EOS with probability 1. Compare greedy with the best complete path and trace beam 2.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'Multiply edges before globally ranking the second-step candidates.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'Greedy chooses A→X→EOS with probability .55×.4=.22. B→X→EOS has probability .4×.8=.32 and is best. Other complete masses are .1925,.1375,.08 and .05; all six sum 1. Beam 2 retains A/B, then B→X and A→X, so the best path remains available. A width bound certifies only paths not already pruned.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="13">
          <H3>{'13. Length changes the objective'}</H3>

          <Prose>
            {
              'Two finished candidates have probability .3 at generated length 2 and probability .25 at length 5. Compare raw and alpha 1-normalized rankings. What if the prompt gains ten tokens?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'Log probabilities are negative; divide by generated length only.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'Raw scores are approximately −1.20397 and −1.38629, so the first wins. Normalized scores are −.601986 and −.277259, so the second wins. Adding prompt tokens changes neither denominator. The normalized score is a search preference, not a normalized probability.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="14">
          <H3>{'14. Stop certificate'}</H3>

          <Prose>
            {
              'A live prefix has S=−1.2, maximum generated length 6 and alpha 1. The best finished score is −.25. Can its retained descendants be ruled out? What if the finished score is −.15?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'Use the most optimistic allowed denominator.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'The upper bound is −1.2/6=−.2. A finished score −.25 is below that bound, so the live branch may still beat it. A finished score −.15 exceeds the bound and rules out this retained branch. Check every live branch; previously pruned branches are outside the certificate.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="15">
          <H3>{'15. Local and global normalization'}</H3>

          <Prose>
            {
              'Root masses are (.3,.7); accepted-child probabilities under those branches are (.5,.75). Compare local masking with global conditioning on acceptance.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                'For global conditioning, weight the first branch by its chance of eventual acceptance.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'Local masking leaves root masses (.3,.7) and makes each allowed child certain. Accepted path masses in the original model are (.15,.525), with total .675. Global conditioning therefore gives (2/9,7/9). If every branch had zero accepted mass, the global conditional distribution would be undefined.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="16">
          <H3>{'16. Diagnose a native configuration'}</H3>

          <Prose>
            {'A run is described as “pure sampling”, but '}
            <code>{'top_k=50'}</code>
            {
              ' is inherited. Its threshold keeps 53 tokens, and it stops at 32 generated tokens without EOS. Which claims need correction?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {'Separate the actual distribution, tie convention and termination reason.'}
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                "The run is rank-truncated sampling, not untruncated sampling. A kth-score threshold may retain 53 entries because of boundary ties; this does not itself violate top-k's stated native convention. The output is capped, not EOS-completed. None of these facts alone establishes whether the text is useful."
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="17">
          <H3>{'17. Undefined diversity'}</H3>

          <Prose>
            {
              "Compute distinct-2 for empty content, one content token, and IDs (4, 4, 7, 4, 4, 7). If an EOS ID follows that six-token content, does it create another text bigram under this lesson's convention? Can larger distinct-2 and lower NLL establish better text?"
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                'List adjacent content-token pairs, count unique pairs, and exclude terminal EOS from the text-diversity statistic.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'Empty and one-token content have no bigram positions, so distinct-2 is undefined. The six-token content has five positions: (4, 4), (4, 7), (7, 4), (4, 4), (4, 7). Three pairs are unique, giving 3/5. Terminal EOS adds no text bigram here, though it still counts in generated-token likelihood when emitted. Random or incoherent text can have high diversity, and a likely repetitive answer can have low NLL. Use task-relevant correctness or preference evidence before making a quality claim.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="18">
          <H3>{'18. Count the frontier'}</H3>

          <Prose>
            {
              'Five active prefixes each score 800 vocabulary entries for four steps. Two finish after the first step; one more finishes after the third. Finished prefixes are not replaced. How many cells are scored at each step and in total? Is this a measured speedup?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                "A prefix finishing during a step still pays for that step's score row. Remove it only from later frontiers."
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'Active row counts are 5, 3, 3, 2. The steps score 4000, 2400, 2400, 1600 cells, totaling 10400. A beam that replenishes its live frontier could have a different count. This is an analytic operation count, not wall time; cache behavior, batching, kernels and hardware still matter.'
              }
            </Prose>
          </details>
        </section>

        <Program file="practice_answers.py" />

        <Prose>
          {
            "The solution program uses direct arithmetic, fractions and explicit finite enumeration. It makes the changed values reproducible without calling a pretrained model or relying on the body examples' filter implementation."
          }
        </Prose>
      </section>

      <section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources">
        <H2>{'19. Programs and evidence'}</H2>

        <Prose>
          {'The '}
          <a href={'/learn-code/decoding-strategies-examples.zip'}>{'complete archive'}</a>
          {
            " contains the nine full programs, environment requirements, licensed data, saved observations and source-bound output records. The README gives the execution order. Model weights are excluded; use the exact checkpoint revision shown in section 14. Individual program displays provide Copy and Download controls, so a function's explanation and its complete runnable context remain connected."
          }
        </Prose>

        <NeuralTable
          caption={'19. Programs and evidence'}
          headers={[<>{'File'}</>, <>{'Use it to inspect'}</>]}
          rows={[
            [
              <>
                {''}
                <a href={'/learn-code/decoding-strategies/sampling.py'}>{'sampling.py'}</a>
                {''}
              </>,
              <>{'Stable probabilities, interval sampling and the full feedback loop.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn-code/decoding-strategies/filters.py'}>{'filters.py'}</a>
                {''}
              </>,
              <>{'Thresholds, ties, renormalization and operator order.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn-code/decoding-strategies/history_and_stops.py'}>
                  {'history_and_stops.py'}
                </a>
                {''}
              </>,
              <>{'Signed history penalties, n-gram maps and stop overlap.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn-code/decoding-strategies/beam_search.py'}>{'beam_search.py'}</a>
                {''}
              </>,
              <>{'Expansion, ancestry, finished/live/capped states and stopping bounds.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn-code/decoding-strategies/corpus_model.py'}>{'corpus_model.py'}</a>
                {''}
              </>,
              <>{'Exact data loading, vocabulary, smoothing and saved count parameters.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn-code/decoding-strategies/scratch_study.py'}>
                  {'scratch_study.py'}
                </a>
                {''}
              </>,
              <>{'The fixed count-model experiment and immediate record conservation.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn-code/decoding-strategies/native_generation.py'}>
                  {'native_generation.py'}
                </a>
                {''}
              </>,
              <>
                {
                  'Ordinary native configuration, constructed operators, actual probes and fixed generation.'
                }
              </>,
            ],
            [
              <>
                {''}
                <a href={'/learn-code/decoding-strategies/analyze_outputs.py'}>
                  {'analyze_outputs.py'}
                </a>
                {''}
              </>,
              <>
                {
                  'Every measured text row, defined/undefined metrics and aggregates without regeneration.'
                }
              </>,
            ],
            [
              <>
                {''}
                <a href={'/learn-code/decoding-strategies/practice_answers.py'}>
                  {'practice_answers.py'}
                </a>
                {''}
              </>,
              <>{'Independent changed-input numerical workings.'}</>,
            ],
          ]}
        />

        <Prose>{'To recompute analysis from existing records:'}</Prose>

        <CodeBlock language={'sh'}>
          {
            'python analyze_outputs.py --count evidence/count --native evidence/native --output observations.json'
          }
        </CodeBlock>

        <Prose>
          {
            'The supplied records separate constructed examples from actual count and native outputs. They retain resolved configurations, prompts, seeds, selected tokens, model scores and stopping reasons. The native model was unchanged; count estimation happened once. A new scientific experiment should state its new protocol and use another output directory, while a presentation change should continue to use the existing records.'
          }
        </Prose>
      </section>

      <section className="lesson-ending lesson-ending--references" data-lesson-ending="references">
        <span id="10-primary-sources" aria-hidden="true" />
        <H2>{'20. Sources and next steps'}</H2>

        <Prose>
          {''}
          <a href={'https://web.stanford.edu/~jurafsky/slp3/7.pdf'}>
            {'Jurafsky and Martin, Speech and Language Processing, chapter 7'}
          </a>
          {' connects the output head with sampling and temperature. '}
          <a href={'https://web.stanford.edu/~jurafsky/slp3/13.pdf'}>{'Chapter 13'}</a>
          {' supplies the broader sequence-search and decision context. The '}
          <a
            href={
              'https://web.stanford.edu/class/archive/cs/cs224n/cs224n.1234/slides/cs224n-2022-lecture12-generation-final.pdf'
            }
          >
            {'Stanford CS224n generation lecture'}
          </a>
          {
            ' is a useful alternate visual treatment of frontier search, peaked/flat truncation and the difficulty of evaluating generated text.'
          }
        </Prose>

        <Prose>
          {''}
          <a href={'https://arxiv.org/abs/1904.09751'}>
            {'Holtzman et al., The Curious Case of Neural Text Degeneration'}
          </a>
          {' motivates nucleus sampling through a particular empirical degeneration study. '}
          <a href={'https://aclanthology.org/P18-1082/'}>
            {'Fan et al., Hierarchical Neural Story Generation'}
          </a>
          {
            " provides the task context for top-k sampling in story generation. Their experiments help explain why these methods were proposed; they do not establish a universal best setting for today's models."
          }
        </Prose>

        <Prose>
          {''}
          <a href={'https://aclanthology.org/D17-1227/'}>{'Huang, Zhao and Ma, When to Finish?'}</a>
          {
            ' explains careful beam completion and stopping guarantees relative to the retained search. '
          }
          <a href={'https://aclanthology.org/D19-1331/'}>
            {'Stahlberg and Byrne, On NMT Search Errors and Model Errors'}
          </a>
          {
            ' shows why improving search and improving the model objective are separate questions, including cases where exact search prefers an empty translation. Our finite-horizon length-power bound is derived explicitly above rather than presented as their bounded-reward formula.'
          }
        </Prose>

        <Prose>
          {''}
          <a href={'https://arxiv.org/abs/2407.01082'}>{'Min-p Sampling'}</a>
          {' gives the relative-peak rule and its experimental motivation. '}
          <a href={'https://arxiv.org/abs/2506.13681'}>{"Schaeffer et al.'s critical analysis"}</a>
          {
            ' is useful when assessing claims of broad superiority: tuning volume, prompt format and the measured objective can change conclusions. '
          }
          <a href={'https://arxiv.org/abs/2202.00666'}>{'Locally Typical Sampling'}</a>
          {
            ' explains the surprisal-distance perspective; read its corrected account rather than equating the sorting algorithm with an invalid general subset optimum. '
          }
          <a href={'https://arxiv.org/abs/2210.15191'}>
            {'Truncation Sampling as Language Model Desmoothing'}
          </a>
          {' develops epsilon/eta filtering under a particular mixture interpretation.'}
        </Prose>

        <Prose>
          {'The '}
          <a href={'https://huggingface.co/docs/transformers/main/en/generation_strategies'}>
            {'official Transformers generation guide'}
          </a>
          {' explains the public API. The executable example pins '}
          <a
            href={
              'https://github.com/huggingface/transformers/tree/v5.19.0/src/transformers/generation'
            }
          >
            {'v5.19.0 generation source'}
          </a>
          {
            ", because filter order, tie handling and beam details belong to a versioned implementation contract. In particular, the inspected chain applies temperature before the core truncation filters; a historical paper's different order description should not be used as a current API fact."
          }
        </Prose>

        <Prose>
          {'The next lesson is '}
          <a
            href={
              '/learn/path/full-curriculum/structured-output-constrained-decoding-outlines-xgrammar?module=large-language-models'
            }
          >
            {'Structured Output and Constrained Decoding'}
          </a>
          {
            '. Here a mask removed candidates by probability or recent history. There, a parser state will determine which token bytes can extend a valid structure. Carry forward the distinction between model p, decoder q and global conditioning: it makes the promised guarantee much easier to state precisely.'
          }
        </Prose>
      </section>

      <section className="lesson-ending lesson-ending--next" data-lesson-ending="next">
        <H3>{'What to carry forward'}</H3>

        <Prose>
          {
            "The model supplies p; sampling transforms it into q, while greedy makes one deterministic local choice and beam searches over prefixes. Temperature changes odds, filters change support, and history/stop rules add their own contracts. A beam's score, completion policy and surviving frontier determine what its stopping claim means. Inspect actual outputs and task-relevant evidence before interpreting likelihood or diversity as usefulness."
          }
        </Prose>
      </section>

      <section className="lesson-ending lesson-ending--next" data-lesson-ending="next">
        <H3>{'Ready to continue'}</H3>

        <Prose>
          {
            "You should be able to compute one filtered and renormalized row, trace a beam's selected ancestry and generated-length score, and distinguish an EOS completion from a cap or an empty-support failure. You should also be able to identify the effective native configuration, inspect its retained p/q evidence, and explain why local masking can differ from global conditioning. These are the tools the next lesson uses to make structured-output guarantees precise."
          }
        </Prose>
      </section>
    </div>
  );
}
export default {
  title: 'Decoding Strategies (Greedy, Beam, Top-k, Top-p, Temperature)',
  readTime: '~85 min read + programs and practice',
  hasIntegratedGuide: true,
  content: DecodingLesson,
};
