# Decisions

Architectural / structural decisions w/ rationale + date.

## Format
- **YYYY-MM-DD — Title**
  - Decision:
  - Why:
  - Impact:

## Log
- **2026-06-12 — Enrichment sweep 7C = unreal-engine-resources (DONE). §07 COMPLETE.**
  - Decision: User chose approach **B (full hand-curation)** for 7C too (consistency with 7B). Hand-curated all 4 unreal chunks (184 entries) per the per-entry recipe.
  - Work: added `platform` to every entry (the filter-UI win) — engine plugins/tools/asset-source/sample-projects/code references → `win, mac, linux`; docs/snippets/guides/channels/community-lists → `web`; mobile-target plugins → `ios`/`android` (Swipe, Ps Facebook Mobile, MobileUtils → ios+android; Ps Replay Kit → ios; AndroidNative → android); Windows-only tools → `win` (Unreal Library, UE4 Binary Builder, Unreal Version Changer); win+linux for Ue4 Docker. Added `skill` to 13 educational entries (9 channels + Working with Data + Tom Looman + GameDev.tv C++ course + Unreal Engine Learning texture-graph tutorial). Did NOT force `workflow` (no honest enum value for gameplay/engine code; left at 4, the texturing/material-authoring/animation ones).
  - Desc/junk fixes: rewrote ~30 "Unreal Engine Documentation." name-restaters to say what each doc covers (GAS, Mass Entity=ECS, State Tree, Mutable, etc.); fixed InstancedStruct placeholder ("Isn't available yet!"); cleaned PCG/Alex-Forsythe link-salad + `(🆓 🥇)` rating badges; fixed NiagaraUIRenderer `|` junk, "pluging" typo, UE4 Custom Gravity ` : ` restater; **fixed wrong copy-paste desc on Locus Replication Graph** (was a Unity Addressables blurb); fixed Async Loading Screen truncation; trimmed hype ("just works!", XJ music). Removed bogus `xr` output tag on Quests (a quest system).
  - Impact (unreal subsection): platform 11→184 (every entry filterable), skill 0→13, output 178→184, empty-tags 0, junk 0. **§07 whole now: platform 811/812 (~99%), skill 70, output 812/812.** Validation passes (281 warnings, all pre-existing). 4 files changed, uncommitted (user commits).
  - FLAG (surfaced, not auto-resolved): "Unreal Engine" (channel UCBobmJyzsJ6Ll7UbfhI4iwQ) and "Unreal Engine Official YouTube" (@UnrealEngine) in chunk 04 are the same official channel = likely duplicate. Left both (deletion is destructive); user decides consolidation.
  - NEXT: §02 modeling (worst-first), then §04 → §06 → §08 → §01 → §09 (paper dumps) → §05 → §11 → §03.
- **2026-06-12 — Enrichment sweep 7B = unity-engine-resources (DONE)**
  - Decision: User chose approach **B (full hand-curation)**, scope **7B Unity only** (stop before 7C unreal). Hand-curated all 9 unity chunks (452 entries) per the per-entry recipe.
  - Work: added `platform` to every entry (the filter-UI win) — Unity editor plugins/runtime libs/code samples → `win, mac, linux`; docs/blogs/gists/Trello/PDF/profile pages → `web`; mobile-target plugins → `ios`/`android`; macOS-only (KlakSyphon) → `mac`; Linux (Unity3DVim) → `linux`; Windows-only (UnityStudio, NVIDIA HairWorks, OptiX, S7ProSim, VS Toolbox) → `win`. Added `skill` to 10 genuinely educational entries (Complete Unity 2018 tutorial=beginner, 50 Unity Tips=intermediate, UnityGraphicsProgramming Vol.2=advanced, Simple ECS=beginner, plus 6 tutorial-style YouTube channels). Did NOT force `workflow` (no honest enum value for gameplay/engine code; left at 28, mostly the pre-existing modeling/animation/texturing ones). Filled missing `output: games` + `platform` on the 16 texture/material-authoring entries that had neither.
  - Junk/desc fixes: stripped `(#PLUGINS)`/`(#2D)`/`(#NETWORKING)`/`(#ANIMATION)`/`(#ASSET-STORE)`/`(#DEPRECATED)` tail tags, `![Official](UnityResource16x16.png)` image junk, `:moneybag:`/`:cool:` emoji shortcodes, embedded asset-store URLs, link-salad descs. Fixed wrong copy-paste descs (xNode BehaviourTree had log4net text; Pitaya/Hydrogen had duplicated descs), placeholder desc (`(#TERRAIN)` only), truncations (UnityTimer, Unity Pause Menu, Unity 2D Platformer, GameFramework, Unity VS Toolbox, Bolt), mangled names (Ep Path Finding3 D→EpPathFinding3D, Unity2 D→Unity2D, foo.md→descriptive, all-caps EDITORVR/HOW TO SET UP, Cheatografy→Cheatography, iOS-and-tvOS→Unity Remote 4). Rewrote ~120 name-restating/marketing descriptions to caveman-lite.
  - **09 over-cap fix (ADR-0001):** chunk 09 was 59 entries. Split thematically: kept 43 (editor tools, sample game projects, channels) in 09, moved the 16-entry texture/material-authoring cluster into new **chunk 10**. All chunks now ≤50.
  - Impact (unity subsection): platform 17→452 (every entry filterable), skill 0→10, output 438→452, empty-tags 0, junk 0. Validation passes (281 warnings, all pre-existing). 10 files changed/added, uncommitted (user commits).
  - NEXT: 7C unreal-engine-resources (4 chunks, 184 ent) — re-confirm scope, then §02 worst-first. 7C platform≈11, skill=0 currently.
