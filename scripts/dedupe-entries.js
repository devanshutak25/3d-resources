#!/usr/bin/env node
// Dedupe entries across data/*.yml. Conservative rules only:
//  R1: exact normalized URL match (drop all but best)
//  R2: same lowercase name + same hostname, keep entry with longer/deeper url or more description
//  R3: same name + two YouTube channel URL forms (channel/UC vs @handle) → keep @handle
// Anything ambiguous: report, do not touch.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '..', 'data');
const files = fs.readdirSync(DATA_DIR).filter(f => /^\d+-.*\.yml$/.test(f));

function normUrl(u){
  if(!u) return '';
  try{
    const x = new URL(u);
    let h = x.hostname.replace(/^www\./,'').toLowerCase();
    let p = x.pathname.replace(/\/+$/,'').toLowerCase();
    let q = x.search.toLowerCase();
    return h + p + q;
  }catch(e){ return u.toLowerCase().replace(/\/+$/,''); }
}
function host(u){ try{ return new URL(u).hostname.replace(/^www\./,'').toLowerCase(); }catch(e){ return ''; } }

const EXCLUDE_HOSTS_R2 = new Set([
  'github.com','gitlab.com','bitbucket.org','arxiv.org','itch.io','youtube.com'
]);
function pathDepth(u){ try{ const p = new URL(u).pathname.replace(/\/+$/,''); return p === '' ? 0 : p.split('/').length - 1; }catch(e){ return 99; } }
function score(e){
  let s = 0;
  if(e.url_status === 'ok') s += 50;
  // prefer shallower paths (root canonical)
  s += Math.max(0, 20 - pathDepth(e.url) * 5);
  // no query string preferred
  try{ if(!new URL(e.url).search) s += 5; }catch(e){}
  s += Math.min(30, (e.description||'').length / 4);
  s += Object.keys(e.tags||{}).length * 3;
  s += (e.readme_tags||[]).length;
  if(e.license) s += 2;
  return s;
}

