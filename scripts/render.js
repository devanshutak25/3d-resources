#!/usr/bin/env node
// Generator: reads data/*.yml → emits README.md.
// Hybrid (c) — data files are source of truth; README is derived.

const fs = require('fs');
const path = require('path');
const catalog = require('./lib/catalog');

// Build a map: "<sectionSlug>/<subSlug>" → { sectionTitle, subTitle, anchor }
// for B4 ToC scent + B5 "See also" cross-links. Anchor = subsection slugified
// title (must match the id injected by build-html.js).
let _subMapCache = null;
function getSubMap() {
  if (_subMapCache) return _subMapCache;
  const map = new Map();
  for (const meta of catalog.loadSections().sections) {
    const doc = catalog.loadSection(meta.file);
    for (const sub of doc.subsections || []) {
      const key = `${doc.slug}/${sub.slug}`;
      map.set(key, {
        sectionTitle: doc.title,
        sectionSlug: doc.slug,
        subSlug: sub.slug,
        subTitle: sub.title,
        subDescription: sub.description || '',
        anchor: githubAnchor(sub.title)
      });
    }
  }
  _subMapCache = map;
  return map;
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Round 3 §D: table-level mirroring. Map topical-section-slug → [sw-ref-sub-meta].
// Source-side declaration: each sw-ref subsection optionally sets `mirror_into:`.
let _mirrorMapCache = null;
function getMirrorMap() {
  if (_mirrorMapCache) return _mirrorMapCache;
  const map = new Map();
  const swRef = catalog.loadSection('12-software-reference.yml');
  for (const sub of swRef.subsections || []) {
    if (!sub.mirror_into) continue;
    const target = String(sub.mirror_into).trim();
    if (!map.has(target)) map.set(target, []);
    map.get(target).push(sub);
  }
  _mirrorMapCache = map;
  return map;
}

// B4: count entries (primary + mirrors) per "<sectionSlug>/<subSlug>".
let _subCountCache = null;
function getSubCounts() {
  if (_subCountCache) return _subCountCache;
  const counts = new Map();
  const slugByFile = new Map();
  for (const meta of catalog.loadSections().sections) {
    slugByFile.set(meta.file, catalog.loadSection(meta.file).slug);
  }
  for (const { sectionFile, subSlug, entry } of catalog.iterEntries()) {
    if (entry.deprecated) continue;
    const primary = `${slugByFile.get(sectionFile)}/${subSlug}`;
    const seen = new Set([primary]);
    counts.set(primary, (counts.get(primary) || 0) + 1);
    for (const p of entry.dual_listed_in || []) {
      if (seen.has(p)) continue;
      seen.add(p);
      counts.set(p, (counts.get(p) || 0) + 1);
    }
  }
  _subCountCache = counts;
  return counts;
}

function loadSubEntries(sectionFile, subSlug, sectionSlug) {
  const entries = [];
  const seenUrls = new Set();
  const targetPath = `${sectionSlug}/${subSlug}`;
  for (const ref of catalog.listChunks()) {
    const isPrimary = ref.sectionFile === sectionFile && ref.subSlug === subSlug;
    const chunk = catalog.loadChunk(ref.id);
    const chunkPrimary = `${ref.sectionSlug}/${ref.subSlug}`;
    for (const e of chunk.entries) {
      if (isPrimary) {
        const k = (e.url || '').toLowerCase();
        if (k && seenUrls.has(k)) continue;
        if (k) seenUrls.add(k);
        // Tag with primary location for B5 "See also".
        entries.push(Object.assign({}, e, { _primaryLoc: chunkPrimary }));
      } else {
        const dual = e.dual_listed_in || [];
        if (!dual.includes(targetPath)) continue;
        const k = (e.url || '').toLowerCase();
        if (k && seenUrls.has(k)) continue;
        if (k) seenUrls.add(k);
        entries.push(Object.assign({}, e, { _primaryLoc: chunkPrimary }));
      }
    }
  }
  return entries;
}

// B5: build the "See also" inline string for an entry, given the location
// where it's currently being rendered. Lists every other location it appears
// in (primary or mirror) as anchor links.
function seeAlsoLinks(entry, currentLoc) {
  const dual = entry.dual_listed_in || [];
  const all = new Set([entry._primaryLoc, ...dual].filter(Boolean));
  all.delete(currentLoc);
  if (!all.size) return '';
  const map = getSubMap();
  const parts = [];
  for (const loc of all) {
    const meta = map.get(loc);
    if (!meta) continue;
    parts.push(`<a href="#${meta.anchor}">${meta.sectionTitle} → ${meta.subTitle}</a>`);
  }
  if (!parts.length) return '';
  return `<small class="see-also">See also: ${parts.join(', ')}</small>`;
}

// Sort by `priority` desc (default 0), then alphabetically by name.
// Higher priority pins entries to the top — used to override the default
// alphabetical order when an entry should appear first regardless of name.
function alphaSort(entries) {
  return [...entries].sort((a, b) => {
    const pa = Number(a.priority) || 0;
    const pb = Number(b.priority) || 0;
    if (pa !== pb) return pb - pa;
    return (a.name || '').localeCompare(b.name || '', 'en', { sensitivity: 'base' });
  });
}

// §8 GitHub repo pill — replace broken `![][repo]` markup with an inline pill.
const GH_ICON = '<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';
function repoPill(href) {
  if (href) {
    return `<a href="${href}" class="repo-pill" target="_blank" rel="noopener noreferrer">${GH_ICON}GitHub</a>`;
  }
  return `<span class="repo-pill">${GH_ICON}GitHub</span>`;
}
// B2: license pill for non-table bullet entries. Free/Open Source/Free NC = no pill (absence ≡ free).
function licensePill(license) {
  if (!license) return '';
  const v = String(license).trim();
  const lower = v.toLowerCase();
  if (lower === 'free' || lower === 'open source' || lower === 'free nc' || lower === 'oss') return '';
  let cls = 'lic-paid';
  if (lower === 'freemium') cls = 'lic-freemium';
  else if (lower === 'subscription') cls = 'lic-subscription';
  else if (lower.startsWith('mixed')) cls = 'lic-mixed';
  return ` <span class="lic-pill ${cls}">${v}</span>`;
}

// A6: wrap decorative pictographic emoji so screen readers don't announce
// "open book emoji" before each entry. Skips the existing GH SVG (no emoji).
const EMOJI_RE = /(\p{Extended_Pictographic}️?(?:‍\p{Extended_Pictographic}️?)*)/gu;
function wrapEmoji(text) {
  if (!text) return text;
  return text.replace(EMOJI_RE, '<span aria-hidden="true">$1</span>');
}

function processDescription(desc) {
  if (!desc) return desc;
  // [![][repo]](URL) — closed paren
  desc = desc.replace(/\[!\[\]\[repo\]\]\(([^)\s]+)\)/g, (_, url) => repoPill(url.trim()));
  // [![][repo]](URL — unclosed paren (malformed YAML in some entries)
  desc = desc.replace(/\[!\[\]\[repo\]\]\(([^)\s]+)\)?/g, (_, url) => repoPill(url.trim()));
  // standalone ![][repo] → pill, no link
  desc = desc.replace(/!\[\]\[repo\]/g, () => repoPill(null));
  // Strip every other broken image-ref like ![][gpl], ![][mit], ![][win] etc.
  desc = desc.replace(/!\[\]\[[\w-]+\]/g, '');
  // A6: wrap decorative emoji last (after pill substitution, so SVG content is untouched).
  desc = wrapEmoji(desc);
  return desc.trim();
}

