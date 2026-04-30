// Catalog — single seam over the chunked data/ tree.
// All scripts read/write data/ through this module. See ADR-0001.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const CHUNK_CAP = 50;

function loadYaml(p) {
  return yaml.load(fs.readFileSync(p, 'utf8'));
}

function dumpYaml(obj) {
  return yaml.dump(obj, { lineWidth: -1, noRefs: true });
}

function loadSections() {
  return loadYaml(path.join(DATA_DIR, 'sections.yml'));
}

function sectionFileFromSlug(slug) {
  const sections = loadSections();
  const meta = sections.sections.find(s => s.slug === slug);
  if (!meta) throw new Error(`Unknown section slug: ${slug}`);
  return meta.file;
}

function loadSection(slugOrFile) {
  const sections = loadSections();
  let meta = sections.sections.find(s => s.slug === slugOrFile || s.file === slugOrFile);
  if (!meta) throw new Error(`Unknown section: ${slugOrFile}`);
  const section = loadYaml(path.join(DATA_DIR, meta.file));
  return { ...section, _file: meta.file };
}

function chunkDir(sectionFile, subSlug) {
  return path.join(DATA_DIR, sectionFile.replace(/\.yml$/, ''), subSlug);
}

function chunkPath(sectionFile, subSlug, filename) {
  return path.join(chunkDir(sectionFile, subSlug), filename);
}

function chunkId(sectionFile, subSlug, filename) {
  // e.g. "01-assets/asset-marketplaces/01-asset-marketplaces"
  const sectionDir = sectionFile.replace(/\.yml$/, '');
  return `${sectionDir}/${subSlug}/${filename.replace(/\.yml$/, '')}`;
}

function parseChunkId(id) {
  // returns {sectionFile, subSlug, filename}
  const parts = id.split('/');
  if (parts.length !== 3) throw new Error(`Bad chunk id: ${id}`);
  const [sectionDir, subSlug, base] = parts;
  return {
    sectionFile: `${sectionDir}.yml`,
    subSlug,
    filename: `${base}.yml`
  };
}

function listChunkFiles(sectionFile, subSlug) {
  const dir = chunkDir(sectionFile, subSlug);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.yml')).sort();
}

function* listChunks() {
  const sections = loadSections();
  for (const meta of sections.sections) {
    const sectionPath = path.join(DATA_DIR, meta.file);
    if (!fs.existsSync(sectionPath)) continue;
    const section = loadYaml(sectionPath);
    for (const sub of section.subsections || []) {
      for (const filename of listChunkFiles(meta.file, sub.slug)) {
        yield {
          id: chunkId(meta.file, sub.slug, filename),
          sectionFile: meta.file,
          sectionSlug: section.slug,
          subSlug: sub.slug,
          filename
        };
      }
    }
  }
}

function loadChunkAt(sectionFile, subSlug, filename) {
  const p = chunkPath(sectionFile, subSlug, filename);
  const raw = loadYaml(p) || {};
  return {
    id: chunkId(sectionFile, subSlug, filename),
    sectionFile,
    subSlug,
    filename,
    entries: raw.entries || [],
    _path: p
  };
}

function loadChunk(id) {
  const { sectionFile, subSlug, filename } = parseChunkId(id);
  return loadChunkAt(sectionFile, subSlug, filename);
}

function saveChunk(chunk) {
  if (!chunk._path) throw new Error('saveChunk: chunk missing _path');
  const tmp = chunk._path + '.tmp';
  fs.writeFileSync(tmp, dumpYaml({ entries: chunk.entries }));
  fs.renameSync(tmp, chunk._path);
}

function* iterChunks() {
  for (const ref of listChunks()) {
    yield loadChunkAt(ref.sectionFile, ref.subSlug, ref.filename);
  }
}

function* iterEntries() {
  for (const chunk of iterChunks()) {
    for (const entry of chunk.entries) {
      yield {
        sectionFile: chunk.sectionFile,
        subSlug: chunk.subSlug,
        chunk,
        entry
      };
    }
  }
}

function appendEntry(sectionSlug, subSlug, entry) {
  const sectionFile = sectionFileFromSlug(sectionSlug);
  const files = listChunkFiles(sectionFile, subSlug);
  let target;
  if (files.length === 0) {
    const filename = `01-${subSlug}.yml`;
    const dir = chunkDir(sectionFile, subSlug);
    fs.mkdirSync(dir, { recursive: true });
    target = {
      id: chunkId(sectionFile, subSlug, filename),
      sectionFile, subSlug, filename,
      entries: [entry],
      _path: chunkPath(sectionFile, subSlug, filename)
    };
  } else {
    const lastFile = files[files.length - 1];
    const last = loadChunkAt(sectionFile, subSlug, lastFile);
    if (last.entries.length < CHUNK_CAP) {
      last.entries.push(entry);
      target = last;
    } else {
      const nextIdx = String(files.length + 1).padStart(2, '0');
      const filename = `${nextIdx}-${subSlug}.yml`;
      target = {
        id: chunkId(sectionFile, subSlug, filename),
        sectionFile, subSlug, filename,
        entries: [entry],
        _path: chunkPath(sectionFile, subSlug, filename)
      };
    }
  }
  saveChunk(target);
  return target;
}

module.exports = {
  CHUNK_CAP,
  DATA_DIR,
  loadSections,
  loadSection,
  listChunks,
  loadChunk,
  saveChunk,
  iterChunks,
  iterEntries,
  appendEntry
};
