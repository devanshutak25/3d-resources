# project.md — 3d_resources master guide

**Read this at session start. Update it after every change.**

This file is the canonical brief for the repo. It supersedes scattered docs where they conflict. Other authoritative files: `CLAUDE.md` (rules), `CONTEXT.md` (vocab), `docs/adr/*` (architecture decisions), `schema/*` (data contract).

---

## 1. What this project is

`3d_resources` is a curated, lookup-first reference catalog for the 3D / VFX / motion / games / AI-CG industry. It ships as:

- A GitHub repo (`README.md` + `data/` source): 1,020 stars (2026-11-10). Catalog size: **4,984 entries, 106 deprecated** across 12 sections / 150 subsections (2026-11-10). Public copy uses `catalog.publicCountLabel()` ("4,800+" on 2026-11-10), never a hardcoded number.
- A live static site: `https://3d.devanshutak.xyz` (Cloudflare Pages).
- An `llms.txt` + `llms-full.txt` feed for AI crawlers (ChatGPT, Perplexity, Claude).
- An Atom feed (`feed.xml`) + sitemap + per-section indexable pages.
- A studios directory at `/studios/` (animation/VFX/motion/CG/viz/XR studios) and a game studios directory at
  `/game-studios/` (game developers), separate datasets (§4b). Counts: see §11.

It is NOT a tutorial blog, not a news site, not a personal portfolio. It is a fast index for professionals to look up tools, asset sources, channels, books, hardware, services, and learning resources.

## 2. Goals

Primary:
- **Pro reference hub** — lookup-first structure, scannable, no marketing fluff.
- **SEO-friendly** — per-section indexable HTML, real URLs in sitemap, JSON-LD, OG images.
- **Curated quality** — no junk; validated entries; controlled vocabulary.
- **AI-search-friendly** — `llms.txt` so LLMs cite this catalog instead of scraping 1 MB of HTML.

Secondary:
- Awesome-list inclusion (10+ targets, see `handoff/02-awesome-lists.md`).
- Newsletter / Reddit / HN reach via `handoff/*` scripts.

## 3. Filesystem map

```
3d_resources/
├── README.md                  # GENERATED full render (~800 KB). Never hand-edit; render-readme.yml re-renders it on main.
├── CLAUDE.md                  # Project rules for Claude. Read every session.
├── project.md                 # THIS FILE. Read every session, update after every change.
├── CHANGELOG.md               # Dated work log (moved out of §11 on 2026-10-05). Newest first.
├── CONTEXT.md                 # Domain vocabulary (Section, Subsection, Entry, Chunk, Pass).
├── CONTRIBUTING.md            # Contributor guide (chunk-file layout, vocab, style, npm scripts).
├── CODE_OF_CONDUCT.md         # Contributor Covenant v2.1 stub.
├── SECURITY.md                # Security reporting policy.
├── LICENSE                    # CC0-1.0.
├── build.sh                   # Canonical build (see §6). Starts from an empty _site/, ends with a link check.
├── package.json + package-lock.json   # Pinned deps (lockfile tracked; use `npm ci`). npm scripts: validate, test, build.
├── .gitattributes             # * text=auto eol=lf
│
├── data/                      # SOURCE OF TRUTH (ADR-0002). Edit here, never README.md.
│   ├── sections.yml           # Ordered list of 12 sections + featured picks.
│   ├── aliases.yml            # Search aliases (catalog.loadAliases()).
│   ├── awesome-sources.yml    # Awesome-lists credited in the README footer (catalog.loadAwesomeSources()).
│   ├── studios/NN-studios.yml # Studios directory: { studios: [...] }, ≤50 each. NOT catalog entries (see §4b).
│   ├── game-studios/NN-game-studios.yml # Game studios directory, same shape, game schema (§4b).
│   ├── NN-<section>.yml       # Section metadata + subsection list (slug, title, description, chunks). No entries.
│   └── NN-<section>/<sub>/NN-<sub>.yml   # Chunks: { entries: [...] }, ≤50 each (ADR-0001).
│
├── schema/
│   ├── entry.schema.json      # JSON Schema 2020-12 for entries (url must match ^https?://).
│   ├── studio.schema.json     # Studio record schema (closed disciplines/size enums).
│   └── vocab.yml              # Closed enums + curated tech list.
│
├── scripts/
│   ├── lib/
│   │   ├── catalog.js         # Single seam over data/. CHUNK_CAP=50. Also loadAliases, loadAwesomeSources, publicCountLabel.
│   │   ├── html-safe.js       # escText/escAttr/safeJsonLd/isSafeHref/useSafeLinks. All data->HTML goes through these.
│   │   ├── heading-id.js      # Entity-decoding heading id (== render.githubAnchor) used by build-html.
│   │   ├── page-shell.js      # Shared HTML shell for section/subsection/tag pages.
│   │   ├── seo-pages.js       # SEO page enumeration: subsectionPages/tagPages/THIN_THRESHOLD.
│   │   ├── entry-schema.js    # Per-entry schema.org JSON-LD.
│   │   ├── canonical-url.js, quality-score.js, slugify.js, table-labels.js, ingest-core.js, rss.js
│   │   └── *.test.js          # catalog, canonical-url, quality-score, entry-schema, escaping, heading-id, review-regressions.
│   ├── passes/verify-tags.js  # Per-chunk subagent pass.
│   ├── _archive/              # Dead one-shot scripts (tracked, never run). See its README.
│   ├── run-tests.js           # Runs every scripts/lib/*.test.js (npm test).
│   ├── render.js              # data/ -> README.md (full; --mode=lite unwired; --link-mode=pages for /sections/).
│   ├── validate.js            # Schema + vocab + duplicate checks. CI gate.
│   ├── build-studios-page.js  # data/studios/ + data/game-studios/ -> _site/studios/ + _site/game-studios/ (index.html + studios.json each; lib/studios.js: labels, country->region, card ids).
│   ├── build-html.js, build-og-images.js, build-section-pages.js, build-tag-pages.js,
│   │   export-data.js, build-search-index.js, build-graph.js, build-llms-txt.js,
│   │   build-feed.js, build-sitemap.js           # Site build steps (§6).
│   ├── check-built-links.js   # Post-build internal link / anchor / duplicate-id check (exit 1 on failure).
│   ├── check-links.js         # External link scan; browser-UA retry; --only-missing / --status= / --dry-run.
│   ├── recheck-unreachable.js, check-pricing-freshness.js, check-repo-staleness.js, watch-releases.js, freshness-digest.js
│   ├── ingest-80lvl.js, ingest-gumroad.js, ingest-itch.js, ingest-youtube.js
│   ├── import-studios.js      # Research agents' out-*.json -> dedupe/schema/style/live probe -> data/studios + data/game-studios (--dump/--probe/--write).
│   ├── pass.js, auto-tag.js, audit-classification.js, dedupe-entries.js, dedupe-youtube.js,
│   │   quality-scan.js, quarantine-low.js, export-csv.js
│   └── mine-awesome.js, triage-candidates.js     # gitignored local tools
│
├── assets/                    # Copied to _site/ by build-html.js.
│   ├── css/style.css, css/graph.css
│   ├── js/filter.js, js/analytics.js, js/graph.js
│   ├── graph.html             # Standalone graph view template.
│   └── favicon.svg, apple-touch-icon.png, og-image.png/.svg, og-template.svg, cover.af
│
├── docs/
│   ├── adr/0001-data-layout-is-public-interface.md, adr/0002-data-is-source-of-truth.md
│   ├── plan.md, pub_plan.md, changes.md        # Historical plans (moved from root 2026-10-05).
│   ├── plans/2026-09-15-review-fixes.md
│   ├── playbooks/studio-discovery.md   # Region-by-country studio discovery method + agent brief template (reuse per region).
│   └── deployment-issues.md, deployment-issues-resolved-spec.md
│
├── memory/                    # Project memory (CLAUDE.md protocol). archive/ holds entries up to 2026-09-30.
├── .github/
│   ├── workflows/validate.yml       # PR + push: npm ci, npm test, validate, full build.sh (incl. link check).
│   ├── workflows/render-readme.yml  # main: re-render README.md after data/schema/render changes, bot commit.
│   ├── workflows/link-check.yml     # 1st of month 06:00 UTC: check-links, commit status, open issue.
│   ├── workflows/release-watch.yml  # 1st of month 07:00 UTC: watched releases, commit state, issue.
│   ├── workflows/freshness.yml      # 1st of month 08:00 UTC: staleness/pricing/ingest, PR + digest issue.
│   ├── ISSUE_TEMPLATE/ (suggest-resource, report-broken-link, report-bug, config), PULL_REQUEST_TEMPLATE.md
│
├── _site/                     # GENERATED, gitignored. Cloudflare Pages serves it.
├── _maintenance/              # Gitignored except release-state.json. Link-check reports, awesome-mining cache.
└── disregard/, run-logs/, handoff/, press/, graphify-out/, node_modules/   # Gitignored, local only.
```

