#!/usr/bin/env node
// Strip trailing truncated markdown from descriptions.
const fs = require('fs'), path = require('path'), yaml = require('js-yaml');
const DATA = path.join(__dirname,'..','data');
const files = fs.readdirSync(DATA).filter(f => /^\d+-.*\.yml$/.test(f));
const mode = process.argv[2] || 'plan';

function cleanTrailing(d){
  if(!d) return d;
  let s = d;
  // Repeatedly strip trailing fragment if it has unclosed markdown.
  while(true){
    // Detect unclosed [text](url...  (missing `)` at end)
    const m = s.match(/\s*,?\s*\[[^\]]*\]\([^)]*$/);
    if(m){
      s = s.slice(0, m.index).replace(/[\s,;:]+$/,'');
      continue;
    }
    // Detect trailing dangling `[text](url),` chunk that references external stuff but got cut
    const m2 = s.match(/\s*,\s*\[[^\]]+\]\([^)]+\)[\s,;:]*$/);
    if(m2){
      // keep, this is complete link — actually could stay; stop loop
    }
    break;
  }
  // Balance brackets if mismatch — strip from last unbalanced [ onward
  const opens = [...s.matchAll(/\[/g)].map(m=>m.index);
  const closes = [...s.matchAll(/\]/g)].map(m=>m.index);
  if(opens.length > closes.length){
    const extra = opens.length - closes.length;
    // cut at opens[opens.length-extra]
    s = s.slice(0, opens[opens.length-extra]).replace(/[\s,;:]+$/,'');
  }
  return s.trim();
}

let changed = 0;
const changes = [];
const docs = {};
for(const f of files){
  docs[f] = yaml.load(fs.readFileSync(path.join(DATA,f),'utf8'));
  (docs[f].subsections||[]).forEach((s,si)=>{
    (s.entries||[]).forEach((e,ei)=>{
      if(!e.description) return;
      const c = cleanTrailing(e.description);
      if(c !== e.description){
        changes.push({f, sub:s.slug, name:e.name, before:e.description, after:c});
        docs[f].subsections[si].entries[ei].description = c || undefined;
        if(!c) delete docs[f].subsections[si].entries[ei].description;
        changed++;
      }
    });
  });
}

console.log(`Changes: ${changed}`);
for(const c of changes.slice(0,20)){
  console.log(`\n${c.f} - ${c.name}`);
  console.log(`  before: ${c.before.slice(-100)}`);
  console.log(`   after: ${c.after.slice(-100)}`);
}
if(mode === 'apply'){
  for(const f of files) fs.writeFileSync(path.join(DATA,f), yaml.dump(docs[f],{lineWidth:-1,noRefs:true}));
  console.log('\n✓ applied');
}else{
  console.log('\n(pass "apply" to write)');
}
