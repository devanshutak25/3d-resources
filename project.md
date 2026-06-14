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
Section-by-section deep enrichment of §01–§11 for filter-UI facets (§12 already done). Per section: fill missing `workflow`/`output`/`platform`/`skill` tags, add `license`, expand thin descriptions, fix junk/misfiled/wrong tags. Worst-first order: §10 → §07 → §02 → §04 → §06 → §08 → §01 → §09 → §05 → §11 → §03. **Done: §10** (platform 27%→80%) + **§07 COMPLETE** (7A 19 non-engine subsections; 7B `unity-engine-resources` 452 ent full hand-curation, chunk 09 over-cap split into 09+new 10; **7C `unreal-engine-resources` 2026-06-12, full hand-curation, 184 ent, platform 11→184, skill 0→13**). §07 whole now platform 811/812, skill 70, output 812. **§02 modeling IN PROGRESS** (chunk-by-chunk, worst-first; 251 ent, baseline platform 23%). Phases 1-4 (all 4 `blender-plugins-addons` chunks, 156 ent) DONE 2026-06-12. **§02 ENRICHMENT COMPLETE (phases 1-13) 2026-06-12.** Final §02 facet coverage: platform 251/251 (~100%), workflow 168, output 55, skill 52; empty-tags 0 (baseline platform 58, workflow 43, output 13, skill 10). **§02 RELOCATION COMPLETE 2026-06-12** — all 17 misfiles moved out: 12 dev/build/scripting tools + Blender dev docs → §10 `misc-3d-utilities/01` (18→30); 2 ML lists (3D Machine Learning, Awesome 3D Human) → §09 `ml-for-cg/01` (4→6); 3 refs (Awesome 3D Printing, Usage in Science, Blender Checklist) → §11 `communities-forums/03` (new chunk, `chunks` 2→3). RELOCATE notes stripped, pure move (no dual_listed_in). **§02 NOW FULLY COMPLETE (enrichment + relocation).** **§04 lighting IN PROGRESS** (6 phases chunk-by-chunk; 241 ent / 9 chunks; baseline platform 23, output 11, skill 8, workflow already 234/241). **Phases 1-5 DONE 2026-06-12.** P1 (4 tiny subsections, 15 ent): platform/skill/output, CNDL empty-tags fixed. P2 (rendering-shader-theory/01, over-cap fixed by moving 1 overflow → chunk 02; both now 50): platform on all 50, skill on educational, 3 missing-workflow fixed, stripped wrong blender tags. P3 (rendering-shader-theory/02, 50 ent): Unity shader repos got platform+output:games, 7 RELOCATE-candidates retyped inline (tool/plugin), junk stripped, 6 NPR channel descs cleaned; MoonRay+CopperLicht kept flagged for §12. P4 (rendering-shader-theory/03, 50 ent): platform on all 50 (web for refs/papers/libs, [win,mac,linux] for native tools/Unity/UE/Houdini), retyped 4 Blender addons reference→plugin + stripped badges, 10 papers got year+skill:advanced+web, output:games on Unity repos+CelShader, 6 truncated descs fixed. P5 (rendering-shader-theory/04, 48 ent): platform on all 48, skill on 26, 4 papers got year, retyped RenderDoc reference→tool + glslViewer-writeup tool→reference, Khrnos→Khronos typo; kept all 5 RELOCATE notes. P6 (rendering-shader-theory/05, 28 ent): platform on remaining 22 (6 channels already had web), skill on 20, output archviz/games, NeRF-Tex year:2021, typos+restater descs fixed, kept Takua RELOCATE? note. **§04 ENRICHMENT COMPLETE (all 6 phases). Final coverage: platform 241/241 (~100%), output 57, skill 115, empty-tags 0** (baseline platform 23, output 11, skill 8). **§04 RELOCATION COMPLETE 2026-06-12** — all 8 RELOCATE flags cleared: 6 moves (MoonRay→§12 render-engines, CopperLicht→§12 game-engines-free-oss, KodeLife→§12 misc-3d-utilities-software [all 3 retyped reference/tool→software]; Photo-tourism paper→§09 papers/02; React Spring→§06 motion-graphics-tools; Takua Renderer→§04 renderer-specific-learning) + 2 kept-in-place with note stripped (Quaternions math article, Physics-Based Animation — no math/sim home, user-confirmed). Pure move, no dual_listed_in, no new chunks. Sources: r-s-t/02 50→48, /04 48→45, /05 28→27. **§04 NOW FULLY COMPLETE (enrichment + relocation).** **§06 motion-graphics ENRICHMENT COMPLETE 2026-06-13 (single phase, user-confirmed).** 41 ent / 5 non-empty subsections (2 empty placeholders left + flagged: motion-graphics-courses, video-editing-courses). Coverage: platform 3→41 (100%), workflow 5→16, output 39→40, skill 1→6, empty-tags 0, junk 0. Convention locked: AE plugins → `[win,mac]` (no Linux build); MG has no `motion-graphics` workflow value (output-only), honest workflows used = compositing/editing/rigging/animation/creative-coding. No relocations needed in §06. **§08 art-design IN PROGRESS** (3-phase clustered: A education / B tools+inspiration / C misfit retype+relocation; 167 ent / 13 non-empty subsections). **Phase A DONE 2026-06-13** (7 files / ~84 ent: concept-art-channels, drawing-painting-3d, photography, cinematography-camera, animation-principles, design-principles-typography, composition; concept-art-courses left empty). **Phase B DONE 2026-06-13** (5 files / ~83 ent: pre-production-tools, general-inspiration, design-tools [light], color-theory-tools, 2d-art-references). §08 coverage now: platform 70→**167 (100%, every entry)**, workflow 118→139, output 45→84, skill 1→51, empty-tags 0. **Phase C DONE 2026-06-13 → §08 FULLY COMPLETE.** Moved 30 misfits out of §08 (167→137 ent): Nuke/Fusion/ButtleOFX→§12 vfx-compositing, Malt→§12 render-engines, 22 illustration asset-libs→§01 (stock-images 16, icons 3, model-libraries-specialized 3), Genetic Drawing+RenderNet→§09, Gizmos→§07 unity. Plasticity DEDUP (canonical already in §12 3d-software-paid; §08 dup deleted). Savee→§08 design-tools (intra). Retyped-in-place keepers (4 illustration refs in concept-art-channels [channel→reference], drawing-painting coding entries, Swatchr, Kerning Tool); notes stripped. All targets ≤50, 0 misfit flags, Plasticity in 1 file. **§08 final: 137 ent, platform 137 (100%), workflow 109, output 58, skill 51.** **§01 ASSETS IN PROGRESS** (clustered: 7 enrichment phases + final relocation, user-confirmed; 269 ent / 17 chunk files / 16 subsections; baseline platform 131/269, workflow 144, output 164, license 246, skill 0, empty-tags 5). **§01 convention LOCKED: asset-source/marketplace websites → `platform: web`** (source is a browser; differs from §02/§04 desktop default); software/plugins → desktop per host; `skill` mostly N/A. **P1 textures DONE 2026-06-13** (textures-free-pbr/01+02, textures-premium, textures-specialized; 37 ent): platform 1→37, output +37 (generalist/scientific-viz/archviz), NASA badge stripped, Substance `[$] :`+wrong-blender-tech fixed, Blendersauce empty-tags filled. **P2 model-libs general DONE 2026-06-13** (arch-furniture 11 already 100%-faceted, left as-is; free-general 33: output added to ~24, Blend Swap empty-tags filled, Mantissa blender-addon tech dropped; platform/output 44/44). **P3 model-libs specialized (21) + software-specific (10) DONE 2026-06-13**: specialized platform→21/21 (web), output fills, 2 empty-tags filled (Artec, Scanned Female Head link-salad rewritten); software-specific platform→10/10 (web for download libs, desktop for in-app browsers Maxon/Maya/3DCoat), output:generalist. **P4 game-assets DONE 2026-06-13** (45 ent, worst file): platform 4→45 (web on asset pages, [win,mac,linux] on 4 tools), output 45/45, workflow on 4 3D/anim packs; junk descs/readme_tags fixed. P8 flags added: NativeBlend CLI + UAssetAPI (tools→§10). **P5 stock+audio DONE 2026-06-13** (47 ent): stock-images already 28/28 (Story Set desc tightened only); stock-footage videvo link-salad fixed → 4/4; audio Sonniss desc + 2 plugin platforms → 14/15 (Sapphire→P8). **P6 icons (27) + fonts (19) DONE 2026-06-13**: icons 25→27/27 (typicons + Material design icons got web); fonts 0→19/19 (all got web). **§01 ASSETS FULLY COMPLETE (P1–P8) 2026-06-13.** P7 enriched the last 3 files (hdris/01 0/9→9/9 platform; marketplaces output fills + gumroad→asset-source rename; Quixel Bridge tags + Fab-fold note; Sonniss platform). P8 relocation+dedup: NativeBlend→§09 3d-generation, UAssetAPI→§07 unreal/04, Sapphire DEDUP-deleted (canonical in §12), OpenTopography retyped community→asset-source; 3D MDB + both Models Resource sites kept (user calls). §01 platform ~100% all files, 0 misfit flags. Validation 313 warnings, no errors. **§09 ai-ml FULLY COMPLETE 2026-06-13** (146 ent; papers-batch + small-files phasing). **Phase A** — papers/01+02 (93 ent): retyped all misfiled reference/tutorial/asset-source → `entry_type: paper`, stripped misfit notes, `skill: advanced` on all (1→93), cleaned bibtex/pipe/placeholder junk. **Phase B** — 8 small subsections + 12 intra-§09 relocations from image-generation/01 (3DALL-E→papers; courses→ml-for-cg; COVAL→ai-audio-music; 4 notebooks/channel→video-generation; AI Render→ai-assisted-cg-tools; point-E+AdaMPI→3d-generation; sd-concepts→open-source-models-hf). image-generation gutted 16→4 (upgraded dead Canva news article → real Canva tool). **§09 convention: papers/ = `entry_type: paper` + `skill: advanced` + `platform: web` + `year` + `paper` tech tag; platform heuristic = SaaS/refs/channels/papers → web, GitHub-repo/CLI/local tools → [win,mac,linux], plugins → host platforms.** Final coverage: platform 102→**146 (100%)**, skill 1→**100**, output 11, empty-tags 0, RELOCATE/misfit 0. Validation ✓ 314 (all freeform-tech `paper`/`ai-ml`, benign). FLAGS: image-generation thin + missing core text-to-image platforms (add later); empty stubs ml-for-cg/02 + texture-material-generation/01; could add `paper` to curated vocab tech. **§05 vfx FULLY COMPLETE 2026-06-15** (single phase; 28→26 ent). platform 3→26 (100%), output 11→25, skill 0→14. 3 misfits relocated out of tech-art: CasparCG→§05 virtual-production (intra), Bino→§07 xr-ar-vr, Kiko→§10 misc-3d-utilities (user picks). Clean data, validation ✓ 314. **§11 learning-community IN PROGRESS 2026-06-15** (cluster-by-theme, 4 phases; 436 ent / 15 chunks; baseline platform 94%, output 20% headline-gap, workflow 9%, skill 1%; over-cap `communities-forums/02` = 119 ent to split in Phase C). User forks: scope §11-only, split-during-§11, cluster-by-theme. **Phase A DONE** (YouTube channels, 109 ent / 5 files: youtube-motion-c4d already 100%; blender output 0→44 + workflow +11 + empty-tags fixed + 9 restater descs; houdini/01 output 0→12 + truncation fix; houdini/02 output/skill/tech on 13; sculpting-characters output 0→11). All 4 changed files 100% output+platform, 0 empty tags. Validation ✓ 322 (+8 benign houdini freeform-tech). **Phase B DONE 2026-06-15** (paid-tutorial-platforms 01+02 + patreon-creators, 112 ent): both paid-tutorial chunks found to be misnamed junk-drawers (mostly free channels/courses/dev-libs). paid platform 94/94, output 0→84, skill 0→89; patreon output 0→14, skill 0→3, 16 restater descs fixed. NEW RELOCATE flags: OpenEXR/OpenColorIO/OpenCue→§10, Importance Sampling→§09 (enriched in place). Validation ✓ 365 (benign freeform-tech, 0 errors). **Phase C DONE 2026-06-15** — split over-cap communities-forums/02 (119) into 3 thematic chunks (02 Blender/general/AI-dev 33, new 04 Houdini/C4D/motion/games/XR-VP 46, new 05 VFX/animation/concept/archviz/design 39), bumped chunks 3→5; fixed 6 empty tags + 1 license; DEDUP dropped realtimevfx.com dup; cleaned 9 link-salad descs in chunk 01. §11 empty tags 7→1 (Phase D). 159→158 ent. Validation ✓ 365, 0 errors. NEXT: Phase D (inspiration+career+trends; merge 3 architecture-viz entries into communities/inspiration per user, remove subsection) → §11 relocation pass (4 flags) → §03 animation. Plan: `~/.claude/plans/make-plan-to-do-tidy-wave.md`. **Phase D DONE 2026-06-15 → §11 ENRICHMENT COMPLETE (A–D).** inspiration-showcase 44→39 (6 creative-coding tools relocated → §12 misc-3d-utilities-software/virtual-production-software/legacy-defunct-software, retyped reference→software; Leaf Pic dropped; ~28 bogus license:Paid fixed; output added by medium). architecture-viz subsection REMOVED (Contemporist+Modlar→inspiration-showcase; Blender 3D Architect book→§02 blender-tutorials, tutorial→book; dir+slug deleted). salary-career +license:Free; industry-trends enriched. §11 empty-tags 0. Validation ✓ 365, 0 errors. **§11 RELOCATION PASS DONE 2026-06-15 → §11 FULLY COMPLETE.** 4 flags cleared (pure move): OpenEXR+OpenColorIO+OpenCue→§10 `pipeline-standards/01` (10→13; OpenEXR/OCIO +license:OSS +platform[win,mac,linux]; OpenCue kept web); Importance Sampling→§09 `papers/02` (44→45, reference→paper). §11 RELOCATE grep=0. Validation ✓ 366. **Scope locked "close the sweep only": NEXT and FINAL = §03 animation; §10 NeRF/GS paper-dump dedup DEFERRED.** **§03 ANIMATION DONE 2026-06-15 → §01–§11 SEARCHABILITY ENRICHMENT SWEEP COMPLETE** (§12 was pre-done). §03 (12 ent): ai-motion-capture/01 rewritten (Bandai Namco tool→asset-source, CMU BVH −blender tags, all +mocap+platform); channels light-touch (Josh Toonen cleaned, +skill ×2); animation-courses empty stub left. §03 platform 12/12, empty-tags 0. Validation ✓ 366. **Remaining catalog work = DEFERRED items only** (handoff §6): §10 NeRF/GS paper-dump dedup vs §09 papers; over-cap `plugin-marketplaces/01` (51); vfxcamdb.com cross-§10 dupe; duplicate official UE YouTube channel in §07. **NEXT sweep section after §11: §03 animation** (12 ent, single-phase). DEFERRED: §10 NeRF/GS paper-dump dedup+relocation overlap with §09 papers. **DEFERRED (own phase):** §10 photogrammetry/01-03 (121) + gaussian-splatting-nerf/01 (34) NeRF/GS paper-dump dedup+relocation overlap → §09 papers. Plan: `~/.claude/plans/make-plan-to-do-concurrent-snail.md`. After §01: §09 [NeRF/GS paper dumps + §10 overlap] → §05 → §11 → §03. Deferred: MoonRay (rendering-shader-theory/02) RELOCATE to §12 (render engine). Remaining worst-first after §04: §06 → §08 → §01 → §09 → §05 → §11 → §03. Full state: `disregard/handoff-enrichment-sweep.md`. One section per phase, validate + log, stop for user confirmation between sections. **Full operational handoff: `disregard/handoff-enrichment-sweep.md`.** Plan: `~/.claude/plans/see-the-last-few-optimized-zephyr.md`. Flagged: NeRF/GS paper dumps in §10 photogrammetry/gaussian-splatting overlap §09/papers (relocation+dedup for §09 phase); over-cap chunk `plugin-marketplaces/01` (51); vfxcamdb.com dupe across 2 §10 subsections; duplicate official UE YouTube channel in §07 `unreal-engine-resources/04` (two entries, same channel).

