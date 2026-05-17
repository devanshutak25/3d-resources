# Decisions

Architectural / structural decisions w/ rationale + date.

## Format
- **YYYY-MM-DD — Title**
  - Decision:
  - Why:
  - Impact:

## Log
- **2026-05-17 — Local memory system created**
  - Decision: per-project /memory dir alongside global ~/.claude memory.
  - Why: project-scoped persistence, easier to commit/share if desired.
  - Impact: CLAUDE.md updated to read/write this dir each session.

- **2026-05-17 — Mobile collapsible graph panels**
  - Decision: legend `.g-panel` hidden by default on ≤720px; FAB toggle (`#panel-toggle`) slides it up as bottom sheet. Info card gets close (×) button on mobile; also positioned as bottom sheet above the FAB.
  - Why: legend was eating ~40vh of phone viewport, blocking the 3D canvas.
  - Impact: `assets/graph.html` (toggle button + inline JS), `assets/css/graph.css` (FAB styles + media query rewrite). Copied to `_site/`. Desktop UX unchanged.

- **2026-05-17 — Reverted README slim mode**
  - Decision: dropped Step 3 (`render.js --mode=lite`) from `build.sh`. README.md is the full catalog again (~734 KB).
  - Why: user confirmed full README renders fine on GitHub + mid-tier phones. "Uh oh" failure window in changes.md was likely intermittent/old. Quick-reference value > landing-page polish for this repo.
  - Impact: build.sh shorter. README grep-able again. Lite renderer code in render.js kept (dead but harmless) in case needed later.
  - Files: `build.sh`, `README.md` regenerated.
