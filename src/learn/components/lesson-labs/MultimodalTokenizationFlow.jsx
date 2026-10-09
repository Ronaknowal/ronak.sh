import { useEffect, useState } from "react";
import {
  FlowLab,
  FlowControls,
  FlowSlider,
  FlowChoice,
  FlowReadout,
  flowNumber,
} from "./LessonFlow.jsx";
import {
  MODALITY_COLORS,
  IDENTITY_COLORS,
  INITIAL_PIXELS,
  CODEBOOK,
  AUDIO_MATRIX,
  PACKED_EXAMPLE,
  patchImage,
  nearestCode,
  residualQuantize,
  orderAudio,
  sampleVideo,
  namespaceId,
  inputBudget,
  usageStatistics,
  tubeletCount,
} from "../../data/multimodal-tokenization-models.js";
import "./multimodal-tokenization-flow.css";

const colour = (index) => IDENTITY_COLORS[index % IDENTITY_COLORS.length];
const vectorText = (values) =>
  `[${values.map((value) => flowNumber(value, 4)).join(", ")}]`;
const modalityStyle = (name) => ({ "--mm-colour": MODALITY_COLORS[name] });
const identityStyle = (index) => ({ "--mm-colour": colour(index) });

function Drawing({ name, label, children, caption }) {
  return (
    <figure className="mm-drawing" data-mm-figure={name} aria-label={label}>
      {children}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Arrow({ label, className = "" }) {
  return (
    <div className={`mm-arrow ${className}`.trim()}>
      {label && <span>{label}</span>}
      <svg viewBox="0 0 36 32" width="36" height="32" aria-hidden="true">
        <path
          d="M18 2V26M11 19L18 26L25 19"
          fill="none"
          stroke="currentColor"
        />
      </svg>
    </div>
  );
}

function Vector({ values, identity, modality = "image", label, patchId }) {
  return (
    <div className="mm-vector-object">
      {label && <p className="mm-label">{label}</p>}
      <div
        className="mm-vector"
        data-patch-id={patchId}
        style={
          identity === undefined
            ? modalityStyle(modality)
            : identityStyle(identity)
        }
      >
        {values.map((value, index) => (
          <span className="mm-value" key={index}>
            {typeof value === "number" ? flowNumber(value, 4) : value}
          </span>
        ))}
      </div>
    </div>
  );
}

function Matrix({
  rows = 3,
  columns = 4,
  modality = "image",
  label,
  rowModalities,
}) {
  return (
    <div className="mm-matrix-object">
      <p className="mm-label">{label}</p>
      <div
        className="mm-matrix"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1.5rem))` }}
        aria-label={`${rows} rows, ${columns} components per row`}
      >
        {Array.from({ length: rows * columns }, (_, index) => (
          <span
            key={index}
            style={modalityStyle(
              rowModalities?.[Math.floor(index / columns)] ?? modality
            )}
            aria-hidden="true"
          />
        ))}
      </div>
      <small>
        {rows} positions × {columns} components
      </small>
    </div>
  );
}

function PixelGrid({
  values,
  side = 4,
  label,
  editable = false,
  onEdit,
  patchSide,
  selectedPatch,
  onSelectPatch,
}) {
  const patchesPerAxis = patchSide ? side / patchSide : 0;
  return (
    <div className="mm-pixel-object">
      <p className="mm-label">{label}</p>
      <div
        className="mm-pixel-grid"
        style={{ gridTemplateColumns: `repeat(${side}, minmax(0, 1fr))` }}
      >
        {values.map((value, index) => {
          const intensity = Math.round(value * 255);
          const style = {
            backgroundColor: `rgb(${intensity}, ${intensity}, ${intensity})`,
            color: value > 0.5 ? "#111" : "#f4f4f4",
          };
          const cellLabel = `Row ${Math.floor(index / side) + 1}, column ${
            (index % side) + 1
          }: intensity ${flowNumber(value, 4)}`;
          return editable ? (
            <button
              type="button"
              key={index}
              style={style}
              data-intensity={value}
              aria-label={`${cellLabel}; toggle pixel`}
              onClick={() => onEdit(index)}
            >
              {flowNumber(value, 2)}
            </button>
          ) : (
            <span
              key={index}
              style={style}
              data-intensity={value}
              aria-label={cellLabel}
            />
          );
        })}
        {patchSide &&
          Array.from({ length: patchesPerAxis ** 2 }, (_, index) => (
            <span
              className={`mm-patch-outline ${
                selectedPatch === index ? "mm-selected-patch" : ""
              }`}
              data-patch-id={String.fromCharCode(65 + index)}
              key={`patch-${index}`}
              aria-hidden="true"
              style={{
                ...identityStyle(index),
                left: `${((index % patchesPerAxis) / patchesPerAxis) * 100}%`,
                top: `${
                  (Math.floor(index / patchesPerAxis) / patchesPerAxis) * 100
                }%`,
                width: `${100 / patchesPerAxis}%`,
                height: `${100 / patchesPerAxis}%`,
              }}
            >
              <b>{String.fromCharCode(65 + index)}</b>
            </span>
          ))}
      </div>
      {onSelectPatch && (
        <small>
          Pixels toggle intensity. Choose a labelled patch below to trace its
          row.
        </small>
      )}
    </div>
  );
}

function Waveform() {
  const points = Array.from(
    { length: 65 },
    (_, index) =>
      `${24 + index * 3.8},${
        48 - 24 * Math.sin(index * 0.62) * Math.sin(index * 0.07)
      }`
  ).join(" ");
  return (
    <div>
      <p className="mm-label" style={modalityStyle("audio")}>
        Audio samples · illustrative waveform
      </p>
      <svg
        className="mm-svg mm-wave"
        viewBox="0 0 300 96"
        role="img"
        aria-label="A constructed waveform: amplitudes ordered in time"
      >
        <title>Audio amplitudes in time</title>
        <line x1="24" y1="48" x2="272" y2="48" className="mm-axis" />
        <polyline
          points={points}
          fill="none"
          stroke={MODALITY_COLORS.audio}
          strokeWidth="2"
        />
        <text x="24" y="88">
          time →
        </text>
      </svg>
    </div>
  );
}

export function InterfaceFigure() {
  return (
    <Drawing
      name="interface"
      label="Pixels and sound reach the model through continuous features or discrete dictionary addresses"
      caption="Amber text follows its own lookup lane. Media chooses one of two named alternatives; the numeric dictionary example traces an image feature. Blue image and violet audio rows retain their modality hues. Matrix shapes illustrate positions and width, not a particular model configuration."
    >
      <p className="mm-label">Media lane · structured signals</p>
      <div className="mm-grid-2 mm-signal-inputs">
        <PixelGrid values={INITIAL_PIXELS} label="Image pixels · 4×4" />
        <Waveform />
      </div>
      <Arrow label="image/audio encoders compute media features" />
      <p className="mm-interface-choice">Choose one media interface</p>
      <svg
        className="mm-branch-wire"
        viewBox="0 0 300 32"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M150 2V14H75V28M150 14H225V28M72 25L75 28L78 25M222 25L225 28L228 25"
          fill="none"
          stroke="currentColor"
        />
      </svg>
      <div className="mm-grid-2 mm-alternatives">
        <div className="mm-interface-branch">
          <p className="mm-label">Continuous branch · keep features</p>
          <Matrix
            rows={2}
            columns={2}
            rowModalities={["image", "audio"]}
            label="Computed media feature rows"
          />
          <Arrow label="learned width adapter" />
          <div className="mm-interface-output">
            <Matrix
              rows={2}
              columns={4}
              rowModalities={["image", "audio"]}
              label="Vectors supplied directly"
            />
          </div>
        </div>
        <div className="mm-interface-branch">
          <p className="mm-label">Discrete branch · store addresses</p>
          <Vector values={[0.8, 0.6]} label="Trace one image feature" />
          <Arrow label="nearest row in a finite codebook" />
          <Vector values={[3]} label="Stored image integer address" />
          <Arrow label="dictionary lookup: k 3 → (1, 1)" />
          <Vector values={[1, 1]} label="Retrieved image vector" />
          <Arrow label="width adapter if needed" />
          <div className="mm-interface-output">
            <Matrix
              rows={2}
              columns={4}
              rowModalities={["image", "audio"]}
              label="Retrieved vectors at model width"
            />
          </div>
        </div>
      </div>
      <svg
        className="mm-branch-wire"
        viewBox="0 0 300 32"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M75 2V14H150V28M225 2V14H150M147 25L150 28L153 25"
          fill="none"
          stroke="currentColor"
        />
      </svg>
      <p className="mm-interface-choice">Either media route supplies vectors</p>
      <p className="mm-label">Independent text lane · constructed dictionary</p>
      <div className="mm-text-route">
        <Vector
          values={["Which", "stroke", "moved?"]}
          modality="text"
          label="Pieces"
        />
        <Arrow label="assign IDs" className="mm-text-connector" />
        <Vector values={[2, 5, 7]} modality="text" label="Integer IDs" />
        <Arrow label="lookup" className="mm-text-connector" />
        <Matrix rows={3} columns={4} modality="text" label="Text vectors" />
      </div>
      <Arrow label="media vectors + text vectors, at the same width" />
      <Matrix
        rows={5}
        columns={4}
        rowModalities={["image", "audio", "text", "text", "text"]}
        label="Transformer input · aligned vector width"
      />
    </Drawing>
  );
}

export function PatchProjectionLab() {
  const [pixels, setPixels] = useState([...INITIAL_PIXELS]);
  const [patchSide, setPatchSide] = useState(2);
  const [selectedPatch, setSelectedPatch] = useState(0);
  const data = patchImage(pixels, patchSide);
  const patch = data.patches[selectedPatch];
  function changePatchSide(value) {
    setPatchSide(value);
    setSelectedPatch(0);
  }
  function reset() {
    setPixels([...INITIAL_PIXELS]);
    setPatchSide(2);
    setSelectedPatch(0);
  }
  return (
    <FlowLab
      id="mm-patch-projection"
      label="Change pixel groups and trace their shared linear projection"
    >
      <Drawing
        name="patch-projection"
        label="A selected square of pixels becomes an ordered vector and two projected values"
      >
        <div className="mm-grid-2">
          <PixelGrid
            values={pixels}
            label="4×4 image · intensity 0 dark, 1 bright"
            editable
            onEdit={(index) =>
              setPixels((previous) =>
                previous.map((value, i) => (i === index ? 1 - value : value))
              )
            }
            patchSide={patchSide}
            selectedPatch={selectedPatch}
            onSelectPatch={setSelectedPatch}
          />
          <div>
            <PixelGrid
              values={patch.values}
              side={patchSide}
              label={`Selected patch ${patch.id} · ${patchSide}×${patchSide}`}
            />
            <Arrow label="row-major: left to right, top to bottom" />
            <Vector
              values={patch.values}
              identity={patch.index}
              patchId={patch.id}
              label={`${patch.id}'s flattened row · ${data.vectorWidth} entries`}
            />
            <Arrow label="same supplied projection for every patch" />
            <Vector
              values={patch.projected}
              identity={patch.index}
              patchId={patch.id}
              label="Output: sum even indices, sum odd indices"
            />
            <p className="mm-equation">
              {patch.values.filter((_, index) => index % 2 === 0).join(" + ") ||
                "0"}{" "}
              = {flowNumber(patch.projected[0])}
              <br />
              {patch.values.filter((_, index) => index % 2 === 1).join(" + ") ||
                "0"}{" "}
              = {flowNumber(patch.projected[1])}
            </p>
          </div>
        </div>
        <div
          className="mm-patch-rows"
          aria-label="Every patch uses the same projection"
        >
          {data.patches.map((item) => (
            <div
              key={item.id}
              data-patch-id={item.id}
              className={item.index === selectedPatch ? "mm-selected-row" : ""}
              style={identityStyle(item.index)}
            >
              <strong>{item.id}</strong>
              <span>{vectorText(item.values)}</span>
              <span>→ {vectorText(item.projected)}</span>
            </div>
          ))}
        </div>
      </Drawing>
      <FlowControls>
        <FlowChoice
          label="Patch side P"
          options={[
            [1, "1"],
            [2, "2"],
            [4, "4"],
          ]}
          value={patchSide}
          onChange={changePatchSide}
        />
        <FlowChoice
          label="Trace patch"
          options={data.patches.map((item) => [item.index, item.id])}
          value={selectedPatch}
          onChange={setSelectedPatch}
        />
        <button type="button" onClick={reset}>
          Reset
        </button>
      </FlowControls>
      <FlowReadout
        data-model={JSON.stringify({
          pixels,
          patchSide,
          selectedPatch,
          ...data,
        })}
      >
        {data.count} patches, each containing {data.vectorWidth} pixels, become{" "}
        {data.count} vectors of width 2. Dashed white selection follows patch{" "}
        {patch.id}; its identity hue stays fixed.
      </FlowReadout>
    </FlowLab>
  );
}

