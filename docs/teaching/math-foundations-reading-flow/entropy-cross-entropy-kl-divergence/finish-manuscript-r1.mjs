import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const folder=path.join(path.dirname(fileURLToPath(import.meta.url)),'content-prepared');
let text=fs.readFileSync(path.join(folder,'manuscript-r1.md'),'utf8');
const replace=(old,next)=>{if(text.split(old).length!==2)throw Error('Not unique '+old.slice(0,90));text=text.replace(old,next);};
const maxBlock='[[PROGRAM:maximum]]\n\nThe programme visits the two endpoints and the proposed optimum and verifies the same identity numerically. A small cleanup handles floating subtraction near an exact zero in this fixed fixture. Such cleanup is not a replacement for feasibility checks in an arbitrary solver: normalization and the specified mean must both hold.\n\n';
text=text.replaceAll('\r\n','\n');
replace(maxBlock,'');
replace('A moment constraint fixes the expected log price',maxBlock+'A moment constraint fixes the expected log price');
replace('The complete programme below deliberately validates distributions before calling it, then compares the same quantities with direct sums. Its later rows supply the conditional example we will use in section6.\n\n[[PROGRAM:information_library.py]]','For the four-outcome vectors already defined, the calls are `h = entropy(p, base=2)` and `d = entropy(p, q, base=2)` after importing `entropy` from `scipy.stats`. The direct helper above supplies a strict validation contract. The [complete library programme in section6](#information-library-py) validates inputs, compares the finite sums and then applies the same API to conditional rows once we have learned that operation.');
replace('For the four statuses, both routes give','For the four statuses, these two routes give');
const conditionalTail='[[PROGRAM:conditional]]';
// The existing conditional programme remains in its original explained position.
if(!text.includes(conditionalTail))throw Error('Missing conditional programme');
const boundary='## 7. Compute and interpret log loss';
replace(boundary,'The full library comparison below now joins the two calculations. Its first part compares the four-status H, CE and KL from section4. Its `conditional` array has two rows, each summing to one; `axis=1` computes one entropy for each row. The context vector then weights those two values. Multiplying `context[:, None]` by the row matrix reconstructs the joint table, so a direct joint-weighted sum checks the same operation through a different arrangement. The three context settings expose the unequal-cost case, the equal-context null and the zero-context limit.\n\n<a id="information-library-py"></a>\n\n[[PROGRAM:information_library.py]]\n\nThe validator rejects weights before an automatic API normalization can change their meaning. Boolean selection keeps zero source probabilities out of logarithms. The direct KL uses separate logs; it does not first divide two tiny probabilities. This finite calculation takes linear work in the number of joint cells; array broadcasting changes the arrangement of the arithmetic, not the probability law.\n\n'+boundary);
const programmes=JSON.parse(fs.readFileSync(path.join(folder,'preserved-programmes.json'),'utf8'));
const extra={
 'information_library.py':{filename:'information_library.py',source:'programmes/information_library.py',output:'outputs/information_library.py.display.txt',note:'Python 3.12.14, NumPy 2.3.5 and SciPy 1.18.1. The numerical calculation was executed once; scalar display formatting was subsequently simplified without changing the computed values.'},
 'penguins_log_loss.py':{filename:'penguins_log_loss.py',source:'programmes/penguins_log_loss.py',output:'outputs/penguins_log_loss.py.stdout.txt',note:'Executed with Python 3.12.14, NumPy 2.3.5 and SciPy 1.18.1. Save the supplied penguins.csv beside this file before running it.'}
};
let mounts=[];
text=text.replace(/\[\[PROGRAM:([^\]]+)\]\]/g,(_,key)=>{
 const old=programmes[key],meta=old?{filename:old.filename,source:'programmes/'+old.filename,output:'outputs/'+old.filename+'.display.txt',note:key==='torch'?'Retained tested PyTorch 2.14 CPU example with float64 logits. Install PyTorch using its official platform instructions.':'Standard-library Python example; the output is retained from its earlier verified execution.'}:extra[key];
 if(!meta)throw Error('Unknown programme '+key);mounts.push({key,filename:meta.filename});
 return '**'+meta.filename+'**\n\n'+meta.note+'\n\n```python\n'+fs.readFileSync(path.join(folder,meta.source),'utf8').trimEnd()+'\n```\n\nOutput:\n\n```text\n'+fs.readFileSync(path.join(folder,meta.output),'utf8').trimEnd()+'\n```';
});
if(mounts.length!==13||new Set(mounts.map(x=>x.key)).size!==13)throw Error('Programme conservation');
text+='\n'+fs.readFileSync(path.join(folder,'practice-r1.md'),'utf8');
text+=`

## What you should now be able to do

Choose a fresh four-outcome law and explain each weighted entropy contribution, then trace a new message through a prefix tree. Compare the cost under a different prediction law, diagnose a missing-support state and prove why the total KL cannot be negative. These are the core checks behind practice1–4 and10–12.

For conditional predictions, reconstruct joint probabilities from context masses and normalized rows, and show why unequal row costs need the actual context weights. Compute a stable log loss from raw logits and explain the library's class axis and reduction. Use the same observations and denominator when comparing log scores or perplexity. Practice5–7 and13–14 ask you to repair those operations independently.

For the deeper branch, keep a physical event fixed while changing measurement units, distinguish an atomic empirical law from a density model, and use a feasible moment slice plus a KL certificate to establish a global entropy maximum. Practice8–9 test those distinctions. If a step is unclear, return to its drawing and trace one row, branch or probability point before repeating the equation.

## Further learning

- [Cover and Thomas, chapter2](https://sites.stat.columbia.edu/liam/teaching/neurostat-spr11/papers/EM/Cover%26Thomas-Ch2.pdf) offers another sustained written explanation. Start with §§2.1–2.3 for entropy, conditioning and divergence, then §2.6 for inequalities. Its binary-question example connects directly to the four symbols here.
- [MIT6.02: Overview, information and entropy](https://ocw.mit.edu/courses/6-02-introduction-to-eecs-ii-digital-communication-systems-fall-2012/resources/lecture-1-overview-information-and-entropy/) supplies George Verghese's lecture and companion material. Use it for a slower spoken route through surprise and coding. The companion slides were assessed for fit; the entire recording has not been reviewed for this lesson.
- [MIT6.441, chapter1](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/2243edffb30f57181ed97dcb77691580_MIT6_441S16_chapter_1.pdf) is a more compressed graduate treatment. Read §§1.1–1.3 after the examples to connect finite sums, general measures and differential entropy.
- [The earlier Greedy Algorithms lesson](/learn/path/full-curriculum/greedy-algorithms-exchange-arguments?module=dsa#6-merge-the-smallest-frequencies-to-build-a-prefix-code) develops the actual efficient Huffman heap/tree construction and exchange argument. It complements the fixed codebook here; a ceiling-length bound is not a Huffman implementation.

## Technical references

- [MIT6.441, chapter6](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/67d8e68cd8fda55366e3f9f0a9465c17_MIT6_441S16_chapter_6.pdf): prefix versus uniquely decodable codes, Kraft capacity and the entropy coding bound.
- [Shannon, A Mathematical Theory of Communication](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf): the original source/communication formulation; §6 develops weighted grouping of choices. It measures probabilistic alternatives rather than the semantic importance of a message.
- [Stanford CS229, Maximum Entropy and Exponential Families](https://cs229.stanford.edu/notes-spring2019/MaxEnt.pdf): the finite interior exponential form. Keep nonnegative probabilities and boundary means explicit; an affine constraint alone does not make every parameter feasible.
- [SciPy entropy](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.entropy.html): base, axis and automatic normalization, including the distinction between entropy and KL. The new programmes above identify their actual SciPy1.18.1 execution environment.
- [PyTorch CrossEntropyLoss](https://docs.pytorch.org/docs/2.14/generated/torch.nn.CrossEntropyLoss.html): raw logits, class indices and probability targets, shapes and reduction. [BCEWithLogitsLoss](https://docs.pytorch.org/docs/2.14/generated/torch.nn.BCEWithLogitsLoss.html) is the corresponding stable single-logit binary interface, with a different input contract.
- [Palmerpenguins documentation](https://allisonhorst.github.io/palmerpenguins/) identifies the CC0 dataset maintained by Allison Horst, Alison Hill and Kristen Gorman, with original collection by Gorman and PalmerStationLTER. [Gorman, Williams and Fraser's ecological study](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0090081) explains the sampling and scientific question. The local CSV is pinned to the supplied344 records; our year-split prediction exercise answers a different question from that study.

## Next: what does an observation tell us about another variable?

Conditional entropy already compares uncertainty before and after a context is known. [Mutual Information & Information Bottleneck](/learn/path/full-curriculum/mutual-information-information-bottleneck?module=math-foundations) turns that reduction into a measure of dependence, then asks which details a representation can discard while retaining information relevant to a task. Keep the joint table, its normalized conditional rows and their actual weights in view: they are the objects behind the next formulas.
`;
const out=path.join(folder,'manuscript-complete-r1.md');if(fs.existsSync(out))throw Error('Exists '+out);fs.writeFileSync(out,text);
fs.writeFileSync(path.join(folder,'programme-mounts-r1.json'),JSON.stringify(mounts,null,2)+'\n');
console.log(JSON.stringify({file:out,bytes:Buffer.byteLength(text),programmes:mounts.length,figures:[...text.matchAll(/\[\[E\d\d\]\]/g)].length}));
