#!/usr/bin/env node
// Normalize every YouTube URL in catalog to its canonical channel URL.
// Groups entries by channel_id, keeps the best-quality one per channel,
// deletes the rest. Routes non-youtube-* DCC subsections to youtube-* channels.

const fs = require('fs');
const path = require('path');
const catalog = require('./lib/catalog');

const CACHE = path.join(__dirname, '..', '_maintenance', 'freshness', 'yt-resolve-cache.json');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36';
const CONCURRENCY = 6;

// Source subsection → target youtube-* subsection (when we have a DCC channel bucket)
const ROUTE = {
  // Blender
  'blender-tutorials':            { file: '11-learning-community.yml', sub: 'youtube-blender' },
  'blender-plugins-addons':       { file: '11-learning-community.yml', sub: 'youtube-blender' },
  // Houdini
  'houdini-getting-started':      { file: '11-learning-community.yml', sub: 'youtube-houdini' },
  'houdini-essential-learning':   { file: '11-learning-community.yml', sub: 'youtube-houdini' },
  'houdini-vex-coding':           { file: '11-learning-community.yml', sub: 'youtube-houdini' },
  'houdini-fx-simulations':       { file: '11-learning-community.yml', sub: 'youtube-houdini' },
  'houdini-rigging-animation':    { file: '11-learning-community.yml', sub: 'youtube-houdini' },
  'houdini-grooming':             { file: '11-learning-community.yml', sub: 'youtube-houdini' },
  'houdini-more-tutorials':       { file: '11-learning-community.yml', sub: 'youtube-houdini' },
  'houdini-plugins-tools':        { file: '11-learning-community.yml', sub: 'youtube-houdini' },
  'houdini-courses-rebelway':     { file: '11-learning-community.yml', sub: 'youtube-houdini' },
  // Cinema 4D / motion
  'cinema-4d-learning':           { file: '11-learning-community.yml', sub: 'youtube-motion-c4d' },
  'cinema-4d-plugins':            { file: '11-learning-community.yml', sub: 'youtube-motion-c4d' },
  'cinema-4d-tips-workflows':     { file: '11-learning-community.yml', sub: 'youtube-motion-c4d' },
  'motion-graphics-inspiration':  { file: '11-learning-community.yml', sub: 'youtube-motion-c4d' },
  'motion-graphics-courses':      { file: '11-learning-community.yml', sub: 'youtube-motion-c4d' },
  // Sculpt/characters
  'concept-art-channels':         { file: '11-learning-community.yml', sub: 'youtube-sculpting-characters' },
  'drawing-painting-3d':          { file: '11-learning-community.yml', sub: 'youtube-sculpting-characters' }
};

function isYtUrl(u) { return /(^|\/\/)(www\.)?(youtube\.com|youtu\.be)/.test(u); }
function isChannelUrl(u) {
  return /\/channel\/UC[\w-]{22}/.test(u) ||
         /youtube\.com\/@[\w.-]{2,}/.test(u) ||
         /youtube\.com\/c\/[\w.-]+/.test(u) ||
         /youtube\.com\/user\/[\w.-]+/.test(u) ||
         /youtube\.com\/feeds\/videos\.xml\?channel_id=/.test(u);
}

function loadCache() { return fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {}; }
function saveCache(c) { fs.writeFileSync(CACHE, JSON.stringify(c, null, 2)); }

