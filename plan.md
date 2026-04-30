# Architecture Plan: Chunked Catalog + LLM Passes

Status: drafted 2026-04-30. Ordered by execution sequence.

## Locked decisions

- **Layout:** `data/<section>.yml` holds section + subsection metadata. Entries live in `data/<section>/<sub>/<NN>-<sub>.yml`, ≤50 entries per chunk.
- **Chunk naming:** cap-driven, insertion order. `01-engines.yml`, `02-engines.yml`, ... Append to last non-full chunk; new file when full. No rebalancing on add.
- **Render order ≠ storage order:** chunks are insertion-ordered for append-friendly diffs. README/HTML render alphabetical-within-subsection.
- **Catalog interface:** path-addressed. `loadChunk(id)`, `saveChunk(chunk)`, `iterChunks()`, `iterEntries()`, `appendEntry(section, sub, entry)`.
- **Subsection metadata hoisted** to section file, not duplicated in chunks.
- **Passes:** one subagent per chunk for in-place edits. Cross-chunk ops (dedupe, audit) are separate non-pass tools.
- **Pass writes:** branch-per-pass, per-chunk commits, draft PR. Never direct to main.
- **ADR-0001:** `data/` directory layout is part of the public interface.

---

## Step 1 — CONTEXT.md + ADR-0001 ✅ done 2026-04-30

Cheap. Anchors vocabulary before code moves.

Shipped: `CONTEXT.md`, `docs/adr/0001-data-layout-is-public-interface.md`, `docs/adr/0002-data-is-source-of-truth.md`.

- Write `CONTEXT.md`: nouns (Section, Subsection, Entry, Chunk, Pass), tag groups (workflow, output, platform, skill, tech), `entry_type`, `dual_listed_in`, `deprecated`, `quarantine`. Data flow: `data/` → `render.js` → `README.md` → `build-html.js` → `_site/`.
- Create `docs/adr/0001-data-layout-is-public-interface.md`. Records: chunk-addressed, layout shape, why YAML-on-disk over DB.
- ADR-0002: `data/` is source of truth, README.md is derived. (Already in `build.sh` comment; promote to ADR since cleanup scripts violated it historically.)

Deliverable: 3 markdown files. No code changes.

---

## Step 2 — Archive cleanup-graveyard ✅ done 2026-04-30

Kill ~1.8K LOC of dead one-shot migrations before touching layout.

Shipped: 12 scripts moved to `scripts/_archive/` with `README.md` index (one-line note per script). `.gitignore` cleaned of per-script entries. None were referenced by `build.sh`, `package.json`, or `.github/workflows/`.

- `cleanup-adds.js`, `cleanup-medium.js`, `cleanup-pass.js`
- `fix-false-broken.js`, `fix-truncated-md.js`
- `restore-entries.js`, `process-residual.js`
- `categorize-unclassified.js`, `recategorize.js`
- `split-misc.js`, `disambiguate.js`, `add-candidates.js`

Deliverable: `scripts/` shrinks to live tools only.

---

## Step 3 — Migrate to chunked layout ✅ done 2026-04-30

One-shot disruptive PR. Atomic, reversible.

Shipped: 2940 entries across 12 sections split into 158 chunk files (cap 50/chunk) under `data/NN-section/<sub>/NN-<sub>.yml`. Section files rewritten as metadata-only with `chunks` count per subsection. `render.js` reads chunks + alpha-sorts within subsection (one-time order shift folded in). `validate.js` patched minimally to read chunks (full Catalog rewire is Step 4). Verification: alpha-sorted render against pre-migration tree byte-equal to render against post-migration tree (empty diff). `migrate-to-chunks.js` archived.

Write `scripts/migrate-to-chunks.js` (then archive after run):

1. Read each `data/NN-section.yml`.
2. For each subsection: split entries into ≤50-entry chunks in current order. Write `data/NN-section/<sub-slug>/01-<sub-slug>.yml`, `02-...`, etc. Each chunk file is `{ entries: [...] }` only.
3. Rewrite section file to `{ slug, title, description, subsections: [{slug, title, description, chunks: 3}, ...] }` — no entries.
4. Leave `data/sections.yml` untouched (still points to section files).

Verification gate before commit:
- Run current `render.js` against pre-migration tree, save README.
- Run new render against post-migration tree.
- Diff must be empty (modulo alphabetical sort if folded into same step — preferred to do in this PR so order shift is a one-time event).
- Run `validate.js` against new tree, must pass.

Deliverable: every entry now lives in a ≤50-entry file. README byte-stable.

---

## Step 4 — Catalog module + rewire active scripts ✅ done 2026-04-30

Built the seam, migrated every active consumer.

Shipped: `scripts/lib/catalog.js` (full surface: `loadSections`, `loadSection`, `listChunks`, `loadChunk`, `saveChunk`, `iterChunks`, `iterEntries`, `appendEntry`, `CHUNK_CAP=50`, atomic tmp+rename writes). Smoke test in `scripts/lib/catalog.test.js`. Every script in `scripts/` now reads/writes via Catalog; zero direct `data/*.yml` access remains outside archive.

Rewired: `render.js`, `validate.js`, `export-data.js`, `build-html.js`, `audit-classification.js`, `check-pricing-freshness.js`, `check-links.js`, `dedupe-entries.js`, `quality-scan.js`, `quarantine-low.js`, `check-repo-staleness.js`, `dedupe-youtube.js`, `auto-tag.js`, `recheck-unreachable.js`, `mine-awesome.js`, `export-csv.js`, `lib/ingest-core.js`, `ingest-gumroad.js`, `ingest-youtube.js`. Render output byte-stable vs pre-rewire baseline. Scripts with no `data/` access (`triage-candidates.js`, `freshness-digest.js`, `watch-releases.js`, `ingest-80lvl.js`, `ingest-itch.js`) untouched.

