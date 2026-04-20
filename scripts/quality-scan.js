#!/usr/bin/env node
// Comprehensive quality scan across data/*.yml.
// Reports: fuzzy dupes, broken descriptions, generic names, missing tags.
// Modes: scan (report only), fix-desc (fix truncated descriptions), fix-names (rename generics), dedupe-fuzzy (apply fuzzy dedupe).

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '..', 'data');
const files = fs.readdirSync(DATA_DIR).filter(f => /^\d+-.*\.yml$/.test(f));
const mode = process.argv[2] || 'scan';

function normUrl(u){
  if(!u) return '';
  try{
    const x = new URL(u);
    let h = x.hostname.replace(/^www\./,'').toLowerCase();
    let p = x.pathname.replace(/\/+$/,'').toLowerCase();
    return h + p;
  }catch(e){ return (u||'').toLowerCase().replace(/\/+$/,''); }
}
function host(u){ try{ return new URL(u).hostname.replace(/^www\./,'').toLowerCase(); }catch(e){ return ''; } }
function normName(n){ return (n||'').toLowerCase().replace(/[^a-z0-9]+/g,''); }

const docs = {};
for(const f of files) docs[f] = yaml.load(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));

const all = [];
for(const f of files){
  const d = docs[f];
  (d.subsections||[]).forEach((s, si) => {
    (s.entries||[]).forEach((e, ei) => {
      all.push({ file: f, subIdx: si, entIdx: ei, sub: s.slug, entry: e });
    });
  });
}

// --- FUZZY DUPES ---
// Same host + normalized name equal
const fuzzyDupes = [];
const byHostNorm = new Map();
for(const r of all){
  const h = host(r.entry.url);
  const n = normName(r.entry.name);
  if(!h || !n) continue;
  const k = h + '||' + n;
  if(!byHostNorm.has(k)) byHostNorm.set(k, []);
  byHostNorm.get(k).push(r);
}
const EXCLUDE_FUZZY = new Set(['github.com','gitlab.com','bitbucket.org','arxiv.org','itch.io','youtube.com']);
for(const [k, arr] of byHostNorm){
  if(arr.length < 2) continue;
  const h = k.split('||')[0];
  if(EXCLUDE_FUZZY.has(h)) continue;
  fuzzyDupes.push(arr);
}

// --- BROKEN DESCRIPTIONS ---
const brokenDesc = [];
for(const r of all){
  const d = r.entry.description || '';
  if(!d){ continue; }
  // starts with punctuation, or is just a truncated bracket fragment
  if(/^[,;:.\]\)]/.test(d.trim())) brokenDesc.push({ ...r, reason: 'starts-with-punct' });
  else if(d.trim().length < 8 && d.trim() !== 'Free') brokenDesc.push({ ...r, reason: 'too-short' });
  else if(/\.\.\.$|…$/.test(d.trim()) && d.length < 40) brokenDesc.push({ ...r, reason: 'truncated' });
}

// --- GENERIC NAMES ---
const genericNames = [];
const GENERIC_PATTERNS = [
  /^📄 paper$/i,
  /^github$/i,
  /^unreal engine documentation$/i,
  /^documentation$/i,
  /^home$/i,
  /^index$/i,
  /^readme$/i,
  /^untitled$/i,
  /^paper$/i,
  /^📺 (video|paper|link)$/i,
  /^📄 (video|link)$/i,
  /^http/i,
  /^www\./i,
];
for(const r of all){
  const n = (r.entry.name || '').trim();
  if(!n){ genericNames.push({ ...r, reason: 'empty' }); continue; }
  for(const p of GENERIC_PATTERNS){
    if(p.test(n)){ genericNames.push({ ...r, reason: 'matches ' + p }); break; }
  }
}

// --- MISSING TAGS ---
const missingTags = [];
for(const r of all){
  const t = r.entry.tags;
  if(!t || (typeof t === 'object' && Object.keys(t).length === 0)) missingTags.push(r);
}

// --- REPORT ---
if(mode === 'scan'){
  console.log(`\n=== FUZZY DUPES (same host + normalized name, cross-section): ${fuzzyDupes.length} groups ===`);
  for(const arr of fuzzyDupes.slice(0, 50)){
    console.log(`\n  "${arr[0].entry.name}" on ${host(arr[0].entry.url)}`);
    for(const r of arr) console.log(`    ${r.file}#${r.sub}: ${r.entry.url}`);
  }
  console.log(`\n=== BROKEN DESCRIPTIONS: ${brokenDesc.length} ===`);
  for(const r of brokenDesc.slice(0, 30)){
    console.log(`  [${r.reason}] ${r.file}#${r.sub}: ${r.entry.name}`);
    console.log(`     desc: ${JSON.stringify(r.entry.description).slice(0,120)}`);
  }
  if(brokenDesc.length > 30) console.log(`  ... +${brokenDesc.length-30} more`);
  console.log(`\n=== GENERIC NAMES: ${genericNames.length} ===`);
  const byReason = {};
  for(const r of genericNames){ byReason[r.reason] = (byReason[r.reason]||0) + 1; }
  for(const [k,v] of Object.entries(byReason)) console.log(`  ${k}: ${v}`);
  console.log(`\n=== MISSING TAGS: ${missingTags.length} (of ${all.length})`);
  process.exit(0);
}

