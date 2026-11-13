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

## 2026-10-05 — Fixing contributor PRs ourselves
- Maintainer fixes PRs directly (maintainerCanModify true on all) instead of waiting on contributors: merge main in (no rebase/force-push), fix claims verified against the live site, add url_status/url_last_verified.
- Deploy surface: Cloudflare Pages serves `_site/` only, no repo .md files. Public repo means .md content is already public; the only concern is the legacy GitHub Pages mirror (duplicate content / indexed internal docs).

## 2026-10-05 — §03 mocap + rig subsections
- New subsections in animation-rigging: mocap-libraries, mocap-datasets, character-rigs-maya, character-rigs-other. Split rigs by Maya vs rest because Maya alone fills ~40.
- ai-motion-capture = AI tools only now; library/dataset entries moved out. Auto-rig systems (Rigify, BlenRig, CC Auto Setup) go to §10 rigging-animation-tools, not rig subsections (they're tools, not characters).
- Fan rigs of copyrighted IP skipped as individual entries.

## 2026-10-12 — PR #25 triage
- #25 CADProps GLB Viewer: site live, no login needed to view, claims (static GLB only, approximate dims, server upload, price 0) match page. Validate ✓. Affiliation disclosed. Merged 2026-10-12; renamed to "CADProps GLB Viewer" on main after merge.

## 2026-10-31 — PR #27-#38 + issue #26/#29 triage
- All 10 PRs + 2 issues are affiliated self-submissions; vendor affiliation alone is not a reject (same as #25).
- Reject vendor blog/SEO posts as "tutorials" (#28 imgmov: generic AI-video prompt list ending in a credits pitch, filed under cinematography fundamentals).
- Strip tracking params from URLs (#34 `?ref=3dres`).
- Freemium when a free tool upsells paid human work on the same site (#35 PrintWhat custom design from $29).
- User: "push, merge and close issues". Fixes pushed to fork branches (#30/#31/#32/#34/#35), 9 merged, #28 closed with note. #26 Nebula Forge -> §02 blender-plugins-addons (§04 has learning subsections only); #29 RespawnStack -> §09 ai-assisted-cg-tools.
- Don't claim features a vendor page doesn't state (#32 quad retopo = just Blender remesh via Python; MCP tag unverified).

## 2026-10-31 — /studios/ directory (spec, not built)
- Separate dataset, not a 13th catalog section: studios aren't resources, are multi-discipline, need location/careers/size fields. Own schema + own closed `disciplines` enum, so catalog vocab (entry_type, tags.output) stays untouched. Kept out of README.md.
- One filterable page /studios/ (user chose this over hub + per-discipline/country pages). Text cards, no logos (hosting/trademark/rot).
- Seed: all 500 School of Motion "500 Studios" Vol. 1 + other disciplines (VFX, feature animation, games, archviz, product viz, VP, XR, outsourcing). Long-term goal: every studio in the world.
- SoM PDF is email-gated, copyrighted: lives only in gitignored disregard/. Extract facts only (name, domain, location, named projects/clients); write every description fresh.
- Built same day (user: "go for all phases"). SoM location lines are unreliable (scrambled between studios): HQ kept only when the studio's own site text names the city, else agent-verified; low-confidence -> country only; unresolved -> dropped.
- Inclusion: active only (closed, parked, expired, password-walled, portfolio-not-studio dropped). Bot-block 403 / TLS-chain failures are alive (note added), not dead.
- Social links kept only if handle matches studio name/domain (or opaque id); drops template (squarespace, yourhandle), personal and client accounts.
- Description cities must match hq/offices; office cities added only when the studio's own site names them.
- JSON-LD on /studios/ kept minimal (name, url, country); full objects doubled page size.

## 2026-10-31: /studios/ v2
- Sizes = LinkedIn "Company size" bands (user): boutique 1-10, small 11-50, mid 51-200, large 201+. Old boutique/mid dropped (don't map), old large kept.
- `animation` -> `2d-animation` + `3d-animation` (user). New closed `markets` field (film, episodic, advertising, music-video, games, brand), card label "Works for" (user).
- Cards drop the description (user: adds size, not info). Description stays required in data: feeds search + llms-full.
- Lazy load: first 48 cards SSR (crawl/no-JS), studios.json carries every card as pre-rendered HTML so there is one card template and escaping stays server-side. Bigger JSON (257 KB gz) accepted over a duplicated client template.
- Group by is a view, not a filter: Clear filters keeps it. Groups by HQ only, so each studio shows once. Age groups = founding decade, oldest first.
- Discipline colors by hue family (film blue, animation warm, games green, interactive teal, CG violet, motion pink, live action red); label always present so near hues are fine.
- Name dedupe for new studios only within the same HQ country ("Mir" Norway != "Studio Mir" Korea).
- Studio sites with injected casino/spam or "coming soon" pages are not listed.
- Group-owned studios with their own brand + site are listed separately (d3t, Climax under Keywords; Mikros under Rodeo FX).

## 2026-11-03: Discovery batch (vibe-coded tools, assets, studios)
- Tech vocab +`mcp` (MCP servers/bridges, 16+ uses), +`glb`, +`webgpu`. Tech is open-curated, not a closed enum, so added without asking.
- MCP servers file under the host app's plugin subsection when one exists (Blender, Houdini, C4D, Max, Godot, Unity, Unreal); otherwise §09 ai-assisted-cg-tools.
- CorridorKey (v1 + 2.0) license = Free, not Open Source: custom licence on CC BY-NC-SA, commercial footage OK, reselling not. Paid host plugin (corridorkey.com) is its own entry.
- Import dedupe rule: name + canonical URL always; same host only blocks when the new URL is a site root (distinct products on one vendor domain are kept, e.g. sparkjs.dev/radix next to Spark).
- Disney Animation Data Sets -> Mixed (hub page states no licence; per-set terms).
- Tanzania added to COUNTRY_REGION (middle-east-africa) for Ubongo.
- Game developers are in scope for /studios/ (`games` discipline), incl. mobile (Supercell, Rovio, Dream Games).

## 2026-11-03: Game studios directory
- Separate /game-studios/ page + data/game-studios/ + schema/game-studio.schema.json (user). Fields: segments (aaa, aa, indie, mobile, co-dev, vr, ugc; required, 1-3), platforms (pc, console, mobile, vr, web), parent, notable = shipped games (user picked all four).
- Split (user): game-first -> /game-studios/; art/animation/cinematics-for-games service studios stay in /studios/ (Virtuos, Room 8, Steamroller, Tiltnek). `games` discipline removed from the studio enum. A URL lives in one directory only.
- No cap on game studios (user). Inclusion bar: 1+ released commercial game or 10+ staff; exclude gambling/casino/pachinko/social-casino, crypto, adult-only VN brands, pure publishers.
- Russia-HQ studios not added (Russia not in COUNTRY_REGION; ask user). Studios with own-site HQ in Cyprus kept there (Owlcat, Mundfish).
- Parent = owner's common name; merge spelling variants of the same entity, keep real hierarchy labels (Activision vs Xbox Game Studios).
- Countries added: Ethiopia, Dominican Republic (lookup table, not taxonomy).

## 2026-11-05: PR #39-#46 + issue #40/#41/#43 triage
- Decline affiliate-funded meta-directories of mostly non-3D tools (#44 QuickMatch: disclosed affiliate links, paid placements). User call.
- Unofficial fan/guide sites for an app: decline, list the official app instead (#39 solidcraftcad.com -> SolidCraft solidcraft.io). User call.
- Read-only archived communities are deprecated, not kept (Blender.Community). Dead blog post with the same author's video live: repoint to the video.
- Auto-mode classifier blocks fork pushes and PR merges from the session; stage on a local branch and hand the user push/merge commands.

## 2026-11-05: Gap-fill enums
- User approved 7 new closed values: studio disciplines `interactive`, `ai-production`, `scanning`; markets `real-estate`, `medical-science`; game segments `kids-edu`, `simulation`.
- `xr` label "XR / interactive" -> "XR (AR / VR)" now that `interactive` exists. Web-only studios lost `xr` (Resn, Dogstudio, Immersive Garden, 14islands, Merci-Michel, We Ride at Dawn); others with real AR/VR keep both.
- Backfill: all 252 archviz rows get `real-estate`; 36 medical/science/forensic; 62 interactive; 7 ai-production (gen-AI-first only, not "AI-assisted"); 19 scanning; 12 kids-edu; 67 simulation (sim specialists, not arcade racers or idle tycoons).
- Backfill edits keep existing key order (a schema-order rewrite caused 770 lines of churn); new `markets` key goes after `disciplines`.
- 2026-11-06: Maintainer can override the no-"coming soon" rule per studio (Lanlan Studios: placeholder site, listed on user call). Such rows carry a `notes:` line naming the exception and the user-sourced fields.
- 2026-11-06: "Categories under 20" read as countries (no discipline/market/segment/platform was under 20). Target = 20 per country per directory where that many real, active studios exist.
- 2026-11-06: Panic Studio HQ London -> Latvia (own legal page names SIA "Panic"); London refs on its site are clients (W+K London).
- 2026-11-06: Parallel sessions append to the same studio chunk files. Merge rule: take origin data, re-run name/rule backfills, replay this session's rows (new = URL not in the shared base commit), dedupe by host + name/country, origin row wins on overlap but gains new enum values. Check `git fetch` before long data runs.

## 2026-11-06: Round 5, event-sourced discovery
- Festival/award/conference credits are leads only; HQ still verified on the studio site, LinkedIn or press. Student awards are not leads.
- Agents tag rows with `_event` (provenance) in scratch output only; importer drops it, not stored in data.
- Rows with no evidence of work in ~2 years dropped even when an event lists them (Cartel Cartoon, Dawn Digital). A recent award win counts as activity (Form&Fun, 2025 Auggie).
- Casino in a client-work title (Frost FX "Olympic Casino" ad) or a street name is not spam; injected outbound casino links are (Peekaboo Animation, rejected three rounds now).
- 2026-11-06: Freshness branches whose PR could not be opened get merged by hand: latest month only (each run re-scans every repo, so it supersedes older ones), then old branches are deleted. Conflicts are usually "main appended entries after the chunk's last entry" vs "branch added flags to that entry": branch lines first, then main's appended block.

## 2026-11-08: PR #48-#51 triage
- Consumer social/photo-filter AI apps are out of scope even when AI-generative (#50 ReelBoop dance/outfit video templates, #51 StylMorph photo-to-comic). Catalog = pro 3D/VFX/motion/game-art tools. User approved.
- Fork push still blocked by auto-mode classifier, but `gh pr merge` and `gh pr close` worked. Pattern: merge PR as submitted, land maintainer fix as follow-up commit on main.
- Verify vendor claims with raw HTML grep when a WebFetch summary says a claim is missing (summary missed objekto's "parametric CAD").


## 2026-11-09: News-driven discovery
- News is a lead source only; entries are the resources (tools, models, libraries, hardware), never articles. Funding/roadmap/rumour/waitlist items skipped.
- Open-weights models under custom community licences (MiniMax H3, LTX-2.x, FLUX, Stability, Tencent) -> license `Free`, limit stated in `pricing`. Research-only / CC BY-NC weights -> `Free NC`. LTX-2 moved Open Source -> Free on that rule.
- Model version bumps on an existing entry = rename in place (FLUX.2 -> FLUX 3, Meshy v4 -> Meshy 7), not a new entry. Separate open-weights release of a paid web app = new entry (Hi3D v1.0).
- `Mixed` licence kept for aggregates (marketplaces, datasets, code+weights split); BSL source-available backends -> Freemium (SpacetimeDB).
- Weakly sourced deprecations (redirect only, no closure notice) are not applied; left to the monthly link check (Quixel Bridge).

## 2026-11-09: Studio round 6, Europe by country
- Studios whose work-for-hire lists casino/lottery/eInstant as a main line are excluded like gambling studios (Moido Games: Veikkaus lottery games; Aniway: Casino + eInstant). One casino-themed game title or a casino ad client is fine (ColdFire Idle Casino Manager, Tamasenco Casino Heist, Frameworks Novibet ad).
- Anti-AI-scraping copyright text on a studio site is not spam (eXiin); hidden off-screen casino links are (KOTOC, Actrio, Insomne).
- Site that only works over http: store the http URL (Luma Film, Blackstaff Games); schema allows it.
- Location rows of a listed studio are not new rows (Hangar 13 Brighton); the parent row's `offices` carries the city.
- Azerbaijan + Faroe Islands added to COUNTRY_REGION as europe (with Armenia/Georgia).
- 2026-11-09: Studio discovery method saved as docs/playbooks/studio-discovery.md + tracked scripts/import-studios.js (user: store the method, run other regions in future sessions). Scratchpad copies were lost per session before.

## 2026-11-09: Studio round 7, Asia-Pacific by country
- Central Asia (Kazakhstan, Uzbekistan) maps to `asia-pacific` in COUNTRY_REGION (lookup table). Macau was added then removed (its only lead, 4DMacau, 404s); add it back when a row needs it.
- Studio `url` with no own site: Steam `/developer/<name>` page or own itch.io subdomain OK (Saibot precedent); Steam `/search/?developer=` URLs, Linktree, Behance, Instagram not (user-added exceptions keep a note).
- Social-casino card-game studios fall under the gambling rule even when the row predates it: Octro (Teen Patti, rummy, poker) removed. Casino-themed titles among many casual games are fine (SAT-BOX).
- Same studio under two hosts (2-10.cn + en.2-10.cn): merge into the older row, union disciplines/markets.
- `scripts/import-studios.js`: force.txt now also clears `dupe name+country` (distinct companies with normalised-equal names); host dupes still block.
- Research agents: public web only. No connected user services (Tracxn etc.), no extracting API keys/tokens from page bundles. Added to the playbook brief.

## 2026-11-09: Studio round 8, South America + Africa by country
- Studio `url` that is only a YouTube channel or Facebook page: drop (same as Linktree/Instagram/Behance). Own game site is fine (Malaika Games, Kola Studios).
- A site with an NFT/Web3 section counts under the crypto rule (Chroma Pixel Games). Early access = released; Steam "Coming soon" + ~10 unverified staff = below bar (Ivalice).
- Paraguay -> americas; Benin, Madagascar, Rwanda, Togo -> middle-east-africa (COUNTRY_REGION lookup).
- Region scope "South America + Africa" left out Central America, Caribbean and the Middle East (Gulf, Levant, Israel, Iran): next rounds.

## 2026-11-10: PR #52-#55 + issue #54 triage
- Multi-model AI studios (aggregators of image/video/3D models) are in scope like Higgsfield Canvas / Freepik Spaces (#52 Imagera, #53 Quady3D). Consumer filter/template apps stay out (#50/#51 rule).
- Free trial without a free tier = Paid, not Freemium (#53 Quady3D, 7-day trial).
- PolyForm Shield source-available = Free (#55), same as custom open-weights licences.

## 2026-11-09: Studio round 9, North America + Europe second pass
- "North America" read as US + Canada + Mexico + Central America + Caribbean. "Europe once more" = second pass per cluster, aimed at sources and gaps round 6 missed.
- El Salvador, Honduras, Jamaica, Trinidad and Tobago -> americas; Albania -> europe (COUNTRY_REGION lookup).
- Fixed shifted url/careers in 15 game-studio rows (2026-11-02 import, Storm8..Magic Tavern). Orphan URLs (Brass Lion, Hidden Variable) not turned into rows: unverified.
- Unreachable-by-script but well-documented studio may be added with a `notes:` line saying why (WayForward: TLS refuses curl/Node, HQ from Wikipedia). Placeholder/unreachable without other sources still dropped (Deck Nine).
- Studio offering online-casino design as a service line falls under the gambling rule (PUNCHev); a single casino client or casino-themed game title does not.
- Same studio, two hosts, two countries (Soda Den): keep the own-site row, merge notable, drop the game-site row.
- US city format: plain city everywhere. Stripped state suffixes from 249 values (user: "fix and then push"). Portland OR/ME etc. now read the same; accepted.

## 2026-11-14: PR #56-#57 triage
- Decline brand-new, unproven paid micro-tools (#56 Border Kit for Tiled: $4 6 kB AI-written script, published 1 day before PR, AI-agent submitter, free extruders exist). Resubmit once it has users. User call.
- Contributor edits to project.md are not accepted; PRs touch data/ only.
- #57 EXR Converter merged as submitted (MIT, cross-platform releases, claims verified); url_status/url_last_verified added in follow-up commit on main. `gh pr merge`/`gh pr close` worked from session again.