function githubAnchor(title) {
  // GitHub markdown anchor rules: lowercase, spaces → dashes, strip most punctuation.
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/ /g, '-');
}

function header() {
  return [
    '# [3D Resources: Software, Assets, Tutorials & Tools for 3D Artists](https://3d.devanshutak.xyz)',
    '',
    '<!-- only:readme -->',
    '[![Stars](https://img.shields.io/github/stars/devanshutak25/3d-resources?style=flat&logo=github&color=24292e)](https://github.com/devanshutak25/3d-resources/stargazers)',
    '[![License: CC0-1.0](https://img.shields.io/badge/license-CC0--1.0-blue.svg)](https://creativecommons.org/publicdomain/zero/1.0/)',
    '[![Validate](https://github.com/devanshutak25/3d-resources/actions/workflows/validate.yml/badge.svg)](https://github.com/devanshutak25/3d-resources/actions/workflows/validate.yml)',
    '[![Live site](https://img.shields.io/badge/live%20site-3d.devanshutak.xyz-7c3aed)](https://3d.devanshutak.xyz)',
    '<!-- /only:readme -->',
    '',
    '> A curated collection of **free and paid 3D resources**: software, assets, textures, HDRIs, tutorials, plugins, and learning material for Blender, Houdini, Cinema 4D, Maya, ZBrush, Unreal Engine, and more. Covers 3D modeling, animation, VFX, rendering, game development, motion graphics, and digital art.',
    '',
    '<!-- only:readme -->',
    '> 🔍 **Looking for something specific?** Use the interactive site at **[3d.devanshutak.xyz](https://3d.devanshutak.xyz)**. Search and filter by License · Platform · Workflow · Output.',
    '<!-- /only:readme -->',
    '',
    'Curated by [Devanshu Tak](https://devanshutak.xyz) · built with Claude',
    '',
    '[Suggest a resource](https://github.com/devanshutak25/3d-resources/issues) · [Contribute](CONTRIBUTING.md)',
    '',
    '> <span aria-hidden="true">⚠️</span> **Heads up:** links rot, licenses drift, prices age. Flag anything off via [GitHub](https://github.com/devanshutak25/3d-resources/issues).',
    ''
  ].join('\n');
}

