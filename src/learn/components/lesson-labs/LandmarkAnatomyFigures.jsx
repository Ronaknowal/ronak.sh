// Foundational architecture views: the parts of each landmark block, one traced
// route through it, and how it composes into a network. All counts come from
// landmark-anatomy-data.json or the recorded experiment, checked by
// scripts/verify-landmark-beginner.py.
//
// Reading flow (docs/teaching/deep-learning-beginner/visual-vocabulary.md): figures
// carry no card frame or title; the lesson sentence before each figure introduces it.
// Colour follows the module vocabulary: operation boxes are neutral outlines named by
// their text tag; tensor chips computed inside a drawing are violet, chips supplied from
// outside it (the image, or a previous layer's output entering a block drawn on its own)
// are cyan; learned-parameter counts are amber; the selected element has a thick
// white outline. Activations, normalization and dropout are written inside the box
// they follow, after "+".
import { useState } from 'react';
import anatomy from '../../data/landmark-anatomy-data.json';
import measured from '../../data/landmark-architecture-measurements.json';
import { channelContext } from '../../data/landmark-architecture-models.js';
import { FlowChoice, FlowControls, FlowReadout, FlowSlider, flowNumber } from './LessonFlow.jsx';
import './landmark-anatomy.css';

const fmt = value => value.toLocaleString('en-US');
const kindTag = { conv: 'spatial conv', mix: '1 × 1 mix', pool: 'pool', dense: 'dense', reshape: 'reshape', template: 'template distance' };
const kindMeaning = {
  conv: 'slides a k × k filter over positions',
  mix: 'combines channels at each position, no neighbours',
  pool: 'summarizes positions: max and average pools learn nothing; LeNet’s S layers also learn one scale and one bias per map',
  dense: 'connects every input number to every output',
  reshape: 'rearranges values without changing them',
  template: 'compares with fixed, hand-chosen vectors',
};
const keepTogether = text => typeof text === 'string' ? text.replace(/ → /g, ' → ') : text;

function Op({ kind, children, detail, params, width }) {
  return <div className="la-op" data-kind={kind}>
    <span className="la-tag">{kindTag[kind]}</span>
    <span className="la-op-label">{keepTogether(children)}</span>
    {width != null && <span className="la-width" aria-hidden="true"><i style={{ width: `${width * 100}%` }} /></span>}
    {detail && <span className="la-op-detail">{detail}</span>}
    {params != null && <span className="la-op-params">{params ? `${fmt(params)} learned parameters` : 'no learned parameters'}</span>}
  </div>;
}

// The square beside a C × H × W chip has a side that grows with log2(H), so pooling
// visibly shrinks it; a flat vector gets a thin bar instead.
function Footprint({ shape }) {
  const parts = String(shape).split(' × ').map(Number);
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    const side = .3 + .3 * Math.log2(Math.max(1, parts[1]));
    return <i className="la-footprint" aria-hidden="true" style={{ width: `${side}em`, height: `${side}em` }} />;
  }
  return <i className="la-footprint la-footprint--vector" aria-hidden="true" />;
}
const Tensor = ({ shape, note, supplied }) => <div className="la-tensor" data-supplied={supplied || undefined}><Footprint shape={shape} /><code>{shape}</code>{note && <span>{note}</span>}</div>;
const Arrow = () => <span className="la-arrow" aria-hidden="true">↓</span>;
function Flow({ children, className = '' }) {
  const items = [].concat(children).flat(Infinity).filter(Boolean);
  return <div className={`la-flow ${className}`}>{items.flatMap((item, i) => i ? [<Arrow key={`a${i}`} />, item] : [item])}</div>;
}
const Merge = ({ symbol, children }) => <div className="la-merge"><b aria-hidden="true">{symbol}</b><span>{children}</span></div>;
function SkipBlock({ skipLabel, children }) {
  return <div className="la-skipblock"><div className="la-skip-main">{children}</div><div className="la-skip-rail"><span className="la-skip-from">↓ from x</span><span>{skipLabel}</span><span className="la-skip-join">↓ into ⊕</span></div></div>;
}
// A squeeze-and-excitation side route: the maps continue on the left; the gate is
// computed on the right; ⊗ multiplies each channel by its gate.
function GateRoute({ channels, squeeze, kind, activation, params }) {
  return <div className="la-gate">
    <div className="la-gateblock">
      <div className="la-gate-main"><span>the {channels} maps continue unchanged to ⊗</span></div>
      <div className="la-gate-side"><span className="la-branch-name">gate route{params ? ` · ${fmt(params)} learned parameters for the whole route` : null}</span><Flow>
        <Op kind="pool">average each channel → {channels} numbers</Op>
        <Op kind={kind}>{kind === 'mix' ? '1 × 1' : 'linear'}, {channels} → {squeeze}, + {activation}</Op>
        <Op kind={kind}>{kind === 'mix' ? '1 × 1' : 'linear'}, {squeeze} → {channels}, + sigmoid</Op>
      </Flow></div>
    </div>
    <Merge symbol="⊗">multiply each of the {channels} channels by its gate</Merge>
  </div>;
}

