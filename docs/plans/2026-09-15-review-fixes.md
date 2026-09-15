# Repository review fixes

Goal: fix the eight findings accepted by the user on 2026-09-15.

Approach: preserve existing rendering and editorial deprecation; repair the data passed between build steps. Match filter metadata to each row's displayed section. Store stable addition timestamps so feeds work from shallow checkouts without guessing chronology. Use the existing shared heading helper for graph navigation.

1. Add regression tests for export/search visibility, category decoration, graph anchors, link classification and feed ordering. Run against the current code to confirm failures.
2. Reduce HDRI Hub's tags to two. Export descriptions and section anchors, excluding deprecated entries.
3. Match browser row metadata to its containing section. Use shared graph anchor generation.
4. Classify transient HTTP failures as unreachable, detect followed redirects, and keep editorial deprecation independent from link scans.
5. Add required `added_at` timestamps, backfilled from first recorded URL appearances in Git history. Stamp new entries through the catalog append API. Sort feed entries globally and emit stable per-entry timestamps.
6. Run regression tests, existing tests, validation, render/export/search/graph, and the remaining build steps. Update project and contributor instructions. Package a checked patch if repository write access remains unavailable.

No commits or remote changes requested. Preserve the existing modified prompt log.
