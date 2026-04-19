#!/usr/bin/env node
// Pull new posts from 80 Level (industry news, tool announcements, interviews).

const { fetchFeed } = require('./lib/rss');
const { normalize, loadCatalogUrls, loadSeen, saveSeen, writeReport } = require('./lib/ingest-core');

const FEED_URL = 'https://80.lv/feed/';

// 80lvl is broad. Keep only posts that mention tools, tech, assets, tutorials — skip pure news.
const KEEP_KEYWORDS = /\b(release|update|tool|plugin|addon|shader|pipeline|tutorial|course|free|asset|library|generator|node|ai\b|gen-?ai|procedural|usd|gltf|hdri)\b/i;

async function main() {
  const catalog = loadCatalogUrls();
  const seen = loadSeen('seen-80lvl.json');
  const candidates = [];
  let fetched = 0;
  let err = null;

  try {
    const items = await fetchFeed(FEED_URL, { timeout: 30000 });
    fetched = items.length;
    for (const item of items) {
      const n = normalize(item.url);
      if (catalog.has(n) || seen.urls.has(n)) continue;
      const text = `${item.title} ${item.description || ''}`;
      if (!KEEP_KEYWORDS.test(text)) continue;
      candidates.push({ source: '80lvl', title: item.title, url: item.url, published: item.published, description: item.description });
      seen.urls.add(n);
    }
  } catch (e) { err = e.message; }

  saveSeen('seen-80lvl.json', seen.urls);
  writeReport('ingest-80lvl.json', { generated_at: new Date().toISOString().slice(0, 10), fetched, kept: candidates.length, error: err, candidates });
  console.log('80lvl candidates:', candidates.length, err ? '(err: ' + err + ')' : '');
}
main().catch(e => { console.error(e); process.exit(1); });
