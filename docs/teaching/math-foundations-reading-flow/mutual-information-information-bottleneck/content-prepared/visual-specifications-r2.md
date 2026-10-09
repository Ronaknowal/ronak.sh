# Mutual Information — complete drawing and investigation specification

Source: manuscript-complete-r2.md. These are content contracts for later runtime implementation; no drawing is claimed rendered or browser-accepted. All52 placements belong inside continuous prose, without card shells or duplicated figure headings. The actual lead and interpretation are source-bound below.

## Shared identity and access contract

Y0 is amber#E6AD55 and Y1 blue#79B8E8, both labelled. X rows keep explicit labels/outlines. Codewords Z0/Z1 use lavender circle/coral diamond outlines while their interiors retain target-coloured mixtures. N uses named stripe/dot patterns; signal/nuisance slots remain ordered. A new three-species dataset deliberately introduces Adelie/Chinstrap/Gentoo amber/blue/lavender labels. Joint/product distinction uses solid/dashed outlines and words; PMI sign uses direction and signed numbers. Candidate identities use stable named shapes, bound/exact uses open/filled marks, and selection uses an additional white outline. Colour never substitutes for value, validity or focus. Preserve theme contrast on charcoal; no decorative green/olive.

Every figure has a short accessible name and nearby prose or exact table equivalent; hide decorative duplicates. Native controls have associated labels, current units, keyboard support, visible focus and live feedback only for meaningful user changes. No prediction input, grading or reveal gate. Invalid drafts retain the last valid state with an associated message. Reset restores every active value, draft, selection and message for that investigation. Motion is unnecessary; if added, respect reduced motion and show final states immediately. Text and mathematical labels expand with reader typography; no clipped or overlapping labels at390px or768px with200% text. Copy/Download use the shared Reader file controls and exact complete files, not excerpts.

## Placement contracts

### M01 — A joint law consists of paired outcomes

Placement lead: In the preceding Entropy example, two bits agreed 90% of the time. Here we deliberately choose a noisier observation: a binary feature X agrees with a fair target bit Y 80% of the time. X names the observation; Y names the label we want to infer. The picture describes the complete declared probability law, not four collected samples.

Draw: Draw four actual X/Y paired bit records arranged in a2×2 grid. Row labels X0/X1 and column labels Y0/Y1 persist; each cell contains the two bit identities and its mass. A separate one-unit area is subdivided .4/.1/.1/.4, tied to those exact four records. This is a declared complete law, with no sample-index dots.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Joint .4,.1;.1,.4; both marginals .5/.5; total1.

Narrow/enlarged: At390px and768px with32px root text, stack complete table/calculation stages vertically. Keep every row/column label and probability with its cell; use a compact exact data equivalent for tiny cells. A genuine broad table may scroll inside a labelled region, but narrative and headings wrap. Never change a joint table into unrelated bars that erase pairing.

Following interpretation: The pair (X=0,Y=0) has probability .4, as does (1,1). Each disagreement has probability .1. These four possibilities exhaust the experiment, since their probabilities sum to one. Adding the two cells with Y=0 gives .5; adding the Y=1 cells also gives .5. Before looking at X, either label is equally likely and H(Y)=1 bit.

### M02 — Condition on an observed row

Placement lead: An observation retains one row of this joint table. To turn its remaining masses into probabilities, divide by that row's total.

Draw: Draw the same grid, trace X0 selection to the surviving .4 and .1 masses, combine into denominator .5, and divide each into a target-coloured .8/.2 conditional strip. The excluded row stays as a labelled ghost outside the conditional population. For zero row, draw no invented conditional bar and state unavailable. This first drawing is static foundational geometry; full weighted live result arrives at M03 after its quantities are introduced.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Source row mass .5; conditional sum1; target identities unchanged.

Narrow/enlarged: At390px and768px with32px root text, stack complete table/calculation stages vertically. Keep every row/column label and probability with its cell; use a compact exact data equivalent for tiny cells. A genuine broad table may scroll inside a labelled region, but narrative and headings wrap. Never change a joint table into unrelated bars that erase pairing.

Following interpretation: For X=0, the retained masses are .4 and .1, with total .5. Dividing each by .5 gives P(Y=0|X=0)=.8 and P(Y=1|X=0)=.2. For X=1, the conditional probabilities are (.2,.8). The vertical bar means “given”; it changes the reference population to the selected row. A row with zero probability has no conditional distribution determined by this law, so the display labels it unavailable rather than inventing an all-zero probability vector.

### M03 — Weight conditional entropies by their contexts

Placement lead: Each conditional label distribution has entropy h₂(.2), where h₂(p)=−p log₂p−(1−p)log₂(1−p). As before, a zero-mass term contributes zero by its limit. We must weight the row entropies by the probability of encountering each observation.

Draw: Use row entropy rulers beside each conditional law, multiply each by its actual source mass, then join contributions on one common bit axis and bracket1 minus .721928095. Live L1 first full mount begins here. The unequal-row-entropy preset visibly carries .75/.25 source widths into .468995594/1 costs and .351746695/.25 contributions. Wrong uniform total is a labelled comparison marker, not another true entropy.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Default H1,Hcond .7219280948873623,I .2780719051126377; asym total .6017466951919609 vs uniform .7344977967946407. Equal-row-entropy null .8112781244591328.

Narrow/enlarged: At390px and768px with32px root text, place separate comparisons on stacked copies of the same labelled scale and preserve zero. Direct labels wrap outside the marks with leaders. Explicitly named new experiments may use new scales; same-state auxiliary comparisons may not autoscale truth into apparent motion.

Following interpretation: Here both row weights are .5 and both row entropies are .721928095 bits. The weighted contributions are .360964047 bits each, giving H(Y|X)=.721928095 bits. The bracket between the initial one bit and this conditional total is .278071905 bits. This average reduction is **mutual information**, abbreviated MI:

### M04 — One observation can increase uncertainty

Placement lead: “Observation reduces uncertainty” is an average statement. Consider independent fair bits U,V and let Y=U OR V: Y is one unless both inputs are zero. The following partition shows why an individual observation can do the opposite.

Draw: Draw four fair U/V pairs with OR label0 only at00. Group into U0 and U1 halves, then show conditional label mixtures under each group: fair and certain. Carry .5 context weights into entropy contributions .5 and0, joining at .5 below prior h(.75).

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Prior .8112781244591328; U0 H1; U1 H0; average .5; gain .3112781244591328.

Narrow/enlarged: At390px and768px with32px root text, stack complete source and destination state sets and reroute each edge to its true labelled endpoint. Retain parallel branches as parallel alternatives; no layout can turn them into a sequential chain. Reserve exterior label gutters and place probabilities directly at their branches.

Following interpretation: Three of the four equally likely pairs give Y=1, so the initial entropy is h₂(.75)=.811278124 bits. If U=0, the label is exactly the still-fair V, with entropy one bit: this observation increases uncertainty. If U=1, Y is certainly one, with entropy zero. Each U case occurs half the time, so H(Y|U)=.5 bits and I(U;Y)=.311278124 bits. Averaging over the declared observation law is essential.

### M05 — An invertible wrong answer still contains information

Placement lead: A feature can also be perfectly informative while a particular decision rule is always wrong. Set the binary channel's error to one and follow the two crossed paths.

Draw: Draw X0/X1 at left, Y0/Y1 at right, with crossing probability-one paths for error1. Below, show copying decoder attaches wrong labels and inversion decoder attaches right labels to the same observations. Bit identity is persistent; correctness is an annotation/check or cross, not a new identity colour.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Fair X, error1: Hcond0,MI1,copy accuracy0,invert accuracy1; error .5 gives MI0.

Narrow/enlarged: At390px and768px with32px root text, stack complete source and destination state sets and reroute each edge to its true labelled endpoint. Retain parallel branches as parallel alternatives; no layout can turn them into a sequential chain. Reserve exterior label gutters and place probabilities directly at their branches.

Following interpretation: Now X=0 means Y=1 and X=1 means Y=0. Copying X as the predicted label has zero accuracy; inverting X is perfect. The conditional entropy is zero and MI is one bit. Information concerns the distinctions a suitable decoder could exploit, not whether a chosen decoder uses the right correspondence. At error .5 the two rows are identical, so observing X changes nothing and MI is zero. At errors zero and one, the correspondence differs but the information is equally complete.

### M06 — Construct the independent reference

Placement lead: The conditional calculation starts with one row at a time. A second view asks how the whole pairing differs from a law in which X and Y are independent while keeping their marginal distributions unchanged.

Draw: Place joint grid beside product grid on identical row/column axes. Send each marginal .5 from row and column rulers into its product cell .25; trace selected cell without changing its label identities. Second linked L1 mount adds this product operation after teaching; later selected-cell PMI content is mounted after M07 first introduces it.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Product law has same marginals as joint; default each .25; total1.

Narrow/enlarged: At390px and768px with32px root text, stack complete table/calculation stages vertically. Keep every row/column label and probability with its cell; use a compact exact data equivalent for tiny cells. A genuine broad table may scroll inside a labelled region, but narrative and headings wrap. Never change a joint table into unrelated bars that erase pairing.

Following interpretation: For the fair 80%-agreement example, both marginals are (.5,.5). Multiplying a row mass by a column mass gives .25 in every independent-reference cell. The actual joint law has .4 on the agreement cells and .1 on the disagreement cells. Its dependence lives in which values occur together, even though its row and column totals match the reference exactly.

### M07 — Signed evidence of one pair

Placement lead: Take one positive joint cell and compare its probability with that independent-reference probability. A logarithm measures the relative change on the same additive scale used for information prices.

