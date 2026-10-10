import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readArticles } from "./article-content.mjs";
import { descriptions, homeTitle, learnViewNames, lessonDescription, pageTitle, clampDescription } from "../../src/app/pageMeta.js";

const origin = "https://ronak.sh";
const escapeHtml = value => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

// Every addressable page, with the same title the browser sets at runtime.
// A lesson reachable from several URLs points search engines at /learn/topic/<id>.
export async function sitePages(repositoryRoot) {
  // Loaded on demand so the dev server does not pay for the curriculum at startup.
  const [{ allTopicsOrdered, tracks }, { topicCatalogue }, { getPathTopicIds, learningPaths }, { projects }] = await Promise.all([
    import("../../src/learn/data/generated/navigation.js"),
    import("../../src/learn/data/curriculum/topic-catalogue.js"),
    import("../../src/learn/data/curriculum.js"),
    import("../../src/learn/data/projects/catalogue.js"),
  ]);
  const articles = await readArticles(repositoryRoot);
  const trackTitles = Object.fromEntries(tracks.map(track => [track.id, track.title]));
  const lesson = (topic, route) => ({
    route, canonical: `/learn/topic/${topic.id}`, title: pageTitle(topic.title, "Learn"), published: topic.status === "published",
    summary: lessonDescription({ title: topic.title, summary: topicCatalogue[topic.id]?.blueprint?.summary, trackTitle: trackTitles[topic.trackId] ?? "the curriculum", section: topic.section }),
  });
  const topicById = Object.fromEntries(allTopicsOrdered.map(topic => [topic.id, topic]));

  return [
    { route: "/", title: homeTitle, summary: descriptions.home },
    { route: "/portfolio", title: pageTitle("Portfolio"), summary: descriptions.portfolio },
    { route: "/learn", title: pageTitle("Learn"), summary: descriptions.learn },
    ...Object.entries(learnViewNames).map(([view, name]) => ({ route: `/learn/${view}`, title: pageTitle(name, "Learn"), summary: descriptions[view] })),
    { route: "/articles", title: pageTitle("Articles"), summary: descriptions.articles },
    ...articles.map(article => ({ route: `/articles/${article.slug}`, title: pageTitle(article.title, "Articles"), summary: clampDescription(article.summary) })),
    ...allTopicsOrdered.map(topic => lesson(topic, `/learn/topic/${topic.id}`)),
    ...tracks.flatMap(track => [
      { route: `/learn/track/${track.id}`, title: pageTitle(track.title, "Learn"), summary: clampDescription(track.description || descriptions.modules) },
      ...track.topicIds.filter(id => topicById[id]).map(id => lesson(topicById[id], `/learn/track/${track.id}/${id}`)),
    ]),
    ...learningPaths.flatMap(learningPath => [
      { route: `/learn/path/${learningPath.id}`, title: pageTitle(learningPath.title, "Learn"), summary: clampDescription(learningPath.description) },
      ...getPathTopicIds(learningPath).filter(id => topicById[id]).map(id => lesson(topicById[id], `/learn/path/${learningPath.id}/${id}`)),
    ]),
    ...projects.flatMap(project => [
      { route: `/learn/projects/${project.id}`, title: pageTitle(project.stages[0].title, project.title), summary: clampDescription(project.summary || descriptions.projects) },
      ...project.stages.map(stage => ({ route: `/learn/projects/${project.id}/${stage.id}`, title: pageTitle(stage.title, project.title), summary: clampDescription(stage.summary || project.summary || descriptions.projects) })),
    ]),
  ];
}

// "/learn/topic/x" is written as "learn/topic/x.html": Cloudflare (and vite preview)
// serve it at the slash-less address the app links to, with no redirect.
export const entryFile = route => route === "/" ? "index.html" : `${route.slice(1)}.html`;

// The host serves index.html for unknown addresses. Give every real page its own
// entry file so search engines and link previews see that page's title and description.
export async function writeSiteEntries(repositoryRoot, outputRoot) {
  const html = await readFile(path.join(outputRoot, "index.html"), "utf8");
  const pages = await sitePages(repositoryRoot);
  const seen = new Set();
  for (const page of pages) {
    if (seen.has(page.route)) throw new Error(`Duplicate site route: ${page.route}`);
    seen.add(page.route);
    if (!/^\/[a-z0-9\-/]*$/.test(page.route)) throw new Error(`Unsafe site route: ${page.route}`);
    // index.html is also the host's fallback for unknown addresses, so it stays exactly
    // as authored (it already carries Home's title and description) and has no canonical.
    if (page.route === "/") continue;
    const file = path.join(outputRoot, entryFile(page.route));
    await mkdir(path.dirname(file), { recursive: true });
    const content = html.replace(/<title>.*?<\/title>/s, () => `<title>${escapeHtml(page.title)}</title>`)
      .replace(/<meta name="description" content="[^"]*"\s*\/>/, () => `<meta name="description" content="${escapeHtml(page.summary)}" />`)
      .replace("</head>", () => `  <link rel="canonical" href="${origin}${page.canonical ?? page.route}" />\n  </head>`);
    await writeFile(file, content);
  }
  await writeFile(path.join(outputRoot, "404.html"), html);
  await writeFile(path.join(outputRoot, ".nojekyll"), "");
  await writeFile(path.join(outputRoot, "sitemap.xml"), sitemapXml(pages));
  await writeFile(path.join(outputRoot, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
}

// Only canonical addresses of real content: duplicate lesson URLs point at their
// topic URL, and planned (outline-only) lessons join automatically once published.
export const sitemapUrls = pages => pages
  .filter(page => (page.canonical ?? page.route) === page.route && page.published !== false)
  .map(page => origin + page.route);

const sitemapXml = pages => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
  sitemapUrls(pages).map(url => `  <url><loc>${escapeHtml(url)}</loc></url>`).join("\n")}\n</urlset>\n`;
