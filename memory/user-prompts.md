# User Prompts Log

Every user prompt/question, verbatim, w/ timestamp + short answer note.

## Format
### YYYY-MM-DD HH:MM
**Prompt:**
> (verbatim)

**Answered:** (1-line summary of what was done)

---

### 2026-07-14 13:20
**Prompt:**
> Someone shared these comments- reader flagged 3 misdirected links (Cinematic Lighting tutorial, Roger Deakins on Learning to Light, StudioBinder Film Guides) all opening channel/home roots instead of the intended resource, with correct links supplied.

**Answered:** Fixed all 3 in data/08-art-design/cinematography-camera/01-cinematography-camera.yml. StudioBinder Film Guides url -> /category/directing/cinematography/. Cinematic Lighting -> watch?v=eZ5hpcn6tIM, entry_type channel->tutorial. Deakins split into 3 per-episode tutorial entries (K9w8I_YD29E, Ly6pErhA3NA, G_0M_GHw9GI). Dropped stale notes, bumped url_last_verified to 2026-07-14. validate.js passed (+2 net entries).

---

### 2026-06-22 12:00
**Prompt:**
> all the things inside this link- https://thetoolbox.art/

**Answered:** Scraped all 16 Notion views via headless Chrome → 128 tools. User chose "Extract full list".

### 2026-06-22 12:30
**Prompt:**
> add all these things, add this in the credits as well. Make plan / go for phase 2 / go / go

**Answered:** Plan approved (3D+design-relevant subset, dual_listed_in for dups, map to existing, footer+README credit). Added 42 new entries + 6 mirrors, credit lines in page-shell.js + render.js, validate ✓, build exit 0.

### 2026-06-30 21:30
**Prompt:**
> add https://www.mixos.io/ and https://jangafx.com/software/vectoraygen

**Answered:** Mixos (browser PBR texture painter, Freemium) → §12 material-creation-software/01 + mirror to §02 material-creation-tools. VectorayGen (free node-based vector field gen) → §12 vfx-compositing-software/01 beside JangaFX siblings. Validate ✓ 426 (no new warnings).

### 2026-06-30 21:40
**Prompt:**
> run check links please

**Answered:** check-links.js is catalog-wide (rewrites every entry). Did targeted HEAD-check of only the 2 new URLs instead (both 200 ok) → set url_status:ok + url_last_verified:2026-06-30 on Mixos + VectorayGen. Offered full sweep as opt-in. Validate ✓ 426.

### 2026-06-30 21:55
**Prompt:**
> do a full catalog sweep please

**Answered:** Ran check-links.js on all 3516 URLs → 3076 ok / 375 unreachable (transient, not deprecated) / 65 url_status:broken (19 newly + 46 already-deprecated). Re-verified all 65 with browser UA: ~18 alive false positives (3ds Max, MotionBuilder, VRED, Inventor, ReCap, RV, Flow Capture/Tracking, Domestika, Wonder Studio, HDR Shop, Mo-Sys, Celestia, bsky.art, Fast Palette, IEEE, Field3D, 3D Maths) wrongly deprecated by vendor bot-blocking (checker sends no User-Agent). User chose REPORT ONLY (no corrective edits). Triage written into _maintenance/link-check-2026-06-30.md. Whole sweep diff left uncommitted for user review.

### 2026-06-30 22:10
**Prompt:**
> mark unreachable for now

**Answered:** Downgraded 21 false-positive `broken` entries (18 alive + 3 transient) → url_status:unreachable + removed deprecated:true. Excluded Mudbox (legacy) + genuine-dead links. Controlled catalog.js one-off, 16 files, per-URL assertions. Validate ✓ 426.

---

### 2026-06-16 21:00
**Prompt:**
> add  pinterest.com/AlanWilliams/

**Answered:** Pinterest scrape-blocked; user confirmed "general inspiration". Added "Alan Williams (Pinterest)" entry → §11 inspiration-showcase/01 (39→40 ent), inspiration/generalist/web. Validation ✓ 398.

---

### 2026-06-15 (post-clear, §11 relocation + §03 session)
**Prompt:**
> make plan to do next steps

**Answered:** Planned (`~/.claude/plans/make-plan-to-do-stateful-dusk.md`) + started. AskUserQuestion scope fork: **close the sweep only** (§11 relocation + §03; defer §10 paper-dump dedup). **Phase 1 (§11 relocation) DONE:** moved 4 RELOCATE-flagged entries out of `paid-tutorial-platforms/01` (pure move, notes stripped) — OpenEXR + Open Color IO + OpenCue → §10 `pipeline-standards/01` (10→13; OpenEXR/OCIO got license:Open Source + platform [win,mac,linux] to match OIIO/MaterialX lib cluster, OpenCue kept web + renamed from "OpenCue (site)"); Importance Sampling for Production Rendering → §09 `papers/02` (44→45; retyped reference→paper, +tech:paper +workflow:rendering, year omitted — uncertain). §11 RELOCATE flags 4→0. **§11 FULLY COMPLETE.** Validation ✓ 366 (+1 = benign `paper` freeform-tech). STOPPED for go-ahead.

> go

**Answered:** **Phase 2 (§03 animation) DONE → §01–§11 ENRICHMENT SWEEP COMPLETE.** Last section, 12 ent / 3 files. `ai-motion-capture/01` (4): rewrote whole file — AnimateDiff +platform[win,mac,linux]; **Bandai Namco retyped tool→asset-source** (dropped wrong tech:blender) +workflow:mocap +platform:web, desc tightened; ActorCore empty tags{}→workflow:mocap+platform:web; **CMU BVH stripped wrong tech:blender+blender-addon** +mocap+web, desc fixed. `animation-learning-channels/01` (8, light touch): cleaned Josh Toonen name (dropped emoji/clickbait "📺 Make Films 10x Faster in UE ~") + bracket-junk desc; rewrote Principles-of-Animation quote-desc → "Interactive web explainer of the 12 principles"; +skill:beginner on Alex Grigg + Principles. `animation-courses/01` left empty stub (flagged). §03: platform 12/12, workflow 12, output 4, skill 3, empty-tags 0. Validation ✓ 366, 0 errors. **SWEEP DONE. All edits uncommitted (user commits).**

---

### 2026-06-15 (post-clear, §11 Phase D session-end)
**Prompt:**
> update handoff and the other documents, we will pick up in the next session

