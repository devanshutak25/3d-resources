// Shared helpers for ingestion adapters.
const fs = require('fs');
const path = require('path');
const catalog = require('./catalog');
const { canonicalUrl } = require('./canonical-url');

const ROOT = path.join(__dirname, '..', '..');
const FRESH_DIR = path.join(ROOT, '_maintenance', 'freshness');
if (!fs.existsSync(FRESH_DIR)) fs.mkdirSync(FRESH_DIR, { recursive: true });

const normalize = canonicalUrl;

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
