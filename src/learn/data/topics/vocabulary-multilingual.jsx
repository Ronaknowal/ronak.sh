import { Prose, H2, H3, Code, CodeBlock } from "../../components/content";
import { MathBlock } from "../../components/content/Math.jsx";
import { LessonIntro, LessonTable, Sources } from "../../components/lesson-labs/LessonElements.jsx";
import RemoteCodeBlock from "../../components/content/RemoteCodeBlock.jsx";
import {
  VocabularyChoiceFigure,
  VocabularyCoverageFigure,
  VocabularyFertilityFigure,
  VocabularySamplingFigure,
  VocabularyMixtureLab,
  VocabularyEmbeddingFigure,
  VocabularyWorkFigure,
  VocabularyBudgetLab,
  VocabularyNormalizationFigure,
  VocabularyExperimentFigure,
  VocabularyCompatibilityFigure,
  VocabularySoftmaxFigure,
  MultilingualResultsFigure,
  VocabularyParallelFigure,
  VocabularyAllocationFigure,
  VocabularyOutputFigure,
  VocabularyBoundaryFigure,
  VocabularyCountsFigure,
  VocabularyRetrievalFigure,
  VocabularyMassLab,
  VocabularyJoinsLab,
  VocabularyStorageLab,
} from "../../components/lesson-labs/MultilingualVocabularyLabs.jsx";