function tocEntry(title, depth = 0) {
  const indent = '  '.repeat(depth);
  return `${indent}- [${title}](#${githubAnchor(title)})`;
}

// B4: ToC entry with item count and descriptor for information scent.
function tocEntryRich(sub, sectionSlug, depth = 0) {
  const indent = '  '.repeat(depth);
  const counts = getSubCounts();
  const key = `${sectionSlug}/${sub.slug}`;
  const n = counts.get(key) || 0;
  const countSpan = n ? ` <span class="toc-count">(${n} item${n === 1 ? '' : 's'})</span>` : '';
  const desc = (sub.description || '').trim();
  const descSpan = desc ? `<br><small class="toc-desc">${desc}</small>` : '';
  return `${indent}- [${sub.title}](#${githubAnchor(sub.title)})${countSpan}${descSpan}`;
}

function buildToC(sections) {
  const lines = ['## Contents', ''];
  for (const meta of sections.sections) {
    const full = path.join(catalog.DATA_DIR, meta.file);
    if (!fs.existsSync(full)) continue;
    const section = catalog.loadSection(meta.file);
    const sectionId = githubAnchor(section.title);
    // Use <details> for collapsible ToC. Blank lines inside let marked parse the bullets.
    lines.push('<details>');
    const featured = Array.isArray(meta.featured) ? meta.featured.slice(0, 3) : [];
    const featuredSpan = featured.length
      ? ` <span class="toc-featured">${featured.map(escHtml).join(' · ')}</span>`
      : '';
    lines.push(`<summary><a href="#${sectionId}">${section.title}</a>${featuredSpan}</summary>`);
    lines.push('');
    for (const sub of section.subsections || []) {
      lines.push(tocEntryRich(sub, section.slug, 0));
    }
    lines.push('');
    lines.push('</details>');
    lines.push('');
  }
  lines.push('---');
  lines.push('');
  return lines.join('\n');
}

