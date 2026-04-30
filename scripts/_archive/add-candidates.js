#!/usr/bin/env node
// Reads awesome-alive.json, auto-appends categorized candidates to data/*.yml.
// Strict URL dedup (catches http/https, www, trailing-slash variants).
// Skips garbage entries (name="link", trivial descriptions).

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '..', 'data');
const INPUT = path.join(__dirname, '..', '_maintenance', 'awesome-alive.json');

function strictNormalize(u) {
  try {
    const url = new URL(u);
    url.hash = '';
    url.protocol = 'https:';
    url.hostname = url.hostname.replace(/^www\./, '');
    for (const p of ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'source']) url.searchParams.delete(p);
    let s = url.toString();
    if (s.endsWith('/') && url.pathname !== '/') s = s.slice(0, -1);
    return s.toLowerCase();
  } catch (e) { return u.toLowerCase(); }
}

function loadExisting() {
  const set = new Set();
  const sections = yaml.load(fs.readFileSync(path.join(DATA_DIR, 'sections.yml'), 'utf8'));
  for (const meta of sections.sections) {
    const file = path.join(DATA_DIR, meta.file);
    if (!fs.existsSync(file)) continue;
    const doc = yaml.load(fs.readFileSync(file, 'utf8'));
    for (const sub of doc.subsections || []) {
      for (const e of sub.entries || []) set.add(strictNormalize(e.url));
    }
  }
  return set;
}

function isGarbageCandidate(c) {
  const name = (c.label || '').trim();
  if (!name || name.length <= 2) return 'too-short-name';
  if (/^link$/i.test(name)) return 'name=link';
  if (/^here$/i.test(name)) return 'name=here';
  if (name.length < 4 && !/^[A-Z]/.test(name)) return 'too-short-lowercase';
  return null;
}

function cleanDescription(text, label) {
  let d = (text || '').replace(label, '').trim();
  d = d.replace(/^[-—:|·•]\s*/, '').replace(/^[\s—:-]+/, '').trim();
  if (d.length > 250) d = d.slice(0, 247) + '...';
  if (d.length < 10) return null;
  const lower = d.toLowerCase().replace(/\.$/, '');
  const labelLower = label.toLowerCase();
  if (lower === labelLower || lower === labelLower + '.') return null;
  // Single-word-period placeholder like "Pipeline."
  if (/^[a-z][a-z0-9-]{0,30}\.$/i.test(d)) return null;
  return d;
}

// Improved type inference from label + text + URL
function inferType(c) {
  const name = c.label.toLowerCase();
  const t = c.text.toLowerCase();
  const u = c.url.toLowerCase();
  const d = c.domain;

  // Explicit software signals
  if (/\b(engine|editor|software|app|application|suite|studio|toolkit)\b/.test(name + ' ' + t)) {
    if (/itch\.io|gumroad|github\.com\/.+\.(exe|app|dmg)/.test(u)) return 'software';
  }
  if (/github\.com/.test(u) && /\b(tool|library|framework|sdk)\b/.test(t)) return 'tool';
  if (/github\.com/.test(u)) return 'reference'; // GitHub repos default to reference
  if (/youtube\.com/.test(u)) return 'channel';
  if (/patreon\.com/.test(u)) return 'channel';
  if (/discord\.(gg|com)/.test(u)) return 'community';
  if (/reddit\.com/.test(u)) return 'community';
  if (/\bforum\b|\bcommunity\b/.test(name + ' ' + t)) return 'community';
  if (/\btutorial|\bcourse|\bmasterclass\b|\blearn\b/.test(name + ' ' + t)) return 'tutorial';
  if (/\bblog\b|\barticle\b/.test(name + ' ' + t)) return 'reference';
  if (/marketplace|store|shop/.test(name + ' ' + t) && !/github/.test(u)) return 'marketplace';
  if (/\bportfolio\b|\bgallery\b|\bshowcase\b|\binspiration\b/.test(name + ' ' + t)) return 'inspiration';
  return null;
}

function buildEntry(c, categoryType) {
  const desc = cleanDescription(c.text, c.label);
  const inferredType = inferType(c);
  const entry = {
    name: c.label.trim(),
    url: c.url,
    description: desc || `${c.label.trim()}.`,
    entry_type: inferredType || categoryType || 'reference'
  };
  return entry;
}

function main() {
  const data = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
  const existing = loadExisting();
  const categorized = data.alive.filter(c => c.category);

  const seenInBatch = new Set();
  let dupExisting = 0;
  let dupInBatch = 0;
  let garbageSkipped = 0;
  const byBucket = new Map();
  const garbageExamples = [];

  for (const c of categorized) {
    // Garbage check first
    const garbageReason = isGarbageCandidate(c);
    if (garbageReason) {
      garbageSkipped++;
      if (garbageExamples.length < 10) garbageExamples.push({ name: c.label, url: c.url, reason: garbageReason });
      continue;
    }

    const norm = strictNormalize(c.url);
    if (existing.has(norm)) { dupExisting++; continue; }
    if (seenInBatch.has(norm)) { dupInBatch++; continue; }
    seenInBatch.add(norm);

    const key = `${c.category.file}::${c.category.sub}`;
    if (!byBucket.has(key)) byBucket.set(key, []);
    byBucket.get(key).push(c);
  }

  const fileStats = {};
  const touchedFiles = new Map();

  for (const [key, cands] of byBucket) {
    const [file, subSlug] = key.split('::');
    const fullPath = path.join(DATA_DIR, file);
    if (!touchedFiles.has(file)) touchedFiles.set(file, yaml.load(fs.readFileSync(fullPath, 'utf8')));
    const doc = touchedFiles.get(file);
    const sub = (doc.subsections || []).find(s => s.slug === subSlug);
    if (!sub) {
      console.warn(`WARN: subsection ${subSlug} not found in ${file}, skipping ${cands.length} entries`);
      continue;
    }
    sub.entries = sub.entries || [];
    for (const c of cands) {
      sub.entries.push(buildEntry(c, c.category.type));
    }
    fileStats[file] = (fileStats[file] || 0) + cands.length;
  }

  for (const [file, doc] of touchedFiles) {
    fs.writeFileSync(path.join(DATA_DIR, file), yaml.dump(doc, { lineWidth: -1, noRefs: true }));
  }

  console.log(`\nAuto-add summary:`);
  console.log(`  Categorized input:    ${categorized.length}`);
  console.log(`  Garbage skipped:      ${garbageSkipped}`);
  console.log(`  Dup of existing:      ${dupExisting}`);
  console.log(`  Dup within batch:     ${dupInBatch}`);
  console.log(`  Net new additions:    ${seenInBatch.size}`);
  console.log('');
  for (const [file, n] of Object.entries(fileStats).sort()) {
    console.log(`  ${file}: +${n}`);
  }
  if (garbageExamples.length) {
    console.log('\nGarbage examples (first 10):');
    for (const g of garbageExamples) console.log(`  - [${g.reason}] ${g.name} (${g.url})`);
  }
}

main();
