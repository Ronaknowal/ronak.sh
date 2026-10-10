// One source for page titles and descriptions. The browser sets them as you
// navigate; the build writes the same values into each page's HTML file, which
// is what search engines and link previews read.
export const homeTitle = "Ronak Sharma · Data Science Engineer & AI Builder";

// Every other page: "<most specific> · <section> · ronak.sh".
export const pageTitle = (...parts) => [...parts.filter(Boolean), "ronak.sh"].join(" · ");

export const learnViewNames = { paths: "Paths", modules: "Modules", catalogue: "Catalogue", projects: "Projects" };

export const descriptions = {
  home: "Data science engineer and AI builder. Projects I’ve shipped, and an interactive machine learning curriculum you can run, break and rebuild.",
  portfolio: "Projects, experience and experiments by Ronak Sharma: applied AI products, reinforcement learning, computer vision and real-time generative tools.",
  learn: "An interactive machine learning curriculum, from first principles to modern systems: guided paths, hands-on lessons and end-to-end projects.",
  paths: "Guided learning paths through the machine learning curriculum, each a sequence you can follow from the foundations up.",
  modules: "Browse the machine learning curriculum module by module, from mathematics and classical ML to LLMs, systems and research.",
  catalogue: "Search every lesson in the machine learning curriculum and go straight to the concept you need.",
  projects: "End-to-end guided builds that connect each stage to the exact lessons it needs, with experiments and evaluation.",
  articles: "Ideas, observations and longer reads by Ronak Sharma on machine learning and building AI systems.",
};

// Keep descriptions within what search results show: whole sentences, cut at a word boundary if needed.
export function clampDescription(text, limit = 160) {
  const clean = text.replace(/\s+/g, " ").trim();
  const text_ = /[.!?…]$/.test(clean) ? clean : `${clean}.`;
  if (text_.length <= limit) return text_;
  // Prefer the longest run of whole sentences that fits.
  const sentences = text_.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [];
  let kept = "";
  for (const sentence of sentences) {
    if ((kept + sentence).trim().length > limit) break;
    kept += sentence;
  }
  if (kept.trim()) return kept.trim();
  // One long sentence: end at the last clause break (semicolon, then comma) that fits.
  const head = text_.slice(0, limit - 1);
  const clause = Math.max(head.lastIndexOf(";"), head.lastIndexOf(":")) > 60 ? Math.max(head.lastIndexOf(";"), head.lastIndexOf(":")) : head.lastIndexOf(",");
  if (clause > 60) return `${head.slice(0, clause).trim()}.`;
  return text_.slice(0, text_.lastIndexOf(" ", limit - 1)).replace(/[,;:.\s]+$/, "") + "…";
}

export function lessonDescription({ title, summary, trackTitle, section }) {
  if (summary) return clampDescription(summary);
  const module = trackTitle.replace(/\s+—.*$/, "");
  const full = `${title}: an interactive lesson in ${module}${section ? ` (${section})` : ""} on ronak.sh.`;
  return clampDescription(full.length <= 160 ? full : `${title}: an interactive lesson in ${module}.`);
}
