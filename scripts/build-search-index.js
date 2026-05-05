#!/usr/bin/env node
// Build _site/search-index.json — a serialized MiniSearch index over the
// entries in _site/data.json, enriched with aliases from data/aliases.yml.
//
// Client-side filter.js loads this via MiniSearch.loadJSON() and runs all
// search queries through it (sub-10ms typical, scales past 10k entries).

const fs = require('fs');
const yaml = require('js-yaml');
const MiniSearch = require('minisearch');

function squash(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function buildAliasIndex(aliases) {
  const byCanon = new Map();
  for (const [alias, canon] of Object.entries(aliases || {})) {
    const k = String(canon).toLowerCase();
    if (!byCanon.has(k)) byCanon.set(k, []);
    byCanon.get(k).push(String(alias).toLowerCase());
  }
  return byCanon;
}

function aliasesForEntry(e, byCanon) {
  const tags = e.tags || {};
  const hay = [
    e.name || '',
    (tags.tech || []).join(' '),
    (tags.skill || []).join(' '),
    e.subsection || ''
  ].join(' ').toLowerCase();
  const out = new Set();
  for (const [canon, list] of byCanon) {
    if (hay.includes(canon)) for (const a of list) out.add(a);
  }
  return [...out];
}

function main() {
  const dataPath = process.argv[2];
  const outPath = process.argv[3];
  if (!dataPath || !outPath) {
    console.error('Usage: node build-search-index.js <data.json> <out.json>');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  let aliases = {};
  try {
    const yml = yaml.load(fs.readFileSync('data/aliases.yml', 'utf8'));
    aliases = (yml && yml.aliases) || {};
  } catch (e) {
    console.warn('No data/aliases.yml; building index without aliases.');
  }
  const byCanon = buildAliasIndex(aliases);

  // Dedupe by URL: dual_listed_in produces N data rows for one logical entry,
  // all sharing the same URL. We index once per URL so the client can match
  // search results back to rendered DOM rows via item.urlKey.
  function normUrl(u) {
    try {
      const url = new URL(u);
      url.hash = '';
      let s = url.toString();
      if (s.endsWith('/') && url.pathname !== '/') s = s.slice(0, -1);
      return s;
    } catch (_) { return u; }
  }
  const seen = new Set();
  const docs = [];
  for (const e of data.entries) {
    const id = normUrl(e.url);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const tags = e.tags || {};
    const allTags = [
      ...(tags.platform || []),
      ...(tags.workflow || []),
      ...(tags.output || []),
      ...(tags.tech || []),
      ...(tags.skill || [])
    ];
    docs.push({
      id,
      name: e.name || '',
      nameSquashed: squash(e.name),
      aliases: aliasesForEntry(e, byCanon).join(' '),
      tags: allTags.join(' '),
      subsection: (e.subsection || '').replace(/-/g, ' '),
      description: e.description || ''
    });
  }

  // MiniSearch options must be byte-identical between build (here) and the
  // client load call in filter.js. Stick to defaults so no functions need to
  // cross the wire.
  const ms = new MiniSearch({
    fields: ['name', 'nameSquashed', 'aliases', 'tags', 'subsection', 'description'],
    storeFields: ['id'],
    searchOptions: {
      boost: { name: 4, nameSquashed: 4, aliases: 4, tags: 2, subsection: 1.5, description: 1 },
      prefix: true,
      fuzzy: 0.2,
      combineWith: 'AND'
    }
  });
  ms.addAll(docs);

  fs.writeFileSync(outPath, JSON.stringify(ms));
  const bytes = fs.statSync(outPath).size;
  console.log(`Wrote search index (${docs.length} docs, ${(bytes / 1024).toFixed(1)} KB) → ${outPath}`);
}

main();