Draw: For the selected occupied cell, show joint mass and product mass on aligned probability rulers; route their ratio into a signed PMI axis and multiply by joint mass to produce its contribution. All four contributions can be joined on the final MI axis. Outcome identity colours remain on masses; PMI sign uses position left/right of zero and explicit sign.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Agreement log2(1.6)=.6780719051126377; disagreement log2(.4)=−1.3219280948873622; weighted total .2780719051126377. Zero joint cell contribution0 and PMI unavailable.

Narrow/enlarged: At390px and768px with32px root text, place separate comparisons on stacked copies of the same labelled scale and preserve zero. Direct labels wrap outside the marks with leaders. Explicitly named new experiments may use new scales; same-state auxiliary comparisons may not autoscale truth into apparent motion.

Following interpretation: For an agreement cell, .4/.25=1.6 and log₂(1.6)=.678071905 bits. For a disagreement cell, .1/.25=.4 and log₂(.4)=−1.321928095 bits. The signed quantity is **pointwise mutual information**:

### M08 — Regroup the same information sum

Placement lead: The two calculations agree because the same terms regroup. The next drawing aligns the joint, marginal and conditional contributions before cancellation.

Draw: Draw one aligned row per occupied cell, with weighted log joint, weighted log row and weighted log column columns. Factor joint into row×conditional and draw cancellation correspondence on the actual shared terms. Provide a separate zero-cell and zero-row lane, and show log differences rather than an underflowed product for tiny positives.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Joint-minus-product KL equals H(Y)−H(Y|X); positive joint implies positive marginals; zero contributions skipped before logs.

Narrow/enlarged: At390px and768px with32px root text, stack complete table/calculation stages vertically. Keep every row/column label and probability with its cell; use a compact exact data equivalent for tiny cells. A genuine broad table may scroll inside a labelled region, but narrative and headings wrap. Never change a joint table into unrelated bars that erase pairing.

Following interpretation: For an occupied cell, p(x,y)=p(x)p(y|x). Substituting this factorization leaves log₂p(y|x)−log₂p(y). Averaging the negative second term gives H(Y); averaging the negative conditional term gives H(Y|X). Thus

### M09 — Transpose and relabel without changing pairing

Placement lead: Swapping the table's axes or consistently renaming its categories cannot change these weighted ratios. The correspondence, not the category name, carries the information.

Draw: Draw original grid, its transpose, and a relabelled grid with connecting cell correspondences. The labels move with their masses; a filled self-copy diagonal on a fourth small grid explains I(X;X)=H(X). An information ruler terminates at the smaller finite entropy.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: MI invariant under transpose/category permutations; 0≤I≤min(HX,HY) for finite laws.

Narrow/enlarged: At390px and768px with32px root text, stack complete table/calculation stages vertically. Keep every row/column label and probability with its cell; use a compact exact data equivalent for tiny cells. A genuine broad table may scroll inside a labelled region, but narrative and headings wrap. Never change a joint table into unrelated bars that erase pairing.

Following interpretation: Transposition makes the symmetry I(X;Y)=I(Y;X) visible. This does not make predicting X from Y and predicting Y from X equally easy for a particular model or loss. For finite discrete laws, nonnegative conditional entropy also gives 0≤I(X;Y)≤min(H(X),H(Y)). Seeing the exact value X removes all its discrete uncertainty, so I(X;X)=H(X). If Y=f(X), then I(X;Y)=H(Y); X may still distinguish many inputs with the same Y. The continuous case requires a different treatment, developed in section8.

### M10 — Nonlinear dependence on actual coordinates

Placement lead: Mutual information compares complete probability laws. It can therefore detect dependence that a summary of linear association misses. Take X equally likely to be −1,0,1 and Y=X². The picture puts each possible observation at its actual coordinates.

Draw: Plot equal-mass points(−1,1),(0,0),(1,1) on labelled X/Y axes with equal horizontal spacing and real vertical coordinates. Under each point show its X and XY moment contribution; negative and positive terms cancel while Y is still a deterministic function.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: E[X]=E[XY]=0; Y masses1/3,2/3; MI .9182958340544896.

Narrow/enlarged: At390px and768px with32px root text, retain actual coordinates and the specified aspect/units; expand height or stack whole coordinate frames. External labels and legends may wrap without covering points, contours or ticks. Do not distort slopes or scatter relationships to fill a fixed card.

Following interpretation: The points are (−1,1),(0,0),(1,1), each with mass1/3. Their symmetry makes E[X]=0 and E[XY]=0, hence covariance zero. Yet X determines Y exactly. The label is zero with probability1/3 and one with probability2/3, so I(X;Y)=H(Y)=h₂(1/3)=.918295834 bits. Zero covariance has not made the variables independent.

### M11 — What each grouping merges

Placement lead: Now compress X in two different ways. Follow the actual inputs merged into each output group.

Draw: Keep source points−1,0,1 on one axis. Two separate mapping panels send them to magnitude groups{−1,1}/{0} and threshold groups{−1,0}/{1}. Draw exact group members and resulting target-coloured mixtures, with source weights carried into group masses.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Magnitude Hcond0; threshold mixed-group mass2/3,H1; lost2/3,remaining .2516291673878229.

Narrow/enlarged: At390px and768px with32px root text, stack complete source and destination state sets and reroute each edge to its true labelled endpoint. Retain parallel branches as parallel alternatives; no layout can turn them into a sequential chain. Reserve exterior label gutters and place probabilities directly at their branches.

Following interpretation: The magnitude map Z₁=|X| merges −1 and1; both have Y=1. Its other group contains only0, with Y=0. Each group has a single label, so it preserves all the label information. The sign-threshold map Z₂=1[X>0] instead merges −1 with0. This group has probability2/3 and a fair conditional label, while Z₂=1 determines Y=1. Its remaining label entropy is2/3 bit, and its MI is .918295834−2/3=.251629167 bits. A grouping preserves the task when it merges inputs with the same conditional label law, not merely when it has few output values.

### M12 — XOR information resides in the pair

Placement lead: A useful combination can also have individually uninformative parts. Let independent fair bits A,B determine Y=A XOR B, which is one when the bits differ. Draw all four pairs and then group them by what has been revealed.

Draw: Draw four A/B cells with alternating Y identities. Row/column/pair grouping highlights actual partitions. Live L2 begins fair; changing B prevalence changes cell areas while A stays fair. Show each selected group’s conditional target mixture and weighted entropy.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Fair single MI0,pair1; B.25 gives I(A;Y)=.18872187554086717,I(B;Y)=0.

Narrow/enlarged: At390px and768px with32px root text, stack complete table/calculation stages vertically. Keep every row/column label and probability with its cell; use a compact exact data equivalent for tiny cells. A genuine broad table may scroll inside a labelled region, but narrative and headings wrap. Never change a joint table into unrelated bars that erase pairing.

Following interpretation: Every row at fixed A contains one Y=0 and one Y=1, each with equal conditional probability. Every column at fixed B does too. Thus I(A;Y)=I(B;Y)=0, although the pair identifies a single cell and determines Y, giving I((A,B);Y)=1 bit. Rejecting every feature with zero individual MI would discard both ingredients. The investigation's A/B/both selection changes the grouping of this same law; it does not fabricate additional data.

### M13 — Conditional MI is a weighted collection of tables

Placement lead: To measure what A adds after B is already known, work inside each B slice and then weight those calculations by the slice probability.

Draw: Split XOR grid into B0 and B1 contexts; normalize each, draw its joint/product reference and MI, then multiply by its context mass and sum. The same information total is traced through reveal-B then reveal-A sequence. Context colours/labels identify slices, not arbitrary new target identities.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Conditional1 bit in each XOR slice; chain I(A,B;Y)=I(B;Y)+I(A;Y|B). Zero contexts skipped, not uniform averaged.

Narrow/enlarged: At390px and768px with32px root text, stack complete table/calculation stages vertically. Keep every row/column label and probability with its cell; use a compact exact data equivalent for tiny cells. A genuine broad table may scroll inside a labelled region, but narrative and headings wrap. Never change a joint table into unrelated bars that erase pairing.

Following interpretation: When B=0, Y=A; when B=1, Y is the inverted A. Each slice has one bit of MI. With slice masses .5 and .5, their average is one bit. This **conditional mutual information** is

### M14 — Conditioning can remove a dependence

Placement lead: Revealing B first and A second removes the same total uncertainty as revealing the pair. The incremental term need not equal the unconditional I(A;Y). In XOR it is larger. To see the opposite direction, use a different declared law: X=Y=C, all the same fair bit.

Draw: Draw common fair bit C with two possible records X=Y=C. The unsliced joint has diagonal .5/.5. Split by C to produce two single occupied conditional cells, each no remaining uncertainty or dependence. Compare side by side with the previously labelled XOR slicing, without a three-overlap Venn substitute.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Unconditional MI1,conditional0; slice weights .5/.5.

Narrow/enlarged: At390px and768px with32px root text, stack complete source and destination state sets and reroute each edge to its true labelled endpoint. Retain parallel branches as parallel alternatives; no layout can turn them into a sequential chain. Reserve exterior label gutters and place probabilities directly at their branches.

Following interpretation: Before C is revealed, X and Y share one bit. Inside C=0, both are fixed zero; inside C=1, both are fixed one. Consequently I(X;Y|C)=0. Conditioning can reveal or remove dependence. An ordinary three-circle diagram with only nonnegative overlap regions cannot express all these interaction patterns; the actual conditional tables can.

### M15 — A randomized encoder is a conditional channel

Placement lead: We have compared a full observation with deterministic groupings. A representation can also randomize. Let an encoder q(z|x) assign probabilities to output states Z for each observed X. The next picture shows the branching operation itself.

Draw: Draw actual X0/X1 input states, two labelled Y states and two Z states. Each input branches into its separate conditional Y and Z probability paths; encoder randomness is a distinct random input. Probability factors attach to branches, not a generic prose box. An inset shows deterministic one-path row versus split row.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Per-row outgoing probabilities sum1; joint p(x)p(y|x)q(z|x); Y and Z conditionally independent given X.

