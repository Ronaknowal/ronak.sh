import { Callout, Code, H2, H3, Prose } from '../../components/content';
import { MathBlock } from '../../components/content/Math.jsx';
import { Checkpoint, LessonIntro, LessonTable, Sources } from '../../components/lesson-labs/LessonElements';
import { RunnableExample } from '../../components/lesson-labs/RunnableExample';
import { PointCoordinatesFigure, MetricAssumptionsFigure, SegmentMidpointFigure, SlopeChangesFigure, TriangleAreaFigure, ParallelAngleSumFigure, PythagorasDissectionFigure, SignedDistanceFigure, DirectedTurnsFigure, RadianScalingFigure, SectorChordFigure, DiskSectorLimitFigure, SpecialAngleConstructionsFigure, ComplementRolesFigure, RampGradeFigure, SignedCircleQuadrantsFigure, ReflectionPeriodFigure, PeriodicSignalFigure, InverseBranchesFigure, AllTrigSolutionsFigure, BearingSignsFigure, CosineLawConstructionFigure, SineLawAreaFigure, SsaDefaultFigure, ActiveBasisRotationFigure, PassiveFrameFigure, PivotTranslationFigure, OriginDisplacementFigure, RotationCompositionFigure, AffineOrderFigure, ScreenCoordinateFigure, TwoLinkFigure } from '../../components/lesson-labs/GeometryTrigonometryFigures.jsx';
import { AngleArcLab, TriangleSimilarityLab, CircleComponentsLab, BearingLab, SsaIntersectionLab, CoordinateFrameLab, OriginDisplacementLab, TwoLinkLab } from '../../components/lesson-labs/GeometryTrigonometryLabs.jsx';
import '../../components/lesson-labs/lesson-flow.css';
import { geometryTrigonometryExamples } from '../geometry-trigonometry-examples.js';
import { symbolicGeometryExample } from '../geometry-trigonometry-library-example.js';
function Example({
  id,
  children
}) {
  const example = geometryTrigonometryExamples.find(item => item.id === id);
  return <><Prose><strong>Before running:</strong> {example.question}</Prose><RunnableExample example={{ ...example, file: `geometry_${id}.py` }}>{children}</RunnableExample></>;
}
function Practice({
  title,
  question,
  hint,
  children
}) {
  return <section className="lesson-check"><H3>{title}</H3><Prose>{question}</Prose><details><summary>Hint</summary><Prose>{hint}</Prose></details><details><summary>Explained solution</summary>{children}</details></section>;
}
export default {
  title: 'Geometry, Trigonometry & Coordinate Reasoning',
  readTime: '~110 min read + 2 hours practice',
  hasIntegratedGuide: true,
  content: () => <div className="lesson-pilot lesson-flow geometry-lesson">
    <LessonIntro prerequisites="Review Algebra, Functions, Exponentials & Logarithms: signed numbers, fractions, units, square roots, equations, function composition and inverse branches. We introduce the geometry and coordinate pairs here. Vectors, matrices and calculus are not prerequisites. Python is optional." sections={[['1-locate-and-measure', 'Points, lengths & areas'], ['2-derive-the-distance-rule', 'Pythagoras'], ['3-measure-a-turn', 'Angles & radians'], ['4-compare-similar-triangles', 'Triangle ratios'], ['5-follow-a-point-around-a-circle', 'Signed circle components'], ['6-recover-a-direction', 'Inverse branches & bearings'], ['7-solve-triangles-that-are-not-right', 'General triangles'], ['8-move-a-point-or-change-its-description', 'Rotation & frames'], ['9-use-the-geometry-in-a-system', 'Screens & mechanisms'], ['10-practise-with-changed-geometry', 'Independent practice']]}>A floor plan says a sensor is 3 metres east and 4 metres north of a doorway. How far away is it? Which direction should a camera turn? If a robot describes the same sensor using its own rotated axes, has the sensor moved? We will answer those questions with one connected set of ideas: lengths, angles, signed components and coordinate frames.</LessonIntro>

    <H2>1. Locate and measure</H2>
    <Prose>A <strong>point</strong> describes a location. To give it coordinates, choose an <strong>origin</strong> as zero, a positive horizontal direction called x, a positive vertical direction called y, and a unit. </Prose>
    <Prose>This lesson uses a flat <strong>Euclidean plane</strong>, with perpendicular axes and the same physical unit on each. Perpendicular directions meet at a right angle, one quarter of a turn. Parallel lines have the same direction and do not meet in the plane. These assumptions matter: latitude/longitude coordinates on Earth, or a graph with different horizontal and vertical units, do not directly use the distance rule we are about to derive.</Prose>
    <PointCoordinatesFigure />
    <Prose>The ordered pair (4, 6) means go 4 units along x and 6 along y. The order matters. Negative coordinates go in the opposite direction. A point is not intrinsically “(4, 6)”: those numbers depend on the chosen reference.</Prose>
    <MetricAssumptionsFigure />
    <Prose>Subtract positions component by component. From P=(1, 2) to Q=(4, 6), the horizontal change is Δx=4−1=3 and the vertical change is Δy=6−2=4. The symbol Δ means “change.” The pair (3, 4) describes a <strong>displacement</strong>; it includes direction. Its length is a nonnegative <strong>distance</strong>. Reversing the journey gives (−3, −4) and preserves the length.</Prose>
    <H3>Lines, midpoints and area are different questions</H3>
    <Prose>The midpoint is halfway along the segment. Averaging each coordinate locates it.</Prose>
    <SegmentMidpointFigure />
    <Prose>Here the midpoint is ((1+4)/2, (2+6)/2)=(2.5, 4). More generally P+t(Q−P), with t from 0 to 1, visits the straight segment at a chosen fraction t of the journey. This notation means (pₓ+t(qₓ−pₓ), pᵧ+t(qᵧ−pᵧ)); no vector algebra is needed to calculate it. Allowing any real t extends the segment to a line.</Prose>
    <Prose>When Δx is nonzero, the line's <strong>slope</strong> is Δy/Δx. </Prose>
    <SlopeChangesFigure />
    <Prose>Here it is 4/3: for each metre east, height increases by 4/3 metres. A vertical line has Δx=0 and no finite slope; write x=constant instead of dividing by zero. Slope is a ratio of changes, not the line's length or the angle itself.</Prose>
    <Prose>For an area calculation, choose a base and drop a perpendicular from the remaining vertex. Its distance to the base line is the height; it can differ from either sloping side.</Prose>
    <TriangleAreaFigure />
    <Prose><strong>Perimeter</strong> measures a boundary's length; <strong>area</strong> measures how much surface it covers. A rectangle with perpendicular sides a and b contains ab square units. Cutting a rectangle along a diagonal gives two congruent triangles, so each has area ab/2. More generally a triangle has area base×perpendicular height/2: sliding the top corner parallel to the base preserves that height and area. A sloping side is usually not the height.</Prose>
    <Checkpoint prompt="A triangle has base 6 cm, perpendicular height 4 cm and another side 5 cm. Which two measurements determine its area?">
      <Prose>Use the base and perpendicular height: 6×4/2=12 cm². The 5 cm sloping side does not replace the height. Writing 12 cm would describe a length rather than an area.</Prose>
    </Checkpoint>

    <H2>2. Derive the distance rule</H2>
    <Prose>In a right triangle, the sides beside the right angle are its <strong>legs</strong>, a and b. The opposite, longest side is the <strong>hypotenuse</strong>, c. Why should c²=a²+b²? Arrange four copies of the triangle inside a square of side a+b.</Prose>
    <PythagorasDissectionFigure />
    <Prose>Equal side lengths alone do not establish that the central shape is a square. Compare the angle pieces on a straight line before checking its corners.</Prose>
    <ParallelAngleSumFigure />
    <Prose>The uncovered central shape has four equal sides of length c. Each central corner is also a right angle. To see why, recall that a triangle's interior angles total a half-turn: draw a line through its top vertex parallel to its base; the two base angles reappear beside the top angle on a straight line. In a right triangle, the two remaining angles therefore total a right angle. The two adjacent triangle angles at a central corner leave another right angle. This makes the central shape a square, not merely an equal-sided quadrilateral.</Prose>
    <MathBlock>{String.raw`\begin{aligned}(a+b)^2&=4\left(\frac{ab}{2}\right)+c^2\\a^2+2ab+b^2&=2ab+c^2\\c^2&=a^2+b^2.\end{aligned}`}</MathBlock>
    <Prose>This area argument is the <strong>Pythagorean theorem</strong>. For positive lengths take the positive square root: c=√(a²+b²). For the displacement (3, 4), c=√(9+16)=5 m. The 7 m axis-aligned path and the 5 m straight path answer different route questions.</Prose>
    <MathBlock>{String.raw`\begin{aligned}\Delta x&=q_x-p_x,\\\Delta y&=q_y-p_y,\\d(P,Q)&=\sqrt{\Delta x^2+\Delta y^2}.\end{aligned}`}</MathBlock>
    <SignedDistanceFigure />
    <Prose>Negative displacements cause no problem because their squares are positive. If both changes are zero, the points coincide and the distance is zero. The rule requires a right angle between the component directions. For two sides with a different included angle, section 7 will supply the missing correction.</Prose>
    <Prose><strong>Optional Python setup.</strong> Save each complete program below in its own file, such as <Code>geometry_check.py</Code>, and run <Code>python geometry_check.py</Code> with Python 3.12 or later. These programs use only the standard library. They print their checks; no notebook state, package installation or plotting tool is needed. Numerical readouts are rounded unless a fraction or exact identity is explicitly given. The helper functions state finite input bounds suitable for these examples; they are not a general geometry library.</Prose>
    <Example id="distance"><Prose>The exact fractional area calculation checks the dissection without depending on how the diagram is drawn. Change P and Q; compare straight-line distance with the route that follows the coordinate axes.</Prose></Example>

    <H2>3. Measure a turn</H2>
    <Prose>An angle measures a turn from one ray to another. A full turn is 360 <strong>degrees</strong>, written 360°; a straight angle is 180° and a right angle is 90°. For directed angles, we choose positive to mean counterclockwise and measure from the positive x direction. </Prose>
    <DirectedTurnsFigure />
    <Prose>A clockwise quarter-turn is −90°. The sign is a convention to state, not an intrinsic property of the drawing.</Prose>
    <Prose>A second unit comes directly from circles. All circles have the same ratio of circumference to diameter, called π (approximately 3.14159). A circle of radius r has circumference 2πr. If a turn traces an arc of length s on that circle, define its angle in <strong>radians</strong> as θ=s/r. </Prose>
    <RadianScalingFigure />
    <Prose>Using a bigger circle multiplies both s and r by the same factor, preserving the angle. One radian means an arc as long as the radius.</Prose>
    <MathBlock>{String.raw`\begin{aligned}\text{one turn}&=\frac{2\pi r}{r}=2\pi\ \text{rad}\\&=360^\circ,\\\theta_{\rm rad}&=\theta_{\rm deg}\frac{\pi}{180}.\end{aligned}`}</MathBlock>
    <Prose>An arc follows the circle. A chord is the straight segment joining its endpoints. A sector is the region enclosed by that arc and the two radii. The picture uses metres along the boundary and square metres for the region.</Prose>
    <SectorChordFigure />
    <Prose>For 60°, the fraction of a turn is 1/6, so θ=π/3 rad. At radius 2 m, the corresponding arc is s=rθ=2π/3 m. Arc length differs from the straight <strong>chord</strong> between the endpoints. For a single positive sweep θ at most 2π, its sector takes fraction θ/(2π) of the disk's area πr². Therefore its area is r²θ/2. </Prose>
    <DiskSectorLimitFigure />
    <Prose>The disk-area formula can itself be understood by cutting the disk into increasingly narrow sectors and alternating them: their limiting strip has height r and base half the circumference, πr. The exact formula belongs to the limiting geometry, not to a finite coarse drawing.</Prose>
    <Prose>Now change just one input. Radius is 1 to 3 in steps of 1/2; the positive sweep is 15° to 330° in steps of 15°. Keep the angle fixed while doubling radius, then keep radius fixed while changing the sweep. Reset restores radius 2 and sweep 60°. This investigation draws one positive sweep, not an accumulated multi-turn path.</Prose>
    <AngleArcLab />
    <LessonTable caption="Common angles as fractions of a turn" headers={['Turn', 'Degrees', 'Radians']} rows={[['One twelfth', '30°', 'π/6'], ['One eighth', '45°', 'π/4'], ['One sixth', '60°', 'π/3'], ['One quarter', '90°', 'π/2'], ['One half', '180°', 'π'], ['One full turn', '360°', '2π']]} />
    <Callout title="A dimensionless ratio still has a convention">The units of s/r cancel, but the label rad tells you which numerical angle convention is being used. The number 60 is not interchangeable with π/3. Python's sin and cos consume radians. An arc formula with θ in degrees needs the conversion first. Negative or repeated turns need an explicit signed or accumulated-arc interpretation; the simple filled sector above represents one positive sweep.</Callout>
    <Example id="arcs"><Prose>The angle stays π/3 while radius changes from 2 to 6. Arc length triples and sector area increases ninefold. Those scaling laws follow from the formulas, not from visual estimation.</Prose></Example>

    <H2>4. Compare similar triangles</H2>
    <Prose>Two triangles with the same corresponding angles have the same shape: they are <strong>similar</strong>. In Euclidean geometry, corresponding sides have one common positive scale factor. </Prose>
    <Prose>Choose one acute angle θ in a right triangle. The <strong>opposite</strong> leg faces θ; the <strong>adjacent</strong> leg meets θ and is not the hypotenuse. These names depend on which acute angle you choose. At the other acute angle, opposite and adjacent exchange roles. Sine is opposite divided by hypotenuse; cosine is adjacent divided by hypotenuse; tangent is opposite divided by adjacent.</Prose>

    <Prose>The default compares scale 1 with scale 2. Change the scale from 1/2 to 3 in steps of 1/4, or choose the supplied 5–12–13 or equal-leg triangle. Every changed shape still has a right angle. Compare side ratios and area; the angle mark θ names the geometric angle without invoking an unexplained inverse calculation. Reset restores the 3–4–5 pair.</Prose>
    <TriangleSimilarityLab />
    <Prose>Enlarging a 3–4–5 right triangle by factor 2 gives 6–8–10. Ratios such as 3/5 and 6/10 agree. This lets an angle determine a ratio without determining the triangle's size.</Prose>
    <Prose>In our triangle, choose θ opposite the length-3 leg. Then sin θ=3/5, cos θ=4/5 and tan θ=3/4. They are ratios without length units. Their values remain the same when we scale all three lengths. Dividing sine by cosine cancels the hypotenuse and gives tan θ.</Prose>
    <MathBlock>{String.raw`\begin{aligned}\sin\theta&=\frac{\text{opposite}}{\text{hypotenuse}},\\\cos\theta&=\frac{\text{adjacent}}{\text{hypotenuse}},\\\tan\theta&=\frac{\text{opposite}}{\text{adjacent}}.\end{aligned}`}</MathBlock>

    <H3>Derive useful exact values</H3>
    <Prose>An isosceles right triangle has equal legs. An equilateral triangle has three equal sides; splitting it through a side midpoint produces the two right triangles below. Identify the side lengths before forming a ratio.</Prose>
    <SpecialAngleConstructionsFigure />
    <Prose>For a 45° right triangle, the legs are equal. Choose both as 1; Pythagoras gives hypotenuse √2, so sin 45°=cos 45°=1/√2=√2/2. For 30° and 60°, split an equilateral triangle of side 2 down its midpoint. Its three equal angles are 60°; the split makes a right triangle with hypotenuse 2, short leg 1 and long leg √3. Therefore sin 30°=1/2, cos 30°=√3/2, sin 60°=√3/2 and cos 60°=1/2.</Prose>
    <ComplementRolesFigure />
    <Prose>The complementary-angle relationship follows from exchanging the legs: sin θ=cos(90°−θ) for acute θ. The reciprocal functions also appear in other texts: sec θ=1/cos θ, csc θ=1/sin θ and cot θ=cos θ/sin θ, each only where its denominator is nonzero. They introduce no new geometry here.</Prose>
    <H3>Use the ratio to recover a missing measurement</H3>
    <Prose>Use the now-derived 30° values on a ramp of length 5 m. Its rise is vertical, its run is horizontal, and grade compares rise with run in percent.</Prose>
    <RampGradeFigure />
    <Prose>A straight ramp is 5 m long and rises at 30° above horizontal. Its rise is opposite the angle, and the ramp itself is the hypotenuse. Thus rise/5=sin 30°=1/2, so rise=2.5 m. Its horizontal run is 5cos 30°=5√3/2≈4.3301 m. A 30° angle is not a 30% grade: grade is rise/run×100%=tan 30°×100%≈57.735%. The convention changes the calculation.</Prose>

    <H2>5. Follow a point around a circle</H2>
    <Prose>Right-triangle ratios began with acute angles and positive lengths. A rotating point needs more: negative angles, multiple turns and signed coordinates. Draw a radius-1 circle centred at the origin. Starting at (1, 0), turn by θ. Define its endpoint to be <strong>(cos θ, sin θ)</strong>. In the first quadrant, dropping a perpendicular gives a right triangle with hypotenuse 1, so these coordinates agree with the earlier ratios. The circle extends those functions to every real angle.</Prose>
    <Prose>The axes divide the plane into four quadrants, numbered counterclockwise from the upper-right region. A sign identifies which side of an axis a component lies on.</Prose>
    <SignedCircleQuadrantsFigure />
    <Prose>Moving into quadrant II gives negative x and positive y: cosine is negative and sine positive. Quadrant III makes both negative; quadrant IV has positive cosine and negative sine. The radius is still a positive length. Applying Pythagoras to the magnitudes of the components gives the identity cos²θ+sin²θ=1 for every angle.</Prose>
    <ReflectionPeriodFigure />
    <Prose>At radius R instead of 1, the point is (Rcos θ, Rsin θ). A full turn returns to the same point: sin(θ+2π)=sin θ and cos(θ+2π)=cos θ. Reflecting across the horizontal axis sends θ to −θ, preserving x and reversing y. Hence cosine is even, cos(−θ)=cos θ, and sine is odd, sin(−θ)=−sin θ.</Prose>
    <Prose>Tangent remains sin θ/cos θ when cosine is nonzero. It is the line's slope from the origin to that circle point. At θ=π/2+kπ for any integer k, the line is vertical and tangent is undefined. Opposite points have the same slope, so tangent repeats after π, half a turn. A calculator's very large value for tan(π/2) usually reflects an approximate nonzero cosine; it does not make the mathematical value defined.</Prose>
    <Prose>Change θ through −360° to 360° in 15° steps. The point, projections and angle-trace marker describe the same state. At the exact cardinal angles the components are exact; a vertical radius gives undefined tangent. The graph does not join across that discontinuity. Reset returns to 45°.</Prose>
    <CircleComponentsLab />
    <H3>A periodic signal can be a coordinate</H3>
    <Prose>A mark on a steadily turning wheel has a horizontal coordinate Rcos θ and a vertical coordinate Rsin θ. If the wheel makes f turns per second, its angle after t seconds is θ=2πft+φ, where φ is the starting angle or <strong>phase</strong>. A sensor coordinate can therefore have the form y(t)=c+A sin(2πft+φ): c is its centre, A≥0 its amplitude and, for f&gt;0, T=1/f its period. </Prose>
    <PeriodicSignalFigure />
    <Prose>For c=10 cm, A=3 cm and f=2 turns/s, the range is 7 to 13 cm and the period 0.5 s. Frequency in turns/s differs by factor 2π from angular frequency in radians/s.</Prose>
    <Prose>This model describes a chosen circular projection; not every repeating measurement is a perfect sine wave. Combining multiple frequencies, sampling and aliasing belong to later signal-processing topics. Here the important connection is that a periodic graph and a moving geometric component can describe the same quantity.</Prose>

    <H2>6. Recover a direction</H2>
    <Prose>Knowing an angle gives a component, but a component generally does not choose one angle. An <strong>inverse trigonometric function</strong> restricts angles to a chosen <strong>branch</strong>, an interval on which each allowed component selects just one angle. This is the same choice involved in taking the inverse of the nonnegative square branch.</Prose>
    <InverseBranchesFigure />
    <Prose>Both 30° and 150° have sine 1/2. Adding full turns produces infinitely many more. Choosing a principal branch returns one of these angles; it does not erase the others.</Prose>
    <LessonTable caption="Principal inverse branches, with angles in radians" headers={['Function', 'Allowed input', 'Returned angle']} rows={[['arcsin x or asin(x)', '−1 ≤ x ≤ 1', '−π/2 ≤ angle ≤ π/2'], ['arccos x or acos(x)', '−1 ≤ x ≤ 1', '0 ≤ angle ≤ π'], ['arctan x or atan(x)', 'Any real x', '−π/2 < angle < π/2']]} />
    <AllTrigSolutionsFigure />
    <Prose>For sin θ=1/2, let α=arcsin(1/2)=π/6. All solutions are θ=α+2kπ or θ=π−α+2kπ, for any integer k. At sine ±1 the two families coincide; do not count them twice. For cos θ=x, the families are θ=±arccos(x)+2kπ. For tan θ=x, they are θ=arctan(x)+kπ. An interval or a physical constraint determines which candidates to keep.</Prose>
    <Callout title="An inverse is not a reciprocal">The notation sin⁻¹(x) often means arcsin(x), while (sin x)⁻¹ means 1/sin x. Use arcsin when ambiguity would distract from the meaning. Also, arcsin(sin θ)=θ only when θ is already in the chosen principal interval.</Callout>
    <H3>Cartesian coordinates contain the missing sign information</H3>
    <Prose>Compare two opposite points with the same y/x quotient. An angle chosen from that quotient alone must give the same answer for both, even though their geometric directions differ.</Prose>
    <BearingSignsFigure />
    <Prose>For P=(−3, 4), radius r=5. The ratio y/x=−4/3 gives arctan(−4/3)≈−53.1301°, which points into quadrant IV. The actual point is in quadrant II. The points (3, −4) and (−3, 4) share the same quotient; dividing discarded information. The function <Code>atan2(y, x)</Code> uses both signs to recover a full bearing. Here it returns about 126.8699°.</Prose>
    <Prose>We use the bearing interval (−π, π], so the negative x axis is π rather than −π. Python's atan2 exposes endpoints according to its signed-zero convention; the program below normalizes −π to π. At the origin, r=0 and every angle reconstructs the same point, so no direction is determined. Report “no direction” instead of assigning geometric significance to a library's zero-input result.</Prose>
    <Prose>For a nonzero point, converting back checks the answer: x=r cos θ and y=r sin θ. For (−3, 4), 5cos θ=−3 and 5sin θ=4. A single inverse cosine could recover the right x sign but still lose the sign of y; reconstruction checks both components.</Prose>
    <Prose>Change the two integer components between −6 and 6. The default is (−3,4); reset restores it. Compare all four quadrants, then an axis, then the origin. Read the two-sign bearing and reconstructed components together; the one-quotient comparison has no value when x is zero.</Prose>
    <BearingLab />
    <Example id="bearing"><Prose>The same function handles quadrants and axes, treats the origin separately and verifies reconstruction within floating-point tolerance. Its explicit magnitude bound keeps this teaching example within an ordinary numerical scale.</Prose></Example>
    <Prose>The branch convention and atan2 operation are now explicit. Revisit the earlier right-triangle and circle questions using their complete programs; their inverse calls no longer arrive before their meaning.</Prose>
    <Example id="similarity"><Prose>Fractions make the cancellation exact. Notice that scale 1/2 quarters the area. The inverse-angle calculation at the end uses the quadrant-aware atan2 operation just explained.</Prose></Example>
    <Example id="circle"><Prose>The program explicitly inserts exact cardinal identities. It does not turn every small number into zero. Compare −90° and 270° and inspect why both tangent values are undefined.</Prose></Example>

    <H2>7. Solve triangles that are not right</H2>
    <Prose>Name a general triangle's vertices A, B and C; name the side opposite each vertex a, b and c. Uppercase letters will also denote the corresponding angles when context is clear. All side lengths and interior angles are positive for a nondegenerate triangle. Its angles add to π, and the longest side is shorter than the sum of the other two. Equality would collapse the triangle to a line.</Prose>
    <H3>Derive the cosine law from a coordinate difference</H3>
    <Prose>Fix the base along the positive horizontal direction. Place C by walking a side of length b at included angle A. Its perpendicular projection gives the component difference needed to measure the opposite side.</Prose>
    <CosineLawConstructionFigure />
    <Prose>Place A at (0, 0), B at (c, 0), and C at (b cos A, b sin A). Side a is the distance from B to C. Squaring that distance and using sin²A+cos²A=1 gives:</Prose>
    <MathBlock>{String.raw`\begin{aligned}a^2&=(b\cos A-c)^2+(b\sin A)^2\\&=b^2+c^2-2bc\cos A.\end{aligned}`}</MathBlock>
    <Prose>This is the <strong>law of cosines</strong>. With b=5, c=7 and included angle A=60°, a²=25+49−70(1/2)=39, so a=√39≈6.2450. At A=90°, cosine is zero and Pythagoras reappears. An acute included angle gives a smaller opposite side than the corresponding right triangle; an obtuse angle gives a larger one. When all three sides are known, rearrange to cos A=(b²+c²−a²)/(2bc), then use the arccos branch from 0 to π. Validate the side lengths first.</Prose>
    <H3>Derive the sine law from the same area three ways</H3>
    <Prose>The same triangle has one area, regardless of which side is chosen as base. In an obtuse case the perpendicular foot lies on an extended base line; it is still a positive height.</Prose>
    <SineLawAreaFigure />
    <Prose>The perpendicular height over side c is b sin A, so area=bc sin A/2. This remains valid when A is obtuse: the height's foot can lie beyond the side, but the perpendicular distance is still b sin A&gt;0. Choosing other bases gives the same area ca sin B/2=ab sin C/2. Divide these equal expressions by abc/2 to obtain sin A/a=sin B/b=sin C/c, or the familiar a/sin A=b/sin B=c/sin C.</Prose>
    <Prose>The <strong>law of sines</strong> is useful when a known side and its opposite angle provide a scale. For A=30°, B=45° and a=7, C=105°, b=7sin45°/sin30°=7√2 and c=14sin105°. Two angles fix the shape; one side fixes the size.</Prose>
    <H3>Why side–side–angle can be ambiguous</H3>
    <Prose>Use the already-defined side names on the fixed construction below: A is 30°, b is 10 and the circle radius a is 7. Each positive-ray intersection is a possible vertex B; the two actual intersections are separate candidates.</Prose>
    <SsaDefaultFigure />
    <Prose>Suppose instead A=30°, a=7 and b=10. Then sin B=b sin A/a=5/7. The acute inverse gives B≈45.5847°, but the supplementary B≈134.4153° has the same sine. Both are valid because A+B remains below 180°. Their remaining angles are about 104.4153° and 15.5847°. The corresponding side c values differ.</Prose>
    <Prose>Geometry makes the ambiguity visible. C=(5√3, 5) is fixed; B must lie on the positive x ray and 7 units from C. Solving (c−5√3)²+5²=7² yields c=5√3±√24. Both values are positive. If the radius were 4, the circle would not reach the ray; if it were 5, it would just touch once. Data can give zero, one or two triangles. Every inverse-trig candidate must satisfy the remaining angle and original side constraints.</Prose>
    <Prose>Keep A=30° and b=10 fixed while changing only the integer radius a from 4 to 12. The height is exactly 5. Radius 5 is tangent; radius 10 also reaches A itself, but that collapsed vertex is rejected because c must be positive. Read each surviving triangle’s c, B and C, and reset to radius 7. This classification belongs to this acute-angle construction.</Prose>
    <SsaIntersectionLab />
    <Example id="triangles"><Prose>The SAS helper uses the derived coordinate distance. The SSA helper is deliberately scoped to A=30° and integer sides, so the height b/2 and tangency classification are exact before the square root. It checks no-hit, tangent, two-hit and collapsed-endpoint cases. It is not a universal arbitrary-precision triangle solver.</Prose></Example>

    <H2>8. Move a point or change its description</H2>
    <Prose>Keep the world axes fixed and move the point. A quarter-turn changes its two signed components; it does not relabel the axes.</Prose>
    <Prose>A quarter-turn sends the positive x direction to positive y and positive y to negative x. Therefore an active counterclockwise 90° rotation sends (x, y) to (−y, x). For example (3, 4) becomes (−4, 3), still distance 5 from the origin. The point has moved; the axes have stayed fixed.</Prose>
    <H3>Build an arbitrary rotation from two component moves</H3>
    <Prose>For an angle θ, the rotated positive unit x direction is (cos θ, sin θ). The perpendicular positive unit y direction is (−sin θ, cos θ): turn another 90°, exchanging magnitudes and the required sign. A displacement (x, y) means x units of the first direction plus y units of the second. </Prose>
    <ActiveBasisRotationFigure />
    <Prose>Rotate each component and add them:</Prose>
    <MathBlock>{String.raw`\begin{aligned}x'&=x\cos\theta-y\sin\theta,\\y'&=x\sin\theta+y\cos\theta.\end{aligned}`}</MathBlock>
    <Prose>Call this map Rθ. The notation abbreviates those two scalar formulas; it does not require matrix multiplication. Expanding x′²+y′² makes the mixed terms cancel and leaves (x²+y²)(cos²θ+sin²θ)=x²+y². Thus it preserves lengths. Reversing the angle reverses the rotation: R−θ(Rθ(x, y))=(x, y). A translation first subtracts or later adds a location; it is a different operation.</Prose>
    <PivotTranslationFigure />
    <Prose>For a fixed pivot O=(oₓ, oᵧ), first subtract O to get the displacement from the pivot, rotate it, then add O back. The actively rotated world point is O+Rθ(P−O). Rotating about the world origin instead would generally put the point somewhere else.</Prose>
    <H3>Change axes while keeping the world point fixed</H3>
    <Prose>Next keep the world point fixed and change the axes that describe it. The marked world point is P=(4,2), the local origin is O=(1,−1), and the local axes turn counterclockwise by 30°.</Prose>
    <PassiveFrameFigure />
    <Prose>Now choose a new origin O and rotate the <em>coordinate axes</em> counterclockwise by θ. The point P stays in the same physical place. If its new coordinates are q=(u, v), then walking u units along the new x direction and v along the new y direction must reconstruct P:</Prose>
    <MathBlock>{String.raw`\begin{aligned}P_x&=o_x+u\cos\theta-v\sin\theta,\\P_y&=o_y+u\sin\theta+v\cos\theta.\end{aligned}`}</MathBlock>
    <Prose>Subtract O and undo that rotation. The local coordinates are q=R−θ(P−O), so u=cosθ(Pₓ−oₓ)+sinθ(Pᵧ−oᵧ), and v=−sinθ(Pₓ−oₓ)+cosθ(Pᵧ−oᵧ). The minus angle is a consequence of solving the reconstruction equation. It is not a rule to memorize without knowing which direction the map goes.</Prose>
    <Prose>With P=(4, 2), O=(1, −1) and θ=30°, the pivot-relative displacement is (3, 3). Passive coordinates are u=3√3/2+3/2≈4.0981 and v=−3/2+3√3/2≈1.0981. Reconstructing gives (4, 2). Actively rotating the same displacement gives (1.0981, 4.0981); adding O gives the different world point (2.0981, 3.0981). Both calculations are correct for their different questions.</Prose>
    <Prose>Compare the two taught interpretations with angle −180° to 180° in 15° steps. Point presets are (4,2), (−3,1) and (0,0); origin presets are (0,0), (1,−1) and (−1,1). The default uses P=(4,2), O=(1,−1), 30° and passive coordinates. Read the indicated result and reconstruction, then reset. Arbitrary bounded coordinate inputs remain available in the complete program below.</Prose>
    <CoordinateFrameLab />
    <H3>Points and free displacements respond differently to translation</H3>
    <Prose>Use two fixed world points, P=(1,2) and Q=(4,6), in the same 30° frame. Compare their two local positions and then subtract them component by component.</Prose>
    <OriginDisplacementFigure />
    <Prose>Convert two points P and Q into the same local frame. Subtracting their local coordinates cancels the origin: q−p=R−θ(Q−P). A displacement has no attached absolute origin, so changing origins alone does not change its components. Rotating the axes still does. This distinction matters for positions versus directions, velocity components and sensor offsets.</Prose>
    <Prose>Change only the local origin coordinates, each an integer from −2 to 2. Both local positions change, but their difference remains ((3√3+4)/2,(4√3−3)/2). Reset restores origin (1,−1). The world points and the 30° axis orientation stay fixed.</Prose>
    <OriginDisplacementLab />
    <Checkpoint prompt="A frame's origin moves 2 units along its own positive x direction, while its axes keep the same orientation. What happens to a point's x coordinate? What happens to a displacement's x component?">
      <Prose>The point's local x coordinate decreases by 2 because the new zero moved along that same local x direction. This remains true when the frame is tilted relative to the world axes. A displacement between two points keeps its x component: subtracting the two translated coordinates cancels the −2. Nothing physically moved merely because the coordinate description changed.</Prose>
    </Checkpoint>
    <Example id="frames"><Prose>Three printed pairs distinguish the passive coordinates, their reconstruction and the active result. Copying the correct formula into the wrong map can produce a plausible pair; reconstruction exposes that mistake.</Prose></Example>
    <section data-lesson-teaching="" className="lesson-teaching-section"><h3 className="lesson-teaching-section__title">Deeper connection: angle addition and composition</h3>
      <Prose>Use two angles α and β measured from the same fixed axes. Compare a turn through α followed by a turn through β with one combined turn.</Prose>
      <RotationCompositionFigure />
    <Prose>Take the circle point (cos α, sin α) and actively rotate it by β. Its new angle is α+β. Substituting into the component formula proves cos(α+β)=cosα cosβ−sinα sinβ and sin(α+β)=sinα cosβ+cosα sinβ. This also proves that planar rotations about the same origin compose by adding angles: RβRα=Rα+β.</Prose>
      <Prose>Compare two local-to-world maps, named T₁ and T₂. Each rotates about its input origin and then adds its own offset O₁ or O₂. The drawing follows the actual input point through both maps, so an offset must be interpreted in the frame where it is added.</Prose>
      <AffineOrderFigure />
    <Prose>If a local-to-world map is T₁(p)=O₁+Rαp and another is T₂(q)=O₂+Rβq, substitution gives T₂(T₁(p))=O₂+RβO₁+Rα+βp. The first translation is rotated by the second map. Translation and rotation generally do not commute: starting at (1, 0), translate by (1, 0) then turn 90° to obtain (0, 2); turn first then translate to obtain (1, 1). State the frame of each offset before composing.</Prose>
      <Prose>The Vectors lesson formalizes these component maps with matrices and more dimensions. Robotics topics extend them to named 3D frames. Planar rotation commutativity does not automatically transfer to rotations about different axes in 3D.</Prose>
    </section>

    <H2>9. Use the geometry in a system</H2>
    <H3>A screen can reverse an axis and change its scale</H3>
    <Prose>A typical image uses horizontal coordinate u increasing right and vertical coordinate v increasing down. Suppose the screen location of the world origin is (u₀, v₀)=(100, 200) pixels, with scales sₓ=20 px/m and sᵧ=10 px/m. </Prose>
    <ScreenCoordinateFigure />
    <Prose>The affine mapping is u=u₀+sₓx and v=v₀−sᵧy. The minus sign reverses vertical orientation; the two scale factors convert units.</Prose>
    <Prose>Our P=(1, 2) and Q=(4, 6) map to (120, 180) and (180, 140) pixels. The pixel displacement is (60, −40). Its pixel length √5200≈72.111 is neither 5 m nor convertible by a single common scale here. Recover Δx=60/20=3 m and Δy=−(−40)/10=4 m, then use Pythagoras to obtain 5 m. A circle can look elliptical under unequal screen scales while remaining a physical circle.</Prose>
    <Prose>This is an explicitly chosen planar drawing map, not a perspective-camera model. In an image of a 3D scene, depth and projection introduce additional geometry. A correct display conversion does not establish camera calibration.</Prose>
    <Example id="screen"><Prose>Screen offsets cancel from a difference; axis scales do not. Change both scales and verify that converting the endpoints back preserves the physical distance.</Prose></Example>
    <H3>A folding arm uses relative angles</H3>
    <Prose>Join a length-2 link and a length-1 link at an elbow. The shoulder angle is 30° from the world x direction; the elbow turns a further 60° relative to the first link. Locate the actual elbow and endpoint before adding their components.</Prose>
    <TwoLinkFigure />
    <Prose>A two-link planar arm begins at the origin. The first link has length L₁ and world angle θ. The elbow turns by φ <em>relative to the first link's direction</em>, so the second link's world angle is θ+φ. Add their two displacement components:</Prose>
    <MathBlock>{String.raw`\begin{aligned}x&=L_1\cos\theta+L_2\cos(\theta+\phi),\\y&=L_1\sin\theta+L_2\sin(\theta+\phi).\end{aligned}`}</MathBlock>
    <Prose>For L₁=2, L₂=1, θ=30° and φ=60°, the elbow is (√3, 1). The second link points straight up and contributes (0, 1), giving endpoint (√3, 2). Using φ alone as its world angle would silently change the mechanism. This same geometry applies to a folding inspection probe, a drawing linkage or an articulated lamp.</Prose>
    <Prose>There are useful checks before trusting the result. The distance from the base must lie between |L₁−L₂| and L₁+L₂, here 1 and 3. Squaring the endpoint and using the angle-difference identity gives r²=L₁²+L₂²+2L₁L₂ cosφ, independent of θ. A straight elbow φ=0 reaches 3; a fully folded φ=180° reaches 1. Changing the shoulder rotates the endpoint without changing its distance from the base.</Prose>
    <Prose>Change the shoulder θ or relative elbow φ through −180° to 180° in 15° steps, keeping link lengths 2 and 1. The second world angle is always θ+φ. Compare a straight and folded elbow, then change only the shoulder and inspect the endpoint radius. Reset restores θ=30° and φ=60°.</Prose>
    <TwoLinkLab />
    <Example id="links"><Prose>The second case changes only the shoulder and gives (3√3/2, −1/2). The reach remains √7. Later Forward & Inverse Kinematics will ask the reverse question—what joint configurations reach a target—and explain multiple branches and singularities.</Prose></Example>
    <H3>Check exact constructions with ordinary geometry tools</H3>
    <Prose>The scratch programs expose the arithmetic. For exact flat-plane constructions, SymPy instead supplies Point2D, Segment, Triangle, Circle and Ray objects. A segment’s length and midpoint belong to that segment; a circle–ray intersection returns a list of actual candidate points, not a promise of two triangles.</Prose>
    <Prose>The complete program below first checks P=(1,2), Q=(4,6): distance 5, midpoint (5/2,4), and area 6 for the positively oriented right triangle through (4,2). Then it constructs the already-taught A=30°, b=10 SSA geometry. Inputs a are concrete Python integers from 1 to 20; booleans, floating-point drafts, symbols and out-of-range values are rejected. The ray includes its source, so a=10 still needs the explicit c&gt;0 nondegeneracy filter.</Prose>
    <Prose>With Python 3.12 or later, install the executed version using <Code>python -m pip install sympy==1.14.0</Code>, save <Code>symbolic_geometry.py</Code>, and run it. Its Point2D coordinates, radicals and residual checks stay exact; conversion to float only orders the displayed candidates. These are constructed teaching coordinates, not measurements. A fixed number of geometric calls does not make symbolic expression manipulation universally constant-time; this example deliberately fixes the entities and bounds.</Prose>
    <Prose><strong>Before running:</strong> {symbolicGeometryExample.question}</Prose>
    <RunnableExample example={symbolicGeometryExample} />
    <Prose>The output distinguishes no intersection at a=4, tangency at a=5, two positive bases at a=7, and one surviving triangle at a=10 or 12. Check an original circle residual and positive triangle area before trusting a returned point. To change the given angle itself, change the construction; calling a helper hard-coded to A=30° cannot answer an obtuse-angle question.</Prose>
    <Callout title="Choose a model before choosing a formula">Write down the physical object, coordinate origin, axis directions, units, angle unit and what is moving. Then compute. A result can satisfy an algebraic equation and still answer the wrong geometric question if one of those choices is hidden.</Callout>

    <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>10. Practise with changed geometry</H2>
    <Prose>Try the question before opening its hint. Keep exact radicals or fractions until the last step when possible. Each numerical candidate should reconstruct the supplied geometry; a drawing is useful evidence, but does not replace the stated constraints.</Prose>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="A. Distance and a midpoint" question="P=(−2, 1) and Q=(4, −7), in metres. Find the displacement, straight distance, axis-aligned route length and midpoint." hint="Subtract Q−P; average coordinates for the midpoint.">
      <Prose>The displacement is (6, −8) m. Distance is √(36+64)=10 m, while an axis-aligned route is 6+8=14 m. The midpoint is (1, −3). From either endpoint to that midpoint the distance is 5 m; reversing the trip gives (−6, 8) with the same length.</Prose>
    </Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="B. Angle versus arc" question="A radius-3 cm circle has a positive 120° sector. Find the angle in radians, arc length and sector area. Repeat the scaling prediction for radius 6 cm." hint="120° is one third of a turn.">
      <Prose>The angle is 2π/3 rad, arc length is 3(2π/3)=2π cm and area is 9(2π/3)/2=3π cm². Doubling radius gives arc 4π cm and area 12π cm² while the angle stays 2π/3. The straight chord would be a different length.</Prose>
    </Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="C. A changed right triangle" question="A right triangle has adjacent leg 12, opposite leg 5 and hypotenuse 13 relative to θ. Give the three ratios. Scale it by 3/2 and find its new area." hint="Scaling cancels in ratios but contributes twice to area.">
      <Prose>sin θ=5/13, cos θ=12/13 and tan θ=5/12. The scaled sides are 18, 7.5 and 19.5. Original area is 30, so scaled area is 30×9/4=67.5 square units. If the other acute angle is selected, sine and cosine swap and tangent becomes 12/5.</Prose>
    </Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="D. Components and every inverse candidate" question="Find the exact circle coordinates at 225°. Then solve sin θ=−1/2 for 0°≤θ<360°. Explain why arcsin alone is insufficient." hint="225° is 180°+45°. Negative sine occurs below the x axis.">
      <Prose>At 225°, both coordinates are −√2/2 and tangent is 1. The sine equation has θ=210° and 330°. arcsin(−1/2)=−30° is only its principal answer, which is outside the requested interval; adding 360° gives 330°, and the supplementary family gives 210°. Both must be checked.</Prose>
    </Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="E. A bearing on the wrong branch" question="A point is (−5, −5). What are its radius and bearing in (−180°,180°]? What does atan(y/x) return?" hint="The radius is positive and both components are negative.">
      <Prose>The radius is 5√2 and the bearing is −135° (equivalently 225°, outside the chosen interval). atan(1) returns 45°, which reconstructs (5, 5) rather than (−5, −5). atan2 retains the two negative signs. If both coordinates were zero, a bearing could not be determined.</Prose>
    </Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="F. Check the included angle" question="Two sides of lengths 4 and 6 include a 60° angle. Find the third side and the area. Why is √(4²+6²) incorrect?" hint="Use the cosine-law correction, then base times perpendicular height.">
      <Prose>The third side squared is 16+36−2×4×6×1/2=28, so its length is 2√7≈5.2915. Area is 4×6×sin60°/2=6√3≈10.3923 square units. Pythagoras would require a 90° included angle; it would omit the −24 correction here.</Prose>
    </Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="G. An independently changed ambiguous triangle" question="A=30°, a=5 and b=8. How many nondegenerate triangles are possible? Find both base lengths c and explain them geometrically." hint="C=(4√3,4). A radius-5 circle centred there meets the positive x ray.">
      <Prose>The ray intersections solve (c−4√3)²+16=25, giving c=4√3±3. Both are positive, approximately 3.9282 and 9.9282. The corresponding B angles are 126.8699° and 53.1301°, leaving C angles 23.1301° and 96.8699°. Both triangles have the supplied sides and angle. Accepting only the acute arcsin branch would lose the shorter base.</Prose>
    </Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="H. Separate active and passive results" question="Use P=(3,1), O=(1,2) and θ=90°. Find local coordinates, reconstruct P, and actively rotate P about O." hint="Subtract O first. At 90°, R(x,y)=(−y,x) and the inverse sends (x,y) to (y,−x).">
      <Prose>The displacement from O is (2,−1). Local coordinates are R−90(2,−1)=(−1,−2). Reconstruct with R90(−1,−2)=(2,−1), then add O to get (3,1). Active rotation gives R90(2,−1)=(1,2), then adds O to give (2,4). Both results preserve the pivot distance √5 but represent different operations.</Prose>
    </Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="I. Diagnose a screen-distance error" question="A physical displacement (−2,3) m is drawn with 30 px/m horizontally and 20 px/m vertically, with screen y down. Find the pixel displacement and recover the physical distance." hint="The vertical sign reverses; invert each scale before the distance calculation.">
      <Prose>The pixel displacement is (−60,−60) px. Its pixel diagonal is 60√2 px. Converting components gives (−60/30, −(−60)/20)=(−2,3) m, whose length is √13≈3.6056 m. Dividing the pixel diagonal by either scale treats the other axis incorrectly. The screen-origin offset has no effect on this difference.</Prose>
    </Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="J. A changed folding probe" question="A two-link probe has L₁=3, L₂=2, shoulder 0° and relative elbow 60°. Find its endpoint and reach. Then rotate the shoulder to 90° without changing the elbow." hint="Add the link displacements first; the shoulder change then rotates their sum.">
      <Prose>The initial endpoint is (3+2cos60°, 2sin60°)=(4,√3). Reach is √19≈4.3589, between 1 and 5. At shoulder 90°, the endpoint is (−√3,4), with the same reach. The second absolute angle is now 150°, not 60°. This is also a check of the angle-addition formulas.</Prose>
    </Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="K. A measurement model you can explain" question="Design a check for a mark moving around a circle with centre height 8 cm, radius 2 cm and frequency 3 turns/s. Start it at the rightmost point and track height. State the range, period and values at t=0 and t=1/12 s." hint="The rightmost point has zero vertical displacement and initial angle zero.">
      <Prose>One model is y(t)=8+2sin(6πt), in centimetres with t in seconds. Its range is 6 to 10 cm and period 1/3 s. Initially y(0)=8 cm; at 1/12 s the angle is π/2 and y=10 cm. This assumes steady counterclockwise rotation. Clockwise motion would reverse the sine sign; a different starting point would change phase. A measured signal departing from this pattern might reflect varying speed, an off-centre mark or a measurement convention, not a failure of the identity.</Prose>
    </Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="L. Reverse an operation order" question="Start at (2,0). Compare translating by (0,1) then rotating 90° about the world origin, with rotating first then translating. Explain the mismatch." hint="Apply each operation to its actual input pair.">
      <Prose>Translate first: (2,0)→(2,1)→(−1,2). Rotate first: (2,0)→(0,2)→(0,3). The translation offset rotates only in the first sequence. These are different maps; writing the steps and checking a point makes the order visible.</Prose>
    </Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="M. An obtuse angle changes the intersection test" question="Use A=120°, b=10. How many nondegenerate triangles survive for a=9, 10 and 11? Explain why the acute-angle height classification and the fixed-A30° helper cannot be reused unchanged." hint="C=(−5,5√3). Solve (c+5)²+75=a² and require c&gt;0 on the positive x ray.">
      <Prose>For a=9, c=−5±√6: both values are negative, so no ray vertex exists. Radius 9 exceeds the height 5√3 but still gives no triangle; an acute-angle classification would have hidden the sign of the centre’s horizontal coordinate. For a=10, the roots are 0 and −10. The ray contains its source c=0, but that triangle is collapsed, so none survives. For a=11, c=−5±√46 and only −5+√46 is positive, giving one triangle.</Prose>
      <Prose>The endpoint constraint belongs to the original geometry, not to a principal inverse or an intersection API. Constructing the new circle and ray with exact entities applies the constraint directly. Changing only a in the earlier helper would still use A=30°, so it would answer a different problem. One algebraically valid root is not automatically one physically admissible triangle.</Prose>
    </Practice></div>
    <Prose><strong>Where this connects.</strong> The next topic in this module is <a href="/learn/path/full-curriculum/counting-combinatorics-mathematical-induction?module=math-foundations">Counting, Combinatorics &amp; Mathematical Induction</a>. It will develop ways to enumerate possibilities and establish claims for every integer case. For geometric depth, Vectors formalizes components and projections; coordinate-frame and kinematics topics extend the reconstruction methods; signal processing develops periodic measurements. The lesson order remains the module's declared order.</Prose></section>
    <Sources alternatives={<>
      <Prose><strong>A written route:</strong> OpenStax's <a href="https://openstax.org/books/algebra-and-trigonometry-2e/pages/7-1-angles" target="_blank" rel="noreferrer">Angles</a>, <a href="https://openstax.org/books/algebra-and-trigonometry-2e/pages/7-2-right-triangle-trigonometry" target="_blank" rel="noreferrer">Right-triangle trigonometry</a> and <a href="https://openstax.org/books/algebra-and-trigonometry-2e/pages/7-3-unit-circle" target="_blank" rel="noreferrer">Unit circle</a> offer a slower textbook sequence with more exercises. Start there if converting units or naming the triangle sides still feels uncertain. Relevant definitions and worked derivations were inspected.</Prose>
      <Prose><strong>A deeper video and transcript:</strong> Northwestern's Modern Robotics <a href="https://www.youtube.com/watch?v=6KIPusOv5fA" target="_blank" rel="noreferrer">Rotation Matrices, Part 2</a> compares describing orientation, changing coordinates and actively rotating a vector. Its <a href="https://modernrobotics.northwestern.edu/nu-gm-book-resource/3-2-1-rotation-matrices-part-2-of-2/" target="_blank" rel="noreferrer">official transcript</a> was inspected; complete video playback was not. It uses 3D matrix notation, so revisit it after Vectors. The scalar reconstruction in this lesson supplies the central physical distinction first.</Prose>
    </>}>
      <li><a href="https://openstax.org/books/algebra-and-trigonometry-2e/pages/8-3-inverse-trigonometric-functions" target="_blank" rel="noreferrer">OpenStax: inverse trigonometric functions</a> — principal ranges and branch-sensitive compositions. Useful when one calculator answer hides other geometric candidates.</li>
      <li><a href="https://openstax.org/books/algebra-and-trigonometry-2e/pages/10-1-non-right-triangles-law-of-sines" target="_blank" rel="noreferrer">OpenStax: law of sines</a> and <a href="https://openstax.org/books/algebra-and-trigonometry-2e/pages/10-2-non-right-triangles-law-of-cosines" target="_blank" rel="noreferrer">law of cosines</a> — general-triangle data, area and the ambiguous SSA case. Relevant explanations were read; this page's ray-intersection fixtures and figures were developed separately.</li>
<li><a href="https://www.stitz-zeager.com/szct07042013.pdf" target="_blank" rel="noreferrer">Stitz–Zeager: College Trigonometry</a> — selected inverse-branch, cosine-law proof and SSA passages supply a second written treatment. Compare the exact coordinate proof when the included angle or a supplementary candidate is confusing; selected passages were read, not every exercise.</li>
      <li><a href="https://docs.sympy.org/latest/modules/geometry/index.html" target="_blank" rel="noreferrer">SymPy geometry</a>, <a href="https://docs.sympy.org/latest/modules/geometry/lines.html" target="_blank" rel="noreferrer">rays and segments</a>, and <a href="https://docs.sympy.org/latest/modules/geometry/ellipses.html" target="_blank" rel="noreferrer">circle intersections</a> — official entity and returned-intersection contracts. The complete ordinary-tool program was executed with SymPy 1.14.0; exact returned points still need the original nondegeneracy constraints.</li>
          <li><a href="https://docs.python.org/3.12/library/math.html" target="_blank" rel="noreferrer">Python 3.12 math reference</a> — radians, principal inverse ranges, atan2 argument order and hypot. Examples were executed with Python 3.12.14. Software floating-point conventions do not override geometric domain restrictions.</li>
    </Sources>
  </div>
};
