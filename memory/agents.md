# Agents

Sub-agents spawned for this project + when to use.

## Used
- (none yet)

## Candidates
- Explore — broad code search > 3 queries.
- general-purpose — open-ended multi-step research.
- frontend-design / impeccable:* — UI polish on `_site/` output.

(log when invoked: date, agent, task, outcome)
- 2026-10-05: 4× general-purpose (parallel) — web discovery of new software/tools by slice (DCC/plugins, render/pipeline/VFX, engines/motion/CAD/sci-viz, AI). Each deduped vs a scratchpad catalog dump + verified live pages. Returned ~146 candidates; 151 added after merge. Gotcha: give agents the REAL vocab enums (I passed a guessed workflow list; 33 entries needed remap).
- 2026-10-05: Repo audit, 3 general-purpose agents in parallel (data quality, build/site code, CI/hygiene/docs). All read-only; scratch build in session scratchpad. Outcome: ranked findings delivered, nothing edited.
- 2026-10-05: Audit fix Phase 5, 7 general-purpose agents in parallel (rewrite descriptions A/B, backfill 151 new entries, §12 platform, §07 + §09 workflow, §12 misfile plan). Pattern that worked: agents write JSON patch files `{key, set}` to scratchpad only; orchestrator validates enums/style/length and applies via catalog.js (scratchpad p5-apply.js). Gotchas: one agent used nested `tags:{}` instead of dotted `tags.platform` keys (normalise before apply); apply moves LAST because moves change chunk keys; drop pricing_last_verified sourced from search snippets.
- 2026-10-31: /studios/ build. 5× research (vfx/VP/previs, animation, games/cinematics/outsourcing/mocap, archviz/product viz, XR/experiential/title) -> scratchpad research/out-*.json. 4× enrichment (SoM 500 -> fresh one-liners, disciplines, notable). 3× HQ verification. Shared BRIEF.md per job (rules + JSON shape + closed enums) kept prompts short. Gotchas: SoM ebook locations scrambled (Blur listed in Istanbul, Grind .it listed as Sofia) -> agents flagged ~35, auto site-text check flagged 185 for lookup; agents rename to site casing (BIGSTAR, Blur Studio); research facts sometimes from model memory, not fetched (games agent said so).
- 2026-10-05: 4× general-purpose (parallel) — mocap libraries, mocap datasets, Maya rigs (seeded from animationmethods.com/rigs.html), other-app rigs. JSON to scratchpad, orchestrator imported via scratchpad import.js (catalog.appendEntry). 166 candidates -> 160 new + 4 tools. Gotchas: §10 section slug is `tools-pipeline-utilities`; agents missed Mesh2Motion dupe (validate caught it); `check-links.js --help` is NOT a help flag, it starts a full scan.
- 2026-10-31: /studios/ v2. 8x general-purpose enrichment (95 rows each: founded, LinkedIn size band, 2D/3D re-tag, markets, with _src per fact) + 5x discovery (East Asia, S/SE Asia + Oceania, LatAm/MEA, Europe, NA + UK) + 2x India-sheet verification. Outcome: founded 169 -> 469 and size 84 -> 432 on existing rows; +478 studios. **Gotcha: WebSearch has a 200-call cap per SESSION shared by every subagent** (refills ~100/h). It ran out ~35 rows into the first agent; the rest fell back to WebFetch on guessed LinkedIn slugs (429s, wrong-company pages; agents rejected those on website/city mismatch) + Wikipedia + studio sites. Next time: fewer agents per wave, or tell agents to skip search and go straight to LinkedIn/Wikipedia fetches. Agents wrote progressive output files, which made partial dry-runs possible. Mainland China sites refuse non-CN fetches.
