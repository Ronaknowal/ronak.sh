# Home design

Status: implemented 10 October 2026 on branch `home-redesign`. It replaces the
earlier directory-style home. [SITE-ARCHITECTURE.md](SITE-ARCHITECTURE.md#home-presentation)
now points here. Home is the first part of a site-wide redesign. Portfolio, Learn
and Articles follow later in the same visual language, each with its own design
record. The exploratory mockups were discarded after approval; this document and
the shipped code are the record.

## Decisions and reasons

| Decision | Reason given or observed |
| --- | --- |
| Audience: learners first, with Ronak's work as proof | The Learn curriculum is by far the largest real content on the site |
| Keep the black/charcoal and amber identity; rebuild type, layout, motion and interaction | User choice. Green/olive remains rejected |
| The name is the `h1` ("Hello, I'm / Ronak Sharma."), followed by role and motto | When the motto was the headline, the name nearly disappeared. The user chose name-first (option A) over a name-in-sentence or a side-by-side layout |
| Motto "I learn by **training it** from scratch.", where only "training it" resolves from noise | User liked text resolving from gibberish. Animating only those words keeps the sentence readable at once and gives the effect a meaning |
| Introduction keeps the current site's two paragraphs | User asked for copy similar to the existing site |
| Learn entrance is a route finder showing **one** route as a line of stops | A map of every lesson was rejected as cluttered. A single route is clean and still shows the real prerequisites |
| An optional, collapsed index of the whole curriculum | User wanted access to every topic without cluttering the page |
| A Work section with on-site projects and external links | User asked for a place on Home that links to their other work |

Rejected during exploration: a transit map showing all lessons, a live neural
network hero with "epoch" sections, and an editorial notebook ("safe, not unique").

## Page structure

1. **Shared header.** Brand link plus learn / portfolio / articles (existing `SiteHeader` behaviour).
2. **Hero (name first)**
   - "Hello, I'm" in muted mono.
   - `h1`: **Ronak Sharma.** with an amber full stop, `clamp(52px, 8.5vw, 112px)`.
   - Role in mono: "Data Science Engineer / AI Builder".
   - Motto as a large second line, not a heading: "I learn by **training it** from scratch.", with "training it" in amber, `clamp(26px, 3.2vw, 40px)`, weight 500.
   - Introduction:
     > I build AI systems and learn by taking ideas apart. My work spans machine learning, deep learning, NLP, and systems.
     >
     > This is my corner of the internet for the things I build and the things I want to understand deeply.
   - Links: GitHub ↗, LinkedIn ↗, My work ↓ (an anchor to Work).
   - Height: `min(86vh − header, 680px)` on desktop; natural height on phones.
3. **01 — Learn: "Where do you want to go?"**
   - Search input with a listbox of results, plus four suggestion chips (backprop, transformers, FlashAttention, self-attention). Each chip maps to an exact lesson title and is dropped if that title disappears.
   - The route display (see Route finder). On load it shows the route to Transformer Block Architecture, labelled as an example by the pressed chip.
   - "Start this route →" links to the first stop at `/learn/topic/:topicId`. When there are no stops, it reads "Open the lesson" and links to the goal.
   - A collapsed "Or open the whole curriculum" panel (see Whole-curriculum index).
   - Quiet links: Follow a guided path → `/learn/paths`; Build a project end to end → `/learn/projects`.
4. **02 — Work: "Things I've built, and where else to find me."**
   - **Projects:** four rows (year, name, one line) linking to `/portfolio#projects`, plus "All 6 projects →". Default: SketchToReal, Bloospace, The Simulation Space, Autonomous Driving RL.
   - **Elsewhere:** rows of a small domain label, a title and ↗. They come from `src/home/elsewhere.js`. GitHub and LinkedIn are real. A row without a real URL is **not rendered**: no `#` links and no placeholders in production.
5. **Footer.** "Ronak Sharma — always learning." and Back to top.

Section labels ("01 — Learn") sit in a 200px left column on desktop and stack on screens 860px wide or narrower.

## Interactions

**Headline resolve.** Each letter of "training it" is an inline-block span. An
unresolved letter has a transparent colour and shows a random noise glyph through
`::after`, so layout never moves. The resolve runs for 1.1 s starting at 250 ms,
eased with `1 − (1−p)^2.2` and a fixed per-letter stagger. Hovering the words
replays a 450 ms resolve. The motto element has an `aria-label` holding the full sentence, so screen readers never hear noise glyphs.
With reduced motion it renders resolved and has no hover effect.

**Name echo.** Project and Elsewhere titles scramble and resolve over 320 ms on
pointer hover. They are the only other motion on the page, and are off with reduced motion.

**Route finder**
- Route = all transitive prerequisites of the goal (`prerequisiteIds`), ordered
  by longest-path depth, then curriculum order.
- If the goal has no recorded prerequisites (707 of 1,461 today), show the
  earlier lessons in its section, with the note "No prerequisites are recorded
  for this lesson yet…". If there is nothing before it either, say it is a starting point.
- Routes longer than 7 stops collapse to: first 2, a "+N stops" button, the last 4, then the goal. The button expands the line in place.
- Each stop shows a filled dot when published and a hollow dot when planned. A small amber track name appears where the route changes track.
- The header line reads "N stops before it · T tracks · O open now".
- Desktop: a horizontal line using `grid-auto-columns:minmax(0,1fr)`. At 860px and below it becomes a vertical line.
- Search ranks published lessons first, then lessons with a route, then shorter titles; it shows 6 results. Arrow keys, Enter and Escape work. The route region is `aria-live="polite"`.

**Whole-curriculum index**
- A disclosure button (`aria-expanded`, `aria-controls`) labelled with real counts: lessons, tracks, stages and open now.
- Content: the 6 stage groups from `trackGroups`, then track rows with an honest status ("all 42 open", "58 of 62 open", "33 planned"). A track row expands to show section headings and lessons in CSS columns (3 on desktop, 1 on phones).
- Tools: a filter that auto-expands matching tracks and highlights the match, an "open now only" toggle, and expand/collapse all.
- Clicking a lesson draws its route and scrolls the route into view.

## Data and loading

Home must not import Learn section bodies or `generated/navigation.js` (about 940 KB).

- `scripts/generate-learning-artifacts.mjs` also emits `generated/home-index.js`. It contains stage groups, track `{id,title}`, and lessons as `[id, title, trackId, section, prerequisiteIndexes[], published]`. That is about 237 KB raw and 61 KB gzipped, so it is a separate chunk.
- The generator also emits a small `generated/home-example-route.js` holding the precomputed default route. The first paint therefore needs no index.
- Home loads `home-index.js` with a dynamic `import()` when the search box gets focus, a chip is pressed or the curriculum panel opens. It also prefetches on idle. While the index loads, the search shows "Loading lessons…".
- If the import fails, show "Lessons could not load", with a link to `/learn/catalogue`. The rest of Home is unaffected.
- `node scripts/verify-learning-artifacts.mjs` already runs the generator with `--check`, so the new outputs are kept in sync like the existing ones.

## Components and files

| File | Responsibility |
| --- | --- |
| `src/home/Home.jsx` | Page composition and hero markup |
| `src/home/HeroMotto.jsx`, `noise.js`, `useReducedMotion.js` | The "training it" resolve and its reduced-motion handling |
| `src/home/route.js` | Pure route functions: `ancestors`, `orderRoute`, `fallbackRoute`, `planRoute`, `collapseRoute`, `searchLessons`, `toRouteView` |
| `src/home/suggestions.js` | Suggestion chips and the example route, shared with the generator, which fails if an ID disappears |
| `src/home/useHomeIndex.js` | Lazy, cached `home-index.js` load, prefetched on idle |
| `src/home/LearnSection.jsx` | Owns the selected route; composes the parts below |
| `src/home/RouteSearch.jsx`, `RouteLine.jsx`, `CurriculumIndex.jsx` | Combobox search, the route line, and the whole-curriculum disclosure |
| `src/home/WorkSection.jsx`, `work.js`, `useScrambleOnHover.js` | Projects, Elsewhere links (only rows with a real URL render) and the name echo |
| `src/home/home.css` | All Home styles, using `--site-*` tokens |
| `src/learn/data/generated/home-summary.js`, `home-index.js` | Generated by `scripts/generate-learning-artifacts.mjs` |

## Verification

Results from 10 October 2026, on a fresh production build:

- `node scripts/verify-home-route.mjs`: route order, cycle guard, fallback, collapse, search ranking and views. PASS.
- `node scripts/verify-learning-artifacts.mjs`: the Home index matches all 1,461 lessons and their prerequisites. PASS.
- `npm run check:site-build`: `home-index.js` is a dynamic entry, and no eager Home file contains full navigation records (`designStatus`). PASS.
- `npm run check:repository`: PASS.
- `scripts/verify-site-shell.cjs` (Playwright, Edge): 24 checks pass. They cover the payload boundary, the example route, collapse and expand, chips, keyboard search, curriculum selection, a filtered track collapsing, the filter empty state, real-only external links, curated links, legacy anchors, `#work` staying on Home, and no overflow at 1440, 768, 390 and 320px.
- Measured: the "training it" bounding box is identical mid-resolve and settled, so there is no layout shift. Screenshots of the hero mid-resolve, the open index and the filtered index were reviewed.

## Open inputs from the user

- URLs for the Elsewhere rows. The portfolio lists a YouTube series ("Building Bloospace in public") and Instagram reels but has no URLs for them. Until URLs arrive, those rows stay hidden.
- Confirmation of the four featured projects (default above).
