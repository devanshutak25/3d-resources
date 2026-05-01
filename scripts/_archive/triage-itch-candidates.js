#!/usr/bin/env node
// One-shot triage: read _maintenance/freshness/ingest-itch.json, append classified
// entries into the catalog. Manual mapping per item; skips items that duplicate
// canonical entries (Aseprite/Godot/LDtk/PixelOver/Sprytile already exist via
// official URLs).

const fs = require('fs');
const path = require('path');
const catalog = require('./lib/catalog');

const TODAY = new Date().toISOString().slice(0, 10);
const SRC = path.join(__dirname, '..', '_maintenance', 'freshness', 'ingest-itch.json');
const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));

// url → { section, sub, overrides }
// Set section=null to skip (duplicate of a canonical entry already in catalog).
const PLAN = {
  // --- itch:tools ---
  'https://dacap.itch.io/aseprite':                    { skip: 'dup of aseprite.org' },
  'https://prominent.itch.io/crocotile3d':             { section: 'software-reference', sub: '3d-software-paid', license: 'Paid', entry_type: 'software', best_for: '2D-tile to 3D modeling', tags: { output: ['games'] }, readme_tags: ['Pixel/Tile 3D', 'Indie'] },
  'https://godotengine.itch.io/godot':                 { skip: 'dup of godotengine.org' },
  'https://sleeping-robot-games.itch.io/sprite-sheet-creator': { section: 'software-reference', sub: '2d-animation-software', license: 'Paid', entry_type: 'software', best_for: 'Pixel character sprite sheets', tags: { output: ['games'] }, readme_tags: ['Pixel Art', 'Sprites'] },
  'https://deakcor.itch.io/pixelover':                 { skip: 'dup of pixelover.io' },
  'https://deepnight.itch.io/ldtk':                    { skip: 'dup of ldtk.io' },
  'https://jeiel.itch.io/sprytile':                    { skip: 'dup of existing Sprytile entries' },
  'https://captain4lk.itch.io/slk-img2pixel':          { section: 'software-reference', sub: 'ai-image-software', license: 'Free', entry_type: 'tool', best_for: 'Image-to-pixel-art conversion', tags: { output: ['games'] }, readme_tags: ['Pixel Art', 'Free'] },

  // --- itch:tools-free ---
  'https://watabou.itch.io/perilous-shores':           { section: 'software-reference', sub: 'level-design-software', license: 'Free', entry_type: 'tool', best_for: 'Procedural fantasy region maps', tags: { output: ['games'] }, readme_tags: ['Procedural', 'Free'] },
  'https://calcium-chan.itch.io/clipnote':             { section: 'software-reference', sub: '2d-animation-software', license: 'Free', entry_type: 'software', best_for: 'Frame-by-frame 2D animation', tags: { platform: ['win'] }, readme_tags: ['2D Anim', 'Free'] },
  'https://watabou.itch.io/village-generator':         { section: 'software-reference', sub: 'level-design-software', license: 'Free', entry_type: 'tool', best_for: 'Procedural village maps', tags: { output: ['games'] }, readme_tags: ['Procedural', 'Free'] },
  'https://watabou.itch.io/one-page-dungeon':          { section: 'software-reference', sub: 'level-design-software', license: 'Free', entry_type: 'tool', best_for: 'Procedural one-page dungeons', tags: { output: ['games'] }, readme_tags: ['Procedural', 'Free'] },
  'https://suvidriel.itch.io/vnyan':                   { section: 'software-reference', sub: 'misc-3d-utilities-software', license: 'Free', entry_type: 'software', best_for: '3D VTubing', tags: { platform: ['win'] }, readme_tags: ['VTubing', 'Free'] },
};

// Defaults for itch:game-assets — all go to 01-assets/game-assets unless overridden.
function defaultGameAssetEntry(c) {
  const license = parseLicense(c.title);
  return {
    section: 'assets-libraries',
    sub: 'game-assets',
    license,
    entry_type: 'asset-source',
    tags: { output: ['games'] },
    readme_tags: tagsFromLicense(license)
  };
}

function parseLicense(title) {
  if (/\[Free\]/i.test(title)) return 'Free';
  if (/\[\$/.test(title)) return 'Paid';
  return 'Free';
}

function tagsFromLicense(lic) {
  if (lic === 'Free') return ['Pixel Art', 'Free'];
  if (lic === 'Paid') return ['Pixel Art', 'Paid'];
  return ['Pixel Art'];
}

function cleanTitle(t) {
  // Strip trailing bracketed metadata: "[Free]", "[$X]", "[Windows]", "[50% Off]"
  return t.replace(/\s*\[[^\]]*\]/g, '').trim();
}

function platformsFromTitle(t) {
  const p = [];
  if (/\[Windows\]/i.test(t)) p.push('win');
  if (/\[macOS\]/i.test(t)) p.push('mac');
  if (/\[Linux\]/i.test(t)) p.push('linux');
  return p;
}

function buildEntry(c, plan) {
  const name = cleanTitle(c.title);
  const desc = (c.description && c.description.trim()) || `Itch.io listing: ${name}.`;
  const platforms = platformsFromTitle(c.title);

  const tags = JSON.parse(JSON.stringify(plan.tags || {}));
  if (platforms.length) {
    tags.platform = Array.from(new Set([...(tags.platform || []), ...platforms]));
  }

  const e = {
    name,
    url: c.url,
    description: desc.length > 280 ? desc.slice(0, 277) + '…' : desc,
  };
  if (plan.license) e.license = plan.license;
  if (plan.entry_type) e.entry_type = plan.entry_type;
  if (plan.best_for) e.best_for = plan.best_for;
  if (Object.keys(tags).length) e.tags = tags;
  if (plan.readme_tags) e.readme_tags = plan.readme_tags;
  e.url_last_verified = TODAY;
  e.url_status = 'ok';
  return e;
}

function main() {
  let added = 0, skipped = 0;
  const log = [];

  for (const c of data.candidates) {
    let plan = PLAN[c.url];
    if (!plan) {
      if (c.source === 'itch:game-assets') plan = defaultGameAssetEntry(c);
    }
    if (!plan) {
      log.push(`UNCLASSIFIED ${c.source} ${c.url}`);
      skipped++;
      continue;
    }
    if (plan.skip) {
      log.push(`SKIP ${c.url} — ${plan.skip}`);
      skipped++;
      continue;
    }
    const entry = buildEntry(c, plan);
    catalog.appendEntry(plan.section, plan.sub, entry);
    log.push(`ADD  ${plan.section}/${plan.sub} ← ${entry.name}`);
    added++;
  }

  console.log(log.join('\n'));
  console.log(`\nAdded: ${added}, Skipped: ${skipped}`);
}

main();