Narrow/enlarged: At390px and768px with32px root text, stack complete source and destination state sets and reroute each edge to its true labelled endpoint. Retain parallel branches as parallel alternatives; no layout can turn them into a sequential chain. Reserve exterior label gutters and place probabilities directly at their branches.

Following interpretation: For each X, the outgoing probabilities q(z|x) sum to one. The label Y follows its own conditional law p(y|x). Our restriction is that the encoder's random draw does not additionally consult Y after X is known. Thus

### M16 — Compose the noisy paths

Placement lead: Take fair X, with Y flipping X with probability .1 and Z independently flipping X with probability .2. Trace the paths that make Y and Z disagree.

Draw: Live L3 draws all X-mediated paths from Y to Z as a factorized probability calculation. Highlight label-flip/no-encoder-flip .08 and no-label-flip/encoder-flip .18 routes that reach disagreement; merge them at .26. Separate before/after information rulers share one bit scale.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Errors .1/.2 default; effective .26; before .5310044064107188,after .17325362750738216,loss .3577507789033366.

Narrow/enlarged: At390px and768px with32px root text, stack complete source and destination state sets and reroute each edge to its true labelled endpoint. Retain parallel branches as parallel alternatives; no layout can turn them into a sequential chain. Reserve exterior label gutters and place probabilities directly at their branches.

Following interpretation: Exactly one flip produces disagreement: label flip without encoder flip has probability .1×.8=.08, and encoder flip without label flip has probability .9×.2=.18. Adding gives .26. No flip or two flips gives agreement. The original label information is1−h₂(.1)=.531004406 bits; after encoding it is1−h₂(.26)=.173253628 bits. Their difference is .357750778 bits. The processing investigation changes the two named noise channels while preserving conditional independence. Encoder error zero preserves the original information; error .5 makes Z independent of the task. Label error .5 leaves no original task information to preserve.

### M17 — Locate the data-processing gap

Placement lead: The general statement is the **data-processing inequality** I(Y;Z)≤I(Y;X). We can locate its exact gap by decomposing the same joint information in two orders.

Draw: Draw two routes revealing the same joint triple: X then Z versus Z then X. Aligned information ruler has zero extra afterX, and exact lost conditional-information segment afterZ. Common endpoints establish equality of totals before the inequality follows.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: I(Y;Z|X)=0; I(Y;X)=I(Y;Z)+I(Y;X|Z).

Narrow/enlarged: At390px and768px with32px root text, place separate comparisons on stacked copies of the same labelled scale and preserve zero. Direct labels wrap outside the marks with leaders. Explicitly named new experiments may use new scales; same-state auxiliary comparisons may not autoscale truth into apparent motion.

Following interpretation: First reveal X, then Z. The Markov condition makes the second revelation uninformative about Y: I(Y;Z|X)=0. Instead reveal Z, then X; the extra information is I(Y;X|Z). The two totals agree:

### M18 — A sufficient group preserves conditional labels

Placement lead: Equality asks whether X can still help after Z is known. Compare the conditional label mixtures of the inputs within one representation group.

Draw: Draw two source states with identical labelled target mixtures merging into one Z; beside them show two states with different mixtures merged and the unresolved mixture. Reuse magnitude/sign groups from M11 as concrete members. Draw discarded sign distinction separately from retained target distinction.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Equality iff I(Y;X|Z)=0; sufficiency concerns Y, not reconstruction of X.

Narrow/enlarged: At390px and768px with32px root text, stack complete source and destination state sets and reroute each edge to its true labelled endpoint. Retain parallel branches as parallel alternatives; no layout can turn them into a sequential chain. Reserve exterior label gutters and place probabilities directly at their branches.

Following interpretation: If every input merged into a group has the same label distribution, retaining the original input adds no label information within that group. More generally, equality holds exactly when I(Y;X|Z)=0. Such a representation is sufficient for predicting Y under the specified law. It need not reconstruct X. The earlier magnitude map was sufficient for Y=X², although it discarded the sign of X.

### M19 — A label input changes the factorization

Placement lead: Now change the construction by appending the true label to the representation. The new input edge changes the probability model.

Draw: Draw the valid X→encoder→Z operation, then a second explicitly changed encoder with a direct Y input appended to Z. Mark that extra edge at its true destination and annotate the failed conditional-independence premise. No causal claim from either graph.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Changed Z depends onY beyondX,so original DPI premise absent; no numeric bound violation advertised.

Narrow/enlarged: At390px and768px with32px root text, stack complete source and destination state sets and reroute each edge to its true labelled endpoint. Retain parallel branches as parallel alternatives; no layout can turn them into a sequential chain. Reserve exterior label gutters and place probabilities directly at their branches.

Following interpretation: Z can now depend on Y beyond X, violating p(x,y)q(z|x). Observing information above the earlier bound would not refute data processing; its premise no longer applies. With a learned encoder, evaluate fresh pairs with fitted parameters fixed, or explicitly include training-data and parameter randomness in the joint model. Treating a map trained on labels and those same training observations as an independent fresh experiment can conceal leakage.

### M20 — Partition each decoder row into correct and error mass

Placement lead: Information measures distributions; classification asks for a label decision. A useful bridge is to choose, for every observed Z, the most probable label. This is the Bayes decoder for zero-one error under a known law. The next picture divides each Z row into correct and incorrect mass for that chosen label.

Draw: Draw Z rows with Y-coloured cells for binary and three-class joints. Pick each row maximum with a separate selection outline, retain label identity, and gather all other cells into an error accumulator. Tie fixture chooses lowest index; zero row has no conditional decision.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Binary Pe.2; three-class rows .30/.10/.10 and .05/.25/.20; decisions0/1,correct .55,error .45.

Narrow/enlarged: At390px and768px with32px root text, stack complete table/calculation stages vertically. Keep every row/column label and probability with its cell; use a compact exact data equivalent for tiny cells. A genuine broad table may scroll inside a labelled region, but narrative and headings wrap. Never change a joint table into unrelated bars that erase pairing.

Following interpretation: For the fair binary table (.4,.1; .1,.4), choose label0 in row0 and label1 in row1. The two discarded cells sum to error probability Pₑ=.2. For the three-label joint with Z rows (.30,.10,.10) and (.05,.25,.20), choose labels0 and1. Correct mass is .30+.25=.55 and Pₑ=.45. Ties use the lowest label index consistently. No decision at a zero-probability observation affects the expected error.

### M21 — Fano separates the error flag from the remaining label

Placement lead: Introduce the error flag E, equal to one when the chosen decision is wrong. Knowing Z and E=0 identifies Y. Knowing Z and E=1 leaves at most K−1 labels, where K≥2 is the number of possible labels. The drawing separates the uncertainty of the flag from the remaining wrong-label choice.

Draw: Draw Z branch into E0/E1, with E0 identifying guessedY and E1 branching to at mostK−1 remaining labels. Align H(Y|Z) with h2(Pe) plus Pe log2(K−1) on a bit ruler. Binary equality and three-class strict gap occupy explicit separate lanes.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Binary .7219280948873623 equality; three-class H1.365957321 bound1.442774454. Error0 gives0; K≥2.

Narrow/enlarged: At390px and768px with32px root text, stack complete source and destination state sets and reroute each edge to its true labelled endpoint. Retain parallel branches as parallel alternatives; no layout can turn them into a sequential chain. Reserve exterior label gutters and place probabilities directly at their branches.

Following interpretation: Because E is determined by (Y,Z), the chain rule gives H(Y|Z)=H(E|Z)+H(Y|E,Z). The first term is at most H(E)=h₂(Pₑ); the second is at most Pₑ log₂(K−1). This yields **Fano's inequality**:

### M22 — Separate signal and nuisance in the input

Placement lead: Data processing describes what an encoder loses. We now choose what it should keep. Declare a new input X=(S,N), containing two independent fair bits. The target Y is S flipped with probability .1. The picture separates the two coordinates before we decide which one matters.

Draw: Draw four records00,01,10,11, with S and N in fixed labelled coordinate slots and mass.25. Attach target mixtures .9/.1 to firsttwo and .1/.9 to lasttwo. N uses a stripe/dot distinction; it is not painted as a changedY identity.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: X contains2bits; Y noisyS has information .5310044064107188; roles change if target changes.

Narrow/enlarged: At390px and768px with32px root text, stack complete table/calculation stages vertically. Keep every row/column label and probability with its cell; use a compact exact data equivalent for tiny cells. A genuine broad table may scroll inside a labelled region, but narrative and headings wrap. Never change a joint table into unrelated bars that erase pairing.

Following interpretation: The four input records 00,01,10,11 each have probability .25. Their conditional label laws are (.9,.1),(.9,.1),(.1,.9),(.1,.9). S is useful for this task; N could represent an irrelevant acquisition setting. The words signal and nuisance are task-relative. If we instead ask for the label N, their roles change.

### M23 — Compare actual representation maps

Placement lead: Compare five actual representation operations on these same four inputs.

Draw: Draw constant,S,N,both and noisyS maps in separate rows of the same four source identities. Deterministic lines merge correct preimages; noisyS splits with .8/.2 probabilities. Each codeword has a stable outline/shape and internal target mixture. No generic candidate prose cards.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Cardinalities1/2/2/4/2; each encoder row sums1; pYgivenZ obtained from assigned masses.

Narrow/enlarged: At390px and768px with32px root text, stack complete source and destination state sets and reroute each edge to its true labelled endpoint. Retain parallel branches as parallel alternatives; no layout can turn them into a sequential chain. Reserve exterior label gutters and place probabilities directly at their branches.

