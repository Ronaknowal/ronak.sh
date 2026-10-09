// Static projection of the accepted manuscript-r3; no browser Markdown parser.
import {Prose,H2,H3,CodeBlock} from '../content';
import {Math as InlineMath,MathBlock} from '../content/Math.jsx';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import {NeuralTable} from './NeuralLessonElements.jsx';
import Drawing from './NumericalReadingDrawings.jsx';
function Payload({file,output=false}){return <section className="nm-programme" data-payload={file}><RemoteCodeBlock source={'/learn-assets/numerical-methods/'+file} filename={file} language={output?'output':'python'}/></section>;}
export default function NumericalReadingLesson(){return <div className="lesson-pilot lesson-flow numerical-reading"><Prose opening="summary">{"A pump is delivering liquid at a changing rate. How quickly is its rate changing now? How much has it delivered after three minutes? When does the delivered amount first reach 0.8 litres? These questions need different calculations, but all three turn information about a function into a useful number. This lesson follows the intermediate operations, then asks what evidence supports the number."}</Prose>

<Prose opening="prerequisites">{"You need arithmetic, functions and graph coordinates. The short slope and area refreshers below make the core readable before a full calculus course. For the underlying limits, see "}<a href={"/learn/topic/single-variable-calculus-limits-derivatives-integrals#3-extract-the-local-linear-rate"}>{"local linear rate"}</a>{", "}<a href={"/learn/topic/single-variable-calculus-limits-derivatives-integrals#6-accumulate-signed-contributions"}>{"signed accumulation"}</a>{" and "}<a href={"/learn/topic/single-variable-calculus-limits-derivatives-integrals#7-prove-the-bridge-between-rate-and-total"}>{"their connection"}</a>{". Optional Python examples use functions, loops and lists. Their complete sources and outputs appear beside their explanations."}</Prose>

<Prose opening="route">{"On a first reading, follow the small geometric operations and the seven investigations. Return to the Taylor cancellation, adaptive error model and nested accuracy argument with those concrete objects in mind. The teaching stays visible; the independent exercises have separate hints and solutions."}</Prose>

<span id="1-an-answer-and-a-reason-to-trust-it"/>
<H2>{"1. One curve, three useful questions"}</H2>

<Prose>{"Consider the constructed rate model "}<InlineMath>{"r(t)=t e^{-t}"}</InlineMath>{", with time in minutes and rate in litres per minute. Numerically, "}<InlineMath>{"t"}</InlineMath>{" means the number of minutes; the exponent is the dimensionless ratio "}<InlineMath>{"t/(1\\text{ minute})"}</InlineMath>{". This is an illustrative mathematical pump, not a fitted physical device."}</Prose>

<Drawing id="NM01"/>

<Prose>{"Start at a time "}<InlineMath>{"t"}</InlineMath>{" and move right by a small positive amount "}<InlineMath>{"h"}</InlineMath>{". The rate changes by "}<InlineMath>{"r(t+h)-r(t)"}</InlineMath>{". Divide that vertical change by the horizontal change to obtain an average change of rate, in litres per minute squared. The "}<strong>{"derivative"}</strong>{" "}<InlineMath>{"r'(t)"}</InlineMath>{" is the limiting local slope as the interval shrinks. A computer can ask for two nearby values; it cannot literally perform an infinite limiting process. We will study how a finite difference approximates the derivative and why an extremely small interval can make the computation worse."}</Prose>

<Drawing id="NM02"/>

<Prose>{"For a short time strip, rate times width approximates delivered volume. Adding many strips approximates the "}<strong>{"integral"}</strong>{" "}<InlineMath>{"V(T)=\\int_0^T r(t)\\,dt"}</InlineMath>{", in litres. The continuous model has the useful reference "}<InlineMath>{"V(T)=1-(T+1)e^{-T}"}</InlineMath>{". At "}<InlineMath>{"T=3"}</InlineMath>{", "}<InlineMath>{"V(3)\\approx0.800851727"}</InlineMath>{" litres. Finding a target time reverses the question: solve "}<InlineMath>{"V(T)-0.8=0"}</InlineMath>{". A "}<strong>{"root"}</strong>{" is an input at which the function is zero. Three minutes is a convenient candidate, while the target crossing is about 2.994308347 minutes."}</Prose>

<Prose>{"The reference formula helps us check these examples. Real observed rates may offer no such oracle. We will later integrate nine actual discharge observations while keeping that limitation visible."}</Prose>

<H2>{"2. Attach a meaning to accuracy"}</H2>

<Prose>{"How can we tell whether an approximation is accurate enough? In the next illustrative comparison the reference is "}<InlineMath>{"q=\\sqrt2"}</InlineMath>{", the returned approximation is "}<InlineMath>{"\\widehat q=1.4150390625"}</InlineMath>{", and the requested absolute tolerance is .001. Keep its actual error separate from the conditional radius "}<InlineMath>{"E=1/1024"}</InlineMath>{"; the following interval method will justify that radius."}</Prose>

<Drawing id="NM03"/>

<Prose>{"Suppose the desired number is "}<InlineMath>{"q"}</InlineMath>{" and the calculation returns "}<InlineMath>{"\\widehat q"}</InlineMath>{". The "}<strong>{"absolute error"}</strong>{" is "}<InlineMath>{"|\\widehat q-q|"}</InlineMath>{", in the units of "}<InlineMath>{"q"}</InlineMath>{". A "}<strong>{"tolerance"}</strong>{" is a requested threshold, not evidence that the calculation met it. An "}<strong>{"error estimate"}</strong>{" is a computed diagnostic based on a model of the error. A "}<strong>{"bound"}</strong>{" is a justified inequality under stated assumptions. If "}<InlineMath>{"|\\widehat q-q|\\le E"}</InlineMath>{", the interval "}<InlineMath>{"[\\widehat q-E,\\widehat q+E]"}</InlineMath>{" contains "}<InlineMath>{"q"}</InlineMath>{" under those assumptions; it is not automatically a probabilistic confidence interval."}</Prose>

<Prose>{"Relative error divides by "}<InlineMath>{"|q|"}</InlineMath>{" and is undefined when "}<InlineMath>{"q=0"}</InlineMath>{". Near zero, an absolute tolerance in meaningful units matters. Many libraries combine absolute and relative tolerances, but the combination is API-specific. A sum such as "}<InlineMath>{"\\mathrm{atol}+\\mathrm{rtol}|q|"}</InlineMath>{" and a maximum such as "}<InlineMath>{"\\max(\\mathrm{atol},\\mathrm{rtol}|q|)"}</InlineMath>{" are different contracts. Read the actual one rather than treating all "}<code>{"tol"}</code>{" arguments as interchangeable."}</Prose>

<Drawing id="NM04"/>

<Prose>{"The physical model may omit a process; measured inputs may be uncertain; interpolation replaces an unknown shape; finite arithmetic rounds intermediate results. Increasing the number of panels addresses a particular discretization, not all four issues. We do not add arbitrary error labels and call their sum a bound. Valid propagation needs assumptions connecting those errors to the output."}</Prose>

<Drawing id="NM05"/>

<Prose>{"At "}<InlineMath>{"x=0"}</InlineMath>{", the function "}<InlineMath>{"x-1"}</InlineMath>{" has residual "}<InlineMath>{"-1"}</InlineMath>{", while "}<InlineMath>{"10^{-6}(x-1)"}</InlineMath>{" has residual "}<InlineMath>{"-10^{-6}"}</InlineMath>{". Both roots are at 1, so both location errors are 1. A "}<strong>{"residual"}</strong>{" measures failure of the equation in output space. Root accuracy measures distance in input space. Where a nonzero lower slope "}<InlineMath>{"|f'|\\ge m"}</InlineMath>{" applies between candidate and root, the mean value theorem gives "}<InlineMath>{"|x-r|\\le |f(x)|/m"}</InlineMath>{". Without such sensitivity information, a tiny residual can be misleading."}</Prose>

<span id="2-keep-a-root-inside-an-interval"/>
<H2>{"3. Keep a root inside an interval"}</H2>

<Prose>{"Can endpoint evaluations keep a root from being lost? Consider the continuous function "}<InlineMath>{"f(x)=x^2-2"}</InlineMath>{" on "}<InlineMath>{"[0,2]"}</InlineMath>{" and first locate its two endpoint values."}</Prose>

<Drawing id="NM06"/>

<Prose>{"The endpoint values are "}<InlineMath>{"f(0)=-2"}</InlineMath>{" and "}<InlineMath>{"f(2)=2"}</InlineMath>{". Continuity and opposite signs ensure at least one root between them. This existence statement alone does not establish uniqueness. For this example, "}<InlineMath>{"x^2"}</InlineMath>{" increases on the positive half-line, so the positive root is unique. Check an endpoint value of zero before asking for opposite signs: an endpoint may already be an answer."}</Prose>

<Drawing id="NM07"/>

<Prose>{"The first midpoint is 1, with "}<InlineMath>{"f(1)=-1"}</InlineMath>{". Retain "}<InlineMath>{"[1,2]"}</InlineMath>{" because its endpoints still have opposite signs. The next midpoint is 1.5, with value .25, so retain "}<InlineMath>{"[1,1.5]"}</InlineMath>{". Then 1.25 has value "}<InlineMath>{"-.4375"}</InlineMath>{", giving "}<InlineMath>{"[1.25,1.5]"}</InlineMath>{". Each update keeps the root in a smaller interval. This is "}<strong>{"bisection"}</strong>{": the new candidate divides the current interval into equal halves."}</Prose>

<Drawing id="NM08"/>

<Prose>{"If the initial width is "}<InlineMath>{"b_0-a_0"}</InlineMath>{", after "}<InlineMath>{"k"}</InlineMath>{" completed halvings the current midpoint has radius "}<InlineMath>{"(b_0-a_0)/2^{k+1}"}</InlineMath>{". That radius bounds its distance to some root in the retained interval. For initial width 2, ten completed halvings give radius "}<InlineMath>{"1/1024\\approx.0009765625"}</InlineMath>{", below .001. The midpoint is a candidate inside the current bracket, not necessarily a previously evaluated endpoint. Labeling the current radius avoids a common off-by-one mistake."}</Prose>

<Drawing id="NM09"/>

<Prose>{"For "}<InlineMath>{"1/x"}</InlineMath>{" across zero, the continuity premise fails: an opposite-sign interval need not contain a root. Conversely, "}<InlineMath>{"(x-1)^2"}</InlineMath>{" touches zero inside "}<InlineMath>{"[0,2]"}</InlineMath>{" despite equal positive endpoint values. Rejecting a sign bracket says the method's premise is unavailable; it does not prove that no root exists. Finally, if function evaluations are uncertain, an apparently negative center value may not determine the mathematical sign. We will return to that issue when each evaluation is itself an integral."}</Prose>

<Drawing id="NM10"/>

<Prose>{"The default already shows "}<InlineMath>{"x^2-2"}</InlineMath>{", bracket "}<InlineMath>{"[0,2]"}</InlineMath>{", its midpoint and the .001 target radius. Step through evaluation and replacement, or step back. Change "}<InlineMath>{"c"}</InlineMath>{" in "}<InlineMath>{"x^2-c"}</InlineMath>{" to 3 or 2.3 and inspect the changed signs; change it to 0 to see the endpoint check. The touching-root case shows why the refusal is meaningful. Reset restores the entire initial trace, fields and selection."}</Prose>

<Prose>{"The complete reference below keeps the two endpoint signs, checks a finite positive tolerance, and records its stopping status. Its loop counts "}<strong>{"completed halvings"}</strong>{" before testing the current midpoint radius. Work limits and arithmetic stagnation are separate from tolerance success. Each iteration costs one new function evaluation; live state is constant size, while saving all intermediate rows uses memory proportional to the number of steps. Halving needs logarithmically many iterations in the ratio of initial width to requested radius."}</Prose>

<Payload file="bracket.py"/><Prose>Recorded output:</Prose><Payload file="bracket.stdout.txt" output/>

<Prose>{"Ten halvings give radius 1/1024. A touching root fails this initial sign test even though it exists. A returned computed zero is a statement about the evaluated function; with an inaccurate function oracle, more care is needed."}</Prose>

<Prose>{"The recorded ten-halving answer 1.415039 has radius .000977. It need not equal the correctly rounded square root to all displayed places. The interval guarantee is the useful evidence. The second call refuses the touching-root example without asserting its absence."}</Prose>

<Prose>{""}<strong>{"Pause and retrieve."}</strong>{" Which single invariant survives each accepted update? The interval contains a root under continuity and reliable opposite-sign evaluations. A faster proposal should preserve that invariant if we want to retain this guarantee."}</Prose>

<span id="3-follow-a-tangent-with-a-safeguard"/>
<H2>{"4. Ask a local line for a better candidate"}</H2>

<Drawing id="NM11"/>

<Prose>{"Bisection uses signs but ignores slope. At "}<InlineMath>{"x=1.5"}</InlineMath>{", "}<InlineMath>{"f(x)=.25"}</InlineMath>{" and "}<InlineMath>{"f'(x)=3"}</InlineMath>{". Approximate nearby values with the line "}<InlineMath>{"f(x)+f'(x)(z-x)"}</InlineMath>{". Set that line to zero and solve for its input: "}<InlineMath>{"z=x-f(x)/f'(x)"}</InlineMath>{". Here "}<InlineMath>{"z=1.5-.25/3=17/12"}</InlineMath>{". This is a "}<strong>{"Newton proposal"}</strong>{". It is the tangent's root, not a newly observed root of the curved function."}</Prose>

<Drawing id="NM12"/>

<Prose>{"At "}<InlineMath>{"17/12"}</InlineMath>{", the actual function value is "}<InlineMath>{"1/144"}</InlineMath>{", not zero. Evaluate the function and derivative again before drawing the next tangent. This distinction explains both Newton's efficiency near a suitable root and its failures elsewhere."}</Prose>

<Prose>{"Why can it become so fast? Let "}<InlineMath>{"r"}</InlineMath>{" be a simple root, meaning "}<InlineMath>{"f(r)=0"}</InlineMath>{" and "}<InlineMath>{"f'(r)\\ne0"}</InlineMath>{". Suppose "}<InlineMath>{"f"}</InlineMath>{" is twice continuously differentiable near it, "}<InlineMath>{"|f'|\\ge m>0"}</InlineMath>{" and "}<InlineMath>{"|f''|\\le M"}</InlineMath>{" there, and the iterates stay in that neighborhood. Taylor's theorem applied from "}<InlineMath>{"x"}</InlineMath>{" toward "}<InlineMath>{"r"}</InlineMath>{" gives"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"0=f(x)+f'(x)(r-x)+\\tfrac12 f''(\\xi)(r-x)^2,\n\\quad |x_{\\mathrm{new}}-r|\\le\\frac{M}{2m}|x-r|^2."}</MathBlock></div>

<Prose>{"Squaring a small error can rapidly increase accurate digits. The neighborhood and derivative assumptions matter; this is a local result, not a promise from every start."}</Prose>

<Drawing id="NM13"/>

<Prose>{"For "}<InlineMath>{"f(x)=x^3-2x+2"}</InlineMath>{", starting at 0 gives "}<InlineMath>{"f=2"}</InlineMath>{", slope "}<InlineMath>{"-2"}</InlineMath>{", and proposal 1. At 1, "}<InlineMath>{"f=1"}</InlineMath>{", slope 1, and the next proposal is 0. The method cycles. A nonzero derivative at both visited points does not prevent failure."}</Prose>

<Drawing id="NM14"/>

<Prose>{"For "}<InlineMath>{"(x-1)^2"}</InlineMath>{", Newton simplifies to "}<InlineMath>{"x_{\\mathrm{new}}=(x+1)/2"}</InlineMath>{" away from the root. Thus the error halves. At the root itself the derivative is zero, so the simple-root hypothesis fails. For "}<InlineMath>{"x^2-2"}</InlineMath>{" at start 0, division by the zero derivative is unavailable even though the desired roots are simple. A useful implementation reports these situations."}</Prose>

<Drawing id="NM15"/>

<Prose>{"One safeguard keeps a valid bracket alongside the current point. Accept a finite tangent proposal only if it lies in the central 80% of that bracket; otherwise use the midpoint. On the cubic with bracket "}<InlineMath>{"[-2,0]"}</InlineMath>{", the allowed span is "}<InlineMath>{"[-1.8,-.2]"}</InlineMath>{". The proposal 1 is outside, so evaluate "}<InlineMath>{"-1"}</InlineMath>{" instead. Compare its sign with the endpoint signs to retain a new bracket. Each successful retained-bracket update reduces width by at least 10%, assuming reliable signs and continuity. The central span is a simple teaching safeguard; it is not an implementation of Brent's method."}</Prose>

<Drawing id="NM16"/>

<Prose>{"A "}<strong>{"secant"}</strong>{" replaces the derivative with "}<InlineMath>{"(f(x_1)-f(x_0))/(x_1-x_0)"}</InlineMath>{". Substitution gives"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"x_2=x_1-f(x_1)\\frac{x_1-x_0}{f(x_1)-f(x_0)}."}</MathBlock></div>

<Prose>{"For "}<InlineMath>{"x^2-2"}</InlineMath>{" at 1 and 2, the sampled values are "}<InlineMath>{"-1"}</InlineMath>{" and 2, the slope is 3, and the proposal is "}<InlineMath>{"4/3"}</InlineMath>{". Reevaluate the curved function there. Equal sampled values make the denominator vanish. An unrestricted secant need not preserve a bracket. Its usual superlinear local behavior also needs smoothness and a suitable simple root; it is not the bracket guarantee we just proved."}</Prose>

<Drawing id="NM17"/>

<Prose>{"The initial cubic at 0 makes the plain cycle visible immediately. Switch to the safeguarded route without changing the initial question. Follow the full proposed number, the actually visited number, and the retained bracket separately. Edit the starting point; try the zero-derivative and repeated-root cases. A clipped proposal still has its full numerical value printed beside the picture. Reset restores the plain cubic at 0."}</Prose>

<Prose>{"The preserved small example makes the five-step contrast explicit. The fallback at the fifth safeguarded step is intentional: the tangent proposal is close to the root but too close to the current bracket's endpoint for this particular policy."}</Prose>

<Payload file="newton.py"/><Prose>Recorded output:</Prose><Payload file="newton.stdout.txt" output/>

<Prose>{"The safeguard rejects a tangent proposal outside the central part of the bracket. Its progress comes from preserving the interval; a five-step demonstration is not a claim that the requested root accuracy has already been reached."}</Prose>

<Prose>{"The next complete file generalizes those transparent mechanisms, with finite evaluations, explicit work limits and recorded visits. A tiny step is labelled as such; it is not renamed a root certificate. The safeguarded branch returns a conditional bracket-radius status only after its actual retained interval becomes small. The secant keeps two values and has no hidden sign promise. These small helpers are teaching routines, not a replacement for a general numerical library; a callable that raises an exception or overflows needs its own handling."}</Prose>

<Prose>{"SciPy's "}<code>{"brentq"}</code>{" maintains a sign bracket while combining bisection and interpolation proposals. "}<code>{"newton"}</code>{" with "}<code>{"fprime"}</code>{" uses derivative information. We pass absolute and relative root tolerances explicitly to "}<code>{"brentq"}</code>{", and request result objects from both tools. "}<code>{"disp=False"}</code>{" allows an unsuccessful iterative result to be inspected rather than treating a convergence exception as the only interface. Invalid arguments can still raise errors. A result flag describes the documented stopping test, not a universal truth certificate."}</Prose>

<Payload file="library_roots.py"/><Prose>Recorded output:</Prose><Payload file="library_roots.stdout.txt" output/>

<Prose>{"The changed task "}<InlineMath>{"x^2-3"}</InlineMath>{" converges from start 2; the zero-derivative start for "}<InlineMath>{"x^2-2"}</InlineMath>{" stops visibly in the scratch method while the bracket route remains available. The repeated-root visits 3,2,1.5 approach the root 1 by halving its error from start 5. The secant's first value "}<InlineMath>{"4/3"}</InlineMath>{" matches the geometric construction. Counts are observations of this run, not a general ranking of method cost; evaluating one derivative can cost more than evaluating one function."}</Prose>

<span id="4-estimate-a-derivative-without-losing-the-signal"/>
<H2>{"5. Recover slope from nearby values"}</H2>

<Prose>{"To approximate the local slope of "}<InlineMath>{"\\sin x"}</InlineMath>{" at "}<InlineMath>{"x=1"}</InlineMath>{", sample at "}<InlineMath>{"x-h"}</InlineMath>{" and "}<InlineMath>{"x+h"}</InlineMath>{". The next drawing uses "}<InlineMath>{"h=.1"}</InlineMath>{" and follows the two signed contributions before dividing by "}<InlineMath>{"h"}</InlineMath>{"."}</Prose>

<Drawing id="NM18"/>

<Prose>{"When a derivative is unavailable, reuse function evaluations. A forward difference is "}<InlineMath>{"[f(x+h)-f(x)]/h"}</InlineMath>{". A central difference uses two sides, "}<InlineMath>{"[f(x+h)-f(x-h)]/(2h)"}</InlineMath>{". In the latter, the left sample contributes with coefficient "}<InlineMath>{"-1/2"}</InlineMath>{" and the right with "}<InlineMath>{"+1/2"}</InlineMath>{", before division by "}<InlineMath>{"h"}</InlineMath>{". The negative coefficient is not a negative location or necessarily a negative function value."}</Prose>

<Drawing id="NM19"/>

<Prose>{"For a smooth function, write Taylor expansions at the common center. The constant terms cancel in a forward subtraction, leaving "}<InlineMath>{"f'(x)h"}</InlineMath>{" plus an "}<InlineMath>{"h^2"}</InlineMath>{" term. Dividing by "}<InlineMath>{"h"}</InlineMath>{" makes its leading error proportional to "}<InlineMath>{"h"}</InlineMath>{". In the central subtraction, the constant and quadratic terms cancel:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"f(x+h)-f(x-h)=2h f'(x)+\\frac{h^3}{3}f'''(x)+\\text{higher terms}."}</MathBlock></div>

<Prose>{"Hence central differentiation has second-order truncation error. More precisely, if "}<InlineMath>{"|f'''|\\le M_3"}</InlineMath>{" throughout the sampled neighborhood, the exact-sample central error is bounded by "}<InlineMath>{"M_3 h^2/6"}</InlineMath>{". The corresponding forward bound with "}<InlineMath>{"|f''|\\le M_2"}</InlineMath>{" is "}<InlineMath>{"M_2 h/2"}</InlineMath>{". These are statements about exact sample values and derivative bounds, before rounding is included. "}<a href={"/learn/topic/single-variable-calculus-limits-derivatives-integrals#10-keep-the-remainder-with-the-approximation"}>{"Taylor remainders"}</a>{" explain why the neighborhood matters."}</Prose>

<Drawing id="NM20"/>

<Prose>{"The slopes to either side are "}<InlineMath>{"[f(x)-f(x-h)]/h"}</InlineMath>{" and "}<InlineMath>{"[f(x+h)-f(x)]/h"}</InlineMath>{". Their difference divided by "}<InlineMath>{"h"}</InlineMath>{" is"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"\\frac{f(x-h)-2f(x)+f(x+h)}{h^2},"}</MathBlock></div>

<Prose>{"an approximation to "}<InlineMath>{"f''(x)"}</InlineMath>{". Its units are output per input squared. For a quadratic it is exact in exact arithmetic. With a fourth-derivative bound "}<InlineMath>{"M_4"}</InlineMath>{", its truncation error is at most "}<InlineMath>{"M_4h^2/12"}</InlineMath>{". It measures changing slope, not another estimate of the first derivative."}</Prose>

<Drawing id="NM21"/>

<Prose>{"If "}<InlineMath>{"x-h"}</InlineMath>{" is outside the domain, a central formula is inappropriate. Seek a first derivative from "}<InlineMath>{"x,x+h,x+2h"}</InlineMath>{" with coefficients "}<InlineMath>{"a,b,c"}</InlineMath>{", all divided by "}<InlineMath>{"h"}</InlineMath>{". A constant should differentiate to 0, a line to its slope, and a quadratic's second-order term should cancel. This imposes "}<InlineMath>{"a+b+c=0"}</InlineMath>{", "}<InlineMath>{"b+2c=1"}</InlineMath>{" and "}<InlineMath>{"b+4c=0"}</InlineMath>{". Solve: "}<InlineMath>{"c=-1/2"}</InlineMath>{", "}<InlineMath>{"b=2"}</InlineMath>{", "}<InlineMath>{"a=-3/2"}</InlineMath>{"."}</Prose>

<Drawing id="NM22"/>

<Prose>{"For offsets "}<InlineMath>{"k=0,1,2"}</InlineMath>{", the weighted moments are "}<InlineMath>{"\\sum w_k=0"}</InlineMath>{", "}<InlineMath>{"\\sum k w_k=1"}</InlineMath>{", "}<InlineMath>{"\\sum k^2w_k=0"}</InlineMath>{". The next moment is "}<InlineMath>{"\\sum k^3w_k=-2"}</InlineMath>{", so the leading third-derivative contribution after dividing by "}<InlineMath>{"h"}</InlineMath>{" is "}<InlineMath>{"-f'''(x)h^2/3"}</InlineMath>{". The resulting formula "}<InlineMath>{"[-3f(x)+4f(x+h)-f(x+2h)]/(2h)"}</InlineMath>{" has second-order accuracy under sufficient smoothness. This derivation explains the coefficients and the boundary behavior; a coefficient table alone would not."}</Prose>

<Prose>{"The exact rational program checks all these moments and applies the rule to "}<InlineMath>{"x^3"}</InlineMath>{" at 1. For "}<InlineMath>{"h=1/2"}</InlineMath>{", the estimate is "}<InlineMath>{"5/2"}</InlineMath>{" rather than the derivative 3. At "}<InlineMath>{"h=1/4"}</InlineMath>{", it is "}<InlineMath>{"23/8"}</InlineMath>{". The errors "}<InlineMath>{"-1/2"}</InlineMath>{" and "}<InlineMath>{"-1/8"}</InlineMath>{" differ by a factor of four, exactly as the "}<InlineMath>{"h^2"}</InlineMath>{" term predicts."}</Prose>

<Payload file="stencil.py"/><Prose>Recorded output:</Prose><Payload file="stencil.stdout.txt" output/>

<Prose>{"The zeroth moment is zero, the first is one, and the second is zero. The cubic term remains. The directional check compares a scalar perturbation along (2,−1) with the locally derived gradient dotted with that same vector; it does not verify all possible inputs."}</Prose>

<Prose>{"The last line also computes a directional derivative, which we will unpack after distinguishing mathematical truncation from finite arithmetic."}</Prose>

<H2>{"6. Choose a useful finite step"}</H2>

<Drawing id="NM23"/>

<Prose>{"Suppose each sampled value has absolute error at most "}<InlineMath>{"\\eta"}</InlineMath>{", and subsequent subtraction/division are exact for this model. The central numerator can then have error at most "}<InlineMath>{"2\\eta"}</InlineMath>{", giving quotient error at most "}<InlineMath>{"\\eta/h"}</InlineMath>{". Together with the derivative bound,"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"|D_h-f'(x)|\\le M_3h^2/6+\\eta/h."}</MathBlock></div>

<Prose>{"The first term shrinks as "}<InlineMath>{"h"}</InlineMath>{" decreases; the second grows. With fixed positive "}<InlineMath>{"M_3,\\eta"}</InlineMath>{", differentiation of this envelope gives "}<InlineMath>{"h^3=3\\eta/M_3"}</InlineMath>{". For a first-order formula a model "}<InlineMath>{"Ah+B/h"}</InlineMath>{" gives square-root scaling instead. These models explain a tradeoff; their constants, independent sample-error assumption and omitted later rounding determine how literally to use the optimum. Machine precision alone is not a universal step size. Rescale the input or change the function magnitude and the useful dimensional "}<InlineMath>{"h"}</InlineMath>{" can change."}</Prose>

<Drawing id="NM24"/>

<Prose>{"Adding a constant leaves a mathematical derivative unchanged. But for "}<InlineMath>{"f(x)=10^{12}+x"}</InlineMath>{", nearby sampled values can round to the same stored value. The preserved central calculation at "}<InlineMath>{"x=1,h=10^{-5}"}</InlineMath>{" returns 0 even though the derivative is 1. The information was lost when storing the function values; dividing the zero difference by a small number cannot recover it. Rewriting a formula to avoid subtracting large nearly equal quantities can be more useful than shrinking "}<InlineMath>{"h"}</InlineMath>{"."}</Prose>

<Drawing id="NM25"/>

<Prose>{"In binary64 arithmetic, "}<InlineMath>{"1+10^{-20}=1"}</InlineMath>{" as a stored number. Here the algorithm never even asks the function at a distinct right-hand coordinate. This coordinate collapse differs from distinct coordinates producing equal rounded function values. Floating-point spacing depends on magnitude; the drawing is a local rounding neighborhood, not a uniformly spaced real-number grid."}</Prose>

<Prose>{"The next preserved program measures actual absolute error against "}<InlineMath>{"\\cos(1)"}</InlineMath>{" for central differences of sine. Initially the errors decrease approximately by a factor of 100 when "}<InlineMath>{"h"}</InlineMath>{" decreases by 10. Later they fluctuate and grow. Those recorded errors are empirical comparisons for this function and environment, distinct from the conditional envelope above. A displayed zero comparison would mean the computed floating-point values agree, not a proof of an exact real-number derivative."}</Prose>

<Payload file="differences.py"/><Prose>Recorded output:</Prose><Payload file="differences.stdout.txt" output/>

<Prose>{"The curve eventually becomes irregular as cancellation exposes evaluation rounding. Adding a constant leaves the mathematical derivative unchanged but can ruin this numerical difference. Last-bit errors can vary with the platform math library."}</Prose>

<Drawing id="NM26"/>

<Prose>{"Begin with sine, "}<InlineMath>{"x=1,h=.1"}</InlineMath>{", central first differentiation and zero offset. The samples feed the weighted arithmetic before the answer. Switch to a forward, central-second or second-order one-sided stencil, then change "}<InlineMath>{"x"}</InlineMath>{" to .7 or the step exponent to 4.5. An offset of "}<InlineMath>{"10^8"}</InlineMath>{" changes arithmetic sensitivity without changing the analytic derivative. Coincident coordinates produce a refusal rather than a manufactured result. The error plot uses a separate labelled rail for computed zero, since "}<InlineMath>{"\\log 0"}</InlineMath>{" is undefined. Reset restores the entire initial state."}</Prose>

<Drawing id="NM27"/>

<Prose>{"For "}<InlineMath>{"F(x,y)=x^2+3xy+2y^2"}</InlineMath>{", the gradient at "}<InlineMath>{"(1,2)"}</InlineMath>{" is "}<InlineMath>{"(8,11)"}</InlineMath>{". Along direction "}<InlineMath>{"v=(2,-1)"}</InlineMath>{", the directional derivative is "}<InlineMath>{"(8,11)\\cdot(2,-1)=5"}</InlineMath>{". A central directional quotient evaluates "}<InlineMath>{"F((1,2)+hv)"}</InlineMath>{" and "}<InlineMath>{"F((1,2)-hv)"}</InlineMath>{", then divides their difference by "}<InlineMath>{"2h"}</InlineMath>{". This is derivative per unit of the path parameter "}<InlineMath>{"h"}</InlineMath>{"; "}<InlineMath>{"v"}</InlineMath>{" has length "}<InlineMath>{"\\sqrt5"}</InlineMath>{", so it is not derivative per unit Euclidean distance unless normalized. Both evaluations must use the same underlying function state and data. Agreement on one direction is a useful check, not proof of an entire gradient implementation."}</Prose>

<Prose>{"The complete ordinary-tool file below first makes all four stencils explicit with their sample locations and coefficients. It rejects collapsed coordinates. Each fixed stencil costs two or three samples. Then "}<code>{"scipy.differentiate.derivative"}</code>{" adapts a higher-order finite-difference calculation. Its callable accepts arrays elementwise; passing a scalar-only "}<code>{"math.sin"}</code>{" would not meet that contract. "}<code>{"hessian"}</code>{" receives a leading coordinate axis: in the one-dimensional case the callable uses "}<code>{"coordinates[0]"}</code>{" and the result is a "}<InlineMath>{"1\\times1"}</InlineMath>{" matrix in the "}<code>{"ddf"}</code>{" field. The remaining axes are evaluation batches, not additional problem coordinates."}</Prose>

<Payload file="library_differentiation.py"/><Prose>Recorded output:</Prose><Payload file="library_differentiation.stdout.txt" output/>

<Prose>{"The reported "}<code>{"error"}</code>{" is the tool's estimate from successive approximations; "}<code>{"success"}</code>{", "}<code>{"status"}</code>{" and "}<code>{"nfev"}</code>{" describe its stopping decision and work. In this run the first derivative uses 11 evaluations and the nested Hessian uses 121; these counts belong to these tolerances and function. A right-sided endpoint call for the exponential shows the "}<code>{"step_direction=1"}</code>{" contract. The exact second derivative of sine is "}<InlineMath>{"-\\sin(1)"}</InlineMath>{", so comparing the Hessian with "}<InlineMath>{"\\cos(1)"}</InlineMath>{" would be the wrong target. Practice later checks an actual derivative of zero with explicit absolute tolerances."}</Prose>

<Prose>{""}<strong>{"Pause and retrieve."}</strong>{" Why might moving samples closer make the result worse? It reduces one truncation term while amplifying lost sample information, and eventually the input coordinates themselves can coincide."}</Prose>

<span id="5-turn-local-shapes-into-total-area"/>
<H2>{"7. Integrate the shape between samples"}</H2>

<Drawing id="NM28"/>

<Prose>{"Given endpoint heights "}<InlineMath>{"f(a)"}</InlineMath>{" and "}<InlineMath>{"f(b)"}</InlineMath>{", choose a straight line between them. Its area is width times average height: "}<InlineMath>{"(b-a)[f(a)+f(b)]/2"}</InlineMath>{". On "}<InlineMath>{"x^2"}</InlineMath>{" over "}<InlineMath>{"[0,.5]"}</InlineMath>{", the heights are 0 and .25, giving area "}<InlineMath>{"1/16"}</InlineMath>{". On "}<InlineMath>{"[.5,1]"}</InlineMath>{", the area is "}<InlineMath>{"5/16"}</InlineMath>{". Their sum is "}<InlineMath>{"3/8"}</InlineMath>{", larger than the exact integral "}<InlineMath>{"1/3"}</InlineMath>{" because the chords lie above this convex curve. The "}<strong>{"trapezoid rule"}</strong>{" is exact for the selected line, not for every curve through the same two endpoints."}</Prose>

<Drawing id="NM29"/>

<Prose>{"For "}<InlineMath>{"n"}</InlineMath>{" equal subintervals of width "}<InlineMath>{"h=(b-a)/n"}</InlineMath>{", each interior sample belongs to two neighboring trapezoids. Adding the areas gives"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"T_n=h\\left[\\frac{f(a)}2+\\sum_{i=1}^{n-1}f(a+ih)+\\frac{f(b)}2\\right]."}</MathBlock></div>

<Prose>{"If "}<InlineMath>{"f"}</InlineMath>{" has a continuous second derivative with "}<InlineMath>{"|f''|\\le M_2"}</InlineMath>{", then "}<InlineMath>{"|T_n-I|\\le (b-a)M_2h^2/12"}</InlineMath>{". The "}<InlineMath>{"x^2"}</InlineMath>{" example has "}<InlineMath>{"M_2=2"}</InlineMath>{", and its positive error equals "}<InlineMath>{"1/(6n^2)"}</InlineMath>{". A bound requires the function-class assumption; sampled endpoints alone do not supply "}<InlineMath>{"M_2"}</InlineMath>{"."}</Prose>

<Drawing id="NM30"/>

<Prose>{"A quadratic through three equally spaced samples can model curvature. On normalized coordinates "}<InlineMath>{"u=-1,0,1"}</InlineMath>{", the three basis polynomials are "}<InlineMath>{"u(u-1)/2"}</InlineMath>{", "}<InlineMath>{"1-u^2"}</InlineMath>{" and "}<InlineMath>{"u(u+1)/2"}</InlineMath>{". Each is 1 at its own sample and 0 at the others. Their integrals over "}<InlineMath>{"[-1,1]"}</InlineMath>{" are "}<InlineMath>{"1/3,4/3,1/3"}</InlineMath>{". Multiplying by the three sample heights and the coordinate scale yields "}<strong>{"Simpson's rule"}</strong>{" on a pair of subintervals:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"\\int_{x_0}^{x_2}f(x)\\,dx\\approx\\frac h3[f(x_0)+4f(x_1)+f(x_2)]."}</MathBlock></div>

<Prose>{"The basis curves have signed portions; drawing all three as positive blocks would conceal how interpolation works. Symmetry also makes the rule exact for cubics in exact arithmetic: the unrepresented odd cubic component integrates to zero on the centered pair."}</Prose>

<Drawing id="NM31"/>

<Prose>{"Composite Simpson requires an even number "}<InlineMath>{"n"}</InlineMath>{" of equal subintervals for this classic pairing. Endpoints have weight 1, odd interior indices weight 4, and even interior indices weight 2, all multiplied by "}<InlineMath>{"h/3"}</InlineMath>{". Under a continuous fourth-derivative bound "}<InlineMath>{"M_4"}</InlineMath>{", the error is at most "}<InlineMath>{"(b-a)M_4h^4/180"}</InlineMath>{". The higher order needs the stronger smoothness and spacing assumptions. Odd "}<InlineMath>{"n"}</InlineMath>{" leaves an unpaired interval; do not silently pretend the classic formula covers it."}</Prose>

<Drawing id="NM32"/>

<Prose>{"The default "}<InlineMath>{"x^2"}</InlineMath>{", "}<InlineMath>{"[0,1]"}</InlineMath>{", "}<InlineMath>{"n=4"}</InlineMath>{" shows actual linear interpolants and total .34375. Select a panel to trace its area into the sum, or switch to Simpson to obtain "}<InlineMath>{"1/3"}</InlineMath>{" up to arithmetic. Change "}<InlineMath>{"n"}</InlineMath>{" or switch to sine; odd "}<InlineMath>{"n"}</InlineMath>{" remains valid for trapezoids and is refused by this classic Simpson implementation. The cream reference is an analytic mathematical integral, not a measured physical truth."}</Prose>

<Drawing id="NM33"/>

<Prose>{"For times "}<InlineMath>{"[0,.5,2]"}</InlineMath>{" and rates "}<InlineMath>{"[0,2,2]"}</InlineMath>{", the contributions are "}<InlineMath>{".5(0+2)/2=.5"}</InlineMath>{" and "}<InlineMath>{"1.5(2+2)/2=3"}</InlineMath>{", totaling 3.5 units. Sample indices cannot replace time coordinates. The complete preserved program compares refinement on a known curve and then handles these unequal widths directly."}</Prose>

<Payload file="quadrature.py"/><Prose>Recorded output:</Prose><Payload file="quadrature.stdout.txt" output/>

<Prose>{"Trapezoids overestimate this convex quadratic, while Simpson is exact in exact arithmetic. The measured record gives areas 0.5 and 3, not the result of pretending the times are equally spaced. Between measured points, the line is an assumption."}</Prose>

<Drawing id="NM34"/>

<Prose>{"Now switch from an evaluable formula to observations. The frozen USGS record is from station USGS-01646500, Potomac River near Washington, DC, Little Falls Pump Station, on 1 January 2024 from 00:00 to 02:00 UTC. The nine instantaneous observations, 15 minutes apart, are 9640,9640,9730,9730,9640,9640,9640,9640,9640 cubic feet per second. Their recorded approval status is Approved. That label is part of the source metadata, not a statement that a line between measurements is exact."}</Prose>

<Prose>{"Each ordinary interval lasts 900 seconds. For example, between 00:15 and 00:30, the area is "}<InlineMath>{"900(9640+9730)/2=8{,}716{,}500"}</InlineMath>{" cubic feet. Summing the eight piecewise-linear panels gives "}<InlineMath>{"69{,}570{,}000"}</InlineMath>{" cubic feet. The full shaded plot starts at zero; a separately labelled inset shows only excess above 9640. Shading from a cropped vertical baseline and calling it the total volume would misrepresent the calculation."}</Prose>

<Drawing id="NM35"/>

<Prose>{"Refining a grid of an analytic function asks for new information. In a fixed record, adding an interpolated midpoint simply repeats an existing modeling choice; it does not reveal a new observation. Comparing two interpolants or deleting a row diagnoses sensitivity to that choice, not the unknown true-volume error. Sensor uncertainty, the discharge rating relationship and variation between observations remain outside this nine-point integration calculation."}</Prose>

<Prose>{"The complete file below reads the offline CSV, parses time zones, takes actual elapsed seconds and multiplies rate by width. Scratch summation and SciPy "}<code>{"trapezoid"}</code>{" use identical rows and supplied coordinates. Neither route silently sorts data; the scratch route requires increasing times. The constructed "}<InlineMath>{"x^2"}</InlineMath>{" comparison uses equally spaced samples and SciPy "}<code>{"simpson"}</code>{", a different assumption from the observed record. Keep "}<code>{"usgs-discharge.csv"}</code>{" beside the file, or pass "}<code>{"--csv"}</code>{" with its path. The "}<code>{"--omit-time"}</code>{" branch preserves actual coordinates and refuses a missing or nonunique timestamp."}</Prose>

<Payload file="library_sampled.py"/><Prose>Recorded output:</Prose><Payload file="library_sampled.stdout.txt" output/>

<Prose>{"The file takes linear time in the number of observations. Storing all rows supports inspection; a running trapezoid sum could use constant extra memory. SciPy and scratch agreeing is a useful implementation comparison, but both share the same interpolation premise. Practice will deliberately remove the 00:30 observation and explain the changed panels by hand."}</Prose>

<span id="6-refine-where-the-function-needs-attention"/>
<H2>{"8. Spend evaluations where they help"}</H2>

<Drawing id="NM36"/>

<Prose>{"Uniform refinement samples every region equally. If a function bends sharply in one narrow region, we would rather spend new evaluations there. To make a local decision, first understand a common estimator. Suppose "}<InlineMath>{"A(h)=I+ch^p+\\text{higher terms}"}</InlineMath>{" and "}<InlineMath>{"A(h/2)=I+ch^p/2^p+\\text{higher terms}"}</InlineMath>{". Their difference estimates the leading fine-grid error. Eliminating "}<InlineMath>{"c"}</InlineMath>{" gives"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"I\\approx A(h/2)+\\frac{A(h/2)-A(h)}{2^p-1}."}</MathBlock></div>

<Prose>{"This is "}<strong>{"Richardson extrapolation"}</strong>{". It depends on a useful leading error expansion. Agreement of two estimates alone cannot prove that both are close to the true integral."}</Prose>

<Prose>{"Use the resolved peak "}<InlineMath>{"f(x)=1/[1+400(x-.35)^2]"}</InlineMath>{" on "}<InlineMath>{"[0,1]"}</InlineMath>{". How much does one Simpson panel change when it is split into two? The comparison below follows its endpoints, midpoint and two new quarter points."}</Prose>

<Drawing id="NM37"/>

<Prose>{"For Simpson refinement, the leading composite error has order four, so "}<InlineMath>{"2^4-1=15"}</InlineMath>{". On one interval, coarse Simpson uses the two endpoints and midpoint. Two half-interval rules reuse those three values and add the quarter points. If their sum is "}<InlineMath>{"S_{\\mathrm{fine}}"}</InlineMath>{" and the coarse value is "}<InlineMath>{"S_{\\mathrm{coarse}}"}</InlineMath>{", estimate error with "}<InlineMath>{"|S_{\\mathrm{fine}}-S_{\\mathrm{coarse}}|/15"}</InlineMath>{" and use the corrected value "}<InlineMath>{"S_{\\mathrm{fine}}+(S_{\\mathrm{fine}}-S_{\\mathrm{coarse}})/15"}</InlineMath>{"."}</Prose>

<Drawing id="NM38"/>

<Prose>{"If the estimate exceeds the interval's budget "}<InlineMath>{"\\varepsilon"}</InlineMath>{", split the interval and give each child "}<InlineMath>{"\\varepsilon/2"}</InlineMath>{". Each child's new test adds its own quarter points while reusing its endpoints and midpoint. Sum accepted leaves and their estimated errors. The assigned budgets add to the original budget, but the estimates still depend on the error model. The implementation must also bound depth and evaluations; exhausting either is distinct from satisfying the estimator."}</Prose>

<Prose>{"The reference implementation caches each evaluated coordinate, checks an evaluation budget, and carries a depth bound. Read the recursive branch as a local question followed by either acceptance or two child questions. The cache takes memory proportional to evaluated points; active recursion uses memory proportional to depth. A difficult function can force much more work than a smooth one."}</Prose>

<Payload file="adaptive.py"/><Prose>Recorded output:</Prose><Payload file="adaptive.stdout.txt" output/>

<Prose>{"The error estimate guides work under a smoothness model. Exceeding a limit returns a failure state. This standalone teaching program is adaptive Simpson, not SciPy QUADPACK."}</Prose>

<Prose>{"On the constructed peak "}<InlineMath>{"1/[1+400(x-.35)^2]"}</InlineMath>{", the preserved run uses 113 evaluations and reports .146146195, estimated error "}<InlineMath>{"3.43\\times10^{-7}"}</InlineMath>{", and actual comparison error "}<InlineMath>{"9.64\\times10^{-9}"}</InlineMath>{". The analytic reference is "}<InlineMath>{"[\\arctan(13)+\\arctan(7)]/20"}</InlineMath>{". The two error numbers have different meanings; an estimate is not expected to equal the realized error. The deliberately small evaluation budget stops as a work limit."}</Prose>

<Drawing id="NM39"/>

<Prose>{"Begin with the peak, tolerance "}<InlineMath>{"10^{-6}"}</InlineMath>{" and maximum depth 1. The output shows the actual sample cache, leaf intervals and acceptance or exhaustion state. Controls directly beneath it change tolerance and permitted depth. Select a leaf to inspect its actual coarse/fine comparison and local budget. Switching to the blind fixture changes the question substantially: more permitted work does not compel work after an early acceptance. Reset returns to the peak and the shallow budget."}</Prose>

<Drawing id="NM40"/>

<Prose>{"Let "}<InlineMath>{"g(x)=[x(x-\\tfrac14)(x-\\tfrac12)(x-\\tfrac34)(x-1)]^2"}</InlineMath>{" on "}<InlineMath>{"[0,1]"}</InlineMath>{". Its five initial samples are all zero. Both Simpson estimates are therefore zero, as is their discrepancy. Yet the function is nonnegative and positive between its roots. Exact coefficient integration gives "}<InlineMath>{"5/1419264\\approx3.522952742\\times10^{-6}"}</InlineMath>{". Smoothness alone does not rescue this finite-sample estimator. The drawn curve uses illustrative display samples separate from the algorithm's five observations; those extra points cannot secretly count as evidence available to the algorithm."}</Prose>

<Drawing id="NM41"/>

<Prose>{"An endpoint singularity creates another problem. For "}<InlineMath>{"x^{-1/2}"}</InlineMath>{" on "}<InlineMath>{"[0,1]"}</InlineMath>{", the integral is finite, but evaluating at zero is not. Cutting off at "}<InlineMath>{"\\delta"}</InlineMath>{" omits area "}<InlineMath>{"2\\sqrt\\delta"}</InlineMath>{"; with "}<InlineMath>{"\\delta=10^{-6}"}</InlineMath>{", the missing .002 is much larger than "}<InlineMath>{"10^{-6}"}</InlineMath>{". Instead set "}<InlineMath>{"x=u^2"}</InlineMath>{". For "}<InlineMath>{"u>0"}</InlineMath>{", "}<InlineMath>{"x^{-1/2}dx=(1/u)(2u\\,du)=2\\,du"}</InlineMath>{", with a continuous limiting value 2 at zero. The substitution changes both height and width. It is not valid merely to replace an awkward curve with a constant without its Jacobian."}</Prose>

<Payload file="blind.py"/><Prose>Recorded output:</Prose><Payload file="blind.stdout.txt" output/>

<Prose>{"The polynomial is positive between its roots, but the initial Simpson estimates both vanish. Exact coefficient integration supplies an independent reference. The singularity example shows why changing variables can be better than silently omitting a troublesome endpoint."}</Prose>

<Prose>{"The fraction calculation is an independent exact polynomial oracle for the constructed blind example. It does not become a generic error bound for unknown functions. For unfamiliar endpoint behavior, inspect limits and possible substitutions before mechanically raising a work budget; "}<a href={"/learn/topic/single-variable-calculus-limits-derivatives-integrals#11-check-what-happens-at-the-edge"}>{"the calculus endpoint section"}</a>{" develops this reasoning."}</Prose>

<Prose>{"The ordinary route below calls "}<code>{"quad"}</code>{", whose QUADPACK algorithms differ from adaptive Simpson. "}<code>{"full_output=1"}</code>{" supplies a work dictionary and may append a diagnostic message. We therefore inspect the full returned tuple instead of assuming every call returns three items. For these finite unweighted calls, "}<code>{"neval"}</code>{" counts evaluations and "}<code>{"last"}</code>{" counts active subintervals. Its error goal uses "}<InlineMath>{"\\max(\\mathrm{epsabs},\\mathrm{epsrel}|I|)"}</InlineMath>{"; a diagnostic still needs interpretation, not merely a tolerance argument in source."}</Prose>

<Payload file="library_adaptive.py"/><Prose>Recorded output:</Prose><Payload file="library_adaptive.stdout.txt" output/>

<Prose>{"The resolved peak uses 189 evaluations here; the one-subinterval call uses 21, misses the requested accuracy and appends its maximum-subdivision message. The printed zero reference difference in the successful run means its binary64 output equals the chosen binary64 analytic reference at this precision, not exact real arithmetic. The transformed constant integrates directly. We do not claim "}<code>{"quad"}</code>{" must reproduce the scratch algorithm's five-node blind spot: it samples different points using a different rule."}</Prose>

<Prose>{""}<strong>{"Pause and retrieve."}</strong>{" Why does a zero estimated error fail to prove an integral is correct? A finite set of values can miss behavior between them, and an error model may be uninformative on the particular function."}</Prose>

<span id="7-choose-nodes-and-compose-error-budgets"/>
<H2>{"9. Choose locations as well as weights"}</H2>

<Prose>{"Can we choose two sample locations as well as their weights? On "}<InlineMath>{"[-1,1]"}</InlineMath>{", seek symmetric nodes "}<InlineMath>{"-a,+a"}</InlineMath>{" with a common weight, and require exact integrals first for the constant function and then for "}<InlineMath>{"x^2"}</InlineMath>{"."}</Prose>

<Drawing id="NM42"/>

<Prose>{"So far we chose an equal grid. When a callable can be evaluated wherever we choose, locations can also be designed. Seek a symmetric rule on "}<InlineMath>{"[-1,1]"}</InlineMath>{" with nodes "}<InlineMath>{"-c,c"}</InlineMath>{" and equal weights "}<InlineMath>{"w"}</InlineMath>{". Exactness for the constant 1 requires "}<InlineMath>{"2w=2"}</InlineMath>{", so "}<InlineMath>{"w=1"}</InlineMath>{". Exactness for "}<InlineMath>{"x^2"}</InlineMath>{" requires "}<InlineMath>{"2wc^2=2/3"}</InlineMath>{", so "}<InlineMath>{"c=1/\\sqrt3"}</InlineMath>{". Odd moments cancel by symmetry. These two nodes therefore integrate every polynomial through degree three exactly in exact arithmetic. This is the two-node "}<strong>{"Gauss–Legendre rule"}</strong>{", derived from the moments rather than memorized."}</Prose>

<Drawing id="NM43"/>

<Prose>{"Map "}<InlineMath>{"u\\in[-1,1]"}</InlineMath>{" to "}<InlineMath>{"x=m+du"}</InlineMath>{", where "}<InlineMath>{"m=(a+b)/2"}</InlineMath>{" and "}<InlineMath>{"d=(b-a)/2"}</InlineMath>{". Then "}<InlineMath>{"dx=d\\,du"}</InlineMath>{". The rule becomes"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"\\int_a^b f(x)\\,dx\\approx d[f(m-d/\\sqrt3)+f(m+d/\\sqrt3)]."}</MathBlock></div>

<Prose>{"On "}<InlineMath>{"[2,4]"}</InlineMath>{", the nodes are "}<InlineMath>{"3\\pm1/\\sqrt3"}</InlineMath>{" and "}<InlineMath>{"d=1"}</InlineMath>{". That special factor of one can hide a common error. On "}<InlineMath>{"[1,4]"}</InlineMath>{", "}<InlineMath>{"d=1.5"}</InlineMath>{" and must multiply the weighted sum. Choosing locations is useful for a callable but does not conjure measurements at unobserved Gaussian nodes."}</Prose>

<Drawing id="NM44"/>

<Prose>{"For "}<InlineMath>{"x^4"}</InlineMath>{", the two-node sum is "}<InlineMath>{"2/9"}</InlineMath>{" while the integral is "}<InlineMath>{"2/5"}</InlineMath>{". The signed error is "}<InlineMath>{"-8/45"}</InlineMath>{". Exactness through degree three says nothing about exactness at degree four. More generally, "}<InlineMath>{"n"}</InlineMath>{" Gauss–Legendre nodes integrate through degree "}<InlineMath>{"2n-1"}</InlineMath>{", but smooth-function errors still need hypotheses and do not vanish merely because the nodes have a special name."}</Prose>

<Payload file="gaussian.py"/><Prose>Recorded output:</Prose><Payload file="gaussian.stdout.txt" output/>

<Prose>{"The first four monomials match. For x⁴ the rule gives 2/9 instead of 2/5, so smoothness alone does not make it exact. Moving from [−1,1] to [2,4] requires both relocated nodes and the interval scale factor."}</Prose>

<Prose>{"The ordinary route obtains the two nodes and weights with "}<code>{"roots_legendre(2)"}</code>{", compares them with the derivation, and carries the radius through two interval maps. Once nodes are available, the weighted sum takes one evaluation per node. General node-construction algorithms are outside this two-node derivation."}</Prose>

<Payload file="library_gaussian.py"/><Prose>Recorded output:</Prose><Payload file="library_gaussian.stdout.txt" output/>

<Prose>{"The roughly "}<InlineMath>{"10^{-16}"}</InlineMath>{" node discrepancy is arithmetic, while the .177777778 degree-four miss is the rule's approximation error. Their very different sizes and causes should not be merged into one generic notion of precision."}</Prose>

<Prose>{"We can now read the original compact synthesis program without guessing its algorithms. Its bisection preserves a positive-root bracket, its central sine difference uses two samples, and its trapezoid integral sums endpoint and interior weights. The complete source and its earlier observed output are retained."}</Prose>

<Payload file="original.py"/><Prose>Recorded output:</Prose><Payload file="original.stdout.txt" output/>

<Prose>{"The root agrees after rounding, but that alone is not a proof of its accuracy. The derivative uses a finite secant and the area uses four trapezoids; each differs from its analytic reference. Sections 5–8 explained how to control those differences; the next section combines inner integration error with an outer root decision."}</Prose>

<Prose>{"Its 30 bisections, "}<InlineMath>{"h=.1"}</InlineMath>{" and four panels are distinct work choices answering distinct questions. The printed values 1.414214, .539402 and 1.896119 should each be interpreted against the relevant target and assumptions; the six displayed decimal places are not six guaranteed accurate decimals."}</Prose>

<H2>{"10. Let an inner error change an outer decision"}</H2>

<Drawing id="NM45"/>

<Prose>{"Return to "}<InlineMath>{"r(t)=te^{-t}"}</InlineMath>{" and target .8 litres. Suppose each candidate volume comes from "}<InlineMath>{"n"}</InlineMath>{" trapezoid panels rather than the analytic formula. Since "}<InlineMath>{"r''(t)=(t-2)e^{-t}"}</InlineMath>{", "}<InlineMath>{"|r''(t)|\\le2"}</InlineMath>{" for "}<InlineMath>{"t\\ge0"}</InlineMath>{". The trapezoid bound on "}<InlineMath>{"[0,T]"}</InlineMath>{" is therefore"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"|V_n(T)-V(T)|\\le E_n(T)=\\frac{T^3}{6n^2}."}</MathBlock></div>

<Prose>{"This is a discretization bound assuming reliable evaluation and summation. The displayed intervals are not outward-rounded floating-point enclosures, and they do not cover physical-model uncertainty. Those qualifications remain attached to every following conditional decision."}</Prose>

<Drawing id="NM46"/>

<Prose>{"The true volume lies in "}<InlineMath>{"[V_n-E_n,V_n+E_n]"}</InlineMath>{" under that bound. If the upper endpoint is below the target, the candidate time is too early. If the lower endpoint is above it, the time is too late. If the interval straddles the target, the sign is "}<strong>{"unresolved"}</strong>{". Refine the inner integral instead of discarding an outer half from the center estimate. An unresolved sign is useful information about the calculation, not a software malfunction."}</Prose>

<Drawing id="NM47"/>

<Prose>{"On "}<InlineMath>{"[2,4]"}</InlineMath>{", "}<InlineMath>{"V'(T)=Te^{-T}"}</InlineMath>{" is positive and decreases, so its lower bound is "}<InlineMath>{"m=4e^{-4}\\approx.0732625556"}</InlineMath>{" litres per minute. For a candidate "}<InlineMath>{"T"}</InlineMath>{" and the unique target time "}<InlineMath>{"T_*"}</InlineMath>{" in this bracket, the mean value theorem yields"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"|T-T_*|\\le\\frac{|V(T)-v_*|}{m}\n\\le\\frac{|V_n(T)-v_*|+E_n(T)}m."}</MathBlock></div>

<Prose>{"The numerator has litres and the denominator litres/minute, giving minutes. Resolving the sign and proving a requested time accuracy are different decisions. A sharply estimated volume at a poor candidate can still leave a large time error."}</Prose>

<Drawing id="NM48"/>

<Prose>{"At target .8, candidate 3 and eight panels, the estimate is .7880480 while its interval still contains the target. Increase panels without moving the candidate. At 128 panels, the estimate .8008014 has a resolved positive sign, but the conditional time bound .014688 remains larger than .01. The actual model-reference time error is about .005691653. Failing to establish a tolerance does not prove the true error exceeds it."}</Prose>

<Prose>{"Edit the target within the established bracket, the candidate from 2 to 4, and the panel count. The changed task .7 litres at 2.44 minutes with 32 panels appears again in practice. These controls change the calculation, with the primary volume interval before them and the detailed panel ledger afterward. Reset returns to target .8, candidate 3 and eight panels."}</Prose>

<Payload file="calibration.py"/><Prose>Recorded output:</Prose><Payload file="calibration.stdout.txt" output/>

<Prose>{"The conditional bound concerns trapezoid discretization plus residual and uses a known positive minimum slope. Ordinary float evaluation adds an un-enclosed rounding contribution. Even an accurate integral cannot compensate for choosing a candidate too far from the target."}</Prose>

<Prose>{"The reference search in this preserved program uses the analytic primitive solely to assess the example. It is not available to justify the numerical sign in a general problem without an analytic primitive."}</Prose>

<Drawing id="NM49"/>

<Prose>{"The complete search begins with outer bracket "}<InlineMath>{"[2,4]"}</InlineMath>{". At its midpoint, start with eight inner panels. Check the conditional time bound, then check whether the interval resolves a sign. If neither succeeds, increase panels, bounded by the work limit. Only a resolved sign changes the outer bracket. A sufficiently small outer radius can independently stop the search; coordinate stagnation and budget exhaustion have separate statuses."}</Prose>

<Prose>{"The default target .8 and maximum 128 panels first use "}<InlineMath>{"8,16,32,64,128"}</InlineMath>{" panels at candidate 3. With only eight permitted panels, the very first sign remains unresolved. With 128, the preserved run eventually returns 2.992188, radius .007812, after 20 inner integral calls. The investigation shows which actions have actually been stepped through and labels any future-trace preview separately."}</Prose>

<Prose>{"A final permitted refinement need not double. With target .79 at candidate 3 and maximum 24, the sequence is "}<strong>{"8→16→24"}</strong>{". The first two estimates .7880480411 and .7976354607 have bounds .0703125 and .017578125, both straddling .79. At 24 panels, .7994210060 with bound .0078125 is wholly above .79, so the upper endpoint may become 3, retaining "}<InlineMath>{"[2,3]"}</InlineMath>{". The original "}<code>{"min(2*panels,max_panels)"}</code>{" matters: stopping at 16 merely because 32 exceeds the budget would miss this valid final action."}</Prose>

<Payload file="nestedCalibration.py"/><Prose>Recorded output:</Prose><Payload file="nestedCalibration.stdout.txt" output/>

<Prose>{"The eight-panel search stops with unresolved sign instead of discarding a half-bracket. With enough inner work it can report a conditional time bound. These guarantees use the mathematical trapezoid bound and reliable arithmetic; the program is not an outward-rounded interval-arithmetic solver."}</Prose>

<Prose>{"Read the ordering: an already small bracket can finish before another integral; a small conditional time bound can finish at the current candidate; a resolved sign updates the bracket; only an unresolved sign at the actual maximum stops for the inner limit. Reset returns the entire outer/inner trace and controls to the declared default."}</Prose>

<Prose>{"An ordinary root finder wrapped around "}<code>{"quad(...)[0]-target"}</code>{" discards the inner error estimate and can make an unreliable sign decision. Such a composition may work numerically on a case, but it does not inherit this conditional interval argument. To make the same claim, preserve an appropriate inner-error contract throughout the outer search. For rigorous machine enclosures, one would additionally need validated evaluations and outward rounding, beyond the displayed mathematical bounds."}</Prose>

<span id="8-transfer-the-error-discipline"/>
<H2>{"11. Carry the discipline into larger calculations"}</H2>

<Prose>{"Can a tiny output residual hide a large input error? Take "}<InlineMath>{"A=\\operatorname{diag}(1,10^{-6})"}</InlineMath>{", right side "}<InlineMath>{"b=(1,10^{-6})"}</InlineMath>{", and candidate "}<InlineMath>{"\\widehat x=(1,0)"}</InlineMath>{". Compare that candidate with the exact solution "}<InlineMath>{"(1,1)"}</InlineMath>{" through the matrix action."}</Prose>

<Drawing id="NM50"/>

<Prose>{"The matrix compresses the second coordinate by a factor of "}<InlineMath>{"10^{-6}"}</InlineMath>{". The residual norm is only "}<InlineMath>{"10^{-6}"}</InlineMath>{" because the second coordinate is compressed by the matrix, while the solution error is 1. The two numbers live in different spaces. For nonsingular "}<InlineMath>{"A"}</InlineMath>{", "}<InlineMath>{"x-\\widehat x=A^{-1}(b-A\\widehat x)"}</InlineMath>{", so amplification by the inverse connects residual to error."}</Prose>

<Prose>{"The maintained "}<a href={"/learn/topic/matrix-decompositions-svd-qr-cholesky-lu#2-lu-eliminate-store-and-reuse"}>{"LU lesson"}</a>{" supplies complete partial-pivoting, forward/back substitution and reusable-factor programs, plus ordinary library solves. Its "}<a href={"/learn/topic/matrix-decompositions-svd-qr-cholesky-lu#6-numerical-answers-need-more-than-a-small-residual"}>{"sensitivity example"}</a>{" uses "}<InlineMath>{"10^{-8}"}</InlineMath>{"; our preserved illustration uses "}<InlineMath>{"10^{-6}"}</InlineMath>{". The scale changes, while the weak-direction reasoning stays the same. This section does not claim to implement another full linear solver."}</Prose>

<Drawing id="NM51"/>

<Prose>{"For cooling "}<InlineMath>{"y'=-ky"}</InlineMath>{", forward Euler uses "}<InlineMath>{"y_{j+1}=y_j+h(-ky_j)=(1-kh)y_j"}</InlineMath>{". Starting from an exact value, Taylor expansion shows a one-step defect of order "}<InlineMath>{"h^2"}</InlineMath>{" under smoothness. The next step usually starts from a computed value, so previous error is propagated as well as new error introduced. Over a fixed time interval, about "}<InlineMath>{"T/h"}</InlineMath>{" local defects contribute; with appropriate stability and regularity, Euler has global error of order "}<InlineMath>{"h"}</InlineMath>{", not "}<InlineMath>{"h^2"}</InlineMath>{"."}</Prose>

<Drawing id="NM52"/>

<Prose>{"For "}<InlineMath>{"k=2"}</InlineMath>{", "}<InlineMath>{"T=3"}</InlineMath>{" seconds and "}<InlineMath>{"y(0)=1"}</InlineMath>{", the exact value is "}<InlineMath>{"e^{-6}"}</InlineMath>{". With "}<InlineMath>{"h=1"}</InlineMath>{", the multiplier is "}<InlineMath>{"-1"}</InlineMath>{": after three steps Euler gives "}<InlineMath>{"-1"}</InlineMath>{". With "}<InlineMath>{"h=.5"}</InlineMath>{", it is zero: the first step lands at zero and stays there. Smaller steps .25 and .125 give .00024414 and .00100339, approaching .00247875. All comparisons use the same time, not the same number of steps. For decay with "}<InlineMath>{"k>0"}</InlineMath>{", the scalar stability condition is "}<InlineMath>{"|1-kh|<1"}</InlineMath>{", or "}<InlineMath>{"0<kh<2"}</InlineMath>{"; nonnegative monotone decay further needs "}<InlineMath>{"0<kh\\le1"}</InlineMath>{". Stability does not itself establish a requested accuracy."}</Prose>

<Payload file="transfer.py"/><Prose>Recorded output:</Prose><Payload file="transfer.stdout.txt" output/>

<Prose>{"The diagonal solve amplifies a residual in its small-coefficient direction. The Euler comparisons all end at the same physical time. The SciPy lines report real library status and an estimated quadrature error, rather than declaring all errors controlled by one flag."}</Prose>

<Prose>{"The final lines preserve the earlier ordinary Brent and quadrature comparisons as part of that complete program. They do not change Euler's method or give it the library solver's diagnostics."}</Prose>

<Prose>{"For an ordinary ODE route, "}<code>{"solve_ivp"}</code>{" with RK45 adapts its internal steps using local error estimates. Explicit output times make comparison fair. "}<code>{"t_eval"}</code>{" requests where to report values; it does not force the internal step sequence. The documented local scale uses "}<code>{"atol + rtol*abs(y)"}</code>{". It is not a guarantee that global error at every reporting time is below that same number. Status and message describe reaching the endpoint or stopping; work and analytic comparisons provide additional evidence."}</Prose>

<Payload file="library_ode.py"/><Prose>Recorded output:</Prose><Payload file="library_ode.stdout.txt" output/>

<Prose>{"The tighter tolerances increase observed evaluations from 50 to 374 and reduce the final model-reference error from about "}<InlineMath>{"7.881\\times10^{-6}"}</InlineMath>{" to "}<InlineMath>{"5.398\\times10^{-11}"}</InlineMath>{". The relation is empirical for this smooth scalar problem. It is neither a universal work ratio nor proof of global accuracy for a stiff or discontinuous model. Euler uses one right-hand-side evaluation per step; different adaptive algorithms have different per-step costs."}</Prose>

<Prose>{"For oscillation rather than decay, a method can change the qualitative dynamics. The maintained "}<a href={"/learn/topic/dynamical-systems-theory-chaos#10-check-the-dynamics-of-the-numerical-method"}>{"Dynamics numerical-method section"}</a>{" uses "}<InlineMath>{"q'=p,p'=-q"}</InlineMath>{" with kick-then-drift symplectic Euler. Its preserved modified quantity is "}<InlineMath>{"(q^2+p^2-hqp)/2"}</InlineMath>{", with a positive definite bound only for "}<InlineMath>{"|h|<2"}</InlineMath>{". Do not replace that qualification with a claim that all step sizes conserve physical energy. Its fixed horizon is 20; our cooling comparison ends at 3 seconds."}</Prose>

<Drawing id="NM53"/>

<Prose>{"Automatic differentiation propagates derivatives through implemented arithmetic operations by the chain rule. For "}<InlineMath>{"x^2+3xy+2y^2"}</InlineMath>{", the local contributions to the first coordinate are "}<InlineMath>{"2x+3y"}</InlineMath>{", and to the second "}<InlineMath>{"3x+4y"}</InlineMath>{". At "}<InlineMath>{"(1,2)"}</InlineMath>{", they form "}<InlineMath>{"(8,11)"}</InlineMath>{" and reproduce the directional value 5. AD uses no finite-difference step "}<InlineMath>{"h"}</InlineMath>{", but finite arithmetic, branches and differentiation conventions still matter. It differentiates the implemented computation, not necessarily an ideal physical process."}</Prose>

<Prose>{"The maintained "}<a href={"/learn/topic/multivariate-calculus-gradients#8-use-sensitivity-and-compute-it-reliably"}>{"Multivariate derivative computation"}</a>{" includes a complete small Dual-number implementation for addition, multiplication and sine, on "}<InlineMath>{"x^2y+\\sin x"}</InlineMath>{". That is a different function from our local polynomial and a limited forward-mode implementation, not a promised production reverse-mode engine. Use finite differences as a complementary check with controlled state, not as a proof of correctness for every AD result."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><span id="9-practise-with-changed-problems"/>
<H2>{"12. Practise changed decisions"}</H2>

<Prose>{"Try the questions before opening the hints. The solutions name the assumptions and distinguish a computation from an accuracy claim. The twelve mathematical questions retain their answers; the repair extensions ask you to change the implementation on new inputs."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. A bracket and its assumptions"}</H3>

<Prose>{"A continuous function has opposite signs on [−1,3]. How many interval halvings ensure the current midpoint is within 0.01 of some root? Does the same argument work for 1/x on [−1,3]?"}</Prose>

<Prose>{""}<strong>{"Implementation repair."}</strong>{" Repair a loop that reports the full bracket width as its midpoint radius and updates both endpoints after evaluating a midpoint. Implement one sign-preserving update for "}<InlineMath>{"f(x)=x^2-3"}</InlineMath>{" on "}<InlineMath>{"[1,2]"}</InlineMath>{". The repaired first result must be "}<InlineMath>{"[1.5,2]"}</InlineMath>{", with midpoint-radius .25 for that new bracket. State when an endpoint or midpoint is already an exact root."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The midpoint radius is the initial width divided by 2^(k+1). Continuity is a separate premise."}</Prose>

<Prose>{""}<strong>{"Repair hint."}</strong>{" Cache both endpoint values; after checking zeros, replace exactly the endpoint with the midpoint’s sign. Recompute half the retained width."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The radius is 2/2ᵏ. Seven halvings leave 0.015625, which is too large; eight leave 0.0078125, which meets the target. For 1/x the function is discontinuous and undefined at zero; the opposite signs do not establish a root. If the function were continuous with several roots, the bracket argument would establish proximity to a root in that interval, not a selected root elsewhere."}</Prose>

<Prose>{""}<strong>{"Repair solution."}</strong>{" A corrected single update keeps the two opposite signs and calculates the radius from the retained endpoints:"}</Prose>

<CodeBlock language={"python"}>{"def bracket_step(f, a, b):\n    fa, fb = f(a), f(b)\n    if fa == 0:\n        return a, a, 0.0\n    if fb == 0:\n        return b, b, 0.0\n    if (fa < 0) == (fb < 0):\n        raise ValueError(\"Opposite signs required\")\n    m = a + (b-a)/2\n    fm = f(m)\n    if fm == 0:\n        return m, m, 0.0\n    if (fa < 0) == (fm < 0):\n        a = m\n    else:\n        b = m\n    return a, b, (b-a)/2"}</CodeBlock>

<Prose>{"Here f(1)=−2, f(1.5)=−.75 and f(2)=1. Only the lower endpoint changes. The new candidate is 1.75 with radius .25; do not attach that new radius to the old midpoint1.5."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. A repeated root"}</H3>

<Prose>{"For f(x)=(x−2)², start Newton at x=6. Give three updates and the error pattern. Why is a sign bracket [0,4] unavailable?"}</Prose>

<Prose>{""}<strong>{"Implementation repair."}</strong>{" Repair a Newton update that divides before checking its derivative. Apply it to the changed repeated-root function above from x=6, then call it at x=2. The latter call must return the exact root without dividing by zero; a nonroot with zero derivative must remain a distinct refusal."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Simplify x−(x−2)²/[2(x−2)] before substituting values."}</Prose>

<Prose>{""}<strong>{"Repair hint."}</strong>{" Evaluate f first. Test exact zero, then test the derivative before computing the quotient."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The update is (x+2)/2 away from x=2, giving 4, 3, 2.5. Errors 4, 2, 1, 0.5 halve. The root is multiple and f′(2)=0, so the simple-root quadratic result does not apply. Both endpoint values are 4; absence of opposite signs does not rule out the touching root."}</Prose>

<Prose>{""}<strong>{"Repair solution."}</strong>{" A bounded one-step function separates the two zero cases:"}</Prose>

<CodeBlock language={"python"}>{"def tangent_step(f, df, x):\n    value = f(x)\n    if value == 0:\n        return x, \"computed root\"\n    slope = df(x)\n    if slope == 0:\n        return None, \"zero derivative at nonroot\"\n    return x-value/slope, \"tangent step\""}</CodeBlock>

<Prose>{"For (x−2)² from6 this returns4; successive calls return3 and2.5. Calling at2 returns the computed root. For x²−2 at0 it refuses instead of producing a spurious root. A nonzero slope alone does not certify convergence."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Derive boundary weights"}</H3>

<Prose>{"Derive the one-sided first-derivative weights at x, x+h and x+2h. Then check it on f(x)=x³ at x=1 with h=1/2 and h=1/4."}</Prose>

<Prose>{""}<strong>{"Implementation repair."}</strong>{" Implement those weights with a callable function. Test the changed polynomial "}<InlineMath>{"f(x)=x^4"}</InlineMath>{" at x=2, h=.25 and h=.125. Preserve the three actual coordinates; reject h=0 or a step that makes them coincide. Success requires estimates30.90625 and31.73828125 against exact derivative32."}</Prose>

<details><summary>Hint</summary>

<Prose>{"For weights a,b,c divided by h, require a+b+c=0, b+2c=1 and b+4c=0."}</Prose>

<Prose>{""}<strong>{"Repair hint."}</strong>{" Use (−3f(x)+4f(x+h)−f(x+2h))/(2h). Check coordinates before the weighted arithmetic."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Subtracting the last two equations gives c=−1/2, then b=2 and a=−3/2. The weighted cubic gives 3−2h², hence 5/2 and 23/8, with signed errors −1/2 and −1/8. Halving h divides this truncation error by four. The complete Fraction program earlier executes this changed-function check exactly; it does not rely on subtracting rounded decimal references."}</Prose>

<Prose>{""}<strong>{"Repair solution."}</strong>{" The implementation exposes both its weighted samples and the unavailable-coordinate condition:"}</Prose>

<CodeBlock language={"python"}>{"def boundary_derivative(f, x, h):\n    nodes = (x, x+h, x+2*h)\n    if h == 0 or len(set(nodes)) != 3:\n        raise ValueError(\"Three distinct samples required\")\n    values = [f(t) for t in nodes]\n    return (-3*values[0]+4*values[1]-values[2])/(2*h)"}</CodeBlock>

<Prose>{"For x⁴ the estimate is 4x³−8xh²−6h³. At x=2 the errors are−1.09375 and−.26171875. Their ratio is not exactly four because the cubic-in-h term also remains; the leading asymptotic error is second order."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Choose a finite step"}</H3>

<Prose>{"For a central difference, suppose |f'''|≤6 and each sample has error at most 10⁻⁶. Compare the model bounds at h=0.1, 0.01 and 0.001. What does adding a huge constant to f change?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The bound becomes h²+10⁻⁶/h. A constant leaves the derivative unchanged but can change the magnitude of floating-point evaluation error."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The three bounds are 0.01001, 0.0002 and 0.001001. Among these choices, 0.01 has the smallest bound. This is a sample-error model, not a prediction that the actual error equals the bound. A huge constant can enlarge rounding in the sampled values; the fixed η assumption must then be reconsidered. At a true derivative of zero, report absolute error rather than divide by zero to form relative error."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Unequal sensor intervals"}</H3>

<Prose>{"A sensor records times [0,1,3] seconds and rates [1,3,1] units/second. Estimate the accumulated amount with piecewise-linear interpolation. Why is the equally spaced Simpson formula inappropriate?"}</Prose>

<Prose>{""}<strong>{"Implementation repair."}</strong>{" Repair a sampled trapezoid implementation that replaces every interval width by the first width. Use changed times[0,2,5] and rates[2,6,4]; it must return23. Then repair composite Simpson code that assigns weight4 to every interior node: integrate x³ on[0,2] with n=4 and obtain4."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Compute each width separately before averaging its endpoint heights."}</Prose>

<Prose>{""}<strong>{"Repair hint."}</strong>{" Sampled widths come from consecutive coordinates. Simpson interior weights alternate4,2,4; each endpoint has weight1."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The first interval contributes 1×(1+3)/2=2 units. The second contributes 2×(3+1)/2=4 units. Total: 6 units. The sample positions are not equally spaced, so the classic equal-spacing Simpson weights do not describe the interpolant. Even 6 is an estimate based on the line-between-samples assumption; unobserved behavior could change the physical total."}</Prose>

<Prose>{""}<strong>{"Repair solution."}</strong>{" Both repaired sums preserve the operation that their weights describe:"}</Prose>

<CodeBlock language={"python"}>{"def sampled_trapezoid(times, rates):\n    if len(times) != len(rates) or len(times) < 2:\n        raise ValueError(\"Matching observations required\")\n    if any(b <= a for a, b in zip(times, times[1:])):\n        raise ValueError(\"Increasing actual times required\")\n    return sum((times[i+1]-times[i])*(rates[i]+rates[i+1])/2\n               for i in range(len(times)-1))\n\ndef composite_simpson(f, a, b, n):\n    if n <= 0 or n % 2:\n        raise ValueError(\"Positive even n required\")\n    h = (b-a)/n\n    total = f(a)+f(b)\n    for i in range(1, n):\n        total += (4 if i % 2 else 2)*f(a+i*h)\n    return h*total/3"}</CodeBlock>

<Prose>{"The unequal panels contribute8 and15. For x³ with h=.5, the weighted sum is24, so Simpson gives4. Reusing equal-spacing weights on the irregular records would answer a different interpolation question."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. A scaled blind spot"}</H3>

<Prose>{"An adaptive routine reports zero error on the blind polynomial. Scale that polynomial by 1000: what do its five initial samples and its true integral become? Then explain what increasing only the recursion limit achieves."}</Prose>

<Prose>{""}<strong>{"Implementation repair."}</strong>{" Repair the adaptive split branch that gives each child the full parent tolerance and reevaluates shared nodes. Build the two child work items on[0,1] with budget.004, using a cache already containing0,.5,1. Each child must receive.002, and splitting both once more must leave exactly9 unique coordinates—not15 calls."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Scaling preserves the roots. If the initial estimator already accepts, a larger permitted recursion depth does not request any extra samples."}</Prose>

<Prose>{""}<strong>{"Repair hint."}</strong>{" Split the budget, not the already estimated error. Use coordinate keys so a shared endpoint or midpoint is evaluated once."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"All five samples remain zero, and both Simpson estimates still vanish. The true integral becomes 625/177408 ≈ 0.00352295. Increasing only the recursion limit changes nothing in this path. You need information that changes sampling or supplies a valid function-class bound; a larger work allowance does not force exploration. The earlier exact-coefficient program can be changed by multiplying each final coefficient by 1000."}</Prose>

<Prose>{""}<strong>{"Repair solution."}</strong>{" This helper repairs the child construction independently of an acceptance test:"}</Prose>

<CodeBlock language={"python"}>{"def split_work(f, a, b, budget, cache):\n    def value(x):\n        if x not in cache:\n            cache[x] = f(x)\n        return cache[x]\n    m = a+(b-a)/2\n    children = []\n    for left, right in [(a, m), (m, b)]:\n        centre = left+(right-left)/2\n        samples = tuple(value(x) for x in (left, centre, right))\n        children.append((left, right, budget/2, samples))\n    return children"}</CodeBlock>

<Prose>{"After the first split the cache has five nodes. Splitting both children adds only1/8,3/8,5/8,7/8, giving nine total, and the four grandchildren each receive.001. This repairs accounting and reuse; it does not cure the blind polynomial, whose original acceptance test requests no split at all."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Gaussian exactness has a boundary"}</H3>

<Prose>{"Use the two-node Gauss–Legendre rule on x⁴ over [−1,1]. Compute its signed error. What additional factor appears if you map a rule from [−1,1] to [a,b]?"}</Prose>

<Prose>{""}<strong>{"Implementation repair."}</strong>{" Repair a two-node Gaussian implementation that moves its nodes but forgets to multiply by the map radius. Test x² on[2,5]: the incorrect sum is26; the repaired value must be39, equal to (5³−2³)/3."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Each fourth power is 1/9. The substitution x=(a+b)/2+(b−a)u/2 also changes dx."}</Prose>

<Prose>{""}<strong>{"Repair hint."}</strong>{" The radius is(5−2)/2=1.5. It multiplies the entire weighted sum after the two relocated evaluations."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The estimate is 2/9, the exact integral is 2/5, and estimate minus exact is −8/45. Exactness through degree three does not extend to degree four. The general-interval sum needs the multiplicative factor (b−a)/2 as well as the relocated nodes; moving the nodes alone loses the units and interval length."}</Prose>

<Prose>{""}<strong>{"Repair solution."}</strong>{" The map changes both coordinates and integration width:"}</Prose>

<CodeBlock language={"python"}>{"import math\n\ndef gauss_two(f, a, b):\n    centre, radius = (a+b)/2, (b-a)/2\n    offset = radius/math.sqrt(3)\n    return radius*(f(centre-offset)+f(centre+offset))"}</CodeBlock>

<Prose>{"The relocated squared values sum to26. Multiplication by1.5 gives39. This cubic-exact rule integrates the changed quadratic exactly in real arithmetic; the earlier x⁴ counterexample remains outside its degree guarantee."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Sign and time accuracy"}</H3>

<Prose>{"At T=3, suppose a volume estimate is 0.801 litres with error at most 0.0002 litres. The target is 0.8 and the minimum slope is 0.073 litres/minute. Is the sign resolved? Is time accuracy 0.01 minutes established?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Check the whole volume interval, then divide residual plus volume error by the lower slope."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The volume interval [0.8008,0.8012] is entirely above 0.8, so the sign is resolved under the bound's assumptions. The time bound is (0.001+0.0002)/0.073 ≈ 0.01644 minutes, so it does not establish 0.01 minutes. The actual time error might be smaller; failing to certify a requested tolerance is not proof of exceeding it. Reducing the integral error alone leaves a residual contribution, so improving the candidate can be necessary."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Change the pump target"}</H3>

<Prose>{"Write a changed calibration run for target 0.7 litres, candidate 2.44 minutes and 32 trapezoid panels. Compute the signed residual, integral bound and conditional time bound. Then compare with the analytic crossing."}</Prose>

<Prose>{""}<strong>{"Implementation repair."}</strong>{" Repair the inner-refinement branch that doubles n unconditionally and rejects a non-power-of-two maximum. Starting with n=8 and maximum24, produce8→16→24, then report the work limit if the sign remains unresolved. The already taught target.79,T=3 case must retain[2,4] until the third evaluation establishes above-target."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Reuse the three helper functions in the calibration program. Replace the target/candidate and use the same derivative lower bound on [2,4]."}</Prose>

<Prose>{""}<strong>{"Repair hint."}</strong>{" Use min(2n, maximum), and distinguish reaching the work limit from resolving the sign."}</Prose>

</details>

<details><summary>Solution</summary>

<Payload file="changedCalibration.py"/><Prose>Recorded output:</Prose><Payload file="changedCalibration.stdout.txt" output/>

<Prose>{"The residual interval straddles zero, so this bound cannot resolve the sign. The conditional time bound exceeds the actual error, as intended. An inconclusive bound does not mean that the candidate must be poor."}</Prose>

<Prose>{""}<strong>{"Repair solution."}</strong>{" The next requested count must increase without exceeding the budget:"}</Prose>

<CodeBlock language={"python"}>{"def next_inner_count(n, maximum):\n    if n >= maximum:\n        return None\n    return min(2*n, maximum)"}</CodeBlock>

<Prose>{"Calls from8 and16 give16 and24; the next call givesNone. The caller may change the outer bracket only after the full conditional interval is on one side of the target. At.79 the24-panel interval permits[2,3]; at an unresolved sign, None means a work-limit stop, not permission to shrink."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"10. Compare the same physical time"}</H3>

<Prose>{"For cooling x'=−2x at a fixed time of three seconds, compare Euler with h=1 and h=1/2. Explain why this does not contradict its local second-order defect."}</Prose>

<details><summary>Hint</summary>

<Prose>{"There are three and six steps respectively. Use (1−2h)^n and compare with exp(−6)."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"With h=1, the multiplier is −1 and the three-step result is −1. With h=1/2, the first update is zero and the final result remains zero. The exact state is exp(−6) ≈ 0.00247875. A local asymptotic error expansion describes sufficiently small h; it does not promise useful accuracy at every large step. Over a fixed time interval many local errors propagate, so a global first-order result and a local second-order defect are compatible."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"11. A missing river observation and a unit error"}</H3>

<Prose>{"Remove the USGS observation at 2024-01-01T00:30:00Z while preserving the remaining actual timestamps. What replaces its two adjacent panels, and how much does the piecewise-linear total change? Separately, what happens if minute widths are accidentally treated as seconds while retaining rates in cubic feet per second?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The old 00:15→00:30 and 00:30→00:45 panels have widths 900 seconds. The replacement spans 1800 seconds from rate 9640 to rate 9730. Keep the reduced-record comparison distinct from a units mistake."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The old areas are 8,716,500 and 8,757,000 cubic feet, totaling 17,473,500. The replacement is "}<InlineMath>{"1800(9640+9730)/2=17{,}433{,}000"}</InlineMath>{". The difference is "}<InlineMath>{"-40{,}500"}</InlineMath>{", so the reduced record gives 69,529,500 cubic feet instead of 69,570,000. Neither total has a known physical oracle error from these records alone. The missing observation changes the chosen interpolant, not the duration of the window."}</Prose>

<Prose>{"Using minute widths with the same numerical rates yields a number smaller by 60: 1,159,500, incorrectly labelled cubic feet. Convert rates to cubic feet per minute or widths to seconds; do not mix them. Run the same complete "}<code>{"library_sampled.py"}</code>{" file with "}<code>{"--omit-time 2024-01-01T00:30:00Z --minutes-as-seconds"}</code>{". Its complete recorded output is:"}</Prose>

<Payload file="library_sampled-omit-time.stdout.txt" output/>

<Prose>{"The timestamp parser accepts a UTC "}<code>{"Z"}</code>{" suffix or explicit offset and compares instants. A missing or repeated requested instant is an error, so a typo cannot silently become an unchanged dataset."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"12. What did the stopping test establish?"}</H3>

<Prose>{"For "}<InlineMath>{"x^2"}</InlineMath>{" at zero, compare the actual derivative diagnostics with absolute tolerances "}<InlineMath>{"10^{-8}"}</InlineMath>{" and "}<InlineMath>{"10^{-12}"}</InlineMath>{". Then run Newton on "}<InlineMath>{"e^{1000x}"}</InlineMath>{" from zero with derivative "}<InlineMath>{"1000e^{1000x}"}</InlineMath>{" and step tolerance .01. Finally, evaluate "}<InlineMath>{"10^{-12}(x-1)"}</InlineMath>{" at zero. Which result concerns derivative-estimate agreement, which concerns step size, and which is merely an equation residual?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The first derivative really is zero, so relative error alone is unhelpful. The Newton proposal subtracts "}<InlineMath>{"1/1000"}</InlineMath>{". The exponential is positive for every finite real input. Scaling the last function does not move its root."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Run "}<code>{"library_differentiation.py --zero-derivative"}</code>{". Both chosen absolute tolerances produce "}<code>{"df=0"}</code>{", estimated error 0, success and status 0 in the recorded environment. This is an actual outcome, not an invented nonconvergence warning for all zero derivatives. The absolute tolerance has derivative units; the reported error is the library's successive-estimate discrepancy, not a rigorous universal bound."}</Prose>

<Payload file="library_differentiation-zero-derivative.stdout.txt" output/>

<Prose>{"Run "}<code>{"library_roots.py --step-stop"}</code>{". The first Newton proposal is "}<InlineMath>{"-.001"}</InlineMath>{", whose step size is smaller than .01, yet its residual is "}<InlineMath>{"e^{-1}\\approx.367879441"}</InlineMath>{". The library reports convergence after one iteration according to its step criterion. There is no finite real root. Separately, the scaled linear residual at zero is "}<InlineMath>{"-10^{-12}"}</InlineMath>{" while its root remains 1 and the location error is 1. One example invalidates the inference from small step to a root; the other invalidates the inference from small residual to small input error without a sensitivity bound."}</Prose>

<Payload file="library_roots-step-stop.stdout.txt" output/>

<Prose>{"The remedy is to report what was actually checked, add the problem's mathematical assumptions and inspect useful independent evidence. Replacing the printed flag with the word “verified” would strengthen the claim without strengthening the calculation."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><span id="10-next-connections-and-learning-resources"/>
<H2>{"13. Report an answer and continue"}</H2>

<Prose>{"You are ready to move on when you can choose a new function or small measured record and explain the target, units, method assumptions, error evidence and failure behavior without copying the example's justification. Construct one bisection update, one derivative stencil and one quadrature panel by hand. Then explain a case where refinement should stop or an accuracy claim should be withheld."}</Prose>

<NeuralTable caption={"13. Report an answer and continue"} headers={[<>{"Input and question"}</>,<>{"Useful starting method"}</>,<>{"What to report with its answer"}</>]} rows={[[<>{"Continuous callable with a reliable sign bracket"}</>,<>{"Bisection or a bracket-preserving hybrid"}</>,<>{"Endpoint assumptions, retained interval/radius, work and status"}</>],[<>{"Callable with a useful derivative near a simple root"}</>,<>{"Newton, with safeguards when appropriate"}</>,<>{"Start, derivative failure behavior, step/residual and sensitivity evidence"}</>],[<>{"Nearby evaluable values and a needed derivative"}</>,<>{"A domain-compatible stencil or adaptive differentiation"}</>,<>{"Sample coordinates, units, step choice, arithmetic limits and diagnostics"}</>],[<>{"Fixed observations"}</>,<>{"Coordinate-aware trapezoids or justified interpolation"}</>,<>{"Times/units, interpolation premise and unsampled uncertainty"}</>],[<>{"Smooth callable integral"}</>,<>{"Adaptive quadrature or an appropriate Gaussian rule"}</>,<>{"Work, estimates, domain/singularity handling and model assumptions"}</>],[<>{"Root of an approximate integral"}</>,<>{"Explicit inner/outer error decisions"}</>,<>{"Unresolved signs, conditional bounds and separate work limits"}</>]]} />

<Prose>{"The next topic is "}<a href={"/learn/topic/functional-analysis-rkhs"}>{"Functional Analysis & RKHS"}</a>{". Derivatives and integrals act on functions; function spaces and norms make sensitivity and convergence questions precise. For numerical extensions, "}<a href={"/learn/topic/conditioning-stability-numerical-analysis"}>{"Conditioning, Stability & Numerical Analysis"}</a>{" develops the relation between problem sensitivity and algorithm behavior. Follow the stated prerequisites for ODE and Numerical PDE applications; the scalar examples here do not establish their full stability theories."}</Prose></section>

<section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning" data-lesson-resource-list=""><H3>{"Learn another way"}</H3>

<ul><li>{""}<a href={"https://fncbook.com/python/newton/"}>{"Driscoll & Braun: Newton's method"}</a>{" gives another written tangent derivation and local convergence discussion. Read it after the root investigations."}</li><li>{""}<a href={"https://fncbook.com/python/fd-converge/"}>{"Finite-difference convergence"}</a>{" develops Taylor cancellation and observed step sweeps. Use it when smaller steps stop helping."}</li><li>{""}<a href={"https://fncbook.com/python/adaptive/"}>{"Adaptive integration"}</a>{" offers another refinement implementation. Compare its estimated-error reasoning with the explicit child budgets here."}</li><li>{""}<a href={"https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/resources/lecture-12-square-roots-newtons-method/"}>{"MIT OCW, Square Roots and Newton's Method"}</a>{" and its "}<a href={"https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/d16678659cb7c98d611f12e7c1f7298d_MIT6_006F11_lec12.pdf"}>{"lecture notes"}</a>{" offer a video/notes route to iterative refinement. The page and notes were reviewed; full video viewing is not claimed. High-precision arithmetic complexity is optional depth."}</li></ul></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references" data-lesson-resource-list=""><H3>{"Technical references and data"}</H3>

<ul><li>{""}<a href={"https://dlmf.nist.gov/3.4"}>{"NIST DLMF differentiation"}</a>{" and "}<a href={"https://dlmf.nist.gov/3.5"}>{"quadrature"}</a>{" state formulas and their hypotheses, including Newton–Cotes and Gaussian rules."}</li><li>{"SciPy "}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.brentq.html"}>{"brentq"}</a>{" and "}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.newton.html"}>{"newton"}</a>{" define root tolerances and result flags; "}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.differentiate.derivative.html"}>{"derivative"}</a>{" and "}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.differentiate.hessian.html"}>{"hessian"}</a>{" define array shapes, estimated errors and work fields."}</li><li>{"SciPy "}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.integrate.trapezoid.html"}>{"trapezoid"}</a>{", "}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.integrate.simpson.html"}>{"simpson"}</a>{", "}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.integrate.quad.html"}>{"quad"}</a>{" and "}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.special.roots_legendre.html"}>{"roots_legendre"}</a>{" distinguish sampled and callable routes. "}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.integrate.solve_ivp.html"}>{"solve_ivp"}</a>{" defines local tolerances, output times and status for the ODE example."}</li><li>{"The "}<a href={"https://api.waterdata.usgs.gov/ogcapi/v1/?f=html"}>{"USGS water-data API"}</a>{" supplies the public-domain observations. This lesson distributes a frozen nine-row CSV rather than depending on a live request. The series is 66a4e3fb8abe42fcb0942b5c0fe98f68, statistic 00011, instantaneous Points; the saved metadata identifies units and approval. The response was generated 2026-10-08T22:15:48.082253Z and retrieval had completed by the saved 22:25:15.727007Z checkpoint. An exact client-completion timestamp was not captured. Values were last modified 2025-07-16 according to the saved response."}</li></ul></section>

<H3>{"Complete files and execution context"}</H3>

<Prose>{"The thirteen preserved programs retain their prior outputs and qualifications; they were not rerun for this writing revision. The six new ordinary-tool programs and their three changed branches were executed with Python 3.12.14, NumPy 2.3.5 and SciPy 1.18.1. The inspected online SciPy documentation displayed 1.18.0 at research time; use the recorded execution versions when comparing exact diagnostics. Install NumPy/SciPy in an isolated Python environment if needed, save each displayed complete file under its filename and run "}<code>{"python filename.py"}</code>{". Rational and elementary reference examples use the standard library; files importing SciPy need that dependency."}</Prose>

<NeuralTable caption={"Complete files and execution context"} headers={[<>{"Complete file"}</>,<>{"Reading location"}</>]} rows={[[<>{"bracket.py"}</>,<>{"Section 3"}</>],[<>{"newton.py"}</>,<>{"Section 4"}</>],[<>{"library_roots.py"}</>,<>{"Section 4"}</>],[<>{"stencil.py"}</>,<>{"Section 5"}</>],[<>{"differences.py"}</>,<>{"Section 6"}</>],[<>{"library_differentiation.py"}</>,<>{"Section 6"}</>],[<>{"quadrature.py"}</>,<>{"Section 7"}</>],[<>{"library_sampled.py"}</>,<>{"Section 7"}</>],[<>{"adaptive.py"}</>,<>{"Section 8"}</>],[<>{"blind.py"}</>,<>{"Section 8"}</>],[<>{"library_adaptive.py"}</>,<>{"Section 8"}</>],[<>{"gaussian.py"}</>,<>{"Section 9"}</>],[<>{"library_gaussian.py"}</>,<>{"Section 9"}</>],[<>{"original.py"}</>,<>{"Section 9"}</>],[<>{"calibration.py"}</>,<>{"Section 10"}</>],[<>{"nestedCalibration.py"}</>,<>{"Section 10"}</>],[<>{"transfer.py"}</>,<>{"Section 11"}</>],[<>{"library_ode.py"}</>,<>{"Section 11"}</>],[<>{"changedCalibration.py"}</>,<>{"Section 12"}</>],[<>{"usgs-discharge.csv"}</>,<>{"Offline supporting observations for section 7 and task 11"}</>]]} />

<Prose>Supporting observed data: <a href="/learn-assets/numerical-methods/usgs-discharge.csv" download="usgs-discharge.csv">Download observed CSV</a>. Keep this file beside <code>library_sampled.py</code> to reproduce the offline comparison.</Prose>

<Prose>{"Every source in this index is complete, including its imports and executable entry. Keep the CSV beside "}<code>{"library_sampled.py"}</code>{". Copy and Download provide these complete source files; the recorded outputs are observations and may differ slightly across versions or arithmetic environments. No file, image or success flag alone establishes correctness for all inputs."}</Prose></div>;}
