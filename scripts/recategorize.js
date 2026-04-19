#!/usr/bin/env node
// Reclassifies unclassified alive candidates using source-file + keyword routing,
// then rewrites awesome-alive.json for add-candidates.js to consume.

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', '_maintenance', 'awesome-alive.json');

// Source-file → default bucket. Fallback when nothing else matches.
const SOURCE_DEFAULTS = {
  'agarcialeon_awesome-unity.md':        { file: '07-game-dev.yml', sub: 'unity-engine-resources', type: 'tool' },
  'UnityCommunity_AwesomeUnityCommunity.md': { file: '07-game-dev.yml', sub: 'unity-engine-resources', type: 'tool' },
  'agmmnn_awesome-blender.md':           { file: '02-modeling.yml',  sub: 'blender-plugins-addons', type: 'plugin' },
  'wyhinton_AwesomeHoudini.md':          { file: '02-modeling.yml',  sub: 'houdini-plugins-tools',   type: 'plugin' },
  'nathakits_awesome-cinema4d.md':       { file: '02-modeling.yml',  sub: 'cinema-4d-plugins',       type: 'plugin' },
  'insthync_awesome-unreal.md':          { file: '07-game-dev.yml',  sub: 'unreal-engine-resources', type: 'tool' },
  'Coop56_awesome-unreal.md':            { file: '07-game-dev.yml',  sub: 'unreal-engine-resources', type: 'tool' },
  'tomByrer_awesome-unreal-engine.md':   { file: '07-game-dev.yml',  sub: 'unreal-engine-resources', type: 'tool' },
  'terrehbyte_awesome-ue4.md':           { file: '07-game-dev.yml',  sub: 'unreal-engine-resources', type: 'tool' },
  'AtakanFire_Awesome-Unreal-Engine.md': { file: '07-game-dev.yml',  sub: 'unreal-engine-resources', type: 'tool' },
  'UEProjectXmples_awesome-ue5.md':      { file: '07-game-dev.yml',  sub: 'unreal-engine-resources', type: 'tool' },
  'rive-app_awesome-rive.md':            { file: '03-animation.yml', sub: 'animation-learning-channels', type: 'reference' },
  'bertjiazheng_Awesome-CAD.md':         { file: '10-tools-pipeline.yml', sub: 'misc-3d-utilities', type: 'reference' },
  'bluesfdw_awesome-CAD.md':             { file: '10-tools-pipeline.yml', sub: 'misc-3d-utilities', type: 'reference' },
  'cutbypham_awesome-davinci-resolve.md':{ file: '06-motion-graphics.yml', sub: 'motion-graphics-inspiration', type: 'reference' },
  'inlife_awesome-ae.md':                { file: '06-motion-graphics.yml', sub: 'motion-graphics-inspiration', type: 'tool' },
  'oli-z_awesome-filmmaking.md':         { file: '08-art-design.yml', sub: 'cinematography-camera', type: 'reference' },
  'wentianli_awesome-video-editing.md':  { file: '06-motion-graphics.yml', sub: 'motion-graphics-inspiration', type: 'reference' },
  'Siilwyn_awesome-pixel-art.md':        { file: '07-game-dev.yml', sub: 'game-dev-sprite-vfx', type: 'tool' },
  'MrPeker_awesome-illustrations.md':    { file: '08-art-design.yml', sub: 'general-inspiration', type: 'inspiration' },
  'TheFrenchGhosty_awesome-art.md':      { file: '08-art-design.yml', sub: 'general-inspiration', type: 'inspiration' },
  'camilleroux_awesome-generative-art.md':{ file: '09-ai-ml.yml', sub: 'image-generation', type: 'reference' },
  'brabadu_awesome-fonts.md':            { file: '01-assets.yml', sub: 'fonts', type: 'asset-source' },
  'drwpow_awesome-oss-fonts.md':         { file: '01-assets.yml', sub: 'fonts', type: 'asset-source' },
  'rng70_Awesome-Fonts.md':              { file: '01-assets.yml', sub: 'fonts', type: 'asset-source' },
  'iamtpb_awesome-photography.md':       { file: '08-art-design.yml', sub: 'photography', type: 'reference' },
  'ibaaj_awesome-OpenSourcePhotography.md': { file: '08-art-design.yml', sub: 'photography', type: 'reference' },
  'ellisonleao_magictools.md':           { file: '07-game-dev.yml', sub: 'game-design-theory', type: 'reference' },
  'FronkonGames_Awesome-Gamedev.md':     { file: '07-game-dev.yml', sub: 'game-design-theory', type: 'reference' },
  'haxiomic_awesome-gamedev.md':         { file: '07-game-dev.yml', sub: 'game-design-theory', type: 'reference' },
  'Kavex_GameDev-Resources.md':          { file: '07-game-dev.yml', sub: 'game-design-theory', type: 'reference' },
  'teamgravitydev_gamedev-free-resources.md': { file: '07-game-dev.yml', sub: 'game-design-theory', type: 'reference' },
  'steven2358_awesome-generative-ai.md': { file: '09-ai-ml.yml', sub: 'image-generation', type: 'reference' },
  'aishwaryanr_awesome-generative-ai-guide.md': { file: '09-ai-ml.yml', sub: 'ml-for-cg', type: 'reference' },
  'brandonhimpfen_awesome-generative-ai.md': { file: '09-ai-ml.yml', sub: 'ml-for-cg', type: 'reference' },
  'natnew_Awesome-Generative-AI.md':     { file: '09-ai-ml.yml', sub: 'ml-for-cg', type: 'reference' },
  'bcmi_Awesome-Image-Composition.md':   { file: '09-ai-ml.yml', sub: 'image-generation', type: 'reference' },
  'bcmi_Awesome-Generative-Image-Composition.md': { file: '09-ai-ml.yml', sub: 'image-generation', type: 'reference' },
  'cgwire_awesome-cg-vfx-pipeline.md':   { file: '10-tools-pipeline.yml', sub: 'scene-pipeline-tools', type: 'tool' },
  'KelvinAnymoree_awesome-cg-pipeline.md': { file: '10-tools-pipeline.yml', sub: 'scene-pipeline-tools', type: 'tool' },
  'loonghao_awesome-cg-pipeline.md':     { file: '10-tools-pipeline.yml', sub: 'scene-pipeline-tools', type: 'tool' },
  'tom-choi_awesome-cg-pipeline.md':     { file: '10-tools-pipeline.yml', sub: 'scene-pipeline-tools', type: 'tool' },
  // All AR/VR sources → xr-ar-vr
  'unclamped_awesome-vr.md':             { file: '07-game-dev.yml', sub: 'xr-ar-vr', type: 'tool' },
  'melbvr_awesome-VR.md':                { file: '07-game-dev.yml', sub: 'xr-ar-vr', type: 'tool' },
  'cjroth_awesome-vr.md':                { file: '07-game-dev.yml', sub: 'xr-ar-vr', type: 'tool' },
  'mnrmja007_awesome-virtual-reality.md':{ file: '07-game-dev.yml', sub: 'xr-ar-vr', type: 'tool' },
  'dharmeshkakadia_awesome-AR.md':       { file: '07-game-dev.yml', sub: 'xr-ar-vr', type: 'tool' },
  'kidult00_awesome-AR.md':              { file: '07-game-dev.yml', sub: 'xr-ar-vr', type: 'tool' },
  'olucurious_Awesome-ARCore.md':        { file: '07-game-dev.yml', sub: 'xr-ar-vr', type: 'tool' },
  'olucurious_Awesome-ARKit.md':         { file: '07-game-dev.yml', sub: 'xr-ar-vr', type: 'tool' },
  'tobiasbueschel_awesome-WebAR.md':     { file: '07-game-dev.yml', sub: 'xr-ar-vr', type: 'tool' },
  'Domeee_awesome-augmented-reality.md': { file: '07-game-dev.yml', sub: 'xr-ar-vr', type: 'tool' },
  // CG baseline sources (pre-existing mining files)
  'Alinshans_awesome-cg.md':             { file: '11-learning-community.yml', sub: 'inspiration-showcase', type: 'reference' },
  'luisdnsantos_awesome-computer-graphics.md': { file: '11-learning-community.yml', sub: 'inspiration-showcase', type: 'reference' },
  'calinou_awesome-gamedev.md':          { file: '07-game-dev.yml', sub: 'game-design-theory', type: 'reference' },
  'mbrukman_awesome-game-dev.md':        { file: '07-game-dev.yml', sub: 'game-design-theory', type: 'reference' },
  // Added batch: web graphics, shaders, NeRF/3DGS, creative coding
  'terkelg_awesome-creative-coding.md':  { file: '11-learning-community.yml', sub: 'inspiration-showcase', type: 'reference' },
  'sjfricke_awesome-webgl.md':           { file: '04-lighting.yml', sub: 'rendering-shader-theory', type: 'reference' },
  'AxiomeCG_awesome-threejs.md':         { file: '04-lighting.yml', sub: 'rendering-shader-theory', type: 'reference' },
  'eug_awesome-opengl.md':               { file: '04-lighting.yml', sub: 'rendering-shader-theory', type: 'reference' },
  'vanrez-nez_awesome-glsl.md':          { file: '04-lighting.yml', sub: 'rendering-shader-theory', type: 'reference' },
  'MrNeRF_awesome-3D-gaussian-splatting.md': { file: '10-tools-pipeline.yml', sub: 'gaussian-splatting-nerf', type: 'reference' },
  'awesome-NeRF_awesome-NeRF.md':        { file: '10-tools-pipeline.yml', sub: 'gaussian-splatting-nerf', type: 'reference' },
  'mdyao_Awesome-3D-AIGC.md':            { file: '09-ai-ml.yml', sub: '3d-generation', type: 'reference' },
  'filipecalegario_awesome-generative-ai.md': { file: '09-ai-ml.yml', sub: 'image-generation', type: 'reference' },
  'waitin2010_awesome-computer-graphics.md': { file: '04-lighting.yml', sub: 'rendering-shader-theory', type: 'reference' },
  'querielo_awesome-computer-graphics.md': { file: '04-lighting.yml', sub: 'rendering-shader-theory', type: 'reference' },
  'ericjang_awesome-graphics.md':        { file: '04-lighting.yml', sub: 'rendering-shader-theory', type: 'reference' },
  'shlomif_awesome-graphics-programming.md': { file: '04-lighting.yml', sub: 'rendering-shader-theory', type: 'reference' },
  'fire_awesome-godot-procedural-manual-generation.md': { file: '07-game-dev.yml', sub: 'godot-plugins', type: 'plugin' }
};

