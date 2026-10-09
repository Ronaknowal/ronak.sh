// Generated from the complete frozen manuscript by scripts/render-curation-pipelines.mjs.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock as SharedMath } from '../../components/content/Math.jsx';
import { NeuralTable } from '../../components/lesson-labs/NeuralLessonElements.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import CurationFigure from '../../components/lesson-labs/CurationPipelineFlow.jsx';
import '../../components/lesson-labs/lesson-flow.css';
import '../../components/lesson-labs/curation-pipeline-flow.css';
const MathBlock = ({ children }) => (
  <div className="curation-equation" role="region" tabIndex={0} aria-label="Curation relationship">
    <SharedMath>{children}</SharedMath>
  </div>
);
const Program = ({ file }) => (
  <RemoteCodeBlock source={`/learn-code/data-curation-pipelines/${file}`} filename={file} />
);
export default {
  slug: 'data-curation-pipelines-curator-models-quality-filtering',
  title: 'Data Curation Pipelines (Curator Models, Quality Filtering)',
  readTime: '~75 min read + programs and practice',
  hasIntegratedGuide: true,
  content: () => (
    <div className="lesson-flow curation-lesson">
      <Prose opening="summary">
        {
          'Choose a training document for a reason you can inspect. Trace raw text into a feature, a learned score and a retention decision; build a small real curator; then test whether the selected data helps the intended training task.'
        }
      </Prose>

      <Prose opening="route">
        {
          'First pass: read sections 1–9 and 12. Sections 10–11 deepen distribution matching and combined policies. Run the eight complete programs alongside their explanations. Every reported small-study value comes from the downloadable run; the deliberately tiny examples are labelled constructed. No browser control retrains the saved classifier.'
        }
      </Prose>

      <Prose opening="prerequisites">
        {'Before starting, revisit '}
        <a
          href={
            '/learn/path/full-curriculum/data-curation-deduplication-minhash-bloom-filters?module=large-language-models#2-separate-the-source-from-the-comparison-text'
          }
        >
          {'source versus comparison text'}
        </a>
        {', '}
        <a
          href={
            '/learn/path/full-curriculum/data-curation-deduplication-minhash-bloom-filters?module=large-language-models#8-turn-verified-pairs-into-a-retention-policy'
          }
        >
          {'duplicate groups and retention'}
        </a>
        {', and '}
        <a
          href={
            '/learn/path/full-curriculum/curriculum-learning-data-mixing-strategies?module=large-language-models#1-what-does-half-the-data-mean'
          }
        >
          {'what a data share measures'}
        </a>
        {
          '. The needed classifier operations are introduced here. A whitespace word, a Unicode character, a UTF-8 byte and a tokenizer token are different counting units throughout this lesson.'
        }
      </Prose>

      <Prose opening="exploration">
        {'Program files: '}
        <code>{'curation_signals.py'}</code>
        {', '}
        <code>{'reference_selection.py'}</code>
        {', '}
        <code>{'linear_curator.py'}</code>
        {', '}
        <code>{'curation_libraries.py'}</code>
        {', '}
        <code>{'prepare_annotations.py'}</code>
        {', '}
        <code>{'run_curator_study.py'}</code>
        {', '}
        <code>{'neural_curator.py'}</code>
        {', '}
        <code>{'datatrove_quality_pipeline.py'}</code>
        {'. Download the '}
        <a href={'/learn-code/data-curation-pipelines/curation-pipelines.zip'}>
          {'complete program/data bundle'}
        </a>
        {', including the two prerequisite helpers, '}
        <a href={'/learn-code/data-curation-pipelines/README.md'}>{'instructions'}</a>
        {
          ' and saved results. The shared file index gives individual complete source and Copy/Download controls. Small calculations use Python 3.12; library-specific versions and commands accompany the programs.'
        }
      </Prose>

      <span id="1-why-it-exists" aria-hidden="true" />
      <span id="1-start-with-the-problem" aria-hidden="true" />
      <H2>{'1. Follow one record into a training pool'}</H2>

      <Prose>
        {
          'Removing duplicates leaves a new question: is the remaining document useful for what this model must learn? Consider four constructed records. A explains a pendulum; B lists a product; C repeats navigation links; D gives a precise conjugate-gradient statement. All four can be distinct, valid UTF-8 text. That does not make their training value equal.'
        }
      </Prose>

      <CurationFigure id="C01" />

      <Prose>
        {
          'The tree separates an article from a navigation element, a script and formatting. Extraction reads selected source spans into a new text field; it does not rewrite the historical HTML bytes. Record A keeps its ID, source URL, retrieval information and raw digest alongside its extractor version and derived-text digest. If a changed extractor drops the explanation but preserves the menu, later filters receive a different object even though the source URL is unchanged.'
        }
      </Prose>

      <Prose>
        {'For the controlled article, reuse the complete '}
        <a href={'/learn-code/data-curation-deduplication/curation_records.py'}>
          {'ArticleText example'}
        </a>
        {' and its '}
        <a href={'/learn-code/data-curation-deduplication/extraction_library.py'}>
          {'ordinary extraction route'}
        </a>
        {
          '. The small parser intentionally handles a supplied article structure. Arbitrary web extraction needs the ordinary extractor and inspection of its outputs. A successful HTTP request or valid JSON row does not establish successful content extraction.'
        }
      </Prose>

      <Prose>
        {"Download that Python helper beside this lesson's authored "}
        <a href={'/learn-code/data-curation-pipelines/article.html'}>{'article.html'}</a>
        {
          ", then run the following complete use of its parser. It prints the title and two explanatory lines, excluding navigation, script and footer. The helper's original main demonstrates a different Alice excerpt; here we reuse its class on the pendulum fixture explicitly."
        }
      </Prose>

      <CodeBlock language={'python'}>
        {
          "from pathlib import Path\nfrom curation_records import ArticleText\n\nparser = ArticleText()\nparser.feed(Path('article.html').read_text(encoding='utf-8'))\nprint(parser.text())"
        }
      </CodeBlock>

      <Prose>
        {
          'The corpus is a collection of records, but a model consumes target tokens. Before tokenization we can at least distinguish document count from bytes. In a constructed accounting example, A/B/C/D contain 20/60/10/10 bytes. What share survives when we keep A and B?'
        }
      </Prose>

      <CurationFigure id="C02" />

      <Prose>
        {
          'Keeping A and B retains two of four records but 80 of 100 bytes. The choice did not change when we switched the denominator; its description did. A “top half” selector ranks records, not token positions. After applying the actual model tokenizer, count retained training targets separately. Bytes are useful storage/input accounting, not a language-invariant proxy for model token count.'
        }
      </Prose>

      <Prose>
        {
          'A pipeline therefore carries both selected data and an explanation of how it was selected. Keep the measured features, model/configuration version, score, decision reason and group identity with each ID. Later, a score regression or lost domain can be traced back to a concrete change rather than inferred from one final corpus size.'
        }
      </Prose>

      <span id="2-core-intuition" aria-hidden="true" />
      <span id="2-build-the-intuition" aria-hidden="true" />
      <H2>{'2. Measure a property before making a rule'}</H2>

      <Prose>
        {
          'Record C looks repetitive. To filter it consistently, first decide what “repetitive” measures. We will normalize each line by collapsing its whitespace to single spaces, discard empty lines, preserve case and exclude newline characters from the character total. This is a stated local policy, not the only reasonable definition.'
        }
      </Prose>

      <CurationFigure id="C03" />

      <Prose>
        {'The first '}
        <code>{'aaaa'}</code>
        {
          " establishes the line; only the additional occurrence counts as repeated. One of three nonempty line occurrences is additional, so duplicate-line incidence is 1/3. Four of nine eligible characters occur in that additional line, so duplicate-character share is 4/9. Extend both copies to eight a's: incidence remains 1/3, but character share becomes 8/17. A count ratio and a mass ratio answer different questions."
        }
      </Prose>

      <Prose>{'For normalized line counts c(l), these measurements are'}</Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            'R_{lines}=\\frac{\\sum_l(c(l)-1)}{\\sum_l c(l)},\\qquad R_{chars}=\\frac{\\sum_l(c(l)-1)|l|}{\\sum_l c(l)|l|}.'
          }
        </MathBlock>
      </div>

      <Prose>
        {'The sums run over distinct nonempty normalized lines. '}
        <code>{'|l|'}</code>
        {
          ' counts Python Unicode code points, not bytes or grapheme clusters. Empty eligible input makes both denominators zero; return an explicit undefined result and quarantine the extraction. Calling that text perfectly nonrepetitive because a counter defaults to zero would hide a missing input.'
        }
      </Prose>

      <Prose>
        {
          'Now make a decision: for example, keep a nonempty document when its duplicate-character share is at most .5. This threshold turns an observed property into a chosen rule. It does not turn the property into truth about usefulness. A refrain in a poem, an API reference repeating a signature or a carefully structured exercise can fail it. A unique but incorrect paragraph can pass it.'
        }
      </Prose>

      <Program file="curation_signals.py" />

      <Prose>
        {'Run '}
        <code>{'python -B curation_signals.py'}</code>
        {'. '}
        <code>{'signals'}</code>
        {' computes the declared measurements; '}
        <code>{'select'}</code>
        {' separates exact-count ranking from thresholding; '}
        <code>{'pipeline'}</code>
        {' records first and overlapping failures; '}
        <code>{'metrics'}</code>
        {
          ' preserves undefined denominators. The main uses authored documents and supplied scores, not a trained semantic classifier. Measurement takes linear time in text size. Stable full ranking takes O(N log N); the retained list keeps its original IDs.'
        }
      </Prose>

      <Prose>
        {
          'Character, word-length, punctuation and language signals are similarly useful only under their definitions. Before importing thresholds from another corpus, inspect its extractor, language/script and normalization. Examine rejected examples as well as retained ones. '
        }
        <a href={'https://huggingface.co/datasets/HuggingFaceFW/fineweb-2'}>
          {"FineWeb2's processing and limitations"}
        </a>
        {
          ' make this particularly concrete: a punctuation rule that works for prose can exclude poetry, and useful cutoffs vary across languages.'
        }
      </Prose>

      <span id="3-math-foundation" aria-hidden="true" />
      <span id="3-make-the-idea-precise" aria-hidden="true" />
      <H2>{'3. Ask what a low language-model loss means'}</H2>

      <Prose>
        {
          'Heuristics cannot recognize every meaningful explanation. Another idea is to score how unsurprising a candidate looks under a reference corpus. This has a precise interpretation: resemblance to that reference. It does not automatically measure correctness, educational usefulness or novelty.'
        }
      </Prose>

      <CurationFigure id="C04" />

      <Prose>
        {'Our constructed reference text is '}
        <code>{'the home the home the home energy'}</code>
        {'. Declare ordinary vocabulary '}
        <code>{'[the, home, pendulum, energy]'}</code>
        {
          ' and one unknown bucket UNK. Add one pseudo-count to each of the five possible outcomes. Seven observed words plus five pseudo-counts give denominator 12. The probabilities are 1/3,1/3,1/12,1/6,1/12 in that order. They sum to one, including the unseen pendulum and unknown bucket.'
        }
      </Prose>

      <Prose>{'For count c(w), smoothing α>0 and finite support V including UNK,'}</Prose>

      <div className="neural-equation">
        <MathBlock>{'p(w)=\\frac{c(w)+\\alpha}{\\sum_{v\\in V}c(v)+\\alpha|V|}.'}</MathBlock>
      </div>

      <Prose>
        {
          'Every unknown spelling maps to the same UNK outcome. Assigning a fresh 1/12 probability to each possible unknown spelling would not define a normalized model. With no reference observations, positive smoothing gives a uniform distribution over the declared support; it does not produce evidence that all words are equally common in the world.'
        }
      </Prose>

      <CurationFigure id="C05" />

      <Prose>
        {
          'For candidate words w₁…wₘ, cross-entropy is H=−(1/m)Σlog p(wᵢ); perplexity is exp(H). Natural logarithms put H in nats per word. The three occurrences in '
        }
        <code>{'the the the'}</code>
        {' each contribute ln 3, so H≈1.098612 and perplexity 3. For '}
        <code>{'pendulum energy'}</code>
        {
          ', the contributions are ln 12 and ln 6, so H≈2.138333 and perplexity≈8.485281. The repetitive fragment wins this low-perplexity contest. That is a property of the reference probabilities, not proof that its content is better.'
        }
      </Prose>

      <Prose>
        {
          'The word-independent model is intentionally small enough to expose every denominator. A neural reference can condition on context and use subword tokens, but its loss still measures predictability under that model and tokenization. Comparing perplexities across different tokenizers without a common unit is particularly misleading. An empty candidate has no word-average loss; display undefined rather than a fabricated perplexity of one.'
        }
      </Prose>

      <Program file="reference_selection.py" />

      <Prose>
        {'Run '}
        <code>{'python -B reference_selection.py'}</code>
        {
          ' after installing SciPy. It fits normalized references, maps unknown words, returns individual loss contributions and compares a domain reference in section 10. It also implements seeded weighted selection without exponentiating huge log weights. Fitting is linear in reference words; scoring is linear in candidate words. Its model is an explained unigram example, not an implementation of a large neural curator.'
        }
      </Prose>

      <H2>{'4. Turn examples into a curator'}</H2>

      <Prose>
        {
          'The reference example suggests a different approach: specify the property we want and collect examples of it. A '
        }
        <strong>{'curator model'}</strong>
        {
          ' predicts a score used to choose training data. Its label source determines what it learns to approximate.'
        }
      </Prose>

      <CurationFigure id="C06" />

      <Prose>
        {
          "One route asks a model to judge educational value under a rubric. FineWeb-Edu releases integer annotations from that process. Another route labels documents according to whether they came from selected reference sources, then trains a discriminator against background web text. DCLM's reference classifier follows this broad idea. Reference membership is easier to obtain than human usefulness judgments, but source style can become a shortcut. Teacher labels can express a richer rubric, but inherit the teacher's mistakes and omissions. Neither label is interchangeable with factual truth."
        }
      </Prose>

      <Prose>
        {
          'We will first learn a binary proxy: y=1 when a released educational score is at least 3, otherwise y=0. This threshold applies to the supplied integer annotation. The separate released neural regressor in section 8 uses a different score/readout contract. Do not silently apply its rounding to our binary probability.'
        }
      </Prose>

      <Prose>
        {
          'To see what learning changes, represent text by word features. Statistics come only from the examples used to learn the rule; after fitting they stay fixed for new examples. This is what '
        }
        <strong>{'training-only'}</strong>
        {' means here.'}
      </Prose>

      <CurationFigure id="C07" />

      <Prose>
        {
          'Document frequency df(w) counts training documents containing w, regardless of how often it repeats inside one document. With n training documents, use idf(w)=log((1+n)/(1+df(w)))+1. A word in every training document has IDF 1. A word in fewer documents has a larger factor. Multiplying raw word counts by IDF and dividing the resulting vector by its Euclidean length gives the TF-IDF feature row x. “TF” means term frequency; here it is a raw count, not a logarithm. Zero vectors remain zero.'
        }
      </Prose>

      <Prose>
        {'For a small constructed feature illustration, use four training texts: '}
        <code>{'energy energy energy motion motion motion motion'}</code>
        {', '}
        <code>{'energy motion'}</code>
        {', '}
        <code>{'sale'}</code>
        {', and '}
        <code>{'home'}</code>
        {
          ". Energy and motion each occur in two of four documents, so both get IDF a=1+log(5/3). The first text's two nonzero weighted counts are [3a,4a]. Their length is 5a, leaving normalized coordinates [.6,.8]. The absent sale/home coordinates are zero. This is the origin of the two visible coordinates in the readout above; the learned study later has 1,024 coordinates."
        }
      </Prose>

      <Prose>
        {
          "The vocabulary is also fixed from training. A new spelling outside it contributes no feature. This differs from section 3's UNK language model: TF-IDF is a feature representation, not a normalized probability distribution over words. A word contributes to document similarity; it need not receive probability mass."
        }
      </Prose>

      <Prose>
        {
          'Use those two nonzero coordinates x=[.6,.8], supplied example weights w=[.4,−.2] and bias b=.1. These weights illustrate the readout; they are not the fitted study model. The products are .24 and −.16, and z=wᵀx+b=.18. The sigmoid p=1/(1+exp(−z)) gives about .544879. Positive weight raises the score when its feature increases; negative weight lowers it, holding other coordinates fixed. TF-IDF normalization couples coordinates, so changing a word in the original text may change several coordinates at once.'
        }
      </Prose>

      <Prose>
        {
          "Keep the roles clear: x describes the document, w and b are learned parameters, z is an unrestricted score called a logit, and p is the model's predicted positive-label probability. Calling the last number a probability does not establish calibration; section 6 will test that interpretation."
        }
      </Prose>

      <H2>{'5. Learn the weights and protect the question'}</H2>

      <Prose>
        {
          'The supplied weights expose computation. Actual learning chooses weights that reduce disagreement with training labels. For one example, binary cross-entropy is −y log p−(1−y)log(1−p). It penalizes placing little probability on the observed label.'
        }
      </Prose>

      <CurationFigure id="C08" />

      <Prose>
        {
          'Writing p=σ(z) gives the numerically stable equivalent softplus(z)−yz, where softplus(z)=log(1+exp z). The program uses '
        }
        <code>{'logaddexp(0,z)'}</code>
        {
          ' so z=1000 does not overflow during exponentiation. Differentiate: dL/dp=−y/p+(1−y)/(1−p), and dp/dz=p(1−p). Multiplication cancels the denominators, leaving dL/dz=p−y. The weight gradient is (p−y)x and the bias gradient is p−y.'
        }
      </Prose>

      <Prose>
        {
          'For the preceding x,w,b and a positive label y=1, the residual is about −.455121. Its negative sign asks gradient descent to increase z. For a training matrix X with n rows, average this loss and add a weight-size penalty λ||w||²/2:'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            'J=\\frac 1n\\sum_i[\\operatorname{softplus}(z_i)-y_i z_i]+\\frac\\lambda 2\\|w\\|^2,\\quad\\nabla_wJ=\\frac{X^\\top(p-y)}n+\\lambda w,\\quad\\frac{\\partial J}{\\partial b}=\\operatorname{mean}(p-y).'
          }
        </MathBlock>
      </div>

      <Prose>
        {
          "The intercept is deliberately unpenalized. A learning rate η applies w←w−η∇wJ and b←b−η∂J/∂b. At η=0 the parameters stay unchanged; at p=y the example's data gradient is zero, although a nonzero L2 term can still move w. Regularization is a chosen optimization constraint, not additional teacher evidence."
        }
      </Prose>

      <Program file="linear_curator.py" />

      <Prose>
        {'Run '}
        <code>{'python -B linear_curator.py'}</code>
        {' with NumPy. '}
        <code>{'Features.fit'}</code>
        {' ranks training words by total count with lexical ties; '}
        <code>{'transform'}</code>
        {' freezes vocabulary/IDF and performs L2 normalization. '}
        <code>{'objective_gradient'}</code>
        {' exposes the stable objective and analytic derivatives. '}
        <code>{'fit'}</code>
        {
          ' starts at zero and stops on the training gradient norm or an explicit step limit. It does not inspect final labels to stop.'
        }
      </Prose>

      <Prose>
        {
          'The step-size bound uses sigmoid curvature at most 1/4. Add a constant-one column to the feature matrix so multiplying by the appended intercept adds b to every row. The squared '
        }
        <strong>{'Frobenius norm'}</strong>
        {' sums the squares of all matrix entries. The squared '}
        <strong>{'spectral norm'}</strong>
        {
          " is the largest squared amplification of vector length by that matrix; it is no larger than the squared Frobenius norm. Dividing the latter by the number of records gives mean squared feature-row norm plus one for the intercept column. Therefore .25(mean squared row norm+1)+λ bounds the augmented objective curvature, including the weight penalty. Taking the reciprocal of this upper bound makes the step conservative: it allows for the largest possible curvature rather than guessing a larger update from the current gradient. This is slower than a tuned second-order solver, but makes the optimizer's contract inspectable. The dense teaching matrix costs O(nV) memory; the library route keeps a sparse representation."
        }
      </Prose>

      <Prose>
        {
          'Where do the training rows come from? Split related records before fitting even the vocabulary.'
        }
      </Prose>

      <CurationFigure id="C09" />

      <Prose>
        {
          'Train learns features and weights. Tune chooses the operating threshold. Final answers the fixed assessment question once those choices are made. If two copies of one article cross the boundary, the assessment partly asks whether the model recognizes an article already seen. Grouping by exact prefix alone misses altered copies; grouping by hostname alone misses syndicated content. Our example combines host, exact and verified near-duplicate edges, then uses connected components so transitive relations stay together. An omitted semantic relationship can still leak; this procedure establishes its declared relation, not perfect independence of all web knowledge.'
        }
      </Prose>

      <H2>{'6. Select records without confusing rank with probability'}</H2>

      <Prose>
        {
          'Learning returns scores. It does not choose a corpus size or a cost of false removal. A threshold and an exact keep count are different policies.'
        }
      </Prose>

      <CurationFigure id="C10" />

      <Prose>
        {
          "Thresholding keeps every score at least τ, so tied scores cross together. Exact-k sorting uses score descending and ID ascending, then takes exactly k rows. It may split a tie according to that stated rule. A percentile specifies rank among this pool; changing the pool can change a document's percentile even if its model score is unchanged."
        }
      </Prose>

      <Prose>
        {
          'Compare each decision with the supplied binary label. TP means a kept positive; FP a kept negative; FN a rejected positive; TN a rejected negative. Precision=TP/(TP+FP) asks what share of the kept set is positive. Recall=TP/(TP+FN) asks what share of positives survives. F1=2TP/(2TP+FP+FN) combines them when its denominator exists. These definitions refer to the chosen label source, not all useful text in the world.'
        }
      </Prose>

      <Prose>
        {
          "No predicted positives makes precision undefined. With actual positives but no predicted positives, recall and F1 are zero. With no actual or predicted positives, F1 is undefined under this lesson's explicit policy. Every empty state preserves its counts. A plotting library's default zero cannot decide what an absent denominator means."
        }
      </Prose>

      <Prose>
        {
          'Higher thresholds reduce or preserve the kept set. They do not guarantee higher precision. Consider scores .9/.8/.7 with labels 1/0/1. Threshold .7 keeps all three, precision 2/3; threshold .8 keeps the first two, precision 1/2. The removed low-score positive makes precision worse.'
        }
      </Prose>

      <CurationFigure id="C11" />

      <Prose>
        {
          'Calibration asks whether records assigned similar probabilities are positive at corresponding rates. For a simple illustration, a wide bin [.5,1] containing two scores .6 and .8 with labels 1 and 0 has mean prediction .7 and positive fraction .5. Show its support of two; that small discrepancy is not a precise population estimate. The program uses five narrower bins, with their endpoints explicit. The Brier score averages (p−y)² and penalizes probability error across all records.'
        }
      </Prose>

      <Prose>
        {
          "A strictly increasing transform preserves ranking but can change calibration. Squaring probabilities preserves their order within [0,1], while the two scores above become .36/.64 and their cohort mean .5. That mean matches the cohort's positive fraction, but the transformed scores no longer occupy the same bin: recompute bin membership before assessing calibration. Matching one cohort mean does not prove calibrated predictions. Ranking, calibration and selection answer separate questions."
        }
      </Prose>

      <Program file="curation_libraries.py" />

      <Prose>
        {'With '}
        <code>{'scikit-learn==1.9.1'}</code>
        {', run '}
        <code>{'python -B curation_libraries.py'}</code>
        {'. The ordinary route composes '}
        <code>{'TfidfVectorizer'}</code>
        {' and '}
        <code>{'LogisticRegression'}</code>
        {
          " into one pipeline. A supplied deterministic vocabulary, identical tokenizer, raw term counts, smoothed IDF and L2 norm match the scratch features. For the installed lbfgs implementation, C=1/(nλ) matches mean cross-entropy plus λ||w||²/2. This conversion depends on the library's objective convention; copying C=.01 would not match λ=.01. Both routes leave the bias unpenalized."
        }
      </Prose>

      <Prose>
        {
          'The main checks the authored four-record fit and an exact save/reload. Load pickle only from a trusted producer; this format can execute code. For the fitted lesson model, the scratch route also offers a simple JSON vocabulary/IDF/weight representation. Matching the converged objective and predictions does not mean the two optimizers followed the same steps.'
        }
      </Prose>

      <span id="4-from-scratch-implementation" aria-hidden="true" />
      <span id="6-visual-walkthrough" aria-hidden="true" />
      <H2>{'7. Fit a small real annotation experiment'}</H2>

      <Prose>
        {
          'We now replace four authored records with released web-prefix annotations while preserving the same feature, label, score and decision meanings. The question is deliberately narrow: how well does this small classifier reproduce those teacher labels on held-out source/duplicate groups?'
        }
      </Prose>

      <CurationFigure id="C12" />

      <Prose>
        {
          "The collection uses twenty deterministic windows of one hundred records across the released FineWeb-Edu annotation table. It is coverage across row positions, not IID sampling of web documents. The teacher input is each record's first 1,000 characters; we verify that prefix against its recorded prompt. Labels are 1 when the released integer score is at least 3. The source text remains in local reproduction files; the public study exposes derived IDs, hashes, labels and predictions."
        }
      </Prose>

      <Prose>
        {
          'Related records are connected by identical nonempty hostname, exact normalized prefix or verified Jaccard similarity at least .8 over normalized three-word shingles. Near-pair search uses exact comparisons after a length-ratio bound, not approximate candidates assumed complete. Components are hashed into train/tune/final; vocabulary fitting follows that assignment. There are 1,920 groups among 2,000 records, with largest group 3. Training has 1,184 rows and 110 positives; tuning 392 and 37; final 424 and 28.'
        }
      </Prose>

      <Program file="prepare_annotations.py" />

      <Prose>
        {'Download the exact '}
        <a href={'/learn-code/data-curation-deduplication/curation_records.py'}>
          {'curation_records.py'}
        </a>
        {' and '}
        <a href={'/learn-code/data-curation-deduplication/lexical_dedup.py'}>
          {'lexical_dedup.py'}
        </a>
        {' helpers into the program folder, or supply their directory with '}
        <code>{'--dedup-directory'}</code>
        {'. Run '}
        <code>{'python -B -X utf8 prepare_annotations.py --output ./annotations'}</code>
        {
          '. It records the protocol before collection, caches exact API responses, checks source revision before/after, validates teacher inputs, groups records and saves the local JSONL. The rows API is not claimed to offer an atomic revision pin; retained response hashes specify what actually ran. '
        }
        <code>{'--local-jsonl'}</code>
        {' permits already collected records with the documented schema.'}
      </Prose>

      <Prose>
        {
          'The frozen learning protocol uses at most 1,024 training words, λ=.01, zero initial parameters and gradient-norm stopping. Threshold candidates are .10,.15,…,.90. Maximize tuning F1, breaking ties toward the higher threshold. A constant baseline predicts the training positive fraction under the same grid. Final data choose neither vocabulary nor threshold.'
        }
      </Prose>

      <Program file="run_curator_study.py" />

      <Prose>
        {'Run '}
        <code>
          {'python -B -X utf8 run_curator_study.py --data ./annotations --output ./curator-run'}
        </code>
        {
          " with a new output directory. The driver writes versions, source hashes and the full prospective protocol before fitting, trains both routes, reloads the JSON model, saves all grid points and records the fixed final assessment. It requires the companion files rather than leaving an undefined model in a snippet. The page's controls inspect these saved results; they do not silently refit when a threshold is moved."
        }
      </Prose>

      <CurationFigure id="C13" />

      <Prose>
        {
          'The scratch fit converged in 777 steps. Scratch and library feature entries differ by at most about 2.22×10⁻¹⁶; predicted probabilities by about 1.88×10⁻⁸. Both choose threshold .10 from tuning. On 424 final rows they keep 71: 16 teacher positives and 55 negatives. They reject 12 positives and 341 negatives. Precision is 16/71≈.225352, recall 16/28≈.571429, and F1=32/99≈.323232. Final Brier loss is about .061299.'
        }
      </Prose>

      <Prose>
        {
          'This is limited discrimination, with substantial false retention and false rejection against the proxy itself. It is useful evidence about the small model, feature representation and sampled annotation task. It is not a demonstrated improvement in the language model that might later train on those retained documents.'
        }
      </Prose>

      <Prose>
        {
          "The constant baseline predicts 110/1,184≈.092905. That lies below the grid's lowest threshold .10, so every grid option keeps nothing; the tie rule chooses .90. Its final precision is undefined, recall/F1 zero and Brier about .062399. This exposes the grid's boundary as well as the baseline's lack of ranking ability. For context, a policy keeping all final records would have precision 28/424, recall 1 and F1=56/452. That is a direct descriptive count comparison, not a newly tuned model. Do not retrospectively change the frozen threshold grid to obtain a prettier result."
        }
      </Prose>

      <Prose>
        {
          'Use the saved error IDs to reload records locally and inspect why they failed. A false negative might be educational text lacking common training cues; a false positive might copy their style. Those are hypotheses to test by reading the actual record, not explanations to invent from a score. Host grouping, coverage windows and a small positive class limit generalization. A new collection or rubric is a new declared experiment.'
        }
      </Prose>

      <H2>{'8. Use a released neural curator deliberately'}</H2>

      <Prose>
        {
          'The linear curator combines known word features. A neural encoder can represent their context before assigning a score. That richer representation changes the model, not the need to inspect what its target means.'
        }
      </Prose>

      <CurationFigure id="C14" />

      <Prose>
        {
          'The released FineWeb-Edu classifier used here is a BERT sequence regressor with twelve encoder layers, twelve attention heads per layer and hidden width 768. It has 109,483,009 parameters in the loaded checkpoint. WordPiece tokenization turns text into IDs; padding lets a batch share a rectangular shape, while the attention mask identifies valid positions. The encoder makes contextual hidden rows. Its first CLS row passes through a learned dense map and tanh pooler; a scalar linear head then produces one unrestricted real value.'
        }
      </Prose>

      <Prose>
        {
          'For final CLS vector h, the readout is u=tanh(Wpool h+bpool), then s=wheadᵀu+bhead. The actual CPU program reconstructs both operations and compares them with the loaded forward output. The generic phrase “sequence classifier” alone would not tell us this pooling rule. Another encoder could use mean pooling or a different terminal position.'
        }
      </Prose>

      <Prose>
        {'This checkpoint is a '}
        <strong>{'regressor'}</strong>
        {
          ": its one output approximates the rubric's score scale. Softmax over one output would always give 1 and destroy the information. Sigmoid would impose a binary-probability interpretation that this head was not trained to provide. Use the checkpoint's documented score policy explicitly."
        }
      </Prose>

      <CurationFigure id="C15" />

      <Prose>
        {'The released example clamps s to [0,5], applies Python '}
        <code>{'round'}</code>
        {
          ", then compares the integer score with 3. Nearest-even rounding sends 2.5 to 2 but 2.52 to 3. Therefore raw-score threshold 3 is not equivalent to integer-score threshold 3. At other half-integers, the even-neighbor rule matters too. A browser language's default rounding can differ; implement the declared rule, including its tie cases."
        }
      </Prose>

      <Program file="neural_curator.py" />

      <Prose>
        {'Run '}
        <code>
          {
            'python -B -X utf8 neural_curator.py --output ./neural-result.json --cache ./model-cache'
          }
        </code>
        {
          '. The first call downloads about 0.4GB of pinned model/tokenizer assets. The program uses Transformers 5.17.0, CPU evaluation mode, no gradients, explicit 512-token truncation and batches of at most four. '
        }
        <code>{'--offline'}</code>
        {' reuses the cache; '}
        <code>{'--input-jsonl'}</code>
        {
          ' scores supplied full texts. Each result records characters, valid model-token count, input IDs, raw score and policy output. The first 1,000-character teacher prefix in our annotation experiment is a separate input convention; 512 model tokens do not mean 512 characters.'
        }
      </Prose>

      <Prose>
        {
          'Observed CPU scores on the three authored paragraphs are approximately 2.992705 for the pendulum explanation, −.250806 for repeated navigation and 1.176444 for the conjugate-gradient paragraph. Their integer scores are 3,0,1; only the pendulum survives. These are actual predictions, not independently adjudicated quality measurements. The technical paragraph is a useful rejected example: the rubric/model may favor accessible explanations over terse specialist statements. Inspect that distinction against the intended training task before deciding it is the right exclusion.'
        }
      </Prose>

      <Prose>
        {
          'A released model evaluated on annotations used to train it is not an independent accuracy test. Our three authored inputs are a behavior inspection, not enough for a reliable population estimate either. Freeze a separate task-relevant evaluation set if choosing between curators. Keep original scores so a later threshold change can be audited without recomputing the model.'
        }
      </Prose>

      <span id="5-production-implementation" aria-hidden="true" />
      <H2>{'9. Audit the complete pipeline, including what it removes'}</H2>

      <Prose>
        {
          'We have an extractor, cheap measurements, learned scores and a decision rule. Combining them introduces interactions: a later stage sees only earlier survivors, and the first recorded removal can hide other reasons.'
        }
      </Prose>

      <CurationFigure id="C16" />

      <Prose>
        {
          'In the constructed quality pass, the supplied scores for A/B/C/D are .85/.35/.9/.7. The repeated navigation C fails the repeated-character threshold. The catalogue B fails the score threshold. A and D remain. Those scores are deliberately supplied for the plumbing example; they are not the neural results in section 8. Loading the saved fitted linear model is an explicit alternative. Keeping model identity beside scores prevents an attractive diagram from quietly mixing different experiments.'
        }
      </Prose>

      <CurationFigure id="C17" />

      <Prose>
        {
          'For pure predicates P and Q evaluated on the same unchanged document, the final set is {d:P(d) and Q(d)}. Intersection is commutative. The first-failure ledger is not: a document failing both is counted under whichever stage comes first. A full inclusive audit evaluates both predicates even on removed rows; it costs work that a short-circuit production pass might skip. If you only recorded first failures, you cannot infer overlapping failure incidence afterward.'
        }
      </Prose>

      <Prose>
        {
          'Reordering stateful operations can change the actual survivors. Suppose two duplicate records A and B have scores .4 and .8, and a duplicate policy always chooses the lexically smaller ID. Deduplicate first and A represents the group; threshold .5 then removes it, leaving nothing. Filter first and B remains; deduplication then retains B. The representative policy is part of the computation. Declaring “filters commute” without stating unchanged inputs and pure predicates would erase this difference.'
        }
      </Prose>

      <Program file="datatrove_quality_pipeline.py" />

      <Prose>
        {'With DataTrove 0.10.1 and orjson 3.12.0, run '}
        <code>{'python -B -X utf8 datatrove_quality_pipeline.py --output ./quality-run'}</code>
        {'. The complete ordinary route writes two real input shards, reads them with '}
        <code>{'JsonlReader'}</code>
        {', applies two explicit '}
        <code>{'BaseFilter'}</code>
        {
          ' subclasses, writes exclusions separately and writes survivors. It uses one worker; it does not claim distributed throughput. The actual run retains A/D and removes B/C, matching the standalone policy, with every input ID accounted for exactly once.'
        }
      </Prose>

      <Prose>
        {
          'The ordinary reader skips empty text before filters. The program therefore quarantines it before the reader, rather than promising an empty-input filter will see it. The local inclusive audit still explains overlapping failures; separate exclusion files explain executed first removals. To apply the fitted classifier, pass '
        }
        <code>{'--model ./curator-run/model.json --threshold .1'}</code>
        {
          '. That uses the same text feature transformation and saved weights from section 7, not a new training call.'
        }
      </Prose>

      <Prose>
        {"For near-duplicate removal, use the preceding lesson's complete "}
        <a href={'/learn-code/data-curation-deduplication/datatrove_pipeline.py'}>
          {'four-stage DataTrove program'}
        </a>
        {
          '. Its signature, bucket, cluster and filter stages have a precise input-order/replay contract. The quality-pass example is not a one-line substitute for them. Choose and record the order, representative rule and input identity when composing the two.'
        }
      </Prose>

      <Prose>
        {
          'At corpus scale, inspect retained and removed counts by source, language, time and intended subject. A high overall pass rate can hide removal of a small but important domain. Source eligibility, private information, benchmark contamination and usefulness are different properties; a high learned educational score settles none of the other decisions. Preserve those audit fields as separate evidence.'
        }
      </Prose>

      <H2>{'10. Deeper: select for a target distribution'}</H2>

      <Prose>
        {
          'An educational rubric is one target. Suppose instead you need a scientific-domain corpus. A phrase that is unusual on the general web can be characteristic of that domain. Comparing two references makes this difference explicit.'
        }
      </Prose>

      <CurationFigure id="C18" />

      <Prose>
        {'Use the same finite support as section 3. The target reference '}
        <code>{'pendulum energy pendulum energy energy'}</code>
        {', smoothed by one, gives probabilities .1/.1/.3/.4/.1 for '}
        <code>{'[the, home, pendulum, energy, UNK]'}</code>
        {
          '. For each word, log ptarget−log pgeneral measures evidence favoring the target reference. Sum those terms for the independent-word sequence model:'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            '\\log\\frac{p_T(d)}{p_G(d)}=\\sum_{i=1}^{m}\\log\\frac{p_T(w_i)}{p_G(w_i)}=m[H_G(d)-H_T(d)].'
          }
        </MathBlock>
      </div>

      <Prose>
        {'For '}
        <code>{'pendulum energy'}</code>
        {
          ', the terms are log 3.6 and log 2.4, total≈2.156403. Exponentiation gives a sequence density ratio 8.64. The mean log ratio is≈1.078201; exponentiating that gives a different, length-normalized score≈2.939388. Repeating the phrase doubles the total log ratio but leaves the mean unchanged. Name which quantity drives selection, especially when candidates have unequal lengths.'
        }
      </Prose>

      <Prose>
        {
          'Identical references give zero log ratio for every nonempty candidate. An empty sequence has product probability 1 under this toy model, hence total log ratio 0; its word-average score is undefined and it should already be excluded by input policy. Different supports or zero general probability require explicit treatment; positive smoothing on the same finite support avoids that singularity in this demonstration.'
        }
      </Prose>

      <Prose>
        {
          'Density-ratio weighting is motivated by an importance-sampling identity: where general distribution G has positive support for target distribution T, E_G[(T/G)f]=E_T[f]. This statement concerns a specified pair of distributions and their exact ratio. Estimated text models, finite samples, weight clipping and selecting without replacement alter that setting. It is a reason to investigate weighting, not a guarantee that a word-model ratio recreates a desired training distribution.'
        }
      </Prose>

      <Prose>
        {''}
        <code>{'reference_selection.py'}</code>
        {
          ' implements a stable weighted-without-replacement selection. For each record with log weight a, draw independent uniform u in (0,1) and give it key a−log(−log u); retain the largest k keys. This Gumbel/exponential-race construction makes successive selections proportional to remaining weights. It avoids '
        }
        <code>{'exp(a)'}</code>
        {
          ' overflow and returns distinct IDs. Adding one common constant to all log weights does not change their ordering for the same random draws. Marginal inclusion probability is generally not k times a normalized weight.'
        }
      </Prose>

      <Prose>
        {'This word example supplies visible assumptions. '}
        <a href={'https://arxiv.org/abs/2302.03169'}>{'DSIR'}</a>
        {
          ' uses a richer feature-based data-selection method; it is not identical to the unigram implementation. Domain likelihood can still favor repeated jargon, and a narrow target reference can suppress useful background. Evaluate the selected corpus on the downstream task rather than choosing the most sophisticated-looking score formula.'
        }
      </Prose>

      <span id="7-decision-matrix" aria-hidden="true" />
      <span id="8-what-scales-and-what-doesn-t" aria-hidden="true" />
      <H2>{'11. Deeper: combine scorers and budget the work'}</H2>

      <Prose>
        {
          'Two curators can notice different properties, but their raw scores may have unrelated scales. A probability near .8, an integer educational score and a log ratio cannot be averaged meaningfully merely because all are numbers.'
        }
      </Prose>

      <CurationFigure id="C19" />

      <Prose>
        {
          'One explicit comparison is to rank within each scorer. For n records with distinct scores, assign rank 0 to the lowest and n−1 to the highest, then divide by n−1. For tied scores, use their average rank; our one-record convention assigns the midpoint .5, and an empty pool stays empty. These percentiles describe this candidate pool, not probabilities that documents are good. The complete '
        }
        <code>{'percentile_ranks'}</code>
        {' and '}
        <code>{'combine_curators'}</code>
        {' functions are in '}
        <code>{'curation_signals.py'}</code>
        {'.'}
      </Prose>

      <Prose>
        {
          "Suppose scorer 1 ranks A>B>C>D, while scorer 2 ranks C>D>A>B. Keeping the top two of each yields {A,B} and {C,D}. Their union keeps all four; intersection keeps none. Taking the maximum of per-scorer percentiles at an upper threshold implements the union of their corresponding upper sets. It does not preserve the fraction retained by either scorer. Identical rankings provide a useful null: the union equals one scorer's selection."
        }
      </Prose>

      <Prose>
        {
          "Nemotron-CC investigates quantile-normalized curator combinations among its data choices. The lesson here is the set operation and calibration distinction, not a universal claim that more curators are better. An OR policy can protect a specialist document one curator misses, while also admitting either curator's false positives. An AND policy can concentrate agreement while rejecting their different blind spots. Audit domains and downstream behavior, not just the total surviving mass."
        }
      </Prose>

      <CurationFigure id="C20" />

      <Prose>
        {
          "Cost gives another reason to combine stages. If N documents enter a cheap stage costing c₁ per document, and fraction r₁ reaches a second stage costing c₂, total work is N c₁+N r₁ c₂. For three stages the final term is N r₁ r₂ c₃, where r₂ is the conditional survival rate among stage 1 survivors. Replacing it with the second stage's unconditional pass rate assumes an independence relation that may be false."
        }
      </Prose>

      <Prose>
        {
          'In a constructed work ledger, N=1,000, c₁=1, r₁=.2 and c₂=10 gives 3,000 work units. Reversing the stages with the expensive stage passing half the pool gives 10,500. This comparison assumes both predicates see unchanged documents, the same decisions and fixed per-document costs. It does not estimate GPU seconds. Full inclusive auditing requires extra evaluations beyond the short-circuit counts.'
        }
      </Prose>

      <Prose>
        {"The same file's "}
        <code>{'stage_work'}</code>
        {
          ' function returns each incoming count and cost contribution. Fractional counts represent expected counts under an assumed retention fraction; they are not fabricated observations or silently rounded survivors. Actual pipeline counters come from the executed records in section 9.'
        }
      </Prose>

      <Prose>
        {
          "Distilling a teacher into a smaller curator has a separate ledger. Labelling n records costs n Cteacher; scoring N records with the student costs N Cstudent, plus the student's training cost F. Direct teacher scoring costs N Cteacher. The student route saves work when F+n Cteacher+N Cstudent<N Cteacher, subject to its prediction quality being adequate. A positive crossover requires Cteacher>Cstudent. There is no compute saving from a cheaper proxy that removes the data the downstream model needs."
        }
      </Prose>

      <span id="9-failure-modes-and-gotchas" aria-hidden="true" />
      <H2>{'12. Test data usefulness with the training task'}</H2>

      <Prose>
        {
          'The local classifier predicts a teacher. The intended training model consumes the selected corpus. To connect those two questions, compare actual training runs while controlling the rest of the recipe.'
        }
      </Prose>

      <CurationFigure id="C21" />

      <Prose>
        {
          'Fix the architecture, initialization policy, optimizer, training-target budget and held-out evaluation. Change a declared data intervention. Record selection compute as well as training compute. If the filtered pool is smaller, decide explicitly whether to repeat it, add other sources or stop earlier. Each answers a different question.'
        }
      </Prose>

      <Prose>
        {
          'The published DCLM v2 Table 3 gives a concrete controlled extraction comparison. At its 1B–1x scale, the specified model has 1.4B parameters and trains on 28.8B tokens. The extracted text passes the same RefinedWeb heuristic filters. The reported CORE/EXTENDED centered-evaluation scores are: WET 20.7/12.2; resiliparse 24.1/13.4; trafilatura 24.5/12.5. These are published results under that recipe, not outputs of our small curator. CORE and EXTENDED are different benchmark aggregates with chance-centered task scoring, so they should not be relabelled ordinary document accuracy. '
        }
        <a href={'https://arxiv.org/pdf/2406.11794v2'}>{'DCLM Tables 1 and 3, version 2'}</a>
        {''}
      </Prose>

      <Prose>
        {
          "The comparison tests the extraction intervention in that pipeline. It does not prove trafilatura dominates every extractor or that its thresholds fit every language. Its different ordering on the two aggregates also illustrates why the evaluation question matters. FineWeb's extraction/filtering ablations, DCLM's fixed-recipe comparisons, Nemotron's curator combinations and FineWeb2's language-specific choices are examples of evaluated policies, not a universal leaderboard of data quality."
        }
      </Prose>

      <Prose>
        {
          'Now consider a constructed equal-budget example. A raw pool contains 1,000 unique training targets; filtering leaves 250. A 1,000-target training budget covers the retained pool four times if a loader cycles without replacement each pass. With uniform replacement, expected distinct retained targets are 250[1−(249/250)^1000], slightly below 250. The exposures differ even though the total processed-target count is the same. Revisit '
        }
        <a
          href={
            '/learn/path/full-curriculum/curriculum-learning-data-mixing-strategies?module=large-language-models#3-make-the-loader-obey-the-contract'
          }
        >
          {'sampling and exposure'}
        </a>
        {' before claiming that stronger filtering has no data-volume cost.'}
      </Prose>

      <Prose>
        {
          'Audit failures in the evaluation too. A classifier may remove terse mathematical statements or a minority script; aggregate English scores can miss the loss. A benchmark copied into training can make an apparent data improvement uninformative. A temporally later held-out set asks a different generalization question from a random source split. Define these checks before choosing the winning policy, preserve negative results, and inspect rejected samples under the actual use case.'
        }
      </Prose>

      <Prose>
        {
          'Curation chooses from existing material. The next lesson asks what changes when we transform or generate new material. The same distinctions remain: source provenance, target definition, diversity, learning budget and an independent evaluation question.'
        }
      </Prose>

      <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">
        <span id="11-self-check-exercises" aria-hidden="true" />
        <H2>{'13. Practice with changed records and decisions'}</H2>

        <section className="neural-practice">
          <Prose>
            {''}
            <strong>{'Change the repeated line.'}</strong>
            {' Normalize '}
            <code>{'xx'}</code>
            {', '}
            <code>{'abcd'}</code>
            {', '}
            <code>{'xx'}</code>
            {', '}
            <code>{'xx'}</code>
            {
              ' under our rule. Find duplicate-line incidence and duplicate-character share. What changes if every '
            }
            <code>{'xx'}</code>
            {' becomes '}
            <code>{'zzzz'}</code>
            {'?'}
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'exclude the first occurrence from the duplicate numerator.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'two of four occurrences are additional, incidence 1/2. Their four characters are among ten total, share 2/5. Lengthening the repeated line gives eight duplicate characters among sixteen, share 1/2; incidence stays 1/2. A threshold comparing characters with lines would not be a fraction of either object.'
              }
            </Prose>
          </details>
        </section>

        <section className="neural-practice">
          <Prose>
            {''}
            <strong>{'Preserve unknown probability mass.'}</strong>
            {' Vocabulary is '}
            <code>{'[red, blue]'}</code>
            {
              ' plus UNK. Training counts are red 2, blue 0 and three unknown words; α=1. Score a candidate containing two unseen spellings.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'the two spellings map to one outcome category.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'denominator 5+3=8; probabilities 3/8,1/8,4/8. Both candidate words get UNK probability 1/2, so cross-entropy ln 2 and perplexity 2. Treating each new spelling as an independent outcome with probability 1/2 would break the finite-support model as more spellings appear.'
              }
            </Prose>
          </details>
        </section>

        <section className="neural-practice">
          <Prose>
            {''}
            <strong>{'Trace IDF and a different update.'}</strong>
            {' Three training documents are '}
            <code>{'a a b'}</code>
            {', '}
            <code>{'a c'}</code>
            {', '}
            <code>{'b c'}</code>
            {
              '. Find IDF for a. Separately, a supplied feature x=[1,0], w=[0,1], b=0, y=1 uses λ=.2 and η=.1. Update w and b.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                'document frequency counts documents, not occurrences. Include the penalty on the second weight.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                "a occurs in two documents, so idf(a)=1+log(4/3). For the supplied feature, z=0 and p=.5. Data gradient is [−.5,0]; penalty adds [0,.2], giving [−.5,.2]. New w=[.05,.98] and b=.05. The second coordinate moves even though this example's second feature is zero because its weight is regularized. These supplied x values are a separate gradient fixture, not a claim about the preceding TF-IDF row."
              }
            </Prose>
          </details>
        </section>

        <section className="neural-practice">
          <Prose>
            {''}
            <strong>{'Resolve a score tie.'}</strong>
            {
              ' Scores are Z:.6, A:.6, M:.4. Compare exact k=1 with threshold .6 under ID-ascending ties.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'an exact count can split a tied score group.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'exact-k selects A only; threshold keeps A and Z. Sorting alone does not establish whether the difference is meaningful. A policy must declare how ties and the target count interact.'
              }
            </Prose>
          </details>
        </section>

        <section className="neural-practice">
          <Prose>
            {''}
            <strong>{'Raise a threshold and lose precision.'}</strong>
            {
              ' Labels in score order are [1,1,0,1] with scores [.95,.8,.75,.7]. Compute precision/recall at thresholds .7 and .75.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{"identify the removed record's label."}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'at .7, TP 3 / FP 1 / FN 0, precision 3/4 and recall 1. At .75, TP 2 / FP 1 / FN 1, precision 2/3 and recall 2/3. A higher cutoff removed a positive while retaining the negative. Set inclusion is monotone; precision need not be.'
              }
            </Prose>
          </details>
        </section>

        <section className="neural-practice">
          <Prose>
            {''}
            <strong>{'Diagnose leaked preprocessing.'}</strong>
            {
              ' A team groups duplicate documents before splitting but computes vocabulary/IDF from every partition. Another team fits features on training but splits two same-host copies apart. Name each problem and repair it.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'partitioning and fitted statistics are separate contracts.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'the first uses final-document distribution to choose a representation; fit vocabulary and IDF on training only, then transform frozen partitions. The second allows related records across assessment boundaries; construct the declared host/duplicate components first and assign whole groups. Neither repair proves every semantic dependency is gone. Report the relation and its residual limits.'
              }
            </Prose>
          </details>
        </section>

        <section className="neural-practice">
          <Prose>
            {''}
            <strong>{'Keep ranking while changing calibration.'}</strong>
            {
              ' Two records have probabilities [.8,.4] and labels [1,0]. Square the probabilities. Compare ordering and Brier loss.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'Brier averages the squared error against the labels.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                "ordering is unchanged. Original Brier=(.2²+.4²)/2=.1. Squared scores [.64,.16] give (.36²+.16²)/2=.0776. The transform improves this two-record value but need not help another labelled set or preserve a threshold's retained set. It is not a universal calibration method."
              }
            </Prose>
          </details>
        </section>

        <section className="neural-practice">
          <Prose>
            {''}
            <strong>{'Find the student-cost crossover.'}</strong>
            {
              ' Teacher cost is 20 units per record, student cost 2, teacher labels 50 records and fitting costs 200 units. When does the student route cost less than direct scoring?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'include both labelling and fitting once.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                '1200+2N<20N, so N>1200/18≈66.667. For integer N, 67 is the first cheaper case under this accounting. If collection/fit costs or score quality differ, the decision changes; the arithmetic itself does not establish adequate predictions.'
              }
            </Prose>
          </details>
        </section>

        <section className="neural-practice">
          <Prose>
            {''}
            <strong>{'Preserve the retention denominator.'}</strong>
            {
              ' Records have byte lengths [5,15,30,50]; a selector keeps the first and fourth. Calculate record and byte retention, then explain why token retention remains unknown.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                'first count retained records, then sum their byte lengths; each numerator needs its own original total.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'two of four records gives 1/2; 55 of 100 bytes gives .55. Token retention requires running the declared tokenizer and counting its actual training targets. Unequal encoded byte widths do not establish an equal token conversion across texts.'
              }
            </Prose>
          </details>
        </section>

        <section className="neural-practice">
          <Prose>
            {''}
            <strong>{'Trace an ensemble.'}</strong>
            {
              ' Scorer 1 ranks A>B>C; scorer 2 ranks B>C>A. Use average-rank percentiles with no ties. Find the retained set for maximum percentile at least .75, then minimum percentile at least .5.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{"each scorer's percentiles are 0,.5,1 assigned in its rank order."}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'scorer 1 gives A:1 / B:.5 / C:0; scorer 2 gives A:0 / B:1 / C:.5. Maximum≥.75 retains A and B, the union of two top-one sets. Minimum≥.5 retains only B, the intersection of two top-two sets. Neither operation promises the same kept count as an individual scorer.'
              }
            </Prose>
          </details>
        </section>

        <section className="neural-practice">
          <Prose>
            {''}
            <strong>{'Design a useful-data comparison.'}</strong>
            {
              ' A filter leaves one quarter of a pool. Compare it with the unfiltered pool under a fixed processed-target budget. Name controls, repetition accounting and a possible misleading success.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                'distinguish unique targets from repeated presentations, and ask whether the evaluation measures anything used to choose the filter.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'preserve model/init policy, optimizer, total targets and evaluation; record tokenizer/packing, selected unique targets, repeated exposures and selection work. Use declared seeds/uncertainty if resources permit. Report actual relevant evaluation, not only teacher agreement. A copied benchmark or changed training budget can create a misleading improvement; a small-domain loss can disappear inside an aggregate. Several designs are defensible if their question and remaining confounders are explicit.'
              }
            </Prose>
          </details>
        </section>

        <section className="neural-practice">
          <Prose>
            {''}
            <strong>{'Inspect a rejected specialist paragraph.'}</strong>
            {
              ' The supplied neural curator gives the conjugate-gradient example integer 1. Propose an auditable response without relabelling that number as truth.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                "separate the released model's rubric from your intended training task, then choose independent evidence for changing the selection policy."
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'retain its source text and model revision, inspect the paragraph against the intended specialist training task, and collect an independent set of comparable retained/rejected examples. A possible policy is an additional domain route or rubric revision, assessed on a new frozen evaluation and downstream training. Do not declare one paragraph proof that all filtering fails, and do not raise this one score by hand then call it model performance.'
              }
            </Prose>
          </details>
        </section>
      </section>

      <section
        className="lesson-ending lesson-ending--further-learning"
        data-lesson-ending="further-learning"
        data-lesson-resource-list=""
      >
        <H2>{'14. Further learning'}</H2>

        <ul>
          <li>
            {''}
            <a href={'https://arxiv.org/html/2402.16827v3'}>
              {'A Survey on Data Selection for Language Models'}
            </a>
            {
              ': use its reference-distribution/task-utility taxonomy after sections 3 and 10 to compare selection goals. It is broader than one pipeline recipe.'
            }
          </li>
          <li>
            {''}
            <a href={'https://arxiv.org/html/2406.17557v1'}>{"FineWeb's full paper, version 1"}</a>
            {
              ': follow the extractor/filter/dedup ablations after section 9; notice that interacting stages are tested with downstream training rather than only a score histogram.'
            }
          </li>
          <li>
            {''}
            <a href={'https://arxiv.org/html/2406.11794v2'}>{'DataComp-LM'}</a>
            {
              ': read the fixed training/evaluation framework and curator comparisons after section 12. Its controlled settings make corpus interventions interpretable.'
            }
          </li>
          <li>
            {''}
            <a
              href={
                'https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction'
              }
            >
              {'scikit-learn text feature extraction'}
            </a>
            {
              ': compare sparse TF-IDF tools with our dense scratch implementation. Keep the actual installed objective convention separate from a moving documentation version.'
            }
          </li>
          <li>
            {''}
            <a href={'https://github.com/huggingface/datatrove/blob/main/examples/fineweb.py'}>
              {"DataTrove's FineWeb example"}
            </a>
            {
              ': inspect a larger multi-stage orchestration after running the local example. Its cluster scheduler and corpus-specific defaults are additional engineering choices.'
            }
          </li>
        </ul>
      </section>

      <section className="lesson-ending lesson-ending--references" data-lesson-ending="references">
        <span id="10-primary-sources" aria-hidden="true" />
        <H2>{'15. Technical references and reproducibility'}</H2>

        <Prose>
          {
            'The local study files provide the full collection protocol, source response digests, fit protocol, saved linear model, per-ID predictions, neural inference and ordinary pipeline results. The exact source data are the '
          }
          <a href={'https://huggingface.co/datasets/HuggingFaceFW/fineweb-edu-llama3-annotations'}>
            {'FineWeb-Edu annotations'}
          </a>
          {'; the released regressor is '}
          <a
            href={
              'https://huggingface.co/HuggingFaceFW/fineweb-edu-classifier/tree/284663cbb2dabf9bda30d8f8cc49601251ee1631'
            }
          >
            {'FineWeb-Edu classifier'}
          </a>
          {
            '. Treat their target definitions and dataset/model revisions as part of the calculation.'
          }
        </Prose>

        <Prose>
          {'Primary method comparisons: '}
          <a href={'https://arxiv.org/abs/2406.17557'}>{'FineWeb'}</a>
          {', '}
          <a href={'https://arxiv.org/abs/2406.11794'}>{'DCLM'}</a>
          {', '}
          <a href={'https://arxiv.org/abs/2402.09668'}>{'How to Train Data-Efficient LLMs'}</a>
          {', '}
          <a href={'https://arxiv.org/abs/2302.03169'}>{'DSIR'}</a>
          {', and '}
          <a href={'https://arxiv.org/abs/2412.02595v1'}>{'Nemotron-CC, version 1'}</a>
          {'. '}
          <a href={'https://huggingface.co/datasets/HuggingFaceFW/fineweb-2'}>
            {"FineWeb2's card"}
          </a>
          {
            ' documents language-specific processing and limitations. These sources support their stated mechanisms and experiments; their large-scale outcomes were not rerun by the small lesson programs.'
          }
        </Prose>
      </section>

      <section className="lesson-ending lesson-ending--next" data-lesson-ending="next">
        <H2>{'16. Readiness and the next question'}</H2>

        <Prose>
          {
            'You are ready to use this material when you can trace one record through extraction, measurement, score, decision and audit; explain which labels a curator predicts; reproduce its feature and gradient calculation; protect a grouped assessment; and distinguish ranking, probability calibration, retention mass and downstream usefulness. You should also be able to name a useful document a stated policy could remove and propose evidence that would justify changing the policy.'
          }
        </Prose>

        <Prose>
          {'Continue to '}
          <a
            href={
              '/learn/path/full-curriculum/synthetic-data-generation-for-pre-training?module=large-language-models'
            }
          >
            {'Synthetic Data Generation for Pre-Training'}
          </a>
          {
            ": selecting existing records leaves open whether a transformation or generated example can add useful training signal without reproducing the source's mistakes or narrowing its diversity."
          }
        </Prose>
      </section>
    </div>
  ),
};
