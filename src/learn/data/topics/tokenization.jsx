import { Prose, H2, H3, Code, CodeBlock } from "../../components/content";
import { MathBlock } from "../../components/content/Math.jsx";
import { LessonIntro, LessonTable, Sources } from "../../components/lesson-labs/LessonElements.jsx";
import RemoteCodeBlock from "../../components/content/RemoteCodeBlock.jsx";
import { BpeMergeLab, WordPieceLab, UnigramLatticeLab } from "../../components/lesson-labs/SubwordTokenizationLabs.jsx";
import { TextToIdsFigure, SubwordChoiceFigure, FirstMergeFigure, BpeMergeTreeFigure, BpeEncodingFigure, BpeIndexFigure, WordPieceWalkthroughFigure, WordPieceTrieFigure, UnigramPrefixFigure, UnigramCreditFigure, UnigramPruningFigure, UnigramSamplingFigure, SentencePieceSpaceFigure, RecordedTokenizerFigure, TokenizerPipelineFigure, TokenizerBudgetFigure, TokenizerMismatchFigure } from "../../components/lesson-labs/SubwordStructureFigures.jsx";

export default {
  title: "Byte-Pair Encoding (BPE), WordPiece, SentencePiece, Unigram",
  readTime: "~70 min read + 90 min code and practice",
  content: () => (
    <div className="neural-lesson neural-lesson-neutral subword-lesson lesson-flow">
      <LessonIntro prerequisites="No tokenization background is assumed. Follow the word pieces first; Python strings, dictionaries and loops are useful when you reach the code. Probability and the needed data structures are introduced beside their examples." exampleKind="Word pieces, branching diagrams and Python">
        How does a computer turn the text you type into something a language model
        can use? Start with one word, then build the rules that cut new words into
        reusable pieces. Read sections 1–5 for the mechanisms and try each lab
        when you reach it. The clearly marked implementation and mathematical
        branches deepen those same examples. Section 7 connects them to ordinary
        libraries; section 6 can wait until the two-path example feels familiar.
      </LessonIntro>

      <span id="1-why-it-exists" />
      <span id="1-start-with-the-problem" />
      <H2>1. Turn a new spelling into model input</H2>
      <TextToIdsFigure />
      <Prose>
        You type a word such as <Code>lowest</Code>. A language model works with
        numbers, so something must turn that spelling into a list of number
        labels. That small piece of software is a <strong>tokenizer</strong>.
        It cuts text into pieces and looks up a number for each piece. A piece
        might be a whole word, one letter, punctuation, or part of a word.
      </Prose>
      <Prose>
        A piece used this way is called a <strong>token</strong>. The stored
        dictionary of allowed pieces and their number labels is the
        <strong> vocabulary</strong>. Each number label is a <strong>token ID</strong>.
        In the picture, 7 is simply the dictionary entry for low. It does not
        mean low has a value of seven. Another tokenizer could give low a
        different number, or cut lowest differently.
      </Prose>
      <Prose>
        Turning text into those IDs is <strong>encoding</strong>. Looking up the
        pieces again and joining them is <strong>decoding</strong>. For our small
        example, encoding lowest gives [7, 12]; decoding [7, 12] gives low + est,
        hence lowest. Here the tokenizer has recorded the spelling. The language model
        learns how the resulting pieces are used in context.
      </Prose>
      <H3>Why not just give every word a number?</H3>
      <SubwordChoiceFigure />
      <Prose>
        We could store one entry for each whole word. But people keep producing
        names, typos and new word combinations. Suppose our fixed dictionary
        contains low and newest, but not lowest. What should we send to the model?
        An <Code>[UNK]</Code> token can say “unknown word,” but it throws away
        which spelling we wanted. Storing all individual letters avoids that
        problem for words made from those letters, at the cost of a longer list.
      </Prose>
      <Prose>
        <strong>Subword tokenization reuses pieces between words.</strong> The
        piece low could help spell low, lower and lowest. A useful dictionary
        can keep common words whole while spelling less common words with
        smaller pieces. Fewer pieces mean fewer positions for the model to
        process. This is why choosing the pieces matters, even before discussing
        neural-network details.
      </Prose>
      <Prose>
        We have chosen low and est by hand so far. The real question is:
        <em> how could a program discover useful pieces from ordinary text?</em>
        We will build three answers. BPE repeatedly joins common neighbors;
        WordPiece chooses the longest available piece when reading a word;
        Unigram compares complete ways to split it. SentencePiece later packages
        BPE or Unigram into a usable text-processing tool.
      </Prose>

      <span id="2-core-intuition" />
      <span id="2-build-the-intuition" />
      <H2>2. Learn pieces by joining common neighbors</H2>
      <Prose>
        Imagine repeatedly writing the same two neighboring letters. We could
        give that pair its own dictionary entry and use one piece in place of
        two. <strong>Byte-pair encoding (BPE)</strong> repeats this idea: start
        small, join a common pair, then look for the next common pair. The name
        comes from a byte-based compression method; this first teaching version
        starts with characters. We will handle actual bytes in the next lesson.
      </Prose>
      <Prose>
        A <strong>corpus</strong> is just the collection of text we learn from.
        Our small corpus contains <Code>low</Code> five times,
        <Code> lower</Code> twice, <Code>newest</Code> six times and
        <Code> widest</Code> three times. Store each distinct word once together
        with its count. The count says how much that row contributes, not how
        many different words contain a pair.
      </Prose>
      <Prose>
        Begin by putting a boundary between each letter. Add one special
        marker, <Code>{"</w>"}</Code>, meaning “the word stops here.” Treat it
        as one tile, not four typed characters. It lets us distinguish a piece
        at the end of a word from the same letters in the middle. The row for
        <Code> newest</Code> begins as
        {" "}<Code>{"n | e | w | e | s | t | </w>"}</Code>. The adjacent pair
        <Code> e + s</Code> is the one to trace in the next picture.
      </Prose>
      <FirstMergeFigure />
      <Prose>
        Follow the outlined e and s in newest and widest. Each word contains
        that pair once. Newest occurs six times, so its row contributes six
        occurrences; widest contributes three. Adding 6 + 3 gives nine: a
        <em> weighted count</em> includes every occurrence represented by a row.
        Replacing those neighbors removes nine boundaries, taking the weighted
        sequence length from 95 pieces to 86, including word-end markers.
      </Prose>
      <BpeMergeTreeFigure />
      <Prose>
        Read the tree from its letters toward the joined pieces. The first
        merge forms <Code>es</Code>. The next scan sees <Code>es + t</Code>,
        again nine times. A third merge joins <Code>est</Code> to the boundary marker.
        We have learned a word-final piece without a suffix dictionary. Common
        sequences sometimes line up with morphology, but this rule optimizes
        its count criterion, not linguistic correctness.
      </Prose>
      <Prose>
        The rule is <strong>count neighbors → join the winning pair → count
        again</strong>. The new joined piece participates in the next round.
        Each round adds a piece to the dictionary while shortening its current
        text representation. Stop after the chosen number of joins, or when no
        pair remains. Old letters stay in the dictionary so they can still spell
        new combinations later.
      </Prose>
      <Prose>
        In the lab below, compare the opening state with one merge: nine selected pair occurrences
        become nine fewer corpus symbols. Then edit the corpus to
        <Code> aaaa aaaa</Code>. The pair <Code>a + a</Code> has six overlapping
        adjacent occurrences, but left-to-right replacement makes only four
        non-overlapping merges. <em>Pair count and number of replacements can
        differ.</em> The lab reports both and derives every frame from the
        current corpus. The step control changes the process state, not whether
        you are allowed to see the result.
      </Prose>
      <Prose>
        Equal counts use lexicographic order of the pair's two strings, with
        Unicode code-point ordering. After the first five merges, several pairs
        tie at six; our sixth merge is <Code>e + w</Code>. Another implementation
        can choose a different tied pair. A tie convention makes the artifact
        reproducible: equal counts need one agreed rule to decide which pair goes
        first. It does not say that the chosen piece is a better part of a word.
      </Prose>
      <H3>Learning the rules and using the rules are different jobs</H3>
      <Prose>
        <strong>Training a tokenizer</strong> means discovering pieces and merge
        rules from the corpus. <strong>Encoding a word</strong> means using those
        already learned rules. We train once, save the rules, and reuse them on
        each new input. In the lab, the large text box changes the training text;
        the small word box only asks how the rules would split that word.
      </Prose>
      <BpeMergeLab />

      <span id="3-mathematical-foundation" />
      <span id="3-make-the-idea-precise" />
      <H2>3. Count during training, use saved ranks during encoding</H2>
      <Prose>
        <strong>Now give our counting operation a compact mathematical name.</strong>
        You have already performed it in the picture. Let <Code>f(w)</Code> be a word's count and <Code>s(w)</Code> its current
        symbol list. Count every adjacent occurrence of a pair, then add its
        contribution across words. This formula expresses the weighted counting
        operation we just performed:
      </Prose>
      <MathBlock>{"c(a,b)=\\sum_w f(w)\\sum_{i=1}^{|s(w)|-1}\\mathbf 1[s_i=a\\land s_{i+1}=b]."}</MathBlock>
      <MathBlock>{"(a^*,b^*)=\\arg\\max_{(a,b)}c(a,b)."}</MathBlock>
      <Prose>
        Read the inner sum as “visit each neighboring position and count one
        when the pieces are a then b.” The indicator, <Code>1[condition]</Code>,
        is one when the condition is true and zero otherwise. Multiply by the
        word's frequency, then add across words. For e+s, the nonzero terms are
        6×1 + 3×1 = 9. <Code>argmax</Code> simply says “return the pair with
        the largest count.” The stars mark that selected pair.
      </Prose>
      <Prose>
        This is greedy construction: commit to the current highest-count pair,
        change the representation, then count again. It builds a useful
        vocabulary without solving a globally optimal dictionary problem.
        Preserve all initial symbols and learned pieces, including those that
        no longer occur alone in the final training segmentation. New
        combinations can still require them.
      </Prose>
      <H3>Encoding uses ranks, not new corpus counts</H3>
      <BpeEncodingFigure />
      <Prose>
        Save the merges in order. The first has rank zero, the second rank one,
        and so on. Encode a word by starting from characters and repeatedly
        applying the available adjacent merge with the lowest rank. Never
        recount the user's prompt and retrain: that would change the meaning
        of the input representation between requests.
      </Prose>
      <Prose>
        After the first five learned merges, <Code>lowest</Code> becomes
        {" "}<Code>{'["low", "est</w>"]'}</Code>. The word was absent, but
        both pieces were learned. Compare <Code>LOWEST</Code>: our training
        alphabet has no uppercase letters, so the reference raises an explicit
        unseen-character error. The next lesson replaces the character alphabet
        with a byte representation and studies what coverage and decoding then mean.
      </Prose>
      <H3>Make the next merge cheap</H3>
      <Prose>
        <strong>Implementation depth: do the same work without repeatedly scanning
        everything.</strong> When e+s joins, only newest and widest change. Low
        and lower keep all their old pair counts. Store a lookup saying which
        words contain each pair. Then update just the words named by that lookup.
        This is the purpose of the <em>pair-to-words index</em> in the full code.
      </Prose>
      <BpeIndexFigure />
      <Prose>
        The upper drawing is that index: e+s points only to newest and widest.
        Updating these rows changes their neighboring pair counts. The lower
        drawing follows a join inside newest: after e and s become es, w now
        points to es, and es points to t. These are the only newly adjacent
        pairs created by this occurrence. Keeping left/right links makes this
        local repair possible without moving the rest of the sequence.
      </Prose>
      <Prose>
        A full rescan after each merge is wasteful when most words were
        unaffected. Our trainer keeps a pair-to-words index and recounts only
        affected words. A priority queue proposes the highest count; stale
        entries are discarded when their saved count differs from the current
        one. Encoding uses a heap ordered by rank and linked neighbor positions,
        so each merge updates only its two newly adjacent pairs.
      </Prose>
      <Prose>
        Think of the priority queue as a ranked work list. Its top entry says
        which pair currently looks most frequent. If an old entry says a pair
        occurs nine times but the current count is zero, skip that old entry.
        This check lets the code leave outdated entries in the heap instead of
        searching through the whole list to remove them. During encoding, the
        ranking is instead the learned rule order. Linking each piece to its
        left and right neighbors lets a join repair only the nearby links.
      </Prose>
      <Prose>
        A word starting with n symbols permits at most n−1 merges. The encoder
        does O(n log n) heap work and uses O(n) heap/link storage. This standalone
        function also builds an O(M) rank map from M learned merges on each call;
        a high-throughput tokenizer should cache that map with its model. We expose strings for
        readability; integer token IDs and spans can avoid repeated string
        copying. Training cost depends on affected word lengths and changed
        pair entries. Neither analysis establishes a universal wall-clock
        ranking between libraries.
      </Prose>

      <span id="4-from-scratch-implementation" />
      <H2>4. WordPiece: choose the longest piece that fits</H2>
      <Prose>
        BPE lets earlier merge rules decide how a word breaks up. Another
        approach is to start with a saved dictionary and read from left to right,
        taking the longest piece that matches. This is <strong>WordPiece
        encoding</strong>, used by BERT-style tokenizers. We will understand its
        reading rule first, then inspect both algorithms' complete code.
      </Prose>
      <WordPieceWalkthroughFigure />
      <Prose>
        Begin with an ordinary success: lower fits low, then the continuation
        piece ##er. Lowest fits both low and lowest at its start; the longer
        entry wins and finishes the word. The ## prefix marks a continuation
        entry in the dictionary, rather than two characters in the original text.
      </Prose>
      <Prose>
        Now use a tiny artificial word, abc, so we can see a failure without
        language knowledge getting in the way. Consider the vocabulary
        <Code> a, ab, ##b, ##bc, ##c</Code>. The prefix
        <Code> ##</Code> means “continue an already started word”; it is metadata,
        not source text. From the left edge of <Code>abc</Code>, WordPiece takes
        the longest valid starting piece, <Code>ab</Code>, then the longest
        continuation, <Code>##c</Code>. It needs no merge ranks. BPE with an
        earlier merge <Code>b+c</Code> could instead yield <Code>a | bc</Code>.
      </Prose>
      <WordPieceLab />
      <Prose>
        Remove <Code>##c</Code>. Although <Code>a | ##bc</Code> is a valid
        complete path, greedy WordPiece first takes <Code>ab</Code> and then
        gets stuck. The BERT-style rule returns one <Code>[UNK]</Code> for the
        whole word; it does not backtrack. Add the piece back, edit the word,
        and follow the switch from the word-start trie to the continuation trie.
        This exposes the difference between longest-prefix commitment and a
        search over complete segmentations.
      </Prose>
      <Prose>
        A trie stores shared prefixes once. Walking its edges records the last
        complete vocabulary item, then commits to that longest match. Our
        implementation costs O(nL) in the worst case for word length n and
        maximum piece length L, without repeatedly allocating substrings.
        BERT's word-length limit and whole-word unknown rule are explicit
        policies, not consequences of the trie.
      </Prose>
      <WordPieceTrieFigure />
      <Prose>
        For example, the starting entries a and ab share the first step:
        root → a → b. The node after a says “a is a complete piece”; after b,
        “ab is also complete.” Reading abc reaches ab, then stops when there is
        no c edge. Remembering the last complete node gives ab. The separate
        continuation trie then looks for c under the ## convention. The trie
        makes the lookup efficient; it does not change the longest-match rule.
      </Prose>
      <H3>Deeper: how might we learn the WordPiece dictionary?</H3>
      <Prose>
        To explore vocabulary construction, one teaching heuristic scores each
        pair by <Code>count(a,b)/(count(a)·count(b))</Code>. A pair scores
        highly when its parts rarely occur apart, even if a different pair has
        a higher raw count. The supplied <Code>train_wordpiece_proxy</Code>
        implements that objective with continuation markers so you can inspect
        and modify the resulting vocabulary.
      </Prose>
      <LessonTable caption="A small scoring comparison: frequency and association ask different questions" headers={["Candidate", "Pair count", "Counts of its two parts", "Proxy score"]} rows={[
        ["a + b", "20", "100 and 100", "20 / (100 × 100) = 0.002"],
        ["x + y", "5", "5 and 5", "5 / (5 × 5) = 0.2"],
      ]} />
      <Prose>BPE prefers the pair seen 20 times. This proxy prefers x+y: although rarer, its parts are always together in this constructed example. This teaches what the two scores reward.</Prose>
      <Prose>
        Google's original WordPiece trainer was not published. This teaching
        reconstruction makes one possible scoring rule explicit; Hugging Face's
        trainer can construct its dictionary differently. To compare only the
        reading rule, give both encoders the same saved vocabulary. Section 7
        does that before trying separately trained dictionaries.
      </Prose>
      <H3>Build the operation, then read the optimized program</H3>
      <Prose>
        Start by translating our e+s count directly into Python. A dictionary
        stores the four words and their frequencies. Each list holds the current
        pieces for a word; neighboring list entries are a candidate pair.
      </Prose>
      <CodeBlock language="python">{`from collections import Counter

word_counts = {"low": 5, "lower": 2, "newest": 6, "widest": 3}
pieces = {word: list(word) + ["</w>"] for word in word_counts}
pair_counts = Counter()
for word, tokens in pieces.items():
    for left, right in zip(tokens, tokens[1:]):
        pair_counts[left, right] += word_counts[word]

print(pair_counts["e", "s"])  # 9: six newest + three widest`}</CodeBlock>
      <Prose>
        <Code>zip(tokens, tokens[1:])</Code> visits neighbors: n+e, e+w,
        w+e, and so on. Adding the word's count performs the multiplication in
        section 3 without writing the formula. This small full scan is a useful
        reference operation. The complete program below keeps those counts
        incrementally so it does not repeat every scan after each merge.
      </Prose>
      <LessonTable caption="Read the full file in the same order as the mechanism" headers={["Function or structure", "Question it answers"]} rows={[
        ["train_bpe", "Which adjacent pair should join next, and which words need updating?"],
        ["apply_bpe", "Which learned rule applies first to the remaining neighbors of this new word?"],
        ["WordPiece.encode_word and its prefix trees", "What is the longest allowed piece starting here?"],
        ["BPEModel.decode", "Join the pieces; turn word-end markers back into word separators."],
        ["train_wordpiece_proxy", "What vocabulary does the explicitly chosen association heuristic construct?"],
      ]} />
      <Prose>
        The program uses Python containers and heap operations to implement the
        algorithms themselves. <Code>train_bpe</Code> accepts positive word counts
        or sampling weights; <Code>apply_bpe</Code> is reused by the next lesson
        after bytes are represented as symbols. Setting <Code>end_marker=None</Code>
        leaves out word-end markers for the matched library comparison in section 7.
      </Prose>
      <RemoteCodeBlock source="/learn-code/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram/subword_tokenizers.py" filename="subword_tokenizers.py" title="Complete efficient implementation of the operations explained above" />
      <CodeBlock language="shell">{"python subword_tokenizers.py"}</CodeBlock>
      <CodeBlock language="output">{`lowest ['low', 'est</w>']
round_trip lower newest
wordpiece_abc ['ab', '##c']
wordpiece_abz ['[UNK]']`}</CodeBlock>
      <Prose>
        These selected executed lines match the examples above. The program also
        prints its merge list. The round-trip input contains two spaces, but the
        output has one because <Code>text.split()</Code> discarded the original
        spacing. A word-end marker remembers where a word ends, not how many
        spaces followed it. Section 7 shows how the full text pipeline handles that.
      </Prose>

      <span id="5-production-implementation" />
      <H2>5. Unigram: compare complete paths</H2>
      <Prose>
        WordPiece commits to one piece before it knows whether the rest of the
        word will work. What if we compared <em>complete</em> ways to split the
        word instead? A <strong>segmentation</strong> is just one complete split.
        If the dictionary contains a, b and ab, then the spelling ab has two:
        the one-piece split ab, and the two-piece split a | b.
      </Prose>
      <Prose>
        A <strong>Unigram model</strong> gives each dictionary piece a probability.
        Think of it as a preference learned from text. To score a complete split,
        multiply the probabilities of its pieces. “Unigram” means this score
        treats each piece on its own, without using the previous piece as context.
        This is a small model of token choices, not the full language model that
        later understands sentences.
      </Prose>
      <LessonTable caption="Choose a = 0.2, b = 0.2, ab = 0.6. Which complete split scores higher?" headers={["Split of the same spelling", "Multiply its piece probabilities", "Weight"]} rows={[
        ["ab", "0.6", "0.60"], ["a | b", "0.2 × 0.2", "0.04"],
      ]} />
      <UnigramLatticeLab />
      <Prose>
        The single-piece split wins, because 0.60 is larger than 0.04. But both
        are possible. To express their <em>shares among the ways to spell ab</em>,
        first add their weights: 0.60 + 0.04 = 0.64. Then divide each weight by
        0.64. The shares are 0.60/0.64 = 93.75% for ab and 0.04/0.64 = 6.25%
        for a | b. These shares add to 100%. They are called <strong>posterior
        probabilities</strong>: probabilities after fixing the observed spelling.
      </Prose>
      <Prose>
        Draw positions before, between and after the two letters: 0, 1, 2. One
        arrow jumps from 0 to 2 by using ab. Two arrows go 0→1→2 by using a,
        then b. This picture of all possible piece choices is a <strong>lattice</strong>.
        A <strong>path</strong> through it is one complete segmentation. Now the
        diagram and the probability table describe the very same two choices.
      </Prose>
      <Prose>
        Move the slider to 20%. The split path now weighs 0.4×0.4 = 0.16,
        while ab weighs 0.20: ab still wins, but only narrowly. At 10%, each
        small piece gets 0.45; 0.45×0.45 = 0.2025 beats 0.10, so a | b wins.
        The dictionary still contains exactly the same three pieces. Changing
        their probabilities changes the chosen cut. The exact boundary is
        <Code> 3−2√2 ≈ 0.171573</Code> for p(ab); below it, the two single-character pieces together become
        more probable. The switch happens when p(ab) crosses p(a)p(b),
        not when the number of pieces changes.
      </Prose>
      <H3>Deeper: reuse partial answers instead of trying every path</H3>
      <UnigramPrefixFigure />
      <Prose>
        A longer word can have many possible cuts. Different full paths often
        share the same beginning, so recalculating that beginning is wasted work.
        <strong>Dynamic programming</strong> stores one answer for each prefix
        and builds longer answers from it. F(j) is the total weight of all ways
        to reach position j. Set F(0)=1. For each piece ending at j, add the
        weight of reaching its start times that piece's probability. Replace
        this sum with a maximum to find the best path, remembering the winning
        edge to reconstruct the pieces.
      </Prose>
      <LessonTable caption="Fill the answers for ab, then extend the spelling to abab" headers={["Position reached", "Ways to arrive", "Stored total"]} rows={[
        ["0 — before the word", "Start here; nothing has been multiplied yet", "F(0) = 1"],
        ["1 — after a", "F(0) × p(a)", "1 × 0.2 = 0.2"],
        ["2 — after ab", "Jump with ab, or continue from a using b", "1 × 0.6 + 0.2 × 0.2 = 0.64"],
        ["3 — after aba in abab", "Reuse all the ways to reach ab; append a", "F(2) × 0.2 = 0.128"],
        ["4 — after abab", "Reuse ab and append ab; or reuse aba and append b", "F(2) × 0.6 + F(3) × 0.2 = 0.4096"],
      ]} />
      <Prose>
        The last two rows extend the spelling to <Code>abab</Code>. We reuse
        F(2)=0.64 twice instead of listing both ways to form the first ab again.
        For longer words, these shared partial answers are what make the method
        practical. We store one total per position even when many paths reach it.
      </Prose>
      <Prose>
        In the formula, i is a piece's start position, j is its end, and t is
        that piece. The expression <Code>w[i:j]=t</Code> says the letters between
        those positions spell t. The sum combines every piece that can end here.
        To find only the best split, keep the largest contribution instead of
        their sum. In code, logarithms turn multiplication into addition:
        log(xy) = log(x) + log(y), and preserve which positive product is largest.
      </Prose>
      <MathBlock>{"F(j)=\\sum_{(i,t):\\,w[i:j]=t}F(i)p(t)."}</MathBlock>
      <MathBlock>{"V(j)=\\max_{(i,t):\\,w[i:j]=t}\\{V(i)+\\log p(t)\\}."}</MathBlock>
      <Prose>
        F is marginal path weight; V is best log weight, with V(0)=0. Here
        F(1)=0.2 and F(2)=0.6+0.2·0.2=0.64. The best path weighs log(0.6).
        These answer different questions: how much total support does a spelling
        have, and which segmentation has the most support?
      </Prose>

      <span id="6-visual-walkthrough" />
      <H2>6. Train and sample a probabilistic vocabulary</H2>
      <UnigramCreditFigure />
      <Prose>
        <strong>Deeper implementation branch.</strong> We chose 0.2, 0.2 and 0.6
        by hand. How can text teach us better probabilities? We observe the
        spelling ab, but we do not observe which cut produced it. Give each
        possible cut a share of the credit using its current posterior. The
        whole-piece path contributes 0.9375 uses of ab. The other path contributes
        0.0625 uses of a <em>and</em> 0.0625 uses of b. These fractional counts
        are averages over possible cuts, not fractional letters in the text.
      </Prose>
      <LessonTable caption="From one observed word to the next piece probabilities" headers={["Piece", "Expected uses from this word", "Divide by all expected uses: 1.0625"]} rows={[
        ["ab", "0.9375", "0.9375 / 1.0625 = 15/17"],
        ["a", "0.0625", "0.0625 / 1.0625 = 1/17"],
        ["b", "0.0625", "0.0625 / 1.0625 = 1/17"],
      ]} />
      <Prose>
        Why is the total 1.0625 instead of one? The short path uses one token,
        and the other uses two: 0.9375×1 + 0.0625×2 = 1.0625 expected tokens.
        We are estimating the probabilities of <em>pieces</em>, so normalize by
        expected piece uses. Repeat this calculation across the training words,
        update probabilities, and repeat. This two-step procedure is
        <strong> expectation-maximization (EM)</strong>: estimate hidden usage
        (E), then update probabilities to fit those estimated counts (M).
        Counting only the winning path instead would be a hard assignment.
      </Prose>
      <H3>How forward and backward totals give that credit</H3>
      <Prose>
        A backward pass supplies B(j), the weight of suffix paths from j to the
        end. Edge i→j with token t receives expected usage F(i)p(t)B(j)/F(n).
        Sum over all edges labeled t and word frequencies. Normalizing these
        expected counts updates the probabilities. This is the E-step then
        M-step: allocate fractional usage, then estimate probabilities. For one
        <Code> ab</Code> observation, the next probabilities are p(ab)=15/17
        and p(a)=p(b)=1/17.
      </Prose>
      <Prose>
        Read the numerator as “all ways to reach the piece × this piece's
        probability × all ways to finish after it.” For the a edge, it is
        1×0.2×0.2 = 0.04; divide by 0.64 to recover 0.0625. For the ab edge,
        it is 1×0.6×1 = 0.6, giving 0.9375. Here n is the word's length,
        so F(n) is the weight of all complete paths. The backward total at the
        end is one: there is nothing left to append.
      </Prose>
      <MathBlock>{"q(i\\to j,t\\mid w)=\\frac{F(i)p(t)B(j)}{F(n)}."}</MathBlock>
      <Prose>Write N(t) for the expected usage of token t across the corpus. The denominator in the update counts expected token occurrences, rather than observed words:</Prose>
      <MathBlock>{"N(t)=\\sum_w f(w)\\sum_{e:t_e=t}q(e\\mid w),\\qquad p_{\\mathrm{new}}(t)=\\frac{N(t)}{\\sum_u N(u)}."}</MathBlock>
      <Prose>
        Long paths multiply many small numbers. The program stores log weights
        and combines alternatives with log-sum-exp, including expected counts.
        Computing tiny expectations in ordinary probability space first would
        defeat that protection. A trie constructs matching edges without
        checking the whole vocabulary at every position. Each subsequent pass
        visits those edges rather than enumerating complete paths.
      </Prose>
      <Prose>
        For scale, multiplying 0.01 by itself 200 times gives 10⁻⁴⁰⁰, smaller
        than an ordinary double-precision number can store. Its natural logarithm,
        about −921, is easy to store. To add path weights stored as logs, subtract
        the largest log before exponentiating, then add that offset back:
        this is <strong>log-sum-exp</strong>. It preserves tiny alternatives
        without requiring us to multiply a long chain of tiny numbers first.
      </Prose>
      <H3>Keep the pieces that help explain the text</H3>
      <UnigramPruningFigure />
      <Prose>
        Suppose we removed ab from our three-piece dictionary. The spelling ab
        would still be possible through a | b, but its total weight at the old
        probabilities would fall from 0.64 to 0.04. That is a large loss of
        support. A piece that hardly contributes to any spelling can be removed
        more cheaply. <strong>Pruning</strong> means repeatedly removing such
        less useful entries, then fitting the remaining probabilities again.
        Keeping the original character pieces protects the ability to spell
        the observed training words.
      </Prose>
      <Prose>
        The program begins with the letter sequences found in the corpus, up
        to six characters long. It fits their probabilities with EM, scores
        how much removing each longer piece would reduce the total weight of
        possible cuts, and removes a small group with the lowest scores. The
        score adds each word's decrease in log total weight, weighted by its
        frequency. It then fits the remaining probabilities again. During the
        removal comparison, the remaining weights stay fixed so each score
        measures the paths that disappear. This transparent, small-corpus
        method is not a reproduction of SentencePiece's optimized trainer.
      </Prose>
      <RemoteCodeBlock source="/learn-code/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram/unigram_model.py" filename="unigram_model.py" title="Log-space lattice, exact EM, sampling and bounded vocabulary pruning" />
      <CodeBlock language="shell">{"python unigram_model.py"}</CodeBlock>
      <CodeBlock language="output">{`segmentation_mass 0.64
expected_counts {'a': 0.0625, 'ab': 0.9375, 'b': 0.0625}
best ['ab']
learned_size 15
lowest ['low', 'e', 's', 't']`}</CodeBlock>
      <Prose>
        The final line differs from BPE's low|est because both dictionary and
        objective differ. The first lines reproduce the earlier lattice
        arithmetic through a second route. For n characters and E matching
        edges, the passes cost O(n+E) after lattice construction; the trie
        requires at most O(nL) character visits. Exact removal scoring repeats
        calculations for candidate pieces and is intended for small experiments.
        Use a maintained trainer for large corpora and measure its workload.
      </Prose>
      <H3>One spelling, several training representations</H3>
      <UnigramSamplingFigure />
      <Prose>
        Always choosing the winning path would show the downstream model ab as
        one token every time. Sampling sometimes shows a | b instead. Over many
        training examples, the model then encounters more than one valid way to
        represent a spelling. This is the idea behind <strong>subword
        regularization</strong>: vary the cuts during training while keeping the
        text fixed, rather than teaching the network only one segmentation.
      </Prose>
      <Prose>
        Once suffix weights are known, sample the next edge in proportion to
        p(t)B(j)/B(i). This considers all possible completions, not just the
        locally most probable token. Our <Code>sample</Code> method uses a local
        seed. Across repeated samples of ab under the initial model, the whole
        piece should appear about 93.75% of the time; a finite run fluctuates.
      </Prose>
      <Prose>
        Subword regularization varies segmentations while training the downstream
        model. SentencePiece provides sampling controls alongside deterministic
        best-path encoding. BPE-dropout instead randomly skips eligible merges
        during training-time tokenization. These are experimental training
        choices, not mandatory repairs for deterministic encoding. Keep their
        settings and randomness explicit in reproducible evaluation.
      </Prose>

      <span id="7-decision-matrix-when-to-use-what" />
      <H2>7. SentencePiece and the ordinary library route</H2>
      <SentencePieceSpaceFigure />
      <Prose>
        So far we gave the algorithms separate words. Real input is a string
        with spaces and punctuation, and some languages do not put spaces
        between words. A practical tool must decide how to handle that text
        before choosing the pieces. <strong>SentencePiece</strong> is such a
        toolkit: it can learn BPE or Unigram pieces directly from sentences.
        It is not a fourth competing rule for selecting a segmentation.
      </Prose>
      <Prose>
        SentencePiece uses the visible marker <Code>▁</Code> to represent a space.
        Its settings can also add an initial space marker (the <em>dummy prefix</em>)
        or change the input spelling through <em>normalization</em>. Normalization
        means choosing a standard form, such as composing an accented character
        or lowercasing text. The tool does not require you to supply a separate
        language-specific word segmenter. Its whitespace and normalization
        settings still determine where pieces may join and what decoding recovers.
      </Prose>
      <H3>The complete journey from text to model input</H3>
      <TokenizerPipelineFigure />
      <Prose>
        The tokenizer is a sequence of operations, often called a
        <strong> pipeline</strong>. We can now name its stages without losing
        sight of what they do. The example below deliberately lowercases text
        and splits on spaces so that their effects are visible.
      </Prose>
      <Prose>
        <strong>Pre-tokenization</strong> establishes regions, such as words,
        within which the piece algorithm works. A saved vocabulary then maps
        the pieces to IDs. The neural model uses each ID to select a row in a
        table of learned numbers, its <strong>embedding table</strong>. That row
        is the model's starting representation of the token. Post-processing may
        add special tokens that mark, for example, a sequence boundary.
      </Prose>
      <Prose>
        A model trained with low at ID 7 has learned to use row 7 for low. Giving
        it a new tokenizer that calls some other piece 7 changes what its input
        means. Load an existing model's matching tokenizer. If you deliberately
        extend or replace that vocabulary, the model's corresponding rows and
        training must be adapted too; the vocabulary-design lesson explains how.
      </Prose>
      <LessonTable caption="Three model artifacts and their surrounding pipeline" headers={["Mechanism", "Saved state", "Encoding decision"]} rows={[
        ["BPE", "Alphabet, vocabulary, ordered merges", "Apply eligible low-rank neighbor merges."],
        ["WordPiece", "Vocabulary and continuation convention", "Commit to the longest valid prefix."],
        ["Unigram", "Vocabulary and piece log weights", "Choose the best complete path, or explicitly sample."],
        ["Surrounding pipeline", "Normalization, boundaries, special tokens, decoder", "Define preserved text and model input IDs."],
      ]} />
      <Prose>
        The native program imports the scratch BPE vocabulary and ranks into
        Hugging Face's <Code>models.BPE</Code>, with end markers disabled on
        both sides, then compares six spellings. It supplies the same WordPiece
        vocabulary and Unigram log probabilities to their native models too.
        These are controlled inference comparisons. Separately fitting two
        trainers is useful experimentation but does not isolate their encoders.
      </Prose>
      <H3>A real text experiment you can inspect offline</H3>
      <Prose>
        Lewis Carroll's <em>Alice's Adventures in Wonderland</em> supplies real
        repeated words, names and punctuation. Our excerpt uses the first 18
        paragraphs of chapter I for training and the next six for evaluation.
        Paragraph line wraps are flattened; case and punctuation remain. The
        held-out text has 1,916 characters and 358 whitespace-separated words.
        This literary sample asks what happens when a fitted tokenizer meets
        new combinations and an unseen character.
      </Prose>
      <Prose>
        Download <a href="/learn-code/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram/alice-train.txt" download>alice-train.txt</a>,
        {" "}<a href="/learn-code/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram/alice-heldout.txt" download>alice-heldout.txt</a>
        {" "}and its <a href="/learn-code/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram/alice-provenance.json" download>provenance record</a>
        {" "}beside the programs. The original text is public domain in the USA;
        the record identifies the source, selection and file hashes.
      </Prose>
      <H3>One ordinary library workflow before the full experiment</H3>
      <Prose>
        Install the libraries below, then try this small Hugging Face example
        in Python. It follows the same sequence as our scratch tokenizer:
        choose a learning rule, train on text, encode a new word, inspect the
        pieces, decode, and save. The word-end suffix and decoder agree on what
        marks a word boundary. This example deliberately uses the familiar tiny
        corpus so you can see what each API call does before running Alice.
      </Prose>
      <CodeBlock language="shell">{"python -m pip install tokenizers==0.23.2 sentencepiece==0.2.2"}</CodeBlock>
      <CodeBlock language="python">{`from tokenizers import Tokenizer, models, trainers, pre_tokenizers, decoders

tokenizer = Tokenizer(models.BPE(unk_token="[UNK]"))
tokenizer.pre_tokenizer = pre_tokenizers.WhitespaceSplit()
tokenizer.decoder = decoders.BPEDecoder(suffix="</w>")
trainer = trainers.BpeTrainer(
    vocab_size=24, special_tokens=["[UNK]"],
    end_of_word_suffix="</w>", show_progress=False,
)
training_text = "low low low low low lower lower newest newest newest newest newest newest widest widest widest"
tokenizer.train_from_iterator([training_text], trainer=trainer)
encoded = tokenizer.encode("lowest")
print(encoded.tokens)                  # Inspect the readable pieces.
print(tokenizer.decode(encoded.ids))   # Reconstruct their spelling.
tokenizer.save("small-tokenizer.json")
restored = Tokenizer.from_file("small-tokenizer.json")
assert restored.encode("lowest").ids == encoded.ids`}</CodeBlock>
      <CodeBlock language="output">{"['lo', 'w', 'est</w>']\nlowest"}</CodeBlock>
      <Prose>
        Those are the outputs recorded for this library run. Its dictionary
        cuts lowest as lo | w | est&lt;/w&gt;, while our earlier scratch dictionary
        learned low | est&lt;/w&gt;. Both recover the same word. Trainer settings,
        boundary conventions and choices between tied counts can change the
        learned pieces. To compare the <em>encoding algorithms</em> alone, the
        full experiment also supplies the same saved dictionary and rules to both.
      </Prose>
      <Prose>
        <Code>encoded.tokens</Code> shows pieces for a person to inspect;
        <Code>encoded.ids</Code> is the corresponding numeric list for a model.
        <Code>vocab_size</Code> sets the target dictionary size. The saved JSON
        keeps the learned rules and surrounding settings together, so reloading
        does not have to learn them again. The assertion checks that the IDs
        survive saving. The full program now extends this workflow to other
        methods and to our real training/evaluation text.
      </Prose>
      <CodeBlock language="shell">{"python tokenizer_libraries.py"}</CodeBlock>
      <RemoteCodeBlock source="/learn-code/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram/tokenizer_libraries.py" filename="tokenizer_libraries.py" title="Matched native encoders, local training routes and persistence checks" />
      <RecordedTokenizerFigure />
      <LessonTable caption="Recorded CPU fits at vocabulary target 160; no timing or quality ranking" headers={["Pipeline", "Held-out tokens", "Unknown emissions"]} rows={[
        ["HF BPE + whitespace split", "867", "1"],
        ["HF WordPiece + whitespace split", "1,013", "3"],
        ["HF Unigram + whitespace split", "874", "1"],
        ["SentencePiece BPE + preserved spaces", "1,044", "1"],
        ["SentencePiece Unigram + preserved spaces", "1,151", "1"],
      ]} />
      <Prose>
        SentencePiece encodes spaces here, while the first three pipelines
        discard them before segmentation. Their lengths answer different
        representation contracts. WordPiece's unknown replaces a whole word;
        another pipeline's emission may represent a smaller span. Inspect
        actual unknown spans and pieces alongside these counts. The table
        records the observed fits; tied trainer choices may change a learned
        artifact between runs.
      </Prose>
      <Prose>
        The program also prints the unknown spans. In this run, BPE and
        Unigram encounter an unseen uppercase C. WordPiece returns whole-word
        unknowns for <Code>{'“Come,'}</Code>, <Code>croquet</Code> and
        {" "}<Code>{'“But'}</Code>: its position-specific alphabet
        and greedy path can fail even when some individual letters were seen.
        That diagnostic explains the difference between one and three unknown
        emissions; the output length alone would hide it.
      </Prose>
      <Prose>
        The program saves and reloads Hugging Face tokenizers, checking identical
        IDs, and passes serialized model bytes to SentencePiece. Its identity
        normalizer, disabled dummy prefix and preserved repeated whitespace
        are deliberate: they round-trip <Code>Alice  was curious.</Code> with
        two spaces in this fixture. Usual normalization defaults have a
        different contract. Character coverage selects an alphabet from the
        training distribution; byte fallback is a separate option taught next.
      </Prose>

      <H2>8. What scales and what doesn't</H2>
      <TokenizerBudgetFigure />
      <Prose>
        There are two different things to pay for: the size of the stored
        dictionary and the length of the encoded message. A model stores a row
        of learned numbers for each dictionary entry. Four entries with three
        numbers each would need 4×3 = 12 stored numbers. Adding entries makes
        that table larger, but may let a message use fewer pieces.
      </Prose>
      <Prose>
        A vocabulary with V entries and hidden width d needs Vd embedding
        parameters (stored learned numbers). Here d is the number of values in
        each row. A separate, or <em>untied</em>, output matrix stores another
        table used to score the next token, adding another Vd. A sequence
        of length T uses T positions and corresponding activations. Dense full
        self-attention considers T² ordered position pairs, while other
        operations and cached generation have their own costs. Vocabulary
        size and sequence length trade against one another; no single budget
        wins for every workload.
      </Prose>
      <Prose>
        For a concrete contrast, six letter tokens give 6×6 = 36 possible ordered
        position pairs; two subword tokens give 2×2 = 4. That counts the pairs
        considered by full attention, the mechanism that lets positions exchange
        information. It is only one part of a model's work. A larger dictionary
        also gives the output layer more possible next tokens to score, so fewer
        input pieces do not automatically make every operation cheaper.
      </Prose>
      <Prose>
        For a fixed 420-character text, an average of 3.2 versus 4.2 characters
        per token gives about 131.25 versus 100 tokens: 23.8% fewer. The dense
        attention-pair ratio would be (100/131.25)²≈0.5805, while a fixed token
        context holds 31.25% more characters at those averages. These are
        algebraic accounting examples, not measured speedups or price forecasts.
        Real costs depend on the model, batching and workload.
      </Prose>
      <Prose>
        A useful measurement records corpus/split, normalization, saved artifact,
        vocabulary budget, unknown handling, hardware, threads and timing
        boundary. Separate training from encoding, and first load from warmed
        calls. For multilingual allocation, code, numbers and domain adaptation,
        continue to vocabulary design rather than assigning a language a
        universal “good” or “bad” algorithm.
      </Prose>

      <H2>9. Failure modes and gotchas</H2>
      <TokenizerMismatchFigure />
      <Prose>
        Trace the same ID 7 through two dictionaries. When it names low, the
        original model selects the row learned for low. If a replacement
        dictionary calls est ID 7, the model still selects that same row.
        The integer remains in range while its meaning has changed. Tokenizer
        compatibility therefore includes the piece-to-row mapping and the
        surrounding text transformations, not just vocabulary size.
      </Prose>
      <LessonTable caption="Diagnose the stage that changed the meaning" headers={["Observation", "Mechanism", "Practical response"]} rows={[
        ["Decode differs in spaces/case", "Earlier text transformation lost information", "Test the declared round-trip target; retain source/offsets when needed."],
        ["A rare name becomes unknown", "Missing character, greedy failure or word-length limit", "Inspect pieces/alphabet; assess byte coverage next."],
        ["Same vocabulary, different BPE output", "Different ranks, boundaries, ties or dropout", "Compare complete saved pipelines and the first divergent operation."],
        ["Separately encoded fragments differ from whole text", "Merge/normalization crosses a fragment boundary", "Encode the actual completed input when the contract requires it."],
        ["New tokenizer with old weights fails", "IDs no longer refer to matching learned rows", "Version tokenizer with model; added-token adaptation needs embedding/output handling and training."],
        ["Token count fell but information vanished", "Lossy transformation or a large unknown span", "Inspect decoded text and unknown spans alongside counts."],
      ]} />
      <Prose>
        A merge <Code>a+b→ab</Code> can encode <Code>ab</Code> as one token,
        while separate fragments a and b yield two. Other boundaries give
        equal outputs; test the actual case. A vocabulary size also need not
        equal a padded embedding matrix's row count. Compatibility concerns
        valid ID ranges, special-token meanings and matching row identities.
      </Prose>

      <span id="11-self-check-exercises" />
      <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">
        <H2>10. Self-check exercises</H2>
        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>1. Overlap is not a merge twice</H3>
          <Prose>For <Code>aaa aaa</Code>, include the separate end marker and do one BPE merge. Report pair count, replacements and weighted symbol count. Then change to <Code>aaaa aaaa</Code>.</Prose>
          <details><summary>Hint</summary><Prose>Adjacent occurrences can share a middle symbol. A replacement consumes both symbols and continues after them.</Prose></details>
          <details><summary>Solution</summary><Prose>For two aaa rows, a+a has count four but only two replacements occur. Four symbols per row become three: weighted total six. For two aaaa rows, the pair count is six and four replacements occur; each row becomes aa,aa,marker, again totaling six. Claiming six replacements double-counts shared positions.</Prose></details>
        </div>
        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>2. A valid path that greedy WordPiece misses</H3>
          <Prose>Vocabulary: <Code>a, ab, ##bc, [UNK]</Code>. Encode abc, then add one token repairing the chosen path. Explain why finding any valid segmentation gives the wrong answer.</Prose>
          <details><summary>Hint</summary><Prose>The first operation is longest-prefix commitment; it is not reconsidered after a suffix failure.</Prose></details>
          <details><summary>Solution</summary><Prose>It chooses ab, cannot encode c and returns [UNK]. Adding ##c produces ab,##c. The alternative a,##bc existed already, but taking it requires a different, backtracking algorithm.</Prose></details>
        </div>
        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>3. Fractional credit, then an update</H3>
          <Prose>Set p(a)=p(b)=0.4 and p(ab)=0.2. Calculate the posterior paths for ab, expected counts and one EM update using one observation. Verify with <Code>forward_backward</Code> and <Code>em_step</Code>.</Prose>
          <details><summary>Hint</summary><Prose>The denominator is 0.2+0.16. Expected token count exceeds one because the two-piece path retains mass.</Prose></details>
          <details><summary>Solution</summary><Prose>The whole-piece posterior is 5/9, the split posterior 4/9. Expected counts are ab=5/9, a=b=4/9, totaling 13/9. The update gives p(ab)=5/13 and p(a)=p(b)=4/13. Keeping only the winning path would be hard assignment.</Prose></details>
        </div>
        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>4. Verify the optimized encoder independently</H3>
          <Prose>Write a list-based rank encoder as an oracle. Compare to <Code>apply_bpe</Code> for repeated letters, competing neighbors, no merges and an unseen combination. Check complete piece sequences, not just concatenation.</Prose>
          <details><summary>Hint</summary><Prose>Enumerate adjacent pairs; minimize rank then position; replace one occurrence. A slower oracle is appropriate for small independent checks.</Prose></details>
          <details><summary>Solution and acceptance criteria</summary><Prose>Both must return identical ordered pieces under the same ranks and overlap rule. Concatenation misses rank bugs because a|bc and ab|c have identical spelling. For merges b+c then a+b on abc, bc wins and yields a|bc. For a+a on aaa, the result is aa|a. Neither encoder retrains on the query.</Prose></details>
        </div>
        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>5. Change a library decision without changing the question</H3>
          <Prose>Repeat Alice at budgets 120 and 200 with the same split. Record token counts, actual unknown spans and a round-trip example. Separately change SentencePiece's repeated-whitespace handling. Which observation concerns vocabulary allocation, and which concerns information preservation?</Prose>
          <details><summary>Hint</summary><Prose>Hold normalization fixed for the budget comparison. Use two consecutive spaces for the separate pipeline test.</Prose></details>
          <details><summary>Acceptance criteria</summary><Prose>Save fitted artifacts/settings. Report observed pieces instead of assuming every unseen word shortens. Identify exactly which whitespace disappeared. Fewer tokens from discarded text do not establish a more expressive vocabulary. Explain why one literary English sample cannot select a multilingual model's tokenizer.</Prose></details>
        </div>
      </section>
      <section className="lesson-ending lesson-ending--next" data-lesson-ending="next">
        <H2>11. From learned pieces to bytes</H2>
        <Prose>You are ready when you can trace a merge, distinguish rank from longest prefix, compute two Unigram paths and reproduce matched native encoding. Next, <a href="/learn/path/full-curriculum/byte-level-tokenization-token-free-models?module=large-language-models">Byte-Level Tokenization &amp; Token-Free Models</a> asks what happens when base units cover all bytes and when a neural model consumes them directly. Then <a href="/learn/path/full-curriculum/vocabulary-design-multilingual-tokenization?module=large-language-models">Vocabulary Design &amp; Multilingual Tokenization</a> turns the mechanisms into measured allocation decisions.</Prose>
      </section>
      <span id="10-primary-sources" />
      <Sources alternatives={<ul>
        <li><a href="https://web.stanford.edu/~jurafsky/slp3/2.pdf">Jurafsky and Martin, Words and Tokens</a> — textbook chapter connecting corpora, tokenization, Unicode and language variation; useful after your first BPE trace.</li>
        <li><a href="https://huggingface.co/learn/llm-course/en/chapter6/5">Hugging Face: BPE</a>, <a href="https://huggingface.co/learn/llm-course/en/chapter6/6">WordPiece</a> and <a href="https://huggingface.co/learn/llm-course/en/chapter6/7">Unigram</a> — a second route through concrete word lists, intermediate counts and small implementations. Read beside our coloured traces; the WordPiece page distinguishes its training reconstruction from Google's implementation.</li>
        <li><a href="https://www.youtube.com/watch?v=zduSFxRajkE">Andrej Karpathy: Let's build the GPT Tokenizer</a> — video build-along with <a href="https://github.com/karpathy/minbpe">minbpe code and exercises</a>. Companion code/outline reviewed; full video viewing is not claimed. Its byte route connects to the next lesson.</li>
      </ul>}>
        <li><a href="https://aclanthology.org/P16-1162/">Sennrich, Haddow and Birch (2016)</a> — section 3.2, weighted word dictionaries and BPE's translation motivation.</li>
        <li><a href="https://github.com/google-research/bert/blob/master/tokenization.py">BERT tokenization source</a> — longest match, continuation convention and whole-word unknown fallback.</li>
        <li><a href="https://aclanthology.org/P18-1007/">Kudo (2018), Subword Regularization</a> — marginal-likelihood fitting and lattice sampling.</li>
        <li><a href="https://aclanthology.org/D18-2012/">Kudo and Richardson (2018), SentencePiece</a> and <a href="https://github.com/google/sentencepiece/blob/master/doc/options.md">training options</a> — pipeline and configuration.</li>
        <li><a href="https://huggingface.co/docs/tokenizers/api/models">Tokenizers models</a> and <a href="https://huggingface.co/docs/tokenizers/api/trainers">trainers</a> — native contracts. Executed with Tokenizers 0.23.2 and SentencePiece 0.2.2.</li>
        <li><a href="https://aclanthology.org/2020.acl-main.170/">Provilkov, Emelianenko and Voita (2020)</a> — BPE-dropout's training-time mechanism.</li>
        <li><a href="https://www.gutenberg.org/ebooks/11">Project Gutenberg: Alice's Adventures in Wonderland</a> — real-text source. Source bodies reviewed 28 September 2026; outputs concern the supplied local experiment.</li>
      </Sources>
    </div>
  ),
};