**Answered:** Session-end sweep. Handoff top status + Phase D block + §7 First-actions (retargeted to §11 relocation pass) + §8 baseline note (→Phase D) all updated. project.md §11, decisions.md, user-prompts.md already carried Phase D. Verified: validation ✓ 365/0 errors, §11 RELOCATE flags = 4 (paid-tutorial), 13 files uncommitted (9 data + 4 docs; architecture-viz deleted). Resume = §11 relocation pass → §03.

---

### 2026-06-15 (post-clear, §11 Phase D)
**Prompt:**
> make plan to do next steps

**Answered:** Planned + executed **§11 Phase D** (final §11 enrichment phase; ~56 ent / 4 subsections). Plan: `~/.claude/plans/make-plan-to-do-twinkly-starlight.md`. AskUserQuestion forks: misfiles→relocate now; bogus licenses→fix obvious-wrong; Blender book→§02 blender-tutorials. **6 creative-coding tools relocated out of inspiration-showcase → §12** (NAP/shoebot/Structure Synth/Zdog→misc-3d-utilities-software, Smode→virtual-production-software, Quartz Composer→legacy-defunct-software; retyped reference→software); Leaf Pic dropped (junk). **architecture-viz subsection removed**: Contemporist+Modlar→inspiration-showcase, Blender 3D Architect book→§02 blender-tutorials (tutorial→book); dir+slug deleted. Fixed ~28 bogus license:Paid; added output by medium to showcase feeds; fixed blender.daily link-salad; salary-career +license:Free; industry-trends enriched + Pipeline Conference desc. §11 empty-tags 0. Validation ✓ 365, 0 errors. **§11 enrichment COMPLETE (A–D).** STOPPED. NEXT: §11 relocation pass (4 flags) → §03.

---

### 2026-06-15 00:30
**Prompt:**
> make plan to do next steps

**Answered:** Planned + executed §05 vfx enrichment (next sweep section). 28→26 ent (3 misfits relocated: CasparCG→§05 virtual-production intra, Bino→§07 xr-ar-vr, Kiko→§10 misc-3d-utilities per user picks). platform 3→26 (100%), skill 0→14, output 11→25. Validation ✓ 314 warnings. §05 COMPLETE. Next: §11 → §03.

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
- **Prompt:** make plan to do the next chunk of work (2026-06-12)
  - Planned + executed the §04 relocation phase (last remaining §04 work). Cleared all 8 RELOCATE flags: 6 moves (MoonRay→§12 render-engines, CopperLicht→§12 game-engines-free-oss, KodeLife→§12 misc-3d-utilities-software [all 3 retyped →software]; Photo tourism paper→§09 papers; React Spring→§06 motion-graphics-tools; Takua Renderer→§04 renderer-specific-learning) + 2 kept-in-place with note stripped (Quaternions math article, Physics-Based Animation — no math/sim home, user-confirmed). Pure move, no dual_listed_in, all destinations had headroom. Sources: r-s-t/02 50→48, /04 48→45, /05 28→27. Validation passes (312 warnings, 0 RELOCATE flags). **§04 now fully COMPLETE (enrichment + relocation).** NEXT: §06 motion-graphics.
- **Prompt:** make plan to do next steps (2026-06-13)
  - Planned + executed **§06 motion-graphics enrichment as a single phase** (user-confirmed; 41 ent / 5 non-empty subsections is smaller than one §04 chunk). Files: motion-graphics-inspiration/01 (26), motion-graphics-tools/01 (9), fusion-resolve/01 (3), after-effects-learning/01 (2), motion-graphics-channels/01 (1). Added platform to every entry (web for inspiration/refs/channels/communities/browser tools; [win,mac] for AE plugins — AE has no Linux; [win,mac,linux] for Blender addons + Nuke gizmo; [web,win,mac] for Plate). skill:intermediate on educational (Ben Marriott, Mobox tutorial, Top 5 Expressions, VFXPedia, Multichannel EXR, Fusion split EXR). workflow where honest: compositing (Nuke/Fusion/Caddis), editing (RailCut), rigging+animation (Rubberhose), animation (Commotion), creative-coding (Nw Wrld, nexrender, both Animation Nodes, React UMG, PixelCrash, React Spring). license fills (Element 3D=Paid, React Spring=OSS, Mobox=Free, Top 5=Free). Fixed "node based"→"node-based" desc dup + trimmed Mobox desc. **Coverage: platform 3→41 (100%), workflow 5→16, output 39→40, skill 1→6, empty-tags 0, junk 0, em-dash 0.** Two empty placeholders (motion-graphics-courses, video-editing-courses, entries:[]) left + flagged (decision: leave, like houdini-grooming). Validation passes (312 warnings, no new). STOPPED for go-ahead. NEXT: §08 art-design.
- **Prompt:** make plan to do next steps (2026-06-13) [post-clear, §08]
  - Planned §08 art-design enrichment (next worst-first section after §06). Measured baseline: 167 ent / 13 non-empty subsections (concept-art-courses empty), workflow 71%, platform 42%, output 27%, skill ~0% (education-heavy → skill is headline win); 37 inline misfit flags (22 in concept-art-channels, 7 in drawing-painting-3d). User chose: 3-phase clustered (A education ~84 ent / B tools+inspiration ~83 ent / C misfit retype+relocation) + retype-in-place with genuine cross-section moves. Plan: ~/.claude/plans/make-plan-to-do-buzzing-ocean.md. Executing Phase A now.
  - **Phase A DONE** (education cluster, 7 files / ~84 ent). platform 70→140, output 45→65, skill 1→40, workflow +1. concept-art-channels mis-naming (22 illustration-asset entries typed channel) + drawing-painting misfits + cinematography Nuke/Fusion all facet-tagged with notes kept for Phase C. Validation passes (312 warnings, no new). STOPPED for go-ahead. NEXT: Phase B (tools+inspiration: pre-production 30, general-inspiration 19, design-tools 15, color-theory 14, 2d-art-references 5).
- **Prompt:** go (Phase B)
  - §08 Phase B DONE (tools+inspiration, 5 files / ~83 ent). platform 140→167 (100%, every entry), workflow 119→139, output 65→84, skill 40→51, empty-tags 1→0. color-theory all got web; general-inspiration got workflow:concept; pre-production educational channels got web+skill, screenwriting tools got output:film-vfx. Misfit notes kept for Phase C. Validation passes (312 warnings, no new). STOPPED for go-ahead. NEXT: Phase C (retype 37 misfits in place + move genuine cross-section ones: Plasticity/Malt→§12, Nuke/Fusion/ButtleOFX→§12, drawing-painting dev/coding misfits, etc).
