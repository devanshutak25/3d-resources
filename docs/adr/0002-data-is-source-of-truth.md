# ADR-0002 — `data/` is source of truth; `README.md` and `_site/` are derived

**Status:** accepted
**Date:** 2026-04-30

## Context

`build.sh` already comments this rule: "Hybrid (c): data/ is source of truth; README.md is derived." The intent has nevertheless been violated repeatedly by one-shot cleanup scripts that mutated `README.md` directly or treated it as authoritative. Those violations forced after-the-fact reconciliation passes (see `scripts/cleanup-*.js`, `restore-entries.js`). Promote the rule from a comment to an ADR so future contributors and Pass subagents can't quietly break it.

## Decision

`data/` (Section files + Chunk files, governed by ADR-0001) is the only writable source of catalog content. Everything else is generated:

- `README.md` is generated from `data/` by `scripts/render.js`.
- `_site/index.html` is generated from `README.md` by `scripts/build-html.js`.
- `_site/data.json` is generated from `data/` by `scripts/export-data.js`.

Rules:

- **Never** edit `README.md` by hand or by script. Any change starts in `data/` and re-runs `build.sh`.
- **Never** parse `README.md` to recover catalog state. The catalog lives in `data/`; if a script needs Entries, it goes through `scripts/lib/catalog.js`.
- `_site/` is fully disposable. `build.sh` regenerates it. Do not commit hand edits.
- Ingest pipelines (`ingest-*.js`, `mine-awesome.js`, etc.) write to `data/` via the Catalog interface, never to `README.md`.

## Consequences

- A failing render or build is always a `data/` or script bug, never a `README.md` content bug.
- Cleanup migrations of the kind archived under `scripts/_archive/` should not recur. Future fixes target `data/`.
- Pass subagents are explicitly forbidden from touching `README.md` or `_site/`. Their write surface is Chunk files only.
- CI may verify the rule by re-running `build.sh` and asserting `README.md` is byte-stable.

## Related

- ADR-0001 — `data/` directory layout is public interface.
- `build.sh` — the canonical build pipeline.
- `CONTEXT.md` — data flow diagram.
