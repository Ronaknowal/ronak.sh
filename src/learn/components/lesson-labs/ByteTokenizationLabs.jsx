import { useId, useState } from "react";
import {
  FlowLab,
  FlowControls,
  FlowSlider,
  FlowReadout,
} from "./LessonFlow.jsx";
import {
  ByteCells,
  ByteDrawing,
  ByteCausalGrid,
} from "./ByteTokenizationDrawings.jsx";
import {
  inspectByteText,
  streamingByteTrace,
  bytePatchTrace,
  initialByteProbabilities,
  patchText,
  hexByte,
} from "../../data/byte-tokenization-model.js";
import "./neural-lesson-neutral.css";
import "./byte-tokenization-labs.css";
import { tokenIdentityStyle } from "./token-identity-colors.js";
export {
  TextStorageFigure,
  Utf8PackingFigure,
  BytePipelineFigure,
  ByteMergeFigure,
  ByteTargetsFigure,
  ByteUncertaintyFigure,
  BytePoolingFigure,
} from "./ByteTokenizationDrawings.jsx";
const visibleText = (text) =>
  text === ""
    ? "∅ (empty)"
    : text.replaceAll(" ", "␠").replaceAll("\n", "↵").replaceAll("\t", "⇥");
const identityByteEncoder = new TextEncoder();
function glyphByteIdentityKeys(data) {
  return (data.graphemes ?? Array.from(data.text)).flatMap((grapheme) =>
    Array.from(identityByteEncoder.encode(grapheme), () =>
      grapheme.normalize("NFC")
    )
  );
}
function GlyphIdentityText({ text }) {
  if (!text) return visibleText(text);
  const data = inspectByteText(text);
  return (data.graphemes ?? Array.from(text)).map((grapheme, index) => (
    <span
      className="token-identity"
      style={tokenIdentityStyle(grapheme.normalize("NFC"))}
      key={index}
    >
      {visibleText(grapheme)}
    </span>
  ));
}
function TextEditor({ label, value, onChange }) {
  const id = useId();
  return (
    <label className="byte-text-editor" htmlFor={id}>
      <span>{label}</span>
      <textarea
        id={id}
        value={value}
        maxLength={96}
        rows={2}
        onChange={(event) => onChange(event.target.value)}
      />
      <small>
        Up to 48 scalars. ␠ is a space; ↵ is a newline; ⇥ is a tab in drawings.
      </small>
    </label>
  );
}
export function UnicodeByteLab() {
  const [text, setText] = useState("café 🌍");
  const [normalization, setNormalization] = useState("none");
  let data, error;
  try {
    data = inspectByteText(text, normalization);
  } catch (reason) {
    error = reason.message;
  }
  const selectId = useId();
  return (
    <div data-lab="unicode-byte-units">
      <FlowLab id="unicode-byte-units" label="Inspect text scalars and bytes">
        {error ? (
          <p role="alert">{error}</p>
        ) : (
          <>
            <ByteDrawing
              name="unicode-live"
              description="Matching hues connect a displayed group with its scalars and bytes. Repeated groups keep their hue across byte rows; normalization can change the groups themselves. Outer outlines mark grapheme clusters; U+ and hex labels distinguish scalar and byte units. The counts describe the normalized text."
            >
              <div className="byte-graphemes">
                {(data.graphemes ?? Array.from(data.text)).map(
                  (grapheme, index) => (
                    <div className="byte-grapheme" key={index}>
                      <strong
                        className="token-identity"
                        style={tokenIdentityStyle(grapheme.normalize("NFC"))}
                      >
                        {visibleText(grapheme)}
                      </strong>
                      <div className="byte-scalars">
                        {Array.from(grapheme).map((character, i) => {
                          const scalar = inspectByteText(character).scalars[0];
                          return (
                            <div className="byte-scalar" key={i}>
                              <span
                                className="token-identity"
                                style={tokenIdentityStyle(
                                  grapheme.normalize("NFC")
                                )}
                              >
                                {scalar.codePoint}
                              </span>
                              <ByteCells
                                values={scalar.bytes.map(hexByte)}
                                label={`${scalar.codePoint} bytes`}
                                identityKeys={scalar.bytes.map(() =>
                                  grapheme.normalize("NFC")
                                )}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
              {!data.bytes.length && (
                <span>∅ · no scalar or byte positions</span>
              )}
              <div className="flow-columns-2">
                <div>
                  <span>Original bytes</span>
                  <ByteCells
                    values={data.originalBytes.map(hexByte)}
                    label="Original bytes"
                    identityKeys={glyphByteIdentityKeys(inspectByteText(text))}
                  />
                </div>
                <div>
                  <span>After normalization</span>
                  <ByteCells
                    values={data.bytes.map(hexByte)}
                    label="Normalized bytes"
                    tone="computed"
                    identityKeys={glyphByteIdentityKeys(data)}
                  />
                </div>
              </div>
            </ByteDrawing>
            <FlowReadout data-byte-summary="">
              {data.graphemes
                ? `${data.graphemes.length} grapheme clusters`
                : "Grapheme segmentation unavailable"}{" "}
              · {data.scalars.length} scalars · {data.bytes.length} bytes ·{" "}
              {data.utf16Units} UTF-16 code units.{" "}
              {data.changed
                ? "Normalization changed the stored spelling."
                : "The spelling is unchanged."}
            </FlowReadout>
          </>
        )}
        <FlowControls>
          <TextEditor label="Text to inspect" value={text} onChange={setText} />
          <label htmlFor={selectId}>
            Normalization before encoding
            <select
              id={selectId}
              value={normalization}
              onChange={(event) => setNormalization(event.target.value)}
            >
              {[
                ["none", "None · original"],
                ["NFC", "NFC · composed"],
                ["NFD", "NFD · decomposed"],
                ["NFKC", "NFKC · compatibility"],
              ].map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              setText("café 🌍");
              setNormalization("none");
            }}
          >
            Reset
          </button>
        </FlowControls>
      </FlowLab>
    </div>
  );
}
export function StreamingByteLab() {
  const [text, setText] = useState("café 🌍");
  const [split, setSplit] = useState(8);
  const [truncate, setTruncate] = useState(false);
  let result, error;
  try {
    result = streamingByteTrace(text, split, truncate);
  } catch (reason) {
    error = reason.message;
  }
  const maximum = result?.bytes.length ?? 0;
  const boundary = Math.min(split, maximum);
  const byteIdentities = result
    ? glyphByteIdentityKeys(inspectByteText(text))
    : [];
  return (
    <div data-lab="streaming-byte-decoder">
      <FlowLab
        id="streaming-byte-decoder"
        label="Move a chunk boundary through UTF-8"
      >
        {error ? (
          <p role="alert">{error}</p>
        ) : (
          <ByteDrawing
            name="streaming-live"
            description="Matching glyph hues follow bytes from each delivery into the pending buffer and emitted text. Two deliveries share one decoder state: an unfinished scalar waits for later bytes to complete it."
          >
            <div className="byte-stream-stages">
              {result.trace.map((stage, index) => {
                const consumed = result.bytes.slice(
                  0,
                  index ? result.bytes.length : boundary
                );
                let pending = [];
                let pendingIdentities = [];
                if (stage.needed) {
                  let start = consumed.length - 1;
                  while (start >= 0 && (consumed[start] & 0xc0) === 0x80)
                    start -= 1;
                  pending = consumed.slice(start);
                  pendingIdentities = byteIdentities.slice(
                    start,
                    consumed.length
                  );
                }
                return (
                  <div className="byte-stream-step" key={index}>
                    <span>Delivery {index + 1}</span>
                    <ByteCells
                      values={stage.chunk.map(hexByte)}
                      label={`Chunk ${index + 1}`}
                      identityKeys={byteIdentities.slice(
                        index ? boundary : 0,
                        index ? result.bytes.length : boundary
                      )}
                    />
                    <div className="byte-stream-wire" aria-hidden="true" />
                    <div className="byte-stream-buffer">
                      <span>pending scalar bytes</span>
                      <ByteCells
                        values={pending.length ? pending.map(hexByte) : ["∅"]}
                        label="Pending byte buffer"
                        identityKeys={pendingIdentities}
                      />
                      <small>{stage.needed} continuations needed</small>
                    </div>
                    <div className="byte-stream-output">
                      <span>emitted now</span>
                      <code>
                        <GlyphIdentityText text={stage.emitted} />
                      </code>
                    </div>
                    {index === 0 && (
                      <span className="byte-state-link">
                        state retained for delivery 2 ↓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flow-columns-2">
              <div>
                <span>One persistent strict decoder</span>
                <p data-stream-result="">
                  <code>
                    <GlyphIdentityText text={result.output} />
                  </code>
                </p>
                <small>{result.error ?? "Final flush succeeds."}</small>
              </div>
              <div>
                <span>Independent replacement decoding</span>
                <p>
                  <code>{visibleText(result.separately)}</code>
                </p>
                <small>
                  {result.agrees
                    ? "Same result at this scalar boundary."
                    : "Partial scalar state is lost."}
                </small>
              </div>
            </div>
          </ByteDrawing>
        )}
        <FlowControls>
          <TextEditor label="Streamed text" value={text} onChange={setText} />
          {!error && (
            <>
              <FlowSlider
                name="Split after this many bytes"
                value={boundary}
                onChange={setSplit}
                min={0}
                max={maximum}
                step={1}
                format={(value) => String(value)}
              />
              <label className="byte-checkbox">
                <input
                  type="checkbox"
                  checked={truncate}
                  onChange={(event) => setTruncate(event.target.checked)}
                />
                Remove final byte
              </label>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setText("café 🌍");
              setSplit(8);
              setTruncate(false);
            }}
          >
            Reset
          </button>
        </FlowControls>
        {result && (
          <FlowReadout>
            {result.error
              ? "EOF makes the incomplete scalar a truncation error."
              : result.agrees
              ? "Both routes agree at this scalar boundary. Move the split inside a multi-byte scalar."
              : "The same correct bytes cross a chunk boundary; one persistent decoder reconstructs their scalar."}
          </FlowReadout>
        )}
      </FlowLab>
    </div>
  );
}
export function BytePatchLab() {
  const [probabilities, setProbabilities] = useState([
    ...initialByteProbabilities,
  ]);
  const [selected, setSelected] = useState(4);
  const [threshold, setThreshold] = useState(0.5);
  const result = bytePatchTrace(probabilities, threshold);
  const selectId = useId();
  return (
    <div data-lab="byte-entropy-patches">
      <FlowLab
        id="byte-entropy-patches"
        label="Change predictive entropy and patch boundaries"
      >
        <ByteDrawing
          name="entropy-live"
          description="Byte-label and group hues track the current patch; violet bars measure entropy on a fixed 0–1 bit scale. A white tick marks the threshold; byte zero always starts. A white outline identifies the selected byte."
        >
          <div className="byte-entropy-rows">
            {result.entropies.map((entropy, index) => (
              <div
                className={`byte-entropy-row${
                  index === selected ? " byte-selected-row" : ""
                }`}
                key={index}
              >
                <span>
                  {index}
                  <code
                    className="token-identity"
                    style={tokenIdentityStyle(`patch:${result.ids[index]}`)}
                  >
                    {visibleText(patchText[index])}
                  </code>
                </span>
                <div className="byte-entropy-track">
                  <span
                    style={{
                      width: `${entropy * 100}%`,
                    }}
                  />
                  <i
                    style={{
                      left: `${threshold * 100}%`,
                    }}
                  />
                </div>
                <span>
                  {entropy.toFixed(4)} bits
                  <br />
                  <small>
                    {index === 0 || entropy > threshold ? "start" : "continue"}
                  </small>
                </span>
              </div>
            ))}
          </div>
          <div className="byte-patch-groups">
            {result.patches.map((patch, index) => (
              <div key={index} style={tokenIdentityStyle(`patch:${index}`)}>
                <span
                  className="token-identity"
                  style={tokenIdentityStyle(`patch:${index}`)}
                >
                  patch {index} · {patch.length} bytes
                </span>
                <ByteCells
                  values={patch.map((position) =>
                    visibleText(patchText[position])
                  )}
                  label={`Patch ${index}`}
                  identityKeys={patch.map(() => `patch:${index}`)}
                />
              </div>
            ))}
          </div>
          <p data-patch-lengths="">
            Patch lengths: [
            {result.patches.map((patch) => patch.length).join(", ")}]
          </p>
        </ByteDrawing>
        <FlowControls>
          <label htmlFor={selectId}>
            Byte position to edit
            <select
              id={selectId}
              value={selected}
              onChange={(event) => setSelected(Number(event.target.value))}
            >
              {Array.from(patchText, (character, index) => (
                <option value={index} key={index}>
                  {index}: {visibleText(character)}
                </option>
              ))}
            </select>
          </label>
          <FlowSlider
            name="First possible byte probability"
            value={probabilities[selected]}
            onChange={(value) =>
              setProbabilities((current) =>
                current.map((p, index) => (index === selected ? value : p))
              )
            }
            min={0.5}
            max={1}
            step={0.001}
          />
          <FlowSlider
            name="Start-patch entropy threshold (bits)"
            value={threshold}
            onChange={setThreshold}
            min={0}
            max={1}
            step={0.01}
          />
          <button
            type="button"
            onClick={() => {
              setProbabilities([...initialByteProbabilities]);
              setSelected(4);
              setThreshold(0.5);
            }}
          >
            Reset
          </button>
        </FlowControls>
        <div className="flow-columns-2">
          <ByteCausalGrid count={8} label="all byte positions" />
          <ByteCausalGrid
            count={result.patches.length}
            label="global patch positions"
          />
        </div>
        <FlowReadout>
          {result.patches.length} global{" "}
          {result.patches.length === 1 ? "position" : "positions"} ·{" "}
          {result.patchPairs} allowed global pairs. Local processing still
          handles all eight bytes.
        </FlowReadout>
      </FlowLab>
    </div>
  );
}
