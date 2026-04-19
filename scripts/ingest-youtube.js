#!/usr/bin/env node
// Pull recent uploads from YouTube channels via RSS.
// Doubles as drift detector: channels with no uploads in 12mo are flagged stale.
//
// Watchlist: _maintenance/freshness/watchlist-youtube.json — list of { channel_id, name, note? }
// Seed the watchlist by running with --seed (extracts channel_ids from catalog youtube entries).

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const { fetchFeed } = require('./lib/rss');
const { loadCatalogUrls, loadSeen, saveSeen, writeReport, FRESH_DIR, normalize } = require('./lib/ingest-core');

const DATA_DIR = path.join(__dirname, '..', 'data');
const WATCH_PATH = path.join(FRESH_DIR, 'watchlist-youtube.json');
const STALE_MONTHS = 12;
const MAX_CHANNELS_PER_RUN = 500; // cap to be kind

async function resolveChannelId(url) {
  // Channel ID format: UCxxxxxxxxxxxxxxxxxxxxxx (24 chars)
  const direct = url.match(/\/channel\/(UC[A-Za-z0-9_-]{22})/);
  if (direct) return direct[1];
  // Otherwise scrape the page for "channelId":"UC..."
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (bot)' } });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/"channelId":"(UC[A-Za-z0-9_-]{22})"/) || html.match(/"externalId":"(UC[A-Za-z0-9_-]{22})"/);
    return m ? m[1] : null;
  } catch { return null; }
}

async function seedWatchlist() {
  const sections = yaml.load(fs.readFileSync(path.join(DATA_DIR, 'sections.yml'), 'utf8'));
  const urls = new Set();
  for (const m of sections.sections) {
    const doc = yaml.load(fs.readFileSync(path.join(DATA_DIR, m.file), 'utf8'));
    for (const sub of doc.subsections || []) for (const e of sub.entries || []) {
      if (/youtube\.com/.test(e.url) && !e.deprecated) urls.add(e.url);
    }
  }
  console.log(`Found ${urls.size} youtube.com URLs in catalog. Resolving channel_ids…`);
  const existing = fs.existsSync(WATCH_PATH) ? JSON.parse(fs.readFileSync(WATCH_PATH, 'utf8')) : { channels: [] };
  const seen = new Set(existing.channels.map(c => c.channel_id));
  const out = [...existing.channels];
  let resolved = 0, skipped = 0, failed = 0;
  for (const url of urls) {
    const id = await resolveChannelId(url);
    if (!id) { failed++; continue; }
    if (seen.has(id)) { skipped++; continue; }
    seen.add(id);
    out.push({ channel_id: id, name: null, source_url: url });
    resolved++;
  }
  fs.writeFileSync(WATCH_PATH, JSON.stringify({ updated_at: new Date().toISOString().slice(0, 10), channels: out }, null, 2));
  console.log(`Added: ${resolved}, already seen: ${skipped}, failed: ${failed}`);
  console.log(`Watchlist → ${WATCH_PATH}  (${out.length} channels)`);
}

async function runIngest() {
  if (!fs.existsSync(WATCH_PATH)) {
    console.log('No watchlist. Run with --seed first.');
    process.exit(0);
  }
  const { channels } = JSON.parse(fs.readFileSync(WATCH_PATH, 'utf8'));
  const target = channels.slice(0, MAX_CHANNELS_PER_RUN);
  console.log(`Polling ${target.length} YouTube channels…`);

  const catalog = loadCatalogUrls();
  const seen = loadSeen('seen-youtube.json');

  const newUploads = [];
  const stale = [];
  const errors = [];
  const now = new Date();

  for (const ch of target) {
    const feed = `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.channel_id}`;
    try {
      const items = await fetchFeed(feed);
      if (!items.length) { stale.push({ ...ch, reason: 'empty-feed' }); continue; }
      const latest = new Date(items[0].published || 0);
      const months = (now.getFullYear() - latest.getFullYear()) * 12 + (now.getMonth() - latest.getMonth());
      if (months >= STALE_MONTHS) stale.push({ ...ch, last_upload: items[0].published, months_since: months });
      // new uploads — only flag ones NOT already in catalog/seen
      for (const it of items.slice(0, 5)) {
        const n = normalize(it.url);
        if (catalog.has(n) || seen.urls.has(n)) continue;
        newUploads.push({ channel_id: ch.channel_id, channel_name: ch.name || null, title: it.title, url: it.url, published: it.published });
        seen.urls.add(n);
      }
    } catch (e) {
      errors.push({ channel_id: ch.channel_id, err: e.message });
    }
  }

  saveSeen('seen-youtube.json', seen.urls);
  writeReport('ingest-youtube.json', {
    generated_at: new Date().toISOString().slice(0, 10),
    checked: target.length,
    stale_threshold_months: STALE_MONTHS,
    new_uploads: newUploads,
    stale_channels: stale,
    errors
  });
  console.log(`New uploads: ${newUploads.length}`);
  console.log(`Stale channels (>${STALE_MONTHS}mo no upload): ${stale.length}`);
  console.log(`Errors: ${errors.length}`);
}

async function main() {
  if (process.argv.includes('--seed')) await seedWatchlist();
  else await runIngest();
}
main().catch(e => { console.error(e); process.exit(1); });