## 4. Data model

### Nouns (from CONTEXT.md)

- **Section** — top-level category. 12 total, ordered by `data/sections.yml`. One file `data/NN-<slug>.yml`. Renders as H2.
- **Subsection** — grouping inside a Section. Has `slug`, `title`, `description`. Renders as H3. Lives only in the Section file metadata.
- **Entry** — a single resource. Conforms to `schema/entry.schema.json`.
- **Chunk** — file holding ≤50 Entries for one Subsection. Path: `data/<section>/<sub>/NN-<sub>.yml`. Insertion-ordered, append-friendly. Storage unit only.
- **Pass** — per-Chunk in-place edit by an LLM subagent. Driver: `scripts/pass.js` + `scripts/passes/<task>.js`. Branch-per-pass, per-Chunk commit, draft PR. Task names must match `[\w-]+` (no paths); `pass.js` shells out via `execFileSync('git', [...])` only, never a shell string.
- **Catalog** — `scripts/lib/catalog.js`. The only way scripts touch `data/`. No script reads `data/` paths directly.

### Entry shape

Required: `name`, `url`, `description` (≤300 chars), `added_at` (ISO 8601 date-time).

`added_at` is the persistent catalog addition time. Preserve it through URL corrections, moves and content edits. `catalog.appendEntry()` stamps new entries automatically. Existing entries were backfilled on 2026-09-15 using their earliest recorded URL or exact-name appearance in Git history; dates before the initial data import cannot be recovered.

Optional fields: `pricing`, `best_for`, `license`, `entry_type`, `tags{workflow,output,platform,skill,tech}`, `readme_tags` (≤2), `notes`, `dual_listed_in`, `priority`, `year`, `deprecated`, `version_sensitive`, `pricing_last_verified`, `url_last_verified`, `url_status`, `review_cadence`, `host_compat`, `stale`, `archived`, `last_pushed`.

### Controlled vocabularies (schema/vocab.yml)

- `license` (closed): `Open Source`, `Free`, `Free NC`, `Freemium`, `Paid`, `Mixed`, `null`.
- `entry_type` (closed, 14 values): `software`, `asset-source`, `marketplace`, `tool`, `plugin`, `tutorial`, `channel`, `community`, `reference`, `inspiration`, `service`, `book`, `hardware`, `paper`.
- `tags.workflow` (closed, 27 values): production stages `concept`→`creative-coding`.
- `tags.output` (closed, 15 values): end media `games`/`film-vfx`/`archviz`/`product-viz`/`motion-graphics`/`xr`/`scientific-viz`/`medical`/`jewelry`/`fashion`/`automotive`/`event-experiential`/`generalist`/`broadcast`/`illustration`.
- `tags.platform` (closed, 9 values): `win`, `mac`, `linux`, `web`, `ios`, `ipad`, `android`, `cloud`, `vr`.
- `tags.skill` (closed, 3 values): `beginner`, `intermediate`, `advanced`.
- `tags.tech` (open but curated): `pbr`, `cc0`, `node-based`, `procedural`, `usd`, `gpu`, `real-time`, `offline`, `ray-tracing`, `path-tracing`, `raster`, `photogrammetry`, `gaussian-splatting`, `nerf`, `ai-generative`, `physics`, `subscription`, `perpetual`, `houdini-addon`, `blender-addon`, `unreal-plugin`, `unity-plugin`, `cloud-render`, `mcp`, `glb`, `webgpu` (last three added 2026-11-03), etc.

