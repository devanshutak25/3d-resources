#!/usr/bin/env node
// Flag github.com entries whose upstream repo hasn't been pushed to in >24mo.
// Writes _maintenance/freshness/staleness.json for the digest aggregator.
// Does NOT auto-deprecate — sets entry.stale=true + entry.last_pushed.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUT_DIR  = path.join(__dirname, '..', '_maintenance', 'freshness');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
const OUT = path.join(OUT_DIR, 'staleness.json');

const STALE_MONTHS = 24;
const CONCURRENCY = 8;

function extractRepo(url) {
  const m = url.match(/^https?:\/\/(?:www\.)?github\.com\/([^\/\s]+)\/([^\/\s#?]+)/i);
  if (!m) return null;
  const owner = m[1];
  const repo = m[2].replace(/\.git$/, '');
  if (['orgs', 'topics', 'explore', 'marketplace', 'sponsors', 'users', 'about'].includes(owner)) return null;
  return `${owner}/${repo}`;
}

async function getPushedAt(repo) {
  const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': '3d-resources-staleness' };
  if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
  if (res.status === 404) return { missing: true };
  if (res.status === 403 || res.status === 429) {
    const reset = res.headers.get('x-ratelimit-reset');
    return { rateLimited: true, reset };
  }
  if (!res.ok) return { error: `HTTP ${res.status}` };
  const data = await res.json();
  return {
    pushed_at: data.pushed_at,
    archived: data.archived,
    disabled: data.disabled,
    stars: data.stargazers_count,
    default_branch: data.default_branch
  };
}

async function pool(items, worker) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array(Math.min(CONCURRENCY, items.length)).fill(0).map(async () => {
    while (i < items.length) { const n = i++; out[n] = await worker(items[n], n); }
  }));
  return out;
}

function monthsBetween(a, b) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

async function main() {
  const sections = yaml.load(fs.readFileSync(path.join(DATA_DIR, 'sections.yml'), 'utf8'));
  const targets = [];
  for (const m of sections.sections) {
    const doc = yaml.load(fs.readFileSync(path.join(DATA_DIR, m.file), 'utf8'));
    for (const sub of doc.subsections || []) {
      for (const e of sub.entries || []) {
        if (e.deprecated) continue;
        const repo = extractRepo(e.url);
        if (repo) targets.push({ file: m.file, sub: sub.slug, entry: e, repo });
      }
    }
  }
  console.log(`Checking ${targets.length} github.com entries…`);

  let done = 0;
  const results = await pool(targets, async t => {
    const r = await getPushedAt(t.repo);
    if (++done % 100 === 0) console.log(`  ${done}/${targets.length}`);
    return r;
  });

  const now = new Date();
  const stale = [], archived = [], missing = [], errors = [];
  // Map file→yml doc once so we can persist stale flag in one pass
  const files = {};
  for (const m of sections.sections) files[m.file] = yaml.load(fs.readFileSync(path.join(DATA_DIR, m.file), 'utf8'));

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i], r = results[i];
    if (r.missing) { missing.push({ ...t, repo: t.repo }); continue; }
    if (r.rateLimited || r.error) { errors.push({ ...t, err: r.error || 'rate-limited' }); continue; }
    const pushed = new Date(r.pushed_at);
    const months = monthsBetween(pushed, now);
    // Mutate cached doc so we can write once
    const doc = files[t.file];
    for (const sub of doc.subsections || []) {
      if (sub.slug !== t.sub) continue;
      const ent = (sub.entries || []).find(x => x.url === t.entry.url);
      if (!ent) break;
      if (r.archived) ent.archived = true;
      else if (ent.archived) delete ent.archived;
      if (months >= STALE_MONTHS) {
        ent.stale = true;
        ent.last_pushed = r.pushed_at.slice(0, 10);
      } else if (ent.stale) {
        // Reactivated — clear stale flag
        delete ent.stale;
        delete ent.last_pushed;
      }
    }

    if (r.archived) archived.push({ file: t.file, sub: t.sub, name: t.entry.name, url: t.entry.url, repo: t.repo });
    if (months >= STALE_MONTHS) stale.push({ file: t.file, sub: t.sub, name: t.entry.name, url: t.entry.url, repo: t.repo, pushed: r.pushed_at.slice(0, 10), months, stars: r.stars });
  }

  // Persist
  for (const [f, doc] of Object.entries(files)) fs.writeFileSync(path.join(DATA_DIR, f), yaml.dump(doc, { lineWidth: -1, noRefs: true }));

  const summary = {
    generated_at: new Date().toISOString().slice(0, 10),
    checked: targets.length,
    stale_threshold_months: STALE_MONTHS,
    stale: stale.sort((a, b) => b.months - a.months),
    archived,
    missing: missing.map(m => ({ file: m.file, sub: m.sub, name: m.entry.name, url: m.entry.url, repo: m.repo })),
    errors: errors.map(e => ({ repo: e.repo, err: e.err }))
  };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 2));

  console.log(`\nStale (>${STALE_MONTHS}mo): ${stale.length}`);
  console.log(`Archived:                ${archived.length}`);
  console.log(`Missing (404):           ${missing.length}`);
  console.log(`Errors/rate-limit:       ${errors.length}`);
  console.log(`Report → ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