export function ConditioningFigure() {
  return (
    <Drawing
      name="conditioning"
      label="Contrast inserted visual vectors and separate visual memory"
    >
      <div className="mm-grid-2">
        <div>
          <Matrix rows={3} columns={3} label="Vision features · width dᵥ" />
          <Arrow label="projector changes width to dₗₘ" />
          <Matrix rows={3} columns={5} label="Projected image rows" />
          <Arrow label="insert alongside text embeddings" />
          <Matrix
            rows={5}
            columns={5}
            rowModalities={["text", "image", "image", "image", "text"]}
            label="One self-attention sequence · width dₗₘ"
          />
          <p className="mm-note">Blue image rows count as positions here.</p>
        </div>
        <div>
          <Matrix rows={3} columns={3} label="Separate visual memory" />
          <svg
            className="mm-svg"
            viewBox="0 0 300 118"
            role="img"
            aria-label="Text query rows attend to distinct image memory"
          >
            <title>Text queries read visual memory</title>
            <path
              d="M65 96V28M130 96V28M195 96V28M58 35L65 28L72 35M123 35L130 28L137 35M188 35L195 28L202 35"
              fill="none"
              stroke={MODALITY_COLORS.text}
            />
            <text x="24" y="16">
              read image keys / values
            </text>
            <text x="24" y="112">
              text queries ↑ cross-attention
            </text>
          </svg>
          <Matrix
            rows={2}
            columns={5}
            modality="text"
            label="Text sequence at a selected layer"
          />
          <p className="mm-note">
            Visual rows remain outside text self-attention.
          </p>
        </div>
      </div>
    </Drawing>
  );
}

