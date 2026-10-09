import { Prose, H2, H3, Code, CodeBlock } from '../../components/content';
import { MathBlock as SharedMathBlock } from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { LessonIntro, LessonTable, Sources } from '../../components/lesson-labs/LessonElements.jsx';
import '../../components/lesson-labs/lesson-flow.css';
import { ContextFigure, CorruptionLab, MaskRateLab, AttentionMaskLab, EmbeddingFigure, EncoderFigure, VocabularyHeadFigure, SelectedLossLab, GradientFigure, DynamicMaskLab, TrainingFigure, TransferFigure, JointFigure, PseudoLikelihoodFigure, ObjectiveFigure } from '../../components/lesson-labs/MaskedLanguageFlow.jsx';

const route = '/learn/path/full-curriculum/';
const programs = '/learn-code/masked-language-modeling/';
const MathBlock = ({ children }) => <div className="mlm-math" tabIndex={0} role="region" aria-label="Mathematical relationship"><SharedMathBlock>{children}</SharedMathBlock></div>;
const Legacy = ({ id }) => <span id={id} aria-hidden="true" />;
function Exercise({ title, children, hint, solution }) {
  return <article className="lesson-exercise" data-lesson-exercise=""><H3>{title}</H3>{children}
    <details><summary>Hint</summary><Prose>{hint}</Prose></details>
    <details><summary>Solution</summary><Prose>{solution}</Prose></details>
  </article>;
}