Following interpretation: A constant encoder merges all inputs. A signal encoder merges 00 with01 and10 with11. A nuisance encoder groups by the second coordinate. Keeping both coordinates assigns a different codeword to each input. A noisy-signal encoder flips S with probability .2, so each input splits between two codewords rather than entering one fixed group. The small label mixtures inside each codeword show what remains predictable there.

### M24 — Rate and relevance count different distinctions

Placement lead: We need two quantities to compare these operations. One asks how many input distinctions survive; the other asks how many task distinctions survive.

Draw: Align the five actual maps with source distinctions retained and target mixtures retained, then with R/T number rulers. Include HZ−H(Z|X) decomposition on the noisy map and independent fair-codeword null.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Candidates(0,0),(1,.5310044064),(1,0),(2,.5310044064),(.2780719051,.1732536275). Random independent code HZ1,HZgivenX1,R0.

Narrow/enlarged: At390px and768px with32px root text, place separate comparisons on stacked copies of the same labelled scale and preserve zero. Direct labels wrap outside the marks with leaders. Explicitly named new experiments may use new scales; same-state auxiliary comparisons may not autoscale truth into apparent motion.

Following interpretation: Call R=I(X;Z) the **rate** and T=I(Y;Z) the **relevance**. The constant has (R,T)=(0,0). Keeping S gives (1,.531004406); keeping N gives (1,0); keeping both gives (2,.531004406). The noisy signal gives (.278071905,.173253628). Its codeword entropy is still one bit, but part of that entropy is encoder randomness. For a deterministic finite encoder R=H(Z); for a randomized encoder R=H(Z)−H(Z|X). A random fair codeword independent of X has one bit of entropy and zero input information.

### M25 — Compare candidates on the objective plane

Placement lead: Beta is the relevance weight: increasing it makes task information worth more relative to retained input information. Some papers instead put a coefficient on compression. Check the actual objective rather than inferring the convention from the letter. Now place the candidates on axes for R and T, and draw one line of constant objective.

Draw: Live L4 places named candidates on fixed horizontalR/verticalT axes with distinct marker shapes and direct labels. Draw constant-J line through the selected point, slope1/beta, or vertical atbeta0. Restrict noisy curve to actual declared family; selection outline distinct from identity.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Atbeta3 signalJ−.5930132192,both .4069867808,constant0. Editingbeta alone leaves coordinates fixed.

Narrow/enlarged: At390px and768px with32px root text, retain actual coordinates and the specified aspect/units; expand height or stack whole coordinate frames. External labels and legends may wrap without covering points, contours or ticks. Do not distort slopes or scatter relationships to fill a fixed card.

Following interpretation: With R horizontal and T vertical, J=R−βT rearranges to T=R/β−J/β when β>0. Equal-objective lines therefore have slope1/β. For β=0, J=R and equal-objective lines are vertical. At β=3, signal gives J=−.593013219, both gives .406986781 and constant gives zero. The extra nuisance bit costs one without increasing relevance. The noisy-signal family is drawn as a labelled set of feasible candidates; it is not a certified frontier over every possible encoder.

### M26 — The trivial regime follows an inequality

Placement lead: Two limits clarify what the objective rewards. The nonnegative region implied by data processing is an inequality constraint, not an algorithm's fitted curve.

Draw: Draw feasible inequality region0≤T≤R with actual candidate points, and show J≥(1−beta)R forbeta .5/1. Shade only the inequality region; do not assert every point is feasible or optimal. Atbeta1 retain informative ties onT=R as a labelled possibility.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Input-independent encoder reaches0; beta≤1 optimum0,not necessarily unique at1.

Narrow/enlarged: At390px and768px with32px root text, retain actual coordinates and the specified aspect/units; expand height or stack whole coordinate frames. External labels and legends may wrap without covering points, contours or ticks. Do not distort slopes or scatter relationships to fill a fixed card.

Following interpretation: The encoder's Markov condition gives T≤R, so for0≤β≤1,

### M27 — Assigned input mass builds the codeword marginal

Placement lead: The comparison suggests what a good representation could do; we still need to construct one. Keep the four equiprobable inputs and their label laws from section5, and allow two codewords. An encoder is a four-by-two table q(z|x), with each row summing to one. Begin with positive rows (.8,.2),(.6,.4),(.3,.7),(.2,.8). The drawing carries the actual assigned probability mass into each codeword.

Draw: Draw4×2 encoder table(.8,.2),(.6,.4),(.3,.7),(.2,.8), input masses.25 and flows of actual .25q into two output bins. Four input labels remain on the contributing fragments. Summed bins .475/.525 are explicit.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Rows sum1; marginal .475/.525; mass conserved.

Narrow/enlarged: At390px and768px with32px root text, stack complete source and destination state sets and reroute each edge to its true labelled endpoint. Retain parallel branches as parallel alternatives; no layout can turn them into a sequential chain. Reserve exterior label gutters and place probabilities directly at their branches.

Following interpretation: Multiply every encoder row by its source mass .25. Summing these assigned masses down the first column gives p(Z=0)=.475; the second column gives .525. In general p(z)=Σₓp(x)q(z|x). These are codeword frequencies implied by the encoder, not new free parameters. Their sum stays one because each source row contributes its entire probability mass.

### M28 — A decoder is a normalized mixture of its inputs

Placement lead: To obtain a label predictor inside one codeword, retain the identities of the input fragments that reached it and normalize by the codeword mass.

Draw: Forz0 display assigned fragments .2,.15,.075,.05, divide by.475, multiply each conditional label law and stack its contribution into joint label masses .3275/.1475. Normalize to .689473684/.310526316. Showz1 .1725/.3525 and .328571429/.671428571 beside it.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Codeword masses .475/.525; decoder rows sum1; absentcodeword undefined.

Narrow/enlarged: At390px and768px with32px root text, stack complete table/calculation stages vertically. Keep every row/column label and probability with its cell; use a compact exact data equivalent for tiny cells. A genuine broad table may scroll inside a labelled region, but narrative and headings wrap. Never change a joint table into unrelated bars that erase pairing.

Following interpretation: For z=0, the source fragments are (.2,.15,.075,.05). Dividing by .475 gives their conditional input weights. Multiplying them by the corresponding label laws and summing gives p(Y=0,z=0)=.3275 and p(Y=1,z=0)=.1475. Normalizing yields p(Y|z=0)=(.689473684,.310526316). For z=1 the joint label masses are (.1725,.3525), so its decoder is (.328571429,.671428571). The general operations are

### M29 — Predictive distortion compares label distributions

Placement lead: Next compare the label law of one input with the label mixture currently represented by each codeword.

Draw: Align each input label bar with each current codeword label bar; trace per-label p(y|x)log[p(y|x)/p(y|z)] contributions into an(A,K)distortion table. Individual contributions may be negative; total KL nonnegative. Use nats explicitly before exponential update.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Positive fixture has finiteKL; exactmatch0; no Euclidean input-distance interpretation.

Narrow/enlarged: At390px and768px with32px root text, stack complete table/calculation stages vertically. Keep every row/column label and probability with its cell; use a compact exact data equivalent for tiny cells. A genuine broad table may scroll inside a labelled region, but narrative and headings wrap. Never change a joint table into unrelated bars that erase pairing.

Following interpretation: Their KL divergence d(x,z)=D_KL(p(y|x)‖p(y|z)) is the **predictive distortion**. It measures a mismatch in label distributions, not Euclidean distance between the numeric input labels. Assigning an input to a codeword whose label mixture differs from its own can discard task detail. Common codewords also make a compact description attractive. The update combines those two considerations.

### M30 — One Gibbs update has a visible normalization

Placement lead: Use the small row example r=(.25,.75), beta2, and predictive distortions (0,ln2) nats to trace one update before returning to the full four-input law.

Draw: Draw reference masses .25/.75, cost factors1/4^-1 from D=(0,ln2),beta2, resulting weights .25/.1875 and normalized(4/7,3/7). Then live L5 full-fixture row update uses the same operation, with logweights,maxshift,weights,rowtotal visible. Controls after quantities taught.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Natural-log distortion in exp; commonoffset cancels; default fullfixturestep0 and selectedrow0; no zero division.

Narrow/enlarged: At390px and768px with32px root text, stack complete table/calculation stages vertically. Keep every row/column label and probability with its cell; use a compact exact data equivalent for tiny cells. A genuine broad table may scroll inside a labelled region, but narrative and headings wrap. Never change a joint table into unrelated bars that erase pairing.

Following interpretation: The unnormalized weights are .25×exp(0)=.25 and .75×exp(−2ln2)=.1875. Dividing by their sum .4375 gives the new row (4/7,3/7). In the full update r is the current codeword marginal:

### M31 — Distinguish the decoder used from the decoder recomputed

Placement lead: The live investigation returns to the complete four-input fixture. Its proposed row uses the current decoder. Applying the update creates a new encoder, which implies a new marginal and a new decoder. Keep those times distinct.

Draw: Two clearly labelled columns state t andt+1: q_t→marginal/decoder_t→distortion_t→q_t+1→marginal/decoder_t+1. Attach each displayed quantity to its actual state. The next update points back to the newly computed decoder. Keep parallel row updates parallel, not sequential processing of one another.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Displayed objective belongs currentq; used distortion belongs precedingdecoder; atstep0 proposed update is labelledproposal.

Narrow/enlarged: At390px and768px with32px root text, stack complete source and destination state sets and reroute each edge to its true labelled endpoint. Retain parallel branches as parallel alternatives; no layout can turn them into a sequential chain. Reserve exterior label gutters and place probabilities directly at their branches.

Following interpretation: The distortion table labelled t prices assignments for the transition from q_t to q_(t+1). After that transition, the current assignment bars and objective belong to q_(t+1), while its recomputed decoder is the one used for the next step. Previous/next and the step selector navigate one coherent sequence. Changing beta, label error or initialization regenerates the sequence from its named initial state. Both later mounts share that state; scrolling does not reset it.

