#!/usr/bin/env node
// Hand-curated placement for the 62 residual unclassified items.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Each entry: [file, subsection, name, url, description, entry_type, extra_fields?]
// Items with null file are skipped (dup, out-of-scope, dead, niche).

const PLACEMENTS = [
  // DUPS - skip
  ['SKIP', null, '3ds Max', 'http://www.autodesk.com/products/3ds-max/overview', 'dup of §12 3ds Max'],
  ['SKIP', null, 'Maya', 'http://www.autodesk.com/products/maya/overview', 'dup of §12 Maya'],
  ['SKIP', null, 'Radeon ProRender', 'https://www.amd.com/en/technologies/radeon-prorender', 'dup of §12 Radeon ProRender (AMD)'],
  ['SKIP', null, 'ZBrush', 'https://pixologic.com/', 'dup of §12 ZBrush'],
  ['SKIP', null, 'Opentoonz', 'https://opentoonz.github.io/', 'dup of §12 OpenToonz'],
  ['SKIP', null, 'OpenTimelineIO', 'http://opentimeline.io', 'dup of §10 pipeline-standards'],
  ['SKIP', null, 'cgwiki', 'http://www.tokeru.com/cgwiki/', 'dup of §2 CGWiki'],
  ['SKIP', null, 'Flamenco duplicate', 'https://www.flamenco.io/', 'keeping blender.org version only'],
  ['SKIP', null, 'DevianArt7Soul1', 'https://www.deviantart.com/7soul1/art/420-Pixel-Art-Icons-for-RPG-129892453', 'dup of 420 Pixel Art Icons'],

  // OUT OF SCOPE - skip
  ['SKIP', null, 'SDL', 'http://libsdl.org/', 'programming lib, not CG-specific'],
  ['SKIP', null, 'CGAL', 'https://www.cgal.org/', 'C++ geometry lib, programming focus'],
  ['SKIP', null, 'Unity Ads', 'https://unity.com/products/unity-ads', 'monetization SDK, out of scope'],
  ['SKIP', null, 'TruePCGaming', 'http://truepcgaming.com/', 'PC gaming news, not CG resource'],
  ['SKIP', null, 'Game Development Essentials (book)', 'http://www.goodreads.com/book/show/1633392.Game_Development_Essentials', 'book, not live resource'],
  ['SKIP', null, 'Unity in Action (book)', 'https://www.manning.com/books/unity-in-action-second-edition', 'book, not live resource'],
  ['SKIP', null, 'Turbulenz', 'http://biz.turbulenz.com/developers', 'dead publishing platform'],
  ['SKIP', null, 'LWF', 'http://gree.github.io/lwf/', 'outdated Flash-era tech'],
  ['SKIP', null, 'Timanthes', 'http://csdb.dk/release/?id=75871', 'C64 niche, outdated'],
  ['SKIP', null, 'Spritemate', 'http://www.spritemate.com', 'C64 niche'],

  // ACTUAL PLACEMENTS

  // Game engines (free/OSS)
  ['12-software-reference.yml', 'game-engines-free-oss', 'Babylon.js', 'https://www.babylonjs.com/', 'JavaScript 3D engine/framework for browser games and apps.', 'software',
    { best_for: 'Browser 3D apps/games', tags: { output: ['games', 'xr'], platform: ['web'], tech: ['real-time'] }, readme_tags: ['Browser', 'JavaScript'] }],
  ['12-software-reference.yml', 'game-engines-free-oss', 'Blend4Web', 'http://www.blend4web.com/', 'JavaScript framework for interactive 3D in browsers. Blender integration.', 'software',
    { best_for: 'Browser 3D from Blender', tags: { output: ['games', 'xr'], platform: ['web'] }, readme_tags: ['Browser', 'Blender Integration'] }],
  ['12-software-reference.yml', 'game-engines-free-oss', 'Three.js', 'http://threejs.org/', 'JavaScript 3D library — the standard for web 3D.', 'software',
    { best_for: 'Web 3D graphics (broad)', tags: { output: ['games', 'xr', 'generalist'], platform: ['web'] }, readme_tags: ['Browser', 'Standard JS 3D'] }],
  ['12-software-reference.yml', 'game-engines-free-oss', 'Ceramic', 'https://ceramic-engine.com/', 'Haxe cross-platform 2D framework. Exports to Windows, Mac, Linux, iOS, Android, HTML5/WebGL, Unity.', 'software',
    { best_for: '2D cross-platform (Haxe)', tags: { output: ['games'], platform: ['win', 'mac', 'linux', 'ios', 'android', 'web'] }, readme_tags: ['Haxe', 'Cross-Platform 2D'] }],
  ['12-software-reference.yml', 'game-engines-free-oss', 'Irrlicht', 'http://irrlicht.sourceforge.net/', 'Open source high-performance realtime 3D engine (C++).', 'software',
    { best_for: 'C++ realtime 3D (classic)', tags: { output: ['games'], platform: ['win', 'mac', 'linux'] }, readme_tags: ['C++', 'Classic Engine'] }],
  ['12-software-reference.yml', 'game-engines-free-oss', 'Panda3D', 'https://www.panda3d.org/', 'Python-based 3D engine (originated at Disney VR Studio, now CMU ETC).', 'software',
    { best_for: 'Python 3D games', tags: { output: ['games'], platform: ['win', 'mac', 'linux'] }, readme_tags: ['Python', 'Disney Origin'] }],
  ['12-software-reference.yml', 'game-engines-free-oss', 'Torque3D', 'https://torque3d.org/torque3d/', 'C++ engine with decades of Torque technology lineage.', 'software',
    { best_for: 'C++ game engine', tags: { output: ['games'], platform: ['win', 'mac', 'linux'] }, readme_tags: ['C++', 'Legacy']}],
  ['12-software-reference.yml', 'game-engines-free-oss', 'SpriteBuilder', 'http://www.spritebuilder.com/', 'Open source game development suite for macOS.', 'software',
    { best_for: '2D games on Mac', tags: { output: ['games'], platform: ['mac'] }, readme_tags: ['Mac-only', '2D'] }],

  // Game engines (commercial)
  ['12-software-reference.yml', 'game-engines-commercial', 'Evergine', 'https://evergine.com/', 'Enterprise-focused graphics engine for 3D business and industry applications.', 'software',
    { best_for: 'Enterprise 3D apps', tags: { output: ['product-viz', 'games', 'xr'], platform: ['win'] }, readme_tags: ['Enterprise', 'Industrial'] }],

  // 3D Software
  ['12-software-reference.yml', '3d-software-paid', 'Modo', 'https://www.foundry.com/products/modo', 'Foundry\'s 3D modeling, texturing, rendering package.', 'software',
    { best_for: 'Modeling, product viz', tags: { workflow: ['modeling', 'texturing', 'rendering'], output: ['product-viz', 'film-vfx'], platform: ['win', 'mac', 'linux'] }, readme_tags: ['Foundry', 'Modeling Focus'] }],
  ['12-software-reference.yml', '3d-software-paid', 'Daz 3D', 'https://www.daz3d.com/', 'Character-focused 3D software w/ large marketplace of figures and morphs. Free core app.', 'software',
    { best_for: 'Character-centric scenes', tags: { workflow: ['modeling', 'animation'], output: ['illustration', 'film-vfx'], platform: ['win', 'mac'] }, readme_tags: ['Characters', 'Huge Marketplace'] }],
  ['12-software-reference.yml', '3d-software-free', 'Sculptris', 'https://sculptris.br.uptodown.com/windows', 'Original free digital sculpting from Pixologic (predecessor to ZBrush Core).', 'software',
    { best_for: 'Free introductory sculpting', tags: { workflow: ['sculpting'], platform: ['win'] }, readme_tags: ['Free', 'Introductory Sculpt'] }],
  ['12-software-reference.yml', 'cad-software', 'Solvespace', 'https://solvespace.com/index.pl', 'Parametric 3D CAD modeling tool.', 'software',
    { best_for: 'Lightweight parametric CAD', tags: { workflow: ['modeling'], output: ['product-viz'], platform: ['win', 'mac', 'linux'] }, readme_tags: ['Parametric', 'Lightweight'] }],

  // 2D animation software
  ['12-software-reference.yml', '2d-animation-software', 'Tahoma2D', 'https://tahoma2d.org/', '2D and stop-motion animation (OpenToonz fork w/ modernized UI and features).', 'software',
    { best_for: '2D / stop motion', tags: { workflow: ['animation'], output: ['broadcast', 'illustration'], platform: ['win', 'mac', 'linux'], tech: ['opensource-alt'] }, readme_tags: ['OpenToonz Fork', 'Stop Motion'] }],
  ['12-software-reference.yml', '2d-animation-software', 'DragonBones', 'http://dragonbones.effecthub.com', 'Open source 2D skeletal animation — Flash-origin workflow, runtimes for multiple engines.', 'software',
    { best_for: '2D skeletal animation (OSS)', tags: { workflow: ['rigging', 'animation'], output: ['games'] }, readme_tags: ['Open Source', '2D Skeletal'] }],
  ['12-software-reference.yml', '2d-animation-software', 'Spriter Pro', 'https://brashmonkey.com/download-spriter-pro/', 'Modern tool for sprite animation (2D bone rigging).', 'software',
    { best_for: '2D sprite animation', tags: { workflow: ['animation'], output: ['games'], platform: ['win', 'mac'] }, readme_tags: ['Sprite Animation', 'Paid'] }],
  ['12-software-reference.yml', '2d-animation-software', 'GraphicsGale', 'https://graphicsgale.com/us/', 'Pixel art and sprite animation tool (free).', 'software',
    { best_for: 'Pixel art/sprite animation', tags: { workflow: ['animation'], output: ['games'], platform: ['win'] }, readme_tags: ['Pixel Art', 'Free'] }],

  // Design software (raster/vector editors)
  ['12-software-reference.yml', 'design-software', 'Pixelmator', 'http://www.pixelmator.com', 'Full-featured image editing app for the Mac.', 'software',
    { best_for: 'Mac image editing', tags: { workflow: ['texturing'], output: ['generalist'], platform: ['mac'] }, readme_tags: ['Mac-native', 'Image Editor'] }],
  ['12-software-reference.yml', 'design-software', 'PixiEditor', 'https://pixieditor.net/', 'Universal 2D graphics editor — procedural graphics w/ node graph, image editing, vectors, pixel art, animations.', 'software',
    { best_for: 'Unified 2D editor', tags: { workflow: ['texturing', 'animation'], output: ['games', 'illustration'], tech: ['node-based', 'procedural'] }, readme_tags: ['Unified', 'Node-based'] }],

  // Render engines
  ['12-software-reference.yml', 'render-engines', 'MoonRay', 'https://openmoonray.org/index', 'DreamWorks\' open-source MCRT production renderer used on feature films.', 'software',
    { best_for: 'Open-source film production renderer', tags: { workflow: ['rendering'], output: ['film-vfx'], tech: ['path-tracing', 'opensource-alt'] }, readme_tags: ['DreamWorks', 'Open Source'] }],

  // Game dev sprite/vfx tools
  ['07-game-dev.yml', 'game-dev-sprite-vfx', 'PyxelEdit', 'http://pyxeledit.com/', 'Pixel art editor for tilesets, levels, animations.', 'software',
    { best_for: 'Pixel art tilesets/levels', tags: { output: ['games'], platform: ['win', 'mac'] }, readme_tags: ['Tilesets', 'Pixel Art'] }],
  ['07-game-dev.yml', 'game-dev-sprite-vfx', 'Pixelator', 'http://pixelatorapp.com', 'Turn any image into pixel art.', 'software',
    { best_for: 'Image→pixel art', tags: { output: ['games', 'illustration'] }, readme_tags: ['Image→Pixel', 'Conversion'] }],
  ['07-game-dev.yml', 'game-dev-sprite-vfx', 'Pixa.Pics', 'https://pixa.pics/', 'Browser pixel-art tool w/ vectorization.', 'software',
    { best_for: 'Browser pixel art', tags: { output: ['games'], platform: ['web'] }, readme_tags: ['Browser', 'Vectorization'] }],
  ['07-game-dev.yml', 'game-dev-sprite-vfx', 'Pickle', 'http://www.pickleeditor.com/', 'Pixel art editor.', 'software',
    { best_for: 'Pixel art editing', tags: { output: ['games'] }, readme_tags: ['Pixel Art', 'Editor'] }],
  ['07-game-dev.yml', 'game-dev-sprite-vfx', 'Lightcube', 'https://www.lightcube.art/', 'Pixel art editor for Windows w/ PSD, JPEG, PNG, BMP, GIF support.', 'software',
    { best_for: 'Windows pixel art w/ PSD', tags: { output: ['games'], platform: ['win'] }, readme_tags: ['Windows', 'PSD Support'] }],

  // Game assets
  ['01-assets.yml', 'game-assets', 'GameArt2D', 'https://www.gameart2d.com/freebies.html', 'Free 2D game art pack collection.', 'asset-source',
    { license: 'Free', tags: { output: ['games'] }, readme_tags: ['Free', '2D'] }],
  ['01-assets.yml', 'game-assets', 'Oryx Design Lab', 'http://oryxdesignlab.com/', 'Cheap high-quality royalty-free sprite packs.', 'marketplace',
    { tags: { output: ['games'] }, readme_tags: ['Cheap', 'Royalty-Free'] }],
  ['01-assets.yml', 'game-assets', 'UnluckyStudio', 'https://unluckystudio.com/category/freegameart/', 'Free game art for 2D games.', 'asset-source',
    { license: 'Free', tags: { output: ['games'] }, readme_tags: ['Free', '2D'] }],
  ['01-assets.yml', 'game-assets', 'Reiner\'s Tilesets', 'http://www.reinerstilesets.de/', 'Free 2D and 3D graphics, classic game assets blog.', 'asset-source',
    { license: 'Free', tags: { output: ['games'] }, readme_tags: ['Classic', '2D + 3D'] }],
  ['01-assets.yml', 'game-assets', '420 Pixel Art Icons for RPGs', 'http://7soul1.deviantart.com/art/420-Pixel-Art-Icons-for-RPG-129892453', 'Set of 420 RPG icons, free for commercial use.', 'asset-source',
    { license: 'Free', tags: { output: ['games'] }, readme_tags: ['RPG Icons', 'Commercial-OK'] }],

  // Pipeline / scene tools
  ['10-tools-pipeline.yml', 'scene-pipeline-tools', 'Flamenco', 'https://flamenco.blender.org/', 'Blender Foundation\'s free render-farm manager.', 'software',
    { license: 'Open Source', best_for: 'Blender render farm', tags: { workflow: ['rendering'] }, readme_tags: ['Render Farm', 'Blender'] }],
  ['10-tools-pipeline.yml', 'scene-pipeline-tools', 'Coalition', 'http://coalition.readthedocs.io/en/latest/', 'Render-farm manager from Mercenaries Engineering (makers of Guerilla Render).', 'software',
    { license: 'Open Source', best_for: 'Small-studio render farm', tags: { workflow: ['rendering'] }, readme_tags: ['Render Farm', 'Guerilla-adjacent'] }],
  ['10-tools-pipeline.yml', 'scene-pipeline-tools', 'Field3D', 'https://magnuswrenninge.com/field3d', 'Open-source library for storing voxel data.', 'reference',
    { license: 'Open Source', readme_tags: ['Voxel Lib', 'Open Source'] }],
  ['10-tools-pipeline.yml', 'scene-pipeline-tools', 'Open3D', 'http://www.open3d.org/', 'Modern library for 3D data processing — point clouds, meshes, voxels, reconstruction.', 'software',
    { license: 'Open Source', best_for: '3D data processing (Python/C++)', readme_tags: ['3D Data Processing', 'Open Source'] }],

  // Photogrammetry / point cloud
  ['10-tools-pipeline.yml', 'photogrammetry-scanning', 'PCL (Point Cloud Library)', 'https://pointclouds.org/', 'Large-scale open project for 2D/3D image and point cloud processing.', 'software',
    { license: 'Open Source', best_for: 'Point cloud processing', tags: { tech: ['photogrammetry'] }, readme_tags: ['Point Clouds', 'Open Source'] }],

  // Pipeline standards
  ['10-tools-pipeline.yml', 'pipeline-standards', 'OpenDCX', 'http://www.opendcx.org/', 'C++ extensions for OpenEXR\'s "deep" file format (DreamWorks).', 'reference',
    { license: 'Open Source', readme_tags: ['EXR Deep', 'DreamWorks'] }],

  // VFX tech art (Nuke dev tools)
  ['05-vfx.yml', 'tech-art', 'Nuke Tools (VS Code)', 'https://open-vsx.org/extension/virgilsisoe/nuke-tools', 'VS Code extension for Nuke Python/BlinkScript development.', 'tool',
    { license: 'Open Source', readme_tags: ['VS Code', 'Nuke Dev'] }],
  ['05-vfx.yml', 'tech-art', 'NukeToolsST', 'https://packagecontrol.io/packages/NukeToolsST', 'Sublime Text package to send Python/BlinkScript code into Nuke.', 'tool',
    { readme_tags: ['Sublime Text', 'Nuke Dev'] }],

  // Animation / mocap (traditional, not AI — but go in §3 since no other home)
  ['03-animation.yml', 'ai-motion-capture', 'FreeMoCap', 'https://freemocap.org/', 'Free open-source motion capture system (traditional, not AI).', 'software',
    { license: 'Open Source', best_for: 'Open-source mocap', tags: { workflow: ['mocap'] }, readme_tags: ['Open Source', 'Mocap'] }],

  // Shader / rendering theory
  ['04-lighting.yml', 'rendering-shader-theory', 'Compact YCoCg Frame Buffer', 'http://jcgt.org/published/0001/01/02/', 'Paper on compact YCoCg frame buffer for small IBL buffers.', 'reference',
    { readme_tags: ['Paper', 'Frame Buffer'] }],

  // Communities / French CG / general CG forums
  ['11-learning-community.yml', 'communities-forums', '3DVF', 'http://3dvf.com', 'French CG news and community.', 'community',
    { readme_tags: ['French', 'CG News'] }],
  ['11-learning-community.yml', 'communities-forums', '3DPro', 'https://3dpro.org', '3D professionals community forum.', 'community',
    { readme_tags: ['Pro Community', 'Forum'] }],

  // Maya tutorials (new subsection addition not needed — use paid-tutorial-platforms for consistency)
  ['11-learning-community.yml', 'paid-tutorial-platforms', 'Beginning Python For Maya (Zurbrigg)', 'https://zurbrigg.teachable.com/p/python-3-for-maya-vol-1', 'Structured Python course for Maya users.', 'tutorial',
    { license: 'Paid', readme_tags: ['Maya + Python', 'Course'] }]
];