`scripts/lib/catalog.js`:

```js
catalog.listChunks()                    // ['07-game-dev/engines/01-engines', ...]
catalog.loadChunk(id)                   // {section, sub, chunkIndex, entries, _path}
catalog.saveChunk(chunk)                // atomic, preserves YAML formatting
catalog.iterChunks()                    // generator
catalog.iterEntries()                   // generator yielding {section, sub, chunk, entry}
catalog.loadSection(slug)               // section metadata only
catalog.appendEntry(section, sub, entry) // handles cap + new-chunk creation
```

Migration order (one PR each, with tests):

1. `render.js` — exercises `iterEntries` + alphabetical render sort. Highest leverage. ✅ done 2026-04-30
2. `validate.js` — schema/vocab/duplicates over `iterEntries`. ✅ done 2026-04-30
3. `export-data.js` — JSON export for site filter UI. ✅ done 2026-04-30
4. `dedupe-entries.js` — cross-chunk read, mutating writes via `saveChunk`. ✅ done 2026-04-30
5. `audit-classification.js`, `auto-tag.js`, `quality-scan.js`, `quarantine-low.js`, `check-links.js`, `check-pricing-freshness.js`, `check-repo-staleness.js`, `recheck-unreachable.js`, `dedupe-youtube.js`, `mine-awesome.js`, `export-csv.js`, `build-html.js`, `lib/ingest-core.js`, `ingest-gumroad.js`, `ingest-youtube.js` — ✅ done 2026-04-30. (`triage-candidates.js`, `freshness-digest.js`, `watch-releases.js`, `ingest-80lvl.js`, `ingest-itch.js` had no data/ access — untouched.)

Each script PR: replace ad-hoc YAML walks with Catalog calls; add fixture-based test for the script's core behavior (the Catalog interface is the test surface).

Deliverable: zero scripts read `data/` directly. All go through Catalog.

---

## Step 5 — canonicalUrl consolidation

`scripts/lib/canonical-url.js`. Single function, table-driven tests.

Rules to lock (codify in tests):
- force `https:`
- strip `www.` prefix
- drop hash
- drop tracking params: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `ref`, `source`, `fbclid`, `gclid`
- lowercase host, preserve path case (some hosts are case-sensitive — verify)
- trim trailing slash unless path is `/`

Replace inline copies in `lib/ingest-core.js`, `validate.js`, `dedupe-entries.js`, `dedupe-youtube.js`, `check-links.js`, anywhere else grep finds them.

Deliverable: one function, one test file, N call sites.

---

## Step 6 — Pass driver + first pass

The new capability the chunking enabled.

`scripts/pass.js`:

```
node scripts/pass.js --task=<name> [--chunk=<id>] [--dry-run] [--branch=<name>]
```

Behavior:
1. Create branch `pass/<task>-<date>` (unless `--branch`).
2. Load pass module from `scripts/passes/<task>.js` — exports `{ describe, runOnChunk(chunk, ctx) }`.
3. For each chunk (or just `--chunk` if specified):
   - `ctx` = `{ section, subsection, sectionDescription, subDescription }` injected from section file.
   - Spawn subagent with chunk + ctx.
   - Subagent returns mutated chunk or no-op.
   - If mutated: `saveChunk`, commit per chunk with message `pass/<task>: <section>/<sub>/<NN> — <summary>`.
4. Write `_maintenance/passes/<task>-<date>.json`: `{ chunksProcessed, chunksChanged, entriesChanged, errors }`.
5. Push, open draft PR.

State file makes pass resumable: `--resume` skips chunks already in the state file.

First real pass to ship: `scripts/passes/verify-tags.js` — re-validate workflow/output/platform/skill tags against vocab + entry semantics. Proves the loop end to end.

Deliverable: pass-driven editing is a routine workflow, not a one-off script.

---

## Step 7 — qualityScore consolidation

`scripts/lib/quality-score.js`:

```js
qualityScore(entry) // → { score: number, factors: { url_status, description, tags, license, ... } }
```

Replaces overlapping logic in `dedupe-entries.js::score`, `quality-scan.js`, `quarantine-low.js`, `triage-candidates.js`. Each caller chooses its own threshold; no caller redefines factors.

Factors to fold in (lock in tests):
- `url_status === 'ok'` weight
- description length curve
- tag count (workflow + output + platform + skill + tech)
- license presence
- path depth penalty (root canonical preferred)
- query-string penalty

Deliverable: one ranker. Tweak in one place, every consumer benefits.

---

## Out of scope (deferred)

- SQLite or other index over `data/`. ADR-0001 says layout is the interface; migrating off YAML is a future ADR.
- Cross-chunk pass primitives. Per-chunk passes ship first; cross-chunk gets its own design pass when a real use case appears that doesn't fit the existing scan scripts.
- Automated rebalance to even out chunk sizes after deletes. Manual only — likely never needed.

---

## Risks

- **Migration PR is large.** Mitigation: byte-stable README diff before commit. Easy to revert if render diverges.
- **Subagent passes will sometimes be wrong.** Mitigation: branch-per-pass + draft PR review. `main` never directly touched by automation.
- **Insertion-order chunks become uneven over time.** Acceptable. Render-time sort means README order is unaffected.
