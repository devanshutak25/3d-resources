# 3d_resources — project rules

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

**Session start:** Read all 8 files in `./memory/` before responding to first prompt. Treat them as authoritative project context.

**After every user prompt:**
1. Append the verbatim prompt to `user-prompts.md` with timestamp + 1-line answer summary.
2. Update any other file whose content changed (new decision → `decisions.md`; new tool used → `tools.md`; new preference learned → `preferences.md`; etc.).

**Session end:** Final sweep — ensure all files reflect latest state. Add new decisions, move completed goals to Done, log any agents spawned.

Rule: keep entries terse (caveman lite). No filler. Date everything (YYYY-MM-DD).