const maskedLanguageModeling = {
  title: 'Masked Language Modeling (BERT-style)',
  readTime: '~55 min read + 60 min experiments',
  content: () => <div className="lesson-flow mlm-flow">
    <LessonIntro prerequisites={<><a href={`${route}byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram?module=large-language-models`}>Subword tokenization</a> supplies token IDs and embedding lookup; <a href={`${route}causal-language-modeling-next-token-prediction?module=large-language-models`}>Causal language modeling</a> supplies vocabulary probabilities, cross-entropy and shifted targets. We recover these contracts here. The programs use Python arrays, PyTorch differentiation and AdamW, and implement the new corruption, attention and selected loss explicitly.</>} exampleKind="Python">Learn to reconstruct selected original tokens using evidence on both sides, then reuse the resulting contextual representations. Separate what changes in the input, what attention may read, and which outputs contribute to the loss.</LessonIntro>
    <Prose opening="route"><strong>First pass:</strong> follow sections 1–7 in order, changing the corruption and loss examples as you read. Run the three supplied programs with the accompanying text. Return to the visible gradient derivation, pseudo-likelihood and objective comparisons for a deeper pass, then try the independent practice.</Prose>
    <Prose opening="exploration">The drawings show their current result immediately. White outlines identify the traced position; labelled colours preserve token correspondence. The browser investigates small exact examples. Python runs the actual training experiment; its plots show a saved run.</Prose>

    <Legacy id="1-start-with-the-problem" /><Legacy id="1-why-it-exists" />
    <H2>1. Read the evidence on both sides</H2>
    <Prose>Suppose a search system receives “the bank was flooded.” A useful representation of <Code>bank</Code> should respond to <Code>flooded</Code>. Change the suffix to “was closed,” and the evidence changes. How can a model learn to use both sides without a human labelling the meaning of every word?</Prose>
    <Prose>Remove the word: “the <Code>[MASK]</Code> was flooded.” The original text supplies the answer. Follow the information that can reach the missing position.</Prose>
    <ContextFigure />
    <Prose>A bidirectional encoder lets that position read the visible words before and after it. Its output at each position is a vector: a row of contextual features. A vocabulary head turns the vector at the missing position into a distribution over possible original IDs. Context does not require <Code>bank</Code> to receive probability one: <Code>road</Code> could also fit. Training rewards the observed original token rather than pretending every blank has only one possible completion.</Prose>
    <Prose>In a causal decoder, the hidden state at an input position can read that position and earlier ones; it cannot later revise that same state using a suffix. With the usual one-position target shift, the output at <Code>the</Code> predicts the next token. Here, the output at a selected position reconstructs the token originally at that same position.</Prose>
    <Prose>Why hide anything? If every original token stayed visible and every output were rewarded for returning that token, the network could learn a copying shortcut through its embedding and residual path. Corrupting selected inputs creates a reason to consult context. This reconstruction task is <strong>masked language modeling</strong> (MLM). BERT combined it with a deep bidirectional Transformer encoder; MLM is an objective, not a particular network size.</Prose>

    <Legacy id="2-build-the-intuition" /><Legacy id="2-core-intuition" />
    <H2>2. Select targets before corrupting inputs</H2>
    <Prose>Keep the original sequence because it supplies labels. Make a separate input copy, choose target positions, and change that copy. Choose one ordinary position and follow it through the rows. One target makes this hand trace readable; it is not a sample claimed to realize exactly 15% selection.</Prose>
    <CorruptionLab />
    <Prose>The original <Code>bank</Code> ID remains the label whether the input becomes <Code>[MASK]</Code>, becomes a random <Code>road</Code>, or stays <Code>bank</Code>. At unselected positions the label is <Code>-100</Code>, the convention for ignoring that output in the loss. It is not a vocabulary ID and is never embedded. Colours and position numbers trace original occurrences; replacements retain their literal identities. White selection outlines are separate from those colours.</Prose>
    <Prose>BERT's historical recipe selects about 15% of tokens. Among selected positions, 80% take the mask branch, 10% the random-token branch and 10% the unchanged branch. “Selected,” “changed” and “contains a literal mask” are different properties. Switch the branch and notice that the target remains unchanged.</Prose>
    <Prose>For 100 eligible ordinary positions, separate the two probability stages. The coloured areas show expected counts, so fractional values are legitimate.</Prose>
    <MaskRateLab />
    <MathBlock>{String.raw`\begin{aligned}P(\text{mask branch})&=0.15\times 0.80=0.12\\P(\text{random branch})&=0.15\times 0.10=0.015\\P(\text{keep branch})&=0.15\times 0.10=0.015\end{aligned}`}</MathBlock>
    <Prose>The expectation is 15 targets: 12 mask-branch positions, 1.5 random-branch positions and 1.5 keep-branch positions, alongside 85 unselected positions. A random vocabulary draw can equal the original ID or a special ID. Thus visibly changed-token counts need not equal branch counts. Audit recorded branches, not just the symbols that happen to appear.</Prose>
    <Prose><Code>[CLS]</Code> and <Code>[SEP]</Code> mark sequence structure; <Code>[PAD]</Code> fills unused batch space. Exclude structural and padding positions from selection. Our programs also exclude <Code>[UNK]</Code>, since predicting a collapsed unknown symbol would conceal which unseen word was lost. State this eligible denominator whenever reporting a rate.</Prose>
    <H3>A recipe is not a unique sampling algorithm</H3>
    <Prose>Our code and the dynamic collator independently select eligible positions with probability 0.15. A small batch need not realize exactly 15% or contain any targets. With <Code>E</Code> eligible positions, no target is selected with probability <Code>0.85ᴱ</Code>. Original BERT preprocessing instead shuffled candidates and used a rounded, capped target budget. It was not the identical Bernoulli procedure.</Prose>
    <Prose>The random and keep branches were introduced to reduce the mismatch between masked pretraining and ordinary downstream inputs. They do not eliminate it, and an unchanged selected position still permits a copying shortcut there. Judge the whole recipe; neither 15% nor 80/10/10 is a universal optimum. Section 9 returns to the experimental evidence.</Prose>

    <Legacy id="3-make-the-idea-precise" /><Legacy id="3-math-foundation" />
    <H2>3. Distinguish three different masks</H2>
    <Prose>Changing a symbol does not remove its position from the network. A literal <Code>[MASK]</Code> has an embedding and remains available to attention. Compare which input columns each query row may read. These cells show permission, not learned attention strength.</Prose>
    <AttentionMaskLab />
    <Prose>A row is the query position; a column is a key/value position it may read. Bidirectional attention permits every nonpadding column. The causal alternative permits columns up to and including the query's own position. The final valid query is a revealing null case: both patterns permit the same columns there. Earlier rows expose the difference.</Prose>
    <LessonTable caption="Three masks answer different questions" headers={['Object', 'Question', 'Effect']} rows={[
      ['Corruption and selection', 'Which original positions become targets, and how is their input copy changed?', 'bank stays the target for mask, random and keep.'],
      ['Attention mask', 'Which keys may a query read?', 'PAD columns are excluded; MASK remains readable.'],
      ['Loss mask / labels', 'Which output rows are scored?', 'Only selected labels differ from −100.'],
    ]} />
    <Prose>The usual Transformers <Code>attention_mask</Code> is 1 at valid input positions and 0 at padding, independently of <Code>labels != -100</Code>. Preserve it from the original padding layout: if corruption randomly draws the PAD ID at a real position, recomputing padding from corrupted IDs would accidentally delete that position.</Prose>
    <Prose>Excluding padding keys is sufficient for valid queries in our small encoder. It can still compute unused padded query outputs; exclude those from supervision and pooling. Packing independent documents requires an additional boundary policy if they must not read each other. A padding mask alone does not isolate documents.</Prose>

    <Legacy id="4-from-scratch-implementation" />
    <H2>4. Follow a position through the encoder</H2>
    <Prose>The inputs are IDs; the network operates on vectors. At each position, add a token embedding, a position embedding and a segment embedding. All three have width <Code>d</Code>, so addition preserves the width rather than concatenating three vectors.</Prose>
    <EmbeddingFigure />
    <MathBlock>{String.raw`h_i^{(0)}=\operatorname{LayerNorm}\!\left(E[\tilde x_i]+P[i]+S[s_i]\right)`}</MathBlock>
    <Prose><Code>E</Code> has vocabulary rows, <Code>P</Code> has supported-position rows and <Code>S</Code> has two segment rows. The segment index <Code>sᵢ</Code> is 0 or 1; a single-segment example uses 0 throughout. Segment B is not future context or an attention prohibition. BERT's position table is learned and finite, so a checkpoint's supported length matters.</Prose>
    <Prose>The resulting <Code>T × d</Code> grid has one feature row per input position. Inside a block, attention mixes positions and a feedforward network transforms each row's feature channels. Follow the mixing and the two residual paths.</Prose>
    <EncoderFigure />
    <Prose>Learned projections produce queries <Code>Q</Code>, keys <Code>K</Code> and values <Code>V</Code>. Each query/key dot product is a compatibility score. Divide by the square root of the head width <Code>dₕ</Code>, add 0 at permitted entries and negative infinity at forbidden entries, then apply softmax across each row. Its weights sum to one over permitted keys.</Prose>
    <MathBlock>{String.raw`\begin{aligned}A&=\operatorname{softmax}_{\rm row}\left(QK^\top/\sqrt{d_h}+B\right)\\U&=AV\end{aligned}`}</MathBlock>
    <Prose><Code>B</Code> denotes the additive attention mask here. Multiplying by the value grid forms a weighted mixture at each query. Multiple heads use different projections, concatenate their outputs and project back to width <Code>d</Code>. Add the original hidden grid through a residual path and normalize. The feedforward sublayer expands each row to <Code>4 d</Code>, applies GELU, reduces it to <Code>d</Code>, then adds and normalizes a second residual. Our program follows this post-normalization structure, with dropout omitted for the small deterministic experiment.</Prose>
    <Prose>After the blocks, gather the selected hidden rows before vocabulary scoring when training. The prediction head transforms each selected row and compares it with all vocabulary embedding rows.</Prose>
    <VocabularyHeadFigure />
    <Prose>The head uses a linear transform, GELU and normalization, then the transpose of the input embedding table plus a vocabulary bias. Sharing the table is weight tying. Input lookup chooses one row; output decoding compares a transformed feature vector with every row. Scores become probabilities only after softmax. The small drawing supplies illustrative values for anatomy; measured predictions appear later.</Prose>
    <Prose>With <Code>m</Code> selected positions, vocabulary scoring costs approximately <Code>O(mdV)</Code>, versus <Code>O(TdV)</Code> if all positions are scored. The encoder still processes context. Dense attention forms <Code>T × T</Code> score arrays per head. A naive causal implementation also allocates a full square before masking; triangular permissions alone do not halve its memory. Specialized kernels can exploit structure and avoid materializing that array. There is no universal twofold runtime or memory rule.</Prose>

    <H2>5. Score the original IDs at selected positions</H2>
    <Prose>Each selected row is a vocabulary classification problem. Put more probability on the original ID and its loss falls. Two selected targets receive probabilities 0.5 and 0.25 below. Change either probability to see its negative-log contribution.</Prose>
    <SelectedLossLab />
    <Prose>Natural logarithms give <Code>−ln(0.5)=0.693147</Code> and <Code>−ln(0.25)=1.386294</Code> nats. Sum to <Code>2.079442</Code> and divide by the two scored positions: <Code>1.039721</Code> nats per target. Three ignored outputs do not change this mean. Dividing by all five positions instead gives <Code>0.415888</Code>, a different, diluted quantity.</Prose>
    <MathBlock>{String.raw`\mathcal L_M=-\frac{1}{|M|}\sum_{i\in M}\log p_\theta(x_i\mid\tilde x),\qquad |M|>0`}</MathBlock>
    <Prose><Code>M</Code> is the selected set; <Code>xᵢ</Code> the original ID; <Code>x̃</Code> the entire corrupted input; and <Code>θ</Code> the learned parameters. Conditioning includes visible tokens, masks and random or unchanged selected inputs. Our batch mean sums all selected losses and divides by their total count. Averaging sequence means with equal sequence weight is a different reduction.</Prose>
    <Prose>No selected targets means the selected mean is undefined. The lab says so. The numeric helper returns zero only as a no-op sentinel alongside count 0; the trainer skips the optimizer update and evaluation reports null. Skipping the update matters because momentum or weight decay can otherwise change weights even with zero current gradients.</Prose>
    <H3>Deeper: gradients also train the context</H3>
    <Prose>For one logit row <Code>z</Code>, rewrite its loss as <Code>log(sum(exp(z))) − z[target]</Code>. Differentiating the first term gives softmax probability; differentiating the second subtracts 1 only at the target. A selected-position mean divides each contribution by the selected count.</Prose>
    <GradientFigure />
    <MathBlock>{String.raw`\frac{\partial\mathcal L_M}{\partial z_{i, v}}=\begin{cases}(p_{i, v}-\mathbf 1[v=x_i])/|M|,&i\in M\\0,&i\notin M.\end{cases}`}</MathBlock>
    <Prose>The first target above has gradient <Code>(0.5−1)/2=−0.25</Code>. Subtracting it in gradient descent increases the target logit. An ignored output has zero direct logit gradient, but a selected output can depend on an unselected context vector through attention. The loss can therefore train parameters and representations used at context positions. “15% targets” is not “only 15% gets gradients,” and does not prove sixfold sample inefficiency.</Prose>
    <Prose>This complete program subtracts each selected row's maximum before exponentiating; the common factor cancels in softmax and avoids overflow. It derives the logit gradient, compares it with PyTorch on identical logits, and performs one SGD step. For the two-target example, learning rate 0.1 changes loss from <Code>1.03972077</Code> to <Code>1.01257023</Code>; the ignored row's gradient is zero. The same file supplies corruption and a whole-word grouping variation.</Prose>
    <RemoteCodeBlock source={`${programs}corruption_loss.py`} filename="corruption_loss.py" title="Corruption, selected loss and a matched gradient check" />
    <Prose><Code>corrupt</Code> never mutates the original array and returns branch labels for auditing. <Code>selected_cross_entropy</Code> gathers active rows before logsumexp; its full gradient retains the input shape for comparison. The ordinary tool route is <Code>cross_entropy</Code> on selected rows, or <Code>ignore_index=-100</Code> with the same reduction and an explicit empty-batch policy.</Prose>

    <Legacy id="6-visual-walkthrough" />
    <H2>6. Vary training masks and freeze evaluation masks</H2>
    <Prose>A fixed corruption teaches one reconstruction view. A dynamic collator resamples positions and branches when the sentence is presented again; original IDs stay fixed. Compare successive visits, then inspect the separate evaluation row that remains unchanged.</Prose>
    <DynamicMaskLab />
    <Prose>RoBERTa used dynamic masking on each presentation. Original BERT precomputed multiple corrupted copies, so “one permanent mask per sentence” would omit its duplication. For evaluation, draw corruption once with an independent seed, disable dropout with <Code>eval()</Code>, and compute without gradients. Then a score change reflects changed weights rather than a newly sampled question.</Prose>
    <Prose>Across batches, aggregate summed negative log probabilities divided by total selected targets. A batch with one target should not automatically have the same weight as a batch with fifty. Separate training and evaluation random-number streams so changing evaluation frequency does not change the next training mask.</Prose>
    <Prose>Now use real text: the offline <a href={`${programs}alice_excerpt.txt`} download>Alice excerpt</a> contains chapters I–III of Lewis Carroll's 1865 novel, with <a href={`${programs}provenance.md`} download>provenance and preprocessing</a>. This is literature, not an NLP benchmark. Our question is whether a complete small objective reduces reconstruction loss on a later portion of the same work.</Prose>
    <Prose>The program extracts 6,118 lowercase letter-sequence tokens and splits first: 4,894 training tokens and 1,224 held-out tokens. It learns a 1,012-ID vocabulary from training only, then packs each part separately into at most 24 words plus CLS/SEP, giving 204 training and 51 held-out chunks. The 162 held-out words absent from the vocabulary become UNK and are excluded as targets, with their count reported. This whole-word diagnostic tokenizer is not released BERT's WordPiece tokenizer.</Prose>
    <Prose>The encoder has width 48, four heads and two blocks. Its attention exposes Q/K/V, masked scores and value mixing. PyTorch supplies tensor operations, differentiation, LayerNorm, GELU and AdamW. It preserves original padding and gathers selected rows before the tied head. The program also includes leave-one-out scoring and task-head shape examples.</Prose>
    <RemoteCodeBlock source={`${programs}tiny_mlm.py`} filename="tiny_mlm.py" title="Complete bidirectional encoder and offline real-text training" />
    <Prose>Save the three Python files and text together; the shared file index lists them as code becomes visible. Install NumPy/PyTorch and Transformers for the library route. The scratch CPU run used PyTorch 2.14.0, NumPy 2.3.5, seed 17, AdamW learning rate 0.002, batch 16 and 240 updates. These are measured small-experiment settings, not a large-model recipe.</Prose>
    <CodeBlock language="shell" filename="run_mlm_examples.sh">{`python corruption_loss.py
python tiny_mlm.py --steps 240 --output experiment.json
python library_mlm.py --steps 120 --output library-experiment.json`}</CodeBlock>

    <Legacy id="5-production-implementation" />
    <H2>7. Read the measurement and use the library</H2>
    <Prose>A falling training loss is a starting diagnostic. Compare identical fixed held-out targets and a cheap reference that ignores context. Here the reference uses add-one-smoothed training unigram counts. Loss and accuracy have separate plots and units.</Prose>
    <TrainingFigure />
    <Prose>The recorded scratch run changes held-out loss from <Code>6.909748</Code> to <Code>5.368065</Code> nats on 166 selected known-word targets. The unigram loss on those same targets is <Code>5.402970</Code>. Improvement over initialization is clear, but the final advantage over this simple reference is small. Held-out loss reaches <Code>5.297545</Code> at step 160 then rises; it need not be monotone. Final top-1 accuracy is <Code>6/166≈3.61%</Code>.</Prose>
    <Prose>The first held-out sample hides the actual word <Code>either</Code>. At final weights the top five candidates are <Code>she</Code>, <Code>i</Code>, <Code>of</Code>, <Code>was</Code> and <Code>a</Code>, with top probability about 0.0278. This failure distinguishes correct implementation from useful language ability. Training and held-out portions share characters/style, and unseen words are excluded from targets; the figures are a limited within-work diagnostic.</Prose>
    <Prose>For the ordinary route, delegate the encoder/head to <Code>BertForMaskedLM</Code> and corruption to <Code>DataCollatorForLanguageModeling</Code>. This program uses the same data preparation with explicit ID, padding and special-token masks. It constructs a small random <Code>BertConfig</Code> model, trains it and compares returned loss with selected-row cross-entropy on the actual logits.</Prose>
    <RemoteCodeBlock source={`${programs}library_mlm.py`} filename="library_mlm.py" title="Offline Transformers BERT and dynamic collator" />
    <Prose><Code>input_ids</Code> is the corrupted grid; <Code>attention_mask</Code> retains original valid positions; <Code>labels</Code> holds original IDs or −100. The output logits have shape <Code>[batch, positions, vocabulary]</Code>. The local tokenizer supplies vocabulary/special-token metadata; the program already supplies whole-word IDs. This maintained model is the library route, not the scratch implementation.</Prose>
    <Prose>A configuration initializes random weights. A released checkpoint instead uses its matching model and tokenizer via <Code>from_pretrained</Code>, with vocabulary and positional contracts preserved. Fill-mask inference intentionally contains a mask token and reads its vocabulary row. Classification/tagging normally uses uncorrupted task input and its own supervised head. The offline program downloads no weights and does not measure a released checkpoint's quality.</Prose>
    <Prose>The executed Transformers 5.17.0 library run takes 120 updates. On its own fixed 145-target evaluation sample, loss changes from 6.938476 to 5.697192 nats; its returned loss agrees with explicitly selected cross-entropy within 0.000001. Input and output embeddings share the same weight tensor. This checks the ordinary API on real inputs, including its target reduction.</Prose>
    <Prose>Equal widths do not make scratch and library training matched experiments: initialization, normalization and random streams can differ. The exact bridges compare identical logits/labels for loss/gradients and identical Q/K/V/padding for attention. Unmatched final losses are diagnostics, not an architecture ranking.</Prose>

    <Legacy id="8-what-scales-and-what-doesn-t" />
    <H2>8. Reuse representations and interpret scores</H2>
    <Prose>Reconstruction trains the encoder to combine context. A downstream task can use its hidden grid while replacing the vocabulary head. The desired output determines which rows the new head reads.</Prose>
    <TransferFigure />
    <Prose>A tagging head classifies each token row. A sequence head reads the CLS row or a deliberate pooling of valid rows. Extractive QA uses start/end score columns over a passage. The program checks shapes <Code>[1, 26, 3]</Code>, <Code>[1, 2]</Code> and <Code>[1, 26, 2]</Code>; these random heads have not been trained to solve those tasks.</Prose>
    <Prose>Original BERT also used next sentence prediction: a binary head on CLS distinguished a true segment continuation from a sampled noncontinuation, adding that loss to MLM. NSP is a separate historical objective. RoBERTa examined input construction and trained successfully without it. Neither recipe makes raw CLS or arbitrary mean pooling a guaranteed retrieval embedding. Task-specific training and evaluation still matter; a shared multilingual vocabulary likewise does not guarantee aligned meanings.</Prose>
    <H3>Deeper: two blanks are not a causal joint</H3>
    <Prose>Suppose two colour slots must match: half the examples are red/red and half blue/blue. Each slot alone is half red, half blue. Multiplying those marginals loses the matching constraint.</Prose>
    <JointFigure />
    <Prose>The product assigns one quarter to all four pairs, including red/blue and blue/red. The desired joint assigns one half to each matching pair and zero to mixed pairs. BERT-style MLM scores vocabulary rows conditioned on the same corrupted input. The shared encoder can relate positions, but independently sampling its rows does not make one sampled value condition on the other. Its conditionals are not automatically guaranteed to correspond to one normalized joint distribution over sequences.</Prose>
    <Prose>A causal model explicitly multiplies successive conditionals given earlier values. An iterative fill/remask sampler or a masked generative model requires an additional sampling/training argument. The 2025 LLaDA work studies a different masked diffusion objective and reverse denoising process. That is a reason to state BERT's particular limitation precisely, not to claim that masked models cannot generate.</Prose>
    <H3>Deeper: leave-one-out sentence scoring</H3>
    <Prose>An MLM can compare supplied sentences. Mask one eligible position at a time, leaving other original tokens visible; read its original-token probability, then sum log probabilities. Each row below is a separate input.</Prose>
    <PseudoLikelihoodFigure />
    <MathBlock>{String.raw`\operatorname{PLL}(x)=\sum_{i\in E}\log p_\theta\!\left(x_i\mid x_{\setminus i},[\mathrm{MASK}]_i\right)`}</MathBlock>
    <Prose><Code>E</Code> is the eligible set. This is pseudo-log-likelihood (PLL), not causal chain-rule log probability. <Code>exp(−PLL/|E|)</Code> is pseudo-perplexity. It also differs from exponentiating randomly corrupted MLM loss because the conditioning differs. Compare under a declared tokenizer/position/length-normalization policy; these are not calibrated sentence probabilities.</Prose>
    <Prose>The supplied <Code>pseudo_log_likelihood</Code> batches one input copy per eligible position. It still evaluates that many sequences, and the all-copies ID array has quadratic storage in length. Chunk copies into smaller batches for long inputs. The saved example has 19 eligible positions, PLL <Code>−101.0411</Code> and pseudo-perplexity <Code>203.9662</Code>. This does not rescue its incorrect cloze answer or establish downstream quality.</Prose>

    <Legacy id="7-decision-matrix" /><Legacy id="9-failure-modes-and-gotchas" />
    <H2>9. Change the objective deliberately</H2>
    <Prose>Separating corrupted inputs from desired targets lets us vary both. Start with one word split into <Code>play</Code> and <Code>##ing</Code>.</Prose>
    <ObjectiveFigure />
    <Prose>Masking one piece can leave an easy clue in its neighbour. Whole-word masking selects a word group and supervises all its original pieces. The helper independently samples word groups; a fixed token-budget sampler is different and longer groups change realized piece counts. Use the tokenizer's word alignment rather than assuming every tokenizer uses <Code>##</Code>.</Prose>
    <Prose>T5's span corruption replaces a contiguous region with a sentinel and trains an autoregressive decoder to emit its missing tokens in order. Even length-one spans do not make its decoder loss identical to BERT's independent per-position head. ELECTRA uses a generator's replacements and trains a discriminator to detect tokens that differ from originals. A sampled ID equal to the original counts as original for that detection label. Binary detection is a different target from vocabulary reconstruction.</Prose>
    <Prose>More masking supplies more targets while removing more context. Those effects compete; target counts alone do not determine compute efficiency. Wettig and colleagues found 40% could outperform 15% for BERT-large-sized models under their evaluated recipe, and separately examined corruption choices. That challenges the historical number as a universal rule, without establishing 40% for every model.</Prose>
    <LessonTable caption="Choose by output and validation question" headers={['Need', 'Useful route', 'Check']} rows={[
      ['Labels for an already available input', 'Encoder plus a task-specific head; MLM is one pretraining option.', 'Task split, token alignment/pooling and held-out performance.'],
      ['Left-to-right continuation', 'Causal objective and autoregressive decoding.', 'Target shift, causal access and generation evaluation.'],
      ['Ordered missing-span reconstruction', 'Encoder-decoder or deliberately trained infilling system.', 'Sentinels, target order and decoder conditioning.'],
      ['Score supplied sentences', 'Declared MLM pseudo-likelihood procedure.', 'Tokenizer/length policy, cost and task validation.'],
    ]} />
    <Prose>For a suspicious run, inspect a literal batch first: labels came from original IDs; all selected branches retain targets; specials are excluded; attention retains original padding; and the denominator counts scored targets. A zero-target batch is missing evidence. To diagnose causal leakage, change a later input and test an earlier output: bidirectional attention permits that influence; causal attention forbids it. Use a fixture with a nonzero contribution, since permission alone does not guarantee a changed value.</Prose>
    <Prose>Finally, repeated passages can lower apparent loss while contaminating evaluation. Objective correctness cannot make duplicated or leaked data trustworthy. This motivates the next syllabus topic: corpus curation and deduplication.</Prose>

    <Legacy id="11-self-check-exercises" />
    <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>10. Independent practice</H2>
      <Exercise title="1. Audit expected counts" hint="Apply selection before conditional branch probabilities; distinguish eligible from physical positions." solution="For 200 eligible positions: 30 expected targets, partitioned into 24 mask, 3 random and 3 keep; 170 eligible positions are unselected. There are also 12 ineligible positions. 30/212≈14.15%, which is compatible with a 15% eligible rate. Realized small-batch counts vary; branch identity cannot be inferred perfectly from replacement IDs.">
        <Prose>A padded batch has 212 positions, 12 special or padding. At 15% selection and 80/10/10 corruption, compute expected branch counts. Could a log reporting 14.15% selected be consistent?</Prose>
      </Exercise>
      <Exercise title="2. Repair an uneven reduction" hint="Recover summed losses before combining sequences." solution="Total loss is 1×0.4+3×1.2=4.0 over four targets, giving 1.0 nats per target. Averaging the two sequence means gives 0.8 and uses equal sequence weights instead. A zero-target sequence adds 0 to the sum and 0 to the count; its undefined mean must not become another zero-valued observation.">
        <Prose>A has one target with mean loss 0.4; B has three targets with mean 1.2. Compute the batch mean per target and explain the effect of counting a zero-target sequence as another zero mean.</Prose>
      </Exercise>
      <Exercise title="3. Diagnose corrupted labels" hint="Assignment can alias an array; a random PAD ID can occupy an originally valid position." solution="Preserve original, copy before corruption, and build labels from original at the selected set. Preserve the original padding mask. Otherwise labels can contain replacement IDs, and a valid position randomly replaced by PAD becomes hidden from attention. Selecting targets using input==MASK also loses random/keep branches.">
        <Prose>A developer writes <Code>corrupted=original</Code>, replaces IDs, then builds labels from <Code>original</Code> and attention from <Code>corrupted!=PAD</Code>. Identify both data-flow failures.</Prose>
      </Exercise>
      <Exercise title="4. Implement a changed gradient" hint="Subtract one from the target probability; this case has one scored row." solution="For [.2,.3,.5] with target 1, the gradient is [.2,−.7,.5]. SGD with rate .1 changes logits by [−.02,+.07,−.05]. Compare loss/gradient with autograd. Adding 1000 to every logit should preserve both within numerical tolerance. An additional ignored row has zero direct gradient and does not change the selected mean.">
        <Prose>Use probabilities <Code>[0.2, 0.3, 0.5]</Code>, target index 1. Derive the logit gradient and an SGD step of size 0.1, then implement the calculation and compare with cross-entropy. Add an ignored row and a constant logit shift.</Prose>
      </Exercise>
      <Exercise title="5. Change word groups" hint="Sample distinct nonnegative group IDs, then broadcast membership back to pieces." solution="For [−1, 0, 1, 1, 2,−1], choosing group 1 selects positions 2 and 3 together and excludes special positions. Test no/all groups and relabelled group IDs; then add a third piece to group 1. Independent piece sampling changes the event and permits partial words. Group sampling is not a fixed piece-budget algorithm.">
        <Prose>Implement whole-word selection for word IDs <Code>[−1, 0, 1, 1, 2,−1]</Code>, where −1 is special. Add a third piece to one word and explain the realized-token-count consequence.</Prose>
      </Exercise>
      <Exercise title="6. Test a two-blank claim" hint="List the four joint outcomes before multiplying marginals." solution="The desired distribution has .5 on red/red and blue/blue, 0 on mixed pairs. Marginals multiply to .25 on all four, putting half the mass on impossible pairs. Iterative sampling adds transitions; PLL sums different leave-one-out conditionals. Neither is automatically the causal chain-rule probability.">
        <Prose>A colleague says multiplying two MLM output rows recovers the probability of a two-word completion. Refute this with the matching-colour example, then explain what PLL scores.</Prose>
      </Exercise>
      <Exercise title="7. Compare mask rates honestly" hint="Different evaluation corruptions change the task difficulty, not only the model." solution="Hold split/tokenizer/architecture/compute policy fixed, report seeds, and vary training rate. Evaluate checkpoints on identical frozen input/target masks for paired reconstruction, plus the actual downstream task. Report excluded unknowns and target counts. Own-training-loss comparisons do not isolate model quality, and one Alice run cannot establish an optimal rate.">
        <Prose>Design a 15% versus 40% training-mask comparison. Specify split, evaluation masks, denominator, baseline and downstream test before recommending a rate.</Prose>
      </Exercise>
    </section>

    <Legacy id="10-primary-sources" />
    <Sources alternatives={<ul>
      <li><a href="https://d2l.ai/chapter_natural-language-processing-pretraining/bert.html">Dive into Deep Learning §15.8: BERT</a> — textbook explanation of contextual representations, summed embeddings and prediction heads. Read after section 4; surrounding chapters provide broader Transformer foundations.</li>
      <li><a href="https://huggingface.co/learn/llm-course/en/chapter7/3">Hugging Face course: fine-tuning a masked language model</a> — practical collators/training/evaluation. The written chapter was inspected; its pretrained route needs downloads. Retain section 8's metric distinctions when reading its “perplexity” terminology.</li>
    </ul>}>
      <li><a href="https://aclanthology.org/N19-1423/">Devlin et al., BERT (NAACL 2019)</a> — §3/figures 1–2 architecture/objectives; appendix C.2 corruption ablations.</li>
      <li><a href="https://github.com/google-research/bert/blob/master/create_pretraining_data.py">Original BERT preprocessing</a> — candidate filtering, rounded budget and random replacements.</li>
      <li><a href="https://arxiv.org/abs/1907.11692">Liu et al., RoBERTa (2019)</a> — §4.1 dynamic masking and §4.2 input/NSP comparisons.</li>
      <li><a href="https://huggingface.co/docs/transformers/main_classes/data_collator#transformers.DataCollatorForLanguageModeling">Transformers collator</a> and <a href="https://huggingface.co/docs/transformers/model_doc/bert">BERT API</a> — actual input/label/probability contracts for the 5.17.0 library snapshot.</li>
      <li><a href="https://aclanthology.org/2023.eacl-main.217/">Wettig et al., Should You Mask 15%? (EACL 2023)</a> — separates more targets from more corruption under stated training conditions.</li>
      <li><a href="https://aclanthology.org/2020.acl-main.240/">Salazar et al., Masked Language Model Scoring (ACL 2020)</a> — pseudo-likelihood and applications.</li>
      <li><a href="https://arxiv.org/abs/2003.10555">Clark et al., ELECTRA (2020)</a> and <a href="https://www.jmlr.org/papers/v21/20-074.html">Raffel et al., T5 (2020)</a> — detection versus ordered span-generation targets.</li>
      <li><a href="https://arxiv.org/abs/2502.09992">Nie et al., Large Language Diffusion Models (2025)</a> — a distinct masked generative objective and sampler.</li>
      <li><a href="https://www.gutenberg.org/ebooks/11">Project Gutenberg, Alice's Adventures in Wonderland</a> — the actual literary source; offline provenance records preprocessing and split.</li>
    </Sources>
    <section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H2>11. Readiness and next study</H2>
      <Prose>Trace all three branches to original labels, distinguish attention from loss masks, calculate a selected mean and its empty case, explain context gradients, and reproduce the scratch/library checks. Explain why the measured small run does not establish useful language ability and why PLL differs from a causal joint.</Prose>
      <Prose>Next, <a href={`${route}data-curation-deduplication-minhash-bloom-filters?module=large-language-models`}>Data Curation &amp; Deduplication</a> asks which text should supply those targets and how to prevent duplication from distorting training or leaking into evaluation. The objective is explicit; trustworthy data is the next problem.</Prose>
    </section>
  </div>,
};
export default maskedLanguageModeling;
