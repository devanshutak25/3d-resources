# Contributing

Thanks for helping keep this list sharp.

**Source of truth lives in `data/*.yml`.** The README and the [live site](https://3d.devanshutak.xyz) are generated from those files by `scripts/render.js` on every build. Do not edit `README.md` directly — changes will be overwritten.

## Two paths to contribute

### 1. Open a PR against `data/*.yml` (preferred)

Find the right section file (`data/01-assets.yml` through `data/12-software-reference.yml` — see `TOC_FRAMEWORK.md` for what belongs where) and add an entry:

```yaml
- name: "Tool Name"
  url: "https://example.com"
  description: "One-line what it is and why it matters."
  license: "Free"                 # Open Source | Free | Free NC | Freemium | Paid
  entry_type: "software"          # see full list below
  tags:
    workflow: [modeling, texturing]
    platform: [win, mac, linux]
    output: [games]
    tech: [pbr]
  readme_tags: ["Key Feature", "Attribute"]
  best_for: "Short use-case phrase"    # software only, optional
```

**Entry types:** `software` · `asset-source` · `marketplace` · `tool` · `plugin` · `tutorial` · `channel` · `community` · `reference` · `inspiration`.

CI automatically validates schema + vocab on your PR. See `schema/vocab.yml` for controlled vocabulary values.

### 2. Open a free-form issue (if GitHub editing is a barrier)

Just tell us:
- Resource name + URL
- One-line description
- Best-guess category
- License tier (free / freemium / paid)

A maintainer will add it to the right `data/` file.

Or reach out via [email](mailto:3dresources@devanshutak.xyz) / [Instagram](https://www.instagram.com/devanshutak25/).

## Quality bar

- Genuinely useful to a 3D artist, animator, VFX professional, or game dev.
- Paid resources welcome if clearly marked (`license: Paid` + `pricing` field).
- Prefer actively maintained.
- No affiliate links.
- One resource per PR if possible.
- Search existing entries first to avoid duplicates. Cross-section dual-listings are allowed — use `dual_listed_in: [section-slug]`.

## Reporting broken / outdated

- **Broken link:** our weekly link-checker workflow auto-flags these and opens an issue. You can also submit manually.
- **Wrong pricing / license / description:** PR edit, or issue.
- **Resource has moved:** PR to update `url`.

## Local dev

```bash
bash build.sh                     # regenerates README.md + builds _site/
node scripts/validate.js          # schema + vocab + duplicate check
node scripts/check-links.js       # full link check (~3 min)
```

See `MAINTENANCE.md` for the full maintenance framework.