### M32 — The auxiliary objective has two explicit KL gaps

Placement lead: The next ruler decomposes this auxiliary objective into the bottleneck objective, a source-law constant and two nonnegative mismatches.

Draw: One aligned signed ruler shows J, adds fixedbetaI(X;Y), then marginalKL andbetaweighteddecoderKL to reachF. A matched auxiliary lane has both gaps0. Show expected sums carried by actual p(x)q rather than unrelated decorations.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Use one logbase; F=J+betaIxy+KLpz/r+betaE_zKLpyz/w. beta0 decoder termabsent.

Narrow/enlarged: At390px and768px with32px root text, place separate comparisons on stacked copies of the same labelled scale and preserve zero. Direct labels wrap outside the marks with leaders. Explicitly named new experiments may use new scales; same-state auxiliary comparisons may not autoscale truth into apparent motion.

Following interpretation: Add and subtract log p(z) in the first expectation. It becomes I(X;Z)+D_KL(p(z)‖r(z)). In the distortion term, add and subtract log p(y|z). The remaining average difference between input-specific and codeword-specific label laws is I(X;Y)−I(Z;Y), using the Markov condition. Therefore

### M33 — A stationary start can be inferior

Placement lead: Compare two initializations on the same scale and inspect the encoders they reach.

Draw: Live L5 later history mount shares initialization,beta,error,step with firstmount. Plot both informative and symmetric histories on the same objective axes for their declared starts; selectedstate marker and final rows beside each. No invented smooth interpolation implying uncomputed convergence.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Step40 informativeR .948950829,T .516595159,J−.600834647; symmetric0. Finiteupdates, no globalcertificate.

Narrow/enlarged: At390px and768px with32px root text, place separate comparisons on stacked copies of the same labelled scale and preserve zero. Direct labels wrap outside the marks with leaders. Explicitly named new experiments may use new scales; same-state auxiliary comparisons may not autoscale truth into apparent motion.

Following interpretation: At beta3, the informative start reaches J=−.600834647 after40 updates, slightly better than the deterministic signal encoder's −.593013219. Its rate .948950829 is below one, and its relevance .516595159 is below the deterministic .531004406: the reduction in rate compensates for the relevance loss at this beta. A perfectly symmetric start keeps both codewords identical and stays at R=T=J=0. “Nothing changed” is not a certificate that a better encoder is impossible. These are finite iteration results, not a proof of convergence to a global optimum.

### M34 — Array axes expose the same computation

Placement lead: The same calculation can use ordinary array operations. Keep the axes visible before reading the broadcasting code.

Draw: Draw pX[A] scalingq[A,K], transpose product withlabel[A,B] into pZY[K,B], divide rowsbypZ[K]. Next draw broadcastA×1×B and1×K×B into A×K×B and reduce labelaxis. Label actualA4,K2,B2. Trace one scalar cell to its array counterpart.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: TimeO(ABK); explicit temporaryO(ABK); scalarreference avoids fulltemporary. No wrongaxis reduction.

Narrow/enlarged: At390px and768px with32px root text, stack complete table/calculation stages vertically. Keep every row/column label and probability with its cell; use a compact exact data equivalent for tiny cells. A genuine broad table may scroll inside a labelled region, but narrative and headings wrap. Never change a joint table into unrelated bars that erase pairing.

Following interpretation: Let A be the input alphabet size, K the codeword count and B the label count. q has shape(A,K), the label conditional has shape(A,B), and multiplying q by p(x) gives assigned mass of shape(A,K). Transposing that mass and multiplying by the label table gives p(z,y) of shape(K,B). Its row sums give p(z), and row normalization gives the decoder. For distortions, an(A,1,B) input-label view and a(1,K,B) decoder view broadcast to(A,K,B); summing over the label axis leaves(A,K). The dense update costs O(ABK) arithmetic. The explicit broadcast temporary costs O(ABK) memory, while a looped implementation can avoid storing that temporary and retain the smaller tables.

### M35 — Auxiliary changes move bounds while truth stays fixed

Placement lead: The first substitution gives an upper bound on rate; the second gives a lower bound on relevance. The following picture fixes the true information coordinates and changes only the two auxiliary choices.

Draw: Live L6 uses fixedR .278071905,T .173253628 axes; filled exactmarks stay still. Open upper-rate and lower-relevance marks move with reference/decoder edits. Label each nonnegativegap segment; lowerrelevance axis extendsbelow0. Current laws printed beside the actual alteredbars.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Matchedauxgaps0; mismatchedreference .8/.2 givesrateU.6 andgap .321928095; poor decoderlower maynegative; noautoscale-movingtruth.

Narrow/enlarged: At390px and768px with32px root text, place separate comparisons on stacked copies of the same labelled scale and preserve zero. Direct labels wrap outside the marks with leaders. Explicitly named new experiments may use new scales; same-state auxiliary comparisons may not autoscale truth into apparent motion.

Following interpretation: The fixed noisy encoder has R=.278071905 and T=.173253628 bits. Matching the reference to the true marginal closes the rate gap. Matching the decoder to the true conditional closes the relevance gap. A poor decoder can make L negative even though true MI cannot be negative. A zero decoder probability on a positive-mass event gives infinite cross-entropy; compatible support is a mathematical requirement, not an optional plotting adjustment. The live controls alter these auxiliaries while the encoder and its true dots remain fixed on the same axes.

### M36 — Carry the two gaps into the training objective

Placement lead: Combining the two bounds gives an upper objective. The next ruler labels each piece of its gap and shows the coefficient conversion used by many training losses.

Draw: Draw actual R−betaT andU−betaL expressions as aligned contribution rulers with linksgapGr+betaGs. Then scale the entire retained objective by1/beta forbeta>0 and mark fixedHYconstant separately. beta0 is its own branch, never reciprocalinfinity in a numericcontrol.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Jupper−J=Gr+betaGs; lambda1/beta; fixedencoder trueJ unchanged withauxonly.

Narrow/enlarged: At390px and768px with32px root text, place separate comparisons on stacked copies of the same labelled scale and preserve zero. Direct labels wrap outside the marks with leaders. Explicitly named new experiments may use new scales; same-state auxiliary comparisons may not autoscale truth into apparent motion.

Following interpretation: Writing G_r=D_KL(p(z)‖r(z)), we have

### M37 — A Gaussian encoder transforms independent noise

Placement lead: A neural encoder can output a mean μ(x) and a positive standard deviation σ(x), defining a diagonal Gaussian q(z|x). Draw independent standard-normal noise epsilon and use z=μ(x)+σ(x)⊙epsilon. The actual mechanism is an affine transformation of independent noise, followed by a label decoder.

Draw: Draw actual row input(S,N), affine mean node aS+bN+c, logsd→exp scale node and separate epsilon input. Mean+scale×epsilon feeds z then decoderuz+v then observedtargetloss. AnalyticKL branch receivesmean/scale and joinsmeanobjective; targetY is separate frominputX.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Scalar example means−.4,−.1,.4,.7; sd.7; fixedeps−1,.5,.5,−1; nats; notVAEreconstruction.

Narrow/enlarged: At390px and768px with32px root text, stack complete source and destination state sets and reroute each edge to its true labelled endpoint. Retain parallel branches as parallel alternatives; no layout can turn them into a sequential chain. Reserve exterior label gutters and place probabilities directly at their branches.

