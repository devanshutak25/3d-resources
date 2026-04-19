#!/usr/bin/env node
// Aggregates all freshness outputs into one digest markdown + JSON.
// Reads _maintenance/freshness/*.json, also consumes the latest link-check-*.md
// and release-report.md if present.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FRESH = path.join(ROOT, '_maintenance', 'freshness');
const MAINT = path.join(ROOT, '_maintenance');
const TODAY = new Date().toISOString().slice(0, 10);
const MONTH = TODAY.slice(0, 7);
const OUT_MD = path.join(MAINT, `freshness-${MONTH}.md`);
const OUT_JSON = path.join(MAINT, `freshness-${MONTH}.json`);

function readJson(name) {
  const p = path.join(FRESH, name);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}

function latestFile(re) {
  const files = fs.readdirSync(MAINT).filter(f => re.test(f)).sort();
  return files.length ? path.join(MAINT, files[files.length - 1]) : null;
}

function section(title, body) {
  if (!body) return '';
  return `## ${title}\n\n${body}\n\n`;
}

function listCandidates(cands, limit = 30) {
  if (!cands || !cands.length) return '_No new candidates._';
  const shown = cands.slice(0, limit);
  const rest = cands.length - shown.length;
  const lines = shown.map(c => `- [${(c.title || c.name || c.url).replace(/\n/g, ' ')}](${c.url})${c.source ? ` — _${c.source}_` : ''}`);
  if (rest > 0) lines.push(`- … and **${rest}** more`);
  return lines.join('\n');
}

function main() {
  const staleness = readJson('staleness.json');
  const pricing   = readJson('pricing.json');
  const itch      = readJson('ingest-itch.json');
  const lvl80     = readJson('ingest-80lvl.json');
  const youtube   = readJson('ingest-youtube.json');
  const gumroad   = readJson('ingest-gumroad.json');
  const linkReportPath = latestFile(/^link-check-\d{4}-\d{2}-\d{2}\.md$/);
  const releaseReport  = fs.existsSync(path.join(MAINT, 'release-report.md'))
    ? fs.readFileSync(path.join(MAINT, 'release-report.md'), 'utf8').trim() : '';

  // Aggregate counts
  const counts = {
    new_uploads_youtube: (youtube?.new_uploads?.length) || 0,
    stale_channels:      (youtube?.stale_channels?.length) || 0,
    itch:                (itch?.candidates?.length) || 0,
    '80lvl':             (lvl80?.candidates?.length) || 0,
    gumroad:             (gumroad?.candidates?.length) || 0,
    stale_github:        (staleness?.stale?.length) || 0,
    archived_github:     (staleness?.archived?.length) || 0,
    missing_github:      (staleness?.missing?.length) || 0,
    pricing_stale:       (pricing?.stale?.length) || 0,
    pricing_missing:     (pricing?.missing?.length) || 0
  };
  const total_candidates = counts.new_uploads_youtube + counts.itch + counts['80lvl'] + counts.gumroad;
  const total_flags = counts.stale_github + counts.archived_github + counts.missing_github + counts.pricing_stale + counts.stale_channels;

  let md = `# Freshness digest — ${MONTH}\n\n`;
  md += `_Generated ${TODAY}_\n\n`;
  md += `**New candidates:** ${total_candidates}  **Flags:** ${total_flags}\n\n`;

  // Summary table
  md += `## Summary\n\n`;
  md += `| Source / Check | Count |\n|---|---:|\n`;
  for (const [k, v] of Object.entries(counts)) md += `| ${k} | ${v} |\n`;
  md += `\n`;

  // Ingestion candidates
  md += section('New candidates — YouTube uploads', listCandidates(youtube?.new_uploads, 30));
  md += section('New candidates — itch.io',        listCandidates(itch?.candidates, 30));
  md += section('New candidates — 80 Level',       listCandidates(lvl80?.candidates, 30));
  md += section('New candidates — Gumroad',        listCandidates(gumroad?.candidates, 30));

  // Stale
  if (staleness?.stale?.length) {
    md += `## Stale GitHub repos (>24mo no push)\n\n`;
    md += staleness.stale.slice(0, 40).map(s => `- [${s.name}](${s.url}) — last push ${s.pushed} (${s.months}mo) — ${s.file}::${s.sub}`).join('\n');
    if (staleness.stale.length > 40) md += `\n- … and ${staleness.stale.length - 40} more`;
    md += '\n\n';
  }
  if (staleness?.archived?.length) {
    md += `## Archived GitHub repos\n\n`;
    md += staleness.archived.slice(0, 40).map(s => `- [${s.name}](${s.url}) — ${s.file}::${s.sub}`).join('\n');
    md += '\n\n';
  }
  if (staleness?.missing?.length) {
    md += `## Missing GitHub repos (404)\n\n`;
    md += staleness.missing.slice(0, 40).map(s => `- ${s.name} — ${s.url} — ${s.file}::${s.sub}`).join('\n');
    md += '\n\n';
  }
  if (youtube?.stale_channels?.length) {
    md += `## Stale YouTube channels (>12mo no upload)\n\n`;
    md += youtube.stale_channels.slice(0, 40).map(c => `- \`${c.channel_id}\` — last upload ${c.last_upload || 'n/a'} (${c.months_since || '?'}mo) — ${c.source_url || ''}`).join('\n');
    md += '\n\n';
  }

  // Pricing
  if (pricing?.stale?.length || pricing?.missing?.length) {
    md += `## Pricing verification due (>90d) or missing\n\n`;
    const lines = [];
    for (const e of (pricing.stale || []).slice(0, 30)) lines.push(`- [${e.name}](${e.url}) — ${e.license} — last verified ${e.last_verified} (${e.days_old}d)`);
    for (const e of (pricing.missing || []).slice(0, 30)) lines.push(`- [${e.name}](${e.url}) — ${e.license} — **never verified**`);
    md += lines.join('\n') + '\n\n';
  }

  // Releases + link-check pointers
  if (releaseReport) md += `## Release updates\n\n${releaseReport}\n\n`;
  if (linkReportPath) {
    const rel = path.relative(ROOT, linkReportPath).replace(/\\/g, '/');
    md += `## Link check\n\nSee [${path.basename(linkReportPath)}](${rel}).\n\n`;
  }

  md += `---\n\nReview candidates → add via \`scripts/add-candidates.js\` style flow. Clear stale flags or replace URLs as needed.\n`;

  fs.writeFileSync(OUT_MD, md);
  fs.writeFileSync(OUT_JSON, JSON.stringify({ month: MONTH, generated_at: TODAY, counts, total_candidates, total_flags }, null, 2));
  console.log(`Digest → ${OUT_MD}`);
  console.log(`JSON   → ${OUT_JSON}`);
  console.log(`Total candidates: ${total_candidates}, flags: ${total_flags}`);
}
main();
