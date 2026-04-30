#!/usr/bin/env node
// Second-pass categorizer for unclassified alive candidates.
// Uses broader keyword + domain heuristics and can propose new subsections.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const INPUT = path.join(__dirname, '..', '_maintenance', 'awesome-alive.json');
const DATA_DIR = path.join(__dirname, '..', 'data');

function strictNormalize(u) {
  try {
    const url = new URL(u);
    url.hash = '';
    url.protocol = 'https:';
    url.hostname = url.hostname.replace(/^www\./, '');
    for (const p of ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'source']) url.searchParams.delete(p);
    let s = url.toString();
    if (s.endsWith('/') && url.pathname !== '/') s = s.slice(0, -1);
    return s.toLowerCase();
  } catch (e) { return u.toLowerCase(); }
}

function loadExisting() {
  const set = new Set();
  const sections = yaml.load(fs.readFileSync(path.join(DATA_DIR, 'sections.yml'), 'utf8'));
  for (const meta of sections.sections) {
    const file = path.join(DATA_DIR, meta.file);
    if (!fs.existsSync(file)) continue;
    const doc = yaml.load(fs.readFileSync(file, 'utf8'));
    for (const sub of doc.subsections || []) {
      for (const e of sub.entries || []) set.add(strictNormalize(e.url));
    }
  }
  return set;
}

function isGarbage(c) {
  const name = (c.label || '').trim();
  if (!name || name.length <= 2) return true;
  if (/^(link|here|click here|this)$/i.test(name)) return true;
  if (name.length < 4 && !/^[A-Z]/.test(name)) return true;
  return false;
}

