#!/usr/bin/env node
// Conservative quarantine: move entries that fail ≥2 weak-quality signals to
// _maintenance/quarantine.yml. Skips entries with only a single-heuristic miss
// (to avoid false positives like "Poly Haven HDRIs" that don't match a regex).

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const catalog = require('./lib/catalog');

const Q_PATH = path.join(__dirname, '..', '_maintenance', 'quarantine.yml');

// Re-use the same subsection rules as audit (duplicated for standalone run).
const HINT_RULES = {
  'unity-engine-resources': /\b(unity|hdrp|urp|shader\s*graph|asset\s*store)\b/i,
  'unreal-engine-resources': /\b(unreal|ue4|ue5|epic\s*games|niagara|blueprint)\b/i,
  'godot-plugins': /\b(godot|gdscript|gd\s?native)\b/i,
  'godot-learning': /\b(godot|gdscript)\b/i,
  'godot-communities': /\b(godot)\b/i,
  'godot-official': /\b(godot)\b/i,
  'blender-plugins-addons': /\b(blender|b3d|addon)\b/i,
  'blender-tutorials': /\b(blender|b3d)\b/i,
  'houdini-plugins-tools': /\b(houdini|vex|hda|sidefx)\b/i,
  'cinema-4d-plugins': /\b(c4d|cinema\s*4d)\b/i,
  'cinema-4d-learning': /\b(c4d|cinema\s*4d)\b/i,
  'rendering-shader-theory': /\b(shader|glsl|hlsl|opengl|vulkan|webgl|raymarching|pbr|raytracing|ray\s*tracing)\b/i,
  'audio-sfx-music': /\b(sfx|sound|music|audio|foley|ambience)\b/i,
  'hdris': /\b(hdri|hdr|environment\s*map|sky)\b/i,
  'textures-free-pbr': /\b(texture|pbr|material)\b/i,
  'fonts': /\b(font|typeface|typography)\b/i,
  '3d-generation': /\b(3d|mesh|nerf|gaussian|diffusion|generative|text-to-3d)\b/i,
  'image-generation': /\b(image|diffusion|stable|midjourney|generative|text-to-image|gan)\b/i,
  'xr-ar-vr': /\b(ar|vr|xr|arkit|arcore|webxr|oculus|vive|hololens|visionos|quest)\b/i,
  'gaussian-splatting-nerf': /\b(gaussian|nerf|splat|radiance\s*field|neural\s*render)\b/i
};

function signals(e, subSlug) {
  const desc = (e.description || '').replace(/\[[^\]]*\]\([^)]*\)/g, '').replace(/https?:\/\/\S+/g, '').trim();
  const name = (e.name || '').trim();
  const s = [];

  // thin-description: < 20 chars after stripping URLs, or placeholder like "Tool."
  if (desc.length < 20) s.push('thin-description');
  else if (/^[A-Z][a-z0-9\s-]{0,30}\.?$/.test(desc) && desc.split(' ').length <= 3) s.push('thin-description');

  // generic/short name
  if (name.length < 4) s.push('short-name');
  if (/^(tool|library|plugin|editor|demo|sample|example|link|here)s?$/i.test(name)) s.push('generic-name');

  // desc ≈ name
  const ndesc = desc.toLowerCase().replace(/\.$/, '');
  const nname = name.toLowerCase();
  if (ndesc && (ndesc === nname || ndesc.startsWith(nname + ' '))) s.push('desc-equals-name');

  // missing hint keyword for this subsection
  const hint = HINT_RULES[subSlug];
  if (hint) {
    const blob = `${name} ${desc}`;
    if (!hint.test(blob) && !hint.test(e.url)) s.push('missing-hint-keyword');
  }

  // url is just a GitHub root (no repo) or missing path info
  try {
    const u = new URL(e.url);
    if (u.hostname === 'github.com' && u.pathname.split('/').filter(Boolean).length < 2) s.push('github-user-root');
  } catch {}

  return s;
}

function main() {
  const subTitle = new Map();
  for (const meta of catalog.loadSections().sections) {
    for (const s of catalog.loadSection(meta.file).subsections || []) {
      subTitle.set(`${meta.file}::${s.slug}`, s.title);
    }
  }

  const quarantined = []; // { entry, file, sub, signals }
  const byFileRemoved = {};
  const touched = new Map(); // chunk._path → chunk

  for (const chunk of catalog.iterChunks()) {
    const kept = [];
    let dropped = false;
    for (const e of chunk.entries) {
      const sigs = signals(e, chunk.subSlug);
      if (sigs.length >= 2) {
        quarantined.push({
          entry: e, file: chunk.sectionFile, sub: chunk.subSlug,
          subTitle: subTitle.get(`${chunk.sectionFile}::${chunk.subSlug}`),
          signals: sigs
        });
        byFileRemoved[chunk.sectionFile] = (byFileRemoved[chunk.sectionFile] || 0) + 1;
        dropped = true;
        continue;
      }
      kept.push(e);
    }
    if (dropped) {
      chunk.entries = kept;
      touched.set(chunk._path, chunk);
    }
  }

  // Write quarantine.yml — grouped by original location, easy to restore later
  const grouped = {};
  for (const q of quarantined) {
    const key = `${q.file}::${q.sub}`;
    if (!grouped[key]) grouped[key] = { file: q.file, sub: q.sub, title: q.subTitle, entries: [] };
    grouped[key].entries.push({
      name: q.entry.name,
      url: q.entry.url,
      description: q.entry.description,
      original_entry_type: q.entry.entry_type,
      signals: q.signals
    });
  }
  const qDoc = {
    quarantined_at: new Date().toISOString().slice(0, 10),
    total: quarantined.length,
    reason: 'Conservative audit: entries failing ≥2 quality signals. Review and restore or discard.',
    buckets: Object.values(grouped)
  };
  fs.writeFileSync(Q_PATH, yaml.dump(qDoc, { lineWidth: -1, noRefs: true }));

  // Save touched chunks
  for (const chunk of touched.values()) catalog.saveChunk(chunk);

  console.log(`Quarantined: ${quarantined.length}`);
  for (const [f, n] of Object.entries(byFileRemoved).sort()) console.log(`  ${f}: -${n}`);
  console.log(`\nQuarantine file: ${Q_PATH}`);

  // Signal frequency (what drove the quarantines)
  const sigFreq = {};
  for (const q of quarantined) for (const s of q.signals) sigFreq[s] = (sigFreq[s] || 0) + 1;
  console.log('\nSignal frequency:');
  for (const [s, n] of Object.entries(sigFreq).sort((a, b) => b[1] - a[1])) console.log(`  ${s}: ${n}`);
}
main();
