# pub_plan.md — Publication Readiness

Status: drafted 2026-05-17. Goal: get `3d-resources` repo + `3d.devanshutak.xyz` ready for Awesome-list submissions, Show HN, Reddit/Discord drops, newsletters.

Audit basis: live site fetch + repo view + `_site/` build inspection on `main`.

---

## Part 1 — CODE CHANGES (this is what we'll work through first)

Ordered by impact × effort. Land top-down.

---

### 1.1 Split / shrink `README.md` 🔴 BLOCKER

**Problem:** 712 KB. GitHub renders errors ("Uh oh! There was an error while loading"). Confirmed via WebFetch on repo page. Awesome-list maintainers won't link to a broken README.

**Options (pick one):**

- **A (recommended):** keep `README.md` as a *thin landing page* (~30–60 KB): hero, badges, ToC with section counts, top 5 picks per section, links into `data/` files or the live site. Move full catalog to live site only (it already has it).
- **B:** split into per-section README files under `data/<section>/README.md`, root README links to them.
- **C:** strip prose-heavy content (descriptions, ToC small text) from README only; keep on site.

**Files touched:** `scripts/render.js` (introduce render mode: `readme-lite` vs `site-full`), `README.md` (rebuild output), `build.sh`.

**Acceptance:** README < 350 KB. Loads on github.com without truncation banner. Live site unchanged.

---

### 1.2 Per-section HTML pages 🟣 high-SEO-impact

**Problem:** Single 1 MB `index.html` with anchor fragments. Google won't surface "best free PBR textures 2026" pointing at `#textures--materials--free-pbr-libraries`. Sitemap currently lists anchor URLs (~28KB of `loc` entries that all collapse to one page).

**Change:**
- `scripts/build-html.js` → emit `/sections/<slug>/index.html` per section (12 pages) in addition to root.
- Root `index.html` becomes a slim hub: hero + section cards + global search shell. Below-fold sections lazy-load OR are moved entirely to per-section pages.
- Rewrite `sitemap.xml` to point at real URLs, not fragments.
- Add `ItemList` JSON-LD per section page (Google rich results: "Carousel" eligible).
- Internal links between sections via prev/next nav.

**Acceptance:** 12 new pages, each < 200 KB. Sitemap shows 13 real URLs. `curl /sections/assets-libraries/` returns 200.

---

### 1.3 Server-render the filter/search bar shell ⚖️

**Problem:** `filter.js` injects `#filter-bar` after page load. Crawlers + no-JS users get no above-ToC affordance. JS bundle is 50 KB — slow on mobile.

**Change:** Move bar markup (input, license/platform/workflow chips, clear button) into `build-html.js` template. JS hydrates instead of constructs. Add `<noscript>` notice ("filtering needs JS, ToC works without").

**Files:** `scripts/build-html.js`, `_site/assets/js/filter.js` (remove DOM-creation, keep behaviour).

**Acceptance:** View-source shows filter bar HTML. Lighthouse "Performance" gains points on FCP/LCP.

---

### 1.4 Defer Mixpanel + critical CSS 🔵

**Problem:** Mixpanel inline script in `<head>` blocks parse. `mdi` font CDN render-blocks with no `preconnect`.

**Change:**
- Mixpanel: move to bottom of `<body>`, mark `async`, OR load on `requestIdleCallback`.
- Inline ~3 KB of critical CSS (above-fold: header, h1, ToC summary) directly in `<head>`, load full `style.css` async.
- Add `<link rel="preconnect" href="https://cdn.jsdelivr.net">` + `crossorigin`.
- Self-host `materialdesignicons.min.css` subset — currently pulling full 7.4 MB font for ~30 icons. Use `subfont` or hand-extract used glyphs.

**Files:** `scripts/build-html.js`, `_site/assets/css/style.css`, `build.sh` (font subsetting step).

**Acceptance:** Lighthouse perf > 90 mobile. mdi font asset < 50 KB.

---

### 1.5 Add `llms.txt` 🔵 AI search

**Problem:** No file for ChatGPT/Perplexity/Claude to grab a clean curated view. Without it, AI crawlers parse the 1 MB HTML and skip you.

**Change:** Generate `_site/llms.txt` from `data/sections.yml` + entry titles. Spec: <https://llmstxt.org>. Should be markdown, < 100 KB, with section anchors → live URLs.

**Files:** new `scripts/build-llms-txt.js`, hook into `build.sh`.

**Acceptance:** `curl 3d.devanshutak.xyz/llms.txt` returns markdown. Validates against llmstxt.org spec.

---

### 1.6 Polish footer + "edit this page" 🔵

**Problem:** Footer is one link. No back-to-top, no last-updated, no GitHub source link per section.

**Change:** In `build-html.js`:
- Footer: GitHub stars badge (live via shields.io or static), "Last updated YYYY-MM-DD", license, contribute CTA, back-to-top button.
- Per-section H2: small "📝 Edit on GitHub" link → `data/<section>.yml` source file.
- Per-entry: optional ⓘ tooltip with `verified` date.

