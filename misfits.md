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

| Section | Misfits cleared | Round |
|---|---|---|
| `11-learning-community/youtube-houdini/01` | 38 | R1 |
| `03-animation/animation-learning-channels/01` | 26 | R2 |
| Singletons (audio-sfx-music, textures-specialized, game-dev-analytics, unreal/04) | 4 | R3 |
| `unity-engine-resources/03/06/08` + `unreal-engine-resources/03` + `xr-ar-vr/01` | 17 | R3 |
| `rendering-shader-theory/01` + `ai-assisted-cg-tools/01` + `photogrammetry-scanning/02` + `game-design-theory/01` + `model-libraries-specialized/01` | 25 | R3 |
| Tail: `hdris/01` + `stock-images/01` + `plugin-marketplaces/02` + `blender-plugins-addons/03` | 10 | R4 |
| `textures-free-pbr/01` + `textures-free-pbr/02` | 62 | R4 |
| `blender-plugins-addons/01` | 28 | R4 |
| `communities-forums/02` | 31 | R4 |
| `blender-plugins-addons/02` | 14 | R5 |
| `scene-pipeline-tools/01` | 14 | R5 |
| `communities-forums/01` | 13 | R5 |

**Total: ~282 cleaned. 2 files (~21 markers) remaining.**

Three new entries also added in earlier sessions (Rebelle 8 Pro → drawing-painting-3d, ArcBrush → design-tools, Filter Forge → material-creation-tools).

## R3 session decisions log (2026-05-01)

User-confirmed deletes (low-value / off-topic): `Javascript Voronoi`, `Unity Container`, `MobileLegend`, `IndoorAtlas`, `MonoDevelop`, `WakaTime`, `RGFW`, `Leonid Keselman` (GitHub user profile).

User-confirmed in-place strip (note removed, entry kept where it was — Sapphire is a video VFX plugin but lives in audio-sfx-music per user; Steam Playtest stays in game-dev-analytics; entries in unreal/03 already had tag-fixes applied, just stale notes).

Photogrammetry renames: `Paper.Pdf` → `Color-NeRF`, `**Browse the Paper List**` → `Awesome-3DGS Paper List`, `Ha-NeRF:laughing::...` → `Ha-NeRF: Hallucinated Neural Radiance Fields in the Wild`.

XR-AR-VR moves: `Blender Stack Exchange` → communities-forums/02; `Game Dev Cave` → game-dev-learning-channels/01; `Game View Maximizer` → unity-engine-resources/09; `OpenRPG Quest` → unreal-engine-resources/04.

## What's next — task list (priority order)

All remaining 13 files use **RELOCATE:** notation (no `# MISFIT:` comments left).

### Big RELOCATE batches

- [x] ~~`01-assets/textures-free-pbr/02` — 33~~ (R4)
- [x] ~~`11-learning-community/communities-forums/02` — 31~~ (R4)
- [x] ~~`01-assets/textures-free-pbr/01` — 29~~ (R4)
- [x] ~~`02-modeling/blender-plugins-addons/01` — 28~~ (R4)
- [x] ~~`02-modeling/blender-plugins-addons/02` — 14~~ (R5)
- [x] ~~`10-tools-pipeline/scene-pipeline-tools/01` — 14~~ (R5)
- [x] ~~`11-learning-community/communities-forums/01` — 13~~ (R5)
- [ ] `01-assets/fonts/01` — 11
- [ ] `01-assets/model-libraries-free-general/01` — 10

### Tail RELOCATEs (DONE in R4)

### Suggested order

1. ~~Tail (4 files, 10 markers)~~ — done R4 2026-05-01.
2. `textures-free-pbr` 01+02 (62 combined) — likely all PBR misclass moves to other texture/material sections.
3. `blender-plugins-addons` 01+02+03 (44) — split between `02-modeling/blender-plugins-addons/<latest>` consolidation and category moves.
4. `communities-forums` 01+02 (44) — moves to specific community/inspiration subsections.
5. `scene-pipeline-tools/01`, `fonts/01`, `model-libraries-free-general/01` — remaining moderate batches.

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