// The key: the Convolution lesson's drawing of DigitCNN's first step, then the same step
// zoomed out into this page's box-and-chip form, then the conventions themselves.
export function DiagramKey() {
  const stack = (count, side) => <span className="la-stack" aria-hidden="true" style={{ '--side': `${side}rem`, '--count': count }}>{Array.from({ length: count }, (_, j) => <i key={j} style={{ '--j': j }} />)}</span>;
  return <figure className="la-figure" data-figure="landmark-diagram-key" aria-label="How to read the architecture diagrams on this page">
    <div className="la-bridge flow-columns-2">
      <div>
        <p className="la-bridge-title">In the Convolution lesson</p>
        <div className="la-bridge-row">
          <div className="la-bridge-tensor">{stack(1, 2.2)}<code>1 × 8 × 8</code></div>
          <div className="la-bridge-arrow"><b aria-hidden="true">→</b><span>Conv 3×3 + ReLU</span><span className="la-amber">80 learned values</span></div>
          <div className="la-bridge-tensor">{stack(4, 2.2)}<code>8 × 8 × 8</code><span className="la-bridge-note">4 of 8 channels drawn</span></div>
        </div>
        <p>A drawn square stack is a tensor; the arrow between two stacks is the operation.</p>
      </div>
      <div>
        <p className="la-bridge-title">The same step on this page</p>
        <Flow>
          <Tensor shape="1 × 8 × 8" supplied />
          <Op kind="conv" params={80}>3 × 3 conv, 1 → 8, padding 1, + ReLU</Op>
          <Tensor shape="8 × 8 × 8" />
        </Flow>
        <p>The operation becomes a box and each tensor becomes a chip, so a route can split into several boxes and merge again.</p>
      </div>
    </div>
    <dl className="la-key">
      <div><dt><Tensor shape="12 × 4 × 4" /><Tensor shape="12 × 2 × 2" /></dt><dd>A <strong>tensor chip</strong> holds computed values: channels × height × width for one image. Its square grows with the logarithm of the grid’s height, so each halving (224 → 112 → 56 …) shrinks it by the same step; the number gives the exact size. A cyan chip is supplied to the drawing from outside: the input image, or, when one block is drawn on its own, the previous layer’s output entering it. Every chip computed inside the drawing is violet.</dd></div>
      <div><dt><Op kind="conv" params={1308}>3 × 3 conv, 12 → 12, + ReLU</Op></dt><dd>An <strong>operation box</strong> names what is computed. The tag above the text names its kind; the amber line counts the numbers it learns. <strong>“a → b”</strong> means a input channels become b output channels. <strong>“+ ReLU”</strong>, <strong>“+ BatchNorm”</strong> or <strong>“+ dropout”</strong> run right after that operation and keep its shape; they are always written inside the box, never as separate boxes.</dd></div>
      <div><dt><Arrow /></dt><dd>Data moves <strong>down</strong> the page, from the image toward class scores. During training the loss gradient travels the same connections upward.</dd></div>
      <div><dt className="la-key-merges"><Merge symbol="⊕">add matching values</Merge><Merge symbol="‖">concatenate channels</Merge><Merge symbol="⊗">multiply each channel by a gate</Merge><span className="la-key-rail">↓ from x · skip · ↓ into ⊕</span></dt><dd>Where two routes meet, the symbol says how they combine. A dashed side rail is a route that skips around the boxes beside it.</dd></div>
    </dl>
    <dl className="la-legend" aria-label="Operation kinds named by the tags">
      {Object.entries(kindTag).map(([kind, text]) => <div key={kind}><dt><span className="la-tag">{text}</span></dt><dd>{kindMeaning[kind]}</dd></div>)}
    </dl>
  </figure>;
}

