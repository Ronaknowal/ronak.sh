import { useState } from "react";
import {
  NeuralLab,
  NeuralNumber,
  NeuralSelect,
  NeuralTable,
  formatNeural as f,
} from "./NeuralLessonElements.jsx";
import {
  histogramView,
  scalePositions,
} from "../../data/visualization-models.js";
import wineSummary from "../../data/visualization-wine-summary.json";
import "./neural-lesson-neutral.css";
import "./visualization-lessons.css";

export function VisualizationPipelineFigure() {
  return (
    <figure className="visualization-pipeline">
      <figcaption>Every mark has a traceable input</figcaption>
      <div className="visualization-lanes">
        <div>
          <strong>Observation</strong>
          <p>
            Wine row_id = 1<br />
            alcohol = 13.2
            <br />
            cultivar = 0
          </p>
        </div>
        <div>
          <strong>→ Statistic</strong>
          <p>
            Bin [13,13.5)
            <br />
            add one count
            <br />
            divide by n × 0.5
          </p>
        </div>
        <div>
          <strong>→ Encoding</strong>
          <p>
            x: interval edges
            <br />
            height: density
            <br />
            area: sample fraction
          </p>
        </div>
        <div>
          <strong>→ Figure</strong>
          <p>
            Named axes + units
            <br />
            sample size + caption
            <br />
            data and code identity
          </p>
        </div>
      </div>
      <p>
        Arrows identify transformations, not elapsed time. Changing a
        statistical rule changes what the visible mark means.
      </p>
    </figure>
  );
}
export function HistogramMeaningLab() {
  const [last, setLast] = useState(8);
  const [widths, setWidths] = useState("unequal");
  const [mode, setMode] = useState("density");
  const result = histogramView(last, widths === "equal", mode === "density"),
    max = Math.max(...result.bins.map((b) => b.height), 0.1) * 1.15;
  const x = (v) => 70 + (v / 8) * 386,
    y = (v) => 222 - (v / max) * 174;
  return (
    <NeuralLab
      id="visual-histogram"
      title="The same observations, different rectangles"
    >
      <p>
        Seven observations stay fixed. Edit the eighth and change how bins are
        drawn. Exact counts and areas update together.
      </p>
      <div className="neural-controls">
        <NeuralNumber
          label="Eighth observation"
          value={last}
          min={0}
          max={8}
          step={0.25}
          onChange={setLast}
        />
        <NeuralSelect
          label="Bin widths"
          value={widths}
          onChange={setWidths}
          options={[
            ["unequal", "Unequal: 2, 2, 4"],
            ["equal", "Equal: 2, 2, 2, 2"],
          ]}
        />
        <NeuralSelect
          label="Rectangle height"
          value={mode}
          onChange={setMode}
          options={[
            ["density", "Count / (8 × bin width)"],
            ["count", "Raw count"],
          ]}
        />
      </div>
      <p>
        Current observations: <strong>{result.values.join(", ")}</strong>.
      </p>
      <figure>
        <figcaption>
          {mode === "density"
            ? "Density per measurement unit"
            : "Count per bin"}
          ; x = measurement value
        </figcaption>
        <svg
          className="visualization-chart"
          viewBox="0 0 480 270"
          role="img"
          aria-label={`Histogram on x range 0 to 8. ${result.bins.map((b) => `${b.lo} to ${b.hi}: count ${b.count}, height ${f(b.height)}`).join("; ")}`}
        >
          {[0, max / 2, max].map((v) => (
            <g key={v}>
              <line x1="70" x2="456" y1={y(v)} y2={y(v)} stroke="#444" />
              <text x="60" y={y(v) + 4} textAnchor="end">
                {f(v, 2)}
              </text>
            </g>
          ))}
          {result.bins.map((b) => (
            <rect
              key={b.lo}
              x={x(b.lo)}
              y={y(b.height)}
              width={x(b.hi) - x(b.lo)}
              height={222 - y(b.height)}
              fill="#e4b752"
              stroke="#111"
              strokeWidth="2"
            />
          ))}
          {[0, 2, 4, 6, 8].map((v) => (
            <text key={v} x={x(v)} y="246" textAnchor="middle">
              {v}
            </text>
          ))}
        </svg>
      </figure>
      <NeuralTable
        caption="A bin’s area is its height × width"
        headers={["Interval", "Count", "Width", "Height", "Area"]}
        rows={result.bins.map((b, i) => [
          `${b.lo} ≤ x ${i === result.bins.length - 1 ? "≤" : "<"} ${b.hi}`,
          b.count,
          b.width,
          f(b.height),
          f(b.area),
        ])}
      />
      <p>
        <strong>Total rectangle area: {f(result.area)}.</strong>{" "}
        {mode === "density"
          ? "Area is normalized to one. Wider bins need lower height for the same fraction of observations."
          : widths === "unequal"
            ? "These raw-count areas do not represent sample fractions: width changes area even at equal counts. Compare density at the same edges."
            : "Equal widths make areas proportional to counts. The area total is not normalized to one."}
      </p>
      <button
        type="button"
        onClick={() => {
          setLast(8);
          setWidths("unequal");
          setMode("density");
        }}
      >
        Reset observations and bins
      </button>
    </NeuralLab>
  );
}
export function ScaleMeaningLab() {
  const [value, setValue] = useState(10);
  const positions = scalePositions(value);
  return (
    <NeuralLab id="visual-scales" title="Equal differences or equal ratios?">
      <p>
        The plotted marks are read-only. Use the labeled slider below to move the observation.
        The endpoints stay at 1 and 100. Compare the same middle observation on
        both coordinate systems; no observation or tick value is log-transformed
        in the labels.
      </p>
      <NeuralNumber
        label="Movable observation"
        value={value}
        min={1}
        max={100}
        step={0.1}
        onChange={setValue}
      />
      {Object.entries(positions).map(([name, position]) => (
        <figure key={name}>
          <figcaption>
            {name === "linear"
              ? "Linear: equal differences"
              : "Logarithmic: equal ratios"}{" "}
            · position {f(100 * position, 2)}% of the interval
          </figcaption>
          <svg
            className="visualization-ruler"
            viewBox="0 0 480 72"
            role="img"
            aria-label={`${name} position of ${value} is ${f(100 * position, 2)} percent from 1 to 100`}
          >
            <line x1="30" x2="450" y1="25" y2="25" stroke="#aaa" />
            <circle cx="30" cy="25" r="4" fill="#ccc" />
            <circle cx="450" cy="25" r="4" fill="#ccc" />
            <circle
              cx={30 + 420 * position}
              cy="25"
              r="7"
              fill="#e4b752"
              stroke="#111"
            />
            <text x="30" y="59" textAnchor="middle">
              1
            </text>
            <text x="450" y="59" textAnchor="middle">
              100
            </text>
          </svg>
        </figure>
      ))}
      <p>
        Selected value <strong>{f(value)}</strong>. Linear fraction = (
        {f(value)} − 1) / 99. Log fraction = log₁₀({f(value)}) / 2.{" "}
        {value === 1 || value === 100
          ? "At an endpoint, both positions coincide; their internal spacing still differs."
          : Math.abs(value - 10) < 1e-8
            ? "Ten is halfway in ratios (×10, then ×10), but only 9/99 of the way in differences."
            : "Compare where the point sits relative to the fixed endpoints; both rulers contain exactly the same value."}
      </p>
      <button type="button" onClick={() => setValue(10)}>
        Reset to 10
      </button>
    </NeuralLab>
  );
}

