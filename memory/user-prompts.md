# User Prompts Log

Every user prompt/question, verbatim, w/ timestamp + short answer note.

## Format
### YYYY-MM-DD HH:MM
**Prompt:**
> (verbatim)

**Answered:** (1-line summary of what was done)

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