const bodyNames = { plain: 'Plain', residual: 'Residual', parallel: 'Parallel branches', inverted_gated: 'Inverted with gate' };
function BodyDiagram({ kind }) {
  if (kind === 'plain') return <Flow><Op kind="conv">3 × 3 conv, 12 → 12, padding 1, + ReLU</Op><Op kind="conv">3 × 3 conv, 12 → 12, padding 1, + ReLU</Op></Flow>;
  if (kind === 'residual') return <><SkipBlock skipLabel="skip: the 12 × 4 × 4 input, unchanged"><Flow><Op kind="conv">3 × 3 conv, 12 → 12, padding 1, + ReLU</Op><Op kind="conv">3 × 3 conv, 12 → 12, padding 1</Op></Flow></SkipBlock><Merge symbol="⊕">branch + input, then + ReLU</Merge></>;
  if (kind === 'parallel') {
    const branches = [
      ['1 × 1', [['mix', '1 × 1, 12 → 3']]],
      ['3 × 3', [['mix', '1 × 1, 12 → 3, + ReLU'], ['conv', '3 × 3, 3 → 3, padding 1']]],
      ['5 × 5', [['mix', '1 × 1, 12 → 3, + ReLU'], ['conv', '5 × 5, 3 → 3, padding 2']]],
      ['pool', [['pool', '3 × 3 max, stride 1'], ['mix', '1 × 1, 12 → 3']]],
    ];
    return <><p className="la-split-note">↙ ↓ ↓ ↘ the same 12 × 4 × 4 input goes to all four branches at once</p>
      <div className="la-branchwrap"><div className="la-branches">{branches.map(([name, ops], i) => <div key={name} className="la-branch">
        <span className="la-branch-name">branch {i + 1} of 4 · {name}</span>
        <Flow>{ops.map(([k, t], j) => <Op key={j} kind={k}>{t}</Op>)}</Flow>
        <Tensor shape="3 × 4 × 4" />
      </div>)}</div></div>
      <Merge symbol="‖">3 + 3 + 3 + 3 = 12 channels, then + ReLU</Merge></>;
  }
  return <><SkipBlock skipLabel="skip: the narrow 12-channel input"><Flow>
    <Op kind="mix" width={1}>1 × 1 expand, 12 → 36, + SiLU</Op>
    <Op kind="conv" width={1}>3 × 3 depthwise, 36 channels, + SiLU</Op>
    <GateRoute channels={36} squeeze={9} kind="dense" activation="ReLU" />
    <Op kind="mix" width={1 / 3}>1 × 1 project, 36 → 12, linear (no activation)</Op>
  </Flow></SkipBlock><Merge symbol="⊕">branch + input</Merge></>;
}

export function SmallNetworkAnatomy({ selectable = false }) {
  const [kind, setKind] = useState('plain');
  const fit = measured.fits.find(f => f.seed === 1 && f.kind === kind);
  const layer = name => fit.cost.layers.find(l => l.layer === name);
  const body = fit.cost.layers.filter(l => l.layer.startsWith('body'));
  const bodyParams = body.reduce((sum, l) => sum + l.parameters, 0), bodyMacs = body.reduce((sum, l) => sum + l.macs, 0);
  return <figure className="la-figure" data-figure={selectable ? 'landmark-experiment-anatomy' : 'landmark-small-network'} aria-label={selectable ? 'The shared classifier frame with four interchangeable bodies' : 'The running example: a whole digit classifier, part by part'}>
    <div className="la-roles">
      <div className="la-role"><span className="la-role-name">stem</span><Flow>
        <Tensor shape="1 × 8 × 8" note="one grayscale digit" supplied />
        <Op kind="conv" params={layer('stem').parameters}>3 × 3 conv, 1 → 12, padding 1, + ReLU</Op>
        <Tensor shape="12 × 8 × 8" note="12 response maps" />
        <Op kind="pool">2 × 2 max pool</Op>
      </Flow></div>
      <Arrow />
      <div className="la-role la-role--body"><span className="la-role-name">body{selectable ? `: ${bodyNames[kind].toLowerCase()}` : ''}</span><Flow>
        <Tensor shape="12 × 4 × 4" note="same shape in and out of the body" />
      </Flow><Arrow /><div className="la-body"><BodyDiagram kind={kind} /></div>
        {!selectable && <p className="la-slot">This slot can hold any block that returns 12 × 4 × 4. Section 8 swaps in three other bodies and compares all four.</p>}
        <p className="la-op-params">{fmt(bodyParams)} learned parameters · {fmt(bodyMacs)} counted multiply-accumulates in this body</p></div>
      <Arrow />
      <div className="la-role"><span className="la-role-name">tail</span><Flow>
        <Op kind="conv" params={layer('tail').parameters}>3 × 3 conv, 12 → 16, padding 1, + ReLU</Op>
        <Tensor shape="16 × 4 × 4" />
        <Op kind="pool">2 × 2 max pool</Op>
        <Tensor shape="16 × 2 × 2" />
      </Flow></div>
      <Arrow />
      <div className="la-role"><span className="la-role-name">summary + head</span><Flow>
        <Op kind="pool">average each map</Op>
        <Tensor shape="16" note="one number per channel" />
        <Op kind="dense" params={layer('head').parameters}>linear, 16 → 10</Op>
        <Tensor shape="10" note="logits, one per digit" />
      </Flow></div>
    </div>
    {selectable && <FlowControls><FlowChoice label="Body in the middle slot" value={kind} onChange={setKind} options={Object.entries(bodyNames)} /></FlowControls>}
    <FlowReadout>This {selectable ? bodyNames[kind].toLowerCase() : 'plain'} model: <strong>{fmt(fit.cost.parameters)}</strong> parameters and <strong>{fmt(fit.cost.macs)}</strong> convolution/linear multiply-accumulates per image, from the recorded run. The stem, tail and head contribute 2,034 parameters in every version; only the body changes.</FlowReadout>
  </figure>;
}