- **2026-06-11 — Enrichment sweep Phase 2 = §07 game-dev (PARTIAL, paused)**
  - Decision: §07 is 812 entries (not ~600). Split into 7A non-engine subsections (19 files, ~290 ent), 7B unity-engine-resources (9 chunks, 452), 7C unreal-engine-resources (4 chunks, 184). **7A DONE**; 7B/7C NOT started. Work paused at user request; full handoff written to `disregard/handoff-enrichment-sweep.md`.
  - Work (7A): added `platform` everywhere (the filter-UI win), `skill` to educational entries (channels/tutorials/courses), `workflow` only where honest (`creative-coding` for programming, `animation`/`rendering` for those). Fixed truncated descs (Turbulenz, North Star Kit), link-salad/restating descs (ViroCore retyped community→tool, Apple ARKit docs, VR tutorials), image junk (`![Official](...)` in GILES/Unity Multiplayer Packages), banned word "Comprehensive" in Godot Documentation readme_tags. Added `godot` freeform tech tag. Retyped misfiled (hardware: North Star/Ultraleap; book: Unity in Action / Make Your Own Pixel Art; tool/inspiration on networking sample repos, resolving their FLAG notes).
  - Impact (§07 whole): platform ~36→203, skill ~4→47. Validation passes (281 warnings, pre-existing). 636 unity/unreal entries still untouched (platform~0).
  - DEFERRED decision (re-ask next session): how to enrich the 636 uniform unity/unreal entries — (A) heuristic platform-by-entry_type + hand skill/desc [recommended], (B) full hand-curation, (C) platform-only. See handoff §3.
  - Carry-forward flags: NeRF/GS paper dumps in §10 photogrammetry/02 + gaussian-splatting overlap §09/papers (standardize+relocate in §09 phase); over-cap chunks unity/09 (59) + plugin-marketplaces/01 (51); vfxcamdb.com dupe across 2 §10 subsections.
- **2026-06-11 — Catalog-wide searchability enrichment sweep: Phase 1 = §10 tools-pipeline**
  - Decision: New multi-phase sweep enriching §01–§11 (§12 already done) for filter-UI searchability. User chose: section-by-section deep, worst-first; add `skill` facet to educational entries; expand thin descriptions (not just defects). Phase 1 done = all 16 §10 chunks (325 entries).
  - Work: filled missing tag facets (esp `platform`, the filter-UI win), corrected `entry_type` (38 individual Gumroad products mistyped `marketplace` → `plugin`/`asset-source` in plugin-marketplaces; USD apps/plugins retyped from `reference` → `tool`/`plugin`), added `license` where inferable, rewrote name-restating/junk descriptions, stripped leftover `[bibtex](./NeRF-and-Beyond.bib...)` broken links (the 2026-06-09 pass only caught `.txt`, missed `.bib`) and `[![][repo]]` badge junk, fixed mangled names (Ne RF Py Torch → NeRF-PyTorch, Mega Sa M → MegaSaM, Wrap Defromer → Wrap Deformer), fixed wrong tags (Tangram Heightmapper had bogus `blender`/`blender-addon`; F Spy Maya `fx`→`match-move`).
  - Impact: §10 platform coverage 27%→80% (88→261 entries), workflow 13%→36%, output 10%→36%. Zero empty `tags: {}`, zero badge/bibtex junk left in §10. Validation passes (258 warnings, all pre-existing freeform-tech + cross-chunk-dupe notices). README/_site untouched.
  - Deferred / flagged for later: (1) ~45 pure NeRF/GS research papers in `photogrammetry-scanning/02` left without paper-facets (got junk/desc fixes only). These + the GS/photogrammetry paper dumps overlap §09/papers and are relocation+dedup candidates for the §09 phase. (2) `plugin-marketplaces/01` holds 51 entries (>50 cap) beside an empty `02` chunk; validator only warns. Consider moving overflow.
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
