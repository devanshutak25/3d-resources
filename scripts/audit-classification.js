#!/usr/bin/env node
// Flag likely-misplaced entries by checking domain/keyword/type/description
// against subsection expectations. Output: _maintenance/audit-report.md.
// Does NOT move anything — user reviews, then we act.

const fs = require('fs');
const path = require('path');
const catalog = require('./lib/catalog');

const OUT = path.join(__dirname, '..', '_maintenance', 'audit-report.md');

function domain(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } }

// Per-subsection expectations. Each rule: allowed/disallowed domain or keyword signals.
// Rule shape: { allowDomains?: Set, banDomains?: Set, requireKeyword?: RegExp,
//               banKeyword?: RegExp, allowTypes?: Set }
const SUBSECTION_RULES = {
  // Unity-only subsections
  'unity-engine-resources': {
    banDomains: new Set(['docs.unrealengine.com', 'dev.epicgames.com', 'sidefx.com', 'blender.org', 'godotengine.org']),
    hintKeyword: /\b(unity|hdrp|urp|shader\s*graph|asset\s*store)\b/i
  },
  'unreal-engine-resources': {
    banDomains: new Set(['unity.com', 'docs.unity3d.com', 'blogs.unity3d.com', 'godotengine.org']),
    hintKeyword: /\b(unreal|ue4|ue5|epic\s*games|niagara|blueprint)\b/i
  },
  'godot-plugins':        { hintKeyword: /\b(godot|gdscript|gd\s?native)\b/i, banDomains: new Set(['unity.com', 'unrealengine.com']) },
  'godot-learning':       { hintKeyword: /\b(godot|gdscript)\b/i },
  'godot-communities':    { hintKeyword: /\b(godot)\b/i },
  'godot-official':       { hintKeyword: /\b(godot)\b/i },
  'blender-plugins-addons': { hintKeyword: /\b(blender|b3d|addon)\b/i, banDomains: new Set(['unity.com', 'unrealengine.com']) },
  'blender-tutorials':    { hintKeyword: /\b(blender|b3d)\b/i },
  'houdini-plugins-tools':{ hintKeyword: /\b(houdini|vex|hda|sidefx)\b/i },
  'cinema-4d-plugins':    { hintKeyword: /\b(c4d|cinema\s*4d)\b/i },
  'cinema-4d-learning':   { hintKeyword: /\b(c4d|cinema\s*4d)\b/i },

  // AI / ML
  'ml-for-cg':            { allowDomains: new Set(['arxiv.org', 'github.com', 'huggingface.co', 'openai.com', 'deepmind.google', 'research.google', 'blog.research.google', 'research.nvidia.com', 'research.meta.com', 'paperswithcode.com', 'ieeexplore.ieee.org', 'dl.acm.org', 'openreview.net', 'neurips.cc', 'ai.google', 'ai.meta.com', 'blogs.nvidia.com']) },
  '3d-generation':        { hintKeyword: /\b(3d|mesh|nerf|gaussian|diffusion|generative|text-to-3d)\b/i },
  'image-generation':     { hintKeyword: /\b(image|diffusion|stable|midjourney|generative|text-to-image|gan)\b/i, banDomains: new Set(['unity.com', 'unrealengine.com', 'godotengine.org']) },

  // Shader / rendering theory
  'rendering-shader-theory': { banDomains: new Set(['unity.com', 'unrealengine.com', 'blender.org']), hintKeyword: /\b(shader|glsl|hlsl|opengl|vulkan|webgl|raymarching|pbr|raytracing|ray\s*tracing)\b/i },

  // Assets
  'audio-sfx-music':      { hintKeyword: /\b(sfx|sound|music|audio|foley|ambience)\b/i },
  'hdris':                { hintKeyword: /\b(hdri|hdr|environment\s*map|sky)\b/i },
  'textures-free-pbr':    { hintKeyword: /\b(texture|pbr|material)\b/i },
  'fonts':                { hintKeyword: /\b(font|typeface|typography)\b/i },
  'model-libraries-free-general': { banKeyword: /\b(tutorial|course)\b/i },

  // XR
  'xr-ar-vr':             { hintKeyword: /\b(ar|vr|xr|arkit|arcore|webxr|oculus|vive|hololens|visionos|quest)\b/i },

  // Gaussian/NeRF
  'gaussian-splatting-nerf': { hintKeyword: /\b(gaussian|nerf|splat|radiance\s*field|neural\s*render)\b/i }
};

