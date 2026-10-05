#!/usr/bin/env node
// Post-build check: every internal link in _site/**/*.html must resolve.
//   - path links ("/sections/x/", "/tags/...") must point at a file on disk
//   - fragment links ("#id", "/page/#id") must hit an id on the target page
//   - ids must be unique per page
// Usage: node scripts/check-built-links.js [siteDir=_site]
// Exits 1 on any problem so it can gate CI or build.sh.

const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || '_site');
if (!fs.existsSync(root)) {
  console.error(`No build at ${root}. Run build.sh first.`);
  process.exit(2);
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function decode(s) {
  try { return decodeURIComponent(s); } catch (e) { return s; }
}

const idCache = new Map();
function idsOf(file) {
  if (!idCache.has(file)) {
    const html = fs.readFileSync(file, 'utf8');
    idCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1])));
  }
  return idCache.get(file);
}

function resolvePath(p) {
  let f = path.join(root, decode(p));
  if (p.endsWith('/')) return path.join(f, 'index.html');
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) return path.join(f, 'index.html');
  if (!fs.existsSync(f) && fs.existsSync(f + '.html')) return f + '.html';
  return f;
}

const files = walk(root);
const missing = [];
const badFragments = [];
const dupIds = [];
let pathLinks = 0, fragLinks = 0;

for (const file of files) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');

  const seen = new Set();
  for (const m of html.matchAll(/\sid="([^"]+)"/g)) {
    if (seen.has(m[1])) dupIds.push(`${rel}#${m[1]}`);
    seen.add(m[1]);
  }

  for (const m of html.matchAll(/href="([^"]*)"/g)) {
    const href = m[1].replace(/&amp;/g, '&');
    if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) continue; // external
    const [rawPath, frag] = href.split('#');
    const p = rawPath.split('?')[0];
    let target = file;
    if (p) {
      if (!p.startsWith('/')) continue; // relative asset paths are not used for pages
      pathLinks++;
      target = resolvePath(p);
      if (!fs.existsSync(target)) { missing.push(`${rel} -> ${href}`); continue; }
    }
    if (frag && target.endsWith('.html')) {
      fragLinks++;
      if (!idsOf(target).has(decode(frag))) badFragments.push(`${rel} -> ${href}`);
    }
  }
}

console.log(`${files.length} pages, ${pathLinks} path links, ${fragLinks} fragment links`);
const report = (label, list) => {
  console.log(`${label}: ${list.length}`);
  for (const x of list.slice(0, 20)) console.log(`  ${x}`);
  if (list.length > 20) console.log(`  ... ${list.length - 20} more`);
};
report('Missing targets', missing);
report('Broken fragments', badFragments);
report('Duplicate ids', dupIds);

if (missing.length || badFragments.length || dupIds.length) process.exit(1);
console.log('✓ All internal links resolve.');