// Tier-2 categorizer: broader keyword + domain hints.
function classify(c) {
  const d = c.domain;
  const u = c.url.toLowerCase();
  const t = c.text.toLowerCase();
  const n = c.label.toLowerCase();

  // --- Domain-specific routing ---
  if (['realtimerendering.com', 'advances.realtimerendering.com'].includes(d)) {
    return { file: '04-lighting.yml', sub: 'rendering-shader-theory', type: 'reference' };
  }
  if (d.endsWith('unity3d.com') || d === 'blogs.unity3d.com') {
    return { file: '04-lighting.yml', sub: 'rendering-shader-theory', type: 'reference' };
  }
  if (d === 'developer.apple.com') {
    if (u.includes('realitykit') || u.includes('arkit') || u.includes('usdz')) return { file: '10-tools-pipeline.yml', sub: 'usd', type: 'reference' };
    return { file: '10-tools-pipeline.yml', sub: 'misc-3d-utilities', type: 'reference' };
  }
  if (d === 'marmoset.co') return { file: '12-software-reference.yml', sub: 'render-engines', type: 'reference' };
  if (d === 'alembic.io') return { file: '10-tools-pipeline.yml', sub: 'pipeline-standards', type: 'reference' };
  if (d === 'aframe.io') return { file: '12-software-reference.yml', sub: 'game-engines-free-oss', type: 'software' };
  if (d === 'quixel.com') return { file: '01-assets.yml', sub: 'textures-premium', type: 'asset-source' };

  // Engine domains
  if (['ogre3d.org', 'jpct.net', 'cocos2d-x.org', 'playcanvas.com', 'bevyengine.org', 'godotengine.org', 'unrealengine.com'].includes(d)) {
    return { file: '12-software-reference.yml', sub: 'game-engines-free-oss', type: 'software' };
  }

  // GitHub-hosted items — more detailed inference
  if (d === 'github.com') {
    if (has(u, ['usd', 'usdz', 'openusd', 'pixaranimationstudios'])) return { file: '10-tools-pipeline.yml', sub: 'usd', type: 'reference' };
    if (has(u, ['materialx', 'openpbr', 'openexr', 'openimageio'])) return { file: '10-tools-pipeline.yml', sub: 'pipeline-standards', type: 'reference' };
    if (has(u, ['gaussian-splat', 'nerf', 'splatting', '3d-reconstruct'])) return { file: '10-tools-pipeline.yml', sub: 'gaussian-splatting-nerf', type: 'reference' };
    if (has(u, ['photogrammetry', 'colmap', 'meshroom', 'sfm'])) return { file: '10-tools-pipeline.yml', sub: 'photogrammetry-scanning', type: 'reference' };
    if (has(u, ['retopo', 'retopology', 'instant-mesh', 'remesh'])) return { file: '10-tools-pipeline.yml', sub: 'retopology-mesh-tools', type: 'reference' };
    if (has(u, ['uv-layout', 'uvpack', 'udim'])) return { file: '10-tools-pipeline.yml', sub: 'uv-tools', type: 'reference' };
    if (has(u + ' ' + t, ['shader', 'glsl', 'hlsl', 'pbr'])) return { file: '04-lighting.yml', sub: 'rendering-shader-theory', type: 'reference' };
    if (has(u, ['blender', '-blender', '/blender'])) return { file: '02-modeling.yml', sub: 'blender-plugins-addons', type: 'plugin' };
    if (has(u, ['houdini', 'sidefx', 'hdas'])) return { file: '02-modeling.yml', sub: 'houdini-plugins-tools', type: 'plugin' };
    if (has(u, ['godot', 'godotengine'])) return { file: '07-game-dev.yml', sub: 'godot-plugins', type: 'plugin' };
    if (has(u, ['unreal', 'unrealengine', 'ue4', 'ue5'])) return { file: '07-game-dev.yml', sub: 'unreal-engine-resources', type: 'reference' };
    if (has(u, ['ai-', '-ai-', 'stable-diffusion', 'diffusion', 'comfyui', 'controlnet'])) return { file: '09-ai-ml.yml', sub: 'ai-assisted-cg-tools', type: 'tool' };
    if (has(u, ['compositor', 'compositing', 'nuke-'])) return { file: '05-vfx.yml', sub: 'tech-art', type: 'reference' };
    if (has(u, ['pixel-art', 'pixelart', 'tilemap', 'ldtk'])) return { file: '07-game-dev.yml', sub: 'game-dev-sprite-vfx', type: 'tool' };
    if (has(u, ['physics', 'jolt', 'box2d', 'rapier'])) return { file: '07-game-dev.yml', sub: 'game-dev-physics', type: 'tool' };
    if (has(u + ' ' + t, ['procedural', 'wfc', 'wavefunction'])) return { file: '07-game-dev.yml', sub: 'game-dev-ai-procedural', type: 'tool' };
    if (has(u, ['level-editor', 'tile-editor', 'map-editor'])) return { file: '07-game-dev.yml', sub: 'game-dev-level-design', type: 'tool' };
    if (has(u, ['pipeline', 'shotgrid', 'ftrack', 'kitsu', 'renderfarm'])) return { file: '10-tools-pipeline.yml', sub: 'scene-pipeline-tools', type: 'software' };
    if (has(u, ['rigging', 'mocap', 'animation'])) return { file: '10-tools-pipeline.yml', sub: 'rigging-animation-tools', type: 'tool' };
    if (has(u, ['viewer', 'gltf-', 'threejs'])) return { file: '10-tools-pipeline.yml', sub: 'misc-3d-utilities', type: 'tool' };
    if (has(u, ['graphics-', 'graphics-book', 'cg-'])) return { file: '04-lighting.yml', sub: 'rendering-shader-theory', type: 'reference' };
    // Generic CG GitHub repo
    return { file: '10-tools-pipeline.yml', sub: 'misc-3d-utilities', type: 'tool' };
  }

  // Patreon / creator platforms
  if (d === 'patreon.com') return { file: '11-learning-community.yml', sub: 'patreon-creators', type: 'channel' };
  if (d === 'gumroad.com') return { file: '11-learning-community.yml', sub: 'patreon-creators', type: 'channel' };
  if (d === 'vimeo.com') return { file: '11-learning-community.yml', sub: 'inspiration-showcase', type: 'inspiration' };
  if (d === 'artstation.com' || d === 'behance.net') return { file: '11-learning-community.yml', sub: 'inspiration-showcase', type: 'inspiration' };
  if (d === 'itch.io' || d.endsWith('.itch.io')) {
    if (has(t, ['tool', 'editor', 'generator'])) return { file: '10-tools-pipeline.yml', sub: 'misc-3d-utilities', type: 'tool' };
    if (has(t, ['asset', 'pixel', 'sprite'])) return { file: '01-assets.yml', sub: 'game-assets', type: 'asset-source' };
    return { file: '10-tools-pipeline.yml', sub: 'misc-3d-utilities', type: 'software' };
  }

  // Wide keyword matching fallback
  if (has(t + ' ' + n, ['photogrammetry', 'reality capture', '3d scan'])) return { file: '10-tools-pipeline.yml', sub: 'photogrammetry-scanning', type: 'software' };
  if (has(t + ' ' + n, ['gaussian splat', 'nerf'])) return { file: '10-tools-pipeline.yml', sub: 'gaussian-splatting-nerf', type: 'reference' };
  if (has(t + ' ' + n, ['retopo', 'retopology', 'remesher'])) return { file: '10-tools-pipeline.yml', sub: 'retopology-mesh-tools', type: 'software' };
  if (has(t + ' ' + n, ['uv unwrap', 'uv pack', 'udim'])) return { file: '10-tools-pipeline.yml', sub: 'uv-tools', type: 'software' };
  if (has(t + ' ' + n, ['usd', 'universal scene description'])) return { file: '10-tools-pipeline.yml', sub: 'usd', type: 'reference' };
  if (has(t + ' ' + n, ['pipeline', 'render farm', 'shotgrid'])) return { file: '10-tools-pipeline.yml', sub: 'scene-pipeline-tools', type: 'software' };
  if (has(t + ' ' + n, ['compositing', 'compositor'])) return { file: '05-vfx.yml', sub: 'tech-art', type: 'reference' };
  if (has(t + ' ' + n, ['sfx', 'sound effects', 'audio library'])) return { file: '01-assets.yml', sub: 'audio-sfx-music', type: 'asset-source' };
  if (has(t + ' ' + n, ['font', 'typeface', 'typography'])) return { file: '08-art-design.yml', sub: 'design-principles-typography', type: 'reference' };
  if (has(t + ' ' + n, ['ai', 'generative', 'diffusion', 'stable-diffusion', 'midjourney'])) return { file: '09-ai-ml.yml', sub: 'ai-assisted-cg-tools', type: 'tool' };
  if (has(t + ' ' + n, ['texture', 'pbr material'])) return { file: '01-assets.yml', sub: 'textures-free-pbr', type: 'asset-source' };
  if (has(t + ' ' + n, ['hdri', 'panorama'])) return { file: '01-assets.yml', sub: 'hdris', type: 'asset-source' };
  if (has(t + ' ' + n, ['3d model', 'mesh library'])) return { file: '01-assets.yml', sub: 'model-libraries-free-general', type: 'asset-source' };
  if (has(t + ' ' + n, ['level editor', 'tilemap'])) return { file: '07-game-dev.yml', sub: 'game-dev-level-design', type: 'software' };
  if (has(t + ' ' + n, ['game engine'])) return { file: '12-software-reference.yml', sub: 'game-engines-free-oss', type: 'software' };
  if (has(t + ' ' + n, ['physics engine'])) return { file: '07-game-dev.yml', sub: 'game-dev-physics', type: 'tool' };
  if (has(t + ' ' + n, ['dialogue', 'narrative', 'visual novel'])) return { file: '07-game-dev.yml', sub: 'game-dev-dialogue-narrative', type: 'tool' };
  if (has(t + ' ' + n, ['portfolio', 'showcase', 'inspiration', 'vfx reel'])) return { file: '11-learning-community.yml', sub: 'inspiration-showcase', type: 'inspiration' };
  if (has(t + ' ' + n, ['tutorial', 'course', 'learn'])) return { file: '11-learning-community.yml', sub: 'paid-tutorial-platforms', type: 'tutorial' };
  if (has(t + ' ' + n, ['shader', 'glsl', 'hlsl'])) return { file: '04-lighting.yml', sub: 'rendering-shader-theory', type: 'reference' };
  if (has(t + ' ' + n, ['rendering', 'path tracing', 'ray tracing'])) return { file: '04-lighting.yml', sub: 'rendering-shader-theory', type: 'reference' };

  return null;
}

