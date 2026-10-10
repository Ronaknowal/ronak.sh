import { useId, useState } from "react";
import { contactMailto } from "./contactMessage.js";

// Where "Run inference" sends messages. Stored in parts and assembled only when
// used, so simple scrapers that read the page source don't pick up the address.
// To switch the email form on, fill in both parts, e.g. { user: "hello", domain: "ronak.sh" }.
// While either is null, the block shows the LinkedIn route instead of the form.
const CONTACT_EMAIL = { user: null, domain: null };
const LINKEDIN = "https://www.linkedin.com/in/ronak-sharma-a6455a1b5/";

const mono = "'JetBrains Mono', monospace";
const field = {
  width: "100%",
  background: "rgba(0,0,0,0.35)",
  border: "1px solid #2a2a2a",
  borderRadius: 4,
  color: "#e8e8e8",
  font: `12px/1.7 ${mono}`,
  padding: "8px 10px",
  marginTop: 4,
  resize: "vertical",
};

// The contact block keeps its API-request look, but it actually sends: it opens
// the visitor's email app with the message filled in.
export default function InferencePrompt() {
  const [from, setFrom] = useState("");
  const [prompt, setPrompt] = useState("");
  const [sent, setSent] = useState(false);
  const fromId = useId(), promptId = useId();
  const address = CONTACT_EMAIL.user && CONTACT_EMAIL.domain ? `${CONTACT_EMAIL.user}@${CONTACT_EMAIL.domain}` : null;

  const box = {
    textAlign: "left",
    padding: "24px 28px",
    border: "1px solid #1a1a1a",
    borderRadius: 8,
    background: "rgba(255,255,255,0.02)",
    fontFamily: mono,
    fontSize: 12,
    lineHeight: 2.2,
    color: "#555",
    maxWidth: 480,
    margin: "0 auto",
  };

  if (!address) {
    return (
      <div style={box}>
        <span style={{ color: "#c9aa70" }}>GET</span> <span style={{ color: "#888" }}>/contact</span>
        <br />
        <span style={{ color: "#888" }}>→ </span>
        <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" style={{ color: "#e2b55a" }}>
          Message me on LinkedIn ↗<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    );
  }

  const submit = event => {
    event.preventDefault();
    if (!prompt.trim()) return;
    window.location.href = contactMailto(address, from, prompt);
    setSent(true);
  };

  return (
    <form onSubmit={submit} style={box} aria-label="Send Ronak a message">
      <span style={{ color: "#c9aa70" }}>POST</span> <span style={{ color: "#888" }}>/inference</span>
      <br />
      <span style={{ color: "#888" }}>{"{"}</span>
      <div style={{ paddingLeft: 16 }}>
        <label htmlFor={fromId} style={{ display: "block" }}>
          <span style={{ color: "#e2b55a" }}>"from"</span><span style={{ color: "#888" }}>:</span>
          <input id={fromId} value={from} onChange={event => setFrom(event.target.value)} placeholder="your name or email" autoComplete="name" style={field} />
        </label>
        <label htmlFor={promptId} style={{ display: "block", marginTop: 6 }}>
          <span style={{ color: "#e2b55a" }}>"prompt"</span><span style={{ color: "#888" }}>:</span>
          <textarea id={promptId} value={prompt} onChange={event => setPrompt(event.target.value)} required rows={4}
            placeholder="a role, a collaboration, an idea…" style={field} />
        </label>
      </div>
      <span style={{ color: "#888" }}>{"}"}</span>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <button type="submit" disabled={!prompt.trim()} style={{
          font: `600 12px ${mono}`, color: "#111", background: prompt.trim() ? "#e2b55a" : "#3a3426",
          border: 0, borderRadius: 4, padding: "8px 14px", cursor: prompt.trim() ? "pointer" : "not-allowed",
        }}>
          Run inference →
        </button>
      </div>
      {sent && (
        <p role="status" style={{ marginTop: 12, color: "#888", lineHeight: 1.7 }}>
          <span style={{ color: "#c9aa70" }}>200 OK</span> · your email app should open with the message filled in.
          Nothing opened? Write to <a href={`mailto:${address}`} style={{ color: "#e2b55a" }}>{address}</a>.
        </p>
      )}
    </form>
  );
}
