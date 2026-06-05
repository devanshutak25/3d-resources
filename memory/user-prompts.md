# User Prompts Log

Every user prompt/question, verbatim, w/ timestamp + short answer note.

## Format
### YYYY-MM-DD HH:MM
**Prompt:**
> (verbatim)

**Answered:** (1-line summary of what was done)

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
