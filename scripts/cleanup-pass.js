#!/usr/bin/env node
// One-shot cleanup: applies URL replacements for known-moved entries,
// marks confirmed-dead unreachables as deprecated, relocates arxiv papers,
// fixes obvious entry_type mismatches, and collapses duplicate URLs.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '..', 'data');

// --- URL replacements (oldUrl → newUrl OR null to delete entry) ---
const URL_REPLACEMENTS = {
  // Arnold moved to Autodesk subsite
  'https://arnoldrenderer.com/': 'https://www.autodesk.com/products/arnold/overview',
  'https://arnoldrenderer.com/resources/': 'https://www.autodesk.com/products/arnold/resources',
  // Wonder Dynamics → Autodesk Flow Studio
  'https://wonderdynamics.com/': 'https://www.autodesk.com/products/flow-studio/overview',
  // YouTube handle changes
  'https://www.youtube.com/user/Arrimus3D': 'https://www.youtube.com/@Arrimus3D',
  'https://www.youtube.com/@siabordev': 'https://www.youtube.com/@simondevyt',
  'https://www.youtube.com/@trentkaneunga': 'https://www.youtube.com/@trentkaniuga',
  'https://www.youtube.com/c/WorkphloPhotography': 'https://www.youtube.com/@workphlo',
  // Autodesk Academy migrated — point at new learning portal
  'https://academy.autodesk.com/node/125666/take?q-nr=2': 'https://www.autodesk.com/certification/learn/course/fusion-design-for-industry',
  'https://academy.autodesk.com/node/119050/take?q-nr=1': 'https://www.autodesk.com/certification/learn/course/fusion-design-for-industry',
  // Toon Boom learn subpath redirect-loops → root /learn works
  'https://learn.toonboom.com/': 'https://www.toonboom.com/community/learn',
  // Autodesk App Store (Maya) — 500 intermittent, try apps landing
  'https://apps.autodesk.com/MAYA/': 'https://apps.autodesk.com/en/Home/Index',
  // Luminance HDR main page moved to new host
  'https://luminancehdr.sourceforge.net/': 'https://qtpfsgui.sourceforge.net/',
  // Stable Audio (Harmonai) — rebrand, site works at stableaudio.com but flaky; point at product page
  'https://stableaudio.com/': 'https://www.stableaudio.com/',
  // NVIDIA Neural Rendering page moved
  'https://developer.nvidia.com/rtx/neural-rendering': 'https://developer.nvidia.com/rtx/ray-tracing/neural-rendering',
  // CozyBlanket rebranded/down — replace with Nomad Sculpt's retopo info? Better: mark dead
  'https://cozyblanket.com/': null,
  // Janelle Loi resources page — 502 intermittent, just revert status
  'https://janelloi.com/recommended-resources/': 'https://janelloi.com/resources/',
  // Pirate Software jam — one-time jam, ended; remove
  'https://itch.io/jam/piratesoftware': null,
  // Rich Lord tools page 404
  'https://www.richlord.com/tools': 'https://www.richlord.com/',
  // Houdini Blueprint flaky 502
  'https://hdbp.io/': null
};

// --- URLs to mark deprecated (no replacement, just flag) ---
const DEAD_URLS = new Set([
  'https://texturify.com/',
  'https://motioncanvas.io/',
  'https://rainboxlab.org/tools/dume/',
  'https://gameanalytics.com/',
  'https://huedata.org/',
  'https://www.csm.ai/',
  'https://instamaterials.com/',
  'https://www.make2digital.com/',
  'http://alexcpeterson.com/spacescape/',
  'https://www.akeytsu.com/',
  'https://cgsociety.org/',
  'https://www.cgpeers.com/',
  'https://usd.needle.tools/',
  'https://radical.tech/',
  'https://godot.cafe/',
  'https://cinematographydb.com/',
  'https://www.neilblevins.com/art_lessons/art_lessons.htm'
]);

// --- Type mismatches to auto-correct ---
// {subsection slug: expected type}
const TYPE_COERCE = {
  'audio-sfx-music':      'asset-source',
  'hdris':                'asset-source',
  'textures-free-pbr':    'asset-source',
  'fonts':                'asset-source',
  'communities-forums':   'community',
  'youtube-blender':      'channel',
  'youtube-houdini':      'channel',
  'youtube-motion-c4d':   'channel',
  'youtube-sculpting-characters': 'channel'
};