**Files:** `scripts/build-html.js`, `_site/assets/css/style.css`.

---

### 1.7 Add `_site/404.html` 🔵

**Problem:** Cloudflare Pages serves generic 404 on rotted links / typo URLs.

**Change:** Static 404 with search box, link to root, list of popular sections. Re-use site CSS.

**Files:** new `_site/404.html` template inside `build-html.js`.

---

### 1.8 Add badges + repo metadata to README hero

**Problem:** No CI/license/stars badges. Looks unmaintained at a glance.

**Change:** Top of README, after H1:
- ![stars](https://img.shields.io/github/stars/devanshutak25/3d-resources?style=flat)
- ![license CC0](https://img.shields.io/badge/license-CC0-blue)
- ![validate](https://github.com/devanshutak25/3d-resources/actions/workflows/validate.yml/badge.svg)
- ![entries](custom shield: "1,300+ entries") — generate via shields.io endpoint or static badge regenerated by `validate.js`.

**Files:** `scripts/render.js` (badges block above ToC).

---

### 1.9 Add community files 🟣

**Problem:** GitHub doesn't recognize `contributing.md` (lowercase). No CoC, no security policy, no issue/PR templates → repo looks unmoderated.

**Change:**
- Rename `contributing.md` → `CONTRIBUTING.md`. Update all references (`scripts/render.js`, link in README hero).
- Add `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1).
- Add `SECURITY.md` (1-liner: report via GitHub issues / email).
- Add `.github/ISSUE_TEMPLATE/`:
  - `suggest-resource.yml` (structured form: name, URL, section, license, why).
  - `report-broken-link.yml`.
  - `report-bug.yml`.
- Add `.github/PULL_REQUEST_TEMPLATE.md` (checklist: ran `node scripts/validate.js`, vocab check, etc.).
- Add `.github/FUNDING.yml` (optional).

**Files:** new files under `.github/`, rename `contributing.md`.

---

### 1.10 Per-section OG images 🟣 nice-to-have

**Problem:** Every link shared = same generic `og-image.png`. Reddit/Twitter posts for "Houdini section" show the same card as "AI for CG".

**Change:** Script-generate 12 OG images from `og-image.svg` template + section title via `sharp` or `resvg`. Output `_site/assets/og/<section-slug>.png`. Per-section HTML page references its own OG.

**Files:** new `scripts/build-og-images.js`, `_site/assets/og-image.svg` (template with `{{title}}`).

---

### 1.11 RSS / Atom feed 🔵

**Problem:** `scripts/lib/rss.js` exists but no feed in `_site/`. Newsletters + power users subscribe via RSS — frictionless growth signal.

**Change:** Wire `rss.js` into `build.sh`. Emit `/feed.xml` listing latest 50 added entries (use `verified` or git-blame date). Link from `<head>` + footer.

**Files:** `build.sh`, `scripts/build-rss.js` (if not done), `scripts/build-html.js` (feed `<link>` tag).

---

### 1.12 Optional: search-index split 🔵

**Problem:** `search-index.json` = 787 KB downloaded on first interaction. Slow on mobile.

**Change:** Split per-section, lazy-load when filter chips clicked. Or compress (Brotli is already on at Cloudflare — verify).

**Files:** `scripts/build-search-index.js`, `_site/assets/js/filter.js`.

**Defer if low-priority** — Cloudflare brotli likely handles most of it.

---

## Code execution order

1. **1.9** community files (15 min, unblocks contributors)
2. **1.8** badges (15 min, README hero polish)
3. **1.1** README split (BLOCKER for awesome PRs)
4. **1.5** llms.txt (1h, AI traffic)
5. **1.6** footer + edit-on-github (1h)
6. **1.7** 404 page (30 min)
7. **1.4** perf defer (1–2h)
8. **1.3** SSR filter shell (2h)
9. **1.2** per-section pages + sitemap rewrite (half-day, biggest SEO win)
10. **1.10** per-section OG (2h)
11. **1.11** RSS feed (1h)
12. **1.12** search-index split (defer)

---

## Part 2 — NON-CODE CHANGES (cover after code lands)

Stubbed. We'll detail this after Part 1 is shipped.

- GitHub "About" description + topics audit + social preview upload
- Cut `v1.0.0` release with changelog
- Awesome-list PR submissions (~10 targets)
- Reddit posts (r/blender, r/Houdini, r/vfx, r/gamedev, r/3Dmodeling)
- Hacker News "Show HN" timing
- Discord drops in communities already in the catalog
- Twitter/X + BlueSky launch thread, tag SideFX/Blender/Foundry/80lvl
- Newsletter pitches: BlenderNation, CG Channel, 80.lv, Befores & Afters, Houdini Hive
- Product Hunt launch (only after landing-page polish)
- SEO follow-up: GSC submission, run `/seo-audit`, watch CrUX