### dual_listed_in mirror system

Entries appear once canonically + mirror into N other subsections via `dual_listed_in: ["<section-slug>/<sub-slug>", ...]`. Render layer handles mirroring. Validator rejects mirror paths that don't match a real subsection.

### Auto-updated fields

`url_status`, `url_last_verified` — `check-links.js`.

Link scans never change `deprecated`: that is an editorial decision. HTTP 5xx/408/425 responses are transient (`unreachable`); followed successful redirects are reported as `redirect`.
`pricing_last_verified` — `check-pricing-freshness.js`.
`stale`, `archived`, `last_pushed` — `check-repo-staleness.js`.

## 4b. Studio directories (`/studios/` + `/game-studios/`)

Separate datasets, not catalog entries (decision 2026-10-31: studios aren't resources and span disciplines).
Two directories since 2026-11-03: `/studios/` = production studios (animation, VFX, motion, CG, viz, XR,
outsourcing, cinematics), `/game-studios/` = game developers. A URL may live in only one (validate.js errors).
- Files: `data/studios/NN-studios.yml` and `data/game-studios/NN-game-studios.yml` (`{ studios: [...] }`, ≤50 each).
  Read/write via `catalog.loadStudios(kind)` / `loadStudioChunks(kind)` / `appendStudio(s, kind)` /
  `saveStudioChunk(file, list, kind)`, kind = `'studios'` (default) or `'game-studios'` (`catalog.STUDIO_KINDS`).
- **Game studios** (`schema/game-studio.schema.json`): same fields minus `disciplines`/`markets`, plus
  `segments` (required, 1-3, closed: `aaa`, `aa`, `indie`, `mobile`, `co-dev`, `vr`, `ugc`, `kids-edu`, `simulation`; last two added 2026-11-05), `platforms`
  (closed: `pc`, `console`, `mobile`, `vr`, `web`), `parent` (owner, string). `notable` = shipped games.
  Labels `SEGMENTS`/`PLATFORMS` in `scripts/lib/studios.js`; segment pills use `.d-<segment>` colors (keys must
  not collide with disciplines, test checks). Card rows: Platforms, Part of, Games. Extra group-by: Parent company.
  Inclusion: active developer with 1+ released commercial game or 10+ staff; no gambling/crypto/asset flips.
- Split rule (user, 2026-11-03): game-first studios -> `/game-studios/`; studios whose main business is art,
  animation or cinematics for games (Virtuos, Room 8, Steamroller, Tiltnek) stay in `/studios/` with
  `outsourcing`/`cinematics` + market `games`. The `games` discipline was removed from the studio enum.
- Required: `name`, `url`, `description` (≤200), `hq{city?,country}`, `disciplines[]`, `added_at`.
  `description` is not shown on cards (decision 2026-10-31); it feeds search and llms-full.txt.
  Optional: `offices[]`, `markets[]`, `size`, `founded`, `careers`,
  `reel`, `notable[]` (≤4), `social{instagram,linkedin,vimeo,youtube,x,behance,artstation}`,
  `url_status`, `url_last_verified`, `notes`.
- `disciplines` (closed, 20): `2d-animation`, `3d-animation` (split from `animation` 2026-10-31), `stop-motion`,
  `vfx`, `motion-design`, `cg`, `archviz`, `product-viz`, `cinematics`, `virtual-production`, `previs`,
  `xr`, `experiential`, `title-design`, `live-action`, `outsourcing`, `mocap`, + `interactive` (WebGL / 3D web /
  configurators / interactive installs), `ai-production` (gen-AI-first film/ad studios), `scanning` (photogrammetry,
  4D, volumetric) added 2026-11-05. `xr` label is now "XR (AR / VR)"; it used to read "XR / interactive". Labels + chip order in
  `scripts/lib/studios.js` (grouped by hue family); colors are `.d-<key>` `--dc` rules in style.css.
- `markets` (closed, 8, card label "Works for"): `film`, `episodic`, `advertising`, `music-video`, `games`, `brand`,
  `real-estate` (every `archviz` studio carries it), `medical-science` (pharma, med-device, science, forensic/legal).
- `size` (closed, LinkedIn "Company size" ranges): `boutique` 1-10, `small` 11-50, `mid` 51-200, `large` 201+.
  Source = LinkedIn range, never the associated-members count. Old ≤20/21-150/150+ values were dropped except `large`.
- studios.test.js asserts schema == labels for disciplines, markets, sizes, segments, platforms. Same no-invent rule as catalog enums.
- `country` must be in `COUNTRY_REGION` (`scripts/lib/studios.js`), closed so the filter never splits
  "UK"/"United Kingdom". Adding a country there is fine (it is a lookup table, not a taxonomy).
- validate.js: schema, unknown country, chunk cap, duplicate url (error), duplicate name (warning),
  em-dash/banned words in description (error).
- check-links.js scans both studio directories with catalog entries (monthly).
- Discovery method: `docs/playbooks/studio-discovery.md` (country agents + `scripts/import-studios.js`). Europe done
  2026-11-09 (round 6), Asia-Pacific done 2026-11-09 (round 7), South America + Africa done 2026-11-09 (round 8),
  North America + Central America + Caribbean and a Europe second pass done 2026-11-09 (round 9);
  next region: Middle East (Gulf, Levant, Israel, Iran). The US long tail is still large (gamedevmap CSV, §11).
- City names are plain ("Los Angeles", not "Los Angeles, CA"); US state suffixes were stripped on 2026-11-09 (249 values).
- Active studios only. Locations must be verified on the studio's own site or LinkedIn/press. The School of
  Motion ebook scrambles many locations (it put Blur Studio in Istanbul), so its HQs were never trusted alone.

## 5. Data flow

```
data/sections.yml          ─┐
data/NN-<section>.yml      ─┤  Catalog (scripts/lib/catalog.js)
data/<section>/<sub>/*.yml ─┘
                              │
                              ▼
                          render.js  ──►  README.md  (lite mode by build.sh)
                                              │
                                              ▼
                                       build-html.js  ──►  _site/index.html
                                       build-section-pages.js ──► _site/sections/<slug>/
                                       export-data.js ──► _site/data.json
                                       build-search-index.js ──► _site/search-index.json
                                       build-llms-txt.js ──► _site/llms.txt + llms-full.txt
                                       build-feed.js ──► _site/feed.xml
                                       build-og-images.js ──► _site/assets/og/<slug>.png
                                       build-graph.js ──► _site/graph.json
```

`data/` is the only writable source of catalog content (ADR-0002). README.md and `_site/` are derived.

## 6. Build pipeline (build.sh)

Full run ~12 s (was ~4 min before the 2026-10-05 render index). Order:

1. `npm ci`, then `rm -rf _site` (no stale pages for removed subsections/tags).
2. `render.js` -> full `README.md` (input for build-html).
3. `build-html.js` -> `_site/index.html`, 404, robots, assets copy.
4. `build-og-images.js` -> per-section 1200x630 PNGs (section pages fall back to og-image.png if missing).
5. `build-section-pages.js` -> `/sections/` hub + 12 section + 150 subsection pages (thin ones noindex). Renders in-process with link mode `pages`.
6. `export-data.js` -> `_site/data.json` (one row per subsection+url).
7. `build-tag-pages.js` -> `/tags/` hub + per-tag pages.
7b. `build-studios-page.js` -> `/studios/` and `/game-studios/` (first 48 cards server-rendered) + `<dir>/studios.json` (every card as
    pre-rendered HTML + filter fields). `assets/js/studios.js` fetches the JSON, filters, groups, and renders 48 more
    per scroll (IntersectionObserver). One card template (server side), escaping stays in html-safe.
8. MiniSearch UMD copy + `build-search-index.js`.
9. `build-graph.js` + `graph.html` copy.
10. `build-llms-txt.js` -> llms.txt + llms-full.txt.
11. `build-feed.js` -> Atom feed.
12. `build-sitemap.js` (sole sitemap writer; indexable pages that exist on disk).
13. `check-built-links.js` (fails the build on a missing target, broken fragment or duplicate id).

**README stays in FULL mode.** `render.js --mode=lite` exists but is unwired (open decision, §11). render.js
must not read anything gitignored: CI renders from a clean checkout and render-readme.yml commits the result.

## 7. CI

- **validate.yml** (push + PR on data/schema/scripts/assets/build.sh/package files): `npm ci`, `npm test`
  (all `scripts/lib/*.test.js`), `node scripts/validate.js`, full `bash build.sh`. README staleness is only a
  notice. First-time contributors' PR runs need maintainer approval (`action_required`).
- **render-readme.yml** (push to main touching data/schema/render/lib): validate, re-render README, bot commit.
- **link-check.yml / release-watch.yml / freshness.yml**: monthly maintenance (see §3). Bots `pull --rebase`
  then push; failures are no longer swallowed.
- Actions pinned to current majors (checkout v7, setup-node v7, create-pull-request v8,
  create-issue-from-file v6), Node 22, npm cache.
- Any closed-enum violation exits 1 and blocks merge.

## 8. Rules and absolute NOs

### Hard NOs

- **NO em-dashes (`—`) in user-facing text.** Use `: ` in titles, `. ` in prose. Em-dashes are the canonical AI tell. The OG-image splitter keys on `: ` for two-line layout.
- **NO AI tells.** Banned: `comprehensive`, `robust`, `powerful`, `seamless(ly)`, `leverage(s/d)`, `utilize(s/d/ing)`, `cutting-edge`, `state-of-the-art`, `the ultimate`, `game-changing`, `unleash`. Banned trailing phrases: `and more`, `and beyond`, `and so much more`.
- **NO marketing adjective stacks** ("fast, free, and powerful"). One concrete attribute beats three vague ones.
- **NO inventing closed-enum values.** Never silently add to `vocab.yml` / `entry.schema.json`. Map to closest existing value or ask user.
- **NO hand-editing `README.md` or `_site/`.** Both are generated. Edit `data/` only (ADR-0002).
- **NO scripts reading `data/` directly.** All access via `scripts/lib/catalog.js` (ADR-0001).
- **NO commit without passing `node scripts/validate.js`.**
- **NO raw data in HTML.** Entry fields are untrusted (contributor PRs). Escape via `scripts/lib/html-safe.js` (`escText`/`escAttr`), serialise JSON-LD with `safeJsonLd`, and every `marked` instance must call `useSafeLinks`. Schema requires `url` to match `^https?://`.
- **NO `prefers-reduced-motion` gating** on site animations. Animations always run.
- **NO chunk files >50 entries.** Append to last non-full chunk; create new file when full.
- **NO Section metadata in Chunk files, NO entries in Section files.** Strict separation.

### Required

- Writing style: caveman lite for descriptions. Terse, factual, 1 sentence preferred.
- All dates in memory/decision logs use `YYYY-MM-DD`.
- After any data edit: run `node scripts/validate.js` and confirm `✓ Validation passed.` before commit.
- Internal docs (`CLAUDE.md`, `memory/*`, `docs/adr/*`, code comments) are exempt from no-em-dash rule.

### User collab preferences

- Communication: caveman lite mode (tight, no filler, no hedging).
- Closed-enum vocab: never invent new values without asking.

## 8b. Analytics (Mixpanel)

Single source: `assets/js/analytics.js`. Loaded `<script defer>` by `build-html.js` (index) and `scripts/lib/page-shell.js` (all generated section/subsection/tag/hub pages) — 287 pages total. Mixpanel init is deferred to `requestIdleCallback` so it never competes with first paint (pub_plan §1.4); do not move it inline or un-defer it.

**Page context:** `<body data-page-type=… data-section=… data-subsection=… data-tag-group=… data-tag-value=…>`, emitted by `analyticsAttrs()` in `page-shell.js` from the `analyticsContext` param. `page_type` ∈ `catalog | section | subsection | tag | sections-hub | tags-hub | studios | game-studios`. Studio pages emit `search` and `filter_apply` with `group: studio_d | studio_m | studio_size | studio_loc | studio_careers | studio_group` (group-by changes). Any new `pageShell()` call site MUST pass `analyticsContext` or its events land as `page_type: unknown`.

**Rule:** page context is merged per-event, never `mixpanel.register()` — super properties persist in a cookie and leak the previous page's section onto the next.

**Events:**
- `outbound_click` — url, host, link_text, `link_kind` (`entry` | `chrome`; chrome = header/footer/nav links so the GitHub/author links stay out of the entry funnel). On index.html only, also entry_name / entry_type / license / entry_section / entry_subsection, read from `data-*` that `filter.js` puts on each row.
- `search` — query, query_length, result_count, `zero_results`, facet_*. Fires on a **separate 1000 ms settle timer**, NOT the 80-180 ms input debounce (that one is tuned for responsive filtering; firing on it = one event per keystroke). Deduped by last query; only fires from the input handler, so hash-restore never emits a fake search. Zero-result queries are the catalog's missing-content list.
- `filter_apply` — group, value, action (add/remove), result_count, has_query, facet_*.
- `filter_clear` — snapshot of what was discarded; suppressed when nothing was active.

Facet groups are separate **list** properties (`facet_license: ['Free']`), not one nested object, so Mixpanel can filter "license contains Free". Counts come from `lastVisibleCount`, set inside `applyFilters()` — the single funnel all search/chip changes flow through.

**API:** `window.track3d(event, props)`. Queues (cap 50) until Mixpanel loads, flushes on init, sends via `sendBeacon`, wrapped in try/catch. Callers must guard `typeof window.track3d === 'function'` (analytics.js may be adblocked).

**Open:** `record_sessions_percent: 100` — full session recording on every visitor; fine at current traffic, needs sampling before a launch spike (quota). Not instrumented: graph view, TOC jumps. Not verified in a real browser (no jsdom/puppeteer in repo; would be the first devDependency).

## 9. Design style (site)

- Dark mode by default. Cards with hover lift.
- Site header is short (`only:site` block in `render.js` header): H1 "3D Resources", one-line tagline, quiet meta line (curator, Suggest, Contribute, graph). The long intro + warning callout are README-only.
- Filter bar above sections, server-rendered shell + JS hydration (`assets/js/filter.js`). Facets: Type, Category, License, Level; OS / Workflow / Output behind a "More filters" disclosure; "Include entries with no recorded value" checkbox. **Strict matching:** an entry with no license/tag for an active group is excluded unless that box is on. Desktop: panel open, chip groups behind `#filter-groups-toggle`. Mobile (≤768px): search stays inline; the Filters button opens `#filter-panel` as a managed dialog (inert background, focus trap, Close, "Show N resources", Escape closes it first).
- **URL state lives in the query string** (`/?q=…&license=Free&unspecified=1`); the fragment is only for items/sections. Legacy `#q=` links restore once and are rewritten. Section/tag pages carry a `/?q=` search form.
- Results mode: while a query or facet is active, `body.results-mode` hides Contents + the mobile section selector; sections, subsections and rows reorder by best score; count shows unique resources. Active filters appear as removable pills; empty state offers buttons that each perform one exact change with its resulting count.
- Headings stay `<h2>/<h3>`; a `<button class="heading-toggle">` inside carries `aria-expanded`. Arrow-key nav only acts when focus is already on a heading toggle or row. Enter on a row opens the resource. Rows get a client-side type pill + hover "report" link (prefilled issue form).
- License pills: Paid / Free tier / Mixed / "Free, non-commercial" / "License unspecified" (the last only on software, tool, plugin, asset-source, marketplace, service, book, hardware). Free and Open source get no pill. Tables say "Unspecified"; prices carry `title="Pricing checked …"`.
- Mobile tables stack into labelled cards via `data-label` (`scripts/lib/table-labels.js`); root font stays 16px on phones. TOC clicks preserve active search + filters (do not clear).
- Per-section OG images with `: ` two-line layout.
- `/studios/`: text cards in an auto-fill grid: name, HQ, color-coded discipline pills, size + "Est. YYYY (N yrs)" (age at build year), Works for, Notable, Also in (3 cities + "+N", full list in `title`), footer with Site/Careers/Reel text links + social icon links (MDI; Behance "Bē" and X are text marks). No description line, no logos. Filters: search (magnifier icon), Discipline chips, then Works for + People (size) chips sharing one row, tinted active chips, Location select, Group by (None / Region / Country / Size / Age, by HQ, decades oldest first), careers checkbox. Lazy: 48 cards per batch. Filter form is `hidden` until studios.json loads; no-JS visitors get the first 48 + a link to the data on GitHub. `#s-<slug>` deep links render through to the card. Mobile chip rows scroll sideways with a right-edge fade; grid is auto-fill minmax(min(280px,100%)) so tablets get 2 columns.
- `/game-studios/`: same page template and JS. Segment pills (AAA/AA/Indie/Mobile/Co-dev/VR/UGC), rows Platforms / Part of / Games; filters Segment chips, Platforms + People chips, Location, Group by adds Parent company. /studios/ and /game-studios/ link to each other (intro line + bottom nav); site header + README meta line link both.
- Material Design Icons via CDN (subset).
- Back-to-top button (visible after 600 px scroll).
- "Edit on GitHub" pill in each section H2.
- WebGL 3D graph view (`graph.html`) with mobile collapsible legend (bottom-sheet FAB on ≤720px). Starts with sections + subsections only; "All resources" toggle adds every entry. Click selects and shows details; the only external open is the "Open resource" link in the details card. Search ranks exact > prefix > substring, caps at 30 with a "Showing 30 of N" note + catalog link. Onboarding is a real modal (inert + focus loop). CDN import failure or a 12 s timeout shows Retry + "Browse the list instead".

## 10. Memory protocol (mandatory)

**Session start:** Read `project.md`, `CLAUDE.md`, and all 8 files in `./memory/` before responding to first prompt. `memory/archive/` holds history up to 2026-09-30; read only when needed.

**After every user prompt:**
1. Append the verbatim prompt to `memory/user-prompts.md` with timestamp + 1-line summary.
2. Update any other memory file whose content changed.
3. Update `project.md` if any rule, file structure, or goal changed.

**Session end:** Final sweep — ensure all files reflect latest state.

## 11. Open items

Dated history lives in `CHANGELOG.md` (newest first). Keep this list short: add when something is
left open, remove when done.

**Needs the user (GitHub settings / decisions):**
- Settings -> Actions -> General -> "Allow GitHub Actions to create and approve pull requests": the
  the 2026-10-01 and 2026-11-01 freshness runs both pushed a branch but could not open the PR. On 2026-11-06 the
  November branch (a full re-scan, so it supersedes October) was merged by hand and both branches were deleted.
  Until the setting is on, each monthly run leaves a `maintenance/freshness-YYYY-MM` branch to merge by hand.
- Disable the legacy GitHub Pages build (Settings -> Pages). It publishes the whole repo, including
  `memory/`, to devanshutak25.github.io on every push; Cloudflare Pages is the real host.
- Optional: branch protection on `main` (bots push directly: link-check, release-watch, render-readme).
- README lite mode (`render.js --mode=lite`) exists but is unwired; keep FULL or switch.
- Launch track (pub_plan Part 2): GitHub social preview, awesome-list PRs, Reddit/HN/Discord/X,
  newsletters, Product Hunt, GSC submission, sending the press outreach in `press/`.

**Catalog (next monthly link run):**
- Still unreachable: Houdini Python Startup Scripts (522), Periodic Table of Motion, Needle USD
  Converter (cert expired), Vu Studios (502), Ponzu. Siemens NX redirects to a generic Siemens CAD page.
- Pricing mismatches noted but not changed (vendor pages blocked or unclear): Gaussian Splatting for
  Nuke (irrealix, stored $46 vs ~$49), Scantic, Zoo Tools Pro, Beeble tiers, Character DNA.
- Ameede file provenance unverified (user accepted the flag, 2026-09-15).
- Motion Design School Discord entry shares the school's site URL (user: leave as-is, 2026-06-16).
- 2026-11-03 discovery batch (+367 entries, +188 studios) was verified by the finding agents only; the next
  monthly link run is its first independent check. Fab, aescripts, Shadertoy, Printables, Pond5 block bots (unverified, not added).
- 2026-11-10 awesome-list re-mine (+219, see CHANGELOG): agent-verified only. 27 aescripts rows backed by Wayback
  snapshots only (live pages 403) were imported then removed at the user's request. 17 hint-only rows held, not added (GEOlayers 3, RenderGarden, Composite Brush, BAO Bones,
  Pixel Sorter 4, Fractal Noise 3D, Valve networking wiki x2, Khronos GLSL wiki, Openverse, WOLF RPG Editor, Peter Quint
  + Rohan Dalvi Vimeo, TRIBES + MDA PDFs, UE C++ API reference, procedural-generation.tumblr.com).
