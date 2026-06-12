# Handoff: Catalog-wide searchability enrichment sweep

**Status as of 2026-06-13 (PAUSED). §07/§02/§04/§06/§08 COMPLETE. §01 ASSETS IN PROGRESS — P1–P6 done, RESUME AT P7.**

## §01 ASSETS IN PROGRESS (2026-06-13, paused after P6)
269 ent / 17 chunk files / 16 subsections. Baseline platform 131/269 (~49%), workflow 144, output 164, license 246 (good), skill 0, empty-tags 5. Clustered phasing (user-confirmed): 7 enrichment phases + final relocation. Plan: `~/.claude/plans/make-plan-to-do-enchanted-steele.md`. All edits UNCOMMITTED (user commits). Validation ✓ 314 warnings throughout (baseline; +2 vs pre-§01 are new freeform-tech `substance`/`c4d`, benign).
**§01 CONVENTION LOCKED: asset-source/marketplace websites → `platform: web`** (source is a browser; differs from §02/§04 desktop-tool default). Software/plugins/in-app browsers → desktop per host (e.g. Maxon Asset Browser [win,mac], Maya/3DCoat [win,mac,linux]). `skill` N/A for §01 (not educational) — do not force; expect skill near 0. `output`: general PBR/model libs → `generalist`; game assets → `games`; arch/furniture → `archviz`/`product-viz`; icons/stock-images/illustration libs → `illustration`; museums/NASA/space/terrain → `scientific-viz`; vehicles → `automotive`. YAML inner-`: ` in any new desc MUST be single-quoted (hit it 3× already: Celestia, CGI Moon Kit, XYZed3D).

**Phases (✓ = done):**
- **P1 textures (37) ✓** — textures-free-pbr/01+02, textures-premium, textures-specialized. platform 1→37, output +37. NASA `[![][repo]]` badge stripped; Substance `[$] :` + wrong blender tech → substance/pbr; Matcaps bogus opensource-alt dropped; Blendersauce empty-tags filled.
- **P2 model-libs general (44) ✓** — arch-furniture (11, was already 100%, untouched) + free-general (33: output added to ~24, Blend Swap empty-tags filled, Mantissa blender-addon→blender). platform/output 44/44.
- **P3 specialized (21) + software-specific (10) ✓** — platform→21/21 + 10/10; Artec 3D + Scanned Female Head empty-tags filled (link-salad rewritten); software-specific in-app browsers got desktop platforms.
- **P4 game-assets (45) ✓** — platform 4→45 (web on pages, [win,mac,linux] on 4 tools), output 45/45; junk descs + wrong "Pixel Art" readme_tags on 3D packs fixed.
- **P5 stock-images 28 + stock-footage 4 + audio-sfx 15 ✓** — stock-images already 28/28; videvo link-salad fixed; 2 audio plugins got platform. (Settei Dreams + LACartoons already had entry_type — Explore report was stale, no fix needed.)
- **P6 icons 27 + fonts 19 ✓** — icons 25→27/27, fonts 0→19/19 (all web).
- **P7 marketplaces 9 + hdris 9 + giveaways 1 — NOT STARTED (resume here).**
- **P8 relocation+dedup — NOT STARTED.**

**RESUME AT P7 (asset-marketplaces 9 + hdris 9 + free-asset-giveaways 1 = 19 ent).** Known P7 work: Quixel Bridge empty `tags:{}` (desktop app → win/mac); gumroad/juliosillet link-salad desc; thin ArtStation/Cubebrush descs; hdris 0/9 platform → web + lighting workflow already present; output for hdris (generalist). Read the 3 files, apply recipe, validate, log, stop.

**P8 relocation targets (carry forward — confirm exact homes with user at P8):**
- **Sapphire** (BorisFX VFX plugin, in audio-sfx-music; only entry still missing platform there) → §12 vfx-compositing or §10. Add platform on move.
- **NativeBlend CLI** (AI-gen CLI tool, in game-assets) → §09 or §10 tools.
- **UAssetAPI** (.NET UE-asset dev library, in game-assets) → §10 dev tools (consider).
- **3D MDB** (model search database, entry_type:tool, in model-libs-specialized) → §10 misc-3d-utilities.
- **OpenTopography** (in model-libs-free-general) — retype `community`→`asset-source`, KEEP in §01 (just a retype, no move).
- **Models Resource** vs **Models Resource (3D)** (model-libs-specialized) — likely same Spriters-Resource network site → dedup.

