#!/usr/bin/env node
// Rule-based auto-tagger. Only adds tags to entries missing them; never overwrites.
// Inference: subsection slug → default tags, URL host hints, license → tech.
const catalog = require('./lib/catalog');
const allChunks = [...catalog.iterChunks()];

// Subsection slug → default tags (additive). Each rule returns {tags, entry_type?}.
const SUB_RULES = [
  // 01-assets
  [/^model-libraries-/,         { tags: { workflow:['modeling'] },                 entry_type:'asset-source' }],
  [/^asset-marketplaces$/,      { tags: {},                                        entry_type:'marketplace' }],
  [/^free-asset-giveaways$/,    { tags: {},                                        entry_type:'asset-source' }],
  [/^software-specific-libraries$/,{ tags: { workflow:['modeling'] },              entry_type:'asset-source' }],
  [/^hdris$/,                   { tags: { workflow:['lighting'] },                 entry_type:'asset-source' }],
  [/^textures-/,                { tags: { workflow:['texturing','material-authoring'] }, entry_type:'asset-source' }],
  [/^stock-/,                   { tags: { workflow:['reference'] },                entry_type:'asset-source' }],
  [/^audio-sfx-music$/,         { tags: { workflow:['audio-design'] },             entry_type:'asset-source' }],
  [/^reel-music$/,              { tags: { workflow:['audio-design'] },             entry_type:'asset-source' }],
  [/^fonts$/,                   { tags: { output:['motion-graphics','illustration'] }, entry_type:'asset-source' }],
  [/^icons$/,                   { tags: { output:['motion-graphics','illustration'] }, entry_type:'asset-source' }],
  [/^game-assets$/,             { tags: { output:['games'] },                      entry_type:'asset-source' }],

  // 02-modeling
  [/^blender-plugins-addons$/,  { tags: { tech:['blender','blender-addon'] },      entry_type:'plugin' }],
  [/^blender-tutorials$/,       { tags: { tech:['blender'] },                      entry_type:'tutorial' }],
  [/^houdini-getting-started$/, { tags: { skill:['beginner'] },                    entry_type:'tutorial' }],
  [/^houdini-essential-learning$/,{ tags: {},                                      entry_type:'tutorial' }],
  [/^houdini-vex-coding$/,      { tags: {},                                        entry_type:'tutorial' }],
  [/^houdini-fx-simulations$/,  { tags: { workflow:['fx','simulation'] },          entry_type:'tutorial' }],
  [/^houdini-rigging-animation$/,{tags: { workflow:['rigging','animation'] },      entry_type:'tutorial' }],
  [/^houdini-grooming$/,        { tags: { workflow:['rigging'] },                  entry_type:'tutorial' }],
  [/^houdini-more-tutorials$/,  { tags: {},                                        entry_type:'tutorial' }],
  [/^houdini-plugins-tools$/,   { tags: { tech:['houdini-addon'] },                entry_type:'plugin' }],
  [/^houdini-courses-rebelway$/,{ tags: {},                                        entry_type:'tutorial' }],
  [/^houdini-communities$/,     { tags: {},                                        entry_type:'community' }],
  [/^cinema-4d-learning$/,      { tags: { output:['motion-graphics'] },            entry_type:'tutorial' }],
  [/^cinema-4d-plugins$/,       { tags: { output:['motion-graphics'] },            entry_type:'plugin' }],
  [/^cinema-4d-tips-workflows$/,{ tags: { output:['motion-graphics'] },            entry_type:'tutorial' }],
  [/^3ds-max-plugins$/,         { tags: {},                                        entry_type:'plugin' }],
  [/^fusion-360-learning$/,     { tags: { output:['product-viz'] },                entry_type:'tutorial' }],
  [/^material-creation-tools$/, { tags: { workflow:['material-authoring','texturing'] }, entry_type:'tool' }],

  // 03-animation
  [/^animation-learning-channels$/,{ tags: { workflow:['animation','rigging'] },   entry_type:'channel' }],
  [/^animation-courses$/,       { tags: { workflow:['animation'] },                entry_type:'tutorial' }],
  [/^ai-motion-capture$/,       { tags: { workflow:['mocap'], tech:['ai-generative'] }, entry_type:'tool' }],

  // 04-lighting
  [/^lighting-fundamentals$/,   { tags: { workflow:['lighting'], skill:['beginner'] }, entry_type:'tutorial' }],
  [/^lighting-redshift$/,       { tags: { workflow:['lighting','rendering'] },     entry_type:'tutorial' }],
  [/^lighting-production$/,     { tags: { workflow:['lighting'], skill:['advanced'] }, entry_type:'tutorial' }],
  [/^rendering-shader-theory$/, { tags: { workflow:['rendering'] },                entry_type:'reference' }],
  [/^renderer-specific-learning$/,{tags: { workflow:['rendering'] },               entry_type:'tutorial' }],

  // 05-vfx
  [/^virtual-production$/,      { tags: { output:['film-vfx','broadcast'] },       entry_type:'reference' }],
  [/^tech-art$/,                { tags: { workflow:['fx','rendering'] },           entry_type:'reference' }],

  // 06-motion-graphics
  [/^motion-graphics-channels$/,{ tags: { output:['motion-graphics'] },            entry_type:'channel' }],
  [/^motion-graphics-courses$/, { tags: { output:['motion-graphics'] },            entry_type:'tutorial' }],
  [/^after-effects-learning$/,  { tags: { output:['motion-graphics'] },            entry_type:'tutorial' }],
  [/^fusion-resolve$/,          { tags: { workflow:['compositing','color-grading'] }, entry_type:'tutorial' }],
  [/^motion-graphics-inspiration$/,{tags:{ output:['motion-graphics'] },           entry_type:'inspiration' }],
  [/^motion-graphics-tools$/,   { tags: { output:['motion-graphics'] },            entry_type:'tool' }],
  [/^video-editing-courses$/,   { tags: { workflow:['editing'] },                  entry_type:'tutorial' }],

  // 07-game-dev
  [/^godot-/,                   { tags: { output:['games'], tech:['opensource-alt'] } }],
  [/^unity-engine-resources$/,  { tags: { output:['games'], tech:['unity-plugin'] } }],
  [/^xr-ar-vr$/,                { tags: { output:['games','xr'], tech:['xr'] } }],
  [/^unreal-engine-resources$/, { tags: { output:['games'], tech:['unreal-plugin'] } }],
  [/^game-dev-level-design$/,   { tags: { output:['games'] },                      entry_type:'tool' }],
  [/^game-dev-dialogue-narrative$/,{tags:{ output:['games'] },                     entry_type:'tool' }],
  [/^game-dev-audio-middleware$/,{ tags: { output:['games'], workflow:['audio-design'] }, entry_type:'tool' }],
  [/^game-dev-networking$/,     { tags: { output:['games'] },                      entry_type:'tool' }],
  [/^game-dev-sprite-vfx$/,     { tags: { output:['games'], workflow:['fx'] },     entry_type:'tool' }],
  [/^game-dev-ai-procedural$/,  { tags: { output:['games'], tech:['procedural'] }, entry_type:'tool' }],
  [/^game-dev-physics$/,        { tags: { output:['games'], tech:['physics'] },    entry_type:'tool' }],
  [/^game-dev-version-control$/,{ tags: { output:['games'] },                      entry_type:'tool' }],
  [/^game-dev-analytics$/,      { tags: { output:['games'] },                      entry_type:'tool' }],
  [/^game-design-theory$/,      { tags: { output:['games'] },                      entry_type:'reference' }],
  [/^game-dev-learning-channels$/,{tags:{ output:['games'] },                      entry_type:'channel' }],
  [/^game-dev-courses$/,        { tags: { output:['games'] },                      entry_type:'tutorial' }],
  [/^game-dev-communities$/,    { tags: { output:['games'] },                      entry_type:'community' }],
  [/^game-jams$/,               { tags: { output:['games'] },                      entry_type:'community' }],

  // 08-art-design
  [/^concept-art-channels$/,    { tags: { workflow:['concept'] },                  entry_type:'channel' }],
  [/^concept-art-courses$/,     { tags: { workflow:['concept'] },                  entry_type:'tutorial' }],
  [/^drawing-painting-3d$/,     { tags: { workflow:['concept'] },                  entry_type:'tutorial' }],
  [/^photography$/,             { tags: { workflow:['reference'] },                entry_type:'reference' }],
  [/^cinematography-camera$/,   { tags: { workflow:['reference'] },                entry_type:'reference' }],
  [/^composition-visual-storytelling$/,{tags:{ workflow:['concept','reference'] }, entry_type:'reference' }],
  [/^animation-principles$/,    { tags: { workflow:['animation'] },                entry_type:'reference' }],
  [/^design-principles-typography$/,{tags:{workflow:['reference'] },               entry_type:'reference' }],
  [/^color-theory-tools$/,      { tags: { workflow:['reference'] },                entry_type:'tool' }],
  [/^design-tools$/,            { tags: {},                                        entry_type:'tool' }],
  [/^general-inspiration$/,     { tags: {},                                        entry_type:'inspiration' }],
  [/^2d-art-references$/,       { tags: { workflow:['reference'] },                entry_type:'reference' }],

  // 09-ai-ml
  [/^ml-for-cg$/,               { tags: { tech:['ai-generative'] },                entry_type:'reference' }],
  [/^image-generation$/,        { tags: { tech:['ai-generative'], workflow:['concept'] }, entry_type:'tool' }],
  [/^video-generation$/,        { tags: { tech:['ai-generative'] },                entry_type:'tool' }],
  [/^3d-generation$/,           { tags: { tech:['ai-generative'], workflow:['modeling'] }, entry_type:'tool' }],
  [/^texture-material-generation$/,{tags:{tech:['ai-generative'], workflow:['texturing','material-authoring'] }, entry_type:'tool' }],
  [/^comfyui-ecosystem$/,       { tags: { tech:['ai-generative'] },                entry_type:'tool' }],
  [/^ai-assisted-cg-tools$/,    { tags: { tech:['ai-generative'] },                entry_type:'tool' }],
  [/^ai-audio-music$/,          { tags: { tech:['ai-generative'], workflow:['audio-design'] }, entry_type:'tool' }],
  [/^open-source-models-hf$/,   { tags: { tech:['ai-generative','opensource-alt'] }, entry_type:'reference' }],

  // 10-tools-pipeline
  [/^usd$/,                     { tags: { tech:['usd'] },                          entry_type:'tool' }],
  [/^scene-pipeline-tools$/,    { tags: {},                                        entry_type:'tool' }],
  [/^gaussian-splatting-nerf$/, { tags: { tech:['gaussian-splatting','nerf'] },    entry_type:'tool' }],
  [/^photogrammetry-scanning$/, { tags: { tech:['photogrammetry'] },               entry_type:'tool' }],
  [/^retopology-mesh-tools$/,   { tags: { workflow:['retopo'] },                   entry_type:'tool' }],
  [/^uv-tools$/,                { tags: { workflow:['uv'] },                       entry_type:'tool' }],
  [/^rigging-animation-tools$/, { tags: { workflow:['rigging','animation'] },      entry_type:'tool' }],
  [/^matchmoving-tracking$/,    { tags: { workflow:['fx'] },                       entry_type:'tool' }],
  [/^misc-3d-utilities$/,       { tags: {},                                        entry_type:'tool' }],
  [/^plugin-marketplaces$/,     { tags: {},                                        entry_type:'marketplace' }],
  [/^conversion-tools$/,        { tags: {},                                        entry_type:'tool' }],
  [/^pipeline-standards$/,      { tags: {},                                        entry_type:'reference' }],
  [/^pipeline-overview$/,       { tags: {},                                        entry_type:'reference' }],

  // 11-learning-community
  [/^youtube-motion-c4d$/,      { tags: { output:['motion-graphics'] },            entry_type:'channel' }],
  [/^youtube-blender$/,         { tags: { tech:['blender'] },                      entry_type:'channel' }],
  [/^youtube-houdini$/,         { tags: {},                                        entry_type:'channel' }],
  [/^youtube-sculpting-characters$/,{tags:{ workflow:['sculpting'] },              entry_type:'channel' }],
  [/^paid-tutorial-platforms$/, { tags: {},                                        entry_type:'tutorial' }],
  [/^patreon-creators$/,        { tags: {},                                        entry_type:'channel' }],
  [/^communities-forums$/,      { tags: {},                                        entry_type:'community' }],
  [/^inspiration-showcase$/,    { tags: {},                                        entry_type:'inspiration' }],
  [/^architecture-viz$/,        { tags: { output:['archviz'] },                    entry_type:'inspiration' }],
  [/^salary-career-data$/,      { tags: {},                                        entry_type:'reference' }],
  [/^industry-trends$/,         { tags: {},                                        entry_type:'reference' }],

  // 12-software-reference
  [/^3d-software-free$/,        { tags: { tech:['opensource-alt'] },               entry_type:'software' }],
  [/^3d-software-free-tier$/,   { tags: {},                                        entry_type:'software' }],
  [/^3d-software-paid$/,        { tags: {},                                        entry_type:'software' }],
  [/^cad-software$/,            { tags: { output:['product-viz'] },                entry_type:'software' }],
  [/^2d-animation-software$/,   { tags: { output:['motion-graphics'] },            entry_type:'software' }],
  [/^vfx-compositing-software$/,{ tags: { workflow:['compositing'], output:['film-vfx'] }, entry_type:'software' }],
  [/^render-engines$/,          { tags: { workflow:['rendering'] },                entry_type:'software' }],
  [/^video-editing-software$/,  { tags: { workflow:['editing'] },                  entry_type:'software' }],
  [/^audio-software$/,          { tags: { workflow:['audio-design'] },             entry_type:'software' }],
  [/^design-software$/,         { tags: {},                                        entry_type:'software' }],
  [/^viewers-file-utilities$/,  { tags: {},                                        entry_type:'tool' }],
  [/^game-engines-free-oss$/,   { tags: { output:['games'], tech:['opensource-alt'] }, entry_type:'software' }],
  [/^game-engines-commercial$/, { tags: { output:['games'] },                      entry_type:'software' }],
];