export function LeNetAnatomy() {
  const [selected, setSelected] = useState('C1');
  const current = anatomy.lenet.find(l => l.id === selected);
  const total = anatomy.lenet.reduce((sum, l) => sum + (l.params || 0), 0);
  return <figure className="la-figure" data-figure="landmark-lenet-anatomy" aria-label="LeNet-5 as the 1998 paper built it; select any layer">
    <div className="la-flow la-lenet" role="list" aria-label="LeNet-5 layers">
      {anatomy.lenet.map((l, i) => <div key={l.id} role="listitem" className="la-flow-item">
        {i > 0 && <Arrow />}
        {l.kind ? <button className="la-op la-op-button" data-kind={l.kind} aria-pressed={selected === l.id} onClick={() => setSelected(l.id)}><span className="la-tag">{kindTag[l.kind]}</span><span className="la-op-label">{keepTogether(l.label)}</span></button> : null}
        {selected === l.id && <div className="la-readout" aria-live="polite">
          <p>{current.detail}</p>
          <p><strong className="la-amber">{fmt(current.params ?? 0)}</strong> trainable parameters · output {current.shape}</p>
        </div>}
        <Tensor shape={l.shape} supplied={i === 0} />
      </div>)}
    </div>
    <p className="la-caption">Select any box: its arithmetic opens under it, and the selected box gets a thick white outline. Every C, S and F layer applies the paper’s scaled-tanh squashing, written “+ tanh” in the box. All trainable layers together hold {fmt(total)} parameters; C5 alone holds {Math.round(100 * 48120 / total)}% of them.</p>
  </figure>;
}

export function AlexNetFigure() {
  return <figure className="la-figure" data-figure="landmark-alexnet" aria-label="AlexNet, layer by layer, with the shape after each operation">
    <div className="la-column la-column--alex"><Flow>
      <Tensor shape={anatomy.alexnet.input} note="RGB crop; 227 makes the stride arithmetic exact" supplied />
      {anatomy.alexnet.layers.map((l, i) => <div key={i} className="la-flow-pair"><Op kind={l.kind} params={l.params} detail={l.split && `two-GPU split: ${l.split}`}>{l.label}</Op><Tensor shape={l.shape} /></div>)}
    </Flow></div>
    <p className="la-caption">The chip after each box is the shape that box produces. These kernel shapes hold {fmt(anatomy.alexnet.total)} learned parameters (the paper says “60 million”). Torchvision’s single-device variant uses 64/192/384/256/256 filters and no LRN: {fmt(anatomy.alexnet.torchvisionTotal)}.</p>
  </figure>;
}

export function VggFigure() {
  let previous = 3;
  return <figure className="la-figure" data-figure="landmark-vgg" aria-label="VGG-16: stages built from one repeated block">
    <div className="la-column"><Flow>
      <Tensor shape={anatomy.vgg16.input} supplied />
      {anatomy.vgg16.stages.map((s, i) => { const from = previous; previous = s.channels; return <div key={i} className="la-stage">
        <div className="la-repeat-group"><span className="la-repeat">conv repeated × {s.convs}</span>
          <Op kind="conv" params={s.params}>3 × 3 conv, {from} → {s.channels}{s.convs > 1 ? `, then ${s.channels} → ${s.channels}` : ''}, padding 1, + ReLU</Op></div>
        <Op kind="pool">2 × 2 max pool, stride 2</Op>
        <Tensor shape={`${s.channels} × ${s.size / 2} × ${s.size / 2}`} note={`after stage ${i + 1}`} />
      </div>; })}
      <Op kind="reshape">flatten 512 × 7 × 7 → 25,088 numbers</Op>
      <Op kind="dense" params={anatomy.vgg16.head[0]}>dense 25,088 → 4,096, + ReLU, + dropout</Op>
      <Op kind="dense" params={anatomy.vgg16.head[1]}>dense 4,096 → 4,096, + ReLU, + dropout</Op>
      <Op kind="dense" params={anatomy.vgg16.head[2]}>dense 4,096 → 1,000</Op>
    </Flow></div>
    <p className="la-caption">The dashed group marks the convolution that repeats inside a stage; one pool ends each stage. Each stage count includes all its convolutions. Trunk {fmt(anatomy.vgg16.trunk)}; total {fmt(anatomy.vgg16.total)}.</p>
    <div className="neural-table-scroll la-compare-scroll" role="region" tabIndex={0} aria-label="AlexNet beside VGG-16, compactly"><table className="la-compact-compare"><caption>What changed from AlexNet to VGG-16</caption><thead><tr><th scope="col">Part</th><th scope="col">AlexNet</th><th scope="col">VGG-16</th></tr></thead><tbody>
      <tr><th scope="row">input</th><td>3 × 227 × 227</td><td>3 × 224 × 224</td></tr>
      <tr><th scope="row">opening</th><td>one 11 × 11 conv, stride 4 → 96 × 55 × 55</td><td>two 3 × 3 convs (stage 1) → 64 × 224 × 224</td></tr>
      <tr><th scope="row">conv layers</th><td>5, each designed separately</td><td>13, one 3 × 3 rule in 5 stages</td></tr>
      <tr><th scope="row">last maps</th><td>256 × 6 × 6</td><td>512 × 7 × 7</td></tr>
      <tr><th scope="row">parameters</th><td>{fmt(anatomy.alexnet.total)}</td><td>{fmt(anatomy.vgg16.total)}</td></tr>
    </tbody></table></div>
  </figure>;
}

