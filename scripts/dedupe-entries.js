#!/usr/bin/env node
// Dedupe entries across data/ chunks. Conservative rules only:
//  R1: exact normalized URL match (drop all but best)
//  R2: same lowercase name + same hostname, keep entry with longer/deeper url or more description
//  R3: same name + two YouTube channel URL forms (channel/UC vs @handle) → keep @handle
//  R4: Brand/variant slash-form when plain Brand exists on same host
// Anything ambiguous: report, do not touch.

const catalog = require('./lib/catalog');
const { canonicalUrl } = require('./lib/canonical-url');

const normUrl = canonicalUrl;
function host(u){ try{ return new URL(u).hostname.replace(/^www\./,'').toLowerCase(); }catch(e){ return ''; } }

const EXCLUDE_HOSTS_R2 = new Set([
  'github.com','gitlab.com','bitbucket.org','arxiv.org','itch.io','youtube.com'
]);
function pathDepth(u){ try{ const p = new URL(u).pathname.replace(/\/+$/,''); return p === '' ? 0 : p.split('/').length - 1; }catch(e){ return 99; } }
function score(e){
  let s = 0;
  if(e.url_status === 'ok') s += 50;
  s += Math.max(0, 20 - pathDepth(e.url) * 5);
  try{ if(!new URL(e.url).search) s += 5; }catch(e){}
  s += Math.min(30, (e.description||'').length / 4);
  s += Object.keys(e.tags||{}).length * 3;
  s += (e.readme_tags||[]).length;
  if(e.license) s += 2;
  return s;
}

// Index every entry with a stable address: chunk._path + index in chunk.entries
const all = []; // {chunk, idx, sub, entry, key}
const chunks = new Map(); // path → chunk
for (const c of catalog.iterChunks()) {
  chunks.set(c._path, c);
  c.entries.forEach((e, idx) => {
    all.push({
      chunk: c,
      idx,
      sub: c.subSlug,
      entry: e,
      key: `${c._path}|${idx}`
    });
  });
}

const removals = []; // {chunk, idx, sub, entry, key, reason, keptRef}
const removedSet = new Set();

function pushRemoval(rec, reason, keep) {
  if (removedSet.has(rec.key)) return;
  removedSet.add(rec.key);
  removals.push({ ...rec, reason, keptRef: `${keep.chunk.id}:${keep.entry.name}` });
}

// R1: exact URL dupes
const byUrl = new Map();
for (const r of all) {
  const k = normUrl(r.entry.url);
  if (!k) continue;
  if (!byUrl.has(k)) byUrl.set(k, []);
  byUrl.get(k).push(r);
}
for (const [, arr] of byUrl) {
  if (arr.length < 2) continue;
  arr.sort((a, b) => score(b.entry) - score(a.entry));
  const keep = arr[0];
  for (let i = 1; i < arr.length; i++) pushRemoval(arr[i], 'R1 exact URL dupe', keep);
}

// R2: same name + same host
const byNameHost = new Map();
for (const r of all) {
  if (removedSet.has(r.key)) continue;
  const n = (r.entry.name||'').toLowerCase().trim();
  const h = host(r.entry.url);
  if (!n || !h || EXCLUDE_HOSTS_R2.has(h)) continue;
  const k = n + '||' + h;
  if (!byNameHost.has(k)) byNameHost.set(k, []);
  byNameHost.get(k).push(r);
}
for (const [, arr] of byNameHost) {
  if (arr.length < 2) continue;
  const nm = arr[0].entry.name.toLowerCase();
  if (/^(paper|github|documentation|📄 paper|unreal engine documentation)$/.test(nm)) continue;
  arr.sort((a, b) => score(b.entry) - score(a.entry));
  const keep = arr[0];
  for (let i = 1; i < arr.length; i++) pushRemoval(arr[i], 'R2 same name+host', keep);
}

// R3: youtube channel/UC vs @handle, same chunk-section
const byNameYT = new Map();
for (const r of all) {
  if (removedSet.has(r.key)) continue;
  if (host(r.entry.url) !== 'youtube.com') continue;
  const n = (r.entry.name||'').toLowerCase().trim();
  if (!n) continue;
  if (!byNameYT.has(n)) byNameYT.set(n, []);
  byNameYT.get(n).push(r);
}
for (const [, arr] of byNameYT) {
  if (arr.length < 2) continue;
  const hasHandle = arr.find(r => /\/@/.test(r.entry.url));
  const hasChan = arr.find(r => /\/channel\//.test(r.entry.url));
  if (!hasHandle || !hasChan) continue;
  // Group by (sectionFile + subSlug) — only dedupe within same subsection
  const grouped = new Map();
  for (const r of arr) {
    const g = `${r.chunk.sectionFile}|${r.sub}`;
    if (!grouped.has(g)) grouped.set(g, []);
    grouped.get(g).push(r);
  }
  for (const [, gs] of grouped) {
    if (gs.length < 2) continue;
    const keep = gs.find(r => /\/@/.test(r.entry.url)) || gs[0];
    for (const r of gs) if (r !== keep) pushRemoval(r, 'R3 YT channel/UC vs @handle same sub', keep);
  }
}

// R4: Brand/variant vs Brand root on same host
const rootsByHostName = new Map();
for (const r of all) {
  if (removedSet.has(r.key)) continue;
  const h = host(r.entry.url);
  if (!h || EXCLUDE_HOSTS_R2.has(h)) continue;
  const n = (r.entry.name||'').trim();
  if (!n || /\//.test(n)) continue;
  rootsByHostName.set(h + '||' + n.toLowerCase(), r);
}
for (const r of all) {
  if (removedSet.has(r.key)) continue;
  const h = host(r.entry.url);
  if (!h || EXCLUDE_HOSTS_R2.has(h)) continue;
  const n = (r.entry.name||'').trim();
  const m = n.match(/^([A-Za-z0-9._-]+(?: [A-Za-z0-9._-]+)?)\/(?:free|freebies|lidar|models|hdris|textures|gallery|assets|search)\b/i);
  if (!m) continue;
  const brand = m[1].toLowerCase();
  const root = rootsByHostName.get(h + '||' + brand);
  if (!root || root === r) continue;
  pushRemoval(r, 'R4 brand/variant vs brand root', root);
}

// Report
const mode = process.argv[2] || 'plan';
console.log(`\n=== DEDUPE PLAN (${removals.length} removals) ===\n`);
const byChunk = new Map();
for (const r of removals) {
  if (!byChunk.has(r.chunk.id)) byChunk.set(r.chunk.id, []);
  byChunk.get(r.chunk.id).push(r);
}
for (const id of [...byChunk.keys()].sort()) {
  console.log(`\n${id}:`);
  for (const r of byChunk.get(id)) {
    console.log(`  [${r.reason}] ${r.entry.name}  ${r.entry.url}`);
    console.log(`     → keep ${r.keptRef}`);
  }
}

if (mode !== 'apply') {
  console.log('\n(dry run — pass "apply" to write changes)');
  process.exit(0);
}

// Apply: per-chunk, splice descending indices, saveChunk.
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
