# Deployment Issues — Resolved UX Spec

Companion to `deployment-issues.md`. Captures decisions from grill session 2026-05-04.
Implementation-agnostic. Source of truth for behavior.

## Status

- **Round 1 (§1–§17):** ✅ implemented 2026-05-04 — see `_site/`, `assets/js/filter.js`, `assets/css/style.css`, `scripts/render.js`, `data/09-ai-ml.yml`.
- **Round 2 P0 (A1, A2, A3, B1, B2, B3, B7):** ✅ implemented 2026-05-04 — see `assets/js/filter.js`, `scripts/build-html.js`, `scripts/render.js`, `assets/css/style.css`, `schema/entry.schema.json`, and data fixes in `data/01-assets/*`, `data/02-modeling/*`, `data/12-software-reference/*`.
- **Round 2 P1 (A4, A5, A6, A9, B4, B5):** ✅ implemented 2026-05-04 — see `scripts/render.js`, `scripts/build-html.js`, `assets/js/filter.js`, `assets/css/style.css`. (B4 deferred sub-piece — featured tool names per top-level ToC entry — completed 2026-05-04 via `data/sections.yml` `featured:` field + `.toc-featured` rendering.)
- **Round 2 P2 (A7, A8, B6, C1, C2, C3):** ✅ implemented 2026-05-04 — see `assets/css/style.css`, `assets/js/filter.js`, `scripts/build-html.js`.
- **Round 3 (§D):** ✅ implemented 2026-05-04 — see `data/12-software-reference.yml`, `scripts/render.js`, `assets/css/style.css`.

---

## 1. Default Section State ✅

- **Top-level categories:** open by default.
- **Subcategories:** closed by default.
- Chevron indicator must match actual collapse state at all times.

## 2. Search Behavior — Focus Mode ✅

When a search query is active:
- Non-matching subcategories are **hidden/dimmed**.
- Subcategories containing hits **auto-expand**.
- Each matching subcategory shows a **hit count badge** (e.g. `Rigging (3)`).
- A **"Clear search"** affordance is always visible while query is active.

## 3. State Restoration After Clearing ✅

- When search/filters are cleared, **subcategories that auto-expanded during search remain expanded**.
- User can manually collapse if desired.
- Fixes ToC-breaks-and-doesn't-recover bug by defining "recovered" state explicitly.

## 4. Search Ranking & Fuzziness ✅

- Search corpus: title, description/caption, tags. All links.
- **Ranking:** weighted + grouped.
  - Within each subcategory, items reorder by score.
  - Subcategories themselves order by best-hit score.
  - Field weights: title > tags > description.
- **Fuzziness:** loose. Partial-token matching (`rig` matches `rigging`, `auto-rigger`, `Rigify`). Typo tolerance included.

## 5. Match Highlighting ✅

- **Scope:** every occurrence of the matched term in the row, across all fields (not just the field that triggered the match).
- **Style:** yellow background highlight (Cmd-F muscle memory).

## 6. Filter Panel ✅

- **Trigger button:** stays in current location. Add **"Filters" text label** next to icon.
- Active-filter count indicator: already handled by existing code, no change.
- **Layout:** inline expand panel below search box on click.
- **Filter groups (5), all visible inside panel by default — no nested "More filters" collapse:**
  - Category
  - License
  - Platform
  - Workflow
  - Output

## 7. Filter Combination Logic ✅

- **Within a group:** OR (e.g. Platform = Windows + Linux → matches either).
- **Across groups:** AND.
- **Empty state when filters return zero results:** suggest dropping the most restrictive filter (e.g. "Try removing 'Linux'").

## 8. GitHub Repo Indicator (`![][repo]` fix) ✅

- Replace broken `![][repo]` markup with a **"GitHub" pill** (text + icon).
- No live star count for now. Upgrade path open.

## 9. Machine Learning for CG — Paper Cleanup ✅

- Move all research papers to a **dedicated subsection at the bottom** of ML for CG.
- Each paper entry must include:
  - Plain-English 1-line summary (not the abstract).
  - Year.
  - `paper` tag.

## 10. Section Expand/Collapse Animation ✅

- **Duration:** 180ms.
- **Animates:** height + chevron rotation tween.
- **No opacity fade.**

## 11. Attribution ✅

- All historically-mined GitHub awesome-lists remain listed by name in the attribution section, regardless of current active-mining status.
- No "stale" or "last mined" marking.

## 12. Mobile Behavior ✅

- **Filter panel:** full-screen overlay (not inline).
- **Table of Contents:** "Jump to section" dropdown at top of page.
- **Search focus mode:** identical to desktop.

## 13. Empty State — Search With No Results ✅

- Show: "No results for '<query>'".
- Plus a contribute prompt linking to a GitHub issue: "Know a resource? Suggest it →".

## 14. Tags ✅

- **Decorative only.** Not clickable.
- Searchable via the main search box (covered in §4).