function main() {
  const sections = yaml.load(fs.readFileSync(path.join(DATA_DIR, 'sections.yml'), 'utf8'));
  const docs = new Map();
  let skipped = 0, added = 0, missingSub = 0;
  const byFile = {};

  for (const placement of PLACEMENTS) {
    const [file, sub, name, url, description, entry_type, extra] = placement;
    if (file === 'SKIP') { skipped++; continue; }
    if (!docs.has(file)) {
      const p = path.join(DATA_DIR, file);
      docs.set(file, yaml.load(fs.readFileSync(p, 'utf8')));
    }
    const doc = docs.get(file);
    const subObj = (doc.subsections || []).find(s => s.slug === sub);
    if (!subObj) { console.warn(`MISSING: ${file}::${sub} (for ${name})`); missingSub++; continue; }
    subObj.entries = subObj.entries || [];
    const entry = { name, url, description, entry_type, ...(extra || {}) };
    subObj.entries.push(entry);
    added++;
    byFile[file] = (byFile[file] || 0) + 1;
  }

  for (const [file, doc] of docs) {
    fs.writeFileSync(path.join(DATA_DIR, file), yaml.dump(doc, { lineWidth: -1, noRefs: true }));
  }

  console.log(`Processed residual:`);
  console.log(`  Added: ${added}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Missing subsection: ${missingSub}`);
  console.log('');
  for (const [f, n] of Object.entries(byFile).sort()) console.log(`  ${f}: +${n}`);
}

main();
