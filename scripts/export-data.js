#!/usr/bin/env node
// Exports data/ chunked tree → JSON index for client-side filtering.
// Output: { entries: [{ url, name, license, tags, section, subsection }] }

const fs = require('fs');
const path = require('path');
const catalog = require('./lib/catalog');

function main() {
  const outPath = process.argv[2];
  if (!outPath) {
    console.error('Usage: node export-data.js <output-path>');
    process.exit(1);
  }

  const fileToSlug = new Map();
  for (const meta of catalog.loadSections().sections) {
    fileToSlug.set(meta.file, catalog.loadSection(meta.file).slug);
  }

  function row(e, section, subsection) {
    return {
      url: e.url,
      name: e.name,
      license: e.license || null,
      entry_type: e.entry_type || null,
      section,
      subsection,
      tags: {
        workflow: (e.tags && e.tags.workflow) || [],
        output: (e.tags && e.tags.output) || [],
        platform: (e.tags && e.tags.platform) || [],
        skill: (e.tags && e.tags.skill) || [],
        tech: (e.tags && e.tags.tech) || []
      }
    };
  }

  const entries = [];
  for (const { sectionFile, subSlug, entry: e } of catalog.iterEntries()) {
    const primarySection = fileToSlug.get(sectionFile);
    entries.push(row(e, primarySection, subSlug));
    for (const path of e.dual_listed_in || []) {
      const [secSlug, subOnly] = String(path).split('/');
      if (!secSlug || !subOnly) continue;
      entries.push(row(e, secSlug, subOnly));
    }
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ entries }, null, 0));
  console.log(`Wrote ${entries.length} entries → ${outPath}`);
}

main();