async function resolveToChannel(url, cache) {
  if (cache[url]) return cache[url];
  // Direct channel_id parse
  const direct = url.match(/\/channel\/(UC[\w-]{22})/);
  if (direct) {
    const out = { channel_id: direct[1], handle: null, name: null, canonical: `https://www.youtube.com/channel/${direct[1]}` };
    cache[url] = out; return out;
  }
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    if (!res.ok) { cache[url] = { error: `HTTP ${res.status}` }; return cache[url]; }
    const html = await res.text();
    const id = (html.match(/"channelId":"(UC[\w-]{22})"/) || html.match(/"externalId":"(UC[\w-]{22})"/) || [])[1];
    const handleMatch = html.match(/"canonicalBaseUrl":"\/(@[\w.-]+)"/);
    const nameMatch = html.match(/"author":"([^"]+)"/) || html.match(/<meta name="title" content="([^"]+)"/);
    if (!id) { cache[url] = { error: 'no-channel-id' }; return cache[url]; }
    const handle = handleMatch ? handleMatch[1] : null;
    const name = nameMatch ? nameMatch[1] : null;
    const canonical = handle ? `https://www.youtube.com/${handle}` : `https://www.youtube.com/channel/${id}`;
    const out = { channel_id: id, handle, name, canonical };
    cache[url] = out; return out;
  } catch (e) {
    cache[url] = { error: e.message };
    return cache[url];
  }
}

async function pool(items, worker) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array(Math.min(CONCURRENCY, items.length)).fill(0).map(async () => {
    while (i < items.length) { const n = i++; out[n] = await worker(items[n], n); }
  }));
  return out;
}

