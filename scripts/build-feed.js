#!/usr/bin/env node
// Generate _site/feed.xml — Atom 1.0 feed of the 50 most recently added
// entries. Ordering uses chunk insertion order (newest at the end of the
// highest-numbered chunk per subsection — see ADR-0001), which is good
// enough chronologically without requiring git blame on every entry.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const catalog = require('./lib/catalog');

const SITE_URL = 'https://3d.devanshutak.xyz';
const OUT_PATH = path.join(__dirname, '..', '_site', 'feed.xml');
const FEED_LIMIT = 50;

function isoNow() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function lastUpdatedISO() {
  try {
    const cs = execSync('git log -1 --format=%cI HEAD', { encoding: 'utf8' }).trim();
    return cs || isoNow();
  } catch (_) { return isoNow(); }
}

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function clean(s) {
  if (!s) return '';
  return String(s)
    .replace(/<[^>]+>/g, '')
    .replace(/!\[\]\[[\w-]+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectEntries() {
  // Walk chunks in deterministic order (catalog.iterChunks already returns
  // them ordered by section → subsection → filename, which is insertion order).
  // Tag each entry with its chunk id + position so we can grab the tail.
  const all = [];
  const seen = new Set();
  for (const chunk of catalog.iterChunks()) {
    chunk.entries.forEach((e, i) => {
      if (e.deprecated) return;
      if (!e.url || !e.name) return;
      const k = e.url.toLowerCase();
      if (seen.has(k)) return;
      seen.add(k);
      all.push({ entry: e, chunkId: chunk.id, pos: i });
    });
  }
  // The tail (highest chunk id + position) is freshest.
  return all.slice(-FEED_LIMIT).reverse();
}

function buildFeed(items, lastUpdated) {
  const lines = [];
  lines.push('<?xml version="1.0" encoding="utf-8"?>');
  lines.push('<feed xmlns="http://www.w3.org/2005/Atom">');
  lines.push('  <title>3D Resources</title>');
  lines.push(`  <subtitle>Latest additions to the curated 3D resources catalog.</subtitle>`);
  lines.push(`  <link href="${SITE_URL}/feed.xml" rel="self" type="application/atom+xml"/>`);
  lines.push(`  <link href="${SITE_URL}/" rel="alternate" type="text/html"/>`);
  lines.push(`  <id>${SITE_URL}/</id>`);
  lines.push(`  <updated>${lastUpdated}</updated>`);
  lines.push('  <author><name>Devanshu Tak</name></author>');
  lines.push('  <rights>CC0-1.0</rights>');

  for (const { entry: e, chunkId } of items) {
    const title = xmlEscape(clean(e.name));
    const url = xmlEscape(e.url);
    const summary = xmlEscape(clean(e.description || ''));
    const section = chunkId.split('/')[0]; // e.g. "01-assets"
    lines.push('  <entry>');
    lines.push(`    <title>${title}</title>`);
    lines.push(`    <link href="${url}" rel="alternate"/>`);
    lines.push(`    <id>${url}</id>`);
    lines.push(`    <updated>${lastUpdated}</updated>`);
    if (summary) lines.push(`    <summary>${summary}</summary>`);
    lines.push(`    <category term="${xmlEscape(section)}"/>`);
    if (e.license) lines.push(`    <category term="${xmlEscape(String(e.license).toLowerCase())}" scheme="license"/>`);
    lines.push('  </entry>');
  }

  lines.push('</feed>');
  return lines.join('\n');
}

function main() {
  const items = collectEntries();
  const feed = buildFeed(items, lastUpdatedISO());
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, feed);
  const sizeKB = (Buffer.byteLength(feed, 'utf8') / 1024).toFixed(1);
  console.log(`Wrote feed.xml (${sizeKB} KB, ${items.length} entries)`);
}

main();
