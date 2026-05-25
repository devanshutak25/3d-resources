#!/usr/bin/env node
// Generate llms.txt + llms-full.txt for AI / LLM crawlers.
// Spec: https://llmstxt.org — supports a concise llms.txt and an optional
// full llms-full.txt. Crawlers can fetch either.
//
// Reads data/ via catalog directly so we have descriptions and dedupe by URL.
// Skips deprecated entries.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const catalog = require('./lib/catalog');

const SITE_URL = 'https://3d.devanshutak.xyz';
const OUT_DIR = path.join(__dirname, '..', '_site');
const PICKS_PER_SECTION = 12; // for thin llms.txt

const TOPICS = [
  'Blender', 'Houdini', 'Maya', '3ds Max', 'Cinema 4D',
  'Unreal Engine', 'Unity', 'Godot',
  'USD', 'Nuke', 'Substance', 'Marvelous Designer', 'ZBrush',
  'RealityCapture', 'ComfyUI', 'Stable Diffusion',
  'Gaussian Splatting', 'NeRF', 'photogrammetry',
  'PBR', 'HDRI', 'motion capture', 'virtual production', 'ray tracing'
];

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

function getLastUpdated() {
  try {
    const out = execSync('git log -1 --format=%cs -- data/', {
      cwd: path.join(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString().trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(out)) return out;
  } catch (_) { /* fall through */ }
  return new Date().toISOString().slice(0, 10);
}

// Collect non-deprecated entries, grouped by sectionFile then by subSlug,
// in chunk-iteration order, deduped by URL globally.
// Returns Map<sectionFile, Map<subSlug, entries[]>>.
function collectPerSubsection() {
  const bySection = new Map();
  const seenGlobally = new Map();
  for (const chunk of catalog.iterChunks()) {
    if (!bySection.has(chunk.sectionFile)) bySection.set(chunk.sectionFile, new Map());
    const subMap = bySection.get(chunk.sectionFile);
    if (!subMap.has(chunk.subSlug)) subMap.set(chunk.subSlug, []);
    for (const e of chunk.entries) {
      if (e.deprecated) continue;
      if (!e.url || !e.name) continue;
      const k = e.url.toLowerCase();
      if (seenGlobally.has(k)) continue;
      seenGlobally.set(k, chunk.sectionFile);
      subMap.get(chunk.subSlug).push(e);
    }
  }
  return bySection;
}

function flattenSection(subMap) {
  if (!subMap) return [];
  const out = [];
  for (const entries of subMap.values()) out.push(...entries);
  return out;
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
    '> The biggest, most complete index of free and paid 3D resources: 3,000+ textures, HDRIs, models, tutorials, render engines, USD, VFX, motion graphics, game development, and AI/ML for CG. Maintained by Devanshu Tak.',
    ''
  ];
}

function buildIntro(opts) {
  const { lastUpdated, totalEntries, sectionCount, includeFullPointer } = opts;
  const lines = [
    `Interactive site: ${SITE_URL}`,
    'Repo: https://github.com/devanshutak25/3d-resources',
    'License: CC0-1.0 (data and curation are public domain)',
    `Last updated: ${lastUpdated}`,
    '',
    `This catalog indexes ${totalEntries.toLocaleString()} hand-curated resources across ${sectionCount} sections covering the full 3D, VFX, motion graphics, game development, and AI-for-CG pipeline. Each section is split into subsections (asset type, DCC, discipline). Entries are deduped by URL and tagged with license, platform, and workflow stage. Source data lives in YAML on GitHub; the site, this feed, and an Atom feed are all generated from it.`,
    '',
    `Topics covered: ${TOPICS.join(', ')}.`,
    '',
    'Format: each bullet is `[name](url): one-line description`. The thin file (this one) lists curated picks per section; the full file lists every entry grouped by subsection.',
    ''
  ];
  if (includeFullPointer) {
    lines.push(`Full index: ${SITE_URL}/llms-full.txt`);
    lines.push('');
  }
  return lines;
}

function buildThin(sectionsFile, bySection, lastUpdated) {
  const totalEntries = sumEntries(bySection);
  const sectionCount = countSectionsWithEntries(sectionsFile, bySection);
  const lines = [
    ...buildHeader(),
    ...buildIntro({ lastUpdated, totalEntries, sectionCount, includeFullPointer: true })
  ];

  for (const meta of sectionsFile.sections) {
    const subMap = bySection.get(meta.file);
    const entries = flattenSection(subMap);
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

function buildFull(sectionsFile, bySection, lastUpdated) {
  const totalEntries = sumEntries(bySection);
  const sectionCount = countSectionsWithEntries(sectionsFile, bySection);
  const lines = [
    ...buildHeader(),
    ...buildIntro({ lastUpdated, totalEntries, sectionCount, includeFullPointer: false })
  ];

  for (const meta of sectionsFile.sections) {
    const subMap = bySection.get(meta.file);
    if (!subMap || !subMap.size) continue;

    const sectionMeta = catalog.loadSection(meta.file);
    const subsections = sectionMeta.subsections || [];

    lines.push(`## ${meta.title}`);
    lines.push('');
    if (meta.description) {
      lines.push(`> ${meta.description}`);
      lines.push('');
    }

    for (const sub of subsections) {
      const entries = subMap.get(sub.slug) || [];
      if (!entries.length) continue;
      lines.push(`### ${sub.title}`);
      lines.push('');
      if (sub.description) {
        lines.push(`> ${sub.description}`);
        lines.push('');
      }
      for (const e of entries) lines.push(bulletFor(e, 180));
      lines.push('');
    }
  }
  return lines.join('\n');
}

function sumEntries(bySection) {
  let n = 0;
  for (const subMap of bySection.values()) {
    for (const entries of subMap.values()) n += entries.length;
  }
  return n;
}

function countSectionsWithEntries(sectionsFile, bySection) {
  let n = 0;
  for (const meta of sectionsFile.sections) {
    const subMap = bySection.get(meta.file);
    if (subMap && subMap.size) n++;
  }
  return n;
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
  const bySection = collectPerSubsection();
  const lastUpdated = getLastUpdated();
  writeOut('llms.txt', buildThin(sectionsFile, bySection, lastUpdated));
  writeOut('llms-full.txt', buildFull(sectionsFile, bySection, lastUpdated));
}

main();
