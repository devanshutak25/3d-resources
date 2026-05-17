# changes.md — Publication-readiness pass

**Date:** 2026-05-17
**Branch:** (pushed to a separate branch by the user; not main)
**Source plan:** `pub_plan.md` (Part 1 — code changes) and `C:\Users\Devanshu\.claude\plans\make-a-complete-plan-tingly-snowglobe.md` (executable plan)

## Why this work happened

Repo had 741 stars but couldn't be linked from awesome-lists because the **712 KB `README.md` broke GitHub's renderer** ("Uh oh! There was an error..."). Other publication blockers were stacking up too: anchor-only sitemap, missing community files, no per-section indexable pages, render-blocking analytics, no AI/LLM crawler signals.

Goal: prep the repo + live site for Awesome-list submissions, Reddit/Discord drops, Hacker News, newsletter pitches.

---

## Steps executed (11 / 11 complete)

### Step 1 — Community files

GitHub's "Community Standards" checks now pass.

**Changes:**
- `contributing.md` → `CONTRIBUTING.md` (renamed via two-step `git mv` because Windows FS is case-insensitive). GitHub now auto-detects it.
- `CODE_OF_CONDUCT.md` — references Contributor Covenant v2.1 (short stub, links out instead of inlining boilerplate).
- `SECURITY.md` — short reporting policy, points to `3dresources@devanshutak.xyz`.
- `.github/ISSUE_TEMPLATE/config.yml` — disables blank issues, routes to live site / email.
- `.github/ISSUE_TEMPLATE/suggest-resource.yml` — form with name/URL/section dropdown (12 sections)/license/why.
- `.github/ISSUE_TEMPLATE/report-broken-link.yml` — form for dead/moved/wrong-license links.
- `.github/ISSUE_TEMPLATE/report-bug.yml` — site/build bug form.
- `.github/PULL_REQUEST_TEMPLATE.md` — checklist (validate.js ran, vocab clean, one entry per PR).
- `.github/FUNDING.yml` — commented stub.
- `scripts/render.js` — updated two `contributing.md` references to `CONTRIBUTING.md`.

### Step 2 — README badges

**File:** `scripts/render.js::header()` — inserted badges block inside `<!-- only:readme -->` so the site build strips it.

Badges shown on README only:
- GitHub stars
- License: CC0-1.0
- Validate CI status
- Live site shield

### Step 3 — README slim mode (BLOCKER)

**README.md: 712 KB → 19.2 KB.**

**File:** `scripts/render.js` — added:
- `renderLite()` — landing page with hero, badges, tagline, then top-5 picks per section + "Browse all N entries" link to `https://3d.devanshutak.xyz/sections/<slug>/`.
- `collectSectionEntries()` — flattens a section's non-deprecated entries across subsections, dedupes by URL.
- `pickTopForSection()` — Pass 1: name-match against `sections.yml::featured`. Pass 2: alpha (software first, then references) until 5 entries reached.
- `stripHtmlForLite()` — clean descriptions of inline HTML.
- `parseArgs()` — supports `--mode=lite|full` plus the existing positional `onlyFile` arg.

**File:** `build.sh` — reordered to render full first (consumed by build-html.js), then **overwrite README.md with lite** afterwards. Site keeps full catalog; README is landing-only.

### Step 4 — `llms.txt` for AI crawlers

**File:** `scripts/build-llms-txt.js` (new).