// Load all
const docs = {};
for(const f of files){
  docs[f] = yaml.load(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
}

// Index entries
const all = []; // {file,subIdx,entIdx,entry}
for(const f of files){
  const d = docs[f];
  (d.subsections||[]).forEach((s, si) => {
    (s.entries||[]).forEach((e, ei) => {
      all.push({ file: f, subIdx: si, entIdx: ei, sub: s.slug, entry: e });
    });
  });
}

const removals = []; // {file,subIdx,entIdx,reason,keptRef}

// R1: exact URL dupes
const byUrl = new Map();
for(const r of all){
  const k = normUrl(r.entry.url);
  if(!k) continue;
  if(!byUrl.has(k)) byUrl.set(k,[]);
  byUrl.get(k).push(r);
}
for(const [k, arr] of byUrl){
  if(arr.length < 2) continue;
  arr.sort((a,b)=> score(b.entry) - score(a.entry));
  const keep = arr[0];
  for(let i = 1; i < arr.length; i++){
    removals.push({ ...arr[i], reason: 'R1 exact URL dupe', keptRef: `${keep.file}#${keep.sub}:${keep.entry.name}` });
  }
}

// R2: same name + same host (not already removed by R1)
const removedSet = new Set(removals.map(r => `${r.file}|${r.subIdx}|${r.entIdx}`));
const byNameHost = new Map();
for(const r of all){
  const key = `${r.file}|${r.subIdx}|${r.entIdx}`;
  if(removedSet.has(key)) continue;
  const n = (r.entry.name||'').toLowerCase().trim();
  const h = host(r.entry.url);
  if(!n || !h) continue;
  if(EXCLUDE_HOSTS_R2.has(h)) continue;
  const k = n + '||' + h;
  if(!byNameHost.has(k)) byNameHost.set(k,[]);
  byNameHost.get(k).push(r);
}
for(const [k, arr] of byNameHost){
  if(arr.length < 2) continue;
  // skip if name is generic placeholder — leave for manual
  const nm = arr[0].entry.name.toLowerCase();
  if(/^(paper|github|documentation|📄 paper|unreal engine documentation)$/.test(nm)) continue;
  arr.sort((a,b)=> score(b.entry) - score(a.entry));
  const keep = arr[0];
  for(let i = 1; i < arr.length; i++){
    removals.push({ ...arr[i], reason: 'R2 same name+host', keptRef: `${keep.file}#${keep.sub}:${keep.entry.url}` });
  }
}

// R3: same name, youtube channel/UC vs @handle
const removedSet2 = new Set(removals.map(r => `${r.file}|${r.subIdx}|${r.entIdx}`));
const byNameYT = new Map();
for(const r of all){
  const key = `${r.file}|${r.subIdx}|${r.entIdx}`;
  if(removedSet2.has(key)) continue;
  const h = host(r.entry.url);
  if(h !== 'youtube.com') continue;
  const n = (r.entry.name||'').toLowerCase().trim();
  if(!n) continue;
  if(!byNameYT.has(n)) byNameYT.set(n,[]);
  byNameYT.get(n).push(r);
}
for(const [n, arr] of byNameYT){
  if(arr.length < 2) continue;
  const hasHandle = arr.find(r => /\/@/.test(r.entry.url));
  const hasChan = arr.find(r => /\/channel\//.test(r.entry.url));
  if(!hasHandle || !hasChan) continue;
  // keep @handle if both point to same channel — can't verify without fetch, but same name in same file/sub = assume same
  // Only dedupe when in SAME file and subsection (safer)
  const grouped = new Map();
  for(const r of arr){
    const g = r.file + '|' + r.subIdx;
    if(!grouped.has(g)) grouped.set(g,[]);
    grouped.get(g).push(r);
  }
  for(const [g, gs] of grouped){
    if(gs.length < 2) continue;
    const keep = gs.find(r => /\/@/.test(r.entry.url)) || gs[0];
    for(const r of gs){
      if(r === keep) continue;
      removals.push({ ...r, reason: 'R3 YT channel/UC vs @handle same sub', keptRef: `${keep.file}#${keep.sub}:${keep.entry.url}` });
    }
  }
}

// R4: name "Brand/variant" or "Brand variant" where plain "Brand" exists on same host
const removedSet3 = new Set(removals.map(r => `${r.file}|${r.subIdx}|${r.entIdx}`));
const rootsByHostName = new Map(); // key host+lowerName -> record
for(const r of all){
  const k = `${r.file}|${r.subIdx}|${r.entIdx}`;
  if(removedSet3.has(k)) continue;
  const h = host(r.entry.url);
  if(!h || EXCLUDE_HOSTS_R2.has(h)) continue;
  const n = (r.entry.name||'').trim();
  if(!n || /\//.test(n)) continue;
  rootsByHostName.set(h + '||' + n.toLowerCase(), r);
}
for(const r of all){
  const k = `${r.file}|${r.subIdx}|${r.entIdx}`;
  if(removedSet3.has(k)) continue;
  const h = host(r.entry.url);
  if(!h || EXCLUDE_HOSTS_R2.has(h)) continue;
  const n = (r.entry.name||'').trim();
  // Only match Brand/variant slash-form (clear scrape artifact); space-form risks catching real product editions.
  const m = n.match(/^([A-Za-z0-9._-]+(?: [A-Za-z0-9._-]+)?)\/(?:free|freebies|lidar|models|hdris|textures|gallery|assets|search)\b/i);
  if(!m) continue;
  const brand = m[1].toLowerCase();
  const rootKey = h + '||' + brand;
  const root = rootsByHostName.get(rootKey);
  if(!root || root === r) continue;
  removals.push({ ...r, reason: 'R4 brand/variant vs brand root', keptRef: `${root.file}#${root.sub}:${root.entry.url}` });
}

// Output plan
const mode = process.argv[2] || 'plan';
console.log(`\n=== DEDUPE PLAN (${removals.length} removals) ===\n`);
const byFile = {};
for(const r of removals){
  byFile[r.file] = byFile[r.file] || [];
  byFile[r.file].push(r);
}
for(const f of Object.keys(byFile).sort()){
  console.log(`\n${f}:`);
  for(const r of byFile[f]){
    console.log(`  [${r.reason}] ${r.entry.name}  ${r.entry.url}`);
    console.log(`     → keep ${r.keptRef}`);
  }
}

if(mode !== 'apply'){
  console.log('\n(dry run — pass "apply" to write changes)');
  process.exit(0);
}

// Apply: remove by descending entIdx per (file,subIdx)
const grouped = new Map();
for(const r of removals){
  const k = r.file + '|' + r.subIdx;
  if(!grouped.has(k)) grouped.set(k, []);
  grouped.get(k).push(r.entIdx);
}
for(const [k, idxs] of grouped){
  const [f, si] = k.split('|');
  idxs.sort((a,b)=>b-a);
  const sub = docs[f].subsections[Number(si)];
  for(const i of idxs) sub.entries.splice(i, 1);
}
for(const f of files){
  const out = yaml.dump(docs[f], { lineWidth: -1, noRefs: true });
  fs.writeFileSync(path.join(DATA_DIR, f), out);
}
console.log('\n✓ applied.');
