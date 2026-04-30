#!/usr/bin/env node
// Re-check 'unreachable' entries with longer timeout + browser UA.
// Many unreachables are slow CDNs (Adobe, Creative Cloud) not dead URLs.

const catalog = require('./lib/catalog');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const TIMEOUT = 30000;
const CONCURRENCY = 6;

async function check(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    let res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA } });
    clearTimeout(t);
    if (res.ok || [401,403,405,429,451,999].includes(res.status)) return { ok: true, code: res.status };
    return { ok: false, code: res.status };
  } catch (e) {
    clearTimeout(t);
    return { ok: false, err: e.message };
  }
}

async function pool(items, worker) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array(Math.min(CONCURRENCY, items.length)).fill(0).map(async () => {
    while (i < items.length) { const n = i++; out[n] = await worker(items[n]); }
  }));
  return out;
}

async function main() {
  const targets = [];
  for (const ie of catalog.iterEntries()) {
    if (ie.entry.url_status === 'unreachable') {
      targets.push({ file: ie.sectionFile, sub: ie.subSlug, entry: ie.entry, chunk: ie.chunk });
    }
  }
  console.log(`Re-checking ${targets.length} unreachable URLs…`);

  const results = await pool(targets, t => check(t.entry.url));
  const revived = [], stillDead = [];
  for (let i = 0; i < targets.length; i++) {
    if (results[i].ok) revived.push({ ...targets[i], code: results[i].code });
    else stillDead.push({ ...targets[i], err: results[i].err, code: results[i].code });
  }
  console.log(`Revived: ${revived.length}`);
  console.log(`Still dead: ${stillDead.length}`);

  // Update entries in place + save touched chunks
  const touched = new Map();
  for (const r of revived) {
    r.entry.url_status = 'ok';
    touched.set(r.chunk._path, r.chunk);
  }
  for (const chunk of touched.values()) catalog.saveChunk(chunk);

  console.log('\nStill-dead after retry:');
  for (const r of stillDead) console.log(`  - ${r.entry.name} | ${r.entry.url} | ${r.code || r.err}`);
}

main();