## §08 ART-DESIGN COMPLETE (2026-06-13)
3-phase clustered (user-confirmed). 167→137 ent (30 relocated in Phase C). Final §08: platform 137 (100%), workflow 109, output 58, skill 51, empty-tags 0, misfit flags 0.
- **Phase A** (education, 7 files / ~84 ent): platform:web + skill on all educational channels/courses/refs; output:illustration on concept/figure entries, output:film-vfx on cinematography; concept-art-courses left empty (flagged stub). concept-art-channels found heavily mis-named (most entries are illustration asset-sources, not channels).
- **Phase B** (tools+inspiration, 5 files / ~83 ent): platform→100%; color-theory all got web; general-inspiration got workflow:concept; pre-production educational channels got web+skill, screenwriting tools got output:film-vfx; fixed last empty tags:{}.
- **Phase C** (misfit retype+relocation): user chose illustration-libs→§01, software→§12. Moved out: Nuke/Fusion/ButtleOFX→§12 vfx-compositing; Malt→§12 render-engines; 22 illustration asset-libs→§01 (stock-images 16, icons 3, model-libraries-specialized 3); Genetic Drawing+RenderNet→§09; Gizmos→§07 unity/10; Savee→§08 design-tools (intra). **Plasticity DEDUP** — canonical already in §12 3d-software-paid, §08 "Plasticity (GitHub)" was misfiled pointer → deleted, not re-added (lesson: grep target section for existing entry before moving). Retyped-in-place keepers: 4 illustration refs in concept-art-channels (channel→reference), drawing-painting coding entries (kept weakly-on-theme), Swatchr/Kerning Tool (kept thematic). All notes stripped on resolved items; 8 legit URL/license/dead-link notes remain. All target chunks ≤50 (no splits).
**NEXT: §01 assets** (re-confirm baseline facets, phase chunk-by-chunk; remaining worst-first §01 → §09 [NeRF/GS paper dumps + §10 overlap, §6.1] → §05 → §11 → §03).

## §06 MOTION-GRAPHICS COMPLETE (2026-06-13)
Single phase (user-confirmed; 41 ent / 5 non-empty subsections < one §04 chunk). Files: motion-graphics-inspiration/01 (26), motion-graphics-tools/01 (9), fusion-resolve/01 (3), after-effects-learning/01 (2), motion-graphics-channels/01 (1). **Coverage: platform 3→41 (100%), workflow 5→16, output 39→40, skill 1→6, empty-tags 0, junk 0, em-dash 0.** No misfiles, no relocations needed. **2 empty placeholders left + flagged** (decision: leave): `motion-graphics-courses/01` + `video-editing-courses/01` (both `entries: []`) — source course entries later if desired, mirrors houdini-grooming 0-ent handling. **Convention locked: AE plugins → `platform: [win,mac]`** (After Effects has no Linux build; differs from §04 `[win,mac,linux]` default). MG has **no `motion-graphics` workflow value** (output-only); honest workflows used = compositing/editing/rigging/animation/creative-coding. Validation passes (312 warnings, no new). **NEXT: §08 art-design** (then §01 → §09 [NeRF/GS paper dumps + §10 overlap, §6.1 below] → §05 → §11 → §03). Re-confirm §08 baseline facet coverage + phase chunk-by-chunk before starting.

