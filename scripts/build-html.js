#!/usr/bin/env node
// Build: README.md → _site/index.html with heading IDs + SEO enhancements.
// Also emits _site/404.html and _site/robots.txt. (sitemap.xml is built last by
// scripts/build-sitemap.js so it can include subsection + tag pages.)

const { marked } = require('marked');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const catalog = require('./lib/catalog');

const SITE_URL = 'https://3d.devanshutak.xyz';
const REPO_URL = 'https://github.com/devanshutak25/3d-resources';

// Last-updated date for the footer. Use the most recent commit date; fall
// back to today if git isn't available (CI build, fresh checkout, etc.).
function lastUpdatedDate() {
  try {
    return execSync('git log -1 --format=%cs HEAD', { encoding: 'utf8' }).trim()
      || new Date().toISOString().slice(0, 10);
  } catch (_) {
    return new Date().toISOString().slice(0, 10);
  }
}
const TITLE = '3D Resources: Software, Assets, Tutorials & Tools for 3D Artists';
const DESCRIPTION = 'Curated hub of 1,300+ free and paid 3D resources: textures, HDRIs, models, tutorials, render engines, USD, VFX, and AI/ML. Filter by license and workflow.';

// GitHub-flavored anchor slugify. Differs from a naive slug in two ways:
//   1. `&amp;` (and bare `&`) is removed without inserting a dash, but the
//      surrounding spaces are preserved — which means " & " collapses to "  "
//      and then becomes "--" after the space→dash pass. This matches GitHub's
//      auto-generated heading anchors (e.g. "Motion Graphics & Video" →
//      "motion-graphics--video") so README ToC links and deployment H2/H3 IDs
//      resolve to the same target.
//   2. `\s` (not `\s+`) is used for the final replace so consecutive spaces
//      become consecutive dashes — same reason.
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&amp;/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s/g, '-');
}

// --- Load section structure for SEO enumeration ---
function loadSections() {
  const counts = new Map(); // `${sectionFile}::${subSlug}` → count
  const slugToFile = new Map();
  for (const meta of catalog.loadSections().sections) slugToFile.set(meta.slug, meta.file);
  for (const { sectionFile, subSlug, entry } of catalog.iterEntries()) {
    const seen = new Set();
    const primary = `${sectionFile}::${subSlug}`;
    counts.set(primary, (counts.get(primary) || 0) + 1);
    seen.add(primary);
    for (const p of entry.dual_listed_in || []) {
      const [secSlug, subOnly] = String(p).split('/');
      const file = slugToFile.get(secSlug);
      if (!file || !subOnly) continue;
      const k = `${file}::${subOnly}`;
      if (seen.has(k)) continue;
      seen.add(k);
      counts.set(k, (counts.get(k) || 0) + 1);
    }
  }
  const out = [];
  for (const meta of catalog.loadSections().sections) {
    const doc = catalog.loadSection(meta.file);
    out.push({
      slug: doc.slug,
      title: doc.title,
      description: doc.description,
      anchor: slugify(doc.title),
      subsections: (doc.subsections || []).map(s => ({
        slug: s.slug,
        title: s.title,
        description: s.description,
        anchor: slugify(s.title),
        entryCount: counts.get(`${meta.file}::${s.slug}`) || 0
      }))
    });
  }
  return out;
}

const sections = loadSections();
const totalEntries = sections.reduce((s, sec) => s + sec.subsections.reduce((t, ss) => t + ss.entryCount, 0), 0);
const LAST_UPDATED = lastUpdatedDate();