export function WineDistributionFigure() {
  const ymax = 1;
  const x = (value) => 48 + ((value - 10.5) / 5) * 264;
  const y = (value) => 176 - (value / ymax) * 140;
  return (
    <figure className="visualization-pipeline" data-figure="wine-distributions">
      <figcaption>
        Observed Wine distributions: common bins and common density scale
      </figcaption>
      <p>
        Each panel uses its cultivar’s sample count as the denominator. Every
        panel has area 1; counts remain visible in the heading. These are the
        executed program’s actual CSV counts.
      </p>
      <div className="visualization-wine-panels">
        {wineSummary.groups.map((group) => (
          <div key={group.cultivar}>
            <h4>
              Cultivar {group.cultivar} · n = {group.n}
            </h4>
            <svg
              className="visualization-wine-chart"
              viewBox="0 0 336 216"
              role="img"
              aria-label={`Cultivar ${group.cultivar}, ${group.n} observed wines. Mean alcohol ${f(group.mean, 3)}. Common half-unit bins; density axis 0 to 1.`}
            >
              {[0, 0.5, 1].map((tick) => (
                <g key={tick}>
                  <line
                    x1="48"
                    x2="312"
                    y1={y(tick)}
                    y2={y(tick)}
                    stroke="#444"
                  />
                  <text x="38" y={y(tick) + 5} textAnchor="end">
                    {tick}
                  </text>
                </g>
              ))}
              {group.density.map((height, i) => (
                <rect
                  key={i}
                  x={x(wineSummary.edges[i])}
                  y={y(height)}
                  width={x(wineSummary.edges[i + 1]) - x(wineSummary.edges[i])}
                  height={176 - y(height)}
                  fill="#e4b752"
                  stroke="#111"
                />
              ))}
              {[10.5, 13, 15.5].map((tick) => (
                <text key={tick} x={x(tick)} y="204" textAnchor="middle">
                  {tick}
                </text>
              ))}
            </svg>
            <p>
              Mean {f(group.mean, 3)} · sample SD {f(group.sample_sd, 3)}
            </p>
          </div>
        ))}
      </div>
      <p>
        x: alcohol in recorded units · y: density per alcohol unit. Cultivar 1
        is shifted toward lower recorded alcohol; overlap remains. Mean
        differences do not imply a complete classifier or a causal effect.
      </p>
      <NeuralTable
        caption="Native counts behind the figure; common intervals [left,right), last right edge included"
        headers={[
          "Cultivar",
          ...wineSummary.edges
            .slice(0, -1)
            .map((edge, i) => `${edge}–${wineSummary.edges[i + 1]}`),
        ]}
        rows={wineSummary.groups.map((group) => [
          group.cultivar,
          ...group.counts,
        ])}
      />
    </figure>
  );
}
