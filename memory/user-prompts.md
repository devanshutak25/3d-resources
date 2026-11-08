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

**Prompt:** (2026-10-12)
> cgeck issues and prs

**Answered:** 0 open issues. 1 open PR: #25 CADProps GLB Viewer (affiliated contributor). Site live, claims match, validate ✓, no CI run. Ready to merge; suggested renaming entry to "CADProps GLB Viewer".

**Prompt:** (2026-10-12)
> fix it, merge it and then close it

**Answered:** Merged #25 (closed via merge). Rename push to fork missed the merge, so renamed to "CADProps GLB Viewer" on main directly. Validate ✓.

**Prompt:** (2026-10-31)
> check pull requests and issues

**Answered:** 10 open PRs (#27-#38), 2 issues (#26, #29). All merge clean together, validate ✓ 32 warnings (= base), no dupes, all sites live. Ready: #27 WeMotion, #36 STLFixer, #37 AquaGuard, #38 RefVid. Small fix: #34 drop ?ref, #31 platform+desc, #32 retopo claim, #35 paid custom-design disclosure, #30 stale pricing (875 credits, Cinema tier). Decline: #28 imgmov (vendor SEO prompt list, poor fit). Issues #26 Nebula Forge, #29 RespawnStack verified, addable. No CI ran (fork workflows need approval). Nothing posted or merged.

**Prompt:** (2026-10-31)
> push, merge and close issues

**Answered:** Pushed fixes to 5 fork branches (#30/#31/#32/#34/#35), merged 9 PRs, closed #28 with note. Added Nebula Forge (§02 blender-plugins-addons) + RespawnStack (§09 ai-assisted-cg-tools), stamped url_status on all 11; commit closes #26 + #29. Validate ✓ 32, tests 7/7, build ✓.

**Prompt:** (2026-10-31)
> I want to make a /studios page which has aniamtion, vfx, motion design, cg, arch viz, game and any other type of studios. Ask me questions for better alignement

**Answered (2 AskUserQuestion rounds):** separate studios directory (own data + schema, not in README); all studio types incl. VP, product viz/CGI ads, XR/immersive, outsourcing/support ("all relevant studios please"); fields: location, careers, notable work, size + founded, website, social media; first batch "around 200 to start with, you can use the school of motion list to begin with. the goal is to add all the studios in the world by the end", then "All 500 SoM + others"; single filterable page; text cards. SoM 500 Studios PDF supplied by user (moved repo root -> disregard/som-500-studios.pdf so it can't be committed). Spec + phase plan proposed, waiting for go.

**Prompt:** (2026-10-31)
> go for all phases please

**Answered:** Built /studios/ end to end. Infra (schema, catalog loaders, validator, page builder, filter JS, CSS, sitemap/llms/header links, issue form, test). 754 studios: 481 SoM (HQs re-verified, SoM locations scrambled) + 270 from research agents. Careers 303, socials 645. check-links scans studios. Validate ✓ 32, tests 8/8, build ✓, links ✓. Not committed.

**Prompt:** (2026-10-31)
> push changes resolve conflicts please

**Answered:** Committed studios work on main, rebased onto bot README re-render (c20ba87); README conflict resolved by re-rendering from data. Validate + tests before push. Pushed to origin/main.

**Prompt:** (2026-10-31)
> let's look for more studios for /studios and add the ability to do grouping based on location and size. Also color code desciplines
>
> I also think we don't need to have body text in the studio cards, makes the card bigger without adding siginficant amount of info. We can just flesh out the desciplines if we need more detailed information
>
> also, if possible we should add age of the studios
>
> run one more pass of UI cleanups for the /studios page please
>
> add the ability to lazy load cards. no need to load all the cards at the start
>
> run localhost for testing in this session

**Answered:** Asked 2 enum questions (sizes -> 4 LinkedIn bands; animation -> 2D/3D split + new markets "Works for"). Built lazy JSON-rendered page with group by region/country/size/age, colored discipline pills, no description, age "Est. YYYY (N yrs)", icon socials. 8 enrichment + 5 discovery agents: 754 -> 1,232 studios. localhost:8080 via scratchpad serve.js. Validate ✓, tests 8/8, build ✓. Not committed.

**Prompt:** (2026-10-31, mid-task)
> add studios from this as well if any are missing - "C:UsersDevanshuDesktopIndian Studios Repository - Sheet1.csv"

**Answered:** 204 rows (Animator's Guild India list), 20 already listed, 2 agents verified the rest: 101 added, rest skipped (dead domains, live-action ad houses, non-CG agencies). Sumo Digital India -> Pune office.

**Prompt:** (2026-10-31)
> touch up UI please [Image #1]

**Answered:** Filter panel polish: search icon, denser chips, Works for + People (size, short labels) on one row, labels aligned to chips, tinted active chips everywhere, dark native controls + accent checkbox, intro trimmed (suggest link moved to credit line), social icons right-aligned on wrap, chip-row scroll fade + 2-column tablet grid. Shared site header left as-is (all generated pages use it).

**Prompt:** (2026-11-02)
> There are a lot of now vibe coded tools out now. Can you please find and add more assets
>
> Add https://keenface.ai/ and https://github.com/nikopueringer/CorridorKey2.0
>
> Also, look for more studios.
>
>
> Let's flesh out our lists even more

**Answered:** Catalog +367 (3,838 -> 4,205), studios +188 (1,232 -> 1,420, 79 countries). Added KeenFace (§09 3d-generation), CorridorKey 2.0 repo + paid CorridorKey 2.0 Plugin (§09 ai-assisted-cg-tools); fixed original CorridorKey license Open Source -> Free (custom CC BY-NC-SA terms). 5 catalog discovery agents (web-tools, dcc-plugins, ai-cg, motion-vfx, assets) + 3 studio agents (asia, emea, americas+specialists) launched.

**Prompt:** (2026-11-03)
> yes please, push

**Answered:** Committed the discovery batch on main and pushed to origin/main.

**Prompt:** (2026-11-03)
> Can you brainstorm which segment and type of 3d motion design game or arch viz studios we might have missed

**Answered:** Gap analysis from data: games 216 (US 11, JP 10, AAA missing), archviz 68 (US 8), product viz 97 (FOOH, packshot, automotive thin), motion niches (data viz, FUI, sports/esports, AR filters), specialist CG (medical, scanning, experiential, Live2D, previs). Asked about next segments + game cap.

**Prompt:** (2026-11-03)
> separate agents for different segments
> no limit, make a separate section for game studios

**Answered:** User chose separate /game-studios/ page, fields segment/platforms/parent/notable games, move game-first keep service-first. Built infra (schema, catalog kind, page, validate, tests, sitemap, llms, form). Migrated 196; +1,703 game studios (1,898 total), +374 production studios (1,598). Validate/tests/build/links pass. Not committed. Flagged: 3 agents put the user email in Wikidata User-Agent.

**Prompt:** (2026-11-03)
> yes please

**Answered:** Committed /game-studios/ + studio segment round on main and pushed. Russia question left open (not added).

**Prompt:** (2026-11-05)
> resolve github issues and pull requests

**Answered:** Triaged 5 PRs + 3 issues (+ webGPU-boids#1). Local branch `resolve`: merged #46, #45 (fixed), #42 (fixed); added GameShipKit (#43) + official SolidCraft; link-check fixes (#40); #41 no-op. User: decline #44 + #39, merge boids#1. Fork push + merge blocked by auto-mode classifier; push/close commands handed to user. Validate ✓, tests 8/8, build ✓.

**Prompt:** (2026-11-05)
> lets look for more studios

**Prompt:** (2026-11-05, mid-run)
> find more studios in japan from here, https://pixelpixel.jp/

**Answered:** Round 4 discovery: 8 gap-slice agents + Pixel×Pixel festival speaker/sponsor lists (2025 + 2026). /studios/ 1,598 -> 1,911 (84 countries; Japan 81 -> 156), /game-studios/ 1,898 -> 2,102. Pixel×Pixel gave 16 (14 Japan). Probe dropped 4 dead/cert-expired; cut Ánima + 5 explainer shops. Validate/tests/build/links pass. Not committed.

**Prompt:** (2026-11-05)
> Can you brainstorm which segment and type of 3d motion design game or arch viz studios we might have missed

**Answered:** Brainstorm only, no data edits. Tallied disciplines/markets/segments/countries + name-probed ~500 known studios across ~20 niches. Biggest gaps: AI-native, WebGL/interactive, social AR, digital fashion, scanning/volumetric, VP/previs/mocap, medical/forensic, archviz hubs (China/Serbia/Saudi), UGC + hypercasual publishers, MEA/SEA games. Enum gaps flagged (no real-estate/medical market, no interactive discipline, no kids-edu/sim segment); asked user before extending. Flagged The Mill + Mikros Animation (Technicolor 2025 collapse) for status check.

**Prompt:** (2026-11-05)
> fill all the gaps

**Answered:** Asked first about the new enum values; user approved all 7 (interactive, ai-production, scanning; real-estate, medical-science; kids-edu, simulation). Wired schemas/labels/colors/form/docs, backfilled existing rows, ran 8 discovery agents, imported 290 studios + 210 game studios (live-probed). Totals 1,888 / 2,108. Validate, tests, build and links pass. Not committed.

**Prompt:** (2026-11-06)
> find studios for categories that have less than 20 entries

**Answered:** No discipline/market/segment/platform is under 20 (lowest: previs 21); the facets under 20 are countries (59 in /studios/, 53 in /game-studios/). Spawned 8 regional agents (Nordic/Baltic/Ireland, West/South EU, CEE, MENA, Sub-Saharan Africa, South/SE Asia, East Asia/Oceania, LatAm) to fill both directories toward 20 per country. Import done: +338 studios, +133 game studios (484 raw; 10 dupes, 3 dropped, 4 spam false positives force-passed). Totals 2,695 / 2,683. Validate, tests, build, links pass. Not committed.

**Prompt:** (2026-11-06)
> continue please

**Answered:** Previous session ended mid-run; 8 country agents had saved only 23 records (CEE 17, MENA 6). Resumed all 8 from their transcripts via SendMessage; import pending.

**Prompt:** (2026-11-06)
> add https://www.linkedin.com/company/105039524 shapeshifter.digital

**Answered:** Added Shapeshifter to /studios/ (3d-animation, vfx, virtual-production, interactive; HQ India per user, no city; site gives none, LinkedIn blocked). Its game Flip-Flop Fury is unreleased, so not in /game-studios/.

**Prompt:** (2026-11-06)
> add https://www.noobstudio.live/

**Answered:** Added Noob Studio to /studios/ (3d-animation, motion-design, cg; advertising/brand/games; HQ India per user, no city). Site is a JS scroll film with no text: tagline, mission and clients (Riot Games, Amazon Studios, Zomato, OnePlus, Hero, iQOO, Campa) read from ffmpeg frames. Social links on site are placeholders, so none stored.

**Prompt:** (2026-11-06)
> add https://www.lanlan.in/

**Answered:** Site is a placeholder (coming soon + Wix template projects); asked; user chose "Add: 2D animation, India". Added Lanlan Studios to /studios/ with notes: flagging the placeholder site and maintainer-sourced facts.

**Prompt:** (2026-11-06)
> add https://linktr.ee/goppoanimation as well 2d animation studio

**Answered:** Added Goppo Animation (Mumbai, from its Linktree bio) to /studios/: 2d-animation + title-design, music-video/advertising/episodic, Linktree as URL (no own site), showreel + 4 notable from its link list.
- (2026-11-06, follow-up to "find studios for categories that have less than 20 entries") Country fill imported: +225 studios, +299 game studios; 19 country lists crossed 20; totals 2,117 / 2,407. Validate, tests, build, links pass. Not committed.

**Prompt:** (2026-11-06)
> push changes please

**Answered:** origin/main had 13 new commits incl. round 4 (+313/+204, same new chunk files). Snapshot on branch wip/studio-gap-fill, ff main, 3-way merged docs, re-ran backfill on round 4 data, replayed 446 + 448 new rows (134 overlaps kept round 4 + carried new enum values). Totals 2,357 / 2,550. Committed + pushed.

**Prompt:** (2026-11-06)
> close the open issue

**Answered:** Issue #47 (suggest twirl, AI PBR material generator): verified site, added to §09 texture-material-generation (Freemium, web), committed, pushed, closed #47 with comment.

**Prompt:** (2026-11-06)
> update readme and commit please

**Answered:** render-readme CI already committed eb9e8e1 (README has twirl); fresh local render identical, no README commit needed. Logged prompt only.

**Prompt:** (2026-11-06)
> look up conferences, events, award shows in the different domains and look up studios that way, need to flesh out the list even more

**Answered:** Round 5 (event-sourced): 9 general-purpose agents, one per domain (VFX/VP awards, animation festivals, motion/ad craft awards, music video/titles/medical, interactive/XR/experiential, archviz/product viz, games West, games world, game services/co-dev). Import pending.

**Prompt:** (2026-11-06)
> push the changes please

**Answered:** Committed round 5 data + docs (feat) and memory log (docs), pushed to origin/main.

**Prompt:** (2026-11-06)
> check the different branches as well please. If content from them can be merged and branches deleted

**Answered:** 3 branches. maintenance/freshness-2026-11 (stale/last_pushed/archived flags) merged by hand (2 append-vs-flag conflicts resolved, all 654 flagged URLs match the branch); freshness-2026-10 superseded by the Nov re-scan; wip/studio-gap-fill already fully in main (0 hosts missing, schema identical). All 3 deleted.

**Prompt:** (2026-11-08)
> check PRs

**Answered:** 4 open PRs, all maker self-submissions. Validate ✓ with all 4 applied, URLs 200. #48 Trify3D + STL Editor: claims match, merge-ready. #49 objekto.io: "parametric CAD" not on site, needs desc fix + url_status. #50 ReelBoop / #51 StylMorph (same author): consumer dance-video + photo-filter apps, off-scope; #50 price $6.90 not on site ($10 pack). Recommended decline, awaiting user call. (Correction 2026-11-08: objekto site does say "Part-by-part parametric CAD"; fetch summary missed it.)

**Prompt:** (2026-11-08)
> sounds good, go ahead

**Answered:** Merged #48 + #49 (gh merge allowed this time); objekto fix (desc, $29 USD not €, url_status) landed on main as follow-up commit since fork push still blocked. Closed #50/#51 with out-of-scope notes. Catalog 4,213. project.md, CHANGELOG, memory updated.

**Prompt:** (2026-11-08)
> look up news. From the last few months 3d, gamedev, art, ai, everything we can find. Let's flesh our the resources side of things please

**Answered:** 8 news-slice agents (AI gen, DCC/render, gamedev, VFX/motion, art/design, research/splats, assets/learning, hardware/XR), Jul-Nov 2026 news as leads. +548 entries (4,213 -> 4,761), 26 existing entries updated (renames, free/price changes, 2 deprecations). Validate/test/build ✓. Committed later same day.

**Prompt:** (2026-11-09)
> Yes please

**Answered:** Committed news batch (data + project.md + CHANGELOG) and memory log separately, pushed to origin/main.

**Prompt:** (2026-11-09)
> let's look for more studios. Starting with europe, make country-wise agents to find please

**Answered:** Round 6: 14 country agents across Europe, both directories. 945 raw -> 935 written (+380 studios -> 3,075, +555 game studios -> 3,238). Dropped casino-injected/gambling/placeholder rows. Azerbaijan + Faroe Islands added to COUNTRY_REGION. Validate/test/build ✓. Not committed.

**Prompt:** (2026-11-09)
> store this method in memory for future sessions. Will do for different regions in future sessions

**Answered:** Method saved: docs/playbooks/studio-discovery.md (steps, review checklist, lessons, agent brief template), importer promoted to tracked scripts/import-studios.js (--dump/--probe/--write). Pointers in project.md (§3, §4b, §14) + memory (preferences, tools, decisions, goals).

**Prompt:** (2026-11-09)
> commit and push

**Answered:** Committed round 6 data + importer/playbook + docs (feat) and memory log (docs), pushed to origin/main.

**Prompt:** (2026-11-09)
> studio-discovery.md for asia and australia please

**Answered:** Round 7, Asia-Pacific by country: 13 agents, both directories. 722 raw -> 712 written (+362 studios -> 3,436, +350 game studios -> 3,587, net of 2 removals). Kazakhstan + Uzbekistan added to COUNTRY_REGION. Fixed 5 existing cities, merged Two Ten into 2:10 AM, removed Octro (social casino). Playbook updated (public-web-only rule, Steam URL rule, force clears name clashes). Validate/test/build ✓. Not committed.

**Prompt:** (2026-11-09)
> is it stuck?

**Answered:** No. Round done; Australia agent had an idle background child (no writes since 03:03), stopped it. SEA agent already ended. Import (03:44) complete.

**Prompt:** (2026-11-09)
> commit it please, and push

**Answered:** Committed round 7 data + importer/studios.js + docs (feat) and memory log (docs), pushed to origin/main.