// --- Structured data (@graph) ---
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: '3D Resources',
      description: DESCRIPTION,
      inLanguage: 'en',
      publisher: { '@id': `${SITE_URL}/#person` }
    },
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/#person`,
      name: 'Devanshu Tak',
      url: 'https://devanshutak.xyz'
    },
    {
      '@type': 'CollectionPage',
      '@id': `${SITE_URL}/#collectionpage`,
      url: `${SITE_URL}/`,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      author: { '@id': `${SITE_URL}/#person` },
      inLanguage: 'en',
      isAccessibleForFree: true,
      numberOfItems: totalEntries,
      about: [
        '3D Modeling', 'Sculpting', 'Texturing', 'Rendering', 'Animation', 'Rigging',
        'Visual Effects', 'Compositing', 'Motion Graphics', 'Game Development',
        'Digital Art', 'Lighting', 'Shaders', 'USD Pipeline', 'Generative AI for CG'
      ].map(name => ({ '@type': 'Thing', name })),
      keywords: [
        'free pbr textures', 'hdri library', 'usd pipeline tools',
        '3d modeling software', 'vfx tutorials', 'game asset marketplace',
        'blender addons', 'houdini tutorials', 'motion graphics tools',
        'render engines', 'open source 3d software', 'ai 3d generation'
      ].join(', ')
    },
    {
      '@type': 'ItemList',
      '@id': `${SITE_URL}/#sections`,
      name: 'Sections',
      numberOfItems: sections.length,
      itemListElement: sections.map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: s.title,
        url: `${SITE_URL}/#${s.anchor}`,
        description: s.description
      }))
    }
  ]
};

// --- Render HTML ---
let md = fs.readFileSync('README.md', 'utf8');
// Strip GitHub-only blocks; uncomment site-only blocks.
md = md.replace(/<!--\s*only:readme\s*-->[\s\S]*?<!--\s*\/only:readme\s*-->\n?/g, '');
md = md.replace(/<!--\s*only:site\s*\n([\s\S]*?)\n\s*-->/g, '$1');
let html = marked.parse(md);

// C1: per-discipline icons keyed by section anchor (slugified section title).
// Keys match the GitHub-style anchor slugs (see slugify above). Headings with
// `&` in their text produce double-dash anchors (e.g. "assets--libraries").
const SECTION_ICONS = {
  'assets--libraries': 'package-variant',
  'modeling-sculpting--texturing': 'cube-outline',
  'animation--rigging': 'vector-curve',
  'lighting-rendering--shaders': 'lightbulb-outline',
  'vfx-compositing--virtual-production': 'creation',
  'motion-graphics--video': 'play-box-outline',
  'game-development': 'gamepad-variant-outline',
  'art-design--visual-storytelling': 'palette-outline',
  'ai--machine-learning-for-cg': 'brain',
  'tools-pipeline--utilities': 'tools',
  'learning-community--industry': 'school-outline',
  'software-reference': 'application-outline'
};

// Inject IDs on headings. A4: H2/H3 also get tabindex="-1" so ToC links can
// move keyboard focus to the heading without putting them in the tab order.
// C1: prepend discipline icon on H2 section headings.
html = html.replace(/<(h[1-6])>(.*?)<\/\1>/g, (m, tag, inner) => {
  const textOnly = inner.replace(/<[^>]+>/g, '');
  const id = slugify(textOnly);
  const extra = (tag === 'h2' || tag === 'h3') ? ' tabindex="-1"' : '';
  let body = inner;
  if (tag === 'h2' && SECTION_ICONS[id]) {
    body = `<i class="mdi mdi-${SECTION_ICONS[id]} section-icon" aria-hidden="true"></i>${inner}`;
  }
  return `<${tag} id="${id}"${extra}>${body}</${tag}>`;
});

// C1 (ToC): mirror discipline icon onto top-level ToC summary entries.
html = html.replace(/<summary>(\s*)<a href="#([^"]+)">/g, (m, ws, id) => {
  const icon = SECTION_ICONS[id];
  if (!icon) return m;
  return `<summary>${ws}<i class="mdi mdi-${icon} section-icon" aria-hidden="true"></i><a href="#${id}">`;
});

// "Edit on GitHub" link on each section H2 — sends users to the underlying
// data/<section>.yml on GitHub. Anchor ID → section file mapping is built
// from sections.yml so it stays in sync with the catalog.
const SECTION_FILE_BY_ANCHOR = (() => {
  const m = new Map();
  for (const sec of sections) m.set(sec.anchor, catalog.loadSection(sec.slug)._file);
  return m;
})();
html = html.replace(/<h2 id="([^"]+)"([^>]*)>([\s\S]*?)<\/h2>/g, (full, id, attrs, inner) => {
  const file = SECTION_FILE_BY_ANCHOR.get(id);
  if (!file) return full;
  const ghUrl = `${REPO_URL}/blob/main/data/${file}`;
  const editLink = `<a class="edit-on-gh" href="${ghUrl}" target="_blank" rel="noopener noreferrer" aria-label="Edit this section on GitHub"><i class="mdi mdi-pencil-outline" aria-hidden="true"></i><span>Edit</span></a>`;
  return `<h2 id="${id}"${attrs}>${inner}${editLink}</h2>`;
});