// --- FIX: BROKEN DESCRIPTIONS ---
if(mode === 'fix-desc'){
  let fixed = 0;
  for(const r of brokenDesc){
    const d = (r.entry.description || '').trim();
    let cleaned = d;
    // strip leading punct + space
    cleaned = cleaned.replace(/^[,;:.\]\)\s]+/, '');
    // strip trailing ellipsis + obvious truncation
    cleaned = cleaned.replace(/[.…]+$/, '');
    // if still looks broken or empty, remove field entirely (let user fill later)
    if(cleaned.length < 8){
      delete docs[r.file].subsections[r.subIdx].entries[r.entIdx].description;
    }else{
      docs[r.file].subsections[r.subIdx].entries[r.entIdx].description = cleaned;
    }
    fixed++;
  }
  for(const f of files){
    fs.writeFileSync(path.join(DATA_DIR, f), yaml.dump(docs[f], { lineWidth: -1, noRefs: true }));
  }
  console.log(`Fixed ${fixed} broken descriptions.`);
  process.exit(0);
}

// --- FIX: GENERIC NAMES (URL-slug derived) ---
if(mode === 'fix-names'){
  function titleFromUrl(u){
    try{
      const x = new URL(u);
      // arxiv: 2210.15663 → Arxiv 2210.15663
      if(/arxiv\.org/.test(x.hostname)){
        const m = x.pathname.match(/(\d{4}\.\d{4,5})/);
        if(m) return `Arxiv Paper ${m[1]}`;
      }
      // github.com/user/repo
      if(/github\.com/.test(x.hostname)){
        const parts = x.pathname.split('/').filter(Boolean);
        if(parts.length >= 2) return `${parts[1]} (${parts[0]})`;
        if(parts.length === 1) return `GitHub: ${parts[0]}`;
      }
      // dev.epicgames.com/.../unreal-engine/<slug>
      if(/epicgames\.com/.test(x.hostname)){
        const parts = x.pathname.split('/').filter(Boolean);
        const slug = parts[parts.length - 1] || parts[parts.length - 2] || '';
        const pretty = slug.replace(/-in-unreal-engine|-for-unreal-engine/g,'').replace(/-/g,' ');
        if(pretty) return `Unreal Docs: ${pretty.replace(/\b\w/g, c => c.toUpperCase())}`;
      }
      // generic fallback: last slug
      const parts = x.pathname.split('/').filter(Boolean);
      const slug = parts[parts.length - 1] || x.hostname;
      return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }catch(e){ return null; }
  }
  let renamed = 0;
  for(const r of genericNames){
    if(r.reason === 'empty') continue;
    const t = titleFromUrl(r.entry.url);
    if(!t) continue;
    docs[r.file].subsections[r.subIdx].entries[r.entIdx].name = t;
    renamed++;
  }
  for(const f of files){
    fs.writeFileSync(path.join(DATA_DIR, f), yaml.dump(docs[f], { lineWidth: -1, noRefs: true }));
  }
  console.log(`Renamed ${renamed} generic names.`);
  process.exit(0);
}

// --- DEDUPE FUZZY ---
if(mode === 'dedupe-fuzzy'){
  function score(e){
    let s = 0;
    if(e.url_status === 'ok') s += 50;
    s += (e.description||'').length / 4;
    s += Object.keys(e.tags||{}).length * 3;
    s += (e.readme_tags||[]).length;
    if(e.license) s += 2;
    try{ const p = new URL(e.url).pathname.replace(/\/+$/,''); s += Math.max(0, 20 - (p === '' ? 0 : p.split('/').length-1) * 5); }catch(e){}
    return s;
  }
  const removals = [];
  for(const arr of fuzzyDupes){
    arr.sort((a,b) => score(b.entry) - score(a.entry));
    const keep = arr[0];
    for(let i = 1; i < arr.length; i++){
      removals.push({ ...arr[i], keptRef: `${keep.file}#${keep.sub}:${keep.entry.url}` });
    }
  }
  console.log(`\n=== FUZZY DEDUPE PLAN: ${removals.length} removals ===`);
  const byFile = {};
  for(const r of removals){
    byFile[r.file] = byFile[r.file] || [];
    byFile[r.file].push(r);
  }
  for(const f of Object.keys(byFile).sort()){
    console.log(`\n${f}:`);
    for(const r of byFile[f]){
      console.log(`  drop: ${r.entry.name}  ${r.entry.url}`);
      console.log(`   keep: ${r.keptRef}`);
    }
  }
  if(process.argv[3] !== 'apply'){
    console.log('\n(pass "apply" to write)');
    process.exit(0);
  }
  const grouped = new Map();
  for(const r of removals){
    const k = r.file + '|' + r.subIdx;
    if(!grouped.has(k)) grouped.set(k, []);
    grouped.get(k).push(r.entIdx);
  }
  for(const [k, idxs] of grouped){
    const [f, si] = k.split('|');
    idxs.sort((a,b) => b-a);
    const sub = docs[f].subsections[Number(si)];
    for(const i of idxs) sub.entries.splice(i, 1);
  }
  for(const f of files){
    fs.writeFileSync(path.join(DATA_DIR, f), yaml.dump(docs[f], { lineWidth: -1, noRefs: true }));
  }
  console.log('\n✓ applied.');
}
