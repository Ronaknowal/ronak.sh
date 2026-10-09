import React, { useState } from 'react';
import * as model from '../../data/grouped-preference-models.js';
import {
  Figure,
  Identity,
  Controls,
  Select,
  NumberField,
  Table,
  Strip,
  Bars,
  Branches,
  Branch,
  Arrow,
  Matrix,
  Curves,
  curvePoints,
  fmt,
  vector,
} from './GroupedPreferenceElements.jsx';

export function PairAndBinaryLabels() {
  const [fixture, setFixture] = useState('poor');
  const [threshold, setThreshold] = useState(0.5);
  const qualities = { poor: [0.2, 0.1], good: [0.9, 0.8], mixed: [0.8, 0.2] }[fixture];
  return (
    <Figure id="D21" label="Pair ordering versus individual labels">
      <p className="grouped-tree-root">Same prompt → two illustrative responses</p>
      <Branches>
        {qualities.map((quality, index) => (
          <Branch index={index} key={index}>
            <Identity index={index}>Response {index + 1}</Identity>
            <Bars
              label="Declared quality, 0 to 1"
              maximum={1}
              rows={[{ label: `response ${index + 1}`, value: quality, colour: index }]}
            />
            <p>
              Individual record: quality {fmt(quality)} {quality >= threshold ? '≥' : '<'} threshold{' '}
              {fmt(threshold)} →{' '}
              <strong>{quality >= threshold ? '+ desirable' : '− undesirable'}</strong>
            </p>
          </Branch>
        ))}
      </Branches>
      <p className="grouped-center">Comparison edge: response 1 ≻ response 2 in every fixture</p>
      <p>
        The threshold changes individual labels without changing the ordering. These quality numbers
        are illustrative, not measured human scores.
      </p>
      <Controls
        reset={() => {
          setFixture('poor');
          setThreshold(0.5);
        }}
      >
        <Select
          label="Underlying quality"
          value={fixture}
          onChange={setFixture}
          options={[
            ['poor', 'Both poor'],
            ['good', 'Both good'],
            ['mixed', 'One good'],
          ]}
        />
        <NumberField
          label="Desirability threshold"
          value={threshold}
          min={0}
          max={1}
          onChange={setThreshold}
        />
      </Controls>
    </Figure>
  );
}

export function KTOUtility() {
  const [distance, setDistance] = useState(0.7);
  const [beta, setBeta] = useState(0.5);
  const [weights, setWeights] = useState([1, 1]);
  const result = model.utility(distance, 0.2, beta, ...weights);
  return (
    <Figure id="D22" label="KTO utility losses and derivative magnitudes">
      <p>
        Unscaled log-ratio d = {fmt(distance)}; fixed reference k = 0.2; signed distance d−k ={' '}
        {fmt(distance - 0.2)}; scaled u = β(d−k) = {fmt(result.u)}.
      </p>
      <Curves
        label="Unscaled d (horizontal), weighted loss (vertical)"
        domain={[-12, 12]}
        marker={distance}
        series={[
          {
            name: '+ desirable loss',
            points: curvePoints(
              -12,
              12,
              (value) => model.utility(value, 0.2, beta, ...weights).desirable,
            ),
          },
          {
            name: '− undesirable loss',
            points: curvePoints(
              -12,
              12,
              (value) => model.utility(value, 0.2, beta, ...weights).undesirable,
            ),
          },
        ]}
      />
      <Curves
        label="Unscaled d (horizontal), absolute derivative (vertical)"
        domain={[-12, 12]}
        marker={distance}
        series={[
          {
            name: '|desirable derivative|',
            points: curvePoints(
              -12,
              12,
              (value) => -model.utility(value, 0.2, beta, ...weights).desirableGradient,
            ),
          },
          {
            name: '|undesirable derivative|',
            dashed: true,
            points: curvePoints(
              -12,
              12,
              (value) => model.utility(value, 0.2, beta, ...weights).undesirableGradient,
            ),
          },
        ]}
      />
      <p>
        Desirable loss {fmt(result.desirable)}, derivative {fmt(result.desirableGradient)};
        undesirable loss {fmt(result.undesirable)}, derivative {fmt(result.undesirableGradient)}.
        Equal weights overlay the derivative curves; both extremes saturate.
      </p>
      <Controls
        reset={() => {
          setDistance(0.7);
          setBeta(0.5);
          setWeights([1, 1]);
        }}
      >
        <NumberField
          label="Log-ratio d"
          value={distance}
          min={-12}
          max={12}
          onChange={setDistance}
        />
        <NumberField label="β" value={beta} min={0.1} max={2} onChange={setBeta} />
        {weights.map((value, index) => (
          <NumberField
            key={index}
            label={index === 0 ? 'Desirable weight' : 'Undesirable weight'}
            value={value}
            min={0.1}
            max={3}
            onChange={(next) => setWeights(weights.map((old, i) => (i === index ? next : old)))}
          />
        ))}
      </Controls>
    </Figure>
  );
}

