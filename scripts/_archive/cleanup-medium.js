#!/usr/bin/env node
// Fix the 12 remaining medium audit flags with targeted moves + type corrections.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '..', 'data');

// { url → { move: 'file.yml::sub' | null, type?: string, reason: string } }
// move=null means stay in place, just update type.
const FIXES = {
  // Chocofur — marketplace for free CC0 models, wrong type
  'https://store.chocofur.com/search/free': { move: null, type: 'asset-source' },

  // UV Toolkit — specific plugin, misplaced in marketplaces subsection
  'https://gumroad.com/alexbel#NbMya': { move: '10-tools-pipeline.yml::uv-tools', type: 'plugin' },

  // Redshift HDRI Creator — tutorial video, not an asset source
  'https://m.youtube.com/watch?v=HAWRBdkl1w4': { move: '04-lighting.yml::lighting-redshift', type: 'tutorial' },

  // Blender texture painting tutorials — belong in blender-tutorials
  'https://www.youtube.com/watch?v=u9nE2Xg6Jgk': { move: '02-modeling.yml::blender-tutorials', type: 'tutorial' },
  'https://www.youtube.com/playlist?list=PLZpDYt0cyiuvyEDCMOIjWMsl8ASiZgeCg': { move: '02-modeling.yml::blender-tutorials', type: 'tutorial' },

  // PuzzleHack — Rive Flutter demo, animation reference
  'https://www.youtube.com/watch?v=9F6dxDDh9yk&t=452s': { move: '03-animation.yml::animation-learning-channels', type: 'reference' },

  // Motion Designers Community — proper home is youtube-motion-c4d (the other /c/ copy is dup)
  'https://www.youtube.com/channel/UCBAc7qBoVh0rcDgSJ2thRog': { move: '11-learning-community.yml::youtube-motion-c4d', type: 'channel' },
  'https://www.youtube.com/c/MotionDesignersCommunityTV':     { move: '11-learning-community.yml::youtube-motion-c4d', type: 'channel' },

  // Unity Integration Guide video — Unity resources, not community
  'https://www.youtube.com/watch?v=pM_HV2TU4rU&t=5298s': { move: '07-game-dev.yml::unity-engine-resources', type: 'reference' },

  // Rebelway ML — paid tutorial platform
  'https://www.youtube.com/watch?v=tQGfTzgxQIc':         { move: '11-learning-community.yml::paid-tutorial-platforms', type: 'tutorial' },
  'https://www.rebelway.net/introduction-to-machine-learning': { move: '11-learning-community.yml::paid-tutorial-platforms', type: 'tutorial' },

  // GPT-4 prompting guide — AI-assisted CG tools is better than ml-for-cg (not a paper)
  'https://www.promptingguide.ai/models/gpt-4': { move: '09-ai-ml.yml::ai-assisted-cg-tools', type: 'reference' }
  // IEEE Transactions is kept in ml-for-cg — it IS a research reference; audit rule was too strict.
};

function load() {
  const sections = yaml.load(fs.readFileSync(path.join(DATA_DIR, 'sections.yml'), 'utf8'));
  const files = {};
  for (const m of sections.sections) files[m.file] = yaml.load(fs.readFileSync(path.join(DATA_DIR, m.file), 'utf8'));
  return files;
}
function save(files) {
  for (const [f, doc] of Object.entries(files)) fs.writeFileSync(path.join(DATA_DIR, f), yaml.dump(doc, { lineWidth: -1, noRefs: true }));
}

function main() {
  const files = load();
  const pending = { ...FIXES };
  const pulled = []; // entries removed from source, awaiting placement
  let typeOnlyFixed = 0;

  // Pass 1: find + remove entries that need to move; update entries that stay
  for (const [file, doc] of Object.entries(files)) {
    for (const sub of doc.subsections || []) {
      const kept = [];
      for (const e of sub.entries || []) {
        const fix = pending[e.url];
        if (!fix) { kept.push(e); continue; }
        if (fix.type) e.entry_type = fix.type;
        if (fix.move === null) { kept.push(e); typeOnlyFixed++; delete pending[e.url]; continue; }
        // Moving
        pulled.push({ entry: e, target: fix.move });
        delete pending[e.url];
      }
      sub.entries = kept;
    }
  }

  // Pass 2: place pulled entries into targets (dedupe by URL)
  let moved = 0, dupDropped = 0;
  for (const p of pulled) {
    const [targetFile, targetSlug] = p.target.split('::');
    const doc = files[targetFile];
    const target = (doc.subsections || []).find(s => s.slug === targetSlug);
    if (!target) { console.warn('missing target', p.target, '→ dropping', p.entry.url); continue; }
    target.entries = target.entries || [];
    if (target.entries.some(e => e.url === p.entry.url)) { dupDropped++; continue; }
    target.entries.push(p.entry);
    moved++;
  }

  save(files);
  console.log(`Type-only fixes:  ${typeOnlyFixed}`);
  console.log(`Moved to target:  ${moved}`);
  console.log(`Dup on move:      ${dupDropped}`);
  const unhandled = Object.keys(pending);
  if (unhandled.length) {
    console.log('\nNot found:');
    for (const u of unhandled) console.log('  ' + u);
  }
}
main();
