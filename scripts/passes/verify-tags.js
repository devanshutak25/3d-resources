// Pass: verify-tags
// Drops unknown values from closed-enum tag groups (workflow, output, platform, skill),
// dedupes within each group, removes empty groups, removes empty `tags` objects.
// Open `tech` group: dedupe only (open vocab — validate.js warns on unknown).
// Also drops unknown `entry_type` and `license` so the entry parses cleanly.
//
// Idempotent. Per-chunk. No cross-chunk reads.

const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const VOCAB_PATH = path.join(__dirname, '..', '..', 'schema', 'vocab.yml');
const vocab = yaml.load(fs.readFileSync(VOCAB_PATH, 'utf8'));

const CLOSED = {
  workflow: new Set(vocab.workflow),
  output: new Set(vocab.output),
  platform: new Set(vocab.platform),
  skill: new Set(vocab.skill)
};
const ENTRY_TYPE = new Set(vocab.entry_type);
const LICENSE = new Set(vocab.license);

function dedupe(arr) {
  const seen = new Set();
  const out = [];
  for (const v of arr) {
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function runOnChunk(chunk, _ctx) {
  let touched = 0;
  const removals = [];

  for (const e of chunk.entries) {
    let entryChanged = false;

    if (e.entry_type !== undefined && !ENTRY_TYPE.has(e.entry_type)) {
      removals.push(`entry_type=${e.entry_type}`);
      delete e.entry_type;
      entryChanged = true;
    }
    if (e.license !== undefined && e.license !== null && !LICENSE.has(e.license)) {
      removals.push(`license=${e.license}`);
      delete e.license;
      entryChanged = true;
    }

    if (e.tags && typeof e.tags === 'object') {
      for (const group of Object.keys(CLOSED)) {
        const arr = e.tags[group];
        if (!Array.isArray(arr)) continue;
        const valid = vocab[group];
        const set = CLOSED[group];
        const before = arr.slice();
        const cleaned = dedupe(arr.filter(v => set.has(v)));
        const dropped = before.filter(v => !set.has(v));
        if (dropped.length) {
          removals.push(`${group}:[${dropped.join(',')}]`);
        }
        if (cleaned.length === 0) {
          if (arr.length !== 0) entryChanged = true;
          delete e.tags[group];
        } else if (cleaned.length !== before.length || cleaned.some((v, i) => v !== before[i])) {
          e.tags[group] = cleaned;
          entryChanged = true;
        }
        // mention vocab to avoid lint complaint about unused
        void valid;
      }

      if (Array.isArray(e.tags.tech)) {
        const before = e.tags.tech;
        const cleaned = dedupe(before);
        if (cleaned.length === 0) { delete e.tags.tech; entryChanged = true; }
        else if (cleaned.length !== before.length) { e.tags.tech = cleaned; entryChanged = true; }
      }

      if (Object.keys(e.tags).length === 0) {
        delete e.tags;
        entryChanged = true;
      }
    }

    if (entryChanged) touched++;
  }

  if (touched === 0) return { changed: false, summary: '' };

  const summary = removals.length
    ? `verify-tags: ${touched} entries cleaned (${removals.length} removals)`
    : `verify-tags: ${touched} entries normalized`;
  return { changed: true, summary, entriesChanged: touched };
}

module.exports = {
  describe: 'Drop unknown closed-enum tag values, dedupe groups, remove empty tags.',
  runOnChunk
};