// Entry-type expectations per subsection (if set, entries with other types get flagged).
const EXPECTED_TYPES = {
  'audio-sfx-music':      new Set(['asset-source', 'marketplace', 'tool']),
  'fonts':                new Set(['asset-source', 'marketplace', 'reference']),
  'hdris':                new Set(['asset-source', 'marketplace']),
  'textures-free-pbr':    new Set(['asset-source', 'marketplace', 'tool']),
  'youtube-blender':      new Set(['channel', 'tutorial', 'reference']),
  'youtube-houdini':      new Set(['channel', 'tutorial', 'reference']),
  'youtube-motion-c4d':   new Set(['channel', 'tutorial', 'reference']),
  'youtube-sculpting-characters': new Set(['channel', 'tutorial', 'reference']),
  'communities-forums':   new Set(['community']),
  'game-jams':            new Set(['community', 'reference']),
  'plugin-marketplaces':  new Set(['marketplace', 'asset-source'])
};

function load() {
  const subTitle = new Map();
  for (const meta of catalog.loadSections().sections) {
    for (const s of catalog.loadSection(meta.file).subsections || []) {
      subTitle.set(`${meta.file}::${s.slug}`, s.title);
    }
  }
  const all = [];
  for (const { sectionFile, subSlug, entry } of catalog.iterEntries()) {
    all.push({ entry, sub: subSlug, subTitle: subTitle.get(`${sectionFile}::${subSlug}`), file: sectionFile });
  }
  return all;
}

function audit(all) {
  const flags = [];
  const byUrl = new Map();
  const byNormName = new Map();

  for (const item of all) {
    const e = item.entry;
    const d = domain(e.url);
    const rule = SUBSECTION_RULES[item.sub];
    // Strip markdown links and bare URLs from desc so link text like ".../course/..." doesn't trip keyword rules.
    const descClean = (e.description || '').replace(/\[[^\]]*\]\([^)]*\)/g, '').replace(/https?:\/\/\S+/g, '');
    const textBlob = `${e.name} ${descClean}`.toLowerCase();

    // Dedup by normalized URL (keep query string — /watch?v=X differs per video)
    const norm = (e.url || '').replace(/#.*$/, '').replace(/\/$/, '').toLowerCase();
    if (!byUrl.has(norm)) byUrl.set(norm, []);
    byUrl.get(norm).push(item);

    // Dedup by name (normalized)
    const normName = (e.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (normName.length > 3) {
      if (!byNormName.has(normName)) byNormName.set(normName, []);
      byNormName.get(normName).push(item);
    }

    // Thin description
    if (!e.description || e.description.length < 10 || /^[a-z0-9-]{1,30}\.$/i.test(e.description)) {
      flags.push({ severity: 'low', kind: 'thin-description', item, msg: `desc="${e.description}"` });
    }
    // Name looks like junk
    if (/^(link|here|click|read|view|source)$/i.test((e.name || '').trim())) {
      flags.push({ severity: 'high', kind: 'junk-name', item, msg: `name="${e.name}"` });
    }
    if ((e.name || '').length < 3) {
      flags.push({ severity: 'high', kind: 'short-name', item, msg: `name="${e.name}"` });
    }

    // Domain/keyword mismatch per subsection rule
    if (rule) {
      if (rule.banDomains && rule.banDomains.has(d)) {
        flags.push({ severity: 'high', kind: 'domain-mismatch', item, msg: `${d} banned in ${item.sub}` });
      }
      if (rule.allowDomains && !rule.allowDomains.has(d) && d !== '') {
        // Only flag if the allow list is restrictive and the entry isn't obviously fine
        flags.push({ severity: 'medium', kind: 'domain-outside-allowlist', item, msg: `${d} not in allow list for ${item.sub}` });
      }
      if (rule.banKeyword && rule.banKeyword.test(textBlob)) {
        flags.push({ severity: 'medium', kind: 'keyword-banned', item, msg: `text matches banned /${rule.banKeyword.source}/` });
      }
      if (rule.hintKeyword && !rule.hintKeyword.test(textBlob) && !rule.hintKeyword.test(e.url)) {
        flags.push({ severity: 'low', kind: 'missing-hint-keyword', item, msg: `no match for /${rule.hintKeyword.source}/` });
      }
    }

    // Expected entry_type
    const expected = EXPECTED_TYPES[item.sub];
    if (expected && e.entry_type && !expected.has(e.entry_type)) {
      flags.push({ severity: 'medium', kind: 'type-mismatch', item, msg: `entry_type=${e.entry_type} not in [${[...expected].join(',')}]` });
    }

    // arxiv outside ML section
    if (d === 'arxiv.org' && !item.file.startsWith('09-')) {
      flags.push({ severity: 'medium', kind: 'arxiv-outside-ai', item, msg: `arxiv paper in ${item.file}` });
    }
    // shields.io / raw github images
    if (/^img\.shields\.io$|^camo\.githubusercontent\.com$|^raw\.githubusercontent\.com$/.test(d)) {
      flags.push({ severity: 'high', kind: 'badge-or-image-url', item, msg: `${d} not a resource URL` });
    }
    // file extension = image → not a resource
    if (/\.(png|jpg|gif|svg|webp)(\?.*)?$/i.test(e.url)) {
      flags.push({ severity: 'high', kind: 'image-asset-as-resource', item, msg: 'URL is an image file' });
    }
  }

  // Exact duplicate URLs across catalog
  for (const [u, items] of byUrl) {
    if (items.length > 1) {
      flags.push({ severity: 'high', kind: 'duplicate-url', item: items[0],
        msg: `also in: ${items.slice(1).map(x => `${x.file}::${x.sub}`).join(' | ')}` });
    }
  }
  // Name duplicates across different URLs — weaker signal
  for (const [n, items] of byNormName) {
    if (items.length > 1) {
      const urls = new Set(items.map(i => i.entry.url));
      if (urls.size > 1) {
        flags.push({ severity: 'low', kind: 'duplicate-name', item: items[0],
          msg: `${items.length} entries share name across: ${[...new Set(items.map(i => i.sub))].join(', ')}` });
      }
    }
  }

  return flags;
}