export function InceptionModuleFigure() {
  const [mode, setMode] = useState('naive');
  const m = anatomy.inception3a, key = mode === 'reduced' ? 'reduced' : 'naive';
  const weights = mode === 'reduced' ? m.reducedWeights : m.naiveWeights;
  const out = m.branches.reduce((sum, b) => sum + (mode === 'reduced' ? b.out : b.naiveOut), 0);
  return <figure className="la-figure" data-figure="landmark-inception" aria-label="GoogLeNet inception (3a) module, with and without 1 × 1 reductions">
    <Tensor shape="192 × 28 × 28" note="the previous layer’s output" supplied />
    <p className="la-split-note">↙ ↓ ↓ ↘ the same input goes to all four branches at once</p>
    <div className="la-branchwrap"><div className="la-branches">{m.branches.map((b, i) => <div key={b.name} className="la-branch">
      <span className="la-branch-name">branch {i + 1} of 4 · {b.name}</span>
      <Flow>{b[key].map((op, j) => <Op key={j} kind={op.kind} detail={op.weights ? <span className="la-amber">{fmt(op.weights)} weights</span> : 'no weights'}>{op.label}</Op>)}</Flow>
      <Tensor shape={`${mode === 'reduced' ? b.out : b.naiveOut} × 28 × 28`} />
    </div>)}</div></div>
    <Merge symbol="‖">stack the four outputs along channels</Merge>
    <div className="la-strip" aria-label={`Channel ranges: ${m.branches.map(b => mode === 'reduced' ? b.out : b.naiveOut).join(' + ')} = ${out}`}>{m.branches.map(b => { const c = mode === 'reduced' ? b.out : b.naiveOut; return <span key={b.name} style={{ flex: c }}>{c}</span>; })}</div>
    <Tensor shape={`${out} × 28 × 28`} note="module output" />
    <FlowControls><FlowChoice label="Module version" value={mode} onChange={setMode} options={[['naive', 'Naive (Figure 2a)'], ['reduced', 'With 1 × 1 reductions (Figure 2b, used)']]} /></FlowControls>
    <FlowReadout>{mode === 'reduced' ? 'Reduced' : 'Naive'}: <strong>{fmt(weights)}</strong> convolution weights (biases excluded), {fmt(weights * m.positions)} multiply-accumulates over the 28 × 28 grid, <strong>{out}</strong> output channels.</FlowReadout>
  </figure>;
}

export function ResidualBlockFigure() {
  const [variant, setVariant] = useState('basic');
  const r = anatomy.resnet;
  const views = {
    basic: { input: r.basic.shape, output: r.basic.shape, skip: 'identity: x itself, no parameters', params: r.basic.params, ops: [['conv', '3 × 3 conv, 64 → 64, + BatchNorm, + ReLU'], ['conv', '3 × 3 conv, 64 → 64, + BatchNorm']] },
    projection: { input: r.projection.input, output: r.projection.output, skip: `projection: 1 × 1 conv, stride 2, 64 → 128, + BatchNorm (${fmt(r.projection.skipParams)} parameters)`, params: r.projection.params, ops: [['conv', '3 × 3 conv, stride 2, 64 → 128, + BatchNorm, + ReLU'], ['conv', '3 × 3 conv, 128 → 128, + BatchNorm']] },
    bottleneck: { input: r.bottleneck.shape, output: r.bottleneck.shape, skip: 'identity: x itself, no parameters', params: r.bottleneck.params, ops: [['mix', '1 × 1 conv, 256 → 64 (reduce), + BatchNorm, + ReLU'], ['conv', '3 × 3 conv, 64 → 64, + BatchNorm, + ReLU'], ['mix', '1 × 1 conv, 64 → 256 (expand), + BatchNorm']] },
  };
  const v = views[variant];
  return <figure className="la-figure" data-figure="landmark-resnet-block" aria-label="Inside a ResNet block: where the branch, the skip and the addition sit">
    <Tensor shape={v.input} note="x, the block input" supplied />
    <Arrow />
    <SkipBlock skipLabel={v.skip}><span className="la-branch-name">branch F(x)</span><Flow>{v.ops.map(([k, t], i) => <Op key={i} kind={k}>{t}</Op>)}</Flow></SkipBlock>
    <Merge symbol="⊕">y = F(x) + skip, entry by entry, then + ReLU</Merge>
    <Arrow />
    <Tensor shape={v.output} note="block output" />
    <FlowControls><FlowChoice label="Block variant" value={variant} onChange={setVariant} options={[['basic', 'Basic (ResNet-18/34)'], ['projection', 'Basic, changes shape'], ['bottleneck', 'Bottleneck (ResNet-50)']]} /></FlowControls>
    <FlowReadout><strong>{fmt(v.params)}</strong> learned parameters in this whole block, BatchNorm scales and shifts included (torchvision count). {variant === 'projection' ? 'x no longer has the branch’s shape, so the skip becomes a learned 1 × 1 projection; the addition still needs identical shapes.' : variant === 'bottleneck' ? 'The 1 × 1 convolutions narrow 256 channels to 64 for the expensive 3 × 3, then widen back so the addition matches x.' : 'Both summands are 64 × 56 × 56, so the skip carries x itself with no parameters.'}</FlowReadout>
  </figure>;
}