function qualityScore(entry) {
  const u = entry.url;
  if (/\/@[\w.-]+/.test(u)) return 5;
  if (/\/channel\/UC/.test(u)) return 4;
  if (/\/c\//.test(u)) return 3;
  if (/\/user\//.test(u)) return 2;
  if (/\/playlist/.test(u)) return 1;
  return 0; // watch / shorts / youtu.be
}

async function main() {
  // Map sectionFile → section slug for catalog.appendEntry routing
  const fileToSlug = new Map();
  for (const meta of catalog.loadSections().sections) {
    fileToSlug.set(meta.file, catalog.loadSection(meta.file).slug);
  }

  // Collect every chunk + every YouTube entry with its location
  const allChunks = [...catalog.iterChunks()];
  const chunkByPath = new Map(allChunks.map(c => [c._path, c]));
  const targets = [];
  for (const c of allChunks) {
    for (const e of c.entries) {
      if (isYtUrl(e.url) && !e.deprecated) targets.push({ file: c.sectionFile, sub: c.subSlug, entry: e, chunk: c });
    }
  }
  console.log(`Found ${targets.length} YouTube entries`);

  const cache = loadCache();
  let done = 0;
  const resolved = await pool(targets, async t => {
    const r = await resolveToChannel(t.entry.url, cache);
    if (++done % 30 === 0) { console.log(`  resolved ${done}/${targets.length}`); saveCache(cache); }
    return r;
  });
  saveCache(cache);

  // Group by channel_id
  const groups = new Map(); // channel_id → [{target, resolved}]
  const unresolved = [];
  for (let i = 0; i < targets.length; i++) {
    const r = resolved[i];
    if (!r || r.error) { unresolved.push({ t: targets[i], err: r?.error || 'unknown' }); continue; }
    if (!groups.has(r.channel_id)) groups.set(r.channel_id, []);
    groups.get(r.channel_id).push({ t: targets[i], r });
  }
  console.log(`Groups: ${groups.size}, unresolved: ${unresolved.length}`);

  // For each group, pick canonical survivor; delete rest.
  let deletedAsDup = 0, rewritten = 0, routed = 0;
  const toDelete = new Set();   // track by (file, sub, url)
  const rewrites = [];          // {file, sub, url, newUrl, newEntryType, newTargetFile, newTargetSub}

  for (const [cid, items] of groups) {
    // Sort by quality desc; pick highest
    items.sort((a, b) => qualityScore(b.t.entry) - qualityScore(a.t.entry));
    const winner = items[0];
    // Others → mark for deletion
    for (const it of items.slice(1)) {
      toDelete.add(`${it.t.file}||${it.t.sub}||${it.t.entry.url}`);
      deletedAsDup++;
    }
    // Winner: if quality < 4 (not channel-style), rewrite URL
    const wq = qualityScore(winner.t.entry);
    const canonical = winner.r.canonical;
    const target = ROUTE[winner.t.sub];
    const needsRewrite = wq < 4 && winner.t.entry.url !== canonical;
    const needsRoute = !!target && !(winner.t.file === target.file && winner.t.sub === target.sub);
    if (needsRewrite || needsRoute) {
      rewrites.push({
        oldFile: winner.t.file, oldSub: winner.t.sub, oldUrl: winner.t.entry.url,
        newUrl: canonical,
        newFile: needsRoute ? target.file : winner.t.file,
        newSub:  needsRoute ? target.sub  : winner.t.sub,
        entryType: 'channel',
        name: winner.r.name || winner.t.entry.name
      });
      if (needsRewrite) rewritten++;
      if (needsRoute) routed++;
    }
  }

  // Apply deletions across all chunks
  const touched = new Set();
  for (const c of allChunks) {
    const before = c.entries.length;
    c.entries = c.entries.filter(e => !toDelete.has(`${c.sectionFile}||${c.subSlug}||${e.url}`));
    if (c.entries.length !== before) touched.add(c._path);
  }

  // Apply rewrites + reroutes
  const moved = []; // {entry, newFile, newSub} — append after splice from sources
  for (const rw of rewrites) {
    // Find current chunk holding the entry
    let srcChunk = null, idx = -1;
    for (const c of allChunks) {
      if (c.sectionFile !== rw.oldFile || c.subSlug !== rw.oldSub) continue;
      idx = c.entries.findIndex(e => e.url === rw.oldUrl);
      if (idx >= 0) { srcChunk = c; break; }
    }
    if (!srcChunk) continue;
    const entry = srcChunk.entries[idx];
    entry.url = rw.newUrl;
    entry.entry_type = 'channel';
    if (rw.name && entry.name.length < rw.name.length + 10) entry.name = rw.name;

    if (rw.oldFile !== rw.newFile || rw.oldSub !== rw.newSub) {
      srcChunk.entries.splice(idx, 1);
      touched.add(srcChunk._path);
      moved.push({ entry, newFile: rw.newFile, newSub: rw.newSub });
    } else {
      touched.add(srcChunk._path);
    }
  }

  // Save chunks first so appendEntry sees up-to-date files
  for (const p of touched) catalog.saveChunk(chunkByPath.get(p));

  // Append moved entries (with destination dedupe)
  const destExisting = new Set();
  for (const c of catalog.iterChunks()) {
    for (const e of c.entries) destExisting.add(`${c.sectionFile}||${c.subSlug}||${e.url.toLowerCase().replace(/\/$/, '')}`);
  }
  for (const mv of moved) {
    const k = `${mv.newFile}||${mv.newSub}||${mv.entry.url.toLowerCase().replace(/\/$/, '')}`;
    if (destExisting.has(k)) continue;
    destExisting.add(k);
    const targetSlug = fileToSlug.get(mv.newFile);
    if (!targetSlug) continue;
    catalog.appendEntry(targetSlug, mv.newSub, mv.entry);
  }

  // Final dedupe pass by exact URL across whole catalog
  const seen = new Set();
  let postDup = 0;
  const postTouched = new Set();
  for (const c of catalog.iterChunks()) {
    const before = c.entries.length;
    c.entries = c.entries.filter(e => {
      const k = e.url.toLowerCase().replace(/\/$/, '');
      if (seen.has(k)) { postDup++; return false; }
      seen.add(k); return true;
    });
    if (c.entries.length !== before) postTouched.add(c);
  }
  for (const c of postTouched) catalog.saveChunk(c);

  console.log(`\nGroups processed:        ${groups.size}`);
  console.log(`Deleted as dup:          ${deletedAsDup}`);
  console.log(`URLs rewritten:          ${rewritten}`);
  console.log(`Routed to youtube-*:     ${routed}`);
  console.log(`Post-dedup collapse:     ${postDup}`);
  console.log(`Unresolved (kept as-is): ${unresolved.length}`);
  if (unresolved.length) {
    console.log('\nUnresolved examples (first 5):');
    for (const u of unresolved.slice(0, 5)) console.log(`  ${u.err}  ${u.t.entry.url}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
