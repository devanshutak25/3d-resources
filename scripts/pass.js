#!/usr/bin/env node
// Pass driver — runs a per-chunk mutation module across the chunked catalog.
// See plan.md Step 6 and CONTEXT.md (Pass vs scan).
//
// Usage:
//   node scripts/pass.js --task=<name> [--chunk=<id>] [--apply] [--branch=<name>]
//                        [--no-branch] [--no-commit] [--resume]
//
// Default is dry-run: no writes, no git ops. Pass --apply to mutate.
//
// A pass module lives at scripts/passes/<task>.js and exports:
//   { describe, runOnChunk(chunk, ctx) -> { changed, summary } | falsy }
//
// State (resume + audit log) at _maintenance/passes/<task>-<date>.json.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const catalog = require('./lib/catalog');

function parseArgs(argv) {
  const out = { flags: {}, positional: [] };
  for (const a of argv.slice(2)) {
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq > 0) out.flags[a.slice(2, eq)] = a.slice(eq + 1);
      else out.flags[a.slice(2)] = true;
    } else out.positional.push(a);
  }
  return out;
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadPass(task) {
  const p = path.join(__dirname, 'passes', `${task}.js`);
  if (!fs.existsSync(p)) {
    console.error(`pass: no module at ${p}`);
    process.exit(2);
  }
  const mod = require(p);
  if (typeof mod.runOnChunk !== 'function') {
    console.error(`pass: ${task} must export runOnChunk(chunk, ctx)`);
    process.exit(2);
  }
  return mod;
}

function buildContextIndex() {
  // section slug + sub slug -> { section, sectionDescription, subsection, subDescription }
  const idx = new Map();
  const sections = catalog.loadSections().sections;
  for (const meta of sections) {
    const sec = catalog.loadSection(meta.file);
    for (const sub of sec.subsections || []) {
      idx.set(`${sec.slug}::${sub.slug}`, {
        section: sec.slug,
        sectionTitle: sec.title,
        sectionDescription: sec.description,
        subsection: sub.slug,
        subTitle: sub.title,
        subDescription: sub.description
      });
    }
    idx.set(`__file__::${meta.file}`, sec.slug);
  }
  return idx;
}

function ctxFor(idx, chunk) {
  const sectionSlug = idx.get(`__file__::${chunk.sectionFile}`);
  return idx.get(`${sectionSlug}::${chunk.subSlug}`) || {
    section: sectionSlug,
    subsection: chunk.subSlug
  };
}

function git(args, opts = {}) {
  return execSync(`git ${args}`, { cwd: path.join(__dirname, '..'), stdio: 'pipe', ...opts })
    .toString().trim();
}

function inGitRepo() {
  try { git('rev-parse --is-inside-work-tree'); return true; }
  catch { return false; }
}

function currentBranch() {
  return git('rev-parse --abbrev-ref HEAD');
}

function ensureBranch(name) {
  const cur = currentBranch();
  if (cur === name) return cur;
  // create or check out
  try { git(`rev-parse --verify ${name}`); git(`checkout ${name}`); }
  catch { git(`checkout -b ${name}`); }
  return name;
}