- **Prompt:** go (Phase C)
  - §08 Phase C DONE = §08 FULLY COMPLETE. User chose: illustration libs→§01, software→§12. Moved 30 entries out of §08 (167→137): 3 compositing sw + 1 render framework→§12; 22 illustration asset-libs→§01 (stock-images 16, icons 3, model-libraries 3); Genetic Drawing+RenderNet→§09, Gizmos→§07; Savee→§08 design-tools (intra). Plasticity DEDUP (canonical already in §12 3d-software-paid; §08 dup deleted). Retyped-in-place keepers (4 illustration refs in concept-art-channels, drawing-painting coding entries, Swatchr, Kerning Tool); notes stripped. All targets ≤50, 0 misfit flags remain, Plasticity in 1 file. Validation passes (312 warnings, no new). §08 final: platform 100%, skill 51. NEXT: §01 assets.
- **Prompt:** make plan to do next steps
  - Planned §01 assets enrichment (next worst-first after §08). Baseline: 269 ent / 17 chunk files / 16 subsections; platform 131/269 (~49%), workflow 144, output 164, license 246 (good), skill 0, empty-tags 5; junk light (1 NASA badge, 2 link-salad). User chose clustered phasing (7 enrichment + final relocation, like §08) + final relocation phase. Convention locked: asset-source/marketplace websites → platform:web; software/plugins → desktop per host; skill mostly N/A for §01. Plan: ~/.claude/plans/make-plan-to-do-enchanted-steele.md. Executing P1 now.
  - **P1 Textures DONE** (4 files / 37 ent: textures-free-pbr 01+02, textures-premium, textures-specialized). platform 1→37 (100%), output +37 (generalist for general PBR libs, scientific-viz for NASA/space/terrain, archviz for Texture Fun), workflow 37/37. Fixed: NASA badge stripped, Substance `[$] :` + wrong blender/blender-addon tech → substance/pbr, 5 thin/restater descs tightened, Blendersauce empty tags{} filled, Matcaps bogus opensource-alt tech dropped. YAML colon-gotcha hit twice (Celestia + CGI Moon Kit descs quoted). Validation passes (314 warnings; +2 new freeform-tech substance/c4d, benign). STOPPED for go-ahead. NEXT: P2 model-libs general (arch-furniture 11 + free-general 33).
- **Prompt:** go (P2)
  - **P2 model-libs general DONE** (arch-furniture 11 + free-general 33 = 44 ent). arch-furniture was already 100% faceted (platform/output/workflow) → left as-is. free-general: added `output` to ~24 entries (generalist default; games for Poly Pizza/Quaternius; archviz for 3Dzip/CadNav; scientific-viz for Funes/MyMiniFactory/OpenTopography). Blend Swap empty tags{} filled; Mantissa wrong `blender-addon` tech dropped→blender; 6 thin/restater descs tightened (Free3D.io, 3Dzip, 3DExport, PBRPX, Free3DBase, CGTrader). XYZed3D inner-`: ` desc quoted. OpenTopography community→asset-source retype deferred to P8. Both files platform/output 44/44. Validation ✓ 314 warnings (no new). STOPPED. NEXT: P3 model-libs specialized (21) + software-specific (10).
- **Prompt:** go (P3)
  - **P3 model-libs specialized (21) + software-specific (10) DONE.** specialized: platform:web added to 15 (now 21/21), output fills (generalist for anatomy/insect/Artec; scientific-viz for Smithsonian/British/Cleveland museums; games for Anything World; automotive for Wire Wheels); 2 empty tags{} filled (Artec 3D, Scanned Female Head — link-salad desc rewritten to "Free high-res scanned female head (Louise)"); NASA inner-`: ` quoted, GitHub-mirror markdown stripped. software-specific: platform added to all 10 (web for download-page libs SideFX/Blender/Substance/ZBrush/Nomad; desktop for in-app browsers Maxon[win,mac]/Maya[win,mac,linux]/3DCoat[win,mac,linux]); output:generalist on all. Deferred to P8: 3D MDB (tool→§10), Models Resource vs Models Resource (3D) dedup. Validation ✓ 314 (no new). STOPPED. NEXT: P4 game-assets (45, worst file 4/45 platform).
- **Prompt:** go (P4)
  - **P4 game-assets DONE** (45 ent, worst file). platform 4→45 (web on all itch/web asset pages; [win,mac,linux] for the 4 actual tools NativeBlend/Tilemancer/Asset Creation Toolset/UAssetAPI), output 45/45 (games), workflow added to 4 3D/anim packs (KayKit ×2, Stylized Nature, Universal Animation Library). Fixed: Tiny Farm RPG name-restater desc, Asset Creation Toolset name-restater→"Blender addon bundling tools...", UAssetAPI "low-level.NET"→"low-level .NET", wrong "Pixel Art" readme_tags on 3D packs→"3D Models"/"3D Low-Poly"/"Animations". P8 flags: NativeBlend CLI (AI-gen tool→§09/§10), UAssetAPI (.NET UE asset library→§10 dev tool). Validation ✓ 314 (no new). STOPPED. NEXT: P5 stock-images (28) + stock-footage (4) + audio-sfx (15).
- **Prompt:** go (P5)
  - **P5 stock+audio DONE** (stock-images 28 + stock-footage 4 + audio-sfx 15 = 47). stock-images already fully tagged (28/28; Settei Dreams + LACartoons already had entry_type — Explore read stale state); only tightened Story Set fluffy desc. stock-footage: videvo link-salad desc + wrong blender/blender-addon tech fixed → "Free stock video, motion graphics, and music", output film-vfx/motion-graphics, platform:web (4/4). audio: Sonniss "massive" desc tightened; added platform [win,mac,linux] to 2 plugins USFXR + Freesound Add-on (14/15). Sapphire (BorisFX plugin) platform+move deferred to P8. Validation ✓ 314 (no new). STOPPED. NEXT: P6 icons (27) + fonts (19).
