# Archived scripts

One-shot migrations and cleanup passes. Kept on disk as audit trail. **Do not re-run.** All ran against the pre-chunk `data/NN-section.yml` layout and would corrupt the current chunked tree.

Archived 2026-04-30 as part of plan.md Step 2.

| Script | When/why it ran |
|---|---|
| `add-candidates.js` | Auto-appended categorized candidates from `awesome-alive.json` into `data/*.yml`. Strict URL dedup. |
| `categorize-unclassified.js` | Second-pass categorizer over unclassified alive candidates using keyword + domain heuristics. |
| `cleanup-adds.js` | Post auto-add cleanup: removed garbage entries (`name="link"`, empty descriptions) and http/www variant duplicates. |
| `cleanup-medium.js` | Targeted fix for the 12 remaining medium-severity audit flags (moves + entry_type corrections). |
| `cleanup-pass.js` | Bulk URL replacements for known-moved entries, deprecated confirmed-dead unreachables, fixed entry_type mismatches, collapsed duplicate URLs. |
| `disambiguate.js` | Resolved name collisions: dropped true dupes, renamed distinct products, suffixed cross-format listings. |
| `fix-false-broken.js` | Parsed link-check report and cleared `deprecated` + restored `url_status: ok` on 403/429 false-positive bot-blocks. |
| `fix-truncated-md.js` | Stripped trailing truncated markdown from entry descriptions. |
| `process-residual.js` | Hand-curated placement for the 62 residual unclassified items left after `categorize-unclassified.js`. |
| `recategorize.js` | Reclassified unclassified alive candidates by source-file + keyword routing; rewrote `awesome-alive.json` for `add-candidates.js`. |
| `restore-entries.js` | Re-added entries lost in a prior cleanup pass. |
| `split-misc.js` | Split `10-tools-pipeline.yml :: misc-3d-utilities` by URL-based mapping into proper subsections. |
