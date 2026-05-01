#!/usr/bin/env node
// Audit software coverage: which software-like entries appear outside
// 12-software-reference, and which named software appear in descriptions
// without a corresponding software-reference entry.
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..', 'data');
const SOFT_DIR = path.join(ROOT, '12-software-reference');

function walkYml(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkYml(p));
    else if (e.isFile() && e.name.endsWith('.yml')) out.push(p);
  }
  return out;
}

function loadEntries(file) {
  try {
    const doc = yaml.load(fs.readFileSync(file, 'utf8'));
    if (doc && Array.isArray(doc.entries)) return doc.entries;
  } catch (e) {}
  return [];
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// 1) Canonical software set
const canonical = new Map(); // norm -> {name, url, sub}
for (const f of walkYml(SOFT_DIR)) {
  const sub = path.relative(SOFT_DIR, f).split(path.sep)[0];
  for (const e of loadEntries(f)) {
    const k = norm(e.name);
    if (k) canonical.set(k, { name: e.name, url: e.url, sub });
  }
}

// 2) entry_type:software outside software-reference
const externalSoftware = []; // {name, url, file}
const allEntries = []; // for cross-ref scan
const allFiles = walkYml(ROOT).filter(f => !f.includes(path.sep + '12-software-reference' + path.sep) && !f.endsWith('sections.yml'));

for (const f of allFiles) {
  for (const e of loadEntries(f)) {
    allEntries.push({ entry: e, file: f });
    if (e.entry_type === 'software') {
      const k = norm(e.name);
      if (!canonical.has(k)) externalSoftware.push({ name: e.name, url: e.url, file: path.relative(ROOT, f) });
    }
  }
}

// Also include software entries that ARE in canonical but live as their primary in another section
const softwareElsewherePrimary = [];
for (const f of allFiles) {
  for (const e of loadEntries(f)) {
    if (e.entry_type === 'software') {
      const k = norm(e.name);
      if (canonical.has(k)) softwareElsewherePrimary.push({ name: e.name, file: path.relative(ROOT, f) });
    }
  }
}

// 3) Heuristic: scan name + description + notes + best_for of all entries (incl. software-ref)
// looking for capitalized product-name candidates that don't appear in canonical
const candidates = new Map(); // norm -> {raw, hits}
const TEXT_FIELDS = ['name', 'description', 'notes', 'best_for'];
const STOP = new Set(['The','This','That','There','These','Those','When','Where','While','With','For','From','And','Use','Used','Free','Open','Source','Real','Time','Web','Browser','Cloud','Mobile','Game','Engine','3D','2D','UI','UX','API','SDK','HD','HDR','PBR','VFX','XR','VR','AR','MR','OS','iOS','iPad','Android','Linux','Windows','macOS','Mac','Studio','Pro','Plus','New','Old','Best','Top','Most','Many','One','Two','Three','First','Last','See','Also','But','Not','Now','Today','Yesterday','Note','Notes','Includes','Including','Covers','Covering','Tutorial','Tutorials','Course','Courses','Guide','Guides','Channel','Series','Video','Videos','Article','Articles','Free Tier','Workflow','Pipeline','Production','Animation','Modeling','Rigging','Lighting','Rendering','Sculpting','Texturing','Compositing','Editing','Music','Audio','Sound','Color','Shading','Shaders','Shader','Light','Render','Tool','Tools','Asset','Assets','Library','Libraries','Resource','Resources','Plugin','Plugins','Addon','Addons','Add','On','Set','Sets','Pack','Packs','Series','Channel','Page','Site','Website','Database','Online','Offline','Free','Paid','Premium','Commercial','Community','Industry','Game','Films','Film','Movie','Movies','TV','Series','Show','Shows','Course','Section','Subsection','Reference','References']);

for (const { entry: e } of allEntries) {
  const text = TEXT_FIELDS.map(k => e[k] || '').join('\n');
  // Match capitalized words / Title Case sequences (1-3 words)
  const re = /\b([A-Z][a-zA-Z0-9]{2,}(?:\s[A-Z][a-zA-Z0-9]+){0,2})\b/g;
  let m;
  while ((m = re.exec(text))) {
    const raw = m[1];
    if (STOP.has(raw)) continue;
    if (raw.split(/\s+/).every(w => STOP.has(w))) continue;
    const k = norm(raw);
    if (!k || k.length < 3) continue;
    if (canonical.has(k)) continue;
    candidates.set(k, { raw, hits: (candidates.get(k)?.hits || 0) + 1 });
  }
}

// Filter: keep candidates with >=2 hits (more likely a real product)
const ranked = [...candidates.values()]
  .filter(c => c.hits >= 2)
  .sort((a,b) => b.hits - a.hits);

const out = {
  canonical_count: canonical.size,
  external_software_entries: externalSoftware,
  software_primary_outside_softref: softwareElsewherePrimary,
  candidate_unlisted_products_top_100: ranked.slice(0, 100),
};
fs.writeFileSync(path.join(__dirname, '..', '_maintenance', 'software-coverage-audit.json'), JSON.stringify(out, null, 2));
console.log('canonical:', canonical.size);
console.log('external entry_type=software (not in canon):', externalSoftware.length);
console.log('software-typed entries living outside software-ref:', softwareElsewherePrimary.length);
console.log('candidate unlisted products (>=2 hits):', ranked.length);