## §04 RELOCATION COMPLETE (2026-06-12)
All 8 RELOCATE flags cleared. **6 moves** (pure move, strip `notes`): MoonRay (reference→software) → §12 render-engines/01 (39→40); CopperLicht (reference→software) → §12 game-engines-free-oss/02 (11→12); KodeLife (tool→software) → §12 misc-3d-utilities-software/01 (20→21); Photo tourism paper → §09 papers/02 (42→43); React Spring → §06 motion-graphics-tools/01 (8→9); Takua Renderer → §04 renderer-specific-learning/01 (3→4, intra-section). **2 kept-in-place** (note stripped; no math/sim subsection exists in §04/§05/§06, user-confirmed): "Let's remove Quaternions from every 3D Engine" + "Physics-Based Animation" stay in rendering-shader-theory/04. Sources: r-s-t/02 50→48, /04 48→45, /05 28→27. No new chunk files, no `chunks`-counter edits. Validation passes (312 warnings), 0 RELOCATE flags remain. **NEXT: §06 motion-graphics enrichment** (re-confirm baseline facet coverage, phase chunk-by-chunk; remaining worst-first §06 → §08 → §01 → §09 [NeRF/GS paper dumps] → §05 → §11 → §03).

## §04 LIGHTING ENRICHMENT (DONE — 2026-06-12)

Plan file: `~/.claude/plans/make-plan-to-work-virtual-church.md`. 241 ent / 9 chunks. Baseline platform 23, output 11, skill 8, workflow already 234/241. Phasing: 6 phases chunk-by-chunk (user-confirmed). Over-cap chunk 01 (51) fixed by moving 1 overflow → chunk 02 (both now 50, user-confirmed).

**DONE (5/6 phases):**
- **P1** — 4 tiny subsections (15 ent: fundamentals 5, production 2, redshift 5, renderer-specific 3). platform/skill/output added; CNDL empty `tags:{}` fixed; 2 descs tightened.
- **P2** — `rendering-shader-theory/01` (51→50). Over-cap fixed (moved "A Trip Through The Graphics Pipeline" → chunk 02 end). platform on all 50 (web for refs/books/papers/blogs/channels; `[win,mac,linux]` for desktop tools fSync/USD Arnold/Bonzomatic/Fragmentarium/bgfx + Blender/Unity/Unreal shader entries); skill on educational; output where implied. Fixed 3 missing-workflow. Stripped wrong `blender`/`blender-addon` tags on IOR List + Blender&ACES.
- **P3** — `rendering-shader-theory/02` (50). Unity shader repos → platform[win,mac,linux]+output:games. Retyped 7 RELOCATE-candidates inline (GLSL Optimizer/Lygia/Twigl/apitrace/NodeToy→tool; ShaderForge/Pyro Shader→plugin) + Anatole Drupat→inspiration. Stripped `(#TAG)`/`:moneybag:`/link-salad junk + MoonRay badge. Cleaned 6 NPR channel descs. Fixed typos. YAML inner-`: ` gotcha hit (quoted Moebius + Manga descs).

- **P4** — `rendering-shader-theory/03` (50 ent). All had only workflow:rendering. platform on all 50 (web for refs/papers/blogs/online-editors/Three.js+GLSL libs; [win,mac,linux] for native tools SHADERed/CodeXL[win,linux]/Magnum/glslViewer/Three Blender + Unity-repo + CelShader UE4 + Houdini GS). **Retyped 4 Blender addons reference→plugin** (Extra Lights, Node To Python, Blender Addon PBR, Lily Surface Scrapper) + tech:blender-addon + stripped `[![market]]`/`[![][mit]]`. **10 papers → year + skill:advanced + platform:web (NO `paper` tech tag — matched §04 Quadtrees precedent).** output:games on 5 Unity repos + CelShader(+illustration). skill on educational courses/blogs/tutorials. Fixed 6 truncated descs + "Ust learning" typo + dangling @patriciogv links.

- **P5** — `rendering-shader-theory/04` (48 ent). platform on all 48 (web for refs/papers/editors; win ShaderTool/Shader Designer; [win,linux] RenderDoc; [win,mac,linux] KodeLife/Synthclipse); skill on 26 educational; 4 papers got year. **2 retypes:** RenderDoc reference→tool, glslViewer-writeup tool→reference. Khrnos→Khronos typo fix. Cleaned link-salad/hype/truncation descs. **Kept all 5 RELOCATE notes** (enriched in place): KodeLife→§12, Let's remove Quaternions (math theory), Photo tourism (photogrammetry paper → §09), Physics-Based Animation (→ §06), React Spring (animation lib).

