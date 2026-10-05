#!/usr/bin/env node
// Link checker: HEAD all URLs in data/*.yml.
// Updates link-health fields. Editorial deprecation is changed only by review.
// Writes a summary report to _maintenance/link-check-YYYY-MM-DD.md for the CI workflow to use as issue body.
//
// Flags:
//   --dry-run              check and report, write nothing to data/
//   --only-missing         only entries with no url_status yet (new entries)
//   --status=a,b           only entries whose url_status is one of these
//
// Any non-OK result is retried once with a browser User-Agent and a longer
// timeout before it is reported: many CDNs/WAFs reject non-browser clients,
// which used to surface as false "broken" links (Brandfetch, IEEE, SourceForge).

const fs = require('fs');
const path = require('path');
const catalog = require('./lib/catalog');

const CONCURRENCY = 16;
const TIMEOUT_MS = 15000;
const RETRY_TIMEOUT_MS = 30000;
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const TODAY = new Date().toISOString().slice(0, 10);

// Release the socket: an unread body keeps the connection busy until GC.
async function discard(res) {
  try { if (res && res.body) await res.body.cancel(); } catch (e) { /* already closed */ }
}

async function check(url) {
  const first = await checkOnce(url, { timeout: TIMEOUT_MS });
  if (first.status === 'ok' || first.status === 'redirect') return first;
  const retry = await checkOnce(url, { timeout: RETRY_TIMEOUT_MS, headers: { 'User-Agent': BROWSER_UA, 'Accept': 'text/html,*/*' } });
  return retry.status === 'ok' || retry.status === 'redirect' ? { ...retry, note: 'ok with browser UA' } : first;
}

async function checkOnce(url, { timeout, headers = {} }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    // Try HEAD first; fall back to GET if server rejects HEAD
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal, headers });
    if (res.status === 405 || res.status === 403 || res.status === 404 || res.status >= 500) {
      await discard(res);
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal, headers });
    }
    await discard(res);
    clearTimeout(timer);
    if (res.ok) return { status: res.redirected ? 'redirect' : 'ok', code: res.status, finalUrl: res.url };
    if (res.status >= 300 && res.status < 400) return { status: 'redirect', code: res.status, finalUrl: res.url };
    // 401/403/405/429/451/999 = bot-block, auth wall, or rate-limit — URL is alive, just not HEAD-able.
    // Keep protected sites out of the broken-link report.
    if ([401, 403, 405, 429, 451, 999].includes(res.status)) {
      return { status: 'ok', code: res.status, finalUrl: res.url, note: 'bot-blocked' };
    }
    if (res.status >= 500 || res.status === 408 || res.status === 425) {
      return { status: 'unreachable', code: res.status, finalUrl: res.url, error: `HTTP ${res.status} (temporary failure)` };
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
  const onlyMissing = process.argv.includes('--only-missing');
  const statusArg = process.argv.find(a => a.startsWith('--status='));
  const onlyStatus = statusArg ? new Set(statusArg.slice('--status='.length).split(',')) : null;
  const updateFiles = !dryRun;

  const subTitle = new Map();
  for (const meta of catalog.loadSections().sections) {
    for (const s of catalog.loadSection(meta.file).subsections || []) {
      subTitle.set(`${meta.file}::${s.slug}`, s);
    }
  }
  const allEntries = [];
  for (const ie of catalog.iterEntries()) {
    if (onlyMissing && ie.entry.url_status) continue;
    if (onlyStatus && !onlyStatus.has(ie.entry.url_status)) continue;
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
  lines.push(`# Link check: ${TODAY}`);
  lines.push('');
  lines.push(`- Total URLs: ${allEntries.length}`);
  lines.push(`- OK: ${allEntries.length - broken.length - redirects.length - unreachable.length}`);
  lines.push(`- Redirects: ${redirects.length}`);
  lines.push(`- Unreachable: ${unreachable.length}`);
  lines.push(`- **Broken (needs review): ${broken.length}**`);
  lines.push('');
  if (broken.length) {
    lines.push('## Broken: needs human review');
    lines.push('');
    for (const b of broken) {
      lines.push(`- **${b.entry.name}**: ${b.entry.url} (HTTP ${b.result.code}) in \`${b.metaFile}\` :: \`${b.sub.slug}\``);
    }
    lines.push('');
  }
  if (unreachable.length) {
    lines.push('## Unreachable (may be transient: network or timeout)');
    lines.push('');
    for (const u of unreachable.slice(0, 50)) {
      lines.push(`- ${u.entry.name}: ${u.entry.url} (${u.result.error})`);
    }
    if (unreachable.length > 50) lines.push(`- ... and ${unreachable.length - 50} more`);
    lines.push('');
  }
  if (redirects.length) {
    lines.push('## Redirects (consider updating URL)');
    lines.push('');
    for (const r of redirects.slice(0, 50)) {
      lines.push(`- ${r.entry.name}: ${r.entry.url} → ${r.result.finalUrl}`);
    }
    if (redirects.length > 50) lines.push(`- ... and ${redirects.length - 50} more`);
  }
  fs.writeFileSync(reportPath, lines.join('\n'));
  console.log(`\nReport → ${reportPath}`);
  console.log(`Broken: ${broken.length} | Unreachable: ${unreachable.length} | Redirects: ${redirects.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
