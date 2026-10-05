#!/usr/bin/env node
// One-shot: move software-typed entries that live outside 12-software-reference
// into the appropriate canonical bucket and set dual_listed_in to mirror back
// into their original workflow subsection.
//
// Re-runnable: skips any entry already deleted from source.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..', 'data');

// source path (sectionDir/subSlug) → target software-ref bucket slug
// "SKIP_REFERENCE" means do not move; will be reclassified as entry_type:reference
// in a separate step. "DROP" means drop the entry entirely.
const MAP = {
  '02-modeling/blender-plugins-addons':           'photogrammetry-software',
  '02-modeling/houdini-getting-started':          '3d-software-free-tier',
  '02-modeling/material-creation-tools':          'material-creation-software',
  '03-animation/ai-motion-capture':               'ai-motion-capture-software',
  '04-lighting/rendering-shader-theory':          'misc-3d-utilities-software',
  '05-vfx/virtual-production':                    'virtual-production-software',
  '06-motion-graphics/motion-graphics-inspiration': 'vfx-compositing-software',
  '06-motion-graphics/motion-graphics-tools':     'vfx-compositing-software',
  '07-game-dev/game-dev-ai-procedural':           'pipeline-software',
  '07-game-dev/game-dev-audio-middleware':        'audio-software',
  '07-game-dev/game-dev-dialogue-narrative':      'pipeline-software',
  '07-game-dev/game-dev-level-design':            'level-design-software',
  '07-game-dev/game-dev-networking':              'pipeline-software',
  '07-game-dev/game-dev-sprite-vfx':              '2d-animation-software',
  '07-game-dev/game-dev-version-control':         'pipeline-software',
  '07-game-dev/unity-engine-resources':           'pipeline-software',
  '08-art-design/design-tools':                   'design-software',
  '08-art-design/drawing-painting-3d':            '2d-animation-software',
  '09-ai-ml/3d-generation':                       'ai-3d-software',
  '09-ai-ml/ai-assisted-cg-tools':                'ai-assist-software',
  '09-ai-ml/ai-audio-music':                      'ai-audio-software',
  '09-ai-ml/comfyui-ecosystem':                   'ai-image-software',
  '09-ai-ml/image-generation':                    'ai-image-software',
  '09-ai-ml/ml-for-cg':                           'SKIP_REFERENCE',
  '09-ai-ml/open-source-models-hf':               'SKIP_REFERENCE',
  '09-ai-ml/texture-material-generation':         'ai-image-software',
  '09-ai-ml/video-generation':                    'ai-video-software',
  '10-tools-pipeline/conversion-tools':           'viewers-file-utilities',
  '10-tools-pipeline/matchmoving-tracking':       'matchmoving-software',
  '10-tools-pipeline/misc-3d-utilities':          'misc-3d-utilities-software',
  '10-tools-pipeline/photogrammetry-scanning':    'photogrammetry-software',
  '10-tools-pipeline/retopology-mesh-tools':      'retopo-uv-software',
  '10-tools-pipeline/scene-pipeline-tools':       'pipeline-software',
  '10-tools-pipeline/uv-tools':                   'retopo-uv-software',
};

// section dir → section slug (from sections.yml)
const SECTIONS_FILE = path.join(ROOT, 'sections.yml');
const sectionsDoc = yaml.load(fs.readFileSync(SECTIONS_FILE, 'utf8'));
const dirToSectionSlug = new Map();
for (const meta of sectionsDoc.sections) {
  const dir = meta.file.replace(/\.yml$/, '');
  dirToSectionSlug.set(dir, meta.slug);
}

const SOFTREF_DIR = '12-software-reference';
const SOFTREF_SECTION_SLUG = dirToSectionSlug.get(SOFTREF_DIR);

function loadYml(p) { return yaml.load(fs.readFileSync(p, 'utf8')) || {}; }
function dumpYml(o) { return yaml.dump(o, { lineWidth: -1, noRefs: true }); }

function chunkFiles(sectionDir, subSlug) {
  const dir = path.join(ROOT, sectionDir, subSlug);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.yml')).sort()
    .map(f => path.join(dir, f));
}

function targetChunkPath(bucket) {
  return chunkFiles(SOFTREF_DIR, bucket)[0];
}

function urlKey(u) {
  return String(u || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
}

const audit = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '_maintenance', 'software-coverage-audit.json'), 'utf8'));

const moved = [];
const skipped = [];
const errors = [];

// Group misfits by source chunk file for batch in-place edits
const bySource = new Map();
for (const m of audit.external_software_entries) {
  const f = m.file.replace(/\\/g, '/');
  if (!bySource.has(f)) bySource.set(f, []);
  bySource.get(f).push(m);
}

for (const [relFile, items] of bySource) {
  const segs = relFile.split('/');
  const sectionDir = segs[0];
  const subSlug = segs[1];
  const sourceKey = `${sectionDir}/${subSlug}`;
  const bucket = MAP[sourceKey];
  if (!bucket) { errors.push(`No mapping for ${sourceKey}`); continue; }

  const sourcePath = path.join(ROOT, relFile);
  const sourceDoc = loadYml(sourcePath);
  if (!sourceDoc.entries) { errors.push(`No entries in ${relFile}`); continue; }

  const namesToMove = new Set(items.map(i => i.name));
  const sectionSlug = dirToSectionSlug.get(sectionDir);
  const mirrorPath = `${sectionSlug}/${subSlug}`;

  if (bucket === 'SKIP_REFERENCE') {
    // Reclassify as reference, do not move
    let changed = 0;
    for (const e of sourceDoc.entries) {
      if (namesToMove.has(e.name) && e.entry_type === 'software') {
        e.entry_type = 'reference';
        changed++;
        skipped.push({ from: relFile, name: e.name, action: 'reclassified-as-reference' });
      }
    }
    if (changed) fs.writeFileSync(sourcePath, dumpYml(sourceDoc));
    continue;
  }

  const targetPath = targetChunkPath(bucket);
  if (!targetPath) { errors.push(`No target chunk for bucket ${bucket}`); continue; }
  const targetDoc = loadYml(targetPath);
  if (!Array.isArray(targetDoc.entries)) targetDoc.entries = [];
  const targetUrls = new Set(targetDoc.entries.map(e => urlKey(e.url)));

  const remaining = [];
  for (const e of sourceDoc.entries) {
    if (!namesToMove.has(e.name) || e.entry_type !== 'software') {
      remaining.push(e); continue;
    }
    const k = urlKey(e.url);
    if (targetUrls.has(k)) {
      // Already in target; just drop from source
      moved.push({ from: relFile, to: bucket, name: e.name, action: 'drop-dup' });
      continue;
    }
    const ne = { ...e };
    const dual = new Set(ne.dual_listed_in || []);
    dual.add(mirrorPath);
    ne.dual_listed_in = [...dual].sort();
    targetDoc.entries.push(ne);
    targetUrls.add(k);
    moved.push({ from: relFile, to: bucket, name: e.name, action: 'moved' });
  }
  sourceDoc.entries = remaining;
  fs.writeFileSync(sourcePath, dumpYml(sourceDoc));
  fs.writeFileSync(targetPath, dumpYml(targetDoc));
}

const out = path.join(__dirname, '..', '_maintenance', 'software-migration-log.json');
fs.writeFileSync(out, JSON.stringify({ moved, skipped, errors }, null, 2));
console.log(`moved/dropped: ${moved.length}`);
console.log(`reclassified-as-reference (in place): ${skipped.length}`);
console.log(`errors: ${errors.length}`);
if (errors.length) errors.forEach(e => console.error('  ' + e));
