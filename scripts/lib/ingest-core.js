// Shared helpers for ingestion adapters.
const fs = require('fs');
const path = require('path');
const catalog = require('./catalog');

const ROOT = path.join(__dirname, '..', '..');
const FRESH_DIR = path.join(ROOT, '_maintenance', 'freshness');
if (!fs.existsSync(FRESH_DIR)) fs.mkdirSync(FRESH_DIR, { recursive: true });

function normalize(u) {
  try {
    const url = new URL(u);
    url.hash = '';
    url.protocol = 'https:';
    url.hostname = url.hostname.replace(/^www\./, '');
    for (const p of ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'source']) url.searchParams.delete(p);
    let s = url.toString();
    if (s.endsWith('/') && url.pathname !== '/') s = s.slice(0, -1);
    return s.toLowerCase();
  } catch { return (u || '').toLowerCase(); }
}

function loadCatalogUrls() {
  const set = new Set();
  for (const { entry } of catalog.iterEntries()) set.add(normalize(entry.url));
  return set;
}

function loadSeen(stateFile) {
  const p = path.join(FRESH_DIR, stateFile);
  if (!fs.existsSync(p)) return { urls: new Set(), obj: { urls: [] } };
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  return { urls: new Set(j.urls || []), obj: j };
}

function saveSeen(stateFile, set) {
  const p = path.join(FRESH_DIR, stateFile);
  fs.writeFileSync(p, JSON.stringify({ updated_at: new Date().toISOString().slice(0, 10), urls: [...set] }, null, 2));
}

function writeReport(name, obj) {
  fs.writeFileSync(path.join(FRESH_DIR, name), JSON.stringify(obj, null, 2));
}

module.exports = { normalize, loadCatalogUrls, loadSeen, saveSeen, writeReport, FRESH_DIR };