// Inject "Expand all" button inline on the Contents heading (right-aligned).
html = html.replace(
  /<h2 id="contents"([^>]*)>([\s\S]*?)<\/h2>/,
  '<h2 id="contents"$1><span class="contents-label">$2</span><button type="button" id="expand-all-btn" class="expand-all-btn" aria-pressed="false">Expand all</button></h2>'
);

// A5: heading hierarchy assertion — fail build if h4/h5/h6 appears as a
// direct sibling of h2 without an intervening h3 (i.e. skipping a level).
(() => {
  const re = /<(h[2-6])\s/g;
  let lastH2Skipped = false;
  let depth = 2;
  let m;
  const errors = [];
  while ((m = re.exec(html))) {
    const lvl = parseInt(m[1].slice(1), 10);
    if (lvl === 2) { depth = 2; continue; }
    if (lvl === 3) { depth = 3; continue; }
    // h4+ — must be preceded by h3 in current section.
    if (depth < lvl - 1) {
      const ctxStart = Math.max(0, m.index - 60);
      errors.push(`heading skip: ${m[1]} after depth ${depth} near "${html.slice(ctxStart, m.index + 30).replace(/\s+/g, ' ')}"`);
    }
    if (depth < lvl) depth = lvl;
  }
  if (errors.length) {
    console.error('A5 heading hierarchy violations:');
    for (const e of errors) console.error('  -', e);
    process.exit(1);
  }
})();

// A9: external link hygiene. Add target="_blank" + rel="noopener noreferrer"
// to every external <a href="http..."> that doesn't already set them, so the
// CSS [target="_blank"]::after glyph kicks in and security is consistent.
(() => {
  const SITE_HOST = new URL(SITE_URL).hostname;
  html = html.replace(/<a\s+([^>]*?)href="(https?:\/\/[^"]+)"([^>]*)>/g, (full, pre, href, post) => {
    let host;
    try { host = new URL(href).hostname; } catch (_) { return full; }
    if (host === SITE_HOST) return full;
    const all = pre + ' ' + post;
    const hasTarget = /\btarget\s*=/.test(all);
    const hasRel = /\brel\s*=/.test(all);
    let extra = '';
    if (!hasTarget) extra += ' target="_blank"';
    if (!hasRel) extra += ' rel="noopener noreferrer"';
    if (!extra) return full;
    return `<a ${pre}href="${href}"${post}${extra}>`;
  });
})();

// Tag the "Heads up" blockquote with a class for yellow styling
html = html.replace(/<blockquote>\s*<p>((?:(?:<span[^>]*>⚠️<\/span>)|⚠️)?\s*<strong>Heads up:<\/strong>[\s\S]*?)<\/p>\s*<\/blockquote>/,
  '<blockquote class="callout-warning"><p>$1</p></blockquote>');

// Remove the "Looking for something specific?" callout from the deployed site.
// (Filter bar at top is the equivalent on the site.)
html = html.replace(/<blockquote>\s*<p><strong>Looking for something specific\?<\/strong>[\s\S]*?<\/p>\s*<\/blockquote>\s*/,
  '');

// SSR shell for the filter bar — gives crawlers a <search> landmark and
// no-JS users a visible affordance. filter.js removes this on init and
// builds the real interactive bar in its place.
const filterShell = `<div id="filter-shell" role="search">
  <input type="search" placeholder="Search resources…" aria-label="Search resources" disabled>
  <noscript>
    <p class="filter-noscript-notice">Filtering and search need JavaScript. The full table of contents below works without it. Pick a section and browse.</p>
  </noscript>
</div>`;
html = html.replace(/(<h2 id="contents")/, `${filterShell}\n$1`);

