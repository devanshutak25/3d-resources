#!/usr/bin/env node
// Runs every scripts/lib/*.test.js in its own process. Used by `npm test` and CI,
// so a new test file is picked up without editing package.json or workflows.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const dir = path.join(__dirname, 'lib');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.test.js')).sort();

let failed = 0;
for (const f of files) {
  console.log(`\n== ${f}`);
  const r = spawnSync(process.execPath, [path.join(dir, f)], { stdio: 'inherit' });
  if (r.status !== 0) failed++;
}

console.log(`\n${files.length - failed}/${files.length} test files passed`);
process.exit(failed ? 1 : 0);