function host(u){ try{ return new URL(u).hostname.replace(/^www\./,'').toLowerCase(); }catch(e){ return ''; } }
function mergeTags(existing, add){
  const out = existing ? JSON.parse(JSON.stringify(existing)) : {};
  for(const [k, vals] of Object.entries(add||{})){
    if(!Array.isArray(vals) || vals.length === 0) continue;
    const cur = Array.isArray(out[k]) ? out[k] : [];
    const set = new Set(cur);
    for(const v of vals) set.add(v);
    out[k] = [...set];
  }
  return out;
}

let tagged = 0, typed = 0;
const touched = new Set();
for (const c of allChunks) {
  let rule = null;
  for (const [rx, r] of SUB_RULES) { if (rx.test(c.subSlug)) { rule = r; break; } }
  if (!rule) continue;
  for (const e of c.entries) {
    const hadTags = e.tags && Object.keys(e.tags).length > 0;
    const h = host(e.url);
    const extra = {};
    if (h === 'youtube.com') extra.platform = ['web'];
    if (h === 'github.com' || h === 'gitlab.com') extra.tech = ['opensource-alt'];
    if (h === 'arxiv.org') extra.platform = ['web'];
    if (e.license === 'Open Source') extra.tech = [...(extra.tech||[]),'opensource-alt'];
    const combinedTags = mergeTags(mergeTags({}, rule.tags), extra);
    if (!hadTags && Object.keys(combinedTags).length > 0) {
      e.tags = combinedTags; tagged++; touched.add(c._path);
    } else if (hadTags) {
      const merged = mergeTags(e.tags, combinedTags);
      if (JSON.stringify(merged) !== JSON.stringify(e.tags)) {
        e.tags = merged; touched.add(c._path);
      }
    }
    if (!e.entry_type && rule.entry_type) {
      e.entry_type = rule.entry_type; typed++; touched.add(c._path);
    }
  }
}

console.log(`tagged (added tags to entries with none): ${tagged}`);
console.log(`entry_type filled: ${typed}`);
const mode = process.argv[2] || 'plan';
if (mode === 'apply') {
  const chunkByPath = new Map(allChunks.map(c => [c._path, c]));
  for (const p of touched) catalog.saveChunk(chunkByPath.get(p));
  console.log('✓ applied');
} else {
  console.log('(pass "apply" to write)');
}
