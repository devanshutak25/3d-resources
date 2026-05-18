#!/usr/bin/env node
// Generate per-section HTML pages at /sections/<slug>/index.html.
// Each section page is independently indexable by Google + lets sitemap.xml
// point at real URLs (the root index.html still keeps the full single-page
// catalog as the canonical experience).
//
// Pipeline mirrors build-html.js: spawn render.js with the section file →
// marked → heading ID injection → external-link hygiene → wrap in a
// section-scoped template with per-section JSON-LD (ItemList + Breadcrumb).

const { marked } = require('marked');
const fs = require('fs');
const path = require('path');
const { execFileSync, execSync } = require('child_process');
const catalog = require('./lib/catalog');

const SITE_URL = 'https://3d.devanshutak.xyz';
const REPO_URL = 'https://github.com/devanshutak25/3d-resources';

function lastUpdatedDate() {
  try {
    return execSync('git log -1 --format=%cs HEAD', { encoding: 'utf8' }).trim()
      || new Date().toISOString().slice(0, 10);
  } catch (_) { return new Date().toISOString().slice(0, 10); }
}

// GitHub-style anchor slugify (must match build-html.js for cross-page anchors to work).
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&amp;/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s/g, '-');
}

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

// Render the section's markdown via render.js (re-uses all the existing
// renderSection logic — software tables, references, mirror blocks, etc.).
function renderSectionMarkdown(sectionFile) {
  return execFileSync('node', ['scripts/render.js', sectionFile], {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  });
}

// Post-process passes lifted from build-html.js (kept in sync deliberately;
// extract to a shared helper if these diverge further).
function postProcessHtml(html, anchor, sectionFile) {
  // Heading IDs + tabindex + icon on the H2.
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

  // Edit-on-GitHub link on the section H2.
  const ghUrl = `${REPO_URL}/blob/main/data/${sectionFile}`;
  const editLink = `<a class="edit-on-gh" href="${ghUrl}" target="_blank" rel="noopener noreferrer" aria-label="Edit this section on GitHub"><i class="mdi mdi-pencil-outline" aria-hidden="true"></i><span>Edit</span></a>`;
  html = html.replace(new RegExp(`<h2 id="${anchor}"([^>]*)>([\\s\\S]*?)</h2>`), (m, attrs, inner) => {
    return `<h2 id="${anchor}"${attrs}>${inner}${editLink}</h2>`;
  });

  // External link hygiene.
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

  return html;
}

// Build ItemList JSON-LD for the section — Google uses this for rich results.
function buildItemListJsonLd(section, entries, canonicalUrl) {
  const items = entries.slice(0, 100).map((e, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: e.name,
    url: e.url
  }));
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: section.title, item: canonicalUrl }
        ]
      },
      {
        '@type': 'CollectionPage',
        '@id': canonicalUrl,
        url: canonicalUrl,
        name: `${section.title} · 3D Resources`,
        description: section.description || '',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        inLanguage: 'en'
      },
      {
        '@type': 'ItemList',
        name: section.title,
        numberOfItems: entries.length,
        itemListElement: items
      }
    ]
  };
}

// Collect non-deprecated entries for a section (chunk-iteration order).
function entriesFor(sectionFile) {
  const out = [];
  const seen = new Set();
  for (const chunk of catalog.iterChunks()) {
    if (chunk.sectionFile !== sectionFile) continue;
    for (const e of chunk.entries) {
      if (e.deprecated) continue;
      if (!e.url || !e.name) continue;
      const k = e.url.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(e);
    }
  }
  return out;
}

