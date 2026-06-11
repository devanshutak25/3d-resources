# Decisions

Architectural / structural decisions w/ rationale + date.

## Format
- **YYYY-MM-DD — Title**
  - Decision:
  - Why:
  - Impact:

## Log
- **2026-06-11 — §12 software quality-gap cleanup (4-phase pass)**
  - Decision: Audited all §12 software-reference entries for gaps like the Lightmap fix. Scoped to genuine gaps only (kept ~100 terse-but-correct house-style descriptions untouched). 4 chunked phases: (A) fixed 5 malformed entries (markdown junk in Mandelbulb3D / Medieval Fantasy City Generator descs, tightened Godot Game Tools), relocated 2 NeRF papers from `photogrammetry-software` → `09/papers` (retyped software→reference), dropped malformed `📄 PubNub` article entry. (B) added `license` to 13 software lacking it (8 OSS game engines, JanusVR/Polygonjs, GrabCAD/Thingiverse, Hexels). (C) added `tags` to 20 `tags:{}` entries (8 active + 12 legacy-defunct). (D) rewrote 8 name-restating/malformed descriptions (Pixotope, Vizrt, disguise, OGMO, Unity Muse, Massive Software, Storm HydroFX, Gigapixel AI + fixed Gigapixel's wrong blender tags).
  - Why: terse house style is correct, but restating the name ("Virtual production software." for Pixotope), markdown junk in descriptions, missing license/tags, and misfiled papers are real defects that hurt filtering and credibility.
  - Impact: 14 data files. Zero software-type entries left without license; zero §12 entries without tags. Validation passes (217 warnings, all pre-existing freeform-tech-tag notices like `paper`/`pipeline`). README untouched.
  - Follow-up done same session: consolidated `Massive Software` (misc) + `Massive` (pipeline) dupe → kept richer pipeline entry as canonical, removed misc copy, moved mirror to `tools-pipeline-utilities/misc-3d-utilities` on canonical.
- **2026-06-09 — Filter panel UX: open by default, chips behind sub-toggle, TOC preserves state**
  - Decision: (1) TOC link clicks no longer clear search/filters (removed §17 clear block in `setupTocClickHandler`); state persists on jump. (2) `#filter-bar` opens by default on desktop, stays collapsed on mobile (`matchMedia('(max-width:768px)')`) to avoid the fullscreen overlay popping on load. (3) The 5 chip groups now live in `#filter-chip-groups` behind a collapsed-by-default `#filter-groups-toggle`; auto-opens when a chip filter is restored from URL hash; collapses again on TOC jump.
  - Why: clearing search on every TOC click was jarring; always-visible chips ate vertical space; collapsed-by-default panel hid search.
  - Impact: `assets/js/filter.js` + `assets/css/style.css` only. No data/build-script changes.
- **2026-06-09 — Removed dead `citations/*.txt` bibtex links (GSC 404)**
  - Decision: stripped all 85 `[bibtex](.../citations/X.txt)` markdown links (relative + external awesome-NeRF) from entry descriptions across 7 data files. Deleted whole ` | [bibtex](...)` segment + trailing `<!---key-->` comment. Kept paper-title + `[github]` links.
  - Why: inherited from copying yenchenlin/awesome-NeRF rows; the `.txt` files never existed in this repo, so every link 404'd. GSC flagged `object-nerf.txt`; the rest would follow.
  - Impact: 7 `data/**.yml` files. `check-links.js` only checks the `url` field, not markdown links in descriptions, so these were never caught.
- **2026-05-22 — Vocab expansion for disciplines + entry-type expansion**
  - Decision: Extended closed enums. `workflow`: added previs, look-dev, face-capture, match-move, roto, projection-mapping, creative-coding. `output`: added medical, jewelry, fashion, automotive, event-experiential. `entry_type`: added service, book, hardware, paper. `platform`: added vr.
  - Why: discipline taxonomy from user covers pre-prod through R&D; verticals (jewelry/fashion/auto/event), books (Brinkmann/Wright/HDRI Handbook), services (Ten24/Volucap), and hardware (Vicon/Bolt/LED panels) all needed first-class slots.
  - Impact: schema/vocab.yml + schema/entry.schema.json both updated. Backwards-compatible (only additions).
- **2026-05-22 — Legacy/Defunct subsection added to §12**
  - Decision: New `legacy-defunct-software` subsection in software-reference. Contains XSI, Softimage|3D, PowerAnimator, 3D Studio DOS, Mental Ray, Shake, Combustion, Toxik, eyeon Fusion, Final Cut Pro 7, Stingray, Lumberyard, Toonz, Animo, Mudbox, Carrara, Bryce, Vue, BodyPaint, etc. Plus archive.org/WinWorldPC/Aminet reference entries. `deprecated: true` flag used where appropriate.
  - Why: historical software lineage matters for pipeline understanding; user explicitly requested.
  - Impact: new subdir + yml. Mirrors not used (no obvious topical home).
- **2026-05-22 — Scientific viz subsection added to §12**
  - Decision: New `scientific-viz-software` subsection. Molecular (PyMOL, ChimeraX, VMD, Molecular Nodes, mMaya), volumetric/medical (Slicer, ParaView, VTK, Horos, ImageJ/Fiji), astronomy (Celestia, Stellarium, SpaceEngine, NASA Eyes), CFD, GIS (QGIS, CesiumJS, BlenderGIS), dataviz, plus educators (Drew Berry, Janet Iwasa, Clarafi, Brady Johnston).
  - Why: user explicitly requested PyMOL/ChimeraX and "others"; warrants own bucket.
  - Impact: new subdir + yml.
- **2026-05-22 — Pre-production tools subsection added to §08**
  - Decision: `pre-production-tools` under art-design-visual-storytelling. Storyboard Pro, Storyboarder, FrameForge, Boords, StudioBinder, ShotPro, ShotDeck, Cinetracer, Cine Designer, MM Scheduling, Celtx, Final Draft, Fade In, Highland, WriterDuet, PureRef, Eagle, Milanote, Are.na, FilmGrab, plus channels (LFTScreenplay, Every Frame a Painting, VES, ASC).
  - Why: discipline taxonomy mapping. No existing home for storyboard/script/previs.
  - Impact: new subdir + yml.
- **2026-05-22 — Compositing-learning subsection added to §05**
  - Decision: `compositing-learning` under vfx-compositing-virtual-production. NukePedia, Hugo's Desk, CompositingMentor, Foundry Learn, Steve Wright, VFX Apprentice, plus canonical books (Wright, Brinkmann, Lanier) and breakdown sites (Befores & Afters, Art of VFX, Cinefex).
  - Why: comp tutorials and books needed dedicated home.
  - Impact: new subdir + yml.
- **2026-05-17 — Local memory system created**
  - Decision: per-project /memory dir alongside global ~/.claude memory.
  - Why: project-scoped persistence, easier to commit/share if desired.
  - Impact: CLAUDE.md updated to read/write this dir each session.

- **2026-05-17 — Handoff growth docs created**
  - Decision: created `/handoff/` dir at repo root with 13 markdown files covering all non-code growth (prelaunch hygiene, v1.0.0 release, awesome lists, reddit, discord, HN, twitter/bluesky, newsletters, product hunt, ongoing growth, KPIs, copy snippets, index README).
  - Why: owner ships code; non-code launch/growth gets handed off to an operator. `pub_plan.md` Part 2 was a 10-bullet stub — not executable.
  - Impact: operator with zero project context can execute end-to-end. Templates use `[BRACKETS]` for fill-ins, inline `[ ]`/`[x]`/`[-]` checkboxes for tracking. `copy-snippets.md` is single source of truth for taglines/pitches. `pub_plan.md` updated with redirect line to `/handoff/`.
  - Files: `handoff/README.md`, `handoff/00`–`10`, `handoff/copy-snippets.md`, `pub_plan.md` (1 line redirect).

- **2026-05-17 — Mobile collapsible graph panels**
  - Decision: legend `.g-panel` hidden by default on ≤720px; FAB toggle (`#panel-toggle`) slides it up as bottom sheet. Info card gets close (×) button on mobile; also positioned as bottom sheet above the FAB.
  - Why: legend was eating ~40vh of phone viewport, blocking the 3D canvas.
  - Impact: `assets/graph.html` (toggle button + inline JS), `assets/css/graph.css` (FAB styles + media query rewrite). Copied to `_site/`. Desktop UX unchanged.

- **2026-05-18: Humanized user-facing text, banned em-dashes and AI tells**
  - Decision: Removed all em-dashes from `data/**/*.yml` and user-facing scripts (`render.js`, `build-html.js`, `build-section-pages.js`, `build-feed.js`, `build-llms-txt.js`, `build-og-images.js`). Titles use `: ` separator; descriptions use `. ` + capitalized next word. Stripped AI tells (`comprehensive/robust/powerful/seamless/leverage/utilize/cutting-edge/state-of-the-art/the ultimate/and more/and beyond`). OG image splitter switched from ` — ` to `: `.
  - Why: Card copy read AI-generated. User wants human-sounding text. Em-dashes are the canonical AI tell.
  - Impact: 104 files changed, 436 lines edited. README + `_site/` regenerated, 0 em-dashes remaining in user-facing output. Rule codified in `CLAUDE.md` § "Writing style" and `preferences.md`. Internal docs/comments exempt.
  - Files: `CLAUDE.md`, `memory/preferences.md`, `scripts/_archive/humanize-once.js` (one-shot helper kept for reference).

- **2026-05-17: Reverted README slim mode**
  - Decision: dropped Step 3 (`render.js --mode=lite`) from `build.sh`. README.md is the full catalog again (~734 KB).
  - Why: user confirmed full README renders fine on GitHub + mid-tier phones. "Uh oh" failure window in changes.md was likely intermittent/old. Quick-reference value > landing-page polish for this repo.
  - Impact: build.sh shorter. README grep-able again. Lite renderer code in render.js kept (dead but harmless) in case needed later.
  - Files: `build.sh`, `README.md` regenerated.

- **2026-05-20: Added 14 cloud render farm services to pipeline-software**
  - Decision: Bundled commercial cloud render farm services into existing `pipeline-software` subsection alongside farm-manager software (Deadline, Royal Render, Tractor, Coalition) rather than spinning up a separate `render-farm-services` subsection.
  - Why: `render-farm` tech tag already established here; one cluster easier to scan; avoids 12-software-reference.yml structural edits + mirror plumbing for ~14 entries.
  - Entries: Fox Renderfarm, RebusFarm, GarageFarm.NET, Ranch Computing, Super Renders Farm, Pixel Plow, GridMarkets, Conductor Technologies, iRender, Chaos Cloud, Maxon One Cloud, AWS Deadline Cloud, Drop & Render, OTOY Render Cloud (ORC). All `entry_type: tool`, `license: Paid`, platforms `web`+`cloud`, tech tags `render-farm`+`cloud` (+`pipeline` for Conductor).
  - Files: `data/12-software-reference/pipeline-software/01-pipeline-software.yml`.