// Domains/URL patterns to skip entirely (not resource candidates).
const SKIP_DOMAINS = new Set([
  'img.shields.io',
  'user-images.githubusercontent.com',
  'raw.githubusercontent.com',
  'camo.githubusercontent.com'
]);

// Keyword overrides — checked before source defaults.
function keywordOverride(c) {
  const t = (c.text || '').toLowerCase();
  const u = c.url.toLowerCase();
  const d = c.domain;

  if (SKIP_DOMAINS.has(d)) return 'SKIP';
  if (u.endsWith('.png') || u.endsWith('.jpg') || u.endsWith('.gif') || u.endsWith('.svg')) return 'SKIP';

  // arxiv papers → ml-for-cg
  if (d === 'arxiv.org') return { file: '09-ai-ml.yml', sub: 'ml-for-cg', type: 'reference' };

  // Unity domain → unity resources
  if (d === 'blogs.unity3d.com' || d === 'docs.unity3d.com' || d === 'unity.com' || d === 'unity3d.com') {
    return { file: '07-game-dev.yml', sub: 'unity-engine-resources', type: 'reference' };
  }
  // Unreal domain
  if (d === 'dev.epicgames.com' || d === 'docs.unrealengine.com' || d === 'unrealengine.com') {
    return { file: '07-game-dev.yml', sub: 'unreal-engine-resources', type: 'reference' };
  }
  // Blender community
  if (d === 'blenderartists.org' || d === 'devtalk.blender.org' || d === 'docs.blender.org' || d === 'blender.org') {
    return { file: '11-learning-community.yml', sub: 'communities-forums', type: 'community' };
  }
  // Godot
  if (d === 'godotengine.org' || d === 'docs.godotengine.org') {
    return { file: '07-game-dev.yml', sub: 'godot-learning', type: 'reference' };
  }

  // ARKit/ARCore/WebAR keywords
  if (/\b(arkit|arcore|webxr|webvr|hololens|oculus|vive|quest|\bvr\b|\bar\b(?!t\b))/i.test(c.text)) {
    return { file: '07-game-dev.yml', sub: 'xr-ar-vr', type: 'tool' };
  }

  // Youtube channel or video
  if (d === 'youtube.com' || d === 'youtu.be') {
    return { file: '11-learning-community.yml', sub: 'paid-tutorial-platforms', type: 'channel' };
  }

  // Gumroad = plugin/asset marketplace → plugin-marketplaces
  if (d === 'gumroad.com' || /\.gumroad\.com$/.test(d)) {
    return { file: '10-tools-pipeline.yml', sub: 'plugin-marketplaces', type: 'marketplace' };
  }

  // itch.io game engine or tool
  if (/\.itch\.io$/.test(d) || d === 'itch.io') {
    return { file: '07-game-dev.yml', sub: 'game-design-theory', type: 'reference' };
  }

  // Apple/Google dev docs → XR likely
  if (d === 'developer.apple.com' && /arkit|reality|visionos/i.test(c.text)) {
    return { file: '07-game-dev.yml', sub: 'xr-ar-vr', type: 'reference' };
  }
  if (d === 'developers.google.com' && /arcore|ar\b/i.test(c.text)) {
    return { file: '07-game-dev.yml', sub: 'xr-ar-vr', type: 'reference' };
  }

  return null;
}

function main() {
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  let added = 0, skipped = 0;
  const missingSource = new Set();

  for (const c of data.alive) {
    if (c.category) continue; // keep already-classified
    const kw = keywordOverride(c);
    if (kw === 'SKIP') { skipped++; continue; }
    if (kw) { c.category = kw; added++; continue; }
    const src = c.sources && c.sources[0];
    const def = src && SOURCE_DEFAULTS[src];
    if (def) { c.category = def; added++; continue; }
    if (src) missingSource.add(src);
  }

  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  console.log(`Newly categorized: ${added}`);
  console.log(`Skipped (junk):    ${skipped}`);
  const stillUn = data.alive.filter(c => !c.category).length;
  console.log(`Still unclassified: ${stillUn}`);
  if (missingSource.size) {
    console.log('\nSources without default rule:');
    for (const s of missingSource) console.log('  ' + s);
  }
}

main();
