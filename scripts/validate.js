#!/usr/bin/env node
// Validates all data/*.yml against schema + vocab + duplicate checks.
// Exits non-zero on any failure. Used by CI.

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SCHEMA_PATH = path.join(__dirname, '..', 'schema', 'entry.schema.json');
const VOCAB_PATH = path.join(__dirname, '..', 'schema', 'vocab.yml');

const errors = [];
const warnings = [];

function loadYaml(p) {
  return yaml.load(fs.readFileSync(p, 'utf8'));
}

function loadSubEntries(sectionFile, subSlug) {
  const subDir = path.join(DATA_DIR, sectionFile.replace(/\.yml$/, ''), subSlug);
  if (!fs.existsSync(subDir)) return [];
  const files = fs.readdirSync(subDir).filter(f => f.endsWith('.yml')).sort();
  const entries = [];
  for (const f of files) {
    const c = loadYaml(path.join(subDir, f));
    if (c && c.entries) entries.push(...c.entries);
  }
  return entries;
}

function validateSchema() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  const validate = ajv.compile(schema);

  const sections = loadYaml(path.join(DATA_DIR, 'sections.yml'));
  for (const meta of sections.sections) {
    const file = path.join(DATA_DIR, meta.file);
    if (!fs.existsSync(file)) {
      errors.push(`Missing data file: ${meta.file}`);
      continue;
    }
    const section = loadYaml(file);
    for (const sub of section.subsections || []) {
      for (const entry of loadSubEntries(meta.file, sub.slug)) {
        if (!validate(entry)) {
          for (const err of validate.errors) {
            errors.push(`${meta.file} :: ${sub.slug} :: ${entry.name || entry.url}: ${err.instancePath} ${err.message}`);
          }
        }
      }
    }
  }
}

function validateVocab() {
  const vocab = loadYaml(VOCAB_PATH);
  const controlled = {
    license: new Set([...vocab.license, null]),
    entry_type: new Set(vocab.entry_type),
    workflow: new Set(vocab.workflow),
    output: new Set(vocab.output),
    platform: new Set(vocab.platform),
    skill: new Set(vocab.skill)
  };
  const techVocab = new Set(vocab.tech);

  const sections = loadYaml(path.join(DATA_DIR, 'sections.yml'));
  const techSeen = new Set();
  for (const meta of sections.sections) {
    const file = path.join(DATA_DIR, meta.file);
    if (!fs.existsSync(file)) continue;
    const section = loadYaml(file);
    for (const sub of section.subsections || []) {
      for (const entry of loadSubEntries(meta.file, sub.slug)) {
        const loc = `${meta.file} :: ${sub.slug} :: ${entry.name}`;
        if (entry.license !== undefined && !controlled.license.has(entry.license)) {
          errors.push(`${loc}: unknown license "${entry.license}"`);
        }
        if (entry.entry_type && !controlled.entry_type.has(entry.entry_type)) {
          errors.push(`${loc}: unknown entry_type "${entry.entry_type}"`);
        }
        if (entry.tags) {
          for (const group of ['workflow', 'output', 'platform', 'skill']) {
            for (const v of entry.tags[group] || []) {
              if (!controlled[group].has(v)) {
                errors.push(`${loc}: unknown ${group} tag "${v}"`);
              }
            }
          }
          for (const v of entry.tags.tech || []) {
            techSeen.add(v);
            if (!techVocab.has(v)) {
              warnings.push(`${loc}: tech tag "${v}" not in vocab.yml (freeform allowed but consider adding)`);
            }
          }
        }
      }
    }
  }
}

function validateDuplicates() {
  // Entries with same URL across sections should be explicitly dual-listed.
  const urlMap = new Map(); // normalized url → [{section, subsection, name, dual_listed_in}]
  const sections = loadYaml(path.join(DATA_DIR, 'sections.yml'));
  for (const meta of sections.sections) {
    const file = path.join(DATA_DIR, meta.file);
    if (!fs.existsSync(file)) continue;
    const section = loadYaml(file);
    for (const sub of section.subsections || []) {
      for (const entry of loadSubEntries(meta.file, sub.slug)) {
        const url = normalizeUrl(entry.url);
        if (!urlMap.has(url)) urlMap.set(url, []);
        urlMap.get(url).push({
          section: section.slug,
          subsection: sub.slug,
          name: entry.name,
          dual_listed_in: entry.dual_listed_in || [],
          file: meta.file
        });
      }
    }
  }
  for (const [url, places] of urlMap) {
    if (places.length < 2) continue;
    const sectionSlugs = new Set(places.map(p => p.section));
    if (sectionSlugs.size < 2) continue; // same-section duplicates are intentional (e.g., pipeline overview)
    // Check each occurrence is properly dual-listed
    for (const p of places) {
      const otherSections = new Set(places.filter(x => x.section !== p.section).map(x => x.section));
      const declared = new Set(p.dual_listed_in);
      const missing = [...otherSections].filter(s => !declared.has(s));
      if (missing.length) {
        warnings.push(`${p.file} :: ${p.subsection} :: ${p.name} (${url}): also in [${missing.join(', ')}] but dual_listed_in missing those`);
      }
    }
  }
}

function normalizeUrl(u) {
  try {
    const url = new URL(u);
    url.hash = '';
    let s = url.toString();
    if (s.endsWith('/') && url.pathname !== '/') s = s.slice(0, -1);
    return s;
  } catch (e) { return u; }
}

function main() {
  validateSchema();
  validateVocab();
  validateDuplicates();

  if (warnings.length) {
    console.log(`\n⚠ Warnings (${warnings.length}):`);
    warnings.forEach(w => console.log('  ' + w));
  }
  if (errors.length) {
    console.error(`\n✗ Errors (${errors.length}):`);
    errors.forEach(e => console.error('  ' + e));
    process.exit(1);
  }
  console.log(`\n✓ Validation passed. ${warnings.length} warnings.`);
}

main();