- Misfile cleanup flagged by the re-mine agents, not done: `youtube-houdini` holds non-Houdini channels (Inigo Quilez,
  REAC, Codegram, ChromeDevs); channel rows named after one video (youtube-houdini, youtube-blender, Rive);
  `paid-tutorial-platforms` holds free items; `game-design-theory` and `plugin-marketplaces` act as catch-alls;
  `VFX Apprentice (Allan McKay)` name/URL mismatch; Quaternius listed twice; `Asis FX` typo (AxisFX); Graswald URL
  stale; Rubberhose 2 in inspiration; splat tools split between `photogrammetry-scanning` and `gaussian-splatting-nerf`.
- §07 workflow coverage is 27% by design: gameplay code, networking, UI and similar have no workflow value.
- 2026-11-09 news batch (+548, see CHANGELOG): agent-verified + main-session probe only. ~21 software/tool rows have
  no licence (not stated on page); several AI model `pricing` strings carry custom weights-licence limits; YouTube
  channel descriptions partly from About text. Gaps agents could not fetch (bot walls): 3Dconnexion SpaceMouse, Neat
  Video, AMD Radeon PRO, Steam Frame, aescripts/Toolfarm tools, Pond5/Artgrid. Quixel Bridge URL now redirects to
  quixel.com (deprecate if confirmed). Possible dead: Unreal Marketplace product pages (Medieval Houses, Japanese
  Village) in §07. Houdini FX/simulations still 2 entries.

