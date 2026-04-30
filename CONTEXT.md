# CONTEXT.md — Domain Vocabulary

Source-of-truth glossary for `3d_resources`. Code, ADRs, scripts, and PRs must use these nouns consistently.

---

## Nouns

- **Section** — top-level category. One per file in `data/NN-<slug>.yml`. Listed and ordered in `data/sections.yml`. Renders as an `H2` in `README.md` (e.g. `Assets & Libraries`).
- **Subsection** — a grouping inside a Section. Each Section has 1..N Subsections. Renders as an `H3`. Carries its own `slug`, `title`, `description`.
- **Entry** — a single resource: a tool, asset source, tutorial, channel, etc. Conforms to `schema/entry.schema.json`. Has `name`, `url`, `description`, `entry_type`, `tags`, optional `license`, `notes`, verification timestamps.
- **Chunk** — a file holding ≤50 Entries belonging to one Subsection. Path: `data/<section>/<sub-slug>/<NN>-<sub-slug>.yml`. Storage unit, not a render unit.
- **Pass** — a sweep over the catalog by an LLM subagent that mutates Entries. One subagent per Chunk. Cross-Chunk operations are *not* Passes — those are scan/audit scripts.
- **Catalog** — the path-addressed interface (`scripts/lib/catalog.js`) every script uses to read and write Chunks. No script touches `data/` directly.

## Tag groups

Controlled vocabularies live in `schema/vocab.yml` and are enforced by `schema/entry.schema.json`.

- `tags.workflow` — closed enum. Stage of production: `modeling`, `texturing`, `rigging`, `animation`, `lighting`, `rendering`, `compositing`, `editing`, etc.
- `tags.output` — closed enum. End medium: `games`, `film-vfx`, `archviz`, `motion-graphics`, `xr`, `generalist`, etc.
- `tags.platform` — closed enum. OS / runtime: `win`, `mac`, `linux`, `web`, `ios`, `ipad`, `android`, `cloud`.
- `tags.skill` — closed enum. Audience level: `beginner`, `intermediate`, `advanced`.
- `tags.tech` — open but curated. Tech traits: `pbr`, `cc0`, `node-based`, `procedural`, etc. New values allowed; add to vocab when stable.

## Entry attributes worth naming

- `entry_type` — closed enum: `software`, `asset-source`, `marketplace`, `tool`, `plugin`, `tutorial`, `channel`, `community`, `reference`, `inspiration`. Drives where and how an Entry renders.
- `dual_listed_in` — list of additional Subsection paths where this Entry should also surface. Cross-cutting resources (e.g. a tool useful in both modeling and texturing) live in their primary Chunk; the render layer mirrors them into others.
- `deprecated` — boolean. Entry kept for historical/SEO reasons but no longer recommended. Render layer may down-rank or hide.
- `quarantine` — Entry flagged by a quality/freshness scan as below threshold. Held out of `README.md` until reviewed. Set by `quarantine-low.js`; cleared by manual review or repair.
- `url_status`, `url_last_verified`, `pricing_last_verified` — verification timestamps written by link/pricing/repo scans.

## Data flow

```
data/sections.yml          ─┐
data/NN-<section>.yml      ─┤  Catalog (scripts/lib/catalog.js)
data/<section>/<sub>/*.yml ─┘
                              │
                              ▼
                          render.js  ──►  README.md
                                              │
                                              ▼
                                       build-html.js  ──►  _site/index.html
                                       export-data.js ──►  _site/data.json
```

- `data/` is the **source of truth**. `README.md` and `_site/` are derived. See ADR-0002.
- Entries are **stored** in Chunks in insertion order (append-friendly diffs).
- Entries are **rendered** alphabetically within each Subsection. Storage order ≠ render order.
- Subsection metadata (`slug`, `title`, `description`) lives only in the Section file. Chunks contain `{ entries: [...] }` and nothing else.

## Pass vs scan

- **Pass** — per-Chunk in-place edit by a subagent. Driver: `scripts/pass.js` + `scripts/passes/<task>.js`. Branch-per-pass, per-Chunk commit, draft PR. Examples: `verify-tags`.
- **Scan / audit** — cross-Chunk read or batch mutation that doesn't fit per-Chunk isolation. Examples: `dedupe-entries.js`, `audit-classification.js`, `freshness-digest.js`. Not Passes; not driven by `pass.js`.