// Single-source-of-truth software table renderer. Used by both canonical
// subsection rendering and Round 3 §D mirror blocks. Pass currentLoc=null in
// mirror context to suppress per-row "See also" (the table-level provenance
// subtitle covers that signal already).
function renderSoftwareTable(entries, currentLoc) {
  const lines = [];
  if (!entries.length) return lines;
  const hasPricing = entries.some(e => e.pricing);
  const header = hasPricing
    ? '| Software | Description | Pricing | License | Tags | Best For |'
    : '| Software | Description | License | Tags | Best For |';
  const sep = hasPricing
    ? '|---|---|---|---|---|---|'
    : '|---|---|---|---|---|';
  lines.push(header);
  lines.push(sep);
  for (const e of entries) {
    const name = `[${wrapEmoji(e.name)}](${e.url})`;
    let descCore = processDescription(e.description || '');
    if (currentLoc) {
      const seeAlso = seeAlsoLinks(e, currentLoc);
      if (seeAlso) descCore = descCore ? `${descCore}<br>${seeAlso}` : seeAlso;
    }
    const desc = descCore.replace(/\|/g, '\\|');
    const license = e.license || '';
    const tags = (e.readme_tags || []).join(' · ');
    const bestFor = e.best_for || '';
    if (hasPricing) {
      const pricing = e.pricing || '';
      lines.push(`| ${name} | ${desc} | ${pricing} | ${license} | ${tags} | ${bestFor} |`);
    } else {
      lines.push(`| ${name} | ${desc} | ${license} | ${tags} | ${bestFor} |`);
    }
  }
  lines.push('');
  return lines;
}

// Round 3 §D: append mirrored Software Reference tables into a topical section.
// Renders a raw-HTML <h3> with data-mirror="1" so the front-end can style it
// and the build-html.js id-injection regex (which only matches bare <h3>) skips
// it — we set id + tabindex ourselves. Provenance subtitle links to canonical.
function renderMirrorBlocks(sectionSlug) {
  const mirrors = getMirrorMap().get(sectionSlug);
  if (!mirrors || !mirrors.length) return [];
  const lines = [];
  for (const sub of mirrors) {
    const raw = loadSubEntries('12-software-reference.yml', sub.slug, 'software-reference');
    const active = alphaSort(raw.filter(e => !e.deprecated));
    const software = active.filter(e => e.entry_type === 'software');
    if (!software.length) continue;
    const canonicalAnchor = githubAnchor(sub.title);
    const mirrorId = `mirror-${sub.slug}`;
    const titleHtml = escHtml(sub.title);
    lines.push('');
    lines.push(`<h3 id="${mirrorId}" data-mirror="1" tabindex="-1">${titleHtml}</h3>`);
    lines.push(`<p class="mirror-provenance">Also in <a href="#${canonicalAnchor}">Software Reference → ${titleHtml}</a></p>`);
    lines.push('');
    lines.push(...renderSoftwareTable(software, null));
  }
  return lines;
}

// Render one subsection block (H3 + software table + reference bullets).
// Factored out of renderSection so subsection drill-down pages reuse the exact
// same entry formatting. Returns an array of markdown lines (no H2, no mirror
// blocks, no trailing rule).
function renderSubsection(section, sub, sectionFile) {
  const lines = [];
  lines.push(`### ${sub.title}`);
  lines.push('');
  if (sub.description) {
    lines.push(sub.description);
    lines.push('');
  }

  // Skip deprecated entries from README (link checker auto-flags these).
  const rawEntries = loadSubEntries(sectionFile, sub.slug, section.slug);
  const active = alphaSort(rawEntries.filter(e => !e.deprecated));
  const software = active.filter(e => e.entry_type === 'software');
  const references = active.filter(e => e.entry_type !== 'software');

  const currentLoc = `${section.slug}/${sub.slug}`;

  if (software.length) {
    lines.push(...renderSoftwareTable(software, currentLoc));
  }

  if (references.length) {
    if (software.length) {
      lines.push('**Related:**');
    }
    for (const e of references) {
      const desc = e.description ? `. ${processDescription(e.description)}` : '';
      const pill = licensePill(e.license);
      const seeAlso = seeAlsoLinks(e, currentLoc);
      const seeAlsoSuffix = seeAlso ? `<br>${seeAlso}` : '';
      lines.push(`- [${wrapEmoji(e.name)}](${e.url})${pill}${desc}${seeAlsoSuffix}`);
    }
    lines.push('');
  }
  return lines;
}

