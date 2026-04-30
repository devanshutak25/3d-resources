#!/usr/bin/env node
// Cleanup pass after auto-add:
//   1. Remove garbage entries (name="link", description essentially empty)
//   2. Remove http/www variant duplicates (keep earlier occurrence)
//   3. Report miscategorized by naive type inference

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '..', 'data');

function strictNormalize(u) {
  try {
    const url = new URL(u);
    url.hash = '';
    url.protocol = 'https:'; // collapse http ↔ https
    url.hostname = url.hostname.replace(/^www\./, ''); // strip www
    for (const p of ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'source']) url.searchParams.delete(p);
    let s = url.toString();
    if (s.endsWith('/') && url.pathname !== '/') s = s.slice(0, -1);
    return s.toLowerCase();
  } catch (e) { return u.toLowerCase(); }
}

function isGarbage(e) {
  const name = (e.name || '').trim();
  const desc = (e.description || '').trim();
  if (!name || name.length <= 2) return 'empty/too-short name';
  if (name.toLowerCase() === 'link') return 'name=link';
  if (name.toLowerCase() === desc.toLowerCase().replace(/\.$/, '')) return 'description=name';
  if (desc.toLowerCase() === 'link.') return 'desc=link';
  if (/^([a-z0-9-]+)\.$/i.test(desc) && desc.length < 30) return 'desc=single-word-period';
  return null;
}

function main() {
  const sections = yaml.load(fs.readFileSync(path.join(DATA_DIR, 'sections.yml'), 'utf8'));
  const allFiles = sections.sections.map(s => s.file);
  const docs = new Map();
  for (const f of allFiles) {
    const p = path.join(DATA_DIR, f);
    if (fs.existsSync(p)) docs.set(f, yaml.load(fs.readFileSync(p, 'utf8')));
  }

  // Pass 1: collect all existing entries with strict-normalized URL, first occurrence wins.
  const seenUrl = new Map(); // strictUrl → { file, sub, name, index }
  let removalCount = 0;
  let garbageCount = 0;
  let dupCount = 0;
  const removedGarbage = [];
  const removedDup = [];

  for (const [file, doc] of docs) {
    for (const sub of doc.subsections || []) {
      const keep = [];
      for (const e of sub.entries || []) {
        const strict = strictNormalize(e.url);
        const garbageReason = isGarbage(e);
        if (garbageReason) {
          removedGarbage.push({ file, sub: sub.slug, name: e.name, url: e.url, reason: garbageReason });
          garbageCount++;
          removalCount++;
          continue;
        }
        if (seenUrl.has(strict)) {
          const first = seenUrl.get(strict);
          removedDup.push({ file, sub: sub.slug, name: e.name, url: e.url, firstAt: `${first.file}::${first.sub}::${first.name}` });
          dupCount++;
          removalCount++;
          continue;
        }
        seenUrl.set(strict, { file, sub: sub.slug, name: e.name });
        keep.push(e);
      }
      sub.entries = keep;
    }
  }

  for (const [file, doc] of docs) {
    fs.writeFileSync(path.join(DATA_DIR, file), yaml.dump(doc, { lineWidth: -1, noRefs: true }));
  }

  console.log(`\nCleanup summary:`);
  console.log(`  Garbage removed: ${garbageCount}`);
  console.log(`  Dup removed:     ${dupCount}`);
  console.log(`  Total removed:   ${removalCount}`);
  if (removedGarbage.length) {
    console.log('\nGarbage:');
    for (const r of removedGarbage.slice(0, 30)) {
      console.log(`  - [${r.file}::${r.sub}] ${r.name} (${r.url}) — ${r.reason}`);
    }
  }
  if (removedDup.length) {
    console.log('\nDups:');
    for (const r of removedDup.slice(0, 40)) {
      console.log(`  - [${r.file}::${r.sub}] ${r.name} (${r.url}) → first at ${r.firstAt}`);
    }
    if (removedDup.length > 40) console.log(`  ... and ${removedDup.length - 40} more`);
  }
}

main();
