#!/usr/bin/env node
// Parses latest link-check report, identifies 403/429 (bot-block / rate-limit)
// false-positives, and clears deprecated flag + sets url_status back to 'ok'
// on those entries. Leaves real 4xx (404/410) and 5xx flagged.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '..', 'data');
const MAINT = path.join(__dirname, '..', '_maintenance');

// HTTP codes that indicate bot-block / rate-limit, not a dead URL
const FALSE_BROKEN = new Set([401, 403, 405, 429, 451, 999]);

function latestReport() {
  const files = fs.readdirSync(MAINT).filter(f => /^link-check-\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort();
  return path.join(MAINT, files[files.length - 1]);
}

function parseReport(md) {
  // Lines: "- **Name** — https://url — HTTP 403 — in `file` :: `sub`"
  const re = /- \*\*(.+?)\*\* — (\S+) — HTTP (\d+) — in `([^`]+)` :: `([^`]+)`/g;
  const out = [];
  let m;
  while ((m = re.exec(md)) !== null) {
    out.push({ name: m[1], url: m[2], code: +m[3], file: m[4], sub: m[5] });
  }
  return out;
}

function main() {
  const reportPath = latestReport();
  console.log('Report:', reportPath);
  const md = fs.readFileSync(reportPath, 'utf8');
  const broken = parseReport(md);
  const falseBroken = broken.filter(b => FALSE_BROKEN.has(b.code));
  const realBroken  = broken.filter(b => !FALSE_BROKEN.has(b.code));
  console.log(`Total broken in report: ${broken.length}`);
  console.log(`  False positives (403/429/etc): ${falseBroken.length}`);
  console.log(`  Real breaks (404/5xx):         ${realBroken.length}`);

  const byFile = {};
  for (const b of falseBroken) {
    (byFile[b.file] = byFile[b.file] || []).push(b);
  }

  let fixedCount = 0;
  for (const [file, list] of Object.entries(byFile)) {
    const full = path.join(DATA_DIR, file);
    const doc = yaml.load(fs.readFileSync(full, 'utf8'));
    const urlSet = new Set(list.map(b => b.url));
    for (const s of doc.subsections || []) {
      for (const e of s.entries || []) {
        if (urlSet.has(e.url) && e.url_status === 'broken') {
          e.url_status = 'ok';
          if (e.deprecated === true) delete e.deprecated;
          fixedCount++;
        }
      }
    }
    fs.writeFileSync(full, yaml.dump(doc, { lineWidth: -1, noRefs: true }));
  }

  console.log(`Fixed entries: ${fixedCount}`);

  // Summary of real-broken for follow-up
  const byCode = {};
  for (const b of realBroken) byCode[b.code] = (byCode[b.code] || 0) + 1;
  console.log('\nRemaining real-broken by HTTP code:');
  for (const [c, n] of Object.entries(byCode).sort((a, b) => b[1] - a[1])) console.log(`  ${c}: ${n}`);
}

main();
