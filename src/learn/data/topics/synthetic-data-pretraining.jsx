// Generated from the accepted complete manuscript by scripts/render-synthetic-data.mjs.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock as SharedMath } from '../../components/content/Math.jsx';
import { NeuralTable } from '../../components/lesson-labs/NeuralLessonElements.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import SyntheticFigure from '../../components/lesson-labs/SyntheticDataFlow.jsx';
import '../../components/lesson-labs/lesson-flow.css';
const MathBlock = ({ children }) => (
  <div
    className="synthetic-equation"
    role="region"
    tabIndex={0}
    aria-label="Synthetic data relationship"
  >
    <SharedMath>{children}</SharedMath>
  </div>
);
const Program = ({ file }) => (
  <RemoteCodeBlock source={`/learn-code/synthetic-data/${file}`} filename={file} />
);
export default {
  slug: 'synthetic-data-generation-for-pre-training',
  title: 'Synthetic Data Generation for Pre-Training',
  readTime: '~75 min read + programs and practice',
  hasIntegratedGuide: true,
  content: () => (
    <div className="lesson-flow synthetic-lesson">
      <Prose opening="summary">
        {
          'Follow a paragraph into generated text, a selected corpus and a student update. Build the sampling and verification mechanisms, generate a real small corpus, then measure what that corpus does to a language model on untouched text.'
        }
      </Prose>

      <Prose opening="route">
        {
          'First pass: sections 1–9 follow one complete data experiment. Section 10 derives what repeated generation can do in a finite population; section 11 connects the mechanisms to research. Source families keep their identity colours through rewriting and filtering. Outlines and labels separately show whether a record was selected, rejected or generated.'
        }
      </Prose>

      <Prose opening="prerequisites">
        {'Prerequisites: '}
        <a
          href={
            '/learn/path/full-curriculum/causal-language-modeling-next-token-prediction?module=large-language-models'
          }
        >
          {'causal next-token prediction'}
        </a>
        {', '}
        <a
          href={
            '/learn/path/full-curriculum/curriculum-learning-data-mixing-strategies?module=large-language-models'
          }
        >
          {'data mixing'}
        </a>
        {' and '}
        <a
          href={
            '/learn/path/full-curriculum/data-curation-pipelines-curator-models-quality-filtering?module=large-language-models'
          }
        >
          {'curation pipelines'}
        </a>
        {
          '. We reuse the actual causal decoder and refresh its input/target contract. Supervised fine-tuning and distillation follow later; neither is assumed here.'
        }
      </Prose>

      <span id="1-why-it-exists" aria-hidden="true" />
      <H2>{'1. Change the training text, then ask what improved'}</H2>

      <Prose>
        {
          'A student language model learns from the sequences it is asked to predict. Suppose a source paragraph explains a pendulum. We can keep it, copy it, ask a generator to rewrite it, or generate a related question and answer. Each choice changes the collection of training examples. Whether it helps the student is a separate question from whether the output looks fluent.'
        }
      </Prose>

      <SyntheticFigure id="S01" />

      <Prose>
        {'Read the two parameter owners in the drawing. The '}
        <strong>{'generator'}</strong>
        {
          ', often called a teacher, already has parameters. It produces text while those parameters stay fixed. The '
        }
        <strong>{'student'}</strong>
        {
          ' has its own parameters. Its optimizer later changes those parameters using the selected text. A teacher forward pass and a student training update are different operations, even if both models happen to use Transformers.'
        }
      </Prose>

      <Prose>
        {''}
        <strong>{'Synthetic training data'}</strong>
        {
          ' is data constructed by an algorithm rather than used directly as an observed source record. It includes model-generated text and procedurally generated examples. A rewrite is partly source-derived: it can preserve existing facts while changing wording, ordering or explanation. It may also omit information or introduce an unsupported claim. An exact copy supplies another stored record but no new sequence.'
        }
      </Prose>

      <Prose>
        {
          'Look at the held-out source in the drawing. It reaches the evaluation loss; it does not supply prompts, selection decisions or training targets. If its paraphrase enters the training corpus, the student has received information about the supposedly untouched example. Tracking only exact strings would miss that relationship.'
        }
      </Prose>

      <H3>{'Keep data format, objective and initialization separate'}</H3>

      <Prose>
        {
          'A question followed by an answer is a text format. It does not uniquely specify how a model is trained. To see why, take the same sequence with four predicted positions and per-position negative log probabilities [1, 2, 3, 4] nats. The final two positions belong to the answer.'
        }
      </Prose>

      <SyntheticFigure id="S02" />

      <Prose>
        {
          'With all four targets selected, loss is (1+2+3+4)/4=2.5. With only the answer targets selected, loss is (3+4)/2=3.5. Both runs can start from random parameters or from an already trained checkpoint. Both can update all parameters or a selected subset. Those choices need to be stated separately.'
        }
      </Prose>

      <Prose>
        {'In this lesson, '}
        <strong>{'pre-training on generated text'}</strong>
        {
          " means ordinary all-token next-byte learning on a corpus that includes generated records. The small students start from random initialization. The actual teacher is already instruction-tuned. Using that teacher does not make the student's loss response-only. The following SFT lesson develops instruction-response masks in detail; here the mask comparison prevents a common category mistake."
        }
      </Prose>

      <Prose>
        {
          'More text is useful only through the learning opportunities it creates. Two paraphrases may expose the same relation in different contexts and help a learner fit it. Repeating an error may strengthen the wrong relation. We need to inspect how examples are made, what selection changes and what the resulting student actually learns.'
        }
      </Prose>

      <span id="2-core-intuition" aria-hidden="true" />
      <H2>{'2. Condition the generator on something worth preserving'}</H2>

      <Prose>
        {
          "The generator needs a request. Compare “write about a pendulum” with “rewrite this paragraph in plain English without adding facts.” The first leaves content largely to the model's learned distribution. The second supplies a particular record to transform. This distinction matters before changing temperature or generating millions of samples."
        }
      </Prose>

      <SyntheticFigure id="S03" />

      <Prose>
        {
          "Our illustrative source says: “A pendulum of length 1m makes one small-angle oscillation in about 2 seconds near Earth's surface.” A plain rewrite can preserve the length, motion, approximate period and conditions. “Every pendulum takes exactly 2 seconds” loses those conditions. “Heavier pendulums move faster” adds a claim absent from the source. These are authored examples for tracing support, not outputs from the real teacher experiment later."
        }
      </Prose>

      <Prose>
        {
          'Change the source period in the figure. The old output does not update itself: it becomes inconsistent with its parent. That is why we retain source identity and version alongside the derived text. A sentence can be grammatical while referring to stale or different evidence.'
        }
      </Prose>

      <Prose>
        {''}
        <strong>{'Grounding'}</strong>
        {
          ' means giving generation a particular evidential context. It can reduce the need to invent content, but providing a paragraph does not prove the model used it faithfully. A retrieved passage is another grounding input; a retrieval system can return the wrong passage, and a generator can misread the right one. Check the resulting claims against what was actually supplied.'
        }
      </Prose>

      <SyntheticFigure id="S04" />

      <Prose>
        {
          'Select a source and style. The same parent can produce plain prose or a question and answer. The prompt specifies content commitments and presentation, while the parent ID records provenance. A useful record stores the model revision, prompt, sampling settings and seed as well as the text. A name such as “teacher-v2” does not identify an exact checkpoint.'
        }
      </Prose>

      <Prose>
        {'There are three useful construction routes. '}
        <strong>{'Source-conditioned generation'}</strong>
        {' rewrites or organizes supplied evidence. '}
        <strong>{'Seeded generation'}</strong>
        {
          ' expands a set of topics, examples or specifications; the output may have less direct factual support. '
        }
        <strong>{'Procedural generation'}</strong>
        {
          ' executes a known construction, such as forming arithmetic expressions and calculating their answers. Choose the route that gives the kind of variation and checking the task needs. A procedural arithmetic checker cannot certify an open-ended historical explanation.'
        }
      </Prose>

      <Prose>
        {
          'The real experiment uses two explicit prompts per training paragraph: plain rewriting and one source-grounded question with its answer. The second format tests a different organization of the same source. We retain both styles under the same parent family; changing format does not create an independent source.'
        }
      </Prose>

      <span id="3-mathematical-foundation" aria-hidden="true" />
      <span id="4-from-scratch-implementation" aria-hidden="true" />
      <H2>{'3. Sample a continuation and see what you discard'}</H2>

      <Prose>
        {
          "The prompt conditions the teacher's next-token distribution. A model produces one logit per candidate token. Softmax turns those scores into probabilities; sampling selects an ID, appends it and asks for a new conditional distribution. Selection settings therefore affect both the next word and the contexts seen by later decisions."
        }
      </Prose>

      <SyntheticFigure id="S05" />

      <Prose>
        {
          'Use the four illustrative next-token probabilities [.55, .25, .15, .05]. The corresponding logits can be their natural logarithms because exponentiation recovers those masses. '
        }
        <strong>{'Temperature'}</strong>
        {
          ' T divides every logit before softmax. For T>0, it preserves their ordering; a smaller T concentrates mass and a larger T flattens it. Equal logits remain equal. Greedy decoding instead takes a largest-score token directly; it is an explicit alternative, not a division by zero.'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {'p_T(i)=\\frac{\\exp((z_i-m)/T)}{\\sum_j\\exp((z_j-m)/T)},\\qquad m=\\max_j z_j.'}
        </MathBlock>
      </div>

      <Prose>
        {
          'Subtracting the same maximum from every score cancels between numerator and denominator. The largest exponential becomes 1, preventing a needlessly huge positive exponential. The program subtracts before dividing; extreme negative differences may underflow to zero, which is a representational limit rather than a new probability rule.'
        }
      </Prose>

      <Prose>
        {''}
        <strong>{'Top-p'}</strong>
        {
          ', also called nucleus sampling, sorts candidates by probability and keeps the smallest leading set whose accumulated probability reaches p. The token that crosses the threshold stays. Divide the retained probabilities by their total and set the others to zero.'
        }
      </Prose>

      <Prose>
        {
          'At p=.8, the first two example tokens supply .55+.25=.8. Their new probabilities are .55/.8=.6875 and .25/.8=.3125. Removing the other two tokens changes the distribution; it is not merely a faster way to sample the original distribution. At p=1 all candidates remain. If the largest probability already exceeds p, one token survives and sampling becomes deterministic for that step.'
        }
      </Prose>

      <Prose>
        {
          'The scratch implementation breaks equal-probability ties by original token ID. A native library can use another tie order or the complementary ascending threshold calculation. Floating-point equality at a cumulative boundary can also change which boundary token remains. Match declared conventions when a specific token set matters; the library comparison below uses strict gaps from those boundaries.'
        }
      </Prose>

      <SyntheticFigure id="S06" />

      <Prose>
        {
          'Draw u uniformly from [0, 1). Token i owns the interval between the preceding cumulative mass and its own cumulative mass. With[.6875, .3125, 0, 0], u=.5 selects ID 0 and u=.8 selects ID 1. A zero-mass token owns no interval. Using '
        }
        <code>{'searchsorted(..., side="right")'}</code>
        {' makes an exact boundary belong to the next nonempty interval.'}
      </Prose>

      <Prose>
        {
          "The two-step display uses an explicitly authored lookup table to expose the operation. It is not a neural language model. At top-p=.9 and draws [.8, .8], the first retained distribution is approximately [.579, .263, .158, 0]; ID 1 is selected. Its lookup row then selects ID 3, the end-of-sequence token. The first step's choice changes the second step's distribution."
        }
      </Prose>

      <Prose>
        {
          'For an actual autoregressive generator, the probability of a particular token sequence is the product of its successive conditional probabilities. The equivalent log probability is their sum. These are probabilities under the chosen transformed sampling distribution when temperature or truncation has been applied. A maximum token count can end generation before EOS; that ending is a length cap and should be recorded as such.'
        }
      </Prose>

      <Prose>
        {'The '}
        <a href={'/learn-code/synthetic-data/synthetic-programs-data.zip'}>{'program archive'}</a>
        {' and '}
        <a href={'/learn-code/synthetic-data/README.md'}>{'setup instructions'}</a>
        {
          ' supply the dependencies and complete examples. The small sampling program needs only NumPy; the later neural examples use the pinned PyTorch and Transformers versions.'
        }
      </Prose>

      <Prose>
        {'Download '}
        <a href={'/learn-code/synthetic-data/synthetic_sampling.py'}>{'synthetic_sampling.py'}</a>
        {'.'}
      </Prose>

      <Program file="synthetic_sampling.py" />

      <Prose>
        {''}
        <code>{'distribution'}</code>
        {
          ' returns original probabilities, sort order, retained IDs and renormalized masses so every operation can be inspected. '
        }
        <code>{'inverse_cdf'}</code>
        {' implements selection without delegating it to a categorical sampler. '}
        <code>{'trace_sequence'}</code>
        {' supplies the small lookup generator. Run '}
        <code>{'python synthetic_sampling.py'}</code>
        {
          ' with NumPy installed. Its first nucleus is [.6875, .3125, 0, 0] and the trace terminates at EOS after IDs[1, 3].'
        }
      </Prose>

      <Prose>
        {
          'Sorting costs O(V log V) time and O(V) working storage for V candidates. This reference favors a readable, exact sort. Production decoding may use specialized selection kernels and batching; a four-token illustration is not a throughput measurement. To extend the program, implement top-k selection before nucleus filtering and inspect which support disappears. The real teacher run explicitly sets top_k=0, disabling that extra restriction.'
        }
      </Prose>

      <H2>{'4. Decide what a verifier actually establishes'}</H2>

      <Prose>
        {
          'Sampling creates candidates. Selection needs a reason to keep or reject them. Start with a task whose answer can be computed exactly: evaluate (2+3)×4. Its expression tree first combines 2 and 3, then multiplies the result by 4.'
        }
      </Prose>

      <SyntheticFigure id="S07" />

      <Prose>
        {
          'The correct answer is 20. Consider a candidate that writes “2+3=6;6×4=20” and finishes with 20. An answer checker accepts the final value; both written equalities are false. A second candidate can contain true but irrelevant equalities. Checking each equality still would not show that they form a complete derivation of the requested answer. Be precise about which claim each check establishes.'
        }
      </Prose>

      <Prose>
        {
          'The program accepts integer literals, unary signs and the operators+,-,*,/. It parses an expression into a syntax tree and recursively evaluates the permitted nodes using exact rational arithmetic. Thus 1/3+2/3 equals 1 exactly; no floating-point tolerance is needed. It rejects calls, names, powers, decimal literals and division by zero under this declared grammar. It never executes the input as Python code.'
        }
      </Prose>

      <Prose>
        {'Download '}
        <a href={'/learn-code/synthetic-data/synthetic_verification.py'}>
          {'synthetic_verification.py'}
        </a>
        {'.'}
      </Prose>

      <Program file="synthetic_verification.py" />

      <Prose>
        {''}
        <code>{'arithmetic'}</code>
        {' owns the recursive evaluation. '}
        <code>{'check_candidate'}</code>
        {' returns separate final-answer and per-equality results. '}
        <code>{'procedural_tasks'}</code>
        {' samples integer leaves and constructs expressions with known answers. Run '}
        <code>{'python synthetic_verification.py'}</code>
        {'. For the incorrect derivation with final 20, the output is '}
        <code>{'final_correct: true'}</code>
        {' and '}
        <code>{'steps_valid: [false,false]'}</code>
        {'.'}
      </Prose>

      <Prose>
        {
          'This construction gives us many exactly labeled expressions within a small grammar. It does not automatically give varied natural-language reasoning or hard problems. A generator might repeat an easy template; a student might learn format cues instead of a general procedure. Change the grammar or test structure deliberately when studying transfer. Parsing and evaluation take time proportional to the syntax-tree size, apart from the growing cost of large-integer arithmetic.'
        }
      </Prose>

      <Prose>
        {'Other tasks need other evidence. A '}
        <strong>{'format check'}</strong>
        {' can require a question and an answer without checking either fact. A '}
        <strong>{'heuristic'}</strong>
        {' such as repetition rate measures a defined surface property. A '}
        <strong>{'learned judge'}</strong>
        {
          ' estimates a preference or correctness signal from its training and prompt; its confident score is not an oracle. '
        }
        <strong>{'Human inspection'}</strong>
        {
          ' can catch semantic errors but needs a specified sample and decision procedure before its rate can be interpreted statistically.'
        }
      </Prose>

      <Prose>
        {
          'Use the strongest applicable check, then describe its boundary. The real text experiment later uses a minimal usable-format filter and retains a separate manual audit. It does not relabel that filter as factual verification. This separation lets us see whether apparently usable rewrites actually help.'
        }
      </Prose>

      <span id="7-decision-matrix" aria-hidden="true" />
      <H2>{'5. Filtering changes the distribution and the bill'}</H2>

      <Prose>
        {
          'A verifier need not be perfect to improve the accepted subset. It also can remove useful material. We need the rates and denominators to distinguish these effects.'
        }
      </Prose>

      <SyntheticFigure id="S08" />

      <Prose>
        {
          'In the constructed population, 60 of 100 candidates are correct. The verifier accepts 54 of those 60 and 8 of the 40 incorrect candidates. It keeps 62 candidates. Its '
        }
        <strong>{'true-positive rate'}</strong>
        {', or recall on correct candidates, is 54/60=.9. Its '}
        <strong>{'false-positive rate'}</strong>
        {
          " is 8/40=.2. The precision of the accepted pool is 54/62≈.871. That exceeds the generator's unfiltered accuracy of .6."
        }
      </Prose>

      <Prose>
        {
          'There is no universal rule that selected quality must be the smaller of teacher quality and verifier quality. Those phrases do not even identify matching denominators. Here precision is a conditional probability given acceptance, while generator accuracy is an unconditional probability over candidates.'
        }
      </Prose>

      <Prose>
        {
          'Let c be the fraction correct, r the true-positive rate and f the false-positive rate. The accepted correct mass is cr, the accepted wrong mass is (1−c)f and their sum Z is the probability of keeping a candidate.'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {'Z=cr+(1-c)f,\\qquad\nP(\\mathrm{correct}\\mid\\mathrm{keep})=\\frac{cr}{Z}\\quad(Z>0).'}
        </MathBlock>
      </div>

      <Prose>
        {
          'Change prevalence c while keeping r and f fixed. A verifier can have the same class-conditional behavior yet very different accepted precision on a harder source population. If Z=0, there is no accepted pool and precision is undefined. Reporting zero or 100% would invent an observation.'
        }
      </Prose>

      <H3>{'Derive what happens to every kind of example'}</H3>

      <Prose>
        {
          "Correct/incorrect is one partition. Topic, language, difficulty and writing style are other partitions on which acceptance can vary. Let q(y) be the generator's probability of candidate y and a(y) its chance of acceptance."
        }
      </Prose>

      <SyntheticFigure id="S09" />

      <Prose>
        {
          'The joint probability of generating y and accepting it is q(y)a(y). Add that quantity over candidates to obtain Z, the total accepted mass. Dividing gives the distribution among accepted candidates:'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {"q_{\\mathrm{keep}}(y)=\\frac{q(y)a(y)}{\\sum_{y'}q(y')a(y')},\\qquad Z>0."}
        </MathBlock>
      </div>

      <Prose>
        {
          'For categories with q=[.6, .3, .1] and a=[1, .5, 0], products are [.6, .15, 0], Z=.75 and the retained distribution is [.8, .2, 0]. The third category has disappeared. This may be desirable if it represents invalid records, or harmful if it represents a valid minority style the checker dislikes. High aggregate precision alone cannot distinguish those cases.'
        }
      </Prose>

      <Prose>
        {
          'A deterministic checker has acceptance 0 or 1 for each exact candidate. A probabilistic judge or an aggregate category rate can take intermediate values. The equation handles both. It explains why the selected corpus should be audited by meaningful subgroups, not just by its final size.'
        }
      </Prose>

      <H3>{'Pay for rejected attempts too'}</H3>

      <Prose>
        {
          'Suppose an independent candidate costs .04 units to generate and .01 units to check. With stationary acceptance Z=.62, the number of attempts until a keep has a geometric distribution with mean 1/Z. Expected cost per kept candidate is .05/.62≈.080645 units. These are constructed costs, not API prices.'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            '\\mathbb E[\\mathrm{cost\\ per\\ keep}]=\\frac{c_{\\mathrm{generate}}+c_{\\mathrm{check}}}{Z}.'
          }
        </MathBlock>
      </div>

      <Prose>
        {
          'This form assumes the same average attempt cost and acceptance process on each retry. If outputs have different lengths or the prompt changes after rejection, measure those costs and policies explicitly. A finite candidate budget can finish with no keeps. At Z=0 no number of identical retries yields a keep; there is no finite expected cost per success.'
        }
      </Prose>

      <Prose>
        {'The '}
        <code>{'selection'}</code>
        {' function in the verification program computes these quantities. Read '}
        <code>{'None'}</code>
        {
          ' for an undefined result. Precision, coverage and expense describe different parts of the decision; optimizing only one can discard the data the student most needs.'
        }
      </Prose>

      <span id="9-failure-modes-gotchas" aria-hidden="true" />
      <H2>{'6. Preserve families before counting diversity'}</H2>

      <Prose>
        {
          'Filtering counts rows, but rows have relationships. If three rewrites came from one paragraph and one from another, four unique strings still represent only two source families. A train/test split made after generation can put near-identical evidence on both sides.'
        }
      </Prose>

      <SyntheticFigure id="S10" />

      <Prose>
        {
          "Assign source families to splits before generating their descendants. Every descendant inherits its parent's split. Then examine additional relations, such as a duplicate joining two apparently different sources. Connected groups must stay together if those relations would leak the information being evaluated. The earlier "
        }
        <a
          href={
            '/learn/path/full-curriculum/data-curation-deduplication-minhash-bloom-filters?module=large-language-models'
          }
        >
          {'deduplication lesson'}
        </a>
        {
          ' develops candidate matching and connected-component grouping; source lineage adds another kind of edge to the same reasoning.'
        }
      </Prose>

      <Prose>
        {
          'Exact text hashes detect exact equality under the chosen normalization. They do not prove different hashes mean different facts, nor prove two independently written records lack common ancestry. Conversely, aggressive normalization can erase distinctions that matter to a task. Our text filter uses Unicode NFKC and whitespace collapse, keeping case and punctuation. The rule is explicit so its copy decisions can be reproduced.'
        }
      </Prose>

      <SyntheticFigure id="S11" />

      <Prose>
        {
          "If records are equally weighted, family A's three rewrites receive weight .75 and family B's one rewrite receives .25. An "
        }
        <strong>{'effective family count'}</strong>
        {
          ' is 1/Σ_f w_f². It equals 1/(.75²+.25²)=1.6 here. With equal family weights it would be 2. It summarizes concentration over defined families, not semantic diversity or a number of independent scientific observations.'
        }
      </Prose>

      <Prose>
        {
          'Adding another rewrite to A increases string count but leaves family support at two and changes the weights to .8/.2. The effective count becomes 1/.68≈1.471. The added text may still be pedagogically useful; the count simply prevents us from calling it a new source of evidence. If the sampler weights windows rather than documents, recompute family weights using the window probabilities.'
        }
      </Prose>

      <Prose>
        {'Download '}
        <a href={'/learn-code/synthetic-data/synthetic_corpus.py'}>{'synthetic_corpus.py'}</a>
        {'.'}
      </Prose>

      <Program file="synthetic_corpus.py" />

      <Prose>
        {''}
        <code>{'read_sources'}</code>
        {
          ' preserves original row IDs and excludes only whitespace or decorative asterisms under the predeclared source rule. '
        }
        <code>{'select_candidates'}</code>
        {
          ' retains every acceptance decision, parent ID and rejection reason; exact output duplicates use the first normalized occurrence across the output pool. No output is silently replaced with a more attractive one.'
        }
      </Prose>

      <Prose>
        {''}
        <code>{'diagnostics'}</code>
        {
          ' reports counts, byte lengths, normalized uniqueness and document-weighted family concentration. These are descriptive measurements. They are not a learned factuality score. '
        }
        <code>{'WindowPool'}</code>
        {
          ', used next, represents sampling exposure separately so document counts cannot masquerade as token counts.'
        }
      </Prose>

      <H2>{'7. Turn a corpus mixture into actual training targets'}</H2>

      <Prose>
        {
          'Now we have original and generated records. Saying “half synthetic” is incomplete: half of documents, bytes, tokens, windows, batches or loss weight? These can produce different training distributions even with the same files.'
        }
      </Prose>

      <SyntheticFigure id="S12" />

      <Prose>
        {
          'For a simple contrast, suppose one original document has 100 target tokens and one generated document has 20. Sampling each document equally and using all its targets gives expected token mass 100:20, so generated tokens contribute 1/6, not 1/2. A sampler that always takes one equal-length window per draw has a different denominator. State the actual operation.'
        }
      </Prose>

      <Prose>
        {
          'Our study uses UTF-8 bytes as token IDs 0–255. A window contains 33 bytes: the first 32 are inputs and the last 32 are their one-position-shifted targets. Windows stay inside one source record. A record of L bytes supplies max (0, L−32) eligible starts. A uniform draw over all starts weights each record in proportion to that count, rather than equally by document.'
        }
      </Prose>

      <Prose>
        {''}
        <code>{'WindowPool'}</code>
        {
          ' stores each record once plus cumulative window counts. Binary search maps an integer rank to a record and starting offset. It does not construct a large copied array of every overlapping window. With R records and B windows per batch, lookup costs O(B log R) plus the O(B×32) bytes copied into the batch; stored corpus size remains linear in the original bytes and record count.'
        }
      </Prose>

      <Prose>
        {
          "Before each example, draw a branch. With probability α=.5 choose the generated pool; otherwise choose the original pool. Draw uniformly among eligible windows inside the selected pool. Because every window has 32 targets, α is also the expected generated fraction of selected training targets. A finite run's actual fraction need not equal .5, so we record its count."
        }
      </Prose>

      <SyntheticFigure id="S13" />

      <Prose>
        {
          "The model predicts each next byte from the permitted input prefix. Changing a future byte cannot change an earlier prediction. A byte token may represent only part of a multi-byte character; the decoder is learning byte sequences, and byte perplexity is not directly comparable to a subword model's token perplexity."
        }
      </Prose>

      <Prose>
        {
          'For model parameters θ and selected target bytes b, the batch objective is ordinary mean negative log probability:'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            'L(\\theta)=-\\frac{1}{BC}\\sum_{n=1}^{B}\\sum_{t=1}^{C}\n\\log p_\\theta(b_{n,t+1}\\mid b_{n,1:t}),\\qquad B=16,\\ C=32.'
          }
        </MathBlock>
      </div>

      <Prose>
        {
          'There are 512 selected targets per update. At 300 updates each condition receives 153,600 targets. This count includes repeated and overlapping contexts; it is not a claim of 153,600 independent observations or distinct source bytes.'
        }
      </Prose>

      <Prose>
        {'The network is the exact '}
        <a href={'/learn-code/causal-language-modeling/tiny_causal_lm.py'}>
          {'TinyLM implementation'}
        </a>
        {
          ' from the causal-language-modeling lesson. It uses learned byte and position embeddings, two causal attention/feed-forward blocks and an output head. Here vocabulary 256, context 32, width 32 and two heads give 42,624 parameters. The downloadable bundle includes that unchanged helper; this lesson implements the new corpus sampler and experiment around it.'
        }
      </Prose>

      <H3>{'Use the ordinary library while preserving the calculation'}</H3>

      <Prose>
        {"PyTorch's "}
        <code>{'cross_entropy'}</code>
        {
          ' receives logits shaped (512,256) and target IDs shaped (512). The default mean reduction divides by 512, matching the equation. Equivalently, apply '
        }
        <code>{'log_softmax'}</code>
        {
          ", gather each target's entry, negate and average. Do not divide once by 512 and again by batch size."
        }
      </Prose>

      <Prose>
        {'Download '}
        <a href={'/learn-code/synthetic-data/synthetic_library.py'}>{'synthetic_library.py'}</a>
        {'.'}
      </Prose>

      <Program file="synthetic_library.py" />

      <Prose>
        {"It compares scratch temperature/top-p with Transformers' actual "}
        <code>{'TemperatureLogitsWarper'}</code>
        {' and '}
        <code>{'TopPLogitsWarper'}</code>
        {
          ', then compares the explicit loss with PyTorch. The inputs and conventions are matched. Separate random number generators are not expected to produce identical token sequences merely because they sample the same distribution.'
        }
      </Prose>

      <Prose>
        {'The same program uses '}
        <code>{'torch.multinomial'}</code>
        {
          ' for 100,000 categorical draws and reports observed frequencies around [.6, .3, .1]. They need not equal those values exactly. The statistical target is the distribution; the exact native loss and probability comparisons use deterministic inputs. Run '
        }
        <code>{'python synthetic_library.py'}</code>
        {
          ' with the pinned requirements supplied in the file index. Later experiments use this same ordinary library route for the actual student update.'
        }
      </Prose>

      <Prose>
        {
          'For evaluation, reset at each untouched paragraph. Predict every byte after its first exactly once using at most 32 preceding bytes from that paragraph. Sum all negative log probabilities and divide by the total number of targets. Averaging paragraph means equally would give a short paragraph the same weight as a long one and answer a different question.'
        }
      </Prose>

      <span id="5-production-implementation" aria-hidden="true" />
      <H2>{'8. Generate a real small corpus'}</H2>

      <Prose>
        {"Our source is Lewis Carroll's public-domain "}
        <strong>{"Alice's Adventures in Wonderland"}</strong>
        {
          '. We reuse the actual text files supplied in Causal Language Modeling, so the new operation is corpus generation rather than an unrelated dataset change. These are literary paragraphs with long sentences and narrative details; a small generator may struggle to preserve them.'
        }
      </Prose>

      <Prose>
        {
          'The supplied training and held-out files contain 18 and 6 rows respectively. Three rows are decorative asterisms, including one exact cross-split duplicate. The rule fixed before generation excludes whitespace/asterisk-only rows and retains them in an exclusion ledger. This leaves 17 training prose records and 4 later held-out prose records. No held-out paragraph supplies a generation prompt. The paragraphs still share a book, author and characters, and the teacher could have encountered the book in its original training.'
        }
      </Prose>

      <SyntheticFigure id="S14" />

      <Prose>
        {'The actual teacher is '}
        <code>{'google/flan-t5-small'}</code>
        {' at revision '}
        <code>{'0fc9ddf78a1e988dac52e2dac162b0ede4fd74ab'}</code>
        {', with 76,961, 152 loaded parameters. It is an '}
        <strong>{'encoder-decoder'}</strong>
        {
          ' model: the encoder reads the prompt, and the decoder predicts its output while attending to the encoded prompt and its own earlier output. This differs from simply appending a prompt to a decoder-only model. We use the existing pretrained checkpoint in evaluation/inference mode; no teacher weight is updated.'
        }
      </Prose>

      <Prose>
        {
          'Each training paragraph receives two prompts. The plain prompt requests a concise rewrite preserving facts. The QA prompt requests one question '
        }
        <strong>{'and its answer'}</strong>
        {
          ' using only the paragraph. Temperature is .8, top-p .9, top-k is disabled, sampling is enabled, one beam is used and the maximum is 96 new decoder tokens. Seeds are 73 plus the stable record index. These are a fixed teaching protocol, not recommended optimal generation settings.'
        }
      </Prose>

      <Prose>
        {
          "The program records full prompt IDs and the actual retained encoder IDs. Inputs longer than 512 tokens would be clipped deterministically and flagged, so the retained context could be inspected. None of these 34 prompts required clipping. Every output ID sequence includes the decoder-start token; 96 new tokens can therefore yield 97 stored IDs. Two outputs ended at the length cap; the other 32 reached EOS. The corpus used 1,062 new decoder tokens in total. These teacher-token counts use its tokenizer, not the student's byte vocabulary."
        }
      </Prose>

      <Prose>
        {'Download '}
        <a href={'/learn-code/synthetic-data/synthetic_generate.py'}>{'synthetic_generate.py'}</a>
        {'.'}
      </Prose>

      <Program file="synthetic_generate.py" />

      <Prose>
        {''}
        <code>{'prompt_for'}</code>
        {' constructs the exact request. '}
        <code>{'generate_record'}</code>
        {
          ' tokenizes without hiding truncation, sets the per-record seed, calls ordinary Transformers '
        }
        <code>{'generate'}</code>
        {
          " and stores text, IDs, termination and timing. The model loader pins both model and tokenizer revision. The tested Transformers 5.17 loader preserves the checkpoint's distinct shared-embedding and output-head weights; it reports that they cannot be tied despite the saved tie configuration. We keep the native loaded values."
        }
      </Prose>

      <Prose>
        {'The '}
        <a href={'/learn-code/synthetic-data/synthetic-programs-data.zip'}>
          {'complete program-and-data archive'}
        </a>
        {
          ' contains all seven programs, their unchanged TinyLM helper, source files, provenance and the measured outputs. Extract it into one directory, create a Python environment and install '
        }
        <a href={'/learn-code/synthetic-data/requirements.txt'}>{'requirements.txt'}</a>
        {
          '. The tested snapshot uses NumPy 2.5.3, PyTorch 2.14, Transformers 5.17, Tokenizers .23.2 and SentencePiece .2.1. A suitable CPU PyTorch wheel is enough. Read '
        }
        <a href={'/learn-code/synthetic-data/README.md'}>{'README.md'}</a>
        {' for the complete commands.'}
      </Prose>

      <Prose>
        {'To inspect the retained run, use '}
        <code>{'candidates.json'}</code>
        {'; no generation is needed. To execute a separate run, choose a new filename:'}
      </Prose>

      <CodeBlock language={'shell'}>
        {'python synthetic_generate.py --cache .model-cache --output my-candidates.json'}
      </CodeBlock>

      <Prose>
        {'The first invocation may acquire the pinned model. '}
        <code>{'--local-only'}</code>
        {
          ' reuses a populated cache and fails if required files are missing. The model has its own Apache-2.0 license; the source-text provenance travels with the text. Exclusive output creation prevents overwriting the supplied candidate file. A failed execution is a failed execution, not permission to silently regenerate a nicer candidate.'
        }
      </Prose>

      <H3>{'Inspect what was actually generated'}</H3>

      <SyntheticFigure id="S15" />

      <Prose>
        {'Read '}
        <code>{'train-00-plain'}</code>
        {
          ' beside its parent. The teacher calls Alice “a schoolteacher and a writer,” which the supplied paragraph does not say. '
        }
        <code>{'train-11-plain'}</code>
        {' says Alice went through the door even though its parent describes trying locked doors. '}
        <code>{'train-15-plain'}</code>
        {
          ' turns a warning about a hot poker into a claim about being a poker player. These failures are visible in the unchanged outputs; they were not inserted by a simulator.'
        }
      </Prose>

      <Prose>
        {
          'Some outputs preserve fragments of the source. The long Dinah rewrite retains cat, milk and bat details but repeats itself and stops mid-sentence at the cap. The QA outputs supply questions without the requested answers. A question mark and fluent wording do not establish that the requested example was constructed.'
        }
      </Prose>

      <Prose>
        {
          'The predeclared usable-format filter normalizes text, requires at least 33 UTF-8 bytes, excludes an exact normalized parent copy and collapses exact candidate duplicates. It does '
        }
        <strong>{'not'}</strong>
        {
          ' check factual consistency or the requested QA structure. Of 34 candidates, it keeps 32; two short QA outputs have only 30 and 28 normalized bytes. No candidate is excluded by the copy/duplicate rules. All originals, including both rejections and the weak rewrites, remain available.'
        }
      </Prose>

      <Prose>
        {'The accompanying '}
        <code>{'audit.json'}</code>
        {
          ' gives descriptive notes after reading the entire finite set against its parents. Those notes did not determine membership in the training pool. They are not calibrated quality scores or a general hallucination rate for FLAN. The example demonstrates the gap between a mechanical eligibility rule and a semantic claim. We now test the corpus the rule actually produced.'
        }
      </Prose>

      <span id="6-visual-walkthrough" aria-hidden="true" />
      <H2>{'9. Measure the resulting student'}</H2>

      <Prose>
        {
          'The question is deliberately narrow: under the same update and target budget, does replacing half the selected training windows with these generated records improve prediction of the four untouched natural paragraphs? We compare three conditions, keeping the target vocabulary and model architecture fixed.'
        }
      </Prose>

      <SyntheticFigure id="S16" />

      <Prose>
        {'The '}
        <strong>{'raw'}</strong>
        {' condition always samples original windows. The '}
        <strong>{'copy'}</strong>
        {
          ' condition represents originals plus exact copies, mapping both sampling branches to the same original-window indices. The '
        }
        <strong>{'generated'}</strong>
        {
          ' condition uses the generated pool when the branch draw is below .5 and originals otherwise. There are 8,092 eligible original windows and 2,927 eligible generated windows. Their sizes affect which indices a shared uniform draw selects, not the 32-target length of each selected window.'
        }
      </Prose>

      <Prose>
        {
          'For each seed, all three students begin with identical parameter values. They receive the same precomputed branch and window-selection draws. Raw and copy therefore receive byte-identical batches in the same order. They execute independently, providing a strict null: their weights and losses should remain identical. This does not claim ordinary duplication never matters. Duplicating only one source, changing a sampler or training for more updates can change exposure. Here exposure is deliberately held equal.'
        }
      </Prose>

      <Prose>
        {
          'Every run makes 300 updates of 16 windows, with AdamW learning rate .003, weight decay .01 and gradient-norm cap 1. Dropout is zero. Seeds are 17, 29 and 43, paired across conditions. Evaluations at updates 0,100 and 200 are diagnostics; update 300 was selected as the comparison point before any results existed. Each evaluation sums 1,862 held-out next-byte targets.'
        }
      </Prose>

      <Prose>
        {'Download '}
        <a href={'/learn-code/synthetic-data/synthetic_student.py'}>{'synthetic_student.py'}</a>
        {'.'}
      </Prose>

      <Program file="synthetic_student.py" />

      <Prose>
        {''}
        <code>{'fit'}</code>
        {
          ' composes the window pools with the unchanged TinyLM, all-token cross-entropy and optimizer. '
        }
        <code>{'grouped_score'}</code>
        {
          ' reuses the prerequisite scorer separately for each paragraph, then pools its sums and counts. '
        }
        <code>{'state_hash'}</code>
        {' compares exact parameter bytes for the copy null. '}
        <code>{'inspector'}</code>
        {
          ' records all 256 probabilities at predefined held-out positions from the saved seed-17 students.'
        }
      </Prose>

      <Prose>
        {'Run '}
        <code>{'python synthetic_student.py --candidates candidates.json --output my-study'}</code>
        {
          ' to execute a new, separately named study. The output directory must not already exist. To inspect our results, open the supplied '
        }
        <code>{'study.json'}</code>
        {
          ' instead. The browser displays those recorded measurements; it does not retrain a student.'
        }
      </Prose>

      <SyntheticFigure id="S17" />

      <Prose>
        {'Lower byte NLL is better for this prediction task. The final measured results are:'}
      </Prose>

      <NeuralTable
        caption={'9. Measure the resulting student'}
        headers={[
          <>{'Seed'}</>,
          <>{'Raw and exact-copy byte NLL'}</>,
          <>{'Generated-mixture byte NLL'}</>,
          <>{'Generated minus raw'}</>,
        ]}
        rows={[
          [<>{'17'}</>, <>{'2.295572'}</>, <>{'2.305405'}</>, <>{'+.009832'}</>],
          [<>{'29'}</>, <>{'2.252961'}</>, <>{'2.244042'}</>, <>{'−.008918'}</>],
          [<>{'43'}</>, <>{'2.339097'}</>, <>{'2.324776'}</>, <>{'−.014321'}</>],
        ]}
      />

      <Prose>
        {
          "All three copy conditions match their raw partner's complete history and final weights exactly. Generated text hurts slightly in seed 17 and helps slightly in seeds 29 and 43. The mean paired difference is about −.004469 nats per target byte. Three seeds on four neighboring paragraphs do not establish a general improvement or an optimal mixture. The seed-paired view keeps the disagreement visible instead of presenting only the favorable average."
        }
      </Prose>

      <Prose>
        {
          'The generated target fractions are approximately 51.021%, 50.271% and 50.083%. These are the realized counts under a .5 branch probability. They are not the ratio of generated documents to originals. Every arm still receives exactly 153,600 targets. Repeated windows and correlated paragraphs limit the evidence; a large count of loss terms is not a large collection of independent books.'
        }
      </Prose>

      <Prose>
        {
          'For seed 17, raw byte perplexity is about 9.930 and generated-mixture perplexity about 10.028, obtained by exponentiating each mean byte NLL. It is a probability-quality measure on the held-out bytes, not a count of factual errors. The semantic audit already found invented details in the generated corpus. A small loss reduction can coexist with bad factual rewrites; one measurement does not certify the other.'
        }
      </Prose>

      <SyntheticFigure id="S18" />

      <Prose>
        {
          "Choose a recorded paragraph and target position. The inspector shows the permitted byte context and the observed target, then the saved model's distribution. Switching arms changes fixed student weights. It does not select a better checkpoint or invent a new fitted result. If only the largest probabilities fit in the drawing, the remaining probability mass remains accounted for. A low-probability observed target contributes a larger negative log probability to evaluation."
        }
      </Prose>

      <Prose>
        {
          'Generation also cost work: the 34 recorded calls took about 48.4 seconds in total on this CPU, excluding model loading. Student timings in the retained results include diagnostic evaluation, and these small timings are sensitive to other work on the machine. They are provenance, not a claimed hardware speedup. Any efficiency study must account for source preparation, generation, selection, training and evaluation together.'
        }
      </Prose>

      <span id="8-what-scales-and-what-doesn-t" aria-hidden="true" />
      <H2>{'10. Follow one generation into the next'}</H2>

      <Prose>
        {
          'So far, generated data entered one student run. A different question arises when each generation supplies the data for the next. To see one failure mechanism precisely, replace language with a finite population of three categories. This makes the assumptions and every lost count inspectable.'
        }
      </Prose>

      <SyntheticFigure id="S19" />

      <Prose>
        {
          'The initial distribution is q₀=[.6, .3, .1]. With sample size N=10, it can be represented by counts [6, 3, 1]. Draw ten independent categories according to q₀, then use their observed frequencies as q₁. Repeat from q₁. This is '
        }
        <strong>{'replacement'}</strong>
        {
          ': the previous population supplies probabilities, but its original counts are not kept in the next training population.'
        }
      </Prose>

      <Prose>
        {
          'Even a category with positive probability may receive no sampled example. The rare category is missed in all ten draws with probability (1−.1)¹⁰≈.348678. If its new frequency is zero, later pure replacement draws never select it. Zero is absorbing for that category under this specified algorithm.'
        }
      </Prose>

      <Prose>
        {
          'This is a finite-sampling mechanism, not a theorem that every real language model recursively trained on generated text must collapse. Real models have parameterization, optimization error, conditioning and selection; text categories are not always known. The calculation isolates one reason that sampling from an estimated distribution can lose support.'
        }
      </Prose>

      <H3>{'An unbiased mean does not preserve every population'}</H3>

      <Prose>
        {
          'Let nᵢ count category i in the next N draws and qᵢ′=nᵢ/N. Each draw contributes a Bernoulli indicator with mean qᵢ and variance qᵢ(1−qᵢ). Independent sums give:'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            "\\mathbb E[q_i'\\mid q]=q_i,\\qquad\n\\operatorname{Var}(q_i'\\mid q)=\\frac{q_i(1-q_i)}{N}."
          }
        </MathBlock>
      </div>

      <Prose>
        {
          'The estimate is conditionally unbiased. Across many possible populations its average remains at the current probability. Individual populations still fluctuate and can lose categories. “Unbiased” does not mean a particular run preserves diversity.'
        }
      </Prose>

      <Prose>
        {
          'Define H(q)=1−Σᵢqᵢ². It is the probability that two independent draws from q belong to different categories. Initially H=.54. Use E[qᵢ′²|q]=Var(qᵢ′|q)+E[qᵢ′|q]², add over i, and subtract from 1:'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            "\\begin{aligned}\n\\mathbb E[H(q')\\mid q]\n&=1-\\sum_i\\left[q_i^2+\\frac{q_i(1-q_i)}N\\right]\\\\\n&=\\left(1-\\frac1N\\right)H(q).\n\\end{aligned}"
          }
        </MathBlock>
      </div>

      <Prose>
        {
          'At N=10, expected H after one replacement is .9×.54=.486. Repeating the conditional expectation gives E[H(q_g)]=.54(1−1/N)^g. The expected probability vector can remain unchanged while the expected within-population diversity falls, because H is nonlinear. This is the useful distinction the live paths make visible.'
        }
      </Prose>

      <SyntheticFigure id="S20" />

      <Prose>
        {''}
        <strong>{'Retaining an original anchor'}</strong>
        {' changes the transition. Mix the fixed original distribution with the new sample:'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            "q'=(1-\\alpha)q_0+\\alpha\\widehat q,\\qquad\n\\widehat q\\sim\\operatorname{Multinomial}(N,q)/N."
          }
        </MathBlock>
      </div>

      <Prose>
        {
          "For α<1, qᵢ′ is at least (1−α)q₀ᵢ. The original rare category therefore keeps a floor. At α=0 the distribution never changes; at α=1 this becomes pure replacement. Retaining an original pool of N records plus a latest sampled pool of N records uses 2N stored records, with exposure weights chosen by α. The floor protects the anchor's support, not missing facts or biases absent from that anchor. Reusing the same original text is not receiving fresh independent evidence."
        }
      </Prose>

      <Prose>
        {''}
        <strong>{'Accumulation'}</strong>
        {
          ' instead keeps all prior populations. Initially there are N records. At generation g there are (g+1)N; adding N new draws gives new-sample weight w=1/(g+2). The new empirical mixture is q′=(1−w)q+wq̂. Its conditional mean is q and its conditional variance is w²qᵢ(1−qᵢ)/N. The same square calculation yields:'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {"\\mathbb E[H(q')\\mid q]\n=\\left(1-\\frac{1}{N(g+2)^2}\\right)H(q)."}
        </MathBlock>
      </div>

      <Prose>
        {
          "At g=0 and N=10, expected H is .54×.975=.5265. That decline is smaller than replacement's .486 because the new sample receives only half the mixture weight. The storage pool grows; it is not a fixed-budget comparison. In a training system, training one epoch over that growing pool also increases the number of updates unless another budget is held fixed."
        }
      </Prose>

      <Prose>
        {''}
        <strong>{'Fresh observations'}</strong>
        {
          ' draw again from an external source distribution. In our fixture that source is q₀. A category missing from the current population can reappear because the external distribution still gives it mass. That is a different transition from sampling only the current population or rereading a fixed stored anchor. Our three-category fixture cannot discover a category that the declared external distribution itself assigns zero probability.'
        }
      </Prose>

      <SyntheticFigure id="S21" />

      <Prose>
        {'Download '}
        <a href={'/learn-code/synthetic-data/synthetic_recursive.py'}>{'synthetic_recursive.py'}</a>
        {'.'}
      </Prose>

      <Program file="synthetic_recursive.py" />

      <Prose>
        {''}
        <code>{'trajectory'}</code>
        {
          " implements the four transition rules using NumPy's multinomial sampler and records every sampled count. "
        }
        <code>{'expected_h'}</code>
        {
          ' computes the exact replacement and accumulation recurrences. The main program averages 2,000 seeded replacement paths alongside the expectation. The simulated average approaches but need not equal the analytical curve. A single trajectory can rise or fall in H at a step; the formula describes a conditional expectation.'
        }
      </Prose>

      <Prose>
        {'Run '}
        <code>{'python synthetic_recursive.py'}</code>
        {
          '. Change N while keeping its meaning as the number of new samples explicit. Each multinomial draw and stored probability vector costs O(K) storage for K categories; retaining an actual growing text corpus would cost its growing number of bytes. The small probability simulator does not reproduce that physical storage expense or neural optimization.'
        }
      </Prose>

      <H2>{'11. Read research without erasing the conditions'}</H2>

      <Prose>
        {
          'The experiments and derivations now give us questions to ask of a large study. What supplied the content? Which generator and prompts created it? What was discarded? What quantity was mixed? What was held fixed? Which held-out task improved, and what did generation cost?'
        }
      </Prose>

      <SyntheticFigure id="S22" />

      <Prose>
        {
          'Use the live cost example to compare two proposed filters. A stricter filter can raise accepted precision yet require more attempts per retained record. If it also removes a whole topic, its apparent average gain may conceal lost coverage. Cost and conditional quality therefore belong beside the source and selection details, not in a final token-count footnote.'
        }
      </Prose>

      <NeuralTable
        caption={'11. Read research without erasing the conditions'}
        headers={[
          <>{'Primary study or release'}</>,
          <>{'What it helps explain'}</>,
          <>{'Conditions to carry forward'}</>,
        ]}
        rows={[
          [
            <>{'WRAP'}</>,
            <>
              {
                'Rephrasing existing web text into different styles can alter what a student learns per token.'
              }
            </>,
            <>
              {
                'Its measured training benefits depend on source, styles, student and evaluation; generation expense is a separate part of total cost.'
              }
            </>,
          ],
          [
            <>{'Cosmopedia'}</>,
            <>
              {
                'Topic/source organization, prompt diversity, generation and overlap screening form a practical corpus-building workflow.'
              }
            </>,
            <>
              {
                'It is a release account with acknowledged hallucinations; its model comparisons are not our controlled experiment, and overlap screening is not a guarantee against contamination.'
              }
            </>,
          ],
          [
            <>{'EMNLP 2025 systematic pre-training study'}</>,
            <>
              {'Controlled synthetic-data comparisons can depend on generator, mixture and scale.'}
            </>,
            <>
              {
                'Separate actual training runs from extrapolated much-larger-scale projections. A projected result was not measured at that scale.'
              }
            </>,
          ],
          [
            <>{'FinePhrase, April 2026 preprint'}</>,
            <>{'Source choice, generator choice and requested format interact in pre-training.'}</>,
            <>
              {
                'The inspected study uses 1.2B students and 21B training tokens on English evaluations. Task tradeoffs and cross-hardware cost accounting constrain generalization.'
              }
            </>,
          ],
          [
            <>{'Accumulation study'}</>,
            <>
              {
                'Replacing all previous data and accumulating historical data are different recursive regimes.'
              }
            </>,
            <>
              {
                'Its settings, update budgets and modeling assumptions matter; growing the pool does not automatically keep training compute fixed.'
              }
            </>,
          ],
        ]}
      />

      <Prose>
        {
          'These sources motivate hypotheses and experimental controls. They do not establish a universal synthetic-data ratio, a universal advantage for a smaller teacher or a guarantee that a retained fraction of original data prevents every failure. Our categorical recurrence is derived for its explicit transition; our Alice measurements concern one small, weak corpus and fixed students.'
        }
      </Prose>

      <Prose>
        {
          'For a useful next study, change one declared cause. For example, keep teacher, sources, student seeds and target budgets fixed while comparing a semantic verification policy with the present usable-format policy. Freeze its rubric and threshold using separate development evidence. Retain rejected candidates and account for how selection changes families, styles and costs. Evaluate natural-language prediction and a relevant factual task separately rather than asking byte NLL to certify both.'
        }
      </Prose>

      <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">
        <span id="11-self-check-exercises" aria-hidden="true" />
        <H2>{'12. Practice with changed inputs'}</H2>

        <Prose>
          {
            'Use the complete programs to inspect each calculation. Hints and worked solutions follow each task; comparisons should preserve the stated units.'
          }
        </Prose>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'A. Keep the crossing token'}</H3>

          <Prose>
            {
              'Probabilities are [.4, .35, .2, .05]. Implement nucleus selection at p=.6, preserving the crossing token. What probabilities result, and what changes at p=1?'
            }
          </Prose>

          <details>
            <summary>Hint</summary>

            <Prose>
              {'Accumulated mass after one token is below .6; after two it exceeds .6.'}
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>

            <Prose>
              {
                'Retain IDs 0 and 1 with total .75, yielding [8/15, 7/15, 0, 0]. At p=1 all four probabilities remain. An implementation that retains only candidates whose cumulative mass is at most .6 would keep only the first token and violate the rule. Test your function against '
              }
              <code>{'distribution(np.log([.4,.35,.2,.05]), top_p=.6)'}</code>
              {' and the p=1 null. Also test an exact tie using a declared tie order.'}
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'B. Debug an inverse-CDF sampler'}</H3>

          <Prose>
            {'A sampler uses '}
            <code>{'searchsorted(cumulative,u,side="left")'}</code>
            {
              ' on [0, .2, .8, 0]. Explain its outputs at u=0 and u=.2, then implement the interval convention used here.'
            }
          </Prose>

          <details>
            <summary>Hint</summary>

            <Prose>{'A zero-mass entry must never receive a draw, including at zero.'}</Prose>
          </details>

          <details>
            <summary>Worked solution</summary>

            <Prose>
              {
                'Cumulative masses are [0, .2, 1, 1]. The faulty sampler returns ID 0 at zero and ID 1 at .2. Half-open intervals assign zero to ID 1 and .2 to ID 2. Validate a normalized vector and u in [0, 1), then retain only positive-mass entries and their original token IDs. Accumulate those masses, divide by their final sum to absorb accepted rounding error, and set their final cumulative value to 1. Use '
              }
              <code>{'side="right"'}</code>
              {
                " and map the resulting support position back to the original token ID. Merely forcing the full vector's final cumulative value to 1 can give a trailing zero-mass token a tiny interval: test ten masses of .1 followed by zero at "
              }
              <code>{'np.nextafter(1., 0.)'}</code>
              {
                '. The corrected sampler returns ID 9, never ID 10. For the original vector, u=.1999, .2 and .9999 give IDs 1, 2, 2. Return the integer token ID, not its position in the shortened support array.'
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'C. Separate answer and derivation'}</H3>

          <Prose>
            {
              'For(3+4)×2, a candidate writes “3+4=8;8×2=14” and concludes 14. Write separate checks for its final answer and its equalities. What remains unproved even if all written equalities are true?'
            }
          </Prose>

          <details>
            <summary>Hint</summary>

            <Prose>
              {'Reuse exact rational evaluation, never '}
              <code>{'eval'}</code>
              {' arbitrary text.'}
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>

            <Prose>
              {'The correct answer is 14, so the final-answer check passes. Both equalities fail. '}
              <code>{"check_candidate('(3+4)*2','14',['3+4=8','8*2=14'])"}</code>
              {
                ' reports that distinction. Even true equalities could be irrelevant or disconnected; they do not by themselves establish a complete derivation of the asked problem. Extend a checker only after defining how one verified state must lead to the next. A grammar check or final match cannot supply that missing relation.'
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'D. Change prevalence before trusting precision'}</H3>

          <Prose>
            {
              'A generator is correct with probability .2. A verifier accepts 90% of correct candidates and 10% of incorrect ones. Compute acceptance, accepted precision, and expected cost per keep when each attempt costs .06 units.'
            }
          </Prose>

          <details>
            <summary>Hint</summary>

            <Prose>{'Keep conditional rates separate from population masses.'}</Prose>
          </details>

          <details>
            <summary>Worked solution</summary>

            <Prose>
              {
                'Accepted correct mass is .18, wrong mass .08, total Z=.26. Precision is .18/.26=9/13≈.692308. Expected cost is .06/.26=3/13≈.230769 units under independent stationary attempts. The true-positive rate remains .9; it is not the accepted precision. With Z=0, report no accepted population and no finite expected cost per keep.'
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'E. Construct a support failure'}</H3>

          <Prose>
            {
              'The generator emits categories with masses [.5, .3, .2]. A filter accepts them with rates [.8, 0, .5]. Derive the retained distribution and name a task for which the missing category could matter.'
            }
          </Prose>

          <details>
            <summary>Hint</summary>

            <Prose>{'Multiply before normalizing.'}</Prose>
          </details>

          <details>
            <summary>Worked solution</summary>

            <Prose>
              {
                'Products are [.4, 0, .1], total .5 and retained masses [.8, 0, .2]. If the middle category is valid low-resource-language material, the filter has eliminated that support even if it improves another quality metric. The task example is a constructed possibility, not an empirical claim about a particular released filter. Test selection by subgroup and preserve rejection provenance.'
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'F. Repair a family split'}</H3>

          <Prose>
            {
              'Sources A and B initially belong to training and testing. Rewrite A2 is placed in testing, and a duplicate relation later connects B to another A descendant. Which grouping rule prevents evaluating on related training evidence?'
            }
          </Prose>

          <details>
            <summary>Hint</summary>

            <Prose>
              {'Combine parent edges and relevant duplicate edges before the final split.'}
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>

            <Prose>
              {
                "A2 inherits A's group, so it cannot be held out independently from A. The duplicate relation joins A's and B's connected groups under this leakage definition. Assign the resulting component wholly to one split, then rebuild the other split from independent components. Do not merely rename A2 or delete its parent ID. If the relation is a noisy similarity match, inspect and record the grouping decision rather than calling all similarity proven duplication."
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'G. Distinguish string count and family exposure'}</H3>

          <Prose>
            {
              'Three families have target-exposure weights [.5, .25, .25]. Calculate the effective family count. What is it for equal weights over the same three families?'
            }
          </Prose>

          <details>
            <summary>Hint</summary>

            <Prose>{'Square weights; do not count strings in place of families.'}</Prose>
          </details>

          <details>
            <summary>Worked solution</summary>

            <Prose>
              {
                'Squared masses sum .25+.0625+.0625=.375, giving 8/3≈2.667. Equal weights give 3. Both populations have three represented families. The effective count describes concentration under the specified target sampler; it does not certify three independent facts or measure semantic diversity.'
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'H. Count targets and repair a mean'}</H3>

          <Prose>
            {
              'A run has 200 updates, 8 windows per update and 24 targets per window. Evaluation paragraphs have NLL sums 80 and 30 over 40 and 10 targets. Compute the training target count and pooled evaluation NLL; explain the alternative equal-paragraph mean.'
            }
          </Prose>

          <details>
            <summary>Hint</summary>

            <Prose>{'Add numerators and denominators before dividing.'}</Prose>
          </details>

          <details>
            <summary>Worked solution</summary>

            <Prose>
              {
                'Training receives 200×8×24=38,400 targets. Pooled NLL is 110/50=2.2. The paragraph means are 2 and 3, whose unweighted average is 2.5. That gives each paragraph equal influence despite their lengths. Neither should be mislabeled as the other. Implement aggregation over '
              }
              <code>{'nll_sum'}</code>
              {' and '}
              <code>{'targets'}</code>
              {
                ' and check a zero-target paragraph does not create an undefined per-paragraph division.'
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'I. Prove and break the copy null'}</H3>

          <Prose>
            {
              'Two runs start with equal weights and optimizer states. They receive identical batches and use deterministic operations with dropout disabled. Why should their updates match? Give one duplication policy that breaks the premise.'
            }
          </Prose>

          <details>
            <summary>Hint</summary>

            <Prose>{'Argue one update at a time, including optimizer state.'}</Prose>
          </details>

          <details>
            <summary>Worked solution</summary>

            <Prose>
              {
                'Equal inputs and parameters give equal logits, losses and gradients. Equal optimizer states and settings then give equal updated parameters and states. Induction repeats the argument for every step. Duplicating only family A under uniform document sampling changes its exposure probability, so batches need not match. Training for additional epochs also changes update count. Our control fixes both; its exact equality does not forbid those other effects.'
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'J. Audit a real weak rewrite'}</H3>

          <Prose>
            {'Inspect '}
            <code>{'train-15-plain'}</code>
            {
              " with its source. Identify one unsupported interpretation and one omitted source commitment. Would the study's mechanical filter reject it? Design a separate audit field without changing the frozen corpus."
            }
          </Prose>

          <details>
            <summary>Hint</summary>

            <Prose>{'The same spelling can have different meanings in context.'}</Prose>
          </details>

          <details>
            <summary>Worked solution</summary>

            <Prose>
              {
                "The source warns that a red-hot poker burns when held; the output mentions becoming a poker player, changing the meaning. It also omits Alice's decision to check for a poison label before drinking. It is long enough and not an exact copy, so the declared filter keeps it. Add an audit record with source ID, output ID, the relevant source span, the unsupported interpretation and the omitted commitment. Keep that annotation separate from selection; adopting it as a new filtering rule requires a new experiment, not editing this result."
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'K. Derive one replacement and accumulation step'}</H3>

          <Prose>
            {
              'For q=[.5, .3, .2] and N=20, compute H, expected H after replacement, and expected H after adding one equal-size sample to the original pool. What is the probability the .2 category is absent from the replacement sample?'
            }
          </Prose>

          <details>
            <summary>Hint</summary>

            <Prose>{'The accumulation sample has weight 1/2 at its first step.'}</Prose>
          </details>

          <details>
            <summary>Worked solution</summary>

            <Prose>
              {
                'H=1−(.25+.09+.04)=.62. Replacement gives (19/20)×.62=.589. First accumulation gives (1−1/80)×.62=.61225. The rare-category omission probability is .8²⁰≈.011529. The accumulated pool retains its original positive count, so absence from the new sample alone does not remove that category from the full accumulated pool. These are distinct events.'
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'L. Design a comparison that can fail honestly'}</H3>

          <Prose>
            {
              'Propose a new source-conditioned-data experiment testing a semantic verifier. Specify what is fixed, what can change, what is held out and what results would count against your hypothesis.'
            }
          </Prose>

          <details>
            <summary>Hint</summary>

            <Prose>
              {'Keep direct corpus quality and downstream student performance separate.'}
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>

            <Prose>
              {
                'Freeze sources and their family splits, teacher revision, prompt set and complete generated candidates. Develop the verification rubric and threshold on separate development material. Compare usable-format selection with the semantic selection using matched student architecture, initialization seeds, selected-target/update budgets and evaluation. Record acceptance by family/style, rejected examples, teacher/verifier costs and realized exposure. Hold evaluation sources away from prompts, filtering choices and checkpoint selection. Report both prediction loss and a separately defined factual task, all paired seeds, and failures such as lower coverage or worse held-out scores. An empty accepted pool is a failed recipe to report, not a reason to silently change its threshold. This is a proposed study; no positive result is assumed.'
              }
            </Prose>
          </details>
        </div>
      </section>

      <H2>{'Key takeaways'}</H2>

      <Prose>
        {
          "Generated data changes the student's training distribution through source conditioning, sampling, acceptance and exposure. Each operation has a concrete object and denominator. A true final answer need not validate its derivation; format eligibility need not validate its claims; unique strings need not be independent source families; a lower held-out byte loss need not mean greater factual reliability."
        }
      </Prose>

      <Prose>
        {
          'Our controlled copy null was exact. Our generated corpus had clear semantic weaknesses and mixed small downstream differences. The categorical model showed how unbiased resampling can lose support, while retaining originals, accumulating history and receiving fresh data change the transition and budget. Keep those conditions when transferring any conclusion to a larger system.'
        }
      </Prose>

      <section
        className="lesson-ending lesson-ending--further-learning"
        data-lesson-ending="further-learning"
        data-lesson-resource-list=""
      >
        <H2>{'Further learning'}</H2>

        <ul>
          <li>
            {''}
            <a href={'https://aclanthology.org/2024.findings-acl.658/'}>
              {'The ACL survey of synthetic data generation'}
            </a>
            {
              ': map generation, curation and evaluation onto the pipeline you built. Its examples include tasks beyond pre-training, so identify each objective before comparing outcomes.'
            }
          </li>
          <li>
            {''}
            <a href={'https://huggingface.co/blog/cosmopedia'}>
              {"Cosmopedia's construction account"}
            </a>
            {
              ': inspect how source/topic organization and prompt variation create a corpus. Redraw one parent-to-prompt branch and identify where semantic verification would enter.'
            }
          </li>
          <li>
            {''}
            <a
              href={'https://huggingface.co/docs/transformers/main/en/main_classes/text_generation'}
            >
              {'Transformers generation documentation'}
            </a>
            {
              ': trace which settings change sampling support, termination and output IDs. Match the installed version and actual checkpoint configuration when reproducing a run.'
            }
          </li>
        </ul>
      </section>

      <section className="lesson-ending lesson-ending--references" data-lesson-ending="references">
        <span id="10-primary-sources" aria-hidden="true" />
        <H2>{'Technical references'}</H2>

        <ul>
          <li>
            {''}
            <a href={'https://arxiv.org/abs/2401.16380'}>{'WRAP: Rephrasing the Web'}</a>
            {
              ': source-conditioned rephrasing and pre-training experiments; distinguish model-training efficiency from total corpus-generation cost.'
            }
          </li>
          <li>
            {''}
            <a href={'https://aclanthology.org/2025.emnlp-main.544/'}>
              {'Systematic synthetic pre-training study, EMNLP 2025'}
            </a>
            {
              ': compare measured setups, mixtures and scaling extrapolations without treating a projection as an executed model.'
            }
          </li>
          <li>
            {''}
            <a href={'https://arxiv.org/abs/2604.13977'}>{'FinePhrase, April 2026 preprint'}</a>
            {
              ': source, generator and prompt choices under a specified English pre-training setup; the research remains bounded by its tested sizes and tasks.'
            }
          </li>
          <li>
            {''}
            <a href={'https://arxiv.org/abs/2404.01413'}>
              {'Accumulating synthetic data and model collapse'}
            </a>
            {
              ": investigate replacement versus retained history. Compare the paper's assumptions and growing-pool budgets with our explicitly derived finite model."
            }
          </li>
          <li>
            {''}
            <a href={'https://huggingface.co/google/flan-t5-small'}>{'FLAN-T5-small model card'}</a>
            {
              ': model provenance, instruction tuning, Apache-2.0 license and limitations. Our measured generations use the exact revision in the downloadable records.'
            }
          </li>
          <li>
            {''}
            <a href={'https://www.gutenberg.org/ebooks/11'}>{'Alice source and provenance'}</a>
            {
              ': the natural text used by the students. The provided provenance file records the precise source and extracted-file hashes.'
            }
          </li>
        </ul>
      </section>

      <section className="lesson-ending lesson-ending--next" data-lesson-ending="next">
        <H2>{'Readiness and the next question'}</H2>

        <Prose>
          {
            'You are ready to continue when you can implement a changed nucleus sampler, explain what a verifier does and does not prove, preserve source families, count the actual selected targets and interpret a held-out result that conflicts with a semantic audit. You should also be able to identify exactly which recursive transition a support-loss claim assumes.'
          }
        </Prose>

        <Prose>
          {'Next, '}
          <a
            href={
              '/learn/path/full-curriculum/supervised-fine-tuning-sft?module=large-language-models'
            }
          >
            {'Supervised Fine-Tuning'}
          </a>
          {
            ' focuses on learning requested response behavior from demonstrations. Carry forward the separation between how text was created, which target positions receive loss and which model parameters are updated.'
          }
        </Prose>
      </section>
    </div>
  ),
};