- **P6** — `rendering-shader-theory/05` (28 ent). 6 YouTube channels already had platform:web; added web to the other 22; skill on 20 educational; output archviz (xeokit) + games (ThinMatrix); NeRF-Tex year:2021; typos fixed (tutuorial, OpenG, doubled "real part"), 6 restater/truncated descs rewritten; kept Takua Renderer RELOCATE? note.

**§04 ENRICHMENT COMPLETE (6/6).** Final facet coverage: platform 23→241 (~100%, 241/241 ent), output 11→57, skill 8→115, empty-tags 0. Validation passes (312 warnings, no new). All edits uncommitted (user commits).

**TODO (relocation phase only):**
- **§04 RELOCATION PHASE (the only remaining §04 work):** batch-move all flagged §04 misfiles (mirror §02 relocation precedent; strip notes on move). Confirmed so far: **chunk 02** — MoonRay (render engine → §12), CopperLicht (WebGL engine → §12/web-tech). **chunk 04** — KodeLife (shader editor → §12 software/shader-tools), Let's remove Quaternions (math theory; find/make a math home or drop), Photo tourism (photogrammetry paper → §09), Physics-Based Animation (→ §06 animation/sim), React Spring (animation lib → §06 or drop). **chunk 05** — Takua Renderer (`RELOCATE?` note; physically-based renderer deep-dive → §04 `renderer-specific-learning`, confirm intent vs move). All 8 enriched in place + filterable until moved.

**Per-phase protocol (unchanged):** read chunk → apply recipe → `node scripts/validate.js` (✓, freeform-tech warnings OK) → log decisions.md + user-prompts.md + project.md §11 → STOP for user go-ahead.

**§04 conventions locked:** refs/books/papers/blogs/channels → `platform:web`; desktop shader tools + Blender/Unity/Unreal shader entries → `[win,mac,linux]`; NPR/cel/toon shading → `output:illustration`; quote any description containing inner `: `.

---

(Older status below — §07 + §02, both COMPLETE.)

## §02 RELOCATION DONE (2026-06-12)
All 17 misfiles moved out of §02, RELOCATE notes stripped, pure move (no dual_listed_in):
- 12 dev/build/scripting tools + Blender dev docs → §10 `misc-3d-utilities/01` (18→30).
- 2 ML lists (3D Machine Learning, Awesome 3D Human) → §09 `ml-for-cg/01` (4→6).
- 3 refs (Awesome 3D Printing, Usage in Science/Academia/Industry, Blender Checklist) → §11 `communities-forums/03` (new chunk; `chunks` 2→3 in data/11-learning-community.yml).
Sources: `blender-plugins-addons/04` 50→35, `blender-tutorials/01` 11→9. Validation passes (304 warnings, 0 RELOCATE flags, no new dupes). **NEXT: §04 lighting enrichment** (worst-first remaining: §04 → §06 → §08 → §01 → §09 [resolve NeRF/GS paper dumps] → §05 → §11 → §03).

## RESUME HERE (2026-06-12 pause point)