export function DepthwiseFigure() {
  const channels = ['A', 'B', 'C'];
  return <figure className="la-figure" data-figure="landmark-depthwise" aria-label="Which input channels each output channel reads in a dense and a depthwise convolution">
    <div className="la-dw flow-columns-2">
      <div><p className="la-bridge-title">Dense 3 × 3 conv, 3 → 3</p><ul>{channels.map(c => <li key={c}><span className="la-dw-out">out {c}</span> reads <span className="la-dw-in">A</span><span className="la-dw-in">B</span><span className="la-dw-in">C</span></li>)}</ul><p>Each output channel has one 3 × 3 filter per input channel: 9 × 3 × 3 = <span className="la-amber">81 weights</span>.</p></div>
      <div><p className="la-bridge-title">Depthwise 3 × 3</p><ul>{channels.map(c => <li key={c}><span className="la-dw-out">out {c}</span> reads <span className="la-dw-in">{c}</span></li>)}</ul><p>Each channel is filtered alone: 9 × 3 = <span className="la-amber">27 weights</span>. Mixing between channels is left to the 1 × 1 convolutions around it.</p></div>
    </div>
  </figure>;
}

export function MbConvFigure() {
  const [view, setView] = useState('inverted');
  const m = anatomy.mbconv;
  const inverted = <><Tensor shape={`${m.input} × ${m.size} × ${m.size}`} note="narrow input x" supplied /><Arrow />
    <SkipBlock skipLabel={`identity: x, ${m.input} channels`}><Flow>
      <Op kind="mix" width={1} params={m.parts.expand}>1 × 1 expand, {m.input} → {m.expanded}, + BatchNorm, + SiLU</Op>
      <Op kind="conv" width={1} params={m.parts.depthwise}>3 × 3 depthwise: one filter per channel, {m.expanded} channels, + BatchNorm, + SiLU</Op>
      <GateRoute channels={m.expanded} squeeze={m.squeeze} kind="mix" activation="SiLU" params={m.parts.se} />
      <Op kind="mix" width={m.input / m.expanded} params={m.parts.project}>1 × 1 project, {m.expanded} → {m.input}, + BatchNorm, no activation (linear)</Op>
    </Flow></SkipBlock>
    <Merge symbol="⊕">branch + x (both {m.input} × {m.size} × {m.size}), no activation after</Merge><Arrow />
    <Tensor shape={`${m.input} × ${m.size} × ${m.size}`} note="block output" /></>;
  const bottleneck = <><Tensor shape="256 × 56 × 56" note="wide input x" supplied /><Arrow />
    <SkipBlock skipLabel="identity: x, 256 channels"><Flow>
      <Op kind="mix" width={.25}>1 × 1 reduce, 256 → 64, + BatchNorm, + ReLU</Op>
      <Op kind="conv" width={.25}>3 × 3 dense conv, 64 → 64, + BatchNorm, + ReLU</Op>
      <Op kind="mix" width={1}>1 × 1 expand, 64 → 256, + BatchNorm</Op>
    </Flow></SkipBlock><Merge symbol="⊕">branch + x, then + ReLU</Merge><Arrow />
    <Tensor shape="256 × 56 × 56" note="block output" /></>;
  return <figure className="la-figure" data-figure="landmark-mbconv" aria-label="MBConv's narrow-wide-narrow block beside ResNet's wide-narrow-wide bottleneck">
    {view === 'inverted' ? inverted : bottleneck}
    <FlowControls><FlowChoice label="Block" value={view} onChange={setView} options={[['inverted', 'MBConv (EfficientNet-B0)'], ['bottleneck', 'ResNet bottleneck']]} /></FlowControls>
    <FlowReadout>{view === 'inverted'
      ? <>Widths along the branch: {m.input} → {m.expanded} → {m.expanded} → {m.input}; the skip joins the two narrow ends. <strong>{fmt(m.total)}</strong> learned parameters: {fmt(m.parts.expand)} + {fmt(m.parts.depthwise)} + {fmt(m.parts.se)} (whole gate route) + {fmt(m.parts.project)} (torchvision EfficientNet-B0, stage 3, second block).</>
      : <>Widths along the branch: 256 → 64 → 64 → 256; the skip joins the two wide ends.</>}</FlowReadout>
  </figure>;
}

