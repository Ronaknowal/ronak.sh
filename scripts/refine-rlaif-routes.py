"""Author-only drawing refinement; no study, program, or manuscript changes."""
from pathlib import Path

path = Path('src/learn/components/lesson-labs/RLAIFMethodsFlow.jsx')
source = path.read_text(encoding='utf-8')
start = source.index('export function DistilledDirectRoutes() {')
end = source.index('export function RatingDistributionMap() {', start)
replacement = r'''export function DistilledDirectRoutes() {
  const [candidate, setCandidate] = useState('A');
  const selected = candidate === 'A' ? 0 : 1;
  return (
    <Figure id="D10" label="Distilled and direct reward have different updating parameter sets">
      <Key names={['Teacher frozen', 'Reward weights', 'Policy weights', 'Reference frozen']} palette={['#76d0d9', '#f0bd68', '#ba9bff', '#9396a2']} />
      <div className="rf-grid">
        {[false, true].map(direct => <div key={String(direct)}>
          <p>{direct ? 'Direct feedback: one sampled response' : 'Distilled feedback: a labelled pair'}</p>
          <Svg small height={400} label={direct ? 'A frozen teacher supplies the policy reward directly' : 'Soft pair labels train a reward head that is then frozen'}>
            {(direct ? [selected] : [0, 1]).map((index, slot) => <g key={index}>
              <circle cx={direct ? 168 : 112 + slot * 112} cy={40} r={23} fill="none" stroke={colors[index]} strokeWidth="2" />
              <Text x={direct ? 168 : 112 + slot * 112} y={46} anchor="middle" color={colors[index]}>{M.candidateNames[index]}</Text>
              <Arrow x1={direct ? 168 : 112 + slot * 112} y1={64} x2={direct ? 168 : 130 + slot * 76} y2={95} color={colors[index]} />
              {index === selected && <circle cx={direct ? 168 : 112 + slot * 112} cy={40} r={28} fill="none" stroke="#f0bd68" />}
            </g>)}
            <rect x={72} y={98} width={192} height={55} fill="none" stroke="#76d0d9" strokeDasharray="5 4" />
            <Text x={168} y={122} anchor="middle">Teacher parameters φ</Text><Text x={168} y={145} anchor="middle">frozen</Text>
            <Arrow x1={168} y1={157} x2={168} y2={182} />
            {direct ? <>
              <Text x={168} y={208} anchor="middle">Rating distribution 1…10</Text>
              {[.1,0,0,0,.2,0,0,0,0,.7].map((mass, i) => <rect key={i} x={27 + i * 29} y={275 - mass * 75} width={20} height={mass * 75} fill="#76d0d9" />)}
              <Line x1={22} y1={276} x2={316} y2={276} />
              <Text x={27} y={299}>1</Text><Text x={307} y={299} anchor="end">10</Text>
              <Text x={168} y={336} anchor="middle">E[rating] → scalar r(y)</Text>
              <Text x={168} y={374} anchor="middle">Detach teacher reward.</Text>
            </> : <>
              <Text x={168} y={208} anchor="middle">Soft target [q, 1−q]</Text>
              <rect x={65} y={225} width={144} height={20} fill={colors[0]} /><rect x={209} y={225} width={62} height={20} fill={colors[1]} />
              <Text x={168} y={272} anchor="middle">Constructed q=.7</Text>
              <Arrow x1={168} y1={282} x2={168} y2={305} color="#f0bd68" dashed />
              <circle cx={168} cy={334} r={26} fill="none" stroke="#f0bd68" /><Text x={168} y={340} anchor="middle">ψ</Text>
              <Text x={168} y={389} anchor="middle">Fit ψ, then freeze rψ(y).</Text>
            </>}
          </Svg>
          <p className="rf-note">{direct ? 'The bars illustrate a constructed distribution, not a new judge call. The teacher stays frozen.' : 'Only the reward-head parameters ψ receive the soft-label fit gradient. Then their score is detached during policy optimization.'}</p>
        </div>)}
      </div>
      <Svg height={340} label="Detached scalar rewards weight the policy score gradient; a frozen reference supplies a KL comparison">
        <Text x={25} y={28}>Detached scalar reward r(y)</Text>
        <Arrow x1={245} y1={23} x2={360} y2={23} />
        <Text x={378} y={29}>Reward − baseline</Text>
        <Line x1={430} y1={40} x2={430} y2={67} />
        <Text x={330} y={95}>−(r−b) ∇θ log π(y)</Text>
        <Text x={30} y={123} color="#ba9bff">Updating policy parameters</Text>
        {[0,1].map(i => <g key={i}><rect x={45 + i * 88} y={146} width={76} height={48} fill="none" stroke="#ba9bff" /><Text x={83 + i * 88} y={176} anchor="middle">θ{M.candidateNames[i]}</Text></g>)}
        <Arrow x1={219} y1={170} x2={352} y2={170} />
        <Text x={373} y={177}>softmax → π(A), π(B)</Text>
        <Line x1={470} y1={154} x2={470} y2={108} />
        <Line x1={320} y1={87} x2={270} y2={87} color="#ba9bff" dashed /><Line x1={270} y1={87} x2={270} y2={154} color="#ba9bff" dashed /><Arrow x1={270} y1={154} x2={213} y2={154} color="#ba9bff" dashed />
        <rect x={363} y={241} width={245} height={65} fill="none" stroke="#9396a2" strokeDasharray="5 4" /><Text x={485} y={267} anchor="middle">Reference logits [0,0]</Text><Text x={485} y={292} anchor="middle">frozen</Text>
        <Text x={35} y={250}>KL compares policy with reference.</Text><Text x={35} y={287}>Reference parameters receive no update.</Text>
      </Svg>
      <p>Solid lines carry forward values; dashed violet lines return a gradient to policy logits. The reference distribution enters the KL term; its frozen parameters are not differentiated or optimized. Both routes retain an imperfect AI observer.</p>
      <Controls><Select label="Trace response identity" value={candidate} onChange={setCandidate} options={['A','B']} /><Reset onClick={() => setCandidate('A')} /></Controls>
    </Figure>
  );
}
'''
path.write_text(source[:start] + replacement + source[end:], encoding='utf-8', newline='\n')
print('Refined the unfrozen D10 route drawing; accepted content/science untouched.')