Emits two files per [llmstxt.org](https://llmstxt.org) spec:
- `_site/llms.txt` (11.6 KB) — concise: hero, per-section top-6 picks, links to comprehensive index and section pages.
- `_site/llms-full.txt` (398.6 KB) — full catalog dump for crawlers that want depth.

Both use the catalog directly (not `data.json`) so descriptions are included. Dedupes by URL across chunks. Skips deprecated entries.

**Wired into:** `build.sh` (step 7).

### Step 5 — Footer + edit-on-GitHub

**File:** `scripts/build-html.js` — multiple changes:

1. **`lastUpdatedDate()`** helper — reads most recent commit date via `git log -1 --format=%cs HEAD`; falls back to today.
2. **`SECTION_FILE_BY_ANCHOR`** map — built from `sections.yml`. Used to inject a `📝 Edit` link inside each section H2 pointing at `data/<file>.yml` on GitHub.
3. **Rich `<footer>`** — replaces the bare `<small>` with:
   - 3-column grid (`3D Resources` + curator + last-updated · `Contribute` links · `Project` links).
   - Footer badges (stars, validate CI status).
4. **Back-to-top button** — fixed-position, `.visible` class toggled by inline scroll-listener script (threshold 600 px).

**File:** `assets/css/style.css` — new sections for `.edit-on-gh`, `.back-to-top`, `.site-footer`, `.footer-grid`, `.footer-col`, `.footer-badges`. Edit pill collapses to icon-only at `max-width: 480px`.

### Step 6 — `404.html`

**File:** `scripts/build-html.js` — new `notFoundPage` template, written to `_site/404.html` (3.3 KB). Contains:
- `noindex, follow` robots meta.
- Hero "404 — Page not found".
- Grid of 12 section cards (with discipline icons) for recovery.
- "Spotted a broken link?" link to GitHub issue template.

Cloudflare Pages auto-serves `404.html` on unmatched URLs.

**File:** `assets/css/style.css` — `.not-found-list` grid styling.

### Step 7 — Perf: defer Mixpanel + critical CSS + non-blocking stylesheets

**File:** `scripts/build-html.js`:

1. **Critical CSS** inlined in `<head>` — ~500 bytes covering body, wrapper, header, h1, skip-link. Prevents FOUC.
2. **All non-critical stylesheets** loaded via `media="print" onload="this.media='all'"` pattern: `style.css`, Google Fonts (Inter), Fontshare (Clash Grotesk), jsdelivr (mdi font).
3. **`<noscript>` fallback** — same stylesheets with normal `media="all"` so JS-disabled users still get full styles.
4. **`preconnect` added** for `cdn.jsdelivr.net` (it was the only one missing).
5. **Mixpanel** — moved from `<head>` (render-blocking) to just before `</body>`, wrapped in `requestIdleCallback` (timeout 2500ms, `setTimeout(1500)` fallback).

**Deferred** (planned, not done — defer noted in plan):
- mdi font subsetting / self-hosting → kept on CDN with `preconnect` + non-blocking instead. 14 distinct icons used; refactoring to inline SVG would touch `filter.js` chip-toggle logic too. Revisit if Lighthouse complains.

### Step 8 — Per-section HTML pages + sitemap rewrite

**File:** `scripts/build-section-pages.js` (new). For each of the 12 sections:
1. Shells out to `node scripts/render.js <sectionFile>` (uses existing `--onlyFile` mode) to get the section's markdown.
2. `marked.parse()` → HTML.
3. Post-process (mirrors `build-html.js`): heading IDs, H2 icon, edit-on-GitHub pill, external-link hygiene.
4. Wraps in section-scoped template:
   - Canonical URL `https://3d.devanshutak.xyz/sections/<slug>/`.
   - Per-section `<title>` and meta description (from `sections.yml`).
   - **JSON-LD `@graph`**: `BreadcrumbList`, `CollectionPage`, `ItemList` (up to 100 entries).
   - Breadcrumb nav.
   - Prev/next section nav (from `sections.yml` order).
   - Same critical-CSS + non-blocking-stylesheet pattern as root.
   - Back-to-top button.

12 pages emitted. Sizes: 17 KB (animation-rigging, 12 entries) to 220 KB (game-development, 801 entries).

**File:** `scripts/build-html.js` — sitemap rewritten:
- Was: 158 URLs (root + section anchors + subsection anchors).
- Now: 13 real URLs (root @ priority 1.0 + 12 section pages @ 0.9). Anchor fragments dropped because Google collapses them to root and they dilute crawl budget.

**File:** `assets/css/style.css` — added `.breadcrumb`, `.section-nav`, `.section-nav-prev`, `.section-nav-next`.

**File:** `build.sh` — `build-section-pages.js` runs after OG image generation (which it depends on).

### Step 9 — Per-section Open Graph images

**Files:**
- `assets/og-template.svg` (new, 2 KB) — clean text-based SVG template (1200×630, dark background with gradient accent bar). Placeholders: `{{TITLE_LINE_1}}`, `{{TITLE_LINE_2}}`, `{{TAGLINE}}`, `{{COUNT_TEXT}}`, `{{COUNT_CHIP_WIDTH}}`, `{{SLUG}}`.
- `scripts/build-og-images.js` (new) — substitutes placeholders per section, renders via `@resvg/resvg-js` (pure JS / WASM, no native deps). Emits `_site/assets/og/<slug>.png`. Two-line title splitter handles "X & Y" and "X — Y" patterns; falls back to last-space-before-middle.

**Dependency added:** `@resvg/resvg-js@^2.6.2` (in `package.json`).

**Output:** 12 PNGs, 70–87 KB each.

**File:** `scripts/build-section-pages.js` — `og:image` and `twitter:image` now point at the per-section PNG instead of the generic `og-image.png`.

### Step 10 — Atom feed

**File:** `scripts/build-feed.js` (new). Emits `_site/feed.xml` (Atom 1.0, 18.9 KB, 50 entries).

Ordering heuristic: chunks iterate in insertion order (per ADR-0001), so the tail of `iterChunks()` is freshest. Takes last 50, reverses. Not perfectly chronological but a good signal without git-blaming every entry.

Each `<entry>` has title, link, id, updated, summary, category (section), category (license, schema="license"). Top-level `<updated>` uses last commit ISO timestamp.

**Files updated to advertise the feed:**
- `scripts/build-html.js` — `<link rel="alternate" type="application/atom+xml">` in head; footer already had `/feed.xml` link.
- `scripts/build-section-pages.js` — same `<link rel="alternate">` in each section page head.

**Wired into:** `build.sh` (step 8).

### Step 11 — SSR filter/search bar shell

Crawlers + no-JS users now see a `<search>` landmark above the ToC.

**File:** `scripts/build-html.js` — after the existing post-processing passes, injects a static `<div id="filter-shell" role="search">` right before `<h2 id="contents">`. Contains:
- A disabled `<input type="search">` (visible affordance for crawlers and no-JS users).
- A `<noscript>` notice explaining the JS dependency.

**File:** `assets/js/filter.js` — first lines of `buildUI()` find and remove `#filter-shell` before constructing the real interactive bar. Minimal change, no chip-config drift risk.

**File:** `assets/css/style.css` — `#filter-shell` and `.filter-noscript-notice` styles.

---

## New / updated build pipeline (`build.sh`)

```
1.  npm install ...                                  (npm deps)
1.  node scripts/render.js > README.md               (FULL — consumed by build-html)
2.  node scripts/build-html.js                       (emits _site/index.html, _site/404.html, sitemap.xml, robots.txt)
2b. node scripts/build-og-images.js                  (12 OG PNGs)
2c. node scripts/build-section-pages.js              (12 section HTML pages)
3.  node scripts/render.js --mode=lite > README.md   (overwrite README with landing page)
4.  node scripts/export-data.js _site/data.json
5.  node scripts/build-search-index.js ...           (search-index.json)
6.  node scripts/build-graph.js _site/graph.json
6.  cp assets/graph.html _site/graph.html
7.  node scripts/build-llms-txt.js                   (llms.txt + llms-full.txt)
8.  node scripts/build-feed.js                       (feed.xml)
```

---

## Artifact inventory after a clean build

| Path | Size | Status |
|---|---|---|
| `README.md` | 19.2 KB | Was 712 KB. **Renders on GitHub.** |
| `_site/index.html` | 1.0 MB | Full single-page catalog (unchanged) |
| `_site/sections/<slug>/index.html` × 12 | 17–220 KB | **NEW** — SEO-indexable per-section pages |
| `_site/404.html` | 3.3 KB | **NEW** |
| `_site/feed.xml` | 18.9 KB | **NEW** — Atom 1.0, 50 latest entries |
| `_site/llms.txt` | 11.6 KB | **NEW** — concise spec-compliant |
| `_site/llms-full.txt` | 398.6 KB | **NEW** — comprehensive |
| `_site/sitemap.xml` | 2.5 KB | Rewritten — 13 real URLs |
| `_site/assets/og/<slug>.png` × 12 | 70–87 KB | **NEW** — per-section share cards |
| `_site/data.json` | 911 KB | unchanged |
| `_site/search-index.json` | 814 KB | unchanged |
| `_site/graph.json` | 1.8 MB | unchanged |

Top-level community files:
| Path | Status |
|---|---|
| `CONTRIBUTING.md` | renamed from `contributing.md` |
| `CODE_OF_CONDUCT.md` | **NEW** |
| `SECURITY.md` | **NEW** |
| `.github/ISSUE_TEMPLATE/config.yml` | **NEW** |
| `.github/ISSUE_TEMPLATE/suggest-resource.yml` | **NEW** |
| `.github/ISSUE_TEMPLATE/report-broken-link.yml` | **NEW** |
| `.github/ISSUE_TEMPLATE/report-bug.yml` | **NEW** |
| `.github/PULL_REQUEST_TEMPLATE.md` | **NEW** |
| `.github/FUNDING.yml` | **NEW** (commented stub) |

---

## Verification — end-to-end

```powershell
bash build.sh                    # full clean build
node scripts/validate.js         # MUST show "✓ Validation passed."
                                 # (189 warnings are pre-existing — not introduced)

# Local serve to test everything end-to-end:
python -m http.server -d _site 8080
# Then open:
#   http://localhost:8080/
#   http://localhost:8080/sections/animation-rigging/
#   http://localhost:8080/sections/game-development/
#   http://localhost:8080/404.html       (or any unknown path)
#   http://localhost:8080/feed.xml
#   http://localhost:8080/llms.txt
#   http://localhost:8080/llms-full.txt
#   http://localhost:8080/assets/og/animation-rigging.png
```

**GitHub README check:** browse the branch URL on github.com — confirm the README renders without the "Uh oh" banner.

**Pre-publish smoke tests (after deploy):**
- Google Rich Results Test on `/` and `/sections/<slug>/` — expect ItemList + Breadcrumb.
- Twitter Card Validator + Facebook Sharing Debugger on each section URL.
- Lighthouse mobile audit (target ≥ 90 across Performance / Accessibility / Best Practices / SEO).
- Submit updated `sitemap.xml` to Google Search Console after deploy.
- Submit `llms.txt` URL to <https://directory.llmstxt.cloud>.

---

## Known limitations / deferred work

- **Step 12 (defer):** search-index split. `search-index.json` is 814 KB. Cloudflare Brotli + lazy-load on chip click likely makes this irrelevant — revisit only if Cloudflare RUM shows slow mobile cold-start.
- **mdi font subsetting:** not done. 14 distinct icons used in `build-html.js` (section icons, edit pill, back-to-top, 404 cards) plus chip-toggle icons in `filter.js`. Inline-SVG swap would be a meaningful refactor for marginal perf gain after Step 7's non-blocking load. Documented in plan as "follow-up if Lighthouse perf still complains."
- **Pre-existing validate warnings (189):** unrelated to this work — mostly URL dedupe candidates and freeform-tag suggestions in older entries. Won't block CI.
- **`disregard/` and `_maintenance/`:** untouched; out of scope.
- **`graphify-out/`:** stale, not modified.

---

## What's next (non-code — `pub_plan.md` Part 2)

Stubbed in `pub_plan.md`; tackle after this branch ships:

1. GitHub repo "About" + topics + social preview upload.
2. Cut `v1.0.0` release with changelog.
3. Awesome-list PR submissions (~10 candidate awesome-lists already mined under `_maintenance/awesome-mining/`).
4. Reddit drops — r/blender, r/Houdini, r/vfx, r/gamedev, r/3Dmodeling (one per sub, value-first framing).
5. Hacker News "Show HN" — Tue–Thu morning PT.
6. Discord drops in communities already in the catalog (ask mods first).
7. Twitter/X + BlueSky launch thread, tag SideFX/Blender/Foundry/80lvl.
8. Newsletter pitches — BlenderNation, CG Channel, 80.lv, Befores & Afters, Houdini Hive.
9. Product Hunt — only after landing-page polish.
10. SEO follow-up — GSC submission, `/seo-audit`, watch CrUX.

---

## Files modified in this pass (summary)

```
M  scripts/render.js                  # badges, --mode=lite, lite renderer
M  scripts/build-html.js              # last-updated, edit-on-gh, footer, 404, SSR shell, perf, atom link, sitemap rewrite
A  scripts/build-section-pages.js     # NEW
A  scripts/build-og-images.js         # NEW
A  scripts/build-llms-txt.js          # NEW
A  scripts/build-feed.js              # NEW
M  build.sh                           # reordered + new steps
M  assets/css/style.css               # footer, edit-on-gh, back-to-top, 404, breadcrumb, section-nav, SSR shell
M  assets/js/filter.js                # buildUI() removes SSR shell on init
A  assets/og-template.svg             # NEW (OG card template)
R  contributing.md → CONTRIBUTING.md  # rename
A  CODE_OF_CONDUCT.md                 # NEW
A  SECURITY.md                        # NEW
A  .github/ISSUE_TEMPLATE/config.yml          # NEW
A  .github/ISSUE_TEMPLATE/suggest-resource.yml # NEW
A  .github/ISSUE_TEMPLATE/report-broken-link.yml # NEW
A  .github/ISSUE_TEMPLATE/report-bug.yml      # NEW
A  .github/PULL_REQUEST_TEMPLATE.md           # NEW
A  .github/FUNDING.yml                        # NEW (stub)
M  package.json + package-lock.json   # +@resvg/resvg-js
A  pub_plan.md                        # NEW (audit + plan, code in Part 1, non-code stub in Part 2)
A  changes.md                         # THIS FILE
```