export function ReferencePairing() {
  const [offset, setOffset] = useState(1);
  const [first, setFirst] = useState(0.4);
  const [partition, setPartition] = useState(4);
  const [negative, setNegative] = useState(false);
  const scores = [
    [0.9, -0.3, 0.1, 0.4],
    [-0.2, 0.8, 0.6, -0.1],
    [0.5, 0.3, 0.7, -0.4],
    [0.2, 0.6, 0.1, 1.1],
  ];
  const effectiveOffset = partition === 2 ? 1 : offset;
  const paired = (row) =>
    Math.floor(row / partition) * partition +
    (((row % partition) - effectiveOffset + partition) % partition);
  const scoreAt = (row, column) => {
    if (row === 0 && column === paired(0)) return first;
    return negative ? -Math.abs(scores[row][column]) - 0.1 : scores[row][column];
  };
  const selected = scores.map((_, index) => scoreAt(index, paired(index)));
  const batches = Array.from({ length: 4 / partition }, (_, index) =>
    selected.slice(index * partition, (index + 1) * partition),
  );
  return (
    <Figure id="D23" label="Previous-completion mismatch matrix">
      <Matrix
        label="Rows are prompts x; columns are completion y"
        size={4}
        headers={['y1', 'y2', 'y3', 'y4']}
        cell={(row, column) => (
          <span className={paired(row) === column ? 'grouped-selected' : ''}>
            {paired(row) === column ? '↗ ' : ''}
            {fmt(scoreAt(row, column))}
            {row === column ? ' observed' : ''}
          </span>
        )}
      />
      <p>
        Outlined pairs:{' '}
        {selected.map((_, index) => `(x${index + 1}, y${paired(index) + 1})`).join(', ')}. Numbers
        are constructed sequence log-ratio scores; diagonal marks the original records.
      </p>
      {batches.map((batch, index) => (
        <div key={index}>
          <p>
            Microbatch {index + 1}: {vector(batch)} → mean {fmt(model.mean(batch))} → max(0, mean) ={' '}
            {fmt(Math.max(0, model.mean(batch)))}
          </p>
          <Arrow>
            ↓ <span className="grouped-stop">detach reference point</span>
          </Arrow>
        </div>
      ))}
      <Controls
        reset={() => {
          setOffset(1);
          setFirst(0.4);
          setPartition(4);
          setNegative(false);
        }}
      >
        <NumberField
          label="First selected mismatch score"
          value={first}
          onChange={(value) => {
            setFirst(value);
            setNegative(false);
          }}
        />
        <Select
          label="Positive positional roll"
          value={effectiveOffset}
          disabled={partition === 2}
          onChange={(value) => setOffset(Number(value))}
          options={[
            [1, '+1: previous completion'],
            [2, '+2'],
            [3, '+3'],
          ]}
        />
        <Select
          label="Actual microbatch partition"
          value={partition}
          onChange={(value) => setPartition(Number(value))}
          options={[
            [4, 'One batch of four'],
            [2, 'Two batches of two (+1 each)'],
          ]}
        />
        <button
          type="button"
          onClick={() => {
            setFirst(-0.8);
            setNegative(true);
          }}
        >
          All mismatch scores negative
        </button>
      </Controls>
      <p>
        Offset zero is excluded. Splitting into pairs changes both the available partners and
        reference estimates; accumulation does not reunite the microbatches.
      </p>
    </Figure>
  );
}