const plotX = (value) => 34 + ((value + 1.5) / 3) * 228;
const plotY = (value) => 262 - ((value + 1.5) / 3) * 228;

function ArrowLine({ from, to, stroke = "#ddd", dashed = false }) {
  const x1 = plotX(from[0]);
  const y1 = plotY(from[1]);
  const x2 = plotX(to[0]);
  const y2 = plotY(to[1]);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const length = Math.hypot(x2 - x1, y2 - y1);
  return (
    <g stroke={stroke} fill="none">
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        strokeDasharray={dashed ? "4 3" : undefined}
      />
      {length > 8 && (
        <path
          d={`M${x2 - 6 * Math.cos(angle - 0.55)} ${
            y2 - 6 * Math.sin(angle - 0.55)
          }L${x2} ${y2}L${x2 - 6 * Math.cos(angle + 0.55)} ${
            y2 - 6 * Math.sin(angle + 0.55)
          }`}
        />
      )}
    </g>
  );
}

function Plane({ title, children }) {
  return (
    <svg
      className="mm-svg mm-plane"
      viewBox="0 0 300 300"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect
        x="34"
        y="34"
        width="228"
        height="228"
        fill="none"
        className="mm-axis"
      />
      <line x1="34" y1={plotY(0)} x2="262" y2={plotY(0)} className="mm-axis" />
      <line x1={plotX(0)} y1="34" x2={plotX(0)} y2="262" className="mm-axis" />
      <text x="34" y="282">
        −1.5
      </text>
      <text x="244" y="282">
        1.5
      </text>
      <text x="147" y="295">
        x
      </text>
      <text x="3" y="40">
        1.5
      </text>
      <text x="0" y="263">
        −1.5
      </text>
      <text x="10" y="150">
        y
      </text>
      {children}
    </svg>
  );
}

