# Tools

CLIs / utilities in active use on this machine for this project.

- `rtk` — Rust Token Killer proxy (auto-rewrites commands; `rtk gain` for analytics).
- `node` — build + validate scripts.
- `git` / `gh` — VCS + GitHub ops.
- PowerShell 7 — primary shell.

(add as introduced)
- 2026-09-16: headless Chrome (`chrome.exe --headless=new --dump-dom --virtual-time-budget=15000`) + a scratchpad static server for post-build DOM checks of the hydrated catalog page. No puppeteer in repo.
- 2026-10-05: `gh` installed at `C:\Program Files\GitHub CLI\gh.exe` (v2.102.0, authed as devanshutak25) but NOT on PATH; call by full path.
- 2026-10-05: `npm ci` / `npm test` (scripts/run-tests.js) / `npm run build`; `node scripts/check-built-links.js _site` post-build link check; `check-links.js --only-missing | --status=unreachable`.
- 2026-10-31: `pdftotext -layout -enc UTF-8` (ucrt64) for PDF text; output has \f and CRLF, strip before parsing. Headless Chrome `--window-size` floors at ~504 px wide, so phone-width screenshots clip (not a page bug). Node fetch fails some TLS chains (missing intermediate) that curl/browsers accept.
- 2026-10-05: Bash heredocs passed through the tool lose backslashes (regex `\/`, `\|`, ` ` get mangled). Write patch scripts with the Write tool instead.
- 2026-10-31: Dev server: `node <scratchpad>/serve.js G:/Personal/3d_resources/_site 8080` (no-store, clean URLs). Stop it (and cd out of _site) before `bash build.sh`: Windows can't `rm -rf _site` while a process cwd/handle sits inside it ("Device or resource busy"). Headless Chrome needs `--virtual-time-budget=15000` for the MDI icon font to show in screenshots.
- 2026-11-03: Discovery sources that work without WebSearch: hn.algolia.com Show HN API, api.github.com search, itch.io tag pages, BlenderArtists Discourse API. Blocked: reddit search.json, fab.com, aescripts.com, shadertoy (403). Scratchpad import.js (catalog|studios, dry-run unless --apply) does dedupe + enum/style checks before catalog.appendEntry/appendStudio.
- 2026-11-03: Wikidata SPARQL rate-limits hard (~1 req/min after bursts); QLever mirror (qlever.cs.uni-freiburg.de/api/wikidata) works for bulk. Scratchpad probe.js: node probe.js <file.json> [conc] -> status/final/title/SUSPECT per URL. Local router DNS refuses query bursts; agents may lose DNS mid-run.
- 2026-11-09: Catalog importer rebuilt in scratchpad news/import.js (out-*.json -> dedupe canonical URL/name/site-root host + cross-file, schema/vocab/banned words, Node-fetch probe with cache, force.txt/drop.txt, appendEntry). apply-updates.js applies curated `set` maps by existing URL. Node fetch gets 400 from developers.meta.com and 406 from some bot walls where curl gets 200: recheck with curl before rejecting.
- 2026-11-09: `node scripts/import-studios.js <dir> --dump|--probe|--write` (tracked; was scratchpad import.js): dumps existing.tsv + countries.txt for agents, imports out-*.json with dedupe/schema/style/live probe, drop.txt/force.txt overrides. Method in docs/playbooks/studio-discovery.md.
- 2026-11-09: import-studios.js force.txt now overrides name+country dupes too (host dupes still block). Tracxn MCP is connected in this environment: research agents can see it, so briefs must say public web only.
- 2026-11-14: headless Edge (`msedge.exe --headless=new --virtual-time-budget=10000 --dump-dom <url>`) reads JS-rendered prices (3D AI Studio digit counters: translateY px / digit height). WebFetch + curl saw only SSR placeholders.