function load() {
  const sections = yaml.load(fs.readFileSync(path.join(DATA_DIR, 'sections.yml'), 'utf8'));
  const files = {};
  for (const m of sections.sections) {
    files[m.file] = yaml.load(fs.readFileSync(path.join(DATA_DIR, m.file), 'utf8'));
  }
  return { sections, files };
}

function save(files) {
  for (const [f, doc] of Object.entries(files)) {
    fs.writeFileSync(path.join(DATA_DIR, f), yaml.dump(doc, { lineWidth: -1, noRefs: true }));
  }
}

function walkEntries(files, cb) {
  for (const [file, doc] of Object.entries(files)) {
    for (const sub of doc.subsections || []) {
      const kept = [];
      for (const e of sub.entries || []) {
        const keep = cb(e, { file, sub: sub.slug, subObj: sub });
        if (keep !== false) kept.push(e);
      }
      sub.entries = kept;
    }
  }
}

function main() {
  const { files } = load();
  let replaced = 0, deleted = 0, deprecated = 0, typeFixed = 0, arxivMoved = 0, imgRemoved = 0;

  // Collect arxiv entries to relocate after the main pass
  const arxivEntries = [];

  walkEntries(files, (e, ctx) => {
    // URL replacement
    if (URL_REPLACEMENTS[e.url] !== undefined) {
      const next = URL_REPLACEMENTS[e.url];
      if (next === null) { deleted++; return false; }
      e.url = next;
      if (e.deprecated === true) delete e.deprecated;
      e.url_status = 'ok';
      replaced++;
      return true;
    }
    // Dead — mark deprecated
    if (DEAD_URLS.has(e.url)) {
      e.deprecated = true;
      e.url_status = 'broken';
      deprecated++;
      return true;
    }
    // Remove image-as-resource entries (e.g. .png/.jpg URLs)
    if (/\.(png|jpg|gif|svg|webp)(\?.*)?$/i.test(e.url)) { imgRemoved++; return false; }
    // Type coercion
    const want = TYPE_COERCE[ctx.sub];
    if (want && e.entry_type && e.entry_type !== want) {
      // Only coerce if the current type is vague/wrong (plugin/tool in audio → asset-source)
      const swapFrom = new Set(['reference', 'plugin', 'tool', 'software']);
      if (swapFrom.has(e.entry_type)) {
        e.entry_type = want;
        typeFixed++;
      }
    }
    // Arxiv outside 09-ai-ml.yml → flag for move
    if (e.url.startsWith('https://arxiv.org/') && !ctx.file.startsWith('09-')) {
      arxivEntries.push({ entry: e, from: `${ctx.file}::${ctx.sub}` });
      return false; // remove from source location
    }
    return true;
  });

  // Relocate arxiv entries to 09-ai-ml.yml :: ml-for-cg
  if (arxivEntries.length) {
    const doc = files['09-ai-ml.yml'];
    const target = (doc.subsections || []).find(s => s.slug === 'ml-for-cg');
    if (target) {
      target.entries = target.entries || [];
      const existing = new Set(target.entries.map(e => e.url));
      for (const { entry } of arxivEntries) {
        if (!existing.has(entry.url)) { target.entries.push(entry); existing.add(entry.url); arxivMoved++; }
      }
    }
  }

  // Dedup: for exact-URL duplicates, keep first, delete others
  const seen = new Map();
  const dupDeleted = [];
  walkEntries(files, (e, ctx) => {
    const key = e.url.replace(/#.*$/, '').replace(/\/$/, '').toLowerCase();
    if (seen.has(key)) {
      dupDeleted.push({ url: e.url, from: `${ctx.file}::${ctx.sub}`, keptIn: seen.get(key) });
      return false;
    }
    seen.set(key, `${ctx.file}::${ctx.sub}`);
    return true;
  });

  save(files);

  console.log(`URL replacements:     ${replaced}`);
  console.log(`Entries deleted:      ${deleted}`);
  console.log(`Marked dead:          ${deprecated}`);
  console.log(`Type coerced:         ${typeFixed}`);
  console.log(`Arxiv relocated:      ${arxivMoved}`);
  console.log(`Image URLs removed:   ${imgRemoved}`);
  console.log(`Dup URLs collapsed:   ${dupDeleted.length}`);
}

main();