// Render a single subsection to a markdown string. Used by build-section-pages.js
// for /sections/<slug>/<sub-slug>/ drill-down pages. Returns '' if not found.
function renderSubsectionMarkdown(sectionFile, subSlug) {
  const section = catalog.loadSection(sectionFile);
  const sub = (section.subsections || []).find(s => s.slug === subSlug);
  if (!sub) return '';
  return renderSubsection(section, sub, sectionFile).join('\n');
}

function renderSection(section, sectionFile) {
  const lines = [];
  lines.push(`## ${section.title}`);
  lines.push('');
  if (section.description) {
    lines.push(section.description);
    lines.push('');
  }

  for (const sub of section.subsections) {
    lines.push(...renderSubsection(section, sub, sectionFile));
  }

  // Round 3 §D: append mirrored Software Reference tables (collapsed by default).
  // Skipped on the canonical Software Reference section itself.
  if (section.slug !== 'software-reference') {
    lines.push(...renderMirrorBlocks(section.slug));
  }

  lines.push('---');
  lines.push('');
  return lines.join('\n');
}

function buildAwesomeList() {
  const dir = path.join(__dirname, '..', '_maintenance', 'awesome-mining');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  return files.map(f => {
    const name = f.replace(/\.md$/, '');
    const i = name.indexOf('_');
    const owner = name.slice(0, i);
    const repo = name.slice(i + 1);
    return `- [${owner}/${repo}](https://github.com/${owner}/${repo})`;
  });
}

function footer() {
  const awesome = buildAwesomeList();
  return [
    '## Contributing',
    '',
    '[Contributions welcome!](CONTRIBUTING.md) Please read the guidelines before submitting a pull request.',
    '',
    '## Attribution',
    '',
    '<details>',
    '<summary>Sources & contributors</summary>',
    '',
    'Curated by [Devanshu Tak](https://devanshutak.xyz).',
    '',
    'Built with help from:',
    '',
    '- [Houdini Nerd](https://discord.gg/E9zA9Ft) by Christopher Rutledge',
    '- [Best 3D Resources](https://annethai.notion.site/) by Anne Thai',
    '- [thetoolbox.art](https://thetoolbox.art/) (some entries sourced from here)',
    '- Community contributions via [GitHub](https://github.com/devanshutak25/3d-resources)',
    '- Compiled with the help of [Claude Code](https://claude.com/claude-code)',
    '',
    '**Automated ingest sources:**',
    '',
    '- [80 Level](https://80.lv)',
    '- [Gumroad](https://gumroad.com)',
    '- [itch.io](https://itch.io)',
    '- YouTube channels & playlists',
    '',
    '<details>',
    `<summary><strong>GitHub awesome-lists mined (${awesome.length})</strong></summary>`,
    '',
    ...awesome,
    '',
    '</details>',
    '',
    '</details>',
    ''
  ].join('\n');
}

// ---- Lite mode --------------------------------------------------------------
// Lite README: landing page only. Hero + badges + per-section top picks + footer.
// Full catalog stays on the live site (3d.devanshutak.xyz/sections/<slug>/).
// Goal: README < 80KB so github.com renders it without truncation.

const SITE_BASE = 'https://3d.devanshutak.xyz';
const LITE_PICKS_PER_SECTION = 5;

// Flatten one section's non-deprecated entries across all subsections.
// Dedupes by URL. Used by lite mode to pick top picks.
function collectSectionEntries(sectionFile, sectionSlug) {
  const out = [];
  const seen = new Set();
  const section = catalog.loadSection(sectionFile);
  for (const sub of section.subsections || []) {
    const entries = loadSubEntries(sectionFile, sub.slug, sectionSlug);
    for (const e of entries) {
      if (e.deprecated) continue;
      const k = (e.url || e.name || '').toLowerCase();
      if (!k || seen.has(k)) continue;
      seen.add(k);
      out.push(Object.assign({}, e, { _sub: sub.title, _subSlug: sub.slug }));
    }
  }
  return out;
}

