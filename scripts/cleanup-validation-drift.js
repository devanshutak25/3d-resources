#!/usr/bin/env node
// Normalize license values, strip non-schema fields, fold misfit→notes.
// Run: node scripts/cleanup-validation-drift.js [--dry]

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DRY = process.argv.includes('--dry');
const DATA_ROOT = path.join(__dirname, '..', 'data');

const LICENSE_MAP = {
  proprietary: 'Paid',
  commercial: 'Paid',
  paid: 'Paid',
  freemium: 'Freemium',
  mixed: 'Freemium',
  free: 'Free',
  'open-source': 'Open Source',
  opensource: 'Open Source',
  Opensource: 'Open Source',
  'gpl-3.0': 'Open Source',
  'GPL-3.0': 'Open Source',
  apache: 'Open Source',
  'Apache 2.0': 'Open Source',
  mit: 'Open Source',
  MIT: 'Open Source',
  editorial: null,
  'user-content': null,
  unknown: null,
};

const PLATFORM_EXPAND = {
  'cross-platform': ['win', 'mac', 'linux'],
  desktop: ['win', 'mac', 'linux'],
  windows: ['win'],
};

const ENTRY_ALLOWED = new Set([
  'name', 'url', 'description', 'pricing', 'best_for', 'license', 'entry_type',
  'tags', 'readme_tags', 'notes', 'dual_listed_in', 'priority', 'deprecated',
  'version_sensitive', 'pricing_last_verified', 'url_last_verified',
  'url_status', 'review_cadence', 'host_compat',
]);

const TAGS_ALLOWED = new Set(['workflow', 'output', 'platform', 'skill', 'tech']);

const VALID_LICENSE = new Set(['Open Source', 'Free', 'Free NC', 'Freemium', 'Paid']);

let stats = {
  files: 0,
  licenseFixed: 0,
  licenseDropped: 0,
  topPlatformMoved: 0,
  platformExpanded: 0,
  misfitFolded: 0,
  extraFieldsDropped: 0,
  extraTagsDropped: 0,
};

function normalizeLicense(val) {
  if (val == null) return val;
  if (VALID_LICENSE.has(val)) return val;
  const key = String(val);
  if (key in LICENSE_MAP) return LICENSE_MAP[key];
  const lower = key.toLowerCase();
  if (lower in LICENSE_MAP) return LICENSE_MAP[lower];
  return undefined; // unmapped — caller decides
}

function expandPlatforms(arr) {
  if (!Array.isArray(arr)) return arr;
  const out = new Set();
  let changed = false;
  for (const p of arr) {
    if (p in PLATFORM_EXPAND) {
      changed = true;
      for (const x of PLATFORM_EXPAND[p]) out.add(x);
    } else {
      out.add(p);
    }
  }
  if (changed) stats.platformExpanded++;
  return Array.from(out);
}

function appendNote(entry, addition) {
  if (!addition) return;
  if (entry.notes) {
    if (!entry.notes.includes(addition)) {
      entry.notes = `${entry.notes} | ${addition}`;
    }
  } else {
    entry.notes = addition;
  }
}

function cleanEntry(entry) {
  // 1. License normalization
  if ('license' in entry) {
    const norm = normalizeLicense(entry.license);
    if (norm === undefined) {
      // unmapped — leave alone, will be flagged by validator
    } else if (norm === null) {
      delete entry.license;
      stats.licenseDropped++;
    } else if (norm !== entry.license) {
      entry.license = norm;
      stats.licenseFixed++;
    }
  }

  // 2. Top-level `platform:` → tags.platform
  if (entry.platform) {
    const top = Array.isArray(entry.platform) ? entry.platform : [entry.platform];
    entry.tags = entry.tags || {};
    const existing = entry.tags.platform || [];
    entry.tags.platform = Array.from(new Set([...existing, ...top]));
    delete entry.platform;
    stats.topPlatformMoved++;
  }

  // 3. Misfit fields → notes
  if (entry.misfit || entry.misfit_reason) {
    const reason = entry.misfit_reason || 'misfit flagged';
    appendNote(entry, `RELOCATE: ${reason}`);
    delete entry.misfit;
    delete entry.misfit_reason;
    stats.misfitFolded++;
  }

  // 4. Strip non-schema entry fields
  for (const key of Object.keys(entry)) {
    if (!ENTRY_ALLOWED.has(key)) {
      delete entry[key];
      stats.extraFieldsDropped++;
    }
  }

  // 5. Strip non-schema tag children + expand bad platforms
  if (entry.tags && typeof entry.tags === 'object') {
    for (const key of Object.keys(entry.tags)) {
      if (!TAGS_ALLOWED.has(key)) {
        delete entry.tags[key];
        stats.extraTagsDropped++;
      }
    }
    if (entry.tags.platform) {
      entry.tags.platform = expandPlatforms(entry.tags.platform);
    }
    if (Object.keys(entry.tags).length === 0) delete entry.tags;
  }
}

function processFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  let doc;
  try {
    doc = yaml.load(raw);
  } catch (e) {
    console.error(`PARSE FAIL: ${file}: ${e.message}`);
    return;
  }
  if (!doc || !Array.isArray(doc.entries)) return;
  const before = JSON.stringify(doc);
  for (const entry of doc.entries) cleanEntry(entry);
  const after = JSON.stringify(doc);
  if (before === after) return;
  stats.files++;
  if (DRY) return;
  const out = yaml.dump(doc, {
    lineWidth: -1,
    noRefs: true,
    quotingType: "'",
    forceQuotes: false,
  });
  fs.writeFileSync(file, out);
}

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.isFile() && ent.name.endsWith('.yml')) processFile(full);
  }
}

walk(DATA_ROOT);
console.log(JSON.stringify(stats, null, 2));