export function QuantizationLab() {
  const [x, setX] = useState(0.8);
  const [y, setY] = useState(0.6);
  const result = nearestCode([x, y]);
  return (
    <FlowLab
      id="mm-quantization"
      label="Move a continuous feature and inspect its nearest dictionary entry"
    >
      <Drawing
        name="quantization"
        label="Four fixed dictionary points and a moving encoder feature"
      >
        <div className="mm-grid-2">
          <Plane title="Equal-scale nearest-code geometry: four corners at ±1; white circle is the encoder feature">
            <ArrowLine from={[x, y]} to={result.vector} dashed />
            {CODEBOOK.map((point, index) => (
              <g key={index}>
                <rect
                  data-code-id={index}
                  x={plotX(point[0]) - 5}
                  y={plotY(point[1]) - 5}
                  width="10"
                  height="10"
                  fill={colour(index)}
                />
                <text
                  x={plotX(point[0]) + (point[0] < 0 ? -20 : 9)}
                  y={plotY(point[1]) + (point[1] > 0 ? -12 : 22)}
                  style={{ fill: colour(index) }}
                >
                  k {index}
                </text>
                {index === result.index && (
                  <rect
                    x={plotX(point[0]) - 9}
                    y={plotY(point[1]) - 9}
                    width="18"
                    height="18"
                    fill="none"
                    stroke="#fff"
                    strokeDasharray="3 2"
                  />
                )}
              </g>
            ))}
            <circle
              cx={plotX(x)}
              cy={plotY(y)}
              r="5"
              fill="#fff"
              stroke="#111"
            />
          </Plane>
          <div>
            <p className="mm-label">Squared distance to each labelled code</p>
            <table className="mm-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Vector</th>
                  <th>‖z−e‖²</th>
                </tr>
              </thead>
              <tbody>
                {CODEBOOK.map((point, index) => (
                  <tr
                    key={index}
                    style={identityStyle(index)}
                    className={index === result.index ? "mm-selected-row" : ""}
                  >
                    <th>k {index}</th>
                    <td>{vectorText(point)}</td>
                    <td>{flowNumber(result.distances[index], 4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Arrow
              label={`store integer ${result.index}, then dictionary lookup`}
            />
            <Vector
              values={result.vector}
              identity={result.index}
              label={`Retrieved k ${result.index}`}
            />
          </div>
        </div>
      </Drawing>
      <FlowControls>
        <FlowSlider
          name="Encoder x"
          min={-1.5}
          max={1.5}
          step={0.1}
          value={x}
          onChange={setX}
        />
        <FlowSlider
          name="Encoder y"
          min={-1.5}
          max={1.5}
          step={0.1}
          value={y}
          onChange={setY}
        />
        <button
          type="button"
          onClick={() => {
            setX(0.8);
            setY(0.6);
          }}
        >
          Reset
        </button>
      </FlowControls>
      <FlowReadout data-model={JSON.stringify({ point: [x, y], ...result })}>
        Feature {vectorText([x, y])} selects k {result.index},{" "}
        {vectorText(result.vector)}. Squared error{" "}
        {flowNumber(result.distance, 4)}. At exact ties the first index wins;
        hues identify entries, not distance.
      </FlowReadout>
    </FlowLab>
  );
}

function GradientRoute({
  route,
  left,
  right,
  loss,
  gradient,
  destination,
  stopped,
  reconstruction = false,
}) {
  return (
    <div>
      <p className="mm-label">{route}</p>
      <svg
        className="mm-svg"
        viewBox="0 0 300 188"
        role="img"
        aria-label={`${loss}; gradient ${gradient} reaches ${destination}; ${stopped}`}
      >
        <title>{`${route}: gradient ownership`}</title>
        <text x="24" y="22">
          {left}
        </text>
        <text x="180" y="22">
          {right}
        </text>
        {reconstruction ? (
          <path d="M48 38H228V70L138 102" fill="none" stroke="#aaa" />
        ) : (
          <>
            <line x1="48" y1="38" x2="48" y2="70" stroke="#aaa" />
            <line x1="228" y1="38" x2="228" y2="70" stroke="#aaa" />
            <path d="M48 70L138 102L228 70" fill="none" stroke="#aaa" />
            <line
              x1={destination === "encoder" ? 220 : 40}
              x2={destination === "encoder" ? 236 : 56}
              y1="54"
              y2="54"
              stroke="#fff"
              strokeWidth="3"
            />
          </>
        )}
        <text x="138" y="125" textAnchor="middle">
          {loss}
        </text>
        <path
          d={
            destination === "encoder"
              ? "M130 138L48 168V90M41 97L48 90L55 97"
              : "M148 138L228 168V90M221 97L228 90L235 97"
          }
          fill="none"
          stroke="#fff"
          strokeDasharray="4 3"
        />
        {reconstruction && (
          <path
            d="M148 138L228 168V90M221 97L228 90L235 97"
            fill="none"
            stroke="#fff"
            strokeDasharray="4 3"
          />
        )}
        <text x="138" y="184" textAnchor="middle">
          {reconstruction
            ? "2 → decoder, encoder (STE)"
            : `gradient ${gradient} → ${destination}`}
        </text>
        <text x="138" y="60" textAnchor="middle">
          {stopped}
        </text>
      </svg>
    </div>
  );
}

export function GradientFigure() {
  return (
    <Drawing
      name="gradients"
      label="VQ forward values and the three distinct backward routes"
      caption="Solid lines carry values forward. Dashed white routes carry gradients; sg stops a backward route while keeping its value. Here the decoder is the identity and the target is 0."
    >
      <div className="mm-forward-values">
        <Vector values={[0.8]} label="Encoder z" />
        <Arrow label="hard lookup forward; STE backward" />
        <Vector values={[1]} identity={3} label="Selected e / zst" />
        <Arrow label="identity decoder" />
        <Vector values={[1]} label="Reconstruction x̂" />
      </div>
      <div className="mm-grid-3">
        <GradientRoute
          route="Reconstruction + straight-through"
          left="encoder z = .8"
          right="decoder x̂ = 1"
          loss="(1 − 0)² = 1"
          gradient="2"
          destination="encoder"
          stopped="codebook bypassed"
          reconstruction
        />
        <GradientRoute
          route="Codebook loss"
          left="sg(z) = .8"
          right="code e = 1"
          loss="(.8 − 1)² = .04"
          gradient=".4"
          destination="codebook"
          stopped="STOP at encoder"
        />
        <GradientRoute
          route="Commitment · β = .25"
          left="encoder z = .8"
          right="sg(e) = 1"
          loss=".25(.8 − 1)² = .01"
          gradient="−.1"
          destination="encoder"
          stopped="STOP at codebook"
        />
      </div>
      <p className="mm-equation">
        Encoder: 2 − .1 = 1.9. Selected code: .4. At learning rate .1: z → .61,
        e → .96.
      </p>
    </Drawing>
  );
}

function validateDigitArtifact(data) {
  const validGrid = (grid, size, predicate) =>
    Array.isArray(grid) &&
    grid.length === size &&
    grid.every(
      (row) => Array.isArray(row) && row.length === size && row.every(predicate)
    );
  const intensity = (value) =>
    Number.isFinite(value) && value >= 0 && value <= 1;
  if (
    data?.schema_version !== 1 ||
    data.epochs !== 30 ||
    !Array.isArray(data.examples) ||
    data.examples.length !== 2 ||
    !data.examples.every(
      (example) =>
        example.split === "heldout" &&
        Number.isInteger(example.source_index) &&
        Number.isInteger(example.label) &&
        Number.isFinite(example.reconstruction_mse_mean) &&
        validGrid(example.original_8x8, 8, intensity) &&
        validGrid(example.reconstructed_8x8, 8, intensity) &&
        validGrid(
          example.latent_ids_4x4,
          4,
          (value) => Number.isInteger(value) && value >= 0 && value < 16
        )
    )
  )
    throw new Error(
      "The saved digit arrays do not match the expected fixed-run record."
    );
  return data;
}

function GrayscaleImage({ grid, label }) {
  return (
    <div>
      <p className="mm-label">{label} · 8×8</p>
      <svg
        className="mm-svg mm-digit-image"
        viewBox="0 0 240 240"
        role="img"
        aria-label={`${label}; intensities from 0 dark to 1 bright`}
      >
        <title>{`${label} · actual held-out digit values`}</title>
        {grid.flatMap((row, r) =>
          row.map((value, c) => {
            const gray = Math.round(value * 255);
            return (
              <rect
                key={`${r}-${c}`}
                data-intensity={value}
                x={24 + c * 24}
                y={24 + r * 24}
                width="24"
                height="24"
                fill={`rgb(${gray}, ${gray}, ${gray})`}
              >
                <title>{`Row ${r + 1}, column ${c + 1}: ${flowNumber(
                  value,
                  6
                )}`}</title>
              </rect>
            );
          })
        )}
        <rect
          x="24"
          y="24"
          width="192"
          height="192"
          fill="none"
          stroke="#888"
        />
      </svg>
    </div>
  );
}

export function DigitReconstructionFigure() {
  const [attempt, setAttempt] = useState(0);
  const [record, setRecord] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    fetch("/learn-code/multimodal-tokenization/digits_reconstructions.json", {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok)
          throw new Error("The saved digit record could not be loaded.");
        return response.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setRecord(validateDigitArtifact(data));
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure.message);
      });
    return () => controller.abort();
  }, [attempt]);
  const example = record?.examples[selected];
  return (
    <FlowLab
      id="mm-digit-reconstruction"
      label="Inspect two actual held-out digit reconstructions from the fixed trained model"
    >
      <Drawing
        name="digit-reconstruction"
        label="Actual original digit, learned code grid and decoded reconstruction"
      >
        {!record && !error && (
          <p role="status">
            Loading the saved original, code grid and reconstruction…
          </p>
        )}
        {error && (
          <div>
            <p role="alert">{error}</p>
            <FlowControls>
              <button
                type="button"
                onClick={() => setAttempt((value) => value + 1)}
              >
                Retry digit record
              </button>
            </FlowControls>
          </div>
        )}
        {example && (
          <>
            <div className="mm-grid-3 mm-digit-triplet">
              <GrayscaleImage grid={example.original_8x8} label="Original" />
              <div>
                <p className="mm-label">Encoder → code IDs · 4×4</p>
                <div className="mm-code-grid">
                  {example.latent_ids_4x4.flat().map((id, index) => (
                    <span
                      key={index}
                      data-code-id={id}
                      className="mm-value"
                      style={identityStyle(id)}
                    >
                      {id}
                    </span>
                  ))}
                </div>
                <Arrow label="matching dictionary + pixel decoder" />
              </div>
              <GrayscaleImage
                grid={example.reconstructed_8x8}
                label="Reconstructed"
              />
            </div>
            <div className="mm-grayscale-key">
              <span>0 · dark</span>
              <span className="mm-grayscale-scale" aria-hidden="true" />
              <span>1 · bright</span>
            </div>
            <p className="mm-note">
              The same grayscale scale applies to both images. Code hues repeat;
              literal IDs identify the learned entries. This is saved output
              from 30 epochs, not live training.
            </p>
          </>
        )}
      </Drawing>
      {record && (
        <>
          <FlowControls>
            <FlowChoice
              label="Held-out example"
              options={record.examples.map((item, index) => [
                index,
                `Digit ${item.label} · source ${item.source_index}`,
              ])}
              value={selected}
              onChange={setSelected}
            />
          </FlowControls>
          <FlowReadout>
            Source {example.source_index}, label {example.label}, held-out
            split. Mean squared pixel error{" "}
            {flowNumber(example.reconstruction_mse_mean, 6)}. Fixed run:{" "}
            {record.train_images} training and {record.heldout_images} held-out
            images; seed {record.seed}.
          </FlowReadout>
        </>
      )}
    </FlowLab>
  );
}

export function UtilizationFigure() {
  const counts = [4, 2, 0, 2];
  const usage = usageStatistics(counts);
  return (
    <Drawing
      name="utilization"
      label="Code assignment counts and a fixed three-by-three scalar quantization grid"
    >
      <div className="mm-grid-2">
        <div>
          <p className="mm-label">Eight assignments → counts per code</p>
          <svg
            className="mm-svg"
            viewBox="0 0 300 218"
            role="img"
            aria-label="Code counts: k0 four, k1 two, k2 zero, k3 two"
          >
            <title>Observed counts in this batch</title>
            {counts.map((count, index) => (
              <g key={index}>
                <text x="4" y={40 + index * 40} style={{ fill: colour(index) }}>
                  k {index}
                </text>
                <rect
                  x="46"
                  y={25 + index * 40}
                  width={count * 48}
                  height="20"
                  fill={colour(index)}
                />
                <text x="250" y={40 + index * 40}>
                  {count}
                </text>
              </g>
            ))}
            <line x1="46" y1="187" x2="238" y2="187" className="mm-axis" />
            <text x="46" y="209">
              0
            </text>
            <text x="229" y="209">
              4
            </text>
            <text x="130" y="209">
              count
            </text>
          </svg>
          <p>
            Entropy {flowNumber(usage.entropy, 3)} bits; perplexity{" "}
            {flowNumber(usage.perplexity, 3)}. Code 2 is absent in this batch.
          </p>
        </div>
        <div>
          <p className="mm-label">FSQ · three fixed levels per component</p>
          <svg
            className="mm-svg"
            viewBox="0 0 300 240"
            role="img"
            aria-label="Nine fixed grid entries indexed k equals i0 plus three i1; i0 two and i1 one gives k5"
          >
            <title>Fixed product grid: k = i₀ + 3i₁</title>
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <line
                  x1="70"
                  y1={174 - i * 62}
                  x2="230"
                  y2={174 - i * 62}
                  className="mm-grid-line"
                />
                <line
                  x1={70 + i * 80}
                  y1="50"
                  x2={70 + i * 80}
                  y2="174"
                  className="mm-grid-line"
                />
                <text x={70 + i * 80} y="207" textAnchor="middle">
                  {i}
                </text>
                <text x="32" y={178 - i * 62}>
                  {i}
                </text>
              </g>
            ))}
            {Array.from({ length: 9 }, (_, k) => (
              <g key={k}>
                <circle
                  cx={70 + (k % 3) * 80}
                  cy={174 - Math.floor(k / 3) * 62}
                  r="16"
                  fill="#111"
                  stroke={k === 5 ? "#fff" : "#aaa"}
                  strokeDasharray={k === 5 ? "3 2" : undefined}
                />
                <text
                  x={70 + (k % 3) * 80}
                  y={178 - Math.floor(k / 3) * 62}
                  textAnchor="middle"
                >
                  k{k}
                </text>
              </g>
            ))}
            <text x="110" y="233">
              component index i₀
            </text>
            <text x="5" y="24">
              component index i₁ ↑
            </text>
          </svg>
          <p>
            Indices 0,1,2 represent values −1,0,1. The outlined point is k5:
            (i₀,i₁)=(2,1).
          </p>
        </div>
      </div>
    </Drawing>
  );
}

