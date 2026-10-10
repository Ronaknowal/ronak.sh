// Builds the mailto: URL for the "Run inference" contact form.
export function contactMailto(address, from, prompt) {
  const sender = from.trim();
  const subject = `Hello from ronak.sh${sender ? ` — ${sender}` : ""}`;
  const body = `${prompt.trim()}\n\n— ${sender || "sent from ronak.sh"}`;
  return `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
