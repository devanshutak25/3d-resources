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
- 2026-10-05: 4× general-purpose (parallel) — mocap libraries, mocap datasets, Maya rigs (seeded from animationmethods.com/rigs.html), other-app rigs. JSON to scratchpad, orchestrator imported via scratchpad import.js (catalog.appendEntry). 166 candidates -> 160 new + 4 tools. Gotchas: §10 section slug is `tools-pipeline-utilities`; agents missed Mesh2Motion dupe (validate caught it); `check-links.js --help` is NOT a help flag, it starts a full scan.
