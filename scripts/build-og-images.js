#!/usr/bin/env node
// Generate per-section Open Graph PNGs (1200×630) from assets/og-template.svg.
// Each section page references its own image so Twitter/Reddit/Discord/Slack
// cards reflect what's being shared. Falls back to assets/og-image.png if
// generation fails.

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const catalog = require('./lib/catalog');

const TEMPLATE_PATH = path.join(__dirname, '..', 'assets', 'og-template.svg');
const OUT_DIR = path.join(__dirname, '..', '_site', 'assets', 'og');

// Naive title splitter: prefer to break on " & " or " — " or space near middle
// so long section names look balanced on two lines.
function splitTitleForTwoLines(title) {
  const t = title.trim();
  if (t.length <= 18) return [t, ''];
  const ampIdx = t.indexOf(' & ');
  if (ampIdx > 0) return [t.slice(0, ampIdx), '& ' + t.slice(ampIdx + 3)];
  const dashIdx = t.indexOf(' — ');
  if (dashIdx > 0) return [t.slice(0, dashIdx), t.slice(dashIdx + 3)];
  // Fallback: split on last space before the middle.
  const mid = Math.floor(t.length / 2);
  const left = t.slice(0, mid + 1).lastIndexOf(' ');
  if (left > 5) return [t.slice(0, left), t.slice(left + 1)];
  return [t, ''];
}

// XML-escape user-content text so it can't break the SVG.
function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Count entries per section (non-deprecated, primary chunks only — matches
// what's shown on each section page).
function countEntries() {
  const counts = new Map();
  for (const chunk of catalog.iterChunks()) {
    let n = counts.get(chunk.sectionFile) || 0;
    for (const e of chunk.entries) {
      if (e.deprecated) continue;
      if (!e.url || !e.name) continue;
      n++;
    }
    counts.set(chunk.sectionFile, n);
  }
  return counts;
}

function renderOne(template, meta, count) {
  const [line1, line2] = splitTitleForTwoLines(meta.title);
  const countText = `${count} curated entries`;
  // Rough width estimate so the count chip hugs its content.
  const chipWidth = 50 + countText.length * 14;

  const svg = template
    .replace('{{TITLE_LINE_1}}', xmlEscape(line1))
    .replace('{{TITLE_LINE_2}}', xmlEscape(line2))
    .replace('{{TAGLINE}}', xmlEscape(meta.description || ''))
    .replace('{{COUNT_TEXT}}', xmlEscape(countText))
    .replace('{{COUNT_CHIP_WIDTH}}', String(chipWidth))
    .replace('{{SLUG}}', xmlEscape(meta.slug));

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: {
      // No custom font — let resvg fall back to its system font search.
      // resvg-js bundles a stub; results render the SVG geometry even if the
      // exact font isn't available (we use widely-supported family stacks).
      loadSystemFonts: true
    }
  });
  return resvg.render().asPng();
}

function main() {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const counts = countEntries();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let okCount = 0;
  for (const meta of catalog.loadSections().sections) {
    try {
      const png = renderOne(template, meta, counts.get(meta.file) || 0);
      const outPath = path.join(OUT_DIR, `${meta.slug}.png`);
      fs.writeFileSync(outPath, png);
      const sizeKB = (png.length / 1024).toFixed(1);
      console.log(`Wrote og/${meta.slug}.png (${sizeKB} KB)`);
      okCount++;
    } catch (err) {
      console.error(`Failed og/${meta.slug}.png: ${err.message}`);
    }
  }
  console.log(`Generated ${okCount}/${catalog.loadSections().sections.length} OG images.`);
}

main();
