#!/usr/bin/env node
// Exports data/ chunked tree → JSON index for client-side filtering.
// Output: { entries: [{ url, name, license, tags, section, subsection }] }

const fs = require('fs');
const path = require('path');
const catalog = require('./lib/catalog');
const { slugify } = require('./lib/slugify');

function main() {
  const outPath = process.argv[2];
  if (!outPath) {
    console.error('Usage: node export-data.js <output-path>');
    process.exit(1);
  }

  const fileToSlug = new Map();
  const sections = [];
  for (const meta of catalog.loadSections().sections) {
    const section = catalog.loadSection(meta.file);
    fileToSlug.set(meta.file, section.slug);
    sections.push({ slug: section.slug, anchor: slugify(section.title) });
  }

  function row(e, section, subsection) {
    return {
      url: e.url,
      name: e.name,
      description: e.description || '',
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

  // One row per (subsection, url): a URL stored twice, or mirrored into its own
  // primary subsection, must not show up as two rows in the filter UI.
  const entries = [];
  const seen = new Set();
  const push = (e, sec, sub) => {
    const k = `${sec}/${sub}|${String(e.url || e.name).toLowerCase()}`;
    if (seen.has(k)) return;
    seen.add(k);
    entries.push(row(e, sec, sub));
  };
  for (const { sectionFile, subSlug, entry: e } of catalog.iterEntries()) {
    if (e.deprecated) continue;
    push(e, fileToSlug.get(sectionFile), subSlug);
    for (const path of e.dual_listed_in || []) {
      const [secSlug, subOnly] = String(path).split('/');
      if (!secSlug || !subOnly) continue;
      push(e, secSlug, subOnly);
    }
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ sections, entries }, null, 0));
  console.log(`Wrote ${entries.length} entries → ${outPath}`);
}

main();