- **Prompt:** go (P6)
  - **P6 icons (27) + fonts (19) DONE.** icons was 25/27 → added platform:web to typicons + Material design icons (also normalized their output generalist→illustration, tightened descs) = 27/27. fonts was 0/19 → added platform:web to all 19 (output:generalist already present; FontPair/Free Faces stay entry_type:reference; Roboto deprecated kept; Fontz tech blender). Validation ✓ 314 (no new). STOPPED. NEXT: P7 asset-marketplaces (9) + hdris (9) + free-asset-giveaways (1).

### 2026-06-13 (post-clear)
- **Prompt:** make plan to do next steps
  - Planned §01 P7+P8 (plan: `~/.claude/plans/make-plan-to-do-synthetic-goblet.md`), executed **P7** (last 3 §01 files). **hdris/01** headline (0/9→9/9 platform:web + output). **asset-marketplaces/01**: output fills, RenderHub platform, gumroad/juliosillet link-salad desc rewrite + rename "Julio Sillet (Gumroad)" + retype marketplace→asset-source, Quixel Bridge empty-tags filled ([win,mac,linux]+texturing) + Fab-fold P8 note. **free-asset-giveaways/01**: Sonniss +platform, dropped "Massive". §01 platform ~100% all files. Validation ✓ 314 (no new). STOPPED for go-ahead. NEXT: P8 relocation+dedup (NativeBlend/UAssetAPI→§09/§10, 3D MDB→§10, Sapphire→§12/§06, OpenTopography retype, Models Resource dedup) = finishes §01.
