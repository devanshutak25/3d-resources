#!/usr/bin/env node
// Exports every entry in data/*.yml to a single CSV.

const fs = require('fs');
const catalog = require('./lib/catalog');

const OUT = process.argv[2];
if (!OUT) { console.error('Usage: node export-csv.js <path.csv>'); process.exit(1); }

const COLUMNS = [
  'section', 'subsection', 'name', 'url', 'description',
  'entry_type', 'license', 'pricing', 'best_for',
  'readme_tags', 'workflow', 'output', 'platform', 'skill', 'tech',
  'deprecated', 'url_status', 'url_last_verified', 'pricing_last_verified',
  'host_compat', 'notes', 'dual_listed_in'
];

function escCsv(v) {
  if (v === undefined || v === null) return '';
  let s = String(v);
  if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function join(v) {
  if (!v) return '';
  if (Array.isArray(v)) return v.join('; ');
  return String(v);
}

function main() {
  const fileToSlug = new Map();
  for (const meta of catalog.loadSections().sections) {
    fileToSlug.set(meta.file, catalog.loadSection(meta.file).slug);
  }
  const rows = [COLUMNS.join(',')];
  let count = 0;
  for (const { sectionFile, subSlug, entry: e } of catalog.iterEntries()) {
    const tags = e.tags || {};
    const row = [
      fileToSlug.get(sectionFile),
      subSlug,
      e.name, e.url, e.description,
      e.entry_type, e.license, e.pricing, e.best_for,
      join(e.readme_tags),
      join(tags.workflow), join(tags.output), join(tags.platform), join(tags.skill), join(tags.tech),
      e.deprecated ? 'true' : '',
      e.url_status, e.url_last_verified, e.pricing_last_verified,
      e.host_compat, e.notes,
      join(e.dual_listed_in)
    ].map(escCsv).join(',');
    rows.push(row);
    count++;
  }
  fs.writeFileSync(OUT, '\ufeff' + rows.join('\n') + '\n');
  console.log(`Wrote ${count} rows → ${OUT}`);
}

main();
