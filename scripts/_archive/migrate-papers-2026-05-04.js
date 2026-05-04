#!/usr/bin/env node
// One-shot migration for spec §9: move research papers in ML for CG into a
// dedicated `papers` subsection at the bottom of the section. Adds `paper`
// tag and `year` field. Idempotent.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const catalog = require('../lib/catalog');

const SECTION_FILE = '09-ai-ml.yml';
const SOURCE_SUB = 'ml-for-cg';
const TARGET_SUB = 'papers';

const VENUE_RX = /\b(ICCV|CVPR|ECCV|NeurIPS|NIPS|ICLR|ICML|SIGGRAPH(?:\s+Asia)?|SIGGRAPH ASIA|TOG|3DV|ICIP|TPAMI|TVCG|WACV|BMVC|AAAI|EUROGRAPHICS|EG|Arxiv)\s+(\d{4})\b/i;
const ARXIV_ID_RX = /arxiv\.org\/(?:abs|pdf)\/(\d{2})(\d{2})\.\d+/i;

function isPaper(entry) {
  const url = (entry.url || '').toLowerCase();
  if (/arxiv\.org/.test(url)) return true;
  if (/openaccess\.thecvf\.com/.test(url)) return true;
  if (/doi\.org/.test(url) && (entry.description || '').match(VENUE_RX)) return true;
  const desc = entry.description || '';
  if (VENUE_RX.test(desc) && /\[(project|code|github|bibtex|paper|🌐|💻|📄)/i.test(desc)) return true;
  return false;
}

function inferYear(entry) {
  const desc = entry.description || '';
  const venueMatch = desc.match(VENUE_RX);
  if (venueMatch) return parseInt(venueMatch[2], 10);
  const arxivMatch = (entry.url || '').match(ARXIV_ID_RX);
  if (arxivMatch) {
    const yy = parseInt(arxivMatch[1], 10);
    return 2000 + yy;
  }
  return null;
}

function ensurePaperTag(entry) {
  if (!entry.tags) entry.tags = {};
  if (!Array.isArray(entry.tags.tech)) entry.tags.tech = entry.tags.tech ? [entry.tags.tech] : [];
  if (!entry.tags.tech.includes('paper')) entry.tags.tech.push('paper');
}

function main() {
  const sectionPath = path.join(catalog.DATA_DIR, SECTION_FILE);
  const section = yaml.load(fs.readFileSync(sectionPath, 'utf8'));

  // 1. Ensure target subsection exists in section yml at the bottom.
  if (!section.subsections.find(s => s.slug === TARGET_SUB)) {
    section.subsections.push({
      slug: TARGET_SUB,
      title: 'Research Papers',
      description: 'Research papers on ML for CG, generative 3D, neural rendering, and related topics. Each entry: title (the plain-English summary), year, and venue/links in the description.',
      chunks: 1
    });
  }

  // 2. Walk source chunks, separate papers from non-papers.
  const sourceFiles = catalog.listChunks();
  const sourceList = [];
  for (const ref of sourceFiles) {
    if (ref.sectionFile !== SECTION_FILE) continue;
    if (ref.subSlug !== SOURCE_SUB) continue;
    sourceList.push(ref);
  }

  const movedEntries = [];
  for (const ref of sourceList) {
    const chunk = catalog.loadChunk(ref.id);
    const keep = [];
    for (const e of chunk.entries) {
      if (isPaper(e)) {
        ensurePaperTag(e);
        const year = inferYear(e);
        if (year && !e.year) e.year = year;
        movedEntries.push(e);
      } else {
        keep.push(e);
      }
    }
    chunk.entries = keep;
    catalog.saveChunk(chunk);
  }

  // 3. Write target chunks (50 per chunk).
  const targetDir = path.join(catalog.DATA_DIR, SECTION_FILE.replace(/\.yml$/, ''), TARGET_SUB);
  fs.mkdirSync(targetDir, { recursive: true });
  // Append-style: load existing target chunks and merge dedupe by URL.
  const existing = [];
  for (const f of fs.readdirSync(targetDir).filter(f => f.endsWith('.yml')).sort()) {
    const raw = yaml.load(fs.readFileSync(path.join(targetDir, f), 'utf8')) || {};
    for (const e of raw.entries || []) existing.push(e);
  }
  const seen = new Set(existing.map(e => (e.url || '').toLowerCase()));
  for (const e of movedEntries) {
    const k = (e.url || '').toLowerCase();
    if (seen.has(k)) continue;
    existing.push(e);
    seen.add(k);
  }
  // Sort by year desc, then name.
  existing.sort((a, b) => {
    const ya = a.year || 0, yb = b.year || 0;
    if (yb !== ya) return yb - ya;
    return (a.name || '').localeCompare(b.name || '');
  });
  // Wipe existing chunk files; rewrite chunked.
  for (const f of fs.readdirSync(targetDir).filter(f => f.endsWith('.yml'))) {
    fs.unlinkSync(path.join(targetDir, f));
  }
  const CAP = 50;
  for (let i = 0, c = 1; i < existing.length; i += CAP, c++) {
    const slice = existing.slice(i, i + CAP);
    const filename = `${String(c).padStart(2, '0')}-${TARGET_SUB}.yml`;
    fs.writeFileSync(
      path.join(targetDir, filename),
      yaml.dump({ entries: slice }, { lineWidth: -1, noRefs: true })
    );
  }
  // Update chunk count in section yml.
  const targetSub = section.subsections.find(s => s.slug === TARGET_SUB);
  targetSub.chunks = Math.max(1, Math.ceil(existing.length / CAP));

  // 4. Save section yml (with new subsection).
  fs.writeFileSync(sectionPath, yaml.dump(section, { lineWidth: -1, noRefs: true }));

  console.log(`Migrated ${movedEntries.length} paper entries → ${TARGET_SUB} (${existing.length} total).`);
}

main();
