# ADR-0001 — `data/` directory layout is the public interface

**Status:** accepted
**Date:** 2026-04-30

## Context

The catalog is shifting from one big YAML per Section to per-Subsection Chunks of ≤50 Entries each. Multiple consumers read this tree: `render.js`, `validate.js`, `export-data.js`, dedupe/audit/quality scripts, ingest pipelines, and Pass subagents. Contributors also hand-edit YAML directly. We need to decide whether the on-disk shape is an implementation detail (free to refactor any time) or a contract (stable, documented, versioned).

## Decision

The `data/` directory layout — file paths, file shapes, chunk naming convention — is a **public interface**. It is documented, stable, and changes only through ADR.

Locked layout:

```
data/
  sections.yml                                # ordered list of Sections, points at section files
  NN-<section-slug>.yml                       # Section metadata + Subsection metadata. NO entries.
  <section-slug>/
    <sub-slug>/
      01-<sub-slug>.yml                       # { entries: [...] }, ≤50 entries
      02-<sub-slug>.yml
      ...
```

- Chunk filenames are insertion-ordered (`01-`, `02-`, ...). Append to the last non-full Chunk; create a new file when full. No automatic rebalancing.
- Section files hold `{ slug, title, description, subsections: [{slug, title, description, chunks: N}, ...] }` only — no entries.
- Chunk files hold `{ entries: [...] }` only — no Section or Subsection metadata.
- All access goes through `scripts/lib/catalog.js`. No script reads `data/` paths directly.

## Why YAML on disk, not a database

- **Diff-friendly.** Per-Chunk files keep PR diffs scoped. SQLite or a single big file would force whole-store rewrites on every edit.
- **Hand-editable.** Contributors can add or fix Entries with a text editor. No tooling required to read the catalog.
- **Append-friendly.** Insertion-order Chunks mean adding an Entry touches one file, usually only the tail of it.
- **Greppable.** Search, audit, and ad-hoc queries work with standard tools.
- **Reversible.** A bad migration is `git revert`. A bad DB migration is a restore-from-backup.

A future ADR may revisit this when the catalog outgrows YAML — likely a derived index (SQLite, JSON) layered on top, with YAML still source of truth.

## Why ≤50 entries per chunk

- Fits comfortably in a subagent's working context for in-place Pass edits.
- Keeps file size human-scannable.
- Small enough that per-Chunk commits stay readable in `git log`.
- Large enough that most Subsections fit in 1–2 Chunks today, avoiding directory bloat.

## Consequences

- Migrations to the layout require an ADR amendment.
- Scripts that bypass `scripts/lib/catalog.js` are bugs.
- Render order and storage order are decoupled. README is alphabetical-within-Subsection regardless of Chunk order.
- Cross-Chunk operations (dedupe, full-catalog audits) are *not* Passes. They live as standalone scan scripts.

## Related

- ADR-0002 — `data/` is source of truth, `README.md` is derived.
- `CONTEXT.md` — domain vocabulary.