function commitChunk(chunk, summary, task) {
  const rel = path.relative(path.join(__dirname, '..'), chunk._path).replace(/\\/g, '/');
  git(`add "${rel}"`);
  // Skip empty commits if nothing actually staged (e.g., yaml-equal output).
  const staged = git('diff --cached --name-only');
  if (!staged) return false;
  const msg = `pass/${task}: ${chunk.sectionFile.replace(/\.yml$/, '')}/${chunk.subSlug}/${chunk.filename.replace(/\.yml$/, '')} — ${summary}`;
  // Use stdin to avoid shell-escape issues with the message.
  execSync(`git commit -F -`, {
    cwd: path.join(__dirname, '..'),
    input: msg,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  return true;
}

function loadState(statePath) {
  if (!fs.existsSync(statePath)) return null;
  try { return JSON.parse(fs.readFileSync(statePath, 'utf8')); }
  catch { return null; }
}

function saveState(statePath, state) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function main() {
  const { flags } = parseArgs(process.argv);
  const task = flags.task;
  if (!task) {
    console.error('pass: --task=<name> required');
    process.exit(2);
  }
  const apply = !!flags.apply;
  const onlyChunk = flags.chunk;
  const wantBranch = !flags['no-branch'];
  const wantCommit = !flags['no-commit'];
  const resume = !!flags.resume;

  const pass = loadPass(task);
  const date = today();
  const branchName = flags.branch || `pass/${task}-${date}`;
  const stateDir = path.join(__dirname, '..', '_maintenance', 'passes');
  const statePath = path.join(stateDir, `${task}-${date}.json`);

  console.log(`pass: ${task} — ${pass.describe || '(no description)'}`);
  console.log(`mode: ${apply ? 'APPLY' : 'dry-run'}`);

  // Resolve chunk set.
  const allRefs = [...catalog.listChunks()];
  const refs = onlyChunk ? allRefs.filter(r => r.id === onlyChunk) : allRefs;
  if (onlyChunk && refs.length === 0) {
    console.error(`pass: --chunk=${onlyChunk} matched nothing`);
    process.exit(2);
  }

  // Resume support.
  const prior = resume ? loadState(statePath) : null;
  const seen = new Set(prior?.chunks?.map(c => c.id) || []);
  if (resume && prior) console.log(`resume: ${seen.size} chunks already processed`);

  // Git branch.
  if (apply && wantBranch && wantCommit && inGitRepo()) {
    const status = git('status --porcelain');
    if (status) {
      console.error('pass: working tree dirty. Commit/stash first or use --no-branch --no-commit.');
      process.exit(2);
    }
    ensureBranch(branchName);
    console.log(`branch: ${branchName}`);
  }

  const idx = buildContextIndex();
  const stateChunks = prior?.chunks || [];
  let processed = 0, changed = 0, errors = 0, entriesChanged = 0;

  for (const ref of refs) {
    if (seen.has(ref.id)) continue;
    const chunk = catalog.loadChunk(ref.id);
    const ctx = ctxFor(idx, chunk);
    const before = JSON.stringify(chunk.entries);
    let result;
    try {
      result = pass.runOnChunk(chunk, ctx) || { changed: false, summary: '' };
    } catch (e) {
      errors++;
      const rec = { id: ref.id, error: e.message };
      stateChunks.push(rec);
      console.error(`✗ ${ref.id}: ${e.message}`);
      continue;
    }
    processed++;
    const after = JSON.stringify(chunk.entries);
    const realChanged = result.changed && before !== after;
    const rec = { id: ref.id, changed: realChanged, summary: result.summary || '' };
    if (realChanged) {
      changed++;
      entriesChanged += result.entriesChanged || 0;
      if (apply) {
        catalog.saveChunk(chunk);
        if (wantCommit && inGitRepo()) {
          try { commitChunk(chunk, result.summary || 'updated', task); }
          catch (e) { console.error(`  commit failed: ${e.message}`); rec.commitError = e.message; }
        }
      }
      console.log(`${apply ? '✓' : '·'} ${ref.id} — ${result.summary || 'changed'}`);
    } else if (process.env.PASS_VERBOSE) {
      console.log(`  ${ref.id} — no change`);
    }
    stateChunks.push(rec);
  }

  const state = {
    task, date, mode: apply ? 'apply' : 'dry-run',
    chunksProcessed: processed,
    chunksChanged: changed,
    entriesChanged,
    errors,
    chunks: stateChunks
  };
  if (apply) saveState(statePath, state);

  console.log(`\nprocessed: ${processed}, changed: ${changed}, entries: ${entriesChanged}, errors: ${errors}`);
  if (apply) {
    console.log(`state: ${path.relative(path.join(__dirname, '..'), statePath).replace(/\\/g, '/')}`);
    if (wantBranch && wantCommit && inGitRepo()) {
      console.log(`next: git push -u origin ${branchName} && gh pr create --draft`);
    }
  } else {
    console.log('(dry-run — pass --apply to write & commit)');
  }
}

main();
