"""Bounded presentation correction; preserve every predecessor, never run science."""
from pathlib import Path
import hashlib
import json

topic = Path('docs/teaching/llm-architecture-training/typed-decision-models-calibrated-neural-decision-systems')
out = topic/'runtime-author-predecessor'
out.mkdir(exist_ok=False)
base = Path('src/learn/components/lesson-labs')
files = [base/f'TypedDecision{x}.jsx' for x in ['Shared','Foundations','Probability','Study','Native']]
files += [base/'typed-decision-flow.css', Path('scripts/verify-typed-decision-reading.cjs'), topic/'runtime-source-closure.json']
records = []
for p in files:
    data = p.read_bytes()
    saved = out/p.name
    saved.write_bytes(data)
    records.append({'path':p.as_posix(),'preserved':saved.as_posix(),'sha256':hashlib.sha256(data).hexdigest()})
(out/'inputs.json').write_text(json.dumps(records,indent=2)+'\n',encoding='utf-8')

def edit(path, changes):
    raw = path.read_bytes()
    text = raw.decode('utf-8')
    newline = '\r\n' if '\r\n' in text else '\n'
    text = text.replace('\r\n','\n')
    for old,new in changes:
        assert text.count(old)==1, (str(path),old,text.count(old))
        text = text.replace(old,new)
    path.write_bytes(text.replace('\n',newline).encode('utf-8'))

