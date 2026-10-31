#!/usr/bin/env node
// Validates all data/*.yml against schema + vocab + duplicate checks.
// Exits non-zero on any failure. Used by CI.

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const catalog = require('./lib/catalog');

const SCHEMA_PATH = path.join(__dirname, '..', 'schema', 'entry.schema.json');
const VOCAB_PATH = path.join(__dirname, '..', 'schema', 'vocab.yml');

const errors = [];
const warnings = [];

function loadYaml(p) {
  return yaml.load(fs.readFileSync(p, 'utf8'));
}

function validateSchema() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  const validate = ajv.compile(schema);

  for (const { sectionFile, subSlug, entry } of catalog.iterEntries()) {
    if (!validate(entry)) {
      for (const err of validate.errors) {
        errors.push(`${sectionFile} :: ${subSlug} :: ${entry.name || entry.url}: ${err.instancePath} ${err.message}`);
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

  const techSeen = new Set();
  for (const { sectionFile, subSlug, entry } of catalog.iterEntries()) {
    const loc = `${sectionFile} :: ${subSlug} :: ${entry.name}`;
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

function validateDuplicates() {
  // Cross-section duplicates of the same URL are storage errors after the
  // canonical+mirror migration. The canonical entry should live in one chunk
  // and surface elsewhere via dual_listed_in: ["<section>/<sub>", ...].
  const urlMap = new Map();
  const fileToSlug = new Map();
  const slugToFile = new Map();
  const validSubs = new Set(); // "<section-slug>/<sub-slug>"
  for (const meta of catalog.loadSections().sections) {
    const sec = catalog.loadSection(meta.file);
    fileToSlug.set(meta.file, sec.slug);
    slugToFile.set(sec.slug, meta.file);
    for (const sub of sec.subsections || []) validSubs.add(`${sec.slug}/${sub.slug}`);
  }
  for (const { sectionFile, subSlug, entry } of catalog.iterEntries()) {
    const url = normalizeUrl(entry.url);
    if (!urlMap.has(url)) urlMap.set(url, []);
    urlMap.get(url).push({
      section: fileToSlug.get(sectionFile),
      subsection: subSlug,
      name: entry.name,
      dual_listed_in: entry.dual_listed_in || [],
      file: sectionFile
    });
    // Validate dual_listed_in paths exist
    for (const p of entry.dual_listed_in || []) {
      if (!validSubs.has(p)) {
        errors.push(`${sectionFile} :: ${subSlug} :: ${entry.name}: dual_listed_in "${p}" is not a valid <section-slug>/<sub-slug>`);
      }
      const [secSlug, subOnly] = String(p).split('/');
      if (secSlug === fileToSlug.get(sectionFile) && subOnly === subSlug) {
        warnings.push(`${sectionFile} :: ${subSlug} :: ${entry.name}: dual_listed_in references its own primary slot`);
      }
    }
  }
  for (const [url, places] of urlMap) {
    if (places.length < 2) continue;
    const sectionSlugs = new Set(places.map(p => p.section));
    if (sectionSlugs.size < 2) continue; // same-section dupes are intentional
    warnings.push(`${url}: stored in ${places.length} chunks across sections [${[...sectionSlugs].join(', ')}] — consolidate to one canonical + dual_listed_in mirrors`);
  }
}

const { canonicalUrl: normalizeUrl } = require('./lib/canonical-url');

// Studios directory (data/studios/). Own schema; country must be in the closed
// COUNTRY_REGION list; descriptions follow the CLAUDE.md writing rules.
const BANNED = /—|\b(comprehensive|robust|powerful|seamless(ly)?|leverag(e|es|ed|ing)|utiliz(e|es|ed|ing)|cutting-edge|state-of-the-art|the ultimate|game-changing|unleash)\b|\b(and more|and beyond|and so much more)\.?$/i;

function validateStudios() {
  const { COUNTRY_REGION } = require('./lib/studios');
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'schema', 'studio.schema.json'), 'utf8')));
  const urls = new Map();
  const names = new Map();
  for (const { file, studios } of catalog.loadStudioChunks()) {
    if (studios.length > catalog.CHUNK_CAP) errors.push(`studios/${file}: ${studios.length} studios (cap ${catalog.CHUNK_CAP})`);
    for (const s of studios) {
      const loc = `studios/${file} :: ${s.name || s.url}`;
      if (!validate(s)) {
        for (const err of validate.errors) errors.push(`${loc}: ${err.instancePath} ${err.message}`);
      }
      for (const p of [s.hq, ...(s.offices || [])]) {
        if (p && p.country && !COUNTRY_REGION[p.country]) errors.push(`${loc}: unknown country "${p.country}" (add it to scripts/lib/studios.js)`);
      }
      if (BANNED.test(s.description || '')) errors.push(`${loc}: description breaks writing rules (em-dash or banned phrase)`);
      const u = normalizeUrl(s.url);
      if (urls.has(u)) errors.push(`${loc}: duplicate url (also ${urls.get(u)})`);
      urls.set(u, loc);
      const n = String(s.name || '').toLowerCase();
      if (names.has(n)) warnings.push(`${loc}: duplicate name (also ${names.get(n)})`);
      names.set(n, loc);
    }
  }
}

function main() {
  validateSchema();
  validateVocab();
  validateDuplicates();
  validateStudios();

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
