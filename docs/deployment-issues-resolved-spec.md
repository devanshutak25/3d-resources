# Deployment Issues — Resolved UX Spec

Companion to `deployment-issues.md`. Captures decisions from grill session 2026-05-04.
Implementation-agnostic. Source of truth for behavior.

---

## 1. Default Section State

- **Top-level categories:** open by default.
- **Subcategories:** closed by default.
- Chevron indicator must match actual collapse state at all times.

## 2. Search Behavior — Focus Mode

When a search query is active:
- Non-matching subcategories are **hidden/dimmed**.
- Subcategories containing hits **auto-expand**.
- Each matching subcategory shows a **hit count badge** (e.g. `Rigging (3)`).
- A **"Clear search"** affordance is always visible while query is active.

## 3. State Restoration After Clearing

- When search/filters are cleared, **subcategories that auto-expanded during search remain expanded**.
- User can manually collapse if desired.
- Fixes ToC-breaks-and-doesn't-recover bug by defining "recovered" state explicitly.

## 4. Search Ranking & Fuzziness

- Search corpus: title, description/caption, tags. All links.
- **Ranking:** weighted + grouped.
  - Within each subcategory, items reorder by score.
  - Subcategories themselves order by best-hit score.
  - Field weights: title > tags > description.
- **Fuzziness:** loose. Partial-token matching (`rig` matches `rigging`, `auto-rigger`, `Rigify`). Typo tolerance included.

## 5. Match Highlighting

- **Scope:** every occurrence of the matched term in the row, across all fields (not just the field that triggered the match).
- **Style:** yellow background highlight (Cmd-F muscle memory).

## 6. Filter Panel

- **Trigger button:** stays in current location. Add **"Filters" text label** next to icon.
- Active-filter count indicator: already handled by existing code, no change.
- **Layout:** inline expand panel below search box on click.
- **Filter groups (5), all visible inside panel by default — no nested "More filters" collapse:**
  - Category
  - License
  - Platform
  - Workflow
  - Output

## 7. Filter Combination Logic

- **Within a group:** OR (e.g. Platform = Windows + Linux → matches either).
- **Across groups:** AND.
- **Empty state when filters return zero results:** suggest dropping the most restrictive filter (e.g. "Try removing 'Linux'").

## 8. GitHub Repo Indicator (`![][repo]` fix)

- Replace broken `![][repo]` markup with a **"GitHub" pill** (text + icon).
- No live star count for now. Upgrade path open.

## 9. Machine Learning for CG — Paper Cleanup

- Move all research papers to a **dedicated subsection at the bottom** of ML for CG.
- Each paper entry must include:
  - Plain-English 1-line summary (not the abstract).
  - Year.
  - `paper` tag.

## 10. Section Expand/Collapse Animation

- **Duration:** 180ms.
- **Animates:** height + chevron rotation tween.
- **No opacity fade.**

## 11. Attribution

- All historically-mined GitHub awesome-lists remain listed by name in the attribution section, regardless of current active-mining status.
- No "stale" or "last mined" marking.

## 12. Mobile Behavior

- **Filter panel:** full-screen overlay (not inline).
- **Table of Contents:** "Jump to section" dropdown at top of page.
- **Search focus mode:** identical to desktop.

## 13. Empty State — Search With No Results

- Show: "No results for '<query>'".
- Plus a contribute prompt linking to a GitHub issue: "Know a resource? Suggest it →".

## 14. Tags

- **Decorative only.** Not clickable.
- Searchable via the main search box (covered in §4).

## 15. Keyboard Navigation

- `/` or `Cmd-K` → focus search box.
- `Esc` → clear search.
- `Up` / `Down` → traverse currently-visible items only (includes category and subcategory headers).
- `Right` → expand a collapsed category/subcategory.
- `Left` → collapse an expanded category/subcategory.
- `Enter` → open focused link in new tab.

## 16. Session Persistence

- **None.** Every visit starts fresh with defaults from §1.
- No localStorage of expand state, filters, or last query.

## 17. Table of Contents During Search/Filter

- ToC entries for non-matching sections are **dimmed but remain clickable**.
- Clicking a dimmed ToC entry **clears active filters/search** and jumps to that section.

---

## Cross-Reference to Original Issues

| Original Item | Resolved In |
|---|---|
| 1. Chevron state lie | §1 |
| 2. No section animation | §10 |
| 3. ToC breaks with filters | §3, §17 |
| 4. Filter icon too small | §6 |
| 5. Show all filter types | §6 |
| 6. Search doesn't open sections | §2 |
| 7. No match highlighting | §5 |
| 8. Fuzzy search across all fields | §4 |
| 9. ML for CG paper dump | §9 |
| 10. `![][repo]` literal | §8 |
| 11. Keep stale awesome-lists in attribution | §11 |
