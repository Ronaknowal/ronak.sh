import { useState } from 'react';
import { allocation, allocationValues, exchange } from '../../data/test-time-compute-models.js';
import {
  Figure,
  Drawing,
  Controls,
  Range,
  Table,
  Status,
  Plot,
  colors,
  fmt,
} from './TestTimeShared.jsx';

export function BudgetFrontier() {
  const [budget, setBudget] = useState(3),
    [overhead, setOverhead] = useState(0),
    value = allocation(budget, overhead);
  return (
    <Figure
      id="D17"
      caption="Constructed validation option values. Faint feasible region excludes overhead first. White-ring choice uses exact hundredths and lexicographic ties; these are not the GSM8K test results."
    >
      <Table
        headers={['Request', 'Option 0: work 0', 'Option 1: work 1', 'Option 2: work 2']}
        rows={allocationValues.map((values, i) => ['AB'[i], ...values.map((v) => fmt(v / 100))])}
      />
      <Plot
        xMax={4}
        yMax={2}
        xLabel="Additional request work"
        yLabel="Expected correct answers across two requests"
        region={budget - overhead}
        series={[
          {
            name: 'Nine discrete option pairs',
            color: colors[0],
            points: value.points.map((p) => [p.work, p.value / 100]),
            selected: value.selected ? [value.points.indexOf(value.selected)] : [],
          },
        ]}
      />
      <Status>
        {value.selected
          ? `Chosen [${value.selected.choices.join(', ')}]: request work ${value.selected.work} + overhead ${overhead} ≤ budget ${budget}; expected correct ${fmt(value.selected.value / 100)}, mean ${fmt(value.selected.value / 200)}.`
          : `Infeasible: overhead ${overhead} exceeds budget ${budget}.`}
      </Status>
      <Controls
        reset={() => {
          setBudget(3);
          setOverhead(0);
        }}
      >
        <Range label="Total work budget" value={budget} min={0} max={4} onChange={setBudget} />
        <Range label="Routing overhead" value={overhead} min={0} max={4} onChange={setOverhead} />
      </Controls>
      <p>A separate nonconcave counterexample: each step costs one unit.</p>
      <Drawing
        label="Greedy spends one step on each request; the better path takes both steps on B"
        height={210}
      >
        <path d="M70 165H550M70 165V25" fill="none" stroke="#adb3bf" />
        {[0, 0.3, 0.6, 0.9].map((v) => (
          <text key={v} x="55" y={170 - v * 145} textAnchor="end">
            {v}
          </text>
        ))}
        <path d="M70 165H200V121.5H340H490" fill="none" stroke={colors[0]} strokeWidth="2" />
        <path d="M70 165H200V136H340V34.5H490" fill="none" stroke={colors[1]} strokeWidth="2" />
        <text x="500" y="125">
          A: 0,.3,.3
        </text>
        <text x="500" y="39">
          B: 0,.2,.9
        </text>
        <text x="180" y="197">
          Option 1
        </text>
        <text x="320" y="197">
          Option 2
        </text>
      </Drawing>
      <p>
        Greedy takes A's .3 then B's .2, totaling .5. Exact allocation spends both units on B,
        totaling .9. The second B increment requires its first.
      </p>
    </Figure>
  );
}
export function AllocationInformation() {
  return (
    <Figure
      id="D18"
      caption="Proposed evaluation architecture. Gold labels never enter the live router or selector. Sample marks indicate partitions, not a quantitative split ratio."
    >
      <Drawing
        label="Validation data freezes a policy; live inputs pass through the policy before test-label evaluation"
        height={350}
      >
        {[0, 1, 2].map((row) => (
          <g key={row}>
            {Array.from({ length: 5 }, (_, j) => (
              <circle
                key={j}
                cx={30 + 22 * j}
                cy={45 + 120 * row}
                r="6"
                fill={colors[row]}
                fillOpacity={row === 2 ? 0 : 0.6}
                stroke={colors[row]}
              />
            ))}
          </g>
        ))}
        <text x="10" y="75">
          Validation
        </text>
        <text x="10" y="195">
          Live prompts
        </text>
        <text x="10" y="315">
          Untouched test labels
        </text>
        <path d="M145 45H290V120" fill="none" stroke={colors[0]} />
        <text x="175" y="34">
          estimate → freeze
        </text>
        <path d="M290 125l55 40 -55 40 -55 -40Z" fill="none" stroke="#c6cbd6" />
        <text x="265" y="170">
          router
        </text>
        <path d="M145 165H235M345 165H475" fill="none" stroke={colors[1]} />
        <text x="360" y="145">
          generate → select
        </text>
        <circle cx="510" cy="165" r="25" fill="none" stroke="#eee" />
        <text x="495" y="170">
          eval
        </text>
        <path d="M145 285H510V194" fill="none" stroke={colors[2]} strokeDasharray="5 5" />
        <path d="M145 285L265 205" stroke="#777" strokeDasharray="3 5" />
        <path d="M195 235l18 18m0 -18l-18 18" stroke="#f498ba" strokeWidth="3" />
        <text x="235" y="270">
          blocked leakage
        </text>
      </Drawing>
    </Figure>
  );
}
export function AmortizedWork() {
  const [y, setY] = useState(10),
    [m, setM] = useState(2),
    value = exchange(y, m),
    px = (n) => (450 * n) / value.total;
  return (
    <Figure
      id="D19"
      caption="Blue = training work; amber = inference work. Equal total work is an accounting constraint, not an equal-quality claim. X is fixed at 100 work units."
    >
      <Drawing
        label="Equal total work divided between larger-model training and smaller-model inference"
        height={230}
      >
        {[
          { label: 'Larger', train: 100 * m, infer: m * y },
          { label: 'Smaller', train: 100, infer: value.inference },
        ].map((r, i) => (
          <g key={r.label}>
            <text x="5" y={65 + i * 80}>
              {r.label}
            </text>
            <rect
              x="110"
              y={40 + i * 80}
              width={px(r.train)}
              height="30"
              fill={colors[0]}
              fillOpacity=".4"
            />
            <rect
              x={110 + px(r.train)}
              y={40 + i * 80}
              width={px(r.infer)}
              height="30"
              fill={colors[2]}
              fillOpacity=".4"
            />
            <text x="110" y={95 + i * 80}>
              Training {fmt(r.train)} + inference {fmt(r.infer)}
            </text>
          </g>
        ))}
        <path d="M110 190H560" stroke="#aeb5c4" />
        <text x="110" y="215">
          0
        </text>
        <text x="560" y="215" textAnchor="end">
          {fmt(value.total)} work units
        </text>
      </Drawing>
      <Status>
        Available inference multiplier a = {fmt(value.multiplier)}. Both totals = {fmt(value.total)}{' '}
        work units.
      </Status>
      <Controls
        reset={() => {
          setY(10);
          setM(2);
        }}
      >
        <Range
          label="Baseline inference work Y"
          value={y}
          min={10}
          max={100}
          step={10}
          onChange={setY}
        />
        <Range
          label="Larger-model work multiplier M"
          value={m}
          min={1}
          max={4}
          step={0.5}
          onChange={setM}
        />
      </Controls>
    </Figure>
  );
}
export function ProviderFields() {
  return (
    <Figure
      id="D20"
      caption="UNSENT requests and a SUPPLIED accounting example. These fields do not establish that a selected model supports the same options or that a request was executed."
    >
      <Table
        headers={['Provider', 'Request paths → purpose', 'Response paths → retained observation']}
        rows={[
          [
            'OpenAI',
            <span className="ttc-file-path">
              reasoning.{'{'}effort{'}'} → effort hint
              <br />
              max_output_tokens → output cap
            </span>,
            <span className="ttc-file-path">
              status / incomplete_details
              <br />
              usage.{'{'}output_tokens, output_tokens_details.reasoning_tokens{'}'}
            </span>,
          ],
          [
            'Claude',
            <span className="ttc-file-path">
              thinking.type: adaptive + output_config.effort
              <br />
              or manual thinking.budget_tokens
            </span>,
            <span className="ttc-file-path">
              stop_reason
              <br />
              usage.{'{'}input_tokens, output_tokens{'}'}
            </span>,
          ],
          [
            'DeepSeek',
            <span className="ttc-file-path">
              thinking.{'{'}type{'}'} → thinking mode
            </span>,
            <span className="ttc-file-path">
              choices[].message.reasoning_content
              <br />
              finish_reason / usage
            </span>,
          ],
        ]}
      />
      <Drawing
        label="Output accounting 100 includes 70 reasoning tokens and 30 other accounted tokens"
        height={145}
      >
        <path d="M65 25V15H565V25" stroke="#d0d5df" fill="none" />
        <text x="310" y="42" textAnchor="middle">
          100 output tokens
        </text>
        <rect x="65" y="58" width="350" height="27" fill={colors[1]} fillOpacity=".45" />
        <rect x="415" y="58" width="150" height="27" fill="#8a919f" fillOpacity=".3" />
        <text x="80" y="113">
          70 reasoning
        </text>
        <text x="395" y="113">
          30 other accounting
        </text>
      </Drawing>
      <p>The remainder is not a verified count of visible-text tokens.</p>
    </Figure>
  );
}
