import { useState } from "react";
import {
  NeuralLab,
  NeuralNumber,
  NeuralSelect,
  NeuralTable,
  formatNeural as format,
} from "./NeuralLessonElements.jsx";
import {
  pairedAndCross,
  tensorBoundary,
} from "../../data/tensor-boundary-models.js";
import "./neural-lesson-neutral.css";
import "./tensor-boundary-lessons.css";

export function TensorContractFigure() {
  const steps = [
    ["Input X[B,F]", "B observations, F features each"],
    ["× W[F,O]", "Sum over F; keep B and O"],
    ["+ b[O]", "Reuse each output bias across B rows"],
    ["Prediction [B,O]", "One O-vector for each observation"],
  ];
  return (
    <figure className="tensor-contract" data-figure="tensor-axis-contract">
      <figcaption>
        Carry axis meanings through the forward computation
      </figcaption>
      <ol className="tensor-contract-steps">
        {steps.map(([title, text]) => (
          <li key={title}>
            <strong>{title}</strong>
            <span>{text}</span>
          </li>
        ))}
      </ol>
      <p>
        Prediction [B,O] − paired target [B,O] → residual [B,O] → square → sum
        and divide by 2×B×O → scalar loss.
      </p>
      <p>
        The shared F axis is contracted by matrix multiplication. The shared B
        axis pairs each output row with that same observation’s target.
      </p>
    </figure>
  );
}