**Studio directories (built 2026-10-31, split 2026-11-03, see §4b + CHANGELOG):**
- `/studios/` 4,043 (108 countries) and `/game-studios/` 4,202 (106 countries) on 2026-11-09, after round 9
  (North America + Europe second pass, +413 / +490). Round 8 (South America + Africa) stood at 3,630 / 3,712, round 7
  (Asia-Pacific) at 3,436 / 3,587, round 6 (Europe) at 3,075 / 3,238. Disciplines: archviz 461, product viz 238,
  interactive 251, VP 123, mocap 79, AI production 66, scanning 38, previs 29; games: simulation 166, kids-edu 114, UGC 50,
  VR 116. Japan 289 / 314, India 199 / 98, Australia 122 / 119, Korea 59 / 112, China 43 / 93.
- Round 9 (2026-11-09, North America + Central America + Caribbean, Europe second pass): 14 agents, both directories.
  Agent + main-session probe only; 155 of 903 rows are country-only HQ, none have `size`, 425 medium + 9 low confidence.
  United States 567 / 447, Canada 176 / 229, Mexico 47 / 35, UK 365 / 323, Germany 176 / 222, France 177 / 174. First rows
  for Jamaica, El Salvador, Honduras, Trinidad and Tobago, Montenegro, Albania. The US long tail is far from done:
  gamedevmap.com's CSV (`/cmsdata/gamedevmapdata.csv`) still holds ~1,000 unlisted US-west and ~500 Canadian names
  (agents took the first ~80 each). US production stayed thin (Reel-Scout state directories, Clutch, ProductionHub,
  AdForum bot-walled; New Mexico directory needs a token). Leads left out: Cyber Group Studios + Machine Molle (TLS
  handshake fails), Method Animation (DNS), TeamTO ("Coming Soon" page), Float4 (HTTP 500), Deck Nine (unreachable,
  placeholder in round 5), Craneballs/Polyslash/Cherrypick (DNS), Puppetworks (resolves now, unverified), Brass Lion
  Entertainment + Hidden Variable (orphan URLs from the shift fix below), Kuju (redirects to Curve Games), Dual Effect.
  Dropped: Punch Punk Games (casino link), PUNCHev (online casino design line), Ydraw (casino spam injected). WayForward
  added with a `notes:` line (site refuses scripted TLS; HQ from Wikipedia). Soda Den (rootsofpacha.com, US) merged into
  the round 8 Argentina row.