Following interpretation: The mean sets the centre of the conditional distribution; the standard deviation scales the random displacement. This is the pathwise derivative mechanism from [Variational Inference](/learn/path/full-curriculum/variational-inference#6-differentiate-an-expectation): hold the sampled epsilon fixed while differentiating through the transformation. Valid differentiation of the expected objective additionally requires the usual integrability and interchange conditions. The earlier programme applies this technique to an ELBO; here the task is supervised label prediction.

### M38 — Follow one row and its two gradient paths

Placement lead: To see every computational step, use a scalar encoder μ=aS+bN+c, shared standard deviation exp(d), and binary-decoder logit ℓ=uz+v. Declare four input rows(S,N)=00,01,10,11, targets(0,0,1,0), and fixed comparison noises(−1,.5,.5,−1). These are constructed batch and noise values for checking arithmetic, not a claim that this four-row batch exactly realizes the earlier population's .1 label-noise law. Initialize(a,b,c)=(.8,.3,−.4), d=ln(.7), and(u,v)=(1.1,−.2). Use compression weight λ=.2 and a single gradient step of size .01.

Draw: Static guidedtrace row0 mu−.4,z−1.1,logit−1.41,CE .218447167,KL .181674944. Draw gradientg fromlogit, u*g throughz, noise derivative sd*eps throughlogsd, and separateKL gradientsmu/sd²−1, joiningwithlambda. Thenfourrowmean into six-parameterstep.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: MeanCE .494159214,KL .204174944,loss .534994203; step.01 gives .532473082 onfixednoise; all6gradients fromactualstdout.

Narrow/enlarged: At390px and768px with32px root text, stack complete source and destination state sets and reroute each edge to its true labelled endpoint. Retain parallel branches as parallel alternatives; no layout can turn them into a sequential chain. Reserve exterior label gutters and place probabilities directly at their branches.

Following interpretation: In the first row μ=−.4, z=−.4+.7×(−1)=−1.1, and ℓ=1.1×(−1.1)−.2=−1.41. For target0 its stable logistic cross-entropy is .218447167 nats. The Gaussian KL is .5[(−.4)²+.7²−1−2ln(.7)]=.181674944 nats. Each row contributes to the mean objective C+λU; no batch-size-dependent sum is silently substituted.

### M39 — Marginal independence is not conditional privacy

Placement lead: A variational autoencoder reconstructs X under a generative model; this supervised bottleneck predicts Y. Similar Gaussian and KL operations can serve different objectives. A further distinction matters when the representation contains a sensitive attribute as well as task information.

Draw: ReusefourXORrecordsA/B/Z; each A group has fairZ, but addingB lookup uniquelyrevealsA. A sensitiveattribute label attaches toA and task/context toB without changing underlying bitidentity. Avoid shield/check badge implying guaranteedprivacy.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: I(Z;A)=0, I(Z;A|B)=1 underfairindependentbits. Estimate nearzero weaker thanexactidentity.

Narrow/enlarged: At390px and768px with32px root text, stack complete table/calculation stages vertically. Keep every row/column label and probability with its cell; use a compact exact data equivalent for tiny cells. A genuine broad table may scroll inside a labelled region, but narrative and headings wrap. Never change a joint table into unrelated bars that erase pairing.

Following interpretation: Exact population I(Z;A)=0 implies marginal independence from attribute A. It does not imply independence after another variable is known. Reuse XOR: if fair independent A,B produce Z=A XOR B, then Z is marginally independent of A, but knowing B and Z recovers A exactly. An estimated MI near zero is weaker still. An information-plane plot alone therefore does not establish fairness, privacy, causality, robustness or performance on a changed deployment law. Those questions require their own variables, threat or decision model, and evaluation.

### M40 — See the Gaussian joint and conditional slice

Placement lead: The joint-versus-product definition extends beyond tables: I(X;Z)=D_KL(P_XZ‖P_XP_Z), with probability measures in place of finite masses. It remains nonnegative and can be infinite. To see what changes, draw a continuous joint distribution before trying to subtract entropy formulas.

Draw: Draw actual normal joint contours in(X,Z)coordinates for sigma.5, covariance[[1,1],[1,1.25]]. Markmean0 and conditionalverticalsliceatX1 withZmean1/SD.5. Contourlevel explicitly Mahalanobisradius1; density/contournot samplepoints. Include independentnoise variable as namedsource.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Covariance determinant sigma²=.25; slopeconditionalmean1; displayedellipse aspect usesactualsameunits.

Narrow/enlarged: At390px and768px with32px root text, retain actual coordinates and the specified aspect/units; expand height or stack whole coordinate frames. External labels and legends may wrap without covering points, contours or ticks. Do not distort slopes or scatter relationships to fill a fixed card.

Following interpretation: Let X and E be independent standard normals and let Z=X+σE for σ>0. The joint cloud has mean zero and covariance matrix [[1,1],[1,1+σ²]]. At a fixed X=x, its conditional slice in Z is normal with mean x and standard deviation sigma. The width is a standard deviation on the coordinate axis, not a probability mass or a variance drawn as a length. Narrower conditional slices make the observation more precise about X.

### M41 — Noise width and information share a mechanism

Placement lead: For the additive-noise law, the observation variance is1+σ² and the conditional variance isσ². The noise enters a specific addition node; connect that operation to the information curve.

Draw: Live L7 drawX andindependentE source nodes; scaleE bysigma thenaddX toZ. Actual conditionaldensity withSDsigma beside MIversussigma curve; selectedpointlinked tocurrentnoise. Use stablepositive-sigma arithmetic; exactzero separate.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: sigma .5→1.160964047443681,sigma1→.5,sigma2→.160964047443681;sigma0∞ for exactlaw.

Narrow/enlarged: At390px and768px with32px root text, retain actual coordinates and the specified aspect/units; expand height or stack whole coordinate frames. External labels and legends may wrap without covering points, contours or ticks. Do not distort slopes or scatter relationships to fill a fixed card.

Following interpretation: Using h(N(0,v))=.5log₂(2πev), the shared constants cancel and give

### M42 — An invertible coordinate change stretches densities

Placement lead: Now multiply the entire observation by10. Trace corresponding physical outcomes under the two coordinate rulers.

Draw: Two jointcoordinateframes labelZ andZprime10Z. Map sameevent[0,1]→[0,10] using endpointcorrespondences; densityheightdivides10 andhorizontalwidthmultiplies10. Correlation/info unchanged; both differentialentropy terms shiftlog2(10).

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: VarianceZ scales100,covXZ scales10,MI fixed. Axesexplicitdifferentunits, nofakeequalaspect acrosschangedunits.

Narrow/enlarged: At390px and768px with32px root text, retain actual coordinates and the specified aspect/units; expand height or stack whole coordinate frames. External labels and legends may wrap without covering points, contours or ticks. Do not distort slopes or scatter relationships to fill a fixed card.

Following interpretation: The transformation Z′=10Z is invertible. Its density is stretched horizontally and scaled vertically by1/10 to preserve total probability. Both h(Z) and h(Z|X) increase by log₂10, so their finite difference stays unchanged. The covariance with X scales by10, and the observation variance by100. This is a change of units. Adding fresh noise or quantizing into bins instead changes the information-preserving relationship and cannot increase population MI under the processing assumption.

### M43 — The zero-noise law lies on a product-null line

Placement lead: At sigma0 the joint cloud collapses to an exact line. Compare that line with what the product of two continuous marginals assigns to it.

Draw: Draw jointmass concentratedonZ=Xdiagonal onleft; rightproductlawfillsplane andassignsdiagonalzero. Label jointprobability1 versusproductprobability0 onthat event. A separatefinite sign map mergeshalf-linesintotwostates withprob .5; nofinitebarforinfiniteMI.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: SingularjointKL∞; nonatomicdeterministicoutput distinction; signMI1bit.

Narrow/enlarged: At390px and768px with32px root text, retain actual coordinates and the specified aspect/units; expand height or stack whole coordinate frames. External labels and legends may wrap without covering points, contours or ticks. Do not distort slopes or scatter relationships to fill a fixed card.

Following interpretation: The joint law places probability one on Z=X. Independent continuous draws put probability zero on that diagonal. The joint is therefore not absolutely continuous with respect to the product law, and its KL—and MI—is infinite. No finite-height bar represents this value. More generally, a deterministic output Z=f(X) with a nonatomic output law has infinite MI with X: exact real values preserve arbitrarily fine distinctions.

### M44 — Data rows are not the population law

Placement lead: Until now we knew a complete probability law. With observed data, a simple **plug-in estimator** counts paired values, divides by the sample size, and computes MI of that empirical table. The drawing distinguishes a declared population law from the particular rows it generated.

Draw: Live L8 drawsdeclaredjointlaw→actualseededsampledrowpairs→integercountgrid→normalizedempiricallaw. DisplayN,seed,generator,alphabet andlawlabel nexttoobjects. Knownpopulationreference staysdistinctfrompluginestimate.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Currentjointcounts sumN;independenttruthMI0;no fabricated sample stream; coherentprefix whenNgrows.

Narrow/enlarged: At390px and768px with32px root text, stack complete table/calculation stages vertically. Keep every row/column label and probability with its cell; use a compact exact data equivalent for tiny cells. A genuine broad table may scroll inside a labelled region, but narrative and headings wrap. Never change a joint table into unrelated bars that erase pairing.

Following interpretation: An independent population has MI zero. Its finite sample need not contain exactly the proportions that factor into independent row and column marginals. The empirical MI can therefore be positive. An8×8 table has many more cells to estimate than a2×2 table at the same sample size, making sparse counts consequential. This independence example does not prove a universal sign for estimation error under every dependent law. An individual estimate can also move in either direction when more observations are added.

### M45 — A shuffle moves donors while preserving counts

Placement lead: Now keep the actual observed X and Y values, but permute the donor rows supplying Y. Follow one permutation before inspecting a collection of shuffled scores.

Draw: Drawactualsmallselectedsample rows withfixedX andpermutationarrowsfromoldYpositions tonewpairpositions. A before/aftermarginaltableverifiesconservation; jointtablechanges. TwentyactualshuffleMI values plottedasdiagnosticpoints,noCIband.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Permutationbijective; row/colmarginals exact; no claim each shuffledMI0 or calibratedtest.

Narrow/enlarged: At390px and768px with32px root text, stack complete source and destination state sets and reroute each edge to its true labelled endpoint. Retain parallel branches as parallel alternatives; no layout can turn them into a sequential chain. Reserve exterior label gutters and place probabilities directly at their branches.

Following interpretation: Every original Y appears exactly once in the new paired rows, so its marginal count is unchanged; X's marginal is unchanged because its rows stayed in place. The joint pairing changes. A particular shuffled table is not guaranteed to factor exactly or have MI zero. Twenty shuffled values illustrate the variability of this diagnostic under the observed marginals; they are not a confidence interval or a calibrated significance test. A formal permutation test needs an exchangeability argument, a statistic and a stated decision rule. Temporal, grouped or repeated observations may not permit unrestricted shuffling.

### M46 — Identifiers make singleton training groups

Placement lead: The final programme example assigns every observed row a unique ID. Draw its singleton groups next to an ID that was never observed.

Draw: Draw8uniqueIDrows withtheirbalancedlabels, onecellperID; eachobservedgroup ispure. Nexttoitdraw unseenID withnoattachedtraininglabel andno fabricatedguess. Finebinningcomparison shows moreempty/singletoncells, notmereprecisionbenefit.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: EmpiricalID MI1=HY; no newID predictive rule; categorytype distinctfromintegerstorage.

Narrow/enlarged: At390px and768px with32px root text, stack complete table/calculation stages vertically. Keep every row/column label and probability with its cell; use a compact exact data equivalent for tiny cells. A genuine broad table may scroll inside a labelled region, but narrative and headings wrap. Never change a joint table into unrelated bars that erase pairing.

Following interpretation: Each training ID determines its one recorded label, so the empirical conditional entropy is zero and the empirical MI equals the one-bit label entropy. No rule for a new ID follows. Finer measurement bins can create a similar sparse-table effect. Storage as an integer does not make a continuous measurement a categorical variable. Choose an estimator according to the variable's meaning and sampling assumptions, not its array dtype.

### M47 — One count table enters two APIs

Placement lead: The next comparison carries one integer contingency table into both a manual sum and library calls. The row/column labels and units remain explicit.

Draw: Drawtable[[30,10],[10,30]], counttotal80, manualnonzerologsum, sklearncontingencyroute andexplicit80-rowexpansionroute withdiscrete_features=True. Bothnatresults join beforedivisionbyln2 into bits. Label tableprobability .75agreement distinctfromearlier.8.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: MI .130812036nat,.188721876bits; emptycategory contribution0; no normalizedprobabilitypassed ascounts.

Narrow/enlarged: At390px and768px with32px root text, stack complete table/calculation stages vertically. Keep every row/column label and probability with its cell; use a compact exact data equivalent for tiny cells. A genuine broad table may scroll inside a labelled region, but narrative and headings wrap. Never change a joint table into unrelated bars that erase pairing.

Following interpretation: The table [[30,10],[10,30]] has80 observations. Its agreement fraction is .75, deliberately different from section1's .8 law. Its MI is .130812036 nats, or .188721876 bits. `mutual_info_score(contingency=counts)` takes actual counts rather than a normalized probability table. `mutual_info_classif` on the expanded80 rows uses `discrete_features=True` because these values are categories. Both return nats, so divide by ln2 for bits.

### M48 — Coarsening observed island categories

Placement lead: Use the offline Palmer penguins records from the preceding Entropy example. This time the question is descriptive association, not held-out prediction cost. Species, island and year are present in all344 records; missing body measurements do not remove rows from this calculation. The actual table and a specified grouping make the change visible.

Draw: Live L9 integercounts344 withspeciestargetidentity amber/blue/lavender andislandcolumnlabels. Draw Dream/Torgersencolumnsmerging intoother withvaluesadded rowwise. AlignedMI ruler loses .134371069; yearselectorchangesdenominator visibly, notsame-sourceprocessing.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Allcounts[[44,56,52],[0,68,0],[124,0,0]];full .750428171,grouped .616057102. YearN110/114/120;weightedconditional .744684498 vsuniform .745617934.

Narrow/enlarged: At390px and768px with32px root text, stack complete table/calculation stages vertically. Keep every row/column label and probability with its cell; use a compact exact data equivalent for tiny cells. A genuine broad table may scroll inside a labelled region, but narrative and headings wrap. Never change a joint table into unrelated bars that erase pairing.

Following interpretation: With species rows Adelie,Chinstrap,Gentoo and island columns Biscoe,Dream,Torgersen, the observed counts are [[44,56,52],[0,68,0],[124,0,0]]. Computing MI of this empirical law gives .750428171 bits. Merge Dream and Torgersen into “other,” retaining Biscoe separately. The new table is [[44,108],[0,68],[124,0]], with MI .616057102 bits. The .134371069-bit loss is a deterministic coarsening under the same empirical law, so it obeys data processing exactly. This does not establish that island causes species or that the study is a random census of all Antarctic penguins.

### M49 — Generate the contrastive candidate set

Placement lead: An information-based training objective can avoid an explicit density estimate while still depending on a precise sampling law. InfoNCE asks which candidate belongs with a context. Draw how the candidate set is made before interpreting a score.

Draw: DrawcontextX, oneconditionalpositiveY+ fromp(y|x), threeindependentmarginalnegativeY draws(K4), preservingeachcandidateidentity into fourcritic scores andnormalizationsum. Positiveindexselection isseparateoutline; no semanticpositive/negativecolour implyingfeaturevalue.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: Oneconditional +K−1 iidmarginal draws; fixedpositivecritic; populationexpectedneglognormalizedpositive.

Narrow/enlarged: At390px and768px with32px root text, stack complete source and destination state sets and reroute each edge to its true labelled endpoint. Retain parallel branches as parallel alternatives; no layout can turn them into a sequential chain. Reserve exterior label gutters and place probabilities directly at their branches.

Following interpretation: For context X, one candidate Y⁺ comes from the conditional law p(y|X). The other K−1 candidates come independently from the target marginal p(y). A fixed positive critic f(x,y) scores all candidates, and the selected positive receives normalized score f(X,Y⁺)/Σ_jf(X,Y_j). Its negative log is a classification loss. Averaging over this population sampling experiment gives L_K. Negatives drawn from a different law, dependent selection rules or an adaptive critic require rechecking the argument.

### M50 — The lower bound has a ceiling, not true MI

Placement lead: The population bound and one finite observed score are distinct quantities. The next scale shows the bound's own ceiling without turning that ceiling into a claim about true MI.

Draw: Drawbase2boundaxiswithlog2K ceiling2 forK4. LossLKsubtractsfrom2 toreachlowerbound; trueMI marked asunknownvalue constrainedabovebound, notplottedinventednumber. A separate labelledrandomminibatchloss symboldoesnotattachasguaranteedbound.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: BoundI≥logK−LK; LK≥0; trueI no logK ceiling. Use symbolic quantities unlessactualfinitefixture calculated.

Narrow/enlarged: At390px and768px with32px root text, place separate comparisons on stacked copies of the same labelled scale and preserve zero. Direct labels wrap outside the marks with leaders. Explicitly named new experiments may use new scales; same-state auxiliary comparisons may not autoscale truth into apparent motion.

Following interpretation: Under the stated sampling setup, I(X;Y)≥log K−L_K in the same log units. Since L_K≥0, this displayed lower bound cannot exceed log K. True MI can be larger. An observed minibatch loss is a random estimate of the population expectation; optimizing a critic on those same observations creates an additional selection issue. A good classification loss is therefore not automatically a trustworthy measurement of true MI.

### M51 — A rare exponential contribution may be missed

Placement lead: Another variational route uses a real-valued critic T and the population functional E_joint[T]−log E_product[exp(T)], under conditions making these expectations meaningful. Its value is at most joint-versus-product KL. The exponential term is sensitive to events that a finite sample can miss.

Draw: Drawproduct-lawprobabilitymass splitcommon/rare labelledsymbolicprobabilityepsilon; criticheightT rarelarge, expTcontribution explicitepsilon*exp(T). Sampledraws canmissrarebranch; distinguishpopulationexpectation fromsamplemean inoppositeframes. No fabricatedfrequencyoruniversalceilingclaim.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: DVfunctional≤KL onlypopulationwithfinitevalidexpectations; empiricaldenominatorunderestimate canraiseempiricalfunctional.

Narrow/enlarged: At390px and768px with32px root text, stack complete source and destination state sets and reroute each edge to its true labelled endpoint. Retain parallel branches as parallel alternatives; no layout can turn them into a sequential chain. Reserve exterior label gutters and place probabilities directly at their branches.

Following interpretation: The product-law picture contains a rare region with large critic score. If a sample misses it, its empirical mean of exp(T) can underestimate the population denominator, making the empirical functional look too large. This explains a risk; it is not by itself a proof of every estimator's finite-sample error. MINE parameterizes a critic and optimizes such variational objectives, with its own gradient and estimation choices. Distribution-free high-confidence lower bounds from finite data have formal limitations of order log(sample size). That statement has a particular distribution-free confidence setting; it does not impose one universal ceiling on exact known-law calculations or every estimator using additional structural assumptions.

### M52 — A task-preserving merge can lose reconstruction detail

Placement lead: Before moving on, explain one joint-to-conditional calculation, draw a task-preserving grouping, implement a stable finite update, and distinguish a true information value from an auxiliary bound and an empirical estimate. Then change the question from preserving a label to reconstructing the observation itself.

Draw: ReuseX−1/0/1,Y=X² andmagnitudegroups. Trace−1 and1 toonecodeword andshowtheiridenticallabel1; reconstructionbranch mustchooseoneoutput ordistributionandcannotidentifybothsignedinputs. Marknextcriteriond(x,xhat)withactualpair, notjustatopicbox.

Encoding: Use the shared identity contract below. Every colour distinction also has a persistent text label, shape, pattern or position; selection is an extra outline and does not replace identity. Draw actual model quantities and relationships, with no ornamental colour or unsupported numeric marks.

Required mathematical checks: TaskMI preserved bymagnitude; signedinputnotreconstructedexactly; fixednextdistortion separatefrompredictiveKL.

Narrow/enlarged: At390px and768px with32px root text, stack complete source and destination state sets and reroute each edge to its true labelled endpoint. Retain parallel branches as parallel alternatives; no layout can turn them into a sequential chain. Reserve exterior label gutters and place probabilities directly at their branches.

Following interpretation: In the squared-sensor example, inputs−1 and1 have the same label Y=X² and can be merged without losing label information. A decoder asked to reconstruct the signed input cannot recover both from that one group. The next topic, [Rate-Distortion Theory](/learn/path/full-curriculum/rate-distortion-theory), fixes a reconstruction cost d(x,xhat) and asks what rate supports an acceptable expected distortion. Here the predictive distortion emerged from conditional label distributions. The new criterion and coding assumptions make a different question; an information penalty alone is not a serialized bitstream.

## Live investigations and meaningful changed states

Nine investigations are planned; L5 appears beside the row update and later beside its history, with one coherent state. Old pure models are reusable when their contracts suffice. A new plot/fixture requires only the affected numerical checks; old scientific receipts remain historical. All default results are visible immediately. A numeric draft that is invalid or incomplete retains the last valid active state with a specific inline message. Reset restores all controls, active state, drafts, selection and alerts. Controls are taught before they appear.

| Investigation | Initial live result and controls | Fixed context, changed-case check and conclusion |
| --- | --- | --- |
| L1 joint/conditioning M02/M03 then M06–08 | One investigation with two linked mountings. First mounting beside M02 in section1: joint cells and marginals, selected row mass, row-normalized conditional probabilities, row entropies and correctly weighted conditional total; no product-law, PMI or signed-contribution fields yet. Controls: named law preset, selected row, and source prevalence/channel error only for the binary-channel preset. Equal-row-entropy and unequal-row-entropy fixed-table presets expose row selection only, so no control silently changes their stated law. | Default fair bit has80%agreement. Error0/.5/1 demonstrates perfect/independent/invertibly wrong; zero row is labelled unavailable. Preserve original preset (.45,.15;.10,.30), masses (.6,.4), both row entropies .8112781244591328: uniform averaging accidentally agrees, despite unequal masses. Add unequal-entropy preset (.675,.075;.125,.125): masses (.75,.25), normalized rows (.9,.1) and (.5,.5), costs .4689955935892812 and1; draw multipliers .75/.25 and contributions .3517466951919609/.25 joining at .6017466951919609. Label wrong uniform comparison .7344977967946407. Second mounting follows the actual product-law and PMI teaching in section2, beside M06–08: same current joint law and selected row, plus product grid, selected-cell joint/product comparison, signed PMI and weighted contributions, and summed MI. Product grid and contributions are present immediately at this mounting, with no reveal or learner gate. Preset, row and channel controls share the same state in both mounts; a change in either updates both. Only the second mount adds selected-cell highlighting for its taught PMI operation. Switching preset sets its complete declared law and selects row0/cell00; reset in either mount restores fair80%agreement, row0/cell00, in both. Scrolling alone never resets. No separate second lab count. |
| L2 joint revelation M12–13 | FairA/B XOR, four outcomes and current row/column/pair grouping. RevealA/B/both and Bbias. | A remains fair;bias.25 gives I(A;Y)=.188722,I(B;Y)=0,pair1. Conditional table weights visible; common-cause comparison is a labelled separate static example, not an unexplained mode switch. |
| L3 processing M16–18 | Labelerror.1,encoderflip.2, actual branch composition and before/after information. Controls the two conditional error probabilities0…1/2. | X fair; conditional encoder randomness independent ofYgivenX. Encoder0 preserves, .5 loses all, label.5 leaves no taskinfo. Require composed.26 default and correctloss.357751; choose sufficient partition example separately. |
| L4 representation plane M23–26 | Signal/nuisance law ε=.1,beta3,current signal; all candidates named. Select constant/signal/nuisance/both/noisy; noisyflip control appears only when selected; beta0…12. | Same source/target fixed unless explicit labelerror edit after it is taught. Beta0 shows vertical objective family;beta.5/1/4,noise0/.5. Candidate curve explicitly restricted. Changing beta changes objective, not encoder information coordinates until selection changes. No auto-select implied global optimum. |
| L5 finite update M30–33 | Informative start,ε=.1,beta3,step0; complete q/pz/decoder tables and one selected row's update already visible. Next/previous/steps0…40, start selector(signal/symmetric/nuisance),beta andlabelerror within old validrange. | Step0's proposed row uses its currentdecoder; after applying update show recomputedmarginal/decoder with exactt labels. Maxshift makes stableweights. Symmetricstart remains0 while informativereaches−.600835 at40; no convergencecertificate. Parameters reset sequence consistently; one history computed/cache retained, no repeated stochastic programme. |
| L6 variational gaps M35 | Fixedoldnoisyencoder.2/label.1; actualR=.278072,T=.173254. Reference/decoderaccuracy edits andbeta; upper/lowergap plotted on fixed declared axes. | Changing auxiliaries does not move exactdots. Matchedreference/decoder makes correspondinggap0; poor decoder can make lowernegative; derivedJuppergapisnonnegative. Invalidprobability endpoints either handledmathematically or excluded with explicitvalidrange, never silentlysmoothed. |
| L7 continuous observation M40–43 | Xnormal0,1;sigma.5, noisegeometry andMI1.160964. Sigma0…4 and scale1/10. | Separate change of noise from unit change. Sigma1=.5bits,sigma0infinitywithdiagonal; signquantization is a separatelylabelled finite mechanism. For smallpositive sigma retain stablelog1p formulation, no false numericalzero/noise0 snap. |
| L8 sample and shuffle M44–46 | Existingknownpopulation/seed/samplecount/alphabet configuration, currentcounttable,20shufflevalues and fixedknownpopulationreference. ControlsN20…2000,categories2/4/8,independent/channel,integerseed. | ChangingNusescoherentprefix; explicitsame-seedgenerationcontract. Tablemarginalsandoneshufflemapretained; comparepositiveestimateunderindependence.20shufflesarediagnosticvalues,notCIorcalibratedtest. No claim every realized estimate decreaseswithN. |
| L9 observed coarsening M48 | Palmercounts across344retained species/island/yearrecords; choose all/2007/2008/2009 and fullisland versus deterministicBiscoe/other grouping. | No fittedmodel in this descriptive experiment, therefore no impliedout-of-sampleMI estimate. Show denominator/sampleyear and exactgroupcounts. Coarsening is deterministic, so empiricalMI cannot increase for the same records. Changingyears changeslaw/sample; nevercompare asencoderoperationononefixedlaw. Data provenance and census/causality caveats adjacent. |

M38newVIBstep andM49candidategeneration are guided static traces with whole code/derivation where owned. They are not presented as interactive controls. If later authoring shows an interaction adds a distinct learning benefit, seek design amendment with its specific question rather than adding sliders for visual variety.


## Content-stage mounting clarifications

L1 keeps the accepted shared state and presets. To respect actual manuscript first use, M02 is the initial static row-renormalization drawing; the complete first live view mounts at M03, after row entropy and source weighting have been introduced. The second extension shows product construction at M06 and adds its selected-cell PMI/contribution trace at M07, after that quantity is introduced. These are staged mounts of one investigation, not new independent experiments. The currently taught quantities are visible immediately. Source/context/preset/reset choices remain synchronized across mounts; scrolling never resets. This is a bounded teaching-order refinement of accepted design, for whole content review.

L5 likewise shares a single finite-update state across M30/M31/M33. M30 teaches the scalar normalization example before the full row update. M31 names old/new state timing. The full history comparison arrives at M33 after the block-minimization guarantee and non-global qualification. No history/convergence control implies a certified optimum.

L8 defaults are independent law, seed831, four categories and100 rows, matching the actual old model and component; copied Python stdout belongs to its own generator. L9 uses the exact shipped CSV and computed year/count outputs, not approximate retyped fabricated data. M38,M49 are static guided traces, not inert imitation controls.

## Exact control domains and resets

- L1: binary source P(X=1) in[0,1], error in[0,1], both default.5/.2; row0/1 and cell00/01/10/11 selectors. Fixed-table presets use their complete declared arrays and disable prevalence/error controls with a local fixed-law explanation. Default and every preset change select row0/cell00. The equal-entropy null and unequal-entropy table remain different presets.
- L2: default fairA, Bbias.5 and grouped-by-A view; choose A/B/both and Bbias in[0,1]. Reset restores those values. Zero-mass B contexts are unavailable, not assigned invented conditionals.
- L3: label and encoder flip each in[0,.5], defaults.1/.2, independent conditional draws; reset both together. Test encoder0/.5 and label.5.
- L4: default signal, beta3, noisy-encoder flip.2, fixed label error.1. Beta in[0,12]; noise in[0,.5] only for noisy selection. The source law stays fixed; changing the target is an independent task, not an extra hidden control. Reset signal/beta3/noise.2.
- L5: default informative start, beta3, labelerror.1, step0 and traced row0. Beta[0,12], labelerror[.05,.45], integerstep0…40, starts signal/symmetric/nuisance. Parameter/start edits reset step0 and rebuild one deterministic trace. No arbitrary free-table editor. Reset restores all defaults and clears numeric drafts/messages; both mounts update.
- L6: reference P(Z=1) and decoder-error probabilities both in[.02,.98], defaults.5/.26, beta3 in[0,12]. Fixed encoder error.2 and labelerror.1. Rate/relevance axes remain[−3.5,2.5] bits across all auxiliary edits; any objective ruler uses a separately labelled fixed[−2,42] scale across beta. Match action sets only reference.5/decoder.26; mismatch action sets.8/.4; full reset also restores beta3. No endpoint smoothing.
- L7: default sigma.5, scale1; numeric sigma supports exact0 or[1e−6,4], and scale selector1/10. Invalid or unsupported positive drafts leave the prior state, with explicit supported numerical range; they are not mathematically impossible laws. Positive-noise MI uses a stable log expression, exact0 takes the singular branch. Reset sigma.5/scale1 and linked density selectionX1.
- L8: default independent law, categories4, N100, seed831. Categories2/4/8, N20/100/500/2000, independent or symmetric20%-error channel, integer seed1…2147483647. Reset restores defaults, donor permutation index0, drafts and messages. Twenty diagnostic shuffles are deterministic from the declared stream and retained within one active state; no old Python programme replay.
- L9: default all years and all three island columns. Year all/2007/2008/2009, grouping fullisland/Biscoe-other. Reset all/full. Counts and information update from the exact344 records; year denominators110/114/120. All-to-one grouping belongs to the independent repair task, not an extra unexplained live mode.

Final first-use staging: L6 first mounts at M35 with rate/relevance bounds and the two auxiliary controls. Its objective comparison and beta control extend the same state at M36 after the combined objective is introduced. L7 first mounts at M41 with noise control and its current Gaussian geometry/information; the shared scale selector appears at M42 after the invertible change of units is introduced. Reset from either linked mount restores all defaults. Earlier mounts show updated current values with explicit units after later edits; scrolling never resets state. These are staged views of the same investigations, with no reveal gate.
