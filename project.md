# project.md — 3d_resources master guide

**Read this at session start. Update it after every change.**

This file is the canonical brief for the repo. It supersedes scattered docs where they conflict. Other authoritative files: `CLAUDE.md` (rules), `CONTEXT.md` (vocab), `docs/adr/*` (architecture decisions), `schema/*` (data contract).

---

## 1. What this project is

`3d_resources` is a curated, lookup-first reference catalog for the 3D / VFX / motion / games / AI-CG industry. It ships as:

- A GitHub repo (`README.md` + `data/` source): 975 stars (2026-10-05). Catalog size: **3,826 entries, 103 deprecated, ~3,723 unique live resources** across 12 sections / 150 subsections (2026-10-05). Public copy uses `catalog.publicCountLabel()` ("3,500+"), never a hardcoded number.
- A live static site: `https://3d.devanshutak.xyz` (Cloudflare Pages).
- An `llms.txt` + `llms-full.txt` feed for AI crawlers (ChatGPT, Perplexity, Claude).
- An Atom feed (`feed.xml`) + sitemap + per-section indexable pages.

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
│   ├── NN-<section>.yml       # Section metadata + subsection list (slug, title, description, chunks). No entries.
│   └── NN-<section>/<sub>/NN-<sub>.yml   # Chunks: { entries: [...] }, ≤50 each (ADR-0001).
│
├── schema/
│   ├── entry.schema.json      # JSON Schema 2020-12 for entries (url must match ^https?://).
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
│   ├── build-html.js, build-og-images.js, build-section-pages.js, build-tag-pages.js,
│   │   export-data.js, build-search-index.js, build-graph.js, build-llms-txt.js,
│   │   build-feed.js, build-sitemap.js           # Site build steps (§6).
│   ├── check-built-links.js   # Post-build internal link / anchor / duplicate-id check (exit 1 on failure).
│   ├── check-links.js         # External link scan; browser-UA retry; --only-missing / --status= / --dry-run.
│   ├── recheck-unreachable.js, check-pricing-freshness.js, check-repo-staleness.js, watch-releases.js, freshness-digest.js
│   ├── ingest-80lvl.js, ingest-gumroad.js, ingest-itch.js, ingest-youtube.js
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
- `tags.tech` (open but curated): `pbr`, `cc0`, `node-based`, `procedural`, `usd`, `gpu`, `real-time`, `offline`, `ray-tracing`, `path-tracing`, `raster`, `photogrammetry`, `gaussian-splatting`, `nerf`, `ai-generative`, `physics`, `subscription`, `perpetual`, `houdini-addon`, `blender-addon`, `unreal-plugin`, `unity-plugin`, `cloud-render`, etc.

### dual_listed_in mirror system

Entries appear once canonically + mirror into N other subsections via `dual_listed_in: ["<section-slug>/<sub-slug>", ...]`. Render layer handles mirroring. Validator rejects mirror paths that don't match a real subsection.

### Auto-updated fields

`url_status`, `url_last_verified` — `check-links.js`.

Link scans never change `deprecated`: that is an editorial decision. HTTP 5xx/408/425 responses are transient (`unreachable`); followed successful redirects are reported as `redirect`.
`pricing_last_verified` — `check-pricing-freshness.js`.
`stale`, `archived`, `last_pushed` — `check-repo-staleness.js`.

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

**Page context:** `<body data-page-type=… data-section=… data-subsection=… data-tag-group=… data-tag-value=…>`, emitted by `analyticsAttrs()` in `page-shell.js` from the `analyticsContext` param. `page_type` ∈ `catalog | section | subsection | tag | sections-hub | tags-hub`. Any new `pageShell()` call site MUST pass `analyticsContext` or its events land as `page_type: unknown`.

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
  2026-10-01 freshness run failed on it. Then re-run freshness and delete the orphan branch
  `maintenance/freshness-2026-10` (its stale/archived flags were never merged).
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
- §07 workflow coverage is 27% by design: gameplay code, networking, UI and similar have no workflow value.

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
- Project rules → `CLAUDE.md` (and this file).
- Data contract → `schema/entry.schema.json` + `schema/vocab.yml`.
- Memory log → `memory/*`.
- Live site → `https://3d.devanshutak.xyz`.
- Repo → `devanshutak25/3d-resources` on GitHub.
