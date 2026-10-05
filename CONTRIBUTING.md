# Contributing

Thanks for helping keep this list sharp.

**Source of truth lives in `data/`.** The README and the [live site](https://3d.devanshutak.xyz) are generated from it by `scripts/render.js` and the build scripts. Do not edit `README.md`: it is re-rendered automatically after every merge to `main`, so manual changes are overwritten.

## Two paths to contribute

### 1. Open a PR against `data/` (preferred)

Entries live in **chunk files**, one folder per subsection:

```
data/<NN-section>/<subsection>/<NN>-<subsection>.yml    # e.g. data/01-assets/hdris/01-hdris.yml
```

Each chunk holds at most 50 entries under an `entries:` list. Add your entry to the **last** chunk of the right subsection; if it already has 50, create the next file (`02-...yml`) and bump that subsection's `chunks:` count in `data/NN-<section>.yml`. The section files (`data/NN-<section>.yml`) list subsections with their titles and descriptions; they never hold entries.

```yaml
entries:
  - name: Tool Name
    url: https://example.com/
    added_at: '2026-10-05T00:00:00Z'   # actual UTC time you added it
    description: One sentence on what it is and what it does.
    license: Free                       # Open Source | Free | Free NC | Freemium | Paid | Mixed
    entry_type: software                # see the list below
    pricing: Free, Pro $10/mo           # optional, paid or freemium tools
    tags:
      workflow: [modeling, texturing]
      platform: [win, mac, linux]
      output: [games]
      tech: [pbr]
    readme_tags: [Key Feature, Attribute]   # at most 2
    best_for: Short use-case phrase         # optional
```

**Entry types:** `software` · `asset-source` · `marketplace` · `tool` · `plugin` · `tutorial` · `channel` · `community` · `reference` · `inspiration` · `service` · `book` · `hardware` · `paper`.

`license`, `entry_type` and the `workflow` / `output` / `platform` / `skill` tags are closed lists: use only values from [`schema/vocab.yml`](schema/vocab.yml). `tech` tags are free-form, but reuse existing values where possible. URLs must start with `http://` or `https://`.

`added_at` is required for feed ordering. Set it when adding an entry and keep it unchanged when editing, moving or updating the URL.

**Writing style:** one plain sentence saying what the resource is and does. No em-dashes, no hype words (comprehensive, robust, powerful, seamless, cutting-edge, ...), no trailing "and more".

CI validates the schema, vocabulary and duplicates and builds the whole site on your PR. First-time contributors' runs wait for maintainer approval.

### 2. Open an issue (if editing YAML is a barrier)

Use the [Suggest a resource](https://github.com/devanshutak25/3d-resources/issues/new?template=suggest-resource.yml) form, or just tell us:
- Resource name + URL
- One-line description
- Best-guess category
- License tier (free / freemium / paid)

A maintainer will add it to the right place.

Or reach out via [email](mailto:3dresources@devanshutak.xyz) / [Instagram](https://www.instagram.com/devanshutak25/).

## Quality bar

- Genuinely useful to a 3D artist, animator, VFX professional or game dev.
- Paid resources welcome if clearly marked (`license: Paid` + `pricing`).
- Prefer actively maintained resources.
- No affiliate links.
- One resource per PR if possible. If you made the resource, say so in the PR.
- Search existing entries first to avoid duplicates. To show one entry in several subsections, keep it in one place and add `dual_listed_in: [section-slug/subsection-slug]`.

## Reporting broken or outdated entries

- **Broken link:** the monthly link checker updates link-health fields and opens an issue for review. It never deprecates an entry on its own. You can also [report one](https://github.com/devanshutak25/3d-resources/issues/new?template=report-broken-link.yml).
- **Wrong pricing / license / description:** PR an edit, or open an issue.
- **Resource has moved:** PR to update `url`.

## Local dev

Requires Node.js 20+.

```bash
npm ci                            # install pinned dependencies
npm run validate                  # schema + vocab + duplicate check
npm test                          # unit + regression tests
npm run build                     # README.md + full site in _site/, ends with an internal link check
node scripts/check-links.js       # external link check (slow; writes link status into data/)
```
