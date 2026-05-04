#!/usr/bin/env node
// One-shot: replace placeholder names like "Arxiv Paper 2401.00909" with real
// titles from the arXiv export API. Idempotent — only touches entries whose
// name still matches the placeholder pattern.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const PAPERS_DIR = path.join(__dirname, '..', '..', 'data', '09-ai-ml', 'papers');
const PLACEHOLDER_RX = /^Arxiv Paper (\d{4}\.\d{4,6})$/i;
const ARXIV_ID_FROM_URL = /arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,6})/i;

function extractId(entry) {
  const m1 = (entry.name || '').match(PLACEHOLDER_RX);
  if (m1) return m1[1];
  const m2 = (entry.url || '').match(ARXIV_ID_FROM_URL);
  if (m2) return m2[1];
  return null;
}

function parseTitles(xml) {
  // Atom feed. Entries each have <id>http://arxiv.org/abs/ID</id> and <title>...</title>.
  const out = new Map();
  const re = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = re.exec(xml))) {
    const block = m[1];
    const idMatch = block.match(/<id>http:\/\/arxiv\.org\/abs\/([^<]+)<\/id>/);
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
    if (idMatch && titleMatch) {
      const id = idMatch[1].replace(/v\d+$/, '').trim();
      const title = titleMatch[1].replace(/\s+/g, ' ').trim();
      out.set(id, title);
    }
  }
  return out;
}

async function fetchBatch(ids) {
  const url = `http://export.arxiv.org/api/query?id_list=${ids.join(',')}&max_results=${ids.length}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  return parseTitles(xml);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const files = fs.readdirSync(PAPERS_DIR).filter(f => f.endsWith('.yml')).sort();

  // Collect all placeholder entries first.
  const targets = []; // [{file, idx, entry, id}]
  const fileData = new Map();
  for (const f of files) {
    const p = path.join(PAPERS_DIR, f);
    const raw = yaml.load(fs.readFileSync(p, 'utf8')) || {};
    fileData.set(f, raw);
    const entries = raw.entries || [];
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (!PLACEHOLDER_RX.test(e.name || '')) continue;
      const id = extractId(e);
      if (id) targets.push({ file: f, idx: i, entry: e, id });
    }
  }
  console.log(`Found ${targets.length} placeholder titles to resolve.`);
  if (!targets.length) return;

  // Batch fetch (20 per request, 3s delay between batches).
  const BATCH = 20;
  const titles = new Map();
  for (let i = 0; i < targets.length; i += BATCH) {
    const batch = targets.slice(i, i + BATCH);
    const ids = batch.map(t => t.id);
    process.stdout.write(`Fetching batch ${Math.floor(i / BATCH) + 1} (${ids.length} ids)... `);
    try {
      const got = await fetchBatch(ids);
      for (const [k, v] of got) titles.set(k, v);
      console.log(`got ${got.size}`);
    } catch (e) {
      console.log(`error: ${e.message}`);
    }
    if (i + BATCH < targets.length) await sleep(3000);
  }

  // Apply.
  let applied = 0;
  for (const t of targets) {
    const title = titles.get(t.id);
    if (!title) continue;
    t.entry.name = title;
    applied++;
  }

  // Save modified files.
  for (const [f, raw] of fileData) {
    const p = path.join(PAPERS_DIR, f);
    fs.writeFileSync(p, yaml.dump(raw, { lineWidth: -1, noRefs: true }));
  }

  console.log(`Updated ${applied} of ${targets.length} entries.`);
}

main().catch(err => { console.error(err); process.exit(1); });
