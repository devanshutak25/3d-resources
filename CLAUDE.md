# 3d_resources — project rules

## project.md (MANDATORY)

**Read `project.md` at the start of every session.** It is the master guide: filesystem map, data model, build pipeline, rules, pending tasks, design style. Treat it as authoritative when any other doc disagrees.

**Update `project.md` after every change.** If filesystem layout, rules, goals, vocab, build steps, design conventions, or pending tasks shift, edit `project.md` in the same change. Stale `project.md` is a bug.

## Controlled vocabulary (entry tags)

Source of truth: `schema/vocab.yml` + `schema/entry.schema.json`.

**Rule:** When adding/editing entries, only use values that already exist in the vocab for these tag groups:

- `license` (closed enum)
- `entry_type` (closed enum)
- `tags.workflow` (closed enum)
- `tags.output` (closed enum)
- `tags.platform` (closed enum)
- `tags.skill` (closed enum)

`tags.tech` is freeform but curated — prefer existing values; new ones produce warnings, not errors.

**Never invent new values for closed enums.** If an entry seems to need one (e.g. `product-design`, `print`, `visionos`, `tracking`, `rotoscoping`), do NOT add it silently to `vocab.yml` or `entry.schema.json`. Instead:

1. Map to the closest existing value (e.g. `product-design` → `product-viz`, `tracking`/`rotoscoping` → `compositing`), OR drop the tag if no good fit.
2. Ask the user if a genuinely new category is needed before extending the vocab.

CI runs `node scripts/validate.js` — closed-enum violations exit 1 and block merge.

## Validation

Run `node scripts/validate.js` after any data edit. Must show `✓ Validation passed.` before commit.

## Writing style (user-facing text)

Applies to: `data/**/*.yml` (descriptions, titles, readme_tags), template strings in `scripts/render.js`, `scripts/build-html.js`, `scripts/build-section-pages.js`, `scripts/build-feed.js`, `scripts/build-llms-txt.js`, `scripts/build-og-images.js`, and any other surface a site visitor reads.

**Rules:**

1. **No em-dashes (`—`).** Ever. In titles, use `: `. In prose, use `. ` (period + capitalize next word) or `, ` depending on context. The OG-image splitter (`build-og-images.js`) keys on `: ` for two-line layout — don't reintroduce em-dashes.
2. **No AI tells.** Banned words/phrases: `comprehensive`, `robust`, `powerful`, `seamless(ly)`, `leverage(s/d)` (use "use"), `utilize(s/d/ing)` (use "use"), `cutting-edge`, `state-of-the-art`, `the ultimate`, `game-changing`, `unleash`. Banned trailing phrases: `and more`, `and beyond`, `and so much more`.
3. **No marketing adjective stacks** ("fast, free, and powerful"). One concrete attribute beats three vague ones.
4. **Caveman lite for descriptions.** Terse, factual, 1 sentence preferred. State what it *is* and what it *does*. Drop hype.
5. **Internal docs/memory/CLAUDE.md/comments are exempt.** Em-dashes and informal hedging are fine there.

## Project memory system (`/memory`)

Local, project-scoped memory lives in `./memory/`. Distinct from global `~/.claude` memory.

Files:
- `goals.md` — active + done goals
- `tech_stack.md` — frameworks, langs, build tools in use
- `decisions.md` — dated architectural/structural decisions w/ rationale
- `preferences.md` — user collab style + project rules
- `tools.md` — CLIs / utilities in active use
- `agents.md` — sub-agents used + outcomes
- `plugins.md` — skills + MCP extensions in use
- `user-prompts.md` — verbatim log of every user prompt + 1-line answer

### Protocol (MANDATORY)

**Session start:** Read `project.md` first, then all 8 files in `./memory/` before responding to first prompt. Treat them as authoritative project context.

**After every user prompt:**
1. Append the verbatim prompt to `user-prompts.md` with timestamp + 1-line answer summary.
2. Update any other file whose content changed (new decision → `decisions.md`; new tool used → `tools.md`; new preference learned → `preferences.md`; etc.).

**Session end:** Final sweep — ensure all files reflect latest state. Add new decisions, move completed goals to Done, log any agents spawned.

Rule: keep entries terse (caveman lite). No filler. Date everything (YYYY-MM-DD).