function renderPage({ section, htmlBody, prev, next, jsonLd, lastUpdated }) {
  const canonicalUrl = `${SITE_URL}/sections/${section.slug}/`;
  const pageTitle = `${section.title} · 3D Resources`;
  const desc = section.description || `Curated 3D resources for ${section.title}.`;

  const prevLink = prev
    ? `<a class="section-nav-prev" href="/sections/${prev.slug}/">← ${prev.title}</a>`
    : '<span></span>';
  const nextLink = next
    ? `<a class="section-nav-next" href="/sections/${next.slug}/">${next.title} →</a>`
    : '<span></span>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#000000">
  <title>${pageTitle}</title>
  <meta name="description" content="${desc}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="author" content="Devanshu Tak">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="alternate" type="application/atom+xml" title="3D Resources: latest additions" href="/feed.xml">

  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${SITE_URL}/assets/og/${section.slug}.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${pageTitle}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${SITE_URL}/assets/og/${section.slug}.png">

  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>

  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <style>
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; line-height: 1.55; background: #0d1117; color: #e6edf3; }
    .wrapper { max-width: 1100px; margin: 0 auto; padding: 1.25rem 1.25rem 3rem; }
    header { display: flex; justify-content: space-between; padding-bottom: 0.5rem; align-items: center; gap: 1rem; }
    h1 { font-size: clamp(1.6rem, 4vw, 2.2rem); line-height: 1.2; margin: 0.8rem 0 0.6rem; }
    a { color: #58a6ff; }
    .skip-link { position: absolute; left: -9999px; }
    .skip-link:focus { left: 0; top: 0; padding: 0.5rem 0.8rem; background: #388bfd; color: #fff; }
  </style>
  <link rel="preload" as="style" href="/assets/css/style.css" onload="this.onload=null;this.rel='stylesheet'">
  <link rel="stylesheet" href="/assets/css/style.css" media="print" onload="this.media='all'">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" media="print" onload="this.media='all'">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css" media="print" onload="this.media='all'">
  <noscript>
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css">
  </noscript>
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <div class="wrapper">
    <header>
      <p class="view"><a href="/">← All sections</a></p>
      <p class="view"><a href="${REPO_URL}">View on GitHub</a></p>
    </header>
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">3D Resources</a> / <span>${section.title}</span></nav>
    <main id="main-content" tabindex="-1">
      ${htmlBody}
    </main>
    <nav class="section-nav" aria-label="Section navigation">
      ${prevLink}
      ${nextLink}
    </nav>
    <a href="#main-content" class="back-to-top" aria-label="Back to top">
      <i class="mdi mdi-arrow-up" aria-hidden="true"></i>
    </a>
    <footer class="site-footer">
      <p><a href="/">3d.devanshutak.xyz</a> · <a href="${REPO_URL}">GitHub</a> · <small>Last updated ${lastUpdated}</small></p>
    </footer>
    <script>
      (function(){
        var btn = document.querySelector('.back-to-top');
        if (!btn) return;
        function onScroll(){
          if (window.scrollY > 600) btn.classList.add('visible');
          else btn.classList.remove('visible');
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
      })();
    </script>
  </div>
</body>
</html>`;
}

function main() {
  const lastUpdated = lastUpdatedDate();
  const sections = catalog.loadSections().sections;
  const outRoot = path.join(__dirname, '..', '_site', 'sections');
  fs.mkdirSync(outRoot, { recursive: true });

  for (let i = 0; i < sections.length; i++) {
    const meta = sections[i];
    const sectionPath = path.join(catalog.DATA_DIR, meta.file);
    if (!fs.existsSync(sectionPath)) continue;
    const sectionDoc = catalog.loadSection(meta.file);

    const md = renderSectionMarkdown(meta.file);
    let html = marked.parse(md);
    const anchor = slugify(sectionDoc.title);
    html = postProcessHtml(html, anchor, meta.file);

    const canonical = `${SITE_URL}/sections/${meta.slug}/`;
    const entries = entriesFor(meta.file);
    const jsonLd = buildItemListJsonLd(sectionDoc, entries, canonical);

    const prev = i > 0 ? sections[i - 1] : null;
    const next = i < sections.length - 1 ? sections[i + 1] : null;

    const page = renderPage({
      section: { ...sectionDoc, slug: meta.slug, title: sectionDoc.title, description: meta.description },
      htmlBody: html,
      prev: prev ? { slug: prev.slug, title: prev.title } : null,
      next: next ? { slug: next.slug, title: next.title } : null,
      jsonLd,
      lastUpdated
    });

    const dir = path.join(outRoot, meta.slug);
    fs.mkdirSync(dir, { recursive: true });
    const outPath = path.join(dir, 'index.html');
    fs.writeFileSync(outPath, page);
    const sizeKB = (Buffer.byteLength(page, 'utf8') / 1024).toFixed(1);
    console.log(`Wrote /sections/${meta.slug}/ (${sizeKB} KB, ${entries.length} entries)`);
  }
}

main();