function report(flags, total) {
  const bySev = { high: [], medium: [], low: [] };
  for (const f of flags) bySev[f.severity].push(f);

  const byKind = {};
  for (const f of flags) byKind[f.kind] = (byKind[f.kind] || 0) + 1;

  const lines = [];
  lines.push(`# Classification audit — ${new Date().toISOString().slice(0, 10)}`);
  lines.push('');
  lines.push(`Total entries audited: **${total}**`);
  lines.push(`Total flags: **${flags.length}** (high: ${bySev.high.length}, medium: ${bySev.medium.length}, low: ${bySev.low.length})`);
  lines.push('');
  lines.push('## Summary by kind');
  lines.push('');
  for (const [k, n] of Object.entries(byKind).sort((a, b) => b[1] - a[1])) {
    lines.push(`- ${k}: ${n}`);
  }
  lines.push('');

  for (const sev of ['high', 'medium', 'low']) {
    const items = bySev[sev];
    if (!items.length) continue;
    lines.push(`## ${sev.toUpperCase()} (${items.length})`);
    lines.push('');
    // Group by kind within severity
    const byK = {};
    for (const f of items) { (byK[f.kind] = byK[f.kind] || []).push(f); }
    for (const [kind, list] of Object.entries(byK)) {
      lines.push(`### ${kind} (${list.length})`);
      lines.push('');
      for (const f of list.slice(0, 100)) {
        const e = f.item.entry;
        lines.push(`- \`${f.item.file}::${f.item.sub}\` — **${e.name}** — ${e.url}`);
        lines.push(`  - ${f.msg}`);
      }
      if (list.length > 100) lines.push(`- ... and ${list.length - 100} more`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

function main() {
  const all = load();
  const flags = audit(all);
  const md = report(flags, all.length);
  fs.writeFileSync(OUT, md);
  console.log(`Audited ${all.length} entries`);
  console.log(`Flags: ${flags.length}`);
  const bySev = flags.reduce((a, f) => (a[f.severity] = (a[f.severity] || 0) + 1, a), {});
  console.log(`  high:   ${bySev.high || 0}`);
  console.log(`  medium: ${bySev.medium || 0}`);
  console.log(`  low:    ${bySev.low || 0}`);
  console.log(`Report → ${OUT}`);
}

main();
