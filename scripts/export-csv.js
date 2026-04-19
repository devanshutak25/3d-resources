#!/usr/bin/env node
// Exports every entry in data/*.yml to a single CSV.

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
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
  const sections = yaml.load(fs.readFileSync(path.join(DATA_DIR, 'sections.yml'), 'utf8'));
  const rows = [COLUMNS.join(',')];
  let count = 0;
  for (const meta of sections.sections) {
    const fp = path.join(DATA_DIR, meta.file);
    if (!fs.existsSync(fp)) continue;
    const doc = yaml.load(fs.readFileSync(fp, 'utf8'));
    for (const sub of doc.subsections || []) {
      for (const e of sub.entries || []) {
        const tags = e.tags || {};
        const row = [
          doc.slug,
          sub.slug,
          e.name,
          e.url,
          e.description,
          e.entry_type,
          e.license,
          e.pricing,
          e.best_for,
          join(e.readme_tags),
          join(tags.workflow),
          join(tags.output),
          join(tags.platform),
          join(tags.skill),
          join(tags.tech),
          e.deprecated ? 'true' : '',
          e.url_status,
          e.url_last_verified,
          e.pricing_last_verified,
          e.host_compat,
          e.notes,
          join(e.dual_listed_in)
        ].map(escCsv).join(',');
        rows.push(row);
        count++;
      }
    }
  }
  // Write with UTF-8 BOM so Excel opens it correctly
  fs.writeFileSync(OUT, '\ufeff' + rows.join('\n') + '\n');
  console.log(`Wrote ${count} rows → ${OUT}`);
}

main();