## 15. Keyboard Navigation ✅

- `/` or `Cmd-K` → focus search box.
- `Esc` → clear search.
- `Up` / `Down` → traverse currently-visible items only (includes category and subcategory headers).
- `Right` → expand a collapsed category/subcategory.
- `Left` → collapse an expanded category/subcategory.
- `Enter` → open focused link in new tab.

## 16. Session Persistence ✅

- **None.** Every visit starts fresh with defaults from §1.
- No localStorage of expand state, filters, or last query.

## 17. Table of Contents During Search/Filter ✅

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

---

# Round 2 — Audit Findings (Accepted)

Appended 2026-05-04 from parallel a11y / UX / delight audits of live deployment.
Only accepted items below; rejected items omitted.

## A. Accessibility & Semantics

### A1. Search input accessible label ✅ 2026-05-04
- Add `<label for="search">` (visually hidden) or `aria-label="Search resources"`.
- Wrap search in `role="search"` landmark.
- WCAG 4.1.2, 3.3.2.

### A2. Filter chips must be semantic buttons ✅ 2026-05-04
- All filter chips/pills must be `<button>` elements (or `role="button"` with full keyboard support: tab-reachable, Enter/Space activation, focus ring).
- Required for keyboard reachability and screen-reader announcement.
- WCAG 2.1.1, 4.1.2.

### A3. `<main>` landmark + skip link ✅ 2026-05-04
- Wrap primary content area in `<main>`.
- Add "Skip to main content" link as first focusable element on page.
- WCAG 1.3.1, 2.4.1.

### A4. Section anchor focus management ✅ 2026-05-04
- When ToC link is clicked and target section scrolls into view, move keyboard focus to the section heading.
- Add `tabindex="-1"` on section/subsection headings so they can receive programmatic focus without entering tab order.
- WCAG 2.4.1, 2.4.3.

### A5. Heading hierarchy ✅ 2026-05-04
- Verify and fix any skipped levels (e.g. h2 → h4 directly).
- Subcategories should be exactly one level deeper than their parent section.
- Build now asserts no skipped levels (`scripts/build-html.js`).
- WCAG 1.3.1.

### A6. `aria-hidden` on decorative emoji/icons ✅ 2026-05-04
- All emoji or decorative icons (📖, 🔗, ⚙️, etc.) wrapped with `aria-hidden="true"` so screen readers don't announce "open book emoji" before each entry.
- WCAG 1.3.1.

### A7. Color contrast verification pass ✅ 2026-05-04
- Verify all body text ≥ 4.5:1.
- Verify large text ≥ 3:1.
- Verify UI components and tag pills ≥ 3:1.
- Particular suspicion: muted description text (often `#888`-on-white ≈ 3.5:1).
- WCAG 1.4.3, 1.4.11.

### A8. `lang="en"` on `<html>` ✅ 2026-05-04
- Verify `<html lang="en">` is present so screen readers select correct voice.
- WCAG 3.1.1.

### A9. External-link hygiene ✅ 2026-05-04
- Add a visual indicator (small icon or `↗` glyph) next to external links.
- Audit every `target="_blank"` link to ensure `rel="noopener noreferrer"`.
- WCAG 2.4.4.

## B. UX & Information Architecture

### B1. Deep-linkable filter & search state ✅ 2026-05-04
- Serialize active filters and search query into the URL (query string or hash params).
- Loading the URL must restore exact state.
- Required for sharing curated views ("Houdini plugins, free, Windows") and bookmarking.

### B2. Free vs paid consistency ✅ 2026-05-04
- Audit every item: where price/license is non-free, the marker must be present (currently `[$]` is uneven).
- Either backfill `[$]` universally, or move to an explicit Free/Paid/Freemium pill driven by the License facet already in data.
- Absence of a marker must be trustworthy as "free."

### B3. Stale & renamed link cleanup ✅ 2026-05-04 (3 named items; broader sweep deferred to B7-followup)
Confirmed cases to fix:
- **BlenderBIM** → renamed to **Bonsai**, domain now `bonsaibim.org`. Update name + URL.
- **cc0textures.com** → 301 to ambientCG. ambientCG already listed separately. Remove the duplicate entry.
- **cineversity.com** → 301 to `cineversity.maxon.net`. Update to canonical URL.
- (Run a broader scheduled link-check pass beyond just these three — see B7.)

### B4. ToC information scent ✅ 2026-05-04 (deferred piece completed 2026-05-04)
- Each ToC entry shows: section/subcategory name + `(N items)` count + 6–10 word descriptor.
- 1–3 representative tool names per top-level entry — rendered inline in `<summary>` via `.toc-featured` span; data declared in `data/sections.yml` `featured:` field. (Names only; no logo/sprite pipeline.)
- User should be able to predict scope without clicking in.