- Fixed 2026-11-09: 15 game-studio rows from the 2026-11-02 import (14-game-studios.yml Storm8 to 15-game-studios.yml
  Magic Tavern) had url + careers shifted one row down (Stoic pointed at newworldinteractive.com). Neighbour-match scan
  found no other shifted block in either directory.
- Round 8 (2026-11-09, South America + Africa): 12 agents, both directories. Agent + main-session probe only; 100 of 319
  rows are country-only HQ, none have `size`, ~180 medium + 15 low confidence. Brazil 121 / 154, Argentina 60 / 38, Colombia
  40 / 20, Chile 35 / 21, South Africa 48 / 24, Nigeria 23 / 11. Thin after round 8: Egypt 13 / 10 (agent found 4; QLever 429
  all run, Clutch/Sortlist/LinkedIn 403), Peru 10 / 7, Ecuador, Bolivia, Venezuela, Paraguay, Guianas 0-3, Francophone and
  Central Africa 0-4 per country, Sudan/Libya/Mauritania/Somalia 0 (most African studios have only a Facebook page or no
  site). Not mined: VG Chile (timeout), ABRANIMA (domain dead), Comisión Fílmica Colombia company directory (page nonce),
  Clutch/TechBehemoths/Sortlist/DesignRush/VC4A (bot walls). Leads left out: Dual Effect (Chile, Tormented Souls; Steam
  `/developer/` redirects to a search URL, no own site), Casablanca FX + SuperToons (Brazil, TLS fails in curl too), Morrón
  Estudio (Cloudflare challenge), Lunanim (Mauritius, bot wall), Ivalice Studio (Morocco, game unreleased), Chroma Pixel
  Games (Zambia, NFT section), Studio Amanirenas + ARUKA Studio (YouTube/Facebook only).
