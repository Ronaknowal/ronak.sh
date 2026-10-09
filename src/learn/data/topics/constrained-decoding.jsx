// Rendered from the accepted complete manuscript by scripts/render-constrained-decoding-lesson.mjs.
import {Prose,H2,H3,CodeBlock} from '../../components/content';
import {Math as InlineMath,MathBlock} from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import {Table as NeuralTable} from '../../components/lesson-labs/ConstrainedDecodingShared.jsx';
import {RecordAnatomy,ThreeChecks,PrefixLanguage,DecimalMachine,WholeToken,MaskedMass,FilterOrder,RegularCompiler,VocabularyTrie,StateTokenIndex,Utf8Bytes,CrossFieldToken} from '../../components/lesson-labs/ConstrainedDecodingFoundations.jsx';
import {NestedTree,ParserStack,ForkRollback,GenerationLoop,StopStates,FutureMass,LibraryOwnership,RequestState} from '../../components/lesson-labs/ConstrainedDecodingState.jsx';
import {NativeMaskTrace,ExtractionRecord,PairedOutcomes,AdaptiveMask,OverlapTimeline,CompileAmortization,ContractDecision} from '../../components/lesson-labs/ConstrainedDecodingEvidence.jsx';
import '../../components/lesson-labs/lesson-flow.css';
function Program({file}){return <RemoteCodeBlock source={'/learn/examples/constrained-decoding/'+file} language="python" title={file} filename={file}/>;}
function ConstrainedDecodingLesson(){return <div className="lesson-flow cd-flow"><section><Prose>{"A program cannot reliably use a response just because a person can read it. If it expects a record with two fields, a sentence, an unfinished object and a perfectly formatted wrong answer cause different problems. This lesson follows one extraction task from output characters to token probabilities, an executable recognizer and an ordinary model API."}</Prose>

<Prose>{""}<strong>{"You will learn to"}</strong>{" distinguish syntax, schema and factual checks; compile a small finite constraint; match whole token bytes; maintain recursive parser state; connect a grammar to a cached autoregressive loop; and evaluate actual Outlines and XGrammar outputs without confusing structural success with task success."}</Prose>

<Prose opening="prerequisites">{""}<strong>{"Useful prerequisites:"}</strong>{" "}<a href={"/learn/path/full-curriculum/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram?module=large-language-models"}>{"subword tokenization"}</a>{" establishes token IDs; "}<a href={"/learn/path/full-curriculum/decoding-strategies-greedy-beam-top-k-top-p-temperature?module=large-language-models"}>{"Decoding Strategies"}</a>{" teaches logits, sampling, filter order and stopping; "}<a href={"/learn/path/full-curriculum/kv-cache-memory-management?module=large-language-models"}>{"KV-Cache"}</a>{" explains the model state reused below. Each boundary is refreshed where it matters. Python, conditional probability and basic trees are enough to begin."}</Prose>

<Prose opening="route">{""}<strong>{"First pass:"}</strong>{" read sections 1–5, then 8–11 and 13. Sections 6–7 expose the finite compiler and recursive parser; section 12 explains implementation cost. They remain visible for a deeper second reading. The runnable examples include full source, saved native outputs and worked practice."}</Prose>

<span id="1-why-it-exists" aria-hidden="true"/><H2>{"1. Turn a source statement into a record"}</H2>

<Prose>{"The source says: “Species: setosa. Sepal length: 5.1 cm.” An application wants the species and the measurement under known field names. Begin with the actual object it will receive."}</Prose>

<RecordAnatomy/>

<Prose>{"In "}<code>{"{\"species\":\"setosa\",\"sepal_cm\":5.1}"}</code>{", braces delimit an object; quoted keys name fields; a colon associates a key with a value; a comma separates the fields. "}<code>{"\"setosa\""}</code>{" is a string, while "}<code>{"5.1"}</code>{" is a number. The blue correspondence follows the species from source to record; amber follows the measurement. These colours identify fields, not correctness."}</Prose>

<Prose>{""}<strong>{"Serialization"}</strong>{" converts a value into text or bytes. "}<strong>{"Parsing"}</strong>{" reconstructs a value from that representation. JSON is a serialization format, so valid JSON can also be an array, string, number, boolean or "}<code>{"null"}</code>{". An object-shaped application needs a stronger contract than “produce JSON.”"}</Prose>

<ThreeChecks/>

<Prose>{""}<code>{"{\"species\":setosa}"}</code>{" fails JSON syntax because an unquoted word is not a JSON string. "}<code>{"{\"species\":\"setosa\"}"}</code>{" parses but lacks the required measurement. "}<code>{"{\"species\":\"setosa\",\"sepal_cm\":8}"}</code>{" can satisfy the selected field types and numeric domain while disagreeing with the source. The desired "}<code>{"5.1"}</code>{" passes all three checks. A different order of the same two fields can represent the same JSON object."}</Prose>

<Prose>{"A "}<strong>{"schema"}</strong>{" describes permitted values: required properties, their types, allowed enum values and whether additional properties are allowed. It does not automatically know the source. In this lesson's actual study, every prompt shares a species enum and a numeric enum from 4.0 to 8.0 in tenths. That grammar limits the output domain without inserting each row's answer. We validate syntax, then this schema, then exact copied fields independently."}</Prose>

<Prose>{"Prompting asks a model to follow the contract. Constrained decoding removes disallowed next-token choices while generation is running. It can enforce the selected representation language if the recognizer and integration are correct, sufficient legal model support exists and generation reaches completion. It does not repair a weak model's interpretation of the source."}</Prose>

<span id="2-core-intuition" aria-hidden="true"/><H2>{"2. Keep a prefix that can still become valid"}</H2>

<Prose>{"Waiting until the end to parse an output wastes any work after the first irreversible syntax error. To prevent that error, the recognizer must answer a different question before the output is complete."}</Prose>

<PrefixLanguage/>

<Prose>{"Suppose the only permitted strings are "}<code>{"cat"}</code>{" and "}<code>{"car"}</code>{". After "}<code>{"ca"}</code>{", both completions remain possible. After "}<code>{"cat"}</code>{", the output is complete. After "}<code>{"cab"}</code>{", no suffix can rescue the string. The trie draws shared prefixes once, with two final branches. Its double rings mean “can finish here”; the white outline identifies the current prefix."}</Prose>

<Prose>{"Let "}<InlineMath>{"L"}</InlineMath>{" be the set of allowed complete byte strings. A prefix "}<InlineMath>{"x"}</InlineMath>{" is "}<strong>{"viable"}</strong>{" when some suffix "}<InlineMath>{"s"}</InlineMath>{" makes "}<InlineMath>{"xs\\in L"}</InlineMath>{". It is "}<strong>{"accepting"}</strong>{" when "}<InlineMath>{"x\\in L"}</InlineMath>{" already. Viability permits continuation; acceptance permits an end-of-sequence token. A string can be both accepting and extendable: "}<code>{"3"}</code>{" is a complete decimal, and appending "}<code>{".2"}</code>{" makes another complete decimal."}</Prose>

<DecimalMachine/>

<Prose>{"For the explicit language "}<code>{"[0-9]+(\\.[0-9]+)?"}</code>{", the start needs a digit. An integer state can take more digits or a decimal point. The dot state needs a digit; the fraction state can take more digits. The integer and fraction states accept; the start and dot states do not. "}<code>{"3."}</code>{" is viable but unfinished. "}<code>{"3x"}</code>{" is dead. Negative signs, exponents and leading dots are outside this particular language, although other number formats allow them."}</Prose>

<Prose>{"A "}<strong>{"deterministic finite automaton"}</strong>{", or DFA, stores one state and follows a labelled transition for each input byte. Its finite state summarizes exactly the history needed for the future decision. Missing transitions lead to rejection. When constructing a DFA from a more general description, we also remove transitions into states from which acceptance is unreachable; a reachable state is not necessarily a viable one."}</Prose>

<Prose>{"Stopping the machine is separate from accepting its text. A token cap after "}<code>{"3."}</code>{" leaves incomplete text. A cap after "}<code>{"3"}</code>{" leaves complete text without an observed EOS. A canceled request has another status. Keep these distinctions through the application boundary rather than treating every return as a successful record."}</Prose>

<span id="6-visual-walkthrough" aria-hidden="true"/><H2>{"3. Match the entire token, including its bytes"}</H2>

<Prose>{"The model chooses token IDs, whereas the recognizer above consumes bytes. One token may traverse several edges before we know whether it is allowed."}</Prose>

<WholeToken/>

<Prose>{"Consider the deliberately small vocabulary: token 0 emits "}<code>{"abc"}</code>{", token 1 emits "}<code>{"42"}</code>{", token 2 emits "}<code>{"7"}</code>{", token 3 emits "}<code>{"3x"}</code>{", and token 4 is EOS. At the decimal start, IDs 1 and 2 are allowed. Token 3 begins with a legal digit but then reaches illegal "}<code>{"x"}</code>{"; the whole token is rejected. Testing only its first character would admit an invalid result. EOS is rejected until the current text is accepting."}</Prose>

<Prose>{"The byte transition extended over a token "}<InlineMath>{"b(v)"}</InlineMath>{" is written "}<InlineMath>{"\\delta^*(s,b(v))"}</InlineMath>{". Starting at state "}<InlineMath>{"s"}</InlineMath>{", walk every byte of token "}<InlineMath>{"v"}</InlineMath>{"; retain the token only if the final state is viable. Preserve the final state as the destination for an accepted token. For EOS, inspect acceptance directly instead of pretending its displayed special-token spelling belongs in the output."}</Prose>

<Prose>{"Decoded token labels are not always their raw bytes. Tokenizer display conventions can mark leading spaces, and a byte-level vocabulary may split a UTF-8 character. Trimming whitespace or replacing undecodable pieces changes the language. A tokenizer-aware library adapter must expose the correct byte interpretation, special tokens and actual model output width. Pythia's output width in the retained study is 50,304, larger than the tokenizer's 50,277 entries; padded output IDs must remain masked."}</Prose>

<Utf8Bytes/>

<Prose>{"The euro sign is the UTF-8 byte sequence "}<code>{"E2 82 AC"}</code>{". Tokens "}<code>{"[E2]"}</code>{" and "}<code>{"[82 AC]"}</code>{" can jointly produce it even though neither token boundary needs to coincide with a Unicode character boundary. The byte recognizer can retain the incomplete "}<code>{"E2"}</code>{" prefix. "}<code>{"82"}</code>{" at the start or "}<code>{"E2 41"}</code>{" cannot complete this exact literal. Render hexadecimal bytes beside the final character so replacement glyphs never masquerade as actual input."}</Prose>

<span id="3-math-foundation" aria-hidden="true"/><H2>{"4. Remove illegal probability mass, then choose"}</H2>

<Prose>{"The recognizer tells us what can follow. The model still tells us which permitted continuation it prefers. Align those two answers by token ID."}</Prose>

<MaskedMass/>

<Prose>{"Use original probabilities "}<InlineMath>{"p=(1/2,1/4,1/8,1/16,1/16)"}</InlineMath>{" for the five IDs above. At the decimal start, allowed IDs 1 and 2 carry total mass "}<InlineMath>{"3/8"}</InlineMath>{". Removing all other entries and dividing by that total gives "}<InlineMath>{"q=(0,2/3,1/3,0,0)"}</InlineMath>{". The token colours stay attached to IDs across the original and masked rows; a white marker shows the selected token."}</Prose>

<Prose>{"For legality mask "}<InlineMath>{"m(v)\\in\\{0,1\\}"}</InlineMath>{", the next-token distribution is"}</Prose>

<div className="neural-equation"><MathBlock>{"q(v\\mid x)=\\frac{p(v\\mid x)m(v)}{\\sum_u p(u\\mid x)m(u)}."}</MathBlock></div>

<Prose>{"After the prefix "}<code>{"3"}</code>{", EOS also becomes legal. Legal original mass is then "}<InlineMath>{"7/16"}</InlineMath>{", so the same supplied model probabilities become "}<InlineMath>{"q_1=4/7"}</InlineMath>{", "}<InlineMath>{"q_2=2/7"}</InlineMath>{", "}<InlineMath>{"q_4=1/7"}</InlineMath>{". This example holds model probabilities fixed to isolate the grammar's effect; a real model generally changes its probabilities after every emitted token."}</Prose>

<Prose>{"In logits, assign negative infinity to excluded entries, then use a stable softmax. Do not multiply infinity by a zero mask: IEEE floating-point arithmetic makes "}<code>{"0 * -inf"}</code>{" a NaN. A legal grammar token can still have no finite model score. If all allowed scores are negative infinity, the denominator has no supported mass; return an explicit empty-support failure. Uniform fallback or unmasking an illegal token changes the declared policy."}</Prose>

<FilterOrder/>

<Prose>{"Filter order can create this failure even when the original model had legal mass. Top-k with k=1 first keeps only token 0, "}<code>{"abc"}</code>{"; applying the grammar afterward removes it. Applying the grammar first leaves "}<code>{"42"}</code>{" and "}<code>{"7"}</code>{", after which top-k1 selects "}<code>{"42"}</code>{". At k=5 the top-k step removes nothing, so these particular routes agree. The preceding decoding lesson's temperature, top-p and repetition transformations are policies over scores; specify their order relative to constraint enforcement."}</Prose>

<Prose>{"The complete numeric loop in section 8 reuses that lesson's "}<code>{"probabilities"}</code>{" and "}<code>{"categorical"}</code>{" functions exactly. Their positive-support cumulative sampler never selects a zero-probability entry at a boundary. This lesson adds the recognizer and state transition, rather than maintaining a second subtly different sampler."}</Prose>

<H2>{"5. Share token work with a trie and a state index"}</H2>

<Prose>{"Walking every vocabulary token from scratch works, but many tokens begin with the same bytes. Shared prefixes can make the legality calculation smaller."}</Prose>

<VocabularyTrie/>

<Prose>{"For tokens "}<code>{"a"}</code>{", "}<code>{"ab"}</code>{", "}<code>{"ac"}</code>{", "}<code>{"b"}</code>{", "}<code>{"ba"}</code>{", the vocabulary trie has two first-byte edges and three further edges. At a given grammar state, walk a trie edge once. If that edge becomes dead, prune all descendant tokens. A leaf carries token IDs; duplicate byte strings can have different IDs, so a node may hold several leaves. Testing every whole token independently would repeat common byte transitions."}</Prose>

<StateTokenIndex/>

<Prose>{"For a finite grammar, the legality decision depends on the DFA state, not the complete text history. A row of the index maps each token ID to a destination state or rejection. A repeat visit to that grammar state can reuse the row. EOS has a separate terminated destination and is included only in accepting rows. The cache belongs to one grammar and vocabulary; a state number from another automaton is not a reusable key by itself."}</Prose>

<Prose>{"The examples run with Python 3.12 or later. Download the "}<a href={"/learn/examples/constrained-decoding/constrained-decoding.zip"}>{"complete example bundle"}</a>{", unpack it, create an environment and install "}<code>{"requirements.txt"}</code>{". Finite automata, schema compilation and the recursive parser use the standard library; the numeric loop adds NumPy. The native examples add the pinned packages described in the bundle. Model weights are acquired separately."}</Prose>

<CodeBlock language={"shell"}>{"python -m venv .venv\n# Windows: .venv\\Scripts\\activate\n# macOS/Linux: source .venv/bin/activate\npython -m pip install -r requirements.txt\npython token_index.py"}</CodeBlock>

<Program file="token_index.py"/>

<Prose>{""}<code>{"scan"}</code>{" is the direct reference: each token walks independently. "}<code>{"traverse"}</code>{" shares byte-prefix work and reports the number of trie edges tested. "}<code>{"next_tokens"}</code>{" stores the completed destination map for a state and returns a copy so callers cannot corrupt its cache. The checks compare all three paths on every reachable state of several small grammars, including empty languages, dead states and duplicate token bytes."}</Prose>

<Prose>{"The operation count explains a mechanism, not measured latency. A trie traversal may still visit much of the vocabulary. A dense state-by-vocabulary table can consume substantial memory, and constructing the DFA can itself be expensive. Returning an allowed-ID list cheaply also does not make materializing and applying a full model-vocabulary mask free. The right representation depends on the number of states, support density, repeated requests and the execution backend."}</Prose>

<span id="4-from-scratch-implementation" aria-hidden="true"/><H2>{"6. Compile a finite contract from small parts"}</H2>

<Prose>{"An index is useful only after we have the grammar state machine. Build one for a tiny expression before compiling a record."}</Prose>

<RegularCompiler/>

<Prose>{"The expression "}<code>{"(a|b)c"}</code>{" is a tree: choose "}<code>{"a"}</code>{" or "}<code>{"b"}</code>{", then consume "}<code>{"c"}</code>{". A nondeterministic finite automaton, or NFA, turns the choice into branches that can be traversed without consuming input. Such edges are labelled epsilon. Its "}<strong>{"epsilon closure"}</strong>{" is every state reachable through zero or more of these edges. After input "}<code>{"a"}</code>{", keep all reachable NFA states, then close over epsilon edges again."}</Prose>

<Prose>{"Subset construction makes that set one DFA state. For each possible next byte, collect destinations from the current NFA states and close them; reuse an existing subset or create a new one. A subset accepts if it contains the NFA's accepting state. This makes one deterministic transition represent all possible NFA paths without choosing a branch prematurely."}</Prose>

<Program file="automata.py"/>

<Prose>{""}<code>{"literal"}</code>{", "}<code>{"charset"}</code>{", "}<code>{"sequence"}</code>{", "}<code>{"choice"}</code>{", "}<code>{"star"}</code>{", "}<code>{"plus"}</code>{" and "}<code>{"optional"}</code>{" construct the explicit expression tree. "}<code>{"NFA.build"}</code>{" creates byte and epsilon edges; "}<code>{"closure"}</code>{" uses a visited set to avoid looping forever around repetition. "}<code>{"compile_regular"}</code>{" performs a queue-like subset traversal, then reverses the transition graph to identify states that can reach acceptance. "}<code>{"advance"}</code>{" rejects missing or dead transitions. The complete main program prints the actual subsets and transitions for "}<code>{"(a|b)c"}</code>{" and checks several complete strings."}</Prose>

<Prose>{"This is a compiler for these constructors, not a parser for arbitrary regex source text. Some regex engines offer backreferences and other features that are not regular languages. Even regular subset construction can create exponentially many DFA states. The program bounds NFA size, expression depth and DFA expansion and raises an error when a budget is exceeded. A compiler error is different from proving that a language has no possible output."}</Prose>

<Prose>{"Now compose literal braces, keys, separators and finite choices for field values. All branches for one field rejoin before the next field. That avoids enumerating every complete combination of field values in advance."}</Prose>

<Program file="finite_schema.py"/>

<Prose>{""}<code>{"compile_finite_schema"}</code>{" accepts exactly a closed object whose fields are all required and have finite string or number enums. It rejects unsupported keywords and duplicate enum values, serializes escaping using Python's JSON encoder, then compiles the composition. The three species and three demonstration measurements describe nine complete records, but the compiler shares their continuations. The real-data study uses a wider shared numeric enum."}</Prose>

<Prose>{"The compiler chooses one key order, no optional whitespace and canonical numeric spellings. Thus it recognizes a "}<strong>{"serialization subset"}</strong>{" of the schema's valid values. Reordering the keys can produce a schema-valid object outside that chosen language. JSON numbers "}<code>{"8"}</code>{" and "}<code>{"8.0"}</code>{" also denote equal numeric values even if a particular serialization grammar prefers one spelling. Specify whether a tool enforces values, representations or both before comparing masks."}</Prose>

<CrossFieldToken/>

<Prose>{"A model token can contain the closing quote of one value, the comma and bytes of the next quoted key. The recognizer must follow every one of those transitions atomically. Field boundaries, grammar terminals and token boundaries are different partitions of the same byte stream. The whole-token rule from section 3 applies across all of them."}</Prose>

<H2>{"7. Remember a return point for recursive output"}</H2>

<Prose>{"A finite set of field choices was manageable with finite state. Unbounded nesting asks for a different memory structure: each new nested array must eventually return to the right parent."}</Prose>

<NestedTree/>

<Prose>{"Use the deliberately small grammar "}<code>{"value := digit | '[' value (',' value)* ']'"}</code>{". It permits a single digit or a nonempty array of values. "}<code>{"[2,[3,4]]"}</code>{" has an outer array with two children: digit 2 and an inner array. The inner array has digits 3 and 4. Reading the leaves and punctuation left to right gives the serialized output. Empty arrays, whitespace and multidigit numbers are outside this teaching grammar."}</Prose>

<ParserStack/>

<Prose>{"After the prefix "}<code>{"[2,["}</code>{", the parser owes a value inside the inner array and still remembers where to resume in the outer array. A stack frame stores the current array's phase: it needs a value, or it has a value and can take a comma or closing bracket. Opening "}<code>{"["}</code>{" pushes a frame. Finishing a digit changes the top phase. Closing "}<code>{"]"}</code>{" pops that frame and completes one value in its parent."}</Prose>

<Prose>{"Recursion allows arbitrary nesting in the mathematical grammar. A fixed-size automaton cannot remember an unbounded count of unmatched opens. A pushdown representation adds a stack; actual implementations still need a finite resource limit. Our maximum-depth failure leaves the prior state unchanged, so the caller can distinguish a resource limit from accepted output."}</Prose>

<ForkRollback/>

<Prose>{"Two continuations of "}<code>{"[2,"}</code>{" may share immutable lower frames. Branch A opens another array; branch B emits a digit. Their new top states differ, but neither modifies the common parent object. Rollback restores the snapshot from before a whole token; it must not leave the valid first byte of an ultimately invalid token behind."}</Prose>

<Program file="nested_parser.py"/>

<Prose>{""}<code>{"NestedMatcher.accept"}</code>{" checks a token against a trial state and commits only after every byte succeeds. "}<code>{"Frame"}</code>{" is immutable. "}<code>{"fork"}</code>{" shares frame references but copies the retained history list; therefore this compact Python implementation's fork cost grows with retained token history even though it shares stack frames. "}<code>{"rollback"}</code>{" restores a prior token snapshot. "}<code>{"recursive_accept"}</code>{" is an independent complete-string parser used to compare results; it is not reused by the incremental recognizer."}</Prose>

<Prose>{"Try "}<code>{"[2,]"}</code>{": the comma changes the top to “need value,” so the closing bracket is illegal. Try token "}<code>{"3x"}</code>{" after "}<code>{"[2,"}</code>{": the digit alone would be legal, but failure at "}<code>{"x"}</code>{" cancels the whole token. Forking, testing and discarding trial states is useful for token checking and branching generation, but the complete target/draft acceptance algorithm belongs to "}<a href={"/learn/path/full-curriculum/speculative-decoding?module=large-language-models"}>{"Speculative Decoding"}</a>{"."}</Prose>

<Prose>{"General JSON grammars add strings, escapes, number rules, whitespace and other values. General context-free parsing may need several active alternatives rather than this single deterministic stack. The compact parser teaches state and atomicity for its stated grammar; it is not a replacement for a full JSON engine. XGrammar's 2024 paper describes persistent pushdown state, while the pinned 0.2.8 implementation uses an Earley parser and a different current fork implementation. Do not transfer the small parser's sharing or cost claims to the current library without inspecting it."}</Prose>

<span id="9-failure-modes-gotchas" aria-hidden="true"/><H2>{"8. Connect grammar state to model state"}</H2>

<Prose>{"Grammar state answers which bytes can follow. Model state answers how likely the next token is after the chosen prefix. Both must advance consistently."}</Prose>

<GenerationLoop/>

<Prose>{"First tokenize and prefill the prompt in the language model. The output recognizer normally starts empty; the prompt's natural-language instructions are not the start of the output JSON. Read model logits, create the grammar mask for the current output state, apply the declared decoding transforms, choose one permitted token and accept it into the recognizer. Feed that selected token into the model with its KV cache before requesting the next logits. Keep these two state paths visible around the shared selected ID."}</Prose>

<Program file="constrained_loop.py"/>

<Prose>{""}<code>{"decode"}</code>{" takes a score-provider callback so every invocation receives the complete selected-ID prefix. Its executable example deliberately supplies deterministic scores; it is not a trained model. The loop checks score shape, rejects NaNs and positive infinity, masks illegal IDs and uses the exact preceding lesson's sampler. The retained example chooses "}<code>{"42"}</code>{", feeds ID 1 back and then chooses EOS. "}<code>{"completed"}</code>{" reports grammar acceptance; "}<code>{"stop_reason"}</code>{" explains why the loop ended. A token cap or cancellation can stop between the bytes of a character: after the euro prefix "}<code>{"E2"}</code>{", "}<code>{"raw_bytes_hex"}</code>{" is "}<code>{"\"e2\""}</code>{", "}<code>{"text"}</code>{" is null and "}<code>{"utf8_status"}</code>{" is "}<code>{"\"incomplete-prefix\""}</code>{". The bytes remain intact, without inventing a replacement character. Continuing with "}<code>{"82 AC"}</code>{" yields "}<code>{"€"}</code>{". UTF-8 completion and grammar acceptance are separate checks; a complete character need not finish the grammar."}</Prose>

<StopStates/>

<Prose>{"With cap zero, no output is generated. With cap one in the deterministic fixture, "}<code>{"42"}</code>{" is complete but no EOS was observed. With a sufficient cap, EOS terminates the output. A cancel check runs before the next model callback; empty finite support returns its own failure. A returned prefix must not silently become a complete application value just because control returned to the caller."}</Prose>

<Prose>{"When only one token is allowed, choosing it needs no random draw. Its bytes still affect subsequent model context. An engine might combine forced material into a later prefill or use another specialized optimization, but it must preserve the model computation for that context. Simply omitting its KV advancement changes the next-token distribution. Likewise, several forced bytes do not necessarily identify one unique tokenizer ID sequence."}</Prose>

<H2>{"9. Local legality changes the sequence distribution"}</H2>

<Prose>{"Each step above normalizes allowed next tokens. It is tempting to call the result “the original model, conditioned on producing a valid answer.” A tiny tree shows why that is generally false."}</Prose>

<FutureMass/>

<Prose>{"At the root, the model assigns probability one half to A and one half to B. Either prefix has a legal completion "}<code>{"x"}</code>{", so the grammar permits both. But after A, the model gives "}<code>{"x"}</code>{" probability 0.1; after B, it gives "}<code>{"x"}</code>{" probability 0.9. Their other continuations are illegal. Local masking keeps the root at one half each, then forces "}<code>{"x"}</code>{". Its final distribution is Ax:0.5, Bx:0.5."}</Prose>

<Prose>{"Under the original unmodified model, valid masses are "}<InlineMath>{"0.5\\times0.1=0.05"}</InlineMath>{" and "}<InlineMath>{"0.5\\times0.9=0.45"}</InlineMath>{". Conditioning its complete output on validity divides by their sum, 0.5, producing Ax:0.1 and Bx:0.9. That second policy takes into account how likely each prefix is to finish validly, not merely whether a valid suffix exists."}</Prose>

<Prose>{"For a viable prefix "}<InlineMath>{"x"}</InlineMath>{", let "}<InlineMath>{"h(x)"}</InlineMath>{" be the model probability of eventually completing validly from there, under a defined stopping policy. The globally conditioned next-token probability is proportional to "}<InlineMath>{"p(v\\mid x)h(xv)"}</InlineMath>{"; its normalization is "}<InlineMath>{"h(x)"}</InlineMath>{" when that quantity is positive. Ordinary grammar masking replaces the future probability by a binary viability indicator. Computing the actual future mass can require exploring a very large completion tree."}</Prose>

<Program file="conditioning.py"/>

<Prose>{"The program uses exact rational arithmetic to enumerate both distributions. Equal future masses make the two root choices agree. If A's legal continuation has zero model probability, local selection of A can fail even though the grammar says it is viable. The program retains that failure mass rather than silently retrying another root branch. If both future masses are zero, conditioning on validity is undefined. The live tree exposes all of these cases."}</Prose>

<Prose>{"Grammar-Aligned Decoding studies this distinction and methods for approximating the future-aware distribution. This example establishes the probability issue; it does not implement the paper's ASAp algorithm. For many applications, guaranteed structure under a declared local policy is the desired contract. It still helps to know which distribution is actually being sampled."}</Prose>

<span id="5-production-implementation" aria-hidden="true"/><H2>{"10. Use ordinary Outlines and XGrammar APIs"}</H2>

<Prose>{"The scratch mechanisms expose the operations. Library integrations provide a larger tokenizer and grammar implementation while preserving the same boundaries."}</Prose>

<LibraryOwnership/>

<Prose>{"Outlines wraps a model, an output type and a selected constraint backend in a "}<code>{"Generator"}</code>{". It can use different backends, including XGrammar in supported configurations; the two names are not mutually exclusive categories. In the retained example we choose "}<code>{"outlines_core"}</code>{" explicitly. The pinned Outlines 1.3.3 Generator returns text. Parse and validate that text before treating it as an application object."}</Prose>

<Prose>{"For the model already loaded by the complete program, the ordinary route is "}<code>{"outlines.from_transformers(model, tokenizer)"}</code>{", followed by "}<code>{"outlines.Generator(wrapped, outlines.types.JsonSchema(schema, whitespace_pattern=\"\"), backend=\"outlines_core\")"}</code>{". Call the resulting generator with the prompt and explicit generation configuration. The full program below also captures the returned token IDs without making a second generation call, then confirms the returned text matches their decoding."}</Prose>

<RequestState/>

<Prose>{"XGrammar separates tokenizer information, compilation and mutable matching. Compile a reusable grammar with "}<code>{"GrammarCompiler"}</code>{"; construct a fresh "}<code>{"GrammarMatcher"}</code>{" per active request. A token bitmask has one position per actual model output ID. Fill it from the current matcher, apply it to logits, choose a token and accept the token. Two requests using the same compiled grammar must not share one mutable progress state. Resetting or rolling back one request must leave the other untouched."}</Prose>

<Program file="native_matchers.py"/>

<Prose>{"This complete native example uses the same five visible token spellings as the earlier decimal machine and an output width padded to eight IDs. Initial allowed IDs are "}<code>{"[1,2]"}</code>{"; after "}<code>{"42"}</code>{", they are "}<code>{"[1,2,4]"}</code>{". A fork accepts EOS without terminating the original matcher. Rollback returns the original to its initial state. Rejecting whole token "}<code>{"3x"}</code>{" preserves the prior mask. The padded IDs remain unavailable."}</Prose>

<NativeMaskTrace/>

<Prose>{"These are recorded outputs from XGrammar 0.2.8, not a browser simulation of the native package. Inspect completion and termination beside each transition. "}<code>{"is_completed()"}</code>{" means the consumed text can finish; "}<code>{"is_terminated()"}</code>{" follows an accepted stop token. The pinned Hugging Face logits processor consumes a newly generated token at its next invocation, so its last internal state after "}<code>{"generate"}</code>{" need not yet reflect final EOS. The study also replays every saved response through the manual XGrammar "}<strong>{"schema"}</strong>{" matcher. Its original "}<code>{"completed"}</code>{" and "}<code>{"terminated"}</code>{" fields describe that one replay language for every arm. The evaluator names them "}<code>{"xgrammar_schema_replay_completed"}</code>{" and "}<code>{"xgrammar_schema_replay_terminated"}</code>{". They do not report the Outlines or generic-JSON backend’s internal final state. For example, all twelve Outlines responses have recorded EOS status and independently valid values, while both manual-schema replay flags are false because that recognizer rejects their serialization. Read the recorded EOS/cap status, replay state and independent value checks separately."}</Prose>

<Prose>{"Schema support is configuration-sensitive. In the pinned XGrammar API, the default declared-order route enforces the selected required fields; the inspected "}<code>{"any_order=True"}</code>{" mode has documented required-field/uniqueness caveats. A backend accepting a schema argument is not evidence that it enforces every keyword. Check the installed version, exact options, unsupported-keyword failures and independent validation for the schema you use. Structural constraints also do not authorize a tool call or its side effects; that application decision remains outside generation."}</Prose>

<H2>{"11. Compare actual outputs on a fixed extraction task"}</H2>

<Prose>{"The most useful evaluation now asks three separate questions of the same recorded outputs. The data source is UCI Iris, adapted into extraction prompts rather than used for its original classification task."}</Prose>

<ExtractionRecord/>

<Prose>{"Twelve prompts use original rows 0–3, 50–53 and 100–103: four per species. Each prompt states sepal length and species. A shared schema requires "}<code>{"species"}</code>{" from the same three-name enum and "}<code>{"sepal_cm"}</code>{" from the same 41 numeric values, 4.0–8.0 in tenths. Source row 0 asks for setosa and 5.1. The retained manual XGrammar output is "}<code>{"{\"species\":\"setosa\",\"sepal_cm\":8}"}</code>{"; the Outlines output spells the same wrong measurement as "}<code>{"8.0"}</code>{". Generic JSON returns "}<code>{"[]"}</code>{". The viewer keeps the full raw text, selected IDs, stop reason and independent check results together."}</Prose>

<Program file="prepare_data.py"/>

<Prose>{""}<code>{"prepare_data.py"}</code>{" verifies the archived UCI ZIP hash, reads all 150 original records and selects the fixed indices. It writes prompts and a separate gold record. The schema is global; the correct measurement is never used to create a per-row grammar. The dataset's CC BY 4.0 attribution and original archive are included. A source correction or changed archive should fail the hash guard rather than quietly change the experiment."}</Prose>

<Program file="generate_native.py"/>

<Prose>{"The complete program pins Pythia-14M revision "}<code>{"cf967c0a9a04383db6f7b1108d86b2962634b4ac"}</code>{", local weights and tokenizer identity. Its prepare stage records model files, program hash, package versions, prompts, schema and settings before generation. Four arms then use the same frozen model, greedy decoding and cap of 48 new tokens: ordinary unconstrained Transformers, generic JSON with the XGrammar Hugging Face processor, manual cached schema/XGrammar, and ordinary schema/Outlines-Core."}</Prose>

<Prose>{"The manual route shows the complete prefill and cached single-token loop. "}<code>{"TokenizerInfo.from_huggingface"}</code>{" receives the model output vocabulary size; a fresh matcher and mask belong to each response. The ordinary routes call the public generation APIs. All routes save prompt IDs, generated IDs, exact decoded text, stopping status and observed CPU duration. A started record with no completed result prevents silent re-execution; completed records are reused only with matching protocol identity."}</Prose>

<PairedOutcomes/>

<Prose>{"The actual run used CPU float32, two Torch threads, evaluation mode, one beam and no weight updates. All 48 calls completed without an execution error. The twelve unconstrained responses reached the token cap and none parsed as JSON. All twelve generic-JSON outputs parsed, but none matched the object schema. With exact decimal values, five manual-XGrammar outputs and twelve Outlines outputs satisfy the selected schema. The original float-parser validator accepted twelve in each schema arm; its different result is retained separately. Every arm had zero exact two-field extractions."}</Prose>

<NeuralTable caption={"11. Compare actual outputs on a fixed extraction task"} headers={[<>{"Recorded arm"}</>,<>{"Strict JSON"}</>,<>{"Selected schema"}</>,<>{"Both fields equal source"}</>]} rows={[[<>{"Unconstrained Transformers"}</>,<>{"0/12"}</>,<>{"0/12"}</>,<>{"0/12"}</>],[<>{"Generic JSON, XGrammar/HF"}</>,<>{"12/12"}</>,<>{"0/12"}</>,<>{"0/12"}</>],[<>{"Schema, manual XGrammar"}</>,<>{"12/12"}</>,<>{"5/12"}</>,<>{"0/12"}</>],[<>{"Schema, Outlines-Core"}</>,<>{"12/12"}</>,<>{"12/12"}</>,<>{"0/12"}</>]]} />

<Program file="evaluate.py"/>

<Prose>{""}<code>{"strict_json"}</code>{" rejects duplicate keys and non-JSON numeric constants and parses decimal numbers with "}<code>{"Decimal"}</code>{". "}<code>{"assess"}</code>{" applies a Draft 2020-12 validator with the schema’s exact decimal values, then compares the complete value with the source fields. The table’s schema column uses this exact-number check. The separately reported "}<code>{"float_schema"}</code>{" check reproduces the original float-based evaluation. Both read the same saved texts without calling the model; errors and capped responses remain in the denominator."}</Prose>

<Prose>{"Seven manual outputs, including source row 2, contain "}<code>{"5.0999999999999996"}</code>{". Python’s float parser rounds that spelling to the same binary value as "}<code>{"5.1"}</code>{"; exact decimal parsing preserves the difference. The declared enum contains exact tenths, so those seven values fall outside it. In contrast, "}<code>{"8"}</code>{" and "}<code>{"8.0"}</code>{" are mathematically equal. JSON Schema defines numeric equality by mathematical value and separates that model from host-parser limitations ("}<a href={"https://json-schema.org/draft/2020-12/json-schema-core#section-4.2.2)"}>{"Core §§4.2.2 and 6.2"}</a>{". This is an observed backend/validator boundary, not a corrected generation or a claim that the model extracted the right fact."}</Prose>

<Prose>{"These observations demonstrate the integration and its limitations on this small weak-model extraction exercise. They do not estimate accuracy on a representative workload, rank current engines or show that constraints cannot help a stronger model. Different valid numeric spellings in the two schema backends also show that “same schema” does not guarantee identical token-level serialization policies. The stored durations are single serial CPU observations including each route's work, with shared setup recorded separately; they are not serving or GPU benchmarks."}</Prose>

<span id="8-what-scales-and-what-doesn-t" aria-hidden="true"/><H2>{"12. Explain overhead with the actual work"}</H2>

<Prose>{"A grammar can save retries while also adding compilation, state and mask work. Determine which work is repeated before assuming the constraint is cheap or expensive."}</Prose>

<AdaptiveMask/>

<Prose>{"In a parser rule, some token bytes can be accepted or rejected using only local rule state. Other tokens cross a rule boundary and need the caller's continuation. For a rule that accepts "}<code>{"a"}</code>{" and returns to a caller expecting "}<code>{"b"}</code>{", token "}<code>{"a"}</code>{" can finish the rule locally, token "}<code>{"x"}</code>{" is rejected locally, and token "}<code>{"ab"}</code>{" requires the return context. Change the caller to expect "}<code>{"c"}</code>{": the classification of "}<code>{"a"}</code>{" and "}<code>{"x"}</code>{" stays the same, while the boundary-crossing decision changes."}</Prose>

<Prose>{"The XGrammar paper's adaptive cache separates these categories, reuses context-independent decisions and spends runtime parser work on dependent ones. It also discusses efficient representations and overlap. These are mechanisms from the published architecture; the current public API's behavior and internal parser version are documented separately in section 10. A vocabulary bitset of width 50,304 occupies 6,288 bytes when packed into 32-bit words. A list of 100 four-byte IDs occupies 400 bytes before container metadata or transition payloads. The smaller representation depends on density and operations, not only those two numbers."}</Prose>

<OverlapTimeline/>

<Prose>{"With supplied model work of 8 ms, mask work of 3 ms and a 1 ms synchronization/transfer step, serial execution takes 12 ms. If the first two pieces are truly independent and overlap perfectly, the critical path is "}<code>{"max(8,3)+1 = 9 ms"}</code>{". The saved model state and selected token determine whether such overlap is available. These are constructed durations for reading a dependency diagram; no GPU timing was measured here. Changing mask work above model work changes the bottleneck."}</Prose>

<CompileAmortization/>

<Prose>{"Suppose baseline generation costs 20 ms, structural failure probability is 0.1 on independent attempts, grammar compilation costs 12 ms once, and matching adds 1 ms per successful constrained request. Assume the constrained route always completes structurally and compare only structural retries. For "}<InlineMath>{"R"}</InlineMath>{" requests, retry work is "}<InlineMath>{"20R/(1-0.1)"}</InlineMath>{", while constrained work is "}<InlineMath>{"12+21R"}</InlineMath>{". Constrained work is smaller when "}<InlineMath>{"R>108/11"}</InlineMath>{", so the first integer crossover is 10 requests. At zero failure probability there is no crossover under these inputs."}</Prose>

<Program file="costs.py"/>

<Prose>{""}<code>{"amortization"}</code>{" exposes all five supplied inputs and returns no threshold when per-request savings are nonpositive. "}<code>{"overlap"}</code>{" computes a declared critical path; "}<code>{"mask_storage"}</code>{" counts payload bytes. None are calibrated timing predictions. Real request latency also depends on queueing, batches, mask transfer and output length. Factual errors may still need application handling, and unsupported or empty languages may fail before any generation. Reuse compiled grammars where appropriate, isolate per-request state and measure the full workload before choosing a serving configuration."}</Prose>

<span id="7-decision-matrix" aria-hidden="true"/><H2>{"13. Choose the contract and debug the first broken boundary"}</H2>

<Prose>{"Return to the original record. We can now locate the failure rather than changing a random generation knob."}</Prose>

<ContractDecision/>

<Prose>{"A fixed choice or simple finite pattern can use a finite recognizer. Nested structures need recursive state or an equivalent bounded representation. A schema describes permitted values and may require a backend-specific serialization language. Source fidelity, valid calendar dates, cross-field business rules and authorized actions need checks tied to their actual semantics. A regex-shaped date such as "}<code>{"2026-02-31"}</code>{" illustrates why character structure alone cannot settle an application rule."}</Prose>

<Prose>{"If no legal token remains, inspect the current prefix, token bytes, grammar state, model finite scores and transform order. If the text is incomplete, inspect cap, cancellation and EOS policy. If the native matcher accepts but the independent validator rejects, inspect schema support, serialization options and integration. If every structural check passes but a field is wrong, inspect source interpretation and the application's factual check. Increasing the grammar budget cannot make a missing source fact appear."}</Prose>

<Prose>{"The progression matters: source value → representation → viable prefix → whole token bytes → mask → chosen token → parser and model advancement → complete output → independent validation. Keep the source and result visible when diagnosing a real system. "}<a href={"/learn/path/full-curriculum/continuous-batching-pagedattention?module=large-language-models"}>{"Continuous Batching"}</a>{" adds concurrent requests; "}<a href={"/learn/path/full-curriculum/inference-engines-serving?module=large-language-models"}>{"Inference Engines & Serving"}</a>{" places these contracts inside a deployed stack. Preserve each request's grammar state when making either transition."}</Prose></section><section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><span id="11-self-check-exercises" aria-hidden="true"/><H2>{"Practice"}</H2><Prose>{"Each task has a hint and a worked solution. The complete "}<code>{"practice.py"}</code>{" checks the finite calculations with fresh values; it makes no model calls."}</Prose><section className="cd-practice" data-lesson-exercise><H3>{"1. Separate the three checks"}</H3>

<Prose>{"A source says “species versicolor, sepal length 6.4 cm.” Classify "}<code>{"{\"species\":\"versicolor\"}"}</code>{", "}<code>{"{\"species\":\"versicolor\",\"sepal_cm\":7.2}"}</code>{" and "}<code>{"{\"species\":versicolor,\"sepal_cm\":6.4}"}</code>{" under the shared study schema."}</Prose><details><summary>Hint</summary><Prose>{" stop at the first failed boundary, but do not equate a later untested boundary with success."}</Prose></details><details><summary>Worked solution</summary><Prose>{" the first parses but misses required "}<code>{"sepal_cm"}</code>{"; the second parses and satisfies the selected schema, but is factually wrong; the third fails parsing because "}<code>{"versicolor"}</code>{" lacks string quotes. Adding the source measurement to the grammar for this one row would leak the answer rather than evaluate extraction."}</Prose></details></section><section className="cd-practice" data-lesson-exercise><H3>{"2. Decide whether EOS is allowed"}</H3>

<Prose>{"For the decimal language, examine prefixes "}<code>{"8"}</code>{", "}<code>{"8."}</code>{", "}<code>{".8"}</code>{" and "}<code>{"8.0"}</code>{". Which are viable, accepting and eligible for EOS?"}</Prose><details><summary>Hint</summary><Prose>{" a decimal point must follow at least one digit and must itself be followed by a digit."}</Prose></details><details><summary>Worked solution</summary><Prose>{" "}<code>{"8"}</code>{" and "}<code>{"8.0"}</code>{" are viable and accepting, so EOS is legal. "}<code>{"8."}</code>{" is viable but not accepting, so EOS is illegal. "}<code>{".8"}</code>{" is dead. A cap after "}<code>{"8"}</code>{" is complete text without an observed EOS; a cap after "}<code>{"8."}</code>{" is incomplete."}</Prose></details></section><section className="cd-practice" data-lesson-exercise><H3>{"3. Reject an entire token"}</H3>

<Prose>{"At prefix "}<code>{"5."}</code>{", candidate tokens emit "}<code>{"23"}</code>{", "}<code>{"2x"}</code>{" and "}<code>{"."}</code>{". What survives, and what state should remain after testing the rejected token "}<code>{"2x"}</code>{"?"}</Prose><details><summary>Hint</summary><Prose>{" walk both bytes before committing."}</Prose></details><details><summary>Worked solution</summary><Prose>{" "}<code>{"23"}</code>{" survives and ends in an accepting fraction state. "}<code>{"2x"}</code>{" fails on its second byte; "}<code>{"."}</code>{" fails immediately. Testing either rejected token leaves the original dot state unchanged. Add these cases to "}<code>{"TokenIndex.scan"}</code>{" comparisons or "}<code>{"NestedMatcher.accept"}</code>{" atomicity checks as appropriate; the grammar types differ, but the whole-token commitment rule is the same."}</Prose></details></section><section className="cd-practice" data-lesson-exercise><H3>{"4. Recalculate masked mass"}</H3>

<Prose>{"Token probabilities are "}<code>{"(0.4, 0.3, 0.2, 0.1)"}</code>{". Only IDs 1 and 3 are legal. Find their normalized probabilities and the model mass removed."}</Prose><details><summary>Hint</summary><Prose>{" the denominator is 0.4."}</Prose></details><details><summary>Worked solution</summary><Prose>{" ID 1 receives "}<code>{"0.3/0.4 = 3/4"}</code>{", ID 3 receives "}<code>{"0.1/0.4 = 1/4"}</code>{", and 0.6 of the original mass is removed. The model's original likelihood of the selected token and the constrained sampling probability are different quantities."}</Prose></details></section><section className="cd-practice" data-lesson-exercise><H3>{"5. Diagnose filter order"}</H3>

<Prose>{"Use the same probabilities and legality as task 4. Compare top-k2 before and after grammar masking."}</Prose><details><summary>Hint</summary><Prose>{" write the surviving IDs after each operation."}</Prose></details><details><summary>Worked solution</summary><Prose>{" top-k2 first retains 0 and 1; the grammar removes 0, leaving ID 1 with probability 1. Grammar first retains 1 and 3; top-k2 then removes neither, leaving probabilities 3/4 and 1/4. Both routes are structurally legal, but they sample different distributions. Name the intended order explicitly."}</Prose></details></section><section className="cd-practice" data-lesson-exercise><H3>{"6. Follow an epsilon closure"}</H3>

<Prose>{"Compile "}<code>{"sequence(optional(literal('a')), literal('b'))"}</code>{". Which of "}<code>{"''"}</code>{", "}<code>{"'a'"}</code>{", "}<code>{"'b'"}</code>{", "}<code>{"'ab'"}</code>{", "}<code>{"'aab'"}</code>{" are accepted? Why must the initial closure include both taking and skipping the optional branch?"}</Prose><details><summary>Hint</summary><Prose>{" optional means a choice between the literal and the empty string."}</Prose></details><details><summary>Worked solution</summary><Prose>{" only "}<code>{"b"}</code>{" and "}<code>{"ab"}</code>{" are accepted. Before consuming input, the NFA can wait for "}<code>{"a"}</code>{" or skip directly to the following "}<code>{"b"}</code>{". The DFA initial subset retains both possibilities. After "}<code>{"a"}</code>{", it needs "}<code>{"b"}</code>{"; after "}<code>{"b"}</code>{", it accepts. Run this AST in "}<code>{"automata.py"}</code>{" and compare with "}<code>{"re.fullmatch(b'a?b', data)"}</code>{"."}</Prose></details></section><section className="cd-practice" data-lesson-exercise><H3>{"7. Count shared byte edges"}</H3>

<Prose>{"Vocabulary entries are "}<code>{"do"}</code>{", "}<code>{"dog"}</code>{", "}<code>{"dot"}</code>{", "}<code>{"cat"}</code>{". A grammar accepts every byte of these entries. Compare naive complete-token byte transitions with trie edge visits, excluding construction and EOS."}</Prose><details><summary>Hint</summary><Prose>{" count the common "}<code>{"d→o"}</code>{" path once in the trie."}</Prose></details><details><summary>Worked solution</summary><Prose>{" naive work is "}<code>{"2+3+3+3 = 11"}</code>{" byte transitions. The trie has "}<code>{"d,o,g,t,c,a,t"}</code>{" along its distinct paths, for 7 edges. This is an operation count, not a speedup prediction. Early grammar rejection could prune a whole subtree and change both counts."}</Prose></details></section><section className="cd-practice" data-lesson-exercise><H3>{"8. Keep UTF-8 bytes intact"}</H3>

<Prose>{"The pound sign is UTF-8 "}<code>{"C2 A3"}</code>{". Compare token splits "}<code>{"[C2],[A3]"}</code>{", "}<code>{"[C2 A3]"}</code>{" and "}<code>{"[A3],[C2]"}</code>{" for a grammar accepting exactly that sign."}</Prose><details><summary>Hint</summary><Prose>{" matching is over concatenated bytes, not how a partial token renders alone."}</Prose></details><details><summary>Worked solution</summary><Prose>{" the first two tokenizations reach the same accepting byte string. The reversed order fails at "}<code>{"A3"}</code>{". An intermediate "}<code>{"C2"}</code>{" state is viable but incomplete. Test the literal with "}<code>{"compile_regular(literal('£'))"}</code>{"; do not substitute a replacement character for the partial first token."}</Prose></details></section><section className="cd-practice" data-lesson-exercise><H3>{"9. Trace recursive frames"}</H3>

<Prose>{"For "}<code>{"[[4],5]"}</code>{", list stack depth after each byte. Explain why "}<code>{"[4,]"}</code>{" is rejected."}</Prose><details><summary>Hint</summary><Prose>{" a comma changes the current frame from “after” to “need.”"}</Prose></details><details><summary>Worked solution</summary><Prose>{" depths are "}<code>{"1,2,2,1,1,1,0"}</code>{". The inner close finishes one value in the outer frame; the final close completes the whole output. In "}<code>{"[4,]"}</code>{", the close appears when a value is required. Run the byte trace in "}<code>{"nested_parser.py"}</code>{" with the changed input."}</Prose></details></section><section className="cd-practice" data-lesson-exercise><H3>{"10. Isolate branches and rollback"}</H3>

<Prose>{"Fork a matcher after "}<code>{"[6,"}</code>{". Let A accept "}<code>{"[1]"}</code>{", and B accept "}<code>{"2"}</code>{". Can either branch close the outer array? What does one-token rollback of A restore?"}</Prose><details><summary>Hint</summary><Prose>{" rollback counts accepted tokens, not individual bytes within a token."}</Prose></details><details><summary>Worked solution</summary><Prose>{" both can accept "}<code>{"]"}</code>{" and finish. If "}<code>{"[1]"}</code>{" was one accepted token, rolling A back once restores the original "}<code>{"[6,"}</code>{" state, not the state after its last inner byte. B and the original are unchanged because frames are immutable and each history belongs to its request. Extend the branch-isolation checks with those exact tokens."}</Prose></details></section><section className="cd-practice" data-lesson-exercise><H3>{"11. Compare local and global conditioning"}</H3>

<Prose>{"The model chooses C with probability 0.3 and D with 0.7. Their valid future masses are 0.8 and 0.2. Find local terminal probabilities and the model distribution conditioned on validity."}</Prose><details><summary>Hint</summary><Prose>{" unmodified valid masses are 0.24 and 0.14."}</Prose></details><details><summary>Worked solution</summary><Prose>{" local masking yields 0.3 and 0.7 when each legal second step has positive support. Global conditioning divides by 0.38, giving C "}<code>{"12/19"}</code>{" and D "}<code>{"7/19"}</code>{". The ranking reverses. Change "}<code>{"conditioning.compare"}</code>{" inputs to those fractions and check the exact result."}</Prose></details></section><section className="cd-practice" data-lesson-exercise><H3>{"12. Interpret a capped native response"}</H3>

<Prose>{"A saved response ends with an accepting object at the token cap, without EOS. A second response ends after an open quoted string. How should the application record and validate them?"}</Prose><details><summary>Hint</summary><Prose>{" termination, grammar acceptance and application acceptance are separate fields."}</Prose></details><details><summary>Worked solution</summary><Prose>{" both have stop reason "}<code>{"cap"}</code>{" and no observed termination. The first can be complete and can proceed to independent parsing/schema/application checks if the application's cap policy permits it. The second is incomplete and must not be parsed as a complete record. Do not append fabricated closing characters or report EOS that was never observed."}</Prose></details></section><section className="cd-practice" data-lesson-exercise><H3>{"13. Design an extraction comparison"}</H3>

<Prose>{"You evaluate three constraint policies on ten source records. One policy errors on two records and extracts six of the remaining eight exactly. Report task success, and identify why compiling each record's correct field values into its grammar invalidates the comparison."}</Prose><details><summary>Hint</summary><Prose>{" preserve the requested-record denominator."}</Prose></details><details><summary>Worked solution</summary><Prose>{" exact success is "}<code>{"6/10 = 60%"}</code>{", with two execution failures reported separately. "}<code>{"6/8 = 75%"}</code>{" describes only completed calls and overstates total task success if used alone. Per-record gold constraints disclose the desired answer to one arm. Keep one declared domain/schema across records and provide gold only to the offline evaluator."}</Prose></details></section><section className="cd-practice" data-lesson-exercise><H3>{"14. Derive a new compilation crossover"}</H3>

<Prose>{"Compilation costs 15 ms, baseline generation 30 ms, matching adds 2 ms, and independent structural failure probability is 0.2. Under the assumptions of section 12, at which first integer request count does constrained work win? What if failure is zero?"}</Prose><details><summary>Hint</summary><Prose>{" compare "}<code>{"15+32R"}</code>{" with "}<code>{"37.5R"}</code>{"."}</Prose></details><details><summary>Worked solution</summary><Prose>{" "}<code>{"5.5R > 15"}</code>{", so "}<code>{"R > 30/11"}</code>{"; the first integer count is 3. With zero structural failures, baseline work is "}<code>{"30R"}</code>{", below "}<code>{"15+32R"}</code>{" for every nonnegative R. Neither calculation includes queues, factual retries or a guarantee that the constraint will finish within its cap."}</Prose>

<Program file="practice.py"/></details></section></section><section><H2>{"Summary"}</H2>

<Prose>{"Constrained decoding maintains a viable output prefix while the model chooses among legal token IDs. Entire raw token bytes must pass the recognizer before state commits. A finite grammar can reuse DFA/token rows; recursive output needs state that remembers nested continuations. The parser and model cache advance together, and completion, EOS, caps and cancellation remain distinct."}</Prose>

<Prose>{"Local masking enforces the selected language under its declared conditions, but it generally changes the sequence distribution and does not supply factual knowledge. The actual twelve-record study demonstrates that distinction: the exact-number schema check accepts five manual-XGrammar outputs and twelve Outlines outputs, while none copied both fields correctly. The original float-validator acceptance of all twelve manual outputs exposes a further numeric representation boundary. Validate the resulting value independently and measure the full application contract."}</Prose>

</section><section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources"><H2>{"Programs and saved results"}</H2><ul><li><a href="/learn/examples/constrained-decoding/token_index.py" download>token_index.py</a></li><li><a href="/learn/examples/constrained-decoding/automata.py" download>automata.py</a></li><li><a href="/learn/examples/constrained-decoding/finite_schema.py" download>finite_schema.py</a></li><li><a href="/learn/examples/constrained-decoding/nested_parser.py" download>nested_parser.py</a></li><li><a href="/learn/examples/constrained-decoding/constrained_loop.py" download>constrained_loop.py</a></li><li><a href="/learn/examples/constrained-decoding/conditioning.py" download>conditioning.py</a></li><li><a href="/learn/examples/constrained-decoding/native_matchers.py" download>native_matchers.py</a></li><li><a href="/learn/examples/constrained-decoding/prepare_data.py" download>prepare_data.py</a></li><li><a href="/learn/examples/constrained-decoding/generate_native.py" download>generate_native.py</a></li><li><a href="/learn/examples/constrained-decoding/evaluate.py" download>evaluate.py</a></li><li><a href="/learn/examples/constrained-decoding/costs.py" download>costs.py</a></li><li><a href="/learn/examples/constrained-decoding/practice.py" download>practice.py</a></li><li><a href="/learn/examples/constrained-decoding/sampling.py" download>sampling.py</a></li><li><a href="/learn/examples/constrained-decoding/README.md" download>README.md</a></li><li><a href="/learn/examples/constrained-decoding/requirements.txt" download>requirements.txt</a></li><li><a href="/learn/examples/constrained-decoding/files.json" download>files.json</a></li><li><a href="/learn/examples/constrained-decoding/constrained-decoding.zip" download>constrained-decoding.zip</a></li></ul>

<Prose>{"The "}<a href={"/learn/examples/constrained-decoding/constrained-decoding.zip"}>{"complete example bundle"}</a>{" includes all twelve displayed programs, the exact reused sampler, pinned requirements, an environment guide, dataset attribution, the original UCI archive, actual native masks, the fixed protocol and all 48 recorded outputs. "}<code>{"README.md"}</code>{" separates finite exercises, saved-output evaluation and a new pretrained run. Run "}<code>{"evaluate.py"}</code>{" on the included study to inspect results without generating again. The library/model programs are complete examples, while the browser labs recompute small finite mechanisms or inspect saved native data."}</Prose>

</section><section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning"><H2>{"Further learning"}</H2>

<ul><li>{""}<a href={"https://web.stanford.edu/class/archive/cs/cs103/cs103.1254/lectures/14/Condensed%20Lecture%20Slides.pdf"}>{"Stanford CS103: Finite Automata"}</a>{" develops state as memory, transition diagrams and accepting states. Use it when the DFA in sections 2 and 6 needs a slower formal-language introduction."}</li><li>{""}<a href={"https://craftinginterpreters.com/representing-code.html"}>{"Crafting Interpreters: Representing Code"}</a>{" explains grammar rules, recursive composition and syntax trees. Its early grammar discussion supports the tree-to-stack transition in section 7; interpreter evaluation is a separate later subject."}</li><li>{""}<a href={"https://dottxt-ai.github.io/outlines/latest/features/core/generator/"}>{"Outlines Generator guide"}</a>{" explains the model/type/backend composition used by the ordinary route. Pair it with the "}<a href={"https://dottxt-ai.github.io/outlines/latest/features/models/transformers/"}>{"Transformers guide"}</a>{" and check the pinned installed version before copying API calls."}</li><li>{""}<a href={"https://xgrammar.mlc.ai/docs/latest/using_xgrammar/engine_integration.html"}>{"XGrammar engine integration"}</a>{" connects compilation, per-request matcher state and token bitmasks. Its "}<a href={"https://xgrammar.mlc.ai/docs/latest/using_xgrammar/runtime_safeguards.html"}>{"runtime safeguards"}</a>{" extend the resource and failure boundaries introduced here."}</li></ul>

</section><section className="lesson-ending lesson-ending--references" data-lesson-ending="references"><span id="10-primary-sources" aria-hidden="true"/><H2>{"Technical references"}</H2>

<ul><li>{""}<a href={"https://www.rfc-editor.org/rfc/rfc8259"}>{"RFC 8259: JSON"}</a>{" defines JSON values, strings and numbers. "}<a href={"https://json-schema.org/understanding-json-schema/reference/object"}>{"JSON Schema's object reference"}</a>{" explains properties, required fields and additional properties; a backend's support remains a separate implementation question."}</li><li>{""}<a href={"https://arxiv.org/abs/2307.09702"}>{"Willard and Louf, Efficient Guided Generation (2023)"}</a>{" develops vocabulary indexing for finite-state constraints and the parser boundary. Its historical timings and API examples are not treated as measurements of the current installed packages."}</li><li>{""}<a href={"https://arxiv.org/abs/2411.15100"}>{"Dong et al., XGrammar (2024)"}</a>{" explains adaptive token-mask caching, parser-state sharing and overlap. Read its mechanism alongside the pinned current API; the runtime parser implementation has changed since that paper."}</li><li>{""}<a href={"https://arxiv.org/abs/2405.21047"}>{"Park et al., Grammar-Aligned Decoding (2024)"}</a>{" distinguishes locally masked generation from the original model conditioned on a valid complete output. Section 9's exact tree isolates that issue without claiming to reproduce the paper's full method."}</li><li>{""}<a href={"https://xgrammar.mlc.ai/docs/latest/defining_structures/json_generation.html"}>{"XGrammar JSON generation"}</a>{" and "}<a href={"https://xgrammar.mlc.ai/docs/latest/api/python/grammar_matcher.html"}>{"matcher API"}</a>{" describe schema options, lifecycle and completion. The retained native examples used XGrammar 0.2.8, Outlines 1.3.3, Outlines-Core 0.2.14 and Transformers 5.19.0 on CPU Torch 2.14.0."}</li><li>{""}<a href={"https://archive.ics.uci.edu/dataset/53/iris"}>{"UCI Iris"}</a>{", DOI "}<a href={"https://doi.org/10.24432/C56C76"}>{"10.24432/C56C76"}</a>{", supplies the attributed source rows under CC BY 4.0. The extraction adaptation, fixed row indices, prompts and recorded results are included with the examples."}</li></ul></section></div>;}
export default {title:'Structured Output & Constrained Decoding (Outlines, XGrammar)',slug:'constrained-decoding',readTime:'~75 min read + 75 min practice',content:ConstrainedDecodingLesson};