### B5. Surface `dual_listed_in` mirrors as "See also" ✅ 2026-05-04
- The mirror metadata in data files is currently invisible to users.
- Render an inline "See also: [related entry]" link on every item that has `dual_listed_in` populated.
- Example: Houdini course in Game Dev → links to Houdini software entry; Houdini plugin in Software Reference → links to Houdini courses.

### B6. Item-level deep links ✅ 2026-05-04
- Every resource row gets a stable `id`.
- Add a hover-anchor (GitHub-style `§`) so users can copy a link to that specific item.
- Sharing in Discord/Slack lands on the exact item, ideally highlighted briefly on load.

### B7. Content accuracy fixes (data layer) ✅ 2026-05-04
- **Mixamo** is currently under "Specialized Models" — recategorize to Animation & Rigging, or dual-list via the existing mirror system.
- **NASA 3D Resources** license tag — current tag treats everything as public domain; site mixes CC0 and CC-BY. Update to a per-item or "mixed (CC0/CC-BY)" tag.
- **Substance Painter** license tag — verify it reflects Adobe subscription, not free.
- **Unity duplicate entry** under "Commercial engines with generous free tiers" — two separate listings exist (`Unity 3D` and `Unity 6`). Combine into a single canonical "Unity" entry; mention the Unity 6 release in the description rather than as a second item.

## C. Delight (Accepted)

### C1. Per-discipline section icons (monochrome SVG sprite) ✅ 2026-05-04
- Replace generic emoji glyphs with discipline-specific line icons:
  - Modeling → wireframe cube
  - Animation → bezier curve
  - Lighting → bulb with rays
  - VFX → particle burst
  - Game Dev → gamepad
  - AI/ML → neural node
  - (etc. for each section)
- Single inline SVG `<symbol>` sprite, < 2 KB, one request.
- Place to the left of each H2 section heading.

### C2. `W` key easter egg — wireframe mode ✅ 2026-05-04
- Pressing `W` toggles a `1px dashed` outline on every card across the page.
- Press `W` again to exit.
- No on-screen hint, no documentation — let people discover it.
- Maya/Blender wireframe shortcut; pure insider joke for the CG audience.
- Implementation: ~10 lines JS, no layout shift, no paint until triggered.

### C3. Smarter no-results copy ✅ 2026-05-04
- When search returns zero matches, show one of (rotated):
  - *"No hits. Try a broader term — 'retopo' instead of 'quad-remesher'."*
  - *"Nothing yet. If it exists and it's good, [open an issue]."*
  - *"Empty. Even Houdini returns null sometimes."*
- Domain-specific phrasing teaches search behavior while staying warm.
- This is the **copy** layer for the empty state; the contribute CTA from §13 is the structural layer. The two combine.

---

## Round 2 — Priority Cuts

- **P0 (correctness/trust):** A1, A2, A3, B1, B2, B3, B7 ✅
- **P1 (a11y + scent):** A4, A5, A6, A9, B4, B5 ✅
- **P2 (hygiene + delight):** A7, A8, B6, C1, C2, C3 ✅

---

# Round 3 — Software Table Mirroring

## D. Mirror Software Tables Into Topical Sections

Software Reference holds the canonical software tables (Compositing, Virtual Production, ML for CG, etc.). Mirror them into the matching topical sections elsewhere on the page so users browsing a topic see the relevant tools without leaving context.

### D1. Render mechanism — collapsed-by-default inline ✅ 2026-05-04
- The mirrored table renders inline in the topical section, **collapsed by default**.
- Header shows table name + item count; click to expand into full table.
- **Same component, single source of truth.** No data fork. Mirror only differs in default expand state and provenance line.
- Honors lookup-first: visible affordance, no jump-away, no page-weight cost on initial render.

### D2. Mapping — 1:1 only ✅ 2026-05-04
- Each Software Reference table mirrors into **at most one** topical section (the most obvious match).
- No fan-out into multiple sections.
- Mapping is **manually declared** in data (extends the existing `dual_listed_in` convention to table-level).
- Maintainer keeps editorial control over which table belongs where.

### D3. Search & filter behavior — both render, dedupe ✅ 2026-05-04
- Search hits and filters apply to **both renderings** of the table.
- Hit-count badges count **items**, not renderings (no double-counting).
- A user searching "nuke" sees both the Compositing section and the Software Reference Compositing table light up; the count reflects unique items found.

### D4. Provenance signal — subtle subtitle ✅ 2026-05-04
- Mirrored table shows a one-line subtitle directly under its header:
  *"Also in Software Reference → [Compositing]"* (link to canonical location).
- Quiet enough for casual lookup, explicit enough that power users know there's a canonical home and can navigate cross-domain.

### D5. Single source of truth ✅ 2026-05-04
- Editing software entries happens **only** in Software Reference data.
- Mirror locations never store their own copy — they reference the canonical table.
- A bug fix or addition propagates to both renderings automatically.
