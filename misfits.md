# Misfit Cleanup — Handoff

Resume point for the data/ misclassification cleanup. Two prior restructure passes flagged ~270 entries as misclassified but never executed the moves.

## Two flag types

- **`# MISFIT:` YAML comments** — flagged at the comment line above an entry. Comment usually names the correct destination ("not Houdini — Move to youtube-blender").
- **`notes: 'RELOCATE: <target>'` field** — flagged inside the entry's `notes`. Target is free-text, e.g. `RELOCATE: blender-plugins`, `RELOCATE: motion-graphics/after-effects-plugins`.

Both indicate the same thing: entry sits in the wrong section. Cleanup = move + strip the marker.

## Process (proven, works)

1. **Identify scope** of the file: `Grep` for `MISFIT` / `RELOCATE:` and read the full source YAML.
2. **Map each misfit to a destination subsection** by reading its `notes` / `# MISFIT` hint plus the entry's actual content. When the hint is vague, sample neighboring destination files to confirm fit.
3. **Confirm any judgment calls with the user** before executing — especially:
   - Web-only animation/UI tools (Rive/Flutter/SwiftUI/Webflow) — user has said: park under `12-software-reference/2d-animation-software/01` for now.
   - Low-value entries (single Reddit threads, broken truncated descriptions) — ask delete vs. keep.
   - Generalist channels that span multiple targets (e.g., Cherno → game-dev-learning-channels, not unreal).