- **Prompt:** yes
  - Executed **P8** = §01 FULLY COMPLETE. AskUserQuestion forks: NativeBlend→§09 3d-generation, UAssetAPI→§07 unreal/04, 3D MDB→keep §01, Models Resource→keep both. Moved NativeBlend (game-assets→§09, 2→3) + UAssetAPI (game-assets→§07/04, 34→35); DEDUP-deleted Sapphire from §01 audio (canonical in §12, resolved validator dupe 314→313); retyped OpenTopography community→asset-source in place. 3D MDB + both Models Resource kept. Hit + fixed an append-splice gotcha (UAssetAPI stole UE4 Plugin Resources' tech/stale tail; caught via git diff, restored both). Validation passes (313 warnings, no new). 0 misfit flags in §01. NEXT sweep section: §09 ai-ml.
- **Prompt:** make plan to do next steps
  - Planned **§09 ai-ml enrichment** (next sweep section). Plan: `~/.claude/plans/make-plan-to-do-concurrent-snail.md`. User AskUserQuestion forks: misfit papers→`entry_type: paper`; §10 NeRF/GS overlap→DEFER to own phase; phasing→papers-batch then small-files. Executed **Phase A (papers/01+02, 93 ent)**: retyped all 93 (90 reference + 2 tutorial + 1 asset-source)→`entry_type: paper`, stripped all misfit notes, added `skill: advanced` to all (1→93), cleaned 8 bibtex tails + dangling pipes + 2 "Coming soon" placeholders. Validation ✓ 313 (baseline, no new). STOPPED for go-ahead. NEXT: Phase B (8 small subsections + 12 intra-§09 relocations in image-generation/01).
- **Prompt:** go
  - Executed **§09 Phase B** = §09 ai-ml FULLY COMPLETE. 8 non-paper subsections + 12 intra-§09 relocations from image-generation/01 (papers→papers, courses→ml-for-cg, voice/COVAL→ai-audio-music, 4 animation notebooks/channel→video-generation, AI Render→ai-assisted-cg-tools, point-E+AdaMPI→3d-generation, sd-concepts-library→open-source-models-hf). Pure moves, notes stripped, enriched on landing. Rewrote ai-assisted-cg-tools (19 ent, +platform on all) + ml-for-cg + comfyui fully. image-generation gutted 16→4 (only RenderNet/Canva are real img-gen; upgraded dead Canva PetaPixel news article → real Canva AI tool). §09 final: platform 102→146 (100%), skill 1→100, 0 misfit/RELOCATE, 0 empty tags, 146 ent conserved. Validation ✓ 314 (all freeform-tech paper/ai-ml, benign). STOPPED. NEXT section: §05 vfx (then §11 → §03). DEFERRED: §10 NeRF/GS paper-dump overlap phase.

### 2026-06-15 (post-clear, §11 sweep)
- **Prompt:** make plan to do next steps
  - Planned **§11 learning-community enrichment** (next sweep section after §05). Plan: `~/.claude/plans/make-plan-to-do-tidy-wave.md`. Scoped via 3 Explore agents (§11 baseline, §03 baseline, deferred NeRF/GS). §11 = 436 ent / 15 chunk files; baseline platform 94%, **output 20%** (headline gap), workflow 9%, skill 1%, license 89%; 8 empty tags{}; over-cap `communities-forums/02` = 119 ent. User AskUserQuestion forks: scope→**§11 only**; over-cap→**split during §11**; phasing→**cluster by theme** (4 phases A YouTube / B paid+patreon / C communities+split / D inspiration+career+trends). §03 + deferred NeRF/GS = out of scope (next plans).
  - Executed **Phase A (YouTube channels, 109 ent / 5 files)**: youtube-motion-c4d/01 (28) already 100% faceted → untouched. youtube-blender/01 (44): output 0→44 (generalist default; film-vfx for VFX/compositing channels; games for game-art/low-poly; illustration for NPR/cel; motion-graphics for Ducky 3D), workflow +11 (compositing on 5 render-pass channels, creative-coding on 5 scripting channels, modeling on Arrimus), fixed empty tags{} (Blender Sushi) + 9 restater/grammar descs (YanSculpts, BaseMesh, 5 compositing channels, Gleb, 3DCoat). youtube-houdini/01 (12): output 0→12 (film-vfx for FX, motion-graphics for mograph), workflow fx/simulation/creative-coding, fixed Auto Cache Out truncated desc. youtube-houdini/02 (14): output/workflow/skill/tech on 13 (graphics-prog talks → generalist+advanced; Houdini FX → film-vfx+fx). youtube-sculpting-characters/01 (11): output 0→11 (illustration for drawing/painting/concept, generalist for 3D sculpt/character). **Phase A coverage: all 4 changed files 100% output+platform, 0 empty tags.** Validation ✓ 322 warnings (+8 = benign `houdini` freeform-tech on houdini/02 entries newly given tech:houdini; 0 errors). STOPPED for go-ahead. NEXT: Phase B (paid-tutorial-platforms 01+02 + patreon-creators).
- **Prompt:** make plan to do next steps [approved, then executed Phase B]
  - Wrote plan `~/.claude/plans/make-plan-to-do-squishy-russell.md` (finish §11 B→C→D; §03 + §10 NeRF/GS out of scope per AskUserQuestion; archviz-viz 3 entries → merge in Phase D). Approved via ExitPlanMode.
  - Executed **§11 Phase B** (paid-tutorial-platforms 01+02 + patreon-creators, 112 ent). Found both paid-tutorial files are misnamed junk-drawers (mostly free channels/courses/libs, not paid platforms). patreon output 0→14, skill 0→3, 16 restater descs fixed. paid-tutorial platform 94/94, output 84/94, skill 89/94; retyped/flagged RELOCATE: OpenEXR+OpenColorIO+OpenCue→§10, Importance Sampling→§09; retyped 2 books; fixed Pomeroy typo. Validation ✓ 365 (benign freeform-tech, 0 errors). STOPPED. NEXT: Phase C (communities-forums + split 119-chunk).
- **Prompt:** update handoff and the other documents, we will pick up in the next session
  - Session-end sweep. Updated `disregard/handoff-enrichment-sweep.md` §7 "First actions" (was stale — pointed at long-finished §04 relocation; now points at §11 Phase C split + Phase D archviz-merge) + §8 state-check commands (retargeted to §11, baseline 365 warnings) + open §11 RELOCATE flags list. project.md §11 + decisions.md + handoff top already carried Phase B. Confirmed validation ✓ 365, 0 errors, all §11 edits uncommitted (user commits). Resume = §11 Phase C.
- **Prompt (2026-06-15):** make plan to do next steps [approved, then executed Phase C]
  - Wrote plan `~/.claude/plans/make-plan-to-do-imperative-kurzweil.md` (finish sweep: §11 C→D→relocation, then §03, deferred §10 NeRF/GS). Approved via ExitPlanMode.
  - Executed **§11 Phase C** (communities-forums, 159→158 ent). **Split over-cap chunk 02 (119)** into 3 thematic chunks: 02 = Blender + general 3D + AI/dev (33), new 04 = Houdini/C4D/motion/games/XR-VP (46), new 05 = VFX/animation/concept/illustration/archviz/design (39). Bumped `chunks: 3→5`. Fixed 6 empty tags{} (The Blend, blender.chat, SculptJanuary, Blender Conference, Developer Portal, fb/blender). Added license:Free to Blender Stack Exchange. **DEDUP:** dropped `realtimevfx.com` (exact-URL dup of "Real Time VFX"). Fixed 9 link-salad/badge/truncated descs in chunk 01. Chunk sizes 37/33/3/46/39 (all ≤50). §11 empty tags 7→1 (remaining = Phase D architecture-viz). Validation ✓ 365, 0 errors. STOPPED. NEXT: Phase D.
- **Prompt (2026-06-15):** update handoff and the other documents, we will pick up in the next session
  - Session-end sweep. Retargeted handoff §7 "First actions" from done-Phase-C → **Phase D** (inspiration+career+trends; merge 3 architecture-viz entries + remove subsection; fix last empty tag) → §11 relocation pass (4 flags) → §03. Updated §8 baseline note to Phase C. project.md §11 + decisions.md + handoff top-block + user-prompts already carried Phase C. Validation ✓ 365, 0 errors, all §11 edits uncommitted (user commits). Resume = §11 Phase D.
- **Prompt (2026-06-15):** make plan to do next steps
  - Sweep §01–§11 confirmed COMPLETE + committed (git clean). Planned **deferred catalog cleanup** (plan `~/.claude/plans/make-plan-to-do-shimmering-cloud.md`): Phase 1 §10 NeRF/GS paper relocation+dedup → §09 papers (sub-phased 1a–1d), Phase 2 plugin-marketplaces over-cap split, Phase 3 vfxcamdb dupe, Phase 4 UE channel dupe. User forks (AskUserQuestion): track = catalog cleanup; §10 papers = relocate+dedup to §09. Approved via ExitPlanMode.
  - Executed **Phase 1a** (photogrammetry-scanning/01, 37→24 ent): moved 13 genuine NeRF research papers → new `data/09-ai-ml/papers/03-papers.yml` (retyped reference→paper, +skill:advanced, dropped best_for/readme_tags/license:Free to match §09 shape), bumped §09 papers `chunks: 2→3`. Dedup checked vs papers/01+02 = 0 conflicts. **Kept in §10:** tools (SuperSplat/Meshroom/Polyscope/Nerfstudio gsplat), GS blogs (Aras/PlayCanvas), awesome-lists, runnable reference-impl repos (original NeRF/Mip-NeRF/JaxNeRF/GS reimpls). Validation ✓ 366, 0 errors. STOPPED for go-ahead. NEXT: Phase 1b (photogrammetry/02).
- **Prompt (2026-06-15):** update handoff and the other documents, we will pick up in the next session
  - Session-end sweep. Retargeted handoff §7 "First actions" + §8 state-check commands from finished §11 work → **Cleanup Phase 1b** (photogrammetry/02, ~40 papers; dedup vs papers/01-03, append papers/03→04). Marked §6 flag list 1/2/3 as RESOLVED→in-progress cleanup phases. decisions.md + project.md §11 + handoff top-block + user-prompts already carried Phase 1a. Validation ✓ 366, 0 errors, all edits uncommitted (user commits). Resume = Cleanup Phase 1b.
- **Prompt (2026-06-15):** make plan to do next steps
  - Re-confirmed Deferred Catalog Cleanup track; wrote plan `~/.claude/plans/make-plan-to-do-ticklish-axolotl.md` (Phases 1b–1d paper relo + 2–4 dupe/over-cap fixes), approved via ExitPlanMode, then executed **Phase 1b**.
  - **Phase 1b DONE** (photogrammetry/02, 49→7): moved 42 NeRF papers → §09 papers/03 (filled to 50) + new papers/04 (5); dedup vs papers/01-03 = 0 conflicts; §09 papers chunks 3→4. 7 keepers stay (2 tools, 1 awesome-list, 2 tutorials, 2 channels). Validation ✓ 408 warnings (baseline 366 + 42 benign `paper` freeform-tech), 0 errors. STOPPED for go-ahead. NEXT: Phase 1c (gaussian-splatting-nerf/01).
- **Prompt (2026-06-15):** go
  - **Phase 1c DONE** (gaussian-splatting-nerf/01, 34→17): moved 17 NeRF/GS papers → papers/04 (5→22); 17 keepers stay (impls, tools/viewers, blog guides); dedup vs papers/01-04 = 0 conflicts; §09 papers chunks stays 4 (room). Validation ✓ 408 warnings (no new), 0 errors. STOPPED for go-ahead. NEXT: Phase 1d (photogrammetry/03, 2 papers).
- **Prompt (2026-06-15):** go
  - **Phase 1d DONE → PHASE 1 COMPLETE.** Moved 2 Debevec HDR/IBL papers from photogrammetry/03 (35→33) → papers/04 (22→24); user AskUserQuestion chose MOVE over keep-in-cluster. §10 paper relocation done across 1a-1d (74 papers total → §09 papers, sizes 50/45/50/24). Residue = legit keepers (impl repos + book). Validation ✓ 410, 0 errors. STOPPED. NEXT: Phase 2 (plugin-marketplaces/01 over-cap split).
- **Prompt (2026-06-15):** go
  - **Phase 2 DONE** (plugin-marketplaces over-cap split): moved BlenderAddons.org from 01 (51→50) → 02 (0→1); chunks:2 already declared. Validation ✓ 410, 0 errors. STOPPED. NEXT: Phase 3 (vfxcamdb.com dupe).
- **Prompt (2026-06-15):** update handoff and the other documents, we will pick up in the next session
  - Session-end sweep. Retargeted handoff §7 "First actions" + §8 state-check from done Phase 1b → **Phase 3** (vfxcamdb.com dupe → matchmoving canonical + dual_listed_in, delete misc copy) → Phase 4 (UE channel dupe). Updated §8 baseline 366→410 + expected papers sizes (50/45/50/24). decisions.md + project.md §11 + handoff top-blocks already carried Phases 1a-1d + 2 per-phase. Resume = Cleanup Phase 3. All edits uncommitted (user commits).
- **Prompt (2026-06-15):** make plan to do next steps
  - Planned + executed the final 2 cleanup flags. **Phase 3** (vfxcamdb dupe → matchmoving canonical + dual_listed_in mirror, deleted misc copy) + **Phase 4** (UE YouTube channel dupe → kept @UnrealEngine w/ merged desc, deleted UCBob copy). Validation ✓ 410, 0 errors. **DEFERRED CATALOG CLEANUP COMPLETE.** Scope locked by user = close cleanup only (no commit, no launch work). Plan: ~/.claude/plans/make-plan-to-do-binary-peacock.md.
- **Prompt (2026-06-15):** all the cleanup and enrichment is done, right?
  - Verified against data (not just logs): tracked work done + validation ✓, BUT found 17 untracked RELOCATE/Misfit notes in §12 + §10 conversion-tools (never swept; §12 was pre-done). User chose "plan a relocation pass." Executed it: Bucket A (5 moves → §02/§09), B (MusicGen dedup-delete), C (MicMac bogus-mirror fix), D (10 stale notes stripped). grep RELOCATE = 0 catalog-wide. Validation ✓ 410, 0 errors. **CATALOG NOW FULLY FLAG-FREE.** Uncommitted.
- **Prompt (2026-06-15):** write a GitHub About
  - Drafted About description + website + 20 topics from canonical `copy-snippets.md` voice, adjusted to no-em-dash/no-AI-tells (public surface). Flagged stale 3,300+ count.
- **Prompt (2026-06-15):** recount please
  - Counted actual entries = **3,414** (`^  - name:` across data/ chunk files). Recommended About use "3,400+".
- **Prompt (2026-06-15):** update memory and other files
  - Propagated 3,300+ → 3,400+ across handoff/*.md (28 occ; _maintenance left alone). Stored GitHub About in copy-snippets.md. Logged recount (3,414) + About to decisions.md + project.md §11.
- **Prompt (2026-06-15):** add protopie.io + figma.com + a large AI-creative-tools directory (node canvas, sketch-to-render, product photography, AI filmmaking, upscalers, core image/video models).
  - Figma already present. Hybrid/curated/refresh (AskUserQuestion). Added 35 new entries: 3 new §12 buckets (ai-canvas/design-viz/product-photography) + folded filmmaking→ai-video, upscalers→ai-assist, Imagen/Reve→ai-image, Intangible→ai-3d, ProtoPie→design-software. Refreshed 9 existing (Nano Banana Pro, FLUX.2, GPT Image, Runway Gen-4.5, Sora deprecated, Luma Ray3, LTX-2, Topaz Bloom, Magnific/Freepik). Catalog 3,414→3,449. Validation ✓ 410.
- **Prompt (2026-06-15):** what more can be added? changed? cleaned? enriched? in this repo?
  - 3-agent audit → plan (3 workstreams A cleanup / C facet backfill / B SEO, order A→C→B). A1 DONE: split 2 over-cap §12 chunks (2d-animation 58→50+8, pipeline 66→50+16). Validation ✓ 410. Next: A2 dedup (26 same-URL groups).
- **Prompt (2026-06-15):** go
  - A2 DONE: cross-subsection dupe consolidation. 23 true-dupes → canonical + dual_listed_in (user policy: preserve render), 3 same-sub plain deletes, 6 distinct pairs left. 26 entries removed → 3421. Validation ✓ 398 (12 cross-section warnings cleared). 2 items flagged for user (Architecture Pipeline wrong URL; Motion Design School Discord URL).

- **Prompt (2026-06-16):** make plan to do next steps
  - Planned Workstream C facet backfill (4 phases: license §04→§09, output §02/§10, skill narrow). User picked C, leave uncommitted. Phase 1 DONE: §04 license 65→236/236 (100%), 170 added, validation ✓ 398.

- **Prompt (2026-06-16):** yes
  - Phase 2 DONE: §09 ai-ml license 96→224/224 (100%), 128 added (all Free, papers). Validation ✓ 398. NEXT: Phase 3 output §02/§10.

- **Prompt (2026-06-16):** go
  - Phase 3 DONE: output backfill §02 57→237/237, §10 118→260/260 (both 100%), 322 added (generalist 251, film-vfx 69, scientific-viz 2). Validation ✓ 398. NEXT: Phase 4 skill.

- **Prompt (2026-06-16):** go
  - Phase 4 DONE → Workstream C COMPLETE. Skill: 14 candidates, tagged 7 instructional Rive tutorials, skipped 7 non-graded. Validation ✓ 398. Next options: Workstream B (SEO) or launch.

- **Prompt (2026-06-16):** 1. remove  2. leave it as is — validate and log, I will commit
  - Removed Architecture Pipeline entry (§10 pipeline-overview/01, 3→2 ent); left Motion Design School as-is. Validation ✓ 397 (dupe warning cleared). User commits.

- **Prompt (2026-06-16):** Make plan for - Workstream B (SEO site features)
  - Planned + approved. Decisions: all 5 tag groups (~121 pages), thin pages (<3 entries) noindex + out of sitemap. Groundwork DONE: lib/slugify.js, render.js export refactor (output byte-identical), lib/seo-pages.js (subsectionPages 151/132 indexable, tagPages 121/96 indexable). Plan: ~/.claude/plans/make-plan-for-optimized-clover.md. NEXT: B1 subsection pages + central sitemap.

- **Prompt (2026-06-17):** go
  - B1 DONE: build-section-pages.js now emits 12 section + 151 subsection pages (19 thin→noindex); 3-level breadcrumb JSON-LD, parent-section OG, "Browse by subsection" nav on section pages. New build-sitemap.js (final build step) = sole sitemap writer (145 URLs: root+12+132 indexable subs); removed sitemap block from build-html.js. build.sh wired. validate ✓ 397. NEXT: B2 tag pages.

- **Prompt (2026-06-17):** go
  - B2 DONE: new build-tag-pages.js emits /tags/ hub + 121 tag pages (all 5 groups; 25 thin→noindex), namespaced /tags/<group>/<value>/ (collision-safe). Extracted shared lib/page-shell.js (section pages refactored to use it, output byte-identical). Wired into build.sh after export-data. Sitemap now 242 URLs (13+132 subs+97 tags/hub). validate ✓ 397. NEXT: B3 per-entry JSON-LD.

- **Prompt (2026-06-17):** update handoff and the other documents, we will pick up in the next session
  - Session wrap. Updated disregard/handoff-enrichment-sweep.md (§7 resume-at-B3 + DONE summaries, §6 flags 4/5 closed, §8 baselines→397), project.md (§11 new Workstream B subsection, §6 build pipeline +tag/sitemap steps, §3 map +5 new files), and the approved B plan STATUS header. NEXT SESSION: B3 per-entry JSON-LD (lib/entry-schema.js; section+subsection pages only). All edits uncommitted (user commits).

- **Prompt (2026-06-17):** make plan to do next steps. also add https://packcad.com/
  - Plan `~/.claude/plans/make-plan-to-do-fizzy-sunset.md` (approved): P1 add PackCAD, P2 Workstream B3 (per-entry JSON-LD), P3 data quality pass (em-dash/banned words). PackCAD license=Freemium (user pick). **Phase 1 DONE:** added PackCAD to §12 cad-software/01 (19→20 ent; web 3D CAD for packaging/origami folding; software/Freemium/web/modeling/product-viz; dropped non-curated `parametric` tech to avoid new warning). Validation ✓ 397 (unchanged). Uncommitted. STOPPED for go-ahead before P2.

- **Prompt (2026-06-17):** go
  - **Phase 2 (B3) DONE:** new `scripts/lib/entry-schema.js` (entryToJsonLd/entriesToJsonLd, pure) maps entry_type→schema.org @type; `build-section-pages.js` appends per-entry nodes to each page @graph (section bounded 100, subsection all ≤50); NOT in index.html. Unit test entry-schema.test.js 11/11. Built 12 section + 151 subsection pages; cad-software JSON-LD verified (16 SoftwareApplication+2 Thing+Breadcrumb/CollectionPage/ItemList, valid). project.md §11 + decisions.md updated. Validation ✓ 397 (no data-shape change). Uncommitted. STOPPED before P3.

- **Prompt (2026-06-17):** go
  - **Phase 3 (data quality pass) DONE → plan complete.** Fixed 4 user-facing prose hits (Seamless→Tileable ×2 + tileable patterns in textures-free-pbr/01; Tilecam seamlessly→removed; MegaSaM robust-adjective-stack rewritten) + 1 em-dash (scientific-viz subsection desc → comma). Skipped 3 legit non-violations (RVM proper name, URL substring, internal comment). Validation ✓ 397. Full bash build.sh EXIT=0 (sitemap 242 URLs; cad-software page verified: PackCAD card + 16 SoftwareApplication nodes). Uncommitted (user commits).

- **Prompt (2026-06-17):** run the current version of the project locally for testing
  - Served built `_site/` via `python -m http.server 8000 --directory _site` (background task baaxdmhay). Smoke-tested /, /sections/<sec>/<sub>/, /tags/, /sitemap.xml, /llms.txt → all 200.

- **Prompt (2026-06-17):** what is B4 See also links?
  - Explained: deferred/unbuilt Workstream B idea = per-entry "Related/See also" block (internal links to topically-close entries via shared tags / graph.json / minisearch). SEO value = internal linking + crawl depth. Not in repo yet.

- **Prompt (2026-06-17):** theme this "/sections" page
  - `/sections/` was serving Python autoindex (no index.html). Added themed hub: `renderSectionsHubPage` in build-section-pages.js → `_site/sections/index.html` (12 sections, icons, counts, descriptions, JSON-LD), + sitemap entry in build-sitemap.js (243 URLs). Verified served. Uncommitted.

- **Prompt (2026-06-17):** Make a plan to prepare a press release... send to journalists/websites/magazines/youtubers/content creators. Find relevant people (fleshed out lists).
  - Planned + executed in 5 phases (plan: `~/.claude/plans/make-a-plan-to-structured-wand.md`). Created gitignored `press/`: evergreen `press-release.md` + `press-release-short.md` (built from `handoff/copy-snippets.md`, style-clean 0 em-dash/0 AI-tells), `media-contacts.md` (web-researched named+tiered: A press/mag, B 33 YouTubers, C 14 podcasts, D newsletters, E amplifiers; unverified flagged), `outreach-tracker.md`. Added `press/` to .gitignore (has personal emails). URLs HEAD-checked 200.

- **Prompt (2026-06-17):** add this as well https://framerate.tv/
  - Not in catalog. WebFetch 403; identified via WebSearch = community showcase for motion design + music video work ("New Standard for Video Professionals"), not stock footage. Added 1 entry → §06 `motion-graphics-inspiration` (entry_type inspiration, platform web). Validation ✓ 426, 0 errors. Catalog ~3469. Uncommitted.

- **Prompt (2026-06-17):** add all the links from this website please https://wiki.johnkunz.com/index.php?title=Resources
  - Fetched page (7 sections, ~92 links). Deduped vs catalog: 43 already in, 46 new. User chose add-all-14-Houdini-repos + one-pass. Added 46 to existing subsections (§01 6, §02 houdini 26, §06 3, §08 7, §10 4); no new vocab. Validation ✓ 426 (+29 benign freeform-tech), build exit 0, search index 3416→3462. See decisions.md 2026-06-17. Uncommitted.

- **Prompt (2026-06-17):** what is the next step?
  - Catalog/cleanup/facet/SEO B1-B3 all done + committed; only launch left. User picked **cut v1.0.0 release** (plan: `~/.claude/plans/what-is-the-next-cuddly-matsumoto.md`). Phase 1 pre-flight green (validate ✓ 397, build.sh ok, sitemap 243). Phase 2: wrote `handoff/release-notes-v1.0.0.md` (paste-ready, real per-section counts, "3,400+", 8 months, Devanshu Tak, 0 em-dash/AI-tell). Real counts: raw catalog 3422, render-canonical 3323 (graph entry). Social preview = use existing `og-image.png` 1200x630 as-is (user choice). Phase 3 (git tag v1.0.0 + push) + Phase 4 (About/topics from copy-snippets, upload og-image) = user-run, not done yet. No tag exists; gh CLI not installed.

- **Prompt (2026-06-22):** add https://doanimation.kindreddo.com/ and https://dotracking.kindreddo.com/
  - JS-rendered; identified via kindreddo.com = free Kindred creative tools. DoAnimation (browser frame-by-frame 2D anim, layers/onion-skin, GIF/MP4, local files) → §12 `2d-animation-software/02`. DoTracking (browser animation production tracker: episodes/scenes/shot status/revisions, local) → §12 `pipeline-software/02` next to Kitsu. Both `software`/`Free`/`web`. Validation ✓ 426, 0 errors. Uncommitted.

### 2026-06-22 21:10
**Prompt:**
> add https://www.gradientool.com/

**Answered:** Added Gradientool (web gradient generator, MP4/image export) → §08 art-design design-tools/01 (28 ent). license Free, type tool, platform web, output generalist. Validate ✓ 426 warn, 0 err.

### 2026-07-15
**Prompt:**
> check PRs

**Answered:** 2 open PRs: #8 AnimKit (rigging-animation-tools), #7 SplatMart (asset-marketplaces). gh CLI not on PATH, read via GitHub web UI.

**Prompt:**
> check everything and merge please

**Answered:** Fetched both via `git fetch origin pull/N/head`. validate.js ✓ 427 warn 0 err on each + on merge. Both URLs live-verified real (SplatMart = splat marketplace; AnimKit = paid Maya toolbar, $49/yr). No dupes, closed enums correct. Octopus-merged both to main, pushed (b8a8a88). GitHub auto-closed #7/#8.

**Prompt:** (2026-07-17)
> add https://www.mixos.io/
> https://github.com/huxingyi/autoremesher
> https://github.com/adriflex/autoremesher-blender-bridge

**Answered:** 2/3 already in catalog (Mixos → §12 material-creation-software; AutoRemesher → §12 retopo-uv-software, flagged stale 2022). Added only AutoRemesher Blender Bridge → §02 blender-plugins-addons/04 (35→36), plugin/OSS, dual_listed_in retopology-mesh-tools. Validate ✓ 427 warn, 0 err.

**Prompt:** (2026-07-17)
> is it possible to add better mixpanel events?

**Answered:** Yes. Audit found Mixpanel inline in build-html.js only (index.html), autocapture + 100% session recording, zero custom events; ~243 generated SEO pages had no analytics at all. Proposed outbound_click, search w/ result_count, filter_apply, + page-shell rollout. Flagged 100% session sampling as launch-quota risk.

**Prompt:** (2026-07-17)
> go for adding the things you suggested

**Answered:** Phase 1. New shared `assets/js/analytics.js` (Mixpanel init moved out of build-html.js verbatim, idle-deferred, parity config) + `window.track3d` queue + delegated `outbound_click` (capture + auxclick, link_kind entry|chrome). Body data-* page context via new `analyticsContext` param on pageShell, threaded through all 5 call sites. filter.js row decoration extended for entry context. Coverage 1 → 287 pages. Build green, validate ✓ 427, sitemap 243.

**Prompt:** (2026-07-17)
> Go for the next phase

**Answered:** Phase 2 (filter.js events): `search` {query, result_count, zero_results, facet_*} on a separate 1000ms settle timer (not the 80-180ms input debounce) + dedupe; `filter_apply` {group, value, action, result_count}; `filter_clear` (snapshot before wipe, no-op guard). All read lastVisibleCount from applyFilters(). Clean build.sh exits 0, validate ✓ 427, sitemap 243. Reverted package.json dep churn from build.sh npm install; kept README regen (stale since b8a8a88 — SplatMart/AnimKit never re-rendered). Behavioral verification still pending (no jsdom/puppeteer in repo).

**Prompt:** (2026-07-17)
> phase 3

**Answered:** No phase 3 to run — `filter_apply` (originally scoped as phase 3) already shipped in phase 2, folded in because it shares filter.js + facetProps()/lastVisibleCount with `search`. Surfaced the 3 genuinely-open items (behavioral verification, graph/TOC events, session sampling); user chose to stop. Work left uncommitted for user.

### 2026-07-21
**Prompt:**
> add
>   https://www.autodesk.com/solutions/media-entertainment/project-falcon
>   https://reformsculpt.com/
>   https://www.mixos.io/

**Answered:** Added Autodesk Project Falcon and Re:Form to §12 software reference. Mixos already existed; skipped duplicate. Validation ✓ 427 warnings, 0 errors.
### 2026-07-22
**Prompt:**
> add https://editor.pascal.app/ and https://thenewblack.ai/

**Answered:** Added Pascal Editor to §12 CAD Software and The New Black to §12 AI Design Viz Software. Both URLs and product details verified from their public pages.
