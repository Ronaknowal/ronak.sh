import "./byte-tokenization-labs.css";
import { tokenIdentityStyle } from "./token-identity-colors.js";
import "./token-identity-colors.css";
export function ByteDrawing({ name, description, children }) {
  return (
    <figure
      className="byte-drawing"
      data-byte-figure={name}
      aria-label={description}
    >
      {children}
      <figcaption>{description}</figcaption>
    </figure>
  );
}
export function ByteCells({
  values,
  label,
  groups,
  tone = "input",
  identityKeys,
}) {
  return (
    <div className="byte-cell-row" aria-label={label}>
      {!values.length && <span>∅ · no bytes</span>}
      {values.map((value, index) => (
        <span
          className={`byte-cell byte-${tone}${
            groups?.includes(index) ? " byte-group-start" : ""
          }${identityKeys?.[index] != null ? " token-identity" : ""}`}
          style={
            identityKeys?.[index] != null
              ? {
                  ...tokenIdentityStyle(identityKeys[index]),
                  ...(groups?.includes(index)
                    ? { borderLeftColor: "#ddd" }
                    : {}),
                }
              : undefined
          }
          key={index}
        >
          {value}
        </span>
      ))}
    </div>
  );
}
function Arrow({ children }) {
  return (
    <div className="byte-drawn-arrow">
      <span>{children}</span>
      <i aria-hidden="true" />
    </div>
  );
}
export function FeatureMatrix({
  rows = 4,
  columns = 3,
  label,
  values,
  parameter = false,
  identityKeys,
}) {
  return (
    <div className="byte-matrix-object">
      <span>{label}</span>
      <div
        className={`byte-feature-matrix${
          parameter ? " byte-parameter-matrix" : ""
        }`}
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(1.6em, 1fr))`,
        }}
        role="img"
        aria-label={`${label}: ${rows} rows, ${columns} pictured feature entries per row`}
      >
        {Array.from(
          {
            length: rows * columns,
          },
          (_, index) => (
            <span
              key={index}
              className={identityKeys ? "token-identity" : undefined}
              style={
                identityKeys
                  ? tokenIdentityStyle(
                      identityKeys[Math.floor(index / columns)]
                    )
                  : undefined
              }
            >
              {values
                ? values[Math.floor(index / columns)][index % columns]
                : ""}
            </span>
          )
        )}
      </div>
    </div>
  );
}
export function TextStorageFigure() {
  const data = [
    ["c", "U+0063", "99", ["63"]],
    ["a", "U+0061", "97", ["61"]],
    ["f", "U+0066", "102", ["66"]],
    ["é", "U+00E9", "233", ["C3", "A9"]],
  ];
  return (
    <ByteDrawing
      name="text-storage"
      description="Matching colours connect each glyph, its Unicode number and all its UTF-8 bytes. Read each column downward: four Unicode numbers occupy five byte positions."
    >
      <div className="byte-storage-grid">
        {data.map(([text, point, number, bytes]) => (
          <div className="byte-storage-column" key={text}>
            <strong
              className="byte-glyph token-identity"
              style={tokenIdentityStyle(text)}
            >
              {text}
            </strong>
            <span className="token-identity" style={tokenIdentityStyle(text)}>
              {point}
            </span>
            <small>decimal {number}</small>
            <Arrow>UTF-8</Arrow>
            <ByteCells
              values={bytes}
              label={`${text} bytes`}
              identityKeys={bytes.map(() => text)}
            />
          </div>
        ))}
      </div>
    </ByteDrawing>
  );
}
export function Utf8PackingFigure() {
  return (
    <ByteDrawing
      name="utf8-packing"
      description="The cyan payload cells carry é's number. Neutral prefix cells identify the start and continuation bytes; each completed row has eight bits."
    >
      <p className="byte-object-label">é · U+00E9 · decimal 233</p>
      <div className="byte-bit-packing">
        {[
          ["110", "00011", "C3", 195, "start byte"],
          ["10", "101001", "A9", 169, "continuation byte"],
        ].map(([prefix, payload, hex, number, role]) => (
          <div key={hex}>
            <span>
              {role} · {prefix.length} prefix + {payload.length} payload bits
            </span>
            <div className="byte-bit-cells">
              {Array.from(prefix + payload).map((bit, index) => (
                <span
                  className={
                    index < prefix.length ? "byte-prefix" : "byte-input"
                  }
                  key={index}
                >
                  {bit}
                </span>
              ))}
            </div>
            <div className="byte-bit-brackets">
              <span
                style={{
                  flex: prefix.length,
                }}
              >
                prefix {prefix}
              </span>
              <span
                style={{
                  flex: payload.length,
                }}
              >
                payload {payload}
              </span>
            </div>
            <Arrow>whole byte</Arrow>
            <code className="byte-computed">
              {hex} = {number}
            </code>
          </div>
        ))}
      </div>
      <p>Remove the prefix cells: 00011 × 64 + 101001 = 3 × 64 + 41 = 233.</p>
    </ByteDrawing>
  );
}
export function BytePipelineFigure() {
  const cells = ["C3", "A9", "C3", "A9"];
  const identities = ["byte:195", "byte:169", "byte:195", "byte:169"];
  return (
    <ByteDrawing
      name="byte-pipeline"
      description="Colour follows each byte value through all three rows; brackets mark groups. Four byte cells keep their order: the middle token contains the tail of one scalar and the start of another."
    >
      <div className="byte-aligned-groups">
        <div
          className="byte-bracket-row"
          style={{
            gridTemplateColumns: "2fr 2fr",
          }}
        >
          <span>first é</span>
          <span>second é</span>
        </div>
        <ByteCells
          values={cells}
          label="Original éé bytes"
          identityKeys={identities}
        />
        <Arrow>regroup into tokens</Arrow>
        <div
          className="byte-bracket-row"
          style={{
            gridTemplateColumns: "1fr 2fr 1fr",
          }}
        >
          <span>token 1</span>
          <span>token 2</span>
          <span>token 3</span>
        </div>
        <ByteCells
          values={cells}
          label="Same bytes with token groups"
          groups={[1, 3]}
          identityKeys={identities}
        />
        <Arrow>concatenate, then UTF-8 decode</Arrow>
        <ByteCells
          values={cells}
          label="Concatenated unchanged bytes"
          identityKeys={identities}
        />
        <strong className="byte-decoded">éé</strong>
      </div>
    </ByteDrawing>
  );
}
export function ByteNormalizationFigure() {
  return (
    <ByteDrawing
      name="byte-normalization"
      description="Matching é hues identify both spellings and their common glyph. Two distinct scalar/byte paths converge at NFC; the common output cannot identify which spelling was supplied."
    >
      <div className="flow-columns-2">
        <div>
          <span>Composed é · U+00E9</span>
          <ByteCells
            values={["C3", "A9"]}
            label="Composed bytes"
            identityKeys={["é", "é"]}
          />
        </div>
        <div>
          <span>e + accent · U+0065 U+0301</span>
          <ByteCells
            values={["65", "CC", "81"]}
            label="Decomposed bytes"
            identityKeys={["é", "é", "é"]}
          />
        </div>
      </div>
      <div className="byte-converging-wires" aria-hidden="true">
        <i />
        <i />
      </div>
      <span className="byte-operation">NFC</span>
      <Arrow>shared normalized spelling</Arrow>
      <ByteCells
        values={["C3", "A9"]}
        label="NFC output"
        tone="computed"
        identityKeys={["é", "é"]}
      />
    </ByteDrawing>
  );
}
export function ByteMergeFigure() {
  const bytes = ["63", "61", "66", "C3", "A9"];
  const rows = [
    ["base bytes", [1, 1, 1, 1, 1], ["c", "a", "f", "byte:195", "byte:169"]],
    ["rank 1: c + a", [2, 1, 1, 1], ["ca", "f", "byte:195", "byte:169"]],
    ["rank 2: ca + f", [3, 1, 1], ["caf", "byte:195", "byte:169"]],
    ["rank 3: C3 + A9", [3, 2], ["caf", "é"]],
    ["rank 4: caf + é", [5], ["café"]],
  ];
  return (
    <ByteDrawing
      name="byte-merges"
      description="Bracket hues follow each learned piece; byte-cell hues keep their glyph correspondence. The same five byte columns remain aligned through four merge ranks; no byte is removed."
    >
      {rows.map(([label, lengths, pieces]) => (
        <div className="byte-merge-drawn" key={label}>
          <span>
            {label} · {lengths.length}{" "}
            {lengths.length === 1 ? "token" : "tokens"}
          </span>
          <div
            className="byte-bracket-row"
            style={{
              gridTemplateColumns: lengths.map((n) => `${n}fr`).join(" "),
            }}
          >
            {lengths.map((n, index) => (
              <span
                className="byte-learned token-identity"
                style={tokenIdentityStyle(pieces[index])}
                key={index}
              >
                {n === 5
                  ? "café"
                  : n === 3
                  ? "caf"
                  : n === 2 && index === 0
                  ? "ca"
                  : `${n}B`}
              </span>
            ))}
          </div>
          <ByteCells
            values={bytes}
            label={label}
            identityKeys={["c", "a", "f", "é", "é"]}
          />
        </div>
      ))}
    </ByteDrawing>
  );
}
export function ByteStateFigure() {
  return (
    <ByteDrawing
      name="byte-state-machine"
      description="A decoder starts ready, remembers a partial scalar, and emits only after its payload is complete. Invalid input or an incomplete final flush leaves this strict path with an error."
    >
      <div className="byte-state-path">
        <div className="byte-state-circle">
          <strong>ready</strong>
          <small>needed = 0</small>
        </div>
        <Arrow>C3 starts · payload 3</Arrow>
        <div className="byte-state-circle">
          <strong>pending</strong>
          <small>value = 3</small>
          <small>needed = 1</small>
        </div>
        <Arrow>A9 adds 41 · 3×64+41</Arrow>
        <div className="byte-state-circle">
          <strong>ready</strong>
          <small>value = 233</small>
          <small>emit é</small>
        </div>
      </div>
      <p>
        While pending: another valid continuation decreases needed. At zero,
        validate and emit. At EOF with needed &gt; 0: truncated input.
      </p>
    </ByteDrawing>
  );
}
export function ByteEmbeddingFigure() {
  return (
    <ByteDrawing
      name="byte-embedding"
      description="Byte C3 selects ID 198, an address into the amber learned table. The white outlined row becomes a computed vector; contextual processing produces one score per next-ID choice."
    >
      <ByteCells values={["C3 = 195"]} label="Supplied byte" />
      <Arrow>byte value + 3</Arrow>
      <code className="byte-computed">ID 198</code>
      <div className="byte-embedding-table">
        <span>259 learned rows × d entries</span>
        {[
          ["0", "PAD"],
          ["1", "EOS"],
          ["2", "BOS"],
          ["⋮", ""],
          ["198", "C3"],
          ["⋮", ""],
          ["258", "FF"],
        ].map(([id, name]) => (
          <div
            key={`${id}-${name}`}
            className={id === "198" ? "byte-traced-row" : ""}
          >
            <span>
              {id}
              {name ? ` ${name}` : ""}
            </span>
            <div className="byte-table-vector">
              {[0, 1, 2, 3].map((i) => (
                <i key={i} />
              ))}
            </div>
          </div>
        ))}
        <small>Four entries drawn; actual width is d.</small>
      </div>
      <Arrow>select row 198</Arrow>
      <FeatureMatrix
        rows={1}
        columns={4}
        label="computed input vector · width d"
      />
      <Arrow>contextual layers → output head</Arrow>
      <FeatureMatrix
        rows={1}
        columns={4}
        label="259 output scores · four pictured"
      />
    </ByteDrawing>
  );
}
export function ByteTargetsFigure() {
  return (
    <ByteDrawing
      name="byte-targets"
      description="Matching hues follow a byte value or control symbol across the shifted rows. Read each column as one next-step decision: the target is one place ahead; EOS follows the complete byte spelling."
    >
      <span>Input IDs · available prefix ends here</span>
      <ByteCells
        values={["2 BOS", "198 C3", "172 A9"]}
        label="Input IDs"
        identityKeys={["BOS", "byte:195", "byte:169"]}
      />
      <div className="byte-prediction-arrows" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <span>Next target IDs · what the loss scores</span>
      <ByteCells
        values={["198 C3", "172 A9", "1 EOS"]}
        label="Target IDs"
        tone="computed"
        identityKeys={["byte:195", "byte:169", "EOS"]}
      />
      <div className="byte-prefix-ladder">
        <span>Decision 1 reads: BOS</span>
        <span>Decision 2 reads: BOS · C3</span>
        <span>Decision 3 reads: BOS · C3 · A9</span>
      </div>
    </ByteDrawing>
  );
}
export function ByteCausalGrid({ count, label, padding = false }) {
  return (
    <div className="byte-causal-object">
      <span>
        {label} · {(count * (count + 1)) / 2 - (padding ? 1 : 0)} allowed{" "}
        {padding ? "non-PAD " : ""}pairs
      </span>
      <small>columns: input keys →</small>
      <div className="byte-grid-with-axis">
        <span>query rows ↓</span>
        <div
          className="byte-causal-grid"
          style={{
            gridTemplateColumns: `repeat(${count}, 1em)`,
          }}
          role="img"
          aria-label={`${count} by ${count} grid: query can read its own and earlier non-PAD positions. ${
            padding
              ? "Last key is padding in the shorter A row; all its connections are excluded."
              : ""
          }`}
        >
          {Array.from(
            {
              length: count * count,
            },
            (_, i) => (
              <span
                className={`${
                  i % count <= Math.floor(i / count)
                    ? "byte-allowed"
                    : "byte-blocked"
                }${
                  padding && i % count === count - 1 ? " byte-padded-key" : ""
                }`}
                key={i}
              />
            )
          )}
        </div>
      </div>
      <small>
        Violet: allowed · dashed: future
        {padding ? " · crossed last key: PAD" : ""}
      </small>
    </div>
  );
}
export function ByteMasksFigure() {
  return (
    <ByteDrawing
      name="byte-masks"
      description="The A and é rows share width three. Causal connections exclude the future; the shorter row also has a PAD key and a separate ignored PAD target."
    >
      <div className="flow-columns-2">
        {[
          ["A", ["2 BOS", "68 A", "0 PAD"], ["68 A", "1 EOS", "0 PAD"]],
          ["é", ["2 BOS", "198 C3", "172 A9"], ["198 C3", "172 A9", "1 EOS"]],
        ].map(([name, input, target]) => (
          <div key={name}>
            <span>text {name} · inputs</span>
            <ByteCells values={input} label={`${name} inputs`} />
            <span>targets</span>
            <div className="byte-loss-row">
              {target.map((value, i) => (
                <span
                  className={
                    value === "0 PAD" ? "byte-excluded" : "byte-computed"
                  }
                  key={i}
                >
                  {value}
                  {value === "0 PAD" ? (
                    <small>excluded</small>
                  ) : (
                    <small>counts</small>
                  )}
                </span>
              ))}
            </div>
            <ByteCausalGrid
              count={3}
              label={`${name} attention`}
              padding={name === "A"}
            />
          </div>
        ))}
      </div>
      <p>
        Loss denominator: 2 + 3 = 5 real targets. The padded input row still has
        width three.
      </p>
    </ByteDrawing>
  );
}
export function ByteLossFigure() {
  return (
    <ByteDrawing
      name="byte-loss"
      description="Both bars use probability 0–1. Violet is the same correct A9 target in each; the rest is probability on other IDs."
    >
      {[0.9, 0.1].map((p) => (
        <div className="byte-probability-example" key={p}>
          <span>p(A9) = {p}</span>
          <div className="byte-probability-bar">
            <span
              style={{
                width: `${p * 100}%`,
              }}
            />
            <i
              style={{
                width: `${(1 - p) * 100}%`,
              }}
            />
          </div>
          <span>
            −ln({p}) ≈ {(-Math.log(p)).toFixed(3)} nats
          </span>
        </div>
      ))}
    </ByteDrawing>
  );
}
function Module({ name, children }) {
  return (
    <div className="byte-neural-module">
      <strong>{name}</strong>
      {children}
    </div>
  );
}
export function ByteByT5Figure() {
  return (
    <ByteDrawing
      name="architecture-byt5"
      description="Matching glyph colours recur in the input and output byte prefixes. Computed feature grids stay violet: the decoder consults encoder features while generating output bytes, with causal connections between output decisions."
    >
      <div className="byte-two-network-lanes">
        <div>
          <ByteCells
            values={["63", "61", "66", "C3", "A9"]}
            label="Input café bytes"
            identityKeys={["c", "a", "f", "é", "é"]}
          />
          <Arrow>input vectors</Arrow>
          <Module name="encoder">
            <FeatureMatrix rows={5} label="five input-byte positions" />
          </Module>
        </div>
        <div>
          <ByteCells
            values={["start", "63", "61", "…"]}
            label="Output prefix"
            identityKeys={["BOS", "c", "a", null]}
          />
          <Arrow>causal output prefix</Arrow>
          <Module name="decoder">
            <FeatureMatrix rows={4} label="output-byte positions" />
          </Module>
        </div>
      </div>
      <div className="byte-cross-wire">
        <span>encoder features → decoder cross-attention</span>
        <i aria-hidden="true" />
      </div>
      <Arrow>output head</Arrow>
      <FeatureMatrix rows={4} label="next-byte scores" />
    </ByteDrawing>
  );
}
export function ByteCanineFigure() {
  return (
    <ByteDrawing
      name="architecture-canine"
      description="CANINE hashes Unicode code points into learned bucket embeddings, combines them, shortens local feature positions for the deep encoder, then restores character resolution with fine-feature information."
    >
      <ByteCells
        values={["U+0063", "U+0061", "U+0066", "U+00E9"]}
        label="Four café code points"
        identityKeys={["c", "a", "f", "é"]}
      />
      <Arrow>several hash lookups</Arrow>
      <div className="flow-columns-2">
        <FeatureMatrix
          rows={3}
          columns={2}
          parameter
          label="hash table 1 · learned buckets"
        />
        <FeatureMatrix
          rows={3}
          columns={2}
          parameter
          label="hash table 2 · learned buckets"
        />
      </div>
      <Arrow>concatenate looked-up vectors</Arrow>
      <div className="byte-skip-network">
        <div>
          <Module name="local character encoder">
            <FeatureMatrix rows={4} label="four fine positions" />
          </Module>
          <Arrow>downsample</Arrow>
          <Module name="deep encoder">
            <FeatureMatrix rows={2} label="two coarse positions · schematic" />
          </Module>
          <Arrow>upsample</Arrow>
          <span className="byte-operation">combine broad + fine features</span>
          <FeatureMatrix rows={4} label="four output positions" />
        </div>
        <div className="byte-fine-skip">
          <span>fine-feature skip</span>
          <i aria-hidden="true" />
        </div>
      </div>
    </ByteDrawing>
  );
}
export function ByteCharformerFigure() {
  return (
    <ByteDrawing
      name="architecture-charformer"
      description="Two candidate block spans over the same byte sequence contribute weighted vectors. Candidate features and weights are constructed for this exact mixing example; GBST learns block scores before downsampling."
    >
      <div className="byte-candidate-input">
        <ByteCells
          values={["63", "61", "66", "C3", "A9"]}
          label="café bytes"
          identityKeys={["c", "a", "f", "é", "é"]}
        />
        <div className="byte-candidate-spans">
          <span>2 bytes</span>
          <span>3 bytes</span>
        </div>
      </div>
      <div className="flow-columns-2">
        <FeatureMatrix
          rows={1}
          columns={2}
          values={[[2, 0]]}
          label="candidate A · weight .75"
        />
        <FeatureMatrix
          rows={1}
          columns={2}
          values={[[0, 4]]}
          label="candidate B · weight .25"
        />
      </div>
      <div className="byte-converging-wires" aria-hidden="true">
        <i />
        <i />
      </div>
      <span className="byte-operation">weighted sum</span>
      <FeatureMatrix
        rows={1}
        columns={2}
        values={[[1.5, 1]]}
        label=".75[2,0] + .25[0,4]"
      />
      <Arrow>downsample mixed features</Arrow>
      <Module name="deep network">
        <FeatureMatrix rows={2} label="shorter sequence · schematic" />
      </Module>
    </ByteDrawing>
  );
}
export function ByteMambaFigure() {
  return (
    <ByteDrawing
      name="architecture-mambabyte"
      description="The recurrent-state path carries learned context between bytes. A new byte enters each state update; its contextual output produces the next-byte scores. Circles depict states, not attention to every earlier byte."
    >
      <div className="byte-recurrent-trace">
        {[
          ["h₀", "start"],
          ["h₁", "63"],
          ["h₂", "61"],
          ["h₃", "66"],
        ].map(([state, byte], i) => (
          <div className="byte-recurrent-step" key={state}>
            <div className="byte-recurrent-input">
              <span
                className="byte-input token-identity"
                style={tokenIdentityStyle(["BOS", "c", "a", "f"][i])}
              >
                {byte}
              </span>
              <span>→ {i ? "update" : "initialize"}</span>
            </div>
            <div>
              <div className="byte-state-circle">
                <strong>{state}</strong>
                <small>state vector</small>
              </div>
              {i < 3 && <Arrow>state passed to next update</Arrow>}
            </div>
            <div className="byte-recurrent-output">
              <span>output →</span>
              <span className="byte-computed">next-byte scores</span>
            </div>
          </div>
        ))}
      </div>
    </ByteDrawing>
  );
}
export function ByteBltFigure() {
  return (
    <ByteDrawing
      name="architecture-blt"
      description="Matching hues follow patch identity from bytes to feature rows, global vectors and decoder context; scores remain violet. The decoder receives completed earlier-patch context plus causal current-prefix features. This draws availability, not the full BLT mask configuration."
    >
      <ByteCells
        values={["c", "a", "f", "e", "␠", "a", "b", "c"]}
        groups={[3, 6]}
        label="Eight bytes · three illustrative patches"
        identityKeys={[
          "patch:0",
          "patch:0",
          "patch:0",
          "patch:1",
          "patch:1",
          "patch:1",
          "patch:2",
          "patch:2",
        ]}
      />
      <Arrow>local causal encoder</Arrow>
      <FeatureMatrix
        rows={8}
        columns={2}
        label="eight local feature positions"
        identityKeys={[
          "patch:0",
          "patch:0",
          "patch:0",
          "patch:1",
          "patch:1",
          "patch:1",
          "patch:2",
          "patch:2",
        ]}
      />
      <div
        className="byte-bracket-row"
        style={{
          gridTemplateColumns: "3fr 3fr 2fr",
        }}
      >
        <span className="token-identity" style={tokenIdentityStyle("patch:0")}>
          patch 0 · 3 bytes
        </span>
        <span className="token-identity" style={tokenIdentityStyle("patch:1")}>
          patch 1 · 3 bytes
        </span>
        <span className="token-identity" style={tokenIdentityStyle("patch:2")}>
          patch 2 · 2 bytes
        </span>
      </div>
      <Arrow>learned patch aggregation</Arrow>
      <Module name="global patch model">
        <FeatureMatrix
          rows={3}
          columns={4}
          label="three patch vectors · wider features"
          identityKeys={["patch:0", "patch:1", "patch:2"]}
        />
      </Module>
      <div className="flow-columns-2">
        <div>
          <Arrow>completed earlier patches</Arrow>
          <FeatureMatrix
            rows={1}
            label="context from patch 0"
            identityKeys={["patch:0"]}
          />
        </div>
        <div>
          <Arrow>local causal prefix</Arrow>
          <ByteCells
            values={["e", "␠"]}
            label="Current patch prefix before target a"
            identityKeys={["patch:1", "patch:1"]}
          />
        </div>
      </div>
      <div className="byte-converging-wires" aria-hidden="true">
        <i />
        <i />
      </div>
      <Module name="local byte decoder">
        <span>predict next a in patch 1</span>
        <FeatureMatrix rows={1} label="next-byte scores" />
      </Module>
      <p>
        Patch 1's completed summary contains target a, so it cannot supply this
        decision. Its available prefix e␠ still contributes locally.
      </p>
    </ByteDrawing>
  );
}
export function ByteUncertaintyFigure() {
  return (
    <ByteDrawing
      name="byte-uncertainty"
      description="Constructed probabilities before the next byte. Each full bar is 100%; the violet and neutral portions are the two labelled candidates. No observed outcome enters this entropy calculation."
    >
      {[0.5, 0.99].map((p) => (
        <div className="byte-probability-example" key={p}>
          <span>
            candidate A {p * 100}% · B {Math.round((1 - p) * 100)}%
          </span>
          <div className="byte-probability-bar">
            <span
              style={{
                width: `${p * 100}%`,
              }}
            />
            <i
              style={{
                width: `${(1 - p) * 100}%`,
              }}
            />
          </div>
          <span>H = {p === 0.5 ? "1" : "0.0808"} bits</span>
        </div>
      ))}
    </ByteDrawing>
  );
}
export function BytePoolingFigure() {
  return (
    <ByteDrawing
      name="byte-pooling"
      description="Three constructed two-entry vectors become one two-entry mean. Wires combine corresponding entries; grouping reduces the number of positions while feature width stays two."
    >
      <FeatureMatrix
        rows={3}
        columns={2}
        values={[
          [0, 1],
          [1, 4],
          [2, 9],
        ]}
        label="c, a, f feature rows · 3 × 2"
      />
      <div className="byte-converging-wires" aria-hidden="true">
        <i />
        <i />
      </div>
      <FeatureMatrix
        rows={1}
        columns={2}
        values={[[3, 14]]}
        label="entrywise sum · 1 × 2"
      />
      <Arrow>divide both entries by 3 positions</Arrow>
      <FeatureMatrix
        rows={1}
        columns={2}
        values={[[1, "14/3"]]}
        label="mean · [1, 4.667…]"
      />
    </ByteDrawing>
  );
}
export function ByteCostFigure() {
  return (
    <ByteDrawing
      name="byte-cost"
      description="Every allowed relationship occupies the same-sized violet cell. The smaller global grid has six rather than 36 pairs; local byte work is outside these grids."
    >
      <div className="flow-columns-2">
        <ByteCausalGrid count={8} label="eight byte positions" />
        <ByteCausalGrid count={3} label="three global patch positions" />
      </div>
    </ByteDrawing>
  );
}
export function ByteMetricFigure() {
  return (
    <ByteDrawing
      name="byte-metric"
      description="The same ten original UTF-8 bytes supply both likelihood denominators. Model positions may differ; their total negative log likelihood is compared per shared byte unit."
    >
      <ByteCells
        values={["63", "61", "66", "C3", "A9", "20", "F0", "9F", "8C", "8D"]}
        label="Ten café globe bytes"
        identityKeys={["c", "a", "f", "é", "é", " ", "🌍", "🌍", "🌍", "🌍"]}
      />
      <div className="flow-columns-2">
        <div>
          <div>representation A · fewer model positions</div>
          <code className="byte-computed">total NLL = 10 nats</code>
        </div>
        <div>
          <div>representation B · ten byte positions</div>
          <code className="byte-computed">total NLL = 10 nats</code>
        </div>
      </div>
      <div className="byte-converging-wires" aria-hidden="true">
        <i />
        <i />
      </div>
      <span className="byte-operation">divide by 10 bytes × ln(2)</span>
      <strong className="byte-computed">both: 1.443 bits per byte</strong>
    </ByteDrawing>
  );
}
export function ByteGenerationFigure() {
  return (
    <ByteDrawing
      name="byte-generation"
      description="All four blue byte decisions belong to the same globe glyph; they still form a serial chain. A block decoder scores several unknown positions in one call, possibly over repeated refinements. This is a qualitative dependency picture, not timing or a trained output."
    >
      <span>serial next-byte decisions · globe's four bytes</span>
      <div className="byte-serial-decisions">
        {["F0", "9F", "8C", "8D"].map((b, i) => (
          <span
            className="byte-computed token-identity"
            style={tokenIdentityStyle("🌍")}
            key={b}
          >
            {b}
            {i < 3 && <i aria-hidden="true">→</i>}
          </span>
        ))}
      </div>
      <span>block call · several unknown positions together</span>
      <ByteCells
        values={["?", "?", "?", "?"]}
        label="Unknown output block"
        tone="unknown"
      />
      <Arrow>one decoder call · scores for several positions</Arrow>
      <FeatureMatrix
        rows={4}
        columns={2}
        label="candidate-byte scores · four positions"
      />
    </ByteDrawing>
  );
}
