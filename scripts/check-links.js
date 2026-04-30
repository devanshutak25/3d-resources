#!/usr/bin/env node
// Link checker: HEAD all URLs in data/*.yml.
// Updates url_last_verified + url_status. Auto-marks broken links deprecated.
// Writes a summary report to _maintenance/link-check-YYYY-MM-DD.md for the CI workflow to use as issue body.

const fs = require('fs');
const path = require('path');
const catalog = require('./lib/catalog');

const CONCURRENCY = 16;
const TIMEOUT_MS = 15000;
const TODAY = new Date().toISOString().slice(0, 10);

async function check(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // Try HEAD first; fall back to GET if server rejects HEAD
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
    }
    clearTimeout(timer);
    if (res.ok) return { status: 'ok', code: res.status, finalUrl: res.url };
    if (res.status >= 300 && res.status < 400) return { status: 'redirect', code: res.status, finalUrl: res.url };
    // 401/403/405/429/451/999 = bot-block, auth wall, or rate-limit — URL is alive, just not HEAD-able.
    // Treat as 'ok' to avoid auto-deprecating Cloudflare-protected asset sites.
    if ([401, 403, 405, 429, 451, 999].includes(res.status)) {
      return { status: 'ok', code: res.status, finalUrl: res.url, note: 'bot-blocked' };
    }
    return { status: 'broken', code: res.status, finalUrl: res.url };
  } catch (e) {
    clearTimeout(timer);
    return { status: 'unreachable', error: e.message };
  }
}

async function pool(items, worker) {
  const results = new Array(items.length);
  let next = 0;
  const runners = new Array(Math.min(CONCURRENCY, items.length)).fill(0).map(async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const updateFiles = !dryRun;

  const subTitle = new Map();
  for (const meta of catalog.loadSections().sections) {
    for (const s of catalog.loadSection(meta.file).subsections || []) {
      subTitle.set(`${meta.file}::${s.slug}`, s);
    }
  }
  const allEntries = [];
  for (const ie of catalog.iterEntries()) {
    allEntries.push({
      entry: ie.entry,
      sub: subTitle.get(`${ie.sectionFile}::${ie.subSlug}`) || { slug: ie.subSlug },
      chunk: ie.chunk,
      metaFile: ie.sectionFile
    });
  }

  console.log(`Checking ${allEntries.length} URLs (concurrency ${CONCURRENCY}, timeout ${TIMEOUT_MS}ms)...`);

  let done = 0;
  const results = await pool(allEntries, async (item) => {
    const r = await check(item.entry.url);
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${allEntries.length}`);
    return r;
  });

  const broken = [];
  const redirects = [];
  const unreachable = [];

  for (let i = 0; i < allEntries.length; i++) {
    const item = allEntries[i];
    const r = results[i];
    const entry = item.entry;
    entry.url_last_verified = TODAY;
    entry.url_status = r.status;

    if (r.status === 'broken') {
      broken.push({ ...item, result: r });
      entry.deprecated = true;
    } else if (r.status === 'unreachable') {
      unreachable.push({ ...item, result: r });
    } else if (r.status === 'redirect') {
      redirects.push({ ...item, result: r });
    }
  }

  if (updateFiles) {
    // Mutations were done in-place on entry refs into each chunk; save touched chunks.
    const touched = new Map(); // chunk._path → chunk
    for (const item of allEntries) touched.set(item.chunk._path, item.chunk);
    for (const chunk of touched.values()) catalog.saveChunk(chunk);
  }

  // Write report
  const reportDir = path.join(__dirname, '..', '_maintenance');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `link-check-${TODAY}.md`);
  const lines = [];
  lines.push(`# Link check — ${TODAY}`);
  lines.push('');
  lines.push(`- Total URLs: ${allEntries.length}`);
  lines.push(`- OK: ${allEntries.length - broken.length - redirects.length - unreachable.length}`);
  lines.push(`- Redirects: ${redirects.length}`);
  lines.push(`- Unreachable: ${unreachable.length}`);
  lines.push(`- **Broken (auto-marked deprecated): ${broken.length}**`);
  lines.push('');
  if (broken.length) {
    lines.push('## Broken — needs human review');
    lines.push('');
    for (const b of broken) {
      lines.push(`- **${b.entry.name}** — ${b.entry.url} — HTTP ${b.result.code} — in \`${b.metaFile}\` :: \`${b.sub.slug}\``);
    }
    lines.push('');
  }
  if (unreachable.length) {
    lines.push('## Unreachable (may be transient — network / timeout)');
    lines.push('');
    for (const u of unreachable.slice(0, 50)) {
      lines.push(`- ${u.entry.name} — ${u.entry.url} — ${u.result.error}`);
    }
    if (unreachable.length > 50) lines.push(`- ... and ${unreachable.length - 50} more`);
    lines.push('');
  }
  if (redirects.length) {
    lines.push('## Redirects (consider updating URL)');
    lines.push('');
    for (const r of redirects.slice(0, 50)) {
      lines.push(`- ${r.entry.name} — ${r.entry.url} → ${r.result.finalUrl}`);
    }
    if (redirects.length > 50) lines.push(`- ... and ${redirects.length - 50} more`);
  }
  fs.writeFileSync(reportPath, lines.join('\n'));
  console.log(`\nReport → ${reportPath}`);
  console.log(`Broken: ${broken.length} | Unreachable: ${unreachable.length} | Redirects: ${redirects.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
