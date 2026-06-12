# User Prompts Log

Every user prompt/question, verbatim, w/ timestamp + short answer note.

## Format
### YYYY-MM-DD HH:MM
**Prompt:**
> (verbatim)

**Answered:** (1-line summary of what was done)

---

### 2026-06-12 22:30
**Prompt:**
> make plan to work on the next chunk of work

**Answered:** Planned + started §04 lighting enrichment (next worst-first section). 6 phases chunk-by-chunk; over-cap chunk 01 fixed by moving 1 overflow to chunk 02 (both user-confirmed). **Phase 1 DONE** (4 tiny subsections, 15 ent): added platform/skill/output, fixed CNDL empty `tags:{}`, tightened 2 descs. Validation passes (304 warnings, no new). Stopped for go-ahead before Phase 2.

### 2026-06-12 22:50
**Prompt:**
> yes please

**Answered:** **Phase 2 DONE** (rendering-shader-theory/01, 51→50 ent). Over-cap fixed (moved "A Trip Through The Graphics Pipeline" → chunk 02, now 50). platform on all 50, skill on educational, output where implied, 3 missing-workflow fixed, stripped wrong blender tags on IOR List + Blender&ACES. §04 platform 30→79, skill 16→33. Validation passes (304 warnings). Stopped before Phase 3.

### 2026-06-12 23:05
**Prompt:**
> yes please