edit(base/'TypedDecisionShared.jsx',[
 ('Check({ label, checked, onChange })','Check({ label, checked, onChange, disabled = false })'),
 ('type="checkbox" checked={checked}', 'type="checkbox" disabled={disabled} checked={checked}'),
 ('Select({ label, value, options, onChange })','Select({ label, value, options, onChange, disabled = false })'),
 ('<select id={id} value={value}', '<select id={id} disabled={disabled} value={value}'),
])
edit(base/'TypedDecisionFoundations.jsx',[
 ('label="Omit candidate padding mask" checked={broken}', 'label="Omit candidate padding mask" disabled={empty} checked={broken}'),
 ('label="C is invalid" checked={invalid}', 'label="C is invalid" disabled={empty} checked={invalid}'),
])
edit(base/'TypedDecisionStudy.jsx', [('The left objective uses calibration labels;', 'The calibration objective uses calibration labels;')])
edit(base/'TypedDecisionProbability.jsx',[
 ('  const center = simplexPoint(truth);', '  const center = simplexPoint(truth);\n  const regretText = value => Math.abs(value) < 1e-12 ? "numerically zero (roundoff below 10⁻¹²)" : fmt(value);'),
 ('{fmt(result.brierRegret)}','{regretText(result.brierRegret)}'),
 ('{fmt(result.kl)}','{regretText(result.kl)}'),
 ('label="Recorded group size" value={g}', 'label="Recorded group size" disabled={constant} value={g}'),
 ('label="Estimator" value={actualMethod}', 'label="Estimator" disabled={constant} value={actualMethod}'),
 ('label="Gradient coordinate" value={coordinate}', 'label="Gradient coordinate" disabled={constant} value={coordinate}'),
 ('Every reward equals its leave-one-out baseline, so every score multiplier is exactly zero.', 'Every reward equals its leave-one-out baseline, so every score multiplier is exactly zero. Recorded-run controls are inactive for this constructed null.'),
 ('viewBox="0 0 680 475" style={{ width: \'42.5rem\' }}', 'viewBox="0 0 720 475" style={{ width: \'45rem\' }}'),
 ('<g fill="none" stroke="#aaa" markerEnd="url(#typed-recipe-arrow)"><path d="M340 60L160 110V205" /><path d="M340 60L510 110V155" /><path d="M510 180V235" /><path d="M510 270V330" /><path d="M160 245V395H300" /><path d="M510 360V395H375" /><path d="M340 410V455" /></g>',
  '<g fill="none" stroke="#aaa" markerEnd="url(#typed-recipe-arrow)">\n        <path d="M340 60L170 110V205" /><path d="M50 185V225H110" />\n        <path d="M340 60L510 110V120" /><path d="M510 145V160" /><path d="M510 185V208" />\n        <path d="M510 230V240" /><path d="M510 267V285" /><path d="M510 312V336" />\n        <path d="M405 40H680V350H625" stroke={colors[2]} />\n        <path d="M170 245V395H300" /><path d="M510 360V395H375" /><path d="M340 419V455" />\n      </g>'),
 ('<text x="160" y="151" textAnchor="middle">target distribution t</text><text x="160" y="229" textAnchor="middle">direct soft CE</text><text x="160" y="279" textAnchor="middle">coefficient 1</text>',
  '<text x="50" y="158" textAnchor="middle">target</text><text x="50" y="176" textAnchor="middle">t</text>\n      <text x="170" y="229" textAnchor="middle">direct soft CE</text><text x="80" y="279" textAnchor="middle">coefficient 1</text>\n      <text x="650" y="95" textAnchor="middle">live θ</text>'),
 ('the reward path is detached for the likelihood-ratio term. Direct soft-CE retains its own gradient.', 'the reward path is detached for the likelihood-ratio term. The purple live-θ branch differentiates the report density log πθ(u) at the detached sample. Direct soft-CE retains its own gradient.'),
])
edit(base/'TypedDecisionNative.jsx',[
 ('  const native = data.nativeShifts[index].native[0].answers.intent;\n  return <Figure id="D35"',
  '  const native = data.nativeShifts[index].native[0].answers.intent;\n  const originalIds = ["card_arrival", "card_delivery_estimate", "card_linking", "card_not_working", "lost_or_stolen_card", "card_payment_not_recognised"];\n  const identityColor = id => colors[originalIds.indexOf(row.identity_map?.[id] || id)] || "#a8aab2";\n  return <Figure id="D35"'),
 ('values={scratch.probabilities} names={row.options.map(x => x.id)}', 'values={scratch.probabilities} names={row.options.map(x => x.id)} colors={row.options.map(x => identityColor(x.id))}'),
 ('values={Object.values(native.probabilities)} names={Object.keys(native.probabilities)}', 'values={Object.values(native.probabilities)} names={Object.keys(native.probabilities)} colors={Object.keys(native.probabilities).map(identityColor)}'),
 ('Selected {native.choice}. English checkpoint; Hindi behavior is not a multilingual competence claim.', 'Selected {native.choice}.{row.intervention === \'hindi\' && \' English checkpoint; Hindi behavior is not a multilingual competence claim.\'}'),
 ('All 24 prespecified interventions remain inspectable.', 'All 24 prespecified interventions remain inspectable. Colours follow original event identities through reordering, omission and ID renaming; extra distractors are grey.'),
])
edit(base/'typed-decision-flow.css', [
 ('.typed-controls select {', '.typed-controls label:has(:disabled) { opacity: .55; }\n.typed-controls select {'),
 ('.typed-flow th { font-weight: 550; }', '.typed-flow th { font-weight: 550; }\n.typed-flow [data-lesson-ending="references"] th:first-child { min-width: 10rem; }\n.typed-flow [data-lesson-ending="references"] a { overflow-wrap: normal; word-break: normal; }'),
])
edit(Path('scripts/verify-typed-decision-reading.cjs'),[
 ('for (const [width,font,profile] of [[1366,16,\'desktop\'],[390,16,\'phone\'],[768,32,\'zoom\']]) {', 'for (const [width,font,profile] of (process.argv.includes(\'--interactions-only\') ? [] : [[1366,16,\'desktop\'],[390,16,\'phone\'],[768,32,\'zoom\']])) {'),
 ('await pane.focus(); await pane.press(\'End\');\n    assert.ok(await pane.evaluate(el => el.scrollLeft>0));', 'await pane.focus(); await pane.press(\'ArrowRight\');\n    await page.waitForFunction(() => document.querySelector(\'[data-typed-figure="D04"] .typed-scroll\').scrollLeft > 0);'),
])
print(json.dumps({'preserved':len(records),'scope':'presentation only; no models or manuscript changed'}))
