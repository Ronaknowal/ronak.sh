import assert from "node:assert/strict";
import { readFile, access, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readArticles } from "./lib/article-content.mjs";
import { entryFile, sitePages, sitemapUrls } from "./lib/site-build.mjs";
import { homeTitle } from "../src/app/pageMeta.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, "dist/.vite/manifest.json"), "utf8"));
function staticClosure(entry, found = new Set()) {
  if (found.has(entry)) return found;
  assert.ok(manifest[entry], `Missing manifest entry: ${entry}`);
  found.add(entry);
  for (const dependency of manifest[entry].imports || []) staticClosure(dependency, found);
  return found;
}
const home = staticClosure("index.html");
const index = staticClosure("src/articles/ArticlesIndex.jsx");
const reader = "src/articles/ArticleReader.jsx";
for (const entry of [reader, "src/articles/ArticlesIndex.jsx", "src/portfolio/Portfolio.jsx", "src/learn/LearnHub.jsx"]) {
  assert.ok(manifest[entry]?.isDynamicEntry, `${entry} must be a lazy route`);
  assert.ok(!home.has(entry), `Home eagerly imports ${entry}`);
}
const homeIndexEntry = "src/learn/data/generated/home-index.js";
assert.ok(manifest[homeIndexEntry]?.isDynamicEntry, "Home's lesson index must load on demand");
assert.ok(!home.has(homeIndexEntry), "Home eagerly imports its lesson index");
for (const entry of home) {
  const code = await readFile(path.join(root, "dist", manifest[entry].file), "utf8");
  // Full navigation records carry designStatus; Home's eager code must not.
  assert.ok(!code.includes("designStatus"), `${entry} eagerly bundles full curriculum navigation`);
}
assert.ok(!index.has(reader), "Articles index eagerly imports Markdown reader");
for (const entry of [...home, ...index]) assert.ok(!entry.startsWith("content/"), `${entry} is eagerly loaded`);
const published = await readArticles(root);
const allowedBodies = new Set(published.map(article => `content/articles/${article.slug}/body.md?raw`));
for (const key of Object.keys(manifest).filter(key => key.startsWith("content/articles/"))) {
  assert.ok(allowedBodies.has(key), `An unpublished article entered the build: ${key}`);
  assert.ok(manifest[key].isDynamicEntry, `Article body is not loaded on demand: ${key}`);
}
for (const key of allowedBodies) assert.ok(manifest[key], `Missing published body: ${key}`);
for (const file of ["articles.html", "portfolio.html", "learn.html", "404.html", ".nojekyll", ...published.map(article => `articles/${article.slug}.html`)]) await access(path.join(root, "dist", file));
// Every page's entry file carries exactly its own title, description and canonical address.
const escapeHtml = value => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const pages = await sitePages(root);
for (const page of pages) {
  const html = await readFile(path.join(root, "dist", entryFile(page.route)), "utf8");
  assert.ok(html.includes(`<title>${escapeHtml(page.title)}</title>`), `${page.route}: wrong title`);
  assert.ok(html.includes(`<meta name="description" content="${escapeHtml(page.summary)}" />`), `${page.route}: wrong description`);
  assert.ok(html.includes(`<link rel="canonical" href="https://ronak.sh${page.canonical ?? page.route}" />`), `${page.route}: wrong canonical`);
  assert.ok(page.summary.length <= 161, `${page.route}: description longer than search results show`);
}
const homeHtml = await readFile(path.join(root, "dist/index.html"), "utf8");
assert.ok(homeHtml.includes(`<title>${escapeHtml(homeTitle)}</title>`), "Home entry has the wrong title");
// Cloudflare Workers static assets allow 20,000 files per deployment; fail well before that.
const fileCount = (await readdir(path.join(root, "dist"), { recursive: true, withFileTypes: true })).filter(entry => entry.isFile()).length;
assert.ok(fileCount < 18000, `dist has ${fileCount} files; Cloudflare's limit is 20,000`);
// The sitemap lists each canonical content page once, every one of them a real entry file.
const sitemap = await readFile(path.join(root, "dist/sitemap.xml"), "utf8");
assert.ok(sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>') && sitemap.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), "Malformed sitemap");
const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
assert.deepEqual(listed, sitemapUrls(pages), "Sitemap differs from the canonical page list");
assert.equal(new Set(listed).size, listed.length, "Sitemap lists a URL twice");
assert.ok(listed.length < 50000, "Sitemap exceeds 50,000 URLs");
const routes = new Set(pages.map(page => page.route));
for (const url of listed) assert.ok(routes.has(new URL(url).pathname), `Sitemap lists a page with no entry file: ${url}`);
const lessonPages = pages.filter(page => page.route.startsWith("/learn/topic/"));
for (const page of lessonPages) assert.equal(listed.includes(`https://ronak.sh${page.route}`), page.published, `${page.route}: only published lessons belong in the sitemap`);
assert.ok(!listed.some(url => /\/learn\/(track|path)\/[^/]+\/[^/]+$/.test(url)), "Duplicate lesson URLs must stay out of the sitemap");
assert.ok((await readFile(path.join(root, "dist/robots.txt"), "utf8")).includes("Sitemap: https://ronak.sh/sitemap.xml"), "robots.txt must point to the sitemap");
console.log(`Build checks passed: lazy section boundaries, isolated Markdown reader, ${published.length} on-demand published bodies, no draft chunks, ${pages.length} page entries with their own title, description and canonical address, a sitemap of ${listed.length} canonical pages (${lessonPages.filter(page => page.published).length} published lessons), ${fileCount} deployed files, and the fallback page.`);
