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
- 2026-10-05: Bash heredocs passed through the tool lose backslashes (regex `\/`, `\|`, ` ` get mangled). Write patch scripts with the Write tool instead.
