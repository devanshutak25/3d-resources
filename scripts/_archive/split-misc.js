#!/usr/bin/env node
// Takes 10-tools-pipeline.yml :: misc-3d-utilities, relocates entries by URL-based mapping.
// Skips garbage and duplicates.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '..', 'data');

// url → ['FILE.yml', 'sub-slug'] or ['SKIP', reason] or ['KEEP']
const MAPPING = {
  // --- KEEP in misc-3d-utilities (genuinely miscellaneous) ---
  'lightmap.co.uk': ['KEEP'],
  'vfxcamdb.com': ['KEEP'],
  'people.csail.mit.edu/mrub/vidmag': ['KEEP'],
  'massivesoftware.com': ['KEEP'],
  'storm-vfx.com': ['KEEP'],
  'iquilezles.org/apps/graphtoy': ['KEEP'],
  'windmillart.net/?p=jsplacement': ['KEEP'],
  'soulwire.co.uk/math-for-motion': ['KEEP'],
  'github.com/anvaka/city-roads': ['KEEP'],
  'pureref.com': ['KEEP'],
  'blockbench.net': ['KEEP'],
  'meshlab.net': ['KEEP'],
  'photopea.com': ['KEEP'],
  'quadspinner.com': ['KEEP'],
  'plasticity.xyz': ['KEEP'],
  'dust3d.org': ['KEEP'],
  'darktable.org': ['KEEP'],
  'suncalc.org': ['KEEP'],
  'obsproject.com': ['KEEP'],
  'getsharex.com': ['KEEP'],
  'alexcpeterson.com/spacescape': ['KEEP'],
  'github.com/otto-link/hesiod': ['KEEP'],
  'ifsrenderer.z97.io': ['KEEP'],
  'berlinnights.itch.io/texture-extractor': ['KEEP'],
  'berlinnights.itch.io/sprite-stacker': ['KEEP'],
  'aachman98.itch.io/sorcar': ['KEEP'],       // Procedural node-based tool — keep in misc
  'github.com/brutpitt/glchaos.p': ['KEEP'],  // Fractal viz
  'github.com/thargor6/mb3d': ['KEEP'],       // Mandelbulb3D
  'github.com/jacopocolo/penzil': ['KEEP'],   // Simple 3D drawing
  'github.com/esri/palladio': ['KEEP'],       // Esri procedural CGA

  // --- GAME ENGINES (free/OSS) ---
  'github.com/fuseeprojectteam/fusee': ['12-software-reference.yml', 'game-engines-free-oss'],
  'github.com/harfang3d/harfang3d': ['12-software-reference.yml', 'game-engines-free-oss'],
  'github.com/neoaxis/neoaxisengine': ['12-software-reference.yml', 'game-engines-free-oss'],
  'github.com/adriengivry/overload': ['12-software-reference.yml', 'game-engines-free-oss'],
  'github.com/upbge/upbge': ['12-software-reference.yml', 'game-engines-free-oss'],
  'github.com/blkdev2/pixie': ['12-software-reference.yml', 'game-engines-free-oss'],
  'github.com/blitz-research/blitz3d': ['12-software-reference.yml', 'game-engines-free-oss'],
  'github.com/circular-studios/dash': ['12-software-reference.yml', 'game-engines-free-oss'],
  'github.com/diligentgraphics/diligentengine': ['12-software-reference.yml', 'game-engines-free-oss'],
  'github.com/papercraftgames/folded-paper-engine': ['12-software-reference.yml', 'game-engines-free-oss'],
  'github.com/rxi/juno': ['12-software-reference.yml', 'game-engines-free-oss'],
  'github.com/nem0/lumixengine': ['12-software-reference.yml', 'game-engines-free-oss'],
  'github.com/lums-proj/lums': ['12-software-reference.yml', 'game-engines-free-oss'],
  'github.com/pixelvision8/pixelvision8': ['12-software-reference.yml', 'game-engines-free-oss'],
  'github.com/attackgoat/screen-13': ['12-software-reference.yml', 'game-engines-free-oss'],
  'github.com/whitestormjs/whitestorm.js': ['12-software-reference.yml', 'game-engines-free-oss'],
  'sparklinlabs.itch.io/superpowers': ['12-software-reference.yml', 'game-engines-free-oss'],

  // --- RENDER ENGINES ---
  'github.com/nvidiagameworks/falcor': ['12-software-reference.yml', 'render-engines'],
  'github.com/ktstephano/stratusgfx': ['12-software-reference.yml', 'render-engines'],
  'github.com/autodesk/aurora': ['12-software-reference.yml', 'render-engines'],
  'github.com/embarkstudios/kajiya': ['12-software-reference.yml', 'render-engines'],
  'github.com/fpsunflower/sunflow': ['12-software-reference.yml', 'render-engines'],
  'github.com/yafaray/libyafaray': ['12-software-reference.yml', 'render-engines'],

  // --- BLENDER PLUGINS/ADDONS ---
  'github.com/metric/materia': ['02-modeling.yml', 'material-creation-tools'],
  'github.com/alessandro-zomparelli/tissue': ['02-modeling.yml', 'blender-plugins-addons'],
  'github.com/nortikin/sverchok': ['02-modeling.yml', 'blender-plugins-addons'],
  'github.com/takanu/capsule': ['02-modeling.yml', 'blender-plugins-addons'],

  // --- HOUDINI PLUGINS/TOOLS ---
  'github.com/jtomori/vft': ['02-modeling.yml', 'houdini-plugins-tools'],       // VFX Fractal Toolkit
  'github.com/zenustech/zeno': ['02-modeling.yml', 'houdini-plugins-tools'],    // ZENO node-based sim

  // --- AI/ML ---
  'github.com/threestudio-project/threestudio': ['09-ai-ml.yml', '3d-generation'],
  'github.com/rafaelperez/rife-for-nuke': ['09-ai-ml.yml', 'ai-assisted-cg-tools'],
  'github.com/ivanmurzak/unity-mcp': ['09-ai-ml.yml', 'ai-assisted-cg-tools'],

  // --- GAME DEV SPRITE/VFX ---
  'github.com/rockbite/talos': ['07-game-dev.yml', 'game-dev-sprite-vfx'],
  'github.com/ttanasart-pt/pixel-composer': ['SKIP', 'dup of Pixel Composer in §12 2D animation'],
  'github.com/pixen/pixen': ['07-game-dev.yml', 'game-dev-sprite-vfx'],
  'github.com/velfi/voxelle-desktop': ['07-game-dev.yml', 'game-dev-sprite-vfx'],
  'github.com/kavex/spritesheet-maker': ['07-game-dev.yml', 'game-dev-sprite-vfx'],

  // --- GAME DEV AI / PROCEDURAL ---
  'github.com/ikpil/dotrecast': ['07-game-dev.yml', 'game-dev-ai-procedural'],

  // --- GAME DEV LEVEL DESIGN ---
  'github.com/nathanieljla/fspy-maya': ['10-tools-pipeline.yml', 'matchmoving-tracking'],

  // --- APPLE FRAMEWORKS (SceneKit/SpriteKit) ---
  'developer.apple.com/documentation/scenekit': ['12-software-reference.yml', 'game-engines-commercial'],
  'developer.apple.com/documentation/spritekit': ['12-software-reference.yml', 'game-engines-commercial'],
  'developer.apple.com/library/ios/documentation/graphicsanimation/conceptual/spritekit_pg/introduction/introduction.html': ['SKIP', 'dup SpriteKit'],
  'developer.apple.com/spritekit': ['SKIP', 'dup SpriteKit'],

  // --- §5 VFX / tech art ---
  'github.com/threedeejay/bino/tree/main': ['05-vfx.yml', 'tech-art'],
  'github.com/casparcg': ['05-vfx.yml', 'tech-art'],
  'github.com/gugenstudio/xcomp': ['05-vfx.yml', 'tech-art'],
  'github.com/toolchefs/kiko': ['05-vfx.yml', 'tech-art'],
  'github.com/rodeofx/openwalter': ['05-vfx.yml', 'tech-art'],

  // --- §12 video-editing-software ---
  'github.com/openshot/openshot-qt': ['12-software-reference.yml', 'video-editing-software'],

  // --- §10 pipeline-standards ---
  'github.com/nvidia/mdl-sdk': ['10-tools-pipeline.yml', 'pipeline-standards'],

  // --- §10 scene-pipeline-tools ---
  'github.com/heimlich1024/od_copypasteexternal': ['10-tools-pipeline.yml', 'scene-pipeline-tools'],
  'github.com/masqu3rad3/trigger': ['10-tools-pipeline.yml', 'rigging-animation-tools'],
  'github.com/qt/qtwebengine': ['SKIP', 'not CG, Qt framework'],
  'github.com/chadmv/cgcmake': ['10-tools-pipeline.yml', 'scene-pipeline-tools'],
  'github.com/imageengine/cortex': ['10-tools-pipeline.yml', 'scene-pipeline-tools'],
  'github.com/blurstudio/cross3d': ['10-tools-pipeline.yml', 'scene-pipeline-tools'],
  'github.com/theodox/mgui': ['10-tools-pipeline.yml', 'scene-pipeline-tools'],
  'github.com/theodox/minq': ['10-tools-pipeline.yml', 'scene-pipeline-tools'],
  'github.com/blurstudio/py3dsmax': ['10-tools-pipeline.yml', 'scene-pipeline-tools'],
  'github.com/lumapictures/pymel': ['10-tools-pipeline.yml', 'scene-pipeline-tools'],
  'github.com/chadmv/cvwrap': ['10-tools-pipeline.yml', 'rigging-animation-tools'],
  'github.com/liangliangnan/easy3d': ['10-tools-pipeline.yml', 'scene-pipeline-tools'],
  'github.com/nmwsharp/polyscope': ['10-tools-pipeline.yml', 'photogrammetry-scanning'],
  'github.com/rxlaboratory/ramses': ['10-tools-pipeline.yml', 'scene-pipeline-tools'],
  'github.com/eoyilmaz/stalker': ['10-tools-pipeline.yml', 'scene-pipeline-tools'],
  'github.com/mottosso/docker-maya': ['10-tools-pipeline.yml', 'scene-pipeline-tools'],
  'github.com/chadmv/cmt': ['10-tools-pipeline.yml', 'scene-pipeline-tools'],
  'github.com/viele/onionskinrenderer': ['10-tools-pipeline.yml', 'rigging-animation-tools'],

  // --- §10 viewers / misc ---
  'github.com/darbyjohnston/tlrender': ['KEEP'],  // tlRender video playback — stays in misc

  // --- §10 conversion-tools ---
  'isometric8.itch.io/packyderm-unitypackage-extractor': ['10-tools-pipeline.yml', 'conversion-tools'],

  // --- §4 rendering / reading ---
  'github.com/bkaradzic/bgfx': ['04-lighting.yml', 'rendering-shader-theory'],
  'github.com/jtomori/vfx_good_night_reading': ['04-lighting.yml', 'rendering-shader-theory'],
  'github.com/p4vv37/3d_software_and_python': ['10-tools-pipeline.yml', 'scene-pipeline-tools'],

  // --- §7 godot-plugins ---
  'github.com/alby90/gdspy': ['07-game-dev.yml', 'godot-plugins'],

  // --- Editors (too niche) ---
  'github.com/cmcpasserby/mayacharm': ['SKIP', 'too niche, JetBrains Maya integration'],
  'github.com/justinfx/mayasublime': ['SKIP', 'too niche, Sublime Text Maya package'],
  'github.com/teared/vex': ['SKIP', 'VEX editor fork, too niche'],
  'github.com/heavyimage/nuke.vim': ['SKIP', 'Vim syntax for Nuke, too niche'],

  // --- SKIP ---
  'github.com/obsproject/obs-studio': ['SKIP', 'dup of obsproject.com OBS Studio'],
  'github.com/colleagueriley/rgfw': ['SKIP', 'windowing framework, not CG-specific'],
  'github.com/id-software/wolf3d': ['SKIP', 'historical source code, not a live resource'],
  'github.com/o3de/o3de': ['SKIP', 'dup of O3DE in §12'],
  'github.com/friflo/friflo.engine.ecs': ['SKIP', 'ECS library, not CG-specific'],
  'github.com/mathewhdyt/unity-audio-manager': ['SKIP', 'niche Unity audio script'],
  'github.com/kavex/glueit': ['SKIP', 'no description, unclear purpose'],
  'github.com/epicgames': ['SKIP', 'GitHub org page (image tag), garbage'],
  'github.com/unity-technologies': ['SKIP', 'GitHub org page (image tag), garbage'],
  'github.com/bkaradzic/bgfx?tab=readme-ov-file': ['SKIP', 'dup bgfx'],
  'github.com/gafferhq/gaffer': ['SKIP', 'dup of Gaffer in §10 scene-pipeline-tools']
};