const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#000000">
  <title>${TITLE}</title>
  <meta name="description" content="${DESCRIPTION}">
  <meta name="keywords" content="3d resources, free pbr textures, hdri library, usd pipeline tools, blender, houdini, cinema 4d, maya, zbrush, unreal engine, free 3d models, textures, hdri, pbr materials, vfx tutorials, 3d animation, game assets, render engines, motion graphics, digital art, 3d learning, substance painter, free assets, 3d software, ai 3d generation, photogrammetry, gaussian splatting, nerf">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="author" content="Devanshu Tak">
  <link rel="canonical" href="${SITE_URL}/">
  <link rel="sitemap" type="application/xml" href="/sitemap.xml">
  <link rel="alternate" type="application/atom+xml" title="3D Resources: latest additions" href="/feed.xml">
  <meta name="google-site-verification" content="he46sgCFXN80qPjWX_KNO2ZJ8aqhaysIvSu1TQhCj2U">

  <!-- Open Graph -->
  <meta property="og:title" content="${TITLE}">
  <meta property="og:description" content="${DESCRIPTION}">
  <meta property="og:url" content="${SITE_URL}/">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="en_US">
  <meta property="og:site_name" content="3D Resources">
  <meta property="og:image" content="${SITE_URL}/assets/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="3D Resources: curated hub of 3D software, assets, tutorials, and tools">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${TITLE}">
  <meta name="twitter:description" content="${DESCRIPTION}">
  <meta name="twitter:image" content="${SITE_URL}/assets/og-image.png">
  <meta name="twitter:image:alt" content="3D Resources: curated hub of 3D software, assets, tutorials, and tools">

  <!-- Schema.org / structured data -->
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>

  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://api.fontshare.com" crossorigin>
  <link rel="preconnect" href="https://cdn.fontshare.com" crossorigin>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <!-- Critical CSS inlined so first paint doesn't wait on the full stylesheet. -->
  <style>
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; line-height: 1.55; background: #0d1117; color: #e6edf3; }
    .wrapper { max-width: 1100px; margin: 0 auto; padding: 1.25rem 1.25rem 3rem; }
    header { display: flex; justify-content: flex-end; padding-bottom: 0.5rem; }
    h1 { font-size: clamp(1.6rem, 4vw, 2.2rem); line-height: 1.2; margin: 0.8rem 0 0.6rem; }
    h1 a { color: inherit; text-decoration: none; }
    main details > summary { cursor: pointer; }
    a { color: #58a6ff; }
    .skip-link { position: absolute; left: -9999px; }
    .skip-link:focus { left: 0; top: 0; padding: 0.5rem 0.8rem; background: #388bfd; color: #fff; }
  </style>
  <!-- Non-critical stylesheets — loaded via media="print" trick so they don't block first paint. -->
  <link rel="preload" as="style" href="/assets/css/style.css" onload="this.onload=null;this.rel='stylesheet'">
  <link rel="stylesheet" href="/assets/css/style.css" media="print" onload="this.media='all'">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" media="print" onload="this.media='all'">
  <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-grotesk@400,500,600,700&display=swap" media="print" onload="this.media='all'">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css" media="print" onload="this.media='all'">
  <noscript>
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">
    <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-grotesk@400,500,600,700&display=swap">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css">
  </noscript>
  <script defer src="/assets/js/vendor/minisearch.js"></script>
  <script defer src="/assets/js/filter.js"></script>
  <script defer src="/assets/js/analytics.js"></script>
</head>
<body data-page-type="catalog">
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <div class="wrapper">
    <header>
      <p class="view"><a href="/graph" style="margin-right:1em">Graph view <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><line x1="7.6" y1="7.5" x2="11" y2="16"/><line x1="16.4" y1="7.5" x2="13" y2="16"/><line x1="8" y1="6" x2="16" y2="6"/></svg></a><a href="https://github.com/devanshutak25/3d-resources">View on GitHub <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/></svg></a></p>
    </header>
    <main id="main-content" tabindex="-1">
      ${html}
    </main>
    <a href="#main-content" class="back-to-top" aria-label="Back to top">
      <i class="mdi mdi-arrow-up" aria-hidden="true"></i>
    </a>
    <script>
      (function(){
        var btn = document.querySelector('.back-to-top');
        if (!btn) return;
        var threshold = 600;
        function onScroll(){
          if (window.scrollY > threshold) btn.classList.add('visible');
          else btn.classList.remove('visible');
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
      })();
    </script>
    <footer class="site-footer">
      <div class="footer-grid">
        <div class="footer-col">
          <strong>3D Resources</strong>
          <p>Curated by <a href="https://devanshutak.xyz">Devanshu Tak</a>.</p>
          <p><small>Last updated ${LAST_UPDATED}</small></p>
        </div>
        <div class="footer-col">
          <strong>Contribute</strong>
          <ul>
            <li><a href="${REPO_URL}/issues/new?template=suggest-resource.yml">Suggest a resource</a></li>
            <li><a href="${REPO_URL}/issues/new?template=report-broken-link.yml">Report a broken link</a></li>
            <li><a href="${REPO_URL}/blob/main/CONTRIBUTING.md">Contributing guide</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <strong>Project</strong>
          <ul>
            <li><a href="${REPO_URL}">GitHub repo</a></li>
            <li><a href="/feed.xml">RSS feed</a></li>
            <li><a href="/llms.txt">llms.txt</a></li>
            <li><a href="https://creativecommons.org/publicdomain/zero/1.0/">License: CC0-1.0</a></li>
          </ul>
        </div>
      </div>
      <p class="footer-badges">
        <a href="${REPO_URL}/stargazers"><img src="https://img.shields.io/github/stars/devanshutak25/3d-resources?style=flat&amp;logo=github&amp;color=24292e" alt="GitHub stars" loading="lazy"></a>
        <a href="${REPO_URL}/actions/workflows/validate.yml"><img src="${REPO_URL}/actions/workflows/validate.yml/badge.svg" alt="Validate CI status" loading="lazy"></a>
      </p>
    </footer>
  </div>
</body>
</html>`;

// --- robots.txt ---
const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

// --- 404 page ---
const notFoundCards = sections
  .map(s => `        <li><a href="/#${s.anchor}"><i class="mdi mdi-${SECTION_ICONS[s.anchor] || 'folder-outline'}" aria-hidden="true"></i> ${s.title}</a></li>`)
  .join('\n');

const notFoundPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#000000">
  <title>404 Not Found · 3D Resources</title>
  <meta name="description" content="That page wasn't found. Browse the curated catalog of 3D resources instead.">
  <meta name="robots" content="noindex, follow">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css">
  <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <div class="wrapper">
    <header>
      <p class="view"><a href="/">← Home</a> · <a href="${REPO_URL}">View on GitHub</a></p>
    </header>
    <main id="main-content" tabindex="-1">
      <h1>404: Page not found</h1>
      <p>That URL didn't resolve to anything in the catalog. Try one of the sections below, or head <a href="/">back home</a> to use the search and filters.</p>
      <h2>Browse the catalog</h2>
      <ul class="not-found-list">
${notFoundCards}
      </ul>
      <p><small>Spotted a broken link inside the catalog? <a href="${REPO_URL}/issues/new?template=report-broken-link.yml">Report it on GitHub</a> and we'll fix it.</small></p>
    </main>
    <footer class="site-footer">
      <p><a href="/">3d.devanshutak.xyz</a> · <a href="${REPO_URL}">GitHub</a></p>
    </footer>
  </div>
</body>
</html>`;

// --- Emit all artifacts ---
fs.mkdirSync('_site', { recursive: true });
fs.cpSync('assets', '_site/assets', { recursive: true });
fs.writeFileSync('_site/index.html', page);
fs.writeFileSync('_site/404.html', notFoundPage);
fs.writeFileSync('_site/robots.txt', robots);
console.log('Built _site/index.html');
console.log('Built _site/404.html');
console.log('Wrote robots.txt');
// sitemap.xml is emitted by scripts/build-sitemap.js (final build step) so it can
// include subsection + tag pages that are generated after this script runs.
