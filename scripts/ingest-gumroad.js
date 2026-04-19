#!/usr/bin/env node
// Pull new products from Gumroad creators on a watchlist.
// Gumroad exposes per-creator RSS at https://<creator>.gumroad.com/feed/ (sometimes /rss).
//
// Watchlist: _maintenance/freshness/watchlist-gumroad.json — list of creator subdomains.
// Seed: extracts *.gumroad.com subdomains from the catalog.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const { loadCatalogUrls, loadSeen, saveSeen, writeReport, FRESH_DIR, normalize } = require('./lib/ingest-core');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36';

async function fetchProducts(subdomain) {
  // Gumroad killed RSS. Scrape the creator homepage for `/l/<slug>` product links.
  const url = `https://${subdomain}.gumroad.com/`;
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  // Gumroad Inertia.js ships JSON HTML-entity-encoded inside data-page="..."
  // Decode common entities so we can regex the product JSON.
  const decoded = html
    .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&apos;/g, "'");

  const out = [];
  const paths = new Set();
  const pathRe = /\/l\/([A-Za-z0-9_-]{3,40})/g;
  let m;
  while ((m = pathRe.exec(decoded)) !== null) paths.add(m[1]);

  for (const slug of paths) {
    // Gumroad JSON: "permalink":"<slug>","name":"<title>"
    const nameRe = new RegExp(`"permalink":"${slug}","name":"([^"\\\\]{3,120}(?:\\\\.[^"\\\\]*)*)"`);
    const nm = decoded.match(nameRe);
    let title = nm ? nm[1] : null;
    if (title) title = title.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\"/g, '"');
    out.push({ url: `https://${subdomain}.gumroad.com/l/${slug}`, title: title || `/l/${slug}` });
  }
  return out;
}

const DATA_DIR = path.join(__dirname, '..', 'data');
const WATCH_PATH = path.join(FRESH_DIR, 'watchlist-gumroad.json');

async function seed() {
  const sections = yaml.load(fs.readFileSync(path.join(DATA_DIR, 'sections.yml'), 'utf8'));
  const creators = new Set();
  for (const m of sections.sections) {
    const doc = yaml.load(fs.readFileSync(path.join(DATA_DIR, m.file), 'utf8'));
    for (const sub of doc.subsections || []) for (const e of sub.entries || []) {
      if (e.deprecated) continue;
      const m2 = e.url.match(/^https?:\/\/([^\/]+)\.gumroad\.com/i);
      if (m2) creators.add(m2[1].toLowerCase());
    }
  }
  const existing = fs.existsSync(WATCH_PATH) ? JSON.parse(fs.readFileSync(WATCH_PATH, 'utf8')) : { creators: [] };
  const have = new Set(existing.creators.map(c => c.subdomain));
  const out = [...existing.creators];
  let added = 0;
  for (const c of creators) if (!have.has(c)) { out.push({ subdomain: c, note: null }); added++; }
  fs.writeFileSync(WATCH_PATH, JSON.stringify({ updated_at: new Date().toISOString().slice(0, 10), creators: out }, null, 2));
  console.log(`Seeded ${added} new creators. Total: ${out.length}`);
  console.log(`Watchlist → ${WATCH_PATH}`);
}

async function runIngest() {
  if (!fs.existsSync(WATCH_PATH)) { console.log('Run with --seed first.'); process.exit(0); }
  const { creators } = JSON.parse(fs.readFileSync(WATCH_PATH, 'utf8'));
  console.log(`Polling ${creators.length} Gumroad creators…`);

  const catalog = loadCatalogUrls();
  const seen = loadSeen('seen-gumroad.json');

  const candidates = [];
  const errors = [];
  for (const c of creators) {
    try {
      const products = await fetchProducts(c.subdomain);
      for (const p of products) {
        const n = normalize(p.url);
        if (catalog.has(n) || seen.urls.has(n)) continue;
        candidates.push({ source: `gumroad:${c.subdomain}`, title: p.title, url: p.url });
        seen.urls.add(n);
      }
    } catch (e) {
      errors.push({ creator: c.subdomain, err: e.message });
    }
  }

  saveSeen('seen-gumroad.json', seen.urls);
  writeReport('ingest-gumroad.json', {
    generated_at: new Date().toISOString().slice(0, 10),
    creators_polled: creators.length,
    count: candidates.length,
    candidates,
    errors
  });
  console.log(`Gumroad candidates: ${candidates.length}, errors: ${errors.length}`);
}

async function main() {
  if (process.argv.includes('--seed')) await seed();
  else await runIngest();
}
main().catch(e => { console.error(e); process.exit(1); });
