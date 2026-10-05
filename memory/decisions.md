# Decisions

Architectural / structural decisions w/ rationale + date.

## Format
- **YYYY-MM-DD — Title**
  - Decision:
  - Why:
  - Impact:

## Log
- **2026-10-05 - Web discovery phase 1: software + tools (+151) and Guerilla Render fix.**
  - Decision: user picked software+tools first and said add without waiting. AI tools go canonical in §12 ai-* buckets with dual_listed_in mirrors (existing convention), not §09 open-source-models-hf. Invalid workflow guesses mapped to closest enum (retopology->retopo, audio->audio-design) or dropped (layout, level-design; photogrammetry moved to tech).
  - Impact: 151 entries, validate ✓ 439 warnings, 0 errors. Uncommitted.
- Older entries (2026-04 to 2026-09-30): see `memory/archive/decisions-2026Q2Q3.md`.

## 2026-10-05 — PR/issue triage + first archive.org URL

- PR review rule: only merge entries whose site works and whose claims match the site (user: "we only merge the ones that work"). Checked each tool's page/JS, not just HTTP 200. User clicks merge; Claude posts review comments.
- #18 Meshory: changes requested (free trial claim false; price change 2026-10-28). #20 3DTexel: rebase requested. #19, #24 ready.
- #22: dead links -> `deprecated: true` (3). False positives -> `url_status: ok` + `notes:`. Importance Sampling for Production Rendering repointed to `web.archive.org/web/20200501114833/...` (PDF verified). New convention: archive.org URLs allowed when original host is dead sitewide and a snapshot of the exact resource is verified. Steam entry rewritten from its real title.
- Unreachable triage method: recheck with browser UA + 2 attempts + DoH DNS (Cloudflare/Google). NXDOMAIN or no A record = dead -> `url_status: broken` + `deprecated: true`. Connection refused/timeout/5xx with live DNS = leave `unreachable`, recheck next run. Cloudflare challenge 403 = alive, add `notes:`.
- Watch for hijacked domains: a 200 can be a squatter (Dume's rainboxlab.org -> gambling site). Compare page title to the entry, not just status code.
- Redirect triage rules (batch 2): update URL to the live target unless (a) original is a site root on the same host, (b) the redirect only inserts a locale segment (geo artifact: /en, /ja, en-in), (c) target is a sign-in wall, (d) original is a DOI. Redirects landing on a homepage/404/unrelated page/"discontinued" notice -> deprecate + `notes:`. Hijacked domains -> deprecate + note warning not to restore.

## 2026-10-05: Audit fix plan (7 phases)
- Tech vocab: add paper/houdini/godot/unity/maya/render-farm/unreal/vex/redshift/cinema-4d to curated tech; normalise c4d->cinema-4d, VDB->vdb, drop cc-by. User approved.
- Drop 6 empty subsections (houdini-grooming, animation-courses, motion-graphics-courses, video-editing-courses, concept-art-courses, texture-material-generation); keep thin ones (noindex covers them).
- §12 misfiles: relocate obvious learning/channel/community/reference items only.
- Commit + push per phase, no stops between phases.
- XSS defence: schema url ^https?:// + escape at render (not reject <>, 2 live descs use them) + JSON-LD `<` -> <.
- Phase outcomes (2026-10-05): XSS closed (html-safe.js); /sections/ cross-links -> subsection pages; README auto-render workflow (render-readme.yml) instead of failing CI on stale README, so contributor PRs only touch data/; render.js must never read gitignored files (awesome-mining list moved to data/awesome-sources.yml); 24 bot-auto-deprecated live entries restored; texture-material-generation kept (8 mirrors); project.md §11 log -> CHANGELOG.md; memory decisions/prompts to 2026-09-30 -> memory/archive/.