4. **Write a one-shot Node script** (`scripts/relocate-<source>-misfits.js`) that:
   - Loads source YAML via `js-yaml`.
   - Builds `name -> {entry, idx}` map.
   - For each destination bucket, parses dest YAML, pushes the entry (with `notes` stripped if it's a RELOCATE/MISFIT note), writes back via `yaml.dump(doc, { lineWidth: -1, quotingType: "'", forceQuotes: false })`.
   - Filters source by `removeIdx` set, writes filtered source.
5. **Run** with `node scripts/relocate-<source>-misfits.js`, then `rm` the script.
6. **Verify**:
   - `grep -c "MISFIT\|RELOCATE:" <source-file>` should drop to 0.
   - `git diff --stat data/` should show clean appends to destinations and removals from source.
   - Spot-check one destination diff for unintended structure changes.

## Why a script (not Bash heredoc)

- Heredoc choked on apostrophes in YAML body (`YanSculpts'`, `'2026-04-19'`).
- `js-yaml` round-trip preserves entry structure, handles all quoting safely, and strips comments cleanly. Comment loss is acceptable here because the only comments in destinations are MISFIT markers we want to drop — verify with `git show HEAD:<dest> | grep -c "^ *#"` before running, like the youtube-blender check did.

## What's done

| Section | Misfits cleared |
|---|---|
| `11-learning-community/youtube-houdini/01` | 38 |
| `03-animation/animation-learning-channels/01` | 26 |

**Total: 64 of ~266 cleaned.**

Three new entries also added during this session (Rebelle 8 Pro → drawing-painting-3d, ArcBrush → design-tools, Filter Forge → material-creation-tools).

## What's next — task list (priority order)

### MISFIT files (31 remaining)

- [ ] `11-learning-community/communities-forums/02` — note: this file uses **RELOCATE:** notation, not `# MISFIT:` comments. 31 entries flagged. Big job.
- [ ] `11-learning-community/communities-forums/01` — 13 RELOCATE entries.
- [ ] `07-game-dev/unity-engine-resources/08` — 6 MISFITs.
- [ ] `07-game-dev/unreal-engine-resources/03` — 5 MISFITs.
- [ ] `04-lighting/rendering-shader-theory/01` — 5 RELOCATE.
- [ ] `09-ai-ml/ai-assisted-cg-tools/01` — 7 RELOCATE.
- [ ] `07-game-dev/xr-ar-vr/01` — 4 MISFITs.
- [ ] `10-tools-pipeline/photogrammetry-scanning/02` — 4 RELOCATE.
- [ ] `07-game-dev/game-design-theory/01` — 4 RELOCATE.
- [ ] `01-assets/model-libraries-specialized/01` — 4 RELOCATE.
- [ ] `07-game-dev/unity-engine-resources/03` — 2 MISFITs.
- [ ] `07-game-dev/unity-engine-resources/06` — 2 MISFITs.
- [ ] `02-modeling/blender-plugins-addons/03` — 2 RELOCATE.
- [ ] `01-assets/stock-images/01` — 2 RELOCATE.
- [ ] singletons: `audio-sfx-music`, `textures-specialized`, `game-dev-analytics`, `unreal-engine-resources/04` — 1 each.

### RELOCATE-heavy files

- [ ] `01-assets/textures-free-pbr/02` — 33
- [ ] `11-learning-community/communities-forums/02` — 31 (also listed above)
- [ ] `01-assets/textures-free-pbr/01` — 29
- [ ] `02-modeling/blender-plugins-addons/01` — 28
- [ ] `02-modeling/blender-plugins-addons/02` — 14
- [ ] `10-tools-pipeline/scene-pipeline-tools/01` — 14
- [ ] `01-assets/fonts/01` — 11
- [ ] `01-assets/model-libraries-free-general/01` — 10
- [ ] `09-ai-ml/ai-assisted-cg-tools/01` — 7 (also above)
- [ ] `07-game-dev/unreal-engine-resources/03` — 5 (also above)
- [ ] `04-lighting/rendering-shader-theory/01` — 5 (also above)
- [ ] `07-game-dev/game-design-theory/01` — 4 (also above)
- [ ] `10-tools-pipeline/photogrammetry-scanning/02` — 4 (also above)
- [ ] `01-assets/model-libraries-specialized/01` — 4 (also above)
- [ ] `10-tools-pipeline/plugin-marketplaces/02` — 3
- [ ] `01-assets/hdris/01` — 3
- [ ] `01-assets/stock-images/01` — 2 (also above)
- [ ] `02-modeling/blender-plugins-addons/03` — 2 (also above)
- [ ] singletons across 4 files — 1 each

### Suggested order

1. Knock out 1-MISFIT singletons first (cheap wins, ~30 min).
2. `unity-engine-resources/03/06/08` and `unreal-engine-resources/03/04` — same pattern as Round 1, fast.
3. `xr-ar-vr/01` (4 MISFITs).
4. Then the big RELOCATE batches: `textures-free-pbr` 01+02 (62 combined), `blender-plugins-addons` 01+02+03 (44), `communities-forums` 01+02 (44).
5. Remaining RELOCATEs by impact.

## Standing decisions from user

- **Web-only animation/UI** (Rive, Flutter, SwiftUI, Webflow tutorials/articles): park in `12-software-reference/2d-animation-software/01` for now. User explicitly approved this bucket.
- **Cherno (general C++/engines)** → `game-dev-learning-channels`, not unreal-engine-resources.
- **Low-value singletons** (lone Reddit thread, truncated description, no real value): delete after asking.

## Standing destination map (from work so far)

| Source pattern | Destination |
|---|---|
| Blender YouTube channels | `11-learning-community/youtube-blender/01` |
| Unity plugins | `07-game-dev/unity-engine-resources/<latest>` |
| Unity VR/AR | `07-game-dev/unity-engine-resources/<latest>` (add `tech: xr`) |
| Unreal channels/plugins | `07-game-dev/unreal-engine-resources/<latest>` |
| Godot | `07-game-dev/godot-learning/01` |
| AR/VR research, XR tools | `07-game-dev/xr-ar-vr/01` |
| Game showcase / inspiration | `11-learning-community/inspiration-showcase/01` |
| Sprite assets | `07-game-dev/game-dev-sprite-vfx/01` |
| Pixel-art / Rive / Flutter / SwiftUI / Webflow | `12-software-reference/2d-animation-software/01` |
| Stock illustrations | `01-assets/stock-images/01` |
| 3D model packs (emoji, etc.) | `01-assets/model-libraries-specialized/01` |
| Blender add-ons | `02-modeling/blender-plugins-addons/<latest with room>` |
| Generalist game-dev channels (C++/engine-agnostic) | `07-game-dev/game-dev-learning-channels/01` |

## Resume command

To pick up: read this file, `Grep MISFIT\|RELOCATE: data/`, pick the next file from the task list, ask the user any judgment calls flagged in "Standing decisions", run the script pattern from "Process".
