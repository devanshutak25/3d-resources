# project.md — 3d_resources master guide

**Read this at session start. Update it after every change.**

This file is the canonical brief for the repo. It supersedes scattered docs where they conflict. Other authoritative files: `CLAUDE.md` (rules), `CONTEXT.md` (vocab), `docs/adr/*` (architecture decisions), `schema/*` (data contract).

---

## 1. What this project is

`3d_resources` is a curated, lookup-first reference catalog for the 3D / VFX / motion / games / AI-CG industry. It ships as:

- A GitHub repo (`README.md` + `data/` source) — currently ~741 stars.
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
├── README.md                  # GENERATED (lite mode, ~19 KB landing page). Never hand-edit.
├── CLAUDE.md                  # Project rules for Claude. Read every session.
├── project.md                 # THIS FILE. Read every session, update after every change.
├── CONTEXT.md                 # Domain vocabulary (Section, Subsection, Entry, Chunk, Pass).
├── CONTRIBUTING.md            # Contributor instructions.
├── CODE_OF_CONDUCT.md         # Contributor Covenant v2.1 stub.
├── SECURITY.md                # Security reporting policy.
├── LICENSE                    # CC0-1.0.
├── plan.md                    # Architecture plan (chunked catalog + passes). Mostly done.
├── pub_plan.md                # Publication-readiness plan. Part 1 shipped 2026-05-17.
├── changes.md                 # Publication-readiness changelog (11/11 steps done).
├── build.sh                   # Canonical 8-step build pipeline.
├── package.json               # Deps: ajv, ajv-formats, js-yaml, marked, minisearch, resvg-js.
│
├── data/                      # SOURCE OF TRUTH (ADR-0002). Edit here, never README.md.
│   ├── sections.yml           # Ordered list of 12 sections + featured picks.
│   ├── aliases.yml            # URL aliases (renames, redirects).
│   ├── 01-assets.yml          # Section metadata + subsection list. No entries.
│   ├── 01-assets/             # One dir per section, holding chunked entries.
│   │   ├── asset-marketplaces/
│   │   │   └── 01-asset-marketplaces.yml      # { entries: [...] }, ≤50 entries (ADR-0001).
│   │   ├── hdris/01-hdris.yml
│   │   ├── textures-free-pbr/
│   │   │   ├── 01-textures-free-pbr.yml       # Chunk 1 (full at 50).
│   │   │   └── 02-textures-free-pbr.yml       # Chunk 2 (overflow).
│   │   └── ... (17 subsections)
│   ├── 02-modeling.yml + 02-modeling/         # 19 subsections (DCC-specific).
│   ├── 03-animation.yml + 03-animation/       # 3 subsections.
│   ├── 04-lighting.yml + 04-lighting/         # 5 subsections.
│   ├── 05-vfx.yml + 05-vfx/                   # 3 subsections.
│   ├── 06-motion-graphics.yml + 06-motion-graphics/  # 7 subsections.
│   ├── 07-game-dev.yml + 07-game-dev/         # 19 subsections.
│   ├── 08-art-design.yml + 08-art-design/     # 13 subsections.
│   ├── 09-ai-ml.yml + 09-ai-ml/               # 10 subsections.
│   ├── 10-tools-pipeline.yml + 10-tools-pipeline/    # 12 subsections.
│   ├── 11-learning-community.yml + 11-learning-community/  # 11 subsections.
│   └── 12-software-reference.yml + 12-software-reference/  # ~30 subsections (software buckets).
│
├── schema/                    # Data contract.
│   ├── entry.schema.json      # JSON Schema 2020-12 for entry objects.
│   └── vocab.yml              # Controlled enums for license/entry_type/workflow/output/platform/skill + curated tech.
│
├── scripts/                   # All build / validate / ingest / pass tooling.
│   ├── lib/
│   │   ├── catalog.js         # Single seam over data/. ALL scripts use this. CHUNK_CAP=50.
│   │   ├── catalog.test.js
│   │   ├── canonical-url.js   # URL normalization (https, strip www, drop tracking).
│   │   ├── canonical-url.test.js
│   │   ├── quality-score.js   # qualityScore(entry) → {score, factors}.
│   │   ├── quality-score.test.js
│   │   ├── ingest-core.js
│   │   └── rss.js
│   ├── passes/
│   │   └── verify-tags.js     # Per-chunk subagent pass (re-validates vocab tags).
│   ├── _archive/              # Dead one-shot migration scripts (tracked, never run).
│   │
│   ├── render.js              # data/ → README.md (lite + full modes).
│   ├── validate.js            # Schema + vocab + cross-section dupe checks. CI gate.
│   ├── build-html.js          # README.md → _site/index.html (also writes footer/back-to-top).
│   ├── build-section-pages.js # Per-section /sections/<slug>/index.html (12 pages).
│   ├── build-llms-txt.js      # llms.txt + llms-full.txt.
│   ├── build-feed.js          # Atom feed of latest 50 entries.
│   ├── build-og-images.js     # Per-section 1200×630 PNGs from og-template.svg.
│   ├── build-search-index.js  # MiniSearch serialized index.
│   ├── build-graph.js         # graph.json for WebGL 3D graph view.
│   ├── export-data.js         # data/ → _site/data.json (filter UI).
│   ├── export-csv.js          # CSV export.
│   │
│   ├── ingest-80lvl.js        # Ingest pipeline: 80 Level.
│   ├── ingest-gumroad.js      # Ingest pipeline: Gumroad.
│   ├── ingest-itch.js         # Ingest pipeline: itch.io.
│   ├── ingest-youtube.js      # Ingest pipeline: YouTube channels.
│   ├── mine-awesome.js        # Mine awesome-lists into candidates (gitignored).
│   ├── triage-candidates.js   # Triage mined candidates (gitignored).
│   │
│   ├── audit-classification.js
│   ├── audit-software-coverage.js
│   ├── auto-tag.js
│   ├── check-links.js         # Link rot scan; writes url_status + url_last_verified.
│   ├── check-pricing-freshness.js
│   ├── check-repo-staleness.js  # GitHub push date → stale/archived/last_pushed.
│   ├── cleanup-validation-drift.js
│   ├── dedupe-entries.js      # Cross-chunk dupe scan (uses qualityScore).
│   ├── dedupe-youtube.js
│   ├── freshness-digest.js
│   ├── migrate-software.js
│   ├── pass.js                # Pass driver: per-chunk subagent edits with branch + commit.
│   ├── quality-scan.js
│   ├── quarantine-low.js
│   ├── recheck-unreachable.js
│   └── watch-releases.js
│
├── assets/                    # Source assets for the site (copied to _site/ by build).
│   ├── css/style.css          # ~27 KB main stylesheet.
│   ├── css/graph.css          # ~19 KB graph view stylesheet.
│   ├── js/filter.js           # ~53 KB filter UI (chips, search, facets).
│   ├── js/graph.js            # ~35 KB WebGL graph.
│   ├── graph.html             # Standalone graph view template.
│   ├── favicon.svg, apple-touch-icon.png
│   ├── og-image.png, og-image.svg, og-template.svg
│   └── cover.af               # Affinity Designer source for cover art.
│
├── _site/                     # GENERATED. Cloudflare Pages serves this. In .gitignore.
│   ├── index.html             # ~1.1 MB single-page catalog.
│   ├── sections/<slug>/       # 12 per-section indexable pages.
│   ├── data.json              # ~1 MB filter index.
│   ├── search-index.json      # ~880 KB MiniSearch index.
│   ├── graph.json             # ~2 MB graph data.
│   ├── llms.txt + llms-full.txt
│   ├── feed.xml + sitemap.xml + robots.txt + 404.html
│   └── assets/                # CSS, JS (vendored MiniSearch UMD), og images.
│
├── docs/adr/                  # Architecture Decision Records.
│   ├── 0001-data-layout-is-public-interface.md
│   └── 0002-data-is-source-of-truth.md
│
├── memory/                    # Project-scoped memory (per CLAUDE.md protocol).
│   ├── goals.md
│   ├── tech_stack.md
│   ├── decisions.md           # Dated ADR-lite log.
│   ├── preferences.md         # User collab style.
│   ├── tools.md               # CLIs in use.
│   ├── agents.md              # Subagents spawned + outcomes.
│   ├── plugins.md             # Skills + MCP in use.
│   └── user-prompts.md        # Verbatim prompt log.
│
├── handoff/                   # Non-code launch/growth docs (gitignored). 13 markdown files.
│   ├── 00-prelaunch-hygiene.md → 10-tracking-kpis.md
│   ├── copy-snippets.md       # Single source of truth for taglines/pitches.
│   └── README.md
│
├── .github/
│   ├── workflows/validate.yml # CI: runs validate.js + dry-render + JSON export on data/schema/scripts changes.
│   ├── ISSUE_TEMPLATE/        # suggest-resource, report-broken-link, report-bug, config.
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── FUNDING.yml
│
├── _maintenance/              # Pass state files, awesome-mining cache. Gitignored.
│   ├── passes/<task>-<date>.json
│   ├── awesome-mining/        # Raw mined awesome-list copies (~14 files).
│   ├── unclassified-residual.md
│   └── split-run.log
│
├── disregard/                 # Scratch. Gitignored. temp_session_plan.md, TOC_FRAMEWORK.md.
├── run-logs/                  # Build/run logs.
├── graphify-out/              # graphify skill output. Gitignored.
└── node_modules/              # Deps. Gitignored.
```

## 4. Data model

### Nouns (from CONTEXT.md)

- **Section** — top-level category. 12 total, ordered by `data/sections.yml`. One file `data/NN-<slug>.yml`. Renders as H2.
- **Subsection** — grouping inside a Section. Has `slug`, `title`, `description`. Renders as H3. Lives only in the Section file metadata.
- **Entry** — a single resource. Conforms to `schema/entry.schema.json`.
- **Chunk** — file holding ≤50 Entries for one Subsection. Path: `data/<section>/<sub>/NN-<sub>.yml`. Insertion-ordered, append-friendly. Storage unit only.
- **Pass** — per-Chunk in-place edit by an LLM subagent. Driver: `scripts/pass.js` + `scripts/passes/<task>.js`. Branch-per-pass, per-Chunk commit, draft PR.
- **Catalog** — `scripts/lib/catalog.js`. The only way scripts touch `data/`. No script reads `data/` paths directly.

### Entry shape

Required: `name`, `url`, `description` (≤300 chars).

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

## 6. Build pipeline (build.sh, 8 steps)

1. `npm install marked js-yaml minisearch`.
2. `render.js` → full `README.md` (consumed by build-html).
3. `build-html.js` → `_site/index.html`.
4. `build-og-images.js` → per-section 1200×630 PNGs.
5. `build-section-pages.js` → `/sections/<slug>/index.html` × 12.
6. `export-data.js` → `_site/data.json`.
7. `build-search-index.js` + vendored MiniSearch UMD copy.
8. `build-graph.js` + copy `assets/graph.html`.
9. `build-llms-txt.js` → llms.txt + llms-full.txt.
10. `build-feed.js` → Atom feed.

After step 2, README is overwritten to lite mode (~19 KB landing page) by `render.js --mode=lite`. The full README is intermediate only.

## 7. CI

`.github/workflows/validate.yml` triggers on changes to `data/**`, `schema/**`, `scripts/**`. Runs:
1. `node scripts/validate.js` (schema + vocab + cross-section dupes).
2. `node scripts/render.js > /tmp/regen-README.md` (dry-render).
3. `node scripts/export-data.js /tmp/data.json` (JSON export).

Any closed-enum violation exits 1 and blocks merge.

## 8. Rules and absolute NOs

### Hard NOs

- **NO em-dashes (`—`) in user-facing text.** Use `: ` in titles, `. ` in prose. Em-dashes are the canonical AI tell. The OG-image splitter keys on `: ` for two-line layout.
- **NO AI tells.** Banned: `comprehensive`, `robust`, `powerful`, `seamless(ly)`, `leverage(s/d)`, `utilize(s/d/ing)`, `cutting-edge`, `state-of-the-art`, `the ultimate`, `game-changing`, `unleash`. Banned trailing phrases: `and more`, `and beyond`, `and so much more`.
- **NO marketing adjective stacks** ("fast, free, and powerful"). One concrete attribute beats three vague ones.
- **NO inventing closed-enum values.** Never silently add to `vocab.yml` / `entry.schema.json`. Map to closest existing value or ask user.
- **NO hand-editing `README.md` or `_site/`.** Both are generated. Edit `data/` only (ADR-0002).
- **NO scripts reading `data/` directly.** All access via `scripts/lib/catalog.js` (ADR-0001).
- **NO commit without passing `node scripts/validate.js`.**
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

## 9. Design style (site)

- Dark mode by default. Cards with hover lift.
- Filter bar (license / platform / workflow chips) above sections, server-rendered shell + JS hydration. Panel open by default on desktop, collapsed on mobile (≤768px). Chip groups live behind a collapsed-by-default sub-toggle (`#filter-groups-toggle`); auto-opens on URL-hash filter restore, collapses on TOC jump. TOC clicks preserve active search + filters (do not clear).
- Per-section OG images with `: ` two-line layout.
- Material Design Icons via CDN (subset).
- Back-to-top button (visible after 600 px scroll).
- "Edit on GitHub" pill in each section H2.
- WebGL 3D graph view (`graph.html`) with mobile collapsible legend (bottom-sheet FAB on ≤720px).

## 10. Memory protocol (mandatory)

**Session start:** Read `project.md`, `CLAUDE.md`, and all 8 files in `./memory/` before responding to first prompt.

**After every user prompt:**
1. Append the verbatim prompt to `memory/user-prompts.md` with timestamp + 1-line summary.
2. Update any other memory file whose content changed.
3. Update `project.md` if any rule, file structure, or goal changed.

**Session end:** Final sweep — ensure all files reflect latest state.

## 11. Pending tasks / known work

### From plan.md (architecture — mostly done)
All 7 steps shipped 2026-04-30. Catalog migration complete. Pass driver live with `verify-tags` pass.

### From pub_plan.md (publication — Part 1 done 2026-05-17)
All 11 code steps shipped. README split, per-section pages, llms.txt, footer, 404, perf defer, SSR filter shell, OG images, RSS feed, search-index split — done.

**Part 2 (non-code, deferred to `handoff/`):**
- GitHub About description + topics + social preview upload.
- Cut `v1.0.0` release.
- Awesome-list PR submissions (10 targets).
- Reddit posts (r/blender, r/Houdini, r/vfx, r/gamedev, r/3Dmodeling).
- Show HN.
- Discord drops.
- Twitter/X + BlueSky launch thread.
- Newsletter pitches (BlenderNation, CG Channel, 80.lv, Befores & Afters, Houdini Hive).
- Product Hunt launch.
- SEO follow-up: GSC submission, `/seo-audit`, watch CrUX.

### Searchability enrichment sweep (in progress, started 2026-06-11)
Section-by-section deep enrichment of §01–§11 for filter-UI facets (§12 already done). Per section: fill missing `workflow`/`output`/`platform`/`skill` tags, add `license`, expand thin descriptions, fix junk/misfiled/wrong tags. Worst-first order: §10 → §07 → §02 → §04 → §06 → §08 → §01 → §09 → §05 → §11 → §03. **Done: §10** (platform 27%→80%) + **§07 COMPLETE** (7A 19 non-engine subsections; 7B `unity-engine-resources` 452 ent full hand-curation, chunk 09 over-cap split into 09+new 10; **7C `unreal-engine-resources` 2026-06-12, full hand-curation, 184 ent, platform 11→184, skill 0→13**). §07 whole now platform 811/812, skill 70, output 812. **§02 modeling IN PROGRESS** (chunk-by-chunk, worst-first; 251 ent, baseline platform 23%). Phases 1-4 (all 4 `blender-plugins-addons` chunks, 156 ent) DONE 2026-06-12. **§02 ENRICHMENT COMPLETE (phases 1-13) 2026-06-12.** Final §02 facet coverage: platform 251/251 (~100%), workflow 168, output 55, skill 52; empty-tags 0 (baseline platform 58, workflow 43, output 13, skill 10). **§02 RELOCATION COMPLETE 2026-06-12** — all 17 misfiles moved out: 12 dev/build/scripting tools + Blender dev docs → §10 `misc-3d-utilities/01` (18→30); 2 ML lists (3D Machine Learning, Awesome 3D Human) → §09 `ml-for-cg/01` (4→6); 3 refs (Awesome 3D Printing, Usage in Science, Blender Checklist) → §11 `communities-forums/03` (new chunk, `chunks` 2→3). RELOCATE notes stripped, pure move (no dual_listed_in). **§02 NOW FULLY COMPLETE (enrichment + relocation).** **§04 lighting IN PROGRESS** (6 phases chunk-by-chunk; 241 ent / 9 chunks; baseline platform 23, output 11, skill 8, workflow already 234/241). **Phases 1-5 DONE 2026-06-12.** P1 (4 tiny subsections, 15 ent): platform/skill/output, CNDL empty-tags fixed. P2 (rendering-shader-theory/01, over-cap fixed by moving 1 overflow → chunk 02; both now 50): platform on all 50, skill on educational, 3 missing-workflow fixed, stripped wrong blender tags. P3 (rendering-shader-theory/02, 50 ent): Unity shader repos got platform+output:games, 7 RELOCATE-candidates retyped inline (tool/plugin), junk stripped, 6 NPR channel descs cleaned; MoonRay+CopperLicht kept flagged for §12. P4 (rendering-shader-theory/03, 50 ent): platform on all 50 (web for refs/papers/libs, [win,mac,linux] for native tools/Unity/UE/Houdini), retyped 4 Blender addons reference→plugin + stripped badges, 10 papers got year+skill:advanced+web, output:games on Unity repos+CelShader, 6 truncated descs fixed. P5 (rendering-shader-theory/04, 48 ent): platform on all 48, skill on 26, 4 papers got year, retyped RenderDoc reference→tool + glslViewer-writeup tool→reference, Khrnos→Khronos typo; kept all 5 RELOCATE notes. P6 (rendering-shader-theory/05, 28 ent): platform on remaining 22 (6 channels already had web), skill on 20, output archviz/games, NeRF-Tex year:2021, typos+restater descs fixed, kept Takua RELOCATE? note. **§04 ENRICHMENT COMPLETE (all 6 phases). Final coverage: platform 241/241 (~100%), output 57, skill 115, empty-tags 0** (baseline platform 23, output 11, skill 8). **§04 RELOCATION COMPLETE 2026-06-12** — all 8 RELOCATE flags cleared: 6 moves (MoonRay→§12 render-engines, CopperLicht→§12 game-engines-free-oss, KodeLife→§12 misc-3d-utilities-software [all 3 retyped reference/tool→software]; Photo-tourism paper→§09 papers/02; React Spring→§06 motion-graphics-tools; Takua Renderer→§04 renderer-specific-learning) + 2 kept-in-place with note stripped (Quaternions math article, Physics-Based Animation — no math/sim home, user-confirmed). Pure move, no dual_listed_in, no new chunks. Sources: r-s-t/02 50→48, /04 48→45, /05 28→27. **§04 NOW FULLY COMPLETE (enrichment + relocation).** NEXT sweep section: §06 → §08 → §01 → §09 → §05 → §11 → §03. Deferred: MoonRay (rendering-shader-theory/02) RELOCATE to §12 (render engine). Remaining worst-first after §04: §06 → §08 → §01 → §09 → §05 → §11 → §03. Full state: `disregard/handoff-enrichment-sweep.md`. One section per phase, validate + log, stop for user confirmation between sections. **Full operational handoff: `disregard/handoff-enrichment-sweep.md`.** Plan: `~/.claude/plans/see-the-last-few-optimized-zephyr.md`. Flagged: NeRF/GS paper dumps in §10 photogrammetry/gaussian-splatting overlap §09/papers (relocation+dedup for §09 phase); over-cap chunk `plugin-marketplaces/01` (51); vfxcamdb.com dupe across 2 §10 subsections; duplicate official UE YouTube channel in §07 `unreal-engine-resources/04` (two entries, same channel).

### Open work threads (from decisions.md)
- Continuing curation: scientific-viz, legacy/defunct, compositing-learning, pre-production-tools subsections recently added (2026-05-22). Watch for similar gaps.
- Cloud render farm services bundled into `pipeline-software` (2026-05-20).
- Software taxonomy expansion ongoing (`workflow`/`output`/`entry_type`/`platform` vocab expanded 2026-05-22).

## 12. Tech stack

- **Runtime:** Node.js (build scripts CommonJS, no TS).
- **Deps:** `ajv` + `ajv-formats` (schema validation), `js-yaml`, `marked` (Markdown → HTML), `minisearch` (client search), `@resvg/resvg-js` (SVG → PNG for OG images).
- **CI:** GitHub Actions (`.github/workflows/validate.yml`).
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
