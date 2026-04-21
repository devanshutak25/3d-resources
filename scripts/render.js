#!/usr/bin/env node
// Generator: reads data/*.yml → emits README.md.
// Hybrid (c) — data files are source of truth; README is derived.

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

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
    const full = path.join(DATA_DIR, meta.file);
    if (!fs.existsSync(full)) continue;
    const section = yaml.load(fs.readFileSync(full, 'utf8'));
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

function renderSection(section) {
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
    const active = (sub.entries || []).filter(e => !e.deprecated);
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
        const desc = (e.description || '').replace(/\|/g, '\\|');
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
        const desc = e.description ? ` — ${e.description}` : '';
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
  const sectionsFile = yaml.load(fs.readFileSync(path.join(DATA_DIR, 'sections.yml'), 'utf8'));

  let out = '';
  if (!onlyFile) {
    out += header();
    out += buildToC(sectionsFile);
  }
  for (const meta of sectionsFile.sections) {
    if (onlyFile && meta.file !== onlyFile) continue;
    const full = path.join(DATA_DIR, meta.file);
    if (!fs.existsSync(full)) continue;
    const section = yaml.load(fs.readFileSync(full, 'utf8'));
    out += renderSection(section);
  }
  if (!onlyFile) {
    out += footer();
  }
  process.stdout.write(out);
}

main();
