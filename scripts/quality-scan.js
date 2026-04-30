#!/usr/bin/env node
// Comprehensive quality scan across data/ chunks.
// Reports: fuzzy dupes, broken descriptions, generic names, missing tags.
// Modes: scan (report only), fix-desc, fix-names, dedupe-fuzzy.

const catalog = require('./lib/catalog');
const mode = process.argv[2] || 'scan';

function host(u){ try{ return new URL(u).hostname.replace(/^www\./,'').toLowerCase(); }catch(e){ return ''; } }
function normName(n){ return (n||'').toLowerCase().replace(/[^a-z0-9]+/g,''); }

const all = []; // {chunk, idx, sub, entry, key}
const chunks = new Map();
for (const c of catalog.iterChunks()) {
  chunks.set(c._path, c);
  c.entries.forEach((e, idx) => {
    all.push({ chunk: c, idx, sub: c.subSlug, entry: e, key: `${c._path}|${idx}`, file: c.sectionFile });
  });
}

function saveTouched(set) {
  for (const p of set) catalog.saveChunk(chunks.get(p));
}

// --- FUZZY DUPES ---
const fuzzyDupes = [];
const byHostNorm = new Map();
for (const r of all) {
  const h = host(r.entry.url);
  const n = normName(r.entry.name);
  if (!h || !n) continue;
  const k = h + '||' + n;
  if (!byHostNorm.has(k)) byHostNorm.set(k, []);
  byHostNorm.get(k).push(r);
}
const EXCLUDE_FUZZY = new Set(['github.com','gitlab.com','bitbucket.org','arxiv.org','itch.io','youtube.com']);
for (const [k, arr] of byHostNorm) {
  if (arr.length < 2) continue;
  if (EXCLUDE_FUZZY.has(k.split('||')[0])) continue;
  fuzzyDupes.push(arr);
}

// --- BROKEN DESCRIPTIONS ---
const brokenDesc = [];
for (const r of all) {
  const d = r.entry.description || '';
  if (!d) continue;
  if (/^[,;:.\]\)]/.test(d.trim())) brokenDesc.push({ ...r, reason: 'starts-with-punct' });
  else if (d.trim().length < 8 && d.trim() !== 'Free') brokenDesc.push({ ...r, reason: 'too-short' });
  else if (/\.\.\.$|…$/.test(d.trim()) && d.length < 40) brokenDesc.push({ ...r, reason: 'truncated' });
}

// --- GENERIC NAMES ---
const genericNames = [];
const GENERIC_PATTERNS = [
  /^📄 paper$/i, /^github$/i, /^unreal engine documentation$/i,
  /^documentation$/i, /^home$/i, /^index$/i, /^readme$/i,
  /^untitled$/i, /^paper$/i, /^📺 (video|paper|link)$/i,
  /^📄 (video|link)$/i, /^http/i, /^www\./i,
];
for (const r of all) {
  const n = (r.entry.name || '').trim();
  if (!n) { genericNames.push({ ...r, reason: 'empty' }); continue; }
  for (const p of GENERIC_PATTERNS) {
    if (p.test(n)) { genericNames.push({ ...r, reason: 'matches ' + p }); break; }
  }
}

// --- MISSING TAGS ---
const missingTags = [];
for (const r of all) {
  const t = r.entry.tags;
  if (!t || (typeof t === 'object' && Object.keys(t).length === 0)) missingTags.push(r);
}

if (mode === 'scan') {
  console.log(`\n=== FUZZY DUPES (same host + normalized name): ${fuzzyDupes.length} groups ===`);
  for (const arr of fuzzyDupes.slice(0, 50)) {
    console.log(`\n  "${arr[0].entry.name}" on ${host(arr[0].entry.url)}`);
    for (const r of arr) console.log(`    ${r.chunk.id}: ${r.entry.url}`);
  }
  console.log(`\n=== BROKEN DESCRIPTIONS: ${brokenDesc.length} ===`);
  for (const r of brokenDesc.slice(0, 30)) {
    console.log(`  [${r.reason}] ${r.chunk.id}: ${r.entry.name}`);
    console.log(`     desc: ${JSON.stringify(r.entry.description).slice(0,120)}`);
  }
  if (brokenDesc.length > 30) console.log(`  ... +${brokenDesc.length-30} more`);
  console.log(`\n=== GENERIC NAMES: ${genericNames.length} ===`);
  const byReason = {};
  for (const r of genericNames) byReason[r.reason] = (byReason[r.reason]||0) + 1;
  for (const [k, v] of Object.entries(byReason)) console.log(`  ${k}: ${v}`);
  console.log(`\n=== MISSING TAGS: ${missingTags.length} (of ${all.length})`);
  process.exit(0);
}