- Round 7 (2026-11-09, Asia-Pacific): 13 agents, both directories. Agent + main-session probe only; 112 of 712 rows are
  country-only HQ, none have `size`, 305 medium + 4 low confidence. Thin after round 7: Korea production 59 (bot walls),
  China (most .cn sites refuse non-CN fetches; 5 indie rows use a Steam `/developer/` page as `url`), Thailand 14/14,
  Philippines 16/10, Sri Lanka/Nepal/Cambodia/Myanmar/Mongolia under 6, Pacific islands 0, Macau 0 (4DMacau site 404).
  Not mined: TAICCA, Cyberport, HKDEA, GDAP, Screen Australia, AGDA, Reel-Scout (bot walls), AINAKI API (rejects),
  HATCH/PGDX (API key in JS bundle: not extracted, on purpose), VFX-JAPAN (coming-soon page), abai.in (casino-hijacked),
  filmnz.com (self-signed), .my sites resolving to 0.0.0.0 locally (Les' Copaque, Digital Durian, Silver Ant, Circle
  Studio, Brainy Bones unverified). Leads left out: Enixo, Astrode, YesGnome, Tusharth (India games, fell between the two
  India agents), Hoop VFX (HQ unclear), 6 China devs with only a Steam search URL, Debuz (Web3 pivot), Vermillion (522).
- Existing rows flagged in round 7, still open: REVOROOT no city (Wikidata: Yamato, site unreachable), Morph Studios
  (202 bot challenge), Indocgi (unreachable), Kurechii city (Puchong per gamedevmap only), Century Games HQ China vs
  Singapore (unverified), Mad Mantra Games city (Pune per Tracxn only), PUBG Studios (url is a page on krafton.com, listed
  KRAFTON has the same host), Framenote Studio (Behance) + Studio Blink (Instagram) have no own site (Goppo's Linktree was
  a user add).
- Goal is every studio worldwide. Still thin: previs 23 (Previs Society site down, PLF/NVIZ/Nvizage dead), digital fashion 0
  (The Fabricant, DRESSX are software now), Live2D/VTuber rigging 3 (no Live2D discipline, tagged `2d-animation`),
  Gulf archviz (Saudi/Qatar 0; round 5 found only Bahrain 1, Dubai 1). Countries under 20 (by HQ): 55 in /studios/, 58 in /game-studios/ (many are 1-2 row countries added
  2026-11-06; small markets like Malta, Iceland, Bosnia, Moldova may never reach 20). 0 rows: Montenegro, Albania (round 6
  found nothing verifiable in Albania, Montenegro, North Macedonia, Kosovo).
- Round 6 (2026-11-09, Europe): 14 country agents, both directories. Agent + main-session probe only; 167 of 935 rows are
  country-only HQ, none have `size`, ~40% medium confidence (active on association membership or a recent grant).
  Thin after round 6: Hungary games 10, Portugal games 14, Ireland games 14, Bulgaria games 14, Latvia 8/8, Greece, Slovenia,
  Moldova/Belarus 0 new. Not mined: gamesmap.uk (login), TIGA shortlist (JS), HGDA (no list), Slovak Film Commission +
  APAF + BGDA (unreachable/JS), Clutch (IP block). Leads left out: BlueTwelve (placeholder site), PortaPlay + Logic Artists
  (cert errors), Kuju, Lo-Fi, Hunted Cow (403), LIGHT VFX, iGene, beloFX (HQ unclear). Nebula Studios HQ Lisbon vs Faro
  (Portugal Film Commission PDF) unresolved: site is JS-only. Next: rest of world by country (Americas, MEA).