function urlKey(u) {
  try {
    const url = new URL(u);
    let k = url.hostname.replace(/^www\./, '') + url.pathname.replace(/\/+$/, '');
    if (url.search) k += url.search;
    return k.toLowerCase();
  } catch (e) { return u.toLowerCase(); }
}

function main() {
  const filePath = path.join(DATA_DIR, '10-tools-pipeline.yml');
  const doc = yaml.load(fs.readFileSync(filePath, 'utf8'));
  const misc = doc.subsections.find(s => s.slug === 'misc-3d-utilities');
  const originalEntries = misc.entries;

  const docs = new Map();
  docs.set('10-tools-pipeline.yml', doc);

  const newMisc = [];
  const moves = {};
  const skips = [];
  const unmapped = [];

  for (const e of originalEntries) {
    const key = urlKey(e.url);
    const rule = MAPPING[key];
    if (!rule) {
      // Default: keep in misc (preserves anything I didn't enumerate)
      newMisc.push(e);
      unmapped.push(e);
      continue;
    }
    if (rule[0] === 'KEEP') {
      newMisc.push(e);
      continue;
    }
    if (rule[0] === 'SKIP') {
      skips.push({ name: e.name, url: e.url, reason: rule[1] });
      continue;
    }
    // Move to another file/sub
    const [targetFile, targetSub] = rule;
    if (!docs.has(targetFile)) {
      docs.set(targetFile, yaml.load(fs.readFileSync(path.join(DATA_DIR, targetFile), 'utf8')));
    }
    const targetDoc = docs.get(targetFile);
    const sub = (targetDoc.subsections || []).find(s => s.slug === targetSub);
    if (!sub) {
      console.warn(`Target sub missing: ${targetFile}::${targetSub} for ${e.name}, keeping in misc`);
      newMisc.push(e);
      continue;
    }
    if (!Array.isArray(sub.entries)) sub.entries = [];
    try {
      sub.entries.push(e);
    } catch (err) {
      console.error(`FAIL at ${targetFile}::${targetSub} pushing ${e.name}: ${err.message}`);
      console.error(`sub.entries type: ${typeof sub.entries}, isArray: ${Array.isArray(sub.entries)}, length: ${sub.entries && sub.entries.length}`);
      throw err;
    }
    const k = `${targetFile}::${targetSub}`;
    moves[k] = (moves[k] || 0) + 1;
  }

  misc.entries = newMisc;

  for (const [f, d] of docs) {
    fs.writeFileSync(path.join(DATA_DIR, f), yaml.dump(d, { lineWidth: -1, noRefs: true }));
  }

  console.log(`misc-3d-utilities split complete`);
  console.log(`  Started with: ${originalEntries.length}`);
  console.log(`  Kept in misc: ${newMisc.length}`);
  console.log(`  Skipped:      ${skips.length}`);
  console.log(`  Moved:        ${originalEntries.length - newMisc.length - skips.length}`);
  console.log(`  (Unmapped kept in misc: ${unmapped.length})`);
  console.log('');
  console.log('Destinations:');
  for (const [k, n] of Object.entries(moves).sort()) console.log(`  ${k}: +${n}`);
  if (unmapped.length && unmapped.length < 30) {
    console.log('\nUnmapped (kept in misc as default):');
    for (const e of unmapped) console.log(`  - ${e.name} — ${e.url}`);
  }
}

main();
