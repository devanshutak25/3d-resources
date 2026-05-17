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

- **2026-05-17 — Handoff growth docs created**
  - Decision: created `/handoff/` dir at repo root with 13 markdown files covering all non-code growth (prelaunch hygiene, v1.0.0 release, awesome lists, reddit, discord, HN, twitter/bluesky, newsletters, product hunt, ongoing growth, KPIs, copy snippets, index README).
  - Why: owner ships code; non-code launch/growth gets handed off to an operator. `pub_plan.md` Part 2 was a 10-bullet stub — not executable.
  - Impact: operator with zero project context can execute end-to-end. Templates use `[BRACKETS]` for fill-ins, inline `[ ]`/`[x]`/`[-]` checkboxes for tracking. `copy-snippets.md` is single source of truth for taglines/pitches. `pub_plan.md` updated with redirect line to `/handoff/`.
  - Files: `handoff/README.md`, `handoff/00`–`10`, `handoff/copy-snippets.md`, `pub_plan.md` (1 line redirect).

- **2026-05-17 — Mobile collapsible graph panels**
  - Decision: legend `.g-panel` hidden by default on ≤720px; FAB toggle (`#panel-toggle`) slides it up as bottom sheet. Info card gets close (×) button on mobile; also positioned as bottom sheet above the FAB.
  - Why: legend was eating ~40vh of phone viewport, blocking the 3D canvas.
  - Impact: `assets/graph.html` (toggle button + inline JS), `assets/css/graph.css` (FAB styles + media query rewrite). Copied to `_site/`. Desktop UX unchanged.

- **2026-05-17 — Reverted README slim mode**
  - Decision: dropped Step 3 (`render.js --mode=lite`) from `build.sh`. README.md is the full catalog again (~734 KB).
  - Why: user confirmed full README renders fine on GitHub + mid-tier phones. "Uh oh" failure window in changes.md was likely intermittent/old. Quick-reference value > landing-page polish for this repo.
  - Impact: build.sh shorter. README grep-able again. Lite renderer code in render.js kept (dead but harmless) in case needed later.
  - Files: `build.sh`, `README.md` regenerated.