if (mode === 'fix-desc') {
  let fixed = 0;
  const touched = new Set();
  for (const r of brokenDesc) {
    const d = (r.entry.description || '').trim();
    let cleaned = d.replace(/^[,;:.\]\)\s]+/, '').replace(/[.…]+$/, '');
    if (cleaned.length < 8) delete r.chunk.entries[r.idx].description;
    else r.chunk.entries[r.idx].description = cleaned;
    touched.add(r.chunk._path);
    fixed++;
  }
  saveTouched(touched);
  console.log(`Fixed ${fixed} broken descriptions.`);
  process.exit(0);
}

if (mode === 'fix-names') {
  function titleFromUrl(u) {
    try {
      const x = new URL(u);
      if (/arxiv\.org/.test(x.hostname)) {
        const m = x.pathname.match(/(\d{4}\.\d{4,5})/);
        if (m) return `Arxiv Paper ${m[1]}`;
      }
      if (/github\.com/.test(x.hostname)) {
        const parts = x.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) return `${parts[1]} (${parts[0]})`;
        if (parts.length === 1) return `GitHub: ${parts[0]}`;
      }
      if (/epicgames\.com/.test(x.hostname)) {
        const parts = x.pathname.split('/').filter(Boolean);
        const slug = parts[parts.length - 1] || parts[parts.length - 2] || '';
        const pretty = slug.replace(/-in-unreal-engine|-for-unreal-engine/g,'').replace(/-/g,' ');
        if (pretty) return `Unreal Docs: ${pretty.replace(/\b\w/g, c => c.toUpperCase())}`;
      }
      const parts = x.pathname.split('/').filter(Boolean);
      const slug = parts[parts.length - 1] || x.hostname;
      return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    } catch (e) { return null; }
  }
  let renamed = 0;
  const touched = new Set();
  for (const r of genericNames) {
    if (r.reason === 'empty') continue;
    const t = titleFromUrl(r.entry.url);
    if (!t) continue;
    r.chunk.entries[r.idx].name = t;
    touched.add(r.chunk._path);
    renamed++;
  }
  saveTouched(touched);
  console.log(`Renamed ${renamed} generic names.`);
  process.exit(0);
}

if (mode === 'dedupe-fuzzy') {
  function score(e) {
    let s = 0;
    if (e.url_status === 'ok') s += 50;
    s += (e.description||'').length / 4;
    s += Object.keys(e.tags||{}).length * 3;
    s += (e.readme_tags||[]).length;
    if (e.license) s += 2;
    try { const p = new URL(e.url).pathname.replace(/\/+$/,''); s += Math.max(0, 20 - (p === '' ? 0 : p.split('/').length-1) * 5); } catch (e) {}
    return s;
  }
  const removals = [];
  for (const arr of fuzzyDupes) {
    arr.sort((a, b) => score(b.entry) - score(a.entry));
    const keep = arr[0];
    for (let i = 1; i < arr.length; i++) {
      removals.push({ ...arr[i], keptRef: `${keep.chunk.id}:${keep.entry.url}` });
    }
  }
  console.log(`\n=== FUZZY DEDUPE PLAN: ${removals.length} removals ===`);
  const byChunk = new Map();
  for (const r of removals) {
    if (!byChunk.has(r.chunk.id)) byChunk.set(r.chunk.id, []);
    byChunk.get(r.chunk.id).push(r);
  }
  for (const id of [...byChunk.keys()].sort()) {
    console.log(`\n${id}:`);
    for (const r of byChunk.get(id)) {
      console.log(`  drop: ${r.entry.name}  ${r.entry.url}`);
      console.log(`   keep: ${r.keptRef}`);
    }
  }
  if (process.argv[3] !== 'apply') {
    console.log('\n(pass "apply" to write)');
    process.exit(0);
  }
  const idxByChunk = new Map();
  for (const r of removals) {
    if (!idxByChunk.has(r.chunk._path)) idxByChunk.set(r.chunk._path, []);
    idxByChunk.get(r.chunk._path).push(r.idx);
  }
  for (const [chunkPath, idxs] of idxByChunk) {
    const chunk = chunks.get(chunkPath);
    idxs.sort((a, b) => b - a);
    for (const i of idxs) chunk.entries.splice(i, 1);
    catalog.saveChunk(chunk);
  }
  console.log('\n✓ applied.');
}