// Squeeze, excite, scale on two 2 × 2 channels. Live: change channel B's level, or
// rearrange channel A's cells without changing its mean.
const sePatterns = { flat: [2, 2, 2, 2], uneven: [0, 4, 2, 2] };
function TileGrid({ values, label, gate }) {
  return <div className="la-se-grid"><span className="la-se-label">{label}</span><div className="la-tiles" role="img" aria-label={`${label}: ${values.map(v => flowNumber(v, 3)).join(', ')}`}>{values.map((v, i) => <span key={i} data-positive={v > 0} data-negative={v < 0}>{flowNumber(v, 3)}</span>)}</div>{gate != null && <i className="la-gate-bar" style={{ width: `${gate * 100}%` }} aria-hidden="true" />}</div>;
}
export function SqueezeExciteFigure() {
  const [pattern, setPattern] = useState('flat'), [level, setLevel] = useState(1);
  const maps = [sePatterns[pattern], [level, level, level, level]];
  const c = channelContext(maps);
  const r = value => flowNumber(value, 4);
  return <figure className="la-figure" data-figure="landmark-se" aria-label="Squeeze, excite and scale on a two-channel example">
    <ol className="la-se">
      <li><p className="la-se-step">1 · Feature maps U: two channels, each a 2 × 2 grid</p><div className="la-se-row"><TileGrid values={maps[0]} label="channel A" /><TileGrid values={maps[1]} label="channel B" /></div></li>
      <li><p className="la-se-step">2 · Squeeze: average each channel</p><p><code>s = [{r(c.means[0])}, {r(c.means[1])}]</code>. Positions are discarded; one number per channel remains.</p></li>
      <li><p className="la-se-step">3 · Excite: a tiny learned network turns s into one gate per channel</p><p>hidden <code>h = max(a − b, 0) = {r(c.hidden)}</code>, then <code>g = sigmoid([h, −h]) = [{r(c.gates[0])}, {r(c.gates[1])}]</code></p></li>
      <li><p className="la-se-step">4 · Scale (⊗): multiply every cell of a channel by its gate; the bar is the gate</p><div className="la-se-row"><TileGrid values={c.output[0]} label={`A × ${r(c.gates[0])}`} gate={c.gates[0]} /><TileGrid values={c.output[1]} label={`B × ${r(c.gates[1])}`} gate={c.gates[1]} /></div></li>
    </ol>
    <FlowControls>
      <FlowSlider name="Every cell of channel B" value={level} onChange={setLevel} min={0} max={4} step={.25} format={value => flowNumber(value, 2)} />
      <FlowChoice label="Channel A’s cells" value={pattern} onChange={setPattern} options={[['flat', 'all 2'], ['uneven', '0, 4, 2, 2 (same mean)']]} />
    </FlowControls>
    <FlowReadout>Gates: A <strong>{r(c.gates[0])}</strong>, B <strong>{r(c.gates[1])}</strong>. {c.hidden > 0 ? <>Channel B’s mean ({r(c.means[1])}) is below A’s ({r(c.means[0])}), so h = {r(c.hidden)} pushes A’s gate up and B’s down: channel B’s level sets channel A’s gate too.</> : <>Channel B’s mean ({r(c.means[1])}) is at least A’s ({r(c.means[0])}), so the ReLU makes h = 0 and both gates sit at 0.5; raising B further changes nothing.</>} {pattern === 'uneven' ? 'A’s cells are rearranged but its mean is still 2, so the gates are the same as for an even channel A.' : ''}</FlowReadout>
  </figure>;
}

