#!/usr/bin/env node
// Exports data/*.yml → JSON index for client-side filtering.
// Output: { entries: [{ url, name, license, tags, section, subsection }] }

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function main() {
  const outPath = process.argv[2];
  if (!outPath) {
    console.error('Usage: node export-data.js <output-path>');
    process.exit(1);
  }

  const sectionsFile = yaml.load(fs.readFileSync(path.join(DATA_DIR, 'sections.yml'), 'utf8'));
  const entries = [];

  for (const meta of sectionsFile.sections) {
    const full = path.join(DATA_DIR, meta.file);
    if (!fs.existsSync(full)) continue;
    const section = yaml.load(fs.readFileSync(full, 'utf8'));
    for (const sub of section.subsections || []) {
      for (const e of sub.entries || []) {
        entries.push({
          url: e.url,
          name: e.name,
          license: e.license || null,
          entry_type: e.entry_type || null,
          section: section.slug,
          subsection: sub.slug,
          tags: {
            workflow: (e.tags && e.tags.workflow) || [],
            output: (e.tags && e.tags.output) || [],
            platform: (e.tags && e.tags.platform) || [],
            skill: (e.tags && e.tags.skill) || [],
            tech: (e.tags && e.tags.tech) || []
          }
        });
      }
    }
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ entries }, null, 0));
  console.log(`Wrote ${entries.length} entries → ${outPath}`);
}

main();