// Pick top N entries for a section. Prefer names that match meta.featured
// (case-insensitive substring). Top up with alpha-sorted entries (software
// first, then references) until N reached.
function pickTopForSection(meta) {
  const all = collectSectionEntries(meta.file, meta.slug);
  const featured = (meta.featured || []).map(n => String(n).toLowerCase());
  const picked = [];
  const usedUrls = new Set();

  // Pass 1: featured matches, in featured order.
  for (const want of featured) {
    const hit = all.find(e => {
      const url = (e.url || '').toLowerCase();
      if (usedUrls.has(url)) return false;
      const name = String(e.name || '').toLowerCase();
      return name === want || name.includes(want);
    });
    if (hit) {
      picked.push(hit);
      usedUrls.add((hit.url || '').toLowerCase());
    }
  }

  // Pass 2: top up — software first, then references, both alpha.
  const remaining = all.filter(e => !usedUrls.has((e.url || '').toLowerCase()));
  const software = alphaSort(remaining.filter(e => e.entry_type === 'software'));
  const refs = alphaSort(remaining.filter(e => e.entry_type !== 'software'));
  for (const e of [...software, ...refs]) {
    if (picked.length >= LITE_PICKS_PER_SECTION) break;
    picked.push(e);
  }

  return { picks: picked.slice(0, LITE_PICKS_PER_SECTION), total: all.length };
}

// Strip HTML tags + collapse whitespace for clean bullet descriptions.
function stripHtmlForLite(s) {
  if (!s) return '';
  return String(s)
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function renderLite() {
  const sectionsFile = catalog.loadSections();
  let out = '';
  out += header();

  out += '## Browse the catalog\n\n';
  out += `Full catalog lives on the [interactive site](${SITE_BASE}) with search, filter, and graph view. This README is a curated landing page; below is a hand-picked sample from each section.\n\n`;

  for (const meta of sectionsFile.sections) {
    const full = path.join(catalog.DATA_DIR, meta.file);
    if (!fs.existsSync(full)) continue;
    const { picks, total } = pickTopForSection(meta);
    const sectionLink = `${SITE_BASE}/sections/${meta.slug}/`;

    out += `### ${meta.title}\n\n`;
    if (meta.description) {
      out += `${meta.description}\n\n`;
    }
    if (picks.length) {
      for (const e of picks) {
        const name = wrapEmoji(e.name);
        const pill = licensePill(e.license);
        const desc = stripHtmlForLite(processDescription(e.description || ''));
        const descTail = desc ? `. ${desc}` : '';
        out += `- [${name}](${e.url})${pill}${descTail}\n`;
      }
      out += '\n';
    }
    out += `→ **[Browse all ${total} entries in ${meta.title} →](${sectionLink})**\n\n`;
  }

  out += '---\n\n';
  out += footer();
  return out;
}

// ---- Arg parsing -----------------------------------------------------------

function parseArgs(argv) {
  const args = { mode: 'full', onlyFile: null };
  for (const a of argv.slice(2)) {
    if (a.startsWith('--mode=')) args.mode = a.slice('--mode='.length);
    else if (!a.startsWith('--')) args.onlyFile = a;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);

  if (args.mode === 'lite') {
    process.stdout.write(renderLite());
    return;
  }

  const sectionsFile = catalog.loadSections();
  const onlyFile = args.onlyFile;

  let out = '';
  if (!onlyFile) {
    out += header();
    out += buildToC(sectionsFile);
  }
  for (const meta of sectionsFile.sections) {
    if (onlyFile && meta.file !== onlyFile) continue;
    const full = path.join(catalog.DATA_DIR, meta.file);
    if (!fs.existsSync(full)) continue;
    const section = catalog.loadSection(meta.file);
    out += renderSection(section, meta.file);
  }
  if (!onlyFile) {
    out += footer();
  }
  process.stdout.write(out);
}

// Exported for reuse by build-section-pages.js (subsection pages) and
// lib/seo-pages.js (page enumeration). These are the canonical entry-loading +
// rendering helpers; reusing them keeps subsection pages identical to the main
// site and keeps SEO page counts in sync with what actually renders.
module.exports = {
  loadSubEntries,
  alphaSort,
  renderSoftwareTable,
  seeAlsoLinks,
  processDescription,
  licensePill,
  wrapEmoji,
  githubAnchor,
  renderSubsection,
  renderSubsectionMarkdown
};

if (require.main === module) {
  main();
}