export function CompoundScalingFigure() {
  const [axis, setAxis] = useState('compound'), [phi, setPhi] = useState(2);
  const s = anatomy.scaling;
  const d = axis === 'depth' || axis === 'compound' ? s.alpha ** phi : 1;
  const w = axis === 'width' || axis === 'compound' ? s.beta ** phi : 1;
  const r = axis === 'resolution' || axis === 'compound' ? s.gamma ** phi : 1;
  const layers = Math.round(s.baseLayers * d);
  const net = (depth, width, res, label) => <div className="la-scale-net"><p className="la-bridge-title">{label}</p>
    <div className="la-scale-bars">{Array.from({ length: depth }, (_, i) => <i key={i} style={{ width: `${Math.min(100, 45 * width)}%` }} />)}</div>
    <div className="la-scale-res"><div className="la-scale-input" style={{ width: `${40 * res}px`, height: `${40 * res}px` }} aria-hidden="true" /><span>input image {Math.round(224 * res)} × {Math.round(224 * res)} px</span></div></div>;
  return <figure className="la-figure" data-figure="landmark-compound-scaling" aria-label="Three ways to grow one network, and the compound rule">
    <div className="la-scale flow-columns-2">{net(s.baseLayers, 1, 1, 'Baseline')}{net(layers, w, r, 'Scaled')}</div>
    <p className="la-caption">Each bar is one layer: the number of bars is depth and their common length is channel width. The square is the input image; its side is resolution. The drawing rounds layers to whole numbers, as real models round repeats and channels.</p>
    <FlowControls>
      <FlowChoice label="What to scale" value={axis} onChange={setAxis} options={[['width', 'Width'], ['depth', 'Depth'], ['resolution', 'Resolution'], ['compound', 'All three']]} />
      <FlowSlider name="Scaling step φ" value={phi} onChange={setPhi} min={0} max={3} step={1} format={value => String(value)} />
    </FlowControls>
    <FlowReadout>d = {d.toFixed(3)} ({layers} drawn layers from {s.baseLayers}), w = {w.toFixed(3)}, r = {r.toFixed(3)} → parameters × <strong>{(d * w * w).toFixed(3)}</strong>, convolution multiply-accumulates × <strong>{(d * w * w * r * r).toFixed(3)}</strong> under the dense-convolution approximation.</FlowReadout>
  </figure>;
}

// Text-free route sketches; the words beside each one carry the meaning.
function RouteGlyph({ index }) {
  const box = (x, y, w, h = 9) => <rect className="la-g" x={x} y={y} width={w} height={h} rx="2" />;
  const line = (x1, y1, x2, y2, dashed) => <line className="la-g-line" x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={dashed ? '3 3' : undefined} />;
  const shapes = [
    <>{box(18, 4, 28)}{line(32, 13, 32, 19)}{box(18, 19, 28, 9)}{line(32, 28, 32, 34)}{box(18, 34, 28)}{line(32, 43, 32, 49)}{box(14, 49, 36, 9)}</>,
    <><rect className="la-g-bracket" x="10" y="2" width="44" height="40" rx="3" />{box(18, 7, 28)}{box(18, 20, 28)}{box(18, 32, 28, 6)}{line(32, 42, 32, 50)}{box(18, 50, 28)}</>,
    <>{box(18, 2, 28, 7)}{[4, 18, 32, 46].map(x => <g key={x}>{line(32, 9, x + 7, 17)}{box(x, 17, 14, 20)}{line(x + 7, 37, 32, 46)}</g>)}<rect className="la-g-merge" x="12" y="46" width="40" height="7" rx="2" /></>,
    <>{box(10, 6, 30)}{box(10, 22, 30)}{line(52, 2, 52, 44, true)}{line(25, 2, 52, 2, true)}<circle className="la-g-merge" cx="25" cy="46" r="5" />{line(52, 44, 30, 46, true)}{line(25, 31, 25, 41)}</>,
    <>{box(19, 3, 12, 8)}{box(6, 15, 38, 8)}{box(6, 27, 38, 8)}{box(19, 39, 12, 8)}{line(54, 3, 54, 50, true)}<circle className="la-g-merge" cx="25" cy="53" r="4" /></>,
    <>{box(20, 20, 24, 16)}{line(32, 18, 32, 4)}{line(46, 28, 60, 28)}{line(18, 38, 6, 52)}<polygon className="la-g-head" points="29,6 32,1 35,6" /><polygon className="la-g-head" points="57,25 62,28 57,31" /><polygon className="la-g-head" points="5,47 4,54 10,52" /></>,
  ];
  return <svg className="la-glyph" viewBox="0 0 64 60" aria-hidden="true">{shapes[index]}</svg>;
}

export function RouteFamiliesFigure() {
  const families = [
    ['Chain', 'LeNet, AlexNet', 'conv + activation → pool, repeated, then dense layers', 'learn local features, combine them'],
    ['Repeated block', 'VGG', 'the same 3 × 3 convolution × n per stage', 'depth by one uniform rule'],
    ['Parallel, then ‖', 'Inception', 'several filter sizes side by side, stacked on channels', 'several scales at once; 1 × 1 keeps it affordable'],
    ['Branch + skip, then ⊕', 'ResNet', 'a correction added to the unchanged input', 'very deep stacks stay trainable'],
    ['Narrow skip, wide middle, ⊗ gate', 'MobileNet V2, EfficientNet', 'expand, depthwise filter, gate channels, project back', 'accuracy per operation'],
    ['Scale the family', 'EfficientNet B1–B7', 'grow depth, width and resolution together', 'spend extra compute deliberately'],
  ];
  return <figure className="la-figure" data-figure="landmark-route-families" aria-label="Each family changed one thing about the route">
    <ol className="la-families">{families.map(([route, who, what, why], i) => <li key={route}>
      <RouteGlyph index={i} />
      <strong>{route}</strong><span className="la-family-who">{who}</span><span>{what}</span><span className="la-family-why">Aim: {why}</span>
    </li>)}</ol>
  </figure>;
}
