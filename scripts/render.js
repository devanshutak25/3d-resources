#!/usr/bin/env node
// Generator: reads data/*.yml → emits README.md.
// Hybrid (c) — data files are source of truth; README is derived.

const fs = require('fs');
const path = require('path');
const catalog = require('./lib/catalog');

function loadSubEntries(sectionFile, subSlug, sectionSlug) {
  const entries = [];
  const seenUrls = new Set();
  const targetPath = `${sectionSlug}/${subSlug}`;
  for (const ref of catalog.listChunks()) {
    const isPrimary = ref.sectionFile === sectionFile && ref.subSlug === subSlug;
    const chunk = catalog.loadChunk(ref.id);
    for (const e of chunk.entries) {
      if (isPrimary) {
        const k = (e.url || '').toLowerCase();
        if (k && seenUrls.has(k)) continue;
        if (k) seenUrls.add(k);
        entries.push(e);
      } else {
        const dual = e.dual_listed_in || [];
        if (!dual.includes(targetPath)) continue;
        const k = (e.url || '').toLowerCase();
        if (k && seenUrls.has(k)) continue;
        if (k) seenUrls.add(k);
        entries.push(e);
      }
    }
  }
  return entries;
}

function alphaSort(entries) {
  return [...entries].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', 'en', { sensitivity: 'base' })
  );
}

// §8 GitHub repo pill — replace broken `![][repo]` markup with an inline pill.
const GH_ICON = '<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';
function repoPill(href) {
  if (href) {
    return `<a href="${href}" class="repo-pill" target="_blank" rel="noopener noreferrer">${GH_ICON}GitHub</a>`;
  }
  return `<span class="repo-pill">${GH_ICON}GitHub</span>`;
}
function processDescription(desc) {
  if (!desc) return desc;
  // [![][repo]](URL) → linked pill
  desc = desc.replace(/\[!\[\]\[repo\]\]\(([^)]+)\)/g, (_, url) => repoPill(url.trim()));
  // standalone ![][repo] → pill, no link
  desc = desc.replace(/!\[\]\[repo\]/g, () => repoPill(null));
  return desc;
}

function githubAnchor(title) {
  // GitHub markdown anchor rules: lowercase, spaces → dashes, strip most punctuation.
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function header() {
  return [
    '# [3D Resources: Software, Assets, Tutorials & Tools for 3D Artists](https://3d.devanshutak.xyz)',
    '',
    '> A curated collection of **free and paid 3D resources** — software, assets, textures, HDRIs, tutorials, plugins, and learning material for Blender, Houdini, Cinema 4D, Maya, ZBrush, Unreal Engine, and more. Covers 3D modeling, animation, VFX, rendering, game development, motion graphics, and digital art.',
    '',
    '*Curated by [Devanshu Tak](https://devanshutak.xyz)* compiled with the help of Claude Code.',
    '',
    '> ⚠️ **Heads up:** There might be issues — broken links, mislabelled licenses, stale prices, or sparse descriptions. Flag anything you spot via [GitHub](https://github.com/devanshutak25/3d-resources/issues).',
    '',
    '> **Looking for something specific?** Visit **[3d.devanshutak.xyz](https://3d.devanshutak.xyz)** for the interactive version with search and tag filtering (License · Platform · Workflow · Output).',
    '',
    '**Found something wrong or want to add a resource?** [Open an issue](https://github.com/devanshutak25/3d-resources/issues) to suggest changes, report broken links, or flag incorrect info. Want to contribute directly? [Read the guidelines](contributing.md) and submit a pull request.',
    ''
  ].join('\n');
}

function tocEntry(title, depth = 0) {
  const indent = '  '.repeat(depth);
  return `${indent}- [${title}](#${githubAnchor(title)})`;
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
    lines.push(`<summary><a href="#${sectionId}">${section.title}</a></summary>`);
    lines.push('');
    for (const sub of section.subsections || []) {
      lines.push(tocEntry(sub.title, 0));
    }
    lines.push('');
    lines.push('</details>');
    lines.push('');
  }
  lines.push('---');
  lines.push('');
  return lines.join('\n');
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

    if (software.length) {
      const hasPricing = software.some(e => e.pricing);
      const header = hasPricing
        ? '| Software | Description | Pricing | License | Tags | Best For |'
        : '| Software | Description | License | Tags | Best For |';
      const sep = hasPricing
        ? '|---|---|---|---|---|---|'
        : '|---|---|---|---|---|';
      lines.push(header);
      lines.push(sep);
      for (const e of software) {
        const name = `[${e.name}](${e.url})`;
        const desc = processDescription(e.description || '').replace(/\|/g, '\\|');
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
    }

    if (references.length) {
      if (software.length) {
        lines.push('**Related:**');
      }
      for (const e of references) {
        const desc = e.description ? ` — ${processDescription(e.description)}` : '';
        lines.push(`- [${e.name}](${e.url})${desc}`);
      }
      lines.push('');
    }
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
    '[Contributions welcome!](contributing.md) Please read the guidelines before submitting a pull request.',
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
    '- [Houdini Nerd](https://discord.gg/E9zA9Ft) — Christopher Rutledge',
    '- [Best 3D Resources](https://annethai.notion.site/) — Anne Thai',
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
    `**GitHub awesome-lists mined (${awesome.length}):**`,
    '',
    ...awesome,
    '',
    '</details>',
    ''
  ].join('\n');
}

function main() {
  const onlyFile = process.argv[2];
  const sectionsFile = catalog.loadSections();

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

main();
