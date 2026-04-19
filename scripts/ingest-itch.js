#!/usr/bin/env node
// Pull new releases from itch.io category feeds (tools, game-assets, tools/free).

const { fetchFeed } = require('./lib/rss');
const { normalize, loadCatalogUrls, loadSeen, saveSeen, writeReport } = require('./lib/ingest-core');

const FEEDS = [
  { url: 'https://itch.io/tools.xml',         category: 'tools' },
  { url: 'https://itch.io/game-assets.xml',   category: 'game-assets' },
  { url: 'https://itch.io/tools/free.xml',    category: 'tools-free' }
];

const KEEP_KEYWORDS = /\b(blender|unity|unreal|godot|shader|pixel|sprite|voxel|3d|2d|pbr|texture|material|mocap|rigging|retopo|usd|gltf|hdri|generator|procedural|gamejam|tilemap|asset|animation|vfx)\b/i;

async function main() {
  const catalog = loadCatalogUrls();
  const seen = loadSeen('seen-itch.json');
  const candidates = [];
  const summary = { per_feed: {} };

  for (const feed of FEEDS) {
    try {
      const items = await fetchFeed(feed.url);
      let kept = 0;
      for (const item of items) {
        const n = normalize(item.url);
        if (catalog.has(n) || seen.urls.has(n)) continue;
        const text = `${item.title} ${item.description || ''}`;
        if (!KEEP_KEYWORDS.test(text)) continue;
        candidates.push({ source: `itch:${feed.category}`, title: item.title, url: item.url, published: item.published, description: item.description });
        seen.urls.add(n);
        kept++;
      }
      summary.per_feed[feed.category] = { fetched: items.length, kept };
    } catch (e) {
      summary.per_feed[feed.category] = { error: e.message };
    }
  }

  saveSeen('seen-itch.json', seen.urls);
  writeReport('ingest-itch.json', { generated_at: new Date().toISOString().slice(0, 10), count: candidates.length, summary, candidates });
  console.log('Itch candidates:', candidates.length);
  for (const [c, s] of Object.entries(summary.per_feed)) console.log(' ', c, JSON.stringify(s));
}
main().catch(e => { console.error(e); process.exit(1); });
