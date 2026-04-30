#!/usr/bin/env node
// One-shot migration: flat data/NN-section.yml → chunked data/NN-section/<sub>/NN-<sub>.yml.
// Archive after successful run (see scripts/_archive/README.md).

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CAP = 50;
const DUMP_OPTS = { lineWidth: -1, noRefs: true, sortKeys: false };

function dump(obj) {
  return yaml.dump(obj, DUMP_OPTS);
}

function migrateSection(meta) {
  const sectionPath = path.join(DATA_DIR, meta.file);
  const section = yaml.load(fs.readFileSync(sectionPath, 'utf8'));
  const baseDir = sectionPath.replace(/\.yml$/, '');
  fs.mkdirSync(baseDir, { recursive: true });

  const newSubs = [];
  for (const sub of section.subsections || []) {
    const entries = sub.entries || [];
    const subDir = path.join(baseDir, sub.slug);
    fs.mkdirSync(subDir, { recursive: true });

    let chunkCount = 0;
    if (entries.length === 0) {
      chunkCount = 1;
      const file = path.join(subDir, `01-${sub.slug}.yml`);
      fs.writeFileSync(file, dump({ entries: [] }));
    } else {
      for (let i = 0; i < entries.length; i += CAP) {
        chunkCount++;
        const idx = String(chunkCount).padStart(2, '0');
        const file = path.join(subDir, `${idx}-${sub.slug}.yml`);
        fs.writeFileSync(file, dump({ entries: entries.slice(i, i + CAP) }));
      }
    }

    const subMeta = { slug: sub.slug, title: sub.title };
    if (sub.description) subMeta.description = sub.description;
    subMeta.chunks = chunkCount;
    newSubs.push(subMeta);
  }

  const newSection = { slug: section.slug, title: section.title };
  if (section.description) newSection.description = section.description;
  newSection.subsections = newSubs;
  fs.writeFileSync(sectionPath, dump(newSection));

  const totalEntries = (section.subsections || []).reduce((n, s) => n + (s.entries || []).length, 0);
  const totalChunks = newSubs.reduce((n, s) => n + s.chunks, 0);
  console.log(`${meta.file}: ${section.subsections?.length || 0} subs, ${totalEntries} entries → ${totalChunks} chunks`);
}

function main() {
  const sections = yaml.load(fs.readFileSync(path.join(DATA_DIR, 'sections.yml'), 'utf8')).sections;
  for (const meta of sections) migrateSection(meta);
  console.log('migration complete.');
}
main();
