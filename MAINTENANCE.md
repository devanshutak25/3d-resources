# Maintenance Framework

This repo keeps a curated list of ~1,000 resources. Everything rots. This document describes the automated and manual processes that keep data fresh.

**Source of truth:** `data/*.yml`. `README.md` and `_site/index.html` are regenerated on every build.

---

## Automated (GitHub Actions)

| Workflow | Trigger | What it does |
|---|---|---|
| `.github/workflows/validate.yml` | push/PR touching `data/`, `schema/`, `scripts/` | Schema check, vocab check, duplicate detection, dry-render |
| `.github/workflows/link-check.yml` | Weekly (Mon 06:00 UTC) + manual | HEAD every URL. Updates `url_last_verified`, `url_status`. Auto-flags broken as `deprecated: true`. Commits back. Opens issue with summary. |
| `.github/workflows/release-watch.yml` | Weekly (Mon 07:00 UTC) + manual | Checks watched releases (Blender, Godot, UE, USD, ASWF libs, …). Opens issue if new version. |

## Manual review cadences

| Dimension | Trigger | Action |
|---|---|---|
| **Pricing drift** | Quarterly (1 Jan / 1 Apr / 1 Jul / 1 Oct) | Re-verify `pricing` on every `entry_type: software` and `marketplace`. Update `pricing_last_verified`. |
| **License change** | Semi-annual | Re-check `license` field on software/asset-sources (look for free→paid transitions). |
| **Version-locked entries** | When flagged `version_sensitive: true` | Check every 1–3 months. Update name/description for new version if relevant (Midjourney, Runway, Godot, Blender, etc.). |
| **Plugin compat** | On major host release (triggered by release-watch issues) | Verify each `tech: [blender-addon]` / `houdini-addon` / etc. entry still works. Add `host_compat: "blender:>=4.2"` if known. |
| **Creator inactivity** | Annual | Check `entry_type: channel` / Patreon creators. Flag inactive (>12 months no upload). |
| **Discord invite expiry** | Quarterly | Re-verify all `discord.gg/*` URLs (link checker catches broken ones). |
| **Pre-1.0 software** | Biannual | Re-check entries flagged `version_sensitive: true` that are pre-1.0 (Early Access / alpha). |

## Schema fields for maintenance

| Field | Who sets | Purpose |
|---|---|---|
| `url_last_verified: YYYY-MM-DD` | link-check bot | Last time URL was HEAD-checked OK |
| `url_status: ok/redirect/broken/unreachable` | link-check bot | Current link state |
| `pricing_last_verified: YYYY-MM-DD` | human | Set during quarterly pricing sweep |
| `deprecated: true` | bot or human | Hides entry from README/site. Data retained. |
| `version_sensitive: true` | human | Flag entries whose version in name/description changes fast (AI tools especially) |
| `review_cadence` | human (optional) | Override default cadence per entry |
| `host_compat` | human | Plugin/addon compat hint, e.g., `"blender:>=4.2"` |

---

## Adding new resources

### For contributors familiar with GitHub
1. Find the right file in `data/NN-section.yml` (see section slugs in `TOC_FRAMEWORK.md`)
2. Add a new entry following the schema:
   ```yaml
   - name: "Tool Name"
     url: "https://..."
     description: "One-line what and why."
     license: "Free"                   # or Open Source / Free NC / Freemium / Paid
     entry_type: "software"            # or asset-source / tool / tutorial / channel / community / reference / inspiration / marketplace / plugin
     tags:
       workflow: [modeling]
       platform: [win, mac]
       tech: [procedural]
     readme_tags: ["Key Feature", "Attribute"]
     best_for: "Short use-case phrase"    # optional — software only
   ```
3. Open a PR. CI validates schema + runs link check on new URL.

### For users without GitHub skills
Open a free-form issue with:
- Resource name + URL
- One-line description
- Category (best guess — maintainer places it)
- License (free / freemium / paid)

### For maintainers — periodic trend sweep
Quarterly scan X, itch.io, ArtStation, r/blender, r/Houdini, HN Show posts for newly released CG tools. Add to appropriate sections.

---

## Release watch list

Current list in `scripts/watch-releases.js`. To add:
1. Edit `WATCHLIST` array in `watch-releases.js`
2. For GitHub-released projects: `{ name, type: 'github', config: { repo: 'owner/name' }, affectsTag: 'optional-tag' }`
3. `affectsTag` — if set, the issue notes "X entries tagged `Y` may need compatibility review"

Current watches: Blender, Godot, Bevy, Flax, O3DE, Fyrox, OpenUSD, MaterialX, OpenImageIO, OpenEXR.

Future additions (need non-GitHub watchers): Substance (Adobe), Houdini (SideFX), Unreal Engine (Epic), Autodesk products.

---

## Running maintenance scripts locally

```bash
# Validate schema, vocab, duplicates
node scripts/validate.js

# Full link check (takes ~3 minutes for 1,000 URLs)
node scripts/check-links.js

# Check for new releases
node scripts/watch-releases.js
```

---

## Deprecation lifecycle

1. Link checker finds URL broken → `deprecated: true` set, `url_status: broken`
2. Entry disappears from README and `_site/index.html` (still in `data/` for history)
3. Issue opened automatically with list of newly-broken entries
4. Human review: confirm dead, or fix URL (mirror, new domain), or restore if transient
5. To restore: remove `deprecated: true` and update `url`

---

## Legacy pricing/version tracker (pre-framework, 2026-04)

Kept for historical context. Now superseded by `pricing_last_verified` and `version_sensitive` fields on individual entries.

Version-sensitive software as of 2026-04-16: Godot 4.4, Midjourney v7, FLUX 1.1 Pro, Stable Diffusion 3.5, Suno v5, HunyuanVideo 1.5, Wan 2.2, Kling 3.0, Runway Gen-4, Meshy v4, Tripo v3.0.

Pre-1.0 / Early Access as of 2026-04-16: Texture Extractor, Sprite Stacker, GoZen, Texelpaint3D, Wavewright.
