# User Prompts Log

Every user prompt/question, verbatim, w/ timestamp + short answer note.

## Format
### YYYY-MM-DD HH:MM

Older prompts (to 2026-09-30): `memory/archive/user-prompts-2026Q2Q3.md`.

**Prompt:** (2026-10-05)
> go through issues and PRs https://github.com/devanshutak25/3d-resources and evaluate. Merge the PRs that fit. Issues as well

**Answered:** Evaluated 4 PRs (all validate) + 2 bot issues; proposed merge set, asked before merging.

**Prompt:** (2026-10-05)
> 1.Check the contents, we only merge the ones that work 2. I canclick  merge myself 3. Yes, order doesn't matter. Try using gh in a new shell

**Answered:** Found gh at full path. Verified site contents: #19/#20/#24 work, #18 pricing wrong. Proposed per-entry #22 fixes.

**Prompt:** (2026-10-05)
> 1. ok 2. put the comment 3. yes

**Answered:** Posted #18 change request + #20 rebase comment; applied 7 #22 data fixes (user picked Wayback repoint + Steam rewrite). Validate ✓.

**Prompt:** (2026-10-05)
> yes yes yes yes

**Answered:** Updated project.md + memory, committed + pushed #22 fixes, closed #22, started #23.

**Prompt:** (2026-10-05)
> yes yes work through in batches please

**Answered:** Closed #23 (no-op), fixed Defold description (commit b25586b), rechecked 63 unreachable URLs and proposed per-group fixes.

**Prompt:** (2026-10-05)
> 1. yes 2. yes

**Answered:** Applied batch 1 (34 ok incl. 9 URL moves, DuME repoint off a hijacked domain, 14 dead deprecated, 15 left unreachable); validate ✓; committed + pushed with Defold fix.

**Prompt:** (2026-10-05)
> don't wait after every batch, all batches approved

**Answered:** Ran batch 2 (521 redirects): 336 URLs updated, 152 confirmed ok, 31 deprecated (4 hijacked domains), 2 left. Validate ✓ (432 warnings: 8 newly visible cross-section dupes). Committed + pushed.

**Prompt:** (2026-10-05)
> Look up online for links to more assets, tutorials, resources, software, workflows, etc. Fresh seraches to find new items for the list. Also, add http://guerillarender.com/

**Answered:** Guerilla Render already cataloged (§12 render-engines, misspelled "Guerrilla", thin desc). Proposed phased search plan; asked user for scope/order before searching.

**Prompt:** (2026-10-05, AskUserQuestion answers)
> Guerilla: Fix existing entry. First phase: Software + tools. Approval: "Don't wait for me, usr your judgement ask as as many as you can find"

**Answered:** Fixed Guerilla Render entry; ran 4 parallel research agents; added 151 verified, deduped software/tool entries across §02/§06/§07/§10/§12; validate ✓ 439 warnings. Not committed.

**Prompt:** (2026-10-05)
> Audit this project repo please

**Answered:** Read-only audit via 3 parallel agents (data / build code / CI+docs). Top: stored XSS via url/description (javascript: passes schema), 243 broken see-also anchors on section pages, README stale vs data, freshness workflow blocked by Actions PR setting, 151 new entries lack url_status/readme_tags, 8 same-sub dupes, npm audit 2 high. No fixes applied.

**Prompt:** (2026-10-05)
> Make a plan to fix all the issues please

**Answered:** 7-phase plan (security, anchors, deps/CI, data correctness, data quality, perf, hygiene/docs) at ~/.claude/plans/snuggly-munching-truffle.md. User choices: add top ~10 tech tags to vocab, drop 6 empty subsections, relocate obvious §12 misfits, commit + push per phase. Approved and executed: all 7 phases committed + pushed (security, links, CI/deps, data correctness, data quality, perf, hygiene/docs). Validate ✓ 32 warnings, build 12 s, 0 broken links.

**Prompt:** (2026-10-05)
> Fix up open PRs please.
>
> The current deployment is on cloudflare. Do you think it matters if other md files are also deployed for a public repo?

**Answered:** Merged main into #18/#19/#20/#24, resolved #24 conflict, fixed Meshory pricing, tightened #19/#20 descriptions, added url_status; validate ✓. Push to forks denied by permission classifier, branches local. CF serves only _site/ (no .md); md exposure is not a secrecy issue in a public repo, but legacy GitHub Pages mirror is an SEO/duplicate-content issue: disable it.

**Prompt:** (2026-10-05)
> Run all these [the 4 git push commands to contributor forks]

**Answered:** Pushed pr-18/19/20/24 to contributor branches. All 4 PRs MERGEABLE; CI awaiting maintainer approval. Merge left to user.

**Prompt:** (2026-10-05)
> merge and close these PRs, no?

**Answered:** Merged #18, #19, #20 (merge commits); #24 was already merged by user. render-readme bot re-rendered README. Validate ✓ on main. No open PRs left.

**Prompt:** (2026-10-05)
> do it!

**Answered:** Committed + pushed project.md and memory updates to main.

**Prompt:** (2026-10-05)
> add https://andersonrohr.gumroad.com/

**Answered:** Added "Anderson Rohr Free Mocap Packs" (9 free mocap packs, incl. MetaHuman UE 5.6) to animation-rigging/ai-motion-capture. Validate ✓.

**Prompt:** (2026-10-05)
> Look up mocap libraries, enough to build out a whole section / and add this https://animationmethods.com/rigs.html + look for all the rigs you can find not just for Maya, all the software

**Answered:** 4 research agents. +4 §03 subsections: mocap-libraries 35, mocap-datasets 44, character-rigs-maya 37 (incl. animationmethods + getrigs), character-rigs-other 44; +4 rig tools in §10. Moved 4 lib/dataset entries out of ai-motion-capture. Link-checked; validate ✓, build ✓. Uncommitted.