### Deferred catalog cleanup (in progress, started 2026-06-15)
Post-sweep flag cleanup. Plan: `~/.claude/plans/make-plan-to-do-shimmering-cloud.md`. User picked catalog-cleanup over publication; §10 NeRF/GS papers = relocate genuine papers → §09 `papers/` + dedup, real tools/services stay. **Phase 1a DONE**: 13 NeRF papers from §10 `photogrammetry-scanning/01` (37→24) → new `data/09-ai-ml/papers/03` (reference→paper, +skill:advanced), §09 papers `chunks: 2→3`, dedup 0 conflicts, validation ✓ 366. **Phase 1b DONE 2026-06-15**: 42 NeRF papers from `photogrammetry-scanning/02` (49→7) → filled papers/03 to 50 + new `papers/04` (5); §09 papers `chunks: 3→4`; dedup vs papers/01-03 = 0 conflicts; 7 keepers stay (2 tools, Awesome-3DGS list, 2 GS tutorials, 2 channels). Papers sizes 01=50/02=45/03=50/04=5. Validation ✓ 408 (366 + 42 benign `paper` freeform-tech), 0 errors. Plan: `~/.claude/plans/make-plan-to-do-ticklish-axolotl.md`. **Phase 1c DONE 2026-06-15**: 17 NeRF/GS papers from `gaussian-splatting-nerf/01` (34→17) → papers/04 (5→22); dedup 0 conflicts; chunks stays 4; 17 keepers stay (impls/tools/viewers/blogs). **Phase 1d DONE 2026-06-15 → PHASE 1 COMPLETE**: 2 Debevec HDR/IBL papers from `photogrammetry/03` (35→33) → papers/04 (22→24); user chose MOVE. §10 paper relocation done (1a-1d, 74 papers total → §09 papers; sizes 01=50/02=45/03=50/04=24, chunks 4); residue = legit keepers (impl repos + HDR book). Validation ✓ 410, 0 errors. **Phase 2 DONE 2026-06-15**: `plugin-marketplaces/01` over-cap split (51→50, BlenderAddons.org → `02` 0→1; chunks:2 already declared). **Phase 3 DONE 2026-06-15**: vfxcamdb.com cross-§10 dupe → kept `matchmoving-tracking/01` canonical + `dual_listed_in: [tools-pipeline-utilities/misc-3d-utilities]`, deleted thin misc copy. **Phase 4 DONE 2026-06-15**: duplicate official UE YouTube channel (§07 unreal/04) → kept `@UnrealEngine` (merged "weekly live streams" desc), deleted `channel/UCBob…` copy. Validation ✓ 410, 0 errors. **DEFERRED CATALOG CLEANUP COMPLETE (Phases 1–4). All §01–§11 enrichment + all post-sweep flags closed. Remaining repo work = publication/launch only (pub_plan Part 2, §11 above).** Classification rule (for reference): MOVE = `Author et al., VENUE YEAR` papers; KEEP-in-§10 = tools, GS blogs, awesome-lists, runnable reference-impl repos.

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
