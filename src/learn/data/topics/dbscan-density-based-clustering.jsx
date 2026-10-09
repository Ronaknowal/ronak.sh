import React from 'react';
import {H2,H3} from '../../components/content/Headings.jsx';
import {Prose} from '../../components/content/Prose.jsx';
import {NeuralTable} from '../../components/lesson-labs/NeuralLessonElements.jsx';
import {CodeBlock} from '../../components/content/Code.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import {Math as InlineMath,MathBlock} from '../../components/content/Math.jsx';
import '../../components/lesson-labs/lesson-flow.css';
import {Mechanism} from '../../components/lesson-labs/dbscan-reading-flow/DbscanDrawings.jsx';
import '../../components/lesson-labs/dbscan-reading-flow/dbscan-reader.css';
function Content(){return <div className="lesson-flow db-lesson"><Prose opening="summary">{"One isolated measurement and a crowded patch of measurements need not have the same fate. Density-based clustering asks which observations have enough nearby support to connect a group, which can belong at its edge, and which remain unassigned. We will start with a radius drawn around one observation, follow a complete grouping procedure, then build richer descriptions when one radius cannot express the structure."}</Prose>

<Prose opening="route">{"For a first reading, follow sections 1–10: neighborhoods, roles, complete DBSCAN, deliberate geometry, actual measurements and an ordering that exposes changing density. Sections 11–18 continue visibly into nested valley extraction, density-adjusted trees, branch selection and density validity. Return to those sections when the simpler radius cut leaves a question unresolved. Section 19 applies the same contracts to weighted, sparse, larger and changing systems. Section 20 provides independent implementation and diagnosis practice."}</Prose>

<Prose opening="prerequisites">{"You need row vectors, distances and a basic queue. "}<a href={"/learn/path/full-curriculum/k-nearest-neighbors-knn?module=classical-ml#2-make-nearness-an-explicit-choice"}>{"KNN’s explicit distance choice"}</a>{" supplies the geometric foundation. "}<a href={"/learn/path/full-curriculum/k-means-hierarchical-clustering?module=classical-ml#11-build-hierarchies-with-efficient-operations"}>{"KMeans’s maintained-frontier hierarchy"}</a>{" and "}<a href={"/learn/topic/disjoint-sets-union-find#3-implement-the-contract-and-prove-it"}>{"Disjoint Sets’ complete contract"}</a>{" support the later tree algorithms; their changed density assumptions are derived here. "}<a href={"/learn/path/full-curriculum/clustering-evaluation-validation-silhouette-ari-nmi?module=classical-ml#3-silhouette-inspect-one-point-s-neighborhood-before-averaging"}>{"Evaluation’s silhouette"}</a>{", "}<a href={"/learn/path/full-curriculum/clustering-evaluation-validation-silhouette-ari-nmi?module=classical-ml#5-ari-count-the-pairs-before-correcting-for-chance"}>{"pair-count ARI"}</a>{" and "}<a href={"/learn/path/full-curriculum/clustering-evaluation-validation-silhouette-ari-nmi?module=classical-ml#9-unassigned-observations-a-cleaner-score-can-describe-fewer-cases"}>{"unassigned-population comparison"}</a>{" explain what the later report measures."}</Prose>

<Prose opening="exploration">{"The small investigations show a result immediately. Change the quantity beneath a drawing, inspect the corresponding rows and Reset to recover its starting state. A step control follows an algorithm operation; it does not wait for an answer. Practice prompts and their hints and solutions are separate. Complete programs, sibling helpers, offline data and attributed saved outputs are available through the file index and Copy/Download controls. The instructions use Python 3.12, NumPy, SciPy and scikit-learn; the setup states the exact instructional versions and optional tools."}</Prose>

<H2>{"1. What does “crowded nearby” mean?"}</H2>

<Prose>{"Begin with the objects, before deciding what a group should be. One row describes one observation. A two-feature row becomes a point with two coordinates, and its ID remains attached to it. A radius supplies a distance rule for deciding which other rows are near that observation."}</Prose>

<Mechanism id="D01" />

<Prose>{"In the first view, place the selected observation at the center of the disk. The radius is the center-to-boundary distance, measured in the same units as the ruler used for the point coordinates. Points inside or on the boundary enter the roster. A point beyond the disk does not. The center observation enters its own roster once: its distance from itself is zero. Two coincident observations are two rows and contribute twice; drawing them at the same location does not collapse their IDs."}</Prose>

<Prose>{"The selected row is P=(0,0). Q=(.75,0) is inside its radius-1 disk, R=(0,1) is exactly on the boundary, and S=(−.75,−.5) is inside at distance √.8125. T=(1.25,.75) is outside at distance √2.125. The roster is P/Q/R/S. Follow the two cells of R into its horizontal and vertical coordinates: its inclusion follows from the actual ruler, not its drawn color."}</Prose>

<Prose>{"The disk is a Euclidean neighborhood. If the ruler changes, the neighborhood may have another shape; section 6 will show that change. For now keep this ruler fixed. A boundary point is included because the rule is distance "}<strong>{"at most"}</strong>{" the radius, rather than strictly less. That single equality matters when a point lies exactly on the boundary."}</Prose>

<Prose>{"The running hand-calculation example is a one-dimensional trail. Its ten observations retain these IDs and positions:"}</Prose>

<NeuralTable caption={"1. What does “crowded nearby” mean?"} headers={[<>{"ID"}</>,<>{"A"}</>,<>{"B"}</>,<>{"C"}</>,<>{"D"}</>,<>{"E"}</>,<>{"F"}</>,<>{"G"}</>,<>{"H"}</>,<>{"I"}</>,<>{"J"}</>]} rows={[[<>{"Position"}</>,<>{"−1.75"}</>,<>{"−1.5"}</>,<>{"−1.25"}</>,<>{"−1"}</>,<>{"1"}</>,<>{"1.25"}</>,<>{"1.5"}</>,<>{"1.75"}</>,<>{"0"}</>,<>{"4"}</>]]} />

<Prose>{"These are constructed length units, chosen so every boundary and connection can be checked by subtraction. They are not a new measured dataset. On a line the disk becomes a closed interval. At D=−1 with radius 1, that interval is [−2,0]. It contains A, B, C, D and I. At I=0 the interval [−1,1] contains D, I and E. The interval is centered separately for each row; I does not inherit D's roster merely because I appeared in it."}</Prose>

<Prose>{"Write the neighborhood of row p as"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"N_\\varepsilon(p)=\\{q:d(p,q)\\leq\\varepsilon\\}."}</MathBlock></div>

<Prose>{"Here ε is the radius, d(p,q) is the declared distance between the two rows, and N is a set of observation identities. Its cardinality is its number of rows. On this line d(p,q)=|x_p−x_q|. The set includes p. This is a measurement rule before it is a clustering rule: it returns a roster, not a class label."}</Prose>

<Mechanism id="D02" />

<Prose>{"Why use a local roster? A curved trail of supported points can be connected without fitting a ball around a central representative. "}<a href={"/learn/path/full-curriculum/k-means-hierarchical-clustering?module=classical-ml"}>{"KMeans"}</a>{" assigns every row to a representative under its objective. A density rule can follow a supported curve and can leave isolated rows unassigned. Neither result proves that the groups are meaningful: geometry, scale, sampling and the task still decide what the structure means."}</Prose>

<Prose>{"The next step is to distinguish a row with enough nearby support to carry a group forward from a row that merely touches that support."}</Prose>

<H2>{"2. Which observations can carry a group forward?"}</H2>

<Prose>{"Let the minimum count be m=4. A row is a "}<strong>{"core observation"}</strong>{" when its closed roster contains at least four observations, including itself. “Core” describes the result of that local count at this radius. It is not a statement that the row is important, accurate or drawn from a special class."}</Prose>

<Mechanism id="D03" />

<Prose>{"With ε=1, the roster counts in A–J order are 4,4,4,5,5,4,4,4,3,1. A's [−2.75,−.75] interval contains A–D. D includes I at its right boundary. E includes I at its left boundary. Every row A–H is core. I is not core because its roster D/I/E has only three rows. J sees itself alone."}</Prose>

<Prose>{"A "}<strong>{"border observation"}</strong>{" is not core but lies within the radius of a core observation. I is a border row: D and E both provide nearby core support. A "}<strong>{"noise observation"}</strong>{" belongs to neither core support nor any attached border in the resulting partition. J is noise at this setting. Noise is an algorithmic assignment under this declared geometry and scale; it does not prove that J is an erroneous measurement or an outlier under every possible model."}</Prose>

<Prose>{"Core, border and noise are different from cluster identities. The drawing uses row labels to preserve identity, fill/shape to show the local role and distinct group marks to show returned membership. A selected row receives an outline rather than a new group color. Changing m changes the role marks; it does not rename the observation."}</Prose>

<Prose>{"The predicate is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"\\operatorname{core}(p)\\quad\\Longleftrightarrow\\quad \\#N_\\varepsilon(p)\\geq m."}</MathBlock></div>

<Prose>{"The # means “number of observation IDs in the roster.” If A and B occupy the same coordinate, they remain distinct IDs and both count. If one row ID appears twice by mistake in a data join, that is a data-integrity defect; it must not be silently counted as two observations."}</Prose>

<Mechanism id="D04" />

<Prose>{"Keep ε=1 and change only m. At m=3, I becomes core: it can now carry a path between D and E. At m=5, only D and E are core; I still touches both, while A/B/C and F/G/H can be border rows supported by their respective core. At m=6 no row has enough support, so there are no core rows and every row remains unassigned. The threshold line and the role marks change together. A larger minimum can remove support without moving a single coordinate."}</Prose>

<Prose>{"At m=1 every row is core because each sees itself. The grouping rule then becomes connectivity in the radius graph. It can connect a long chain through successive short links, even when the two ends are far apart. That limit will matter when we decide whether a sparse bridge should join dense regions."}</Prose>

<Prose>{"Roles alone do not complete a partition. We need a rule for carrying support from core row to core row and a rule that stops at a border row."}</Prose>

<H2>{"3. How does the group grow—and where does it stop?"}</H2>

<Prose>{"Start a group at A with ε=1 and m=4. A is core, so examine the rows in its roster. B, C and D enter the pending queue. Each can expand because each is core. D's roster adds I. I can join this group as a border, but its three-row roster cannot expand the group onward to E."}</Prose>

<Mechanism id="D05" />

<Prose>{"The queue means “rows still to examine.” It is not a sorted distance ranking or the completed cluster. Mark a row when it enters the queue so repeated rosters cannot create repeated pending slots. When a pending core row is examined, its roster may add new pending rows. When a pending noncore row is examined, the process stops there. After this queue empties, begin a new group at the next unvisited core seed, here E. That second group reaches F/G/H. J never obtains core support and stays noise."}</Prose>

<Mechanism id="D06" />

<Prose>{"Name the one-step relationship "}<strong>{"direct density reachability"}</strong>{". Row q is directly density-reachable from p when p is core and q lies in p's neighborhood:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"p\\leadsto q\\quad\\Longleftrightarrow\\quad\\operatorname{core}(p)\\text{ and }q\\in N_\\varepsilon(p)."}</MathBlock></div>

<Prose>{"The underlying distance is symmetric: d(D,I)=d(I,D)=1. The expansion relationship is directed because the source must be core. D→I is valid; I→D is not valid at m=4. A "}<strong>{"density-reachable"}</strong>{" row can be reached through a sequence of such valid directed steps. Every source along the sequence must have enough support; a final border row need not."}</Prose>

<Mechanism id="D07" />

<Prose>{"I illustrates a subtle boundary. D and E are two units apart, so there is no ε=1 edge between the two core regions. Both can reach I as a final border row. Yet D→I→E is not a valid expansion chain: I cannot take the second step. The two core components remain separate. An implementation assigning I to the first group that reaches it may put I with A–D under left-first seeds and with E–H under right-first seeds. That is a legitimate shared-border ambiguity, rather than evidence that the unchanged core geometry has two contradictory answers."}</Prose>

<Prose>{"Core connectivity is the stable part: join core observations through radius edges, then attach eligible noncore observations to a reached component. Cluster numbers are nominal. “Group 0” under one traversal need not be the same numeric label as “Group 0” under another. Compare row sets and core components, not raw integers. A border row touching multiple components requires the declared first-attachment policy or a deliberately different reporting policy."}</Prose>

<Prose>{"The original terminology also defines density-connected points through a shared supporting source. This helps describe the members of a density-based region, but a shared border does not turn the symmetric relation over all rows into unrestricted graph connectivity. Treating every radius edge as an undirected union would use I to merge the two core components and implement a different method. Conversely, deleting I because it is not core would discard a valid supported border."}</Prose>

<Prose>{"A row examined early may initially be marked noise because it is not core. If a later core expansion reaches it, it can become border. Noise at a failed seed test is not a permanent ban. We can now implement these exact states without storing every row's roster."}</Prose>

<H2>{"4. Can we implement the same process efficiently?"}</H2>

<Prose>{"The straightforward reference computes every pairwise distance and caches all rosters. On n rows that may retain a quadratic number of entries. It is useful for a small trace, but a complete matrix is unnecessary for the expansion itself."}</Prose>

<Mechanism id="D08" />

<Prose>{"The complete cached reference below uses the original ten-row trail. It computes all closed rosters and core predicates first, then expands only core rows."}</Prose>

<RemoteCodeBlock filename="dbscan_trail.py" language="python" source="/learn-code/dbscan-density-based-clustering/original-programs/dbscan_trail.py" />

<Prose>{"Retained original expected output:"}</Prose>

<CodeBlock kind="output" language="output" filename="dbscan_trail.recorded.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/original-programs/dbscan_trail.recorded.txt">{"A 0 core\nB 0 core\nC 0 core\nD 0 core\nE 1 core\nF 1 core\nG 1 core\nH 1 core\nI 0 border\nJ -1 noise"}</CodeBlock>

<Prose>{"Here "}<code>{"labels == -1"}</code>{" means still unassigned during expansion; final types are derived after every core seed has been processed. The label check prevents repeated core expansion. "}<code>{"pending"}</code>{" is a stack, so this reference uses depth-first expansion; the next route uses a queue and explicitly tracks visits. Both preserve core components and can attach a shared border to the first eligible component encountered. The cached all-row rosters can require O(n²) storage, even though the expansion stack is small. Keep this file standalone: its original demonstration is top-level."}</Prose>

<Prose>{"The on-demand implementation asks for the roster only when it first visits a row. It retains a visited flag, a queue-membership flag, a core flag and one label per row. Initially every label is unvisited. A failed core test changes that row to noise. A new core seed gets the next cluster number. Pending rows join that cluster if they were unvisited or prior noise; only newly examined core rows add their roster to the queue."}</Prose>

<Mechanism id="D09" />

<Prose>{"The new program's small input is A(0,0), B(.5,0), C(1,0), D(1,0), E(3,0), with ε=.5 and m=3. A sees A/B and fails as an initial seed. B sees A/B/C/D and starts a group. Reaching A now changes prior noise to border. C and D are distinct coincident observations and both core. E remains isolated. This changes the operands from the ten-row trail and exercises a real state transition."}</Prose>

<Prose>{"The helper contract is the closed, self-inclusive "}<code>{"neighbours(position, eps)"}</code>{" operation already taught. It supplies stable integer positions beside immutable row IDs and coordinates. The complete helper, rank operation and ordinary neighbor-query route appear after the geometry in section 6. Download both files into one directory; importing the helper does not run its demonstration."}</Prose>

<Prose>{"The complete "}<code>{"dbscan_on_demand.py"}</code>{" follows here."}</Prose>

<RemoteCodeBlock filename="dbscan_on_demand.py" language="python" source="/learn-code/dbscan-density-based-clustering/programs/dbscan_on_demand.py" />

<Prose>{"Recorded output for this new program:"}</Prose>

<CodeBlock kind="output" language="output" filename="dbscan_on_demand.stdout.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/programs/dbscan_on_demand.stdout.txt">{"IDs ('A', 'B', 'C', 'D', 'E')\nscratch labels (0, 0, 0, 0, -1)\ncore (False, True, True, True, False)\nqueries per row (1, 1, 1, 1, 1)\nordinary labels (0, 0, 0, 0, -1)\n('query', 'A', ('A', 'B'), False)\n('query', 'B', ('A', 'B', 'C', 'D'), True)\n('noise_to_border', 'A', 0)\n('query', 'C', ('B', 'C', 'D'), True)\n('attach', 'C', 0)\n('query', 'D', ('B', 'C', 'D'), True)\n('attach', 'D', 0)\n('query', 'E', ('E',), False)"}</CodeBlock>

<Prose>{"Read the seed loop first. It skips visited rows, queries an unvisited seed once and either marks noise or opens a group. Then read "}<code>{"enqueue"}</code>{": its mark happens before appending, so overlapping rosters cannot produce duplicate pending slots. In the inner loop, "}<code>{"visited"}</code>{" controls whether a row's roster is queried; "}<code>{"labels"}</code>{" controls whether a row can join the current group. These are distinct states. An already visited noise row needs no second query, but its label may change to the supported group."}</Prose>

<Prose>{"The queue-membership flag remains set across the run. Once a row has entered any queue, it has been examined by the time that queue finishes. A core observation cannot later seed a disconnected component after already being visited through a connected core expansion. A shared noncore row can retain its first attachment without expanding another component. This is why a per-group reset of all membership flags is unnecessary here."}</Prose>

<Prose>{""}<code>{"query_counts"}</code>{" exposes a meaningful invariant: each row is queried exactly once over the complete scan. "}<code>{"core_components"}</code>{" compares stable sets of core IDs, discarding nominal cluster numbers. The ordinary "}<code>{"DBSCAN.fit"}</code>{" uses the same radius, self-inclusive minimum and Euclidean ruler. This new five-row fixture has no ambiguous shared border, so its complete labels agree as well. On the ten-row shared-border fixture, validate core components and permitted border attachment rather than demand package-independent numeric labels."}</Prose>

<Prose>{""}<code>{"DensityPartition"}</code>{" packages the result as immutable tuples: ordered IDs, labels, core flags, query counts and the optional trace. The provider keeps the copied input separately. "}<code>{"deque"}</code>{" supports constant-time removal from the front instead of repeatedly shifting a Python list. The "}<code>{"positive_count"}</code>{" and "}<code>{"radius"}</code>{" helpers reject invalid settings before this state begins. A seed permutation supplies positions once each; changing it changes traversal, not the rows or distance ruler."}</Prose>

<Prose>{"The scratch expansion retains O(n) flags, labels and queue slots, plus one O(n) neighborhood buffer and the provider's O(nd) coordinate input. Brute neighborhood queries do O(n²d) total distance work. Optional teaching traces retain rosters and can add quadratic output storage; the source limits them to small inputs and separates them from the untraced algorithm. The ordinary sklearn implementation can retain all neighborhoods, with worst-case quadratic memory for dense rosters. A different search structure may speed queries on suitable geometry, but its output can itself be quadratic. “Uses an index” does not guarantee subquadratic worst-case work."}</Prose>

<Prose>{"The procedure is DBSCAN: Density-Based Spatial Clustering of Applications with Noise. Its expansion contract has become a complete program. The next question is how to choose the two quantities that determine its support."}</Prose>

<H2>{"5. How do radius and minimum count work together?"}</H2>

<Prose>{"The minimum count specifies how much nearby support is required. The radius specifies what “nearby” means. They cannot be read independently from a cluster count."}</Prose>

<Mechanism id="D10" />

<Prose>{"For D=−1 the sorted distances are 0,.25,.5,.75,1,2,2.25,2.5,2.75,5. The fourth distance is .75. D therefore becomes core at radius .75 when m=4. For I=0 the sorted distances are 0,1,1,1.25,1.25,1.5,1.5,1.75,1.75,4. Its fourth distance is 1.25, so I is not core at radius 1 but becomes core at 1.25. Ties occupy separate observation ranks; the first zero is the row itself."}</Prose>

<Prose>{"Call the mth self-inclusive distance the "}<strong>{"core radius"}</strong>{" c_m(p). Then, where at least m observations exist,"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"\\operatorname{core}(p)\\quad\\Longleftrightarrow\\quad c_m(p)\\leq\\varepsilon."}</MathBlock></div>

<Prose>{"A cap can make a core radius unavailable: if fewer than m rows are within the maximum searched distance, record infinity rather than invent a finite value. If m exceeds the entire row count, no row is core. Infinity means “not obtained under this support/cap,” not an extra distant observation."}</Prose>

<Mechanism id="D11" />

<Prose>{"Sorting the per-row core radii gives a useful diagnostic: a radius cut shows which rows satisfy the support requirement. It is not an automatic optimal-radius oracle. A bend can reflect two density scales, sampling variation, a boundary or a geometry choice; it can also be weak or absent. Inspect the local rosters and the task rather than claim that every curve contains one objectively correct elbow."}</Prose>

<Mechanism id="D12" />

<Prose>{"Keep m=4. At ε=.125 all ten rows are noise. At ε=.5 only B/C and F/G are core; A/D and E/H attach at their edges, while I/J remain noise. At ε=.75 all A–H are core and I/J remain noise. At ε=1, I attaches as a shared border. At ε=1.25, I is core and joins the left and right supported regions. These outcomes follow actual ranks and edges, not a target number of clusters. Increase the radius far enough and an isolated row can also acquire support; an easier assignment is not necessarily a better account of the task."}</Prose>

<Prose>{"An exact roster query includes every tied boundary neighbor. An optimized rank selection may find the fourth distance without sorting all distances, but the rank result is a scalar. It must not masquerade as a sorted roster or omit other rows tied at that radius. The complete helper offers both a stable sorted reference and ordinary NumPy rank selection with this distinction visible."}</Prose>

<Prose>{"The original ordinary rank route follows in full. Passing the explicit query matrix X to "}<code>{"kneighbors"}</code>{" retains each row itself, so the fourth returned distance is column index 3."}</Prose>

<RemoteCodeBlock filename="dbscan_core_radius.py" language="python" source="/learn-code/dbscan-density-based-clustering/original-programs/dbscan_core_radius.py" />

<Prose>{"Retained original expected output:"}</Prose>

<CodeBlock kind="output" language="output" filename="dbscan_core_radius.recorded.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/original-programs/dbscan_core_radius.recorded.txt">{"[0.75, 0.5, 0.5, 0.75, 0.75, 0.5, 0.5, 0.75, 1.25, 2.75]\n[0.5, 0.5, 0.5, 0.5, 0.75, 0.75, 0.75, 0.75, 1.25, 2.75]\n8"}</CodeBlock>

<Prose>{"The first printed array stays in input order; the second sorts the per-row scalar core radii for the diagnostic plot. Neither operation changes row IDs or fits a cluster. The final count 8 says A–H qualify at radius 1, not that I/J must be removed from every report. An optimized scalar rank still differs from a complete sorted neighbour roster."}</Prose>

<Prose>{"The distances are only useful if their units and contributions represent the question. That is the next decision."}</Prose>

<H2>{"6. Does the ruler change the result?"}</H2>

<Prose>{"Suppose two coordinates measure different quantities. An unqualified Euclidean ruler adds their squared differences as if their numerical scales had a shared meaning. The resulting neighborhood can be dominated by the numerically larger coordinate."}</Prose>

<Mechanism id="D13" />

<Prose>{"For p=(0,0) and q=(1,1), the original Euclidean distance is √2. Multiply the second coordinate by 10 while preserving the first: their new distance is √101. A radius 2 accepts the original pair but rejects the transformed pair. In original coordinates the transformed radius-2 disk pulls back to x²+100y²≤4, an ellipse. That is a different ruler, not the same grouping written in another unit."}</Prose>

<Prose>{"Standardization supplies one possible declared ruler. A fitted transform subtracts each feature's training mean and divides by its training scale. It does not prove that all standardized contributions are equally useful. Zero-variation columns, missing values, sparse inputs and fitting populations need their own contracts. Here complete finite inputs keep the focus on the geometry; the later portable template states who fits state and which rows are merely transformed."}</Prose>

<Mechanism id="D14" />

<Prose>{"Uniform conversion is different. Multiply every coordinate by a positive constant a and multiply ε by the same a. Euclidean distances multiply by a, so d(p,q)≤ε is equivalent to ad(p,q)≤aε. All rosters, roles and core components remain unchanged. If only one coordinate changes unit, apply the corresponding compensation in the distance rule or deliberately accept the new weighting. Leaving the old radius against changed units has no invariance claim."}</Prose>

<Mechanism id="D15" />

<Prose>{"Latitude and longitude need a surface ruler. Two equatorial observations at longitudes 179° and −179° are separated by 2° along the short great-circle arc, not 358° across an ordinary longitude axis. The Haversine function uses rows "}<code>{"[latitude, longitude]"}</code>{" in radians and returns an angular distance. Multiplying by the declared spherical Earth radius 6371.0088 km converts that result to kilometres. A 2° angular separation is π/90 radians, about 222.39 km under that spherical model. This approximates the Earth as a sphere; it is not an exact ellipsoidal survey distance."}</Prose>

<Prose>{"For latitudes φ₁/φ₂ and longitude difference Δλ, set"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"h=\\sin^2((\\varphi_2-\\varphi_1)/2)+\\cos\\varphi_1\\cos\\varphi_2\\sin^2(\\Delta\\lambda/2),\\qquad \\theta=2\\arcsin\\sqrt h."}</MathBlock></div>

<Prose>{"The half-angle expression respects wraparound through the sine. Numerical clamping of h to [0,1] handles roundoff near endpoints; it does not repair degree values fed into a radians API. At a pole, multiple longitude labels describe the same physical point. The mathematical angular separation there is zero; floating-point evaluation can leave a tiny residue. The drawing describes that geometric identity without claiming that every floating-point pole calculation is exactly zero."}</Prose>

<Prose>{"This complete original ordinary example uses four declared equatorial positions and a two-kilometre radius converted with its explicitly chosen Earth radius 6371 km. The reusable helper below uses 6371.0088 km for its separate dateline example; these are named spherical conversion constants, not silently identical arrays."}</Prose>

<RemoteCodeBlock filename="dbscan_geographic.py" language="python" source="/learn-code/dbscan-density-based-clustering/original-programs/dbscan_geographic.py" />

<Prose>{"Retained original expected output:"}</Prose>

<CodeBlock kind="output" language="output" filename="dbscan_geographic.recorded.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/original-programs/dbscan_geographic.recorded.txt">{"[0, 0, 0, -1]"}</CodeBlock>

<Prose>{""}<code>{"np.deg2rad"}</code>{" changes degree-valued inputs into the angular units expected by "}<code>{"metric=\"haversine\""}</code>{". Dividing 2 km by6371 km supplies the angular ε. "}<code>{"ball_tree"}</code>{" uses the supported spherical metric to search neighbours; it does not interpret the raw degree differences as Euclidean lengths. The three nearby rows connect with self-inclusive minimum 2; the last is noise in the recorded result."}</Prose>

<Prose>{"The complete "}<code>{"density_neighbourhoods.py"}</code>{" now brings the geometry, closed roster, self-inclusive rank and ordinary query into one reusable file."}</Prose>

<RemoteCodeBlock filename="density_neighbourhoods.py" language="python" source="/learn-code/dbscan-density-based-clustering/programs/density_neighbourhoods.py" />

<Prose>{"Recorded output for this new program:"}</Prose>

<CodeBlock kind="output" language="output" filename="density_neighbourhoods.stdout.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/programs/density_neighbourhoods.stdout.txt">{"radius 0.5 minimum including self 3\nA roster ['A', 'B'] count 2 core radius 1.0\nB roster ['A', 'B', 'C', 'D'] count 4 core radius 0.5\nC roster ['B', 'C', 'D'] count 3 core radius 0.5\nD roster ['B', 'C', 'D'] count 3 core radius 0.5\nE roster ['E'] count 1 core radius 2.0\ndateline angular radians 0.034906585039886445\ndateline kilometres 222.39016046706487"}</CodeBlock>

<Prose>{""}<code>{"Neighbourhoods"}</code>{" freezes copied coordinates and the ordered unique-ID table. Positions index arrays; IDs identify observations. A roster returns each position at most once in stable input order, together with its actual length. The reference core radius sorts "}<code>{"(distance, position)"}</code>{" pairs and selects index m−1. "}<code>{"selected_core_radius"}</code>{" uses "}<code>{"np.partition"}</code>{" only for that scalar rank. Duplicates remain distinct rows, and all finite distances tied at the eventual radius still belong to a closed roster."}</Prose>

<Prose>{"The ordinary "}<code>{"NearestNeighbors"}</code>{" route passes the row matrix explicitly to "}<code>{"radius_neighbors"}</code>{". With "}<code>{"X=None"}</code>{", its query convention omits the row itself; that would shift the minimum-count meaning. Explicit queries retain the zero-distance self observation and other coincident rows. The demonstration compares roster IDs, separately checks the scalar rank, and prints the angular-to-kilometre dateline conversion. The Euclidean and Haversine choices are actual rulers, not labels on the same coordinate subtraction."}</Prose>

<Prose>{"The brute provider stores the input and builds one roster at a time. A sorted rank costs O(n log n) work and O(n) temporary storage for one row. NumPy selection avoids the full ordering but has its own array allocation; it does not make a complete all-row rank computation free. The library demonstration returns all rosters for comparison and therefore retains their total output separately. Approximate neighbor search cannot be substituted while retaining the exact closed-neighborhood claim."}</Prose>

<Prose>{"One more distinction matters when a ruler is fitted from data: its state belongs to particular training rows. A new row can use that ruler without helping to define it."}</Prose>

<Mechanism id="D61" />

<Prose>{"The new small example uses training rows T0=(1,10), T1=(2,20), T2=(4,40), T3=(5,50). Their first-feature mean is 3 and their second-feature mean is 30. The first centered deviations are −2,−1,1,2; their squared values sum to 10. Dividing by four gives variance 2.5 and scale √2.5. The second column has ten times those deviations, so its variance is 250 and scale √250. These are constructed training measurements chosen to expose the state; they are not extra Iris rows."}</Prose>

<Prose>{"For feature j fitted from n training rows, use"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"\\mu_j=\\frac1n\\sum_i x_{ij},\\qquad \\sigma_j=\\sqrt{\\frac1n\\sum_i(x_{ij}-\\mu_j)^2},\\qquad z_j=\\frac{x_j-\\mu_j}{\\sigma_j}."}</MathBlock></div>

<Prose>{"The variance uses division by n, the population-style convention of this standardizer, rather than the n−1 sample variance estimator. A zero-variation training column receives scale 1 so centering is defined without division by zero. That policy does not make the feature informative. A held-out row Q=(3,90) becomes (0,60/√250), approximately (0,3.794733). Its second coordinate is above the training range under the fixed ruler. Recomputing the mean and scale after seeing Q would answer a different fitting question."}</Prose>

<Prose>{"The complete "}<code>{"density_geometry.py"}</code>{" performs the copied unit conversion, changed anisotropic distance and training-only fitted transform. Its immutable state stores the actual mean and scale tuples; transformation validates the feature width and produces copied output. The ordinary "}<code>{"StandardScaler"}</code>{" receives only the four training rows in "}<code>{"fit"}</code>{", then transforms both training and Q. The comparisons below cover these supplied well-conditioned inputs; a library's additional numerical safeguards are not a claim that every possible near-constant or extreme input follows this minimal scratch policy identically."}</Prose>

<RemoteCodeBlock filename="density_geometry.py" language="python" source="/learn-code/dbscan-density-based-clustering/programs/density_geometry.py" />

<Prose>{"Recorded output for this new program:"}</Prose>

<CodeBlock kind="output" language="output" filename="density_geometry.stdout.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/programs/density_geometry.stdout.txt">{"uniform factor 1000 radius 500.0 same labels (0, 0, 0, 0, -1)\nanisotropic distance at scale1 1.4142135623730951\nanisotropic distance at scale10 10.04987562112089\ntraining IDs ('T0', 'T1', 'T2', 'T3')\nmean [ 3. 30.]\nscale [ 1.581139 15.811388]\ntransformed training [[-1.264911 -1.264911]\n [-0.632456 -0.632456]\n [ 0.632456  0.632456]\n [ 1.264911  1.264911]]\nheld-out Q [[0.       3.794733]]\nconstant-column scale (1.0, 1.0)"}</CodeBlock>

<Prose>{"The first output line checks a uniform factor 1000 against the new five-row density partition: the radius follows the coordinate units, so the labels agree. The two anisotropic distances show why scaling one feature changes the ruler. The mean/scale and transformed rows expose fitted state directly, then Q uses it without a refit. Fitting moments costs O(nd) work with O(d) retained state, apart from the input/copy arrays. Transforming q rows costs O(qd) work and output storage. A defensive input copy is separately retained during this implementation's calculation; the O(d) claim refers to fitted state, not the entire resident program."}</Prose>

<Prose>{"We have made observation identity, local support, expansion, geometry and the ruler's fitted state explicit. Now apply them to actual measurements and ask what a returned grouping lets us conclude."}</Prose>

<H2>{"7. What do groups in actual measurements tell us?"}</H2>

<Prose>{"The offline Iris collection contains 150 measured flowers, each with four features in centimetres: sepal length, sepal width, petal length and petal width. One row is one flower. The supplied local ID follows the file's row order; it is not a time stamp or a globally assigned specimen identity. Species is a separate annotation with codes 0=setosa, 1=versicolor, 2=virginica."}</Prose>

<Mechanism id="D16" />

<Prose>{"Follow ID 0. Its feature vector is (5.1,3.5,1.4,.2), and its separate species annotation is 0. All four feature values contribute to the declared clustering ruler. A two-feature plot may display, for example, petal length 1.4 and petal width .2; those two displayed coordinates do not mean that the other two features were omitted from fitting. The saved standardized fit records retain labels and roles but do not contain the numerical scaler arrays. The corresponding state in this drawing is therefore labelled symbolically as four means and four scales. The new toy calculation in section 6 provides actual numeric fitted state separately."}</Prose>

<Prose>{"This supplied CSV is the corrected "}<code>{"sklearn.datasets.load_iris"}</code>{" copy described in the "}<a href={"/learn-code/dbscan-density-based-clustering/programs/iris-source.md"}>{"data provenance"}</a>{", adapted with named columns and local IDs. "}<a href={"https://archive.ics.uci.edu/dataset/53/iris"}>{"UCI's Iris entry"}</a>{" gives the dataset attribution and CC BY4.0 license. Keep this exact copy when comparing saved outputs: replacing it with a historically different Iris file can change distances and assignments. This selected class-balanced collection is useful for a small finite descriptive analysis; its densities are not a census of ecological species prevalence."}</Prose>

<Prose>{"The descriptive reports standardize all four features using the available 150 rows, then inspect a stated parameter grid. That is a description of this finite collection. It is not a held-out estimate of future performance, and species is never part of the fitted geometry. The later template separates development choices and reporting rather than choosing parameters to recover the species labels."}</Prose>

<Mechanism id="D17" />

<Prose>{"For standardized features at ε=.5/m=5, the retained report has 93 core rows,23 border rows and 34 noise rows. Thus 116/150≈.773333 are assigned. At ε=.8 with the same minimum,138 are core,8 are border and 4 are noise:146/150≈.973333 assigned. Those four noise IDs are 41,109,117,131. At ε=1, row 109 becomes an assigned border, leaving 41,117,131 unassigned. The population changes are actual row identities, not merely percentages sliding on a gauge."}</Prose>

<Prose>{"These memberships do not certify species. At ε=.3 the report has three groups, but assigns only 30/150 rows. Matching the number of named species is not evidence that the selected density groups recovered those species. At ε=.5/m=10 the assigned-only ARI is1, yet only 61/150 flowers are assigned and the all-row ARI is about .279191. The stronger conditional score comes with 89 unassigned cases. A conclusion about those 61 cases cannot be silently extended to all 150."}</Prose>

<Mechanism id="D18" />

<Prose>{""}<a href={"/learn/path/full-curriculum/clustering-evaluation-validation-silhouette-ari-nmi?module=classical-ml#5-ari-count-the-pairs-before-correcting-for-chance"}>{"ARI counts pairs"}</a>{", so its population must be explicit. An all-row convention can treat−1 as one additional nominal group, even though noise rows are not claimed to be mutually similar. An assigned-only convention excludes noise and describes a subset. Comparing two methods on their separate assigned subsets also changes which pairs are available. A comparison on their common retained IDs makes the support explicit, but can discard still more observations. None of these is automatically the single correct policy; report the question and exact IDs with the chosen scalar."}</Prose>

<Prose>{""}<a href={"/learn/path/full-curriculum/clustering-evaluation-validation-silhouette-ari-nmi?module=classical-ml#3-silhouette-inspect-one-point-s-neighborhood-before-averaging"}>{"Silhouette"}</a>{" similarly evaluates a declared population, partition and ruler. The ε=.5 standardized report has assigned-only silhouette about .655889; at ε=.8 it is about .597941. The second setting assigns 30 more rows. A lower conditional silhouette with much higher coverage is a real tradeoff to inspect, not an automatic rejection. Scores from the original centimetre ruler and the standardized ruler also evaluate different geometries, even when their parameter numbers look similar."}</Prose>

<Mechanism id="D19" />

<Prose>{"Two points may appear close in the displayed petal plane while differing in sepal measurements. Color the displayed points with their recorded full-feature labels and keep the full selected row beside the plot. Changing the display axes must not recompute the fit. Otherwise the visual would silently change the scientific question while pretending merely to rotate a picture."}</Prose>

<Prose>{"The complete original ordinary-library route "}<code>{"dbscan_iris.py"}</code>{" shows how the report was computed. It loads the offline numeric columns, fits "}<code>{"StandardScaler"}</code>{" to the descriptive feature table, fits DBSCAN under each stated radius, and prints noise IDs with scores. The original recorded stream is supplied after it; it retains its earlier execution role. Its "}<code>{"silhouette_score"}</code>{" call computes inside the assigned-only population, rather than using focal points against all 150 rows. The condition guards the defined range 2≤groups<assigned rows. Its all-row "}<code>{"adjusted_rand_score"}</code>{" receives the full species and label arrays, including−1 as a nominal label."}</Prose>

<RemoteCodeBlock filename="dbscan_iris.py" language="python" source="/learn-code/dbscan-density-based-clustering/original-programs/dbscan_iris.py" />

<Prose>{"Original recorded stream:"}</Prose>

<CodeBlock kind="output" language="output" filename="dbscan_iris.recorded.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/original-programs/dbscan_iris.recorded.txt">{"eps clusters core border noise coverage silhouette ARI_all\n0.3 3 19 11 120 0.200 0.630 0.088\nnoise_ids [5, 6, 8, 10, 13, 14, 15, 16, 18, 19, 21, 22, 23, 24, 31, 32, 33, 35, 36, 38, 41, 43, 44, 46, 48, 50, 51, 52, 53, 54, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 89, 90, 91, 92, 93, 94, 97, 98, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149]\n0.5 2 93 23 34 0.773 0.656 0.442\nnoise_ids [14, 15, 32, 33, 41, 56, 57, 59, 60, 62, 68, 72, 85, 87, 93, 98, 100, 105, 106, 107, 108, 109, 114, 117, 118, 119, 122, 125, 129, 130, 131, 135, 136, 148]\n0.8 2 138 8 4 0.973 0.598 0.552\nnoise_ids [41, 109, 117, 131]\n1.0 2 142 5 3 0.980 0.595 0.554\nnoise_ids [41, 117, 131]"}</CodeBlock>

<Prose>{"Notice that "}<code>{"features"}</code>{" contains only columns 1:5. The species vector is read separately and enters the retrospective ARI calculation only after fitting. The printed noise IDs preserve which observations were omitted from silhouette. A missing score is preferable to inventing a finite silhouette for an all-noise or one-group result. The stream reports four configurations with their declared populations and settings."}</Prose>

<Prose>{"The new "}<code>{"iris_density_analysis.py"}</code>{" provides a safer offline interpretation route: read the same CSV and seven retained fit records, validate their ID and role alignment, and print their already recorded score fields. It deliberately does not fit another model. The row query links the four observed measurements, separate species annotation and saved role for one ID. The ordinary fitting source above remains available when a real new analysis is needed."}</Prose>

<RemoteCodeBlock filename="iris_density_analysis.py" language="python" source="/learn-code/dbscan-density-based-clustering/programs/iris_density_analysis.py" />

<Prose>{"Output of the new reader of retained records:"}</Prose>

<CodeBlock kind="output" language="output" filename="iris_density_analysis.stdout.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/programs/iris_density_analysis.stdout.txt">{"Recorded fitting environment {'numpy': '2.3.5', 'scipy': '1.18.1', 'sklearn': '1.9.1'}\nrepresentation eps minimum groups core border noise coverage silhouette_assigned ARI_all ARI_assigned\nfour original cm features 0.5 5 2 117 16 17 0.886667 0.735356 0.520619 0.607274\nfour standardized features 0.3 5 3 19 11 120 0.200000 0.630176 0.087595 0.361978\nfour standardized features 0.5 5 2 93 23 34 0.773333 0.655889 0.442099 0.630934\nfour standardized features 0.8 5 2 138 8 4 0.973333 0.597941 0.551755 0.570937\nfour standardized features 1 5 2 142 5 3 0.980000 0.595186 0.553582 0.568219\nfour standardized features 0.5 3 7 119 14 17 0.886667 0.259122 0.452575 0.544564\nfour standardized features 0.5 10 3 22 39 89 0.406667 0.710088 0.279191 1.000000\nRow0 in recorded standardized eps.5/minimum5 fit {'id': 0, 'features_cm': (5.1, 3.5, 1.4, 0.2), 'species_annotation': 0, 'recorded_label': 0, 'recorded_role': 'core'}"}</CodeBlock>

<Prose>{"The fingerprint checks exact values and order, allowing only equivalent LF/CRLF file records. The role sets must be disjoint and cover all 150 IDs; noise IDs must agree with−1 labels. These are input/report integrity checks, not a second validation of the original statistical results. The new program's output is an actual execution of this reader of saved records, not new clustering output. Keeping that distinction lets the full source and record stay reproducible without claiming an experiment that did not occur."}</Prose>

<Prose>{"The task therefore needs more than a cluster count: state the ruler, support threshold, retained population, role/ID map and assessment policy. Some datasets raise a harder issue even before scoring: no single radius can express all the desired regions. The next constructed example makes that limitation exact."}</Prose>

<H2>{"8. When can no single radius do the job?"}</H2>

<Prose>{"Use twelve line observations in three intended regions. The first two have positions 0,.125,.25,.375 and .75,.875,1,1.125. The third has 5,5.75,6.5,7.25. Keep m=3. The word “intended” specifies the comparison question; the algorithm has not been supplied with three labels to optimize against."}</Prose>

<Mechanism id="D20" />

<Prose>{"The diffuse third region needs radius at least .75. Below that, none of its rows sees another, so its count is only 1 and it has no core support. At .75 its two middle rows each see themselves and both adjacent observations, become core and attach the endpoints. Yet the closest link between the two dense regions is .375, from the row at .375 to the row at .75. At that radius both endpoints are already core and the edge merges the two dense regions. Keeping those dense regions separate therefore requires radius strictly below .375."}</Prose>

<Prose>{"The requested three supported regions would require both"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"\\varepsilon\\geq .75\\qquad\\text{and}\\qquad\\varepsilon<.375."}</MathBlock></div>

<Prose>{"The intervals do not overlap. Trying more decimal places cannot resolve an incompatible requirement. At radius .25, the first two regions remain separate and supported, while the third is unassigned. At .375, the first two join. At .75 the third becomes supported, but the dense pair remains joined. This is a difference in density scales, not a failure to specify the desired number of groups."}</Prose>

<Prose>{"Change one quantity in the drawing: the third region's spacing δ, while keeping its first position 5 and the two dense regions fixed. Its positions become 5,5+δ,5+2δ,5+3δ. For δ in the specified range .125–.9, the support condition is ε≥δ, while the forbidden dense bridge remains ε<.375. A valid interval appears when δ<.375. At δ=.125, ε=.25 supports all three regions separately; at δ=.25 the same radius remains valid at its closed boundary. At δ=.375 the interval vanishes because the forbidden bridge is included at equality. This null/changed comparison shows exactly which assumption made the original failure inevitable."}</Prose>

<Mechanism id="D21" />

<Prose>{"Shape is another issue. The retained ring fixture has 12 equally spaced observations on a radius 1 circle and 36 on a radius 3 circle. Within each ring adjacent chords are approximately .517638 and .522934, respectively. At ε=.6/m=3, each observation has itself and its two adjacent neighbors, giving all 48 core support. The minimum cross-ring separation is2, greater than .6, so those supported chains remain separate. This exposes curved group geometry with similar local support scales; it is different from the line example's incompatible density scales."}</Prose>

<Prose>{"The complete original "}<code>{"dbscan_rings.py"}</code>{" compares those exact coordinates with a two-center KMeans fit. The saved density result has ring ARI 1 and all 48 core; the retained KMeans ring ARI rounds to−.016. These describe the supplied constructed fixture and its original controlled comparison. They are not a universal ranking of methods on measured data. The picture shows the actual retained memberships and supplied coordinates; it does not relabel an illustrative curve as a newly measured result."}</Prose>

<RemoteCodeBlock filename="dbscan_rings.py" language="python" source="/learn-code/dbscan-density-based-clustering/original-programs/dbscan_rings.py" />

<Prose>{"Original recorded stream:"}</Prose>

<CodeBlock kind="output" language="output" filename="dbscan_rings.recorded.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/original-programs/dbscan_rings.recorded.txt">{"core rows 48\nDBSCAN ring ARI 1.0\nKMeans ring ARI -0.016"}</CodeBlock>

<Prose>{"The source constructs both rings explicitly, supplies the target ring IDs only to the later evaluation, and fits the methods on the same feature matrix. Its KMeans settings specify two centers, ten restarts and random seed 0. DBSCAN specifies radius .6 and self-inclusive minimum 3. Different objectives explain the contrast: center assignment favors representative-based regions, while local support can follow a closed curve without one representative at its center."}</Prose>

<Prose>{"When one radius loses structure across density scales, we can retain more of the distance information before choosing groups. OPTICS will first build an ordering with a distance attached to each reached observation. A later cut or valley extraction can then inspect that structure without refitting a separate radius choice at every step."}</Prose>

<H2>{"9. Remember how regions connect before choosing a cut"}</H2>

<Prose>{"The previous failure came from trying to summarize several density scales with one radius. OPTICS keeps a processing order and the distances needed to reach successive observations. We can inspect that order before extracting a partition. It is an ordered record of connectivity, not a new feature coordinate and not a ranking of importance."}</Prose>

<Mechanism id="D22" />

<Prose>{"Return to D at −1 and I at 0. D's fourth-neighbour distance is .75. Its distance to I is 1. The proposed cost of reaching I "}<strong>{"from D"}</strong>{" is the larger of those two lengths, 1. Reversing the arrow changes the first operand: I's fourth-neighbour distance is 1.25, so reaching D from I costs 1.25. The raw edge is identical; the source's local density requirement differs. Keep the source ID beside its disk so that the direction is visible."}</Prose>

<Prose>{"For a source p with finite core radius c(p), define the proposal to an unprocessed candidate q as"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"r(q\\mid p)=\\max\\{c(p),d(p,q)\\}."}</MathBlock></div>

<Prose>{"A source with insufficient neighbours inside the construction cap has infinite core radius and supplies no proposal. Each unprocessed row remembers its smallest proposal so far, called its "}<strong>{"reachability"}</strong>{", and the source that supplied that proposal, called its "}<strong>{"predecessor"}</strong>{". Neither value is an intrinsic property of the row alone: the processing history matters. The final core radius describes the row's own neighbourhood; the remembered reachability describes how the algorithm approached it."}</Prose>

<H3>{"Keep one pending slot for each row"}</H3>

<Mechanism id="D23" />

<Prose>{"Suppose the pending rows occupy slots "}<code>{"[R, S, Q, T]"}</code>{", with keys "}<code>{"[1, 1.5, 2, 3]"}</code>{". Q currently remembers predecessor A. P has core radius .5 and lies .25 from Q. Its proposal is therefore .5, strictly better than 2. Write Q's key and predecessor first. That intermediate state violates the priority order; it is explicitly an operation in progress. Then move Q above R. The committed slots become "}<code>{"[Q, S, R, T]"}</code>{". The inverse position table must change with the swap: Q is at 0 and R at 2, while S and T retain positions 1 and 3."}</Prose>

<Prose>{"A "}<strong>{"heap"}</strong>{" is a compact priority tree: each parent's key is no larger than either child's key. Slot i has children 2i+1 and 2i+2. A minimum is therefore at the root. The inverse table tells us where Q is without scanning all pending slots. When a key decreases, compare that slot with its parent and swap upward until the invariant returns. Every swap updates both inverse entries. Ties use input position here, making the implementation deterministic for the supported arithmetic."}</Prose>

<Prose>{"Extract Q next. Remove its inverse entry, move T from the last slot to the root, then compare the two children. R has key 1 and S has 1.5; move R above T. The committed slots are "}<code>{"[R, S, T]"}</code>{". This is downward repair of the same heap, not a second independent priority list. A worse proposal of 2.5 to the earlier Q=2 state changes nothing. An equal proposal also changes nothing, including the predecessor. The local Step/Back investigation follows these writes and swaps; it has no additional parameter to learn."}</Prose>

<Prose>{"This heap stores one pending slot per row. A decrease or minimum extraction needs at most O(log n) repairs. It does not add a duplicate queue entry each time a proposal improves. The optional "}<code>{"heapq"}</code>{" alternative works differently: it can retain both "}<code>{"(2,Q)"}</code>{" and "}<code>{"(.5,Q)"}</code>{", then discard the stale "}<code>{"(2,Q)"}</code>{" when extracted. Such an alternative needs an authoritative best-key table and a stale-entry check. It can accumulate O(n²) entries after many strict improvements; it does not inherit the indexed heap's O(n) pending storage."}</Prose>

<H3>{"Process the spatial observations in that priority order"}</H3>

<Mechanism id="D24" />

<Prose>{"The retained ten-row calculation, with self-inclusive minimum 4 and construction cap 2, processes "}<code>{"[A, B, C, D, I, E, F, G, H, J]"}</code>{". Its ordered reachability values are "}<code>{"[∞, .75, .5, .5, 1, 1.25, .75, .5, .5, ∞]"}</code>{". The first row starts a component without an earlier proposal. J is also unreached and starts again. Infinity means that restart; it is not an unusually tall finite bar. The figure therefore draws restart glyphs outside the finite vertical distance scale."}</Prose>

<Prose>{"Read the first valley with the actual points above it. A proposes .75 to the nearby rows. Processing B improves C and D to .5. D eventually proposes 1 to I; processing I proposes 1.25 to E. The order records the narrow left region, the shared boundary, and the right region. The horizontal axis is processing position. It does not show the distance between A and B along the original line, and adjacent plotted bars need not be adjacent spatial observations."}</Prose>

<Prose>{"The complete scratch route below first calculates each capped core radius. It then starts at the first unprocessed input row, marks that row processed, and proposes improvements to its unprocessed neighbours. It repeatedly extracts the smallest pending reachability and processes that row. Only when the heap is empty does it start at the next unreached row. Core distances, reachabilities and predecessors remain indexed by "}<strong>{"input position"}</strong>{"; "}<code>{"ordering"}</code>{" is the permutation used to plot them. Stable IDs are translated at the display boundary. Never index a predecessor ID as if it were its position in the ordered plot."}</Prose>

<RemoteCodeBlock filename="optics_ordering.py" language="python" source="/learn-code/dbscan-density-based-clustering/programs/optics_ordering.py" />

<Prose>{"Actual once-executed output of this exact new source:"}</Prose>

<CodeBlock kind="output" language="output" filename="optics_ordering.stdout.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/programs/optics_ordering.stdout.txt">{"improved slots ['Q', 'S', 'R', 'T'] Q predecessor P\nafter Q extraction ['R', 'S', 'T']\ncap inf order ['v0', 'v1', 'v2', 'v3'] reachability [inf, 1.0, 3.0, 1.0] predecessor [-1, 0, 1, 2]\ncap 1.0 order ['v0', 'v1', 'v2', 'v3'] reachability [inf, 1.0, inf, 1.0] predecessor [-1, 0, -1, 2]"}</CodeBlock>

<Prose>{""}<code>{"IndexedHeap.improve"}</code>{" performs a strict comparison before changing either key or predecessor. A new row obtains one slot; an existing row keeps its slot until repair. "}<code>{"swap"}</code>{" synchronizes the inverse table immediately. "}<code>{"pop"}</code>{" removes the extracted row's position and repairs the replacement. "}<code>{"optics"}</code>{" only improves unprocessed candidates, so an extracted row never returns to the pending heap. The graph arrays are immutable tuples in the returned "}<code>{"Ordering"}</code>{" record; the internal arrays are working storage."}</Prose>

<Prose>{"The optional trace preserves complete heap snapshots for a tiny teaching example only. It is refused above 64 observations, and its retained frames have their own storage cost. The O(n) auxiliary metadata claim applies when tracing is off, excluding the input rows and the current neighbour response. With the brute distance provider, all core-radius selections and neighbourhood work are O(n²d) in d features. At most O(n²) candidate improvements add O(n² log n) worst-case heap work. This is not a universal subquadratic OPTICS claim. A stored all-pairs distance matrix would add O(n²) storage; the current route does not store one. The ordinary sklearn implementation uses its own candidate selection and documents O(n²) time rather than this heap's operation bound."}</Prose>

<Prose>{"The program's printed heap state and four-row examples were newly executed once in the stated instructional environment. Its ordinary "}<code>{"OPTICS"}</code>{" calls fit only the new rows "}<code>{"[0,1,4,5]"}</code>{". Assertions compare their input-indexed core, reachability and predecessor arrays and their ordering. Those assertions establish the named examples, not parity for every near tie, metric or implementation version. The ten-row ordering above and the original source below retain their preceding recorded evidence."}</Prose>

<H3>{"A construction cap changes what can be remembered"}</H3>

<Mechanism id="D25" />

<Prose>{"For the new observations "}<code>{"[0,1,4,5]"}</code>{" and minimum 2, every unbounded core radius is 1. With an infinite cap, reachability in input order is "}<code>{"[∞,1,3,1]"}</code>{": crossing from 1 to 4 costs 3. With cap 1, that edge is absent and the record becomes "}<code>{"[∞,1,∞,1]"}</code>{". The finite core radii did not change, yet the long connection is no longer available. A later extractor cannot recover information discarded by construction."}</Prose>

<Prose>{"The cap is a modelling/computation contract, not a silent display maximum. Use an infinite cap when the full scale ordering is needed and its cost is acceptable. If a finite cap is chosen, record it beside every subsequent cut or ξ extraction. The plot's second restart is then explained by the absent edge, not mistaken for evidence of a universal separation."}</Prose>

<H2>{"10. Extract one supported radius, and inspect the border exception"}</H2>

<Mechanism id="D26" />

<Prose>{"Place a cut at ε=1 on the saved ten-row plot. A has infinite reachability but core radius .75, so it starts a group. B, C, D and I are reached at or below 1 and join it. E has reachability 1.25, above the cut, but its core radius .75 is at or below the cut: E starts another group. F, G and H join that group. J has both a high reachability and no qualifying core radius at this cut, so it stays noise. A high reachability is therefore not sufficient to declare noise; a low enough core radius can start a cluster."}</Prose>

<Prose>{"The extraction state machine scans the recorded order once. Maintain the current group number, initially −1. At a row whose reachability is above ε, start a new group if its core radius is at or below ε; otherwise label that row noise. A row reached at or below ε gets the current group. Store that label at the row's original input position. This preserves the distinction between the order used to traverse the graph and the order expected by a downstream report."}</Prose>

<Prose>{"The original ordinary route and its complete recorded expected output remain available here. The fitted graph's cap is 2 and its cut is 1; no new fit was run to refresh this stream."}</Prose>

<RemoteCodeBlock filename="dbscan_optics.py" language="python" source="/learn-code/dbscan-density-based-clustering/original-programs/dbscan_optics.py" />

<Prose>{"Retained original expected output, preserved without a new execution:"}</Prose>

<CodeBlock kind="output" language="output" filename="dbscan_optics.recorded.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/original-programs/dbscan_optics.recorded.txt">{"[0, 1, 2, 3, 8, 4, 5, 6, 7, 9]\n[inf, 0.75, 0.5, 0.5, 1.0, 1.25, 0.75, 0.5, 0.5, inf]\n[0, 0, 0, 0, 1, 1, 1, 1, 0, -1]"}</CodeBlock>

<Prose>{"The API "}<code>{"cluster_optics_dbscan"}</code>{" receives the three already fitted arrays rather than the feature table. This is the inexpensive extraction stage. It cannot determine whether an unsupported larger radius would have added missing connections; the caller must enforce "}<code>{"eps <= max_eps"}</code>{" itself. The scratch wrapper below refuses that relation explicitly rather than clamping the cut or presenting a plausible but unsupported partition."}</Prose>

<H3>{"Why an earlier border can remain unassigned"}</H3>

<Mechanism id="D27" />

<Prose>{"Consider new rows a=0, b=2, c=3 and d=4 with minimum 3 and cut 2. a has only a and b within 2, so a is not core. b has all four rows within 2 and is core. Direct DBSCAN can visit a first, mark it noise, and later attach it as border when b expands. All four rows then have label 0."}</Prose>

<Prose>{"The supplied OPTICS graph processes "}<code>{"[a,b,c,d]"}</code>{". Its input-indexed core radii are "}<code>{"[3,2,1,2]"}</code>{", reachabilities "}<code>{"[∞,3,2,1]"}</code>{", and predecessors "}<code>{"[-1,a,b,c]"}</code>{". At a, the extraction scan sees infinite reachability and core radius 3, so it writes noise. At b, reachability 3 is too high but core radius 2 starts a group. c and d join. The one-way scan does not revisit a, leaving "}<code>{"[-1,0,0,0]"}</code>{". The figure shows the spatial b→a border eligibility beside that missing backward assignment, rather than hiding a from the plotted population."}</Prose>

<Prose>{"This is the stated border difference between direct DBSCAN and radius extraction from OPTICS. It does not refute their shared core connectivity in the supported setting, and it does refute a promise of identical complete partitions for every input order. If border assignments matter to a report, compare the eligible border rows and the declared policy explicitly. A nominal cluster-number swap is a separate issue from this row's assigned/unassigned status."}</Prose>

<RemoteCodeBlock filename="optics_radius_extraction.py" language="python" source="/learn-code/dbscan-density-based-clustering/programs/optics_radius_extraction.py" />

<Prose>{"Actual once-executed output of this exact new source:"}</Prose>

<CodeBlock kind="output" language="output" filename="optics_radius_extraction.stdout.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/programs/optics_radius_extraction.stdout.txt">{"extracted radius 2 [-1, 0, 0, 0]\ndirect DBSCAN radius 2 [0, 0, 0, 0]\nfirst row core radius 3.0 earlier reachability inf\nunsupported cut extraction radius exceeds the graph's construction cap"}</CodeBlock>

<Prose>{""}<code>{"validate_graph"}</code>{" checks the full permutation, array lengths, nonnegative distance values and predecessor positions before extraction. It permits positive infinity as a restart or unavailable core distance; NaN and negative values are refused. "}<code>{"radius_labels"}</code>{" then performs only the taught scan. Its operation count is O(n) after validation, with O(n) output storage. It does not recompute neighbours, optimize a radius, repair a graph or fit a classifier."}</Prose>

<Prose>{"The new main passes the "}<strong>{"supplied"}</strong>{" four-row graph to both extractors and calculates direct DBSCAN on those four rows only. It does not fit OPTICS or replay the retained trail study. The final printed refusal demonstrates the wrapper's cap guard; the deliberately supplied capped record is used only to exercise refusal before reading its distances. The live investigation changes just the cut after the graph has been taught, retains the graph's cap, and shows the new groups in a sentence alongside the actual bars and row labels."}</Prose>

<Prose>{"One fixed cut still asks for one common density scale. The next branch reads relative changes in the recorded heights to obtain nested intervals. It has new endpoint rules and a different output; a valley is not automatically the same object as a direct DBSCAN cluster."}</Prose>

<H2>{"11. Read relative valleys, then distinguish nesting from a flat partition"}</H2>

<Prose>{"The fixed cut compared every reachability to one absolute distance. We now ask whether the ordering drops into a region and later climbs out by a sufficiently large "}<strong>{"relative"}</strong>{" change. This is OPTICS's ξ extraction, pronounced “xi.” It inspects an already constructed graph; it does not find a new metric or make every apparent valley meaningful."}</Prose>

<Mechanism id="D28" />

<Prose>{"Begin with heights .8 and .6. The decline is .2, which is one quarter of .8. With ξ=.2, a required decline of at least one fifth is satisfied. The smaller change .8→.75 declines by only .05/.8=.0625, so it is not steep at that setting. This comparison divides by the starting height; it does not subtract a fixed distance threshold. ξ has no distance units, whereas both reachabilities do."}</Prose>

<Prose>{"Write c=1−ξ for the retained fraction. A downward transition is steep when the next height is at most c times the current height. For positive finite heights rᵢ and rᵢ₊₁, that is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"r_{i+1}\\le (1-\\xi)r_i,\n\\qquad \\frac{r_i}{r_{i+1}}\\ge\\frac1{1-\\xi}."}</MathBlock></div>

<Prose>{"A steep upward transition satisfies rᵢ≤(1−ξ)rᵢ₊₁, equivalently rᵢ/rᵢ₊₁≤1−ξ. The inclusive inequalities retain equality. These are the corrected downward and upward rules implemented in the current ordinary library. The original OPTICS printing and the later correction must not be conflated: the downward comparison and a later right-end comparison require the corrected directions."}</Prose>

<Prose>{"Infinity marks an ordering restart. Extraction also appends a final infinity as a "}<strong>{"closing boundary"}</strong>{", allowing a last valley to close. That extra value is not another observation or another stable ID. The numerical implementation treats inf/inf and 0/0 as undefined ratios, not steep transitions. Duplicate zero distances therefore need this declared arithmetic convention; inserting a convenient small positive value changes the graph and is not a harmless rendering fix."}</Prose>

<H3>{"Track a valley's beginning and the highest interruption"}</H3>

<Mechanism id="D29" />

<Prose>{"We need a different worked graph because the original trail contains two simple dense regions rather than this nested structure. Take eleven observations whose physical locations in input-ID order are "}<code>{"[0,21,33,10,50,20,11,34,32,22,12]"}</code>{". Their recorded minimum 2, Euclidean, unbounded graph has processing IDs "}<code>{"[0,3,6,10,5,1,9,8,2,7,4]"}</code>{" and ordered reachability "}<code>{"[∞,10,1,1,8,1,1,10,1,1,16]"}</code>{". Draw the physical ruler first and link each ID to its bar. Positions in the bar sequence differ from input IDs: plot position 3 is input ID10, whose physical location is12."}</Prose>

<Prose>{"At ξ=.2, steep drops occur at plot positions 0,1,4 and 7; steep rises occur at3,6,9 and 10. Position 0 means the edge from the infinite first bar to the next height 10. Position 10 means the final height 16 rising to the appended infinite boundary. The density minimum is2, so an extending steep region may cross at most two consecutive non-steep steps while the direction does not oppose it."}</Prose>

<Prose>{"Follow the first downward region. Edges 0 and 1 are steep. Edge 2 is flat, so it consumes one allowed non-steep step. Edge 3 rises and stops the downward extension. The last steep edge is1, giving down region "}<code>{"[0,1]"}</code>{"; the cursor looked farther, but that does not make the returned region end 2 or3. The distinction between the cursor and last steep endpoint matters throughout the algorithm."}</Prose>

<Prose>{"The algorithm keeps a list of still usable "}<strong>{"down regions"}</strong>{", each with its start, last steep end and highest reachability encountered since it opened. That highest intervening value is the "}<strong>{"maximum in between"}</strong>{". It prevents us from joining a distant later rise to an old valley whose intervening heights have already climbed too high. Keep the actual highlighted bars above the active-region list so that the maximum is visibly a distance read from those bars, not an unexplained score."}</Prose>

<Prose>{"The first upward region ends at3 and closes against height 8 at position 4. The initial candidate interval is "}<code>{"[0,3]"}</code>{". A candidate is an inclusive range of observation positions; it is not yet an accepted cluster. We will adjust its ends, test the predecessor and count its rows next. Its first boundary starts above the matched closing height, which motivates the left-end adjustment."}</Prose>

<Prose>{"To retain an active down region beginning s, the intervening maximum M must not exceed (1−ξ)rₛ. A candidate ending at e also requires M≤(1−ξ)rₑ₊₁. These are ceiling tests on actual reachability lengths, using the relative fraction c. Rejection is strict when M exceeds the ceiling; equality passes. An infinite interruption removes active areas so that a restart cannot silently connect unrelated ordering components."}</Prose>

<H3>{"Adjust the heights, then count the included observations"}</H3>

<Mechanism id="D30" />

<Prose>{"For "}<code>{"[0,3]"}</code>{", the closing height is r₄=8. The start's next height r₁=10 is still above 8, so move the start from 0 to 1. The next height r₂=1 is not above 8, so stop. The adjusted candidate "}<code>{"[1,3]"}</code>{" contains three observations, with physical locations 10,11 and 12. Their actual predecessors remain within that candidate. It meets minimum cluster size 3 and is accepted."}</Prose>

<Prose>{"There are three height-adjustment cases, each shown with its own actual operands. If the left boundary is high enough relative to the closing height, move the left endpoint across initial bars whose next height remains higher than the closing height, stopping within the down region. If the closing boundary is high enough relative to the left boundary, trim the right endpoint while its "}<strong>{"preceding"}</strong>{" bar remains higher than the original down-start height, stopping within the up region. Otherwise neither side needs this height adjustment. These rules compare the two boundary heights; they do not say every retained observation's bar must lie below both boundaries."}</Prose>

<Prose>{"The main graph does not show right trimming, so inspect a second recorded line: positions "}<code>{"[0,10,11,12,20,21,22,31,43,61,91]"}</code>{", in identity processing order. Its reachabilities are "}<code>{"[∞,10,1,1,8,1,1,9,12,18,30]"}</code>{", with predecessor IDs "}<code>{"[-1,0,1,2,3,4,5,6,7,8,9]"}</code>{". The downward area starting 4 has height 8 and closes with the upward region 6–10. Start from candidate "}<code>{"[4,10]"}</code>{"."}</Prose>

<Prose>{"Look one bar "}<strong>{"before"}</strong>{" the current endpoint: r₉=18>8 trims endpoint 10 to9; r₈=12>8 trims 9 to8; r₇=9>8 trims 8 to7. Now r₆=1 is not above 8, so stop. The endpoint at7 itself has height 9>8. Keeping it is consistent with the rule, because the loop compares the preceding height, and its predecessor 6 lies within "}<code>{"[4,7]"}</code>{". The accepted intervals for this example are "}<code>{"[1,3]"}</code>{", "}<code>{"[4,7]"}</code>{" and "}<code>{"[0,10]"}</code>{". If a drawing merely erases every bar above 8, it teaches a different operation."}</Prose>

<Prose>{"After endpoint correction, count e−s+1 rows. Changing the main graph's minimum cluster size from 3 to 4 rejects "}<code>{"[1,3]"}</code>{" and "}<code>{"[4,6]"}</code>{": each has only three rows. Its accepted hierarchy becomes "}<code>{"[0,6]"}</code>{", "}<code>{"[7,10]"}</code>{", "}<code>{"[0,10]"}</code>{". Core radii, reachabilities, predecessors and processing order do not change, because this edit changes extraction size only. It does not change the minimum 2 used to construct the graph. A library call that changes "}<code>{"min_samples"}</code>{" during a new fit normally changes that graph as well as the non-steep extension budget; these are different operations."}</Prose>

<H3>{"Check whether the last point was actually reached from this valley"}</H3>

<Mechanism id="D31" />

<Prose>{"Height comparisons alone can retain an endpoint that was reached from another region. To see that mechanism, use the recorded two-dimensional observations A(−1,0), B(0,0), C(9,0), D(9,1), E(10,0), F(10,1), G(11,0), H(11,1) and I(0,9.5). The processing order is A through I. All core radii are 1 except I's9.5. Reachabilities are "}<code>{"[∞,1,9,1,1,1,1,1,9.5]"}</code>{", and predecessor IDs "}<code>{"[-1,0,1,2,2,3,4,5,1]"}</code>{"."}</Prose>

<Prose>{"Draw B→I on the actual spatial coordinates. B at(0,0) supplies I's key 9.5 before the later C–H region is processed; no point in that later region improves it. At ξ=.2 and extraction minimum size 3, the apparent valley candidate is positions "}<code>{"[2,8]"}</code>{", C through I. Its starting height 9 is not greater than the endpoint height 9.5. I's predecessor is B, input ID1, whose processing position is1, outside the candidate. Trim I, moving end 8 to7. Now the starting height 9 exceeds the endpoint height 1, allowing the corrected interval "}<code>{"[2,7]"}</code>{"."}</Prose>

<Prose>{"The corrected intervals are "}<code>{"[2,7]"}</code>{" and "}<code>{"[0,8]"}</code>{", and flat labels are "}<code>{"[-1,-1,0,0,0,0,0,0,-1]"}</code>{". Disabling predecessor correction would instead retain "}<code>{"[2,8]"}</code>{", assigning I to the later group. The crossing arrow explains why that association is misleading. This is not a general rule that every high endpoint has an outside predecessor. In the main eleven-row graph, the final point at physical 50 has high reachability 16 but predecessor input ID7 at plot position 9 "}<strong>{"inside"}</strong>{" candidate "}<code>{"[7,10]"}</code>{", so it remains."}</Prose>

<Prose>{"The corrected endpoint procedure repeatedly tests the current end. It can retain the interval if its starting height is greater than the endpoint height, or if the endpoint's predecessor lies within the candidate before the endpoint. Otherwise it decrements the end and tries again. If start and end meet, no multirow candidate remains. The scratch implementation builds an inverse permutation once, translating predecessor "}<strong>{"input position"}</strong>{" to "}<strong>{"plot position"}</strong>{" in O(1). That preserves the library's membership test while avoiding a scan through every candidate row merely to locate one predecessor. A missing predecessor −1 belongs to no interval."}</Prose>

<H3>{"Finish the entire main scan before flattening it"}</H3>

<Prose>{"Return to the main eleven-row graph. After accepting "}<code>{"[1,3]"}</code>{", the algorithm reaches the downward area "}<code>{"[4,4]"}</code>{", height 8. At the subsequent up area "}<code>{"[6,6]"}</code>{", the older down area's maximum in between is8. Its ceiling is10×.8=8, so equality keeps candidate "}<code>{"[0,6]"}</code>{". The newer down area's maximum is1, and it yields "}<code>{"[4,6]"}</code>{". Add the smaller candidate before its enclosing candidate: the accumulated intervals are "}<code>{"[1,3]"}</code>{", "}<code>{"[4,6]"}</code>{", "}<code>{"[0,6]"}</code>{"."}</Prose>

<Prose>{"The next down area begins 7 at height 10. That interruption discards the down area starting 4 because 10>8×.8. The initial infinite-start region remains usable. Up area "}<code>{"[9,10]"}</code>{" closes against the sentinel, yielding "}<code>{"[7,10]"}</code>{" and "}<code>{"[0,10]"}</code>{". The final ordered list is therefore "}<code>{"[1,3]"}</code>{", "}<code>{"[4,6]"}</code>{", "}<code>{"[0,6]"}</code>{", "}<code>{"[7,10]"}</code>{", "}<code>{"[0,10]"}</code>{". Each interval names an inclusive range in this one processing order. It is a hierarchy of nested memberships, not five disjoint labels."}</Prose>

<Mechanism id="D32" />

<Prose>{"To create one nonoverlapping flat partition, inspect the accepted intervals in their child-before-parent order. "}<code>{"[1,3]"}</code>{" claims its three previously unassigned rows. "}<code>{"[4,6]"}</code>{" claims another three. Skip "}<code>{"[0,6]"}</code>{" because part of that span is already assigned. "}<code>{"[7,10]"}</code>{" claims four rows. Skip "}<code>{"[0,10]"}</code>{" for the same overlap reason. Plot-position labels become "}<code>{"[-1,0,0,0,1,1,1,2,2,2,2]"}</code>{". Mapping them back to input-ID order gives "}<code>{"[-1,1,2,0,2,1,0,2,2,1,0]"}</code>{"."}</Prose>

<Prose>{"The first observation is unassigned in this flat representation even though it belongs to a larger hierarchy interval. Do not conclude that the hierarchy omitted it. Conversely, a nested interval list is not interchangeable with the API's "}<code>{"labels_"}</code>{"; a report must say which output it evaluates."}</Prose>

<Prose>{"After this full mechanism is taught, the local investigation changes only ξ on the fixed graph. At ξ=.8, the steep positions in this example remain the same, but the older candidate's ceiling becomes 10×.2=2, below maximum 8. "}<code>{"[0,6]"}</code>{" disappears; the smaller intervals and flat labels remain unchanged. This is a meaningful null change in the flat output. At ξ=.95, only the initial infinite drop and final sentinel rise remain steep, giving interval "}<code>{"[0,10]"}</code>{" and all flat labels 0. Increasing ξ does not universally produce fewer flat groups or improve domain meaning; this example exposes the particular changed conditions."}</Prose>

<H3>{"A non-steep run is not a returned endpoint"}</H3>

<Prose>{"One last small operation deserves its own trace. At ξ=.2, inspect the "}<strong>{"supplied"}</strong>{" height strip "}<code>{"[20,10,9,8,3]"}</code>{" with budget 2. The first transition is steep. The next two are non-steep declines, consuming the budget. The final 8→3 transition is steep, resets the run count and moves the last steep endpoint to 3. On "}<code>{"[20,10,9,8,7,3]"}</code>{", the third consecutive non-steep edge exceeds the budget before the later steep drop, so the returned endpoint remains 0. On "}<code>{"[20,10,9,11,3]"}</code>{", the opposing rise 9→11 stops the down extension, again returning 0. These strips isolate a subroutine; they are not asserted to be fitted Euclidean OPTICS graphs."}</Prose>

<Prose>{"Step/Back/Reset follows the extension cursor and run count beside each ratio. A separate single-step candidate trace shows the active regions and endpoint tests in the main graph. The ξ investigation and those operation traces need no mode wall or editable predecessor matrix. Their values and identities remain the same objects used by the code below."}</Prose>

<RemoteCodeBlock filename="optics_xi_extraction.py" language="python" source="/learn-code/dbscan-density-based-clustering/programs/optics_xi_extraction.py" />

<Prose>{"Actual once-executed output of this exact new source:"}</Prose>

<CodeBlock kind="output" language="output" filename="optics_xi_extraction.stdout.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/programs/optics_xi_extraction.stdout.txt">{"main xi 0.2 size 3 intervals [(1, 3), (4, 6), (0, 6), (7, 10), (0, 10)] input labels [-1, 1, 2, 0, 2, 1, 0, 2, 2, 1, 0]\nmain xi 0.8 size 3 intervals [(1, 3), (4, 6), (7, 10), (0, 10)] input labels [-1, 1, 2, 0, 2, 1, 0, 2, 2, 1, 0]\nmain xi 0.95 size 3 intervals [(0, 10)] input labels [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]\nmain size4 xi 0.2 size 4 intervals [(0, 6), (7, 10), (0, 10)] input labels [0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0]\nM2 xi 0.8 size 4 intervals [(7, 10), (0, 10)] input labels [-1, -1, 0, -1, 0, -1, -1, 0, 0, -1, -1]\noutside xi 0.2 size 3 intervals [(2, 7), (0, 8)] input labels [-1, -1, 0, 0, 0, 0, 0, 0, -1]\nM1 xi 0.2 size 7 intervals [(0, 8)] input labels [0, 0, 0, 0, 0, 0, 0, 0, 0]\nright trim xi 0.2 size 3 intervals [(1, 3), (4, 7), (0, 10)] input labels [-1, 0, 0, 0, 1, 1, 1, 1, -1, -1, -1]\nsupplied strip [20, 10, 9, 8, 3] last steep endpoint 3\nsupplied strip [20, 10, 9, 8, 7, 3] last steep endpoint 0\nsupplied strip [20, 10, 9, 11, 3] last steep endpoint 0"}</CodeBlock>

<Prose>{""}<code>{"xi_extract"}</code>{" validates the graph, the dimensionless ξ and explicit integer minima. The ordinary API also accepts fraction-of-n size parameters; this route deliberately uses counts, with 2≤minimum≤n and 2≤minimum_size≤n. For a fraction f in the supported ordinary API, the effective count is at least 2 and otherwise "}<code>{"int(f*n)"}</code>{"; name that conversion before comparing runs. "}<code>{"minimum_size=None"}</code>{" adopts the density minimum. The predecessor correction flag defaults to true and should be retained when making the corrected comparison."}</Prose>

<Prose>{""}<code>{"extend_region"}</code>{" carries the cursor, last steep endpoint and consecutive run count separately. "}<code>{"filter_areas"}</code>{" retains only down regions under their current ceiling and updates their maximum. The scan visits steep positions in order, skipping positions already incorporated in an extended region. A rise tests every retained down region, adjusts endpoints, corrects its predecessor, checks inclusive size and boundary overlap, and adds accepted candidates in the required smaller-first order. The last loop flattens only spans whose rows are all unassigned, then applies the inverse correspondence to return input-indexed labels."}</Prose>

<Prose>{"The code is an attributed teaching derivation of the current scikit-learn ξ helpers, including the corrected inequalities and predecessor algorithm. Its full BSD notice travels with the file. The original OPTICS algorithm and the 2018 correction explain the method; the library source fixes the deliberately supported implementation semantics. This is substantive scratch extraction, not a wrapper that delegates its answer to "}<code>{"cluster_optics_xi"}</code>{" or looks up a preset label vector. The ordinary call in "}<code>{"main"}</code>{" is a comparison route after the scratch result has been computed."}</Prose>

<Prose>{"The printed stream comes from one execution of this complete program on the fixed supplied arrays and isolated strips. It performs no graph fit. The eight comparisons cover the main ξ changes, changed minimum size, M1/M2 transfer inputs, outside-predecessor trim and right-end adjustment. They establish those stated results in sklearn 1.9.1, not every possible graph. The optional event record makes candidate rejection and endpoint tests inspectable; full traces are bounded to tiny inputs and do not inherit a production memory guarantee."}</Prose>

<Prose>{"Cost follows the actual loops. Let c be the number of down/up candidate pairs tested and l the number of accepted intervals. Inverse lookup avoids scanning a whole interval for one predecessor, but successive endpoint removals can still take O(n) per candidate. Endpoint work is thus bounded by O(cn); flat-span inspection and assignment by O(ln). Active-region filtering also pays for the actual retained list at each steep area. With at most O(n) areas and O(n²) pairings, a conservative general bound for these loops is O(n³), rather than an unsupported linear-time extraction promise. Stored graph arrays are O(n), accepted interval output can add O(l), and retained event snapshots add their own output size. Better typical behavior is not a proved universal bound."}</Prose>

<Prose>{"Relative valley extraction still starts from directional reachability proposals and depends on the graph's geometry and construction cap. The next branch makes a symmetric edge from both observations' local density requirements, then preserves every edge threshold with a small tree. That change motivates a different hierarchy; it does not make ξ intervals wrong or turn one family into an automatic answer for every dataset."}</Prose>

<H2>{"12. Price a connecting edge using both local density requirements"}</H2>

<Prose>{"Directional OPTICS proposals remember one source's density requirement. An undirected hierarchy needs one symmetric edge value. We obtain it by asking whether both endpoints qualify at the scale where their connection becomes available."}</Prose>

<Mechanism id="D33" />

<Prose>{"Return to A and B on the trail. The raw distance is .25; their self-inclusive fourth-neighbour radii are .75 and .5. The connecting edge receives weight .75, the largest of those three lengths. D and I have raw distance 1, cores .75 and 1.25, so their edge receives weight 1.25. The same result holds in either direction. Draw both endpoint disks and the actual connecting ruler before combining their lengths."}</Prose>

<Prose>{"This "}<strong>{"mutual-reachability distance"}</strong>{" is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"d_{\\rm mr}(p,q)=\\max\\{c(p),c(q),d(p,q)\\}."}</MathBlock></div>

<Prose>{"The density minimum m still counts the observation itself. Some APIs use a count of other neighbours instead. Under the supported comparison convention, a self-inclusive m corresponds to m−1 other neighbours; copying the same integer into both APIs can change every core radius and the whole hierarchy. In particular, the contrib HDBSCAN convention differs from sklearn's self-inclusive "}<code>{"min_samples"}</code>{" convention. Name the convention before comparing labels or timing."}</Prose>

<Mechanism id="D34" />

<Prose>{"At radius 1, raw single-linkage can connect D to I and I to E. Mutual reachability requires 1.25 on those edges because I is sparse at minimum 4. The drawing keeps I present and shows why the edge is raised. It does not pretend the observation has disappeared or guarantee that every unwanted chain will be removed. A chain whose observations all have suitably small core radii can still connect."}</Prose>

<Prose>{"The threshold condition "}<code>{"d_mr(p,q) <= ε"}</code>{" is exactly the conjunction "}<code>{"c(p) <= ε"}</code>{", "}<code>{"c(q) <= ε"}</code>{" and "}<code>{"d(p,q) <= ε"}</code>{". Its components among eligible core observations give the core-only DBSCAN* connectivity at that scale. An observation whose own core radius is above the cut is excluded from that core-only partition; an isolated vertex in the full weighted graph is not automatically an accepted singleton density cluster. This differs from ordinary DBSCAN, which can attach eligible border observations without allowing them to expand. At cut 1, I is the earlier shared border but is not core; the core-only hierarchy does not choose a side for it there."}</Prose>

<Prose>{"The local point-position investigation changes one already identified observation and recomputes the two ranked-neighbour radii and raw edge. Its sentence names which operand now controls the maximum. The drawing does not merely animate an arrow or use a hidden new metric. The default trail quantities remain the preserved worked values; a changed tiny geometry is a separate calculation."}</Prose>

<Prose>{"Varying the cut gives a sequence of core connections across scales. This is the finite connectivity mechanism behind the hierarchy we will build. The HDBSCAN family then condenses small branches and chooses persistent groups; it does not remove the need for suitable features, distances or a domain question. A density level-set intuition is helpful, but the finite tree calculations here are not a proof of a population density-consistency theorem."}</Prose>

<H2>{"13. Preserve all edge thresholds with a small tree"}</H2>

<Prose>{"The complete mutual-reachability graph has an edge for every observation pair. Keeping all of those edges is unnecessary if the question is which observations are connected at each cut. We need a tree that preserves that connectivity, then an efficient way to construct it."}</Prose>

<Mechanism id="D35" />

<Prose>{"Use the new four points v0=0, v1=1, v2=4, v3=5 with self-inclusive minimum 2. Their core radii are all 1. The connecting pair edges v0–v1 and v2–v3 each weigh 1, and v1–v2 weighs 3. A spanning tree retaining those three edges has total 5. At cut 1 it gives the two pairs; at cut 3 it gives all four together. Show the complete graph beside the tree with the same points, hues and distance ruler. The omitted edges are still real distances; they are redundant for this threshold-connectivity question."}</Prose>

<Prose>{"A "}<strong>{"spanning tree"}</strong>{" connects every vertex without cycles, using n−1 edges for n nonempty vertices. A "}<strong>{"minimum spanning tree"}</strong>{", or MST, minimizes their total weight. It also preserves every threshold component of the original weighted graph, including tied thresholds. This latter property, rather than the total alone, is why the tree is useful here."}</Prose>

<Mechanism id="D36" />

<Prose>{"Consider an omitted graph edge e of weight w connecting u and v. Follow the unique u→v path in an MST and locate its largest edge weight b. If b>w, inserting e and removing that larger path edge keeps a spanning tree with strictly smaller total weight, contradicting minimality. Therefore b≤w. If the full graph connects u and v using edges at or below a cut ε, each such edge can be replaced by its MST path whose edges are no larger; the tree also connects them at that cut. Conversely, every tree edge is a full-graph edge, so it cannot create a connection unavailable in the graph. The component partitions are equal at every cut."}</Prose>

<Prose>{"Equality b=w permits alternative MSTs. The proof still works because it needs “no larger,” not a unique tree. A tied square can have different minimum trees while preserving threshold components. Later DBCV examines which vertices are internal in a chosen tree, a different quantity that need not be invariant. Do not reuse this connectivity proof as a blanket claim that all downstream MST-dependent scores are identical."}</Prose>

<H3>{"Maintain the best connection instead of rescanning the whole boundary"}</H3>

<Mechanism id="D37" />

<Prose>{"Start Prim's algorithm with v0 admitted. Each other vertex has one best known edge from the admitted set: v1 gets 1 from v0, v2 gets 4 from v0, v3 gets 5 from v0. Admit v1 next because its key 1 is the smallest. Its edge to v2 has weight 3, improving v2's key 4→3 and parent v0→v1. Its edge to v3 has weight 4, improving 5→4. Admit v2 next at3, then improve v3 to 1 through v2. The three admitted parent edges are exactly the tree above."}</Prose>

<Prose>{"The "}<strong>{"key invariant"}</strong>{" is that every unadmitted vertex remembers the smallest edge to any admitted vertex. When one new vertex is admitted, only its candidate edges can improve those minima. Update each remaining vertex once; do not enumerate all admitted/unadmitted crossing pairs again to rediscover values already known. The minimum current key is safe by the MST cut argument: it is a lightest edge across the admitted/unadmitted cut. This maintained frontier is the same operation taught in "}<a href={"/learn/topic/k-means-hierarchical-clustering#11-build-hierarchies-with-efficient-operations"}>{"KMeans's efficient hierarchy section"}</a>{", now with the mutual-reachability oracle."}</Prose>

<Prose>{"The scratch implementation stores admitted flags, best keys and parent positions. Its deterministic tie policy uses input position for choosing an equal-key vertex and the smaller input position for an equal-cost parent. Stable display IDs remain mapped to those positions; nominal group identity never depends on the incidental parent array's representative. The optional Step investigation shows each actual admission or improvement using the same state. It offers Step/Back/Reset after the invariant has been taught."}</Prose>

<RemoteCodeBlock filename="mutual_reachability_tree.py" language="python" source="/learn-code/dbscan-density-based-clustering/programs/mutual_reachability_tree.py" />

<Prose>{"Actual once-executed output of this exact new source:"}</Prose>

<CodeBlock kind="output" language="output" filename="mutual_reachability_tree.stdout.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/programs/mutual_reachability_tree.stdout.txt">{"self-inclusive cores [1.0, 1.0, 1.0, 1.0]\nmaintained Prim edges [('v0', 'v1', 1.0), ('v1', 'v2', 3.0), ('v2', 'v3', 1.0)]\ncut 1.0 components [['v0', 'v1'], ['v2', 'v3']]\ncut 3.0 components [['v0', 'v1', 'v2', 'v3']]\none-vertex tree []"}</CodeBlock>

<Prose>{""}<code>{"prim_tree"}</code>{" receives an edge oracle rather than a complete adjacency matrix. "}<code>{"mutual_reachability_tree"}</code>{" supplies the three-way maximum from the shared provider and its self-inclusive cores. Invalid nonfinite or negative edges are refused. The single-vertex tree has no edges. A minimum larger than the row count would create unavailable infinite cores and is refused by the finite hierarchy route. Zero lengths can exist in the graph for duplicates; the later positive-distance condensation contract gives those a separate diagnostic rather than dividing by zero."}</Prose>

<Prose>{"With the brute geometric oracle in d features, the maintained algorithm makes O(n²) candidate evaluations, each costing O(d), plus O(n²) minimum selection with these simple arrays. Computing all ranked core radii also costs O(n²d) using the shared selection route. Auxiliary arrays and the n−1 output edges use O(n) space, excluding input rows and an optional full teaching trace. The ordinary comparison in "}<code>{"main"}</code>{" explicitly materializes a "}<strong>{"four-by-four"}</strong>{" matrix and calls SciPy's "}<code>{"minimum_spanning_tree"}</code>{"; that convenience has O(n²) matrix storage when generalized. Its numerical comparison here uses positive off-diagonal lengths, because zero entries in the graph API have their own absent-edge meaning. It is not the implementation chosen for a large duplicate-containing matrix."}</Prose>

<Prose>{"The new printed stream verifies the four-row cores, tree total and components at cuts 1 and 3, plus the one-vertex endpoint. It does not replay the retained trail MST calculation. The following original route preserves that earlier ordinary matrix-based calculation and its original expected output, providing a compact comparison with the on-demand implementation:"}</Prose>

<RemoteCodeBlock filename="dbscan_mst.py" language="python" source="/learn-code/dbscan-density-based-clustering/original-programs/dbscan_mst.py" />

<Prose>{"Retained original expected output, preserved without a new execution:"}</Prose>

<CodeBlock kind="output" language="output" filename="dbscan_mst.recorded.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/original-programs/dbscan_mst.recorded.txt">{"[0.75, 0.5, 0.5, 0.75, 0.75, 0.5, 0.5, 0.75, 1.25, 2.75]\n9\n0.75 1.25"}</CodeBlock>

<Prose>{"Read its all-pairs matrix as a deliberate small transparent route, not evidence of linear memory. Both routes construct the same kind of weighted connectivity object; their storage choices differ. Neither establishes a benchmark or a universal fastest method."}</Prose>

<H3>{"Turn equal-weight edge events into component merges"}</H3>

<Mechanism id="D38" />

<Prose>{"At cut 1, the two edges of weight 1 enter together, creating "}<code>{"{v0,v1}"}</code>{" and "}<code>{"{v2,v3}"}</code>{". At cut 3, their connecting edge makes one component. A tree serialization may process tied edges in either order, but mathematical threshold connectivity changes only when the whole equal-weight event has been processed. Record a simultaneous merge when several old components join at one weight; do not manufacture a positive-lived branch merely from an arbitrary order inside the tie."}</Prose>

<Prose>{"For this operation reuse the "}<a href={"/learn/topic/disjoint-sets-union-find#3-implement-the-contract-and-prove-it"}>{"disjoint-set contract"}</a>{" and "}<a href={"/learn/topic/disjoint-sets-union-find#4-make-long-paths-unnecessary"}>{"size-weighting/path compression"}</a>{". The exact reusable class follows. It acts on integer positions 0 through n−1; stable point IDs and later branch IDs belong to separate maps."}</Prose>

<RemoteCodeBlock filename="disjoint_set.py" language="python" source="/learn-code/dbscan-density-based-clustering/programs/disjoint_set.py" />

<Prose>{""}<code>{"union"}</code>{" merges components only when their representatives differ; repeated links leave the component count unchanged. Root choice is an implementation detail, not a cluster's permanent identity. Size weighting and two-pass path compression preserve the component contract with near-constant amortized operations. The helper's standalone source has no demonstration main; it is exercised through the new tree and subsequent hierarchy routes."}</Prose>

<Prose>{"Sorting the n−1 tree edges costs O(n log n). Union-find reconciles them without storing all full-graph edges. A full list of every component's members at every cut can itself have quadratic output size, so the hierarchy should store child links and cached counts instead of copying all leaf sets at each event. The next section builds exactly that structural hierarchy, then asks which splits are large enough to create new persistent group identities."}</Prose>

<H2>{"14. Keep a shrinking group's identity, and name a genuine split"}</H2>

<Prose>{"The spanning tree tells us which components appear as distance decreases. A tiny fragment breaking away need not create a useful new group. "}<strong>{"Condensation"}</strong>{" keeps track of sufficiently large branches while recording where individual observations depart. It requires a minimum cluster size distinct from the neighbourhood minimum used to compute core radii."}</Prose>

<Mechanism id="D39" />

<Prose>{"Use a supplied tree on A–G with edges A–B=1/8, B–C=1, C–D=1/8, D–E=1/3, E–F=1/6 and F–G=1/6. These positive dimensionless weights isolate the new tree operations. They are not claimed to be the fitted mutual-reachability tree of the earlier trail. Draw all seven observations and weighted links before changing the threshold."}</Prose>

<Prose>{"It is convenient to reverse the distance scale: λ=1/d increases as the allowed distance becomes smaller. An event at λ removes all edges of length 1/λ together. The event drawing shows the components just "}<strong>{"below"}</strong>{" that distance, or just "}<strong>{"above"}</strong>{" that λ; at the closed cut exactly equal to an edge length, the edge still belongs to the graph. This boundary convention makes the split pictures consistent with the earlier closed-neighbour rule. Finite point-event choices do not change an area integral, but they do change a literal component query at equality."}</Prose>

<Prose>{"At λ=1, removing B–C separates AB, size 2, from CDEFG, size 5. With minimum cluster size 3, AB is too small and its two observations depart. CDEFG keeps the existing branch identity and its original birth level. At λ=3, CD, size 2, separates from EFG, size 3. CD departs; EFG again continues the "}<strong>{"same"}</strong>{" branch. At λ=6, both E–F and F–G disappear together, leaving three singleton fragments; E, F and G depart. The branch's width is7 from 0 to 1,5 from 1 to 3 and 3 from 3 to6. Narrowing does not itself create a new branch."}</Prose>

<Prose>{"The initial branch is the root, with a synthetic birth level 0. In this lesson's declared selection contract, the root is excluded. The minimum 3 tree therefore has no eligible nonroot branch; later selection leaves all seven observations unassigned. The drawing must keep that valid outcome visible rather than silently select the root just because it survives for a long interval."}</Prose>

<Prose>{"After the default has been explained, the local minimum-size investigation can change 3→2 on the "}<strong>{"same"}</strong>{" tree. AB and CDEFG then both qualify at λ=1, so both receive new identities. Later CD and EFG both qualify at λ=3. The event sentence states which split now makes children; the birth/width records update immediately. We will calculate their persistence and selection next. This edit changes condensation size, not the earlier self-inclusive core-radius count."}</Prose>

<Mechanism id="D40" />

<Prose>{"We need another supplied tree to see a true split at minimum 3. Use A–B=B–C=1/2, C–D=1, D–E=1/3 and E–F=F–G=1/6. At λ=1, ABC, size 3, and DEFG, size 4, both survive. Each obtains a new branch identity with birth 1. ABC's observations depart at2. DEFG loses D at3, but its surviving EFG observations retain the "}<strong>{"DEFG branch"}</strong>{" and birth 1 until departure 6. A label “EFG branch born 3” here would reset the wrong object and later undercount its persistence."}</Prose>

<Prose>{"Condensation follows three cases at each event: two or more qualifying children create new branches; exactly one qualifying child continues the parent's identity while small children depart; no qualifying child means all remaining observations depart. Equal-weight tree children are processed as one event. This avoids artificial intermediate branches caused by serializing ties into binary links."}</Prose>

<Mechanism id="D41" />

<Prose>{"The condensed record distinguishes a branch→branch edge, with a birth level and child count, from a branch→point edge, with the point's departure level. A branch's width means the number of observations still present there. It does not mean uncertainty, model confidence or the number of leaves copied into the drawing. Keep the same row identities in the supplied tree, condensed tree and departure list."}</Prose>

<Prose>{"Zero merge distance would give infinite λ. Expressions such as infinity minus infinity do not define a finite persistence area. The scratch core therefore declares an unsupported nonpositive/nonfinite merge-length status, and also refuses reciprocal or area overflow. Handling duplicate zero-length merges in a full library requires its explicitly defined tie/degenerate policy; replacing zero with an arbitrary epsilon changes the calculation. We still teach duplicate observations and ordinary APIs later, without pretending the restricted finite core already solves that branch."}</Prose>

<H2>{"15. Compare each branch's persistence with its descendants"}</H2>

<Prose>{"The condensed tree has several possible groups, including overlapping ancestors and descendants. Choosing all of them is not a partition. We need a criterion that gives each eligible branch a value, then chooses a nonoverlapping set."}</Prose>

<Mechanism id="D42" />

<Prose>{"For the first minimum 3 tree, the root's live-count area is "}<code>{"7×1 + 5×2 + 3×3 = 26"}</code>{". Equivalently, sum each row's departure level: AB each leave 1, CD each leave 3, and EFG each leave 6, giving "}<code>{"2×1 + 2×3 + 3×6 = 26"}</code>{". Show the rectangles beside the seven strips; they are two sums for the same actual area. Root exclusion still applies, so this value is not a selected group's score."}</Prose>

<Prose>{"For an eligible branch C born at λ_birth, each member contributes its time in that branch, λ_exit−λ_birth. The "}<strong>{"stability"}</strong>{" is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"S(C)=\\sum_{p\\in C}(\\lambda_{\\rm exit}(p,C)-\\lambda_{\\rm birth}(C))\n     =\\int_{\\lambda_{\\rm birth}}^{\\text{branch end}} |C_\\lambda|\\,d\\lambda."}</MathBlock></div>

<Prose>{"The integral is just the area under the live-count steps in this finite example. It is not an accuracy, a posterior probability or a density-estimation confidence interval. If input lengths have units, λ has reciprocal units and the area inherits those units; rescaling distance rescales stability. Keep that convention when comparing fits."}</Prose>

<Prose>{"At minimum 2 on the first tree, AB is born 1 and exits 8, stability "}<code>{"2(8−1)=14"}</code>{". CDEFG is born 1 and splits 3, stability "}<code>{"5(3−1)=10"}</code>{". Its CD child is born 3 and exits 8, stability 10; EFG is born 3 and exits 6, stability 9. Their combined 19 exceeds the parent's10. The legal selected set is AB, CD and EFG, total 33. The ancestor CDEFG and either of its children cannot both be selected."}</Prose>

<Prose>{"For the separate true-split minimum 3 tree, ABC contributes "}<code>{"3(2−1)=3"}</code>{". DEFG contributes "}<code>{"1(3−1)+3(6−1)=17"}</code>{"; the smaller EFG survivor did not reset its birth. With no qualifying descendant split, select both branches, total 20. Point D's early departure is still part of that branch's history and value."}</Prose>

<Mechanism id="D43" />

<Prose>{"To make the parent-versus-children choice vary, use a third supplied tree on A–I: A–B=B–C=1/2, C–D=1, F–G=1/3, and D–E=E–F=G–H=H–I=1/x. At minimum 3, the root splits into ABC and DEFGHI at λ=1. ABC exits 2 and contributes 3. DEFGHI splits at3 into DEF and GHI, each size 3. The parent's area is "}<code>{"6(3−1)=12"}</code>{"; each child's is "}<code>{"3(x−3)"}</code>{"."}</Prose>

<Prose>{"At x=4, the children total 6, so choose the parent DEFGHI with ABC, total 15. At x=5, the children total 12, an exact tie; the declared policy keeps the parent, again total 15. At x=6, the children total 18, so choose ABC, DEF and GHI, total 21. The live “child departure level” control changes only x over[4,6], after the level's meaning is taught. It changes the four 1/x edges and child departures; the parent birth 1, split 3, area 12 and ABC remain fixed. The sentence compares actual areas and names the selected row sets, including the tie state."}</Prose>

<Mechanism id="D44" />

<Prose>{"Let B(C) be the best total achievable within an eligible branch's subtree. Compute children first, then compare the branch's own stability with their combined best totals:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"B(C)=\\max\\left\\{S(C),\\sum_{D\\text{ child of }C}B(D)\\right\\}."}</MathBlock></div>

<Prose>{"This is "}<strong>{"excess-of-mass"}</strong>{", or EOM, selection in the declared finite contract. If choosing C, skip all its descendants; if choosing the child total, reconstruct their choices. That establishes nonoverlap directly. A leaf has no child candidates, so its own stability wins. The root is the separate excluded case: reconstruct from its children even if its own area is larger. Exact equality uses the parent here. Different library options and numerical tolerances need to be declared before claiming matching selections."}</Prose>

<Prose>{"Why does the recurrence work? Every legal nonoverlapping selection inside C either contains C, forbidding its descendants, or excludes C and can combine legal choices from its disjoint child subtrees. These exhaust the choices. Selecting each subtree's best solution and comparing the two cases therefore gives a best legal total. The proof is about this finite objective; it does not prove that the highest total is the true semantic clustering."}</Prose>

<Prose>{""}<strong>{"Leaf selection"}</strong>{" is a distinct alternative: take eligible condensed branches with no child branches. It can retain smaller groups where EOM prefers a parent. It is available in the scratch function and ordinary APIs, but is taught as a different selection rule, not another unintroduced lab mode. A hierarchy, a condensed tree, a stability value and the selected labels are four related outputs, not interchangeable objects."}</Prose>

<Prose>{"These branch selections give a flat partition. Next inspect how strongly individual observations remain attached to its chosen branches; that additional calculation completes the implementation."}</Prose>

<H2>{"16. Interpret attachment strength and outlierness separately"}</H2>

<Prose>{"Choosing a branch answers which group is retained. An observation can still leave that group earlier than other members. We can summarize that attachment, but must explain the denominator before using a “probability” field."}</Prose>

<Mechanism id="D45" />

<Prose>{"In the true-split tree, DEFG is born 1. D leaves at3; E, F and G leave at6. The selected branch's maximum departure is6. Its finite strength convention is the capped departure level divided by that maximum: D gets 3/6=.5, and EFG get 1. Birth 1 is used in stability but is "}<strong>{"not subtracted"}</strong>{" in this strength ratio. Stability 17 and strength.5 are different operations on different objects."}</Prose>

<Prose>{"If the selected branch splits into unselected descendants, a point's exit "}<strong>{"from the selected branch"}</strong>{" is that split level, even if the point survives farther in a descendant. Carry that selected-branch departure through the descendant tree. Do not silently substitute its eventual deepest exit to inflate its attachment to the earlier branch. Noise has strength 0 in this declared output. The complete function carries that first departure level during one traversal, then applies "}<code>{"min(exit,maximum_exit)/maximum_exit"}</code>{"."}</Prose>

<Prose>{"The ordinary HDBSCAN "}<code>{"probabilities_"}</code>{" field is a clustering attachment strength under the implementation's hierarchy convention. It is not a calibrated probability of a real class, not a posterior distribution over all clusters, and not a confidence guarantee under new data. Full soft-membership vectors and approximate prediction in contrib are additional algorithms with their own fitted-state contracts; this scalar does not supply them automatically."}</Prose>

<Prose>{"The original ordinary route remains complete below, with the original trail fit and recorded strengths. It uses sklearn "}<code>{"HDBSCAN"}</code>{", explicitly chooses EOM and copies input state. Its neighbourhood minimum 4 is self-inclusive in this API. No new execution was needed to preserve the source and expected stream."}</Prose>

<RemoteCodeBlock filename="dbscan_hdbscan.py" language="python" source="/learn-code/dbscan-density-based-clustering/original-programs/dbscan_hdbscan.py" />

<Prose>{"Retained original expected output, preserved without a new execution:"}</Prose>

<CodeBlock kind="output" language="output" filename="dbscan_hdbscan.recorded.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/original-programs/dbscan_hdbscan.recorded.txt">{"[0, 0, 0, 0, 1, 1, 1, 1, 0, -1]\n[1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.6, 0.0]"}</CodeBlock>

<Prose>{"In an ordinary new application, first declare feature geometry and the two minima, then inspect labels together with coverage and strengths. Defaults such as excluding a single root cluster matter. "}<code>{"cluster_selection_method=\"leaf\""}</code>{" changes the selection objective; extra epsilon merging or allowing a single cluster changes the output contract. sklearn and contrib expose different interfaces and neighbour conventions, so compare those settings and meaningful row sets rather than assuming package names imply equivalence."}</Prose>

<Mechanism id="D46" />

<Prose>{"Outlierness asks another question: how early did this observation detach relative to the dense structure descending from its immediate condensed branch? The supported finite GLOSH implementation first finds each branch's largest outgoing departure level, then propagates descendant maxima upward. For a point p departing its immediate branch at λₚ, let λ_ref be that propagated reference maximum. The score is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"o(p)=\\frac{\\lambda_{\\rm ref}-\\lambda_p}{\\lambda_{\\rm ref}}."}</MathBlock></div>

<Prose>{"In the true-split example, D's branch reference is6 and its departure is3, giving .5. EFG depart 6, giving 0. ABC also gives 0 under its own reference 2. Draw D's point edge and the reference level on the "}<strong>{"actual"}</strong>{" branch before presenting the ratio. The propagated reference may come from a descendant; it is not necessarily a global dataset maximum or the selected branch's birth. That difference matters in deeper hierarchies."}</Prose>

<Prose>{"The scratch hierarchy’s "}<code>{"outlier_scores"}</code>{" output follows this finite branch-reference mechanism, with 0≤score≤1 in its declared domain. Its output is labeled GLOSH-style because the complete original density-theory treatment is not being inferred from this implementation walkthrough. The contrib package exposes its own "}<code>{"outlier_scores_"}</code>{"; sklearn's scalar "}<code>{"probabilities_"}</code>{" is not that API. High outlierness can identify a weakly attached observation for investigation, but does not establish an anomaly, a posterior probability or a domain error. Geometry, sampling density and the question still determine what the row means."}</Prose>

<Prose>{"The complete route now combines equal-event ancestry, cached-count condensation, stability and selection with the attachment quantities just taught."}</Prose>

<RemoteCodeBlock filename="density_hierarchy.py" language="python" source="/learn-code/dbscan-density-based-clustering/programs/density_hierarchy.py" />

<Prose>{"Actual once-executed output of this exact new source:"}</Prose>

<CodeBlock kind="output" language="output" filename="density_hierarchy.stdout.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/programs/density_hierarchy.stdout.txt">{"shrink size3 areas [26.0] selected rows [] total 0.0\nshrink size2 areas [7.0, 14.0, 10.0, 10.0, 9.0] selected rows [[0, 1], [2, 3], [4, 5, 6]] total 33.0\nsplit size3 areas [7.0, 17.0, 3.0] selected rows [[3, 4, 5, 6], [0, 1, 2]] total 20.0\nN size2 areas [7.0, 17.0, 7.0] selected rows [[3, 4, 5, 6], [0, 1, 2]] total 24.0\nchild departure 4 selected rows [[3, 4, 5, 6, 7, 8], [0, 1, 2]] total 15.0\nchild departure 5 selected rows [[3, 4, 5, 6, 7, 8], [0, 1, 2]] total 15.0\nchild departure 6 selected rows [[0, 1, 2], [3, 4, 5], [6, 7, 8]] total 21.0\nsplit strengths [1.0, 1.0, 1.0, 0.5, 1.0, 1.0, 1.0]\nsplit GLOSH-style scores [0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0]\nzero-length status UNSUPPORTED_NONPOSITIVE_OR_NONFINITE_MERGE_LENGTH"}</CodeBlock>

<Prose>{""}<code>{"build_hierarchy"}</code>{" starts with leaf nodes whose counts are 1. It sorts positive finite tree edges, snapshots the old component-node correspondence for an equal-weight batch, unions the whole batch, and creates one merge node for each resulting merged component. It validates exactly n−1 edges and refuses cycles. Counts are sums of cached child counts, avoiding repeated leaf enumeration."}</Prose>

<Prose>{""}<code>{"condense"}</code>{" traverses this structural tree from the root. Its "}<code>{"qualifying"}</code>{" list uses cached counts. Small departing subtrees are visited once to emit individual point exits; a surviving child reuses the same branch index; multiple qualifying children receive new branch indices. A branch edge records a whole child's count exiting its parent, so calculating parent stability does not require writing a separate ancestor-exit record for every row. Point and branch records together stay linear in the tree size."}</Prose>

<Prose>{"Branch parents are created before their children. Reverse branch order therefore supports the bottom-up recurrence; a separate forward traversal reconstructs selected branches without repeatedly copying sets of descendant choices. The output label numbering is nominal, based on selected branch IDs. Read selected "}<strong>{"row sets"}</strong>{" when comparing it with differently serialized trees or libraries; a number change alone is not a different partition. The displayed ABC/DEFG identities remain semantic row sets, with a local legend mapping any printed integers."}</Prose>

<Prose>{"After tree construction, cached-count condensation, stability, EOM and its reconstruction perform O(n) structural/record work and use O(n) retained records. Building the merge hierarchy adds O(n log n) edge sorting plus union-find operations. Listing full memberships for every ancestor, or retaining every animation frame, has its own potentially much larger output and is not included in those bounds. The positive finite domain and the named overflow statuses are part of the contract, not a hidden division-by-zero branch."}</Prose>

<Prose>{"The new program was executed once on these supplied weighted trees. Its printed totals reproduce 26/root-excluded,33,20, the changed transfer total 24, and the parent/tie/children totals 15/15/21. It is not a fit on Iris or the original trail, and not a claim of universal library label parity. The actual node representation, equal-event grouping and root/equality choices explain what was calculated."}</Prose>

<Prose>{"Neither stability nor these strengths evaluates a fixed partition's balance of density separation and within-group sparseness. The next section calculates that separate criterion on an explicitly labeled two-group point cloud, retaining noise and its denominator. It uses different all-points core distances, so the earlier kth-neighbour disks must not be silently reused."}</Prose>

<H2>{"17. Evaluate density separation on a fixed labeled point cloud"}</H2>

<Prose>{"The earlier measures answer different questions: silhouette compares within-group and alternative-group distances; ARI compares two partitions on an explicitly chosen ID universe; HDBSCAN stability compares branches in one hierarchy. "}<strong>{"Density-Based Clustering Validation"}</strong>{", or DBCV, asks whether each fixed group is less sparse internally than the density connection to another group. It does not fit the groups or certify their domain meaning."}</Prose>

<Mechanism id="D47" />

<Prose>{"Keep nine observations visible. The left group is A(0,0), B(1,0), C(3,1), D(6,1); the right group is E(12,4), F(14,4), G(17,6), H(21,6). J(8,8) is noise. The labels are inputs to validation. This constructed two-dimensional cloud gives nontrivial internal vertices and separation pairs; it is not a new Iris fit."}</Prose>

<Prose>{"For A, the squared distances to the other three members are 1,10 and 37. DBCV's "}<strong>{"all-points core distance"}</strong>{" uses all other members of A's labeled group, with the ambient dimension d=2. The mean of the reciprocal squared distances is "}<code>{"(1 + 1/10 + 1/37)/3 = 139/370"}</code>{". Its inverse square root is "}<code>{"sqrt(370/139) ≈ 1.631524"}</code>{". Draw the three actual within-group edges and reciprocal-power contributions before writing the formula."}</Prose>

<Prose>{"For a group C with s>1 members in declared ambient dimension d, this distance is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"a_C(p)=\\left(\\frac1{s-1}\\sum_{q\\in C,\\ q\\ne p}d(p,q)^{-d}\\right)^{-1/d}."}</MathBlock></div>

<Prose>{"Here d in an exponent means dimension, while d(p,q) means the chosen distance. Keep the two uses labeled when reading code. This is "}<strong>{"not"}</strong>{" the mth-neighbour core radius used by DBSCAN, OPTICS or the earlier HDBSCAN graph. Its support is the entire labeled group, not a globally ranked neighbourhood. The reciprocal powers emphasize close observations while retaining the group-wide normalization."}</Prose>

<Prose>{"The left cores are the square roots of "}<code>{"[370/139,390/161,270/37,25974/1529]"}</code>{". The right cores are the square roots of "}<code>{"[29580/2921,8268/953,18096/1049,216240/6713]"}</code>{". These values come from the same four-cell within-group sums. J supplies no group core because it is labeled noise. It still remains in the global report's observation count."}</Prose>

<Prose>{"Directly raising a tiny distance to −d can overflow. A stable computation rescales the sum by the smallest positive distance δ in that row. Write "}<code>{"T = sum((δ/r)^d)"}</code>{" over the other members. Every term is at most 1 and at least one is1. Then"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"a_C(p)=\\delta\\exp\\left(\\frac{\\log(s-1)-\\log T}{d}\\right)."}</MathBlock></div>

<Prose>{"This is algebraically the same formula on positive finite distances, with no avoidable huge reciprocal powers. It does not make every extreme floating-point geometry safe: distance overflow, an unrepresentable final core or an invalid zero-distance convention still needs an explicit diagnostic. The strict route requires distinct finite Euclidean observations, not a hidden arbitrary epsilon substitute."}</Prose>

<H3>{"Find the sparse connection inside each group"}</H3>

<Mechanism id="D48" />

<Prose>{"Within each fixed group, use "}<code>{"max(a_C(p),a_C(q),d(p,q))"}</code>{" to weight its edges. The left MST is A–B≈1.631524, B–C≈2.701351, C–D≈4.121598. The right MST is E–F≈3.182243, F–G≈4.153398, G–H≈5.675573. Draw these actual tree paths over the point clouds and count each vertex's incident edges."}</Prose>

<Prose>{"An "}<strong>{"internal vertex"}</strong>{" has degree greater than 1. B and C are internal on the left; F and G are internal on the right. An "}<strong>{"internal edge"}</strong>{" joins two internal vertices, so B–C and F–G are the respective internal edges. The long leaf attachments C–D and G–H are still drawn, but they do not become the strict internal sparseness merely because they are large."}</Prose>

<Prose>{"The "}<strong>{"density sparseness"}</strong>{" DSC(C) is the largest internal MST-edge weight. Thus the left sparseness is approximately 2.701351 and the right is4.153398. This measures the weakest retained internal connection under the all-points weighting. It is not the longest raw pairwise distance, total MST weight or radius needed to include the furthest leaf. Tiny groups may have no internal edge at all; the strict score then has a named unsupported status, which the next section contrasts with prototype fallbacks."}</Prose>

<H3>{"Compare actual internal vertices across groups"}</H3>

<Mechanism id="D49" />

<Prose>{"The four eligible pairs are B–F, B–G, C–F and C–G. Their squared raw lengths are 185,292,130 and 221. D and E might look closer in the full cloud, but they are leaf vertices and are not eligible under this separation rule. Keep them visible while distinguishing the actual eligible subset."}</Prose>

<Prose>{"For an eligible cross pair, weight its raw distance by the two "}<strong>{"within-own-group"}</strong>{" all-points cores. The "}<strong>{"density separation"}</strong>{" DSPC(C,D) is the minimum of those cross-internal mutual-reachability weights:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"\\operatorname{DSPC}(C,D)=\n\\min_{p\\in I_C,\\ q\\in I_D}\\max\\{a_C(p),a_D(q),d(p,q)\\},"}</MathBlock></div>

<Prose>{"where I_C and I_D are the internal-vertex sets of the chosen group trees. In this cloud, C–F wins: "}<code>{"sqrt(130) ≈ 11.401754"}</code>{", above both endpoint cores. The raw ruler therefore controls that pair's maximum. Check all four pairs; a nearest-looking point in the picture is not a proof of the internal minimum."}</Prose>

<Prose>{"For each group, compare its DSC with its nearest DSPC to any other eligible group. The normalized signed value is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"V(C)=\\frac{\\operatorname{DSPC}_{\\min}(C)-\\operatorname{DSC}(C)}\n           {\\max\\{\\operatorname{DSPC}_{\\min}(C),\\operatorname{DSC}(C)\\}}."}</MathBlock></div>

<Prose>{"On finite positive operands, the result lies between−1 and 1. Positive means the closest cross-group density connection is larger than the group's internal sparseness; negative means that connection is smaller. It does not mean that positive groups match semantic classes or that negative rows must be anomalies."}</Prose>

<Prose>{"The left value is approximately.763076 and the right.635723. Their common separator is the same C–F edge, but the within-group DSC values differ. The larger right sparseness gives the smaller right score."}</Prose>

<Mechanism id="D50" />

<Prose>{"The global DBCV is a size-weighted sum using the original input n, including noise:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"\\operatorname{DBCV}=\\sum_C\\frac{|C|}{n}V(C)."}</MathBlock></div>

<Prose>{"Each group has 4/9 weight, so the total is approximately.621688. J has no cluster term, yet its presence prevents the assigned groups' weights from silently summing to 1. Coverage is8/9. A conditional assigned-universe value divides the global total by that coverage, giving approximately.699399. Name it as conditional; removing J changes the reporting universe, not the partition's geometry. This is the same population discipline taught in "}<a href={"/learn/topic/clustering-evaluation-validation-silhouette-ari-nmi#9-unassigned-observations-a-cleaner-score-can-describe-fewer-cases"}>{"Clustering Evaluation's unassigned-observation section"}</a>{"."}</Prose>

<H2>{"18. Inspect ties, unsupported shapes and implementation conventions"}</H2>

<Prose>{"DBCV has more assumptions than a scalar output suggests. The preceding example has positive distinct points, two groups with internal edges, and a uniquely determined path anatomy. Inspect those conditions before treating another program's number as the same calculation."}</Prose>

<Mechanism id="D51" />

<Prose>{"On a unit square A(0,0),B(1,0),C(1,1),D(0,1), all four all-points cores are √(6/5). Each side therefore has mutual weight √(6/5), while a diagonal costs √2. The path A–B–C–D and the different path B–C–D–A are both MSTs, each totaling 3√(6/5), and preserve the same cut components. Their internal vertices are B/C and C/D respectively, changing DBCV's eligible cross-group candidates. A star containing a diagonal is "}<strong>{"not"}</strong>{" a minimum tree here. The threshold proof from §13 does not imply an invariant score for every MST tie resolution. State the tree's deterministic tie policy and inspect its actual internal sets. Near ties also depend on floating-point comparisons; a tolerance that changes which edges count as tied is part of an implementation contract."}</Prose>

<Mechanism id="D52" />

<Prose>{"The strict route returns named statuses rather than invented scores: all noise has no assigned separation; one group has no other-group separation; a singleton makes the all-points denominator s−1 invalid; two rows have no internal vertex; a three-row path has only one internal vertex and no internal edge. Larger groups can also form a tree without a usable internal edge. A zero distance violates the declared distinct-point geometry. The drawing shows the actual small trees or coincident observations beside the missing quantity, rather than merely displaying red status words."}</Prose>

<Prose>{"Status precedence is diagnostic, not a ranking: for example, a partition of two-row groups reports its unsupported internal shape before any need to estimate a score. Finite input features do not guarantee representable squared distances or all-points cores. The source reports arithmetic-domain failures explicitly. Do not fill missing values with 0 and compare them against well-defined group scores."}</Prose>

<H3>{"Distinguish the published definition from two software policies"}</H3>

<Prose>{"The original MATLAB prototype uses squared Euclidean distances while retaining the feature dimension in the reciprocal-power calculation. It uses label 0 as noise, turns singleton groups into noise, and returns 0 when zero or one group remains. If no internal edges exist, it uses all MST edges for DSC; if no internal vertices exist, it falls back to all cluster vertices for separation. Its original-n weighting still includes excluded observations. Squaring every length is a substantive convention here: the reciprocal-power core is not merely the square of the earlier Euclidean core, so the score can change."}</Prose>

<Prose>{"The pinned contrib implementation uses Euclidean distances, label−1 as noise and a zero-distance omission policy in its all-points sum. With no internal vertex it falls back to the first cluster vertex, while no internal edge makes it use all MST edges. These tiny-group fallbacks differ from MATLAB's all-vertex separation fallback. A one-group calculation has no finite other-group minimum; the source's undefined arithmetic must not be redescribed as MATLAB's early zero result. Empty, singleton, duplicate and one-group cases need the exact version's behavior rather than a general compatibility claim."}</Prose>

<Prose>{"The complete scratch file provides separately named MATLAB/contrib "}<strong>{"convention adapters"}</strong>{" for these selected policies, with its own deterministic maintained Prim tree. They deliberately return named diagnostics for unsupported arithmetic instead of claiming a bitwise replay of every upstream exception or NaN. The ordinary "}<code>{"hdbscan.validity.validity_index"}</code>{" route calls the actual optional library, remaps arbitrary nominal labels to its nonnegative integers, retains noise−1, and returns the installed version with its result. It was not executed in the present instructional environment, so there is no invented ordinary-library parity stream. Its API contract is tied to the inspected contrib source; check the installed version when running it."}</Prose>

<Prose>{""}<code>{"relative_validity_"}</code>{" from contrib HDBSCAN is another convenience: a proxy based on the fitted model's mutual-reachability tree. It is not the full fixed-partition all-points-core DBCV calculation above. Neither a similar field name nor correlation on one dataset makes them interchangeable."}</Prose>

<H3>{"Move the right group without refitting the labels"}</H3>

<Mechanism id="D53" />

<Prose>{"Keep the left group fixed and move the entire right group to E(s,4), F(s+2,4), G(s+5,6), H(s+9,6), with s between 2 and 12. Within-right distances, all-points cores and internal MST anatomy remain unchanged. The eligible cross-internal minimum stays C–F throughout this interval. Its squared raw length is "}<code>{"(s−1)²+9"}</code>{"; the squared alternatives exceed it by "}<code>{"4s+7"}</code>{", "}<code>{"10s+42"}</code>{" and "}<code>{"6s+19"}</code>{", all positive here. Its minimum squared length 10 also exceeds both endpoint core squares 270/37 and 8268/953, so its raw distance controls the maximum throughout this declared range."}</Prose>

<Prose>{"At s=6, separation is "}<code>{"sqrt(34)"}</code>{" and global DBCV is approximately.366409. At s=2, separation is "}<code>{"sqrt(10)"}</code>{", left score approximately.145758 and right score approximately−.238629, giving global approximately−.041276. The right group becomes negative when its separation falls below right DSC≈4.153398. Equality occurs at "}<code>{"s = 1 + sqrt(18096/1049 − 9) ≈ 3.872406"}</code>{". The single taught translation control therefore changes cross-group separation and signed contributions while retaining within-group quantities, labels and coverage 8/9. It does not refit DBSCAN or HDBSCAN."}</Prose>

<Prose>{"The live sentence states current internal pair, separator, each signed contribution and the global/conditional denominators. Negative output remains visible. At the equality state the right contribution is0; it is neither hidden nor rounded into a fabricated positive success. This is a geometry/validation investigation, not an optimization prescription to move real observations until their score improves."}</Prose>

<RemoteCodeBlock filename="density_validity.py" language="python" source="/learn-code/dbscan-density-based-clustering/programs/density_validity.py" />

<Prose>{"Recorded output of the preserved preceding source version; the focused current function checks are described in setup.md:"}</Prose>

<CodeBlock kind="output" language="output" filename="density_validity.stdout.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/programs/density_validity.stdout.txt">{"offset 12 coverage 0.8888888888888888 global 0.6216883291276989 conditional 0.6993993702686613\nleft internal ['B', 'C'] DSC 2.7013510133444893 DSPC 11.40175425099138 pair ['C', 'F'] score 0.7630758430783047\nright internal ['F', 'G'] DSC 4.153398002435463 DSPC 11.40175425099138 pair ['F', 'C'] score 0.6357228974590181\noffset 6 coverage 0.8888888888888888 global 0.3664089965718815 conditional 0.4122101211433667\nleft internal ['B', 'C'] DSC 2.7013510133444893 DSPC 5.830951894845301 pair ['C', 'F'] score 0.5367221232381376\nright internal ['F', 'G'] DSC 4.153398002435463 DSPC 5.830951894845301 pair ['F', 'C'] score 0.2876981190485957\noffset 2 coverage 0.8888888888888888 global -0.041275994130225785 conditional -0.04643549339650401\nleft internal ['B', 'C'] DSC 2.7013510133444893 DSPC 3.1622776601683795 pair ['C', 'F'] score 0.14575780382275083\nright internal ['F', 'G'] DSC 4.153398002435463 DSPC 3.1622776601683795 pair ['F', 'C'] score -0.23862879061575887\nstrict two-row status TWO_ROW_CLUSTER\ncontrib tiny policy 0.75\nMATLAB tiny policy 0.8888888888888888\none-group status ONE_GROUP\nall-noise status ALL_NOISE"}</CodeBlock>

<Prose>{""}<code>{"all_points_cores"}</code>{" uses one current row of distances and the stable scaled-power formula. "}<code>{"prim_tree"}</code>{" then builds each group tree from an on-demand oracle. Degrees determine actual internal vertices and edges; "}<code>{"sparseness"}</code>{" is their maximum. The cross-group loops inspect all eligible internal pairs and retain the minimum and its two input positions. Every cluster report includes cores, tree edges, degrees, internal rows, DSC, DSPC, the winning pair, score, weight and contribution. These are interpretable intermediates, not a bare metric return."}</Prose>

<Prose>{"The strict function rejects geometry and shape outside its declared domain. "}<code>{"matlab_convention_report"}</code>{" and "}<code>{"contrib_convention_report"}</code>{" choose the taught distance/noise/fallback policies without changing the strict definition. Their score comparison on two two-row groups exposes the different internal-vertex fallback. "}<code>{"ordinary_contrib_validity"}</code>{" is the real library route, with explicit label remapping and version attribution; the new main does not call it or install a missing package."}</Prose>

<Prose>{"The recorded preceding-version stream computes the three translated fixed partitions with the corresponding complete scratch source, compares their known worked values, and prints the internal pairs and signed quantities. It also prints the tiny/one/all-noise diagnostics and two convention-adapter results. There is no new clustering fit and no replay of the earlier design fixture's script. The selected policy adapters do not certify arbitrary upstream numerical tie or degenerate behavior."}</Prose>

<Prose>{"With on-demand Euclidean distances, within-group core sums and MST oracles cost O(n²d) in total. Cross-internal separation may inspect every pair between groups, also O(n²d); it is not free merely because the retained MSTs have n−1 edges. Core arrays, degree arrays, current row distances and retained group trees use O(n) auxiliary/structural storage, excluding input features and requested reports. A cached complete pair matrix would cost O(n²) storage. Returning full anatomy is useful for teaching and debugging, but copying it for every live frame adds a separate output cost."}</Prose>

<Prose>{"A useful report now states geometry, fixed labels, supported status, tree convention, population, coverage and score interpretation. The next section takes those same contracts into weighted, sparse, distributed and evolving-data situations, where a seemingly convenient shortcut can change what the neighbourhood actually means."}</Prose>

<H2>{"19. Preserve the neighbourhood contract when the system changes"}</H2>

<Prose>{"The methods above rely on specific input geometry, exact neighbourhoods and declared reporting populations. Faster storage, duplicate compression, partitioned processing or new observations can change that contract. Begin with the actual object being changed; a convenient API flag is not a proof of equivalent clustering."}</Prose>

<Mechanism id="D54" />

<Prose>{"A range query for row i returns rᵢ neighbour IDs. The on-demand DBSCAN route pays for building any index, the actual query work, and processing all returned neighbours. Writing those responses already costs at least the number of returned entries. A dataset in which every observation lies within ε of every other has n² total neighbour incidences; no exact index can make that output disappear. The graph-size cost is a mathematical consequence of the requested neighbourhoods, not a measured timing curve."}</Prose>

<Prose>{"Our scratch brute provider uses O(nd) input storage, O(n) clustering metadata and one current response. A library tree can reduce useful query work in a suitable low-dimensional geometry, but its index build and stored structure have costs too. In higher dimensions, pruning can deteriorate and brute search can be competitive. sklearn DBSCAN's stored neighbourhoods can use O(n²) memory in dense cases. Approximate search changes the returned rosters and can change core status at the closed boundary; it is not automatically an exact replacement. Benchmarking requires actual data, configuration and timings, rather than invented points on a performance plot."}</Prose>

<H3>{"Replace repeated observations by positive multiplicities"}</H3>

<Mechanism id="D55" />

<Prose>{"Take distinct IDs a,b,c all at0, d at.5 and e at4. At ε=.6/minimum 3, the first four observations form one group, while e is noise. Replace the three identical positions by one representative at0 with weight 3, keep .5 and 4 with weight 1, then expand each representative's label back to its original IDs. The weighted neighbourhood count is the sum of representative weights, so the density counts and roles are preserved for positive integer duplicate multiplicities. Keep the original IDs in that expansion map; compression must not lose the observation population."}</Prose>

<Prose>{"The weighted core predicate is "}<code>{"sum(weight[j] for j in neighbourhood(i)) >= minimum"}</code>{". The queue still expands only a qualifying core row. A positive weight at least the minimum can make its representative core by itself. Fractional nonnegative weights are a separate weighted-density interpretation, not literally a number of duplicated observations."}</Prose>

<Prose>{"sklearn also accepts negative weights as "}<strong>{"inhibition"}</strong>{". On new positions 0,.5,1 with ε=.6/minimum 2 and weights "}<code>{"[1,−1,1]"}</code>{", the three neighbourhood sums are 0,1,0. None is core, even though the unweighted counts are 2,3,2. A negative weight is not negative multiplicity; it changes how neighbouring observations qualify. The local weighted drawing compares the actual sum and its threshold after weights are taught. One already-taught representative weight is enough; there is no need for a method selector."}</Prose>

<Prose>{"The original duplicate-compression program remains complete with its recorded expected result:"}</Prose>

<RemoteCodeBlock filename="dbscan_duplicates.py" language="python" source="/learn-code/dbscan-density-based-clustering/original-programs/dbscan_duplicates.py" />

<Prose>{"Retained original expected output, preserved without a new execution:"}</Prose>

<CodeBlock kind="output" language="output" filename="dbscan_duplicates.recorded.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/original-programs/dbscan_duplicates.recorded.txt">{"[0, 0, 0, -1]\n[-1, -1]"}</CodeBlock>

<Prose>{"The ordinary call passes "}<code>{"sample_weight"}</code>{" to "}<code>{"DBSCAN.fit"}</code>{", not to a generic unweighted distance calculation. Compare the expanded row sets and the explicit label expansion, rather than assuming a representative label vector has the same observation count as the original data."}</Prose>

<H3>{"An absent sparse entry is not a zero-length edge"}</H3>

<Mechanism id="D56" />

<Prose>{"Use graph vertices A, B and C. Store self distances 0 for all three and off-diagonal A–B and B–A distances 0. Leave A–C and B–C absent. At ε=.1/minimum 2, the explicit zero edges make A and B neighbours and core; C has only itself and remains noise. A missing entry means no supplied edge. It must not be interpreted as a distance 0 to every missing neighbour."}</Prose>

<Prose>{"Conversely, "}<code>{"eliminate_zeros()"}</code>{" would delete the real duplicate A–B relation in this representation. Zero values can carry semantic edges even when they look like removable sparse storage. The scratch provider requires canonical CSR, a square shape, unique IDs, finite nonnegative stored lengths, exact symmetry and explicit stored diagonal zeros. It copies the graph before constructing immutable adjacency. Repeated CSR column entries are refused rather than summed as if adding two distances defined the same edge. The ordinary example passes this sparse matrix with "}<code>{"metric=\"precomputed\""}</code>{", so the graph contract must already be correct."}</Prose>

<Prose>{"Only supplied edges at or below ε appear in a response. If a sparse graph omits a real nearby feature-space edge, its clustering can differ; sparse precomputed mode does not reconstruct that distance on demand. A range-neighbour graph built correctly at a declared maximum radius can support smaller cuts, while an arbitrary k-neighbour graph need not contain every required radius neighbour. State how the graph was built before treating it as an exact provider."}</Prose>

<H3>{"Reconcile partition boundaries before naming global groups"}</H3>

<Mechanism id="D57" />

<Prose>{"Split the original trail between owned partitions through a dense run, so neither owner can infer all density counts from its own rows alone. An ε "}<strong>{"halo"}</strong>{" supplies every observation close enough to influence an owned row's neighbourhood, including rows owned elsewhere. Count each observation once by stable ID, then determine its core status using that complete global roster."}</Prose>

<Prose>{"Next unite core-to-core edges across ownership boundaries. Reconcile component identity through union-find rather than concatenate each worker's cluster numbers. A border row attaches only after global core components are known. If it touches two components, retain the ambiguity or apply a declared attachment policy. Two workers both using label 0 do not prove that their groups match, while workers using different labels may belong to one connected global component."}</Prose>

<Prose>{"The transparent "}<code>{"halo_core_components"}</code>{" route below performs these operations with the exact shared provider: builds each owner's halo, computes global core predicates, unions qualifying neighbours, and reports border candidate component sets. It is an instructional reconciliation algorithm, not a distributed throughput benchmark. Its brute geometric queries retain their O(n²d) work. Halos can overlap widely and occupy O(number_of_owners×n) entries in a dense case; partitioning alone does not guarantee lower memory. The complete report distinguishes owned IDs, halo IDs and core component IDs."}</Prose>

<H3>{"Query a frozen reference without pretending to refit it"}</H3>

<Mechanism id="D58" />

<Prose>{"For a frozen reference, keep its original geometry, ε, core flags and labels unchanged. A new query can inspect the reference core observations within ε. If it finds none, return "}<code>{"none"}</code>{"; if all eligible cores belong to one component, return that component; if it touches several components, return "}<code>{"ambiguous"}</code>{" with all candidate components. This conservative custom query is useful for a fixed catalogue, but it is not a built-in DBSCAN "}<code>{"predict"}</code>{" method."}</Prose>

<Prose>{"Use the new reference points A=−2,B=−1.5,C=−1 and D=1,E=1.5,F=2, ε=1/minimum 3. The two triples are core components. A query at−5 touches none; at−1.5 it touches only the left component; at0 it reaches C and D at the closed boundary and is ambiguous. The live query-position control shows those actual eligible core IDs and candidate components in a sentence. It does not alter the reference counts or claim the query is itself core."}</Prose>

<Mechanism id="D59" />

<Prose>{"Why not just append a frozen-reference answer to the old labels? Return to the original trail and insert a "}<strong>{"new"}</strong>{" ID I′ at0 alongside I, with ε=1/minimum 4. Before insertion, I's roster is D,I,E, count 3, so I is border. After insertion, both I and I′ have D,I,I′,E, count 4 and become core. Their core links bridge the left and right components, merging them on a full refit. An earlier frozen query's ambiguous result did not predict this changed global state."}</Prose>

<Prose>{"The drawing changes the actual roster and core-to-core edges while keeping I and I′ distinct. It uses the conserved insertion witness, not a freshly rerun historical fit. A new observation can change older rows' density roles and components; appending predictions without recomputing the stated fit is a different service contract. Contrib's approximate HDBSCAN prediction is yet another algorithm tied to its stored condensed tree and prediction state, not this DBSCAN core query or a guarantee of equivalence to refitting."}</Prose>

<RemoteCodeBlock filename="density_query_extensions.py" language="python" source="/learn-code/dbscan-density-based-clustering/programs/density_query_extensions.py" />

<Prose>{"Recorded output of the preserved preceding source version; the focused current function checks are described in setup.md:"}</Prose>

<CodeBlock kind="output" language="output" filename="density_query_extensions.stdout.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/programs/density_query_extensions.stdout.txt">{"duplicate-expanded labels [0, 0, 0, 0, -1] weighted representatives [0, 0, -1]\nnegative-weight cores [False, False, False] labels [-1, -1, -1]\nstored-zero sparse rosters [['A', 'B'], ['A', 'B'], ['C']] labels [0, 0, -1]\nfrozen query -5 {'status': 'none', 'components': (), 'eligible_core_ids': ()}\nfrozen query -1.5 {'status': 'one_component', 'components': (0,), 'eligible_core_ids': ('A', 'B', 'C')}\nfrozen query 0 {'status': 'ambiguous', 'components': (0, 1), 'eligible_core_ids': ('C', 'D')}\nreconciled core components [('A', 'B', 'C'), ('D', 'E', 'F')] halos {'west': ('A', 'B', 'C', 'D', 'E', 'F'), 'east': ('A', 'B', 'C', 'D', 'E', 'F')}"}</CodeBlock>

<Prose>{""}<code>{"weighted_dbscan"}</code>{" reuses the queue invariants but substitutes the taught weight sum for an unweighted count. It retains one query per visited row and immutable output; the provider's own storage is separate. "}<code>{"SparseNeighbourhoods"}</code>{" stores supplied graph incidences rather than geometric feature rows. "}<code>{"frozen_core_query"}</code>{" validates the fixed partition/ID correspondence, accepts one finite query row in the same metric and returns eligible reference-core IDs without mutating the reference. "}<code>{"halo_core_components"}</code>{" uses global neighbourhoods and union-find to reconcile the core components, then reports border possibilities."}</Prose>

<Prose>{"The new main compares its constructed positive/negative weighted and stored-zero sparse cases with sklearn DBSCAN, then exercises the six-row frozen reference and exact halo reconciliation. The stream identifies the executed source version. These examples establish their stated operations and outputs, rather than distributed speed or new-data classification accuracy."}</Prose>

<H3>{"Keep IDs and noise policies explicit in every report"}</H3>

<Prose>{"The earlier Iris tables established why assigned-only and all-ID scores describe different populations. The final portable template needs a general adapter, rather than importing the fixed eight-row pair board from another lesson. Reuse the "}<a href={"/learn/topic/clustering-evaluation-validation-silhouette-ari-nmi#5-ari-count-the-pairs-before-correcting-for-chance"}>{"ARI pair-count mechanism"}</a>{" and generalize its contingency counts to any declared ID universe."}</Prose>

<Prose>{"Let n be the number of aligned compared rows. Let M=choose(n,2), S the sum of choose(cell_count,2) over contingency cells, A the same sum over first-partition group counts, and B over second-partition group counts. Agreements are "}<code>{"M−A−B+2S"}</code>{"; RI divides them by M. Avoid subtracting separately rounded chance terms in ARI by computing the equivalent integer expression"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"\\operatorname{ARI}=\\frac{2(MS-AB)}{M(A+B)-2AB}."}</MathBlock></div>

<Prose>{"Python integer intermediates preserve the pair counts. Nominal group names do not affect them. Fewer than two compared observations have a trivial scalar convention 1, but the "}<strong>{"report"}</strong>{" returns "}<code>{"insufficient_comparison"}</code>{" with no evidential ARI value. Empty assigned intersections must not become a flattering score 1. With n≥2, both all-singleton or both all-in-one partitions produce the named zero-denominator degeneracies and scalar 1."}</Prose>

<Prose>{"The universe supplies unique string/integer IDs and corresponding finite feature rows. Reject duplicate IDs, bool IDs/labels, NaN labels, undeclared map IDs and unsupported negative labels rather than quietly turn them into noise−1. First intersect map availability by ID. "}<code>{"noise_as_group"}</code>{" then retains the common available rows including−1. "}<code>{"assigned_common"}</code>{" excludes any ID labeled−1 by "}<strong>{"either"}</strong>{" partition. Reordering a map never changes the aligned result. Coverage always uses the original declared universe."}</Prose>

<Prose>{"For silhouette, create one declared retained feature/label population: "}<code>{"noise_as_group"}</code>{" or "}<code>{"assigned_only"}</code>{". If its number of occupied groups is outside 2 through n−1, return "}<code>{"undefined_silhouette"}</code>{". Focal IDs must be unique retained IDs. Computing only selected focal rows still compares their distances to the "}<strong>{"full retained population"}</strong>{", as taught in "}<a href={"/learn/topic/clustering-evaluation-validation-silhouette-ari-nmi#3-silhouette-inspect-one-point-s-neighborhood-before-averaging"}>{"silhouette's focal-neighbourhood section"}</a>{". Report focal coverage separately from retention; sampling the focal outputs is not the same operation as recomputing a smaller clustering universe."}</Prose>

<Prose>{"The exact reused helper follows in full, including its guarded demonstration. Its demonstration was not run again; only the reusable function is called on the new adapter's declared rows. A block contains q×n distances and q×k group sums, so bounded scratch blocks control memory while a full n-row report still has quadratic distance work."}</Prose>

<RemoteCodeBlock filename="silhouette_chunked.py" language="python" source="/learn-code/dbscan-density-based-clustering/programs/silhouette_chunked.py" />

<Prose>{"The general adapter and its complete new ordinary comparisons follow:"}</Prose>

<RemoteCodeBlock filename="density_metrics.py" language="python" source="/learn-code/dbscan-density-based-clustering/programs/density_metrics.py" />

<Prose>{"Actual once-executed output of this exact new source:"}</Prose>

<CodeBlock kind="output" language="output" filename="density_metrics.stdout.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/programs/density_metrics.stdout.txt">{"noise_as_group IDs ['A', 'B', 'C', 'D', 'E', 'F', 'G'] ARI 0.4444444444444444 RI 0.7619047619047619 coverage 1.0\nassigned_common IDs ['A', 'B', 'C', 'D', 'E', 'F'] ARI 0.32432432432432434 RI 0.6666666666666666 coverage 0.8571428571428571\nassigned focal IDs ['A', 'D'] scores [0.8125, 0.75] retention 0.8571428571428571 focal coverage 0.3333333333333333\nempty assigned comparison insufficient_comparison ARI None"}</CodeBlock>

<Prose>{""}<code>{"label_map"}</code>{" copies and validates map availability before arithmetic. "}<code>{"aligned_pair_report"}</code>{" returns compared IDs and both availability counts alongside support and coverage. "}<code>{"pair_agreement"}</code>{" supplies scalar conventions and exact integer pair quantities; the reporting layer withholds a score when support is insufficient. "}<code>{"silhouette_report"}</code>{" makes one retained table and translates focal IDs into its positions before calling the unchanged helper. It does not independently filter two label arrays and compare them by incidental position."}</Prose>

<Prose>{"On the new seven-row example, noise-as-group compares all seven IDs and gives ARI 4/9; assigned-common compares six and gives ARI 12/37, coverage 6/7. The two selected silhouette focal IDs A and D give.8125 and.75 against the same six-row retained population, with focal coverage 2/6. The assertions call ordinary adjusted-Rand, Rand and silhouette functions on those exact same populations. The empty assigned intersection reports no score. These actual checks do not replay the earlier fixed eight-row script or the reused helper's main."}</Prose>

<Mechanism id="D60" />

<Prose>{"Choose DBSCAN when a justified common scale and neighbourhood count answer the task. Use OPTICS when examining connectivity across scales or relative valleys helps. Use HDBSCAN's condensed persistence when selecting nonoverlapping hierarchy branches answers the question. Use full DBCV to evaluate a "}<strong>{"fixed"}</strong>{" partition under its explicit supported geometry and population. These are different mechanisms, not a leaderboard with one universally superior algorithm. Unsuitable features, high-dimensional distance concentration, distribution shift and domain ambiguity remain possible for every route."}</Prose>

<Prose>{"The portable analysis template next combines these contracts: train-only geometry state, a stated development protocol, fixed IDs and a frozen report. It keeps external annotations outside the fitting decision and distinguishes a custom frozen query from a transductive refit."}</Prose>

<H3>{"Freeze a declared development protocol before external assessment"}</H3>

<Mechanism id="D62" />

<Prose>{"Use a new constructed development table with IDs A–H and features "}<code>{"sensor_x,sensor_y"}</code>{". The first four rows are the square corners(0,0),(0,.2),(.2,0),(.2,.2); the next four are(5,5),(5,5.2),(5.2,5),(5.2,5.2). These are illustrative observations, not a real sensor benchmark. The earlier Iris section supplies the separate actual measured-data report."}</Prose>

<Prose>{"Both training feature means are 2.6. Their population variance is6.26, so each fitted scale is "}<code>{"sqrt(6.26) ≈ 2.501999"}</code>{". Draw those eight IDs supplying the fitted arrays, then those arrays transforming the same eight feature rows into the development geometry. Draw held-out rows entering the transform from a separate branch, with no arrow back to the fitted means or scales. This repeats the train-only mechanism from §6 using this template's actual arrays, not the earlier four-row example's different values."}</Prose>

<Prose>{"For this demonstration, declare three increasing candidate radii "}<code>{".04,.08,.12"}</code>{", self-inclusive minimum 3, minimum retention.8 and required assigned-common ARI 1 against the "}<strong>{"next"}</strong>{" candidate. Choose the first candidate with at least two groups, sufficient assigned coverage, sufficient common assigned support, and the required partition agreement. These are explicitly chosen development criteria for this example, not universal optimal parameters. A last candidate has no next comparison and does not satisfy this particular rule."}</Prose>

<Prose>{"At .04, all eight rows are noise. At .08, the two squares form two core groups with full coverage. At .12, the same groups persist, so .08 meets the declared next-candidate agreement 1 and is selected. The square's normalized side length is approximately.079936 and diagonal approximately.113047, explaining the count change. An all-noise comparison has insufficient assigned support; the scalar trivial ARI convention does not let .04 pass. No species or external domain label participates in this selection."}</Prose>

<Prose>{"The resulting immutable "}<code>{"FrozenRun"}</code>{" stores ordered feature names and IDs, fitted scaler state, normalized reference rows, core flags, labels, chosen radius/minimum and the complete candidate record. The ordinary route builds a real "}<code>{"Pipeline"}</code>{" containing "}<code>{"StandardScaler"}</code>{" then "}<code>{"DBSCAN"}</code>{" and fits "}<strong>{"only"}</strong>{" the development table. For the stated well-conditioned new example, its geometry and core row sets agree with the scratch route. Arbitrary CSV inputs need inspection of scaling safeguards and border eligibility; a complete-partition parity promise would ignore the earlier shared-border exception."}</Prose>

<Prose>{"After selection, the external illustrative annotations label the two constructed squares “left” and “right.” The report compares them with frozen labels on named all-common and assigned-common populations. Their ARI 1 is unsurprising for this deliberately separated construction and is not a new real-data accuracy result. The assigned silhouette is approximately.967810; full DBCV is approximately.968390 under this chosen tree's actual anatomy. A differently tied tree must still be inspected as taught in §18. Neither value selected the radius or proves usefulness beyond the construction."}</Prose>

<Prose>{"Held-out(.1,.1) is transformed with the same arrays and reaches the left reference core group. Held-out(2.6,2.6) and(9,9) reach none at the frozen .08 cut. These are conservative reference-query results, not new DBSCAN fits or new core-role decisions. The ordinary pipeline's scaler can transform held-out rows; its DBSCAN component has no "}<code>{"predict"}</code>{" method. A transductive refit would be a separately declared analysis that could alter older labels."}</Prose>

<RemoteCodeBlock filename="density_analysis_template.py" language="python" source="/learn-code/dbscan-density-based-clustering/programs/density_analysis_template.py" />

<Prose>{"Actual once-executed output of this unchanged template source with the helper versions identified in its execution receipt:"}</Prose>

<CodeBlock kind="output" language="output" filename="density_analysis_template.stdout.txt" downloadUrl="/learn-code/dbscan-density-based-clustering/programs/density_analysis_template.stdout.txt">{"development candidates [(0.04, 0, 0.0, None, 0.0), (0.08, 2, 1.0, 1.0, 1.0), (0.12, 2, 1.0, None, 0.0)]\nselected radius 0.08 IDs ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']\nfitted mean [2.6, 2.6] scale [2.5019992006393603, 2.5019992006393603]\nfrozen report {\"assigned_silhouette\": {\"available_n\": 8, \"focal_coverage\": 1.0, \"focal_ids\": [\"A\", \"B\", \"C\", \"D\", \"E\", \"F\", \"G\", \"H\"], \"mean\": 0.9678104845502752, \"policy\": \"assigned_only\", \"retained_ids\": [\"A\", \"B\", \"C\", \"D\", \"E\", \"F\", \"G\", \"H\"], \"retention\": 1.0, \"status\": \"OK\", \"universe_n\": 8, \"values\": [0.9684446854862896, 0.9678201381864405, 0.9678201381864405, 0.96715697634193, 0.96715697634193, 0.9678201381864405, 0.9678201381864405, 0.9684446854862896]}, \"core\": [true, true, true, true, true, true, true, true], \"coverage\": 1.0, \"dbcv_global\": 0.96839039132585, \"dbcv_status\": \"OK\", \"eps\": 0.08, \"external_all_common\": {\"agreements\": 28, \"ari\": 1.0, \"common_ids\": [\"A\", \"B\", \"C\", \"D\", \"E\", \"F\", \"G\", \"H\"], \"compared_ids\": [\"A\", \"B\", \"C\", \"D\", \"E\", \"F\", \"G\", \"H\"], \"coverage\": 1.0, \"first_available\": 8, \"n\": 8, \"pairs\": 28, \"policy\": \"noise_as_group\", \"ri\": 1.0, \"same_both\": 12, \"same_first\": 12, \"same_second\": 12, \"second_available\": 8, \"status\": \"OK\", \"universe_n\": 8}, \"external_assigned_common\": {\"agreements\": 28, \"ari\": 1.0, \"common_ids\": [\"A\", \"B\", \"C\", \"D\", \"E\", \"F\", \"G\", \"H\"], \"compared_ids\": [\"A\", \"B\", \"C\", \"D\", \"E\", \"F\", \"G\", \"H\"], \"coverage\": 1.0, \"first_available\": 8, \"n\": 8, \"pairs\": 28, \"policy\": \"assigned_common\", \"ri\": 1.0, \"same_both\": 12, \"same_first\": 12, \"same_second\": 12, \"second_available\": 8, \"status\": \"OK\", \"universe_n\": 8}, \"features\": [\"sensor_x\", \"sensor_y\"], \"ids\": [\"A\", \"B\", \"C\", \"D\", \"E\", \"F\", \"G\", \"H\"], \"labels\": [0, 0, 0, 0, 1, 1, 1, 1], \"mean\": [2.6, 2.6], \"metric\": \"standardized Euclidean\", \"minimum_including_self\": 3, \"scale\": [2.5019992006393603, 2.5019992006393603]}\nheld-out frozen queries [{'status': 'one_component', 'components': (0,), 'eligible_core_ids': ('A', 'B', 'C', 'D')}, {'status': 'none', 'components': (), 'eligible_core_ids': ()}, {'status': 'none', 'components': (), 'eligible_core_ids': ()}]"}</CodeBlock>

<Prose>{""}<code>{"load_feature_csv"}</code>{" declares an ID column, ordered feature columns and optional external annotation column. It keeps annotation and ID fields out of features, preserves stable string IDs and delegates finite/duplicate validation to "}<code>{"Universe"}</code>{". The default main uses the new eight-row construction. Passing "}<code>{"--csv"}</code>{" is an explicit new analysis on that file; it does not recover the previously recorded Iris run or inherit its parameter units. No CSV branch was executed to create the displayed stream."}</Prose>

<Prose>{""}<code>{"develop_run"}</code>{" fits one scratch standardizer from its development population, transforms that table once, calculates the declared radius candidates, and records coverage, group count and the next assigned-common comparison. A candidate must meet the stated support and agreement criteria. If none does, it returns a clear protocol failure rather than quietly choose a flattering score. This protocol uses local parameter persistence; it is not a bootstrap stability estimate, and it does not compare ID-mismatched resamples."}</Prose>

<Prose>{""}<code>{"frozen_report"}</code>{" uses standardized features for its assigned-only silhouette, strict DBCV status/value and optional external comparisons. It returns the complete ID universe and parameter/geometry state alongside the metrics. "}<code>{"ordinary_pipeline"}</code>{" constructs and fits the complete ordinary route, then compares geometry and core row sets. "}<code>{"query_run"}</code>{" transforms held-out rows with the frozen state and calls the explicit custom core query. Immutable tuples and frozen records preserve the reference; report dictionaries are new descriptive outputs, not mutable fitted state."}</Prose>

<Prose>{"The stream is the once-executed default construction, including the real ordinary pipeline fit and the actual new helper calculations. The optional CSV and contrib validity routes retain separate unexecuted contracts. This example gives a portable procedure to modify; the measured Iris rows and seven saved fit records remain a separately attributed source, not fabricated new runs."}</Prose>

<Prose>{"For an actual application, record the observational unit, ordered features, justified metric and transform population before searching parameters. Decide what assigned coverage the task needs and what stability question is meaningful; a time/space split may be more informative than neighbouring radius agreement under drift. Freeze the chosen analysis before external annotations, report unsupported metric statuses honestly, and inspect concrete rows rather than use a single scalar as a verdict. The next practice section changes operands so that these contracts must be transferred rather than copied."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"20. Transfer the mechanism to changed observations and contracts"}</H2>

<Prose>{"The tasks use stable row identities; nominal cluster numbers may permute. In A–L, “Program 3” means the complete "}<code>{"dbscan_iris.py"}</code>{" in §7, and the frozen-reference policy is taught in §19. “Section 8” still names the incompatible-density example. Each hint and solution can be opened separately; the teaching and code above remain visible."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"A. A new five-row trail"}</H3>

<Prose>{"Rows A–E are at 0, 0.25, 0.5, 0.75, 2. With ε = 0.25, m = 3, classify every row and give the clusters. Then raise m to 4."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"List each closed interval’s neighbours, including its center. The first and fourth rows need not be core to join."}</Prose>

</details>

<details>

<summary>Reasoned solution</summary>

<Prose>{"Counts are 2, 3, 3, 2, 1. B and C are core, A and D are border, E noise; one assigned group A–D. At m = 4 none is core, so all five are noise. The loss of the core vertices removes the support for the former borders as well."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"B. Move a shared border off the line"}</H3>

<Prose>{"Use the ten-row trail, but move I to (0, 0.125) while the other rows stay at y = 0. Keep ε = 1, m = 4. Does reversing row order still change I’s assignment?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Compute its distance to D and E before considering order."}</Prose>

</details>

<details>

<summary>Reasoned solution</summary>

<Prose>{"Both distances are √(1 + 0.125²) > 1, so I is adjacent to neither core component and is noise. A–H remain core and form two components; J is still noise. Reversal can rename components but cannot attach I. This is a null case for the border-order effect: order matters only when a noncore row actually has eligible core neighbours in different components."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"C. A tempting graph proof"}</H3>

<Prose>{"A colleague says: “Density connectivity is symmetric, so connectedness through any intermediate row is transitive and every point gets a unique cluster.” Identify the missing condition with the original trail."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Compare D–I, I–E and D–E at ε = 1, m = 4."}</Prose>

</details>

<details>

<summary>Reasoned solution</summary>

<Prose>{"D reaches itself and I; E reaches itself and I. But no core path connects D and E because I cannot transmit. Thus density connectivity through arbitrary rows is not transitive. Restricting to core vertices gives graph components; then handle shared borders separately. Symmetry alone never implies transitivity."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"D. Duplicates and the count convention"}</H3>

<Prose>{"There are three distinct observation rows at x = 2 and one at x = 5. Use ε = 0.125, m = 3. What happens before and after unweighted deduplication? What happens at m = 1 on the original data?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Count row identities, then compare that count with the number of coordinate values."}</Prose>

</details>

<details>

<summary>Reasoned solution</summary>

<Prose>{"The three repeated rows are core and form one component; x = 5 is noise. Unweighted deduplication leaves two rows with only one neighbour each, so both are noise at m = 3. Positive weights 3 and 1 restore the original density rule. At m = 1 all four rows are core: the three duplicates form one component, x = 5 a second, and no row is noise."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"E. A unit conversion with a false fix"}</H3>

<Prose>{"Add a fifth row (3, 0) to the four corners (0,0), (1,0), (0,2), (1,2). Start with ε = 1 and m = 2. A colleague converts only the vertical coordinate from meters to centimeters and multiplies ε by 100. Will all neighbourhood decisions remain the same? Give a sound transformation. What if the fifth row is absent?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The horizontal difference has not grown by 100. Compare the new row’s distance to (1, 0) with the old and new radius."}</Prose>

</details>

<details>

<summary>Reasoned solution</summary>

<Prose>{"No for these five rows. Originally (3, 0) has only itself within radius 1 and is noise; the other rows form two horizontal pairs. After the partial conversion and radius change, its horizontal distance 2 to (1, 0) is below 100, so it becomes core and joins the lower pair. Uniformly scaling both coordinates and ε preserves every comparison. Alternatively, keep ε in meters and weight the squared centimeter coordinate by 1/10,000, restoring its meter contribution. With only the original four corners, the flawed conversion happens to leave the two horizontal pairs unchanged: horizontal distance 1 remains admitted and vertical distance 200 remains excluded. One unchanged finite result does not prove a transformation preserves distances generally. The metric lab reproduces both cases."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"F. Repair the incompatible density fixture"}</H3>

<Prose>{"Keep the dense groups from section 8 but move the right group to 5, 5.25, 5.5, 5.75. With m = 3, find a radius recovering all three groups and give its usable interval before the dense groups join."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The two interior right-group rows become core before its endpoints do. The dense-group gap remains 0.375."}</Prose>

</details>

<details>

<summary>Reasoned solution</summary>

<Prose>{"At ε = 0.25, the right interior rows have three neighbours and its endpoints attach as border. The first two groups remain separate until ε reaches 0.375. Thus every ε in [0.25, 0.375) recovers the three groups. At the upper endpoint the closed-boundary core link merges the dense groups. This changed-data repair differs from simply reducing m until every stray pair qualifies. Set spacing 0.25 in the interval lab to see it."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"G. A perfect score on the survivors"}</H3>

<Prose>{"For standardized Iris at ε = 0.5, compare m = 5 with m = 10. Your task is to inspect density groups across the whole collection. Is an assigned-row ARI of 1 sufficient reason to prefer m = 10?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Keep the original 150-row denominator. Inspect how many flowers each score evaluated."}</Prose>

</details>

<details>

<summary>Reasoned solution</summary>

<Prose>{"m = 5 gives 116 assigned, 34 noise, 2 clusters, assigned-row ARI ≈ 0.631 and all-row ARI ≈ 0.442. m = 10 gives 61 assigned, 89 noise, 3 clusters, assigned-row ARI 1.000 but all-row ARI ≈ 0.279. The perfect result describes only 40.7% of the collection. It can be useful if the stated task deliberately seeks a small unambiguous subset, but it does not establish coverage of the whole collection. Publish both populations and evaluate both settings on their common retained IDs if comparing conditional agreement; the Iris lab’s snapshot comparison reports, on the 61 rows both settings retain, species agreement of about 0.848 for m = 5 and 1.000 for m = 10."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"H. Read an OPTICS cluster start"}</H3>

<Prose>{"At cut ε = 0.6, an ordered row has reachability 0.9 and core distance 0.4. The next row has reachability 0.5. Explain their extraction roles. What if the first core distance were 0.8?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"A high reachability value can indicate a start, not just noise."}</Prose>

</details>

<details>

<summary>Reasoned solution</summary>

<Prose>{"The first row starts a new cluster: it is not reached at 0.6 from the preceding expansion, but it is core at 0.6 itself. The next row can join the current cluster through its 0.5 reachability. If the first core distance is 0.8, it cannot start a cluster at 0.6; it is noise at this step. Assigning the next row then depends on whether a valid current cluster has been established earlier; do not infer the whole extraction from two isolated numbers without ordering state."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"I. Choose a branch without double-counting"}</H3>

<Prose>{"An eight-row parent is born at λ = 2; all rows leave for two four-row children at λ = 5. Both children persist until λ = 7. Compare selecting the parent with selecting both children. Then change only their exit level to 9."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Each stability uses its own birth level. Compare sums of disjoint selections."}</Prose>

</details>

<details>

<summary>Reasoned solution</summary>

<Prose>{"Parent stability 8(5 − 2) = 24. At exit 7 the children contribute 4(7 − 5) + 4(7 − 5) = 16, so the parent wins. At exit 9 they contribute 32, so the children win. Selecting the parent and both children is inadmissible because their rows overlap. This is a declared condensed-tree exercise; no data fit or claim of a globally correct scientific partition is hidden in its arithmetic."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"J. Why an index cannot erase a dense output"}</H3>

<Prose>{"For 100,000 rows, ε is large enough that every row is a neighbour of every other. Estimate the number of stored directed neighbourhood entries and explain why “tree queries are logarithmic” does not solve the memory problem."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Multiply the number of queries by the number of results per query."}</Prose>

</details>

<details>

<summary>Reasoned solution</summary>

<Prose>{"There are 10¹⁰ entries, including self. Just eight-byte indices require 80 billion bytes, before arrays, distances and interpreter overhead. A search index can reduce the work of finding sparse neighbourhoods; it cannot return 10¹⁰ explicit entries in logarithmic total time. Consider an implementation that avoids retaining all neighbourhoods, a different task or scale, or valid data reduction. Changing ε only to make a benchmark fast changes the clustering question."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"K. Independent Iris report"}</H3>

<Prose>{"Reproduce Program 3, then change the representation to the four original centimeter features and use ε = 0.5, m = 5. Freeze this choice before revealing species. Write a five-sentence report: data unit and representation, parameter rule, assigned and noise counts, conditional versus all-row comparison, and the next observation you would inspect. Add one radius of your own; justify it from its neighbour-distance plot rather than species."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Remove the scaler, keep the same row IDs and feature order, and calculate coverage before interpreting a score. The same numerical radius now has different units."}</Prose>

</details>

<details>

<summary>Reasoned solution</summary>

<Prose>{"For the fixed changed setting, the executed fit gives 2 clusters of 49 and 84 rows, 17 noise, coverage 133/150 ≈ 0.887, assigned-row silhouette ≈ 0.735, all-row ARI ≈ 0.521 and assigned-row ARI ≈ 0.607; the Iris lab reproduces these when you switch to raw features. An acceptable report says: “I clustered 150 measured flowers in four-dimensional centimeter space. At ε = 0.5 cm and m = 5, two groups retain 133 flowers and 17 are unassigned. The assigned-only geometry is fairly separated in this representation. Species agreement is a separate retrospective comparison, with 17 rows omitted from the conditional score. I would inspect those 17 rows and their core neighbourhoods before choosing whether the grouping serves the question.” Your additional radius may produce several defensible conclusions; success requires correct denominators, explicit settings and evidence, not matching a preferred cluster count."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"L. A frozen reference versus refitting"}</H3>

<Prose>{"A new row is within ε of training core rows from both trail components. Specify the result under the “return ambiguous when components disagree” policy from section 19. Is that necessarily the result of refitting DBSCAN with the new row?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Does the new row contribute to old neighbour counts under both procedures?"}</Prose>

</details>

<details>

<summary>Reasoned solution</summary>

<Prose>{"The frozen-reference policy returns ambiguity. Refitting includes the new observation in neighbourhood counts; it can make a formerly noncore row core and merge components, or leave a shared-border assignment depending on its position and count. The two procedures answer different questions. Record which one your future-observation evaluation uses."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"M1. Correct an endpoint before testing the larger minimum size"}</H3>

<Prose>{"Use A(−1,0),B(0,0),C(9,0),D(9,1),E(10,0),F(10,1),G(11,0),H(11,1),I(0,9.5). Keep the recorded identity processing order, core radii "}<code>{"[1,1,1,1,1,1,1,1,9.5]"}</code>{", reachabilities "}<code>{"[∞,1,9,1,1,1,1,1,9.5]"}</code>{" and predecessor input IDs "}<code>{"[-1,0,1,2,2,3,4,5,1]"}</code>{". Density minimum remains 2, ξ=.2, predecessor correction is enabled, but extraction minimum size changes from 3 to7. Trace candidate "}<code>{"[2,8]"}</code>{", give the accepted hierarchy and input-indexed flat labels, and say which graph quantities changed."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"I's predecessor is B at plot position 1. Correct the candidate before counting its inclusive size. The final infinity is a boundary, not a tenth row."}</Prose>

</details>

<details>

<summary>Reasoned solution</summary>

<Prose>{"The starting height 9 is not greater than endpoint 9.5, so the height shortcut cannot keep I. Predecessor 1 is outside "}<code>{"[2,8]"}</code>{"; trim end 8→7. Then 9>1 allows corrected "}<code>{"[2,7]"}</code>{", but its inclusive size is6, below 7, so reject it. Whole "}<code>{"[0,8]"}</code>{" has nine observations and survives. The hierarchy is exactly "}<code>{"[[0,8]]"}</code>{"; the child-before-parent flat extraction assigns all nine rows 0. The graph's coordinates, minimum 2 cores, order, reachabilities and predecessors remain unchanged: only extraction size changed."}</Prose>

<Prose>{"Keeping uncorrected "}<code>{"[2,8]"}</code>{" because it contains seven rows skips the required predecessor operation. Adding the sentinel as another member invents an observation. Success requires the exact trim, "}<code>{"6<7"}</code>{", whole interval, nine zero labels and unchanged graph. This flat result is not proof of a semantic class."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"M2. Combine the changed ceiling with the changed size"}</H3>

<Prose>{"Use the fixed eleven-row graph from §11: input locations "}<code>{"[0,21,33,10,50,20,11,34,32,22,12]"}</code>{", order "}<code>{"[0,3,6,10,5,1,9,8,2,7,4]"}</code>{", ordered reachabilities "}<code>{"[∞,10,1,1,8,1,1,10,1,1,16]"}</code>{" and ordered predecessor IDs "}<code>{"[-1,0,3,6,10,5,1,9,8,2,7]"}</code>{". Keep density minimum 2 and corrected predecessors. Set ξ=.8 and extraction minimum size 4 together. Give the accepted intervals, flat labels in both orders, and the reason the enclosing "}<code>{"[0,6]"}</code>{" is rejected."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The old maximum in between is8, while the changed ceiling is10×.2. The two short intervals each have inclusive size 3."}</Prose>

</details>

<details>

<summary>Reasoned solution</summary>

<Prose>{""}<code>{"[1,3]"}</code>{" and "}<code>{"[4,6]"}</code>{" each have length 3, so they fail size 4. "}<code>{"[0,6]"}</code>{" fails the maximum-in-between ceiling because 2<8; it is not removed merely by the size change. "}<code>{"[7,10]"}</code>{" has length 4 and the endpoint's predecessor lies inside. Whole "}<code>{"[0,10]"}</code>{" survives. Hierarchy is "}<code>{"[[7,10],[0,10]]"}</code>{". Flat extraction first assigns plot positions 7–10 to group 0, then skips the overlapping whole span. Ordered labels are "}<code>{"[-1,-1,-1,-1,-1,-1,-1,0,0,0,0]"}</code>{". Mapping through the unchanged permutation gives input labels "}<code>{"[-1,-1,0,-1,0,-1,-1,0,0,-1,-1]"}</code>{", assigning IDs 8,2,7,4."}</Prose>

<Prose>{"Selecting whole "}<code>{"[0,10]"}</code>{" first would overwrite the child-first rule. Claiming that the size edit alone removed "}<code>{"[0,6]"}</code>{" misses the changed relative ceiling. Success includes both distinct rejections, the unchanged graph and the explicit permutation. No new graph fit is required."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"N. Change a tree edge and the condensation minimum together"}</H3>

<Prose>{"Start with the supplied true-split tree A–B=B–C=1/2, C–D=1, D–E=1/3, E–F=F–G=1/6. Change only B–C to 1/4 and condensation minimum from 3 to2. Root birth is0 and excluded. Compute branch births, row exits, stability areas and EOM selection. Does the surviving BC fragment become a new branch at λ=2?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"At λ=1, ABC and DEFG qualify. At λ=2, ABC loses one singleton and keeps its sole qualifying child. Minimum 2 does not make a singleton qualify."}</Prose>

</details>

<details>

<summary>Reasoned solution</summary>

<Prose>{"The root loses all seven rows to two eligible children at1, so its area 7 is visible but excluded. ABC is born 1. A departs 2; BC, size 2, continues the "}<strong>{"same ABC identity"}</strong>{" until both rows depart 4. Its area is "}<code>{"1(2−1)+2(4−1)=7"}</code>{", equivalently width 3 over 1–2 plus width 2 over 2–4. There is no separate BC branch born 2. DEFG is born 1, loses D at3 and retains EFG until 6, area "}<code>{"1(3−1)+3(6−1)=17"}</code>{". EOM selects ABC and DEFG, total 24. Their row sets do not overlap."}</Prose>

<Prose>{"At the old minimum 3, changed BC size 2 would fail: all ABC members depart 2, giving area 3, and the total would remain 20. Thus the two edits have distinct consequences. Resetting BC's birth would incorrectly reduce ABC's persistence, while creating a child for the singleton would violate minimum 2. Success gives the same-identity shrink, exact point exits, areas 7/17, excluded root 7 and total 24 without claiming a Euclidean fit of this supplied tree."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"O. Keep the internal separator and the original denominator"}</H3>

<Prose>{"Keep left A(0,0),B(1,0),C(3,1),D(6,1), but translate the right group to E(3,4),F(5,4),G(8,6),H(12,6). J(8,8) remains noise. The within-group all-points cores and chosen MSTs are unchanged from §17. Calculate the four eligible cross-internal raw squared lengths, the controlling separator, both signed scores and global DBCV. Then explicitly remove J from the reporting universe without changing the assigned geometry: what changes?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Eligible internal rows are B,C and F,G. E is a leaf. Compare the winning raw length with both endpoint cores, and retain 4/9 weights before changing the universe."}</Prose>

</details>

<details>

<summary>Reasoned solution</summary>

<Prose>{"The squared lengths B–F,B–G,C–F,C–G are 32,85,13,50. C–F wins at√13. Its squared length 13 exceeds core squares 270/37 and 8268/953, so the raw ruler controls the mutual maximum. The left DSC is√(270/37), right DSC√(18096/1049). The left score is "}<code>{"(√13−√(270/37))/√13"}</code>{", positive. The right score is "}<code>{"(√13−√(18096/1049))/√(18096/1049)"}</code>{", negative. Global DBCV is4/9 times their sum, approximately.052834; its positive aggregate does not erase the negative right group."}</Prose>

<Prose>{"With J explicitly removed, both groups now have 4/8 weight and coverage 8/8 in that new universe. The conditional value is one half of the same two scores, approximately.059438. Relative to the original nine observations, retention is still 8/9. No internal edge, core or separation changed. Calling the larger number an improved partition would conflate geometry with population. Choosing E as a closer cross point would violate the internal-vertex rule. Success identifies C–F, both signs, both denominators and the original retention."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"P. Transfer the closed disk rule to changed two-dimensional distances"}</H3>

<Prose>{"Use P(0,0),Q(.75,0),R(0,1),S(−.75,−.5),T(1.25,.75), but change ε from 1 to.91, with minimum 3. List each closed roster, classify every row and give the assigned group. Then raise minimum to 4 while keeping these coordinates and ε unchanged."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"P–S and Q–T each have length√(.75²+.5²), below.91 but above.9. P–R has length 1. Keep row identities rather than just coordinate counts."}</Prose>

</details>

<details>

<summary>Reasoned solution</summary>

<Prose>{"The rosters are P:{P,Q,S}, Q:{P,Q,T}, R:{R}, S:{P,S}, T:{Q,T}. Counts are 3,3,1,2,2. P and Q are core and linked; S and T are border attached to those cores; R is noise. The assigned group is {P,Q,S,T}. At minimum 4 no row is core and all five become noise. S and T cannot keep a group alive merely by their earlier border status. Testing only horizontal distance would incorrectly include R or other pairs; using the old radius 1 would keep an outdated roster. Success includes the two diagonal distances, unchanged coordinates and disappearance of all border support at4."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"Q. A smaller key need not move upward"}</H3>

<Prose>{"Use supplied heap slots "}<code>{"[R,S,Q,T]"}</code>{" and keys "}<code>{"[1,1.5,2,3]"}</code>{", with Q predecessorA. Source U proposes 1.2 for Q, then source V proposes.9. Finally U proposes.9 again. Give committed slots and Q predecessor after each proposal, then extract the minimum and repair the heap. Assume input-position tie policy and strict improvements, as in §9. These are supplied priority states, not a fitted geometry."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Q's parent is R, key 1. Compare the changed key with that parent before swapping. Equality is not a strict improvement."}</Prose>

</details>

<details>

<summary>Reasoned solution</summary>

<Prose>{"The first proposal improves 2→1.2 and changes Q predecessor toU, but R1 remains smaller. Q stays in slot 2 and committed slots remain "}<code>{"[R,S,Q,T]"}</code>{"; inverse positions are R0,S1,Q2,T3. The second proposal improves 1.2→.9, changes predecessor toV and swaps Q with R, giving "}<code>{"[Q,S,R,T]"}</code>{", inverseQ 0,S1,R2,T3. The equal.9 proposal changes nothing, including predecessorV. Extract Q, mark its inverse position absent, move T to root, then repair with the smaller child R1. Committed slots become "}<code>{"[R,S,T]"}</code>{", with R0,S1,T2; S/T keys remain 1.5/3."}</Prose>

<Prose>{"A key decrease is not itself proof of a swap: the parent comparison is decisive. Updating predecessor on the equal proposal would change the stated tie contract. Keeping an old Q tuple here would turn an indexed heap into the separately taught lazy-entry design. Success preserves unique slots, inverse correspondence and the committed heap invariant after every operation."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning" data-lesson-resource-list=""><H3>{"Further learning: another route through the ideas"}</H3>

<ul><li>{""}<a href={"https://www.cs.rpi.edu/~zaki/DMML/slides/pdf/ychap15.pdf"}>{"Zaki's chapter 15 density-clustering slides"}</a>{" give a compact canonical view of neighbourhoods, density and clustering. Use them after §§1–8 to compare pictures and vocabulary. Follow the precise visited/queue guards taught here rather than copying abbreviated expansion pseudocode. This is the full slide treatment, not the entire textbook chapter."}</li><li>{""}<a href={"https://www.jstatsoft.org/article/view/v091i01"}>{"Hahsler, Piekenbrock and Doran, “dbscan: Fast Density-Based Clustering with R”"}</a>{" is a free 30-page specialist treatment covering DBSCAN, OPTICS, hierarchy, neighbour search and applications. It is useful even for Python readers. Its strict-radius notation, R prediction behavior and package count conventions must be distinguished from this lesson's closed/self-inclusive rules; historical performance tables are not current benchmarks. R examples are an external route, not a locally executed R stream here."}</li><li>{""}<a href={"https://ubc-cs.github.io/cpsc330-2023W1/lectures/15_DBSCAN-hierarchical.html"}>{"The UBC CPSC 330 lecture companion"}</a>{", with "}<a href={"https://youtu.be/T4NLsrUaRtg"}>{"Varada Kolhatkar's lecture video"}</a>{", offers a beginner revisit of neighbourhood growth and parameter changes. The video was not watched for this lesson. Use the explicit border/noise and new-query contracts here when the companion uses plotting shorthand."}</li><li>{""}<a href={"https://hdbscan.readthedocs.io/en/latest/how_hdbscan_works.html"}>{"How HDBSCAN works"}</a>{" explains mutual reachability, MSTs, condensation and persistence in the contrib implementation. Read it after §§12–16 and check its neighbour-count convention. Use the lesson's declared numeric examples to trace each operation before comparing the package's presentation."}</li></ul></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references" data-lesson-resource-list=""><H3>{"Technical references: definitions, corrections and software contracts"}</H3>

<ul><li>{""}<a href={"https://file.biolab.si/papers/1996-DBSCAN-KDD.pdf"}>{"Ester, Kriegel, Sander and Xu, original DBSCAN paper (1996)"}</a>{": the model, directed density reachability, core expansion and border ambiguity. Its spatial-database experiments concern their historical settings."}</li><li>{""}<a href={"https://sigmodrecord.org/publications/sigmodRecord/9906/OPTICS_%20ordering%20points%20to%20identify%20the%20clustering%20structure.pdf"}>{"Ankerst, Breunig, Kriegel and Sander, original OPTICS paper (1999)"}</a>{": directional proposals, priority ordering, reachability plots and ξ extraction. Use it together with the corrections, rather than adopt the known printed inequality errors."}</li><li>{""}<a href={"https://ceur-ws.org/Vol-2191/paper37.pdf"}>{"Schubert and Gertz, “Improving the Cluster Structure Extracted from OPTICS Plots” (2018)"}</a>{": corrected endpoint/predecessor reasoning and why an apparent valley can include a point reached from outside. Use it after §11 to compare the endpoint and predecessor tests with the worked geometric inputs."}</li><li>{""}<a href={"https://www.khoury.northeastern.edu/home/vip/teach/DMcourse/2_cluster_EM_mixt/notes_slides/DBScan/revisitofrevisitDBSCAN.pdf"}>{"Schubert et al., “DBSCAN Revisited, Revisited” (2017)"}</a>{": distinguishes clustering model, range-query implementation, parameter diagnostics and real output costs. Read it for the conditions behind efficiency statements, not as a promise of logarithmic queries on every dataset."}</li><li>{""}<a href={"https://www.imada.sdu.dk/~zimek/publications/SDM2014/DBCV.pdf"}>{"Moulavi et al., Density-Based Clustering Validation (2014)"}</a>{", with "}<a href={"https://pajaskowiak.github.io/assets/pdf/DBCV_Supplementary.pdf"}>{"the author supplement"}</a>{": all-points cores, internal MST anatomy, signed group validity and original-n noise weighting. Read it after §§17–18 to compare the core definition, eligible vertices and reporting population. The main paper's experimental figures are outside this lesson's finite geometric treatment. The finite geometric derivation here does not imply every reported experimental result or a package-independent degenerate score."}</li><li>{""}<a href={"https://researchonline.jcu.edu.au/46784/"}>{"Campello, Moulavi and Sander's 2013 HDBSCAN record"}</a>{" and "}<a href={"https://researchonline.jcu.edu.au/47065/"}>{"the 2015 hierarchical density estimates record"}</a>{" identify the original method treatments. Full bodies were not accessible in the retained research. The lesson's finite hierarchy/selection/strength mechanisms rely on the read standard treatment and exact official implementation; it does not claim the original density-consistency proofs, full posterior derivations or original benchmark panels were read or reproduced."}</li><li>{""}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.cluster.DBSCAN.html"}>{"sklearn DBSCAN"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.cluster.OPTICS.html"}>{"OPTICS"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.cluster.cluster_optics_dbscan.html"}>{"radius extraction"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.cluster.cluster_optics_xi.html"}>{"ξ extraction"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.cluster.HDBSCAN.html"}>{"HDBSCAN"}</a>{" and "}<a href={"https://scikit-learn.org/stable/modules/clustering.html#dbscan"}>{"the clustering guide"}</a>{" define the ordinary API contracts inspected at version 1.9.1. Recheck the installed version when reproducing a version-dependent branch."}</li><li>{""}<a href={"https://github.com/scikit-learn-contrib/hdbscan/blob/bb01526bf18c92e35ca0b4f5307c6d4248ddf5dc/hdbscan/validity.py"}>{"The inspected contrib validity source"}</a>{" and "}<a href={"https://github.com/pajaskowiak/dbcv/tree/a58ab578ffde4cfd3011a8b00bf458954117bf4e"}>{"original MATLAB prototype"}</a>{" explain the explicitly different DBCV conventions. A source commit and package-version label are distinct identities; neither establishes every installed wheel's exact compiled bytes."}</li><li>{""}<a href={"https://hdbscan.readthedocs.io/en/latest/soft_clustering_explanation.html"}>{"Contrib soft-membership explanation"}</a>{" is an optional continuation after scalar strengths. It separates conditional membership among clusters and attachment to any cluster. Full soft-vector code and a Bayesian/calibration justification are not claimed here. Branch detection/FLASC, DENCLUE and a complete mean-shift implementation need separate researched contracts rather than names appended to the present outcome list. "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.cluster.MeanShift.html"}>{"sklearn MeanShift"}</a>{" offers a further-learning comparison: moving candidates toward local peaks asks a different question from connecting qualifying observations."}</li></ul></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources"><H3>{"Data, complete files and reproducible roles"}</H3>

<Prose>{"The measured dataset is "}<a href={"https://archive.ics.uci.edu/dataset/53/iris"}>{"Fisher's Iris, UCI record 53"}</a>{", DOI "}<a href={"https://doi.org/10.24432/C56C76"}>{"10.24432/C56C76"}</a>{", under "}<a href={"https://creativecommons.org/licenses/by/4.0/"}>{"CC BY 4.0"}</a>{". The supplied offline "}<a href={"/learn-code/dbscan-density-based-clustering/programs/iris.csv"}>{"iris.csv"}</a>{" preserves all 150 IDs, four centimeter features and species codes from the corrected sklearn 1.9.1 copy. Historical row 34 is4.9/3.1/1.5/.2 and row 37 is4.9/3.6/1.4/.1. "}<a href={"/learn-code/dbscan-density-based-clustering/programs/iris-source.md"}>{"Data attribution"}</a>{" describes the exact copy; "}<a href={"/learn-code/dbscan-density-based-clustering/programs/recorded_iris_fits.json"}>{"recorded fit data"}</a>{" preserves the seven original/supplementary reported fits. Species stays outside feature geometry."}</Prose>

<Prose>{"The synthetic trail, corners, rings, supplied graphs/trees and translated clouds have declared operands. They are teaching constructions, not fabricated real measurements or hardware benchmarks. Original code/expected pairs are preserved as original evidence. New program outputs identify their actual executed source versions and environment in "}<a href={"/learn-code/dbscan-density-based-clustering/SETUP.md"}>{"setup and output notes"}</a>{"; optional source-only routes carry no invented stdout. The setup distinguishes recorded executions from optional routes that were not executed."}</Prose>

<Prose>{"Use one directory for these sibling imports:"}</Prose>

<NeuralTable caption={"Data, complete files and reproducible roles"} headers={[<>{"Computational route"}</>,<>{"Complete file"}</>]} rows={[[<>{"Closed/ranked Euclidean and Haversine neighbourhoods"}</>,<>{""}<a href={"/learn-code/dbscan-density-based-clustering/programs/density_neighbourhoods.py"}>{"density_neighbourhoods.py"}</a>{""}</>],[<>{"Query-on-demand DBSCAN"}</>,<>{""}<a href={"/learn-code/dbscan-density-based-clustering/programs/dbscan_on_demand.py"}>{"dbscan_on_demand.py"}</a>{""}</>],[<>{"Copied geometry and fitted transforms"}</>,<>{""}<a href={"/learn-code/dbscan-density-based-clustering/programs/density_geometry.py"}>{"density_geometry.py"}</a>{""}</>],[<>{"Offline actual rows and saved fit interpretation"}</>,<>{""}<a href={"/learn-code/dbscan-density-based-clustering/programs/iris_density_analysis.py"}>{"iris_density_analysis.py"}</a>{""}</>],[<>{"Indexed heap OPTICS"}</>,<>{""}<a href={"/learn-code/dbscan-density-based-clustering/programs/optics_ordering.py"}>{"optics_ordering.py"}</a>{""}</>],[<>{"Supported fixed-radius extraction"}</>,<>{""}<a href={"/learn-code/dbscan-density-based-clustering/programs/optics_radius_extraction.py"}>{"optics_radius_extraction.py"}</a>{""}</>],[<>{"Full corrected ξ extraction"}</>,<>{""}<a href={"/learn-code/dbscan-density-based-clustering/programs/optics_xi_extraction.py"}>{"optics_xi_extraction.py"}</a>{""}</>],[<>{"Mutual reachability and maintained Prim"}</>,<>{""}<a href={"/learn-code/dbscan-density-based-clustering/programs/mutual_reachability_tree.py"}>{"mutual_reachability_tree.py"}</a>{""}</>],[<>{"Equal-event hierarchy, condensation, EOM, strengths"}</>,<>{""}<a href={"/learn-code/dbscan-density-based-clustering/programs/density_hierarchy.py"}>{"density_hierarchy.py"}</a>{""}</>],[<>{"Full strict DBCV and named convention adapters"}</>,<>{""}<a href={"/learn-code/dbscan-density-based-clustering/programs/density_validity.py"}>{"density_validity.py"}</a>{""}</>],[<>{"Weights, sparse graph, halos and frozen query"}</>,<>{""}<a href={"/learn-code/dbscan-density-based-clustering/programs/density_query_extensions.py"}>{"density_query_extensions.py"}</a>{""}</>],[<>{"Complete development/frozen-report pipeline"}</>,<>{""}<a href={"/learn-code/dbscan-density-based-clustering/programs/density_analysis_template.py"}>{"density_analysis_template.py"}</a>{""}</>],[<>{"General aligned-ID/noise metrics"}</>,<>{""}<a href={"/learn-code/dbscan-density-based-clustering/programs/density_metrics.py"}>{"density_metrics.py"}</a>{""}</>],[<>{"Exact prerequisite helpers"}</>,<>{""}<a href={"/learn-code/dbscan-density-based-clustering/programs/disjoint_set.py"}>{"disjoint_set.py"}</a>{", "}<a href={"/learn-code/dbscan-density-based-clustering/programs/silhouette_chunked.py"}>{"silhouette_chunked.py"}</a>{""}</>],[<>{"Original complete source/expected pairs"}</>,<>{""}<a href={"/learn-code/dbscan-density-based-clustering/original-programs/dbscan_trail.py"}>{"trail"}</a>{", "}<a href={"/learn-code/dbscan-density-based-clustering/original-programs/dbscan_core_radius.py"}>{"rank"}</a>{", "}<a href={"/learn-code/dbscan-density-based-clustering/original-programs/dbscan_geographic.py"}>{"geographic"}</a>{", "}<a href={"/learn-code/dbscan-density-based-clustering/original-programs/dbscan_iris.py"}>{"Iris"}</a>{", "}<a href={"/learn-code/dbscan-density-based-clustering/original-programs/dbscan_rings.py"}>{"rings"}</a>{", "}<a href={"/learn-code/dbscan-density-based-clustering/original-programs/dbscan_optics.py"}>{"OPTICS"}</a>{", "}<a href={"/learn-code/dbscan-density-based-clustering/original-programs/dbscan_mst.py"}>{"MST"}</a>{", "}<a href={"/learn-code/dbscan-density-based-clustering/original-programs/dbscan_hdbscan.py"}>{"HDBSCAN"}</a>{", "}<a href={"/learn-code/dbscan-density-based-clustering/original-programs/dbscan_duplicates.py"}>{"duplicates"}</a>{""}</>]]} />

<Prose>{"Copy or download a complete file and keep its sibling imports beside it. The visible code is the full program; the file index also supplies its dependencies and attributed recorded output. Practice hints and solutions open independently."}</Prose></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H3>{"Carry the distinction into the next lesson"}</H3>

<Prose>{"You can now draw a closed neighbourhood, identify core/border/noise roles, trace a valid expansion, choose and implement the declared geometry, inspect a measured-data report with coverage, and diagnose the no-common-radius case. A deeper return can reconstruct OPTICS's indexed ordering and corrected valleys, mutual-reachability threshold trees, same-identity condensation, persistence selection and full fixed-partition density validity. The engineering route carries stable IDs and fitted state through weighted/sparse/distributed/frozen-reference operations, with unsupported cases stated explicitly."}</Prose>

<Prose>{"The next module topic is "}<a href={"/learn/topic/anomaly-outlier-detection-isolation-forest-one-class-svm-lof"}>{"Anomaly & Outlier Detection"}</a>{". It separates a reference population, unusualness score and decision threshold. A row's density noise status or clustering attachment strength alone cannot choose an alert threshold, estimate an error cost or establish a domain anomaly. That question follows naturally from the fixed-reference and refit distinction just taught."}</Prose></section></div>;}
export default {title:'DBSCAN & Density-Based Clustering',readTime:'Self-paced · reading, code and practice',content:Content};