**Answered:** **Phase 3 DONE** (rendering-shader-theory/02, 50 ent). Unity shader repos got platform[win,mac,linux]+output:games; retyped 7 RELOCATE-candidates inline (5 tool, 2 plugin) + Anatole→inspiration; stripped (#TAG)/`:moneybag:`/link-salad junk + MoonRay badge; cleaned 6 NPR channel descs; kept MoonRay+CopperLicht flagged for §12. Fixed 2 YAML inner-colon descs. §04 platform 79→121, output 19→47, skill 33→48. Validation passes (305 warnings). Stopped before Phase 4.

---

### 2026-06-12 00:05
**Prompt:**
> read the handoff document and make a place to do the next chunk of work. Ask me question if needed

**Answered:** Read handoff; re-asked the §3 open decision. User chose B (full hand-curation), scope 7B Unity only. Wrote plan, starting 7B chunk 01.

### 2026-06-11 23:55
**Prompt:**
> please continue [then, later:] pause work for now, write a complete handoff document for the next session to continue where we left off. All decisions deferred but documented in the handoff md file

**Answered:** Continued the sweep into §07 game-dev. Completed 7A (19 non-engine subsections, ~290 ent): platform + skill facets, fixed truncated/link-salad descriptions, retypes, junk strips. §07 platform ~36→203, skill ~4→47. Validation passes. 636 unity/unreal entries deferred (open A/B/C decision). Paused; wrote full handoff to `disregard/handoff-enrichment-sweep.md`. Updated decisions.md + project.md.

### 2026-06-11 23:30
**Prompt:**
> see the last few changes from the files in the memeory folder. I want to do something similar. I want to make the entries more searchable, add more relevant tags where necessary. Do an audit please to check where things can be fleshed out even more

**Answered:** Audited §01–§11 (§12 already enriched). Found low filter-facet coverage catalog-wide (workflow 35%, platform 40%, output 48%, skill 1.6%). Planned section-by-section deep enrichment (plan approved). Phase 1 = §10 tools-pipeline (all 16 chunks, 325 entries): filled platform/workflow/output facets, fixed entry_types (Gumroad products marketplace→plugin/asset-source, USD reference→tool/plugin), added license, rewrote thin/junk descriptions, stripped bibtex/.bib + badge junk, fixed mangled names + wrong tags. §10 platform 27%→80%. Validation passes. Stopped for confirmation before §07. See decisions.md.

### 2026-06-11 22:30
**Prompt:**
> add https://www.lightmap.co.uk/

**Answered:** Already in catalog (Lightmap HDR Light Studio, misc-3d-utilities-software). Improved thin description + added lighting-rendering-shaders/rendering-shader-theory mirror. Validation passed.

### 2026-06-11 22:45
**Prompt:**
> similarly, check other software like this as well, missing details, gaps or anything

**Answered:** Planned + ran 4-phase §12 quality cleanup (scope: structural + uninformative, relocate misfiled, chunked). A: 5 malformed/relocations (2 NeRF papers → §09 papers, dropped PubNub junk). B: +license on 13 software. C: +tags on 20 (8 active + 12 legacy). D: rewrote 8 name-restating/malformed descs + fixed Gigapixel wrong tags. 14 data files, validation passes, README untouched. See decisions.md.

---

### 2026-06-09 02:00
**Prompt:**
> 3d.devanshutak.xyz — fix the broken citations/citations/object-nerf.txt link in that project.

**Answered:** Root cause = inherited awesome-NeRF `[bibtex](./citations/*.txt)` links to files that never existed. Stripped all 85 (relative + external) across 7 data files; rebuilt; 0 remain in README/_site.

---

### 2026-06-09 02:30
**Prompt:**
> (1) TOC click clears search, stop that. (2) keep filter panel open by default. (3) put filter chips inside a collapsible heading, collapsed by default.

**Answered:** filter.js + style.css: TOC click preserves search+filters; panel open on desktop / collapsed on mobile; chip groups behind collapsed-by-default `#filter-groups-toggle` (auto-opens on hash-restore). Built + verified.

---

### 2026-06-09 02:45
**Prompt:**
> When user clicks TOC elements the page scrolls down, make "Filter by category, license, platform…" also collapse when that happens. Update project and memory markdown files.

**Answered:** Added `bar._setGroupsOpen(false)` to `setupTocClickHandler` so chip groups collapse on TOC jump. Updated decisions.md + user-prompts.md.

---

### 2026-06-03 20:30
**Prompt:**
> add
> https://www.compositingacademy.com/
> https://vfxplatform.com/
> https://vfxcamdb.com/

**Answered:** Added Compositing Academy → §05 compositing-learning (tutorial); VFX Camera Database → §10 matchmoving-tracking (reference); VFX Reference Platform → §10 pipeline-standards (reference). Validation passed.

---

### 2026-06-03 12:40
**Prompt:**
> add https://www.katexagoraris.com/more-fx-help if not already present

**Answered:** Not present. Added "Kate Xagoraris (More FX Help)" to §11 youtube-houdini chunk 02. Free Houdini FX learning hub, entry_type reference, tech houdini. Validation passed.

---

### 2026-06-03 12:34
**Prompt:**
> add https://movingimagearts.com/8-bit-to-half-float-copycat/

**Answered:** Added "8-bit to Half Float CopyCat (Moving Image Arts)" to §05-vfx compositing-learning. Free Nuke CopyCat ML model + tutorial, entry_type tutorial, tech ai-generative. Validation passed.

---

### 2026-06-03 11:44
**Prompt:**
> https://github.com/AcademySoftwareFoundation/xstudio / https://www.nukepedia.com/ / https://github.com/AcademySoftwareFoundation/openrv / https://github.com/SacTools/SAC-_SCRIPT_AUDITOR — add all these

**Answered:** Added OpenRV + xStudio to §12 viewers-file-utilities (review/playback), SAC Script Auditor to §12 vfx-compositing-software (Nuke tool, entry_type plugin). Nukepedia already listed (2x), skipped. Validation passed.

---

### 2026-05-22
**Prompt:**
> add 3d coat, cozy blanker, retopology software; shotgrid and pm tools; defunct software section (XSI/Softimage); HDR/PTGUI/Debevec/photogrammetry tutorials; VCV Rack, FotoSketcher, laser scanning; full discipline taxonomy (pre-prod through R&D). Deep dive, use as many agents as needed.

**Answered:** Dispatched 10 parallel research agents. Consolidated candidate list at `disregard/expansion-candidates-2026-05-22.md`. ~300 candidates grouped by topic, ★ priority marked, ⚠ existing flagged. Raised 7 structural decisions (legacy subsection, vocab gaps, studio/hardware/book entry types) — awaiting answers before yml writes.

---

### 2026-05-22
**Prompt:**
> 1. sub section 2. vocab additions 3. ok 4. yes; add editing tools (BorisFX/Vegas/Avid + more BorisFX); add Flamenco; add scientific viz (PyMOL/ChimeraX/etc).

**Answered:** Approved all 4 structural decisions and added named items. Extended vocab + schema (workflow: previs, look-dev, face-capture, match-move, roto, projection-mapping, creative-coding; output: medical, jewelry, fashion, automotive, event-experiential; entry_type: service, book, hardware, paper; platform: vr). Created 4 new subsections: §12 legacy-defunct-software (~27 entries), §12 scientific-viz-software (~45 entries), §08 pre-production-tools (~30 entries), §05 compositing-learning (~12 entries). Added editing tools (Avid Media Composer, Vegas Pro, Resolve Studio, Lightworks, HitFilm, iMovie, Apple Motion, Compressor, Premiere Rush/Elements, CapCut, Descript, VEED, Clipchamp, VSDC, Filmora, Olive, Avidemux), BorisFX missing items (Mocha AE, Optics, Particle Illusion, Title Studio — note: Sapphire/Continuum/Mocha Pro/Silhouette already existed), Flamenco confirmed already present, 3D Coat suite (3D Coat, Textura, Print) + Cozy Blanket + Valence 3D + Quad Remesher + RetopoFlow + ZWrap + Meshmixer to retopo-uv-software, HDRI/Debevec/PTGui/Hugin/HDR Light Studio/sIBL/HDRI Handbook + laser scanning (Leica Cyclone, FARO SCENE, Trimble RealWorks, ReCap, Geomagic) + heritage (CyArk, Open Heritage 3D, Smithsonian, Stanford Digital Michelangelo) + volumetric services (Volucap, Metastage, 4DViews, Depthkit, Ten24, Eisko, Triple-I) to photogrammetry-scanning, pipeline gaps (Frame.io, SyncSketch, Cinesync, Filestage, RV, 5th Kind CORE, Cerebro, Flow Capture, Hansoft, Anchorpoint, Diversion, Snowtrack, Colorfront, FilmLight Daylight, Sohonet ClearView) to pipeline-software, VP/mocap additions (Aximmetry, Brainstorm InfinitySet, Vu Studios, ARwall, Mo-Sys/Stype/Ncam/ZEISS/Lightcraft, Brompton Tessera, Megapixel Helios, ROE Visual, Vicon, OptiTrack, Xsens, Rokoko, Sony Mocopi, Manus, StretchSense, Faceware, MRMC Bolt, MotionBuilder) to virtual-production-software, audio expansion (Ableton, FL Studio, Logic, Pro Tools, Studio One, Cubase, Bitwig, Ardour, LMMS, Cakewalk, VCV Rack, Pure Data, Max/MSP, SuperCollider, Sonic Pi, TidalCycles, Strudel, iZotope RX, FabFilter, Krotos, Sound Particles, GameSynth, Dolby Atmos Renderer, Flux Spat, Resonance, FotoSketcher) to audio-software, verticals (VRED, Alias, ICEM Surf, Lumiscaphe, MatrixGold, JewelCAD, 3Design, Firestorm, Clayoo, Marmoset, CLO 3D, Browzwear, Optitex, ChyronHego, Ross XPression, Avid Maestro, MetaHuman Animator, Faceware Studio) to 3d-software-paid. Total ~250 new entries. All 14 tasks completed. Validation: 213 warnings, 0 errors.

---

### 2026-05-18
**Prompt:**
> add https://github.com/TencentARC/Pixal3D https://github.com/playcanvas/supersplat https://github.com/MrNeRF/LichtFeld-Studio

**Answered:** Added Pixel3D to 09-ai-ml/3d-generation, LichtFeld Studio to 10-tools-pipeline/gaussian-splatting-nerf. SuperSplat already existed in photogrammetry-scanning — skipped. Validation passed.

---

### 2026-05-17
**Prompt:**
> Create a persistent memory system for yourself in the current folder. Make a /memory directory with files organized by category: goals.md, tech_stack.md, decisions.md, preferences.md, tools.md, agents.md, and plugins.md.
>
> Create a user-prompts.md as well where you save every user prompt and question answered as is.
>
> Write a CLAUDE.md that instructs you to update these files after every prompts and read these files at every session the start of and update them at the end of a session.

**Answered:** Created /memory with 7 category files + user-prompts.md. Updated CLAUDE.md with read-at-start / write-at-end protocol.

---

### 2026-05-17
**Prompt:**
> read changes.md, find why the readme.md is so short? Is it possible to keep it long, I want to to be sufficient for quick reference. Don't want to make it less useful that it used to be like

**Answered:** Explained slim mode was forced by 712KB README breaking GitHub renderer (changes.md Step 3). Outlined expansion options (bump LITE_PICKS, add ToC, hybrid).

---

### 2026-05-17
**Prompt:**
> you say this, but for me it was loading the full readme correctly, why do you think that might be the case?

**Answered:** Corrected — GitHub "Uh oh" is intermittent render-pipeline timeout, not hard size cap. Caching, server load, anchor count all factor. Slim mode defensible only for reliability+speed, not size ban.

---

### 2026-05-17
**Prompt:**
> I think faliure window is an old thing, we can expand it, on 4-5 old mid tier phones as well the full readme was loading perfectly

**Answered:** Offered 3 paths (A full revert / B expanded lite / C hybrid). Recommended C.

---

### 2026-05-17
**Prompt:**
> A

**Answered:** Removed `--mode=lite` step from build.sh. Regenerated README.md as full catalog (734 KB). Logged decision in decisions.md.

---

### 2026-05-17
**Prompt:**
> verify

**Answered:** Ran `bash build.sh` end-to-end + `validate.js`. All artifacts emitted clean. README.md 716.8KB full catalog persists.

---

### 2026-05-17
**Prompt:**
> check if graph is working or not?

**Answered:** Verified graph.html/json/js/css all serve 200 locally; esm.sh deps reachable; 3328 nodes / 11164 edges. WebGL render needs real browser to confirm.

---

### 2026-05-17
**Prompt:**
> UI for graph on phone is broken, the sidebar is taking too much space, make it collapsable

**Answered:** Added mobile FAB toggle for legend panel (slides up as bottom sheet); info card gets close button + bottom-sheet positioning on ≤720px. Edited `assets/graph.html` + `assets/css/graph.css`, copied to `_site/`.

---

### 2026-05-17
**Prompt:**
> ohkay, now on to the non-code things that can be done, please tell me what can be done to help increase the reach of this

**Answered:** Outlined 9-phase growth plan (prelaunch hygiene → quiet launch → awesome lists → reddit → discord → HN → twitter/bluesky → newsletters → PH → ongoing). 4-week sequence. Offered to draft handoff docs.

---

### 2026-05-17
**Prompt:**
> Make plan to make detailed md files for all the steps going forward, something that can be handed off. We will do the code changes and the rest we will hand off. Forums, Social media, newsletters, everything

**Answered:** Entered plan mode. Asked 3 clarifying Qs (location → /handoff/, copy → templates w/ brackets, tracking → inline checkboxes). Approved plan covered 13 files. Executed: created handoff/ dir + 13 markdown files (README, 00–10, copy-snippets). Updated pub_plan.md with redirect line. Total ~1,840 lines of operator playbook.

---

### 2026-05-17
**Prompt:**
> put handoff folder in gitignore

**Answered:** Added `handoff/` to `.gitignore` line 13. Verified ignore takes effect. (Initially over-added changes.md/pub_plan.md/memory/; reverted to just handoff/ as requested.)

---

### 2026-05-20
**Prompt:**
> look up and add the latest render farms (check the internet for latest news about which ones are available and support which software and render engines). Give me a list which I can approve items from

**Answered:** Web-searched 2026 cloud render farm landscape. Presented 13 candidates grouped (multi-software SaaS, Houdini/pipeline-grade, IaaS, engine-native, engine-specific). Existing in repo: SheepIt, OTOY Octane Render Cloud, Deadline/Royal Render/Coalition/Tractor (managers).

---

### 2026-05-20
**Prompt:**
> add https://home.otoy.com/render/orc/ as well please and yes, add the rest too

**Answered:** Added 14 render farm service entries to `data/12-software-reference/pipeline-software/01-pipeline-software.yml` (after Tractor): Fox Renderfarm, RebusFarm, GarageFarm.NET, Ranch Computing, Super Renders Farm, Pixel Plow, GridMarkets, Conductor Technologies, iRender, Chaos Cloud, Maxon One Cloud, AWS Deadline Cloud, Drop & Render, OTOY Render Cloud (ORC). All `entry_type: tool`, `license: Paid`, `cloud` + `render-farm` tech tags, `web`+`cloud` platforms. Validation passed (only freeform-tech warnings).

---

### 2026-05-20
**Prompt:**
> log it, I will commit

**Answered:** Logged to memory/user-prompts.md + decisions.md. No commit (user will handle).

---

## 2026-05-21

> You think these software fit our list? [browzwear, tailornova, style3d, lectra gerber, stylecad, clo3d, marvelousdesigner] - check and let me know

**Answered:** Clo3D + Marvelous already in 3d-software-paid. Style3D fits (CLO competitor, exports to CG). Browzwear borderline (fashion-tech audience). Tailornova/Lectra Gerber/StyleCAD = 2D pattern CAD, skip.

---

> yes please [add Style3D]

**Answered:** Added Style3D to data/12-software-reference/3d-software-paid/01-3d-software-paid.yml after Clo3D. Validation passed.

---

> add https://www.youtube.com/@regularmenthol and https://www.youtube.com/@wttrlabs

**Answered:** Both added to data/11-learning-community/youtube-houdini/02-youtube-houdini.yml as Houdini FX channels (confirmed via user). Validation passed.

---

## 2026-05-22

> add https://ai.meta.com/research/sam2/ and other relevant AI tools from meta (look up please)

**Answered:** Added SAM 2 + CoTracker to ai-assisted-cg-tools; AudioCraft to ai-audio-music (deleted duplicate from §12 software-reference per existing RELOCATE note); Emu Video to video-generation; PyTorch3D, DINOv2, Meta 3D Gen to ml-for-cg. Validation passed.

---

> corridorkey it should be in compositing, right? Not in Motion Graphics, no?  Look up other AI roto and keying tools as well

**Answered:** Moved CorridorKey + Sammie Roto 2 out of motion-graphics-tools → ai-assisted-cg-tools (workflow: compositing, output: film-vfx). Added Robust Video Matting, Track Anything, DEVA, and Rotobot. Validation passed.

---

> any other roto, matchmove, tracking, keying tools that we don't have in our list?

**Answered:** Added Lockdown, Primatte Studio to matchmoving-tracking; Wonder Studio (Autodesk Flow) to ai-assisted-cg-tools. Mocha Pro, Silhouette, KeenTools were already canonical in §12 — added matchmoving-tracking mirrors via dual_listed_in. Validation passed.

---

> 2026-05-22: add spline 3d (the web 3d thing), play canvas, and other web based tools you can find

**Answered:** PlayCanvas, Spline AI, Babylon.js, Three.js, Needle, A-Frame, Verge3D, SculptGL, Tinkercad, Womp3D, Vectary already present. Added: Spline (core, 3d-software-free-tier), Bezi (3d-software-free-tier), Gravity Sketch (3d-software-free-tier), Cables.gl (3d-software-free), Wonderland Engine (game-engines-free-oss/02), 8th Wall + Mozilla Hubs (xr-ar-vr), Bitbybit (cad-software). Validation passed, 213 warnings (all pre-existing).

---

> 2026-05-22: read all the files in the project, update the project.md file as a complete guide to the project. All the technical details... in claude.md write that project.md needs to be read at the start of every session and needs to be updated after every change

**Answered:** Created `project.md` (master guide: filesystem map, data model, build pipeline, rules, NOs, pending tasks, design style, tech stack). Updated `CLAUDE.md` with mandatory "read project.md at session start, update after every change" rule.

---

### 2026-05-25
**Prompt:**
> read project.md and llm.txt

**Answered:** Read project.md; llm.txt missing, read _site/llms.txt instead. Flagged banned word "Comprehensive" on line 9.

---

**Prompt:**
> yes fix. Also, update the llms.txt to say that this is the biggest, most complete resource of this kind

**Answered:** Rewrote tagline in build-llms-txt.js to "biggest, most complete index..."; replaced "Comprehensive index:" → "Full index:". Regenerated.

---

**Prompt:**
> can you please check how we can improve llms.txt? Is is possible to make it longer? Will that help? What are the things that are missing from that?

**Answered:** Audited vs llmstxt.org spec. Recommended: free-form intro, Last updated, Optional split, bump picks 6→12, H3 subsection grouping in full file. User said skip Optional split, picks=12.

---

**Prompt:**
> Make a plan to improve to best present the project in the llms.txt spec

**Answered:** Plan at C:\Users\Devanshu\.claude\plans\make-a-plan-to-elegant-treasure.md. Approved. Implemented: PICKS_PER_SECTION=12; buildIntro() with Last updated (from `git log -1 --format=%cs -- data/`), entry count, topics list, format note; collectPerSubsection() → H3 subsection groups in llms-full.txt. Output: llms.txt 21.8 KB, llms-full.txt 441.8 KB, 142 H3s. Validate passed.

---

**Prompt:** (2026-05-25)
> add https://www.blender.org/download/demo-files/ and https://www.sidefx.com/learn/learning-library/content/ if not already present

**Answered:** Blender demo-files already in 01-assets/software-specific-libraries. Added "SideFX Learning Library" to 02-modeling/houdini-getting-started (sibling of existing /learn/ entry). Validate passed.

---

## 2026-06-02
- **Prompt:** add https://www.getpaint.net/
  - Added Paint.NET to `12-software-reference/design-software` (free Windows raster editor, layers). Validation passed.

---

## 2026-06-05
- **Prompt:** add https://cupnooble.itch.io/
  - Already covered: both Sprout Lands packs (asset + UI) exist in 01-assets/game-assets. Asked user whether to leave, consolidate, or add profile.
- **Prompt:** add as game dev assets, pixel art
  - Added Cup Nooble creator page to 01-assets/game-assets (Pixel Art, Free). Validation passed.

## 2026-06-12
- **Prompt:** Make plan to do the next chunk of work
  - Planned + started §07 sub-phase 7C (unreal-engine-resources, 184 ent). User chose approach B (full hand-curation). Plan approved.
- **Prompt:** make plan for next chunk of work
  - Planned §02 modeling enrichment (251 ent, chunk-by-chunk, worst-first). User chose: §02 next, chunk-by-chunk phasing. Plan approved. Started Phase 1 (blender-plugins-addons/01): 22 plugins, platform [win,mac,linux] on all, output where implied, stripped 4 badge-junk descs, fixed 2 truncations + smart-quote. Validation passed (281 warnings).
- **Prompt:** yes please
  - Phase 2 (blender-plugins-addons/02, 36 ent): platform on all, honest workflow/output, stripped 6 badges + mangled descs (Verge3D, Octane, Grove, Data FX). Validation passed (282 warnings, +1 benign godot freeform tag).
- **Prompt:** go
  - Phase 3 (blender-plugins-addons/03, 48 ent): platform on all, honest workflow/output, stripped 4 junk descs, removed an accidental dup Blender Kitti. Validation passed (282 warnings, no new).
- **Prompt:** yes
  - Phase 4 (blender-plugins-addons/04, 50 ent): platform on all; retyped 13 community→plugin + 2 tool→plugin; stripped ~12 junk descs/truncations; fixed mangled name. Surfaced RELOCATE flag (~16 misfiled dev tools/awesome lists). Validation passed (282 warnings). All 4 blender-plugins chunks done; §02 platform 58→198.
- **Prompt:** Pausing current session. update memory and handoff document, will pick up from that later
  - Logged Phase 4 + session pause to decisions.md/project.md/handoff. §02 paused after 4/13 phases (all blender-plugins done). Resume at Phase 5 (blender-tutorials/01). Open: RELOCATE structural decision.
- **Prompt:** continue, make plan for next chunk of work
  - Planned + executing §02 Phase 5 (blender-tutorials/01, 11 ent). User resolved RELOCATE decision = "move to proper homes" (deferred to a dedicated §02 relocation phase, batched with plugins-addons/04 misfiles); scope this turn = Phase 5 only. Plan approved.
- **Prompt:** yes go
  - Phase 5 done (both empty tags fixed, skill/platform/output added, User Manual link-salad desc rewritten). Reported lift, asked to proceed to Phase 6.
- **Prompt:** yes go
  - Phase 6 (houdini-plugins-tools/01, 22 ent) DONE: added `platform:[win,mac,linux]` to all 21 Houdini desktop tools + `web` on the cheatsheet; fixed Wormhole's wrong `web`→desktop; stripped 3 wrong `houdini-addon` tech tags on non-addons (Ffmpeg→cli, ZENO→node-based/physics, Cheatsheet→houdini); honest workflow (animation/fx/simulation/creative-coding/editing) + output (games on UE bridge); rewrote 3 marketing/name-restater descs (Microbot VDB, ZENO, Tech Art Winners). §02 platform 204→225. Validation passes (284 warnings, +2 benign freeform-tech).
- **Prompt:** yes
  - Phase 7 (material-creation-tools/01, 9 ent) DONE: platform on all 9 (web for browser tools SmartNormal/Architextures/ShaderExpo, win for TexGraph, win/mac Agisoft, win/mac/linux for Materia/Imogen/TextureSynth/NVIDIA); `output:archviz` on Architextures, `creative-coding` on ShaderExpo; trimmed 5 verbose/junk descs (NVIDIA CUDA run-on, Agisoft `[!download]` junk, Materia italic, Architextures, TexGraph). §02 platform 225→234. Validation passes (285 warnings, +1 benign `cli`).
- **Prompt:** go!
  - Phase 8 (houdini-more-tutorials/01, 15 ent) DONE: all already had `platform:web`; main win = `skill` on all 15 (beginner Cloner/USD, intermediate most, advanced Matrices/Muscles/MysteryPancake) + honest `workflow` (modeling/creative-coding/fx/animation/rigging/look-dev) + `tech:houdini`/`vex`. §02 skill 17→31, workflow 150→160. Caught `lookdev`→`look-dev` enum fix. Validation passes (297 warnings, +12 benign freeform-tech).
- **Prompt:** go
  - Phase 9 (houdini-essential-learning/01, 6 ent) DONE: added `skill` to 5 (Entagma already had it) — beginner SideFX, intermediate CGWiki/Farmfield, advanced Applied Houdini/John Kunz; fixed CGWiki broken desc grammar ("most Houdini reference"→"deepest"); removed banned readme tag "Comprehensive"→"All Levels"; John Kunz +creative-coding/redshift. §02 skill 31→36. Validation passes (298 warnings, +1 benign redshift).
- **Prompt:** go
  - Phase 10 (houdini-communities/01, 8 ent) DONE: chunk already well-tagged (all platform:web + tech:houdini). Light touch: added `skill:intermediate` to 3 educational entries (Daily Hip, Houdini Tricks, VFX Arabia); 5 community hubs left skill-less (mixed-level, correct). §02 skill 36→39. Validation passes (298 warnings, no new).
- **Prompt:** go
  - Phase 11 (houdini-vex-coding/01, 7 ent) DONE: added `workflow:creative-coding` to all 7 + `skill` to 5 missing (beginner 1MinVEX, intermediate cheat sheet/snippets/VFXBrain/startup, advanced HouPy/OpenCL). §02 workflow 160→167, skill 39→44. Validation passes (298 warnings, no new). FLAG: Python Startup Scripts url_status=unreachable.
- **Prompt:** go for 12 and 13
  - Phases 12+13 DONE. P12 (houdini-getting-started/01, 4 ent): platform:web + tech:houdini on all (had skill). P13 tail batch (8 chunks, ~12 ent): platform on all (c4d learning/tips=web, AEC4D=win/mac, TyFlow=win since 3dsMax is Windows-only, houdini tuts=web); skill added; retyped Rolando Gumroad marketplace→asset-source; output (film-vfx Rebelway/TyFlow/smoke). **§02 enrichment COMPLETE (phases 1-13).** §02 platform 234→251 (~100%, 251/251 ent), skill 44→52, output 53→55. Validation passes (304 warnings, +6 benign freeform-tech). Only §02 relocation phase remains.
- **Prompt:** make plan to work on the next chunk of work
  - Planned + executed the §02 relocation phase (the only remaining §02 work). Moved 17 misfiled entries: 12 dev/build tools + Blender dev docs → §10 misc-3d-utilities/01 (18→30); 2 ML lists → §09 ml-for-cg/01 (4→6); 3 refs → §11 communities-forums new chunk 03 (chunks 2→3). Stripped RELOCATE notes; pure move, no dual_listed_in. Sources: plugins-addons/04 50→35, tutorials/01 11→9. Validation passes (304 warnings, 0 RELOCATE flags remain). §02 now fully COMPLETE. NEXT: §04 lighting enrichment.
- **Prompt:** make plan to do the next chunk of work (2026-06-12)
  - Planned + executed §04 Phase 4 (rendering-shader-theory/03, 50 ent). All entries only had workflow:rendering. Added platform to all 50 (web for refs/papers/blogs/online-editors/Three.js+GLSL libs; [win,mac,linux] for native tools SHADERed/CodeXL/Magnum/glslViewer/Three Blender + Unity-repo + UE4 + Houdini entries). Retyped 4 Blender addons reference→plugin (Extra Lights, Node To Python, Blender Addon PBR, Lily Surface Scrapper) + stripped [![market]]/[![][mit]] badges. 10 research papers got year + skill:advanced + platform:web (matched §04 Quadtrees precedent: no `paper` tech tag). output:games on 5 Unity repos + CelShader (+illustration). skill on educational courses/blogs/tutorials. Fixed 6 truncated descs + "Ust learning" typo + dangling @patriciogv twitter links. Chunk 03 lift: platform 0→50, skill 0→21, output 0→8, empty-tags 0, junk 0. §04 now platform 171, output 55, skill 69. Validation passes (312 warnings, +7 benign freeform-tech). STOPPED for go-ahead. Remaining: P5 (chunk 04, 48), P6 (chunk 05, 28), §04 relocation phase.
- **Prompt:** go (2026-06-12)
  - Executed §04 Phase 5 (rendering-shader-theory/04, 48 ent). All had only workflow:rendering. platform on all 48 (web mostly; win ShaderTool/Shader Designer; [win,linux] RenderDoc; [win,mac,linux] KodeLife/Synthclipse); skill on 26 educational; 4 papers got year (2005/2005/2006/1996). 2 retypes: RenderDoc reference→tool, glslViewer-writeup tool→reference. Fixed Khrnos→Khronos typo + link-salad/hype/truncation descs. Kept all 5 RELOCATE notes (enriched in place). Chunk 04 lift: platform 0→48, skill 0→26. §04 now platform 219, output 55, skill 95. Validation passes (312 warnings, no new). STOPPED for go-ahead. Remaining: P6 (chunk 05, 28 ent) then §04 relocation phase.
- **Prompt:** go (2026-06-12)
  - Executed §04 Phase 6 (rendering-shader-theory/05, 28 ent) = **final §04 enrichment chunk.** 6 channels already had platform:web; added web to other 22; skill on 20 educational; output archviz (xeokit) + games (ThinMatrix); NeRF-Tex year:2021; fixed typos (tutuorial/OpenG/doubled "real part") + 6 restater/truncated descs + stripped "awesome" hype; kept Takua RELOCATE? note. Chunk 05 platform 6→28, skill 0→20. **§04 ENRICHMENT COMPLETE (6/6): platform 241/241, output 57, skill 115, empty-tags 0.** Validation passes (312 warnings, no new). STOPPED. Remaining §04 work = relocation phase only (batch-move 8 flagged misfiles to §12/§09/§06/renderer-specific-learning).