export function ResidualLab() {
  const [levels, setLevels] = useState(3);
  const allStages = residualQuantize([0.8, 0.6], 3).stages;
  const result = residualQuantize([0.8, 0.6], levels);
  return (
    <FlowLab
      id="mm-residual"
      label="Add quantized corrections and inspect the remaining residual"
    >
      <Drawing
        name="residual"
        label="Successive code vectors add to approximate one input feature"
      >
        <div className="mm-grid-2">
          <div>
            <Plane title="Residual quantization in equal-scale coordinates: white input circle, violet selected sum and dashed remaining residual">
              {result.stages.map((stage, index) => (
                <ArrowLine
                  key={stage.level}
                  from={index === 0 ? [0, 0] : result.stages[index - 1].sum}
                  to={stage.sum}
                  stroke={colour(stage.index)}
                />
              ))}
              <ArrowLine from={result.sum} to={[0.8, 0.6]} dashed />
              <rect
                x={plotX(result.sum[0]) - 5}
                y={plotY(result.sum[1]) - 5}
                width="10"
                height="10"
                fill={MODALITY_COLORS.audio}
              />
              <circle
                cx={plotX(0.8)}
                cy={plotY(0.6)}
                r="4"
                fill="#fff"
                stroke="#111"
              />
              <text x={plotX(0) + 8} y={plotY(0) + 19}>
                origin
              </text>
            </Plane>
            <p className="mm-note">
              Circle: input z=(.8,.6). Violet square: selected sum. Each
              coloured segment adds a labelled code vector; dashed white segment
              is what remains.
            </p>
          </div>
          <div className="mm-residual-stages">
            {allStages.map((stage) => (
              <div
                key={stage.level}
                className={stage.level === levels ? "mm-selected-row" : ""}
              >
                <p className="mm-label">
                  Stage {stage.level} · book coordinates ±
                  {flowNumber(1 / 2 ** (stage.level - 1), 2)}
                </p>
                <Vector
                  values={stage.vector}
                  identity={stage.index}
                  label={`Chosen local k ${stage.index}`}
                />
                <p>
                  Input residual {vectorText(stage.inputResidual)}
                  <br />
                  Sum {vectorText(stage.sum)}
                  <br />
                  Remaining {vectorText(stage.residual)}
                  <br />
                  Squared error {flowNumber(stage.error, 4)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Drawing>
      <FlowControls>
        <FlowSlider
          name="Residual levels"
          value={levels}
          min={1}
          max={3}
          step={1}
          onChange={setLevels}
          format={(value) => String(value)}
        />
        <button type="button" onClick={() => setLevels(3)}>
          Reset
        </button>
      </FlowControls>
      <FlowReadout data-model={JSON.stringify({ levels, ...result })}>
        {levels} levels reconstruct {vectorText(result.sum)}. Remaining residual{" "}
        {vectorText(result.residual)}, squared error{" "}
        {flowNumber(result.error, 4)}. Later-stage calculations stay visible;
        white outline identifies the current depth.
      </FlowReadout>
    </FlowLab>
  );
}

export function AudioOrderingLab() {
  const [order, setOrder] = useState("time");
  const sequence = orderAudio(AUDIO_MATRIX, order);
  return (
    <FlowLab
      id="mm-audio-order"
      label="Reorder the same audio level-by-time indices without losing their codebook names"
    >
      <Drawing
        name="audio-order"
        label="Two levels and three frames serialize in time-major or level-major order"
        caption="Hues follow level identity here: level 0 and level 1 use different dictionaries. Each output retains its (frame, level) labels; ordering changes neighbours, not the indices."
      >
        <div className="mm-audio-matrix">
          <span />
          {[0, 1, 2].map((frame) => (
            <span key={frame}>frame {frame}</span>
          ))}
          {AUDIO_MATRIX.flatMap((row, level) => [
            <span key={`label-${level}`} style={identityStyle(level)}>
              level {level}
            </span>,
            ...row.map((id, frame) => (
              <span
                className="mm-value"
                key={`${level}-${frame}`}
                style={identityStyle(level)}
              >
                {id}
              </span>
            )),
          ])}
        </div>
        <Arrow
          label={
            order === "time"
              ? "frame first, then level"
              : "level first, then frame"
          }
        />
        <ol className="mm-ordered-codes">
          {sequence.map((item) => (
            <li
              key={`${item.frame}-${item.level}`}
              style={identityStyle(item.level)}
            >
              <span>
                frame {item.frame} · level {item.level}
              </span>
              <strong className="mm-value">local {item.id}</strong>
              <small>global {item.globalId}</small>
            </li>
          ))}
        </ol>
      </Drawing>
      <FlowControls>
        <FlowChoice
          label="Serialization"
          options={[
            ["time", "Time-major"],
            ["level", "Level-major"],
          ]}
          value={order}
          onChange={setOrder}
        />
        <button type="button" onClick={() => setOrder("time")}>
          Reset
        </button>
      </FlowControls>
      <FlowReadout
        data-model={JSON.stringify({ order, matrix: AUDIO_MATRIX, sequence })}
      >
        {sequence.length} IDs in both orders. Preserve 3 frames, 2 levels and
        the ordering convention to reconstruct the matrix. Local ID 0 at level 0
        differs from local ID 0 at level 1.
      </FlowReadout>
    </FlowLab>
  );
}

export function VideoVolumeFigure() {
  const frames = Array.from({ length: 4 }, (_, frame) =>
    INITIAL_PIXELS.map((_, index) => (index % 4 === frame ? 1 : 0))
  );
  const count = tubeletCount(4, 4, 4, 2, 2);
  return (
    <Drawing
      name="video-volume"
      label="Four spatial frame grids and a tubelet spanning two frames"
      caption="This constructed volume has four supplied frames. Patch A–D borders follow the same spatial locations; white dashed outlines select the two-frame A tubelet. Pixel gray still means intensity."
    >
      <div className="mm-grid-4">
        {frames.map((pixels, frame) => (
          <div key={frame}>
            <PixelGrid
              values={pixels}
              label={`f${frame} · t=${flowNumber(frame / 4, 2)} s`}
              patchSide={2}
              selectedPatch={frame < 2 ? 0 : undefined}
            />
            <small>4×4 pixels · four 2×2 patches</small>
          </div>
        ))}
      </div>
      <Arrow label="same spatial square across two adjacent frames" />
      <div className="mm-grid-2">
        <div>
          <p className="mm-label">One tubelet · τ=2, P=2, C=1</p>
          <svg
            className="mm-svg"
            viewBox="0 0 300 220"
            role="img"
            aria-label="Two stacked two-by-two patches form eight grayscale values"
          >
            <title>Eight values in a two-frame spatial block</title>
            {[1, 0].map((frame) => (
              <g key={frame}>
                {Array.from({ length: 4 }, (_, index) => {
                  const value =
                    frames[frame][Math.floor(index / 2) * 4 + (index % 2)];
                  const x =
                    52 +
                    (index % 2) * 56 +
                    Math.floor(index / 2) * 18 +
                    frame * 24;
                  const y = 52 + Math.floor(index / 2) * 44 + frame * 48;
                  return (
                    <polygon
                      key={index}
                      points={`${x},${y} ${x + 56},${y} ${x + 74},${y + 44} ${
                        x + 18
                      },${y + 44}`}
                      fill={value ? "#f0f0f0" : "#161616"}
                      stroke={colour(0)}
                    />
                  );
                })}
                <text x="220" y={68 + frame * 48}>
                  f{frame}
                </text>
              </g>
            ))}
            <path
              d="M48 48L172 48L232 192L108 192Z"
              fill="none"
              stroke="#fff"
              strokeDasharray="4 3"
            />
            <text x="38" y="214">
              time depth 2 × height 2 × width 2
            </text>
          </svg>
        </div>
        <div>
          <Vector
            values={[
              ...frames[0].filter(
                (_, index) => index < 2 || index === 4 || index === 5
              ),
              ...frames[1].filter(
                (_, index) => index < 2 || index === 4 || index === 5
              ),
            ]}
            identity={0}
            label="Eight tubelet values · frame, row, column order"
          />
          <Arrow label="one shared tubelet projection" />
          <Matrix
            rows={1}
            columns={4}
            modality="video"
            label="One vector for this spacetime block"
          />
          <p>
            All supplied frames: 16 separate frame patches, or {count} two-frame
            tubelets. Grouping retains both frames' values before projection.
          </p>
        </div>
      </div>
    </Drawing>
  );
}

export function VideoSamplingLab() {
  const [fps, setFps] = useState(4);
  const result = sampleVideo(fps);
  const sx = (time) => 30 + (time / 2) * 240;
  return (
    <FlowLab
      id="mm-video-sampling"
      label="Change frame sampling and see whether it observes a brief flash"
    >
      <Drawing
        name="video-sampling"
        label="Sampling instants on a two-second clip containing a brief flash"
      >
        <p className="mm-label">
          Constructed flash: .45–.55 seconds. Sample interval [0,2).
        </p>
        <svg
          className="mm-svg mm-timeline"
          viewBox="0 0 300 118"
          role="img"
          aria-label={`${fps} frames per second; ${
            result.retained ? "flash sampled" : "flash missed"
          }`}
        >
          <title>Sampling before encoding</title>
          <rect
            x={sx(0.45)}
            y="20"
            width={sx(0.55) - sx(0.45)}
            height="50"
            fill={MODALITY_COLORS.video}
            fillOpacity=".3"
          />
          <line x1="30" y1="58" x2="270" y2="58" className="mm-axis" />
          {result.times.map((time) => (
            <circle
              key={time}
              cx={sx(time)}
              cy="58"
              r={result.hitTimes.includes(time) ? 5 : 3}
              fill={MODALITY_COLORS.video}
              stroke={
                result.hitTimes.includes(time) ? "#fff" : MODALITY_COLORS.video
              }
              strokeWidth="2"
            />
          ))}
          {[0, 1, 2].map((time) => (
            <g key={time}>
              <line
                x1={sx(time)}
                y1="78"
                x2={sx(time)}
                y2="84"
                className="mm-axis"
              />
              <text x={sx(time)} y="103" textAnchor="middle">
                {time} s
              </text>
            </g>
          ))}
        </svg>
        <div className="mm-sample-times">
          {result.times.map((time) => (
            <span
              key={time}
              style={modalityStyle("video")}
              className={result.hitTimes.includes(time) ? "mm-hit-sample" : ""}
            >
              {flowNumber(time, 3)} s
              {result.hitTimes.includes(time) ? " · flash" : ""}
            </span>
          ))}
        </div>
      </Drawing>
      <FlowControls>
        <FlowSlider
          name="Sampling rate (frames/s)"
          min={1}
          max={8}
          step={1}
          value={fps}
          onChange={setFps}
          format={(value) => String(value)}
        />
        <button type="button" onClick={() => setFps(4)}>
          Reset
        </button>
      </FlowControls>
      <FlowReadout data-model={JSON.stringify({ fps, ...result })}>
        {result.times.length} sampled frames.{" "}
        {result.retained
          ? `Flash retained at ${result.hitTimes
              .map((time) => flowNumber(time, 3))
              .join(", ")} s.`
          : "Flash missed: none of the supplied frames observes it."}{" "}
        White outlines mark samples inside the event; the rose interval stays
        fixed as the rate changes.
      </FlowReadout>
    </FlowLab>
  );
}

export function NamespaceFigure() {
  const ranges = [
    ["text", "Text", 0, 7],
    ["image", "Image", 8, 11],
    ["audio", "Audio level 0", 12, 15],
    ["audio", "Audio level 1", 16, 19],
    [null, "Markers", 20, 23],
  ];
  return (
    <Drawing
      name="namespace"
      label="Separate address ranges, typed positions and shifted text training targets"
    >
      <div className="mm-namespace-ranges">
        {ranges.map(([modality, label, start, end]) => (
          <div
            key={label}
            style={
              modality ? modalityStyle(modality) : { "--mm-colour": "#aaa" }
            }
          >
            <span>
              {label} · {start}..{end}
            </span>
            <div className="mm-vector">
              {Array.from({ length: end - start + 1 }, (_, index) => (
                <span className="mm-value" key={index}>
                  {start + index}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mm-grid-2">
        <div>
          <p className="mm-label">Same local address, different dictionary</p>
          <table className="mm-table">
            <thead>
              <tr>
                <th>Namespace</th>
                <th>Local</th>
                <th>Global</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["text", "text"],
                ["image", "image"],
                ["audio0", "audio"],
                ["audio1", "audio"],
              ].map(([name, modality]) => (
                <tr key={name} style={modalityStyle(modality)}>
                  <th>{name}</th>
                  <td>3</td>
                  <td>{namespaceId(name, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <p className="mm-label">
            Causal attention · query may read earlier keys
          </p>
          <div
            className="mm-causal-grid"
            aria-label="Six query rows and six key columns; keys at or before each query are allowed"
          >
            {Array.from({ length: 36 }, (_, index) => (
              <span
                key={index}
                className={
                  index % 6 <= Math.floor(index / 6)
                    ? "mm-allowed-key"
                    : "mm-future-key"
                }
                aria-label={`Query ${Math.floor(index / 6)}, key ${
                  index % 6
                }: ${
                  index % 6 <= Math.floor(index / 6) ? "allowed" : "future"
                }`}
              />
            ))}
          </div>
          <small>
            Rows: query 0→5 ↓. Columns: key 0→5 →. Filled: allowed; dashed:
            future.
          </small>
        </div>
      </div>
      <p className="mm-label">Input positions and their next-target labels</p>
      <div className="mm-pack-positions">
        {PACKED_EXAMPLE.ids.map((id, index) => (
          <div
            key={index}
            style={
              id >= 8 && id < 12
                ? modalityStyle("image")
                : id < 8
                ? modalityStyle("text")
                : { "--mm-colour": "#aaa" }
            }
          >
            <small>position {index}</small>
            <strong className="mm-value">{id}</strong>
            <span>
              {id === 20
                ? "image start"
                : id === 21
                ? "image end"
                : id < 8
                ? "text"
                : "image code"}
            </span>
            <Arrow />
            <span
              className={
                PACKED_EXAMPLE.nextTargets[index] === -100
                  ? "mm-ignore-target"
                  : "mm-text-target"
              }
            >
              {PACKED_EXAMPLE.nextTargets[index] === -100
                ? "−100 · ignore"
                : `predict ${PACKED_EXAMPLE.nextTargets[index]}`}
            </span>
          </div>
        ))}
      </div>
      <figcaption>
        The final image marker at position 3 predicts text ID 3; position 4
        predicts text ID 4. The attention triangle and loss-target labels
        perform different jobs. Continuous inserted vectors bypass categorical
        image lookup.
      </figcaption>
    </Drawing>
  );
}

export function BudgetLab() {
  const [duration, setDuration] = useState(2);
  const [levels, setLevels] = useState(8);
  const result = inputBudget(duration, levels);
  const domain = Math.max(result.budget, result.total);
  const segments = [
    ["text", "Text", result.text],
    [null, "Markers", result.markers],
    ["image", "Image", result.image],
    ["audio", "Audio", result.audio],
  ];
  return (
    <FlowLab
      id="mm-budget"
      label="Allocate an inline input budget to text, image and flattened audio positions"
    >
      <Drawing
        name="budget"
        label="Exact stacked input positions compared with a 2048-position budget"
      >
        <p className="mm-label">
          Positions on one common scale: 0 to {domain}. White line: input budget{" "}
          {result.budget}.
        </p>
        <div
          className="mm-budget-bar"
          role="img"
          aria-label={`Text ${result.text}, markers ${result.markers}, image ${result.image}, audio ${result.audio}; total ${result.total}`}
        >
          {segments.map(([modality, label, count]) => (
            <span
              key={label}
              style={{
                width: `${(count / domain) * 100}%`,
                backgroundColor: modality ? MODALITY_COLORS[modality] : "#aaa",
              }}
            />
          ))}
          <i
            style={{ left: `${(result.budget / domain) * 100}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="mm-budget-counts">
          {segments.map(([modality, label, count]) => (
            <div
              key={label}
              style={
                modality ? modalityStyle(modality) : { "--mm-colour": "#aaa" }
              }
            >
              <span>{label}</span>
              <strong>{count}</strong>
              <small>positions</small>
            </div>
          ))}
        </div>
        <p className="mm-equation">
          Audio: ceil({flowNumber(duration, 2)} s × 75 frames/s) × {levels}{" "}
          levels = {result.audio} positions.
        </p>
      </Drawing>
      <FlowControls>
        <FlowSlider
          name="Audio duration (s)"
          min={0}
          max={10}
          step={0.1}
          value={duration}
          onChange={setDuration}
        />
        <FlowChoice
          label="RVQ levels"
          options={[
            [2, "2"],
            [4, "4"],
            [8, "8"],
            [16, "16"],
          ]}
          value={levels}
          onChange={setLevels}
        />
        <button
          type="button"
          onClick={() => {
            setDuration(2);
            setLevels(8);
          }}
        >
          Reset
        </button>
      </FlowControls>
      <FlowReadout data-model={JSON.stringify({ duration, levels, ...result })}>
        {result.total} used input positions.{" "}
        {result.overBudget
          ? `Over budget by ${
              result.total - result.budget
            }; no free input positions remain.`
          : `${result.remaining} positions remain within this input budget.`}{" "}
        At zero audio duration the fixed text, image and markers still use 40
        positions.
      </FlowReadout>
    </FlowLab>
  );
}
