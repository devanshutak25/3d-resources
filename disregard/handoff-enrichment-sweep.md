# Handoff: Catalog-wide searchability enrichment sweep

**Status as of 2026-06-12. §07 COMPLETE. §02 ENRICHMENT COMPLETE (all 13 phases). Only the §02 RELOCATION phase remains before moving to §04.**

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

1. Read `project.md`, `CLAUDE.md`, all `memory/*`, this file, and the plan file.
2. Append the new user prompt to `memory/user-prompts.md` (protocol).
3. Re-ask the **§3 open decision** (how to handle the 636 unity/unreal bulk: A/B/C). Recommend A.
4. Execute 7B (unity) then 7C (unreal) per the chosen approach. Fix the 59-entry over-cap chunk while there.
5. Validate, measure §07 facet lift (`grep -rh "^      platform:" data/07-game-dev/ | wc -l`), log, report, **stop** for confirmation before §02.
6. Continue worst-first: §02 → §04 → §06 → §08 → §01 → §09 (handle paper dumps here) → §05 → §11 → §03.

## 8. Quick state-check commands

```bash
node scripts/validate.js | tail -1                       # must end: ✓ Validation passed.
# facet coverage for a section:
for x in workflow platform output skill; do echo "$x: $(grep -rh "^      $x:" data/07-game-dev/ | wc -l)"; done
grep -rho 'tags: {}' data/<section>/ | wc -l              # empty-tag count (target 0)
grep -rn '\[!\[\|bibtex' data/<section>/                  # junk scan (target none)
```

Do NOT rebuild `_site/` or `README.md` (generated; user commits + builds separately).