§02 modeling is being done **chunk-by-chunk** (user's chosen phasing; 1 phase = 1 chunk file, tiny ≤2-ent chunks batched). Plan file: `~/.claude/plans/make-plan-for-next-rippling-lantern.md`.

**Done (5 phases):** all 4 `blender-plugins-addons` chunks (01=22, 02=36, 03=48, 04=50 = 156) + `blender-tutorials/01` (11). Plugins: platform `[win,mac,linux]` on every addon, honest workflow/output, badge junk stripped; chunk 04 retyped 13 `community`→`plugin` + 2 `tool`→`plugin`. Tutorials: both empty `tags:{}` fixed (`creative-coding`+skill+web), skill/platform/output added, User Manual link-salad desc rewritten, `tech:[blender]` consistency on official docs.

**Phase 6 done:** `houdini-plugins-tools/01` (22 ent). platform on all Houdini desktop tools + `web` on cheatsheet; Wormhole `web`→desktop fix; stripped 3 wrong `houdini-addon` tags (Ffmpeg→cli, ZENO→node-based/physics, Cheatsheet→houdini); honest workflow/output; rewrote 3 descs.

**Phase 7 done:** `material-creation-tools/01` (9 ent). platform on all 9 (web/win/win+mac/win+mac+linux per tool); `output:archviz` Architextures, `creative-coding` ShaderExpo; trimmed 5 verbose/junk descs (NVIDIA, Agisoft `[!download]`, Materia, Architextures, TexGraph).

**Phase 8 done:** `houdini-more-tutorials/01` (15 ent). All already `platform:web`; added `skill` to all 15 + honest workflow (modeling/creative-coding/fx/animation/rigging/look-dev) + `tech:houdini`/`vex`. Enum note: use `look-dev` not `lookdev`.

**Phase 9 done:** `houdini-essential-learning/01` (6 ent). Already well-tagged; added `skill` to 5; fixed CGWiki broken desc grammar; removed banned "Comprehensive" from SideFX readme_tags.

**Phase 10 done:** `houdini-communities/01` (8 ent). Already well-tagged (all platform:web + tech:houdini). Light touch: `skill` on 3 educational refs/blog; 5 community hubs left skill-less by design.

**Phase 11 done:** `houdini-vex-coding/01` (7 ent). Added `workflow:creative-coding` to all 7 + `skill` to 5 missing. FLAG: Python Startup Scripts `url_status:unreachable`.

**Phases 12+13 done:** P12 `houdini-getting-started/01` (4) platform/tech; P13 tail batch (8 chunks, ~12 ent: c4d ×3, fusion-360, 3ds-max, houdini rigging/fx/rebelway). Platform per host (TyFlow=win, 3ds Max is Windows-only; AEC4D=win/mac; rest web). Retyped Rolando Gumroad `marketplace`→`asset-source`.

**§02 ENRICHMENT COMPLETE. Final facet coverage (of 251 ent):** platform 58→251 (~100%), workflow 43→168, output 13→55, skill 10→52. Validation passes (304 warnings, all pre-existing/benign freeform-tech). Empty `tags:{}` = 0.

**RELOCATE decision RESOLVED (user): "move to proper homes."** dev tools → §10 `misc-3d-utilities`; awesome-lists → §09/§11 reference. Deferred to a dedicated **§02 relocation phase** that batches ALL §02 misfiles in one pass: the ~16 in `blender-plugins-addons/04` + 2 in `blender-tutorials/01` (Blender Checklist, Developer Documentation — both still in place, RELOCATE notes kept, `platform:web` added). Run this phase after the enrichment phases below.

**Remaining §02 work: ONLY the relocation phase** (see RELOCATE block above). All 13 enrichment phases done.

`houdini-grooming/01` = 0 entries → skipped.

**STRUCTURAL DECISION — RESOLVED (user, 2026-06-12): option (c) "move to proper homes".** `blender-plugins-addons/04` holds ~16 `RELOCATE`-flagged entries: Blender build/version managers (BlenderUpdater, Blender Updater CLI, Blender Version Manager, Blender Launcher, Blender Manager), dev tooling (Fake Bpy Module, Blender Addon Tester, 3DN BIP, Advanced Blender Add-on, Blender Scripting, Blender CLI Rendering), and 4 unrelated reference/awesome lists (Awesome 3D Human, Awesome 3D Printing, 3D Machine Learning, Usage in Science/Academia/Industry). Plus 2 in `blender-tutorials/01` (Blender Checklist, Developer Documentation). **Plan:** dev/build/scripting tools → §10 `misc-3d-utilities`; the 4 awesome-lists → §09/§11 reference. Execute as the **dedicated §02 relocation phase** (after enrichment phases 7-13), all in one coherent pass. Entries still in place + tagged + filterable until then.

**§02 conventions locked this session (reuse for remaining phases):** Blender/Houdini/C4D/etc addons = `[win,mac,linux]`; forum-thread/Gumroad/web URLs do NOT make an addon `web` (platform = where the DCC runs); educational tutorials/channels/courses → `skill` + `web`; `creative-coding` for VEX/scripting/dev tools; strip `[![][repo]]`/`[![market]]`/`![][gpl]`/`[[medium]]`/`[$] :` junk.

---

## (Earlier) Status as of 2026-06-11. Work PAUSED mid-§07. All decisions deferred but documented below.**

This doc lets the next session pick up exactly where this one stopped. Read it together with:
- Approved plan: `C:\Users\Devanshu\.claude\plans\see-the-last-few-optimized-zephyr.md`
- `memory/decisions.md` (dated log) + `project.md` §11 (pending tasks)
- `CLAUDE.md` + `schema/vocab.yml` (closed enums) before any tagging.

---

## 1. What this sweep is

Enrich catalog entries (§01–§11; §12 was already done before this sweep) so the site's **filter UI** can find them. The filter chips run on `workflow` / `platform` / `license` / `output`, and coverage was thin (catalog-wide before the sweep: workflow 35%, platform 40%, output 48%, skill 1.6%). Most entries had a `tags:` block with only `tech:`, so they fell through every chip.

**User decisions that govern the whole sweep (locked):**
1. **Section by section, deep.** One section = one phase. Worst/largest first. Validate + log + **stop for user confirmation between sections.**
2. **Add the `skill` facet** (`beginner`/`intermediate`/`advanced`) to educational entries (`tutorial`, `channel`, courses, learning).
3. **Expand thin descriptions**, not just defects (short-but-valid get what-it-is + what-it-does; never bloat a good terse line).

**Section order (worst-first):** §10 → §07 → §02 → §04 → §06 → §08 → §01 → §09 → §05 → §11 → §03.

---

## 2. Progress so far

| Phase | Section | Status |
|---|---|---|
| 1 | **§10 tools-pipeline** (325 ent, 16 chunks) | ✅ DONE. platform 27%→80%, workflow 13%→36%, output 10%→36%. |
| 2 | **§07 game-dev** (812 ent total) | ✅ DONE. 7A + 7B + 7C all done. platform 811/812, skill 70, output 812. |
| 3 | **§02 modeling** (251 ent, 21 chunks) | 🔄 IN PROGRESS, PAUSED 4/13 phases. All 4 blender-plugins chunks done (156 ent). platform 58→198. See "RESUME HERE" at top. |
| 4+ | §04, §06, §08, §01, §09, §05, §11, §03 | ⬜ NOT STARTED |

### §07 breakdown (split into sub-phases because it is 812 entries)
- **7A — non-engine subsections (19 files, ~290 ent): ✅ DONE.** Files: `game-design-theory`, `game-dev-ai-procedural`, `game-dev-analytics`, `game-dev-audio-middleware`, `game-dev-communities`, `game-dev-courses`, `game-dev-dialogue-narrative`, `game-dev-learning-channels`, `game-dev-level-design`, `game-dev-networking`, `game-dev-physics`, `game-dev-sprite-vfx`, `game-dev-version-control`, `game-jams`, `godot-communities`, `godot-learning`, `godot-official`, `godot-plugins`, `xr-ar-vr`.
- **7B — `unity-engine-resources/` (now 10 chunks, 452 ent): ✅ DONE 2026-06-12.** Full hand-curation (approach B). platform 17→452, skill 0→10, output 438→452, empty-tags 0, junk 0. Chunk 09 was over-cap (59) → split into 09 (43) + new **10** (16, texture/material cluster). All chunks ≤50.
- **7C — `unreal-engine-resources/` (4 chunks, 184 ent): ✅ DONE 2026-06-12.** Full hand-curation (approach B). platform 11→184, skill 0→13, output 178→184. All chunks ≤50 (no split needed). Mobile plugins → ios/android; Windows tools → win. Fixed wrong Locus desc, InstancedStruct placeholder, link-salad badges, ~30 doc name-restaters. FLAG: duplicate official UE YouTube channel (2 entries in chunk 04).

Validation currently passes: `✓ Validation passed. 281 warnings.` (all warnings are pre-existing freeform-tech notices like `paper`/`godot`/`maya` + cross-chunk-dupe notices). 36 files changed this session, uncommitted (user commits).

---

## 3. THE OPEN DECISION (deferred — ask user before doing 7B/7C)

The 636 unity+unreal entries are uniform engine awesome-list imports: all `output: games`, all missing `platform`, educational ones missing `skill`. `workflow` mostly has **no honest vocab value** here (no "gameplay-programming"/"level-design" in the enum), so platform + skill are the real wins. I asked the user to choose an approach; they paused instead. Re-ask next session. The three options presented:

- **(A) Heuristic platform + hand skill/desc (recommended).** Deterministically add `platform` by `entry_type` across all 636 (`plugin`/`tool`/`asset-source`/`software` → `win, mac, linux`; `channel`/`tutorial`/`reference`/`community`/`inspiration`/`book` → `web`), review via `git diff` + validate, then hand-pass skill facets + junk/thin descriptions. Risk: a web thing mistyped `tool` wrongly gets desktop platforms (rare in engine lists; catch in diff).
- **(B) Full hand-curation, chunk by chunk.** Like §10/7A. Highest quality, spans several more turns, heavy tokens.
- **(C) Platform-only heuristic, skip skill/desc deep-dive.** Fastest; lifts filterability only.

---

## 4. The per-entry recipe (apply every section — proven on §10 + 7A)

Priority order per entry:
1. **Fill missing tag facets** from closed enums in `schema/vocab.yml`: `workflow`(27), `output`(15), `platform`(9), `skill`(3); `tech` freeform-but-curated. **Never invent closed-enum values** — map to closest or drop, ask if genuinely new.
   - software/tool/plugin → must have `platform` (+`output` where it implies a medium). `workflow` ONLY where it honestly maps.
   - tutorial/channel/course → `skill` (+`workflow` like `creative-coding` for programming).
2. **Empty `tags: {}`** → real facets.
3. **Add `license`** to software/plugin/tool/asset-source/marketplace lacking it (channels/refs/communities legitimately have none). Infer: `[$]`→Paid, "free"→Free; leave absent if unknown rather than guess.
4. **Descriptions:** fix junk (`[![][repo]]`, `[bibtex](...)`, project-page/link-salad, truncations), rewrite name-restaters, expand thin-but-valid. Caveman lite, ≤300 chars, **no em-dashes, no AI tells** (`comprehensive`/`robust`/`powerful`/`seamless`/`leverage`/`utilize`/etc.), `: ` in titles.
5. **Misfiled:** relocate + retype `entry_type` if wrong. `dual_listed_in` for genuine cross-listing, not duplication.
6. **Wrong tags:** strip nonsense (e.g. `blender` tags on non-blender tools).

Leave terse-but-correct descriptions + already-well-tagged entries alone. Chunks stay ≤50 (append rule).

### Per-phase protocol
1. Read the section's chunk files, apply recipe (rewrite whole small files; for already-tagged files do targeted edits).
2. `node scripts/validate.js` → `✓ Validation passed.`, **zero new errors** (freeform-tech warnings OK).
3. Log to `memory/decisions.md` + `memory/user-prompts.md`; update `project.md` §11.
4. **Stop. Report. Wait for user go-ahead** before next section.

---

## 5. Conventions / decisions discovered THIS session (reuse them)

- **`platform` is the headline win** for tools/pipeline/game-dev. For dev/CLI/pipeline/gameplay tools the production-stage `workflow` enum often has no honest value — add platform (+output) and skip workflow rather than force it. Use `creative-coding` for programming/scripting resources.
- **entry_type → platform heuristic** (used for the 7B/7C proposal): runs-in-engine/desktop (`plugin`/`tool`/`asset-source`/`software`) → `win, mac, linux`; online content (`channel`/`community`/`tutorial`/`reference`/`inspiration`/`book`) → `web`. Apple/iOS tools → `mac`/`ios`; Android → `android`; web apps → `web`.
- **Papers** (NeRF/GS/research): keep `Author et al., VENUE YEAR | [github]` description, add `year` + `paper` tech tag + `platform: [web]`. Established §09 convention.
- **Gumroad individual products** mistyped `marketplace` → retype `plugin` (addons) / `asset-source` (asset packs). Real marketplaces (Blenderkit, Gumroad, aescripts, Godot Asset Store) stay `marketplace`.
- **`godot`** added as a freeform `tech` tag (parallels existing `houdini`/`maya`/`c4d`). Engine plugin tech tags: `unity-plugin`, `unreal-plugin`, `houdini-addon`, `blender-addon`.
- **Hardware** entries (headsets, scanners, mocap) → `entry_type: hardware`.
- **Junk-stripping**: `[bibtex](./NeRF-and-Beyond.bib...)` + `<!---...-->` + `[![][repo]]`/`[![market]]` badges. The 2026-06-09 pass only stripped `.txt` bibtex; `.bib` survived until §10. Quick scan before editing: `grep -rn '\[!\[\|bibtex' data/<section>/`.

---

## 6. Flagged items (carry forward, do NOT silently drop)

1. **NeRF/GS research-paper dumps** live in §10 `photogrammetry-scanning/02` (~45 papers, got junk/desc fixes only, NO paper-facets yet) + `gaussian-splatting-nerf/` + `photogrammetry-scanning/01`. They overlap §09 `papers/`. **Resolve in the §09 phase**: standardize paper facets (`paper` tag + `year` + `platform: web`) AND decide relocation+dedup of §10 paper dumps → §09/papers (precedent: 2026-06-11 §12 pass relocated 2 NeRF papers). This is a structural call — surface to user.
2. **Over-cap chunks (>50, ADR-0001):** `unity-engine-resources/09` = 59 entries; `plugin-marketplaces/01` = 51 (empty `02` beside it). Validator only warns. Move overflow into a fresh/empty chunk when touching those subsections.
3. **vfxcamdb.com** appears twice in §10 (`misc-3d-utilities` + `matchmoving-tracking`) — possible dupe to consolidate via `dual_listed_in`.

---

## 7. First actions for next session

**Immediate next task: the §04 RELOCATION PHASE** (see the §04 block at the very top of this file — §07, §02, and §04 enrichment are all COMPLETE).

1. Read `project.md`, `CLAUDE.md`, all `memory/*`, and this file.
2. Append the new user prompt to `memory/user-prompts.md` (protocol).
3. **Run the §04 relocation phase** (only remaining §04 work). Batch-move all 8 flagged misfiles in one pass (mirror the 2026-06-12 §02 relocation precedent: pure move, no `dual_listed_in`, strip `notes` on move, decrement source `chunks` counts only if a whole chunk file is removed):
   - chunk 02 → §12: **MoonRay** (render engine), **CopperLicht** (WebGL engine).
   - chunk 04 → KodeLife → §12; **Photo tourism** → §09 photogrammetry; **Physics-Based Animation** → §06; **React Spring** → §06 (animation lib); **Let's remove Quaternions** → no clean home (ask user: §06 math, or drop the tag/leave).
   - chunk 05 → **Takua Renderer** (`RELOCATE?`) → §04 `renderer-specific-learning` (confirm with user first; it may be fine to keep + just strip the note).
   - Confirm exact target subsections with user before moving (some homes are ambiguous: shader-editor tools, math theory).
4. Validate (`node scripts/validate.js` → ✓, 0 RELOCATE flags remain in §04), log to decisions.md + user-prompts.md + project.md §11, update this handoff, **stop** for confirmation.
5. **Then continue worst-first to the next section: §06** → §08 → §01 → §09 (handle the NeRF/GS paper dumps + §10 overlap here, see §6.1 below) → §05 → §11 → §03. Re-confirm baseline facet coverage for §06 before starting and phase it chunk-by-chunk (user's standing preference).

## 8. Quick state-check commands

```bash
node scripts/validate.js | tail -1                       # must end: ✓ Validation passed. (baseline 312 warnings as of §04 done)
# facet coverage for a section (swap in the target dir, e.g. data/06-... for §06):
for x in workflow platform output skill; do echo "$x: $(grep -rh "^      $x:" data/<section>/ | wc -l)"; done
grep -rn 'RELOCATE' data/04-lighting/                    # §04 relocation flags still pending (expect 8 until moved)
grep -rho 'tags: {}' data/<section>/ | wc -l              # empty-tag count (target 0)
grep -rn '\[!\[\|bibtex' data/<section>/                  # junk scan (target none)
```

Do NOT rebuild `_site/` or `README.md` (generated; user commits + builds separately).
