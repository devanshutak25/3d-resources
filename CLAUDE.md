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