export default {
  title: "Vocabulary Design & Multilingual Tokenization",
  readTime: "~65 min read + 75 min experiments and practice",
  content: () => (
    <div className="neural-lesson neural-lesson-neutral vocabulary-lesson lesson-flow">
      <LessonIntro prerequisites="The subword lesson introduces BPE: repeatedly join common adjacent pieces. The byte/character lesson explains how UTF-8 represents text. We will briefly reconnect both ideas before using them." exampleKind="Python + live vocabulary investigations">
        Begin with one tiny dictionary in sections 1–2. Sections 3–5 show how the training text, dictionary size and text-cleaning rules change the result through focused live investigations. Sections 6–7 build and run a real comparison. Section 8 explains how these decisions affect an already trained model. Finish with applications and worked practice. The library experiments run on a CPU without downloading pretrained model weights.
      </LessonIntro>
      <Prose>A support assistant has room for 4,000 input tokens. An English document fits, but a translation uses more than 4,000 tokens and is cut off. The translation is not necessarily a longer explanation. The tokenizer might simply need more pieces to spell it. How would you find out—and what could you change without breaking the model?</Prose>
      <Prose>We will follow that question from a tiny dictionary you can inspect to a real experiment on English, Hindi and Chinese. The goal is to choose pieces that work well for the texts people actually send, understand what those pieces cost the model, and measure whether a proposed change helps.</Prose>

      <H2>1. What are we choosing when we design a vocabulary?</H2>
      <Prose>Start with the text <Code>cat cats</Code> and four available pieces: <Code>c</Code>, <Code>a</Code>, <Code>t</Code> and <Code>s</Code>. Letter by letter, the two words need seven pieces. We can afford one additional dictionary entry. Compare spending it on <Code>cat</Code> or <Code>cats</Code>:</Prose>
      <VocabularyChoiceFigure />
      <Prose>The stored possibilities form the <em>vocabulary</em>; the pieces actually sent form the <em>token sequence</em>. The drawing keeps them separate: a dictionary entry can be used more than once in a message. A real dictionary might store 32,000 entries while a particular message uses 50 positions. A piece keeps its hue when reused, so you can follow it from the dictionary into the message. Literal labels identify each piece; a white underline marks the occurrence being traced.</Prose>
      <Prose>The useful entry is not always the longest word. Here, <Code>cat</Code> is reusable: one occurrence spells the first word, and another combines with <Code>s</Code> to spell the second. Choosing it reduces seven pieces to three. If our future texts contained only <Code>cats</Code>, the other choice would be better. <strong>A vocabulary is a bet about which patterns will recur.</strong></Prose>
      <Prose>A real trainer makes many such choices from a collection of example texts, called a <em>corpus</em>. In BPE, frequent adjacent pairs become new pieces; other tokenizers choose pieces by different rules. This lesson assumes that mechanism is available and asks three design questions: which texts should influence it, how many entries should it keep, and how do we tell whether the result is useful?</Prose>
      <H3>Being able to spell text is different from spelling it compactly</H3>
      <Prose>Our four-letter dictionary cannot spell <Code>猫</Code>, the Chinese character for cat. The <a href="/learn/path/full-curriculum/byte-level-tokenization-token-free-models?module=large-language-models">byte lesson's UTF-8 representation</a> gives us another route. Follow the two repeated characters into their byte groups:</Prose>
      <VocabularyCoverageFigure />
      <Prose>Each <Code>猫</Code> is one Unicode scalar value, <Code>U+732B</Code>, stored as three UTF-8 bytes <Code>E7 8C AB</Code>. A dictionary containing all 256 byte values can spell the input using six byte pieces. Adding the character yields two pieces; a hypothetical whole-string entry yields one. All three paths reconstruct the same text. The learned dictionary can add useful pieces above the complete byte alphabet.</Prose>
      <Prose><em>Coverage</em> asks whether we can represent the input without losing it. <em>Compactness</em> asks how many pieces that representation needs. A byte fallback can give excellent coverage while still producing a long sequence. An unknown token such as <Code>[UNK]</Code> is different: if many unseen strings all become that one symbol, the original spelling is no longer recoverable.</Prose>
      <Prose>Adding a whole-string piece also does not make the model understand its meaning. Later, the model learns a row of numbers associated with each piece. Those rows need training examples. A giant dictionary can spend memory on rare pieces that barely get trained; a tiny one can make ordinary messages unnecessarily long. We will measure both sides of that tradeoff.</Prose>
      <Prose>Do not picture a multilingual dictionary as separate sealed boxes for languages. Digits, punctuation, names and shared scripts can reuse entries. At the same time, a language's everyday chat, scientific writing and romanized spelling can need different pieces. Keep these varieties visible when you inspect your data.</Prose>

      <H2>2. How many pieces does a message need?</H2>
      <Prose>Before comparing languages, count something small enough to see. With the dictionary that includes <Code>cat</Code>, our two words become one piece and two pieces. The average is three pieces divided by two words:</Prose>
      <VocabularyFertilityFigure />
      <Prose><em>Fertility</em> sounds more mysterious than it is: it is just the number of subword pieces per word under a stated word-counting rule. High fertility means words are being split into many pieces. It can reveal a dictionary that rarely contains useful pieces for your domain.</Prose>
      <H3>A word average and a message cost answer different questions</H3>
      <Prose>Our word average measures splitting. Return now to the support document: the question is how many positions comparable content occupies. Here is one constructed pair, before either count is turned into a ratio:</Prose>
      <VocabularyParallelFigure />
      <Prose>The reference uses 12 positions; its translation uses 18. The extra six positions mean <Code>18 / 12 = 1.5</Code> times the text-token count. The separate word counts, eight and six under the chosen rules, do not alter that position comparison.</Prose>
      <LessonTable caption="One constructed pair of translations, counted two ways" headers={["", "Reference message", "Translated message"]} rows={[
        ["Total tokens", "12", "18"],
        ["Words under the stated counting rule", "8", "6"],
        ["Tokens per word", "12 / 8 = 1.5", "18 / 6 = 3"],
      ]} />
      <Prose>The message-length ratio is 1.5, but the ratio of the two word averages is <Code>3 / 1.5 = 2</Code>. Neither arithmetic calculation is wrong. The mistake would be calling both “the cost of the translation.” Languages need not express a thought using the same number of words.</Prose>
      <Prose>Word counting itself needs care. Python's <Code>split()</Code> counts whitespace-delimited units. Many Chinese sentences have no spaces between words, so this would often count an entire sentence as one unit. Label that result <em>tokens per whitespace unit</em>. If you use a linguistic word segmenter, name it and record its settings. A measurement becomes useful when a reader knows exactly what was counted.</Prose>
      <H3>Keep the details that an average can hide</H3>
      <Prose>Two words split into 1 and 3 pieces have fertility 2. Two words split into 2 and 2 pieces also have fertility 2. But the first case has one split word, and the second has two. The <em>proportion of continued words</em> counts words needing more than one piece, divided by all words: 50% versus 100%. This helps separate occasional long identifiers from fragmentation affecting nearly every word.</Prose>
      <LessonTable caption="Choose the measure that matches the question" headers={["Question", "Measure", "What to keep beside it"]} rows={[
        ["How much do words split?", "Tokens / words: subword fertility", "The word-boundary rule; proportion of split words."],
        ["Does comparable content fit?", "Translated tokens / matching reference tokens", "Matching translated sentence IDs and both raw counts."],
        ["How compact is this stored text?", "Bytes or codepoints / tokens", "Encoding and normalization; these units are not meaning."],
        ["Where did useful pieces run out?", "Unknown IDs and byte-fallback tokens", "Actual affected strings and whether decoding recovers them."],
        ["Does the system work better?", "Task score plus memory and time", "A trained, compatible model and matched task conditions."],
      ]} />
      <Prose>For a whole corpus, add the counts before dividing. Let <Code>T(x)</Code> mean “tokenize text x,” so <Code>|T(x)|</Code> is its token count. Let <Code>W(x)</Code> count words using your stated rule. The index <Code>i</Code> identifies a sentence, and <Code>ℓ</Code> identifies a language. Then the two useful ratios are:</Prose>
      <MathBlock>{"F_\\ell=\\frac{\\sum_i |T(x_{\\ell i})|}{\\sum_i W(x_{\\ell i})}"}</MathBlock>
      <MathBlock>{"R_\\ell=\\frac{\\sum_i |T(x_{\\ell i})|}{\\sum_i |T(x_{\\mathrm{ref},i})|}"}</MathBlock>
      <Prose>The first is total pieces per counted word. The second compares totals over matching translated sentences. Averaging individual sentence ratios would give a tiny reference sentence as much influence as a long one. If a denominator is zero, the ratio is undefined; our code returns <Code>None</Code> rather than inventing a number.</Prose>
      <Prose><strong>When you run a comparison:</strong> keep the texts, split, normalization and automatic special tokens fixed. Show each language before combining results. A traffic-weighted average answers “what does our expected workload cost?” An equal-language average answers a different question. Check difficult documents and domains as well as the mean; a serious study also estimates variation across samples. Petrov and colleagues study parallel-content disparities, while Rust and colleagues connect tokenizer properties to downstream evaluation.</Prose>
      <Prose>One thing you can conclude directly: 18 tokens occupy more positions than 12, and cost more under the same text-token price. One thing you cannot conclude from that count alone: the whole system is 1.5 times slower or understands less. Batching, hardware, output length and the trained model affect those outcomes. Keep the simple count, and measure the additional claim separately.</Prose>

      <H2>3. Which texts get to shape the dictionary?</H2>
      <Prose>Suppose nine out of every ten training examples come from collection A and only one comes from B. A pair-frequency learner mostly sees A's patterns. It will tend to spend its limited joins on those patterns, even if serving B well is important to you. The trainer does not know your product priorities; it counts the examples you give it.</Prose>
      <Prose>We can change how often each collection contributes. The numbers describing their relative influence are <em>weights</em>. After dividing them by their total, they become <em>shares</em> that sum to 100%. One useful way to make unequal weights less extreme is to take a root before dividing:</Prose>
      <VocabularySamplingFigure />
      <Prose>The general control is an exponent called <Code>α</Code> (alpha). At <Code>α=1</Code>, a weight stays unchanged. At <Code>α=.5</Code>, take its square root. At <Code>α=0</Code>, every positive weight becomes one, giving the available collections equal shares. A collection with no data remains absent.</Prose>
      <Prose>Write <Code>nℓ</Code> for a collection's starting weight and <Code>qℓ</Code> for its final share. The formula simply says “transform this weight, then divide by the sum of all transformed positive weights”:</Prose>
      <MathBlock>{"q_\\ell(\\alpha)=\\frac{n_\\ell^\\alpha}{\\sum_{j:n_j>0}n_j^\\alpha}"}</MathBlock>
      <Prose>For three weights 80:15:5, <Code>α=1</Code> gives 80%, 15%, 5%. At <Code>α=.5</Code>, the square roots are approximately 8.944, 3.873 and 2.236. Divide each by their sum to get 59.417%, 25.728% and 14.854%. Now watch what those changed shares actually do to a few words.</Prose>
      <VocabularyMixtureLab />
      <Prose>At the default settings, the rebalanced dictionary spends more useful joins on the Hindi examples, while English <Code>cats</Code> needs an extra piece compared with the unrebalanced baseline. The point is the mechanism: changed counts can change which pair wins. A tiny weight adjustment may do nothing until a different pair overtakes the current winner, then the segmentation changes abruptly.</Prose>
      <Prose>Alpha changes the treatment of existing weights. A different decision is changing the collections' starting weights themselves. Keep α=.5 and four joins fixed, then edit the observed masses. The current word strips and actual learned joins stay visible, including collections whose alphabet disappears at zero weight:</Prose>
      <VocabularyMassLab />
      <Prose>That missing-alphabet case belongs to this small character-based BPE model: it has no byte fallback. A complete byte alphabet would preserve coverage. Keep the masses fixed now and vary just the number of joins. This separates the evidence the trainer sees from the number of entries it may learn:</Prose>
      <VocabularyJoinsLab />
      <Prose>At zero joins the characters and <Code>{"</w>"}</Code> end marker stay separate under every weighting. More joins can combine them, but once no adjacent pair remains, an extra allowed join changes nothing. The end marker is counted because this particular scratch algorithm emits it; a tokenizer with another boundary convention must be measured under its own rules.</Prose>
      <H3>Be precise about what gets sampled</H3>
      <Prose>“Half the examples” is incomplete. Half the <em>documents</em> can still be most of the <em>words</em> if those documents are long. For document shares, sample documents. For word-occurrence shares, first divide each collection's word counts by its own word total, then apply its share. Our scratch helper does the latter. If both collections contain <Code>solar</Code>, their contributions to that word add together.</Prose>
      <Prose>The sampling formula chooses exposure, not diversity. Repeating the same 100 sentences does not teach characters or domains missing from them. Deduplicate, check language labels and scripts, and inspect licenses and text quality before giving a small collection a larger weight. Also distinguish two training jobs: tokenizer training chooses the pieces; language-model training teaches the network how to use them. Their mixtures can differ, but an embedding row still needs useful model-training exposure.</Prose>
      <H3>Turn a fractional plan into an actual run</H3>
      <Prose>The trainer cannot repeat a collection 10.8 times. Suppose shares are .9 and .1 but there are twelve repetition slots. Look at the slot that is still unassigned after taking whole parts:</Prose>
      <VocabularyAllocationFigure />
      <Prose>The desired counts are 10.8 and 1.2. Their floors give 10 A slots and 1 B slot: eleven assigned. Give the remaining slot to the larger fractional remainder, .8 rather than .2. The result is 11 A and 1 B, still totaling twelve. This <em>largest-remainder</em> rule converts a fractional target into a finite allocation; it approximates exposure instead of creating new examples.</Prose>
      <Prose>Our real experiment allocates 30 whole-collection passes in total across the three collections. One pass reads that collection's fixed 100 training sentences; for example, 24 English passes plus 5 Hindi plus 1 Chinese uses all 30 slots. We report the realized repeats as well as the target shares. In small runs rounding matters. Research papers sometimes write the exponent as <Code>1 / τ</Code>, using a “temperature” τ: compare formulas, not just parameter names. XLM-R's reported <Code>α=.3</Code> is one tested setting in its setup, not a universal best value.</Prose>

      <H2>4. What does a larger dictionary cost the model?</H2>
      <Prose>Adding a dictionary entry also adds learned numbers to the model. Each piece's representation is an <em>embedding</em>: a row of numbers retrieved using its token ID. Follow <Code>cat</Code> to ID 4 and then into a five-row table:</Prose>
      <VocabularyEmbeddingFigure />
      <Prose>In realistic models the row is much wider. We call the number of dictionary entries <Code>V</Code> and the number of numbers per row <Code>d</Code>. The table shape is <Code>[V,d]</Code>, with <Code>V × d</Code> learned parameters. Include reserved symbols in V: they need addresses too. At V=128,000 and d=4,096, that is 524,288,000 parameters. Two-byte storage needs 1,000 MiB for this one table.</Prose>
      <H3>Reading a token and predicting a token use the table differently</H3>
      <Prose>On input, the model knows the token ID and retrieves one row. At an output position, it has a computed vector, called its <em>hidden state</em>, and must decide which token comes next. Its <em>output head</em> compares that vector with every candidate row, then turns the scores into probabilities.</Prose>
      <Prose>The input and output tables may share the same weights, called <em>weight tying</em>. Sharing saves storage: one table instead of two. It does not remove the output head's job of scoring the choices. Two untied tables in the example above need 2,000 MiB. Gradients, optimizer state, biases and the rest of the network are additional costs.</Prose>
      <Prose>Here is one three-number hidden state and the same five-row table. Follow the branch for the selected cat row:</Prose>
      <VocabularyOutputFigure />
      <Prose>For the selected <Code>cat</Code> row, multiply corresponding components and add: <Code>.2×.5 + .4×.1 + .1×.2 = .16</Code>. This dot product is a raw score, called a <em>logit</em>. Do the same for all rows to get five scores. Softmax turns their exponentials into shares by dividing by the total; section 8 traces why adding another candidate changes that denominator. A tied table is stored once, but still read in both these different ways.</Prose>
      <Prose>Explore storage alone first. The drawn rectangle's height follows V, its width follows d; the dotted cells represent its shape rather than one cell per real parameter. Each stored parameter uses two bytes:</Prose>
      <VocabularyStorageLab />
      <H3>Fewer positions can offset some of the extra choices</H3>
      <Prose>Storage counts the table. Computation also depends on how many positions reach it. Compare the two equal-cell output grids and the two attention grids:</Prose>
      <VocabularyWorkFigure />
      <Prose>We use <Code>T</Code> for the number of token positions, matching the preceding lessons; the retained budget helper calls this count <Code>N</Code>. Scoring V choices at T positions gives T×V scores. Each dot product needs d multiply-accumulates, giving <Code>T × d × V</Code> head work. Full attention connects each position with all T positions: <Code>T²</Code> pairs per head. Doubling V while halving T leaves the output-score count unchanged but quarters the pair grid.</Prose>
      <Prose>These grids count unrestricted, all-to-all attention: every position may connect to every position. The preceding byte lesson counted only causally allowed pairs, where a position cannot see the future; that triangular count is <Code>T(T+1)/2</Code>. Both grow quadratically for long sequences, but their exact small-example counts differ.</Prose>
      <Prose>This explains why “more vocabulary costs more” and “shorter sequences cost less” can both be true. Shape accounting does not determine wall-clock speed: operation mix, batching and hardware matter. Hold width at d=4,096 and the baseline at V=32,000,T=1,000. Change candidate V and candidate T independently:</Prose>
      <VocabularyBudgetLab />
      <Prose>A serving model also keeps previously computed attention keys and values in a <em>KV cache</em>. At a fixed architecture and data type, the bytes per token in that cache depend on layers, KV heads and their dimensions—not vocabulary size. A shorter text needs fewer cached positions. Processing a whole prompt (<em>prefill</em>) and generating one new token at a time (<em>decoding</em>) put different pressure on the system, so profile both.</Prose>
      <Prose>Finally, a larger dictionary does not guarantee a shorter encoding for every new string. Separately trained tokenizers can choose different pieces; new entries might describe patterns absent from deployment text. Measure held-out lengths, memory and downstream task performance together. There is no best vocabulary size determined only by the number of languages.</Prose>

      <H2>5. What should survive before the text becomes pieces?</H2>
      <Prose>Dictionary capacity only helps with distinctions that survive the text pipeline. Follow these two spellings through one accent-stripping operation:</Prose>
      <VocabularyNormalizationFigure />
      <Prose>Both arrive as <Code>resume</Code>. The downstream tokenizer cannot recover whether the original described work experience or meant “continue.” This many-to-one transformation is a <em>normalizer</em>. Accent-insensitive search may deliberately choose it; a spelling-preserving assistant may choose another rule.</Prose>
      <Prose>A tokenizer is a pipeline. First, a <em>normalizer</em> may change the text. Then a <em>pretokenizer</em> may divide it into regions, such as words or digit groups, that pieces cannot cross. Finally, the subword algorithm encodes within those regions. These earlier choices constrain what the later learner can discover.</Prose>
      <VocabularyBoundaryFigure />
      <Prose>In this constructed boundary policy, <Code>solar-panel</Code> becomes three regions: <Code>solar</Code>, <Code>-</Code> and <Code>panel</Code>. A trainer may join pieces inside each region, but cannot learn the cross-region piece <Code>solar-panel</Code>. More entries do not change that permitted geometry. Boundary policy, alphabet policy and vocabulary budget are separate experimental factors.</Prose>
      <LessonTable caption="Inspect the pipeline before blaming dictionary size" headers={["Stage or option", "Concrete effect", "What to inspect"]} rows={[
        ["Normalization", "NFKC changes the ligature ﬁ into fi. Accent stripping makes résumé and resume coincide.", "Raw versus transformed text; which differences the task must retain."],
        ["Pretokenization", "A rule splitting every digit prevents learning a multi-digit piece such as 2026.", "Actual regions for numbers, code, mixed-script names and combining marks."],
        ["Character coverage", "Keeping only frequent training characters leaves rare ones needing another representation.", "Unknown IDs and byte fallback on new text."],
        ["Decoding and display", "Individual byte pieces may not form a complete character yet.", "Decode the full byte sequence, then compare it with the input."],
      ]} />
      <Prose>In SentencePiece, <Code>character_coverage</Code> controls how much of the observed training-character frequency to retain in the base alphabet. A value of one retains the observed alphabet; it does not magically include characters absent from training. With <em>byte fallback</em>, an unseen character can instead be spelled through its UTF-8 bytes. That preserves text but may require extra positions, exactly as in section 1.</Prose>
      <Prose>Our real-data program uses identity normalization and explicit whitespace settings so it can test exact round trips on the supplied inputs. Other tasks may deliberately normalize text; in that case say whether decoding should recover the raw input or the normalized version. A useful test must match the promised behavior.</Prose>
      <Prose>A final display detail matters for multilingual inspection: show pieces in their stored logical order, with bidirectional isolation so neighboring right-to-left fragments do not rearrange labels. Do not add directional controls to the model input just to repair a diagram. A piece boundary inside a Devanagari grapheme is not automatically lost text—the fully decoded sequence may still be correct. The <a href="/learn/path/full-curriculum/byte-level-tokenization-token-free-models?module=large-language-models">byte/character lesson</a> explains those character layers.</Prose>

      <H2>6. Build a reproducible measurement pipeline</H2>
      <Prose>We now turn the earlier decisions into code. The experiment asks: if the text stays the same but its weighting or dictionary budget changes, do new documents need fewer pieces? “New” matters: measuring only the text used to learn the dictionary can reward memorized patterns that never recur.</Prose>
      <Prose>There are three small jobs before the tokenizer does its work: turn starting weights into shares, turn those shares into weighted word counts, and measure what the trained tokenizer produces. The BPE algorithm itself was already implemented in the <a href="/learn/path/full-curriculum/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram?module=large-language-models">subword lesson</a>. Download its <a href="/learn-code/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram/subword_tokenizers.py" download>subword_tokenizers.py</a> and reuse it. We are adding the experiment around it, not a second competing implementation.</Prose>
      <Prose>Use a new domain fixture to see words shared by collections. Both collections contain <Code>solar</Code>; inspect the contributions before they are added:</Prose>
      <VocabularyCountsFigure />
      <Prose>Collection a contains <Code>solar panel solar</Code>; collection b contains <Code>solar cell cell</Code>. With shares .75/.25, solar receives <Code>.75×2/3=.5</Code> from a and <Code>.25×1/3=1/12</Code> from b. Its combined count is <Code>7/12≈.583333</Code>. Panel receives .25 and cell receives <Code>1/6≈.166667</Code>; the three masses sum to one. These fractional occurrences are precisely what our reused BPE trainer counts.</Prose>
      <LessonTable caption="Trace the data through the three new helpers" headers={["Helper", "Input → output", "Why it is there"]} rows={[
        ["sampling_distribution", "Weights 9:1, α=.5 → shares .75:.25", "Decide how much each collection contributes."],
        ["weighted_word_counts", "Texts plus shares → a weight for every distinct word", "Longer files must not silently override a chosen word-occurrence share."],
        ["audit_documents", "A trained encoder plus unseen texts → counts and per-document lengths", "Measure the result on actual inputs, one document at a time."],
      ]} />
      <Prose>For numerical stability, <Code>sampling_distribution</Code> computes powers through log weights and subtracts the largest log weight before exponentiating. The common scaling cancels when dividing by the total, while avoiding unnecessary overflow. The audit streams documents instead of keeping every token ID in memory. It retains the per-document lengths needed for matching translated sentences.</Prose>
      <RemoteCodeBlock source="/learn-code/vocabulary-design-multilingual-tokenization/vocabulary_audit.py" filename="vocabulary_audit.py" language="python" />
      <Prose>Save the reusable BPE program beside the audit program to run this small composition. The collections share <Code>solar</Code>, so its mass combines. Only the weighting is new; the prerequisite performs merge selection and encoding. The sampling unit here is a word occurrence, with the BPE owner's explicit end-of-word marker.</Prose>
      <CodeBlock language="python" filename="weighted_vocabulary_example.py">{`from subword_tokenizers import train_bpe
from vocabulary_audit import sampling_distribution, weighted_word_counts

corpora = {"a": ["solar panel solar"], "b": ["solar cell cell"]}
shares = sampling_distribution({"a": 9, "b": 1}, alpha=0.5)
counts = weighted_word_counts(corpora, shares)
model = train_bpe(counts, num_merges=6)
print(shares)
print(dict(counts))
print(model.encode_word("solar"))`}</CodeBlock>
      <Prose>The program passes those counts to <Code>train_bpe</Code>, then encodes <Code>solar</Code> using the actual learned merge list. This connects the diagram's shared-word mass to the prerequisite's pair-selection mechanism; no model weights are involved in fitting these pieces.</Prose>
      <Prose>Inspect those intermediate counts when debugging: correct-looking final pieces cannot rescue the wrong sampling unit. Different libraries may still make different choices because of preprocessing or tied pair counts; sharing the weighting policy does not promise identical learned merge order.</Prose>
      <H3>Use real text, and keep the holdout out of fitting</H3>
      <Prose>The ordinary route uses a supplied <a href="https://github.com/facebookresearch/flores/tree/main/flores200">FLORES-200</a> subset, professionally translated text collected to evaluate multilingual translation. We use English, Hindi and Simplified Chinese for a narrower tokenizer question: the first 100 <Code>dev</Code> sentences per language for local fitting, and first 20 <Code>devtest</Code> sentences per language for local holdout. Matching sentence IDs align across languages.</Prose>
      <VocabularyExperimentFigure />
      <Prose><strong>Experiment scope.</strong> This small teaching fit repurposes part of an evaluation dataset; it is not an official FLORES result or a representative language ranking. No language model is trained. The <a href="/learn-code/vocabulary-design-multilingual-tokenization/flores_tokenizer_sample.json" download>360-record sample</a> and <a href="/learn-code/vocabulary-design-multilingual-tokenization/flores_sample_provenance.md" download>provenance</a> include split IDs, original article attribution, release identity and CC BY-SA 4.0 license. Exposure masses 80:15:5 are experimental controls, not web statistics. Larger studies need independent domain/document splits, repeated samples and downstream tasks.</Prose>

      <H2>7. Train the ordinary tool and interpret the whole result</H2>
      <Prose>SentencePiece is a maintained tool that learns and applies a tokenizer. We use its BPE trainer instead of maintaining our own production tokenizer. Our own audit still decides what to compare and how to interpret it. Keep the audit, SentencePiece program and JSON sample together. The four runs combine <Code>α=1,.5</Code> with dictionary budgets 1,600 and 2,400, as shown above.</Prose>
      <CodeBlock language="bash" filename="run_multilingual_audit.sh">{`python -m pip install sentencepiece
python vocabulary_audit.py
python multilingual_sentencepiece.py`}</CodeBlock>
      <RemoteCodeBlock source="/learn-code/vocabulary-design-multilingual-tokenization/multilingual_sentencepiece.py" filename="multilingual_sentencepiece.py" language="python" />
      <Prose>Look first at the loop that yields training sentences. It repeats whole collections without making a large duplicated list. Thirty repetition slots become <Code>24:5:1</Code> at <Code>α=1</Code> and <Code>18:8:4</Code> at <Code>α=.5</Code>. Because each collection has 100 sentences, the first setting presents 2,400 English, 500 Hindi and 100 Chinese sentences, including repeats. Their realized shares are 80:16.67:3.33%; the second setting gives 60:26.67:13.33%. The printed target shares make the rounding visible.</Prose>
      <Prose>Next inspect the trainer options. Alphabet entries, special symbols and all 256 byte-fallback IDs count toward V; V is not just the number of newly learned word pieces. <Code>hard_vocab_limit=False</Code> allows the tool to return fewer entries if it cannot reach the requested size. Record the actual size rather than assuming the request was reached. Finally, every model encodes the same untouched test sentences.</Prose>
      <Prose>The recorded program uses SentencePiece 0.2.2. Current <a href="https://github.com/google/sentencepiece/blob/master/doc/options.md">official options</a> also document an <Code>auto_character_coverage</Code> choice for v0.2.3+: with byte fallback enabled, it chooses character and longer-piece entries while comparing their usefulness against byte tokens. That moves alphabet coverage into a joint allocation decision. It still cannot discover a deployment pattern absent from the training text. This newer option was researched, while the four executed results below keep their original version and fixed coverage policy.</Prose>
      <MultilingualResultsFigure />
      <Prose>The recorded SentencePiece 0.2.2 CPU run reached both budgets. At 1,600 IDs, reweighting reduced Hindi from 2,387 to 2,195 tokens and increased English from 1,730 to 1,781. Chinese stayed at 1,446: a useful null result. At 2,400 IDs, totals were English 1,399→1,440, Hindi 1,895→1,708 and Chinese 1,436→1,423. The same intervention has different effects on different held-out text.</Prose>
      <Prose>Why does Chinese barely move here? All runs use 418 byte-fallback tokens on its holdout. Its held-out alphabet includes characters absent from the 100 training sentences; repeating those same sentences cannot expose new characters. All languages round-trip exactly and emit zero unknown IDs. English and Hindi each use one fallback byte token. This is section 1's distinction in real data: lossless encoding can coexist with fragmentation.</Prose>
      <Prose>At the first setting, Chinese's parallel ratio is <Code>1446 / 1730 ≈ .836</Code>, despite its fallback count. A language label does not prescribe a fixed premium. Translation length, vocabulary, script, preprocessing and text distribution matter. Keep raw counts visible instead of treating these 20 sentences as a universal cost ranking.</Prose>
      <Prose>For an existing pretrained tokenizer, use its encoder and disable automatic BOS/EOS when measuring text-only counts. Then measure the complete deployed prompt with its actual template and special tokens. Verify the exact artifact paired with the model. An API such as <Code>train_new_from_iterator</Code> produces a new tokenizer, not a promise that the old model's rows still match.</Prose>

      <H2>8. Deeper branch: change a pretrained vocabulary deliberately</H2>
      <Prose>We have so far designed a tokenizer as if the model were still to be trained. What if a useful model already exists? Return to the embedding table from section 4. During training, each numbered row learns how its piece is used. Changing the spelling assigned to that row changes what the model is being told.</Prose>
      <Prose>For the migration example, switch to an energy-domain dictionary: <Code>[UNK], solar, panel, cost</Code>, with IDs 0–3. The model table must follow these addresses. Trace the original route, the wrong replacement route and the appended row:</Prose>
      <VocabularyCompatibilityFigure />
      <Prose>Originally, solar's ID 1 selects solar's learned row. If a replacement tokenizer sends solar as ID 3 while storage stays put, the model reads cost's row instead. Equal dictionary sizes do not establish compatibility. Appending photovoltaic as ID 4 leaves the four old addresses in place and creates one new row, whose representation still needs training.</Prose>
      <Prose>Appending an ordinary domain piece can preserve old IDs and add a new row. That row needs training; matching the new piece may also replace several old IDs in familiar strings. Reserve special tokens for structural roles such as boundaries or controls. A frequent domain term need not become a control token. Check matching in context, including spaces, normalization and substrings.</Prose>
      <Prose>The full pairing includes more than the list of strings: merge order, normalization, matching rules for added pieces and the prompt's structural tokens affect what IDs reach the model. Save and test those together. Preserving old row addresses is the first requirement, not proof that every behavior remains unchanged.</Prose>
      <Prose>This program implements row extension with NumPy, then performs it with an actual HF fast tokenizer and a tiny randomly initialized GPT-2 model. It fetches no weights. Four IDs become five; old rows stay exact; the new row is the mean of old rows in both routes. This is a controlled initialization comparison, not a trained representation of <Code>photovoltaic</Code>.</Prose>
      <CodeBlock language="bash" filename="run_vocabulary_migration.sh">{`python -m pip install numpy torch transformers tokenizers
python vocabulary_migration.py`}</CodeBlock>
      <RemoteCodeBlock source="/learn-code/vocabulary-design-multilingual-tokenization/vocabulary_migration.py" filename="vocabulary_migration.py" language="python" />
      <Prose><Code>add_tokens</Code> returns the number actually added. Pass <Code>len(tokenizer)</Code>, the full resulting size, to <Code>resize_token_embeddings</Code>. The program explicitly enables tying and checks that input/output tables share storage afterward. It overrides initialization for an exact scratch comparison. Transformers also provides <Code>mean_resizing</Code>; inspect your version's behavior rather than assuming its default is identical to a deterministic mean row.</Prose>
      <Prose>Section 4's output head scores all candidates. Even when every old score remains unchanged, a new candidate participates in softmax's denominator. Follow the equal-score case:</Prose>
      <VocabularySoftmaxFigure />
      <Prose>Each zero logit contributes <Code>exp(0)=1</Code>. Four candidates sum to four, so each gets <Code>1/4=25%</Code>; five sum to five, so each gets <Code>1/5=20%</Code>. More generally, an old score z has probability <Code>exp(z)/S</Code>. Appending a candidate with score u changes it to <Code>exp(z)/(S+exp(u))</Code>. A finite added score increases the denominator; preserving old vectors therefore does not preserve the old distribution.</Prose>
      <MathBlock>{"p'_i=\\frac{e^{z_i}}{\\sum_{j=1}^{V}e^{z_j}+e^u}=p_i\\,\\frac{S}{S+e^u},\\quad S=\\sum_{j=1}^{V}e^{z_j}"}</MathBlock>
      <Prose>New segmentation also changes inputs. Evaluate old and new tasks after adaptation. Loss per token has a changed denominator when segmentation changes; total negative log probability divided by the input's UTF-8 byte count gives bits per byte after converting natural logs to base two. Match the text and normalization before interpreting that comparison. Full language-model evaluation is a later topic; this row-extension program checks addressing and initialization.</Prose>
      <Prose>Resize before constructing the optimizer, or explicitly migrate state: a running optimizer may retain old parameter references and incompatible shapes. Save/reload tokenizer and model together; verify special IDs, tying and fixed regression inputs. Replacement or pruning can also be studied by mapping overlapping rows and training the changed model. It is a substantial adaptation project, not necessarily pretraining the entire network from zero. Keeping the original tokenizer is coherent when the adaptation budget is insufficient.</Prose>

      <H2>9. Choose a design by its failure case</H2>
      <Prose>Begin with users, texts, a resource budget and unacceptable failures. Measure existing compatible artifacts first. For a new model, vary mixture and V while holding preprocessing fixed; change boundary policy in a separate experiment. Inspect domains and languages that lose as carefully as those that improve.</Prose>
      <LessonTable caption="Let a diagnostic choose the intervention" headers={["Observation", "Possible cause", "Next experiment"]} rows={[
        ["Many fallback bytes", "Training misses deployment characters", "Add representative text; inspect coverage before only increasing V."],
        ["Long outputs despite ample V", "Boundaries block useful pieces", "Inspect pretokenized units; change one boundary rule."],
        ["Short training text, weak holdout compression", "Boilerplate or domain mismatch", "Deduplicate; separate domain/document splits."],
        ["Better compression, worse task score", "Changed targets or insufficient row exposure", "Train matched models and inspect rare-token use."],
        ["Failure after tokenizer swap", "ID/row/template mismatch", "Restore the paired artifact; test explicit migration separately."],
      ]} />
      <Prose>A scientific assistant may mix multilingual prose and gene names. Shorter prose can coexist with heavily split identifiers. Preserve identifier spelling and case, measure the domain, and evaluate tasks that distinguish similar names. Compact representation helps only if the trained model can still distinguish and use it. Average token count is an objective to balance, not the definition of success.</Prose>
      <Prose>Return to the support assistant with retrieval: a context window must also hold its template and user question. Here is a constructed 4,000-position input budget, with 500 positions reserved for those fields:</Prose>
      <VocabularyRetrievalFigure />
      <Prose>The source capacity is <Code>4,000−500=3,500</Code> positions. A 3,200-token source fits with 300 positions left; a matching translated source measured at 3,800 tokens exceeds capacity by 300. These are constructed counts that illustrate the decision, not a language-wide premium. Measure complete deployed chunks and whether the answer-bearing sentence survives. Boundary-aware chunking or a larger allocation can solve this failure while retaining the model's compatible tokenizer.</Prose>

      <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>10. Practice: defend the design, not just the average</H2>
        <div className="lesson-exercise"><H3>A. Reweight a different mixture</H3><Prose>Two collections have masses 9 and 1. Calculate shares for α=1, .5 and 0, then allocate 12 draws. What changes if the second mass is zero?</Prose><details><summary>Hint</summary><p>Normalize square roots; apply floors and largest remainders.</p></details><details><summary>Worked solution</summary><p>Shares: .9/.1, .75/.25, .5/.5. Draws: 11/1, 9/3, 6/6. Quotas 10.8/1.2 leave one draw for the larger remainder. A zero-mass collection remains absent, including at α=0.</p></details></div>
        <div className="lesson-exercise"><H3>B. Repair a multilingual claim</H3><Prose>Matching English and Chinese translations produce 20 and 16 tokens. They have 10 and one whitespace units. A report claims Chinese is eight times more expensive. Diagnose it.</Prose><details><summary>Hint</summary><p>Preserve translated content instead of incompatible word-space conventions.</p></details><details><summary>Worked solution</summary><p>20/10=2 and 16/1=16 are tokens per whitespace unit; their ratio of 8 mixes unit meanings. The translated-text token ratio is 16/20=.8. Under the same text-token price this pair uses 80% of the charge. Inspect more pairs and variation before generalizing.</p></details></div>
        <div className="lesson-exercise"><H3>C. Separate memory from operations</H3><Prose>A vocabulary has 64,000 IDs, width 2,048 and two-byte weights. Calculate tied/untied table MiB. A candidate doubles V and reduces text from 1,000 to 750 tokens: find head-MAC and full-attention-pair ratios.</Prose><details><summary>Hint</summary><p>MiB uses 2²⁰ bytes; compare N×V at fixed width and N².</p></details><details><summary>Worked solution</summary><p>One table: 131,072,000 parameters, 262,144,000 bytes = 250 MiB; untied tables use 500 MiB. Head ratio = .75×2 = 1.5; pair ratio = .75² = .5625. One component grows 50% while another shrinks 43.75%; whole-job speed needs measurement.</p></details></div>
        <div className="lesson-exercise"><H3>D. Preserve row identity</H3><Prose>Old IDs red→0, blue→1 have rows [1,0] and [0,1]. A new tokenizer uses red→1, blue→0, violet→2. A programmer simply appends the mean row. Diagnose and repair it.</Prose><details><summary>Hint</summary><p>Trace red's new ID into physical storage.</p></details><details><summary>Worked solution</summary><p>Red retrieves blue's old row. Preserve old IDs and append violet, or deliberately permute input/output row ownership. Row [.5,.5] is only an initialization. Train and regress old/new behavior; expanded softmax and changed segmentation affect probabilities.</p></details></div>
        <div className="lesson-exercise"><H3>E. Run a changed experiment</H3><Prose>Add α=0 at V=2,000, keeping split and text rules fixed. Report realized repeats, actual V, token/fallback counts and round trips. Explain one changed or unchanged result from actual pieces. What evidence remains before deployment?</Prose><details><summary>Hint</summary><p>Thirty equal-share passes give 10 per language. Inspect a held-out sentence rather than guessing a language effect.</p></details><details><summary>Solution criteria</summary><p>Repeats must be 10:10:10 with unchanged underlying collections. Measure token totals; trace a changed piece or a retained fallback sequence. Further evidence includes task performance after compatible training, production prompts, domain coverage, memory and latency. Tokenizer fitting alone completes only the intrinsic experiment.</p></details></div>
      </section>
      <Sources alternatives={<ul>
        <li><a href="https://huggingface.co/learn/llm-course/en/chapter2/4">Hugging Face LLM Course: tokenizers</a> — begin here if the distinction between text pieces, dictionary entries and token IDs still feels unclear. The illustrated article precedes the training API.</li>
        <li><a href="https://jalammar.github.io/illustrated-word2vec/">Jay Alammar: The Illustrated Word2vec</a> — a visual introduction to vectors and embedding lookup; useful before section 4's matrix accounting. The training objective differs from the language-model experiment here.</li>
        <li><a href="https://huggingface.co/learn/llm-course/en/chapter6/2">Hugging Face LLM Course: training a new tokenizer</a> — worked article and embedded video; corpus iterators after section 6. Article/code reviewed; video not independently watched.</li>
        <li><a href="https://aclanthology.org/2021.acl-long.243/">Rust et al.: How Good is Your Tokenizer?</a> — research reading that separates tokenizer properties and downstream controlled evaluation.</li>
        <li><a href="https://github.com/google/sentencepiece/blob/master/python/README.md">SentencePiece Python examples</a> — practical training and serialization. Match options to your version; recorded run used 0.2.2.</li>
      </ul>}>
        <li><a href="https://arxiv.org/abs/2305.15425">Petrov et al., Language Model Tokenizers Introduce Unfairness Between Languages</a> — parallel-content disparities and access implications, 2023.</li>
        <li><a href="https://aclanthology.org/2020.acl-main.747/">Conneau et al., Unsupervised Cross-lingual Representation Learning at Scale</a> — sections3/5 distinguish sampling, capacity and vocabulary effects,2020.</li>
        <li><a href="https://github.com/google/sentencepiece/blob/master/doc/options.md">SentencePiece options</a> and <a href="https://github.com/google/sentencepiece/blob/master/doc/normalization.md">normalization</a> — coverage, fallback, limits and transformations.</li>
        <li><a href="https://huggingface.co/docs/transformers/main/en/main_classes/model#transformers.PreTrainedModel.resize_token_embeddings">Transformers vocabulary resizing</a> — appended rows, initialization and tying.</li>
        <li><a href="https://github.com/facebookresearch/flores/tree/main/flores200">FLORES-200</a> — translated-unit identity and source licensing; sample provenance supplies exact retained data.</li>
      </Sources>
      <section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H2>11. Readiness and the next input problem</H2><Prose>Move on when you can explain a token-count difference without confusing words, bytes and meaning; reproduce weighting; compare matrix/sequence costs; and preserve ID-to-row identity in a migration. Keep the tokenizer artifact and its selection evidence alongside the model.</Prose><Prose><a href="/learn/path/full-curriculum/multimodal-tokenization-visual-audio-video?module=large-language-models">Multimodal Tokenization</a> extends the question to images and audio: what is a unit, what information does discretization preserve, and how does it connect to model computation? Carry forward the habit of exposing those contracts before choosing a convenient ID sequence.</Prose></section>
    </div>
  ),
};

