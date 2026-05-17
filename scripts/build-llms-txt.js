#!/usr/bin/env node
// Generate llms.txt + llms-full.txt for AI / LLM crawlers.
// Spec: https://llmstxt.org — supports a concise llms.txt and an optional
// comprehensive llms-full.txt. Crawlers can fetch either.
//
// Reads data/ via catalog directly so we have descriptions and dedupe by URL.
// Skips deprecated entries.

const fs = require('fs');
const path = require('path');
const catalog = require('./lib/catalog');

const SITE_URL = 'https://3d.devanshutak.xyz';
const OUT_DIR = path.join(__dirname, '..', '_site');
const PICKS_PER_SECTION = 6; // for thin llms.txt

function clean(s) {
  if (!s) return '';
  return String(s)
    .replace(/<[^>]+>/g, '')
    .replace(/!\[\]\[[\w-]+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(s, n) {
  if (!s || s.length <= n) return s;
  const cut = s.slice(0, n);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

// Collect non-deprecated entries per section, in chunk-iteration order,
// deduped by URL. Returns Map<sectionFile, entries[]>.
function collectPerSection() {
  const bySection = new Map();
  const seenGlobally = new Map(); // url -> first sectionFile (defensive)
  for (const chunk of catalog.iterChunks()) {
    if (!bySection.has(chunk.sectionFile)) bySection.set(chunk.sectionFile, []);
    for (const e of chunk.entries) {
      if (e.deprecated) continue;
      if (!e.url || !e.name) continue;
      const k = e.url.toLowerCase();
      if (seenGlobally.has(k)) continue;
      seenGlobally.set(k, chunk.sectionFile);
      bySection.get(chunk.sectionFile).push(e);
    }
  }
  return bySection;
}

// Featured-name + alpha fallback, mirrors render.js lite mode picks logic.
function pickTop(meta, entries) {
  const featured = (meta.featured || []).map(n => n.toLowerCase());
  const picked = [];
  const used = new Set();

  for (const want of featured) {
    const hit = entries.find(e => {
      const url = (e.url || '').toLowerCase();
      if (used.has(url)) return false;
      const name = String(e.name || '').toLowerCase();
      return name === want || name.includes(want);
    });
    if (hit) {
      picked.push(hit);
      used.add((hit.url || '').toLowerCase());
    }
  }

  const remaining = entries.filter(e => !used.has((e.url || '').toLowerCase()));
  const sorted = [...remaining].sort((a, b) => {
    const aSw = a.entry_type === 'software' ? 0 : 1;
    const bSw = b.entry_type === 'software' ? 0 : 1;
    if (aSw !== bSw) return aSw - bSw;
    return String(a.name || '').localeCompare(String(b.name || ''), 'en', { sensitivity: 'base' });
  });

  for (const e of sorted) {
    if (picked.length >= PICKS_PER_SECTION) break;
    picked.push(e);
  }
  return picked;
}

function bulletFor(e, descLen) {
  const name = clean(e.name) || '(unnamed)';
  const desc = truncate(clean(e.description || ''), descLen);
  const tail = desc ? `: ${desc}` : '';
  return `- [${name}](${e.url})${tail}`;
}

function buildHeader() {
  return [
    '# 3D Resources',
    '',
    '> Curated hub of 3,000+ free and paid 3D resources — textures, HDRIs, models, tutorials, render engines, USD, VFX, motion graphics, game development, and AI/ML for CG. Maintained by Devanshu Tak.',
    '',
    `Interactive site: ${SITE_URL}`,
    'Repo: https://github.com/devanshutak25/3d-resources',
    'License: CC0-1.0 (data and curation are public domain)',
    ''
  ];
}

function buildThin(sectionsFile, bySection) {
  const lines = buildHeader();
  lines.push(`Comprehensive index: ${SITE_URL}/llms-full.txt`);
  lines.push('');

  for (const meta of sectionsFile.sections) {
    const entries = bySection.get(meta.file) || [];
    if (!entries.length) continue;
    const picks = pickTop(meta, entries);
    lines.push(`## ${meta.title}`);
    lines.push('');
    if (meta.description) {
      lines.push(`> ${meta.description}`);
      lines.push('');
    }
    for (const e of picks) lines.push(bulletFor(e, 140));
    lines.push('');
    lines.push(`Full section (${entries.length} entries): ${SITE_URL}/sections/${meta.slug}/`);
    lines.push('');
  }
  return lines.join('\n');
}

function buildFull(sectionsFile, bySection) {
  const lines = buildHeader();

  for (const meta of sectionsFile.sections) {
    const entries = bySection.get(meta.file) || [];
    if (!entries.length) continue;
    lines.push(`## ${meta.title}`);
    lines.push('');
    if (meta.description) {
      lines.push(`> ${meta.description}`);
      lines.push('');
    }
    for (const e of entries) lines.push(bulletFor(e, 180));
    lines.push('');
  }
  return lines.join('\n');
}

function writeOut(filename, content) {
  const outPath = path.join(OUT_DIR, filename);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, content);
  const sizeKB = (Buffer.byteLength(content, 'utf8') / 1024).toFixed(1);
  console.log(`Wrote ${filename} (${sizeKB} KB)`);
}

function main() {
  const sectionsFile = catalog.loadSections();
  const bySection = collectPerSection();
  writeOut('llms.txt', buildThin(sectionsFile, bySection));
  writeOut('llms-full.txt', buildFull(sectionsFile, bySection));
}

main();
