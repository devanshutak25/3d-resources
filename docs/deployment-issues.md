# Deployment Issues — UX Punchlist

Captured 2026-05-04. User-facing issues observed in current deployment. Focus: UX, not implementation.

## Navigation & Disclosure

1. **Subcategory chevrons lie about state.** Chevrons render as closed by default, but the underlying subcategories are actually expanded. State indicator and DOM state are out of sync.
2. **Section open/close has no animation.** Expand/collapse snaps. Should be smooth (height + opacity transition).
3. **Table of Contents breaks when filters are applied** — and does not recover after filters are cleared. ToC should always reflect visible/relevant sections.

## Filtering

4. **Filter icon is too small / unnoticeable in closed state.** Add a visible "Filters" text label next to the icon.
5. **All filter types should be visible up front.** No "More filters" hidden drawer — surface every filter type.
6. **Search/filter does not open matching sections or subsections.** When a query matches content inside a collapsed section, that section must auto-expand to reveal the hit.
7. **No highlighting of matched terms** in search or filter results. Add inline highlight on matched text.
8. **Search must be fuzzy** and cover: link title, written description/caption text, and tags — across every link.

## Content Quality

9. **Machine Learning for CG subsection is dominated by poorly-labelled research papers** stacked at the top. Re-rank, re-label, or move papers below curated tools.
10. **Items ending with `![][repo]` literal markup** — broken/unrendered reference. Replace with a humanized indicator (e.g., a small "GitHub" pill or repo icon).

## Attribution

11. **Keep "Github awesome-lists mined" line in attribution** even when the source is stale. Do not auto-remove.

---

## Priority cuts (suggested)

- **P0 (correctness/trust):** 1, 3, 6, 10
- **P1 (discoverability):** 4, 5, 7, 8
- **P2 (polish/content):** 2, 9, 11
