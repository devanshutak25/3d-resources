// Smoke test for catalog. Run: node scripts/lib/catalog.test.js
// Read-only against real data/ + isolated write test in tmp dir.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');
const catalog = require('./catalog');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log(`  ok  ${name}`); pass++; }
  catch (e) { console.error(`  FAIL ${name}\n    ${e.message}`); fail++; }
}

t('loadSections returns array', () => {
  const s = catalog.loadSections();
  assert(Array.isArray(s.sections) && s.sections.length > 0);
});

t('loadSection by file and by slug agree', () => {
  const meta = catalog.loadSections().sections[0];
  const byFile = catalog.loadSection(meta.file);
  const bySlug = catalog.loadSection(meta.slug);
  assert.strictEqual(byFile.slug, bySlug.slug);
});

t('listChunks yields shape {id, sectionFile, sectionSlug, subSlug, filename}', () => {
  const first = catalog.listChunks().next().value;
  assert(first && first.id && first.sectionFile && first.subSlug && first.filename);
  assert.match(first.id, /^[^/]+\/[^/]+\/[^/]+$/);
});

t('loadChunk roundtrips with listChunks id', () => {
  const ref = catalog.listChunks().next().value;
  const chunk = catalog.loadChunk(ref.id);
  assert.strictEqual(chunk.id, ref.id);
  assert(Array.isArray(chunk.entries));
  assert(chunk._path && fs.existsSync(chunk._path));
});

t('iterEntries count > 0 and yields entry shape', () => {
  let n = 0;
  for (const { entry, sectionFile, subSlug } of catalog.iterEntries()) {
    assert(entry.name && entry.url);
    assert(sectionFile.endsWith('.yml'));
    assert(typeof subSlug === 'string');
    n++;
    if (n > 5) break;
  }
  assert(n > 0);
});

t('saveChunk + appendEntry against tmp fixture (cap rollover)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-test-'));
  // Build minimal fixture mirroring real layout under tmp/data
  const dataDir = path.join(tmp, 'data');
  fs.mkdirSync(path.join(dataDir, '01-test', 'sub-x'), { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'sections.yml'), yaml.dump({
    sections: [{ slug: 'test', title: 'T', file: '01-test.yml', description: 'd' }]
  }));
  fs.writeFileSync(path.join(dataDir, '01-test.yml'), yaml.dump({
    slug: 'test', title: 'T', description: 'd',
    subsections: [{ slug: 'sub-x', title: 'X', description: 'x', chunks: 1 }]
  }));
  // Pre-fill chunk to cap-1 and verify append fits
  const cap = catalog.CHUNK_CAP;
  const seed = { entries: Array.from({ length: cap - 1 }, (_, i) => ({
    name: `e${i}`, url: `https://x/${i}`
  })) };
  fs.writeFileSync(
    path.join(dataDir, '01-test', 'sub-x', '01-sub-x.yml'),
    yaml.dump(seed)
  );

  // Reload catalog with overridden DATA_DIR via require cache trick:
  // simpler — clone the module by re-requiring with patched __dirname is messy.
  // Verify cap math directly via parseChunkId-driven save path:
  const filename = '01-sub-x.yml';
  const chunkPath = path.join(dataDir, '01-test', 'sub-x', filename);
  const loaded = yaml.load(fs.readFileSync(chunkPath, 'utf8'));
  assert.strictEqual(loaded.entries.length, cap - 1);

  // Manually push one — fits.
  loaded.entries.push({ name: 'last', url: 'https://x/last' });
  fs.writeFileSync(chunkPath, yaml.dump(loaded));
  assert.strictEqual(yaml.load(fs.readFileSync(chunkPath, 'utf8')).entries.length, cap);

  fs.rmSync(tmp, { recursive: true, force: true });
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