function ResidualMatrix({ rows, cross }) {
  return (
    <div
      className="tensor-residual-grid"
      style={{
        gridTemplateColumns: `minmax(60px, 1fr) repeat(${cross ? 2 : 1}, minmax(65px, 1fr))`,
      }}
    >
      <span className="tensor-grid-heading">Row</span>
      {cross ? (
        <>
          <span className="tensor-grid-heading">target 0</span>
          <span className="tensor-grid-heading">target 1</span>
        </>
      ) : (
        <span className="tensor-grid-heading">paired target</span>
      )}
      {rows.map((row, index) => (
        <div className="tensor-residual-row" key={index}>
          <span className="tensor-grid-heading">p{index}</span>
          {row.map((value, column) => (
            <span
              key={column}
              className={
                cross && column !== index
                  ? "tensor-cross-pair"
                  : "tensor-paired-cell"
              }
            >
              {format(value, 2)}
              <small>
                p{index} − y{cross ? column : index}
              </small>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function TensorBroadcastLab() {
  const [p0, setP0] = useState(1);
  const [p1, setP1] = useState(3);
  const [y0, setY0] = useState(2);
  const [y1, setY1] = useState(4);
  const result = pairedAndCross([p0, p1], [y0, y1]);

  function reset() {
    setP0(1);
    setP1(3);
    setY0(2);
    setY1(4);
  }

  return (
    <NeuralLab
      id="tensor-broadcast-pairing"
      title="A missing axis changes who gets compared"
    >
      <p>
        Edit one prediction or target. Both panels use the same four values and
        half mean squared error, but their shape contracts pair those values
        differently.
      </p>
      <div className="neural-controls">
        <NeuralNumber
          label="Prediction p0"
          value={p0}
          min={-4}
          max={6}
          step={0.25}
          onChange={setP0}
        />
        <NeuralNumber
          label="Prediction p1"
          value={p1}
          min={-4}
          max={6}
          step={0.25}
          onChange={setP1}
        />
        <NeuralNumber
          label="Target y0"
          value={y0}
          min={-4}
          max={6}
          step={0.25}
          onChange={setY0}
        />
        <NeuralNumber
          label="Target y1"
          value={y1}
          min={-4}
          max={6}
          step={0.25}
          onChange={setY1}
        />
      </div>
      <div className="tensor-comparison-panels">
        <figure data-figure="tensor-paired-residuals">
          <figcaption>Paired: [2,1] − [2,1] → [2,1]</figcaption>
          <ResidualMatrix
            rows={result.paired.map((value) => [value])}
            cross={false}
          />
          <p>
            Loss = sum of 2 squared residuals / 4 ={" "}
            <strong>{format(result.pairedLoss, 3)}</strong>
          </p>
          <p>
            ∂L/∂p = [
            {result.pairedGradient.map((value) => format(value, 3)).join(", ")}]
          </p>
        </figure>
        <figure data-figure="tensor-cross-residuals">
          <figcaption>Cross-pairs: [2,1] − [2] → [2,2]</figcaption>
          <ResidualMatrix rows={result.cross} cross />
          <p>
            Loss = sum of 4 squared residuals / 8 ={" "}
            <strong>{format(result.crossLoss, 3)}</strong>
          </p>
          <p>
            ∂L/∂p = [
            {result.crossGradient.map((value) => format(value, 3)).join(", ")}]
          </p>
        </figure>
      </div>
      <p>
        Amber cells are the intended p0−y0 and p1−y1 pairs. Gray cross-cells
        introduce dependencies on the other target. Change y1 alone to see the
        first paired gradient stay fixed while the first cross-gradient changes.
      </p>
      <NeuralTable
        caption="The update direction follows the actual comparisons"
        headers={["Prediction", "Paired derivative", "Cross-pair derivative"]}
        rows={result.pairedGradient.map((value, index) => [
          `p${index}`,
          format(value, 3),
          format(result.crossGradient[index], 3),
        ])}
      />
      <button type="button" onClick={reset}>
        Reset paired observations
      </button>
    </NeuralLab>
  );
}

export function TensorBoundaryLab() {
  const [mode, setMode] = useState("connected");
  const [weight, setWeight] = useState(2);
  const [x, setX] = useState(3);
  const [bias, setBias] = useState(1);
  const [target, setTarget] = useState(0);
  const result = tensorBoundary(mode, weight, x, bias, target);

  function reset() {
    setMode("connected");
    setWeight(2);
    setX(3);
    setBias(1);
    setTarget(0);
  }

  return (
    <NeuralLab
      id="tensor-storage-gradient-boundary"
      title="Same value, different memory and gradient routes"
    >
      <p>
        Switch the product’s routing operation while keeping its values fixed.
        Forward output, storage relation and backward connectivity are shown
        separately.
      </p>
      <div className="neural-controls">
        <NeuralSelect
          label="Product routing"
          value={mode}
          onChange={setMode}
          options={[
            ["connected", "Original product"],
            ["clone", "product.clone()"],
            ["detach", "product.detach()"],
            ["detached-copy", "product.detach().clone()"],
          ]}
        />
        <NeuralNumber
          label="Weight w"
          value={weight}
          min={-3}
          max={3}
          step={0.25}
          onChange={setWeight}
        />
        <NeuralNumber
          label="Input x"
          value={x}
          min={-3}
          max={3}
          step={0.25}
          onChange={setX}
        />
        <NeuralNumber
          label="Bias b"
          value={bias}
          min={-3}
          max={3}
          step={0.25}
          onChange={setBias}
        />
        <NeuralNumber
          label="Target"
          value={target}
          min={-12}
          max={12}
          step={0.25}
          onChange={setTarget}
        />
      </div>
      <figure
        className="tensor-path-figure"
        data-figure="tensor-forward-reverse-path"
      >
        <figcaption>Forward: values flow through every route</figcaption>
        <ol className="tensor-path-steps">
          <li>
            <strong>w × x</strong>
            <span>
              {format(weight)} × {format(x)} = {format(result.product)}
            </span>
          </li>
          <li>
            <strong>{mode}</strong>
            <span>Routed value {format(result.product)}</span>
          </li>
          <li>
            <strong>+ b</strong>
            <span>Output {format(result.output)}</span>
          </li>
          <li>
            <strong>− target</strong>
            <span>Residual {format(result.residual)}</span>
          </li>
          <li>
            <strong>½ residual²</strong>
            <span>Loss {format(result.loss, 3)}</span>
          </li>
        </ol>
        <div className="tensor-storage-relation">
          <strong>
            Storage: product{" "}
            {result.shared ? "↔ same buffer ↔" : "→ independent copy →"} routed
            value
          </strong>
          <span>
            {result.shared
              ? "A mutation through an alias can affect the same stored value."
              : "A separate buffer holds the same number at this moment."}
          </span>
        </div>
        <div className="tensor-backward-relation">
          <strong>
            Backward starts with residual {format(result.residual)}
          </strong>
          <p>
            To bias: × 1 →{" "}
            <strong>∂L/∂b = {format(result.biasGradient)}</strong>
          </p>
          <p>
            To weight:{" "}
            {result.tracked
              ? `through product, × x (${format(x)}) →`
              : "stopped at detach →"}{" "}
            <strong>
              ∂L/∂w ={" "}
              {result.weightGradient === null
                ? "None (unused route)"
                : format(result.weightGradient)}
            </strong>
          </p>
        </div>
      </figure>
      <p>
        {result.tracked
          ? result.weightGradient === 0
            ? "The route exists, but its derivative is zero at these values. Move the target or input to inspect why."
            : "This loss can update the weight through the product. Cloning preserves that route."
          : "The product still supplies its forward value. Only its route back to w is removed; the bias remains connected."}
      </p>
      <button type="button" onClick={reset}>
        Reset values and routing
      </button>
    </NeuralLab>
  );
}