export function WeightedClasses() {
  const [count, setCount] = useState(1);
  const [weight, setWeight] = useState(1);
  const terms = [...Array(count).fill(0.5 * weight), 0.5, 0.5, 0.5];
  const total = model.sum(terms);
  return (
    <Figure id="D24" label="Individual weighted terms and total-count reduction">
      <Strip
        label="Individual records"
        values={terms.map((value, index) => `${index < count ? '+ D' : '− U'}: ${fmt(value)}`)}
        coloursByIndex={terms.map((_, index) => (index < count ? 0 : 1))}
      />
      <Arrow>↓ sum every individual weighted term</Arrow>
      <Bars
        label="Class contributions before division"
        maximum={Math.max(1.5, count * weight * 0.5)}
        rows={[
          { label: `${count} desirable × ${fmt(weight)} × 0.5`, value: count * weight * 0.5 },
          { label: '3 undesirable × 1 × 0.5', value: 1.5 },
        ]}
      />
      <Table
        label="Different denominators define different objectives"
        headers={['Reduction', 'Denominator', 'Value']}
        rows={[
          ['Actual KTO total example mean', count + 3, fmt(total / (count + 3))],
          [
            'Alternative weight-sum normalization',
            count * weight + 3,
            fmt(total / (count * weight + 3)),
          ],
          ['Alternative mean of class means', 2, fmt((weight * 0.5 + 0.5) / 2)],
        ]}
      />
      <p>
        Matched-distance class contribution ratio = nD λD / nU λU = {fmt((count * weight) / 3)}.
        Here every unweighted term is 0.5.
      </p>
      <Controls
        reset={() => {
          setCount(1);
          setWeight(1);
        }}
      >
        <NumberField
          label="Desirable class weight"
          value={weight}
          min={0.1}
          max={8}
          onChange={setWeight}
        />
        <Select
          label="Desirable record copies"
          value={count}
          onChange={(value) => setCount(Number(value))}
          options={[
            [1, 'One'],
            [2, 'Two'],
            [3, 'Three'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function DetachedReference() {
  const [distance, setDistance] = useState(0.7);
  const reference = Math.max(0, 0.2 + 0.25 * distance);
  const result = model.utility(distance, reference, 0.5);
  const referenceSlope = 0.2 + 0.25 * distance > 0 ? 0.25 : 0;
  return (
    <Figure id="D25" label="Detached mismatch branch and saturation">
      <Branches>
        <Branch index={2}>
          <p>Labelled current score d ━</p>
          <Arrow>↘ subtract k</Arrow>
          <p>u = 0.5(d−k) → desirable loss</p>
          <Arrow>↑ gradient reaches labelled score</Arrow>
        </Branch>
        <Branch index={0}>
          <p>Constructed shared-coordinate mismatch mean = 0.2 + 0.25d</p>
          <Arrow>↓ clamp at 0</Arrow>
          <p>k = {fmt(reference)}</p>
          <p>
            <span className="grouped-stop">stop gradient</span> → subtraction
          </p>
        </Branch>
      </Branches>
      <Curves
        domain={[-16, 8]}
        marker={distance}
        label="Labelled d (horizontal), desirable loss (vertical)"
        series={[
          {
            name: 'Loss at each displayed reference value',
            points: curvePoints(
              -16,
              8,
              (value) => model.utility(value, Math.max(0, 0.2 + 0.25 * value), 0.5).desirable,
            ),
          },
        ]}
      />
      <Table
        label="Derivative conventions at the selected point"
        headers={['Path', 'Derivative with respect to d']}
        rows={[
          ['Intended: hold k fixed', fmt(result.desirableGradient)],
          [
            'Wrong for this update: reconnect k(d)',
            fmt(result.desirableGradient * (1 - referenceSlope)),
          ],
        ]}
      />
      <p>
        Current loss {fmt(result.desirable)}; intended gradient magnitude{' '}
        {fmt(-result.desirableGradient)}. The curve displays values with recomputed k; its geometric
        slope is the connected alternative, not the detached update derivative. At very negative d
        the desirable loss is high but both corrections become small.
        {0.2 + 0.25 * distance === 0
          ? ' At this reference threshold the connected curve is nondifferentiable; its readout uses the zero-reference-side slope. The detached update derivative remains defined.'
          : ''}
      </p>
      <Controls reset={() => setDistance(0.7)}>
        <NumberField
          label="Labelled log-ratio d"
          value={distance}
          min={-16}
          max={8}
          onChange={setDistance}
        />
        <button type="button" onClick={() => setDistance(-16)}>
          Confidently wrong desirable record
        </button>
      </Controls>
    </Figure>
  );
}
