#!/usr/bin/env node
// Build: README.md → _site/index.html with heading IDs + SEO enhancements.
// Also emits _site/sitemap.xml and _site/robots.txt.

const { marked } = require('marked');
const fs = require('fs');
const path = require('path');
const catalog = require('./lib/catalog');

const SITE_URL = 'https://3d.devanshutak.xyz';
const TITLE = '3D Resources: Software, Assets, Tutorials & Tools for 3D Artists';
const DESCRIPTION = 'Curated hub of 1,300+ free and paid 3D resources — textures, HDRIs, models, tutorials, render engines, USD, VFX, and AI/ML. Filter by license and workflow.';

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&amp;/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// --- Load section structure for SEO enumeration ---
function loadSections() {
  const counts = new Map(); // `${sectionFile}::${subSlug}` → count
  for (const { sectionFile, subSlug } of catalog.iterEntries()) {
    const k = `${sectionFile}::${subSlug}`;
    counts.set(k, (counts.get(k) || 0) + 1);
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
const md = fs.readFileSync('README.md', 'utf8');
let html = marked.parse(md);

// Inject IDs on headings
html = html.replace(/<(h[1-6])>(.*?)<\/\1>/g, (m, tag, inner) => {
  const textOnly = inner.replace(/<[^>]+>/g, '');
  const id = slugify(textOnly);
  return `<${tag} id="${id}">${inner}</${tag}>`;
});

// Tag the "Heads up" blockquote with a class for yellow styling
html = html.replace(/<blockquote>\s*<p>(⚠️?\s*<strong>Heads up:<\/strong>[\s\S]*?)<\/p>\s*<\/blockquote>/,
  '<blockquote class="callout-warning"><p>$1</p></blockquote>');

// Remove the "Looking for something specific?" callout from the deployed site.
// (Filter bar at top is the equivalent on the site.)
html = html.replace(/<blockquote>\s*<p><strong>Looking for something specific\?<\/strong>[\s\S]*?<\/p>\s*<\/blockquote>\s*/,
  '');

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
  <meta property="og:image:alt" content="3D Resources — curated hub of 3D software, assets, tutorials, and tools">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${TITLE}">
  <meta name="twitter:description" content="${DESCRIPTION}">
  <meta name="twitter:image" content="${SITE_URL}/assets/og-image.png">
  <meta name="twitter:image:alt" content="3D Resources — curated hub of 3D software, assets, tutorials, and tools">

  <!-- Schema.org / structured data -->
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>

  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&family=PT+Sans:wght@400;700&display=swap">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css">
  <link rel="stylesheet" href="/assets/css/style.css">
  <script defer src="/assets/js/filter.js"></script>
</head>
<body>
  <div class="wrapper">
    <header>
      <p class="view"><a href="https://github.com/devanshutak25/3d-resources">View on GitHub <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/></svg></a></p>
    </header>
    <main>
      ${html}
    </main>
    <footer>
      <p><small><a href="https://devanshutak.xyz">devanshutak.xyz</a></small></p>
    </footer>
  </div>
</body>
</html>`;

// --- Sitemap ---
const today = new Date().toISOString().slice(0, 10);
const sitemapUrls = [
  { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'weekly' },
  ...sections.map(s => ({ loc: `${SITE_URL}/#${s.anchor}`, priority: '0.8', changefreq: 'weekly' })),
  ...sections.flatMap(s => s.subsections.map(ss => ({
    loc: `${SITE_URL}/#${ss.anchor}`,
    priority: '0.6',
    changefreq: 'weekly'
  })))
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

// --- robots.txt ---
const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

// --- Emit all artifacts ---
fs.mkdirSync('_site', { recursive: true });
fs.cpSync('assets', '_site/assets', { recursive: true });
fs.writeFileSync('_site/index.html', page);
fs.writeFileSync('_site/sitemap.xml', sitemap);
fs.writeFileSync('_site/robots.txt', robots);
console.log('Built _site/index.html');
console.log(`Wrote sitemap.xml (${sitemapUrls.length} URLs)`);
console.log('Wrote robots.txt');
