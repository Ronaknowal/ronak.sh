import {
  MFigure,
  MScene,
  MResponsive,
  MLabel,
  MArrow,
  MTable,
  MBars,
  mt,
  mc,
} from './MeasureReadingPrimitives.jsx';
import { informationState, preimageState } from '../../data/measure-theory-models.js';
import './measure-foundation.css';

const set = (faces) => (faces.length ? '{' + faces.join(', ') + '}' : '∅');
export function InformationPicture({ state, mass = true }) {
  return (
    <>
      <p>
        Information: {state.label}. Outline = one indivisible report cell; amber = included outcome.
      </p>
      <div className="mt-information-cells">
        {state.cells.map((cell, i) => (
          <div className="mt-information-cell" key={i}>
            <div className="mt-face-line">
              {cell.faces.map((face) => (
                <span
                  className={'mt-face' + (state.event.includes(face) ? ' mt-face--selected' : '')}
                  key={face}
                >
                  {face}
                </span>
              ))}
            </div>
            <p>
              Report {set(cell.faces)}
              {cell.split ? ' — split by the event' : ' — intact'}
            </p>
          </div>
        ))}
      </div>
      {mass && (
        <p>
          Event {set(state.event)} → P(event) = {mt(state.ambientProbability)}.{' '}
          {state.observable
            ? 'This report resolves membership.'
            : 'Identical reports can require different membership answers.'}
        </p>
      )}
    </>
  );
}
export function MapPicture({ state, showLaw = true, showEvent = true }) {
  return (
    <>
      <p>
        Source outcome → Z=max(face−3,0).{' '}
        {showEvent
          ? `The selected output event is z≤${mt(state.threshold)}. Amber sources belong to its preimage; the complete fibres retain their outlined output circles.`
          : 'Every source face has one arrow. Faces with the same output meet at the same outlined circle.'}
      </p>
      <div className="mt-map-groups">
        {state.law.map((item) => {
          const sources = state.rows.filter((row) => row.value === item.value);
          return (
            <div key={item.value}>
              <p>{showEvent ? 'Complete fibre' : 'Source faces'} {set(sources.map((row) => row.face))}</p>
              <MResponsive>
                {(width) => (
                  <MScene
                    label={'All source faces mapping to ' + item.value}
                    width={width}
                    height={50 + sources.length * 46}
                  >
                    {sources.map((row, i) => (
                      <g key={row.face}>
                        <MLabel x={12} y={35 + i * 46} colour={showEvent && row.selected ? mc[0] : '#ddd'}>
                          {row.face}
                        </MLabel>
                        <MArrow
                          x1={40}
                          y1={30 + i * 46}
                          x2={width - 53}
                          y2={30 + (sources.length - 1) * 23}
                          colour={showEvent && row.selected ? mc[0] : '#999'}
                        />
                      </g>
                    ))}
                    <circle
                      cx={width - 27}
                      cy={30 + (sources.length - 1) * 23}
                      r={18}
                      fill="none"
                      stroke={mc[1]}
                    />
                    <MLabel x={width - 27} y={35 + (sources.length - 1) * 23} anchor="middle">
                      {item.value}
                    </MLabel>
                  </MScene>
                )}
              </MResponsive>
              {showLaw && (
                <p>
                  Output {item.value}: mass {mt(item.probability)} from {sources.length} source{' '}
                  {sources.length === 1 ? 'face' : 'faces'}.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
function EventGlyphs({ faces, universe = [1, 2, 3, 4, 5, 6] }) {
  return (
    <div className="mt-face-line" aria-label={'Included outcomes ' + set(faces)}>
      {universe.map((face) => (
        <span key={face} className={'mt-face' + (faces.includes(face) ? ' mt-face--selected' : '')}>
          {face}
          {faces.includes(face) ? ' •' : ' ○'}
        </span>
      ))}
    </div>
  );
}
function WholeCellChoices({ state }) {
  return (
    <>
      <p>
        C1={'{1,2}'}, C2={'{3,4}'}, C3={'{5,6}'}. Read each row from the three whole-cell switches
        to the selected outcomes. A filled dot means included; an open circle means excluded. The
        pair boundaries remain intact.
      </p>
      {state.algebra.map((faces, index) => (
        <div className="mt-event-choice" key={index}>
          <p>
            Event {set(faces)}; mass {mt(faces.length / 6)}
          </p>
          <div className="mt-information-cells">
            {state.cells.map((cell, j) => (
              <div className="mt-information-cell" key={j}>
                <p>
                  C{j + 1}: {faces.includes(cell.faces[0]) ? '1' : '0'}
                </p>
                <EventGlyphs faces={faces} universe={cell.faces} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
function MissingUnion() {
  const pairs = [
    [[], [1, 2, 3]],
    [[1], [2, 3]],
    [[2], [1, 3]],
  ];
  return (
    <>
      <p>
        Universe Ω={set([1, 2, 3])}. The six available events occur in three complement pairs.
        Filled dots are members; open circles are outside the event.
      </p>
      {pairs.map(([a, b], i) => (
        <div className="mt-complement-pair" key={i}>
          <div>
            <p>{set(a)}</p>
            <EventGlyphs faces={a} universe={[1, 2, 3]} />
          </div>
          <p aria-label="complement corresponds to">↔ complement ↔</p>
          <div>
            <p>{set(b)}</p>
            <EventGlyphs faces={b} universe={[1, 2, 3]} />
          </div>
        </div>
      ))}
      <p>Union takes every filled position from either input:</p>
      {[
        ['A', [1]],
        ['B', [2]],
        ['A∪B — missing', [1, 2]],
      ].map(([label, faces]) => (
        <div key={label}>
          <p>
            {label}: {set(faces)}
          </p>
          <EventGlyphs faces={faces} universe={[1, 2, 3]} />
        </div>
      ))}
      <p>
        Repair the family by adding {set([1, 2])} and its complement {set([3])}. These are its only
        two missing subsets; the resulting eight-event family is the full power set.
      </p>
      <EventGlyphs faces={[3]} universe={[1, 2, 3]} />
    </>
  );
}
function CompletionPicture() {
  let intervals = [[0, 1]];
  const levels = [intervals];
  for (let n = 1; n <= 3; n++) {
    intervals = intervals.flatMap(([a, b]) => [
      [a, a + (b - a) / 3],
      [b - (b - a) / 3, b],
    ]);
    levels.push(intervals);
  }
  return (
    <>
      <p>
        Intervals generate the Borel event family through complements and countable unions. To see
        why a nonempty set can have zero length, repeatedly remove the open middle third of each
        retained interval.
      </p>
      {levels.map((cover, n) => (
        <div key={n}>
          <p>
            Closed cover C{n}: {2 ** n} {n === 0 ? 'interval' : 'intervals'}, total length (2/3)^{n}{' '}
            = {mt((2 / 3) ** n)}.
          </p>
          <MResponsive>
            {(width) => (
              <MScene
                label={'Actual retained intervals in null-set cover level ' + n}
                width={width}
                height={62}
              >
                {cover.map(([a, b], i) => (
                  <rect
                    key={i}
                    x={12 + a * (width - 24)}
                    y={10}
                    width={(b - a) * (width - 24)}
                    height={15}
                    fill={mc[1]}
                  />
                ))}
                <MLabel x={12} y={52}>
                  0
                </MLabel>
                <MLabel x={width - 12} y={52} anchor="end">
                  1
                </MLabel>
              </MScene>
            )}
          </MResponsive>
        </div>
      ))}
      <p>
        The intersection N=∩Cₙ is a closed Borel set. It contains 0 and 1, yet its length is at most
        (2/3)ⁿ for every n, so λ(N)=0. The displayed covers have positive length; they are not N
        itself.
      </p>
      <p>
        For any subset S⊆N, each same cover also covers S. Completion declares S measurable and
        assigns λ̄(S)=0, even when S was not Borel. It does not add ordinary interval area. These
        interval covers depict the null-set argument; no finite drawing pretends to decide an
        arbitrary subset's Borel status.
      </p>
      <MTable
        label="What completion adds to the event family"
        columns={['Object', 'Before completion', 'After completion']}
        rows={[
          ['Every Borel interval/event', 'Already measurable', 'Same original measure'],
          ['Known Borel null set N', 'Measurable, mass 0', 'Same mass 0'],
          ['An arbitrary S⊆N', 'May be outside the Borel family', 'Measurable, mass 0'],
        ]}
      />
    </>
  );
}
function RationalTranslates() {
  const sample = [0, Math.sqrt(2) / 4, Math.sqrt(3) / 4];
  return (
    <>
      <p>
        Choice selects one representative from every class x∼y ⇔ x−y is rational, giving V⊆[0,1].
        The three labelled marks below are only a finite illustration: 0, √2/4 and √3/4 have
        irrational pairwise differences and belong to different classes.
      </p>
      {[-0.5, 0, 0.5].map((q) => (
        <div key={q}>
          <p>Translate q={q}: each representative moves by the same signed distance.</p>
          <MResponsive>
            {(width) => {
              const x = (v) => 14 + ((v + 1) * (width - 28)) / 3;
              return (
                <MScene
                  label={
                    'Three distinct class representatives shifted by ' +
                    q +
                    ' on the same coordinate axis'
                  }
                  width={width}
                  height={155}
                >
                  <line x1={x(-1)} x2={x(2)} y1={123} y2={123} stroke="#888" />
                  {sample.map((v, i) => (
                    <g key={i}>
                      <line
                        x1={x(v)}
                        x2={x(v + q)}
                        y1={25 + i * 35}
                        y2={25 + i * 35}
                        stroke={mc[i + 1]}
                        strokeDasharray="3 3"
                      />
                      <circle cx={x(v + q)} cy={25 + i * 35} r={5} fill={mc[i + 1]} />
                      <MLabel x={x(v + q) + 10} y={30 + i * 35}>
                        {['a', 'b', 'c'][i]}
                      </MLabel>
                    </g>
                  ))}
                  <MLabel x={x(-1)} y={148}>
                    −1
                  </MLabel>
                  <MLabel x={x(2)} y={148} anchor="end">
                    2
                  </MLabel>
                </MScene>
              );
            }}
          </MResponsive>
        </div>
      ))}
      <p>
        The coloured class identities a, b, c persist through each translation; their labels remain
        distinct. The three vertical lanes separate identities; only horizontal position represents
        the number. The finite sample does not cover an interval. The full countable family uses
        every rational q∈[−1,1].
      </p>
      <p>
        If v+q=w+r, then v−w=r−q is rational. Representatives from the same class are identical, so
        v=w and q=r. Thus different full translates V+q are disjoint. Every x∈[0,1] has a
        representative v with rational x−v∈[−1,1], so [0,1]⊆∪q(V+q)⊆[−1,2].
      </p>
      <MTable
        label="Both possible lengths contradict the same containment"
        columns={[
          'Hypothetical common length m',
          'Countable disjoint sum',
          'Containment requirement',
        ]}
        rows={[
          ['m=0', 'Sum is 0', 'At least length 1: contradiction'],
          ['m>0', 'Infinitely many equal positive terms: ∞', 'At most length 3: contradiction'],
        ]}
      />
      <p>
        The contradiction assumes choice, translation invariance and countable additivity of
        ordinary length. It explains why that length cannot be defined on every subset of [0,1].
      </p>
    </>
  );
}
function EventFamily({ state }) {
  return (
    <MTable
      label="Every union of whole information cells, each counted once"
      columns={['Inclusion bits: cells 1, 2, 3', 'Event', 'P(event)']}
      rows={state.algebra.map((faces, i) => [
        state.cells.map((cell) => (faces.includes(cell.faces[0]) ? '1' : '0')).join(''),
        set(faces),
        mt(faces.length / 6),
      ])}
    />
  );
}
function Operation({ name, faces }) {
  return (
    <div className="mt-operation mt-event-choice">
      <p>
        {name} = {set(faces)}
      </p>
      <div className="mt-information-cells">
        {[
          [1, 2],
          [3, 4],
          [5, 6],
        ].map((cell, j) => (
          <div className="mt-information-cell" key={j}>
            <p>C{j + 1}</p>
            <EventGlyphs faces={faces} universe={cell} />
          </div>
        ))}
      </div>
    </div>
  );
}
function Cylinders() {
  const word = ['H', 'T', 'H', 'H'];
  return (
    <>
      <p>
        Target prefix H,T,H,H. Each next independent fair toss splits a cylinder into two equal-mass
        children. Cyan is the selected child; the other branch remains part of the model.
      </p>
      {[0, 1, 2, 3, 4].map((n) => (
        <div className="mt-cylinder" key={n}>
          <p>
            {n === 0 ? 'No observed toss' : word.slice(0, n).join(', ')}: probability{' '}
            {n === 0 ? '1' : '1/' + 2 ** n}. Future tosses remain unrestricted.
          </p>
          <MResponsive>
            {(width) => (
              <MScene label={'Cylinder mass after ' + n + ' tosses'} width={width} height={42}>
                <rect x={8} y={8} width={(width - 16) / 2 ** n} height={16} fill={mc[1]} />
                <line x1={8} x2={width - 8} y1={29} y2={29} stroke="#777" />
              </MScene>
            )}
          </MResponsive>
          {n < 4 && (
            <div className="mt-branch-pair">
              <span className={word[n] === 'H' ? 'mt-selected-child' : ''}>
                Next H → 1/{2 ** (n + 1)}
              </span>
              <span className={word[n] === 'T' ? 'mt-selected-child' : ''}>
                Next T → 1/{2 ** (n + 1)}
              </span>
            </div>
          )}
        </div>
      ))}
      <p>
        At n observations the selected cylinder has mass 2⁻ⁿ. Their intersection is one infinite
        sequence; continuity from above gives mass 0 after the infinite model is established.
      </p>
    </>
  );
}
export default function FoundationDrawing({ id }) {
  let picture;
  const even = informationState('full', 42),
    pairs = informationState('pairs', 3);
  switch (id) {
    case 'MT01':
      picture = (
        <>
          <p>Ω contains six outcome glyphs, each with mass 1/6.</p>
          <div className="mt-outcome-space" aria-label="Sample space Ω with selected event A">
            <p>Ω = {'{1,2,3,4,5,6}'}</p>
            <EventGlyphs faces={even.event} />
            <p>Filled amber dots: A = {'{2,4,6}'}. Open circles: outside A.</p>
          </div>
          <p>Each included outcome contributes 1/6. Thus P(A)=3×1/6=1/2.</p>
          <p>
            ℱ = all 64 subsets of Ω. P: ℱ → [0,1], A ↦ sum of the included face masses. P(∅)=0;
            P(Ω)=1. The probability rule is separate from the outcomes and events.
          </p>
        </>
      );
      break;
    case 'MT02':
      picture = (
        <>
          <InformationPicture state={pairs} />
          <InformationPicture state={informationState('pairs', 7)} />
        </>
      );
      break;
    case 'MT03':
      picture = (
        <>
          <WholeCellChoices state={pairs} />
          <EventFamily state={pairs} />
          <p>
            Three independent whole-cell choices give 2³=8 events. Six individual-face choices would
            give different, full information.
          </p>
        </>
      );
      break;
    case 'MT04':
      picture = (
        <>
          <p>
            The pair boundaries C1={'{1,2}'}, C2={'{3,4}'}, C3={'{5,6}'} remain fixed. Filled amber
            dots are included; open circles are excluded.
          </p>
          <Operation name="A" faces={[1, 2]} />
          <Operation name="B" faces={[3, 4]} />
          <Operation name="Complement Aᶜ" faces={[3, 4, 5, 6]} />
          <Operation name="Union A∪B" faces={[1, 2, 3, 4]} />
        </>
      );
      break;
    case 'MT05':
      picture = <MissingUnion />;
      break;
    case 'MT07':
      picture = <MapPicture state={preimageState(1)} showLaw={false} showEvent={false} />;
      break;
    case 'MT08':
      picture = (
        <>
          <MapPicture state={preimageState(1)} showLaw={false} />
          <p>B=(−∞,1] pulls back to {'{1,2,3,4}'}; its four source masses sum to 2/3.</p>
        </>
      );
      break;
    case 'MT09':
      picture = (
        <>
          <MapPicture state={preimageState(3)} />
          <MBars
            label="Pushforward law, full four-point support"
            columns={['Output', 'Mass']}
            rows={preimageState(3).law.map((r) => [String(r.value), r.probability])}
            max={0.5}
          />
          <p>Total mass 1. Mean 0×1/2 +1×1/6 +2×1/6 +3×1/6 =1.</p>
        </>
      );
      break;
    case 'MT10':
      picture = (
        <>
          <MapPicture state={preimageState(0)} showLaw={false} />
          <InformationPicture state={informationState('pairs', 7)} />
          <p>
            Z⁻¹({'{0}'}) splits report {'{3,4}'}. The same map is measurable for full information;
            its source and range event families matter.
          </p>
        </>
      );
      break;
    case 'MT11':
      picture = (
        <>
          <MapPicture state={preimageState(1)} />
          <MTable
            label="Source and law expectation agree"
            columns={['z', 'Source fibre', 'Law mass', 'z×mass', '1{z≤1}×mass']}
            rows={preimageState(1).law.map((r) => [
              r.value,
              set(
                preimageState(1)
                  .rows.filter((x) => x.value === r.value)
                  .map((x) => x.face),
              ),
              mt(r.probability),
              mt(r.value * r.probability),
              mt((r.value <= 1 ? 1 : 0) * r.probability),
            ])}
          />
          <p>
            Both descriptions give E[Z]=1 and P(Z≤1)=2/3. Indicator → simple → monotone limit →
            signed decomposition extends the correspondence.
          </p>
        </>
      );
      break;
    case 'MT13':
      picture = (
        <>
          <InformationPicture state={informationState('parity', 21)} />
          <InformationPicture state={informationState('parity', 42)} />
          <p>Disjoint odd/even: 1/2+1/2=1.</p>
          <MTable
            label="Overlap is counted once in the union"
            columns={['Face', 'In A={1,2}', 'In B={2,3}', 'In A∪B']}
            rows={[1, 2, 3, 4, 5, 6].map((f) => [
              f,
              f <= 2 ? 'yes' : 'no',
              f === 2 || f === 3 ? 'yes' : 'no',
              f <= 3 ? 'yes' : 'no',
            ])}
          />
          <p>
            Adding A and B counts face 2 twice. Union mass is 3/6; inclusion–exclusion removes 1/6.
          </p>
        </>
      );
      break;
    case 'MT14':
      picture = (
        <>
          <p>
            Finite anatomy of increasing events. New shells are disjoint; each partial union is the
            corresponding event.
          </p>
          {[1, 2, 3].map((n) => (
            <div key={n}>
              <InformationPicture
                state={informationState('pairs', (1 << (2 * n)) - 1)}
                mass={false}
              />
              <p>
                A{n} adds shell {set([2 * n - 1, 2 * n])}. P(A{n})={n}/3.
              </p>
            </div>
          ))}
          <p>
            For the general increasing sequence, B₁=A₁ and Bₙ=Aₙ∖Aₙ₋₁. Countable additivity makes
            P(∪Aₙ)=ΣP(Bₙ)=lim P(Aₙ). These three finite rows illustrate the decomposition.
          </p>
        </>
      );
      break;
    case 'MT15':
      picture = <Cylinders />;
      break;
    case 'MT16':
      picture = (
        <>
          <p>
            Decreasing infinite-length sets: [n,∞). Their intersection is empty, but every set has
            infinite length.
          </p>
          <MResponsive>
            {(width) => (
              <MScene
                label="Rightward infinite rays with increasing left endpoints"
                width={width}
                height={165}
              >
                {[1, 2, 3].map((n, i) => (
                  <g key={n}>
                    <MLabel x={12} y={27 + i * 48}>
                      {n}
                    </MLabel>
                    <MArrow x1={55 + i * 18} y1={22 + i * 48} x2={width - 14} y2={22 + i * 48} />
                  </g>
                ))}
              </MScene>
            )}
          </MResponsive>
          <p>
            μ(A₁)&lt;∞ is required for continuity from above. Separately, a countable union of
            rational singletons has length 0, while the uncountable union of all singletons in [0,1]
            is the whole interval of length 1. Countable additivity makes no uncountable-union
            promise.
          </p>
        </>
      );
      break;
    case 'MT17':
      picture = <CompletionPicture />;
      break;
    case 'MT18':
      picture = <RationalTranslates />;
      break;
    default:
      throw new Error('Unknown foundation mechanism ' + id);
  }
  return <MFigure id={id}>{picture}</MFigure>;
}