- Round 4 (+313 / +204), gap fill (2026-11-05) and country fill (2026-11-06) rows were verified by agents + a main-session
  HTTP probe only. The two runs overlapped on 134 studios; round 4 rows were kept and gained the new enum values.
  Weak spots: ~30 round-4 + ~240 gap/country-fill rows are country-only HQ; none of the new rows have `size` (LinkedIn
  blocked); `notable`/`founded` partly from Wikidata or agent knowledge. Leads not added: CEE Animation directory
  (ceeanimation.eu, 353 studios), WayForward + 1047 Games (TLS refuse scripted fetches), VIXI (Tokyo, live-action, no CG
  evidence), flightgraf (JS-only site). Round 4 rows were not re-tagged for `interactive`/`scanning`/`ai-production`/
  `medical-science`/`kids-edu`/`simulation` beyond the name lists (archviz rows did get `real-estate`).
- Round 5 (2026-11-06): leads from festival/award/conference credits (FMX company JSON, AEAF, Cartoon Forum/Movie,
  Quirino, Annies, ADFEST, El Ojo, British Arrows, Venice Immersive, 1minute Projection Mapping, Auggies, CGarchitect
  3D Awards, International Property Awards, IGF/DICE, Deutscher Computerspielpreis, BIG Festival API, AGDA, Taipei
  Game Show, XDS, MCV/DEVELOP, Golden Trailer). Agent + main-session probe only; 78 of 471 rows are country-only HQ,
  none have `size`. Not mined (JS-only, login or bot wall): CICLOPE galleries, AICP, Clio, Promax, Thea Awards, AMI,
  Telly, Cityscape, Architizer, MIPIM, gameindustry.ph (SEA Game Awards), Amsterdam Light/GLOW/Lumiere; older BIG
  Festival years (classifier stopped API paging). Leads left out (HQ or site unverified): beloFX, 1920 (London VFX),
  Nash VFX, Mavericks VFX, WolfEye, Deck Nine (placeholder site), Slow Bros (.com parked), Shedworks, BlueTwelve.
- Check status: The Mill and Mikros Animation (both hit by the Technicolor collapse, Feb 2025) still read `url_status: ok`.
- Game studios: segments are rough. Rows default to `indie` without a headcount (indie 2,208 of 3,587), so
  mid-size studios are under-tiered; long-tail `notable` + socials come from Wikidata. 45 migrated rows had
  LOW-confidence segment fixes (no live source). Size only 267/4,202. 84 Russia-HQ Wikidata studios skipped
  (Russia not in COUNTRY_REGION; ask before adding). ~50 East Asia/Europe rows carry `notes:` for geo-blocked or
  Cloudflare sites. Gambling/casino, pachinko, adult VN and crypto studios excluded.
- 31 motion-niche studios (2026-11-03) were picked by an agent without network: sites live-checked by curl + title,
  but HQ/description not from site text (`notes:` says so).
- `/studios/` founded 1,649/4,043, size 692/4,043 (2026-11-09, round 9). The 2026-11-03 agents could not read LinkedIn, so most new rows lack size. The 2026-10-31 enrichment hit the session WebSearch cap (200, refills
  ~100/h) early; most rows were filled from LinkedIn/Wikipedia/site fetches. Second pass on rows without
  founded/size when search is available. LinkedIn size bands are self-reported and sometimes stale
  (Pentagram mid, Steelworks boutique); rule is still "use the band".
- Skipped for now, add by hand if a working URL turns up: 88 Pictures (domain for sale), Les' Copaque, Ánima Estudios (restructuring). Older skips: Sila Sveta,
  Beauty and the Bit, Frogwares.
- ~200 studios carry agent provenance in `notes:` (size from team page, city from Guild list, 403 sites).
- studios.json 736/661 KB gz (2026-11-09, round 9; was 670/589). Both directories are past 4,000 (4,043 / 4,202):
  decide on splitting the JSON (per region or per batch) before the next round.
- Not verified on a real phone (headless Chrome floors the viewport at 504 px).

**Site / UX:**
- UX deferrals: UX-03 desktop category sidebar, UX-04 host-software facet, UX-39 performance budget.
  UX-25 (`prefers-reduced-motion`) blocked by the §8 "animations always run" rule.
- Not verified in a real browser: filter drawer, screen reader behaviour, real-device keyboard,
  graph WebGL runtime. `record_sessions_percent: 100` needs sampling before a launch spike.
- Workstream B4 (related "See also" beyond dual listings) deferred.

**Repo hygiene:**
- Local paths and verbatim prompts were scrubbed from tracked files on 2026-10-05 but remain in git history.
- `memory/decisions.md` and `memory/user-prompts.md` were archived up to 2026-09-30 into `memory/archive/`.

## 12. Tech stack

- **Runtime:** Node.js >=20 (CI uses 22; build scripts CommonJS, no TS).
- **Deps:** `ajv` + `ajv-formats` (schema validation), `js-yaml`, `marked` (Markdown → HTML), `minisearch` (client search), `@resvg/resvg-js` (SVG → PNG for OG images).
- **CI:** GitHub Actions: validate, render-readme, link-check, release-watch, freshness (§7).
- **Hosting:** Cloudflare Pages on `3d.devanshutak.xyz` (root + per-section paths).
- **Shell:** PowerShell 7 (Windows 11 dev box). `rtk` proxy for token-optimized CLI.
- **Editor data format:** YAML (chosen for diff-friendliness + hand-editability; see ADR-0001).
- **License:** CC0-1.0 (catalog content + code).

## 13. Skills / agents in active use

- `claude-mem` — auto session history.
- `mempalace` — curated long-term KB.
- `graphify` — code structure graph.
- `caveman` / `caveman-commit` — compressed comms + commits.
- `claude-seo:*` — site SEO audits (when site published).
- `frontend-design` — UI work on built HTML.

## 14. Pointers

- Domain vocab → `CONTEXT.md`.
- Architecture decisions → `docs/adr/*`.
- Studio discovery method (country-by-country agents) → `docs/playbooks/studio-discovery.md`.
- Project rules → `CLAUDE.md` (and this file).
- Data contract → `schema/entry.schema.json` + `schema/vocab.yml`.
- Memory log → `memory/*`.
- Live site → `https://3d.devanshutak.xyz`.
- Repo → `devanshutak25/3d-resources` on GitHub.