function has(text, kws) {
  return kws.some(k => text.includes(k));
}

function main() {
  const data = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
  const existing = loadExisting();
  const unclassified = data.alive.filter(c => !c.category);
  console.log(`Unclassified alive input: ${unclassified.length}`);

  let classified = 0, garbage = 0, dup = 0, stillUnclear = 0;
  const byBucket = new Map();
  const residualUnclear = [];

  for (const c of unclassified) {
    if (isGarbage(c)) { garbage++; continue; }
    const norm = strictNormalize(c.url);
    if (existing.has(norm)) { dup++; continue; }
    const cat = classify(c);
    if (!cat) { stillUnclear++; residualUnclear.push(c); continue; }
    classified++;
    const key = `${cat.file}::${cat.sub}`;
    if (!byBucket.has(key)) byBucket.set(key, []);
    byBucket.get(key).push({ cand: c, category: cat });
    existing.add(norm); // prevent intra-batch dup
  }

  // Write buckets to YAML
  const fileStats = {};
  const touchedFiles = new Map();
  for (const [key, items] of byBucket) {
    const [file, subSlug] = key.split('::');
    const fullPath = path.join(DATA_DIR, file);
    if (!touchedFiles.has(file)) touchedFiles.set(file, yaml.load(fs.readFileSync(fullPath, 'utf8')));
    const doc = touchedFiles.get(file);
    const sub = (doc.subsections || []).find(s => s.slug === subSlug);
    if (!sub) {
      console.warn(`WARN: sub ${subSlug} not found in ${file}, skipping ${items.length}`);
      continue;
    }
    sub.entries = sub.entries || [];
    for (const { cand, category } of items) {
      let desc = (cand.text || '').replace(cand.label, '').trim();
      desc = desc.replace(/^[-—:|·•]\s*/, '').replace(/^[\s—:-]+/, '').trim();
      if (desc.length > 250) desc = desc.slice(0, 247) + '...';
      const lower = desc.toLowerCase().replace(/\.$/, '');
      if (lower === cand.label.toLowerCase() || lower === '') {
        desc = '';
      }
      sub.entries.push({
        name: cand.label.trim(),
        url: cand.url,
        description: desc || `${cand.label.trim()}.`,
        entry_type: category.type
      });
    }
    fileStats[file] = (fileStats[file] || 0) + items.length;
  }

  for (const [file, doc] of touchedFiles) {
    fs.writeFileSync(path.join(DATA_DIR, file), yaml.dump(doc, { lineWidth: -1, noRefs: true }));
  }

  console.log(`\nTier-2 categorization:`);
  console.log(`  Classified:     ${classified}`);
  console.log(`  Garbage:        ${garbage}`);
  console.log(`  Dup:            ${dup}`);
  console.log(`  Still unclear:  ${stillUnclear}`);
  console.log('');
  for (const [file, n] of Object.entries(fileStats).sort()) {
    console.log(`  ${file}: +${n}`);
  }

  // Write residual for optional review
  if (residualUnclear.length) {
    const reportLines = ['# Residual unclassified after tier-2', ''];
    for (const c of residualUnclear) {
      const trail = (c.text || '').replace(c.label, '').trim().replace(/^[-—:|]\s*/, '').slice(0, 150);
      reportLines.push(`- **${c.label}** — ${c.url}`);
      if (trail) reportLines.push(`  - ${trail}`);
    }
    const residualPath = path.join(__dirname, '..', '_maintenance', 'unclassified-residual.md');
    fs.writeFileSync(residualPath, reportLines.join('\n'));
    console.log(`\nResidual → ${residualPath}`);
  }
}

main();
